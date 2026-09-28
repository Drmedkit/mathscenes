// math.ts: scalar helpers, timing helpers, a seeded hash (frames must be deterministic: never Math.random) and a tiny
// exact rational type (blocks compute with it, so 7 1/2 is exactly 15/2 and never 7.4999999).

export type Pt = [number, number];
export interface Box { x0: number; y0: number; x1: number; y1: number; cx: number; cy: number; w: number; h: number }

export const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
/** linear 0..1 position of t inside [a, b] */
export const seg = (t: number, a: number, b: number): number => clamp((t - a) / (b - a || 1e-9));
/** 0 -> 1 -> 0 pulse of length d starting at t0 */
export const pulse = (t: number, t0: number, d = 0.5): number => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
/** staggered progress of item i of n inside a global k (lag ratio: 0 = all together, 1 = one after another) */
export const lag = (k: number, i: number, n: number, ratio = 0.3): number => {
  const d = 1 / (1 + ratio * Math.max(0, n - 1));
  return clamp((k - i * ratio * d) / d);
};

export function box(x0: number, y0: number, x1: number, y1: number): Box {
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}
export function unionBox(bs: readonly Box[]): Box {
  if (!bs.length) return box(0, 0, 0, 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of bs) { x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1); }
  return box(x0, y0, x1, y1);
}
export const padBox = (b: Box, px: number, py = px): Box => box(b.x0 - px, b.y0 - py, b.x1 + px, b.y1 + py);
export const boxesOverlap = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** deterministic hash -> [0, 1) (mulberry-style integer mix) */
export function hash(...xs: number[]): number {
  let h = 0x9e3779b9;
  for (const x of xs) {
    h = Math.imul(h ^ Math.floor(x * 1000003), 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  }
  return (h >>> 0) / 4294967296;
}

// ---------- exact rationals ----------
export interface Q { readonly p: number; readonly q: number }   // p / q, q > 0, reduced

const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function rat(p: number, q = 1): Q {
  if (!Number.isInteger(p) || !Number.isInteger(q) || q === 0) throw new RangeError(`rat: ${p}/${q} is not a fraction of integers`);
  const s = q < 0 ? -1 : 1, g = gcd(p, q);
  return { p: (s * p) / g, q: (s * q) / g };
}
/** a friendly rational close to x (denominator <= maxDen), or null when x is not such a number */
export function toQ(x: number, maxDen = 12): Q | null {
  if (!Number.isFinite(x)) return null;
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(x * q);
    if (Math.abs(p / q - x) < 1e-9) return rat(p, q);
  }
  return null;
}
export const qMul = (a: Q, b: Q): Q => rat(a.p * b.p, a.q * b.q);
export const qDiv = (a: Q, b: Q): Q => rat(a.p * b.q, a.q * b.p);
export const qAdd = (a: Q, b: Q): Q => rat(a.p * b.q + b.p * a.q, a.q * b.q);
export const qEq = (a: Q, b: Q): boolean => a.p === b.p && a.q === b.q;
export const qNum = (a: Q): number => a.p / a.q;
export const qIsInt = (a: Q): boolean => a.q === 1;
/** TeX for a rational: 7, 1\tfrac{1}{2}, \tfrac{3}{4} (mixed numbers, the way kids write them) */
export function qTex(a: Q): string {
  if (a.q === 1) return String(a.p);
  const neg = a.p < 0, p = Math.abs(a.p), w = Math.floor(p / a.q), r = p % a.q;
  return `${neg ? '-' : ''}${w ? w : ''}\\tfrac{${r}}{${a.q}}`;
}
export const qStr = (a: Q): string => (a.q === 1 ? String(a.p) : `${a.p}/${a.q}`);
