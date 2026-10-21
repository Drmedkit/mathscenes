// items.ts: practice families for "one-step inequalities and signed one-step equations" (grade 7, 7.EE.B.4,
// 7.NS.A.3). Each family is one deep structure; a generator receives the sub-goal id and uses that sub-goal's number
// ranges (topic JSON `cases`). Every wrong answer the classifier recognises carries its misconception id
// (math-curriculum-essentials/misconceptions.json). Pure: no DOM, no canvas. Every solve is checked by substitution
// (ineq.ts) in the tests; every picture is a SignLine the tests build.
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import { stepTex, type N, type OneStep, type Rel, type Style, N as Nq, REL_HTML, REL_TEX, abs, add, cmp, dec, dirOf, div, eq, exprHtml, exprTex, flip, holds, invTex, invWords, isInt, lhs, mul, nHtml, nPlain, nTex, neg, showsNegative, solHtml, solTex, solve, stHtml, stTex, strict, sub, terminates, val } from './ineq';
import { type SignLineParams, type TestSpec, SignLine, autoAxis, fmt } from './SignLine';
import { frame } from '../../../blocks/block';
import { dusk } from '../../dusk';

/** the practice frame (the page draws pictures in it); a generator only keeps a picture the block can draw */
export const PIC_FRAME = frame(60, 70, 940, 940);
export function fits(p: SignLineParams): boolean { try { SignLine(p, PIC_FRAME, dusk); return true; } catch { return false; } }

export type FamilyId = 'solveAdd' | 'graph' | 'testPoint' | 'solveScale' | 'boundaryNum' | 'contextCount' | 'contextSet' | 'geometry'
  | 'addEq' | 'mulEq' | 'ratEq' | 'flipMap' | 'justify' | 'signedContext';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  solveAdd: 'Solve: add or subtract',
  graph: 'Read the graph',
  testPoint: 'Test a value',
  solveScale: 'Solve: multiply or divide',
  boundaryNum: 'Find the boundary',
  contextCount: 'Whole things only',
  contextSet: 'What the situation allows',
  geometry: 'Fences, rugs, boxes, angles',
  addEq: 'Signed equation: add or subtract',
  mulEq: 'Signed equation: multiply or divide',
  ratEq: 'Decimals and fractions with signs',
  flipMap: 'Flip or keep?',
  justify: 'Name the reason',
  signedContext: 'Temperature, depth, balance',
};

/** the picture the page draws: a SignLine; `show` keys are drawn at once, `solve` keys are played after a miss,
 *  `board` is TeX written on the board during the replay */
export interface LinePicture { kind: 'line'; params: SignLineParams; show: string[]; half?: string[]; solve: string[]; board: string[] }

export const MC = {
  boundary: 'mc.linear-equations.boundary-only-solution',
  revAdd: 'mc.linear-equations.reverses-after-addition-or-subtraction',
  visible: 'mc.equal-sign.operates-on-visible-numbers',
  fracRev: 'mc.linear-equations.proper-fraction-scaling-reverses-order',
  domain: 'mc.functions-concept.context-domain-all-reals',
  rounds: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  areaPer: 'mc.area-perimeter.confuses-area-with-perimeter',
  eqBound: 'mc.linear-equations.equation-for-a-bound',
  negReject: 'mc.integers.negative-result-rejected',
  subNeg: 'mc.integers.subtract-negative-as-positive',
  noSign: 'mc.integers.divide-by-coefficient-without-sign',
  zeroDiv: 'mc.mul-div.zero-divided-by-number',
  anyNeg: 'mc.linear-equations.reverses-for-any-negative-sign',
  noRev: 'mc.linear-equations.no-reversal-for-negative',
  examples: 'mc.reasoning-language.examples-as-proof',
} as const;

/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };
/** the solved form behind an item (tests check it by substitution) */
export const FORMS = new WeakMap<Item, OneStep>();

// ---------- shared pieces ----------
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function options(R: () => number, opts: Opt[]): { choices: string[]; right: number; says: { say: string; mc?: string }[] } {
  const seen = new Set<string>(), uniq: Opt[] = [];
  for (const o of opts) if (!seen.has(o.t)) { seen.add(o.t); uniq.push(o); }
  const o = shuffle(R, uniq);
  const right = o.findIndex(x => x.ok);
  return { choices: o.map(x => x.t), right, says: o.map(x => ({ say: x.say, mc: x.mc })) };
}
function choiceCheck(r: Response, right: number, says: { say: string; mc?: string }[]): Verdict {
  if (r.kind !== 'choice') return { ok: false, say: 'Pick one answer.' };
  const s = says[r.i];
  if (!s) return { ok: false, say: 'Pick one answer.' };
  return { ok: r.i === right, mc: r.i === right ? undefined : s.mc, say: s.say };
}
/** the number a kid typed, exactly when it has at most 4 decimals */
function typed(r: Response): N | null {
  if (r.kind !== 'num' || !Number.isFinite(r.v)) return null;
  try { return dec(r.v); } catch { return null; }
}
interface NumWrong { v: N; mc?: string; say: string }
function numCheck(r: Response, ans: N, okSay: string, wrongs: NumWrong[], fallback: string): Verdict {
  if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (use - for a negative number).' };
  const v = typed(r);
  if (v && eq(v, ans)) return { ok: true, say: okSay };
  if (!v && Math.abs(r.v - val(ans)) < 1e-9) return { ok: true, say: okSay };
  for (const w of wrongs) if (v && eq(v, w.v) && !eq(w.v, ans)) return { ok: false, mc: w.mc, say: w.say };
  return { ok: false, say: fallback };
}
const numR = (a: N): Response => ({ kind: 'num', v: val(a) });
const I = (n: number) => Nq(n);
const V = ['x', 'x', 'x', 'y', 'n', 'm', 'k', 'w'];
/** a solution set as words for the panel ("<i>x</i> &gt; −3") */
const sol = (v: string, r: Rel, b: N, st: Style = 'dec') => solHtml(v, r, b, st);

/** the line under one inequality: boundary b, the solution set, a test value on each side */
function testValues(b: N, r: Rel, step: number): [number, number] {
  const bv = val(b), d = dirOf(r) || 1;
  const beyond = (dir: number) => {
    let x = dir > 0 ? Math.floor(bv / step + 1e-9) * step + step : Math.ceil(bv / step - 1e-9) * step - step;
    if (Math.abs(x - bv) < 0.45 * step) x += dir * step;
    return Math.round(x * 1e6) / 1e6;
  };
  return [beyond(d), beyond(-d)];
}
/** an axis around some values whose test values sit on its numbered ticks (so their labels never collide) */
function testedAxis(b: N, r: Rel, extra: number[]): { axis: ReturnType<typeof autoAxis>; tin: number; tout: number } {
  let axis = autoAxis([val(b), ...extra], { zero: true });
  let [tin, tout] = testValues(b, r, axis.tick * axis.every);
  for (let i = 0; i < 4; i++) {
    const next = autoAxis([val(b), tin, tout, ...extra], { zero: true });
    const t2 = testValues(b, r, next.tick * next.every);
    axis = next;
    if (t2[0] === tin && t2[1] === tout) break;
    [tin, tout] = t2;
  }
  return { axis, tin, tout };
}
/** a single number line for the solution of f (or of `x REL b` directly) */
function solutionPic(v: string, r: Rel, b: N, st: Style, o: { f?: OneStep; domain?: { lo: N; loClosed: boolean } } = {}): LinePicture {
  const bv = val(b);
  const { axis, tin, tout } = testedAxis(b, r, o.domain ? [val(o.domain.lo)] : []);
  const d = dirOf(r);
  const tests: TestSpec[] = [];
  const truth = (t: number) => {
    let ok: boolean;
    try { const q = dec(t); ok = o.f ? holds(o.f, q) : relOk(q, r, b); } catch { ok = false; }
    if (o.domain && cmp(dec(t), o.domain.lo) < (o.domain.loClosed ? 0 : 1)) ok = false;
    return ok;
  };
  if (!o.domain || (o.domain.loClosed ? tout >= val(o.domain.lo) : tout > val(o.domain.lo))) tests.push({ key: 't.out', axis: 'x', v: tout, tex: fmt(tout), ok: truth(tout) });
  tests.push({ key: 't.in', axis: 'x', v: tin, tex: fmt(tin), ok: truth(tin) });
  const params: SignLineParams = {
    axes: [{ id: 'x', ...axis, y: 560, side: 'below' }],
    marks: [{ key: 'm.b', axis: 'x', v: bv, tex: nTex(b, st), role: 'link', dot: strict(r) ? 'open' : 'closed' }],
    sets: o.domain
      ? [{ key: 's.b', axis: 'x', from: bv, dir: -1, to: val(o.domain.lo), role: 'link' }]
      : [{ key: 's.b', axis: 'x', from: bv, dir: (d || 1) as 1 | -1, role: 'link' }],
    tests,
  };
  if (o.domain) params.marks!.push({ key: 'm.lo', axis: 'x', v: val(o.domain.lo), tex: nTex(o.domain.lo, st), role: 'link', dot: o.domain.loClosed ? 'closed' : 'open' });
  const board = o.f ? [stepTex(o.f), solTex(v, r, b, st)] : [solTex(v, r, b, st)];
  return { kind: 'line', params, show: ['ax.x'], solve: ['m.b', ...(o.domain ? ['m.lo'] : []), 's.b', ...tests.map(t => t.key)], board };
}
/** a number put in for the variable: brackets when negative or after a coefficient */
const sv = (f: OneStep, x: N, st: Style = f.st ?? 'dec') => (x.n < 0 || f.op === 'mul' ? `(${nHtml(x, st)})` : nHtml(x, st));
const relOk = (x: N, r: Rel, b: N) => { const c = cmp(x, b); return r === '<' ? c < 0 : r === '<=' ? c <= 0 : r === '>' ? c > 0 : r === '>=' ? c >= 0 : c === 0; };
function checkLine(f: OneStep, t: number): string {
  const x = dec(t), st = f.st ?? 'dec', ok = holds(f, x);
  return `${f.v ?? 'x'} = ${nHtml(x, st)}: ${exprHtml({ ...f, v: sv(f, x, st) }).replace(/<i>|<\/i>/g, '')} = ${nHtml(lhs(f, x), st)}, and ${nHtml(lhs(f, x), st)} ${REL_HTML[f.rel]} ${nHtml(f.q, st)} is ${ok ? 'true' : 'false'}.`;
}
/** the worked solution of a one-step inequality, in panel lines */
function ineqSolution(f: OneStep, tin: number, tout: number): string[] {
  const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec';
  const lines = [`${stHtml(f)}: ${invWords(f)}.`];
  lines.push(s.flips
    ? `You ${f.op === 'mul' ? 'divided' : 'multiplied'} by a negative number, so the order reverses: ${REL_HTML[f.rel]} becomes ${REL_HTML[s.rel]}.`
    : f.op === 'add' || f.op === 'sub' ? 'Adding or subtracting the same number keeps the symbol, even when the numbers are negative.' : `${nHtml(f.p, st)} is positive, so the symbol stays.`);
  lines.push(`${sol(v, s.rel, s.b, st)}. Check one value on each side: ${checkLine(f, tin)} ${checkLine(f, tout)}`);
  return lines;
}
/** the reversed-symbol answer: which misconception does it show for this statement? */
function flipMc(f: OneStep): string | undefined {
  const s = solve(f);
  if (s.flips) return MC.noRev;
  if (f.op === 'add' || f.op === 'sub') return showsNegative(f) ? MC.anyNeg : MC.revAdd;
  if (showsNegative(f)) return MC.anyNeg;
  if ((f.op === 'mul' && val(f.p) < 1) || f.op === 'div') return MC.fracRev;
  return undefined;
}
function flipSay(f: OneStep): string {
  const s = solve(f);
  if (s.flips) return `You ${f.op === 'mul' ? 'divide' : 'multiply'} both sides by ${nHtml(f.p, f.st)}, a negative number: that turns the number line around, so the symbol must reverse.`;
  if (f.op === 'add' || f.op === 'sub') return showsNegative(f) ? 'A negative number in the problem does not flip the symbol. Only multiplying or dividing by a negative number does; here you add or subtract.' : 'Adding or subtracting the same number slides both sides the same way: the order stays, so the symbol stays.';
  if (showsNegative(f)) return `You ${f.op === 'mul' ? 'divide' : 'multiply'} by ${nHtml(f.p, f.st)}, which is positive. A negative number elsewhere does not flip the symbol.`;
  return `${f.op === 'mul' ? 'Dividing' : 'Multiplying'} by a positive number keeps the order, even when the numbers get smaller. The symbol stays.`;
}

