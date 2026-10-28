// famC.ts: stage 3 of "Isosceles triangles and side-angle order": the general proofs (the angle sum with a parallel
// through a vertex, the isosceles theorem by comparing △ABC with △ACB (SAS), its converse on its own (ASA), the
// exterior-angle-set sum, the triangle inequality with its collinear boundary case) and their use on numeric,
// algebraic and real-world problems. Proof items show the course's proof frame with the asked cell as '?'.
import { type Opt, choiceItem, numItem, pick, r, shuffle } from '../geometry-foundations/kit';
import type { ProofPic } from '../geometry-foundations/kit';
import { type Tri, pickLetters, sideName } from '../triangle-congruence/tri';
import { MC, NAMES, type Gen, angN, fitted, pairItem, segN, tri } from './tkit';
import { lin } from './famB';
import { ang3, extAt, extFig, extensionFig, extensionTri, fmt, isoTri, r2, rotTo, sumFig, thirdRange, triASA, triFig, triSSS, turnT } from './ineq';

export const RS = {
  given: 'Given',
  parPost: 'Parallel Postulate',
  altInt: 'Alternate Interior Angles Theorem',
  corr: 'Corresponding Angles Postulate',
  vert: 'Vertical Angles Theorem',
  angAdd: 'Angle Addition Postulate',
  segAdd: 'Segment Addition Postulate',
  subst: 'Substitution Property of Equality',
  sym: 'Symmetric Property of Congruence',
  refl: 'Reflexive Property of Congruence',
  SAS: 'SAS', ASA: 'ASA', SSA: 'SSA', SSS: 'SSS',
  cpctc: 'CPCTC',
  iso: 'Isosceles Triangle Theorem',
  angSum: 'Triangle Angle-Sum Theorem',
  ineq: 'Triangle Inequality Theorem',
  order: 'Larger angle faces longer side',
  constr: 'Construction',
} as const;
const CONCL = 'mc.geometric-proof.conclusion-added-to-hypotheses';

interface Row { st: string; rs: string }
/** a proof picture with row i's reason (or statement) waiting as '?' */
function proofPic(given: string[], prove: string, rows: Row[], i: number, cell: 'rs' | 'st' = 'rs'): ProofPic {
  return { given, prove, rows: rows.map((x, j) => (j === i ? { st: cell === 'st' ? '' : x.st, rs: cell === 'rs' ? '' : x.rs } : x)), ask: [{ i, cell }] };
}
/** a scalene triangle for the general proofs: no measures, angles 40-95 */
function anyTri(R: () => number): Tri {
  for (;;) { const A = r(R, 40, 85), B = r(R, 40, 85), C = 180 - A - B; if (C >= 35 && C <= 95 && Math.abs(A - B) > 6 && Math.abs(B - C) > 6 && Math.abs(A - C) > 6) return triASA(A, 330, B); }
}

// =============== s3-angle-sum-proof ===============
function sumProof(L: string) {
  const [A, B, C] = [...L] as [string, string, string];
  const rows: Row[] = [
    { st: `\\ell \\parallel \\overline{${A}${C}}`, rs: RS.parPost },
    { st: `m\\angle 1 = m\\angle ${A}`, rs: RS.altInt },
    { st: `m\\angle 3 = m\\angle ${C}`, rs: RS.altInt },
    { st: 'm\\angle 1 + m\\angle 2 + m\\angle 3 = 180^\\circ', rs: RS.angAdd },
    { st: `m\\angle ${A} + m\\angle 2 + m\\angle ${C} = 180^\\circ`, rs: RS.subst },
  ];
  return { rows, given: [`\\triangle ${A}${B}${C}`], prove: `m\\angle ${A} + m\\angle 2 + m\\angle ${C} = 180^\\circ` };
}
/** the triangle with apex B (index 1) above the horizontal AC */
function sumTri(R: () => number): Tri {
  for (;;) { const A = r(R, 42, 78), C = r(R, 42, 78); if (Math.abs(A - C) > 6 && A + C < 140) return triASA(A, 380, C).map((p, i, T) => T[[0, 2, 1][i]!]!) as Tri; }
}
export const sumReason: Gen = (R, n) => fitted('sumReason', () => {
  const L = pickLetters(R, 3), T = sumTri(R);
  const fig = sumFig(T, L);
  const P = sumProof(L), i = pick(R, [0, 1, 2, 3, 4]);
  const row = P.rows[i]!;
  const opts: Opt[] = i === 0 ? [
    { t: RS.parPost, ok: true, say: 'Right: through a point off a line there is exactly one parallel, so ℓ exists.' },
    { t: RS.given, say: 'Nothing gives ℓ: the proof draws it, and the Parallel Postulate says it exists.' },
    { t: RS.corr, mc: MC.wrongPairName, say: 'No angles are compared in this line: it only draws ℓ.' },
    { t: RS.angSum, mc: MC.circular, say: 'That is the theorem being proved: it cannot be a reason inside its own proof.' },
  ] : i <= 2 ? [
    { t: RS.altInt, ok: true, say: 'Right: the two angles sit on opposite sides of the transversal, between the parallels.' },
    { t: RS.corr, mc: MC.wrongPairName, say: 'They are on opposite sides of the transversal, between ℓ and the base: alternate interior angles.' },
    { t: RS.vert, mc: MC.wrongPairName, say: 'They are at different vertices, not formed by two crossing lines at one point.' },
    { t: RS.angSum, mc: MC.circular, say: 'That is the theorem being proved.' },
  ] : i === 3 ? [
    { t: RS.angAdd, ok: true, say: 'Right: ∠1, ∠2 and ∠3 together fill the straight angle along ℓ.' },
    { t: RS.altInt, mc: MC.wrongPairName, say: 'This line adds three angles at one point along a line; no pair of angles is compared.' },
    { t: RS.angSum, mc: MC.circular, say: 'That is the theorem being proved.' },
    { t: RS.vert, mc: MC.wrongPairName, say: 'No two lines cross to make opposite angles here.' },
  ] : [
    { t: RS.subst, ok: true, say: 'Right: replace m∠1 and m∠3 by the equal measures from lines 2 and 3.' },
    { t: RS.angSum, mc: MC.circular, say: 'That is the theorem being proved: this line is where the proof arrives at it.' },
    { t: RS.angAdd, say: 'Line 4 already added the angles; this line swaps in equal measures.' },
    { t: RS.altInt, say: 'Lines 2 and 3 used that; this line swaps in the equal measures.' },
  ];
  return choiceItem(R, {
    id: `sumReason-${n}`, family: 'sumReason',
    prompt: `The proof of the triangle angle-sum theorem draws ℓ through ${L[1]} parallel to ${segN(L[0]! + L[2]!)}. Which reason belongs in line ${i + 1}?`, board: row.st,
    solution: [`Line ${i + 1}: the reason is ${row.rs}.`],
    picture: { fig, proof: proofPic(P.given, P.prove, P.rows, i), reveal: { fill: [{ i, rs: row.rs }] } },
  }, opts);
});

