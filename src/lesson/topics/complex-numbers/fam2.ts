// fam2.ts: practice families for stage 2 of "Complex numbers": add, subtract, multiply (i² = −1), the radical-product
// trap, powers of i, conjugates, z·z̄, and dividing (by a real, by an imaginary, by a complex number).
import { int } from '../../runtime/item';
import { type CxItem, type Gen, frx, MC, ans, choiceItem, cxChoice, cxPair, endZ, numItem, numCheck, nz, other, pickOf, retry, Reroll, type PP } from './common';
import {
  C, CQ, type Cx, II, MINUS, add, conj, div, eq, html, isZero, mul, nH, normSq, parHtml, parTex, powI, q, qH, qT, qVal,
  rootH, sub, sumH, sumT, monoH, monoT, tex, typable, qDiv, qMul, scale, neg,
} from './cx';
import { planeFor } from './fam1';

const at = (z: Cx): [number, number] => [qVal(z.re), qVal(z.im)];
/** a plane coordinate of size 2..5 (a point at ±1 sits on the axis tick labels) */
const big = (R: () => number) => int(R, 2, 5) * (R() < 0.5 ? -1 : 1);
const clearOfTicks = (...zs: Cx[]) => zs.every(z => qVal(z.re) !== -1 && qVal(z.im) !== -1);
const small = (...zs: Cx[]) => zs.every(z => Math.abs(qVal(z.re)) <= 6 && Math.abs(qVal(z.im)) <= 6);
/** parts a + bi as [coef, power] terms for the product box */
const terms = (z: Cx): [number, number][] => { const t: [number, number][] = []; if (z.re[0] !== 0) t.push([qVal(z.re), 0]); if (z.im[0] !== 0) t.push([qVal(z.im), 1]); return t; };
const ints = (z: Cx) => z.re[1] === 1 && z.im[1] === 1;

// ===================== add-complex =====================
/** (a + bi) + (c + di): real with real, imaginary with imaginary */
export const addPair: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['pos', 'signed', 'signed', 'cancel', 'frac'] as const);
  let z: Cx, w: Cx;
  if (t === 'pos') { z = C(int(R, 1, 9), int(R, 1, 9)); w = C(int(R, 1, 9), int(R, 1, 9)); }
  else if (t === 'signed') { z = C(nz(R, -10, 10), nz(R, -10, 10)); w = C(nz(R, -10, 10), nz(R, -10, 10)); }
  else if (t === 'cancel') { const a = nz(R, -9, 9), b = nz(R, -9, 9), c = nz(R, -9, 9); z = C(a, b); w = R() < 0.5 ? C(c, -b) : C(-a, c); }
  else { const F = [q(1, 2), q(3, 2), q(1, 4), q(3, 4), q(5, 4), q(-1, 2), q(-3, 4), q(-1, 4)]; z = CQ(pickOf(R, F), pickOf(R, F)); w = CQ(pickOf(R, F), pickOf(R, F)); }
  const s = add(z, w);
  const total = qAddN(qAddN(z.re, z.im), qAddN(w.re, w.im));
  const pic = small(z, w, s) && clearOfTicks(z, w, s) && t !== 'frac';
  return cxPair({
    id: `addPair-${n}`, family: 'addPair',
    prompt: `Add: ${parHtml(z)} + ${parHtml(w)}. Answer in the form a + b${II}${t === 'frac' ? '; decimals are fine' : ''}.`,
    board: `${parTex(z)} + ${parTex(w)} = \\,?`,
    picture: pic ? { plane: { x: [-6, 6], y: [-6, 6], step: 1, given: [{ key: 'z', at: at(z), name: 'z', col: 'first', arrow: true }, { key: 'w', at: at(w), name: 'w', col: 'second', arrow: true }], reveal: { pts: [{ key: 'w2', at: at(s), from: at(z), col: 'second', arrow: true }, { key: 's', at: at(s), name: 'z + w', col: 'link' }] } } } : undefined,
    solution: [`Real parts: ${qH(z.re)} + ${parQ(w.re)} = ${qH(s.re)}.`, `Imaginary parts: ${qH(z.im)} + ${parQ(w.im)} = ${qH(s.im)}.`, endZ(s)],
  }, s, `Yes: ${html(s)}.`, [
    { z: CQ(q(0), total), mc: MC.combines, say: 'Real parts and imaginary parts are different kinds: add real to real, and imaginary to imaginary.' },
    { z: CQ(total, q(0)), mc: MC.combines, say: 'Real parts and imaginary parts never combine into one number.' },
    { z: CQ(qAddN(z.re, w.im), qAddN(z.im, w.re)), say: 'Match real with real: the first number’s real part goes with the second number’s real part.' },
  ], 'Add the real parts, then add the imaginary parts.');
});
const qAddN = (a: readonly [number, number], b: readonly [number, number]) => q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const parQ = (a: readonly [number, number]) => (a[0] < 0 ? `(${qH(a)})` : qH(a));

/** sums and differences with thirds, quarters, sixths: as a choice (the parts are not decimals) */
export const fracAddSub: Gen = (R, n, sg) => retry(() => {
  const minus = sg === 'subtract-complex' || (sg !== 'add-complex' && R() < 0.5);
  const D = pickOf(R, [3, 6, 3, 4]);
  const fq = () => q(nz(R, -2 * D, 2 * D), D);
  const z = CQ(fq(), fq()), w = CQ(fq(), fq());
  const s = minus ? sub(z, w) : add(z, w);
  if (typable(s) && R() < 0.7) throw new Reroll();
  const wrongs = minus ? [
    { z: CQ(s.re, qAddN(z.im, w.im)), mc: MC.firstOnly, say: 'The minus sign goes to BOTH parts of the second number.' },
    { z: add(z, w), say: 'This is a subtraction: take the second number away, part by part.' },
    { z: CQ(qSubN(w.re, z.re), s.im), say: 'Keep the order: first number minus second number.' },
  ] : [
    { z: CQ(qAddN(z.re, w.re), q(0)), mc: MC.combines, say: 'Keep the imaginary parts too: add them on their own.' },
    { z: sub(z, w), say: 'This is an addition.' },
    { z: CQ(qAddN(z.re, w.im), qAddN(z.im, w.re)), say: 'Add real to real and imaginary to imaginary.' },
  ];
  return cxChoice(R, {
    id: `fracAddSub-${n}`, family: 'fracAddSub',
    prompt: `${minus ? 'Subtract' : 'Add'}: ${parHtml(z)} ${minus ? MINUS : '+'} ${parHtml(w)}.`,
    board: `${parTex(z)} ${minus ? '-' : '+'} ${parTex(w)}`,
    solution: [`Real parts: ${qH(z.re)} ${minus ? MINUS : '+'} ${parQ(w.re)} = ${qH(s.re)}.`, `Imaginary parts: ${qH(z.im)} ${minus ? MINUS : '+'} ${parQ(w.im)} = ${qH(s.im)}.`],
  }, { z: s, say: `Yes: ${html(s)}.` }, wrongs);
});
const qSubN = (a: readonly [number, number], b: readonly [number, number]) => q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);

