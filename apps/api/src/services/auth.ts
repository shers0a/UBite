/* Email codes to any UB address, unibuc.ro or one of its subdomains (docs/10, D-16, D-28). No
   password exists, so none can be stolen.
   Sessions are a table of their own, keyed on the user, so SSO can be added as a second way in
   without touching them. */
import crypto from 'node:crypto';
import type { Lang, Role } from '@ubite/shared';
import { isUbEmail, UB_DOMAIN } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import type { Queryable } from '../db/index';
import { codeEmail } from './mail';

export const CODE_TTL_SECONDS = 600;
export const SESSION_DAYS = 180;
const MAX_ATTEMPTS = 5;
const MAX_CODES_PER_WINDOW = 3;

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

  const recent = await ctx.db.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM auth_codes WHERE email = $1 AND created_at > $2::timestamptz - interval '15 minutes'",
    [email, ctx.now()],
  );
  if (recent.rows[0].n >= MAX_CODES_PER_WINDOW) throw new HttpError(429, 'too_many_codes', 'Too many codes. Try again in 15 minutes.', { retryAfterSeconds: 900 });

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await ctx.db.query(
    `INSERT INTO auth_codes (email, code_hash, created_at, expires_at) VALUES ($1, $2, $3, $3::timestamptz + make_interval(secs => $4))`,
    [email, sha256(`${ctx.cfg.SESSION_SECRET}|${email}|${code}`), ctx.now(), CODE_TTL_SECONDS],
  );
  if (ctx.cfg.DEMO_SHOW_CODES && !ctx.cfg.SMTP_URL) {
    return { sent: true as const, expiresIn: CODE_TTL_SECONDS, demoCode: code };
  }
  const mail = codeEmail(code, lang);
  await ctx.mail.send(email, mail.subject, mail.text);
  return { sent: true as const, expiresIn: CODE_TTL_SECONDS };
}

/** Wrong codes are throttled with an increasing delay: 0, 2, 4, 8, 16 seconds, then locked. */
export async function verifyCode(ctx: Ctx, rawEmail: string, code: string, lang: Lang): Promise<SessionUser> {
  const email = normaliseEmail(rawEmail);
  const now = ctx.now();
  const r = await ctx.db.query<{ id: number; code_hash: string; attempts: number; last_attempt_at: Date | null }>(
    `SELECT id, code_hash, attempts, last_attempt_at FROM auth_codes
     WHERE email = $1 AND consumed_at IS NULL AND expires_at > $2 ORDER BY created_at DESC LIMIT 1`, [email, now],
  );
  const row = r.rows[0];
  if (!row) throw new HttpError(422, 'code_expired', 'Ask for a new code.');
  if (row.attempts >= MAX_ATTEMPTS) throw new HttpError(429, 'code_locked', 'Too many attempts. Ask for a new code.');
  if (row.attempts > 0 && row.last_attempt_at) {
    const wait = 2 ** row.attempts * 1000 - (now.getTime() - row.last_attempt_at.getTime());
    if (wait > 0) throw new HttpError(429, 'slow_down', 'Wait a moment before trying again.', { retryAfterSeconds: Math.ceil(wait / 1000) });
  }
  const expected = Buffer.from(row.code_hash, 'hex');
  const given = Buffer.from(sha256(`${ctx.cfg.SESSION_SECRET}|${email}|${String(code).trim()}`), 'hex');
  if (!crypto.timingSafeEqual(expected, given)) {
    await ctx.db.query('UPDATE auth_codes SET attempts = attempts + 1, last_attempt_at = $2 WHERE id = $1', [row.id, now]);
    throw new HttpError(422, 'code_wrong', 'The code is not right.');
  }
  await ctx.db.query('UPDATE auth_codes SET consumed_at = $2 WHERE id = $1', [row.id, now]);

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
    await q.query(
      `INSERT INTO retired_receipt_hashes (receipt_hash)
       SELECT receipt_hash FROM visits WHERE user_id = $1 AND receipt_hash IS NOT NULL ON CONFLICT DO NOTHING`, [userId],
    );
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
