// items.ts: practice families for "Solving linear equations and inequalities" (Algebra 1, secondary-t6-07).
// Every family is generated from templates, checked exactly (sets.ts), and every wrong answer it can recognise
// carries a misconception id from math-curriculum-essentials/misconceptions.json. A generator gets the sub-goal it
// practises (plan.ts). Answers that are expressions or sets are asked as choices among forms that differ by one
// typical slip; numbers are typed. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { picFits } from './pictures';
import {
  type Lin, type Rel, type SSet, ALL, EMPTY, L, at, coefH, coefT, flip, holds, inter, linH, linT, member, mirror, nH, nT, near,
  otherStrict, point, ray, relH, relT, setH, setT, sgH, sgT, solve, solveChain, strictOf, terminates, union,
} from './sets';

// ---------- pictures ----------
export interface PicRow { key: string; name?: string; name2?: string; set?: SSet; role?: 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'water'; dashed?: boolean; numbers?: 'above' | 'below' | 'none'; shift?: number; show?: boolean }
export interface LinePic {
  rows: PicRow[];
  tests?: { key: string; row: string; v: number; ok?: boolean }[];
  maps?: { key: string; from: string; to: string; vs: number[]; op: { kind: 'add' | 'mul'; by: number } }[];
  /** every value the window must hold */ values: number[];
  /** TeX the board writes when the solve replays (the answer) */ result?: string;
}
export interface SItem extends Item { picture?: { line?: LinePic; lines?: { tex: string[]; hi?: number } } }
type Gen = (R: () => number, n: number, sg?: string) => SItem;

// ---------- misconception ids ----------
export const MC = {
  newSol: 'mc.linear-equations.transformed-equation-new-solution',
  identity: 'mc.linear-equations.equivalent-equation-vs-expression-identity',
  examples: 'mc.reasoning-language.examples-as-proof',
  oneWay: 'mc.linear-equations.reversible-solving-step-treated-as-one-way',
  moveSign: 'mc.linear-equations.move-and-change-sign-justification',
  anySame: 'mc.linear-equations.any-same-operation-preserves',
  revAdd: 'mc.linear-equations.reverses-after-addition-or-subtraction',
  noRev: 'mc.linear-equations.no-reversal-for-negative',
  revAny: 'mc.linear-equations.reverses-for-any-negative-sign',
  incomplete: 'mc.linear-equations.incomplete-step-justification',
  noJust: 'mc.reasoning-language.correct-answer-needs-no-justification',
  onlyConst: 'mc.linear-equations.only-constants-cross',
  zeroNone: 'mc.linear-equations.zero-vs-no-solution',
  noneError: 'mc.linear-equations.no-solution-means-error',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  oneOcc: 'mc.linear-equations.isolates-one-occurrence',
  nonzero: 'mc.linear-equations.omits-nonzero-divisor-condition',
  everySymbol: 'mc.expressions.treats-every-symbol-as-unsolved-unknown',
  wrongOrder: 'mc.linear-equations.undoes-in-wrong-order',
  endpoint: 'mc.linear-equations.endpoint-style-convention',
  boundaryOnly: 'mc.linear-equations.boundary-only-solution',
  sideSwap: 'mc.linear-equations.side-swap-keeps-symbol',
  everyRay: 'mc.linear-equations.every-inequality-has-boundary-and-ray',
  compPartial: 'mc.linear-equations.compound-partial-transform',
  andOr: 'mc.linear-equations.and-or-confused',
  emptyEnd: 'mc.linear-equations.empty-intersection-as-endpoint',
  oneSym: 'mc.linear-equations.compound-negative-division-one-symbol-reversed',
  orChain: 'mc.linear-equations.or-as-three-part-chain',
  repeatCheck: 'mc.reasoning-language.check-by-repeating-same-steps',
  derivedCheck: 'mc.linear-equations.derived-equation-check-proves-original',
  oneTest: 'mc.linear-equations.one-test-proves-inequality-set',
  roundNear: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  computeOk: 'mc.reasoning-language.computation-guarantees-context-answer',
  // neighbours from the catalogue that name the typical slips of these items
  diffOps: 'mc.linear-equations.different-operations-preserve-equivalence',
  noSignChange: 'mc.linear-equations.moves-term-without-sign-change',
  partialDist: 'mc.properties.partial-distribution',
  signDrop: 'mc.integers.divide-by-coefficient-without-sign',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
  forward: 'mc.sequences-series.forward-op-when-backward',
  partialCoef: 'mc.linear-equations.partial-coefficient-undo',
  inclusion: 'mc.linear-equations.ignores-boundary-inclusion',
  oneCond: 'mc.systems.one-condition-enough',
} as const;

// ---------- helpers ----------
const X = '<i>x</i>';
const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
const xt = (c: number) => `${coefH(c)}${X}`;
const plainNum = (v: number) => nH(v).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2');
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: SItem['picture'] }
function choice(R: () => number, b: Base, opts: Opt[]): SItem {
  const o = shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  return {
    ...b, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, o[i]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say };
    },
  };
}
/** distinct choice texts (drops later duplicates); null when fewer than `min` remain or the right one went */
function distinct(opts: Opt[], min = 3): Opt[] | null {
  const seen = new Set<string>(), out: Opt[] = [];
  for (const o of opts) { const k = o.t.replace(/\s+/g, ' '); if (!seen.has(k)) { seen.add(k); out.push(o); } }
  return out.length >= min && out.some(o => o.ok) ? out : null;
}
type Cand = [number, string | undefined, string];
function numItem(b: Base & { unit?: string }, v: number, okSay: string, cands: Cand[], hint: string): SItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
      if (Math.abs(r.v - v) < 1e-6) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && Math.abs(c - v) > 1e-6 && Math.abs(r.v - c) < 1e-6) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
const eqT = (l: string, r: string, rel: Rel = '=') => `${l} ${relT(rel)} ${r}`;
const eqH = (l: string, r: string, rel: Rel = '=') => `${l} ${relH(rel)} ${r}`;
/** p(x + q) as TeX / HTML */
const grpT = (p: number, q: number) => `${coefT(p)}(x${sgT(q)})`;
const grpH = (p: number, q: number) => `${coefH(p)}(${X}${sgH(q)})`;
const opName = (m: number) => (m > 0 ? `add ${nH(m)} to` : `subtract ${nH(-m)} from`);
const Cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** a nice boundary: an integer, or now and then a half */
const niceV = (R: () => number, lo: number, hi: number, half = 0.2) => (R() < half ? nz(R, lo, hi) + 0.5 : nz(R, lo, hi));
/** the line picture of one inequality: a row x, the set revealed by the solve, and three tests */
function xLine(S: SSet, truth: (x: number) => boolean, result: string, extra: number[] = []): LinePic {
  const e = S.flatMap(I => [I.lo, I.hi]).filter(v => Number.isFinite(v));
  const v = e[0] ?? 0, d = Number.isInteger(v) ? 3 : 1.5;
  const tv = e.length === 1 ? [v - d, v, v + d] : e.length >= 2 ? [e[0]!, (e[0]! + e[1]!) / 2] : [];
  return {
    rows: [{ key: 'x', name: 'x', set: S, role: 'link' }],
    tests: tv.map((t, i) => ({ key: 't' + i, row: 'x', v: t, ok: truth(t) })),
    values: [...e, ...tv, ...extra], result,
  };
}

// =====================================================================================================================
// 1 equiv-solution-set
// =====================================================================================================================
const sameSet: Gen = (R, n) => {
  for (;;) {
    const p = int(R, 2, 6), s = nz(R, -6, 9), q = nz(R, -12, 12), r = p * s + q, k = int(R, 2, 3), m = nz(R, -9, 9);
    const kind = pick(R, ['sub', 'scale', 'add', 'some', 'one', 'some'] as const);
    const E1 = eqT(linT(L(p, q)), nT(r));
    let l2: Lin, r2: Lin, how = '';
    if (kind === 'sub') { l2 = L(p, 0); r2 = L(0, r - q); how = `${q > 0 ? 'subtract' : 'add'} ${Math.abs(q)} on both sides`; }
    else if (kind === 'scale') { l2 = L(k * p, k * q); r2 = L(0, k * r); how = `multiply both sides by ${k}`; }
    else if (kind === 'add') { l2 = L(p, q + m); r2 = L(0, r + m); how = `${opName(m)} both sides`; }
    else if (kind === 'some') { l2 = L(k * p, q); r2 = L(0, k * r); how = `multiply ${coefH(p)}${X} and ${r} by ${k}, but not the ${nH(q)}`; }
    else { l2 = L(p, q + m); r2 = L(0, r); how = `${opName(m)} the left side only`; }
    const E2 = eqT(linT(l2), linT(r2));
    const S2 = solve(l2, '=', r2), t = S2[0]!.lo;
    const equiv = kind === 'sub' || kind === 'scale' || kind === 'add';
    if (!equiv && (near(t, s) || near(t, 0))) continue;
    const pr = `Are <b>${linH(L(p, q))} = ${nH(r)}</b> and <b>${linH(l2)} = ${linH(r2)}</b> equivalent equations (the same solution set)?`;
    const b: Base = { id: `sameSet-${n}`, family: 'sameSet', prompt: pr, board: `${E1} \\qquad ${E2}`, picture: { lines: { tex: [E1, E2] } },
      solution: equiv ? [`The first equation: ${X} = ${nH(s)} is its only solution.`, `The second came from the first when you ${how}: its only solution is ${X} = ${nH(s)} too.`, `The same complete solution set, so they are equivalent.`]
        : [`The first: ${X} = ${nH(s)}.`, `The second (${how}): ${X} = ${nH(t)}.`, `Different solution sets, so they are not equivalent. Agreeing at one value, like ${X} = 0, proves nothing.`] };
    return choice(R, b, equiv ? [
      { t: `Equivalent: both have only the solution ${X} = ${nH(s)}`, ok: true, say: `Yes. Solve both: each has exactly ${X} = ${nH(s)}. Same set, so equivalent.` },
      { t: 'Not equivalent: an equation that changed has a new solution', mc: MC.newSol, say: `A step done to both whole sides keeps the solution set. Solve both: each gives ${X} = ${nH(s)}.` },
      { t: `Not equivalent: neither one is true for every ${X}`, mc: MC.identity, say: `Equivalent equations need the same solution set, not to be true for every ${X}. Both have exactly ${X} = ${nH(s)}.` },
    ] : [
      { t: `Not equivalent: ${X} = ${nH(s)} solves the first, but the second has ${X} = ${nH(t)}`, ok: true, say: `Yes. Different solution sets, so not equivalent.` },
      { t: `Equivalent: both are false at ${X} = 0`, mc: MC.examples, say: `Agreeing at one value proves nothing. Solve both: ${X} = ${nH(s)} and ${X} = ${nH(t)}.` },
      kind === 'some' ? { t: `Equivalent: the second is the first times ${k}`, mc: MC.someTerms, say: `Only some terms were multiplied by ${k}, not the ${nH(q)}. That changes the solution: ${X} = ${nH(t)}.` }
        : { t: `Equivalent: the second is the first with ${nH(Math.abs(m))} ${m > 0 ? 'added' : 'taken away'}`, mc: MC.diffOps, say: `It was done to one side only. That changes the solution: ${X} = ${nH(t)}.` },
    ]);
  }
};
const pickEquiv: Gen = (R, n) => {
  for (;;) {
    const grp = R() < 0.4, p = int(R, 2, 6), q = nz(R, -9, 9), s = nz(R, -6, 8), k = int(R, 2, 4);
    const r = grp ? p * (s + q) : p * s + q;
    const lhsT = grp ? grpT(p, q) : linT(L(p, q)), lhsH = grp ? grpH(p, q) : linH(L(p, q));
    let ok: string, w1: Opt, w2: Opt, okSay: string;
    if (grp) {
      ok = R() < 0.5 ? eqH(linH(L(p, p * q)), nH(r)) : eqH(`${X}${sgH(q)}`, nH(r / p));
      okSay = ok.startsWith(`${X}`) ? `Yes: divide both whole sides by ${p}.` : `Yes: the distributive property rewrites the left side; its value never changes.`;
      w1 = { t: eqH(linH(L(p, q)), nH(r)), mc: MC.partialDist, say: `${p}(${X}${sgH(q)}) means ${p} times BOTH terms: ${linH(L(p, p * q))}.` };
      w2 = { t: eqH(xt(p), nH(r - q)), mc: MC.wrongOrder, say: `The ${nH(q)} is inside the parentheses: it is multiplied by ${p} too. Undo the × ${p} first.` };
    } else {
      const v = pick(R, ['sub', 'scale'] as const);
      ok = v === 'sub' ? eqH(xt(p), nH(r - q)) : eqH(linH(L(k * p, k * q)), nH(k * r));
      okSay = v === 'sub' ? `Yes: ${q > 0 ? 'subtract' : 'add'} ${Math.abs(q)} on both sides.` : `Yes: every term on both sides times ${k}.`;
      w1 = { t: eqH(linH(L(k * p, q)), nH(k * r)), mc: MC.someTerms, say: `Multiplying a side by ${k} multiplies EVERY term on it, the ${nH(q)} too.` };
      w2 = { t: eqH(xt(p), nH(r + q)), mc: MC.noSignChange, say: `${q > 0 ? 'Subtracting' : 'Adding'} ${Math.abs(q)} on the left needs the same on the right: ${nH(r)} ${q > 0 ? '−' : '+'} ${Math.abs(q)}.` };
    }
    const o = distinct([{ t: ok, ok: true, say: okSay }, w1, w2]);
    if (!o) continue;
    const b: Base = { id: `pickEquiv-${n}`, family: 'pickEquiv', prompt: `Which equation has the same solution set as <b>${lhsH} = ${nH(r)}</b>?`, board: eqT(lhsT, nT(r)),
      solution: [`${lhsH} = ${nH(r)} has the solution ${X} = ${nH(s)}.`, `A step done to both whole sides (every term) keeps it; a step on some terms or one side changes it.`] };
    return choice(R, b, o);
  }
};

// =====================================================================================================================
// 2 reversible-ops-preserve
// =====================================================================================================================
interface Step { l1: Lin; r1: number; l2: Lin; r2: number; does: string; undo: string; undoLeft: string; moved: string; kind: 'add' | 'mul' | 'div' }
function aStep(R: () => number): Step {
  const kind = pick(R, ['add', 'add', 'mul', 'div'] as const);
  if (kind === 'div') {
    const k = pick(R, [2, 3, 4, -2, -3]), a = k * nz(R, -4, 4), b = k * nz(R, -6, 6), c = k * nz(R, -8, 8);
    return { kind, l1: L(a, b), r1: c, l2: L(a / k, b / k), r2: c / k, does: `divide both sides by ${nH(k)}`, undo: `multiply both sides by ${nH(k)}`, undoLeft: `multiply the left side by ${nH(k)}`, moved: `the ${nH(k)} moved to the other side as a factor` };
  }
  const a = nz(R, -6, 6), b = nz(R, -9, 9), c = nz(R, -12, 12);
  if (kind === 'mul') {
    const k = pick(R, [2, 3, -1, -2, -3]);
    return { kind, l1: L(a, b), r1: c, l2: L(a * k, b * k), r2: c * k, does: `multiply both sides by ${nH(k)}`, undo: `divide both sides by ${nH(k)}`, undoLeft: `divide the left side by ${nH(k)}`, moved: `the ${nH(k)} moved to the other side as a divisor` };
  }
  const m = nz(R, -9, 9);
  return { kind, l1: L(a, b), r1: c, l2: L(a, b + m), r2: c + m, does: `${opName(m)} both sides`, undo: `${opName(-m)} both sides`, undoLeft: `${opName(-m)} the left side only`, moved: `the ${nH(Math.abs(m))} moved to the other side and changed its sign` };
}
const undoStep: Gen = (R, n) => {
  const s = aStep(R);
  const E1 = eqT(linT(s.l1), nT(s.r1)), E2 = eqT(linT(s.l2), nT(s.r2));
  const b: Base = { id: `undoStep-${n}`, family: 'undoStep', board: `${E1} \\;\\longrightarrow\\; ${E2}`,
    prompt: `Going from <b>${linH(s.l1)} = ${nH(s.r1)}</b> to <b>${linH(s.l2)} = ${nH(s.r2)}</b>, you ${s.does}. Which step takes the second equation back to the first?`,
    picture: { lines: { tex: [E1, `\\downarrow\\ \\text{${s.does.replace(/<[^>]+>/g, '').replace(/−/g, '-')}}`, E2] } },
    solution: [`The step was: ${s.does}.`, `Its opposite, done to both sides, undoes it: ${s.undo}.`, `Every step that can be undone keeps the solution set: no solution lost, none gained.`] };
  return choice(R, b, [
    { t: Cap(s.undo), ok: true, say: `Yes. ${Cap(s.undo)} gives back ${linH(s.l1)} = ${nH(s.r1)}.` },
    { t: 'None: a solving step only goes one way, toward the answer', mc: MC.oneWay, say: `Every step that keeps the solution set can be undone: ${s.undo}.` },
    { t: Cap(s.undoLeft), mc: MC.diffOps, say: 'A step on one side changes the solution set. Undo it on both sides.' },
  ]);
};
const whyKeeps: Gen = (R, n) => {
  if (R() < 0.25) {
    const p = int(R, 2, 6), q = nz(R, -8, 8), r = int(R, -20, 20);
    const s = r / p - q;
    const E1 = eqT(grpT(p, q), nT(r)), E2 = eqT(linT(L(p, p * q)), nT(r));
    const b: Base = { id: `whyKeeps-${n}`, family: 'whyKeeps', board: `${E1} \\;\\longrightarrow\\; ${E2}`, picture: { lines: { tex: [E1, E2] } },
      prompt: `<b>${grpH(p, q)} = ${nH(r)}</b> is rewritten as <b>${linH(L(p, p * q))} = ${nH(r)}</b> with the distributive property. Why does this keep the solution set?`,
      solution: ['The distributive property rewrites one side without changing its value.', `For every ${X}, the left side has the same value as before, so exactly the same numbers make the equation true.`] };
    return choice(R, b, [
      { t: `The left side has the same value as before for every ${X}, so the same numbers make it true`, ok: true, say: 'Yes. A rewrite never changes a side’s value, so the solution set stays.' },
      { t: `Because ${X} = ${nH(s)} makes both lines true`, mc: MC.examples, say: 'One value checks one number. The reason must hold for every number.' },
      { t: 'Because you may change one side however you like', mc: MC.diffOps, say: 'Only a rewrite that keeps the side’s value is safe on one side alone.' },
    ]);
  }
  const s = aStep(R);
  const E1 = eqT(linT(s.l1), nT(s.r1)), E2 = eqT(linT(s.l2), nT(s.r2));
  const sol = solve(s.l1, '=', L(0, s.r1));
  const exTxt = sol.length === 1 && near(sol[0]!.lo, sol[0]!.hi) ? `${X} = ${nH(sol[0]!.lo)}` : `${X} = 0`;
  const b: Base = { id: `whyKeeps-${n}`, family: 'whyKeeps', board: `${E1} \\;\\longrightarrow\\; ${E2}`, picture: { lines: { tex: [E1, E2] } },
    prompt: `Step: ${s.does}. <b>${linH(s.l1)} = ${nH(s.r1)}</b> becomes <b>${linH(s.l2)} = ${nH(s.r2)}</b>. Why does this step keep the solution set?`,
    solution: ['Any solution of the first equation makes the second one true (the same thing was done to two equal numbers).', `And ${s.undo} takes the second back to the first, so no solution is lost or gained.`] };
  return choice(R, b, [
    { t: `A solution of the first solves the second, and the step can be undone (${s.undo}): nothing lost or gained`, ok: true, say: 'Yes. The step can be undone, so both equations have exactly the same solutions.' },
    { t: `Because ${exTxt} makes both lines true`, mc: MC.examples, say: 'One value checks one number. The reason must work for every solution.' },
    { t: `Because ${s.moved}`, mc: MC.moveSign, say: 'That is a shortcut name, not a reason. Say what was done to BOTH sides and that it can be undone.' },
  ]);
};

