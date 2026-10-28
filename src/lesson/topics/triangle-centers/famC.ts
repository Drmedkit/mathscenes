// famC.ts: stage 3 of "Midsegments and points of concurrency": the proofs (perpendicular-bisector and angle-bisector
// theorems and converses, the two concurrency arguments, the midsegment theorem, the two-thirds point and the
// medians' concurrence) as reason / statement / order items on the course's proof frame, the converse statements and
// the interior condition, critiques of flawed arguments, and two real contexts (a brace, a shared water tower).
import type { Pt } from '../geometry-foundations/geo';
import { dist } from '../geometry-foundations/geo';
import { htm } from '../geometry-foundations/proofs';
import { type Kind, type Tri, circumcenterOf, footOf as foot0, kindOf, makeTri, mid, whereIs } from './centers';
import { ptsOf } from './tfigs';
import { MCX, type ProofId, type TCProof, RS, makeTCProof, validOrder } from './tcProofs';
import { type Gen, type Opt, type TCItem, MC, NAMES, box, choice, choiceT, fig, fitted, lbl, numT, pick, r, relabel, segN, shuffle, tick } from './tkit';

const tri = (s: string) => `△${s}`;
/** board / proof TeX -> panel text */
export const htm2 = (s: string) => htm(s.replace(/\\tfrac12/g, '½').replace(/\\tfrac23/g, '⅔').replace(/\\ell_1/g, 'ℓ₁').replace(/\\ell_2/g, 'ℓ₂').replace(/\\ell_3/g, 'ℓ₃').replace(/\\triangle\s*/g, '△'));
const givenOf = (p: TCProof) => p.given;
function picOf(p: TCProof, ask: { i: number; cell: 'st' | 'rs' }[]) {
  const rows = p.rows.map((x, i) => ({ st: ask.some(a => a.i === i && a.cell === 'st') ? '' : x.st, rs: ask.some(a => a.i === i && a.cell === 'rs') ? '' : x.rs }));
  return { fig: p.fig, proof: { given: givenOf(p), prove: p.prove, rows, ask }, reveal: { fill: ask.map(a => (a.cell === 'st' ? { i: a.i, st: p.rows[a.i]!.st } : { i: a.i, rs: p.rows[a.i]!.rs })) } };
}
/** which reason belongs in line i */
function reasonItem(R: () => number, n: number, fam: string, id: ProofId, rows?: number[]): TCItem {
  return fitted(fam, () => {
    const p = makeTCProof(id, R), t = relabel(R, p.roles);
    const i = pick(R, rows ?? p.rows.map((_, k) => k)), row = p.rows[i]!;
    const opts: Opt[] = [{ t: row.rs, ok: true, say: `Right: ${row.rs}.` }, ...shuffle(R, row.wrong.slice()).slice(0, 3).map(w => ({ t: w.t, mc: w.mc, say: w.say }))];
    return choiceT(R, t, {
      id: `${fam}-${n}`, family: fam, prompt: `Which reason belongs in line ${i + 1}?`, board: row.st,
      solution: [`Line ${i + 1}: ${htm2(row.st)}.`, row.uses.length ? `It uses line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(' and ')}.` : 'It uses only the givens and the figure.', `The reason: ${row.rs}.`],
      picture: picOf(p, [{ i, cell: 'rs' }]),
    }, opts);
  });
}
/** which statement belongs in line i (decoys: the proof's decoy lines, the target too early) */
function stmtItem(R: () => number, n: number, fam: string, id: ProofId, rows?: number[]): TCItem {
  return fitted(fam, () => {
    const p = makeTCProof(id, R), t = relabel(R, p.roles);
    const i = pick(R, rows ?? p.rows.map((_, k) => k).filter(k => k < p.rows.length - 1)), row = p.rows[i]!;
    const opts: Opt[] = [{ t: htm2(row.st), ok: true, say: `Right: the ${row.rs} gives exactly this.` }];
    for (const d of p.decoys) if (htm2(d.st) !== htm2(row.st)) opts.push({ t: htm2(d.st), mc: d.mc, say: `Not this: ${d.why}` });
    if (i < p.rows.length - 1 && htm2(p.prove) !== htm2(row.st)) opts.push({ t: htm2(p.prove), mc: MC.circular, say: 'That is the conclusion: it cannot come before the lines that prove it.' });
    return choiceT(R, t, {
      id: `${fam}-${n}`, family: fam, prompt: `Which statement belongs in line ${i + 1} (reason: ${row.rs})?`, board: `\\text{line ${i + 1}: } \\, ?`,
      solution: [`Line ${i + 1} cites the ${row.rs}${row.uses.length ? `, using line${row.uses.length > 1 ? 's' : ''} ${row.uses.join(' and ')}` : ''}.`, `It gives ${htm2(row.st)}.`],
      picture: picOf(p, [{ i, cell: 'st' }]),
    }, opts);
  });
}
/** Parsons: which order of the lines (one decoy left out) proves it */
function orderItem(R: () => number, n: number, fam: string, id: ProofId): TCItem {
  return fitted(fam, () => {
    const p = makeTCProof(id, R), t = relabel(R, p.roles);
    const N = p.rows.length, decoy = pick(R, p.decoys);
    const items = shuffle(R, [...p.rows.map((x, i) => ({ st: x.st, rs: x.rs, row: i + 1 })), { st: decoy.st, rs: '', row: 0 }]);
    const letterOf = (row: number) => String.fromCharCode(65 + items.findIndex(x => x.row === row));
    const fmt = (o: number[]) => o.map(letterOf).join(', ');
    const canon = Array.from({ length: N }, (_, i) => i + 1);
    const opts: Opt[] = [{ t: fmt(canon), ok: true, say: 'Right: every line after the lines it uses, the conclusion last, the decoy left out.' }];
    const rep = canon.slice(); rep[r(R, 0, N - 2)] = 0;
    opts.push({ t: fmt(rep), mc: decoy.mc, say: `Line ${letterOf(0)} is the decoy: ${decoy.why}` });
    for (let k = 0; k < 80 && opts.length < 4; k++) {
      const o = canon.slice(), i = r(R, 0, N - 2), j = r(R, i + 1, N - 1);
      [o[i], o[j]] = [o[j]!, o[i]!];
      if (validOrder(p, o)) continue;
      const s = fmt(o);
      if (opts.some(x => x.t === s)) continue;
      opts.push({ t: s, mc: MCX.beforeEst, say: 'In that order a line uses a statement that only comes later.' });
    }
    // the pool letters A, B, C ... are row labels, not point names: only the proof, figure and reasons are relabelled
    const whyT = tw0(decoy.why, t);
    const base = { id: `${fam}-${n}`, family: fam, prompt: 'Put the lines in an order that proves it. One line is a decoy and is left out. Which order works?', board: p.prove, solution: [], picture: { fig: p.fig, proof: { given: givenOf(p), prove: p.prove, rows: items.map(x => ({ st: x.st, rs: x.rs })), pool: true }, reveal: { strike: [items.findIndex(x => x.row === 0)], rowOf: items.map(x => x.row) } } };
    const relab = choiceT(R, t, base, [{ t: 'x', ok: true, say: '' }]);
    return choice(R, { ...base, board: relab.board, picture: relab.picture, solution: [`Start from the givens; each line comes after the lines it uses, the conclusion last: ${fmt(canon)}.`, `Line ${letterOf(0)} is the decoy: ${whyT}`] }, opts.map(o => (o.mc === decoy.mc && o.say.startsWith('Line ') ? { ...o, say: `Line ${letterOf(0)} is the decoy: ${whyT}` } : o)));
  });
}
import { tw as tw0 } from './tkit';

