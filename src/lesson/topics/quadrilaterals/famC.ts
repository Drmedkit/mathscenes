// famC.ts: stage 3 of "Parallelograms and other quadrilaterals": the proofs (reason / statement / order on the
// course's proof frame), sufficient and necessary conditions, converses, the parallelogram / rectangle / rhombus tests
// read from marks, kite and isosceles-trapezoid diagonals, counterexamples, the four-way classification, the stated
// universe, values of x that make a shape, the trapezoid theorems and practical checks.
import { htm } from '../geometry-foundations/proofs';
import { type Q4, type QK, ART, ISO_DEF, NAME, PLURAL, TRAP_DEF, UP, every, kitePts, makeQ, paraPts, par, qfig, ri, trapPts, turnQ } from './quad';
import type { QMark } from './quad';
import { CONDS, LABELS, type Label, UNIV_WORD, necCounter, suffCounter } from './conds';
import { type QProof, type QProofId, PROPERTY_PROOFS, TEST_PROOFS, TRAP_PROOFS, makeQProof, validOrder } from './qProofs';
import { type Gen, type NumWrong, type Opt, type QItem, MC, albl, arc, box, choice, choiceT, fitted, fmt, lbl, linT, numT, pick, r, relabel, shuffle, tick, twQ, prose } from './qkit';
import { setAng, setSeg } from './famB';

const ROLES = 'ABCDE';
const S = (s: string | number) => `<b class="s">${s}</b>`;
/** proof TeX -> panel text */
export const htmQ = (s: string) => htm(s.replace(/\\tfrac\{1\}\{2\}/g, '½').replace(/\\triangle\s*/g, '△'));
const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const UNITS = ['in.', 'ft', 'cm'] as const;

// ---------- proofs ----------
function picOf(p: QProof, ask: { i: number; cell: 'st' | 'rs' }[]) {
  const rows = p.rows.map((x, i) => ({ st: ask.some(a => a.i === i && a.cell === 'st') ? '' : x.st, rs: ask.some(a => a.i === i && a.cell === 'rs') ? '' : x.rs }));
  return { fig: p.fig, proof: { given: p.given, prove: p.prove, rows, ask }, reveal: { fill: ask.map(a => (a.cell === 'st' ? { i: a.i, st: p.rows[a.i]!.st } : { i: a.i, rs: p.rows[a.i]!.rs })) } };
}
function reasonItem(R: () => number, n: number, fam: string, ids: QProofId[]): QItem {
  return fitted(fam, () => {
    const p = makeQProof(pick(R, ids), R), t = relabel(R, p.roles);
    const i = r(R, 0, p.rows.length - 1), row = p.rows[i]!;
    const opts: Opt[] = [{ t: row.rs, ok: true, say: `Right: ${row.rs}.` }, ...shuffle(R, row.wrong.slice()).slice(0, 3).map(w => ({ t: w.t, mc: w.mc, say: w.say }))];
    return choiceT(R, t, {
      id: `${fam}-${n}`, family: fam, prompt: `Proof: ${prose(p.name)}. Which reason belongs in line ${i + 1}?`, board: row.st,
      solution: [`Line ${i + 1}: ${htmQ(row.st)}.`, row.uses.length ? `It uses line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(' and ')}.` : 'It uses only the givens and the figure.', `The reason: ${row.rs}.`],
      picture: picOf(p, [{ i, cell: 'rs' }]),
    }, opts);
  });
}
function stmtItem(R: () => number, n: number, fam: string, ids: QProofId[]): QItem {
  return fitted(fam, () => {
    const p = makeQProof(pick(R, ids), R), t = relabel(R, p.roles);
    const i = r(R, 0, p.rows.length - 2), row = p.rows[i]!;
    const opts: Opt[] = [{ t: htmQ(row.st), ok: true, say: `Right: the ${row.rs} gives exactly this.` }];
    for (const d of p.decoys) if (htmQ(d.st) !== htmQ(row.st)) opts.push({ t: htmQ(d.st), mc: d.mc, say: `Not this: ${d.why}` });
    if (htmQ(p.prove) !== htmQ(row.st)) opts.push({ t: htmQ(p.prove), mc: MC.circular, say: 'That is the conclusion: it cannot come before the lines that prove it.' });
    return choiceT(R, t, {
      id: `${fam}-${n}`, family: fam, prompt: `Proof: ${prose(p.name)}. Which statement belongs in line ${i + 1} (reason: ${row.rs})?`, board: p.prove,
      solution: [`Line ${i + 1} cites the ${row.rs}${row.uses.length ? `, using line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(' and ')}` : ''}.`, `It gives ${htmQ(row.st)}.`],
      picture: picOf(p, [{ i, cell: 'st' }]),
    }, opts);
  });
}
function orderItem(R: () => number, n: number, fam: string, ids: QProofId[]): QItem {
  return fitted(fam, () => {
    const p = makeQProof(pick(R, ids), R), t = relabel(R, p.roles);
    const N = p.rows.length, decoy = pick(R, p.decoys);
    if (N + 1 > 7) throw new Error('too long for a pool');
    const items = shuffle(R, [...p.rows.map((x, i) => ({ st: x.st, rs: x.rs, row: i + 1 })), { st: decoy.st, rs: '', row: 0 }]);
    const letterOf = (row: number) => String.fromCharCode(65 + items.findIndex(x => x.row === row));
    const fmtO = (o: number[]) => o.map(letterOf).join(', ');
    const canon = Array.from({ length: N }, (_, i) => i + 1);
    const opts: Opt[] = [{ t: fmtO(canon), ok: true, say: 'Right: every line after the lines it uses, the conclusion last, the decoy left out.' }];
    const rep = canon.slice(); rep[r(R, 0, N - 2)] = 0;
    const whyT = twQ(decoy.why, t);
    opts.push({ t: fmtO(rep), mc: decoy.mc, say: `Line ${letterOf(0)} is the decoy: ${whyT}` });
    for (let k = 0; k < 80 && opts.length < 4; k++) {
      const o = canon.slice(), a = r(R, 0, N - 2), b = r(R, a + 1, N - 1);
      [o[a], o[b]] = [o[b]!, o[a]!];
      if (validOrder(p, o)) continue;
      const s = fmtO(o);
      if (opts.some(x => x.t === s)) continue;
      opts.push({ t: s, mc: MC.beforeEst, say: 'In that order a line uses a statement that only comes later.' });
    }
    const base = { id: `${fam}-${n}`, family: fam, prompt: `Proof: ${prose(p.name)}. Put the lines in an order that proves it; one line is a decoy and is left out. Which order works?`, board: p.prove, solution: [] as string[], picture: { fig: p.fig, proof: { given: p.given, prove: p.prove, rows: items.map(x => ({ st: x.st, rs: x.rs })), pool: true }, reveal: { strike: [items.findIndex(x => x.row === 0)], rowOf: items.map(x => x.row) } } };
    const relab = choiceT(R, t, base, [{ t: 'x', ok: true, say: '' }]);
    // the pool letters A, B, C ... are row labels, not point names: only the proof, the figure and the prompt are relabelled
    return choice(R, { ...base, prompt: relab.prompt, board: relab.board, picture: relab.picture, solution: [`Start from the givens; each line comes after the lines it uses, the conclusion last: ${fmtO(canon)}.`, `Line ${letterOf(0)} is the decoy: ${whyT}`] }, opts);
  });
}
export const propReason: Gen = (R, n) => reasonItem(R, n, 'propReason', PROPERTY_PROOFS);
export const propOrder: Gen = (R, n) => (R() < 0.5 ? orderItem(R, n, 'propOrder', ['oppSides', 'diagBisect', 'rectDiag']) : stmtItem(R, n, 'propOrder', PROPERTY_PROOFS));
export const testReason: Gen = (R, n) => (R() < 0.6 ? reasonItem(R, n, 'testReason', TEST_PROOFS) : stmtItem(R, n, 'testReason', TEST_PROOFS));
export const trapProof: Gen = (R, n) => (R() < 0.6 ? reasonItem(R, n, 'trapProof', TRAP_PROOFS) : stmtItem(R, n, 'trapProof', TRAP_PROOFS));