/** P30: name the property behind a regrouping (adding) or an expansion / i·3 = 3i (multiplying) */
export const propertyName: Gen = (R, n, sg) => retry(() => {
  const mulT = sg === 'multiply-complex' || (sg !== 'add-complex' && R() < 0.5);
  const a = int(R, 1, 9), b = int(R, 2, 9), c = int(R, 1, 9), d = int(R, 2, 9);
  const P = {
    ca: 'the commutative and associative properties of addition',
    dist: 'the distributive property',
    cm: 'the commutative property of multiplication',
    i2: `the definition ${II}<sup>2</sup> = ${MINUS}1`,
    inv: 'the additive inverse property',
  };
  if (!mulT) return choiceItem(R, {
    id: `propertyName-${n}`, family: 'propertyName',
    prompt: `(${a} + ${b}${II}) + (${c} + ${d}${II}) = (${a} + ${c}) + (${b}${II} + ${d}${II}). Which properties allow this step?`,
    board: `(${a} + ${b}i) + (${c} + ${d}i) = (${a} + ${c}) + (${b}i + ${d}i)`,
    solution: ['The terms change ORDER (commutative) and GROUPING (associative); only addition happens.'],
  }, [
    { t: P.ca, ok: true, say: `Yes: ${b}${II} and ${c} swap places, and the brackets regroup. Nothing is multiplied.` },
    { t: P.dist, say: `Nothing is multiplied over a sum here: the terms only move and regroup. (The next step, ${b}${II} + ${d}${II} = (${b} + ${d})${II}, uses the distributive property.)` },
    { t: P.cm, say: 'No product changes order here: the terms of a SUM move.' },
    { t: P.i2, say: `There is no ${II}<sup>2</sup> in this step.` },
  ]);
  const t = R() < 0.5;
  if (t) return choiceItem(R, {
    id: `propertyName-${n}`, family: 'propertyName',
    prompt: `(${a} + ${b}${II})(${c} + ${d}${II}) = ${a}(${c} + ${d}${II}) + ${b}${II}(${c} + ${d}${II}). Which property allows this step?`,
    board: `(${a} + ${b}i)(${c} + ${d}i) = ${a}(${c} + ${d}i) + ${b}i(${c} + ${d}i)`,
    solution: [`Each term of the first factor multiplies the whole second factor: that is the distributive property.`],
  }, [
    { t: P.dist, ok: true, say: 'Yes: a(sum) = each term times the sum.' },
    { t: P.ca, say: 'The step multiplies over a sum, it does not just reorder terms.' },
    { t: P.cm, say: 'The factors do not swap places here: one factor is spread over the other.' },
    { t: P.i2, say: `There is no ${II}<sup>2</sup> yet in this step.` },
  ]);
  return choiceItem(R, {
    id: `propertyName-${n}`, family: 'propertyName',
    prompt: `In ${b}${II}(${c} + ${d}${II}), the term ${II} · ${c} is written as ${c}${II}. Which property allows that?`,
    board: `i \\cdot ${c} = ${c}i`,
    solution: [`${II} · ${c} = ${c} · ${II}: the two factors swap places. That is the commutative property of multiplication.`],
  }, [
    { t: P.cm, ok: true, say: 'Yes: the factors of a product can swap places.' },
    { t: P.dist, say: 'Nothing is spread over a sum: two factors swap places.' },
    { t: P.ca, say: 'These are factors of a product, not terms of a sum.' },
    { t: P.i2, say: `There is only one ${II} here, no ${II}<sup>2</sup>.` },
  ]);
});

// ===================== subtract-complex =====================
/** (a + bi) − (c + di): the minus sign goes to both parts */
export const subPair: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['signed', 'signed', 'negSub', 'real', 'zero'] as const);
  let z: Cx, w: Cx;
  if (t === 'real') { z = C(nz(R, -10, 10), 0); w = C(nz(R, -10, 10), nz(R, -10, 10)); }
  else if (t === 'zero') { const a = nz(R, -9, 9); z = C(a, nz(R, -9, 9)); w = C(a, nz(R, -9, 9)); }
  else if (t === 'negSub') { z = C(nz(R, -10, 10), nz(R, -10, 10)); w = C(nz(R, -10, 10), -int(R, 1, 10)); }
  else { z = C(nz(R, -10, 10), nz(R, -10, 10)); w = C(nz(R, -10, 10), nz(R, -10, 10)); }
  const s = sub(z, w);
  if (eq(s, add(z, w))) throw new Reroll();
  return cxPair({
    id: `subPair-${n}`, family: 'subPair',
    prompt: `Subtract: ${parHtml(z)} ${MINUS} ${'(' + html(w) + ')'}. Answer in the form a + b${II}.`,
    board: `${parTex(z)} - (${tex(w)}) = \\,?`,
    solution: [`The minus sign goes to both parts: ${MINUS}(${html(w)}) = ${html(neg(w))}.`, `Real: ${qH(z.re)} ${MINUS} ${parQ(w.re)} = ${qH(s.re)}. Imaginary: ${qH(z.im)} ${MINUS} ${parQ(w.im)} = ${qH(s.im)}.`, endZ(s)],
  }, s, `Yes: ${html(s)}.`, [
    { z: CQ(s.re, qAddN(z.im, w.im)), mc: MC.firstOnly, say: `The minus sign goes to BOTH parts: ${MINUS}(${html(w)}) = ${html(neg(w))}.` },
    { z: add(z, w), say: 'That is the sum. Subtracting takes the second number away.' },
    { z: sub(w, z), say: 'Keep the order: the first number minus the second.' },
  ], `Distribute the minus: ${MINUS}(${html(w)}) = ${html(neg(w))}, then add the parts.`);
});

