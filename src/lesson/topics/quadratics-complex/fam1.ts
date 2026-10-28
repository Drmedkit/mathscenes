// fam1.ts: practice families for stages 1-2 of "Quadratics with complex solutions": roots of negatives, what a
// negative discriminant means, square roots, the formula (perfect-square and radical discriminants, a ≠ 1), and the
// choice of method.
import { int } from '../../runtime/item';
import { type Base, type Gen, type Opt, type QItem, MC, MINUS, II, ans, endPm, keyed, numItem, nz, pickOf, pmPair, retry, Reroll } from './common';
import {
  type NR, type Q, disc, isSq, keyCx, keyNR, keyReal, keySolve, nonReal, nr, nrH, nrT, nrTypable, nrNum, nH, oneH, polyH, polyT,
  q, qH, qVal, qNeg, realRoots, rootH, rootsH, squareFree, binH, binT, C, imH,
} from './qc';
import { graphPic, rootsPic } from './pic';

const X = '<i>x</i>';
const rt = (s: number | string) => rootH(2, s);
const par = (v: number) => (v < 0 ? `(${nH(v)})` : nH(v));
const eqH = (a: number, b: number, c: number) => `${polyH(a, b, c)} = 0`;
const eqT = (a: number, b: number, c: number) => `${polyT(a, b, c)} = 0`;
/** s·i√m as HTML for a whole s (the simplified root of −k) */
const iRoot = (s: number, m: number) => imH(q(s), m);
/** the roots as points on the complex plane: names written plainly (2 + 3i) */
const plainNR = (x: NR, sg: 1 | -1) => oneH(x, sg).replace(/<[^>]+>/g, '');
function rootPts(x: NR, named = true) {
  const [p, v] = nrNum(x);
  return [
    { key: 'p', at: [p, v] as [number, number], col: 'link', name: named && x.m === 1 && x.re[1] === 1 && x.im[1] === 1 ? plainNR(x, 1) : undefined },
    { key: 'm', at: [p, -v] as [number, number], col: 'link', name: named && x.m === 1 && x.re[1] === 1 && x.im[1] === 1 ? plainNR(x, -1) : undefined },
  ];
}
/** the plane: empty at first, the two roots and their shared real part come in at the solve */
const rootsReveal = (x: NR) => ({ roots: rootsPic([], rootPts(x), undefined, qVal(x.re)) });

/** the formula's worked lines for ax² + bx + c = 0 with b² − 4ac < 0 */
function formulaLines(a: number, b: number, c: number): string[] {
  const D = disc(a, b, c), { k, m } = squareFree(-D), x = nonReal(a, b, c);
  const rootStep = m === 1 ? `${rt(MINUS + -D)} = ${II}${rt(-D)} = ${iRoot(k, 1)}` : k === 1 ? `${rt(MINUS + -D)} = ${II}${rt(-D)}` : `${rt(MINUS + -D)} = ${II}${rt(-D)} = ${II}${rt(`${k * k} · ${m}`)} = ${iRoot(k, m)}`;
  return [
    `a = ${nH(a)}, b = ${nH(b)}, c = ${nH(c)}: b<sup>2</sup> − 4ac = ${par(b)}<sup>2</sup> − 4 · ${par(a)} · ${par(c)} = ${nH(D)}, a negative number.`,
    `${rootStep}.`,
    `${X} = (${nH(-b)} ± ${iRoot(k, m)}) / ${par(2 * a)}: divide BOTH terms by ${par(2 * a)}, so ${X} = ${nrH(x)}.`,
  ];
}
/** the end line of a choice item naming the roots */
const roots = (x: NR) => `${X} = ${nrH(x)}`;

// ===================== sqrt-of-negative =====================
const FREE = [2, 3, 5, 6, 7, 10];
/** √(−k) as i times a real root: perfect squares first, then square factors pulled out */
export const rootNeg: Gen = (R, n) => retry(() => {
  const perfect = R() < 0.4;
  const out = perfect ? int(R, 2, 12) : int(R, 1, 5), rest = perfect ? 1 : pickOf(R, FREE), k = out * out * rest;
  if (!perfect && out === 1 && R() < 0.5) throw new Reroll();
  const right = iRoot(out, rest), simp = !perfect && out > 1;
  const realT = rest === 1 ? String(out) : `${out === 1 ? '' : out}${rt(rest)}`;
  const opts: Opt[] = [
    { t: right, ok: true, key: `i:${k}`, say: `Yes: ${rt(MINUS + k)} = ${II}${rt(k)} = ${right}. Check: (${right})<sup>2</sup> = ${k} · ${II}<sup>2</sup> = ${MINUS}${k}.` },
    { t: MINUS + realT, key: `r:-${k}`, mc: MC.rootNegReal, say: `(${MINUS}${realT})<sup>2</sup> = +${k}, not ${MINUS}${k}. A negative real number squares to a positive one: ${rt(MINUS + k)} = ${II}${rt(k)}.` },
    { t: realT, key: `r:${k}`, mc: MC.dropsI, say: `The ${II} went missing: ${rt(MINUS + k)} = ${II} · ${rt(k)}, and (${realT})<sup>2</sup> = +${k}.` },
    ...(rest > 1 ? [{ t: `${out === 1 ? '' : out}${rt(`${rest}${II}`)}`, key: `iu:${k}`, mc: MC.iUnder, say: `The ${II} comes OUT of the root: ${rt(MINUS + k)} = ${II}${rt(k)} = ${right}. It never goes under the root sign.` }] : []),
    { t: `±${right}`, key: `pm:${k}`, mc: MC.plusMinus, say: `${right} and ${MINUS}${right} both square to ${MINUS}${k}, but the root sign names ONE number, the principal root ${right}.` },
    ...(rest > 1 && [2, 3, 5].includes(out) && out !== rest ? [{ t: iRoot(rest, out), key: `i:${rest * rest * out}`, say: `Pull out the SQUARE factor: ${k} = ${out * out} · ${rest}, so ${rt(k)} = ${out}${rt(rest)}.` }] : []),
  ];
  return keyed(R, {
    id: `rootNeg-${n}`, family: 'rootNeg',
    prompt: simp ? `Simplify ${rt(MINUS + k)}. (Write ${II} before the root, and pull out every square factor.)` : `Write ${rt(MINUS + k)} as ${II} times a real number.`,
    board: `\\sqrt{-${k}} = \\,?`,
    picture: perfect ? { roots: rootsPic([], [{ key: 'z', at: [0, out], col: 'link', name: `${out}i` }]) } : undefined,
    solution: [
      `${rt(MINUS + k)} = ${rt(MINUS + '1')} · ${rt(k)} = ${II}${rt(k)}.`,
      perfect ? `${rt(k)} = ${out}, so ${rt(MINUS + k)} = ${right}.` : simp ? `${k} = ${out * out} · ${rest}, so ${rt(k)} = ${out}${rt(rest)} and ${rt(MINUS + k)} = ${right}.` : `${k} has no square factor, so ${rt(MINUS + k)} = ${right}.`,
      `Check: (${right})<sup>2</sup> = ${II}<sup>2</sup> · ${k} = ${MINUS}${k}.`,
    ],
  }, opts);
});