// =====================================================================================================================
// 3 non-equivalent-steps
// =====================================================================================================================
const badStep: Gen = (R, n) => {
  const m = int(R, 2, 9), k = int(R, 2, 6), c = int(R, -12, 12);
  let j = int(R, 2, 6); if (j === k) j = k + 1;
  const neg = R() < 0.25;
  // the equation the steps act on: k(x + m) = jx + c, or jx − (x − m) = c when the bad step is the minus
  const ET = neg ? eqT(`${j}x - (x - ${m})`, nT(c)) : eqT(grpT(k, m), linT(L(j, c)));
  const EH = neg ? `${j}${X} − (${X} − ${m}) = ${nH(c)}` : `${grpH(k, m)} = ${linH(L(j, c))}`;
  const bad = neg ? { t: `Rewrite −(${X} − ${m}) as −${X} − ${m}`, mc: MC.negFirst, why: `−(${X} − ${m}) is −${X} + ${m}: the minus goes to both terms.` }
    : pick(R, [
      { t: 'Multiply both sides by 0', mc: MC.anySame, why: '× 0 turns the equation into 0 = 0, and it cannot be undone: solutions are gained.' },
      { t: `Divide both sides by ${X}`, mc: MC.anySame, why: `${X} might be 0, and dividing by 0 is not allowed: a solution can be lost (or a false one kept).` },
      { t: `Add ${m} to the left side only`, mc: MC.diffOps, why: 'A step on one side only makes the sides unequal: the solution changes.' },
    ]);
  const goods = shuffle(R, neg ? [`Add ${m} to both sides`, `Subtract ${j}${X} from both sides`, `Rewrite −(${X} − ${m}) as −${X} + ${m}`, `Multiply both sides by −1`]
    : [`Add ${m} to both sides`, `Multiply both sides by −${k}`, `Rewrite ${k}(${X} + ${m}) as ${k}${X} + ${k * m}`, `Subtract ${j}${X} from both sides`]).slice(0, 2);
  const b: Base = { id: `badStep-${n}`, family: 'badStep', board: ET,
    prompt: `You are solving <b>${EH}</b>. Which of these steps can change the solution set?`,
    solution: ['A safe step does the same thing to both whole sides AND can be undone (or rewrites a side without changing its value).', `${bad.t}: ${bad.why}`] };
  return choice(R, b, [
    { t: bad.t, ok: true, say: `Yes. ${bad.why}` },
    ...goods.map(g => ({ t: g, mc: bad.mc, say: `That step can be undone (or keeps a side’s value), so it keeps the solution set. Look again at: ${bad.t.charAt(0).toLowerCase() + bad.t.slice(1)}.` })),
  ]);
};
const lostSolution: Gen = (R, n) => {
  const v = pick(R, ['div', 'zero', 'neg'] as const);
  if (v === 'div') {
    const a = int(R, 2, 9), c = int(R, -9, 9); let bb = int(R, 1, 9); if (bb === a) bb = a + 1;
    const E = eqT(linT(L(a, c)), linT(L(bb, c)));
    const b: Base = { id: `lostSolution-${n}`, family: 'lostSolution', board: E, picture: { lines: { tex: [E, `${a} = ${bb}`] } },
      prompt: `Lee solves <b>${linH(L(a, c))} = ${linH(L(bb, c))}</b>: ${c === 0 ? '' : `${c > 0 ? 'subtract' : 'add'} ${Math.abs(c)} on both sides, then `}divide both sides by ${X}. That gives ${a} = ${bb}, so Lee says “no solution”. What is the solution set?`,
      solution: [`${a}${X} = ${bb}${X} is true at ${X} = 0: both sides are 0.`, `Dividing by ${X} assumed ${X} ≠ 0, so that solution was lost. The set is ${X} = 0.`] };
    return choice(R, b, [
      { t: `${X} = 0: dividing by ${X} lost it`, ok: true, say: `Yes. At ${X} = 0 both sides are ${c}. Dividing by ${X} can’t be done when ${X} = 0.` },
      { t: 'No solution, as Lee says', mc: MC.anySame, say: `Try ${X} = 0: both sides are ${c}. Dividing by ${X} is not safe, because ${X} might be 0.` },
      { t: 'All real numbers', say: `Try ${X} = 1: ${a + c} and ${bb + c} are not equal.` },
    ]);
  }
  if (v === 'zero') {
    const a = nz(R, -9, 9), c = int(R, -12, 12), s = c - a;
    const E = eqT(`x${sgT(a)}`, nT(c));
    const b: Base = { id: `lostSolution-${n}`, family: 'lostSolution', board: E, picture: { lines: { tex: [E, '0 = 0'] } },
      prompt: `Kim multiplies both sides of <b>${X}${sgH(a)} = ${nH(c)}</b> by 0 and gets 0 = 0, so Kim says “all real numbers”. What is the solution set of the original equation?`,
      solution: [`${X}${sgH(a)} = ${nH(c)} has one solution: ${X} = ${nH(s)}.`, '× 0 can’t be undone, so the new equation 0 = 0 gained every other number.'] };
    return choice(R, b, [
      { t: `Only ${X} = ${nH(s)}: multiplying by 0 gained the rest`, ok: true, say: 'Yes. × 0 is not reversible, so 0 = 0 is not equivalent to the original.' },
      { t: 'All real numbers, as Kim says', mc: MC.anySame, say: `Try ${X} = ${nH(s + 1)}: the left side is ${nH(c + 1)}, not ${nH(c)}. × 0 changed the solution set.` },
      { t: 'No solution', say: `${X} = ${nH(s)} works: ${nH(s)}${sgH(a)} = ${nH(c)}.` },
    ]);
  }
  const a = nz(R, -9, 9), c = int(R, -12, 12), s = a - c, w = -a - c;
  const E = eqT(`-(x${sgT(-a)})`, nT(c));
  const b: Base = { id: `lostSolution-${n}`, family: 'lostSolution', board: E, picture: { lines: { tex: [E, eqT(`-x${sgT(-a)}`, nT(c))] } },
    prompt: `Ray rewrites <b>−(${X}${sgH(-a)}) = ${nH(c)}</b> as <b>−${X}${sgH(-a)} = ${nH(c)}</b> and gets ${X} = ${nH(w)}. What is the solution set of the original?`,
    solution: [`−(${X}${sgH(-a)}) means −${X}${sgH(a)}: the minus goes to BOTH terms.`, `−${X}${sgH(a)} = ${nH(c)}, so ${X} = ${nH(s)}.`] };
  return choice(R, b, [
    { t: `${X} = ${nH(s)}: the minus belongs to both terms`, ok: true, say: `Yes. −(${X}${sgH(-a)}) = −${X}${sgH(a)}.` },
    { t: `${X} = ${nH(w)}, as Ray says`, mc: MC.negFirst, say: `Check ${nH(w)} in the original: −(${nH(w)}${sgH(-a)}) is ${nH(-(w - a))}, not ${nH(c)}.` },
    { t: 'All real numbers', say: `Only one number works: ${X} = ${nH(s)}.` },
  ]);
};

// =====================================================================================================================
// 4 order-preserving-ops, 5 negative-scaling-reverses (numbers on a line, maps between two rows)
// =====================================================================================================================
interface NumIneq { a: number; b: number; rel: Rel }
function trueIneq(R: () => number, lo: number, hi: number, mult = 1): NumIneq {
  let a = mult * int(R, lo, hi), b = mult * int(R, lo, hi);
  while (a === b) b = mult * int(R, lo, hi);
  const rel: Rel = a < b ? pick(R, ['<', '<='] as const) : pick(R, ['>', '>='] as const);
  return { a, b, rel };
}
function mapPic(N: NumIneq, op: { kind: 'add' | 'mul'; by: number }, a2: number, b2: number, result: string): LinePic {
  return {
    rows: [
      { key: 'top', name: '\\text{before}', set: union(point(N.a), point(N.b)), role: 'first', numbers: 'above', show: true },
      { key: 'bot', name: '\\text{after}', set: union(point(a2), point(b2)), role: 'link', numbers: 'below' },
    ],
    maps: [{ key: 'm', from: 'top', to: 'bot', vs: [N.a, N.b], op }], values: [N.a, N.b, a2, b2], result,
  };
}
const keepDir: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['add', 'add', 'mul', 'div'] as const);
    const N = trueIneq(R, -9, 9, 1);
    let a2: number, b2: number, does: string, op: { kind: 'add' | 'mul'; by: number };
    if (kind === 'add') { const m = nz(R, -9, 9); a2 = N.a + m; b2 = N.b + m; op = { kind: 'add', by: m }; does = m > 0 ? `Add ${m} to both sides` : pick(R, [`Subtract ${-m} from both sides`, `Add −${-m} to both sides`]); }
    else if (kind === 'mul') { const p = pick(R, [2, 3]); if (Math.abs(N.a) > 6 || Math.abs(N.b) > 6) continue; a2 = N.a * p; b2 = N.b * p; op = { kind: 'mul', by: p }; does = `Multiply both sides by ${p}`; }
    else { const p = pick(R, [2, 3]); if (N.a % p || N.b % p) continue; a2 = N.a / p; b2 = N.b / p; op = { kind: 'mul', by: 1 / p }; does = `Divide both sides by ${p}`; }
    const neg = N.a < 0 || N.b < 0 || a2 < 0 || b2 < 0;
    const o = distinct([
      { t: eqH(nH(a2), nH(b2), N.rel), ok: true, say: `Yes. ${kind === 'add' ? 'Adding or subtracting slides every number the same way' : 'Scaling by a positive number stretches the line'}: the order stays.` },
      { t: eqH(nH(a2), nH(b2), flip(N.rel)), mc: kind === 'add' ? MC.revAdd : neg ? MC.revAny : undefined, say: `Only × or ÷ by a NEGATIVE number turns the order around. Here ${nH(a2)} is still ${N.rel.startsWith('<') ? 'left of' : 'right of'} ${nH(b2)}.` },
      { t: eqH(nH(b2), nH(a2), N.rel), mc: MC.sideSwap, say: `Keep each number on its own side: ${nH(N.a)} becomes ${nH(a2)} on the left, ${nH(N.b)} becomes ${nH(b2)} on the right.` },
    ]);
    if (!o) continue;
    const b: Base = { id: `keepDir-${n}`, family: 'keepDir', board: eqT(nT(N.a), nT(N.b), N.rel), picture: { line: mapPic(N, op, a2, b2, eqT(nT(a2), nT(b2), N.rel)) },
      prompt: `<b>${eqH(nH(N.a), nH(N.b), N.rel)}</b> is true. ${does}. Which statement does this step give?`,
      solution: [`${does}: ${nH(N.a)} becomes ${nH(a2)} and ${nH(N.b)} becomes ${nH(b2)}.`, `${kind === 'add' ? 'Every number slides the same way' : 'Every number is scaled by the same positive number'}, so the order stays: ${eqH(nH(a2), nH(b2), N.rel)}.`] };
    return choice(R, b, o);
  }
};
const stepIneq: Gen = (R, n) => {
  for (;;) {
    const rel = pick(R, ['<', '<=', '>', '>='] as const), add = R() < 0.5;
    let lhsH: string, lhsT: string, v: number, wrongV: number, does: string, c: number;
    if (add) { const k = nz(R, -9, 9); c = nz(R, -12, 8); v = c - k; wrongV = c + k; lhsH = `${X}${sgH(k)}`; lhsT = `x${sgT(k)}`; does = `${k > 0 ? 'subtract' : 'add'} ${Math.abs(k)} on both sides`; }
    else {
      const fracP = R() < 0.4;
      if (fracP) { const [a, d] = pick(R, [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4]] as const); v = nz(R, -6, 6) * a; c = (a / d) * v; if (!Number.isInteger(c)) continue; lhsH = `${fr(a === 1 ? X : a + X, d)}`; lhsT = a === 1 ? `\\dfrac{x}{${d}}` : `\\dfrac{${a}x}{${d}}`; wrongV = c * (a / d); does = `multiply both sides by ${a === 1 ? d : fr(d, a)}`; }
      else { const p = int(R, 2, 6); v = nz(R, -8, 6); c = p * v; lhsH = `${p}${X}`; lhsT = `${p}x`; wrongV = c * p; does = `divide both sides by ${p}`; }
    }
    if (near(wrongV, v) || near(v, 0)) continue;
    const S = ray(rel, v), neg = c < 0 || v < 0;
    const b: Base = { id: `stepIneq-${n}`, family: 'stepIneq', board: eqT(lhsT, nT(c), rel), picture: { line: xLine(S, x => holds(x, rel, v), eqT('x', nT(v), rel)) },
      prompt: `Solve <b>${eqH(lhsH, nH(c), rel)}</b>. Which inequality is equivalent?`,
      solution: [`${Cap(does)}. ${add ? 'Adding or subtracting' : 'Scaling by a positive number'} keeps the direction${neg ? ', even with negative numbers around' : ''}.`, `${X} ${relH(rel)} ${ans(nH(v))}.`] };
    const o = distinct([
      { t: eqH(X, nH(v), rel), ok: true, say: 'Yes. The step keeps the direction.' },
      { t: eqH(X, nH(v), flip(rel)), mc: add ? MC.revAdd : neg ? MC.revAny : undefined, say: `Only × or ÷ by a negative number turns the symbol. ${Cap(does)} keeps it.` },
      { t: eqH(X, nH(wrongV), rel), mc: MC.forward, say: `Undo with the opposite operation: ${does}.` },
    ]);
    if (!o) continue;
    return choice(R, b, o);
  }
};
const flipNum: Gen = (R, n) => {
  for (;;) {
    const N = trueIneq(R, -8, 8, 1);
    const kind = pick(R, ['mul', 'mul', 'div'] as const);
    let k: number, a2: number, b2: number, does: string;
    if (kind === 'mul') { k = pick(R, [-1, -1, -2, -3, -0.5]); if (k === -0.5 && (N.a % 2 || N.b % 2)) continue; if (Math.abs(N.a * k) > 12 || Math.abs(N.b * k) > 12) continue; a2 = N.a * k; b2 = N.b * k; does = `Multiply both sides by ${k === -0.5 ? '−' + fr(1, 2) : nH(k)}`; }
    else { k = pick(R, [-2, -3, -4]); if (N.a % k || N.b % k) continue; a2 = N.a / k; b2 = N.b / k; does = `Divide both sides by ${nH(k)}`; }
    a2 = a2 + 0; b2 = b2 + 0;
    const o = distinct([
      { t: eqH(nH(a2), nH(b2), flip(N.rel)), ok: true, say: 'Yes. × or ÷ by a negative number mirrors every number through 0, so the order turns around.' },
      { t: eqH(nH(a2), nH(b2), N.rel), mc: MC.noRev, say: `Look at the numbers: ${nH(a2)} is ${a2 < b2 ? 'less' : 'more'} than ${nH(b2)}. A negative factor mirrors the line: the symbol must turn.` },
      { t: eqH(nH(b2), nH(a2), flip(N.rel)), mc: MC.sideSwap, say: `Keep each number on its own side: ${nH(N.a)} becomes ${nH(a2)} on the left, ${nH(N.b)} becomes ${nH(b2)} on the right. The symbol turns.` },
    ]);
    if (!o) continue;
    const op = { kind: 'mul' as const, by: kind === 'mul' ? k : 1 / k };
    const b: Base = { id: `flipNum-${n}`, family: 'flipNum', board: eqT(nT(N.a), nT(N.b), N.rel), picture: { line: mapPic(N, op, a2, b2, eqT(nT(a2), nT(b2), flip(N.rel))) },
      prompt: `<b>${eqH(nH(N.a), nH(N.b), N.rel)}</b> is true. ${does}. Which statement does this step give?`,
      solution: [`${does}: ${nH(N.a)} becomes ${nH(a2)}, ${nH(N.b)} becomes ${nH(b2)}.`, `A negative factor mirrors the line through 0, so the order reverses: ${eqH(nH(a2), nH(b2), flip(N.rel))}.`] };
    return choice(R, b, o);
  }
};
const doesFlip: Gen = (R, n) => {
  const a = nz(R, -6, 6), bb = nz(R, -12, 12), c = nz(R, -15, 15), rel = pick(R, ['<', '<=', '>', '>='] as const);
  const E = eqT(linT(L(a, bb)), nT(c), rel);
  const k = int(R, 2, 6);
  const step = pick(R, [
    { t: `Add −${k} to both sides`, rev: false, trap: 'neg' },
    { t: `Subtract ${k} from both sides`, rev: false, trap: 'sub' },
    { t: `Divide both sides by ${k}`, rev: false, trap: 'neg' },
    { t: `Multiply both sides by ${fr(1, k)}`, rev: false, trap: 'neg' },
    { t: `Divide both sides by −${k}`, rev: true },
    { t: `Multiply both sides by −${k}`, rev: true },
    { t: `Multiply both sides by −${fr(1, k)}`, rev: true },
  ]);
  const K = { t: 'It keeps the direction: the step adds, subtracts, or scales by a positive number', ok: !step.rev, say: step.rev ? 'The step scales by a negative number: that mirrors the line, so the symbol turns.' : 'Yes. Only × or ÷ by a negative number turns the symbol.' };
  const Rv = { t: 'It reverses the direction: the step multiplies or divides by a negative number', ok: step.rev, say: step.rev ? 'Yes. A negative factor mirrors every number through 0.' : 'Look at the step: it does not multiply or divide by a negative number.' };
  const trap: Opt = step.rev ? { t: 'It keeps the direction: multiplying and dividing never change the order', mc: MC.noRev, say: 'They do when the number is negative: −1 < 2, but 1 > −2.' }
    : step.trap === 'sub' ? { t: 'It reverses the direction: subtracting turns the order around', mc: MC.revAdd, say: 'Subtracting slides every number the same way: the order stays.' }
      : { t: 'It reverses the direction: there are negative numbers in the inequality', mc: MC.revAny, say: 'Negative numbers around don’t matter. Only the sign of the number you multiply or divide by does.' };
  const b: Base = { id: `doesFlip-${n}`, family: 'doesFlip', board: E, picture: { lines: { tex: [E] } },
    prompt: `Solving <b>${eqH(linH(L(a, bb)), nH(c), rel)}</b>, you ${step.t.charAt(0).toLowerCase() + step.t.slice(1)}. What happens to the inequality symbol?`,
    solution: ['Adding, subtracting, and × or ÷ by a positive number keep the direction.', '× or ÷ by a negative number mirrors the number line through 0: the direction reverses.', `${step.t}: it ${step.rev ? 'reverses' : 'keeps'} the direction.`] };
  return choice(R, b, [{ t: K.t, ok: K.ok || undefined, say: K.say }, { t: Rv.t, ok: Rv.ok || undefined, say: Rv.say }, trap]);
};

