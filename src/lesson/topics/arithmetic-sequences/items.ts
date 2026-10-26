// items.ts: practice families for "Arithmetic sequences" (Algebra 1, secondary-t6-10). Every family is generated
// from templates, checked exactly (seq.ts), and every wrong answer it recognises carries a misconception id from
// math-curriculum-essentials/misconceptions.json. A generator gets the sub-goal it practises (plan.ts). Formulas are
// asked as choices among forms that differ by one typical slip, or as numbers that pin the form down (a_1 and d in
// a_n = □ + □(n − 1)); values and positions are typed. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, int, pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import type { SeqPic } from './pictures';
import {
  type Nm, type RecDef, A, atH, atT, diffs, expRH, expRT, jumpH, linH, linT, nH, nT, position, r6, rangeH, rangeT, recH, recT, sgH,
  term, terms, usd,
} from './seq';

export interface QItem extends Item { picture?: SeqPic }
type Gen = (R: () => number, n: number, sg?: string) => QItem;

// ---------- misconception ids ----------
export const MC = {
  examples: 'mc.reasoning-language.examples-as-proof',
  illusion: 'mc.linear-functions.illusion-of-linearity',
  firstRows: 'mc.functions-concept.initial-rows-only-model-check',
  mustRise: 'mc.linear-functions.constant-change-must-increase',
  reversed: 'mc.advanced-algebra.difference-direction-reversed',
  shiftAdd: 'mc.functions-concept.shifted-input-added-to-output',
  swapIO: 'mc.functions-concept.misreads-input-in-notation',
  fTimes: 'mc.functions-concept.f-of-x-as-multiplication',
  subMis: 'mc.sequences-series.subscript-notation-misread',
  posVal: 'mc.sequences-series.position-value-confusion',
  swapXY: 'mc.coordinate-geometry.reverses-coordinate-order',
  fracIdx: 'mc.functions-concept.discrete-quantity-allows-fractions',
  dropStart: 'mc.linear-functions.drops-start-value',
  curIdx: 'mc.sequences-series.current-index-replaces-previous-term',
  noSeed: 'mc.sequences-series.initial-condition-omitted',
  sameSide: 'mc.sequences-series.recursive-rule-index-wrong',
  nSteps: 'mc.sequences-series.n-steps-for-nth-term',
  partial: 'mc.properties.partial-distribution',
  shift1: 'mc.sequences-series.index-shifted-by-one',
  a1Coef: 'mc.sequences-series.first-term-as-index-coefficient',
  constN: 'mc.sequences-series.constant-case-in-solving-n',
  rewriteReset: 'mc.sequences-series.algebraic-rewrite-resets-index-domain',
  inputStep: 'mc.linear-functions.ignores-input-step',
  ruleAsPos: 'mc.sequences-series.term-to-term-rule-as-position-rule',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  coefNotD: 'mc.sequences-series.coefficient-not-recognized-as-difference',
  firstAs0: 'mc.sequences-series.first-term-treated-as-index-zero-value',
  oldRange: 'mc.functions-concept.keeps-old-parameter-interval',
  noRange: 'mc.sequences-series.requested-index-range-omitted',
  oneEq: 'mc.functions-concept.unique-equation-for-graph',
  relabelExt: 'mc.sequences-series.relabel-confused-with-extend',
  rangeOpt: 'mc.sequences-series.index-range-treated-as-optional',
} as const;