/** the number in front: √(−48) = □ i√3, √(−36) = □ i, and the square check (i√k)² = □ */
export const rootNegCoef: Gen = (R, n) => {
  const t = pickOf(R, ['front', 'front', 'perfect', 'square'] as const);
  if (t === 'square') {
    const k = pickOf(R, [5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23]);
    return numItem({
      id: `rootNegCoef-${n}`, family: 'rootNegCoef',
      prompt: `Check that ${II}${rt(k)} is a square root of ${MINUS}${k}: what is (${II}${rt(k)})<sup>2</sup>?`,
      board: `(i\\sqrt{${k}})^{2} = \\,?`,
      solution: [`(${II}${rt(k)})<sup>2</sup> = ${II}<sup>2</sup> · (${rt(k)})<sup>2</sup> = (${MINUS}1) · ${k}.`, `So (${II}${rt(k)})<sup>2</sup> = ${ans(MINUS + k)}: ${II}${rt(k)} really is a square root of ${MINUS}${k}.`],
    }, -k, `Yes: ${II}<sup>2</sup> · ${k} = ${MINUS}${k}.`, [
      { v: k, mc: MC.i2Plus, say: `${II}<sup>2</sup> is ${MINUS}1, not +1: (${II}${rt(k)})<sup>2</sup> = (${MINUS}1) · ${k}.` },
      { v: -k * k, say: `(${rt(k)})<sup>2</sup> = ${k}, not ${k * k}: squaring a square root undoes it.` },
    ], `Square both factors: ${II}<sup>2</sup> = ${MINUS}1 and (${rt(k)})<sup>2</sup> = ${k}.`);
  }
  if (t === 'perfect') {
    const r = int(R, 2, 12), k = r * r;
    return numItem({
      id: `rootNegCoef-${n}`, family: 'rootNegCoef',
      prompt: `${rt(MINUS + k)} = □${II}. What number goes in the box?`,
      board: `\\sqrt{-${k}} = \\square\\, i`, unit: 'i',
      picture: { roots: rootsPic([], [{ key: 'z', at: [0, r], col: 'link', name: `${r}i` }]) },
      solution: [`${rt(MINUS + k)} = ${II}${rt(k)}, and ${rt(k)} = ${r}.`, `So ${rt(MINUS + k)} = ${r}${II}: the box holds ${ans(String(r))}.`],
    }, r, `Yes: ${rt(MINUS + k)} = ${r}${II}.`, [
      { v: -r, mc: MC.rootNegReal, say: `The principal root has a POSITIVE number in front: ${rt(MINUS + k)} = ${II}${rt(k)} = ${r}${II}.` },
      { v: k, say: `Take the root of ${k}: ${rt(k)} = ${r}.` },
    ], `${rt(MINUS + k)} = ${II}${rt(k)}: what is ${rt(k)}?`);
  }
  const out = int(R, 2, 6), rest = pickOf(R, FREE), k = out * out * rest;
  return numItem({
    id: `rootNegCoef-${n}`, family: 'rootNegCoef',
    prompt: `Simplify: ${rt(MINUS + k)} = □${II}${rt(rest)}. What number goes in the box?`,
    board: `\\sqrt{-${k}} = \\square\\, i\\sqrt{${rest}}`,
    solution: [`${rt(MINUS + k)} = ${II}${rt(k)}, and ${k} = ${out * out} · ${rest}.`, `${rt(k)} = ${rt(out * out)} · ${rt(rest)} = ${out}${rt(rest)}, so the box holds ${ans(String(out))}.`],
  }, out, `Yes: ${rt(MINUS + k)} = ${out}${II}${rt(rest)}.`, [
    { v: out * out, say: `${out * out} is the square factor; the number in front is its ROOT, ${rt(out * out)} = ${out}.` },
    { v: -out, mc: MC.rootNegReal, say: `The principal root has a positive number in front: ${rt(MINUS + k)} = ${II}${rt(k)} = ${out}${II}${rt(rest)}.` },
  ], `Find the square factor of ${k}, then take its root.`);
};

// ===================== neg-discriminant-meaning =====================
type Kind = 'neg' | 'zero' | 'pos';
/** integer a, b, c (|each| <= 10) with a discriminant of the asked sign */
function coefs(R: () => number, kind: Kind): [number, number, number] {
  for (;;) {
    const a = nz(R, -5, 5);
    if (kind === 'zero') { const h = nz(R, -5, 5), b = -2 * a * h, c = a * h * h; if (Math.abs(b) <= 10 && Math.abs(c) <= 10) return [a, b, c]; continue; }
    const b = int(R, -10, 10), c = nz(R, -10, 10), D = disc(a, b, c);
    if ((kind === 'neg' && D < 0) || (kind === 'pos' && D > 0)) return [a, b, c];
  }
}
const KIND_T = { neg: 'two non-real complex solutions (a conjugate pair)', zero: 'exactly one real solution (a double root)', pos: 'two different real solutions' } as const;
/** classify the solutions by the sign of b² − 4ac: a > 0 and a < 0, contrasted with = 0 and > 0 */
export const discCount: Gen = (R, n) => retry(() => {
  const kind = pickOf(R, ['neg', 'neg', 'neg', 'zero', 'pos', 'pos'] as const);
  const [a, b, c] = coefs(R, kind), D = disc(a, b, c);
  const opts: Opt[] = [
    { t: KIND_T[kind], ok: true, say: `Yes: b<sup>2</sup> − 4ac = ${nH(D)}${D < 0 ? `, so ${rt('b<sup>2</sup> − 4ac')} is not real and the ± gives two non-real numbers` : D === 0 ? ', so ± 0 gives the same number twice' : ', so ± a real root gives two real numbers'}.` },
    { t: 'no solutions at all', mc: D < 0 ? MC.noSolution : D === 0 ? MC.zeroNone : undefined, say: D < 0 ? `No REAL solutions, but the formula still works: ${rt(nH(D))} = ${II}${rt(-D)}, and ± gives two non-real solutions.` : `b<sup>2</sup> − 4ac = ${nH(D)} is not negative, so the formula gives real solutions.` },
    { t: 'exactly one non-real solution', mc: D < 0 ? MC.oneComplex : undefined, say: `The ± makes two: −b/(2a) + (…)${II} and −b/(2a) − (…)${II}. A negative discriminant gives a PAIR of non-real solutions.` },
    ...(['neg', 'zero', 'pos'] as const).filter(k => k !== kind).map(k => ({ t: KIND_T[k], mc: kind === 'neg' && k !== 'neg' ? MC.realZero : kind === 'zero' && k === 'pos' ? MC.repeated : undefined, say: `b<sup>2</sup> − 4ac = ${par(b)}<sup>2</sup> − 4 · ${par(a)} · ${par(c)} = ${nH(D)}. ${D < 0 ? 'It is negative.' : D === 0 ? 'It is 0.' : 'It is positive.'}` })),
  ];
  return keyed(R, {
    id: `discCount-${n}`, family: 'discCount',
    prompt: `Use the discriminant: how many solutions does ${eqH(a, b, c)} have, and what kind?`,
    board: eqT(a, b, c),
    picture: { graph: graphPic(a, b, c, { late: true, vertex: true, reveal: D >= 0 ? { xints: realRoots(a, b, c).kind === 'one' ? [-b / (2 * a)] : [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)] } : undefined }) },
    solution: [
      `b<sup>2</sup> − 4ac = ${par(b)}<sup>2</sup> − 4 · ${par(a)} · ${par(c)} = ${b * b} ${-4 * a * c < 0 ? '−' : '+'} ${Math.abs(4 * a * c)} = ${nH(D)}.`,
      D < 0 ? `Negative: ${rt('b<sup>2</sup> − 4ac')} is ${II} times a real number, so ${X} = −b/(2a) ± (a real number)${II}: two non-real solutions. No real ones, so the parabola misses the ${X}-axis.` : D === 0 ? `Zero: the ± adds and subtracts 0, so there is one real solution (the vertex touches the ${X}-axis).` : `Positive: ± a real root gives two different real solutions (the parabola crosses the ${X}-axis twice).`,
    ],
  }, opts, { max: 3 });
});