export const sumAux: Gen = (R, n) => fitted('sumAux', () => {
  const L = pickLetters(R, 3), [A, B, C] = [...L] as [string, string, string], T = sumTri(R);
  if (R() < 0.5) {
    const fig = triFig(T, L);
    return choiceItem(R, {
      id: `sumAux-${n}`, family: 'sumAux',
      prompt: `To prove that the angles of ${tri(L)} add to 180°, which line do you draw first?`, board: `\\triangle ${L}`,
      solution: [`A line through ${B} parallel to ${segN(A + C)} makes alternate interior angles equal to ∠${A} and ∠${C}.`, `Then ∠${A}, ∠${B}'s angle and ∠${C} line up along a straight angle at ${B}.`],
      picture: { fig, reveal: {} },
    }, [
      { t: `The line through ${B} parallel to ${segN(A + C)}`, ok: true, say: 'Right: it brings both base angles up to the vertex.' },
      { t: `The bisector of ∠${B}`, say: 'A bisector gives two equal halves of ∠B, but no parallel lines and so no angles equal to ∠A or ∠C.' },
      { t: `${segN(A + C)} extended past ${C}`, mc: MC.circular, say: 'The facts about an exterior angle are proved from the angle sum: using them here goes in a circle.' },
      { t: `The segment from ${B} to the midpoint of ${segN(A + C)}`, say: 'A midpoint gives two equal lengths, nothing about the angles.' },
    ]);
  }
  const which = R() < 0.5 ? 1 : 3, V = which === 1 ? A : C;
  return choiceItem(R, {
    id: `sumAux-${n}`, family: 'sumAux',
    prompt: `ℓ is drawn through ${B} parallel to ${segN(A + C)}. Why is m∠${which} = m∠${V}?`, board: `m\\angle ${which} = m\\angle ${V}`,
    solution: [`${segN(B + V)} cuts the parallels ℓ and ${segN(A + C)}.`, `∠${which} and ∠${V} lie on opposite sides of it, between the parallels: alternate interior angles.`],
    picture: { fig: sumFig(T, L), reveal: {} },
  }, [
    { t: 'They are alternate interior angles for ℓ ∥ ' + segN(A + C), ok: true, say: 'Right.' },
    { t: 'They are corresponding angles', mc: MC.wrongPairName, say: 'Corresponding angles sit on the same side of the transversal, one above each parallel; these are on opposite sides, between the parallels.' },
    { t: 'They are vertical angles', mc: MC.wrongPairName, say: 'Vertical angles share a vertex; these are at different vertices.' },
    { t: 'They look equal in the drawing', mc: MC.appearance, say: 'Looks are not a reason: the parallel lines are.' },
  ]);
});

export const sumWhy: Gen = (R, n) => {
  const who = pick(R, NAMES), k = r(R, 4, 9);
  const sums = Array.from({ length: 3 }, () => 180 + pick(R, [-1, 0, 0, 1]));
  return choiceItem(R, {
    id: `sumWhy-${n}`, family: 'sumWhy',
    prompt: `${who} measured the angles of ${k} different triangles with a protractor. The sums came out ${sums.join('°, ')}°, … , always about 180°. Has ${who} proved the angle-sum theorem?`, board: '\\text{evidence or proof?}',
    solution: ['Measurements are evidence for some triangles, and only to the nearest degree.', 'A proof shows the sum is exactly 180° for every triangle: the parallel through a vertex does that.'],
    picture: { card: { lines: [`${who}: ${k} triangles measured.`, `Sums: ${sums.join('°, ')}°, …`, '<b class="b">Proved for every triangle?</b>'] } },
  }, [
    { t: 'No: measured cases are evidence; a proof must cover every triangle', ok: true, say: 'Right.' },
    { t: `Yes: ${k} different triangles cover every shape`, mc: MC.examples, say: `There are infinitely many triangles; ${k} examples cannot cover them all.` },
    { t: 'Yes, as long as every measurement was careful', mc: MC.examples, say: 'Careful measuring still checks only the triangles measured, and only to the nearest degree.' },
    { t: 'No: the sums are not exactly 180°, so the theorem is false', say: 'Protractor readings are rounded; the proof shows the sum is exactly 180°.' },
  ]);
};

