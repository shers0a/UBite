/* Seed data.

   base — safe for production: the catalogue skeleton from the design kits (names, categories,
          placeholder prices) and the generated placeholder photos, flagged as placeholders.
          No dietary tags and no allergens: those come from the canteen, never from the team
          (docs/05 LEGAL). Staff correct prices in the editor; the catalogue grows through use.
   demo — development and staging only: tags, three weeks of menus, estimates, reports, ratings,
          feedback, loyalty and analytics, so every screen and chart has something to show. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Category, DietTag } from '@ubite/shared';
import { addDays, localDate, weekdayOf, zonedToUtc, formatHHMM } from '@ubite/shared';
import type { Ctx } from './context';
import { rebuildBaseline } from './services/crowding';
import { levelFor } from './crowding/levels';

interface SeedDish {
  slug: string;
  ro: string;
  en: string;
  category: Category;
  lei: number;
  grams?: number;
  demoTags?: DietTag[];
}

export const CATALOGUE: SeedDish[] = [
  { slug: 'ciorba-perisoare', ro: 'Ciorbă de perișoare', en: 'Meatball soup', category: 'soup', lei: 9, grams: 400 },
  { slug: 'ciorba-burta', ro: 'Ciorbă de burtă', en: 'Tripe soup', category: 'soup', lei: 12, grams: 400 },
  { slug: 'supa-legume', ro: 'Supă cremă de legume', en: 'Cream of vegetable soup', category: 'soup', lei: 8, grams: 400, demoTags: ['vegetarian', 'no_pork'] },
  { slug: 'pui-cartofi', ro: 'Pui la cuptor cu cartofi', en: 'Roast chicken with potatoes', category: 'main', lei: 17, grams: 320, demoTags: ['no_pork', 'gluten_free'] },
  { slug: 'musaca', ro: 'Musaca de legume', en: 'Vegetable moussaka', category: 'main', lei: 14, grams: 300, demoTags: ['vegetarian', 'no_pork'] },
  { slug: 'sarmale', ro: 'Sarmale cu mămăligă', en: 'Cabbage rolls with polenta', category: 'main', lei: 16, grams: 350 },
  { slug: 'peste', ro: 'File de pește la cuptor', en: 'Baked fish fillet', category: 'main', lei: 19, grams: 280, demoTags: ['no_pork', 'lactose_free'] },
  { slug: 'tocanita', ro: 'Tocăniță de cartofi', en: 'Potato stew', category: 'main', lei: 13, grams: 300, demoTags: ['vegan', 'fasting', 'no_pork', 'lactose_free'] },
  { slug: 'salata-varza', ro: 'Salată de varză', en: 'Cabbage salad', category: 'salad', lei: 4, grams: 150, demoTags: ['vegan', 'fasting', 'no_pork', 'gluten_free', 'lactose_free'] },
  { slug: 'salata-muraturi', ro: 'Murături asortate', en: 'Mixed pickles', category: 'salad', lei: 4, grams: 150, demoTags: ['vegan', 'fasting', 'no_pork', 'gluten_free', 'lactose_free'] },
  { slug: 'papanasi', ro: 'Papanași cu smântână', en: 'Papanași with sour cream', category: 'dessert', lei: 12, grams: 220, demoTags: ['vegetarian', 'no_pork'] },
  { slug: 'prajitura', ro: 'Prăjitură de casă', en: 'Homemade cake', category: 'dessert', lei: 7, grams: 120, demoTags: ['vegetarian', 'no_pork'] },
  { slug: 'compot', ro: 'Compot de mere', en: 'Apple compote', category: 'drink', lei: 3, grams: 250, demoTags: ['vegan', 'fasting', 'no_pork', 'gluten_free', 'lactose_free'] },
  { slug: 'apa', ro: 'Apă plată 0,5 l', en: 'Still water 0.5 l', category: 'drink', lei: 3, demoTags: ['vegan', 'fasting', 'no_pork', 'gluten_free', 'lactose_free'] },
  { slug: 'paine', ro: 'Pâine', en: 'Bread', category: 'extra', lei: 1, grams: 80, demoTags: ['vegan', 'fasting', 'no_pork', 'lactose_free'] },
];

function repoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, 'assets', 'manifest.json'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

export async function seedBase(ctx: Ctx, log = (m: string) => ctx.log.info(m)) {
  const existing = await ctx.db.query<{ n: number }>('SELECT count(*)::int AS n FROM dishes');
  if (existing.rows[0].n > 0) { log('catalogue already present — base seed skipped'); return; }
  const photos = path.join(repoRoot(), 'assets', 'photos');
  const sharp = (await import('sharp')).default;
  for (const d of CATALOGUE) {
    const r = await ctx.db.query<{ id: string }>(
      'INSERT INTO dishes (name_ro, name_en, category, default_price_bani, weight_grams) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [d.ro, d.en, d.category, d.lei * 100, d.grams ?? null],
    );
    const file = path.join(photos, `dish-${d.slug}.webp`);
    if (fs.existsSync(file)) {
      const webp = await sharp(file).resize({ width: 960, height: 960, fit: 'cover' }).webp({ quality: 78 }).toBuffer();
      await ctx.db.query("INSERT INTO dish_photos (dish_id, content, mime, placeholder) VALUES ($1, $2, 'image/webp', true)", [r.rows[0].id, webp]);
    }
  }
  log(`catalogue: ${CATALOGUE.length} dishes (placeholder prices, no tags — to be confirmed by the canteen)`);
}

/* ── Demo ─────────────────────────────────────────────────────────────────────────────── */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** A lunchtime curve: quiet at 11:30, peak at 13:00, a second bump at 14:00, empty by 16:30. */
function typicalWait(minute: number, dayFactor: number) {
  const peak = (m: number, at: number, width: number, h: number) => h * Math.exp(-(((m - at) / width) ** 2));
  return Math.max(0.5, (peak(minute, 780, 55, 11) + peak(minute, 845, 30, 4) + 1.2) * dayFactor);
}

