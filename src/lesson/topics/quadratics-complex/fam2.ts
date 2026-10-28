// fam2.ts: practice families for stage 3 of "Quadratics with complex solutions": checking a root by substitution,
// the conjugate pair (why, the reject-only test, why it is not enough, the real-coefficient condition), building a
// quadratic from one root, and non-real solutions in a real model.
import { int } from '../../runtime/item';
import { type Gen, type Opt, MC, MINUS, II, ans, cxPair, endZ, keyed, numItem, nz, pickOf, retry, Reroll, twoNum } from './common';
import {
  type Cx, C, CQ, add, cxEq, cxHtml, cxTex, disc, evalParts, evalPlus, evalQ, imH, isZ, keyCx, keyQuad, mul, nH, nonReal, nr,
  nrH, oneH, polyH, polyT, q, qH, qVal, RE, rootH,
} from './qc';
import { modelPic, rootsPic } from './pic';
import type { PP } from './common';

const X = '<i>x</i>';
const rt = (s: number | string) => rootH(2, s);
const eqH = (a: number, b: number, c: number) => `${polyH(a, b, c)} = 0`;
const eqT = (a: number, b: number, c: number) => `${polyT(a, b, c)} = 0`;
const par = (z: Cx) => (z.re[0] !== 0 && z.im[0] !== 0) || (z.im[0] === 0 ? z.re[0] < 0 : z.re[0] === 0 ? z.im[0] < 0 : z.re[0] < 0) ? `(${cxHtml(z)})` : cxHtml(z);
const parT = (z: Cx) => (z.re[0] !== 0 && z.im[0] !== 0) || (z.im[0] === 0 ? z.re[0] < 0 : z.re[0] === 0 ? z.im[0] < 0 : z.re[0] < 0) ? `(${cxTex(z)})` : cxTex(z);
const conj = (z: Cx): Cx => CQ(z.re, [-z.im[0] + 0, z.im[1]]);
const negZ = (z: Cx): Cx => CQ([-z.re[0] + 0, z.re[1]], [-z.im[0] + 0, z.im[1]]);
/** a plain label for a point: fractions keep their slash, −1/2 + (1/2)i */
const plainZ = (z: Cx) => cxHtml(z).replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');
const sgn = (v: number) => (v < 0 ? `${MINUS} ${-v}` : `+ ${v}`);
const unitN = (v: number, u: string) => (v === 1 ? u.replace(/s$/, '') : u);
const pt = (key: string, z: Cx, col = 'first', name = true): PP => ({ key, at: [qVal(z.re), qVal(z.im)], col, name: name ? plainZ(z) : undefined });
/** p ± qi with x² − 2p·x + (p² + q²) */
function pq(R: () => number, most = 20, zeroP = false): [number, number] {
  for (;;) { const p = zeroP ? int(R, -4, 4) : nz(R, -4, 4), qq = int(R, 1, 5); if (p * p + qq * qq <= most) return [p, qq]; }
}
/** the worked substitution lines of A·z² + B·z + C (real A, B, C) */
function subLines(A: number, B: number, Cc: number, z: Cx): string[] {
  const e = evalQ(RE(A), RE(B), RE(Cc), z);
  return [
    `${X}<sup>2</sup> = ${par(z)}<sup>2</sup> = ${cxHtml(e.z2)}${z.re[0] !== 0 && z.im[0] !== 0 ? ` (every term times every term, ${II}<sup>2</sup> = ${MINUS}1)` : ` (${II}<sup>2</sup> = ${MINUS}1)`}.`,
    `${A === 1 ? '' : `${nH(A)} · ${par(e.z2)} = ${cxHtml(e.az2)}; `}${nH(B)} · ${par(z)} = ${cxHtml(e.bz)}.`,
    `Add, real with real and ${II} with ${II}: ${cxHtml(e.az2)} + ${par(e.bz)} + ${par(RE(Cc))} = ${cxHtml(e.val)}.`,
  ];
}

/** the same lines in two steps (the square, then the rest and the sum), for step cards that also need a reason */
function subLines2(A: number, B: number, Cc: number, z: Cx): string[] { const L = subLines(A, B, Cc, z); return [L[0]!, `${L[1]!} ${L[2]!}`]; }

