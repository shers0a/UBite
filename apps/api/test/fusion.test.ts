/* docs/04 "Testing": the fusion algorithm — decay weighting, weighted median, confidence scaling,
   outlier rejection, and every degradation path. An error here is invisible and publishes a wrong
   number to every user. */
import { describe, expect, it } from 'vitest';
import {
  arbitrate, cameraConfidence, cameraMinutes, effectiveCalibration, fuse, mad, reportEstimate, reportWeight, weightedMedian,
} from '../src/crowding/fusion';
import { crossValidatedMae, theilSen } from '../src/crowding/calibration';
import { LevelHysteresis, levelFor, percentile, thresholdsFromDistribution } from '../src/crowding/levels';

const now = new Date('2026-10-13T10:40:00Z'); // 13:40 in Bucharest
const ago = (min: number) => new Date(now.getTime() - min * 60_000);

describe('report decay (20-minute half-life)', () => {
  it('keeps ~84% after five minutes and ~25% after forty', () => {
    expect(reportWeight(0, false)).toBe(1);
    expect(reportWeight(5, false)).toBeCloseTo(0.8409, 3);
    expect(reportWeight(20, false)).toBeCloseTo(0.5, 6);
    expect(reportWeight(40, false)).toBeCloseTo(0.25, 6);
  });
  it('counts anonymous reports at half weight', () => {
    expect(reportWeight(0, true)).toBe(0.5);
    expect(reportWeight(20, true)).toBeCloseTo(0.25, 6);
  });
});

describe('weighted median', () => {
  it('equals the ordinary median with equal weights', () => {
    expect(weightedMedian([1, 5, 9], [1, 1, 1])).toBe(5);
    expect(weightedMedian([1, 5, 9, 11], [1, 1, 1, 1])).toBe(7);
  });
  it('follows the heavier side', () => {
    expect(weightedMedian([2, 10], [3, 1])).toBe(2);
    expect(weightedMedian([2, 10], [1, 3])).toBe(10);
  });
  it('is not moved by one absurd value', () => {
    expect(weightedMedian([5, 6, 6, 7, 120], [1, 1, 1, 1, 1])).toBe(6);
  });
  it('returns null with nothing to weigh', () => {
    expect(weightedMedian([], [])).toBeNull();
    expect(weightedMedian([4], [0])).toBeNull();
  });
});

describe('camera confidence', () => {
  it('is full under two minutes, linear to zero at ten, zero beyond or when absent', () => {
    expect(cameraConfidence(0)).toBe(1);
    expect(cameraConfidence(1.99)).toBe(1);
    expect(cameraConfidence(2)).toBe(1);
    expect(cameraConfidence(6)).toBeCloseTo(0.5, 6);
    expect(cameraConfidence(10)).toBe(0);
    expect(cameraConfidence(30)).toBe(0);
    expect(cameraConfidence(null)).toBe(0);
  });
});

describe('report confidence', () => {
  it('two fresh reports give full confidence; one gives half', () => {
    expect(reportEstimate([{ minutes: 5, at: now, anonymous: false }], now).confidence).toBeCloseTo(0.5, 6);
    expect(reportEstimate([{ minutes: 5, at: now, anonymous: false }, { minutes: 7, at: now, anonymous: false }], now).confidence).toBe(1);
  });
  it('ignores reports older than 45 minutes', () => {
    const r = reportEstimate([{ minutes: 30, at: ago(50), anonymous: false }, { minutes: 4, at: ago(1), anonymous: false }], now);
    expect(r.minutes).toBe(4);
  });
});

describe('calibration prior blending (k = 10)', () => {
  it('uses the prior with no data', () => {
    expect(effectiveCalibration(null)).toEqual({ slope: 0.1, intercept: 0.5 });
  });
  it('moves towards the fit as pairs accumulate', () => {
    const e = effectiveCalibration({ slope: 0.3, intercept: 1, n: 10 });
    expect(e.slope).toBeCloseTo(0.2, 6);
    expect(e.intercept).toBeCloseTo(0.75, 6);
    expect(cameraMinutes(20, null)).toBeCloseTo(2.5, 6);
  });
});

describe('fusion — every degradation path', () => {
  const camera = { count: 40, lastObservedAt: ago(0.5) }; // prior: 0.1 × 40 + 0.5 = 4.5 min
  const reports = [
    { minutes: 10, at: ago(0), anonymous: false },
    { minutes: 10, at: ago(0), anonymous: false },
  ];

  it('camera fresh + reports fresh → 70 / 30', () => {
    const r = fuse({ now, camera, calibration: null, reports, historyMinutes: 3 })!;
    expect(r.cameraWeight).toBeCloseTo(0.7, 6);
    expect(r.reportWeight).toBeCloseTo(0.3, 6);
    expect(r.historyWeight).toBe(0);
    expect(r.waitMinutes).toBeCloseTo(0.7 * 4.5 + 0.3 * 10, 6);
    expect(r.quality).toBe('live');
  });

  it('camera fresh, no reports → 100% camera', () => {
    const r = fuse({ now, camera, calibration: null, reports: [], historyMinutes: 3 })!;
    expect(r.waitMinutes).toBeCloseTo(4.5, 6);
    expect(r.reportWeight).toBe(0);
    expect(r.quality).toBe('live');
  });

  it('camera down or not installed → 100% reports', () => {
    const r = fuse({ now, camera: null, calibration: null, reports, historyMinutes: 3 })!;
    expect(r.waitMinutes).toBe(10);
    expect(r.cameraWeight).toBe(0);
    expect(r.quality).toBe('live');
  });

  it('stale camera loses weight smoothly', () => {
    const r = fuse({ now, camera: { count: 40, lastObservedAt: ago(6) }, calibration: null, reports, historyMinutes: null })!;
    expect(r.confCamera).toBeCloseTo(0.5, 6);
    expect(r.cameraWeight).toBeCloseTo(0.35, 6);
    expect(r.waitMinutes).toBeCloseTo((0.35 * 4.5 + 0.3 * 10) / 0.65, 6);
  });

  it('neither available → historical baseline, flagged as an estimate', () => {
    const r = fuse({ now, camera: { count: 40, lastObservedAt: ago(15) }, calibration: null, reports: [], historyMinutes: 7 })!;
    expect(r.waitMinutes).toBe(7);
    expect(r.historyWeight).toBe(1);
    expect(r.quality).toBe('estimated');
  });

  it('nothing at all → no number, never an invented one', () => {
    expect(fuse({ now, camera: null, calibration: null, reports: [], historyMinutes: null })).toBeNull();
  });

  it('one old report alone → degraded', () => {
    const r = fuse({ now, camera: null, calibration: null, reports: [{ minutes: 6, at: ago(30), anonymous: true }], historyMinutes: 2 })!;
    expect(r.quality).toBe('degraded');
    expect(r.waitMinutes).toBe(6);
  });
});

