// fam1.ts: practice families for stage 1 of "Complex numbers": what i is, square roots of negatives, the a + bi form,
// the reals inside the complex numbers, and equality by parts.
import { int } from '../../runtime/item';
import { type CxItem, type Gen, type Region, MC, ans, choiceItem, cxChoice, cxPair, endZ, numItem, numCheck, nz, other, pickOf, retry, Reroll } from './common';
import { C, CQ, type Cx, II, MINUS, extract, html, nH, q, qH, rootH, rootT, tex } from './cx';

const s = (t: string) => `<b class="s">${t}</b>`;
const SQ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// ===================== define-i =====================
/** square a real number or i / −i: real squares are never negative, i² = −1 */
export const squareSign: Gen = (R, n) => {
  const kind = pickOf(R, ['neg', 'neg', 'pos', 'i', 'mi', 'zero'] as const);
  if (kind === 'i' || kind === 'mi') {
    const m = kind === 'mi';
    const base = m ? `${MINUS}${II}` : II;
    return numItem({
      id: `squareSign-${n}`, family: 'squareSign',
      prompt: `${II} is the number whose square is ${MINUS}1. What is ${m ? `(${base})` : base}<sup>2</sup>?`,
      board: `${m ? '(-i)^{2}' : 'i^{2}'} = \\,?`,
      picture: { plane: { x: [-2, 2], y: [-2, 2], given: [{ key: 'one', at: [1, 0], col: 'second' }, { key: 'z', at: m ? [0, -1] : [0, 1], col: 'first', arrow: true }], reveal: { turn: { from: m ? [0, -1] : [0, 1], quarters: m ? -1 : 1 }, pts: [{ key: 'ans', at: [-1, 0], col: 'link' }] } } },
      solution: m
        ? [`(${MINUS}${II})<sup>2</sup> = (${MINUS}1)<sup>2</sup> · ${II}<sup>2</sup> = 1 · (${MINUS}1).`, `So (${MINUS}${II})<sup>2</sup> = ${ans(MINUS + '1')}: ${MINUS}${II} is the other number whose square is ${MINUS}1.`]
        : [`${II} is defined by ${II}<sup>2</sup> = ${MINUS}1.`, `So ${II}<sup>2</sup> = ${ans(MINUS + '1')}.`],
    }, -1, numCheck(-1, m ? `Yes: (${MINUS}1)<sup>2</sup> · ${II}<sup>2</sup> = 1 · (${MINUS}1) = ${MINUS}1.` : `Yes: that is what ${II} is made for.`,
      [{ v: 1, mc: MC.i2Plus, say: `For real numbers a square is never negative, but ${II} is not real: ${II}<sup>2</sup> = ${MINUS}1 by definition.` }],
      `${II}<sup>2</sup> = ${MINUS}1 is the definition of ${II}.`));
  }
  const a = kind === 'zero' ? 0 : pickOf(R, SQ.slice(1)), v = kind === 'neg' ? -a : a;
  return numItem({
    id: `squareSign-${n}`, family: 'squareSign',
    prompt: `Square the real number ${nH(v)}. What is (${nH(v)})<sup>2</sup>?`,
    board: `(${v})^{2} = \\,?`,
    solution: [`(${nH(v)})<sup>2</sup> = ${nH(v)} · ${nH(v)}${v < 0 ? ': a negative times a negative is positive' : ''}.`, `So (${nH(v)})<sup>2</sup> = ${ans(String(a * a))}. A real number squared is never negative.`],
  }, a * a, numCheck(a * a, `Yes: ${a * a}. ${v < 0 ? 'Negative times negative is positive.' : 'A real square is never negative.'}`,
    [{ v: -a * a, mc: MC.evenPowNeg, say: `(${nH(v)}) · (${nH(v)}): two negatives make a positive, so the square is ${a * a}.` }],
    `Multiply the number by itself: ${nH(v)} · ${nH(v)}.`));
};

