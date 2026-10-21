// items.ts: exercise families for "function concept and identifying functions" (grade 8, 8.F.A.1). Every family is one
// deep structure; items vary the relation (one-to-one, many-to-one, constant, one input with two outputs), the
// representation (mapping diagram, ordered pairs, table, graph, rule, story) and the numbers, in the ranges of the
// sub-goal they practise (plan.ts). Every wrong answer the classifier recognises carries its id from
// math-curriculum-essentials/misconceptions.json (logged, never shown). Pure: no DOM, no canvas; seeded.
//
// Pictures: an item can carry a mapping diagram, a table, a graph or a story graph (Pic); the page draws it and, after a
// miss, replays the worked solution on it (`hi`: the witness arrows / rows / points or the slice in its colour).
import { type Item, type Response, type Verdict, type Gen, A, B, S, int, pick, shuffle } from '../../runtime/item';
import {
  type V, type Pair, type Rule, type EqId, type Seg, EQS, checkFunction, distinct, inputsOf, outputsOf, sortVals, sharedOutput, flip,
  hn, tn, setHtml, setTex, pairHtml, pairTex, evalRule, ruleTex, ruleHtml, ineqHtml, segDomain, segRange,
} from './relation';
import { fnPts, sidewaysPts, circleUnits } from './FnGraph';

// ---------- pictures ----------
export type Col = 'link' | 'wrong' | 'pick';
export type Hi = { /** a short line written on the board after a miss */ note?: string; col: Col; arrows?: number[]; rows?: number[]; pts?: string[]; slice?: { x: number; hits: { y: number; col: Col }[] }; hline?: number }
export type MapPic = { kind: 'map'; ins: V[]; outs: V[]; arrows: [number, number][]; inName: string; outName: string; hi?: Hi; /** an allowed input with no arrow */ missing?: V };
export type TablePic = { kind: 'table'; xs: V[]; ys: V[]; xName: string; yName: string; horizontal?: boolean; hi?: Hi };
export type GraphPic = {
  kind: 'graph'; x0: number; x1: number; y0: number; y1: number; xStep: number; yStep: number; xName: string; yName: string;
  qual?: boolean; xTicks?: { v: number; t: string }[]; equal?: boolean;
  points: { key: string; x: number; y: number; open?: boolean; col?: Col; label?: boolean }[];
  paths: { key: string; pts: [number, number][] }[];
  /** a table drawn on the board under the TeX lines (table vs graph items) */
  side?: TablePic;
  hi?: Hi;
};
export type Pic = MapPic | TablePic | GraphPic;
export interface FItem extends Item { picture?: Pic }

export type FamilyId = 'readMap' | 'pairsCount' | 'mapVerdict' | 'pairVerdict' | 'statedSet' | 'contextInputs' | 'tableVerdict'
  | 'readPoint' | 'outputAt' | 'domainRange' | 'graphVerdict' | 'segInterval' | 'ruleVerdict' | 'ruleOutput' | 'whichPair'
  | 'pairYesNo' | 'implicitShows' | 'sameFn' | 'sampleOrAll' | 'compareAt' | 'crossover' | 'pickWitness' | 'witnessInput'
  | 'enoughProof' | 'bothWays' | 'reverseWitness' | 'readStory' | 'sketchStory';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  readMap: 'Read the arrows', pairsCount: 'Outputs of one input', mapVerdict: 'Function or not? (arrows)', pairVerdict: 'Function or not? (pairs)',
  statedSet: 'The allowed inputs', contextInputs: 'Inputs that make sense', tableVerdict: 'Function or not? (table)',
  readPoint: 'Read a point', outputAt: 'Output from a graph', domainRange: 'Domain and range', graphVerdict: 'Function or not? (graph)',
  segInterval: 'Domain and range of a segment', ruleVerdict: 'Is the rule a function?', ruleOutput: 'Use the rule', whichPair: 'Which pair fits?',
  pairYesNo: 'Does the pair fit?', implicitShows: 'Two pairs, one input', sameFn: 'Same function?', sampleOrAll: 'All the inputs, or a sample?',
  compareAt: 'Compare at one input', crossover: 'Does the lead last?', pickWitness: 'Pick the proof', witnessInput: 'Find the input that breaks it',
  enoughProof: 'Is it proved?', bothWays: 'Both directions', reverseWitness: 'Read it backward', readStory: 'Read a story graph', sketchStory: 'Sketch the story',
};
/** the misconceptions each item should recognise (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

const MC = {
  firstArrow: 'mc.functions-concept.mapping-first-arrow-only',
  oneToOne: 'mc.functions-concept.function-means-one-to-one',
  outUnique: 'mc.functions-concept.output-uniqueness-replaces-function-test',
  dupRow: 'mc.functions-concept.repeated-identical-pair-not-function',
  constant: 'mc.functions-concept.constant-rule-not-function',
  everyInput: 'mc.functions-concept.every-input-part-of-definition',
  absent: 'mc.functions-concept.absent-input-invalidates-function',
  domainAll: 'mc.functions-concept.domain-ignores-excluded-inputs',
  reverse: 'mc.coordinate-geometry.reverses-coordinate-order',
  swapDR: 'mc.functions-concept.domain-range-swap',
  noDomain: 'mc.functions-concept.relation-without-function-has-no-domain',
  everyRel: 'mc.functions-concept.every-relation-is-function',
  connected: 'mc.functions-concept.function-must-be-connected',
  endPoints: 'mc.functions-concept.domain-as-endpoint-points',
  endStyle: 'mc.linear-equations.endpoint-style-convention',
  linear: 'mc.functions-concept.requires-linearity',
  evenPow: 'mc.integers.even-power-of-negative-negative',
  oneCoord: 'mc.linear-equations.checks-one-coordinate',
  examples: 'mc.reasoning-language.examples-as-proof',
  neverProves: 'mc.reasoning-language.checking-never-proves-anything',
  fewTerms: 'mc.sequences-series.few-terms-fix-unique-rule',
  oneInput: 'mc.functions-concept.generalizes-comparison-from-one-input',
  mismatch: 'mc.functions-concept.mismatched-comparison',
  noWitness: 'mc.functions-concept.nonfunction-justification-missing-witness',
  reverseFn: 'mc.functions-concept.reverse-relation-assumed-function',
  sameRate: 'mc.linear-functions.same-direction-means-same-rate',
  picture: 'mc.functions-concept.graph-as-picture',
  flatZero: 'mc.data-displays.flat-segment-as-zero',
} as const;

// ---------- shared checking ----------
interface Opt { html: string; ok: boolean; mc?: string; say: string }
/** a choice item: options shuffled (or kept in order), duplicates dropped, exactly one right */
function choose(base: Omit<FItem, 'check' | 'answer' | 'input' | 'choices'>, R: () => number, opts: Opt[], keep = false): FItem {
  const uniq: Opt[] = [];
  for (const o of opts) if (!uniq.some(u => u.html === o.html)) uniq.push(o);
  const os = keep ? uniq : shuffle(R, [...uniq]);
  const it: FItem = {
    ...base, input: 'choice', choices: os.map(o => o.html), answer: { kind: 'choice', i: os.findIndex(o => o.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !os[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const o = os[r.i]!;
      return { ok: o.ok, mc: o.ok ? undefined : o.mc, say: o.say };
    },
  };
  PROBES.set(it, os.map((o, i) => ({ o, i })).filter(x => !x.o.ok && x.o.mc).map(x => ({ r: { kind: 'choice', i: x.i } as Response, mc: x.o.mc! })));
  return it;
}
interface Wrong { v: number; mc?: string; say: string }
/** a typed whole number: the right value, the misconception values (first match wins), a fallback */
function typedNum(base: Omit<FItem, 'check' | 'answer' | 'input'>, right: number, rightSay: string, wrongs: Wrong[], other: string): FItem {
  const ws: Wrong[] = [];
  for (const w of wrongs) if (w.v !== right && Number.isFinite(w.v) && !ws.some(x => x.v === w.v)) ws.push(w);
  const it: FItem = {
    ...base, input: 'num', answer: { kind: 'num', v: right },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number, like 4 or −3.' };
      if (r.v === right) return { ok: true, say: rightSay };
      const w = ws.find(x => x.v === r.v);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: { kind: 'num', v: w.v }, mc: w.mc! })));
  return it;
}

