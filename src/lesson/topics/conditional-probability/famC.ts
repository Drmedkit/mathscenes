// famC.ts: stage-3 families of "Conditional probability and independence" (sub-goals 21-31): mutually exclusive
// events, the addition rule, why disjoint events (positive probabilities) are dependent, overlap versus independence,
// the empty event, sample-to-sample variation of a proportion, approximate independence in survey data, choosing the
// conditional comparison in context, total probability, Bayes' theorem and the base rate. Pure: no DOM.
import { red, redP, type Gen, type Opt, CALC, MC, ans, choice, dec, decFixed, fracItem, ft, int, noTie, numItem, pick, round, shuffle, until, who } from './common';
import { CTX2, DIE, cellsOf, countD, diceEvent, genClose, genTable, numEvent, range, sameEvent, shareGap, totals } from './cp';
import { diceGrid, setText, tablePic } from './famA';
import type { CPic } from './CondPic';

// ---------- die events as sets ----------
interface SEv { t: string; set: number[] }
const dieEvents = (R: () => number): SEv[] => {
  const k = int(R, 2, 4), j = int(R, 3, 5);
  return [
    { t: 'the roll is even', set: [2, 4, 6] }, { t: 'the roll is odd', set: [1, 3, 5] }, { t: `the roll is greater than ${k}`, set: DIE.filter(x => x > k) },
    { t: `the roll is less than ${j}`, set: DIE.filter(x => x < j) }, { t: 'the roll is prime (2, 3 or 5)', set: [2, 3, 5] }, { t: 'the roll is a 6', set: [6] },
    { t: 'the roll is a multiple of 3', set: [3, 6] }, { t: 'the roll is 1 or 2', set: [1, 2] }, { t: 'the roll is a 1', set: [1] }, { t: 'the roll is 4 or 5', set: [4, 5] },
  ];
};
const meet = (a: number[], b: number[]) => a.filter(x => b.includes(x));
const covers = (a: number[], b: number[], N = 6) => new Set([...a, ...b]).size === N;

// ===================== mutually-exclusive-definition =====================
export const exclWhich: Gen = (R, n) => {
  const E = dieEvents(R);
  const pairs: [SEv, SEv][] = [];
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) if (E[i]!.set.join() !== E[j]!.set.join()) pairs.push([E[i]!, E[j]!]);
  const disj = pairs.filter(([a, b]) => meet(a.set, b.set).length === 0 && !covers(a.set, b.set));
  const over = pairs.filter(([a, b]) => meet(a.set, b.set).length > 0);
  const right = pick(R, disj);
  const exh = shuffle(R, over.filter(([a, b]) => covers(a.set, b.set)))[0];
  const rest = shuffle(R, over.filter(p => p !== exh)).slice(0, exh ? 2 : 3);
  const txt = ([a, b]: [SEv, SEv]) => `"${a.t}" and "${b.t}"`;
  const opts: Opt[] = [
    { t: txt(right), ok: true, key: 'r', say: `Right: ${setText(right[0].set)} and ${setText(right[1].set)} share no outcome. They don't have to cover every roll.` },
    ...(exh ? [{ t: txt(exh), key: 'exh', mc: MC.misExcl, say: `Together they cover every roll, but ${meet(exh[0].set, exh[1].set).join(' and ')} ${meet(exh[0].set, exh[1].set).length === 1 ? 'is' : 'are'} in both. Mutually exclusive means no outcome in both.` }] : []),
    ...rest.map((p, q) => ({ t: txt(p), key: `o${q}`, mc: p[0].set.length !== p[1].set.length ? MC.exclUnequal : undefined, say: `${meet(p[0].set, p[1].set).join(' and ')} ${meet(p[0].set, p[1].set).length === 1 ? 'is' : 'are'} in both events, so they can happen together.` })),
  ];
  return choice(R, {
    id: `exclWhich-${n}`, family: 'exclWhich',
    prompt: `${who(R)} rolls one fair die. Which pair of events is <b>mutually exclusive</b> (disjoint)?`,
    board: `A \\cap B = \\varnothing`,
    picture: { pics: [{ kind: 'chips', items: DIE.map(String) }] },
    solution: ['Mutually exclusive means no outcome is in both: the events cannot happen on the same roll.', `${right[0].t}: ${setText(right[0].set)}; ${right[1].t}: ${setText(right[1].set)}. Nothing in common.`, `So: ${ans(txt(right))}`],
  }, opts);
};
export const exclYesNo: Gen = (R, n) => {
  const N = int(R, 10, 20), xs = range(N);
  const wantDisj = R() < 0.5;
  const { a, b } = until(() => ({ a: numEvent(R, N), b: numEvent(R, N) }), ({ a, b }) => {
    const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x));
    return a.s !== b.s && A.length >= 2 && B.length >= 2 && A.length !== B.length && (I.length === 0) === wantDisj && !covers(A, B, N);
  }, 8000);
  const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x));
  return choice(R, {
    id: `exclYesNo-${n}`, family: 'exclYesNo',
    prompt: `A number is picked at random from 1 to ${N}. A: <b>${a.t}</b>. B: <b>${b.t}</b>. Are A and B mutually exclusive?`,
    board: `A \\cap B \\overset{?}{=} \\varnothing`,
    picture: { pics: [{ kind: 'chips', items: xs.map(String), A: A.map(x => x - 1), B: B.map(x => x - 1), legend: [`A: ${a.s}`, `B: ${b.s}`] }] },
    solution: [`A = ${setText(A)}; B = ${setText(B)}.`, I.length ? `${I.join(', ')} ${I.length === 1 ? 'is' : 'are'} in both, so they are not mutually exclusive.` : 'No number is in both, so they are mutually exclusive.'],
  }, [
    { t: 'Yes: no outcome is in both', ok: !I.length, key: 'y', say: !I.length ? 'Right: A ∩ B is empty.' : `${I.join(', ')} ${I.length === 1 ? 'is' : 'are'} in both.` },
    { t: `No: ${I.length ? `${I.join(', ')} ${I.length === 1 ? 'is' : 'are'}` : 'some number is'} in both`, ok: !!I.length, key: 'n', say: I.length ? 'Right: they can happen together.' : 'Check each number: none is in both lists.' },
    ...(I.length ? [{ t: `Yes: P(A) = ${ft(A.length, N)} and P(B) = ${ft(B.length, N)} are different`, key: 'uneq', mc: MC.exclUnequal, say: 'Different probabilities say nothing about overlap. Look for outcomes in both.' }]
      : [{ t: 'No: together they do not cover every number', key: 'cover', mc: MC.misExcl, say: 'Mutually exclusive events need not cover everything. The test is: no outcome in both.' }]),
  ]);
};