/** why x² = −k has no REAL solution, the graph view, and what i is */
export const whyNoReal: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['eq', 'graph', 'what'] as const);
  const r = pickOf(R, SQ), k = r * r;
  if (t === 'eq') return choiceItem(R, {
    id: `whyNoReal-${n}`, family: 'whyNoReal',
    prompt: `Why does x<sup>2</sup> = ${MINUS}${k} have no real solution?`,
    board: `x^{2} = -${k}`,
    solution: [`Positive × positive is positive, negative × negative is positive, and 0 × 0 = 0.`, `So no real number squared is negative, and x<sup>2</sup> = ${MINUS}${k} needs a new kind of number: ${r === 1 ? II : `${r}${II}`} and ${MINUS}${r === 1 ? II : `${r}${II}`}.`],
  }, [
    { t: 'A real number squared is never negative: positive · positive and negative · negative are positive, and 0 · 0 = 0.', ok: true, say: 'Yes. Every real square is 0 or more, so no real number squares to a negative.' },
    { t: `It has one: x = ${MINUS}${r}, since (${MINUS}${r})<sup>2</sup> = ${MINUS}${k}.`, mc: MC.evenPowNeg, say: `(${MINUS}${r}) · (${MINUS}${r}) = ${k}: two negatives make a positive.` },
    { t: `It has one: ${II} = ${MINUS}1, so x = ${r === 1 ? '' : r}${II} is a real number.`, mc: MC.iIsMinusOne, say: `${II} is not ${MINUS}1: (${MINUS}1)<sup>2</sup> = 1. ${II} is a new number, not on the real number line.` },
    { t: 'The solution is real, but too big to find without a calculator.', say: 'Size is not the problem: every real square is 0 or more, and this square is negative.' },
  ]);
  if (t === 'graph') return choiceItem(R, {
    id: `whyNoReal-${n}`, family: 'whyNoReal',
    prompt: `The graph of y = x<sup>2</sup> + ${k} never touches the x-axis. What does that tell you about x<sup>2</sup> + ${k} = 0?`,
    board: `y = x^{2} + ${k}`,
    picture: { graph: { k } },
    solution: [`x<sup>2</sup> is 0 or more, so x<sup>2</sup> + ${k} is at least ${k}: the graph stays above the x-axis.`, `No real x makes it 0. With ${II}: x = ${r === 1 ? II : `${r}${II}`} and x = ${MINUS}${r === 1 ? II : `${r}${II}`} do, since (${r === 1 ? II : `${r}${II}`})<sup>2</sup> = ${MINUS}${k}.`],
  }, [
    { t: `No real number solves it, because x<sup>2</sup> + ${k} is always at least ${k}.`, ok: true, say: `Yes. The lowest point is (0, ${k}). The two solutions are not real: they are ${r === 1 ? '' : r}${II} and ${MINUS}${r === 1 ? '' : r}${II}.` },
    { t: 'It has no solutions of any kind, real or not.', mc: MC.dismiss, say: `No real ones. But (${r === 1 ? '' : r}${II})<sup>2</sup> + ${k} = ${MINUS}${k} + ${k} = 0: in the complex numbers it has two solutions.` },
    { t: `It has the real solutions x = ${r} and x = ${MINUS}${r}.`, mc: MC.evenPowNeg, say: `${r}<sup>2</sup> + ${k} = ${2 * k}, not 0. Both ${r} and ${MINUS}${r} square to +${k}.` },
    { t: `The graph is wrong: x = ${MINUS}${r} gives 0.`, mc: MC.evenPowNeg, say: `(${MINUS}${r})<sup>2</sup> = ${k}, so the value is ${2 * k}, not 0.` },
  ]);
  const what = pickOf(R, [1, 4, 9, 16, 25]);
  const rr = Math.round(Math.sqrt(what));
  return choiceItem(R, {
    id: `whyNoReal-${n}`, family: 'whyNoReal',
    prompt: `${II} is defined by ${II}<sup>2</sup> = ${MINUS}1. Which statement about ${II} is true? (Think of x<sup>2</sup> = ${MINUS}${what}.)`,
    board: `i^{2} = -1`,
    solution: [`No real number squares to ${MINUS}1, so ${II} cannot be on the real number line.`, `It is a new number, and with it x<sup>2</sup> = ${MINUS}${what} has the solutions ${rr === 1 ? '' : rr}${II} and ${MINUS}${rr === 1 ? '' : rr}${II}.`],
  }, [
    { t: `${II} is not a real number: no real number has a square of ${MINUS}1.`, ok: true, say: 'Yes. i is a new number, outside the real numbers.' },
    { t: `${II} = ${MINUS}1.`, mc: MC.iIsMinusOne, say: `(${MINUS}1)<sup>2</sup> = 1, not ${MINUS}1. ${II} is the number whose SQUARE is ${MINUS}1.` },
    { t: `${II} is a variable: it can stand for any number we solve for.`, mc: MC.iVariable, say: `${II} is one fixed number, like π. It never changes and is never solved for.` },
    { t: `${II} is a real number between 0 and 1.`, say: `Every real number squared is 0 or more. ${II}<sup>2</sup> = ${MINUS}1, so ${II} is not real.` },
  ]);
});

