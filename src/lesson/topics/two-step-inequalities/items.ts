// items.ts: exercise families for "two-step inequalities" (secondary.two-step-inequalities), generated from
// templates, checked exactly (ineqMaths.ts), every wrong answer classified against the misconception catalogue
// (math-curriculum-essentials ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's
// number ranges from the topic JSON (eqFor). Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import {
  type Form, type Ineq, type Op, OP_HTML, OP_TEX, OPS, dirOf, evalExpr, exprHtml, flip, holds, hq, ineqHtml, ineqTex, isDec, isStrict,
  q, dq, qAdd, qDiv, qMul, qNum, qSame, qSign, qSub, satisfies, setHtml, solve, toggleEq, tq, txt,
} from './ineqMaths';
import { type Q, toQ } from '../../../core/math';

export type FamilyId = 'pickSet' | 'testPoint' | 'shift' | 'solveShift' | 'scale' | 'mirror' | 'keepOrFlip' | 'negScale' | 'divNeg'
  | 'solve' | 'firstMove' | 'revWhen' | 'audit' | 'proofStep' | 'proofWhy' | 'writeIneq' | 'contextSolve' | 'wholeCount'
  | 'chooseModel' | 'storyFor' | 'domainFor';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'pickSet', name: 'Which graph?' },
  { id: 'testPoint', name: 'Test a value' },
  { id: 'shift', name: 'Add to both sides' },
  { id: 'solveShift', name: 'Undo an add' },
  { id: 'scale', name: 'Scale by a positive' },
  { id: 'mirror', name: 'Times −1' },
  { id: 'keepOrFlip', name: 'Which move turns it?' },
  { id: 'negScale', name: 'Times a negative' },
  { id: 'divNeg', name: 'Divide by a negative' },
  { id: 'solve', name: 'Solve it' },
  { id: 'firstMove', name: 'The first move' },
  { id: 'revWhen', name: 'When does it turn?' },
  { id: 'audit', name: 'Check the answer' },
  { id: 'proofStep', name: 'Proof, one step' },
  { id: 'proofWhy', name: 'Which is a proof?' },
  { id: 'writeIneq', name: 'Story to inequality' },
  { id: 'contextSolve', name: 'Solve the story' },
  { id: 'wholeCount', name: 'Whole numbers only' },
  { id: 'chooseModel', name: 'Equation or inequality?' },
  { id: 'storyFor', name: 'Inequality to story' },
  { id: 'domainFor', name: 'Which values make sense?' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

// ---------- misconception ids ----------
export const MC = {
  endpoint: 'mc.linear-equations.endpoint-style-convention',
  strictIncl: 'mc.linear-equations.strict-includes-boundary',
  boundaryOnly: 'mc.linear-equations.boundary-only-solution',
  anyNeg: 'mc.linear-equations.reverses-for-any-negative-sign',
  fracScale: 'mc.linear-equations.proper-fraction-scaling-reverses-order',
  posDiv: 'mc.linear-equations.reverses-for-positive-division',
  origSigns: 'mc.linear-equations.reversal-from-original-number-signs',
  special: 'mc.linear-equations.reversal-limited-to-special-case',
  mulOnly: 'mc.linear-equations.reversal-for-negative-multiplication-only',
  sideSwap: 'mc.linear-equations.side-swap-keeps-symbol',
  wrongOrder: 'mc.linear-equations.undoes-in-wrong-order',
  noRev: 'mc.linear-equations.no-reversal-for-negative',
  revAdd: 'mc.linear-equations.reverses-after-addition-or-subtraction',
  flipIncl: 'mc.linear-equations.reversal-flips-inclusion',
  oneTest: 'mc.linear-equations.one-test-proves-inequality-set',
  detached: 'mc.integers.minus-sign-detached-from-term',
  ruleJust: 'mc.reasoning-language.memorized-rule-as-justification',
  examples: 'mc.reasoning-language.examples-as-proof',
  negReject: 'mc.integers.negative-result-rejected',
  domainAll: 'mc.functions-concept.context-domain-all-reals',
  phrase: 'mc.linear-equations.bound-phrase-strictness-wrong',
  eqForBound: 'mc.linear-equations.equation-for-a-bound',
  roundNearest: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  dropsStart: 'mc.linear-functions.drops-start-value',
  signDrop: 'mc.integers.divide-by-coefficient-without-sign',
  partialDist: 'mc.properties.partial-distribution',
} as const;

// ---------- pictures the page can draw ----------
/** the solving chain on three number lines */
export interface ChainPic { kind: 'chain'; I: Ineq }
/** two numbers before and after one move on both sides (two lines, arrows) */
export interface OrderPic { kind: 'order'; a: number; b: number; move: Move }
/** one number line: the solution set (shown after a miss), test values, and someone's proposed set */
export interface SetPic { kind: 'set'; b: number; op: Op; form: Form; v: string; tests: number[]; proposed?: { b: number; op: Op } | null; given?: boolean }
export type Pic = ChainPic | OrderPic | SetPic;
export interface IqItem extends Item { family: FamilyId; picture?: Pic & Record<string, unknown> }
type Gen = (R: () => number, n: number, sg?: string) => IqItem;

// ---------- small helpers ----------
const X = (v = 'x') => `<i>${v}</i>`;
const nz = (R: () => number, lo: number, hi: number): number => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
const VARS = ['x', 'x', 'x', 'x', 'n', 'a', 'k', 'y'] as const;
const round3 = (v: number) => Math.round(v * 1000) / 1000;
/** a number as an exact rational: friendly fractions (2/3) stay exact, the rest to thousandths */
const Qv = (v: number): Q => toQ(v, 12) ?? dq(round3(v));
const num = (v: number, form: Form = 'int') => txt(Qv(v), form);
const H = (v: number, form: Form = 'int') => hq(Qv(v), form);
const par = (v: number, form: Form = 'int') => (v < 0 ? `(${H(v, form)})` : H(v, form));
const parT = (v: number, form: Form = 'int') => (v < 0 ? `(${tq(Qv(v), form)})` : tq(Qv(v), form));
const T = (v: number, form: Form = 'int') => tq(Qv(v), form);
const SAYS = {
  keep: 'The order stays: this move never swaps two numbers.',
  turn: 'Times or divided by a negative mirrors every number through 0, so the order turns around.',
};

interface Opt { html: string; ok?: boolean; mc?: string; say: string }
interface Base { id: string; family: FamilyId; subgoal?: string; prompt: string; board: string; solution: string[]; picture?: Pic }
/** a multiple-choice item: exactly one right option, the others carry their misconception */
function choose(R: () => number, base: Base, opts: Opt[]): IqItem {
  const o = shuffle(R, opts.slice());
  const right = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.html), answer: { kind: 'choice', i: right },
    picture: base.picture as IqItem['picture'],
    check(r: Response): Verdict {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one of the options.' };
      const c = o[r.i];
      if (!c) return { ok: false, say: 'Pick one of the options.' };
      return c.ok ? { ok: true, say: c.say } : { ok: false, mc: c.mc, say: c.say };
    },
  };
}
/** the first options whose html is new (distractors may collide for special numbers) */
function uniq(opts: Opt[], need: number): Opt[] {
  const out: Opt[] = [];
  for (const o of opts) if (!out.some(x => x.html === o.html)) out.push(o);
  return out.slice(0, need);
}

// ---------- the inequalities each sub-goal practises ----------
const FR_POS: readonly [number, number][] = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [3, 2]];
const FR_NEG: readonly [number, number][] = [[-1, 2], [-1, 3], [-1, 4], [-2, 3], [-3, 2]];
const DEC_POS = [0.5, 1.5, 2.5, 0.25] as const, DEC_NEG = [-0.5, -1.5, -2.5] as const, DEC_Q = [1.5, -1.5, 2.5, -2.5, 0.5, -3.5, 4.5] as const;
function lin(p: Q, qq: Q, b: Q, op: Op, form: Form, v: string, o: { side?: 'L' | 'R'; qFirst?: boolean } = {}): Ineq {
  return { kind: 'lin', p, q: qq, r: qAdd(qMul(p, b), qq), op, side: o.side ?? 'L', qFirst: o.qFirst, form, v };
}
function grp(p: Q, qq: Q, b: Q, op: Op, form: Form, v: string, side: 'L' | 'R' = 'L'): Ineq {
  return { kind: 'grp', p, q: qq, r: qMul(p, qAdd(b, qq)), op, side, form, v };
}
/** an inequality with the features of a sub-goal (topic JSON cases); the solution boundary is a friendly number */
export function eqFor(R: () => number, sg = 'solve-ineq-positive'): Ineq {
  const op = pick(R, OPS), v = pick(R, VARS);
  const t = R();
  if (sg === 'ineq-solution-set') {
    const p = int(R, 2, 6), b = int(R, -6, 9);
    return lin(q(p), q(nz(R, -12, 12)), q(b), op, 'int', v);
  }
  if (sg === 'solve-ineq-positive' || (sg !== 'solve-ineq-negative' && t < 0.5)) {
    const u = R();
    if (u < 0.3) return lin(q(int(R, 2, 7)), q(nz(R, -15, 15)), q(int(R, -8, 9)), op, 'int', v, { qFirst: R() < 0.25 });
    if (u < 0.45) return lin(q(int(R, 2, 6)), q(nz(R, -12, 12)), q(int(R, -6, 8)), op, 'int', v, { side: 'R' });
    if (u < 0.62) return grp(q(int(R, 2, 5)), q(nz(R, -6, 6)), q(int(R, -6, 8)), op, 'int', v, R() < 0.25 ? 'R' : 'L');
    if (u < 0.82) {
      const [a, c] = pick(R, FR_POS), k = int(R, -3, 4);
      if (a === 1 && R() < 0.4) { const qq = nz(R, -8, 8); return grp(q(1, c), q(qq), q(c * k - qq), op, 'frac', v); }   // (1/3)(x + 6) > -2
      return lin(q(a, c), q(nz(R, -9, 9)), q(c * k), op, 'frac', v);
    }
    return lin(dq(pick(R, DEC_POS)), dq(pick(R, DEC_Q)), q(int(R, -6, 8)), op, 'dec', v);
  }
  // p < 0 (solve-ineq-negative and the negative half of the other sub-goals)
  const u = R();
  if (u < 0.3) return lin(q(-int(R, 2, 6)), q(nz(R, -12, 15)), q(int(R, -7, 8)), op, 'int', v, { qFirst: R() < 0.5 });
  if (u < 0.42) return lin(q(-int(R, 2, 5)), q(nz(R, -10, 12)), q(int(R, -6, 7)), op, 'int', v, { side: 'R', qFirst: R() < 0.6 });
  if (u < 0.6) { const [a, c] = pick(R, FR_NEG); return lin(q(a, c), q(nz(R, -6, 6)), q(c * int(R, -3, 4)), op, 'frac', v); }
  if (u < 0.75) return lin(dq(pick(R, DEC_NEG)), dq(pick(R, DEC_Q)), q(int(R, -6, 7)), op, 'dec', v);
  if (u < 0.88) return grp(q(-int(R, 2, 5)), q(nz(R, -6, 6)), q(int(R, -6, 7)), op, 'int', v);
  return grp(q(-int(R, 2, 4)), dq(pick(R, [1.5, -1.5, 0.5, -2.5])), q(int(R, -5, 6)), op, 'dec', v);   // -2(x - 1.5) ≤ 7
}