// ---------- s3-perp-bisector-theorem-proof ----------
export const pbProofReason: Gen = (R, n) => {
  if (R() < 0.25) {
    const t = relabel(R, 'ABMP');
    return choiceT(R, t, {
      id: `pbProofReason-${n}`, family: 'pbProofReason', prompt: 'The proof of the Perpendicular Bisector Theorem uses △PMA and △PMB. What if P is the midpoint M itself?', board: 'P = M',
      solution: ['If P = M there are no triangles, but PA = MA and PB = MB.', 'M is the midpoint, so MA = MB: PA = PB still holds.', 'So: then PA = MA = MB = PB by the definition of midpoint.'],
      picture: { card: { lines: ['ℓ is the perpendicular bisector of AB at M. The proof used △PMA ≅ △PMB (SAS) for a point P on ℓ.', 'But P can also be M itself.'] } },
    }, [
      { t: 'then PA = MA = MB = PB by the definition of midpoint', ok: true, say: 'Right: the special case needs its own one-line argument.' },
      { t: 'the theorem fails there, since there are no triangles', mc: MC.someConds, say: 'The claim still holds; it just needs a different reason.' },
      { t: 'nothing changes: SAS still applies', say: 'With P = M the triangles collapse to segments.' },
    ]);
  }
  return reasonItem(R, n, 'pbProofReason', 'pbThm');
};
export const pbProofOrder: Gen = (R, n) => orderItem(R, n, 'pbProofOrder', 'pbThm');

