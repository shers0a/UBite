/* Sign-in and everything that needs an account (docs/10): profile, preferences, notifications,
   favourites, ratings, loyalty, visits, history, erasure. */
import { Router } from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import type { HistoryResponse, Me, ReceiptDraft } from '@ubite/shared';
import { DIET_TAGS, localDate } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { SESSION_COOKIE, langOf, limits, parse, requireRole } from '../http';
import { createSession, endSession, eraseAccount, requestCode, verifyCode } from '../services/auth';
import { checkReceiptWindow, loyaltyState, recordVisit } from '../services/loyalty';
import { matchFiscalCode, parseReceipt, receiptIdentity } from '../services/receipt';
import { getCrowdingConfig } from '../services/config-store';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp|heic|heif)$/.test(file.mimetype)),
});

export async function loadMe(ctx: Ctx, userId: string): Promise<Me> {
  const u = await ctx.db.query<{ id: string; email: string; role: Me['role']; locale: Me['locale']; diet_preference: string[] | null; display_name: string | null }>(
    'SELECT id, email::text AS email, role::text AS role, locale::text AS locale, diet_preference, display_name FROM users WHERE id = $1', [userId],
  );
  const user = u.rows[0];
  if (!user) throw new HttpError(401, 'sign_in_required');
  const [fav, prefs, push, report] = await Promise.all([
    ctx.db.query<{ dish_id: string }>('SELECT dish_id FROM favorites WHERE user_id = $1', [userId]),
    ctx.db.query<{ menu_published: boolean; favorite_today: boolean; quiet_now: boolean; one_from_free: boolean; window_start: string; window_end: string }>(
      'SELECT menu_published, favorite_today, quiet_now, one_from_free, window_start::text, window_end::text FROM notification_prefs WHERE user_id = $1', [userId],
    ),
    ctx.db.query<{ n: number }>('SELECT count(*)::int AS n FROM push_subscriptions WHERE user_id = $1', [userId]),
    ctx.db.query<{ at: Date | null }>('SELECT max(reported_at) AS at FROM wait_reports WHERE user_id = $1 AND accepted', [userId]),
  ]);
  const p = prefs.rows[0];
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    locale: user.locale,
    dietPreference: (user.diet_preference || []).filter((t) => (DIET_TAGS as string[]).includes(t)) as Me['dietPreference'],
    displayName: user.display_name,
    favorites: fav.rows.map((f) => f.dish_id),
    notifications: {
      menu_published: p?.menu_published ?? true,
      favorite_today: p?.favorite_today ?? true,
      quiet_now: p?.quiet_now ?? false,
      one_from_free: p?.one_from_free ?? true,
      windowStart: (p?.window_start ?? '11:30').slice(0, 5),
      windowEnd: (p?.window_end ?? '14:00').slice(0, 5),
    },
    pushSubscribed: push.rows[0].n > 0,
    lastReportAt: report.rows[0]?.at ? report.rows[0].at.toISOString() : null,
  };
}

function signDraft(ctx: Ctx, payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', ctx.cfg.SESSION_SECRET).update(`draft|${body}`).digest('base64url');
  return `${body}.${mac}`;
}

function readDraft(ctx: Ctx, token: string): any {
  const [body, mac] = token.split('.');
  const expected = crypto.createHmac('sha256', ctx.cfg.SESSION_SECRET).update(`draft|${body}`).digest('base64url');
  if (!body || !mac || mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    throw new HttpError(422, 'invalid_draft');
  }
  const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (data.exp < ctx.now().getTime()) throw new HttpError(422, 'draft_expired', 'Take the photo again.');
  return data;
}