// ---------- solving, step by step (worked solutions) ----------
const pos = (a: Q) => qSign(a) > 0;
function moveWords(I: Ineq): { first: string; second: string; turnFirst: boolean; turnSecond: boolean } {
  const f = I.form, neg = !pos(I.p);
  const undoQ = qSign(I.q) > 0 ? `subtract ${H(qNum(I.q), f)} from both sides` : `add ${H(-qNum(I.q), f)} to both sides`;
  const undoP = I.p.q > 1 && f === 'frac'
    ? `multiply both sides by ${hq(q(I.p.q * Math.sign(I.p.p), Math.abs(I.p.p)), f)}`
    : `divide both sides by ${par(qNum(I.p), f)}`;
  return I.kind === 'lin' ? { first: undoQ, second: undoP, turnFirst: false, turnSecond: neg } : { first: undoP, second: undoQ, turnFirst: neg, turnSecond: false };
}
/** the worked solution of a two-step inequality (HTML lines) */
export function solveLines(I: Ineq): string[] {
  const S = solve(I), f = I.form, v = I.v, mw = moveWords(I);
  const out: string[] = [];
  if (I.side === 'R') out.push(`${ineqHtml(I)} says the same as ${exprHtml(I)} ${OP_HTML[I.op]} ${hq(I.r, f)}.`);
  const midTxt = I.kind === 'lin' ? `${I.p.p === I.p.q ? '' : I.p.p === -I.p.q ? '&minus;' : hq(I.p, f)}${X(v)}` : `${X(v)} ${qSign(I.q) < 0 ? '&minus;' : '+'} ${hq(q(Math.abs(I.q.p), I.q.q), f)}`;
  out.push(`Undo the last step first: ${mw.first}${mw.turnFirst ? ` (a negative: the symbol turns)` : ''}. ${midTxt} ${OP_HTML[S.midOp]} ${hq(S.mid, f)}.`);
  out.push(`Then ${mw.second}${mw.turnSecond ? ' — a negative, so the symbol turns around' : mw.turnFirst ? '' : ' — the symbol stays'}. <b class="s">${setHtml(v, S.op, S.b, f)}</b>.`);
  const tIn = qAdd(S.b, q(dirOf(S.op) * (I.p.q > 1 ? I.p.q : 1)));
  out.push(`Test ${X(v)} = ${hq(tIn, f)}: ${hq(evalExpr(I, tIn), f)} ${OP_HTML[I.op]} ${hq(I.r, f)} ✓.`);
  return out;
}
function isNice(a: Q): boolean { return isDec(a) && Math.abs(qNum(a)) < 100; }

// ---------- 1. solution set: which graph? ----------
/** a small number-line graph as inline SVG (a choice in the panel): dot open/closed, a ray, the boundary below */
export function miniGraph(b: string, dir: 1 | -1 | 0, closed: boolean): string {
  const cx = 110, y = 20, ray = dir === 0 ? '' : `<path d="M${cx + dir * 9} ${y}H${dir > 0 ? 200 : 20}" stroke="#B4EA6A" stroke-width="7"/><path d="M${dir > 0 ? 212 : 8} ${y}l${dir > 0 ? -14 : 14} -9v18z" fill="#B4EA6A"/>`;
  const ticks = [30, 50, 70, 90, 130, 150, 170, 190].map(t => `<path d="M${t} ${y - 6}v12" stroke="currentColor" stroke-width="2" opacity=".6"/>`).join('');
  const dot = closed ? `<circle cx="${cx}" cy="${y}" r="9" fill="#B4EA6A"/>` : `<circle cx="${cx}" cy="${y}" r="8" fill="#161A36" stroke="#B4EA6A" stroke-width="4"/>`;
  const label = `${dir === 0 ? 'only' : closed ? 'closed dot at' : 'open dot at'} ${b}${dir > 0 ? ', shaded right' : dir < 0 ? ', shaded left' : ''}`;
  return `<svg class="mini" viewBox="0 0 220 58" width="220" height="58" role="img" aria-label="${label}"><path d="M4 ${y}H216" stroke="currentColor" stroke-width="2.5"/>${ticks}<path d="M${cx} ${y - 9}v18" stroke="currentColor" stroke-width="2.5"/>${ray}${dot}<text x="${cx}" y="54" text-anchor="middle" fill="currentColor" font-size="19" font-weight="700">${b}</text></svg>`;
}
const pickSet: Gen = (R, n, sg = 'ineq-solution-set') => {
  const I = eqFor(R, sg), S = solve(I), f = I.form, v = I.v;
  const bt = txt(S.b, f), d = dirOf(S.op), cl = !isStrict(S.op);
  const opts: Opt[] = [
    { html: miniGraph(bt, d, cl), ok: true, say: `Yes: ${cl ? 'a closed dot, because the boundary itself works' : 'an open dot, because the boundary itself does not work'}, and the ray points to the side that passes the test.` },
    { html: miniGraph(bt, d, !cl), mc: cl ? MC.endpoint : MC.strictIncl, say: cl ? `The symbol has "or equal", so ${X(v)} = ${hq(S.b, f)} works: the dot is closed (filled).` : `Put ${X(v)} = ${hq(S.b, f)} in: both sides are equal, and "${OP_HTML[S.op]}" is strict, so the boundary is left out: an open dot.` },
    { html: miniGraph(bt, -d as 1 | -1, cl), mc: !pos(I.p) ? MC.noRev : undefined, say: `Test a number on that side: it makes the inequality false. The ray points the other way.` },
    { html: miniGraph(bt, 0, true), mc: MC.boundaryOnly, say: `${hq(S.b, f)} is only the boundary. Every number on one side works too: the answer is a whole ray.` },
  ];
  return choose(R, {
    id: `pickSet-${n}`, family: 'pickSet', subgoal: sg, board: ineqTex(I),
    prompt: `Which graph shows <b>every</b> solution of <b>${ineqHtml(I)}</b>?`,
    solution: solveLines(I),
    picture: { kind: 'set', b: qNum(S.b), op: S.op, form: f, v, tests: [qNum(S.b) - 2 * (I.p.q > 1 ? I.p.q : 1), qNum(S.b) + 2 * (I.p.q > 1 ? I.p.q : 1)] },
  }, opts);
};

// ---------- 1 / 9. test a value ----------
const testPoint: Gen = (R, n, sg = 'ineq-solution-set') => {
  const I = eqFor(R, sg === 'audit-solution-set' ? (R() < 0.6 ? 'solve-ineq-negative' : 'solve-ineq-positive') : sg), S = solve(I), f = I.form, v = I.v;
  const step = I.p.q > 1 ? I.p.q : 1;
  const kind = pick(R, ['boundary', 'in', 'out', 'boundary', 'in', 'out', 'out'] as const);
  const x = kind === 'boundary' ? S.b : qAdd(S.b, q((kind === 'in' ? 1 : -1) * dirOf(S.op) * step * int(R, 1, 3)));
  const val = evalExpr(I, x), ok = satisfies(I, x);
  const xs = `(${hq(x, f)})`;
  const wrongMc = kind === 'boundary' ? (isStrict(I.op) ? MC.strictIncl : MC.endpoint) : !pos(I.p) ? MC.noRev : undefined;
  const why = `Put ${X(v)} = ${hq(x, f)} in: ${exprHtml({ ...I, v: xs }).replace(`<i>${xs}</i>`, xs)} = ${hq(val, f)}, and ${hq(val, f)} ${OP_HTML[I.op]} ${hq(I.r, f)} is ${ok ? 'true' : 'false'}.`;
  return choose(R, {
    id: `testPoint-${n}`, family: 'testPoint', subgoal: sg, board: `${ineqTex(I)} \\qquad ${I.v} = ${tq(x, f)}`,
    prompt: `Is ${X(v)} = <b>${hq(x, f)}</b> a solution of <b>${ineqHtml(I)}</b>?`,
    solution: [why, `The whole solution set is ${setHtml(v, S.op, S.b, f)}${kind === 'boundary' ? `: the boundary ${hq(S.b, f)} is ${isStrict(S.op) ? 'left out (open dot)' : 'included (closed dot)'}` : ''}.`],
    picture: { kind: 'set', b: qNum(S.b), op: S.op, form: f, v, tests: [qNum(x)] },
  }, [
    { html: `Yes, it makes the inequality true`, ok: ok, mc: ok ? undefined : wrongMc, say: ok ? `Right. ${why}` : `${why} So it is not a solution.` },
    { html: `No, it makes the inequality false`, ok: !ok, mc: ok ? wrongMc : undefined, say: ok ? `${why} So it is a solution.` : `Right. ${why}` },
  ]);
};