// ===================== addition-rule =====================
export const addTable: Gen = (R, n) => {
  const ctx = pick(R, CTX2), cells = genTable(R, 2, 2, 40, 200);
  const T = totals(cells), r = 0, c = 0;
  const row = ctx.rows[r]!, col = ctx.cols[c]!, v = T.row[r]! + T.col[c]! - cells[r]![c]!;
  return fracItem({
    id: `addTable-${n}`, family: 'addTable',
    prompt: `${ctx.place} (${T.all} in all). One ${ctx.one} is picked at random. What is the probability the ${ctx.one} ${row.one} <b>or</b> ${col.one} (or both)?`,
    board: `P(A \\cup B) = P(A) + P(B) - P(A \\cap B)`,
    picture: { pics: [tablePic(ctx, cells, { parts: [[r, 0], [r, 1], [1 - r, c]] })] },
    solution: [`${row.label}: ${T.row[r]}. ${col.label}: ${T.col[c]}. Both: ${cells[r]![c]}, counted in each total.`, `(${T.row[r]} + ${T.col[c]} − ${cells[r]![c]})/${T.all} = ${red(v, T.all)}.`],
  }, v, T.all, `Yes: ${v} of the ${T.all} ${ctx.who} are in at least one of the groups.`,
  [[T.row[r]! + T.col[c]!, T.all, MC.overlap, `That counts the ${cells[r]![c]} ${ctx.who} in both groups twice. Subtract them once.`],
   [T.row[r]! * T.col[c]!, T.all * T.all, MC.multOr, 'Multiplying is for "and" with independent events. "Or" adds, then removes the overlap.'],
   [cells[r]![c]!, T.all, MC.andOr, 'That is only the ones in both. "Or" means at least one.']],
  'Add the two totals, then subtract the cell that is in both.');
};
export const addGiven: Gen = (R, n) => {
  const v = pick(R, ['or', 'or', 'missing', 'disjoint'] as const);
  if (v === 'disjoint') {
    const pa = int(R, 1, 5) / 10, pb = int(R, 1, 4) / 10;
    const S = pick(R, ['A: a randomly chosen student is a freshman; B: the student is a senior', 'A: the spinner lands on red; B: it lands on blue', 'A: a car in the lot is white; B: the car is black']);
    return numItem({
      id: `addGiven-${n}`, family: 'addGiven',
      prompt: `${S}. A and B are mutually exclusive. P(A) = ${dec(pa, 2)} and P(B) = ${dec(pb, 2)}. What is P(A or B)? Give a decimal.`,
      board: `P(A \\cup B) = P(A) + P(B) - P(A \\cap B)`, unit: '',
      picture: { pics: [{ kind: 'venn', a: 'A', b: 'B', layout: 'apart', vals: { a: dec(pa, 2), b: dec(pb, 2), out: dec(round(1 - pa - pb, 2), 2) } }] },
      solution: ['Mutually exclusive: P(A and B) = 0, nothing to subtract.', `${dec(pa, 2)} + ${dec(pb, 2)} = ${ans(dec(round(pa + pb, 2), 2))}.`],
    }, round(pa + pb, 4), `Yes: no overlap, so just add: ${dec(round(pa + pb, 2), 2)}.`,
    [[round(pa + pb - pa * pb, 4), MC.subDisjoint, `That subtracts P(A) × P(B), but these events have no overlap: P(A and B) = 0.`], [round(pa * pb, 4), MC.multOr, '"Or" adds; multiplying is for "and".']],
    'Mutually exclusive: P(A or B) = P(A) + P(B).');
  }
  const z = until(() => ({ pa: int(R, 2, 7) / 10, pb: int(R, 2, 6) / 10, pab: int(R, 5, 30) / 100 }), q => q.pab < Math.min(q.pa, q.pb) && q.pa + q.pb - q.pab <= 0.95 && q.pa + q.pb > 0.5);
  const por = round(z.pa + z.pb - z.pab, 4);
  const S = pick(R, ['A: a shopper buys bread; B: the shopper buys milk', 'A: a student plays a sport; B: the student is in a club', 'A: it is windy; B: it rains', 'A: a viewer streams a show; B: the viewer watches live TV']);
  if (v === 'or') return numItem({
    id: `addGiven-${n}`, family: 'addGiven',
    prompt: `${S}. P(A) = ${dec(z.pa, 2)}, P(B) = ${dec(z.pb, 2)} and P(A and B) = ${dec(z.pab, 2)}. What is P(A or B)? Give a decimal.`,
    board: `P(A \\cup B) = P(A) + P(B) - P(A \\cap B)`, unit: '',
    picture: { pics: [{ kind: 'venn', a: 'A', b: 'B', vals: { a: dec(round(z.pa - z.pab, 2), 2), ab: dec(z.pab, 2), b: dec(round(z.pb - z.pab, 2), 2), out: dec(round(1 - por, 2), 2) }, hide: ['a', 'b', 'out'], hl: ['a', 'ab', 'b'] }] },
    solution: ['P(A) and P(B) both include the overlap, so subtract it once.', `${dec(z.pa, 2)} + ${dec(z.pb, 2)} − ${dec(z.pab, 2)} = ${ans(dec(por, 4))}.`],
  }, por, `Yes: ${dec(por, 4)}, the chance at least one happens.`,
  [[round(z.pa + z.pb, 4), MC.overlap, `That counts the overlap (${dec(z.pab, 2)}) twice.`], [round(z.pa * z.pb, 4), MC.multOr, '"Or" adds and removes the overlap; it does not multiply.'], [z.pab, MC.andOr, 'That is "and". "Or" is at least one.']],
  'P(A or B) = P(A) + P(B) − P(A and B).');
  return numItem({
    id: `addGiven-${n}`, family: 'addGiven',
    prompt: `${S}. P(A) = ${dec(z.pa, 2)}, P(B) = ${dec(z.pb, 2)} and P(A or B) = ${dec(por, 2)}. What is P(A and B)? Give a decimal.`,
    board: `${dec(por, 2)} = ${dec(z.pa, 2)} + ${dec(z.pb, 2)} - P(A \\cap B)`, unit: '',
    solution: ['Put the numbers in the addition rule and solve for the overlap.', `P(A and B) = ${dec(z.pa, 2)} + ${dec(z.pb, 2)} − ${dec(por, 2)} = ${ans(dec(z.pab, 2))}.`],
  }, z.pab, `Yes: the overlap is ${dec(z.pab, 2)}, counted twice in P(A) + P(B).`,
  [[round(z.pa * z.pb, 4), MC.assumeIndep, 'Multiplying assumes independence, which nobody said. Use the addition rule.'], [round(z.pa + z.pb, 4), undefined, 'That is P(A) + P(B). Subtract P(A or B) from it.']],
  'Rearrange: P(A and B) = P(A) + P(B) − P(A or B).');
};
export const addDice: Gen = (R, n) => {
  const { a, b } = until(() => ({ a: diceEvent(R, 'sum,atleast,atmost,face,greater'), b: diceEvent(R, 'doubles,parity,six,face,greater') }), ({ a, b }) => {
    const nab = countD((r, x) => a.f(r, x) && b.f(r, x));
    return !sameEvent(a, b) && nab >= 1 && nab < Math.min(countD(a.f), countD(b.f)) && countD((r, x) => a.f(r, x) || b.f(r, x)) <= 30;
  });
  const na = countD(a.f), nb = countD(b.f), nab = countD((r, x) => a.f(r, x) && b.f(r, x)), nor = na + nb - nab;
  return fracItem({
    id: `addDice-${n}`, family: 'addDice',
    prompt: `Roll a red die and a blue die. What is the probability that <b>${a.t}</b> or <b>${b.t}</b>?`,
    board: `P(A \\cup B) = \\tfrac{${na}}{36} + \\tfrac{${nb}}{36} - P(A \\cap B) = \\,?`,
    picture: { pics: [diceGrid({ A: cellsOf(a.f), B: cellsOf(b.f) })] },
    solution: [`A: ${na} cells. B: ${nb} cells. Both: ${nab}.`, `(${na} + ${nb} − ${nab})/36 = ${red(nor, 36)}.`],
  }, nor, 36, `Yes: ${nor} of the 36 rolls.`,
  [[na + nb, 36, MC.overlap, `The ${nab} ${nab === 1 ? 'roll' : 'rolls'} in both got counted twice.`], [na * nb, 1296, MC.multOr, '"Or" adds and removes the overlap.']],
  'Add the two counts and subtract the cells in both.');
};

