// famB.ts: stage 2 of "Isosceles triangles and side-angle order": unknown measures with the right isosceles implication
// (the theorem from marked sides, the converse from marked angles; whole numbers, decimals, then expressions) and the
// range of a third side as a strict interval and as the whole lengths inside it. Figures are exact; the third side is
// drawn at the middle of its range, and the number-line strip shows the interval only in the worked solution.
import { type Opt, choiceItem, numItem, pick, r } from '../geometry-foundations/kit';
import { type FMark, type Tri, pickLetters, sideName } from '../triangle-congruence/tri';
import type { StripSpec } from './RangeStrip';
import { MC, type Gen, type TIPicture, angN, fitted, pairItem, segN, tri } from './tkit';
import { ang3, fmt, isoTri, isoTriSides, r2, rotTo, thirdRange, triFig, triSSS, turnT, wholeIn } from './ineq';

const unitOf = (R: () => number) => (R() < 0.5 ? 'in' : 'cm');
const isoAt = (R: () => number, T: Tri, k: number): Tri => turnT(rotTo(T, k), r(R, 0, 359));
/** a linear expression for the panel (real minus) and for TeX */
export const lin = (a: number, c: number): string => { const ax = a === 1 ? 'x' : `${a}x`; return c === 0 ? ax : c > 0 ? `${ax} + ${c}` : `${ax} − ${-c}`; };
export const linT = (a: number, c: number): string => lin(a, c).replace('−', '-');

// =============== s2-isosceles-unknowns ===============
export const isoAngle: Gen = (R, n) => fitted('isoAngle', () => {
  const nm = pickLetters(R, 3), k = r(R, 0, 2), mode = pick(R, ['v2b', 'v2b', 'b2v', 'b2v', 'b2b'] as const), dec = R() < 0.3;
  let v = 0, b = 0;
  for (;;) {
    if (mode === 'v2b') { v = dec ? r(R, 210, 1390) / 10 : r(R, 20, 140); b = r2((180 - v) / 2); }
    else { b = dec ? r(R, 255, 795) / 10 : r(R, 25, 80); v = r2(180 - 2 * b); }
    if (Math.abs(v - 60) < 7) continue;
    break;
  }
  const T = isoAt(R, isoTri(v, 300), k);
  const [l1, l2] = [sideName(nm, (k + 1) % 3), sideName(nm, (k + 2) % 3)];
  const ap = nm[k]!, b1 = nm[(k + 1) % 3]!, b2 = nm[(k + 2) % 3]!;
  const givenAt = mode === 'v2b' ? k : (k + 1) % 3, askAt = mode === 'b2v' ? k : (k + 2) % 3;
  const gv = mode === 'v2b' ? v : b, av = mode === 'b2v' ? v : b;
  const fig = triFig(T, nm, [{ seg: l1, n: 1 }, { seg: l2, n: 1 }, { ang: ang3(nm, givenAt), text: `${fmt(gv)}°`, lone: true, col: 'first' }, { ang: ang3(nm, askAt), text: '?', lone: true, col: 'link' }]);
  const pre = `In ${tri(nm)}, ${segN(l1)} ≅ ${segN(l2)} and m${angN(nm[givenAt]!)} = ${fmt(gv)}°. Find m${angN(nm[askAt]!)}.`;
  const sol = mode === 'v2b' ? [`${segN(l1)} ≅ ${segN(l2)}, so the angles facing them are equal: m${angN(b1)} = m${angN(b2)}.`, `They share what is left of 180°: 180° − ${fmt(v)}° = ${fmt(r2(180 - v))}°.`, `Half each: ${fmt(r2(180 - v))}° ÷ 2 = ${fmt(b)}°.`]
    : mode === 'b2v' ? [`${segN(l1)} ≅ ${segN(l2)}, so m${angN(b1)} = m${angN(b2)} = ${fmt(b)}°.`, `m${angN(ap)} = 180° − ${fmt(b)}° − ${fmt(b)}° = ${fmt(v)}°.`]
      : [`${segN(l1)} ≅ ${segN(l2)}: the angles facing them, ${angN(b1)} and ${angN(b2)}, are equal.`, `So m${angN(b2)} = ${fmt(b)}°.`];
  const wrong = mode === 'v2b' ? [{ v, mc: MC.baseMis, say: `${fmt(v)}° is the angle between the congruent sides; the two angles facing them share the rest.` }, { v: r2(180 - v), say: 'That is both base angles together; each gets half.' }]
    : mode === 'b2v' ? [{ v: b, mc: MC.baseMis, say: `${fmt(b)}° is a base angle; the angle between the congruent sides is what is left.` }, { v: r2(180 - b), say: 'Subtract both base angles, not one.' }]
      : [{ v: r2(180 - 2 * b), mc: MC.baseMis, say: `That would be the angle between the congruent sides; ${angN(b2)} faces a congruent side, like ${angN(b1)}.` }];
  return numItem({ id: `isoAngle-${n}`, family: 'isoAngle', prompt: pre, board: `m\\angle ${nm[askAt]} = \\,?`, unit: '°', solution: sol, picture: { fig, reveal: {} } }, av, wrong, 'Right.', 'Which angles face the congruent sides? Those two are equal, and all three share 180°.');
});