// ---------- 2-6. what a move on both sides does to a true statement ----------
export interface Move { kind: 'add' | 'mul' | 'div'; k: number; form: Form }
const applyMove = (m: Move, v: number) => round3(m.kind === 'add' ? v + m.k : m.kind === 'mul' ? v * m.k : v / m.k);
export const moveReverses = (m: Move) => m.kind !== 'add' && m.k < 0;
function moveHtml(m: Move): string {
  if (m.kind === 'add') return `add ${par(m.k, m.form)} to both sides`;
  return `${m.kind === 'mul' ? 'multiply' : 'divide'} both sides by ${par(m.k, m.form)}`;
}
export const moveTex = (m: Move) => (m.kind === 'add' ? `+\\,${parT(m.k, m.form)}` : m.kind === 'mul' ? `\\times ${parT(m.k, m.form)}` : `\\div ${parT(m.k, m.form)}`);
/** a pair a < b (or a > b) with friendly images under the move */
function pairFor(R: () => number, m: Move, sameSign?: 'pos' | 'neg' | 'mixed'): [number, number] {
  const unit = m.kind === 'div' ? Math.abs(m.k) : m.kind === 'mul' && !Number.isInteger(m.k) ? den(m.k) : 1;
  for (;;) {
    let a = int(R, -10, 10) * unit, b = int(R, -10, 10) * unit;
    if (sameSign === 'pos') { a = int(R, 1, 10) * unit; b = int(R, 1, 10) * unit; }
    if (sameSign === 'neg') { a = -int(R, 1, 10) * unit; b = -int(R, 1, 10) * unit; }
    if (sameSign === 'mixed') { a = -int(R, 1, 9) * unit; b = int(R, 1, 9) * unit; if (R() < 0.5) [a, b] = [b, a]; }
    if (a !== b && Math.abs(a - b) <= 14 * unit && Math.abs(a) <= 40 && Math.abs(b) <= 40) return [a, b];
  }
}
function den(k: number): number { for (let d = 1; d <= 12; d++) if (Math.abs(Math.round(k * d) - k * d) < 1e-9) return d; return 1; }
const rel = (a: number, b: number): Op => (a < b ? '<' : '>');
/** "which statement is true after the move?" with the numbers or with letters */
function moveItem(R: () => number, n: number, fam: FamilyId, sg: string, m: Move, pair: [number, number], wrongMc: string | undefined, letters: boolean): IqItem {
  const [a, b] = pair, o = rel(a, b), A = applyMove(m, a), B = applyMove(m, b), f = m.form;
  const right = rel(A, B), keep = right === o;
  const lt = (s: string) => `<i>${s}</i>`;
  const img = (s: string) => (m.kind === 'add' ? `${lt(s)} ${m.k < 0 ? '&minus;' : '+'} ${H(Math.abs(m.k), f)}` : m.kind === 'mul' ? `${par(m.k, f)}${lt(s)}` : `${lt(s)} ÷ ${par(m.k, f)}`);
  const st = (x: string, op: Op, y: string) => `${x} ${OP_HTML[op]} ${y}`;
  const opts: Opt[] = letters ? [
    { html: st(img('p'), right, img('q')), ok: true, say: keep ? SAYS.keep : SAYS.turn },
    { html: st(img('p'), flip(right), img('q')), mc: wrongMc, say: keep ? `${SAYS.keep} So the symbol stays ${OP_HTML[o]}.` : `${SAYS.turn} So ${OP_HTML[o]} becomes ${OP_HTML[right]}.` },
    { html: 'It depends on the numbers p and q', mc: keep ? MC.anyNeg : MC.origSigns, say: keep ? 'It never depends on them: this move keeps the order of ANY two numbers, negative or not.' : 'It never depends on them: a negative factor mirrors ANY two numbers, so the order always turns.' },
  ] : [
    { html: st(H(A, f), right, H(B, f)), ok: true, say: keep ? SAYS.keep : SAYS.turn },
    { html: st(H(A, f), flip(right), H(B, f)), mc: wrongMc, say: `Compare the two new numbers on the line: ${H(A, f)} is ${A < B ? 'left of' : 'right of'} ${H(B, f)}. ${keep ? SAYS.keep : SAYS.turn}` },
    { html: `${H(A, f)} = ${H(B, f)}`, mc: undefined, say: `The two numbers are different, so they cannot be equal. ${keep ? SAYS.keep : SAYS.turn}` },
  ];
  const what = moveHtml(m);
  const prompt = letters
    ? `For two numbers ${lt('p')} and ${lt('q')} (either could be negative), <b>${lt('p')} ${OP_HTML[o]} ${lt('q')}</b> is true. Now ${what}. Which is true?`
    : `<b>${H(a, f)} ${OP_HTML[o]} ${H(b, f)}</b> is true. Now ${what}. Which is true?`;
  return choose(R, {
    id: `${fam}-${n}`, family: fam, subgoal: sg, prompt,
    board: letters ? `p ${OP_TEX[o]} q \\quad \\xrightarrow{${moveTex(m)}} \\quad ?` : `${T(a, f)} ${OP_TEX[o]} ${T(b, f)} \\quad \\xrightarrow{${moveTex(m)}} \\quad ?`,
    solution: [
      `${letters ? `Try any pair, say ${lt('p')} = ${H(a, f)}, ${lt('q')} = ${H(b, f)}: ` : ''}${H(a, f)} → ${H(A, f)} and ${H(b, f)} → ${H(B, f)}.`,
      keep ? (m.kind === 'add' ? 'Adding the same number slides every number the same distance: nothing passes anything, the order stays.' : 'A positive factor stretches or shrinks the line from 0: the order stays.')
        : `${m.kind === 'div' ? `Dividing by ${par(m.k, f)} is multiplying by its reciprocal, a negative. ` : ''}A negative factor mirrors the line through 0: the order turns, ${OP_HTML[o]} becomes ${OP_HTML[right]}.`,
    ],
    picture: { kind: 'order', a, b, move: m },
  }, opts);
}
const ADDS = [-12, -9, -7, -5, -3, -2, 2, 3, 5, 6, 8, 11];
const shift: Gen = (R, n, sg = 'order-preserve-translation') => {
  const m: Move = { kind: 'add', k: pick(R, ADDS), form: 'int' };
  const pair = pairFor(R, m);
  const A = applyMove(m, pair[0]), B = applyMove(m, pair[1]);
  const negShown = m.k < 0 || A < 0 || B < 0 || pair[0] < 0 || pair[1] < 0;
  return moveItem(R, n, 'shift', sg, m, pair, negShown ? MC.anyNeg : MC.revAdd, R() < 0.3);
};
const POS_SCALE: readonly Move[] = [
  { kind: 'mul', k: 2, form: 'int' }, { kind: 'mul', k: 3, form: 'int' }, { kind: 'mul', k: 5, form: 'int' },
  { kind: 'mul', k: 0.5, form: 'dec' }, { kind: 'mul', k: 0.25, form: 'dec' }, { kind: 'mul', k: 1 / 3, form: 'frac' }, { kind: 'mul', k: 2 / 3, form: 'frac' }, { kind: 'mul', k: 0.75, form: 'frac' },
  { kind: 'div', k: 2, form: 'int' }, { kind: 'div', k: 4, form: 'int' }, { kind: 'div', k: 5, form: 'int' }, { kind: 'div', k: 3, form: 'int' },
];
const scale: Gen = (R, n, sg = 'order-preserve-positive-scaling') => {
  const m = pick(R, POS_SCALE), pair = pairFor(R, m);
  const mc = m.kind === 'div' ? MC.posDiv : m.k < 1 ? MC.fracScale : MC.anyNeg;
  return moveItem(R, n, 'scale', sg, m, pair, mc, R() < 0.3);
};
const mirror: Gen = (R, n, sg = 'reverse-by-minus-one') => {
  const kind = pick(R, ['pos', 'neg', 'mixed'] as const);
  const m: Move = { kind: 'mul', k: -1, form: 'int' };
  return moveItem(R, n, 'mirror', sg, m, pairFor(R, m, kind), kind === 'mixed' ? MC.noRev : MC.origSigns, R() < 0.2);
};
const NEG_SCALE: readonly Move[] = [
  { kind: 'mul', k: -2, form: 'int' }, { kind: 'mul', k: -3, form: 'int' }, { kind: 'mul', k: -4, form: 'int' }, { kind: 'mul', k: -5, form: 'int' },
  { kind: 'mul', k: -0.5, form: 'frac' }, { kind: 'mul', k: -1 / 3, form: 'frac' }, { kind: 'mul', k: -0.25, form: 'frac' }, { kind: 'mul', k: -2 / 3, form: 'frac' },
];
const negScale: Gen = (R, n, sg = 'reverse-any-negative') => {
  const m = pick(R, NEG_SCALE);
  return moveItem(R, n, 'negScale', sg, m, pairFor(R, m), MC.special, R() < 0.3);
};
const divNeg: Gen = (R, n, sg = 'reverse-negative-division') => {
  if (R() < 0.3) {
    // the contrast case: a POSITIVE divisor while a negative number shows
    const m: Move = { kind: 'div', k: pick(R, [2, 3, 4, 5]), form: 'int' };
    return moveItem(R, n, 'divNeg', sg, m, pairFor(R, m, 'mixed'), MC.anyNeg, false);
  }
  const m: Move = { kind: 'div', k: -pick(R, [2, 3, 4, 5, 6]), form: 'int' };
  return moveItem(R, n, 'divNeg', sg, m, pairFor(R, m), MC.mulOnly, R() < 0.3);
};