// =============== s3-isosceles-proof ===============
function isoProof(L: string) {
  const [A, B, C] = [...L] as [string, string, string];
  return {
    given: [`\\overline{${A}${B}} \\cong \\overline{${A}${C}}`], prove: `\\angle ${B} \\cong \\angle ${C}`,
    rows: [
      { st: `\\overline{${A}${B}} \\cong \\overline{${A}${C}}`, rs: RS.given },
      { st: `\\overline{${A}${C}} \\cong \\overline{${A}${B}}`, rs: RS.sym },
      { st: `\\angle ${B}${A}${C} \\cong \\angle ${C}${A}${B}`, rs: RS.refl },
      { st: `\\triangle ${A}${B}${C} \\cong \\triangle ${A}${C}${B}`, rs: RS.SAS },
      { st: `\\angle ${B} \\cong \\angle ${C}`, rs: RS.cpctc },
    ] as Row[],
  };
}
function isoFigFor(R: () => number, L: string, marks: 'ticks' | 'arcs') {
  const v = pick(R, [36, 42, 48, 76, 84, 96, 104]);
  const T = turnT(isoTri(v, 300), r(R, -15, 15));
  return triFig(T, L, marks === 'ticks' ? [{ seg: L[0]! + L[1]!, n: 1 }, { seg: L[0]! + L[2]!, n: 1 }] : [{ ang: ang3(L, 1), n: 1 }, { ang: ang3(L, 2), n: 1 }]);
}
export const isoProofReason: Gen = (R, n) => fitted('isoProofReason', () => {
  const L = pickLetters(R, 3), [A, B, C] = [...L] as [string, string, string];
  const P = isoProof(L), i = pick(R, [2, 3, 4]), row = P.rows[i]!;
  const opts: Opt[] = i === 2 ? [
    { t: RS.refl, ok: true, say: 'Right: ∠A is the same angle in both triangles.' },
    { t: RS.given, say: 'Nothing gives it: an angle is congruent to itself.' },
    { t: RS.vert, mc: MC.wrongPairName, say: 'It is one angle, compared with itself, not two crossing lines.' },
    { t: RS.cpctc, mc: MC.beforeEst, say: 'CPCTC needs the triangles proved congruent first; that is line 4.' },
  ] : i === 3 ? [
    { t: RS.SAS, ok: true, say: `Right: ${segN(A + B)} ↔ ${segN(A + C)}, ∠${A} ↔ ∠${A}, ${segN(A + C)} ↔ ${segN(A + B)}: side, included angle, side.` },
    { t: RS.SSA, mc: MC.ssa, say: 'SSA is not a criterion; and here the angle is between the two sides.' },
    { t: RS.ASA, mc: MC.order, say: 'Lines 1-3 give two sides and the angle between them.' },
    { t: RS.iso, mc: MC.circular, say: 'That is the theorem being proved.' },
  ] : [
    { t: RS.cpctc, ok: true, say: `Right: ∠${B} in △${L} corresponds to ∠${C} in △${A}${C}${B}.` },
    { t: RS.iso, mc: MC.circular, say: 'That is the theorem being proved: it cannot be its own reason.' },
    { t: RS.given, mc: CONCL, say: 'It is what we must prove, not what we are given.' },
    { t: RS.refl, say: `∠${B} and ∠${C} are two different angles.` },
  ];
  return choiceItem(R, {
    id: `isoProofReason-${n}`, family: 'isoProofReason',
    prompt: `The isosceles theorem: compare △${L} with △${A}${C}${B}. Which reason belongs in line ${i + 1}?`, board: row.st,
    solution: [`Line ${i + 1}: the reason is ${row.rs}.`],
    picture: { fig: isoFigFor(R, L, 'ticks'), proof: proofPic(P.given, P.prove, P.rows, i), reveal: { fill: [{ i, rs: row.rs }] } },
  }, opts);
});

export const isoProofCorr: Gen = (R, n) => fitted('isoProofCorr', () => {
  const L = pickLetters(R, 3), [A, B, C] = [...L] as [string, string, string], who = pick(R, NAMES);
  return choiceItem(R, {
    id: `isoProofCorr-${n}`, family: 'isoProofCorr',
    prompt: `${who} proves: in ${tri(L)} with ${segN(A + B)} ≅ ${segN(A + C)}, ∠${B} ≅ ∠${C}, with no extra lines. ${tri(L)} is shown congruent to which triangle, in this vertex order?`, board: `\\triangle ${L} \\cong \\triangle\\ ?`,
    solution: [`Match ${A} with ${A}, ${B} with ${C}, ${C} with ${B}: ${segN(A + B)} ↔ ${segN(A + C)}, ∠${A} ↔ ∠${A}, ${segN(A + C)} ↔ ${segN(A + B)}.`, 'SAS proves the match; then ∠' + B + ' corresponds to ∠' + C + '.'],
    picture: { fig: isoFigFor(R, L, 'ticks'), reveal: {} },
  }, [
    { t: `△${A}${C}${B}`, ok: true, say: 'Right: the triangle matched with its own mirror image.' },
    { t: `△${L}`, say: `Matching every vertex with itself only gives ∠${B} ≅ ∠${B}: nothing new.` },
    { t: `△${B}${A}${C}`, say: `That pairs ${segN(A + C)} with ${segN(B + C)}, which is not known to be congruent.` },
    { t: 'None: a triangle cannot be compared with its own mirror image', mc: MC.flipped, say: 'A flipped copy is still congruent: a reflection is a rigid motion.' },
  ]);
});