// ---------- number makers ----------
const HALVES = [0.5, 1.5, 2.5, 3.5, 4.5, 0.25, 0.75, 1.25, 2.75];
function nonneg(R: () => number, kind: 'int' | 'dec' | 'frac', lo: number, hi: number): N {
  if (kind === 'int') return I(int(R, lo, hi));
  if (kind === 'dec') return dec(int(R, lo, Math.max(lo, hi - 1)) + pick(R, [0.5, 0.25, 0.75, 0.5]));
  const d = pick(R, [2, 3, 4, 3]);
  return Nq(int(R, Math.max(1, lo * d), hi * d), d);
}
const styleOf = (k: 'int' | 'dec' | 'frac'): Style => (k === 'frac' ? 'frac' : 'dec');
const kindOf = (R: () => number): 'int' | 'dec' | 'frac' => (R() < 0.6 ? 'int' : R() < 0.6 ? 'dec' : 'frac');
const RELS: Rel[] = ['<', '<=', '>', '>='];

// =====================================================================================================
// additive inequalities [solve-ineq-additive (nonnegative calculations), solve-ineq-signed-additive]
function additiveForm(R: () => number, sg?: string): OneStep {
  const v = pick(R, V), r = pick(R, RELS);
  for (let t = 0; t < 100; t++) {
    if (sg !== 'solve-ineq-signed-additive') {
      const k = kindOf(R), st = styleOf(k);
      const shape = pick(R, ['add', 'add', 'pFirst', 'sub', 'sub', 'addR', 'subR']);
      const p = nonneg(R, k, 1, 12);
      if (shape.startsWith('add') || shape === 'pFirst') {
        const q = add(p, nonneg(R, k, 0, 20));
        return { op: 'add', p, q, rel: r, v, st, pFirst: shape === 'pFirst', right: shape === 'addR' };
      }
      const q = nonneg(R, k, 0, 20);
      return { op: 'sub', p, q, rel: r, v, st, right: shape === 'subR' };
    }
    const shape = pick(R, ['addNegB', 'addNegB', 'subNegP', 'pFirstNeg', 'right', 'subNegQ']);
    const k = R() < 0.75 ? 'int' : 'dec', st: Style = 'dec';
    const mag = (lo: number, hi: number) => (k === 'int' ? I(int(R, lo, hi)) : dec(int(R, lo, hi - 1) + 0.5));
    if (shape === 'addNegB') { const p = mag(2, 12), q = Nq(int(R, -10, 10)); if (cmp(q, p) >= 0) continue; return { op: 'add', p, q, rel: r, v, st }; }
    if (shape === 'subNegP') { const p = neg(mag(2, 9)), q = Nq(int(R, -12, 6)); return { op: 'sub', p, q, rel: r, v, st }; }
    if (shape === 'pFirstNeg') { const p = neg(mag(2, 9)), q = Nq(int(R, -8, 10)); return { op: 'add', p, q, rel: r, v, st, pFirst: true }; }
    if (shape === 'subNegQ') { const p = mag(2, 9), q = neg(I(int(R, 1, 12))); return { op: 'sub', p, q, rel: r, v, st }; }
    const p = mag(2, 12), q = Nq(int(R, -6, 12)); if (cmp(q, p) >= 0 && R() < 0.7) continue;
    return { op: 'add', p, q, rel: r, v, st, right: true };
  }
  return { op: 'add', p: I(5), q: I(2), rel: '>', v: 'x' };
}
/** the wrong-operation boundary and its misconception */
function wrongOp(f: OneStep): { b: N; mc?: string; say: string } {
  const st = f.st ?? 'dec';
  if (f.op === 'add') return { b: add(f.q, f.p), mc: MC.visible, say: `That adds ${nHtml(f.p, st)}. To undo + ${nHtml(f.p, st)}, ${invWords(f)}.` };
  if (f.op === 'sub') return f.p.n < 0
    ? { b: sub(f.q, f.p), mc: MC.subNeg, say: `Careful: − (${nHtml(f.p, st)}) is + ${nHtml(abs(f.p), st)}. To undo it, subtract ${nHtml(abs(f.p), st)} from both sides.` }
    : { b: sub(f.q, f.p), say: `That subtracts again. To undo − ${nHtml(f.p, st)}, add ${nHtml(f.p, st)} to both sides.` };
  if (f.op === 'mul') return { b: mul(f.q, f.p), mc: MC.visible, say: `That multiplies by ${nHtml(f.p, st)}. To undo × ${nHtml(f.p, st)}, divide both sides by ${nHtml(f.p, st)}.` };
  return { b: div(f.q, f.p), mc: MC.visible, say: `That divides again. To undo ÷ ${nHtml(f.p, st)}, multiply both sides by ${nHtml(f.p, st)}.` };
}
function inBounds(f: OneStep): boolean {
  const s = solve(f), w = wrongOp(f).b;
  return Math.abs(val(s.b)) <= 40 && Math.abs(val(w)) <= 400 && (s.b.d <= 12) && !eq(w, s.b);
}
const solveAdd: Gen = (R, n, sg) => {
  let f = additiveForm(R, sg);
  for (let t = 0; t < 50 && !inBounds(f); t++) f = additiveForm(R, sg);
  return setItem(R, n, 'solveAdd', f, sg);
};
/** "solve and pick the solution set" item for any one-step inequality */
function setItem(R: () => number, n: number, family: FamilyId, f: OneStep, sg?: string): Item {
  const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec';
  const w = wrongOp(f);
  const pic = solutionPic(v, s.rel, s.b, st, { f });
  const tests = pic.params.tests ?? [];
  const tin = tests.find(t => t.key === 't.in')!.v, tout = tests.find(t => t.key === 't.out')?.v ?? val(s.b);
  const opts: Opt[] = [
    { t: sol(v, s.rel, s.b, st), ok: true, say: `Yes: ${invWords(f)}${s.flips ? ', and the symbol reverses' : ', and the symbol stays'}. ${sol(v, s.rel, s.b, st)}.` },
    { t: sol(v, flip(s.rel), s.b, st), mc: flipMc(f), say: flipSay(f) },
    { t: `<i>${v}</i> = ${nHtml(s.b, st)} only`, mc: MC.boundary, say: `${nHtml(s.b, st)} is only the boundary. An inequality has many solutions: every number on one side of ${nHtml(s.b, st)}${strict(s.rel) ? '' : ', and the boundary itself'}.` },
  ];
  if (s.flips) {
    // dividing by |p| (the sign dropped) and keeping the symbol
    const nb = f.op === 'mul' ? div(f.q, abs(f.p)) : mul(f.q, abs(f.p));
    opts.push({ t: sol(v, f.rel, nb, st), mc: MC.noSign, say: `The number next to ${v} is ${nHtml(f.p, st)}, with its sign. ${invWords(f)[0]!.toUpperCase() + invWords(f).slice(1)}; dividing or multiplying by a negative also reverses the symbol.` });
  } else opts.push({ t: sol(v, s.rel, w.b, st), mc: w.mc, say: w.say });
  const o = options(R, opts);
  const it: Item = {
    id: `${family}-${n}`, family, subgoal: sg,
    prompt: `Solve ${B(stHtml(f))}. Which numbers are solutions?`,
    board: stTex(f), input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown>,
    solution: ineqSolution(f, tin, tout),
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
}

// =====================================================================================================
// read the graph [solve-ineq-additive, solve-ineq-signed-additive]
const graph: Gen = (R, n, sg) => {
  let f = additiveForm(R, sg);
  for (let t = 0; t < 50 && !inBounds(f); t++) f = additiveForm(R, sg);
  const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec';
  const pic = solutionPic(v, s.rel, s.b, st, { f });
  const tin = pic.params.tests!.find(t => t.key === 't.in')!.v, tout = pic.params.tests!.find(t => t.key === 't.out')?.v ?? val(s.b);
  pic.show = ['ax.x', 'm.b', 's.b']; pic.solve = pic.params.tests!.map(t => t.key);
  const dotWord = strict(s.rel) ? 'an open dot: the boundary is left out' : 'a filled dot: the boundary is included';
  const sideWord = dirOf(s.rel) > 0 ? 'to the right (bigger numbers)' : 'to the left (smaller numbers)';
  const toggle = (r: Rel): Rel => ({ '<': '<=', '<=': '<', '>': '>=', '>=': '>', '=': '=' } as Record<Rel, Rel>)[r];
  const o = options(R, [
    { t: stHtml(f), ok: true, say: `Yes: ${stHtml(f)} solves to ${sol(v, s.rel, s.b, st)}: ${dotWord}, shaded ${sideWord}.` },
    { t: stHtml({ ...f, rel: flip(f.rel) }), mc: flipMc(f), say: `That one solves to ${sol(v, flip(s.rel), s.b, st)}: the shading would go the other way. Solving it keeps the symbol here.` },
    { t: stHtml({ ...f, rel: toggle(f.rel) }), say: `Look at the dot: ${dotWord}. The symbol must ${strict(s.rel) ? 'leave the boundary out (&lt; or &gt;)' : 'include the boundary (≤ or ≥)'}.` },
    { t: stHtml({ ...f, rel: '=' }), mc: MC.boundary, say: 'An equation has just the one boundary point. The graph shades a whole ray of numbers, so it shows an inequality.' },
  ]);
  const it: Item = {
    id: `graph-${n}`, family: 'graph', subgoal: sg,
    prompt: `The graph shows the solutions of one of these inequalities. Which one?`,
    board: `${v} \\;?\\; ${nTex(s.b, st)}`,
    input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown>,
    solution: [`The dot is at ${nHtml(s.b, st)}: ${dotWord}. The shading goes ${sideWord}: ${sol(v, s.rel, s.b, st)}.`, ...ineqSolution(f, tin, tout).slice(0, 1), `So the graph shows ${stHtml(f)}.`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

// =====================================================================================================
// test a value [solve-ineq-additive, solve-ineq-signed-additive]: which value is (not) a solution?
const testPoint: Gen = (R, n, sg) => {
  let f = additiveForm(R, sg);
  for (let t = 0; t < 50 && !inBounds(f); t++) f = additiveForm(R, sg);
  if (!isInt(solve(f).b)) { const b0 = solve(f).b; f = { ...f, q: add(f.q, sub(I(Math.ceil(val(b0))), b0)) }; }
  const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec', bv = val(s.b), d = dirOf(s.rel);
  const m1 = R() < 0.5 ? 1 : 2, m2 = R() < 0.5 ? 1 : 2;
  let axis = autoAxis([bv], { zero: true }), inV = bv, outV = bv;
  for (let i = 0; i < 5; i++) {
    const L = Math.max(1, axis.tick * axis.every);
    inV = bv + d * L * m1; outV = bv - d * L * m2;
    const next = autoAxis([inV, bv, outV], { zero: true });
    const same = next.tick * next.every === axis.tick * axis.every;
    axis = next;
    if (same) break;
  }
  const vals = [inV, bv, outV];
  const strictB = strict(s.rel);
  const want = strictB ? 'true' : 'false';
  const tests: TestSpec[] = vals.map((x, i) => ({ key: `t.${i}`, axis: 'x', v: x, tex: fmt(x), ok: holds(f, dec(x)) }));
  const pic: LinePicture = {
    kind: 'line',
    params: { axes: [{ id: 'x', ...axis, y: 560, side: 'below' }], marks: [{ key: 'm.b', axis: 'x', v: bv, tex: nTex(s.b, st), role: 'link', dot: strictB ? 'open' : 'closed' }], sets: [{ key: 's.b', axis: 'x', from: bv, dir: d as 1 | -1, role: 'link' }], tests },
    show: ['ax.x'], half: tests.map(t => t.key), solve: ['m.b', 's.b', ...tests.map(t => t.key)], board: [stepTex(f), solTex(v, s.rel, s.b, st)],
  };
  const ev = (x: number) => `${nHtml(lhs(f, dec(x)), st)} ${REL_HTML[f.rel]} ${nHtml(f.q, st)} is ${holds(f, dec(x)) ? 'true' : 'false'}`;
  const o = options(R, strictB ? [
    { t: `<i>${v}</i> = ${fmt(inV).replace('-', '−')}`, ok: true, say: `Yes: put it in: ${ev(inV)}.` },
    { t: `<i>${v}</i> = ${fmt(bv).replace('-', '−')}`, mc: MC.boundary, say: `${fmt(bv).replace('-', '−')} is the boundary: ${ev(bv)}. With ${REL_HTML[f.rel]} the boundary itself is not a solution.` },
    { t: `<i>${v}</i> = ${fmt(outV).replace('-', '−')}`, mc: flipMc(f), say: `Put it in: ${ev(outV)}. The solutions are on the other side of ${fmt(bv).replace('-', '−')}.` },
  ] : [
    { t: `<i>${v}</i> = ${fmt(outV).replace('-', '−')}`, ok: true, say: `Yes: ${ev(outV)}, so it is not a solution.` },
    { t: `<i>${v}</i> = ${fmt(bv).replace('-', '−')}`, say: `Put it in: ${ev(bv)}. With ${REL_HTML[f.rel]} the boundary IS a solution.` },
    { t: `<i>${v}</i> = ${fmt(inV).replace('-', '−')}`, mc: flipMc(f), say: `Put it in: ${ev(inV)}, so it is a solution. The solutions are on this side of ${fmt(bv).replace('-', '−')}.` },
  ]);
  const it: Item = {
    id: `tp-${n}`, family: 'testPoint', subgoal: sg,
    prompt: strictB ? `Which value of <i>${v}</i> makes ${B(stHtml(f))} <b>true</b>? Put each one in.` : `Which value of <i>${v}</i> does <b>not</b> make ${B(stHtml(f))} true? Put each one in.`,
    board: stTex(f), input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown>,
    solution: [`Put each value in for <i>${v}</i>: ${vals.map(x => `${fmt(x).replace('-', '−')} gives ${ev(x)}`).join('; ')}.`, `The solutions are ${sol(v, s.rel, s.b, st)}: so the answer is <i>${v}</i> = ${fmt(strictB ? inV : outV).replace('-', '−')} (the ${want === 'true' ? 'true' : 'false'} one).`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

// =====================================================================================================
// multiplicative inequalities [solve-ineq-positive-scale, ineq-negative-scale-reverse]
function scaleForm(R: () => number, sg?: string): OneStep {
  const v = pick(R, V), r = pick(R, RELS);
  for (let t = 0; t < 100; t++) {
    if (sg !== 'ineq-negative-scale-reverse') {
      const shape = pick(R, ['int', 'int', 'div', 'dec', 'frac']);
      if (shape === 'int') { const p = I(int(R, 2, 9)), b = R() < 0.75 ? I(int(R, 1, 12)) : dec(int(R, 1, 9) + 0.5); const q = mul(p, b); if (!isInt(q) && !terminates(q)) continue; return { op: 'mul', p, q, rel: r, v, right: R() < 0.2 }; }
      if (shape === 'div') { const p = I(int(R, 2, 8)), q = R() < 0.7 ? I(int(R, 1, 9)) : dec(int(R, 1, 6) + 0.5); return { op: 'div', p, q, rel: r, v }; }
      if (shape === 'dec') { const p = dec(pick(R, [0.2, 0.4, 0.5, 0.25, 0.75, 1.5, 2.5, 0.8])), b = I(int(R, 2, 20)); const q = mul(p, b); if (!terminates(q)) continue; return { op: 'mul', p, q, rel: r, v }; }
      const p = pick(R, [Nq(1, 2), Nq(1, 3), Nq(3, 4), Nq(2, 3), Nq(2, 5), Nq(3, 2)]), b = I(int(R, 1, 8) * p.d);
      return { op: 'mul', p, q: mul(p, b), rel: r, v, st: 'frac' };
    }
    const shape = pick(R, ['int', 'int', 'div', 'dec', 'frac', 'negq']);
    if (shape === 'int' || shape === 'negq') {
      const p = I(-int(R, 2, 9)), b = I(int(R, -12, 12)); if (b.n === 0) continue;
      return { op: 'mul', p, q: mul(p, b), rel: r, v, right: R() < 0.15 };
    }
    if (shape === 'div') { const p = I(-int(R, 2, 6)), q = I(int(R, -9, 9)); if (q.n === 0) continue; return { op: 'div', p, q, rel: r, v }; }
    if (shape === 'dec') { const p = dec(-pick(R, [0.5, 0.25, 0.2, 1.5, 2.5, 0.4])), b = I(int(R, -16, 16)); if (b.n === 0) continue; const q = mul(p, b); if (!terminates(q)) continue; return { op: 'mul', p, q, rel: r, v }; }
    const p = neg(pick(R, [Nq(1, 2), Nq(2, 3), Nq(3, 4), Nq(1, 3), Nq(3, 2)])), b = I(int(R, -6, 6) * p.d); if (b.n === 0) continue;
    return { op: 'mul', p, q: mul(p, b), rel: r, v, st: 'frac' };
  }
  return { op: 'mul', p: I(-3), q: I(12), rel: '<=', v: 'x' };
}
const solveScale: Gen = (R, n, sg) => {
  let f = scaleForm(R, sg);
  for (let t = 0; t < 50 && !inBounds(f); t++) f = scaleForm(R, sg);
  return setItem(R, n, 'solveScale', f, sg);
};
// the boundary as a number [solve-ineq-positive-scale, ineq-negative-scale-reverse]
const boundaryNum: Gen = (R, n, sg) => {
  let f = scaleForm(R, sg);
  for (let t = 0; t < 50 && (!inBounds(f) || !terminates(solve(f).b) || (f.st === 'frac' && !isInt(solve(f).b))); t++) f = scaleForm(R, sg);
  const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec';
  const w = wrongOp(f);
  const nb = f.op === 'mul' ? div(f.q, abs(f.p)) : mul(f.q, abs(f.p));
  const pic = solutionPic(v, s.rel, s.b, st, { f });
  const tests = pic.params.tests!;
  const it: Item = {
    id: `bn-${n}`, family: 'boundaryNum', subgoal: sg,
    prompt: `Solve ${B(stHtml(f))}. The answer is <i>${v}</i> ${REL_HTML[s.rel]} ? &nbsp;Type the boundary number.`,
    board: `${stTex(f)} \\quad\\Rightarrow\\quad ${v} ${REL_TEX[s.rel]} \\,?`,
    input: 'num', unit: '', picture: pic as unknown as Record<string, unknown>,
    solution: ineqSolution(f, tests.find(t => t.key === 't.in')!.v, tests.find(t => t.key === 't.out')?.v ?? val(s.b)),
    answer: numR(s.b),
    check: r => numCheck(r, s.b, `Yes: ${invWords(f)}: ${sol(v, s.rel, s.b, st)}.`, [
      ...(s.flips && !eq(nb, s.b) ? [{ v: nb, mc: MC.noSign, say: `Keep the sign: the number next to ${v} is ${nHtml(f.p, st)}, so ${invWords(f)}. That gives ${nHtml(s.b, st)}.` }] : []),
      { v: w.b, mc: w.mc, say: w.say },
    ], `Not quite: ${invWords(f)}. ${nHtml(f.q, st)} ${f.op === 'mul' ? '÷' : '×'} ${nHtml(f.p, st)} = ${nHtml(s.b, st)}.`),
  };
  if (s.flips && !eq(nb, s.b)) probe(it, numR(nb), MC.noSign);
  if (w.mc && terminates(w.b) && !eq(w.b, s.b) && !(s.flips && eq(w.b, nb))) probe(it, numR(w.b), w.mc);
  FORMS.set(it, f);
  return it;
};

// =====================================================================================================
// contexts: whole counts [model-solve-ineq-context]
const COUNT_SKINS = [
  { max: true, unit: 'tasks', ask: (p: number, q: number) => `Each task takes ${A(`${p} hours`)}. Lena has ${B(`at most ${q} hours`)}. What is the greatest number of whole tasks she can finish?`, v: 't', what: 'hours' },
  { max: true, unit: 'boxes', ask: (p: number, q: number) => `A shelf holds ${B(`at most ${q} pounds`)}. Each box weighs ${A(`${p} pounds`)}. What is the greatest number of boxes it can hold?`, v: 'b', what: 'pounds' },
  { max: true, unit: 'songs', ask: (p: number, q: number) => `Each song uses ${A(`${p} MB`)}. The phone has ${B(`at most ${q} MB`)} free. How many whole songs fit at most?`, v: 's', what: 'MB' },
  { max: false, unit: 'buses', ask: (p: number, q: number) => `Each bus seats ${A(`${p} students`)}. ${B(`At least ${q} students`)} go on the trip. What is the fewest buses that can take them all?`, v: 'b', what: 'seats' },
  { max: false, unit: 'boxes', ask: (p: number, q: number) => `Each box holds ${A(`${p} books`)}. ${B(`At least ${q} books`)} must be packed. What is the fewest boxes needed?`, v: 'n', what: 'books' },
  { max: false, unit: 'laps', ask: (p: number, q: number) => `One lap of the track is ${A(`${p} hundred meters`)}. Ria wants to run ${B(`at least ${q} hundred meters`)}. What is the fewest whole laps?`, v: 'l', what: 'hundred meters' },
];
const contextCount: Gen = (R, n, sg) => {
  const sk = pick(R, COUNT_SKINS);
  let p = 3, q = 20;
  for (let t = 0; t < 200; t++) {
    p = int(R, 3, 9); q = int(R, 2 * p + 1, 10 * p);
    const fr0 = (q % p) / p;
    if (q % p === 0) continue;
    if (sk.max ? fr0 >= 0.5 : fr0 < 0.5) break;
  }
  const b = Nq(q, p), v = sk.v;
  const ans = sk.max ? Math.floor(q / p) : Math.ceil(q / p), nearest = Math.round(q / p);
  const f: OneStep = { op: 'mul', p: I(p), q: I(q), rel: sk.max ? '<=' : '>=', v, st: 'frac' };
  const bWhole = Math.floor(q / p), bFrac = `${bWhole}\\tfrac{${q % p}}{${p}}`;
  const pic = solutionPic(v, f.rel, b, 'frac', { f });
  pic.params.marks![0]!.tex = bFrac;
  pic.params.axes[0] = { ...pic.params.axes[0]!, ...autoAxis([ans - 2, ans + 2, q / p], { zero: false, minTicks: 7 }) };
  pic.params.tests = [{ key: 't.in', axis: 'x', v: ans, tex: String(ans), ok: true }, { key: 't.out', axis: 'x', v: sk.max ? ans + 1 : ans - 1, tex: String(sk.max ? ans + 1 : ans - 1), ok: false }];
  pic.solve = ['m.b', 's.b', 't.in', 't.out'];
  pic.board = [`${v} ${REL_TEX[f.rel]} ${bFrac}`, `${v} = ${ans}`];
  const decB = Math.round((q / p) * 100) / 100;
  const it: Item = {
    id: `cc-${n}`, family: 'contextCount', subgoal: sg,
    prompt: `${sk.ask(p, q)} <span class="dim">Write ${B(`${p}${v} ${REL_HTML[f.rel]} ${q}`)} first.</span>`,
    board: stTex(f), input: 'num', unit: sk.unit, picture: pic as unknown as Record<string, unknown>,
    solution: [`${p}<i>${v}</i> ${REL_HTML[f.rel]} ${q}: divide both sides by ${p}: <i>${v}</i> ${REL_HTML[f.rel]} ${bWhole}&#8202;${fr0(q % p, p)}.`,
      sk.max ? `Only whole ${sk.unit} count, and you may not go over: ${bWhole}&#8202;${fr0(q % p, p)} is between ${ans} and ${ans + 1}, so round DOWN to ${ans}.` : `Only whole ${sk.unit} count, and you need enough: ${bWhole}&#8202;${fr0(q % p, p)} is between ${ans - 1} and ${ans}, so round UP to ${ans}.`,
      `Check: ${p} × ${ans} = ${p * ans} ${REL_HTML[f.rel]} ${q}, but ${p} × ${sk.max ? ans + 1 : ans - 1} = ${p * (sk.max ? ans + 1 : ans - 1)} is not.`],
    answer: { kind: 'num', v: ans },
    check: r => numCheck(r, I(ans), `Yes: <i>${v}</i> ${REL_HTML[f.rel]} ${bWhole}&#8202;${fr0(q % p, p)}, and the count must be whole: ${ans}.`, [
      { v: I(nearest), mc: MC.rounds, say: sk.max ? `${nearest} is the nearest whole number, but ${p} × ${nearest} = ${p * nearest} is more than ${q}. With "at most", round down.` : `${nearest} is the nearest whole number, but ${p} × ${nearest} = ${p * nearest} is less than ${q}. With "at least", round up.` },
      { v: dec(decB), mc: MC.domain, say: `That solves ${p}<i>${v}</i> ${REL_HTML[f.rel]} ${q}, but ${sk.unit} come in whole numbers. Which whole number works?` },
    ], `Solve ${p}<i>${v}</i> ${REL_HTML[f.rel]} ${q}, then think: whole ${sk.unit} only.`),
  };
  probe(it, { kind: 'num', v: nearest }, MC.rounds);
  probe(it, { kind: 'num', v: decB }, MC.domain);
  FORMS.set(it, f);
  return it;
};
const fr0 = (a: number, b: number) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;

// what the situation allows (continuous, from 0) [model-solve-ineq-context]
const SET_SKINS = [
  { lead: (p: string, q: string) => `A truck can carry ${B(`at most ${q} tons`)}. It already holds ${A(`${p} tons`)}. Which describes every load <i>x</i> (tons) it can still take?`, unit: 'tons', rel: '<=' as Rel },
  { lead: (p: string, q: string) => `An elevator holds ${B(`at most ${q} hundred pounds`)}. A cart of ${A(`${p} hundred pounds`)} is inside. Which describes every extra load <i>x</i> (hundred pounds) allowed?`, unit: 'hundred pounds', rel: '<=' as Rel },
  { lead: (p: string, q: string) => `Screen time is ${B(`at most ${q} minutes`)} a day. Jay has used ${A(`${p} minutes`)}. Which describes every number of minutes <i>x</i> he has left?`, unit: 'minutes', rel: '<=' as Rel },
  { lead: (p: string, q: string) => `A bag may weigh ${B(`at most ${q} pounds`)}. The empty bag weighs ${A(`${p} pounds`)}. Which describes every weight <i>x</i> (pounds) you can pack?`, unit: 'pounds', rel: '<=' as Rel },
  { lead: (p: string, q: string) => `A team needs ${B(`at least ${q} points`)} to make the playoffs. It has ${A(`${p} points`)}. Which describes every number of points <i>x</i> it still needs?`, unit: 'points', rel: '>=' as Rel },
  { lead: (p: string, q: string) => `A plant must grow to ${B(`more than ${q} inches`)} before it is moved outside. It is ${A(`${p} inches`)} tall now. Which describes every growth <i>x</i> (inches) that is enough?`, unit: 'inches', rel: '>' as Rel },
];
const contextSet: Gen = (R, n, sg) => {
  const sk = pick(R, SET_SKINS);
  const k = R() < 0.7 ? 'int' : 'dec';
  const p = k === 'int' ? I(int(R, 3, 20)) : dec(int(R, 2, 14) + 0.5);
  const b = k === 'int' ? I(int(R, 4, 30)) : dec(int(R, 3, 20) + 0.5);
  const v = 'x';
  const f: OneStep = { op: 'add', p, q: add(p, b), rel: sk.rel, v };
  const s = solve(f);
  const ps = nHtml(p), qs = nHtml(f.q), bs = nHtml(s.b);
  const isMax = dirOf(s.rel) < 0;
  const domain = isMax ? { lo: I(0), loClosed: true } : undefined;
  const pic = solutionPic(v, s.rel, s.b, 'dec', { f, domain });
  const right = isMax ? `0 ≤ <i>x</i> ${REL_HTML[s.rel]} ${bs}` : sol(v, s.rel, s.b);
  const opts: Opt[] = [
    { t: right, ok: true, say: isMax ? `Yes: <i>x</i> ${REL_HTML[s.rel]} ${bs} from the inequality, and the amount cannot be negative, so ${right}.` : `Yes: subtract ${ps} from both sides: ${sol(v, s.rel, s.b)}.` },
    { t: `<i>x</i> = ${bs}`, mc: MC.eqBound, say: `"${sk.rel === '<=' ? 'At most' : sk.rel === '>=' ? 'At least' : 'More than'}" is a bound, not an exact amount: many amounts work, not only ${bs}.` },
    { t: isMax ? `<i>x</i> ${REL_HTML[flip(s.rel)]} ${bs}` : sol(v, flip(s.rel), s.b), mc: MC.revAdd, say: `Subtracting ${ps} from both sides keeps the symbol: ${sol(v, s.rel, s.b)}.` },
  ];
  if (isMax) opts.push({ t: sol(v, s.rel, s.b), mc: MC.domain, say: `That includes negative numbers, like <i>x</i> = −5. An amount of ${sk.unit} cannot be negative here: start at 0.` });
  else opts.push({ t: sol(v, s.rel, add(f.q, p)), mc: MC.visible, say: `That adds ${ps}. Take the ${ps} already there away from ${qs}.` });
  const o = options(R, opts);
  const it: Item = {
    id: `cs-${n}`, family: 'contextSet', subgoal: sg,
    prompt: sk.lead(ps, qs) + ` <span class="dim">(${B(stHtml(f))})</span>`,
    board: stTex(f), input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown>,
    solution: [`${stHtml(f)}: subtract ${ps} from both sides: ${sol(v, s.rel, s.b)}.`, isMax ? `The amount cannot be negative, so it starts at 0: ${right} ${sk.unit}.` : `Every amount ${REL_HTML[s.rel]} ${bs} ${sk.unit} works (all of them are positive).`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

// =====================================================================================================
// geometry [model-solve-ineq-geometry]
const geometry: Gen = (R, n, sg) => {
  const kind = pick(R, ['square', 'rug', 'prism', 'angle', 'square', 'rug']);
  const exact = R() < 0.2;
  let f: OneStep, lead: string, v: string, unit: string, areaWrong: N | null = null, positive = true;
  if (kind === 'square') {
    const F = pick(R, [36, 64, 100, 144, 196, 50, 30, 42, 60]); v = 's'; unit = 'ft';
    f = { op: 'mul', p: I(4), q: I(F), rel: exact ? '=' : '<=', v };
    lead = exact ? `A square pen uses ${B(`exactly ${F} ft`)} of fencing. How long is a side <i>s</i>?` : `A square pen can use ${B(`at most ${F} ft`)} of fencing. Which describes every side length <i>s</i> (ft) that works?`;
    if (Number.isInteger(Math.sqrt(F))) areaWrong = I(Math.sqrt(F));
  } else if (kind === 'rug') {
    const L = pick(R, [4, 5, 6, 8, 10]), w = dec(int(R, 2, 9) + pick(R, [0, 0.5, 0.5, 0.25])), Aq = mul(I(L), w); v = 'w'; unit = 'ft';
    f = { op: 'mul', p: I(L), q: Aq, rel: exact ? '=' : '>=', v };
    lead = exact ? `A rug is ${A(`${L} ft`)} long and covers ${B(`exactly ${nHtml(Aq)} ft²`)}. How wide is it?` : `A rug ${A(`${L} ft`)} long must cover ${B(`at least ${nHtml(Aq)} ft²`)}. Which describes every width <i>w</i> (ft) that works?`;
    const pw = div(sub(Aq, I(2 * L)), I(2)); if (pw.n > 0) areaWrong = pw;
  } else if (kind === 'prism') {
    const Bv = pick(R, [6, 8, 10, 12, 15, 20]), h = dec(int(R, 2, 9) + pick(R, [0, 0.5])), Vv = mul(I(Bv), h); v = 'h'; unit = 'in';
    f = { op: 'mul', p: I(Bv), q: Vv, rel: exact ? '=' : '<', v };
    lead = exact ? `A box has a base of ${A(`${Bv} in²`)} and a volume of ${B(`exactly ${nHtml(Vv)} in³`)}. How tall is it?` : `A box with a base of ${A(`${Bv} in²`)} must hold ${B(`less than ${nHtml(Vv)} in³`)}. Which describes every height <i>h</i> (in) that works?`;
  } else {
    const a = int(R, 12, 75); v = 'x'; unit = '°';
    f = { op: 'add', p: I(a), q: I(90), rel: exact ? '=' : '<', v };
    lead = exact ? `An angle <i>x</i>° and a ${A(`${a}°`)} angle together make ${B('exactly a right angle')}. Find <i>x</i>.` : `An angle <i>x</i>° sits next to a ${A(`${a}°`)} angle, and together they stay ${B('acute (less than 90°)')}. Which describes every <i>x</i> that works?`;
  }
  const s = solve(f), bs = nHtml(s.b);
  const pr = (t: string) => `${t}`;
  const right = exact ? `<i>${v}</i> = ${bs}` : dirOf(s.rel) < 0 ? `0 &lt; <i>${v}</i> ${REL_HTML[s.rel]} ${bs}` : sol(v, s.rel, s.b);
  const opts: Opt[] = [
    { t: right, ok: true, say: exact ? `Yes: ${stHtml(f)}, so <i>${v}</i> = ${bs} ${unit}.` : `Yes: ${stHtml(f)} gives ${sol(v, s.rel, s.b)}${dirOf(s.rel) < 0 ? `, and ${kind === 'angle' ? 'an angle' : 'a length'} must be more than 0` : ''}.` },
    exact ? { t: `0 &lt; <i>${v}</i> ≤ ${bs}`, say: '"Exactly" fixes one value: this is an equation, not a range.' }
      : { t: `<i>${v}</i> = ${bs}`, mc: MC.eqBound, say: `"${f.rel === '>=' ? 'At least' : f.rel === '<' ? 'Less than' : 'At most'}" is a bound: many values work, not just ${bs}.` },
  ];
  if (!exact && dirOf(s.rel) < 0) opts.push({ t: sol(v, s.rel, s.b), mc: MC.domain, say: `That allows 0 and negative ${kind === 'angle' ? 'angles' : 'lengths'}. A real ${kind === 'angle' ? 'angle' : 'side'} is more than 0.` });
  if (areaWrong && !eq(areaWrong, s.b)) {
    const t = exact ? `<i>${v}</i> = ${nHtml(areaWrong)}` : dirOf(s.rel) < 0 ? `0 &lt; <i>${v}</i> ${REL_HTML[s.rel]} ${nHtml(areaWrong)}` : sol(v, s.rel, areaWrong);
    opts.push({ t, mc: MC.areaPer, say: kind === 'square' ? `That treats ${nHtml(f.q)} as the AREA (side × side). Fencing goes around: the perimeter is 4 × side.` : `That uses the perimeter (2 lengths + 2 widths). Covering is AREA: length × width.` });
  }
  if (opts.length < 4) {
    const w = wrongOp(f);
    const t = exact ? `<i>${v}</i> = ${nHtml(w.b)}` : dirOf(s.rel) < 0 ? `0 &lt; <i>${v}</i> ${REL_HTML[s.rel]} ${nHtml(w.b)}` : sol(v, s.rel, w.b);
    opts.push({ t, mc: w.mc, say: w.say });
  }
  if (opts.length < 4 && !exact) opts.push({ t: dirOf(s.rel) < 0 ? sol(v, flip(s.rel), s.b) : `0 &lt; <i>${v}</i> ${REL_HTML[flip(s.rel)]} ${bs}`, mc: f.op === 'add' ? MC.revAdd : undefined, say: 'The symbol stays: you only added, subtracted, or divided by a positive number.' });
  const o = options(R, opts);
  const domain = !exact && dirOf(s.rel) < 0 ? { lo: I(0), loClosed: false } : undefined;
  const pic = exact ? undefined : solutionPic(v, s.rel, s.b, 'dec', { f, domain });
  const relWord = kind === 'square' ? `The fencing is the perimeter: 4 × <i>s</i>.` : kind === 'rug' ? 'Covering is area: length × width.' : kind === 'prism' ? 'Volume = base area × height.' : 'The two angles add up.';
  const it: Item = {
    id: `geo-${n}`, family: 'geometry', subgoal: sg,
    prompt: pr(lead) + ` <span class="dim">(${B(stHtml(f))})</span>`,
    board: stTex(f), input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown> | undefined,
    solution: [relWord + ` ${stHtml(f)}.`, `${invWords(f)[0]!.toUpperCase() + invWords(f).slice(1)}: ${exact ? `<i>${v}</i> = ${bs}` : sol(v, s.rel, s.b)}.`, exact ? `Exactly ${bs} ${unit}.` : dirOf(s.rel) < 0 ? `${kind === 'angle' ? 'An angle' : 'A length'} is more than 0, so ${right}.` : `Every ${v} ${REL_HTML[s.rel]} ${bs} ${unit} works.`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

// =====================================================================================================
// signed additive equations [solve-additive-integer]
const addEq: Gen = (R, n, sg) => {
  const v = pick(R, V);
  let f: OneStep = { op: 'add', p: I(9), q: I(4), rel: '=', v };
  for (let t = 0; t < 100; t++) {
    const shape = pick(R, ['add', 'add', 'pFirst', 'subNeg', 'sub', 'right']);
    const b = I(int(R, -15, 12)), p = I(int(R, 2, 12) * (shape === 'pFirst' || shape === 'subNeg' ? -1 : 1));
    if (b.n === 0) continue;
    const q = shape === 'sub' || shape === 'subNeg' ? sub(b, p) : add(b, p);
    if (shape === 'add' || shape === 'right') { if (b.n > 0 && q.n > 0 && R() < 0.8) continue; }
    f = { op: shape === 'sub' || shape === 'subNeg' ? 'sub' : 'add', p, q, rel: '=', v, pFirst: shape === 'pFirst', right: shape === 'right' };
    const ax = autoAxis([val(q), val(b)], { zero: true });
    const ok = fits({ axes: [{ id: 'x', ...ax, y: 560, side: 'below' }], marks: [{ key: 'm.q', axis: 'x', v: val(q), tex: nTex(q), role: 'first', dot: 'closed' }, { key: 'm.b', axis: 'x', v: val(b), tex: nTex(b), role: 'link', dot: 'closed' }], jumps: [{ key: 'j', axis: 'x', from: val(q), to: val(b), tex: '+' + nTex(abs(p)), role: 'pick' }] });
    if (ok && !eq(wrongOp(f).b, b) && !eq(wrongOp(f).b, neg(b)) && q.n !== 0) break;
  }
  const s = solve(f), b = s.b, w = wrongOp(f);
  const asChoice = R() < 0.3;
  const tempSkin = !asChoice && f.op === 'add' && !f.pFirst && !f.right && R() < 0.35;
  const prompt = tempSkin
    ? `The temperature rose ${A(`${nHtml(f.p)} °F`)} and is now ${B(`${nHtml(f.q)} °F`)}. What was it before? <span class="dim">(${stHtml(f)})</span>`
    : asChoice ? `Which value of <i>${v}</i> makes ${B(stHtml(f))} true? Substitute to check.` : `Solve ${B(stHtml(f))}. &nbsp;<i>${v}</i> = ?`;
  // the number line: a jump from q back by p lands on the answer
  const back = f.op === 'add' ? neg(f.p) : f.p;
  const axis = autoAxis([val(f.q), val(b)], { zero: true });
  const pic: LinePicture = {
    kind: 'line',
    params: { axes: [{ id: 'x', ...axis, y: 560, side: 'below' }], marks: [{ key: 'm.q', axis: 'x', v: val(f.q), tex: nTex(f.q), role: 'first', dot: 'closed' }, { key: 'm.b', axis: 'x', v: val(b), tex: nTex(b), role: 'link', dot: 'closed' }], jumps: [{ key: 'j', axis: 'x', from: val(f.q), to: val(b), tex: (back.n > 0 ? '+' : '-') + nTex(abs(back)), role: 'pick' }] },
    show: ['ax.x', 'm.q'], solve: ['j', 'm.b'], board: [`${v} = ${nTex(f.q)} ${back.n > 0 ? '+' : '-'} ${nTex(abs(back))} = ${nTex(b)}`],
  };
  const sayRight = `Yes: ${invWords(f)}: <i>${v}</i> = ${nHtml(b)}. Check: ${exprHtml({ ...f, v: sv(f, b) }).replace(/<\/?i>/g, '')} = ${nHtml(f.q)}.`;
  const wrongs: NumWrong[] = [{ v: w.b, mc: w.mc, say: w.say }];
  if (b.n < 0) wrongs.push({ v: neg(b), mc: MC.negReject, say: `Check it: ${exprHtml({ ...f, v: `${nHtml(neg(b))}` }).replace(/<\/?i>/g, '')} is ${nHtml(lhs(f, neg(b)))}, not ${nHtml(f.q)}. The answer can be negative: <i>${v}</i> = ${nHtml(b)}.` });
  else wrongs.push({ v: neg(b), say: `Check it: ${exprHtml({ ...f, v: sv(f, neg(b)) }).replace(/<\/?i>/g, '')} is ${nHtml(lhs(f, neg(b)))}, not ${nHtml(f.q)}.` });
  const solution = [`${stHtml(f)}: ${invWords(f)}.`, `<i>${v}</i> = ${nHtml(b)}. On the number line: start at ${nHtml(f.q)} and go ${back.n > 0 ? 'up' : 'down'} ${nHtml(abs(back))}.`, `Check: ${exprHtml({ ...f, v: sv(f, b) }).replace(/<\/?i>/g, '')} = ${nHtml(f.q)}.`];
  let it: Item;
  if (asChoice) {
    const o = options(R, [
      { t: `<i>${v}</i> = ${nHtml(b)}`, ok: true, say: sayRight },
      ...wrongs.map(x => ({ t: `<i>${v}</i> = ${nHtml(x.v)}`, mc: x.mc, say: x.say })),
      { t: `<i>${v}</i> = ${nHtml(neg(w.b))}`, say: `Check it: it does not give ${nHtml(f.q)}. ${invWords(f)[0]!.toUpperCase() + invWords(f).slice(1)}.` },
    ]);
    it = { id: `ae-${n}`, family: 'addEq', subgoal: sg, prompt, board: stTex(f), input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown>, solution, answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  } else {
    it = { id: `ae-${n}`, family: 'addEq', subgoal: sg, prompt, board: stTex(f), input: 'num', unit: tempSkin ? '°F' : '', picture: pic as unknown as Record<string, unknown>, solution, answer: numR(b),
      check: r => numCheck(r, b, sayRight, wrongs, `Not quite: ${invWords(f)}.`) };
    for (const x of wrongs) if (x.mc && !eq(x.v, b)) probe(it, numR(x.v), x.mc);
  }
  FORMS.set(it, f);
  return it;
};

// signed multiplicative equations [solve-multiplicative-integer]
const mulEq: Gen = (R, n, sg) => {
  const v = pick(R, V);
  if (R() < 0.14) {
    const p = I(-int(R, 2, 9)), f: OneStep = { op: 'mul', p, q: I(0), rel: '=', v, right: R() < 0.3 };
    const o = options(R, [
      { t: `<i>${v}</i> = 0`, ok: true, say: `Yes: 0 ÷ ${nHtml(p)} = 0. Check: ${nHtml(p)} × 0 = 0.` },
      { t: 'No solution: you cannot divide 0', mc: MC.zeroDiv, say: `0 divided by a number is 0. Only dividing BY 0 is impossible. ${nHtml(p)} × 0 = 0, so <i>${v}</i> = 0.` },
      { t: `<i>${v}</i> = ${nHtml(neg(p))}`, say: `Check: ${nHtml(p)} × ${nHtml(neg(p))} = ${nHtml(mul(p, neg(p)))}, not 0.` },
      { t: `<i>${v}</i> = ${nHtml(p)}`, say: `Check: ${nHtml(p)} × (${nHtml(p)}) = ${nHtml(mul(p, p))}, not 0.` },
    ]);
    const it: Item = { id: `me0-${n}`, family: 'mulEq', subgoal: sg, prompt: `Solve ${B(stHtml(f))}.`, board: stTex(f), input: 'choice', choices: o.choices,
      solution: [`Divide both sides by ${nHtml(p)}: <i>${v}</i> = 0 ÷ ${nHtml(p)} = 0.`, `Check: ${nHtml(p)} × 0 = 0.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
    FORMS.set(it, f);
    return it;
  }
  let f: OneStep = { op: 'mul', p: I(-5), q: I(35), rel: '=', v };
  for (let t = 0; t < 100; t++) {
    const shape = pick(R, ['mulNegP', 'mulNegP', 'mulNegQ', 'divNegP', 'divNegQ', 'right']);
    const b = I(int(R, -12, 12)); if (b.n === 0 || Math.abs(b.n) === 1) continue;
    if (shape === 'mulNegP') f = { op: 'mul', p: I(-int(R, 2, 9)), q: I(0), rel: '=', v };
    else if (shape === 'mulNegQ') f = { op: 'mul', p: I(int(R, 2, 9)), q: I(0), rel: '=', v };
    else if (shape === 'divNegP') f = { op: 'div', p: I(-int(R, 2, 6)), q: I(0), rel: '=', v };
    else if (shape === 'divNegQ') f = { op: 'div', p: I(int(R, 2, 6)), q: I(0), rel: '=', v };
    else f = { op: 'mul', p: I(-int(R, 2, 9)), q: I(0), rel: '=', v, right: true };
    f.q = lhs(f, b);
    if (!isInt(f.q)) continue;
    if (f.p.n > 0 && b.n > 0) continue;
    break;
  }
  const s = solve(f), b = s.b, w = wrongOp(f);
  const nb = f.op === 'mul' ? div(f.q, abs(f.p)) : mul(f.q, abs(f.p));
  const temp = f.op === 'mul' && !f.right && f.p.n > 0 && f.q.n < 0 && R() < 0.5;
  const prompt = temp ? `The temperature dropped the same amount each hour for ${A(`${nHtml(f.p)} hours`)}: a change of ${B(`${nHtml(f.q)} °F`)} in all. What was the change each hour? <span class="dim">(${stHtml(f)})</span>`
    : `Solve ${B(stHtml(f))}. &nbsp;<i>${v}</i> = ?`;
  const wrongs: NumWrong[] = [];
  if (!eq(nb, b)) wrongs.push({ v: nb, mc: f.p.n < 0 ? MC.noSign : MC.negReject, say: f.p.n < 0 ? `Keep the sign of ${nHtml(f.p)}: ${invWords(f)}. A negative divided by a negative is positive; a positive divided by a negative is negative.` : `Check the sign: ${nHtml(f.q)} ${f.op === 'mul' ? '÷' : '×'} ${nHtml(f.p)} is negative. A negative answer is fine here.` });
  if (isInt(w.b) && !eq(w.b, b) && !eq(w.b, nb)) wrongs.push({ v: w.b, mc: w.mc, say: w.say });
  const it: Item = {
    id: `me-${n}`, family: 'mulEq', subgoal: sg, prompt, board: stTex(f), input: 'num', unit: temp ? '°F per hour' : '',
    solution: [`${stHtml(f)}: ${invWords(f)}.`, `<i>${v}</i> = ${nHtml(f.q)} ${f.op === 'mul' ? '÷' : '×'} ${f.p.n < 0 ? `(${nHtml(f.p)})` : nHtml(f.p)} = ${nHtml(b)}.`, `Check: ${exprHtml({ ...f, v: sv(f, b) }).replace(/<\/?i>/g, '').replace(/<span class="fr"><span>\(([^)]*)\)<\/span><span>([^<]*)<\/span><\/span>/, '($1) ÷ $2')} = ${nHtml(f.q)}.`],
    answer: numR(b), check: r => numCheck(r, b, `Yes: <i>${v}</i> = ${nHtml(b)}. Check: it gives ${nHtml(f.q)}.`, wrongs, `Not quite: ${invWords(f)}, and watch the sign.`),
  };
  for (const x of wrongs) if (x.mc) probe(it, numR(x.v), x.mc);
  FORMS.set(it, f);
  return it;
};

// signed decimals and fractions [solve-signed-rational]
const ratEq: Gen = (R, n, sg) => {
  const v = pick(R, V);
  let f: OneStep = { op: 'add', p: dec(2.5), q: dec(-1.25), rel: '=', v };
  for (let t = 0; t < 100; t++) {
    const shape = pick(R, ['addDec', 'subFrac', 'mulFrac', 'divDec', 'mulDec', 'addFrac']);
    if (shape === 'addDec') { const p = dec(int(R, 1, 6) + pick(R, [0.5, 0.25, 0.75])), b = dec(-(int(R, 1, 8) + pick(R, [0.25, 0.5, 0.75, 0]))); f = { op: 'add', p, q: add(b, p), rel: '=', v }; }
    else if (shape === 'subFrac') { const d = pick(R, [6, 4, 8, 12]), p = Nq(int(R, 1, d - 1), d), b = Nq(-int(R, 1, 2 * d), pick(R, [2, 3, 4, d])); f = { op: 'sub', p, q: sub(b, p), rel: '=', v, st: 'frac', right: R() < 0.5 }; }
    else if (shape === 'addFrac') { const p = neg(Nq(int(R, 1, 5), pick(R, [2, 3, 4]))), b = Nq(int(R, -8, 8), pick(R, [3, 4, 6])); f = { op: 'add', p, q: add(b, p), rel: '=', v, st: 'frac', pFirst: true }; }
    else if (shape === 'mulFrac') { const p = neg(pick(R, [Nq(3, 4), Nq(2, 3), Nq(2, 5), Nq(5, 6), Nq(3, 2)])), b = I(int(R, -6, 6) * p.d); f = { op: 'mul', p, q: mul(p, b), rel: '=', v, st: 'frac' }; }
    else if (shape === 'divDec') { const p = dec(-pick(R, [0.5, 0.25, 0.2, 2.5, 1.5])), q = I(int(R, -12, 12)); f = { op: 'div', p, q, rel: '=', v }; }
    else { const p = dec(-pick(R, [1.2, 0.4, 0.5, 2.5, 0.8, 1.5])), b = dec(int(R, -9, 9) / 10); f = { op: 'mul', p, q: mul(p, b), rel: '=', v }; }
    const s = solve(f);
    if (s.b.n === 0 || f.q.n === 0) continue;
    if (Math.abs(val(s.b)) > 40 || s.b.d > 24) continue;
    break;
  }
  const s = solve(f), b = s.b, st = f.st ?? 'dec', w = wrongOp(f);
  const nb = (f.op === 'mul' || f.op === 'div') && f.p.n < 0 ? (f.op === 'mul' ? div(f.q, abs(f.p)) : mul(f.q, abs(f.p))) : null;
  const wrongs: NumWrong[] = [];
  if (nb && !eq(nb, b)) wrongs.push({ v: nb, mc: MC.noSign, say: `Keep the sign of ${nHtml(f.p, st)}: ${invWords(f)}. The signs decide whether the answer is positive or negative.` });
  if (!eq(w.b, b) && !(nb && eq(w.b, nb))) wrongs.push({ v: w.b, mc: w.mc, say: w.say });
  const solution = [`${stHtml(f)}: ${invWords(f)}.`, `<i>${v}</i> = ${nHtml(b, st)}${!isInt(b) && terminates(b) && st === 'frac' ? ` = ${nHtml(b, 'dec')}` : ''}.`, `Check: put ${nHtml(b, st)} in for <i>${v}</i>: the ${f.op === 'add' || f.op === 'sub' ? 'sum' : f.op === 'mul' ? 'product' : 'quotient'} is ${nHtml(f.q, st)}.`];
  const ok = `Yes: <i>${v}</i> = ${nHtml(b, st)}. Substituting gives ${nHtml(f.q, st)}.`;
  let it: Item;
  if (terminates(b)) {
    it = { id: `re-${n}`, family: 'ratEq', subgoal: sg, prompt: `Solve ${B(stHtml(f))}. &nbsp;<i>${v}</i> = ? <span class="dim">(a decimal is fine)</span>`, board: stTex(f), input: 'num', unit: '', solution, answer: numR(b),
      check: r => numCheck(r, b, ok, wrongs.filter(x => terminates(x.v)), `Not quite: ${invWords(f)}.`) };
    for (const x of wrongs) if (x.mc && terminates(x.v)) probe(it, numR(x.v), x.mc);
  } else {
    const o = options(R, [
      { t: `<i>${v}</i> = ${nHtml(b, 'frac')}`, ok: true, say: ok },
      ...wrongs.map(x => ({ t: `<i>${v}</i> = ${nHtml(x.v, 'frac')}`, mc: x.mc, say: x.say })),
      { t: `<i>${v}</i> = ${nHtml(neg(b), 'frac')}`, mc: f.op === 'add' || f.op === 'sub' ? MC.negReject : MC.noSign, say: 'Check the sign: substitute and see which one gives the right side.' },
      { t: `<i>${v}</i> = ${nHtml(add(b, I(1)), 'frac')}`, say: `Check it: it does not give ${nHtml(f.q, st)}.` },
    ].slice(0, 4));
    it = { id: `re-${n}`, family: 'ratEq', subgoal: sg, prompt: `Solve ${B(stHtml(f))}.`, board: stTex(f), input: 'choice', choices: o.choices, solution, answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  FORMS.set(it, f);
  return it;
};

// =====================================================================================================
// flip or keep [ineq-negative-scale-reverse]: numerical evidence on two lines, or the decision for a statement
const flipMap: Gen = (R, n, sg) => {
  if (R() < 0.5) {
    // evidence: a < b, do the same to both, which order now?
    for (let t = 0; t < 200; t++) {
      const kind = pick(R, ['mulNeg', 'mulNeg', 'divNeg', 'addNeg', 'mulPos']);
      const a = int(R, -6, 5), b = a + int(R, 2, 5);
      const k = kind === 'mulNeg' ? -int(R, 2, 3) : kind === 'divNeg' ? -2 : kind === 'addNeg' ? -int(R, 2, 6) : int(R, 2, 3);
      if (kind === 'divNeg' && (a % 2 || b % 2)) continue;
      const img = (x: number) => (kind === 'addNeg' ? x + k : kind === 'divNeg' ? x / k : x * k);
      const ia = img(a), ib = img(b), lo = Math.min(a, b, ia, ib, 0), hi = Math.max(a, b, ia, ib, 0);
      if (hi - lo > 30) continue;
      const axis = autoAxis([lo, hi], { zero: true, width: 680, minTick: 1 });
      const reverses = kind === 'mulNeg' || kind === 'divNeg';
      const opTex = kind === 'addNeg' ? `+(${k})` : kind === 'divNeg' ? `\\div(${k})` : `\\times${k < 0 ? `(${k})` : k}`;
      const opHtml = kind === 'addNeg' ? `add ${String(k).replace('-', '−')} to` : kind === 'divNeg' ? `divide by ${String(k).replace('-', '−')}` : `multiply by ${String(k).replace('-', '−')}`;
      const params: SignLineParams = {
        axes: [{ id: 'a', ...axis, y: 330, side: 'above' }, { id: 'b', ...axis, y: 720, side: 'below' }],
        marks: [{ key: 'm.a', axis: 'a', v: a, tex: fmt(a), role: 'first', dot: 'closed' }, { key: 'm.b', axis: 'a', v: b, tex: fmt(b), role: 'second', dot: 'closed' },
          { key: 'm.ia', axis: 'b', v: ia, tex: fmt(ia), role: 'first', dot: 'closed' }, { key: 'm.ib', axis: 'b', v: ib, tex: fmt(ib), role: 'second', dot: 'closed' }],
        maps: [{ key: 'map', from: 'a', to: 'b', vs: [a, b], op: { kind: kind === 'addNeg' ? 'add' : 'mul', by: kind === 'divNeg' ? 1 / k : k }, role: 'pick', tex: opTex }],
      };
      if (!fits(params)) continue;
      const H = (x: number) => fmt(x).replace('-', '−');
      const rightRel = ia < ib ? '&lt;' : '&gt;', wrongRel = ia < ib ? '&gt;' : '&lt;';
      const mcWrong = reverses ? MC.noRev : kind === 'addNeg' ? MC.anyNeg : undefined;
      const o = options(R, [
        { t: `${H(ia)} ${rightRel} ${H(ib)}`, ok: true, say: reverses ? `Yes: ${opHtml.replace(' to', '')} a negative number mirrors the line through 0, so the order reverses.` : `Yes: the order stays: ${H(ia)} is still ${ia < ib ? 'left of' : 'right of'} ${H(ib)}.` },
        { t: `${H(ia)} ${wrongRel} ${H(ib)}`, mc: mcWrong, say: reverses ? `Look at the line: ${H(ia)} lands ${ia < ib ? 'left' : 'right'} of ${H(ib)}. ${kind === 'divNeg' ? 'Dividing' : 'Multiplying'} by a negative reverses the order.` : kind === 'addNeg' ? `Adding a negative number moves both numbers the same way: the order stays.` : 'Multiplying by a positive number stretches the line but keeps the order.' },
        { t: `${H(ia)} = ${H(ib)}`, say: 'Different numbers stay different after the same step.' },
      ]);
      const it: Item = {
        id: `fm-${n}`, family: 'flipMap', subgoal: sg,
        prompt: `${A(`${H(a)} &lt; ${H(b)}`)} is true. Now ${kind === 'addNeg' ? `add ${H(k)} to both numbers` : `${kind === 'divNeg' ? 'divide' : 'multiply'} both numbers by ${H(k)}`}. Which is true?`,
        board: `${fmt(a)} < ${fmt(b)} \\quad ${opTex}`, input: 'choice', choices: o.choices,
        picture: { kind: 'line', params, show: ['ax.a', 'ax.b', 'm.a', 'm.b'], solve: ['map', 'm.ia', 'm.ib'], board: [`${fmt(ia)} ${ia < ib ? '<' : '>'} ${fmt(ib)}`] } as unknown as Record<string, unknown>,
        solution: [`${H(a)} → ${H(ia)} and ${H(b)} → ${H(ib)}.`, reverses ? `The left number ends on the right: ${kind === 'divNeg' ? 'dividing' : 'multiplying'} by a negative reverses the order. ${H(ia)} ${rightRel} ${H(ib)}.` : `The order stays: ${H(ia)} ${rightRel} ${H(ib)}.`],
        answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
      };
      return it;
    }
  }
  // the decision for a statement: reverse or keep?
  const neg2 = R() < 0.5;
  const f: OneStep = neg2 ? scaleForm(R, 'ineq-negative-scale-reverse') : additiveForm(R, 'solve-ineq-signed-additive');
  const s = solve(f), st = f.st ?? 'dec';
  const o = options(R, s.flips ? [
    { t: `Reverse it: you ${f.op === 'mul' ? 'divide' : 'multiply'} both sides by ${nHtml(f.p, st)}, a negative number`, ok: true, say: `Yes: ${invWords(f)} reverses the order: ${sol(f.v ?? 'x', s.rel, s.b, st)}.` },
    { t: `Keep it: ${val(f.q) >= 0 ? `the right side ${nHtml(f.q, st)} is not negative` : 'it is an inequality, not an equation'}`, mc: MC.noRev, say: `What counts is the number you ${f.op === 'mul' ? 'divide' : 'multiply'} by: ${nHtml(f.p, st)} is negative, so the symbol reverses.` },
    { t: 'Keep it: dividing or multiplying never changes the symbol', mc: MC.noRev, say: `Test it: 2 &lt; 5, but −2 &gt; −5. ${f.op === 'mul' ? 'Dividing' : 'Multiplying'} by a negative reverses the order.` },
  ] : [
    { t: `Keep it: you ${f.op === 'add' ? (f.p.n < 0 ? 'add' : 'subtract') : f.op === 'sub' ? (f.p.n < 0 ? 'subtract' : 'add') : f.op === 'mul' ? 'divide by' : 'multiply by'} ${nHtml(abs(f.p), st)}${f.op === 'mul' || f.op === 'div' ? ', a positive number' : ''}`, ok: true, say: `Yes: ${invWords(f)} keeps the order: ${sol(f.v ?? 'x', s.rel, s.b, st)}.` },
    { t: 'Reverse it: there is a negative number in it', mc: MC.anyNeg, say: 'A negative number in the problem is not the reason to flip. Only multiplying or dividing both sides by a negative number reverses the order.' },
    { t: 'Reverse it: you undo the operation, so the symbol turns too', mc: MC.revAdd, say: 'Undoing + or − slides both sides the same way: the order stays.' },
  ]);
  if (!showsNegative(f) && !s.flips) { /* additive signed forms always show a negative; scale forms always flip */ }
  const it: Item = {
    id: `fk-${n}`, family: 'flipMap', subgoal: sg,
    prompt: `To solve ${B(stHtml(f))}, do you keep or reverse the inequality symbol?`,
    board: stTex(f), input: 'choice', choices: o.choices,
    solution: [`${stHtml(f)}: ${invWords(f)}.`, s.flips ? 'Multiplying or dividing by a negative number reverses the order, so the symbol reverses.' : 'Adding or subtracting (any number) keeps the order, so the symbol stays.', `${sol(f.v ?? 'x', s.rel, s.b, st)}.`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

// name the reason [justify-ineq-steps]
const justify: Gen = (R, n, sg) => {
  const kind = pick(R, ['flip', 'flip', 'add', 'pos', 'test']);
  if (kind === 'test') {
    const f = R() < 0.5 ? additiveForm(R, 'solve-ineq-signed-additive') : scaleForm(R, 'ineq-negative-scale-reverse');
    const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec';
    const grows = !(f.op === 'mul' || f.op === 'div') || f.p.n > 0;
    const o = options(R, [
      { t: `As <i>${v}</i> grows, ${exprHtml(f)} only ${grows ? 'grows' : 'shrinks'}, so the statement can switch between true and false only once: at the boundary.`, ok: true, say: 'Yes: the expression moves one way only, so the boundary splits the line into a true side and a false side, and one test on each side confirms which is which.' },
      { t: 'Checking the boundary is enough: it is the answer.', mc: MC.boundary, say: 'The boundary only shows where the switch happens. It does not tell you which side is true; you need a test on each side.' },
      { t: 'If one value works, every value on that side works, because it worked once.', mc: MC.examples, say: 'One example is not a reason. The reason is that the expression only grows (or only shrinks) as the variable grows.' },
    ]);
    const it: Item = {
      id: `js-${n}`, family: 'justify', subgoal: sg,
      prompt: `${stHtml(f)} solves to ${sol(v, s.rel, s.b, st)}. Why do the boundary plus one test value on each side confirm the whole answer?`,
      board: `${stTex(f)} \\;\\Rightarrow\\; ${solTex(v, s.rel, s.b, st)}`, input: 'choice', choices: o.choices,
      solution: [`${exprHtml(f)} ${grows ? 'increases' : 'decreases'} steadily as <i>${v}</i> increases.`, `So it passes ${nHtml(f.q, st)} only once, at <i>${v}</i> = ${nHtml(s.b, st)}: one side of the boundary is all true, the other all false.`, 'One test value on each side tells you which side is which.'],
      answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
    };
    FORMS.set(it, f);
    return it;
  }
  const f: OneStep = kind === 'flip' ? scaleForm(R, 'ineq-negative-scale-reverse') : kind === 'add' ? additiveForm(R, 'solve-ineq-signed-additive') : scaleForm(R, 'solve-ineq-positive-scale');
  const s = solve(f), v = f.v ?? 'x', st = f.st ?? 'dec';
  const doing = f.op === 'mul' ? 'Dividing' : f.op === 'div' ? 'Multiplying' : f.op === 'add' ? (f.p.n < 0 ? 'Adding' : 'Subtracting') : (f.p.n < 0 ? 'Subtracting' : 'Adding');
  const PROPS = {
    rev: `${f.op === 'mul' ? 'Dividing' : 'Multiplying'} both sides by the same negative number reverses the order.`,
    keepAdd: 'Adding or subtracting the same number on both sides keeps the order.',
    keepPos: `${f.op === 'mul' ? 'Dividing' : 'Multiplying'} both sides by the same positive number keeps the order.`,
    anyNeg: 'There is a negative number in the inequality, so the symbol flips.',
    smaller: `${doing} by ${nHtml(abs(f.p), st)} makes the numbers smaller, so the symbol flips.`,
    keepAll: `${f.op === 'mul' ? 'Dividing' : 'Multiplying'} both sides by the same number always keeps the order.`,
  };
  const opts: Opt[] = kind === 'flip' ? [
    { t: PROPS.rev, ok: true, say: `Yes: the step ${invWords(f)}, and ${nHtml(f.p, st)} is negative.` },
    { t: PROPS.anyNeg, mc: MC.anyNeg, say: 'The reason is not that a negative number shows up: it is the negative number you divide or multiply by.' },
    { t: PROPS.keepAll, mc: MC.noRev, say: 'That is only true for positive numbers. Here the symbol did reverse, because the number is negative.' },
    { t: PROPS.keepAdd, say: `That property is about adding and subtracting. This step ${invWords(f)}.` },
  ] : kind === 'add' ? [
    { t: PROPS.keepAdd, ok: true, say: `Yes: the step ${invWords(f)}; adding or subtracting keeps the order.` },
    { t: PROPS.anyNeg, mc: MC.anyNeg, say: 'The symbol did not flip, and it should not: the step only adds or subtracts.' },
    { t: `${f.op === 'add' ? 'Subtracting' : 'Adding'} reverses the order of an inequality.`, mc: MC.revAdd, say: 'Sliding both sides by the same amount keeps their order.' },
    { t: PROPS.keepPos, say: `That property is about multiplying or dividing. This step ${invWords(f)}.` },
  ] : [
    { t: PROPS.keepPos, ok: true, say: `Yes: the step ${invWords(f)}, and ${nHtml(f.p, st)} is positive.` },
    { t: PROPS.smaller, mc: MC.fracRev, say: 'Numbers may get smaller or bigger, but a positive factor keeps their order: the symbol stays.' },
    { t: PROPS.keepAdd, say: `That property is about adding and subtracting. This step ${invWords(f)}.` },
    { t: PROPS.rev, say: `${nHtml(f.p, st)} is positive, so nothing reverses.` },
  ];
  const o = options(R, opts);
  const it: Item = {
    id: `js-${n}`, family: 'justify', subgoal: sg,
    prompt: `Which property justifies the step from ${B(stHtml(f))} to ${S(sol(v, s.rel, s.b, st))}?`,
    board: `${stTex(f)} \\;\\Rightarrow\\; ${solTex(v, s.rel, s.b, st)}`, input: 'choice', choices: o.choices,
    solution: [`The step: ${invWords(f)}.`, s.flips ? `${nHtml(f.p, st)} is negative, so the order reverses: ${REL_HTML[f.rel]} becomes ${REL_HTML[s.rel]}.` : `The symbol stays: ${f.op === 'add' || f.op === 'sub' ? 'adding or subtracting keeps the order' : 'a positive factor keeps the order'}.`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

// signed values in context [model-signed-context]
const signedContext: Gen = (R, n, sg) => {
  const kind = pick(R, ['diver', 'temp', 'debt', 'tempIneq', 'balance', 'sub']);
  if (kind === 'diver' || kind === 'temp' || kind === 'sub') {
    let start = 0, end = 0, f: OneStep = { op: 'add', p: I(1), q: I(1), rel: '=' }, prompt = '', unit = '';
    for (let t = 0; t < 60; t++) {
    if (kind === 'diver') { start = -int(R, 10, 40); end = start + int(R, 3, Math.abs(start) - 1); f = { op: 'add', p: I(start), q: I(end), rel: '=', v: 'x', pFirst: true }; unit = 'ft'; prompt = `A diver is at ${A(`${start} ft`.replace('-', '−'))} (below the surface). She rises <i>x</i> ft to ${B(`${end} ft`.replace('-', '−'))}. How far did she rise? <span class="dim">(${stHtml(f)})</span>`; }
    else if (kind === 'temp') { start = -int(R, 2, 15); end = int(R, -1, 12); if (end <= start) end = start + 5; f = { op: 'add', p: I(start), q: I(end), rel: '=', v: 'x', pFirst: true }; unit = '°F'; prompt = `At 6 a.m. it was ${A(`${start} °F`.replace('-', '−'))}. By noon it was ${B(`${end} °F`.replace('-', '−'))}. What was the change <i>x</i>? <span class="dim">(${stHtml(f)})</span>`; }
    else { start = int(R, 2, 30); end = -int(R, 2, 25); f = { op: 'sub', p: I(start), q: I(end), rel: '=', v: 'x' }; unit = 'ft'; prompt = `A submarine dives ${A(`${start} ft`)} deeper and ends at ${B(`${end} ft`.replace('-', '−'))}. Where did it start? <span class="dim">(${stHtml(f)})</span>`; }
      const b0 = val(solve(f).b), ax0 = autoAxis([start, end, b0], { zero: true });
      const keyVals = kind === 'sub' ? [end, b0] : [start, end];
      if (fits({ axes: [{ id: 'x', ...ax0, y: 560, side: 'below' }], marks: keyVals.map((v0, i) => ({ key: 'k' + i, axis: 'x', v: v0, tex: fmt(v0), role: 'first' as const, dot: 'closed' as const })) })) break;
    }
    const s = solve(f), b = s.b, w = wrongOp(f);
    const wrongs: NumWrong[] = [{ v: w.b, mc: w.mc, say: w.say }];
    if (b.n < 0) wrongs.push({ v: neg(b), mc: MC.negReject, say: `Check it: the start is below the surface, so the answer is negative: <i>x</i> = ${nHtml(b)}.` });
    const axis = autoAxis([start, end, val(b)], { zero: true });
    const pic: LinePicture = kind === 'sub' ? {
      kind: 'line', params: { axes: [{ id: 'x', ...axis, y: 560, side: 'below' }], marks: [{ key: 'm.q', axis: 'x', v: end, tex: fmt(end), role: 'second', dot: 'closed' }, { key: 'm.b', axis: 'x', v: val(b), tex: nTex(b), role: 'link', dot: 'closed' }], jumps: [{ key: 'j', axis: 'x', from: end, to: val(b), tex: `+${start}`, role: 'pick' }] },
      show: ['ax.x', 'm.q'], solve: ['j', 'm.b'], board: [`x = ${end} + ${start} = ${nTex(b)}`],
    } : {
      kind: 'line', params: { axes: [{ id: 'x', ...axis, y: 560, side: 'below' }], marks: [{ key: 'm.p', axis: 'x', v: start, tex: fmt(start), role: 'first', dot: 'closed' }, { key: 'm.q', axis: 'x', v: end, tex: fmt(end), role: 'second', dot: 'closed' }], jumps: [{ key: 'j', axis: 'x', from: start, to: end, tex: `+${val(b)}`, role: 'link' }] },
      show: ['ax.x', 'm.p', 'm.q'], solve: ['j'], board: [`x = ${end} - (${start}) = ${nTex(b)}`],
    };
    const it: Item = {
      id: `sc-${n}`, family: 'signedContext', subgoal: sg, prompt, board: stTex(f), input: 'num', unit, picture: pic as unknown as Record<string, unknown>,
      solution: [`${stHtml(f)}: ${invWords(f)}.`, `<i>x</i> = ${nHtml(b)} ${unit}.`, kind === 'sub' ? `It started at ${nHtml(b)} ft: ${start} ft above where it ended.` : `From ${String(start).replace('-', '−')} up to ${String(end).replace('-', '−')} is ${nHtml(b)} ${unit}: a rise, so positive.`],
      answer: numR(b), check: r => numCheck(r, b, `Yes: <i>x</i> = ${nHtml(b)} ${unit}.`, wrongs, `Not quite: ${invWords(f)}.`),
    };
    for (const x of wrongs) if (x.mc && !eq(x.v, b)) probe(it, numR(x.v), x.mc);
    FORMS.set(it, f);
    return it;
  }
  if (kind === 'debt') {
    const k = int(R, 2, 6), each = int(R, 3, 25), total = -k * each;
    const f: OneStep = { op: 'mul', p: I(k), q: I(total), rel: '=', v: 's' };
    const b = solve(f).b;
    const it: Item = {
      id: `sc-${n}`, family: 'signedContext', subgoal: sg,
      prompt: `${A(`${k} friends`)} share a debt equally. Together their balance is ${B(`−$${k * each}`)}. What is each friend's share <i>s</i>, as a signed number? <span class="dim">(${stHtml(f)})</span>`,
      board: stTex(f), input: 'num', unit: 'dollars',
      solution: [`${stHtml(f)}: divide both sides by ${k}.`, `<i>s</i> = −${k * each} ÷ ${k} = −${each}: each friend's balance goes down $${each}.`],
      answer: numR(b), check: r => numCheck(r, b, `Yes: <i>s</i> = −${each}: a debt of $${each} each.`, [{ v: I(each), mc: MC.negReject, say: `A debt is a negative balance: the share is −${each}, not ${each}.` }, { v: I(total * k), mc: MC.visible, say: `That multiplies. Each share is the total divided by ${k}.` }], `Divide −${k * each} by ${k}.`),
    };
    probe(it, { kind: 'num', v: each }, MC.negReject);
    FORMS.set(it, f);
    return it;
  }
  if (kind === 'tempIneq') {
    const rate = int(R, 2, 5), hours = int(R, 2, 8), lim = -rate * hours;
    const f: OneStep = { op: 'mul', p: I(-rate), q: I(lim), rel: pick(R, ['<=', '<'] as Rel[]), v: 'h' };
    const s = solve(f);
    const word = f.rel === '<=' ? 'at most' : 'less than';
    const o = options(R, [
      { t: `${s.rel === '>=' ? 'at least' : 'more than'} ${hours} hours (<i>h</i> ${REL_HTML[s.rel]} ${hours})`, ok: true, say: `Yes: divide by −${rate} and reverse: <i>h</i> ${REL_HTML[s.rel]} ${hours}. The longer it falls, the colder it gets.` },
      { t: `${f.rel === '<=' ? 'at most' : 'less than'} ${hours} hours (<i>h</i> ${REL_HTML[f.rel]} ${hours})`, mc: MC.noRev, say: `Test <i>h</i> = 1: the change is −${rate} °F, which is not ${word} ${String(lim).replace('-', '−')}. Dividing by −${rate} reverses the symbol.` },
      { t: `exactly ${hours} hours (<i>h</i> = ${hours})`, mc: MC.boundary, say: `${hours} hours is only the boundary. Every longer time works too.` },
      { t: `${s.rel === '>=' ? 'at least' : 'more than'} ${rate * rate * hours} hours`, mc: MC.visible, say: `That multiplies by −${rate}. Divide both sides by −${rate} instead.` },
    ]);
    const it: Item = {
      id: `sc-${n}`, family: 'signedContext', subgoal: sg,
      prompt: `The temperature changes by ${A(`−${rate} °F every hour`)}. After <i>h</i> hours the change is −${rate}<i>h</i>. When is the change ${B(`${word} −${-lim} °F`)}? <span class="dim">(${stHtml(f)})</span>`,
      board: stTex(f), input: 'choice', choices: o.choices, picture: solutionPic('h', s.rel, s.b, 'dec', { f }) as unknown as Record<string, unknown>,
      solution: [`${stHtml(f)}: divide both sides by −${rate}, a negative number, so reverse the symbol.`, `<i>h</i> ${REL_HTML[s.rel]} ${hours}: ${s.rel === '>=' ? 'at least' : 'more than'} ${hours} hours.`, `Check <i>h</i> = ${hours + 1}: −${rate} × ${hours + 1} = −${rate * (hours + 1)}, which is ${word} ${String(lim).replace('-', '−')}.`],
      answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
    };
    FORMS.set(it, f);
    return it;
  }
  // balance stays above a negative limit after a withdrawal
  const wd = int(R, 5, 40), limit = -int(R, 5, 30);
  const f: OneStep = { op: 'sub', p: I(wd), q: I(limit), rel: pick(R, ['>', '>='] as Rel[]), v: 'b' };
  const s = solve(f);
  const word = f.rel === '>' ? 'above' : 'at or above';
  const o = options(R, [
    { t: sol('b', s.rel, s.b), ok: true, say: `Yes: add ${wd} to both sides; the symbol stays: ${sol('b', s.rel, s.b)}.` },
    { t: sol('b', flip(s.rel), s.b), mc: MC.anyNeg, say: 'The negative limit does not flip the symbol. You only add to both sides, so the order stays.' },
    { t: sol('b', s.rel, I(-val(s.b))), mc: MC.subNeg, say: `${String(limit).replace('-', '−')} + ${wd} = ${nHtml(s.b)}. Watch the signs.` },
    { t: `<i>b</i> = ${nHtml(s.b)}`, mc: MC.boundary, say: `${nHtml(s.b)} is only the boundary; many starting balances work.` },
  ]);
  const it: Item = {
    id: `sc-${n}`, family: 'signedContext', subgoal: sg,
    prompt: `After a ${A(`$${wd} withdrawal`)}, an account's balance must stay ${B(`${word} −$${-limit}`)}. Which starting balances <i>b</i> (dollars) work? <span class="dim">(${stHtml(f)})</span>`,
    board: stTex(f), input: 'choice', choices: o.choices, picture: solutionPic('b', s.rel, s.b, 'dec', { f }) as unknown as Record<string, unknown>,
    solution: [`${stHtml(f)}: add ${wd} to both sides. The symbol stays.`, `${sol('b', s.rel, s.b)}: a starting balance ${word} ${nHtml(s.b)} dollars.`],
    answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says),
  };
  FORMS.set(it, f);
  return it;
};

export const GENS: Record<FamilyId, Gen> = { solveAdd, graph, testPoint, solveScale, boundaryNum, contextCount, contextSet, geometry, addEq, mulEq, ratEq, flipMap, justify, signedContext };
// referenced so tree-shaking keeps the helpers honest
void exprTex; void invTex; void nPlain;
