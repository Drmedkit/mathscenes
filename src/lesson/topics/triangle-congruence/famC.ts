// famC.ts: families for stage 3 of "Triangle congruence": criteria as if-then claims, counterexamples (AAA, SSA),
// the arc swing that gives two triangles, why HL works, critiquing and repairing arguments, and find-x with CPCTC.
import { type Gen, type Opt, choiceItem, fitted, numItem, pick, r, shuffle } from '../geometry-foundations/kit';
import { type Pt, at, dist } from '../geometry-foundations/geo';
import { type Part, type PMark, type Tri, PERMS, names2, relabeler, mapFig, tw, angN, angle, beside, buildFig, circleSegs, moveT, pairFig, pairHtml, permName, segN, side, sideName, triASA, triN, triSSS, triT, turnT } from './tri';
import { choice, choiceT, makePair, numT, rot3, scaleT } from './pairs';
import { MC } from './triProofs';

const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
const stmt = (n1: string, n2: string) => `${triN(n1)} ≅ ${triN(n2)}`;

// ---------- conditional-claim ----------
const CLAIMS: { name: string; words: string; hyp: string }[] = [
  { name: 'SSS', words: 'Two triangles are congruent when the three sides of one are congruent to the three sides of the other.', hyp: 'the three sides of one triangle are congruent to the three sides of the other' },
  { name: 'SAS', words: 'Two triangles are congruent when two sides and the included angle of one are congruent to two sides and the included angle of the other.', hyp: 'two sides and the included angle of one triangle are congruent to those of the other' },
  { name: 'ASA', words: 'Two triangles are congruent when two angles and the included side of one are congruent to two angles and the included side of the other.', hyp: 'two angles and the included side of one triangle are congruent to those of the other' },
  { name: 'AAA (proposed)', words: 'Two triangles are congruent when the three angles of one are congruent to the three angles of the other.', hyp: 'the three angles of one triangle are congruent to the three angles of the other' },
  { name: 'SSA (proposed)', words: 'Two triangles are congruent when two sides and a non-included angle of one are congruent to those of the other.', hyp: 'two sides and a non-included angle of one triangle are congruent to those of the other' },
];
export const critIfThen: Gen = (R, n) => {
  const c = pick(R, CLAIMS), askHyp = R() < 0.65, who = pick(R, NAMES);
  const conc = 'the two triangles are congruent';
  const opts: Opt[] = askHyp ? [
    { t: c.hyp, ok: true, say: 'Right: the “if” part is what must be known first.' },
    { t: conc, mc: MC.wrongClause, say: 'That is the conclusion: what the claim promises, not what it needs.' },
    { t: `${conc}, and ${c.hyp}`, mc: MC.conclHyp, say: 'The conclusion is not part of the hypothesis: the claim delivers it.' },
    { t: 'the triangles in one particular drawing have these parts', mc: MC.drawnCase, say: 'The claim is about every pair of triangles, not one drawing.' },
  ] : [
    { t: conc, ok: true, say: 'Right: the “then” part.' },
    { t: c.hyp, mc: MC.wrongClause, say: 'That is the hypothesis: what must be known first.' },
    { t: 'only the triangles in the drawing are congruent', mc: MC.drawnCase, say: 'The claim covers every pair that meets the hypothesis.' },
  ];
  return choice(R, {
    id: `critIfThen-${n}`, family: 'critIfThen',
    prompt: `${who} rewrites ${c.name} as an if-then claim: “${c.words}” What is the ${askHyp ? 'hypothesis (the if part)' : 'conclusion (the then part)'}?`, board: `\\text{${c.name.replace(/ \(proposed\)/, '')}: if }\\dots\\text{ then }\\dots`,
    solution: [`If ${c.hyp}, then ${conc}.`, askHyp ? `The hypothesis: ${c.hyp}.` : `The conclusion: ${conc}.`],
    picture: { card: { lines: [`${c.name}: ${c.words}`] } },
  }, opts);
};
export const claimAbout: Gen = (R, n) => {
  const c = pick(R, CLAIMS), who = pick(R, NAMES);
  return choice(R, {
    id: `claimAbout-${n}`, family: 'claimAbout',
    prompt: `${who} reads ${c.name}: “${c.words}” Which pairs of triangles is this claim about?`, board: `\\text{${c.name.replace(/ \(proposed\)/, '')}}`,
    solution: ['An if-then claim speaks about everything that meets its hypothesis.', 'So: every pair of triangles that meets the hypothesis, in any position or size.'],
    picture: { card: { lines: [`${c.name}: ${c.words}`] } },
  }, [
    { t: 'Every pair of triangles that meets the hypothesis', ok: true, say: 'Right: that is why one counterexample can sink a proposed criterion.' },
    { t: 'Only the pair in the drawing', mc: MC.drawnCase, say: 'The drawing is one example; the claim covers every pair.' },
    { t: 'Only pairs already known to be congruent', mc: MC.conclHyp, say: 'Congruence is what the claim concludes, not what it assumes.' },
    { t: 'Only pairs that face the same way on the page', mc: MC.flipped, say: 'Position and facing do not matter: turned and flipped pairs count.' },
  ]);
};