// ---------- sufficient / converse / necessary ----------
const CLS: QK[] = ['square', 'rect', 'rhombus', 'para', 'kite', 'trap'];
const GENERIC: Record<QK, string> = { square: 'a square', rect: 'a rectangle that is not a square', rhombus: 'a rhombus that is not a square', para: 'a parallelogram with no right angle and unequal sides', kite: 'a kite that is not a rhombus', trap: 'a trapezoid with only one pair of parallel sides', isoTrap: 'an isosceles trapezoid', quad: 'a quadrilateral with no special properties' };
/** a member of X that is not a Y */
const witness = (X: QK, Y: QK): QK | undefined => (['square', 'rect', 'rhombus', 'para', 'kite', 'isoTrap', 'trap'] as QK[]).find(k => UP[k].includes(X) && !UP[k].includes(Y));
export const suffMean: Gen = (R, n) => {
  for (;;) {
    const X = pick(R, CLS), Y = pick(R, CLS.filter(x => x !== X)), yes = every(X, Y);
    if (!yes && R() < 0.4) continue;
    const word = R() < 0.5;
    const q = word ? `Among quadrilaterals, is being ${ART[X]} SUFFICIENT for being ${ART[Y]}?` : `Among quadrilaterals, is knowing a shape is ${ART[X]} enough to prove it is ${ART[Y]}?`;
    const w = witness(X, Y);
    const opts: Opt[] = yes
      ? [{ t: `yes: if a quadrilateral is ${ART[X]}, then it is ${ART[Y]}`, ok: true, say: 'Right: sufficient means it guarantees.' }, { t: `no: ${ART[Y]} need not be ${ART[X]}`, mc: MC.converse, say: 'That is the other direction. Sufficient asks: does every one of them land inside?' }, { t: `no: they are different shapes`, mc: MC.excluded, say: `Every ${NAME[X]} is ${ART[Y]}.` }]
      : [{ t: `no: ${GENERIC[w!]} is ${ART[X]} but not ${ART[Y]}`, ok: true, say: 'Right: one counterexample breaks the guarantee.' }, { t: `yes: some ${PLURAL[X]} are ${PLURAL[Y]}`, mc: MC.suffCompat, say: 'Some is not enough: sufficient means EVERY one.' }, { t: `yes: if a quadrilateral is ${ART[Y]}, then it is ${ART[X]}`, mc: MC.converse, say: 'That is the reverse statement (and it is not the question).' }];
    return choice(R, {
      id: `suffMean-${n}`, family: 'suffMean', prompt: `${TRAP_DEF}${w === 'isoTrap' ? ' ' + ISO_DEF : ''} ${q}`, board: `\\text{${NAME[X]}} \\Rightarrow \\text{${NAME[Y]}}?`,
      solution: [`Sufficient: "if it is ${ART[X]}, then it is ${ART[Y]}" must hold for every ${NAME[X]}.`, yes ? `Every ${NAME[X]} is ${ART[Y]}: yes.` : `${cap(GENERIC[w!])} is ${ART[X]} but not ${ART[Y]}: no.`],
      picture: { tree: { glow: [X, Y] }, reveal: {} },
    }, opts);
  }
};
export const converseForm: Gen = (R, n) => {
  for (;;) {
    const X = pick(R, CLS), Y = pick(R, CLS.filter(x => x !== X));
    if (!every(X, Y)) continue;
    const back = every(Y, X), w = witness(Y, X);
    if (back) continue;
    const conv = `If a quadrilateral is ${ART[Y]}, then it is ${ART[X]}`;
    const opts: Opt[] = [
      { t: `${conv}. False: ${GENERIC[w!]} is a counterexample.`, ok: true, say: 'Right: swapped, and judged on its own.' },
      { t: `${conv}. True, because the original statement is true.`, mc: MC.converse, say: 'A converse has its own truth value.' },
      { t: `If a quadrilateral is not ${ART[X]}, then it is not ${ART[Y]}. False.`, say: 'That negates both parts (the inverse); the converse swaps them.' },
      { t: `If a quadrilateral is ${ART[X]}, then it is ${ART[Y]}. True.`, say: 'That is the original statement, not its converse.' },
    ];
    return choice(R, {
      id: `converseForm-${n}`, family: 'converseForm', prompt: `${TRAP_DEF}${w === 'isoTrap' ? ' ' + ISO_DEF : ''} “If a quadrilateral is ${ART[X]}, then it is ${ART[Y]}” is true. What is its converse, and is the converse true?`, board: '\\text{the converse}',
      solution: ['The converse swaps the hypothesis and the conclusion.', `${conv}: false, because ${GENERIC[w!]} is ${ART[Y]} but not ${ART[X]}.`],
      picture: { tree: { glow: [X, Y] }, reveal: {} },
    }, opts);
  }
};
const quadLabels = LABELS.filter(l => l.universe === 'quad');
/** "having congruent diagonals" / "being a square" */
const having = (t: string) => (t.startsWith('being ') ? t : `having ${t}`);
/** "has congruent diagonals" / "is a square" */
const hasP = (t: string) => (t.startsWith('being ') ? `is ${t.slice(6)}` : `has ${t}`);
export const necMean: Gen = (R, n) => {
  const l = pick(R, quadLabels.filter(x => x.cond.startsWith('is') ? R() < 0.4 : true));
  const c = CONDS[l.cond]!, nc = necCounter(l);
  const inDef: Record<string, string[]> = { para: ['onePar'], rect: ['fourRight', 'oneRight', 'isPara'], rhombus: ['fourSides', 'consSides', 'kiteSides', 'isPara'], square: ['fourRight', 'fourSides', 'isRect', 'isRhombus', 'rhombRight', 'oneRight'] };
  const defined = (inDef[l.target] ?? []).includes(l.cond);
  const opts: Opt[] = l.nec
    ? [{ t: `yes: every ${NAME[l.target]} ${hasP(c.text)}`, ok: true, say: 'Right: necessary means every member must have it.' },
      ...(defined ? [] : [{ t: `no: ${c.text} is not part of the definition of ${ART[l.target]}`, mc: MC.necDef, say: 'Proved properties count too, not only the definition.' }]),
      ...(l.suff ? [] : [{ t: `no: ${having(c.text)} does not make a shape ${ART[l.target]}`, mc: MC.necSuff, say: 'That is about SUFFICIENT. Necessary asks whether every member has it.' }])]
    : [{ t: `no: ${nc!.name} is ${ART[l.target]} without ${c.text}`, ok: true, say: 'Right: one member without it is enough.' },
      { t: `yes: the ${NAME[l.target]} in the picture ${hasP(c.text)}`, mc: MC.protoPic, say: 'One example can have an accidental property; necessary is about every member.' },
      ...(l.suff ? [{ t: `yes: ${having(c.text)} makes a shape ${ART[l.target]}`, mc: MC.necSuff, say: 'That makes it SUFFICIENT; necessary is the other direction.' }] : [])];
  if (opts.length < 3 && l.nec) opts.push({ t: `no: necessary would mean it is enough to make a shape ${ART[l.target]}`, mc: MC.necSuff, say: 'That describes SUFFICIENT. Necessary means every member has it.' });
  if (opts.length < 3) opts.push(l.nec ? { t: `no: some shapes with ${c.text} are not ${PLURAL[l.target]}`, mc: MC.necSuff, say: 'That is about sufficiency; necessary asks about every member of the class.' } : { t: `yes: most ${PLURAL[l.target]} have it`, mc: MC.protoPic, say: 'Necessary needs EVERY member to have it.' });
  // the picture: a member of the class that HAS the condition (an accidental property when it is not necessary)
  const k: QK = l.target;
  const fig = qfig(makeQ(R, k, { turn: ri(R, 0, 359) }), []);
  return choice(R, {
    id: `necMean-${n}`, family: 'necMean', prompt: `${l.cond === 'kiteSides' ? TRAP_DEF + ' ' : ''}Among quadrilaterals, is ${c.text.startsWith('being') ? c.text : 'having ' + c.text} NECESSARY for being ${ART[l.target]}?`, board: `\\text{${NAME[l.target]}} \\Rightarrow \\text{?}`,
    solution: [`Necessary: “if a quadrilateral is ${ART[l.target]}, then it ${hasP(c.text)}” must hold for every member.`, l.nec ? `Every ${NAME[l.target]} ${hasP(c.text)}.` : `${cap(nc!.name)} is ${ART[l.target]} without ${c.text}.`],
    picture: { fig, reveal: {} },
  }, opts);
};

