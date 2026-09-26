/* The database side of docs/07: gather the three sources, fuse, apply hysteresis, publish one
   row to crowd_estimates every 30 seconds; nightly calibration and baseline; weekly thresholds. */
import type { CrowdingCurrent, CrowdingTypical, CrowdLevel, WaitReportResponse } from '@ubite/shared';
import { formatHHMM, hoursOn, localDate, localMinutes, parseHHMM, weekdayOf, zonedParts } from '@ubite/shared';
import type { Ctx } from '../context';
import { HttpError } from '../context';
import { isUniqueViolation, type Queryable } from '../db/index';
import { arbitrate, cameraConfidence, cameraMinutes, fuse, type Calibration, type FusionResult, type ReportSample } from '../crowding/fusion';
import { fitCalibration, type Pair } from '../crowding/calibration';
import { LevelHysteresis, thresholdsFromDistribution, type HysteresisState } from '../crowding/levels';
import { getCrowdingConfig, setCrowdingConfig } from './config-store';
import { loadSchedule, withinHours } from './schedule';
import { notifyQuietNow } from './notifications';

/* ── Sources ──────────────────────────────────────────────────────────────────────────── */

/** The median count of the one-minute bucket that ends at the last observation. A median, so a
 *  single bad frame cannot move the published number. */
export async function latestCamera(db: Queryable, now: Date): Promise<{ count: number; lastObservedAt: Date } | null> {
  const last = await db.query<{ observed_at: Date }>(
    `SELECT observed_at FROM crowd_observations WHERE zone = 'queue' AND observed_at <= $1
     ORDER BY observed_at DESC LIMIT 1`, [now],
  );
  const at = last.rows[0]?.observed_at;
  if (!at || now.getTime() - at.getTime() > 10 * 60_000) return null;
  const m = await db.query<{ m: number }>(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY person_count)::float8 AS m FROM crowd_observations
     WHERE zone = 'queue' AND observed_at > $1::timestamptz - interval '60 seconds' AND observed_at <= $1`, [at],
  );
  return { count: Number(m.rows[0]?.m ?? 0), lastObservedAt: at };
}

export async function latestCalibration(db: Queryable): Promise<Calibration | null> {
  const r = await db.query<{ slope_min_per_person: number; intercept_min: number; sample_size: number }>(
    'SELECT slope_min_per_person, intercept_min, sample_size FROM calibration_params ORDER BY fitted_at DESC LIMIT 1',
  );
  const c = r.rows[0];
  return c ? { slope: c.slope_min_per_person, intercept: c.intercept_min, n: c.sample_size } : null;
}

export async function recentReports(db: Queryable, now: Date): Promise<ReportSample[]> {
  const r = await db.query<{ waited_minutes: number; client_reported_at: Date; user_id: string | null }>(
    `SELECT waited_minutes, client_reported_at, user_id FROM wait_reports
     WHERE accepted AND client_reported_at > $1::timestamptz - interval '45 minutes'
       AND client_reported_at <= $1::timestamptz + interval '2 minutes'`, [now],
  );
  return r.rows.map((x) => ({ minutes: x.waited_minutes, at: x.client_reported_at, anonymous: !x.user_id }));
}

export async function historyMinutes(db: Queryable, now: Date): Promise<number | null> {
  const p = zonedParts(now);
  const slot = p.hour * 60 + Math.floor(p.minute / 15) * 15;
  const r = await db.query<{ wait_minutes: number }>(
    'SELECT wait_minutes FROM historical_baseline WHERE weekday = $1 AND slot_minute = $2', [p.weekday, slot],
  );
  return r.rows[0]?.wait_minutes ?? null;
}

/* ── The 30-second job ────────────────────────────────────────────────────────────────── */

export async function computeFusion(db: Queryable, now: Date): Promise<FusionResult | null> {
  const [camera, calibration, reports, history] = await Promise.all([
    latestCamera(db, now), latestCalibration(db), recentReports(db, now), historyMinutes(db, now),
  ]);
  return fuse({ now, camera, calibration, reports, historyMinutes: history });
}

/** The level's hysteresis between cycles, kept in the database so a restart — or a serverless
 *  host that computes each cycle on a different instance — neither resets nor forks it. */
interface StoredHysteresis extends HysteresisState {
  /** The local date it belongs to: each opening starts fresh. */
  day: string;
  at: string;
}

/** A pending change older than this is forgotten: "two consecutive cycles" means two in a row. */
const PENDING_GAP_MS = 5 * 60_000;

export async function runFusion(ctx: Ctx): Promise<{ level: CrowdLevel; result: FusionResult } | null> {
  const now = ctx.now();
  const schedule = await loadSchedule(ctx.db);
  if (!withinHours(schedule, now)) return null;

  const result = await computeFusion(ctx.db, now);
  if (!result) return null;
  const { thresholds } = await getCrowdingConfig(ctx.db);
  const today = localDate(now);

  const { level, before } = await ctx.db.tx(async (q) => {
    // One cycle at a time: the row lock orders two cycles that start together.
    await q.query(`INSERT INTO app_config (key, value) VALUES ('crowding_state', 'null') ON CONFLICT (key) DO NOTHING`);
    const r = await q.query<{ value: StoredHysteresis | null }>("SELECT value FROM app_config WHERE key = 'crowding_state' FOR UPDATE");
    const saved = r.rows[0]?.value;
    const fresh = saved && saved.day === today ? saved : null;
    const recent = !!fresh && now.getTime() - Date.parse(fresh.at) <= PENDING_GAP_MS;
    const h = new LevelHysteresis(fresh ? { current: fresh.current, pending: recent ? fresh.pending : null } : null);
    const before = h.current;
    const level = h.update(result.waitMinutes, thresholds);
    const state: StoredHysteresis = { ...h.state, day: today, at: now.toISOString() };
    await q.query("UPDATE app_config SET value = $1, updated_at = now() WHERE key = 'crowding_state'", [JSON.stringify(state)]);
    await q.query(
      `INSERT INTO crowd_estimates (computed_at, wait_minutes, level, camera_weight, report_weight, history_weight, quality)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [now, result.waitMinutes, level, result.cameraWeight, result.reportWeight, result.historyWeight, result.quality],
    );
    return { level, before };
  });
  if (level === 'low' && before !== 'low') {
    await notifyQuietNow(ctx, now).catch((e) => ctx.log.warn({ err: e.message }, 'quiet-now notification failed'));
  }
  return { level, result };
}