/** the value of b² − 4ac (the slip b² + 4ac) */
export const discValue: Gen = (R, n) => {
  const kind = pickOf(R, ['neg', 'neg', 'neg', 'pos'] as const);
  for (;;) {
    const [a, b, c] = coefs(R, kind), D = disc(a, b, c);
    if (a * c <= 0 && R() < 0.7) continue;     // mostly ac > 0, where b² + 4ac is a different number
    return numItem({
      id: `discValue-${n}`, family: 'discValue',
      prompt: `What is the discriminant b<sup>2</sup> − 4ac of ${eqH(a, b, c)}?`,
      board: eqT(a, b, c),
      picture: { graph: graphPic(a, b, c, { late: true, vertex: true }) },
      solution: [`a = ${nH(a)}, b = ${nH(b)}, c = ${nH(c)}.`, `b<sup>2</sup> − 4ac = ${par(b)}<sup>2</sup> − 4 · ${par(a)} · ${par(c)} = ${b * b} − (${nH(4 * a * c)}) = ${ans(nH(D))}.`, D < 0 ? `Negative, so the solutions are two non-real numbers.` : `Positive, so the solutions are two real numbers.`],
    }, D, `Yes: ${nH(D)}${D < 0 ? ', so two non-real solutions' : ''}.`, [
      { v: b * b + 4 * a * c, mc: a * c > 0 ? MC.discAdd : undefined, say: `It is b<sup>2</sup> MINUS 4ac: ${b * b} − ${nH(4 * a * c)}.` },
      { v: -b * b - 4 * a * c, say: `${par(b)}<sup>2</sup> = ${b * b} is positive: a square is never negative.` },
      { v: b - 4 * a * c, say: `Square b first: ${par(b)}<sup>2</sup> = ${b * b}.` },
    ], `b<sup>2</sup> − 4ac with a = ${nH(a)}, b = ${nH(b)}, c = ${nH(c)}.`);
  }
};

/** complex vs real vs none: real solutions are complex too; "no real solution" is not "no solution" */
export const complexTruth: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['realIsComplex', 'twoNonReal', 'ana'] as const);
  const r = int(R, 1, 9), k = r * r, ri = r === 1 ? II : `${r}${II}`;
  if (t === 'realIsComplex') return keyed(R, {
    id: `complexTruth-${n}`, family: 'complexTruth',
    prompt: `Is it right to say that ${X}<sup>2</sup> − ${k} = 0 has no complex solutions?`,
    board: `x^{2} - ${k} = 0`,
    picture: { roots: rootsPic([], [{ key: 'a', at: [r, 0], col: 'link', name: String(r) }, { key: 'b', at: [-r, 0], col: 'link', name: `−${r}` }]) },
    solution: [`${X}<sup>2</sup> = ${k}, so ${X} = ${r} or ${X} = ${MINUS}${r}: two real solutions.`, `Every real number is a complex number with imaginary part 0: ${r} = ${r} + 0${II}. So the equation has two complex solutions, and both are real.`],
  }, [
    { t: `No: its solutions ±${r} are real, and every real number is also a complex number (${r} = ${r} + 0${II}).`, ok: true, say: `Yes. The real numbers sit inside the complex numbers, on the real axis.` },
    { t: `Yes: its solutions are real numbers, and real numbers are not complex.`, mc: MC.realsNot, say: `${r} = ${r} + 0${II}: a real number is a complex number whose imaginary part is 0.` },
    { t: `Yes: there is no ${II} in the equation, so it has nothing to do with complex numbers.`, mc: MC.realsNot, say: `Its solutions ±${r} are complex numbers with imaginary part 0. Real numbers ARE complex numbers.` },
    { t: `No: it has two non-real solutions, ±${ri}.`, say: `(${ri})<sup>2</sup> = ${MINUS}${k}, so (${ri})<sup>2</sup> − ${k} = ${MINUS}${2 * k}, not 0. The solutions are ±${r}.` },
  ]);
  if (t === 'twoNonReal') return keyed(R, {
    id: `complexTruth-${n}`, family: 'complexTruth',
    prompt: `Which statement about ${X}<sup>2</sup> + ${k} = 0 is true?`,
    board: `x^{2} + ${k} = 0`,
    picture: { graph: graphPic(1, 0, k, { late: true, vertex: true }) },
    solution: [`${X}<sup>2</sup> = ${MINUS}${k}: no real number squares to a negative.`, `But ${X} = ${ri} and ${X} = ${MINUS}${ri} work: (±${ri})<sup>2</sup> = ${k}${II}<sup>2</sup> = ${MINUS}${k}.`],
  }, [
    { t: `It has no real solutions, but two non-real solutions: ±${ri}.`, ok: true, say: `Yes: (±${ri})<sup>2</sup> + ${k} = ${MINUS}${k} + ${k} = 0.` },
    { t: `It has no solutions.`, mc: MC.noSolution, say: `No REAL solutions. In the complex numbers, ±${ri} both solve it.` },
    { t: `Its solutions ±${ri} are imaginary, so they don't count: the equation is unsolvable.`, mc: MC.dismiss, say: `Solving over the complex numbers, ±${ri} are real answers to the question: (±${ri})<sup>2</sup> + ${k} = 0.` },
    { t: `It has one complex solution, ${ri}.`, mc: MC.oneComplex, say: `${MINUS}${ri} works too: (${MINUS}${ri})<sup>2</sup> = ${MINUS}${k}. Two solutions.` },
  ]);
  const [a, b, c] = coefs(R, 'neg'), D = disc(a, b, c);
  return keyed(R, {
    id: `complexTruth-${n}`, family: 'complexTruth',
    prompt: `Ana finds b<sup>2</sup> − 4ac = ${nH(D)} for ${eqH(a, b, c)} and writes "no solution". What should she write?`,
    board: `b^{2} - 4ac = ${D}`,
    picture: { graph: graphPic(a, b, c, { late: true, vertex: true }) },
    solution: [`b<sup>2</sup> − 4ac = ${nH(D)} is negative, so ${rt(nH(D))} = ${II}${rt(-D)} is not a real number.`, `The formula still gives two numbers, −b/(2a) ± (a real number)${II}: no REAL solution, but two non-real complex solutions.`],
  }, [
    { t: `No real solution; there are two non-real complex solutions.`, ok: true, say: `Yes. "No real solution" and "no solution" are different claims.` },
    { t: `"No solution" is right.`, mc: MC.noSolution, say: `Over the complex numbers there are two: ${rt(nH(D))} = ${II}${rt(-D)}, and the ± gives a pair.` },
    { t: `One non-real solution.`, mc: MC.oneComplex, say: `The ± gives two, a conjugate pair.` },
    { t: `"There is a mistake": a quadratic always has real solutions.`, mc: MC.noSolError, say: `A negative discriminant is not a mistake: the parabola misses the ${X}-axis, and the solutions are non-real.` },
  ]);
});

