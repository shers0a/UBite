/* The canteen's shared account (docs/10): publish the menu, keep the catalogue, post
   announcements, redeem reward codes. Every workflow here fits inside two minutes. */
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import type { StaffMenuDraft } from '@ubite/shared';
import { ALLERGENS, CATEGORIES, DIET_TAGS, localDate } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { isoDate, limits, parse, requireRole } from '../http';
import { getMenu, previousPublished, publishMenu, saveDish, staffCatalogue } from '../services/menu';
import { redeemAtTill } from '../services/loyalty';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

const dishSchema = z.object({
  nameRo: z.string().trim().min(2).max(80),
  nameEn: z.string().trim().max(80).nullable().optional(),
  category: z.enum(CATEGORIES as [string, ...string[]]),
  defaultPriceBani: z.number().int().min(0).max(100_000),
  weightGrams: z.number().int().min(1).max(5000).nullable().optional(),
  calories: z.number().int().min(0).max(5000).nullable().optional(),
  tags: z.array(z.enum(DIET_TAGS as [string, ...string[]])).optional(),
  allergens: z.array(z.object({
    allergen: z.enum(ALLERGENS as [string, ...string[]]),
    source: z.enum(['canteen_declared', 'unknown']),
  })).optional(),
  isActive: z.boolean().optional(),
});

export function staffRoutes(ctx: Ctx) {
  const r = Router();
  r.use('/staff', requireRole('canteen_staff'));

  r.get('/staff/menu', async (req, res) => {
    const date = req.query.date ? parse(isoDate, req.query.date) : localDate(ctx.now());
    const body: StaffMenuDraft = {
      date,
      current: await getMenu(ctx.db, date, { withPortions: true }),
      previous: await previousPublished(ctx.db, date, true),
      catalogue: await staffCatalogue(ctx.db),
    };
    res.set('Cache-Control', 'no-store').json(body);
  });

  r.post('/staff/menu', async (req, res) => {
    const body = parse(z.object({
      date: isoDate.optional(),
      items: z.array(z.object({
        dishId: z.string().uuid(),
        priceBani: z.number().int().min(0).max(100_000),
        portionsPrepared: z.number().int().min(0).max(10_000).nullable().optional(),
      })).min(1).max(80),
    }), req.body);
    res.json(await publishMenu(ctx, req.user!.id, body.date || localDate(ctx.now()), body.items));
  });

  r.get('/staff/dishes', async (_req, res) => {
    res.set('Cache-Control', 'no-store').json(await staffCatalogue(ctx.db));
  });

  r.post('/staff/dishes', async (req, res) => {
    const id = await saveDish(ctx.db, parse(dishSchema, req.body) as any);
    res.status(201).json((await staffCatalogue(ctx.db)).find((d) => d.id === id));
  });

  r.patch('/staff/dishes/:id', async (req, res) => {
    const id = parse(z.string().uuid(), req.params.id);
    await saveDish(ctx.db, parse(dishSchema, req.body) as any, id);
    res.json((await staffCatalogue(ctx.db)).find((d) => d.id === id));
  });

  /** One photo per catalogue entry, taken once (docs/05) — stored small, as WebP. */
  r.put('/staff/dishes/:id/photo', limits.upload, upload.single('photo'), async (req, res) => {
    const id = parse(z.string().uuid(), req.params.id);
    if (!req.file) throw new HttpError(422, 'no_image');
    const sharp = (await import('sharp')).default;
    const webp = await sharp(req.file.buffer).rotate().resize({ width: 960, height: 960, fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toBuffer();
    const r2 = await ctx.db.query(
      `INSERT INTO dish_photos (dish_id, content, mime, placeholder, updated_at) VALUES ($1, $2, 'image/webp', false, now())
       ON CONFLICT (dish_id) DO UPDATE SET content = EXCLUDED.content, mime = EXCLUDED.mime, placeholder = false, updated_at = now()`,
      [id, webp],
    );
    if (!r2.rowCount) throw new HttpError(404, 'not_found');
    res.json((await staffCatalogue(ctx.db)).find((d) => d.id === id));
  });

  r.delete('/staff/dishes/:id/photo', async (req, res) => {
    await ctx.db.query('DELETE FROM dish_photos WHERE dish_id = $1', [parse(z.string().uuid(), req.params.id)]);
    res.status(204).end();
  });

  r.get('/staff/announcements', async (_req, res) => {
    const a = await ctx.db.query<{ id: string; body_ro: string; body_en: string | null; starts_at: Date; ends_at: Date }>(
      "SELECT id, body_ro, body_en, starts_at, ends_at FROM announcements WHERE ends_at > $1::timestamptz - interval '14 days' ORDER BY starts_at DESC",
      [ctx.now()],
    );
    res.set('Cache-Control', 'no-store').json(a.rows.map((x) => ({
      id: x.id, bodyRo: x.body_ro, bodyEn: x.body_en, startsAt: x.starts_at.toISOString(), endsAt: x.ends_at.toISOString(),
    })));
  });

  r.post('/staff/announcements', async (req, res) => {
    const body = parse(z.object({
      bodyRo: z.string().trim().min(3).max(280),
      bodyEn: z.string().trim().max(280).nullable().optional(),
      startsAt: z.string().datetime({ offset: true }),
      endsAt: z.string().datetime({ offset: true }),
    }).refine((b) => new Date(b.endsAt) > new Date(b.startsAt), { message: 'the end must follow the start' }), req.body);
    const a = await ctx.db.query<{ id: string }>(
      'INSERT INTO announcements (body_ro, body_en, starts_at, ends_at, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [body.bodyRo, body.bodyEn || null, body.startsAt, body.endsAt, req.user!.id],
    );
    res.status(201).json({ id: a.rows[0].id });
  });

  r.delete('/staff/announcements/:id', async (req, res) => {
    await ctx.db.query('DELETE FROM announcements WHERE id = $1', [parse(z.string().uuid(), req.params.id)]);
    res.status(204).end();
  });

  r.post('/staff/rewards/redeem', limits.redeem, async (req, res) => {
    if (!ctx.cfg.FEATURE_LOYALTY) throw new HttpError(404, 'feature_off');
    const body = parse(z.object({ code: z.string().trim().min(4).max(80) }), req.body);
    res.json(await redeemAtTill(ctx, body.code, req.user!.id));
  });

  return r;
}