// ---------- tests read from marks ----------
type Verdict = { marks: QMark[]; Q: Q4; diags?: 'whole' | 'halves'; right: string; wrong: Opt[]; why: string[]; prompt: string };
function verdictItem(R: () => number, n: number, fam: string, v: Verdict): QItem {
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `${fam}-${n}`, family: fam, prompt: v.prompt, board: '\\text{enough?}',
    solution: v.why,
    picture: { fig: qfig(v.Q, v.marks, { diags: v.diags }), reveal: {} },
  }, [{ t: v.right, ok: true, say: 'Right.' }, ...v.wrong]);
}
const turnR = (R: () => number) => ({ turn: ri(R, 0, 359) });
export const paraTest: Gen = (R, n) => fitted('paraTest', () => {
  const k = pick(R, ['sides', 'angles', 'diags', 'oneCong', 'diagCong'] as const);
  const T = { sides: 'yes: both pairs of opposite sides are congruent', angles: 'yes: both pairs of opposite angles are congruent', diags: 'yes: the diagonals bisect each other', no: 'no: the marks do not guarantee a parallelogram' };
  const all = (right: keyof typeof T, mcs: Partial<Record<keyof typeof T, string>>, says: Partial<Record<keyof typeof T, string>>): { right: string; wrong: Opt[] } => ({ right: T[right], wrong: (Object.keys(T) as (keyof typeof T)[]).filter(x => x !== right).map(x => ({ t: T[x], mc: mcs[x], say: says[x] ?? 'Read the marks again: which relation do they show?' })) });
  let v: Verdict;
  if (k === 'sides') v = { Q: makeQ(R, 'para', turnR(R)), marks: [tick('AB', 1), tick('DC', 1), tick('BC', 2), tick('AD', 2)], ...all('sides', { no: MC.unmarkedFalse }, { no: 'Both pairs of opposite sides congruent is a test: it guarantees a parallelogram.' }), why: ['The ticks show AB ≅ DC and BC ≅ AD: both pairs of opposite sides.', 'That is a test for a parallelogram.'], prompt: '' };
  else if (k === 'angles') v = { Q: makeQ(R, 'para', turnR(R)), marks: [arc('DAB', 1), arc('BCD', 1), arc('ABC', 2), arc('CDA', 2)], ...all('angles', { no: MC.unmarkedFalse }, { no: 'Both pairs of opposite angles congruent is a test.' }), why: ['The arcs show ∠A ≅ ∠C and ∠B ≅ ∠D.', 'Both pairs of opposite angles congruent is a test for a parallelogram.'], prompt: '' };
  else if (k === 'diags') v = { Q: makeQ(R, 'para', turnR(R)), diags: 'halves', marks: [tick('AE', 1), tick('EC', 1), tick('BE', 2), tick('ED', 2)], ...all('diags', { no: MC.unmarkedFalse }, { no: 'Diagonals that bisect each other is a test.' }), why: ['The ticks make E the midpoint of both diagonals.', 'Diagonals that bisect each other is a test for a parallelogram.'], prompt: '' };
  else if (k === 'oneCong') v = { Q: makeQ(R, 'isoTrap', turnR(R)), marks: [tick('AD', 1), tick('BC', 1)], ...all('no', { sides: MC.insuffTest }, { sides: 'Only ONE pair of opposite sides is marked congruent; an isosceles trapezoid has that too.' }), why: ['Only one pair of opposite sides is marked congruent.', 'An isosceles trapezoid has one such pair and is not a parallelogram: not guaranteed.'], prompt: '' };
  else v = { Q: makeQ(R, 'isoTrap', turnR(R)), diags: 'whole', marks: [tick('AC', 2), tick('BD', 2)], ...all('no', { diags: MC.necAsSuff }, { diags: 'The ticks show congruent diagonals, not bisected ones; an isosceles trapezoid has congruent diagonals.' }), why: ['The marks show congruent diagonals, nothing else.', 'An isosceles trapezoid has congruent diagonals and is not a parallelogram: not guaranteed.'], prompt: '' };
  v.prompt = 'Use only the marks. Do they prove ABCD is a parallelogram, and by which test?';
  return verdictItem(R, n, 'paraTest', v);
});
export const onePair: Gen = (R, n) => fitted('onePair', () => {
  const good = R() < 0.5;
  const v: Verdict = good
    ? { Q: makeQ(R, 'para', turnR(R)), marks: [par('AB', 1), par('DC', 1), tick('AB', 1), tick('DC', 1)], right: 'yes: the same pair, AB and DC, is both parallel and congruent', wrong: [{ t: 'no: both pairs of sides must be marked parallel', mc: MC.unmarkedFalse, say: 'One pair that is both parallel AND congruent is already a test.' }, { t: 'no: one pair of congruent sides is never enough', mc: MC.insuffTest, say: 'Alone it is not; together with the SAME pair parallel it is.' }], why: ['AB ∥ DC and AB ≅ DC: the same pair is parallel and congruent.', 'That is the one-pair test: a parallelogram.'], prompt: '' }
    : { Q: makeQ(R, 'isoTrap', turnR(R)), marks: [par('AB', 1), par('DC', 1), tick('AD', 1), tick('BC', 1)], right: 'no: the parallel pair and the congruent pair are different pairs; an isosceles trapezoid fits', wrong: [{ t: 'yes: one pair is parallel and the other pair is congruent', mc: MC.diffPairs, say: 'The test needs the SAME pair parallel and congruent; an isosceles trapezoid has these marks.' }, { t: 'yes: AB ∥ DC is enough', mc: MC.insuffTest, say: 'One parallel pair makes a trapezoid, not a parallelogram.' }], why: ['AB ∥ DC, but the congruent sides are AD and BC: a different pair.', 'An isosceles trapezoid has exactly these marks: not guaranteed.'], prompt: '' };
  v.prompt = `${TRAP_DEF} Use only the marks. Do they guarantee that ABCD is a parallelogram?`;
  return verdictItem(R, n, 'onePair', v);
});
export const rectTestF: Gen = (R, n) => fitted('rectTestF', () => {
  const k = pick(R, ['diag', 'right', 'diagOnly', 'rightOnly'] as const);
  const t = relabel(R, ROLES);
  const isRect = k === 'diag' || k === 'right';
  const Q = isRect ? makeQ(R, 'rect', turnR(R)) : k === 'diagOnly' ? makeQ(R, 'isoTrap', turnR(R)) : turnQ([[0, 0], [400, 0], [260, 220], [0, 220]] as Q4, ri(R, 0, 359));
  const marks: QMark[] = isRect ? [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)] : [];
  if (k === 'right') marks.push(box('DAB'));
  if (k === 'rightOnly') marks.push(box('DAB'));
  if (k === 'diagOnly') marks.push(tick('AC', 2), tick('BD', 2));
  const prem = isRect ? 'ABCD is a parallelogram' : 'ABCD is a quadrilateral';
  const has = k === 'diag' || k === 'diagOnly' ? 'AC = BD' : 'm∠DAB = 90°';
  const opts: Opt[] = isRect
    ? [{ t: `yes: a parallelogram with ${k === 'diag' ? 'congruent diagonals' : 'a right angle'} is a rectangle`, ok: true, say: 'Right: the parallelogram premise plus the test.' }, { t: 'no: all four right angles must be marked', mc: MC.unmarkedFalse, say: k === 'right' ? 'Consecutive angles are supplementary: one right angle makes all four right.' : 'A parallelogram with congruent diagonals is a rectangle.' }, { t: 'no: the diagonals must also be perpendicular', mc: MC.congPerp, say: 'Perpendicular diagonals would make a rhombus; a rectangle does not need them.' }]
    : [{ t: `no: without the parallelogram premise ${k === 'diagOnly' ? 'an isosceles trapezoid' : 'a trapezoid with two right angles'} fits`, ok: true, say: 'Right: the test only works among parallelograms.' }, { t: `yes: ${k === 'diagOnly' ? 'congruent diagonals make a rectangle' : 'a right angle makes a rectangle'}`, mc: MC.dropsPara, say: 'That test needs a parallelogram first.' }, { t: 'yes: it looks like a rectangle', mc: MC.appearance, say: 'Looks are not evidence.' }];
  return choiceT(R, t, {
    id: `rectTestF-${n}`, family: 'rectTestF', prompt: `${prem}${isRect ? ' (the arrowheads)' : ''}, and ${has}${k.includes('diag') && isRect ? ' (measured)' : ''}. Is ABCD guaranteed to be a rectangle?`, board: `${has.replace('m∠', 'm\\angle ').replace('°', '^\\circ')}`,
    solution: isRect ? ['ABCD is a parallelogram (the premise).', k === 'diag' ? 'A parallelogram with congruent diagonals is a rectangle.' : 'One right angle: consecutive angles are supplementary, so all four are right angles.'] : ['No parallelogram is given.', k === 'diagOnly' ? 'An isosceles trapezoid has congruent diagonals and is not a rectangle.' : 'A trapezoid can have a right angle without being a rectangle.'],
    picture: { fig: qfig(Q, marks, { diags: k.includes('diag') ? 'whole' : undefined }), reveal: {} },
  }, opts);
});
export const rhombTest: Gen = (R, n) => fitted('rhombTest', () => {
  const k = pick(R, ['perp', 'bis', 'cons', 'perpOnly', 'square', 'noRight'] as const);
  const PM: QMark[] = [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)];
  let Q: Q4, marks: QMark[], diags: 'whole' | 'halves' | undefined, stem: string, right: string, wrong: Opt[], why: string[];
  if (k === 'perp' || k === 'bis' || k === 'cons') {
    Q = makeQ(R, 'rhombus', turnR(R));
    marks = k === 'perp' ? [...PM, box('AEB')] : k === 'bis' ? [...PM, arc('DAC', 1), arc('CAB', 1)] : [...PM, tick('AB', 1), tick('BC', 1)];
    diags = k === 'perp' ? 'halves' : k === 'bis' ? 'whole' : undefined;
    stem = 'Is ABCD guaranteed to be a rhombus?';
    right = `yes: a parallelogram with ${k === 'perp' ? 'perpendicular diagonals' : k === 'bis' ? 'a diagonal that bisects a vertex angle' : 'two congruent consecutive sides'} is a rhombus`;
    wrong = [{ t: 'no: all four sides must be marked congruent', mc: MC.unmarkedFalse, say: 'Among parallelograms, this test is already enough.' }, { t: 'no: it also needs a right angle', mc: MC.upHier, say: 'A right angle would make a square; a rhombus does not need one.' }];
    why = ['The arrowheads make ABCD a parallelogram.', `${k === 'perp' ? 'Perpendicular diagonals' : k === 'bis' ? 'A diagonal bisecting the vertex angle' : 'Two congruent consecutive sides'} in a parallelogram: a rhombus.`];
  } else if (k === 'perpOnly') {
    Q = makeQ(R, 'kite', turnR(R));
    marks = [box('AEB')]; diags = 'halves';
    stem = 'Is ABCD guaranteed to be a rhombus?';
    right = 'no: without a parallelogram, a kite has perpendicular diagonals too';
    wrong = [{ t: 'yes: perpendicular diagonals make a rhombus', mc: MC.dropsPara, say: 'Only among parallelograms; a kite has them too.' }, { t: 'yes: it is a square', mc: MC.appearance, say: 'Nothing marks congruent sides or right angles at the vertices.' }];
    why = ['Only perpendicular diagonals are marked; no parallelogram is given.', 'A kite has perpendicular diagonals and is not a rhombus.'];
  } else if (k === 'square') {
    Q = makeQ(R, 'square', turnR(R));
    marks = [...PM, box('DAB'), tick('AB', 1), tick('BC', 1)]; diags = undefined;
    stem = 'Which is the most specific name the marks guarantee?';
    right = 'a square: a rectangle (one right angle) and a rhombus (two congruent consecutive sides)';
    wrong = [{ t: 'a rhombus only: a square needs four right angles marked', mc: MC.skipsRight, say: 'In a parallelogram one right angle makes all four right angles.' }, { t: 'a rectangle only: a square needs four congruent sides marked', mc: MC.unmarkedFalse, say: 'In a parallelogram two congruent consecutive sides make all four congruent.' }];
    why = ['A parallelogram with a right angle is a rectangle.', 'A parallelogram with two congruent consecutive sides is a rhombus.', 'Both at once: a square.'];
  } else {
    Q = makeQ(R, 'rhombus', turnR(R));
    marks = [tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1)];
    stem = 'Is ABCD guaranteed to be a square?';
    right = 'no: four congruent sides make a rhombus; a square also needs a right angle';
    wrong = [{ t: 'yes: four congruent sides make a square', mc: MC.skipsRight, say: 'A rhombus has four congruent sides without right angles.' }, { t: 'yes: it is a parallelogram with congruent sides', mc: MC.skipsRight, say: 'That is a rhombus; check for a right angle.' }];
    why = ['Four congruent sides: a rhombus.', 'Nothing marks a right angle, so it need not be a square.'];
  }
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `rhombTest-${n}`, family: 'rhombTest', prompt: `Use only the marks. ${stem}`, board: '\\text{rhombus or square?}',
    solution: why, picture: { fig: qfig(Q, marks, { diags }), reveal: {} },
  }, [{ t: right, ok: true, say: 'Right.' }, ...wrong]);
});