// =====================================================================================================================
// 6 annotate-worked-solution, 17 (firstBad): a worked solution of a(x + q) = cx + d
// =====================================================================================================================
interface WLine { tex: string; html: string; kind: 'orig' | 'dist' | 'subX' | 'subN' | 'div' }
interface Worked { a: number; q: number; c: number; d: number; s: number; lines: WLine[] }
function worked(R: () => number): Worked {
  for (;;) {
    const a = int(R, 3, 7), c = int(R, 1, a - 2), q = nz(R, -6, 6), s = nz(R, -6, 8), d = a * (s + q) - c * s;
    if (d === 0 || a * q === 0) continue;
    const g = a - c;
    const lines: WLine[] = [
      { kind: 'orig', tex: eqT(grpT(a, q), linT(L(c, d))), html: eqH(grpH(a, q), linH(L(c, d))) },
      { kind: 'dist', tex: eqT(linT(L(a, a * q)), linT(L(c, d))), html: eqH(linH(L(a, a * q)), linH(L(c, d))) },
      { kind: 'subX', tex: eqT(linT(L(g, a * q)), nT(d)), html: eqH(linH(L(g, a * q)), nH(d)) },
      { kind: 'subN', tex: eqT(linT(L(g, 0)), nT(d - a * q)), html: eqH(linH(L(g, 0)), nH(d - a * q)) },
      { kind: 'div', tex: eqT('x', nT(s)), html: eqH(X, nH(s)) },
    ];
    return { a, q, c, d, s, lines };
  }
}
function reasonsOf(w: Worked, kind: WLine['kind']): { ok: string; traps: Opt[]; prop: string } {
  const { a, q, c } = w, g = a - c, aq = a * q;
  const cx = xt(c);
  switch (kind) {
    case 'dist': return { ok: `Distributive property: ${grpH(a, q)} is ${linH(L(a, aq))}`, prop: 'Distributive Property', traps: [
      { t: `Multiply both sides by ${a}`, say: `Only the left side changed, and its value did not: ${a} times each term inside.` },
      { t: 'Combine like terms', say: 'No like terms were combined: the parentheses were multiplied out.' }] };
    case 'subX': return { ok: `Subtract ${cx} from both sides`, prop: 'Subtraction Property of Equality', traps: [
      { t: `Move ${cx} to the other side and change its sign`, mc: MC.moveSign, say: `Say what was done to both sides: ${cx} was subtracted from both sides.` },
      { t: `Subtract ${cx}`, mc: MC.incomplete, say: `From what? Name both sides: subtract ${cx} from both sides.` }] };
    case 'subN': return { ok: `${aq > 0 ? 'Subtract' : 'Add'} ${Math.abs(aq)} ${aq > 0 ? 'from' : 'to'} both sides`, prop: aq > 0 ? 'Subtraction Property of Equality' : 'Addition Property of Equality', traps: [
      { t: `Move the ${nH(aq)} to the other side and change its sign`, mc: MC.moveSign, say: `Name the operation on both sides: ${aq > 0 ? 'subtract' : 'add'} ${Math.abs(aq)} on both sides.` },
      { t: `${aq > 0 ? 'Subtract' : 'Add'} ${Math.abs(aq)}`, mc: MC.incomplete, say: `To which side? Both: ${aq > 0 ? 'subtract' : 'add'} ${Math.abs(aq)} on both sides.` }] };
    default: return { ok: `Divide both sides by ${g}`, prop: 'Division Property of Equality', traps: [
      { t: `Move the ${g} to the other side as a divisor`, mc: MC.moveSign, say: `Name the operation on both sides: divide both sides by ${g}.` },
      { t: `Divide by ${g}`, mc: MC.incomplete, say: `Divide what? Both sides: divide both sides by ${g}.` }] };
  }
}
const workedTex = (w: Worked, upto = 5) => w.lines.slice(0, upto).map((l, i) => `\\text{${i + 1}}\\quad ${l.tex}`);
const reasonFor: Gen = (R, n) => {
  const w = worked(R), k = int(R, 2, 5), line = w.lines[k - 1]!;
  const rs = reasonsOf(w, line.kind);
  const b: Base = { id: `reasonFor-${n}`, family: 'reasonFor', board: w.lines.map(l => l.tex).join(' \\\\ '), picture: { lines: { tex: workedTex(w), hi: k - 1 } },
    prompt: `A worked solution is on the board. Which reason takes line ${k - 1} (<b>${w.lines[k - 2]!.html}</b>) to line ${k} (<b>${line.html}</b>)?`,
    solution: [`From line ${k - 1} to line ${k}: ${rs.ok.charAt(0).toLowerCase() + rs.ok.slice(1)}.`, 'A full reason says what was done to both sides (or which rewrite of one side), so it is clear the solution set is kept.'] };
  return choice(R, b, [{ t: rs.ok, ok: true, say: 'Yes. That says exactly what was done, and it keeps the solution set.' }, ...rs.traps]);
};
const PROPS = ['Distributive Property', 'Subtraction Property of Equality', 'Addition Property of Equality', 'Division Property of Equality', 'Multiplication Property of Equality'];
const propName: Gen = (R, n) => {
  const w = worked(R), k = int(R, 2, 5), line = w.lines[k - 1]!;
  const rs = reasonsOf(w, line.kind);
  const others = shuffle(R, PROPS.filter(p => p !== rs.prop)).slice(0, 2);
  const b: Base = { id: `propName-${n}`, family: 'propName', board: w.lines.map(l => l.tex).join(' \\\\ '), picture: { lines: { tex: workedTex(w), hi: k - 1 } },
    prompt: `Which property justifies the step from line ${k - 1} to line ${k} (<b>${line.html}</b>)?`,
    solution: [`The step: ${rs.ok.charAt(0).toLowerCase() + rs.ok.slice(1)}.`, `Its name: ${rs.prop}.`] };
  return choice(R, b, [{ t: rs.prop, ok: true, say: `Yes: ${rs.ok.charAt(0).toLowerCase() + rs.ok.slice(1)}.` }, ...others.map(o => ({ t: o, say: `The step was: ${rs.ok.charAt(0).toLowerCase() + rs.ok.slice(1)}. That is the ${rs.prop}.` }))]);
};

// =====================================================================================================================
// 7 justified-chain-two-step
// =====================================================================================================================
function niceSol(R: () => number, p: number): number {
  const dens = [1, 1, 1, 2, 4, 5].filter(d => Math.abs(p) % d === 0);
  const d = pick(R, dens.length ? dens : [1]);
  for (;;) { const s = int(R, -12 * d, 12 * d) / d; if (s !== 0 && (d === 1 || !Number.isInteger(s))) return s; }
}
const chainSolve: Gen = (R, n) => {
  for (;;) {
    const grp = R() < 0.45, p = nz(R, -12, 12), q = nz(R, -15, 15);
    if (Math.abs(p) < 2) continue;
    const s = niceSol(R, p), r = grp ? p * (s + q) : p * s + q;
    if (!Number.isInteger(r) || Math.abs(r) > 150) continue;
    const lhsH = grp ? grpH(p, q) : linH(L(p, q)), lhsT = grp ? grpT(p, q) : linT(L(p, q));
    const sD = nH(s, true);
    const sol = grp ? [
      `${lhsH} = ${nH(r)}. Divide both sides by ${nH(p)} (it can be undone): ${X}${sgH(q)} = ${nH(r / p)}.`,
      `${q > 0 ? 'Subtract' : 'Add'} ${Math.abs(q)} ${q > 0 ? 'from' : 'to'} both sides: ${X} = ${ans(sD)}.`,
      `Check: ${nH(p)}(${sD}${sgH(q)}) = ${nH(r)}. ✓`,
    ] : [
      `${lhsH} = ${nH(r)}. ${q > 0 ? 'Subtract' : 'Add'} ${Math.abs(q)} ${q > 0 ? 'from' : 'to'} both sides: ${xt(p)} = ${nH(r - q)}.`,
      `Divide both sides by ${nH(p)}: ${X} = ${ans(sD)}.`,
      `Check: ${nH(p)} · ${s < 0 ? `(${sD})` : sD}${sgH(q)} = ${nH(r)}. ✓`,
    ];
    const cands: Cand[] = grp ? [
      [(r - q) / p, MC.wrongOrder, `The × ${nH(p)} was done last (to the whole parentheses), so undo it first: divide both sides by ${nH(p)}, then undo the ${nH(q)}.`],
      [r / -p - q, MC.signDrop, `Divide by ${nH(p)}, sign and all.`],
      [r / p, MC.intermediate, `${nH(r / p)} is ${X}${sgH(q)}, not ${X} yet. One more step.`],
      [r / p + q, MC.forward, `Undo the ${sgH(q).trim()} with its opposite.`],
    ] : [
      [r / p - q, MC.wrongOrder, `The ${sgH(q).trim()} was done last, so undo it first, then divide.`],
      [(r - q) / -p, MC.signDrop, `Divide by ${nH(p)}, sign and all.`],
      [r - q, MC.intermediate, `${nH(r - q)} is ${xt(p)}, not ${X} yet. One more step.`],
      [(r + q) / p, MC.forward, `Undo the ${sgH(q).trim()} with its opposite.`],
    ];
    return numItem({ id: `chainSolve-${n}`, family: 'chainSolve', board: eqT(lhsT, nT(r)), solution: sol,
      prompt: `Solve <b>${lhsH} = ${nH(r)}</b>, with a reason for every step. ${X} = ? (a decimal is fine)` }, s, `Yes: ${X} = ${sD}. Each step was done to both sides and can be undone.`, cands, `Undo the last operation first, on both sides: ${X} = ${sD}.`);
  }
};
const nextReason: Gen = (R, n) => {
  for (;;) {
    const grp = R() < 0.5, p = nz(R, -9, 9), q = nz(R, -12, 12);
    if (Math.abs(p) < 2) continue;
    const s = nz(R, -9, 9), r = grp ? p * (s + q) : p * s + q;
    const lhsH = grp ? grpH(p, q) : linH(L(p, q)), lhsT = grp ? grpT(p, q) : linT(L(p, q));
    const opts: Opt[] = grp ? [
      { t: `${X}${sgH(q)} = ${nH(r / p)}, because both sides were divided by ${nH(p)}`, ok: true, say: 'Yes. Dividing both sides by a nonzero number can be undone.' },
      { t: `${linH(L(p, q))} = ${nH(r)}, by the distributive property`, mc: MC.partialDist, say: `${nH(p)} multiplies BOTH terms in the parentheses: ${linH(L(p, p * q))}.` },
      { t: `${X} = ${nH(s)}, and no reason is needed because it is the answer`, mc: MC.noJust, say: 'A right answer still needs its reasons: each line must follow from the one before.' },
    ] : [
      { t: `${xt(p)} = ${nH(r - q)}, because ${Math.abs(q)} was ${q > 0 ? 'subtracted from' : 'added to'} both sides`, ok: true, say: 'Yes. That step can be undone, so it keeps the solution set.' },
      { t: `${X}${sgH(q)} = ${nH(r / p)}, because both sides were divided by ${nH(p)}`, mc: MC.someTerms, say: `Dividing the left side by ${nH(p)} divides EVERY term: the ${nH(q)} too.` },
      { t: `${X} = ${nH(s)}, and no reason is needed because it is the answer`, mc: MC.noJust, say: 'A right answer still needs its reasons: each line must follow from the one before.' },
    ];
    const o = distinct(opts);
    if (!o) continue;
    return choice(R, { id: `nextReason-${n}`, family: 'nextReason', board: eqT(lhsT, nT(r)), prompt: `Start: <b>${lhsH} = ${nH(r)}</b>. Which is a correct next line WITH its reason?`,
      solution: [grp ? `Undo the last operation (× ${nH(p)}) first: divide both sides by ${nH(p)}.` : `Undo the last operation (${sgH(q).trim()}) first, on both sides.`, 'Write the reason with the line.'] }, o);
  }
};

// =====================================================================================================================
// 8 variable-terms-both-sides
// =====================================================================================================================
const bothSolve: Gen = (R, n) => {
  for (;;) {
    const form = pick(R, ['lin', 'grpL', 'grpR'] as const);
    const a = nz(R, -8, 9), c = nz(R, -8, 9);
    if (a === c) continue;
    const s = R() < 0.15 ? nz(R, -9, 9) + 0.5 : nz(R, -9, 9), q = nz(R, -6, 6), b = nz(R, -15, 15);
    let lhs: Lin, rhs: Lin, lT: string, rT: string, lH: string, rH: string, cands: Cand[] = [];
    if (form === 'lin') {
      const d = (a - c) * s + b; if (!Number.isInteger(d)) continue;
      lhs = L(a, b); rhs = L(c, d); lT = linT(lhs); rT = linT(rhs); lH = linH(lhs); rH = linH(rhs);
      cands = [[(d - b) / (a + c), MC.noSignChange, `Take ${xt(c)} off BOTH sides: ${a - c === 1 ? '' : nH(a - c)}${X}, not ${nH(a + c)}${X}.`], [(d + b) / (a - c), MC.noSignChange, `Undo the ${nH(b)} with its opposite on both sides: ${nH(d)} ${b > 0 ? '−' : '+'} ${Math.abs(b)}.`], [d - b, MC.intermediate, `${nH(d - b)} is ${xt(a - c)}, not ${X} yet.`]];
    } else if (form === 'grpL') {
      if (a < 2) continue;
      const d = a * (s + q) - c * s; if (!Number.isInteger(d)) continue;
      lhs = L(a, a * q); rhs = L(c, d); lT = grpT(a, q); rT = linT(rhs); lH = grpH(a, q); rH = linH(rhs);
      cands = [[(d - q) / (a - c), MC.partialDist, `${a}(${X}${sgH(q)}) is ${linH(L(a, a * q))}: the ${nH(q)} is multiplied too.`], [(d - a * q) / (a + c), MC.noSignChange, `Take ${xt(c)} off BOTH sides.`]];
    } else {
      if (c < 2) continue;
      const d0 = c * q, bb = c * (s + q) - a * s; if (!Number.isInteger(bb)) continue;
      lhs = L(a, bb); rhs = L(c, d0); lT = linT(lhs); rT = grpT(c, q); lH = linH(lhs); rH = grpH(c, q);
      cands = [[(q - bb) / (a - c), MC.partialDist, `${c}(${X}${sgH(q)}) is ${linH(L(c, c * q))}: the ${nH(q)} is multiplied too.`]];
    }
    const S = solve(lhs, '=', rhs);
    if (S.length !== 1 || !near(S[0]!.lo, s) || Math.abs(rhs.b) > 60 || Math.abs(lhs.b) > 60) continue;
    const k = Math.min(a, c), big = Math.max(a, c);
    const lhsE = form === 'grpL' ? `${grpH(a, q)} = ${rH}: distribute: ${linH(lhs)} = ${linH(rhs)}.` : form === 'grpR' ? `${lH} = ${grpH(c, q)}: distribute: ${linH(lhs)} = ${linH(rhs)}.` : `${lH} = ${rH}.`;
    const g = big - k, collectLeft = a > c;
    const sol = [lhsE,
      `${k > 0 ? 'Subtract' : 'Add'} ${xt(Math.abs(k))} ${k > 0 ? 'from' : 'to'} both sides: ${collectLeft ? `${linH(L(g, lhs.b))} = ${nH(rhs.b)}` : `${nH(lhs.b)} = ${linH(L(g, rhs.b))}`}.`,
      `${collectLeft ? (lhs.b > 0 ? `Subtract ${lhs.b} from` : `Add ${-lhs.b} to`) : (rhs.b > 0 ? `Subtract ${rhs.b} from` : `Add ${-rhs.b} to`)} both sides, then divide both sides by ${g}: ${X} = ${ans(nH(s, true))}.`];
    return numItem({ id: `bothSolve-${n}`, family: 'bothSolve', board: eqT(lT, rT), solution: sol,
      prompt: `Solve <b>${lH} = ${rH}</b>. ${X} = ?` }, s, `Yes: ${X} = ${nH(s, true)}. Check it in the original: both sides are ${nH(at(lhs, s), true)}.`, cands, `Collect the ${X}-terms on one side by subtracting one from both sides, then the numbers: ${X} = ${nH(s, true)}.`);
  }
};
const collectSide: Gen = (R, n) => {
  for (;;) {
    const a = nz(R, -6, 9), c = nz(R, -6, 9), b = nz(R, -12, 12), d = nz(R, -12, 12);
    if (a === c || (a < 0 && c < 0) || Math.abs(a) < 2 && Math.abs(c) < 2) continue;
    const small = Math.min(a, c), large = Math.max(a, c);
    const ok = small > 0 ? `Subtract ${xt(small)} from both sides` : `Add ${xt(-small)} to both sides`;
    const bad = large > 0 ? `Subtract ${xt(large)} from both sides` : `Add ${xt(-large)} to both sides`;
    const side = a > c ? 'left' : 'right';
    const o = distinct([
      { t: ok, ok: true, say: `Yes. The ${X}-terms end up on the ${side} as ${xt(large - small)}: positive.` },
      { t: bad, say: `That is a valid step, but it leaves ${xt(small - large)}: a negative coefficient. Remove the smaller ${X}-term instead.` },
      { t: `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides, since ${X}-terms can’t cross the = sign`, mc: MC.onlyConst, say: `${X}-terms may be added or subtracted on both sides like any number: the same unknown amount off both sides.` },
    ]);
    if (!o) continue;
    return choice(R, { id: `collectSide-${n}`, family: 'collectSide', board: eqT(linT(L(a, b)), linT(L(c, d))),
      prompt: `<b>${linH(L(a, b))} = ${linH(L(c, d))}</b>. Which first step collects the ${X}-terms with a POSITIVE coefficient?`,
      solution: [`Compare the ${X}-coefficients: ${nH(a)} and ${nH(c)}. The larger is ${nH(large)}, on the ${side}.`, `Remove the smaller ${X}-term from both sides: ${ok.charAt(0).toLowerCase() + ok.slice(1)}.`] }, o);
  }
};

// =====================================================================================================================
// 9 identity-contradiction-equations
// =====================================================================================================================
/** a set as a stand-alone choice */
const setC = (S: SSet) => (!S.length ? 'No solution (∅)' : S.length === 1 && S[0]!.lo === -Infinity && S[0]!.hi === Infinity ? 'All real numbers' : setH(S));
const ONE = (v: number) => `One solution: ${X} = ${nH(v)}`, NONE = 'No solution (∅)', EVERY = 'All real numbers';
const howMany: Gen = (R, n) => {
  const kind = pick(R, ['ident', 'contra', 'zero', 'one'] as const);
  const a = int(R, 2, 7), q = nz(R, -6, 6), e = int(R, -8, 8);
  let lT: string, rT: string, lH: string, rH: string, sol: string[], opts: Opt[];
  if (kind === 'ident') {
    lT = `${grpT(a, q)}${sgT(e)}`; lH = `${grpH(a, q)}${sgH(e)}`; rT = linT(L(a, a * q + e)); rH = linH(L(a, a * q + e));
    sol = [`Distribute: ${linH(L(a, a * q + e))} = ${rH}.`, `Subtract ${a}${X} from both sides: ${nH(a * q + e)} = ${nH(a * q + e)}, true for every ${X}.`, 'The original has the same solutions as a true statement: all real numbers.'];
    opts = [{ t: EVERY, ok: true, say: 'Yes. Both sides are the same expression.' }, { t: ONE(0), mc: MC.zeroNone, say: `${X} disappeared and left a TRUE statement: every number works, not just 0.` }, { t: NONE, say: `Try any number, like ${X} = 1: both sides are equal.` }];
  } else if (kind === 'contra') {
    const d = a * q + e + nz(R, -5, 5);
    lT = `${grpT(a, q)}${sgT(e)}`; lH = `${grpH(a, q)}${sgH(e)}`; rT = linT(L(a, d)); rH = linH(L(a, d));
    sol = [`Distribute: ${linH(L(a, a * q + e))} = ${rH}.`, `Subtract ${a}${X} from both sides: ${nH(a * q + e)} = ${nH(d)}, false for every ${X}.`, 'The original has the same solutions as a false statement: none.'];
    opts = [{ t: NONE, ok: true, say: 'Yes. The left side is always different from the right.' }, { t: ONE(0), mc: MC.zeroNone, say: `Try ${X} = 0: ${nH(a * q + e)} and ${nH(d)} are not equal. No number works.` },
      { t: 'There must be a mistake: every equation has a solution', mc: MC.noneError, say: 'No mistake: some equations have no solution. The steps were all reversible.' }, { t: EVERY, say: `Try ${X} = 0: ${nH(a * q + e)} ≠ ${nH(d)}.` }];
  } else {
    const c = int(R, 2, 9) === a ? a + 1 : int(R, 1, 9), s = kind === 'zero' ? 0 : nz(R, -6, 6), cc = c === a ? a + 2 : c;
    const b = nz(R, -12, 12), d = (a - cc) * s + b;
    lT = linT(L(a, b)); lH = linH(L(a, b)); rT = linT(L(cc, d)); rH = linH(L(cc, d));
    sol = [`Subtract ${xt(Math.min(a, cc))} from both sides: the ${X}-term stays (${a} ≠ ${cc}).`, `Solve: ${X} = ${nH(s)}. Exactly one solution.`];
    opts = kind === 'zero' ? [{ t: ONE(0), ok: true, say: `Yes. ${X} = 0 is a real solution, and the only one.` }, { t: NONE, mc: MC.zeroNone, say: `0 is a number. Try it: both sides are ${nH(b)}.` }, { t: EVERY, say: `Try ${X} = 1: ${nH(a + b)} ≠ ${nH(cc + d)}.` }]
      : [{ t: ONE(s), ok: true, say: 'Yes. Different x-coefficients mean exactly one solution.' }, { t: NONE, say: `${X} = ${nH(s)} works: both sides are ${nH(a * s + b)}.` }, { t: EVERY, say: `Try ${X} = 0: ${nH(b)} ≠ ${nH(d)}.` }];
  }
  return choice(R, { id: `howMany-${n}`, family: 'howMany', board: eqT(lT, rT), prompt: `How many solutions does <b>${lH} = ${rH}</b> have?`, solution: sol }, opts);
};
const whySet: Gen = (R, n) => {
  const a = int(R, 2, 7), q = nz(R, -6, 6), e = int(R, -8, 8), ident = R() < 0.5, k = a * q + e, d = ident ? k : k + nz(R, -5, 5);
  const lT = `${grpT(a, q)}${sgT(e)}`, lH = `${grpH(a, q)}${sgH(e)}`;
  const opts: Opt[] = ident ? [
    { t: `All real numbers: the equation has the same solutions as ${nH(k)} = ${nH(k)}, which is true for every ${X}`, ok: true, say: 'Yes. Every step was reversible, and the end is always true.' },
    { t: `${X} = 0: the ${X}-terms became 0`, mc: MC.zeroNone, say: `The ${X}-terms cancelling does not make ${X} zero. ${nH(k)} = ${nH(k)} is true whatever ${X} is.` },
    { t: `No solution: ${X} disappeared, so something went wrong`, mc: MC.noneError, say: `Nothing went wrong. ${nH(k)} = ${nH(k)} is true, so every number works.` },
  ] : [
    { t: `No solution: the equation has the same solutions as ${nH(k)} = ${nH(d)}, which is never true`, ok: true, say: 'Yes. Every step was reversible, and the end is always false.' },
    { t: `${X} = 0: the ${X}-terms became 0`, mc: MC.zeroNone, say: `Try ${X} = 0 in the original: the sides are ${nH(k)} and ${nH(d)}. Not equal.` },
    { t: `All real numbers: ${X} can be anything, because it disappeared`, say: `${X} disappeared and left ${nH(k)} = ${nH(d)}: false for every ${X}.` },
  ];
  return choice(R, { id: `whySet-${n}`, family: 'whySet', board: `${eqT(lT, linT(L(a, d)))} \\;\\Rightarrow\\; ${nT(k)} = ${nT(d)}`, picture: { lines: { tex: [eqT(lT, linT(L(a, d))), eqT(linT(L(a, k)), linT(L(a, d))), `${nT(k)} = ${nT(d)}`] } },
    prompt: `Solving <b>${lH} = ${linH(L(a, d))}</b> leads to <b>${nH(k)} = ${nH(d)}</b>. What is the solution set, and why?`,
    solution: [`Distribute, then subtract ${a}${X} from both sides: ${nH(k)} = ${nH(d)}.`, `Each step can be undone, so the original has the same solutions as ${nH(k)} = ${nH(d)}: ${ident ? 'true for every x, so all real numbers' : 'never true, so no solution'}.`] }, opts);
};