// ---------- 4-6. which move turns the symbol? ----------
function moveName(m: Move): string {
  if (m.kind === 'add') return m.k < 0 ? (Math.abs(m.k) % 2 ? `add ${par(m.k)} to both sides` : `subtract ${H(-m.k)} from both sides`) : `add ${H(m.k)} to both sides`;
  return `${m.kind === 'mul' ? 'multiply' : 'divide'} both sides by ${par(m.k, m.form)}`;
}
const keepOrFlip: Gen = (R, n, sg = 'reverse-by-minus-one') => {
  const turner: Move = sg === 'reverse-by-minus-one' ? { kind: 'mul', k: -1, form: 'int' }
    : sg === 'reverse-negative-division' ? { kind: 'div', k: -pick(R, [2, 3, 4, 5, 10]), form: 'int' }
      : pick(R, NEG_SCALE);
  const pool: { m: Move; mc?: string }[] = [
    { m: { kind: 'add', k: -pick(R, [3, 4, 5, 7, 8]), form: 'int' }, mc: MC.anyNeg },
    { m: { kind: 'add', k: pick(R, [2, 3, 6, 9]), form: 'int' }, mc: MC.revAdd },
    { m: { kind: 'mul', k: pick(R, [2, 3, 4, 6]), form: 'int' } },
    { m: { kind: 'mul', k: pick(R, [0.5, 0.25]), form: 'frac' }, mc: MC.fracScale },
    { m: { kind: 'div', k: pick(R, [2, 3, 5, 10]), form: 'int' }, mc: MC.posDiv },
  ];
  const others = shuffle(R, pool).slice(0, 3);
  const a = int(R, -9, 4), b = a + int(R, 2, 9);
  const opts: Opt[] = [
    { html: `${moveName(turner)[0]!.toUpperCase()}${moveName(turner).slice(1)}`, ok: true, say: `Yes. ${turner.kind === 'div' ? 'Dividing by a negative is multiplying by a negative reciprocal: ' : ''}a negative factor mirrors every number through 0, so the order turns.` },
    ...others.map(o => ({
      html: `${moveName(o.m)[0]!.toUpperCase()}${moveName(o.m).slice(1)}`, mc: o.mc,
      say: o.m.kind === 'add' ? 'Adding or subtracting slides every number the same way: the order stays, even with a negative.' : o.m.kind === 'div' ? 'Dividing by a positive shrinks the line toward 0: the order stays.' : o.m.k < 1 ? 'A positive fraction shrinks the line toward 0: smaller numbers, same order.' : 'A positive factor stretches the line from 0: the order stays.',
    })),
  ];
  return choose(R, {
    id: `keepOrFlip-${n}`, family: 'keepOrFlip', subgoal: sg,
    prompt: `<b>${H(a)} &lt; ${H(b)}</b>. Which move, done to both sides, turns the symbol around?`,
    board: `${a} < ${b}`,
    solution: [`Only multiplying or dividing by a <b>negative</b> number turns the symbol: it mirrors the line through 0.`, `Here: ${moveName(turner).replace(' both sides', '')} gives ${H(applyMove(turner, a), turner.form)} &gt; ${H(applyMove(turner, b), turner.form)}.`],
    picture: { kind: 'order', a, b, move: turner },
  }, opts);
};

// ---------- 7-8. solve ----------
const solveF: Gen = (R, n, sg = 'solve-ineq-positive') => {
  const I = eqFor(R, sg), S = solve(I), f = I.form, v = I.v;
  const anyNegShown = qSign(I.q) < 0 || qSign(I.r) < 0 || qSign(I.p) < 0;
  const wb = I.kind === 'lin' ? qSub(qDiv(I.r, I.p), I.q) : qDiv(qSub(I.r, I.q), I.p);
  const turnSay = `Dividing (or multiplying) both sides by the negative ${hq(I.p, f)} turns the symbol around.`;
  const opts: Opt[] = [{ html: setHtml(v, S.op, S.b, f), ok: true, say: `Right: ${setHtml(v, S.op, S.b, f)}. ${S.reversed ? turnSay : 'Every move here keeps the order, so the symbol never turns.'}` }];
  if (S.reversed) {
    opts.push({ html: setHtml(v, flip(S.op), S.b, f), mc: MC.noRev, say: `The boundary ${hq(S.b, f)} is right, but the ray points the wrong way. ${turnSay}` });
    if (!isStrict(S.op)) opts.push({ html: setHtml(v, toggleEq(S.op), S.b, f), mc: MC.flipIncl, say: `Turning the symbol keeps the "or equal": ${OP_HTML[I.op]} becomes ${OP_HTML[S.op]}, not ${OP_HTML[toggleEq(S.op)]}.` });
    if (S.b.p !== 0) opts.push({ html: setHtml(v, S.op, q(-S.b.p, S.b.q), f), mc: MC.signDrop, say: `Watch the sign when you divide by the negative ${hq(I.p, f)}: the boundary is ${hq(S.b, f)}.` });
  } else {
    opts.push({ html: setHtml(v, flip(S.op), S.b, f), mc: I.side === 'R' ? MC.sideSwap : anyNegShown ? MC.anyNeg : MC.revAdd, say: I.side === 'R' ? `${hq(I.r, f)} ${OP_HTML[flip(I.op)]} ${X(v)}… reads from the right as ${X(v)} ${OP_HTML[S.op]} ${hq(S.b, f)}: swapping the sides turns the symbol too.` : `Nothing here multiplies or divides by a negative, so the symbol never turns. A negative number showing is not a reason.` });
  }
  if (isNice(wb) && !qSame(wb, S.b)) opts.push({ html: setHtml(v, S.op, wb, f), mc: MC.wrongOrder, say: `That undoes the steps in the wrong order. Undo the LAST step done to ${X(v)} first.` });
  opts.push({ html: `${X(v)} = ${hq(S.b, f)}`, mc: MC.boundaryOnly, say: `${hq(S.b, f)} is only the boundary. A whole ray of numbers makes it true: test one.` });
  opts.push({ html: setHtml(v, S.op, qAdd(S.b, q(S.b.p >= 0 ? 1 : -1)), f), say: 'Check the arithmetic: put the boundary back into the related equation.' });
  const o = uniq(opts, 4);
  return choose(R, {
    id: `solve-${n}`, family: 'solve', subgoal: sg, board: ineqTex(I),
    prompt: `Solve <b>${ineqHtml(I)}</b>. Which is the solution set, with ${X(v)} on the left?`,
    solution: solveLines(I), picture: { kind: 'chain', I },
  }, o);
};
const firstMove: Gen = (R, n, sg = 'solve-ineq-positive') => {
  const I = eqFor(R, sg), f = I.form, mw = moveWords(I), neg = !pos(I.p);
  const undoQ = qSign(I.q) > 0 ? `Subtract ${H(qNum(I.q), f)} from both sides` : `Add ${H(-qNum(I.q), f)} to both sides`;
  const undoP = I.p.q > 1 && f === 'frac' ? `Multiply both sides by ${hq(q(I.p.q * Math.sign(I.p.p), Math.abs(I.p.p)), f)}` : `Divide both sides by ${par(qNum(I.p), f)}`;
  const opts: Opt[] = I.kind === 'lin' ? [
    { html: `${undoQ}; the symbol stays`, ok: true, say: `Yes. The ${qSign(I.q) > 0 ? '+' : '&minus;'} ${H(Math.abs(qNum(I.q)), f)} was the last thing done to ${X(I.v)}, so it comes off first, and adding or subtracting never turns the symbol.` },
    { html: `${undoQ}; the symbol turns around`, mc: MC.revAdd, say: 'Adding or subtracting slides both sides the same way: the symbol stays.' },
    { html: `${undoP}${neg ? ' and turn the symbol' : ''}, first`, mc: MC.wrongOrder, say: `The × ${par(qNum(I.p), f)} was done FIRST, so it is undone LAST. Undo the ${qSign(I.q) > 0 ? '+' : '&minus;'} ${H(Math.abs(qNum(I.q)), f)} first.` },
  ] : [
    { html: `${undoP}${neg ? '; the symbol turns around' : '; the symbol stays'}`, ok: true, say: `Yes. The × ${par(qNum(I.p), f)} was done last (to the whole group), so it is undone first${neg ? ', and a negative factor turns the symbol' : ''}.` },
    { html: `${undoP}${neg ? '; the symbol stays' : '; the symbol turns around'}`, mc: neg ? MC.noRev : MC.posDiv, say: neg ? `Dividing both sides by a negative turns the symbol around.` : `Dividing by a positive keeps the order: the symbol stays.` },
    { html: `${qSign(I.q) > 0 ? `Subtract ${H(qNum(I.q), f)} from both sides` : `Add ${H(-qNum(I.q), f)} to both sides`} first`, mc: MC.wrongOrder, say: `The ${qSign(I.q) > 0 ? '+' : '&minus;'} ${H(Math.abs(qNum(I.q)), f)} is inside the parentheses: it was done first, so it is undone last.` },
  ];
  void mw;
  return choose(R, {
    id: `firstMove-${n}`, family: 'firstMove', subgoal: sg, board: ineqTex(I),
    prompt: `What is the first move to solve <b>${ineqHtml(I)}</b>?`,
    solution: solveLines(I), picture: { kind: 'chain', I },
  }, opts);
};
const revWhen: Gen = (R, n, sg = 'solve-ineq-negative') => {
  const I = eqFor(R, R() < 0.7 ? 'solve-ineq-negative' : 'solve-ineq-positive'), f = I.form, neg = !pos(I.p);
  const mw = moveWords(I);
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  const firstIsTurn = mw.turnFirst, secondIsTurn = mw.turnSecond;
  const opts: Opt[] = [
    { html: `At the first move: ${mw.first}`, ok: firstIsTurn, mc: firstIsTurn ? undefined : I.kind === 'lin' ? MC.revAdd : MC.posDiv, say: firstIsTurn ? 'Right: that move divides by a negative.' : 'That move adds or subtracts, or divides by a positive: the symbol stays.' },
    { html: `At the second move: ${mw.second}`, ok: secondIsTurn, mc: secondIsTurn ? undefined : I.kind === 'lin' ? MC.posDiv : MC.revAdd, say: secondIsTurn ? 'Right: that move divides by a negative.' : 'That move keeps the order: it adds, subtracts or divides by a positive.' },
    { html: 'At no step: the symbol never turns', ok: !neg, mc: neg ? MC.noRev : undefined, say: neg ? `${cap(I.kind === 'lin' ? mw.second : mw.first)}: a negative number, so the symbol turns there.` : 'Right: no move multiplies or divides by a negative, even though negatives may show.' },
    { html: 'At both steps, because there are negatives', mc: MC.anyNeg, say: 'Only the move that multiplies or divides by a negative turns the symbol. Subtracting never does.' },
  ];
  return choose(R, {
    id: `revWhen-${n}`, family: 'revWhen', subgoal: sg, board: ineqTex(I),
    prompt: `You solve <b>${ineqHtml(I)}</b>: first you ${mw.first}, then you ${mw.second}. When does the symbol turn around?`,
    solution: solveLines(I), picture: { kind: 'chain', I },
  }, opts);
};