// ---------- kite and isosceles trapezoid diagonals ----------
export const kiteDiag: Gen = (R, n) => fitted('kiteDiag', () => {
  const u = pick(R, UNITS), t = relabel(R, ROLES);
  const L = 440, p = L * (0.28 + R() * 0.12), BD2 = ri(R, 6, 16), sc = (L * 0.32) / BD2;   // BE = ED = BD2 (units), drawn to scale
  const Q = turnQ(kitePts(p, L - p, BD2 * sc), ri(R, 0, 359));
  const marks: QMark[] = [tick('AB', 1), tick('AD', 1), tick('BC', 2), tick('DC', 2)];
  if (R() < 0.5) {
    const f = qfig(Q, marks, { diags: 'halves' });
    const askHalf = R() < 0.5;
    if (askHalf) setSeg(f, 'BE', '?', `${BD2} ${u}`, 'link'); else setSeg(f, 'BE', `${BD2} ${u}`);
    return numT(t, {
      id: `kiteDiag-${n}`, family: 'kiteDiag', prompt: askHalf ? `ABCD is a kite (AB ≅ AD, CB ≅ CD) with diagonals meeting at E, and BD = ${2 * BD2} ${u}. How long is BE?` : `ABCD is a kite (AB ≅ AD, CB ≅ CD) with diagonals meeting at E, and BE = ${BD2} ${u}. How long is BD?`, board: 'BE = ED', unit: u,
      solution: ['In a kite the symmetry diagonal AC (joining the vertices between the congruent pairs) bisects the other diagonal BD.', askHalf ? `BE = ${2 * BD2} ÷ 2 = ${S(BD2 + ' ' + u)}.` : `BD = 2 · ${BD2} = ${S(2 * BD2 + ' ' + u)}.`],
      picture: { fig: f, reveal: { solved: askHalf ? ['BE'] : [] } },
    }, askHalf ? BD2 : 2 * BD2, [{ v: askHalf ? 4 * BD2 : BD2 / 2, mc: MC.partWhole, say: 'BE is half of BD.' }], 'Right.', 'The symmetry diagonal bisects the other diagonal.');
  }
  return choiceT(R, t, {
    id: `kiteDiag-${n}`, family: 'kiteDiag', prompt: 'ABCD is a kite that is not a rhombus (AB ≅ AD, CB ≅ CD); its diagonals meet at E. Which must be true?', board: '\\text{kite diagonals}',
    solution: ['A kite\'s diagonals are perpendicular.', 'Only the diagonal between the congruent pairs, AC, bisects the other one: BE = ED, but AE ≠ EC.'],
    picture: { fig: qfig(Q, marks, { diags: 'halves' }), reveal: {} },
  }, [{ t: 'AC ⊥ BD and BE = ED', ok: true, say: 'Right.' }, { t: 'AE = EC and BE = ED', mc: MC.upHier, say: 'Bisecting each other belongs to parallelograms; a kite is not one.' }, { t: 'AC = BD', mc: MC.uniqueDiag, say: 'Nothing makes a kite\'s diagonals congruent.' }, { t: 'AC ⊥ BD only: neither diagonal is bisected', mc: MC.uniqueDiag, say: 'The symmetry diagonal AC does bisect BD.' }]);
});
export const isoTrapDiag: Gen = (R, n) => fitted('isoTrapDiag', () => {
  const u = pick(R, UNITS), t = relabel(R, ROLES);
  const Q = makeQ(R, 'isoTrap', turnR(R));
  const marks: QMark[] = [par('AB', 1), par('DC', 1), tick('AD', 1), tick('BC', 1)];
  if (R() < 0.5) {
    // E divides each diagonal in the ratio of the bases: AE : EC = AB : DC, so the labels are drawn to scale
    const AEu = ri(R, 7, 16), ECu = ri(R, 3, AEu - 3) + (R() < 0.25 ? 0.5 : 0);
    const AB = 430, DC = (AB * ECu) / AEu, h = 220 + R() * 60;
    const Q2 = turnQ(trapPts(AB, DC, (AB - DC) / 2, h), ri(R, -30, 30));
    const f2 = qfig(Q2, marks, { diags: 'halves' });
    setSeg(f2, 'AE', `${fmt(AEu)} ${u}`); setSeg(f2, 'EC', `${fmt(ECu)} ${u}`);
    return numT(t, {
      id: `isoTrapDiag-${n}`, family: 'isoTrapDiag', prompt: `${ISO_DEF} ABCD is an isosceles trapezoid with AB ∥ DC and AD ≅ BC; its diagonals meet at E. How long is diagonal BD?`, board: 'BD = ?', unit: u,
      solution: [`AC = AE + EC = ${fmt(AEu)} + ${fmt(ECu)} = ${fmt(AEu + ECu)}.`, `The diagonals of an isosceles trapezoid are congruent: BD = ${S(fmt(AEu + ECu) + ' ' + u)}.`],
      picture: { fig: f2, reveal: {} },
    }, AEu + ECu, [{ v: 2 * AEu, mc: MC.congBisect, say: 'E is not the midpoint: the diagonals do not bisect each other.' }, { v: 2 * ECu, mc: MC.congBisect, say: 'E is not the midpoint: add AE and EC.' }], 'Right.', 'Congruent diagonals: BD = AC = AE + EC.');
  }
  return choiceT(R, t, {
    id: `isoTrapDiag-${n}`, family: 'isoTrapDiag', prompt: `${ISO_DEF} ABCD is an isosceles trapezoid; its diagonals meet at E. Which is true?`, board: '\\text{isosceles trapezoid}',
    solution: ['The diagonals of an isosceles trapezoid are congruent.', 'They do not bisect each other: it is not a parallelogram.'],
    picture: { fig: qfig(Q, marks, { diags: 'halves' }), reveal: {} },
  }, [{ t: 'AC = BD, but E is not the midpoint of either diagonal', ok: true, say: 'Right.' }, { t: 'AC = BD, so AE = EC', mc: MC.congBisect, say: 'Congruent diagonals need not bisect each other.' }, { t: 'AC ⊥ BD', mc: MC.congPerp, say: 'Congruent does not mean perpendicular.' }, { t: 'only rectangles have congruent diagonals, so AC ≠ BD', mc: MC.uniqueDiag, say: 'An isosceles trapezoid has congruent diagonals too.' }]);
});