// ===================== exclusive-implies-dependent =====================
export const exclDep: Gen = (R, n) => {
  let A: string, Bt: string, pa: string, pb: string, prod: string;
  const die = R() < 0.5;
  if (die) {
    const E = dieEvents(R);
    const [a, b] = until(() => shuffle(R, E.slice()).slice(0, 2) as [SEv, SEv], ([x, y]) => meet(x.set, y.set).length === 0);
    A = a.t; Bt = b.t; pa = ft(a.set.length, 6); pb = ft(b.set.length, 6); prod = ft(a.set.length * b.set.length, 36);
  } else {
    const x = int(R, 1, 5) / 10, y = int(R, 1, 4) / 10;
    const S = pick(R, [['a randomly chosen game is a win', 'the game is a loss'], ['the next customer pays cash', 'the customer pays by card'], ['a student is in grade 9', 'the student is in grade 12']] as const);
    A = `${S[0]} (P = ${dec(x, 2)})`; Bt = `${S[1]} (P = ${dec(y, 2)})`; pa = dec(x, 2); pb = dec(y, 2); prod = dec(round(x * y, 4), 4);
  }
  return choice(R, {
    id: `exclDep-${n}`, family: 'exclDep',
    prompt: `${die ? 'Roll one six-sided die. ' : ''}A: <b>${A}</b>. B: <b>${Bt}</b>. A and B can't happen together. Are they independent?`,
    board: `P(A \\cap B) = 0 \\quad P(A)\\,P(B) = \\,?`,
    solution: ['They are mutually exclusive, so P(A and B) = 0.', `But P(A) × P(B) = ${pa} × ${pb} = ${prod} > 0.`, 'The product test fails: dependent. (If B happens, A becomes impossible.)'],
  }, [
    { t: `Dependent: P(A and B) = 0, but P(A) × P(B) = ${prod}`, ok: true, key: 'd', say: 'Right: knowing B happened makes A impossible, so B changes the chance of A.' },
    { t: 'Independent: they have no outcomes in common', key: 'disj', mc: MC.disjIndep, say: 'No overlap is the strongest link there is: if B happens, A cannot.' },
    { t: 'Independent: P(A and B) = 0 = P(A) × P(B)', key: 'eq', say: `P(A) × P(B) = ${prod}, not 0.` },
    { t: 'Can’t tell without a table', key: 'cant', say: 'The product test needs only these probabilities.' },
  ]);
};
export const exclDepWhy: Gen = (R, n) => {
  const p = int(R, 1, 6) / 10, q = until(() => int(R, 1, 6) / 10, x => x !== p && x + p <= 1);
  const L = pick(R, [['A', 'B'], ['E', 'F'], ['M', 'N'], ['X', 'Y']] as const);
  return choice(R, {
    id: `exclDepWhy-${n}`, family: 'exclDepWhy',
    prompt: `Events ${L[0]} and ${L[1]} are mutually exclusive, with P(${L[0]}) = ${dec(p, 2)} and P(${L[1]}) = ${dec(q, 2)}. Which argument proves they are dependent, and would work for <b>any</b> mutually exclusive events with positive probabilities?`,
    board: `P(${L[0]} \\mid ${L[1]}) = \\dfrac{P(${L[0]} \\cap ${L[1]})}{P(${L[1]})}`,
    solution: [`Disjoint: P(${L[0]} and ${L[1]}) = 0, so P(${L[0]} | ${L[1]}) = 0 ÷ P(${L[1]}) = 0.`, `But P(${L[0]}) > 0. Knowing ${L[1]} changed the chance of ${L[0]}: dependent, whatever the positive numbers are.`],
  }, [
    { t: `P(${L[0]} | ${L[1]}) = 0, but P(${L[0]}) > 0, so knowing ${L[1]} changes the chance of ${L[0]}`, ok: true, key: 'r', say: 'Right: it uses only "disjoint" and "positive", so it works every time.' },
    { t: 'Disjoint events never affect each other, so they are independent', key: 'disj', mc: MC.disjIndep, say: `If ${L[1]} happens, ${L[0]} can't: that is a very strong effect.` },
    { t: `P(${L[0]}) = ${dec(p, 2)} and P(${L[1]}) = ${dec(q, 2)} are different, so the events are dependent`, key: 'uneq', mc: MC.exclUnequal, say: 'Different probabilities prove nothing: independent events can have different probabilities too.' },
    { t: 'Two dice examples showed disjoint events were dependent, so it is always true', key: 'ex', mc: MC.examples, say: 'Examples can\'t cover every case. The argument has to use only what all such events share.' },
  ]);
};

// ===================== overlap-vs-independence =====================
const CLASS = ['Independent and mutually exclusive', 'Independent and overlapping', 'Dependent and mutually exclusive', 'Dependent and overlapping'];
function classOpts(indep: boolean, excl: boolean, why: string): Opt[] {
  const right = (indep ? 0 : 2) + (excl ? 0 : 1);
  return CLASS.map((t, i) => {
    const iIndep = i < 2, iExcl = i % 2 === 0;
    const mc = i === right ? undefined : excl && !indep && i === 0 ? MC.disjIndep : !excl && !indep && i === 1 ? MC.exhaustive : undefined;
    const say = i === right ? `Right: ${why}` : iExcl !== excl ? (excl ? 'They share no outcome: they are mutually exclusive.' : 'They share outcomes: they overlap.') : iIndep !== indep ? (indep ? 'Check the product test: P(A) × P(B) equals P(A and B).' : 'Check the product test: P(A) × P(B) is not P(A and B).') : why;
    return { t: t, ok: i === right, key: String(i), mc, say };
  });
}
export const classifyVenn: Gen = (R, n) => {
  const kind = pick(R, ['apart', 'indep', 'dep', 'inside'] as const);
  let pa: number, pb: number, pab: number;
  if (kind === 'apart') { pa = int(R, 2, 5) / 10; pb = int(R, 1, 4) / 10; pab = 0; }
  else if (kind === 'indep') { [pa, pb] = pick(R, [[0.5, 0.4], [0.4, 0.5], [0.6, 0.5], [0.2, 0.5], [0.4, 0.25], [0.8, 0.5], [0.3, 0.6], [0.6, 0.3], [0.5, 0.2], [0.4, 0.4]]); pab = round(pa * pb, 4); }
  else if (kind === 'dep') { const z = until(() => ({ a: int(R, 3, 6) / 10, b: int(R, 2, 5) / 10, ab: int(R, 5, 25) / 100 }), q => q.ab < Math.min(q.a, q.b) && Math.abs(q.ab - q.a * q.b) >= 0.03 && q.a + q.b - q.ab <= 0.95); pa = z.a; pb = z.b; pab = z.ab; }
  else { pa = int(R, 4, 7) / 10; pb = int(R, 1, 3) / 10; pab = pb; }
  const excl = pab === 0, indep = Math.abs(pab - pa * pb) < 1e-9;
  const f = (x: number) => dec(round(x, 4), 4);
  const pic: CPic = kind === 'apart' ? { kind: 'venn', a: 'A', b: 'B', layout: 'apart', vals: { a: f(pa), b: f(pb), out: f(1 - pa - pb) } }
    : kind === 'inside' ? { kind: 'venn', a: 'A', b: 'B', layout: 'inside', vals: { a: f(pa - pb), ab: f(pb), out: f(1 - pa) } }
    : { kind: 'venn', a: 'A', b: 'B', vals: { a: f(pa - pab), ab: f(pab), b: f(pb - pab), out: f(1 - pa - pb + pab) } };
  const why = excl ? `no overlap, and P(A and B) = 0 ≠ P(A) × P(B) = ${f(pa * pb)}.` : indep ? `they overlap, and P(A and B) = ${f(pab)} = ${f(pa)} × ${f(pb)}.` : `they overlap, but P(A and B) = ${f(pab)} ≠ P(A) × P(B) = ${f(pa * pb)}.`;
  return choice(R, {
    id: `classifyVenn-${n}`, family: 'classifyVenn',
    prompt: `The Venn diagram gives the probability of each region (P(A) = ${f(pa)}, P(B) = ${f(pb)}, P(A and B) = ${f(pab)}). Classify events A and B.`,
    board: `P(A)\\,P(B) \\overset{?}{=} P(A \\cap B)`,
    picture: { pics: [pic] },
    solution: [`P(A) = ${f(pa)}, P(B) = ${f(pb)}, P(A and B) = ${f(pab)}.`, `Overlap? ${excl ? 'No' : 'Yes'}. Product test: ${f(pa)} × ${f(pb)} = ${f(pa * pb)} ${indep ? '=' : '≠'} ${f(pab)}.`, `So: ${ans(CLASS[(indep ? 0 : 2) + (excl ? 0 : 1)]!)}`],
  }, classOpts(indep, excl, why), true);
};
export const classifyList: Gen = (R, n) => {
  const N = pick(R, [6, 8, 10, 12]), xs = range(N);
  const want = pick(R, ['excl', 'indep', 'dep'] as const);
  const { a, b } = until(() => ({ a: numEvent(R, N), b: numEvent(R, N) }), ({ a, b }) => {
    const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x));
    if (a.s === b.s || A.length < 1 || B.length < 1 || A.length === N || B.length === N || A.join() === B.join()) return false;
    const ind = I.length * N === A.length * B.length;
    return want === 'excl' ? I.length === 0 : want === 'indep' ? ind && I.length > 0 : !ind && I.length > 0;
  }, 8000);
  const A = xs.filter(a.f), B = xs.filter(b.f), I = A.filter(x => b.f(x));
  const excl = I.length === 0, indep = I.length * N === A.length * B.length;
  const why = excl ? `nothing in common, and P(A | B) = 0 but P(A) = ${ft(A.length, N)}.` : indep ? `${I.join(', ')} in both, and P(A | B) = ${I.length}/${B.length} = P(A) = ${ft(A.length, N)}.` : `${I.join(', ')} in both, but P(A | B) = ${ft(I.length, B.length)} ≠ P(A) = ${ft(A.length, N)}.`;
  return choice(R, {
    id: `classifyList-${n}`, family: 'classifyList',
    prompt: `${N === 6 ? 'Roll one fair die.' : `A number is picked at random from 1 to ${N}.`} A: <b>${a.t}</b>. B: <b>${b.t}</b>. Classify A and B.`,
    board: `P(A \\mid B) \\overset{?}{=} P(A)`,
    picture: { pics: [{ kind: 'chips', items: xs.map(String), A: A.map(x => x - 1), B: B.map(x => x - 1), legend: [`A: ${a.s}`, `B: ${b.s}`] }] },
    solution: [`A = ${setText(A)}, B = ${setText(B)}.`, `P(A | B) = ${I.length}/${B.length}; P(A) = ${A.length}/${N}.`, `So: ${ans(CLASS[(indep ? 0 : 2) + (excl ? 0 : 1)]!)}`],
  }, classOpts(indep, excl, why), true);
};