// ===================== sqrt-neg-perfect =====================
const iTimes = (r: number) => (r === 1 ? II : `${r}${II}`);
/** √(−k) = i√k for a perfect square k (and −√(−k), and the real contrast −√k) as a + bi */
export const sqrtNeg: Gen = (R, n) => {
  const t = pickOf(R, ['root', 'root', 'negRoot', 'real', 'one'] as const);
  const r = t === 'one' ? 1 : pickOf(R, SQ.slice(1)), k = r * r;
  const z = t === 'negRoot' ? C(0, -r) : t === 'real' ? C(-r, 0) : C(0, r);
  const promptE = t === 'negRoot' ? `${MINUS}${rootH(MINUS + k)}` : t === 'real' ? `${MINUS}${rootH(k)}` : rootH(MINUS + k);
  const boardE = t === 'negRoot' ? `-\\sqrt{-${k}}` : t === 'real' ? `-\\sqrt{${k}}` : `\\sqrt{-${k}}`;
  return cxPair({
    id: `sqrtNeg-${n}`, family: 'sqrtNeg',
    prompt: `Write ${promptE} in the form a + b${II}.`,
    board: `${boardE} = \\,?`,
    solution: t === 'real'
      ? [`${rootH(k)} = ${r}, so ${MINUS}${rootH(k)} = ${MINUS}${r}: a real number, no ${II}.`, endZ(z)]
      : [`${rootH(MINUS + k)} = ${II}${rootH(k)} = ${iTimes(r)}${t === 'negRoot' ? `, so ${MINUS}${rootH(MINUS + k)} = ${MINUS}${iTimes(r)}` : ''}.`, `Check: (${iTimes(r)})<sup>2</sup> = ${k}${II}<sup>2</sup> = ${MINUS}${k}.`, endZ(z)],
  }, z, `Yes: ${html(z)}.`, [
    { z: C(-r, 0), mc: t === 'real' ? undefined : MC.rootNegReal, say: `${rootH(MINUS + k)} is not ${MINUS}${r}: (${MINUS}${r})<sup>2</sup> = ${k}. ${rootH(MINUS + k)} = ${II}${rootH(k)} = ${iTimes(r)}.` },
    { z: C(r, 0), mc: t === 'real' ? undefined : MC.dropsI, say: `The ${II} went missing: ${rootH(MINUS + k)} = ${II} · ${rootH(k)}.` },
    { z: C(0, r), mc: t === 'real' ? MC.dropsI : undefined, say: `${MINUS}${rootH(k)} has no negative under the root, so there is no ${II}: it is ${MINUS}${r}.` },
    { z: C(0, -r), say: t === 'root' || t === 'one' ? `${rootH(MINUS + k)} names the principal root, ${iTimes(r)}. ${MINUS}${iTimes(r)} squares to ${MINUS}${k} too, but the root sign means ${iTimes(r)}.` : `Keep the minus sign in front: ${MINUS}(${iTimes(r)}).` },
  ], t === 'real' ? `${rootH(k)} = ${r}, then the minus sign.` : `${rootH(MINUS + k)} = ${II}${rootH(k)}: take the root of ${k}, then attach ${II}.`);
};

/** √(−k) names ONE number (the principal root); x² = −k has two solutions */
export const rootContrast: Gen = (R, n) => retry(() => {
  const r = pickOf(R, SQ.slice(1)), k = r * r, ir = iTimes(r);
  const one = R() < 0.5;
  return choiceItem(R, {
    id: `rootContrast-${n}`, family: 'rootContrast',
    prompt: one ? `Which number does ${rootH(MINUS + k)} name?` : `Which numbers have a square of ${MINUS}${k}?`,
    board: one ? `\\sqrt{-${k}}` : `x^{2} = -${k}`,
    picture: { plane: { x: [-14, 14], y: [-14, 14], step: 2, given: [], reveal: { pts: one ? [{ key: 'p', at: [0, r], name: ir.replace(/<[^>]+>/g, ''), col: 'link' }] : [{ key: 'p', at: [0, r], name: `${r === 1 ? '' : r}i`, col: 'link' }, { key: 'm', at: [0, -r], name: `−${r === 1 ? '' : r}i`, col: 'link' }] } } },
    solution: one
      ? [`(${ir})<sup>2</sup> = ${MINUS}${k} and (${MINUS}${ir})<sup>2</sup> = ${MINUS}${k}: two numbers square to ${MINUS}${k}.`, `The root sign names ONE of them, the principal root: ${rootH(MINUS + k)} = ${II}${rootH(k)} = ${ir}.`]
      : [`(${ir})<sup>2</sup> = ${k}${II}<sup>2</sup> = ${MINUS}${k}.`, `(${MINUS}${ir})<sup>2</sup> = ${k}${II}<sup>2</sup> = ${MINUS}${k} too. Both work.`],
  }, one ? [
    { t: `${ir} only`, ok: true, say: `Yes. Both ${ir} and ${MINUS}${ir} square to ${MINUS}${k}, but ${rootH(MINUS + k)} names the principal one, ${ir}.` },
    { t: `${ir} and ${MINUS}${ir}`, mc: MC.plusMinus, say: `Both square to ${MINUS}${k}, but a root sign names ONE number, like ${rootH(k)} = ${r}, not ±${r}.` },
    { t: `${MINUS}${r}`, mc: MC.rootNegReal, say: `(${MINUS}${r})<sup>2</sup> = ${k}, not ${MINUS}${k}.` },
    { t: 'No number: a negative has no square root.', mc: MC.dismiss, say: `No REAL number. With ${II}: (${ir})<sup>2</sup> = ${MINUS}${k}.` },
  ] : [
    { t: `${ir} and ${MINUS}${ir}`, ok: true, say: `Yes. Both square to ${k}${II}<sup>2</sup> = ${MINUS}${k}.` },
    { t: `${ir} only`, say: `Check ${MINUS}${ir} too: (${MINUS}${ir})<sup>2</sup> = ${k}${II}<sup>2</sup> = ${MINUS}${k}. The root sign picks one, but the question asks for every number.` },
    { t: `${r} and ${MINUS}${r}`, mc: MC.evenPowNeg, say: `Both of those square to +${k}.` },
    { t: 'None: no number has a negative square.', mc: MC.dismiss, say: `No REAL number. But (${ir})<sup>2</sup> = ${MINUS}${k}.` },
  ]);
});

