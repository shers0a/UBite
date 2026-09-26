/* docs/07 "The core idea: reports calibrate the camera". Every accepted report is a labelled
   example — at the moment the student joined the queue the camera saw N people, and they waited
   W minutes. A robust line through those pairs converts people into minutes.

   Theil–Sen (the median of pairwise slopes) instead of least squares: it tolerates the outliers a
   public reporting feature will contain, and it works with very few points. */
import { median } from './fusion';

export type Pair = [people: number, minutes: number];

export function theilSen(pairs: Pair[]): { slope: number; intercept: number } | null {
  if (pairs.length < 2) return null;
  const slopes: number[] = [];
  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const dx = pairs[j][0] - pairs[i][0];
      if (dx !== 0) slopes.push((pairs[j][1] - pairs[i][1]) / dx);
    }
  }
  const slope = median(slopes);
  if (slope === null) return null;
  const intercept = median(pairs.map(([x, y]) => y - slope * x));
  return intercept === null ? null : { slope, intercept };
}

/** Mean absolute error on held-out pairs, five folds — the R8 conversion accuracy. */
export function crossValidatedMae(pairs: Pair[], folds = 5): number | null {
  if (pairs.length < folds * 2) return null;
  let err = 0;
  let n = 0;
  for (let f = 0; f < folds; f++) {
    const train = pairs.filter((_, i) => i % folds !== f);
    const test = pairs.filter((_, i) => i % folds === f);
    const fit = theilSen(train);
    if (!fit) continue;
    for (const [x, y] of test) {
      err += Math.abs(fit.slope * x + fit.intercept - y);
      n++;
    }
  }
  return n ? err / n : null;
}

/** For large samples, an even subsample keeps the quadratic fit fast without biasing it. */
export function fitCalibration(pairs: Pair[], maxPairs = 1500) {
  const sample = pairs.length > maxPairs ? pairs.filter((_, i) => i % Math.ceil(pairs.length / maxPairs) === 0) : pairs;
  const fit = theilSen(sample);
  if (!fit) return null;
  return { ...fit, n: pairs.length, mae: crossValidatedMae(sample) };
}
