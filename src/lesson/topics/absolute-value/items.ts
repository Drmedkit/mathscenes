// items.ts: practice families for "Absolute value functions and equations" (Algebra 1, secondary-t7-13). Every family
// is generated from its sub-goal's cases (topic JSON), checked exactly (av.ts), and every wrong answer the classifier
// recognises carries its catalogue id (math-curriculum-essentials/misconceptions.json). Pictures (item.picture):
//   g      one graph on the kit Plane (piecewise-functions GPic); `parts` are drawn with the question, `reveal` on the
//          replay after a miss. A graph that IS the answer has no parts: the board sits on a big slate first.
//   opts   two or three option graphs A, B, C across the stage
//   line   a number line (SetLine): the bare line with the question, the set / center / arcs / tests on the replay
//   slate  worked lines (branches, candidates) stacked on a big slate
// Pure: no DOM.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { fits } from '../piecewise-functions/pic';
import { cst, lin } from '../piecewise-functions/pw';
import {
  type AbsF, type GPart, type GPic, type NumPic, type Rel, type SSet,
  D, DT, P, PT, absAt, absH, absIneq, absT, branchesOf, clean, crossParts, flipRel, half, inH, inT, inWin, linStrH, linStrT,
  near, nH, nice, relH, relT, solveEq, vParts, vWindow, win, ray, union, EMPTY,
} from './av';
import { lineFits } from './line';

// ---------- misconception ids ----------
export const MC = {
  plusMinus: 'mc.integers.abs-as-plus-minus',
  parts: 'mc.integers.abs-applied-to-parts',
  coefIn: 'mc.linear-equations.abs-coefficient-inside-bars',
  distSub: 'mc.integers.abs-distributed-over-subtraction',
  signZero: 'mc.quadratic-polynomial.wrong-sign-zero-factor',
  negDist: 'mc.integers.distance-reported-negative',
  wrongSides: 'mc.functions-concept.abs-pieces-wrong-sign',
  several: 'mc.functions-concept.uses-several-pieces-for-one-input',
  minusNeg: 'mc.integers.minus-sign-means-negative',
  firstTerm: 'mc.integers.distribute-negative-first-term-only',
  bpZero: 'mc.functions-concept.abs-breakpoint-at-zero',
  rounded: 'mc.functions-concept.abs-graph-rounded',
  rangeAll: 'mc.functions-concept.range-defaults-to-all-reals',
  vShiftBoth: 'mc.functions-concept.vertical-shift-moves-both-coordinates',
  rangeParent: 'mc.functions-concept.range-copied-from-parent',
  shiftScale: 'mc.functions-concept.shift-before-scale',
  oneBranch: 'mc.functions-concept.reflects-one-branch',
  axisSwap: 'mc.functions-concept.reflection-axis-swap',
  inOut: 'mc.functions-concept.inside-outside-confusion',
  noRev: 'mc.linear-equations.no-reversal-for-negative',
  zeroBxC: 'mc.quadratic-polynomial.zero-of-bx-c-as-c',
  ignoreIn: 'mc.linear-equations.abs-plus-minus-c-ignoring-inside',
  andOr: 'mc.linear-equations.and-or-confused',
  onlyOne: 'mc.integers.only-one-number-per-abs',
  twice: 'mc.linear-equations.abs-repeated-root-twice',
  negBranches: 'mc.linear-equations.abs-branches-with-negative-target',
  fixedCount: 'mc.linear-equations.abs-fixed-solution-count',
  negSide: 'mc.exponential-log.no-solution-from-negative-side',
  splitFirst: 'mc.linear-equations.abs-split-before-isolating',
  height: 'mc.functions-concept.graph-equation-solution-as-height-or-point',
  condIgnored: 'mc.linear-equations.abs-case-condition-ignored',
  bothConds: 'mc.linear-equations.abs-candidate-must-satisfy-both-case-conditions',
  checked: 'mc.reasoning-language.checked-candidates-prove-completeness',
  partWhole: 'mc.linear-equations.distance-modeled-as-part-whole',
  wrongQty: 'mc.linear-equations.distance-model-wrong-quantities',
  ctxAll: 'mc.functions-concept.context-domain-all-reals',
  vertexStart: 'mc.functions-concept.vertex-read-as-start',
  ratePer: 'mc.linear-functions.rate-without-per-unit',
  sameDir: 'mc.linear-equations.abs-negative-case-same-direction',
  chain: 'mc.linear-equations.or-as-three-part-chain',
  alwaysNone: 'mc.linear-equations.abs-negative-target-always-none',
  madePos: 'mc.linear-equations.abs-negative-target-made-positive-for-rewrite',
  excluded: 'mc.linear-equations.abs-misses-excluded-point',
  strict: 'mc.linear-equations.bound-phrase-strictness-wrong',
  band: 'mc.linear-equations.boundary-values-vs-band',
  endTarget: 'mc.linear-equations.tolerance-endpoint-as-target',
  atMostOne: 'mc.linear-equations.abs-variable-target-at-most-one-solution',
  ceiling: 'mc.linear-equations.abs-at-most-two-solution-ceiling',
  twoCases: 'mc.linear-equations.abs-two-cases-for-two-bars',
} as const;

export type AVPic = { g?: GPic; opts?: GPic[]; line?: NumPic; slate?: string[] };
export interface AVItem extends Item { picture?: AVPic }
type Gen = (R: () => number, n: number, sg?: string) => AVItem;
type Base = Omit<AVItem, 'input' | 'choices' | 'answer' | 'check'>;
interface Opt { t: string; ok?: boolean; mc?: string; say: string }

// ---------- item helpers ----------
const X = '<i>x</i>';
const nearV = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const sorted = (a: number, b: number): [number, number] => (a <= b ? [a, b] : [b, a]);
const samePair = (p: [number, number], q: [number, number]) => nearV(p[0], q[0]) && nearV(p[1], q[1]);

function choiceItem(R: () => number, base: Base, opts: Opt[]): AVItem {
  const o = shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  if (new Set(o.map(x => x.t)).size !== o.length) throw new Retry(`${base.family}: duplicate choices`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
/** option graphs A, B, C */
function graphChoice(R: () => number, base: Omit<Base, 'picture'>, opts: (Opt & { pic: GPic })[]): AVItem {
  const o = shuffle(R, opts.slice());
  const labelled = o.map((x, i) => ({ ...x, t: `Graph ${'ABC'[i]}` }));
  const it = choiceItemKeep({ ...base, picture: { opts: o.map(x => x.pic) } }, labelled);
  return it;
}
function choiceItemKeep(base: Base, o: Opt[]): AVItem {
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => (r.kind === 'choice' && o[r.i] ? { ok: !!o[r.i]!.ok, mc: o[r.i]!.mc, say: o[r.i]!.say } : { ok: false, say: 'Pick one of the answers.' }),
  };
}
const numItem = (base: Omit<AVItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): AVItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: clean(a) },
  check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? (nearV(r.v, a) ? { ok: true, say: 'Right.' } : check(r.v)) : { ok: false, say: 'Type a number.' }),
});
const pairItem = (base: Omit<AVItem, 'input' | 'answer' | 'check'>, x: number, y: number, check: (a: number, b: number) => Verdict): AVItem => ({
  ...base, input: 'pair', answer: { kind: 'pair', x: clean(x), y: clean(y) },
  check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
});
/** two solutions in "x = □ or x = □" (either order is right) */
function twoSol(base: Omit<AVItem, 'input' | 'answer' | 'check' | 'pairLead' | 'pairOp'>, s: [number, number], wrong: (p: [number, number]) => Verdict | null, v = X): AVItem {
  const S = sorted(s[0], s[1]);
  return pairItem({ ...base, pairLead: `${v} =`, pairOp: `or ${v} =` }, S[0], S[1], (a, b) => {
    const p = sorted(a, b);
    if (samePair(p, S)) return { ok: true, say: `Right: ${D(S[0])} and ${D(S[1])}.` };
    const w = wrong(p);
    if (w) return w;
    if (nearV(p[0], S[0]) || nearV(p[1], S[1]) || nearV(p[0], S[1]) || nearV(p[1], S[0])) return { ok: false, say: 'One of the two is right. Check the other case again.' };
    return { ok: false, say: 'Split into the two cases, solve each, and check both in the original.' };
  });
}
class Retry extends Error {}
const need = (c: unknown) => { if (!c) throw new Retry('retry'); };
function retry(make: () => AVItem): AVItem {
  for (let t = 0; t < 400; t++) {
    try {
      const it = make();
      const p = it.picture;
      if (p?.g && !fits(p.g)) continue;
      if (p?.opts && !p.opts.every(fits)) continue;
      if (p?.line && !lineFits(p.line)) continue;
      return it;
    } catch (e) { if (!(e instanceof Retry)) throw e; }
  }
  throw new Error('absolute-value item: no fitting item in 400 tries');
}
const units = (d: number) => `${D(d)} unit${d === 1 ? '' : 's'}`;
/** m·x + b with a number put in for x: 2(−3) − 5, (−6.5) + 5 */
const subst = (m: number, b: number, x: number) => `${near(m, 1) ? '' : near(m, -1) ? '−' : D(m)}(${D(x)})${b ? ` ${b < 0 ? '−' : '+'} ${D(Math.abs(b))}` : ''}`;
const pm = (R: () => number) => (R() < 0.5 ? -1 : 1);
const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
/** a set as HTML with decimals: −2 &lt; x ≤ 4, x &lt; 1 or x &gt; 5, x = 3, no solution, all real numbers */
export function setD(S: SSet, v = X): string {
  if (!S.length) return 'no solution';
  if (S.length === 1 && S[0]!.lo === -Infinity && S[0]!.hi === Infinity) return 'all real numbers';
  return S.map(I => {
    if (nearV(I.lo, I.hi)) return `${v} = ${D(I.lo)}`;
    if (I.lo === -Infinity) return `${v} ${I.hiC ? '≤' : '&lt;'} ${D(I.hi)}`;
    if (I.hi === Infinity) return `${v} ${I.loC ? '≥' : '&gt;'} ${D(I.lo)}`;
    return `${D(I.lo)} ${I.loC ? '≤' : '&lt;'} ${v} ${I.hiC ? '≤' : '&lt;'} ${D(I.hi)}`;
  }).join(' or ');
}
export function setDT(S: SSet, v = 'x'): string {
  if (!S.length) return '\\text{no solution}';
  if (S.length === 1 && S[0]!.lo === -Infinity && S[0]!.hi === Infinity) return '\\text{all real numbers}';
  return S.map(I => {
    if (nearV(I.lo, I.hi)) return `${v} = ${DT(I.lo)}`;
    if (I.lo === -Infinity) return `${v} ${I.hiC ? '\\le' : '<'} ${DT(I.hi)}`;
    if (I.hi === Infinity) return `${v} ${I.loC ? '\\ge' : '>'} ${DT(I.lo)}`;
    return `${DT(I.lo)} ${I.loC ? '\\le' : '<'} ${v} ${I.hiC ? '\\le' : '<'} ${DT(I.hi)}`;
  }).join(' \\text{ or } ');
}
const F1 = (h: number, k = 0): AbsF => ({ a: 1, m: 1, b: -h, k });
/** a graph that is the answer: nothing before, the V (and extras) on the replay */
const hiddenV = (f: AbsF, xs: number[] = [], ys: number[] = [], extra: GPart[] = [], trace?: { key: string; x: number }): GPic => {
  const w = vWindow(f, xs, ys);
  return { ...w, parts: [], reveal: { parts: [...vParts(f), ...extra], trace } };
};
const shownV = (f: AbsF, xs: number[] = [], ys: number[] = [], extra: GPart[] = [], reveal: GPart[] = []): GPic => {
  const w = vWindow(f, xs, ys);
  return { ...w, parts: [...vParts(f), ...extra], reveal: reveal.length ? { parts: reveal } : undefined };
};
const hl = (y: number, key = 'c'): GPart => ({ kind: 'hline', key, y, col: 'first', dash: true });

// =====================================================================================================================
// 1 abs-eval-expressions
// =====================================================================================================================
const evalAbs: Gen = (R, n) => retry(() => {
  const kind = int(R, 0, 5);
  let tex = '', val = 0, steps: string[] = [];
  const wrongs: [number, string | undefined, string][] = [];
  if (kind === 0) {
    const p = pick(R, [-9, -7, -6, -4, -3, -2.5, -0.5, 0, 3.5, 5, 8, 1.5]);
    tex = `|${DT(p)}|`; val = Math.abs(p);
    steps = [`${D(p)} is ${D(Math.abs(p))} units from 0.`, `|${D(p)}| = ${ans(D(val))}`];
    if (p !== 0) wrongs.push([-Math.abs(p), MC.negDist, 'Absolute value is a distance, and a distance is never negative.']);
  } else if (kind === 1) {
    const p = nz(R, -9, 9), q = nz(R, -9, 9); need(Math.sign(p) !== Math.sign(q));
    tex = `|${DT(p)} + ${PT(q)}|`; val = Math.abs(p + q);
    steps = [`Inside first: ${D(p)} + ${P(q)} = ${D(p + q)}.`, `|${D(p + q)}| = ${ans(D(val))}`];
    wrongs.push([Math.abs(p) + Math.abs(q), MC.parts, `The bars act on the whole inside. Work out ${D(p)} + ${P(q)} first, then take its distance from 0.`]);
  } else if (kind === 2) {
    const p = int(R, -6, 9), q = int(R, 2, 12); need(p - q !== 0 && Math.abs(p) - Math.abs(q) !== Math.abs(p - q));
    tex = `|${DT(p)} - ${DT(q)}|`; val = Math.abs(p - q);
    steps = [`Inside first: ${D(p)} − ${D(q)} = ${D(p - q)}.`, `|${D(p - q)}| = ${ans(D(val))}`];
    wrongs.push([Math.abs(p) - Math.abs(q), MC.distSub, 'The bars do not split over a minus: |a − b| is not |a| − |b|. Subtract first.']);
    wrongs.push([p - q, MC.negDist, 'That is the inside. The bars then give its distance from 0, which is positive.']);
  } else if (kind === 3) {
    const p = nz(R, -6, 6), q = nz(R, -6, 6); need(p * q < 0);
    tex = `|${DT(p)} \\cdot ${PT(q)}|`; val = Math.abs(p * q);
    steps = [`Inside first: ${D(p)} · ${P(q)} = ${D(p * q)}.`, `|${D(p * q)}| = ${ans(D(val))}`];
    wrongs.push([p * q, MC.negDist, 'That is the inside. The bars give its distance from 0.']);
  } else if (kind === 4) {
    const a = int(R, 2, 6), x = pick(R, [1, a, a + 6, -2, -3, 0]);
    tex = `|x - ${a}| \\ \\text{ for } x = ${DT(x)}`; val = Math.abs(x - a);
    steps = [`Put in ${X} = ${D(x)}: ${D(x)} − ${a} = ${D(x - a)}.`, `|${D(x - a)}| = ${ans(D(val))}`];
    if (x - a < 0) wrongs.push([x - a, MC.negDist, 'That is the inside. The bars give its distance from 0, which is positive.']);
    wrongs.push([Math.abs(x) + a, MC.parts, `The bars act on the whole inside: work out ${D(x)} − ${a} first.`]);
  } else {
    const p = pick(R, [-1.5, -2.5, -0.5, -3.5, 1.5, 0.5]), q = pick(R, [2, 3, 1, 4, 0.5]);
    tex = `|${DT(p)} - ${DT(q)}|`; val = Math.abs(p - q);
    steps = [`Inside first: ${D(p)} − ${D(q)} = ${D(p - q)}.`, `|${D(p - q)}| = ${ans(D(val))}`];
    wrongs.push([Math.abs(p) - Math.abs(q), MC.distSub, 'The bars do not split over a minus. Subtract first, then take the distance from 0.']);
    wrongs.push([p - q, MC.negDist, 'That is the inside. The bars give its distance from 0.']);
  }
  return numItem({ id: `evalAbs-${n}`, family: 'evalAbs', prompt: `Evaluate. Work out the inside of the bars first.`, board: tex, unit: '', solution: steps }, val, v => {
    for (const [w, mc, say] of wrongs) if (!nearV(w, val) && nearV(v, w)) return { ok: false, mc, say };
    return { ok: false, say: 'Work out the inside first, then take its distance from 0.' };
  });
});