// ===================== sqrt-neg-nonperfect =====================
const FREE = [2, 3, 5, 6, 7, 10, 11];
/** √(−k) = out·i√rest: pull out i and the square factor */
export const sqrtNonPerfect: Gen = (R, n) => retry(() => {
  const rest = pickOf(R, FREE), out = int(R, 2, rest >= 10 ? 4 : 6), k = out * out * rest;
  const right = `${out}${II}${rootH(rest)}`;
  return choiceItem(R, {
    id: `sqrtNonPerfect-${n}`, family: 'sqrtNonPerfect',
    prompt: `Simplify ${rootH(MINUS + k)}. (Write ${II} before the root.)`,
    board: `\\sqrt{-${k}} = \\,?`,
    solution: [`${rootH(MINUS + k)} = ${II}${rootH(k)}: the minus becomes ${II}.`, `${k} = ${out * out} · ${rest}, and ${rootH(out * out)} = ${out}, so ${II}${rootH(k)} = ${out}${II}${rootH(rest)}.`],
  }, [
    { t: right, ok: true, say: `Yes: ${II}${rootH(k)} = ${right}.` },
    { t: `${out}${rootH(`${rest}${II}`)}`, mc: MC.iUnder, say: `The ${II} comes OUT of the root: ${rootH(MINUS + k)} = ${II}${rootH(k)}, and ${II} stays outside: ${right}.` },
    { t: `${out}${rootH(rest)}`, mc: MC.dropsI, say: `The ${II} went missing. ${rootH(MINUS + k)} = ${II}${rootH(k)} = ${right}.` },
    { t: `${MINUS}${out}${rootH(rest)}`, mc: MC.rootNegReal, say: `(${MINUS}${out}${rootH(rest)})<sup>2</sup> = ${k}, not ${MINUS}${k}. The minus under the root becomes ${II}.` },
    { t: `${out * out}${II}${rootH(rest)}`, say: `${k} = ${out * out} · ${rest}: the root of ${out * out} is ${out}, not ${out * out}.` },
  ]);
});
/** √(−k) = □ i√rest: the number in front */
export const nonPerfectCoef: Gen = (R, n) => {
  const rest = pickOf(R, FREE), out = int(R, 2, rest >= 10 ? 4 : 6), k = out * out * rest, neg = R() < 0.3;
  const v = neg ? -out : out;
  return numItem({
    id: `nonPerfectCoef-${n}`, family: 'nonPerfectCoef',
    prompt: `${neg ? MINUS : ''}${rootH(MINUS + k)} = □ ${II}${rootH(rest)}. What number goes in the box?`,
    board: `${neg ? '-' : ''}\\sqrt{-${k}} = \\square\\, i\\sqrt{${rest}}`,
    solution: [`${rootH(MINUS + k)} = ${II}${rootH(k)} = ${II}${rootH(`${out * out} · ${rest}`)} = ${out}${II}${rootH(rest)}.`, neg ? `With the minus in front: ${MINUS}${out}${II}${rootH(rest)}. The box holds ${ans(nH(v))}.` : `The box holds ${ans(nH(v))}.`],
  }, v, numCheck(v, `Yes: ${nH(v)}${II}${rootH(rest)}.`, [
    { v: neg ? -out * out : out * out, say: `${out * out} is the square factor. Its root, ${out}, comes out of the radical.` },
    { v: -v, mc: neg ? undefined : MC.rootNegReal, say: neg ? `Keep the minus sign that sits in front of the root.` : `The minus under the root becomes ${II}, not a minus sign in front.` },
  ], `Split ${k} into a perfect square times ${rest}: ${k} = □ · ${rest}.`));
};

