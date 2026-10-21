// sci.ts: exact decimal arithmetic for "scientific notation and order of magnitude" (pure, no DOM).
// A Dec is c x 10^e with c a BigInt (no float error anywhere): 3.04 x 10^-5 is { c: 304n, e: -7 }. Kept normalised
// (no trailing zeros in c; zero is { c: 0n, e: 0 }), so two Decs are equal exactly when c and e are equal.
// A kid's typed number arrives as a JS number; String(v) gives back the shortest decimal that round-trips, which is
// the decimal the kid typed (up to 15 significant digits), so fromNumber() reads it exactly.
// Formatting: TeX for the board (10^{-4}, 4{,}500{,}000), HTML for the panel (10<sup>−4</sup>, 4,500,000).

export interface Dec { readonly c: bigint; readonly e: number }
const TEN = 10n;
const p10 = (k: number): bigint => { let v = 1n; for (let i = 0; i < k; i++) v *= TEN; return v; };

export function norm(c: bigint, e: number): Dec {
  if (c === 0n) return { c: 0n, e: 0 };
  while (c % TEN === 0n) { c /= TEN; e++; }
  return { c, e };
}
export const dec = (c: number | bigint, e = 0): Dec => norm(BigInt(c), e);
export const ZERO: Dec = { c: 0n, e: 0 };
export const ONE: Dec = { c: 1n, e: 0 };

/** "0.00038", "-3.2", "4.5e9", "1.2E-08", "4,500" (commas as thousands separators) -> Dec, or null */
export function parseDec(s: string): Dec | null {
  const t = s.trim().replace(/[−–]/g, '-').replace(/,(?=\d{3}(\D|$))/g, '');
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(t);
  if (!m || (m[2] === '' && (m[3] ?? '') === '')) return null;
  const int = m[2] ?? '', frac = m[3] ?? '';
  const digits = (int + frac).replace(/^0+(?=\d)/, '');
  let c = BigInt(digits === '' ? '0' : digits);
  if (m[1] === '-') c = -c;
  return norm(c, -frac.length + Number(m[4] ?? 0));
}
/** a JS number (a kid's typed answer) -> its exact decimal; null for NaN / Infinity */
export function fromNumber(v: number): Dec | null {
  if (!Number.isFinite(v)) return null;
  return parseDec(String(v));
}
/** a decimal literal -> Dec (throws on a typo: generators use literals) */
export function D(s: string | number): Dec {
  const d = typeof s === 'number' ? fromNumber(s) : parseDec(s);
  if (!d) throw new Error(`not a decimal: ${s}`);
  return d;
}

export const eq = (a: Dec, b: Dec): boolean => a.c === b.c && a.e === b.e;
export const neg = (a: Dec): Dec => ({ c: -a.c, e: a.e });
export const mul = (a: Dec, b: Dec): Dec => norm(a.c * b.c, a.e + b.e);
export function add(a: Dec, b: Dec): Dec {
  const e = Math.min(a.e, b.e);
  return norm(a.c * p10(a.e - e) + b.c * p10(b.e - e), e);
}
export const sub = (a: Dec, b: Dec): Dec => add(a, neg(b));
/** 10^n */
export const pow10 = (n: number): Dec => ({ c: 1n, e: n });
/** a x 10^n */
export const sciVal = (a: Dec, n: number): Dec => norm(a.c, a.e + n);
/** a / b when it is a terminating decimal (at most 30 more digits), else null */
export function div(a: Dec, b: Dec): Dec | null {
  if (b.c === 0n) return null;
  for (let k = 0; k <= 30; k++) {
    const num = a.c * p10(k);
    if (num % b.c === 0n) return norm(num / b.c, a.e - b.e - k);
  }
  return null;
}
export function cmp(a: Dec, b: Dec): number {
  const d = sub(a, b).c;
  return d === 0n ? 0 : d > 0n ? 1 : -1;
}
export const isPos = (a: Dec): boolean => a.c > 0n;
export const isInt = (a: Dec): boolean => a.e >= 0;
/** number of significant digits */
export const sigDigits = (a: Dec): number => (a.c < 0n ? -a.c : a.c).toString().length;
/** the JS number (for positions on a picture only, never for checking) */
export const toNum = (a: Dec): number => Number(`${a.c}e${a.e}`);

