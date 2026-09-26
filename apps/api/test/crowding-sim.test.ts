/* docs/07 end to end: a simulated lunch service run through the real database path — camera
   observations, wait reports with the real arbitration, the 30-second fusion with its stored
   hysteresis, the nightly calibration and baseline — and the published estimate compared, cycle
   by cycle, with the wait a student joining at that moment actually had.

   The queue is simulated, so the true wait is known exactly: arrivals peak at 12:30 and 14:00,
   two tills serve 8 people a minute, the camera misses 7 % of people and sometimes returns a bad
   frame, 15 % of students report (rounded, a little noisy), and 4 % of reports are nonsense. */
import { describe, expect, it } from 'vitest';
import { levelFor } from '../src/crowding/levels';
import { arbitrate, cameraMinutes } from '../src/crowding/fusion';
import { latestCalibration, latestCamera, rebuildBaseline, recentReports, refitCalibration, runFusion, submitReport } from '../src/services/crowding';
import { testContext, type TestCtx } from './helpers';

const OPEN_UTC_HOUR = 8.5; // 11:30 in Bucharest (UTC+3 in October)
const SERVICE_MIN = 330; // 11:30 – 17:00
const STEP_S = 5;
const TILLS_PER_MIN = 8; // people served per minute, both tills together
const OVERHEAD_MIN = 0.5; // tray, water, paying
const TRUE_SLOPE = 1 / TILLS_PER_MIN;
const T = { low: 3, high: 8 };

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const poisson = (r: () => number, mean: number) => {
  const l = Math.exp(-mean);
  let k = 0;
  let p = 1;
  do { k++; p *= r(); } while (p > l);
  return k - 1;
};
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());

/** People arriving per minute, t minutes after opening: a lunch peak and a smaller afternoon one. */
const arrivals = (t: number) => 1.5 + 11 * Math.exp(-(((t - 60) / 25) ** 2)) + 8 * Math.exp(-(((t - 150) / 30) ** 2)) + 4 * Math.exp(-(((t - 240) / 20) ** 2));

interface SimDay {
  /** Queue length at each step. */
  queue: number[];
  /** Mean wait of the people who joined in each step (null when nobody did). */
  joinWait: Array<number | null>;
  camera: Array<{ at: Date; count: number }>;
  reports: Array<{ at: Date; minutes: number; troll: boolean; anonymous: boolean; trueWait: number }>;
}

function simulateDay(date: string, seed: number): SimDay {
  const r = rng(seed);
  const start = Date.parse(`${date}T00:00:00Z`) + OPEN_UTC_HOUR * 3600_000;
  const steps = (SERVICE_MIN * 60) / STEP_S;
  const line: Array<{ joined: number; step: number }> = [];
  const queue: number[] = [];
  const waits: number[][] = Array.from({ length: steps }, () => []);
  const camera: SimDay['camera'] = [];
  const reports: SimDay['reports'] = [];
  let credit = 0;
  for (let s = 0; s < steps; s++) {
    const tMin = (s * STEP_S) / 60;
    const nowMs = start + s * STEP_S * 1000;
    const n = poisson(r, (arrivals(tMin) * STEP_S) / 60);
    for (let i = 0; i < n; i++) line.push({ joined: nowMs + r() * STEP_S * 1000, step: s });
    credit += (TILLS_PER_MIN * STEP_S) / 60;
    while (credit >= 1 && line.length) {
      const p = line.shift()!;
      credit -= 1;
      const paidAt = nowMs + STEP_S * 1000;
      const wait = (paidAt - p.joined) / 60_000 + OVERHEAD_MIN;
      waits[p.step].push(wait);
      if (r() < 0.15) {
        const troll = r() < 0.04;
        const minutes = troll ? Math.floor(r() * 46) : Math.max(0, Math.round(wait + normal(r) * 0.6));
        reports.push({ at: new Date(paidAt + OVERHEAD_MIN * 60_000), minutes, troll, anonymous: r() < 0.2, trueWait: wait });
      }
    }
    if (!line.length) credit = Math.min(credit, 1);
    queue.push(line.length);
    // The camera: 93 % of people detected, a few false positives, 1 % of frames nonsense.
    let seen = 0;
    for (let i = 0; i < line.length; i++) if (r() < 0.93) seen++;
    seen += poisson(r, 0.3);
    if (r() < 0.01) seen = r() < 0.5 ? 0 : seen * 2;
    camera.push({ at: new Date(nowMs), count: seen });
  }
  return { queue, joinWait: waits.map((w) => (w.length ? w.reduce((a, b) => a + b, 0) / w.length : null)), camera, reports };
}