// ===================== standard-form =====================
const HALF = [q(1, 2), q(3, 2), q(1, 4), q(3, 4), q(5, 2), q(2, 5)];
/** read the real part a and the imaginary part b (a signed number, not bi), from any written order */
export const readParts: Gen = (R, n) => {
  const t = pickOf(R, ['std', 'std', 'rev', 'pure', 'real', 'frac'] as const);
  let z: Cx, shown: string, board: string;
  if (t === 'frac') {
    z = CQ(pickOf(R, HALF), pickOf(R, HALF)); if (R() < 0.5) z = CQ(z.re, [-z.im[0], z.im[1]]); if (R() < 0.4) z = CQ([-z.re[0], z.re[1]], z.im);
    shown = html(z); board = tex(z);
  } else if (t === 'pure') { const b = pickOf(R, [1, -1, nz(R, -10, 10)]); z = C(0, b); shown = html(z); board = tex(z); }
  else if (t === 'real') { z = C(nz(R, -10, 10), 0); shown = html(z); board = tex(z); }
  else {
    const a = nz(R, -10, 10), b = pickOf(R, [nz(R, -10, 10), nz(R, -10, 10), 1, -1]);
    z = C(a, b);
    if (t === 'rev') {
      const bi = (v: number) => (v === 1 ? II : v === -1 ? `${MINUS}${II}` : `${nH(v)}${II}`), biT = (v: number) => (v === 1 ? 'i' : v === -1 ? '-i' : `${v}i`);
      shown = `${bi(b)} ${a < 0 ? MINUS : '+'} ${Math.abs(a)}`; board = `${biT(b)} ${a < 0 ? '-' : '+'} ${Math.abs(a)}`;
    } else { shown = html(z); board = tex(z); }
  }
  const a = z.re, b = z.im;
  return cxPair({
    id: `readParts-${n}`, family: 'readParts',
    prompt: `z = ${shown}. What are its real part and its imaginary part?`,
    board: `z = ${board}`,
    pairLead: 'real part', pairOp: 'imaginary part', pairTail: '',
    picture: { plane: planeFor(z, [], [{ key: 'z', at: [qv(a), qv(b)], name: 'z', col: 'link' }]) },
    solution: [
      t === 'rev' ? `In a + b${II} order: z = ${html(z)}.` : b[0] === 0 ? `z = ${html(z)} + 0${II}: there is no ${II} term.` : a[0] === 0 ? `z = 0 ${b[0] < 0 ? MINUS : '+'} ${html(CQ(q(0), [Math.abs(b[0]), b[1]]))}: there is no real term.` : `z = ${html(z)} is already in a + b${II} form.`,
      `The real part is a = ${ans(qH(a))}; the imaginary part is the signed number b = ${ans(qH(b))} (not b${II}).`,
    ],
  }, z, `Yes: a = ${qH(a)}, b = ${qH(b)}.`, [
    { z: CQ(a, [-b[0], b[1]]), mc: b[0] < 0 ? MC.unsignedB : undefined, say: `The imaginary part keeps its sign: in ${html(z)} it is ${qH(b)}.` },
    { z: CQ(a, [0, 1]), say: b[0] !== 0 && Math.abs(b[0]) === 1 && b[1] === 1 ? `${html(C(0, b[0]))} means ${nH(b[0])}${II}, so b = ${nH(b[0])}.` : `The imaginary part is the number in front of ${II}.` },
  ], `Write z as a + b${II}. a is the number without ${II}, b is the signed number in front of ${II}${b[0] !== 0 && Math.abs(b[0]) === 1 && b[1] === 1 ? ` (${html(C(0, b[0]))} means ${nH(b[0])}${II})` : ''}.`, 'Swapped: the real part is the number without i, the imaginary part the number in front of i.');
};
const qv = (a: readonly [number, number]) => a[0] / a[1];
/** a square window that holds the given points (integer parts up to 6, fractions up to 3) */
function planeFor(z: Cx, given: { key: string; at: [number, number]; name?: string; col?: string; arrow?: boolean }[], reveal: { key: string; at: [number, number]; name?: string; col?: string; arrow?: boolean }[]) {
  const m = Math.max(2, ...[...given, ...reveal].flatMap(p => [Math.abs(p.at[0]), Math.abs(p.at[1])]).map(v => Math.ceil(v)));
  // the window reaches one cell past the farthest point, so no point sits on the card's edge
  const W = [3, 4, 6, 8, 10, 12].find(w => w > m) ?? 12;
  void z;
  return { x: [-W, W] as [number, number], y: [-W, W] as [number, number], step: W > 6 ? 2 : 1, given, reveal: { pts: reveal } };
}
export { planeFor };

/** which number sits at point P on the complex plane */
export const planeRead: Gen = (R, n) => {
  const a = other(R, -6, 6, [-1]), b = other(R, -6, 6, [0, -1]), z = C(a, b), L = pickOf(R, ['P', 'Q', 'A', 'B', 'K', 'M']);
  const lead = pickOf(R, ['On the complex plane, the real part runs across and the imaginary part runs up.', 'Across is the real part, up is the imaginary part.', 'Read the plane: real part across, imaginary part up.']);
  return cxPair({
    id: `planeRead-${n}`, family: 'planeRead',
    prompt: `${lead} Which number is at point ${L}? Answer in the form a + b${II}.`,
    board: `${L} = \\,?`,
    picture: { plane: { x: [-6, 6], y: [-6, 6], step: 1, given: [{ key: 'P', at: [a, b], name: L, col: 'first' }] } },
    solution: [`${L} is ${a === 0 ? 'on the imaginary axis' : `${Math.abs(a)} ${a > 0 ? 'right' : 'left'}`}${a === 0 ? '' : ' of 0'}, and ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}.`, endZ(z)],
  }, z, `Yes: ${L} = ${html(z)}.`, [
    { z: C(b, a), say: 'Across is the real part, up is the imaginary part.' },
    { z: C(a, -b), say: `Up is positive, down is negative: ${L} is ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}.` },
    { z: C(-a, b), say: `Right is positive, left is negative: ${L} is ${Math.abs(a)} ${a > 0 ? 'right' : 'left'}.` },
  ], 'Count across for the real part (right is +), then up for the imaginary part (up is +).');
};

