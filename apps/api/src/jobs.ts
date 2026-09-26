/* Scheduled work, in-process (one instance serves the pilot). Every job records its last run in
   job_runs, so a restart at 03:05 neither skips the night nor runs it twice. */
import { hoursOn, localDate, localMinutes, parseHHMM, weekdayOf } from '@ubite/shared';
import type { Ctx } from './context';
import { claimEvery, claimRun, lastRun, markRun } from './services/config-store';
import { rebuildBaseline, recalibrateThresholds, refitCalibration, runFusion } from './services/crowding';
import { rollUpAnalytics } from './services/analytics';
import { loadSchedule, withinHours } from './services/schedule';

async function alert(ctx: Ctx, subject: string, text: string) {
  ctx.log.warn({ alert: subject }, text);
  for (const to of ctx.cfg.ALERT_EMAILS) {
    await ctx.mail.send(to, `[UBite] ${subject}`, text).catch((e) => ctx.log.error({ err: e.message }, 'alert email failed'));
  }
}

export async function nightly(ctx: Ctx) {
  const today = localDate(ctx.now());
  await rebuildBaseline(ctx.db);
  const fit = await refitCalibration(ctx);
  await rollUpAnalytics(ctx.db, today);
  await ctx.db.query('DELETE FROM auth_codes WHERE expires_at < $1::timestamptz - interval \'1 day\'', [ctx.now()]);
  await ctx.db.query('DELETE FROM sessions WHERE expires_at < $1', [ctx.now()]);
  await ctx.db.query("DELETE FROM job_runs WHERE name LIKE 'push:%' AND last_run_at < $1::timestamptz - interval '3 days'", [ctx.now()]);
  ctx.log.info({ calibration: fit ? { slope: fit.slope, n: fit.n, mae: fit.mae } : null }, 'nightly jobs done');
}

export async function tick(ctx: Ctx) {
  const now = ctx.now();
  const today = localDate(now);
  const minute = localMinutes(now);
  const schedule = await loadSchedule(ctx.db);

  // 03:00 — calibration, baseline, analytics roll-up, clean-up.
  if (minute >= 180 && (await claimRun(ctx.db, `nightly:${today}`))) {
    await nightly(ctx).catch((e) => ctx.log.error({ err: e.message }, 'nightly failed'));
  }
  // Monday 03:10 — the level thresholds follow the observed distribution (docs/07).
  if (weekdayOf(today) === 1 && minute >= 190 && (await claimRun(ctx.db, `thresholds:${today}`))) {
    const t = await recalibrateThresholds(ctx).catch((e) => { ctx.log.error({ err: e.message }, 'thresholds failed'); return null; });
    ctx.log.info({ thresholds: t }, 'weekly threshold recalibration');
  }

  const hours = hoursOn(today, schedule.days, schedule.exceptions);
  // 10:00 on an operating day with no menu: catch abandonment before the students do (docs/12).
  if (hours && minute >= 600 && minute < 1020 && (await claimRun(ctx.db, `alert:menu:${today}`))) {
    const m = await ctx.db.query('SELECT 1 FROM daily_menus WHERE service_date = $1 AND published_at IS NOT NULL', [today]);
    if (!m.rowCount) await alert(ctx, 'Meniul de azi nu e publicat', `La 10:00 nu era publicat meniul pentru ${today}. Studenții văd meniul de ieri, marcat ca vechi.`);
  }

  // Camera silent for more than 15 minutes during opening hours: one alert per silence.
  // Twenty minutes after opening, so a camera that boots with the canteen is not flagged.
  if (ctx.cfg.FEATURE_CAMERA && hours && withinHours(schedule, now) && minute >= parseHHMM(hours.opensAt) + 20) {
    const r = await ctx.db.query<{ at: Date | null }>("SELECT max(observed_at) AS at FROM crowd_observations WHERE zone = 'queue'");
    const last = r.rows[0]?.at;
    const silent = !last || now.getTime() - last.getTime() > 15 * 60_000;
    const key = 'alert:camera-silent';
    const sent = await lastRun(ctx.db, key);
    if (silent && (!sent || (last && sent < last) || (!last && now.getTime() - sent.getTime() > 86_400_000))) {
      await markRun(ctx.db, key);
      await alert(ctx, 'Camera nu mai trimite date', `Ultima observație: ${last ? last.toISOString() : 'niciuna'}. Estimarea continuă din rapoarte și istoric.`);
    }
  }
}

/** Serverless hosting has no timers: each request runs what is due — the 30-second fusion, the
 *  minute tick with its nightly and weekly work — each at most once per slot across instances.
 *  A quiet night catches up on the first request, and the platform's daily cron calls it too. */
export async function runDue(ctx: Ctx) {
  const now = ctx.now();
  if (await claimEvery(ctx.db, 'due:fusion', now, 29)) await runFusion(ctx);
  if (await claimEvery(ctx.db, 'due:tick', now, 59)) await tick(ctx);
}

export function startJobs(ctx: Ctx) {
  let fusing = false;
  const fusion = setInterval(async () => {
    if (fusing) return;
    fusing = true;
    try { await runFusion(ctx); } catch (e: any) { ctx.log.error({ err: e.message }, 'fusion failed'); } finally { fusing = false; }
  }, 30_000);
  const minute = setInterval(() => { tick(ctx).catch((e) => ctx.log.error({ err: e.message }, 'tick failed')); }, 60_000);
  // First pass shortly after boot, so a fresh deploy publishes an estimate within seconds.
  setTimeout(() => { runFusion(ctx).catch(() => {}); tick(ctx).catch(() => {}); }, 3_000);
  return () => { clearInterval(fusion); clearInterval(minute); };
}