/** The wait a student joining at step s actually had: those who joined within the next minute,
 *  or the fluid estimate when nobody did. */
function trueWaitAt(day: SimDay, s: number) {
  const window = day.joinWait.slice(s, s + 60 / STEP_S).filter((w): w is number => w !== null);
  return window.length ? window.reduce((a, b) => a + b, 0) / window.length : day.queue[s] / TILLS_PER_MIN + OVERHEAD_MIN;
}

interface Replay {
  camera: boolean;
  /** Minutes after opening when the camera stops sending. */
  cameraDiesAt?: number;
  reports: boolean;
}

interface DayStats {
  mae: number;
  within2: number;
  levelAgreement: number;
  levelChanges: number;
  rawLevelChanges: number;
  quality: Record<string, number>;
  trollsRejected: number;
  trollsAccepted: number;
  honestRejected: number;
  /** Honest reports the camera would have rejected if compared with the queue at payment time. */
  honestRejectedAtPayment: number;
  honest: number;
  rows: Array<{ minute: number; published: number; truth: number; cameraWeight: number; reportWeight: number; historyWeight: number; quality: string; camera: number | null; reports: number | null }>;
}

async function replayDay(ctx: TestCtx, date: string, day: SimDay, opt: Replay, users: string[]): Promise<DayStats> {
  const start = Date.parse(`${date}T00:00:00Z`) + OPEN_UTC_HOUR * 3600_000;
  const cycleSteps = 30 / STEP_S;
  let rep = 0;
  const lastUse = new Map<string, number>();
  const stats: DayStats = { mae: 0, within2: 0, levelAgreement: 0, levelChanges: 0, rawLevelChanges: 0, quality: {}, trollsRejected: 0, trollsAccepted: 0, honestRejected: 0, honestRejectedAtPayment: 0, honest: 0, rows: [] };
  let prevLevel: string | null = null;
  let prevRaw: string | null = null;
  let userIdx = 0;

  for (let s = 0; s < day.queue.length; s += cycleSteps) {
    const cycleAt = start + (s + cycleSteps) * STEP_S * 1000;
    const minute = ((s + cycleSteps) * STEP_S) / 60;
    // Camera frames of the last 30 seconds, one insert.
    const alive = opt.camera && (opt.cameraDiesAt === undefined || minute <= opt.cameraDiesAt);
    if (alive) {
      const frames = day.camera.slice(s, s + cycleSteps);
      const values = frames.map((_, i) => `($${i * 2 + 1}, 'queue', $${i * 2 + 2}, 0.8)`).join(',');
      await ctx.db.query(`INSERT INTO crowd_observations (observed_at, zone, person_count, confidence) VALUES ${values}`,
        frames.flatMap((f) => [f.at, f.count]));
    }
    // Reports that arrived during these 30 seconds, through the real endpoint logic.
    while (opt.reports && rep < day.reports.length && day.reports[rep].at.getTime() <= cycleAt) {
      const x = day.reports[rep++];
      let userId: string | null = null;
      if (!x.anonymous) {
        // One report per user per hour: take the next student who has not reported this hour.
        for (let k = 0; k < users.length; k++) {
          const u = users[(userIdx + k) % users.length];
          if (x.at.getTime() - (lastUse.get(u) ?? 0) > 3600_000) { userId = u; userIdx = (userIdx + k + 1) % users.length; break; }
        }
        if (userId) lastUse.set(userId, x.at.getTime());
      }
      ctx.setNow(x.at.toISOString());
      if (!x.troll && alive) {
        const cam = await latestCamera(ctx.db, x.at);
        const recent = (await recentReports(ctx.db, x.at)).map((q) => q.minutes);
        if (cam && !arbitrate(x.minutes, { minutes: cameraMinutes(cam.count, await latestCalibration(ctx.db)), confidence: 1 }, recent).accepted) stats.honestRejectedAtPayment++;
      }
      const res = await submitReport(ctx, { userId, minutes: x.minutes, clientReportedAt: x.at.toISOString() });
      if (x.troll && Math.abs(x.minutes - x.trueWait) > 5) {
        if (res.accepted) stats.trollsAccepted++;
        else stats.trollsRejected++;
      }
      if (!x.troll) { stats.honest++; if (!res.accepted) stats.honestRejected++; }
    }
    ctx.setNow(new Date(cycleAt).toISOString());
    const f = await runFusion(ctx);
    if (!f || minute < 10) continue; // the first ten minutes have nothing to say yet
    const truth = trueWaitAt(day, Math.min(s + cycleSteps, day.queue.length - 1));
    const published = Math.max(0, Math.round(f.result.waitMinutes));
    stats.rows.push({ minute, published, truth, cameraWeight: f.result.cameraWeight, reportWeight: f.result.reportWeight, historyWeight: f.result.historyWeight, quality: f.result.quality, camera: f.result.cameraMinutes, reports: f.result.reportMinutes });
    stats.mae += Math.abs(published - truth);
    if (Math.abs(published - truth) <= 2) stats.within2++;
    const trueLevel = levelFor(truth, T);
    if (f.level === trueLevel) stats.levelAgreement++;
    if (prevLevel && prevLevel !== f.level) stats.levelChanges++;
    const raw = levelFor(f.result.waitMinutes, T);
    if (prevRaw && prevRaw !== raw) stats.rawLevelChanges++;
    prevLevel = f.level;
    prevRaw = raw;
    stats.quality[f.result.quality] = (stats.quality[f.result.quality] ?? 0) + 1;
  }
  const n = stats.rows.length;
  stats.mae /= n;
  stats.within2 /= n;
  stats.levelAgreement /= n;
  return stats;
}

