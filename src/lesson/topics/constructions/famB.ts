// famB.ts: stage 2-3 families of "Constructions": conjectures (where the perpendicular bisectors meet, what a
// construction guarantees, examples are not proof), the givens a construction hands the proof, the SSS / SAS
// justifications (angle bisector, copy an angle, perpendicular bisector, both directions of the equidistance
// theorem) with the course's proof frame, diagnosing a failed construction by the broken equality, and loci (choose
// the locus for a condition, intersect it with a path, three towns). Pictures are exact; one right choice each.
import { type Fig, type GSeg, type Pt, at, dist, lerpP, measure, sub } from '../geometry-foundations/geo';
import { type Opt, r, pick, shuffle, ans } from '../geometry-foundations/kit';
import { type Cons, angleBis, copyAngle, lineThru, perpAt, perpBis, seg, sg } from './cons';
import { type CBase, type Gen, MC, KIND_GOAL, choose, numC, fitted, letters } from './ckit';
import type { OSeg } from './Construct';

const A = (s: string | number) => `<b class="a">${s}</b>`;
const cm = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)} cm`;
const half = (R: () => number) => r(R, 0, 1) === 1;
const ov = (s: string) => `\\overline{${s}}`;
const tk = (a: string, b: string, n: number, col: OSeg['col'] = 'first'): OSeg => ({ a, b, col, ticks: n });
const N5 = (R: () => number) => letters(R, 5) as [string, string, string, string, string];
const N4 = (R: () => number) => letters(R, 4) as [string, string, string, string];
const N6 = (R: () => number) => letters(R, 6) as [string, string, string, string, string, string];

// ===================== conjectures =====================
function triCons(R: () => number, kind: 'acute' | 'right' | 'obtuse', names: [string, string, string, string]): { c: Cons; angs: number[] } {
  const [a, b, cN, o] = names;
  let angA = 0, angB = 0;
  for (let t = 0; t < 100; t++) {
    angA = kind === 'right' ? 90 : kind === 'obtuse' ? r(R, 105, 125) : r(R, 50, 78);
    angB = r(R, 30, kind === 'acute' ? 78 : 50);
    const angC = 180 - angA - angB;
    if (angC < 25 || (kind === 'acute' && (angC >= 82 || Math.abs(angC - angB) < 6 || Math.abs(angA - angB) < 6))) continue;
    break;
  }
  const B0: Pt = [0, 0], C0: Pt = [400, 0];
  const angC = 180 - angA - angB;
  const A0 = (() => { const u = at([0, 0], angB, 1), w = at([0, 0], 180 - angC, 1); const den = u[0] * w[1] - u[1] * w[0]; const t = ((C0[0]) * w[1] - (C0[1]) * w[0]) / den; return [u[0] * t, u[1] * t] as Pt; })();
  // circumcentre: perpendicular bisectors of BC and AB
  const M1 = lerpP(B0, C0, 0.5), M2 = lerpP(A0, B0, 0.5);
  const d2 = sub(A0, B0), n2: Pt = [-d2[1], d2[0]];
  const t = (M1[0] - M2[0]) / n2[0];
  const O: Pt = [M1[0], M2[1] + n2[1] * t];
  const line = (M: Pt, P: Pt, Q: Pt) => { const d = sub(Q, P), L = Math.hypot(d[0], d[1]); const u: Pt = [-d[1] / L, d[0] / L]; const tO = (O[0] - M[0]) * u[0] + (O[1] - M[1]) * u[1]; const lo = Math.min(-90, tO - 90), hi = Math.max(90, tO + 90); return { a: [M[0] + u[0] * lo, M[1] + u[1] * lo] as Pt, b: [M[0] + u[0] * hi, M[1] + u[1] * hi] as Pt, kind: 'line' as const, role: 'result' as const }; };
  const c: Cons = {
    kind: 'perpBis', given: [seg(A0, B0), seg(B0, C0), seg(C0, A0)], givenArcs: [],
    pts: [{ name: a, at: A0, deps: [] }, { name: b, at: B0, deps: [] }, { name: cN, at: C0, deps: [] }, { name: o, at: O, deps: ['p1', 'p2'] }],
    steps: [{ id: 'p1', tool: 'straightedge', text: '', needs: [], after: [], arcs: [], lines: [line(M1, B0, C0)] }, { id: 'p2', tool: 'straightedge', text: '', needs: [], after: [], arcs: [], lines: [line(M2, A0, B0)] }],
  };
  return { c, angs: [angA, angB, angC] };
}
export const circumWhere: Gen = (R, n, sgId) => fitted('circumWhere', () => {
  const kind = pick(R, ['acute', 'right', 'obtuse'] as const);
  const names = N4(R);
  const { c, angs } = triCons(R, kind, names);
  const [a, b, cN, o] = names;
  const opts: Opt[] = [
    { t: 'Inside the triangle', ok: kind === 'acute', mc: kind === 'acute' ? undefined : MC.centersIn, say: kind === 'acute' ? 'Yes: in an acute triangle the bisectors meet inside.' : 'Only in an acute triangle. With a right or obtuse angle the meeting point is on or beyond the longest side.' },
    { t: 'On the longest side, at its midpoint', ok: kind === 'right', say: kind === 'right' ? 'Yes: in a right triangle the bisectors meet at the midpoint of the hypotenuse.' : 'That happens only in a right triangle.' },
    { t: 'Outside the triangle', ok: kind === 'obtuse', say: kind === 'obtuse' ? 'Yes: opposite the obtuse angle, beyond the longest side.' : 'Only an obtuse triangle pushes the point outside.' },
  ];
  const base: CBase = {
    id: `circumWhere-${n}`, family: 'circumWhere', subgoal: sgId,
    prompt: `In △${a}${b}${cN}, m∠${a} = ${angs[0]}°, m∠${b} = ${angs[1]}°, m∠${cN} = ${angs[2]}°. Construct the perpendicular bisectors of the sides. Where do they meet (point ${o})?`,
    board: `\\triangle ${a}${b}${cN}`, picture: { cons: { c, upto: 0, after: 2 } },
    solution: [`The triangle is ${kind}${kind === 'acute' ? '' : ` (m∠${a} = ${angs[0]}°)`}.`, kind === 'acute' ? 'Acute: the bisectors meet inside.' : kind === 'right' ? 'Right: they meet at the midpoint of the hypotenuse.' : 'Obtuse: they meet outside, beyond the longest side.'],
  };
  return choose(R, base, opts, true);
});
export const guaranteed: Gen = (R, n, sgId) => fitted('guaranteed', () => {
  const names = N5(R);
  const c = perpBis(R, { names, wk: 1, orient: pick(R, ['h', 's']) });   // this drawing happens to use width = AB
  const [a, b, p] = names;
  const opts: Opt[] = [
    { t: `${p}${a} = ${p}${b}`, ok: true, say: 'Yes: the arcs about A and B had the same width, for every allowed width.' },
    { t: `△${a}${p}${b} is equilateral`, mc: MC.observed, say: `It is in THIS drawing, because the width happened to be ${a}${b}. Any width wider than half would do, and then it is not equilateral.` },
    { t: `m∠${a}${p}${b} = 60°`, mc: MC.observed, say: 'Only because this width equals AB. A wider width gives a bigger angle at P.' },
    { t: `${p}${a} = ${a}${b}`, mc: MC.observed, say: 'Again a coincidence of this width, not something the steps force.' },
  ];
  const base: CBase = {
    id: `guaranteed-${n}`, family: 'guaranteed', subgoal: sgId,
    prompt: `Tess bisected ${sg(a + b)}; for her arcs she happened to open the compass to exactly ${a}${b}. Which claim do the construction steps guarantee for EVERY allowed width?`,
    board: '\\text{guaranteed}', picture: { cons: { c, upto: 4, over: { segs: [tk(p, a, 1), tk(p, b, 1)] }, overLate: true } },
    solution: ['The steps say: any width wider than half of AB, the same from A and from B.', `So only what holds for every such width is guaranteed: ${p}${a} = ${p}${b}. The rest is a feature of this particular drawing.`],
  };
  return choose(R, base, opts);
});
export const testConj: Gen = (R, n, sgId) => fitted('testConj', () => {
  const names = N4(R);
  const { c } = triCons(R, 'acute', names);
  const who = pick(R, ['Ivy', 'Marco', 'Lena', 'Dev', 'Rosa']), k = r(R, 3, 8);
  const claim = pick(R, ['the three perpendicular bisectors meet in one point', 'the meeting point is equally far from all three vertices']);
  const opts: Opt[] = [
    { t: 'It is a conjecture: test it on a deliberately different triangle, then prove it', ok: true, say: 'Yes: examples suggest; a proof shows it must hold for every triangle.' },
    { t: `${k} examples prove it for every triangle`, mc: MC.examples, say: `Agreement in ${k} cases is evidence, not proof: the claim is about EVERY triangle, including ones not drawn.` },
    { t: 'It is proved, because each construction was exact', mc: MC.measureProof, say: 'Exact constructions of some triangles still only check those triangles.' },
  ];
  const base: CBase = {
    id: `testConj-${n}`, family: 'testConj', subgoal: sgId,
    prompt: `${who} constructed the perpendicular bisectors in ${A(k)} acute triangles. Each time, ${claim}. What is the status of “${claim}” for all triangles?`,
    board: '\\text{conjecture}', picture: { cons: { c, upto: 2 } },
    solution: [`${k} cases agree: that makes a conjecture (“if ... then ...”), marked “needs proof”.`, 'Test it on a different kind of triangle (right, obtuse) to hunt for a counterexample, then prove it.'],
  };
  return choose(R, base, opts);
});

// ===================== construction givens =====================
type Pair = [string, string];
function givensOf(c: Cons): { yes: Pair[]; no: Pair[] } {
  const N = c.pts.map(p => p.name) as [string, string, string, string, string, string];
  if (c.kind === 'perpBis') { const [a, b, p, q] = N; return { yes: [[p + a, p + b], [q + a, q + b]] as Pair[], no: [[p + a, a + b], [p + q, a + b], [p + q, p + a], [a + b, q + b]] as Pair[] }; }
  if (c.kind === 'angleBis') { const [o, a, b, x] = N; return { yes: [[o + a, o + b], [a + x, b + x]] as Pair[], no: [[o + a, a + x], [o + x, a + b], [o + x, o + a], [a + b, a + x]] as Pair[] }; }
  const [o, a, b, o2, a2, b2] = N;
  return { yes: [[o + a, o2 + a2], [a + b, a2 + b2]] as Pair[], no: [[o + a, a + b], [o2 + a2, a2 + b2], [o + b, a + b]] as Pair[] };
}
const segLen = (c: Cons, s: string) => dist(c.pts.find(p => p.name === s[0])!.at, c.pts.find(p => p.name === s[1])!.at);
export const givenFromArcs: Gen = (R, n, sgId) => fitted('givenFromArcs', () => {
  const kind = pick(R, ['perpBis', 'angleBis', 'copyAngle'] as const);
  const c = kind === 'perpBis' ? perpBis(R, { names: N5(R) }) : kind === 'angleBis' ? angleBis(R, { names: N4(R) }) : copyAngle(R, { names: N6(R) });
  const g = givensOf(c), right = pick(R, g.yes);
  const no = g.no.filter(([s, t]) => Math.abs(segLen(c, s) - segLen(c, t)) / Math.max(segLen(c, s), segLen(c, t)) > 0.1);
  if (no.length < 3) throw new Error('distractors look equal');
  const opts: Opt[] = [
    { t: `${sg(right[0])} ≅ ${sg(right[1])}`, ok: true, say: 'Yes: both lengths are the same compass width, set once and kept.' },
    ...shuffle(R, no).slice(0, 3).map(([s, t]) => ({ t: `${sg(s)} ≅ ${sg(t)}`, mc: MC.appearance, say: `No step makes ${sg(s)} and ${sg(t)} equal (and here they are not). Only lengths drawn with the same compass width are guaranteed equal.` })),
  ];
  const base: CBase = {
    id: `givenFromArcs-${n}`, family: 'givenFromArcs', subgoal: sgId, prompt: `${KIND_GOAL[c.kind](c)} Which congruence do the compass steps themselves guarantee?`,
    board: '\\text{givens}', picture: { cons: { c, upto: c.steps.length, over: { segs: [tk(right[0][0]!, right[0][1]!, 1), tk(right[1][0]!, right[1][1]!, 1)] }, overLate: true } },
    solution: ['A compass step guarantees one thing: every point it marks is the compass width from the needle point.', `${right[0]} and ${right[1]} were both drawn with one width, kept: ${sg(right[0])} ≅ ${sg(right[1])}.`],
  };
  return choose(R, base, opts);
});
export const sharedSide: Gen = (R, n, sgId) => fitted('sharedSide', () => {
  const pbk = half(R);
  const c = pbk ? perpBis(R, { names: N5(R) }) : angleBis(R, { names: N4(R) });
  const N = c.pts.map(p => p.name);
  const [t1, t2, sh, arcs] = pbk ? [`${N[0]}${N[2]}${N[3]}`, `${N[1]}${N[2]}${N[3]}`, N[2]! + N[3]!, [[N[2]! + N[0]!, N[2]! + N[1]!], [N[3]! + N[0]!, N[3]! + N[1]!]]] : [`${N[0]}${N[1]}${N[3]}`, `${N[0]}${N[2]}${N[3]}`, N[0]! + N[3]!, [[N[0]! + N[1]!, N[0]! + N[2]!], [N[1]! + N[3]!, N[2]! + N[3]!]]];
  const opts: Opt[] = [
    { t: `${sg(sh)} ≅ ${sg(sh)}`, ok: true, say: 'Yes: the side both triangles share is congruent to itself: the Reflexive Property.' },
    ...(arcs as string[][]).map(([s, t]) => ({ t: `${sg(s!)} ≅ ${sg(t!)}`, say: `True, but that pair comes from the equal compass widths, not from sharing.` })),
  ];
  const base: CBase = {
    id: `sharedSide-${n}`, family: 'sharedSide', subgoal: sgId, prompt: `${KIND_GOAL[c.kind](c)} In △${t1} and △${t2}, which pair is congruent because the two triangles SHARE it?`,
    board: `\\triangle ${t1},\\; \\triangle ${t2}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [...t1], col: 'first' }, { pts: [...t2], col: 'second' }] } } },
    solution: [`△${t1} and △${t2} both contain ${sg(sh)}.`, `${sg(sh)} ≅ ${sg(sh)} by the Reflexive Property; the other two pairs come from the compass.`],
  };
  return choose(R, base, opts);
});