// =====================================================================================================================
// 10 rational-coefficients-lcd
// =====================================================================================================================
const lcm = (a: number, b: number) => { const g = (x: number, y: number): number => (y ? g(y, x % y) : x); return (a * b) / g(a, b); };
interface Rat { tex: string; html: string; m: number; okLine: string; wrong: { line: string; mc: string; s: number; say: string }[]; s: number; steps: string[] }
function ratEq(R: () => number): Rat {
  for (;;) {
    const f = pick(R, ['sum', 'bin', 'minus', 'dec'] as const);
    if (f === 'sum') {
      const [a, b] = shuffle(R, [2, 3, 4, 5, 6]).slice(0, 2) as [number, number], m = lcm(a, b), t = nz(R, -4, 5), s = m * t;
      const c = t * (m / a + m / b);
      if (Math.abs(c) > 40) continue;
      return { tex: `\\dfrac{x}{${a}} + \\dfrac{x}{${b}} = ${nT(c)}`, html: `${fr(X, a)} + ${fr(X, b)} = ${nH(c)}`, m, s,
        okLine: `${xt(m / a)} + ${xt(m / b)} = ${nH(m * c)}`,
        wrong: [{ line: `${xt(m / a)} + ${xt(m / b)} = ${nH(c)}`, mc: MC.someTerms, s: c / (m / a + m / b), say: `Multiply EVERY term by ${m}, the ${nH(c)} on the right too.` },
          { line: `${xt(m)} + ${xt(m)} = ${nH(m * c)}`, mc: undefined as unknown as string, s: NaN, say: `${m} · ${fr(X, a)} is ${m / a}${X}: ${m} ÷ ${a} = ${m / a}.` }],
        steps: [`Multiply every term on both sides by ${m} (nonzero, so it can be undone): ${xt(m / a)} + ${xt(m / b)} = ${nH(m * c)}.`, `Combine: ${xt(m / a + m / b)} = ${nH(m * c)}, so ${X} = ${ans(nH(s))}.`] };
    }
    if (f === 'bin') {
      const [a, b] = shuffle(R, [2, 3, 4, 5]).slice(0, 2) as [number, number], m = lcm(a, b), A = m / a, B = m / b, p = nz(R, -6, 6), q = nz(R, -6, 6);
      const s = (A * p + B * q) / (A - B);
      if (!Number.isInteger(s) || Math.abs(s) > 40) continue;
      const ws = (q + p) / (A - B);
      return { tex: `\\dfrac{x${sgT(-p)}}{${a}} = \\dfrac{x${sgT(q)}}{${b}}`, html: `${fr(X + sgH(-p), a)} = ${fr(X + sgH(q), b)}`, m, s,
        okLine: `${A}(${X}${sgH(-p)}) = ${B}(${X}${sgH(q)})`,
        wrong: [{ line: `${xt(A)}${sgH(-p)} = ${xt(B)}${sgH(q)}`, mc: MC.partialDist, s: ws, say: `The fraction bar groups the whole numerator: ${A}(${X}${sgH(-p)}) = ${linH(L(A, -A * p))}.` },
          { line: `${B}(${X}${sgH(-p)}) = ${A}(${X}${sgH(q)})`, mc: undefined as unknown as string, s: NaN, say: `${m} ÷ ${a} = ${A} goes with the left fraction, ${m} ÷ ${b} = ${B} with the right one.` }],
        steps: [`Multiply both sides by ${m}: ${A}(${X}${sgH(-p)}) = ${B}(${X}${sgH(q)}).`, `Distribute: ${linH(L(A, -A * p))} = ${linH(L(B, B * q))}.`, A - B === 1 ? `Collect: ${X} = ${ans(nH(s))}.` : `Collect: ${xt(A - B)} = ${nH(A * p + B * q)}, so ${X} = ${ans(nH(s))}.`] };
    }
    if (f === 'minus') {
      const [a, b] = shuffle(R, [2, 3, 4, 6]).slice(0, 2) as [number, number], m = lcm(a, b), A = m / a, B = m / b, c = nz(R, -6, 6), d = nz(R, -5, 5);
      if (A === B) continue;
      const s = (m * d - B * c) / (A - B);
      if (!Number.isInteger(s) || Math.abs(s) > 40) continue;
      const ws = (m * d + B * c) / (A - B);
      return { tex: `\\dfrac{x}{${a}} - \\dfrac{x${sgT(-c)}}{${b}} = ${nT(d)}`, html: `${fr(X, a)} − ${fr(X + sgH(-c), b)} = ${nH(d)}`, m, s,
        okLine: `${xt(A)} − ${xt(B)}${sgH(B * c)} = ${nH(m * d)}`,
        wrong: [{ line: `${xt(A)} − ${xt(B)}${sgH(-B * c)} = ${nH(m * d)}`, mc: MC.negFirst, s: ws, say: `The minus sign in front of the fraction applies to the whole numerator: −${B}(${X}${sgH(-c)}) = −${B}${X}${sgH(B * c)}.` },
          { line: `${xt(A)} − ${xt(B)}${sgH(B * c)} = ${nH(d)}`, mc: MC.someTerms, s: (d - B * c) / (A - B), say: `Multiply every term by ${m}: the ${nH(d)} too.` }],
        steps: [`Multiply every term by ${m}: ${xt(A)} − ${B}(${X}${sgH(-c)}) = ${nH(m * d)}.`, `The minus applies to both terms: ${xt(A)} − ${xt(B)}${sgH(B * c)} = ${nH(m * d)}.`, A - B === 1 ? `Combine and ${B * c > 0 ? 'subtract' : 'add'} ${Math.abs(B * c)} on both sides: ${X} = ${ans(nH(s))}.` : `${xt(A - B)} = ${nH(m * d - B * c)}, so ${X} = ${ans(nH(s))}.`] };
    }
    const a = nz(R, -9, 9), c = nz(R, -9, 9), s = nz(R, -9, 9), b = nz(R, -40, 40);
    if (a === c) continue;
    const d = (a - c) * s + b;
    if (Math.abs(d) > 60 || d % 10 === 0 && b % 10 === 0) continue;
    const ws = (d / 10 - b / 10) / (a - c);
    const dT = (v: number) => nT(v / 10, true), dH = (v: number) => nH(v / 10, true);
    const term = (k: number, first: boolean) => `${first ? (k < 0 ? '-' : '') : k < 0 ? ' - ' : ' + '}${Math.abs(k / 10)}x`;
    return { tex: `${term(a, true)}${b < 0 ? ' - ' : ' + '}${Math.abs(b / 10)} = ${term(c, true)}${d < 0 ? ' - ' : ' + '}${Math.abs(d / 10)}`.replace(/(^|[ -])1x/g, '$1x'),
      html: `${dH(a)}${X} ${b < 0 ? '−' : '+'} ${Math.abs(b / 10)} = ${dH(c)}${X} ${d < 0 ? '−' : '+'} ${Math.abs(d / 10)}`, m: 10, s,
      okLine: `${linH(L(a, b))} = ${linH(L(c, d))}`,
      wrong: [{ line: `${linH(L(a, b / 10))} = ${linH(L(c, d / 10))}`, mc: MC.someTerms, s: ws, say: 'Multiply EVERY term by 10, the constants too.' },
        { line: `${linH(L(a, b))} = ${linH(L(c, d / 10))}`, mc: MC.someTerms, s: NaN, say: 'Multiply EVERY term on BOTH sides by 10.' }],
      steps: [`Multiply every term on both sides by 10: ${linH(L(a, b))} = ${linH(L(c, d))}.`, `${c > 0 ? 'Subtract' : 'Add'} ${xt(Math.abs(c))} and ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} on both sides: ${xt(a - c)} = ${nH(d - b)}, so ${X} = ${ans(nH(s))}.`] };
  }
}
const lcdSolve: Gen = (R, n) => {
  const E = ratEq(R);
  return numItem({ id: `lcdSolve-${n}`, family: 'lcdSolve', board: E.tex, solution: E.steps, prompt: `Solve <b>${E.html}</b>. ${X} = ?` }, E.s,
    `Yes: ${X} = ${nH(E.s)}. Multiplying every term by ${E.m} was one step: both sides times a nonzero number.`,
    E.wrong.map(w => [w.s, w.mc || undefined, w.say] as Cand), `Multiply every term on both sides by ${E.m}, then solve: ${X} = ${nH(E.s)}.`);
};
const lcdLine: Gen = (R, n) => {
  for (;;) {
    const E = ratEq(R);
    const o = distinct([{ t: E.okLine, ok: true, say: `Yes. Every term on both sides times ${E.m}.` }, ...E.wrong.map(w => ({ t: w.line, mc: w.mc || undefined, say: w.say }))]);
    if (!o) continue;
    return choice(R, { id: `lcdLine-${n}`, family: 'lcdLine', board: E.tex, prompt: `Multiply every term of <b>${E.html}</b> by ${E.m}. Which equation do you get?`,
      solution: [`${E.m} is a common multiple of the denominators. Multiplying both sides by it is one equivalence step (it is nonzero, so it can be undone).`, `Every term is multiplied: ${E.okLine}.`] }, o.slice(0, 3));
  }
};


