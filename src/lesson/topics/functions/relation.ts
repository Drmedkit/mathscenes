// relation.ts: the exact maths of "function: exactly one output for each allowed input". Pure (no DOM, no canvas).
//   pairs        a relation as (input, output) pairs; values are numbers or names
//   check        isFunction over the inputs that occur, or over a STATED input set (an allowed input with no output
//                is a witness too); the witness is quoted from the pairs (an input with two different outputs)
//   sets         domain / range as distinct values (first-seen order, or sorted for numbers)
//   rules        y = ax + b, y = c, y = ax², y = |x| (exact on integers), their TeX and their spoken form
//   equations    the four two-variable equations of the topic (x + y = 7, 2x + 3y = 6, x = y², x² + y² = 25)
//   segments     a graph segment with open / closed ends: domain and range as inequalities
export type V = number | string;
export type Pair = readonly [V, V];

const eq = (a: V, b: V) => a === b;
/** distinct values in first-seen order */
export function distinct(vs: readonly V[]): V[] { const out: V[] = []; for (const v of vs) if (!out.some(o => eq(o, v))) out.push(v); return out; }
export const sortVals = (vs: readonly V[]): V[] => [...vs].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
export const inputsOf = (P: readonly Pair[]): V[] => distinct(P.map(p => p[0]));
export const outputsOf = (P: readonly Pair[], x?: V): V[] => distinct(P.filter(p => x === undefined || eq(p[0], x)).map(p => p[1]));

export type Witness = { kind: 'two'; x: V; y1: V; y2: V } | { kind: 'none'; x: V };
export interface FnCheck { fn: boolean; witness: Witness | null }
/** is the relation a function (on `allowed` when the input set is stated)? An input outside `allowed` is an error. */
export function checkFunction(P: readonly Pair[], allowed?: readonly V[]): FnCheck {
  if (allowed) for (const p of P) if (!allowed.some(a => eq(a, p[0]))) throw new Error(`relation: input ${p[0]} is not in the stated input set`);
  for (const x of allowed ?? inputsOf(P)) {
    const ys = outputsOf(P, x);
    if (ys.length >= 2) return { fn: false, witness: { kind: 'two', x, y1: ys[0]!, y2: ys[1]! } };
    if (ys.length === 0) return { fn: false, witness: { kind: 'none', x } };
  }
  return { fn: true, witness: null };
}
/** the reverse relation (output -> input) */
export const flip = (P: readonly Pair[]): Pair[] => P.map(p => [p[1], p[0]] as const);
/** is every output reached by one input only (the extra condition a function does NOT need)? */
export const oneToOne = (P: readonly Pair[]): boolean => outputsOf(P).every(y => distinct(P.filter(p => eq(p[1], y)).map(p => p[0])).length === 1);
/** an output shared by two different inputs, or null */
export function sharedOutput(P: readonly Pair[]): { y: V; x1: V; x2: V } | null {
  for (const y of outputsOf(P)) { const xs = distinct(P.filter(p => eq(p[1], y)).map(p => p[0])); if (xs.length >= 2) return { y, x1: xs[0]!, x2: xs[1]! }; }
  return null;
}
/** a row that appears twice with the same output (still a function) */
export function duplicateRow(P: readonly Pair[]): Pair | null {
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (eq(P[i]![0], P[j]![0]) && eq(P[i]![1], P[j]![1])) return P[i]!;
  return null;
}

// ---------- writing numbers ----------
/** HTML: a real minus sign */
export const hn = (v: V): string => (typeof v === 'number' ? (v < 0 ? '−' + Math.abs(v) : String(v)).replace(/\.5$/, '.5') : v);
/** TeX */
export const tn = (v: V): string => (typeof v === 'number' ? (v < 0 ? `{-${-v}}` : String(v)) : `\\text{${v}}`);
/** read aloud */
export function sayNum(v: V): string {
  if (typeof v !== 'number') return v;
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const a = Math.abs(v), w = a < 20 ? ONES[a]! : a < 100 ? TENS[Math.floor(a / 10)]! + (a % 10 ? '-' + ONES[a % 10] : '') : String(a);
  return (v < 0 ? 'negative ' : '') + w;
}
export const setHtml = (vs: readonly V[]): string => `{${vs.map(hn).join(', ')}}`;
export const setTex = (vs: readonly V[]): string => `\\{${vs.map(tn).join(',\\ ')}\\}`;
export const pairHtml = (p: Pair): string => `(${hn(p[0])}, ${hn(p[1])})`;
export const pairTex = (p: Pair): string => `(${tn(p[0])},\\, ${tn(p[1])})`;

// ---------- explicit rules ----------
export type Rule =
  | { kind: 'lin'; a: number; b: number }
  | { kind: 'const'; c: number }
  | { kind: 'sq'; a: number; b: number }
  | { kind: 'abs'; a: number; b: number };