// ---------- 9. audit a proposed solution set ----------
const NAMES = ['Mia', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Maya', 'Omar', 'Lily', 'Sam'];
const audit: Gen = (R, n, sg = 'audit-solution-set') => {
  const I = eqFor(R, R() < 0.65 ? 'solve-ineq-negative' : 'solve-ineq-positive'), S = solve(I), f = I.form, v = I.v, who = pick(R, NAMES);
  const kind = pick(R, ['right', 'ray', 'ray', 'dot', 'dot'] as const);
  const pOp: Op = kind === 'right' ? S.op : kind === 'ray' ? flip(S.op) : toggleEq(S.op);
  // the one test the student did: it AGREES with the proposed set (that is the trap)
  const step = q(I.p.q > 1 ? I.p.q : 1);
  const tx = kind === 'ray' ? (isStrict(S.op) === isStrict(pOp) ? S.b : qAdd(S.b, qMul(step, q(dirOf(S.op) * 2)))) : qAdd(S.b, qMul(step, q(dirOf(S.op) * 2)));
  const tIn = satisfies(I, tx);
  const xs = hq(tx, f), val = hq(evalExpr(I, tx), f);
  const opts: Opt[] = [
    { html: `${who}’s set is right`, ok: kind === 'right', mc: kind === 'right' ? undefined : MC.oneTest, say: kind === 'right' ? 'Right: a test on each side and at the boundary all agree.' : `One test that agrees is not enough. Test a value on each side and the boundary.` },
    { html: 'The ray points the wrong way', ok: kind === 'ray', say: kind === 'ray' ? `Right: test a value on ${who}’s side: it makes the inequality false.${S.reversed ? ' The symbol had to turn.' : ''}` : 'Test a value on the shaded side: it works. The ray is right.' },
    { html: `The dot should be ${isStrict(pOp) ? 'closed' : 'open'}`, ok: kind === 'dot', mc: kind === 'dot' ? undefined : isStrict(S.op) ? MC.strictIncl : MC.endpoint, say: kind === 'dot' ? `Right: put ${X(v)} = ${hq(S.b, f)} in. Both sides are equal, so the boundary is ${isStrict(S.op) ? 'left out' : 'included'}.` : `The boundary: both sides are equal there, and the symbol ${isStrict(S.op) ? 'is strict, so it is left out' : 'has "or equal", so it is in'}: ${who}’s dot is right.` },
    { html: `Only ${X(v)} = ${hq(S.b, f)} works`, mc: MC.boundaryOnly, say: `${hq(S.b, f)} is the boundary; a whole ray of values works too.` },
  ];
  return choose(R, {
    id: `audit-${n}`, family: 'audit', subgoal: sg, board: ineqTex(I),
    prompt: `${who} solved <b>${ineqHtml(I)}</b> and wrote <b>${setHtml(v, pOp, S.b, f)}</b>. ${who} tested ${X(v)} = ${xs}: ${exprHtml(I)} = ${val} there, so the inequality is ${tIn ? 'true' : 'false'}, just as ${who}’s set says. “My answer checks out.” What do you say?`,
    solution: [...solveLines(I), `Tests that settle it: the boundary ${hq(S.b, f)} and one value on each side.`],
    picture: { kind: 'set', b: qNum(S.b), op: S.op, form: f, v, tests: [qNum(S.b) - 2 * qNum(step), qNum(S.b) + 2 * qNum(step)], proposed: { b: qNum(S.b), op: pOp } },
  }, opts);
};

// ---------- 10. the symbolic proof: a < b gives -b < -a, by adding (-a - b) ----------
const proofStep: Gen = (R, n, sg = 'justify-reversal-general') => {
  const u = R();
  if (u < 0.55) {
    // the scaffold with numbers: a + (-a - b) = -b
    const a = nz(R, -9, 9), b = a + int(R, 1, 9), useA = R() < 0.5;
    const base = useA ? a : b, val = useA ? -b : -a;
    const wrongs: Record<number, string | undefined> = { [useA ? b : a]: MC.detached, [base + a + b]: MC.detached };
    return {
      id: `proofStep-${n}`, family: 'proofStep', subgoal: sg, input: 'num',
      prompt: `To prove the reversal, you add <b>(&minus;<i>a</i> &minus; <i>b</i>)</b> to both sides of <i>a</i> &lt; <i>b</i>. Try it with <i>a</i> = ${H(a)} and <i>b</i> = ${H(b)}: what is <b>${H(base)} + (&minus;${par(a)} &minus; ${par(b)})</b>?`,
      board: `${base} + (-${parT(a)} - ${parT(b)}) = \\,?`,
      solution: [`&minus;${par(a)} &minus; ${par(b)} = ${H(-a - b)}.`, `${H(base)} + ${par(-a - b)} = <b class="s">${H(val)}</b>: that is &minus;${useA ? '<i>b</i>' : '<i>a</i>'}, the opposite of ${useA ? '<i>b</i>' : '<i>a</i>'}.`],
      answer: { kind: 'num', v: val },
      check(r: Response): Verdict {
        if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
        if (r.v === val) return { ok: true, say: `Yes: ${H(val)}, the opposite of ${useA ? '<i>b</i>' : '<i>a</i>'}. Adding (&minus;<i>a</i> &minus; <i>b</i>) turns ${useA ? '<i>a</i> into &minus;<i>b</i>' : '<i>b</i> into &minus;<i>a</i>'}.` };
        return { ok: false, mc: wrongs[r.v], say: `Keep every minus sign with its number: &minus;${par(a)} &minus; ${par(b)} = ${H(-a - b)}, then add ${H(base)}.` };
      },
    };
  }
  const which = pick(R, ['a', 'b', 'end'] as const);
  const lt = (s: string) => `<i>${s}</i>`;
  const opts: Opt[] = which === 'end' ? [
    { html: `&minus;${lt('b')} &lt; &minus;${lt('a')}`, ok: true, say: `Yes: the left side became &minus;${lt('b')} and the right side &minus;${lt('a')}, and adding keeps the order.` },
    { html: `&minus;${lt('a')} &lt; &minus;${lt('b')}`, mc: MC.noRev, say: `Look at which side became what: ${lt('a')} + (&minus;${lt('a')} &minus; ${lt('b')}) = &minus;${lt('b')}, on the LEFT.` },
    { html: `${lt('b')} &lt; ${lt('a')}`, mc: MC.detached, say: 'The minus signs stay with their letters: the sides are &minus;b and &minus;a.' },
  ] : [
    { html: `&minus;${lt(which === 'a' ? 'b' : 'a')}`, ok: true, say: `Yes: ${lt(which)} and &minus;${lt(which)} cancel, and &minus;${lt(which === 'a' ? 'b' : 'a')} is left.` },
    { html: lt(which === 'a' ? 'b' : 'a'), mc: MC.detached, say: `The minus sign belongs to its letter: &minus;${lt(which === 'a' ? 'b' : 'a')} stays negative.` },
    { html: `&minus;${lt(which)}`, say: `${lt(which)} + (&minus;${lt(which)}) = 0: those two cancel.` },
    { html: `2${lt(which)} &minus; ${lt(which === 'a' ? 'b' : 'a')}`, mc: MC.detached, say: `&minus;${lt(which)} is negative: ${lt(which)} + (&minus;${lt(which)}) = 0, not 2${lt(which)}.` },
  ];
  return choose(R, {
    id: `proofStep-${n}`, family: 'proofStep', subgoal: sg,
    prompt: which === 'end' ? `Add (&minus;${lt('a')} &minus; ${lt('b')}) to both sides of ${lt('a')} &lt; ${lt('b')}. The order stays (adding never turns it). What do you get?`
      : `Proof step: add (&minus;${lt('a')} &minus; ${lt('b')}) to both sides of ${lt('a')} &lt; ${lt('b')}. What is <b>${lt(which)} + (&minus;${lt('a')} &minus; ${lt('b')})</b>?`,
    board: which === 'end' ? 'a + (-a - b) \\;<\\; b + (-a - b)' : `${which} + (-a - b) = \\,?`,
    solution: [`${lt('a')} + (&minus;${lt('a')} &minus; ${lt('b')}) = &minus;${lt('b')}, and ${lt('b')} + (&minus;${lt('a')} &minus; ${lt('b')}) = &minus;${lt('a')}.`, `Adding the same number keeps the order, so ${lt('a')} &lt; ${lt('b')} gives <b class="s">&minus;${lt('b')} &lt; &minus;${lt('a')}</b>: multiplying by &minus;1 reverses.`],
  }, opts);
};
const proofWhy: Gen = (R, n, sg = 'justify-reversal-general') => {
  const a = nz(R, -6, 6), b = a + int(R, 1, 6), c = nz(R, -8, 3), d = c + int(R, 1, 7), k = pick(R, [2, 3, 4, 5, 6]);
  const claim = R() < 0.5 ? 'minus' : 'neg';
  const lt = (s: string) => `<i>${s}</i>`;
  const opts: Opt[] = claim === 'minus' ? [
    { html: `Add (&minus;${lt('a')} &minus; ${lt('b')}) to both sides. Adding keeps the order, and the sides become &minus;${lt('b')} and &minus;${lt('a')}.`, ok: true, say: 'Yes: it works for every pair, because it only uses "adding keeps the order".' },
    { html: `${lt('a')} = ${H(a)}, ${lt('b')} = ${H(b)} gives ${H(-b)} &lt; ${H(-a)}, and ${lt('a')} = ${H(c)}, ${lt('b')} = ${H(d)} gives ${H(-d)} &lt; ${H(-c)}. It always works.`, mc: MC.examples, say: 'Two examples are not a proof: the claim is about EVERY pair of numbers.' },
    { html: 'Multiplying by a negative flips the symbol. That is the rule.', mc: MC.ruleJust, say: 'That repeats the rule you are asked to prove. A proof says WHY.' },
    { html: `&minus;${lt('a')} and &minus;${lt('b')} are negative, so the bigger one is smaller.`, mc: undefined, say: `&minus;${lt('a')} is not always negative: if ${lt('a')} is negative, &minus;${lt('a')} is positive.` },
  ] : [
    { html: `&minus;${k} = &minus;1 × ${k}. × ${k} keeps the order (positive), and × (&minus;1) reverses it (add &minus;${lt('a')} &minus; ${lt('b')} to both sides). So × (&minus;${k}) reverses it.`, ok: true, say: 'Yes: a negative factor is a positive scale and a reflection, and only the reflection turns the order.' },
    { html: `${H(a)} &lt; ${H(b)} gives ${H(-k * a)} &gt; ${H(-k * b)}. One example shows it.`, mc: MC.examples, say: 'One example cannot cover every pair of numbers.' },
    { html: `Only × (&minus;1) is a mirror; × (&minus;${k}) is just a bigger number, so the order stays.`, mc: MC.special, say: `× (&minus;${k}) is × (&minus;1) and then × ${k}: it mirrors too.` },
    { html: 'Negative times anything turns the symbol: that is the rule.', mc: MC.ruleJust, say: 'Naming the rule is not a reason for it.' },
  ];
  return choose(R, {
    id: `proofWhy-${n}`, family: 'proofWhy', subgoal: sg,
    prompt: claim === 'minus' ? `Which argument <b>proves</b> that ${lt('a')} &lt; ${lt('b')} always gives &minus;${lt('b')} &lt; &minus;${lt('a')}?` : `Which argument <b>proves</b> that multiplying both sides by &minus;${k} turns the symbol, for every pair of numbers?`,
    board: claim === 'minus' ? 'a < b \\;\\Rightarrow\\; -b < -a' : `a < b \\;\\Rightarrow\\; -${k}a > -${k}b`,
    solution: ['A proof must work for every number, so it uses letters and a property that is already known (adding keeps the order).', `${lt('a')} + (&minus;${lt('a')} &minus; ${lt('b')}) &lt; ${lt('b')} + (&minus;${lt('a')} &minus; ${lt('b')}) is &minus;${lt('b')} &lt; &minus;${lt('a')}.`],
  }, opts);
};

// ---------- 11-14. stories ----------
interface Story {
  /** fixed amount q, rate p (per unit of x), the bound r, the symbol (expr op r) */
  q: number; p: number; r: number; op: Op;
  v: string; unit: string; units: string; money: boolean;
  /** the story; {B} is the bound phrase ("at most $180"), the question at the end */
  text: string; ask: string;
  /** what the variable counts: whole numbers only, a nonnegative amount, or any number (temperatures) */
  domain: 'count' | 'nonneg' | 'all';
}
const PHRASE: Record<Op, string[]> = { '<=': ['at most', 'no more than', 'up to'], '>=': ['at least', 'no less than'], '<': ['less than', 'under', 'below'], '>': ['more than', 'over', 'above'] };
const phrase = (R: () => number, o: Op) => pick(R, PHRASE[o]);
const money = (v: number) => (Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);
function storyFor_(R: () => number): Story {
  const k = int(R, 0, 6);
  if (k === 0) { const q0 = pick(R, [35, 40, 45, 50, 60]), p = pick(R, [20, 25, 30, 40]), r = q0 + p * int(R, 3, 6) + pick(R, [0, 10, 15]); const op: Op = pick(R, ['<=', '<']); return { q: q0, p, r, op, v: 'h', unit: 'hour', units: 'hours', money: true, text: `A plumber charges a ${money(q0)} visit fee plus ${money(p)} per hour (billed by the minute). You can spend {B} ${money(r)}.`, ask: 'How many hours can the job take?', domain: 'nonneg' }; }
  if (k === 1) { const q0 = pick(R, [40, 50, 60, 75]), p = pick(R, [3, 4, 6, 8]), r = q0 + p * int(R, 10, 25) + pick(R, [0, 1, 2]); const op: Op = pick(R, ['>=', '>']); return { q: q0, p, r, op, v: 's', unit: 'sale', units: 'sales', money: true, text: `Kai earns ${money(q0)} a week plus ${money(p)} for every sale. Kai wants to earn {B} ${money(r)} this week.`, ask: 'How many sales does Kai need?', domain: 'count' }; }
  if (k === 2) { const q0 = pick(R, [60, 85, 120, 45]), p = pick(R, [15, 12, 20, 25]), r = q0 + p * int(R, 5, 12) + pick(R, [0, 5, 7]); const op: Op = pick(R, ['>', '>=']); return { q: q0, p, r, op, v: 'w', unit: 'week', units: 'weeks', money: true, text: `Rosa has ${money(q0)} saved and adds ${money(p)} every week. She wants {B} ${money(r)} for a new bike.`, ask: 'After how many weeks?', domain: 'count' }; }
  if (k === 3) { const q0 = pick(R, [150, 160, 180, 200]), p = pick(R, [40, 45, 50, 60]), r = q0 + p * int(R, 20, 35) + pick(R, [0, 10, 25]); const op: Op = pick(R, ['<=', '<']); return { q: q0, p, r, op, v: 'b', unit: 'box', units: 'boxes', money: false, text: `An elevator can carry {B} ${r} lb. The operator weighs ${q0} lb, and each box weighs ${p} lb.`, ask: 'How many boxes can go up in one trip?', domain: 'count' }; }
  if (k === 4) { const q0 = pick(R, [10, 12, 15, 18]), p = pick(R, [4, 5, 6, 7.5]), r = q0 + p * int(R, 3, 8); const op: Op = pick(R, ['<=', '<']); return { q: q0, p, r, op, v: 'h', unit: 'hour', units: 'hours', money: true, text: `A bike rental costs ${money(q0)} plus ${money(p)} per hour (charged by the minute). You have {B} ${money(r)} to spend.`, ask: 'How long can you ride?', domain: 'nonneg' }; }
  if (k === 5) { const q0 = pick(R, [-20, -15, -12, -8]), p = pick(R, [3, 4, 5, 6]), r = q0 + p * int(R, 4, 9); const op: Op = pick(R, ['>', '>=']); return { q: q0, p, r, op, v: 'h', unit: 'hour', units: 'hours', money: false, text: `At midnight it is ${H(q0)} °F, and the temperature rises ${p} °F every hour. The ice road closes once it is {B} ${r} °F.`, ask: 'After how many hours is the road closed?', domain: 'nonneg' }; }
  const q0 = pick(R, [32, 50, 41]), p = 1.8, cc = -int(R, 5, 25) * 5 / 5, r = round3(q0 === 32 ? 1.8 * cc + 32 : 1.8 * cc + 32); const op: Op = pick(R, ['<', '<=']);
  void q0;
  return { q: 32, p, r, op, v: 'C', unit: 'degree Celsius', units: '°C', money: false, text: `Fahrenheit is 1.8 times the Celsius temperature, plus 32. A freezer must stay {B} ${num(r)} °F.`, ask: 'Which Celsius temperatures work?', domain: 'all' };
}
const sIneq = (s: Story, op = s.op): Ineq => ({ kind: 'lin', p: dq(s.p), q: dq(s.q), r: dq(s.r), op, side: 'L', qFirst: true, form: 'dec', v: s.v });
const sText = (R: () => number, s: Story) => s.text.replace('{B}', `<b>${phrase(R, s.op)}</b>`);
const qFirstHtml = (s: Story, p = s.p) => `${H(s.q, 'dec')} ${p < 0 ? '&minus;' : '+'} ${H(Math.abs(p), 'dec')}${X(s.v)}`;
const writeIneq: Gen = (R, n, sg = 'inequality-context') => {
  const s = storyFor_(R), I = sIneq(s);
  const e = qFirstHtml(s), r = H(s.r, 'dec');
  const opts: Opt[] = [
    { html: `${e} ${OP_HTML[s.op]} ${r}`, ok: true, say: `Yes: the total is ${e}, and “${PHRASE[s.op][0]}” is ${OP_HTML[s.op]}.` },
    { html: `${e} ${OP_HTML[toggleEq(s.op)]} ${r}`, mc: MC.phrase, say: `“${PHRASE[s.op][0]}” ${isStrict(s.op) ? 'leaves the bound itself out' : 'includes the bound itself'}: ${OP_HTML[s.op]}.` },
    { html: `${e} = ${r}`, mc: MC.eqForBound, say: 'The story gives a limit, not an exact amount: an inequality.' },
    { html: `${H(s.p, 'dec')}${X(s.v)} ${OP_HTML[s.op]} ${r}`, mc: MC.dropsStart, say: `That leaves out the ${s.money ? 'fixed ' + money(s.q) : 'starting ' + num(s.q)}: the total starts there.` },
  ];
  return choose(R, {
    id: `writeIneq-${n}`, family: 'writeIneq', subgoal: sg, board: `${s.v} = \\text{${s.units === '°C' ? 'degrees Celsius' : s.units}}`,
    prompt: `${sText(R, s)} Let ${X(s.v)} be the number of ${s.units === '°C' ? 'degrees Celsius' : s.units}. Which inequality fits?`,
    solution: [`${s.units === '°C' ? 'The temperature in °F' : 'The total'}: ${e}.`, `“${PHRASE[s.op][0]}” means ${OP_HTML[s.op]}: <b class="s">${ineqHtml(I)}</b>.`],
  }, opts);
};
const contextSolve: Gen = (R, n, sg = 'inequality-context') => {
  let s = storyFor_(R);
  while (s.domain === 'count') s = storyFor_(R);
  const I = sIneq(s), S = solve(I), b = qNum(S.b), v = s.v;
  const B = H(b, 'dec'), opH = OP_HTML[S.op];
  const opts: Opt[] = s.domain === 'all' ? [
    { html: `${X(v)} ${opH} ${B}`, ok: true, say: `Right: every temperature ${S.op === '<' ? 'below' : 'at or below'} ${B} °C works, and temperatures can be negative.` },
    { html: 'None: a temperature cannot be negative', mc: MC.negReject, say: 'Temperatures below 0 °C are real (a freezer is colder than that). Negative answers are fine here.' },
    { html: `${X(v)} ${OP_HTML[flip(S.op)]} ${B}`, mc: MC.anyNeg, say: '1.8 is positive: the symbol stays. Test a temperature to see which side works.' },
    { html: `${X(v)} = ${B}`, mc: MC.boundaryOnly, say: `${B} °C is only the boundary.` },
  ] : [
    { html: `0 ≤ ${X(v)} ${opH} ${B}`, ok: true, say: `Right: ${X(v)} ${opH} ${B}, and the ${s.units} cannot be negative.` },
    { html: `${X(v)} ${opH} ${B}`, mc: MC.domainAll, say: `${X(v)} counts ${s.units}: it cannot be negative. Start at 0.` },
    { html: `${X(v)} = ${B}`, mc: MC.boundaryOnly, say: `${B} is only the boundary: shorter times work too.` },
    { html: `${X(v)} ${OP_HTML[flip(S.op)]} ${B}`, mc: qSign(I.q) < 0 ? MC.anyNeg : MC.revAdd, say: 'Every move here keeps the order: test a value on each side.' },
  ];
  if (s.domain === 'nonneg' && s.op.startsWith('>')) {
    // rising temperatures / growth: the set is already above a positive boundary, no extra limit
    opts[0] = { html: `${X(v)} ${opH} ${B}`, ok: true, say: `Right: ${X(v)} ${opH} ${B} (and those times are all positive).` };
    opts[1] = { html: `0 ≤ ${X(v)} ${OP_HTML[flip(S.op)]} ${B}`, mc: MC.noRev, say: 'Test a later time: it is warmer, so the set goes up from the boundary.' };
  }
  return choose(R, {
    id: `contextSolve-${n}`, family: 'contextSolve', subgoal: sg, board: ineqTex(I),
    prompt: `${sText(R, s)} ${s.ask} The inequality is <b>${ineqHtml(I)}</b>. Which describes every answer that makes sense?`,
    solution: [...solveLines(I).slice(0, 2), s.domain === 'all' ? 'Celsius temperatures can be negative: nothing else limits the answer.' : s.op.startsWith('>') ? 'These times are all positive already.' : `${X(v)} counts ${s.units}, so also ${X(v)} ≥ 0.`],
  }, opts);
};
const wholeCount: Gen = (R, n, sg = 'discrete-domain') => {
  let s = storyFor_(R), I = sIneq(s), S = solve(I);
  // a boundary that is not whole (rounding to the nearest would be wrong), or a whole one with a strict symbol
  for (let t = 0; t < 60; t++) {
    s = storyFor_(R); I = sIneq(s); S = solve(I);
    if (s.domain !== 'count') continue;
    const b = qNum(S.b), up = dirOf(S.op) > 0, fl = Math.floor(b), fr0 = b - fl;
    if (Number.isInteger(b) && isStrict(S.op)) break;
    if (!Number.isInteger(b) && fr0 > 0.05 && ((up && fr0 < 0.5) || (!up && fr0 > 0.5))) break;
  }
  const b = qNum(S.b), up = dirOf(S.op) > 0;
  const ans = up ? (Number.isInteger(b) ? (isStrict(S.op) ? b + 1 : b) : Math.ceil(b)) : Number.isInteger(b) ? (isStrict(S.op) ? b - 1 : b) : Math.floor(b);
  const near_ = Math.round(b), bound = round3(b);
  const askWord = up ? 'fewest' : 'most';
  return {
    id: `wholeCount-${n}`, family: 'wholeCount', subgoal: sg, input: 'num', unit: s.units,
    prompt: `${sText(R, s)} The inequality is <b>${ineqHtml(I)}</b>. What is the <b>${askWord}</b> number of ${s.units}?`,
    board: ineqTex(I),
    solution: [...solveLines(I).slice(0, 2), `${X(s.v)} counts ${s.units}: whole numbers only. The ${askWord} whole number ${up ? (isStrict(S.op) ? 'above' : 'at or above') : isStrict(S.op) ? 'below' : 'at or below'} ${H(bound, 'dec')} is <b class="s">${ans}</b>.`],
    answer: { kind: 'num', v: ans },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a whole number.' };
      if (r.v === ans) return { ok: true, say: `Right: ${ans} ${s.units}. ${up ? 'One fewer would not be enough.' : 'One more would break the limit.'}` };
      if (!Number.isInteger(r.v) && Math.abs(r.v - b) < 0.02) return { ok: false, mc: MC.fracCount, say: `${H(bound, 'dec')} is the boundary, but you cannot have part of a ${s.unit}. Pick a whole number that works.` };
      if (r.v === near_ && near_ !== ans) return { ok: false, mc: MC.roundNearest, say: `Rounding to the nearest gives ${near_}, but ${near_} ${s.units} ${up ? 'is not enough' : 'breaks the limit'}. Round ${up ? 'up' : 'down'} here.` };
      if (r.v === b && isStrict(S.op)) return { ok: false, mc: MC.strictIncl, say: `“${PHRASE[s.op][0]}” leaves ${b} itself out.` };
      return { ok: false, say: `Solve ${ineqHtml(I)} first, then pick the ${askWord} whole number that works.` };
    },
  };
};
interface Model { html: string; tex: string }
const chooseModel: Gen = (R, n, sg = 'choose-equation-or-inequality') => {
  const kind = pick(R, ['exact', 'bound', 'onestep', 'groups'] as const);
  const v = pick(R, ['x', 'n', 'h', 'p']);
  const x = X(v);
  if (kind === 'groups') {
    const g = int(R, 3, 6), a = int(R, 2, 4), tot = g * (a + int(R, 3, 7)) + pick(R, [0, 2]), op: Op = pick(R, ['>=', '<=', '<', '>']);
    const opts: Opt[] = [
      { html: `${g}(${x} + ${a}) ${OP_HTML[op]} ${tot}`, ok: true, say: `Yes: ${g} bags, each with ${a} apples and ${x} pears: ${g}(${x} + ${a}).` },
      { html: `${g}${x} + ${a} ${OP_HTML[op]} ${tot}`, mc: MC.partialDist, say: `Each of the ${g} bags has ${a} apples: that is ${g} × ${a}, not just ${a}.` },
      { html: `${g}(${x} + ${a}) = ${tot}`, mc: MC.eqForBound, say: `“${PHRASE[op][0]}” is a limit, not an exact amount.` },
      { html: `${g}(${x} + ${a}) ${OP_HTML[toggleEq(op)]} ${tot}`, mc: MC.phrase, say: `“${PHRASE[op][0]}” is ${OP_HTML[op]}.` },
    ];
    return choose(R, { id: `chooseModel-${n}`, family: 'chooseModel', subgoal: sg, board: `${v} = \\text{pears per bag}`, prompt: `${g} bags each hold ${a} apples and ${x} pears. Together they hold <b>${phrase(R, op)} ${tot}</b> pieces of fruit. Which model fits?`, solution: [`One bag: ${x} + ${a}. ${g} bags: ${g}(${x} + ${a}).`, `“${PHRASE[op][0]}”: ${OP_HTML[op]}. <b class="s">${g}(${x} + ${a}) ${OP_HTML[op]} ${tot}</b>.`] }, opts);
  }
  const fee = pick(R, [5, 8, 10, 12, 15]), rate = pick(R, [3, 4, 6, 2.5]), tot = fee + rate * int(R, 3, 9) + pick(R, [0, 1]), op: Op = pick(R, ['<=', '>=', '<', '>']);
  const extra = pick(R, ['', ` The park opens at 9 a.m.`, ` There are 4 friends in the group.`]);
  const e2 = `${H(fee, 'dec')} + ${H(rate, 'dec')}${x}`, e1 = `${H(rate, 'dec')}${x}`;
  const R0 = money(tot);
  if (kind === 'exact') {
    const opts: Opt[] = [
      { html: `${e2} = ${H(tot, 'dec')}`, ok: true, say: 'Yes: Jo paid exactly that, so it is an equation.' },
      { html: `${e2} ≤ ${H(tot, 'dec')}`, say: '“Paid” is an exact amount: an equation, not a limit.' },
      { html: `${e1} = ${H(tot, 'dec')}`, mc: MC.dropsStart, say: `The ${money(fee)} entry is part of the total.` },
      { html: `${e2} ≥ ${H(tot, 'dec')}`, say: '“Paid” is an exact amount: an equation.' },
    ];
    return choose(R, { id: `chooseModel-${n}`, family: 'chooseModel', subgoal: sg, board: `${v} = \\text{rides}`, prompt: `A fair charges ${money(fee)} to get in plus ${money(rate)} per ride.${extra} Jo <b>paid ${R0}</b>. Which model fits (${x} = rides)?`, solution: [`Total: ${e2}. “Paid ${R0}” is exact: <b class="s">${e2} = ${H(tot, 'dec')}</b>.`] }, opts);
  }
  if (kind === 'onestep') {
    const opts: Opt[] = [
      { html: `${e1} ${OP_HTML[op]} ${H(tot, 'dec')}`, ok: true, say: 'Yes: no fixed fee, so it is one step: rate × rides.' },
      { html: `${e2} ${OP_HTML[op]} ${H(tot, 'dec')}`, say: `There is no ${money(fee)} fee in this story.` },
      { html: `${e1} = ${H(tot, 'dec')}`, mc: MC.eqForBound, say: `“${PHRASE[op][0]}” is a limit: an inequality.` },
      { html: `${e1} ${OP_HTML[toggleEq(op)]} ${H(tot, 'dec')}`, mc: MC.phrase, say: `“${PHRASE[op][0]}” is ${OP_HTML[op]}.` },
    ];
    return choose(R, { id: `chooseModel-${n}`, family: 'chooseModel', subgoal: sg, board: `${v} = \\text{rides}`, prompt: `At a free fair, rides cost ${money(rate)} each.${extra} Jo can spend <b>${phrase(R, op)} ${R0}</b>. Which model fits (${x} = rides)?`, solution: [`Cost: ${e1}. “${PHRASE[op][0]}” is ${OP_HTML[op]}: <b class="s">${e1} ${OP_HTML[op]} ${H(tot, 'dec')}</b>.`] }, opts);
  }
  const opts: Opt[] = [
    { html: `${e2} ${OP_HTML[op]} ${H(tot, 'dec')}`, ok: true, say: `Yes: entry plus rides, and “${PHRASE[op][0]}” is ${OP_HTML[op]}.` },
    { html: `${e2} = ${H(tot, 'dec')}`, mc: MC.eqForBound, say: `“${PHRASE[op][0]}” is a limit, not an exact amount.` },
    { html: `${e1} ${OP_HTML[op]} ${H(tot, 'dec')}`, mc: MC.dropsStart, say: `The ${money(fee)} entry is part of the total.` },
    { html: `${e2} ${OP_HTML[toggleEq(op)]} ${H(tot, 'dec')}`, mc: MC.phrase, say: `“${PHRASE[op][0]}” is ${OP_HTML[op]}.` },
  ];
  return choose(R, { id: `chooseModel-${n}`, family: 'chooseModel', subgoal: sg, board: `${v} = \\text{rides}`, prompt: `A fair charges ${money(fee)} to get in plus ${money(rate)} per ride.${extra} Jo can spend <b>${phrase(R, op)} ${R0}</b>. Which model fits (${x} = rides)?`, solution: [`Total: ${e2}. “${PHRASE[op][0]}”: <b class="s">${e2} ${OP_HTML[op]} ${H(tot, 'dec')}</b>.`] }, opts);
};
const storyForF: Gen = (R, n, sg = 'inequality-to-context') => {
  const form = pick(R, ['lin', 'linMinus', 'qFirst', 'grp'] as const), op = pick(R, OPS);
  const p = int(R, 2, 6), c = p + int(R, 1, 9), r = int(R, 20, 60);
  const ph = PHRASE[op][0]!, phWrong = PHRASE[toggleEq(op)][0]!;
  let ineq = '', right = '', swapped = '', exact = '', wrongPh = '', itex = '';
  if (form === 'grp') {
    ineq = `${p}(${X()} + ${c}) ${OP_HTML[op]} ${r}`; itex = `${p}(x + ${c}) ${OP_TEX[op]} ${r}`;
    const S = (w: string) => `${p} friends each buy one ${c}-dollar ticket and ${X()} dollars of snacks. Together they spend ${w} $${r}.`;
    right = S(ph); wrongPh = S(phWrong); exact = `${p} friends each buy one ${c}-dollar ticket and ${X()} dollars of snacks. Together they spend exactly $${r}.`;
    swapped = `${c} friends each buy one ${p}-dollar ticket and ${X()} dollars of snacks. Together they spend ${ph} $${r}.`;
  } else {
    const minus = form === 'linMinus';
    ineq = form === 'qFirst' ? `${c} + ${p}${X()} ${OP_HTML[op]} ${r}` : `${p}${X()} ${minus ? '&minus;' : '+'} ${c} ${OP_HTML[op]} ${r}`;
    itex = form === 'qFirst' ? `${c} + ${p}x ${OP_TEX[op]} ${r}` : `${p}x ${minus ? '-' : '+'} ${c} ${OP_TEX[op]} ${r}`;
    const S = (w: string, pp: number, cc: number) => minus ? `A club sells ${X()} shirts for $${pp} each and pays a $${cc} printing fee. The profit is ${w} $${r}.` : `A gym charges a $${cc} sign-up fee plus $${pp} per class. Lin takes ${X()} classes and spends ${w} $${r}.`;
    right = S(ph, p, c); wrongPh = S(phWrong, p, c); swapped = S(ph, c, p);
    exact = minus ? `A club sells ${X()} shirts for $${p} each and pays a $${c} printing fee. The profit is exactly $${r}.` : `A gym charges a $${c} sign-up fee plus $${p} per class. Lin takes ${X()} classes and spends exactly $${r}.`;
  }
  const opts: Opt[] = [
    { html: right, ok: true, say: `Yes: every number has its role, and “${ph}” is ${OP_HTML[op]}.` },
    { html: wrongPh, mc: MC.phrase, say: `“${phWrong}” is ${OP_HTML[toggleEq(op)]}, not ${OP_HTML[op]}.` },
    { html: exact, mc: MC.eqForBound, say: '“Exactly” is an equation. The inequality allows a whole range.' },
    { html: swapped, say: `The numbers swapped roles: ${form === 'grp' ? `${p} is the number of friends` : `${p} goes with ${X()}, once per ${form === 'linMinus' ? 'shirt' : 'class'}`}.` },
  ];
  return choose(R, {
    id: `storyFor-${n}`, family: 'storyFor', subgoal: sg, board: itex,
    prompt: `Which story does <b>${ineq}</b> fit?`,
    solution: [`Match every number to the story: ${form === 'grp' ? `${p} groups of (${X()} + ${c})` : form === 'linMinus' ? `${p} per shirt, minus the ${c} fee` : `${c} once, plus ${p} for each`}.`, `${OP_HTML[op]} is “${ph}”.`],
  }, opts);
};
const domainFor: Gen = (R, n, sg = 'inequality-to-context') => {
  const cont = R() < 0.35;
  const p = int(R, 2, 6), c = int(R, 2, 12), k = int(R, 3, 9), op: Op = pick(R, ['<', '<=']);
  const r = p * k + c + (op === '<' ? 0 : int(R, 0, p - 1));
  const I: Ineq = { kind: 'lin', p: q(p), q: q(c), r: q(r), op, side: 'L', qFirst: false, form: 'dec', v: cont ? 'h' : 'x' };
  const S = solve(I), b = qNum(S.b), B = hq(S.b, 'frac');
  const top = Number.isInteger(b) && isStrict(op) ? b - 1 : Math.floor(b);
  const v = I.v;
  const opts: Opt[] = cont ? [
    { html: `Every ${X(v)} with 0 ≤ ${X(v)} ${OP_HTML[S.op]} ${B}`, ok: true, say: 'Right: time can be any amount, but not negative.' },
    { html: `Every ${X(v)} ${OP_HTML[S.op]} ${B}, including negatives`, mc: MC.domainAll, say: 'A negative number of hours makes no sense here.' },
    { html: `Only ${B}`, mc: MC.boundaryOnly, say: `${B} is the boundary; shorter times work too.` },
    { html: `Only 0, 1, 2, …, ${Math.floor(b)}`, say: 'Parking is charged by the minute: parts of an hour count too.' },
  ] : [
    { html: `0, 1, 2, …, ${top}`, ok: true, say: `Right: whole numbers of tickets, from 0 up to ${top}.` },
    { html: `Every number ${OP_HTML[S.op]} ${B}`, mc: MC.fracCount, say: 'You cannot buy part of a ticket, or a negative number of them.' },
    { html: `Only ${top}`, mc: MC.boundaryOnly, say: `${top} is the most, but fewer tickets work too.` },
    { html: `0, 1, 2, …, ${top + 1}`, mc: Number.isInteger(b) ? (isStrict(S.op) ? MC.strictIncl : undefined) : b - Math.floor(b) >= 0.5 ? MC.roundNearest : undefined, say: `Check ${top + 1}: ${p}(${top + 1}) + ${c} = ${p * (top + 1) + c}, which breaks the limit.` },
  ];
  return choose(R, {
    id: `domainFor-${n}`, family: 'domainFor', subgoal: sg, board: ineqTex({ ...I, form: 'int' }),
    prompt: cont ? `Parking costs $${c} plus $${p} per hour (by the minute), and you spend <b>${PHRASE[op][0]} $${r}</b>: <b>${ineqHtml({ ...I, form: 'int' })}</b>, ${X(v)} = hours. Which values of ${X(v)} make sense?`
      : `Tickets cost $${p} each plus a $${c} booking fee, and you spend <b>${PHRASE[op][0]} $${r}</b>: <b>${ineqHtml({ ...I, form: 'int' })}</b>, ${X(v)} = tickets. Which values of ${X(v)} make sense?`,
    solution: [...solveLines(I).slice(0, 2), cont ? `Hours can be parts of an hour but not negative: 0 ≤ ${X(v)} ${OP_HTML[S.op]} ${B}.` : `Tickets come in whole numbers from 0: <b class="s">0, 1, …, ${top}</b>.`],
  }, opts);
};
const solveShift: Gen = (R, n, sg = 'order-preserve-translation') => {
  const qq = nz(R, -12, 12), b = int(R, -9, 9), op = pick(R, OPS), v = pick(R, VARS);
  const I: Ineq = { kind: 'lin', p: q(1), q: q(qq), r: q(b + qq), op, side: R() < 0.2 ? 'R' : 'L', qFirst: R() < 0.3, form: 'int', v };
  const S = solve(I), negShown = qq < 0 || b + qq < 0;
  const opts: Opt[] = uniq([
    { html: setHtml(v, S.op, S.b), ok: true, say: `Right: ${qq > 0 ? `subtract ${qq}` : `add ${-qq}`} on both sides; adding or subtracting never turns the symbol.` },
    { html: setHtml(v, flip(S.op), S.b), mc: I.side === 'R' ? MC.sideSwap : negShown ? MC.anyNeg : MC.revAdd, say: I.side === 'R' ? 'Read it from the variable: swapping the sides turns the symbol.' : 'Adding or subtracting slides both sides together: the symbol stays, even with negatives.' },
    { html: setHtml(v, S.op, q(b + 2 * qq)), mc: MC.detached, say: `Undo the ${qq > 0 ? '+ ' + qq : '&minus; ' + -qq}: do the opposite, ${qq > 0 ? `subtract ${qq}` : `add ${-qq}`}.` },
    { html: `${X(v)} = ${H(b)}`, mc: MC.boundaryOnly, say: `${H(b)} is the boundary; a whole ray works.` },
    { html: setHtml(v, S.op, q(b + 1)), say: 'Check the arithmetic.' },
  ], 4);
  return choose(R, {
    id: `solveShift-${n}`, family: 'solveShift', subgoal: sg, board: ineqTex(I),
    prompt: `Solve <b>${ineqHtml(I)}</b>.`,
    solution: [`${qq > 0 ? `Subtract ${qq} from` : `Add ${-qq} to`} both sides: every number slides the same way, so the symbol stays.`, `<b class="s">${setHtml(v, S.op, S.b)}</b>.`],
    picture: { kind: 'set', b, op: S.op, form: 'int', v, tests: [b - 2, b + 2] },
  }, opts);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  pickSet, testPoint, shift, solveShift, scale, mirror, keepOrFlip, negScale, divNeg,
  solve: solveF, firstMove, revWhen, audit, proofStep, proofWhy,
  writeIneq, contextSolve, wholeCount, chooseModel, storyFor: storyForF, domainFor,
};
/** for tests: the misconception a wrong solution set of a solve item gets */
export function classifySet(I: Ineq, op: Op, b: Q): string | undefined {
  const S = solve(I);
  if (qSame(b, S.b) && op === S.op) return undefined;
  if (qSame(b, S.b) && op === flip(S.op)) return S.reversed ? MC.noRev : I.side === 'R' ? MC.sideSwap : MC.anyNeg;
  if (qSame(b, S.b) && S.reversed && op === toggleEq(S.op)) return MC.flipIncl;
  return undefined;
}
export { holds, satisfies };