export async function currentEstimate(ctx: Ctx): Promise<CrowdingCurrent> {
  const now = ctx.now();
  const schedule = await loadSchedule(ctx.db);
  const open = withinHours(schedule, now);
  const { thresholds } = await getCrowdingConfig(ctx.db);
  const base = { serverTime: now.toISOString(), open, thresholds: { low: thresholds.low, high: thresholds.high } };
  if (!open) return { ...base, level: null, waitMinutes: null, quality: null, computedAt: null };
  const r = await ctx.db.query<{ computed_at: Date; wait_minutes: number; level: CrowdLevel; quality: 'live' | 'degraded' | 'estimated' }>(
    `SELECT computed_at, wait_minutes, level, quality FROM crowd_estimates
     WHERE computed_at > $1::timestamptz - interval '10 minutes' AND computed_at <= $1
     ORDER BY computed_at DESC LIMIT 1`, [now],
  );
  const e = r.rows[0];
  if (!e) return { ...base, level: null, waitMinutes: null, quality: null, computedAt: null };
  return {
    ...base,
    level: e.level,
    waitMinutes: Math.max(0, Math.round(e.wait_minutes)),
    quality: e.quality,
    computedAt: e.computed_at.toISOString(),
  };
}

/* ── Wait reports (docs/03 F6, docs/07 "Rejecting bad reports") ───────────────────────── */