// ---------- counterexample-check ----------
/** SSA data with whole numbers: AB = c, BC = a, ∠A = 60°, AC = b1 or b2 (both triangles exist) */
export const SSA_SETS: [number, number, number, number][] = [[8, 7, 3, 5], [16, 14, 6, 10], [21, 19, 5, 16], [24, 21, 9, 15]];
const ssaTri = (c: number, b: number, k: number, deg = 60): Tri => [[0, 0], [c * k, 0], at([0, 0], deg, b * k)];
export const cxCheck: Gen = (R, n) => fitted('cxCheck', () => {
  const claim = R() < 0.5 ? 'AAA' : 'SSA';
  const kind = pick(R, ['cx', 'cx', 'breaks', 'cong'] as const);
  let T1: Tri, T2s: Tri, t1: { k: 's' | 'a'; i: number; text: string }[] = [], t2: { k: 's' | 'a'; i: number; text: string }[] = [];
  if (claim === 'AAA') {
    let A = r(R, 40, 70), B = r(R, 45, 75); if (B === A + 6) B++;   // A+6, B-6 must not be A, B swapped
    const C = 180 - A - B, s1 = pick(R, [4, 6]), s2 = s1 === 4 ? 6 : 9, k = 300 / s1;
    T1 = triASA(A, s1 * k, B);
    if (kind === 'cx') { T2s = triASA(A, s2 * k, B); }
    else if (kind === 'breaks') { T2s = triASA(A + 6, s2 * k, B - 6); }
    else { T2s = T1; }
    const s2v = kind === 'cong' ? s1 : s2, A2 = kind === 'breaks' ? A + 6 : A, B2 = kind === 'breaks' ? B - 6 : B;
    t1 = [{ k: 'a', i: 0, text: `${A}°` }, { k: 'a', i: 1, text: `${B}°` }, { k: 'a', i: 2, text: `${C}°` }, { k: 's', i: 2, text: String(s1) }];
    t2 = [{ k: 'a', i: 0, text: `${A2}°` }, { k: 'a', i: 1, text: `${B2}°` }, { k: 'a', i: 2, text: `${180 - A2 - B2}°` }, { k: 's', i: 2, text: String(s2v) }];
  } else {
    const [c, a, b1, b2] = pick(R, SSA_SETS), k = 300 / c;
    T1 = ssaTri(c, b1, k);
    if (kind === 'cx') T2s = ssaTri(c, b2, k);
    else if (kind === 'cong') T2s = T1;
    else {
      // the angle at A is 50° instead of 60° (BC and AB kept): the larger solution
      const al = (50 * Math.PI) / 180, t = c * Math.cos(al) + Math.sqrt(a * a - c * c * Math.sin(al) ** 2);
      T2s = [[0, 0], [c * k, 0], at([0, 0], 50, t * k)];
    }
    t1 = [{ k: 's', i: 2, text: String(c) }, { k: 's', i: 0, text: String(a) }, { k: 'a', i: 0, text: '60°' }, { k: 's', i: 1, text: String(b1) }];
    t2 = [{ k: 's', i: 2, text: String(c) }, { k: 's', i: 0, text: String(a) }, { k: 'a', i: 0, text: kind === 'breaks' ? '50°' : '60°' }, ...(kind === 'breaks' ? [] : [{ k: 's' as const, i: 1, text: String(kind === 'cx' ? b2 : b1) }])];
  }
  T1 = turnT(T1, r(R, -15, 15));
  const T2 = beside(T1, moveT(T2s, { rot: r(R, -20, 20) + (kind === 'cong' ? 180 : 0), flip: kind === 'cong' && R() < 0.5, off: [0, 0] }), 'row');
  const [n1, n2] = names2(R);
  const fig = pairFig(T1, T2, n1, n2, [], { texts: [...t1.map(x => ({ t: 0 as const, ...x })), ...t2.map(x => ({ t: 1 as const, ...x }))] });
  const claimT = claim === 'AAA' ? 'if the three angles of one triangle are congruent to the three angles of another, the triangles are congruent' : 'if two sides and a non-included angle of one triangle are congruent to those of another, the triangles are congruent';
  return choice(R, {
    id: `cxCheck-${n}`, family: 'cxCheck',
    prompt: `Claim (${claim}): ${claimT}. Do ${triN(n1)} and ${triN(n2)} refute the claim? Lengths are in inches.`, board: `\\text{${claim}: }${triT(n1)},\\ ${triT(n2)}`,
    solution: ['A counterexample must meet every condition of the claim and still fail the conclusion.', kind === 'cx' ? 'Every listed part matches, but a pair of corresponding sides differs: not congruent.' : kind === 'breaks' ? 'One of the conditions is not met, so the pair says nothing about the claim.' : 'The triangles are congruent (one is turned), so the conclusion holds here.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Yes: it meets every condition, and the triangles are not congruent', ok: kind === 'cx', mc: kind === 'breaks' ? MC.cxPremise : kind === 'cong' ? MC.flipped : undefined, say: kind === 'cx' ? 'Right: a real counterexample.' : kind === 'breaks' ? 'It does not meet every condition: one measure differs.' : 'These triangles are congruent: a turned or flipped copy is still congruent.' },
    { t: 'No: it breaks one of the conditions', ok: kind === 'breaks', say: kind === 'breaks' ? 'Right: a pair that breaks the hypothesis cannot refute the claim.' : 'Check each listed measure: they all match.' },
    { t: 'No: the triangles are congruent', ok: kind === 'cong', mc: kind === 'cx' ? (claim === 'AAA' ? MC.aaa : MC.ssa) : undefined, say: kind === 'cong' ? 'Right: here the conclusion holds.' : 'Compare a pair of corresponding sides.' },
  ], true);
});
export const cxWhich: Gen = (R, n) => {
  const claim = R() < 0.5 ? 'AAA' : 'SSA';
  let cards: { head: string; text: string; kind: 'cx' | 'breaks' | 'cong' }[];
  if (claim === 'AAA') {
    const A = r(R, 35, 60); let B = r(R, 50, 75); if (180 - A - B === B + 5) B++;   // B+5, C-5 must not be C, B swapped
    const C = 180 - A - B, s = r(R, 3, 6), m = pick(R, [2, 3]);
    cards = [
      { head: '', text: `△ABC: ${A}°, ${B}°, ${C}°, AB = ${s} in. △DEF: ${A}°, ${B}°, ${C}°, DE = ${s * m} in.`, kind: 'cx' },
      { head: '', text: `△ABC: ${A}°, ${B}°, ${C}°, AB = ${s} in. △DEF: ${A}°, ${B + 5}°, ${C - 5}°, DE = ${s * m} in.`, kind: 'breaks' },
      { head: '', text: `△ABC: ${A}°, ${B}°, ${C}°, AB = ${s} in. △DEF: ${A}°, ${B}°, ${C}°, DE = ${s} in.`, kind: 'cong' },
    ];
  } else {
    const [c, a, b1, b2] = pick(R, SSA_SETS);
    cards = [
      { head: '', text: `AB = DE = ${c} in, BC = EF = ${a} in, ∠A = ∠D = 60°, AC = ${b1} in, DF = ${b2} in.`, kind: 'cx' },
      { head: '', text: `AB = DE = ${c} in, BC = ${a} in, EF = ${a + 2} in, ∠A = ∠D = 60°.`, kind: 'breaks' },
      { head: '', text: `AB = DE = ${c} in, BC = EF = ${a} in, ∠A = ∠D = 60°, AC = DF = ${b2} in.`, kind: 'cong' },
    ];
  }
  const t = relabeler(R, 'ABCDEF');
  cards = shuffle(R, cards).map((c, i) => ({ ...c, text: tw(c.text, t), head: `Pair ${'ABC'[i]}` }));
  const ci = cards.findIndex(c => c.kind === 'cx');
  return choice(R, {
    id: `cxWhich-${n}`, family: 'cxWhich',
    prompt: `Claim (${claim}): ${claim === 'AAA' ? 'three congruent angle pairs make two triangles congruent' : 'two congruent side pairs and a congruent non-included angle pair make two triangles congruent'}. Which pair is a counterexample?`, board: `\\text{${claim}: }${triT(t('ABC'))},\\ ${triT(t('DEF'))}`,
    solution: ['A counterexample meets every condition and fails the conclusion.', `${cards[ci]!.head}: ${cards[ci]!.text}`, `So: ${cards[ci]!.head}.`],
    picture: { cards: cards.map(c => ({ head: c.head, text: c.text })) },
  }, cards.map(c => ({ t: c.head, ok: c.kind === 'cx', mc: c.kind === 'breaks' ? MC.cxPremise : c.kind === 'cong' ? undefined : undefined, say: c.kind === 'cx' ? 'Right: every condition holds, and a pair of corresponding sides differs.' : c.kind === 'breaks' ? 'That pair breaks one of the conditions.' : 'That pair is congruent (by SAS or ASA), so the claim holds there.' })), true);
};