// ===================== sqrt-method-negative =====================
/** solve by square roots when the isolated square is negative: x² = −k, ax² + c = 0, (x − h)² = −k, A(x − h)² = −m */
export const sqrtSolve: Gen = (R, n) => {
  const t = pickOf(R, ['x2', 'ax2', 'shift', 'shift', 'Ashift'] as const);
  const r = int(R, 1, 9), h = t === 'x2' || t === 'ax2' ? 0 : nz(R, -5, 5), A = t === 'ax2' ? int(R, 2, 5) : t === 'Ashift' ? pickOf(R, [-4, -3, -2, 2, 3, 4]) : 1;
  const x = nr(q(h), q(r)), k = r * r;
  const sq = h === 0 ? `${X}<sup>2</sup>` : `(${binH(h)})<sup>2</sup>`, sqT = h === 0 ? 'x^{2}' : `(${binT(h)})^{2}`;
  let prompt: string, board: string, first: string;
  if (t === 'x2') { prompt = `${X}<sup>2</sup> = ${MINUS}${k}`; board = `x^{2} = -${k}`; first = `The square is already alone: ${X}<sup>2</sup> = ${MINUS}${k}.`; }
  else if (t === 'ax2') { prompt = `${A}${X}<sup>2</sup> + ${A * k} = 0`; board = `${A}x^{2} + ${A * k} = 0`; first = `Subtract ${A * k} and divide by ${A}: ${X}<sup>2</sup> = ${MINUS}${k}.`; }
  else if (t === 'shift') { const add = R() < 0.5; prompt = add ? `${sq} + ${k} = 0` : `${sq} = ${MINUS}${k}`; board = add ? `${sqT} + ${k} = 0` : `${sqT} = -${k}`; first = add ? `Subtract ${k}: ${sq} = ${MINUS}${k}.` : `The square is alone: ${sq} = ${MINUS}${k}.`; }
  else { prompt = `${nH(A)}${sq} = ${nH(-A * k)}`; board = `${A}${sqT} = ${-A * k}`; first = `Divide by ${par(A)}: ${sq} = ${MINUS}${k}.`; }
  return pmPair({
    id: `sqrtSolve-${n}`, family: 'sqrtSolve',
    prompt: `Solve ${prompt} by taking square roots. Type the solutions as ${X} = a ± b${II}.`,
    board,
    picture: rootsReveal(x),
    solution: [first, `Take ± the square root: ${h === 0 ? X : `${binH(h)}`} = ±${rt(MINUS + k)} = ±${r === 1 ? II : `${r}${II}`}.`, ...(h !== 0 ? [`Add ${nH(h)} to both sides: ${X} = ${nH(h)} ± ${r === 1 ? II : `${r}${II}`}.`] : []), endPm(x)],
  }, x, `Yes: ${X} = ${nrH(x)}.`, [
    ...(h !== 0 ? [{ re: -h, im: r, mc: MC.zeroSign, say: `${binH(h)} is 0 when ${X} = ${nH(h)}, not ${nH(-h)}: move the ${nH(-h)} across and its sign changes.` }] : []),
    { re: h, im: k, say: `Take the square ROOT of ${k}: ${rt(MINUS + k)} = ${r === 1 ? II : `${r}${II}`}.` },
  ], `Get the square alone, then take ± its root: ${rt(MINUS + k)} = ${r === 1 ? II : `${r}${II}`}.`);
};

/** square roots with non-perfect squares and the typical slips, as a choice */
export const sqrtSolvePick: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['x2', 'ax2', 'shift', 'shift'] as const);
  const perfect = R() < 0.3, out = perfect ? int(R, 2, 9) : int(R, 1, 4), rest = perfect ? 1 : pickOf(R, FREE), k = out * out * rest;
  const h = t === 'shift' ? nz(R, -5, 5) : 0, A = t === 'ax2' ? int(R, 2, 5) : 1;
  const x = nr(q(h), q(out), rest);
  const sq = h === 0 ? `${X}<sup>2</sup>` : `(${binH(h)})<sup>2</sup>`, sqT = h === 0 ? 'x^{2}' : `(${binT(h)})^{2}`;
  const prompt = t === 'ax2' ? `${A}${X}<sup>2</sup> + ${A * k} = 0` : `${sq} = ${MINUS}${k}`;
  const board = t === 'ax2' ? `${A}x^{2} + ${A * k} = 0` : `${sqT} = -${k}`;
  const realPart = rest === 1 ? String(out) : `${out === 1 ? '' : out}${rt(rest)}`;
  const realSet = h === 0 ? `${X} = ±${realPart}` : `${X} = ${nH(h)} ± ${realPart}`;
  return keyed(R, {
    id: `sqrtSolvePick-${n}`, family: 'sqrtSolvePick',
    prompt: `Solve ${prompt} by taking square roots.`,
    board,
    picture: rootsReveal(x),
    solution: [
      t === 'ax2' ? `Subtract ${A * k} and divide by ${A}: ${X}<sup>2</sup> = ${MINUS}${k}.` : `The square is alone: ${sq} = ${MINUS}${k}.`,
      `Take ± the root: ${h === 0 ? X : binH(h)} = ±${rt(MINUS + k)} = ±${iRoot(out, rest)}.`,
      ...(h ? [`Add ${nH(h)}: ${X} = ${nrH(x)}.`] : []),
    ],
  }, [
    { t: roots(x), ok: true, key: keyNR(x), say: `Yes: ${roots(x)}, a pair of non-real solutions.` },
    { t: `${X} = ${oneH(x, 1)} only`, key: 'one', mc: MC.onlyPos, say: `Taking a square root while SOLVING needs ±: ${oneH(x, -1)} squares to the same ${MINUS}${k}.` },
    { t: realSet, key: 'real', mc: MC.dropsI, say: `The ${II} went missing: ${rt(MINUS + k)} = ${II}${rt(k)}. Real numbers square to positive numbers.` },
    ...(h ? [{ t: roots(nr(q(-h), q(out), rest)), key: keyNR(nr(q(-h), q(out), rest)), mc: MC.zeroSign, say: `${binH(h)} = ±… gives ${X} = ${nH(h)} ± …: the ${nH(-h)} changes sign when it moves across.` }] : []),
    { t: 'no solution', key: 'none', mc: MC.noSolution, say: `No REAL solution, but ${rt(MINUS + k)} = ${iRoot(out, rest)} gives two non-real ones.` },
  ]);
});

