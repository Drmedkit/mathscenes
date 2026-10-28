// famC.ts: stage 3 of "Arcs and angles in circles": reasoning. Hypotheses checked against the givens (never the
// look of the figure), a step rejected as NOT JUSTIFIED (not "false") when a condition is missing, converses and
// contrapositives, the right-angle-diameter converse, justified solution chains, the three cases of the Inscribed
// Angle Theorem, the inscribed-quadrilateral proof, the chord / secant / tangent angle justifications, and real-world
// uses. The figures of the "not justified" items are exact AND the claim is true in them: what is missing is the
// reason, not the truth (so "false" is never secretly right).
import { type Pt, add, dirv, dist, mul } from '../geometry-foundations/geo';
import { type CSpec, R0, cfig } from './cfig';
import { cross, placeCcw, splitArcs } from './cconf';
import { tanMeet, secSecConf } from './famB';
import { tanSecConf } from './famA';
import { type CProof, type CProofId, CHAINS, makeProof, texHtml } from './cProofs';
import { type CItem, type Gen, type Opt, MC, S, choose, dg, fitted, fmt, mA, mArc, numQ, pick, prose, r, relabel, shuffle } from './ckit';

const ok = 'Right.';
const tR = (R: () => number, roles: string) => relabel(R, roles + 'O', 'O');

