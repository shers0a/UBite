/* Email codes to any UB address, unibuc.ro or one of its subdomains (docs/10, D-16, D-28). No
   password exists, so none can be stolen.
   Sessions are a table of their own, keyed on the user, so SSO can be added as a second way in
   without touching them. */
import crypto from 'node:crypto';
import type { Lang, Role } from '@ubite/shared';
import { addDays, isUbEmail, localDate, UB_DOMAIN, zonedToUtc } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import type { Queryable } from '../db/index';
import { alert, bump, count, unbump } from './alerts';
import { claimEvery, claimRun } from './config-store';
import { retireReceipts } from './loyalty';
import { codeEmail } from './mail';

export const CODE_TTL_SECONDS = 600;
export const SESSION_DAYS = 180;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_WINDOW = 3;
/** Wrong codes one address may send in a (Bucharest) day, across all its codes. Five per code
 *  and three codes every 15 minutes would otherwise allow ~1,400 guesses a day at one address. */
export const MAX_FAILED_PER_DAY = 10;

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  locale: Lang;
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

/** The daily counter of an address's wrong codes: a hash, never the address. */
const failedKey = (email: string) => `signin-failed:${sha256(`signin|${email}`).slice(0, 32)}`;

/** "a***@s.unibuc.ro": enough for whoever reads an alert to recognise it, no more. */
const masked = (email: string) => email.replace(/^(.)[^@]*/, '$1***');