export const isoSides: Gen = (R, n) => fitted('isoSides', () => {
  const nm = pickLetters(R, 3), k = r(R, 0, 2), u = unitOf(R);
  const b1 = nm[(k + 1) % 3]!, b2 = nm[(k + 2) % 3]!;
  const legA = sideName(nm, (k + 1) % 3), legB = sideName(nm, (k + 2) % 3), base = sideName(nm, k);
  const arcs: FMark[] = [{ ang: ang3(nm, (k + 1) % 3), n: 1 }, { ang: ang3(nm, (k + 2) % 3), n: 1 }];
  if (R() < 0.5) {
    const Lg = R() < 0.35 ? r(R, 9, 39) / 2 : r(R, 5, 20);
    let Bs = Lg;
    while (Math.abs(Bs - Lg) < 1) Bs = r(R, Math.ceil(0.5 * Lg), Math.floor(1.7 * Lg));
    const T = isoAt(R, isoTriSides(300, (300 * Bs) / Lg), k);
    const fig = triFig(T, nm, [...arcs, { seg: legA, text: `${fmt(Lg)} ${u}`, lone: true, col: 'first' }, { seg: base, text: `${fmt(Bs)} ${u}`, lone: true }, { seg: legB, text: '?', lone: true, col: 'link' }]);
    return numItem({
      id: `isoSides-${n}`, family: 'isoSides', unit: u,
      prompt: `In ${tri(nm)}, ${angN(b1)} ≅ ${angN(b2)}, ${legA} = ${fmt(Lg)} ${u} and ${base} = ${fmt(Bs)} ${u}. Find ${legB}.`, board: `${legB} = \\,?`,
      solution: [`${angN(b1)} ≅ ${angN(b2)}: equal angles face equal sides (the converse).`, `${angN(b1)} faces ${segN(legA)}; ${angN(b2)} faces ${segN(legB)}.`, `So ${legB} = ${legA} = ${fmt(Lg)} ${u}.`],
      picture: { fig, reveal: {} },
    }, Lg, [{ v: Bs, mc: MC.adjacent, say: `${segN(base)} runs between the two equal angles; the side that matches ${segN(legB)} is the one facing the other equal angle.` }], 'Right: the converse of the isosceles theorem.', 'Which side faces each of the equal angles?');
  }
  // expressions
  let a1 = 0, a2 = 0, x0 = 0, Lg = 0;
  do { a1 = r(R, 1, 5); a2 = r(R, 1, 5); x0 = r(R, 2, 9); Lg = r(R, 11, 40); } while (a1 === a2 || Lg === x0 || Lg - a1 * x0 < -20 || Lg - a2 * x0 < -20 || Lg - a1 * x0 === 0 && Lg - a2 * x0 === 0);
  const c1 = Lg - a1 * x0, c2 = Lg - a2 * x0;
  const Bs = r(R, Math.ceil(0.5 * Lg), Math.floor(1.6 * Lg));
  const T = isoAt(R, isoTriSides(300, (300 * Bs) / Lg), k);
  const askX = R() < 0.45;
  const fig = triFig(T, nm, [...arcs, { seg: legA, text: `(${lin(a1, c1)}) ${u}`, lone: true, col: 'first' }, { seg: legB, text: `(${lin(a2, c2)}) ${u}`, lone: true, col: 'first' }], { maxS: 2.6 });
  const big = a1 > a2 ? [a1, c1, a2, c2] : [a2, c2, a1, c1];
  return numItem({
    id: `isoSides-${n}`, family: 'isoSides', unit: askX ? '' : u,
    prompt: `In ${tri(nm)}, ${angN(b1)} ≅ ${angN(b2)}, ${legA} = (${lin(a1, c1)}) ${u} and ${legB} = (${lin(a2, c2)}) ${u}. ${askX ? 'Find x.' : `Find ${legB}.`}`, board: askX ? 'x = \\,?' : `${legB} = \\,?`,
    solution: [`${angN(b1)} ≅ ${angN(b2)}, so the sides facing them are equal: ${lin(a1, c1)} = ${lin(a2, c2)}.`, `${big[0]! - big[2]!}x = ${big[3]! - big[1]!}, so x = ${x0}.`, ...(askX ? [] : [`${legB} = ${a2} · ${x0} ${c2 < 0 ? '−' : '+'} ${Math.abs(c2)} = ${Lg} ${u}.`])],
    picture: { fig, reveal: {} },
  }, askX ? x0 : Lg, askX ? [{ v: Lg, say: `${Lg} is the length of the side; the question asks for x.` }] : [{ v: x0, mc: MC.reportsX, say: `x = ${x0}; now put it back in to get the side.` }], 'Right.', 'Equal angles face equal sides: set the two expressions equal.');
});