// ---------- aaa-counterexample ----------
const SCALENE = [[3, 5, 6], [4, 6, 7], [5, 7, 8], [4, 5, 7], [3, 4, 6]];
export const aaaBuild: Gen = (R, n) => fitted('aaaBuild', () => {
  const s = pick(R, SCALENE), k = 46;
  const T = turnT(triSSS(s[0]! * k, s[1]! * k, s[2]! * k), r(R, -20, 20));
  const t = relabeler(R, 'ABC');
  const fig = buildFig({ pts: { A: T[0], B: T[1], C: T[2] }, segs: ['BC', 'AC', 'AB'], marks: [{ seg: 'BC', text: String(s[0]), lone: true }, { seg: 'AC', text: String(s[1]), lone: true }, { seg: 'AB', text: String(s[2]), lone: true }], fills: [{ pts: 'ABC' }] });
  return choiceT(R, t, {
    id: `aaaBuild-${n}`, family: 'aaaBuild',
    prompt: `${triN('ABC')} has sides ${s.join(', ')} in. Which new triangle shows that AAA is not a congruence criterion?`, board: '\\text{AAA: same angles, not congruent}',
    solution: ['The new triangle must have the same three angles (meet the hypothesis) but not be congruent.', 'Scaling every side by the same factor keeps the angles and changes the size.', 'So: double every side.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Double every side', ok: true, say: 'Right: same angles, different size.' },
    { t: 'Add 2 in to every side', say: `Adding the same amount changes the angles: ${s[0]! + 2}, ${s[1]! + 2}, ${s[2]! + 2} is not a scaled copy.` },
    { t: 'Turn it a quarter turn', mc: MC.flipped, say: 'A turned copy is congruent: it does not refute anything.' },
    { t: 'Keep two sides and change the angle between them', mc: MC.cxPremise, say: 'That changes the angles, so it no longer meets the hypothesis of AAA.' },
  ]);
});
export const aaaSize: Gen = (R, n) => fitted('aaaSize', () => {
  const A = r(R, 40, 70), B = r(R, 45, 75), f = pick(R, [1.5, 2, 2.5]), ab = pick(R, [4, 6, 8]);
  const k = 300 / ab, T1 = triASA(A, ab * k, B), T2s = scaleT(T1, f);
  const T2 = beside(T1, moveT(T2s, { rot: r(R, -25, 25), flip: R() < 0.4, off: [0, 0] }), 'row');
  const [n1, n2] = names2(R);
  const fig = pairFig(T1, T2, 'ABC', 'DEF', [], { texts: [
    { t: 0, k: 'a', i: 0, text: `${A}°` }, { t: 0, k: 'a', i: 1, text: `${B}°` }, { t: 0, k: 's', i: 2, text: String(ab) },
    { t: 1, k: 'a', i: 0, text: `${A}°` }, { t: 1, k: 'a', i: 1, text: `${B}°` }, { t: 1, k: 's', i: 2, text: '?' },
  ] });
  const ans = ab * f;
  return numT((x: string) => x.replace(/[A-F]/g, ch => (n1 + n2)['ABCDEF'.indexOf(ch)]!), {
    id: `aaaSize-${n}`, family: 'aaaSize',
    prompt: `${triN('DEF')} has the same three angles as ${triN('ABC')} and is ${f} times as large. AB = ${ab} in. How long is ${segN('DE')}?`, board: `DE = ${f} \\cdot ${ab} = \\,?`, unit: 'in',
    solution: [`Every side of ${triN('DEF')} is ${f} times the matching side of ${triN('ABC')}.`, `DE = ${f} · ${ab} = <b class="s">${ans}</b> in: same angles, a different size, so AAA does not give congruence.`],
    picture: { fig, reveal: {} },
  }, ans, [{ v: ab, mc: MC.aaa, say: 'Equal angles do not make equal sides: the copy is scaled.' }, { v: ab + f, say: 'Scaling multiplies; it does not add.' }], 'Right: same angles, different size.', `Multiply AB by ${f}.`);
});