/** normalised scientific notation of a positive number: a x 10^n with 1 <= a < 10 */
export function sciOf(d: Dec): { a: Dec; n: number } {
  if (d.c <= 0n) throw new RangeError('scientific notation here is for positive numbers');
  const L = d.c.toString().length;
  return { a: norm(d.c, -(L - 1)), n: d.e + L - 1 };
}
/** is a a normalised coefficient: 1 <= a < 10 */
export const isCoef = (a: Dec): boolean => a.c > 0n && cmp(a, ONE) >= 0 && cmp(a, D(10)) < 0;
/** the exponent n with 10^n <= d < 10^(n+1) (the order of magnitude, d > 0) */
export const orderOf = (d: Dec): number => sciOf(d).n;

/** round to `sig` significant digits, half away from zero (9.8 to 1 digit is 10) */
export function roundSig(d: Dec, sig: number): Dec {
  const s = (d.c < 0n ? -d.c : d.c).toString();
  if (s.length <= sig) return d;
  const drop = s.length - sig;
  let keep = BigInt(s.slice(0, sig));
  if (Number(s[sig]) >= 5) keep += 1n;
  return norm(d.c < 0n ? -keep : keep, d.e + drop);
}

// ---------- plain decimal strings ----------
/** "0.0000304", "4500000000", "3.04" (no exponent, no separators) */
export function plain(d: Dec): string {
  const negative = d.c < 0n, s = (negative ? -d.c : d.c).toString();
  let out: string;
  if (d.e >= 0) out = s + '0'.repeat(d.e);
  else {
    const k = -d.e;
    out = k >= s.length ? '0.' + '0'.repeat(k - s.length) + s : s.slice(0, s.length - k) + '.' + s.slice(s.length - k);
  }
  return (negative ? '-' : '') + out;
}
/** with thousands separators in the whole-number part: "4,500,000,000", "0.000038", "12,345.6" */
export function grouped(d: Dec, sep = ','): string {
  const p = plain(d), neg_ = p.startsWith('-'), q = neg_ ? p.slice(1) : p;
  const [i, f] = q.split('.') as [string, string | undefined];
  const gi = i.length > 3 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : i;
  return (neg_ ? '-' : '') + gi + (f !== undefined ? '.' + f : '');
}

// ---------- TeX (board) ----------
/** a decimal in TeX: 4{,}500{,}000, 0.00038 */
export const nTex = (d: Dec): string => grouped(d, '{,}');
/** a x 10^n in TeX */
export const sTex = (a: Dec | string, n: number | string): string => `${typeof a === 'string' ? a : plain(a)} \\times 10^{${n}}`;
/** 10^n in TeX */
export const pTex = (n: number | string): string => `10^{${n}}`;

// ---------- HTML (panel) ----------
const minus = (s: string) => s.replace(/-/g, '−');
/** 10<sup>−4</sup> */
export const pH = (n: number | string): string => `10<sup>${minus(String(n))}</sup>`;
/** 4.5 × 10<sup>9</sup> */
export const sH = (a: Dec | string, n: number | string): string => `${typeof a === 'string' ? a : plain(a)} × ${pH(n)}`;
/** 4,500,000,000 or 0.000038 (real minus sign) */
export const nH = (d: Dec): string => minus(grouped(d));
/** the normalised form of a positive number, in HTML */
export const sciH = (d: Dec): string => { const s = sciOf(d); return sH(s.a, s.n); };
export const sciTex = (d: Dec): string => { const s = sciOf(d); return sTex(s.a, s.n); };