// ===================== justifications =====================
export const abProofCrit: Gen = (R, n, sgId) => fitted('abProofCrit', () => {
  const names = N4(R);
  const c = angleBis(R, { names });
  const [o, a, b, x] = names;
  const opts: Opt[] = [
    { t: 'SSS', ok: true, say: `Yes: ${o}${a} ≅ ${o}${b} and ${a}${x} ≅ ${b}${x} from the compass, ${o}${x} shared.` },
    { t: 'SAS', mc: MC.circular, say: `SAS would need ∠${a}${o}${x} ≅ ∠${b}${o}${x}: exactly what you are trying to prove.` },
    { t: 'SSA', mc: MC.ssa, say: 'SSA is not a criterion. And you have all three sides anyway.' },
    { t: 'AAA', mc: MC.aaa, say: 'No angles are known yet, and AAA would not prove congruence anyway.' },
  ];
  const base: CBase = {
    id: `abProofCrit-${n}`, family: 'abProofCrit', subgoal: sgId, prompt: `${KIND_GOAL.angleBis(c)} To prove it works: why is △${o}${a}${x} ≅ △${o}${b}${x}?`,
    board: `\\triangle ${o}${a}${x} \\cong \\triangle ${o}${b}${x}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [o, a, x], col: 'first' }, { pts: [o, b, x], col: 'second' }], segs: [tk(o, a, 1), tk(o, b, 1), tk(a, x, 2), tk(b, x, 2)] } } },
    solution: [`${o}${a} ≅ ${o}${b} (one arc about ${o}), ${a}${x} ≅ ${b}${x} (equal arcs), ${o}${x} ≅ ${o}${x} (shared).`, 'Three pairs of sides: SSS.'],
  };
  return choose(R, base, opts, true);
});
export const abProofNext: Gen = (R, n, sgId) => fitted('abProofNext', () => {
  const names = N4(R);
  const c = angleBis(R, { names });
  const [o, a, b, x] = names;
  const opts: Opt[] = [
    { t: `∠${a}${o}${x} ≅ ∠${b}${o}${x} (corresponding parts), so ray ${o}${x} bisects the angle`, ok: true, say: 'Yes: CPCTC gives the two angles at the vertex, and that is the definition of a bisector.' },
    { t: 'Nothing yet: the two angles at the vertex still have to be measured', mc: MC.measureProof, say: 'No measuring: congruent triangles hand you the two angles at the vertex as corresponding parts.' },
    { t: `${sg(a + x)} ⟂ ${sg(o + x)}`, mc: MC.appearance, say: 'Nothing forces a right angle at X. Read the corresponding angles at O.' },
    { t: 'Nothing new: congruent triangles only repeat the three pairs', mc: MC.someConds, say: 'Congruent triangles give EVERY pair of corresponding parts, including the angles at O.' },
  ];
  const base: CBase = {
    id: `abProofNext-${n}`, family: 'abProofNext', subgoal: sgId, prompt: `△${o}${a}${x} ≅ △${o}${b}${x} by SSS. What does that give you?`,
    board: `\\angle ${a}${o}${x} \\cong \\angle ${b}${o}${x}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [o, a, x], col: 'first' }, { pts: [o, b, x], col: 'second' }], angs: [{ v: o, p: a, q: x, col: 'link' }, { v: o, p: x, q: b, col: 'link' }] }, overLate: true } },
    solution: [`Corresponding parts of congruent triangles: ∠${a}${o}${x} ≅ ∠${b}${o}${x}.`, `Two congruent angles that make up ∠${a}${o}${b}: ray ${o}${x} is its bisector.`],
  };
  return choose(R, base, opts);
});
export const caProof: Gen = (R, n, sgId) => fitted('caProof', () => {
  const names = N6(R);
  const c = copyAngle(R, { names });
  const [o, a, b, o2, a2, b2] = names;
  const opts: Opt[] = [
    { t: `△${a}${o}${b} ≅ △${a2}${o2}${b2} by SSS (two radii and the transferred chord), so the angles at ${o} and ${o2} match`, ok: true, say: 'Yes: three pairs of sides from the compass, then corresponding parts.' },
    { t: `Both arcs have the same radius, so the angles match`, mc: MC.radiusOnly, say: 'Equal radii give only two pairs of sides. Without the chord the triangle is not fixed: the angle could be anything.' },
    { t: `SAS: two radii and the angle between them`, mc: MC.circular, say: `The angle at ${o2} is what you want to prove; you cannot use it.` },
  ];
  const base: CBase = {
    id: `caProof-${n}`, family: 'caProof', subgoal: sgId, prompt: `${KIND_GOAL.copyAngle(c)} Why is ∠${a2}${o2}${b2} ≅ ∠${a}${o}${b}?`,
    board: `\\angle ${a2}${o2}${b2} \\cong \\angle ${a}${o}${b}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [a, o, b], col: 'first' }, { pts: [a2, o2, b2], col: 'second' }], segs: [tk(o, a, 1), tk(o2, a2, 1), tk(o, b, 1), tk(o2, b2, 1), tk(a, b, 2), tk(a2, b2, 2)] }, overLate: true } },
    solution: [`${o}${a} = ${o2}${a2} and ${o}${b} = ${o2}${b2} (one width for both arcs); ${a}${b} = ${a2}${b2} (the chord carried).`, `SSS: △${a}${o}${b} ≅ △${a2}${o2}${b2}, so the corresponding angles at ${o} and ${o2} are congruent.`],
  };
  return choose(R, base, opts);
});
export const caMissing: Gen = (R, n, sgId) => fitted('caMissing', () => {
  const names = N6(R);
  const deg = pick(R, [r(R, 35, 45), r(R, 80, 125)]);
  const c = copyAngle(R, { names, radiusOnly: true, deg });
  const [o, a, b, o2, a2, b2] = names;
  const opts: Opt[] = [
    { t: `${sg(a2 + b2)} ≅ ${sg(a + b)}`, ok: true, say: 'Yes: that is the chord. Drawing the last arc with the radius gives a 60° angle, whatever the original was.' },
    { t: `${sg(o2 + a2)} ≅ ${sg(o + a)}`, say: 'That pair is there: both are radii of arcs with the same width.' },
    { t: `${sg(o2 + b2)} ≅ ${sg(o + b)}`, say: `That pair is there: ${b2} is on the arc about ${o2}, which has the original width.` },
  ];
  const base: CBase = {
    id: `caMissing-${n}`, family: 'caMissing', subgoal: sgId, prompt: `Leo copied ∠${a}${o}${b} (${deg}°) but drew the last arc about ${a2} with the RADIUS again instead of the chord. For SSS he needs three pairs. Which pair is missing?`,
    board: `${a2}${b2} \\; ? \\; ${a}${b}`, picture: { cons: { c, upto: c.steps.length, over: { segs: [tk(a, b, 2, 'first'), { a: a2, b: b2, col: 'wrong' }], bad: ['chord'] }, overLate: true } },
    solution: [`The radii give ${o2}${a2} ≅ ${o}${a} and ${o2}${b2} ≅ ${o}${b}.`, `The third pair, ${a2}${b2} ≅ ${a}${b}, needs the chord carried. With the radius, ${a2}${b2} = ${o2}${a2}: a 60° angle, not ${deg}°.`],
  };
  return choose(R, base, opts);
});
export const pbProof1: Gen = (R, n, sgId) => fitted('pbProof1', () => {
  const names = N5(R);
  const c = perpBis(R, { names });
  const [a, b, p, q, m] = names;
  const opts: Opt[] = [
    { t: `△${a}${p}${q} ≅ △${b}${p}${q} by SSS`, ok: true, say: 'Yes: PA ≅ PB and QA ≅ QB from the arcs, PQ shared. That gives the angles at P you need next.' },
    { t: `△${a}${p}${m} ≅ △${b}${p}${m} by SAS`, mc: MC.beforeEst, say: `SAS needs ∠${a}${p}${m} ≅ ∠${b}${p}${m}, which you only get from the first congruence.` },
    { t: `△${a}${p}${m} ≅ △${b}${p}${m} by SSS`, mc: MC.circular, say: `SSS here would need ${a}${m} ≅ ${b}${m}: that is what you are proving.` },
  ];
  const base: CBase = {
    id: `pbProof1-${n}`, family: 'pbProof1', subgoal: sgId, prompt: `To prove line ${p}${q} is the perpendicular bisector of ${sg(a + b)}, which congruence comes FIRST?`,
    board: `\\triangle ${a}${p}${q} \\cong \\triangle ${b}${p}${q}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [a, p, q], col: 'first' }, { pts: [b, p, q], col: 'second' }], segs: [tk(p, a, 1), tk(p, b, 1), tk(q, a, 1), tk(q, b, 1)] }, overLate: true } },
    solution: [`From the arcs: ${p}${a} ≅ ${p}${b}, ${q}${a} ≅ ${q}${b}; ${p}${q} is shared.`, `So first △${a}${p}${q} ≅ △${b}${p}${q} (SSS); it gives ∠${a}${p}${m} ≅ ∠${b}${p}${m} for the second congruence.`],
  };
  return choose(R, base, opts);
});
export const pbProof2: Gen = (R, n, sgId) => fitted('pbProof2', () => {
  const names = N5(R);
  const c = perpBis(R, { names });
  const [a, b, p, , m] = names;
  const opts: Opt[] = [
    { t: `${a}${m} ≅ ${b}${m} AND ∠${a}${m}${p} ≅ ∠${b}${m}${p}, a linear pair, so both are 90°: bisects and perpendicular`, ok: true, say: 'Yes: one congruence, two conclusions: the halves and the right angles.' },
    { t: `${a}${m} ≅ ${b}${m}, so the line is the perpendicular bisector`, mc: MC.someConds, say: 'That shows it bisects. A perpendicular bisector must ALSO be perpendicular: use the angles at M.' },
    { t: `∠${a}${m}${p} measures 90° with a protractor, so it is perpendicular`, mc: MC.measureProof, say: 'A measured angle is a fact about one drawing. The proof gets 90° from the congruent linear pair.' },
  ];
  const base: CBase = {
    id: `pbProof2-${n}`, family: 'pbProof2', subgoal: sgId, prompt: `After △${a}${p}${m} ≅ △${b}${p}${m} (SAS), what finishes the proof that line ${p}${m} is the perpendicular bisector of ${sg(a + b)}?`,
    board: `\\triangle ${a}${p}${m} \\cong \\triangle ${b}${p}${m}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [a, p, m], col: 'first' }, { pts: [b, p, m], col: 'second' }], angs: [{ v: m, p: a, q: p, col: 'link', box: true }, { v: m, p: p, q: b, col: 'link', box: true }] }, overLate: true } },
    solution: [`CPCTC: ${a}${m} ≅ ${b}${m} (M is the midpoint) and ∠${a}${m}${p} ≅ ∠${b}${m}${p}.`, 'Those two angles form a linear pair (sum 180°) and are equal: both 90°. Both conditions hold.'],
  };
  return choose(R, base, opts);
});
export const pbLinear: Gen = (R, n, sgId) => fitted('pbLinear', () => {
  const names = N5(R);
  const c = perpBis(R, { names });
  const [a, b, p, , m] = names;
  return numC({
    id: `pbLinear-${n}`, family: 'pbLinear', subgoal: sgId, unit: '°',
    prompt: `In the proof, ∠${a}${m}${p} ≅ ∠${b}${m}${p}, and the two angles form a linear pair. What is m∠${a}${m}${p}?`,
    board: `m\\angle ${a}${m}${p} = \\,?`, picture: { cons: { c, upto: c.steps.length, over: { angs: [{ v: m, p: a, q: p, col: 'link' }, { v: m, p: p, q: b, col: 'link' }] } } },
    solution: ['A linear pair adds to 180°.', `Two equal angles adding to 180°: each is 180° ÷ 2 = ${ans(90)}°.`],
  }, 90, [{ v: 180, say: '180° is the pair together. Each angle is half of it.' }, { v: 45, say: 'Half of 90°: but the pair adds to 180°, not 90°.' }], 'Yes: two equal angles in a linear pair are right angles.', 'A linear pair adds to 180°.');
});
/** a point Y on the constructed bisector (not an arc point, not M) */
function withY(R: () => number, c: Cons, y: string): Cons {
  const P = c.pts[2]!.at, Q = c.pts[3]!.at, M = c.pts[4]!.at;
  const t = pick(R, [-1, 1]) * (0.35 + 0.4 * R());
  const Y = lerpP(M, t > 0 ? P : Q, Math.abs(t) * (t > 0 ? 1.25 : 1.25));
  return { ...c, pts: [...c.pts, { name: y, at: Y, deps: ['line'] }] };
}
export const fwdNum: Gen = (R, n, sgId) => fitted('fwdNum', () => {
  const names = letters(R, 6);
  const c = withY(R, perpBis(R, { names: names.slice(0, 5) as [string, string, string, string, string] }), names[5]!);
  const [a, b, , , , y] = names;
  const ya = r(R, 9, 29) / 2;
  const opts: Opt[] = [
    { t: cm(ya), ok: true, say: `Yes: every point of the perpendicular bisector is equally far from ${a} and ${b}, not just the arc points.` },
    { t: `Can’t tell: only the arc crossings are known to be equidistant`, mc: MC.onlyArc, say: `${y} is not an arc point, but it is on the bisector, and EVERY point of the bisector is equidistant (SAS on the two right triangles at M).` },
    { t: cm(ya / 2), say: 'Equidistant means the same distance, not half.' },
    { t: cm(ya + 1), say: `${y} is on the bisector: the two distances are equal.` },
  ];
  const base: CBase = {
    id: `fwdNum-${n}`, family: 'fwdNum', subgoal: sgId, prompt: `${y} is a point of the constructed perpendicular bisector of ${sg(a! + b!)} (not one of the arc points). ${y}${a} = ${A(cm(ya))}. What is ${y}${b}?`,
    board: `${y}${b} = \\,?`, picture: { cons: { c, upto: c.steps.length, over: { segs: [tk(y!, a!, 1), tk(y!, b!, 1)] }, overLate: true } },
    solution: [`△${y}M${a} and △${y}M${b}: M${a} ≅ M${b}, right angles at M, ${y}M shared: SAS.`.replace(/M/g, names[4]!), `So ${y}${b} = ${y}${a} = ${cm(ya)}.`],
  };
  return choose(R, base, opts);
});
export const fwdWhy: Gen = (R, n, sgId) => fitted('fwdWhy', () => {
  const names = letters(R, 6);
  const c = withY(R, perpBis(R, { names: names.slice(0, 5) as [string, string, string, string, string] }), names[5]!);
  const [a, b, , , m, y] = names;
  const opts: Opt[] = [
    { t: `△${y}${m}${a} ≅ △${y}${m}${b} by SAS: ${m}${a} ≅ ${m}${b}, right angles at ${m}, ${y}${m} shared`, ok: true, say: 'Yes: the argument works for ANY point Y of the line, so it proves the whole line.' },
    { t: `${y} is on an arc about ${a} and an arc about ${b} with the same width`, mc: MC.onlyArc, say: `No arc passes through ${y}: it is a generic point of the line. The argument must not depend on arcs.` },
    { t: 'It was checked for three points of the line, so it holds for all', mc: MC.examples, say: 'Checking points shows examples. Arbitrary-point reasoning (any Y) proves it for all of them at once.' },
  ];
  const base: CBase = {
    id: `fwdWhy-${n}`, family: 'fwdWhy', subgoal: sgId, prompt: `${y} is ANY point of the perpendicular bisector of ${sg(a! + b!)} (midpoint ${m}). Why is ${y}${a} = ${y}${b}?`,
    board: `${y}${a} = ${y}${b}`, picture: { cons: { c, upto: c.steps.length, over: { tris: [{ pts: [y!, m!, a!], col: 'first' }, { pts: [y!, m!, b!], col: 'second' }] }, overLate: true } },
    solution: [`${m} is the midpoint: ${m}${a} ≅ ${m}${b}; the line is perpendicular: both angles at ${m} are right; ${y}${m} is shared.`, `SAS: △${y}${m}${a} ≅ △${y}${m}${b}, so ${y}${a} = ${y}${b}, whichever point ${y} is.`],
  };
  return choose(R, base, opts);
});
function zFig(R: () => number, names: string[]): Fig {
  const [a, b, m, z] = names;
  const L = 380, A0: Pt = [0, 0], B0: Pt = [L, 0], M0: Pt = [L / 2, 0], Z0: Pt = [L / 2, r(R, 170, 240) * pick(R, [1, -1])];
  const segs: GSeg[] = [{ id: 'AM', a: A0, b: M0, ticks: 1 }, { id: 'MB', a: M0, b: B0, ticks: 1 }, { id: 'ZA', a: Z0, b: A0, ticks: 2, col: 'first' }, { id: 'ZB', a: Z0, b: B0, ticks: 2, col: 'first' }, { id: 'ZM', a: Z0, b: M0, dash: true, col: 'second' }];
  return { segs, angles: [], points: [{ at: A0, name: a!, dir: 180 }, { at: B0, name: b!, dir: 0 }, { at: M0, name: m!, dir: Z0[1] > 0 ? -60 : 60 }, { at: Z0, name: z!, dir: Z0[1] > 0 ? 90 : -90 }], pad: 80 };
}
export const convWhy: Gen = (R, n, sgId) => fitted('convWhy', () => {
  const names = letters(R, 4);
  const [a, b, m, z] = names;
  const opts: Opt[] = [
    { t: `△${z}${a}${m} ≅ △${z}${b}${m} by SSS, so ∠${z}${m}${a} ≅ ∠${z}${m}${b}; a congruent linear pair: both 90°`, ok: true, say: `Yes: then line ${z}${m} goes through the midpoint at a right angle: it IS the perpendicular bisector.` },
    { t: `Points on the perpendicular bisector are equidistant from ${a} and ${b}`, mc: MC.converse, say: 'That is the forward theorem. Here you start from an equidistant point and must show it is ON the bisector: the converse.' },
    { t: `${z} looks like it is straight above ${m}`, mc: MC.appearance, say: 'The proof cannot rest on looks: use the equal distances to get congruent triangles.' },
  ];
  const base: CBase = {
    id: `convWhy-${n}`, family: 'convWhy', subgoal: sgId, prompt: `${z} is not on ${sg(a! + b!)} and is equally far from ${a} and ${b} (${z}${a} = ${z}${b}); ${m} is the midpoint of ${sg(a! + b!)}. Why must ${z} lie on the perpendicular bisector?`,
    board: `${z}${a} = ${z}${b} \\Rightarrow ?`, picture: { fig: zFig(R, names) },
    solution: [`${z}${a} ≅ ${z}${b} (given), ${a}${m} ≅ ${b}${m} (midpoint), ${z}${m} shared: SSS.`, `So ∠${z}${m}${a} ≅ ∠${z}${m}${b}; they form a linear pair, so both are 90°: ${z}${m} is the perpendicular bisector.`],
  };
  return choose(R, base, opts);
});
export const iffBoth: Gen = (R, n, sgId) => fitted('iffBoth', () => {
  const [a, b] = letters(R, 2);
  const c = perpBis(R, { names: [a!, b!, ...letters(R, 3, a! + b!)] as [string, string, string, string, string] });
  const opts: Opt[] = [
    { t: `Every point ON the bisector is equidistant from ${a} and ${b}, AND every point equidistant from ${a} and ${b} is ON the bisector`, ok: true, say: 'Yes: “exactly the set” needs both directions: nothing on the line fails, nothing off the line qualifies.' },
    { t: `Every point on the bisector is equidistant from ${a} and ${b}`, mc: MC.iff, say: 'That is one direction. It does not rule out equidistant points somewhere OFF the line.' },
    { t: `Every point equidistant from ${a} and ${b} is on the bisector`, mc: MC.iff, say: 'That is the converse alone. It does not show that every point of the line is equidistant.' },
  ];
  const base: CBase = {
    id: `iffBoth-${n}`, family: 'iffBoth', subgoal: sgId, prompt: `“The perpendicular bisector of ${sg(a! + b!)} is EXACTLY the set of points equidistant from ${a} and ${b}.” What must be proved?`,
    board: '\\iff', picture: { cons: { c, upto: c.steps.length } },
    solution: ['“Exactly the set” is an if-and-only-if: two statements.', 'Forward (on the line ⟹ equidistant, SAS) and converse (equidistant ⟹ on the line, SSS).'],
  };
  return choose(R, base, opts);
});
export const boundaryCase: Gen = (R, n, sgId) => fitted('boundaryCase', () => {
  const [a, b, z, m] = letters(R, 4);
  const d = r(R, 6, 16);
  const opts: Opt[] = [
    { t: `At ${m}, the midpoint of ${sg(a! + b!)}, which is on the bisector`, ok: true, say: 'Yes: on the segment, equal distances to both ends means the midpoint, and the midpoint lies on the bisector.' },
    { t: `Nowhere: the converse proof needs ${z} off the segment, so this case cannot happen`, mc: MC.boundary, say: `The case can happen (the midpoint ${m}). The SSS argument needed ${z} off ${sg(a! + b!)}, so this boundary case gets its own one-line argument.` },
    { t: `Anywhere on ${sg(a! + b!)}`, say: `Only one point of the segment is the same distance from both ends.` },
  ];
  const base: CBase = {
    id: `boundaryCase-${n}`, family: 'boundaryCase', subgoal: sgId, prompt: `${sg(a! + b!)} is ${A(cm(d))}. ${z} is ON ${sg(a! + b!)} and ${z}${a} = ${z}${b}. Where is ${z}?`,
    board: `${z}${a} = ${z}${b} = ${d / 2}`, picture: { card: { lines: [`The converse proof (SSS on △${z}${a}${m} and △${z}${b}${m}, ${m} the midpoint) assumed the point is not on ${sg(a! + b!)}.`, `What if ${z} IS on ${sg(a! + b!)}, with ${z}${a} = ${z}${b}?`] } },
    solution: [`On the segment, ${z}${a} + ${z}${b} = ${d}, and ${z}${a} = ${z}${b}: each is ${cm(d / 2)}.`, `So ${z} is the midpoint, which is on the perpendicular bisector: the converse holds in this case too.`],
  };
  return choose(R, base, opts);
});

// ===================== diagnosis =====================
export const diagnose: Gen = (R, n, sgId) => fitted('diagnose', () => {
  const flaw = pick(R, ['widths', 'rayMarks', 'radiusOnly', 'offCentre'] as const);
  let c: Cons, opts: Opt[], prompt: string, bad: string[], sol: string[];
  if (flaw === 'widths') {
    const names = N5(R), L = 320, w = L * (0.62 + 0.1 * R());
    c = perpBis(R, { names, w, wB: w * (1.15 + 0.1 * R()) });
    const [a, b, p, q] = names;
    prompt = `Zoe tried to bisect ${sg(a + b)}, but line ${p}${q} misses the midpoint.`;
    bad = ['arcB'];
    opts = [{ t: `${p}${a} ≠ ${p}${b}: the widths from ${a} and ${b} were different`, ok: true, say: `Yes: the proof needs ${p}${a} = ${p}${b} and ${q}${a} = ${q}${b}, from ONE width.` }, { t: `The arcs were too short`, mc: MC.noMeet, say: `The arcs did cross, at ${p} and ${q}. The trouble is their widths.` }, { t: `The line was drawn carelessly through ${p} and ${q}`, mc: MC.eye, say: 'A line through two points is exact. The points themselves are off.' }];
    sol = [`The proof uses ${p}${a} ≅ ${p}${b} and ${q}${a} ≅ ${q}${b}.`, `With two different widths those equalities fail, so ${p} and ${q} are not equidistant from ${a} and ${b}.`];
  } else if (flaw === 'rayMarks') {
    const names = N4(R);
    c = angleBis(R, { names, unequal: true });
    const [o, a, b, x] = names;
    const err = Math.abs(measure(c.pts[0]!.at, c.pts[1]!.at, c.pts[3]!.at) - measure(c.pts[0]!.at, c.pts[2]!.at, c.pts[3]!.at));
    if (err < 4) throw new Error('flaw too small');
    prompt = `Ray ${o}${x} was supposed to bisect the angle, but the two parts differ.`;
    bad = ['arcO'];
    opts = [{ t: `${o}${a} ≠ ${o}${b}: the marks on the sides are at different distances`, ok: true, say: `Yes: SSS needs ${o}${a} = ${o}${b}, from ONE arc about the vertex.` }, { t: `${a}${x} ≠ ${b}${x}`, mc: MC.width, say: `The arcs from ${a} and ${b} kept one width: ${a}${x} = ${b}${x} holds.` }, { t: 'The angle should have been measured first', mc: MC.eye, say: 'Measuring is not the fix: one arc about the vertex is.' }];
    sol = [`SSS on △${o}${a}${x} and △${o}${b}${x} needs ${o}${a} = ${o}${b}, ${a}${x} = ${b}${x}, ${o}${x} shared.`, `The first one fails: two different arcs about ${o}.`];
  } else if (flaw === 'radiusOnly') {
    const names = N6(R);
    c = copyAngle(R, { names, radiusOnly: true, deg: pick(R, [r(R, 35, 45), r(R, 80, 125)]) });
    const [o, a, b, o2, a2, b2] = names;
    prompt = `∠${a2}${o2}${b2} was supposed to copy ∠${a}${o}${b}, but it came out a different size.`;
    bad = ['chord'];
    opts = [{ t: `${a2}${b2} ≠ ${a}${b}: the chord was never carried over`, ok: true, say: `Yes: the last arc used the radius, not the chord ${a}${b}.` }, { t: `${o2}${a2} ≠ ${o}${a}`, say: 'Both are radii of arcs with one width: equal.' }, { t: `${o2}${b2} ≠ ${o}${b}`, say: `${b2} is on the long arc about ${o2}, which has the original width: equal.` }, { t: 'The new ray was drawn too short', mc: MC.armLen, say: 'Ray length never changes an angle.' }];
    sol = [`SSS on △${a}${o}${b} and △${a2}${o2}${b2} needs the two radii AND the chord.`, `The chord ${a2}${b2} was drawn with the radius, not ${a}${b}: that pair is broken.`];
  } else {
    const names = N4(R);
    c = perpAt(R, { off: true, names });
    const [p, a, b, x] = names;
    prompt = `Line ${p}${x} was supposed to be perpendicular to ℓ at ${p}, but it is not.`;
    bad = ['arcP'];
    opts = [{ t: `${p}${a} ≠ ${p}${b}: ${p} is not the midpoint of ${sg(a + b)}`, ok: true, say: `Yes: the construction needs ${p} to be the midpoint of ${sg(a + b)}, from ONE arc about ${p}.` }, { t: `${x}${a} ≠ ${x}${b}`, mc: MC.width, say: `The arcs from ${a} and ${b} kept one width: ${x}${a} = ${x}${b} holds.` }, { t: 'The protractor was not used', mc: MC.eye, say: 'A protractor is never part of a construction.' }];
    sol = [`The equal arcs put ${x} on the perpendicular bisector of ${sg(a + b)}.`, `That passes through ${p} only if ${p}${a} = ${p}${b}. Here they differ.`];
  }
  const base: CBase = {
    id: `diagnose-${n}`, family: 'diagnose', subgoal: sgId, prompt: `${prompt} Which equality that the proof needs is broken?`,
    board: `\\text{${flaw}}`, picture: { cons: { c, upto: c.steps.length, over: { bad }, overLate: true } }, solution: sol,
  };
  return choose(R, base, opts);
});
export const measuredProof: Gen = (R, n, sgId) => fitted('measuredProof', () => {
  const names = N5(R);
  const c = perpBis(R, { names });
  const [a, b, p, , m] = names;
  const who = pick(R, ['Zoe', 'Malik', 'Hana', 'Leo', 'Ines']);
  const ang = pick(R, [89.5, 90, 90.5, 89.8, 90.3]), half1 = r(R, 31, 58) / 10;
  const opts: Opt[] = [
    { t: 'No: a measured drawing shows it is close, not that it must be; the proof comes from the equal arcs', ok: true, say: 'Yes: measurements check one drawing. The congruence argument shows every such construction works.' },
    { t: 'Yes: the measurements match', mc: MC.measureProof, say: 'Matching measurements are evidence about this drawing, not a proof about the construction.' },
    { t: 'Yes, if she measures a second drawing too', mc: MC.examples, say: 'More drawings are more examples. A proof argues from what the steps force.' },
  ];
  const base: CBase = {
    id: `measuredProof-${n}`, family: 'measuredProof', subgoal: sgId,
    prompt: `${who} measured her construction: m∠${p}${m}${a} = ${ang}° and ${a}${m} = ${m}${b} = ${half1} cm. Is that a proof that the construction gives the perpendicular bisector?`,
    board: '\\text{measure vs proof}', picture: { cons: { c, upto: c.steps.length } },
    solution: ['A proof must work for every allowed construction, without measuring.', `The arcs give ${p}${a} ≅ ${p}${b} and the rest by SSS, then SAS: that is the proof.`],
  };
  return choose(R, base, opts);
});

// ===================== loci =====================
export const chooseLocus: Gen = (R, n, sgId) => fitted('chooseLocus', () => {
  const kind = pick(R, ['two', 'angle', 'circle'] as const);
  const [s, t, cN] = letters(R, 3);
  const d = r(R, 2, 9);
  const PLACES: [string, string][] = [['schools', 'library'], ['bus stops', 'bench'], ['hospitals', 'helipad'], ['wells', 'pump'], ['towns', 'cell tower']];
  const [two, thing] = pick(R, PLACES);
  const scen = kind === 'two' ? `A ${thing} must be the same distance from the two ${two} at ${s} and ${t}.` : kind === 'angle' ? `Two straight fences start at corner ${cN} (rays from ${cN}). A path from ${cN} must make equal angles with both fences.` : `A ${thing} must be exactly ${d} mi from the ${pick(R, ['tower', 'lighthouse', 'school'])} at ${cN}.`;
  const opts: Opt[] = [
    { t: `The perpendicular bisector of ${sg(s! + t!)}`, ok: kind === 'two', mc: kind === 'angle' ? MC.lociMatch : undefined, say: kind === 'two' ? 'Yes: the points equally far from two sites form their perpendicular bisector.' : 'That locus is about equal distance from two POINTS; the condition here is different.' },
    { t: `The bisector of the angle at ${cN}`, ok: kind === 'angle', mc: kind === 'two' ? MC.bisForTwo : undefined, say: kind === 'angle' ? 'Yes: equal angles with both sides of an angle: its bisector.' : 'An angle bisector is about equal angles with two rays, not equal distance from two points.' },
    { t: `A circle about ${cN} with radius ${d} mi`, ok: kind === 'circle', say: kind === 'circle' ? 'Yes: one fixed distance from one point: a circle.' : 'A circle is one fixed distance from one point: not this condition.' },
    { t: `Just the midpoint of ${sg(s! + t!)}`, mc: kind === 'two' ? MC.defaultPt : undefined, say: kind === 'two' ? 'The midpoint is one such point, but every point of the perpendicular bisector qualifies.' : 'The midpoint of two sites has nothing to do with this condition.' },
  ];
  const base: CBase = {
    id: `chooseLocus-${n}`, family: 'chooseLocus', subgoal: sgId, prompt: `${scen} Which set of points meets the condition?`,
    board: `\\text{locus}`, picture: { card: { lines: [scen] } },
    solution: [kind === 'two' ? 'Same distance from two points ⟹ the perpendicular bisector of the segment joining them.' : kind === 'angle' ? 'Equal angles with two rays from a corner ⟹ the bisector of that angle.' : 'A fixed distance from one point ⟹ a circle about it.'],
  };
  return choose(R, base, opts, true);
});
export const onPath: Gen = (R, n, sgId) => fitted('onPath', () => {
  const kind = pick(R, ['one', 'none', 'every'] as const);
  const [a, b] = letters(R, 2);
  const L = 300, A0: Pt = [0, 0], B0: Pt = [L, 0], M0: Pt = [L / 2, 0];
  let r1: Pt, r2: Pt;
  if (kind === 'every') { r1 = [L / 2, -230]; r2 = [L / 2, 230]; }
  else if (kind === 'none') { const x = pick(R, [-90, L + 90]); r1 = [x, -230]; r2 = [x, 230]; }
  else {
    const ang = r(R, 25, 60) * pick(R, [1, -1]), P0: Pt = [L / 2 + pick(R, [1, -1]) * r(R, 50, 90), r(R, 60, 120) * pick(R, [1, -1])];
    r1 = at(P0, ang, -260); r2 = at(P0, ang, 260);
    const u = sub(r2, r1), w = sub(M0, r1);
    if (Math.abs(u[0] * w[1] - u[1] * w[0]) / Math.hypot(u[0], u[1]) < 40) throw new Error('road through the midpoint');
  }
  const fig: Fig = { segs: [{ id: 'road', a: r1, b: r2, kind: 'line', col: 'second', name: 'road' }, { id: 'pb', a: [L / 2, -240], b: [L / 2, 240], kind: 'line', dash: true, col: 'link', solve: true }], angles: [], points: [{ at: A0, name: a!, dir: 200 }, { at: B0, name: b!, dir: -20 }], pad: 80 };
  const ans1 = kind === 'one' ? 0 : kind === 'none' ? 1 : 2;
  const opts: Opt[] = [
    { t: 'Exactly one point', ok: ans1 === 0, mc: ans1 === 0 ? undefined : MC.oneAnswer, say: ans1 === 0 ? 'Yes: the road crosses the perpendicular bisector once.' : 'Not every question has exactly one answer: compare the road with the perpendicular bisector.' },
    { t: 'No point', ok: ans1 === 1, say: ans1 === 1 ? `Yes: the road runs parallel to the perpendicular bisector and never meets it.` : 'The road does meet the perpendicular bisector.' },
    { t: 'Every point of the road', ok: ans1 === 2, say: ans1 === 2 ? `Yes: the road IS the perpendicular bisector (${b} is ${a}’s mirror image across it).` : 'Only if the road were the perpendicular bisector itself.' },
    { t: `Only the midpoint of ${sg(a! + b!)}`, mc: MC.defaultPt, say: 'The site must also be ON the road: intersect the locus with the road.' },
  ];
  const base: CBase = {
    id: `onPath-${n}`, family: 'onPath', subgoal: sgId, prompt: `A charging station must be on the straight road and the same distance from ${a} and ${b}. How many places qualify?`,
    board: '\\text{locus} \\cap \\text{road}', picture: { fig },
    solution: [`Same distance from ${a} and ${b}: the perpendicular bisector of ${sg(a! + b!)}.`, kind === 'one' ? 'It crosses the road once: exactly one place.' : kind === 'none' ? 'It is parallel to the road: no place.' : 'It is the road itself: every point qualifies.'],
  };
  return choose(R, base, opts, true);
});
export const threeTowns: Gen = (R, n, sgId) => fitted('threeTowns', () => {
  const col = R() < 0.35;
  const [a, b, cN] = letters(R, 3);
  let P: Pt[];
  if (col) P = [[0, 0], [r(R, 140, 220), 0], [r(R, 330, 420), 0]];
  else {
    for (;;) {
      P = [[0, 0], [r(R, 340, 420), 0], [r(R, 90, 280), r(R, 180, 260)]];
      const angs = [measure(P[0]!, P[1]!, P[2]!), measure(P[1]!, P[0]!, P[2]!), measure(P[2]!, P[0]!, P[1]!)];
      if (angs.every(x => Math.abs(x - 90) > 10 && x > 30)) break;
    }
  }
  const fig: Fig = { segs: col ? [] : [{ id: 's1', a: P[0]!, b: P[1]!, col: 'faint' }, { id: 's2', a: P[1]!, b: P[2]!, col: 'faint' }, { id: 's3', a: P[2]!, b: P[0]!, col: 'faint' }], angles: [], points: [{ at: P[0]!, name: a!, dir: 225 }, { at: P[1]!, name: b!, dir: -45 }, { at: P[2]!, name: cN!, dir: col ? -45 : 90 }], pad: 90 };
  const opts: Opt[] = col ? [
    { t: 'There is none: the perpendicular bisectors are parallel', ok: true, say: 'Yes: for towns on one line the bisectors are all perpendicular to that line, so they never meet.' },
    { t: 'Where two perpendicular bisectors cross', mc: MC.alwaysPt, say: 'These bisectors are parallel: they never cross. Such a point does not always exist.' },
    { t: `At the middle town ${b}`, mc: MC.defaultPt, say: `${b} is 0 from itself and not 0 from the others.` },
    { t: `At the midpoint of ${sg(a! + cN!)}`, mc: MC.defaultPt, say: `That is equally far from ${a} and ${cN}, but not from ${b}.` },
  ] : [
    { t: 'Where the perpendicular bisectors of two sides cross', ok: true, say: 'Yes: on the first it is equidistant from two towns, on the second from another two: so from all three.' },
    { t: 'Where two angle bisectors of the triangle cross', mc: MC.bisForTwo, say: 'Angle bisectors are about equal distances from SIDES. Equal distances from points need perpendicular bisectors.' },
    { t: 'At the midpoint of the longest side', mc: MC.defaultPt, say: 'That point is equally far from two towns only (unless the triangle has a right angle).' },
    { t: 'There is none', mc: MC.oneAnswer, say: 'For three towns not on one line there is exactly one such point.' },
  ];
  const base: CBase = {
    id: `threeTowns-${n}`, family: 'threeTowns', subgoal: sgId, prompt: `Where is the point equally far from the towns ${a}, ${b} and ${cN}?`,
    board: `X${a} = X${b} = X${cN}`, picture: { fig },
    solution: col ? [`Equidistant from ${a} and ${b}: their bisector; from ${b} and ${cN}: theirs.`, 'Both are perpendicular to the one line through the towns, so they are parallel: no such point.'] : [`Equidistant from ${a} and ${b}: the perpendicular bisector of ${sg(a! + b!)}; from ${b} and ${cN}: of ${sg(b! + cN!)}.`, 'Where they cross, the point is equidistant from all three.'],
  };
  return choose(R, base, opts);
});
export const whyTwo: Gen = (R, n, sgId) => fitted('whyTwo', () => {
  const names = N4(R);
  const { c } = triCons(R, 'acute', names);
  const [a, b, cN, x] = names;
  const opts: Opt[] = [
    { t: `${x}${a} = ${x}${b} and ${x}${b} = ${x}${cN}, so ${x}${a} = ${x}${cN}: ${x} is on the third bisector too`, ok: true, say: 'Yes: the converse of the bisector theorem puts X on the third bisector without drawing it.' },
    { t: 'It is needed: two lines alone cannot fix a point', mc: MC.lociMatch, say: 'Two crossing lines DO fix a point. The third bisector passes through it automatically.' },
    { t: 'The third bisector always misses the point a little', mc: MC.examples, say: 'In a drawing it might look off; in the geometry it passes exactly through X.' },
  ];
  const base: CBase = {
    id: `whyTwo-${n}`, family: 'whyTwo', subgoal: sgId, prompt: `${x} is where the perpendicular bisectors of ${sg(a + b)} and ${sg(b + cN)} cross. Why is the third bisector (of ${sg(a + cN)}) not needed to find ${x}?`,
    board: `${x}${a} = ${x}${b} = ${x}${cN}`, picture: { cons: { c, upto: 2 } },
    solution: [`On the bisector of ${sg(a + b)}: ${x}${a} = ${x}${b}. On the bisector of ${sg(b + cN)}: ${x}${b} = ${x}${cN}.`, `So ${x}${a} = ${x}${cN}, and by the converse ${x} is on the bisector of ${sg(a + cN)} as well.`],
  };
  return choose(R, base, opts);
});
// ===================== proof frame: the missing reason =====================
export const RSN = {
  arc: 'Same compass width (construction)',
  refl: 'Reflexive Property of Congruence',
  SSS: 'SSS', SAS: 'SAS', cpctc: 'CPCTC',
  defBis: 'Definition of angle bisector',
  defMid: 'Definition of midpoint',
  linPair: 'Congruent angles in a linear pair are right angles',
  defPB: 'Definition of perpendicular bisector',
  given: 'Given',
} as const;
interface PR { st: string; rs: string }
function abRows(o: string, a: string, b: string, x: string): PR[] {
  return [{ st: `${ov(o + a)} \\cong ${ov(o + b)}`, rs: RSN.arc }, { st: `${ov(a + x)} \\cong ${ov(b + x)}`, rs: RSN.arc }, { st: `${ov(o + x)} \\cong ${ov(o + x)}`, rs: RSN.refl }, { st: `\\triangle ${o}${a}${x} \\cong \\triangle ${o}${b}${x}`, rs: RSN.SSS }, { st: `\\angle ${a}${o}${x} \\cong \\angle ${b}${o}${x}`, rs: RSN.cpctc }, { st: `\\overrightarrow{${o}${x}}\\text{ bisects }\\angle ${a}${o}${b}`, rs: RSN.defBis }];
}
function pbRows(a: string, b: string, p: string, q: string, m: string): PR[] {
  return [{ st: `${ov(p + a)} \\cong ${ov(p + b)},\\ ${ov(q + a)} \\cong ${ov(q + b)}`, rs: RSN.arc }, { st: `${ov(p + q)} \\cong ${ov(p + q)}`, rs: RSN.refl }, { st: `\\triangle ${a}${p}${q} \\cong \\triangle ${b}${p}${q}`, rs: RSN.SSS }, { st: `\\angle ${a}${p}${m} \\cong \\angle ${b}${p}${m}`, rs: RSN.cpctc }, { st: `\\triangle ${a}${p}${m} \\cong \\triangle ${b}${p}${m}`, rs: RSN.SAS }, { st: `${ov(a + m)} \\cong ${ov(b + m)},\\ \\angle ${a}${m}${p} \\cong \\angle ${b}${m}${p}`, rs: RSN.cpctc }];
}
const WRONG: Record<string, { t: string; mc?: string; why: string }[]> = {
  [RSN.arc]: [{ t: RSN.refl, why: 'Nothing is shared here: the two lengths are different segments drawn with one compass width.' }, { t: RSN.cpctc, mc: MC.beforeEst, why: 'No congruent triangles exist yet at this line.' }, { t: 'They look equal', mc: MC.appearance, why: 'Looks are not a reason; the compass width is.' }],
  [RSN.refl]: [{ t: RSN.arc, why: 'This side is not drawn with the compass: it is the SAME segment in both triangles.' }, { t: RSN.cpctc, mc: MC.beforeEst, why: 'No congruence is proved yet.' }, { t: RSN.given, why: 'Nothing is given about it: it is shared.' }],
  [RSN.SSS]: [{ t: RSN.SAS, mc: MC.circular, why: 'SAS needs the angle between, which is what the proof is after.' }, { t: 'SSA', mc: MC.ssa, why: 'SSA is not a criterion; here all three sides match.' }, { t: 'AAA', mc: MC.aaa, why: 'No angles are known, and AAA is not a criterion.' }],
  [RSN.SAS]: [{ t: RSN.SSS, mc: MC.circular, why: 'SSS would need AM ≅ BM: that is the conclusion.' }, { t: 'SSA', mc: MC.ssa, why: 'The angle at P sits between PA and PM: that is SAS, and SSA is not a criterion.' }, { t: RSN.cpctc, why: 'CPCTC reads parts off a congruence; this line IS the congruence.' }],
  [RSN.cpctc]: [{ t: RSN.SSS, why: 'SSS proves triangles congruent; this line reads a part off congruent triangles.' }, { t: RSN.defBis, mc: MC.circular, why: 'The bisector is what you are proving; it cannot be the reason.' }, { t: 'They look equal', mc: MC.appearance, why: 'Looks are not a reason; the congruent triangles are.' }],
  [RSN.defBis]: [{ t: RSN.cpctc, why: 'CPCTC gave the two angles; turning them into “bisects” is the definition.' }, { t: RSN.SSS, why: 'SSS was for the triangles.' }, { t: RSN.defMid, mc: MC.bisMid, why: 'A bisector of an angle is about angles, not a midpoint.' }],
};
export const proofReason: Gen = (R, n, sgId) => fitted('proofReason', () => {
  const pb = sgId === 'justify-perp-bisector' || (sgId !== 'justify-angle-bisector' && half(R));
  let c: Cons, rows: PR[], given: string, prove: string, tris: { pts: string[]; col: 'first' | 'second' }[];
  if (pb) { const names = N5(R); c = perpBis(R, { names }); const [a, b, p, q, m] = names; rows = pbRows(a, b, p, q, m); given = `\\text{the construction of line }${p}${q}`; prove = `${ov(a + m)} \\cong ${ov(b + m)},\\ \\angle ${a}${m}${p} \\cong \\angle ${b}${m}${p}`; tris = [{ pts: [a, p, q], col: 'first' }, { pts: [b, p, q], col: 'second' }]; }
  else { const names = N4(R); c = angleBis(R, { names }); const [o, a, b, x] = names; rows = abRows(o, a, b, x); given = `\\text{the construction of }\\overrightarrow{${o}${x}}`; prove = `\\overrightarrow{${o}${x}}\\text{ bisects }\\angle ${a}${o}${b}`; tris = [{ pts: [o, a, x], col: 'first' }, { pts: [o, b, x], col: 'second' }]; }
  const i = r(R, 0, rows.length - 1), row = rows[i]!;
  const wrong = WRONG[row.rs] ?? [];
  if (wrong.length < 2) throw new Error('menu');
  const opts: Opt[] = [{ t: row.rs, ok: true, say: 'Yes: that is the reason for this line.' }, ...wrong.map(w => ({ t: w.t, mc: w.mc, say: w.why }))];
  const base: CBase = {
    id: `proofReason-${n}`, family: 'proofReason', subgoal: sgId, prompt: `${KIND_GOAL[c.kind](c)} In the proof that it works, what is the reason for line ${i + 1}?`,
    board: row.st, picture: { cons: { c, upto: c.steps.length, over: { tris } }, proof: { given: [given], prove, rows, ask: [{ i, cell: 'rs' }] } },
    solution: [`Line ${i + 1}: ${row.st.replace(/\\overline\{([^}]*)\}/g, '$1').replace(/\\cong/g, '≅').replace(/\\triangle /g, '△').replace(/\\angle /g, '∠').replace(/\\overrightarrow\{([^}]*)\}/g, 'ray $1').replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\[ ,]/g, ' ')}.`, `Its reason: ${row.rs}.`],
  };
  return choose(R, base, opts);
});
export { lineThru };