export function evalRule(r: Rule, x: number): number {
  switch (r.kind) {
    case 'lin': return r.a * x + r.b;
    case 'const': return r.c;
    case 'sq': return r.a * x * x + r.b;
    case 'abs': return r.a * Math.abs(x) + r.b;
  }
}
const coef = (a: number, v: string) => (a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`);
const plus = (b: number) => (b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${-b}`);
export function ruleTex(r: Rule): string {
  switch (r.kind) {
    case 'lin': return `y = ${r.a === 0 ? String(r.b) : coef(r.a, 'x') + plus(r.b)}`;
    case 'const': return `y = ${r.c}`;
    case 'sq': return `y = ${coef(r.a, 'x^2')}${plus(r.b)}`;
    case 'abs': return `y = ${coef(r.a, '|x|')}${plus(r.b)}`;
  }
}
export const ruleHtml = (r: Rule): string => ruleTex(r).replace(/x\^2/g, 'x²').replace(/-/g, '−').replace(/(\d)x/g, '$1x');
export function ruleSay(r: Rule): string {
  const k = (a: number, v: string) => (a === 1 ? v : a === -1 ? `negative ${v}` : `${sayNum(a)} ${v}`);
  const p = (b: number) => (b === 0 ? '' : b > 0 ? ` plus ${sayNum(b)}` : ` minus ${sayNum(-b)}`);
  switch (r.kind) {
    case 'lin': return `y equals ${k(r.a, 'x')}${p(r.b)}`;
    case 'const': return `y equals ${sayNum(r.c)}`;
    case 'sq': return `y equals ${k(r.a, 'x squared')}${p(r.b)}`;
    case 'abs': return `y equals ${k(r.a, 'the absolute value of x')}${p(r.b)}`;
  }
}

// ---------- two-variable equations ----------
export type EqId = 'sum7' | 'lin236' | 'sideways' | 'circle25';
export const EQS: Record<EqId, { tex: string; html: string; sat: (x: number, y: number) => boolean; left: (x: number, y: number) => number; right: number; leftHtml: (x: number, y: number) => string }> = {
  sum7: { tex: 'x + y = 7', html: 'x + y = 7', sat: (x, y) => x + y === 7, left: (x, y) => x + y, right: 7, leftHtml: (x, y) => `${hn(x)} + ${par(y)}` },
  lin236: { tex: '2x + 3y = 6', html: '2x + 3y = 6', sat: (x, y) => 2 * x + 3 * y === 6, left: (x, y) => 2 * x + 3 * y, right: 6, leftHtml: (x, y) => `2 · ${par(x)} + 3 · ${par(y)}` },
  sideways: { tex: 'x = y^2', html: 'x = y²', sat: (x, y) => x === y * y, left: (_x, y) => y * y, right: NaN, leftHtml: (_x, y) => `${par(y)}²` },
  circle25: { tex: 'x^2 + y^2 = 25', html: 'x² + y² = 25', sat: (x, y) => x * x + y * y === 25, left: (x, y) => x * x + y * y, right: 25, leftHtml: (x, y) => `${par(x)}² + ${par(y)}²` },
};
function par(v: number): string { return v < 0 ? `(${hn(v)})` : hn(v); }

// ---------- a graph segment: domain and range as inequalities ----------
export interface Seg { x0: number; y0: number; c0: boolean; x1: number; y1: number; c1: boolean }
/** the inequality for the values between lo and hi with inclusion; v = 'x' or 'y' */
export function ineqTex(v: 'x' | 'y', lo: number, loIn: boolean, hi: number, hiIn: boolean): string {
  if (lo === hi) return `${v} = ${lo}`;
  return `${lo} ${loIn ? '\\le' : '<'} ${v} ${hiIn ? '\\le' : '<'} ${hi}`;
}
export function ineqHtml(v: 'x' | 'y', lo: number, loIn: boolean, hi: number, hiIn: boolean): string {
  if (lo === hi) return `${v} = ${hn(lo)}`;
  return `${hn(lo)} ${loIn ? '≤' : '<'} ${v} ${hiIn ? '≤' : '<'} ${hn(hi)}`;
}
export function segDomain(s: Seg): { lo: number; loIn: boolean; hi: number; hiIn: boolean } {
  if (s.x0 > s.x1) return segDomain({ x0: s.x1, y0: s.y1, c0: s.c1, x1: s.x0, y1: s.y0, c1: s.c0 });
  if (s.x0 === s.x1) throw new Error('segment: a vertical segment is not used here');
  return { lo: s.x0, loIn: s.c0, hi: s.x1, hiIn: s.c1 };
}
export function segRange(s: Seg): { lo: number; loIn: boolean; hi: number; hiIn: boolean } {
  if (s.y0 === s.y1) return { lo: s.y0, loIn: s.c0 || s.c1, hi: s.y0, hiIn: s.c0 || s.c1 };
  return s.y0 < s.y1 ? { lo: s.y0, loIn: s.c0, hi: s.y1, hiIn: s.c1 } : { lo: s.y1, loIn: s.c1, hi: s.y0, hiIn: s.c0 };
}