// ===================== verify-by-substitution =====================
type Pick = { A: number; B: number; Cc: number; root: Cx };
/** a quadratic with real coefficients and a root: pure imaginary (x² + k), integer parts (a = 1), a ≠ 1 with halves */
function quadWithRoot(R: () => number, t: 'pure' | 'int' | 'half'): Pick {
  if (t === 'pure') { const r = int(R, 1, 9); return { A: 1, B: 0, Cc: r * r, root: C(0, r * (R() < 0.5 ? 1 : -1)) }; }
  if (t === 'int') { const [p, qq] = pq(R); return { A: 1, B: -2 * p, Cc: p * p + qq * qq, root: C(p, qq * (R() < 0.5 ? 1 : -1)) }; }
  // 2x² + bx + c with roots (P ± Q i)/2, P, Q odd
  for (;;) {
    const P = pickOf(R, [-5, -3, -1, 1, 3, 5]), Qv = pickOf(R, [1, 3, 5]), b = -2 * P, c = (P * P + Qv * Qv) / 2;
    if (Math.abs(c) <= 20) return { A: 2, B: b, Cc: c, root: CQ(q(P, 2), q(Qv * (R() < 0.5 ? 1 : -1), 2)) };
  }
}
/** a wrong candidate near the root (opposite real part, swapped parts, one more in the imaginary part) */
function wrongCandidate(R: () => number, z: Cx): Cx {
  const opts = [CQ([-z.re[0] + 0, z.re[1]], z.im), CQ(z.im, z.re), CQ(z.re, [z.im[0] + z.im[1], z.im[1]]), CQ([z.re[0] + z.re[1], z.re[1]], z.im)];
  for (;;) { const w = pickOf(R, opts); if (!cxEq(w, z) && !cxEq(w, conj(z)) && w.im[0] !== 0) return w; }
}
/** P(z) as a + bi: substitute a candidate (right or wrong), both parts */
export const residual: Gen = (R, n) => {
  const t = pickOf(R, ['pure', 'int', 'int', 'half'] as const);
  const P = quadWithRoot(R, t), root = R() < 0.5, z = root ? P.root : wrongCandidate(R, P.root);
  const A = RE(P.A), B = RE(P.B), Cc = RE(P.Cc), V = evalQ(A, B, Cc, z).val;
  return cxPair({
    id: `residual-${n}`, family: 'residual',
    prompt: `Substitute ${X} = ${cxHtml(z)} into ${polyH(P.A, P.B, P.Cc)}. What number do you get? Type it as a + b${II}.`,
    board: `${polyT(P.A, P.B, P.Cc)} \\\\ \\text{at } x = ${cxTex(z)}`,
    picture: { roots: rootsPic([pt('z', z, 'first')]) },
    solution: [...subLines(P.A, P.B, P.Cc, z), endZ(V), isZ(V) ? `Both parts are 0: ${cxHtml(z)} IS a solution.` : `Not 0, so ${cxHtml(z)} is not a solution.`],
  }, V, isZ(V) ? `Yes: 0 + 0${II}, so ${cxHtml(z)} is a solution.` : `Yes: ${cxHtml(V)}. Not 0, so ${cxHtml(z)} is not a solution.`, [
    { z: evalPlus(A, B, Cc, z), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1, not +1: ${par(z)}<sup>2</sup> = ${cxHtml(mul(z, z))}.` },
    { z: evalParts(A, B, Cc, z), mc: MC.partByPart, say: `Square the WHOLE sum: ${par(z)}<sup>2</sup> has a middle term too, ${par(z)}<sup>2</sup> = ${cxHtml(mul(z, z))}.` },
  ], `Square ${par(z)} first (every term times every term), then multiply, then add real with real and ${II} with ${II}.`);
};

/** is it a solution? read BOTH parts; equations not set to 0; a wrong reason is not a disproof */
export const verifyVerdict: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['direct', 'direct', 'realOnly', 'sides', 'lee'] as const);
  if (t === 'realOnly') {
    // x² − 2px + p² + q² at s + ti with (s − p)² + q² = t²: real part 0, imaginary part not 0
    const [qq, d] = pickOf(R, [[3, 4], [4, 3], [6, 8], [8, 6]] as const), tt = Math.hypot(qq, d), p = nz(R, -3, 3), sgn = R() < 0.5 ? 1 : -1;
    const A = 1, B = -2 * p, Cc = p * p + qq * qq;
    if (Cc > 80) throw new Reroll();
    const z = C(p + sgn * d, tt), V = evalQ(RE(A), RE(B), RE(Cc), z).val;
    if (V.re[0] !== 0 || V.im[0] === 0) throw new Error('realOnly: not a real-part-zero candidate');
    return keyed(R, {
      id: `verifyVerdict-${n}`, family: 'verifyVerdict',
      prompt: `Is ${X} = ${cxHtml(z)} a solution of ${eqH(A, B, Cc)}?`,
      board: eqT(A, B, Cc),
      picture: { roots: rootsPic([pt('z', z)]) },
      solution: [...subLines(A, B, Cc, z), `The real part is 0, but the imaginary part is ${qH(V.im)}: the value is not 0, so ${cxHtml(z)} is ${ans('not a solution')}.`],
    }, [
      { t: `No: substituting gives ${cxHtml(V)}, not 0.`, ok: true, say: `Yes. A complex number is 0 only when BOTH parts are 0.` },
      { t: `Yes: the real part of the result is 0.`, mc: MC.realOnly, say: `The imaginary part is ${qH(V.im)}, not 0. Both parts must be 0.` },
      { t: `Yes: substituting gives 0.`, say: `Check the ${II} terms: they add to ${cxHtml(CQ(q(0), V.im))}, not 0.` },
      { t: `It can't be checked: ${cxHtml(z)} is not a real number.`, mc: MC.dismiss, say: `Substitution works for complex numbers too: use ${II}<sup>2</sup> = ${MINUS}1.` },
    ]);
  }
  if (t === 'lee') {
    const P = quadWithRoot(R, pickOf(R, ['int', 'int', 'half'] as const)), z = P.root;
    const Vp = evalPlus(RE(P.A), RE(P.B), RE(P.Cc), z);
    return keyed(R, {
      id: `verifyVerdict-${n}`, family: 'verifyVerdict',
      prompt: `Lee says ${cxHtml(z)} solves ${eqH(P.A, P.B, P.Cc)} "because ${cxHtml(z)} and ${cxHtml(conj(z))} are conjugates". Kim says: "Lee's reason is wrong, so ${cxHtml(z)} is not a solution." Who is right?`,
      board: eqT(P.A, P.B, P.Cc),
      picture: { roots: rootsPic([pt('z', z)]) },
      solution: [`Lee's reason proves nothing (conjugacy does not show a pair solves THIS equation), but a wrong reason does not make the claim false either. Substitute ${cxHtml(z)}:`, ...subLines2(P.A, P.B, P.Cc, z), `So ${cxHtml(z)} IS a solution: neither reason was right.`],
    }, [
      { t: `Neither: Lee's reason proves nothing, but substituting gives 0, so ${cxHtml(z)} IS a solution.`, ok: true, say: `Yes. Only substitution settles it, and it gives 0.` },
      { t: `Kim: a wrong reason means a wrong claim.`, mc: MC.failedArg, say: `A bad argument proves nothing either way. Substitute: the value is 0, so ${cxHtml(z)} is a solution.` },
      { t: `Lee: a conjugate pair always solves the equation.`, mc: MC.anyConj, say: `Many quadratics have conjugate roots, but each has its OWN pair. Only substituting shows which.` },
      ...(isZ(Vp) ? [] : [{ t: `Kim: substituting gives ${cxHtml(Vp)}, not 0.`, mc: MC.i2Plus, say: `That value uses ${II}<sup>2</sup> = +1. With ${II}<sup>2</sup> = ${MINUS}1 the value is 0.` }]),
    ]);
  }
  const P = quadWithRoot(R, pickOf(R, ['pure', 'int', 'int', 'half'] as const)), root = R() < 0.5, z = root ? P.root : wrongCandidate(R, P.root);
  const A = RE(P.A), B = RE(P.B), Cc = RE(P.Cc), V = evalQ(A, B, Cc, z).val, Vp = evalPlus(A, B, Cc, z);
  if (t === 'sides' && P.B !== 0) {
    // ax² + c = −bx: compare the two sides
    const L = add(mul(A, mul(z, z)), Cc), Rt = mul(RE(-P.B), z);
    const Lplus = add(evalPlus(A, RE(0), Cc, z), C(0, 0));
    const lhs = `${polyH(P.A, 0, P.Cc)}`, rhs = polyH(0, -P.B, 0);
    return keyed(R, {
      id: `verifyVerdict-${n}`, family: 'verifyVerdict',
      prompt: `Is ${X} = ${cxHtml(z)} a solution of ${lhs} = ${rhs}? Substitute into both sides.`,
      board: `${polyT(P.A, 0, P.Cc)} = ${polyT(0, -P.B, 0)}`,
      picture: { roots: rootsPic([pt('z', z)]) },
      solution: [`Left side: ${lhs} at ${cxHtml(z)} = ${cxHtml(L)}.`, `Right side: ${rhs} at ${cxHtml(z)} = ${cxHtml(Rt)}.`, cxEq(L, Rt) ? `Both sides are ${cxHtml(L)}: ${cxHtml(z)} ${ans('is a solution')}.` : `The sides differ: ${cxHtml(z)} ${ans('is not a solution')}.`],
    }, [
      { t: cxEq(L, Rt) ? `Yes: both sides equal ${cxHtml(L)}.` : `No: the left side is ${cxHtml(L)}, the right side is ${cxHtml(Rt)}.`, ok: true, say: `Yes. Substituting into both sides of the ORIGINAL equation settles it.` },
      ...(cxEq(L, Rt)
        ? (cxEq(Lplus, L) ? [] : [{ t: `No: the left side is ${cxHtml(Lplus)}, the right side is ${cxHtml(Rt)}.`, mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1: the left side is ${cxHtml(L)}, the same as the right.` }])
        : [{ t: `Yes: both sides equal ${cxHtml(Rt)}.`, say: `Work out the left side: ${cxHtml(L)}, not ${cxHtml(Rt)}.` }]),
      ...(!cxEq(L, Rt) && qVal(L.re) === qVal(Rt.re) ? [{ t: `Yes: both sides have the same real part.`, mc: MC.realOnly, say: `Equal complex numbers need equal real parts AND equal imaginary parts.` }] : []),
      { t: `It can't be checked: ${cxHtml(z)} is not a real number.`, mc: MC.dismiss, say: `Substitution works for complex numbers too: use ${II}<sup>2</sup> = ${MINUS}1.` },
      { t: cxEq(L, Rt) ? `No: the right side has ${II} in it and the left side does not.` : `Yes: both sides have an ${II} in them.`, say: `Compare the two values part by part.` },
    ]);
  }
  return keyed(R, {
    id: `verifyVerdict-${n}`, family: 'verifyVerdict',
    prompt: `Is ${X} = ${cxHtml(z)} a solution of ${eqH(P.A, P.B, P.Cc)}?`,
    board: eqT(P.A, P.B, P.Cc),
    picture: { roots: rootsPic([pt('z', z)]) },
    solution: [...subLines(P.A, P.B, P.Cc, z), isZ(V) ? `Both parts are 0: ${cxHtml(z)} ${ans('is a solution')}.` : `Not 0: ${cxHtml(z)} ${ans('is not a solution')}.`],
  }, [
    { t: isZ(V) ? `Yes: substituting gives 0.` : `No: substituting gives ${cxHtml(V)}, not 0.`, ok: true, say: isZ(V) ? `Yes: both parts are 0.` : `Yes: the value is not 0.` },
    ...(isZ(V) ? (isZ(Vp) ? [] : [{ t: `No: substituting gives ${cxHtml(Vp)}, not 0.`, mc: MC.i2Plus, say: `That value uses ${II}<sup>2</sup> = +1. With ${II}<sup>2</sup> = ${MINUS}1 everything cancels to 0.` }])
      : [{ t: `Yes: substituting gives 0.`, mc: isZ(Vp) ? MC.i2Plus : undefined, say: `Work it out with ${II}<sup>2</sup> = ${MINUS}1: the value is ${cxHtml(V)}.` }]),
    ...(!isZ(V) && V.re[0] === 0 ? [{ t: `Yes: the real part of the result is 0.`, mc: MC.realOnly, say: `Both parts must be 0; the imaginary part is ${qH(V.im)}.` }] : []),
    { t: `It can't be checked: ${cxHtml(z)} is not a real number.`, mc: MC.dismiss, say: `Substitution works for complex numbers too: use ${II}<sup>2</sup> = ${MINUS}1.` },
    { t: isZ(V) ? `No: a non-real number can't make a real expression 0.` : `Yes: its conjugate ${cxHtml(conj(z))} is a solution, so it is too.`, mc: isZ(V) ? MC.dismiss : undefined, say: isZ(V) ? `It can: the ${II} terms cancel, and ${II}<sup>2</sup> = ${MINUS}1 makes the rest real.` : `Substitute ${cxHtml(z)} itself: the value is ${cxHtml(V)}.` },
  ]);
});

// ===================== conjugate-pair-justify =====================
export const conjProofStep: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['share', 'whyReal', 'examples', 'flip'] as const);
  const a = pickOf(R, [1, 1, 2, 3, -1, -2]);
  let b = 0, c = 0;
  for (;;) { b = int(R, -8, 8); c = nz(R, -10, 10); if (disc(a, b, c) < 0 && b !== 0) break; }
  const D = disc(a, b, c), x = nonReal(a, b, c);
  if (t === 'share') return keyed(R, {
    id: `conjProofStep-${n}`, family: 'conjProofStep',
    prompt: `For ${eqH(a, b, c)} the formula gives ${X} = (${nH(-b)} ± ${rt(nH(D))}) / ${nH(2 * a)}. What do the two solutions have in common?`,
    board: `x = \\frac{${-b} \\pm \\sqrt{${D}}}{${2 * a}}`,
    picture: { roots: rootsPic([], [{ key: 'p', at: [qVal(x.re), qVal(x.im) * Math.sqrt(x.m)], col: 'link' }, { key: 'm', at: [qVal(x.re), -qVal(x.im) * Math.sqrt(x.m)], col: 'link' }], undefined, qVal(x.re)) },
    solution: [`The ± touches only the root: −b/(2a) = ${qH(x.re)} is in BOTH solutions.`, `So ${X} = ${nrH(x)}: the same real part ${qH(x.re)}, imaginary parts that are opposites.`],
  }, [
    { t: `The same real part, −b/(2a) = ${qH(x.re)}.`, ok: true, key: 'real', say: `Yes: the ± only changes the sign of the imaginary part.` },
    { t: `The same imaginary part.`, key: 'imag', mc: MC.conjReal, say: `The ± flips the sign of the imaginary part: one is +, one is −.` },
    { t: `Nothing: each solution is the opposite (negative) of the other.`, key: 'opp', mc: MC.opposites, say: `The opposite would flip the real part too. Here −b/(2a) = ${qH(x.re)} stays the same.` },
    { t: `They are the same number.`, key: 'same', say: `± gives two different numbers when the root is not 0.` },
  ]);
  if (t === 'whyReal') return keyed(R, {
    id: `conjProofStep-${n}`, family: 'conjProofStep',
    prompt: `Write the roots of ${eqH(a, b, c)} as −b/(2a) ± (${rt('4ac − b<sup>2</sup>')} / (2a))${II}. Here 4ac − b<sup>2</sup> = ${-D}. Why is ${rt('4ac − b<sup>2</sup>')} / (2a) a real number?`,
    board: `x = -\\frac{b}{2a} \\pm \\frac{\\sqrt{4ac - b^{2}}}{2a}\\,i`,
    solution: [`b<sup>2</sup> − 4ac = ${nH(D)} is negative, so 4ac − b<sup>2</sup> = ${-D} is positive.`, `A positive real number has a real square root, and a, b, c are real: ${rt(-D)} / ${nH(2 * a)} is real.`],
  }, [
    { t: `4ac − b<sup>2</sup> is positive, so its square root is real; and 2a is real.`, ok: true, say: `Yes: that is why the roots have the form p ± q${II} with p and q real.` },
    { t: `It is not real: the root of a discriminant is always imaginary.`, say: `4ac − b<sup>2</sup> = ${-D} is positive: its square root is real. The ${II} was already taken out.` },
    { t: `Because ${II}<sup>2</sup> = ${MINUS}1 cancels the root.`, mc: MC.i2Plus, say: `No ${II} is left under this root: 4ac − b<sup>2</sup> = ${-D} is positive.` },
    { t: `It worked for this equation, so it is real for every equation.`, mc: MC.examples, say: `One case shows nothing general. The reason: 4ac − b<sup>2</sup> is positive whenever b<sup>2</sup> − 4ac is negative.` },
  ]);
  if (t === 'examples') {
    const N = int(R, 3, 12);
    return keyed(R, {
      id: `conjProofStep-${n}`, family: 'conjProofStep',
      prompt: `Kim solved ${N} quadratics with real coefficients and negative discriminants, ${eqH(a, b, c)} among them. Every time the two roots were conjugates. Does that prove it is always true?`,
      board: eqT(a, b, c),
      solution: [`${N} examples cover ${N} equations, not every real a, b, c.`, `The proof: x = −b/(2a) ± (${rt('4ac − b<sup>2</sup>')}/(2a))${II}, with both parts real for ANY real a, b, c with a negative b<sup>2</sup> − 4ac.`],
    }, [
      { t: `No: examples can't cover every a, b, c. The general formula argument proves it.`, ok: true, say: `Yes. The general argument works for every real a, b, c at once.` },
      { t: `Yes: ${N} examples are plenty.`, mc: MC.examples, say: `However many, examples check only those equations. A proof covers all of them.` },
      { t: `Yes, as long as one example had a negative a.`, mc: MC.examples, say: `More kinds of examples are still examples. Only a general argument proves it.` },
      { t: `No: it is false, the roots are opposites, like ${oneH(x, 1)} and its negative.`, mc: MC.opposites, say: `The second root is the conjugate ${oneH(x, -1)}, not the negative.` },
    ]);
  }
  return keyed(R, {
    id: `conjProofStep-${n}`, family: 'conjProofStep',
    prompt: `The roots of ${eqH(a, b, c)} are ${oneH(x, 1)} and ${oneH(x, -1)}. Going from one root to the other, what changes?`,
    board: eqT(a, b, c),
    picture: { roots: rootsPic([{ key: 'p', at: [qVal(x.re), qVal(x.im) * Math.sqrt(x.m)], col: 'link' }, { key: 'm', at: [qVal(x.re), -qVal(x.im) * Math.sqrt(x.m)], col: 'link' }], [], undefined, qVal(x.re)) },
    solution: [`The ± in the formula sits in front of the imaginary part only.`, `So only the sign of the imaginary part changes: a conjugate pair, mirror images in the real axis.`],
  }, [
    { t: `Only the sign of the imaginary part.`, ok: true, key: 'im', say: `Yes: a conjugate pair, mirrored in the real axis.` },
    { t: `The signs of both parts.`, key: 'both', mc: MC.conjBoth, say: `That would be the opposite. The real part −b/(2a) is the same in both roots.` },
    { t: `Only the sign of the real part.`, key: 're', mc: MC.conjReal, say: `The real part −b/(2a) stays; the ± is in front of the imaginary part.` },
    { t: `Nothing: the two roots are equal.`, key: 'none', say: `± gives two different numbers here.` },
  ]);
});