describe('camera arbitration', () => {
  it('accepts everything when the camera is not confident', () => {
    expect(arbitrate(40, { minutes: 4, confidence: 0.5 }, [])).toEqual({ accepted: true });
    expect(arbitrate(40, null, [])).toEqual({ accepted: true });
  });
  it('rejects reports further than max(5, 2.5 · MAD) from a confident camera', () => {
    expect(arbitrate(9, { minutes: 5, confidence: 1 }, [4, 5, 6]).accepted).toBe(true);
    const rejected = arbitrate(25, { minutes: 5, confidence: 1 }, [4, 5, 6]);
    expect(rejected.accepted).toBe(false);
  });
  it('widens the band when recent reports disagree among themselves', () => {
    expect(mad([2, 6, 10, 14, 18])).toBe(4);
    expect(arbitrate(14, { minutes: 5, confidence: 1 }, [2, 6, 10, 14, 18]).accepted).toBe(true); // limit = 10
  });
});

describe('Theil–Sen calibration', () => {
  it('recovers a clean line', () => {
    const fit = theilSen([[0, 0.5], [10, 1.5], [20, 2.5], [30, 3.5]])!;
    expect(fit.slope).toBeCloseTo(0.1, 6);
    expect(fit.intercept).toBeCloseTo(0.5, 6);
  });
  it('tolerates an outlier that would drag least squares', () => {
    const fit = theilSen([[0, 0.5], [10, 1.5], [20, 2.5], [30, 3.5], [40, 4.5], [5, 60]])!;
    expect(fit.slope).toBeCloseTo(0.1, 1);
  });
  it('needs two distinct x values', () => {
    expect(theilSen([[5, 1]])).toBeNull();
    expect(theilSen([[5, 1], [5, 3]])).toBeNull();
  });
  it('reports a cross-validated error', () => {
    const pairs: Array<[number, number]> = Array.from({ length: 30 }, (_, i) => [i, 0.2 * i + 1 + ((i % 3) - 1) * 0.5]);
    expect(crossValidatedMae(pairs)!).toBeLessThan(0.8);
  });
});

describe('levels and hysteresis', () => {
  const t = { low: 3, high: 8 };
  it('maps minutes to the bootstrap levels', () => {
    expect(levelFor(2.9, t)).toBe('low');
    expect(levelFor(3, t)).toBe('moderate');
    expect(levelFor(7.9, t)).toBe('moderate');
    expect(levelFor(8, t)).toBe('high');
  });
  it('takes the first estimate as it is', () => {
    const h = new LevelHysteresis();
    expect(h.update(10, t)).toBe('high');
  });
  it('does not change on a crossing smaller than one minute', () => {
    const h = new LevelHysteresis('low');
    expect(h.update(3.5, t)).toBe('low');
    expect(h.update(3.5, t)).toBe('low');
    expect(h.update(3.5, t)).toBe('low');
  });
  it('changes only after two consecutive cycles past the margin', () => {
    const h = new LevelHysteresis('low');
    expect(h.update(4.2, t)).toBe('low');
    expect(h.update(4.2, t)).toBe('moderate');
  });
  it('resets the count when the value falls back', () => {
    const h = new LevelHysteresis('moderate');
    expect(h.update(9.5, t)).toBe('moderate');
    expect(h.update(7.5, t)).toBe('moderate');
    expect(h.update(9.5, t)).toBe('moderate');
    expect(h.update(9.5, t)).toBe('high');
  });
  it('comes down only below threshold − 1', () => {
    const h = new LevelHysteresis('high');
    expect(h.update(7.5, t)).toBe('high');
    expect(h.update(7.5, t)).toBe('high');
    expect(h.update(6.5, t)).toBe('high');
    expect(h.update(6.5, t)).toBe('moderate');
  });
  it('recalibrates thresholds from p33 / p66, only with enough data', () => {
    const values = Array.from({ length: 300 }, (_, i) => i / 20); // 0 … 14.95
    const th = thresholdsFromDistribution(values)!;
    expect(th.low).toBeCloseTo(percentile(values, 1 / 3)!, 1);
    expect(th.high).toBeCloseTo(percentile(values, 2 / 3)!, 1);
    expect(thresholdsFromDistribution(values.slice(0, 100))).toBeNull();
  });
});