// ===================== multiply-by-imaginary =====================
/** (pi)(qi), (pi)(q), i(−i): multiply the numbers, then i·i = i² = −1 */
export const monoProduct: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['ii', 'ii', 'ii', 'ri'] as const);
  const p = pickOf(R, [nz(R, -10, 10), 1, -1]), r = nz(R, -10, 10);
  const A: [number, number] = [p, 1], B: [number, number] = t === 'ii' ? [r, 1] : [r, 0];
  const v = p * r, z = t === 'ii' ? C(-v, 0) : C(0, v);
  return cxPair({
    id: `monoProduct-${n}`, family: 'monoProduct',
    prompt: `Multiply: (${monoH(...A)})(${monoH(...B)}). Answer in the form a + b${II}.`,
    board: `(${monoT(...A)})(${monoT(...B)}) = \\,?`,
    solution: t === 'ii'
      ? [`Numbers: ${nH(p)} · ${nH(r)} = ${nH(v)}. The i's: ${II} · ${II} = ${II}<sup>2</sup> = ${MINUS}1.`, `${nH(v)}${II}<sup>2</sup> = ${nH(v)} · (${MINUS}1) = ${nH(-v)}.`, endZ(z)]
      : [`${nH(p)} · ${nH(r)} = ${nH(v)}, and one ${II} is left: ${monoH(v, 1)}.`, endZ(z)],
  }, z, `Yes: ${html(z)}.`, t === 'ii' ? [
    { z: C(0, v), mc: MC.iTimesI, say: `${II} · ${II} is not ${II}: it is ${II}<sup>2</sup> = ${MINUS}1. So the answer is real.` },
    { z: C(v, 0), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1, not +1: ${nH(v)}${II}<sup>2</sup> = ${nH(-v)}.` },
  ] : [
    { z: C(v, 0), say: `One factor has an ${II}, so the product keeps it: ${monoH(v, 1)}.` },
    { z: C(-v, 0), mc: MC.i2Plus, say: `There is only one ${II}, so no ${II}<sup>2</sup>: ${monoH(v, 1)}.` },
  ], t === 'ii' ? `Multiply the numbers, then replace ${II} · ${II} = ${II}<sup>2</sup> by ${MINUS}1.` : 'Multiply the numbers and keep the i.');
});

/** k(c + di) and pi(c + di): distribute, then i² = −1 */
export const scaleDistribute: Gen = (R, n) => retry(() => {
  const imagK = R() < 0.65;
  const p = imagK ? pickOf(R, [nz(R, -9, 9), nz(R, -9, 9), 1, -1]) : other(R, -9, 9, [0, 1, -1]), c = nz(R, -9, 9), d = nz(R, -9, 9);
  const k = imagK ? C(0, p) : C(p, 0), w = C(c, d), z = mul(k, w);
  const kH = monoH(p, imagK ? 1 : 0), kT = monoT(p, imagK ? 1 : 0);
  return cxPair({
    id: `scaleDistribute-${n}`, family: 'scaleDistribute',
    prompt: `Multiply: ${kH}(${html(w)}). Answer in the form a + b${II}.`,
    board: `${kT}(${tex(w)}) = \\,?`,
    picture: { box: { a: [[p, imagK ? 1 : 0]], b: terms(w) } },
    solution: imagK
      ? [`Distribute: ${kH} · ${nH(c)} = ${monoH(p * c, 1)}, and ${kH} · ${monoH(d, 1)} = ${monoH(p * d, 2)}.`, `${monoH(p * d, 2)} = ${nH(p * d)} · (${MINUS}1) = ${nH(-p * d)}.`, endZ(z)]
      : [`Distribute: ${nH(p)} · ${nH(c)} = ${nH(p * c)}, and ${nH(p)} · ${monoH(d, 1)} = ${monoH(p * d, 1)}.`, endZ(z)],
  }, z, `Yes: ${html(z)}.`, imagK ? [
    { z: C(p * d, p * c), mc: MC.i2Plus, say: `${monoH(p * d, 2)} = ${nH(p * d)} · (${MINUS}1) = ${nH(-p * d)}: ${II}<sup>2</sup> is ${MINUS}1.` },
    { z: C(0, p * c + p * d), mc: MC.iTimesI, say: `${II} · ${II} = ${II}<sup>2</sup> = ${MINUS}1, so that term becomes REAL.` },
    { z: C(0, p * c), say: `${kH} multiplies BOTH terms: the ${monoH(d, 1)} too.` },
  ] : [
    { z: C(p * c, d), say: `${nH(p)} multiplies BOTH parts: the ${monoH(d, 1)} too.` },
  ], `Multiply ${kH} by each term, then replace ${II}<sup>2</sup> with ${MINUS}1.`);
});

/** i·z is z turned a quarter turn counterclockwise about 0 (and −i·z clockwise) */
export const rotateByI: Gen = (R, n) => retry(() => {
  const a = big(R), b = big(R), z = C(a, b), m = R() < 0.7 ? 1 : -1;
  const iz = mul(C(0, m), z);
  return cxPair({
    id: `rotateByI-${n}`, family: 'rotateByI',
    prompt: `z = ${html(z)}. Multiply by ${m < 0 ? MINUS : ''}${II}: what is ${m < 0 ? MINUS : ''}${II}z? (On the plane, ${m < 0 ? MINUS : ''}${II}z is z turned a quarter turn ${m < 0 ? 'clockwise' : 'counterclockwise'} about 0.)`,
    board: `${m < 0 ? '-' : ''}i(${tex(z)}) = \\,?`,
    picture: { plane: { x: [-6, 6], y: [-6, 6], step: 1, given: [{ key: 'z', at: [a, b], name: 'z', col: 'first', arrow: true }], reveal: { turn: { from: [a, b], quarters: m }, pts: [{ key: 'iz', at: at(iz), name: m < 0 ? '−iz' : 'iz', col: 'link' }] } } },
    solution: [`${m < 0 ? MINUS : ''}${II}(${html(z)}) = ${monoH(m * a, 1)} ${m * b < 0 ? MINUS : '+'} ${monoH(Math.abs(m * b), 2)}.`, `${monoH(m * b, 2)} = ${nH(-m * b)}, so it is ${html(iz)}.`, endZ(iz)],
  }, iz, `Yes: ${html(iz)}, a quarter turn ${m < 0 ? 'clockwise' : 'counterclockwise'}.`, [
    { z: C(-m * b * -1, m * a * -1), say: 'That is a quarter turn the other way.' },
    { z: C(-a, -b), say: 'That is a half turn: two quarter turns.' },
    { z: C(m * b, m * a), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1: the ${II}<sup>2</sup> term changes sign.` },
  ], `Distribute ${m < 0 ? MINUS : ''}${II}, then ${II}<sup>2</sup> = ${MINUS}1. Real part: ${nH(-m * b)}.`);
});

// ===================== multiply-complex =====================
/** (a + bi)(c + di): four partial products in the box, i² = −1, collect */
export const binProduct: Gen = (R, n) => retry(() => {
  const a = nz(R, -5, 5), b = nz(R, -5, 5), c = nz(R, -5, 5), d = nz(R, -5, 5);
  const z = C(a, b), w = C(c, d), p = mul(z, w);
  if (R() < 0.7 && (a < 0 && b < 0 || c < 0 && d < 0)) throw new Reroll();
  return cxPair({
    id: `binProduct-${n}`, family: 'binProduct',
    prompt: `Multiply: (${html(z)})(${html(w)}). Answer in the form a + b${II}.`,
    board: `(${tex(z)})(${tex(w)}) = \\,?`,
    picture: { box: { a: terms(z), b: terms(w) } },
    solution: [
      `Every term times every term: ${sumH([[a * c, 0], [a * d, 1], [b * c, 1], [b * d, 2]])}.`,
      `${monoH(b * d, 2)} = ${nH(-b * d)}, since ${II}<sup>2</sup> = ${MINUS}1.`,
      `Real: ${a * c} ${sgnHs(-b * d)} = ${qH(p.re)}. Imaginary: ${a * d} ${sgnHs(b * c)} = ${qH(p.im)}.`,
      endZ(p),
    ],
  }, p, `Yes: ${html(p)}.`, [
    { z: C(a * c + b * d, a * d + b * c), mc: MC.i2Plus, say: `${monoH(b * d, 2)} = ${nH(b * d)} · (${MINUS}1) = ${nH(-b * d)}: ${II}<sup>2</sup> is ${MINUS}1, not 1.` },
    { z: C(a * c - b * d, 0), mc: MC.firstsLasts, say: `Four partial products, not two: the cross terms ${monoH(a * d, 1)} and ${monoH(b * c, 1)} count too.` },
    { z: C(a * c, a * d + b * c + b * d), mc: MC.iTimesI, say: `${II} · ${II} is ${II}<sup>2</sup> = ${MINUS}1: that cell is real.` },
  ], `Fill the four cells (every term times every term), replace ${II}<sup>2</sup> with ${MINUS}1, then collect real with real and ${II} with ${II}.`);
});
const sgnHs = (v: number) => (v < 0 ? `${MINUS} ${Math.abs(v)}` : `+ ${v}`);

