/* docs/07 "Mapping minutes to the three levels". The form requires low / moderate / high; they
   come from percentiles of the observed distribution (p33, p66), recalibrated weekly, with
   bootstrap values for week one. Hysteresis keeps the badge from flickering at a boundary. */
import type { CrowdLevel } from '@ubite/shared';
import { BOOTSTRAP_THRESHOLDS } from '@ubite/shared';

export interface Thresholds {
  low: number;
  high: number;
}

const ORDER: CrowdLevel[] = ['low', 'moderate', 'high'];

/** low: W < p33 · moderate: p33 ≤ W < p66 · high: W ≥ p66. */
export function levelFor(minutes: number, t: Thresholds = BOOTSTRAP_THRESHOLDS): CrowdLevel {
  if (minutes < t.low) return 'low';
  if (minutes < t.high) return 'moderate';
  return 'high';
}

export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
}

/** Weekly recalibration. Returns null — keep the current thresholds — while data is thin. */
export function thresholdsFromDistribution(minutes: number[], minSamples = 300): Thresholds | null {
  if (minutes.length < minSamples) return null;
  const low = percentile(minutes, 1 / 3);
  const high = percentile(minutes, 2 / 3);
  if (low === null || high === null || high - low < 1) return null;
  return { low: round1(low), high: round1(high) };
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export interface HysteresisState {
  current: CrowdLevel | null;
  pending: { level: CrowdLevel; cycles: number } | null;
}

/** A level change needs the threshold crossed by at least one minute, held for two consecutive
 *  computation cycles. The first estimate of the day is taken as it is. The state is plain data,
 *  so it can be stored between cycles and survive a restart. */
export class LevelHysteresis {
  current: CrowdLevel | null = null;
  private pending: HysteresisState['pending'] = null;

  constructor(initial: CrowdLevel | HysteresisState | null = null) {
    if (initial && typeof initial === 'object') {
      this.current = initial.current;
      this.pending = initial.pending;
    } else {
      this.current = initial;
    }
  }

  get state(): HysteresisState {
    return { current: this.current, pending: this.pending };
  }

  reset(level: CrowdLevel | null = null) {
    this.current = level;
    this.pending = null;
  }

  update(minutes: number, t: Thresholds): CrowdLevel {
    if (this.current === null) {
      this.current = levelFor(minutes, t);
      return this.current;
    }
    const candidate = this.candidate(minutes, t, this.current);
    if (candidate === this.current) {
      this.pending = null;
      return this.current;
    }
    this.pending = this.pending && this.pending.level === candidate ? { level: candidate, cycles: this.pending.cycles + 1 } : { level: candidate, cycles: 1 };
    if (this.pending.cycles >= 2) {
      this.current = candidate;
      this.pending = null;
    }
    return this.current;
  }

  /** The level the minutes point to once the one-minute margin is applied away from `current`:
   *  up past a threshold needs threshold + 1, down past it needs threshold − 1. */
  private candidate(minutes: number, t: Thresholds, current: CrowdLevel): CrowdLevel {
    const i = ORDER.indexOf(current);
    const up = [t.low, t.high];
    let level = i;
    while (level < 2 && minutes >= up[level] + 1) level++;
    while (level > 0 && minutes <= up[level - 1] - 1) level--;
    return ORDER[level];
  }
}
