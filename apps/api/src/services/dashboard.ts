/* The DCCAS dashboard (docs/03 F16, F17) and the UNIHUB evidence exports (docs/13). Read-only,
   plain numbers, and honest labels: the app sees recorded visits and reports, not the till. */
import type { DashboardSummary } from '@ubite/shared';
import { addDays } from '@ubite/shared';
import type { Ctx } from '../context';
import type { Queryable } from '../db/index';
import { visitorsByDay } from './analytics';
import { getCrowdingConfig } from './config-store';

const TZ = "'Europe/Bucharest'";
const localDay = (col: string) => `(${col} AT TIME ZONE ${TZ})::date`;

export async function summary(ctx: Ctx, from: string, to: string): Promise<DashboardSummary> {
  const { db } = ctx;
  const upper = addDays(to, 1);
  const range = [from, upper];
  const cfg = await getCrowdingConfig(db);

  const [visits, reports, avgWait, feedback, loyalty, cameBecause] = await Promise.all([
    db.query<{ n: number }>('SELECT count(*)::int AS n FROM visits WHERE occurred_on >= $1 AND occurred_on < $2', range),
    db.query<{ n: number }>(`SELECT count(*)::int AS n FROM wait_reports WHERE accepted AND ${localDay('client_reported_at')} >= $1 AND ${localDay('client_reported_at')} < $2`, range),
    db.query<{ m: number | null }>(`SELECT avg(wait_minutes)::float8 AS m FROM crowd_estimates WHERE ${localDay('computed_at')} >= $1 AND ${localDay('computed_at')} < $2`, range),
    db.query<{ n: number; food: number | null; app: number | null; app_src: number; kiosk_src: number }>(
      `SELECT count(*)::int AS n, avg(food_rating)::float8 AS food, avg(app_rating)::float8 AS app,
              count(*) FILTER (WHERE source = 'app')::int AS app_src, count(*) FILTER (WHERE source = 'kiosk')::int AS kiosk_src
       FROM feedback WHERE ${localDay('submitted_at')} >= $1 AND ${localDay('submitted_at')} < $2`, range),
    db.query<{ enrolled: number; visits: number; issued: number; redeemed: number }>(
      `SELECT (SELECT count(DISTINCT user_id)::int FROM visits WHERE occurred_on < $2) AS enrolled,
              (SELECT count(*)::int FROM visits WHERE counted_for_loyalty AND occurred_on >= $1 AND occurred_on < $2) AS visits,
              (SELECT count(*)::int FROM loyalty_rewards WHERE ${localDay('earned_at')} >= $1 AND ${localDay('earned_at')} < $2) AS issued,
              (SELECT count(*)::int FROM loyalty_rewards WHERE redeemed_at IS NOT NULL AND ${localDay('redeemed_at')} >= $1 AND ${localDay('redeemed_at')} < $2) AS redeemed`, range),
    db.query<{ yes: number; answered: number }>(
      `SELECT count(*) FILTER (WHERE came_because_of_app)::int AS yes, count(came_because_of_app)::int AS answered
       FROM feedback WHERE ${localDay('submitted_at')} >= $1 AND ${localDay('submitted_at')} < $2`, range),
  ]);

  const visitors = await visitorsByDay(db, from, to);
  const events = await db.query<{ name: string; n: number }>(
    'SELECT name, sum(count)::int AS n FROM analytics_events WHERE day >= $1 AND day < $2 GROUP BY name ORDER BY n DESC', range,
  );
  const eventCount = (n: string) => events.rows.find((e) => e.name === n)?.n ?? 0;

  const days = await db.query<{ date: string; visits: number; reports: number; wait: number | null }>(
    `SELECT d::date::text AS date,
       (SELECT count(*)::int FROM visits v WHERE v.occurred_on = d::date) AS visits,
       (SELECT count(*)::int FROM wait_reports r WHERE r.accepted AND ${localDay('r.client_reported_at')} = d::date) AS reports,
       (SELECT avg(e.wait_minutes)::float8 FROM crowd_estimates e WHERE ${localDay('e.computed_at')} = d::date) AS wait
     FROM generate_series($1::date, $2::date, interval '1 day') d
     WHERE extract(isodow FROM d) < 6 ORDER BY d`, [from, to],
  );

  const hours = await db.query<{ hour: string; wait: number | null; queue: number | null }>(
    `WITH w AS (
       SELECT to_char(date_trunc('hour', computed_at AT TIME ZONE ${TZ}) + (floor(extract(minute FROM computed_at AT TIME ZONE ${TZ}) / 30) * interval '30 minutes'), 'HH24:MI') AS hour,
              avg(wait_minutes)::float8 AS wait
       FROM crowd_estimates WHERE ${localDay('computed_at')} >= $1 AND ${localDay('computed_at')} < $2 GROUP BY 1),
     q AS (
       SELECT to_char(date_trunc('hour', observed_at AT TIME ZONE ${TZ}) + (floor(extract(minute FROM observed_at AT TIME ZONE ${TZ}) / 30) * interval '30 minutes'), 'HH24:MI') AS hour,
              avg(person_count)::float8 AS queue
       FROM crowd_observations WHERE zone = 'queue' AND ${localDay('observed_at')} >= $1 AND ${localDay('observed_at')} < $2 GROUP BY 1)
     SELECT COALESCE(w.hour, q.hour) AS hour, w.wait, q.queue FROM w FULL JOIN q ON q.hour = w.hour ORDER BY 1`, range,
  );

  const rated = await db.query<{ name: string; average: number; count: number }>(
    `SELECT d.name_ro AS name, avg(r.stars)::float8 AS average, count(*)::int AS count
     FROM ratings r JOIN dishes d ON d.id = r.dish_id GROUP BY d.id, d.name_ro HAVING count(*) >= 3`,
  );
  const sorted = [...rated.rows].map((r) => ({ ...r, average: Math.round(r.average * 10) / 10 }));
  const best = [...sorted].sort((a, b) => b.average - a.average || b.count - a.count).slice(0, 5);
  const worst = [...sorted].sort((a, b) => a.average - b.average || b.count - a.count).filter((r) => r.average < 3.5).slice(0, 5);

  const missing = await db.query<{ text: string; at: Date }>(
    `SELECT missing_feature AS text, submitted_at AS at FROM feedback
     WHERE missing_feature IS NOT NULL AND length(trim(missing_feature)) > 0
       AND ${localDay('submitted_at')} >= $1 AND ${localDay('submitted_at')} < $2
     ORDER BY submitted_at DESC LIMIT 30`, range,
  );

  // F17: only days and dishes where staff entered portions — demand shown as recorded visits
  // that named the dish, never an invented "sold" figure.
  const waste = ctx.cfg.FEATURE_WASTE ? await db.query<{ date: string; name: string; prepared: number; demand: number | null }>(
    `SELECT m.service_date::text AS date, d.name_ro AS name, i.portions_prepared AS prepared,
       (SELECT count(*)::int FROM visits v WHERE v.occurred_on = m.service_date AND v.items_json IS NOT NULL
          AND EXISTS (SELECT 1 FROM jsonb_array_elements(v.items_json) it WHERE lower(it->>'name') LIKE '%' || lower(split_part(d.name_ro, ' ', 1)) || '%')) AS demand
     FROM daily_menus m JOIN daily_menu_items i ON i.daily_menu_id = m.id JOIN dishes d ON d.id = i.dish_id
     WHERE i.portions_prepared IS NOT NULL AND m.service_date >= $1 AND m.service_date < $2
     ORDER BY m.service_date DESC, d.name_ro`, range,
  ) : { rows: [] };

  const camera = await db.query<{ last: Date | null; n: number }>(
    `SELECT max(observed_at) AS last, count(*)::int AS n FROM crowd_observations WHERE ${localDay('observed_at')} >= $1 AND ${localDay('observed_at')} < $2`, range,
  );
  const cal = await db.query<{ fitted_at: Date; slope_min_per_person: number; intercept_min: number; sample_size: number; mae_minutes: number | null }>(
    'SELECT fitted_at, slope_min_per_person, intercept_min, sample_size, mae_minutes FROM calibration_params ORDER BY fitted_at DESC LIMIT 1',
  );
  const c = cal.rows[0];
  const l = loyalty.rows[0];
  const f = feedback.rows[0];
  const round1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10);

  return {
    from, to,
    headline: {
      visitsRecorded: visits.rows[0].n,
      averageWaitMinutes: round1(avgWait.rows[0].m),
      waitReports: reports.rows[0].n,
      cameBecauseOfApp: cameBecause.rows[0],
      freeMealsGiven: l.redeemed,
      freeMealsCostBani: l.redeemed * cfg.freeMealValueBani,
      uniqueVisitors: [...visitors.values()].reduce((s, n) => s + n, 0),
      newVisitors: eventCount('first_visit'),
    },
    byDay: days.rows.map((d) => ({ date: d.date, visits: d.visits, reports: d.reports, visitors: visitors.get(d.date) ?? 0, averageWaitMinutes: round1(d.wait) })),
    byHour: hours.rows.filter((h) => h.hour).map((h) => ({ hour: h.hour, averageWaitMinutes: round1(h.wait), averageQueue: round1(h.queue) })),
    best, worst,
    feedback: {
      count: f.n, foodAverage: round1(f.food), appAverage: round1(f.app),
      bySource: { app: f.app_src, kiosk: f.kiosk_src },
      missing: missing.rows.map((m) => ({ text: m.text, at: m.at.toISOString() })),
    },
    loyalty: { enrolled: l.enrolled, visits: l.visits, rewardsIssued: l.issued, rewardsRedeemed: l.redeemed, costBani: l.redeemed * cfg.freeMealValueBani },
    waste: waste.rows.map((w) => ({ date: w.date, name: w.name, prepared: w.prepared, demandVisits: w.demand })),
    features: events.rows.filter((e) => e.name !== 'pageview').map((e) => ({ name: e.name, count: e.n })),
    installs: eventCount('pwa_installed'),
    camera: { lastObservationAt: camera.rows[0].last ? camera.rows[0].last.toISOString() : null, observations: camera.rows[0].n },
    calibration: c ? { fittedAt: c.fitted_at.toISOString(), slope: c.slope_min_per_person, intercept: c.intercept_min, sampleSize: c.sample_size, maeMinutes: c.mae_minutes } : null,
  };
}