/** (a + bi)²: (a + bi)(a + bi), so 2ab i in the middle; (1 + i)² = 2i */
export const squareComplex: Gen = (R, n) => retry(() => {
  const a = pickOf(R, [nz(R, -5, 5), 1, -1]), b = pickOf(R, [nz(R, -5, 5), 1, -1]), z = C(a, b), p = mul(z, z);
  return cxPair({
    id: `squareComplex-${n}`, family: 'squareComplex',
    prompt: `Square it: (${html(z)})<sup>2</sup>. Answer in the form a + b${II}.`,
    board: `(${tex(z)})^{2} = \\,?`,
    picture: { box: { a: terms(z), b: terms(z) } },
    solution: [
      `(${html(z)})<sup>2</sup> = (${html(z)})(${html(z)}) = ${sumH([[a * a, 0], [a * b, 1], [a * b, 1], [b * b, 2]])}.`,
      `${monoH(b * b, 2)} = ${nH(-b * b)}. Real: ${a * a} ${MINUS} ${b * b} = ${qH(p.re)}. Imaginary: ${nH(a * b)} + ${parQn(a * b)} = ${qH(p.im)}.`,
      endZ(p),
    ],
  }, p, `Yes: ${html(p)}.`, [
    { z: C(a * a - b * b, 0), mc: MC.firstsLasts, say: `A square is the number times itself: the two middle cells, ${monoH(a * b, 1)} each, count too.` },
    { z: C(a * a + b * b, 2 * a * b), mc: MC.i2Plus, say: `(${monoH(b, 1)})<sup>2</sup> = ${b * b}${II}<sup>2</sup> = ${nH(-b * b)}: ${II}<sup>2</sup> = ${MINUS}1.` },
    { z: C(a * a + b * b, 0), say: `The middle terms do not vanish, and ${II}<sup>2</sup> = ${MINUS}1.` },
  ], `Write it as (${html(z)})(${html(z)}) and fill all four cells.`);
});
const parQn = (v: number) => (v < 0 ? `(${nH(v)})` : String(v));

// ===================== radical-product-trap =====================
const SQS = [1, 4, 9, 16, 25, 36];
/** √(±a)·√(±b): convert to i-form FIRST (√(−a)·√(−b) is −√(ab), not √(ab)) */
export const radProduct: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['both', 'both', 'one', 'one', 'none'] as const);
  const A = pickOf(R, SQS), B = pickOf(R, SQS), ra = Math.sqrt(A), rb = Math.sqrt(B);
  const na = t !== 'none', nb = t === 'both';
  const swap = t === 'one' && R() < 0.5;
  const [x, y] = swap ? [{ v: B, neg: nb, r: rb }, { v: A, neg: na, r: ra }] : [{ v: A, neg: na, r: ra }, { v: B, neg: nb, r: rb }];
  const P = ra * rb;
  const z = t === 'both' ? C(-P, 0) : t === 'one' ? C(0, P) : C(P, 0);
  const rh = (o: { v: number; neg: boolean }) => rootH((o.neg ? MINUS : '') + o.v), rt = (o: { v: number; neg: boolean }) => `\\sqrt{${o.neg ? '-' : ''}${o.v}}`;
  const iform = (o: { neg: boolean; r: number }) => (o.neg ? (o.r === 1 ? II : `${o.r}${II}`) : String(o.r));
  return cxPair({
    id: `radProduct-${n}`, family: 'radProduct',
    prompt: `Multiply: ${rh(x)} · ${rh(y)}. Answer in the form a + b${II}.`,
    board: `${rt(x)} \\cdot ${rt(y)} = \\,?`,
    solution: [
      `Write each root first${t === 'none' ? '' : ` (a negative under the root becomes ${II})`}: ${rh(x)} = ${iform(x)}, ${rh(y)} = ${iform(y)}.`,
      t === 'both' ? `${iform(x)} · ${iform(y)} = ${P}${II}<sup>2</sup> = ${MINUS}${P}.` : `${iform(x)} · ${iform(y)} = ${html(z)}.`,
      endZ(z),
    ],
  }, z, t === 'both' ? `Yes: ${MINUS}${P}. The rule √a · √b = √(ab) breaks when both are negative.` : `Yes: ${html(z)}.`, [
    { z: C(P, 0), mc: t === 'both' ? MC.productRule : undefined, say: t === 'both' ? `√a · √b = √(ab) only works when a and b are not both negative. Convert first: ${iform(x)} · ${iform(y)} = ${P}${II}<sup>2</sup> = ${MINUS}${P}.` : `A negative under one root gives an ${II}: ${html(z)}.` },
    { z: C(0, -P), say: `Convert each root to ${II}-form and multiply.` },
    { z: C(0, P), mc: t === 'both' ? MC.iTimesI : undefined, say: `${II} · ${II} = ${II}<sup>2</sup> = ${MINUS}1, so the product is real.` },
    { z: C(-P, 0), say: `Only one root has a negative inside, so there is one ${II}, not ${II}<sup>2</sup>.` },
  ], `Write each root in ${II}-form first, then multiply.`);
});
/** which value is √(−a)·√(−b), and where Sam's √(−a)·√(−b) = √(ab) goes wrong */
export const radTrapChoice: Gen = (R, n) => retry(() => {
  const ra = pickOf(R, [1, 2, 3, 4, 5]), rb = other(R, 1, 6, [ra]), A = ra * ra, B = rb * rb, P = ra * rb;
  const ia = ra === 1 ? II : `${ra}${II}`, ib = rb === 1 ? II : `${rb}${II}`;
  if (R() < 0.5) return cxChoice(R, {
    id: `radTrapChoice-${n}`, family: 'radTrapChoice',
    prompt: `Which number equals ${rootH(MINUS + A)} · ${rootH(MINUS + B)}?`,
    board: `\\sqrt{-${A}} \\cdot \\sqrt{-${B}}`,
    solution: [`${rootH(MINUS + A)} = ${ia} and ${rootH(MINUS + B)} = ${ib}.`, `${ia} · ${ib} = ${P}${II}<sup>2</sup> = ${MINUS}${P}.`],
  }, { z: C(-P, 0), say: `Yes: ${ia} · ${ib} = ${P}${II}<sup>2</sup> = ${MINUS}${P}.` }, [
    { z: C(P, 0), mc: MC.productRule, say: `√a · √b = √(ab) fails when both are negative. Convert first: ${ia} · ${ib} = ${MINUS}${P}.` },
    { z: C(0, P), mc: MC.iTimesI, say: `${II} · ${II} = ${MINUS}1, so no ${II} is left.` },
    { z: C(0, -P), say: `${II} · ${II} = ${MINUS}1: the product is a real number.` },
  ]);
  return choiceItem(R, {
    id: `radTrapChoice-${n}`, family: 'radTrapChoice',
    prompt: `Sam writes: ${rootH(MINUS + A)} · ${rootH(MINUS + B)} = ${rootH(`(${MINUS}${A})(${MINUS}${B})`)} = ${rootH(A * B)} = ${P}. Which statement is right?`,
    board: `\\sqrt{-${A}} \\cdot \\sqrt{-${B}} \\overset{?}{=} \\sqrt{${A * B}}`,
    solution: [`The first step uses √a · √b = √(ab), which holds only when a and b are not both negative.`, `Converting first: ${ia} · ${ib} = ${P}${II}<sup>2</sup> = ${MINUS}${P}.`],
  }, [
    { t: `The first step is wrong: √a · √b = √(ab) needs a and b not both negative. The product is ${MINUS}${P}.`, ok: true, say: `Yes. Convert first: ${ia} · ${ib} = ${MINUS}${P}.` },
    { t: `Sam is right: √a · √b = √(ab) always.`, mc: MC.productRule, say: `Check it in ${II}-form: ${ia} · ${ib} = ${P}${II}<sup>2</sup> = ${MINUS}${P}, not ${P}.` },
    { t: `The last step is wrong: ${rootH(A * B)} = ${MINUS}${P}.`, mc: MC.plusMinus, say: `${rootH(A * B)} is ${P}: the principal root is not negative. The slip is earlier.` },
    { t: `Both roots are not defined, so there is no product.`, mc: MC.dismiss, say: `They are defined: ${rootH(MINUS + A)} = ${ia}.` },
  ]);
});