// ---------- hypotheses ----------
type Hyp = { thm: string; spec: CSpec; right: string; wrong: { t: string; mc?: string; say: string }[]; why: string };
function hypOf(R: () => number, k: string): Hyp {
  const th = r(R, 0, 359);
  if (k === 'ins') {
    const m = r(R, 60, 140);
    return { thm: 'the Inscribed Angle Theorem (m∠ACB = ½ m(arc AB))', spec: { center: null, on: { A: th, B: th + m, C: th + m + r(R, 50, 360 - m - 50) }, segs: ['CA', 'CB'], angles: [{ id: 'ACB', col: 'pick', r: 60 }] },
      right: 'C is on the circle, and CA and CB are chords', why: 'The theorem is about inscribed angles: vertex on the circle, sides chords.',
      wrong: [{ t: 'C is inside the circle', mc: MC.insideInscribed, say: 'A vertex inside the circle gives a different rule (half the SUM of two arcs).' }, { t: 'the center O is inside ∠ACB', mc: MC.caseSplit, say: 'The theorem holds wherever the center is: inside, on a side, or outside.' }, { t: 'arc AB is a minor arc', mc: MC.majorSeparate, say: 'It works for a major intercepted arc too.' }] };
  }
  if (k === 'semi') {
    return { thm: 'the semicircle theorem (m∠ACB = 90°)', spec: { center: 'O', on: { A: th, B: th + 180, C: th + r(R, 200, 340) }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'ACB', col: 'pick', r: 46 }] },
      right: 'AB is given to pass through the center O, and C is on the circle', why: 'The chord must be a diameter (given or proved), and the vertex must be on the circle.',
      wrong: [{ t: '∠ACB looks like a right angle', mc: MC.appearance, say: 'A look is not a given.' }, { t: 'AB is the longest chord drawn', mc: MC.appearance, say: 'Long is not the same as through the center.' }, { t: 'C is on the circle, and nothing else is needed', mc: MC.anyRight, say: 'AB must be a diameter too.' }] };
  }
  if (k === 'tan') {
    return { thm: 'tangent ⊥ radius (m∠OTP = 90°)', spec: { center: 'O', on: { T: th, A: th + r(R, 120, 240) }, segs: ['OT', 'OA', { id: 'TP', kind: 'line', ext: [R0 * 0.6, R0 * 0.1], col: 'ink' }], pts: { P: add(mul(dirv(th), R0), mul(dirv(th + 90), R0 * 0.8)) } },
      right: 'line TP is given tangent at T, and OT is the radius to T', why: 'Tangency must be given, and the radius must go to the point of tangency.',
      wrong: [{ t: 'OA is a radius', mc: MC.perpAny, say: 'Only the radius to the point of tangency is perpendicular.' }, { t: 'line TP seems to touch the circle at one point', mc: MC.appearance, say: 'A near miss or a near crossing looks the same: tangency must be given.' }, { t: 'P is outside the circle', mc: MC.rightAtP, say: 'The right angle is at T, and only if TP is tangent.' }] };
  }
  if (k === 'cyc') {
    const arcs = splitArcs(R, 4, 50, 130), [A, B, C, D] = placeCcw(th, arcs);
    return { thm: 'the inscribed quadrilateral theorem (m∠A + m∠C = 180°)', spec: { center: null, on: { A: A!, B: B!, C: C!, D: D! }, segs: ['AB', 'BC', 'CD', 'DA'] },
      right: 'all four vertices A, B, C and D are on the circle', why: 'ABCD must be inscribed: every vertex on the circle.',
      wrong: [{ t: 'three of the vertices are on the circle', mc: MC.noHyp, say: 'All four must be on the circle.' }, { t: 'opposite sides are parallel', mc: MC.cyclicEqual, say: 'That is a parallelogram condition, not this theorem.' }, { t: 'ABCD looks inscribed', mc: MC.appearance, say: 'It must be given (or proved).' }] };
  }
  const m = r(R, 70, 140), P = tanMeet(th, th + m);
  return { thm: 'the circumscribed angle theorem (m∠APB = 180° − m∠AOB)', spec: { center: 'O', on: { A: th, B: th + m }, pts: { P }, segs: ['OA', 'OB', 'PA', 'PB'], angles: [{ id: 'APB', col: 'pick', r: 56 }] },
    right: 'PA and PB are both given tangent to the circle', why: 'Both sides of the angle must be tangents.',
    wrong: [{ t: 'P is outside the circle', mc: MC.anyExterior, say: 'Outside is not enough: secants from P give a different angle.' }, { t: 'PA and PB look the same length', mc: MC.appearance, say: 'A look is not a given.' }, { t: 'one of PA, PB is tangent', mc: MC.noHyp, say: 'Both must be tangents.' }] };
}
export const hypCheck: Gen = (R, n) => fitted('hypCheck', () => {
  const k = pick(R, ['ins', 'semi', 'tan', 'cyc', 'circ']);
  const h = hypOf(R, k), fig = cfig(h.spec);
  const opts: Opt[] = [{ t: h.right, ok: true, say: `Right: ${h.why}` }, ...h.wrong.map(w => ({ ...w }))];
  return choose(R, tR(R, 'ABCDPT'), { id: `hypCheck-${n}`, family: 'hypCheck', prompt: `To use ${h.thm}, which facts must be given or already proved?`, board: '\\text{hypotheses}', solution: [h.why, `So: ${h.right}.`], picture: { cfig: fig } }, opts);
});
type Lic = { spec: CSpec; givens: string[]; step: string; right: number; why: string; mc: (string | undefined)[] };
function licOf(R: () => number, k: string): Lic {
  const th = r(R, 0, 359);
  if (k === 'tan') {
    const B = th + r(R, 60, 140), Q = add(mul(dirv(th), R0), mul(dirv(th + 90), R0 * 0.8));
    return { spec: { center: 'O', on: { A: th, B }, pts: { Q }, segs: ['OA', 'AB', { id: 'AQ', kind: 'line', ext: [R0 * 0.6, R0 * 0.1], col: 'ink' }] },
      givens: ['O is the center of the circle', 'line AQ is tangent to the circle at A', 'B is on the circle'], step: 'm∠OAQ = 90°', right: 1, why: 'Tangent ⊥ radius needs the tangency at A, and OA is the radius to A.', mc: [MC.perpAny, undefined, MC.noHyp] };
  }
  if (k === 'semi') {
    const C = th + r(R, 200, 340);
    return { spec: { center: 'O', on: { A: th, B: th + 180, C }, segs: ['AB', 'CA', 'CB'] }, givens: ['C is on the circle', 'AB passes through the center O', 'm∠CAB is less than 90°'], step: 'm∠ACB = 90°', right: 1, why: 'The semicircle theorem needs AB to be a diameter.', mc: [MC.anyRight, undefined, MC.appearance] };
  }
  const arcs = splitArcs(R, 4, 50, 130), [A, B, C, D] = placeCcw(th, arcs);
  return { spec: { center: null, on: { A: A!, B: B!, C: C!, D: D! }, segs: ['AB', 'BC', 'CD', 'DA'] }, givens: ['AB = CD', 'A, B, C and D all lie on one circle', 'AC is longer than BD'], step: 'm∠A + m∠C = 180°', right: 1, why: 'The quadrilateral theorem needs all four vertices on the circle.', mc: [MC.cyclicEqual, undefined, MC.appearance] };
}
export const hypMatch: Gen = (R, n) => fitted('hypMatch', () => {
  const k = pick(R, ['tan', 'semi', 'cyc']);
  const L = licOf(R, k), fig = cfig(L.spec);
  const opts: Opt[] = L.givens.map((g, i) => ({ t: `given ${i + 1}: ${g}`, ok: i === L.right, mc: L.mc[i], say: i === L.right ? `Right: ${L.why}` : L.why }));
  opts.push({ t: 'the figure: it is drawn that way', mc: MC.appearance, say: 'A figure illustrates; only the givens license a step.' });
  return choose(R, tR(R, 'ABCDQ'), {
    id: `hypMatch-${n}`, family: 'hypMatch', prompt: `Givens: ${L.givens.map((g, i) => `(${i + 1}) ${g}`).join('; ')}. One step of a solution says ${L.step}. Which given licenses that step?`, board: L.step.replace(/m∠/g, 'm\\angle ').replace(/°/g, '^\\circ'),
    solution: [L.why, `That is given ${L.right + 1}.`], picture: { cfig: fig, card: { lines: [...L.givens.map((g, i) => `(${i + 1}) ${g}`), `Step: ${L.step}`] } },
  }, opts, true);
});