export const isoAlgebra: Gen = (R, n) => fitted('isoAlgebra', () => {
  const nm = pickLetters(R, 3), k = r(R, 0, 2);
  let a1 = 0, a2 = 0, x0 = 0, b = 0;
  do { a1 = r(R, 1, 5); a2 = r(R, 1, 5); x0 = r(R, 4, 18); b = r(R, 46, 76); } while (a1 === a2 || Math.abs(180 - 2 * b - 60) < 6 || x0 === b || x0 === 180 - 2 * b || b - a1 * x0 < -40 || b - a2 * x0 < -40);
  const c1 = b - a1 * x0, c2 = b - a2 * x0, v = 180 - 2 * b;
  const T = isoAt(R, isoTri(v, 300), k);
  const [l1, l2] = [sideName(nm, (k + 1) % 3), sideName(nm, (k + 2) % 3)];
  const ap = nm[k]!, b1 = nm[(k + 1) % 3]!, b2 = nm[(k + 2) % 3]!;
  const ask = pick(R, ['x', 'base', 'vertex'] as const);
  const fig = triFig(T, nm, [{ seg: l1, n: 1 }, { seg: l2, n: 1 }, { ang: ang3(nm, (k + 1) % 3), text: `(${lin(a1, c1)})°`, lone: true, col: 'first' }, { ang: ang3(nm, (k + 2) % 3), text: `(${lin(a2, c2)})°`, lone: true, col: 'first' }, ...(ask === 'vertex' ? [{ ang: ang3(nm, k), text: '?', lone: true, col: 'link' as const }] : [])], { maxS: 2.6 });
  const big = a1 > a2 ? [a1, c1, a2, c2] : [a2, c2, a1, c1];
  const q = ask === 'x' ? 'Find x.' : ask === 'base' ? `Find m${angN(b1)}.` : `Find m${angN(ap)}.`;
  const ans = ask === 'x' ? x0 : ask === 'base' ? b : v;
  const wrong = ask === 'x' ? [{ v: b, say: `${b}° is the angle; the question asks for x.` }]
    : ask === 'base' ? [{ v: x0, mc: MC.reportsX, say: `x = ${x0}; put it back in to get the angle.` }, { v, mc: MC.baseMis, say: `${v}° is the angle between the congruent sides.` }]
      : [{ v: x0, mc: MC.reportsX, say: `x = ${x0}; the question asks for an angle.` }, { v: b, mc: MC.baseMis, say: `${b}° is a base angle; the angle between the congruent sides is what is left of 180°.` }];
  return numItem({
    id: `isoAlgebra-${n}`, family: 'isoAlgebra', unit: ask === 'x' ? '' : '°',
    prompt: `In ${tri(nm)}, ${segN(l1)} ≅ ${segN(l2)}, m${angN(b1)} = (${lin(a1, c1)})° and m${angN(b2)} = (${lin(a2, c2)})°. ${q}`, board: ask === 'x' ? 'x = \\,?' : `m\\angle ${ask === 'base' ? b1 : ap} = \\,?`,
    solution: [`${segN(l1)} ≅ ${segN(l2)}, so the angles facing them are equal: ${lin(a1, c1)} = ${lin(a2, c2)}.`, `${big[0]! - big[2]!}x = ${big[3]! - big[1]!}, so x = ${x0}.`,
      ...(ask === 'x' ? [] : [`Each base angle: ${b}°.`]), ...(ask === 'vertex' ? [`m${angN(ap)} = 180° − ${b}° − ${b}° = ${v}°.`] : [])],
    picture: { fig, reveal: {} },
  }, ans, wrong, 'Right.', 'The angles facing the congruent sides are equal: set the expressions equal.');
});