// ---------- ssa-verify ----------
function ssaShared(R: () => number) {
  const [c, a, b1, b2] = pick(R, SSA_SETS), k = 460 / c;
  const A: Pt = [0, 0], B: Pt = [c * k, 0], C = at(A, 60, b1 * k), D = at(A, 60, b2 * k);
  const fig = buildFig({ pts: { A, B, C, D }, segs: ['AB', 'AC', 'CD', 'BC', 'BD'], marks: [{ seg: 'AB', text: String(c) }, { seg: 'BC', n: 1 }, { seg: 'BD', n: 1 }, { seg: 'AC', text: String(b1) }, { ang: 'BAC', text: '60°', lone: true, r: 70 }], fills: [{ pts: 'ABC', alpha: 0.5 }, { pts: 'ABD', alpha: 0.5 }] });
  return { c, a, b1, b2, fig };
}
export const ssaVerify: Gen = (R, n) => fitted('ssaVerify', () => {
  const S = ssaShared(R), t = relabeler(R, 'ABCD');
  return choiceT(R, t, {
    id: `ssaVerify-${n}`, family: 'ssaVerify',
    prompt: `C and D lie on the same ray from A. AB = ${S.c} in, BC = BD = ${S.a} in, m∠A = 60°, AC = ${S.b1} in and AD = ${S.b2} in. What do ${triN('ABC')} and ${triN('ABD')} show?`, board: `AC = ${S.b1},\\ AD = ${S.b2}`,
    solution: [`Both have AB = ${S.c}, a ${S.a}-inch side opposite ∠A (BC and BD), and the same 60° angle at A.`, `But AC = ${S.b1} and AD = ${S.b2}: the third sides differ, so they are not congruent.`, 'So the same SSA parts fit two different triangles: SSA is not a criterion.'],
    picture: { fig: S.fig, reveal: {} },
  }, [
    { t: 'Same SSA parts, different third sides: not congruent, so SSA fails', ok: true, say: 'Right: a verified counterexample.' },
    { t: 'They are congruent: two sides and an angle match', mc: MC.ssa, say: `The third sides are ${S.b1} and ${S.b2} in: they cannot be congruent.` },
    { t: 'No counterexample: one triangle is just a flipped copy of the other', mc: MC.flipped, say: 'A flipped copy would have the same third side.' },
    { t: 'No counterexample: the angles at A are different', mc: MC.cxPremise, say: 'Both triangles use the same angle at A: C and D are on the same ray.' },
  ]);
});
export const ssaWhich: Gen = (R, n) => fitted('ssaWhich', () => {
  const S = ssaShared(R), t = relabeler(R, 'ABCD');
  return choiceT(R, t, {
    id: `ssaWhich-${n}`, family: 'ssaWhich',
    prompt: `C and D lie on the same ray from A, and AD = ${S.b2} in. Which pair of parts of ${triN('ABC')} and ${triN('ABD')} is NOT congruent?`, board: `\\triangle ABC,\\ \\triangle ABD`,
    solution: [`AB is shared, BC = BD = ${S.a}, and ∠A is the same angle.`, `AC = ${S.b1} but AD = ${S.b2}.`, `So: ${segN('AC')} and ${segN('AD')}.`],
    picture: { fig: S.fig, reveal: {} },
  }, [
    { t: `${segN('AC')} and ${segN('AD')}`, ok: true, say: 'Right: the third sides differ.' },
    { t: `${segN('BC')} and ${segN('BD')}`, mc: MC.cxPremise, say: `The tick marks and the labels give BC = BD = ${S.a}.` },
    { t: '∠BAC and ∠BAD', mc: MC.cxPremise, say: 'C and D are on the same ray from A: it is one angle.' },
    { t: `${segN('AB')} in each`, mc: MC.cxPremise, say: 'AB is shared by both triangles.' },
  ]);
});

