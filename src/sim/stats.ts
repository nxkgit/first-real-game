/**
 * Small statistics toolkit for the balance experiments. Plain functions, no dependencies, so every
 * number the tooling prints can be traced to a few lines here. All intervals are 95%.
 *
 * Conventions:
 *  - A "sample" is a list of numbers, one per simulated fight (or run).
 *  - A "Summary" is the compact form (mean, sd, n) that baselines store instead of raw samples.
 *  - Paired comparisons take two samples whose i-th entries share a seed ("common random numbers").
 */

export const Z95 = 1.959964;

// two-sided 95% t critical values for 1..30 degrees of freedom
const T95 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093,
  2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042,
];

/** Two-sided 95% critical value for a t distribution with `df` degrees of freedom (normal for large df). */
export function tCrit95(df: number): number {
  if (df < 1) return Infinity;
  if (df <= 30) return T95[Math.floor(df) - 1];
  if (df <= 40) return 2.021;
  if (df <= 60) return 2.0;
  if (df <= 120) return 1.98;
  return Z95;
}

export interface Summary {
  mean: number;
  sd: number;
  n: number;
}

export interface Interval extends Summary {
  /** Standard error of the mean. */
  se: number;
  lo: number;
  hi: number;
}

export const sum = (xs: ArrayLike<number>): number => {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  return s;
};

export const mean = (xs: ArrayLike<number>): number => (xs.length === 0 ? 0 : sum(xs) / xs.length);

/** Sample variance (n - 1 denominator); 0 for fewer than two values. */
export function variance(xs: ArrayLike<number>): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (xs[i] - m) ** 2;
  return s / (xs.length - 1);
}

export const sd = (xs: ArrayLike<number>): number => Math.sqrt(variance(xs));

export function summarize(xs: ArrayLike<number>): Summary {
  return { mean: mean(xs), sd: sd(xs), n: xs.length };
}

/** Mean with a t-based 95% confidence interval. */
export function meanCI(xs: ArrayLike<number>): Interval {
  return intervalOf(summarize(xs));
}

export function intervalOf(s: Summary): Interval {
  const se = s.n > 0 ? s.sd / Math.sqrt(s.n) : 0;
  const half = s.n > 1 ? tCrit95(s.n - 1) * se : 0;
  return { ...s, se, lo: s.mean - half, hi: s.mean + half };
}

export interface Proportion {
  p: number;
  n: number;
  lo: number;
  hi: number;
}