// =============== s2-triangle-inequality-range ===============
/** two given sides and the triangle drawn with its third side at the middle of the range */
function rangeSetup(R: () => number, o: { dec?: boolean; minLo?: number } = {}): { a: number; b: number; lo: number; hi: number; u: string; nm: string; T: Tri } {
  for (;;) {
    const dec = o.dec ?? R() < 0.3;
    const a = dec ? r(R, 25, 180) / 10 : r(R, 3, 24), b = dec && R() < 0.5 ? r(R, 25, 180) / 10 : r(R, 3, 24);
    const { lo, hi } = thirdRange(a, b);
    if (lo < (o.minLo ?? 1) || Math.abs(a - b) < 0.5) continue;
    const mid = (lo + hi) / 2, s = 360 / Math.max(a, b, mid);
    const T = turnT(triSSS(mid * s, a * s, b * s), r(R, -30, 30));
    return { a, b, lo, hi, u: R() < 0.5 ? 'in' : 'cm', nm: pickLetters(R, 3), T };
  }
}
const stripOf = (lo: number, hi: number, whole = false): StripSpec => {
  const pad = Math.max(2, Math.ceil(hi * 0.12));
  return { lo, hi, max: Math.ceil(hi + pad), whole, name: 'x' };
};
function rangeFig(S: ReturnType<typeof rangeSetup>, xText = 'x') {
  return triFig(S.T, S.nm, [{ seg: sideName(S.nm, 1), text: `${fmt(S.a)} ${S.u}`, lone: true, col: 'first' }, { seg: sideName(S.nm, 2), text: `${fmt(S.b)} ${S.u}`, lone: true, col: 'first' }, { seg: sideName(S.nm, 0), text: xText, lone: true, col: 'link' }]);
}
const rangeSol = (S: { a: number; b: number; lo: number; hi: number }) => {
  const [mn, mx] = S.a < S.b ? [S.a, S.b] : [S.b, S.a];
  return [`The third side is shorter than the other two together: x < ${fmt(S.a)} + ${fmt(S.b)} = ${fmt(S.hi)}.`, `The longer given side is shorter than the other two together: ${fmt(mx)} < ${fmt(mn)} + x, so x > ${fmt(mx)} − ${fmt(mn)} = ${fmt(S.lo)}.`, 'Both ends are excluded: there the three sides would lie flat on one line.'];
};
export const rangePair: Gen = (R, n) => fitted('rangePair', () => {
  const S = rangeSetup(R);
  const [mn, mx] = S.a < S.b ? [S.a, S.b] : [S.b, S.a];
  return pairItem({
    id: `rangePair-${n}`, family: 'rangePair',
    prompt: `Two sides of a triangle are ${fmt(S.a)} ${S.u} and ${fmt(S.b)} ${S.u}. The third side is x ${S.u}. Between which two numbers must x lie?`, board: '?\\ < x < \\ ?',
    solution: rangeSol(S),
    picture: { fig: rangeFig(S), strip: stripOf(S.lo, S.hi), reveal: {} },
  }, S.lo, S.hi, {
    unit: S.u, right: 'Right: both ends excluded.', general: 'The third side must be less than the sum of the other two and more than their difference.',
    wrong: [
      { x: 0, y: S.hi, mc: MC.upperOnly, say: `The upper bound is right. There is a lower bound too: x must beat ${fmt(mx)} − ${fmt(mn)} = ${fmt(S.lo)}, or the two shorter sides cannot reach.` },
      { x: mn, y: mx, say: 'Those are the two given sides. The third side can be shorter than both or longer than both: use the difference and the sum.' },
    ],
  });
});

