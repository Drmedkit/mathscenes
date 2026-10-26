// items.ts: practice families for "Piecewise and step functions" (Algebra 1, secondary-t7-12). Every family is
// generated from its sub-goal's cases, checked exactly (pw.ts), and every wrong answer the classifier recognises
// carries its catalogue id (math-curriculum-essentials/misconceptions.json). Pictures (item.picture, pic.ts): `g` = one
// graph on the kit Plane (solution-side parts under `reveal`), `opts` = two or three option graphs A, B, C. Items
// without a graph show the rule big on a slate. Pure: no DOM.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type Fn, type Piece, $, $T, N, NT, axisOver, casesTex, clean, condStr, covers, cst, ev, fAt, fnStr, lin, owners } from './pw';
import { type End, type GPart, type GPic, type Pic, pieceParts, windowFor, fits } from './pic';

// ---------- misconception ids ----------
export const MC = {
  fx: 'mc.functions-concept.f-of-x-as-multiplication',
  fnSum: 'mc.functions-concept.function-distributes-over-sum',
  ignores: 'mc.functions-concept.ignores-piece-conditions',
  yVals: 'mc.functions-concept.intervals-in-y-values',
  several: 'mc.functions-concept.uses-several-pieces-for-one-input',
  second: 'mc.functions-concept.breakpoint-always-second-piece',
  undefBreak: 'mc.functions-concept.breakpoint-always-undefined',
  narrow: 'mc.functions-concept.function-prototype-too-narrow',
  connected: 'mc.functions-concept.function-must-be-connected',
  constNot: 'mc.functions-concept.constant-rule-not-function',
  stepProto: 'mc.functions-concept.step-function-prototype',
  stepEqual: 'mc.functions-concept.step-heights-must-rise-equally',
  easiest: 'mc.functions-concept.chooses-easiest-piece',
  zero: 'mc.functions-concept.undefined-input-gives-zero',
  average: 'mc.functions-concept.averages-piece-values-at-a-breakpoint',
  looks: 'mc.functions-concept.breakpoint-piece-chosen-by-appearance',
  fill: 'mc.functions-concept.endpoint-dot-fill-rule',
  shared: 'mc.functions-concept.shared-join-requires-both-pieces',
  openPt: 'mc.functions-concept.open-dot-counted-as-point',
  beyond: 'mc.functions-concept.graphs-beyond-restricted-interval',
  connects: 'mc.functions-concept.connects-across-jump-or-asymptote',
  gap: 'mc.functions-concept.piece-conditions-leave-gap',
  strict: 'mc.linear-equations.bound-phrase-strictness-wrong',
  reversed: 'mc.linear-equations.bound-phrase-direction-reversed',
  nearest: 'mc.estimation.rounds-nearest-when-context-needs-direction',
  floorCeil: 'mc.functions-concept.floor-ceiling-step-confusion',
  floorRight: 'mc.functions-concept.floor-steps-closed-on-right',
  trunc: 'mc.functions-concept.floor-as-truncation',
  uniqueOwner: 'mc.functions-concept.continuous-join-has-unique-piece-owner',
  inclusion: 'mc.linear-equations.ignores-boundary-inclusion',
  style: 'mc.linear-equations.endpoint-style-convention',
  secant: 'mc.linear-functions.slope-across-pieces',
  tierWhole: 'mc.functions-concept.tier-rate-on-whole-amount',
  againInit: 'mc.functions-concept.initial-units-counted-again-at-additional-rate',
  wholeOnly: 'mc.functions-concept.continuous-quantity-as-whole-only',
  fracCount: 'mc.functions-concept.discrete-quantity-allows-fractions',
  cents: 'mc.functions-concept.cent-amount-domain-as-continuous',
  repeated: 'mc.functions-concept.repeated-identical-pair-not-function',
  wrongPiece: 'mc.functions-concept.breakpoint-wrong-piece',
  noSize: 'mc.functions-concept.jump-described-without-size',
  roundsIn: 'mc.functions-concept.rounds-input-before-piece',
  allReals: 'mc.functions-concept.context-domain-all-reals',
  parentRange: 'mc.functions-concept.range-copied-from-parent',
} as const;

export interface PWItem extends Item { picture?: Pic }
type Base = Omit<PWItem, 'input' | 'choices' | 'answer' | 'check'>;
interface Opt { t: string; ok?: boolean; mc?: string; say: string; pic?: GPic }

// ---------- item helpers ----------
const X = '<i>x</i>', F = '<i>f</i>';
const fA = (a: number | string, nm = 'f') => `<i>${nm}</i>(${typeof a === 'number' ? N(a) : a})`;
const pt = (x: number, y: number) => `(${N(x)}, ${N(y)})`;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
/** a number that follows an operation sign: negatives in brackets */
const P = (v: number) => (v < 0 ? `(${N(v)})` : N(v));
const art = (u: string) => (/^[aeiouh]/.test(u) && u !== 'half hour' ? 'an ' : 'a ') + u;

function choiceItem(R: () => number, base: Base, opts: Opt[], keepOrder = false): PWItem {
  const o = keepOrder ? opts.slice() : shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  if (i < 0 || o.filter(x => x.ok).length !== 1) throw new Error(`${base.family}: exactly one right choice`);
  if (new Set(o.map(x => x.t)).size !== o.length) throw new Error(`${base.family}: duplicate choices ${o.map(x => x.t).join(' | ')}`);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
/** option graphs A, B, C: shuffled, lettered, drawn in that order */
function graphChoice(R: () => number, base: Omit<Base, 'picture'>, opts: Opt[]): PWItem {
  const o = shuffle(R, opts.slice());
  const L = ['A', 'B', 'C', 'D'];
  const labelled = o.map((x, i) => ({ ...x, t: `Graph ${L[i]}` }));
  return choiceItem(R, { ...base, picture: { opts: o.map(x => x.pic!) } }, labelled, true);
}
const numItem = (base: Omit<PWItem, 'input' | 'answer' | 'check'>, a: number, check: (v: number) => Verdict): PWItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: clean(a) },
  check: (r: Response) => (r.kind === 'num' && Number.isFinite(r.v) ? check(r.v) : { ok: false, say: 'Type a number.' }),
});
const pairItem = (base: Omit<PWItem, 'input' | 'answer' | 'check'>, x: number, y: number, check: (a: number, b: number) => Verdict): PWItem => ({
  ...base, input: 'pair', answer: { kind: 'pair', x: clean(x), y: clean(y) },
  check: (r: Response) => (r.kind === 'pair' && Number.isFinite(r.x) && Number.isFinite(r.y) ? check(r.x, r.y) : { ok: false, say: 'Fill in both boxes.' }),
});
/** a generator that retries until the item's pictures fit their windows */
function retry(make: () => PWItem): PWItem {
  for (let t = 0; t < 200; t++) {
    try {
      const it = make();
      const p = it.picture;
      if (p?.g && !fits(p.g)) continue;
      if (p?.opts && !p.opts.every(fits)) continue;
      return it;
    } catch (e) { if (!(e instanceof Retry)) throw e; }
  }
  throw new Error('piecewise item: no fitting item in 200 tries');
}
class Retry extends Error {}
const need = (c: unknown) => { if (!c) throw new Retry('retry'); };

// ---------- rules ----------
const mk = (m: number, x0: number, y0: number): Fn => lin(m, clean(y0 - m * x0));
const fnKey = (f: Fn) => fnStr(f, true);
/** two linear / constant pieces split at a: left x < a or x ≤ a, right the other side */
function rule2(R: () => number, o: { a?: number; owner?: 'L' | 'R' | 'none' | 'both'; jump?: boolean; slopes?: number[]; constL?: boolean; constR?: boolean } = {}): Piece[] {
  for (;;) {
    const a = o.a ?? int(R, -3, 4);
    const yL = int(R, -3, 7);
    const jump = o.jump ?? R() < 0.7;
    const yR = jump ? pick(R, [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].filter(v => v !== yL)) : yL;
    const S = o.slopes ?? [-2, -1, 0, 1, 2];
    const mL = o.constL ? 0 : pick(R, S), mR = o.constR ? 0 : pick(R, S);
    const fL = mk(mL, a, yL), fR = mk(mR, a, yR);
    if (fnKey(fL) === fnKey(fR)) continue;
    const owner = o.owner ?? (R() < 0.5 ? 'L' : 'R');
    return [{ fn: fL, hi: a, hiIn: owner === 'L' || owner === 'both' }, { fn: fR, lo: a, loIn: owner === 'R' || owner === 'both' }];
  }
}
/** three pieces split at a < b; the middle one is bounded on both sides */
function rule3(R: () => number, o: { slopes?: number[] } = {}): Piece[] {
  for (;;) {
    const a = int(R, -4, 1), b = a + int(R, 2, 4);
    const S = o.slopes ?? [-2, -1, 0, 1, 2];
    const ya = int(R, -2, 6), yb = int(R, -2, 6);
    const m2 = (yb - ya) / (b - a);
    if (!Number.isInteger(m2 * 2) || Math.abs(m2) > 2) continue;
    const jumpA = R() < 0.6, jumpB = R() < 0.6;
    const y1 = jumpA ? pick(R, [-2, 0, 2, 4, 6].filter(v => v !== ya)) : ya, y3 = jumpB ? pick(R, [-2, 0, 1, 3, 5].filter(v => v !== yb)) : yb;
    const f1 = mk(pick(R, S), a, y1), f2 = mk(m2, a, ya), f3 = mk(pick(R, S), b, y3);
    if (new Set([f1, f2, f3].map(fnKey)).size < 3) continue;
    const oa = R() < 0.5, ob = R() < 0.5;
    return [{ fn: f1, hi: a, hiIn: oa }, { fn: f2, lo: a, loIn: !oa, hi: b, hiIn: ob }, { fn: f3, lo: b, loIn: !ob }];
  }
}
/** a number strictly inside a piece's interval (within the window's reach), integer or a half / tenth */
function inside(R: () => number, p: Piece, dec: boolean): number {
  const lo = p.lo ?? (p.hi! - 5), hi = p.hi ?? (p.lo! + 5);
  const c: number[] = [];
  for (let v = Math.ceil(lo * 10) / 10; v <= hi + 1e-9; v = clean(v + 0.1)) {
    const w = clean(v);
    if (w <= lo + 1e-9 || w >= hi - 1e-9) continue;
    const isInt = Number.isInteger(w), isHalf = Number.isInteger(w * 2);
    if (dec ? !isInt && (isHalf || R() < 0.25) : isInt) c.push(w);
  }
  if (!c.length) throw new Retry('no inside');
  return pick(R, c);
}
const PCOLS = ['link', 'water', 'first'] as const;
/** the graph of a rule: shown now (`show`) or on the replay, with a trace at x when asked */
function ruleGraph(ps: Piece[], o: { show?: boolean; xs?: number[]; trace?: number; extra?: GPart[]; revealExtra?: GPart[]; xName?: string; yName?: string; money?: 'x' | 'y'; zero?: boolean } = {}): GPic {
  const w = windowFor(ps, o.xs ?? (o.trace !== undefined ? [o.trace] : []), { xName: o.xName, yName: o.yName, zero: o.zero });
  const parts = pieceParts(ps);
  const traceKey = o.trace !== undefined ? parts.find((P, i) => owners(ps, o.trace!).includes(i) && P.kind === 'piece')?.key : undefined;
  return {
    ...w, money: o.money,
    parts: o.show ? [...parts, ...(o.extra ?? [])] : [...(o.extra ?? [])],
    reveal: { parts: [...(o.show ? [] : parts), ...(o.revealExtra ?? [])], ...(traceKey ? { trace: { key: traceKey, x: o.trace! } } : {}) },
  };
}
const tagged = (name: string, ps: Piece[], v = 'x') => casesTex(name, ps, v);
const say1 = (ps: Piece[], x: number) => { const o = owners(ps, x); return o.length ? `<b>${condStr(ps[o[0]!]!)}</b> holds for ${X} = ${N(x)}, so ${F} uses <b>${fnStr(ps[o[0]!]!.fn)}</b>` : `no condition holds at ${X} = ${N(x)}`; };

// ===================== 1 read-function-notation =====================
const evalOne = (R: () => number, n: number): PWItem => {
  const cons = R() < 0.25, sum = !cons && R() < 0.3;
  const m = pick(R, [-4, -3, -2, 2, 3, 4, 5]), b = pick(R, [-7, -5, -4, -3, -1, 1, 2, 3, 5, 6]);
  const fn: Fn = cons ? cst(int(R, 2, 9)) : lin(m, b);
  const nm = cons ? 'g' : 'f';
  const kind = pick(R, ['pos', 'neg', 'dec']);
  const a = kind === 'pos' ? int(R, 2, 9) : kind === 'neg' ? -int(R, 1, 8) : pick(R, [0.5, 1.5, -0.5, -2.5, 2.5, 0.2, -1.5]);
  if (sum) {
    const p = int(R, 1, 5), q = int(R, 1, 5);
    const v = ev(fn, p + q), wrong = ev(fn, p) + ev(fn, q);
    return numItem({ id: `evalOne-${n}`, family: 'evalOne',
      prompt: `${F}(${X}) = ${fnStr(fn)}. What is ${fA(`${p} + ${q}`)}?`, board: `f(x) = ${fnStr(fn, true)} \\qquad f(${p} + ${q}) = \\,?`,
      solution: [`${fA(`${p} + ${q}`)} is the output at the input ${p + q}: add first.`, `${fA(p + q)} = ${m}(${p + q}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${ans(N(v))}`] }, v,
      x => near(x, v) ? { ok: true, say: `Right: ${fA(p + q)} = ${N(v)}.` }
        : near(x, wrong) ? { ok: false, mc: MC.fnSum, say: `${fA(p)} + ${fA(q)} is not ${fA(`${p} + ${q}`)}: the rule adds ${N(b)} once, not twice. Put ${p + q} in for ${X}.` }
          : { ok: false, say: `The input is ${p} + ${q} = ${p + q}. Put ${p + q} in for ${X}.` });
  }
  const v = ev(fn, a);
  return numItem({ id: `evalOne-${n}`, family: 'evalOne',
    prompt: `<i>${nm}</i>(${X}) = ${fnStr(fn)}. What is ${fA(a, nm)}?`, board: `${nm}(x) = ${fnStr(fn, true)} \\qquad ${nm}(${NT(a)}) = \\,?`,
    solution: cons ? [`${fA(a, nm)} means the output of ${nm} at the input ${N(a)}.`, `${nm} gives ${N(v)} for every input, so ${fA(a, nm)} = ${ans(N(v))}`]
      : [`${fA(a, nm)} means: put ${N(a)} in for ${X}.`, `${N(m)}(${N(a)}) ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${N(m * a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${ans(N(v))}`] }, v,
    x => near(x, v) ? { ok: true, say: `Right: the output at ${N(a)} is ${N(v)}.` }
      : cons && near(x, clean(ev(fn, 0) * a)) ? { ok: false, mc: MC.fx, say: `<i>${nm}</i>(${N(a)}) is not ${nm} times ${N(a)}. It is the output at input ${N(a)}, and ${nm} always outputs ${N(v)}.` }
        : { ok: false, say: `Replace ${X} by ${N(a)} and work it out: ${cons ? `${nm} has no ${X} in it, so the output is ${N(v)}` : `${N(m)} times ${N(a)}, then ${b < 0 ? 'subtract' : 'add'} ${Math.abs(b)}`}.` });
};
const readPoint = (R: () => number, n: number): PWItem => {
  if (R() < 0.55) {
    const a = int(R, -6, 9), c = pick(R, [-8, -5, -3, 2, 4, 7, 11, 12, 15].filter(v => v !== a && v !== 0));
    return choiceItem(R, { id: `readPoint-${n}`, family: 'readPoint', prompt: `For a function ${F}, ${fA(a)} = ${N(c)}. What does that tell you?`, board: `f(${NT(a)}) = ${NT(c)}`,
      solution: [`${fA(a)} = ${N(c)}: the input ${N(a)} has the output ${N(c)}.`, `Input first, output second: the point ${pt(a, c)} is on the graph.`] }, [
      { t: `The point ${pt(a, c)} is on the graph of ${F}.`, ok: true, say: 'Right: input first, output second.' },
      { t: `The point ${pt(c, a)} is on the graph of ${F}.`, mc: MC.yVals, say: `${N(a)} is the input, so it is the x-coordinate: ${pt(a, c)}.` },
      { t: `${F} times ${N(a)} is ${N(c)}, so ${F} = ${N(c)} ÷ ${N(a)}.`, mc: MC.fx, say: `${F}(${N(a)}) is not a product: ${F} names the function, and ${N(a)} is its input.` },
      { t: `${F} gives ${N(c)} for every input.`, say: `It only tells you about the input ${N(a)}.` },
    ].filter((o, i) => i !== 2 || a !== 0));
  }
  const m = pick(R, [2, 3, 4, 5, -2, -3]), b = pick(R, [-5, -4, -1, 1, 3, 6, 7]);
  const p = int(R, 1, 4), q = int(R, 2, 6);
  const fn = lin(m, b), s = ev(fn, p + q), t = clean(ev(fn, p) + ev(fn, q));
  return choiceItem(R, { id: `readPoint-${n}`, family: 'readPoint', prompt: `${F}(${X}) = ${fnStr(fn)}. Is ${fA(`${p} + ${q}`)} the same as ${fA(p)} + ${fA(q)}?`, board: `f(x) = ${fnStr(fn, true)}`,
    solution: [`${fA(`${p} + ${q}`)} = ${fA(p + q)} = ${N(s)}.`, `${fA(p)} + ${fA(q)} = ${N(ev(fn, p))} + ${P(ev(fn, q))} = ${N(t)}.`] }, [
    { t: `No: ${fA(p + q)} = ${N(s)}, but ${fA(p)} + ${fA(q)} = ${N(t)}.`, ok: true, say: `Right: the ${N(b)} gets added once on the left and twice on the right.` },
    { t: `Yes: a function can be split over a sum, like a product.`, mc: MC.fnSum, say: `Work both out: ${N(s)} and ${N(t)}. A function does not distribute over a sum.` },
    { t: `Yes: both are ${N(s)}.`, mc: MC.fnSum, say: `${fA(p)} + ${fA(q)} = ${N(t)}, not ${N(s)}.` },
  ]);
};