// ---------- s3-perp-bisector-converse-proof ----------
export const pbConvReason: Gen = (R, n) => {
  if (R() < 0.25) {
    const t = relabel(R, 'ABMP');
    return choiceT(R, t, {
      id: `pbConvReason-${n}`, family: 'pbConvReason', prompt: 'The converse: if PA = PB, then P is on the perpendicular bisector of AB. The proof used △PMA and △PMB. What if P lies on AB itself?', board: 'PA = PB,\\ P \\text{ on } \\overline{AB}',
      solution: ['A point of AB with PA = PB is halfway between A and B.', 'So P is the midpoint M, which is on the perpendicular bisector.', 'So: then P is the midpoint M, which is on the bisector.'],
      picture: { card: { lines: ['PA = PB and M is the midpoint of AB. The proof used △PMA ≅ △PMB (SSS).', 'But P might lie on AB itself.'] } },
    }, [
      { t: 'then P is the midpoint M, which is on the bisector', ok: true, say: 'Right: the special case still fits the claim.' },
      { t: 'then the converse fails: no triangles, so no proof', mc: MC.someConds, say: 'The claim still holds: P must be M.' },
      { t: 'then P can be any point of AB', say: 'Only the midpoint is the same distance from A and B.' },
    ]);
  }
  return reasonItem(R, n, 'pbConvReason', 'pbConv');
};
export const converseState: Gen = (R, n, sg) => {
  const ab = sg === 's3-angle-bisector-converse-proof' ? R() < 0.8 : R() < 0.25;
  const t = relabel(R, 'ABC');
  if (!ab) return choiceT(R, t, {
    id: `converseState-${n}`, family: 'converseState', prompt: `Theorem: if a point is on the perpendicular bisector of ${segN('AB')}, then it is the same distance from A and B. Which statement is its converse, and is it automatically true?`, board: '\\text{the converse}',
    solution: ['A converse swaps the if-part and the then-part.', 'A converse is a new claim: it needs its own proof (here SSS and a linear pair).', 'So: if a point is the same distance from A and B, then it is on the perpendicular bisector; it needs its own proof.'],
    picture: { card: { lines: ['Theorem: if a point is on the perpendicular bisector of AB, then it is the same distance from A and B.'] } },
  }, [
    { t: 'if a point is the same distance from A and B, then it is on the perpendicular bisector; it needs its own proof', ok: true, say: 'Right: swapped, and proved separately.' },
    { t: 'if a point is the same distance from A and B, then it is on the perpendicular bisector; it is true because the theorem is', mc: MC.converse, say: 'A converse is not true just because the theorem is: it needs its own proof.' },
    { t: 'if a point is not on the perpendicular bisector, then it is not the same distance from A and B; it needs its own proof', mc: 'mc.geometric-proof.wrong-clause-as-hypothesis', say: 'That negates both parts (the inverse); the converse swaps them.' },
  ]);
  return choiceT(R, t, {
    id: `converseState-${n}`, family: 'converseState', prompt: 'Theorem: if a point is on the bisector of ∠BAC, then it is the same distance from the two sides. Which statement is a TRUE converse?', board: '\\text{the converse}',
    solution: ['A converse swaps the if-part and the then-part.', 'Points the same distance from the two LINES also lie on the other (external) bisector, outside the angle.', 'So: if a point in the interior of ∠BAC is the same distance from its two sides, then it is on the bisector.'],
    picture: { card: { lines: ['Theorem: if a point is on the bisector of ∠BAC, then it is the same distance from the two sides of the angle.'] } },
  }, [
    { t: 'if a point in the interior of ∠BAC is the same distance from its two sides, then it is on the bisector', ok: true, say: 'Right: the interior condition is part of it.' },
    { t: 'if a point is the same distance from lines AB and AC, then it is on the bisector of ∠BAC', mc: MC.oneBis, say: 'Points on the external bisector are equidistant too: the point must be in the interior of the angle.' },
    { t: 'if a point is on the bisector of ∠BAC, then it is the same distance from the two sides', mc: 'mc.geometric-proof.wrong-clause-as-hypothesis', say: 'That is the theorem itself, not its converse.' },
  ]);
};

