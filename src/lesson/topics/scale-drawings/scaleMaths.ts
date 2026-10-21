// scaleMaths.ts: the exact maths of a scale drawing (pure: no DOM, no canvas).
//   A legend "d dU represents a aU" (1 in represents 4 ft, 1/4 in represents 1 ft, 1 cm represents 3 m).
//   perUnit   actual units per ONE drawing unit (4 ft per inch); the multiplier for every length
//   ratioN    the same-unit ratio 1 : N (1 in : 4 ft = 1 in : 48 in = 1 : 48); N < 1 means the drawing is larger
//   toActual / toDrawing   the two directions (multiply by perUnit / divide by it), exact rationals
//   areaFactor  perUnit squared: one square drawing unit stands for perUnit² square actual units
// Every value is a Q (core/math), so 3 1/2 in x 4 = 14 ft is exact and checkable.
import { type Q, qDiv, qIsInt, qMul, qNum, rat, toQ } from '../../../core/math';

export type DU = 'in' | 'cm' | 'mm';
export type AU = 'in' | 'ft' | 'yd' | 'mi' | 'mm' | 'cm' | 'm' | 'km';
/** each unit in its system's base (customary: inches, metric: millimeters) */
const BASE: Record<AU, number> = { in: 1, ft: 12, yd: 36, mi: 63360, mm: 1, cm: 10, m: 1000, km: 1_000_000 };
const US = new Set<AU>(['in', 'ft', 'yd', 'mi']);
export const isMetric = (u: AU): boolean => !US.has(u);

export interface Legend { d: Q; dU: DU; a: Q; aU: AU }
export const q = (x: number | Q): Q => {
  if (typeof x !== 'number') return x;
  const r = toQ(x, 1000);
  if (!r) throw new RangeError(`scaleMaths: ${x} is not a friendly rational`);
  return r;
};
export function legend(d: number | Q, dU: DU, a: number | Q, aU: AU): Legend {
  if (isMetric(dU) !== isMetric(aU)) throw new Error(`legend: ${dU} and ${aU} are from different systems`);
  const L = { d: q(d), dU, a: q(a), aU };
  if (qNum(L.d) <= 0 || qNum(L.a) <= 0) throw new Error('legend: both parts must be positive');
  return L;
}
/** actual units per one drawing unit */
export const perUnit = (L: Legend): Q => qDiv(L.a, L.d);
/** N in the same-unit ratio 1 : N (drawing : actual) */
export const ratioN = (L: Legend): Q => qDiv(qMul(L.a, rat(BASE[L.aU])), qMul(L.d, rat(BASE[L.dU])));
export const toActual = (L: Legend, len: number | Q): Q => qMul(q(len), perUnit(L));
export const toDrawing = (L: Legend, act: number | Q): Q => qDiv(q(act), perUnit(L));
export const areaFactor = (L: Legend): Q => { const k = perUnit(L); return qMul(k, k); };
/** convert a length between two units of one system */
export function convert(x: number | Q, from: AU, to: AU): Q {
  if (isMetric(from) !== isMetric(to)) throw new Error(`convert: ${from} to ${to}`);
  return qDiv(qMul(q(x), rat(BASE[from])), rat(BASE[to]));
}
/** the legend rewritten with a whole drawing unit (1/4 in : 1 ft -> 1 in : 4 ft) */
export const wholeLegend = (L: Legend): Legend => ({ d: rat(1), dU: L.dU, a: perUnit(L), aU: L.aU });

// ---------- area ----------
/** shoelace area of a polygon (numbers, exact for quarter-unit vertices) as an exact rational */
export function polyArea(P: readonly (readonly [number, number])[]): Q {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return q(Math.abs(s) / 2);
}
export function perimeter(P: readonly (readonly [number, number])[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return s;
}

// ---------- formatting ----------
/** a decimal string without float noise (4.5, 13.5, 0.875) */
export const dec = (x: number | Q): string => String(Number((typeof x === 'number' ? x : qNum(x)).toFixed(6)));
/** TeX for a value: mixed fraction for customary lengths (3\tfrac12), decimal for metric (4.5) */
export function vTex(x: number | Q, metric: boolean): string {
  const v = q(x);
  if (qIsInt(v)) return String(v.p);
  if (metric) return dec(v);
  const w = Math.floor(v.p / v.q), r = v.p - w * v.q;
  return `${w ? w : ''}\\tfrac{${r}}{${v.q}}`;
}
/** HTML for a value (panel text): mixed fraction or decimal */
export function vHtml(x: number | Q, metric: boolean): string {
  const v = q(x);
  if (qIsInt(v)) return String(v.p);
  if (metric) return dec(v);
  const w = Math.floor(v.p / v.q), r = v.p - w * v.q;
  return `${w ? w + '&#8202;' : ''}<span class="fr"><span>${r}</span><span>${v.q}</span></span>`;
}
/** plain text for a value (choices, logs): 3 1/2, 4.5 */
export function vText(x: number | Q, metric: boolean): string {
  const v = q(x);
  if (qIsInt(v)) return String(v.p);
  if (metric) return dec(v);
  const w = Math.floor(v.p / v.q), r = v.p - w * v.q;
  const FR: Record<string, string> = { '1/2': '½', '1/4': '¼', '3/4': '¾', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/3': '⅓', '2/3': '⅔' };
  const f = FR[`${r}/${v.q}`] ?? `${r}/${v.q}`;
  return w ? `${w}${f.length === 1 ? '' : ' '}${f}` : f;
}
export const UNIT_WORD: Record<AU, string> = { in: 'in', ft: 'ft', yd: 'yd', mi: 'mi', mm: 'mm', cm: 'cm', m: 'm', km: 'km' };
/** "1 in : 4 ft" as TeX */
export const legendTex = (L: Legend): string => `${vTex(L.d, false)}\\text{ ${L.dU}} : ${vTex(L.a, isMetric(L.aU))}\\text{ ${L.aU}}`;
/** "1 in represents 4 ft" as HTML */
export const legendHtml = (L: Legend): string => `${vHtml(L.d, false)} ${L.dU} represents ${vHtml(L.a, isMetric(L.aU))} ${L.aU}`;
export const legendText = (L: Legend): string => `${vText(L.d, false)} ${L.dU} represents ${vText(L.a, isMetric(L.aU))} ${L.aU}`;
/** the same-unit ratio as text: 1 : 48, or 50 : 1 for an enlargement */
export function ratioText(L: Legend): string {
  const N = ratioN(L);
  return qNum(N) >= 1 ? `1 : ${dec(N)}` : `${dec(qDiv(rat(1), N))} : 1`;
}