// ===================== zero-probability-exception =====================
const IMP = ['the roll is 7', 'the roll is 0', 'the roll is greater than 6', 'the roll is both even and odd'];
export const emptyEvent: Gen = (R, n) => {
  const imp = pick(R, IMP), E = dieEvents(R), b = pick(R, E);
  return choice(R, {
    id: `emptyEvent-${n}`, family: 'emptyEvent',
    prompt: `Roll one fair die. A: <b>${imp}</b>. B: <b>${b.t}</b>. Classify A and B.`,
    board: `P(A) = 0`,
    picture: { pics: [{ kind: 'chips', items: DIE.map(String), B: b.set.map(x => x - 1) }] },
    solution: ['A is impossible: A is the empty event, so A and B share nothing: mutually exclusive.', `P(A and B) = 0 and P(A) × P(B) = 0 × ${ft(b.set.length, 6)} = 0: the product test holds, so they are independent too.`, `So: ${ans('Mutually exclusive and independent')}`],
  }, [
    { t: 'Mutually exclusive and independent', ok: true, key: 'both', say: 'Right: with an impossible event the product test gives 0 = 0. This is the one exception.' },
    { t: 'Mutually exclusive, so dependent', key: 'dep', mc: MC.incompatible, say: 'That rule needs both probabilities positive. Here P(A) = 0, and 0 = 0 × P(B).' },
    { t: 'Independent, but not mutually exclusive', key: 'ov', say: 'A has no outcomes at all, so it shares none with B.' },
    { t: 'Neither', key: 'nei', say: 'Check both: A and B share nothing, and P(A and B) = 0 = P(A) × P(B).' },
  ]);
};
export const emptyWhich: Gen = (R, n) => {
  const E = dieEvents(R), imp = pick(R, IMP);
  const disj = until(() => shuffle(R, E.slice()).slice(0, 2), ([x, y]) => meet(x!.set, y!.set).length === 0 && x!.set.join() !== y!.set.join());
  const ind = until(() => shuffle(R, E.slice()).slice(0, 2), ([x, y]) => { const m = meet(x!.set, y!.set).length; return m > 0 && m * 6 === x!.set.length * y!.set.length && x!.set.join() !== y!.set.join(); });
  const dep = until(() => shuffle(R, E.slice()).slice(0, 2), ([x, y]) => { const m = meet(x!.set, y!.set).length; return m > 0 && m * 6 !== x!.set.length * y!.set.length; });
  const b = pick(R, E);
  const tx = (x: string, y: string) => `"${x}" and "${y}"`;
  return choice(R, {
    id: `emptyWhich-${n}`, family: 'emptyWhich',
    prompt: `${who(R)} rolls one fair die. Which pair of events is <b>both</b> mutually exclusive and independent?`,
    board: `A \\cap B = \\varnothing \\qquad P(A \\cap B) = P(A)\\,P(B)`,
    picture: { pics: [{ kind: 'chips', items: DIE.map(String) }] },
    solution: ['Mutually exclusive needs P(A and B) = 0; independent then needs P(A) × P(B) = 0 too, so one event must be impossible.', `Only the pair with "${imp}" works: 0 = 0 × P(B).`, `So: ${ans(tx(imp, b.t))}`],
  }, [
    { t: tx(imp, b.t), ok: true, key: 'r', say: 'Right: an impossible event is disjoint from everything and passes the product test (0 = 0).' },
    { t: tx(disj[0]!.t, disj[1]!.t), key: 'disj', mc: MC.disjIndep, say: `They are mutually exclusive, but P(A) × P(B) = ${ft(disj[0]!.set.length * disj[1]!.set.length, 36)} > 0 = P(A and B): dependent.` },
    { t: tx(ind[0]!.t, ind[1]!.t), key: 'ind', say: `They are independent, but ${meet(ind[0]!.set, ind[1]!.set).join(', ')} ${meet(ind[0]!.set, ind[1]!.set).length === 1 ? 'is' : 'are'} in both: they overlap.` },
    { t: tx(dep[0]!.t, dep[1]!.t), key: 'dep', say: 'They overlap and fail the product test: neither mutually exclusive nor independent.' },
  ]);
};