export const rangeCount: Gen = (R, n) => fitted('rangeCount', () => {
  const S = rangeSetup(R, { dec: R() < 0.25, minLo: 3 });
  const W = wholeIn(S.lo, S.hi), cnt = W.length;
  const intEnds = Number.isInteger(S.lo) && Number.isInteger(S.hi);
  const wrong = intEnds
    ? [{ v: cnt + 2, mc: MC.degenerate, say: `${fmt(S.lo)} and ${fmt(S.hi)} themselves are out: there the sides lie flat.` }, { v: S.hi - 1, mc: MC.upperOnly, say: `Lengths up to ${fmt(S.lo)} are too short: the two shorter sides could not reach.` }, { v: cnt + 1, mc: MC.degenerate, say: 'Both endpoints are excluded, not just one.' }]
    : [{ v: Math.floor(S.hi), mc: MC.upperOnly, say: `Lengths up to ${fmt(S.lo)} are too short.` }];
  const picture: TIPicture = { fig: rangeFig(S), strip: stripOf(S.lo, S.hi, true), reveal: {} };
  return numItem({
    id: `rangeCount-${n}`, family: 'rangeCount', unit: 'lengths',
    prompt: `Two sides of a triangle are ${fmt(S.a)} ${S.u} and ${fmt(S.b)} ${S.u}. How many whole-number lengths (in ${S.u}) are possible for the third side?`, board: `${fmt(S.a)},\\ ${fmt(S.b)},\\ x`,
    solution: [...rangeSol(S).slice(0, 2), `Whole numbers strictly between ${fmt(S.lo)} and ${fmt(S.hi)}: ${W[0]}, …, ${W[W.length - 1]}.`, `That is ${cnt} lengths.`],
    picture,
  }, cnt, wrong, 'Right.', 'Count the whole numbers strictly between the difference and the sum.');
});

export const rangePick: Gen = (R, n) => fitted('rangePick', () => {
  const S = rangeSetup(R, { dec: false, minLo: 2 });
  const [mn, mx] = S.a < S.b ? [S.a, S.b] : [S.b, S.a];
  const base = { id: `rangePick-${n}`, family: 'rangePick', solution: rangeSol(S), picture: { fig: rangeFig(S), strip: stripOf(S.lo, S.hi), reveal: {} } };
  if (R() < 0.5) {
    const inside = r(R, S.lo + 1, S.hi - 1), end = pick(R, [S.lo, S.hi]), below = r(R, 1, S.lo - 1), above = S.hi + r(R, 1, 4);
    const opts: Opt[] = [
      { t: `${inside} ${S.u}`, ok: true, say: `Right: ${fmt(S.lo)} < ${inside} < ${fmt(S.hi)}.` },
      { t: `${end} ${S.u}`, mc: MC.degenerate, say: `At exactly ${end} the three sides lie flat: no triangle.` },
      { t: `${below} ${S.u}`, mc: MC.upperOnly, say: `Too short: ${fmt(mn)} + ${below} does not reach ${fmt(mx)}.` },
      { t: `${above} ${S.u}`, say: `Too long: ${fmt(S.a)} + ${fmt(S.b)} = ${fmt(S.hi)} cannot reach across ${above}.` },
    ];
    return choiceItem(R, { ...base, prompt: `Two sides of a triangle are ${fmt(S.a)} ${S.u} and ${fmt(S.b)} ${S.u}. Which length could the third side be?`, board: `${fmt(S.a)},\\ ${fmt(S.b)},\\ ?` }, opts);
  }
  return choiceItem(R, { ...base, prompt: `Two sides of a triangle are ${fmt(S.a)} ${S.u} and ${fmt(S.b)} ${S.u}. Which statement gives every possible length x of the third side?`, board: `${fmt(S.a)},\\ ${fmt(S.b)},\\ x` }, [
    { t: `${fmt(S.lo)} < x < ${fmt(S.hi)}`, ok: true, say: 'Right: more than the difference, less than the sum.' },
    { t: `x < ${fmt(S.hi)}`, mc: MC.upperOnly, say: `A third side of 1 ${S.u} could not close the gap: x must be more than ${fmt(S.lo)} too.` },
    { t: `${fmt(S.lo)} ≤ x ≤ ${fmt(S.hi)}`, mc: MC.degenerate, say: 'At the ends the sides lie flat: both ends are excluded.' },
    { t: `${fmt(mn)} < x < ${fmt(mx)}`, say: 'The third side can be shorter than both given sides or longer than both: use the difference and the sum.' },
  ]);
});