export const isoProofEarly: Gen = (R, n) => fitted('isoProofEarly', () => {
  const L = pickLetters(R, 3), [A, B, C] = [...L] as [string, string, string], who = pick(R, NAMES);
  const circ = R() < 0.4;
  const rows: Row[] = circ ? [
    { st: `\\overline{${A}${B}} \\cong \\overline{${A}${C}}`, rs: RS.given },
    { st: `\\angle ${B} \\cong \\angle ${C}`, rs: RS.iso },
  ] : [
    { st: `\\overline{${A}${B}} \\cong \\overline{${A}${C}}`, rs: RS.given },
    { st: `\\angle ${B} \\cong \\angle ${C}`, rs: RS.cpctc },
    { st: `\\angle ${A} \\cong \\angle ${A}`, rs: RS.refl },
    { st: `\\triangle ${A}${B}${C} \\cong \\triangle ${A}${C}${B}`, rs: RS.SAS },
  ];
  const opts: Opt[] = circ ? [
    { t: 'Line 2 cites the theorem it is trying to prove', ok: true, say: 'Right: that is circular.' },
    { t: 'Nothing: every line has a reason', mc: MC.circular, say: 'A reason must be established already; the theorem being proved is not.' },
    { t: 'The first line needs a reason other than Given', say: 'Line 1 is the given.' },
    { t: `The proof needs the bisector of ∠${A}`, say: 'Comparing the triangle with its mirror correspondence needs no extra line.' },
  ] : [
    { t: 'Line 2 uses CPCTC before the triangles are proved congruent', ok: true, say: 'Right: CPCTC comes after the congruence, in the last line.' },
    { t: 'Nothing: every line has a reason', mc: MC.beforeEst, say: 'Line 2 uses a congruence that is only proved in line 4.' },
    { t: 'Line 3 should say Given', say: 'An angle congruent to itself is the Reflexive Property.' },
    { t: 'SAS cannot work: both triangles are the same triangle', mc: MC.flipped, say: 'Matching the triangle with its mirror correspondence is a real congruence.' },
  ];
  return choiceItem(R, {
    id: `isoProofEarly-${n}`, family: 'isoProofEarly',
    prompt: `${who} writes this proof that ∠${B} ≅ ∠${C} when ${segN(A + B)} ≅ ${segN(A + C)}. What is wrong?`, board: `\\angle ${B} \\cong \\angle ${C}`,
    solution: circ ? [`Line 2 cites the ${RS.iso}, but that is the statement being proved.`, `Prove it instead: △${L} ≅ △${A}${C}${B} by SAS, then CPCTC.`] : ['Line 2 cites CPCTC, but no two triangles are congruent yet.', 'The congruence comes in line 4; ∠' + B + ' ≅ ∠' + C + ' belongs after it.'],
    picture: { fig: isoFigFor(R, L, 'ticks'), proof: { given: [`\\overline{${A}${B}} \\cong \\overline{${A}${C}}`], prove: `\\angle ${B} \\cong \\angle ${C}`, rows }, reveal: { strike: [1] } },
  }, opts);
});

// =============== s3-isosceles-converse-proof ===============
function convProof(L: string) {
  const [A, B, C] = [...L] as [string, string, string];
  return {
    given: [`\\angle ${B} \\cong \\angle ${C}`], prove: `\\overline{${A}${B}} \\cong \\overline{${A}${C}}`,
    rows: [
      { st: `\\angle ${B} \\cong \\angle ${C}`, rs: RS.given },
      { st: `\\overline{${B}${C}} \\cong \\overline{${C}${B}}`, rs: RS.refl },
      { st: `\\angle ${C} \\cong \\angle ${B}`, rs: RS.sym },
      { st: `\\triangle ${A}${B}${C} \\cong \\triangle ${A}${C}${B}`, rs: RS.ASA },
      { st: `\\overline{${A}${B}} \\cong \\overline{${A}${C}}`, rs: RS.cpctc },
    ] as Row[],
  };
}
export const convProofReason: Gen = (R, n) => fitted('convProofReason', () => {
  const L = pickLetters(R, 3), [A, B, C] = [...L] as [string, string, string];
  const P = convProof(L), i = pick(R, [1, 3, 4]), row = P.rows[i]!;
  const opts: Opt[] = i === 1 ? [
    { t: RS.refl, ok: true, say: `Right: ${segN(B + C)} is the same segment in both triangles.` },
    { t: RS.given, say: 'Nothing gives it: a segment is congruent to itself.' },
    { t: RS.cpctc, mc: MC.beforeEst, say: 'CPCTC needs the congruence of line 4 first.' },
    { t: RS.segAdd, say: 'No segment is split into parts here.' },
  ] : i === 3 ? [
    { t: RS.ASA, ok: true, say: `Right: ∠${B} ↔ ∠${C}, ${segN(B + C)} ↔ ${segN(C + B)}, ∠${C} ↔ ∠${B}: angle, included side, angle.` },
    { t: RS.SAS, say: 'Only one pair of sides is known; the lines above give two angles and the side between them.' },
    { t: RS.SSA, mc: MC.ssa, say: 'SSA is not a criterion, and only one side pair is known.' },
    { t: RS.iso, mc: MC.converse, say: 'The isosceles theorem goes from sides to angles; this proof goes the other way.' },
  ] : [
    { t: RS.cpctc, ok: true, say: `Right: ${segN(A + B)} in △${L} corresponds to ${segN(A + C)} in △${A}${C}${B}.` },
    { t: RS.iso, mc: MC.converse, say: 'The isosceles theorem starts from equal sides; here we start from equal angles. A converse needs its own proof.' },
    { t: RS.given, mc: CONCL, say: 'It is what we must prove, not what we are given.' },
    { t: RS.refl, say: 'They are two different segments.' },
  ];
  return choiceItem(R, {
    id: `convProofReason-${n}`, family: 'convProofReason',
    prompt: `The converse: if ∠${B} ≅ ∠${C}, then ${segN(A + B)} ≅ ${segN(A + C)}. Which reason belongs in line ${i + 1}?`, board: row.st,
    solution: [`Line ${i + 1}: the reason is ${row.rs}.`],
    picture: { fig: isoFigFor(R, L, 'arcs'), proof: proofPic(P.given, P.prove, P.rows, i), reveal: { fill: [{ i, rs: row.rs }] } },
  }, opts);
});