// ---------- s3-circumcenter-concurrency-proof ----------
export const concurChain: Gen = (R, n) => (R() < 0.55 ? reasonItem(R, n, 'concurChain', 'circConcur') : stmtItem(R, n, 'concurChain', 'circConcur', [1, 2]));

// ---------- s3-angle-bisector-theorem-proof / converse ----------
export const abProofReason: Gen = (R, n) => reasonItem(R, n, 'abProofReason', 'abThm');
export const abConvReason: Gen = (R, n) => {
  if (R() < 0.3) return fitted('abConvReason', () => {
    // a point on the external bisector: equidistant from the two LINES, outside the angle
    const half = r(R, 22, 34), a = (half * Math.PI) / 180, k = 300;
    const A: Pt = [0, 0], B: Pt = [k * 1.3 * Math.cos(a), k * 1.3 * Math.sin(a)], C: Pt = [k * 1.3 * Math.cos(a), -k * 1.3 * Math.sin(a)];
    const B2: Pt = [-B[0] * 0.8, -B[1] * 0.8], C2: Pt = [-C[0] * 0.8, -C[1] * 0.8];
    const Q: Pt = [0, k * 0.85 * (R() < 0.5 ? 1 : -1)];
    const E = foot0(Q, A, B), F = foot0(Q, A, C);
    const f = fig({ pts: { A, B, C, J: B2, K: C2, Q, E, F }, bare: ['J', 'K'], segs: ['JB', 'KC', 'QE', 'QF'], marks: [box('AEQ'), box('AFQ'), tick('QE', 1), tick('QF', 1)], segStyle: { JB: { kind: 'line' }, KC: { kind: 'line' } } });
    const t = relabel(R, 'ABCEFQ');
    return choiceT(R, t, {
      id: `abConvReason-${n}`, family: 'abConvReason', prompt: 'QE = QF: Q is the same distance from line AB and line AC. But Q is not on the bisector of ∠BAC. What does Q show?', board: 'QE = QF',
      solution: ['Q lies outside the angle BAC, on the other (external) bisector of the two lines.', 'So equal distances alone do not put a point on the bisector of ∠BAC.', 'So: the converse needs the point to be in the interior of the angle.'],
      picture: { fig: f, reveal: {} },
    }, [
      { t: 'the converse needs the point to be in the interior of the angle', ok: true, say: 'Right: Q is the counterexample that shows why.' },
      { t: 'Q must be on the bisector anyway, since QE = QF', mc: MC.oneBis, say: 'Equidistant points fill BOTH bisectors of the two lines; Q is on the external one.' },
      { t: 'the Angle Bisector Theorem is false', mc: MC.noHyp, say: 'The theorem (on the bisector, so equidistant) still holds; only the converse needs the interior condition.' },
    ]);
  });
  return reasonItem(R, n, 'abConvReason', 'abConv');
};

// ---------- s3-incenter-concurrency-proof ----------
export const inConcur: Gen = (R, n) => (R() < 0.5 ? reasonItem(R, n, 'inConcur', 'inConcur') : stmtItem(R, n, 'inConcur', 'inConcur', [2, 3]));

