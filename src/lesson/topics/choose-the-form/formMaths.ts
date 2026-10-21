// formMaths.ts: exact maths for "choose the form" (no DOM). One amount, three names: a fraction, a decimal and a
// percent of the same whole are the SAME number, so any valid route gives the same result; the numbers decide which
// route is shortest. Everything here is integer arithmetic on reduced fractions, so a test can check every claim.

export interface Rat { readonly n: number; readonly d: number }   // reduced, d > 0, n >= 0
const g = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
export function rat(n: number, d = 1): Rat {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`rat: ${n}/${d} is not a fraction of integers`);
  if (d < 0) { n = -n; d = -d; }
  const k = g(n, d);
  return { n: n / k, d: d / k };
}
export const rMul = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
export const rAdd = (a: Rat, b: Rat): Rat => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const rSub = (a: Rat, b: Rat): Rat => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const rEq = (a: Rat, b: Rat): boolean => a.n * b.d === b.n * a.d;
export const rNum = (a: Rat): number => a.n / a.d;
/** a decimal written as a string ("0.075", "1.5") as an exact fraction */
export function decRat(s: string): Rat {
  const m = /^(\d*)(?:\.(\d+))?$/.exec(s);
  if (!m) throw new Error(`decRat: ${s}`);
  const fr = m[2] ?? '';
  return rat(Number((m[1] || '0') + fr), 10 ** fr.length);
}
/** p% as the exact number it names (p may be a decimal string like "7.5") */
export const pctRat = (p: string | number): Rat => rMul(decRat(String(p)), rat(1, 100));

/** true when the fraction has a finite decimal (denominator 2^a 5^b) */
export function terminates(r: Rat): boolean { let d = r.d; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
/** the finite decimal of a terminating fraction ("0.375", "1.5", "12"); throws on a repeating one */
export function decStr(r: Rat): string {
  if (!terminates(r)) throw new Error(`decStr: ${r.n}/${r.d} repeats`);
  const w = Math.floor(r.n / r.d);
  let rem = r.n - w * r.d, s = '';
  while (rem) { rem *= 10; s += String(Math.floor(rem / r.d)); rem %= r.d; }
  return s ? `${w}.${s}` : String(w);
}
/** the percent name of a terminating fraction ("37.5%") */
export const pctStr = (r: Rat): string => decStr(rMul(r, rat(100))) + '%';
/** the decimal of a repeating fraction cut (not rounded) after k places, and rounded to k places */
export function truncStr(r: Rat, k: number): string {
  const w = Math.floor(r.n / r.d);
  let rem = r.n - w * r.d, s = '';
  for (let i = 0; i < k; i++) { rem *= 10; s += String(Math.floor(rem / r.d)); rem %= r.d; }
  return `${w}.${s}`;
}
export function roundRat(r: Rat, k: number): Rat {
  const s = 10 ** k;
  return rat(Math.floor((r.n * s * 2 + r.d) / (2 * r.d)), s);   // half up (positive values)
}

/** TeX of a fraction or mixed number: 3/4 -> \frac{3}{4}, 5/4 -> 1\frac{1}{4} (mixed) or \frac{5}{4} */
export function fracTex(r: Rat, mixed = true): string {
  if (r.d === 1) return String(r.n);
  const w = Math.floor(r.n / r.d);
  if (mixed && w > 0) return `${w}\\dfrac{${r.n - w * r.d}}{${r.d}}`;
  return `\\dfrac{${r.n}}{${r.d}}`;
}
/** money from exact cents: 1200 -> "$12", 450 -> "$4.50" (cents=true forces "$12.00") */
export function money(cents: number, forceCents = false): string {
  if (!Number.isInteger(cents)) throw new Error(`money: ${cents} is not whole cents`);
  const d = Math.floor(cents / 100), c = cents % 100;
  const ds = d >= 1000 ? d.toLocaleString('en-US') : String(d);
  return c || forceCents ? `$${ds}.${String(c).padStart(2, '0')}` : `$${ds}`;
}
/** p% of an amount in cents, exact; null when the result is not whole cents */
export function pctOfCents(p: string | number, cents: number): number | null {
  const v = rMul(pctRat(p), rat(cents));
  return v.d === 1 ? v.n : null;
}
/** a number for a typed answer (exact fractions converted once, at the end) */
export const near = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) <= eps;

// ---------- the "digit key" a kid uses when comparing forms by their visible digits (misconception probes) ----------
export type Form = { kind: 'frac'; r: Rat } | { kind: 'dec'; s: string } | { kind: 'pct'; p: string };
export function formValue(f: Form): Rat { return f.kind === 'frac' ? f.r : f.kind === 'dec' ? decRat(f.s) : pctRat(f.p); }
/** the whole number a digit-key reader sees: the denominator of a fraction, the decimal digits without the point, the percent numeral */
export function digitKey(f: Form): number {
  return f.kind === 'frac' ? f.r.d : f.kind === 'dec' ? Number(f.s.replace('.', '').replace(/^0+/, '') || '0') : Number(f.p);
}
export function formTex(f: Form): string { return f.kind === 'frac' ? fracTex(f.r) : f.kind === 'dec' ? f.s : `${f.p}\\%`; }
export function formHtml(f: Form): string {
  if (f.kind === 'frac' && f.r.d === 1) return String(f.r.n);
  if (f.kind === 'frac') { const r = f.r, w = Math.floor(r.n / r.d); const fr = `<span class="fr"><span>${r.n - w * r.d}</span><span>${r.d}</span></span>`; return w ? `${w}&#8202;${fr}` : fr; }
  return f.kind === 'dec' ? f.s : `${f.p}%`;
}
