/* docs/07-crowding-module.md, "Live fusion", as pure functions. Nothing here touches the
   database or the clock, so every degradation path is a unit test (docs/04 "Testing").

   Three sources, each usable alone:
     camera   people in the queue zone → minutes, through the calibrated line
     reports  what students actually waited, decayed with a 20-minute half-life
     history  the usual wait for this weekday and 15-minute slot

   The nominal 70/30 split is scaled by each source's confidence and renormalised, so a single
   expression yields 70/30, 100 % camera, 100 % reports, or history — with no branching. */

export const NOMINAL_CAMERA = 0.7;
export const NOMINAL_REPORTS = 0.3;
export const REPORT_WINDOW_MIN = 45;
export const HALF_LIFE_MIN = 20;
export const ANONYMOUS_WEIGHT = 0.5;
export const CALIBRATION_PRIOR = { slope: 0.1, intercept: 0.5, k: 10 };

export interface Calibration {
  slope: number;
  intercept: number;
  /** Pairs the fit came from. */
  n: number;
}

export interface ReportSample {
  minutes: number;
  /** When the student finished waiting. */
  at: Date;
  anonymous: boolean;
}

export interface FusionInput {
  now: Date;
  /** Median count of the latest one-minute bucket, and when the last observation arrived. */
  camera: { count: number; lastObservedAt: Date } | null;
  calibration: Calibration | null;
  reports: ReportSample[];
  historyMinutes: number | null;
}

export interface FusionResult {
  waitMinutes: number;
  /** λ_cam = 0.7 · conf_cam — the realised contribution, 0–0.7 (docs/05). */
  cameraWeight: number;
  /** λ_rep = 0.3 · conf_rep — 0–0.3. */
  reportWeight: number;
  /** 1 when history alone produced the number, else 0. */
  historyWeight: number;
  quality: 'live' | 'degraded' | 'estimated';
  confCamera: number;
  confReports: number;
  cameraMinutes: number | null;
  reportMinutes: number | null;
}

const minutesBetween = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000;

/** 1.0 under two minutes old, linear to 0 at ten, 0 beyond or when there is no camera. */
export function cameraConfidence(ageMinutes: number | null): number {
  if (ageMinutes === null || !Number.isFinite(ageMinutes)) return 0;
  if (ageMinutes < 2) return 1;
  if (ageMinutes >= 10) return 0;
  return 1 - (ageMinutes - 2) / 8;
}

/** 0.5^(age/20): a five-minute-old report keeps ~84 %, a forty-minute-old one ~25 %.
 *  Anonymous reports count half, since the per-user limit cannot hold them (docs/10). */
export function reportWeight(ageMinutes: number, anonymous: boolean): number {
  const age = Math.max(0, ageMinutes);
  return Math.pow(0.5, age / HALF_LIFE_MIN) * (anonymous ? ANONYMOUS_WEIGHT : 1);
}

/** The value at which the cumulative weight first reaches half the total. */
export function weightedMedian(values: number[], weights: number[]): number | null {
  const pairs = values
    .map((v, i) => [v, weights[i]] as const)
    .filter(([v, w]) => Number.isFinite(v) && w > 0)
    .sort((a, b) => a[0] - b[0]);
  if (!pairs.length) return null;
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let acc = 0;
  for (let i = 0; i < pairs.length; i++) {
    acc += pairs[i][1];
    // Exactly half: the midpoint of this value and the next, as an ordinary median would.
    if (Math.abs(acc - total / 2) < 1e-12 && i + 1 < pairs.length) return (pairs[i][0] + pairs[i + 1][0]) / 2;
    if (acc > total / 2) return pairs[i][0];
  }
  return pairs[pairs.length - 1][0];
}

/** slope_eff = (n · fitted + k · prior) / (n + k), k = 10 — stable before data exists. */
export function effectiveCalibration(cal: Calibration | null) {
  const { slope, intercept, k } = CALIBRATION_PRIOR;
  if (!cal || cal.n <= 0) return { slope, intercept };
  return {
    slope: (cal.n * cal.slope + k * slope) / (cal.n + k),
    intercept: (cal.n * cal.intercept + k * intercept) / (cal.n + k),
  };
}

export function cameraMinutes(count: number, cal: Calibration | null): number {
  const e = effectiveCalibration(cal);
  return Math.max(0, e.slope * count + e.intercept);
}

export function reportEstimate(reports: ReportSample[], now: Date): { minutes: number | null; confidence: number } {
  const recent = reports.filter((r) => {
    const age = minutesBetween(now, r.at);
    return age >= -2 && age <= REPORT_WINDOW_MIN;
  });
  const weights = recent.map((r) => reportWeight(minutesBetween(now, r.at), r.anonymous));
  const sum = weights.reduce((s, w) => s + w, 0);
  return {
    minutes: weightedMedian(recent.map((r) => r.minutes), weights),
    // Two fresh reports give full confidence; one gives half.
    confidence: Math.min(1, sum / 2),
  };
}

export function fuse(input: FusionInput): FusionResult | null {
  const confCamera = input.camera ? cameraConfidence(minutesBetween(input.now, input.camera.lastObservedAt)) : 0;
  const camMin = input.camera ? cameraMinutes(input.camera.count, input.calibration) : null;
  const rep = reportEstimate(input.reports, input.now);
  const confReports = rep.minutes === null ? 0 : rep.confidence;

  const lambdaCam = NOMINAL_CAMERA * confCamera;
  const lambdaRep = NOMINAL_REPORTS * confReports;

  let waitMinutes: number;
  let historyWeight = 0;
  if (lambdaCam + lambdaRep > 0) {
    waitMinutes = (lambdaCam * (camMin ?? 0) + lambdaRep * (rep.minutes ?? 0)) / (lambdaCam + lambdaRep);
  } else if (input.historyMinutes !== null) {
    waitMinutes = input.historyMinutes;
    historyWeight = 1;
  } else {
    return null; // Nothing to say — the screen states it rather than inventing a number.
  }

  const quality = historyWeight === 1 ? 'estimated' : confCamera >= 0.8 || confReports >= 0.8 ? 'live' : 'degraded';
  return {
    waitMinutes: Math.max(0, waitMinutes),
    cameraWeight: lambdaCam,
    reportWeight: lambdaRep,
    historyWeight,
    quality,
    confCamera,
    confReports,
    cameraMinutes: camMin,
    reportMinutes: rep.minutes,
  };
}

/* ── Rejecting bad reports (docs/07) ───────────────────────────────────────────────────── */

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median absolute deviation from the median. */
export function mad(values: number[]): number {
  const m = median(values);
  if (m === null) return 0;
  return median(values.map((v) => Math.abs(v - m))) ?? 0;
}

/** Camera arbitration: when the camera is confident (≥ 0.8), a report further than
 *  max(5 min, 2.5 · MAD of the recent reports) from the camera's minutes is stored as rejected. */
export function arbitrate(reported: number, camera: { minutes: number; confidence: number } | null, recentMinutes: number[]):
  { accepted: true } | { accepted: false; reason: string } {
  if (!camera || camera.confidence < 0.8) return { accepted: true };
  const limit = Math.max(5, 2.5 * mad(recentMinutes));
  return Math.abs(reported - camera.minutes) > limit
    ? { accepted: false, reason: `camera_disagrees: |${reported} − ${camera.minutes.toFixed(1)}| > ${limit.toFixed(1)}` }
    : { accepted: true };
}