// ===================== formula-perfect-square (a = 1, b even, integer parts) =====================
/** p ± qi with x² − 2p·x + (p² + q²): coefficients at most 10 */
function intRoots(R: () => number, most = 10): [number, number] {
  for (;;) { const p = nz(R, -5, 5), qq = int(R, 1, 5); if (p * p + qq * qq <= most && Math.abs(2 * p) <= 10) return [p, qq]; }
}
/** the quadratic formula when b² − 4ac is a negative perfect square: x = □ ± □ i */
export const formulaInt: Gen = (R, n) => {
  const [p, qq] = intRoots(R), b = -2 * p, c = p * p + qq * qq, x = nonReal(1, b, c), D = disc(1, b, c);
  const helped = R() < 0.5;
  return pmPair({
    id: `formulaInt-${n}`, family: 'formulaInt',
    prompt: `Solve ${eqH(1, b, c)} with the quadratic formula.${helped ? ` (Here b<sup>2</sup> − 4ac = ${nH(D)}.)` : ''} Type the solutions as ${X} = a ± b${II}.`,
    board: eqT(1, b, c),
    picture: rootsReveal(x),
    solution: [...formulaLines(1, b, c), endPm(x)],
  }, x, `Yes: ${X} = ${nrH(x)}.`, [
    { re: -p, im: qq, mc: MC.useB, say: `The formula starts with −b: here −b = ${nH(-b)}, so the real part is ${nH(-b)}/2 = ${nH(p)}.` },
    { re: 2 * p, im: qq, mc: MC.selTerm, say: `Divide BOTH terms of the top by 2: ${nH(-b)}/2 = ${nH(p)} as well as ${2 * qq}${II}/2.` },
    { re: p, im: 2 * qq, mc: MC.selTerm, say: `Divide BOTH terms of the top by 2: ${2 * qq}${II}/2 = ${qq === 1 ? '' : qq}${II}.` },
    { re: p, im: 4 * qq * qq, say: `Take the square root of ${nH(D)}: ${rt(nH(D))} = ${2 * qq}${II}.` },
  ], `b<sup>2</sup> − 4ac = ${nH(D)}, ${rt(nH(D))} = ${2 * qq}${II}, then divide both terms by 2.`);
};

/** split (−b ± ci)/2 into a ± bi: no equivalent unfinished form is ever offered as wrong */
export const splitPick: Gen = (R, n) => retry(() => {
  const [p, qq] = intRoots(R, 13), b = -2 * p, c = p * p + qq * qq, x = nonReal(1, b, c), D = disc(1, b, c);
  const top = `${nH(-b)} ± ${2 * qq}${II}`;
  return keyed(R, {
    id: `splitPick-${n}`, family: 'splitPick',
    prompt: `For ${eqH(1, b, c)} the formula gives ${X} = (${top}) / 2. Which is that in a ± b${II} form?`,
    board: `x = \\dfrac{${-b} \\pm \\sqrt{${D}}}{2}`,
    picture: rootsReveal(x),
    solution: [`Divide each term of the top by 2: ${nH(-b)}/2 = ${nH(p)}, and ${2 * qq}${II}/2 = ${qq === 1 ? '' : qq}${II}.`, `So ${X} = ${nrH(x)}.`],
  }, [
    { t: roots(x), ok: true, key: keyNR(x), say: `Yes: real part ${nH(p)}, imaginary part ±${qq}.` },
    { t: roots(nr(q(2 * p), q(qq))), key: keyNR(nr(q(2 * p), q(qq))), mc: MC.selTerm, say: `The 2 divides the WHOLE top: ${nH(-b)}/2 = ${nH(p)} too.` },
    { t: roots(nr(q(p), q(2 * qq))), key: keyNR(nr(q(p), q(2 * qq))), mc: MC.selTerm, say: `The 2 divides the WHOLE top: ${2 * qq}${II}/2 = ${qq === 1 ? '' : qq}${II} too.` },
    { t: `${X} = ${nH(p)} ± ${qq}`, key: 'real', mc: MC.dropsI, say: `Keep the ${II}: ${rt(nH(D))} = ${2 * qq}${II}, so the solutions are not real.` },
    { t: roots(nr(q(-p), q(qq))), key: keyNR(nr(q(-p), q(qq))), mc: MC.useB, say: `The top is ${nH(-b)} ± …: ${nH(-b)}/2 = ${nH(p)}, keep its sign.` },
  ]);
});

// ===================== formula-nonsquare-radical =====================
/** x² − 2p·x + (p² + M): roots p ± i√M, M not a perfect square, |D| = 4M <= 200 */
function radRoots(R: () => number): [number, number] {
  for (;;) { const p = int(R, -5, 5), M = int(R, 2, 50); if (!isSq(M) && (p !== 0 || R() < 0.3)) return [p, M]; }
}
export const formulaRad: Gen = (R, n) => retry(() => {
  const [p, M] = radRoots(R), b = -2 * p, c = p * p + M, x = nonReal(1, b, c), { k: s, m: r } = squareFree(M);
  const simp = s > 1;
  const opts: Opt[] = [
    { t: roots(x), ok: true, key: keyNR(x), say: `Yes: ${roots(x)}.` },
    { t: p === 0 ? `${X} = ±${s === 1 ? '' : s}${rt(r)}` : `${X} = ${nH(p)} ± ${s === 1 ? '' : s}${rt(r)}`, key: 'real', mc: MC.dropsI, say: `b<sup>2</sup> − 4ac = ${nH(-4 * M)} is negative: its root is ${II} times a real root. Real solutions would make the parabola cross the ${X}-axis.` },
    { t: roots(nr(q(p), q(2 * s), r)), key: keyNR(nr(q(p), q(2 * s), r)), mc: MC.selTerm, say: `Divide BOTH terms of the top by 2: ${iRoot(2 * s, r)}/2 = ${iRoot(s, r)}.` },
    ...(p ? [{ t: roots(nr(q(-p), q(s), r)), key: keyNR(nr(q(-p), q(s), r)), mc: MC.useB, say: `The formula starts with −b = ${nH(-b)}, so the real part is ${nH(-b)}/2 = ${nH(p)}.` }] : []),
    ...(p ? [{ t: roots(nr(q(2 * p), q(s), r)), key: keyNR(nr(q(2 * p), q(s), r)), mc: MC.selTerm, say: `Divide BOTH terms of the top by 2: ${nH(-b)}/2 = ${nH(p)}.` }] : []),
    { t: p === 0 ? `${X} = ±${s === 1 ? '' : s}${rt(`${r}${II}`)}` : `${X} = ${nH(p)} ± ${s === 1 ? '' : s}${rt(`${r}${II}`)}`, key: 'iu', mc: MC.iUnder, say: `The ${II} comes out of the root: ${rt(MINUS + 4 * M)} = ${II}${rt(4 * M)}.` },
  ];
  return keyed(R, {
    id: `formulaRad-${n}`, family: 'formulaRad',
    prompt: `Solve ${eqH(1, b, c)} exactly${simp ? ', in simplest radical form' : ''}.`,
    board: eqT(1, b, c),
    picture: rootsReveal(x),
    solution: formulaLines(1, b, c),
  }, opts);
});

