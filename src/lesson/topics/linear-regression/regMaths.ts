// regMaths.ts: the exact maths of "Scatter plots, correlation and the regression line" (HS Statistics 2). Pure: no DOM.
//   least squares   b = Sxy / Sxx, a = ȳ − b·x̄ (the line every lesson model and every "technology" output comes from)
//   r               Sxy / √(Sxx·Syy);  r² = r·r = 1 − SSE / SST for the least-squares line
//   residual        e = y − ŷ (observed minus predicted, vertical, signed)
// Rounding conventions (stated to the student in every item that rounds): coefficients and predictions are rounded
// half away from zero to the places the item names; generators reject values within 2% of a rounding unit of a .x5
// tie (`tieFree`), so an independent recomputation in floats rounds the same way.
// Numbers as text: nH (HTML, a real minus sign, thousands commas from 1,000 up), nT (TeX), fx (fixed decimals).

/** round away float noise */
export const r9 = (v: number): number => Math.round(v * 1e9) / 1e9;
/** v rounded to d decimals, half away from zero */
export const rd = (v: number, d: number): number => { const k = 10 ** d; return r9((Math.sign(v) * Math.round(Math.abs(v) * k + 1e-9)) / k); };
/** the exact value is at least `m` rounding units away from a .x5 tie at d decimals */
export function tieFree(v: number, d: number, m = 0.02): boolean {
  const s = Math.abs(v) * 10 ** d, f = s - Math.floor(s);
  return Math.abs(f - 0.5) > m;
}

export interface Fit { n: number; a: number; b: number; r: number; r2: number; xbar: number; ybar: number; sse: number; sst: number }
export function lsrl(xs: readonly number[], ys: readonly number[]): Fit {
  const n = xs.length;
  const xbar = xs.reduce((s, v) => s + v, 0) / n, ybar = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { const dx = xs[i]! - xbar, dy = ys[i]! - ybar; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
  const b = sxy / sxx, a = ybar - b * xbar, r = syy === 0 ? 0 : sxy / Math.sqrt(sxx * syy);
  const sse = xs.reduce((s, x, i) => s + (ys[i]! - a - b * x) ** 2, 0);
  return { n, a, b, r, r2: r * r, xbar, ybar, sse, sst: syy };
}
/** predicted value of a line ŷ = a + b·x */
export const yhat = (a: number, b: number, x: number): number => r9(a + b * x);
/** residuals y − ŷ of a line */
export const residuals = (xs: readonly number[], ys: readonly number[], a: number, b: number): number[] => xs.map((x, i) => r9(ys[i]! - (a + b * x)));
export const sumSq = (es: readonly number[]): number => r9(es.reduce((s, e) => s + e * e, 0));
export const sum = (es: readonly number[]): number => r9(es.reduce((s, e) => s + e, 0));

// ---------- numbers as text ----------
/** HTML: up to d decimals, a real minus sign, thousands commas from 1,000 up (years are not used as values) */
export function nH(v: number, d = 3): string {
  const r = rd(v, d), a = Math.abs(r);
  const s = a >= 1000 ? a.toLocaleString('en-US', { maximumFractionDigits: d }) : String(a);
  return (r < 0 ? '−' : '') + s;
}
/** TeX: the same with a hyphen minus and {,} commas */
export const nT = (v: number, d = 3): string => nH(v, d).replace('−', '-').replace(/,/g, '{,}');
/** fixed decimals (coefficients as technology rounds them): "−0.12", "53.18" */
export const fx = (v: number, d: number): string => { const r = rd(v, d); return (r < 0 ? '−' : '') + Math.abs(r).toFixed(d); };
export const fxT = (v: number, d: number): string => fx(v, d).replace('−', '-');
/** a signed number with its sign always written: "+1.5", "−0.3", "0" */
export const sg = (v: number, d = 3): string => (rd(v, d) > 0 ? '+' : '') + nH(v, d);
/** "ŷ = 23.9 − 0.12x" (HTML) and "\hat{y} = 23.9 - 0.12x" (TeX); coefficients as written (strings keep trailing zeros) */
export function modelH(a: string, b: string, x = 'x'): string {
  const neg = b.startsWith('−');
  return `ŷ = ${a} ${neg ? '−' : '+'} ${neg ? b.slice(1) : b}<i>${x}</i>`;
}
export function modelT(a: string, b: string, x = 'x'): string {
  const B = b.replace('−', '-'), neg = B.startsWith('-');
  return `\\hat{y} = ${a.replace('−', '-')} ${neg ? '-' : '+'} ${neg ? B.slice(1) : B}${x}`;
}
/** TI-84 style decimal: no leading zero (".9184", "−.1188"), at most `d` decimals */
export function ti(v: number, d = 4): string {
  const r = rd(v, d), s = String(Math.abs(r)).replace(/^0\./, '.');
  return (r < 0 ? '−' : '') + s;
}

// ---------- seeded data ----------
/** a bell-ish noise with standard deviation 1, in [−3, 3] (sum of three uniforms, centred and scaled) */
export const noise = (R: () => number): number => (R() + R() + R() - 1.5) * 2;
/** a value on a grid of `step` */
export const onGrid = (v: number, step: number): number => r9(Math.round(v / step) * step);
/** n distinct x values on a grid between lo and hi, spread out (one per slice of the interval), sorted */
export function spreadXs(R: () => number, n: number, lo: number, hi: number, step: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const s0 = lo + ((hi - lo) * i) / n, s1 = lo + ((hi - lo) * (i + 1)) / n;
    let x = onGrid(s0 + R() * (s1 - s0), step);
    x = Math.min(hi, Math.max(lo, x));
    if (!out.includes(x)) out.push(x);
  }
  return out.sort((p, q) => p - q);
}
/** try a maker until the test holds; throws when nothing is found (the tests run many seeds) */
export function until<T>(make: () => T, ok: (t: T) => boolean, tries = 4000): T {
  for (let i = 0; i < tries; i++) { const t = make(); if (ok(t)) return t; }
  throw new Error('until: no data found');
}