// ---------- helpers ----------
const KIDS = ['Ava', 'Ben', 'Cara', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivan', 'Jo', 'Kai', 'Lena', 'Noor', 'Omar', 'Rosa', 'Sam', 'Tess', 'Uma', 'Wes', 'Zoe'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CLUBS = ['art', 'band', 'chess', 'drama', 'track', 'choir'];
const sample = <T>(R: () => number, xs: readonly T[], n: number): T[] => shuffle(R, [...xs]).slice(0, n);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const nz = (R: () => number, lo: number, hi: number) => { let v = 0; while (v === 0) v = int(R, lo, hi); return v; };
const arrowTxt = (x: V, y: V) => `${hn(x)} → ${hn(y)}`;
type Kind = 'one' | 'many' | 'const' | 'split';
/** a relation of a given kind on the inputs; outputs drawn from `outs` (needs enough of them) */
function makeRel(R: () => number, kind: Kind, ins: V[], outs: V[]): Pair[] {
  const o = shuffle(R, [...outs]);
  if (kind === 'one') return ins.map((x, i) => [x, o[i]!] as const);
  if (kind === 'const') return ins.map(x => [x, o[0]!] as const);
  if (kind === 'many') {
    // at least one output shared by two inputs, the rest free
    const pool = o.slice(0, Math.max(2, ins.length - 1));
    const P = ins.map((x, i) => [x, i < 2 ? pool[0]! : i === 2 ? pool[1]! : pick(R, pool)] as const);
    return shuffle(R, P);
  }
  // split: one input with two outputs, every output used once (so "each output has one input" holds)
  const si = int(R, 0, ins.length - 1);
  const P: Pair[] = [];
  let j = 0;
  ins.forEach((x, i) => { P.push([x, o[j++]!]); if (i === si) P.push([x, o[j++]!]); });
  return P;
}
function mapPic(P: readonly Pair[], inName: string, outName: string, sortIn = true, allIns?: V[]): MapPic {
  const ins = allIns ?? (sortIn ? sortVals(inputsOf(P)) : inputsOf(P)), outs = sortVals(outputsOf(P));
  return { kind: 'map', ins, outs, arrows: P.map(p => [ins.indexOf(p[0]), outs.indexOf(p[1])] as [number, number]), inName, outName };
}
const arrowsOf = (pic: MapPic, test: (x: V, y: V) => boolean) => pic.arrows.map((a, i) => [a, i] as const).filter(([a]) => test(pic.ins[a[0]]!, pic.outs[a[1]]!)).map(([, i]) => i);
const pairsTex = (P: readonly Pair[]) => `\\{${P.map(pairTex).join(',\\; ')}\\}`;
/** a pairs list on the board, two lines when long */
function pairsBoard(P: readonly Pair[]): string {
  if (P.length <= 4) return pairsTex(P);
  const h = Math.ceil(P.length / 2);
  return `\\{${P.slice(0, h).map(pairTex).join(',\\; ')},\n${P.slice(h).map(pairTex).join(',\\; ')}\\}`;
}
const tablePic = (P: readonly Pair[], horizontal = false, xName = 'x', yName = 'y'): TablePic => ({ kind: 'table', xs: P.map(p => p[0]), ys: P.map(p => p[1]), xName, yName, horizontal: horizontal && P.length <= 5 });
/** a window for integer points: step 1 up to ±6, step 2 up to ±10 */
function win(vals: number[], axisLo = -6, axisHi = 6): { lo: number; hi: number; step: number } {
  const m = Math.max(...vals.map(Math.abs), 1);
  if (m <= 6 && axisLo >= -6) return { lo: Math.min(axisLo, Math.floor(Math.min(...vals, 0)) - 1), hi: Math.max(axisHi, Math.ceil(Math.max(...vals, 0)) + 1), step: 1 };
  return { lo: -10, hi: 10, step: 2 };
}
function pointsPic(P: readonly Pair[], o: { label?: boolean; hiKeys?: string[]; xName?: string; yName?: string } = {}): GraphPic {
  const xs = P.map(p => p[0] as number), ys = P.map(p => p[1] as number);
  const wx = win(xs), wy = win(ys);
  const step = Math.max(wx.step, wy.step);
  const W = step === 2 ? { lo: -10, hi: 10 } : { lo: Math.max(-7, Math.min(wx.lo, wy.lo)), hi: Math.min(7, Math.max(wx.hi, wy.hi)) };
  return {
    kind: 'graph', x0: W.lo, x1: W.hi, y0: W.lo, y1: W.hi, xStep: step, yStep: step, xName: o.xName ?? 'x (input)', yName: o.yName ?? 'y (output)', equal: true,
    points: P.map((p, i) => ({ key: 'p' + i, x: p[0] as number, y: p[1] as number, label: o.label })), paths: [],
  };
}
/** the pairs with exact repeats dropped (a graph or a mapping draws a repeated pair once) */
const uniqPairs = (P: readonly Pair[]): Pair[] => P.filter((p, i) => P.findIndex(q => q[0] === p[0] && q[1] === p[1]) === i);
const cmpWord = (a: number, b: number) => (a > b ? 'A' : a < b ? 'B' : 'same');

// =====================================================================================================================
// 1. relation-pairs: read a mapping / pair list in the input -> output direction
// =====================================================================================================================
const readMap: Gen = (R, n) => {
  const named = R() < 0.4;
  let P: Pair[], inName: string, outName: string;
  if (named) {
    const kids = sample(R, KIDS, int(R, 3, 5)), clubs = sample(R, CLUBS, kids.length + 1);
    P = makeRel(R, R() < 0.65 ? 'split' : 'many', kids, clubs); inName = 'student'; outName = 'club';
  } else {
    const ins = sample(R, range(0, 10), int(R, 3, 6)), outs = sample(R, range(0, 10), ins.length + 1);
    P = makeRel(R, R() < 0.65 ? 'split' : pick(R, ['many', 'one'] as Kind[]), ins, outs); inName = 'input'; outName = 'output';
  }
  const pic = mapPic(P, inName, outName);
  // ask about an input with two outputs when there is one
  const multi = pic.ins.filter(x => outputsOf(P, x).length >= 2);
  const x = multi.length ? pick(R, multi) : pick(R, pic.ins);
  const ys = outputsOf(P, x), others = outputsOf(P).filter(y => !ys.includes(y));
  const list = (vs: V[]) => vs.map(y => arrowTxt(x, y)).join(' and ');
  const opts: Opt[] = [{ html: list(ys), ok: true, say: `Yes. Follow every arrow that starts at ${hn(x)}: ${list(ys)}.` }];
  if (ys.length >= 2) opts.push({ html: `${arrowTxt(x, ys[0]!)} only`, ok: false, mc: MC.firstArrow, say: `${hn(x)} has more than one arrow. Follow every arrow that starts at ${hn(x)}, not just the first.` });
  if (others.length) opts.push({ html: list(sortVals([...ys, others[0]!])), ok: false, say: `Only arrows that START at ${hn(x)} count. ${hn(others[0]!)} is not at the end of one of them.` });
  const into = P.filter(p => p[1] === x).map(p => p[0]);
  if (into.length && !(into.length === ys.length && into.every(v => ys.includes(v)))) opts.push({ html: list(into), ok: false, say: `Those arrows END at ${hn(x)}. Read input → output: start at ${hn(x)} and follow its arrows.` });
  const fill: Opt[] = [...others.map(y => ({ html: list([y]), ok: false, say: `Start at ${hn(x)} and follow its arrows: ${list(ys)}.` })), { html: 'No output at all', ok: false, say: `${hn(x)} has an arrow: ${list(ys)}.` }];
  for (const o of fill) if (opts.length < 3 && !opts.some(q => q.html === o.html)) opts.push(o);
  pic.hi = { col: 'pick', arrows: arrowsOf(pic, xx => xx === x) };
  return choose({ id: `readMap-${n}`, family: 'readMap', prompt: `In this mapping diagram, which outputs are paired with the input ${A(hn(x))}?`, board: `${tn(x)} \\to\\ ?`, picture: pic, solution: [`Start at ${A(hn(x))} in the input oval.`, `Follow every arrow that leaves it: ${list(ys)}.`] }, R, opts);
};
const pairsCount: Gen = (R, n) => {
  // ordered pairs: how many different outputs does x have? (reading the second number when x is first)
  for (;;) {
    const ins = sample(R, range(0, 9), int(R, 3, 4)), outs = sample(R, range(0, 9), 6);
    const P = shuffle(R, makeRel(R, R() < 0.6 ? 'split' : 'many', ins, outs));
    const x = pick(R, ins), right = outputsOf(P, x).length, back = P.filter(p => p[1] === x).length;
    if (back === right || P.length > 6) continue;
    const wrongs: Wrong[] = [];
    if (right >= 2) wrongs.push({ v: 1, mc: MC.firstArrow, say: `${x} is the first number in more than one pair. Count every pair that starts with ${x}.` });
    wrongs.push({ v: back, mc: MC.reverse, say: `That counts pairs with ${x} SECOND. The input is the first number: count the pairs (${x}, …).` });
    const ys = outputsOf(P, x);
    return typedNum({ id: `pairsCount-${n}`, family: 'pairsCount', prompt: `In this list of (input, output) pairs, how many different outputs does the input ${A(x)} have?`, board: pairsBoard(P), unit: ys.length === 1 ? '' : '', solution: [`The input is the FIRST number of a pair.`, `The pairs that start with ${A(x)}: ${P.filter(p => p[0] === x).map(pairHtml).join(', ')}.`, `So ${A(x)} has ${S(String(right))} output${right === 1 ? '' : 's'}: ${ys.map(hn).join(' and ')}.`] },
      right, `Yes: ${P.filter(p => p[0] === x).map(pairHtml).join(' and ')}. ${right === 1 ? 'One output.' : `${right} outputs.`}`, wrongs, `Count the pairs whose FIRST number is ${x}.`);
  }
};

// =====================================================================================================================
// 2. exactly-one-criterion: each input exactly one output; outputs may repeat
// =====================================================================================================================
function verdictOpts(P: readonly Pair[], kind: Kind, how: 'arrow' | 'pair'): Opt[] {
  const c = checkFunction(P), sh = sharedOutput(P);
  const has = how === 'arrow' ? 'arrow' : 'pair';
  if (c.fn) {
    const opts: Opt[] = [{ html: 'A function: each input has exactly one output.', ok: true, say: `Yes. Every input has exactly one ${has === 'arrow' ? 'arrow' : 'output'}${sh ? `; ${hn(sh.x1)} and ${hn(sh.x2)} sharing ${hn(sh.y)} is allowed` : ''}.` }];
    if (kind === 'const') opts.push({ html: 'Not a function: every input gives the same output, so nothing changes.', ok: false, mc: MC.constant, say: 'The same output for every input is fine: each input still has exactly one output. A function does not have to change.' });
    if (sh) opts.push({ html: `Not a function: the inputs ${hn(sh.x1)} and ${hn(sh.x2)} share the output ${hn(sh.y)}.`, ok: false, mc: MC.oneToOne, say: `Inputs may share an output. What a function forbids is ONE input with two outputs, and no input here has two.` });
    else opts.push({ html: `Not a function: no two inputs share an output.`, ok: false, say: 'Sharing outputs is allowed but not needed. Each input has exactly one output, so it is a function.' });
    if (opts.length < 3) opts.push({ html: `Not a function: the ${has === 'arrow' ? 'arrows' : 'outputs'} are not in order.`, ok: false, say: 'Order does not matter. Check each input: exactly one output each.' });
    return opts;
  }
  const w = c.witness!;
  if (w.kind !== 'two') throw new Error('verdictOpts: no-output witness');
  return [
    { html: `Not a function: the input ${hn(w.x)} has two outputs, ${hn(w.y1)} and ${hn(w.y2)}.`, ok: true, say: `Yes. ${hn(w.x)} goes to both ${hn(w.y1)} and ${hn(w.y2)}: one input, two outputs.` },
    { html: 'A function: every output comes from just one input.', ok: false, mc: MC.outUnique, say: `That checks the outputs. Check the INPUTS: ${hn(w.x)} has two outputs, ${hn(w.y1)} and ${hn(w.y2)}.` },
    { html: `A function: ${hn(w.x)}${how === 'arrow' ? '’s first arrow' : '’s first pair'} goes to ${hn(w.y1)}.`, ok: false, mc: MC.firstArrow, say: `Every ${how === 'arrow' ? 'arrow' : 'pair'} counts, not only the first. ${hn(w.x)} also goes to ${hn(w.y2)}.` },
  ];
}
const mapVerdict: Gen = (R, n) => {
  const kind = pick(R, ['one', 'many', 'many', 'const', 'split', 'split'] as Kind[]);
  const named = R() < 0.35;
  let P: Pair[], inName = 'input', outName = 'output';
  if (named && kind !== 'split') { const kids = sample(R, KIDS, int(R, 3, 5)); P = makeRel(R, kind, kids, sample(R, MONTHS, kids.length)); inName = 'student'; outName = 'birthday month'; }
  else if (named) { const kids = sample(R, KIDS, int(R, 3, 4)); P = makeRel(R, kind, kids, sample(R, CLUBS, kids.length + 1)); inName = 'student'; outName = 'club'; }
  else { const ins = sample(R, range(0, 10), int(R, 3, 6)); P = makeRel(R, kind, ins, sample(R, range(0, 10), ins.length + 1)); }
  const pic = mapPic(P, inName, outName);
  const c = checkFunction(P);
  if (c.witness?.kind === 'two') { const w = c.witness; pic.hi = { col: 'wrong', arrows: arrowsOf(pic, x => x === w.x), note: `${hn(w.x)} → ${hn(w.y1)} and ${hn(w.y2)}` }; }
  else { const sh = sharedOutput(P); pic.hi = { col: 'link', arrows: sh ? arrowsOf(pic, (_, y) => y === sh.y) : pic.arrows.map((_, i) => i), note: sh ? `${hn(sh.x1)}, ${hn(sh.x2)} → ${hn(sh.y)}: allowed` : 'one output each' }; }
  return choose({ id: `mapVerdict-${n}`, family: 'mapVerdict', prompt: `Is this relation from ${A(inName)} to ${B(outName)} a function?`, board: `\\text{${inName}} \\to \\text{${outName}}`, picture: pic,
    solution: c.fn ? ['Look at each input in turn.', 'Each one has exactly one arrow leaving it.', `So it is ${S('a function')}${sharedOutput(P) ? ', even though two inputs share an output' : ''}.`]
      : [`Look at each input in turn.`, `${A(hn((c.witness as { x: V }).x))} has two arrows leaving it.`, `One input with two outputs: ${S('not a function')}.`] }, R, verdictOpts(P, kind, 'arrow'));
};
const pairVerdict: Gen = (R, n) => {
  const kind = pick(R, ['one', 'many', 'many', 'const', 'split', 'split'] as Kind[]);
  const ins = sample(R, range(-5, 9), int(R, 3, 5));
  const P = shuffle(R, makeRel(R, kind, ins, sample(R, range(-5, 9), ins.length + 1)));
  const c = checkFunction(P);
  return choose({ id: `pairVerdict-${n}`, family: 'pairVerdict', prompt: 'Is this set of (input, output) pairs a function?', board: pairsBoard(P),
    solution: c.fn ? ['Read the FIRST number of each pair: the inputs.', 'No input appears with two different outputs.', `So it is ${S('a function')}.`]
      : [`The input ${A(hn((c.witness as { x: V }).x))} appears in two pairs with different outputs.`, `So it is ${S('not a function')}.`] }, R, verdictOpts(P, kind, 'pair'));
};

// =====================================================================================================================
// 3. allowed-inputs: a stated input set; inputs that make sense in a context
// =====================================================================================================================
const statedSet: Gen = (R, n) => {
  const set = sortVals(sample(R, range(1, 9), int(R, 3, 5))) as number[];
  const outs = sample(R, range(0, 10), set.length);
  const missing = R() < 0.5;
  if (missing) {
    const gone = pick(R, set);
    const P: Pair[] = set.filter(x => x !== gone).map((x, i) => [x, R() < 0.3 && i > 0 ? outs[0]! : outs[i]!] as const);
    const pic = mapPic(P, 'input', 'output', true, set);
    pic.hi = { col: 'wrong', arrows: [] };
    const sh = sharedOutput(P);
    return choose({ id: `statedSet-${n}`, family: 'statedSet', prompt: `The allowed inputs are ${A(setHtml(set))}. Is this a function on these inputs?`, board: `\\text{allowed inputs: } ${setTex(set)}`, picture: { ...pic, hi: { col: 'wrong', arrows: [] }, missing: gone } as MapPic,
      solution: [`Every allowed input needs exactly one output.`, `${A(gone)} is an allowed input, but no arrow leaves it.`, `So it is ${S('not a function')} on ${setHtml(set)}.`] }, R, [
      { html: `Not a function: the allowed input ${gone} has no output.`, ok: true, say: `Yes. ${gone} is allowed, so it must have exactly one output. It has none.` },
      { html: 'A function: no input has two outputs.', ok: false, mc: MC.everyInput, say: `Not having two outputs is only half of it. Every ALLOWED input needs exactly one, and ${gone} has none.` },
      sh ? { html: `Not a function: ${sh.x1} and ${sh.x2} share an output.`, ok: false, mc: MC.oneToOne, say: `Sharing an output is allowed. The problem is ${gone}: an allowed input with no output.` }
        : { html: `A function: ${gone} just isn’t used.`, ok: false, mc: MC.everyInput, say: `${gone} is in the allowed set, so it must be used: it needs exactly one output.` },
    ]);
  }
  const P: Pair[] = set.map((x, i) => [x, R() < 0.3 && i > 0 ? outs[0]! : outs[i]!] as const);
  const pic = mapPic(P, 'input', 'output');
  const outside = pick(R, range(1, 12).filter(v => !set.includes(v)));
  const sh = sharedOutput(P);
  pic.hi = { col: 'link', arrows: pic.arrows.map((_, i) => i) };
  return choose({ id: `statedSet-${n}`, family: 'statedSet', prompt: `The allowed inputs are ${A(setHtml(set))}. There is no arrow for ${outside}. Is this a function on the allowed inputs?`, board: `\\text{allowed inputs: } ${setTex(set)}`, picture: pic,
    solution: [`Only the allowed inputs ${setHtml(set)} must have an output.`, `Each of them has exactly one arrow.`, `${outside} is not allowed, so it needs no output: ${S('a function')}.`] }, R, [
    { html: `A function: every allowed input has exactly one output; ${outside} is not an allowed input.`, ok: true, say: `Yes. ${outside} is outside the allowed set, so it does not need an output.` },
    { html: `Not a function: ${outside} has no output.`, ok: false, mc: MC.absent, say: `${outside} is not an allowed input, so it does not need an output. Check only ${setHtml(set)}.` },
    sh ? { html: `Not a function: ${sh.x1} and ${sh.x2} share an output.`, ok: false, mc: MC.oneToOne, say: 'Sharing an output is allowed. Each allowed input has exactly one output.' }
      : { html: `Not a function: the set should include ${outside}.`, ok: false, mc: MC.absent, say: `The allowed set is given: ${setHtml(set)}. Only those inputs need an output.` },
  ]);
};
const CONTEXTS: { q: string; ok: 0 | 1 | 2; why: string }[] = [
  { q: 'the number of tickets bought → the total cost', ok: 0, why: 'You can only buy a whole number of tickets.' },
  { q: 'the number of people in a car → the number of seat belts used', ok: 0, why: 'People come in whole numbers.' },
  { q: 'the number of songs downloaded → the storage used', ok: 0, why: 'Songs come in whole numbers.' },
  { q: 'the number of laps run → the distance run', ok: 0, why: 'Laps here are counted in whole numbers.' },
  { q: 'the length of a board in inches → its weight', ok: 1, why: 'A length can be 2.5 inches, but never negative.' },
  { q: 'the hours a candle has burned → its height', ok: 1, why: 'Time can be 1.5 hours, but not negative hours.' },
  { q: 'the weight of a package in pounds → the shipping cost', ok: 1, why: 'A weight can be 3.2 pounds, but not negative.' },
  { q: 'a number x → 3x − 2', ok: 2, why: 'With no story, any number can go into the rule.' },
  { q: 'a number x → x + 7', ok: 2, why: 'With no story, any number can go into the rule.' },
  { q: 'a number x → 2x', ok: 2, why: 'With no story, any number can go into the rule.' },
];
const contextInputs: Gen = (R, n) => {
  const c = pick(R, CONTEXTS);
  const names = ['Whole numbers 0, 1, 2, 3, …', 'Any number 0 or more, like 2.5', 'Any number at all, like −3 or 1.5'];
  return choose({ id: `contextInputs-${n}`, family: 'contextInputs', prompt: `Which input values make sense for ${A(c.q)}?`, board: '\\text{allowed inputs?}',
    solution: [c.why, `So the allowed inputs are: ${S(names[c.ok]!.toLowerCase())}. This set is called the ${S('domain')}.`] }, R,
  names.map((t, i) => ({ html: t, ok: i === c.ok, mc: i === 2 && c.ok < 2 ? MC.domainAll : undefined, say: i === c.ok ? `Yes. ${c.why}` : i === 2 ? `Not every number fits the story. ${c.why}` : c.why })), true);
};

// =====================================================================================================================
// 4. table-recognition: check the input column
// =====================================================================================================================
const tableVerdict: Gen = (R, n) => {
  const kind = pick(R, ['repeatOut', 'dupRow', 'conflict', 'conflict', 'constant'] as const);
  const rows = int(R, kind === 'dupRow' || kind === 'conflict' ? 4 : 3, 7);
  const xs = sample(R, range(-10, 10), kind === 'dupRow' || kind === 'conflict' ? rows - 1 : rows) as number[];
  let P: Pair[];
  if (kind === 'constant') { const c = int(R, -10, 10); P = xs.map(x => [x, c] as const); }
  else {
    const ys = sample(R, range(-10, 10), xs.length + 2) as number[];
    P = xs.map((x, i) => [x, ys[i]!] as const);
    if (kind === 'repeatOut') { const i = int(R, 1, P.length - 1); P[i] = [P[i]![0], P[0]![1]]; }
    if (kind === 'dupRow') P.push(P[int(R, 0, P.length - 1)]!);
    if (kind === 'conflict') P.push([P[int(R, 0, P.length - 1)]![0], ys[xs.length]!]);
    P = shuffle(R, P);
    // the repeated input never sits in the next row (non-adjacent)
    if (kind === 'conflict' || kind === 'dupRow') for (let i = 1; i < P.length; i++) if (P[i]![0] === P[i - 1]![0]) { const j = (i + 1) % P.length; [P[i], P[j]] = [P[j]!, P[i]!]; }
  }
  if (R() < 0.4) P = P.slice().sort((a, b) => (a[0] as number) - (b[0] as number));
  const pic = tablePic(P, R() < 0.4 && P.length <= 7);
  const c = checkFunction(P);
  const opts: Opt[] = [];
  const sh = sharedOutput(P);
  if (c.fn) {
    opts.push({ html: 'A function: each input has exactly one output.', ok: true, say: kind === 'dupRow' ? 'Yes. The repeated row says the same thing twice: one input, one output.' : 'Yes. No input appears with two different outputs.' });
    if (kind === 'dupRow') { const d = P.find((p, i) => P.findIndex(q => q[0] === p[0]) !== i)!; opts.push({ html: `Not a function: x = ${hn(d[0])} appears twice.`, ok: false, mc: MC.dupRow, say: `Both rows give ${hn(d[0])} the SAME output, ${hn(d[1])}. A repeated identical row is still one output.` }); }
    if (kind === 'constant') opts.push({ html: 'Not a function: the output never changes.', ok: false, mc: MC.constant, say: 'A constant output is fine: each input still has exactly one output.' });
    if (sh && kind !== 'constant') opts.push({ html: `Not a function: the output ${hn(sh.y)} appears twice.`, ok: false, mc: MC.outUnique, say: 'Outputs may repeat. Check the INPUT column: no input has two different outputs.' });
    if (opts.length < 3) opts.push({ html: 'Not a function: the inputs are not in order.', ok: false, say: 'Order does not matter. Check each input: exactly one output.' });
    if (opts.length < 3) opts.push({ html: 'Not a function: some inputs are negative.', ok: false, say: 'Negative inputs are fine. Check each input: exactly one output.' });
    pic.hi = { note: 'one output each', col: 'link', rows: sh ? P.map((p, i) => [p, i] as const).filter(([p]) => p[1] === sh.y).map(([, i]) => i) : P.map((_, i) => i) };
  } else {
    const w = c.witness as { x: V; y1: V; y2: V };
    opts.push({ html: `Not a function: x = ${hn(w.x)} has the outputs ${hn(w.y1)} and ${hn(w.y2)}.`, ok: true, say: `Yes. The input ${hn(w.x)} appears twice, with two different outputs.` });
    if (!sh) opts.push({ html: 'A function: no output appears twice.', ok: false, mc: MC.outUnique, say: `That checks the outputs. Check the INPUT column: ${hn(w.x)} has two outputs.` });
    opts.push({ html: 'A function: each row has one input and one output.', ok: false, say: `Look across rows: the input ${hn(w.x)} is in two rows with different outputs.` });
    if (opts.length < 3) opts.push({ html: 'A function: the outputs go up and down.', ok: false, say: `Check the inputs: ${hn(w.x)} has two outputs.` });
    pic.hi = { note: `x = ${hn(w.x)}: ${hn(w.y1)} and ${hn(w.y2)}`, col: 'wrong', rows: P.map((p, i) => [p, i] as const).filter(([p]) => p[0] === w.x).map(([, i]) => i) };
  }
  return choose({ id: `tableVerdict-${n}`, family: 'tableVerdict', prompt: 'Does this table show y as a function of x?', board: '\\text{each input}\n\\text{exactly one output?}', picture: pic,
    solution: c.fn ? ['Scan the x column for a repeated input.', kind === 'dupRow' ? 'The repeated input has the same output both times.' : 'No input has two different outputs.', `So it is ${S('a function')}.`]
      : [`Scan the x column: ${A(hn((c.witness as { x: V }).x))} appears twice.`, 'Its two outputs are different.', `So it is ${S('not a function')}.`] }, R, opts);
};

// =====================================================================================================================
// 5. graph-as-pairs: a point is (input, output)
// =====================================================================================================================
const readPoint: Gen = (R, n) => {
  const two = R() < 0.5, step = two ? 2 : 1, M = two ? 10 : 6;
  let x = 0, y = 0;
  while (x === y || x === 0 || y === 0 || x === -y) { x = int(R, -M / step, M / step) * step; y = int(R, -M / step, M / step) * step; }
  const others: [number, number][] = [];
  while (others.length < 2) { const a = int(R, -M / step, M / step) * step, b = int(R, -M / step, M / step) * step; if (a !== x && !others.some(o => o[0] === a)) others.push([a, b]); }
  const pic: GraphPic = { kind: 'graph', x0: -M, x1: M, y0: -M, y1: M, xStep: step, yStep: step, xName: 'x (input)', yName: 'y (output)', equal: true,
    points: [{ key: 'm', x, y, col: 'pick' }, ...others.map((o, i) => ({ key: 'o' + i, x: o[0], y: o[1] }))], paths: [], hi: { note: `(${hn(x)}, ${hn(y)})`, col: 'pick', pts: ['m'], slice: { x, hits: [{ y, col: 'pick' }] } } };
  const it: FItem = {
    id: `readPoint-${n}`, family: 'readPoint', input: 'pair', pairLead: '(', pairOp: ',', prompt: `Write the <b class="pk">lavender</b> point as an ordered pair (input, output).${two ? ' Each grid line is 2 units.' : ''}`,
    board: '(x,\\ y) = \\,?', picture: pic, answer: { kind: 'pair', x, y },
    solution: [`Go straight down or up from the point to the x axis: the input is ${A(hn(x))}.`, `Go across to the y axis: the output is ${B(hn(y))}.`, `The pair is ${S(`(${hn(x)}, ${hn(y)})`)}: input first.`],
    check(r) {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type both numbers.' };
      if (r.x === x && r.y === y) return { ok: true, say: `Yes: (${hn(x)}, ${hn(y)}). The input ${hn(x)} goes with the output ${hn(y)}.` };
      if (r.x === y && r.y === x) return { ok: false, mc: MC.reverse, say: `The order is swapped. The input (across) comes first: (${hn(x)}, ${hn(y)}).` };
      if (two && (r.x * 2 === x || r.y * 2 === y)) return { ok: false, say: 'Each grid line is 2 units, not 1: read the numbers on the axes.' };
      return { ok: false, say: `Read across for the input, then up or down for the output: (${hn(x)}, ${hn(y)}).` };
    },
  };
  PROBES.set(it, [{ r: { kind: 'pair', x: y, y: x }, mc: MC.reverse }]);
  return it;
};
const outputAt: Gen = (R, n) => {
  for (;;) {
    const xs = sample(R, range(-6, 6), int(R, 4, 6)) as number[];
    const ys = xs.map(() => int(R, -6, 6));
    const P: Pair[] = xs.map((x, i) => [x, ys[i]!] as const);
    const target = pick(R, xs), right = ys[xs.indexOf(target)]!;
    const back = P.find(p => p[1] === target && p[0] !== target);
    if (right === target) continue;
    const pic = pointsPic(P);
    pic.hi = { note: `(${hn(target)}, ${hn(right)})`, col: 'pick', slice: { x: target, hits: [{ y: right, col: 'pick' }] } };
    return typedNum({ id: `outputAt-${n}`, family: 'outputAt', prompt: `The graph shows a function as points. What is its output for the input ${A(hn(target))}?`, board: `x = ${target} \\ \\to\\ y = \\,?`, picture: pic,
      solution: [`Find ${A(hn(target))} on the x axis (the input).`, `Go straight up or down to the point: it is at height ${B(hn(right))}.`, `The output is ${S(hn(right))}.`] },
    right, `Yes: the point (${hn(target)}, ${hn(right)}).`, back ? [{ v: back[0] as number, mc: MC.reverse, say: `That point has the OUTPUT ${hn(target)}. Find ${hn(target)} on the x axis instead, and go up or down to the point.` }] : [], `Find ${hn(target)} on the x axis, then go straight up or down to the point.`);
  }
};

// =====================================================================================================================
// 6. domain-range-sets
// =====================================================================================================================
const domainRange: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['one', 'many', 'split', 'split'] as Kind[]);
    const ins = sample(R, range(-6, 6), int(R, 3, 5));
    let P = shuffle(R, makeRel(R, kind, ins, sample(R, range(-6, 6), ins.length + 1)));
    if (R() < 0.3 && P.length < 8) P = shuffle(R, [...P, P[0]!]);
    const dom = sortVals(inputsOf(P)), ran = sortVals(outputsOf(P));
    if (setHtml(dom) === setHtml(ran)) continue;
    const askD = R() < 0.5;
    const rep = pick(R, ['pairs', 'table', 'map', 'graph'] as const);
    const right = askD ? dom : ran, other = askD ? ran : dom;
    const fn = checkFunction(P).fn;
    const opts: Opt[] = [
      { html: setHtml(right), ok: true, say: `Yes: the ${askD ? 'inputs' : 'outputs'}, each listed once.` },
      { html: setHtml(other), ok: false, mc: MC.swapDR, say: `Those are the ${askD ? 'outputs: the range' : 'inputs: the domain'}. The ${askD ? 'domain is the set of inputs' : 'range is the set of outputs'}.` },
    ];
    if (!fn) opts.push({ html: `There is none: it is not a function.`, ok: false, mc: MC.noDomain, say: `Every relation has a domain and a range, function or not. List its ${askD ? 'inputs' : 'outputs'}.` });
    else { const extra = pick(R, other.filter(v => !right.includes(v)).concat([7])); opts.push({ html: setHtml(sortVals([...right, extra])), ok: false, say: `${hn(extra)} is not one of the ${askD ? 'inputs' : 'outputs'}.` }); }
    const word = askD ? 'domain (the set of inputs)' : 'range (the set of outputs)';
    let picture: Pic | undefined, board = '';
    if (rep === 'pairs') board = pairsBoard(P);
    else if (rep === 'table') { picture = tablePic(P, R() < 0.5); board = '\\text{domain? range?}'; }
    else if (rep === 'map') { picture = mapPic(uniqPairs(P), 'input', 'output'); board = '\\text{domain? range?}'; }
    else { const Q = uniqPairs(P); picture = pointsPic(Q); board = '\\text{domain? range?}'; }
    return choose({ id: `domainRange-${n}`, family: 'domainRange', prompt: `What is the ${A(word)} of this relation?`, board, picture,
      solution: [`The domain is the set of inputs; the range is the set of outputs.`, `${askD ? 'Inputs' : 'Outputs'}, each listed once: ${S(setHtml(right))}.`, fn ? 'This relation is a function, but that does not matter here.' : 'This relation is not a function, and it still has a domain and a range.'] }, R, opts);
  }
};