async function setup(seed: number) {
  const ctx = await testContext();
  const u = await ctx.db.query<{ id: string }>(
    `INSERT INTO users (email, role) SELECT 'sim' || g || '@s.unibuc.ro', 'student' FROM generate_series(1, 400) g RETURNING id`,
  );
  return { ctx, users: u.rows.map((x) => x.id), seed };
}

/** A previous Tuesday with the same kind of traffic, then the nightly jobs (calibration, baseline). */
async function priorWeek(env: Awaited<ReturnType<typeof setup>>, opt: Replay) {
  const day = simulateDay('2026-10-06', env.seed + 1);
  await replayDay(env.ctx, '2026-10-06', day, opt, env.users);
  env.ctx.setNow('2026-10-07T00:10:00Z'); // 03:10 the next night
  const fit = await refitCalibration(env.ctx);
  await rebuildBaseline(env.ctx.db);
  return fit;
}

const summary = (name: string, s: DayStats) =>
  `${name}: MAE ${s.mae.toFixed(2)} min · within ±2 min ${(s.within2 * 100).toFixed(0)} % · level right ${(s.levelAgreement * 100).toFixed(0)} % · level changes ${s.levelChanges} (raw ${s.rawLevelChanges}) · quality ${JSON.stringify(s.quality)}`;