// =====================================================================================================================
// 11 letter-coefficients, 12 zero-parameter-cases
// =====================================================================================================================
const v = (s: string) => `<i>${s}</i>`;
const sub = (s: string, k: number) => `<i>${s}</i>${'₀₁₂₃'[k]}`;
/** a fraction of letters: plain text inside (so the plain form of every choice stays readable and distinct) */
const frP = (n: string | number, d: string | number) => fr(String(n).replace(/<[^>]+>/g, ''), String(d).replace(/<[^>]+>/g, ''));
interface Formula { f: string; tex: string; target: string; ok: string; cond: string; traps: Opt[]; steps: string[] }
function formulas(R: () => number): Formula {
  const k = int(R, 2, 9), m = int(R, 2, 9);
  const list: Formula[] = [
    { f: `${v('d')} = ${v('r')}${v('t')}`, tex: 'd = rt', target: 't', ok: `${v('t')} = ${frP(v('d'), v('r'))}`, cond: `${v('r')} ≠ 0`, steps: [`Divide both sides by ${v('r')} (allowed when ${v('r')} ≠ 0).`],
      traps: [{ t: `${v('t')} = ${frP(v('r'), v('d'))}`, say: `${v('t')} is multiplied by ${v('r')}; undo it by dividing ${v('d')} by ${v('r')}.` }, { t: `${v('t')} = ${v('d')}${v('r')}`, mc: MC.forward, say: 'Undo a multiply with a divide.' }] },
    { f: `${v('d')} = ${v('r')}${v('t')}`, tex: 'd = rt', target: 'r', ok: `${v('r')} = ${frP(v('d'), v('t'))}`, cond: `${v('t')} ≠ 0`, steps: [`Divide both sides by ${v('t')} (allowed when ${v('t')} ≠ 0).`],
      traps: [{ t: `${v('r')} = ${v('d')} − ${v('t')}`, say: `${v('r')}${v('t')} is a product: undo it by dividing.` }, { t: `${v('r')} = ${v('d')}${v('t')}`, mc: MC.forward, say: 'Undo a multiply with a divide.' }] },
    { f: `${v('P')} = 2${v('l')} + 2${v('w')}`, tex: 'P = 2l + 2w', target: 'w', ok: `${v('w')} = ${frP(`${v('P')} − 2${v('l')}`, 2)}`, cond: '', steps: [`Subtract 2${v('l')} from both sides: ${v('P')} − 2${v('l')} = 2${v('w')}.`, 'Divide both sides by 2.'],
      traps: [{ t: `${v('w')} = ${frP(v('P'), 2)} − 2${v('l')}`, mc: MC.wrongOrder, say: `Dividing by 2 divides EVERY term: the 2${v('l')} too. Subtract first, then divide.` }, { t: `${v('w')} = ${frP(`${v('P')} + 2${v('l')}`, 2)}`, mc: MC.forward, say: `Undo + 2${v('l')} by subtracting it.` }] },
    { f: `${v('P')} = 2${v('l')} + 2${v('w')}`, tex: 'P = 2l + 2w', target: 'l', ok: `${v('l')} = ${frP(`${v('P')} − 2${v('w')}`, 2)}`, cond: '', steps: [`Subtract 2${v('w')} from both sides, then divide both sides by 2.`],
      traps: [{ t: `${v('l')} = ${frP(v('P'), 2)} − 2${v('w')}`, mc: MC.wrongOrder, say: 'Dividing by 2 divides EVERY term. Subtract first, then divide.' }, { t: `${v('l')} = ${v('P')} − 2${v('w')} − 2`, say: 'The 2 multiplies l: undo it by dividing, not subtracting.' }] },
    { f: `${v('A')} = ${frP(1, 2)}${v('b')}${v('h')}`, tex: 'A = \\tfrac12 bh', target: 'h', ok: `${v('h')} = ${frP(`2${v('A')}`, v('b'))}`, cond: `${v('b')} ≠ 0`, steps: ['Multiply both sides by 2: 2A = bh.', `Divide both sides by ${v('b')} (allowed when ${v('b')} ≠ 0).`],
      traps: [{ t: `${v('h')} = ${frP(v('A'), `2${v('b')}`)}`, mc: MC.forward, say: 'Undo × ½ by multiplying by 2, not dividing by 2.' }, { t: `${v('h')} = 2${v('A')} − ${v('b')}`, say: `${v('b')}${v('h')} is a product: undo it by dividing.` }] },
    { f: `${v('A')} = ${frP(1, 2)}${v('h')}(${sub('b', 1)} + ${sub('b', 2)})`, tex: 'A = \\tfrac12 h(b_1 + b_2)', target: 'h', ok: `${v('h')} = ${frP(`2${v('A')}`, `(${sub('b', 1)} + ${sub('b', 2)})`)}`, cond: `${sub('b', 1)} + ${sub('b', 2)} ≠ 0`, steps: ['Multiply both sides by 2.', `Divide both sides by the whole group (${sub('b', 1)} + ${sub('b', 2)}).`],
      traps: [{ t: `${v('h')} = ${frP(`2${v('A')}`, sub('b', 1))} + ${sub('b', 2)}`, say: `Divide by the WHOLE group ${sub('b', 1)} + ${sub('b', 2)}.` }, { t: `${v('h')} = ${frP(v('A'), `2(${sub('b', 1)} + ${sub('b', 2)})`)}`, mc: MC.forward, say: 'Undo × ½ by multiplying by 2.' }] },
    { f: `${v('A')} = ${frP(1, 2)}${v('h')}(${sub('b', 1)} + ${sub('b', 2)})`, tex: 'A = \\tfrac12 h(b_1 + b_2)', target: 'b₁', ok: `${sub('b', 1)} = ${frP(`2${v('A')}`, v('h'))} − ${sub('b', 2)}`, cond: `${v('h')} ≠ 0`, steps: [`Multiply both sides by 2 and divide both sides by ${v('h')}: ${frP(`2${v('A')}`, v('h'))} = ${sub('b', 1)} + ${sub('b', 2)}.`, `Subtract ${sub('b', 2)} from both sides.`],
      traps: [{ t: `${sub('b', 1)} = ${frP(`2${v('A')}`, v('h'))} + ${sub('b', 2)}`, mc: MC.forward, say: `Undo + ${sub('b', 2)} by subtracting it.` }, { t: `${sub('b', 1)} = ${frP(`2${v('A')} − ${sub('b', 2)}`, v('h'))}`, mc: MC.wrongOrder, say: `${sub('b', 2)} is inside the group multiplied by ${v('h')}: divide by ${v('h')} first.` }] },
    { f: `${v('F')} = ${frP(9, 5)}${v('C')} + 32`, tex: 'F = \\tfrac95 C + 32', target: 'C', ok: `${v('C')} = ${frP(5, 9)}(${v('F')} − 32)`, cond: '', steps: ['Subtract 32 from both sides: F − 32 = (9/5)C.', 'Multiply both sides by 5/9.'],
      traps: [{ t: `${v('C')} = ${frP(5, 9)}${v('F')} − 32`, mc: MC.wrongOrder, say: 'The + 32 was done last, so undo it FIRST, then multiply by 5/9.' }, { t: `${v('C')} = ${frP(9, 5)}(${v('F')} − 32)`, mc: MC.partialCoef, say: 'Undo × 9/5 with × 5/9.' }] },
    { f: `${v('V')} = ${v('l')}${v('w')}${v('h')}`, tex: 'V = lwh', target: 'w', ok: `${v('w')} = ${frP(v('V'), `${v('l')}${v('h')}`)}`, cond: `${v('l')}${v('h')} ≠ 0`, steps: [`Divide both sides by ${v('l')}${v('h')} (allowed when ${v('l')}${v('h')} ≠ 0).`],
      traps: [{ t: `${v('w')} = ${v('V')} − ${v('l')}${v('h')}`, say: 'lwh is a product: undo it by dividing.' }, { t: `${v('w')} = ${v('V')}${v('l')}${v('h')}`, mc: MC.forward, say: 'Undo a multiply with a divide.' }] },
    { f: `${v('I')} = ${v('P')}${v('r')}${v('t')}`, tex: 'I = Prt', target: 'r', ok: `${v('r')} = ${frP(v('I'), `${v('P')}${v('t')}`)}`, cond: `${v('P')}${v('t')} ≠ 0`, steps: [`Divide both sides by ${v('P')}${v('t')} (allowed when ${v('P')}${v('t')} ≠ 0).`],
      traps: [{ t: `${v('r')} = ${v('I')} − ${v('P')}${v('t')}`, say: 'Prt is a product: undo it by dividing.' }, { t: `${v('r')} = ${v('I')}${v('P')}${v('t')}`, mc: MC.forward, say: 'Undo a multiply with a divide.' }] },
    { f: `${v('I')} = ${v('P')}${v('r')}${v('t')}`, tex: 'I = Prt', target: 't', ok: `${v('t')} = ${frP(v('I'), `${v('P')}${v('r')}`)}`, cond: `${v('P')}${v('r')} ≠ 0`, steps: [`Divide both sides by ${v('P')}${v('r')}.`],
      traps: [{ t: `${v('t')} = ${frP(`${v('P')}${v('r')}`, v('I'))}`, say: 'Divide I by Pr, not the other way round.' }, { t: `${v('t')} = ${v('I')}${v('P')}${v('r')}`, mc: MC.forward, say: 'Undo a multiply with a divide.' }] },
    { f: `${v('d')} = ${frP(v('m'), v('V'))}`, tex: 'd = \\dfrac{m}{V}', target: 'V', ok: `${v('V')} = ${frP(v('m'), v('d'))}`, cond: `${v('d')} ≠ 0`, steps: [`Multiply both sides by ${v('V')} (${v('V')} ≠ 0): ${v('d')}${v('V')} = ${v('m')}.`, `Divide both sides by ${v('d')} (allowed when ${v('d')} ≠ 0).`],
      traps: [{ t: `${v('V')} = ${v('m')}${v('d')}`, mc: MC.forward, say: `From ${v('d')}${v('V')} = ${v('m')}, divide by ${v('d')}; don’t multiply.` }, { t: `${v('V')} = ${frP(v('d'), v('m'))}`, say: `Check with numbers: m = 12, V = 4 gives d = 3, and 12/3 = 4.` }] },
    { f: `${v('A')} = ${v('P')} + ${v('P')}${v('r')}${v('t')}`, tex: 'A = P + Prt', target: 'P', ok: `${v('P')} = ${frP(v('A'), `1 + ${v('r')}${v('t')}`)}`, cond: `1 + ${v('r')}${v('t')} ≠ 0`, steps: [`Factor ${v('P')} out: ${v('A')} = ${v('P')}(1 + ${v('r')}${v('t')}).`, `Divide both sides by 1 + ${v('r')}${v('t')} (allowed when it is not 0).`],
      traps: [{ t: `${v('P')} = ${v('A')} − ${v('P')}${v('r')}${v('t')}`, mc: MC.oneOcc, say: `${v('P')} is still on the right. Collect both ${v('P')}-terms: ${v('A')} = ${v('P')}(1 + ${v('r')}${v('t')}).` }, { t: `${v('P')} = ${frP(v('A'), `${v('r')}${v('t')}`)}`, mc: MC.oneOcc, say: `That drops the first ${v('P')}. Factor: ${v('P')}(1 + ${v('r')}${v('t')}).` }] },
    { f: `${v('a')}${X} + ${k} = ${v('c')}`, tex: `ax + ${k} = c`, target: 'x', ok: `${X} = ${frP(`${v('c')} − ${k}`, v('a'))}`, cond: `${v('a')} ≠ 0`, steps: [`Subtract ${k} from both sides, then divide both sides by ${v('a')} (${v('a')} ≠ 0).`],
      traps: [{ t: `${X} = ${frP(v('c'), v('a'))} − ${k}`, mc: MC.wrongOrder, say: `Undo the + ${k} first, then divide.` }, { t: `${X} = ${frP(`${v('c')} + ${k}`, v('a'))}`, mc: MC.forward, say: `Undo + ${k} by subtracting ${k}.` }] },
    { f: `${v('a')}${X} − ${k} = ${m}${X} + ${v('b')}`, tex: `ax - ${k} = ${m}x + b`, target: 'x', ok: `${X} = ${frP(`${v('b')} + ${k}`, `${v('a')} − ${m}`)}`, cond: `${v('a')} ≠ ${m}`, steps: [`Subtract ${m}${X} and add ${k} on both sides: ${v('a')}${X} − ${m}${X} = ${v('b')} + ${k}.`, `Factor: ${X}(${v('a')} − ${m}) = ${v('b')} + ${k}. Divide by ${v('a')} − ${m} (when ${v('a')} ≠ ${m}).`],
      traps: [{ t: `${X} = ${frP(`${v('b')} + ${k}`, v('a'))}`, mc: MC.oneOcc, say: `${X} appears twice: collect both ${X}-terms and factor ${X} out.` }, { t: `${X} = ${frP(`${v('b')} + ${k}`, `${v('a')} + ${m}`)}`, mc: MC.noSignChange, say: `Subtract ${m}${X} from both sides: the coefficient is ${v('a')} − ${m}.` }] },
  ];
  return pick(R, list);
}
const rearrange: Gen = (R, n) => {
  const F = formulas(R);
  return choice(R, { id: `rearrange-${n}`, family: 'rearrange', board: F.tex, prompt: `Solve <b>${F.f}</b> for <b>${F.target.length === 1 ? v(F.target) : F.target}</b>. The other letters are fixed numbers.`,
    solution: [...F.steps, F.cond ? `The condition: ${F.cond}.` : 'No division by a letter here, so no extra condition.'] },
  [{ t: F.ok + (F.cond ? ` (${F.cond})` : ''), ok: true, say: `Yes. Undo the operations in reverse order, on both sides${F.cond ? `, and say ${F.cond}` : ''}.` }, ...F.traps.map(t => ({ ...t, t: t.t + (F.cond ? ` (${F.cond})` : '') }))]);
};
const formulaCheck: Gen = (R, n) => {
  const kind = pick(R, ['drt', 'perim', 'tri', 'temp', 'int', 'dens', 'grow'] as const);
  let pr: string, tx: string, val: number, cands: Cand[], steps: string[];
  if (kind === 'drt') { const r = pick(R, [30, 40, 45, 50, 55, 60, 65]), t = int(R, 2, 6), d = r * t; pr = `<b>${v('d')} = ${v('r')}${v('t')}</b>. Solve for ${v('t')}, then find ${v('t')} when ${v('d')} = ${d} miles and ${v('r')} = ${r} mph.`; tx = 'd = rt'; val = t; cands = [[d * r, MC.forward, 'Undo × r with ÷ r.'], [r / d, undefined, 't = d ÷ r, not r ÷ d.']]; steps = [`${v('t')} = ${fr(v('d'), v('r'))}.`, `${v('t')} = ${d} ÷ ${r} = ${ans(t)}. Check: ${r} · ${t} = ${d}. ✓`]; }
  else if (kind === 'perim') { const l = int(R, 5, 20), w = int(R, 2, l - 1), P = 2 * l + 2 * w; pr = `<b>${v('P')} = 2${v('l')} + 2${v('w')}</b>. Solve for ${v('w')}, then find ${v('w')} when ${v('P')} = ${P} ft and ${v('l')} = ${l} ft.`; tx = 'P = 2l + 2w'; val = w; cands = [[P / 2 - 2 * l, MC.wrongOrder, 'Subtract 2l first, then divide by 2.'], [P - 2 * l, MC.intermediate, 'That is 2w. Divide by 2.']]; steps = [`${v('w')} = (${v('P')} − 2${v('l')}) ÷ 2.`, `(${P} − ${2 * l}) ÷ 2 = ${ans(w)}.`]; }
  else if (kind === 'tri') { const b = int(R, 2, 12), h = int(R, 2, 12), A = (b * h) / 2; if (!Number.isInteger(A)) return formulaCheck(R, n); pr = `<b>${v('A')} = ${fr(1, 2)}${v('b')}${v('h')}</b>. Solve for ${v('h')}, then find ${v('h')} when ${v('A')} = ${A} sq in and ${v('b')} = ${b} in.`; tx = 'A = \\tfrac12 bh'; val = h; cands = [[A / (2 * b), MC.forward, 'Undo × ½ with × 2.'], [A / b, undefined, 'Multiply A by 2 first.']]; steps = [`${v('h')} = 2${v('A')} ÷ ${v('b')}.`, `2 · ${A} ÷ ${b} = ${ans(h)}.`]; }
  else if (kind === 'temp') { const C = pick(R, [0, 5, 10, 15, 20, 25, 30, 35, 40, -5, -10]), F = (9 * C) / 5 + 32; pr = `<b>${v('F')} = ${fr(9, 5)}${v('C')} + 32</b>. Solve for ${v('C')}, then find ${v('C')} when ${v('F')} = ${F} °F.`; tx = 'F = \\tfrac95 C + 32'; val = C; cands = [[(5 / 9) * F - 32, MC.wrongOrder, 'Subtract 32 first, then multiply by 5/9.'], [(9 / 5) * (F - 32), MC.partialCoef, 'Undo × 9/5 with × 5/9.']]; steps = [`${v('C')} = ${fr(5, 9)}(${v('F')} − 32).`, `${fr(5, 9)}(${F} − 32) = ${fr(5, 9)} · ${F - 32} = ${ans(nH(C))}.`]; }
  else if (kind === 'int') { const P = pick(R, [200, 400, 500, 800, 1000, 1200]), r = pick(R, [0.02, 0.03, 0.04, 0.05]), t = int(R, 2, 6), I = Math.round(P * r * t * 100) / 100; pr = `<b>${v('I')} = ${v('P')}${v('r')}${v('t')}</b>. Solve for ${v('t')}, then find ${v('t')} in years when ${v('I')} = $${I}, ${v('P')} = $${P} and ${v('r')} = ${r}.`; tx = 'I = Prt'; val = t; cands = [[I * P * r, MC.forward, 'Undo × Pr with ÷ Pr.']]; steps = [`${v('t')} = ${fr(v('I'), `${v('P')}${v('r')}`)}.`, `${I} ÷ (${P} · ${r}) = ${I} ÷ ${Math.round(P * r * 100) / 100} = ${ans(t)}.`]; }
  else if (kind === 'dens') { const d = pick(R, [2, 3, 4, 5, 8]), V = int(R, 2, 12), m = d * V; pr = `<b>${v('d')} = ${fr(v('m'), v('V'))}</b>. Solve for ${v('V')}, then find ${v('V')} in cm³ when ${v('m')} = ${m} g and ${v('d')} = ${d} g/cm³.`; tx = 'd = \\dfrac{m}{V}'; val = V; cands = [[m * d, MC.forward, 'From dV = m, divide by d.'], [d / m, undefined, 'V = m ÷ d, not d ÷ m.']]; steps = [`${v('d')}${v('V')} = ${v('m')}, so ${v('V')} = ${fr(v('m'), v('d'))} (${v('d')} ≠ 0).`, `${m} ÷ ${d} = ${ans(V)}.`]; }
  else { const P = pick(R, [100, 200, 250, 400, 500]), r = pick(R, [0.05, 0.1, 0.2]), t = pick(R, [1, 2, 3, 4, 5]), A = Math.round(P * (1 + r * t) * 100) / 100; pr = `<b>${v('A')} = ${v('P')} + ${v('P')}${v('r')}${v('t')}</b>. Solve for ${v('P')}, then find ${v('P')} when ${v('A')} = $${A}, ${v('r')} = ${r} and ${v('t')} = ${t}.`; tx = 'A = P + Prt'; val = P; cands = [[A / (r * t), MC.oneOcc, 'P appears twice: factor it out, A = P(1 + rt).']]; steps = [`${v('A')} = ${v('P')}(1 + ${v('r')}${v('t')}), so ${v('P')} = ${fr(v('A'), `1 + ${v('r')}${v('t')}`)}.`, `${A} ÷ (1 + ${Math.round(r * t * 100) / 100}) = ${ans(P)}.`]; }
  return numItem({ id: `formulaCheck-${n}`, family: 'formulaCheck', board: tx, prompt: pr, solution: steps }, val, `Yes: ${nH(val)}. Put it back into the original formula to check.`, cands, `Rearrange first, then substitute: ${nH(val)}.`);
};
const nonzeroCond: Gen = (R, n) => {
  const k = int(R, 1, 9), m = int(R, 2, 9);
  const c = pick(R, [
    { tg: X, eq: `${v('a')}${X} − ${k} = ${m}${X} + ${v('b')}`, mid: `${X}(${v('a')} − ${m}) = ${v('b')} + ${k}`, div: `${v('a')} − ${m}`, ok: `${v('a')} ≠ ${m}`, wrong: `${v('a')} ≠ 0`, ws: `Dividing by ${v('a')} − ${m}: that is 0 when ${v('a')} = ${m}.` },
    { tg: X, eq: `${v('k')}${X} + ${m} = ${k}`, mid: `${v('k')}${X} = ${k - m}`, div: v('k'), ok: `${v('k')} ≠ 0`, wrong: `${X} ≠ 0`, ws: `${X} is what you solve for. The divisor is ${v('k')}.` },
    { tg: v('P'), eq: `${v('A')} = ${v('P')} + ${v('P')}${v('r')}${v('t')}`, mid: `${v('A')} = ${v('P')}(1 + ${v('r')}${v('t')})`, div: `1 + ${v('r')}${v('t')}`, ok: `1 + ${v('r')}${v('t')} ≠ 0`, wrong: `${v('r')} ≠ 0 and ${v('t')} ≠ 0`, ws: 'The divisor is the whole group 1 + rt.' },
    { tg: v('V'), eq: `${v('d')} = ${fr(v('m'), v('V'))}`, mid: `${v('d')}${v('V')} = ${v('m')}`, div: v('d'), ok: `${v('d')} ≠ 0`, wrong: `${v('m')} ≠ 0`, ws: `You divide by ${v('d')}, so ${v('d')} must not be 0.` },
    { tg: X, eq: `${v('m')}${X} + ${k} = ${v('n')}${X}`, mid: `${X}(${v('m')} − ${v('n')}) = −${k}`, div: `${v('m')} − ${v('n')}`, ok: `${v('m')} ≠ ${v('n')}`, wrong: `${v('m')} ≠ 0 and ${v('n')} ≠ 0`, ws: `The divisor is ${v('m')} − ${v('n')}: 0 exactly when ${v('m')} = ${v('n')}.` },
    { tg: X, eq: `(${v('a')} + ${k})${X} = ${m}`, mid: `(${v('a')} + ${k})${X} = ${m}`, div: `${v('a')} + ${k}`, ok: `${v('a')} ≠ −${k}`, wrong: `${v('a')} ≠ 0`, ws: `${v('a')} + ${k} is 0 when ${v('a')} = −${k}.` },
  ]);
  return choice(R, { id: `nonzeroCond-${n}`, family: 'nonzeroCond', board: c.mid.replace(/<[^>]+>/g, '').replace(/−/g, '-').replace(/≠/g, '\\ne'),
    prompt: c.eq === c.mid ? `To solve <b>${c.eq}</b> for ${c.tg}, you divide both sides by <b>${c.div}</b>. When is that step allowed?` : `Solving <b>${c.eq}</b> for ${c.tg}, you reach <b>${c.mid}</b> and divide both sides by <b>${c.div}</b>. When is that step allowed?`,
    solution: ['Dividing both sides is reversible only when the divisor is not 0.', `The divisor is ${c.div}, so state ${c.ok}.`] }, [
    { t: `Only when ${c.ok}`, ok: true, say: `Yes. ${c.div} must not be 0.` },
    { t: `Only when ${c.wrong}`, mc: c.wrong.includes(X) ? MC.everySymbol : undefined, say: c.ws },
    { t: 'Always: dividing both sides by the same thing keeps the solutions', mc: MC.nonzero, say: `Not when ${c.div} = 0: dividing by 0 is not defined, and that case must be looked at on its own.` },
  ]);
};
const paramCases: Gen = (R, n) => {
  const kind = pick(R, ['zeroSame', 'zeroDiff', 'one', 'zeroSame', 'zeroDiff'] as const);
  const b = int(R, -9, 9), a = kind === 'one' ? nz(R, -6, 6) : 0, c = kind === 'zeroSame' ? b : kind === 'zeroDiff' ? b + nz(R, -6, 6) : b + a * nz(R, -6, 6);
  const s = a !== 0 ? (c - b) / a : 0;
  const optOne: Opt = a === 0 ? { t: `One solution: ${X} = ${fr(`${v('c')} − ${v('b')}`, v('a'))}`, mc: MC.nonzero, say: `That formula divides by ${v('a')} = 0: not allowed. Look at 0${X}${sgH(b) || ' + 0'} = ${nH(c)} itself.` } : { t: `One solution: ${X} = ${nH(s)}`, ok: true, say: `Yes. ${v('a')} ≠ 0, so divide: ${X} = (${nH(c)} − ${nH(b)}) ÷ ${nH(a)}.` };
  return choice(R, { id: `paramCases-${n}`, family: 'paramCases', board: `ax + b = c,\\quad a = ${nT(a)},\\ b = ${nT(b)},\\ c = ${nT(c)}`,
    prompt: `In <b>${v('a')}${X} + ${v('b')} = ${v('c')}</b>, let ${v('a')} = ${nH(a)}, ${v('b')} = ${nH(b)}, ${v('c')} = ${nH(c)}. What is the solution set?`,
    solution: a === 0 ? [`With ${v('a')} = 0 the equation is 0${X}${sgH(b) || ' + 0'} = ${nH(c)}, that is ${nH(b)} = ${nH(c)}.`, b === c ? 'That is true for every x: all real numbers.' : 'That is false for every x: no solution.'] : [`${v('a')} ≠ 0, so ${X} = (${v('c')} − ${v('b')}) ÷ ${v('a')} = ${nH(s)}.`] },
  [optOne, { t: NONE, ok: a === 0 && b !== c || undefined, say: a === 0 && b !== c ? `Yes. ${nH(b)} = ${nH(c)} is false whatever ${X} is.` : a === 0 ? `${nH(b)} = ${nH(c)} is TRUE, for every ${X}.` : `${X} = ${nH(s)} works.` },
    { t: EVERY, ok: a === 0 && b === c || undefined, say: a === 0 && b === c ? `Yes. 0${X}${sgH(b) || ' + 0'} = ${nH(c)} is true for every ${X}.` : a === 0 ? `${nH(b)} = ${nH(c)} is false: no number works.` : `Only ${X} = ${nH(s)} works.` }]);
};
const paramValue: Gen = (R, n) => {
  const kind = pick(R, ['none', 'all', 'solve'] as const), m = nz(R, -6, 9), c = nz(R, -12, 12), b = int(R, -9, 9);
  if (kind === 'none') return numItem({ id: `paramValue-${n}`, family: 'paramValue', board: `(k ${m < 0 ? '+' : '-'} ${Math.abs(m)})x = ${nT(c)}`,
    prompt: `For which value of ${v('k')} does <b>(${v('k')} ${m < 0 ? '+' : '−'} ${Math.abs(m)})${X} = ${nH(c)}</b> have NO solution? ${v('k')} = ?`,
    solution: [`The coefficient ${v('k')} ${m < 0 ? '+' : '−'} ${Math.abs(m)} is 0 when ${v('k')} = ${nH(m)}.`, `Then the equation says 0 = ${nH(c)}: false for every ${X}. So ${v('k')} = ${ans(nH(m))}.`] }, m,
    `Yes: at ${v('k')} = ${nH(m)} the equation is 0 = ${nH(c)}, never true.`, [[0, MC.nonzero, `At ${v('k')} = 0 the coefficient is ${nH(-m)}, not 0: one solution. The divisor is ${v('k')} ${m < 0 ? '+' : '−'} ${Math.abs(m)}.`], [-m, undefined, `${v('k')} ${m < 0 ? '+' : '−'} ${Math.abs(m)} = 0 means ${v('k')} = ${nH(m)}.`]], `Find the ${v('k')} that makes the coefficient 0: ${v('k')} = ${nH(m)}.`);
  if (kind === 'all') return numItem({ id: `paramValue-${n}`, family: 'paramValue', board: `kx ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${linT(L(m, b))}`,
    prompt: `For which value of ${v('k')} is EVERY number a solution of <b>${v('k')}${X} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${linH(L(m, b))}</b>? ${v('k')} = ?`,
    solution: [`${m > 0 ? 'Subtract' : 'Add'} ${xt(Math.abs(m))} ${m > 0 ? 'from' : 'to'} both sides: (${v('k')} ${m > 0 ? '−' : '+'} ${Math.abs(m)})${X} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${nH(b)}.`, `With ${v('k')} = ${nH(m)} that is ${nH(b)} = ${nH(b)}, true for every ${X}. ${v('k')} = ${ans(nH(m))}.`] }, m,
    `Yes: both sides are the same expression when ${v('k')} = ${nH(m)}.`, [[0, MC.nonzero, `At ${v('k')} = 0 the sides differ by ${nH(-m)}${X}: one solution.`]], `Make the two sides the same expression: ${v('k')} = ${nH(m)}.`);
  const k = m + pick(R, [1, 2, 3, -1, -2]) , g = k - m, s = nz(R, -8, 8), cc = g * s;
  return numItem({ id: `paramValue-${n}`, family: 'paramValue', board: `(k ${m < 0 ? '+' : '-'} ${Math.abs(m)})x = ${nT(cc)},\\ k = ${nT(k)}`,
    prompt: `Solve <b>(${v('k')} ${m < 0 ? '+' : '−'} ${Math.abs(m)})${X} = ${nH(cc)}</b> when ${v('k')} = ${nH(k)}. ${X} = ?`,
    solution: [`With ${v('k')} = ${nH(k)} the coefficient is ${nH(g)}, not 0, so you may divide.`, `${X} = ${nH(cc)} ÷ ${nH(g)} = ${ans(nH(s))}.`] }, s,
    `Yes: ${X} = ${nH(s)}.`, [[cc / k, MC.everySymbol, `Divide by the whole coefficient ${v('k')} ${m < 0 ? '+' : '−'} ${Math.abs(m)} = ${nH(g)}.`], [cc * g, MC.forward, 'Undo × with ÷.']], `Coefficient ${nH(g)}: ${X} = ${nH(cc)} ÷ ${nH(g)} = ${nH(s)}.`);
};