const outsideMinus: Gen = (R, n) => retry(() => {
  const kind = int(R, 0, 3);
  let tex = '', val = 0, steps: string[] = [];
  const wrongs: [number, string | undefined, string][] = [];
  if (kind === 0) {
    const a = int(R, 2, 9);
    tex = `-|-${a}|`; val = -a;
    steps = [`Bars first: |−${a}| = ${a}.`, `Then the minus outside: −${a} = ${ans('−' + a)}`];
    wrongs.push([a, MC.coefIn, 'The minus sign is outside the bars, so it acts after them: −(|−' + a + '|) = −' + a + '.']);
  } else if (kind === 1) {
    const a = int(R, 2, 9);
    tex = `|-(-${a})|`; val = a;
    steps = [`Inside first: −(−${a}) = ${a}.`, `|${a}| = ${ans(a)}`];
    wrongs.push([-a, MC.minusNeg, 'Every minus here is inside the bars, and the bars give a distance: it is positive.']);
  } else if (kind === 2) {
    const p = nz(R, -4, 5), q = p + int(R, 2, 9);
    tex = `-|${DT(p)} - ${PT(q)}|`; val = -(q - p);
    steps = [`Inside first: ${D(p)} − ${P(q)} = ${D(p - q)}.`, `|${D(p - q)}| = ${D(q - p)}, then the minus outside: ${ans(D(val))}`];
    wrongs.push([q - p, MC.coefIn, 'The minus outside the bars acts after them, so the result is negative.']);
  } else {
    const k = pick(R, [-3, -2, 2, 3]), h = int(R, -3, 4), c = nz(R, -6, 6), x = h + nz(R, -4, 4);
    tex = `${absT(k, 1, -h, c)} \\ \\text{ for } x = ${DT(x)}`;
    val = k * Math.abs(x - h) + c;
    steps = [`Inside first: ${D(x)} − ${P(h)} = ${D(x - h)}, and |${D(x - h)}| = ${D(Math.abs(x - h))}.`, `Then ${D(k)} · ${D(Math.abs(x - h))} + ${P(c)} = ${ans(D(val))}`];
    if (k < 0) wrongs.push([-k * Math.abs(x - h) + c, MC.coefIn, `The ${D(k)} is outside the bars: multiply the distance by ${D(k)}, a negative number.`]);
    wrongs.push([k * (x - h) + c, undefined, 'Take the absolute value of the inside before you multiply.']);
  }
  return numItem({ id: `outsideMinus-${n}`, family: 'outsideMinus', prompt: 'Evaluate. Bars first, then what is outside them.', board: tex, unit: '', solution: steps }, val, v => {
    for (const [w, mc, say] of wrongs) if (!nearV(w, val) && nearV(v, w)) return { ok: false, mc, say };
    return { ok: false, say: 'Work out the inside, take its distance from 0, then do what is outside the bars.' };
  });
});

// =====================================================================================================================
// 2 distance-x-minus-a
// =====================================================================================================================
const distSolve: Gen = (R, n) => retry(() => {
  const a = nz(R, -6, 6), d = int(R, 1, 6);
  const s: [number, number] = [a - d, a + d];
  const rw = a < 0 ? ` (${absH(1, 1, -a)} is |${X} − (${D(a)})|)` : '';
  return twoSol({
    id: `distSolve-${n}`, family: 'distSolve',
    prompt: `Read the bars as a distance. Which two numbers ${X} make ${absH(1, 1, -a)} = ${d} true? Type the smaller one first.`,
    board: `${absT(1, 1, -a)} = ${d}`,
    picture: { line: { values: [a - d, a + d, a], reveal: { set: union(ray('=', a - d), ray('=', a + d)), center: a, arcs: [{ to: a - d, label: String(d) }, { to: a + d, label: String(d) }], result: `x = ${DT(a - d)} \\text{ or } x = ${DT(a + d)}` } } },
    solution: [`${absH(1, 1, -a)} is the distance from ${X} to ${D(a)}${rw}.`, `${d} to the left of ${D(a)} is ${ans(D(a - d))}, ${d} to the right is ${ans(D(a + d))}.`],
  }, s, p => {
    if (samePair(p, sorted(-a - d, -a + d))) return { ok: false, mc: MC.signZero, say: `|${X} − c| is the distance to c. Here c is ${D(a)}, the number that makes the inside 0, not ${D(-a)}.` };
    if (samePair(p, sorted(-d, d))) return { ok: false, mc: MC.ignoreIn, say: `Those are ${d} away from 0. The bars measure the distance from ${D(a)}.` };
    return null;
  });
});

const distMeaning: Gen = (R, n) => retry(() => {
  const a = nz(R, -9, 9), d = int(R, 1, 9); need(Math.abs(a) !== d);
  return choiceItem(R, {
    id: `distMeaning-${n}`, family: 'distMeaning', prompt: `What does ${absH(1, 1, -a)} = ${d} say about ${X}?`, board: `${absT(1, 1, -a)} = ${d}`,
    solution: [`|${X} − c| is the distance between ${X} and c.`, `The inside is 0 at ${X} = ${D(a)}, so c = ${D(a)}.`],
  }, [
    { t: `${X} is ${units(d)} from ${D(a)}`, ok: true, say: `Right: the inside is 0 at ${D(a)}, so the bars measure the distance to ${D(a)}.` },
    { t: `${X} is ${units(d)} from ${D(-a)}`, mc: MC.signZero, say: `The reference point makes the inside 0: ${X} = ${D(a)}, not ${D(-a)}.` },
    { t: `${X} is ${units(Math.abs(a))} from ${d}`, mc: MC.wrongQty, say: `The number after the = sign is the distance. The point is where the inside is 0.` },
  ]);
});

// =====================================================================================================================
// 3 piecewise-def-abs
// =====================================================================================================================
const DEF = '|x| = \\begin{cases} x, & x \\ge 0 \\\\ -x, & x < 0 \\end{cases}';
const pieceEval: Gen = (R, n) => {
  const v = pick(R, [5, 0, -6, -0.5, -3, 7, -2.5, 1.5, 4, -8, 2, -1, -4.5, 9, -7, 3.5]);
  const opts: Opt[] = v > 0 ? [
    { t: `the first piece, ${X}: |${D(v)}| = ${D(v)}`, ok: true, say: `Right: ${D(v)} ≥ 0, so the first piece gives ${D(v)}.` },
    { t: `the second piece, −${X}: |${D(v)}| = −${D(v)}`, mc: MC.wrongSides, say: `The second piece is only for negative inputs. ${D(v)} ≥ 0 picks the first piece.` },
    { t: `both pieces: |${D(v)}| = ${D(v)} and −${D(v)}`, mc: MC.several, say: 'Exactly one condition holds for each input, so there is one output.' },
  ] : v < 0 ? [
    { t: `the second piece, −${X}: |${D(v)}| = −(${D(v)}) = ${D(-v)}`, ok: true, say: `Right: ${D(v)} &lt; 0, and the opposite of ${D(v)} is ${D(-v)}.` },
    { t: `the first piece, ${X}: |${D(v)}| = ${D(v)}`, mc: MC.wrongSides, say: `The first piece is for x ≥ 0. ${D(v)} is negative, so the second piece holds.` },
    { t: `both pieces: |${D(v)}| = ${D(v)} and ${D(-v)}`, mc: MC.several, say: 'Exactly one condition holds for each input, so there is one output.' },
  ] : [
    { t: `the first piece, since 0 ≥ 0: |0| = 0`, ok: true, say: 'Right: 0 ≥ 0 is true, so the first piece holds.' },
    { t: `the second piece, since 0 &lt; 0: |0| = 0`, say: '0 &lt; 0 is false, so the second piece does not hold at 0.' },
    { t: `both pieces: each gives |0| = 0`, mc: MC.several, say: 'Exactly one condition holds at 0: 0 ≥ 0.' },
  ];
  return choiceItem(R, {
    id: `pieceEval-${n}`, family: 'pieceEval', prompt: `Use the two-piece definition. Which piece gives |${D(v)}|, and what is it?`,
    board: `${DEF} \\qquad |${DT(v)}| = \\,?`,
    solution: [`Test ${D(v)} against the conditions: ${v >= 0 ? `${D(v)} ≥ 0 holds` : `${D(v)} &lt; 0 holds`}.`, v >= 0 ? `Use ${X}: |${D(v)}| = ${D(v)}.` : `Use −${X}: −(${D(v)}) = ${D(-v)}.`],
  }, opts);
};

const oppositeValue: Gen = (R, n) => {
  const v = pick(R, [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -12, -0.5, -1.5, -2.5, -0.25, -3.5]);
  return numItem({
    id: `oppositeValue-${n}`, family: 'oppositeValue',
    prompt: `For ${X} &lt; 0 the definition says |${X}| = −${X}. Take ${X} = ${D(v)}. What number is −${X}?`,
    board: `x = ${DT(v)}:\\quad -x = \\,?`, unit: '',
    solution: [`−${X} means the opposite of ${X}.`, `The opposite of ${D(v)} is ${ans(D(-v))}: positive, as a distance must be.`],
  }, -v, w => nearV(w, v) ? { ok: false, mc: MC.minusNeg, say: `−${X} is the opposite of ${X}. ${X} is negative here, so −${X} is positive.` } : { ok: false, say: `−${X} is the opposite of ${D(v)}.` });
};

// =====================================================================================================================
// 4 breakpoint-x-minus-a
// =====================================================================================================================
const BP = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 2.5, -1.5, 3.5, -2.5, 0.5, 6];
const breakX: Gen = (R, n) => retry(() => {
  const a = pick(R, BP);
  const f = F1(a);
  return numItem({
    id: `breakX-${n}`, family: 'breakX', prompt: `The graph of y = ${absH(1, 1, -a)} is two linear pieces. At which ${X} do they meet (the breakpoint)?`,
    board: `y = ${absT(1, 1, -a)}`, unit: '', picture: { g: hiddenV(f) },
    solution: [`The pieces switch where the inside is 0.`, `${inH(1, -a)} = 0 gives ${X} = ${ans(D(a))}.`],
  }, a, v => nearV(v, -a) ? { ok: false, mc: MC.signZero, say: `Set the inside to 0: ${inH(1, -a)} = 0 gives ${X} = ${D(a)}, the opposite sign of the number you see.` }
    : nearV(v, 0) ? { ok: false, mc: MC.bpZero, say: `The pieces switch where the INSIDE is 0, not where ${X} is 0.` } : { ok: false, say: 'Set the inside equal to 0 and solve.' });
});

const condH = (rel: Rel, v: number) => `${X} ${relH(rel)} ${D(v)}`;
const pieceForm: Gen = (R, n) => retry(() => {
  const a = pick(R, BP);
  const pos = linStrH(1, -a), neg = linStrH(-1, a), negBad = linStrH(-1, -a);
  return choiceItem(R, {
    id: `pieceForm-${n}`, family: 'pieceForm', prompt: `Write ${absH(1, 1, -a)} as two pieces. Which is right?`, board: `${absT(1, 1, -a)} = \\,?`,
    solution: [`Breakpoint: ${inH(1, -a)} = 0 at ${X} = ${D(a)}.`, `For ${X} ≥ ${D(a)} the inside is not negative: keep it, ${pos}.`, `For ${X} &lt; ${D(a)} take the opposite of the whole inside: −(${pos}) = ${neg}.`],
  }, [
    { t: `${pos} for ${condH('>=', a)}; ${neg} for ${condH('<', a)}`, ok: true, say: 'Right: the breakpoint is where the inside is 0, and the left piece is the opposite of the whole inside.' },
    { t: `${pos} for ${condH('>=', a)}; ${negBad} for ${condH('<', a)}`, mc: MC.firstTerm, say: `−(${pos}) changes the sign of BOTH terms: ${neg}.` },
    { t: `${pos} for ${condH('>=', 0)}; ${neg} for ${condH('<', 0)}`, mc: MC.bpZero, say: `The pieces switch where the inside is 0, at ${X} = ${D(a)}, not at 0.` },
    { t: `${neg} for ${condH('>=', a)}; ${pos} for ${condH('<', a)}`, mc: MC.wrongSides, say: `Right of ${D(a)} the inside is positive, so there |${inH(1, -a)}| = ${pos}.` },
  ]);
});

// =====================================================================================================================
// 5 graph-parent-abs
// =====================================================================================================================
const PARENT = (pts: GPart[] = []): GPic => ({ ...win([-6, 6], [-1, 7]), parts: [...vParts({ a: 1, m: 1, b: 0, k: 0 }), ...pts] });
const parentSlope: Gen = (R, n) => {
  const v = pick(R, [-6, -5, -4, -3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6]);
  const s = Math.sign(v);
  return numItem({
    id: `parentSlope-${n}`, family: 'parentSlope',
    prompt: `The graph of y = |${X}| is two linear pieces. What is the slope of the piece through (${D(v)}, ${D(Math.abs(v))})?`,
    board: `y = |x|`, unit: '', picture: { g: PARENT([{ kind: 'point', key: 'P', x: v, y: Math.abs(v), col: 'first' }]) },
    solution: [v > 0 ? `${D(v)} ≥ 0: that piece is y = ${X}.` : `${D(v)} &lt; 0: that piece is y = −${X}.`, `Its slope is ${ans(String(s).replace('-', '−'))}.`],
  }, s, w => nearV(w, -s) ? { ok: false, mc: MC.wrongSides, say: v < 0 ? `Left of 0 the graph is y = −${X}: it goes DOWN as ${X} grows, slope −1.` : `Right of 0 the graph is y = ${X}: slope 1.` } : { ok: false, say: 'Each piece rises or falls 1 for every 1 to the right.' });
};

const parentFeature: Gen = (R, n) => retry(() => {
  const v = pick(R, [-5, -4, -3, -2, 2, 3, 4, 5]);
  const TRUE: string[] = ['The range is <i>y</i> ≥ 0.', 'The vertex is (0, 0).', 'The axis of symmetry is <i>x</i> = 0.', `It decreases for ${X} &lt; 0 and increases for ${X} &gt; 0.`,
    'The domain is all real numbers.', 'The right piece has slope 1.', 'The left piece has slope −1.', `(${D(v)}, ${D(Math.abs(v))}) is on the graph.`];
  const FALSE: [string, string | undefined, string][] = [
    ['The range is all real numbers.', MC.rangeAll, 'No output is below 0: the range is y ≥ 0.'],
    ['The bottom of the graph is a rounded U.', MC.rounded, 'Both pieces are straight lines, and they meet in a sharp corner at (0, 0).'],
    ['The left piece has slope 1.', MC.wrongSides, `Left of 0 the graph is y = −${X}: slope −1.`],
    ['The domain is <i>x</i> ≥ 0.', undefined, 'Every number has an absolute value: the domain is all real numbers.'],
    [`(${D(-Math.abs(v))}, ${D(-Math.abs(v))}) is on the graph.`, MC.wrongSides, `|${D(-Math.abs(v))}| = ${D(Math.abs(v))}, so the point at that x is (${D(-Math.abs(v))}, ${D(Math.abs(v))}).`],
    [`It increases for ${X} &lt; 0.`, MC.wrongSides, 'Left of 0 the graph falls as x grows.'],
    ['The range is <i>y</i> &gt; 0.', undefined, '0 is an output too (at x = 0): y ≥ 0.'],
  ];
  const t = pick(R, TRUE), f = shuffle(R, FALSE.slice()).slice(0, 3);
  return choiceItem(R, {
    id: `parentFeature-${n}`, family: 'parentFeature', prompt: `Which statement about y = |${X}| is true?`, board: 'y = |x|', picture: { g: PARENT() },
    solution: ['y = |x| is y = −x left of 0 and y = x right of 0: a V with its vertex at (0, 0).', 'Outputs are never negative: range y ≥ 0, domain all real numbers.'],
  }, [{ t, ok: true, say: 'Right.' }, ...f.map(([tt, mc, say]) => ({ t: tt, mc, say }))]);
});