export async function submitReport(
  ctx: Ctx, input: { userId: string | null; minutes: number; clientReportedAt?: string },
): Promise<WaitReportResponse> {
  const now = ctx.now();
  let at = input.clientReportedAt ? new Date(input.clientReportedAt) : now;
  if (Number.isNaN(at.getTime())) at = now;
  if (at.getTime() > now.getTime() + 2 * 60_000) at = now;
  if (now.getTime() - at.getTime() > 3 * 3600_000) throw new HttpError(422, 'too_old', 'The report is older than three hours.');

  // Opening hours only — rejected outright, with ten minutes' grace for whoever paid at closing.
  const schedule = await loadSchedule(ctx.db);
  if (!withinHours(schedule, at, 10)) throw new HttpError(422, 'closed', 'Reports are accepted only while the canteen is open.');

  const minutes = Math.round(input.minutes);
  if (!(minutes >= 0 && minutes <= 120)) throw new HttpError(422, 'invalid_minutes');

  // Camera arbitration, only when the camera is confident. The report describes the queue the
  // student joined, W minutes before they paid — compare it with what the camera predicted then,
  // exactly as calibration pairs them. Compared with the queue at payment time, a student who
  // waited through a queue that has just cleared would be rejected for telling the truth.
  const joinedAt = new Date(at.getTime() - minutes * 60_000);
  const camera = await latestCamera(ctx.db, joinedAt);
  let verdict: { accepted: boolean; reason?: string } = { accepted: true };
  if (camera) {
    const conf = cameraConfidence((joinedAt.getTime() - camera.lastObservedAt.getTime()) / 60_000);
    const recent = (await recentReports(ctx.db, at)).map((r) => r.minutes);
    verdict = arbitrate(minutes, { minutes: cameraMinutes(camera.count, await latestCalibration(ctx.db)), confidence: conf }, recent);
  }

  try {
    await ctx.db.query(
      `INSERT INTO wait_reports (user_id, reported_at, waited_minutes, client_reported_at, accepted, rejection_reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.userId, now, minutes, at, verdict.accepted, verdict.accepted ? null : verdict.reason],
    );
  } catch (e) {
    if (isUniqueViolation(e, 'wait_reports_one_per_hour')) {
      const next = new Date(Math.ceil(now.getTime() / 3600_000) * 3600_000);
      throw new HttpError(429, 'already_reported', 'One report per hour.', { retryAfterSeconds: Math.ceil((next.getTime() - now.getTime()) / 1000) });
    }
    throw e;
  }
  // The student sees the estimate move — the report loop closes in one interaction.
  if (verdict.accepted) await runFusion(ctx);
  return { accepted: verdict.accepted, reason: verdict.accepted ? undefined : 'camera_disagrees', estimate: await currentEstimate(ctx) };
}

/* ── Typical crowding by hour (docs/03 F8) ────────────────────────────────────────────── */

export async function typicalToday(ctx: Ctx): Promise<CrowdingTypical> {
  const now = ctx.now();
  const date = localDate(now);
  const weekday = weekdayOf(date);
  const schedule = await loadSchedule(ctx.db);
  const hours = hoursOn(date, schedule.days, schedule.exceptions);
  const empty: CrowdingTypical = { available: false, date, weekday, slots: [] };
  if (!ctx.cfg.FEATURE_PREDICTION || !hours) return empty;

  const rows = await ctx.db.query<{ slot_minute: number; wait_minutes: number; sample_size: number }>(
    'SELECT slot_minute, wait_minutes, sample_size FROM historical_baseline WHERE weekday = $1', [weekday],
  );
  const bySlot = new Map(rows.rows.map((r) => [r.slot_minute, r]));
  const slots: CrowdingTypical['slots'] = [];
  for (let m = parseHHMM(hours.opensAt); m < parseHHMM(hours.closesAt); m += 30) {
    const parts = [bySlot.get(m), bySlot.get(m + 15)].filter(Boolean) as Array<{ wait_minutes: number; sample_size: number }>;
    const n = parts.reduce((s, p) => s + p.sample_size, 0);
    slots.push({ time: formatHHMM(m), waitMinutes: n ? Math.round(parts.reduce((s, p) => s + p.wait_minutes * p.sample_size, 0) / n) : null });
  }
  // Hidden in week one: a flat, wrong chart damages trust more than an absent one (docs/07).
  const first = await ctx.db.query<{ first: Date | null }>('SELECT min(computed_at) AS first FROM crowd_estimates WHERE history_weight = 0');
  const since = first.rows[0]?.first;
  const weekOld = !!since && now.getTime() - since.getTime() >= 7 * 86_400_000;
  const covered = slots.filter((s) => s.waitMinutes !== null).length;
  const available = weekOld && slots.length > 0 && covered / slots.length >= 0.6;
  return { available, date, weekday, slots: available ? slots : [] };
}

/* ── Nightly and weekly jobs ──────────────────────────────────────────────────────────── */

/** Pairs each accepted report with the camera's count when that student joined the queue,
 *  at t − W, and refits the line. */
export async function refitCalibration(ctx: Ctx) {
  const r = await ctx.db.query<{ w: number; n: number | null }>(
    `SELECT r.waited_minutes AS w,
       (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY o.person_count)::float8 FROM crowd_observations o
         WHERE o.zone = 'queue'
           AND o.observed_at BETWEEN r.client_reported_at - make_interval(mins => r.waited_minutes) - interval '90 seconds'
                                 AND r.client_reported_at - make_interval(mins => r.waited_minutes) + interval '90 seconds') AS n
     FROM wait_reports r
     WHERE r.accepted AND r.client_reported_at > $1::timestamptz - interval '60 days'
     ORDER BY r.client_reported_at`, [ctx.now()],
  );
  const pairs: Pair[] = r.rows.filter((x) => x.n !== null).map((x) => [Number(x.n), x.w]);
  const fit = fitCalibration(pairs);
  if (!fit) return null;
  await ctx.db.query(
    'INSERT INTO calibration_params (fitted_at, slope_min_per_person, intercept_min, sample_size, mae_minutes) VALUES ($1, $2, $3, $4, $5)',
    [ctx.now(), fit.slope, fit.intercept, fit.n, fit.mae],
  );
  return fit;
}

/** Median published wait per weekday × 15-minute slot, from estimates that had a live signal —
 *  history-only rows are excluded so the baseline never feeds on itself. */
export async function rebuildBaseline(db: Queryable) {
  await db.query('DELETE FROM historical_baseline');
  await db.query(
    `INSERT INTO historical_baseline (weekday, slot_minute, wait_minutes, sample_size, computed_at)
     SELECT extract(isodow FROM local)::int,
            (extract(hour FROM local) * 60 + floor(extract(minute FROM local) / 15) * 15)::int,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY wait_minutes)::real,
            count(*)::int, now()
     FROM (SELECT computed_at AT TIME ZONE 'Europe/Bucharest' AS local, wait_minutes
           FROM crowd_estimates WHERE history_weight = 0) e
     GROUP BY 1, 2`,
  );
}

export async function recalibrateThresholds(ctx: Ctx) {
  const cfg = await getCrowdingConfig(ctx.db);
  if (cfg.thresholds.mode !== 'auto') return null;
  const r = await ctx.db.query<{ wait_minutes: number }>(
    `SELECT wait_minutes FROM crowd_estimates
     WHERE history_weight = 0 AND computed_at > $1::timestamptz - interval '28 days'`, [ctx.now()],
  );
  const t = thresholdsFromDistribution(r.rows.map((x) => x.wait_minutes));
  if (!t) return null;
  await setCrowdingConfig(ctx.db, {
    ...cfg,
    thresholds: { mode: 'auto', low: t.low, high: t.high, fittedAt: ctx.now().toISOString(), sampleSize: r.rows.length },
  });
  return t;
}

export function minutesNow(now: Date) {
  return localMinutes(now);
}