// ---------- not justified is not false ----------
export const rejectVerdict: Gen = (R, n) => fitted('rejectVerdict', () => {
  const k = pick(R, ['tan', 'diam', 'cyc', 'tan', 'diam', 'cyc']);
  const stated = R() < 0.3;
  const th = r(R, 0, 359);
  let spec: CSpec, givens: string, step: string, missing: string, claimFalse: string;
  if (k === 'tan') {
    const Q = add(mul(dirv(th), R0), mul(dirv(th + 90), R0 * 0.8));
    spec = { center: 'O', on: { A: th }, pts: { Q }, segs: ['OA', { id: 'AQ', kind: 'line', ext: [R0 * 0.6, R0 * 0.1], col: 'ink' }] };
    givens = stated ? 'O is the center; A is on the circle; line AQ is tangent to the circle at A.' : 'O is the center; A is on the circle; line AQ passes through A.';
    step = 'm∠OAQ = 90° (tangent ⊥ radius)'; missing = 'nothing says line AQ is tangent'; claimFalse = '∠OAQ is not a right angle';
  } else if (k === 'diam') {
    spec = { center: stated ? 'O' : null, on: { A: th, B: th + 180, C: th + r(R, 200, 340) }, segs: ['AB', 'CA', 'CB'] };
    givens = stated ? 'A, B and C lie on circle O; AB passes through the center O.' : 'A, B and C lie on a circle; AB is the longest chord in the figure.';
    step = 'm∠ACB = 90° (angle inscribed in a semicircle)'; missing = 'nothing says AB passes through the center'; claimFalse = '∠ACB is not a right angle';
  } else {
    const arcs = splitArcs(R, 4, 50, 130), [A, B, C, D] = placeCcw(th, arcs);
    const angA = (arcs[1]! + arcs[2]!) / 2;
    if (!Number.isInteger(angA)) throw new Error('half');
    spec = { center: null, on: { A: A!, B: B!, C: C!, D: D! }, segs: ['AB', 'BC', 'CD', 'DA'], angles: [{ id: 'DAB', col: 'first', text: dg(angA), r: 56 }] };
    givens = stated ? `A, B, C and D lie on one circle; m∠DAB = ${angA}°.` : `A, B and C lie on a circle; m∠DAB = ${angA}°.`;
    step = `m∠BCD = ${180 - angA}° (inscribed quadrilateral)`; missing = 'nothing says D is on the circle'; claimFalse = `m∠BCD is not ${180 - angA}°`;
  }
  const fig = cfig(spec);
  const opts: Opt[] = [
    { t: 'justified: every condition of the theorem is given', ok: stated, mc: stated ? undefined : MC.noHyp, say: stated ? 'Right: the condition is among the givens.' : `Not justified: ${missing}.` },
    { t: `not justified: ${missing}`, ok: !stated, mc: stated ? MC.failedDisproof : undefined, say: stated ? 'It IS given; read the givens again.' : 'Right: a missing condition means the step is not justified, which is not the same as false.' },
    { t: `false: ${claimFalse}`, mc: MC.failedDisproof, say: 'A missing reason does not make the claim false: it may well be true, it is just not proved.' },
  ];
  return choose(R, tR(R, 'ABCDQ'), {
    id: `rejectVerdict-${n}`, family: 'rejectVerdict', prompt: `Givens: ${givens} A student writes: ${step}. Use only the givens (a figure proves nothing). What is your verdict on the step?`, board: '\\text{justified?}',
    solution: [stated ? 'The theorem\'s condition is in the givens.' : `The theorem needs a condition: ${missing.replace('nothing says ', '')}.`, stated ? 'The step is justified.' : 'It is not given, so the step is not justified. That does not prove the claim false.'],
    picture: { cfig: fig, card: { lines: [`Givens: ${givens}`, `Step: ${step}`] } },
  }, opts, true);
});