/** the other root of a real quadratic: the conjugate */
export const secondRoot: Gen = (R, n) => {
  const [p, qq] = pq(R, 34, true), sg = R() < 0.5 ? 1 : -1, z = C(p, sg * qq), w = conj(z);
  const withEq = R() < 0.5;
  return cxPair({
    id: `secondRoot-${n}`, family: 'secondRoot',
    prompt: withEq ? `${eqH(1, -2 * p, p * p + qq * qq)} has the root ${cxHtml(z)}. What is the other root? Type it as a + b${II}.` : `A quadratic with real coefficients has the non-real root ${cxHtml(z)}. What is its other root? Type it as a + b${II}.`,
    board: withEq ? eqT(1, -2 * p, p * p + qq * qq) : `z = ${cxTex(z)}`,
    picture: { roots: rootsPic([pt('z', z)], [pt('w', w, 'link')], p) },
    solution: [`The coefficients are real, so the non-real roots are a conjugate pair: same real part, opposite imaginary part.`, `The other root is the conjugate of ${cxHtml(z)}.`, endZ(w)],
  }, w, `Yes: ${cxHtml(w)}, the conjugate.`, [
    { z: negZ(z), mc: MC.opposites, say: `The other root is the CONJUGATE, not the opposite: the real part ${nH(p)} stays.` },
    { z: CQ([-z.re[0] + 0, z.re[1]], z.im), mc: MC.conjReal, say: `The conjugate keeps the real part and flips the imaginary part.` },
    { z, say: `That is the root you were given. Its partner has the opposite imaginary part.` },
  ], `Keep the real part, flip the sign of the imaginary part.`);
};