// =====================================================================================================================
// 7. graph-recognition: the vertical-line idea
// =====================================================================================================================
type GKind = 'points' | 'hline' | 'vline' | 'parabola' | 'sideways' | 'circle' | 'pieces';
const graphVerdict: Gen = (R, n) => {
  const kind = pick(R, ['points', 'points', 'hline', 'vline', 'parabola', 'sideways', 'circle', 'pieces'] as GKind[]);
  const base = { kind: 'graph' as const, x0: -6, x1: 6, y0: -6, y1: 6, xStep: 1, yStep: 1, xName: 'x (input)', yName: 'y (output)', equal: true };
  let pic: GraphPic, opts: Opt[], sol: string[], extra = '';
  if (kind === 'points') {
    const xs = sample(R, range(-5, 5), int(R, 4, 5)) as number[];
    const ys = sample(R, range(-5, 5), xs.length + 1) as number[];
    const P: Pair[] = xs.map((x, i) => [x, ys[i]!] as const);
    const dx = pick(R, xs), y2 = ys[xs.length]!;
    P.push([dx, y2]);
    const y1 = P.find(p => p[0] === dx)![1] as number;
    pic = { ...base, points: P.map((p, i) => ({ key: 'p' + i, x: p[0] as number, y: p[1] as number })), paths: [], hi: { note: `x = ${hn(dx)}: ${hn(y1)} and ${hn(y2)}`, col: 'wrong', slice: { x: dx, hits: [{ y: y1, col: 'wrong' }, { y: y2, col: 'wrong' }] } } };
    opts = [
      { html: `Not a function: the input ${hn(dx)} has two points, at ${hn(y1)} and ${hn(y2)}.`, ok: true, say: `Yes. A slice at x = ${hn(dx)} meets two points: one input, two outputs.` },
      { html: 'A function: no two points are at the same height.', ok: false, mc: MC.outUnique, say: `Same height means a shared OUTPUT, which is allowed anyway. Check each input: x = ${hn(dx)} has two points.` },
      { html: 'A function: most slices meet only one point.', ok: false, mc: MC.examples, say: `Most is not every. The slice at x = ${hn(dx)} meets two points.` },
    ];
    sol = [`Slide a vertical slice across: at x = ${A(hn(dx))} it meets two points.`, `The input ${hn(dx)} has two outputs, ${hn(y1)} and ${hn(y2)}: ${S('not a function')}.`];
  } else if (kind === 'hline') {
    const c = nz(R, -5, 5);
    pic = { ...base, points: [], paths: [{ key: 'l', pts: [[-6, c], [6, c]] }], hi: { note: `every input → ${hn(c)}`, col: 'link', slice: { x: 2, hits: [{ y: c, col: 'link' }] } } };
    opts = [
      { html: 'A function: each input has exactly one output.', ok: true, say: `Yes. Every vertical slice meets the line once, at height ${hn(c)}.` },
      { html: 'Not a function: the output never changes.', ok: false, mc: MC.constant, say: `A function does not have to change. Every input has exactly one output: ${hn(c)}.` },
      { html: `Not a function: every input shares the output ${hn(c)}.`, ok: false, mc: MC.oneToOne, say: 'Sharing outputs is allowed. Each input has exactly one.' },
    ];
    sol = ['A vertical slice at any input meets the line exactly once.', `Every input has the one output ${hn(c)}: ${S('a function')}.`];
  } else if (kind === 'vline') {
    const c = nz(R, -5, 5);
    pic = { ...base, points: [], paths: [{ key: 'l', pts: [[c, -6], [c, 6]] }], hi: { note: `x = ${hn(c)}: every output`, col: 'wrong', slice: { x: c, hits: [{ y: -2, col: 'wrong' }, { y: 3, col: 'wrong' }] } } };
    opts = [
      { html: `Not a function: the input ${hn(c)} has every output, like ${hn(-2)} and 3.`, ok: true, say: `Yes. At x = ${hn(c)} the whole line sits on one slice: (${hn(c)}, ${hn(-2)}) and (${hn(c)}, 3) share an input.` },
      { html: 'A function: it is a straight line.', ok: false, mc: MC.everyRel, say: `A straight line can fail too. At x = ${hn(c)} there are infinitely many outputs.` },
      { html: `A function: it only uses the input ${hn(c)}.`, ok: false, mc: MC.everyRel, say: `Using one input is fine, but that one input has many outputs, like (${hn(c)}, ${hn(-2)}) and (${hn(c)}, 3).` },
    ];
    sol = [`A slice at x = ${A(hn(c))} lies along the whole line.`, `That one input has many outputs: ${S('not a function')}.`];
  } else if (kind === 'parabola') {
    const a = pick(R, [1, -1]), k = a > 0 ? int(R, -5, 0) : int(R, 0, 5);
    const lim = Math.floor(Math.sqrt(a > 0 ? 6 - k : k + 6));
    const xx = Math.min(2, lim);
    pic = { ...base, points: [], paths: [{ key: 'c', pts: fnPts(x => a * x * x + k, -3.2, 3.2) }], hi: { note: 'one output each', col: 'link', hline: a * xx * xx + k, slice: { x: xx, hits: [{ y: a * xx * xx + k, col: 'link' }] } } };
    opts = [
      { html: 'A function: each vertical slice meets the curve once.', ok: true, say: 'Yes. Every input has exactly one output, even though pairs of inputs share one.' },
      { html: `Not a function: ${hn(-xx)} and ${xx} reach the same output.`, ok: false, mc: MC.oneToOne, say: 'Two inputs sharing an output is allowed. Each input still has only one.' },
      { html: 'Not a function: it is not a straight line.', ok: false, mc: MC.linear, say: 'Curves can be functions. Every vertical slice meets this one once.' },
    ];
    sol = ['Every vertical slice meets the curve exactly once.', `A horizontal line meets it twice: that is a shared output, which is allowed. ${S('A function')}.`];
  } else if (kind === 'sideways') {
    const c = pick(R, [-4, -3, -2, 0]);
    pic = { ...base, points: [], paths: [{ key: 'c', pts: sidewaysPts(1, c, -3.2, 3.2) }], hi: { note: `x = ${hn(c + 4)}: 2 and −2`, col: 'wrong', slice: { x: c + 4, hits: [{ y: 2, col: 'wrong' }, { y: -2, col: 'wrong' }] } } };
    extra = `x = y^2${c ? ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}` : ''}`;
    opts = [
      { html: `Not a function: the slice at x = ${hn(c + 4)} meets it at 2 and ${hn(-2)}.`, ok: true, say: `Yes. (${hn(c + 4)}, 2) and (${hn(c + 4)}, ${hn(-2)}): one input, two outputs.` },
      { html: 'A function: it is one smooth curve with no breaks.', ok: false, mc: MC.everyRel, say: `Smooth is not enough. The slice at x = ${hn(c + 4)} meets it twice.` },
      { html: 'A function: no two points have the same output.', ok: false, mc: MC.outUnique, say: `Check the INPUTS: x = ${hn(c + 4)} has two outputs.` },
    ];
    sol = [`A vertical slice at x = ${A(hn(c + 4))} meets the curve twice: at 2 and ${hn(-2)}.`, `One input, two outputs: ${S('not a function')}.`];
  } else if (kind === 'circle') {
    pic = { ...base, points: [], paths: [{ key: 'c', pts: circleUnits(0, 0, 5) }], hi: { note: 'x = 3: 4 and −4', col: 'wrong', slice: { x: 3, hits: [{ y: 4, col: 'wrong' }, { y: -4, col: 'wrong' }] } } };
    opts = [
      { html: `Not a function: the slice at x = 3 meets it at 4 and ${hn(-4)}.`, ok: true, say: `Yes. (3, 4) and (3, ${hn(-4)}) share the input 3.` },
      { html: 'A function: a circle is one smooth curve.', ok: false, mc: MC.everyRel, say: 'Smooth is not enough. The slice at x = 3 meets the circle twice.' },
      { html: 'A function: it has no breaks or corners.', ok: false, mc: MC.everyRel, say: `No breaks does not help: the input 3 has two outputs, 4 and ${hn(-4)}.` },
    ];
    sol = [`A vertical slice at x = ${A('3')} meets the circle at 4 and ${hn(-4)}.`, `One input, two outputs: ${S('not a function')}.`];
  } else {
    // two separate segments over different input intervals, closed ends
    const a = int(R, -5, -2), b = int(R, -1, 0), c2 = int(R, 1, 2), d = int(R, 3, 5);
    const y1 = int(R, -4, 4), y2 = int(R, -4, 4), y3 = int(R, -4, 4), y4 = int(R, -4, 4);
    pic = { ...base, points: [{ key: 'e1', x: a, y: y1 }, { key: 'e2', x: b, y: y2 }, { key: 'e3', x: c2, y: y3 }, { key: 'e4', x: d, y: y4 }],
      paths: [{ key: 's1', pts: [[a, y1], [b, y2]] }, { key: 's2', pts: [[c2, y3], [d, y4]] }], hi: { note: 'one output each', col: 'link', slice: { x: c2, hits: [{ y: y3, col: 'link' }] } } };
    extra = `\\text{allowed: } ${a} \\le x \\le ${b} \\text{ or } ${c2} \\le x \\le ${d}`;
    opts = [
      { html: 'A function: each allowed input has exactly one output.', ok: true, say: 'Yes. Every slice over an allowed input meets the graph once. The gap is between allowed inputs.' },
      { html: 'Not a function: the graph has a break.', ok: false, mc: MC.connected, say: `A function does not have to be in one piece. The inputs between ${b} and ${c2} are not allowed.` },
      { html: `Not a function: the inputs between ${b} and ${c2} have no output.`, ok: false, mc: MC.absent, say: `Those inputs are not allowed, so they need no output.` },
    ];
    sol = ['Check every ALLOWED input: each slice meets the graph once.', `The gap is outside the allowed inputs, so ${S('it is a function')}.`];
  }
  return choose({ id: `graphVerdict-${n}`, family: 'graphVerdict', prompt: `Does this graph show y as a function of x?`, board: extra || '\\text{each input}\n\\text{exactly one output?}', picture: pic, solution: sol }, R, opts);
};

// =====================================================================================================================
// 8. domain-range-intervals: a segment's inputs and outputs as inequalities
// =====================================================================================================================
const segInterval: Gen = (R, n) => {
  for (;;) {
    const x0 = int(R, -7, 2), x1 = int(R, x0 + 3, Math.min(8, x0 + 10));
    const flat = R() < 0.2;
    const y0 = int(R, -6, 6), y1 = flat ? y0 : int(R, -6, 6);
    if (!flat && Math.abs(y1 - y0) < 2) continue;
    const s: Seg = { x0, y0, c0: R() < 0.6, x1, y1, c1: R() < 0.6 };
    const askD = flat ? R() < 0.4 : R() < 0.5;
    const d = segDomain(s), r = segRange(s);
    const right = askD ? ineqHtml('x', d.lo, d.loIn, d.hi, d.hiIn) : ineqHtml('y', r.lo, r.loIn, r.hi, r.hiIn);
    const swap = askD ? ineqHtml('x', r.lo, r.loIn, r.hi, r.hiIn) : ineqHtml('y', d.lo, d.loIn, d.hi, d.hiIn);
    const I = askD ? d : r, v = askD ? 'x' : 'y';
    const style = ineqHtml(v, I.lo, !I.loIn, I.hi, !I.hiIn);
    const opts: Opt[] = [{ html: right, ok: true, say: `Yes. The ${askD ? 'inputs run' : 'outputs run'} from ${hn(I.lo)} to ${hn(I.hi)}${I.lo === I.hi ? '' : `; a closed dot is included, an open dot is not`}.` }];
    if (swap !== right) opts.push({ html: swap, ok: false, mc: MC.swapDR, say: `Those are the ${askD ? 'outputs' : 'inputs'} written with ${v}. The ${askD ? 'domain is read across, on the x axis' : 'range is read up and down, on the y axis'}.` });
    if (style !== right && I.lo !== I.hi) opts.push({ html: style, ok: false, mc: MC.endStyle, say: 'The dots are the other way round: a closed (filled) dot is included (≤), an open dot is not (<).' });
    opts.push({ html: `(${hn(x0)}, ${hn(y0)}) and (${hn(x1)}, ${hn(y1)})`, ok: false, mc: MC.endPoints, say: `Those are the end POINTS. The ${askD ? 'domain' : 'range'} is every ${askD ? 'input' : 'output'} value in between, written as an inequality.` });
    if (flat && !askD) opts.push({ html: 'y = 0', ok: false, mc: MC.flatZero, say: `Flat means the output stays the same, not that it is 0. It stays at ${hn(y0)}.` });
    if (opts.length < 3) continue;
    const pic: GraphPic = { kind: 'graph', x0: -8, x1: 8, y0: -8, y1: 8, xStep: 1, yStep: 1, xName: 'x (input)', yName: 'y (output)', equal: true,
      points: [{ key: 'a', x: x0, y: y0, open: !s.c0 }, { key: 'b', x: x1, y: y1, open: !s.c1 }], paths: [{ key: 's', pts: [[x0, y0], [x1, y1]] }],
      hi: { note: right, col: 'link', pts: ['a', 'b'], ...(askD ? {} : { hline: r.lo }) } };
    return choose({ id: `segInterval-${n}`, family: 'segInterval', prompt: `What is the ${A(askD ? 'domain' : 'range')} of this segment? (A filled dot is included; an open dot is not.)`, board: askD ? '\\text{domain = ?}' : '\\text{range = ?}', picture: pic,
      solution: [`${askD ? 'Inputs: read across, from the left end to the right end' : 'Outputs: read up and down, from the lowest point to the highest'}: ${hn(I.lo)} to ${hn(I.hi)}.`, I.lo === I.hi ? 'The segment is flat, so there is one output.' : 'Filled dot: ≤ (included). Open dot: < (not included).', `${askD ? 'Domain' : 'Range'}: ${S(right)}.`] }, R, opts);
  }
};

// =====================================================================================================================
// 9. explicit-rule-recognition
// =====================================================================================================================
function randRule(R: () => number): Rule {
  const k = pick(R, ['lin', 'lin', 'const', 'sq', 'abs'] as const);
  if (k === 'lin') return { kind: 'lin', a: nz(R, -5, 5), b: int(R, -5, 5) };
  if (k === 'const') return { kind: 'const', c: int(R, -5, 9) };
  if (k === 'sq') return { kind: 'sq', a: pick(R, [1, 1, -1, 2]), b: int(R, -3, 3) };
  return { kind: 'abs', a: pick(R, [1, 1, 2, -1]), b: int(R, -3, 3) };
}
const WORD_RULES: { t: string; rule: Rule }[] = [
  { t: 'double the number and add 5', rule: { kind: 'lin', a: 2, b: 5 } },
  { t: 'multiply the number by 3, then subtract 4', rule: { kind: 'lin', a: 3, b: -4 } },
  { t: 'square the number', rule: { kind: 'sq', a: 1, b: 0 } },
  { t: 'always answer 6', rule: { kind: 'const', c: 6 } },
  { t: 'take the distance of the number from 0', rule: { kind: 'abs', a: 1, b: 0 } },
];
const ruleVerdict: Gen = (R, n) => {
  const word = R() < 0.25 ? pick(R, WORD_RULES) : null;
  const r = word ? word.rule : randRule(R);
  const show = word ? `“${word.t}”` : ruleHtml(r);
  const allSet = R() < 0.5;
  const opts: Opt[] = [{ html: `Yes: each input gives exactly one value${r.kind === 'const' ? ', the same one every time' : ''}.`, ok: true, say: `Yes. Putting in one number gives one result: ${r.kind === 'const' ? 'always the same one' : 'a rule is one calculation'}.` }];
  if (r.kind === 'sq' || r.kind === 'abs') {
    opts.push({ html: 'No: its graph is not a straight line.', ok: false, mc: MC.linear, say: 'Functions can curve. Each input still gives exactly one output.' });
    opts.push({ html: `No: 2 and ${hn(-2)} give the same output.`, ok: false, mc: MC.oneToOne, say: 'Two inputs sharing an output is allowed. Each input gives only one.' });
  } else if (r.kind === 'const') {
    opts.push({ html: 'No: the output never changes.', ok: false, mc: MC.constant, say: 'A function does not have to change. Each input has exactly one output.' });
    opts.push({ html: 'No: x does not appear in the rule.', ok: false, mc: MC.constant, say: 'x does not have to appear. Every input still gets exactly one output.' });
  } else {
    opts.push({ html: 'No: a function has to be given as a table.', ok: false, say: 'A rule, a table, a graph and words can all show a function.' });
    opts.push({ html: 'Only for positive inputs.', ok: false, say: 'Negative inputs also give exactly one result each.' });
  }
  return choose({ id: `ruleVerdict-${n}`, family: 'ruleVerdict', prompt: `${word ? `The rule is ${A(show)}` : `The rule is ${A(show)}`}${allSet ? ', for every number x' : ', for x = −2, −1, 0, 1, 2'}. Does it make y a function of x?`,
    board: word ? `\\text{${word.t}}` : ruleTex(r),
    solution: ['Put in any allowed x: the rule is one calculation.', 'One calculation gives one result.', `So each input has exactly one output: ${S('a function')}.`] }, R, opts);
};
const ruleOutput: Gen = (R, n) => {
  const r = randRule(R);
  const x = r.kind === 'sq' || r.kind === 'abs' ? nz(R, -4, -1) * (R() < 0.75 ? 1 : -1) : nz(R, -5, 5);
  const y = evalRule(r, x);
  const wrongs: Wrong[] = [];
  if (r.kind === 'sq' && x < 0) wrongs.push({ v: -r.a * x * x + r.b, mc: MC.evenPow, say: `(${hn(x)})² is (${hn(x)}) × (${hn(x)}) = ${x * x}: a negative times a negative is positive.` });
  if (r.kind === 'abs' && x < 0) wrongs.push({ v: r.a * x + r.b, say: `|${hn(x)}| is ${Math.abs(x)}: the distance from 0 is never negative.` });
  if (r.kind === 'lin') wrongs.push({ v: r.a * -x + r.b, say: `Watch the sign of x: put in (${hn(x)}).` });
  const steps = r.kind === 'lin' ? `${r.a} · (${hn(x)})${r.b ? (r.b > 0 ? ` + ${r.b}` : ` − ${-r.b}`) : ''}` : r.kind === 'sq' ? `${r.a === 1 ? '' : r.a === -1 ? '−' : r.a + ' · '}(${hn(x)})²${r.b ? (r.b > 0 ? ` + ${r.b}` : ` − ${-r.b}`) : ''}` : r.kind === 'abs' ? `${r.a === 1 ? '' : r.a === -1 ? '−' : r.a + ' · '}|${hn(x)}|${r.b ? (r.b > 0 ? ` + ${r.b}` : ` − ${-r.b}`) : ''}` : `${r.c}`;
  return typedNum({ id: `ruleOutput-${n}`, family: 'ruleOutput', prompt: `For the rule ${A(ruleHtml(r))}, what is the output when x = ${A(hn(x))}?`, board: `${ruleTex(r)}, \\quad x = ${x}`,
    solution: [`Put ${A(hn(x))} in for x: y = ${steps}.`, `y = ${S(hn(y))}. One input, one output.`] }, y, `Yes: y = ${steps} = ${hn(y)}.`, wrongs, `Put (${hn(x)}) in for x and work it out: y = ${steps}.`);
};

// =====================================================================================================================
// 10. pair-satisfies-equation
// =====================================================================================================================
const SOLS: Record<EqId, [number, number][]> = {
  sum7: [[3, 4], [2, 5], [1, 6], [-1, 8], [9, -2], [0, 7], [10, -3]],
  lin236: [[0, 2], [3, 0], [-3, 4], [6, -2], [9, -4], [-6, 6]],
  sideways: [[4, 2], [4, -2], [9, 3], [9, -3], [1, -1], [16, -4]],
  circle25: [[3, 4], [3, -4], [-3, 4], [4, -3], [0, 5], [0, -5], [-4, -3], [5, 0]],
};
const whichPair: Gen = (R, n) => {
  for (;;) {
    const e = pick(R, ['sum7', 'lin236', 'sideways', 'circle25'] as EqId[]), E = EQS[e];
    const [x, y] = pick(R, SOLS[e]);
    const opts: Opt[] = [{ html: `(${hn(x)}, ${hn(y)})`, ok: true, say: `Yes: x = ${hn(x)}, y = ${hn(y)} makes ${E.html} true.` }];
    if (!E.sat(y, x) && x !== y) opts.push({ html: `(${hn(y)}, ${hn(x)})`, ok: false, mc: MC.reverse, say: `The first number is x. With x = ${hn(y)} and y = ${hn(x)}, ${E.html} is false.` });
    const yw = y + pick(R, [1, -1, 2]);
    if (!E.sat(x, yw)) opts.push({ html: `(${hn(x)}, ${hn(yw)})`, ok: false, mc: MC.oneCoord, say: `The x fits, but check y too: with y = ${hn(yw)} the equation is false.` });
    const other: [number, number] = [x + 1, y - 2];
    if (!E.sat(other[0], other[1]) && opts.length < 3) opts.push({ html: `(${hn(other[0])}, ${hn(other[1])})`, ok: false, say: 'Substitute both numbers: the two sides do not match.' });
    if (opts.length < 3) continue;
    return choose({ id: `whichPair-${n}`, family: 'whichPair', prompt: `Which pair (x, y) makes ${A(E.html)} true?`, board: E.tex,
      solution: [`Substitute BOTH numbers, x first.`, `(${hn(x)}, ${hn(y)}): ${E.leftHtml(x, y)} = ${E.left(x, y)}${e === 'sideways' ? ` = x` : ''}. ${S('True')}.`] }, R, opts);
  }
};
const pairYesNo: Gen = (R, n) => {
  for (;;) {
    const e = pick(R, ['sum7', 'lin236', 'sideways', 'circle25'] as EqId[]), E = EQS[e];
    const s = pick(R, SOLS[e]);
    const mode = pick(R, ['true', 'true', 'swap', 'oneCoord'] as const);
    let [x, y] = s;
    if (mode === 'swap') [x, y] = [s[1], s[0]];
    if (mode === 'oneCoord') y = s[1] + pick(R, [1, -1, 2]);
    const ok = E.sat(x, y);
    if (mode !== 'true' && ok) continue;
    const opts: Opt[] = [
      { html: 'Yes: it makes the equation true.', ok, mc: !ok ? (mode === 'swap' ? MC.reverse : MC.oneCoord) : undefined, say: ok ? `Yes: ${E.leftHtml(x, y)} = ${E.left(x, y)}${e === 'sideways' ? ', and that is x' : ''}.` : mode === 'swap' ? `The numbers are swapped: x is the FIRST number. With x = ${hn(x)} and y = ${hn(y)} it is false.` : `x = ${hn(x)} can work, but with y = ${hn(y)} the equation is false. Check both numbers.` },
      { html: 'No: it makes the equation false.', ok: !ok, mc: ok && y < 0 && (e === 'sideways' || e === 'circle25') ? MC.evenPow : undefined, say: !ok ? `Right: ${E.leftHtml(x, y)} = ${E.left(x, y)}, and that does not match.` : y < 0 && (e === 'sideways' || e === 'circle25') ? `(${hn(y)})² = ${y * y}: a negative number squared is positive. So it IS true.` : `Substitute again: ${E.leftHtml(x, y)} = ${E.left(x, y)}. It is true.` },
      { html: 'You can’t tell until you solve for y.', ok: false, say: 'You do not need to solve anything: substitute both numbers and see if the equation is true.' },
    ];
    return choose({ id: `pairYesNo-${n}`, family: 'pairYesNo', prompt: `Does the pair ${A(`(${hn(x)}, ${hn(y)})`)} make ${B(E.html)} true?`, board: `${E.tex}\n${pairTex([x, y])}`,
      solution: [`x = ${hn(x)}, y = ${hn(y)}: x is the first number.`, `${E.leftHtml(x, y)} = ${E.left(x, y)}${e === 'sideways' ? `, and x = ${hn(x)}` : `, and the right side is ${E.right}`}.`, ok ? S('True: the pair fits.') : S('False: the pair does not fit.')] }, R, opts, true);
  }
};

// =====================================================================================================================
// 11. implicit-equation-check
// =====================================================================================================================
const implicitShows: Gen = (R, n) => {
  const v = pick(R, ['sideways', 'sideways', 'circle', 'vline', 'contrast'] as const);
  const base = { kind: 'graph' as const, xStep: 1, yStep: 1, xName: 'x (input)', yName: 'y (output)', equal: true };
  if (v === 'contrast') {
    const c = int(R, 4, 8), a = int(R, 1, c - 1);
    return choose({ id: `implicitShows-${n}`, family: 'implicitShows', prompt: `${A(`x + y = ${c}`)} can be rewritten as ${A(`y = ${c} − x`)}. Is y a function of x?`, board: `x + y = ${c} \\quad\\Rightarrow\\quad y = ${c} - x`,
      solution: [`y = ${c} − x is one calculation for each x.`, `So each input x gives exactly one y: ${S('a function')}.`] }, R, [
      { html: `Yes: each x gives one value of ${c} − x.`, ok: true, say: `Yes. For any x, ${c} − x is one number.` },
      { html: `No: (${a}, ${c - a}) and (${c - a}, ${a}) both work.`, ok: false, say: `Those are two different inputs, ${a} and ${c - a}. That is fine: each input still has one output.` },
      { html: 'No: an equation has to be solved for y already.', ok: false, say: `Writing it as y = ${c} − x shows each x gets one y. It is a function.` },
    ]);
  }
  let x: number, y1: number, y2: number, eq: string, pic: GraphPic, more: string;
  if (v === 'sideways') { const t = pick(R, [2, 3]); x = t * t; y1 = t; y2 = -t; eq = 'x = y^2'; more = t === 3 ? '(1, 1)' : '(9, 3)'; pic = { ...base, x0: -2, x1: 10, y0: -4, y1: 4, points: [{ key: 'a', x, y: y1, label: true }, { key: 'b', x, y: y2, label: true }], paths: [{ key: 'c', pts: sidewaysPts(1, 0, -3.15, 3.15) }], hi: { col: 'wrong', slice: { x, hits: [{ y: y1, col: 'wrong' }, { y: y2, col: 'wrong' }] } } }; }
  else if (v === 'circle') { const pr = pick(R, [[3, 4], [4, 3], [0, 5]] as const); x = pr[0]; y1 = pr[1]; y2 = -pr[1]; eq = 'x^2 + y^2 = 25'; more = '(5, 0)'; pic = { ...base, x0: -6, x1: 6, y0: -6, y1: 6, points: [{ key: 'a', x, y: y1, label: true }, { key: 'b', x, y: y2, label: true }], paths: [{ key: 'c', pts: circleUnits(0, 0, 5) }], hi: { col: 'wrong', slice: { x, hits: [{ y: y1, col: 'wrong' }, { y: y2, col: 'wrong' }] } } }; }
  else { x = pick(R, [2, 3, 4]); y1 = 0; y2 = int(R, 1, 3); eq = `x = ${x}`; more = `(${x}, ${hn(-1)})`; pic = { ...base, x0: -4, x1: 6, y0: -4, y1: 4, points: [{ key: 'a', x, y: y1, label: true }, { key: 'b', x, y: y2, label: true }], paths: [{ key: 'c', pts: [[x, -4], [x, 4]] }], hi: { col: 'wrong', slice: { x, hits: [{ y: y1, col: 'wrong' }, { y: y2, col: 'wrong' }] } } }; }
  const eh = eq.replace('^2', '²').replace('^2', '²');
  return choose({ id: `implicitShows-${n}`, family: 'implicitShows', prompt: `Both ${A(`(${hn(x)}, ${hn(y1)})`)} and ${A(`(${hn(x)}, ${hn(y2)})`)} make ${B(eh)} true. What does that show?`, board: `${eq}\n${pairTex([x, y1])},\\; ${pairTex([x, y2])}`, picture: pic,
    solution: [`Both pairs have the input ${A(hn(x))}.`, `Their outputs ${hn(y1)} and ${hn(y2)} are different.`, `One input, two outputs: ${eh} ${S('does not make y a function of x')}.`] }, R, [
    { html: `y is not a function of x: the input ${hn(x)} has two outputs, ${hn(y1)} and ${hn(y2)}.`, ok: true, say: `Yes. Two pairs with the same input and different outputs are enough to show it.` },
    { html: 'y is a function of x: every equation in x and y gives one.', ok: false, mc: MC.everyRel, say: `Not every equation does. Here the input ${hn(x)} has two outputs.` },
    { html: `y is a function of x: ${more} works too.`, ok: false, mc: MC.examples, say: `More pairs that work do not help. The two pairs with input ${hn(x)} already show two outputs.` },
  ]);
};

// =====================================================================================================================
// 12. match-representations: check every allowed input
// =====================================================================================================================
const sameFn: Gen = (R, n) => {
  for (;;) {
    const r: Rule = R() < 0.7 ? { kind: 'lin', a: nz(R, -3, 3), b: int(R, -3, 3) } : { kind: 'sq', a: 1, b: int(R, -3, 1) };
    const dom = sortVals(sample(R, range(-2, 3), int(R, 3, 5))) as number[];
    const same = R() < 0.45;
    const ys = dom.map(x => evalRule(r, x));
    const bad = new Set<number>();
    if (!same) {
      // they agree at one or two inputs only
      const agree = sample(R, dom.map((_, i) => i), R() < 0.5 ? 1 : 2);
      dom.forEach((_, i) => { if (!agree.includes(i)) bad.add(i); });
      for (const i of bad) ys[i] = ys[i]! + pick(R, [1, 2, -1, 3]);
    }
    if (ys.some(y => Math.abs(y) > 9)) continue;
    const P: Pair[] = dom.map((x, i) => [x, ys[i]!] as const);
    const asGraph = R() < 0.4;
    const pic: Pic = asGraph ? pointsPic(P) : tablePic(P, R() < 0.5);
    const iBad = [...bad][0], iOk = dom.findIndex((_, i) => !bad.has(i));
    if (asGraph) (pic as GraphPic).hi = { col: same ? 'link' : 'wrong', pts: same ? P.map((_, i) => 'p' + i) : [...bad].map(i => 'p' + i) };
    else (pic as TablePic).hi = { col: same ? 'link' : 'wrong', rows: same ? P.map((_, i) => i) : [...bad] };
    const rep = asGraph ? 'graph' : 'table';
    const opts: Opt[] = same ? [
      { html: `The same: they agree at every allowed input, ${dom.map(hn).join(', ')}.`, ok: true, say: 'Yes. The allowed inputs are all listed, and the rule gives the same output at every one.' },
      { html: 'You can’t tell: checking inputs never proves they are the same.', ok: false, mc: MC.neverProves, say: `Here the allowed inputs are only ${dom.map(hn).join(', ')}. Checking all of them is a complete check.` },
      { html: `Different: one is a ${rep} and one is an equation.`, ok: false, say: 'The same function can be shown in different ways. Compare the outputs at each allowed input.' },
    ] : [
      { html: `Different: at x = ${hn(dom[iBad!]!)} the ${rep} gives ${hn(ys[iBad!]!)}, the rule gives ${hn(evalRule(r, dom[iBad!]!))}.`, ok: true, say: `Yes. One input where they disagree is enough.` },
      { html: `The same: at x = ${hn(dom[iOk]!)} both give ${hn(ys[iOk]!)}.`, ok: false, mc: MC.examples, say: `Agreeing at one input is not enough. At x = ${hn(dom[iBad!]!)} they give different outputs.` },
      { html: `The same: they both use the inputs ${dom.map(hn).join(', ')}.`, ok: false, say: `The same inputs, but not the same outputs: at x = ${hn(dom[iBad!]!)} they differ.` },
    ];
    return choose({ id: `sameFn-${n}`, family: 'sameFn', prompt: `The allowed inputs are ${A(setHtml(dom))}. Do the ${rep} and the rule ${B(ruleHtml(r))} describe the same function?`, board: `${ruleTex(r)}\n\\text{for } x \\text{ in } ${setTex(dom)}`, picture: pic,
      solution: same ? ['Check EVERY allowed input.', `${dom.map((x, i) => `x = ${hn(x)}: ${hn(ys[i]!)}`).join('; ')}. The rule gives the same each time.`, S('The same function.')]
        : ['Check every allowed input.', `At x = ${A(hn(dom[iBad!]!))} the ${rep} gives ${hn(ys[iBad!]!)} but the rule gives ${hn(evalRule(r, dom[iBad!]!))}.`, S('Different functions.')] }, R, opts);
  }
};

// =====================================================================================================================
// 13. sample-vs-complete
// =====================================================================================================================
const sampleOrAll: Gen = (R, n) => {
  const a = nz(R, -3, 4), b = int(R, -4, 6);
  const xs = [1, 2, 3, 4].slice(0, int(R, 3, 4));
  const P: Pair[] = xs.map(x => [x, a * x + b] as const);
  const k = xs.length + int(R, 1, 2), cont = a * k + b;
  const isSample = R() < 0.5;
  const pic = tablePic(P, true, 'x', 'y');
  const lead = isSample ? `These are ${A('a few rows')} of a rule whose inputs can be any number.` : `These are ${A('all')} the allowed inputs and their outputs.`;
  return choose({ id: `sampleOrAll-${n}`, family: 'sampleOrAll', prompt: `${lead} What is the output for x = ${A(k)}?`, board: isSample ? '\\text{a sample of the rows}' : `\\text{allowed inputs: } ${setTex(xs)}`, picture: pic,
    solution: isSample ? ['These rows are only a sample.', `Many rules fit them, and they can give different outputs at ${k}.`, S('You can’t tell from the rows alone.')]
      : [`The allowed inputs are only ${setHtml(xs)}.`, `${k} is not allowed, so it has no output.`, S('There is none.')] }, R, isSample ? [
    { html: 'You can’t tell from these rows: other rules fit them too.', ok: true, say: `Yes. A few rows do not fix the rule. Different rules can agree here and differ at ${k}.` },
    { html: `${hn(cont)}, by continuing the pattern`, ok: false, mc: MC.fewTerms, say: 'The pattern might not continue. These rows are only a sample, and other rules fit them too.' },
    { html: `There is none: ${k} is not in the table.`, ok: false, say: 'The rule takes any number. The table just does not show every row.' },
  ] : [
    { html: `There is none: ${k} is not an allowed input.`, ok: true, say: `Yes. The table lists every allowed input, and ${k} is not one of them.` },
    { html: `${hn(cont)}, by continuing the pattern`, ok: false, mc: MC.fewTerms, say: `The allowed inputs stop at ${xs[xs.length - 1]}. There is no row for ${k} to continue to.` },
    { html: 'You can’t tell: the table does not show it.', ok: false, say: `We can tell: the table is complete, so ${k} is not an allowed input.` },
  ]);
};

// =====================================================================================================================
// 14. compare-outputs-common-input
// =====================================================================================================================
const compareAt: Gen = (R, n) => {
  for (;;) {
    const r: Rule = { kind: 'lin', a: nz(R, -3, 3), b: int(R, -4, 4) };
    const xs = shuffle(R, range(1, 4).map(x => x)) as number[];
    const ys = xs.map(() => int(R, -6, 9));
    const half = R() < 0.25;
    const k = pick(R, xs);
    const aK = ys[xs.indexOf(k)]!, bK = evalRule(r, k);
    if (aK === bK && R() < 0.6) continue;
    const right = cmpWord(aK, bK);
    // mismatched: the k-th row (by position) is another input
    const posY = ys[k - 1]!, wrongVerdict = xs[k - 1] !== k ? cmpWord(posY, bK) : null;
    const asGraph = R() < 0.35;
    const P: Pair[] = xs.map((x, i) => [x, ys[i]!] as const);
    const pic: Pic = asGraph ? pointsPic(P, { yName: 'A (output)' }) : tablePic(P, false, 'x', 'A');
    const note = `x = ${k}:  A ${hn(aK)},  B ${hn(bK)}`;
    if (asGraph) (pic as GraphPic).hi = { note, col: 'pick', slice: { x: k, hits: [{ y: aK, col: 'pick' }] } };
    else (pic as TablePic).hi = { note, col: 'pick', rows: [xs.indexOf(k)] };
    const words: Record<string, string> = { A: 'A has the greater output.', B: 'B has the greater output.', same: 'They have the same output.' };
    const opts: Opt[] = (['A', 'B', 'same'] as const).map(w => ({ html: words[w]!, ok: w === right, mc: w !== right && w === wrongVerdict ? MC.mismatch : undefined,
      say: w === right ? `Yes. At x = ${k}: A gives ${hn(aK)}, B gives ${hn(bK)}.` : w === wrongVerdict ? `Use the row where x = ${k}, not the ${['first', 'second', 'third', 'fourth'][k - 1]} row. At x = ${k}: A gives ${hn(aK)}, B gives ${hn(bK)}.` : `At x = ${k}: A gives ${hn(aK)}, B gives ${hn(bK)}.` }));
    void half;
    return choose({ id: `compareAt-${n}`, family: 'compareAt', prompt: `Function A is the ${asGraph ? 'graph' : 'table'}; function B is ${B(ruleHtml(r).replace('y =', 'y ='))}. At the input ${A(`x = ${k}`)}, which output is greater?`, board: `\\text{B: } ${ruleTex(r)}\n\\text{at } x = ${k}`, picture: pic,
      solution: [`A at x = ${k}: ${asGraph ? 'the point above x = ' + k : 'the row with x = ' + k} gives ${A(hn(aK))}.`, `B at x = ${k}: ${ruleHtml(r).replace('x', `(${k})`)} = ${B(hn(bK))}.`, S(words[right]!)] }, R, opts, true);
  }
};
const crossover: Gen = (R, n) => {
  for (;;) {
    // A: a table with a slow change; B: a rule that starts lower and grows faster (or the reverse)
    const aStart = int(R, 3, 9), aStep = int(R, 0, 1), bA = int(R, 2, 4), bB = int(R, -4, aStart - bA - 1);
    const xs = [1, 2, 3, 4, 5];
    const ya = xs.map(x => aStart + aStep * (x - 1)), yb = xs.map(x => bA * x + bB);
    if (!(ya[0]! > yb[0]!)) continue;
    const later = xs.find(x => yb[x - 1]! > ya[x - 1]!);
    if (!later || later < 3) continue;
    const k = later + (R() < 0.5 && later < 5 ? 1 : 0);
    const r: Rule = { kind: 'lin', a: bA, b: bB };
    const P: Pair[] = xs.map((x, i) => [x, ya[i]!] as const);
    const pic = tablePic(P, true, 'x', 'A');
    pic.hi = { col: 'pick', rows: [k - 1] };
    return choose({ id: `crossover-${n}`, family: 'crossover', prompt: `Function A is the table; function B is ${B(ruleHtml(r))}. At x = 1, A’s output is greater. Is A’s output greater at ${A(`x = ${k}`)} too?`, board: `\\text{B: } ${ruleTex(r)}\n\\text{at } x = 1:\\ ${ya[0]} > ${yb[0]}`, picture: pic,
      solution: [`Compare again at x = ${k}.`, `A: ${A(hn(ya[k - 1]!))}. B: ${bA} · ${k} ${bB < 0 ? '−' : '+'} ${Math.abs(bB)} = ${B(hn(yb[k - 1]!))}.`, `${S('B is greater')} at x = ${k}: the lead changed.`] }, R, [
      { html: `No: at x = ${k}, B gives ${hn(yb[k - 1]!)} and A gives ${hn(ya[k - 1]!)}.`, ok: true, say: 'Yes. B grows faster and passes A. A comparison at one input says nothing about another.' },
      { html: 'Yes: A was greater at x = 1, so it stays greater.', ok: false, mc: MC.oneInput, say: `Check x = ${k} itself: B gives ${hn(yb[k - 1]!)}, A gives ${hn(ya[k - 1]!)}. B grows faster and passes A.` },
      { html: 'Yes: A’s table has the bigger numbers.', ok: false, say: `Compare at the same input: at x = ${k}, B gives ${hn(yb[k - 1]!)} and A gives ${hn(ya[k - 1]!)}.` },
    ]);
  }
};

// =====================================================================================================================
// 15. counterexample-witness
// =====================================================================================================================
const pickWitness: Gen = (R, n) => {
  for (;;) {
    const noOut = R() < 0.2;
    if (noOut) {
      const set = sortVals(sample(R, range(1, 8), 4)) as number[];
      const gone = pick(R, set), outs = sample(R, range(0, 9), 4);
      const Q: Pair[] = set.filter(x => x !== gone).map((x, i) => [x, i === 1 ? outs[0]! : outs[i]!] as const);
      const sh = sharedOutput(Q);
      const pic = mapPic(Q, 'input', 'output', true, set);
      return choose({ id: `pickWitness-${n}`, family: 'pickWitness', prompt: `The allowed inputs are ${A(setHtml(set))}, and this is the whole assignment. Which fact shows it is NOT a function?`, board: `\\text{allowed inputs: } ${setTex(set)}`, picture: { ...pic, hi: { col: 'wrong', arrows: [] }, missing: gone } as MapPic,
        solution: [`Every allowed input needs exactly one output.`, `${A(gone)} is allowed and has no arrow: that is the counterexample.`] }, R, [
        { html: `The allowed input ${gone} has no output.`, ok: true, say: `Yes. ${gone} is allowed, so it needs one output, and it has none.` },
        sh ? { html: `${sh.x1} and ${sh.x2} share the output ${sh.y}.`, ok: false, mc: MC.oneToOne, say: 'Sharing an output is allowed. That is not a counterexample.' }
          : { html: 'The outputs are all different.', ok: false, mc: MC.oneToOne, say: 'Different outputs are fine. Look for an allowed input with no output.' },
        { html: 'It does not look like a function.', ok: false, mc: MC.noWitness, say: `A proof names one input. Here: ${gone} has no output.` },
      ]);
    }
    const xs = sample(R, range(-8, 8), 5) as number[];
    const ys = sample(R, range(-8, 8), 6) as number[];
    const P: Pair[] = xs.map((x, i) => [x, ys[i]!] as const);
    const wx = xs[0]!, wy2 = ys[5]!;
    P.push([wx, wy2]);
    // a shared output (allowed) between two other inputs
    P[3] = [P[3]![0], P[2]![1]];
    const dup = P[4]!; P.push(dup);
    const Q = shuffle(R, P);
    const c = checkFunction(Q);
    if (c.fn || c.witness?.kind !== 'two' || c.witness.x !== wx) continue;
    const y1 = P[0]![1];
    const asGraph = R() < 0.4;
    const pic: Pic = asGraph ? pointsPic(uniqPairs(Q)) : tablePic(Q, false);
    const note = `x = ${hn(wx)}: ${hn(y1)} and ${hn(wy2)}`;
    if (asGraph) (pic as GraphPic).hi = { note, col: 'wrong', slice: { x: wx, hits: [{ y: y1 as number, col: 'wrong' }, { y: wy2, col: 'wrong' }] } };
    else (pic as TablePic).hi = { note, col: 'wrong', rows: Q.map((p, i) => [p, i] as const).filter(([p]) => p[0] === wx).map(([, i]) => i) };
    const opts: Opt[] = [
      { html: `(${hn(wx)}, ${hn(y1)}) and (${hn(wx)}, ${hn(wy2)}): the input ${hn(wx)} has two outputs.`, ok: true, say: 'Yes. One input with two different outputs, quoted from the relation.' },
      { html: `(${hn(P[2]![0])}, ${hn(P[2]![1])}) and (${hn(P[3]![0])}, ${hn(P[3]![1])}): two inputs share an output.`, ok: false, mc: MC.oneToOne, say: 'Sharing an output is allowed, so it proves nothing. Find an input with two outputs.' },
      { html: 'It fails the vertical line test.', ok: false, mc: MC.noWitness, say: `True, but a proof names WHERE: the input ${hn(wx)} with outputs ${hn(y1)} and ${hn(wy2)}.` },
    ];
    if (!asGraph) opts.push({ html: `(${hn(dup[0])}, ${hn(dup[1])}) appears twice.`, ok: false, mc: MC.dupRow, say: `A repeated identical row gives the same output twice. It is not a counterexample.` });
    return choose({ id: `pickWitness-${n}`, family: 'pickWitness', prompt: `Which of these proves that this relation is ${A('not a function')}?`, board: '\\text{not a function: prove it}', picture: pic,
      solution: [`A counterexample is one input with two different outputs.`, `${A(hn(wx))} goes to ${hn(y1)} and to ${hn(wy2)}.`, `${S(`(${hn(wx)}, ${hn(y1)}) and (${hn(wx)}, ${hn(wy2)})`)} prove it.`] }, R, opts);
  }
};
const witnessInput: Gen = (R, n) => {
  for (;;) {
    const xs = sample(R, range(-6, 6), 4) as number[];
    const ys = sample(R, range(-6, 6), 5) as number[];
    const P: Pair[] = xs.map((x, i) => [x, ys[i]!] as const);
    const wx = xs[1]!;
    P.push([wx, ys[4]!]);
    P[3] = [P[3]![0], P[2]![1]];   // a shared output between two other inputs
    const Q = shuffle(R, P);
    const c = checkFunction(Q);
    if (c.fn || (c.witness as { x: V }).x !== wx) continue;
    const sh = sharedOutput(Q)!;
    const asGraph = R() < 0.5;
    const pic: Pic = asGraph ? pointsPic(Q) : tablePic(Q, R() < 0.5);
    const note = `x = ${hn(wx)}: ${hn(ys[1]!)} and ${hn(ys[4]!)}`;
    if (asGraph) (pic as GraphPic).hi = { note, col: 'wrong', slice: { x: wx, hits: [{ y: ys[1]!, col: 'wrong' }, { y: ys[4]!, col: 'wrong' }] } };
    else (pic as TablePic).hi = { note, col: 'wrong', rows: Q.map((p, i) => [p, i] as const).filter(([p]) => p[0] === wx).map(([, i]) => i) };
    const wrongs: Wrong[] = [
      { v: sh.x1 as number, mc: MC.oneToOne, say: `${sh.x1} shares its output with ${sh.x2}. That is allowed. Find an input with two outputs.` },
      { v: sh.x2 as number, mc: MC.oneToOne, say: `${sh.x2} shares its output with ${sh.x1}. That is allowed. Find an input with two outputs.` },
      { v: sh.y as number, mc: MC.outUnique, say: `${sh.y} is an OUTPUT shared by two inputs, which is allowed. Look for an input with two outputs.` },
    ];
    return typedNum({ id: `witnessInput-${n}`, family: 'witnessInput', prompt: `This relation is not a function. Type the ${A('input')} that has two different outputs.`, board: '\\text{which input breaks it?}', picture: pic,
      solution: [`Look for an input that appears twice with different outputs.`, `${A(hn(wx))} goes to ${hn(ys[1]!)} and ${hn(ys[4]!)}.`, `Shared outputs (like ${hn(sh.y)}) are allowed.`] }, wx, `Yes: ${hn(wx)} has the outputs ${hn(ys[1]!)} and ${hn(ys[4]!)}.`, wrongs, 'Find an input (x value) that appears with two different outputs.');
  }
};

// =====================================================================================================================
// 16. examples-dont-prove
// =====================================================================================================================
const enoughProof: Gen = (R, n) => {
  const v = pick(R, ['graph', 'complete', 'rule'] as const);
  if (v === 'graph') {
    // points; most inputs one point, one input two
    const xs = range(-5, 5).filter((_, i) => i % 2 === 0) as number[];
    const ys = xs.map(() => int(R, -5, 5));
    const P: Pair[] = xs.map((x, i) => [x, ys[i]!] as const);
    const checked = sample(R, xs, 3).sort((a, b) => a - b);
    const bad = pick(R, xs.filter(x => !checked.includes(x)));
    let y2 = int(R, -5, 5); while (y2 === ys[xs.indexOf(bad)]) y2 = int(R, -5, 5);
    P.push([bad, y2]);
    const pic = pointsPic(P);
    pic.hi = { col: 'wrong', slice: { x: bad, hits: [{ y: ys[xs.indexOf(bad)]!, col: 'wrong' }, { y: y2, col: 'wrong' }] } };
    return choose({ id: `enoughProof-${n}`, family: 'enoughProof', prompt: `Riley checked the inputs ${A(checked.map(hn).join(', '))}: each slice met exactly one point. Riley says this proves the graph is a function. Is that right?`, board: `\\text{checked: } x = ${checked.join(',\\ ')}`, picture: pic,
      solution: ['Checking some inputs cannot prove “every input”.', `The slice at x = ${A(hn(bad))} meets two points.`, S('Not a function, and not proved by the checks.')] }, R, [
      { html: `No: checking some inputs proves nothing about the rest, and x = ${hn(bad)} has two points.`, ok: true, say: `Yes. The unchecked input ${hn(bad)} has two outputs.` },
      { html: 'Yes: every input Riley checked had one output.', ok: false, mc: MC.examples, say: `Some inputs are not all inputs. At x = ${hn(bad)} there are two points.` },
      { html: 'No: checking inputs can never prove a function.', ok: false, mc: MC.neverProves, say: 'Checking EVERY input of a finite set can prove it. The problem here is that Riley skipped some.' },
    ]);
  }
  if (v === 'complete') {
    const xs = sortVals(sample(R, range(-4, 6), 4)) as number[];
    const outs = sample(R, range(-5, 9), 4);
    const P: Pair[] = xs.map((x, i) => [x, i === 3 && R() < 0.5 ? outs[0]! : outs[i]!] as const);
    const sh = sharedOutput(P);
    const pic = tablePic(P, true);
    pic.hi = { col: 'link', rows: [0, 1, 2, 3] };
    return choose({ id: `enoughProof-${n}`, family: 'enoughProof', prompt: `The allowed inputs are exactly ${A(setHtml(xs))}. Riley checked all four rows: each input has one output. Does that prove it is a function?`, board: `\\text{allowed inputs: } ${setTex(xs)}`, picture: pic,
      solution: ['The input set is complete and small.', 'Riley checked every allowed input.', S('A complete check proves it: a function.')] }, R, [
      { html: 'Yes: every allowed input was checked, and each has one output.', ok: true, say: 'Yes. With a complete, finite input set, checking every input is a proof.' },
      { html: 'No: checking examples never proves anything.', ok: false, mc: MC.neverProves, say: 'Here the check covers EVERY allowed input. That is a complete check, and it proves it.' },
      sh ? { html: `No: ${hn(sh.x1)} and ${hn(sh.x2)} share an output.`, ok: false, mc: MC.oneToOne, say: 'Sharing an output is allowed. Each input has exactly one.' }
        : { html: 'No: there might be other inputs.', ok: false, mc: MC.neverProves, say: 'The allowed inputs are given: there are no others.' },
    ]);
  }
  const a = nz(R, 2, 5), b = int(R, 1, 9);
  return choose({ id: `enoughProof-${n}`, family: 'enoughProof', prompt: `Riley checked ${A(`y = ${a}x + ${b}`)} at x = 1, 2 and 3: one output each. The inputs can be any number. What proves that y is a function of x?`, board: `y = ${a}x + ${b}`,
    solution: ['Three checks cannot cover every number.', `But for ANY x, ${a}x + ${b} is one calculation with one result.`, S('That argument covers every input: a function.')] }, R, [
    { html: `For every x, ${a}x + ${b} is one calculation with one result.`, ok: true, say: 'Yes. An argument about every input proves it; examples cannot.' },
    { html: 'The three checks: they all gave one output.', ok: false, mc: MC.examples, say: 'Three inputs are not every input. The proof is that the rule is one calculation for ANY x.' },
    { html: 'Nothing can: you can never check every number.', ok: false, mc: MC.neverProves, say: `An argument can cover every number at once: ${a}x + ${b} is one calculation for any x.` },
  ]);
};

// =====================================================================================================================
// 17. context-direction
// =====================================================================================================================
interface Record2 { a: string; b: string; rows: [string, string][]; shared: string; pairA: [string, string] }
function makeRecord(R: () => number): Record2 {
  const v = pick(R, ['price', 'locker', 'temp'] as const);
  if (v === 'price') {
    const items = sample(R, ['pen', 'pencil', 'eraser', 'ruler', 'glue', 'tape'], 4), prices = sample(R, ['$1', '$2', '$3', '$4', '$5'], 3);
    const rows: [string, string][] = items.map((it, i) => [it, prices[i === 3 ? 0 : i]!]);
    return { a: 'item', b: 'price', rows, shared: prices[0]!, pairA: [items[0]!, items[3]!] };
  }
  if (v === 'locker') {
    const kids = sample(R, KIDS, 4), lockers = sample(R, ['12', '15', '21', '30', '33'], 3);
    const rows: [string, string][] = kids.map((k, i) => [k, lockers[i === 3 ? 0 : i]!]);
    return { a: 'student', b: 'locker', rows, shared: lockers[0]!, pairA: [kids[0]!, kids[3]!] };
  }
  const times = ['6 am', '9 am', '12 pm', '3 pm'], temps = sample(R, ['54°F', '61°F', '66°F', '70°F'], 3);
  const rows: [string, string][] = times.map((t, i) => [t, temps[i === 3 ? 1 : i]!]);
  return { a: 'time', b: 'temperature', rows, shared: temps[1]!, pairA: [times[1]!, times[3]!] };
}
const recordPic = (r: Record2): TablePic => ({ kind: 'table', xs: r.rows.map(x => x[0]), ys: r.rows.map(x => x[1]), xName: r.a, yName: r.b, hi: { col: 'wrong', rows: r.rows.map((x, i) => [x, i] as const).filter(([x]) => x[1] === r.shared).map(([, i]) => i) } });
const bothWays: Gen = (R, n) => {
  const r = makeRecord(R);
  const fwd = `${r.b} as a function of ${r.a}`, back = `${r.a} as a function of ${r.b}`;
  return choose({ id: `bothWays-${n}`, family: 'bothWays', prompt: `This is the complete record. Which are functions: ${A(fwd)} (${r.a} → ${r.b}), ${B(back)} (${r.b} → ${r.a}), both, or neither?`, board: `\\text{${r.a}} \\to \\text{${r.b}} \\ ?\n\\text{${r.b}} \\to \\text{${r.a}} \\ ?`, picture: recordPic(r),
    solution: [`${r.a} → ${r.b}: each ${r.a} has one ${r.b}. ${S('A function')}.`, `${r.b} → ${r.a}: ${r.shared} goes with ${r.pairA[0]} and ${r.pairA[1]}. ${S('Not a function')}.`] }, R, [
    { html: `Only ${r.a} → ${r.b}`, ok: true, say: `Yes. Each ${r.a} has one ${r.b}, but ${r.shared} goes with both ${r.pairA[0]} and ${r.pairA[1]}.` },
    { html: 'Both', ok: false, mc: MC.reverseFn, say: `Flipping can break it: ${r.shared} goes with ${r.pairA[0]} and ${r.pairA[1]}, so ${r.b} → ${r.a} is not a function.` },
    { html: 'Neither', ok: false, mc: MC.oneToOne, say: `${r.a} → ${r.b} IS a function: two ${r.a}s sharing ${r.shared} is allowed.` },
    { html: `Only ${r.b} → ${r.a}`, ok: false, mc: MC.outUnique, say: `That is the wrong way round. ${r.shared} has two ${r.a}s, so ${r.b} → ${r.a} fails; ${r.a} → ${r.b} works.` },
  ], true);
};
const reverseWitness: Gen = (R, n) => {
  const r = makeRecord(R);
  return choose({ id: `reverseWitness-${n}`, family: 'reverseWitness', prompt: `This is the complete record. Is ${A(`${r.a} a function of ${r.b}`)} (${r.b} → ${r.a})?`, board: `\\text{${r.b}} \\to \\text{${r.a}}\\ ?`, picture: recordPic(r),
    solution: [`Now ${r.b} is the input.`, `The input ${r.shared} goes with ${r.pairA[0]} and with ${r.pairA[1]}.`, S('Not a function in this direction.')] }, R, [
    { html: `No: ${r.shared} goes with both ${r.pairA[0]} and ${r.pairA[1]}.`, ok: true, say: `Yes. Read ${r.b} → ${r.a}: the input ${r.shared} has two outputs.` },
    { html: `Yes: each ${r.a} has exactly one ${r.b}.`, ok: false, mc: MC.reverseFn, say: `That is the other direction. With ${r.b} as the input, ${r.shared} has two ${r.a}s.` },
    { html: `No: two ${r.a}s are missing a ${r.b}.`, ok: false, say: `Every ${r.a} has a ${r.b}. The problem is ${r.shared}, which goes with two ${r.a}s.` },
  ]);
};

// =====================================================================================================================
// 18. qualitative-graphs
// =====================================================================================================================
interface Story { x: string; y: string; pts: [number, number][]; ticks: number[] }
function walkStory(R: () => number): Story {
  // distance from home: out, rest, back (back faster or slower), ends at home
  const t1 = pick(R, [8, 10, 12]), rest = pick(R, [5, 6, 8]), back = pick(R, [4, 6, 12, 14]);
  const d = pick(R, [6, 7, 8]);
  return { x: 'time (minutes)', y: 'distance from home', pts: [[0, 0], [t1, d], [t1 + rest, d], [t1 + rest + back, 0]], ticks: [0, t1, t1 + rest, t1 + rest + back] };
}
const segWord = (a: number, b: number) => `from ${a} to ${b} minutes`;
const readStory: Gen = (R, n) => {
  const v = pick(R, ['flat', 'down', 'home', 'faster', 'speed'] as const);
  if (v === 'speed') {
    const t = [0, pick(R, [3, 4]), pick(R, [8, 9]), pick(R, [12, 13])], top = 7;
    const pic: GraphPic = { kind: 'graph', qual: true, x0: 0, x1: 15, y0: 0, y1: 9, xStep: 1, yStep: 1, xName: 'time (minutes)', yName: 'speed of the bike', xTicks: t.map(v2 => ({ v: v2, t: String(v2) })), points: [], paths: [{ key: 'g', pts: [[0, 0], [t[1]!, top], [t[2]!, top], [t[3]!, 0]] }], hi: { col: 'pick', hline: top } };
    return choose({ id: `readStory-${n}`, family: 'readStory', prompt: `The graph shows the ${A('speed')} of a bike over time. What happens ${segWord(t[1]!, t[2]!)}?`, board: '\\text{speed over time}', picture: pic,
      solution: ['Flat means the output stays the same.', `The output here is the speed: ${S('the bike rides at a steady speed')}.`, 'The graph is not a picture of the road.'] }, R, [
      { html: 'The bike rides at a steady speed.', ok: true, say: 'Yes. The speed stays the same: flat means constant.' },
      { html: 'The bike rides along the flat top of a hill.', ok: false, mc: MC.picture, say: 'The graph is not a picture of the road. Its height is the SPEED, which stays the same.' },
      { html: 'The bike is stopped.', ok: false, mc: MC.flatZero, say: 'Stopped would be a speed of 0, on the time axis. Flat and high means a steady speed.' },
    ]);
  }
  const s = walkStory(R);
  const [p0, p1, p2, p3] = s.pts as [[number, number], [number, number], [number, number], [number, number]];
  const pic: GraphPic = { kind: 'graph', qual: true, x0: 0, x1: p3[0] + 4, y0: 0, y1: 9, xStep: 1, yStep: 1, xName: s.x, yName: s.y, xTicks: s.ticks.map(v2 => ({ v: v2, t: String(v2) })), points: [], paths: [{ key: 'g', pts: s.pts }] };
  const I = [segWord(p0[0], p1[0]), segWord(p1[0], p2[0]), segWord(p2[0], p3[0])];
  if (v === 'faster') {
    // going out vs coming back: same distance, the shorter time is faster
    const outT = p1[0] - p0[0], backT = p3[0] - p2[0];
    if (outT === backT) return readStory(R, n);
    const fast = outT < backT ? 0 : 2, slow = 2 - fast;
    pic.hi = { col: 'link', hline: p1[1] };
    return choose({ id: `readStory-${n}`, family: 'readStory', prompt: `Ana walks from home to a park and back. When is she ${A('moving faster')}: going out or coming back?`, board: '\\text{distance from home}', picture: pic,
      solution: ['Both parts cover the same distance.', `${fast === 0 ? 'Going out' : 'Coming back'} takes less time: that part is steeper.`, S(`Faster ${I[fast]!}.`)] }, R, [
      { html: `${fast === 0 ? 'Going out' : 'Coming back'}, ${I[fast]!}: that part is steeper.`, ok: true, say: 'Yes. Same distance in less time: steeper means faster.' },
      { html: `${slow === 0 ? 'Going out' : 'Coming back'}, ${I[slow]!}: it takes longer.`, ok: false, mc: MC.sameRate, say: 'Taking longer for the same distance is SLOWER. Compare how steep the two parts are.' },
      { html: 'The same speed: both cover the same distance.', ok: false, mc: MC.sameRate, say: 'Same distance, but not the same time. The steeper part is faster.' },
    ]);
  }
  if (v === 'home') {
    pic.hi = { col: 'link', hline: 0 };
    return choose({ id: `readStory-${n}`, family: 'readStory', prompt: `Ana walks from home to a park and back. When is she ${A('at home')}?`, board: '\text{distance from home}', picture: pic,
      solution: ['At home, her distance from home is 0: the graph touches the time axis.', `That happens at ${S(`0 and ${p3[0]} minutes`)}.`, `The flat part (${I[1]!}) is the park: the distance stays the same there, but it is not 0.`] }, R, [
      { html: `At 0 minutes and at ${p3[0]} minutes`, ok: true, say: 'Yes. Distance from home is 0 only where the graph touches the time axis.' },
      { html: I[1]!, ok: false, mc: MC.flatZero, say: 'Flat means her distance stays the same, not that it is 0. She is resting at the park then.' },
      { html: I[2]!, ok: false, say: 'Then she is on her way home: her distance is going down, but it is not 0 yet.' },
    ]);
  }
  const which = v === 'flat' ? 1 : 2;
  pic.hi = { col: 'link', pts: [] };
  return choose({ id: `readStory-${n}`, family: 'readStory', prompt: `Ana walks from home to a park and back. When does her distance from home ${A(v === 'flat' ? 'stay the same' : 'decrease')}?`, board: '\\text{distance from home}', picture: pic,
    solution: [v === 'flat' ? 'Flat means the output stays the same.' : 'Falling means the output decreases.', `That is ${S(I[which]!)}.`] }, R, [
    { html: I[which]!, ok: true, say: v === 'flat' ? 'Yes. The graph is flat there: her distance stays the same.' : 'Yes. The graph falls there: she gets closer to home.' },
    { html: I[which === 1 ? 2 : 1]!, ok: false, say: v === 'flat' ? 'That part falls: her distance decreases. Flat means it stays the same.' : 'That part is flat: her distance stays the same. Falling means it decreases.' },
    { html: I[0]!, ok: false, say: 'That part rises: her distance increases.' },
  ]);
};
/** a tiny unnumbered sketch for a choice button */
function sketchSvg(pts: [number, number][], tmax: number, ymax: number): string {
  const W = 200, H = 96, px = (t: number) => 14 + (t / tmax) * (W - 24), py = (y: number) => H - 12 - (y / ymax) * (H - 26);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ');
  return `<svg class="sketch" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path d="M14,8 L14,${H - 12} L${W - 6},${H - 12}" fill="none" stroke="#B7B0CC" stroke-width="2.5"/><path d="${d}" fill="none" stroke="#5AB4DC" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
const sketchStory: Gen = (R, n) => {
  const v = pick(R, ['walk', 'tub'] as const);
  const lab = (s: string, svg: string) => `${svg}<span class="sr">sketch: ${s}</span>`;
  if (v === 'walk') {
    const out = pick(R, [8, 10]), rest = pick(R, [5, 6]), back = pick(R, [3, 4]), d = 6;
    const right: [number, number][] = [[0, 0], [out, d], [out + rest, d], [out + rest + back, 0]];
    const zero: [number, number][] = [[0, 0], [out, d], [out + 0.6, 0], [out + rest + back, 0]];
    const same: [number, number][] = [[0, 0], [out, d], [out + rest, d], [out + rest + out, 0]];
    const T = out + rest + out + 1;
    return choose({ id: `sketchStory-${n}`, family: 'sketchStory', prompt: `Ana walks to the park at a steady pace, rests there, then ${A('jogs home faster')} than she walked. Which sketch shows her ${B('distance from home')} over time?`, board: '\\text{distance from home over time}',
      solution: ['Walking out: the distance rises steadily.', 'Resting at the park: the distance stays the same (flat), not 0.', `Jogging home faster: it falls ${S('more steeply')} back to 0.`] }, R, [
      { html: lab('rise, flat, steep fall', sketchSvg(right, T, 8)), ok: true, say: 'Yes. Up steadily, flat while she rests, then down more steeply because she is faster.' },
      { html: lab('rise, drop to 0, flat', sketchSvg(zero, T, 8)), ok: false, mc: MC.flatZero, say: 'Resting at the park keeps her distance from home the same. The graph stays flat at the park’s distance, not at 0.' },
      { html: lab('rise, flat, slow fall', sketchSvg(same, T, 8)), ok: false, mc: MC.sameRate, say: 'Here she comes home as slowly as she went. Faster means the fall is steeper.' },
    ]);
  }
  const fill = pick(R, [5, 6]), stay = pick(R, [6, 8]), drain = pick(R, [2, 3]), h = 7;
  const right: [number, number][] = [[0, 0], [fill, h], [fill + stay, h], [fill + stay + drain, 0]];
  const pic2: [number, number][] = [[0, 0], [fill, h], [fill + stay * 0.5, h + 0.8], [fill + stay, h], [fill + stay + drain, 0]];
  const slow: [number, number][] = [[0, 0], [fill, h], [fill + stay, h], [fill + stay + fill * 1.6, 0]];
  const T = fill + stay + fill * 1.6 + 1;
  return choose({ id: `sketchStory-${n}`, family: 'sketchStory', prompt: `A bathtub fills, Leo soaks for a while with the water level steady, then the tub ${A('drains quickly')}. Which sketch shows the ${B('water level')} over time?`, board: '\\text{water level over time}',
    solution: ['Filling: the level rises.', 'Soaking: the level stays the same: flat.', `Draining quickly: a ${S('steep')} fall to 0.`] }, R, [
    { html: lab('rise, flat, steep fall', sketchSvg(right, T, 9)), ok: true, say: 'Yes. Rising, flat, then a steep fall: a quick drain.' },
    { html: lab('rise, bump, steep fall', sketchSvg(pic2, T, 9)), ok: false, mc: MC.picture, say: 'The level is steady while he soaks, so that part is flat. The graph is not a picture of the tub.' },
    { html: lab('rise, flat, slow fall', sketchSvg(slow, T, 9)), ok: false, mc: MC.sameRate, say: 'That fall is slow. Draining quickly means a steep fall.' },
  ]);
};

export const GENS: Record<FamilyId, Gen> = {
  readMap, pairsCount, mapVerdict, pairVerdict, statedSet, contextInputs, tableVerdict, readPoint, outputAt, domainRange, graphVerdict,
  segInterval, ruleVerdict, ruleOutput, whichPair, pairYesNo, implicitShows, sameFn, sampleOrAll, compareAt, crossover, pickWitness,
  witnessInput, enoughProof, bothWays, reverseWitness, readStory, sketchStory,
};
// re-exported for the page and tests
export { flip, checkFunction };