// ===================== 2 pick-piece =====================
function anyRule(R: () => number): Piece[] { return R() < 0.5 ? rule2(R) : rule3(R); }
const whichRule = (R: () => number, n: number): PWItem => retry(() => {
  const ps = anyRule(R), j = int(R, 0, ps.length - 1), dec = R() < 0.5;
  const x = inside(R, ps[j]!, dec);
  const opts: Opt[] = ps.map((p, i) => ({ t: `${fnStr(p.fn)}`, ok: i === j, mc: i === j ? undefined : i === 0 ? MC.ignores : undefined,
    say: i === j ? `Right: ${say1(ps, x)}.` : `Test the condition first: ${N(x)} does not meet ${condStr(p)}. ${say1(ps, x)}.` }));
  if (ps.length === 2) opts.push({ t: 'Both rules', mc: MC.several, say: `One input, one rule: only one condition holds at ${N(x)}.` });
  return choiceItem(R, { id: `whichRule-${n}`, family: 'whichRule', prompt: `Which rule does ${F} use for ${X} = ${N(x)}?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true, trace: x }) },
    solution: [`Test ${X} = ${N(x)} against each condition.`, `${say1(ps, x)}.`] }, opts);
});
const whichInput = (R: () => number, n: number): PWItem => retry(() => {
  const ps = anyRule(R), j = int(R, 0, ps.length - 1), dec = R() < 0.4;
  const right = inside(R, ps[j]!, dec);
  const others = shuffle(R, ps.map((p, i) => i).filter(i => i !== j)).flatMap(i => [inside(R, ps[i]!, dec), inside(R, ps[i]!, !dec)]);
  const vals = [...new Set([right, ...others])].slice(0, 4);
  need(vals.length === 4 || (vals.length >= 3 && ps.length === 2));
  const opts: Opt[] = vals.map(v => ({ t: `${X} = ${N(v)}`, ok: v === right,
    say: v === right ? `Right: ${N(v)} meets ${condStr(ps[j]!)}.` : `${N(v)} does not meet ${condStr(ps[j]!)}: ${say1(ps, v)}.` }));
  return choiceItem(R, { id: `whichInput-${n}`, family: 'whichInput', prompt: `For which input does ${F} use the rule <b>${fnStr(ps[j]!.fn)}</b>?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true, xs: vals }) },
    solution: [`Its condition is ${condStr(ps[j]!)}.`, `Of the choices, it holds only for ${X} = ${N(right)}.`] }, opts);
});

// ===================== 3 boundary-ownership =====================
const ownerAtBreak = (R: () => number, n: number): PWItem => retry(() => {
  const ps = anyRule(R);
  const k = ps.length === 3 ? int(R, 0, 1) : 0;   // the break between pieces k and k+1
  const a = ps[k]!.hi!;
  const own = owners(ps, a)[0]!;
  const L = ps[k]!, Rr = ps[k + 1]!;
  need(fnStr(L.fn) !== fnStr(Rr.fn));
  const why = own === k ? `${condStr(L)} includes ${X} = ${N(a)} (the ≤)` : `${condStr(Rr)} includes ${X} = ${N(a)} (the ≥)`;
  return choiceItem(R, { id: `ownerAtBreak-${n}`, family: 'ownerAtBreak', prompt: `${X} = ${N(a)} is a breakpoint of ${F}. Which rule gives ${fA(a)}?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: false, revealExtra: [{ kind: 'vline', key: 'vx', x: a, col: 'pick' }] }) },
    solution: [`Look at the symbols at ${N(a)}: < leaves ${N(a)} out, ≤ or ≥ takes it in.`, `${why}, so ${F} uses ${fnStr(ps[own]!.fn)}.`] }, [
    { t: fnStr(L.fn), ok: own === k, mc: own === k ? undefined : MC.wrongPiece, say: own === k ? `Right: ${why}.` : `${condStr(L)} leaves ${N(a)} out. ${why}.` },
    { t: fnStr(Rr.fn), ok: own === k + 1, mc: own === k + 1 ? undefined : MC.second, say: own === k + 1 ? `Right: ${why}.` : `Being listed later does not win. ${condStr(Rr)} leaves ${N(a)} out; ${why}.` },
    { t: 'Both rules: two outputs', mc: MC.several, say: `Only one of the conditions includes ${N(a)}: ${why}.` },
    { t: `Neither: ${fA(a)} is undefined`, mc: MC.undefBreak, say: `A breakpoint can still have an output: ${why}.` },
  ]);
});
const nearBreak = (R: () => number, n: number): PWItem => retry(() => {
  const a = int(R, -2, 4), ps = rule2(R, { a });
  const lo = clean(a - 0.1), hi = clean(a + 0.1);
  const left = R() < 0.5, ownL = ps[0]!.hiIn!;
  const set = (xs: number[]) => xs.map(N).join(', ');
  const rightSet = left ? (ownL ? [lo, a] : [lo]) : (ownL ? [hi] : [a, hi]);
  const cands = [[lo, a], [lo], [a, hi], [hi]];
  const p = left ? ps[0]! : ps[1]!;
  return choiceItem(R, { id: `nearBreak-${n}`, family: 'nearBreak', prompt: `Which of the inputs ${N(lo)}, ${N(a)} and ${N(hi)} does ${F} send to the rule <b>${fnStr(p.fn)}</b>?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: false, xs: [lo, hi] }) },
    solution: [`That rule needs ${condStr(p)}.`, `Test each: ${[lo, a, hi].map(v => `${N(v)} ${p && owners([p], v).length ? '✓' : '✗'}`).join(', ')}.`, `So: ${set(rightSet)}.`] },
    cands.map(c => {
      const ok = c.length === rightSet.length && c.every((v, i) => v === rightSet[i]);
      const wrongOwner = c.includes(a) !== rightSet.includes(a);
      return { t: c.length === 1 ? `Only ${N(c[0]!)}` : `${N(c[0]!)} and ${N(c[1]!)}`, ok, mc: ok ? undefined : wrongOwner && c.includes(left ? lo : hi) ? MC.wrongPiece : undefined,
        say: ok ? `Right: ${N(a)} goes ${ownL ? 'left' : 'right'}, because ${condStr(ownL ? ps[0]! : ps[1]!)} includes it.` : `Check ${N(a)} itself: ${condStr(ownL ? ps[0]! : ps[1]!)} is the condition that includes it.` };
    }));
});

// ===================== 4 one-function-many-rules =====================
const isFunction = (R: () => number, n: number): PWItem => retry(() => {
  const three = R() < 0.35, ps = three ? rule3(R) : rule2(R);
  const a = ps[0]!.hi!;
  const jumpA = !near(ev(ps[0]!.fn, a), ev(ps[1]!.fn, a));
  const hasConst = ps.find(p => p.fn.k === 'lin' && p.fn.m === 0);
  const opts: Opt[] = [
    { t: `Yes: each input meets exactly one condition, so it gets one output.`, ok: true, say: 'Right: one output per input is all a function needs, however many rules it takes.' },
    { t: `No: a function has one formula, and ${F} has ${ps.length}.`, mc: MC.narrow, say: `Several rules are fine. Each input meets exactly one condition, so it gets one output.` },
    jumpA ? { t: `No: its graph breaks at ${X} = ${N(a)}.`, mc: MC.connected, say: `A jump is allowed. At ${N(a)} there is one filled dot: one output.` }
      : { t: `No: the pieces meet at ${X} = ${N(a)}, so ${N(a)} has two outputs.`, mc: MC.several, say: `At ${N(a)} both rules give ${N(ev(ps[0]!.fn, a))}, and only one condition includes ${N(a)} anyway: one output.` },
  ];
  if (hasConst) opts.push({ t: `No: the piece ${fnStr(hasConst.fn)} is constant, and a constant rule is not a function.`, mc: MC.constNot, say: `A constant rule is a function: every input in its interval gets the same single output.` });
  return choiceItem(R, { id: `isFunction-${n}`, family: 'isFunction', prompt: `Is ${F} a function?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true }) },
    solution: [`The conditions do not overlap and leave no input with two outputs.`, `Every vertical line meets the graph at most once.`] }, opts);
});
const manyToOne = (R: () => number, n: number): PWItem => retry(() => {
  const c = int(R, 2, 8), a = int(R, -1, 3);
  const ps: Piece[] = [{ fn: cst(c), hi: a, hiIn: R() < 0.5 }, { fn: mk(pick(R, [1, 2, -1]), a, pick(R, [c, c - 3, c + 2])), lo: a }];
  ps[1]!.loIn = !ps[0]!.hiIn;
  const xs = [a - 4, a - 2, a - 1].map(v => clean(v + pick(R, [0, 0.5])));
  return choiceItem(R, { id: `manyToOne-${n}`, family: 'manyToOne', prompt: `${xs.map(v => fA(v)).join(', ')} all equal ${N(c)}. Does that stop ${F} from being a function?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true, xs }) },
    solution: [`A function may send many inputs to one output.`, `It may not send one input to two outputs, and ${F} never does.`] }, [
    { t: `No: different inputs may share an output; only one input with two outputs would break it.`, ok: true, say: 'Right: a horizontal piece is many inputs, one output each.' },
    { t: `Yes: each output may come from only one input.`, mc: MC.narrow, say: `That rule is backwards. One input, one output; outputs may repeat.` },
    { t: `Yes: a constant rule like ${N(c)} is not a function.`, mc: MC.constNot, say: `A constant rule is a function: each input gets the single output ${N(c)}.` },
  ]);
});