// ===================== sample-proportion-variation =====================
function simulate(R: () => number, size: number, p: number, m: number): number[] {
  return Array.from({ length: m }, () => { let k = 0; for (let i = 0; i < size; i++) if (R() < p) k++; return k / size; });
}
function dotsPic(sims: number[], p: number, size: number, mark?: number, markLabel?: string): CPic {
  const step = 0.02;
  const lo = round(Math.max(0, Math.floor((p - 0.22) * 10) / 10), 2), hi = round(Math.min(1, lo + 0.5), 2);
  return { kind: 'dots', vals: sims, lo, hi, tick: 0.1, step, mark, markLabel, axis: `sample proportion (samples of ${size})`, d: 1 };
}
export const dotsUnusual: Gen = (R, n) => {
  const size = pick(R, [50, 100]), p = int(R, 3, 7) / 10, m = int(R, 20, 30);
  const sims = until(() => simulate(R, size, p, m), s => s.every(v => Math.abs(v - p) <= 0.16));
  const unusual = R() < 0.5, step = size === 50 ? 0.02 : 0.01;
  const devs = sims.map(v => Math.abs(v - p)).sort((x, y) => x - y);
  const obs = unusual ? round(p + (R() < 0.5 ? -1 : 1) * (devs[devs.length - 1]! + step * int(R, 2, 4)), 2) : round(p + (R() < 0.5 ? -1 : 1) * devs[Math.floor(devs.length * int(R, 2, 5) / 10)]!, 2);
  const far = sims.filter(v => Math.abs(v - p) >= Math.abs(obs - p) - 1e-9).length;
  const pic = dotsPic(sims, p, size, obs) as Extract<CPic, { kind: 'dots' }>;
  const ok = (unusual ? far === 0 : far >= Math.ceil(m * 0.2) && Math.abs(obs - p) > 1e-9) && obs >= pic.lo + 0.02 && obs <= pic.hi - 0.02;
  const S = pick(R, ['plan to vote in the school election', 'have a library card', 'prefer the new lunch menu', 'own a pet']);
  const nm = who(R);
  const opts: Opt[] = [
    { t: `Not unusual: ${far} of the ${m} simulated samples are at least that far from ${dec(p, 2)}`, ok: !unusual, key: 'no', say: unusual ? `Count again: ${far} of the ${m} simulated samples are that far.` : 'Right: samples from this population land that far away fairly often.' },
    { t: `Unusual: none of the ${m} simulated samples is that far from ${dec(p, 2)}`, ok: unusual, key: 'yes', say: unusual ? 'Right: chance alone rarely gives a sample proportion that far off.' : `${far} of the ${m} simulated samples are at least that far.` },
  ];
  if (!unusual) opts.push({ t: `Unusual: a fair random sample should give exactly ${dec(p, 2)}`, key: 'mirror', mc: MC.mirror, say: 'Random samples vary: the dot plot shows how much. Exactly the population value is rare.' });
  else opts.push({ t: 'Not unusual: sample proportions always vary, so any value is fine', key: 'any', say: 'They vary, but by about as much as the dot plot shows. This one is far outside it.' });
  const item = choice(R, {
    id: `dotsUnusual-${n}`, family: 'dotsUnusual',
    prompt: `In a large school, ${dec(p * 100)}% of students ${S}. The dot plot shows the proportions in ${m} simulated random samples of ${size} students. ${nm}'s random sample of ${size} gave <b>${dec(obs, 2)}</b>. Is that unusual?`,
    board: `\\hat{p} = ${dec(obs, 2)} \\quad p = ${dec(p, 2)}`,
    picture: { pics: [dotsPic(sims, p, size, obs, `${nm}: ${dec(obs, 2)}`)] },
    solution: [`${nm}'s sample is ${dec(Math.abs(obs - p), 2)} from ${dec(p, 2)}.`, `${far} of the ${m} simulated samples are at least that far: ${unusual ? 'none, so it is unusual' : 'that happens often, so it is not unusual'}.`],
  }, opts);
  if (!ok) return dotsUnusual(R, n);
  return item;
};
export const dotsTwoGroups: Gen = (R, n) => {
  const size = pick(R, [50, 100]), p = int(R, 3, 7) / 10, m = int(R, 20, 30);
  const sims = until(() => simulate(R, size, p, m), s => s.every(v => Math.abs(v - p) <= 0.16));
  const devs = sims.map(v => Math.abs(v - p)).sort((x, y) => x - y), step = size === 50 ? 0.02 : 0.01;
  const g1 = round(p - devs[Math.floor(m * 0.5)]!, 2), g2 = round(p + devs[Math.floor(m * 0.6)]!, 2);
  if (Math.abs(g1 - g2) < step * 2) return dotsTwoGroups(R, n);
  const S = pick(R, [['Across a whole school', 'students in first-period classes', 'students in last-period classes', 'finished the summer reading'], ['Across a whole city', 'morning bus riders', 'evening bus riders', 'pay with a phone'], ['Across a large store chain', 'Monday shoppers', 'Saturday shoppers', 'use a coupon']] as const);
  return choice(R, {
    id: `dotsTwoGroups-${n}`, family: 'dotsTwoGroups',
    prompt: `${S[0]}, ${dec(p * 100)}% ${S[3]}. A random sample of ${size} ${S[1]} gave a proportion of ${dec(g1, 2)}; a random sample of ${size} ${S[2]} gave ${dec(g2, 2)}. The dot plot shows ${m} simulated samples of ${size} from a population with proportion ${dec(p, 2)}. Do the two samples show that the groups differ?`,
    board: `${dec(g1, 2)} \\text{ vs. } ${dec(g2, 2)}`,
    picture: { pics: [dotsPic(sims, p, size)] },
    solution: [`Both ${dec(g1, 2)} and ${dec(g2, 2)} sit inside the spread of the simulated samples.`, 'Two groups with the same proportion often give sample proportions this different, so the samples do not show a difference.'],
  }, [
    { t: 'No: both values are well within the usual sample-to-sample spread', ok: true, key: 'no', say: 'Right: chance alone often gives differences this big.' },
    { t: `Yes: ${dec(g1, 2)} and ${dec(g2, 2)} are different numbers`, key: 'diff', mc: MC.anyDiff, say: 'Samples from the same population differ too; the dot plot shows by how much.' },
    { t: `Yes: if the groups were the same, both samples would give exactly ${dec(p, 2)}`, key: 'mirror', mc: MC.mirror, say: 'Random samples rarely hit the population value exactly.' },
  ]);
};

// ===================== empirical-independence-limits =====================
export const approxIndep: Gen = (R, n) => {
  const ctx = pick(R, CTX2), close = R() < 0.55;
  const cells = close ? until(() => genClose(R, 80, 200), g => shareGap(g) <= 4.2 && shareGap(g) >= 1) : until(() => genTable(R, 2, 2, 80, 200, 8), g => shareGap(g) >= 6.5 && shareGap(g) <= 20);
  const T = totals(cells), tol = 5;
  const p0 = (100 * cells[0]![0]!) / T.row[0]!, p1 = (100 * cells[1]![0]!) / T.row[1]!, gap = Math.abs(p0 - p1);
  const col = ctx.cols[0]!, G = ctx.rows;
  const f = (x: number) => dec(x, 1);
  return choice(R, {
    id: `approxIndep-${n}`, family: 'approxIndep',
    prompt: `${ctx.place}: ${T.all} people in this sample. A researcher will call the two variables "approximately independent" if the share who ${col.has} differs by less than ${tol} percentage points between the rows. What is the best conclusion?${CALC}`,
    board: `\\tfrac{${cells[0]![0]}}{${T.row[0]}} \\approx ${f(p0)}\\% \\quad \\tfrac{${cells[1]![0]}}{${T.row[1]}} \\approx ${f(p1)}\\%`,
    picture: { pics: [tablePic(ctx, cells)] },
    solution: [`Row shares: ${f(p0)}% of the ${G[0]!.group} and ${f(p1)}% of the ${G[1]!.group} ${col.has}: a gap of about ${f(gap)} points.`, close ? `Less than ${tol} points: approximately independent in this sample. Another sample would give slightly different shares, so it is not proof for all ${ctx.who}.` : `More than ${tol} points: the sample shows an association. It is still an estimate of the larger population.`],
  }, close ? [
    { t: `Approximately independent in this sample; the larger population could differ a little`, ok: true, key: 'r', say: 'Right: the shares are close, and a sample only estimates the population.' },
    { t: `Dependent: ${f(p0)}% and ${f(p1)}% are not equal, so the rows really differ`, key: 'diff', mc: MC.anyDiff, say: `A gap of ${f(gap)} points is within the tolerance; samples vary that much by chance.` },
    { t: `Exactly independent for all ${ctx.who}: the two shares are the same everywhere`, key: 'exact', mc: MC.exactParam, say: 'A sample estimates the population; it cannot show exact equality for everyone.' },
  ] : [
    { t: `Not approximately independent: the gap is about ${f(gap)} points, more than ${tol}`, ok: true, key: 'r', say: 'Right: the gap is bigger than the tolerance the researcher set.' },
    { t: 'Approximately independent: sample shares always differ a little', key: 'noise', say: `This gap is ${f(gap)} points, more than the ${tol}-point tolerance.` },
    { t: `For all ${ctx.who}, the shares are exactly ${f(p0)}% and ${f(p1)}%`, key: 'exact', mc: MC.exactParam, say: 'Sample shares estimate the population; other samples would give other numbers.' },
  ]);
};