// ---------- s3-midsegment-proof ----------
export const midProofStep: Gen = (R, n) => {
  const id: ProofId = R() < 0.55 ? 'midA' : 'midB';
  return R() < 0.6 ? reasonItem(R, n, 'midProofStep', id) : stmtItem(R, n, 'midProofStep', id);
};
export const midProofWhy: Gen = (R, n) => {
  const w = pick(R, NAMES), v = pick(R, ['examples', 'half', 'coords'] as const);
  if (v === 'examples') {
    const k = r(R, 3, 12);
    return choiceT(R, (s: string) => s, {
      id: `midProofWhy-${n}`, family: 'midProofWhy', prompt: `${w} drew ${k} different triangles, joined the midpoints of two sides, and measured: each time the segment was half of the third side. Does that prove the Midsegment Theorem?`, board: '\\text{a proof?}',
      solution: ['Measured examples only cover the triangles that were drawn (and measuring is never exact).', 'A proof must work for every triangle: the congruence argument does.', 'So: no: examples are not a proof for every triangle.'],
      picture: { card: { lines: [`${w} measured ${k} triangles: the segment joining two midpoints was always half the third side.`] } },
    }, [
      { t: 'no: examples are not a proof for every triangle', ok: true, say: 'Right: a general proof covers every triangle.' },
      { t: `yes: ${k} examples are plenty`, mc: MC.examples, say: 'No number of examples covers every triangle.' },
      { t: 'yes, if every measurement is exact', mc: MC.examples, say: 'Even exact examples only cover the triangles drawn.' },
    ]);
  }
  if (v === 'half') return choiceT(R, (s: string) => s, {
    id: `midProofWhy-${n}`, family: 'midProofWhy', prompt: `${w} extended DE to F with EF = DE and proved △ADE ≅ △CFE, so CF ∥ AB. ${w} says the Midsegment Theorem is now proved. Is it?`, board: '\\overline{CF} \\parallel \\overline{AB}',
    solution: ['The theorem has two conclusions: DE ∥ BC and DE = ½BC.', 'CF ∥ AB is only a step: next △DBC ≅ △CFD gives DF ∥ BC and DF = BC, so DE = ½BC.', 'So: no: both conclusions, DE ∥ BC and DE = ½BC, are still to come.'],
    picture: { card: { lines: [`${w}: “D and E are the midpoints of AB and AC. I extended DE to F with EF = DE. Then △ADE ≅ △CFE (SAS), so CF ∥ AB. Done.”`] } },
  }, [
    { t: 'no: both conclusions, DE ∥ BC and DE = ½BC, are still to come', ok: true, say: 'Right: CF ∥ AB is a step on the way.' },
    { t: 'yes: once one pair of lines is parallel, the rest follows', mc: MC.someConds, say: 'The proof must reach both DE ∥ BC and DE = ½BC.' },
    { t: 'no: a midsegment theorem can only be checked by measuring', mc: MC.examples, say: 'It can be proved; the proof just is not finished.' },
  ]);
  return choiceT(R, (s: string) => s, {
    id: `midProofWhy-${n}`, family: 'midProofWhy', prompt: `${w} proved the Midsegment Theorem with congruent triangles. A classmate used coordinates instead: A(0, 0), B(2a, 2b), C(2c, 0), so the midpoints are D(a, b) and E(c, 0). Which statement is right?`, board: '\\text{two methods}',
    solution: ['Both are general: the congruence proof works for every triangle, and so do coordinates with letters a, b, c.', 'A theorem can have several valid proofs.', 'So: both proofs are valid; a theorem can have more than one proof.'],
    picture: { card: { lines: ['Method 1: extend DE to F, two congruent pairs of triangles.', 'Method 2: A(0, 0), B(2a, 2b), C(2c, 0); slope and length of DE versus BC.'] } },
  }, [
    { t: 'both proofs are valid; a theorem can have more than one proof', ok: true, say: 'Right: two different routes to the same theorem.' },
    { t: 'only the congruence proof counts: that is the method for triangles', mc: MC.oneMethod, say: 'Any correct general argument is a proof.' },
    { t: 'only the coordinate proof counts, because it uses numbers', mc: MC.oneMethod, say: 'Letters a, b, c make it general; so is the congruence route.' },
  ]);
};