// ===================== conjugate-pair-check =====================
const OUT = {
  no: 'Impossible: they are not a conjugate pair.',
  maybe: 'Not ruled out by conjugacy: only substituting can show they are the roots.',
  yes: 'They must be the roots: they are a conjugate pair.',
};
const setKey = (z: Cx, w: Cx) => [keyCx(z), keyCx(w)].sort().join('&');
const pairT = (z: Cx, w: Cx) => `${cxHtml(z)} and ${cxHtml(w)}`;
/** the reject-only test: impossible, or not ruled out (never "accepted on conjugacy alone") */
export const pairCheck: Gen = (R, n) => {
  const t = pickOf(R, ['conj', 'conj', 'pure', 'opp', 'realNeg', 'same', 'mixed'] as const);
  const [p, qq] = pq(R, 34), z = t === 'pure' ? C(0, qq) : C(p, qq);
  const w = t === 'conj' || t === 'pure' ? conj(z) : t === 'opp' ? negZ(z) : t === 'realNeg' ? CQ([-z.re[0] + 0, z.re[1]], z.im) : t === 'same' ? z : C(nz(R, -6, 6), 0);
  const isConj = t === 'conj' || t === 'pure';
  const mcNo = t === 'opp' ? MC.conjBoth : t === 'realNeg' ? MC.conjReal : undefined;
  const why = t === 'opp' ? `${cxHtml(w)} is the opposite of ${cxHtml(z)}: both parts flipped. A conjugate flips ONLY the imaginary part.`
    : t === 'realNeg' ? `${cxHtml(w)} has the real part flipped. A conjugate keeps the real part and flips the imaginary part.`
      : t === 'same' ? `A non-real root of a real quadratic comes with its conjugate ${cxHtml(conj(z))}, a different number, so it can't be a double root.`
        : `One real and one non-real root is impossible: the non-real root ${cxHtml(z)} needs its conjugate ${cxHtml(conj(z))} as the other root.`;
  const base = {
    id: `pairCheck-${n}`, family: 'pairCheck',
    prompt: `Someone claims the two roots of a quadratic with real coefficients are ${pairT(z, w)}. What does the conjugate-pair test tell you?`,
    board: `${cxTex(z)},\\ \\ ${cxTex(w)}`,
    picture: { roots: rootsPic([pt('z', z), { ...pt('w', w, 'second'), open: cxEq(z, w) }], [], undefined, isConj ? qVal(z.re) : undefined) },
    solution: isConj
      ? [`${cxHtml(w)} is the conjugate of ${cxHtml(z)}: same real part, opposite imaginary part. The test does not reject them.`, `But many quadratics have conjugate roots: only substituting into THIS equation could confirm them.`]
      : [why, `The test rejects the pair: it is impossible.`],
  };
  return keyed(R, base, [
    { t: OUT.no, ok: !isConj, mc: isConj ? undefined : undefined, say: isConj ? `They ARE a conjugate pair: same real part, opposite imaginary parts.` : `Yes. ${why}` },
    { t: OUT.maybe, ok: isConj, mc: isConj ? undefined : mcNo, say: isConj ? `Yes. Conjugacy can only rule a pair out; it never proves a pair right.` : why },
    { t: OUT.yes, mc: isConj ? MC.anyConj : mcNo, say: isConj ? `Every real quadratic with non-real roots has a conjugate pair, each its own. Conjugacy alone can't show these are the right ones.` : why },
  ], { keep: true });
};