// ===================== conditional-in-context =====================
export const screenTable: Gen = (R, n) => {
  const z = until(() => ({ p: int(R, 1, 20), s: int(R, 80, 99), f: int(R, 3, 15) }), q => (10 * q.p * q.s) % 100 === 0 && ((1000 - 10 * q.p) * q.f) % 100 === 0);
  const has = 10 * z.p, no = 1000 - has, tp = (has * z.s) / 100, fp = (no * z.f) / 100;
  const cells = [[tp, has - tp], [fp, no - fp]];
  return fracItem({
    id: `screenTable-${n}`, family: 'screenTable',
    prompt: `A screening test is given to 1,000 people; ${has} of them have the condition. The table shows the expected counts. A person tests <b>positive</b>. What is the probability the person has the condition?${CALC}`,
    board: `P(\\text{condition} \\mid \\text{positive}) = \\,?`,
    picture: { pics: [{ kind: 'table', rows: ['Condition', 'No condition'], cols: ['Positive', 'Negative'], cells, title: '1,000 people screened', whole: { kind: 'col', i: 0 }, parts: [[0, 0]] }] },
    solution: [`Given positive, the whole is the Positive column: ${tp} + ${fp} = ${tp + fp} people.`, `${tp} of them have the condition: ${red(tp, tp + fp)}.`],
  }, tp, tp + fp, `Yes: only ${tp} of the ${tp + fp} positives have the condition.`,
  [[tp, has, MC.inverse, `${tp}/${has} is P(positive | condition), the test's hit rate. The question is the reverse: look inside the positives.`],
   [tp, 1000, MC.newWhole, 'That is out of everyone. Only the positives count.']],
  'Look only in the Positive column.');
};
const SHOTS = [
  { t: 'pairs of free throws by one basketball player', a: 'first shot', b: 'second shot', y1: 'made', n1: 'missed', y2: 'made', n2: 'missed', q: 'making the first shot', L: ['1st made', '1st missed', '2nd made', '2nd missed'] },
  { t: 'pairs of penalty kicks by one soccer player in practice', a: 'first kick', b: 'second kick', y1: 'scored', n1: 'missed', y2: 'scored', n2: 'missed', q: 'scoring the first kick', L: ['1st scored', '1st missed', '2nd scored', '2nd missed'] },
  { t: 'points served by one tennis player', a: 'first serve', b: 'point', y1: 'in', n1: 'out', y2: 'won', n2: 'lost', q: 'getting the first serve in', L: ['Serve in', 'Serve out', 'Point won', 'Point lost'] },
];
export const freeThrow: Gen = (R, n) => {
  const S = pick(R, SHOTS), cells = genTable(R, 2, 2, 60, 200, 8);
  const T = totals(cells);
  const A1 = `${S.b} ${S.y2}`, B1 = `${S.a} ${S.y1}`, B0 = `${S.a} ${S.n1}`;
  return choice(R, {
    id: `freeThrow-${n}`, family: 'freeThrow',
    prompt: `The table records ${T.all} ${S.t}. A coach asks: "Does ${S.q} change the chance that the ${A1.replace(` ${S.y2}`, '')} is ${S.y2}?" Which comparison answers that question?`,
    board: `P(\\,? \\mid \\;?\\,) \\text{ vs. } P(\\,? \\mid \\;?\\,)`,
    picture: { pics: [{ kind: 'table', rows: [S.L[0]!, S.L[1]!], cols: [S.L[2]!, S.L[3]!], cells, title: `${T.all} ${S.t.split(' ')[0] === 'pairs' ? 'pairs' : 'points'}` }] },
    solution: [`The question conditions on the ${S.a}: compare the chance the ${S.b} is ${S.y2} in each row.`, `P(${A1} | ${B1}) = ${cells[0]![0]}/${T.row[0]} versus P(${A1} | ${B0}) = ${cells[1]![0]}/${T.row[1]}.`, `So: ${ans(`P(${A1} | ${B1}) vs. P(${A1} | ${B0})`)}`],
  }, [
    { t: `P(${A1} | ${B1}) vs. P(${A1} | ${B0})`, ok: true, key: 'r', say: 'Right: the same outcome under two conditions. If the two rates differ, the first one matters.' },
    { t: `P(${B1} | ${A1}) vs. P(${B0} | ${A1})`, key: 'inv', mc: MC.inverse, say: `That conditions on the ${S.b}, looking backward. The coach conditions on the ${S.a}.` },
    { t: `The counts ${cells[0]![0]} vs. ${cells[1]![0]} in the first column`, key: 'cnt', mc: MC.newWhole, say: 'Raw counts ignore how many tries each row had. Divide by each row total.' },
    { t: `P(${A1}) vs. P(${B1})`, key: 'marg', say: 'Those are two unconditional probabilities of different things.' },
  ]);
};
export const laterEvent: Gen = (R, n) => {
  const N = int(R, 5, 10), w = int(R, 2, N - 2);
  const [c1, c2] = pick(R, [['white', 'black'], ['blue', 'red'], ['gold', 'silver']] as const);
  return fracItem({
    id: `laterEvent-${n}`, family: 'laterEvent',
    prompt: `A box has ${w} ${c1} and ${N - w} ${c2} balls. Two are drawn one after the other, without replacement. You only see the <b>second</b> ball: it is ${c1}. What is the probability the <b>first</b> ball was ${c1}?`,
    board: `P(1\\text{st } ${c1} \\mid 2\\text{nd } ${c1}) = \\,?`,
    picture: { pics: [{ kind: 'tokens', names: [...Array.from({ length: w }, () => c1[0]!.toUpperCase()), ...Array.from({ length: N - w }, () => c2[0]!.toUpperCase())], groups: [...Array.from({ length: w }, () => 0), ...Array.from({ length: N - w }, () => 1)], legend: [c1, c2] }] },
    solution: [`Knowing the second ball is ${c1} tells you one ${c1} ball is "used up" for the second spot.`, `The first ball is any of the other ${N - 1}, and ${w - 1} of them are ${c1}: ${ans(ft(w - 1, N - 1))}.`],
  }, w - 1, N - 1, `Yes: ${w - 1} of the other ${N - 1} balls are ${c1}.`,
  [[w, N, MC.laterEvent, 'A later result can still be a condition: it tells you which balls are left for the first draw.'], [w - 1, N, undefined, 'One ball is known (the second one), so the first is one of the other ' + (N - 1) + '.']],
  'Set the second ball aside: the first is one of the others.');
};

