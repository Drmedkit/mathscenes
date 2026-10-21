// ineqMaths.ts: exact maths of two-step inequalities, pure (no DOM, no canvas, no TeX engine).
//   an inequality      p·x + q  op  r   (lin)   or   p·(x + q)  op  r   (grp), written with the expression on the
//                      left (side 'L') or on the right (side 'R': r op' expr, op' the mirror of op)
//   solve()            undo the outer step first, then the inner one; the symbol turns ONLY when both sides are
//                      multiplied or divided by a negative number (asserted against brute-force testing)
//   chainPicture()     the three number lines of the solving chain (values of the expression, after the first undo,
//                      x) with the moves between them, for the StepLines block
// Numbers are exact rationals (core Q). A FORM says how they are written: 'int', 'dec' (terminating decimals) or
// 'frac' (fractions).
import { type Q, rat, qAdd, qMul, qDiv, qNum } from '../../../core/math';
import type { LineSpec, MapSpec, SetSpec, StepParams, TestSpec } from './StepLines';

// ---------- rationals ----------
export const q = (p: number, d = 1): Q => rat(p, d);
/** a terminating decimal (up to thousandths) as an exact fraction */
export function dq(x: number): Q {
  const p = Math.round(x * 1000);
  if (Math.abs(p / 1000 - x) > 1e-9) throw new RangeError(`not a decimal to thousandths: ${x}`);
  return rat(p, 1000);
}
export const qNeg = (a: Q): Q => rat(-a.p, a.q);
export const qSub = (a: Q, b: Q): Q => qAdd(a, qNeg(b));
export const qSame = (a: Q, b: Q): boolean => a.p === b.p && a.q === b.q;
export const qSign = (a: Q): number => Math.sign(a.p);
export const qCmp = (a: Q, b: Q): number => Math.sign(a.p * b.q - b.p * a.q);
export { qAdd, qMul, qDiv, qNum };