// ---------- counterexamples, four-way, universe ----------
const CLAIMS: { hyp: string; concl: QK; right: string; holds: string; premise: string; mcPrem?: string }[] = [
  { hyp: 'has congruent diagonals', concl: 'rect', right: 'an isosceles trapezoid', holds: 'a square', premise: 'a kite that is not a rhombus' },
  { hyp: 'has perpendicular diagonals', concl: 'rhombus', right: 'a kite that is not a rhombus', holds: 'a square', premise: 'a rectangle that is not a square' },
  { hyp: 'has one pair of opposite sides parallel and the other pair congruent', concl: 'para', right: 'an isosceles trapezoid', holds: 'a rectangle', premise: 'a kite that is not a rhombus' },
  { hyp: 'is a rectangle', concl: 'square', right: 'a rectangle that is not a square', holds: 'a square', premise: 'a rhombus that is not a square' },
  { hyp: 'has four congruent sides', concl: 'square', right: 'a rhombus that is not a square', holds: 'a square', premise: 'a rectangle that is not a square' },
  { hyp: 'has two pairs of adjacent congruent sides', concl: 'rhombus', right: 'a kite that is not a rhombus', holds: 'a square', premise: 'a parallelogram with no right angle and unequal sides' },
  { hyp: 'has at least one right angle', concl: 'rect', right: 'a trapezoid with two right angles', holds: 'a square', premise: 'a rhombus that is not a square' },
  { hyp: 'has one pair of parallel sides', concl: 'para', right: 'an isosceles trapezoid', holds: 'a rectangle', premise: 'a kite that is not a rhombus' },
  { hyp: 'is a rhombus', concl: 'square', right: 'a rhombus that is not a square', holds: 'a square', premise: 'a rectangle that is not a square' },
  { hyp: 'is a parallelogram', concl: 'rect', right: 'a parallelogram with no right angle and unequal sides', holds: 'a square', premise: 'an isosceles trapezoid' },
  { hyp: 'has congruent diagonals', concl: 'square', right: 'a rectangle that is not a square', holds: 'a square', premise: 'a rhombus that is not a square' },
  { hyp: 'has perpendicular diagonals', concl: 'square', right: 'a rhombus that is not a square', holds: 'a square', premise: 'a rectangle that is not a square' },
];
export const counterEx: Gen = (R, n) => {
  const c = pick(R, CLAIMS);
  const opts: Opt[] = [
    { t: c.right, ok: true, say: 'Right: it meets the hypothesis and breaks the conclusion.' },
    { t: c.holds, mc: 'mc.reasoning-language.counterexample-claim-holds', say: `${cap(c.holds)} meets the hypothesis AND is ${ART[c.concl]}: it agrees with the claim.` },
    { t: c.premise, mc: 'mc.reasoning-language.counterexample-violates-premise', say: `${cap(c.premise)} does not meet the hypothesis, so it cannot test the claim.` },
    { t: 'none: the claim is true', mc: MC.necAsSuff, say: 'Look for a shape that meets the hypothesis but is not the conclusion.' },
  ];
  return choice(R, {
    id: `counterEx-${n}`, family: 'counterEx', prompt: `${TRAP_DEF} ${ISO_DEF} Claim: “If a quadrilateral ${c.hyp}, then it is ${ART[c.concl]}.” Which shape is a counterexample?`, board: '\\text{a counterexample}',
    solution: ['A counterexample meets the hypothesis and breaks the conclusion.', `${cap(c.right)} ${c.hyp} and is not ${ART[c.concl]}.`],
    picture: { card: { lines: [`If a quadrilateral ${c.hyp},`, `then it is ${ART[c.concl]}.`] }, reveal: {} },
  }, opts);
};
const FOUR = { both: 'both necessary and sufficient', nec: 'necessary only', suff: 'sufficient only', neither: 'neither' } as const;
const labelOf = (l: Label): keyof typeof FOUR => (l.nec && l.suff ? 'both' : l.nec ? 'nec' : l.suff ? 'suff' : 'neither');
export const fourWay: Gen = (R, n) => {
  const l = pick(R, LABELS.filter(x => x.universe === 'quad')), c = CONDS[l.cond]!, right = labelOf(l);
  const sc = suffCounter(l), nc = necCounter(l);
  const why = [l.nec ? `Necessary: every ${NAME[l.target]} ${hasP(c.text)}.` : `Not necessary: ${nc!.name} is ${ART[l.target]} without ${c.text}.`, l.suff ? `Sufficient: ${c.text} guarantees ${ART[l.target]}.` : `Not sufficient: ${sc!.name} ${hasP(c.text)} and is not ${ART[l.target]}.`];
  const opts: Opt[] = (Object.keys(FOUR) as (keyof typeof FOUR)[]).map(k => ({ t: FOUR[k], ok: k === right, mc: k === right ? undefined : (k === 'nec' && right === 'suff') || (k === 'suff' && right === 'nec') ? MC.necSuff : MC.labels, say: k === right ? 'Right: both directions checked separately.' : `Check each direction on its own. ${why.join(' ')}` }));
  return choice(R, {
    id: `fourWay-${n}`, family: 'fourWay', prompt: `${l.cond === 'kiteSides' ? TRAP_DEF + ' ' : ''}Among all quadrilaterals, is ${c.text.startsWith('being') ? c.text : 'having ' + c.text} necessary, sufficient, both, or neither for being ${ART[l.target]}?`, board: `\\text{${NAME[l.target]}}`,
    solution: [...why, `So: ${FOUR[right]}.`],
    picture: { card: { lines: [`Condition: ${c.text}`, `Class: ${PLURAL[l.target]}`, UNIV_WORD.quad[0]!.toUpperCase() + UNIV_WORD.quad.slice(1)] }, reveal: {} },
  }, opts, true);
};
const UNI_PAIRS: [string, QK][] = LABELS.filter(l => l.universe === 'para').map(l => [l.cond, l.target] as [string, QK]).filter(([c, k]) => LABELS.some(l => l.universe === 'quad' && l.cond === c && l.target === k));
export const universe: Gen = (R, n) => {
  const pair = pick(R, UNI_PAIRS);
  const lq = LABELS.find(x => x.cond === pair[0] && x.target === pair[1] && x.universe === 'quad')!, lp = LABELS.find(x => x.cond === pair[0] && x.target === pair[1] && x.universe === 'para')!;
  const c = CONDS[pair[0]]!, sq = suffCounter(lq), sp = suffCounter(lp);
  const T = {
    pOnly: `not sufficient among all quadrilaterals${sq ? ` (${sq.name} fits)` : ''}, but sufficient among parallelograms`,
    both: 'sufficient in both universes',
    neither: 'sufficient in neither universe',
    qOnly: 'sufficient among all quadrilaterals, but not among parallelograms',
  };
  const right: keyof typeof T = lq.suff && lp.suff ? 'both' : !lq.suff && lp.suff ? 'pOnly' : !lq.suff && !lp.suff ? 'neither' : 'qOnly';
  const why = [lq.suff ? `(a) Among all quadrilaterals, ${c.text} guarantees ${ART[pair[1]]}: sufficient.` : `(a) ${cap(sq!.name)} ${hasP(c.text)} and is not ${ART[pair[1]]}: not sufficient.`, lp.suff ? `(b) Among parallelograms, ${c.text} guarantees ${ART[pair[1]]}: sufficient.` : `(b) ${cap(sp!.name)} is a parallelogram that ${hasP(c.text)} and is not ${ART[pair[1]]}: not sufficient.`];
  const opts: Opt[] = (Object.keys(T) as (keyof typeof T)[]).map(k => ({ t: T[k], ok: k === right, mc: k === right ? undefined : k === 'both' || k === 'qOnly' ? MC.dropsPara : MC.labels, say: k === right ? 'Right: check each universe on its own.' : why.join(' ') }));
  return choice(R, {
    id: `universe-${n}`, family: 'universe', prompt: `Is ${having(c.text)} sufficient for being ${ART[pair[1]]}: (a) among all quadrilaterals, (b) among parallelograms?`, board: '\\text{the universe matters}',
    solution: [...why, `So: ${T[right]}.`],
    picture: { card: { lines: [`Condition: ${c.text}`, '(a) among all quadrilaterals', '(b) among parallelograms'] }, reveal: {} },
  }, opts, true);
};