/** the number with given parts, and the signed imaginary part of a radical coefficient */
export const stdFormPick: Gen = (R, n) => retry(() => {
  if (R() < 0.35) {
    const a = nz(R, -9, 9), rr = pickOf(R, [2, 3, 5, 7]), neg = R() < 0.6;
    const zz = `${nH(a)} ${neg ? MINUS : '+'} ${II}${rootH(rr)}`;
    return choiceItem(R, {
      id: `stdFormPick-${n}`, family: 'stdFormPick',
      prompt: `What is the imaginary part of ${zz}?`,
      board: `${a} ${neg ? '-' : '+'} i\\sqrt{${rr}}`,
      solution: [`In a + b${II} form, b is the real number in front of ${II}, with its sign.`, `Here b = ${neg ? MINUS : ''}${rootH(rr)}.`],
    }, [
      { t: `${neg ? MINUS : ''}${rootH(rr)}`, ok: true, say: `Yes: b = ${neg ? MINUS : ''}${rootH(rr)}, a real number.` },
      { t: `${neg ? '' : MINUS}${rootH(rr)}`, mc: neg ? MC.unsignedB : undefined, say: `The sign belongs to b: ${neg ? MINUS : '+'}${rootH(rr)}.` },
      { t: `${neg ? MINUS : ''}${II}${rootH(rr)}`, mc: MC.unsignedB, say: `The imaginary part is the real number b, not the term b${II}.` },
      { t: nH(a), say: `${nH(a)} is the real part.` },
    ]);
  }
  const a = nz(R, -9, 9), b = nz(R, -9, 9), z = C(a, b);
  const sum = a + b, c = other(R, -9, 9, [a, 0, sum]);
  return cxChoice(R, {
    id: `stdFormPick-${n}`, family: 'stdFormPick',
    prompt: `Which number has real part ${nH(a)} and imaginary part ${nH(b)}?`,
    board: `a = ${a},\\ b = ${b}`,
    solution: [`a + b${II} with a = ${nH(a)} and b = ${nH(b)}: ${html(z)}.`],
  }, { z, say: `Yes: ${html(z)}.` }, [
    { z: C(b, a), say: 'The real part comes first, without i; the imaginary part is the number in front of i.' },
    { z: C(a, -b), mc: b < 0 ? MC.unsignedB : undefined, say: `b = ${nH(b)} keeps its sign: ${html(z)}.` },
    { z: C(c, sum - c), mc: MC.coefSum, say: `Same total of parts, but a different number: the parts themselves must be ${nH(a)} and ${nH(b)}.` },
    { z: C(a + b, 0), mc: MC.combines, say: `${nH(a)} and ${nH(b)}${II} do not combine: they are different kinds of parts.` },
  ]);
});