// ===================== powers-of-i =====================
const P4 = ['1', II, `${MINUS}1`, `${MINUS}${II}`];
/** i^n: the cycle 1, i, −1, −i repeats every 4 */
export const iPower: Gen = (R, n) => {
  const e = pickOf(R, [int(R, 0, 8), int(R, 9, 40), int(R, 41, 100), int(R, 41, 100)]), r = e % 4;
  const ii = ['1', 'i', '−1', '−i'];
  return choiceItem(R, {
    id: `iPower-${n}`, family: 'iPower',
    prompt: `Simplify ${II}<sup>${e}</sup>.`,
    board: `i^{${e}} = \\,?`,
    picture: { plane: { x: [-2, 2], y: [-2, 2], step: 1, given: [{ key: 'p0', at: [1, 0], col: 'second' }, { key: 'p1', at: [0, 1], col: 'second' }, { key: 'p2', at: [-1, 0], col: 'second' }, { key: 'p3', at: [0, -1], col: 'second' }], reveal: { turn: { from: [1, 0], quarters: r === 0 && e > 0 ? 4 : r } } } },
    solution: [`Every 4 factors of ${II} make ${II}<sup>4</sup> = 1: one full turn.`, `${e} = 4 · ${Math.floor(e / 4)} + ${r}, so ${II}<sup>${e}</sup> = ${II}<sup>${r}</sup> = ${ii[r]!.replace('i', II)}.`],
  }, P4.map((t, k) => {
    const cyc = (r === 2 && k === 0) || (r === 3 && k === 1);
    return {
      t, ok: k === r, mc: cyc ? MC.cycle2 : undefined,
      say: k === r ? `Yes: ${e} leaves ${r} after dividing by 4, so ${II}<sup>${e}</sup> = ${II}<sup>${r}</sup>.` : cyc ? `The pattern repeats every 4, not every 2: ${II}<sup>2</sup> = ${MINUS}1, ${II}<sup>3</sup> = ${MINUS}${II}. ${e} leaves ${r} after dividing by 4.` : `Divide ${e} by 4: the remainder ${r} says where you land.`,
    };
  }), { keep: true });
};
/** c·i^m + d·i^n as a + bi */
export const iPowerSum: Gen = (R, n) => retry(() => {
  const m = int(R, 2, 60), k = int(R, 2, 60), c = pickOf(R, [1, nz(R, -6, 6)]), d = pickOf(R, [1, -1, nz(R, -6, 6)]);
  if (m === k) throw new Reroll();
  const z = add(scale(powI(m), q(c)), scale(powI(k), q(d)));
  const wrong2 = (e: number) => (e % 2 === 0 ? C(1) : C(0, 1));
  const z2 = add(scale(wrong2(m), q(c)), scale(wrong2(k), q(d)));
  const term = (cc: number, e: number) => `${cc === 1 ? '' : cc === -1 ? MINUS : nH(cc)}${II}<sup>${e}</sup>`;
  const termT = (cc: number, e: number) => `${cc === 1 ? '' : cc === -1 ? '-' : cc}i^{${e}}`;
  return cxPair({
    id: `iPowerSum-${n}`, family: 'iPowerSum',
    prompt: `Simplify ${term(c, m)} ${d < 0 ? MINUS : '+'} ${term(Math.abs(d), k)}. Answer in the form a + b${II}.`,
    board: `${termT(c, m)} ${d < 0 ? '-' : '+'} ${termT(Math.abs(d), k)} = \\,?`,
    solution: [`${II}<sup>${m}</sup> = ${II}<sup>${m % 4}</sup> = ${html(powI(m))}, and ${II}<sup>${k}</sup> = ${II}<sup>${k % 4}</sup> = ${html(powI(k))} (remainders after dividing by 4).`, `${nH(c)} · (${html(powI(m))}) + ${parQn(d)} · (${html(powI(k))}) = ${html(z)}.`, endZ(z)],
  }, z, `Yes: ${html(z)}.`, [
    { z: z2, mc: MC.cycle2, say: `Powers of ${II} repeat every 4, not every 2: use the remainder after dividing by 4.` },
  ], `Reduce each power with the remainder after dividing by 4: ${II}<sup>0</sup> = 1, ${II}<sup>1</sup> = ${II}, ${II}<sup>2</sup> = ${MINUS}1, ${II}<sup>3</sup> = ${MINUS}${II}.`);
});

