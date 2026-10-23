// oracle-kit.mjs: small, lesson-neutral helpers for oracle writers (tests/oracle/<slug>.mjs). Reading text and TeX,
// exact fractions, rounding. Nothing here knows any lesson's answers. See docs/lessons/QUALITY_LAYER.md.
//   import { nums, texPlain, texTable, Q, round, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

/** every number in a plain text, in order: −3, 2.5, 1,450 → 1450, $4.50 → 4.5 (a fraction a/b gives a and b) */
export function nums(text) {
  return [...String(text).replace(/(\d),(\d{3})(?!\d)/g, '$1$2').matchAll(/(?<![\w.])([-−]?)\$?(\d+(?:\.\d+)?|\.\d+)/g)]
    .map(m => (m[1] ? -1 : 1) * Number(m[2]));
}
/** every fraction a/b (or w a/b) in a plain text, as Q values */
export function fracs(text) {
  return [...String(text).matchAll(/(?<![\w.\/])([-−]?)(?:(\d+)\s+)?(\d+)\/(\d+)(?![\d\/])/g)]
    .map(m => { const f = Q(Number(m[3]), Number(m[4])).add(Number(m[2] ?? 0)); return m[1] ? f.neg() : f; });
}
/** TeX → plain text: \frac{a}{b} → (a)/(b) (bare a/b when both are simple), \times ×, \div ÷, \cdot ·, ^\circ °, \% %,
 *  \text{w} w, \cssId{id}{X} X, \sqrt{x} √(x), \pi π, spacing commands dropped, - → − kept as '-' */
export function texPlain(tex) {
  let s = String(tex);
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf|mathbf|operatorname)\{([^{}]*)\}/g, '$1')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => (/^[\w.]+$/.test(a) && /^[\w.]+$/.test(b) ? `${a}/${b}` : `(${a})/(${b})`))
      .replace(/\\sqrt\{([^{}]*)\}/g, '√($1)').replace(/\\sqrt\[(\d+)\]\{([^{}]*)\}/g, '$1√($2)')
      .replace(/\\overline\{([^{}]*)\}/g, '$1').replace(/\\(?:boxed|underline|color\{[^{}]*\})\{([^{}]*)\}/g, '$1');
    if (s === before) break;
  }
  return s.replace(/\^\{?\\circ\}?/g, '°').replace(/\\circ/g, '°').replace(/\\%/g, '%').replace(/\\times/g, '×').replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·').replace(/\\pi/g, 'π').replace(/\\approx/g, '≈').replace(/\\le(q)?\b/g, '≤').replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\ne(q)?\b/g, '≠').replace(/\\to\b/g, '→').replace(/\\rightarrow/g, '→').replace(/\\xrightarrow\{([^{}]*)\}/g, '→[$1]')
    .replace(/\\square/g, '□').replace(/\\left|\\right/g, '').replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ').replace(/\\\\/g, ' ; ')
    .replace(/&/g, ' ').replace(/[{}]/g, '').replace(/\\[a-zA-Z]+/g, '').replace(/\s+/g, ' ').trim();
}
/** the rows of a TeX \begin{array} / aligned table as arrays of plain cells (an \hline row is skipped) */
export function texTable(tex) {
  const m = String(tex).match(/\\begin\{(?:array|aligned|matrix|tabular)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{/);
  if (!m) return [];
  return m[1].split(/\\\\/).map(r => r.replace(/\\hline/g, '').trim()).filter(Boolean).map(r => r.split('&').map(c => texPlain(c)));
}
/** index of the one choice whose plain text passes `pred`; -1 when none or more than one does */
export function choiceWhere(q, pred) {
  const hits = (q.choices ?? []).map((c, i) => (pred(c, i) ? i : -1)).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -1;
}
/** round half away from zero to `places` decimals, without float noise */
export function round(v, places = 0) {
  const k = 10 ** places, r = Math.sign(v) * Math.round(Math.abs(v) * k + 1e-9) / k;
  return Number(r.toFixed(places));
}

// ---- exact fractions ----
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
class Frac {
  constructor(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d)) { const f = fromNumber(n / d); n = f[0]; d = f[1]; }
    if (d === 0) throw new Error('fraction with denominator 0');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; this.n = n / g; this.d = d / g;
  }
  static of(v) { return v instanceof Frac ? v : typeof v === 'string' ? parseQ(v) : new Frac(v, 1); }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
  cmp(o) { o = Frac.of(o); return Math.sign(this.n * o.d - o.n * this.d); }
  get value() { return this.n / this.d; }
  /** as an oracle answer for a 'frac' input: [n, d] */
  get pair() { return [this.n, this.d]; }
  toString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
}
function fromNumber(v) {
  let h0 = 1, h1 = 0, k0 = 0, k1 = 1, x = v;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(x);
    [h0, h1] = [a * h0 + h1, h0]; [k0, k1] = [a * k0 + k1, k0];
    if (Math.abs(h0 / k0 - v) <= 1e-12 * Math.max(1, Math.abs(v))) return [h0, k0];
    x = 1 / (x - a);
    if (!Number.isFinite(x) || k0 > 1e7) break;
  }
  throw new Error(`not a clean fraction: ${v}`);
}
function parseQ(s) {
  const t = s.trim().replace(/−/g, '-');
  let m = t.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (m) { const f = new Frac(Number(m[2]) * Number(m[4]) + Number(m[3]), Number(m[4])); return m[1] ? f.neg() : f; }
  m = t.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) return new Frac(Number(m[1]), Number(m[2]));
  return new Frac(Number(t), 1);
}
/** an exact fraction: Q(3, 4), Q('2 1/2'), Q(0.75); .add .sub .mul .div .neg .eq .cmp .value .pair */
export const Q = (n, d = 1) => (typeof n === 'string' && d === 1 ? parseQ(n) : new Frac(n, d));