// ---------- helpers ----------
const nI = '<i>n</i>', dI = '<i>d</i>';
const F: Nm = { s: 'f', fn: true };
const nz = (R: () => number, lo: number, hi: number) => { for (;;) { const v = int(R, lo, hi); if (v !== 0) return v; } };
const FRAC = [0.25, 0.5, 0.75, 1.5, 2.5];
/** a common difference: 'mix' = mostly whole numbers, some negative, some 0, some fractional */
function pickD(R: () => number, mode: 'mix' | 'nz' | 'int' | 'pos'): number {
  const r = R();
  if (mode === 'pos') return int(R, 2, 9);
  if (mode === 'int') return r < 0.6 ? int(R, 2, 9) : -int(R, 2, 9);
  if (mode === 'mix' && r < 0.1) return 0;
  if (r < 0.52) return int(R, 2, 9);
  if (r < 0.8) return -int(R, 2, 9);
  return pick(R, FRAC) * (R() < 0.6 ? 1 : -1);
}
const isFrac = (v: number) => !Number.isInteger(v);
/** a start that suits d (a fractional d gets a whole start, so terms stay quarters) */
const pickA1 = (R: () => number, lo = -12, hi = 40) => int(R, lo, hi);
const listH = (vs: readonly number[]) => vs.map(nH).join(', ');
const listT = (vs: readonly number[]) => vs.map(nT).join(',\\ ');
const aN = atH(A, 'n'), aNT = atT(A, 'n');
/** a number in brackets when negative (a subtrahend or factor): (−4) */
const pn = (v: number) => (r6(v) < 0 ? `(${nH(v)})` : nH(v));
/** "1 jump", "5 jumps" */
const pl = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`;

interface Opt { t: string; ok?: boolean; mc?: string; say: string }
interface Base { id: string; family: string; prompt: string; board: string; solution: string[]; picture?: SeqPic }
function choice(R: () => number, b: Base, opts: Opt[]): QItem {
  const seen = new Set<string>();
  const o0 = opts.filter(x => { const k = x.t.replace(/\s+/g, ' '); if (seen.has(k)) return false; seen.add(k); return true; });
  if (o0.filter(x => x.ok).length !== 1) throw new Error(`${b.family}: exactly one right choice`);
  const o = shuffle(R, o0.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...b, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(b.solution, o[i]!.t),
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const x = o[r.i]!;
      return { ok: !!x.ok, mc: x.ok ? undefined : x.mc, say: x.say };
    },
  };
}
type Cand = [number, string | undefined, string];
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
function numItem(b: Base & { unit?: string }, v: number, okSay: string, cands: Cand[], hint: string): QItem {
  return {
    ...b, input: 'num', answer: { kind: 'num', v },
    check(r: Response): Verdict {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
      if (near(r.v, v)) return { ok: true, say: okSay };
      for (const [c, mc, say] of cands) if (Number.isFinite(c) && !near(c, v) && near(r.v, c)) return { ok: false, mc, say };
      return { ok: false, say: hint };
    },
  };
}
type PCand = [number, number, string | undefined, string];
function pairItem(b: Base, x: number, y: number, form: { lead: string; op: string; tail?: string }, okSay: string, cands: PCand[], hint: string): QItem {
  return {
    ...b, input: 'pair', pairLead: form.lead, pairOp: form.op, pairTail: form.tail ?? '', answer: { kind: 'pair', x, y },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with numbers.' };
      if (near(r.x, x) && near(r.y, y)) return { ok: true, say: okSay };
      for (const [cx, cy, mc, say] of cands) if (!(near(cx, x) && near(cy, y)) && near(r.x, cx) && near(r.y, cy)) return { ok: false, mc, say };
      if (near(r.x, x)) return { ok: false, say: `The first box is right. ${hint}` };
      if (near(r.y, y)) return { ok: false, say: `The second box is right. ${hint}` };
      return { ok: false, say: hint };
    },
  };
}
const EXP_FORM = { lead: `${aN} =`, op: '+', tail: `(${nI} − 1)` };
/** a strip of the first `count` terms (values shown), optional '…' */
const stripOf = (vs0: readonly number[], o: { n0?: number; ell?: boolean; name?: string; jumps?: boolean } = {}): SeqPic['strip'] => {
  // wide values (−15.75) get fewer columns: every number stays 60 px
  const w = Math.max(...vs0.map(v => nH(v).length));
  const vs = w >= 5 ? vs0.slice(0, 4) : w === 4 ? vs0.slice(0, 5) : vs0.slice();
  return { ns: vs.map((_, i) => (o.n0 ?? 1) + i), vals: vs, ell: w >= 4 ? false : o.ell ?? true, name: o.name, idx: undefined, jumps: o.jumps ?? true };
};
/** a readable graph of n = 1..count: values on grid lines (step s), fixed axis */
function readable(R: () => number, count = 5): { a1: number; d: number; vs: number[]; y: { min: number; max: number; step: number } } {
  for (;;) {
    const s = pick(R, [1, 2, 5, 10]), j = nz(R, -2, 2), i = int(R, -2, 8);
    const a1 = s * i, d = s * j, vs = terms(a1, d, count);
    const lo = Math.min(0, ...vs), hi = Math.max(...vs);
    const min = Math.floor(lo / s) * s - (lo < 0 ? s : 0), max = Math.ceil(hi / s) * s + s;
    // no point one cell under the axis, where the n labels sit
    if (vs.some(v => v === -s)) continue;
    if ((max - min) / s <= 10 && (max - min) / s >= 4) return { a1, d, vs, y: { min, max, step: s } };
  }
}

// =====================================================================================================================
// 1 common-difference
// =====================================================================================================================
const findD: Gen = (R, n) => {
  const d = pickD(R, 'mix'), a1 = pickA1(R, -15, 30), vs = terms(a1, d, 5), D = diffs(vs);
  return numItem({
    id: `findD-${n}`, family: 'findD',
    prompt: `${listH(vs)}, …<br>Assume the list keeps changing by the same amount. What is the common difference ${dI}?`,
    board: `${listT(vs)},\\ \\dots`,
    solution: [`Later term minus earlier term, for EVERY neighbour pair: ${D.map(x => jumpH(x)).join(', ')}.`, `They are all the same, so d = ${ans(nH(d))}.`],
    picture: { strip: stripOf(vs), hold: ['jumps'] },
  }, d, d === 0 ? 'Right: nothing changes, so d = 0. A constant list is arithmetic too.' : `Right: d = ${nH(d)} (later minus earlier).`, [
    [-d, MC.reversed, `That is earlier minus later. d is LATER minus EARLIER: ${nH(vs[1]!)} − ${pn(vs[0]!)} = ${nH(d)}.`],
    [a1, undefined, 'That is the first term. d is the change from one term to the next.'],
  ], `Subtract each term from the next one: ${nH(vs[1]!)} − ${pn(vs[0]!)}.`);
};
const consistent: Gen = (R, n) => {
  const brk = R() < 0.4;
  const d = brk ? pickD(R, 'int') : pickD(R, 'mix'), a1 = pickA1(R, -10, 30);
  const vs = terms(a1, d, 5);
  if (brk) vs[4] = r6(vs[4]! + nz(R, -3, 3));
  const D = diffs(vs), X = D[0]!;
  const opts: Opt[] = [
    { t: `Consistent with an arithmetic sequence, d = ${nH(X)}`, ok: !brk, mc: brk ? MC.firstRows : undefined, say: brk ? `The first differences are ${nH(X)}, but check the LAST one: ${jumpH(D[3]!)}. Every difference must match.` : `Right: every difference is ${jumpH(X)}.` },
    { t: 'Not arithmetic: the differences are not all equal', ok: brk, say: brk ? `Right: ${D.map(jumpH).join(', ')}. The last one breaks the pattern.` : `Check them all: ${D.map(jumpH).join(', ')}. They are equal.` },
  ];
  if (X !== 0) opts.push({ t: `Consistent with an arithmetic sequence, d = ${nH(-X)}`, mc: MC.reversed, say: `d is later minus earlier: ${nH(vs[1]!)} − ${pn(vs[0]!)} = ${nH(X)}.` });
  if (X < 0) opts.push({ t: 'Not arithmetic: the terms go down', mc: MC.mustRise, say: 'A constant change can be negative: going down by the same amount each time is arithmetic.' });
  if (X === 0) opts.push({ t: 'Not arithmetic: the first terms do not change', mc: MC.mustRise, say: 'A change of 0 each time is a constant change: d = 0 is arithmetic.' });
  if (X > 0 && opts.length < 4) opts.push({ t: 'Not arithmetic: an arithmetic sequence must start at 0 or 1', say: 'It can start anywhere. Only the jumps must all be equal.' });
  return choice(R, {
    id: `consistent-${n}`, family: 'consistent',
    prompt: `Is ${listH(vs)} consistent with an arithmetic sequence? Check every difference.`,
    board: listT(vs),
    solution: [`Differences, later minus earlier: ${D.map(jumpH).join(', ')}.`, brk ? 'Not all equal: not arithmetic, even though the first ones match.' : `All equal: arithmetic with d = ${nH(X)}.`],
    picture: { strip: stripOf(vs, { ell: false }), hold: ['jumps'], hot: brk ? [3] : undefined },
  }, opts);
};

// =====================================================================================================================
// 2 function-notation
// =====================================================================================================================
const fRead: Gen = (R, n) => {
  const v = int(R, 0, 2), graph = v === 2;
  if (graph) {
    const g = readable(R, 5), k = int(R, 1, 5), back = R() < 0.5;
    const val = g.vs[k - 1]!, swapN = g.vs.findIndex(x => x === k) + 1;
    const pic: SeqPic = { graph: { pts: g.vs.map((y, i) => [i + 1, y]), y: g.y, yName: 'f(n)' } };
    if (!back) return numItem({ id: `fRead-${n}`, family: 'fRead', prompt: `The graph shows the sequence <i>f</i>. What is <i>f</i>(${k})?`, board: `f(${k}) = \\,?`, solution: [`f(${k}) is the output at input n = ${k}: go to ${k} on the n axis, then up to its point.`, `f(${k}) = ${ans(nH(val))}.`], picture: pic },
      val, `Right: the point above n = ${k} is at ${nH(val)}.`, [[swapN > 0 ? swapN : NaN, MC.swapXY, `That is the n whose OUTPUT is ${k}. f(${k}) means the input is ${k}.`]], `Find ${k} on the horizontal n axis and read the height of its point.`);
    const m = int(R, 1, 5), w = g.vs[m - 1]!;
    return numItem({ id: `fRead-${n}`, family: 'fRead', prompt: `The graph shows the sequence <i>f</i>. For which <i>n</i> is <i>f</i>(<i>n</i>) = ${nH(w)}?`, board: `f(n) = ${nT(w)}`, solution: [`Find the point at height ${nH(w)} and read its input below it.`, `n = ${ans(m)}.`], picture: pic },
      m, `Right: f(${m}) = ${nH(w)}.`, [[w, MC.swapIO, `${nH(w)} is the output. The question asks for the input n.`]], `Look for the point at height ${nH(w)}, then read n under it.`);
  }
  const a1 = int(R, 1, 30), d = nz(R, -6, 8), vs = terms(a1, d, 6), pic: SeqPic = { strip: { ...stripOf(vs, { ell: false, jumps: false })!, name: 'f(n)' } };
  if (v === 0) {
    const k = int(R, 1, 6), val = vs[k - 1]!, swapN = vs.findIndex(x => x === k) + 1;
    return numItem({ id: `fRead-${n}`, family: 'fRead', prompt: `The table shows the sequence <i>f</i>. What is <i>f</i>(${k})?`, board: `f(${k}) = \\,?`, solution: [`f(${k}) is the output in the column n = ${k}.`, `f(${k}) = ${ans(nH(val))}.`], picture: pic },
      val, `Right: f(${k}) = ${nH(val)}.`, [[swapN > 0 ? swapN : NaN, MC.swapIO, `That is the n whose output is ${k}. In f(${k}), ${k} is the input.`], [k * d, MC.fTimes, `f(${k}) is not f times ${k}: it is the output at input ${k}.`]], `Find the column with n = ${k} and read the value below it.`);
  }
  const m = int(R, 1, 6), w = vs[m - 1]!;
  return numItem({ id: `fRead-${n}`, family: 'fRead', prompt: `The table shows the sequence <i>f</i>. For which <i>n</i> is <i>f</i>(<i>n</i>) = ${nH(w)}?`, board: `f(n) = ${nT(w)}`, solution: [`Find ${nH(w)} among the outputs, then read the input above it.`, `n = ${ans(m)}.`], picture: pic },
    m, `Right: f(${m}) = ${nH(w)}.`, [[w >= 1 && w <= 6 ? vs[w - 1]! : NaN, MC.swapIO, `That is f(${nH(w)}). The question gives the OUTPUT ${nH(w)} and asks for its input.`]], `Find ${nH(w)} in the bottom row and read n above it.`);
};
const fMeaning: Gen = (R, n) => {
  if (R() < 0.5) {
    const k = int(R, 2, 12), v = nz(R, -20, 40);
    if (v === k) return fMeaning(R, n);
    return choice(R, { id: `fMeaning-${n}`, family: 'fMeaning', prompt: `For a sequence <i>f</i>, <i>f</i>(${k}) = ${nH(v)}. What does that say?`, board: `f(${k}) = ${nT(v)}`, solution: [`In f(input) = output, the number in the brackets is the input (the term number).`, `So the output at input ${k} is ${nH(v)}.`] }, [
      { t: `The output at input ${k} is ${nH(v)}: term number ${k} has the value ${nH(v)}`, ok: true, say: 'Right: f(k) names the output at input k.' },
      { t: `f times ${k} equals ${nH(v)}`, mc: MC.fTimes, say: 'f is the name of the function, not a number. The brackets hold the input.' },
      { t: `The output at input ${nH(v)} is ${k}`, mc: MC.swapIO, say: `The brackets hold the input: ${k} goes in, ${nH(v)} comes out.` },
    ]);
  }
  const a1 = int(R, 2, 30), d = nz(R, -7, 8);
  if (d === 1) return fMeaning(R, n);
  const vs = terms(a1, d, 6), k = int(R, 1, 4), right = vs[k]!, plus1 = vs[k - 1]! + 1;
  return choice(R, {
    id: `fMeaning-${n}`, family: 'fMeaning', prompt: `The table shows <i>f</i>. When <i>n</i> = ${k}, what is <i>f</i>(<i>n</i> + 1)?`, board: `f(n+1)\\ \\text{at}\\ n = ${k}`,
    solution: [`f(n + 1) is the output at the NEXT input: n + 1 = ${k + 1}.`, `f(${k + 1}) = ${ans(nH(right))}.`],
    picture: { strip: { ...stripOf(vs, { ell: false, jumps: false })!, name: 'f(n)' } },
  }, [
    { t: nH(right), ok: true, say: `Right: f(${k + 1}) = ${nH(right)}.` },
    { t: nH(plus1), mc: MC.shiftAdd, say: `That is f(${k}) + 1. f(n + 1) adds 1 to the INPUT, not to the output.` },
    { t: nH(vs[k - 1]!), say: `That is f(${k}). Move one input to the right: f(${k + 1}).` },
  ]);
};

// =====================================================================================================================
// 3 index-notation
// =====================================================================================================================
const termAt: Gen = (R, n) => {
  const v = int(R, 0, 2), a1 = int(R, 2, 7), d = int(R, 1, 4), n0 = v === 2 ? 0 : 1;
  const vs = terms(a1, d, 6, n0), pic: SeqPic = { strip: stripOf(vs, { n0, jumps: false }) };
  if (v === 1) {
    const m = int(R, 2, 6), w = vs[m - 1]!;
    return numItem({ id: `termAt-${n}`, family: 'termAt', prompt: `The sequence starts at <i>n</i> = 1: ${listH(vs)}, … In which position <i>n</i> is the term ${nH(w)}?`, board: `a_n = ${nT(w)},\\ n = \\,?`, solution: [`The position is the term number n, above the value.`, `${nH(w)} sits in column n = ${ans(m)}.`], picture: pic },
      m, `Right: ${nH(w)} is term number ${m}, so a<sub>${m}</sub> = ${nH(w)}.`, [[w, MC.posVal, `${nH(w)} is the VALUE. Its position is the term number above it.`]], 'Find the value, then read n above it.');
  }
  const k = int(R, n0 === 0 ? 1 : 2, 5), val = term(a1, d, k, n0);
  const cands: Cand[] = [[k, MC.posVal, `${k} is the position. a<sub>${k}</sub> is the VALUE at position ${k}.`]];
  if (n0 === 0) cands.unshift([term(a1, d, k - 1, n0), MC.shift1, `This table starts at n = 0, so the ${k}th value listed is a<sub>${k - 1}</sub>. Read the column labelled n = ${k}.`]);
  return numItem({ id: `termAt-${n}`, family: 'termAt', prompt: n0 === 0 ? `This sequence is labelled from <i>n</i> = 0: ${listH(vs)}, … What is a<sub>${k}</sub>?` : `${listH(vs)}, … (starting at <i>n</i> = 1). What is a<sub>${k}</sub>?`, board: `${atT(A, k)} = \\,?`, solution: [`a<sub>${k}</sub> is the value in the column n = ${k}${n0 === 0 ? ' (the labels start at 0)' : ''}.`, `a<sub>${k}</sub> = ${ans(nH(val))}.`], picture: pic },
    val, `Right: a<sub>${k}</sub> = ${nH(val)}.`, cands, `Read the column with n = ${k}.`);
};
const neighbor: Gen = (R, n) => {
  const d = nz(R, -9, 9), V = int(R, -20, 60), s = pick(R, [-1, 1, -2, 2]);
  if (d === 1 || d === -1) return neighbor(R, n);
  const sub = s === -1 ? 'n-1' : s === 1 ? 'n+1' : s === -2 ? 'n-2' : 'n+2', subH = sub.replace('-', '−');
  const right = V + s * d;
  return numItem({
    id: `neighbor-${n}`, family: 'neighbor', prompt: `In an arithmetic sequence with ${dI} = ${nH(d)}, the term a<sub>n</sub> = ${nH(V)}. What is a<sub>${subH}</sub>?`,
    board: `a_n = ${nT(V)},\\ d = ${nT(d)};\\ \\ a_{${sub}} = \\,?`,
    solution: [`a<sub>${subH}</sub> is the term ${Math.abs(s)} place${Math.abs(s) > 1 ? 's' : ''} ${s < 0 ? 'before' : 'after'} a<sub>n</sub>: ${Math.abs(s)} jump${Math.abs(s) > 1 ? 's' : ''} of ${nH(d)} ${s < 0 ? 'backward' : 'forward'}.`, `${nH(V)} ${s < 0 ? '−' : '+'} ${Math.abs(s)} × ${nH(d)} = ${ans(nH(right))}.`],
  }, right, `Right: a<sub>${subH}</sub> = ${nH(right)}.`, [
    [V + s, MC.subMis, `That changes the VALUE by ${Math.abs(s)}. The ${s < 0 ? '−' : '+'}${Math.abs(s)} sits in the subscript: it moves ${Math.abs(s)} place${Math.abs(s) > 1 ? 's' : ''} along the sequence.`],
    [V - s * d, MC.reversed, `${s < 0 ? 'Before' : 'After'} a<sub>n</sub> means ${s < 0 ? 'jumping back: subtract' : 'jumping on: add'} d.`],
  ], 'Each place along the sequence is one jump of d.');
};

// =====================================================================================================================
// 4 discrete-linear-graph
// =====================================================================================================================
const graphRead: Gen = (R, n) => {
  const g = readable(R, 5), pts = g.vs.map((y, i) => [i + 1, y] as [number, number]), pic: SeqPic = { graph: { pts, y: g.y }, hold: ['stairs'] };
  pic.graph!.stairs = true;
  const v = int(R, 0, 2);
  if (v === 0) {
    const k = int(R, 1, 5), val = g.vs[k - 1]!, swapN = g.vs.findIndex(x => x === k) + 1;
    return numItem({ id: `graphRead-${n}`, family: 'graphRead', prompt: `The points show a<sub>n</sub> for <i>n</i> = 1 to 5. What is a<sub>${k}</sub>?`, board: `${atT(A, k)} = \\,?`, solution: [`n is across, a<sub>n</sub> is up: the point (${k}, a<sub>${k}</sub>).`, `It is at height ${ans(nH(val))}.`], picture: pic },
      val, `Right: the point (${k}, ${nH(val)}).`, [[swapN > 0 ? swapN : NaN, MC.swapXY, `That reads the coordinates the wrong way round. n is across, the value is up.`]], `Find n = ${k} across, then read the height of that point.`);
  }
  if (v === 1) return numItem({ id: `graphRead-${n}`, family: 'graphRead', prompt: `The points show an arithmetic sequence. What is its common difference ${dI}?`, board: `d = a_{n+1} - a_n`, solution: [`From each point, one step right (n + 1) changes the height by d.`, `${nH(g.vs[1]!)} − ${pn(g.vs[0]!)} = ${ans(nH(g.d))}, the same at every step: the slope.`], picture: pic },
    g.d, `Right: d = ${nH(g.d)}, the rise for each step of 1 in n.`, [[-g.d, MC.reversed, `Later minus earlier: ${nH(g.vs[1]!)} − ${pn(g.vs[0]!)}.`]], 'Compare two neighbouring points: how much higher (or lower) is the next one?');
  const m = int(R, 1, 5), w = g.vs[m - 1]!;
  return numItem({ id: `graphRead-${n}`, family: 'graphRead', prompt: `The points show a<sub>n</sub>. For which <i>n</i> is a<sub>n</sub> = ${nH(w)}?`, board: `a_n = ${nT(w)}`, solution: [`Find the point at height ${nH(w)}; n is across.`, `n = ${ans(m)}.`], picture: pic },
    m, `Right: a<sub>${m}</sub> = ${nH(w)}.`, [[w, MC.swapXY, `${nH(w)} is the height (the value). n is the coordinate across.`]], `Find the point at height ${nH(w)} and read n under it.`);
};
const graphPick: Gen = (R, n) => {
  const a1 = nz(R, -6, 20), d = nz(R, -5, 6);
  if (a1 === d) return graphPick(R, n);   // a_1 = d: the points DO line up with (0, 0), so that distractor would be true
  if (R() < 0.5) {
    const k = int(R, 1, 6), x = k + 0.5;
    return choice(R, {
      id: `graphPick-${n}`, family: 'graphPick', prompt: `a<sub>n</sub> = ${expRH(a1, d)} for <i>n</i> ≥ 1. Is there a point of its graph at <i>n</i> = ${nH(x)}?`,
      board: `${aNT} = ${expRT(a1, d)},\\ n \\ge 1`,
      solution: ['The domain is the whole numbers n ≥ 1: term 1, term 2, …', `There is no term number ${nH(x)}, so no point there.`],
      picture: { graph: { pts: terms(a1, d, 7).map((y, i) => [i + 1, y]), guide: [d, a1 - d] }, hold: ['guide'] },
    }, [
      { t: `No: n is a term number, a whole number 1, 2, 3, …`, ok: true, say: 'Right: the graph is separate points; the dashed line is only a guide.' },
      { t: `Yes, at height ${nH(term(a1, d, x))}, halfway between two terms`, mc: MC.fracIdx, say: `That point is on the linear extension, but there is no ${nH(x)}th term.` },
      { t: `Yes: every point on the line through the terms belongs to the sequence`, mc: MC.fracIdx, say: 'Only whole term numbers belong: the line through the points is a visual guide, not the graph.' },
    ]);
  }
  return choice(R, {
    id: `graphPick-${n}`, family: 'graphPick', prompt: `Which describes the graph of a<sub>n</sub> = ${expRH(a1, d)} for <i>n</i> ≥ 1?`,
    board: `${aNT} = ${expRT(a1, d)},\\ n \\ge 1`,
    solution: [`One point for each term number n = 1, 2, 3, … The first is (1, ${nH(a1)}).`, `Each next point is 1 right and ${nH(d)} ${d > 0 ? 'up' : 'down'}: separate points on a line with slope ${nH(d)}.`],
  }, [
    { t: `Separate points (1, ${nH(a1)}), (2, ${nH(a1 + d)}), …, each ${Math.abs(d)} ${d > 0 ? 'higher' : 'lower'} than the one before`, ok: true, say: 'Right: a discrete graph on a line with slope d.' },
    { t: `A solid line through (1, ${nH(a1)}) with slope ${nH(d)}`, mc: MC.fracIdx, say: 'A sequence has no term 1.5: only the points at whole n belong.' },
    { t: `Separate points on a line through (0, 0) with slope ${nH(d)}`, mc: MC.dropStart, say: `The start is a<sub>1</sub> = ${nH(a1)}, so the points do not line up with (0, 0).` },
    { t: `Separate points starting at (0, ${nH(a1)}), each ${Math.abs(d)} ${d > 0 ? 'higher' : 'lower'} than the one before`, mc: MC.firstAs0, say: `a<sub>1</sub> = ${nH(a1)} sits at n = 1, not at n = 0.` },
  ]);
};

// =====================================================================================================================
// 5 recursive-generate
// =====================================================================================================================
const recNext: Gen = (R, n) => {
  const fn = R() < 0.4, N = fn ? F : A, d = pickD(R, 'mix'), a1 = pickA1(R, -10, 30), k = int(R, 3, isFrac(d) ? 4 : 6);
  const r: RecDef = { N, n0: 1, seed: a1, d, back: true, lo: 2 };
  const vs = terms(a1, d, k), val = vs[k - 1]!;
  return numItem({
    id: `recNext-${n}`, family: 'recNext', prompt: `${recH(r)}. What is ${atH(N, k)}?`, board: recT(r),
    solution: [`Start at ${atH(N, 1)} = ${nH(a1)} and apply the rule: each term is the one before ${d < 0 ? 'minus' : 'plus'} ${nH(Math.abs(d))}.`, `${vs.map(nH).join(', ')}: ${atH(N, k)} = ${ans(nH(val))}.`],
    picture: { strip: { ns: vs.map((_, i) => i + 1), vals: vs.map((v, i) => (i === 0 ? v : null)), reveal: vs.map((v, i) => (i === 0 ? null : v)), d, name: fn ? 'f(n)' : undefined } },
  }, val, `Right: ${vs.map(nH).join(', ')}.`, [
    [k + d, MC.curIdx, `That uses n = ${k} in place of the PREVIOUS TERM. ${atH(N, `${'n'}-1`)} is the term before, not the number n − 1.`],
    [a1 + k * d, MC.nSteps, `That is ${k} jumps. From term 1 to term ${k} there are ${k - 1} jumps.`],
    [vs[k - 2]!, undefined, `That is ${atH(N, k - 1)}. One more step.`],
  ], `Write the terms one after another: ${nH(a1)}, then ${nH(a1)} ${d < 0 ? '−' : '+'} ${nH(Math.abs(d))}, …`);
};
const recTwo: Gen = (R, n) => {
  const d = pickD(R, 'mix'), a1 = pickA1(R, -10, 30), nowNext = R() < 0.35;
  const r: RecDef = { N: F, n0: 1, seed: a1, d, back: true, lo: 2 };
  const t2 = term(a1, d, 2), t3 = term(a1, d, 3);
  return pairItem({
    id: `recTwo-${n}`, family: 'recTwo',
    prompt: nowNext ? `NEXT = NOW${sgH(d, false)}, starting with NOW = ${nH(a1)} as term 1. What are terms 2 and 3?` : `${recH(r)}. What are <i>f</i>(2) and <i>f</i>(3)?`,
    board: nowNext ? `\\text{NEXT} = \\text{NOW}${d < 0 ? ' - ' + nT(-d) : ' + ' + nT(d)},\\ \\text{start } ${nT(a1)}` : recT(r),
    solution: [`Term 2 = term 1 ${d < 0 ? '−' : '+'} ${nH(Math.abs(d))} = ${ans(nH(t2))}.`, `Term 3 = term 2 ${d < 0 ? '−' : '+'} ${nH(Math.abs(d))} = ${ans(nH(t3))}.`],
    picture: { strip: { ns: [1, 2, 3], vals: [a1, null, null], reveal: [null, t2, t3], d, ell: true, name: nowNext ? 'term' : 'f(n)' } },
  }, t2, t3, { lead: nowNext ? 'term 2 =' : '<i>f</i>(2) =', op: nowNext ? ',&nbsp; term 3 =' : ',&nbsp; <i>f</i>(3) =' }, 'Right: each term is the previous term changed by d.', [
    [2 + d, 3 + d, MC.curIdx, 'That adds d to the term NUMBER. The rule adds d to the previous TERM.'],
  ], `Start from ${nH(a1)} and apply the rule twice.`);
};

// =====================================================================================================================
// 6 recursive-write
// =====================================================================================================================
const sameSideH = (d: number) => `a<sub>1</sub> = %S, ${aN} = ${aN}${sgH(d, false)} for ${nI} ≥ 2`;
const recWrite: Gen = (R, n) => {
  const d = pickD(R, 'mix'), a1 = pickA1(R, -10, 30), vs = terms(a1, d, 5);
  const r: RecDef = { N: A, n0: 1, seed: a1, d, back: true, lo: 2 };
  const opts: Opt[] = [
    { t: recH(r), ok: true, say: 'Right: a start, a rule, and where the rule applies.' },
    { t: recH({ ...r, noSeed: true }), mc: MC.noSeed, say: `Without a<sub>1</sub> = ${nH(a1)} the rule fits every list that changes by ${nH(d)}: it needs a start.` },
    { t: sameSideH(d).replace('%S', nH(a1)), mc: MC.sameSide, say: `a<sub>n</sub> = a<sub>n</sub> + d can never be true (unless d = 0): the right side needs the PREVIOUS term a<sub>n−1</sub>.` },
  ];
  if (d !== 0) opts.push({ t: recH({ ...r, d: -d }), mc: MC.reversed, say: `Later minus earlier: ${nH(vs[1]!)} − ${pn(vs[0]!)} = ${nH(d)}.` });
  else opts.push({ t: recH({ ...r, lo: 1 }), say: 'For n = 1 the rule would need a<sub>0</sub>, which does not exist: the rule starts at n = 2.' });
  return choice(R, {
    id: `recWrite-${n}`, family: 'recWrite', prompt: `Assume ${listH(vs)}, … keeps changing by the same amount (a<sub>1</sub> = ${nH(a1)}). Which is a complete recursive definition?`,
    board: `${listT(vs)},\\ \\dots`, solution: [`Start: a<sub>1</sub> = ${nH(a1)}. Jump: d = ${nH(d)}.`, `Rule: each term is the previous one ${sgH(d, false).trim()}, for n ≥ 2.`],
    picture: { strip: stripOf(vs), hold: ['jumps'] },
  }, opts);
};
const recFinite: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -10, 30), N = int(R, 6, 15), last = term(a1, d, N);
  const r: RecDef = { N: A, n0: 1, seed: a1, d, back: true, lo: 2, hi: N };
  return choice(R, {
    id: `recFinite-${n}`, family: 'recFinite', prompt: `A sequence has exactly ${N} terms: ${listH(terms(a1, d, 3))}, …, ${nH(last)}, the same jump each time. Which recursive definition is complete?`,
    board: `${listT(terms(a1, d, 3))},\\ \\dots,\\ ${nT(last)}`,
    solution: [`Start a<sub>1</sub> = ${nH(a1)}; rule a<sub>n</sub> = a<sub>n−1</sub>${sgH(d, false)}.`, `The rule makes a<sub>2</sub> to a<sub>${N}</sub>, so it runs for 2 ≤ n ≤ ${N}.`],
    picture: { strip: { ns: [1, 2, 3, N], vals: [a1, term(a1, d, 2), term(a1, d, 3), last] } },
  }, [
    { t: recH(r), ok: true, say: `Right: the rule stops at a<sub>${N}</sub>.` },
    { t: recH({ ...r, hi: undefined }), mc: MC.noRange, say: `For n ≥ 2 the sequence never ends. It has exactly ${N} terms: give the upper bound.` },
    { t: recH({ ...r, hi: N + 1 }), say: `That rule makes a<sub>${N + 1}</sub> too: ${N + 1} terms.` },
    { t: recH({ ...r, noSeed: true }), mc: MC.noSeed, say: `It needs the start a<sub>1</sub> = ${nH(a1)}.` },
  ]);
};

// =====================================================================================================================
// 7 explicit-derive
// =====================================================================================================================
const countJumps: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -10, 30), k = R() < 0.3 ? int(R, 5, 9) : int(R, 12, 80);
  const fill = R() < 0.5;
  return numItem({
    id: `countJumps-${n}`, family: 'countJumps',
    prompt: fill ? `${listH(terms(a1, d, 3))}, … (a<sub>1</sub> = ${nH(a1)}, ${dI} = ${nH(d)}). Fill the box: a<sub>${k}</sub> = ${nH(a1)} + □ · ${nH(d)}.` : `In ${listH(terms(a1, d, 3))}, …, how many jumps of ${nH(d)} take you from a<sub>1</sub> to a<sub>${k}</sub>?`,
    board: fill ? `a_{${k}} = ${nT(a1)} + \\square \\cdot ${d < 0 ? `(${nT(d)})` : nT(d)}` : `a_1 \\to a_{${k}}`,
    solution: [`a<sub>1</sub> needs no jump; a<sub>2</sub> is 1 jump, a<sub>3</sub> is 2 jumps: always one less than the term number.`, `So a<sub>${k}</sub> is ${ans(k - 1)} jumps from a<sub>1</sub>.`],
    picture: { strip: { ns: k <= 7 ? Array.from({ length: k }, (_, i) => i + 1) : [1, 2, 3, k], vals: k <= 7 ? terms(a1, d, k) : [...terms(a1, d, 3), term(a1, d, k)] }, count: true },
  }, k - 1, `Right: ${k - 1} jumps, so a<sub>${k}</sub> = ${nH(a1)} + ${k - 1} · ${nH(d)}.`, [
    [k, MC.nSteps, `Count again from a<sub>1</sub>: a<sub>2</sub> is ONE jump away. The ${k}th term is ${k - 1} jumps away.`],
  ], 'Count the jumps for a small case first: a<sub>3</sub> is 2 jumps from a<sub>1</sub>.');
};
const deriveForm: Gen = (R, n) => {
  for (;;) {
    const d = pickD(R, 'nz'), a1 = pickA1(R, -8, 25);
    if (a1 === 0 || a1 === d || a1 === -d) continue;
    const vs = terms(a1, d, 5);
    const forms: { t: string; f: (k: number) => number; ok?: boolean; mc?: string; say: string }[] = [
      { t: `${aN} = ${expRH(a1, d)}`, f: k => a1 + d * (k - 1), ok: true, say: `Right: n − 1 jumps of ${nH(d)} after a<sub>1</sub>. Check n = 1: ${nH(a1)} ✓.` },
      { t: `${aN} = ${nH(a1)}${d < 0 ? ' − ' + nH(-d) : ' + ' + nH(d)}${nI}`, f: k => a1 + d * k, mc: MC.nSteps, say: `Check n = 1: that gives ${nH(a1 + d)}, not ${nH(a1)}. Term n is n − 1 jumps from a<sub>1</sub>.` },
      { t: `${aN} = ${linH(d, 0)}`, f: k => d * k, mc: MC.dropStart, say: `Check n = 1: that gives ${nH(d)}. The start ${nH(a1)} is missing.` },
      { t: `${aN} = ${linH(a1, d)}`, f: k => a1 * k + d, mc: MC.a1Coef, say: `The term number n gets multiplied by the JUMP ${nH(d)}, not by the first term.` },
    ];
    if (forms.slice(1).some(o => [1, 2, 3].every(k => near(o.f(k), a1 + d * (k - 1))))) continue;
    return choice(R, {
      id: `deriveForm-${n}`, family: 'deriveForm', prompt: `${listH(vs)}, … Which formula gives every term a<sub>n</sub> (<i>n</i> ≥ 1)?`, board: `${listT(vs)},\\ \\dots`,
      solution: [`a<sub>n</sub> is n − 1 jumps of ${nH(d)} after a<sub>1</sub> = ${nH(a1)}.`, `a<sub>n</sub> = ${expRH(a1, d)}; check n = 1: ${nH(a1)} ✓.`],
      picture: { strip: stripOf(vs), count: true },
    }, forms.map(({ t, ok, mc, say }) => ({ t, ok, mc, say })));
  }
};

// =====================================================================================================================
// 8 explicit-evaluate
// =====================================================================================================================
const evalFar: Gen = (R, n) => {
  const r = R(), d = r < 0.7 ? nz(R, -20, 20) : pick(R, FRAC) * (R() < 0.6 ? 1 : -1), a1 = pickA1(R, -20, 50), k = int(R, 20, 100);
  if (Math.abs(d) === 1) return evalFar(R, n);
  const val = term(a1, d, k);
  return numItem({
    id: `evalFar-${n}`, family: 'evalFar', prompt: `a<sub>n</sub> = ${expRH(a1, d)}. Find a<sub>${k}</sub> without listing the terms.`,
    board: `${aNT} = ${expRT(a1, d)};\\ \\ a_{${k}} = \\,?`,
    solution: [`Put n = ${k}: a<sub>${k}</sub> = ${nH(a1)} ${d < 0 ? '−' : '+'} ${nH(Math.abs(d))}(${k} − 1).`, `${k} − 1 = ${k - 1} jumps: ${nH(Math.abs(d))} × ${k - 1} = ${nH(Math.abs(d) * (k - 1))}.`, `a<sub>${k}</sub> = ${nH(a1)} ${d < 0 ? '−' : '+'} ${nH(Math.abs(d) * (k - 1))} = ${ans(nH(val))}.`],
    picture: Math.max(...[...terms(a1, d, 3), val].map(v => nH(v).length)) >= 5
      ? { strip: { ns: [1, 2, k], vals: [...terms(a1, d, 2), null], reveal: [null, null, val] } }
      : { strip: { ns: [1, 2, 3, k], vals: [...terms(a1, d, 3), null], reveal: [null, null, null, val] } },
  }, val, `Right: a<sub>${k}</sub> = ${nH(val)}.`, [
    [a1 + d * k, MC.nSteps, `That is ${k} jumps. Brackets first: ${k} − 1 = ${k - 1}.`],
    [a1 + d * k - 1, MC.partial, `${nH(d)}(${k} − 1) is ${nH(d)} × ${k} MINUS ${nH(d)} × 1, not minus 1.`],
  ], `Brackets first: ${k} − 1, then multiply by ${nH(d)}, then add ${nH(a1)}.`);
};
const CTX_EVAL = [
  { what: (a: number, d: number) => `A gym membership costs ${usd(a)} in month 1 (sign-up included) and the total paid goes up by ${usd(d)} each month.`, unit: 'dollars', name: 'T', money: true, ask: (k: number) => `the total paid through month ${k}` },
  { what: (a: number, d: number) => `Row 1 of a stadium section has ${a} seats and each row has ${d} more than the row in front.`, unit: 'seats', name: 's', money: false, ask: (k: number) => `the seats in row ${k}` },
  { what: (a: number, d: number) => `A savings jar holds ${usd(a)} in week 1 and you add ${usd(d)} every week.`, unit: 'dollars', name: 'b', money: true, ask: (k: number) => `the amount in week ${k}` },
] as const;
const evalMoney: Gen = (R, n) => {
  const c = pick(R, CTX_EVAL), k = int(R, 12, 60);
  const a1 = c.money ? int(R, 20, 120) + (R() < 0.4 ? 0.5 : 0) : int(R, 12, 30), d = c.money ? pick(R, [12.5, 15, 20, 25, 8.75, 9.5, 30]) : int(R, 2, 4);
  const val = term(a1, d, k), N: Nm = { s: c.name };
  const show = (v: number) => (c.money ? usd(v) : nH(v));
  return numItem({
    id: `evalMoney-${n}`, family: 'evalMoney', unit: c.unit,
    prompt: `${c.what(a1, d)} So ${atH(N, 'n')} = ${expRH(a1, d)}${c.money ? '' : ''}. Find ${c.ask(k)}.${c.money && isFrac(d) ? ' (Calculator allowed.)' : ''}`,
    board: `${atT(N, 'n')} = ${expRT(a1, d)};\\ \\ ${atT(N, k)} = \\,?`,
    solution: [`Term ${k} is ${k - 1} jumps after term 1: ${show(d)} × ${k - 1} = ${show(d * (k - 1))}.`, `${show(a1)} + ${show(d * (k - 1))} = ${ans(show(val))}.`],
  }, val, `Right: ${show(val)}.`, [
    [a1 + d * k, MC.nSteps, `Month or row 1 already has the start; only ${k - 1} increases follow.`],
    [d * k, MC.dropStart, `That leaves out the start of ${show(a1)}.`],
  ], `n = ${k}: ${show(a1)} plus ${k} − 1 increases of ${show(d)}.`);
};

// =====================================================================================================================
// 9 explicit-from-list
// =====================================================================================================================
const formFromList: Gen = (R, n) => {
  const d = pickD(R, 'mix'), a1 = pickA1(R, -15, 30), vs = terms(a1, d, 5);
  if (d === a1) return formFromList(R, n);
  return pairItem({
    id: `formFromList-${n}`, family: 'formFromList', prompt: `Assume ${listH(vs)}, … keeps changing by the same amount (starting at <i>n</i> = 1). Write its explicit formula.`,
    board: `${listT(vs)},\\ \\dots`,
    solution: [`a<sub>1</sub> = ${ans(nH(a1))} (the first term) and d = ${ans(nH(d))} (later minus earlier).`, `a<sub>n</sub> = ${expRH(a1, d)}. Check n = 2: ${nH(vs[1]!)} ✓.`],
    picture: { strip: stripOf(vs), hold: ['jumps'] },
  }, a1, d, EXP_FORM, `Right: a<sub>n</sub> = ${expRH(a1, d)}.`, [
    [a1 - d, d, MC.shift1, `With ${nH(a1 - d)} in front, n = 1 gives ${nH(a1 - d)}: the terms slide one place. The first box is a<sub>1</sub> itself.`],
    [d, a1, MC.a1Coef, `The jump ${nH(d)} multiplies (n − 1); the first term ${nH(a1)} goes in front.`],
    [a1, -d, MC.reversed, `d is later minus earlier: ${nH(vs[1]!)} − ${pn(vs[0]!)} = ${nH(d)}.`],
  ], 'First box: the first term. Second box: the common difference.');
};
const formFromGraph: Gen = (R, n) => {
  for (;;) {
    const g = readable(R, 5), a1 = g.a1, d = g.d;
    if (a1 === 0 || a1 === d || a1 === -d || a1 - d === 0) continue;
    const right = (k: number) => a1 + d * (k - 1);
    const forms: { t: string; f: (k: number) => number; ok?: boolean; mc?: string; say: string }[] = [
      { t: `${aN} = ${expRH(a1, d)}`, f: right, ok: true, say: 'Right: the first point is a<sub>1</sub>, each step right rises d.' },
      { t: `${aN} = ${expRH(a1, d, 0)}`, f: k => a1 + d * k, mc: MC.shift1, say: `Check n = 1: that gives ${nH(a1 + d)}, but the first point is at ${nH(a1)}.` },
      { t: `${aN} = ${expRH(d, a1)}`, f: k => d + a1 * (k - 1), mc: MC.a1Coef, say: `The jump between points is ${nH(d)}: that is what multiplies (n − 1).` },
      { t: `${aN} = ${expRH(a1 - d, d)}`, f: k => a1 - d + d * (k - 1), mc: MC.firstAs0, say: `${nH(a1 - d)} is where the line would be at n = 0. The first TERM (n = 1) is ${nH(a1)}.` },
    ];
    if (forms.slice(1).some(o => [1, 2, 3].every(k => near(o.f(k), right(k))))) continue;
    return choice(R, {
      id: `formFromGraph-${n}`, family: 'formFromGraph', prompt: `The points (1, ${nH(g.vs[0]!)}), (2, ${nH(g.vs[1]!)}), … (<i>n</i> = 1 to 5) show an arithmetic sequence. Which explicit formula fits?`, board: `(1,\\,${nT(g.vs[0]!)}),\\ (2,\\,${nT(g.vs[1]!)}),\\ \\dots`,
      solution: [`First point (1, ${nH(a1)}): a<sub>1</sub> = ${nH(a1)}. Each step right: ${jumpH(d)}, so d = ${nH(d)}.`, `a<sub>n</sub> = ${expRH(a1, d)}.`],
      picture: { graph: { pts: g.vs.map((y, i) => [i + 1, y]), y: g.y, stairs: true }, hold: ['stairs'] },
    }, forms.map(({ t, ok, mc, say }) => ({ t, ok, mc, say })));
  }
};

// =====================================================================================================================
// 10 solve-for-position
// =====================================================================================================================
const whichN: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -20, 40), m = int(R, 8, 80), v = term(a1, d, m);
  return numItem({
    id: `whichN-${n}`, family: 'whichN', prompt: `a<sub>n</sub> = ${expRH(a1, d)} for <i>n</i> ≥ 1. Which term is ${nH(v)}? (Find <i>n</i>.)`,
    board: `${expRT(a1, d)} = ${nT(v)}`,
    solution: [`Subtract ${nH(a1)} first: ${nH(d)}(n − 1) = ${nH(v - a1)}.`, `Divide by ${nH(d)}: n − 1 = ${m - 1}.`, `n = ${ans(m)}: a whole number ≥ 1, so ${nH(v)} = a<sub>${m}</sub>.`],
  }, m, `Right: a<sub>${m}</sub> = ${nH(v)}.`, [
    [m - 1, MC.nSteps, `${m - 1} is n − 1, the number of jumps. Add 1 to get the term number.`],
    [r6(v / d), MC.dropStart, `Subtract the start ${nH(a1)} before dividing by d.`],
  ], `Undo it: subtract ${nH(a1)}, divide by ${nH(d)}, add 1.`);
};
const isTerm: Gen = (R, n) => {
  const kind = pick(R, ['term', 'notWhole', 'before', 'after'] as const);
  const d = kind === 'notWhole' ? pick(R, [2, 3, 4, 5, -2, -3, -4, 6]) : pickD(R, 'int'), a1 = pickA1(R, -10, 40);
  const N = kind === 'after' ? int(R, 10, 30) : undefined;
  let v: number;
  if (kind === 'term') v = term(a1, d, int(R, 4, 40));
  else if (kind === 'notWhole') v = term(a1, d, int(R, 4, 40)) + nz(R, 1, Math.abs(d) - 1) * Math.sign(d);
  else if (kind === 'before') v = term(a1, d, int(R, -6, 0));
  else v = term(a1, d, N! + int(R, 1, 12));
  const P = position(a1, d, v, 1, N);
  const nVal = P.kind === 'term' || P.kind === 'notWhole' || P.kind === 'before' || P.kind === 'after' ? P.n : NaN;
  const dom = N === undefined ? `<i>n</i> ≥ 1` : `1 ≤ <i>n</i> ≤ ${N}`;
  const opts: Opt[] = [
    { t: `Yes: ${nH(v)} = a<sub>${nH(nVal)}</sub>`, ok: P.kind === 'term', mc: P.kind === 'notWhole' ? MC.fracIdx : P.kind === 'term' ? undefined : MC.rangeOpt, say: P.kind === 'term' ? `Right: n = ${nVal} is a whole number in the domain.` : P.kind === 'notWhole' ? `n = ${nH(nVal)} is not a whole number: there is no term ${nH(nVal)}.` : `n = ${nH(nVal)} is outside ${dom.replace(/<[^>]+>/g, '')}.` },
    { t: 'No: n would not be a whole number', ok: P.kind === 'notWhole', say: P.kind === 'notWhole' ? `Right: n = ${nH(nVal)}.` : `Solve it: n = ${nH(nVal)}, a whole number.` },
    { t: 'No: it would come before a<sub>1</sub> (n &lt; 1)', ok: P.kind === 'before', say: P.kind === 'before' ? `Right: n = ${nH(nVal)} is before the first term.` : `n = ${nH(nVal)}, which is not below 1.` },
  ];
  if (N !== undefined) opts.push({ t: `No: it would come after the last term, a<sub>${N}</sub>`, ok: P.kind === 'after', say: P.kind === 'after' ? `Right: n = ${nVal} is past ${N}.` : `n = ${nH(nVal)} is not past ${N}.` });
  return choice(R, {
    id: `isTerm-${n}`, family: 'isTerm', prompt: `a<sub>n</sub> = ${expRH(a1, d)} for ${dom}. Is ${nH(v)} a term of the sequence?`,
    board: `${expRT(a1, d)} = ${nT(v)},\\ \\ ${N === undefined ? rangeT(1) : rangeT(1, N)}`,
    solution: [`Subtract ${nH(a1)}: ${nH(d)}(n − 1) = ${nH(r6(v - a1))}, so n − 1 = ${nH(r6((v - a1) / d))} and n = ${nH(nVal)}.`, `Is that a whole number in ${dom}? ${P.kind === 'term' ? 'Yes.' : 'No.'}`],
  }, opts);
};
const constCase: Gen = (R, n) => {
  const c = int(R, -15, 40), every = R() < 0.5, v = every ? c : c + nz(R, -12, 12);
  const asRec = R() < 0.4;
  const opts: Opt[] = [
    { t: `Every n ≥ 1`, ok: every, mc: every ? undefined : MC.constN, say: every ? `Right: every term is ${nH(c)}.` : `Every term is ${nH(c)}, never ${nH(v)}.` },
    { t: 'No n at all', ok: !every, mc: every ? MC.constN : undefined, say: every ? `Every term IS ${nH(c)}: it is at every n.` : `Right: every term is ${nH(c)}, so ${nH(v)} never appears.` },
    { t: 'Only n = 1', mc: MC.constN, say: `With d = 0 every term equals a<sub>1</sub>: there is nothing special about n = 1.` },
  ];
  if (!every) opts.push({ t: `n = ${nH(v - c + 1)}`, mc: MC.constN, say: 'That divides by d = 0 as if it were 1. You cannot divide by 0: 0(n − 1) is 0 for every n.' });
  return choice(R, {
    id: `constCase-${n}`, family: 'constCase',
    prompt: asRec ? `a<sub>1</sub> = ${nH(c)}, a<sub>n</sub> = a<sub>n−1</sub> + 0 for <i>n</i> ≥ 2. For which <i>n</i> is a<sub>n</sub> = ${nH(v)}?` : `a<sub>n</sub> = ${expRH(c, 0)} for <i>n</i> ≥ 1. For which <i>n</i> is a<sub>n</sub> = ${nH(v)}?`,
    board: asRec ? `a_1 = ${nT(c)},\\ a_n = a_{n-1} + 0;\\ \\ a_n = ${nT(v)}` : `${expRT(c, 0)} = ${nT(v)}`,
    solution: [`d = 0: every term is ${nH(c)}. You cannot divide by d here.`, every ? `${nH(v)} = ${nH(c)}, so it is every term.` : `${nH(v)} ≠ ${nH(c)}, so no term equals it.`],
    picture: { strip: stripOf(terms(c, 0, 5)) },
  }, opts);
};

// =====================================================================================================================
// 11 explicit-from-two-terms
// =====================================================================================================================
const twoTerms: Gen = (R, n) => {
  const d = R() < 0.8 ? nz(R, -8, 9) : pick(R, [0.5, 1.5, -0.5, 2.5]), a1 = pickA1(R, -15, 30);
  const p = int(R, 2, 6), q = p + int(R, 2, 9), ap = term(a1, d, p), aq = term(a1, d, q);
  const graph = R() < 0.4 && q <= 13;
  const D2 = r6(aq - ap);
  return pairItem({
    id: `twoTerms-${n}`, family: 'twoTerms', prompt: `An arithmetic sequence has a<sub>${p}</sub> = ${nH(ap)} and a<sub>${q}</sub> = ${nH(aq)}${graph ? ' (the two points)' : ''}. Write its explicit formula.`,
    board: `a_{${p}} = ${nT(ap)},\\ \\ a_{${q}} = ${nT(aq)}`,
    solution: [`From term ${p} to term ${q}: ${q - p} jumps, a change of ${nH(D2)}. So d = ${nH(D2)} ÷ ${q - p} = ${nH(d)}.`, `Back from a<sub>${p}</sub> to a<sub>1</sub>: ${pl(p - 1, 'jump')}. a<sub>1</sub> = ${nH(ap)} − ${p - 1} × ${pn(d)} = ${nH(a1)}.`, `a<sub>n</sub> = ${ans(nH(a1))} + ${d < 0 ? `(${ans(nH(d))})` : ans(nH(d))}(n − 1).`],
    picture: graph ? { graph: { pts: [[p, ap], [q, aq]], named: [0, 1] } } : { strip: { ns: [p, q], vals: [ap, aq], jumps: false } },
  }, a1, d, EXP_FORM, `Right: a<sub>n</sub> = ${expRH(a1, d)}.`, [
    [r6(ap - (p - 1) * D2), D2, MC.inputStep, `${nH(D2)} is the change over ${q - p} steps. Divide by ${q - p} to get the change per step.`],
    [r6(ap - p * d), d, MC.nSteps, `From a<sub>${p}</sub> back to a<sub>1</sub> is ${p - 1} jumps, not ${p}.`],
  ], `d = (change in value) ÷ (change in n). Then step back to n = 1.`);
};
const gapD: Gen = (R, n) => {
  const d = nz(R, -7, 9), a1 = pickA1(R, -10, 30), ns = [int(R, 1, 3)];
  ns.push(ns[0]! + int(R, 2, 4)); ns.push(ns[1]! + int(R, 2, 5));
  const vs = ns.map(k => term(a1, d, k)), askD = R() < 0.6;
  const pic: SeqPic = { strip: { ns, vals: vs, jumps: false } };
  if (askD) return numItem({
    id: `gapD-${n}`, family: 'gapD', prompt: `The table shows terms of an arithmetic sequence at <i>n</i> = ${ns.join(', ')}. What is ${dI}?`, board: `d = \\dfrac{\\Delta a}{\\Delta n}`,
    solution: [`From n = ${ns[0]} to n = ${ns[1]}: ${ns[1]! - ns[0]!} steps, change ${nH(vs[1]! - vs[0]!)}.`, `d = ${nH(vs[1]! - vs[0]!)} ÷ ${ns[1]! - ns[0]!} = ${ans(nH(d))} (check: ${nH(vs[2]! - vs[1]!)} ÷ ${ns[2]! - ns[1]!} = ${nH(d)}).`], picture: pic,
  }, d, `Right: d = ${nH(d)} per step of n.`, [
    [vs[1]! - vs[0]!, MC.inputStep, `That change is over ${ns[1]! - ns[0]!} steps of n, not one. Divide by ${ns[1]! - ns[0]!}.`],
    [vs[2]! - vs[1]!, MC.inputStep, `That change is over ${ns[2]! - ns[1]!} steps of n. Divide by ${ns[2]! - ns[1]!}.`],
  ], 'Change in value ÷ change in n.');
  return numItem({
    id: `gapD-${n}`, family: 'gapD', prompt: `The table shows terms of an arithmetic sequence at <i>n</i> = ${ns.join(', ')}. What is a<sub>1</sub>?`, board: 'a_1 = \\,?',
    solution: [`d = ${nH(vs[1]! - vs[0]!)} ÷ ${ns[1]! - ns[0]!} = ${nH(d)}.`, `a<sub>1</sub> = ${nH(vs[0]!)} − ${ns[0]! - 1} × ${pn(d)} = ${ans(nH(a1))}.`], picture: pic,
  }, a1, `Right: a<sub>1</sub> = ${nH(a1)}.`, [
    [r6(vs[0]! - ns[0]! * d), MC.nSteps, `From n = ${ns[0]} back to n = 1 is ${ns[0]! - 1} jumps.`],
  ], 'Find d per step first, then step back to n = 1.');
};
const determined: Gen = (R, n) => {
  const a1 = int(R, -10, 30), d = nz(R, -8, 9), w = term(a1, d, 3), mid = term(a1, d, 2);
  return choice(R, {
    id: `determined-${n}`, family: 'determined', prompt: `A sequence has a<sub>1</sub> = ${nH(a1)} and a<sub>3</sub> = ${nH(w)}. Nothing says what kind of sequence it is. Which is true?`,
    board: `a_1 = ${nT(a1)},\\ \\ a_3 = ${nT(w)}`,
    solution: [`IF it is arithmetic, a<sub>2</sub> is halfway: ${nH(mid)}.`, `But ${nH(a1)}, ${nH(mid + 1)}, ${nH(w)} fits the two terms too: two terms alone do not decide it.`],
  }, [
    { t: `a<sub>2</sub> = ${nH(mid)} only if we know the sequence is arithmetic`, ok: true, say: 'Right: two terms fix an arithmetic sequence only when we are told it is arithmetic.' },
    { t: `a<sub>2</sub> must be ${nH(mid)}`, mc: MC.examples, say: `${nH(a1)}, ${nH(mid + 1)}, ${nH(w)} also has these two terms. A pattern you expect is not a pattern you are given.` },
    { t: `a<sub>2</sub> must be ${nH(w - a1)}`, mc: MC.inputStep, say: `${nH(w - a1)} is the whole change from a<sub>1</sub> to a<sub>3</sub>, not a term.` },
  ]);
};

// =====================================================================================================================
// 12 recursive-to-explicit
// =====================================================================================================================
const recToExp: Gen = (R, n) => {
  const fn = R() < 0.3, d = pickD(R, 'mix'), a1 = pickA1(R, -15, 30);
  if (a1 === d || a1 === 0) return recToExp(R, n);
  const r: RecDef = { N: fn ? F : A, n0: 1, seed: a1, d, back: R() < 0.6, lo: 1 };
  if (r.back) r.lo = 2;
  const nm = fn ? '<i>f</i>(<i>n</i>)' : aN;
  return pairItem({
    id: `recToExp-${n}`, family: 'recToExp', prompt: `${recH(r)}. Write the explicit formula.`, board: recT(r),
    solution: [`Seed: ${atH(r.N, 1)} = ${ans(nH(a1))}. The rule adds ${nH(d)} each step: d = ${ans(nH(d))}.`, `Term n is n − 1 steps after the seed: ${nm} = ${expRH(a1, d)}. Check n = 3: ${nH(term(a1, d, 3))} both ways.`],
    picture: { strip: { ns: [1, 2, 3], vals: [a1, null, null], reveal: [null, term(a1, d, 2), term(a1, d, 3)], d, ell: true, name: fn ? 'f(n)' : undefined } },
  }, a1, d, { lead: `${nm} =`, op: '+', tail: `(${nI} − 1)` }, `Right: ${nm} = ${expRH(a1, d)}.`, [
    [0, d, MC.dropStart, `That drops the start: n = 1 would give 0, not ${nH(a1)}.`],
    [d, a1, MC.a1Coef, 'The seed goes in front; the step d multiplies (n − 1).'],
    [a1 - d, d, MC.shift1, `n = 1 must give the seed ${nH(a1)} itself.`],
  ], 'First box: the seed (the first term). Second box: what the rule adds each step.');
};
const recToExpChoice: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -15, 30), fin = R() < 0.45, N = int(R, 8, 20);
  if (a1 === 0) return recToExpChoice(R, n);
  const r: RecDef = { N: A, n0: 1, seed: a1, d, back: true, lo: 2, hi: fin ? N : undefined };
  const dom = fin ? rangeH(1, N) : rangeH(1);
  const opts: Opt[] = [
    { t: `${aN} = ${expRH(a1, d)} for ${dom}`, ok: true, say: 'Right: seed in front, n − 1 steps of d, and the same domain.' },
    { t: `${aN} = a<sub>n−1</sub>${sgH(d, false)} for ${fin ? rangeH(2, N) : rangeH(2)}`, mc: MC.ruleAsPos, say: 'That is still the recursive rule: it needs the term before. An explicit formula uses only n.' },
    { t: `${aN} = ${expRH(0, d).replace(/^0 \+ /, '').replace(/^0 − /, '−')} for ${dom}`, mc: MC.dropStart, say: `n = 1 must give ${nH(a1)}: the seed is missing.` },
    fin ? { t: `${aN} = ${expRH(a1, d)} for ${rangeH(1)}`, mc: MC.noRange, say: `The recursive sequence stops at n = ${N}: keep that bound.` }
      : { t: `${aN} = ${expRH(a1, d, 0)} for ${dom}`, mc: MC.nSteps, say: `n = 1 gives ${nH(a1 + d)}, not ${nH(a1)}: term n is only n − 1 steps after the seed.` },
  ];
  return choice(R, {
    id: `recToExpChoice-${n}`, family: 'recToExpChoice', prompt: `${recH(r)}. Which explicit formula describes the same sequence?`, board: recT(r),
    solution: [`Seed a<sub>1</sub> = ${nH(a1)}, step d = ${nH(d)}.`, `a<sub>n</sub> = ${expRH(a1, d)} for ${dom}; check n = 3: ${nH(term(a1, d, 3))} both ways.`],
  }, opts);
};

// =====================================================================================================================
// 13 explicit-expanded-form
// =====================================================================================================================
const expand: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -12, 30), c = r6(a1 - d);
  if (Math.abs(d) === 1) return expand(R, n);
  return pairItem({
    id: `expand-${n}`, family: 'expand', prompt: `Rewrite a<sub>n</sub> = ${expRH(a1, d)} in the form a<sub>n</sub> = □<i>n</i> + □.`, board: `${aNT} = ${expRT(a1, d)}`,
    solution: [`Distribute: ${nH(d)}(n − 1) = ${nH(d)}n ${d < 0 ? '+' : '−'} ${nH(Math.abs(d))}.`, `Combine: ${nH(a1)} ${d < 0 ? '+' : '−'} ${nH(Math.abs(d))} = ${nH(c)}. So a<sub>n</sub> = ${linH(d, c)}: ${ans(nH(d))} and ${ans(nH(c))}.`],
  }, d, c, { lead: `${aN} =`, op: `${nI} +` }, `Right: a<sub>n</sub> = ${linH(d, c)}. The coefficient of n is d, the slope.`, [
    [d, r6(a1 - 1), MC.partial, `${nH(d)} multiplies BOTH n and 1: ${nH(d)}(n − 1) = ${nH(d)}n ${d < 0 ? '+' : '−'} ${nH(Math.abs(d))}.`],
    [d, r6(a1 + d), d < 0 ? MC.negFirst : undefined, `${nH(d)} × (−1) = ${nH(-d)}: the sign of the second product matters.`],
    [a1, d, MC.coefNotD, `The coefficient of n comes from d(n − 1): it is d = ${nH(d)}.`],
  ], 'Distribute d over (n − 1), then combine the numbers.');
};
const slopeOf: Gen = (R, n) => {
  const p = nz(R, -9, 12), q = nz(R, -15, 20);
  if (q === p || p + q === p) return slopeOf(R, n);
  return numItem({
    id: `slopeOf-${n}`, family: 'slopeOf', prompt: `a<sub>n</sub> = ${linH(p, q)} for <i>n</i> ≥ 1. What is the common difference ${dI}?`, board: `${aNT} = ${linT(p, q)},\\ n \\ge 1`,
    solution: [`Each step n → n + 1 adds the coefficient of n once: a<sub>n+1</sub> − a<sub>n</sub> = ${nH(p)}.`, `d = ${ans(nH(p))}, the slope of the points. (Check: a<sub>1</sub> = ${nH(p + q)}, a<sub>2</sub> = ${nH(2 * p + q)}.)`],
    picture: { graph: { pts: [1, 2, 3, 4, 5].map(k => [k, p * k + q]), stairs: true }, hold: ['stairs'] },
  }, p, `Right: d = ${nH(p)}, the coefficient of n.`, [
    [q, MC.coefNotD, `${nH(q)} is the constant. The change per step is the coefficient of n.`],
    [p + q, MC.coefNotD, `${nH(p + q)} is the first term. The change per step is the coefficient of n.`],
  ], 'Work out a<sub>1</sub> and a<sub>2</sub> and subtract.');
};

// =====================================================================================================================
// 14 explicit-to-recursive
// =====================================================================================================================
const seedOf: Gen = (R, n) => {
  const p = nz(R, -9, 12), q = nz(R, -15, 25);
  if (q === p) return seedOf(R, n);
  return numItem({
    id: `seedOf-${n}`, family: 'seedOf', prompt: `a<sub>n</sub> = ${linH(p, q)} for <i>n</i> ≥ 1. Its recursive form is a<sub>1</sub> = □, a<sub>n</sub> = a<sub>n−1</sub>${sgH(p, false)} for <i>n</i> ≥ 2. What goes in the box?`,
    board: `${aNT} = ${linT(p, q)},\\ n \\ge 1`,
    solution: ['The seed is the FIRST term: put n = 1 into the formula.', `a<sub>1</sub> = ${nH(p)} · 1${sgH(q, false)} = ${ans(nH(p + q))}.`],
  }, p + q, `Right: a<sub>1</sub> = ${nH(p + q)}.`, [
    [q, MC.shift1, `${nH(q)} is the value at n = 0, which is not a term here. The seed is a<sub>1</sub>: put n = 1 in.`],
    [p, MC.coefNotD, `${nH(p)} is the step d. The seed is the first term.`],
  ], 'Evaluate the formula at n = 1.');
};
const expToRec: Gen = (R, n) => {
  const p = nz(R, -9, 12), q = nz(R, -15, 25), fin = R() < 0.35, N = int(R, 8, 20);
  if (q === p || q === p + q) return expToRec(R, n);
  const s = p + q;
  const base: RecDef = { N: A, n0: 1, seed: s, d: p, back: true, lo: 2, hi: fin ? N : undefined };
  return choice(R, {
    id: `expToRec-${n}`, family: 'expToRec', prompt: `a<sub>n</sub> = ${linH(p, q)} for ${fin ? rangeH(1, N) : rangeH(1)}. Which recursive definition gives the same sequence?`,
    board: `${aNT} = ${linT(p, q)},\\ ${fin ? rangeT(1, N) : rangeT(1)}`,
    solution: [`Seed: a<sub>1</sub> = ${nH(p)}${sgH(q, false)} = ${nH(s)}. Step: the coefficient of n, ${nH(p)}.`, `${recH(base)}.`],
  }, [
    { t: recH(base), ok: true, say: 'Right: seed from n = 1, step from the coefficient of n, same last term.' },
    { t: recH({ ...base, seed: q }), mc: MC.shift1, say: `${nH(q)} is the value at n = 0. The seed is a<sub>1</sub> = ${nH(s)}.` },
    { t: recH({ ...base, d: q }), mc: MC.coefNotD, say: `The change per step is the coefficient of n, ${nH(p)}, not ${nH(q)}.` },
    { t: recH({ ...base, noSeed: true }), mc: MC.noSeed, say: 'A rule without a seed fits many sequences: give a<sub>1</sub>.' },
  ]);
};

// =====================================================================================================================
// 15 forms-equivalence
// =====================================================================================================================
const equivWhich: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -12, 30);
  return choice(R, {
    id: `equivWhich-${n}`, family: 'equivWhich',
    prompt: `Show that A(<i>n</i>) = ${expRH(a1, d)} lists the same sequence as a<sub>1</sub> = ${nH(a1)}, a<sub>n+1</sub> = a<sub>n</sub>${sgH(d, false)} for <i>n</i> ≥ 1, for EVERY <i>n</i>. Which argument does it?`,
    board: `A(n) = ${expRT(a1, d)}`,
    solution: [`A(1) = ${nH(a1)}: the same start.`, `A(n + 1) − A(n) = ${pn(d)}·n − ${pn(d)}(n − 1) = ${nH(d)} for every n: the same step.`, 'Same start and the same step every time: term 1 agrees, so term 2 agrees, so term 3 … every term agrees.'],
  }, [
    { t: `A(1) = ${nH(a1)}, and A(<i>n</i> + 1) − A(<i>n</i>) = ${nH(d)} for every <i>n</i> ≥ 1`, ok: true, say: 'Right: the same seed and the same step for every n fix every term.' },
    { t: `A(1), A(2) and A(3) match the terms of the recursion`, mc: MC.examples, say: 'Three matches are three examples. The claim is about every n: show the start AND the step in general.' },
    { t: `A(<i>n</i> + 1) − A(<i>n</i>) = ${nH(d)} for every <i>n</i> ≥ 1`, mc: MC.noSeed, say: `Every sequence with step ${nH(d)} passes that. The starts must match too: A(1) = ${nH(a1)}.` },
    { t: `Both formulas contain ${nH(a1)} and ${nH(d)}`, say: 'Sharing numbers says nothing about the terms: different formulas can use the same numbers.' },
  ]);
};
const equivPair: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -12, 30);
  if (d === 1 || d === a1) return equivPair(R, n);
  return pairItem({
    id: `equivPair-${n}`, family: 'equivPair', prompt: `A(<i>n</i>) = ${expRH(a1, d)}. Work out A(1) and the step A(<i>n</i> + 1) − A(<i>n</i>) (it is the same for every <i>n</i>).`,
    board: `A(n+1) - A(n) = \\,?`,
    solution: [`A(1) = ${nH(a1)} + ${pn(d)}(0) = ${ans(nH(a1))}.`, `A(n + 1) − A(n) = ${pn(d)}·n − ${pn(d)}(n − 1) = ${ans(nH(d))}.`],
  }, a1, d, { lead: 'A(1) =', op: ',&nbsp; A(<i>n</i> + 1) − A(<i>n</i>) =' }, 'Right: the same seed and the same step as the recursion.', [
    [a1, 1, MC.shiftAdd, 'A(n + 1) is not A(n) + 1: put n + 1 in place of n, then subtract.'],
    [a1 + d, d, MC.nSteps, `A(1) has n − 1 = 0 jumps: it is ${nH(a1)}.`],
  ], 'Put n = 1 in; then put n + 1 in and subtract A(n).');
};

// =====================================================================================================================
// 16 collinear-justification
// =====================================================================================================================
const whyLine: Gen = (R, n) => {
  const d = nz(R, -4, 5), a1 = nz(R, -5, 15), pts = terms(a1, d, 6).map((y, i) => [i + 1, y] as [number, number]);
  if (R() < 0.5) return choice(R, {
    id: `whyLine-${n}`, family: 'whyLine', prompt: `Why do ALL the points (<i>n</i>, a<sub>n</sub>) of a<sub>n</sub> = ${expRH(a1, d)} lie on one line?`, board: `${aNT} = ${linT(d, a1 - d)}`,
    solution: [`a<sub>n</sub> = ${linH(d, a1 - d)} for every n.`, `So every point (n, a<sub>n</sub>) satisfies y = ${linH(d, a1 - d).replace(/<i>n<\/i>/g, '<i>x</i>')}: one line, slope ${nH(d)}.`],
    picture: { graph: { pts, guide: [d, a1 - d] }, hold: ['guide'] },
  }, [
    { t: `a<sub>n</sub> = ${linH(d, a1 - d)} for every <i>n</i>, so every point is on y = ${linH(d, a1 - d).replace(/<i>n<\/i>/g, '<i>x</i>')}`, ok: true, say: 'Right: one linear expression in n for every term means one line.' },
    { t: 'The first three points line up, so the rest do too', mc: MC.examples, say: 'Three points are three examples. The argument has to hold for every n.' },
    { t: `The values keep ${d > 0 ? 'growing' : 'falling'}`, mc: MC.illusion, say: `1, 2, 4, 8 keeps growing too, and its points bend. Growing is not the same as a constant step.` },
  ]);
  return choice(R, {
    id: `whyLine-${n}`, family: 'whyLine', prompt: `The points of a<sub>n</sub> = ${expRH(a1, d)} (<i>n</i> ≥ 1) lie on a line. Why is the graph not the whole line?`, board: `${aNT} = ${expRT(a1, d)},\\ n \\ge 1`,
    solution: ['The inputs are term numbers: whole numbers n ≥ 1.', 'Only those points belong; the line through them is a visual guide.'],
    picture: { graph: { pts, guide: [d, a1 - d] }, hold: ['guide'] },
  }, [
    { t: 'n only takes whole values 1, 2, 3, …, so only those points belong', ok: true, say: 'Right: a sequence is a function on the whole numbers.' },
    { t: 'Between two terms there are fractional terms such as a<sub>2.5</sub>', mc: MC.fracIdx, say: 'There is no term number 2.5: n counts terms.' },
    { t: `The graph is the whole line from (0, ${nH(a1 - d)}) on`, mc: MC.firstAs0, say: `n = 0 is not in the domain, and neither is any fraction: just the points at n = 1, 2, 3, …` },
  ]);
};
const slopeBetween: Gen = (R, n) => {
  const d = R() < 0.8 ? nz(R, -8, 9) : pick(R, [0.5, 1.5, -0.5]), a1 = pickA1(R, -10, 30), k = int(R, 1, 6), m = k + int(R, 2, 8);
  const u = term(a1, d, k), w = term(a1, d, m);
  return numItem({
    id: `slopeBetween-${n}`, family: 'slopeBetween', prompt: `Two points of an arithmetic sequence are (${k}, ${nH(u)}) and (${m}, ${nH(w)}). What is the slope of the line through them (and so ${dI})?`,
    board: `\\dfrac{${nT(w)} - ${u < 0 ? `(${nT(u)})` : nT(u)}}{${m} - ${k}}`,
    solution: [`Rise: ${nH(w)} − ${pn(u)} = ${nH(w - u)}. Run: ${m} − ${k} = ${m - k}.`, `Slope = ${nH(w - u)} ÷ ${m - k} = ${ans(nH(d))}: between ANY two points it is d.`],
    picture: { graph: { pts: [[k, u], [m, w]], named: [0, 1] } },
  }, d, `Right: slope ${nH(d)} = d.`, [
    [r6(w - u), MC.inputStep, `That is the rise over ${m - k} steps. Divide by the run, ${m - k}.`],
    [r6((m - k) / (w - u)), undefined, 'Rise over run, not run over rise.'],
  ], 'Slope = change in value ÷ change in n.');
};

// =====================================================================================================================
// 17 first-term-vs-intercept
// =====================================================================================================================
const firstVsZero: Gen = (R, n) => {
  const d = R() < 0.12 ? 0 : nz(R, -5, 6), a1 = nz(R, -6, 18), q = r6(a1 - d), exp = R() < 0.5;
  return pairItem({
    id: `firstVsZero-${n}`, family: 'firstVsZero', prompt: `a<sub>n</sub> = ${exp ? expRH(a1, d) : linH(d, q)} for <i>n</i> ≥ 1. Give the first term, and the value of its linear extension at <i>n</i> = 0.`,
    board: `${aNT} = ${exp ? expRT(a1, d) : linT(d, q)},\\ n \\ge 1`,
    solution: [`First term: n = 1 gives a<sub>1</sub> = ${ans(nH(a1))}.`, `At n = 0 (not a term, n ≥ 1): ${exp ? `${nH(a1)}${sgH(-d)} = ` : ''}${ans(nH(q))}, the intercept of the dashed line.`],
    picture: { graph: { pts: terms(a1, d, 5).map((y, i) => [i + 1, y]), guide: [d, q], zero: true }, hold: ['guide', 'zero'] },
  }, a1, q, { lead: 'a<sub>1</sub> =', op: ',&nbsp; value at <i>n</i> = 0:' }, d === 0 ? 'Right: with d = 0 the two are the same number.' : `Right: the first term is ${nH(a1)}; ${nH(q)} is the intercept, not a term.`, [
    [q, a1, MC.firstAs0, 'Those are swapped: the first term sits at n = 1; n = 0 is one step before it.'],
    [q, q, MC.firstAs0, `The constant ${nH(q)} is the value at n = 0. The first term is at n = 1: ${nH(a1)}.`],
  ], 'Put n = 1 in for the first term, n = 0 for the intercept.');
};
const interceptTerm: Gen = (R, n) => {
  const zero = R() < 0.12, p = zero ? 0 : nz(R, -6, 8), q = nz(R, -8, 20), first = p + q;
  if (!zero && first === q) return interceptTerm(R, n);
  const opts: Opt[] = zero ? [
    { t: `Yes: d = 0, so every term is ${nH(q)}`, ok: true, say: `Right: with d = 0 the first term and the value at n = 0 are both ${nH(q)}.` },
    { t: `No: ${nH(q)} is only the value at n = 0`, mc: MC.firstAs0, say: `With d = 0 every term, including a<sub>1</sub>, is ${nH(q)}.` },
    { t: `No: the first term is ${nH(q + 1)}`, mc: MC.shift1, say: 'Put n = 1 in: nothing is added, the term is still the constant.' },
  ] : [
    { t: `No: ${nH(q)} is the value at n = 0, outside the domain; the first term is ${nH(first)}`, ok: true, say: `Right: a<sub>1</sub> = ${nH(first)}. The intercept ${nH(q)} is not a term.` },
    { t: `Yes: ${nH(q)} is the first term`, mc: MC.firstAs0, say: `Put n = 1 in: a<sub>1</sub> = ${nH(first)}. ${nH(q)} would be at n = 0, which is not in n ≥ 1.` },
    { t: `Yes: writing it as ${linH(p, q)} makes the sequence start at n = 0`, mc: MC.rewriteReset, say: 'Rewriting the formula does not change the domain: n still starts at 1.' },
  ];
  return choice(R, {
    id: `interceptTerm-${n}`, family: 'interceptTerm', prompt: `a<sub>n</sub> = ${linH(p, q)} for <i>n</i> ≥ 1. Is ${nH(q)} a term of this sequence?`, board: `${aNT} = ${linT(p, q)},\\ n \\ge 1`,
    solution: [`First term: a<sub>1</sub> = ${nH(first)}. The constant ${nH(q)} is the value at n = 0.`, zero ? `d = 0: every term is ${nH(q)}.` : `${p > 0 ? 'The terms only go up' : 'The terms only go down'} from ${nH(first)}, so ${nH(q)} never appears.`],
    picture: { graph: { pts: [1, 2, 3, 4].map(k => [k, p * k + q]), guide: [p, q], zero: true }, hold: ['guide', 'zero'] },
  }, opts);
};

// =====================================================================================================================
// 18 recursive-notation-shift
// =====================================================================================================================
const shiftRule: Gen = (R, n) => {
  const fn = R() < 0.6, N = fn ? F : A, d = pickD(R, 'nz'), c = pickA1(R, -10, 30), fin = R() < 0.35, M = int(R, 8, 16);
  const old: RecDef = { N, n0: 1, seed: c, d, back: true, lo: 2, hi: fin ? M : undefined };
  const nw: RecDef = { N, n0: 1, seed: c, d, back: false, lo: 1, hi: fin ? M - 1 : undefined };
  return choice(R, {
    id: `shiftRule-${n}`, family: 'shiftRule', prompt: `Rewrite ${recH(old)} with the rule written forward (the next term from the current one), without changing the sequence.`,
    board: recT(old),
    solution: [`Put n + 1 where n was: the rule ${atH(N, 'n')} = ${atH(N, 'n−1')}${sgH(d, false)} for n ≥ 2 becomes ${atH(N, 'n+1')} = ${atH(N, 'n')}${sgH(d, false)}, now for n + 1 ≥ 2, so n ≥ 1${fin ? ` and n + 1 ≤ ${M}, so n ≤ ${M - 1}` : ''}.`, `Seed unchanged: ${atH(N, 1)} = ${nH(c)}. Both list ${listH(terms(c, d, 4))}.`],
  }, [
    { t: recH(nw), ok: true, say: 'Right: the same seed, and the rule range shifts down by one.' },
    { t: recH({ ...nw, lo: 2, hi: fin ? M : undefined }), mc: MC.oldRange, say: `With n ≥ 2 the forward rule never makes ${atH(N, 2)}. The range must shift with the rewrite.` },
    { t: recH({ ...nw, noRange: true }), mc: MC.noRange, say: 'A rule needs its range: for which n does it hold?' },
    { t: recH({ ...nw, n0: 0, lo: 0, hi: fin ? M - 2 : undefined }), mc: MC.shift1, say: `That moves the seed to ${atH(N, 0)}: every label changes. The task keeps the labels.` },
  ]);
};
const shiftBound: Gen = (R, n) => {
  const fn = R() < 0.6, N = fn ? F : A, d = pickD(R, 'nz'), c = pickA1(R, -10, 30), M = int(R, 7, 25);
  const old: RecDef = { N, n0: 1, seed: c, d, back: true, lo: 2, hi: M };
  if (R() < 0.6) return numItem({
    id: `shiftBound-${n}`, family: 'shiftBound', prompt: `${recH(old)}. Rewritten as ${atH(N, 'n+1')} = ${atH(N, 'n')}${sgH(d, false)} for 1 ≤ <i>n</i> ≤ □. What is the upper bound?`,
    board: recT(old),
    solution: [`The last term made is ${atH(N, M)}. In the forward rule, n + 1 = ${M}.`, `So n goes up to ${ans(M - 1)}.`],
  }, M - 1, `Right: 1 ≤ n ≤ ${M - 1} still makes ${atH(N, 2)} to ${atH(N, M)}.`, [
    [M, MC.oldRange, `With n = ${M} the forward rule would make ${atH(N, M + 1)}, one term too many. Shift the bound too.`],
  ], `The forward rule makes ${atH(N, 'n+1')}: which n gives n + 1 = ${M}?`);
  const k = int(R, 3, 6), val = term(c, d, k);
  return numItem({
    id: `shiftBound-${n}`, family: 'shiftBound', prompt: `Check the rewrite: ${recH({ ...old, back: false, lo: 1, hi: M - 1 })}. List from the seed: what is ${atH(N, k)}?`,
    board: recT({ ...old, back: false, lo: 1, hi: M - 1 }),
    solution: [`${atH(N, 2)} comes from n = 1, ${atH(N, 3)} from n = 2, …`, `${listH(terms(c, d, k))}: ${atH(N, k)} = ${ans(nH(val))}, the same as the original rule.`],
  }, val, `Right: ${atH(N, k)} = ${nH(val)} both ways.`, [
    [term(c, d, k + 1), MC.shift1, `That is ${atH(N, k + 1)}. n = 1 makes term 2, so term ${k} needs n = ${k - 1}.`],
    [k + d, MC.curIdx, 'The rule adds d to the previous TERM, not to n.'],
  ], `Start at ${nH(c)} and add ${nH(d)} for each step.`);
};

// =====================================================================================================================
// 19 reindex-explicit
// =====================================================================================================================
const reindexExp: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -10, 30);
  if (a1 === d) return reindexExp(R, n);
  return pairItem({
    id: `reindexExp-${n}`, family: 'reindexExp', prompt: `g(<i>n</i>) = ${expRH(a1, d)} for <i>n</i> ≥ 1 lists ${listH(terms(a1, d, 3))}, … Relabel the SAME terms from <i>n</i> = 0: f(<i>n</i>) = g(<i>n</i> + 1) for <i>n</i> ≥ 0.`,
    board: `g(n) = ${expRT(a1, d)},\\ n \\ge 1`,
    solution: [`f(n) = g(n + 1) = ${nH(a1)} + ${pn(d)}((n + 1) − 1) = ${expRH(a1, d, 0)}.`, `f(0) = ${ans(nH(a1))} = g(1), the same first term; d = ${ans(nH(d))}.`],
    picture: { strip: { ns: [0, 1, 2, 3], vals: terms(a1, d, 4), idx: 'n (f)', name: 'f(n)', ell: true } },
  }, a1, d, { lead: '<i>f</i>(<i>n</i>) =', op: '+', tail: `${nI}, ${nI} ≥ 0` }, `Right: f(n) = ${expRH(a1, d, 0)} for n ≥ 0: the same terms, new labels.`, [
    [a1 - d, d, MC.relabelExt, `${nH(a1 - d)} would be a NEW term before ${nH(a1)}: that extends backward. Relabelling keeps the terms: f(0) = ${nH(a1)}.`],
    [a1 + d, d, MC.shift1, `f(0) must be g(1) = ${nH(a1)}, the first term.`],
  ], `f(0) = g(1): the first term goes in front.`);
};
const sameTerms: Gen = (R, n) => {
  const d = pickD(R, 'nz'), a1 = pickA1(R, -10, 30);
  return choice(R, {
    id: `sameTerms-${n}`, family: 'sameTerms', prompt: `g(<i>n</i>) = ${expRH(a1, d)} for <i>n</i> ≥ 1. Which lists exactly the same terms, labelled from <i>n</i> = 0?`,
    board: `g(n) = ${expRT(a1, d)},\\ n \\ge 1`,
    solution: [`g lists ${listH(terms(a1, d, 3))}, …`, `f(n) = ${expRH(a1, d, 0)} for n ≥ 0 lists f(0) = ${nH(a1)}, f(1) = ${nH(a1 + d)}, …: the same terms.`],
  }, [
    { t: `f(${nI}) = ${expRH(a1, d, 0)} for ${nI} ≥ 0`, ok: true, say: 'Right: f(0) = g(1), f(1) = g(2), …' },
    { t: `h(${nI}) = ${expRH(r6(a1 + d), d)} for ${nI} ≥ 1`, mc: MC.rangeOpt, say: `That expression equals ${linH(d, a1)}, but for n ≥ 1 it starts at ${nH(a1 + d)}: equal expressions on different domains give different lists.` },
    { t: `f(${nI}) = ${expRH(r6(a1 - d), d, 0)} for ${nI} ≥ 0`, mc: MC.relabelExt, say: `That starts at ${nH(a1 - d)}: a new term in front. That is extending backward, not relabelling.` },
    { t: `f(${nI}) = ${expRH(a1, d, 0)} for ${nI} ≥ 1`, mc: MC.oldRange, say: `With n ≥ 1 that list starts at ${nH(a1 + d)}: the domain must move to n ≥ 0 too.` },
  ]);
};

// =====================================================================================================================
// 20 reindex-recursive
// =====================================================================================================================
const reindexRec: Gen = (R, n) => {
  const d = pickD(R, 'nz'), c = pickA1(R, -10, 30), fin = R() < 0.35, M = int(R, 8, 16);
  const f: RecDef = { N: F, n0: 1, seed: c, d, back: false, lo: 1, hi: fin ? M - 1 : undefined };
  const G: Nm = { s: 'g', fn: true };
  const g: RecDef = { N: G, n0: 0, seed: c, d, back: false, lo: 0, hi: fin ? M - 2 : undefined };
  return choice(R, {
    id: `reindexRec-${n}`, family: 'reindexRec', prompt: `${recH(f)}. Relabel from 0 with g(<i>n</i>) = f(<i>n</i> + 1). Which definition of g is right?`,
    board: recT(f),
    solution: [`g(0) = f(1) = ${nH(c)}: the seed keeps its value, its label becomes 0.`, `The rule shifts down one: n ≥ 0${fin ? `, up to n ≤ ${M - 2}` : ''}. Both list ${listH(terms(c, d, 3))}, …`],
  }, [
    { t: recH(g), ok: true, say: 'Right: same terms, labels one lower.' },
    { t: recH({ ...g, seed: r6(c - d) }), mc: MC.relabelExt, say: `g(0) = ${nH(c - d)} adds a new term before ${nH(c)}: that is extending backward.` },
    { t: recH({ ...g, lo: 1, hi: fin ? M - 1 : undefined }), mc: MC.oldRange, say: 'With n ≥ 1 the rule never makes g(1) from g(0). The range moves down with the labels.' },
    { t: recH({ ...g, noRange: true }), mc: MC.noRange, say: 'Say for which n the rule holds.' },
  ]);
};
const relabelBound: Gen = (R, n) => {
  const d = pickD(R, 'nz'), c = pickA1(R, -10, 30), M = int(R, 7, 25);
  if (R() < 0.55) return numItem({
    id: `relabelBound-${n}`, family: 'relabelBound', prompt: `<i>f</i> has exactly ${M} terms, <i>f</i>(1) to <i>f</i>(${M}). Relabel with g(<i>n</i>) = <i>f</i>(<i>n</i> + 1) for 0 ≤ <i>n</i> ≤ □. What is the upper bound?`,
    board: `g(n) = f(n+1),\\ 0 \\le n \\le \\square`,
    solution: [`The last term is f(${M}) = g(n) when n + 1 = ${M}.`, `n = ${ans(M - 1)}.`],
  }, M - 1, `Right: g(0) to g(${M - 1}), still ${M} terms.`, [
    [M, MC.oldRange, `g(${M}) = f(${M + 1}), which does not exist. The bound moves down by one too.`],
  ], `Which n gives n + 1 = ${M}?`);
  const vs = terms(c, d, 6), k = int(R, 1, 4);
  return numItem({
    id: `relabelBound-${n}`, family: 'relabelBound', prompt: `<i>f</i>(1), <i>f</i>(2), … is ${listH(vs)}, … and g(<i>n</i>) = <i>f</i>(<i>n</i> + 1) for <i>n</i> ≥ 0. What is g(${k})?`,
    board: `g(${k}) = f(${k}+1)`,
    solution: [`g(${k}) = f(${k + 1}).`, `f(${k + 1}) is the ${k + 1}th term listed: ${ans(nH(vs[k]!))}.`],
    picture: { strip: { ns: [1, 2, 3, 4, 5, 6], vals: vs, name: 'f(n)', jumps: false } },
  }, vs[k]!, `Right: g(${k}) = f(${k + 1}) = ${nH(vs[k]!)}.`, [
    [vs[k - 1]!, MC.shift1, `That is f(${k}). g(${k}) is f(${k} + 1).`],
    [vs[k - 1]! + 1, MC.shiftAdd, `f(n + 1) means the next term, not one more than f(n).`],
  ], `g(${k}) = f(${k + 1}): read term number ${k + 1}.`);
};

// =====================================================================================================================
// 21 context-index-choice
// =====================================================================================================================
interface Ctx { story: (a: number, d: number) => string; n0: 0 | 1; idx: string; unit: string; letter: string; money: boolean; a: () => number; d: () => number; sign: 1 | -1; ask: (k: number) => string }
const CTX = (R: () => number): Ctx[] => [
  { story: (a, d) => `You have ${usd(a)} now and save ${usd(d)} each week.`, n0: 0, idx: 'n = weeks from now', unit: 'dollars', letter: 's', money: true, a: () => int(R, 2, 12) * 10, d: () => pick(R, [5, 10, 15, 20, 25]), sign: 1, ask: k => `after ${k} weeks` },
  { story: (a, d) => `Row 1 of a theater has ${a} seats; each row behind has ${d} more.`, n0: 1, idx: 'n = row number', unit: 'seats', letter: 'r', money: false, a: () => int(R, 10, 24), d: () => int(R, 2, 4), sign: 1, ask: k => `in row ${k}` },
  { story: (a, d) => `It is ${a}°F now and the temperature drops ${d}°F each hour.`, n0: 0, idx: 'n = hours from now', unit: '°F', letter: 'T', money: false, a: () => int(R, 40, 75), d: () => int(R, 2, 4), sign: -1, ask: k => `after ${k} hours` },
  { story: (a, d) => `A rental van costs ${usd(a)} plus ${usd(d)} per mile.`, n0: 0, idx: 'n = miles driven', unit: 'dollars', letter: 'c', money: true, a: () => pick(R, [25, 30, 40]), d: () => pick(R, [0.25, 0.5, 0.75]), sign: 1, ask: k => `for ${k} miles` },
  { story: (a, d) => `Floor 1 of a tower is ${a} ft above the street; each floor is ${d} ft higher.`, n0: 1, idx: 'n = floor number', unit: 'ft', letter: 'h', money: false, a: () => int(R, 12, 20), d: () => int(R, 10, 14), sign: 1, ask: k => `for floor ${k}` },
];
const ctxValue: Gen = (R, n) => {
  const c = pick(R, CTX(R)), a = c.a(), d0 = c.d(), d = c.sign * d0, k = int(R, 3, 30);
  const val = term(a, d, k, c.n0), other = term(a, d, k, c.n0 === 0 ? 1 : 0);
  const show = (v: number) => (c.money ? usd(v) : nH(v));
  return numItem({
    id: `ctxValue-${n}`, family: 'ctxValue', unit: c.unit, prompt: `${c.story(a, d0)} Model it with ${c.idx} (start at <i>n</i> = ${c.n0}). What is the value ${c.ask(k)}?${c.money && isFrac(d) ? ' (Calculator allowed.)' : ''}`,
    board: `${c.letter}_{${c.n0}} = ${nT(a)},\\ d = ${nT(d)}`,
    solution: [`The start ${show(a)} is at n = ${c.n0}, so ${c.letter}<sub>n</sub> = ${c.n0 === 0 ? expRH(a, d, 0) : expRH(a, d)} for n ≥ ${c.n0}.`, `n = ${k}: ${show(a)} ${d < 0 ? '−' : '+'} ${c.n0 === 0 ? k : k - 1} × ${show(Math.abs(d))} = ${ans(show(val))}.`],
  }, val, `Right: ${show(val)}.`, [
    [other, MC.shift1, c.n0 === 0 ? `The start is at n = 0 (now), so after ${k} ${c.idx.includes('mile') ? 'miles' : 'steps'} there are ${k} changes, not ${k - 1}.` : `Row/floor 1 already has the start, so there are ${k - 1} changes, not ${k}.`],
  ], `Count the changes from the start at n = ${c.n0} to n = ${k}.`);
};
const ctxModel: Gen = (R, n) => {
  const c = pick(R, CTX(R)), a = c.a(), d0 = c.d(), d = c.sign * d0;
  const L = `${c.letter}<sub>n</sub>`, dom = rangeH(c.n0), domOther = rangeH(c.n0 === 0 ? 1 : 0);
  const right = c.n0 === 0 ? expRH(a, d, 0) : expRH(a, d), shifted = c.n0 === 0 ? expRH(a, d) : expRH(a, d, 0);
  return choice(R, {
    id: `ctxModel-${n}`, family: 'ctxModel', prompt: `${c.story(a, d0)} Using ${c.idx}, which model (with its domain) fits?`, board: `${c.letter}_n = \\,?`,
    solution: [`The start ${c.money ? usd(a) : nH(a)} belongs to n = ${c.n0} (${c.n0 === 0 ? 'nothing has happened yet' : 'the first one'}).`, `${L} = ${right} for ${dom}: d = ${nH(d)} per step.`],
  }, [
    { t: `${L} = ${right} for ${dom}`, ok: true, say: `Right: the start sits at n = ${c.n0}, and the change ${nH(d)} comes once per step.` },
    { t: `${L} = ${shifted} for ${dom}`, mc: MC.shift1, say: c.n0 === 0 ? 'At n = 0 that gives the start minus one step. "Now" is n = 0: no change yet.' : 'At n = 1 that already adds one change. Row/floor 1 is the start itself.' },
    { t: `${L} = ${c.n0 === 0 ? expRH(d, a, 0) : expRH(d, a)} for ${dom}`, mc: MC.a1Coef, say: 'The start goes in front; the change per step multiplies n.' },
    { t: `${L} = ${right} for ${domOther}`, mc: MC.rangeOpt, say: c.n0 === 0 ? 'With n ≥ 1 the model leaves out "now" (n = 0).' : 'There is no row or floor 0: the domain starts at 1.' },
  ]);
};

// =====================================================================================================================
export const GENERATORS: Record<string, Gen> = {
  findD, consistent, fRead, fMeaning, termAt, neighbor, graphRead, graphPick, recNext, recTwo, recWrite, recFinite,
  countJumps, deriveForm, evalFar, evalMoney, formFromList, formFromGraph, whichN, isTerm, constCase, twoTerms, gapD, determined,
  recToExp, recToExpChoice, expand, slopeOf, seedOf, expToRec, equivWhich, equivPair, whyLine, slopeBetween, firstVsZero,
  interceptTerm, shiftRule, shiftBound, reindexExp, sameTerms, reindexRec, relabelBound, ctxValue, ctxModel,
};
export const FAMILY_NAMES: Record<string, string> = {
  findD: 'The common difference', consistent: 'Arithmetic or not?', fRead: 'Reading f(n)', fMeaning: 'What f(n) means',
  termAt: 'Position and value', neighbor: 'The term before or after', graphRead: 'Reading the points', graphPick: 'What the graph looks like',
  recNext: 'From a recursive rule', recTwo: 'The next two terms', recWrite: 'Write the recursive definition', recFinite: 'A finite sequence',
  countJumps: 'Counting the jumps', deriveForm: 'The formula for every term', evalFar: 'A far term', evalMoney: 'A far term in a story',
  formFromList: 'Formula from a list', formFromGraph: 'Formula from a graph', whichN: 'Which term?', isTerm: 'Is it a term?',
  constCase: 'When d = 0', twoTerms: 'Formula from two terms', gapD: 'A table with gaps', determined: 'Do two terms decide it?',
  recToExp: 'Recursive to explicit', recToExpChoice: 'Same sequence, explicit', expand: 'Slope-intercept form', slopeOf: 'Reading d',
  seedOf: 'The seed', expToRec: 'Explicit to recursive', equivWhich: 'Why the forms agree', equivPair: 'Start and step',
  whyLine: 'Points on one line', slopeBetween: 'Slope between two terms', firstVsZero: 'First term vs intercept',
  interceptTerm: 'Is the intercept a term?', shiftRule: 'Forward rule', shiftBound: 'Shifting the rule range',
  reindexExp: 'Relabel from 0', sameTerms: 'Same terms, new labels', reindexRec: 'Relabel the recursion', relabelBound: 'Labels and bounds',
  ctxValue: 'Choosing the start index', ctxModel: 'Model the story',
};