// ===================== conjugate =====================
/** conj(a + bi) = a − bi: only the imaginary part changes sign */
export const conjPair: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['gen', 'gen', 'gen', 'real', 'imag', 'twice', 'zero'] as const);
  const z = t === 'real' ? C(nz(R, -9, 9), 0) : t === 'imag' ? C(0, nz(R, -9, 9)) : t === 'zero' ? C(0, 0) : C(nz(R, -9, 9), nz(R, -9, 9));
  if (t === 'zero' && R() < 0.6) throw new Reroll();
  const c = t === 'twice' ? z : conj(z);
  return cxPair({
    id: `conjPair-${n}`, family: 'conjPair',
    prompt: t === 'twice' ? `z = ${html(z)}. What is the conjugate of the conjugate of z?` : `What is the conjugate of ${html(z)}? Answer in the form a + b${II}.`,
    board: t === 'twice' ? `\\overline{\\overline{${tex(z)}}} = \\,?` : `\\overline{${tex(z)}} = \\,?`,
    picture: { plane: planeFor(z, [{ key: 'z', at: at(z), name: 'z', col: 'first' }], [{ key: 'c', at: at(c), name: t === 'twice' ? 'z̿' : 'z̄', col: 'link' }]) },
    solution: t === 'twice'
      ? [`The conjugate flips the sign of the imaginary part: ${html(conj(z))}. Flip it again and it is back.`, endZ(c)]
      : [`The conjugate keeps the real part and flips the sign of the imaginary part${t === 'real' ? ` (b = 0 here, so nothing changes)` : t === 'zero' ? ' (both are 0)' : ''}.`, endZ(c)],
  }, c, `Yes: ${html(c)}.`, [
    { z: neg(z), mc: MC.conjBoth, say: `Only the imaginary part changes sign; the real part stays ${qH(z.re)}.` },
    { z: C(-qVal(z.re), qVal(z.im)), mc: MC.conjReal, say: `It is the IMAGINARY part that changes sign, not the real part.` },
    { z: conj(z), say: 'The conjugate of the conjugate flips the sign back.' },
  ], 'Keep a, flip the sign of b: a + bi becomes a − bi.');
});
/** on the plane, the conjugate is the mirror image in the real axis */
export const conjPlane: Gen = (R, n) => retry(() => {
  const a = big(R), b = big(R), z = C(a, b);
  const pts = [{ z: conj(z), ok: true }, { z: neg(z), mc: MC.conjBoth }, { z: C(-a, b), mc: MC.conjReal }];
  const L = ['A', 'B', 'C'];
  const order = pickOf(R, [[0, 1, 2], [1, 0, 2], [2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0]]);
  const placed = order.map((k, j) => ({ ...pts[k]!, label: L[j]! }));
  const given: PP[] = [{ key: 'z', at: [a, b], name: 'z', col: 'first' }, ...placed.map(p => ({ key: p.label, at: at(p.z), name: p.label, col: 'second' }))];
  return choiceItem(R, {
    id: `conjPlane-${n}`, family: 'conjPlane',
    prompt: `z = ${html(z)} is marked on the plane. Which point is its conjugate z̄?`,
    board: `\\overline{z} = \\,?`,
    picture: { plane: { x: [-6, 6], y: [-6, 6], step: 1, given, reveal: { pts: [{ key: 'mirror', at: at(conj(z)), from: [a, b], arrow: false, col: 'link' }] } } },
    solution: [`z̄ = ${html(conj(z))}: same real part, opposite imaginary part.`, `On the plane that is z's mirror image in the real axis: point ${placed.find(p => p.ok)!.label}.`],
  }, placed.map(p => ({
    t: `Point ${p.label}`, ok: !!p.ok, mc: p.mc,
    say: p.ok ? `Yes: ${html(conj(z))}, z mirrored in the real axis.` : p.mc === MC.conjBoth ? `That point is ${html(p.z)} = ${MINUS}z: both parts flipped (a half turn).` : `That point is ${html(p.z)}: the REAL part flipped. The conjugate flips the imaginary part.`,
  })), { keep: true });
});

// ===================== conjugate-product =====================
/** (a + bi)(a − bi) = a² + b², a real number */
export const conjProduct: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['gen', 'gen', 'gen', 'real', 'imag'] as const);
  const a = t === 'imag' ? 0 : nz(R, -10, 10), b = t === 'real' ? 0 : nz(R, -10, 10), z = C(a, b), p = mul(z, conj(z));
  return cxPair({
    id: `conjProduct-${n}`, family: 'conjProduct',
    prompt: `Multiply ${t === 'gen' ? 'by the conjugate' : 'the number by its conjugate'}: (${html(z)})(${html(conj(z))}). Answer in the form a + b${II}.`,
    board: `(${tex(z)})(${tex(conj(z))}) = \\,?`,
    picture: t === 'gen' ? { box: { a: terms(z), b: terms(conj(z)) } } : undefined,
    solution: t === 'gen'
      ? [`${sumH([[a * a, 0], [-a * b, 1], [a * b, 1], [-b * b, 2]])}: the two middle cells cancel.`, `${monoH(-b * b, 2)} = +${b * b}, so the product is ${a * a} + ${b * b} = ${a * a + b * b}: a² + b², a real number.`, endZ(p)]
      : [`${parHtml(z)} · ${parHtml(conj(z))} = ${t === 'imag' ? `${monoH(-b * b, 2)} = ${b * b}` : `${a * a}`}: a² + b² with ${t === 'imag' ? 'a' : 'b'} = 0.`, endZ(p)],
  }, p, `Yes: ${qH(p.re)}, a real number: a² + b².`, [
    { z: C(a * a - b * b, 0), mc: MC.i2Plus, say: `${monoH(-b * b, 2)} = ${nH(-b * b)} · (${MINUS}1) = +${b * b}: ${II}<sup>2</sup> = ${MINUS}1.` },
    { z: C(a * a + b * b, -2 * a * b), say: 'The two middle terms are opposites: they cancel.' },
    { z: C(a * a, -b * b), mc: MC.iTimesI, say: `The ${II}<sup>2</sup> cell is real: ${monoH(-b * b, 2)} = +${b * b}.` },
  ], 'Fill the box: the middle cells cancel, and the i² cell becomes positive.');
});
/** which product equals a² + b² (two products with the same value are never both offered) */
export const sumSquaresPick: Gen = (R, n) => retry(() => {
  const a = nz(R, -6, 6), b = nz(R, -6, 6), N = a * a + b * b, z = C(a, b);
  const prodT = (u: Cx, v: Cx) => `(${html(u)})(${html(v)})`;
  const opt = (u: Cx, v: Cx, mc: string | undefined, say: string) => ({ z: mul(u, v), text: prodT(u, v), mc, say });
  return cxChoice(R, {
    id: `sumSquaresPick-${n}`, family: 'sumSquaresPick',
    prompt: `Which product equals ${N}?`,
    board: `? = ${N}`,
    solution: [`A number times its conjugate is a² + b²: (${html(z)})(${html(conj(z))}) = ${a * a} + ${b * b} = ${N}.`],
  }, { z: mul(z, conj(z)), text: prodT(z, conj(z)), say: `Yes: a number times its conjugate, ${a * a} + ${b * b} = ${N}.` }, [
    opt(z, z, undefined, `That is (${html(z)})<sup>2</sup> = ${html(mul(z, z))}: not a conjugate pair.`),
    opt(z, neg(conj(z)), undefined, `${html(neg(conj(z)))} is not the conjugate of ${html(z)}: the real part changed sign too. The product is ${html(mul(z, neg(conj(z))))}.`),
    opt(z, neg(z), MC.conjBoth, `${html(neg(z))} is ${MINUS}z, not the conjugate. The product is ${html(mul(z, neg(z)))}.`),
  ]);
});
const TRIPLES: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [4, 3, 5], [8, 6, 10], [12, 5, 13]];
/** z·z̄ = a² + b² is the squared distance from 0: |z| */
export const distance: Gen = (R, n) => {
  const [p, r, d] = pickOf(R, TRIPLES), a = p * (R() < 0.5 ? -1 : 1), b = r * (R() < 0.5 ? -1 : 1), z = C(a, b);
  const small = d <= 10;
  return numItem({
    id: `distance-${n}`, family: 'distance',
    prompt: `z · z̄ = a<sup>2</sup> + b<sup>2</sup> is the square of the distance from 0 to z on the complex plane. How far is z = ${html(z)} from 0?`,
    board: `z = ${tex(z)}`,
    picture: small ? { plane: { x: [-10, 10], y: [-10, 10], step: 2, given: [{ key: 'z', at: [a, b], name: 'z', col: 'first' }], reveal: { pts: [{ key: 'r', at: [a, b], from: [0, 0], col: 'link', arrow: false }] } } } : undefined,
    solution: [`z · z̄ = ${parQn(a)}<sup>2</sup> + ${parQn(b)}<sup>2</sup> = ${a * a} + ${b * b} = ${d * d}.`, `The distance is ${rootH(d * d)} = ${ans(String(d))}.`],
  }, d, numCheck(d, `Yes: ${rootH(d * d)} = ${d}.`, [
    { v: d * d, say: `${d * d} is the SQUARE of the distance: take its root.` },
    { v: Math.abs(a) + Math.abs(b), say: 'Walking across and then up is longer than the straight line: use a² + b², then the root.' },
  ], 'Square both parts, add them, and take the square root.'));
};