// =====================================================================================================================
// 6 graph-horizontal-shift
// =====================================================================================================================
const HS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, -1.5, 2.5, 0.5, -3.5];
const hShiftVertex: Gen = (R, n) => retry(() => {
  const h = pick(R, HS);
  return numItem({
    id: `hShiftVertex-${n}`, family: 'hShiftVertex', prompt: `Where is the vertex of y = ${absH(1, 1, -h)}? Type its ${X}-coordinate.`,
    board: `y = ${absT(1, 1, -h)}`, unit: '', picture: { g: hiddenV(F1(h)) },
    solution: [`The vertex is where the inside is 0.`, `${inH(1, -h)} = 0 at ${X} = ${ans(D(h))}: the V of y = |${X}| moves ${h > 0 ? 'right' : 'left'} ${D(Math.abs(h))}.`],
  }, h, v => nearV(v, -h) ? { ok: false, mc: MC.signZero, say: `The vertex is where the inside is 0: ${inH(1, -h)} = 0 at ${X} = ${D(h)}.` } : { ok: false, say: 'Find the x that makes the inside 0.' });
});

const hShiftPick: Gen = (R, n) => retry(() => {
  const h = nz(R, -4, 4);
  const w = win([-Math.abs(h) - 4, Math.abs(h) + 4], [-Math.abs(h) - 1, 6]);
  const g = (f: AbsF): GPic => ({ ...w, parts: vParts(f) });
  return graphChoice(R, {
    id: `hShiftPick-${n}`, family: 'hShiftPick', prompt: `Which graph is y = ${absH(1, 1, -h)}?`, board: `y = ${absT(1, 1, -h)}`,
    solution: [`The inside is 0 at ${X} = ${D(h)}: the vertex is (${D(h)}, 0).`, `It is the V of y = |${X}| moved ${h > 0 ? 'right' : 'left'} ${Math.abs(h)}.`],
  }, [
    { t: '', ok: true, say: `Right: the vertex is at (${D(h)}, 0).`, pic: g(F1(h)) },
    { t: '', mc: MC.signZero, say: `That vertex is at (${D(-h)}, 0). The inside ${inH(1, -h)} is 0 at ${D(h)}.`, pic: g(F1(-h)) },
    { t: '', mc: MC.inOut, say: `That graph is y = |${X}| ${h > 0 ? '−' : '+'} ${Math.abs(h)}: it moved down or up. A change INSIDE the bars moves it sideways.`, pic: g({ a: 1, m: 1, b: 0, k: -h }) },
  ]);
});

// =====================================================================================================================
// 7 graph-vertical-shift
// =====================================================================================================================
const vertexHK: Gen = (R, n) => retry(() => {
  const h = int(R, -5, 5), k = int(R, -5, 5); need(!(h === 0 && k === 0));
  const f = F1(h, k);
  return pairItem({
    id: `vertexHK-${n}`, family: 'vertexHK', prompt: `What is the vertex of y = ${absH(1, 1, -h, k)}?`, board: `y = ${absT(1, 1, -h, k)}`,
    pairLead: '(', pairOp: ',', pairTail: ')', picture: { g: hiddenV(f) },
    solution: [`The inside is 0 at ${X} = ${D(h)}: that is the vertex's ${X}.`, `There the output is 0 ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${D(k)}. Vertex (${ans(D(h))}, ${ans(D(k))}).`],
  }, h, k, (x, y) => {
    if (nearV(x, h) && nearV(y, k)) return { ok: true, say: `Right: (${D(h)}, ${D(k)}).` };
    if (h !== 0 && nearV(x, -h) && nearV(y, k)) return { ok: false, mc: MC.signZero, say: `The vertex's ${X} makes the inside 0: ${X} = ${D(h)}.` };
    if (k !== 0 && nearV(y, k) && (nearV(x, h + k) || nearV(x, h - k))) return { ok: false, mc: MC.vShiftBoth, say: `The + ${D(k)} outside only moves the graph up or down. The ${X} of the vertex stays ${D(h)}.` };
    if (nearV(x, k) && nearV(y, h)) return { ok: false, say: `Write ${X} first: (${D(h)}, ${D(k)}).` };
    return { ok: false, say: 'x: where the inside is 0. y: the number added outside.' };
  });
});

const rangeK: Gen = (R, n) => retry(() => {
  const h = nz(R, -4, 4), k = nz(R, -4, 5); need(h !== k);
  return choiceItem(R, {
    id: `rangeK-${n}`, family: 'rangeK', prompt: `What is the range of y = ${absH(1, 1, -h, k)}?`, board: `y = ${absT(1, 1, -h, k)}`,
    picture: { g: shownV(F1(h, k), [], [0]) },
    solution: [`|${inH(1, -h)}| ≥ 0, and it reaches 0 at the vertex.`, `So y ≥ 0 ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${D(k)}.`],
  }, [
    { t: `<i>y</i> ≥ ${D(k)}`, ok: true, say: `Right: the lowest point is the vertex, at y = ${D(k)}.` },
    { t: '<i>y</i> ≥ 0', mc: MC.rangeParent, say: `That is the range of y = |x|. This V moved ${k > 0 ? 'up' : 'down'} ${Math.abs(k)}.` },
    { t: 'all real numbers', mc: MC.rangeAll, say: `The V never goes below its vertex at y = ${D(k)}.` },
    { t: `<i>y</i> ≥ ${D(h)}`, say: `${D(h)} is the vertex's x. The range is about outputs: y ≥ ${D(k)}.` },
  ]);
});

// =====================================================================================================================
// 8 graph-vertical-stretch
// =====================================================================================================================
const branchSlope: Gen = (R, n) => retry(() => {
  const a = pick(R, [0.5, 1, 2, 3]), h = int(R, -3, 3), k = int(R, -3, 3), right = R() < 0.5;
  const f: AbsF = { a, m: 1, b: -h, k }, s = right ? a : -a;
  const pt: GPart = { kind: 'point', key: 'P', x: h + (right ? 2 : -2), y: absAt(f, h + (right ? 2 : -2)), col: 'first' };
  return numItem({
    id: `branchSlope-${n}`, family: 'branchSlope', prompt: `What is the slope of the ${right ? 'right' : 'left'} piece of y = ${absH(a, 1, -h, k)}?`,
    board: `y = ${absT(a, 1, -h, k)}`, unit: '', picture: { g: shownV(f, [], [], [pt]) },
    solution: [`From the vertex (${D(h)}, ${D(k)}), go 1 to the ${right ? 'right' : 'left'}: the output grows by ${D(a)}.`, `So the ${right ? 'right' : 'left'} piece has slope ${ans(D(s))}.`],
  }, s, v => nearV(v, -s) ? { ok: false, mc: MC.wrongSides, say: right ? `The right piece rises: slope ${D(a)}.` : `Going right along the left piece the graph falls: slope ${D(-a)}.` } : { ok: false, say: `a = ${D(a)} sets the steepness: the pieces have slopes ${D(-a)} and ${D(a)}.` });
});

const stretchPoint: Gen = (R, n) => retry(() => {
  const a = pick(R, [0.5, 2, 3]), h = int(R, -3, 3), k = nz(R, -4, 4), d = a === 0.5 ? pick(R, [-4, -2, 2, 4]) : nz(R, -3, 3), x = h + d;
  const f: AbsF = { a, m: 1, b: -h, k }, y = absAt(f, x);
  return numItem({
    id: `stretchPoint-${n}`, family: 'stretchPoint', prompt: `y = ${absH(a, 1, -h, k)}. What is y when ${X} = ${D(x)}?`,
    board: `y = ${absT(a, 1, -h, k)},\\quad x = ${DT(x)}`, unit: '', picture: { g: hiddenV(f, [x], [y], [], { key: d > 0 ? 'vR' : 'vL', x }) },
    solution: [`Inside: ${D(x)} − ${P(h)} = ${D(d)}, so |${D(d)}| = ${D(Math.abs(d))}.`, `Stretch, then shift: ${D(a)} · ${D(Math.abs(d))} ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${ans(D(y))}`],
  }, y, v => nearV(v, a * (Math.abs(d) + k)) ? { ok: false, mc: MC.shiftScale, say: `Multiply by ${D(a)} first, then add ${D(k)}: the shift is outside the stretch.` }
    : nearV(v, Math.abs(d) + k) ? { ok: false, say: `Don't forget the ${D(a)}: it multiplies the distance.` } : { ok: false, say: 'Inside, bars, times a, then plus k.' });
});

// =====================================================================================================================
// 9 graph-reflection-negative-a
// =====================================================================================================================
const negPick: Gen = (R, n) => retry(() => {
  const a = pick(R, [-1, -2, -0.5]), h = nz(R, -3, 3), k = int(R, 0, 4);
  const f: AbsF = { a, m: 1, b: -h, k }, up: AbsF = { a: -a, m: 1, b: -h, k };
  const w = win([h - 4, h + 4, -h - 4, -h + 4], [k - 5, k + 5]);
  const [, fr] = branchesOf(f), [fl] = branchesOf(up);
  const one: GPart[] = [
    { kind: 'piece', key: 'vL', fn: fl, hi: h, ends: ['none', 'none'], col: 'link', arrow: true },
    { kind: 'piece', key: 'vR', fn: fr, lo: h, ends: ['none', 'none'], col: 'link', arrow: true },
    { kind: 'point', key: 'vV', x: h, y: k, col: 'link' },
  ];
  return graphChoice(R, {
    id: `negPick-${n}`, family: 'negPick', prompt: `Which graph is y = ${absH(a, 1, -h, k)}?`, board: `y = ${absT(a, 1, -h, k)}`,
    solution: [`The vertex is (${D(h)}, ${D(k)}).`, `a = ${D(a)} is negative: BOTH pieces turn over, so the V opens down and (${D(h)}, ${D(k)}) is its highest point.`],
  }, [
    { t: '', ok: true, say: 'Right: it opens down from its vertex.', pic: { ...w, parts: vParts(f) } },
    { t: '', mc: MC.oneBranch, say: 'A negative a turns over both pieces, not just one: the graph opens down.', pic: { ...w, parts: one } },
    { t: '', mc: MC.axisSwap, say: 'A minus OUTSIDE the bars flips the graph upside down. That graph was flipped left to right.', pic: { ...w, parts: vParts({ a: -a, m: 1, b: h, k }) } },
  ]);
});

const sameGraph: Gen = (R, n) => retry(() => {
  const h = nz(R, -5, 5), k = int(R, -3, 4);
  const f: AbsF = { a: 1, m: -1, b: h, k };
  return choiceItem(R, {
    id: `sameGraph-${n}`, family: 'sameGraph', prompt: `Which equation has the same graph as y = ${absH(1, -1, h, k)}?`, board: `y = ${absT(1, -1, h, k)}`,
    picture: { g: shownV(f) },
    solution: [`${inH(-1, h)} = −(${inH(1, -h)}): the insides are opposites.`, `Opposites have the same distance from 0, so |${inH(-1, h)}| = |${inH(1, -h)}| for every ${X}.`],
  }, [
    { t: `y = ${absH(1, 1, -h, k)}`, ok: true, say: 'Right: a minus INSIDE the bars changes nothing, because opposites have the same absolute value.' },
    { t: `y = ${absH(-1, 1, -h, k)}`, mc: MC.axisSwap, say: 'A minus outside the bars flips the graph upside down. A minus inside does not change |…| at all.' },
    { t: `y = ${absH(1, 1, h, k)}`, say: `That V has its vertex at ${X} = ${D(-h)}. The inside ${inH(-1, h)} is 0 at ${X} = ${D(h)}.` },
  ]);
});