// ===================== 5 step-as-constant-pieces =====================
function stepRule(R: () => number, o: { k?: number; sloped?: boolean; closedLeft?: boolean } = {}): Piece[] {
  for (;;) {
    const k = o.k ?? int(R, 2, 4);
    const xs = [int(R, -3, 0)];
    for (let i = 0; i < k; i++) xs.push(xs[i]! + int(R, 1, 3));
    const hs = Array.from({ length: k }, () => int(R, 0, 8));
    if (new Set(hs).size < k || hs.some((h, i) => i && h === hs[i - 1])) continue;
    const cl = o.closedLeft ?? R() < 0.5;
    const ps: Piece[] = hs.map((h, i) => ({ fn: cst(h), lo: xs[i], hi: xs[i + 1], loIn: cl, hiIn: !cl }));
    ps[0]!.loIn = true; ps[k - 1]!.hiIn = true;
    if (o.sloped) {
      const j = int(R, 0, k - 1), p = ps[j]!;
      const m = pick(R, [1, -1, 2]);
      const fn = mk(m, p.lo!, hs[j]!);
      if (ev(fn, p.hi!) < -1 || ev(fn, p.hi!) > 10) continue;
      ps[j] = { ...p, fn };
    }
    return ps;
  }
}
const isStep = (R: () => number, n: number): PWItem => retry(() => {
  const sloped = R() < 0.45, ps = stepRule(R, { sloped });
  const hs = ps.map(p => ev(p.fn, p.lo!));
  const rises = hs.slice(1).map((h, i) => h - hs[i]!);
  const equalRise = rises.every(r => r === rises[0]) && rises[0]! > 0;
  const sp = ps.find(p => p.fn.k === 'lin' && p.fn.m !== 0);
  const opts: Opt[] = sloped ? [
    { t: `No: the piece ${fnStr(sp!.fn)} has a slope, so not every piece is constant.`, ok: true, say: 'Right: a step function is piecewise with every piece constant.' },
    { t: `Yes: it has different rules on different intervals.`, mc: MC.stepProto, say: `Piecewise is not enough: every piece of a step function is flat. ${fnStr(sp!.fn)} is not.` },
    { t: `Yes: its graph has jumps.`, mc: MC.stepProto, say: `Jumps are not the test. A step function's pieces are all constant; ${fnStr(sp!.fn)} is not.` },
  ] : [
    { t: `Yes: every piece is constant.`, ok: true, say: 'Right: flat pieces, whatever their widths and heights.' },
    { t: equalRise ? `No: the steps are not all the same width.` : `No: its steps do not rise by the same amount each time.`, mc: equalRise ? MC.stepProto : MC.stepEqual, say: `Steps can have any widths and heights, and can go down. Every piece is constant: it is a step function.` },
    { t: `No: a constant piece is not a function.`, mc: MC.constNot, say: `A constant rule is a function. Here every piece is constant, which makes it a step function.` },
  ];
  return choiceItem(R, { id: `isStep-${n}`, family: 'isStep', prompt: `Is ${F} a step function?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true }) },
    solution: [`A step function is piecewise with every piece constant (a horizontal segment).`, sloped ? `${fnStr(sp!.fn)} changes with ${X}: not a step function.` : `Every rule is a number: it is a step function.`] }, opts);
});
const stepRead = (R: () => number, n: number): PWItem => retry(() => {
  const ps = stepRule(R);
  const atBreak = R() < 0.55;
  const j = int(R, 0, ps.length - 2);
  const x = atBreak ? ps[j]!.hi! : inside(R, ps[int(R, 0, ps.length - 1)]!, R() < 0.5);
  const v = fAt(ps, x)!;
  const other = atBreak ? (owners(ps, x)[0] === j ? ev(ps[j + 1]!.fn, x) : ev(ps[j]!.fn, x)) : NaN;
  return numItem({ id: `stepRead-${n}`, family: 'stepRead', prompt: `Read ${fA(x)} from the graph of the step function ${F}.`, board: `f(${NT(x)}) = \\,?`,
    picture: { g: ruleGraph(ps, { show: true, xs: [x], revealExtra: [{ kind: 'vline', key: 'vx', x, col: 'pick' }] }) },
    solution: atBreak ? [`At ${X} = ${N(x)} there is a filled dot and an open dot.`, `The open dot is not on the graph; the filled dot is: ${fA(x)} = ${ans(N(v))}`]
      : [`${N(x)} lies inside one step.`, `That step's height is ${fA(x)} = ${ans(N(v))}`] }, v,
    y => near(y, v) ? { ok: true, say: `Right: ${fA(x)} = ${N(v)}.` } : near(y, other) ? { ok: false, mc: MC.openPt, say: `That is the open dot: it marks a point that is NOT on the graph. Use the filled dot.` }
      : { ok: false, say: `Go straight up from ${X} = ${N(x)} to the graph${atBreak ? ' and use the filled dot' : ''}, then read the height.` });
});

// ===================== 6 evaluate-interior =====================
const evalPiece = (R: () => number, n: number, sg?: string): PWItem => retry(() => {
  const ps = anyRule(R), j = int(R, 0, ps.length - 1);
  const dec = R() < 0.5;
  const x = inside(R, ps[j]!, dec);
  need(x >= -10 && x <= 10);
  const v = ev(ps[j]!.fn, x);
  const wrongs = ps.map((p, i) => ({ i, v: ev(p.fn, x) })).filter(w => w.i !== j && !near(w.v, v));
  return numItem({ id: `evalPiece-${n}`, family: 'evalPiece', prompt: `Find ${fA(x)}.`, board: `${tagged('f', ps)} \\qquad f(${NT(x)})`,
    picture: { g: ruleGraph(ps, { trace: x }) },
    solution: [`${say1(ps, x)}.`, `${fnStr(ps[j]!.fn).replace(/<i>x<\/i>/g, `(${N(x)})`)} = ${ans(N(v))}`] }, v,
    y => {
      if (near(y, v)) return { ok: true, say: `Right: ${say1(ps, x)}, and that gives ${N(v)}.` };
      const w = wrongs.find(z => near(z.v, y));
      if (w) { const p = ps[w.i]!; return { ok: false, mc: p.fn.k === 'lin' && p.fn.m === 0 ? MC.easiest : w.i === 0 ? MC.ignores : MC.several, say: `That is the rule ${fnStr(p.fn)}, but ${N(x)} does not meet ${condStr(p)}. ${say1(ps, x)}.` }; }
      return { ok: false, say: `${say1(ps, x)}. Put ${N(x)} into that rule.` };
    });
});
const evalBoth = (R: () => number, n: number): PWItem => retry(() => {
  const ps = anyRule(R);
  const [i, j] = shuffle(R, ps.map((_, k) => k)).slice(0, 2) as [number, number];
  const a = inside(R, ps[i]!, R() < 0.5), b = inside(R, ps[j]!, R() < 0.5);
  const va = ev(ps[i]!.fn, a), vb = ev(ps[j]!.fn, b);
  need(!near(va, vb));
  return pairItem({ id: `evalBoth-${n}`, family: 'evalBoth', prompt: `Find ${fA(a)} and ${fA(b)}.`, board: tagged('f', ps), pairLead: `${fA(a)} =`, pairOp: `,&nbsp; ${fA(b)} =`,
    picture: { g: ruleGraph(ps, { xs: [a, b], revealExtra: [{ kind: 'point', key: 'pa', x: a, y: va, col: 'pick' }, { kind: 'point', key: 'pb', x: b, y: vb, col: 'pick' }] }) },
    solution: [`${say1(ps, a)}: ${fA(a)} = ${ans(N(va))}`, `${say1(ps, b)}: ${fA(b)} = ${ans(N(vb))}`] }, va, vb,
    (x, y) => near(x, va) && near(y, vb) ? { ok: true, say: 'Right: each input picks its own rule.' }
      : near(x, vb) && near(y, va) ? { ok: false, say: `Those are swapped: the first box is ${fA(a)}.` }
        : near(x, ev(ps[j]!.fn, a)) || near(y, ev(ps[i]!.fn, b)) ? { ok: false, mc: MC.ignores, say: `Each input uses its OWN rule: ${say1(ps, a)}; ${say1(ps, b)}.` }
          : { ok: false, say: `Test each input against the conditions first, then evaluate that one rule.` });
});

// ===================== 7 evaluate-boundary-domain =====================
const evalBreak = (R: () => number, n: number): PWItem => retry(() => {
  const mode = pick(R, ['left', 'right', 'none', 'outside']);
  let ps: Piece[], x: number;
  if (mode === 'outside') {
    const a = int(R, -3, 1), b = a + int(R, 2, 3), c = b + int(R, 2, 3);
    ps = rule2(R, { a: b, owner: R() < 0.5 ? 'L' : 'R' });
    ps[0] = { ...ps[0]!, lo: a, loIn: true }; ps[1] = { ...ps[1]!, hi: c, hiIn: R() < 0.5 };
    x = R() < 0.5 ? c + int(R, 1, 2) : a - int(R, 1, 2);
    if (R() < 0.3) { x = c; ps[1]!.hiIn = false; }
  } else {
    ps = rule2(R, { owner: mode === 'left' ? 'L' : mode === 'right' ? 'R' : 'none', jump: true });
    x = ps[0]!.hi!;
  }
  const v = fAt(ps, x);
  const yL = ev(ps[0]!.fn, x), yR = ev(ps[1]!.fn, x);
  const near2 = mode === 'outside' ? (x < ps[0]!.lo! ? 0 : 1) : -1;
  const ext = mode === 'outside' ? ev(ps[near2]!.fn, x) : NaN;
  const avg = clean((yL + yR) / 2);
  const why = v !== undefined ? say1(ps, x) : `no condition includes ${X} = ${N(x)}`;
  const opts: Opt[] = [{ t: `Undefined: no piece covers ${X} = ${N(x)}`, ok: v === undefined, mc: v === undefined ? undefined : MC.undefBreak, say: v === undefined ? `Right: ${why}, so ${F} has no output there.` : `A condition does include ${N(x)}: ${why}.` }];
  if (mode === 'outside') {
    opts.push({ t: N(ext), mc: MC.beyond, say: `That rule stops at its end of the domain. ${why}: no output.` });
  } else {
    for (const [y, side] of [[yL, 0], [yR, 1]] as const) opts.push({ t: N(y), ok: v !== undefined && near(v, y), mc: v !== undefined && near(v, y) ? undefined : MC.looks, say: v !== undefined && near(v, y) ? `Right: ${why}.` : `${N(y)} comes from ${fnStr(ps[side]!.fn)}, whose condition leaves ${N(x)} out. ${why}.` });
    opts.push({ t: N(avg), mc: MC.average, say: `Never average the two rules. ${why}.` });
  }
  if (!opts.some(o => o.t === '0')) opts.push({ t: '0', mc: MC.zero, say: `No output is not the same as the output 0. ${why}.` });
  need(new Set(opts.map(o => o.t)).size === opts.length);
  const g = ruleGraph(ps, { xs: [x], revealExtra: [{ kind: 'vline', key: 'vx', x, col: 'pick' }] });
  return choiceItem(R, { id: `evalBreak-${n}`, family: 'evalBreak', prompt: `What is ${fA(x)}?`, board: `${tagged('f', ps)} \\qquad f(${NT(x)})`,
    picture: { g }, solution: [`Test ${X} = ${N(x)} against every condition, ends included or not.`, `${why}.`] }, opts);
});
const isolatedPoint = (R: () => number, n: number): PWItem => retry(() => {
  const a = int(R, -2, 3), c = int(R, -2, 8);
  const base = rule2(R, { a, jump: R() < 0.5, owner: 'none' });
  const ps: Piece[] = [base[0]!, { fn: cst(c), lo: a, hi: a, loIn: true, hiIn: true }, base[1]!];
  need(!near(c, ev(base[0]!.fn, a)) && !near(c, ev(base[1]!.fn, a)));
  const askAt = R() < 0.7;
  const x = askAt ? a : clean(a + pick(R, [-1, 1, -0.5, 0.5]));
  const v = fAt(ps, x)!;
  return numItem({ id: `isolatedPoint-${n}`, family: 'isolatedPoint', prompt: `Find ${fA(x)}.`, board: `${tagged('f', ps)}`,
    picture: { g: ruleGraph(ps, { xs: [x], trace: askAt ? undefined : x, revealExtra: [{ kind: 'vline', key: 'vx', x, col: 'pick' }] }) },
    solution: [`${say1(ps, x)}.`, `${fA(x)} = ${ans(N(v))}`] }, v,
    y => near(y, v) ? { ok: true, say: `Right: ${say1(ps, x)}.` }
      : askAt && (near(y, ev(base[0]!.fn, a)) || near(y, ev(base[1]!.fn, a))) ? { ok: false, mc: MC.looks, say: `The line runs up to ${N(a)}, but its condition leaves ${N(a)} out. The row ${X} = ${N(a)} gives ${N(c)}.` }
        : { ok: false, say: `${say1(ps, x)}.` });
});

// ===================== 8 endpoint-dots =====================
function hideDotsAt(parts: GPart[], a: number): GPart[] {
  return parts.map(P => (P.kind === 'piece' ? { ...P, ends: [P.lo === a ? 'none' : P.ends![0], P.hi === a ? 'none' : P.ends![1]] as [End, End] } : P));
}
const dotFill = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule2(R, { jump: true });
  const a = ps[0]!.hi!, yL = ev(ps[0]!.fn, a), yR = ev(ps[1]!.fn, a), lOwn = ps[0]!.hiIn!;
  const [yc, yo] = lOwn ? [yL, yR] : [yR, yL];
  const w = windowFor(ps, [a]);
  const parts = hideDotsAt(pieceParts(ps), a);
  return choiceItem(R, { id: `dotFill-${n}`, family: 'dotFill', prompt: `The graph of ${F} is drawn without its dots at ${X} = ${N(a)}. Which dots belong there?`, board: tagged('f', ps),
    picture: { g: { ...w, parts, reveal: { parts: [{ kind: 'point', key: 'dc', x: a, y: yc, col: 'link' }, { kind: 'point', key: 'do', x: a, y: yo, open: true, col: 'link' }] } } },
    solution: [`${condStr(lOwn ? ps[0]! : ps[1]!)} includes ${N(a)}: that piece ends in a filled dot at ${pt(a, yc)}.`, `The other piece leaves ${N(a)} out: an open dot at ${pt(a, yo)}.`] }, [
    { t: `Filled at ${pt(a, yc)}, open at ${pt(a, yo)}`, ok: true, say: 'Right: filled = included, open = left out.' },
    { t: `Open at ${pt(a, yc)}, filled at ${pt(a, yo)}`, mc: MC.style, say: `That is backwards: the filled dot goes where the condition includes ${N(a)}.` },
    { t: `Filled at both`, mc: MC.fill, say: `Both rules have a value at ${N(a)}, but only one condition includes it. Two filled dots would give ${N(a)} two outputs.` },
    { t: `Open at both`, mc: MC.undefBreak, say: `${condStr(lOwn ? ps[0]! : ps[1]!)} includes ${N(a)}, so that end is filled.` },
  ]);
});
const joinDot = (R: () => number, n: number): PWItem => retry(() => {
  const hole = R() < 0.35;
  const ps = rule2(R, { jump: false, owner: hole ? 'none' : R() < 0.5 ? 'L' : 'R' });
  const a = ps[0]!.hi!, v = ev(ps[0]!.fn, a);
  const w = windowFor(ps, [a]);
  const parts = hideDotsAt(pieceParts(ps), a);
  const ownP = ps.find(p => owners([p], a).length);
  return choiceItem(R, { id: `joinDot-${n}`, family: 'joinDot', prompt: `Both pieces of ${F} reach ${pt(a, v)}. What belongs at that point?`, board: tagged('f', ps),
    picture: { g: { ...w, parts, reveal: { parts: [{ kind: 'point', key: 'dj', x: a, y: v, open: hole, col: 'link' }] } } },
    solution: hole ? [`x &lt; ${N(a)} and x &gt; ${N(a)} both leave ${N(a)} out.`, `So ${pt(a, v)} is not on the graph: an open dot (a hole).`]
      : [`${condStr(ownP!)} includes ${N(a)}, so ${pt(a, v)} is on the graph.`, `One included piece is enough: a filled dot.`] }, hole ? [
    { t: `An open dot: no condition includes ${N(a)}`, ok: true, say: 'Right: a hole. The lines reach it, but no rule owns it.' },
    { t: `A filled dot: both lines reach it`, mc: MC.fill, say: `Reaching a point is not owning it: x &lt; ${N(a)} and x &gt; ${N(a)} both leave ${N(a)} out.` },
    { t: `Nothing: the two lines just meet there`, mc: MC.gap, say: `Without a dot the graph would look as if ${fA(a)} = ${N(v)}. Mark the hole with an open dot.` },
  ] : [
    { t: `A filled dot: ${condStr(ownP!)} includes ${N(a)}`, ok: true, say: 'Right: one piece that includes the point is enough.' },
    { t: `An open dot: the other piece leaves ${N(a)} out`, mc: MC.shared, say: `The point is on the graph because ${condStr(ownP!)} includes ${N(a)}. The other piece doesn't need to.` },
    { t: `A filled dot and an open dot, side by side`, mc: MC.fill, say: `There is one point here, ${pt(a, v)}, and it is on the graph: one filled dot.` },
  ]);
});
const readOpen = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule2(R, { jump: true });
  const a = ps[0]!.hi!, v = fAt(ps, a)!;
  const other = ps[0]!.hiIn ? ev(ps[1]!.fn, a) : ev(ps[0]!.fn, a);
  return numItem({ id: `readOpen-${n}`, family: 'readOpen', prompt: `Read ${fA(a)} from the graph.`, board: `f(${NT(a)}) = \\,?`,
    picture: { g: ruleGraph(ps, { show: true, xs: [a], revealExtra: [{ kind: 'vline', key: 'vx', x: a, col: 'pick' }] }) },
    solution: [`At ${X} = ${N(a)}: a filled dot at height ${N(v)} and an open dot at height ${N(other)}.`, `Only the filled dot is on the graph: ${fA(a)} = ${ans(N(v))}`] }, v,
    y => near(y, v) ? { ok: true, say: 'Right: the filled dot is the output.' } : near(y, other) ? { ok: false, mc: MC.openPt, say: `That is the open dot: the point is NOT on the graph. The filled dot is at ${N(v)}.` }
      : { ok: false, say: `Go up from ${N(a)} and use the filled dot.` });
});

// ===================== 9 restrict-branch-graph =====================
function onePiece(R: () => number): Piece {
  for (;;) {
    const m = pick(R, [-2, -1, 0, 1, 2, 0.5, -0.5]), kind = pick(R, ['seg', 'seg', 'rayR', 'rayL']);
    const lo = int(R, -4, 1), hi = lo + int(R, 2, 5);
    const y0 = int(R, -3, 6);
    const fn = mk(m, lo, y0);
    if (Math.abs(ev(fn, hi)) > 9) continue;
    const loIn = R() < 0.5;
    if (kind === 'seg') return { fn, lo, hi, loIn, hiIn: !loIn };
    if (kind === 'rayR') return { fn, lo, loIn };
    return { fn, hi, hiIn: loIn };
  }
}
const graphOf = (ps: Piece[], w: { x: GPic['x']; y: GPic['y'] }, parts?: GPart[]): GPic => ({ ...w, parts: parts ?? pieceParts(ps) });
const pieceGraph = (R: () => number, n: number): PWItem => retry(() => {
  const p = onePiece(R), ps = [p];
  const w = windowFor(ps, [p.lo ?? p.hi! - 3, p.hi ?? p.lo! + 3]);
  const full: Piece = { fn: p.fn };
  const flip: Piece = p.lo !== undefined && p.hi !== undefined ? { ...p, loIn: !p.loIn, hiIn: !p.hiIn } : p.lo !== undefined ? { fn: p.fn, hi: p.lo, hiIn: p.loIn } : { fn: p.fn, lo: p.hi, loIn: p.hiIn };
  const flipSay = p.lo !== undefined && p.hi !== undefined ? 'The dots are swapped: the filled dot goes on the end the condition includes.' : `That ray points the wrong way: ${condStr(p)} goes ${p.lo !== undefined ? 'right' : 'left'} from ${N(p.lo ?? p.hi!)}.`;
  return graphChoice(R, { id: `pieceGraph-${n}`, family: 'pieceGraph', prompt: `Which graph shows <b>${X} ↦ ${fnStr(p.fn)}</b> only for <b>${condStr(p)}</b>?`, board: `y = ${fnStr(p.fn, true)}, \\quad ${condStr(p, true)}`,
    solution: [`Draw the line only over ${condStr(p)}.`, `Filled dot at an included end, open dot at a left-out end, an arrow where it goes on forever.`] }, [
    { t: '', ok: true, say: 'Right: only the interval, with the right dots.', pic: graphOf(ps, w) },
    { t: '', mc: MC.beyond, say: `That draws the whole line. The rule only holds for ${condStr(p)}.`, pic: graphOf([full], w) },
    { t: '', mc: p.lo !== undefined && p.hi !== undefined ? MC.style : undefined, say: flipSay, pic: graphOf([flip], w) },
  ]);
});
const segEnds = (R: () => number, n: number): PWItem => retry(() => {
  const m = pick(R, [-2, -1, 1, 2, 3, -3]), lo = int(R, -4, 1), hi = lo + int(R, 2, 5), y0 = int(R, -4, 6);
  const fn = mk(m, lo, y0), loIn = R() < 0.5;
  const p: Piece = { fn, lo, hi, loIn, hiIn: !loIn };
  const ya = ev(fn, lo), yb = ev(fn, hi);
  need(Math.abs(yb) <= 10);
  const d = (inc: boolean) => (inc ? 'a filled dot' : 'an open dot');
  const w = windowFor([p], []);
  return choiceItem(R, { id: `segEnds-${n}`, family: 'segEnds', prompt: `You graph <b>${X} ↦ ${fnStr(fn)}</b> for <b>${condStr(p)}</b>. Which description is right?`, board: `y = ${fnStr(fn, true)}, \\quad ${condStr(p, true)}`,
    picture: { g: { ...w, parts: [], reveal: { parts: pieceParts([p]) } } },
    solution: [`The ends are at ${X} = ${N(lo)} and ${X} = ${N(hi)}: ${pt(lo, ya)} and ${pt(hi, yb)}.`, `${N(lo)} is ${loIn ? 'included' : 'left out'} and ${N(hi)} is ${loIn ? 'left out' : 'included'}.`] }, [
    { t: `From ${d(loIn)} at ${pt(lo, ya)} to ${d(!loIn)} at ${pt(hi, yb)}`, ok: true, say: 'Right.' },
    { t: `From ${d(!loIn)} at ${pt(lo, ya)} to ${d(loIn)} at ${pt(hi, yb)}`, mc: MC.style, say: `Swapped: the filled dot goes where the condition has ≤.` },
    { t: `A whole line through ${pt(lo, ya)} and ${pt(hi, yb)}, arrows both ways`, mc: MC.beyond, say: `The rule only holds for ${condStr(p)}: a segment, not a whole line.` },
    { t: `From ${d(loIn)} at ${pt(lo, ya + 1)} to ${d(!loIn)} at ${pt(hi, yb + 1)}`, say: `Put the ends into the rule: ${fnStr(fn)} gives ${N(ya)} and ${N(yb)}.` },
  ]);
});

// ===================== 10 assemble-piecewise-graph =====================
const wholeGraph = (R: () => number, n: number): PWItem => retry(() => {
  const ps = R() < 0.5 ? rule2(R, { jump: true }) : rule3(R);
  const jumps = ps.slice(0, -1).map(p => p.hi!).filter(a => !near(ev(ps.find(p => p.hi === a)!.fn, a), ev(ps.find(p => p.lo === a)!.fn, a)));
  need(jumps.length >= 1);
  const w = windowFor(ps, []);
  const good = pieceParts(ps);
  const conn: GPart[] = [...good, ...jumps.map((a, i): GPart => ({ kind: 'seg', key: `c${i}`, a: [a, ev(ps.find(p => p.hi === a)!.fn, a)], b: [a, ev(ps.find(p => p.lo === a)!.fn, a)], col: 'link' }))];
  const allClosed = good.map(P => (P.kind === 'piece' ? { ...P, ends: P.ends!.map(e => (e === 'open' ? 'closed' : e)) as typeof P.ends } : P));
  return graphChoice(R, { id: `wholeGraph-${n}`, family: 'wholeGraph', prompt: `Which graph shows ${F}?`, board: tagged('f', ps),
    solution: [`Each piece only over its own interval.`, `At each break: filled where the condition includes it, open where it doesn't, and nothing joining the jump.`] }, [
    { t: '', ok: true, say: 'Right.', pic: graphOf(ps, w, good) },
    { t: '', mc: MC.connects, say: 'A vertical segment at a jump would give that input many outputs. Leave the gap.', pic: graphOf(ps, w, conn) },
    { t: '', mc: MC.fill, say: 'Only the piece whose condition includes the breakpoint gets a filled dot; the other end is open.', pic: graphOf(ps, w, allClosed) },
  ]);
});
const graphPoints = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule2(R, { jump: true });
  const a = ps[0]!.hi!, yL = ev(ps[0]!.fn, a), yR = ev(ps[1]!.fn, a), lOwn = ps[0]!.hiIn!;
  const [yc, yo] = lOwn ? [yL, yR] : [yR, yL];
  return pairItem({ id: `graphPoints-${n}`, family: 'graphPoints', prompt: `When you graph ${F}, two dots sit above ${X} = ${N(a)}. Give their heights.`, board: tagged('f', ps),
    pairLead: 'filled dot at <i>y</i> =', pairOp: ',&nbsp; open dot at <i>y</i> =',
    picture: { g: ruleGraph(ps, { xs: [a] }) },
    solution: [`${condStr(lOwn ? ps[0]! : ps[1]!)} includes ${N(a)}: ${fnStr(lOwn ? ps[0]!.fn : ps[1]!.fn)} gives the filled dot at ${ans(N(yc))}`, `The other rule leaves ${N(a)} out: its end is an open dot at ${ans(N(yo))}`] }, yc, yo,
    (x, y) => near(x, yc) && near(y, yo) ? { ok: true, say: 'Right.' } : near(x, yo) && near(y, yc) ? { ok: false, mc: MC.style, say: `Swapped: the filled dot belongs to the rule whose condition includes ${N(a)}.` }
      : { ok: false, say: `Put ${N(a)} into both rules; then decide which condition includes ${N(a)}.` });
});