// ===================== total-probability =====================
const TOT = [
  { a: 'a student rides the bus', b: 'the student is late', na: 'bus', nn: 'no bus', yb: 'late', nb: 'on time' },
  { a: 'a day is rainy', b: 'the game is canceled', na: 'rain', nn: 'dry', yb: 'canceled', nb: 'played' },
  { a: 'an email comes from a stranger', b: 'it is spam', na: 'stranger', nn: 'known', yb: 'spam', nb: 'not spam' },
];
export const totalTwo: Gen = (R, n) => {
  const S = pick(R, TOT);
  const z = until(() => ({ a: int(R, 1, 7) / 10, b1: int(R, 5, 60) / 100, b2: int(R, 1, 30) / 100 }), q => Math.abs(q.b1 - q.b2) > 0.04);
  const pb = round(z.a * z.b1 + (1 - z.a) * z.b2, 4);
  const t1 = round(z.a * z.b1, 4), t2 = round((1 - z.a) * z.b2, 4);
  return numItem({
    id: `totalTwo-${n}`, family: 'totalTwo',
    prompt: `P(${S.a}) = ${dec(z.a, 2)}. If ${S.a}, P(${S.b}) = ${dec(z.b1, 2)}; otherwise P(${S.b}) = ${dec(z.b2, 2)}. What is P(${S.b}) overall? Give a decimal.${CALC}`,
    board: `P(B) = P(A)P(B \\mid A) \\qquad + P(A^{c})P(B \\mid A^{c})`, unit: '',
    picture: { pics: [{ kind: 'tree', first: [{ label: S.na, p: dec(z.a, 2) }, { label: S.nn, p: dec(round(1 - z.a, 2), 2) }], second: [[{ label: S.yb, p: dec(z.b1, 2) }, { label: S.nb, p: dec(round(1 - z.b1, 2), 2) }], [{ label: S.yb, p: dec(z.b2, 2) }, { label: S.nb, p: dec(round(1 - z.b2, 2), 2) }]], leaf: [[dec(t1, 4), null], [dec(t2, 4), null]], hide: ['l00', 'l10'], paths: [[0, 0], [1, 0]] }] },
    solution: [`Two paths end in "${S.yb}": ${dec(z.a, 2)} × ${dec(z.b1, 2)} = ${dec(t1, 4)} and ${dec(round(1 - z.a, 2), 2)} × ${dec(z.b2, 2)} = ${dec(t2, 4)}.`, `Add them: ${ans(dec(pb, 4))}.`],
  }, pb, `Yes: ${dec(t1, 4)} + ${dec(t2, 4)} = ${dec(pb, 4)}.`,
  [[round((z.b1 + z.b2) / 2, 4), MC.unweighted, `That averages the two rates as if each branch were half the time. Weight each by its branch: ${dec(z.a, 2)} and ${dec(round(1 - z.a, 2), 2)}.`],
   [round(z.b1 + z.b2, 4), MC.unweighted, 'Adding the rates ignores how often each branch happens. Multiply along each path first.'],
   [t1, undefined, 'That is only one path. Add every path that ends in "' + S.yb + '".']],
  'Multiply along each path that ends in B, then add the paths.');
};
export const totalThree: Gen = (R, n) => {
  const sh = until(() => [int(R, 2, 6) * 10, int(R, 1, 4) * 10], ([a, b]) => a! + b! <= 90 && a !== b);
  const shares = [sh[0]!, sh[1]!, 100 - sh[0]! - sh[1]!];
  const rates = until(() => [int(R, 1, 5), int(R, 1, 5), int(R, 1, 5)], xs => new Set(xs).size === 3);
  const pd = round(shares.reduce((s, x, i) => s + (x / 100) * (rates[i]! / 100), 0), 6);
  const M = ['A', 'B', 'C'];
  return numItem({
    id: `totalThree-${n}`, family: 'totalThree',
    prompt: `A factory has three machines. Machine A makes ${shares[0]}% of the bolts, B makes ${shares[1]}%, C makes ${shares[2]}%. Their defect rates are ${rates[0]}%, ${rates[1]}% and ${rates[2]}%. What is the probability a random bolt is defective? Give a decimal.${CALC}`,
    board: `P(D) = \\textstyle\\sum P(M_i)\\,P(D \\mid M_i)`, unit: '',
    picture: { pics: [{ kind: 'tree', first: M.map((m, i) => ({ label: m, p: dec(shares[i]! / 100, 2) })), second: M.map((_, i) => [{ label: 'defect', p: dec(rates[i]! / 100, 2) }, { label: 'ok', p: dec(1 - rates[i]! / 100, 2) }]), leaf: M.map((_, i) => [dec((shares[i]! * rates[i]!) / 10000, 4), null]), hide: ['l00', 'l10', 'l20'], paths: [[0, 0], [1, 0], [2, 0]] }] },
    solution: [`Paths to "defect": ${M.map((m, i) => `${dec(shares[i]! / 100, 2)} × ${dec(rates[i]! / 100, 2)} = ${dec((shares[i]! * rates[i]!) / 10000, 4)}`).join('; ')}.`, `Add them: ${ans(dec(pd, 4))}.`],
  }, pd, `Yes: ${dec(pd, 4)}, about ${dec(pd * 1000, 1)} bolts in 1,000.`,
  [[round((rates[0]! + rates[1]! + rates[2]!) / 300, 6), MC.unweighted, 'That averages the rates as if every machine made a third of the bolts. Weight each rate by its share.'],
   [round((rates[0]! + rates[1]! + rates[2]!) / 100, 6), MC.unweighted, 'Adding the rates ignores the shares. Multiply each rate by its machine\'s share first.']],
  'For each machine multiply share × defect rate, then add.');
};

// ===================== bayes-theorem =====================
export const bayesScreen: Gen = (R, n) => {
  const z = until(() => ({ p: int(R, 1, 15), s: int(R, 80, 99), f: int(R, 2, 15) }), q => { const post = (q.p * q.s) / (q.p * q.s + (100 - q.p) * q.f); return noTie(post, 3) && post > 0.02 && post < 0.95; });
  const P = z.p / 100, S = z.s / 100, Fp = z.f / 100;
  const tp = round(P * S, 6), fp = round((1 - P) * Fp, 6), post = tp / (tp + fp);
  const K = pick(R, [
    { lead: `${z.p}% of the people screened have a condition. The test is positive for ${z.s}% of people with the condition and, by mistake, for ${z.f}% of people without it. A person tests positive. What is the probability the person has the condition?`, w: ['has it', 'does not', 'positive'] },
    { lead: `${z.p}% of the emails a company gets are spam. Its filter flags ${z.s}% of spam emails and, by mistake, ${z.f}% of the other emails. An email is flagged. What is the probability it is spam?`, w: ['spam', 'not spam', 'flagged'] },
    { lead: `${z.p}% of the bags at a checkpoint hold a banned item. The scanner alarms for ${z.s}% of those bags and, by mistake, for ${z.f}% of the others. A bag sets off the alarm. What is the probability it holds a banned item?`, w: ['banned', 'not banned', 'alarm'] },
  ]);
  const [w0, w1, w2] = K.w as [string, string, string];
  return numItem({
    id: `bayesScreen-${n}`, family: 'bayesScreen',
    prompt: `${K.lead} Round to three decimal places.${CALC}`,
    board: `P(A \\mid +) = \\dfrac{P(A)P(+ \\mid A)}{P(+)}`, unit: '',
    picture: { pics: [{ kind: 'tree', first: [{ label: w0, p: dec(P, 2) }, { label: w1, p: dec(1 - P, 2) }], second: [[{ label: w2, p: dec(S, 2) }, { label: 'not', p: dec(round(1 - S, 2), 2) }], [{ label: w2, p: dec(Fp, 2) }, { label: 'not', p: dec(round(1 - Fp, 2), 2) }]], leaf: [[dec(tp, 4), null], [dec(fp, 4), null]], hide: ['l00', 'l10'], paths: [[0, 0], [1, 0]] }] },
    solution: [`Paths to "${w2}": ${dec(P, 2)} × ${dec(S, 2)} = ${dec(tp, 4)} (real) and ${dec(1 - P, 2)} × ${dec(Fp, 2)} = ${dec(fp, 4)} (false alarm). P(${w2}) = ${dec(tp + fp, 4)}.`, `The real path's share: ${dec(tp, 4)} ÷ ${dec(tp + fp, 4)} ≈ ${ans(decFixed(post, 3))}.`],
  }, round(post, 3), `Yes: about ${decFixed(post, 3)}. ${post < 0.5 ? `Most "${w2}" results are false alarms.` : `Most "${w2}" results are real, but not all.`}`,
  [[S, MC.inverse, `${dec(S, 2)} is P(${w2} | ${w0}), the hit rate. The question turns it around.`],
   [round(tp / fp, 6), MC.bayesDiv, `That divides by the false-alarm path only. Divide by every path that ends in "${w2}".`],
   [P, MC.baseRate, `${dec(P, 2)} is the rate before the result. The "${w2}" changes it: use the tree.`]],
  'Real path ÷ (real path + false-alarm path).', 0.0005);
};
export const bayesMachine: Gen = (R, n) => {
  const sh = until(() => [int(R, 2, 6) * 10, int(R, 1, 4) * 10], ([a, b]) => a! + b! <= 90 && a !== b);
  const shares = [sh[0]!, sh[1]!, 100 - sh[0]! - sh[1]!];
  const rates = until(() => [int(R, 1, 5), int(R, 1, 5), int(R, 1, 5)], xs => new Set(xs).size === 3);
  const k = int(R, 0, 2), M = ['A', 'B', 'C'];
  const parts = shares.map((s, i) => s * rates[i]!), tot = parts.reduce((s, x) => s + x, 0);
  return fracItem({
    id: `bayesMachine-${n}`, family: 'bayesMachine',
    prompt: `Machines A, B and C make ${shares[0]}%, ${shares[1]}% and ${shares[2]}% of a factory's bolts, with defect rates ${rates[0]}%, ${rates[1]}% and ${rates[2]}%. A bolt is defective. What is the probability it came from machine <b>${M[k]}</b>? Give a fraction.`,
    board: `P(${M[k]} \\mid D) = \\dfrac{P(${M[k]})P(D \\mid ${M[k]})}{P(D)}`,
    picture: { pics: [{ kind: 'tree', first: M.map((m, i) => ({ label: m, p: dec(shares[i]! / 100, 2) })), second: M.map((_, i) => [{ label: 'defect', p: dec(rates[i]! / 100, 2) }, { label: 'ok', p: dec(1 - rates[i]! / 100, 2) }]), leaf: M.map((_, i) => [dec(parts[i]! / 10000, 4), null]), hide: ['l00', 'l10', 'l20'], paths: [[k, 0]] }] },
    solution: [`Out of 10,000 bolts: defective from A, B, C = ${parts.join(', ')}; ${tot} defective in all.`, `${M[k]}'s share of the defective bolts: ${red(parts[k]!, tot)}.`],
  }, parts[k]!, tot, `Yes: ${parts[k]} of every ${tot} defective bolts come from ${M[k]}.`,
  [[shares[k]!, 100, MC.baseRate, `${shares[k]}% is ${M[k]}'s share of all bolts. Among defective bolts it changes, because the rates differ.`],
   [rates[k]!, 100, MC.inverse, `${rates[k]}% is P(defect | ${M[k]}). The question is P(${M[k]} | defect).`],
   [parts[k]!, 10000, MC.bayesDiv, `That is the path itself, P(${M[k]} and D). Divide it by P(D), all the defective paths.`]],
  'One path ÷ the sum of all paths that end in "defect".');
};