export function accountRoutes(ctx: Ctx) {
  const r = Router();
  const secure = ctx.cfg.PUBLIC_URL.startsWith('https://');
  const student = requireRole('student');
  const loyaltyOn = (_req: any, _res: any, next: any) => (ctx.cfg.FEATURE_LOYALTY ? next() : next(new HttpError(404, 'feature_off')));

  /* ── Auth ── */
  r.post('/auth/request-code', limits.auth, async (req, res) => {
    const body = parse(z.object({ email: z.string().max(200) }), req.body);
    res.json(await requestCode(ctx, body.email, langOf(req)));
  });

  r.post('/auth/verify', limits.auth, async (req, res) => {
    const body = parse(z.object({ email: z.string().max(200), code: z.string().regex(/^\d{6}$/) }), req.body);
    const user = await verifyCode(ctx, body.email, body.code, langOf(req));
    const session = await createSession(ctx.db, user.id, ctx.now());
    res.cookie(SESSION_COOKIE, session.token, {
      httpOnly: true, secure, sameSite: 'lax', path: '/', expires: session.expires,
    });
    res.json(await loadMe(ctx, user.id));
  });

  r.post('/auth/logout', async (req, res) => {
    if (req.sessionToken) await endSession(ctx.db, req.sessionToken);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  });

  /* ── Profile ── */
  r.get('/me', requireRole('student', 'canteen_staff', 'dccas_admin'), async (req, res) => {
    res.set('Cache-Control', 'private, no-store').json(await loadMe(ctx, req.user!.id));
  });

  r.patch('/me', requireRole('student', 'canteen_staff', 'dccas_admin'), async (req, res) => {
    const body = parse(z.object({
      locale: z.enum(['ro', 'en']).optional(),
      dietPreference: z.array(z.enum(DIET_TAGS as [string, ...string[]])).max(6).optional(),
      displayName: z.string().max(60).nullable().optional(),
    }), req.body);
    await ctx.db.query(
      `UPDATE users SET locale = COALESCE($2, locale),
         diet_preference = CASE WHEN $3::boolean THEN $4::text[] ELSE diet_preference END,
         display_name = CASE WHEN $5::boolean THEN $6 ELSE display_name END
       WHERE id = $1`,
      [req.user!.id, body.locale ?? null, body.dietPreference !== undefined, body.dietPreference ?? null,
        body.displayName !== undefined, body.displayName?.trim() || null],
    );
    res.json(await loadMe(ctx, req.user!.id));
  });

  r.delete('/me', student, async (req, res) => {
    await eraseAccount(ctx, req.user!.id);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  });

  r.put('/me/notifications', student, async (req, res) => {
    const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
    const body = parse(z.object({
      menu_published: z.boolean(), favorite_today: z.boolean(), quiet_now: z.boolean(), one_from_free: z.boolean(),
      windowStart: time, windowEnd: time,
    }).refine((b) => b.windowStart < b.windowEnd, { message: 'window end must follow its start' }), req.body);
    await ctx.db.query(
      `INSERT INTO notification_prefs (user_id, menu_published, favorite_today, quiet_now, one_from_free, window_start, window_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET menu_published = $2, favorite_today = $3, quiet_now = $4, one_from_free = $5,
         window_start = $6, window_end = $7`,
      [req.user!.id, body.menu_published, body.favorite_today, body.quiet_now, body.one_from_free, body.windowStart, body.windowEnd],
    );
    res.json(await loadMe(ctx, req.user!.id));
  });

  r.post('/me/push', student, async (req, res) => {
    const body = parse(z.object({
      endpoint: z.string().url().max(1000),
      keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
    }), req.body);
    await ctx.db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4`,
      [req.user!.id, body.endpoint, body.keys.p256dh, body.keys.auth],
    );
    res.status(201).json({ ok: true });
  });

  // "Send me a test": proves the whole chain on this phone — permission, subscription, VAPID,
  // the push service, the service worker. Rate-limited like feedback.
  r.post('/me/push/test', student, limits.feedback, async (req, res) => {
    if (!ctx.push.enabled) throw new HttpError(503, 'push_off', 'Push is not configured on the server.');
    const reached = await ctx.push.sendToUsers(ctx.db, [req.user!.id], (locale) => (locale === 'en'
      ? { title: 'UBite', body: 'Notifications work on this phone.', url: '/account#notifications', tag: 'test' }
      : { title: 'UBite', body: 'Notificările merg pe acest telefon.', url: '/account#notifications', tag: 'test' }));
    res.json({ reached });
  });

  r.delete('/me/push', student, async (req, res) => {
    const body = parse(z.object({ endpoint: z.string().max(1000).optional() }), req.body || {});
    if (body.endpoint) await ctx.db.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [req.user!.id, body.endpoint]);
    else await ctx.db.query('DELETE FROM push_subscriptions WHERE user_id = $1', [req.user!.id]);
    res.status(204).end();
  });

  /* ── Favourites and ratings (F10, F12) ── */
  r.put('/me/favorites/:dishId', student, async (req, res) => {
    const dishId = parse(z.string().uuid(), req.params.dishId);
    const body = parse(z.object({ favorite: z.boolean().optional() }), req.body || {});
    const exists = (await ctx.db.query('SELECT 1 FROM favorites WHERE user_id = $1 AND dish_id = $2', [req.user!.id, dishId])).rowCount > 0;
    const want = body.favorite ?? !exists;
    if (want && !exists) {
      const d = await ctx.db.query('SELECT 1 FROM dishes WHERE id = $1', [dishId]);
      if (!d.rowCount) throw new HttpError(404, 'not_found');
      await ctx.db.query('INSERT INTO favorites (user_id, dish_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user!.id, dishId]);
    } else if (!want && exists) {
      await ctx.db.query('DELETE FROM favorites WHERE user_id = $1 AND dish_id = $2', [req.user!.id, dishId]);
    }
    res.json({ favorite: want });
  });

  r.put('/dishes/:id/rating', student, async (req, res) => {
    const dishId = parse(z.string().uuid(), req.params.id);
    const body = parse(z.object({ stars: z.number().int().min(1).max(5) }), req.body);
    const d = await ctx.db.query('SELECT 1 FROM dishes WHERE id = $1', [dishId]);
    if (!d.rowCount) throw new HttpError(404, 'not_found');
    await ctx.db.query(
      `INSERT INTO ratings (user_id, dish_id, stars, created_at) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, dish_id) DO UPDATE SET stars = EXCLUDED.stars, created_at = EXCLUDED.created_at`,
      [req.user!.id, dishId, body.stars, ctx.now()],
    );
    const agg = await ctx.db.query<{ average: number; count: number }>(
      'SELECT avg(stars)::float8 AS average, count(*)::int AS count FROM ratings WHERE dish_id = $1', [dishId],
    );
    res.json({ stars: body.stars, rating: { average: Math.round(agg.rows[0].average * 10) / 10, count: agg.rows[0].count } });
  });

  /* ── Loyalty (F4, docs/09) ── */
  r.get('/me/loyalty', student, loyaltyOn, async (req, res) => {
    res.set('Cache-Control', 'private, no-store').json(await loyaltyState(ctx.db, req.user!.id, localDate(ctx.now())));
  });

  r.post('/me/visits/scan', student, loyaltyOn, limits.upload, upload.single('receipt'), async (req, res) => {
    if (!req.file) throw new HttpError(422, 'no_image', 'Attach a photo of the receipt.');
    const text = await ctx.receipts.read(req.file.buffer);
    req.file.buffer = Buffer.alloc(0);
    const parsed = text ? parseReceipt(text) : null;
    // Without a number and a date there is nothing to check — ask for a clearer photo.
    if (!parsed || !parsed.date) throw new HttpError(422, 'unreadable', 'We could not read the receipt.');
    const allowed = ctx.cfg.RECEIPT_FISCAL_CODES;
    if (allowed.length) {
      const code = matchFiscalCode(parsed.fiscalCode, allowed);
      if (code === 'missing') throw new HttpError(422, 'unreadable', 'We could not read the fiscal code.');
      if (code === 'other') throw new HttpError(422, 'receipt_other_shop', 'The receipt is not from the canteen.');
      parsed.fiscalCode = code;
    }
    // Tell the student now, not after they confirm. A date that reads as today with one look-alike
    // digit is today: shown and hashed as today, so a second scan of this receipt that misreads
    // another digit still hashes the same.
    await checkReceiptWindow(ctx, parsed.date, parsed.time);
    parsed.date = localDate(ctx.now());
    const draft: ReceiptDraft = {
      token: signDraft(ctx, { u: req.user!.id, p: parsed, exp: ctx.now().getTime() + 15 * 60_000 }),
      receiptNumber: parsed.receiptNumber,
      totalBani: parsed.totalBani,
      date: parsed.date,
      time: parsed.time,
      items: parsed.items,
    };
    res.json(draft);
  });

  r.post('/me/visits', student, loyaltyOn, limits.upload, async (req, res) => {
    const body = parse(z.union([
      z.object({ draftToken: z.string().max(4000) }),
      z.object({ manual: z.object({ receiptNumber: z.string().regex(/^\s*\d{1,8}\s*$/), totalBani: z.number().int().min(0).max(100_000) }) }),
    ]), req.body);
    const today = localDate(ctx.now());
    let result;
    if ('draftToken' in body) {
      const d = readDraft(ctx, body.draftToken);
      if (d.u !== req.user!.id) throw new HttpError(422, 'invalid_draft');
      await checkReceiptWindow(ctx, d.p.date, d.p.time);
      result = await recordVisit(ctx, {
        userId: req.user!.id, occurredOn: today, receiptIdentity: receiptIdentity({ ...d.p, date: d.p.date || today }),
        totalBani: d.p.totalBani, items: d.p.items?.length ? d.p.items : null, source: 'receipt_ocr',
      });
    } else {
      await checkReceiptWindow(ctx, today, null);
      result = await recordVisit(ctx, {
        userId: req.user!.id, occurredOn: today, receiptIdentity: receiptIdentity({ receiptNumber: body.manual.receiptNumber, date: today }),
        totalBani: body.manual.totalBani, items: null, source: 'receipt_manual',
      });
    }
    res.status(201).json(result);
  });

  r.get('/me/history', student, async (req, res) => {
    const today = localDate(ctx.now());
    const month = today.slice(0, 7);
    const monthStart = `${month}-01`;
    const [m, all, days, rewards, fav] = await Promise.all([
      ctx.db.query<{ visits: number; spend: number | null }>(
        'SELECT count(*)::int AS visits, sum(receipt_total_bani)::int AS spend FROM visits WHERE user_id = $1 AND occurred_on >= $2',
        [req.user!.id, monthStart],
      ),
      ctx.db.query<{ n: number }>('SELECT count(DISTINCT occurred_on)::int AS n FROM visits WHERE user_id = $1', [req.user!.id]),
      ctx.db.query<{ occurred_on: string; total: number | null; items: any; counted: boolean }>(
        `SELECT occurred_on, sum(receipt_total_bani)::int AS total, jsonb_agg(items_json) FILTER (WHERE items_json IS NOT NULL) AS items,
                bool_or(counted_for_loyalty) AS counted
         FROM visits WHERE user_id = $1 GROUP BY occurred_on ORDER BY occurred_on DESC LIMIT 60`, [req.user!.id],
      ),
      ctx.db.query<{ n: number }>('SELECT count(*)::int AS n FROM loyalty_rewards WHERE user_id = $1 AND redeemed_at IS NOT NULL', [req.user!.id]),
      ctx.db.query<{ name: string }>(
        `SELECT d.name_ro AS name FROM ratings r JOIN dishes d ON d.id = r.dish_id WHERE r.user_id = $1
         ORDER BY r.stars DESC, r.created_at DESC LIMIT 1`, [req.user!.id],
      ),
    ]);
    const cfg = await getCrowdingConfig(ctx.db);
    const body: HistoryResponse = {
      month,
      visitsThisMonth: m.rows[0].visits,
      visitsTotal: all.rows[0].n,
      spendThisMonthBani: m.rows[0].spend,
      savedBani: rewards.rows[0].n * cfg.freeMealValueBani,
      rewardsRedeemed: rewards.rows[0].n,
      favoriteDish: fav.rows[0]?.name ?? null,
      days: days.rows.map((d) => ({
        date: d.occurred_on,
        totalBani: d.total,
        items: d.items ? (d.items as Array<Array<{ name: string }>>).flat().map((i) => i.name) : null,
        counted: d.counted,
      })),
    };
    res.set('Cache-Control', 'private, no-store').json(body);
  });

  return r;
}