export const convProofWhy: Gen = (R, n) => fitted('convProofWhy', () => {
  const L = pickLetters(R, 3), [A, B, C] = [...L] as [string, string, string], who = pick(R, NAMES);
  const fig = isoFigFor(R, L, 'arcs');
  if (R() < 0.5) return choiceItem(R, {
    id: `convProofWhy-${n}`, family: 'convProofWhy',
    prompt: `In ${tri(L)}, ∠${B} ≅ ∠${C}. ${who} writes: “By the isosceles theorem, ${segN(A + B)} ≅ ${segN(A + C)}: the theorem works both ways.” Is the argument valid?`, board: `\\angle ${B} \\cong \\angle ${C} \\Rightarrow\\ ?`,
    solution: ['The isosceles theorem goes from congruent sides to congruent angles.', 'Going from angles to sides is the converse, a separate statement.', `It is true, but it needs its own proof: △${L} ≅ △${A}${C}${B} by ASA, then CPCTC.`],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Not valid: the converse needs its own proof (ASA does it)', ok: true, say: 'Right.' },
    { t: 'Valid: a theorem works in both directions', mc: MC.converse, say: 'Many true theorems have false converses; each direction needs its own proof.' },
    { t: 'Valid: the triangle is drawn symmetric', mc: MC.appearance, say: 'A drawing is not a reason.' },
    { t: 'Not valid: the converse is false', say: 'The converse is true; only the argument fails.' },
  ]);
  return choiceItem(R, {
    id: `convProofWhy-${n}`, family: 'convProofWhy',
    prompt: `Which congruence proves the converse in ${tri(L)}: if ∠${B} ≅ ∠${C}, then ${segN(A + B)} ≅ ${segN(A + C)}?`, board: `\\angle ${B} \\cong \\angle ${C}`,
    solution: [`Match ${tri(L)} with △${A}${C}${B}: ∠${B} ↔ ∠${C}, ${segN(B + C)} ↔ ${segN(C + B)}, ∠${C} ↔ ∠${B}.`, 'Angle, included side, angle: ASA. Then CPCTC gives the sides.'],
    picture: { fig, reveal: {} },
  }, [
    { t: `△${L} ≅ △${A}${C}${B} by ASA`, ok: true, say: 'Right.' },
    { t: `△${L} ≅ △${A}${C}${B} by SAS`, say: 'Only one side pair is known at the start: the shared base.' },
    { t: `△${L} ≅ △${A}${C}${B} by SSA`, mc: MC.ssa, say: 'SSA is not a criterion.' },
    { t: 'No congruence needed: it is the isosceles theorem read backwards', mc: MC.converse, say: 'A converse needs its own proof.' },
  ]);
});

// =============== s3-exterior-angle-sum-proof ===============
function extTri(R: () => number): { T: Tri; e: number[] } {
  for (;;) {
    const A = r(R, 38, 96), B = r(R, 38, 96), C = 180 - A - B;
    if (C < 30 || C > 100) continue;
    const T = turnT(triASA(A, 300, B), r(R, -20, 20));
    return { T, e: [0, 1, 2].map(i => Math.round(extAt(T, i))) };
  }
}
export const extMissing: Gen = (R, n) => fitted('extMissing', () => {
  const L = pickLetters(R, 3), { T, e } = extTri(R), j = r(R, 0, 2), park = R() < 0.4, who = pick(R, NAMES);
  const g = [0, 1, 2].filter(i => i !== j);
  const fig = extFig(T, L, [0, 1, 2].map(i => (i === j ? '?' : `${e[i]}°`)), { cols: [0, 1, 2].map(i => (i === j ? 'link' : 'first')) });
  const ans = e[j]!;
  const prompt = park
    ? `${who} walks once around a triangular park, turning at each corner. The turns at two corners are ${e[g[0]!]}° and ${e[g[1]!]}°. How many degrees is the turn at the third corner?`
    : `Each side of ${tri(L)} is extended once, making one exterior angle at each vertex. Two of them measure ${e[g[0]!]}° and ${e[g[1]!]}°. Find the exterior angle at ${L[j]}.`;
  return numItem({
    id: `extMissing-${n}`, family: 'extMissing', unit: '°', prompt, board: `${e[g[0]!]}^\\circ + ${e[g[1]!]}^\\circ + \\,? = 360^\\circ`,
    solution: [`${park ? 'Each turn is an exterior angle; ' : ''}one exterior angle at each vertex: together 360°.`, `360° − ${e[g[0]!]}° − ${e[g[1]!]}° = ${ans}°.`],
    picture: { fig, reveal: {} },
  }, ans, [
    { v: 720 - e[g[0]!]! - e[g[1]!]!, mc: MC.extBoth, say: 'One exterior angle per vertex totals 360°; 720° counts both angles at every vertex.' },
    { v: 180 - ans, say: `That is the interior angle at ${park ? 'the corner' : L[j]}; the exterior angle is its partner in the linear pair.` },
    { v: 540 - e[g[0]!]! - e[g[1]!]!, mc: MC.extLocal, say: '540° is the three linear pairs together; the exterior angles alone total 360°.' },
  ], 'Right.', 'One exterior angle at each vertex: together 360°.');
});

