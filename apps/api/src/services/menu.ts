/* Catalogue and daily menus (docs/05 "the dish is the atom"). Prices are snapshotted per day, so
   history never reads today's price for yesterday's lunch. */
import type { Allergen, AllergenSource, Category, DietTag, Dish, DishAllergen, DishInput, MenuDay, MenuItem, StaffDish } from '@ubite/shared';
import { CATEGORY_GROUPS, addDays, localDate } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import type { Db, Queryable } from '../db/index';
import { notifyMenuPublished } from './notifications';

const DISH_COLUMNS = `
  d.id, d.name_ro, d.name_en, d.category::text AS category, d.default_price_bani, d.weight_grams, d.calories,
  d.photo_url, d.is_active,
  COALESCE((SELECT array_agg(t.tag::text ORDER BY t.tag) FROM dish_diet_tags t WHERE t.dish_id = d.id), '{}') AS tags,
  (SELECT avg(r.stars)::float8 FROM ratings r WHERE r.dish_id = d.id) AS rating_avg,
  (SELECT count(*)::int FROM ratings r WHERE r.dish_id = d.id) AS rating_count,
  p.placeholder AS photo_placeholder,
  floor(extract(epoch FROM p.updated_at))::bigint AS photo_version`;
const DISH_FROM = 'dishes d LEFT JOIN dish_photos p ON p.dish_id = d.id';

export interface DishRow {
  id: string;
  name_ro: string;
  name_en: string;
  category: Category;
  default_price_bani: number;
  weight_grams: number | null;
  calories: number | null;
  photo_url: string | null;
  is_active: boolean;
  tags: string[] | null;
  rating_avg: number | null;
  rating_count: number;
  photo_placeholder: boolean | null;
  photo_version: number | null;
}

export function toDish(r: DishRow): Dish {
  const photo = r.photo_version !== null
    ? { url: `/api/dishes/${r.id}/photo?v=${r.photo_version}`, placeholder: !!r.photo_placeholder }
    : r.photo_url ? { url: r.photo_url, placeholder: false } : null;
  return {
    id: r.id,
    nameRo: r.name_ro,
    nameEn: r.name_en,
    category: r.category,
    defaultPriceBani: r.default_price_bani,
    weightGrams: r.weight_grams,
    calories: r.calories,
    photo,
    tags: (r.tags || []) as DietTag[],
    rating: { average: r.rating_avg === null ? null : Math.round(r.rating_avg * 10) / 10, count: r.rating_count },
    isActive: r.is_active,
  };
}

export async function listDishes(db: Queryable, opts: { includeInactive?: boolean } = {}): Promise<Dish[]> {
  const r = await db.query<DishRow>(
    `SELECT ${DISH_COLUMNS} FROM ${DISH_FROM} ${opts.includeInactive ? '' : 'WHERE d.is_active'}
     ORDER BY array_position(ARRAY['soup','main','side','dessert','salad','drink','extra']::dish_category[], d.category), d.name_ro`,
  );
  return r.rows.map(toDish);
}

export async function getDish(db: Queryable, id: string): Promise<Dish | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const r = await db.query<DishRow>(`SELECT ${DISH_COLUMNS} FROM ${DISH_FROM} WHERE d.id = $1`, [id]);
  return r.rows[0] ? toDish(r.rows[0]) : null;
}

export async function dishAllergens(db: Queryable, ids: string[]): Promise<Map<string, DishAllergen[]>> {
  const r = await db.query<{ dish_id: string; allergen: Allergen; source: AllergenSource }>(
    'SELECT dish_id, allergen::text AS allergen, source::text AS source FROM dish_allergens WHERE dish_id = ANY($1::uuid[]) ORDER BY allergen',
    [ids],
  );
  const map = new Map<string, DishAllergen[]>();
  for (const a of r.rows) {
    if (!map.has(a.dish_id)) map.set(a.dish_id, []);
    map.get(a.dish_id)!.push({ allergen: a.allergen, source: a.source });
  }
  return map;
}

export async function staffCatalogue(db: Queryable): Promise<StaffDish[]> {
  const dishes = await listDishes(db, { includeInactive: true });
  const allergens = await dishAllergens(db, dishes.map((d) => d.id));
  return dishes.map((d) => ({ ...d, allergens: allergens.get(d.id) || [] }));
}

/* ── Menus ────────────────────────────────────────────────────────────────────────────── */

export async function getMenu(db: Queryable, date: string, opts: { withPortions?: boolean; publishedOnly?: boolean } = {}): Promise<MenuDay | null> {
  const m = await db.query<{ id: string; service_date: string; published_at: Date | null }>(
    `SELECT id, service_date, published_at FROM daily_menus WHERE service_date = $1 ${opts.publishedOnly ? 'AND published_at IS NOT NULL' : ''}`,
    [date],
  );
  const menu = m.rows[0];
  if (!menu) return null;
  return loadItems(db, menu, opts.withPortions);
}

async function loadItems(db: Queryable, menu: { id: string; service_date: string; published_at: Date | null }, withPortions = false): Promise<MenuDay> {
  const r = await db.query<DishRow & { price_bani: number; portions_prepared: number | null; sort_order: number }>(
    `SELECT ${DISH_COLUMNS}, i.price_bani, i.portions_prepared, i.sort_order
     FROM daily_menu_items i JOIN ${DISH_FROM} ON d.id = i.dish_id
     WHERE i.daily_menu_id = $1 ORDER BY i.sort_order, d.name_ro`, [menu.id],
  );
  return {
    serviceDate: menu.service_date,
    publishedAt: menu.published_at ? menu.published_at.toISOString() : null,
    items: r.rows.map((row) => {
      const item: MenuItem = { dish: toDish(row), priceBani: row.price_bani, sortOrder: row.sort_order };
      if (withPortions) item.portionsPrepared = row.portions_prepared;
      return item;
    }),
  };
}