// ===================== divide-by-real =====================
/** (a + bi)/k: divide BOTH parts by k (decimal answers) */
export const divReal: Gen = (R, n) => retry(() => {
  const k = pickOf(R, [2, -2, 4, 5, -5, 10, 2, 3, -3, 4]);
  let z: Cx;
  if (Math.abs(k) === 3) z = C(k * nz(R, -6, 6), k * nz(R, -6, 6));
  else z = C(nz(R, -10, 10), nz(R, -10, 10));
  const qz = scale(z, q(1, k));
  if (!typable(qz)) throw new Reroll();
  return cxPair({
    id: `divReal-${n}`, family: 'divReal',
    prompt: `Divide: (${html(z)}) ÷ ${k < 0 ? `(${nH(k)})` : k}. Answer in the form a + b${II}; decimals are fine.`,
    board: `\\dfrac{${tex(z)}}{${k}} = \\,?`,
    picture: small(z, qz) ? { plane: { x: [-6, 6], y: [-6, 6], step: 1, given: [{ key: 'z', at: at(z), name: 'z', col: 'first', arrow: true }], reveal: { pts: [{ key: 'q', at: at(qz), name: `z ÷ ${nH(k)}`, col: 'link', arrow: true }] } } } : undefined,
    solution: [`Divide each part by ${nH(k)}: ${qH(z.re)} ÷ ${nH(k)} = ${qH(qz.re)}, and ${qH(z.im)} ÷ ${nH(k)} = ${qH(qz.im)}.`, endZ(qz)],
  }, qz, `Yes: ${html(qz)}.`, [
    { z: CQ(qz.re, z.im), mc: MC.divFirst, say: `Divide BOTH parts by ${nH(k)}: the ${II} part too.` },
    { z: CQ(z.re, qz.im), mc: MC.divFirst, say: `Divide BOTH parts by ${nH(k)}: the real part too.` },
    { z: neg(qz), say: `Check the signs: dividing by ${nH(k)}${k < 0 ? ' flips both signs' : ' keeps both signs'}.` },
  ], `Split it: ${fracH(qH(z.re), nH(k))} + ${fracH(qH(z.im), nH(k))}${II}.`);
});
const fracH = frx;
/** (a + bi)/k with thirds, sixths, sevenths: as a choice */
export const divRealFrac: Gen = (R, n) => retry(() => {
  const k = pickOf(R, [3, 6, 7, 9, -3, 6]);
  const z = C(nz(R, -10, 10), nz(R, -10, 10)), qz = scale(z, q(1, k));
  if (typable(qz)) throw new Reroll();
  return cxChoice(R, {
    id: `divRealFrac-${n}`, family: 'divRealFrac',
    prompt: `Divide: (${html(z)}) ÷ ${k < 0 ? `(${nH(k)})` : k}.`,
    board: `\\dfrac{${tex(z)}}{${k}}`,
    solution: [`Divide each part by ${nH(k)}: ${fracH(qH(z.re), nH(k))} = ${qH(qz.re)} and ${fracH(qH(z.im), nH(k))} = ${qH(qz.im)}.`],
  }, { z: qz, say: `Yes: ${html(qz)}.` }, [
    { z: CQ(qz.re, z.im), mc: MC.divFirst, say: `Divide BOTH parts by ${nH(k)}.` },
    { z: CQ(z.re, qz.im), mc: MC.divFirst, say: `Divide BOTH parts by ${nH(k)}.` },
    { z: neg(qz), say: 'Check the signs.' },
    { z: CQ(qz.im, qz.re), say: 'The real part comes from the real part.' },
  ]);
});

// ===================== divide-by-imaginary =====================
/** z ÷ (pi): multiply top and bottom by i (i² = −1 makes the bottom real) */
export const divI: Gen = (R, n) => retry(() => {
  const p = pickOf(R, [1, -1, 2, -2, 3, -3, 2]);
  const ans_ = C(nz(R, -6, 6), pickOf(R, [0, nz(R, -6, 6), nz(R, -6, 6)]));
  const d = C(0, p), z = mul(ans_, d);
  const a = qVal(z.re), b = qVal(z.im);
  const zTop = mul(z, C(0, 1));
  return cxPair({
    id: `divI-${n}`, family: 'divI',
    prompt: `Divide: ${parHtml(z)} ÷ (${html(d)}). Answer in the form a + b${II}.`,
    board: `\\dfrac{${tex(z)}}{${tex(d)}} = \\,?`,
    solution: [
      `Multiply top and bottom by ${II}: the bottom becomes ${monoH(p, 1)} · ${II} = ${monoH(p, 2)} = ${nH(-p)}.`,
      `The top: (${html(z)}) · ${II} = ${html(zTop)}.`,
      `${fracH(html(zTop), nH(-p))} = ${html(ans_)}. Check: (${html(ans_)}) · ${monoH(p, 1)} = ${html(z)}.`,
      endZ(ans_),
    ],
  }, ans_, `Yes: ${html(ans_)}.`, [
    { z: C(-a / p, -b / p), mc: MC.oneSide, say: `Multiply the top by ${II} too: ${II}/${II} is 1, but ${II} on the bottom alone changes the value.` },
    { z: neg(ans_), mc: MC.i2Plus, say: `${II}<sup>2</sup> = ${MINUS}1: the bottom becomes ${nH(-p)}, not ${nH(p)}.` },
    { z: C(a / p, b / p), say: `${monoH(p, 1)} is not ${nH(p)}: the ${II} on the bottom has to be cleared first.` },
  ].filter(s => typable(s.z)), `Multiply top and bottom by ${II}, use ${II}<sup>2</sup> = ${MINUS}1, then divide both parts.`);
});
/** z ÷ i turns z a quarter turn clockwise (z · i turns it counterclockwise) */
export const divIRotate: Gen = (R, n) => retry(() => {
  const a = big(R), b = big(R), z = C(a, b);
  const right = div(z, C(0, 1));
  const pts = [{ z: right, ok: true }, { z: mul(z, C(0, 1)), mc: MC.i2Plus }, { z: neg(z) }];
  const L = ['A', 'B', 'C'];
  const order = pickOf(R, [[0, 1, 2], [1, 0, 2], [2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0]]);
  const placed = order.map((k, j) => ({ ...pts[k]!, label: L[j]! }));
  return choiceItem(R, {
    id: `divIRotate-${n}`, family: 'divIRotate',
    prompt: `z = ${html(z)}. Which point is z ÷ ${II}? (Multiplying by ${II} turns a quarter turn counterclockwise; dividing by ${II} undoes it.)`,
    board: `\\dfrac{z}{i} = \\,?`,
    picture: { plane: { x: [-6, 6], y: [-6, 6], step: 1, given: [{ key: 'z', at: [a, b], name: 'z', col: 'first', arrow: true }, ...placed.map(p => ({ key: p.label, at: at(p.z), name: p.label, col: 'second' }))], reveal: { turn: { from: [a, b], quarters: -1 } } } },
    solution: [`${fracH('z', II)} = ${fracH(`z · ${II}`, `${II} · ${II}`)} = ${fracH(`z${II}`, `${MINUS}1`)} = ${MINUS}${II}z = ${html(right)}.`, `That is a quarter turn CLOCKWISE: point ${placed.find(p => p.ok)!.label}.`],
  }, placed.map(p => ({
    t: `Point ${p.label}`, ok: !!p.ok, mc: p.mc,
    say: p.ok ? `Yes: ${html(right)}, a quarter turn clockwise.` : p.mc ? `That is ${II}z = ${html(p.z)}: multiplying, not dividing. Dividing turns the other way.` : `That is ${MINUS}z, a half turn.`,
  })), { keep: true });
});