// ---------- ssa-construct ----------
function swing(R: () => number, a: number, c: number, withCircle: boolean) {
  const k = 34, A: Pt = [0, 0], B: Pt = [c * k, 0], u = 30;
  const t2 = c * Math.cos((u * Math.PI) / 180) + Math.sqrt(Math.max(0, a * a - (c * c) / 4));
  const len = Math.max(c * 1.25, t2 + 2.5) * k;
  const H = at(A, u, c * Math.cos((u * Math.PI) / 180) * k);
  const pts: Record<string, Pt> = { A, B, h: H, x: at(A, u, len) };
  const extra = withCircle ? circleSegs('arc', B, a * k, { col: 'second' }) : [];
  const fig = buildFig({ pts, segs: ['AB', 'Ax', 'Bh'], bare: ['h', 'x'], marks: [{ seg: 'AB', text: String(c) }, { seg: 'Bh', text: String(c / 2), lone: true }, { ang: 'BAx', text: '30°', lone: true, r: 110 }, { ang: 'AhB', box: true }], segStyle: { Ax: { kind: 'ray' }, Bh: { dash: true, col: 'faint' } }, extra, dirs: { A: 200, B: 330 } });
  return fig;
}
const SWING: { c: number; two: number[]; zero: number[]; one: number[] }[] = [
  { c: 10, two: [6, 7, 8, 9], zero: [3, 4], one: [11, 12] },
  { c: 12, two: [7, 8, 9, 10, 11], zero: [4, 5], one: [13, 14] },
  { c: 8, two: [5, 6, 7], zero: [2, 3], one: [9, 10] },
  { c: 14, two: [8, 9, 10, 11, 12, 13], zero: [4, 5, 6], one: [15, 16] },
];
export const ssaSwing: Gen = (R, n) => fitted('ssaSwing', () => {
  const S = pick(R, SWING), kind = pick(R, ['two', 'two', 'zero', 'one'] as const);
  const a = pick(R, S[kind]);
  const ans = kind === 'two' ? 2 : kind === 'one' ? 1 : 0;
  const fig = swing(R, a, S.c, true), t = relabeler(R, 'ABC');
  return numT(t, {
    id: `swing-${n}`, family: 'ssaSwing',
    prompt: `m∠A = 30° and AB = ${S.c} in. The side opposite ∠A must be ${a} in, so C lies on the circle of radius ${a} in about B, and on the ray from A. The dashed distance from B to the ray is ${S.c / 2} in. How many different triangles ABC fit?`,
    board: `AB = ${S.c},\\ BC = ${a},\\ m\\angle A = 30^\\circ`, unit: 'triangles',
    solution: [`Compare BC = ${a} with the distance ${S.c / 2} and with AB = ${S.c}.`, ans === 2 ? `${S.c / 2} < ${a} < ${S.c}: the circle crosses the ray twice, so two triangles.` : ans === 1 ? `${a} > ${S.c}: the circle meets the line twice, but one point is behind A, off the ray. One triangle.` : `${a} < ${S.c / 2}: the circle does not reach the ray. No triangle.`],
    picture: { fig, reveal: {} },
  }, ans, ans === 1 ? [{ v: 2, mc: MC.sketch, say: 'One of the two crossings is behind A: it is not on the ray.' }] : ans === 2 ? [{ v: 1, mc: MC.ssa, say: 'The circle crosses the ray twice: two triangles with the same SSA parts.' }] : [{ v: 1, say: 'The circle stays short of the ray.' }], 'Right.', 'Count where the circle meets the ray (not the line behind A).');
});
export const ssaArc: Gen = (R, n) => fitted('ssaArc', () => {
  const S = pick(R, SWING);
  const good = pick(R, S.two), fig = swing(R, good, S.c, false), t = relabeler(R, 'ABC');
  return choiceT(R, t, {
    id: `ssaArc-${n}`, family: 'ssaArc',
    prompt: `m∠A = 30°, AB = ${S.c} in, and the dashed distance from B to the ray is ${S.c / 2} in. Which length for ${segN('BC')} gives two different triangles ABC?`, board: `AB = ${S.c},\\ m\\angle A = 30^\\circ`,
    solution: ['Swing BC as an arc about B: it must reach the ray (longer than the distance) but not pass A (shorter than AB).', `So BC must be between ${S.c / 2} and ${S.c}.`, `So: ${good} in.`],
    picture: { fig, reveal: {} },
  }, [
    { t: `${good} in`, ok: true, say: 'Right: the arc crosses the ray twice.' },
    { t: `${S.zero[S.zero.length - 1]} in`, say: 'Shorter than the distance to the ray: the arc never reaches it.' },
    { t: `${S.c / 2} in`, mc: MC.sketch, say: 'Exactly the distance: the arc only touches the ray, one right triangle.' },
    { t: `${S.one[0]} in`, mc: MC.sketch, say: 'Longer than AB: the second crossing is behind A, off the ray. One triangle.' },
  ]);
});