/** which pair could be the roots of a real quadratic? exactly one conjugate pair among the options */
export const whichPair: Gen = (R, n) => retry(() => {
  const [p, qq] = pq(R, 34), z = C(p, qq * (R() < 0.5 ? 1 : -1));
  const r = nz(R, -6, 6);
  const opts: Opt[] = [
    { t: pairT(z, conj(z)), ok: true, key: setKey(z, conj(z)), say: `Yes: same real part ${nH(p)}, opposite imaginary parts. It still needs substituting to show it solves a given equation.` },
    { t: pairT(z, negZ(z)), key: setKey(z, negZ(z)), mc: MC.conjBoth, say: `Both parts are flipped: those are opposites, not conjugates.` },
    { t: pairT(z, CQ([-z.re[0] + 0, z.re[1]], z.im)), key: setKey(z, CQ([-z.re[0] + 0, z.re[1]], z.im)), mc: MC.conjReal, say: `Only the real part is flipped. A conjugate flips the imaginary part.` },
    { t: pairT(z, z), key: setKey(z, z), say: `A non-real root of a real quadratic always comes with its conjugate, a different number.` },
    { t: pairT(C(r, 0), z), key: setKey(C(r, 0), z), say: `A non-real root needs its conjugate as the other root, so one real and one non-real is impossible.` },
  ];
  return keyed(R, {
    id: `whichPair-${n}`, family: 'whichPair',
    prompt: `A quadratic with real coefficients has the root ${cxHtml(z)}. Which pair could be its two roots?`,
    board: `\\text{one root: } ${cxTex(z)}`,
    picture: { roots: rootsPic([pt('z', z)], [pt('w', conj(z), 'link')], undefined, p) },
    solution: [`The non-real roots of a real quadratic are a conjugate pair: the same real part, opposite imaginary parts.`, `Only ${pairT(z, conj(z))} has that shape.`],
  }, opts);
});

// ===================== conjacy-not-sufficient =====================
/** conjugates, but do they solve THIS equation? substituting decides */
export const conjEnough: Gen = (R, n) => retry(() => {
  const [p, qq] = pq(R, 25), right = R() < 0.45;
  const B = -2 * p, Cc0 = p * p + qq * qq;
  const dc = right ? 0 : pickOf(R, [-3, -2, -1, 1, 2, 3]);
  const Cc = Cc0 + dc;
  if (disc(1, B, Cc) >= 0) throw new Reroll();
  const z = C(p, qq), V = evalQ(RE(1), RE(B), RE(Cc), z).val, Vp = evalPlus(RE(1), RE(B), RE(Cc), z);
  return keyed(R, {
    id: `conjEnough-${n}`, family: 'conjEnough',
    prompt: `Lee says ${cxHtml(z)} and ${cxHtml(conj(z))} are the roots of ${eqH(1, B, Cc)} "because they are a conjugate pair". What is the right conclusion?`,
    board: eqT(1, B, Cc),
    picture: { roots: rootsPic([pt('z', z), pt('w', conj(z), 'second')], [], p) },
    solution: [`Conjugacy only rules pairs OUT: every real quadratic with non-real roots has some conjugate pair.`, ...subLines2(1, B, Cc, z), right ? `0: they ARE the roots (and ${cxHtml(conj(z))} too, by conjugacy).` : `Not 0: they are NOT the roots of this equation.`],
  }, [
    { t: `Conjugacy doesn't prove it, but substituting ${cxHtml(z)} gives 0: they are the roots.`, ok: right, say: right ? `Yes. Substitution decides, and it gives 0.` : `Substitute: the value is ${cxHtml(V)}, not 0.` },
    { t: `Conjugacy doesn't prove it, and substituting ${cxHtml(z)} gives ${cxHtml(right ? Vp : V)}: they are not the roots.`, ok: !right, mc: right ? MC.i2Plus : undefined, say: right ? `That value uses ${II}<sup>2</sup> = +1. With ${II}<sup>2</sup> = ${MINUS}1 the value is 0.` : `Yes. They are a conjugate pair, but of a different quadratic.` },
    { t: `Lee is right: a conjugate pair always solves the equation.`, mc: MC.anyConj, say: `Each real quadratic has its own pair. Conjugacy can't tell which equation they belong to.` },
    { t: `They can't be roots: the roots of a real quadratic are opposites.`, mc: MC.opposites, say: `The roots are conjugates (same real part), not opposites.` },
  ]);
});