export async function seedDemo(ctx: Ctx, log = (m: string) => ctx.log.info(m)) {
  await seedBase(ctx, log);
  const rand = rng(20261013);
  const now = ctx.now();
  const today = localDate(now);
  const dishes = (await ctx.db.query<{ id: string; name_ro: string; default_price_bani: number; category: Category }>(
    'SELECT id, name_ro, default_price_bani, category::text AS category FROM dishes',
  )).rows;
  const bySlug = new Map(CATALOGUE.map((c) => [c.slug, dishes.find((d) => d.name_ro === c.ro)!]));

  // Tags and one declared allergen list — demo data, standing in for what the canteen will supply.
  for (const c of CATALOGUE) {
    const d = bySlug.get(c.slug);
    if (!d) continue;
    for (const t of c.demoTags || []) await ctx.db.query('INSERT INTO dish_diet_tags (dish_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING', [d.id, t]);
  }
  const pui = bySlug.get('pui-cartofi');
  if (pui) for (const a of ['milk', 'mustard']) await ctx.db.query("INSERT INTO dish_allergens (dish_id, allergen, source) VALUES ($1, $2, 'canteen_declared') ON CONFLICT DO NOTHING", [pui.id, a]);
  const pap = bySlug.get('papanasi');
  if (pap) for (const a of ['gluten', 'milk', 'eggs']) await ctx.db.query("INSERT INTO dish_allergens (dish_id, allergen, source) VALUES ($1, $2, 'canteen_declared') ON CONFLICT DO NOTHING", [pap.id, a]);

  // Accounts: the shared canteen account, DCCAS, a developer, and demo students.
  const upsertUser = async (email: string, role: string) =>
    (await ctx.db.query<{ id: string }>(
      `INSERT INTO users (email, role) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role RETURNING id`, [email, role],
    )).rows[0].id;
  const staff = await upsertUser('cantina@ubite.local', 'canteen_staff');
  await upsertUser('dccas@ubite.local', 'dccas_admin');
  await upsertUser('admin@ubite.local', 'tech_admin');
  const students: string[] = [];
  for (let i = 1; i <= 40; i++) {
    const id = await upsertUser(`ubite.demo.${i}@s.unibuc.ro`, 'student');
    await ctx.db.query('INSERT INTO notification_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [id]);
    students.push(id);
  }

  // Three weeks of weekday menus, rotating the way reviews describe.
  const rotation = [
    ['ciorba-perisoare', 'pui-cartofi', 'musaca', 'salata-varza', 'papanasi', 'compot', 'paine'],
    ['supa-legume', 'sarmale', 'peste', 'salata-muraturi', 'prajitura', 'apa', 'paine'],
    ['ciorba-burta', 'pui-cartofi', 'tocanita', 'salata-varza', 'papanasi', 'compot', 'paine'],
  ];
  for (let back = 21; back >= 0; back--) {
    const date = addDays(today, -back);
    if (weekdayOf(date) > 5) continue;
    const pick = rotation[back % rotation.length].map((s) => bySlug.get(s)).filter(Boolean) as typeof dishes;
    const m = await ctx.db.query<{ id: string }>(
      `INSERT INTO daily_menus (service_date, published_at, published_by) VALUES ($1, $2, $3)
       ON CONFLICT (service_date) DO UPDATE SET published_at = EXCLUDED.published_at RETURNING id`,
      [date, zonedToUtc(date, '09:40'), staff],
    );
    await ctx.db.query('DELETE FROM daily_menu_items WHERE daily_menu_id = $1', [m.rows[0].id]);
    for (const [i, d] of pick.entries()) {
      await ctx.db.query(
        'INSERT INTO daily_menu_items (daily_menu_id, dish_id, price_bani, portions_prepared, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [m.rows[0].id, d.id, d.default_price_bani, d.category === 'main' ? 80 + Math.round(rand() * 60) : null, i],
      );
    }
  }

  // Crowding history: an estimate every five minutes, reports around it, a few on-site visits.
  for (let back = 21; back >= 1; back--) {
    const date = addDays(today, -back);
    const wd = weekdayOf(date);
    if (wd > 5) continue;
    const dayFactor = [1, 1.05, 1.1, 0.95, 1.0, 0.7][wd] ?? 1;
    for (let minute = 690; minute < 1020; minute += 5) {
      const w = typicalWait(minute, dayFactor) * (0.85 + rand() * 0.3);
      await ctx.db.query(
        `INSERT INTO crowd_estimates (computed_at, wait_minutes, level, camera_weight, report_weight, history_weight, quality)
         VALUES ($1, $2, $3, 0, $4, 0, $5)`,
        [zonedToUtc(date, formatHHMM(minute)), w, levelFor(w), 0.3, rand() > 0.3 ? 'live' : 'degraded'],
      );
      if (rand() < 0.35) {
        const who = rand() < 0.7 ? students[Math.floor(rand() * students.length)] : null;
        await ctx.db.query(
          `INSERT INTO wait_reports (user_id, reported_at, waited_minutes, client_reported_at, accepted)
           VALUES ($1, $2, $3, $2, true) ON CONFLICT DO NOTHING`,
          [who, zonedToUtc(date, formatHHMM(minute)), Math.max(0, Math.round(w + (rand() - 0.5) * 3))],
        );
      }
    }
  }
  await rebuildBaseline(ctx.db);

  // Ratings, favourites, feedback.
  for (const s of students) {
    for (const d of dishes) {
      if (rand() < 0.45) {
        const base = d.name_ro.startsWith('Papanași') ? 4.7 : d.name_ro.startsWith('Tocăniță') ? 2.9 : d.name_ro.startsWith('Murături') ? 3.1 : 3.9;
        const stars = Math.min(5, Math.max(1, Math.round(base + (rand() - 0.5) * 2)));
        await ctx.db.query('INSERT INTO ratings (user_id, dish_id, stars) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [s, d.id, stars]);
      }
    }
    if (rand() < 0.2 && pap) await ctx.db.query('INSERT INTO favorites (user_id, dish_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [s, pap.id]);
  }
  const missing = ['Meniul pe toată săptămâna', 'Să pot plăti din aplicație', 'Mai multe feluri de post', 'Poze reale cu mâncarea', null, null, null];
  for (let i = 0; i < 64; i++) {
    const day = addDays(today, -Math.floor(rand() * 14));
    if (weekdayOf(day) > 5) continue;
    await ctx.db.query(
      `INSERT INTO feedback (user_id, food_rating, app_rating, missing_feature, came_because_of_app, source, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [rand() < 0.5 ? students[i % students.length] : null, 3 + Math.round(rand() * 2), 3 + Math.round(rand() * 2),
        missing[Math.floor(rand() * missing.length)], rand() < 0.8 ? rand() < 0.42 : null, rand() < 0.3 ? 'kiosk' : 'app',
        zonedToUtc(day, formatHHMM(720 + Math.floor(rand() * 240)))],
    );
  }

  // Loyalty: most demo students have a few visits; one sits at four, one holds a reward.
  for (const [i, s] of students.entries()) {
    const visits = i === 0 ? 4 : i === 1 ? 5 : Math.floor(rand() * 4);
    let placed = 0;
    for (let back = 1; placed < visits && back < 21; back++) {
      const date = addDays(today, -back);
      if (weekdayOf(date) > 5) continue;
      await ctx.db.query(
        `INSERT INTO visits (user_id, occurred_on, receipt_hash, receipt_total_bani, items_json, source, counted_for_loyalty)
         VALUES ($1, $2, $3, $4, $5, 'receipt_ocr', true) ON CONFLICT DO NOTHING`,
        [s, date, crypto.randomBytes(16).toString('hex'), 1800 + Math.round(rand() * 1400),
          JSON.stringify([{ name: 'Ciorba de perisoare', priceBani: 900 }, { name: 'Pui la cuptor cu cartofi', priceBani: 1700 }])],
      );
      placed++;
    }
    if (i === 1) {
      await ctx.db.query('INSERT INTO loyalty_rewards (user_id, code, secret) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [s, 'K7P4', crypto.randomBytes(20).toString('hex')]);
    }
  }

  // Analytics: visitors per finished day, and feature events.
  for (let back = 21; back >= 1; back--) {
    const day = addDays(today, -back);
    if (weekdayOf(day) > 5) continue;
    await ctx.db.query('INSERT INTO analytics_daily (day, unique_visitors) VALUES ($1, $2) ON CONFLICT DO NOTHING', [day, 20 + Math.round(rand() * 25 + (21 - back) * 3)]);
    for (const [name, n] of [['first_visit', 12], ['dish_open', 40], ['report_submit', 15], ['filter_use', 9], ['visit_add', 5], ['pwa_installed', 3], ['kiosk_qr_open', 4]] as const) {
      await ctx.db.query(
        'INSERT INTO analytics_events (day, hour, name, count) VALUES ($1, 12, $2, $3) ON CONFLICT (day, hour, name) DO NOTHING',
        [day, name, Math.round(n * (0.5 + rand()))],
      );
    }
  }
  await ctx.db.query(
    'INSERT INTO announcements (body_ro, body_en, starts_at, ends_at, created_by) VALUES ($1, $2, $3, $4, $5)',
    ['Vineri cantina se închide la 15:00. Bucătăria are revizie tehnică.', 'On Friday the canteen closes at 15:00 for a kitchen inspection.',
      new Date(now.getTime() - 3600_000), new Date(now.getTime() + 3 * 86_400_000), staff],
  );
  log('demo data seeded: 3 weeks of menus, estimates, reports, ratings, feedback, loyalty and analytics');
  log('demo sign-in: cantina@ubite.local (staff), dccas@ubite.local (DCCAS), admin@ubite.local (tech admin), ubite.demo.1@s.unibuc.ro (student at 4/5), ubite.demo.2@s.unibuc.ro (reward waiting)');
}