/** the number under the root (or in front of it) in x = p ± i√M */
export const radCoef: Gen = (R, n) => {
  const [p, M] = radRoots(R), b = -2 * p, c = p * p + M, x = nonReal(1, b, c), { k: s, m: r } = squareFree(M);
  const front = s > 1 && R() < 0.6;
  const lead = p === 0 ? `${X} = ±` : `${X} = ${nH(p)} ± `;
  if (front) return numItem({
    id: `radCoef-${n}`, family: 'radCoef',
    prompt: `In simplest radical form the solutions of ${eqH(1, b, c)} are ${lead}□${II}${rt(r)}. What number goes in the box?`,
    board: `${eqT(1, b, c)} \\\\ x = ${p === 0 ? '' : `${p}`} \\pm \\square\\, i\\sqrt{${r}}`,
    picture: rootsReveal(x),
    solution: [...formulaLines(1, b, c), `The number in front is ${ans(String(s))}.`],
  }, s, `Yes: ${X} = ${nrH(x)}.`, [
    { v: 2 * s, mc: MC.selTerm, say: `Divide BOTH terms by 2: ${iRoot(2 * s, r)}/2 = ${iRoot(s, r)}.` },
    { v: s * s, say: `${M} = ${s * s} · ${r}: the number in front is the ROOT of ${s * s}, which is ${s}.` },
  ], `b<sup>2</sup> − 4ac = ${nH(-4 * M)}; simplify its root, then divide by 2.`);
  return numItem({
    id: `radCoef-${n}`, family: 'radCoef',
    prompt: `The solutions of ${eqH(1, b, c)} are ${lead}${II}${rt('□')}. What number is under the root?`,
    board: `${eqT(1, b, c)} \\\\ x = ${p === 0 ? '' : `${p}`} \\pm i\\sqrt{\\square}`,
    picture: rootsReveal(x),
    solution: [`b<sup>2</sup> − 4ac = ${par(b)}<sup>2</sup> − 4 · ${c} = ${nH(-4 * M)}, so ${rt(MINUS + 4 * M)} = ${II}${rt(4 * M)} = 2${II}${rt(M)}.`, `${X} = (${nH(-b)} ± 2${II}${rt(M)}) / 2 = ${nH(p)} ± ${II}${rt(M)}: under the root is ${ans(String(M))}.`],
  }, M, `Yes: ${X} = ${p === 0 ? '±' : `${nH(p)} ± `}${II}${rt(M)}.`, [
    { v: 4 * M, mc: MC.selTerm, say: `${rt(4 * M)} = 2${rt(M)}, and the 2 divides out with the bottom: ${II}${rt(M)}.` },
    { v: -4 * M, mc: MC.dropsI, say: `The root of a negative is ${II} times a real root: ${rt(MINUS + 4 * M)} = ${II}${rt(4 * M)}.` },
    { v: 2 * M, say: `${rt(4 * M)} = ${rt(4)} · ${rt(M)} = 2${rt(M)}; then divide by 2.` },
  ], `Find b<sup>2</sup> − 4ac, write its root as ${II} times a root, then divide both terms by 2.`);
};

// ===================== formula-nonunit-a =====================
/** a with 2 <= |a| <= 5 (negative too), b² − 4ac < 0; `square` = a perfect-square discriminant */
function nonUnit(R: () => number, square: boolean, negA: boolean): [number, number, number] {
  for (;;) {
    const a = (negA ? -1 : 1) * int(R, 2, 5), b = int(R, -10, 10), c = nz(R, -10, 10), D = disc(a, b, c);
    if (D >= 0 || isSq(-D) !== square) continue;
    const x = nonReal(a, b, c);
    if (x.re[1] === 1 && x.im[1] === 1) continue;          // fractional parts: the point of a ≠ 1
    if (b === 0 && R() < 0.7) continue;
    return [a, b, c];
  }
}
export const formulaA: Gen = (R, n) => retry(() => {
  const square = R() < 0.5, negA = !square && R() < 0.6 ? true : R() < 0.25;
  const [a, b, c] = nonUnit(R, square, negA), x = nonReal(a, b, c), D = disc(a, b, c), { k, m } = squareFree(-D);
  const A2 = 2 * a;
  const wrong = (re: Q, im: Q): NR => ({ re, im: im[0] < 0 ? qNeg(im) : im, m });
  const opts: Opt[] = [{ t: roots(x), ok: true, key: keyNR(x), say: `Yes: ${roots(x)}.` }];
  if (a < 0) { const w = wrong(q(-b, 2 * Math.abs(a)), q(k, 2 * Math.abs(a))); opts.push({ t: roots(w), key: keyNR(w), mc: MC.signSlip, say: `The bottom is 2a = ${nH(A2)}, a negative number: ${nH(-b)}/(${nH(A2)}) = ${qH(x.re)}.` }); }
  else { const w = wrong(q(b, A2), x.im); opts.push({ t: roots(w), key: keyNR(w), mc: MC.useB, say: `The formula starts with −b = ${nH(-b)}: the real part is ${nH(-b)}/${A2} = ${qH(x.re)}.` }); }
  const w2 = wrong(q(-b), x.im); if (b !== 0) opts.push({ t: roots(w2), key: keyNR(w2), mc: MC.imagOnly, say: `Divide BOTH terms of the top by ${nH(A2)}: the real part is ${nH(-b)}/(${nH(A2)}) = ${qH(x.re)}.` });
  const w3 = wrong(x.re, q(k)); opts.push({ t: roots(w3), key: keyNR(w3), mc: MC.selTerm, say: `Divide BOTH terms of the top by ${nH(A2)}: ${iRoot(k, m)}/${Math.abs(A2)} = ${imH(x.im, m)}.` });
  opts.push({ t: x.re[0] === 0 ? `${X} = ±${imH(x.im, m).replace(II, '')}` : `${X} = ${qH(x.re)} ± ${imH(x.im, m).replace(II, '')}`, key: 'real', mc: MC.dropsI, say: `b<sup>2</sup> − 4ac = ${nH(D)} is negative, so the solutions are not real: keep the ${II}.` });
  return keyed(R, {
    id: `formulaA-${n}`, family: 'formulaA',
    prompt: `Solve ${eqH(a, b, c)}. Write the solutions as a ± b${II}, with both parts simplified.`,
    board: eqT(a, b, c),
    picture: rootsReveal(x),
    solution: formulaLines(a, b, c),
  }, opts);
});