/** a conjugate pair: which equation do they solve? (i² = +1 and sign slips as distractors) */
export const whichEquation: Gen = (R, n) => retry(() => {
  const [p, qq] = pq(R, 25, true), S = p * p + qq * qq, z = C(p, qq);
  return keyed(R, {
    id: `whichEquation-${n}`, family: 'whichEquation',
    prompt: `Which equation has the roots ${cxHtml(z)} and ${cxHtml(conj(z))}?`,
    board: `x = ${cxTex(z)} \\\\ x = ${cxTex(conj(z))}`,
    picture: { roots: rootsPic([pt('z', z), pt('w', conj(z), 'second')], [], p) },
    solution: [`(${X} − (${cxHtml(z)}))(${X} − (${cxHtml(conj(z))})) = (${p === 0 ? X : `${X} ${p > 0 ? MINUS : '+'} ${Math.abs(p)}`})<sup>2</sup> − (${qq === 1 ? '' : qq}${II})<sup>2</sup>.`, `(${qq === 1 ? '' : qq}${II})<sup>2</sup> = ${MINUS}${qq * qq}, so this is ${p === 0 ? '' : `${X}<sup>2</sup> ${p > 0 ? MINUS : '+'} ${Math.abs(2 * p)}${X} + ${p * p} + ${qq * qq} = `}${polyH(1, -2 * p, S)}.`, `So ${ans(eqH(1, -2 * p, S))}.`],
  }, [
    { t: eqH(1, -2 * p, S), ok: true, key: keyQuad(1, -2 * p, S), say: `Yes: the sum of the roots is ${nH(2 * p)}, the product ${S}.` },
    { t: eqH(1, -2 * p, p * p - qq * qq), key: keyQuad(1, -2 * p, p * p - qq * qq), mc: MC.i2Plus, say: `(${qq === 1 ? '' : qq}${II})<sup>2</sup> = ${MINUS}${qq * qq}, so subtracting it ADDS ${qq * qq}.` },
    { t: eqH(1, 2 * p, S), key: keyQuad(1, 2 * p, S), mc: MC.zeroSign, say: `A root r gives the factor (${X} − r): the middle term is −(sum of the roots)${X} = ${nH(-2 * p)}${X}.` },
    { t: eqH(1, -2 * p, -S), key: keyQuad(1, -2 * p, -S), say: `The product of the roots is ${cxHtml(z)} · ${cxHtml(conj(z))} = ${S}, positive.` },
    { t: eqH(1, 0, S), key: keyQuad(1, 0, S), say: `The middle term is −(sum of the roots)${X} = ${nH(-2 * p)}${X}.` },
  ]);
});

// ===================== real-coefficient-boundary =====================
/** x² − (p + q)i·x − pq = 0 has the roots pi and qi, NOT a conjugate pair; contrast with real coefficients */
export const complexCoef: Gen = (R, n) => retry(() => {
  const real = R() < 0.35;
  if (real) {
    const [p, qq] = pq(R, 34, true), S = p * p + qq * qq, z = C(p, qq);
    return keyed(R, {
      id: `complexCoef-${n}`, family: 'complexCoef',
      prompt: `${eqH(1, -2 * p, S)} has the root ${cxHtml(z)}. Must ${cxHtml(conj(z))} be a root too?`,
      board: eqT(1, -2 * p, S),
      picture: { roots: rootsPic([pt('z', z)], [pt('w', conj(z), 'link')], p) },
      solution: [`Every coefficient (1, ${nH(-2 * p)}, ${S}) is real.`, `With real coefficients the non-real roots come as a conjugate pair, so ${cxHtml(conj(z))} must be a root too.`],
    }, [
      { t: `Yes: the coefficients are real, so the non-real roots are a conjugate pair.`, ok: true, say: `Yes. The real coefficients are what make the pair.` },
      { t: `No: only equations with complex coefficients have conjugate roots.`, say: `It is the other way around: REAL coefficients force the conjugate pair.` },
      { t: `No: the other root is ${cxHtml(negZ(z))}, the opposite.`, mc: MC.opposites, say: `The partner is the conjugate (same real part), not the opposite.` },
      { t: `You can't tell without solving the equation.`, say: `The conjugate-pair result answers it: the coefficients are real.` },
    ]);
  }
  const p = int(R, 1, 4), qv = int(R, p, 5), s = p + qv, P = p * qv, first = R() < 0.5 ? p : qv;
  const eqHtml = `${X}<sup>2</sup> − ${s}${II}${X} − ${P} = 0`, eqTex = `x^{2} - ${s}ix - ${P} = 0`;
  const V = evalQ(RE(1), C(0, -s), RE(-P), C(0, -first)).val;
  const fi = first === 1 ? II : `${first}${II}`;
  return keyed(R, {
    id: `complexCoef-${n}`, family: 'complexCoef',
    prompt: `${eqHtml} has the root ${fi} (substituting gives 0). Must ${MINUS}${fi} be a root too?`,
    board: eqTex,
    picture: { roots: rootsPic([{ key: 'z', at: [0, first], col: 'first', name: fi.replace(/<[^>]+>/g, '') }], [{ key: 'w', at: [0, -first], col: 'wrong', open: true }]) },
    solution: [`The coefficient ${MINUS}${s}${II} is NOT real, so the conjugate-pair result does not apply.`, `Substitute ${MINUS}${fi}: (${MINUS}${fi})<sup>2</sup> − ${s}${II} · (${MINUS}${fi}) − ${P} = ${MINUS}${first * first} − ${s * first} − ${P} = ${nH(qVal(V.re))}, not 0.`, `So ${MINUS}${fi} is not a root. (The roots are ${p === 1 ? II : `${p}${II}`}${p === qv ? ', twice' : ` and ${qv}${II}`}.)`],
  }, [
    { t: `No: substituting ${MINUS}${fi} gives ${nH(qVal(V.re))}, not 0. The pair rule needs real coefficients.`, ok: true, say: `Yes. With a non-real coefficient, roots need not pair up as conjugates.` },
    { t: `Yes: non-real roots always come in conjugate pairs.`, mc: MC.needReal, say: `Only when every coefficient is real. Here ${MINUS}${s}${II} is not.` },
    { t: `Yes: ${MINUS}${fi} is the conjugate of ${fi}, and the conjugate of a root is a root.`, mc: MC.needReal, say: `That needs real coefficients. Substitute: the value is ${nH(qVal(V.re))}, not 0.` },
    { t: `Yes: the other root is the opposite of ${fi}.`, mc: MC.opposites, say: `Substitute ${MINUS}${fi}: the value is ${nH(qVal(V.re))}, not 0.` },
  ]);
});