/* ── CSV exports: "a simple table", and the evidence pack for R7–R15 ─────────────────── */

export const EXPORTS: Record<string, { title: string; sql: string }> = {
  visitors: {
    title: 'Vizitatori unici pe zi (R9)',
    sql: `SELECT day::text AS zi, unique_visitors AS vizitatori_unici FROM analytics_daily WHERE day >= $1 AND day < $2
          UNION ALL SELECT day::text, count(*)::int FROM analytics_visitors WHERE day >= $1 AND day < $2 GROUP BY day ORDER BY 1`,
  },
  usage: {
    title: 'Utilizare pe funcții și ore (R12)',
    sql: 'SELECT day::text AS zi, hour AS ora, name AS eveniment, count AS numar FROM analytics_events WHERE day >= $1 AND day < $2 ORDER BY day, hour, name',
  },
  feedback: {
    title: 'Feedback (R11)',
    sql: `SELECT to_char(submitted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD HH24:MI') AS trimis, source AS sursa, food_rating AS nota_mancare,
            app_rating AS nota_aplicatie, came_because_of_app AS venit_datorita_aplicatiei, missing_feature AS ce_lipseste
          FROM feedback WHERE ${localDay('submitted_at')} >= $1 AND ${localDay('submitted_at')} < $2 ORDER BY submitted_at`,
  },
  estimates: {
    title: 'Estimări pe intervale de timp (R7)',
    sql: `SELECT to_char(computed_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD') AS zi,
            to_char(date_trunc('hour', computed_at AT TIME ZONE ${TZ}) + floor(extract(minute FROM computed_at AT TIME ZONE ${TZ}) / 15) * interval '15 minutes', 'HH24:MI') AS interval,
            round(avg(wait_minutes)::numeric, 1) AS asteptare_min, mode() WITHIN GROUP (ORDER BY level) AS nivel,
            mode() WITHIN GROUP (ORDER BY quality) AS calitate, round(avg(camera_weight)::numeric, 2) AS pondere_camera,
            round(avg(report_weight)::numeric, 2) AS pondere_rapoarte, round(avg(history_weight)::numeric, 2) AS pondere_istoric, count(*) AS calcule
          FROM crowd_estimates WHERE ${localDay('computed_at')} >= $1 AND ${localDay('computed_at')} < $2 GROUP BY 1, 2 ORDER BY 1, 2`,
  },
  reports: {
    title: 'Rapoarte de așteptare (R8)',
    sql: `SELECT to_char(client_reported_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD HH24:MI') AS momentul, waited_minutes AS minute,
            accepted AS acceptat, rejection_reason AS motiv_respingere, (user_id IS NULL) AS anonim
          FROM wait_reports WHERE ${localDay('client_reported_at')} >= $1 AND ${localDay('client_reported_at')} < $2 ORDER BY client_reported_at`,
  },
  calibration: {
    title: 'Calibrare cameră (R8)',
    sql: `SELECT to_char(fitted_at AT TIME ZONE ${TZ}, 'YYYY-MM-DD HH24:MI') AS calculat, slope_min_per_person AS minute_per_persoana,
            intercept_min AS minute_fixe, sample_size AS perechi, mae_minutes AS eroare_medie_min FROM calibration_params ORDER BY fitted_at`,
  },
  loyalty: {
    title: 'Fidelitate (R14, R15)',
    sql: `SELECT occurred_on::text AS zi, count(*)::int AS vizite, count(*) FILTER (WHERE counted_for_loyalty)::int AS puncte,
            count(DISTINCT user_id)::int AS studenti, count(*) FILTER (WHERE source = 'receipt_ocr')::int AS din_ocr,
            count(*) FILTER (WHERE source = 'receipt_manual')::int AS introduse_manual,
            count(*) FILTER (WHERE source = 'staff_confirmed')::int AS confirmate_la_casa
          FROM visits WHERE occurred_on >= $1 AND occurred_on < $2 GROUP BY occurred_on ORDER BY occurred_on`,
  },
  ratings: {
    title: 'Note pe feluri',
    sql: `SELECT d.name_ro AS fel, round(avg(r.stars)::numeric, 2) AS nota_medie, count(*) AS note FROM ratings r JOIN dishes d ON d.id = r.dish_id
          GROUP BY d.name_ro ORDER BY nota_medie DESC`,
  },
  waste: {
    title: 'Porții pregătite (F17)',
    sql: `SELECT m.service_date::text AS zi, d.name_ro AS fel, i.portions_prepared AS portii_pregatite
          FROM daily_menus m JOIN daily_menu_items i ON i.daily_menu_id = m.id JOIN dishes d ON d.id = i.dish_id
          WHERE i.portions_prepared IS NOT NULL AND m.service_date >= $1 AND m.service_date < $2 ORDER BY m.service_date, d.name_ro`,
  },
};

export async function exportCsv(db: Queryable, name: string, from: string, to: string): Promise<string | null> {
  const e = EXPORTS[name];
  if (!e) return null;
  const r = await db.query<Record<string, unknown>>(e.sql, [from, addDays(to, 1)]);
  const cols = r.rows[0] ? Object.keys(r.rows[0]) : [];
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = v instanceof Date ? v.toISOString() : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Excel on Romanian Windows opens UTF-8 CSV correctly only with the BOM.
  return '﻿' + [cols.join(','), ...r.rows.map((row) => cols.map((c) => cell(row[c])).join(','))].join('\r\n') + '\r\n';
}