export type Form = 'int' | 'dec' | 'frac';
function places(a: Q, max = 4): number | null { for (let k = 0; k <= max; k++) if ((a.p * 10 ** k) % a.q === 0) return k; return null; }
export const isDec = (a: Q): boolean => places(a) !== null;
function decDigits(a: Q): string {
  const k = places(a);
  if (k === null) throw new RangeError(`${a.p}/${a.q} is not a terminating decimal`);
  const s = String(Math.round((Math.abs(a.p) * 10 ** k) / a.q)).padStart(k + 1, '0');
  return k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}` : s;
}
const MINUS = '−';
/** plain text (canvas words, choices): a real minus sign; fractions as a/b */
export function txt(a: Q, form: Form = 'int'): string {
  const m = a.p < 0 ? MINUS : '';
  if (a.q === 1) return m + Math.abs(a.p);
  if (form !== 'frac' && isDec(a)) return m + decDigits(a);
  return `${m}${Math.abs(a.p)}/${a.q}`;
}
/** TeX of a number */
export function tq(a: Q, form: Form = 'int'): string {
  const m = a.p < 0 ? '-' : '';
  if (a.q === 1) return m + Math.abs(a.p);
  if (form !== 'frac' && isDec(a)) return m + decDigits(a);
  return `${m}\\tfrac{${Math.abs(a.p)}}{${a.q}}`;
}
const frH = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
/** HTML of a number (a real minus sign, fractions stacked) */
export function hq(a: Q, form: Form = 'int'): string {
  const m = a.p < 0 ? '&minus;' : '';
  if (a.q === 1) return m + Math.abs(a.p);
  if (form !== 'frac' && isDec(a)) return m + decDigits(a);
  return `${m}${frH(Math.abs(a.p), a.q)}`;
}
/** the words a narrator says for a number */
export function sayQ(a: Q, form: Form = 'int'): string {
  const m = a.p < 0 ? 'negative ' : '';
  if (a.q === 1) return m + Math.abs(a.p);
  if (form !== 'frac' && isDec(a)) return m + decDigits(a).replace('.', ' point ');
  return `${m}${Math.abs(a.p)} over ${a.q}`;
}

// ---------- the four symbols ----------
export type Op = '<' | '>' | '<=' | '>=';
export const OPS: readonly Op[] = ['<', '>', '<=', '>='];
/** the reversed symbol (< and >, ≤ and ≥): what × or ÷ by a negative does, and what swapping the sides does */
export const flip = (o: Op): Op => ({ '<': '>', '>': '<', '<=': '>=', '>=': '<=' } as const)[o];
/** the same direction with the other inclusion (< and ≤): the "flips the inclusion" slip */
export const toggleEq = (o: Op): Op => ({ '<': '<=', '<=': '<', '>': '>=', '>=': '>' } as const)[o];
export const isStrict = (o: Op): boolean => o === '<' || o === '>';
/** x op b: the ray points right (+1) or left (-1) */
export const dirOf = (o: Op): 1 | -1 => (o === '>' || o === '>=' ? 1 : -1);
export const opFrom = (dir: 1 | -1, closed: boolean): Op => (dir > 0 ? (closed ? '>=' : '>') : closed ? '<=' : '<');
export function holds(a: number, o: Op, b: number): boolean {
  const e = 1e-9;
  return o === '<' ? a < b - e : o === '>' ? a > b + e : o === '<=' ? a <= b + e : a >= b - e;
}
export const holdsQ = (a: Q, o: Op, b: Q): boolean => { const c = qCmp(a, b); return o === '<' ? c < 0 : o === '>' ? c > 0 : o === '<=' ? c <= 0 : c >= 0; };
export const OP_TEX: Record<Op, string> = { '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge' };
export const OP_HTML: Record<Op, string> = { '<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥' };
export const OP_TXT: Record<Op, string> = { '<': '<', '>': '>', '<=': '≤', '>=': '≥' };
export const OP_SAY: Record<Op, string> = { '<': 'is less than', '>': 'is greater than', '<=': 'is less than or equal to', '>=': 'is greater than or equal to' };

// ---------- two-step inequalities ----------
export interface Ineq {
  kind: 'lin' | 'grp';
  p: Q; q: Q; r: Q;
  /** the symbol with the expression on the LEFT: expr op r */
  op: Op;
  /** how it is written: expr op r ('L') or r flip(op) expr ('R') */
  side: 'L' | 'R';
  /** lin only: q + p·x instead of p·x + q */
  qFirst?: boolean;
  form: Form;
  v: string;
}
export interface Solved {
  /** the solution: x op b */ b: Q; op: Op;
  /** the right side after the first undo (lin: r − q; grp: r ÷ p) */ mid: Q;
  /** the symbol after the first undo (grp with p < 0 already turned) */ midOp: Op;
  reversed: boolean;
}
export function solve(I: Ineq): Solved {
  if (I.p.p === 0) throw new RangeError('p = 0: not a two-step inequality');
  const neg = qSign(I.p) < 0;
  if (I.kind === 'lin') {
    const mid = qSub(I.r, I.q), b = qDiv(mid, I.p);
    return { b, op: neg ? flip(I.op) : I.op, mid, midOp: I.op, reversed: neg };
  }
  const mid = qDiv(I.r, I.p), b = qSub(mid, I.q), op = neg ? flip(I.op) : I.op;
  return { b, op, mid, midOp: op, reversed: neg };
}
/** the value of the expression at x */
export function evalExpr(I: Pick<Ineq, 'kind' | 'p' | 'q'>, x: Q): Q {
  return I.kind === 'lin' ? qAdd(qMul(I.p, x), I.q) : qMul(I.p, qAdd(x, I.q));
}
/** does x make the inequality true? */
export const satisfies = (I: Ineq, x: Q): boolean => holdsQ(evalExpr(I, x), I.op, I.r);

// ---------- writing it ----------
const X = (v: string) => `<i>${v}</i>`;
function coefT(p: Q, form: Form, v: string): string {
  if (p.p === p.q) return v;
  if (p.p === -p.q) return '-' + v;
  return `${tq(p, form)}${v}`;
}
function coefH(p: Q, form: Form, v: string): string {
  if (p.p === p.q) return X(v);
  if (p.p === -p.q) return '&minus;' + X(v);
  return `${hq(p, form)}${X(v)}`;
}
const absQ = (a: Q): Q => rat(Math.abs(a.p), a.q);
/** TeX of the expression (tagged parts optional): 3x + 5, 50 - 6h, -2(x - 1.5) */
export function exprTex(I: Pick<Ineq, 'kind' | 'p' | 'q' | 'qFirst' | 'form' | 'v'>): string {
  const { p, q: c, form, v } = I;
  const sg = (a: Q) => (qSign(a) < 0 ? `- ${tq(absQ(a), form)}` : `+ ${tq(a, form)}`);
  if (I.kind === 'grp') {
    const inner = c.p === 0 ? v : `${v} ${sg(c)}`;
    const co = p.p === p.q ? '' : p.p === -p.q ? '-' : tq(p, form);
    return `${co}(${inner})`;
  }
  if (c.p === 0) return coefT(p, form, v);
  if (I.qFirst) {
    const t = coefT(absQ(p), form, v);
    return `${tq(c, form)} ${qSign(p) < 0 ? '-' : '+'} ${t}`;
  }
  return `${coefT(p, form, v)} ${sg(c)}`;
}
export function exprHtml(I: Pick<Ineq, 'kind' | 'p' | 'q' | 'qFirst' | 'form' | 'v'>): string {
  const { p, q: c, form, v } = I;
  const sg = (a: Q) => (qSign(a) < 0 ? `&minus; ${hq(absQ(a), form)}` : `+ ${hq(a, form)}`);
  if (I.kind === 'grp') {
    const inner = c.p === 0 ? X(v) : `${X(v)} ${sg(c)}`;
    const co = p.p === p.q ? '' : p.p === -p.q ? '&minus;' : hq(p, form);
    return `${co}(${inner})`;
  }
  if (c.p === 0) return coefH(p, form, v);
  if (I.qFirst) return `${hq(c, form)} ${qSign(p) < 0 ? '&minus;' : '+'} ${coefH(absQ(p), form, v)}`;
  return `${coefH(p, form, v)} ${sg(c)}`;
}
/** plain text of the expression (canvas captions): 3x + 5, 50 − 6h, −2(x − 1.5) */
export function exprTxt(I: Pick<Ineq, 'kind' | 'p' | 'q' | 'qFirst' | 'form' | 'v'>): string {
  return exprHtml(I).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '($1/$2)').replace(/<[^>]+>/g, '').replace(/&minus;/g, '−');
}
/** the expression after the first undo, as plain text: 3x (lin) or x − 1.5 (grp) */
export function midTxt(I: Ineq): string {
  return I.kind === 'lin' ? exprTxt({ ...I, q: q(0) }) : exprTxt({ ...I, kind: 'lin', p: q(1) });
}
/** the expression read aloud */
export function exprSay(I: Pick<Ineq, 'kind' | 'p' | 'q' | 'qFirst' | 'form' | 'v'>): string {
  const { p, q: c, form, v } = I;
  const co = (a: Q) => (a.p === a.q ? v : a.p === -a.q ? `negative ${v}` : `${sayQ(a, form)} ${v}`);
  const sg = (a: Q) => (qSign(a) < 0 ? `minus ${sayQ(absQ(a), form)}` : `plus ${sayQ(a, form)}`);
  if (I.kind === 'grp') return `${p.p === p.q ? '' : sayQ(p, form) + ' times '}the quantity ${v} ${sg(c)}`;
  if (I.qFirst) return `${sayQ(c, form)} ${qSign(p) < 0 ? 'minus' : 'plus'} ${co(absQ(p))}`;
  return `${co(p)} ${sg(c)}`;
}
/** the whole inequality as written (TeX); tags: t = the expression, o = the symbol, r = the number */
export function ineqTex(I: Ineq, tags = false): string {
  const e = exprTex(I), r = tq(I.r, I.form);
  const T = (id: string, s: string) => (tags ? `\\cssId{${id}}{${s}}` : s);
  return I.side === 'L' ? `${T('t', e)} ${T('o', OP_TEX[I.op])} ${T('r', r)}` : `${T('r', r)} ${T('o', OP_TEX[flip(I.op)])} ${T('t', e)}`;
}
export function ineqHtml(I: Ineq): string {
  const e = exprHtml(I), r = hq(I.r, I.form);
  return I.side === 'L' ? `${e} ${OP_HTML[I.op]} ${r}` : `${r} ${OP_HTML[flip(I.op)]} ${e}`;
}
/** a solution set as text: x > 4 (x on the left) */
export const setTxt = (v: string, o: Op, b: Q, form: Form = 'int') => `${v} ${OP_TXT[o]} ${txt(b, form)}`;
export const setHtml = (v: string, o: Op, b: Q, form: Form = 'int') => `${X(v)} ${OP_HTML[o]} ${hq(b, form)}`;
export const setTex = (v: string, o: Op, b: Q, form: Form = 'int') => `${v} ${OP_TEX[o]} ${tq(b, form)}`;

// ---------- the solving chain on three number lines ----------
/** a nice tick step: the offset between labelled samples split into 2 (or kept whole when that is not friendly) */
function tickFor(off: number): number {
  const half = off / 2;
  const nice = [0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50];
  return nice.some(n => Math.abs(n - half) < 1e-9) ? half : off;
}
/** one number line centred on its boundary, samples at ±off, test values at ±2 off, the window ±2.25 off */
export function centredLine(b: number, off: number, caption: string, labels: LineSpec['labels']): LineSpec {
  return { lo: b - 2.25 * off, hi: b + 2.25 * off, tick: tickFor(off), origin: b, caption, labels };
}
export interface ChainPicture extends StepParams {
  /** x values: samples (b - s, b, b + s) and the two tests (b - 2s, b + 2s) */
  xs: number[]; tests: TestSpec[];
  /** the moves as TeX (written under both sides on the board) */
  moves: [string, string];
  /** line values of the boundary on each line */
  bs: [Q, Q, Q];
}
/** the step between samples in x: 1, or the denominator of p (so every image is a friendly number) */
export function sampleStep(I: Ineq): Q {
  return q(I.p.q > 1 ? I.p.q : 1);
}
export function chainPicture(I: Ineq, captions: [string, string, string] = [exprTxt(I), midTxt(I), I.v]): ChainPicture {
  const S = solve(I), s = sampleStep(I);
  const xs = [qSub(S.b, s), S.b, qAdd(S.b, s)];
  const neg = qSign(I.p) < 0;
  const form = I.form;
  // the value of each line at x: line 0 = the expression, line 1 = after the first undo, line 2 = x
  const at = (line: number, x: Q): Q => {
    if (line === 2) return x;
    if (line === 0) return evalExpr(I, x);
    return I.kind === 'lin' ? qMul(I.p, x) : qAdd(x, I.q);
  };
  const slope = (line: number): Q => (line === 2 ? q(1) : I.kind === 'lin' || line === 0 ? I.p : q(1));
  const bs: [Q, Q, Q] = [at(0, S.b), at(1, S.b), S.b];
  if (!qSame(bs[0], I.r)) throw new RangeError('chainPicture: the boundary does not map to r');
  const lines: LineSpec[] = [0, 1, 2].map(i => {
    const off = qNum(qMul(absQ(slope(i)), s));
    const labels = xs.map((x, k) => ({ v: qNum(at(i, x)), text: txt(at(i, x), form), col: (k === 1 ? 'first' : 'dim') as LineSpec['labels'][number]['col'], at: (k === 1 ? 'set' : 'lab') as 'set' | 'lab' }));
    return centredLine(qNum(bs[i]!), off, captions[i]!, labels);
  });
  // the moves: lin  - q then ÷ p;  grp  ÷ p then - q
  const mq = (qSign(I.q) < 0 ? '+\\,' : '-\\,') + tq(absQ(I.q), form);
  const pT = qSign(I.p) < 0 ? `(${tq(I.p, form)})` : tq(I.p, form);
  const mp = I.p.q > 1 && form === 'frac' ? `\\times ${qSign(I.p) < 0 ? `(${tq(rat(I.p.q, I.p.p), form)})` : tq(rat(I.p.q, I.p.p), form)}` : `\\div ${pT}`;
  const maps: MapSpec[] = I.kind === 'lin'
    ? [{ a: 1, c: -qNum(I.q), from: xs.map(x => qNum(at(0, x))) }, { a: 1 / qNum(I.p), c: 0, from: xs.map(x => qNum(at(1, x))) }]
    : [{ a: 1 / qNum(I.p), c: 0, from: xs.map(x => qNum(at(0, x))) }, { a: 1, c: -qNum(I.q), from: xs.map(x => qNum(at(1, x))) }];
  const o0 = I.op, o1 = S.midOp, o2 = S.op;
  const set = (b: Q, o: Op, col: SetSpec['col']): SetSpec => ({ b: qNum(b), dir: dirOf(o), closed: !isStrict(o), col });
  const sets: SetSpec[] = [set(bs[0], o0, 'second'), set(bs[1], o1, 'second'), set(bs[2], o2, 'link')];
  const tv = [qSub(S.b, qMul(q(2), s)), qAdd(S.b, qMul(q(2), s))];
  const tests: TestSpec[] = tv.map(x => ({ v: qNum(x), ok: satisfies(I, x), text: txt(x, form) }));
  void neg;
  return { lines, sets, maps, tests, xs: [...xs, ...tv].map(qNum), moves: I.kind === 'lin' ? [mq, mp] : [mp, mq], bs };
}

/** brute-force check of a solution set: every test value agrees with the inequality (used by tests and asserts) */
export function agreesEverywhere(I: Ineq, op: Op, b: Q): boolean {
  const xs: Q[] = [];
  for (let k = -40; k <= 40; k++) xs.push(qAdd(b, q(k, 4)));
  return xs.every(x => satisfies(I, x) === holdsQ(x, op, b));
}
