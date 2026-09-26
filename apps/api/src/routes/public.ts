/* Public endpoints: menu, catalogue, crowding, status, feedback, analytics. No account, no
   cookie banner, nothing between a student and the answer (docs/10, D-02). */
import { Router } from 'express';
import { z } from 'zod';
import type { Announcement, DishDetail, StatusResponse } from '@ubite/shared';
import { DIET_TAGS, localDate } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { features } from '../config';
import { isoDate, limits, parse } from '../http';
import { currentEstimate, submitReport, typicalToday } from '../services/crowding';
import { dishAllergens, getDish, getMenu, listDishes, todayMenu } from '../services/menu';
import { loadSchedule, scheduleFacts } from '../services/schedule';
import { recordEvent } from '../services/analytics';

export function publicRoutes(ctx: Ctx) {
  const r = Router();
  const cache = (seconds: number) => (_req: any, res: any, next: any) => {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 4}`);
    next();
  };

  r.get('/health', async (_req, res) => {
    await ctx.db.query('SELECT 1');
    res.set('Cache-Control', 'no-store').json({ ok: true, time: ctx.now().toISOString() });
  });

  r.get('/menu/today', async (_req, res) => {
    res.set('Cache-Control', 'no-cache').json(await todayMenu(ctx));
  });

  r.get('/menu/:date', cache(60), async (req, res) => {
    const date = parse(isoDate, req.params.date);
    const menu = await getMenu(ctx.db, date, { publishedOnly: true });
    if (!menu) throw new HttpError(404, 'no_menu');
    res.json({ today: localDate(ctx.now()), menu, outdated: false });
  });

  r.get('/dishes', cache(60), async (_req, res) => {
    res.json(await listDishes(ctx.db));
  });

  r.get('/dishes/:id', async (req, res) => {
    const dish = await getDish(ctx.db, req.params.id);
    if (!dish) throw new HttpError(404, 'not_found');
    const allergens = (await dishAllergens(ctx.db, [dish.id])).get(dish.id) || [];
    const today = localDate(ctx.now());
    const price = await ctx.db.query<{ price_bani: number }>(
      `SELECT i.price_bani FROM daily_menu_items i JOIN daily_menus m ON m.id = i.daily_menu_id
       WHERE m.service_date = $1 AND m.published_at IS NOT NULL AND i.dish_id = $2`, [today, dish.id],
    );
    const detail: DishDetail = { ...dish, allergens, todayPriceBani: price.rows[0]?.price_bani ?? null };
    if (req.user) {
      const mine = await ctx.db.query<{ favorite: boolean; stars: number | null }>(
        `SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = $1 AND dish_id = $2) AS favorite,
                (SELECT stars FROM ratings WHERE user_id = $1 AND dish_id = $2) AS stars`, [req.user.id, dish.id],
      );
      detail.mine = mine.rows[0];
      res.set('Cache-Control', 'private, no-cache');
    } else {
      res.set('Cache-Control', 'no-cache');
    }
    res.json(detail);
  });

  r.get('/dishes/:id/photo', async (req, res) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw new HttpError(404, 'not_found');
    const p = await ctx.db.query<{ content: Buffer | Uint8Array; mime: string }>('SELECT content, mime FROM dish_photos WHERE dish_id = $1', [req.params.id]);
    const row = p.rows[0];
    if (!row) throw new HttpError(404, 'not_found');
    // The URL carries ?v=<updated_at>, so the bytes behind it never change.
    res.set('Cache-Control', 'public, max-age=31536000, immutable').type(row.mime).send(Buffer.from(row.content));
  });

  r.get('/crowding/current', async (_req, res) => {
    res.set('Cache-Control', 'no-store').json(await currentEstimate(ctx));
  });

  r.get('/crowding/typical', async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300').json(await typicalToday(ctx));
  });

  r.post('/crowding/report', limits.report, async (req, res) => {
    const body = parse(z.object({
      waitedMinutes: z.number().int().min(0).max(120),
      clientReportedAt: z.string().datetime({ offset: true }).optional(),
    }), req.body);
    res.json(await submitReport(ctx, { userId: req.user?.id ?? null, minutes: body.waitedMinutes, clientReportedAt: body.clientReportedAt }));
  });

  r.get('/status', async (_req, res) => {
    const now = ctx.now();
    const schedule = await loadSchedule(ctx.db);
    const facts = scheduleFacts(schedule, now);
    const ann = await ctx.db.query<{ id: string; body_ro: string; body_en: string | null; starts_at: Date; ends_at: Date }>(
      'SELECT id, body_ro, body_en, starts_at, ends_at FROM announcements WHERE starts_at <= $1 AND ends_at > $1 ORDER BY starts_at DESC',
      [now],
    );
    const announcements: Announcement[] = ann.rows.map((a) => ({
      id: a.id, bodyRo: a.body_ro, bodyEn: a.body_en, startsAt: a.starts_at.toISOString(), endsAt: a.ends_at.toISOString(),
    }));
    const body: StatusResponse = {
      serverTime: now.toISOString(),
      today: facts.today,
      open: facts.open,
      todayHours: facts.todayHours,
      nextOpening: facts.nextOpening ? facts.nextOpening.toISOString() : null,
      schedule: schedule.days,
      exceptions: schedule.exceptions,
      announcements,
      features: features(ctx.cfg),
      vapidPublicKey: ctx.push.publicKey,
      publicUrl: ctx.cfg.PUBLIC_URL,
      privacy: {
        controller: ctx.cfg.PRIVACY_CONTROLLER ?? null,
        contactEmail: ctx.cfg.PRIVACY_CONTACT_EMAIL ?? null,
        dpoEmail: ctx.cfg.PRIVACY_DPO_EMAIL ?? null,
        approved: ctx.cfg.PRIVACY_APPROVED,
      },
    };
    res.set('Cache-Control', 'no-cache').json(body);
  });

  r.post('/feedback', limits.feedback, async (req, res) => {
    const star = z.number().int().min(1).max(5).nullable().optional();
    const body = parse(z.object({
      foodRating: star,
      appRating: star,
      missingFeature: z.string().max(1000).nullable().optional(),
      cameBecauseOfApp: z.boolean().nullable().optional(),
      source: z.enum(['app', 'kiosk']).default('app'),
    }), req.body);
    const text = body.missingFeature?.trim() || null;
    if (body.foodRating == null && body.appRating == null && !text && body.cameBecauseOfApp == null) {
      throw new HttpError(422, 'empty_feedback');
    }
    await ctx.db.query(
      `INSERT INTO feedback (user_id, food_rating, app_rating, missing_feature, came_because_of_app, source, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user?.id ?? null, body.foodRating ?? null, body.appRating ?? null, text, body.cameBecauseOfApp ?? null, body.source, ctx.now()],
    );
    res.status(201).json({ ok: true });
  });

  r.post('/analytics/event', limits.analytics, async (req, res) => {
    const body = parse(z.object({ name: z.string().max(40) }), typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body);
    await recordEvent(ctx, body.name, { ip: req.ip || '', userAgent: String(req.headers['user-agent'] || '') });
    res.status(204).end();
  });

  r.get('/diet-tags', cache(3600), (_req, res) => {
    res.json(DIET_TAGS);
  });

  return r;
}