describe('a simulated service day, through the database (docs/07)', () => {
  it('camera + reports: learns the till speed and tracks the true wait', async () => {
    const env = await setup(11);
    const fit = await priorWeek(env, { camera: true, reports: true });
    // The line it learned: the till speed (1/8 min a person), seen through a camera that misses 7 %.
    expect(fit).not.toBeNull();
    expect(fit!.n).toBeGreaterThan(100);
    expect(fit!.slope).toBeGreaterThan(TRUE_SLOPE * 0.9);
    expect(fit!.slope).toBeLessThan(TRUE_SLOPE / 0.93 * 1.15);
    expect(fit!.mae!).toBeLessThan(1.5);
    const cal = await latestCalibration(env.ctx.db);
    expect(cameraMinutes(40, cal)).toBeGreaterThan(40 * TRUE_SLOPE);

    const day = simulateDay('2026-10-13', env.seed);
    const s = await replayDay(env.ctx, '2026-10-13', day, { camera: true, reports: true }, env.users);
    console.info(summary('camera + reports', s), `· calibration ${fit!.slope.toFixed(3)} min/person + ${fit!.intercept.toFixed(2)} (n ${fit!.n}, MAE ${fit!.mae!.toFixed(2)})`,
      `· nonsense reports rejected ${s.trollsRejected}/${s.trollsRejected + s.trollsAccepted} · honest rejected ${s.honestRejected}/${s.honest}`);
    const partMae = (k: 'camera' | 'reports') => s.rows.reduce((a, r) => a + Math.abs(Math.round(r[k] ?? 0) - r.truth), 0) / s.rows.length;
    console.info(`  camera part alone: MAE ${partMae('camera').toFixed(2)} · reports part alone: MAE ${partMae('reports').toFixed(2)} · honest reports a payment-time comparison would have rejected: ${s.honestRejectedAtPayment}`);
    // The calibrated camera on its own is within half a minute. The 70/30 blend the team asked for
    // (docs/07) is worse at the peaks, because a report describes the queue its author joined
    // W minutes earlier: the estimate trails a building queue and overstates a clearing one.
    expect(partMae('camera')).toBeLessThan(0.6);
    expect(s.mae).toBeLessThan(1.3);
    expect(s.within2).toBeGreaterThan(0.75);
    expect(s.levelAgreement).toBeGreaterThan(0.8);
    // Hysteresis: the badge never moves more than the raw number would make it.
    expect(s.levelChanges).toBeLessThanOrEqual(s.rawLevelChanges);
    expect(s.levelChanges).toBeLessThanOrEqual(12);
    // The camera is fresh: 70/30 whenever reports are, and always "live".
    expect(s.rows.every((r) => r.cameraWeight > 0.69 && r.quality === 'live')).toBe(true);
    expect(s.rows.some((r) => Math.abs(r.reportWeight - 0.3) < 1e-9)).toBe(true);
    // Arbitration throws out nonsense and keeps the truth.
    expect(s.trollsRejected).toBeGreaterThan(s.trollsAccepted);
    expect(s.honestRejected / s.honest).toBeLessThan(0.03);
  }, 180_000);

  it('reports only (no camera): still a usable estimate, marked by its confidence', async () => {
    const env = await setup(21);
    await priorWeek(env, { camera: false, reports: true });
    const day = simulateDay('2026-10-13', env.seed);
    const s = await replayDay(env.ctx, '2026-10-13', day, { camera: false, reports: true }, env.users);
    console.info(summary('reports only', s));
    expect(s.rows.every((r) => r.cameraWeight === 0)).toBe(true);
    // Reports describe the queue a student joined W minutes ago, so they lag the peaks — but
    // the number stays useful.
    expect(s.mae).toBeLessThan(2.5);
    expect(s.levelAgreement).toBeGreaterThan(0.65);
    expect(s.quality.live).toBeGreaterThan(0);
  }, 180_000);

  it('camera goes silent at 13:30: confidence decays over 2–10 minutes, then reports carry it', async () => {
    const env = await setup(31);
    await priorWeek(env, { camera: true, reports: true });
    const day = simulateDay('2026-10-13', env.seed);
    const diesAt = 120;
    const s = await replayDay(env.ctx, '2026-10-13', day, { camera: true, cameraDiesAt: diesAt, reports: true }, env.users);
    console.info(summary('camera dies at 13:30', s));
    const w = (m: number) => s.rows.find((r) => r.minute === m)!;
    expect(w(diesAt + 1).cameraWeight).toBeCloseTo(0.7, 6); // < 2 minutes old
    expect(w(diesAt + 6).cameraWeight).toBeGreaterThan(0.2);
    expect(w(diesAt + 6).cameraWeight).toBeLessThan(0.6); // decaying
    expect(s.rows.filter((r) => r.minute >= diesAt + 10.5).every((r) => r.cameraWeight === 0)).toBe(true);
    const after = s.rows.filter((r) => r.minute > diesAt + 10);
    const maeAfter = after.reduce((a, r) => a + Math.abs(r.published - r.truth), 0) / after.length;
    expect(maeAfter).toBeLessThan(2.5);
  }, 180_000);

  it('no camera and no reports today: the usual wait for this slot, flagged as estimated', async () => {
    const env = await setup(41);
    await priorWeek(env, { camera: true, reports: true });
    const day = simulateDay('2026-10-13', env.seed);
    const s = await replayDay(env.ctx, '2026-10-13', day, { camera: false, reports: false }, env.users);
    console.info(summary('history only', s));
    expect(s.rows.every((r) => r.historyWeight === 1 && r.quality === 'estimated')).toBe(true);
    // Same weekday, same kind of day: the baseline is a fair guess.
    expect(s.mae).toBeLessThan(3);
  }, 180_000);
});