/** a ≠ 1 with typable parts (decimals), and familiar fractional or decimal coefficients cleared first */
export const partsA: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['int', 'int', 'frac', 'dec'] as const);
  if (t === 'int') {
    for (let tries = 0; tries < 400; tries++) {
      const a = pickOf(R, [2, 4, 5, -2, -4]), b = int(R, -10, 10), c = nz(R, -10, 10), D = disc(a, b, c);
      if (D >= 0 || !isSq(-D)) continue;
      const x = nonReal(a, b, c);
      if (!nrTypable(x) || (x.re[1] === 1 && x.im[1] === 1)) continue;
      const re = qVal(x.re), im = qVal(x.im);
      return pmPair({
        id: `partsA-${n}`, family: 'partsA',
        prompt: `Solve ${eqH(a, b, c)} with the quadratic formula. Type ${X} = a ± b${II} (decimals are fine).`,
        board: eqT(a, b, c),
        picture: rootsReveal(x),
        solution: [...formulaLines(a, b, c), endPm(x)],
      }, x, `Yes: ${X} = ${nrH(x)}.`, [
        { re: -re, im, mc: a < 0 ? MC.signSlip : MC.useB, say: a < 0 ? `The bottom is 2a = ${nH(2 * a)}, negative: ${nH(-b)}/(${nH(2 * a)}) = ${qH(x.re)}.` : `The top starts with −b = ${nH(-b)}.` },
        { re: -b, im, mc: MC.imagOnly, say: `Divide BOTH terms of the top by ${nH(2 * a)}.` },
        { re, im: im * Math.abs(2 * a), mc: MC.selTerm, say: `Divide BOTH terms of the top by ${nH(2 * a)}.` },
      ], `b<sup>2</sup> − 4ac = ${nH(D)}; then divide both terms of the top by 2a = ${nH(2 * a)}.`);
    }
    throw new Reroll();
  }
  // fractional / decimal coefficients: k·(x² − 2p·x + p² + q²) with k = 1/2, 1/3, 0.5, 0.25
  const [p, qq] = intRoots(R, 13), B = -2 * p, Cc = p * p + qq * qq, x = nonReal(1, B, Cc);
  const d = t === 'frac' ? pickOf(R, [2, 3, 4]) : pickOf(R, [2, 4, 10]);
  const show = (v: number) => (t === 'frac' ? (v % d === 0 ? nH(v / d) : `${v < 0 ? MINUS : ''}${Math.abs(v)}/${d}`) : nH(v / d));
  const term = (v: number, body: string, first: boolean) => {
    if (v === 0) return '';
    const abs = Math.abs(v), sgn = v < 0 ? (first ? MINUS : ` ${MINUS} `) : first ? '' : ' + ';
    const coef = abs === d && body ? '' : t === 'frac' && abs % d !== 0 && body ? `(${show(abs)})` : show(abs);
    return sgn + coef + body;
  };
  const lhs = term(1, `${X}<sup>2</sup>`, true) + term(B, X, false) + term(Cc, '', false);
  const tT = (v: number, body: string, first: boolean) => {
    if (v === 0) return '';
    const abs = Math.abs(v), sgn = v < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ';
    const coef = abs === d && body ? '' : t === 'frac' && abs % d !== 0 ? `\\frac{${abs}}{${d}}` : String(t === 'frac' ? abs / d : abs / d);
    return sgn + coef + body;
  };
  const lhsT = tT(1, 'x^{2}', true) + tT(B, 'x', false) + tT(Cc, '', false);
  return pmPair({
    id: `partsA-${n}`, family: 'partsA',
    prompt: `Solve ${lhs} = 0. (Multiply by ${d} first to clear the ${t === 'frac' ? 'fractions' : 'decimals'}.) Type ${X} = a ± b${II}.`,
    board: `${lhsT} = 0`,
    picture: rootsReveal(x),
    solution: [`Multiply every term by ${d}: ${eqH(1, B, Cc)}. Same solutions.`, ...formulaLines(1, B, Cc), endPm(x)],
  }, x, `Yes: ${X} = ${nrH(x)}.`, [
    { re: -p, im: qq, mc: MC.useB, say: `The top starts with −b = ${nH(-B)}: the real part is ${nH(-B)}/2 = ${nH(p)}.` },
    { re: p, im: 2 * qq, mc: MC.selTerm, say: `Divide BOTH terms of the top by 2.` },
  ], `Clear the ${t === 'frac' ? 'fractions' : 'decimals'}: ${eqH(1, B, Cc)}. Then use the formula.`);
});

// ===================== method-choice-mixed =====================
type Form = 'prod' | 'moved' | 'sqplus' | 'scaled' | 'swap';
/** an equation with the roots p ± qi (or real roots r1, r2) written in a form that needs reading first */
function mixedForm(R: () => number, form: Form, B: number, Cc: number): { h: string; t: string; first: string } {
  // x² + Bx + Cc = 0 rewritten
  if (form === 'prod') return { h: `${X}(${X} ${B < 0 ? MINUS : '+'} ${Math.abs(B)}) = ${nH(-Cc)}`, t: `x(x ${B < 0 ? '-' : '+'} ${Math.abs(B)}) = ${-Cc}`, first: `Multiply out and move ${nH(-Cc)} across: ${eqH(1, B, Cc)}.` };
  if (form === 'moved') return { h: `${polyH(1, B, 0)} = ${nH(-Cc)}`, t: `${polyT(1, B, 0)} = ${-Cc}`, first: `Move ${nH(-Cc)} to the left (it changes sign): ${eqH(1, B, Cc)}.` };
  if (form === 'swap') return { h: `${polyH(1, 0, Cc)} = ${polyH(0, -B, 0)}`, t: `${polyT(1, 0, Cc)} = ${polyT(0, -B, 0)}`, first: `Move ${polyH(0, -B, 0)} to the left: ${eqH(1, B, Cc)}.` };
  const k = pickOf(R, [2, 3]);
  return { h: eqH(k, k * B, k * Cc), t: eqT(k, k * B, k * Cc), first: `Divide every term by ${k}: ${eqH(1, B, Cc)}.` };
}
/** solve an equation that needs rearranging first (or a square form): x = □ ± □ i */
export const mixedSolve: Gen = (R, n) => {
  const form = pickOf(R, ['prod', 'moved', 'sqplus', 'scaled', 'swap'] as const);
  const [p, qq] = intRoots(R, 20), B = -2 * p, Cc = p * p + qq * qq, x = nonReal(1, B, Cc);
  if (form === 'sqplus') {
    return pmPair({
      id: `mixedSolve-${n}`, family: 'mixedSolve',
      prompt: `Solve (${binH(p)})<sup>2</sup> + ${qq * qq} = 0. Pick the quickest method. Type ${X} = a ± b${II}.`,
      board: `(${binT(p)})^{2} + ${qq * qq} = 0`,
      picture: rootsReveal(x),
      solution: [`The square is almost alone: square roots are quickest. (${binH(p)})<sup>2</sup> = ${MINUS}${qq * qq}.`, `${binH(p)} = ±${qq === 1 ? II : `${qq}${II}`}, so ${X} = ${nrH(x)}.`, endPm(x)],
    }, x, `Yes: ${X} = ${nrH(x)}. Square roots, no formula needed.`, [
      { re: -p, im: qq, mc: MC.zeroSign, say: `${binH(p)} is 0 at ${X} = ${nH(p)}: the real part is ${nH(p)}.` },
      { re: p, im: qq * qq, say: `Take the square root: ${rt(MINUS + qq * qq)} = ${qq === 1 ? II : `${qq}${II}`}.` },
    ], `Get the square alone, then take ± its root.`);
  }
  const F = mixedForm(R, form, B, Cc);
  return pmPair({
    id: `mixedSolve-${n}`, family: 'mixedSolve',
    prompt: `Solve ${F.h}. Type ${X} = a ± b${II}.`,
    board: F.t,
    picture: rootsReveal(x),
    solution: [F.first, ...formulaLines(1, B, Cc).slice(0, 3), endPm(x)],
  }, x, `Yes: ${X} = ${nrH(x)}.`, [
    { re: -p, im: qq, mc: MC.useB, say: `In standard form b = ${nH(B)}: the real part is −b/2 = ${nH(p)}.` },
    { re: p, im: 2 * qq, mc: MC.selTerm, say: `Divide BOTH terms of the top by 2.` },
  ], `First write it in standard form: ${eqH(1, B, Cc)}. Then use the formula.`);
};