// ===================== 11 threshold-language =====================
interface Ctx { v: string; unit: string; noun: string }
const THRESH: { phrase: (t: string) => string; op: '<' | '<=' | '>' | '>='; ctx: Ctx; ts: number[] }[] = [
  { phrase: t => `Bags that weigh more than ${t} lb pay an overweight fee.`, op: '>', ctx: { v: 'w', unit: 'lb', noun: 'the fee piece' }, ts: [40, 50, 70] },
  { phrase: t => `Orders of at least $${t} ship free.`, op: '>=', ctx: { v: 'x', unit: '$', noun: 'the free-shipping piece' }, ts: [25, 35, 50] },
  { phrase: t => `Kids under ${t} eat for $5.`, op: '<', ctx: { v: 'a', unit: 'years', noun: 'the $5 piece' }, ts: [10, 12, 13] },
  { phrase: t => `Calls up to and including ${t} minutes cost $1.`, op: '<=', ctx: { v: 't', unit: 'min', noun: 'the $1 piece' }, ts: [3, 5, 10] },
  { phrase: t => `Plans that use no more than ${t} GB cost $35 a month.`, op: '<=', ctx: { v: 'g', unit: 'GB', noun: 'the $35 piece' }, ts: [5, 10, 15] },
  { phrase: t => `Groups of ${t} or more people get 15% off.`, op: '>=', ctx: { v: 'n', unit: 'people', noun: 'the discount piece' }, ts: [8, 10, 12] },
  { phrase: t => `Drivers going over ${t} mph get a ticket.`, op: '>', ctx: { v: 's', unit: 'mph', noun: 'the ticket piece' }, ts: [55, 65, 70] },
  { phrase: t => `Packages that weigh less than ${t} lb ship for $6.`, op: '<', ctx: { v: 'w', unit: 'lb', noun: 'the $6 piece' }, ts: [1, 2, 5] },
  { phrase: t => `Letters not over ${t} oz go for the base price.`, op: '<=', ctx: { v: 'w', unit: 'oz', noun: 'the base-price piece' }, ts: [1, 2, 3] },
];
const OPH: Record<string, string> = { '<': '&lt;', '<=': '≤', '>': '&gt;', '>=': '≥' };
const OPT: Record<string, string> = { '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge' };
const phraseCond = (R: () => number, n: number): PWItem => {
  const T = pick(R, THRESH), t = pick(R, T.ts), v = T.ctx.v;
  const ops = ['<', '<=', '>', '>='] as const;
  const dirOf = (o: string) => o[0], strictOf = (o: string) => o.length === 1;
  return choiceItem(R, { id: `phraseCond-${n}`, family: 'phraseCond', prompt: `${T.phrase(String(t))} Which condition goes with ${T.ctx.noun}?`, board: `${v}\\ \\square\\ ${t}`,
    solution: [`Direction: ${dirOf(T.op) === '<' ? 'below' : 'above'} ${t}.`, `${strictOf(T.op) ? `${t} itself is left out` : `${t} itself is included`}: <i>${v}</i> ${OPH[T.op]} ${t}.`] },
    ops.map(o => {
      const ok = o === T.op, dirOk = dirOf(o) === dirOf(T.op), strOk = strictOf(o) === strictOf(T.op);
      return { t: `<i>${v}</i> ${OPH[o]} ${t}`, ok, mc: ok ? undefined : dirOk ? MC.strict : strOk ? MC.reversed : undefined,
        say: ok ? 'Right: the direction and the endpoint both match the words.' : dirOk ? `The direction is right, but check ${t} itself: does the wording include it?` : `Check the direction: the wording means ${dirOf(T.op) === '<' ? 'below' : 'above'} ${t}.` };
    }));
};
const twoThreshold = (R: () => number, n: number): PWItem => {
  const C = pick(R, [
    { what: 'A shipping company charges by weight', v: 'w', u: 'lb', a: pick(R, [1, 2]), b: pick(R, [5, 10]), p: ['$5', '$9', '$14'] },
    { what: 'A ride-share app prices trips by distance', v: 'd', u: 'mi', a: pick(R, [2, 3]), b: pick(R, [8, 10]), p: ['$6', '$11', '$18'] },
    { what: 'A gym charges for a class by its length', v: 't', u: 'min', a: pick(R, [30, 45]), b: pick(R, [60, 90]), p: ['$10', '$15', '$20'] },
  ]);
  const v = `<i>${C.v}</i>`, leftOwn = R() < 0.5;
  const tiers = leftOwn ? [`${C.a} ${C.u} or less`, `over ${C.a} ${C.u}, up to and including ${C.b} ${C.u}`, `over ${C.b} ${C.u}`]
    : [`under ${C.a} ${C.u}`, `at least ${C.a} ${C.u} but under ${C.b} ${C.u}`, `${C.b} ${C.u} or more`];
  const set = (o1: string, o2a: string, o2b: string, o3: string) => `${v} ${o1} ${C.a}; &nbsp;${C.a} ${o2a} ${v} ${o2b} ${C.b}; &nbsp;${v} ${o3} ${C.b}`;
  const right = leftOwn ? set('≤', '&lt;', '≤', '&gt;') : set('&lt;', '≤', '&lt;', '≥');
  const swapped = leftOwn ? set('&lt;', '≤', '&lt;', '≥') : set('≤', '&lt;', '≤', '&gt;');
  const gap = set('&lt;', '&lt;', '&lt;', '&gt;');
  const both = set('≤', '≤', '≤', '≥');
  return choiceItem(R, { id: `twoThreshold-${n}`, family: 'twoThreshold', prompt: `${C.what}: ${tiers.map((t, i) => `${t}: ${C.p[i]}`).join('; ')}. Which conditions match?`, board: `\\text{price} = \\begin{cases} ${tiers.map((t, i) => `${C.p[i]!.replace('$', '\\$')}, & \\text{${t}}`).join(' \\\\ ')} \\end{cases}`,
    solution: [`"${tiers[0]}" ${leftOwn ? 'includes' : 'leaves out'} ${C.a}; "${tiers[2]}" ${leftOwn ? 'leaves out' : 'includes'} ${C.b}.`, `Every ${C.v} meets exactly one: ${right}.`] }, [
    { t: right, ok: true, say: 'Right: each threshold belongs to exactly one tier, the one the words give it to.' },
    { t: swapped, mc: MC.strict, say: `Each threshold goes to the wrong tier: reread "${tiers[0]}".` },
    { t: gap, mc: MC.gap, say: `With &lt; and &gt; on both sides, ${C.a} and ${C.b} get no price at all.` },
    { t: both, mc: MC.strict, say: `Here ${C.a} and ${C.b} each meet two conditions with two different prices.` },
  ]);
};

// ===================== 12 step-graph-context / 13 completed-unit-steps =====================
const STARTED = [
  { what: 'A parking garage charges', rate: [3, 4, 5], unit: 'hour', units: 'hours', max: [4, 5, 6] },
  { what: 'A phone plan charges international calls at', rate: [0.5, 1], unit: 'minute', units: 'minutes', max: [5, 6] },
  { what: 'A tool rental shop charges', rate: [8, 10, 12], unit: 'hour', units: 'hours', max: [4, 5] },
  { what: 'A kayak rental charges', rate: [15, 20], unit: 'hour', units: 'hours', max: [4, 6] },
];
/** 2.25 hours as "2 hours 15 minutes", 3.5 minutes as "3 minutes 30 seconds" */
function timeText(t: number, unit: string, units: string): string {
  const sub = unit === 'minute' ? 'seconds' : 'minutes';
  const h = Math.floor(t + 1e-9), m = Math.round((t - h) * 60);
  if (!m) return `${h} ${h === 1 ? unit : units}`;
  return `${h ? `${h} ${h === 1 ? unit : units} ` : ''}${m} ${sub}`;
}
const R60 = (t: number) => Math.abs((t - Math.floor(t)) * 60 - Math.round((t - Math.floor(t)) * 60)) < 1e-6;
function stepsPic(rate: number, max: number, kind: 'started' | 'completed', o: { show?: boolean; trace?: number; x: string; y: string; join?: boolean }): GPic {
  const ps: Piece[] = Array.from({ length: max }, (_, i) => kind === 'started'
    ? { fn: cst(rate * (i + 1)), lo: i, hi: i + 1, loIn: false, hiIn: true }
    : { fn: cst(rate * i), lo: i, hi: i + 1, loIn: true, hiIn: i + 1 === max ? false : false });
  const x = axisOver([0, max], { cells: 12, name: o.x }), y = axisOver([0, rate * (kind === 'started' ? max : max - 1)], { cells: 10, name: o.y });
  const parts = pieceParts(ps, 'p', { cols: ['link'], arrows: false });
  const tk = o.trace !== undefined ? `p${owners(ps, o.trace)[0]}` : undefined;
  return { x, y, money: 'y', parts: o.show ? parts : [], reveal: { parts: o.show ? [] : parts, ...(tk && o.trace !== undefined ? { trace: { key: tk, x: o.trace } } : {}) } };
}
const startedCost = (R: () => number, n: number): PWItem => retry(() => {
  const C = pick(R, STARTED), rate = pick(R, C.rate), max = pick(R, C.max);
  const kind = pick(R, ['below', 'at', 'above', 'mid']);
  const k = int(R, 1, max - 1);
  const t = kind === 'at' ? k : kind === 'below' ? clean(k - pick(R, [1 / 6, 0.25, 1 / 12])) : kind === 'above' ? clean(k + pick(R, [1 / 6, 0.25, 1 / 12])) : clean(k + pick(R, [1 / 3, 0.5, 2 / 3, 0.75]));
  need(t > 0 && t <= max && R60(t));
  const tt = Math.round(t * 1000) / 1000;
  const cost = rate * Math.ceil(tt - 1e-9), rnd = rate * Math.round(tt), flo = rate * Math.floor(tt), nxt = rate * (Math.ceil(tt - 1e-9) + 1);
  return numItem({ id: `startedCost-${n}`, family: 'startedCost', prompt: `${C.what} ${$(rate)} for each ${C.unit} or part of ${art(C.unit)}, for at most ${max} ${C.units}. What does ${timeText(tt, C.unit, C.units)} cost?`, unit: 'dollars',
    board: `C(t) = ${$T(rate)} \\times (\\text{${C.units} started})`,
    picture: { g: stepsPic(rate, max, 'started', { trace: tt, x: C.units, y: 'cost ($)' }) },
    solution: [`Each started ${C.unit} counts as a whole one: ${timeText(tt, C.unit, C.units)} starts ${Math.ceil(tt - 1e-9)} ${C.units}.`, `${Math.ceil(tt - 1e-9)} × ${$(rate)} = ${ans($(cost))}`] }, cost,
    y => near(y, cost) ? { ok: true, say: `Right: ${Math.ceil(tt - 1e-9)} started ${C.units}.` }
      : kind !== 'at' && near(y, rnd) && !near(rnd, cost) ? { ok: false, mc: MC.nearest, say: `Don't round to the nearest: any part of ${art(C.unit)} is charged as a whole ${C.unit}. Round up.` }
        : kind === 'at' && near(y, nxt) ? { ok: false, mc: MC.wrongPiece, say: `Exactly ${tt} ${C.units} has not started a new ${C.unit} yet: the step is closed on the right, so it costs ${$(cost)}.` }
          : near(y, flo) && !near(flo, cost) ? { ok: false, mc: MC.floorCeil, say: `That pays for completed ${C.units} only. A started ${C.unit} counts: round up.` }
            : { ok: false, say: `Count the ${C.units} that have started (round up), then multiply by ${$(rate)}.` });
});
const startedGraph = (R: () => number, n: number): PWItem => {
  const C = pick(R, STARTED), rate = pick(R, C.rate), max = pick(R, C.max);
  const right = stepsPic(rate, max, 'started', { show: true, x: C.units, y: 'cost ($)' });
  const left: GPic = { ...right, parts: right.parts.map(P => (P.kind === 'piece' ? { ...P, ends: [P.lo === 0 ? 'open' : 'closed', P.hi === max ? 'closed' : 'open'] as [End, End] } : P)) };
  const joined: GPic = { ...right, parts: [...right.parts, ...Array.from({ length: max - 1 }, (_, i): GPart => ({ kind: 'seg', key: `j${i}`, a: [i + 1, rate * (i + 1)], b: [i + 1, rate * (i + 2)], col: 'link' }))] };
  return graphChoice(R, { id: `startedGraph-${n}`, family: 'startedGraph', prompt: `${C.what} ${$(rate)} for each ${C.unit} or part of ${art(C.unit)}, for at most ${max} ${C.units}. Which graph shows the cost?`, board: `0 < t \\le ${max}`,
    solution: [`Exactly 1 ${C.unit} costs ${$(rate)}; a moment more costs ${$(2 * rate)}.`, `So each step is open on the left and filled on the right, with no vertical joins.`] }, [
    { t: '', ok: true, say: 'Right: open on the left, filled on the right.', pic: right },
    { t: '', mc: MC.wrongPiece, say: `That charges ${$(2 * rate)} for exactly 1 ${C.unit}. A ${C.unit} that is exactly used up has not started a new one.`, pic: left },
    { t: '', mc: MC.connects, say: `The vertical joins would give one time many prices. The cost jumps; leave the gap.`, pic: joined },
  ]);
};
const COMPLETED = [
  { what: 'A café pays a bonus of', rate: [5, 6], unit: 'completed hour', units: 'hours', time: true },
  { what: 'A fitness app gives', rate: [10, 25], unit: 'full mile you run', units: 'miles', pts: true },
];
const completedPay = (R: () => number, n: number): PWItem => retry(() => {
  const C = pick(R, COMPLETED), rate = pick(R, C.rate);
  const k = int(R, 1, 5);
  const t = 'time' in C ? pick(R, [k, clean(k + 0.5), clean(k + 0.75), clean(k + 5 / 6), clean(k - 1 / 6), clean(k + 0.25)]) : pick(R, [k, clean(k + 0.5), clean(k + 0.8), clean(k + 0.9), clean(k - 0.1), clean(k + 0.3)]);
  need(t > 0);
  const tx = 'time' in C ? timeText(t, 'hour', 'hours') : `${N(t)} miles`;
  const pay = rate * Math.floor(t + 1e-9), ceilV = rate * Math.ceil(t - 1e-9), rnd = rate * Math.round(t);
  const unitV = C.pts ? 'points' : 'dollars';
  const show = (v: number) => (C.pts ? `${v} points` : $(v));
  return numItem({ id: `completedPay-${n}`, family: 'completedPay', prompt: `${C.what} ${show(rate)} for each ${C.unit}; a part of one earns nothing. What does ${tx} earn?`, unit: unitV,
    board: `P = ${C.pts ? rate : $T(rate)} \\times (\\text{completed ${C.units}})`,
    picture: { g: { ...stepsPic(rate, 6, 'completed', { trace: t, x: C.units, y: C.pts ? 'points' : 'pay ($)' }), money: C.pts ? undefined : 'y' } },
    solution: [`Only completed ${C.units} count: ${tx} holds ${Math.floor(t + 1e-9)} completed.`, `${Math.floor(t + 1e-9)} × ${show(rate)} = ${C.pts ? ans(pay) + ' points' : ans($(pay))}`] }, pay,
    y => near(y, pay) ? { ok: true, say: 'Right: round down to the completed units.' }
      : near(y, ceilV) && !near(ceilV, pay) ? { ok: false, mc: MC.floorCeil, say: `That pays the part too. Only completed ${C.units} count: round down.` }
        : near(y, rnd) && !near(rnd, pay) ? { ok: false, mc: MC.roundsIn, say: `Don't round ${N(t)} to the nearest: count completed ${C.units} only.` }
          : { ok: false, say: `Count completed ${C.units} (round down), then multiply.` });
});
const whichWay = (R: () => number, n: number): PWItem => {
  const started = R() < 0.5, k = int(R, 1, 5);
  const C = started ? pick(R, STARTED) : pick(R, COMPLETED);
  const rate = pick(R, C.rate);
  const val = rate * k;
  const ivs = [[k - 1, false, k, true], [k, true, k + 1, false], [k, false, k + 1, true], [k - 1, true, k, false]] as const;
  const txt = (a: number, ai: boolean, b: number, bi: boolean) => `${N(a)} ${ai ? '≤' : '&lt;'} <i>t</i> ${bi ? '≤' : '&lt;'} ${N(b)}`;
  const rightI = started ? 0 : 1;
  const unitName = C.unit;
  const prompt = started ? `${C.what} ${$(rate)} for each ${unitName} or part of ${art(unitName)}. For which times <i>t</i> (in ${C.units}) is the cost exactly ${$(val)}?`
    : `${C.what} ${'pts' in C && C.pts ? `${rate} points` : $(rate)} for each ${unitName}. For which <i>t</i> (in ${C.units}) is the total exactly ${'pts' in C && C.pts ? `${val} points` : $(val)}?`;
  return choiceItem(R, { id: `whichWay-${n}`, family: 'whichWay', prompt, board: started ? `\\text{per started unit}` : `\\text{per completed unit}`,
    solution: started ? [`${$(val)} pays for ${k} started units: more than ${k - 1}, up to and including ${k}.`, `${txt(k - 1, false, k, true)}: open on the left, filled on the right.`]
      : [`The total is ${k} × rate from the moment ${k} units are completed until the next one is.`, `${txt(k, true, k + 1, false)}: filled on the left, open on the right.`] },
    ivs.map(([a, ai, b, bi], i) => ({ t: txt(a, ai, b, bi), ok: i === rightI,
      mc: i === rightI ? undefined : !started && i === 0 ? MC.floorCeil : !started && i === 2 ? MC.floorRight : undefined,
      say: i === rightI ? 'Right.' : started ? `A started unit counts: at ${k - 1} plus a moment you already pay for ${k}, and at exactly ${k} you still pay for ${k}.` : `Completed units only: exactly ${k} has ${k} completed, and so does anything up to (not including) ${k + 1}.` })));
};