export const extAlgebra: Gen = (R, n) => fitted('extAlgebra', () => {
  const L = pickLetters(R, 3);
  for (;;) {
    const { T, e } = extTri(R), x0 = r(R, 8, 30), a = [r(R, 1, 3), r(R, 1, 3), r(R, 1, 4)];
    const c = e.map((v, i) => v - a[i]! * x0);
    if (c.some(v => v < -60 || v > 120) || a[0] === a[1] && a[1] === a[2] && c[0] === c[1]) continue;
    const j = r(R, 0, 2), askX = R() < 0.5;
    const texts = [0, 1, 2].map(i => `(${lin(a[i]!, c[i]!)})°`);
    const fig = extFig(T, L, texts);
    const A = a[0]! + a[1]! + a[2]!, Cc = c[0]! + c[1]! + c[2]!;
    const sumTxt = [0, 1, 2].map(i => `(${lin(a[i]!, c[i]!)})`).join(' + ');
    const ans = askX ? x0 : e[j]!;
    if (!askX && ans === x0) continue;
    return numItem({
      id: `extAlgebra-${n}`, family: 'extAlgebra', unit: askX ? '' : '°',
      prompt: `${tri(L)} has one exterior angle at each vertex: (${lin(a[0]!, c[0]!)})° at ${L[0]}, (${lin(a[1]!, c[1]!)})° at ${L[1]} and (${lin(a[2]!, c[2]!)})° at ${L[2]}. ${askX ? 'Find x.' : `Find the exterior angle at ${L[j]}.`}`,
      board: askX ? 'x = \\,?' : `\\text{exterior angle at }${L[j]} = \\,?`,
      solution: [`One exterior angle per vertex: ${sumTxt} = 360.`, `${A}x ${Cc < 0 ? '−' : '+'} ${Math.abs(Cc)} = 360, so ${A}x = ${360 - Cc} and x = ${x0}.`, ...(askX ? [] : [`At ${L[j]}: ${a[j]} · ${x0} ${c[j]! < 0 ? '−' : '+'} ${Math.abs(c[j]!)} = ${e[j]}°.`])],
      picture: { fig, reveal: {} },
    }, ans, askX ? [{ v: e[j]!, say: 'That is an angle; the question asks for x.' }] : [{ v: x0, mc: MC.reportsX, say: `x = ${x0}; put it back in to get the angle.` }], 'Right.', 'One exterior angle per vertex: they add to 360°.');
  }
});

export const extProof: Gen = (R, n) => fitted('extProof', () => {
  const L = pickLetters(R, 3), { T } = extTri(R), who = pick(R, NAMES);
  const fig = extFig(T, L, ['1', '2', '3'], { cols: ['first', 'first', 'first'] });
  const mode = pick(R, ['num', 'reason', 'both'] as const);
  const lines = [`At each vertex, an exterior angle and the interior angle form a linear pair: 180°.`];
  if (mode === 'num') {
    return numItem({
      id: `extProof-${n}`, family: 'extProof', unit: '°',
      prompt: `${who} proves that ∠1, ∠2 and ∠3 add to 360°. Step 1: each exterior angle and its interior angle form a linear pair. Step 2: the three linear pairs together total how many degrees?`, board: '3 \\times 180^\\circ = \\,?',
      solution: ['Each linear pair is 180°.', 'Three of them: 3 × 180° = 540°.', 'Then the interior angles take 180°, leaving 540° − 180° = 360° for ∠1 + ∠2 + ∠3.'],
      picture: { fig, card: { lines: [...lines, 'Three linear pairs together: <b class="s">?</b>', 'The interior angles of △' + L + ': 180°.'] }, reveal: { lines: ['540° − 180° = 360°.'] } },
    }, 540, [{ v: 360, mc: MC.extLocal, say: '360° is where the proof ends; the three linear pairs together are 3 × 180°.' }, { v: 180, say: 'One linear pair is 180°; there are three.' }, { v: 720, mc: MC.extBoth, say: 'One exterior angle per vertex: three linear pairs, 3 × 180°.' }], 'Right: then subtract the 180° inside.', 'Three linear pairs, 180° each.');
  }
  if (mode === 'reason') return choiceItem(R, {
    id: `extProof-${n}`, family: 'extProof',
    prompt: `Why do ∠1, ∠2 and ∠3 (one exterior angle at each vertex of ${tri(L)}) always add to 360°?`, board: 'm\\angle 1 + m\\angle 2 + m\\angle 3 = 360^\\circ',
    solution: ['Three linear pairs: 3 × 180° = 540°.', 'The interior angles take 180° of that (the angle sum).', '540° − 180° = 360°, for every triangle.'],
    picture: { fig, card: { lines } },
  }, [
    { t: 'Three linear pairs make 540°; the interior angles take 180°; 540° − 180° = 360°', ok: true, say: 'Right: and nothing in it depends on the shape.' },
    { t: 'Each exterior angle is 120°, and 3 × 120° = 360°', say: 'Only an equilateral triangle has three 120° exterior angles; the proof must cover every triangle.' },
    { t: 'It depends on the triangle: an obtuse triangle’s exterior angles total more', mc: MC.extShape, say: 'The proof works for every triangle: the total is always 360°.' },
    { t: 'Each exterior angle equals the two remote interior angles, so the total is 180°', mc: MC.extLocal, say: 'That fact is about one exterior angle; the three together count every interior angle twice: 2 × 180° = 360°.' },
  ]);
  return choiceItem(R, {
    id: `extProof-${n}`, family: 'extProof',
    prompt: `At each vertex of ${tri(L)} there are two exterior angles (extend either side). The theorem counts only one per vertex. Why?`, board: '\\text{one exterior angle per vertex}',
    solution: ['The two exterior angles at one vertex are vertical angles: they are equal.', 'The theorem picks one per vertex; counting both doubles the total to 720°.'],
    picture: { fig, card: { lines } },
  }, [
    { t: 'The two are vertical angles of equal size; counting both would double the total to 720°', ok: true, say: 'Right.' },
    { t: 'Both must be counted: the true total is 720°', mc: MC.extBoth, say: 'The theorem is about one exterior angle per vertex: 360°.' },
    { t: 'The second one is really an interior angle', say: 'It lies outside the triangle too; it is the vertical partner of the first.' },
    { t: 'Which one you pick changes the total', mc: MC.extShape, say: 'The two at one vertex are equal, so the total is 360° either way.' },
  ]);
});

