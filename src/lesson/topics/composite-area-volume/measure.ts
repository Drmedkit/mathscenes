// measure.ts: the exact maths of "composite area, volume and surface area". Pure: no DOM, no canvas.
//   boxes     a composite solid as a union of axis-aligned boxes minus removed boxes ("add" and "cut"); its volume
//             and its surface are counted cell by cell on a compressed grid (an exposed-face inventory), so every
//             shortcut the lesson teaches (V1 + V2, S1 + S2 - 2A, V - Vcut) can be checked against a direct count
//   polygons  shoelace area of any simple polygon (composite plans, prism bases)
//   formulas  prism V = Bh, pyramid V = Bh/3, cylinder V = pi r^2 h, cylinder surface from its net
//   numbers   formatting for HTML, TeX and speech (whole numbers, decimals, halves and quarters as mixed numbers)
export type V3 = [number, number, number];
export type P2 = [number, number];
/** a box: corner `at` (x right = length, y back = depth, z up = height) and its size */
export interface BoxSpec { at: V3; size: V3 }

export const EPS = 1e-9;
export const near = (a: number, b: number, e = 1e-7) => Math.abs(a - b) <= e * Math.max(1, Math.abs(a), Math.abs(b));
/** a clean float: kills binary noise (0.1 + 0.2) so formatting and comparisons stay exact for the lesson's numbers */
export const clean = (x: number) => Math.round(x * 1e9) / 1e9;

// ---------- boxes ----------
export const boxVolume = (b: BoxSpec) => clean(b.size[0] * b.size[1] * b.size[2]);
export const boxSurface = (b: BoxSpec) => { const [l, w, h] = b.size; return clean(2 * (l * w + l * h + w * h)); };
export const box3 = (x: number, y: number, z: number, l: number, w: number, h: number): BoxSpec => ({ at: [x, y, z], size: [l, w, h] });

/** the compressed grid of a union of boxes minus cut boxes: cell (i, j, k) is filled when its centre is inside
 *  some added box and inside no cut box */