// ---------- ssa-scope-hl ----------
const SCOPE = [
  { text: (w: string) => `${w} tried AB = 6 in, BC = 9 in and m∠A = 50°, and got only one triangle. ${w} says: “So SSA is a congruence criterion.”`, right: 'Wrong: one set of data that works does not make SSA work for every triangle', wrong: [{ t: 'Right: it worked, so SSA is a criterion', mc: MC.examples }, { t: 'Right: two sides and an angle always fix a triangle', mc: MC.ssa }] },
  { text: (w: string) => `In ${w}’s SSA drawing the angle at C came out at 90°, so ${w} used HL.`, right: 'Not allowed: HL needs the right angles to be given, not to appear in one drawing', wrong: [{ t: 'Allowed: the drawing shows a right angle', mc: MC.rightSpecial }, { t: 'Allowed: any SSA becomes HL', mc: MC.ssa }] },
  { text: (w: string) => `${w} says: “HL is just SSA with a right angle, and SSA fails, so HL fails too.”`, right: 'Wrong: with a right angle the arc meets the line of the other leg at two mirror points, and only one is on the ray', wrong: [{ t: 'Right: SSA never fixes a triangle', mc: MC.validSSA }, { t: 'Right: HL only works when the triangles face the same way', mc: MC.flipped }] },
];
export const scopeJudge: Gen = (R, n) => {
  const s = pick(R, SCOPE), w = pick(R, NAMES);
  return choice(R, {
    id: `scopeJudge-${n}`, family: 'scopeJudge', prompt: `${s.text(w)} Is that right?`, board: '\\text{SSA or HL?}',
    solution: ['SSA fails as a criterion because some SSA data give two triangles.', 'With a given right angle, the second point is a mirror image off the ray: HL fixes the triangle.'],
    picture: { card: { lines: [s.text(w)] } },
  }, [{ t: s.right, ok: true, say: 'Right.' }, ...s.wrong.map(x => ({ t: x.t, mc: x.mc, say: x.mc === MC.rightSpecial ? 'A right angle that happens in one drawing is not a given.' : x.mc === MC.examples ? 'One example never covers every triangle.' : x.mc === MC.validSSA ? 'With a right angle the arc meets the ray only once: HL works.' : 'Look at what the claim needs for every triangle.' }))]);
};
export const hlSwing: Gen = (R, n) => fitted('hlSwing', () => {
  const [l1, l2, h] = pick(R, [[6, 8, 10], [8, 6, 10], [5, 12, 13], [9, 12, 15], [12, 9, 15]] as [number, number, number][]);
  const k = 300 / Math.max(l1, l2) * 0.9;
  const C: Pt = [0, 0], B: Pt = [0, l1 * k], P: Pt = [l2 * k, 0], Q: Pt = [-l2 * k, 0];
  const t = relabeler(R, 'BCPQ');
  const fig = buildFig({ pts: { C, B, P, Q, x: [l2 * k * 1.35, 0] }, segs: ['CB', 'Cx', 'CQ', 'BP', 'BQ'], bare: ['x'], marks: [{ ang: 'BCx', box: true }, { seg: 'CB', text: String(l1) }, { seg: 'BP', text: String(h), lone: true }],
    segStyle: { Cx: { kind: 'ray' }, CQ: { dash: true, col: 'faint' }, BQ: { dash: true, col: 'faint' } }, extra: circleSegs('arc', B, h * k, { col: 'second', d0: 200, d1: 340 }), dirs: { C: 300, B: 90, P: 300, Q: 240 } });
  return choiceT(R, t, {
    id: `hlSwing-${n}`, family: 'hlSwing',
    prompt: `HL data: a right angle at C, leg CB = ${l1} in, hypotenuse ${h} in. The hypotenuse swings about B and meets the line of the other leg at P and Q. How many triangles fit?`, board: `CB = ${l1},\\ \\text{hypotenuse } ${h}`,
    solution: ['P and Q are mirror images across line CB (the circle is symmetric about it).', 'The other leg is a ray from C: only P lies on it.', 'So: one triangle, and HL fixes it.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'One: P and Q are mirror images across CB, and only P is on the ray', ok: true, say: 'Right: that is why HL is a criterion.' },
    { t: 'Two: the arc meets the line twice', mc: MC.ssa, say: 'Q is on the other side of C, off the ray of the leg: and △CBQ is just the mirror copy.' },
    { t: 'None: SSA never fixes a triangle', mc: MC.validSSA, say: 'With a right angle the arc meets the ray exactly once.' },
  ]);
});

// ---------- critique-repair ----------
export const critique: Gen = (R, n) => {
  const v = pick(R, ['ssa', 'aaa', 'aas', 'exception'] as const), w = pick(R, NAMES);
  const text = {
    ssa: `${w}: “∠A ≅ ∠D, ${segN('AB')} ≅ ${segN('DE')} and ${segN('BC')} ≅ ${segN('EF')}, so ${stmt('ABC', 'DEF')}.” (No angle is marked right.)`,
    aaa: `${w}: “∠A ≅ ∠D, ∠B ≅ ∠E and ∠C ≅ ∠F, so ${stmt('ABC', 'DEF')}.”`,
    aas: `${w}: “∠A ≅ ∠D and ∠B ≅ ∠E, and ${segN('BC')} ≅ ${segN('EF')}. That proves nothing, because the side is not between the angles.”`,
    exception: `${w} checked an SSA counterexample: two different triangles with the same SSA parts. ${w} says: “It is just an exception; SSA works most of the time, so it is still a criterion.”`,
  }[v];
  const opts: Opt[] = v === 'ssa' ? [
    { t: 'Invalid (SSA); it becomes valid if ∠A and ∠D are right angles (HL)', ok: true, say: 'Right: BC would then be the hypotenuse and AB a leg.' },
    { t: 'Valid: three congruent pairs always prove congruence', mc: MC.ssa, say: 'The angle is not between the two sides: SSA can give two triangles.' },
    { t: 'Invalid, and no extra condition can ever fix two sides and a non-included angle', mc: MC.validSSA, say: 'A right angle at A (HL) does fix it.' },
    { t: 'Invalid; it becomes valid if the triangles face the same way', mc: MC.flipped, say: 'Facing has nothing to do with it.' },
  ] : v === 'aaa' ? [
    { t: `Invalid (AAA); it becomes valid with one pair of corresponding sides, such as ${segN('AB')} ≅ ${segN('DE')}`, ok: true, say: 'Right: with that side it is ASA.' },
    { t: 'Valid: three congruent pairs always prove congruence', mc: MC.aaa, say: 'Angles fix the shape, not the size.' },
    { t: 'Invalid; it becomes valid if the triangles are drawn the same size', mc: MC.appearance, say: 'Looking the same size is not a given: it needs a congruent side pair.' },
  ] : v === 'aas' ? [
    { t: `${w} is wrong: AAS is valid, since the third angles match and it becomes ASA`, ok: true, say: 'Right.' },
    { t: `${w} is right: the side must be between the angles`, mc: MC.misAAS, say: 'AAS works: the third angles are congruent too, giving ASA.' },
    { t: `${w} is right: only SSS and SAS are criteria`, say: 'ASA and AAS are criteria too.' },
  ] : [
    { t: `${w} is wrong: one checked counterexample is enough to show SSA is not a criterion`, ok: true, say: 'Right: a criterion must work for every pair.' },
    { t: `${w} is right: one exception does not matter`, mc: MC.cxException, say: 'A criterion claims every pair; one failure refutes it.' },
    { t: `${w} is right, as long as the two triangles face the same way`, mc: MC.flipped, say: 'Facing does not matter.' },
  ];
  return choice(R, {
    id: `critique-${n}`, family: 'critique', prompt: `${text} Judge the argument.`, board: '\\text{valid?}',
    solution: v === 'ssa' ? ['The angle ∠A is not between AB and BC: the pattern is SSA, not a criterion.', 'With ∠A and ∠D right, BC and EF are hypotenuses and AB, DE legs: HL.'] : v === 'aaa' ? ['Three angle pairs fix the shape only (AAA).', 'Add one corresponding side pair: ASA (or AAS) works.'] : v === 'aas' ? ['Two angle pairs force the third pair too.', 'Then BC is between ∠B and ∠C: ASA. So AAS is valid.'] : ['A criterion is a claim about every pair of triangles with the parts.', 'One verified counterexample refutes it.'],
    picture: { card: { lines: [text] } },
  }, opts);
};
export const repairPick: Gen = (R, n) => fitted('repairPick', () => {
  const ssa = R() < 0.55;
  const nm = names2(R), P = makePair(R, ssa ? 'SSA' : 'AAA', 'row', { names: nm, scramble: false, copy: true });
  const [n1, n2] = nm;
  const angs = P.parts.filter(p => p.k === 'a').map(p => p.i);
  let opts: Opt[];
  if (ssa) {
    const k = angs[0]!, sides = P.parts.filter(p => p.k === 's').map(p => p.i);
    const inc = [0, 1, 2].find(i => !sides.includes(i))!;   // the vertex between the two sides
    opts = [
      { t: pairHtml(n1, n2, { k: 'a', i: inc }), ok: true, say: `Right: ∠${n1[inc]} is between the two sides: SAS.` },
      { t: `${segN(sideName(n1, sides.find(s => s !== k)!))} is longer than ${segN(sideName(n1, k))}`, mc: MC.ssa, say: 'That is exactly the case where the arc can meet the ray twice.' },
      { t: 'The triangles face the same way', mc: MC.flipped, say: 'Facing changes nothing.' },
    ];
  } else {
    const s = Math.floor(R() * 3);
    opts = [
      { t: pairHtml(n1, n2, { k: 's', i: s }), ok: true, say: 'Right: one corresponding side pair turns AAA into ASA or AAS.' },
      { t: `m∠${n1[0]} = m∠${n2[0]} = ${Math.round(angle(P.T1, 0))}°`, mc: MC.aaa, say: 'Another angle fact still fixes only the shape.' },
      { t: 'The triangles look the same size', mc: MC.appearance, say: 'Looks are not a given.' },
    ];
  }
  return choice(R, {
    id: `repairPick-${n}`, family: 'repairPick', prompt: `These marks do not prove ${stmt(n1, n2)}. Which extra given would make the argument valid?`, board: `${triT(n1)} \\cong ${triT(n2)}\\ ?`,
    solution: ssa ? ['The marks are SSA: the angle is not between the sides.', 'A congruent pair of included angles makes it SAS.'] : ['The marks are AAA: shape only.', 'A pair of corresponding sides makes it ASA or AAS.'],
    picture: { fig: P.fig, reveal: {} },
  }, opts);
});

// ---------- cpctc-solve ----------
function linExpr(a: number, b: number): string { return `${a === 1 ? '' : a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`; }
function solveSetup(R: () => number) {
  const asAngle = R() < 0.45;
  const [L1, L2] = names2(R);
  const n2 = permName(L2, pick(R, PERMS.slice(1)));
  const x = r(R, 3, 12);
  let T1: Tri, vals: number[];
  if (asAngle) {
    const A = r(R, 44, 80), B = r(R, 42, 76);
    if (180 - A - B < 38) return null;
    T1 = triASA(A, 330, B); vals = [A, B, 180 - A - B];
  } else {
    const s = shuffle(R, pick(R, [[11, 15, 19], [13, 17, 22], [10, 14, 17], [12, 16, 21], [14, 18, 25], [9, 13, 16]]).slice());
    T1 = triSSS(s[0]! * 21, s[1]! * 21, s[2]! * 21); vals = s;
  }
  T1 = turnT(T1, r(R, -25, 25));
  const T2 = beside(T1, moveT(T1, { rot: r(R, 0, 359), flip: R() < 0.5, off: [0, 0] }), 'row');
  const i = r(R, 0, 2), j = (i + r(R, 1, 2)) % 3;
  // an expression for part i that equals vals[i] at x (one or two steps)
  const a = pick(R, [1, 2, 3, 4]), b = vals[i]! - a * x;
  if (b === 0 || Math.abs(b) > 60) return null;
  return { asAngle, L1, n2, x, T1, T2, i, j, a, b, vals };
}
export const solveX: Gen = (R, n) => fitted('solveX', () => {
  let S = solveSetup(R); for (let t = 0; !S && t < 40; t++) S = solveSetup(R);
  if (!S) throw new Error('solveX');
  const k = S.asAngle ? 'a' : 's', unitT = S.asAngle ? '°' : '';
  const e = linExpr(S.a, S.b);
  const lab = S.asAngle ? `(${e})°` : e;
  const fig = pairFig(S.T1, S.T2, S.L1, S.n2, [], { texts: [{ t: 0, k, i: S.i, text: lab }, { t: 1, k, i: S.i, text: `${S.vals[S.i]}${unitT}` }, { t: 1, k, i: S.j, text: `${S.vals[S.j]}${unitT}` }] });
  const part1 = S.asAngle ? `m∠${S.L1[S.i]}` : sideName(S.L1, S.i), part2 = S.asAngle ? `m∠${S.n2[S.i]}` : sideName(S.n2, S.i);
  const wrongX = (S.vals[S.j]! - S.b) / S.a;
  return numItem({
    id: `solveX-${n}`, family: 'solveX',
    prompt: `${stmt(S.L1, S.n2)}. ${part1} = ${lab}${S.asAngle ? '' : ' cm'} and ${part2} = ${S.vals[S.i]}${S.asAngle ? '°' : ' cm'}. Find x.`, board: `${S.a === 1 ? '' : S.a}x ${S.b < 0 ? '-' : '+'} ${Math.abs(S.b)} = ${S.vals[S.i]}`,
    solution: [`${part1} and ${part2} correspond (same places in the statement), so by CPCTC they are equal.`, `${e} = ${S.vals[S.i]}, so ${S.a === 1 ? 'x' : `${S.a}x`} = ${S.vals[S.i]! - S.b}${S.a === 1 ? '' : `, x = ${S.vals[S.i]! - S.b} ÷ ${S.a}`}.`, `x = <b class="s">${S.x}</b>.`],
    picture: { fig, reveal: {} },
  }, S.x, [{ v: S.vals[S.i]!, say: `That is the measure; the question asks for x.` }, ...(Number.isInteger(wrongX) && wrongX !== S.x ? [{ v: wrongX, mc: MC.byPosition, say: `${part1} matches ${part2}, not the part that only sits in a similar place on the page.` }] : [])], 'Right.', 'Set the expression equal to the corresponding measure, then solve.');
});
export const solvePart: Gen = (R, n) => fitted('solvePart', () => {
  let S = solveSetup(R), c = 0, d = 0;
  for (let t = 0; t < 60; t++) {
    if (S) { c = pick(R, [1, 2, 3].filter(z => z !== S!.a)); d = S.vals[S.j]! - c * S.x; if (d !== 0 && Math.abs(d) <= 60) break; }
    S = solveSetup(R);
  }
  if (!S || d === 0) throw new Error('solvePart');
  const k = S.asAngle ? 'a' : 's', u = S.asAngle ? '°' : '';
  const e = linExpr(S.a, S.b), lab = S.asAngle ? `(${e})°` : e;
  // a second expression on part j of the first triangle, asked for
  const e2 = linExpr(c, d), lab2 = S.asAngle ? `(${e2})°` : e2;
  const fig = pairFig(S.T1, S.T2, S.L1, S.n2, [], { texts: [{ t: 0, k, i: S.i, text: lab }, { t: 0, k, i: S.j, text: lab2 }, { t: 1, k, i: S.i, text: `${S.vals[S.i]}${u}` }] });
  const p1 = S.asAngle ? `m∠${S.L1[S.i]}` : sideName(S.L1, S.i), p2 = S.asAngle ? `m∠${S.n2[S.i]}` : sideName(S.n2, S.i), pj = S.asAngle ? `m∠${S.L1[S.j]}` : sideName(S.L1, S.j);
  const ans = S.vals[S.j]!;
  return numItem({
    id: `solvePart-${n}`, family: 'solvePart',
    prompt: `${stmt(S.L1, S.n2)}. ${p1} = ${lab}, ${pj} = ${lab2} and ${p2} = ${S.vals[S.i]}${S.asAngle ? '°' : ' cm'}. Find ${pj}.`, board: `${pj.replace('m∠', 'm\\angle ')} = ${c === 1 ? '' : c}x ${d < 0 ? '-' : '+'} ${Math.abs(d)}`, unit: S.asAngle ? '°' : 'cm',
    solution: [`By CPCTC ${p1} = ${p2}: ${e} = ${S.vals[S.i]}, so x = ${S.x}.`, `${pj} = ${c === 1 ? '' : `${c} · `}${S.x} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = <b class="s">${ans}</b>${u}.`],
    picture: { fig, reveal: {} },
  }, ans, [{ v: S.x, mc: MC.reportsX, say: `That is x. Put it into ${pj} = ${e2}.` }, ...(S.vals[S.i] !== ans ? [{ v: S.vals[S.i]!, mc: MC.ignoreCorr, say: `${S.vals[S.i]} belongs to ${p2}, which matches ${p1}, not ${pj}.` }] : [])], 'Right: x first, then the part.', `Solve for x with the corresponding pair, then evaluate ${pj}.`);
});

export { dist, side, rot3, type Part, type PMark, angN };
