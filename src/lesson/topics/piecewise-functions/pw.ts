// pw.ts: the exact maths of "Piecewise and step functions" (no DOM). A piecewise function is a list of pieces; each
// piece is a rule (a serialisable formula: linear / constant, quadratic in vertex form, exponential, reciprocal) and an
// input condition (an interval with included or excluded ends, a ray, or a single point x = a). The input picks the
// piece by testing the condition; a breakpoint belongs to the piece whose condition includes it (≤ / ≥), and an input
// no piece covers has no output. Formatting for TeX (the board) and HTML (the panel) lives here too, so the generators,
// the page and the tests all read the same rules.

export type Fn =
  | { k: 'lin'; m: number; b: number }
  /** a(x − h)² + v */
  | { k: 'quad'; a: number; h: number; v: number }
  /** a · b^x + c */
  | { k: 'exp'; a: number; b: number; c?: number }
  /** c / x + d */
  | { k: 'rec'; c: number; d?: number };
/** an input condition: lo / hi undefined = unbounded; lo === hi with both included = the single input x = lo */
export interface Piece { fn: Fn; lo?: number; hi?: number; loIn?: boolean; hiIn?: boolean }

export const clean = (v: number) => (Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : Math.round(v * 1e9) / 1e9);
export const lin = (m: number, b: number): Fn => ({ k: 'lin', m, b });
export const cst = (b: number): Fn => ({ k: 'lin', m: 0, b });

export function ev(f: Fn, x: number): number {
  switch (f.k) {
    case 'lin': return clean(f.m * x + f.b);
    case 'quad': return clean(f.a * (x - f.h) ** 2 + f.v);
    case 'exp': return clean(f.a * f.b ** x + (f.c ?? 0));
    case 'rec': return x === 0 ? NaN : clean(f.c / x + (f.d ?? 0));
  }
}
export function covers(p: Piece, x: number): boolean {
  if (p.lo !== undefined && (x < p.lo - 1e-12 || (Math.abs(x - p.lo) < 1e-12 && !p.loIn))) return false;
  if (p.hi !== undefined && (x > p.hi + 1e-12 || (Math.abs(x - p.hi) < 1e-12 && !p.hiIn))) return false;
  return true;
}
/** the indexes of the pieces whose condition holds at x */
export const owners = (ps: readonly Piece[], x: number) => ps.map((p, i) => (covers(p, x) ? i : -1)).filter(i => i >= 0);
/** f(x): the owning piece's value; undefined when no piece covers x (or two disagree) */
export function fAt(ps: readonly Piece[], x: number): number | undefined {
  const o = owners(ps, x);
  if (!o.length) return undefined;
  const vs = [...new Set(o.map(i => ev(ps[i]!.fn, x)))];
  return vs.length === 1 && Number.isFinite(vs[0]!) ? vs[0] : undefined;
}

// ---------- numbers ----------
/** a number for HTML: real minus sign, no float noise, up to 4 decimals */
export const N = (v: number): string => { const r = clean(v); return (r < 0 ? '−' : '') + String(Math.abs(r)); };
/** a number for TeX */
export const NT = (v: number): string => { const r = clean(v); return (r < 0 ? '-' : '') + String(Math.abs(r)); };
/** money: $4, $4.50, −$3 */
export const $ = (v: number): string => { const r = Math.round(v * 100) / 100; const s = Number.isInteger(r) ? String(Math.abs(r)) : Math.abs(r).toFixed(2); return (r < 0 ? '−$' : '$') + s; };
export const $T = (v: number): string => $(v).replace('−', '-').replace('$', '\\$');