// ---------- solve for x ----------
export const solveForTest: Gen = (R, n) => fitted('solveForTest', () => {
  const v = pick(R, ['diagMid', 'oppSides', 'rectDiag', 'rhombSides'] as const);
  const u = pick(R, UNITS), t = relabel(R, ROLES);
  for (let k = 0; k < 60; k++) {
    const a1 = ri(R, 2, 5), a2 = ri(R, 1, a1 - 1 || 1), x = ri(R, 2, 9), b1 = ri(R, -8, 10), b2 = a1 * x + b1 - a2 * x;
    const val = a1 * x + b1;
    if (a1 === a2 || b1 === 0 || b2 === 0 || val < 5 || val > 40 || Math.abs(b2) > 30) continue;
    const e1 = linT(a1, b1).replace(/-/g, '−'), e2 = linT(a2, b2).replace(/-/g, '−');
    let Q: Q4, marks: QMark[], diags: 'halves' | 'whole' | undefined, prompt: string, test: string, seg: [string, string];
    if (v === 'diagMid') {
      const other = ri(R, 6, 40);
      const sc = 420 / Math.max(2 * val, other);
      const A = [-val * sc, 0], C = [val * sc, 0], phi = ri(R, 50, 75) * Math.PI / 180, B = [-other / 2 * sc * Math.cos(phi), -other / 2 * sc * Math.sin(phi)], D = [other / 2 * sc * Math.cos(phi), other / 2 * sc * Math.sin(phi)];
      Q = turnQ([A, B, C, D] as unknown as Q4, ri(R, 0, 359)); marks = [tick('BE', 2), tick('ED', 2)]; diags = 'halves'; seg = ['AE', 'EC'];
      prompt = `The diagonals of quadrilateral ABCD meet at E, with BE = ED, AE = ${e1} and EC = ${e2}. For which x is ABCD a parallelogram?`;
      test = 'The diagonals must bisect each other: AE = EC.';
    } else if (v === 'oppSides') {
      const other = ri(R, 6, 30);
      if (Math.abs(other - val) < 3) continue;
      Q = turnQ(paraPts(420, 420 * other / val, ri(R, 56, 74)), ri(R, 0, 359)); marks = [tick('BC', 2), tick('AD', 2)]; seg = ['AB', 'DC'];
      prompt = `In quadrilateral ABCD, BC ≅ AD (the ticks), AB = ${e1} and DC = ${e2}. For which x is ABCD a parallelogram?`;
      test = 'Both pairs of opposite sides must be congruent: AB = DC.';
    } else if (v === 'rectDiag') {
      Q = turnQ(paraPts(420, 420 * (0.5 + R() * 0.25), 90), ri(R, 0, 359)); marks = [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)]; diags = 'whole'; seg = ['AC', 'BD'];
      prompt = `ABCD is a parallelogram (the arrowheads) with diagonals AC = ${e1} and BD = ${e2}. For which x is ABCD a rectangle?`;
      test = 'A parallelogram with congruent diagonals is a rectangle: AC = BD.';
    } else {
      Q = turnQ(paraPts(400, 400, ri(R, 56, 74)), ri(R, 0, 359)); marks = [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)]; seg = ['AB', 'BC'];
      prompt = `ABCD is a parallelogram (the arrowheads) with AB = ${e1} and BC = ${e2}. For which x is ABCD a rhombus?`;
      test = 'A parallelogram with two congruent consecutive sides is a rhombus: AB = BC.';
    }
    const f = qfig(Q, marks, { diags });
    if (v !== 'rectDiag') { setSeg(f, seg[0], e1); setSeg(f, seg[1], e2); }
    return numT(t, {
      id: `solveForTest-${n}`, family: 'solveForTest', prompt, board: '\\text{find } x', unit: '',
      solution: [test, `${e1} = ${e2} gives ${a1 - a2 === 1 ? '' : a1 - a2}x = ${b2 - b1}.`, `x = ${S(String(x))} (then both are ${val}).`],
      picture: { fig: f, reveal: {} },
    }, x, [{ v: val, mc: MC.reportsX, say: `${val} is the length; the question asks for x.` }], 'Right: x, and the test it makes true.', 'Set the two expressions equal (the test), then solve.');
  }
  throw new Error('no numbers');
});