// =============== s3-triangle-inequality-proof ===============
function ineqRows(N: { A: string; B: string; C: string; D: string }): Row[] {
  const { A, B, C, D } = N;
  return [
    { st: `${A}${D} = ${A}${C}`, rs: RS.constr },
    { st: `m\\angle ${A}${C}${D} = m\\angle ${A}${D}${C}`, rs: RS.iso },
    { st: `m\\angle ${B}${C}${D} > m\\angle ${A}${C}${D}`, rs: RS.angAdd },
    { st: `m\\angle ${B}${C}${D} > m\\angle ${B}${D}${C}`, rs: RS.subst },
    { st: `${B}${D} > ${B}${C}`, rs: RS.order },
    { st: `${B}${D} = ${B}${A} + ${A}${D}`, rs: RS.segAdd },
    { st: `${B}${A} + ${A}${C} > ${B}${C}`, rs: RS.subst },
  ];
}
export function ineqNames(R: () => number) { const s = pickLetters(R, 4); return { A: s[0]!, B: s[1]!, C: s[2]!, D: s[3]! }; }
export function ineqGeom(R: () => number) {
  for (;;) {
    const c = r(R, 360, 440), Ax = r(R, 90, 230), Ay = r(R, 220, 300);
    const P = extensionTri(0, Ax, Ay, c);
    const ab = Math.hypot(Ax, Ay), ac = Math.hypot(c - Ax, Ay);
    if (Math.abs(ab - ac) < 30 || Math.abs(ac - c) < 30 || Math.abs(ab - c) < 30) continue;
    return P;
  }
}
export const ineqProofReason: Gen = (R, n) => fitted('ineqProofReason', () => {
  const N = ineqNames(R), rows = ineqRows(N), i = pick(R, [1, 2, 3, 4, 5, 6]), row = rows[i]!;
  const fig = extensionFig(N, ineqGeom(R));
  const near: Record<number, Opt[]> = {
    1: [{ t: RS.iso, ok: true, say: `Right: ${N.A}${N.D} = ${N.A}${N.C}, so the angles facing those sides in △${N.A}${N.C}${N.D} are equal.` }, { t: RS.ineq, mc: MC.circular, say: 'That is the theorem being proved.' }, { t: RS.order, say: 'This line says two angles are equal; it comes from two equal sides.' }, { t: RS.vert, mc: MC.wrongPairName, say: 'The two angles are at different vertices, C and D.' }],
    2: [{ t: RS.angAdd, ok: true, say: `Right: ${N.A} lies inside ∠${N.B}${N.C}${N.D}, so ∠${N.A}${N.C}${N.D} is only part of it.` }, { t: RS.segAdd, say: 'This line compares angles, not segments.' }, { t: RS.iso, say: 'That gave line 2; this line compares a whole angle with its part.' }, { t: RS.ineq, mc: MC.circular, say: 'That is the theorem being proved.' }],
    3: [{ t: RS.subst, ok: true, say: `Right: ∠${N.A}${N.D}${N.C} is the same angle as ∠${N.B}${N.D}${N.C}, and line 2 makes it equal to ∠${N.A}${N.C}${N.D}.` }, { t: RS.order, mc: MC.beforeEst, say: 'This line is still about angles; the sides come in line 5.' }, { t: RS.ineq, mc: MC.circular, say: 'That is the theorem being proved.' }, { t: RS.vert, mc: MC.wrongPairName, say: 'No two lines cross to make opposite angles here.' }],
    4: [{ t: RS.order, ok: true, say: `Right: in △${N.B}${N.C}${N.D}, the larger angle (at ${N.C}) faces the longer side ${N.B}${N.D}.` }, { t: RS.ineq, mc: MC.circular, say: 'That is the theorem being proved.' }, { t: 'It looks longer in the figure', mc: MC.appearance, say: 'Looks are not a reason; the angle order is.' }, { t: RS.iso, say: 'That gave equal angles in △ACD; this line compares sides of △BCD.' }],
    5: [{ t: RS.segAdd, ok: true, say: `Right: ${N.A} lies on ${segN(N.B + N.D)} between ${N.B} and ${N.D}.` }, { t: RS.angAdd, say: 'This line adds lengths, not angles.' }, { t: RS.ineq, mc: MC.circular, say: 'That is the theorem being proved.' }, { t: RS.iso, say: 'No angles are involved in this line.' }],
    6: [{ t: RS.subst, ok: true, say: `Right: put ${N.B}${N.A} + ${N.A}${N.D} for ${N.B}${N.D} (line 6), then ${N.A}${N.C} for ${N.A}${N.D} (line 1).` }, { t: RS.ineq, mc: MC.circular, say: 'This line is the theorem itself; it must follow from the lines above.' }, { t: RS.segAdd, say: 'Line 6 used that; this line swaps in equal lengths.' }, { t: RS.order, say: 'Line 5 used that; this line swaps in equal lengths.' }],
  };
  return choiceItem(R, {
    id: `ineqProofReason-${n}`, family: 'ineqProofReason',
    prompt: `To prove ${N.B}${N.A} + ${N.A}${N.C} > ${N.B}${N.C}, extend ${segN(N.B + N.A)} past ${N.A} to ${N.D} with ${N.A}${N.D} = ${N.A}${N.C}. Which reason belongs in line ${i + 1}?`, board: row.st,
    solution: [`Line ${i + 1}: the reason is ${row.rs}.`],
    picture: { fig, proof: proofPic([`\\triangle ${N.A}${N.B}${N.C},\\ ${N.A}${N.D} = ${N.A}${N.C}`], `${N.B}${N.A} + ${N.A}${N.C} > ${N.B}${N.C}`, rows, i), reveal: { fill: [{ i, rs: row.rs }] } },
  }, near[i]!);
});