// =====================================================================================================================
// 13-15 inequalities
// =====================================================================================================================
interface Ineq { lH: string; rH: string; lT: string; rT: string; l: Lin; r: Lin; rel: Rel; S: SSet; v: number; rev: boolean; natural: 'x' | 'v'; steps: string[] }
/** a multi-step inequality with boundary v; `wantRev`: collecting on the left needs ÷ by a negative */
function ineq(R: () => number, wantRev: boolean | null, form?: 'both' | 'dist' | 'frac' | 'neg'): Ineq {
  for (;;) {
    const f = form ?? (wantRev ? pick(R, ['neg', 'both', 'both', 'frac'] as const) : pick(R, ['both', 'dist', 'frac', 'both'] as const));
    const rel = pick(R, ['<', '<=', '>', '>='] as const);
    const v = nz(R, -8, 8);
    let l: Lin, r: Lin, lT: string, lH: string;
    if (f === 'neg') { const a = -int(R, 2, 6), b = nz(R, -12, 12); l = L(a, b); r = L(0, a * v + b); lT = linT(l); lH = linH(l); }
    else if (f === 'dist') { const p = int(R, 2, 5), q = nz(R, -6, 6), c = int(R, 1, 6); if (c === p) continue; const d = p * q + (p - c) * v; l = L(p, p * q); r = L(c, d); lT = grpT(p, q); lH = grpH(p, q); }
    else if (f === 'frac') {
      const d = int(R, 2, 5), sgn = wantRev ? -1 : 1, bb = nz(R, -9, 9);
      if (v % d) continue;
      l = L(sgn / d, bb); r = L(0, (sgn * v) / d + bb); lT = `${sgn < 0 ? '-' : ''}\\dfrac{x}{${d}}${sgT(bb)}`; lH = `${sgn < 0 ? '−' : ''}${fr(X, d)}${sgH(bb)}`;
    } else {
      let a = nz(R, -7, 9), c = nz(R, -7, 9);
      if (a === c) continue;
      if (wantRev === true && a > c) [a, c] = [c, a];
      if (wantRev === false && a < c && R() < 0.5) [a, c] = [c, a];
      const b = nz(R, -12, 12), d = b + (a - c) * v;
      if (Math.abs(d) > 40) continue;
      l = L(a, b); r = L(c, d); lT = linT(l); lH = linH(l);
    }
    const rT = linT(r), rH = linH(r);
    const S = solve(l, rel, r);
    const g = l.a - r.a;
    const rev = g < 0;
    if (wantRev !== null && wantRev !== rev && f !== 'both') continue;
    if (Math.abs(r.b) > 60) continue;
    const natural: 'x' | 'v' = wantRev === false && rev ? 'v' : 'x';
    const steps = f === 'dist' ? [`Distribute: ${linH(l)} ${relH(rel)} ${rH}.`] : [];
    if (natural === 'v') steps.push(`Collect the ${X}-terms on the right, where the coefficient is larger: ${nH(l.b - r.b)} ${relH(rel)} ${xt(-g)}.`, `Divide both sides by ${nH(-g)} (positive, keeps the direction): ${nH(v)} ${relH(rel)} ${X}, the same as ${X} ${relH(mirror(rel))} ${nH(v)}.`);
    else if (Math.abs(g - 1) < 1e-9 && near(r.a, 0) && near(l.a, 1)) steps.push(`${l.b >= 0 ? 'Subtract' : 'Add'} ${Math.abs(l.b)} on both sides.`);
    else {
      const gx = Math.abs(g) < 1 && near(1 / Math.abs(g), Math.round(1 / Math.abs(g))) ? `${g < 0 ? '−' : ''}${fr(X, Math.round(1 / Math.abs(g)))}` : xt(g);
      steps.push(`${near(r.a, 0) ? '' : `${r.a > 0 ? 'Subtract' : 'Add'} ${xt(Math.abs(r.a))} on both sides, then `}${l.b > 0 ? 'subtract' : 'add'} ${nH(Math.abs(l.b))} on both sides: ${gx} ${relH(rel)} ${nH(r.b - l.b)}.`.replace(/^s/, 'S').replace(/^a/, 'A'));
      if (near(g, 1)) { steps[steps.length - 1] = steps[steps.length - 1]!.replace(/\.$/, ''); steps.push(`That is the solution set: ${X} ${relH(rel)} ${nH(v)}.`); return { lH, rH, lT, rT, l, r, rel, S, v, rev, natural, steps }; }
      const by = Math.abs(g) < 1 ? `Multiply both sides by ${nH(1 / g)}` : `Divide both sides by ${nH(g)}`;
      steps.push(rev ? `${by}: NEGATIVE, so the symbol turns: ${X} ${relH(flip(rel))} ${nH(v)}.` : `${by} (positive): ${X} ${relH(rel)} ${nH(v)}.`);
    }
    return { lH, rH, lT, rT, l, r, rel, S, v, rev, natural, steps };
  }
}
const relOf = (S: SSet): Rel => { const I = S[0]!; return I.lo === -Infinity ? (I.hiC ? '<=' : '<') : (I.loC ? '>=' : '>'); };
function ineqChoices(I: Ineq, need: 'no' | 'yes' | 'mixed'): Opt[] {
  const r = relOf(I.S), v = I.v;
  const okT = I.natural === 'v' ? eqH(nH(v), X, mirror(r)) : eqH(X, nH(v), r);
  const swapT = I.natural === 'v' ? eqH(X, nH(v), mirror(r)) : eqH(X, nH(v), flip(r));
  const o: Opt[] = [
    { t: okT, ok: true, say: I.rev && I.natural === 'x' ? 'Yes. Dividing by a negative turned the symbol.' : 'Yes.' },
    { t: swapT, mc: I.natural === 'v' ? MC.sideSwap : I.rev ? MC.noRev : MC.revAny, say: I.natural === 'v' ? `${nH(v)} ${relH(mirror(r))} ${X} says ${X} is ${r.startsWith('>') ? 'MORE' : 'LESS'} than ${nH(v)}: read it from ${X}’s side.` : I.rev ? 'You divided by a negative number: the symbol must turn.' : 'No step multiplied or divided by a negative number, so the symbol keeps its direction.' },
    { t: eqH(X, nH(-v), r), mc: MC.signDrop, say: 'Check the sign of the boundary: divide sign and all.' },
    { t: `${X} = ${nH(v)}`, mc: MC.boundaryOnly, say: `${nH(v)} is only the boundary. An inequality is true for a whole ray of numbers.` },
  ];
  void need;
  return o;
}
const ineqSolve: Gen = (R, n) => {
  const I = ineq(R, false);
  const b: Base = { id: `ineqSolve-${n}`, family: 'ineqSolve', board: eqT(I.lT, I.rT, I.rel), prompt: `Solve <b>${eqH(I.lH, I.rH, I.rel)}</b>. Which is the solution set?`,
    picture: { line: xLine(I.S, x => holds(at(I.l, x), I.rel, at(I.r, x)), setT(I.S)) }, solution: I.steps };
  return choice(R, b, distinct(ineqChoices(I, 'no'))!);
};
const ineqGraph: Gen = (R, n) => {
  const I = ineq(R, false);
  const r = relOf(I.S), closed = !strictOf(r), right = r.startsWith('>');
  const g = (c: boolean, rt: boolean) => `${c ? 'Closed' : 'Open'} dot at ${nH(I.v)}, shaded to the ${rt ? 'right' : 'left'}`;
  const b: Base = { id: `ineqGraph-${n}`, family: 'ineqGraph', board: eqT(I.lT, I.rT, I.rel), prompt: `Solve <b>${eqH(I.lH, I.rH, I.rel)}</b>, then pick its graph on the number line.`,
    picture: { line: xLine(I.S, x => holds(at(I.l, x), I.rel, at(I.r, x)), setT(I.S)) }, solution: [...I.steps, `${closed ? 'Closed' : 'Open'} dot: ${nH(I.v)} is ${closed ? '' : 'not '}a solution. Shade toward the numbers that work (${right ? 'bigger' : 'smaller'}).`] };
  return choice(R, b, [
    { t: g(closed, right), ok: true, say: 'Yes.' },
    { t: g(!closed, right), mc: MC.endpoint, say: `${closed ? '≤ and ≥ include the boundary: a closed (filled) dot.' : '< and > leave the boundary out: an open dot.'}` },
    { t: g(closed, !right), mc: I.natural === 'v' ? MC.sideSwap : undefined, say: `Test a number: ${nH(I.v + (right ? 2 : -2))} works, so shade that way.` },
  ]);
};
const revSolve: Gen = (R, n) => {
  const I = ineq(R, R() < 0.55 ? true : null);
  const b: Base = { id: `revSolve-${n}`, family: 'revSolve', board: eqT(I.lT, I.rT, I.rel), prompt: `Solve <b>${eqH(I.lH, I.rH, I.rel)}</b>. Which is the solution set?`,
    picture: { line: xLine(I.S, x => holds(at(I.l, x), I.rel, at(I.r, x)), setT(I.S)) }, solution: I.steps };
  return choice(R, b, distinct(ineqChoices({ ...I, natural: 'x' }, 'mixed'))!);
};
const revStep: Gen = (R, n) => {
  for (;;) {
    const a = nz(R, -6, 6), b = nz(R, -12, 12), c = nz(R, -6, 6), rel = pick(R, ['<', '<=', '>', '>='] as const);
    if (a >= c || Math.abs(a - c) < 2) continue;
    const g = a - c, d = int(R, -15, 15);
    const s1 = c === 0 ? '' : `${c > 0 ? 'Subtract' : 'Add'} ${xt(Math.abs(c))} ${c > 0 ? 'from' : 'to'} both sides`;
    const s2 = `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides`;
    const s3 = `Divide both sides by ${nH(g)}`;
    const opts: Opt[] = [
      { t: s3, ok: true, say: `Yes. ${nH(g)} is negative: dividing by it mirrors the line, so the symbol turns there.` },
      ...(s1 ? [{ t: s1, mc: c < 0 ? MC.revAny : MC.revAdd, say: `${c > 0 ? 'Subtracting' : 'Adding'} an ${X}-term keeps the direction, negative or not.` }] : []),
      { t: s2, mc: b < 0 || d < 0 ? MC.revAny : MC.revAdd, say: 'Adding or subtracting a number never turns the symbol.' },
      { t: 'No step: the symbol never turns', mc: MC.noRev, say: `Dividing by ${nH(g)} does turn it.` },
    ];
    const o = distinct(opts);
    if (!o) continue;
    return choice(R, { id: `revStep-${n}`, family: 'revStep', board: eqT(linT(L(a, b)), linT(L(c, d)), rel),
      prompt: `To solve <b>${eqH(linH(L(a, b)), linH(L(c, d)), rel)}</b>, you collect the ${X}-terms on the LEFT. At which step must the symbol turn around?`,
      solution: [`${s1 ? s1 + ', then ' + s2.toLowerCase() : s2}: ${xt(g)} ${relH(rel)} ${nH(d - b)}. The symbol stays.`, `${s3}: ${nH(g)} is negative, so the symbol turns: ${X} ${relH(flip(rel))} ${nH((d - b) / g)}.`] }, o);
  }
};
const CANCEL = (rel: Rel, all: boolean): Opt[] => [
  { t: EVERY, ok: all || undefined, say: all ? 'Yes. The statement left over is true, whatever x is.' : 'The statement left over is FALSE: no number works.' },
  { t: 'No solution (∅)', ok: !all || undefined, say: !all ? 'Yes. The statement left over is false, whatever x is.' : 'The statement left over is TRUE: every number works.' },
  { t: `${X} = 0`, mc: MC.zeroNone, say: `${X} cancelling does not make ${X} zero. Read the statement that is left.` },
  { t: eqH(X, '0', rel), mc: MC.everyRay, say: `Not every inequality has a boundary: here ${X} cancelled, so the set is ${all ? 'every number' : 'empty'}.` },
];
const ineqCancel: Gen = (R, n) => {
  const a = nz(R, -6, 7), rel = pick(R, ['<', '<=', '>', '>='] as const), kind = pick(R, ['diff', 'diff', 'same', 'dist'] as const);
  const b = nz(R, -9, 9), q = nz(R, -5, 5);
  const lb = kind === 'dist' ? a * q : b;
  const lT = kind === 'dist' ? grpT(a, q) : linT(L(a, b)), lH = kind === 'dist' ? grpH(a, q) : linH(L(a, b));
  const c = kind === 'same' ? b : lb + nz(R, -6, 6);
  const all = holds(lb, rel, c);
  const S = all ? ALL : EMPTY;
  const b0: Base = { id: `ineqCancel-${n}`, family: 'ineqCancel', board: eqT(lT, linT(L(a, c)), rel), prompt: `What is the solution set of <b>${eqH(lH, linH(L(a, c)), rel)}</b>?`,
    picture: { line: { rows: [{ key: 'x', name: 'x', set: S, role: 'link' }], values: [-5, 5], result: setT(S) } },
    solution: [`${kind === 'dist' ? 'Distribute, then ' : ''}${a > 0 ? 'subtract' : 'add'} ${xt(Math.abs(a))} ${a > 0 ? 'from' : 'to'} both sides: ${nH(lb)} ${relH(rel)} ${nH(c)}.`.replace(/^./, ch => ch.toUpperCase()), `That is ${all ? 'true' : 'false'} for every ${X}: ${all ? 'all real numbers' : 'no solution'}.`] };
  return choice(R, b0, CANCEL(rel, all));
};
const constStatement: Gen = (R, n) => {
  const rel = pick(R, ['<', '<=', '>', '>='] as const), a = int(R, 2, 6), same = R() < 0.35;
  const b = int(R, -9, 9), c = same ? b : b + nz(R, -6, 6);
  const k = R() < 0.5 ? 0 : b, left = b - k, right = c - k;
  const all = holds(left, rel, right);
  return choice(R, { id: `constStatement-${n}`, family: 'constStatement', board: `${eqT(linT(L(a, b)), linT(L(a, c)), rel)} \\;\\Rightarrow\\; ${eqT(nT(left), nT(right), rel)}`,
    picture: { lines: { tex: [eqT(linT(L(a, b)), linT(L(a, c)), rel), eqT(nT(left), nT(right), rel)] } },
    prompt: `Solving <b>${eqH(linH(L(a, b)), linH(L(a, c)), rel)}</b> leaves <b>${eqH(nH(left), nH(right), rel)}</b>. What is the solution set of the original?`,
    solution: [`Every step was reversible, so the original has the same solutions as ${eqH(nH(left), nH(right), rel)}.`, `${eqH(nH(left), nH(right), rel)} is ${all ? 'true' : 'false'} whatever ${X} is: ${all ? 'all real numbers' : 'no solution'}.`] }, CANCEL(rel, all));
};