// ===================== divide-complex =====================
/** (a + bi)/(c + di): multiply top and bottom by the conjugate c − di */
export const divComplex: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['int', 'int', 'int', 'half', 'unit', 'zero'] as const);
  const w = t === 'unit' ? C(pickOf(R, [1, -1]), pickOf(R, [1, -1])) : C(nz(R, -4, 4), nz(R, -4, 4));
  const qq = t === 'zero' ? C(0, 0) : t === 'half' ? CQ(q(nz(R, -5, 5), 2), q(nz(R, -5, 5), 2)) : t === 'unit' ? pickOf(R, [C(0, 1), C(0, -1), C(nz(R, -4, 4), nz(R, -4, 4))]) : C(nz(R, -5, 5), int(R, -5, 5));
  if (t === 'zero' && R() < 0.6) throw new Reroll();
  const z = mul(qq, w);
  if (!ints(z) || (t !== 'zero' && isZero(z))) throw new Reroll();
  const N = qVal(normSq(w)), top = mul(z, conj(w));
  const a = qVal(z.re), b = qVal(z.im), c = qVal(w.re), d = qVal(w.im);
  const slips = [
    { z: CQ(q(a, c), q(b, d)), mc: MC.termByTerm, say: 'Dividing is not part by part when the bottom has two parts. Multiply top and bottom by the conjugate.' },
    { z: CQ(q(a, N), q(b, N)), mc: MC.oneSide, say: `Multiply the TOP by ${html(conj(w))} too: only (${html(conj(w))})/(${html(conj(w))}) equals 1.` },
    ...(c * c !== d * d ? [{ z: CQ(qDiv(top.re, q(c * c - d * d)), qDiv(top.im, q(c * c - d * d))), mc: MC.i2Plus, say: `The bottom is ${c * c} + ${d * d} = ${N}: ${monoH(-d * d, 2)} = +${d * d}.` }] : []),
  ].filter(s => typable(s.z));
  return cxPair({
    id: `divComplex-${n}`, family: 'divComplex',
    prompt: `Divide: (${html(z)}) ÷ (${html(w)}). Answer in the form a + b${II}; decimals are fine.`,
    board: `\\dfrac{${tex(z)}}{${tex(w)}} = \\,?`,
    picture: { box: { a: terms(w), b: terms(conj(w)) } },
    solution: [
      `Multiply top and bottom by the conjugate ${html(conj(w))}.`,
      `Bottom: (${html(w)})(${html(conj(w))}) = ${c * c} + ${d * d} = ${N}. Top: (${html(z)})(${html(conj(w))}) = ${html(top)}.`,
      `${fracH(html(top), String(N))} = ${html(qq)}.`,
      endZ(qq),
    ],
  }, qq, `Yes: ${html(qq)}.`, slips, `Multiply top and bottom by ${html(conj(w))}; the bottom becomes ${N}.`);
});
/** what to multiply by, a zero divisor, a zero numerator */
export const divSteps: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['factor', 'factor', 'factor', 'zeroDiv', 'zeroNum'] as const);
  const z = C(nz(R, -9, 9), nz(R, -9, 9)), w = C(nz(R, -6, 6), nz(R, -6, 6));
  // the numerator's conjugate must NOT also make the bottom real (it does when z is a real multiple of w)
  if (eq(z, w) || eq(z, conj(w)) || mul(w, conj(z)).im[0] === 0) throw new Reroll();
  if (t === 'zeroDiv') return choiceItem(R, {
    id: `divSteps-${n}`, family: 'divSteps',
    prompt: `What is (${html(z)}) ÷ 0?`,
    board: `\\dfrac{${tex(z)}}{0}`,
    solution: [`A quotient q would need q · 0 = ${html(z)}. But q · 0 = 0 for every q.`, 'So dividing by 0 is not defined, for complex numbers too.'],
  }, [
    { t: 'Not defined: no number times 0 gives a nonzero number.', ok: true, say: 'Yes. Division by 0 is never defined.' },
    { t: '0', say: `0 · 0 = 0, not ${html(z)}.` },
    { t: html(z), say: `${html(z)} · 0 = 0, not ${html(z)}.` },
    { t: `Multiply top and bottom by the conjugate of 0 first.`, say: 'The conjugate of 0 is 0: the bottom stays 0.' },
  ]);
  if (t === 'zeroNum') return choiceItem(R, {
    id: `divSteps-${n}`, family: 'divSteps',
    prompt: `What is 0 ÷ (${html(w)})?`,
    board: `\\dfrac{0}{${tex(w)}}`,
    solution: [`0 · (${html(w)}) = 0, so 0 ÷ (${html(w)}) = 0.`],
  }, [
    { t: '0', ok: true, say: `Yes: 0 · (${html(w)}) = 0.` },
    { t: 'Not defined', say: 'Only dividing BY 0 is undefined. Here 0 is on top.' },
    { t: html(conj(w)), say: `Check: (${html(conj(w))})(${html(w)}) = ${qH(normSq(w))}, not 0.` },
  ]);
  return choiceItem(R, {
    id: `divSteps-${n}`, family: 'divSteps',
    prompt: `To write ${fracH(html(z), html(w))} in a + b${II} form, what should you multiply it by?`,
    board: `\\dfrac{${tex(z)}}{${tex(w)}}`,
    solution: [`(${html(w)})(${html(conj(w))}) = ${qH(normSq(w))} is real, and (${html(conj(w))})/(${html(conj(w))}) = 1 keeps the value.`],
  }, [
    { t: `${fracH(html(conj(w)), html(conj(w)))}`, ok: true, say: `Yes: it equals 1, and the bottom becomes ${qH(normSq(w))}.` },
    { t: `${fracH(html(conj(z)), html(conj(z)))}`, mc: MC.conjNum, say: `That keeps the value, but the bottom (${html(w)})(${html(conj(z))}) is not real. Use the DENOMINATOR’s conjugate.` },
    { t: `${fracH(html(w), html(w))}`, say: `(${html(w)})<sup>2</sup> = ${html(mul(w, w))}: still not real.` },
    { t: `${html(conj(w))} on the bottom only`, mc: MC.oneSide, say: `Only (${html(conj(w))})/(${html(conj(w))}) equals 1. On the bottom alone it changes the value.` },
  ]);
});

export const FAM2 = { addPair, fracAddSub, propertyName, subPair, monoProduct, scaleDistribute, rotateByI, binProduct, squareComplex, radProduct, radTrapChoice, iPower, iPowerSum, conjPair, conjPlane, conjProduct, sumSquaresPick, distance, divReal, divRealFrac, divI, divIRotate, divComplex, divSteps } as const;
export type { CxItem };
void qMul; void qT; void sumT; void rootH;