/** The last published menu strictly before `date`. */
export async function previousPublished(db: Queryable, date: string, withPortions = false): Promise<MenuDay | null> {
  const m = await db.query<{ id: string; service_date: string; published_at: Date | null }>(
    `SELECT id, service_date, published_at FROM daily_menus
     WHERE service_date < $1 AND published_at IS NOT NULL ORDER BY service_date DESC LIMIT 1`, [date],
  );
  return m.rows[0] ? loadItems(db, m.rows[0], withPortions) : null;
}

/** docs/03 F1: never an empty screen. Unpublished today → the previous menu, marked outdated. */
export async function todayMenu(ctx: Ctx) {
  const today = localDate(ctx.now());
  const menu = await getMenu(ctx.db, today, { publishedOnly: true });
  if (menu) return { today, menu, outdated: false };
  const prev = await previousPublished(ctx.db, today);
  return { today, menu: prev, outdated: !!prev };
}

const GROUP_RANK = new Map(CATEGORY_GROUPS.flatMap((g, gi) => g.categories.map((c, ci) => [c, gi * 10 + ci] as const)));

export async function publishMenu(
  ctx: Ctx, userId: string, date: string, items: Array<{ dishId: string; priceBani: number; portionsPrepared?: number | null }>,
) {
  const today = localDate(ctx.now());
  if (date < addDays(today, -1) || date > addDays(today, 7)) throw new HttpError(422, 'date_out_of_range');
  if (!items.length) throw new HttpError(422, 'empty_menu', 'Select at least one dish.');
  const ids = [...new Set(items.map((i) => i.dishId))];
  const cats = await ctx.db.query<{ id: string; category: Category }>('SELECT id, category::text AS category FROM dishes WHERE id = ANY($1::uuid[])', [ids]);
  if (cats.rows.length !== ids.length) throw new HttpError(422, 'unknown_dish');
  const catOf = new Map(cats.rows.map((c) => [c.id, c.category]));
  const ordered = items
    .filter((it, i, all) => all.findIndex((x) => x.dishId === it.dishId) === i)
    .map((it, i) => ({ ...it, rank: (GROUP_RANK.get(catOf.get(it.dishId)!) ?? 99) * 1000 + i }))
    .sort((a, b) => a.rank - b.rank);

  await ctx.db.tx(async (q) => {
    const m = await q.query<{ id: string }>(
      `INSERT INTO daily_menus (service_date, published_at, published_by) VALUES ($1, $2, $3)
       ON CONFLICT (service_date) DO UPDATE SET published_at = EXCLUDED.published_at, published_by = EXCLUDED.published_by
       RETURNING id`, [date, ctx.now(), userId],
    );
    const menuId = m.rows[0].id;
    await q.query('DELETE FROM daily_menu_items WHERE daily_menu_id = $1', [menuId]);
    for (const [i, it] of ordered.entries()) {
      await q.query(
        'INSERT INTO daily_menu_items (daily_menu_id, dish_id, price_bani, portions_prepared, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [menuId, it.dishId, it.priceBani, it.portionsPrepared ?? null, i],
      );
    }
  });
  const menu = (await getMenu(ctx.db, date, { withPortions: true }))!;
  const notified = date === today
    ? await notifyMenuPublished(ctx, date, ids).catch((e) => { ctx.log.warn({ err: e.message }, 'menu notification failed'); return 0; })
    : 0;
  return { menu, notified };
}

/* ── Catalogue edits (canteen staff) ──────────────────────────────────────────────────── */

export async function saveDish(db: Db, input: DishInput, id?: string): Promise<string> {
  return db.tx((q) => writeDish(q, input, id));
}

async function writeDish(q: Queryable, input: DishInput, id?: string): Promise<string> {
  const nameRo = input.nameRo.trim();
  // Translated by the team (docs/05); until then the Romanian name stands in.
  const nameEn = (input.nameEn || '').trim() || nameRo;
  let dishId = id;
  if (dishId) {
    const r = await q.query(
      `UPDATE dishes SET name_ro = $2, name_en = $3, category = $4, default_price_bani = $5, weight_grams = $6,
         calories = $7, is_active = COALESCE($8, is_active) WHERE id = $1`,
      [dishId, nameRo, nameEn, input.category, input.defaultPriceBani, input.weightGrams ?? null, input.calories ?? null, input.isActive ?? null],
    );
    if (!r.rowCount) throw new HttpError(404, 'not_found');
  } else {
    const r = await q.query<{ id: string }>(
      `INSERT INTO dishes (name_ro, name_en, category, default_price_bani, weight_grams, calories, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true)) RETURNING id`,
      [nameRo, nameEn, input.category, input.defaultPriceBani, input.weightGrams ?? null, input.calories ?? null, input.isActive ?? null],
    );
    dishId = r.rows[0].id;
  }
  if (input.tags) {
    await q.query('DELETE FROM dish_diet_tags WHERE dish_id = $1', [dishId]);
    for (const tag of new Set(input.tags)) await q.query('INSERT INTO dish_diet_tags (dish_id, tag) VALUES ($1, $2)', [dishId, tag]);
  }
  if (input.allergens) {
    await q.query('DELETE FROM dish_allergens WHERE dish_id = $1', [dishId]);
    for (const a of input.allergens) {
      await q.query('INSERT INTO dish_allergens (dish_id, allergen, source) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [dishId, a.allergen, a.source]);
    }
  }
  return dishId!;
}