// =====================================================================================================================
// 16 compound-inequalities
// =====================================================================================================================
const compSolve: Gen = (R, n) => {
  for (;;) {
    const m = pick(R, [2, 3, 4, 5, -2, -3, -4]), b = nz(R, -9, 9), u = int(R, -6, 4), w = u + int(R, 1, 6);
    const rl = pick(R, ['<', '<='] as const), rh = pick(R, ['<', '<='] as const);
    const lo = m > 0 ? m * u + b : m * w + b, hi = m > 0 ? m * w + b : m * u + b;
    if (Math.abs(lo) > 30 || Math.abs(hi) > 30) continue;
    const mid = L(m, b), S = solveChain(lo, rl, mid, rh, hi);
    const A = (lo - b) / m, B = (hi - b) / m;
    const partial = solveChain(lo - b, rl, L(m, 0), rh, hi);
    const opts: Opt[] = [{ t: setC(S), ok: true, say: m < 0 ? 'Yes. Dividing all three parts by a negative turned BOTH symbols.' : 'Yes. All three parts, the same steps.' },
      { t: setC(partial), mc: MC.compPartial, say: `Do each step to ALL THREE parts: ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} on the right end too.` }];
    if (m < 0) {
      const noRev = inter(ray(mirror(rl), A), ray(rh, B));
      opts.push({ t: setC(noRev), mc: MC.noRev, say: `Dividing by ${m} turns BOTH symbols.` });
      const one = inter(ray(mirror(flip(rl)), A), ray(rh, B));
      opts.push({ t: setC(one), mc: MC.oneSym, say: 'Both symbols turn, not just one: every part was divided by the negative number.' });
    } else {
      const sw = solveChain(lo, otherStrict(rl), mid, otherStrict(rh), hi);
      opts.push({ t: setC(sw), mc: MC.inclusion, say: '< stays <, and ≤ stays ≤: the ends keep their kind.' });
    }
    const o = distinct(opts);
    if (!o) continue;
    const midT = linT(mid), midH = linH(mid);
    const vals = [lo, hi, lo - b, hi - b, A, B];
    if (Math.max(...vals, 0) - Math.min(...vals, 0) > 18) continue;
    const line: LinePic = {
      rows: [{ key: 'top', name: midT, name2: linT(L(m, 0)), set: solveChain(lo, rl, L(1, 0), rh, hi), role: 'first', numbers: 'above', shift: -b, show: true },
        { key: 'x', name: 'x', set: S, role: 'link', numbers: 'below' }],
      maps: [{ key: 'm', from: 'top', to: 'x', vs: [lo - b, hi - b], op: { kind: 'mul', by: 1 / m } }], values: vals, result: setT(S),
    };
    return choice(R, { id: `compSolve-${n}`, family: 'compSolve', board: `${nT(lo)} ${relT(rl)} ${midT} ${relT(rh)} ${nT(hi)}`, picture: { line },
      prompt: `Solve <b>${nH(lo)} ${relH(rl)} ${midH} ${relH(rh)} ${nH(hi)}</b>.`,
      solution: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} all three parts: ${nH(lo - b)} ${relH(rl)} ${xt(m)} ${relH(rh)} ${nH(hi - b)}.`,
        m > 0 ? `Divide all three parts by ${m}: ${setH(S)}.` : `Divide all three parts by ${nH(m)}: negative, so BOTH symbols turn: ${nH(A)} ${relH(flip(rl))} ${X} ${relH(flip(rh))} ${nH(B)}, that is ${setH(S)}.`] }, o.slice(0, 4));
  }
};
const andOr: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['andB', 'andE', 'andE0', 'orD', 'orA'] as const);
    const u = int(R, -6, 4), w = u + int(R, 1, 6);
    const st = () => pick(R, [true, false]);
    let r1: Rel, v1: number, r2: Rel, v2: number;
    if (kind === 'andB') { r1 = st() ? '>' : '>='; v1 = u; r2 = st() ? '<' : '<='; v2 = w; }
    else if (kind === 'andE') { r1 = st() ? '<' : '<='; v1 = u; r2 = st() ? '>' : '>='; v2 = w; }
    else if (kind === 'andE0') { r1 = '<'; v1 = u; r2 = '>'; v2 = u; }
    else if (kind === 'orD') { r1 = st() ? '<' : '<='; v1 = u; r2 = st() ? '>' : '>='; v2 = w; }
    else { r1 = st() ? '<' : '<='; v1 = w; r2 = st() ? '>' : '>='; v2 = u; }
    const isAnd = kind.startsWith('and');
    const S1 = ray(r1, v1), S2 = ray(r2, v2), S = isAnd ? inter(S1, S2) : union(S1, S2), other = isAnd ? union(S1, S2) : inter(S1, S2);
    // each simple inequality is one step from its ray
    const mk = (r: Rel, v0: number): { t: string; h: string } => {
      if (R() < 0.5) { const k = nz(R, -6, 6); return { t: eqT(`x${sgT(k)}`, nT(v0 + k), r), h: eqH(`${X}${sgH(k)}`, nH(v0 + k), r) }; }
      const p = int(R, 2, 4); return { t: eqT(`${p}x`, nT(p * v0), r), h: eqH(`${p}${X}`, nH(p * v0), r) };
    };
    const e1 = mk(r1, v1), e2 = mk(r2, v2), word = isAnd ? 'and' : 'or';
    const opts: Opt[] = [{ t: setC(S), ok: true, say: isAnd ? 'Yes. “And” keeps the numbers that make BOTH true: the overlap.' : 'Yes. “Or” keeps the numbers that make EITHER one true: both pieces.' },
      { t: setC(other), mc: MC.andOr, say: isAnd ? '“And” needs both to be true: only the overlap.' : '“Or” needs just one to be true: keep both pieces.' }];
    if (kind === 'andE0') opts.push({ t: `${X} = ${nH(u)}`, mc: MC.emptyEnd, say: `${X} = ${nH(u)} makes neither strict inequality true. The rays don’t overlap at all.` });
    if (kind === 'orD') opts.push({ t: `${nH(w)} ${relH(mirror(r2))} ${X} ${relH(r1)} ${nH(u)}`, mc: MC.orChain, say: 'A chain means both at once, and no number is both. “Or” is two separate pieces.' });
    if (kind === 'andB') opts.push({ t: eqH(X, nH(u), r1), mc: MC.oneCond, say: `That keeps only the first condition. Both must hold: ${X} ${relH(r2)} ${nH(w)} too.` });
    if (kind === 'andE' || kind === 'orA') opts.push({ t: kind === 'andE' ? EVERY : NONE, say: 'Draw both rays on one line and look.' });
    const o = distinct(opts);
    if (!o) continue;
    const line: LinePic = { rows: [{ key: 'a', name: e1.t, set: S1, role: 'first', numbers: 'none' }, { key: 'b', name: e2.t, set: S2, role: 'second', numbers: 'none' }, { key: 'x', name: `\\text{${word}}`, set: S, role: 'link' }],
      values: [u, w, v1, v2], result: setT(S) };
    return choice(R, { id: `andOr-${n}`, family: 'andOr', board: `${e1.t} \\ \\text{${word}}\\ ${e2.t}`, picture: { line },
      prompt: `Solve <b>${e1.h}</b> <i>${word}</i> <b>${e2.h}</b>.`,
      solution: [`Solve each: ${eqH(X, nH(v1), r1)} ${word} ${eqH(X, nH(v2), r2)}.`, isAnd ? `“And”: the numbers in BOTH rays (the overlap): ${setH(S)}.` : `“Or”: the numbers in EITHER ray (both pieces): ${setH(S)}.`] }, o);
  }
};
const compContext: Gen = (R, n) => {
  const kind = pick(R, ['ride', 'discount', 'thermo', 'team', 'young'] as const);
  let pr: string, ok: string, opts: Opt[], board: string;
  if (kind === 'ride') {
    const lo = pick(R, [42, 44, 46, 48]), hi = pick(R, [72, 74, 76, 78]);
    pr = `A ride admits riders at least ${lo} in tall and under ${hi} in tall. Which describes the allowed heights ${v('h')}?`; board = `\\text{at least } ${lo}\\ \\text{and under } ${hi}`;
    ok = `${lo} ≤ ${v('h')} &lt; ${hi}`;
    opts = [{ t: ok, ok: true, say: 'Yes: “at least” includes 48, “under” leaves the top out, and “and” means both.' }, { t: `${v('h')} ≥ ${lo} or ${v('h')} &lt; ${hi}`, mc: MC.andOr, say: 'With “or”, every height passes. A rider must meet BOTH conditions.' }, { t: `${lo} &lt; ${v('h')} ≤ ${hi}`, mc: MC.inclusion, say: '“At least” includes the number; “under” does not.' }];
  } else if (kind === 'discount') {
    const lo = pick(R, [10, 12, 13]), hi = pick(R, [60, 62, 65]);
    pr = `A museum gives a discount to visitors under ${lo} or ${hi} and older. Which describes the ages ${v('a')} that get it?`; board = `\\text{under } ${lo}\\ \\text{or } ${hi} \\text{ and older}`;
    ok = `${v('a')} &lt; ${lo} or ${v('a')} ≥ ${hi}`;
    opts = [{ t: ok, ok: true, say: 'Yes: two separate groups, joined by “or”.' }, { t: `${hi} ≤ ${v('a')} &lt; ${lo}`, mc: MC.orChain, say: 'No age is both at least 65 and under 12. Two pieces need “or”.' }, { t: `${v('a')} &lt; ${lo} and ${v('a')} ≥ ${hi}`, mc: MC.andOr, say: '“And” would need both at once: nobody. The sign says “or”.' }];
  } else if (kind === 'thermo') {
    const lo = pick(R, [64, 65, 66, 68]), hi = lo + int(R, 4, 8);
    pr = `A thermostat keeps the temperature ${v('t')} between ${lo} °F and ${hi} °F, inclusive. Which describes ${v('t')}?`; board = `${lo}^\\circ\\text{F to } ${hi}^\\circ\\text{F, inclusive}`;
    ok = `${lo} ≤ ${v('t')} ≤ ${hi}`;
    opts = [{ t: ok, ok: true, say: 'Yes: “inclusive” means both ends count.' }, { t: `${lo} &lt; ${v('t')} &lt; ${hi}`, mc: MC.inclusion, say: '“Inclusive” means the ends count: ≤.' }, { t: `${v('t')} ≤ ${lo} or ${v('t')} ≥ ${hi}`, mc: MC.andOr, say: 'That is OUTSIDE the range. “Between” is the overlap of t ≥ 65 and t ≤ 72.' }];
  } else if (kind === 'team') {
    const lo = pick(R, [8, 9, 10, 11]), hi = lo + int(R, 4, 8);
    pr = `A team roster must have at least ${lo} and at most ${hi} players. Which describes the number of players ${v('n')}?`; board = `\\text{at least } ${lo}\\ \\text{and at most } ${hi}`;
    ok = `${lo} ≤ ${v('n')} ≤ ${hi}`;
    opts = [{ t: ok, ok: true, say: 'Yes: both ends count, and both conditions hold.' }, { t: `${v('n')} ≥ ${lo} or ${v('n')} ≤ ${hi}`, mc: MC.andOr, say: 'With “or” any number works. Both conditions must hold: “and”.' }, { t: `${lo} &lt; ${v('n')} &lt; ${hi}`, mc: MC.inclusion, say: '“At least” and “at most” include the end numbers.' }];
  } else {
    const lo = pick(R, [3, 4, 5, 6]), hi = pick(R, [60, 65, 70]);
    pr = `Bus rides are free for children younger than ${lo} or adults older than ${hi}. Which describes the ages ${v('a')} that ride free?`; board = `\\text{younger than } ${lo}\\ \\text{or older than } ${hi}`;
    ok = `${v('a')} &lt; ${lo} or ${v('a')} &gt; ${hi}`;
    opts = [{ t: ok, ok: true, say: 'Yes: two separate groups, strict at both ends.' }, { t: `${hi} &lt; ${v('a')} &lt; ${lo}`, mc: MC.orChain, say: 'A chain means both at once: no age is. Use “or”.' }, { t: `${v('a')} ≤ ${lo} or ${v('a')} ≥ ${hi}`, mc: MC.inclusion, say: '“Younger than” and “older than” leave the end numbers out.' }];
  }
  return choice(R, { id: `compContext-${n}`, family: 'compContext', board, prompt: pr, solution: ['Translate each condition, keeping “at least / at most / inclusive” (≤, ≥) apart from “under / younger / older than” (&lt;, &gt;).', '“And”: both must hold (one piece between). “Or”: either one (two pieces).'] }, opts);
};

// =====================================================================================================================
// 17 check-original-equation
// =====================================================================================================================
const checkVerdict: Gen = (R, n) => {
  for (;;) {
    const w = worked(R), right = R() < 0.45;
    const cand = right ? w.s : pick(R, [w.s + nz(R, -3, 3), (w.d - w.q) / (w.a - w.c)].filter(c => Number.isFinite(c) && !near(c, w.s) && near(c * 2, Math.round(c * 2))));
    if (cand === undefined || !near(cand * 2, Math.round(cand * 2))) continue;
    const L1 = w.a * (cand + w.q), R1 = w.c * cand + w.d;
    const E = w.lines[0]!;
    const opts: Opt[] = right ? [
      { t: `It is a solution: in the original, both sides are ${nH(L1)}`, ok: true, say: 'Yes. Both sides of the ORIGINAL match.' },
      { t: `It is a solution: she redid her steps the same way and got ${nH(cand)} again`, mc: MC.repeatCheck, say: 'Repeating the same steps can repeat the same slip. Substitute into the original instead.' },
      { t: `It is a solution: ${X} = ${nH(cand)} makes her last line true`, mc: MC.derivedCheck, say: 'Her last line is x = something: it is always true there. Check the ORIGINAL equation.' },
    ] : [
      { t: `It is not: in the original, the left side is ${nH(L1)} and the right side is ${nH(R1)}`, ok: true, say: 'Yes. The sides of the original don’t match, so a step went wrong.' },
      { t: `It is a solution: she redid her steps the same way and got ${nH(cand)} again`, mc: MC.repeatCheck, say: `Repeating the same steps repeats the same slip. In the original: ${nH(L1)} ≠ ${nH(R1)}.` },
      { t: `It is a solution: ${X} = ${nH(cand)} makes her last line true`, mc: MC.derivedCheck, say: `A derived line can be wrong. In the original: ${nH(L1)} ≠ ${nH(R1)}.` },
    ];
    return choice(R, { id: `checkVerdict-${n}`, family: 'checkVerdict', board: E.tex,
      prompt: `Ana solved <b>${E.html}</b> and got ${X} = ${nH(cand)}. Is that a solution? Pick the valid check.`,
      solution: [`Substitute ${X} = ${nH(cand)} into the ORIGINAL, each side on its own.`, `Left: ${w.a}(${nH(cand)}${sgH(w.q)}) = ${nH(L1)}. Right: ${nH(w.c)} · ${cand < 0 ? `(${nH(cand)})` : nH(cand)}${sgH(w.d)} = ${nH(R1)}.`, near(L1, R1) ? 'Equal, so it is a solution.' : 'Not equal, so it is not a solution.'] }, opts);
  }
};
const checkSide: Gen = (R, n) => {
  const w = worked(R), cand = w.s + (R() < 0.5 ? 0 : nz(R, -2, 2)), left = R() < 0.5;
  const val = left ? w.a * (cand + w.q) : w.c * cand + w.d;
  const derived = left ? (w.a - w.c) * cand + w.a * w.q : w.d;
  const E = w.lines[0]!;
  return numItem({ id: `checkSide-${n}`, family: 'checkSide', board: E.tex, prompt: `Check ${X} = ${nH(cand)} in the ORIGINAL equation <b>${E.html}</b>. What is the value of its ${left ? 'left' : 'right'} side?`,
    solution: [`Put ${nH(cand)} in for ${X} in the ${left ? 'left' : 'right'} side of the original: ${left ? `${w.a}(${nH(cand)}${sgH(w.q)})` : `${nH(w.c)} · ${cand < 0 ? `(${nH(cand)})` : nH(cand)}${sgH(w.d)}`}.`, `= ${ans(nH(val))}.`] }, val,
    `Yes: ${nH(val)}. Now compare it with the other side.`, [[derived, MC.derivedCheck, 'That is a side of a later line. Check in the ORIGINAL equation.'], [left ? w.a * cand + w.q : w.c * (cand + w.d), MC.partialDist, left ? `${w.a} multiplies the whole group (${nH(cand)}${sgH(w.q)}).` : `Multiply first, then add.`]],
    `Substitute into the original ${left ? 'left' : 'right'} side: ${nH(val)}.`);
};
const firstBad: Gen = (R, n) => {
  for (;;) {
    const w = worked(R), j = int(R, 2, 4), { a, q, c, d } = w, g = a - c, aq = a * q;
    const L2 = j === 2 ? L(a, q) : L(a, aq);
    let lines: string[];
    let fx: number;
    if (j === 2) { const g2 = g; fx = (d - q) / g2; lines = [eqT(linT(L2), linT(L(c, d))), eqT(linT(L(g, q)), nT(d)), eqT(linT(L(g, 0)), nT(d - q)), eqT('x', nT(fx))]; }
    else if (j === 3) { const g2 = a + c; fx = (d - aq) / g2; lines = [eqT(linT(L2), linT(L(c, d))), eqT(linT(L(g2, aq)), nT(d)), eqT(linT(L(g2, 0)), nT(d - aq)), eqT('x', nT(fx))]; }
    else { fx = (d + aq) / g; lines = [eqT(linT(L2), linT(L(c, d))), eqT(linT(L(g, aq)), nT(d)), eqT(linT(L(g, 0)), nT(d + aq)), eqT('x', nT(fx))]; }
    if (near(fx, w.s) || !near(fx * 4, Math.round(fx * 4))) continue;
    const tex = [w.lines[0]!.tex, ...lines].map((t, i) => `\\text{${i + 1}}\\quad ${t}`);
    const why = j === 2 ? `${a}(${X}${sgH(q)}) is ${linH(L(a, aq))}: the ${nH(q)} must be multiplied by ${a} too.` : j === 3 ? `Subtracting ${xt(c)} from both sides gives ${xt(g)} on the left, not ${xt(a + c)}.` : `${aq > 0 ? 'Subtracting' : 'Adding'} ${Math.abs(aq)} on both sides changes the right side to ${nH(d - aq)}, not ${nH(d + aq)}.`;
    return choice(R, { id: `firstBad-${n}`, family: 'firstBad', board: tex.join(' \\\\ '), picture: { lines: { tex } },
      prompt: `The check fails: ${X} = ${nH(fx)} does not solve line 1. Which line is the FIRST invalid step?`,
      solution: [`Check each step against the line before it.`, `Line ${j}: ${why}`] }, [2, 3, 4, 5].map(k => ({
      t: `Line ${k}`, ok: k === j || undefined, say: k === j ? `Yes. ${why}` : k < j ? `Line ${k} follows correctly from line ${k - 1}.` : `Line ${k} follows from line ${k - 1}, but an earlier step was already wrong. Find the first one.`,
    })));
  }
};

// =====================================================================================================================
// 18 boundary-test-points, 19 prove-complete-set
// =====================================================================================================================
const testPoint: Gen = (R, n) => {
  for (;;) {
    const I = ineq(R, R() < 0.6 ? true : null);
    const wrong = R() < 0.5;
    const claim = wrong ? ray(flip(relOf(I.S)), I.v) : I.S;
    const t = I.v + pick(R, [-3, -2, -1, 1, 2, 3]);
    const T = holds(at(I.l, t), I.rel, at(I.r, t)), C = member(claim, t);
    const agree = T === C;
    if (wrong && agree && R() < 0.7) continue;
    const opts: Opt[] = [
      { t: `The claim is wrong: ${X} = ${nH(t)} makes the inequality ${T ? 'true' : 'false'}, but ${nH(t)} is ${C ? '' : 'not '}in the claimed set`, ok: !agree || undefined, say: agree ? `${X} = ${nH(t)} makes it ${T ? 'true' : 'false'}, and the claim agrees.` : 'Yes. One disagreeing test is enough to show the claim is wrong.' },
      { t: `No error found: ${X} = ${nH(t)} agrees with the claim, but one test can’t prove the whole set`, ok: agree || undefined, say: agree ? 'Yes. A test that agrees is only evidence. Test the boundary and the other side too.' : `Look again: the inequality is ${T ? 'true' : 'false'} at ${nH(t)}, but the claim says ${C ? 'it is in' : 'it is not in'} the set.` },
      agree ? { t: `The claim is proved: ${X} = ${nH(t)} agrees with it`, mc: MC.oneTest, say: 'One agreeing test can’t prove a whole ray: a missed flip can still agree at some points.' }
        : { t: 'Nothing: only the boundary value can test a claim', say: `Any number can catch an error: at ${nH(t)} the claim and the inequality disagree.` },
    ];
    const line: LinePic = { rows: [{ key: 'x', name: '\\text{claim}', set: claim, role: 'pick', dashed: true, show: true }], tests: [{ key: 't0', row: 'x', v: t, ok: T }], values: [I.v, t], result: setT(I.S) };
    return choice(R, { id: `testPoint-${n}`, family: 'testPoint', board: eqT(I.lT, I.rT, I.rel), picture: { line },
      prompt: `Someone claims the solution set of <b>${eqH(I.lH, I.rH, I.rel)}</b> is <b>${setH(claim)}</b>. Test ${X} = ${nH(t)} in the ORIGINAL. What does it show?`,
      solution: [`At ${X} = ${nH(t)}: left ${nH(at(I.l, t))}, right ${nH(at(I.r, t))}, so the inequality is ${T ? 'true' : 'false'}.`, `The claim says ${nH(t)} is ${C ? '' : 'not '}in the set: ${agree ? 'they agree (evidence, not proof)' : 'they disagree, so the claim is wrong'}.`] }, opts);
  }
};
const whichTests: Gen = (R, n) => {
  const r = pick(R, ['<', '<=', '>', '>='] as const), v = niceV(R, -6, 6, 0.3), d = Number.isInteger(v) ? pick(R, [1, 2]) : 0.5;
  const side = r.startsWith('>') ? 1 : -1;
  return choice(R, { id: `whichTests-${n}`, family: 'whichTests', board: eqT('x', nT(v), r), prompt: `A claimed solution set is <b>${eqH(X, nH(v), r)}</b>. Which three test values check it best (in the original inequality)?`,
    solution: ['The boundary should make the two sides equal.', 'A number on the claimed side should make it true, and one on the other side false.', `Best: the boundary ${nH(v)}, and one number on each side of it.`] }, [
    { t: `${nH(v - d)}, ${nH(v)} and ${nH(v + d)}`, ok: true, say: 'Yes: the boundary and one point on each side. That catches a wrong boundary and a missed flip.' },
    { t: `${nH(v + side * d)}, ${nH(v + side * 2 * d)} and ${nH(v + side * 3 * d)}`, mc: MC.oneTest, say: 'All three sit on the claimed side, so a wrong boundary or a missed flip can slip through. Test the boundary and the other side too.' },
    { t: `${nH(v)} only`, mc: MC.boundaryOnly, say: 'The boundary only checks the end. Test a point on each side too.' },
  ]);
};
const completeArg: Gen = (R, n) => {
  const kind = pick(R, ['one', 'ray', 'all', 'none'] as const), a = int(R, 2, 6), b = nz(R, -9, 9), s = nz(R, -6, 8);
  let E: string, Et: string, claim: string, ok: string, ex: string, third: Opt;
  if (kind === 'one') { const r = a * s + b; E = eqH(linH(L(a, b)), nH(r)); Et = eqT(linT(L(a, b)), nT(r)); claim = `${X} = ${nH(s)}`;
    ok = `Each step (${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}, divide by ${a}) can be undone, so the equation has exactly the solutions of ${X} = ${nH(s)}`;
    ex = `${X} = ${nH(s)} makes both sides ${nH(r)}, so it is the only solution`; third = { t: `${X} = ${nH(s)} is the answer the steps gave, so nothing else needs saying`, mc: MC.noJust, say: 'The answer needs its reasons: the steps must be reversible.' }; }
  else if (kind === 'ray') { const rel = pick(R, ['<', '>', '<=', '>='] as const), r = a * s + b; E = eqH(linH(L(a, b)), nH(r), rel); Et = eqT(linT(L(a, b)), nT(r), rel); claim = eqH(X, nH(s), rel);
    ok = `Each step (${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}, divide by positive ${a}) can be undone, so the inequality has exactly the solutions of ${claim}`;
    ex = `${nH(s + (rel.startsWith('>') ? 1 : -1))}, ${nH(s + (rel.startsWith('>') ? 5 : -5))} and ${nH(s + (rel.startsWith('>') ? 10 : -10))} all work`; third = { t: `${X} = ${nH(s)} makes both sides equal, so the set starts there`, mc: MC.boundaryOnly, say: 'The boundary is one number. The argument must cover every number.' }; }
  else if (kind === 'all') { E = eqH(grpH(a, b), linH(L(a, a * b))); Et = eqT(grpT(a, b), linT(L(a, a * b))); claim = 'all real numbers';
    ok = `Distributing gives ${linH(L(a, a * b))} = ${linH(L(a, a * b))}: the same expression on both sides, true for every ${X}`;
    ex = `${X} = 0, 1 and 5 all work`; third = { t: `${X} cancels, so ${X} = 0`, mc: MC.zeroNone, say: `${X} cancelling leaves a true statement: every number works.` }; }
  else { E = eqH(linH(L(a, b)), linH(L(a, b + nz(R, 1, 5)))); Et = eqT(linT(L(a, b)), linT(L(a, b + 3))); claim = 'no solution';
    ok = `Subtracting ${a}${X} from both sides (reversible) leaves a false statement, false for every ${X}`;
    ex = `${X} = 0 and ${X} = 5 don’t work`; third = { t: 'There must be a mistake: equations always have a solution', mc: MC.noneError, say: 'No mistake: some equations have no solution.' }; }
  return choice(R, { id: `completeArg-${n}`, family: 'completeArg', board: Et, prompt: `Which argument proves that the solution set of <b>${E}</b> is exactly <b>${claim}</b>?`,
    solution: ['Testing numbers checks only those numbers, never the infinitely many others.', 'A chain of reversible steps shows the set is complete: nothing lost, nothing gained.'] }, [
    { t: ok, ok: true, say: 'Yes. Reversible steps prove the set is all and only the solutions.' },
    { t: ex, mc: MC.examples, say: 'Checked examples only show those numbers. They can’t prove anything about all the others.' },
    third,
  ]);
};
const memberVsAll: Gen = (R, n) => {
  const a = int(R, 2, 6), b = nz(R, -9, 9), rel = pick(R, ['>', '>=', '<', '<='] as const), s = nz(R, -6, 6), r = a * s + b;
  const t = s + (rel.startsWith('>') ? int(R, 1, 4) : -int(R, 1, 4));
  return choice(R, { id: `memberVsAll-${n}`, family: 'memberVsAll', board: eqT(linT(L(a, b)), nT(r), rel),
    prompt: `${X} = ${nH(t)} makes <b>${eqH(linH(L(a, b)), nH(r), rel)}</b> true. What has this check shown?`,
    solution: [`A check shows that ONE number, ${nH(t)}, is in the solution set.`, 'To know the whole set, solve with reversible steps.'] }, [
    { t: `Only that ${nH(t)} is a solution; it says nothing about other numbers`, ok: true, say: 'Yes. Membership of one number, not the whole set.' },
    { t: `That the solution set is ${eqH(X, nH(t), rel.startsWith('>') ? '>=' : '<=')}`, mc: MC.oneTest, say: 'One test can’t give the boundary. Solve it: the boundary is ' + nH(s) + '.' },
    { t: `That every ${rel.startsWith('>') ? 'bigger' : 'smaller'} number is a solution too`, mc: MC.examples, say: 'True here, but one check can’t show it. The reversible steps show it.' },
  ]);
};

// =====================================================================================================================
// 20 contextual-domain, 21 validate-model
// =====================================================================================================================
const money = (v: number) => (Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`);
const viable: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['tickets', 'hours', 'buses', 'boxes'] as const);
    if (kind === 'tickets') {
      const fee = pick(R, [4, 5, 6, 8]), price = pick(R, [3.5, 4.5, 6.5, 7.5, 2.75]), budget = pick(R, [40, 50, 60, 75, 80]);
      const raw = (budget - fee) / price, f = raw - Math.floor(raw);
      if (f < 0.5 || Number.isInteger(raw)) continue;
      const ans0 = Math.floor(raw);
      return numItem({ id: `viable-${n}`, family: 'viable', board: `${fee} + ${price}n \\le ${budget}`, unit: 'tickets',
        prompt: `(calculator) A booking fee of ${money(fee)} plus ${money(price)} per ticket must stay within a ${money(budget)} budget: <b>${fee} + ${price}${v('n')} ≤ ${budget}</b>. What is the greatest number of tickets?`,
        solution: [`${v('n')} ≤ (${budget} − ${fee}) ÷ ${price} ≈ ${raw.toFixed(2)}.`, `Tickets come in whole numbers, and ${Math.ceil(raw)} would go over the budget. So round DOWN: ${ans(ans0)} tickets.`] }, ans0,
        `Yes: ${ans0} tickets. ${Math.ceil(raw)} would cost ${money(fee + price * Math.ceil(raw))}, over the budget.`, [[Math.ceil(raw), MC.roundNear, `${Math.ceil(raw)} tickets cost ${money(fee + price * Math.ceil(raw))}: over the budget. An “at most” limit rounds DOWN.`], [Math.round(raw * 100) / 100, MC.fracCount, 'You can’t buy part of a ticket: whole numbers only.']],
        `Solve, then keep only whole numbers inside the limit: ${ans0}.`);
    }
    if (kind === 'hours') {
      const pay = pick(R, [12, 14, 15, 16, 18]), goal = pick(R, [500, 550, 600, 650, 700, 800]);
      const raw = goal / pay, f = raw - Math.floor(raw);
      if (f >= 0.5 || f < 0.05) continue;
      const a0 = Math.ceil(raw);
      return numItem({ id: `viable-${n}`, family: 'viable', board: `${pay}h \\ge ${goal}`, unit: 'hours',
        prompt: `(calculator) Jo earns ${money(pay)} an hour and needs at least ${money(goal)}: <b>${pay}${v('h')} ≥ ${goal}</b>. She works whole hours. What is the least number of hours?`,
        solution: [`${v('h')} ≥ ${goal} ÷ ${pay} ≈ ${raw.toFixed(2)}.`, `${Math.floor(raw)} hours earn only ${money(pay * Math.floor(raw))}. An “at least” goal rounds UP: ${ans(a0)} hours.`] }, a0,
        `Yes: ${a0} hours earn ${money(pay * a0)}.`, [[Math.floor(raw), MC.roundNear, `${Math.floor(raw)} hours earn ${money(pay * Math.floor(raw))}: not enough. An “at least” goal rounds UP.`], [Math.round(raw * 100) / 100, MC.fracCount, 'She works whole hours.']],
        `Solve, then round in the direction the goal needs: ${a0}.`);
    }
    if (kind === 'buses') {
      const cap = pick(R, [44, 48, 52, 56]), kids = int(R, 150, 400), raw = kids / cap, f = raw - Math.floor(raw);
      if (f >= 0.5 || f < 0.05) continue;
      const a0 = Math.ceil(raw);
      return numItem({ id: `viable-${n}`, family: 'viable', board: `${cap}b \\ge ${kids}`, unit: 'buses',
        prompt: `(calculator) ${kids} students go on a trip; each bus seats ${cap}: <b>${cap}${v('b')} ≥ ${kids}</b>. How many buses are needed?`,
        solution: [`${v('b')} ≥ ${kids} ÷ ${cap} ≈ ${raw.toFixed(2)}.`, `${Math.floor(raw)} buses seat only ${cap * Math.floor(raw)}. Round UP: ${ans(a0)} buses.`] }, a0,
        `Yes: ${a0} buses seat ${cap * a0}.`, [[Math.floor(raw), MC.roundNear, `${Math.floor(raw)} buses seat ${cap * Math.floor(raw)}: some students are left behind. Round UP.`], [Math.round(raw * 100) / 100, MC.fracCount, 'Buses come whole.']], `Round up: ${a0}.`);
    }
    const limit = pick(R, [1000, 1200, 1500, 2000]), cart = pick(R, [150, 180, 200, 250]), box0 = pick(R, [35, 40, 45, 55, 65]);
    const raw = (limit - cart) / box0, f = raw - Math.floor(raw);
    if (f < 0.5 || Number.isInteger(raw)) continue;
    const a0 = Math.floor(raw);
    return numItem({ id: `viable-${n}`, family: 'viable', board: `${cart} + ${box0}x \\le ${limit}`, unit: 'boxes',
      prompt: `(calculator) An elevator holds at most ${limit} lb. A ${cart}-lb cart carries boxes of ${box0} lb: <b>${cart} + ${box0}${X} ≤ ${limit}</b>. How many boxes at most?`,
      solution: [`${X} ≤ (${limit} − ${cart}) ÷ ${box0} ≈ ${raw.toFixed(2)}.`, `Whole boxes only, and ${Math.ceil(raw)} would go over: round DOWN to ${ans(a0)}.`] }, a0,
      `Yes: ${a0} boxes.`, [[Math.ceil(raw), MC.roundNear, `${Math.ceil(raw)} boxes weigh ${cart + box0 * Math.ceil(raw)} lb: over the limit. Round DOWN.`], [Math.round(raw * 100) / 100, MC.fracCount, 'Whole boxes only.']], `Round down: ${a0}.`);
  }
};
const domainPick: Gen = (R, n) => {
  const count = R() < 0.6, m = int(R, 5, 14) + pick(R, [0.25, 0.4, 0.6, 0.75]);
  const what = count ? pick(R, ['tickets', 'shirts', 'songs', 'guests']) : pick(R, ['gallons of gas', 'pounds of apples', 'hours of parking', 'miles of driving']);
  const vv = count ? 'n' : 'x';
  const mm = Math.round(m * 100) / 100;
  const opts: Opt[] = count ? [
    { t: `0, 1, 2, …, ${Math.floor(m)}`, ok: true, say: `Yes: whole numbers from 0 up to ${Math.floor(m)}.` },
    { t: `Any number from 0 to ${mm}`, mc: MC.fracCount, say: `You can’t buy ${pick(R, ['2.5', '3.4'])} ${what}: whole numbers only.` },
    { t: `Any number less than or equal to ${mm}`, mc: MC.allReals, say: `Negative ${what} make no sense, and neither do parts of one.` },
  ] : [
    { t: `Any number from 0 to ${mm}`, ok: true, say: `Yes: ${what} can be any amount from 0 up to ${mm}.` },
    { t: `0, 1, 2, …, ${Math.floor(m)} only`, say: `${Cap(what)} can be measured in parts: 2.5 makes sense.` },
    { t: `Any number less than or equal to ${mm}`, mc: MC.allReals, say: 'A negative amount makes no sense here.' },
  ];
  return choice(R, { id: `domainPick-${n}`, family: 'domainPick', board: `${vv} \\le ${mm}`,
    prompt: `${v(vv)} is the number of ${what} you can afford. The budget inequality gives <b>${v(vv)} ≤ ${mm}</b>. Which values of ${v(vv)} make sense?`,
    solution: [`The algebra says ${v(vv)} ≤ ${mm}.`, `The context adds: ${count ? 'a count is a whole number' : 'an amount can be a part'}, and it can’t be negative.`] }, opts);
};
/** a short inequality in HTML (italic letters, ≤ ≥ &lt; &gt;) as TeX */
const htmlTex = (h0: string) => h0.replace(/<[^>]+>/g, '').replace(/≤/g, '\\le ').replace(/≥/g, '\\ge ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/−/g, '-');
/** the board of a model item: the limit or goal in words, so the slate carries the constraint, not the answer */
const storyTex = (C: Ctx) => `\\text{${C.dir === '<=' ? 'at most' : 'at least'} }${C.limit}`;
interface Ctx { limit: string; story: string; model: string; swapped: string; roles: string; strict: string; dir: '<=' | '>='; solved: string; swappedSolved: string }
function context(R: () => number): Ctx {
  const kind = pick(R, ['gym', 'earn', 'elev', 'taxi', 'save'] as const);
  if (kind === 'gym') { const f = pick(R, [20, 25, 30]), c = pick(R, [4, 5, 6]), B = pick(R, [60, 70, 80]); return { limit: `\\$${B}\\text{ a month}`, story: `A gym charges ${money(f)} a month plus ${money(c)} per class. Maya can spend at most ${money(B)} a month on ${v('c')} classes.`, model: `${f} + ${c}${v('c')} ≤ ${B}`, swapped: `${f} + ${c}${v('c')} ≥ ${B}`, roles: `${f}${v('c')} + ${c} ≤ ${B}`, strict: `${f} + ${c}${v('c')} &lt; ${B}`, dir: '<=', solved: `${v('c')} ≤ ${nH((B - f) / c)}`, swappedSolved: `${v('c')} ≥ ${nH((B - f) / c)}` }; }
  if (kind === 'earn') { const base = pick(R, [20, 30, 40]), w = pick(R, [10, 12, 15]), G = pick(R, [150, 180, 210]); return { limit: `\\$${G}\\text{ a week}`, story: `Leo gets ${money(base)} a week plus ${money(w)} per hour. He needs to earn at least ${money(G)} a week in ${v('h')} hours.`, model: `${base} + ${w}${v('h')} ≥ ${G}`, swapped: `${base} + ${w}${v('h')} ≤ ${G}`, roles: `${base}${v('h')} + ${w} ≥ ${G}`, strict: `${base} + ${w}${v('h')} &gt; ${G}`, dir: '>=', solved: `${v('h')} ≥ ${nH((G - base) / w)}`, swappedSolved: `${v('h')} ≤ ${nH((G - base) / w)}` }; }
  if (kind === 'elev') { const cart = pick(R, [150, 200]), b = pick(R, [40, 50]), cap = pick(R, [1000, 1200]); return { limit: `${cap}\\text{ lb}`, story: `An elevator holds at most ${cap} lb. A ${cart}-lb cart carries ${v('b')} boxes of ${b} lb each.`, model: `${cart} + ${b}${v('b')} ≤ ${cap}`, swapped: `${cart} + ${b}${v('b')} ≥ ${cap}`, roles: `${cart}${v('b')} + ${b} ≤ ${cap}`, strict: `${cart} + ${b}${v('b')} &lt; ${cap}`, dir: '<=', solved: `${v('b')} ≤ ${nH((cap - cart) / b)}`, swappedSolved: `${v('b')} ≥ ${nH((cap - cart) / b)}` }; }
  if (kind === 'taxi') { const f = pick(R, [4, 5, 6]), c = pick(R, [2, 3]), B = pick(R, [25, 30, 35]); return { limit: `\\$${B}`, story: `A taxi charges ${money(f)} plus ${money(c)} per mile. Ana has at most ${money(B)} for a ride of ${v('m')} miles.`, model: `${f} + ${c}${v('m')} ≤ ${B}`, swapped: `${f} + ${c}${v('m')} ≥ ${B}`, roles: `${f}${v('m')} + ${c} ≤ ${B}`, strict: `${f} + ${c}${v('m')} &lt; ${B}`, dir: '<=', solved: `${v('m')} ≤ ${nH((B - f) / c)}`, swappedSolved: `${v('m')} ≥ ${nH((B - f) / c)}` }; }
  const s0 = pick(R, [40, 60, 80]), wk = pick(R, [15, 20, 25]), G = pick(R, [300, 400, 500]);
  return { limit: `\\$${G}`, story: `Sam has ${money(s0)} saved and adds ${money(wk)} a week. He wants at least ${money(G)} after ${v('w')} weeks.`, model: `${s0} + ${wk}${v('w')} ≥ ${G}`, swapped: `${s0} + ${wk}${v('w')} ≤ ${G}`, roles: `${s0}${v('w')} + ${wk} ≥ ${G}`, strict: `${s0} + ${wk}${v('w')} &gt; ${G}`, dir: '>=', solved: `${v('w')} ≥ ${nH((G - s0) / wk)}`, swappedSolved: `${v('w')} ≤ ${nH((G - s0) / wk)}` };
}
const modelCheck: Gen = (R, n) => {
  const C = context(R);
  return choice(R, { id: `modelCheck-${n}`, family: 'modelCheck', board: storyTex(C), prompt: `${C.story} Which inequality models the situation?`,
    solution: [`The fixed amount plus the rate times the unknown: the total.`, `${C.dir === '<=' ? '“At most” means the total can equal the limit or be less: ≤' : '“At least” means the total can equal the goal or be more: ≥'}.`, `So: ${C.model}`] }, [
    { t: C.model, ok: true, say: 'Yes. Fixed part plus rate times the unknown, and the right symbol.' },
    { t: C.swapped, say: C.dir === '<=' ? '“At most” is a ceiling: the total must be ≤ the limit.' : '“At least” is a floor: the total must be ≥ the goal.' },
    { t: C.roles, say: 'The rate multiplies the unknown; the fixed amount is added once.' },
    { t: C.strict, mc: MC.inclusion, say: `“At ${C.dir === '<=' ? 'most' : 'least'}” includes the limit itself: use ${C.dir === '<=' ? '≤' : '≥'}.` },
  ]);
};
const critique: Gen = (R, n) => {
  const C = context(R), good = R() < 0.4;
  const m = good ? C.model : C.swapped, sol = good ? C.solved : C.swappedSolved;
  return choice(R, { id: `critique-${n}`, family: 'critique', board: htmlTex(m), prompt: `${C.story} Sam writes <b>${m}</b> and solves it correctly: <b>${sol}</b>. Is his answer right for the situation?`,
    solution: [`Check the MODEL against the words, not just the algebra.`, good ? `The model says ${C.dir === '<=' ? 'at most' : 'at least'} with the right symbol, and the algebra is right.` : `The story says “at ${C.dir === '<=' ? 'most' : 'least'}”, so the symbol must be ${C.dir === '<=' ? '≤' : '≥'}. The model is wrong, so the answer is wrong.`] }, good ? [
    { t: 'Yes: the model fits the words and the algebra is right', ok: true, say: 'Yes. Both parts check out.' },
    { t: 'No: the symbol should point the other way', say: `“At ${C.dir === '<=' ? 'most' : 'least'}” is ${C.dir === '<=' ? '≤' : '≥'}: that is what Sam wrote.` },
    { t: 'No: word problems need an equation, not an inequality', say: 'A limit or a goal is an inequality.' },
  ] : [
    { t: `No: the model is wrong. “At ${C.dir === '<=' ? 'most' : 'least'}” needs ${C.dir === '<=' ? '≤' : '≥'}, so his answer points the wrong way`, ok: true, say: 'Yes. Right algebra on a wrong model gives a wrong answer.' },
    { t: 'Yes: his algebra is correct, so the answer is right', mc: MC.computeOk, say: `Correct algebra can’t fix a wrong model. The story says “at ${C.dir === '<=' ? 'most' : 'least'}”.` },
    { t: 'No: he made an algebra mistake', say: 'His algebra is fine. The model is the problem.' },
  ]);
};

// =====================================================================================================================
export type FamilyId = keyof typeof GENS;
const GENS = {
  sameSet, pickEquiv, undoStep, whyKeeps, badStep, lostSolution, keepDir, stepIneq, flipNum, doesFlip, reasonFor, propName, chainSolve, nextReason,
  bothSolve, collectSide, howMany, whySet, lcdSolve, lcdLine, rearrange, formulaCheck, nonzeroCond, paramCases, paramValue, ineqSolve, ineqGraph,
  revSolve, revStep, ineqCancel, constStatement, compSolve, andOr, compContext, checkVerdict, checkSide, firstBad, testPoint, whichTests,
  completeArg, memberVsAll, viable, domainPick, modelCheck, critique,
} as const;
/** a generator whose line picture always lays out: retry (same seeded stream), else drop the picture (slate) */
const fitted = (g: Gen): Gen => (R, n, sg) => {
  let it = g(R, n, sg);
  for (let k = 0; k < 25 && it.picture?.line && !picFits(it.picture.line); k++) it = g(R, n, sg);
  if (it.picture?.line && !picFits(it.picture.line)) it.picture = undefined;
  return it;
};
export const GENERATORS: Record<string, Gen> = Object.fromEntries(Object.entries(GENS).map(([k, g]) => [k, fitted(g)]));
export const FAMILY_NAMES: Record<string, string> = {
  sameSet: 'Same solution set?', pickEquiv: 'Which is equivalent?', undoStep: 'Undo the step', whyKeeps: 'Why the step is safe', badStep: 'Which step is unsafe?',
  lostSolution: 'Lost or gained solutions', keepDir: 'Keep the order', stepIneq: 'One safe step', flipNum: 'Mirror through 0', doesFlip: 'Flip or keep?',
  reasonFor: 'Give the reason', propName: 'Name the property', chainSolve: 'Solve with reasons', nextReason: 'Next line and its reason', bothSolve: 'x on both sides',
  collectSide: 'Which side to collect on', howMany: 'One, none or all?', whySet: 'Why that set?', lcdSolve: 'Clear the fractions', lcdLine: 'Multiply every term',
  rearrange: 'Solve for a letter', formulaCheck: 'Rearrange, then use it', nonzeroCond: 'The nonzero condition', paramCases: 'When the parameter is 0', paramValue: 'Find the parameter',
  ineqSolve: 'Solve the inequality', ineqGraph: 'Graph the set', revSolve: 'Flip or not?', revStep: 'Where the symbol turns', ineqCancel: 'When x cancels',
  constStatement: 'Read the leftover statement', compSolve: 'Three-part inequality', andOr: 'And or or', compContext: 'Write the compound', checkVerdict: 'Check in the original',
  checkSide: 'Evaluate a side', firstBad: 'Find the first bad step', testPoint: 'Test the claim', whichTests: 'Choose test points', completeArg: 'Which argument proves it?',
  memberVsAll: 'What a check shows', viable: 'Round the right way', domainPick: 'Which values make sense?', modelCheck: 'Pick the model', critique: 'Model or algebra?',
};
void terminates;