// ---------- s3-median-two-thirds-proof / s3-median-concurrence-proof ----------
export const twoThirdsStep: Gen = (R, n) => (R() < 0.55 ? reasonItem(R, n, 'twoThirdsStep', 'twoThirds') : stmtItem(R, n, 'twoThirdsStep', 'twoThirds', [2, 3, 4, 5]));
export const medConcur: Gen = (R, n) => {
  if (R() < 0.4) return fitted('medConcur', () => {
    const L = 3 * r(R, 3, 14), u = pick(R, ['cm', 'in']);
    const p = makeTCProof('medConcur', R), t = relabel(R, p.roles);
    return numT(t, {
      id: `medConcur-${n}`, family: 'medConcur', prompt: `${segN('AM')} is a median of ${tri('ABC')} and AM = ${L} ${u}. The median ${segN('BN')} crosses it at G, and the median ${segN('CK')} crosses it at G′. How far is G′ from A?`, board: `AM = ${L},\\ AG' = \\,?`, unit: u,
      solution: ['Any two medians cut each other at the two-thirds point.', `So CK crosses AM two thirds of the way from A: AG′ = ⅔ · ${L} = <b class="s">${(2 * L) / 3}</b> ${u}, the same point as G.`],
      picture: { fig: p.fig, reveal: {} },
    }, (2 * L) / 3, [{ v: L / 2, mc: MC.bisects, say: 'The medians meet two thirds of the way from the vertex, not halfway.' }, { v: L / 3, mc: MC.ratioWrong, say: 'The long part is next to the vertex A: two thirds.' }], 'Right: the same point G.', 'Every pair of medians meets at the point two thirds of the way from each vertex.');
  });
  return reasonItem(R, n, 'medConcur', 'medConcur', [2]);
};

// ---------- s3-critique-proof ----------
interface Crit { steps: string[]; bad: number; why: string; mc: string }
function critTemplates(w: string): Crit[] {
  return [
    { steps: [`${w} drew three triangles and joined the midpoints of two sides in each.`, 'Each time, the segment measured half of the third side.', 'So in every triangle a midsegment is half of the third side.', 'So in △ABC with BC = 18 cm, DE = 9 cm.'], bad: 2, why: 'Three measured examples do not cover every triangle.', mc: MC.examples },
    { steps: ['D is the midpoint of AB (marked).', 'E is the midpoint of AC.', 'So DE is a midsegment of △ABC.', 'So DE = ½ BC.'], bad: 1, why: 'Nothing marks or gives E as a midpoint; it only looks like one.', mc: MC.appearance },
    { steps: ['AB ≅ AC (given).', 'AD ≅ AD (Reflexive Property).', '∠B ≅ ∠C (given).', 'So △ABD ≅ △ACD (SSA), and BD ≅ DC.'], bad: 3, why: 'SSA is not a congruence criterion.', mc: MC.ssa },
    { steps: ['G is where the medians AM and BN meet.', 'The centroid divides every median 2 : 1, so AG = 2 GM.', 'P is the midpoint of AG, so AP = PG.', 'So AG = 2 GM, which proves the two-thirds point.'], bad: 1, why: 'Step 2 uses the statement being proved.', mc: MC.circular },
    { steps: ['O is on the perpendicular bisectors of AB and BC (given).', 'So OA = OB and OB = OC (Perpendicular Bisector Theorem).', 'Two lines always meet, so the perpendicular bisector of AC passes through O too.', 'So O is the center of the circle through A, B and C.'], bad: 2, why: 'Two lines meeting says nothing about the third; it needs OA = OC and the converse.', mc: MC.twoMeet },
    { steps: ['P is on the bisector of ∠BAC (given).', 'PE ⊥ AB and PF ⊥ AC (given).', 'PA = PA, and AP bisects the angle, so P is the same distance from A on both sides.', 'So PE = PF.'], bad: 2, why: 'The distance to a side is along the perpendicular (PE, PF), not to the vertex; the proof needs △AEP ≅ △AFP by AAS.', mc: MC.slanted },
  ];
}
export const critique: Gen = (R, n) => {
  const w = pick(R, NAMES), c = pick(R, critTemplates(w));
  const lines = c.steps.map((s, i) => `${i + 1}. ${s}`);
  return choiceT(R, (s: string) => s, {
    id: `critique-${n}`, family: 'critique', prompt: `${w} wrote this argument. Which is the first step that is unsupported or circular?`, board: '\\text{the first bad step}',
    solution: [c.why, `So: step ${c.bad + 1}.`],
    picture: { card: { lines } },
  }, c.steps.map((_, i) => ({ t: `step ${i + 1}`, ok: i === c.bad, mc: i === c.bad ? undefined : i === c.steps.length - 1 ? MC.byAnswer : undefined, say: i === c.bad ? `Right: ${c.why}` : i < c.bad ? 'That step is supported.' : 'An earlier step already fails.' })), true);
};