// ===================== 14 greatest-integer-extension =====================
const floorEval = (R: () => number, n: number): PWItem => {
  const kind = pick(R, ['pos', 'int', 'neg', 'neg']);
  const x = kind === 'pos' ? clean(int(R, 0, 6) + pick(R, [0.2, 0.5, 0.7, 0.9])) : kind === 'int' ? int(R, -4, 6) : -clean(int(R, 0, 4) + pick(R, [0.2, 0.5, 0.7, 0.8]));
  const c = pick(R, [0, 0, 1, -1, 2, 3]);
  const nota = pick(R, ['floor', 'int', 'brk']);
  const tx = nota === 'floor' ? `\\lfloor ${NT(x)} \\rfloor` : nota === 'int' ? `\\operatorname{int}(${NT(x)})` : `[\\![\\, ${NT(x)} \\,]\\!]`;
  const hx = nota === 'floor' ? `⌊${N(x)}⌋` : nota === 'int' ? `int(${N(x)})` : `[[${N(x)}]]`;
  const v = Math.floor(x) + c, tr = Math.trunc(x) + c;
  return numItem({ id: `floorEval-${n}`, family: 'floorEval', prompt: `The greatest integer function gives the greatest integer that is less than or equal to its input. Find ${hx}${c ? ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}` : ''}.`,
    board: `${tx}${c ? ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}` : ''}`,
    picture: { g: { x: { min: -5, max: 7, step: 1, name: 'x' }, y: { min: -8, max: 10, step: 1, name: 'y' }, parts: [], reveal: { parts: Array.from({ length: 12 }, (_, i): GPart => ({ kind: 'piece', key: `f${i}`, fn: cst(i - 5 + c), lo: i - 5, hi: i - 4, ends: ['closed', 'open'], col: 'link' })), trace: { key: `f${Math.floor(x) + 5}`, x } } } },
    solution: [`The greatest integer ≤ ${N(x)} is ${N(Math.floor(x))}${x < 0 && !Number.isInteger(x) ? ` (on the number line it is to the LEFT of ${N(x)})` : ''}.`, c ? `${N(Math.floor(x))} ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${ans(N(v))}` : `So ${hx} = ${ans(N(v))}`] }, v,
    y => near(y, v) ? { ok: true, say: 'Right.' } : near(y, tr) && tr !== v ? { ok: false, mc: MC.trunc, say: `Dropping the decimals gives ${N(Math.trunc(x))}, but that is MORE than ${N(x)}. The greatest integer below ${N(x)} is ${N(Math.floor(x))}.` }
      : { ok: false, say: `Find the integer just at or below ${N(x)} on the number line${c ? `, then ${c > 0 ? 'add' : 'subtract'} ${Math.abs(c)}` : ''}.` });
};
const floorSolve = (R: () => number, n: number): PWItem => {
  const c = pick(R, [0, 1, -1, 2]), k = int(R, -3, 4), target = k + c;
  const txt = (a: number, ai: boolean, b: number, bi: boolean) => `${N(a)} ${ai ? '≤' : '&lt;'} ${X} ${bi ? '≤' : '&lt;'} ${N(b)}`;
  return choiceItem(R, { id: `floorSolve-${n}`, family: 'floorSolve', prompt: `For which ${X} is ⌊${X}⌋${c ? ` ${c > 0 ? '+' : '−'} ${Math.abs(c)}` : ''} = ${N(target)}?`, board: `\\lfloor x \\rfloor${c ? ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}` : ''} = ${NT(target)}`,
    solution: [c ? `First ⌊${X}⌋ = ${N(k)}.` : `⌊${X}⌋ = ${N(k)}.`, `Every ${X} from ${N(k)} (included) up to ${N(k + 1)} (left out) has greatest integer ${N(k)}: ${txt(k, true, k + 1, false)}.`] }, [
    { t: txt(k, true, k + 1, false), ok: true, say: 'Right: each step of the floor is filled on the left, open on the right.' },
    { t: txt(k - 1, false, k, true), mc: MC.floorRight, say: `At ${X} = ${N(k)} the floor is ${N(k)}, but just below ${N(k)} it is ${N(k - 1)}. The step starts AT ${N(k)}.` },
    { t: txt(k, false, k + 1, true), mc: MC.floorRight, say: `⌊${N(k)}⌋ = ${N(k)}, so ${N(k)} belongs in; ⌊${N(k + 1)}⌋ = ${N(k + 1)}, so ${N(k + 1)} doesn't.` },
    { t: `only ${X} = ${N(k)}`, say: `${N(k)}.5 also has greatest integer ${N(k)}: a whole interval works.` },
  ]);
};

// ===================== 15 intervals-from-graph =====================
const condFromGraph = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule3(R), j = pick(R, [0, 1, 1, 2]), p = ps[j]!;
  const sw: Piece = { ...p, loIn: p.lo !== undefined ? !p.loIn : undefined, hiIn: p.hi !== undefined ? !p.hiIn : undefined };
  const ya = p.lo !== undefined ? ev(p.fn, p.lo) : NaN, yb = p.hi !== undefined ? ev(p.fn, p.hi) : NaN;
  const yv: Piece = j === 1 ? { ...p, lo: Math.min(ya, yb), hi: Math.max(ya, yb), loIn: ya <= yb ? p.loIn : p.hiIn, hiIn: ya <= yb ? p.hiIn : p.loIn } : j === 0 ? { ...p, hi: yb } : { ...p, lo: ya };
  const strict: Piece = { ...p, loIn: p.lo !== undefined ? false : undefined, hiIn: p.hi !== undefined ? false : undefined };
  const opts: Opt[] = [
    { t: condStr(p), ok: true, say: 'Right: read the inputs (x) under the ends, and the dots tell you included or not.' },
    { t: condStr(sw), mc: MC.style, say: 'Swapped: a filled dot means the end is included (≤ or ≥), an open dot means it is not.' },
    { t: condStr(yv), mc: MC.yVals, say: `Those are the heights (y-values) of the ends. The condition is about the inputs: read the x-values.` },
    { t: condStr(strict), mc: MC.inclusion, say: 'A filled dot is included: it needs ≤ or ≥, not &lt; or &gt;.' },
  ];
  need(!near(ya, p.lo ?? NaN) && !near(yb, p.hi ?? NaN));
  // a smooth join at an end of this piece would let either condition fit (joinOwner teaches that): jumps only
  if (p.lo !== undefined) need(!near(ya, ev(ps[j - 1]!.fn, p.lo)));
  if (p.hi !== undefined) need(!near(yb, ev(ps[j + 1]!.fn, p.hi)));
  const uniq = opts.filter((o, i) => opts.findIndex(z => z.t === o.t) === i);
  need(uniq.length >= 3 && uniq[0]!.ok);
  return choiceItem(R, { id: `condFromGraph-${n}`, family: 'condFromGraph', prompt: `Which condition goes with the piece of ${F} that lies on <b>y = ${fnStr(p.fn)}</b>?`, board: `f(x) = ${fnStr(p.fn, true)}, \\quad \\square`,
    picture: { g: ruleGraph(ps, { show: true }) },
    solution: [`That piece runs over ${p.lo !== undefined ? `${X} = ${N(p.lo)} (${p.loIn ? 'filled' : 'open'})` : 'everything to the left'} to ${p.hi !== undefined ? `${X} = ${N(p.hi)} (${p.hiIn ? 'filled' : 'open'})` : 'everything to the right'}.`, `So: ${condStr(p)}.`] }, uniq);
});
const joinOwner = (R: () => number, n: number): PWItem => retry(() => {
  const cont = R() < 0.6;
  const ps = rule2(R, { jump: !cont });
  const a = ps[0]!.hi!, v = fAt(ps, a)!;
  const lOwn = ps[0]!.hiIn!;
  const opts: Opt[] = cont ? [
    { t: `Either piece may own ${X} = ${N(a)}: both rules give ${N(v)} there.`, ok: true, say: 'Right: the graph is the same either way, so either condition may include the point.' },
    { t: `Only the ${lOwn ? 'left' : 'right'} piece can own ${X} = ${N(a)}.`, mc: MC.uniqueOwner, say: `Both rules give ${N(v)} at ${N(a)}. Whichever piece owns it, the filled dot is the same point.` },
    { t: `Both conditions must include ${N(a)}, or the dot would be open.`, mc: MC.shared, say: `One condition that includes ${N(a)} is enough to fill the dot.` },
  ] : [
    { t: `Only the ${lOwn ? 'left' : 'right'} piece: its end at ${X} = ${N(a)} is the filled dot.`, ok: true, say: 'Right: the filled dot shows which piece includes the breakpoint.' },
    { t: `Either piece may own ${X} = ${N(a)}.`, mc: MC.looks, say: `Here the pieces end at different heights, so the choice changes ${fA(a)}. The filled dot decides.` },
    { t: `Only the ${lOwn ? 'right' : 'left'} piece: it is the one that continues.`, mc: MC.looks, say: `Its end at ${N(a)} is an open dot: left out. The filled dot belongs to the other piece.` },
  ];
  return choiceItem(R, { id: `joinOwner-${n}`, family: 'joinOwner', prompt: `The two pieces of ${F} end at ${X} = ${N(a)} as shown. Which piece may include ${X} = ${N(a)} in its condition?`, board: `f(x) = \\begin{cases} ${fnStr(ps[0]!.fn, true)}, & x\\ \\square\\ ${NT(a)} \\\\ ${fnStr(ps[1]!.fn, true)}, & x\\ \\square\\ ${NT(a)} \\end{cases}`,
    picture: { g: ruleGraph(ps, { show: true }) },
    solution: cont ? [`Both rules give ${N(v)} at ${X} = ${N(a)}: one filled point.`, `Either condition may include ${N(a)}; the graph is the same.`] : [`The pieces end at different heights at ${X} = ${N(a)}.`, `The filled dot is on the ${lOwn ? 'left' : 'right'} piece, so only it includes ${N(a)}.`] }, opts);
});

// ===================== 16 write-from-graph =====================
/** a two-piece graph whose pieces pass through lattice points; slopes with denominator 1, 2 or 3 */
function latticeRule(R: () => number, dens = [1, 2, 3]): { ps: Piece[]; pts: [[number, number], [number, number]] } {
  for (;;) {
    const a = int(R, -1, 3), d = pick(R, dens);
    const mL = pick(R, [-2, -1, 1, 2, 3]) / d, mR = pick(R, [-2, -1, 0, 1, 2]) / pick(R, [1, 2]);
    const yL = int(R, -2, 6), yR = R() < 0.4 ? yL : int(R, -2, 6);
    const fL = mk(mL, a, yL), fR = mk(mR, a, yR);
    const xl = a - 2 * d * (Math.abs(mL) < 1 ? 1 : 1), xr = a + (Number.isInteger(mR) ? 2 : 2);
    if (!Number.isInteger(ev(fL, xl)) || !Number.isInteger(ev(fR, xr))) continue;
    if (!Number.isInteger(clean(fL.k === "lin" ? fL.b : 0)) || !Number.isInteger(clean(fR.k === "lin" ? fR.b : 0))) continue;
    if (fnKey(fL) === fnKey(fR) || Math.abs(ev(fL, xl)) > 9 || Math.abs(ev(fR, xr)) > 9) continue;
    const own = R() < 0.5;
    return { ps: [{ fn: fL, hi: a, hiIn: own }, { fn: fR, lo: a, loIn: !own }], pts: [[xl, ev(fL, xl)], [xr, ev(fR, xr)]] };
  }
}
function fnHtmlFrac(f: Fn): string {
  if (f.k !== 'lin') return fnStr(f);
  const m = f.m, b = f.b;
  for (const d of [2, 3]) if (!Number.isInteger(m) && Number.isInteger(clean(m * d))) {
    const p = clean(m * d);
    return `${p < 0 ? '−' : ''}${fr(Math.abs(p), d)}${X}${b === 0 ? '' : b > 0 ? ` + ${N(b)}` : ` − ${N(-b)}`}`;
  }
  return fnStr(f);
}
const ruleTxt = (ps: Piece[]) => ps.map(p => `${fnHtmlFrac(p.fn)} if ${condStr(p)}`).join('; ');
const ruleFromGraph = (R: () => number, n: number): PWItem => retry(() => {
  const { ps, pts } = latticeRule(R);
  const a = ps[0]!.hi!;
  const sw: Piece[] = [{ ...ps[0]!, hiIn: !ps[0]!.hiIn }, { ...ps[1]!, loIn: !ps[1]!.loIn }];
  const gp: Piece[] = [{ ...ps[0]!, hiIn: false }, { ...ps[1]!, loIn: false }];
  // the slope across the corner: from the left point to the right point
  const ms = clean((pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]));
  const sec: Piece[] = [{ ...ps[0]!, fn: mk(ms, pts[0][0], pts[0][1]) }, ps[1]!];
  need(fnKey(sec[0]!.fn) !== fnKey(ps[0]!.fn) && Number.isInteger(clean(ms * 6)) && Number.isInteger(clean((sec[0]!.fn as { b: number }).b)));
  const cont = near(ev(ps[0]!.fn, a), ev(ps[1]!.fn, a));
  const opts: Opt[] = [
    { t: ruleTxt(ps), ok: true, say: 'Right: each line from two of its points, each condition from its dots.' },
    { t: ruleTxt(sec), mc: MC.secant, say: `That slope runs across the corner from one piece to the other. Use two points on the left piece only.` },
    { t: ruleTxt(gp), mc: MC.gap, say: `With &lt; and &gt;, ${N(a)} gets no output, but the graph has a filled dot there.` },
  ];
  if (!cont) opts.push({ t: ruleTxt(sw), mc: MC.style, say: 'The filled dot belongs to the piece whose condition includes the breakpoint: these are swapped.' });
  const g = ruleGraph(ps, { show: true, xs: pts.map(p => p[0]), extra: pts.map(([x, y], i): GPart => ({ kind: 'point', key: `q${i}`, x, y, col: 'first' })) });
  return choiceItem(R, { id: `ruleFromGraph-${n}`, family: 'ruleFromGraph', prompt: `Which rule matches the graph? (The amber points are on the lines.)`, board: `f(x) = \\,?`,
    picture: { g }, solution: [`Left piece: slope from two of its own points, then its equation; right piece the same way.`, `Conditions: the filled dot at ${X} = ${N(a)} decides which piece gets ≤ or ≥.`] }, opts);
});
const pieceLine = (R: () => number, n: number): PWItem => retry(() => {
  const { ps, pts } = latticeRule(R, [1, 2]);
  const left = R() < 0.5, p = left ? ps[0]! : ps[1]!;
  const f = p.fn as { k: 'lin'; m: number; b: number };
  const a = ps[0]!.hi!;
  const q = left ? pts[0] : pts[1];
  const e: [number, number] = [a, ev(f, a)];
  const ms = clean((pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0]));
  need(!near(ms, f.m));
  const g = ruleGraph(ps, { show: true, xs: pts.map(z => z[0]), extra: [q, e].map(([x, y], i): GPart => ({ kind: 'point', key: `q${i}`, x, y, col: 'first', open: i === 1 && (left ? !ps[0]!.hiIn : !ps[1]!.loIn) })) });
  return pairItem({ id: `pieceLine-${n}`, family: 'pieceLine', prompt: `The ${left ? 'left' : 'right'} piece of ${F} lies on a line <i>y</i> = <i>m</i>${X} + <i>b</i>. It passes through the amber points ${pt(q[0], q[1])} and ${pt(e[0], e[1])}. Find <i>m</i> and <i>b</i>.`, board: 'y = mx + b',
    pairLead: '<i>m</i> =', pairOp: ',&nbsp; <i>b</i> =', picture: { g },
    solution: [`Slope from the two points on this piece: (${N(e[1])} − ${P(q[1])}) ÷ (${N(e[0])} − ${P(q[0])}) = ${ans(N(f.m))}`, `Then ${N(q[1])} = ${P(f.m)}(${N(q[0])}) + <i>b</i>, so <i>b</i> = ${ans(N(f.b))}`] }, f.m, f.b,
    (x, y) => near(x, f.m) && near(y, f.b) ? { ok: true, say: 'Right.' } : near(x, ms) ? { ok: false, mc: MC.secant, say: 'That slope runs across both pieces. Use the two points on this piece only.' }
      : near(x, f.m) ? { ok: false, say: `The slope is right. Put ${pt(q[0], q[1])} into y = ${N(f.m)}x + b to find b.` } : { ok: false, say: 'Slope = rise ÷ run between the two amber points, then solve for b.' });
});