/** real or non-real? equations in mixed forms: a discriminant >= 0 gives real roots (no i inserted) */
export const contrastSolve: Gen = (R, n) => retry(() => {
  const real = R() < 0.5, form = pickOf(R, ['prod', 'moved', 'swap', 'scaled'] as const);
  let B: number, Cc: number;
  if (real) { const r1 = nz(R, -6, 6), r2 = nz(R, -6, 6); if (r1 === r2) throw new Reroll(); B = -(r1 + r2); Cc = r1 * r2; if (B === 0 || Cc === 0) throw new Reroll(); }
  else { const [p, qq] = intRoots(R, 20); B = -2 * p; Cc = p * p + qq * qq; }
  const F = mixedForm(R, form, B, Cc), D = disc(1, B, Cc);
  // the slip: reading c from the display without moving it (abc-before-standard-form)
  const slipC = form === 'prod' || form === 'moved' ? -Cc : null;
  const rightT = D < 0 ? roots(nonReal(1, B, Cc)) : rootsH(realRoots(1, B, Cc));
  const opts: Opt[] = [{ t: rightT, ok: true, key: keySolve(1, B, Cc), say: `Yes: in standard form ${eqH(1, B, Cc)}, and b<sup>2</sup> − 4ac = ${nH(D)}${D < 0 ? ' is negative: non-real solutions' : ' is not negative: real solutions'}.` }];
  if (D >= 0) {
    const h = -B / 2, k = Math.sqrt(D) / 2;
    if (Number.isInteger(h) && Number.isInteger(k) && k > 0) { const w = nr(q(h), q(k)); opts.push({ t: roots(w), key: keyNR(w), mc: MC.lastMethod, say: `b<sup>2</sup> − 4ac = ${D} is POSITIVE: ${rt(D)} = ${k * 2} is real, no ${II}. Check the sign before writing ${II}.` }); }
    opts.push({ t: 'no real solutions', key: 'none', say: `b<sup>2</sup> − 4ac = ${D} is positive, so there are two real solutions.` });
  } else {
    const x = nonReal(1, B, Cc), p = qVal(x.re), qq = qVal(x.im);
    opts.push({ t: `${X} = ${nH(p)} ± ${qq}`, key: 'real', mc: MC.dropsI, say: `b<sup>2</sup> − 4ac = ${D} is negative: its root is ${II} times a real number.` });
    opts.push({ t: 'no solutions', key: 'none', mc: MC.noSolution, say: `No REAL solutions; two non-real ones.` });
  }
  if (slipC !== null) {
    const D2 = disc(1, B, slipC);
    const w = D2 < 0 ? roots(nonReal(1, B, slipC)) : rootsH(realRoots(1, B, slipC));
    opts.push({ t: w, key: keySolve(1, B, slipC), mc: MC.abcFirst, say: `First move every term to one side: ${eqH(1, B, Cc)}, so c = ${nH(Cc)}, not ${nH(slipC)}.` });
  }
  return keyed(R, {
    id: `contrastSolve-${n}`, family: 'contrastSolve',
    prompt: `Solve ${F.h}.`,
    board: F.t,
    picture: { graph: graphPic(1, B, Cc, { late: true, vertex: true, reveal: D >= 0 ? { xints: [(-B - Math.sqrt(D)) / 2, (-B + Math.sqrt(D)) / 2] } : undefined }) },
    solution: [F.first, `b<sup>2</sup> − 4ac = ${par(B)}<sup>2</sup> − 4 · ${par(Cc)} = ${nH(D)}${D < 0 ? ': negative, so the solutions are non-real' : ': not negative, so the solutions are real (no ' + II + ')'}.`],
  }, opts, { max: 3 });
});

/** complete the square to (x + h)² = q with q < 0 (a = 1 even b, then a ≠ 1 that divides out) */
export const completeQ: Gen = (R, n) => {
  const scaled = R() < 0.35;
  const [p, qq] = intRoots(R, 34), b = -2 * p, c = p * p + qq * qq, h = -p, Qv = -(qq * qq), x = nonReal(1, b, c);
  const k = scaled ? pickOf(R, [2, 3]) : 1;
  const sqH = `(${binH(-h)})<sup>2</sup>`;
  return numItem({
    id: `completeQ-${n}`, family: 'completeQ',
    prompt: `Complete the square: ${eqH(k, k * b, k * c)} becomes ${sqH} = □. What number goes in the box?`,
    board: `${eqT(k, k * b, k * c)} \\\\ (${binT(-h)})^{2} = \\square`,
    picture: h > 0 ? { square: { h } } : rootsReveal(x),
    solution: [
      ...(scaled ? [`Divide every term by ${k}: ${eqH(1, b, c)}.`] : []),
      `Move ${c} across: ${polyH(1, b, 0)} = ${MINUS}${c}.`,
      `Half of ${nH(b)} is ${nH(h)}; add ${par(h)}<sup>2</sup> = ${h * h} to both sides: ${sqH} = ${MINUS}${c} + ${h * h} = ${ans(nH(Qv))}.`,
      `Negative, so ${binH(-h)} = ±${rt(nH(Qv))} = ±${qq === 1 ? II : `${qq}${II}`} and ${X} = ${nrH(x)}.`,
    ],
  }, Qv, `Yes: ${sqH} = ${nH(Qv)}, so ${X} = ${nrH(x)}.`, [
    { v: -Qv, say: `${MINUS}${c} + ${h * h} = ${nH(Qv)}: the right side is negative here.` },
    { v: c + h * h, say: `Move ${c} to the right side first: it becomes ${MINUS}${c}.` },
    ...(scaled ? [{ v: h * h - k * c, say: `Divide EVERY term by ${k} first, so the constant is ${c}.` }] : []),
  ], `Move c across, then add (half of b)<sup>2</sup> to both sides.`);
};

export const FAM1: Record<string, Gen> = {
  rootNeg, rootNegCoef, discCount, discValue, complexTruth, sqrtSolve, sqrtSolvePick, formulaInt, splitPick,
  formulaRad, radCoef, formulaA, partsA, mixedSolve, contrastSolve, completeQ,
};
export type { QItem, Base };
void C; void keyCx; void keyReal; void nrT;