/** Wilson score interval for a rate: behaves well near 0% and 100%, where the plain normal interval does not. */
export function wilson(successes: number, n: number): Proportion {
  if (n === 0) return { p: 0, n: 0, lo: 0, hi: 1 };
  const p = successes / n;
  const z2 = Z95 * Z95;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (Z95 * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { p, n, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
}

/**
 * Paired difference `after - before` over matched units (entry i of each sample used the same
 * seed). The interval comes from the spread of the per-unit differences, which is far tighter than
 * comparing two independent samples because shared luck cancels.
 */
export function pairedDiff(before: ArrayLike<number>, after: ArrayLike<number>): Interval {
  if (before.length !== after.length) throw new Error('paired samples must be the same length');
  const d = new Float64Array(before.length);
  for (let i = 0; i < d.length; i++) d[i] = after[i] - before[i];
  return meanCI(d);
}

/** Difference of two independent summaries `b - a` (Welch). Used when no per-unit pairing is stored. */
export function welchDiff(a: Summary, b: Summary): Interval & { z: number } {
  const se = Math.sqrt((a.n > 0 ? (a.sd * a.sd) / a.n : 0) + (b.n > 0 ? (b.sd * b.sd) / b.n : 0));
  const diff = b.mean - a.mean;
  const half = Z95 * se;
  const z = se === 0 ? (diff === 0 ? 0 : Math.sign(diff) * Infinity) : diff / se;
  return { mean: diff, sd: se, n: Math.min(a.n, b.n), se, lo: diff - half, hi: diff + half, z };
}

export type Verdict = 'better' | 'worse' | 'negligible' | 'inconclusive';

/**
 * Reads an interval for an effect where `positiveIsGood` says which direction is an improvement.
 *  - 'better' / 'worse': the interval excludes zero and the effect is real (in that direction).
 *  - 'negligible': the whole interval sits inside +-margin (the smallest change worth caring about).
 *  - 'inconclusive': the interval spans zero and is not small enough to rule out a real effect.
 *    (Run more seeds before drawing any conclusion.)
 */
export function verdict(ci: { lo: number; hi: number }, margin: number, positiveIsGood = true): Verdict {
  if (ci.lo > 0) return positiveIsGood ? 'better' : 'worse';
  if (ci.hi < 0) return positiveIsGood ? 'worse' : 'better';
  if (ci.lo >= -margin && ci.hi <= margin) return 'negligible';
  return 'inconclusive';
}

/** Seeds (independent units) needed for a mean's 95% half-width to reach `halfWidth`, given the per-unit sd. */
export function unitsNeeded(unitSd: number, halfWidth: number): number {
  if (halfWidth <= 0) return Infinity;
  return Math.max(2, Math.ceil(((Z95 * unitSd) / halfWidth) ** 2));
}

/** Seeds needed to pin a rate near `p` down to +-halfWidth. */
export function unitsNeededForRate(p: number, halfWidth: number): number {
  return unitsNeeded(Math.sqrt(Math.max(p * (1 - p), 0.01)), halfWidth);
}

// ---------- order statistics and outliers ----------

/** Linear-interpolated quantile, q in [0, 1]. */
export function quantile(xs: ArrayLike<number>, q: number): number {
  if (xs.length === 0) return 0;
  const sorted = Array.from(xs).sort((a, b) => a - b);
  const pos = (sorted.length - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export const median = (xs: ArrayLike<number>): number => quantile(xs, 0.5);

/** Median absolute deviation. */
export function mad(xs: ArrayLike<number>): number {
  const m = median(xs);
  return median(Array.from(xs, (x) => Math.abs(x - m)));
}

export interface OutlierFlag {
  index: number;
  value: number;
  /** Iglewicz-Hoaglin modified z-score: 0.6745 * (x - median) / MAD. |M| > 3.5 is the usual cut. */
  modifiedZ: number;
  /** Plain z-score against the cohort mean and sd (informational). */
  z: number;
  /** Outside the Tukey fences Q1 - 1.5 IQR .. Q3 + 1.5 IQR. */
  outsideIqr: boolean;
  outlier: boolean;
}

/**
 * Flags values far from the rest of their cohort. A value is an outlier when its modified z-score
 * exceeds 3.5 OR it lies outside the 1.5 x IQR fences. Cohorts under 4 values are never flagged
 * (there is no meaningful "rest"). When the MAD is 0 (most values equal), only the IQR rule can fire.
 */
export function flagOutliers(values: number[], modifiedZCut = 3.5): OutlierFlag[] {
  const n = values.length;
  const m = median(values);
  const madv = mad(values);
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const mu = mean(values);
  const s = sd(values);
  return values.map((value, index) => {
    const modifiedZ = madv > 0 ? (0.6745 * (value - m)) / madv : 0;
    const outsideIqr = iqr > 0 && (value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr);
    const outlier = n >= 4 && (Math.abs(modifiedZ) > modifiedZCut || outsideIqr);
    return { index, value, modifiedZ, z: s > 0 ? (value - mu) / s : 0, outsideIqr, outlier };
  });
}

/** Counts per integer bucket from `min` to `max` (values outside are clamped into the end buckets). */
export function histogram(xs: ArrayLike<number>, min: number, max: number): number[] {
  const counts = new Array<number>(max - min + 1).fill(0);
  for (let i = 0; i < xs.length; i++) {
    const b = Math.min(max, Math.max(min, Math.round(xs[i]))) - min;
    counts[b]++;
  }
  return counts;
}

// ---------- formatting ----------

export const pct = (x: number, digits = 1): string => `${(x * 100).toFixed(digits)}%`;
export const fix = (x: number, digits = 1): string => (Number.isFinite(x) ? x.toFixed(digits) : String(x));
export const signed = (x: number, digits = 1): string => `${x >= 0 ? '+' : ''}${x.toFixed(digits)}`;

/** "12.3 [11.0, 13.6]" */
export function fmtCI(ci: { mean: number; lo: number; hi: number }, digits = 1): string {
  return `${fix(ci.mean, digits)} [${fix(ci.lo, digits)}, ${fix(ci.hi, digits)}]`;
}

/** "+3.1 [+1.0, +5.2]" for differences. */
export function fmtDiff(ci: { mean: number; lo: number; hi: number }, digits = 1): string {
  return `${signed(ci.mean, digits)} [${signed(ci.lo, digits)}, ${signed(ci.hi, digits)}]`;
}