// ---------- converse and contrapositive ----------
type Thm = { name: string; thm: string; conv: string; contra: string; inv: string; convStatus: 'disproved' | 'open' | 'proved'; cx?: string };
const THMS: Thm[] = [
  { name: 'same-arc', thm: 'If two inscribed angles intercept the same arc, then they are congruent.', conv: 'If two inscribed angles are congruent, then they intercept the same arc.', contra: 'If two inscribed angles are not congruent, then they do not intercept the same arc.', inv: 'If two inscribed angles do not intercept the same arc, then they are not congruent.', convStatus: 'disproved', cx: 'two inscribed angles of 40° standing on two different 80° arcs' },
  { name: 'semicircle', thm: 'If an inscribed angle stands on a diameter, then it is a right angle.', conv: 'If an inscribed angle is a right angle, then it stands on a diameter.', contra: 'If an inscribed angle is not a right angle, then it does not stand on a diameter.', inv: 'If an inscribed angle does not stand on a diameter, then it is not a right angle.', convStatus: 'open' },
  { name: 'tangent', thm: 'If a line is tangent to a circle, then it is perpendicular to the radius drawn to the point of tangency.', conv: 'If a line through a point of a circle is perpendicular to the radius there, then it is tangent to the circle.', contra: 'If a line through a point of a circle is not perpendicular to the radius there, then it is not tangent there.', inv: 'If a line is not tangent to a circle, then it is not perpendicular to the radius at that point.', convStatus: 'open' },
  { name: 'cyclic', thm: 'If a quadrilateral is inscribed in a circle, then its opposite angles are supplementary.', conv: 'If the opposite angles of a quadrilateral are supplementary, then it can be inscribed in a circle.', contra: 'If the opposite angles of a quadrilateral are not supplementary, then it cannot be inscribed in a circle.', inv: 'If a quadrilateral is not inscribed in a circle, then its opposite angles are not supplementary.', convStatus: 'open' },
  { name: 'pythagoras', thm: 'If a triangle is a right triangle with legs a and b and hypotenuse c, then a² + b² = c².', conv: 'If a triangle has sides a, b and c with a² + b² = c², then it is a right triangle.', contra: 'If a² + b² ≠ c² for a triangle\'s sides, then it is not a right triangle with hypotenuse c.', inv: 'If a triangle is not a right triangle, then a² + b² ≠ c².', convStatus: 'proved' },
];
export const converseClass: Gen = (R, n) => {
  const T = pick(R, THMS);
  const st = T.convStatus;
  const opts: Opt[] = [
    { t: st === 'disproved' ? `The converse is false: a counterexample is ${T.cx}.` : st === 'proved' ? 'The converse is true: it has its own proof (the Converse of the Pythagorean Theorem).' : 'The converse is not yet established: it needs its own proof (the theorem does not prove it).', ok: true, say: st === 'disproved' ? 'Right: one counterexample disproves it.' : st === 'proved' ? 'Right: proved separately, not because the theorem is true.' : 'Right: a converse is a new claim; until it is proved, it is open, not false.' },
    { t: 'The converse is true, because the theorem is true.', mc: MC.converse, say: 'A converse is a different statement: the theorem being true says nothing about it.' },
    { t: 'The converse is false, because it was never proved.', mc: MC.failedDisproof, say: 'Not proved is not the same as false.' },
    { t: `The converse is: ${prose(T.contra)}`, mc: MC.contraConv, say: 'That negates and swaps: the contrapositive. The converse only swaps.' },
  ];
  return choose(R, null, { id: `converseClass-${n}`, family: 'converseClass', prompt: `Theorem: ${prose(T.thm)} Its converse: ${prose(T.conv)} Which describes the converse?`, board: '\\text{converse}',
    solution: ['The converse swaps the if and the then: it is a new claim.', st === 'disproved' ? `It fails: ${T.cx}.` : st === 'proved' ? 'It has its own proof.' : 'Nothing so far proves it, and no counterexample is known: not yet established.'],
    picture: { card: { lines: [`Theorem: ${T.thm}`, `Converse: ${T.conv}`] } } }, opts);
};
export const contraForm: Gen = (R, n) => {
  const T = pick(R, THMS.filter(t => t.name !== 'pythagoras'));
  const opts: Opt[] = [
    { t: `${prose(T.contra)} (true, like the theorem)`, ok: true, say: 'Right: negate both parts and swap them; it is equivalent to the theorem.' },
    { t: `${prose(T.conv)} (true, like the theorem)`, mc: MC.contraConv, say: 'That only swaps: the converse, which is a different claim.' },
    { t: `${prose(T.inv)} (true, like the theorem)`, mc: MC.inverse, say: 'That only negates: the inverse, which is not equivalent.' },
    { t: `${prose(T.contra)} (may be false: it needs its own proof)`, mc: MC.converse, say: 'The contrapositive is ALWAYS as true as the theorem: no new proof is needed.' },
  ];
  return choose(R, null, { id: `contraForm-${n}`, family: 'contraForm', prompt: `Theorem: ${prose(T.thm)} Which is its contrapositive, and is it true?`, board: '\\neg q \\Rightarrow \\neg p',
    solution: ['Contrapositive: if NOT (then-part), then NOT (if-part).', 'It is equivalent to the theorem, so it is true.'], picture: { card: { lines: [`Theorem: ${T.thm}`] } } }, opts);
};
export const contraUse: Gen = (R, n) => fitted('contraUse', () => {
  const k = pick(R, ['semiC', 'tanC', 'semiConv', 'semiThm', 'cycC']);
  const th = r(R, 0, 359);
  const choices = ['the theorem itself', 'its converse (proved separately)', 'its contrapositive', 'the figure: it looks that way'];
  let spec: CSpec | null, facts: string, concl: string, thm: string, right: number;
  if (k === 'semiC') {
    const m = 2 * r(R, 70, 86);
    spec = { center: null, on: { A: th, B: th + m, C: th + m + r(R, 50, 360 - m - 50) }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'ACB', col: 'first', text: dg(m / 2), r: 52 }] };
    facts = `A, B and C lie on a circle; m∠ACB = ${m / 2}°.`; concl = 'AB is not a diameter.'; thm = 'an inscribed angle on a diameter is a right angle'; right = 2;
  } else if (k === 'tanC') {
    const a = r(R, 60, 82), u = dirv(th + 180 - a);
    spec = { center: 'O', on: { A: th }, pts: { Q: add(mul(dirv(th), R0), mul(u, R0 * 0.8)) }, segs: ['OA', { id: 'AQ', kind: 'line', ext: [R0 * 0.6, R0 * 0.1], col: 'ink' }], angles: [{ id: 'OAQ', col: 'first', text: dg(a), r: 50 }] };
    facts = `A is on circle O; line AQ passes through A and m∠OAQ = ${a}°.`; concl = 'line AQ is not tangent to the circle at A.'; thm = 'a tangent is perpendicular to the radius at the point of tangency'; right = 2;
  } else if (k === 'semiConv') {
    spec = { center: null, on: { A: th, B: th + 180, C: th + r(R, 200, 340) }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'ACB', col: 'first', text: '90°', r: 46 }] };
    facts = 'A, B and C lie on a circle; m∠ACB = 90°.'; concl = 'AB is a diameter.'; thm = 'an inscribed angle on a diameter is a right angle'; right = 1;
  } else if (k === 'semiThm') {
    spec = { center: 'O', on: { A: th, B: th + 180, C: th + r(R, 200, 340) }, segs: ['AB', 'CA', 'CB'] };
    facts = 'AB is a diameter of circle O, and C is on the circle.'; concl = 'm∠ACB = 90°.'; thm = 'an inscribed angle on a diameter is a right angle'; right = 0;
  } else {
    const a = r(R, 60, 80), c = r(R, 85, 115);
    spec = null;
    facts = `Quadrilateral ABCD has m∠A = ${a}° and m∠C = ${c}° (sum ${a + c}°).`; concl = 'ABCD cannot be inscribed in a circle.'; thm = 'opposite angles of an inscribed quadrilateral are supplementary'; right = 2;
  }
  const mcFor = (i: number): string | undefined => i === 3 ? MC.appearance : right === 2 && i === 1 ? MC.contraConv : right === 1 && i === 2 ? MC.contraConv : right === 1 && i === 0 ? MC.converse : right === 2 && i === 0 ? MC.inverse : right === 0 && i === 1 ? MC.converse : undefined;
  const why = ['The givens match the theorem\'s if-part: the theorem itself gives the conclusion.', 'The givens match the then-part, and the conclusion is the if-part: that is the converse, which has its own proof (a 90° inscribed angle stands on a 180° arc).', 'The givens deny the then-part, and the conclusion denies the if-part: the contrapositive, which is equivalent to the theorem.', 'A look licenses nothing.'];
  const opts: Opt[] = choices.map((t, i) => ({ t, ok: i === right, mc: mcFor(i), say: i === right ? `Right: ${why[i]}` : why[right]! }));
  const fig = spec ? cfig(spec) : undefined;
  return choose(R, tR(R, 'ABCDQ'), { id: `contraUse-${n}`, family: 'contraUse', prompt: `Theorem: ${prose(thm)}. Facts: ${facts} Conclusion: ${concl} Which statement licenses the conclusion?`, board: '\\text{which form?}',
    solution: [why[right]!], picture: fig ? { cfig: fig, card: { lines: [`Theorem: ${thm}.`, `Facts: ${facts}`, `Conclusion: ${concl}`] } } : { card: { lines: [`Theorem: ${thm}.`, `Facts: ${facts}`, `Conclusion: ${concl}`] } } }, opts, true);
});