// ===================== reals-in-complex =====================
interface Sample { html: string; tex: string; at: Region; kind: 'real' | 'imag' | 'neither'; why: string }
const realAt = (v: number): Region => (v > 0 ? 'counting' : v === 0 ? 'whole' : 'integer');
function sample(R: () => number): Sample {
  const t = pickOf(R, ['int', 'int', 'zero', 'frac', 'irr', 'imag', 'imag', 'both', 'both', 'i2', 'rootNeg', 'rootPos']);
  if (t === 'int') { const v = nz(R, -12, 12); return { html: nH(v), tex: String(v), at: realAt(v), kind: 'real', why: `${nH(v)} = ${nH(v)} + 0${II}: b = 0.` }; }
  if (t === 'zero') return { html: '0', tex: '0', at: 'whole', kind: 'real', why: `0 = 0 + 0${II}: b = 0, so 0 is real. (Purely imaginary needs b ≠ 0.)` };
  if (t === 'frac') { const d = pickOf(R, [2, 3, 4, 5]), p = other(R, -9, 9, [0, d, -d, 2 * d, -2 * d]); const Q = q(p, d); if (Q[1] === 1) return sample(R); return { html: qH(Q), tex: (Q[0] < 0 ? '-' : '') + `\\frac{${Math.abs(Q[0])}}{${Q[1]}}`, at: 'rational', kind: 'real', why: `${qH(Q)} has b = 0.` }; }
  if (t === 'irr') { const v = pickOf(R, [2, 3, 5, 7]); return { html: rootH(v), tex: rootT(v), at: 'irrational', kind: 'real', why: `${rootH(v)} is a real number: b = 0.` }; }
  if (t === 'imag') { const b = pickOf(R, [1, -1, nz(R, -9, 9)]); const z = C(0, b); return { html: html(z), tex: tex(z), at: 'imag', kind: 'imag', why: `${html(z)} = 0 ${b < 0 ? MINUS : '+'} ${html(C(0, Math.abs(b)))}: a = 0 and b = ${nH(b)} ≠ 0.` }; }
  if (t === 'both') { const z = C(nz(R, -9, 9), nz(R, -9, 9)); return { html: html(z), tex: tex(z), at: 'nonreal', kind: 'neither', why: `${html(z)}: a = ${qH(z.re)} ≠ 0 and b = ${qH(z.im)} ≠ 0.` }; }
  if (t === 'i2') return { html: `${II}<sup>2</sup>`, tex: 'i^{2}', at: 'integer', kind: 'real', why: `${II}<sup>2</sup> = ${MINUS}1, a real number: b = 0.` };
  if (t === 'rootNeg') { const r = pickOf(R, [2, 3, 4, 5, 6]); return { html: rootH(MINUS + r * r), tex: `\\sqrt{-${r * r}}`, at: 'imag', kind: 'imag', why: `${rootH(MINUS + r * r)} = ${r}${II} = 0 + ${r}${II}: a = 0, b = ${r}.` }; }
  const r = pickOf(R, [2, 3, 4, 5, 6]);
  return { html: rootH(r * r), tex: `\\sqrt{${r * r}}`, at: 'counting', kind: 'real', why: `${rootH(r * r)} = ${r}, a real number: b = 0.` };
}
const OTHERS: { tex: string; at: Region }[] = [{ tex: '5', at: 'counting' }, { tex: '-2', at: 'integer' }, { tex: '\\frac{1}{2}', at: 'rational' }, { tex: '\\sqrt{2}', at: 'irrational' }, { tex: '3i', at: 'imag' }, { tex: '2 - i', at: 'nonreal' }];
/** real (b = 0) / purely imaginary (a = 0, b ≠ 0) / neither, with the set map */
export const classify: Gen = (R, n) => retry(() => {
  const S = sample(R);
  const others = OTHERS.filter(o => o.tex !== S.tex && !(o.at === S.at && ['counting', 'integer', 'whole'].includes(o.at) && R() < 0.5)).slice(0, 5);
  const opts = [
    { t: `Real (b = 0)`, ok: S.kind === 'real', k: 'real' },
    { t: `Purely imaginary (a = 0, b ≠ 0)`, ok: S.kind === 'imag', k: 'imag' },
    { t: `Neither: a ≠ 0 and b ≠ 0`, ok: S.kind === 'neither', k: 'neither' },
  ];
  return choiceItem(R, {
    id: `classify-${n}`, family: 'classify',
    prompt: `Where does ${S.html} belong? Write it as a + b${II} first.`,
    board: S.tex,
    picture: { sets: { token: S.tex, others, reveal: { at: S.at } } },
    solution: [S.why],
  }, opts.map(o => ({
    t: o.t, ok: o.ok,
    mc: !o.ok && S.kind === 'real' && o.k !== 'real' && S.at !== 'whole' ? MC.realsNot : undefined,
    say: o.ok ? `Yes. ${S.why}` : S.kind === 'real' ? `${S.why} Every real number is a complex number with b = 0.` : S.why,
  })), { keep: true });
});
/** every real number is complex; non-real solutions count */
export const setTruth: Gen = (R, n) => retry(() => {
  const t = pickOf(R, ['isComplex', 'isComplex', 'solutions', 'statement'] as const);
  if (t === 'isComplex') {
    const S = sample(R);
    if (S.kind !== 'real') throw new Reroll();
    return choiceItem(R, {
      id: `setTruth-${n}`, family: 'setTruth',
      prompt: `Is ${S.html} a complex number?`,
      board: S.tex,
      picture: { sets: { token: S.tex, others: OTHERS.filter(o => o.tex !== S.tex).slice(0, 5), reveal: { at: S.at } } },
      solution: [S.why, 'Every real number a is the complex number a + 0i, so the reals sit inside the complex numbers.'],
    }, [
      { t: `Yes: it is a + b${II} with b = 0.`, ok: true, say: 'Yes. The real numbers are the complex numbers with b = 0.' },
      { t: `No: it has no ${II} in it.`, mc: MC.realsNot, say: `It has b = 0: ${S.why} Complex numbers include the reals.` },
      { t: 'No: real numbers and complex numbers do not overlap.', mc: MC.realsNot, say: 'The reals sit INSIDE the complex numbers, like the integers sit inside the rationals.' },
    ]);
  }
  if (t === 'solutions') {
    const r = pickOf(R, SQ.slice(1)), k = r * r;
    return choiceItem(R, {
      id: `setTruth-${n}`, family: 'setTruth',
      prompt: `Solve x<sup>2</sup> = ${MINUS}${k} in the complex numbers. What are its solutions?`,
      board: `x^{2} = -${k}`,
      solution: [`(${r}${II})<sup>2</sup> = ${k}${II}<sup>2</sup> = ${MINUS}${k} and (${MINUS}${r}${II})<sup>2</sup> = ${MINUS}${k}.`, `Over the complex numbers both count: x = ${r}${II} or x = ${MINUS}${r}${II}.`],
    }, [
      { t: `x = ${r}${II} or x = ${MINUS}${r}${II}`, ok: true, say: 'Yes. In the complex numbers, both are solutions.' },
      { t: 'None: imaginary numbers do not count.', mc: MC.dismiss, say: `We are solving in the complex numbers, so ${r}${II} and ${MINUS}${r}${II} count, and both check.` },
      { t: `x = ${r} or x = ${MINUS}${r}`, mc: MC.evenPowNeg, say: `${r}<sup>2</sup> and (${MINUS}${r})<sup>2</sup> are both +${k}.` },
      { t: `x = ${r}${II} only`, say: `(${MINUS}${r}${II})<sup>2</sup> = ${MINUS}${k} too: there are two solutions.` },
    ]);
  }
  const ex = pickOf(R, ['7', '−3', '0', '1/2', '√2']);
  return choiceItem(R, {
    id: `setTruth-${n}`, family: 'setTruth',
    prompt: `Which statement is true? (Think of ${ex}.)`,
    board: '\\mathbb{R} \\subset \\mathbb{C}',
    solution: [`${ex} = ${ex} + 0${II}: every real number is a complex number with b = 0.`],
  }, [
    { t: 'Every real number is a complex number.', ok: true, say: 'Yes: a = a + 0i.' },
    { t: 'No real number is a complex number.', mc: MC.realsNot, say: `${ex} = ${ex} + 0${II}: it is complex, with b = 0.` },
    { t: 'Every complex number is a real number.', say: `2 + 3${II} is complex but not real: b ≠ 0.` },
    { t: '0 is purely imaginary.', say: `0 = 0 + 0${II} has b = 0: it is real. Purely imaginary needs b ≠ 0.` },
  ]);
});