// ---------- s3-apply-context ----------
export const contextBrace: Gen = (R, n) => fitted('contextBrace', () => {
  const base = 2 * r(R, 48, 120), rafter = r(R, Math.ceil(base * 0.55), Math.floor(base * 0.8));
  if (Math.abs(rafter - base) < 6 || rafter / 2 === base / 2) throw new Error('size');
  const h = Math.sqrt(rafter * rafter - (base / 2) ** 2), k = 1.6;
  const A: Pt = [0, h * k], B: Pt = [-base / 2 * k, 0], C: Pt = [base / 2 * k, 0];
  const exact = R() < 0.6;
  const D = exact ? mid(A, B) : [A[0] + (B[0] - A[0]) * 0.47, A[1] + (B[1] - A[1]) * 0.47] as Pt, E = exact ? mid(A, C) : [A[0] + (C[0] - A[0]) * 0.53, A[1] + (C[1] - A[1]) * 0.53] as Pt;
  const f = fig({ pts: { A, B, C, D, E }, segs: ['AD', 'DB', 'AE', 'EC', 'BC', 'DE'], marks: [...(exact ? [tick('AD', 1), tick('DB', 1), tick('AE', 2), tick('EC', 2)] : []), lbl('BC', `${base} in`)], segStyle: { DE: { col: 'second' } }, body: 'ABC' });
  const t = relabel(R, 'ABCDE');
  if (exact) return numT(t, {
    id: `contextBrace-${n}`, family: 'contextBrace', prompt: `A roof truss is a triangle: two ${rafter}-inch rafters on a ${base}-inch beam. A brace is nailed between the measured midpoints of the two rafters. How long is the brace?`, board: `\\text{beam} = ${base}\\text{ in},\\ \\text{rafters} = ${rafter}\\text{ in}`, unit: 'in',
    solution: ['The brace joins the midpoints of two sides: a midsegment (the conditions hold: both points are measured midpoints).', `So it is half of the third side, the beam: ${base} ÷ 2 = <b class="s">${base / 2}</b> in.`],
    picture: { fig: f, reveal: { glow: ['DE'] } },
  }, base / 2, [{ v: rafter / 2, mc: MC.halvesTouched, say: 'The brace touches the rafters; it is half of the beam it does not touch.' }, { v: base, mc: MC.midEqPar, say: 'It is parallel to the beam but only half as long.' }], 'Right: half the beam.', 'Both ends are midpoints: the Midsegment Theorem applies.');
  return choiceT(R, t, {
    id: `contextBrace-${n}`, family: 'contextBrace', prompt: `A roof truss: two ${rafter}-inch rafters on a ${base}-inch beam. A brace is nailed "roughly halfway" up each rafter. Can you say the brace is exactly ${base / 2} inches?`, board: `\\text{beam} = ${base}\\text{ in}`,
    solution: ['The Midsegment Theorem needs both ends to be exact midpoints.', '"Roughly halfway" does not meet that condition, so the length is only about half the beam.', `So: no: the theorem needs exact midpoints; it is only about ${base / 2} in.`],
    picture: { fig: f, reveal: {} },
  }, [
    { t: `no: the theorem needs exact midpoints; it is only about ${base / 2} in`, ok: true, say: 'Right: check the conditions before using the theorem.' },
    { t: `yes: halfway is halfway, so exactly ${base / 2} in`, mc: MC.trusts, say: 'Roughly halfway is not a midpoint: the theorem does not apply exactly.' },
    { t: `yes: exactly ${rafter / 2} in`, mc: MC.halvesTouched, say: 'The brace would be about half the beam, not half a rafter, and not exactly.' },
  ]);
});
export const contextTowns: Gen = (R, n) => fitted('contextTowns', () => {
  const v = pick(R, ['which', 'where', 'right'] as const);
  const towns = shuffle(R, ['Ashford', 'Brook', 'Cedar Falls', 'Dunmore', 'Elm Grove', 'Fairview', 'Glenwood', 'Hartley']).slice(0, 3);
  if (v === 'right') {
    const d = 2 * r(R, 4, 16) + (R() < 0.3 ? 1 : 0);
    const T = makeTri(R, 'right', { at: 2 });
    const f = fig({ pts: ptsOf(T), segs: ['AB', 'BC', 'CA'], marks: [box('ACB'), lbl('AB', `${d} mi`)], body: 'ABC' });
    const t = relabel(R, 'ABC');
    return numT(t, {
      id: `contextTowns-${n}`, family: 'contextTowns', prompt: `The roads from ${towns[2]} (C) to ${towns[0]} (A) and to ${towns[1]} (B) meet at a right angle, and ${towns[0]} is ${d} miles from ${towns[1]} in a straight line. A water tower must be the same distance from all three towns. How far is it from each town?`, board: `AB = ${d}\\text{ mi},\\ \\angle C = 90^\\circ`, unit: 'mi',
      solution: ['Equidistant from three points: the circumcenter.', 'For a right triangle it is the midpoint of the hypotenuse AB.', `So it is ${d} ÷ 2 = <b class="s">${d / 2}</b> miles from each town.`],
      picture: { fig: f, reveal: {} },
    }, d / 2, [{ v: d, say: 'That is the whole hypotenuse; the tower is at its midpoint.' }, { v: d / 3, mc: MC.central, say: 'The centroid is not equidistant from the vertices.' }], 'Right: half the hypotenuse.', 'The point equidistant from the three towns is the circumcenter: the midpoint of the hypotenuse here.');
  }
  const kind: Kind = v === 'where' ? 'obtuse' : pick(R, ['acute', 'obtuse'] as Kind[]);
  const T = makeTri(R, kind, { at: 1, lo: 104, hi: 125 });
  const f = fig({ pts: ptsOf(T), segs: ['AB', 'BC', 'CA'], body: 'ABC' });
  const t = relabel(R, 'ABC');
  if (v === 'which') return choiceT(R, t, {
    id: `contextTowns-${n}`, family: 'contextTowns', prompt: `Three towns, ${towns[0]} (A), ${towns[1]} (B) and ${towns[2]} (C), want a water tower exactly the same distance from all three town halls. Where should it go?`, board: '\\text{equidistant from A, B, C}',
    solution: ['Equidistant from three points means on the perpendicular bisector of each pair.', 'So the tower goes at the circumcenter.', 'So: where the perpendicular bisectors of AB, BC and CA meet.'],
    picture: { fig: f, reveal: {} },
  }, [
    { t: 'where the perpendicular bisectors of AB, BC and CA meet', ok: true, say: 'Right: the circumcenter.' },
    { t: 'at the center of the triangle, where the medians meet', mc: MC.central, say: 'The centroid looks central, but it is not equidistant from the vertices.' },
    { t: 'where the angle bisectors meet', mc: MC.swap, say: 'The incenter is equidistant from the roads (sides), not the towns.' },
  ]);
  const w = whereIs(T, circumcenterOf(T));
  void w;
  return choiceT(R, t, {
    id: `contextTowns-${n}`, family: 'contextTowns', prompt: `${towns[0]} (A), ${towns[1]} (B) and ${towns[2]} (C) form a triangle with an obtuse angle at ${towns[1]}. A water tower must be the same distance from all three. Where will it be?`, board: '\\text{obtuse angle at } B',
    solution: ['The tower is at the circumcenter.', 'In an obtuse triangle the circumcenter lies outside, beyond the longest side.', 'So: outside the triangle, beyond the side AC.'],
    picture: { fig: f, reveal: {} },
  }, [
    { t: 'outside the triangle, beyond the side AC', ok: true, say: 'Right: obtuse, so the circumcenter is outside.' },
    { t: 'inside the triangle, near its middle', mc: MC.inside, say: 'For an obtuse triangle the circumcenter is outside.' },
    { t: 'at the town with the obtuse angle', say: 'B is one of the towns: it cannot be the same distance from all three.' },
  ]);
});
void kindOf; void dist;
export type { Tri };