// =====================================================================================================================
// 10 piecewise-affine-inner
// =====================================================================================================================
const affinePick = (R: () => number) => {
  for (;;) {
    const m = pick(R, [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), b = nz(R, -6, 6);
    if (Math.abs(m) === 1 && R() < 0.4) continue;
    return { m, b, r: clean(-b / m) };
  }
};
const affineCond: Gen = (R, n) => retry(() => {
  const { m, b, r } = affinePick(R);
  const ok = m > 0 ? '>=' : '<=';
  const c = (rel: Rel, v: number) => `${X} ${relH(rel)} ${nH(v)}`;
  return choiceItem(R, {
    id: `affineCond-${n}`, family: 'affineCond', prompt: `For which ${X} is |${inH(m, b)}| = ${inH(m, b)} (the bars change nothing)? Solve ${inH(m, b)} ≥ 0.`,
    board: `${inT(m, b)} \\ge 0`,
    solution: [`${linStrH(m, b)} ≥ 0 → ${linStrH(m, 0)} ≥ ${D(-b)}.`, m > 0 ? `Divide by ${m}: ${X} ≥ ${nH(r)}.` : `Divide by ${m}, a negative number: the sign turns, ${X} ≤ ${nH(r)}.`],
  }, [
    { t: c(ok, r), ok: true, say: 'Right.' },
    { t: c(m > 0 ? '<=' : '>=', r), mc: m < 0 ? MC.noRev : MC.wrongSides, say: m < 0 ? `Dividing by ${m} turns the inequality around.` : `${inH(m, b)} grows as ${X} grows, so it is not negative to the RIGHT of ${nH(r)}.` },
    { t: c('>=', 0), mc: MC.bpZero, say: `Solve inside ≥ 0. It changes sign at ${nH(r)}, not at 0.` },
    { t: c(ok, -r), mc: MC.signZero, say: `${linStrH(m, b)} = 0 at ${X} = ${nH(r)}: watch the sign when you move ${D(b)} across.` },
  ]);
});

const affineForm: Gen = (R, n) => retry(() => {
  const { m, b, r } = affinePick(R);
  const u = linStrH(m, b), neg = linStrH(-m, -b), bad = linStrH(-m, b);
  const c = (rel: Rel) => `${X} ${relH(rel)} ${nH(r)}`;
  const [pr, nr]: [Rel, Rel] = m > 0 ? ['>=', '<'] : ['<=', '>'];
  return choiceItem(R, {
    id: `affineForm-${n}`, family: 'affineForm', prompt: `Write |${inH(m, b)}| as two pieces. Which is right?`, board: `|${inT(m, b)}| = \\,?`,
    solution: [`${u} ≥ 0 when ${c(pr)}${m < 0 ? ' (dividing by a negative turns the sign)' : ''}.`, `There keep ${u}; elsewhere take the opposite of the whole inside: ${neg}.`],
  }, [
    { t: `${u} for ${c(pr)}; ${neg} for ${c(nr)}`, ok: true, say: 'Right.' },
    { t: `${u} for ${c(pr)}; ${bad} for ${c(nr)}`, mc: MC.firstTerm, say: `−(${u}) changes the sign of both terms: ${neg}.` },
    { t: `${u} for ${c(nr === '<' ? '<' : '>')}; ${neg} for ${c(pr)}`, mc: m < 0 ? MC.noRev : MC.wrongSides, say: m < 0 ? `Solve ${u} ≥ 0: dividing by ${m} turns the sign, so it holds for ${c('<=')}.` : `${u} ≥ 0 holds for ${c('>=')}: keep ${u} there.` },
  ]);
});

// =====================================================================================================================
// 11 graph-affine-inner
// =====================================================================================================================
const affineVertex: Gen = (R, n) => retry(() => {
  const m = pick(R, [-4, -2, 2, 4]), xv = pick(R, [-3.5, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3]), b = clean(-m * xv);
  need(Number.isInteger(b) && b !== 0);
  const a = pick(R, [1, 2, -1, 3]), k = int(R, -4, 4), f: AbsF = { a, m, b, k };
  return numItem({
    id: `affineVertex-${n}`, family: 'affineVertex', prompt: `At which ${X} is the vertex of y = ${absH(a, m, b, k)}?`, board: `y = ${absT(a, m, b, k)}`, unit: '',
    picture: { g: hiddenV(f) },
    solution: [`The vertex is where the inside is 0: ${linStrH(m, b)} = 0.`, `${linStrH(m, 0)} = ${D(-b)}, so ${X} = ${D(-b)} ÷ ${P(m)} = ${ans(D(xv))}.`],
  }, xv, v => nearV(v, -b) && !nearV(-b, xv) ? { ok: false, mc: MC.zeroBxC, say: `Set the inside to 0 and divide by ${m} too: ${X} = ${D(xv)}.` }
    : nearV(v, -xv) ? { ok: false, mc: MC.signZero, say: `${linStrH(m, b)} = 0 gives ${X} = ${D(xv)}: watch the sign.` } : { ok: false, say: 'Solve inside = 0.' });
});

const affineSlope: Gen = (R, n) => retry(() => {
  const a = pick(R, [0.5, 1, 2, -1, -2]), m = pick(R, [-3, -2, -1, 1, 2, 3]); need(Math.abs(a * m) <= 4 && Math.abs(a * m) >= 1 && (Math.abs(m) !== 1 || R() < 0.3));
  const xv = nz(R, -3, 3), b = -m * xv, k = int(R, -3, 3), f: AbsF = { a, m, b, k }, s = clean(a * Math.abs(m));
  return numItem({
    id: `affineSlope-${n}`, family: 'affineSlope', prompt: `What is the slope of the RIGHT piece of y = ${absH(a, m, b, k)}?`, board: `y = ${absT(a, m, b, k)}`, unit: '',
    picture: { g: shownV(f) },
    solution: [`Right of the vertex ${X} = ${D(xv)} the inside ${linStrH(m, b)} is ${m > 0 ? 'positive' : 'negative'}, so |${inH(m, b)}| = ${m > 0 ? linStrH(m, b) : linStrH(-m, -b)}.`, `Times ${D(a)}: slope ${D(a)} · ${D(Math.abs(m))} = ${ans(D(s))}.`],
  }, s, v => m < 0 && nearV(v, a * m) ? { ok: false, mc: MC.wrongSides, say: `Right of the vertex the inside ${linStrH(m, b)} is negative, so the bars use its opposite: slope ${D(a)} · ${D(-m)}.` }
    : nearV(v, a) && Math.abs(m) !== 1 ? { ok: false, say: `The ${D(Math.abs(m))} inside steepens the pieces too: slope = a · |m|.` } : { ok: false, say: 'Read rise over run from the vertex, or use a · |m|.' });
});

// =====================================================================================================================
// 12 solve-abs-eq-positive
// =====================================================================================================================
const eqPick = (R: () => number, cPos = true) => {
  for (;;) {
    const m = pick(R, [1, 2, -1, -2, 3, 1, 2]), b = nz(R, -8, 8), c = cPos ? int(R, 1, 9) : 0;
    const s = solveEq({ a: 1, m, b, k: 0 }, c);
    if (cPos && (s.length !== 2 || !s.every(half) || s.some(v => Math.abs(v) > 9))) continue;
    if ((Math.abs(m) === 1 && b === 0) || (m < 0 && b < 0)) continue;
    return { m, b, c, s };
  }
};
const splitSolve: Gen = (R, n) => retry(() => {
  const { m, b, c, s } = eqPick(R);
  const f: AbsF = { a: 1, m, b, k: 0 };
  const xr = (c - b) / m, xl = (-c - b) / m;
  return twoSol({
    id: `splitSolve-${n}`, family: 'splitSolve', prompt: `Solve ${absH(1, m, b)} = ${c}. Type the smaller solution first.`, board: `${absT(1, m, b)} = ${c}`,
    picture: { g: hiddenV(f, s, [c], [hl(c), ...crossParts(s, c)]) },
    solution: [`The inside is ${c} away from 0: ${inH(m, b)} = ${c} or ${inH(m, b)} = −${c}.`, `${inH(m, b)} = ${c} gives ${X} = ${D(xr)}; ${inH(m, b)} = −${c} gives ${X} = ${D(xl)}.`, `So ${X} = ${ans(D(s[0]!))} or ${X} = ${ans(D(s[1]!))}.`],
  }, [s[0]!, s[1]!], p => samePair(p, [-c, c]) ? { ok: false, mc: MC.ignoreIn, say: `±${c} is the value of the INSIDE, ${inH(m, b)}. Solve for ${X} in each case.` } : null);
});

const splitPick: Gen = (R, n) => retry(() => {
  const { m, b, c } = eqPick(R);
  const u = inH(m, b);
  return choiceItem(R, {
    id: `splitPick-${n}`, family: 'splitPick', prompt: `Which statement says the same as ${absH(1, m, b)} = ${c}?`, board: `${absT(1, m, b)} = ${c}`,
    solution: [`Two numbers are ${c} from 0: ${c} and −${c}.`, `So the inside is one of them: ${u} = ${c} or ${u} = −${c}.`],
  }, [
    { t: `${u} = ${c} or ${u} = −${c}`, ok: true, say: 'Right: the inside is one of the two numbers at distance ' + c + ' from 0.' },
    { t: `${u} = ${c} and ${u} = −${c}`, mc: MC.andOr, say: `No ${X} makes the inside ${c} and −${c} at once. It is one OR the other.` },
    { t: `${u} = ${c} only`, mc: MC.onlyOne, say: `−${c} is also ${c} away from 0, so the inside can be −${c} too.` },
    { t: `${X} = ${c} or ${X} = −${c}`, mc: MC.ignoreIn, say: `±${c} is the value of the inside, ${u}, not of ${X}.` },
  ]);
});

// =====================================================================================================================
// 13 solution-count-by-sign
// =====================================================================================================================
const howManySol: Gen = (R, n) => retry(() => {
  const m = pick(R, [1, 2, -1, 3, -2]), b = nz(R, -7, 7), kind = int(R, 0, 2), c = kind === 0 ? int(R, 1, 8) : kind === 1 ? 0 : -int(R, 1, 8);
  const f: AbsF = { a: 1, m, b, k: 0 }, s = solveEq(f, c), cnt = s.length;
  need(s.every(half) && !(m < 0 && b < 0));
  return numItem({
    id: `howManySol-${n}`, family: 'howManySol', prompt: `How many solutions does ${absH(1, m, b)} = ${D(c)} have?`, board: `${absT(1, m, b)} = ${DT(c)}`, unit: 'solutions',
    picture: { g: hiddenV(f, s, [c], [hl(c), ...crossParts(s, c)]) },
    solution: [c > 0 ? `${c} &gt; 0: two numbers, ${c} and −${c}, are that far from 0.` : c === 0 ? 'Only 0 is 0 away from 0: the inside must be 0, one value of x.' : `An absolute value is never negative, so it is never ${D(c)}.`, `${ans(cnt)} solution${cnt === 1 ? '' : 's'}.`],
  }, cnt, v => {
    if (c === 0 && nearV(v, 2)) return { ok: false, mc: MC.twice, say: 'Both cases give the same x. A solution counts once: one solution.' };
    if (c < 0 && nearV(v, 2)) return { ok: false, mc: MC.negBranches, say: `An absolute value is a distance: it is never ${D(c)}. Splitting into cases does not help: no solution.` };
    if (c > 0 && nearV(v, 1)) return { ok: false, mc: MC.onlyOne, say: `The inside can be ${c} or −${c}: two solutions.` };
    return { ok: false, say: 'Look at the sign of the number on the right.' };
  });
});

const whichOne: Gen = (R, n) => retry(() => {
  const ins = shuffle(R, [[1, -3], [2, 5], [1, 4], [3, -2], [2, -7], [1, 6], [-1, 5]]).slice(0, 3) as [number, number][];
  const cs = shuffle(R, [int(R, 2, 8), 0, -int(R, 2, 8)]);
  const ask = int(R, 0, 2);   // 0: two, 1: one, 2: none
  const askT = ['exactly two solutions', 'exactly one solution', 'no solution'][ask]!;
  const want = ask === 0 ? (c: number) => c > 0 : ask === 1 ? (c: number) => c === 0 : (c: number) => c < 0;
  const eq = (i: number) => `${absH(1, ins[i]![0], ins[i]![1])} = ${D(cs[i]!)}`;
  return choiceItem(R, {
    id: `whichOne-${n}`, family: 'whichOne', prompt: `Which equation has ${askT}?`, board: cs.map((c, i) => `${absT(1, ins[i]![0], ins[i]![1])} = ${DT(c)}`).join(' \\qquad '),
    solution: ['Look only at the sign of the right side: positive → two solutions, 0 → one, negative → none.'],
  }, cs.map((c, i) => {
    const ok = want(c);
    const mc = ok ? undefined : ask === 0 && c < 0 ? MC.negBranches : ask === 0 && c === 0 ? MC.twice : ask === 1 && c > 0 ? MC.onlyOne : undefined;
    return { t: eq(i), ok, mc, say: ok ? 'Right.' : c > 0 ? `${D(c)} &gt; 0 gives two solutions.` : c === 0 ? 'A target of 0 gives one solution: the inside must be 0.' : 'A negative target gives no solution: |…| is never negative.' };
  }));
});

// =====================================================================================================================
// 14 isolate-first
// =====================================================================================================================
const isoPick = (R: () => number, tKind: 'pos' | 'any' = 'pos') => {
  const p = pick(R, [2, 3, 4, -2, -3]), h = int(R, -5, 5), q = nz(R, -9, 9);
  const kind = tKind === 'pos' ? 0 : int(R, 0, 2);
  const t = kind === 0 ? int(R, 1, 6) : kind === 1 ? 0 : -int(R, 1, 5);
  return { p, h, q, t, r: p * t + q };
};
const isolateSolve: Gen = (R, n) => retry(() => {
  const { p, h, q, t, r } = isoPick(R);
  need(Math.abs(r) <= 30);
  const f: AbsF = { a: p, m: 1, b: -h, k: q }, s: [number, number] = [h - t, h + t];
  const wrongB = h + (-r - q) / p;
  return twoSol({
    id: `isolateSolve-${n}`, family: 'isolateSolve', prompt: `Solve ${absH(p, 1, -h, q)} = ${D(r)}. Type the smaller solution first.`, board: `${absT(p, 1, -h, q)} = ${DT(r)}`,
    picture: { g: hiddenV(f, s, [r], [hl(r), ...crossParts(s, r)]) },
    solution: [`Isolate the bars: ${q > 0 ? 'subtract ' + q : 'add ' + -q}, then divide by ${D(p)}: |${inH(1, -h)}| = ${t}.`, `${inH(1, -h)} = ${t} or ${inH(1, -h)} = −${t}: ${X} = ${ans(D(h - t))} or ${X} = ${ans(D(h + t))}.`],
  }, s, pr => !samePair(sorted(h + t, wrongB), sorted(s[0], s[1])) && samePair(pr, sorted(h + t, wrongB)) ? { ok: false, mc: MC.splitFirst, say: `Get |${inH(1, -h)}| alone first. Only then split: |${inH(1, -h)}| = ${t}.` } : null);
});

const isolateLine: Gen = (R, n) => retry(() => {
  const neg = R() < 0.5;
  const p = neg ? pick(R, [-2, -3, -4]) : pick(R, [2, 3, 4]), h = nz(R, -5, 5), t = int(R, 1, 6);
  const q = neg && R() < 0.7 ? int(R, -9, Math.min(9, -p * t - 1)) : nz(R, -9, 9);
  need(q !== 0);
  const r = p * t + q, u = inH(1, -h);
  const opts: Opt[] = [{ t: `|${u}| = ${t}`, ok: true, say: `Right: ${q > 0 ? 'subtract ' + q : 'add ' + -q}, then divide by ${D(p)}.` }];
  if (p < 0 && r < 0) {
    opts.push({ t: `No solution, because the right side ${D(r)} is negative`, mc: MC.negSide, say: `The bars are not alone yet. After isolating, |${u}| = ${t}, which is positive.` });
    opts.push({ t: `|${inH(p, -p * h)}| = ${D(r - q)}, so no solution`, mc: MC.coefIn, say: `${D(p)}|${u}| is not |${inH(p, -p * h)}|: a negative number outside the bars cannot move in. Divide by ${D(p)} instead.` });
  } else {
    const t2 = (r + q) / p;
    if (nice(t2) && !nearV(t2, t)) opts.push({ t: `|${u}| = ${D(t2)}`, say: `Undo the ${D(q)} first: ${q > 0 ? 'subtract' : 'add'} ${Math.abs(q)}.` });
    opts.push({ t: `${D(p)}(${u}) ${q < 0 ? '−' : '+'} ${Math.abs(q)} = ${D(r)} or ${D(p)}(${u}) ${q < 0 ? '−' : '+'} ${Math.abs(q)} = ${D(-r)}`, mc: MC.splitFirst, say: 'Isolate the absolute value BEFORE you split into cases.' });
    if (opts.length < 3) opts.push({ t: `|${u}| = ${D(r - q)}`, say: `Divide by ${D(p)} too.` });
  }
  return choiceItem(R, {
    id: `isolateLine-${n}`, family: 'isolateLine', prompt: `First get the absolute value alone. What do you get from ${absH(p, 1, -h, q)} = ${D(r)}?`, board: `${absT(p, 1, -h, q)} = ${DT(r)}`,
    solution: [`${q > 0 ? 'Subtract ' + q : 'Add ' + -q}: ${D(p)}|${u}| = ${D(r - q)}.`, `Divide by ${D(p)}: |${u}| = ${t}.`],
  }, opts);
});

const isolateCount: Gen = (R, n) => retry(() => {
  const { p, h, q, t, r } = isoPick(R, 'any');
  need(Math.abs(r) <= 30);
  const cnt = t > 0 ? 2 : t === 0 ? 1 : 0;
  return numItem({
    id: `isolateCount-${n}`, family: 'isolateCount', prompt: `How many solutions does ${absH(p, 1, -h, q)} = ${D(r)} have?`, board: `${absT(p, 1, -h, q)} = ${DT(r)}`, unit: 'solutions',
    solution: [`Isolate first: |${inH(1, -h)}| = ${D(t)}.`, t > 0 ? `${t} &gt; 0: ${ans(2)} solutions.` : t === 0 ? `The inside must be 0: ${ans(1)} solution.` : `|…| is never negative: ${ans(0)} solutions.`],
  }, cnt, v => {
    if (t > 0 && nearV(v, 0) && r < 0) return { ok: false, mc: MC.negSide, say: `The right side is negative, but the bars are not alone yet. Isolated: |${inH(1, -h)}| = ${t}, positive.` };
    if (t === 0 && nearV(v, 2)) return { ok: false, mc: MC.twice, say: `|${inH(1, -h)}| = 0 only when ${X} = ${D(h)}: one solution.` };
    if (t < 0 && nearV(v, 2)) return { ok: false, mc: MC.negBranches, say: `Isolated: |${inH(1, -h)}| = ${D(t)}, a negative target. No solution.` };
    return { ok: false, say: 'Isolate the absolute value, then look at the sign of the right side.' };
  });
});

// =====================================================================================================================
// 15 solve-graphically
// =====================================================================================================================
const graphF = (R: () => number): AbsF => ({ a: pick(R, [1, 2, 0.5, -1, -2]), m: 1, b: -int(R, -3, 3), k: int(R, -3, 3) });
const graphCount: Gen = (R, n) => retry(() => {
  const f = graphF(R), kind = int(R, 0, 2), up = f.a > 0;
  const c = kind === 1 ? f.k : kind === 0 ? f.k + (up ? 1 : -1) * int(R, 1, 4) : f.k - (up ? 1 : -1) * int(R, 1, 3);
  const s = solveEq(f, c);
  return numItem({
    id: `graphCount-${n}`, family: 'graphCount', prompt: `The graph shows y = ${absH(f.a, 1, f.b, f.k)} and the line y = ${D(c)}. How many solutions does ${absH(f.a, 1, f.b, f.k)} = ${D(c)} have?`,
    board: `${absT(f.a, 1, f.b, f.k)} = ${DT(c)}`, unit: 'solutions', picture: { g: shownV(f, s, [c], [hl(c)], crossParts(s, c)) },
    solution: ['Each point where the V meets the line y = ' + D(c) + ' is one solution.', `They meet ${s.length === 2 ? 'twice' : s.length === 1 ? 'once, at the vertex' : 'nowhere'}: ${ans(s.length)} solution${s.length === 1 ? '' : 's'}.`],
  }, s.length, v => nearV(v, 2) ? { ok: false, mc: MC.fixedCount, say: 'Count the meeting points on THIS graph: an absolute value equation can have two, one or no solutions.' } : { ok: false, say: 'Count where the V meets the dashed line.' });
});

const graphSolve: Gen = (R, n) => retry(() => {
  const f = graphF(R), d = f.a === 0.5 ? pick(R, [2, 4]) : int(R, 1, 4), c = clean(f.k + f.a * d), h = -f.b;
  const s: [number, number] = [h - d, h + d];
  return twoSol({
    id: `graphSolve-${n}`, family: 'graphSolve', prompt: `Use the graph to solve ${absH(f.a, 1, f.b, f.k)} = ${D(c)}. Type the smaller solution first.`,
    board: `${absT(f.a, 1, f.b, f.k)} = ${DT(c)}`, picture: { g: shownV(f, s, [c], [hl(c)], crossParts(s, c)) },
    solution: ['The solutions are the x-coordinates where the V meets the line y = ' + D(c) + '.', `Read straight down: ${X} = ${ans(D(s[0]))} and ${X} = ${ans(D(s[1]))}.`],
  }, s, p => (nearV(p[0], c) || nearV(p[1], c)) && !s.some(v => nearV(v, c)) ? { ok: false, mc: MC.height, say: `${D(c)} is the height of the line. The solutions are the x-values where the graphs meet.` } : null);
});

// =====================================================================================================================
// 16 filter-candidates-by-condition
// =====================================================================================================================
const caseEq = (R: () => number) => {
  for (;;) {
    const m = pick(R, [1, 2, 3, -1, 2]), b = nz(R, -7, 7), kind = int(R, 0, 2), c = kind === 0 ? int(R, 1, 8) : kind === 1 ? 0 : -int(R, 1, 8);
    const x1 = (c - b) / m, x2 = (-c - b) / m;   // branch u ≥ 0: u = c; branch u < 0: −u = c
    if (!nice(x1) || !nice(x2)) continue;
    if ((Math.abs(m) === 1 && b === 0) || (m < 0 && b < 0)) continue;
    const k1 = m * x1 + b >= -1e-9, k2 = m * x2 + b < -1e-9;
    return { m, b, c, x1, x2, k1, k2 };
  }
};
const brLine = (m: number, b: number, c: number, pos: boolean, x: number) => pos
  ? `${inT(m, b)} \\ge 0:\\quad ${inT(m, b)} = ${DT(c)} \\ \\Rightarrow\\ x = ${DT(x)}`
  : `${inT(m, b)} < 0:\\quad -(${inT(m, b)}) = ${DT(c)} \\ \\Rightarrow\\ x = ${DT(x)}`;
const keepReject: Gen = (R, n) => retry(() => {
  const { m, b, c, x1, x2, k1, k2 } = caseEq(R), pos = c === 0 || R() < 0.5,   // a zero target: only the ≥ case (the < case rejects the true solution x = −b/m)
    x = pos ? x1 : x2, keep = pos ? k1 : k2, u = inH(m, b), uv = clean(m * x + b);
  const cond = pos ? `${u} ≥ 0` : `${u} &lt; 0`;
  const opts: Opt[] = [
    { t: 'Keep it: it meets its own case condition.', ok: keep, say: keep ? `Right: at ${X} = ${D(x)} the inside is ${D(uv)}, and ${cond} holds.` : `At ${X} = ${D(x)} the inside is ${D(uv)}, so ${cond} fails.` },
    { t: 'Reject it: it fails its own case condition.', ok: !keep, say: !keep ? `Right: at ${X} = ${D(x)} the inside is ${D(uv)}, so this case does not apply there.` : `At ${X} = ${D(x)} the inside is ${D(uv)}: ${cond} holds.` },
    keep ? { t: 'Reject it: it must meet both case conditions.', mc: MC.bothConds, say: 'No x meets both conditions at once. A candidate only has to meet the condition of the case it came from.' }
      : { t: 'Keep it: the algebra was right, so it solves the equation.', mc: MC.condIgnored, say: `The case formula only holds where ${cond}. At ${X} = ${D(x)} it does not, so ${D(x)} is not a solution.` },
  ];
  return choiceItem(R, {
    id: `keepReject-${n}`, family: 'keepReject', prompt: `Solving ${absH(1, m, b)} = ${D(c)} case by case: the case ${cond} gives ${X} = ${D(x)}. Keep it or reject it?`,
    board: `${absT(1, m, b)} = ${DT(c)}`, picture: { slate: [`${absT(1, m, b)} = ${DT(c)}`, brLine(m, b, c, pos, x)] },
    solution: [`Test the case condition at ${X} = ${D(x)}: ${u} = ${D(uv)}.`, `${cond} ${keep ? 'holds: keep it' : 'fails: reject it'}${keep ? ` (check: |${D(uv)}| = ${D(Math.abs(uv))})` : ''}.`],
  }, opts);
});

const branchCount: Gen = (R, n) => retry(() => {
  const { m, b, c, x1, x2, k1, k2 } = caseEq(R);
  const kept = [k1 ? x1 : null, k2 ? x2 : null].filter((v): v is number => v !== null);
  const cnt = new Set(kept.map(v => clean(v))).size;
  const u = inH(m, b);
  return numItem({
    id: `branchCount-${n}`, family: 'branchCount', prompt: `Both cases of ${absH(1, m, b)} = ${D(c)} are worked out below. Test each candidate against its own condition. How many solutions does the equation have?`,
    board: `${absT(1, m, b)} = ${DT(c)}`, unit: 'solutions', picture: { slate: [`${absT(1, m, b)} = ${DT(c)}`, brLine(m, b, c, true, x1), brLine(m, b, c, false, x2)] },
    solution: [`${X} = ${D(x1)}: ${u} = ${D(m * x1 + b)}, so ${u} ≥ 0 ${k1 ? 'holds' : 'fails'}.`, `${X} = ${D(x2)}: ${u} = ${D(m * x2 + b)}, so ${u} &lt; 0 ${k2 ? 'holds' : 'fails'}.`, `${ans(cnt)} solution${cnt === 1 ? '' : 's'}.`],
  }, cnt, v => {
    if (c === 0 && nearV(v, 2)) return { ok: false, mc: MC.twice, say: `Both cases give ${X} = ${D(x1)}, and only the first keeps it. One solution.` };
    if (c < 0 && nearV(v, 2)) return { ok: false, mc: MC.condIgnored, say: 'Test each candidate in its own condition: both fail. No solution, as the sign rule says.' };
    return { ok: false, say: 'Plug each candidate into the inside and test the condition of its case.' };
  });
});

// =====================================================================================================================
// 17 completeness-justification
// =====================================================================================================================
const checkVsCases: Gen = (R, n) => retry(() => {
  const { m, b, c, s } = eqPick(R);
  const found = R() < 0.5 ? s[0]! : s[1]!, other = found === s[0] ? s[1]! : s[0]!;
  return choiceItem(R, {
    id: `checkVsCases-${n}`, family: 'checkVsCases', prompt: `Ben solves ${absH(1, m, b)} = ${c}. He finds ${X} = ${D(found)} and checks it: |${subst(m, b, found)}| = ${c} ✓. Is “${X} = ${D(found)}” the complete answer?`,
    board: `${absT(1, m, b)} = ${c}`,
    solution: [`A check shows ${D(found)} works. It does not show nothing else works.`, `The other case, ${inH(m, b)} = ${m * found + b > 0 ? '−' : ''}${c}, gives ${X} = ${D(other)}, which works too.`],
  }, [
    { t: `No: the other case gives ${X} = ${D(other)}, and it works too.`, ok: true, say: 'Right: checking proves a candidate works; only covering both cases proves you found them all.' },
    { t: `Yes: ${X} = ${D(found)} checks, so it is the solution.`, mc: MC.checked, say: 'A check proves one value works. It cannot show that no other value works.' },
    { t: 'Yes: an absolute value equation has one solution for each target.', mc: MC.onlyOne, say: `The inside can be ${c} or −${c}: each gives a solution.` },
  ]);
});

const completeWhy: Gen = (R, n) => retry(() => {
  const { m, b, c, s } = eqPick(R), u = inH(m, b);
  return choiceItem(R, {
    id: `completeWhy-${n}`, family: 'completeWhy', prompt: `The cases ${u} ≥ 0 and ${u} &lt; 0 turn ${absH(1, m, b)} = ${c} into ${X} = ${D(s[0]!)} or ${X} = ${D(s[1]!)}. Why can there be no other solution?`,
    board: `${absT(1, m, b)} = ${c}`,
    solution: ['Every real x is in exactly one of the two cases.', 'Inside each case the equation is the same as one linear equation, so its solutions are exactly that equation’s solutions.'],
  }, [
    { t: 'Every real number is in exactly one case, and in each case the equation is equivalent to one linear equation.', ok: true, say: 'Right: the cases cover every x, and each case loses and adds nothing.' },
    { t: 'Both answers check in the original equation.', mc: MC.checked, say: 'Checking shows these two work. It says nothing about other values.' },
    { t: 'An absolute value equation always has two solutions.', mc: MC.fixedCount, say: 'Not always: a target of 0 gives one, a negative target none.' },
  ]);
});

// =====================================================================================================================
// 18 model-distance-context
// =====================================================================================================================
interface Ctx { v: string; target: number; d: number; unit: string; story: (t: string, d: string) => string; lowWord: string; highWord: string }
const ctxs = (R: () => number): Ctx => pick(R, [
  () => { const t = int(R, 64, 72), d = int(R, 2, 5); return { v: 'T', target: t, d, unit: '°F', story: (a: string, e: string) => `A thermostat is set to ${a}°F. Which temperatures <i>T</i> are exactly ${e}°F away from the setting?`, lowWord: 'lowest', highWord: 'highest' }; },
  () => { const t = int(R, 12, 58), d = int(R, 2, 9); return { v: 'x', target: t, d, unit: 'miles', story: (a: string, e: string) => `A rest stop is at mile marker ${a} on a highway. Which mile markers <i>x</i> are exactly ${e} miles from it?`, lowWord: 'lower', highWord: 'higher' }; },
  () => { const t = pick(R, [3.5, 2.25, 4, 1.75, 2.5]), d = pick(R, [0.02, 0.05, 0.01, 0.03]); return { v: 'L', target: t, d, unit: 'in.', story: (a: string, e: string) => `A bolt is made to be ${a} in. long and may be off by at most ${e} in. What are the longest and shortest allowed lengths <i>L</i> (exactly ${e} in. off)?`, lowWord: 'shortest', highWord: 'longest' }; },
  () => { const t = pick(R, [55, 60, 65, 70]), d = int(R, 3, 8); return { v: 's', target: t, d, unit: 'mph', story: (a: string, e: string) => `Cruise control is set to ${a} mph. Which speeds <i>s</i> are exactly ${e} mph off the setting?`, lowWord: 'lower', highWord: 'higher' }; },
  () => { const t = pick(R, [325, 350, 375, 400]), d = pick(R, [10, 15, 20, 25]); return { v: 'T', target: t, d, unit: '°F', story: (a: string, e: string) => `An oven is set to ${a}°F. Which oven temperatures <i>T</i> are exactly ${e}°F away from the setting?`, lowWord: 'lowest', highWord: 'highest' }; },
])();
const modelEq: Gen = (R, n) => retry(() => {
  const C = ctxs(R), v = `<i>${C.v}</i>`, t = D(C.target), d = D(C.d);
  need(C.target !== C.d);
  return choiceItem(R, {
    id: `modelEq-${n}`, family: 'modelEq', prompt: `${C.story(t, d)} Which equation finds them?`, board: `\\text{target } ${DT(C.target)},\\ \\text{exactly } ${DT(C.d)} \\text{ away}`,
    solution: [`“Exactly ${d} away from ${t}” is a distance: |${v} − ${t}|.`, `That distance equals ${d}: |${v} − ${t}| = ${d}.`],
  }, [
    { t: `|${v} − ${t}| = ${d}`, ok: true, say: 'Right: the distance from the target is the absolute value of the difference.' },
    { t: `|${v} + ${t}| = ${d}`, mc: MC.signZero, say: `|${v} + ${t}| is the distance from −${t}. Subtract the target.` },
    { t: `|${v} − ${d}| = ${t}`, mc: MC.wrongQty, say: `The target goes inside with ${v}; the allowed distance goes on the other side.` },
    { t: `${v} − ${t} = ${d}`, mc: MC.onlyOne, say: `That finds only the value above the target. ${d} below counts too.` },
  ]);
});

const exactlyAway: Gen = (R, n) => retry(() => {
  const C = ctxs(R), v = `<i>${C.v}</i>`, lo = clean(C.target - C.d), hi = clean(C.target + C.d);
  return twoSol({
    id: `exactlyAway-${n}`, family: 'exactlyAway', prompt: `${C.story(D(C.target), D(C.d))} Solve |${v} − ${D(C.target)}| = ${D(C.d)}. Type the ${C.lowWord} first.`,
    board: `|${C.v} - ${DT(C.target)}| = ${DT(C.d)}`, unit: C.unit,
    solution: [`${v} − ${D(C.target)} = ${D(C.d)} or ${v} − ${D(C.target)} = −${D(C.d)}.`, `${v} = ${ans(D(lo))} or ${v} = ${ans(D(hi))} ${C.unit}.`],
  }, [lo, hi], p => samePair(p, sorted(-C.d, C.d)) ? { ok: false, mc: MC.ignoreIn, say: `Those are values of ${v} − ${D(C.target)}. Add ${D(C.target)} back.` } : null, v);
});

const domainReject: Gen = (R, n) => retry(() => {
  const trail = R() < 0.5;
  if (trail) {
    const M = int(R, 2, 6), d = int(R, M + 1, 12);
    return numItem({
      id: `domainReject-${n}`, family: 'domainReject', prompt: `A trail runs from mile 0 to mile 30. A water stop is at mile ${M}. Solve |${X} − ${M}| = ${d} to find the trail mile marker exactly ${d} miles from the stop.`,
      board: `|x - ${M}| = ${d},\\quad 0 \\le x \\le 30`, unit: 'miles',
      picture: { line: { values: [0, M - d, M + d, M], reveal: { set: ray('=', M + d), center: M, arcs: [{ to: M - d, label: String(d) }, { to: M + d, label: String(d) }], result: `x = ${M + d}` } } },
      solution: [`${X} − ${M} = ${d} or ${X} − ${M} = −${d}: ${X} = ${M + d} or ${X} = ${M - d}.`, `Mile ${M - d} is not on the trail (it starts at 0). Only ${ans(M + d)}.`],
    }, M + d, v => nearV(v, M - d) ? { ok: false, mc: MC.ctxAll, say: `Mile ${M - d} is before the start of the trail. Keep only values in 0 ≤ x ≤ 30.` } : { ok: false, say: 'Solve both cases, then keep only the one on the trail.' });
  }
  const T0 = int(R, 68, 72), d = int(R, T0 - 64, 80 - T0);
  need(T0 - d < 65 && T0 + d <= 80);
  return numItem({
    id: `domainReject-${n}`, family: 'domainReject', prompt: `A sensor reads temperatures from 65°F to 80°F only. Which reading is exactly ${d}°F away from ${T0}°F? Solve |<i>T</i> − ${T0}| = ${d} and keep what the sensor can show.`,
    board: `|T - ${T0}| = ${d},\\quad 65 \\le T \\le 80`, unit: '°F',
    picture: { line: { values: [T0 - d, T0 + d, T0, 65, 80], reveal: { set: ray('=', T0 + d), center: T0, arcs: [{ to: T0 - d, label: String(d) }, { to: T0 + d, label: String(d) }], result: `T = ${T0 + d}` } } },
    solution: [`<i>T</i> = ${T0 + d} or <i>T</i> = ${T0 - d}.`, `${T0 - d}°F is below 65°F, outside the sensor's range. Only ${ans(T0 + d)}°F.`],
  }, T0 + d, v => nearV(v, T0 - d) ? { ok: false, mc: MC.ctxAll, say: `${T0 - d}°F is below what the sensor reads (65°F to 80°F).` } : { ok: false, say: 'Solve both cases, then keep only the one the sensor can show.' });
});

// =====================================================================================================================
// 19 model-abs-function-context
// =====================================================================================================================
const ride = (R: () => number) => {
  const r = pick(R, [8, 10, 12, 15, 16]), t0 = pick(R, [1.5, 2, 2.5, 3]), T = 2 * t0, mk = pick(R, [20, 30, 40]);
  const f: AbsF = { a: r, m: 1, b: -t0, k: 0 };
  const g: GPic = {
    ...win([0, T], [0, r * t0], { cells: 12 }),
    parts: [
      { kind: 'piece', key: 'vL', fn: lin(-r, r * t0), lo: 0, hi: t0, ends: ['closed', 'none'], col: 'link' },
      { kind: 'piece', key: 'vR', fn: lin(r, -r * t0), lo: t0, hi: T, ends: ['none', 'closed'], col: 'link' },
    ],
  };
  g.x.name = 'time (h)'; g.y.name = 'miles from marker';
  const story = `A cyclist rides at ${r} mph along a straight trail and passes the mile-${mk} marker ${D(t0)} h after she starts. Her distance from the marker is <i>d</i>(<i>t</i>) = ${r}|<i>t</i> − ${D(t0)}| miles, for 0 ≤ <i>t</i> ≤ ${D(T)}.`;
  return { r, t0, T, f, g, story, board: `d(t) = ${r}|t - ${DT(t0)}|,\\quad 0 \\le t \\le ${DT(T)}` };
};
const rideRead: Gen = (R, n) => retry(() => {
  const M = ride(R), q = int(R, 0, 2);
  if (q === 0) return numItem({
    id: `rideRead-${n}`, family: 'rideRead', prompt: `${M.story} How far from the marker is she when she starts?`, board: M.board, unit: 'miles', picture: { g: M.g },
    solution: [`She starts at <i>t</i> = 0: <i>d</i>(0) = ${M.r}|0 − ${D(M.t0)}| = ${M.r} · ${D(M.t0)}.`, `${ans(D(M.r * M.t0))} miles.`],
  }, M.r * M.t0, v => nearV(v, 0) ? { ok: false, mc: MC.vertexStart, say: 'The vertex is when she PASSES the marker, not when she starts. The start is t = 0, the left end of the graph.' } : { ok: false, say: 'Put t = 0 into d(t).' });
  if (q === 1) return numItem({
    id: `rideRead-${n}`, family: 'rideRead', prompt: `${M.story} At what time is she at the marker?`, board: M.board, unit: 'hours', picture: { g: M.g },
    solution: ['At the marker her distance is 0: the vertex.', `${M.r}|<i>t</i> − ${D(M.t0)}| = 0 at <i>t</i> = ${ans(D(M.t0))} h.`],
  }, M.t0, v => nearV(v, 0) ? { ok: false, mc: MC.vertexStart, say: 'At t = 0 she is just starting, still away from the marker. She reaches it at the vertex.' } : { ok: false, say: 'Find where the distance is 0.' });
  const j = pick(R, [0.5, 1, 1.5].filter(x => x < M.t0)), D0 = M.r * j;
  return numItem({
    id: `rideRead-${n}`, family: 'rideRead', prompt: `${M.story} After passing the marker, when is she ${D(D0)} miles from it?`, board: M.board, unit: 'hours', picture: { g: M.g },
    solution: [`${M.r}|<i>t</i> − ${D(M.t0)}| = ${D(D0)} gives |<i>t</i> − ${D(M.t0)}| = ${D(j)}.`, `After passing: <i>t</i> = ${D(M.t0)} + ${D(j)} = ${ans(D(M.t0 + j))} h.`],
  }, M.t0 + j, v => nearV(v, M.t0 - j) ? { ok: false, say: `${D(M.t0 - j)} h is BEFORE she passes the marker. After passing: ${D(M.t0)} + ${D(j)}.` } : { ok: false, say: `Solve ${M.r}|t − ${D(M.t0)}| = ${D(D0)} and take the later time.` });
});

const rateUnits: Gen = (R, n) => retry(() => {
  const M = ride(R), left = R() < 0.5;
  return choiceItem(R, {
    id: `rateUnits-${n}`, family: 'rateUnits', prompt: `${M.story} The ${left ? 'left' : 'right'} piece of the graph has slope ${left ? '−' : ''}${M.r}. What does that mean?`, board: M.board, picture: { g: M.g },
    solution: ['A slope is a rate: miles of distance per hour of time.', left ? `Before the marker her distance to it shrinks by ${M.r} miles each hour.` : `After the marker her distance from it grows by ${M.r} miles each hour.`],
  }, left ? [
    { t: `Her distance to the marker shrinks by ${M.r} miles each hour.`, ok: true, say: 'Right: slope is miles per hour.' },
    { t: `She is ${M.r} miles from the marker.`, mc: MC.ratePer, say: 'The slope is a rate (miles per hour), not a distance.' },
    { t: `Her distance from the marker is −${M.r} miles.`, mc: MC.negDist, say: 'A distance is never negative. The minus means the distance is going DOWN.' },
  ] : [
    { t: `Her distance from the marker grows by ${M.r} miles each hour.`, ok: true, say: 'Right: slope is miles per hour.' },
    { t: `She is ${M.r} miles from the marker.`, mc: MC.ratePer, say: 'The slope is a rate (miles per hour), not a distance.' },
    { t: `She rides ${M.r} mph faster after the marker.`, say: `She rides ${M.r} mph the whole time. The slope says how fast her distance from the marker changes.` },
  ]);
});

const rideDomain: Gen = (R, n) => retry(() => {
  const M = ride(R), range = R() < 0.4;
  const t = '<i>t</i>', d = '<i>d</i>';
  return choiceItem(R, {
    id: `rideDomain-${n}`, family: 'rideDomain', prompt: `${M.story} What is the ${range ? 'range' : 'domain'} of <i>d</i> for this ride?`, board: M.board, picture: { g: M.g },
    solution: range ? [`The distance is 0 at the marker and ${D(M.r * M.t0)} at both ends of the ride.`, `Range: 0 ≤ ${d} ≤ ${D(M.r * M.t0)}.`] : [`The ride lasts from ${t} = 0 to ${t} = ${D(M.T)}.`, `Domain: 0 ≤ ${t} ≤ ${D(M.T)}.`],
  }, range ? [
    { t: `0 ≤ ${d} ≤ ${D(M.r * M.t0)}`, ok: true, say: 'Right.' },
    { t: `${d} ≥ 0`, mc: MC.rangeParent, say: `The ride ends at ${t} = ${D(M.T)}, so the distance never gets past ${D(M.r * M.t0)} miles.` },
    { t: 'all real numbers', mc: MC.rangeAll, say: 'A distance is never negative, and the ride is short.' },
  ] : [
    { t: `0 ≤ ${t} ≤ ${D(M.T)}`, ok: true, say: 'Right.' },
    { t: 'all real numbers', mc: MC.ctxAll, say: `The formula works for any t, but the ride only lasts from 0 to ${D(M.T)} hours.` },
    { t: `${t} ≥ ${D(M.t0)}`, mc: MC.vertexStart, say: `${D(M.t0)} h is when she passes the marker. She starts at t = 0.` },
  ]);
});

// =====================================================================================================================
// 20-23 inequalities
// =====================================================================================================================
const ineqPick = (R: () => number) => {
  for (;;) {
    const m = pick(R, [1, 1, 2, -1, 2]), b = nz(R, -6, 6), c = pick(R, [1, 2, 3, 4, 5, 6, 7, 2.5, 1.5]);
    const lo = Math.min((-c - b) / m, (c - b) / m), hi = Math.max((-c - b) / m, (c - b) / m);
    if (!half(lo) || !half(hi) || Math.abs(lo) > 12 || Math.abs(hi) > 12 || (m < 0 && b < 0)) continue;
    return { m, b, c, lo, hi, center: clean(-b / m) };
  }
};
const lineOf = (S: SSet, vals: number[], tests: number[], result: string): NumPic => ({ values: [...vals, ...tests], reveal: { set: S, tests: tests.map((v, i) => ({ key: 't' + i, v })), result } });

const andSolve: Gen = (R, n) => retry(() => {
  const { m, b, c, lo, hi, center } = ineqPick(R), rel: Rel = R() < 0.5 ? '<' : '<=';
  const S = absIneq(m, b, rel, c);
  return pairItem({
    id: `andSolve-${n}`, family: 'andSolve', prompt: `Solve ${absH(1, m, b)} ${relH(rel)} ${D(c)}. Fill in the two ends.`, board: `${absT(1, m, b)} ${relT(rel)} ${DT(c)}`,
    pairLead: '', pairOp: `${relH(rel)} ${X} ${relH(rel)}`, picture: { line: lineOf(S, [lo, hi], [center, hi + (hi - lo) / 2 > 12 ? lo - 1 : hi + 1], setDT(S)) },
    solution: [`Within ${D(c)} of 0: −${D(c)} ${relH(rel)} ${inH(m, b)} ${relH(rel)} ${D(c)} (one band, an “and”).`, `Solve all three parts${m < 0 ? ' (dividing by a negative turns both signs)' : ''}: ${ans(D(lo))} ${relH(rel)} ${X} ${relH(rel)} ${ans(D(hi))}.`],
  }, lo, hi, (x, y) => {
    if (nearV(x, lo) && nearV(y, hi)) return { ok: true, say: 'Right.' };
    if (nearV(x, hi) && nearV(y, lo)) return { ok: false, say: 'Write the smaller end on the left.' };
    if (nearV(x, -c) && nearV(y, c) && !(nearV(lo, -c))) return { ok: false, mc: MC.ignoreIn, say: `±${D(c)} bound the INSIDE, ${inH(m, b)}. Solve for ${X}.` };
    return { ok: false, say: `Write −${D(c)} ${relH(rel)} ${inH(m, b)} ${relH(rel)} ${D(c)} and solve all three parts.` };
  });
});

const andPick: Gen = (R, n) => retry(() => {
  const { m, b, c } = ineqPick(R), rel: Rel = R() < 0.5 ? '<' : '<=';
  const S = absIneq(m, b, rel, c), ends = [S[0]!.lo, S[0]!.hi], u = { a: m, b };
  const orS = union(ray(rel === '<' ? '<' : '<=', ends[0]!), ray(rel === '<' ? '>' : '>=', ends[1]!));
  const posOnly = solveRay(u.a, u.b, rel, c), sameDir = solveRay(u.a, u.b, rel, -c);
  return choiceItem(R, {
    id: `andPick-${n}`, family: 'andPick', prompt: `Which is the solution of ${absH(1, m, b)} ${relH(rel)} ${D(c)}?`, board: `${absT(1, m, b)} ${relT(rel)} ${DT(c)}`,
    picture: { line: lineOf(S, ends as number[], [], setDT(S)) },
    solution: [`“Less than ${D(c)} from 0” is one band: −${D(c)} ${relH(rel)} ${inH(m, b)} ${relH(rel)} ${D(c)}.`, `Solve all three parts.`],
  }, [
    { t: setD(S), ok: true, say: 'Right: one band, both conditions at once.' },
    { t: setD(orS), mc: MC.andOr, say: `Those x are FARTHER than ${D(c)} from the center. “Less than” is the band between, an “and”.` },
    { t: setD(posOnly), mc: MC.onlyOne, say: `That only uses ${inH(m, b)} ${relH(rel)} ${D(c)}. The inside must also stay above −${D(c)}.` },
    { t: setD(sameDir), mc: MC.sameDir, say: `At the negative bound the inequality turns: ${inH(m, b)} ${relH(flipRel(rel))} −${D(c)}.` },
  ]);
});
function solveRay(m: number, b: number, rel: Rel, t: number): SSet {
  // m x + b rel t
  const v = (t - b) / m;
  return ray(m > 0 ? rel : flipRel(rel), clean(v));
}

const orSolve: Gen = (R, n) => retry(() => {
  const { m, b, c, lo, hi, center } = ineqPick(R), rel: Rel = R() < 0.5 ? '>' : '>=';
  const S = absIneq(m, b, rel, c), lr: Rel = rel === '>' ? '<' : '<=';
  return pairItem({
    id: `orSolve-${n}`, family: 'orSolve', prompt: `Solve ${absH(1, m, b)} ${relH(rel)} ${D(c)}. Fill in the two ends.`, board: `${absT(1, m, b)} ${relT(rel)} ${DT(c)}`,
    pairLead: `${X} ${relH(lr)}`, pairOp: `or ${X} ${relH(rel)}`, picture: { line: lineOf(S, [lo, hi], [center, lo - 1, hi + 1], setDT(S)) },
    solution: [`Farther than ${D(c)} from 0: ${inH(m, b)} ${relH(lr)} −${D(c)} or ${inH(m, b)} ${relH(rel)} ${D(c)}.`, `Solve each${m < 0 ? ' (dividing by a negative turns the sign)' : ''}: ${X} ${relH(lr)} ${ans(D(lo))} or ${X} ${relH(rel)} ${ans(D(hi))}.`],
  }, lo, hi, (x, y) => {
    if (nearV(x, lo) && nearV(y, hi)) return { ok: true, say: 'Right.' };
    if (nearV(x, hi) && nearV(y, lo)) return { ok: false, say: 'The left ray ends at the smaller number.' };
    if (nearV(x, -c) && nearV(y, c) && !nearV(lo, -c)) return { ok: false, mc: MC.ignoreIn, say: `±${D(c)} bound the inside, ${inH(m, b)}. Solve for ${X}.` };
    return { ok: false, say: `Split: ${inH(m, b)} ${relH(lr)} −${D(c)} or ${inH(m, b)} ${relH(rel)} ${D(c)}, and solve each.` };
  });
});

const orPick: Gen = (R, n) => retry(() => {
  const { m, b, c } = ineqPick(R), rel: Rel = R() < 0.5 ? '>' : '>=';
  const S = absIneq(m, b, rel, c), lo = S[0]!.hi, hi = S[1]!.lo, s = rel === '>' ? '&gt;' : '≥', sl = rel === '>' ? '&lt;' : '≤';
  return choiceItem(R, {
    id: `orPick-${n}`, family: 'orPick', prompt: `Which is the solution of ${absH(1, m, b)} ${relH(rel)} ${D(c)}?`, board: `${absT(1, m, b)} ${relT(rel)} ${DT(c)}`,
    picture: { line: lineOf(S, [lo, hi], [], setDT(S)) },
    solution: [`Farther than ${D(c)} from 0: two rays, an “or”.`, `${inH(m, b)} ${sl} −${D(c)} or ${inH(m, b)} ${s} ${D(c)}.`],
  }, [
    { t: setD(S), ok: true, say: 'Right: two rays, an “or”.' },
    { t: `${D(lo)} ${sl} ${X} ${sl} ${D(hi)}`, mc: MC.andOr, say: `That is the band WITHIN ${D(c)}. “Greater than” is outside it: two rays.` },
    { t: `${D(lo)} ${s} ${X} ${s} ${D(hi)}`, mc: MC.chain, say: `No number is below ${D(lo)} and above ${D(hi)} at once. Write the two rays with “or”.` },
    { t: setD(solveRay(m, b, rel, c)), mc: MC.onlyOne, say: `That is only one ray. The inside can also be less than −${D(c)}.` },
  ]);
});

const isoPickI = (R: () => number) => {
  const p = pick(R, [2, 3, -2, -3, -1]), h = int(R, -5, 5), t = int(R, 1, 6), q = nz(R, -8, 8), rel = pick(R, ['<', '<=', '>', '>='] as Rel[]);
  return { p, h, t, q, rel, r: p * t + q, iso: p < 0 ? flipRel(rel) : rel };
};
const isoForm: Gen = (R, n) => retry(() => {
  const { p, h, t, q, rel, r, iso } = isoPickI(R), u = inH(1, -h);
  const t2 = (r + q) / p;
  const opts: Opt[] = [
    { t: `|${u}| ${relH(iso)} ${t}`, ok: true, say: p < 0 ? `Right: dividing by ${D(p)} turns the sign.` : 'Right.' },
    { t: `|${u}| ${relH(flipRel(iso))} ${t}`, mc: p < 0 ? MC.noRev : undefined, say: p < 0 ? `Dividing by ${D(p)}, a negative number, turns the inequality around.` : `Dividing by ${D(p)}, a positive number, keeps the direction.` },
    nice(t2) && !nearV(t2, t) ? { t: `|${u}| ${relH(iso)} ${D(t2)}`, say: `Undo the ${D(q)} first: ${q > 0 ? 'subtract' : 'add'} ${Math.abs(q)}.` } : { t: `|${u}| ${relH(iso)} ${D(r - q)}`, say: `Divide by ${D(p)} too.` },
  ];
  return choiceItem(R, {
    id: `isoForm-${n}`, family: 'isoForm', prompt: `Get the absolute value alone in ${absH(p, 1, -h, q)} ${relH(rel)} ${D(r)}. What do you get?`, board: `${absT(p, 1, -h, q)} ${relT(rel)} ${DT(r)}`,
    solution: [`${q > 0 ? 'Subtract ' + q : 'Add ' + -q}: ${D(p)}|${u}| ${relH(rel)} ${D(r - q)}.`, `Divide by ${D(p)}${p < 0 ? ' (negative: turn the sign)' : ''}: |${u}| ${relH(iso)} ${t}.`],
  }, opts);
});

const isoSolve: Gen = (R, n) => retry(() => {
  const { p, h, t, q, rel, r, iso } = isoPickI(R), u = inH(1, -h);
  const S = absIneq(1, -h, iso, t), U = absIneq(1, -h, flipRel(iso), t);
  const other: Rel = iso === '<' ? '<=' : iso === '<=' ? '<' : iso === '>' ? '>=' : '>';
  const W = absIneq(1, -h, other, t), t2 = (r + q) / p;
  const opts: Opt[] = [
    { t: setD(S), ok: true, say: 'Right.' },
    { t: setD(U), mc: p < 0 ? MC.noRev : MC.andOr, say: p < 0 ? `Dividing by ${D(p)} turns the sign: |${u}| ${relH(iso)} ${t}. That flips “and” and “or”.` : `|${u}| ${relH(iso)} ${t} is ${iso[0] === '<' ? 'a band (“and”)' : 'two rays (“or”)'}.` },
    { t: setD(W), say: `Check the ends: ${relH(iso)} ${iso.length === 2 ? 'includes' : 'leaves out'} them.` },
  ];
  if (nice(t2) && t2 > 0 && !nearV(t2, t)) opts.push({ t: setD(absIneq(1, -h, iso, t2)), say: `Undo the ${D(q)} first, then divide.` });
  return choiceItem(R, {
    id: `isoSolve-${n}`, family: 'isoSolve', prompt: `Solve ${absH(p, 1, -h, q)} ${relH(rel)} ${D(r)}.`, board: `${absT(p, 1, -h, q)} ${relT(rel)} ${DT(r)}`,
    picture: { line: lineOf(S, [h - t, h + t], [], setDT(S)) },
    solution: [`Isolate: |${u}| ${relH(iso)} ${t}${p < 0 ? ' (dividing by ' + D(p) + ' turned the sign)' : ''}.`, iso[0] === '<' ? `Within ${t} of ${D(h)}: ${setD(S)}.` : `Farther than ${t} from ${D(h)}: ${setD(S)}.`],
  }, opts);
});

const SPECIAL = ['No solution', 'All real numbers'] as const;
function specialOpts(rel: Rel, t: number, h: number, mb: { m: number; b: number }): Opt[] {
  const S = absIneq(mb.m, mb.b, rel, t);
  const isAll = S.length === 1 && S[0]!.lo === -Infinity && S[0]!.hi === Infinity;
  const kind = !S.length ? 0 : isAll ? 1 : S.length === 1 ? 2 : 3;
  const texts = [SPECIAL[0], SPECIAL[1], `Only ${X} = ${D(h)}`, `All real numbers except ${X} = ${D(h)}`];
  const why = 'An absolute value is a distance: it is never negative.';
  const opts: Opt[] = texts.map((tt, i) => {
    const ok = i === kind;
    let mc: string | undefined, say = ok ? `Right. ${why}` : why;
    if (!ok && t < 0 && i === 0 && kind === 1) { mc = MC.alwaysNone; say = `|…| ≥ 0 is always more than ${D(t)}, so EVERY x works.`; }
    if (!ok && t === 0 && i === 1 && kind === 3) { mc = MC.excluded; say = `At ${X} = ${D(h)} the absolute value is 0, and 0 &gt; 0 is false. Leave ${D(h)} out.`; }
    if (!ok && t === 0 && i === 0 && kind === 2) say = `At ${X} = ${D(h)} the absolute value is 0, and 0 ≤ 0 is true.`;
    if (!ok && t === 0 && i === 1 && kind === 2) say = `Only 0 is ≤ 0, so the inside must be 0.`;
    return { t: tt, ok, mc, say };
  });
  if (t < 0) {
    const M = absIneq(mb.m, mb.b, rel, -t);
    opts.push({ t: setD(M), mc: MC.madePos, say: `You may not drop the minus of ${D(t)}. |…| is never negative.` });
  }
  return opts;
}
const specialSet: Gen = (R, n) => retry(() => {
  const h = nz(R, -5, 5), t = R() < 0.5 ? 0 : -int(R, 1, 6), rel = pick(R, ['<', '<=', '>', '>='] as Rel[]);
  return choiceItem(R, {
    id: `specialSet-${n}`, family: 'specialSet', prompt: `Solve ${absH(1, 1, -h)} ${relH(rel)} ${D(t)}.`, board: `${absT(1, 1, -h)} ${relT(rel)} ${DT(t)}`,
    solution: [`|${inH(1, -h)}| is never negative${t === 0 ? `, and it is 0 only at ${X} = ${D(h)}` : ''}.`, `So |${inH(1, -h)}| ${relH(rel)} ${D(t)} holds ${t < 0 ? (rel[0] === '<' ? 'for no x' : 'for every x') : rel === '<' ? 'for no x' : rel === '<=' ? `only at ${D(h)}` : rel === '>' ? `everywhere except ${D(h)}` : 'for every x'}.`],
  }, specialOpts(rel, t, h, { m: 1, b: -h }));
});

const specialIsolate: Gen = (R, n) => retry(() => {
  const p = pick(R, [2, 3, 4]), m = pick(R, [1, 2, 1]), b = nz(R, -6, 6), h = clean(-b / m);
  need(nice(h));
  const t = R() < 0.4 ? 0 : -int(R, 1, 4), q = nz(R, -7, 9), r = p * t + q, rel = pick(R, ['<', '<=', '>', '>='] as Rel[]);
  return choiceItem(R, {
    id: `specialIsolate-${n}`, family: 'specialIsolate', prompt: `Solve ${absH(p, m, b, q)} ${relH(rel)} ${D(r)}.`, board: `${absT(p, m, b, q)} ${relT(rel)} ${DT(r)}`,
    solution: [`Isolate: |${inH(m, b)}| ${relH(rel)} ${D(t)}.`, t < 0 ? `|…| is never negative: ${rel[0] === '<' ? 'no x works' : 'every x works'}.` : `|${inH(m, b)}| is 0 only at ${X} = ${D(h)}: ${rel === '<' ? 'no x works' : rel === '<=' ? `only ${D(h)}` : rel === '>' ? `every x except ${D(h)}` : 'every x works'}.`],
  }, specialOpts(rel, t, h, { m, b }));
});

// =====================================================================================================================
// 24 model-tolerance-inequality
// =====================================================================================================================
interface Tol { v: string; target: number; tol: number; unit: string; text: string; rel: Rel }
const tolCtx = (R: () => number): Tol => pick(R, [
  () => { const t = pick(R, [3.5, 2.25, 4, 1.75]), e = pick(R, [0.02, 0.05, 0.01]); return { v: 'x', target: t, tol: e, unit: 'in.', rel: '<=' as Rel, text: `A bolt should be ${D(t)} in. long. It passes if its length <i>x</i> is within ${D(e)} in. of that, ends included.` }; },
  () => { const t = pick(R, [16, 12, 20]), e = pick(R, [0.4, 0.3, 0.5]); return { v: 'w', target: t, tol: e, unit: 'oz', rel: '>' as Rel, text: `A box labeled ${t} oz is rejected if its weight <i>w</i> differs from ${t} oz by more than ${D(e)} oz.` }; },
  () => { const t = int(R, 66, 72), e = int(R, 2, 4); return { v: 'T', target: t, tol: e, unit: '°F', rel: '<=' as Rel, text: `A thermostat keeps the room within ${e}°F of ${t}°F (at most ${e}°F off). Let <i>T</i> be the room temperature.` }; },
  () => { const t = pick(R, [80, 75, 90]), e = pick(R, [5, 4, 6]); return { v: 's', target: t, tol: e, unit: 'points', rel: '<' as Rel, text: `A score <i>s</i> counts as “on target” if it is less than ${e} points away from ${t}.` }; },
  () => { const t = pick(R, [250, 500, 300]), e = pick(R, [10, 15, 20]); return { v: 'c', target: t, tol: e, unit: 'dollars', rel: '>=' as Rel, text: `A trip budget is $${t}. A cost <i>c</i> gets flagged if it is off the budget by at least $${e}.` }; },
])();
const toleranceModel: Gen = (R, n) => retry(() => {
  const C = tolCtx(R), v = `<i>${C.v}</i>`, t = D(C.target), e = D(C.tol);
  const strictOther: Rel = C.rel === '<=' ? '<' : C.rel === '<' ? '<=' : C.rel === '>' ? '>=' : '>';
  return choiceItem(R, {
    id: `toleranceModel-${n}`, family: 'toleranceModel', prompt: `${C.text} Which inequality describes ${C.rel[0] === '<' ? 'the values that pass' : 'the values that are flagged'}?`,
    board: `\\text{target } ${DT(C.target)},\\ \\text{tolerance } ${DT(C.tol)}`,
    solution: [`The distance from the target is |${v} − ${t}|.`, `${C.rel === '<=' ? 'Within … ends included / at most' : C.rel === '<' ? 'Less than' : C.rel === '>' ? 'More than' : 'At least'} ${e}: ${relH(C.rel)} ${e}.`],
  }, [
    { t: `|${v} − ${t}| ${relH(C.rel)} ${e}`, ok: true, say: 'Right.' },
    { t: `|${v} − ${t}| ${relH(strictOther)} ${e}`, mc: MC.strict, say: `Read the words again: ${C.rel.length === 2 ? 'the boundary counts' : 'the boundary does not count'}.` },
    { t: `|${v} − ${e}| ${relH(C.rel)} ${t}`, mc: MC.wrongQty, say: 'The target goes inside the bars; the tolerance is the allowed distance.' },
    { t: `|${v} − ${t}| = ${e}`, mc: MC.band, say: 'That gives only the two boundary values. The question is about a whole band of values.' },
  ]);
});

const toleranceEnds: Gen = (R, n) => retry(() => {
  const C = tolCtx(R); need(C.rel === '<=');
  const v = `<i>${C.v}</i>`, lo = clean(C.target - C.tol), hi = clean(C.target + C.tol);
  return pairItem({
    id: `toleranceEnds-${n}`, family: 'toleranceEnds', prompt: `${C.text} Solve |${v} − ${D(C.target)}| ≤ ${D(C.tol)}: which values pass?`, board: `|${C.v} - ${DT(C.target)}| \\le ${DT(C.tol)}`,
    pairLead: '', pairOp: `≤ ${v} ≤`, pairTail: C.unit, picture: { line: lineOf(absIneq(1, -C.target, '<=', C.tol), [lo, hi], [], `${DT(lo)} \\le ${C.v} \\le ${DT(hi)}`) },
    solution: [`−${D(C.tol)} ≤ ${v} − ${D(C.target)} ≤ ${D(C.tol)}.`, `Add ${D(C.target)}: ${ans(D(lo))} ≤ ${v} ≤ ${ans(D(hi))}.`],
  }, lo, hi, (x, y) => nearV(x, lo) && nearV(y, hi) ? { ok: true, say: 'Right: both ends pass too.' } : nearV(x, -C.tol) && nearV(y, C.tol) ? { ok: false, mc: MC.ignoreIn, say: `Those bound ${v} − ${D(C.target)}. Add ${D(C.target)} to all three parts.` } : { ok: false, say: `The band runs ${D(C.tol)} below to ${D(C.tol)} above ${D(C.target)}.` });
});

const toleranceReverse: Gen = (R, n) => retry(() => {
  const t = pick(R, [3.5, 12, 68, 2.25, 50, 7.5, 100, 16]), e = pick(R, [0.02, 0.5, 2, 0.05, 3, 0.25, 1, 4]);
  need(e < t / 4 && nice(t - e));
  const lo = clean(t - e), hi = clean(t + e);
  return pairItem({
    id: `toleranceReverse-${n}`, family: 'toleranceReverse', prompt: `The acceptable values are ${D(lo)} ≤ ${X} ≤ ${D(hi)}. Write this as an absolute value inequality.`,
    board: `${DT(lo)} \\le x \\le ${DT(hi)}`, pairLead: `|${X} −`, pairOp: '| ≤',
    picture: { line: lineOf(absIneq(1, -t, '<=', e), [lo, hi], [], `|x - ${DT(t)}| \\le ${DT(e)}`) },
    solution: [`The target is the midpoint: (${D(lo)} + ${D(hi)}) ÷ 2 = ${ans(D(t))}.`, `The tolerance is half the width: (${D(hi)} − ${D(lo)}) ÷ 2 = ${ans(D(e))}.`],
  }, t, e, (x, y) => {
    if (nearV(x, t) && nearV(y, e)) return { ok: true, say: 'Right.' };
    if ((nearV(x, lo) || nearV(x, hi)) && (nearV(y, 2 * e) || nearV(y, e))) return { ok: false, mc: MC.endTarget, say: `The target is the MIDDLE of the band, ${D(t)}, not an end.` };
    if (nearV(x, t) && nearV(y, 2 * e)) return { ok: false, say: `The tolerance is half the width: ${D(e)} each way.` };
    return { ok: false, say: 'Target = the midpoint, tolerance = half the width.' };
  });
});

// =====================================================================================================================
// 25 variable-rhs-cases
// =====================================================================================================================
const varRhs = (R: () => number) => {
  for (;;) {
    const m = pick(R, [1, 2, 1]), b = nz(R, -6, 6), p = pick(R, [-3, -2, -1, 1, 2, 3, 0.5]), q = int(R, -6, 6);
    if (Math.abs(p) === m) continue;
    const x1 = (q - b) / (m - p), x2 = -(q + b) / (m + p);
    if (!half(x1) || !half(x2) || nearV(x1, x2) || Math.abs(x1) > 9 || Math.abs(x2) > 9) continue;
    const k1 = m * x1 + b >= -1e-9, k2 = m * x2 + b < -1e-9;
    return { m, b, p, q, x1: clean(x1), x2: clean(x2), k1, k2 };
  }
};
const xs = (v: number[]) => v.length === 0 ? 'No solution' : v.map(x => `${X} = ${D(x)}`).join(' or ');
const varRhsSolve: Gen = (R, n) => retry(() => {
  const { m, b, p, q, x1, x2, k1, k2 } = varRhs(R);
  const keep = [k1 ? x1 : null, k2 ? x2 : null].filter((v): v is number => v !== null).sort((a, c) => a - c);
  const all = [x1, x2].sort((a, c) => a - c);
  const rhs = linStrH(p, q), rhsT = linStrT(p, q), u = inH(m, b);
  const opts: Opt[] = [{ t: xs(keep), ok: true, say: 'Right: each candidate was tested in its own case condition.' }];
  const add = (o: Opt) => { if (!opts.some(z => z.t === o.t)) opts.push(o); };
  if (keep.length < 2) add({ t: xs(all), mc: MC.condIgnored, say: 'Test each candidate in the condition of the case it came from: one of them fails.' });
  if (keep.length === 2) { add({ t: xs([keep[0]!]), mc: MC.atMostOne, say: `Both candidates meet their conditions: |${u}| = ${rhs} can have two solutions.` }); add({ t: xs([keep[1]!]), mc: MC.atMostOne, say: 'Both candidates meet their conditions, so both are solutions.' }); }
  add({ t: 'No solution', say: 'Test each candidate: at least one meets its condition.' });
  for (const v of all) add({ t: xs([v]), say: 'Test each candidate in the condition of the case it came from.' });
  const f: AbsF = { a: 1, m, b, k: 0 }, ys = [...all.map(v => absAt(f, v)), ...all.map(v => p * v + q)];
  const w = vWindow(f, all, ys);
  const g: GPic = { ...w, parts: [], reveal: { parts: [...vParts(f), { kind: 'piece', key: 'rhs', fn: lin(p, q), col: 'first', arrow: false }, ...keep.map((v, i) => ({ kind: 'point', key: 'k' + i, x: v, y: p * v + q, col: 'second' } as GPart))] } };
  need(keep.every(v => inWin(w, v, p * v + q)));
  return choiceItem(R, {
    id: `varRhsSolve-${n}`, family: 'varRhsSolve', prompt: `Solve |${u}| = ${rhs} by cases. Keep only candidates that meet their case condition.`, board: `|${inT(m, b)}| = ${rhsT}`,
    picture: { g },
    solution: [`${u} ≥ 0: ${linStrH(m, b)} = ${rhs} gives ${X} = ${D(x1)}; there ${u} = ${D(m * x1 + b)}, ${k1 ? 'keep' : 'reject'}.`, `${u} &lt; 0: −(${linStrH(m, b)}) = ${rhs} gives ${X} = ${D(x2)}; there ${u} = ${D(m * x2 + b)}, ${k2 ? 'keep' : 'reject'}.`],
  }, opts.slice(0, 4));
});

const varRhsBranch: Gen = (R, n) => retry(() => {
  const { m, b, p, q } = varRhs(R), u = linStrH(m, b), rhs = linStrH(p, q);
  return choiceItem(R, {
    id: `varRhsBranch-${n}`, family: 'varRhsBranch', prompt: `Solving |${inH(m, b)}| = ${rhs}: which equation belongs to the case ${inH(m, b)} &lt; 0?`, board: `|${inT(m, b)}| = ${linStrT(p, q)}`,
    solution: [`Where ${inH(m, b)} &lt; 0, the bars give the opposite of the whole inside: −(${u}) = ${linStrH(-m, -b)}.`, `So that case is ${linStrH(-m, -b)} = ${rhs}.`],
  }, [
    { t: `${linStrH(-m, -b)} = ${rhs}`, ok: true, say: 'Right: the opposite of the whole inside.' },
    { t: `${linStrH(-m, b)} = ${rhs}`, mc: MC.firstTerm, say: `The minus goes on both terms: −(${u}) = ${linStrH(-m, -b)}.` },
    { t: `${u} = ${rhs}`, say: `That is the case ${inH(m, b)} ≥ 0. Where the inside is negative, the bars change its sign.` },
  ]);
});

// =====================================================================================================================
// 26 branch-identity
// =====================================================================================================================
const identitySet: Gen = (R, n) => retry(() => {
  const kind = int(R, 0, 3), a = nz(R, -6, 6), k = int(R, 1, 6);
  let lhs = '', rhs = '', lhsT = '', rhsT = '', right = '', steps: string[] = [], f: AbsF, line: [number, number];
  const opts: Opt[] = [];
  if (kind <= 1) {
    f = F1(a); lhs = absH(1, 1, -a); lhsT = absT(1, 1, -a);
    rhs = kind === 0 ? linStrH(1, -a) : inH(-1, a); rhsT = kind === 0 ? linStrT(1, -a) : inT(-1, a);
    line = kind === 0 ? [1, -a] : [-1, a];
    right = kind === 0 ? `${X} ≥ ${D(a)}` : `${X} ≤ ${D(a)}`;
    steps = kind === 0 ? [`Case ${X} ≥ ${D(a)}: ${linStrH(1, -a)} = ${linStrH(1, -a)}, true for EVERY x in this case.`, `Case ${X} &lt; ${D(a)}: −(${linStrH(1, -a)}) = ${linStrH(1, -a)} gives ${X} = ${D(a)}, not in this case.`]
      : [`Case ${X} ≥ ${D(a)}: ${linStrH(1, -a)} = ${inH(-1, a)} gives ${X} = ${D(a)}, kept.`, `Case ${X} &lt; ${D(a)}: ${inH(-1, a)} = ${inH(-1, a)}, true for every x in this case. Together: ${X} ≤ ${D(a)}.`];
    opts.push({ t: right, ok: true, say: 'Right: an identity inside a case gives that whole case.' },
      { t: 'All real numbers', mc: MC.condIgnored, say: 'The identity only holds inside its own case, not for every x.' },
      { t: `Only ${X} = ${D(a)}`, say: `${D(a)} works, but so does every other x in the case where the equation is an identity.` },
      { t: 'No solution', say: `Try ${X} = ${D(a + (kind === 0 ? 1 : -1))}: it works.` });
  } else {
    f = { a: 1, m: 1, b: 0, k: 0 }; lhs = `|${X}|`; lhsT = '|x|';
    const s = kind === 2 ? k : -k; rhs = linStrH(1, s); rhsT = linStrT(1, s); line = [1, s];
    const cand = clean(-s / 2);   // −x = x + s
    if (kind === 2) {
      right = `${X} = ${D(cand)}`;
      steps = [`Case ${X} ≥ 0: ${X} = ${linStrH(1, s)} gives 0 = ${s}, false: nothing from this case.`, `Case ${X} &lt; 0: −${X} = ${linStrH(1, s)} gives ${X} = ${D(cand)} &lt; 0, kept.`];
      opts.push({ t: right, ok: true, say: 'Right.' }, { t: 'No solution', say: `The case ${X} &lt; 0 gives ${D(cand)}, and it meets its condition.` },
        { t: `${X} ≥ 0`, say: `In the case ${X} ≥ 0 the equation becomes 0 = ${s}: false for every x there.` }, { t: 'All real numbers', mc: MC.condIgnored, say: `Try ${X} = 1: |1| = 1, but 1 + ${s} = ${1 + s}.` });
    } else {
      right = 'No solution';
      steps = [`Case ${X} ≥ 0: ${X} = ${linStrH(1, s)} gives 0 = −${k}, false.`, `Case ${X} &lt; 0: −${X} = ${linStrH(1, s)} gives ${X} = ${D(cand)}, but ${D(cand)} is not &lt; 0: rejected.`];
      opts.push({ t: right, ok: true, say: 'Right: both cases come up empty.' }, { t: `${X} = ${D(cand)}`, mc: MC.condIgnored, say: `${D(cand)} came from the case ${X} &lt; 0, but it is positive: reject it.` },
        { t: `${X} ≥ 0`, say: `In the case ${X} ≥ 0 the equation becomes 0 = −${k}: false.` }, { t: 'All real numbers', say: `|${X}| ≥ 0 but ${linStrH(1, s)} is smaller than ${X}: they never meet.` });
    }
  }
  const w = vWindow(f, [a, -3, 3], []);
  const g: GPic = { ...w, parts: [], reveal: { parts: [...vParts(f), { kind: 'piece', key: 'rhs', fn: lin(line[0], line[1]), col: 'first', dash: true, arrow: false }] } };
  return choiceItem(R, {
    id: `identitySet-${n}`, family: 'identitySet', prompt: `Solve ${lhs} = ${rhs} by cases. What is the solution set?`, board: `${lhsT} = ${rhsT}`, picture: { g }, solution: steps,
  }, opts);
});

const identityCount: Gen = (R, n) => retry(() => {
  const a = nz(R, -6, 6), up = R() < 0.5;
  const rhs = up ? linStrH(1, -a) : inH(-1, a), rhsT = up ? linStrT(1, -a) : inT(-1, a), set = up ? `${X} ≥ ${D(a)}` : `${X} ≤ ${D(a)}`;
  return choiceItem(R, {
    id: `identityCount-${n}`, family: 'identityCount', prompt: `How many solutions does ${absH(1, 1, -a)} = ${rhs} have?`, board: `${absT(1, 1, -a)} = ${rhsT}`,
    solution: [`In the case ${up ? `${X} ≥ ${D(a)}` : `${X} &lt; ${D(a)}`} the equation becomes ${rhs} = ${rhs}: true for every x in that case.`, `So every ${set} is a solution.`],
  }, [
    { t: `Infinitely many: every ${set}`, ok: true, say: 'Right: an identity inside a case gives the whole case.' },
    { t: 'Two', mc: MC.ceiling, say: 'Two is not a ceiling. Here one case is an identity, so every x in it works.' },
    { t: `One: ${X} = ${D(a)}`, say: `${D(a)} works, but so does ${D(a + (up ? 2 : -2))}. Try it.` },
    { t: 'None', say: `Try ${X} = ${D(a + (up ? 2 : -2))}: both sides are equal.` },
  ]);
});

// =====================================================================================================================
// 27 two-abs-interval-table
// =====================================================================================================================
const twoAbsSum: Gen = (R, n) => retry(() => {
  const p = int(R, 1, 3), q = int(R, 1, 3), g0 = p + q, kind = int(R, 0, 2);
  const s = kind === 0 ? g0 + pick(R, [1, 2, 3, 4]) : kind === 1 ? g0 : g0 - int(R, 1, Math.min(2, g0 - 1));
  need(s > 0);
  const right = (s + p - q) / 2, left = (p - q - s) / 2;
  need(half(right) && half(left));
  const set = kind === 0 ? `${X} = ${D(left)} or ${X} = ${D(right)}` : kind === 1 ? `${D(-q)} ≤ ${X} ≤ ${D(p)}` : 'No solution';
  const opts: Opt[] = [{ t: set, ok: true, say: 'Right.' }];
  const add = (o: Opt) => { if (!opts.some(z => z.t === o.t)) opts.push(o); };
  if (kind !== 0) add({ t: `${X} = ${D(left)} or ${X} = ${D(right)}`, mc: MC.twoCases, say: `Two bars make THREE intervals: ${X} &lt; ${D(-q)}, ${D(-q)} ≤ ${X} &lt; ${D(p)}, ${X} ≥ ${D(p)}. Those two values are not in their own intervals.` });
  add({ t: `${D(-q)} ≤ ${X} ≤ ${D(p)}`, say: `In the middle interval the sum is always ${g0}, not ${s}.` });
  add({ t: 'No solution', say: 'The graph meets the line, so there are solutions.' });
  if (opts.length < 3) add({ t: `${X} = ${D(right)}`, mc: MC.onlyOne, say: 'The graph meets the line twice.' });
  const parts: GPart[] = [
    { kind: 'piece', key: 'sL', fn: lin(-2, p - q), hi: -q, ends: ['none', 'none'], col: 'link', arrow: true },
    { kind: 'piece', key: 'sM', fn: cst(g0), lo: -q, hi: p, ends: ['none', 'none'], col: 'link' },
    { kind: 'piece', key: 'sR', fn: lin(2, q - p), lo: p, ends: ['none', 'none'], col: 'link', arrow: true },
    hl(s),
  ];
  const w = win([-q - 3, p + 3, left - 1, right + 1], [0, s + 2, g0 + 3]);
  return choiceItem(R, {
    id: `twoAbsSum-${n}`, family: 'twoAbsSum', prompt: `Solve |${X} − ${p}| + |${X} + ${q}| = ${s}. The graph of the left side and the line y = ${s} are supplied (graphing technology).`,
    board: `|x - ${p}| + |x + ${q}| = ${s}`, picture: { g: { ...w, parts } },
    solution: [`Breakpoints ${D(-q)} and ${p} make three intervals.`, `${X} &lt; ${D(-q)}: ${linStrH(-2, p - q)} = ${s}. ${D(-q)} ≤ ${X} ≤ ${p}: ${g0} = ${s}${g0 === s ? ' (true for all of them)' : ' (false)'}. ${X} &gt; ${p}: ${linStrH(2, q - p)} = ${s}.`, `Keep what lies in its own interval.`],
  }, opts);
});

const twoAbsEqual: Gen = (R, n) => retry(() => {
  const m = pick(R, [2, 3, -2, 3]), b = nz(R, -6, 6), d = nz(R, -6, 6);
  const s1 = (d - b) / (m - 1), s2 = -(d + b) / (m + 1);
  need(half(s1) && half(s2) && !nearV(s1, s2) && Math.abs(s1) <= 8 && Math.abs(s2) <= 8);
  const f1: AbsF = { a: 1, m, b, k: 0 }, f2: AbsF = { a: 1, m: 1, b: d, k: 0 };
  const xsv = [s1, s2], ysv = xsv.map(v => absAt(f1, v));
  const w = win([...xsv, -b / m, -d], [0, ...ysv]);
  const g: GPic = { ...w, parts: [], reveal: { parts: [...vParts(f1, 'v'), ...vParts(f2, 'w', 'water'), ...xsv.map((v, i) => ({ kind: 'point', key: 'k' + i, x: v, y: absAt(f1, v), col: 'second' } as GPart))] } };
  need(ysv.every((y, i) => inWin(w, xsv[i]!, y)));
  return twoSol({
    id: `twoAbsEqual-${n}`, family: 'twoAbsEqual', prompt: `Solve ${absH(1, m, b)} = |${inH(1, d)}|. Type the smaller solution first.`, board: `${absT(1, m, b)} = |${inT(1, d)}|`, picture: { g },
    solution: [`Equal distances from 0: the insides are equal or opposite.`, `${linStrH(m, b)} = ${linStrH(1, d)} gives ${X} = ${D(s1)}; ${linStrH(m, b)} = −(${linStrH(1, d)}) gives ${X} = ${D(s2)}.`, `So ${X} = ${ans(D(Math.min(s1, s2)))} or ${X} = ${ans(D(Math.max(s1, s2)))}.`],
  }, [s1, s2], () => null);
});

// =====================================================================================================================
export const GENERATORS: Record<string, Gen> = {
  evalAbs, outsideMinus, distSolve, distMeaning, pieceEval, oppositeValue, breakX, pieceForm, parentSlope, parentFeature,
  hShiftVertex, hShiftPick, vertexHK, rangeK, branchSlope, stretchPoint, negPick, sameGraph, affineCond, affineForm,
  affineVertex, affineSlope, splitSolve, splitPick, howManySol, whichOne, isolateSolve, isolateLine, isolateCount,
  graphCount, graphSolve, keepReject, branchCount, checkVsCases, completeWhy, modelEq, exactlyAway, domainReject,
  rideRead, rateUnits, rideDomain, andSolve, andPick, orSolve, orPick, isoForm, isoSolve, specialSet, specialIsolate,
  toleranceModel, toleranceEnds, toleranceReverse, varRhsSolve, varRhsBranch, identitySet, identityCount, twoAbsSum, twoAbsEqual,
};
export const FAMILY_NAMES: Record<string, string> = {
  evalAbs: 'Evaluate the bars', outsideMinus: 'Bars first, then outside', distSolve: 'Distance on the line', distMeaning: 'What the bars say',
  pieceEval: 'Which piece?', oppositeValue: 'The opposite of a negative', breakX: 'The breakpoint', pieceForm: 'Two pieces',
  parentSlope: 'Slopes of y = |x|', parentFeature: 'Features of y = |x|', hShiftVertex: 'Sideways shift', hShiftPick: 'Match the shift',
  vertexHK: 'Vertex (h, k)', rangeK: 'Range', branchSlope: 'Branch slopes', stretchPoint: 'Stretch, then shift', negPick: 'Opens down',
  sameGraph: 'A minus inside', affineCond: 'When the bars do nothing', affineForm: 'Two pieces of |mx + b|', affineVertex: 'Vertex of |mx + b|',
  affineSlope: 'Slope of |mx + b|', splitSolve: 'Split and solve', splitPick: 'Equal to c or −c', howManySol: 'How many solutions',
  whichOne: 'Sort by the target', isolateSolve: 'Isolate, then split', isolateLine: 'Isolate first', isolateCount: 'Isolate, then count',
  graphCount: 'Count on the graph', graphSolve: 'Read the solutions', keepReject: 'Keep or reject', branchCount: 'Survivors',
  checkVsCases: 'Is it complete?', completeWhy: 'Why the cases find all', modelEq: 'Model the distance', exactlyAway: 'Exactly that far',
  domainReject: 'What the context allows', rideRead: 'Read the ride', rateUnits: 'Slope with units', rideDomain: 'Domain and range of a ride',
  andSolve: 'Within: a band', andPick: 'Less than: and', orSolve: 'Beyond: two rays', orPick: 'Greater than: or',
  isoForm: 'Isolate the inequality', isoSolve: 'Isolate, then solve', specialSet: 'Zero or negative targets', specialIsolate: 'Special targets after isolating',
  toleranceModel: 'Model a tolerance', toleranceEnds: 'Tolerance band', toleranceReverse: 'From a range to |x − t| ≤ e',
  varRhsSolve: 'A target with x', varRhsBranch: 'The negative case', identitySet: 'An identity in a case', identityCount: 'More than two?',
  twoAbsSum: 'Two bars: three intervals', twoAbsEqual: 'Equal absolute values',
};