// ===================== base-rate-effect =====================
const post = (p: number, s: number, f: number) => (p * s) / (p * s + (1 - p) * f);
export const baseRateCompare: Gen = (R, n) => {
  const z = until(() => ({ s: int(R, 85, 95) / 100, f: int(R, 5, 10) / 100, ps: shuffle(R, [0.01, 0.02, 0.05, 0.1, 0.2, 0.5]).slice(0, 3) }), q => {
    const v = q.ps.map(p => round(post(p, q.s, q.f), 2));
    return new Set([...v, round(q.s, 2)]).size === 4 && q.ps.every(p => noTie(post(p, q.s, q.f), 2));
  });
  const k = int(R, 0, 2), p = z.ps[k]!;
  const opts: Opt[] = z.ps.map((pp, i) => ({ t: `about ${dec(round(post(pp, z.s, z.f), 2), 2)}`, ok: i === k, key: String(round(post(pp, z.s, z.f), 2)), say: i === k ? 'Right: the base rate decides how many positives are real.' : `That fits a prevalence of ${pc(pp)}. Redo the tree with ${pc(p)}.` }));
  opts.push({ t: `about ${dec(round(z.s, 2), 2)}, the test's accuracy`, key: 's', mc: MC.baseRate, say: `${pc(z.s)} is P(positive | condition). With only ${pc(p)} having it, false alarms change the answer.` });
  return choice(R, {
    id: `baseRateCompare-${n}`, family: 'baseRateCompare',
    prompt: `A test is positive for ${pc(z.s)} of people with a condition and for ${pc(z.f)} of people without it. In a group where <b>${pc(p)}</b> have the condition, about what is P(condition | positive)?${CALC}`,
    board: `\\dfrac{${dec(p, 2)} \\times ${dec(z.s, 2)}}{${dec(p, 2)} \\times ${dec(z.s, 2)} + ${dec(round(1 - p, 2), 2)} \\times ${dec(z.f, 2)}}`,
    solution: [`Real positives: ${dec(p, 2)} × ${dec(z.s, 2)} = ${dec(p * z.s, 4)}. False alarms: ${dec(1 - p, 2)} × ${dec(z.f, 2)} = ${dec((1 - p) * z.f, 4)}.`, `Share that is real: ≈ ${dec(post(p, z.s, z.f), 3)}.`, `So: ${ans(`about ${dec(round(post(p, z.s, z.f), 2), 2)}`)}`],
  }, opts);
};
const pc = (p: number) => `${dec(p * 100, 1)}%`;
export const secondTest: Gen = (R, n) => {
  const z = until(() => ({ p: pick(R, [0.01, 0.02, 0.05, 0.1]), s: int(R, 85, 95) / 100, f: int(R, 5, 10) / 100, neg: R() < 0.35 }), q => {
    const q1 = round(post(q.p, q.s, q.f), 3);
    const q2 = q.neg ? (q1 * (1 - q.s)) / (q1 * (1 - q.s) + (1 - q1) * (1 - q.f)) : post(q1, q.s, q.f);
    return noTie(post(q.p, q.s, q.f), 3) && noTie(q2, 3) && q1 > 0.01;
  });
  const q1 = round(post(z.p, z.s, z.f), 3);
  const q2 = z.neg ? (q1 * (1 - z.s)) / (q1 * (1 - z.s) + (1 - q1) * (1 - z.f)) : post(q1, z.s, z.f);
  const L = z.neg ? 'negative' : 'positive';
  return numItem({
    id: `secondTest-${n}`, family: 'secondTest',
    prompt: `A test is positive for ${pc(z.s)} of people with a condition and ${pc(z.f)} of people without it. After one positive result, a person's probability of having the condition is <b>${decFixed(q1, 3)}</b>. A second test, independent of the first given the person's true status, comes back <b>${L}</b>. What is the new probability? Round to three decimal places.${CALC}`,
    board: z.neg ? `\\dfrac{${decFixed(q1, 3)}\\,(${dec(round(1 - z.s, 2), 2)})}{${decFixed(q1, 3)}\\,(${dec(round(1 - z.s, 2), 2)}) + ${decFixed(1 - q1, 3)}\\,(${dec(round(1 - z.f, 2), 2)})}` : `\\dfrac{${decFixed(q1, 3)}\\,(${dec(z.s, 2)})}{${decFixed(q1, 3)}\\,(${dec(z.s, 2)}) + ${decFixed(1 - q1, 3)}\\,(${dec(z.f, 2)})}`, unit: '',
    picture: { pics: [{ kind: 'tree', first: [{ label: 'has it', p: decFixed(q1, 3) }, { label: 'does not', p: decFixed(1 - q1, 3) }], second: [[{ label: L, p: dec(z.neg ? round(1 - z.s, 2) : z.s, 2) }, { label: 'other', p: dec(z.neg ? z.s : round(1 - z.s, 2), 2) }], [{ label: L, p: dec(z.neg ? round(1 - z.f, 2) : z.f, 2) }, { label: 'other', p: dec(z.neg ? z.f : round(1 - z.f, 2), 2) }]], paths: [[0, 0], [1, 0]] }] },
    solution: [`The old answer, ${decFixed(q1, 3)}, is the new prior. Real path: ${decFixed(q1, 3)} × ${dec(z.neg ? 1 - z.s : z.s, 2)}; other path: ${decFixed(1 - q1, 3)} × ${dec(z.neg ? 1 - z.f : z.f, 2)}.`, `Real ÷ (real + other) ≈ ${ans(decFixed(q2, 3))}.`],
  }, round(q2, 3), `Yes: about ${decFixed(q2, 3)}.`,
  [[q1, undefined, 'That is the probability before the second test. Update it with the new result.'],
   [round(post(z.p, z.s, z.f), 3), MC.baseRate, `That starts from the original ${pc(z.p)} again. After the first result the prior is ${decFixed(q1, 3)}.`],
   [z.neg ? round(1 - z.s, 2) : z.s, MC.baseRate, 'That is the test\'s rate, not the probability of the condition. Use the prior.']],
  'Use the old probability as the prior and redo the two paths.', 0.0005);
};

export { CTX2 };