// ---------- the right-angle-diameter converse ----------
export const rightDiameter: Gen = (R, n) => fitted('rightDiameter', () => {
  const k = pick(R, ['why', 'inside', 'hyp']);
  const th = r(R, 0, 359);
  if (k === 'inside') {
    // a right angle with its vertex E inside the circle: AB is not a diameter
    const m = r(R, 110, 150), A = th, B = th + m;
    const Ap = mul(dirv(A), R0), Bp = mul(dirv(B), R0), M = mul(add(Ap, Bp), 0.5), half = dist(Ap, Bp) / 2;
    const E = add(M, mul(dirv(A + m / 2), -half * 0.0001 + 0));
    void E;
    // E on the circle with diameter AB (Thales), inside circle O: on the side away from the center
    const out = dirv(A + m / 2);
    const Ein: Pt = add(M, mul(out, half * 0.6)), w = Math.sqrt(half * half - (half * 0.6) ** 2), side: Pt = mul([out[1], -out[0]], w);
    const Ep = add(Ein, side);
    if (dist(Ep, [0, 0]) > R0 * 0.92) throw new Error('outside');
    const fig = cfig({ center: null, on: { A, B }, pts: { E: Ep }, segs: ['EA', 'EB', 'AB'], angles: [{ id: 'AEB', col: 'first', box: true, r: 30 }] });
    const opts: Opt[] = [
      { t: 'not from this: the converse needs the vertex ON the circle', ok: true, say: 'Right: E is inside, so ∠AEB is not an inscribed angle.' },
      { t: 'yes: any right angle in a circle stands on a diameter', mc: MC.anyRight, say: 'Only an INSCRIBED right angle (vertex on the circle) does.' },
      { t: 'yes: AB looks like a diameter', mc: MC.appearance, say: 'A look is not a reason.' },
    ];
    return choose(R, tR(R, 'ABE'), { id: `rightDiameter-${n}`, family: 'rightDiameter', prompt: 'A and B lie on a circle; E is inside the circle (not on it); m∠AEB = 90°. Does the right angle prove that AB is a diameter?', board: 'm\\angle AEB = 90^\\circ',
      solution: ['The converse: if an INSCRIBED angle is right, its chord is a diameter.', 'E is not on the circle: the converse does not apply.'], picture: { cfig: fig } }, opts);
  }
  const C = th + r(R, 200, 340);
  const fig = cfig({ center: null, on: { A: th, B: th + 180, C }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'ACB', col: 'first', box: true, r: 30 }], arcs: [{ from: 'A', to: 'B', col: 'link', thin: true, solve: true }] });
  if (k === 'why') {
    const opts: Opt[] = [
      { t: '∠ACB intercepts an arc of 2 × 90° = 180°, so A and B split the circle into two semicircles and AB passes through the center', ok: true, say: 'Right: the arc, then the semicircle, then the center.' },
      { t: 'every right angle in a circle stands on a diameter', mc: MC.anyRight, say: 'Only an inscribed one: its vertex must be on the circle.' },
      { t: 'the converse of a true theorem is true', mc: MC.converse, say: 'A converse needs its own proof; this one has it (the arc argument).' },
      { t: 'AB looks like it passes through the center', mc: MC.appearance, say: 'A look is not a proof.' },
    ];
    return choose(R, tR(R, 'ABC'), { id: `rightDiameter-${n}`, family: 'rightDiameter', prompt: 'A, B and C lie on a circle, and the inscribed angle ∠ACB is a right angle. Why must AB be a diameter?', board: 'm\\angle ACB = 90^\\circ \\Rightarrow \\overline{AB}\\ \\text{diameter}',
      solution: ['An inscribed angle is half its arc, so the arc ∠ACB intercepts measures 180°.', 'A 180° arc is a semicircle: its chord AB passes through the center.'], picture: { cfig: fig } }, opts);
  }
  const opts: Opt[] = [
    { t: 'the vertex C is on the circle, both sides are chords, and m∠ACB = 90°', ok: true, say: 'Right: an inscribed right angle.' },
    { t: 'm∠ACB = 90°, and nothing else', mc: MC.anyRight, say: 'The vertex must be on the circle too.' },
    { t: 'AB is a diameter, and C is on the circle', mc: MC.converse, say: 'That is the original theorem\'s hypothesis; the converse starts from the right angle.' },
  ];
  return choose(R, tR(R, 'ABC'), { id: `rightDiameter-${n}`, family: 'rightDiameter', prompt: 'To conclude "AB is a diameter" from the converse of the semicircle theorem, what must be known about ∠ACB?', board: '\\text{hypotheses}',
    solution: ['The converse: if an inscribed angle is right, its chord is a diameter.', 'Inscribed: vertex on the circle, sides chords.'], picture: { cfig: fig } }, opts);
});
export const findCenter: Gen = (R, n) => fitted('findCenter', () => {
  const th = r(R, 0, 359), d2 = th + r(R, 50, 130);
  const C = th + r(R, 20, 160), F = d2 + 180 + r(R, 20, 160);
  const angs = [th, th + 180, C, d2, d2 + 180, F].map(x => ((x % 360) + 360) % 360).sort((a, b) => a - b);
  if (angs.some((x, i) => (i ? x - angs[i - 1]! : x + 360 - angs[angs.length - 1]!) < 16)) throw new Error('crowded');
  const fig = cfig({ center: null, on: { A: th, B: th + 180, C, D: d2, E: d2 + 180, F }, pts: { M: [0, 0] }, segs: ['AB', 'DE', 'CA', 'CB', 'FD', 'FE'], angles: [{ id: 'ACB', col: 'first', box: true, r: 30 }, { id: 'DFE', col: 'second', box: true, r: 30 }] });
  const opts: Opt[] = [
    { t: 'M, where chords AB and DE cross', ok: true, say: 'Right: both are diameters (inscribed right angles), and two diameters meet at the center.' },
    { t: 'C, the vertex of a right angle', mc: MC.onCenter, say: 'C is on the circle; the center is inside, on the diameters.' },
    { t: 'F, the vertex of a right angle', mc: MC.onCenter, say: 'F is on the circle; the center is inside, on the diameters.' },
    { t: 'the midpoint of chord CA', mc: MC.anyRight, say: 'Chord CA is not shown to be a diameter.' },
  ];
  return choose(R, tR(R, 'ABCDEFM'), { id: `findCenter-${n}`, family: 'findCenter', prompt: 'A, B, C, D, E and F lie on a circle. ∠ACB and ∠DFE are inscribed right angles. Which point is the center of the circle?', board: '\\text{center?}',
    solution: ['An inscribed right angle stands on a diameter: AB and DE are diameters.', 'Every diameter passes through the center, so the center is where they cross: M.'], picture: { cfig: fig, reveal: { glow: ['AB', 'DE'] } } }, opts);
});