const TOWNS = ['Ashford', 'Brookline', 'Cedarville', 'Dunmore', 'Easton', 'Fairview', 'Glenwood', 'Hartley', 'Milford', 'Oakdale', 'Pinecrest', 'Riverton'];
export const ineqBoundary: Gen = (R, n) => {
  const [T1, T2, T3] = shuffle(R, TOWNS.slice()).slice(0, 3) as [string, string, string];
  const mode = pick(R, ['equal', 'equal', 'less', 'more'] as const);
  let a = 0, b = 0, d = 0;
  for (;;) {
    a = r(R, 4, 30); b = r(R, 4, 30);
    d = mode === 'equal' ? a + b : mode === 'less' ? a + b + r(R, 2, 9) : a + b - r(R, 3, Math.min(a, b) * 2 - 1);
    if (mode === 'more' && !(d > Math.abs(a - b) + 2 && d < a + b - 2)) continue;
    if (d <= 0) continue;
    break;
  }
  const opts: Opt[] = [
    { t: `${T3} lies on the straight road from ${T1} to ${T2}: the towns are collinear`, ok: mode === 'equal', say: mode === 'equal' ? `Right: ${a} + ${b} = ${d}, so the route through ${T3} is the direct road itself.` : mode === 'less' ? `On the road the two parts would add to exactly ${d}; ${a} + ${b} is less.` : `On the road the parts would add to exactly ${d}; ${a} + ${b} is more, so ${T3} is off the road.` },
    { t: 'A triangle whose three corners lie on one line', mc: MC.degenerate, say: 'Three points on one line make no triangle: there is no inside.' },
    { t: `${T3} lies off the road: the towns form a triangle`, ok: mode === 'more', mc: mode === 'equal' ? MC.degenerate : mode === 'less' ? MC.wrongPair : undefined, say: mode === 'more' ? `Right: ${a} + ${b} > ${d}, and every side is shorter than the other two together.` : mode === 'equal' ? `${a} + ${b} = ${d} exactly: off the road the detour would be longer than ${d}.` : `Compare the two shorter distances with the longest: ${a} + ${b} < ${d}.` },
    { t: 'These distances are impossible', ok: mode === 'less', mc: mode === 'equal' ? MC.boundary : undefined, say: mode === 'less' ? `Right: a detour can never be shorter than the direct road, and ${a} + ${b} < ${d}.` : mode === 'equal' ? `Equality is possible: it happens exactly when ${T3} lies on the road.` : 'Nothing breaks the triangle inequality here.' },
  ];
  return choiceItem(R, {
    id: `ineqBoundary-${n}`, family: 'ineqBoundary',
    prompt: `The straight road from ${T1} to ${T2} is ${d} mi. The straight road from ${T1} to ${T3} is ${a} mi, and from ${T3} to ${T2} is ${b} mi. What can you conclude?`, board: `${a} + ${b}\\ ?\\ ${d}`,
    solution: [`The detour through ${T3}: ${a} + ${b} = ${a + b} mi; the direct road: ${d} mi.`, 'A detour is never shorter than the direct road, and equal only when the third town lies on it.'],
    picture: { card: { lines: [`${T1} to ${T2}: <b class="a">${d} mi</b> (direct)`, `${T1} to ${T3}: <b class="b">${a} mi</b>`, `${T3} to ${T2}: <b class="b">${b} mi</b>`] } },
  }, opts, true);
};

export const ineqAlgebra: Gen = (R, n) => fitted('ineqAlgebra', () => {
  for (;;) {
    const a = r(R, 5, 20), b = r(R, 5, 20);
    if (Math.abs(a - b) < 2) continue;
    const { lo, hi } = thirdRange(a, b);
    const kx = R() < 0.45;
    const k = kx ? r(R, 2, 4) : r(R, 1, 6);
    if (!kx && lo - k < 1) continue;
    const xlo = kx ? r2(lo / k) : lo - k, xhi = kx ? r2(hi / k) : hi - k;
    if (kx && (!Number.isInteger(lo * 10 / k) || !Number.isInteger(hi * 10 / k))) continue;
    const nm = pickLetters(R, 3), u = R() < 0.5 ? 'in' : 'cm';
    const mid = (lo + hi) / 2, s = 360 / Math.max(a, b, mid);
    const T = turnT(triSSS(mid * s, a * s, b * s), r(R, -30, 30));
    const ex = kx ? `${k}x` : `x + ${k}`;
    const fig = triFig(T, nm, [{ seg: sideName(nm, 1), text: `${a} ${u}`, lone: true, col: 'first' }, { seg: sideName(nm, 2), text: `${b} ${u}`, lone: true, col: 'first' }, { seg: sideName(nm, 0), text: `${ex}`, lone: true, col: 'link' }]);
    return pairItem({
      id: `ineqAlgebra-${n}`, family: 'ineqAlgebra',
      prompt: `A triangle has sides ${a} ${u}, ${b} ${u} and (${ex}) ${u}. Between which two numbers must x lie?`, board: `${a},\\ ${b},\\ ${ex}`,
      solution: [`The third side lies strictly between ${Math.max(a, b)} − ${Math.min(a, b)} and ${a} + ${b}: ${lo} < ${ex} < ${hi}.`, kx ? `Divide each part by ${k}: ${fmt(xlo)} < x < ${fmt(xhi)}.` : `Subtract ${k} from each part: ${xlo} < x < ${xhi}.`],
      picture: { fig, strip: { lo: xlo, hi: xhi, max: Math.ceil(xhi + Math.max(2, xhi * 0.15)), name: 'x' }, reveal: {} },
    }, xlo, xhi, {
      right: 'Right.', general: `First the side: ${lo} < ${ex} < ${hi}. Then solve for x.`,
      wrong: [
        { x: lo, y: hi, say: `${lo} < ${ex} < ${hi} is the range of the side; now solve for x.` },
        { x: 0, y: xhi, mc: MC.upperOnly, say: `The upper bound is right; the side must also be more than ${lo}.` },
      ],
    });
  }
});

/** for tests: the rows of the bank proofs */
export const PROOFS = { sumProof, isoProof, convProof, ineqRows };
export { rotTo };