/** substitute into a quadratic with a complex coefficient (checked by substitution only) */
export const coefResidual: Gen = (R, n) => {
  const p = int(R, 1, 4), qv = int(R, p, 5), s = p + qv, P = p * qv;
  const tv = pickOf(R, [p, qv, -p, -qv, p + 1]);
  const z = C(0, tv), B = C(0, -s), Cc = RE(-P), V = evalQ(RE(1), B, Cc, z).val;
  const zi = tv === 1 ? II : tv === -1 ? `${MINUS}${II}` : `${nH(tv)}${II}`;
  return cxPair({
    id: `coefResidual-${n}`, family: 'coefResidual',
    prompt: `Substitute ${X} = ${zi} into ${X}<sup>2</sup> − ${s}${II}${X} − ${P}. What number do you get? Type it as a + b${II}.`,
    board: `x^{2} - ${s}ix - ${P} \\\\ \\text{at } x = ${cxTex(z)}`,
    picture: { roots: rootsPic([pt('z', z)]) },
    solution: [`${X}<sup>2</sup> = (${zi})<sup>2</sup> = ${tv * tv}${II}<sup>2</sup> = ${nH(-tv * tv)}.`, `${MINUS}${s}${II} · ${tv < 0 ? `(${zi})` : zi} = ${nH(-s * tv)}${II}<sup>2</sup> = ${nH(s * tv)}.`, `${nH(-tv * tv)} ${sgn(s * tv)} − ${P} = ${nH(qVal(V.re))}.`, endZ(V), isZ(V) ? `0: ${zi} is a root.` : `Not 0: ${zi} is not a root.`],
  }, V, isZ(V) ? `Yes: 0, so ${zi} is a root.` : `Yes: ${cxHtml(V)}, so ${zi} is not a root.`, [
    { z: evalPlus(RE(1), B, Cc, z), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1 in BOTH terms: (${zi})<sup>2</sup> = ${nH(-tv * tv)}, and ${MINUS}${s}${II} · ${zi} = ${nH(s * tv)}.` },
  ], `Each term has ${II} · ${II} = ${MINUS}1 in it: work them out one at a time.`);
};

// ===================== build-from-conjugate-root (extension) =====================
/** from one root p + qi: x² + □x + □ (pure imaginary roots, scaling by a ≠ 1) */
export const buildQuad: Gen = (R, n) => {
  const t = pickOf(R, ['int', 'int', 'pure', 'scaled'] as const);
  const [p0, qq] = pq(R, 34), p = t === 'pure' ? 0 : p0, A = t === 'scaled' ? pickOf(R, [2, 3, -1, -2]) : 1;
  const z = C(p, qq * (R() < 0.5 ? 1 : -1)), S = p * p + qq * qq;
  const lead = `${A === 1 ? '' : A === -1 ? MINUS : nH(A)}${X}<sup>2</sup> +`;
  return twoNum({
    id: `buildQuad-${n}`, family: 'buildQuad',
    prompt: `Build a quadratic with real coefficients${A === 1 ? '' : ` and leading coefficient ${nH(A)}`} that has the root ${cxHtml(z)}. Fill in ${lead} □${X} + □.`,
    board: `\\text{root } ${cxTex(z)}:\\ \\ ${A === 1 ? '' : A === -1 ? '-' : A}x^{2} + \\square x + \\square`,
    picture: { roots: rootsPic([pt('z', z)], [pt('w', conj(z), 'link')], p) },
    solution: [
      `Real coefficients: the other root is the conjugate ${cxHtml(conj(z))}.`,
      `(${X} − (${cxHtml(z)}))(${X} − (${cxHtml(conj(z))})) = (${p === 0 ? X : `${X} ${p > 0 ? MINUS : '+'} ${Math.abs(p)}`})<sup>2</sup> − (${qq === 1 ? '' : qq}${II})<sup>2</sup> = ${polyH(1, -2 * p, S)}.`,
      ...(A !== 1 ? [`Times ${nH(A)}: ${polyH(A, -2 * p * A, A * S)}.`] : []),
      `So the boxes hold ${ans(nH(-2 * p * A))} and ${ans(nH(A * S))}.`,
    ],
  }, -2 * p * A, A * S, { lead, op: `${X} +`, tail: '' }, `Yes: ${polyH(A, -2 * p * A, A * S)}.`, [
    { x: 2 * p * A, y: A * S, mc: MC.zeroSign, say: `The factors are (${X} − root): the middle coefficient is −(sum of the roots)${A === 1 ? '' : ` · ${nH(A)}`} = ${nH(-2 * p * A)}.` },
    { x: -2 * p * A, y: A * (p * p - qq * qq), mc: MC.i2Plus, say: `(${qq === 1 ? '' : qq}${II})<sup>2</sup> = ${MINUS}${qq * qq}: subtracting it ADDS ${qq * qq}.` },
    ...(A !== 1 ? [{ x: -2 * p, y: S, say: `Multiply by the leading coefficient ${nH(A)} too.` }] : []),
  ], `The other root is ${cxHtml(conj(z))}; multiply (${X} − root)(${X} − other root).`);
};

/** which quadratic has the root p + qi and real coefficients? one factor, opposites, i² = +1 */
export const buildPick: Gen = (R, n) => retry(() => {
  const [p, qq] = pq(R, 34, true), z = C(p, qq * (R() < 0.5 ? 1 : -1)), S = p * p + qq * qq;
  const z2 = mul(z, z);
  return keyed(R, {
    id: `buildPick-${n}`, family: 'buildPick',
    prompt: `Which is a quadratic with real coefficients that has ${cxHtml(z)} as a root?`,
    board: `\\text{root } ${cxTex(z)}`,
    picture: { roots: rootsPic([pt('z', z)], [pt('w', conj(z), 'link')], p) },
    solution: [`Real coefficients: the other root is ${cxHtml(conj(z))}.`, `(${X} − (${cxHtml(z)}))(${X} − (${cxHtml(conj(z))})) = ${polyH(1, -2 * p, S)}.`],
  }, [
    { t: polyH(1, -2 * p, S), ok: true, key: keyQuad(1, -2 * p, S), say: `Yes: the product of the conjugate factors has real coefficients.` },
    { t: `${X} − (${cxHtml(z)})`, key: 'lin', mc: MC.oneFactor, say: `That is one factor: it is not a quadratic, and its constant is not real. Multiply by the conjugate factor.` },
    { t: polyH(1, -2 * p, p * p - qq * qq), key: keyQuad(1, -2 * p, p * p - qq * qq), mc: MC.i2Plus, say: `(${qq === 1 ? '' : qq}${II})<sup>2</sup> = ${MINUS}${qq * qq}, so the constant is ${p * p} + ${qq * qq}.` },
    { t: polyH(1, 2 * p, S), key: keyQuad(1, 2 * p, S), mc: MC.zeroSign, say: `The factor of a root r is (${X} − r): the middle term is ${nH(-2 * p)}${X}.` },
    { t: `${X}<sup>2</sup> − ${par(z)}<sup>2</sup>`, key: p === 0 ? keyQuad(1, 0, S) : `opp:${cxHtml(z2)}`, mc: MC.opposites, say: `That pairs ${cxHtml(z)} with its opposite ${cxHtml(negZ(z))}; the constant ${cxHtml(negZ(z2))} is not real.` },
  ]);
});

// ===================== interpret-in-model =====================
interface Model { kind: 'ball' | 'pen'; prompt: string; board: string; T: number; max: number; at: number; sol: ReturnType<typeof nr>; unitY: string; unitX: string; pic: ReturnType<typeof modelPic>; eqLine: string }
function model(R: () => number): Model {
  if (R() < 0.6) {
    // v = 32 would put the top at t = 1, where "1 seconds" reads wrong
    const v = pickOf(R, [16, 48, 64]), h0 = int(R, 0, 12), max = h0 + v * v / 64, d = int(R, 2, 14), T = max + d;
    const tLand = (v + Math.sqrt(v * v + 64 * h0)) / 32;
    const hH = `${MINUS}16<i>t</i><sup>2</sup> + ${v}<i>t</i>${h0 ? ` + ${h0}` : ''}`;
    return {
      kind: 'ball', T, max, at: v / 32, sol: nr(q(v, 32), q(1, 4), d), unitY: 'feet', unitX: 'seconds',
      prompt: `A ball is thrown up. Its height after <i>t</i> seconds is h(<i>t</i>) = ${hH} feet, for <i>t</i> from 0 until it lands.`,
      board: `-16t^{2} + ${v}t${h0 ? ` + ${h0}` : ''}`,
      pic: modelPic(-16, v, h0, 0, tLand, T, 't (seconds)', 'h (feet)', `${T} ft`),
      eqLine: `${hH} = ${T} → 16<i>t</i><sup>2</sup> − ${v}<i>t</i> + ${T - h0} = 0, b<sup>2</sup> − 4ac = ${v * v} − ${64 * (T - h0)} = ${nH(-64 * d)}.`,
    };
  }
  const sHalf = pickOf(R, [6, 8, 10, 12, 14, 16, 20]), max = sHalf * sHalf / 4, d = int(R, 1, 12), T = max + d;
  return {
    kind: 'pen', T, max, at: sHalf / 2, sol: nr(q(sHalf, 2), q(1), d), unitY: 'square feet', unitX: 'feet',
    prompt: `A rectangular pen uses ${2 * sHalf} feet of fence. With one side <i>x</i> feet, its area is A(<i>x</i>) = <i>x</i>(${sHalf} − <i>x</i>) square feet, for <i>x</i> from 0 to ${sHalf}.`,
    board: `x(${sHalf} - x)`,
    pic: modelPic(-1, sHalf, 0, 0, sHalf, T, 'x (feet)', 'A (sq ft)', `${T} sq ft`),
    eqLine: `<i>x</i>(${sHalf} − <i>x</i>) = ${T} → <i>x</i><sup>2</sup> − ${sHalf}<i>x</i> + ${T} = 0, b<sup>2</sup> − 4ac = ${sHalf * sHalf} − ${4 * T} = ${nH(-4 * d)}.`,
  };
}
const varOf = (m: Model) => (m.kind === 'ball' ? '<i>t</i>' : X);
export const modelInterp: Gen = (R, n) => retry(() => {
  const m = model(R), ask = m.kind === 'ball' ? `When does the ball reach a height of ${m.T} feet?` : `Can the pen have an area of ${m.T} square feet?`;
  return keyed(R, {
    id: `modelInterp-${n}`, family: 'modelInterp',
    prompt: `${m.prompt} ${ask}`,
    board: `${m.board} = ${m.T}`,
    picture: { graph: m.pic },
    solution: [m.eqLine, `Negative: the solutions ${varOf(m)} = ${nrH(m.sol)} are not real numbers, and ${m.kind === 'ball' ? 'a time' : 'a length'} must be real.`, m.kind === 'ball' ? `So the ball never reaches ${m.T} feet: its highest point is ${m.max} feet.` : `So no pen has that area: the most is ${m.max} square feet (${m.at === 8 || m.at === 18 || m.at === 11 ? 'an' : 'a'} ${m.at}-by-${m.at} square).`],
  }, [
    { t: m.kind === 'ball' ? `Never: the solutions are not real, so no time works. The ball tops out at ${m.max} feet.` : `No: the solutions are not real, so no side length works. The most area is ${m.max} square feet.`, ok: true, say: `Yes. Non-real solutions mean the event never happens in this model.` },
    { t: m.kind === 'ball' ? `At <i>t</i> = ${nrH(m.sol)} seconds.` : `Yes, with sides <i>x</i> = ${nrH(m.sol)} feet.`, mc: MC.domainAll, say: `${m.kind === 'ball' ? 'Time' : 'A length'} in this model is a real number. Non-real solutions say: it never happens.` },
    { t: `The algebra must be wrong: ${m.kind === 'ball' ? 'a height' : 'an area'} question always has an answer.`, mc: MC.noSolError, say: `The algebra is fine: b<sup>2</sup> − 4ac is negative because ${m.T} is more than the ${m.kind === 'ball' ? 'highest point' : 'largest area'}, ${m.max}.` },
    { t: m.kind === 'ball' ? `At <i>t</i> = ${m.at} ${unitN(m.at, 'seconds')}, the top of its path.` : `Yes, with ${m.at === 8 || m.at === 18 || m.at === 11 ? 'an' : 'a'} ${m.at}-by-${m.at} square.`, say: m.kind === 'ball' ? `At <i>t</i> = ${m.at} the ball is at ${m.max} feet, its highest point: still below ${m.T}.` : `${m.at === 8 || m.at === 18 || m.at === 11 ? 'An' : 'A'} ${m.at}-by-${m.at} square has area ${m.max}, not ${m.T}.` },
  ]);
});

/** the largest value of the model, with a unit check (a time is not a height, a length is not an area) */
export const modelMax: Gen = (R, n) => {
  const m = model(R);
  const ask = m.kind === 'ball'
    ? `Jay solves h(<i>t</i>) = ${m.T} and gets <i>t</i> = ${nrH(m.sol)}. He says: "So the ball never gets that high; its highest point is ${m.at}." What is its highest point, in feet?`
    : `Jay solves A(<i>x</i>) = ${m.T} and gets <i>x</i> = ${nrH(m.sol)}. He says: "So the area can't be that big; the biggest area is ${m.at}." What is the biggest area, in square feet?`;
  return numItem({
    id: `modelMax-${n}`, family: 'modelMax',
    prompt: `${m.prompt} ${ask}`,
    board: `${m.board} = ${m.T}`,
    unit: m.unitY,
    picture: { graph: { ...m.pic, reveal: { vertexName: m.kind === 'ball' ? `${m.max} ft` : `${m.max} sq ft` } } },
    solution: [`The real part ${m.at} of the solutions is the ${m.kind === 'ball' ? 'time of the top' : 'side at the top'} (the vertex): ${m.at} ${unitN(m.at, m.unitX)}, not ${m.unitY}.`, m.kind === 'ball' ? `h(${m.at}) = ${ans(String(m.max))} feet: below ${m.T}, so the ball never reaches it.` : `A(${m.at}) = ${m.at} · ${m.at} = ${ans(String(m.max))} square feet: less than ${m.T}.`],
  }, m.max, `Yes: ${m.max} ${m.unitY}, less than ${m.T}.`, [
    { v: m.at, say: `${m.at} is in ${m.unitX}: it is ${m.kind === 'ball' ? 'WHEN the top happens' : 'the side length at the top'}. Put it into the model to get ${m.unitY}.` },
    { v: m.T, mc: MC.domainAll, say: `${m.T} is never reached: the solutions for it are not real.` },
    ...(m.kind === 'ball' ? [{ v: m.max - (m.pic.s[2] ?? 0), say: `Add the starting height ${m.pic.s[2]}: h(${m.at}) includes it.` }] : []),
  ], `Put the real part ${m.at} back into the model.`);
};

export const FAM2: Record<string, Gen> = {
  residual, verifyVerdict, conjProofStep, secondRoot, pairCheck, whichPair, conjEnough, whichEquation, complexCoef,
  coefResidual, buildQuad, buildPick, modelInterp, modelMax,
};
void imH;