export interface Grid { xs: number[][]; filled: (i: number, j: number, k: number) => boolean; n: [number, number, number] }
export function gridOf(add: readonly BoxSpec[], cut: readonly BoxSpec[] = []): Grid {
  const xs: number[][] = [0, 1, 2].map(a => {
    const v = new Set<number>();
    for (const b of [...add, ...cut]) { v.add(clean(b.at[a]!)); v.add(clean(b.at[a]! + b.size[a]!)); }
    return [...v].sort((p, q) => p - q);
  });
  const n: [number, number, number] = [xs[0]!.length - 1, xs[1]!.length - 1, xs[2]!.length - 1];
  const inside = (b: BoxSpec, c: V3) => [0, 1, 2].every(a => c[a]! > b.at[a]! + EPS && c[a]! < b.at[a]! + b.size[a]! - EPS);
  const cache = new Map<number, boolean>();
  const filled = (i: number, j: number, k: number): boolean => {
    if (i < 0 || j < 0 || k < 0 || i >= n[0] || j >= n[1] || k >= n[2]) return false;
    const key = (i * 97 + j) * 97 + k;
    let f = cache.get(key);
    if (f === undefined) {
      const c: V3 = [(xs[0]![i]! + xs[0]![i + 1]!) / 2, (xs[1]![j]! + xs[1]![j + 1]!) / 2, (xs[2]![k]! + xs[2]![k + 1]!) / 2];
      f = add.some(b => inside(b, c)) && !cut.some(b => inside(b, c));
      cache.set(key, f);
    }
    return f;
  };
  return { xs, filled, n };
}
/** volume of the union minus the cuts, counted cell by cell */
export function unionVolume(add: readonly BoxSpec[], cut: readonly BoxSpec[] = []): number {
  const G = gridOf(add, cut);
  let v = 0;
  for (let i = 0; i < G.n[0]; i++) for (let j = 0; j < G.n[1]; j++) for (let k = 0; k < G.n[2]; k++)
    if (G.filled(i, j, k)) v += (G.xs[0]![i + 1]! - G.xs[0]![i]!) * (G.xs[1]![j + 1]! - G.xs[1]![j]!) * (G.xs[2]![k + 1]! - G.xs[2]![k]!);
  return clean(v);
}
/** an exposed cell face: where a filled cell meets an empty one (or the outside) */
export interface CellFace { axis: 0 | 1 | 2; dir: 1 | -1; at: number; lo: [number, number]; hi: [number, number] }
export function exposedFaces(add: readonly BoxSpec[], cut: readonly BoxSpec[] = []): CellFace[] {
  const G = gridOf(add, cut), out: CellFace[] = [];
  for (let i = 0; i < G.n[0]; i++) for (let j = 0; j < G.n[1]; j++) for (let k = 0; k < G.n[2]; k++) {
    if (!G.filled(i, j, k)) continue;
    const idx = [i, j, k];
    for (const axis of [0, 1, 2] as const) for (const dir of [1, -1] as const) {
      const nb = [i, j, k]; nb[axis]! += dir;
      if (G.filled(nb[0]!, nb[1]!, nb[2]!)) continue;
      const o = [0, 1, 2].filter(a => a !== axis) as [number, number];
      const at = G.xs[axis]![idx[axis]! + (dir > 0 ? 1 : 0)]!;
      out.push({ axis, dir, at, lo: [G.xs[o[0]]![idx[o[0]]!]!, G.xs[o[1]]![idx[o[1]]!]!], hi: [G.xs[o[0]]![idx[o[0]]! + 1]!, G.xs[o[1]]![idx[o[1]]! + 1]!] });
    }
  }
  return out;
}
/** the surface area of the union minus the cuts: the sum of the exposed faces (the direct face inventory) */
export function unionSurface(add: readonly BoxSpec[], cut: readonly BoxSpec[] = [], skipBottom = false): number {
  let s = 0;
  for (const f of exposedFaces(add, cut)) {
    if (skipBottom && f.axis === 2 && f.dir < 0 && Math.abs(f.at) < EPS) continue;
    s += (f.hi[0] - f.lo[0]) * (f.hi[1] - f.lo[1]);
  }
  return clean(s);
}
/** the area where two boxes touch (they share a plane and their footprints overlap); 0 when they do not touch */
export function contactArea(a: BoxSpec, b: BoxSpec): number {
  let area = 0;
  for (const axis of [0, 1, 2]) {
    const aLo = a.at[axis]!, aHi = aLo + a.size[axis]!, bLo = b.at[axis]!, bHi = bLo + b.size[axis]!;
    if (!(near(aHi, bLo) || near(bHi, aLo))) continue;
    const o = [0, 1, 2].filter(x => x !== axis);
    let ar = 1;
    for (const q of o) ar *= Math.max(0, Math.min(a.at[q]! + a.size[q]!, b.at[q]! + b.size[q]!) - Math.max(a.at[q]!, b.at[q]!));
    area += ar;
  }
  return clean(area);
}
/** do two boxes overlap in their interiors? */
export function boxesOverlap3(a: BoxSpec, b: BoxSpec): boolean {
  return [0, 1, 2].every(q => Math.min(a.at[q]! + a.size[q]!, b.at[q]! + b.size[q]!) - Math.max(a.at[q]!, b.at[q]!) > EPS);
}
/** the bounding box of boxes */
export function boundsOf(bs: readonly BoxSpec[]): BoxSpec {
  const lo = [0, 1, 2].map(a => Math.min(...bs.map(b => b.at[a]!))), hi = [0, 1, 2].map(a => Math.max(...bs.map(b => b.at[a]! + b.size[a]!)));
  return { at: lo as V3, size: [hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!] };
}