// ===================== 17 context-model =====================
interface Tier { what: string; v: string; u: string; base: number; a: number; rate: number; xs: number[]; unit: string; /** per-unit lower tier (else a flat amount) */ lower?: number; /** 'cost' or 'pay' */ out: string; F: string }
/** a tiered price: a flat amount (or a first-tier rate) up to a threshold, a higher rate above it */
function tierOf(R: () => number): Tier {
  for (;;) {
    const T = tierOne(R);
    // a flat lower tier equal to rate × threshold would make rate × amount the same rule: avoid it
    if (T.lower === undefined && near(T.base, T.rate * T.a)) continue;
    return T;
  }
}
function tierOne(R: () => number): Tier {
  const k = int(R, 0, 3);
  if (k === 0) {
    const base = pick(R, [25, 30, 35, 40, 45]), a = pick(R, [3, 5, 8, 10]), rate = pick(R, [5, 6, 8, 10]);
    return { what: `A phone plan costs ${$(base)} a month and includes ${a} GB of data; each GB over ${a} GB costs ${$(rate)} more.`, v: 'g', u: 'GB', base, a, rate, xs: [a + 1, a + 2, a + 3, a + 4], unit: 'dollars', out: 'cost', F: 'C' };
  }
  if (k === 1) {
    const r1 = pick(R, [0.1, 0.12, 0.14]), r2 = clean(r1 + pick(R, [0.03, 0.04, 0.05])), a = pick(R, [400, 500, 600]);
    return { what: `Electricity costs ${$(r1)} per kWh for the first ${a} kWh in a month and ${$(r2)} per kWh above ${a} kWh.`, v: 'k', u: 'kWh', base: clean(r1 * a), a, rate: r2, xs: [a + 100, a + 200, a + 300], unit: 'dollars', lower: r1, out: 'cost', F: 'C' };
  }
  if (k === 2) {
    const w = pick(R, [14, 16, 18, 20, 22]), nm = pick(R, ['Sam', 'Ana', 'Jordan', 'Priya']);
    return { what: `${nm} earns ${$(w)} an hour for the first 40 hours of a week and ${$(w * 1.5)} an hour for every hour over 40.`, v: 'h', u: 'hours', base: w * 40, a: 40, rate: w * 1.5, xs: [42, 44, 45, 46, 48], unit: 'dollars', lower: w, out: 'pay', F: 'P' };
  }
  const base = pick(R, [30, 40, 50]), a = pick(R, [50, 100]), rate = pick(R, [0.6, 0.75, 0.8]);
  return { what: `A moving van rents for ${$(base)} a day including ${a} miles; each mile over ${a} costs ${$(rate)}.`, v: 'm', u: 'miles', base, a, rate, xs: [a + 20, a + 40, a + 60], out: 'cost', F: 'C', unit: 'dollars' };
}
const POST = [
  { what: 'A courier charges $1.20 for the first ounce and $0.30 for each additional ounce or part of an ounce.', first: 1.2, add: 0.3 },
  { what: 'A letter costs $0.78 for the first ounce and $0.29 for each additional ounce or part of an ounce.', first: 0.78, add: 0.29 },
];
const tierCost = (R: () => number, n: number): PWItem => {
  if (R() < 0.3) {
    const P = pick(R, POST), w = pick(R, [1.5, 2.3, 2.8, 3, 3.4, 2, 1.2]);
    const extra = Math.ceil(w - 1 - 1e-9), cost = clean(P.first + P.add * extra), again = clean(P.first + P.add * Math.ceil(w - 1e-9)), flat = clean(P.add * Math.ceil(w - 1e-9));
    return numItem({ id: `tierCost-${n}`, family: 'tierCost', prompt: `${P.what} What does a ${N(w)} oz envelope cost?`, unit: 'dollars', board: `C(w) = ${$T(P.first)} + ${$T(P.add)} \\times (\\text{extra ounces started})`,
      solution: [`The first ounce is ${$(P.first)}. After it, ${N(clean(w - 1))} oz more starts ${extra} additional ${extra === 1 ? 'ounce' : 'ounces'}.`, `${$(P.first)} + ${extra} × ${$(P.add)} = ${ans($(cost))}`] }, cost,
      y => near(y, cost) ? { ok: true, say: 'Right.' } : near(y, again) ? { ok: false, mc: MC.againInit, say: `The first ounce is already in the ${$(P.first)}. Charge the additional rate only for the ounces after it.` }
        : near(y, flat) ? { ok: false, mc: MC.tierWhole, say: `The first ounce costs ${$(P.first)}, not ${$(P.add)}.` } : { ok: false, say: 'First ounce, then count the additional ounces started (round up).' });
  }
  const T = tierOf(R), x = pick(R, T.xs);
  const cost = clean(T.base + T.rate * (x - T.a)), whole = clean(T.rate * x), again = clean(T.base + T.rate * x);
  return numItem({ id: `tierCost-${n}`, family: 'tierCost', prompt: `${T.what} What is the ${T.out} for ${N(x)} ${T.u}?`, unit: T.unit, board: `${T.v} = ${NT(x)}`,
    picture: { g: { ...tierPic(T, true, x), } },
    solution: [`The first ${T.a} ${T.u} ${T.out === 'pay' ? 'pay' : 'cost'} ${T.lower !== undefined ? `${$(T.lower)} × ${T.a} = ` : ''}${$(T.base)} in all.`, `Only the ${N(x - T.a)} ${T.u} above ${T.a} get the higher rate: ${$(T.base)} + ${$(T.rate)} × ${N(x - T.a)} = ${ans($(cost))}`] }, cost,
    y => near(y, cost) ? { ok: true, say: 'Right: the higher rate only on the part above the threshold.' }
      : near(y, whole) ? { ok: false, mc: MC.tierWhole, say: `The ${$(T.rate)} rate only applies above ${T.a} ${T.u}. The first ${T.a} cost ${$(T.base)}.` }
        : near(y, again) ? { ok: false, mc: MC.againInit, say: `The first ${T.a} ${T.u} are already in the ${$(T.base)}. Charge ${$(T.rate)} only for the ${N(x - T.a)} above.` }
          : { ok: false, say: `${$(T.base)} for the first ${T.a}, plus ${$(T.rate)} for each ${T.u.replace(/s$/, '')} above ${T.a}.` });
};
function tierPic(T: Tier, reveal: boolean, x?: number): GPic {
  const ps: Piece[] = [{ fn: T.lower !== undefined ? lin(T.lower, 0) : cst(T.base), lo: 0, hi: T.a, loIn: true, hiIn: true }, { fn: lin(T.rate, clean(T.base - T.rate * T.a)), lo: T.a, loIn: false, hi: Math.max(...T.xs), hiIn: true }];
  const xa = axisOver([0, Math.max(...T.xs)], { cells: 10, name: T.u }), ya = axisOver([0, ev(ps[1]!.fn, Math.max(...T.xs))], { cells: 10, name: `${T.out} ($)` });
  const parts = pieceParts(ps, 'p', { arrows: false });
  return { x: xa, y: ya, money: 'y', parts: reveal ? [] : parts, reveal: { parts: reveal ? parts : [], ...(x !== undefined ? { trace: { key: 'p1', x } } : {}) } };
}
const tierRule = (R: () => number, n: number): PWItem => {
  const T = tierOf(R), v = `<i>${T.v}</i>`;
  const r = $(T.rate), b = $(T.base);
  return choiceItem(R, { id: `tierRule-${n}`, family: 'tierRule', prompt: `${T.what} Which rule gives the ${T.out} above ${T.a} ${T.u}?`, board: `${T.F}(${T.v}) = ${T.lower !== undefined ? `${NT(T.lower)}${T.v}` : $T(T.base)}, \\quad 0 \\le ${T.v} \\le ${T.a}`,
    picture: { g: tierPic(T, true) },
    solution: [`Above ${T.a}, the first ${T.a} ${T.u} give ${T.lower !== undefined ? `${$(T.lower)} × ${T.a} = ` : ''}${b}; add ${r} for each ${T.u.replace(/s$/, '')} over ${T.a}.`, `Over ${T.a} means ${v} − ${T.a} of them, and the piece holds for ${v} &gt; ${T.a}.`] }, [
    { t: `${b} + ${r}(${v} − ${T.a}) for ${v} &gt; ${T.a}`, ok: true, say: 'Right: the higher rate only on the amount above the threshold.' },
    { t: `${r}${v} for ${v} &gt; ${T.a}`, mc: MC.tierWhole, say: `That charges the higher rate on every ${T.u.replace(/s$/, '')}, and drops the ${b} for the first ${T.a}.` },
    { t: `${b} + ${r}${v} for ${v} &gt; ${T.a}`, mc: MC.againInit, say: `The first ${T.a} ${T.u} are already paid in the ${b}. Use ${v} − ${T.a}.` },
    { t: `${b} + ${r}(${v} − ${T.a}) for ${v} &lt; ${T.a}`, mc: MC.reversed, say: `"Over ${T.a}" means ${v} &gt; ${T.a}.` },
  ]);
};

// ===================== 18 count-domain =====================
const DOMS = [
  { what: (k: number) => `Concert tickets cost $${20 + k * 5} each, and one person may buy up to ${k}.`, kind: 'count', v: 'n', noun: 'number of tickets', max: [4, 6, 8], top: (k: number) => k },
  { what: (k: number) => `A food truck sells tacos for $3 each and has ${k * 10} tacos to sell.`, kind: 'count', v: 't', noun: 'number of tacos', max: [4, 5], top: (k: number) => k * 10 },
  { what: (k: number) => `Gas costs $3.80 a gallon, and your tank holds ${k * 2} gallons.`, kind: 'cont', v: 'g', noun: 'gallons pumped', max: [6, 7, 8], top: (k: number) => k * 2 },
  { what: (k: number) => `A parking meter runs for up to ${k} hours, and you pay for the exact time you use.`, kind: 'cont', v: 't', noun: 'time parked, in hours', max: [3, 4], top: (k: number) => k },
  { what: (k: number) => `A deli sells sliced turkey by weight, up to ${k} lb per order.`, kind: 'cont', v: 'w', noun: 'weight, in lb', max: [2, 3, 5], top: (k: number) => k },
  { what: (k: number) => `You pay part of a bill of $${k * 10} with a gift card; payments are made in whole cents.`, kind: 'cent', v: 'p', noun: 'amount paid, in dollars', max: [5, 10], top: (k: number) => k * 10 },
];
const domainKind = (R: () => number, n: number): PWItem => {
  const D = pick(R, DOMS), k = pick(R, D.max), v = `<i>${D.v}</i>`;
  const top = D.top(k), what = D.what(k);
  const wholes = top <= 4 ? Array.from({ length: top }, (_, i) => i + 1).join(', ') : `1, 2, 3, …, ${top}`;
  const eg = top >= 3 ? '2.5' : '1.5';
  const opts: Opt[] = [
    { t: `the whole numbers ${wholes}`, ok: D.kind === 'count', mc: D.kind === 'cont' ? MC.wholeOnly : undefined, say: D.kind === 'count' ? `Right: you can't buy part of one.` : D.kind === 'cent' ? `Cents can be paid too: $1.25 is fine, so not only whole dollars.` : `${D.noun} can be 2.5 or 1.75 too: a measurement, not a count.` },
    { t: `every number from 0 to ${top}, like ${eg}`, ok: D.kind === 'cont', mc: D.kind === 'count' ? MC.fracCount : D.kind === 'cent' ? MC.cents : undefined, say: D.kind === 'cont' ? 'Right: a measured amount can take any value in that interval.' : D.kind === 'cent' ? `Payments are in whole cents: $2.505 is not possible. Only multiples of $0.01.` : `You can't have 2.5 of them: a count takes whole numbers only.` },
    { t: `the multiples of 0.01 from 0 to ${top}`, ok: D.kind === 'cent', say: D.kind === 'cent' ? 'Right: whole cents, from $0.00 to the top.' : D.kind === 'count' ? 'You count whole items, not hundredths of one.' : 'A measured amount is not limited to hundredths.' },
  ];
  return choiceItem(R, { id: `domainKind-${n}`, family: 'domainKind', prompt: `${what} Which inputs ${v} (${D.noun}) make sense?`, board: `${D.v} = \\,?`,
    solution: [D.kind === 'count' ? 'Items are counted: whole numbers only.' : D.kind === 'cent' ? 'Money paid in whole cents: steps of $0.01.' : 'A measured amount: every value in the interval.', D.kind === 'count' ? 'On the graph: separate dots, not a line.' : D.kind === 'cent' ? 'On the graph: dots so close they look like a line; the rule says cents.' : 'On the graph: a solid segment.'] }, opts);
};
const countGraph = (R: () => number, n: number): PWItem => {
  const count = R() < 0.55;
  const price = count ? pick(R, [3, 4, 5, 6]) : pick(R, [2, 3, 4]), k = pick(R, [5, 6, 8]);
  const xa = axisOver([0, k], { cells: 10, name: count ? 'items' : 'pounds' }), ya = axisOver([0, price * k], { cells: 10, name: 'cost ($)' });
  const dots: GPic = { x: xa, y: ya, money: 'y', parts: Array.from({ length: k }, (_, i): GPart => ({ kind: 'point', key: `d${i}`, x: i + 1, y: price * (i + 1), col: 'link' })) };
  const seg: GPic = { x: xa, y: ya, money: 'y', parts: [{ kind: 'piece', key: 's', fn: lin(price, 0), lo: 0, hi: k, ends: ['closed', 'closed'], col: 'link' }] };
  const stair: GPic = { x: xa, y: ya, money: 'y', parts: Array.from({ length: k }, (_, i): GPart => ({ kind: 'piece', key: `t${i}`, fn: cst(price * (i + 1)), lo: i, hi: i + 1, ends: ['open', 'closed'], col: 'link' })) };
  const what = count ? `Muffins cost $${price} each; a box holds up to ${k}. The cost depends on the number of muffins.` : `Grapes cost $${price} a pound; you buy up to ${k} lb. The cost depends on the weight.`;
  return graphChoice(R, { id: `countGraph-${n}`, family: 'countGraph', prompt: `${what} Which graph fits?`, board: count ? `n = 1, 2, \\ldots, ${k}` : `0 \\le w \\le ${k}`,
    solution: [count ? 'You buy whole muffins: the inputs are 1, 2, 3, …' : 'Weight is measured: any amount from 0 to the top.', count ? 'So the graph is separate dots.' : 'So the graph is a solid segment.'] }, [
    { t: '', ok: count, mc: count ? undefined : MC.wholeOnly, say: count ? 'Right: one dot per whole number of muffins.' : 'You can buy 2.5 lb: the points in between belong too.', pic: dots },
    { t: '', ok: !count, mc: count ? MC.fracCount : undefined, say: count ? 'The segment includes 2.5 muffins. Only whole numbers make sense.' : 'Right: every weight in between.', pic: seg },
    { t: '', say: count ? 'That is a per-started-unit staircase; the price here is per muffin, and 2.5 muffins is not a thing.' : 'The price is per pound, not per started pound: 2.5 lb costs 2.5 times the price.', pic: stair },
  ]);
};