/** Until midnight in Bucharest, when the daily counts start again. */
function secondsToMidnight(ctx: Ctx) {
  const now = ctx.now();
  const midnight = zonedToUtc(addDays(localDate(now), 1), '00:00');
  return Math.max(60, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

function lockedForToday(ctx: Ctx) {
  return new HttpError(429, 'signin_locked', 'Too many wrong codes today. Try again tomorrow.', { retryAfterSeconds: secondsToMidnight(ctx) });
}

const EMAILS_KEY = 'signin-emails';

/** A place among today's sign-in emails (SIGNIN_EMAILS_PER_DAY, below the provider's free daily
 *  quota: Brevo sends 300, and the alerts need some of them). An alert at 80 % and at the cap;
 *  past it, a clear refusal instead of codes the provider would silently drop. */
async function takeEmailPlace(ctx: Ctx) {
  const today = localDate(ctx.now());
  const cap = ctx.cfg.SIGNIN_EMAILS_PER_DAY;
  const n = await bump(ctx.db, today, EMAILS_KEY, cap);
  if (n === null) {
    if (await claimRun(ctx.db, `alert:mail-cap:${today}`)) {
      await alert(ctx, 'Limita zilnică de emailuri de intrare e atinsă',
        `Azi s-au trimis ${cap} emailuri cu cod de intrare (SIGNIN_EMAILS_PER_DAY). Până la miezul nopții nimeni nu mai primește cod; cine e deja în cont nu e afectat.`);
    }
    throw new HttpError(503, 'mail_quota', 'No more sign-in emails can go out today. Try again tomorrow.', { retryAfterSeconds: secondsToMidnight(ctx) });
  }
  if (n === Math.ceil(cap * 0.8)) {
    await alert(ctx, 'Emailurile de intrare de azi sunt pe sfârșite',
      `${n} din ${cap} emailuri cu cod de intrare trimise azi (80 %). La ${cap}, UBite nu mai trimite coduri până la miezul nopții.`);
  }
}

async function lockedToday(ctx: Ctx, email: string) {
  return (await count(ctx.db, localDate(ctx.now()), failedKey(email))) >= MAX_FAILED_PER_DAY;
}

/** Anyone at UB by domain; outside addresses (staff, DCCAS, the developers) only when an admin
 *  created the account. */
export async function canSignIn(db: Queryable, email: string): Promise<boolean> {
  if (isUbEmail(email)) return true;
  const r = await db.query("SELECT 1 FROM users WHERE email = $1 AND role <> 'student' AND deleted_at IS NULL", [email]);
  return r.rowCount > 0;
}

export async function requestCode(ctx: Ctx, rawEmail: string, lang: Lang) {
  const email = normaliseEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(422, 'invalid_email');
  if (!(await canSignIn(ctx.db, email))) throw new HttpError(422, 'email_domain', `Use your university address, ending in ${UB_DOMAIN}.`);
  if (!ctx.mail.enabled) throw new HttpError(503, 'mail_unavailable', 'Sign-in email is not configured.');
  // Locked by wrong codes: no new code until tomorrow either, so none is emailed for nothing.
  if (await lockedToday(ctx, email)) throw lockedForToday(ctx);

  const recent = await ctx.db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM auth_codes WHERE email = $1 AND created_at > $2::timestamptz - interval '15 minutes'",
    [email, ctx.now()],
  );
  if (recent.rows[0].n >= MAX_CODES_PER_WINDOW) throw new HttpError(429, 'too_many_codes', 'Too many codes. Try again in 15 minutes.', { retryAfterSeconds: 900 });

  const demo = ctx.cfg.DEMO_SHOW_CODES && !ctx.cfg.SMTP_URL;
  if (!demo) await takeEmailPlace(ctx);

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const row = await ctx.db.query<{ id: number }>(
    `INSERT INTO auth_codes (email, code_hash, created_at, expires_at) VALUES ($1, $2, $3, $3::timestamptz + make_interval(secs => $4))
     RETURNING id`,
    [email, sha256(`${ctx.cfg.SESSION_SECRET}|${email}|${code}`), ctx.now(), CODE_TTL_SECONDS],
  );
  if (demo) return { sent: true as const, expiresIn: CODE_TTL_SECONDS, demoCode: code };
  const mail = codeEmail(code, lang);
  try {
    await ctx.mail.send(email, mail.subject, mail.text);
  } catch (e) {
    await mailFailed(ctx, row.rows[0].id, e);
  }
  return { sent: true as const, expiresIn: CODE_TTL_SECONDS };
}

/** The provider refused or could not be reached (its quota, an SMTP error, the network): the
 *  code never left, so it is not one of the address's three, nor one of today's emails. The
 *  student is told to try again shortly; the team hears once an hour at most. */
async function mailFailed(ctx: Ctx, codeId: number, e: unknown): Promise<never> {
  const err = e as { message?: string; code?: string; responseCode?: number };
  ctx.log.error({ err: err?.message, code: err?.code, responseCode: err?.responseCode }, 'sign-in email failed');
  await ctx.db.query('DELETE FROM auth_codes WHERE id = $1', [codeId]).catch(() => {});
  await unbump(ctx.db, localDate(ctx.now()), EMAILS_KEY).catch(() => {});
  if (await claimEvery(ctx.db, 'alert:mail-failed', ctx.now(), 3600).catch(() => false)) {
    await alert(ctx, 'Emailurile de intrare nu pleacă',
      `Furnizorul de email a refuzat un cod de intrare: ${err?.responseCode ?? err?.code ?? ''} ${err?.message ?? ''}`.trim()
      + '. Studenții văd „încearcă din nou peste câteva minute”. Verifică SMTP_URL și cota Brevo.');
  }
  throw new HttpError(503, 'mail_failed', 'Sign-in emails are not going out right now. Try again in a few minutes.', { retryAfterSeconds: 120 });
}

type CodeRow = { id: number; code_hash: string; attempts: number; last_attempt_at: Date | null; consumed_at: Date | null };

function tooSoon(row: CodeRow, now: Date): HttpError {
  if (row.consumed_at) return new HttpError(422, 'code_expired', 'Ask for a new code.');
  if (row.attempts >= MAX_ATTEMPTS) return new HttpError(429, 'code_locked', 'Too many attempts. Ask for a new code.');
  const wait = row.last_attempt_at ? 2 ** row.attempts * 1000 - (now.getTime() - row.last_attempt_at.getTime()) : 1000;
  return new HttpError(429, 'slow_down', 'Wait a moment before trying again.', { retryAfterSeconds: Math.max(1, Math.ceil(wait / 1000)) });
}

/** Wrong codes are throttled with an increasing delay: 0, 2, 4, 8, 16 seconds, then the code is
 *  burnt; and after MAX_FAILED_PER_DAY wrong codes in a day the address is locked until midnight.
 *  Each try is claimed in the database before the code is compared, so guesses sent in parallel
 *  cannot all slip past the count. */
export async function verifyCode(ctx: Ctx, rawEmail: string, code: string, lang: Lang): Promise<SessionUser> {
  const email = normaliseEmail(rawEmail);
  const now = ctx.now();
  const today = localDate(now);
  if (await lockedToday(ctx, email)) throw lockedForToday(ctx);
  const r = await ctx.db.query<CodeRow>(
    `SELECT id, code_hash, attempts, last_attempt_at, consumed_at FROM auth_codes
     WHERE email = $1 AND consumed_at IS NULL AND expires_at > $2 ORDER BY created_at DESC LIMIT 1`, [email, now],
  );
  const row = r.rows[0];
  if (!row) throw new HttpError(422, 'code_expired', 'Ask for a new code.');
  // Take this try: one more attempt, only while the code has tries left and its back-off is over.
  const claimed = await ctx.db.query(
    `UPDATE auth_codes SET attempts = attempts + 1, last_attempt_at = $2
     WHERE id = $1 AND consumed_at IS NULL AND attempts < $3
       AND (attempts = 0 OR last_attempt_at IS NULL OR last_attempt_at <= $2::timestamptz - make_interval(secs => power(2, attempts)))
     RETURNING id`, [row.id, now, MAX_ATTEMPTS],
  );
  if (!claimed.rowCount) {
    const fresh = await ctx.db.query<CodeRow>('SELECT id, code_hash, attempts, last_attempt_at, consumed_at FROM auth_codes WHERE id = $1', [row.id]);
    throw tooSoon(fresh.rows[0] ?? row, now);
  }
  // And a place among today's wrong codes, given back if this one is right.
  const key = failedKey(email);
  const failures = await bump(ctx.db, today, key, MAX_FAILED_PER_DAY);
  if (failures === null) throw lockedForToday(ctx);
  const expected = Buffer.from(row.code_hash, 'hex');
  const given = Buffer.from(sha256(`${ctx.cfg.SESSION_SECRET}|${email}|${String(code).trim()}`), 'hex');
  if (!crypto.timingSafeEqual(expected, given)) {
    if (failures >= MAX_FAILED_PER_DAY) {
      await alert(ctx, 'Prea multe coduri greșite pentru o adresă',
        `${MAX_FAILED_PER_DAY} coduri de intrare greșite azi pentru ${masked(email)}. Adresa nu mai primește și nu mai poate folosi coduri până mâine. Poate fi cineva care încearcă să ghicească un cod.`);
      throw lockedForToday(ctx);
    }
    throw new HttpError(422, 'code_wrong', 'The code is not right.');
  }
  await unbump(ctx.db, today, key);
  const used = await ctx.db.query('UPDATE auth_codes SET consumed_at = $2 WHERE id = $1 AND consumed_at IS NULL RETURNING id', [row.id, now]);
  if (!used.rowCount) throw new HttpError(422, 'code_expired', 'Ask for a new code.');

  const user = await ctx.db.tx(async (q) => {
    const existing = await q.query<SessionUser>(
      'SELECT id, email::text AS email, role::text AS role, locale::text AS locale FROM users WHERE email = $1 AND deleted_at IS NULL', [email],
    );
    if (existing.rows[0]) return existing.rows[0];
    const created = await q.query<SessionUser>(
      `INSERT INTO users (email, role, locale) VALUES ($1, 'student', $2)
       RETURNING id, email::text AS email, role::text AS role, locale::text AS locale`, [email, lang],
    );
    return created.rows[0];
  });
  await ctx.db.query('INSERT INTO notification_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
  return user;
}

export async function createSession(db: Queryable, userId: string, now: Date): Promise<{ token: string; expires: Date }> {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db.query('INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at) VALUES ($1, $2, $3, $4, $3)', [sha256(token), userId, now, expires]);
  return { token, expires };
}

export async function sessionUser(db: Queryable, token: string, now: Date): Promise<SessionUser | null> {
  if (!token || token.length > 100) return null;
  const id = sha256(token);
  const r = await db.query<SessionUser & { last_seen_at: Date }>(
    `SELECT u.id, u.email::text AS email, u.role::text AS role, u.locale::text AS locale, s.last_seen_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > $2 AND u.deleted_at IS NULL`, [id, now],
  );
  const row = r.rows[0];
  if (!row) return null;
  // Long-lived and sliding: a student should never re-authenticate to check a menu.
  if (now.getTime() - row.last_seen_at.getTime() > 86_400_000) {
    await db.query(
      'UPDATE sessions SET last_seen_at = $2, expires_at = $2::timestamptz + make_interval(days => $3) WHERE id = $1',
      [id, now, SESSION_DAYS],
    );
  }
  return { id: row.id, email: row.email, role: row.role, locale: row.locale };
}

export async function endSession(db: Queryable, token: string) {
  await db.query('DELETE FROM sessions WHERE id = $1', [sha256(token)]);
}

/** docs/10 "Account deletion": soft delete and release the email; ratings and feedback stay
 *  but detach; the loyalty ledger goes; receipt hashes stay, anonymously, against duplicates. */
export async function eraseAccount(ctx: Ctx, userId: string) {
  await ctx.db.tx(async (q) => {
    await retireReceipts(q, userId);
    await q.query('DELETE FROM visits WHERE user_id = $1', [userId]);
    await q.query('DELETE FROM loyalty_rewards WHERE user_id = $1', [userId]);
    await q.query('DELETE FROM favorites WHERE user_id = $1', [userId]);
    await q.query('DELETE FROM push_subscriptions WHERE user_id = $1', [userId]);
    await q.query('DELETE FROM notification_prefs WHERE user_id = $1', [userId]);
    await q.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await q.query('UPDATE feedback SET user_id = NULL WHERE user_id = $1', [userId]);
    await q.query('UPDATE wait_reports SET user_id = NULL WHERE user_id = $1', [userId]);
    // Ratings keep their row (the key needs a user) but the user row keeps nothing personal.
    await q.query(
      'UPDATE users SET email = NULL, display_name = NULL, diet_preference = NULL, deleted_at = $2 WHERE id = $1',
      [userId, ctx.now()],
    );
  });
}