// ---------- trapezoid theorems ----------
const CONTEXT: { text: (b1: number, b2: number, u: string) => string; unit: string }[] = [
  { text: (b1, b2, u) => `A ladder is wider at the bottom. The bottom rung is ${b1} ${u} and the top rung is ${b2} ${u}. How long is the rung exactly halfway between them?`, unit: 'in.' },
  { text: (b1, b2, u) => `A trapezoid-shaped garden bed has parallel edges of ${b1} ${u} and ${b2} ${u}. A path runs straight across, joining the midpoints of the two slanted edges. How long is the path?`, unit: 'ft' },
  { text: (b1, b2, u) => `An A-frame shelf unit has a bottom shelf of ${b1} ${u} and a top shelf of ${b2} ${u}. A middle shelf joins the midpoints of the two slanted sides. How long is it?`, unit: 'in.' },
]
export const trapMid: Gen = (R, n) => fitted('trapMid', () => {
  const v = pick(R, ['mid', 'base', 'context', 'alg'] as const);
  const t = relabel(R, 'ABCDMN');
  let b1 = 2 * ri(R, 6, 20), b2 = 2 * ri(R, 3, 14);
  if (b2 >= b1 - 4) b2 = b1 - 2 * ri(R, 2, 5);
  if (b2 < 4) throw new Error('small');
  if (R() < 0.3) b1 += 1, b2 += 1;   // an odd pair: the midsegment is still whole
  const m = (b1 + b2) / 2, u = v === 'context' ? '' : pick(R, UNITS);
  const sc = 440 / b1, h = 200 + R() * 80, off = (b1 - b2) * sc * (0.2 + R() * 0.6);
  const Q = turnQ(trapPts(b1 * sc, b2 * sc, off, h), ri(R, -20, 20));
  const M: [number, number] = [(Q[0][0] + Q[3][0]) / 2, (Q[0][1] + Q[3][1]) / 2], N: [number, number] = [(Q[1][0] + Q[2][0]) / 2, (Q[1][1] + Q[2][1]) / 2];
  const marks: QMark[] = [par('AB', 1), par('DC', 1), tick('AM', 1), tick('MD', 1), tick('BN', 2), tick('NC', 2)];
  const f = qfig(Q, marks, { extraPts: { M, N }, extraSegs: ['AM', 'MD', 'BN', 'NC', 'MN'], segStyle: { MN: { col: 'link' }, AD: { col: 'faint' }, BC: { col: 'faint' } } });
  if (v === 'alg') {
    for (let k = 0; k < 40; k++) {
      const x = ri(R, 2, 9), a1 = ri(R, 1, 3), c1 = b1 - a1 * x, a2 = ri(R, 1, 3), c2 = b2 - a2 * x;
      // the midsegment as px + q with 2(px + q) = (a1 + a2)x + (c1 + c2)
      if ((a1 + a2) % 2 || (c1 + c2) % 2 || c1 === 0 || c2 === 0) continue;
      const p = (a1 + a2) / 2, q = (c1 + c2) / 2;
      if (q === 0) continue;
      setSeg(f, 'AB', linT(a1, c1).replace(/-/g, '−')); setSeg(f, 'DC', linT(a2, c2).replace(/-/g, '−')); setSeg(f, 'MN', `${m} ${u}`);
      // an equation with x on both sides: give the midsegment as a number, the bases as expressions
      void p;
      return numT(t, {
        id: `trapMid-${n}`, family: 'trapMid', prompt: `ABCD is a trapezoid with bases AB = ${linT(a1, c1).replace(/-/g, '−')} and DC = ${linT(a2, c2).replace(/-/g, '−')}, and midsegment MN = ${m} (all in ${u === 'in.' ? 'inches' : u === 'ft' ? 'feet' : 'centimeters'}). How long is AB?`, board: 'MN = \\tfrac{1}{2}(AB + DC)', unit: u,
        solution: ['Trapezoid midsegment: MN = ½(AB + DC).', `(${linT(a1, c1).replace(/-/g, '−')}) + (${linT(a2, c2).replace(/-/g, '−')}) = ${2 * m} gives x = ${x}.`, `AB = ${S(b1 + ' ' + u)}.`],
        picture: { fig: f, reveal: {} },
      }, b1, [{ v: x, mc: MC.reportsX, say: `x = ${x}; the question asks for AB.` }], 'Right.', 'MN = ½(AB + DC): solve for x, then find AB.');
    }
    throw new Error('no algebra');
  }
  if (v === 'base') {
    setSeg(f, 'AB', `${b1} ${u}`); setSeg(f, 'MN', `${m} ${u}`); setSeg(f, 'DC', '?', `${b2} ${u}`, 'link');
    return numT(t, {
      id: `trapMid-${n}`, family: 'trapMid', prompt: `ABCD is a trapezoid with bases AB and DC; M and N are the midpoints of the legs. AB = ${b1} ${u} and MN = ${m} ${u}. How long is DC?`, board: 'MN = \\tfrac{1}{2}(AB + DC)', unit: u,
      solution: ['MN = ½(AB + DC), so AB + DC = 2 · MN.', `DC = 2 · ${m} − ${b1} = ${S(b2 + ' ' + u)}.`],
      picture: { fig: f, reveal: { solved: ['DC'] } },
    }, b2, [{ v: 2 * m + b1, mc: MC.trapAvg, say: 'The midsegment is the AVERAGE of the bases: subtract the known base from 2 · MN.' }, { v: m - b1 / 2, mc: MC.trapAvg, say: 'Double the midsegment first: AB + DC = 2 · MN.' }], 'Right.', 'MN is the average of the bases.');
  }
  const ctx = pick(R, CONTEXT);
  const uu = v === 'context' ? ctx.unit : u;
  setSeg(f, 'AB', `${b1} ${uu}`); setSeg(f, 'DC', `${b2} ${uu}`); setSeg(f, 'MN', '?', `${m} ${uu}`, 'link');
  const prompt = v === 'context' ? prose(ctx.text(b1, b2, uu)) : `ABCD is a trapezoid with bases AB = ${b1} ${uu} and DC = ${b2} ${uu}; M and N are the midpoints of the legs. How long is MN?`;
  return numT(t, {
    id: `trapMid-${n}`, family: 'trapMid', prompt, board: 'MN = \\tfrac{1}{2}(AB + DC)', unit: uu,
    solution: ['The midsegment of a trapezoid is the average of the bases.', `½(${b1} + ${b2}) = ${S(m + ' ' + uu)}.`],
    picture: { fig: f, reveal: { solved: ['MN'] } },
  }, m, [{ v: b1 + b2, mc: MC.trapAvg, say: 'Average the bases: half their sum.' }, { v: b1 / 2, mc: MC.trapAvg, say: 'Half of ONE base is a triangle midsegment; a trapezoid averages both bases.' }, { v: b1 - b2, say: 'Average the bases: half their sum.' }], 'Right.', 'Average the two bases.');
});
export const isoTrapAngle: Gen = (R, n) => fitted('isoTrapAngle', () => {
  const base = ri(R, 52, 78) + (R() < 0.2 ? 0.5 : 0);
  const a = 440, h = 160 + R() * 80, d = h / Math.tan((base * Math.PI) / 180);
  if (a - 2 * d < 110) throw new Error('flat');
  const Q = turnQ(trapPts(a, a - 2 * d, d, h), ri(R, -25, 25));
  const ask = pick(R, ['ABC', 'BCD', 'CDA'] as const);
  const marks: QMark[] = [par('AB', 1), par('DC', 1), tick('AD', 1), tick('BC', 1), albl('DAB', `${fmt(base)}°`), albl(ask, '?')];
  const f = qfig(Q, marks);
  const ans = ask === 'ABC' ? base : 180 - base;
  setAng(f, ask, `${fmt(ans)}°`, 'link');
  const t = relabel(R, ROLES);
  return numT(t, {
    id: `isoTrapAngle-${n}`, family: 'isoTrapAngle', prompt: `${ISO_DEF} ABCD is an isosceles trapezoid with AB ∥ DC and AD ≅ BC. What is m∠${ask}?`, board: ask === 'ABC' ? 'm\\angle ABC = m\\angle DAB' : `m\\angle ${ask} + ${ask === 'CDA' ? 'm\\angle DAB' : 'm\\angle ABC'} = 180^\\circ`, unit: '°',
    solution: ask === 'ABC' ? ['Base angles of an isosceles trapezoid are congruent.', `m∠ABC = ${S(fmt(ans) + '°')}.`] : [ask === 'CDA' ? '∠CDA and ∠DAB are same-side interior angles of AB ∥ DC: supplementary.' : '∠BCD and ∠ABC are same-side interior angles, and ∠ABC ≅ ∠DAB (base angles).', `180° − ${fmt(base)}° = ${S(fmt(ans) + '°')}.`],
    picture: { fig: f, reveal: { solved: [ask] } },
  }, ans, ask === 'ABC' ? [{ v: 180 - base, mc: MC.congSupp, say: 'Base angles on the same base are congruent.' }] : [{ v: base, mc: MC.swapAng, say: `∠${ask} sits on the other base: it is supplementary to the angle at the same leg.` }], 'Right.', 'Base angles congruent; angles along a leg supplementary.');
});

