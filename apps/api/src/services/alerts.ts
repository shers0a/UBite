/* Operational alerts (docs/12): a warning in the log, and an email to ALERT_EMAILS, the named
   people who act on them. */
import type { Ctx } from '../context';
import type { Queryable } from '../db/index';

export async function alert(ctx: Ctx, subject: string, text: string) {
  ctx.log.warn({ alert: subject }, text);
  for (const to of ctx.cfg.ALERT_EMAILS) {
    await ctx.mail.send(to, `[UBite] ${subject}`, text).catch((e) => ctx.log.error({ err: e.message }, 'alert email failed'));
  }
}

/* Counts that start again every day, in the database so every instance and every restart agrees
   (daily_counters, migration 005). */

/** Adds one to today's count, unless it has reached `cap`. Returns the new count, or null when
 *  the cap was already reached. Atomic: two requests at once cannot both take the last place. */
export async function bump(db: Queryable, day: string, key: string, cap?: number): Promise<number | null> {
  const r = await db.query<{ n: number }>(
    `INSERT INTO daily_counters (day, key, n) VALUES ($1, $2, 1)
     ON CONFLICT (day, key) DO UPDATE SET n = daily_counters.n + 1
       WHERE $3::int IS NULL OR daily_counters.n < $3::int
     RETURNING n`, [day, key, cap ?? null],
  );
  return r.rows[0]?.n ?? null;
}

/** Gives back a place taken with bump. */
export async function unbump(db: Queryable, day: string, key: string) {
  await db.query('UPDATE daily_counters SET n = greatest(n - 1, 0) WHERE day = $1 AND key = $2', [day, key]);
}

export async function count(db: Queryable, day: string, key: string): Promise<number> {
  const r = await db.query<{ n: number }>('SELECT n FROM daily_counters WHERE day = $1 AND key = $2', [day, key]);
  return r.rows[0]?.n ?? 0;
}