// ---------- formulas ----------
function coefX(m: number, v: string, tex: boolean): string {
  const minus = tex ? '-' : '−';
  if (m === 1) return v;
  if (m === -1) return minus + v;
  return (tex ? NT(m) : N(m)) + v;
}
function plusConst(b: number, tex: boolean): string {
  if (b === 0) return '';
  return b > 0 ? ` + ${tex ? NT(b) : N(b)}` : ` ${tex ? '-' : '−'} ${tex ? NT(-b) : N(-b)}`;
}
/** a formula as text: tex = TeX, else HTML (x in italics) */
export function fnStr(f: Fn, tex = false, v = 'x'): string {
  const X = tex ? v : `<i>${v}</i>`;
  const n = (z: number) => (tex ? NT(z) : N(z));
  switch (f.k) {
    case 'lin': return f.m === 0 ? n(f.b) : coefX(f.m, X, tex) + plusConst(f.b, tex);
    case 'quad': {
      const sq = f.h === 0 ? (tex ? `${v}^2` : `${X}<sup>2</sup>`) : tex ? `(${v}${plusConst(-f.h, true)})^2` : `(${X}${plusConst(-f.h, false)})<sup>2</sup>`;
      return (f.a === 1 ? '' : f.a === -1 ? (tex ? '-' : '−') : n(f.a)) + sq + plusConst(f.v, tex);
    }
    case 'exp': {
      const pw = tex ? `${n(f.b)}^{${v}}` : `${n(f.b)}<sup>${X}</sup>`;
      return (f.a === 1 ? '' : tex ? `${n(f.a)} \\cdot ` : `${n(f.a)} · `) + pw + plusConst(f.c ?? 0, tex);
    }
    case 'rec': return (tex ? `\\frac{${n(f.c)}}{${v}}` : `${n(f.c)}/${X}`) + plusConst(f.d ?? 0, tex);
  }
}
/** a condition as text */
export function condStr(p: Piece, tex = false, v = 'x'): string {
  const X = tex ? v : `<i>${v}</i>`;
  const n = (z: number) => (tex ? NT(z) : N(z));
  const lt = tex ? '<' : '&lt;', le = tex ? '\\le' : '≤', gt = tex ? '>' : '&gt;', ge = tex ? '\\ge' : '≥';
  if (p.lo !== undefined && p.hi !== undefined && p.lo === p.hi) return `${X} = ${n(p.lo)}`;
  if (p.lo === undefined && p.hi === undefined) return tex ? '\\text{all } x' : `all ${X}`;
  if (p.lo === undefined) return `${X} ${p.hiIn ? le : lt} ${n(p.hi!)}`;
  if (p.hi === undefined) return `${X} ${p.loIn ? ge : gt} ${n(p.lo)}`;
  return `${n(p.lo)} ${p.loIn ? le : lt} ${X} ${p.hiIn ? le : lt} ${n(p.hi)}`;
}
/** the whole rule in cases notation (TeX) */
export function casesTex(name: string, ps: readonly Piece[], v = 'x'): string {
  return `${name}(${v}) = \\begin{cases} ${ps.map(p => `${fnStr(p.fn, true, v)}, & ${condStr(p, true, v)}`).join(' \\\\ ')} \\end{cases}`;
}
/** the rule on one line of HTML: "2x + 1 if x < 3; 7 if x ≥ 3" */
export const casesHtml = (ps: readonly Piece[], v = 'x') => ps.map(p => `${fnStr(p.fn, false, v)} if ${condStr(p, false, v)}`).join('; ');

// ---------- windows ----------
export interface Axis { min: number; max: number; step: number; name?: string }
const STEPS = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
/** an axis over the values: multiples of a step from STEPS, at most `cells` cells, a little room, 0 inside when asked */
export function axisOver(vals: readonly number[], o: { cells?: number; zero?: boolean; pad?: number; name?: string; minStep?: number } = {}): Axis {
  const cells = o.cells ?? 12, vs = o.zero === false ? [...vals] : [...vals, 0];
  const lo = Math.min(...vs), hi = Math.max(...vs);
  for (const step of STEPS) {
    if (step < (o.minStep ?? 1)) continue;
    const pad = o.pad ?? 1;
    let min = Math.floor(lo / step + 1e-9) * step, max = Math.ceil(hi / step - 1e-9) * step;
    if (lo - min < step * 0.4 && !(o.zero !== false && lo === 0)) min -= pad * step;
    if (max - hi < step * 0.4) max += pad * step;
    let n = Math.round((max - min) / step);
    while (n < 4) { max += step; n++; }
    if (n <= cells) return { min: clean(min), max: clean(max), step, name: o.name };
  }
  throw new Error('axisOver: no step fits');
}
/** the values a piece takes over the window (sampled, with its ends): for the y axis */
export function piecesRange(ps: readonly Piece[], x0: number, x1: number): number[] {
  const out: number[] = [];
  for (const p of ps) {
    const a = Math.max(p.lo ?? x0, x0), b = Math.min(p.hi ?? x1, x1);
    if (b < a) continue;
    for (let i = 0; i <= 40; i++) { const y = ev(p.fn, a + (b - a) * i / 40); if (Number.isFinite(y)) out.push(y); }
  }
  return out;
}
/** the breakpoints of a rule (finite ends), sorted, distinct */
export const breaks = (ps: readonly Piece[]) => [...new Set(ps.flatMap(p => [p.lo, p.hi]).filter((v): v is number => v !== undefined))].sort((a, b) => a - b);