// ===================== 19 coverage-audit =====================
const findGap = (R: () => number, n: number): PWItem => retry(() => {
  const mode = pick(R, ['point', 'interval', 'excluded', 'full']);
  let ps: Piece[], dom = 'all real numbers', domT = '\\text{all } x';
  if (mode === 'interval') {
    const a = int(R, -3, 1), b = a + int(R, 2, 3);
    const base = rule2(R, { a });
    ps = [{ ...base[0]!, hi: a, hiIn: false }, { ...base[1]!, fn: mk((base[1]!.fn as { m: number }).m, b, ev(base[1]!.fn, a)), lo: b, loIn: true }];
  } else {
    ps = rule2(R, { owner: mode === 'full' ? undefined : 'none', jump: R() < 0.7 });
  }
  const a = ps[0]!.hi!;
  if (mode === 'excluded') { dom = `all real numbers except ${N(a)}`; domT = `x \\ne ${NT(a)}`; }
  const b = ps[1]!.lo!;
  const jump = !near(ev(ps[0]!.fn, a), ev(ps[1]!.fn, b)) || a !== b;
  const opts: Opt[] = [
    { t: `No: ${X} = ${N(a)} gets no output`, ok: mode === 'point', mc: mode === 'point' ? undefined : MC.gap, say: mode === 'point' ? `Right: ${condStr(ps[0]!)} and ${condStr(ps[1]!)} both leave ${N(a)} out.` : mode === 'excluded' ? `${N(a)} is not in the declared domain, so nothing is missing.` : `${N(a)} meets ${condStr(owners(ps, a).length ? ps[owners(ps, a)[0]!]! : ps[0]!)}.` },
    { t: `No: every ${X} with ${N(a)} ≤ ${X} &lt; ${N(b)} gets no output`, ok: mode === 'interval', say: mode === 'interval' ? 'Right: a whole stretch between the pieces is missing.' : `There is no stretch between the conditions.` },
    { t: `Yes: every ${X} in the domain meets one condition`, ok: mode === 'excluded' || mode === 'full', mc: mode === 'point' ? MC.gap : undefined, say: mode === 'excluded' || mode === 'full' ? 'Right: test the breakpoint, then each stretch: all covered.' : mode === 'point' ? `Test ${N(a)} itself: &lt; leaves it out and &gt; leaves it out.` : `The inputs from ${N(a)} up to ${N(b)} meet neither condition.` },
    { t: `No: the graph jumps, so ${F} is not a function`, mc: MC.connected, say: `Coverage is about inputs. A jump is allowed; check whether each input meets a condition.` },
  ];
  if (mode === 'interval' && a === b) throw new Retry('x');
  if (!jump) opts.pop();
  if (mode !== 'interval') opts.splice(1, 1);
  return choiceItem(R, { id: `findGap-${n}`, family: 'findGap', prompt: `The domain of ${F} is ${dom}. Do the pieces cover the whole domain?`, board: `${tagged('f', ps)} \\qquad \\text{domain: } ${domT}`,
    picture: { g: ruleGraph(ps, { show: false }) },
    solution: [`Test each breakpoint and the stretches between them against the conditions.`, mode === 'point' ? `${N(a)} meets neither ${condStr(ps[0]!)} nor ${condStr(ps[1]!)}.` : mode === 'interval' ? `Nothing covers ${N(a)} ≤ ${X} &lt; ${N(b)}.` : mode === 'excluded' ? `${N(a)} is outside the domain; every other input meets one condition.` : `Every input meets one condition.`] }, opts);
});
const gapFix = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule2(R, { owner: 'none', jump: true });
  const a = ps[0]!.hi!, left = R() < 0.5;
  const fixed = left ? `Change ${X} &lt; ${N(a)} to ${X} ≤ ${N(a)}` : `Change ${X} &gt; ${N(a)} to ${X} ≥ ${N(a)}`;
  return choiceItem(R, { id: `gapFix-${n}`, family: 'gapFix', prompt: `${F} should be defined for every real number. Which change covers ${X} = ${N(a)} and still gives one output per input?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true }) },
    solution: [`Right now ${N(a)} meets neither condition.`, `Let exactly one condition include ${N(a)}: ${fixed.toLowerCase()}.`] }, [
    { t: fixed, ok: true, say: `Right: now ${N(a)} meets exactly one condition.` },
    { t: `Change both: ${X} ≤ ${N(a)} and ${X} ≥ ${N(a)}`, say: `Then ${N(a)} gets ${N(ev(ps[0]!.fn, a))} and ${N(ev(ps[1]!.fn, a))}: two outputs.` },
    { t: `Nothing: ${N(a)} is a breakpoint, so it needs no output`, mc: MC.gap, say: `The domain is every real number, and ${N(a)} is one of them. It needs an output.` },
  ]);
});

// ===================== 20 overlap-audit =====================
const overlapOk = (R: () => number, n: number): PWItem => retry(() => {
  const agree = R() < 0.5;
  const ps = rule2(R, { owner: 'both', jump: !agree });
  const a = ps[0]!.hi!, yL = ev(ps[0]!.fn, a), yR = ev(ps[1]!.fn, a);
  return choiceItem(R, { id: `overlapOk-${n}`, family: 'overlapOk', prompt: `Both conditions include ${X} = ${N(a)}. Is ${F} a function?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: false, revealExtra: [{ kind: 'vline', key: 'vx', x: a, col: 'pick' }] }) },
    solution: [`At ${X} = ${N(a)}: ${fnStr(ps[0]!.fn)} gives ${N(yL)}, ${fnStr(ps[1]!.fn)} gives ${N(yR)}.`, agree ? `The same output both ways: one output, so it is a function.` : `Two different outputs for one input: not a function.`] }, ([
    { t: `Yes: at ${X} = ${N(a)} both rules give ${N(yL)}`, ok: agree, say: agree ? 'Right: an overlap is fine when the rules agree there.' : `Work out both: ${N(yL)} and ${N(yR)}. They differ.` },
    { t: `No: at ${X} = ${N(a)} the rules give ${N(yL)} and ${N(yR)}`, ok: !agree, say: !agree ? 'Right: one input with two outputs.' : `Work out both: they are both ${N(yL)}.` },
    { t: `No: an input may never meet two conditions, even when the rules agree`, mc: MC.repeated, say: `Agreeing rules give the same pair twice: still one output. Only different outputs break a function.` },
  ] as Opt[]).filter((o, i) => !(i === 1 && agree)).concat(agree ? [{ t: `No: at ${X} = ${N(a)} the rules give ${N(yL)} and ${N(yL + 1)}`, say: `Work out both: they are both ${N(yL)}.` }] : []));
});
const overlapInput = (R: () => number, n: number): PWItem => retry(() => {
  const a = int(R, -2, 2), b = a + int(R, 2, 3);
  const m1 = pick(R, [1, 2, -1]), m2 = pick(R, [0, -1, 1, 3].filter(z => z !== m1));
  const p = int(R, a, b), yp = int(R, 0, 5);
  const f1 = mk(m1, p, yp), f2 = mk(m2, p, yp);
  const ps: Piece[] = [{ fn: f1, hi: b, hiIn: true }, { fn: f2, lo: a, loIn: true }];
  const inOver = [a, b, clean((a + b) / 2), clean(a + 0.5)].filter(x => x !== p && x >= a && x <= b);
  const right = pick(R, inOver);
  const outL = a - int(R, 1, 2), outR = b + int(R, 1, 2);
  const cands = [right, outL, outR, ...(p >= a && p <= b ? [p] : [])];
  need(new Set(cands).size === cands.length);
  return choiceItem(R, { id: `overlapInput-${n}`, family: 'overlapInput', prompt: `The conditions of ${F} overlap. Which input gets two different outputs?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: false, xs: cands }) },
    solution: [`Two outputs can only happen where both conditions hold: ${N(a)} ≤ ${X} ≤ ${N(b)}.`, `At ${X} = ${N(right)}: ${N(ev(f1, right))} and ${N(ev(f2, right))}, different. So ${X} = ${N(right)}.`] },
    cands.map(x => ({ t: `${X} = ${N(x)}`, ok: x === right, mc: x === p ? MC.repeated : undefined,
      say: x === right ? 'Right: both conditions hold, and the rules disagree.' : x === p ? `Both rules give ${N(yp)} at ${N(p)}: the same output twice is still one output.` : `Only one condition holds at ${N(x)}: one output.` })));
});

// ===================== 21 repair-endpoint-errors =====================
const findError = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule2(R, { jump: true });
  const a = ps[0]!.hi!, lOwn = ps[0]!.hiIn!;
  const yL = ev(ps[0]!.fn, a), yR = ev(ps[1]!.fn, a), yc = lOwn ? yL : yR;
  const err = pick(R, ['marker', 'value', 'missing', 'connector']);
  const w = windowFor(ps, []);
  let parts = pieceParts(ps);
  const j = int(R, 0, 1);
  if (err === 'marker') parts = parts.map(P => (P.kind === 'piece' ? { ...P, ends: P.ends!.map(e => (e === 'open' ? 'closed' : e === 'closed' ? 'open' : e)) as typeof P.ends } : P));
  if (err === 'value') { const P = parts[j] as Extract<GPart, { kind: 'piece' }>; parts[j] = { ...P, fn: { ...(P.fn as { k: 'lin'; m: number; b: number }), b: (P.fn as { b: number }).b + pick(R, [2, -2]) } }; }
  if (err === 'missing') parts = parts.map(P => (P.kind === 'piece' ? { ...P, ends: P.ends!.map(e => (e === 'closed' ? 'none' : e)) as typeof P.ends } : P));
  if (err === 'connector') parts.push({ kind: 'seg', key: 'c', a: [a, yL], b: [a, yR], col: 'link' });
  const g: GPic = { ...w, parts, reveal: { parts: [] } };
  need(fits(g));
  // the "value" error must not land on the other piece (it would look like a different rule)
  if (err === 'value') { const P = parts[j] as Extract<GPart, { kind: 'piece' }>; need(!near(ev(P.fn, a), j === 0 ? yR : yL)); }
  const pj = ps[j]!;
  const opts: Opt[] = [
    { t: `The dots at ${X} = ${N(a)} are swapped`, ok: err === 'marker', say: err === 'marker' ? `Right: ${condStr(lOwn ? ps[0]! : ps[1]!)} includes ${N(a)}, so that end should be filled.` : 'Check the dots against the conditions: they match.' },
    { t: `The piece for ${condStr(pj)} is drawn at the wrong height`, ok: err === 'value', say: err === 'value' ? `Right: put a value into ${fnStr(pj.fn)} and compare.` : `Put a value into ${fnStr(pj.fn)}: the drawn piece matches.` },
    { t: `The filled dot at ${pt(a, yc)} is missing`, ok: err === 'missing', say: err === 'missing' ? `Right: ${N(a)} has an output, ${N(yc)}, so the graph needs that filled dot.` : `The filled dot at ${pt(a, yc)} is there.` },
    { t: `The vertical segment at ${X} = ${N(a)} should not be there`, ok: err === 'connector', say: err === 'connector' ? 'Right: it would give one input many outputs.' : 'There is no vertical segment here.' },
    { t: 'Nothing is wrong', mc: err === 'marker' ? MC.looks : undefined, say: err === 'marker' ? `Check which condition includes ${N(a)}: the dots say the opposite.` : 'Compare the graph with the rule piece by piece: one thing does not match.' },
  ];
  return choiceItem(R, { id: `findError-${n}`, family: 'findError', prompt: `This graph of ${F} has exactly one mistake. What is it?`, board: tagged('f', ps),
    picture: { g }, solution: [`Check each piece's height, then each end: filled if its condition includes the end, open if not.`, `The mistake: ${({ marker: 'the dots are swapped', value: 'one piece is at the wrong height', missing: 'the filled dot is missing', connector: 'a vertical segment joins the jump' } as Record<string, string>)[err]}.`] }, opts);
});
const fixDot = (R: () => number, n: number): PWItem => retry(() => {
  const ps = rule2(R, { jump: true });
  const a = ps[0]!.hi!, lOwn = ps[0]!.hiIn!;
  const yL = ev(ps[0]!.fn, a), yR = ev(ps[1]!.fn, a);
  const [yc, yo] = lOwn ? [yL, yR] : [yR, yL];
  const bad = pick(R, ['swap', 'both']);
  const w = windowFor(ps, []);
  const parts = pieceParts(ps).map(P => (P.kind === 'piece' ? { ...P, ends: P.ends!.map(e => (bad === 'both' ? (e === 'open' ? 'closed' : e) : e === 'open' ? 'closed' : e === 'closed' ? 'open' : e)) as typeof P.ends } : P));
  return choiceItem(R, { id: `fixDot-${n}`, family: 'fixDot', prompt: `The dots of this graph at ${X} = ${N(a)} don't match the rule for ${F}. Which fix is right?`, board: tagged('f', ps),
    picture: { g: { ...w, parts, reveal: { parts: [{ kind: 'point', key: 'fc', x: a, y: yc, col: 'pick' }, { kind: 'point', key: 'fo', x: a, y: yo, open: true, col: 'pick' }] } } },
    solution: [`${condStr(lOwn ? ps[0]! : ps[1]!)} includes ${N(a)}: filled at ${pt(a, yc)}.`, `The other condition leaves ${N(a)} out: open at ${pt(a, yo)}.`] }, [
    { t: `Filled at ${pt(a, yc)}, open at ${pt(a, yo)}`, ok: true, say: 'Right: each marker justified by its condition.' },
    { t: `Filled at both ${pt(a, yc)} and ${pt(a, yo)}`, mc: MC.fill, say: `Two filled dots give ${N(a)} two outputs. Only the including condition gets the filled dot.` },
    { t: `Open at both`, mc: MC.undefBreak, say: `${condStr(lOwn ? ps[0]! : ps[1]!)} includes ${N(a)}, so ${fA(a)} = ${N(yc)}: filled.` },
    { t: `Join the two dots with a vertical segment`, mc: MC.connects, say: 'A vertical segment would give one input many outputs.' },
  ]);
});

// ===================== 22 threshold-decision-context =====================
interface Jump { what: string; v: string; at: number; lo: number; hi: number; own: 'L' | 'R'; out: string; ins: number[]; unitIn?: string }
function jumpOf(R: () => number): Jump {
  const k = int(R, 0, 3);
  if (k === 0) {
    const fee = pick(R, [5.99, 6.99, 7.99, 8.99]), at = pick(R, [35, 50, 75]);
    return { what: `An online store charges ${$(fee)} shipping on orders under ${$(at)}, and shipping is free on orders of ${$(at)} or more.`, v: 'x', at, lo: fee, hi: 0, own: 'R', out: 'shipping', ins: [clean(at - 0.01), at, clean(at + 0.01), at - 10] };
  }
  if (k === 1) {
    const fee = pick(R, [75, 100, 125]), at = pick(R, [50, 40]);
    return { what: `An airline charges no fee for a checked bag up to and including ${at} lb, and a ${$(fee)} fee for a bag over ${at} lb.`, v: 'w', at, lo: 0, hi: fee, own: 'L', out: 'fee', ins: [at, clean(at + 0.4), clean(at - 0.4), at + 1], unitIn: 'lb' };
  }
  if (k === 2) {
    const a = pick(R, [10, 12, 15]), b = a + pick(R, [6, 8, 10]), at = pick(R, [2, 3]);
    return { what: `A garage charges ${$(a)} for parking up to and including ${at} hours, and ${$(b)} for more than ${at} hours (up to 8).`, v: 't', at, lo: a, hi: b, own: 'L', out: 'cost', ins: [at, clean(at + 0.2), clean(at - 0.1), at + 1], unitIn: 'hours' };
  }
  const a = pick(R, [8, 9, 10]), b = a + pick(R, [5, 6, 7]), at = pick(R, [12, 13]);
  return { what: `A museum ticket costs ${$(a)} for visitors under ${at} and ${$(b)} for visitors ${at} or older.`, v: 'a', at, lo: a, hi: b, own: 'R', out: 'ticket price', ins: [at, at - 1, at + 1], unitIn: 'years old' };
}
const jumpMeaning = (R: () => number, n: number): PWItem => {
  const J = jumpOf(R), d = clean(J.hi - J.lo), up = d > 0;
  const atTxt = J.own === 'L' ? `just past ${J.at}` : `at ${J.at}`;
  return choiceItem(R, { id: `jumpMeaning-${n}`, family: 'jumpMeaning', prompt: `${J.what} What happens to the ${J.out} at the threshold?`, board: `${J.v} = ${J.at}`,
    solution: [`Below the threshold: ${$(J.lo)}; ${J.own === 'L' ? 'over' : 'from'} ${J.at} on: ${$(J.hi)}.`, `The ${J.out} jumps ${up ? 'up' : 'down'} by ${$(Math.abs(d))}, ${atTxt}.`] }, [
    { t: `It jumps ${up ? 'up' : 'down'} by ${$(Math.abs(d))} (from ${$(J.lo)} to ${$(J.hi)}), ${atTxt}`, ok: true, say: 'Right: a jump has a size, a direction, a unit and a place.' },
    { t: `It jumps at ${J.at}, but the prices don't tell you by how much`, mc: MC.noSize, say: `They do: from ${$(J.lo)} to ${$(J.hi)} is a jump ${up ? 'up' : 'down'} of ${$(Math.abs(d))}. Say the size and the direction.` },
    { t: `It jumps ${up ? 'down' : 'up'} by ${$(Math.abs(d))}, ${atTxt}`, say: `It goes from ${$(J.lo)} to ${$(J.hi)}: ${up ? 'up' : 'down'}.` },
    { t: `${J.at} is left out of the domain; the ${J.out} is the same on both sides`, say: `Every amount has a ${J.out}: ${$(J.lo)} on one side and ${$(J.hi)} on the other.` },
  ]);
};
const atThreshold = (R: () => number, n: number): PWItem => {
  const J = jumpOf(R), x = pick(R, J.ins);
  const owner = x < J.at || (x === J.at && J.own === 'L') ? 'L' : 'R';
  const v = owner === 'L' ? J.lo : J.hi, other = owner === 'L' ? J.hi : J.lo;
  const rounded = Math.round(x), rv = rounded < J.at || (rounded === J.at && J.own === 'L') ? J.lo : J.hi;
  const xt = J.v === 'x' ? $(x) : `${N(x)} ${J.unitIn}`;
  return numItem({ id: `atThreshold-${n}`, family: 'atThreshold', prompt: `${J.what} What is the ${J.out} for ${J.v === 'x' ? `an order of ${xt}` : J.v === 'w' ? `a bag that weighs ${xt}` : J.v === 't' ? `parking for ${xt}` : `a visitor who is ${xt}`}?`, unit: 'dollars', board: `${J.v} = ${NT(x)}`,
    solution: [`${J.own === 'L' ? `"Up to and including ${J.at}" keeps ${J.at} in the lower tier` : `"${J.at} or more" puts ${J.at} in the upper tier`}.`, `${xt} is in the ${owner === 'L' ? 'lower' : 'upper'} tier: ${ans($(v))}`] }, v,
    y => near(y, v) ? { ok: true, say: 'Right.' }
      : near(y, other) && x === J.at ? { ok: false, mc: MC.wrongPiece, say: `Exactly ${J.at}: reread the words. ${J.own === 'L' ? '"Up to and including" keeps it in the lower tier.' : '"Or more" includes it in the upper tier.'}` }
        : near(y, rv) && !near(rv, v) ? { ok: false, mc: MC.roundsIn, say: `Don't round ${N(x)} to ${rounded}: ${N(x)} is ${x > J.at ? 'over' : 'under'} ${J.at}, and the rule uses the exact amount.` }
          : { ok: false, say: `Which side of ${J.at} is ${N(x)} on, and does the wording include ${J.at}?` });
};

// ===================== 23 nonlinear-piece-graphs =====================
function nlRule(R: () => number): Piece[] {
  const kind = pick(R, ['quad', 'exp', 'rec']);
  const a = int(R, 0, 2);
  if (kind === 'quad') {
    const h = int(R, -3, a - 1), v = int(R, -2, 2), sg = pick(R, [1, -1]);
    const fq: Fn = { k: 'quad', a: sg, h, v };
    const yA = ev(fq, a);
    return [{ fn: fq, hi: a, hiIn: R() < 0.5 }, { fn: mk(pick(R, [-1, 1, 2, 0]), a, yA + pick(R, [0, 2, -2, 3])), lo: a }].map((p, i, arr) => (i === 1 ? { ...p, loIn: !arr[0]!.hiIn } : p));
  }
  if (kind === 'exp') {
    const fe: Fn = { k: 'exp', a: 1, b: 2 };
    const L: Fn = mk(pick(R, [1, -1, 0]), a, pick(R, [1, 2, 3, -1]));
    const own = R() < 0.5;
    return [{ fn: L, hi: a, hiIn: own }, { fn: fe, lo: a, loIn: !own, hi: 3, hiIn: true }];
  }
  const c = pick(R, [4, 6, 8, 12]);
  const fr2: Fn = { k: 'rec', c };
  const own = R() < 0.5;
  return [{ fn: mk(pick(R, [1, 2]), 1, c + pick(R, [-2, 2, 1])), hi: 1, hiIn: own, lo: -3, loIn: true }, { fn: fr2, lo: 1, loIn: !own, hi: 6, hiIn: true }];
}
const nlEval = (R: () => number, n: number): PWItem => retry(() => {
  const ps = nlRule(R), bx = ps[0]!.hi!;
  const atB = R() < 0.35;
  const j = int(R, 0, 1);
  const x = atB ? bx : ps[j]!.fn.k === 'rec' ? pick(R, [2, 3, 4].filter(z => covers(ps[j]!, z))) : inside(R, ps[j]!, false);
  need(x !== undefined);
  const v = fAt(ps, x)!;
  need(v !== undefined && Number.isInteger(v * 100));
  const o = owners(ps, x)[0]!, w = 1 - o;
  const ov = ev(ps[w]!.fn, x);
  return numItem({ id: `nlEval-${n}`, family: 'nlEval', prompt: `Find ${fA(x)}.`, board: `${tagged('f', ps)}`,
    picture: { g: ruleGraph(ps, { trace: x }) },
    solution: [`${say1(ps, x)}.`, `${fA(x)} = ${ans(N(v))}`] }, v,
    y => near(y, v) ? { ok: true, say: 'Right.' } : Number.isFinite(ov) && near(y, ov) ? { ok: false, mc: atB ? MC.wrongPiece : MC.beyond, say: `That is ${fnStr(ps[w]!.fn)}, but ${N(x)} does not meet ${condStr(ps[w]!)}. ${say1(ps, x)}.` }
      : { ok: false, say: `${say1(ps, x)}. Evaluate that rule.` });
});
const nlSolve = (R: () => number, n: number): PWItem => retry(() => {
  // f(x) = (x − h)² + v for x ≤ p (or ≥), linear on the other side; solve f(x) = c
  const h = int(R, -2, 2), v = int(R, -3, 0), r = pick(R, [1, 2, 3]), c = v + r * r;
  const leftQ = R() < 0.5;
  const roots = [h - r, h + r];
  // the breakpoint keeps exactly one root of the parabola
  const p = leftQ ? int(R, h - r, h + r - 1) : int(R, h - r + 1, h + r);
  const fq: Fn = { k: 'quad', a: 1, h, v };
  const m = pick(R, [1, -1, 2]), yp = ev(fq, p);
  const fl = mk(m, p, yp + pick(R, [0, 1, -1]));
  const ps: Piece[] = leftQ ? [{ fn: fq, hi: p, hiIn: true }, { fn: fl, lo: p, loIn: false }] : [{ fn: fl, hi: p, hiIn: false }, { fn: fq, lo: p, loIn: true }];
  const qp = leftQ ? ps[0]! : ps[1]!, lp = leftQ ? ps[1]! : ps[0]!;
  const keepQ = roots.filter(z => covers(qp, z)), dropQ = roots.filter(z => !covers(qp, z));
  const xl = clean((c - (fl as { b: number }).b) / m);
  const keepL = covers(lp, xl) ? [xl] : [];
  const sol = [...keepQ, ...keepL].sort((s, t) => s - t);
  need(sol.length >= 1 && dropQ.length === 1 && Number.isInteger(xl * 2) && Math.abs(xl) <= 9);
  const txt = (xs: number[]) => xs.length ? xs.map(z => `${X} = ${N(z)}`).join(', ') : 'no solution';
  const all = [...roots, xl].sort((s, t) => s - t);
  const opts: Opt[] = [
    { t: txt(sol), ok: true, say: 'Right: solve each piece, then keep only the solutions inside that piece’s interval.' },
    { t: txt([...new Set(all)]), mc: MC.beyond, say: `Each solution has to meet its own piece's condition. Check ${dropQ.map(N).join(', ')}${keepL.length ? '' : ` and ${N(xl)}`}.` },
    { t: txt(keepQ), say: `The ${fnStr(fl)} piece can give ${N(c)} too: check it.` },
    { t: txt(roots), mc: MC.beyond, say: `${N(dropQ[0]!)} is outside the parabola's interval ${condStr(qp)}.` },
  ];
  const uniq = opts.filter((o, i) => opts.findIndex(z => z.t === o.t) === i);
  need(uniq[0]!.ok && uniq.length >= 3);
  return choiceItem(R, { id: `nlSolve-${n}`, family: 'nlSolve', prompt: `Find every ${X} with ${F}(${X}) = ${N(c)}.`, board: `${tagged('f', ps)} \\qquad f(x) = ${NT(c)}`,
    picture: { g: ruleGraph(ps, { xs: all, revealExtra: [{ kind: 'hline', key: 'hc', y: c, col: 'pick' }] }) },
    solution: [`Parabola: ${fnStr(fq)} = ${N(c)} gives ${X} = ${N(h - r)} or ${N(h + r)}; only ${X} = ${keepQ.map(N).join(', ')} meets ${condStr(qp)}.`, `Line: ${fnStr(fl)} = ${N(c)} gives ${X} = ${N(xl)}, which ${keepL.length ? 'meets' : 'does not meet'} ${condStr(lp)}.`] }, uniq);
});

// ===================== 24 nonlinear-piecewise-key-features =====================
const nlRange = (R: () => number, n: number): PWItem => retry(() => {
  const h = int(R, -2, 1), v = int(R, -2, 1), c = pick(R, [v - 2, v + 6, v + 7]);
  const fq: Fn = { k: 'quad', a: 1, h, v };
  const closedTop = R() < 0.5;
  const ps: Piece[] = closedTop ? [{ fn: fq, lo: h - 2, loIn: true, hi: h + 1, hiIn: true }, { fn: cst(c), lo: h + 1, loIn: false, hi: h + 4, hiIn: true }]
    : [{ fn: fq, lo: h - 1, loIn: true, hi: h + 2, hiIn: false }, { fn: cst(c), lo: h + 2, loIn: true, hi: h + 4, hiIn: true }];
  const top = v + 4, Y = '<i>y</i>';
  const r = `${N(v)} ≤ ${Y} ${closedTop ? '≤' : '&lt;'} ${N(top)}, or ${Y} = ${N(c)}`;
  const opts: Opt[] = [
    { t: r, ok: true, say: 'Right: what each restricted piece contributes, open ends left out.' },
    { t: `${N(v)} ≤ ${Y} ${closedTop ? '&lt;' : '≤'} ${N(top)}, or ${Y} = ${N(c)}`, mc: closedTop ? undefined : MC.openPt, say: closedTop ? `The parabola's end at height ${N(top)} is a filled dot: included.` : `The open dot at height ${N(top)} is not on the graph, so ${N(top)} is not in the range.` },
    { t: `${Y} ≥ ${N(v)}`, mc: MC.parentRange, say: `That is the range of the whole parabola. Here it only runs over ${condStr(ps[0]!)}, and the constant piece adds ${N(c)}.` },
    { t: `${N(v)} ≤ ${Y} ${closedTop ? '≤' : '&lt;'} ${N(top)}`, say: `The constant piece adds the output ${N(c)} too.` },
  ];
  return choiceItem(R, { id: `nlRange-${n}`, family: 'nlRange', prompt: `What is the range of ${F}?`, board: tagged('f', ps),
    picture: { g: ruleGraph(ps, { show: true }) },
    solution: [`Parabola piece: lowest ${N(v)} at ${X} = ${N(h)}, highest ${N(top)} at its ${closedTop ? 'left end (filled)' : 'right end (open: left out)'}.`, `Constant piece: just ${N(c)}. Range: ${r}.`] }, opts);
});
const nlFeature = (R: () => number, n: number): PWItem => retry(() => {
  const q = pick(R, ['asym', 'domain', 'range', 'xint']);
  if (q === 'xint') {
    const r = pick(R, [2, 3]), p = pick(R, [-1, 0, 1].filter(z => Math.abs(z) < r)), k = int(R, p + 1, p + 4);
    need(k !== r);
    const fq: Fn = { k: 'quad', a: 1, h: 0, v: -r * r };
    const ps: Piece[] = [{ fn: fq, hi: p, hiIn: false }, { fn: lin(1, -k), lo: p, loIn: true }];
    need(k > p);
    const txt = (xs: number[]) => xs.map(z => `${X} = ${N(z)}`).join(' and ');
    return choiceItem(R, { id: `nlFeature-${n}`, family: 'nlFeature', prompt: `Where does the graph of ${F} cross the ${X}-axis?`, board: tagged('f', ps),
      picture: { g: ruleGraph(ps, { xs: [-r, r, k] }) },
      solution: [`${fnStr(fq)} = 0 at ${X} = ${N(-r)} and ${N(r)}; only ${N(-r)} meets ${condStr(ps[0]!)}.`, `${fnStr(ps[1]!.fn)} = 0 at ${X} = ${N(k)}, which meets ${condStr(ps[1]!)}. So ${txt([-r, k])}.`] }, [
      { t: txt([-r, k]), ok: true, say: 'Right: an intercept only counts inside its own piece.' },
      { t: `${X} = ${N(-r)}, ${X} = ${N(r)} and ${X} = ${N(k)}`, mc: MC.beyond, say: `${N(r)} is not in ${condStr(ps[0]!)}: the parabola piece stops at ${N(p)}.` },
      { t: txt([-r, r]), mc: MC.beyond, say: `The parabola piece stops at ${N(p)}; check the line piece too.` },
      { t: `only ${X} = ${N(-r)}`, say: `The line piece crosses too: ${fnStr(ps[1]!.fn)} = 0 at ${N(k)}.` },
    ]);
  }
  const rate = pick(R, [25, 40, 50]), t0 = 2, peak = rate * t0;
  const half = pick(R, [0.5]);
  const A0 = clean(peak / half ** t0);
  const ps: Piece[] = [{ fn: lin(rate, 0), lo: 0, loIn: true, hi: t0, hiIn: true }, { fn: { k: 'exp', a: A0, b: half }, lo: t0, loIn: false }];
  const g: GPic = { x: { min: 0, max: 10, step: 1, name: 'hours' }, y: axisOver([0, peak], { cells: 8, name: 'mg in the body' }), parts: pieceParts(ps, 'p', { arrows: false }) };
  const ctx = `A medicine drip adds ${rate} mg an hour for 2 hours; after that the amount halves every hour: A(<i>t</i>) = ${rate}<i>t</i> for 0 ≤ <i>t</i> ≤ 2, and A(<i>t</i>) = ${N(A0)}(0.5)<sup><i>t</i></sup> for <i>t</i> &gt; 2.`;
  const board = `A(t) = \\begin{cases} ${rate}t, & 0 \\le t \\le 2 \\\\ ${A0}(0.5)^t, & t > 2 \\end{cases}`;
  const T = '<i>t</i>', Aa = '<i>A</i>';
  const sets: Record<string, Opt[]> = {
    asym: [
      { t: `It gets closer and closer to 0 mg but never reaches 0`, ok: true, say: 'Right: the horizontal asymptote A = 0 on the ray t > 2.' },
      { t: `It reaches 0 mg after about 10 hours`, say: `Halving never gets to 0: ${N(A0)}(0.5)<sup>t</sup> stays above 0.` },
      { t: `It drops below 0 mg after a while`, say: 'Half of a positive amount is still positive.' },
      { t: `It levels off at ${peak} mg`, say: `${peak} mg is the peak at t = 2; after that it falls.` },
    ],
    domain: [
      { t: `${T} ≥ 0`, ok: true, say: 'Right: time starts at 0, and the second piece runs on from there.' },
      { t: `all real numbers ${T}`, mc: MC.allReals, say: 'Negative time has no meaning here: the drip starts at t = 0.' },
      { t: `0 ≤ ${T} ≤ 2`, say: 'The rule goes on after 2 hours: the second piece holds for t &gt; 2.' },
    ],
    range: [
      { t: `0 ≤ ${Aa} ≤ ${peak}`, ok: true, say: `Right: from 0 at the start up to ${peak} at t = 2, then down toward 0.` },
      { t: `${Aa} &gt; 0`, mc: MC.parentRange, say: `That is the parent exponential's range. Here A(0) = 0, and nothing goes above ${peak}.` },
      { t: `all real numbers`, mc: MC.parentRange, say: `That is the line's range. Restricted to 0 ≤ t ≤ 2 it only gives 0 to ${peak}.` },
      { t: `0 &lt; ${Aa} ≤ ${peak}`, say: 'At t = 0 the amount is 0, and that is included.' },
    ],
  };
  const ask = q === 'asym' ? 'What happens to the amount as t keeps growing?' : q === 'domain' ? 'What is the domain of A in this context?' : 'What is the range of A?';
  return choiceItem(R, { id: `nlFeature-${n}`, family: 'nlFeature', prompt: `${ctx} ${ask}`, board, picture: { g },
    solution: q === 'asym' ? [`For t &gt; 2 the amount halves every hour: ${N(peak / 2)}, ${N(peak / 4)}, ${N(peak / 8)}, …`, 'It approaches 0 mg (a horizontal asymptote) but never reaches it.']
      : q === 'domain' ? ['Time starts when the drip starts: t = 0.', 'The first piece covers 0 to 2, the second everything after: t ≥ 0.']
        : [`First piece: 0 up to ${peak}. Second piece: just under ${peak} down toward 0.`, `Together: 0 ≤ A ≤ ${peak}.`] }, sets[q]!);
});

// ---------- the map ----------
export const GENERATORS = {
  evalOne, readPoint, whichRule, whichInput, ownerAtBreak, nearBreak, isFunction, manyToOne, isStep, stepRead,
  evalPiece, evalBoth, evalBreak, isolatedPoint, dotFill, joinDot, readOpen, pieceGraph, segEnds, wholeGraph, graphPoints,
  phraseCond, twoThreshold, startedCost, startedGraph, completedPay, whichWay, floorEval, floorSolve, condFromGraph, joinOwner,
  ruleFromGraph, pieceLine, tierCost, tierRule, domainKind, countGraph, findGap, gapFix, overlapOk, overlapInput,
  findError, fixDot, jumpMeaning, atThreshold, nlEval, nlSolve, nlRange, nlFeature,
} as const;
export const FAMILY_NAMES: Record<keyof typeof GENERATORS, string> = {
  evalOne: 'Evaluate f(a)', readPoint: 'What f(a) = b says', whichRule: 'Which rule?', whichInput: 'Which input uses it?',
  ownerAtBreak: 'Who owns the breakpoint?', nearBreak: 'Just below, at, just above', isFunction: 'Still one function?', manyToOne: 'Shared outputs',
  isStep: 'Step function or not?', stepRead: 'Read a step graph', evalPiece: 'Evaluate a piecewise function', evalBoth: 'Two inputs, two rules',
  evalBreak: 'At a breakpoint or outside', isolatedPoint: 'A single-point row', dotFill: 'Open or filled dots', joinDot: 'Where the pieces meet',
  readOpen: 'Read past the open dot', pieceGraph: 'Graph one piece', segEnds: 'The ends of a piece', wholeGraph: 'Graph the whole rule',
  graphPoints: 'Heights of the two dots', phraseCond: 'Words to a condition', twoThreshold: 'Three tiers, two thresholds',
  startedCost: 'Per started unit', startedGraph: 'Graph a started-unit charge', completedPay: 'Per completed unit', whichWay: 'Which interval?',
  floorEval: 'Greatest integer', floorSolve: 'Solve with the floor', condFromGraph: 'Condition from a graph', joinOwner: 'Who may own the join?',
  ruleFromGraph: 'Rule from a graph', pieceLine: 'One piece’s line', tierCost: 'Tiered cost', tierRule: 'Model the upper tier',
  domainKind: 'Count or measure?', countGraph: 'Dots or a segment?', findGap: 'Coverage check', gapFix: 'Fill the gap', overlapOk: 'Overlap check',
  overlapInput: 'Where the overlap breaks it', findError: 'Find the mistake', fixDot: 'Fix the dots', jumpMeaning: 'Describe the jump',
  atThreshold: 'At the threshold', nlEval: 'Curved pieces', nlSolve: 'Solve piece by piece', nlRange: 'Range from the pieces', nlFeature: 'Key features in context',
};