// ---------- polygons ----------
export function polyArea(P: readonly P2[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += a[0] * b[1] - b[0] * a[1]; }
  return clean(Math.abs(s) / 2);
}
export const triArea = (b: number, h: number) => clean(b * h / 2);
export const trapArea = (a: number, b: number, h: number) => clean((a + b) * h / 2);
/** perimeter of a polygon */
export function polyPerim(P: readonly P2[]): number {
  let s = 0;
  for (let i = 0; i < P.length; i++) { const a = P[i]!, b = P[(i + 1) % P.length]!; s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  return clean(s);
}

// ---------- prisms, pyramids, cylinders ----------
export const prismVolume = (B: number, h: number) => clean(B * h);
export const pyramidVolume = (B: number, h: number) => clean(B * h / 3);
/** a cylinder's volume as a multiple of pi (exact): r^2 h */
export const cylVolPi = (r: number, h: number) => clean(r * r * h);
/** a cylinder's surface as a multiple of pi: bases r^2 each, the label 2 r h */
export function cylSurfPi(r: number, h: number, bases: 0 | 1 | 2): number { return clean(bases * r * r + 2 * r * h); }

// ---------- numbers ----------
const FR: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
const FRT: Record<number, string> = { 0.25: '\\tfrac{1}{4}', 0.5: '\\tfrac{1}{2}', 0.75: '\\tfrac{3}{4}' };
const FRW: Record<number, string> = { 0.25: 'a quarter', 0.5: 'a half', 0.75: 'three quarters' };
export type NumStyle = 'dec' | 'frac';
/** is x a whole number, or a number of quarters (when written as a fraction)? */
export const quarters = (x: number) => near(x * 4, Math.round(x * 4));
function parts(x: number): [number, number] { const w = Math.floor(x + EPS); return [w, clean(x - w)]; }
/** a number for the panel: 12, 2.5, or with style 'frac' 2½ */
const thirds = (x: number) => !Number.isInteger(x) && near(x * 3, Math.round(x * 3));
export function fmt(x: number, style: NumStyle = 'dec'): string {
  x = clean(x);
  if (Number.isInteger(x)) return x.toLocaleString('en-US');
  if (thirds(x) && x > 0) { const w = Math.floor(x), r = Math.round((x - w) * 3); return `${w || ''}${r === 1 ? '⅓' : '⅔'}`; }
  if (style === 'frac' && quarters(x) && x > 0) { const [w, f] = parts(x); return `${w || ''}${FR[f] ?? ''}`; }
  return String(Number(x.toFixed(3))).replace(/^(\d{4,})/, m => Number(m).toLocaleString('en-US'));
}
/** the same number in TeX */
export function fmtT(x: number, style: NumStyle = 'dec'): string {
  x = clean(x);
  if (Number.isInteger(x)) return x >= 10000 ? x.toLocaleString('en-US').replace(/,/g, '{,}') : String(x);
  if (thirds(x) && x > 0) { const w = Math.floor(x), r = Math.round((x - w) * 3); return `${w || ''}\\tfrac{${r}}{3}`; }
  if (style === 'frac' && quarters(x) && x > 0) { const [w, f] = parts(x); return `${w || ''}${FRT[f] ?? ''}`; }
  return String(Number(x.toFixed(3)));
}
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/** a whole number below a million as words (for the narrator) */
export function words(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 20) return ONES[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)]! + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
  return words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + words(n % 1000) : '');
}
/** a number as words, halves too ("four and a half") */
export function sayNum(x: number): string {
  x = clean(x);
  if (Number.isInteger(x)) return words(x);
  if (quarters(x)) { const [w, f] = parts(x); return w ? `${words(w)} and ${FRW[f]}` : FRW[f]!; }
  return String(x);
}
/** unit words: ft -> ft², ft³ */
export const sq = (u: string) => `${u}²`, cu = (u: string) => `${u}³`;
export const sqT = (u: string) => `\\text{ ${u}}^2`, cuT = (u: string) => `\\text{ ${u}}^3`;
