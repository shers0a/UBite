/* Self-hosted, cookie-free, aggregate-only analytics (docs/11, D-18) — the evidence for R9, R11
   and R12, live from the first public day.

   Unique visitors per day: a SHA-256 of (daily salt, IP, user agent). The salt is random, kept
   for one day, then deleted along with the hashes once the day is rolled up into a number —
   after that nothing can link a visitor across days, or back to a device.
   Unique visitors over the pilot: the phone sends a "first_visit" event once, from a flag in its
   own storage; the server only ever counts it. No identifier leaves the phone. */
import crypto from 'node:crypto';
import type { AnalyticsEvent } from '@ubite/shared';
import { ANALYTICS_EVENTS, localDate, zonedParts } from '@ubite/shared';
import type { Ctx } from '../context';
import type { Queryable } from '../db/index';

const ALLOWED = new Set<string>(ANALYTICS_EVENTS);

async function saltFor(db: Queryable, day: string): Promise<string> {
  await db.query('INSERT INTO analytics_salts (day, salt) VALUES ($1, $2) ON CONFLICT (day) DO NOTHING', [day, crypto.randomBytes(24).toString('hex')]);
  const r = await db.query<{ salt: string }>('SELECT salt FROM analytics_salts WHERE day = $1', [day]);
  return r.rows[0].salt;
}

export async function recordEvent(ctx: Ctx, name: string, meta: { ip: string; userAgent: string }) {
  if (!ALLOWED.has(name)) return false;
  const now = ctx.now();
  const day = localDate(now);
  const hour = zonedParts(now).hour;
  await ctx.db.query(
    `INSERT INTO analytics_events (day, hour, name, count) VALUES ($1, $2, $3, 1)
     ON CONFLICT (day, hour, name) DO UPDATE SET count = analytics_events.count + 1`, [day, hour, name],
  );
  if (name === 'pageview') {
    const salt = await saltFor(ctx.db, day);
    const visitor = crypto.createHash('sha256').update(`${salt}|${meta.ip}|${meta.userAgent}`).digest('hex').slice(0, 32);
    await ctx.db.query('INSERT INTO analytics_visitors (day, visitor) VALUES ($1, $2) ON CONFLICT DO NOTHING', [day, visitor]);
  }
  return true;
}

/** Nightly: finished days become a single number; their hashes and salts are deleted. */
export async function rollUpAnalytics(db: Queryable, today: string) {
  await db.query(
    `INSERT INTO analytics_daily (day, unique_visitors)
     SELECT day, count(*)::int FROM analytics_visitors WHERE day < $1 GROUP BY day
     ON CONFLICT (day) DO UPDATE SET unique_visitors = EXCLUDED.unique_visitors`, [today],
  );
  await db.query('DELETE FROM analytics_visitors WHERE day < $1', [today]);
  await db.query('DELETE FROM analytics_salts WHERE day < $1', [today]);
}

/** Visitors per day, whether rolled up already or still counting today. */
export async function visitorsByDay(db: Queryable, from: string, to: string): Promise<Map<string, number>> {
  const r = await db.query<{ day: string; n: number }>(
    `SELECT day::text AS day, unique_visitors AS n FROM analytics_daily WHERE day BETWEEN $1 AND $2
     UNION ALL
     SELECT day::text, count(*)::int FROM analytics_visitors WHERE day BETWEEN $1 AND $2
       AND day NOT IN (SELECT day FROM analytics_daily) GROUP BY day`, [from, to],
  );
  return new Map(r.rows.map((x) => [x.day, x.n]));
}

export type { AnalyticsEvent };
