// pieMaths.ts: the exact maths of a circle graph (pure: no DOM, no canvas). Used by the CircleGraph block, the item
// families and the tests.
//   share      f / n               (exact rational)
//   percent    100 f / n           (exact; the label is rounded to the nearest whole percent, half up)
//   angle      360 f / n           (exact; a decimal readout is rounded to 0.1° only when reported)
//   boundaries 360 C / n           (C = cumulative count), each rounded to the nearest degree, the last one is 360°
//   drawing    boundary minus the previous boundary: the list totals exactly 360° and each angle stays within 1°
import { type Q, rat, qNum } from '../../../core/math';

export interface Cat { name: string; count: number }
export interface PieMaths {
  cats: readonly Cat[];
  /** the stated whole (people surveyed); may be more than the listed counts (an incomplete whole) */
  n: number;
  /** the sum of the listed counts */
  listed: number;
  share: Q[];
  pctExact: Q[];
  /** nearest whole percent, half up */
  pctLabel: number[];
  angleExact: Q[];
  /** independently rounded angles (nearest degree) */
  indep: number[];
  /** rounded cumulative boundaries (the last is 360 when the counts make the whole) */
  bound: number[];
  /** drawing angles: differences of the rounded boundaries */
  draw: number[];
}

export class PieError extends Error {}
const need = (c: unknown, msg: string): void => { if (!c) throw new PieError(`pie: ${msg}`); };

/** nearest integer of a non-negative rational, half up */
export const roundQ = (x: Q): number => Math.floor((2 * x.p + x.q) / (2 * x.q));
/** nearest tenth of a non-negative rational, half up, as a number with one decimal */
export const round1 = (x: Q): number => Math.floor((20 * x.p + x.q) / (2 * x.q)) / 10;
/** a number with at most one decimal, for text (no float noise) */
export const fmt1 = (v: number): string => (Math.round(v * 10) / 10).toString();

export function computePie(cats: readonly Cat[], n?: number): PieMaths {
  need(cats.length >= 1 && cats.length <= 8, 'a circle graph has 1 to 8 categories');
  for (const c of cats) need(Number.isInteger(c.count) && c.count >= 0, `count of ${c.name} must be a whole number ≥ 0`);
  const listed = cats.reduce((s, c) => s + c.count, 0);
  const N = n ?? listed;
  need(N > 0 && Number.isInteger(N), 'the whole must be a positive whole number');
  need(listed <= N, `the counts (${listed}) add up to more than the whole (${N})`);
  const share = cats.map(c => rat(c.count, N));
  const pctExact = cats.map(c => rat(100 * c.count, N));
  const angleExact = cats.map(c => rat(360 * c.count, N));
  const pctLabel = pctExact.map(roundQ);
  const indep = angleExact.map(roundQ);
  const bound: number[] = [];
  let C = 0;
  for (const c of cats) { C += c.count; bound.push(roundQ(rat(360 * C, N))); }
  const draw = bound.map((b, i) => b - (i ? bound[i - 1]! : 0));
  // the checks a teacher would do
  if (listed === N) {
    need(bound[bound.length - 1] === 360, 'the last boundary must be 360°');
    need(draw.reduce((s, a) => s + a, 0) === 360, 'the drawing angles must total 360°');
  }
  draw.forEach((a, i) => need(Math.abs(a - qNum(angleExact[i]!)) < 1, `drawing angle ${a}° is more than 1° from the exact angle of ${cats[i]!.name}`));
  return { cats, n: N, listed, share, pctExact, pctLabel, angleExact, indep, bound, draw };
}

/** the exact angle as TeX: 90, 51\tfrac{3}{7} */
export function degTex(x: Q): string {
  if (x.q === 1) return `${x.p}^\\circ`;
  const w = Math.floor(x.p / x.q), r = x.p % x.q;
  return `${w}\\tfrac{${r}}{${x.q}}^\\circ`;
}
/** an exact percent as text: 25, 12.5, or a rounded readout with ≈ */
export function pctText(x: Q): string {
  if (x.q === 1) return String(x.p);
  const v = qNum(x);
  if (Math.abs(Math.round(v * 10) / 10 - v) < 1e-9) return fmt1(v);
  if (Math.abs(Math.round(v * 100) / 100 - v) < 1e-9) return (Math.round(v * 100) / 100).toString();
  return `≈ ${fmt1(round1(x))}`;
}