// ---------- proofs ----------
function picOf(p: CProof, ask: { i: number; cell: 'st' | 'rs' }[]) {
  const rows = p.rows.map((x, i) => ({ st: ask.some(a => a.i === i && a.cell === 'st') ? '' : x.st, rs: ask.some(a => a.i === i && a.cell === 'rs') ? '' : x.rs }));
  return { cfig: p.fig, proof: { given: p.given, prove: p.prove, rows, ask }, reveal: { fill: ask.map(a => (a.cell === 'st' ? { i: a.i, st: p.rows[a.i]!.st } : { i: a.i, rs: p.rows[a.i]!.rs })) } };
}
function reasonItem(R: () => number, n: number, fam: string, ids: CProofId[]): CItem {
  return fitted(fam, () => {
    const p = makeProof(pick(R, ids), R);
    const i = r(R, 0, p.rows.length - 1), row = p.rows[i]!;
    const opts: Opt[] = [{ t: row.rs, ok: true, say: `Right: ${row.rs}.` }, ...shuffle(R, row.wrong.slice()).slice(0, 3).map(w => ({ t: w.t, mc: w.mc, say: w.say }))];
    return choose(R, tR(R, p.roles), {
      id: `${fam}-${n}`, family: fam, prompt: `Proof: ${p.name}. Which reason belongs in line ${i + 1}?`, board: row.st,
      solution: [`Line ${i + 1}: ${texHtml(row.st)}.`, row.uses.length ? `It uses line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(', ')}.` : 'It uses only the givens and the figure\'s definitions.', `The reason: ${row.rs}.`],
      picture: picOf(p, [{ i, cell: 'rs' }]),
    }, opts);
  });
}
function stmtItem(R: () => number, n: number, fam: string, ids: CProofId[]): CItem {
  return fitted(fam, () => {
    const p = makeProof(pick(R, ids), R);
    const i = r(R, 0, p.rows.length - 2), row = p.rows[i]!;
    const opts: Opt[] = [{ t: texHtml(row.st), ok: true, say: `Right: “${row.rs}” gives exactly this.` }];
    for (const d of p.decoys) opts.push({ t: texHtml(d.st), mc: d.mc, say: `Not this: ${d.why}` });
    opts.push({ t: texHtml(p.prove), mc: MC.circular, say: 'That is the conclusion: it cannot come before the lines that prove it.' });
    return choose(R, tR(R, p.roles), {
      id: `${fam}-${n}`, family: fam, prompt: `Proof: ${p.name}. Which statement belongs in line ${i + 1} (reason: ${prose(row.rs)})?`, board: p.prove,
      solution: [`Line ${i + 1} has the reason “${row.rs}”${row.uses.length ? `, using line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(', ')}` : ''}.`, `It gives ${texHtml(row.st)}.`],
      picture: picOf(p, [{ i, cell: 'st' }]),
    }, opts);
  });
}
export const proofBase: Gen = (R, n) => (R() < 0.6 ? reasonItem(R, n, 'proofBase', ['base']) : stmtItem(R, n, 'proofBase', ['base']));
export const proofSum: Gen = (R, n) => (R() < 0.6 ? reasonItem(R, n, 'proofSum', ['sum', 'sumObtuse']) : stmtItem(R, n, 'proofSum', ['sum', 'sumObtuse']));
export const proofDiff: Gen = (R, n) => {
  if (R() < 0.3) {
    const fig = makeProof('diff', R).fig;
    const opts: Opt[] = [
      { t: 'the center is on a side of the angle, inside it, or outside it: there is no other place, and each case is proved', ok: true, say: 'Right: the three cases cover every inscribed angle.' },
      { t: 'three different drawings all worked', mc: MC.examples, say: 'Drawings are examples; the three CASES are proofs that cover every position of the center.' },
      { t: 'the base case alone covers every inscribed angle', mc: MC.caseSplit, say: 'The base case needs the center ON a side; the other two positions need their own argument.' },
      { t: 'the center-outside case is the same as the center-inside case', mc: MC.diffAdded, say: 'Outside, the base cases are SUBTRACTED, not added.' },
    ];
    return fitted('proofDiff', () => choose(R, tR(R, 'ABCD'), { id: `proofDiff-${n}`, family: 'proofDiff', prompt: 'The Inscribed Angle Theorem is proved in three cases: the center on a side, inside, and outside the angle. Why do the three cases prove it for EVERY inscribed angle?', board: '\\text{three cases}',
      solution: ['Wherever the center is, it is on a side of the angle, inside it, or outside it.', 'Each case has its own proof, so every inscribed angle is covered.'], picture: { cfig: fig } }, opts));
  }
  return R() < 0.6 ? reasonItem(R, n, 'proofDiff', ['diff']) : stmtItem(R, n, 'proofDiff', ['diff']);
};
export const proofCyclic: Gen = (R, n) => {
  if (R() < 0.25) {
    const fig = makeProof('cyclic', R).fig;
    const a = r(R, 62, 118);
    const opts: Opt[] = [
      { t: 'no: it shows one quadrilateral; the proof with arcs u and v (u + v = 360°) covers every one', ok: true, say: 'Right: an example checks one case; a proof covers all.' },
      { t: 'yes: an exact measurement is a proof', mc: MC.examples, say: 'A measurement is one example, and only as exact as the protractor.' },
      { t: 'yes, if it is checked on three different quadrilaterals', mc: MC.examples, say: 'Three examples are still examples.' },
    ];
    return fitted('proofCyclic', () => choose(R, tR(R, 'ABCD'), { id: `proofCyclic-${n}`, family: 'proofCyclic', prompt: `${prose('One student measures an inscribed quadrilateral')}: m∠A = ${a}° and m∠C = ${180 - a}°, which add to 180°. Is that a proof that opposite angles of an inscribed quadrilateral are supplementary?`, board: `${a}^\\circ + ${180 - a}^\\circ = 180^\\circ`,
      solution: ['A measured example checks one quadrilateral.', 'The proof uses arcs u and v with u + v = 360°, so m∠A + m∠C = ½(u + v) = 180° for every one.'], picture: { cfig: fig } }, opts));
  }
  return R() < 0.6 ? reasonItem(R, n, 'proofCyclic', ['cyclic']) : stmtItem(R, n, 'proofCyclic', ['cyclic']);
};
export const proofChord: Gen = (R, n) => (R() < 0.6 ? reasonItem(R, n, 'proofChord', ['chordIn', 'chordOut', 'tanChord']) : stmtItem(R, n, 'proofChord', ['chordIn', 'chordOut', 'tanChord']));
export const chainReason: Gen = (R, n) => (R() < 0.65 ? reasonItem(R, n, 'chainReason', CHAINS) : stmtItem(R, n, 'chainReason', CHAINS));

