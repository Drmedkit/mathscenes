// volMaths.ts: the exact maths of "volume of cylinders, cones and spheres" (grade 8, 8.G.C.9 + TEKS 8.7A/B).
// Pure: no DOM. Every volume is a rational multiple of pi, kept exact as a fraction [n, d] (d > 0, reduced), so
// 20/3 pi stays 20/3 pi and 12.5 pi is exactly 25/2 pi. Lengths may be whole, decimal (2.5) or fractional (3/2).
//   coef(kind, r, h)     the coefficient of pi in the volume       (cylinder r^2 h, cone r^2 h / 3, sphere 4 r^3 / 3,
//                                                                   hemisphere 2 r^3 / 3)
//   levelOf(kind, f)     water depth (fraction of the height) when a vessel holds the fraction f of its volume
//   texQ / htmlQ / sayQ  a rational as TeX, HTML or spoken words

export type Kind = 'cyl' | 'cone' | 'sphere' | 'hemi';
export type Q = readonly [number, number];

export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function q(n: number, d = 1): Q {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`volMaths: ${n}/${d} is not an exact fraction`);
  const g = gcd(n, d), s = d < 0 ? -1 : 1;
  return [(s * n) / g, (s * d) / g];
}
/** a decimal with up to 3 places, exactly */
export function qd(x: number): Q { const n = Math.round(x * 1000); if (Math.abs(n / 1000 - x) > 1e-9) throw new Error(`volMaths: ${x} has too many places`); return q(n, 1000); }
export const mul = (...xs: Q[]): Q => xs.reduce((a, b) => q(a[0] * b[0], a[1] * b[1]), q(1));
export const div = (a: Q, b: Q): Q => q(a[0] * b[1], a[1] * b[0]);
export const add = (a: Q, b: Q): Q => q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const sub = (a: Q, b: Q): Q => q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const pow = (a: Q, k: number): Q => mul(...Array.from({ length: k }, () => a));
export const val = (a: Q): number => a[0] / a[1];
export const eqQ = (a: Q, b: Q): boolean => a[0] === b[0] && a[1] === b[1];
export const isWhole = (a: Q): boolean => a[1] === 1;

/** the formula's coefficient (1, 1/3, 4/3, 2/3) */
export const K: Record<Kind, Q> = { cyl: q(1), cone: q(1, 3), sphere: q(4, 3), hemi: q(2, 3) };
/** the coefficient of pi in the volume; h is ignored for spheres and hemispheres */
export function coef(kind: Kind, r: Q, h: Q = q(0)): Q {
  if (kind === 'cyl' || kind === 'cone') return mul(K[kind], pow(r, 2), h);
  return mul(K[kind], pow(r, 3));
}
/** lateral and total surface area of a cylinder, coefficients of pi */
export const cylLateral = (r: Q, h: Q): Q => mul(q(2), r, h);
export const cylTotal = (r: Q, h: Q): Q => add(cylLateral(r, h), mul(q(2), pow(r, 2)));

// ---------- water levels (for the pour pictures) ----------
/** depth y in [0, 1] of the height at which the vessel holds the fraction f of its volume */
export function levelOf(kind: Kind | 'cup' | 'bowl' | 'box', f: number): number {
  const v = Math.min(1, Math.max(0, f));
  if (kind === 'cyl' || kind === 'box') return v;
  if (kind === 'cup') return Math.cbrt(v);                      // a cone with its point down
  if (kind === 'cone') return 1 - Math.cbrt(1 - v);             // point up
  // sphere (height 2R, y in [0,1] of 2R): cap volume / sphere = t^2 (3 - 2t) with t = y / (2R) ... solve by bisection
  const g = kind === 'sphere' ? (t: number) => t * t * (3 - 2 * t) : (t: number) => (t * t * (3 - t)) / 2; // bowl: t = y / R
  let lo = 0, hi = 1;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (g(m) < v) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// ---------- formatting ----------
/** a terminating decimal string for a rational with a 2/5-power denominator, or null */
export function decStr(a: Q): string | null {
  let d = a[1];
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  if (d !== 1) return null;
  const x = val(a);
  return String(Math.round(x * 1e6) / 1e6);
}
/** TeX: whole, decimal (when `dec` and terminating) or \tfrac{n}{d} */
export function texQ(a: Q, dec = false): string {
  if (isWhole(a)) return String(a[0]);
  const s = dec ? decStr(a) : null;
  if (s) return s;
  return `${a[0] < 0 ? '-' : ''}\\tfrac{${Math.abs(a[0])}}{${a[1]}}`;
}
/** HTML: whole, decimal or a stacked fraction */
export function htmlQ(a: Q, dec = false): string {
  if (isWhole(a)) return String(a[0]);
  const s = dec ? decStr(a) : null;
  if (s) return s;
  return `<span class="fr"><span>${a[0]}</span><span>${a[1]}</span></span>`;
}
/** coefficient times pi: "45π", "20/3 π" (HTML) */
export const htmlPi = (a: Q, dec = false) => `${htmlQ(a, dec)}&#8202;π`;
export const texPi = (a: Q, dec = false) => (eqQ(a, q(1)) ? '\\pi' : `${texQ(a, dec)}\\pi`);
/** a length as typed in a prompt: 3, 2.5 or 3/2 */
export function lenStr(a: Q, frac = false): string { if (isWhole(a)) return String(a[0]); return frac ? `${a[0]}/${a[1]}` : (decStr(a) ?? `${a[0]}/${a[1]}`); }

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
/** a whole number in words (for spoken lines), up to 9999 */
export function words(n: number): string {
  if (n < 0) return 'minus ' + words(-n);
  if (n < 20) return ONES[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? '-' + ONES[n % 10]! : '');
  if (n < 1000) return ONES[Math.floor(n / 100)]! + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
  return words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + words(n % 1000) : '');
}

// ---------- response reading ----------
/** the value a fraction / number response stands for (floats allowed: a kid may type 12.5 in the whole box) */
export function respValue(r: { kind: string; w?: number; n?: number; d?: number; v?: number }): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v! : null;
  if (r.kind === 'frac') {
    const w = r.w ?? 0, n = r.n ?? 0, d = r.d ?? 1;
    if (![w, n, d].every(Number.isFinite) || d === 0) return null;
    return w + n / d;
  }
  return null;
}
export const near = (x: number, y: number, tol = 1e-6) => Math.abs(x - y) <= tol * Math.max(1, Math.abs(y));
/** round to `places` decimal places (half up, robust to binary noise) */
export const roundTo = (x: number, places: number) => { const m = 10 ** places; return Math.round(x * m + 1e-9 * Math.sign(x)) / m; };