// ---------- practical checks ----------
const PRACT: { s: string; right: string; wrong: Opt[] }[] = [
  { s: 'A framer measures the two diagonals of a picture frame: both 34 in. Is the frame guaranteed to be a rectangle?', right: 'no: an isosceles trapezoid also has congruent diagonals; first make sure it is a parallelogram', wrong: [{ t: 'yes: congruent diagonals make a rectangle', mc: MC.necAsSuff, say: 'Only for a parallelogram; an isosceles trapezoid passes this check.' }, { t: 'yes: rectangles are the only shapes with congruent diagonals', mc: MC.uniqueDiag, say: 'Isosceles trapezoids have them too.' }] },
  { s: 'A framer checks a door frame: both pairs of opposite sides measure 80 in. and 36 in., and the diagonals both measure 88 in. Is the frame guaranteed to be a rectangle?', right: 'yes: opposite sides congruent make a parallelogram, and congruent diagonals then make it a rectangle', wrong: [{ t: 'no: all four angles must be measured', mc: MC.unmarkedFalse, say: 'The two checks together are a proof: parallelogram, then the rectangle test.' }, { t: 'no: diagonals never prove anything', mc: MC.necAsSuff, say: 'Among parallelograms, congruent diagonals are a rectangle test.' }] },
  { s: 'A framer checks that the diagonals bisect each other (each crossing point is at the middle) and that the diagonals are equal. Is the frame guaranteed to be a rectangle?', right: 'yes: diagonals that bisect each other make a parallelogram, and congruent diagonals then make it a rectangle', wrong: [{ t: 'no: bisecting diagonals only give a rhombus', mc: MC.diagWords, say: 'Bisecting each other gives a parallelogram; congruent then gives a rectangle.' }, { t: 'no: a square check is needed', mc: MC.skipsRight, say: 'A rectangle need not be a square.' }] },
  { s: 'A crew lays out a patio: all four sides measure 12 ft. Is the patio guaranteed to be a square?', right: 'no: four congruent sides make a rhombus; it also needs a right angle or equal diagonals', wrong: [{ t: 'yes: four equal sides make a square', mc: MC.skipsRight, say: 'A rhombus has four equal sides and slanted angles.' }, { t: 'yes: it looks square on the ground', mc: MC.appearance, say: 'Looks are not a check.' }] },
  { s: 'A crew lays out a patio: all four sides measure 12 ft and the two diagonals are equal. Is the patio guaranteed to be a square?', right: 'yes: four congruent sides make a rhombus (a parallelogram), and congruent diagonals make it a rectangle too', wrong: [{ t: 'no: the corners must also be measured', mc: MC.unmarkedFalse, say: 'Equal diagonals in a parallelogram already force right angles.' }, { t: 'no: equal diagonals belong to isosceles trapezoids', mc: MC.uniqueDiag, say: 'Here the shape is already a rhombus, so the rectangle test applies.' }] },
  { s: 'A carpenter checks that three corners of a tabletop are right angles. Is the tabletop guaranteed to be a rectangle?', right: 'yes: the four angles add to 360°, so the fourth corner is a right angle too', wrong: [{ t: 'no: all four corners must be checked', mc: MC.unmarkedFalse, say: 'The angle sum forces the fourth: 360° − 270° = 90°.' }, { t: 'no: the sides must also be measured', mc: MC.necAsSuff, say: 'Four right angles are the definition of a rectangle.' }] },
  { s: 'A carpenter checks that one corner of a tabletop is a right angle and that both pairs of opposite edges are equal. Is the tabletop guaranteed to be a rectangle?', right: 'yes: equal opposite edges make a parallelogram, and a parallelogram with a right angle is a rectangle', wrong: [{ t: 'no: all four corners must be checked', mc: MC.unmarkedFalse, say: 'In a parallelogram, consecutive angles are supplementary: one right angle makes all four.' }, { t: 'no: equal opposite edges only give a rhombus', mc: MC.interchange, say: 'Opposite edges equal give a parallelogram, not a rhombus.' }] },
  { s: 'A carpenter checks only that one corner of a tabletop is a right angle. Is the tabletop guaranteed to be a rectangle?', right: 'no: a trapezoid can have right angles without being a rectangle; the parallelogram check is missing', wrong: [{ t: 'yes: one right angle is enough for a rectangle', mc: MC.dropsPara, say: 'Only for a parallelogram.' }, { t: 'yes: tabletops are rectangles', mc: MC.appearance, say: 'The check must prove it.' }] },
  { s: 'A crew lays out a patio: the diagonals are equal and cross at a right angle. Is the patio guaranteed to be a square?', right: 'no: the diagonals must also bisect each other; an isosceles trapezoid can have equal, perpendicular diagonals', wrong: [{ t: 'yes: equal and perpendicular diagonals make a square', mc: MC.necAsSuff, say: 'Without bisecting each other they do not even make a parallelogram.' }, { t: 'yes: a square is the only shape with perpendicular diagonals', mc: MC.uniqueDiag, say: 'Rhombuses and kites have them too.' }] },
];
export const practical: Gen = (R, n) => {
  const p = pick(R, PRACT);
  return choice(R, {
    id: `practical-${n}`, family: 'practical', prompt: `${ISO_DEF} ${p.s} (Treat the measures as exact.)`, board: '\\text{does the check guarantee it?}',
    solution: ['A check guarantees the shape only if it is a sufficient condition: first a parallelogram, then the special test.', `So: ${p.right}.`],
    picture: { card: { lines: [p.s.replace(/ Is the .*$/, '')] }, reveal: {} },
  }, [{ t: p.right, ok: true, say: 'Right.' }, ...p.wrong]);
};
export { kitePts, NAME };
void albl; void lbl;
export type { NumWrong };