// ---------- real-world ----------
export const realWorld: Gen = (R, n) => fitted('realWorld', () => {
  const k = pick(R, ['track', 'satellite', 'paths', 'camera']);
  const th = r(R, 0, 359);
  if (k === 'track' || k === 'satellite') {
    const sat = k === 'satellite';
    const p = sat ? r(R, 120, 150) : r(R, 40, 100), m = 180 - p, P = tanMeet(th, th + m);
    if (dist(P, [0, 0]) > R0 * (sat ? 6 : 2.6)) throw new Error('far');
    const toArc = sat || R() < 0.5;
    const fig = cfig({ center: null, on: { A: th, B: th + m }, pts: { P }, segs: ['PA', 'PB'], angles: [{ id: 'APB', col: toArc ? 'first' : 'link', text: toArc ? dg(p) : '?', alt: toArc ? undefined : dg(p), r: 60 }], arcs: [{ from: 'A', to: 'B', col: toArc ? 'link' : 'first', text: toArc ? '?' : dg(m), alt: toArc ? dg(m) : undefined }] });
    const story = sat ? `A satellite at P sees Earth between two sight lines that just touch Earth (tangents PA and PB). The angle between them is ${p}°.` : `A coach at P outside a circular track sights along two lines that just touch the track at A and B (tangents).${toArc ? ` The angle between the sight lines is ${p}°.` : ` The near arc of track between A and B measures ${m}°.`}`;
    return numQ(tR(R, 'ABP'), { id: `realWorld-${n}`, family: 'realWorld', prompt: `${story} ${toArc ? `What is ${mArc('AB')}, the arc ${sat ? 'of Earth the satellite can see' : 'of track between the touching points'}?` : 'What is the angle between the sight lines?'}`, board: `m\\angle APB = 180^\\circ - m\\overparen{AB}`, unit: '°',
      solution: ['Two tangents: the angle at P is half (far arc − near arc) = 180° − the near arc.', toArc ? `Near arc = 180° − ${p}° = ${S(m)}°.` : `180° − ${m}° = ${S(p)}°.`], picture: { cfig: fig, reveal: { solved: toArc ? ['AB'] : ['APB'] } } },
      toArc ? m : p, toArc ? [{ v: 2 * p, mc: MC.inscribedOff, say: 'P is outside the circle: not twice the angle; use 180° minus it.' }, { v: p, say: 'The angle and the near arc are supplementary.' }, { v: 360 - m, mc: MC.wrongArc, say: 'That is the far arc; the visible arc is the near one.' }] : [{ v: m / 2, mc: MC.inscribedOff, say: 'P is outside: 180° minus the arc, not half of it.' }, { v: m, say: 'Supplementary, not equal.' }], ok, 'Two tangents: angle = 180° − near arc.');
  }
  if (k === 'paths') {
    const arcs = splitArcs(R, 4, 40, 140);
    if ((arcs[0]! + arcs[2]!) % 2) throw new Error('odd');
    const [A, B, C, D] = placeCcw(th, arcs);
    const E = cross(mul(dirv(A!), R0), mul(dirv(C!), R0), mul(dirv(B!), R0), mul(dirv(D!), R0));
    const x = (arcs[0]! + arcs[2]!) / 2;
    const fig = cfig({ center: null, on: { A: A!, B: B!, C: C!, D: D! }, pts: { E }, segs: ['AC', 'BD'], angles: [{ id: 'AEB', col: 'link', text: '?', alt: dg(x), r: 50 }], arcs: [{ from: 'A', to: 'B', col: 'first', text: dg(arcs[0]!) }, { from: 'C', to: 'D', col: 'second', text: dg(arcs[2]!) }] });
    return numQ(tR(R, 'ABCDE'), { id: `realWorld-${n}`, family: 'realWorld', prompt: `${prose('Two straight paths cross a circular park')}: path AC and path BD meet at E. The fence arcs between their ends measure ${mArc('AB')} = ${arcs[0]}° and ${mArc('CD')} = ${arcs[2]}°. What is ${mA('AEB')}?`, board: 'm\\angle AEB = \\tfrac{1}{2}(m\\overparen{AB} + m\\overparen{CD})', unit: '°',
      solution: ['Two chords meeting inside: half the sum of the intercepted arcs (proved with an auxiliary chord and an exterior angle).', `(${arcs[0]}° + ${arcs[2]}°) ÷ 2 = ${S(fmt(x))}°.`], picture: { cfig: fig, reveal: { solved: ['AEB'] } } },
      x, [{ v: arcs[0]! + arcs[2]!, mc: MC.notHalved, say: 'Add the arcs, then halve.' }, { v: (arcs[2]! - arcs[0]!) / 2, mc: MC.lastMethod, say: 'E is INSIDE the park: half the sum, not half the difference.' }, { v: 180 - x, mc: MC.wrongAngle, say: 'That is the neighbouring angle ∠BEC.' }], ok, 'Inside: half the sum of the arcs.');
  }
  // camera: secant-tangent
  const c = tanSecConf(R, { near: [30, 90], maxFar: 178 });
  if ((c.far - c.near) % 2) throw new Error('odd');
  const x = (c.far - c.near) / 2;
  const fig = cfig({ center: null, on: { T: c.T, A: c.A, B: c.B }, pts: { P: c.P }, segs: ['PB', { id: 'PT', kind: 'line', ext: [0, R0 * 0.4], col: 'ink' }], angles: [{ id: 'TPB', col: 'link', text: '?', alt: dg(x), r: 60 }], arcs: [{ from: 'T', to: 'A', col: 'first', text: dg(c.near) }, { from: 'B', to: 'T', col: 'second', text: dg(c.far) }] });
  return numQ(tR(R, 'ABPT'), { id: `realWorld-${n}`, family: 'realWorld', prompt: `${prose('A camera stands outside a round fountain')} at P. One sight line just touches the rim at T; the other crosses the rim at A and B. ${mArc('TA')} = ${c.near}° and ${mArc('TB')} = ${c.far}° (the arcs between the lines). What is the angle ∠TPB between the sight lines?`, board: 'm\\angle TPB = \\tfrac{1}{2}(m\\overparen{TB} - m\\overparen{TA})', unit: '°',
    solution: ['A tangent and a secant from P: half (far arc − near arc).', `(${c.far}° − ${c.near}°) ÷ 2 = ${S(fmt(x))}°.`], picture: { cfig: fig, reveal: { solved: ['TPB'] } } },
    x, [{ v: (c.far + c.near) / 2, mc: MC.interiorRule, say: 'P is outside: half the DIFFERENCE.' }, { v: c.far - c.near, mc: MC.notHalved, say: 'Subtract, then halve.' }], ok, 'Outside: half (far − near).');
});
void secSecConf; void CHAINS;