// ===================== equal-by-parts =====================
/** which number equals a + bi: reordered, real with 0i; not swapped, not the same coefficient sum */
export const whichEqual: Gen = (R, n) => retry(() => {
  if (R() < 0.3) {
    const a = nz(R, -9, 9);
    return cxChoice(R, {
      id: `whichEqual-${n}`, family: 'whichEqual',
      prompt: `Which number is equal to ${nH(a)}?`,
      board: `${a}`,
      solution: [`${nH(a)} has real part ${nH(a)} and imaginary part 0, so ${nH(a)} = ${nH(a)} + 0${II}.`],
    }, { z: C(a, 0), text: `${nH(a)} + 0${II}`, say: `Yes: same real part ${nH(a)}, same imaginary part 0.` }, [
      { z: C(0, a), say: `${nH(a)}${II} has real part 0 and imaginary part ${nH(a)}: different parts.` },
      { z: C(-a, 0), say: 'Different real parts.' },
      { z: C(a, a), say: `Its imaginary part is ${nH(a)}, not 0.` },
    ]);
  }
  const a = nz(R, -9, 9), b = nz(R, -9, 9), z = C(a, b), sum = a + b;
  const c = other(R, -9, 9, [a, b, 0, sum]);
  const bi = b === 1 ? II : b === -1 ? `${MINUS}${II}` : `${nH(b)}${II}`;
  return cxChoice(R, {
    id: `whichEqual-${n}`, family: 'whichEqual',
    prompt: `Which number is equal to ${html(z)}?`,
    board: tex(z),
    solution: [`Two complex numbers are equal when the real parts match AND the imaginary parts match.`, `${bi} ${a < 0 ? MINUS : '+'} ${Math.abs(a)} has real part ${nH(a)} and imaginary part ${nH(b)}: the same number, written in another order.`],
  }, { z, text: `${bi} ${a < 0 ? MINUS : '+'} ${Math.abs(a)}`, say: 'Yes: the same parts, in another order.' }, [
    { z: C(b, a), say: `Swapped parts: real part ${nH(b)} instead of ${nH(a)}.` },
    { z: C(c, sum - c), mc: MC.coefSum, say: `The parts add to the same total, ${sum}, but equal means equal PARTS: ${nH(a)} and ${nH(b)}.` },
    { z: C(a, -b), say: 'The imaginary parts have opposite signs.' },
    { z: C(sum, 0), mc: MC.combines, say: `A real part and an imaginary part never combine into one number.` },
  ]);
});
/** x + yi = a + bi (and simple multiples): match the parts */
export const solveEqual: Gen = (R, n) => {
  const t = pickOf(R, ['plain', 'plain', 'scaled'] as const);
  const a = nz(R, -10, 10), b = nz(R, -10, 10);
  if (t === 'plain') {
    const left = R() < 0.5;
    return cxPair({
      id: `solveEqual-${n}`, family: 'solveEqual',
      prompt: left ? `x and y are real numbers, and x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}${II} = ${nH(a)} + y${II}. Find x and y.` : `x and y are real numbers, and ${nH(a)} + y${II} = x ${b < 0 ? MINUS : '+'} ${Math.abs(b)}${II}. Find x and y.`,
      board: left ? `x ${b < 0 ? '-' : '+'} ${Math.abs(b)}i = ${a} + yi` : `${a} + yi = x ${b < 0 ? '-' : '+'} ${Math.abs(b)}i`,
      pairLead: 'x =', pairOp: 'y =', pairTail: '',
      solution: ['Equal complex numbers have equal real parts and equal imaginary parts.', `Real parts: x = ${ans(nH(a))}. Imaginary parts: y = ${ans(nH(b))}.`],
    }, C(a, b), `Yes: x = ${nH(a)}, y = ${nH(b)}.`, [
      { z: C(a, -b), say: `The imaginary parts are y and ${nH(b)}: keep the sign.` },
      { z: C(a + b, 0), mc: MC.combines, say: 'Match part by part: real with real, imaginary with imaginary.' },
    ], 'Match the real parts, then the imaginary parts.', 'Swapped: x is the real part, so x matches the number without i.');
  }
  const p = pickOf(R, [2, 3, 4, 5]), m = pickOf(R, [2, 3]);
  return cxPair({
    id: `solveEqual-${n}`, family: 'solveEqual',
    prompt: `x and y are real numbers, and ${p}x ${b < 0 ? MINUS : '+'} ${Math.abs(m * b)}${II} = ${nH(p * a)} + ${m}y${II}. Find x and y.`,
    board: `${p}x ${b < 0 ? '-' : '+'} ${Math.abs(m * b)}i = ${p * a} + ${m}yi`,
    pairLead: 'x =', pairOp: 'y =', pairTail: '',
    solution: [`Real parts: ${p}x = ${nH(p * a)}, so x = ${ans(nH(a))}.`, `Imaginary parts: ${m}y = ${nH(m * b)}, so y = ${ans(nH(b))}.`],
  }, C(a, b), `Yes: x = ${nH(a)}, y = ${nH(b)}.`, [
    { z: C(p * a, m * b), say: `${p}x = ${nH(p * a)} means x = ${nH(p * a)} ÷ ${p}.` },
  ], `Match the real parts (${p}x = ${nH(p * a)}) and the imaginary parts (${m}y = ${nH(m * b)}).`, 'Swapped: x comes from the real parts, y from the imaginary parts.');
};

export const FAM1 = { squareSign, whyNoReal, sqrtNeg, rootContrast, sqrtNonPerfect, nonPerfectCoef, readParts, planeRead, stdFormPick, classify, setTruth, whichEqual, solveEqual } as const;
export type { CxItem };
void s;
