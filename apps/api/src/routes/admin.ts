/* DCCAS (read-only) and tech-admin endpoints, plus the vision service's two endpoints. */
import { Router } from 'express';
import { z } from 'zod';
import type { AdminUser, CrowdingConfig } from '@ubite/shared';
import { addDays, localDate } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { isoDate, parse, requireRole } from '../http';
import { EXPORTS, exportCsv, summary } from '../services/dashboard';
import { getCrowdingConfig, setCrowdingConfig } from '../services/config-store';
import { invalidateSchedule, loadSchedule } from '../services/schedule';
import { recordVisit } from '../services/loyalty';
import { runFusion } from '../services/crowding';

function rangeFrom(ctx: Ctx, q: any) {
  const today = localDate(ctx.now());
  const to = q.to ? parse(isoDate, q.to) : today;
  const from = q.from ? parse(isoDate, q.from) : addDays(to, -29);
  if (from > to) throw new HttpError(422, 'invalid_range');
  return { from, to };
}

export function dashboardRoutes(ctx: Ctx) {
  const r = Router();
  r.use('/dashboard', requireRole('dccas_admin'));
  r.get('/dashboard/summary', async (req, res) => {
    const { from, to } = rangeFrom(ctx, req.query);
    res.set('Cache-Control', 'private, no-store').json(await summary(ctx, from, to));
  });
  r.get('/dashboard/exports', (_req, res) => {
    res.json(Object.entries(EXPORTS).map(([name, e]) => ({ name, title: e.title })));
  });
  r.get('/dashboard/export/:name', async (req, res) => {
    const { from, to } = rangeFrom(ctx, req.query);
    const name = String(req.params.name).replace(/\.csv$/, '');
    const csv = await exportCsv(ctx.db, name, from, to);
    if (csv === null) throw new HttpError(404, 'not_found');
    res.set('Content-Type', 'text/csv; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="ubite-${name}-${from}-${to}.csv"`)
      .set('Cache-Control', 'private, no-store')
      .send(csv);
  });
  return r;
}

const point = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export function adminRoutes(ctx: Ctx) {
  const r = Router();
  r.use('/admin', requireRole('tech_admin'));

  r.get('/admin/config', async (_req, res) => {
    res.set('Cache-Control', 'no-store').json(await getCrowdingConfig(ctx.db));
  });

  r.put('/admin/config', async (req, res) => {
    const body = parse(z.object({
      thresholds: z.object({ mode: z.enum(['auto', 'manual']), low: z.number().min(0).max(60), high: z.number().min(0).max(120) })
        .refine((t) => t.high > t.low, { message: 'high must exceed low' }),
      zones: z.object({ queue: z.array(point).min(3).max(20), hall: z.array(point).min(3).max(20).nullable() }),
      freeMealValueBani: z.number().int().min(0).max(100_000),
    }), req.body);
    const current = await getCrowdingConfig(ctx.db);
    const next: CrowdingConfig = {
      ...body,
      thresholds: { ...body.thresholds, fittedAt: body.thresholds.mode === 'auto' ? current.thresholds.fittedAt : null, sampleSize: body.thresholds.mode === 'auto' ? current.thresholds.sampleSize : null },
    };
    await setCrowdingConfig(ctx.db, next);
    res.json(next);
  });

  r.get('/admin/schedule', async (_req, res) => {
    res.set('Cache-Control', 'no-store').json(await loadSchedule(ctx.db, true));
  });

  r.put('/admin/schedule', async (req, res) => {
    const body = parse(z.object({
      days: z.array(z.object({ weekday: z.number().int().min(1).max(7), opensAt: time.nullable(), closesAt: time.nullable(), isClosed: z.boolean() }))
        .length(7),
      exceptions: z.array(z.object({ date: isoDate, isClosed: z.boolean(), opensAt: time.nullable(), closesAt: time.nullable(), note: z.string().max(200).nullable() })).max(60),
    }), req.body);
    for (const d of [...body.days, ...body.exceptions]) {
      if (!d.isClosed && (!d.opensAt || !d.closesAt || d.opensAt >= d.closesAt)) throw new HttpError(422, 'invalid_hours');
    }
    await ctx.db.tx(async (q) => {
      for (const d of body.days) {
        await q.query(
          'UPDATE canteen_schedule SET opens_at = $2, closes_at = $3, is_closed = $4 WHERE weekday = $1',
          [d.weekday, d.isClosed ? null : d.opensAt, d.isClosed ? null : d.closesAt, d.isClosed],
        );
      }
      await q.query('DELETE FROM schedule_exceptions WHERE service_date >= $1', [addDays(localDate(ctx.now()), -1)]);
      for (const e of body.exceptions) {
        await q.query(
          'INSERT INTO schedule_exceptions (service_date, is_closed, opens_at, closes_at, note) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (service_date) DO NOTHING',
          [e.date, e.isClosed, e.isClosed ? null : e.opensAt, e.isClosed ? null : e.closesAt, e.note],
        );
      }
    });
    invalidateSchedule();
    res.json(await loadSchedule(ctx.db, true));
  });

  r.get('/admin/users', async (_req, res) => {
    const u = await ctx.db.query<{ id: string; email: string; role: AdminUser['role']; created_at: Date }>(
      "SELECT id, email::text AS email, role::text AS role, created_at FROM users WHERE role <> 'student' AND deleted_at IS NULL ORDER BY role, email",
    );
    res.set('Cache-Control', 'no-store').json(u.rows.map((x) => ({ id: x.id, email: x.email, role: x.role, createdAt: x.created_at.toISOString() })));
  });

  r.post('/admin/users', async (req, res) => {
    const body = parse(z.object({ email: z.string().email().max(200), role: z.enum(['canteen_staff', 'dccas_admin', 'tech_admin']) }), req.body);
    const email = body.email.trim().toLowerCase();
    await ctx.db.query(
      `INSERT INTO users (email, role) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, deleted_at = NULL`, [email, body.role],
    );
    res.status(201).json({ ok: true });
  });

  r.delete('/admin/users/:id', async (req, res) => {
    const id = parse(z.string().uuid(), req.params.id);
    if (id === req.user!.id) throw new HttpError(422, 'cannot_remove_self');
    await ctx.db.query("UPDATE users SET deleted_at = now(), email = NULL WHERE id = $1 AND role <> 'student'", [id]);
    await ctx.db.query('DELETE FROM sessions WHERE user_id = $1', [id]);
    res.status(204).end();
  });

  /** The soft loyalty variant's manual correction: a visit recorded by a developer. */
  r.post('/admin/visits', async (req, res) => {
    const body = parse(z.object({ email: z.string().email(), date: isoDate }), req.body);
    const u = await ctx.db.query<{ id: string }>("SELECT id FROM users WHERE email = $1 AND role = 'student' AND deleted_at IS NULL", [body.email.trim().toLowerCase()]);
    if (!u.rows[0]) throw new HttpError(404, 'unknown_student');
    res.status(201).json(await recordVisit(ctx, {
      userId: u.rows[0].id, occurredOn: body.date, receiptIdentity: null, totalBani: null, items: null, source: 'manual_admin',
    }));
  });

  r.get('/admin/health', async (_req, res) => {
    const now = ctx.now();
    const [cam, est, menu, cal] = await Promise.all([
      ctx.db.query<{ at: Date | null }>('SELECT max(observed_at) AS at FROM crowd_observations'),
      ctx.db.query<{ at: Date | null }>('SELECT max(computed_at) AS at FROM crowd_estimates'),
      ctx.db.query<{ at: Date | null }>('SELECT max(published_at) AS at FROM daily_menus'),
      ctx.db.query<{ at: Date | null; n: number | null; mae: number | null }>('SELECT fitted_at AS at, sample_size AS n, mae_minutes AS mae FROM calibration_params ORDER BY fitted_at DESC LIMIT 1'),
    ]);
    res.set('Cache-Control', 'no-store').json({
      now: now.toISOString(),
      lastObservation: cam.rows[0]?.at ?? null,
      lastEstimate: est.rows[0]?.at ?? null,
      lastMenuPublished: menu.rows[0]?.at ?? null,
      calibration: cal.rows[0] ?? null,
      features: { camera: ctx.cfg.FEATURE_CAMERA, loyalty: ctx.cfg.FEATURE_LOYALTY, waste: ctx.cfg.FEATURE_WASTE, prediction: ctx.cfg.FEATURE_PREDICTION },
      push: ctx.push.enabled, mail: ctx.mail.enabled, visionTokens: ctx.cfg.VISION_TOKENS.length,
    });
  });

  return r;
}

/** services/vision posts counts with a rotatable bearer token; it holds no database credentials. */
export function visionRoutes(ctx: Ctx) {
  const r = Router();
  r.use('/vision', (req, _res, next) => {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token || !ctx.cfg.VISION_TOKENS.includes(token)) return next(new HttpError(401, 'invalid_token'));
    next();
  });

  const observation = z.object({
    observed_at: z.string().datetime({ offset: true }).optional(),
    timestamp: z.number().optional(),
    zone: z.enum(['queue', 'hall']).default('queue'),
    person_count: z.number().int().min(0).max(500),
    confidence: z.number().min(0).max(1).nullable().optional(),
  }).passthrough();

  r.post('/vision/observations', async (req, res) => {
    const items = parse(z.union([observation, z.array(observation).max(200)]), req.body);
    const list = Array.isArray(items) ? items : [items];
    const now = ctx.now().getTime();
    let stored = 0;
    for (const o of list) {
      // Only {timestamp, zone, person_count, confidence} is accepted; anything else is ignored.
      const at = o.observed_at ? new Date(o.observed_at) : o.timestamp ? new Date(o.timestamp * 1000) : new Date(now);
      if (Math.abs(at.getTime() - now) > 15 * 60_000) continue;
      await ctx.db.query(
        'INSERT INTO crowd_observations (observed_at, zone, person_count, confidence) VALUES ($1, $2, $3, $4)',
        [at, o.zone, o.person_count, o.confidence ?? null],
      );
      stored++;
    }
    res.status(202).json({ stored });
  });

  r.get('/vision/config', async (_req, res) => {
    const cfg = await getCrowdingConfig(ctx.db);
    res.set('Cache-Control', 'no-store').json({ zones: cfg.zones, everySeconds: 5, camera: ctx.cfg.FEATURE_CAMERA });
  });

  // Lets an operator see the effect of a camera test immediately.
  r.post('/vision/recompute', async (_req, res) => {
    res.json({ result: await runFusion(ctx) });
  });

  return r;
}
