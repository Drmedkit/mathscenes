// famA.ts: stage 1 and 2 families of "Distance, midpoint and coordinate proofs": distance as Pythagoras, segment
// words, exact comparison, midpoints and missing endpoints, a shared midpoint, zero and undefined slope, the slope
// criteria and the horizontal-vertical case, fluent distance and midpoint, partition and weighted averages, line pairs,
// sides and diagonals. Every point is drawn exactly at its stated coordinates; the answer (a midpoint, a line, the leg
// lengths) is in the picture's `reveal` layer and only comes in at the solve.
import { type V, add, along, cross, d2, isSq, lineRel as relOf, mid, mul, near, negRecip, q, qEq, qT, qv, rad, radT, slope, sub, type Q } from './cg';
import { type Base, type CItem, type DPt, type Gen, type Layer, type Opt, MC, A as Am, S, ans, choice, endPt, fmt, fmtT, int, ipt, minus, nz, par, pickOf, plane, point, pt, ptN, ptNT, radItem, retry, Reroll, sq, two, num } from './ckit';

const P = (key: string, at: V, name?: string, col?: DPt['col']): DPt => ({ key, at, name: name ?? key, col });
const vk = (v: V) => `${fmt(v[0])},${fmt(v[1])}`;
/** "So AB = √40 = {ANS}." (the radical shown first only when it simplifies) */
const lenLine = (nm: string, n: number) => { const { k, r } = rad(n); return `So ${nm} = ${(k === 1 && r !== 1) ? '' : `√${fmt(n)} = `}{ANS}.`; };
const absd = (x: number) => fmt(Math.abs(x));

// ===================== distance-as-pythagoras =====================
/** two points; the dashed legs of the right triangle under the segment (when it is oblique) */
function legs(Ap: V, Bp: V, nmA: string, nmB: string): Layer {
  const C: V = [Bp[0], Ap[1]];
  const oblique = !near(Ap[0], Bp[0]) && !near(Ap[1], Bp[1]);
  return {
    pts: [P('a', Ap, nmA), P('b', Bp, nmB)],
    segs: [{ key: 'ab', a: Ap, b: Bp, col: 'link' }, ...(oblique ? [{ key: 'run', a: Ap, b: C, col: 'first' as const, dash: true }, { key: 'rise', a: C, b: Bp, col: 'second' as const, dash: true }] : [])],
  };
}
function legTexts(Ap: V, Bp: V): Layer {
  const C: V = [Bp[0], Ap[1]], run = Bp[0] - Ap[0], rise = Bp[1] - Ap[1];
  return { texts: [
    { key: 'trun', at: [(Ap[0] + C[0]) / 2, Ap[1] - Math.sign(rise || 1) * 0.8], text: absd(run), col: 'first' },
    { key: 'trise', at: [C[0] + Math.sign(run || 1) * 0.9, (C[1] + Bp[1]) / 2], text: absd(rise), col: 'second' },
  ] };
}
const TRIPLES: V[] = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [8, 15]];
export const distTri: Gen = (R, n) => retry(() => {
  const [a, b] = two(R), c = n % 4;
  const Ap = ipt(R, c === 3 ? -8 : -4, c === 3 ? 2 : 4);
  let dv: V;
  if (c === 0) dv = R() < 0.5 ? [nz(R, -9, 9), 0] : [0, nz(R, -9, 9)];
  else if (c === 1) { const t = pickOf(R, TRIPLES.filter(x => x[0] <= 8 && x[1] <= 8)); dv = [t[0] * (R() < 0.5 ? -1 : 1), t[1] * (R() < 0.5 ? -1 : 1)]; }
  else { dv = [nz(R, -7, 7), nz(R, -7, 7)]; if (isSq(dv[0] ** 2 + dv[1] ** 2)) throw new Reroll(); }
  const Bp = add(Ap, dv);
  if (c === 3 && Ap[0] >= 0 && Bp[0] >= 0 && Ap[1] >= 0 && Bp[1] >= 0) throw new Reroll();
  const n2 = dv[0] ** 2 + dv[1] ** 2, nm = a + b;
  const axisCase = dv[0] === 0 || dv[1] === 0;
  const base = {
    id: `distTri-${n}`, family: 'distTri',
    prompt: axisCase ? `${ptN(a, Ap)} and ${ptN(b, Bp)} lie on a ${dv[0] === 0 ? 'vertical' : 'horizontal'} line. How long is ${nm}?`
      : `The dashed legs make a right triangle with hypotenuse ${nm}. Find ${nm} exactly, in simplest radical form.`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`,
    picture: { plane: plane(legs(Ap, Bp, a, b), axisCase ? undefined : legTexts(Ap, Bp)) },
    solution: axisCase ? [
      `Only the ${dv[0] === 0 ? 'y' : 'x'}-coordinates change: ${dv[0] === 0 ? minus(Bp[1], Ap[1]) : minus(Bp[0], Ap[0])} = ${fmt(dv[0] || dv[1])}.`,
      `A length is never negative: take the absolute value. So ${nm} = ${ans(absd(dv[0] || dv[1]))}.`,
    ] : [
      `Run (amber leg) = ${minus(Bp[0], Ap[0])} = ${fmt(dv[0])}; rise (teal leg) = ${minus(Bp[1], Ap[1])} = ${fmt(dv[1])}.`,
      `Pythagoras: ${nm}² = ${sq(dv[0])} + ${sq(dv[1])} = ${dv[0] ** 2} + ${dv[1] ** 2} = ${n2}.`,
      lenLine(nm, n2),
    ],
  };
  if (axisCase) {
    const d = Math.abs(dv[0] || dv[1]), signed = dv[0] || dv[1];
    const slips: { v: number; mc?: string; say: string }[] = [{ v: Math.abs(dv[0] === 0 ? Ap[0] : Ap[1]), mc: MC.shared, say: 'That is the coordinate the two points share. Subtract the coordinates that change.' }];
    if (signed < 0) slips.push({ v: signed, mc: MC.negDist, say: 'A length is never negative: the distance is the absolute value of the difference.' });
    return num(base, d, `Right: ${nm} = ${d}. On a horizontal or vertical segment the distance is the absolute value of one difference.`, slips,
      `Subtract the coordinates that change and take the absolute value.`);
  }
  const L = Math.abs(dv[0]) + Math.abs(dv[1]);
  return radItem(base, n2, `Right: ${nm}² = ${n2}, so ${nm} = ${radT(n2)}.`, [
    { n: L * L, mc: MC.adds, say: `The legs meet at a right angle, so they do not add end to end: square them, add, then take the square root.` },
  ], `Square the run and the rise, add them, take the square root, and simplify.`);
});

export const distLegs: Gen = (R, n) => retry(() => {
  const [a, b] = two(R), Ap = ipt(R, -6, 4);
  const dv: V = [nz(R, -7, 7), nz(R, -7, 7)], Bp = add(Ap, dv), nm = a + b;
  const n2 = dv[0] ** 2 + dv[1] ** 2, key = (v: number) => v.toFixed(6);
  const ds = (Bp[0] ** 2 - Ap[0] ** 2) + (Bp[1] ** 2 - Ap[1] ** 2);
  const opts: Opt[] = [
    { t: `√(${sq(dv[0])} + ${sq(dv[1])})`, ok: true, key: key(Math.sqrt(n2)), say: `Right: the run and the rise are the legs, ${nm} is the hypotenuse.` },
    { t: `${absd(dv[0])} + ${absd(dv[1])}`, mc: MC.adds, key: key(Math.abs(dv[0]) + Math.abs(dv[1])), say: 'The legs meet at a right angle: they do not add end to end. Square, add, then take the root.' },
    { t: `√(${sq(dv[0])}) + √(${sq(dv[1])})`, mc: MC.rootSum, key: key(Math.abs(dv[0]) + Math.abs(dv[1]) + 1e-3), say: 'A square root does not split over a sum: √(a + b) is not √a + √b.' },
    ...(ds > 0 ? [{ t: `√(${sq(Bp[0])} − ${sq(Ap[0])} + ${sq(Bp[1])} − ${sq(Ap[1])})`, mc: MC.diffSq, key: key(Math.sqrt(ds)), say: 'Subtract first, then square: (x₂ − x₁)², not x₂² − x₁².' }] : []),
  ];
  return choice(R, {
    id: `distLegs-${n}`, family: 'distLegs', prompt: `Which expression gives the length of ${nm}, for ${ptN(a, Ap)} and ${ptN(b, Bp)}?`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`, picture: { plane: plane(legs(Ap, Bp, a, b), legTexts(Ap, Bp)) },
    solution: [`The run is ${fmt(dv[0])} and the rise is ${fmt(dv[1])}: the legs of a right triangle.`, `${nm} is the hypotenuse, so ${nm} = √(run² + rise²).`],
  }, opts, { max: 3 });
});

// ===================== segment-vocabulary =====================
export const vocabMid: Gen = (R, n) => retry(() => {
  const [a, b] = two(R, 'M'), m = 'M', Ap = ipt(R, -6, 2);
  const c = n % 3, u: V = [nz(R, -3, 3), int(R, -3, 3)], g = c === 2 ? 4 : 2 * int(R, 1, 2);
  const Bp = add(Ap, mul(u, g)), Mid = mid(Ap, Bp);
  let Mp: V;
  if (c === 0) Mp = Mid;
  else if (c === 1) Mp = add(Mid, mul([-u[1], u[0]], pickOf(R, [1, -1, 2, -2])));
  else { Mp = add(Ap, mul(u, pickOf(R, [1, 3]))); }
  if (same2(Mp, Ap) || same2(Mp, Bp)) throw new Reroll();
  const ma = d2(Mp, Ap), mb = d2(Mp, Bp), onSeg = near(cross(sub(Bp, Ap), sub(Mp, Ap)), 0);
  const opts: Opt[] = [
    { t: `${m} is the midpoint of ${a}${b}`, ok: c === 0, mc: c === 1 ? MC.looseMid : c === 2 ? MC.onSegMid : undefined, say: c === 0 ? `Right: ${m} is on ${a}${b} and ${m}${a} = ${m}${b}.` : c === 1 ? `${m}${a} = ${m}${b}, but ${m} is not on ${a}${b}: a midpoint must lie on the segment.` : `${m} is on ${a}${b}, but ${m}${a}² = ${ma} and ${m}${b}² = ${mb}: the two parts are not congruent.` },
    { t: `${m} is not the midpoint: it is not on ${a}${b}`, ok: c === 1, say: c === 1 ? `Right: ${m} is the same distance from ${a} and ${b}, but it is off the segment.` : `${m} does lie on ${a}${b}: ${a}, ${m} and ${b} are on one line, with ${m} between them.` },
    { t: `${m} is not the midpoint: ${m}${a} and ${m}${b} differ`, ok: c === 2, say: c === 2 ? `Right: ${m}${a}² = ${ma} but ${m}${b}² = ${mb}.` : `${m}${a}² = ${m}${b}² = ${ma}: the distances are equal.` },
  ];
  void onSeg;
  return choice(R, {
    id: `vocabMid-${n}`, family: 'vocabMid', prompt: `${ptN(a, Ap)}, ${ptN(b, Bp)} and ${ptN(m, Mp)}. Which is true?`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)} \\quad ${ptNT(m, Mp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b), P('m', Mp, m, 'pick')], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'link' }] }) },
    solution: [`A midpoint lies on the segment and splits it into two congruent parts.`, `${m}${a}² = ${ma}, ${m}${b}² = ${mb}; ${m} is ${onSeg ? '' : 'not '}on ${a}${b}.`],
  }, opts, { keep: true });
});
const same2 = (p: V, r: V) => near(p[0], r[0]) && near(p[1], r[1]);

export const vocabBisect: Gen = (R, n) => retry(() => {
  const Mx = ipt(R, -3, 3), u: V = [nz(R, -3, 3), int(R, -3, 3)], v: V = [int(R, -3, 3), nz(R, -3, 3)];
  if (near(cross(u, v), 0)) throw new Reroll();
  const c = n % 4, abBis = c === 0 || c === 1, cdBis = c === 0 || c === 2;
  const k1 = abBis ? 1 : 2, k2 = cdBis ? 1 : 2;
  const Ap = add(Mx, u), Bp = sub(Mx, mul(u, k1)), Cp = add(Mx, v), Dp = sub(Mx, mul(v, k2));
  const truth = c === 0 ? 'each' : c === 1 ? 'cdab' : c === 2 ? 'abcd' : 'none';
  const opts: Opt[] = [
    { t: 'CD bisects AB, but AB does not bisect CD', ok: truth === 'cdab', key: 'cdab', say: truth === 'cdab' ? 'Right: CD passes through the midpoint of AB, but AB misses the midpoint of CD.' : 'Check each midpoint: is the midpoint of AB on CD? Is the midpoint of CD on AB?' },
    { t: 'AB bisects CD, but CD does not bisect AB', ok: truth === 'abcd', key: 'abcd', say: truth === 'abcd' ? 'Right: AB passes through the midpoint of CD only.' : 'Check each midpoint: is the midpoint of AB on CD? Is the midpoint of CD on AB?' },
    { t: 'AB and CD bisect each other', ok: truth === 'each', key: 'each', mc: truth === 'none' ? undefined : MC.recipBis, say: truth === 'each' ? 'Right: they cross at the midpoint of each.' : 'Bisecting goes one way at a time: one segment can pass through the other one\'s midpoint without the reverse.' },
    { t: 'Neither bisects the other', ok: truth === 'none', key: 'none', say: truth === 'none' ? 'Right: they cross, but not at either midpoint.' : 'They cross at a midpoint: find the midpoint of each segment.' },
  ];
  return choice(R, {
    id: `vocabBisect-${n}`, family: 'vocabBisect', prompt: `${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}, ${ptN('D', Dp)}. Segments AB and CD cross. Which is true?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\\\ ${ptNT('C', Cp)} \\quad ${ptNT('D', Dp)}`,
    picture: { plane: plane({ pts: [P('A', Ap), P('B', Bp), P('C', Cp, 'C', 'second'), P('D', Dp, 'D', 'second')], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }, { key: 'cd', a: Cp, b: Dp, col: 'second' }] }) },
    solution: [`Midpoint of AB = ${pt(mid(Ap, Bp))}; midpoint of CD = ${pt(mid(Cp, Dp))}.`, `They cross at ${pt(Mx)}. A segment bisects another when it passes through the other one's midpoint.`],
  }, opts, { max: 3 });
});

// ===================== exact-length-comparison =====================
const VECS: V[] = []; for (let x = -8; x <= 8; x++) for (let y = -8; y <= 8; y++) if (x || y) VECS.push([x, y]);
const byN = new Map<number, V[]>(); for (const v of VECS) { const k = v[0] ** 2 + v[1] ** 2; byN.set(k, [...(byN.get(k) ?? []), v]); }
const away = (x: number) => Math.abs((x % 1) - 0.5) > 0.08;
/** squared lengths n and n + d (d = 1..3) whose lengths round to the same whole number (no .5 ties), both reachable */
const TRAPS: [number, number][] = [...byN.keys()].flatMap(k => [1, 2, 3].filter(d => byN.has(k + d) && !isSq(k) && !isSq(k + d) && k >= 10 && Math.round(Math.sqrt(k)) === Math.round(Math.sqrt(k + d)) && away(Math.sqrt(k)) && away(Math.sqrt(k + d))).map(d => [k, d] as [number, number]));
const EQUALS = [...byN.entries()].filter(([, vs]) => vs.some(v => vs.some(w => !near(Math.abs(v[0]), Math.abs(w[0])) && !near(Math.abs(v[0]), Math.abs(w[1]))))).map(([k]) => k);
function twoSegs(R: () => number, n1: number, n2: number): { Ap: V; Bp: V; Cp: V; Dp: V } {
  const u = pickOf(R, byN.get(n1)!), v = pickOf(R, byN.get(n2)!.filter(w => !(Math.abs(w[0]) === Math.abs(u[0]) && Math.abs(w[1]) === Math.abs(u[1])) || n1 !== n2));
  const Ap = ipt(R, -8, -2), Cp: V = [int(R, 0, 4), int(R, -8, 0)];
  return { Ap, Bp: add(Ap, u), Cp, Dp: add(Cp, v) };
}
export const congExact: Gen = (R, n) => retry(() => {
  const c = n % 3;
  const tp = pickOf(R, TRAPS), n1 = c === 2 ? tp[0] : pickOf(R, EQUALS.filter(k => (c === 0) === isSq(k) && k >= 10 && k <= 80));
  const n2 = c === 2 ? n1 + tp[1] : n1, flip = R() < 0.5;
  const { Ap, Bp, Cp, Dp } = twoSegs(R, flip ? n2 : n1, flip ? n1 : n2);
  const ab = d2(Ap, Bp), cd = d2(Cp, Dp), eq = ab === cd, r1 = Math.round(Math.sqrt(ab));
  const opts: Opt[] = [
    { t: 'Congruent: AB² = CD²', ok: eq, say: eq ? `Right: AB² = CD² = ${ab}, so the lengths are equal.` : `AB² = ${ab} but CD² = ${cd}: not equal.` },
    { t: 'Not congruent: AB² ≠ CD²', ok: !eq, say: !eq ? `Right: AB² = ${ab} and CD² = ${cd}. Exact squares differ, so the lengths differ.` : `AB² = ${ab} and CD² = ${cd}: equal.` },
    c === 2 ? { t: `Congruent: both round to ${fmt(r1)}`, mc: MC.rounding, say: `Both round to ${fmt(r1)}, but AB² = ${ab} and CD² = ${cd}. Rounding hides the difference.` }
      : { t: 'Can\'t tell until the square roots are written as decimals', mc: MC.decRad, say: 'Compare the exact squared lengths: equal squares (never negative) mean equal lengths.' },
  ];
  return choice(R, {
    id: `congExact-${n}`, family: 'congExact', prompt: `${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}, ${ptN('D', Dp)}. Are AB and CD congruent?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\\\ ${ptNT('C', Cp)} \\quad ${ptNT('D', Dp)}`,
    picture: { plane: plane({ pts: [P('A', Ap), P('B', Bp), P('C', Cp, 'C', 'second'), P('D', Dp, 'D', 'second')], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }, { key: 'cd', a: Cp, b: Dp, col: 'second' }] }) },
    solution: [`AB² = ${sq(Bp[0] - Ap[0])} + ${sq(Bp[1] - Ap[1])} = ${ab}.`, `CD² = ${sq(Dp[0] - Cp[0])} + ${sq(Dp[1] - Cp[1])} = ${cd}.`],
  }, opts, { keep: true });
});
export const whichLonger: Gen = (R, n) => retry(() => {
  const c = n % 3;
  const tp = pickOf(R, TRAPS), n1 = c === 0 ? pickOf(R, EQUALS.filter(k => k >= 10 && k <= 80)) : tp[0];
  const pairN = c === 0 ? [n1, n1] : c === 1 ? [n1 + tp[1], n1] : [n1, n1 + tp[1]];
  const [x, y] = [pairN[0]!, pairN[1]!], [a, b] = two(R), [cc, dd] = (['J', 'K'].includes(a) ? ['M', 'N'] : ['J', 'K']);
  const { Ap, Bp, Cp, Dp } = twoSegs(R, x, y);
  const s1 = d2(Ap, Bp), s2 = d2(Cp, Dp);
  const truth = s1 === s2 ? 'eq' : s1 > s2 ? 'ab' : 'cd';
  const opts: Opt[] = [
    { t: `${a}${b} is longer`, ok: truth === 'ab', key: 'ab', say: truth === 'ab' ? `Right: ${a}${b}² = ${s1} is more than ${cc}${dd}² = ${s2}.` : `${a}${b}² = ${s1} and ${cc}${dd}² = ${s2}.` },
    { t: `${cc}${dd} is longer`, ok: truth === 'cd', key: 'cd', say: truth === 'cd' ? `Right: ${cc}${dd}² = ${s2} is more than ${a}${b}² = ${s1}.` : `${a}${b}² = ${s1} and ${cc}${dd}² = ${s2}.` },
    { t: 'They are congruent', ok: truth === 'eq', key: 'eq', mc: truth === 'eq' ? undefined : MC.rounding, say: truth === 'eq' ? `Right: both squared lengths are ${s1}.` : `They round to the same whole number, but ${s1} and ${s2} are not equal.` },
  ];
  return choice(R, {
    id: `whichLonger-${n}`, family: 'whichLonger', prompt: `Compare ${a}${b} and ${cc}${dd} exactly: ${ptN(a, Ap)}, ${ptN(b, Bp)}, ${ptN(cc, Cp)}, ${ptN(dd, Dp)}.`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)} \\\\ ${ptNT(cc, Cp)} \\quad ${ptNT(dd, Dp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b), P('c', Cp, cc, 'second'), P('d', Dp, dd, 'second')], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }, { key: 'cd', a: Cp, b: Dp, col: 'second' }] }) },
    solution: [`${a}${b}² = ${sq(Bp[0] - Ap[0])} + ${sq(Bp[1] - Ap[1])} = ${s1}.`, `${cc}${dd}² = ${sq(Dp[0] - Cp[0])} + ${sq(Dp[1] - Cp[1])} = ${s2}. Compare the squares: no rounding.`],
  }, opts, { keep: true });
});

// ===================== midpoint-as-average / midpoint-fluent =====================
function midSlips(Ap: V, Bp: V): { at: V; mc: string; say: string }[] {
  return [
    { at: [(Bp[0] - Ap[0]) / 2, (Bp[1] - Ap[1]) / 2], mc: MC.halfDiff, say: 'That is half the difference: how far the midpoint is from the first point. Average the coordinates instead: add, then halve.' },
    { at: [Ap[0] + Bp[0] / 2, Ap[1] + Bp[1] / 2], mc: MC.halfOne, say: 'Halve the whole sum, (x₁ + x₂)/2, not just the second coordinate.' },
    { at: [(Ap[0] + Ap[1]) / 2, (Bp[0] + Bp[1]) / 2], mc: MC.onePoint, say: 'Average the two x-coordinates, then the two y-coordinates (not the x and y of one point).' },
  ];
}
const midLines = (Ap: V, Bp: V, nm: string, Mp: V) => [
  `Halfway in x: (${fmt(Ap[0])} + ${par(Bp[0])})/2 = ${fmt(Ap[0] + Bp[0])}/2 = ${fmt(Mp[0])}.`,
  `Halfway in y: (${fmt(Ap[1])} + ${par(Bp[1])})/2 = ${fmt(Ap[1] + Bp[1])}/2 = ${fmt(Mp[1])}.`,
  endPt(nm, Mp),
];
function midItem(R: () => number, n: number, fam: string, sg: string | undefined): CItem {
  return retry(() => {
    const [a, b] = two(R, 'M'), c = n % 4;
    const half = sg === 'midpoint-fluent' && R() < 0.6;
    let Ap: V = ipt(R, -8, 6), Bp: V = ipt(R, -8, 6);
    if (c === 0 && sg !== 'midpoint-fluent') { if (R() < 0.5) Bp = [Bp[0], Ap[1]]; else Bp = [Ap[0], Bp[1]]; if ((Ap[0] + Bp[0]) % 2 || (Ap[1] + Bp[1]) % 2) throw new Reroll(); }
    if (half) { Ap = [Ap[0] + 0.5, Ap[1]]; Bp = [Bp[0], Bp[1] - 0.5]; }
    if (c === 2 && !(Ap[0] < 0 || Ap[1] < 0) && !(Bp[0] < 0 || Bp[1] < 0)) throw new Reroll();
    if (same2(Ap, Bp) || d2(Ap, Bp) < 9) throw new Reroll();
    const Mp = mid(Ap, Bp);
    if (same2(Mp, Ap)) throw new Reroll();
    return point({
      id: `${fam}-${n}`, family: fam, prompt: `Find the midpoint M of ${a}${b}, for ${ptN(a, Ap)} and ${ptN(b, Bp)}.`,
      board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`,
      picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }] }, { pts: [P('m', Mp, 'M', 'link')] }) },
      solution: midLines(Ap, Bp, 'M', Mp),
    }, 'M', Mp, `Right: M = ${pt(Mp)}, halfway in x and halfway in y.`, midSlips(Ap, Bp), 'Average each coordinate: add the two x-coordinates and halve, then the two y-coordinates.');
  });
}
export const midPt: Gen = (R, n, sg) => midItem(R, n, 'midPt', sg);

export const midWhich: Gen = (R, n) => retry(() => {
  const [a, b] = two(R, 'M'), Ap = ipt(R, -7, 5), Bp = ipt(R, -7, 5);
  if (same2(Ap, Bp)) throw new Reroll();
  const Mp = mid(Ap, Bp), u = sub(Bp, Ap);
  const off = add(Mp, [-u[1] / 2, u[0] / 2]);
  const opts: Opt[] = [
    { t: pt(Mp), ok: true, key: vk(Mp), say: `Right: halfway in x and halfway in y.` },
    { t: pt([(Bp[0] - Ap[0]) / 2, (Bp[1] - Ap[1]) / 2]), key: vk([(Bp[0] - Ap[0]) / 2, (Bp[1] - Ap[1]) / 2]), mc: MC.halfDiff, say: 'That is half the difference only. Add the coordinates, then halve.' },
    { t: pt(off), key: vk(off), mc: MC.looseMid, say: `That point is the same distance from ${a} and ${b}, but it is not on ${a}${b}.` },
    { t: pt([Ap[0] + Bp[0] / 2, Ap[1] + Bp[1] / 2]), key: vk([Ap[0] + Bp[0] / 2, Ap[1] + Bp[1] / 2]), mc: MC.halfOne, say: 'Halve the whole sum, not just the second coordinate.' },
  ];
  return choice(R, {
    id: `midWhich-${n}`, family: 'midWhich', prompt: `Which point is the midpoint of ${a}${b}, for ${ptN(a, Ap)} and ${ptN(b, Bp)}?`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }] }, { pts: [P('m', Mp, 'M', 'link')] }) },
    solution: midLines(Ap, Bp, 'M', Mp).slice(0, 2),
  }, opts, { max: 3 });
});

// ===================== missing-endpoint =====================
function endItem(R: () => number, n: number, fam: string, sg: string | undefined): CItem {
  return retry(() => {
    const [a, b] = two(R, 'M'), c = n % 4;
    let Ap = ipt(R, -6, 6), Mp = ipt(R, -5, 5);
    if (c === 1) { Ap = [int(R, 1, 6), int(R, 1, 6)]; Mp = [int(R, -5, -1), int(R, -5, 0)]; }
    if (c === 2 || (sg === 'midpoint-fluent' && R() < 0.5)) Mp = [Mp[0] + 0.5, Mp[1] - 0.5];
    const Bp = sub(mul(Mp, 2), Ap);
    if (same2(Ap, Mp) || Math.max(...Bp.map(Math.abs)) > 12) throw new Reroll();
    return point({
      id: `${fam}-${n}`, family: fam, prompt: `M is the midpoint of ${a}${b}. ${ptN(a, Ap)} and ${ptN('M', Mp)}. Find ${b}.`,
      board: `${ptNT(a, Ap)} \\quad ${ptNT('M', Mp)}`,
      picture: { plane: plane({ pts: [P('a', Ap, a), P('m', Mp, 'M', 'pick')], segs: [{ key: 'am', a: Ap, b: Mp, col: 'first' }] }, { pts: [P('b', Bp, b, 'link')], segs: [{ key: 'mb', a: Mp, b: Bp, col: 'link', dash: true }] }) },
      solution: [
        `M is the average, so ${b} is as far past M as ${a} is before it: ${b} = 2M − ${a}.`,
        `x: 2 × ${par(Mp[0])} − ${par(Ap[0])} = ${fmt(Bp[0])}; y: 2 × ${par(Mp[1])} − ${par(Ap[1])} = ${fmt(Bp[1])}.`,
        `Check: the average of ${a} and ${pt(Bp)} is ${pt(mid(Ap, Bp))}. ${endPt(b, Bp)}`,
      ],
    }, b, Bp, `Right: ${b} = ${pt(Bp)}. Averaging ${a} and ${b} gives back M.`, [
      { at: mid(Ap, Mp), mc: MC.endAvg, say: `That is the midpoint of ${a}M. M is already halfway: ${b} lies as far beyond M as ${a} is before it.` },
      { at: add(Mp, mul(sub(Mp, Ap), 0.5)), mc: MC.endHalves, say: `Undo an average by doubling, not halving: ${b} = 2M − ${a}.` },
      { at: sub(mul(Ap, 2), Mp), say: `That goes the wrong way: start at M and step as far again as from ${a} to M.` },
    ], `${b} = 2M − ${a}: double each coordinate of M and subtract ${a}'s.`);
  });
}
export const missEnd: Gen = (R, n, sg) => endItem(R, n, 'missEnd', sg);
export const missEndPick: Gen = (R, n) => retry(() => {
  const [a, b] = two(R, 'M'), Ap = ipt(R, -6, 6), Mp = ipt(R, -5, 5), Bp = sub(mul(Mp, 2), Ap);
  if (same2(Ap, Mp) || Math.max(...Bp.map(Math.abs)) > 12) throw new Reroll();
  const w1 = mid(Ap, Mp), w2 = add(Mp, mul(sub(Mp, Ap), 0.5)), w3 = sub(mul(Ap, 2), Mp);
  return choice(R, {
    id: `missEndPick-${n}`, family: 'missEndPick', prompt: `M is the midpoint of ${a}${b}, with ${ptN(a, Ap)} and ${ptN('M', Mp)}. Which point is ${b}?`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT('M', Mp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('m', Mp, 'M', 'pick')], segs: [{ key: 'am', a: Ap, b: Mp, col: 'first' }] }, { pts: [P('b', Bp, b, 'link')], segs: [{ key: 'mb', a: Mp, b: Bp, col: 'link', dash: true }] }) },
    solution: [`${b} = 2M − ${a} = (2 × ${par(Mp[0])} − ${par(Ap[0])}, 2 × ${par(Mp[1])} − ${par(Ap[1])}) = ${pt(Bp)}.`, `Check by averaging: (${a} + ${b})/2 = ${pt(mid(Ap, Bp))} = M.`],
  }, [
    { t: pt(Bp), ok: true, key: vk(Bp), say: `Right: averaging ${a} and ${pt(Bp)} gives M.` },
    { t: pt(w1), key: vk(w1), mc: MC.endAvg, say: `That is the midpoint of ${a}M. Average it with ${a}: you do not get M.` },
    { t: pt(w2), key: vk(w2), mc: MC.endHalves, say: 'Undo the average by doubling M and subtracting, not by halving.' },
    { t: pt(w3), key: vk(w3), say: `That point is on the other side of ${a}. ${b} lies beyond M.` },
  ], { max: 3 });
});

// ===================== common-midpoint-bisection =====================
export const bisectEach: Gen = (R, n) => retry(() => {
  const c = n % 4, off = ipt(R, -3, 1);
  let Q4: V[];
  if (c === 0) { const u: V = [nz(R, -2, 3), int(R, 0, 2)], k = int(R, 1, 2); const v: V = [-u[1] * k, u[0] * k]; if (near(d2([0, 0], u), d2([0, 0], v))) throw new Reroll(); Q4 = [[0, 0], u, add(u, v), v]; }
  else if (c === 1 || c === 3) { const u: V = [int(R, 3, 6), int(R, -1, 1)], v: V = [int(R, -2, 3), int(R, 3, 5)]; Q4 = [[0, 0], u, add(u, v), v]; if (c === 3 && (Q4[2]![0] % 2 === 0 && Q4[2]![1] % 2 === 0)) throw new Reroll(); }
  else { const a = int(R, 2, 4), b = pickOf(R, [1, 2, 5].filter(x => x !== a)), h = int(R, 3, 6); Q4 = [[-a, 0], [a, 0], [b, h], [-b, h]]; }
  const [Ap, Bp, Cp, Dp] = Q4.map(p => add(p, off)) as [V, V, V, V];
  const m1 = mid(Ap, Cp), m2 = mid(Bp, Dp), shared = same2(m1, m2), l1 = d2(Ap, Cp), l2 = d2(Bp, Dp);
  if (near(cross(sub(Cp, Ap), sub(Dp, Bp)), 0)) throw new Reroll();
  if (shared && near(l1, l2) && c !== 0) throw new Reroll();
  const perp = near((Cp[0] - Ap[0]) * (Dp[0] - Bp[0]) + (Cp[1] - Ap[1]) * (Dp[1] - Bp[1]), 0);
  const opts: Opt[] = [
    { t: 'Yes: AC and BD have the same midpoint', ok: shared, say: shared ? `Right: both midpoints are ${pt(m1)}, so each diagonal passes through the other one's midpoint.` : `Midpoint of AC = ${pt(m1)}, midpoint of BD = ${pt(m2)}: different.` },
    { t: 'No: AC and BD have different midpoints', ok: !shared, say: !shared ? `Right: ${pt(m1)} and ${pt(m2)} differ, so they do not bisect each other.` : `Both midpoints are ${pt(m1)}.` },
    c === 1 || c === 3 ? { t: 'No: AC and BD have different lengths', mc: MC.diagWords, say: 'Bisecting each other is about a shared midpoint, not equal lengths. Unequal diagonals can still bisect each other.' }
      : c === 2 ? { t: 'Yes: AC and BD have the same length', mc: MC.diagWords, say: 'Equal lengths do not mean they cut each other in half: compare the midpoints.' }
        : { t: perp ? 'Yes: AC and BD are perpendicular' : 'No: AC and BD are not perpendicular', ok: false, mc: MC.diagWords, say: 'Perpendicular is a different property. Bisecting each other means a shared midpoint.' },
  ];
  if ((c === 0 && perp) || Math.abs(cross(sub(Bp, Ap), sub(Dp, Ap))) < 10) throw new Reroll();
  return choice(R, {
    id: `bisectEach-${n}`, family: 'bisectEach', prompt: `Quadrilateral ${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}, ${ptN('D', Dp)}. Do the diagonals AC and BD bisect each other?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\\\ ${ptNT('C', Cp)} \\quad ${ptNT('D', Dp)}`,
    picture: { plane: plane({ polys: [{ key: 'q', pts: [Ap, Bp, Cp, Dp], col: 'first' }], pts: [P('A', Ap), P('B', Bp), P('C', Cp), P('D', Dp)], segs: [{ key: 'ac', a: Ap, b: Cp, col: 'second', dash: true }, { key: 'bd', a: Bp, b: Dp, col: 'pick', dash: true }] }, { pts: [P('m1', m1, '', 'link'), ...(shared ? [] : [P('m2', m2, '', 'wrong')])] }) },
    solution: [`Midpoint of AC = ${pt(m1)}.`, `Midpoint of BD = ${pt(m2)}.`, `Two segments bisect each other exactly when they share a midpoint.`],
  }, opts, { keep: true });
});

export const parFourth: Gen = (R, n) => retry(() => {
  const Ap = ipt(R, -6, 2), u: V = [nz(R, -4, 5), int(R, -3, 3)], v: V = [int(R, -3, 3), nz(R, -4, 5)];
  if (Math.abs(cross(u, v)) < 6) throw new Reroll();
  const Bp = add(Ap, u), Dp = add(Ap, v), Cp = add(Bp, v), M = mid(Ap, Cp);
  if (Math.max(...[Bp, Cp, Dp].flat().map(Math.abs)) > 9) throw new Reroll();
  return point({
    id: `parFourth-${n}`, family: 'parFourth', prompt: `ABCD is a parallelogram (vertices in order). ${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}. Find D.`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\quad ${ptNT('C', Cp)}`,
    picture: { plane: plane({ pts: [P('A', Ap), P('B', Bp), P('C', Cp)], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }, { key: 'bc', a: Bp, b: Cp, col: 'first' }] }, { pts: [P('D', Dp, 'D', 'link'), P('m', M, '', 'pick')], segs: [{ key: 'cd', a: Cp, b: Dp, col: 'link' }, { key: 'da', a: Dp, b: Ap, col: 'link' }, { key: 'ac', a: Ap, b: Cp, col: 'second', dash: true }, { key: 'bd', a: Bp, b: Dp, col: 'pick', dash: true }] }) },
    solution: [`The diagonals of a parallelogram bisect each other: BD has the same midpoint as AC.`, `Midpoint of AC = ${pt(M)}.`, `D = 2 × ${pt(M)} − B = ${pt(Dp)}. ${endPt('D', Dp)}`],
  }, 'D', Dp, `Right: D = ${pt(Dp)}. AC and BD now share the midpoint ${pt(M)}.`, [
    { at: add(sub(Bp, Ap), Cp), mc: MC.vertexOrder, say: 'That point is opposite A, not B. In ABCD, D is opposite B: the diagonals are AC and BD.' },
    { at: add(sub(Ap, Cp), Bp), mc: MC.vertexOrder, say: 'That point is opposite C. Go around in order A, B, C, D: D is opposite B.' },
  ], 'Use the shared midpoint: D = 2 × (midpoint of AC) − B.');
});

// ===================== zero-undefined-slope =====================
export const slopeZU: Gen = (R, n) => retry(() => {
  const [a, b] = two(R), vert = n % 2 === 1, eq = n % 4 >= 2;
  const k = nz(R, -6, 6);
  const Ap: V = vert ? [k, int(R, -6, 0)] : [int(R, -6, 0), k], Bp: V = vert ? [k, int(R, 1, 6)] : [int(R, 1, 6), k];
  const run = Bp[0] - Ap[0], rise = Bp[1] - Ap[1];
  const lineT = vert ? `x = ${fmt(k)}` : `y = ${fmt(k)}`;
  const opts: Opt[] = [
    { t: '0', ok: !vert, key: '0', mc: vert ? MC.zeroK : undefined, say: vert ? `The run is 0, not the rise: ${rise}/0 has no value. A vertical line has undefined slope.` : 'Right: the rise is 0, and 0 divided by the run is 0. A horizontal line has slope 0.' },
    { t: 'undefined', ok: vert, key: 'u', mc: vert ? undefined : MC.zeroK, say: vert ? `Right: the run is 0, and ${rise}/0 has no value. A vertical line has undefined slope.` : `The rise is 0, and 0/${run} = 0 is a fine number: the slope is 0.` },
    { t: 'infinity', key: 'inf', mc: MC.infinity, say: vert ? 'Infinity is not a number you can use as a slope. Division by 0 has no value: the slope is undefined.' : 'The rise is 0, so the slope is 0.' },
    { t: fmt(k), key: 'k', mc: vert ? MC.divZero : undefined, say: `${fmt(k)} is where the line crosses the ${vert ? 'x' : 'y'}-axis, not its slope.` },
  ];
  return choice(R, {
    id: `slopeZU-${n}`, family: 'slopeZU', prompt: eq ? `What is the slope of the line ${lineT}?` : `What is the slope of the line through ${ptN(a, Ap)} and ${ptN(b, Bp)}?`,
    board: eq ? lineT.replace('−', '-') : `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`,
    picture: { plane: plane({ pts: eq ? [] : [P('a', Ap, a), P('b', Bp, b)] }, { lines: [{ key: 'l', a: Ap, b: Bp, col: 'link' }] }) },
    solution: eq ? [`Every point of ${lineT} has ${vert ? 'x' : 'y'} = ${fmt(k)}: the line is ${vert ? 'vertical' : 'horizontal'}.`, vert ? 'Between two of its points the run is 0, and dividing by 0 has no value.' : 'Between two of its points the rise is 0, and 0 divided by a run is 0.']
      : [`Rise = ${minus(Bp[1], Ap[1])} = ${rise}; run = ${minus(Bp[0], Ap[0])} = ${run}.`, vert ? `Slope = ${rise}/0: dividing by 0 has no value.` : `Slope = 0/${run} = 0.`],
  }, opts, { max: 3 });
});

// ===================== parallel and perpendicular =====================
const slopeLine = (nm: string, Pp: V, Qp: V) => { const m = slope(Pp, Qp); return `Slope of ${nm} = (${minus(Qp[1], Pp[1])})/(${minus(Qp[0], Pp[0])}) = ${m ? qT(m) : 'undefined'}.`; };
export const parTest: Gen = (R, n) => retry(() => {
  const c = n % 4, Pp = ipt(R, -6, 0);
  let u: V = [nz(R, -4, 4), int(R, -4, 4)];
  if (c === 1) u = [0, nz(R, 2, 5)];
  if (c === 3 && u[1] === 0) u = [u[0], 1];
  const Qp = add(Pp, u);
  let Rp: V, Sp: V;
  if (c === 0 || c === 1) { const sh: V = c === 1 ? [nz(R, 2, 5), int(R, -2, 2)] : [int(R, -2, 3), nz(R, 2, 5)]; Rp = add(Pp, sh); Sp = add(Rp, mul(u, pickOf(R, [1, 2, -1]))); }
  else if (c === 2) { Rp = add(Pp, mul(u, pickOf(R, [-1, 2]))); Sp = add(Pp, mul(u, pickOf(R, [3, -2]))); }
  else { Rp = add(Pp, [int(R, 1, 4), int(R, 1, 4)]); Sp = add(Rp, [u[0] + pickOf(R, [1, -1]), u[1]]); }
  if (same2(Rp, Sp)) throw new Reroll();
  const rel = relOf(Pp, Qp, Rp, Sp);
  if (rel === 'perpendicular') throw new Reroll();
  const vertBoth = near(Qp[0], Pp[0]) && near(Sp[0], Rp[0]);
  const truth = rel === 'parallel' ? 'par' : rel === 'same' ? 'same' : 'not';
  const opts: Opt[] = [
    { t: vertBoth ? 'Parallel: both are vertical, and they are different lines' : 'Parallel: equal slopes, and they are different lines', ok: truth === 'par', key: 'par', mc: truth === 'same' ? MC.eqDistinct : undefined, say: truth === 'par' ? 'Right: same direction, no shared point.' : truth === 'same' ? 'Equal slopes, but R and S are on line PQ: it is the same line, not two parallel lines.' : 'The slopes are not equal.' },
    { t: 'The same line: equal slopes and a shared point', ok: truth === 'same', key: 'same', say: truth === 'same' ? 'Right: R and S lie on line PQ, so it is one line.' : 'Check whether R lies on line PQ: it does not.' },
    { t: 'Not parallel: the slopes differ', ok: truth === 'not', key: 'not', mc: vertBoth ? MC.zeroK : undefined, say: truth === 'not' ? 'Right: different slopes, so the lines meet.' : vertBoth ? 'Both lines are vertical: two different vertical lines are parallel, even though neither has a slope.' : 'The slopes are equal.' },
  ];
  return choice(R, {
    id: `parTest-${n}`, family: 'parTest', prompt: `Line PQ goes through ${ptN('P', Pp)} and ${ptN('Q', Qp)}; line RS through ${ptN('R', Rp)} and ${ptN('S', Sp)}. How are the lines related?`,
    board: `${ptNT('P', Pp)} \\quad ${ptNT('Q', Qp)} \\\\ ${ptNT('R', Rp)} \\quad ${ptNT('S', Sp)}`,
    picture: { plane: plane({ pts: [P('P', Pp), P('Q', Qp), P('R', Rp, 'R', 'second'), P('S', Sp, 'S', 'second')] }, { lines: [{ key: 'l1', a: Pp, b: Qp, col: 'first' }, { key: 'l2', a: Rp, b: Sp, col: 'second' }] }) },
    solution: [slopeLine('PQ', Pp, Qp), slopeLine('RS', Rp, Sp), rel === 'same' ? 'R and S both satisfy the equation of line PQ: one line.' : rel === 'parallel' ? 'Same direction and R is not on line PQ: two distinct parallel lines.' : 'Different slopes: the lines cross.'],
  }, opts, { keep: true });
});

/** a slope m = p/q from two points, |m| not 0 or 1 */
function slopePts(R: () => number): { Ap: V; Bp: V; m: Q } {
  for (;;) {
    const Ap = ipt(R, -6, 2), u: V = [nz(R, -5, 5), nz(R, -5, 5)];
    if (Math.abs(u[0]) === Math.abs(u[1])) continue;
    const Bp = add(Ap, u);
    return { Ap, Bp, m: slope(Ap, Bp)! };
  }
}
function slopeOpts(m: Q, want: 'par' | 'perp'): Opt[] {
  const vals: [Q, string, string | undefined][] = [[m, 'm', undefined], [negRecip(m), 'nr', want === 'par' ? MC.parPerpSwap : undefined], [q(-m.n, m.d), 'opp', want === 'perp' ? MC.perpOpp : undefined], [q(m.d, m.n), 'rec', want === 'perp' ? MC.perpRecip : undefined]];
  const right = want === 'par' ? 'm' : 'nr';
  return vals.map(([v, k, mc]) => ({
    t: qT(v), ok: k === right, key: `${v.n}/${v.d}`, mc,
    say: k === right ? (want === 'par' ? 'Right: parallel lines have equal slopes.' : `Right: ${qT(m)} × ${qT(v)} = −1.`)
      : k === 'nr' ? 'That is the perpendicular slope. A parallel line keeps the same slope.'
        : k === 'opp' ? 'Change the sign AND flip the fraction: the product of the two slopes must be −1.'
          : k === 'rec' ? 'Flip the fraction AND change the sign: the product of the two slopes must be −1.'
            : want === 'perp' ? 'Equal slopes give parallel lines, not perpendicular ones.' : 'Equal slopes: parallel.',
  }));
}
export const parSlope: Gen = (R, n) => retry(() => {
  const [a, b] = two(R, 'C'), { Ap, Bp, m } = slopePts(R), Cp = add(Ap, [int(R, 2, 4), -int(R, 2, 4)]);
  return choice(R, {
    id: `parSlope-${n}`, family: 'parSlope', prompt: `A line through ${ptN('C', Cp)} is parallel to ${a}${b}, with ${ptN(a, Ap)} and ${ptN(b, Bp)}. What is its slope?`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)} \\quad ${ptNT('C', Cp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b), P('c', Cp, 'C', 'pick')], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }] }, { lines: [{ key: 'l', a: Cp, b: add(Cp, sub(Bp, Ap)), col: 'link' }] }) },
    solution: [slopeLine(a + b, Ap, Bp), 'Parallel lines have equal slopes (and are different lines).'],
  }, slopeOpts(m, 'par'), { max: 3 });
});
export const perpSlope: Gen = (R, n) => retry(() => {
  const [a, b] = two(R), { Ap, Bp, m } = slopePts(R);
  const nr = negRecip(m);
  return choice(R, {
    id: `perpSlope-${n}`, family: 'perpSlope', prompt: `What is the slope of a line perpendicular to ${a}${b}, for ${ptN(a, Ap)} and ${ptN(b, Bp)}?`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }] }, { lines: [{ key: 'l', a: mid(Ap, Bp), b: add(mid(Ap, Bp), [nr.d, nr.n]), col: 'link' }] }) },
    solution: [slopeLine(a + b, Ap, Bp), `Perpendicular: flip and change the sign, so the product is −1: ${qT(m)} × ${qT(nr)} = −1.`],
  }, slopeOpts(m, 'perp'), { max: 3 });
});
export const perpTest: Gen = (R, n) => retry(() => {
  const c = n % 4, Ap = ipt(R, -6, 0);
  const u: V = [nz(R, 1, 5), nz(R, -5, 5)];
  if (Math.abs(u[0]) === Math.abs(u[1])) throw new Reroll();
  const v: V = c === 0 ? mul([-u[1], u[0]], pickOf(R, [1, -1])) : c === 1 ? [u[0], -u[1]] : c === 2 ? [u[1], u[0]] : [u[0] + 1, u[1] - 1];
  const Bp = add(Ap, u), Cp = add(Ap, [int(R, 2, 5), int(R, -1, 4)]), Dp = add(Cp, v);
  if (same2(Cp, Dp) || near(v[0], 0)) throw new Reroll();
  const rel = relOf(Ap, Bp, Cp, Dp);
  if (rel === 'same') throw new Reroll();
  const m1 = slope(Ap, Bp)!, m2 = slope(Cp, Dp)!;
  const mcYes = c === 1 ? MC.perpOpp : c === 2 ? MC.perpRecip : undefined;
  const opts: Opt[] = [
    { t: 'Perpendicular', ok: rel === 'perpendicular', mc: rel === 'perpendicular' ? undefined : mcYes, say: rel === 'perpendicular' ? `Right: ${qT(m1)} × ${qT(m2)} = −1.` : `${qT(m1)} × ${qT(m2)} = ${qT(q(m1.n * m2.n, m1.d * m2.d))}, not −1. Perpendicular slopes are opposite AND reciprocal.` },
    { t: 'Parallel', ok: rel === 'parallel', say: rel === 'parallel' ? 'Right: equal slopes.' : `The slopes ${qT(m1)} and ${qT(m2)} are not equal.` },
    { t: 'Neither', ok: rel === 'neither', say: rel === 'neither' ? `Right: the slopes are not equal and their product, ${qT(q(m1.n * m2.n, m1.d * m2.d))}, is not −1.` : rel === 'perpendicular' ? `${qT(m1)} × ${qT(m2)} = −1: perpendicular.` : 'Equal slopes: parallel.' },
  ];
  return choice(R, {
    id: `perpTest-${n}`, family: 'perpTest', prompt: `Line AB: ${ptN('A', Ap)}, ${ptN('B', Bp)}. Line CD: ${ptN('C', Cp)}, ${ptN('D', Dp)}. How are they related?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\\\ ${ptNT('C', Cp)} \\quad ${ptNT('D', Dp)}`,
    picture: { plane: plane({ pts: [P('A', Ap), P('B', Bp), P('C', Cp, 'C', 'second'), P('D', Dp, 'D', 'second')] }, { lines: [{ key: 'l1', a: Ap, b: Bp, col: 'first' }, { key: 'l2', a: Cp, b: Dp, col: 'second' }] }) },
    solution: [slopeLine('AB', Ap, Bp), slopeLine('CD', Cp, Dp), `Product of the slopes: ${qT(q(m1.n * m2.n, m1.d * m2.d))}.`],
  }, opts, { keep: true });
});

// ===================== horizontal-vertical-case =====================
export const hvRel: Gen = (R, n) => retry(() => {
  const c = n % 4, a = nz(R, -6, 6), b = nz(R, -6, 6), byPts = n % 8 >= 4;
  type L = { vert: boolean; k: number; pts?: [V, V] };
  const mk = (vert: boolean, k: number): L => ({ vert, k, pts: byPts ? (vert ? [[k, int(R, -6, -1)], [k, int(R, 1, 6)]] : [[int(R, -6, -1), k], [int(R, 1, 6), k]]) : undefined });
  const L1 = mk(c !== 1, a);
  const L2 = c === 0 ? mk(false, b) : c === 1 ? mk(false, b === a ? a + 1 : b) : c === 2 ? mk(true, b === a ? a + 2 : b) : mk(true, a);
  const truth = L1.vert !== L2.vert ? 'perp' : L1.k === L2.k ? 'same' : 'par';
  const desc = (L: L, nm: string) => (L.pts ? `the line through ${ptN(nm[0]!, L.pts[0])} and ${ptN(nm[1]!, L.pts[1])}` : `${L.vert ? 'x' : 'y'} = ${fmt(L.k)}`);
  const tex = (L: L, nm: string) => (L.pts ? `${ptNT(nm[0]!, L.pts[0])} \\quad ${ptNT(nm[1]!, L.pts[1])}` : `${L.vert ? 'x' : 'y'} = ${fmtT(L.k)}`);
  const opts: Opt[] = [
    { t: 'Perpendicular', ok: truth === 'perp', key: 'perp', say: truth === 'perp' ? 'Right: a vertical line and a horizontal line meet at a right angle, even though the slope product cannot be worked out.' : 'Both lines run the same way.' },
    { t: 'Parallel', ok: truth === 'par', key: 'par', say: truth === 'par' ? `Right: both are ${L1.vert ? 'vertical' : 'horizontal'}, at different places.` : truth === 'same' ? 'They are the same line, not two lines.' : 'One is vertical and one is horizontal.' },
    { t: 'The same line', ok: truth === 'same', key: 'same', say: truth === 'same' ? 'Right: the two descriptions give one line.' : 'Check where each line is: they are not at the same place.' },
    { t: 'Neither: the slope product is not −1', key: 'nei', mc: truth === 'perp' ? MC.axisRule : MC.zeroK, say: truth === 'perp' ? 'The product test only works when both slopes are numbers. A vertical and a horizontal line are perpendicular.' : 'Lines that run the same way are parallel (or the same line); no product is needed.' },
  ];
  const nm1 = 'PQ', nm2 = 'RS';
  return choice(R, {
    id: `hvRel-${n}`, family: 'hvRel', prompt: `How are ${desc(L1, nm1)} and ${desc(L2, nm2)} related?`,
    board: `${tex(L1, nm1)} \\\\ ${tex(L2, nm2)}`,
    picture: { plane: plane({ pts: [...(L1.pts ? [P('P', L1.pts[0]), P('Q', L1.pts[1])] : []), ...(L2.pts ? [P('R', L2.pts[0], 'R', 'second'), P('S', L2.pts[1], 'S', 'second')] : [])], texts: [] }, { lines: [L1, L2].map((L, i) => ({ key: `l${i}`, a: (L.vert ? [L.k, 0] : [0, L.k]) as V, b: (L.vert ? [L.k, 1] : [1, L.k]) as V, col: (i ? 'second' : 'first') as 'first' })) }) },
    solution: [`The first line is ${L1.vert ? 'vertical' : 'horizontal'} (${L1.vert ? 'x' : 'y'} = ${fmt(L1.k)}); the second is ${L2.vert ? 'vertical' : 'horizontal'} (${L2.vert ? 'x' : 'y'} = ${fmt(L2.k)}).`, truth === 'perp' ? 'Vertical and horizontal lines are perpendicular: no slope product needed.' : truth === 'same' ? 'Same direction, same place: one line.' : 'Same direction, different places: parallel.'],
  }, opts, { max: 3 });
});
export const hvLine: Gen = (R, n) => retry(() => {
  const vert = n % 2 === 1, k = nz(R, -5, 5), Pp: V = [nz(R, -6, 6), nz(R, -6, 6)];
  if (vert ? Pp[0] === k : Pp[1] === k) throw new Reroll();
  const given = vert ? `x = ${fmt(k)}` : `y = ${fmt(k)}`;
  const right = vert ? `y = ${fmt(Pp[1])}` : `x = ${fmt(Pp[0])}`;
  const opts: Opt[] = [
    { t: right, ok: true, say: `Right: ${right} is ${vert ? 'horizontal' : 'vertical'} and passes through P.` },
    { t: vert ? `x = ${fmt(Pp[0])}` : `y = ${fmt(Pp[1])}`, say: `That line goes through P but is ${vert ? 'vertical' : 'horizontal'} too: parallel to ${given}, not perpendicular.` },
    { t: vert ? `y = ${fmt(k)}` : `x = ${fmt(k)}`, say: 'That line has the right direction but does not pass through P.' },
    { t: 'No such line: the slope has no negative reciprocal', mc: MC.axisRule, say: 'Vertical and horizontal lines are perpendicular; the slope rule just does not apply to them.' },
  ];
  return choice(R, {
    id: `hvLine-${n}`, family: 'hvLine', prompt: `Which line passes through ${ptN('P', Pp)} and is perpendicular to ${given}?`,
    board: `${ptNT('P', Pp)} \\quad ${given.replace('−', '-')}`,
    picture: { plane: plane({ pts: [P('P', Pp, 'P', 'pick')], lines: [{ key: 'g', a: vert ? [k, 0] : [0, k], b: vert ? [k, 1] : [1, k], col: 'first' }] }, { lines: [{ key: 'l', a: Pp, b: vert ? [Pp[0] + 1, Pp[1]] : [Pp[0], Pp[1] + 1], col: 'link' }] }) },
    solution: [`${given} is ${vert ? 'vertical' : 'horizontal'}, so a perpendicular line is ${vert ? 'horizontal' : 'vertical'}.`, `A ${vert ? 'horizontal' : 'vertical'} line through P keeps P's ${vert ? 'y' : 'x'}-coordinate: ${right}.`],
  }, opts, { max: 3 });
});

// ===================== distance-fluent =====================
export const distX: Gen = (R, n) => retry(() => {
  const [a, b] = two(R), Ap = ipt(R, -10, 10), c = n % 5;
  const dv: V = c === 0 ? (R() < 0.5 ? [nz(R, -9, 9), 0] : [0, nz(R, -9, 9)]) : [nz(R, -8, 8), nz(R, -8, 8)];
  const Bp = add(Ap, dv);
  if (Math.max(...Bp.map(Math.abs)) > 10) throw new Reroll();
  const n2 = dv[0] ** 2 + dv[1] ** 2, nm = a + b;
  const ds = (Bp[0] ** 2 - Ap[0] ** 2) + (Bp[1] ** 2 - Ap[1] ** 2);
  const neg = Math.sign(dv[0]) * dv[0] ** 2 * (dv[0] < 0 ? -1 : 1);
  void neg;
  const evenNeg = (dv[0] < 0 ? -1 : 1) * dv[0] ** 2 + (dv[1] < 0 ? -1 : 1) * dv[1] ** 2;
  return radItem({
    id: `distX-${n}`, family: 'distX', prompt: `Find ${nm} exactly, in simplest radical form: ${ptN(a, Ap)}, ${ptN(b, Bp)}.`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)] }, { segs: [{ key: 'ab', a: Ap, b: Bp, col: 'link' }] }) },
    solution: [`${nm}² = (${minus(Bp[0], Ap[0])})² + (${minus(Bp[1], Ap[1])})² = ${sq(dv[0])} + ${sq(dv[1])} = ${n2}.`, lenLine(nm, n2)],
  }, n2, `Right: ${nm} = ${radT(n2)}.`, [
    ...(ds > 0 ? [{ n: ds, mc: MC.diffSq, say: 'Subtract the coordinates first, then square the difference: (x₂ − x₁)², not x₂² − x₁².' }] : []),
    ...(evenNeg > 0 && evenNeg !== n2 ? [{ n: evenNeg, mc: MC.evenNeg, say: 'A negative number squared is positive: (−5)² = 25.' }] : []),
    { n: (Math.abs(dv[0]) + Math.abs(dv[1])) ** 2, mc: MC.adds, say: 'Square each difference and add, then take the square root: the differences do not add as lengths.' },
  ], 'Square the x-difference and the y-difference, add, take the square root, simplify.');
});
export const distSq: Gen = (R, n) => retry(() => {
  const [a, b] = two(R), h = (x: number) => x + (R() < 0.5 ? 0.5 : 0);
  const Ap: V = [h(int(R, -8, 6)), h(int(R, -8, 6))], Bp: V = [h(int(R, -8, 6)), h(int(R, -8, 6))];
  const dv = sub(Bp, Ap);
  if (near(dv[0], 0) || near(dv[1], 0) || (Number.isInteger(Ap[0]) && Number.isInteger(Ap[1]) && Number.isInteger(Bp[0]) && Number.isInteger(Bp[1]))) throw new Reroll();
  const n2 = dv[0] ** 2 + dv[1] ** 2, nm = a + b;
  const ds = (Bp[0] ** 2 - Ap[0] ** 2) + (Bp[1] ** 2 - Ap[1] ** 2);
  return num({
    id: `distSq-${n}`, family: 'distSq', prompt: `Find ${nm}² exactly (the squared distance): ${ptN(a, Ap)}, ${ptN(b, Bp)}.`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)} \\quad ${nm}^2 = ?`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)] }, { segs: [{ key: 'ab', a: Ap, b: Bp, col: 'link' }] }) },
    solution: [`x-difference: ${minus(Bp[0], Ap[0])} = ${fmt(dv[0])}; y-difference: ${minus(Bp[1], Ap[1])} = ${fmt(dv[1])}.`, `${nm}² = ${sq(dv[0])} + ${sq(dv[1])} = ${fmt(dv[0] ** 2)} + ${fmt(dv[1] ** 2)} = ${ans(fmt(n2))}.`],
  }, n2, `Right: ${nm}² = ${fmt(n2)}.`, [
    { v: ds, mc: MC.diffSq, say: 'Subtract first, then square: (x₂ − x₁)², not x₂² − x₁².' },
    { v: (Math.abs(dv[0]) + Math.abs(dv[1])) ** 2, mc: MC.adds, say: 'Square each difference separately, then add.' },
    { v: Math.abs(dv[0]) + Math.abs(dv[1]), mc: MC.adds, say: 'The differences are legs at a right angle: square them and add.' },
  ], 'Square the x-difference and the y-difference, then add.');
});

// ===================== midpoint-fluent =====================
export const midMix: Gen = (R, n) => (n % 2 ? midItem(R, n, 'midMix', 'midpoint-fluent') : endItem(R, n, 'midMix', 'midpoint-fluent'));

// ===================== fractional-partition =====================
const FRACS: [number, number][] = [[1, 4], [3, 4], [2, 5], [3, 5], [1, 5], [4, 5], [1, 3], [2, 3]];
const fracT = (m: number, d: number) => `${m}/${d}`;
export const partT: Gen = (R, n) => retry(() => {
  const [a, b] = two(R, 'P'), [m, d] = pickOf(R, FRACS), back = n % 3 === 2;
  const Ap = ipt(R, -8, 4), u: V = n % 5 === 0 ? [nz(R, -10, 10), 0] : [nz(R, -10, 10), nz(R, -10, 10)];
  const Bp = add(Ap, u);
  if (d === 3 && (u[0] % 3 || u[1] % 3)) throw new Reroll();
  if (Math.max(...Bp.map(Math.abs)) > 10 || Math.max(...u.map(Math.abs)) < 3) throw new Reroll();
  const t = m / d, S0 = back ? Bp : Ap, E0 = back ? Ap : Bp, s0 = back ? b : a, e0 = back ? a : b;
  const Pp = along(S0, E0, t), diff = sub(E0, S0);
  const ticks = Array.from({ length: d - 1 }, (_, i) => ({ key: `t${i}`, at: along(S0, E0, (i + 1) / d), name: '', col: 'dim' as const, open: true }));
  return point({
    id: `partT-${n}`, family: 'partT', prompt: `P is ${fracT(m, d)} of the way from ${s0} to ${e0}, with ${ptN(a, Ap)} and ${ptN(b, Bp)}. Find P.`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)} \\quad t = \\frac{${m}}{${d}}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)], segs: [{ key: 'ab', a: S0, b: E0, col: 'first' }] }, { pts: [...ticks, P('p', Pp, 'P', 'link')] }) },
    solution: [`Start at ${s0}${pt(S0)}. The trip to ${e0} is ${e0} − ${s0} = ${pt(diff)}.`, `${fracT(m, d)} of the trip: ${pt(mul(diff, t))}.`, `P = ${s0} + ${pt(mul(diff, t))} = ${pt(Pp)}. ${endPt('P', Pp)}`],
  }, 'P', Pp, `Right: P = ${pt(Pp)}, ${fracT(m, d)} of the way from ${s0}.`, [
    { at: add(S0, mul(E0, t)), mc: MC.tEnd, say: `Take ${fracT(m, d)} of the trip ${e0} − ${s0}, not of ${e0}'s coordinates.` },
    { at: along(E0, S0, t), mc: MC.wrongEnd, say: `Measure from ${s0}, the stated start: that point is ${fracT(m, d)} of the way from ${e0}.` },
  ], `P = start + t × (end − start), with t = ${fracT(m, d)}.`);
});
const RATIOS: [number, number][] = [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [3, 2], [1, 4], [3, 2]];
export const partRatio: Gen = (R, n) => retry(() => {
  const [a, b] = two(R, 'P'), [m, k] = pickOf(R, RATIOS), d = m + k;
  const Ap = ipt(R, -8, 4), kk = Math.max(1, Math.floor(10 / d));
  const u: V = n % 2 === 0 || d === 3 ? [nz(R, -kk, kk) * d, nz(R, -kk, kk) * d] : [nz(R, -10, 10), nz(R, -10, 10)];
  const Bp = add(Ap, u);
  if (Math.max(...Bp.map(Math.abs)) > 10 || Math.max(...u.map(Math.abs)) < 3) throw new Reroll();
  const t = m / d, Pp = along(Ap, Bp, t);
  return point({
    id: `partRatio-${n}`, family: 'partRatio', prompt: `P partitions the directed segment from ${a} to ${b} in the ratio ${m}:${k} (${a}P:P${b} = ${m}:${k}). ${ptN(a, Ap)}, ${ptN(b, Bp)}. Find P.`,
    board: `${ptNT(a, Ap)} \\quad ${ptNT(b, Bp)} \\quad ${m}:${k}`,
    picture: { plane: plane({ pts: [P('a', Ap, a), P('b', Bp, b)], segs: [{ key: 'ab', a: Ap, b: Bp, col: 'first' }] }, { pts: [...Array.from({ length: d - 1 }, (_, i) => ({ key: `t${i}`, at: along(Ap, Bp, (i + 1) / d), name: '', col: 'dim' as const, open: true })), P('p', Pp, 'P', 'link')] }) },
    solution: [`Split ${a}${b} into ${m} + ${k} = ${d} equal parts (the ratio ${m}:${k}); P is ${m} part${m > 1 ? 's' : ''} from ${a}, so t = ${m}/${d}.`, `${a}${b} = ${pt(u)}; ${m}/${d} of it is ${pt(mul(u, t))}.`, `P = ${a} + ${pt(mul(u, t))} = ${pt(Pp)}. ${endPt('P', Pp)}`],
  }, 'P', Pp, `Right: P = ${pt(Pp)}, ${m}/${d} of the way from ${a}.`, [
    { at: along(Ap, Bp, m / k), mc: MC.mOverN, say: `${m}:${k} means ${m} parts out of ${d}, so t = ${m}/${d}, not ${m}/${k}.` },
    { at: along(Ap, Bp, k / d), mc: MC.wrongEnd, say: `${a}P:P${b} = ${m}:${k}: the ${m} parts are next to ${a}. That point is ${m} parts from ${b}.` },
    { at: add(Ap, mul(Bp, t)), mc: MC.tEnd, say: `Take ${m}/${d} of the trip ${b} − ${a}, not of ${b}'s coordinates.` },
  ], `t = ${m}/(${m} + ${k}); P = ${a} + t × (${b} − ${a}).`);
});

// ===================== weighted-average-points =====================
export const wAvg: Gen = (R, n) => retry(() => {
  const c = n % 3;
  const k = c === 0 ? 2 : 3;
  const ws = Array.from({ length: k }, () => int(R, 1, 5));
  const W = ws.reduce((s, x) => s + x, 0);
  if (![2, 4, 5, 8, 10].includes(W) && !(W % 2 === 0 && W <= 12)) throw new Reroll();
  if (ws.every(w => w === ws[0])) throw new Reroll();
  const pts: V[] = Array.from({ length: k }, () => ipt(R, -8, 8));
  if (c === 0) pts[1] = [pts[1]![0], pts[0]![1]];
  const names = ['A', 'B', 'C'];
  const Pp: V = [pts.reduce((s, p, i) => s + ws[i]! * p[0], 0) / W, pts.reduce((s, p, i) => s + ws[i]! * p[1], 0) / W];
  if (!Number.isInteger(Pp[0] * 4) || !Number.isInteger(Pp[1] * 4) || pts.some(p => same2(p, Pp)) || pts.some((p, i) => pts.some((r, j) => j > i && same2(p, r)))) throw new Reroll();
  const sum: V = [Pp[0] * W, Pp[1] * W];
  const swapW = k === 2 ? [ws[1]!, ws[0]!] : null;
  return point({
    id: `wAvg-${n}`, family: 'wAvg', prompt: `Weights ${ws.map((w, i) => `${w} at ${ptN(names[i]!, pts[i]!)}`).join(', ')}. Find their weighted average (balance point) G.`,
    board: ws.map((w, i) => `${w} \\text{ at } ${ptNT(names[i]!, pts[i]!)}`).join(' \\\\ '),
    picture: { plane: plane({ pts: pts.map((p, i) => P(names[i]!, p, names[i]!, (['first', 'second', 'pick'] as const)[i])), texts: pts.map((p, i) => ({ key: `w${i}`, at: [p[0], p[1] - 1] as V, text: `w = ${ws[i]}`, col: 'dim' as const })) }, { pts: [P('g', Pp, 'G', 'link')] }) },
    solution: [`Total weight: ${ws.join(' + ')} = ${W}.`, `x: (${ws.map((w, i) => `${w} × ${par(pts[i]![0])}`).join(' + ')})/${W} = ${fmt(sum[0])}/${W} = ${fmt(Pp[0])}.`, `y: (${ws.map((w, i) => `${w} × ${par(pts[i]![1])}`).join(' + ')})/${W} = ${fmt(sum[1])}/${W} = ${fmt(Pp[1])}. ${endPt('G', Pp)}`],
  }, 'G', Pp, `Right: G = ${pt(Pp)}, pulled toward the heavier ${k === 2 ? 'point' : 'points'}.`, [
    { at: [sum[0] / k, sum[1] / k], mc: MC.byCount, say: `Divide by the total weight, ${W}, not by the number of points, ${k}.` },
    ...(swapW ? [{ at: [(swapW[0]! * pts[0]![0] + swapW[1]! * pts[1]![0]) / W, (swapW[0]! * pts[0]![1] + swapW[1]! * pts[1]![1]) / W] as V, mc: MC.pushAway, say: 'Each weight multiplies its own point: the heavier point pulls G toward itself.' }] : []),
  ], 'Multiply each point by its weight, add, and divide by the total weight.');
});
export const wMove: Gen = (R, n) => retry(() => {
  if (n % 2 === 0) {
    const w = int(R, 1, 4), w2 = w + int(R, 1, 4), heavyA = R() < 0.5;
    return choice(R, {
      id: `wMove-${n}`, family: 'wMove', prompt: `Weights of ${w} at A and ${w} at B balance at the midpoint of AB. Now the weight at ${heavyA ? 'A' : 'B'} grows to ${w2}. Where does the balance point move?`,
      board: `${w} \\to ${w2} \\text{ at } ${heavyA ? 'A' : 'B'}`,
      solution: [`The weighted average is pulled toward the larger weight.`, `${heavyA ? 'A' : 'B'} now carries ${w2} of the ${w + w2} units of weight.`],
    }, [
      { t: `Toward ${heavyA ? 'A' : 'B'}`, ok: true, say: 'Right: a heavier point pulls the average toward itself.' },
      { t: `Toward ${heavyA ? 'B' : 'A'}`, mc: MC.pushAway, say: 'A larger weight pulls the average toward its own point, not away from it.' },
      { t: 'It stays at the midpoint', say: 'The weights are no longer equal, so the balance point is no longer halfway.' },
    ], { keep: true });
  }
  const [m, k] = pickOf(R, RATIOS.filter(r => r[0] !== r[1]));
  return choice(R, {
    id: `wMove-${n}`, family: 'wMove', prompt: `Which weights on A and B put their weighted average at the point P with AP:PB = ${m}:${k}?`,
    board: `AP : PB = ${m} : ${k}`,
    solution: [`P is ${m}/${m + k} of the way from A, so it is closer to ${m < k ? 'A' : 'B'}: that point gets the larger weight.`, `Weight ${k} on A and ${m} on B: P = (${k}A + ${m}B)/${m + k}.`],
  }, [
    { t: `${k} on A and ${m} on B`, ok: true, say: `Right: (${k}A + ${m}B)/${m + k} = A + ${m}/${m + k} × (B − A).` },
    { t: `${m} on A and ${k} on B`, mc: MC.pushAway, say: `That puts P ${m}/${m + k} of the way from B. The point nearer P gets the larger weight.` },
    { t: `${m} on A and ${m + k} on B`, mc: MC.wrongEnd, say: `The weights must be in the ratio ${k}:${m}, the parts on the far side.` },
  ], { keep: false });
});
export const centroid: Gen = (R, n) => retry(() => {
  const G0 = ipt(R, -3, 3), A1 = ipt(R, -8, 8), B1 = ipt(R, -8, 8), C1 = sub(sub(mul(G0, 3), A1), B1);
  const T = [A1, B1, C1] as V[];
  const sx = T[0]![0] + T[1]![0] + T[2]![0], sy = T[0]![1] + T[1]![1] + T[2]![1];
  if (Math.max(...C1.map(Math.abs)) > 9 || Math.abs(cross(sub(T[1]!, T[0]!), sub(T[2]!, T[0]!))) < 20) throw new Reroll();
  const G: V = [sx / 3, sy / 3], [A0, B0, C0] = T as [V, V, V];
  return point({
    id: `centroid-${n}`, family: 'centroid', prompt: `Equal weights sit at the vertices of triangle ${ptN('A', A0)}, ${ptN('B', B0)}, ${ptN('C', C0)}. Their average is the centroid G, where the medians meet. Find G.`,
    board: `${ptNT('A', A0)} \\quad ${ptNT('B', B0)} \\quad ${ptNT('C', C0)}`,
    picture: { plane: plane({ polys: [{ key: 't', pts: T, col: 'first' }], pts: [P('A', A0), P('B', B0), P('C', C0)] }, { segs: [{ key: 'ma', a: A0, b: mid(B0, C0), col: 'pick', dash: true }, { key: 'mb', a: B0, b: mid(A0, C0), col: 'pick', dash: true }, { key: 'mc', a: C0, b: mid(A0, B0), col: 'pick', dash: true }], pts: [P('g', G, 'G', 'link')] }) },
    solution: [`Equal weights: add the three points and divide by 3.`, `x: (${fmt(A0[0])} + ${par(B0[0])} + ${par(C0[0])})/3 = ${fmt(sx)}/3 = ${fmt(G[0])}.`, `y: (${fmt(A0[1])} + ${par(B0[1])} + ${par(C0[1])})/3 = ${fmt(sy)}/3 = ${fmt(G[1])}. ${endPt('G', G)}`],
  }, 'G', G, `Right: G = ${pt(G)}, the average of the three vertices.`, [
    { at: [sx / 2, sy / 2], mc: MC.byCount, say: 'Three points, three equal weights: divide the sum by 3.' },
    { at: mid(A0, B0), say: 'That is the midpoint of one side. The centroid averages all three vertices.' },
  ], 'Average the vertices: add the x-coordinates and divide by 3, then the same for y.');
});

// ===================== line-relationship-select =====================
/** y = mx + b as plain text and TeX (no 1x, no + −) */
function eqT(m: Q, b: number, mulBy = 1): { t: string; tex: string } {
  const mm = q(m.n * mulBy, m.d);
  const lead = (tex: boolean) => (mulBy === 1 ? 'y' : `${mulBy < 0 ? (tex ? '-' : '−') : ''}${Math.abs(mulBy)}y`);
  const coef = (tex: boolean) => (mm.d === 1 ? (Math.abs(mm.n) === 1 ? '' : String(Math.abs(mm.n))) : tex ? `\\frac{${Math.abs(mm.n)}}{${mm.d}}` : `(${Math.abs(mm.n)}/${mm.d})`);
  const bb = b * mulBy;
  const tail = (tex: boolean) => (bb === 0 ? '' : ` ${bb < 0 ? (tex ? '-' : '−') : '+'} ${Math.abs(bb)}`);
  return {
    t: `${lead(false)} = ${mm.n < 0 ? '−' : ''}${coef(false)}x${tail(false)}`,
    tex: `${lead(true)} = ${mm.n < 0 ? '-' : ''}${coef(true)}x${tail(true)}`,
  };
}
export const lineRel: Gen = (R, n) => retry(() => {
  const c = n % 4;
  const m1 = q(nz(R, -4, 4), pickOf(R, [1, 1, 2, 3])), b1 = int(R, -6, 6);
  if (m1.n === 0) throw new Reroll();
  // (a zero slope is never generated: no "0x" term in an equation)
  let m2: Q, b2: number, mulBy = 1;
  if (c === 0) { m2 = m1; b2 = b1 + nz(R, -4, 4); }
  else if (c === 1) { m2 = negRecip(m1); b2 = int(R, -6, 6); }
  else if (c === 2) { m2 = m1; b2 = b1; mulBy = m1.d > 1 ? m1.d * pickOf(R, [1, -1]) : pickOf(R, [2, 3, -2]); }
  else { m2 = pickOf(R, [q(m1.n + 1, m1.d), q(-m1.n, m1.d), q(m1.d, m1.n)]); b2 = int(R, -6, 6); if (qEq(m2, negRecip(m1)) || qEq(m2, m1)) throw new Reroll(); }
  if (m2.n === 0) throw new Reroll();
  if (c === 0 || c === 3) mulBy = R() < 0.3 ? (m2.d > 1 ? m2.d : 2) : 1;
  const e1 = eqT(m1, b1), e2 = eqT(m2, b2, mulBy);
  const truth = c === 0 ? 'par' : c === 1 ? 'perp' : c === 2 ? 'same' : 'nei';
  const prod = q(m1.n * m2.n, m1.d * m2.d);
  const opts: Opt[] = [
    { t: 'Parallel', ok: truth === 'par', key: 'par', mc: truth === 'same' ? MC.eqDistinct : undefined, say: truth === 'par' ? 'Right: equal slopes, different y-intercepts.' : truth === 'same' ? 'Equal slopes AND equal intercepts: the same line, not two parallel lines.' : 'The slopes are not equal.' },
    { t: 'Perpendicular', ok: truth === 'perp', key: 'perp', say: truth === 'perp' ? `Right: ${qT(m1)} × ${qT(m2)} = −1.` : `The product of the slopes is ${qT(prod)}, not −1.` },
    { t: 'The same line', ok: truth === 'same', key: 'same', say: truth === 'same' ? `Right: solve the second for y: ${e1.t}. One line.` : 'Solve both for y: the intercepts differ.' },
    { t: 'Neither', ok: truth === 'nei', key: 'nei', mc: truth === 'par' || truth === 'same' ? MC.oneTest : undefined, say: truth === 'nei' ? `Right: unequal slopes, and the product ${qT(prod)} is not −1.` : truth === 'perp' ? `${qT(m1)} × ${qT(m2)} = −1: perpendicular.` : 'Check equal slopes first: the product test is only one of the tests.' },
  ];
  return choice(R, {
    id: `lineRel-${n}`, family: 'lineRel', prompt: `How are the lines ${e1.t} and ${e2.t} related?`,
    board: `${e1.tex} \\\\ ${e2.tex}`,
    solution: [`First line: slope ${qT(m1)}, y-intercept ${b1}.`, `Second line${mulBy !== 1 ? `, divided by ${fmt(mulBy)}` : ''}: slope ${qT(m2)}, y-intercept ${b2}.`, truth === 'same' ? 'Same slope, same intercept: one line.' : truth === 'par' ? 'Same slope, different intercepts: parallel.' : `Product of the slopes: ${qT(prod)}.`],
  }, opts, { max: 3 });
});

// ===================== side-diagonal-identification =====================
const CONVEX = (R: () => number): V[] => {
  for (;;) {
    const c = ipt(R, -2, 2);
    const angs = [0, 1, 2, 3].map(i => i * Math.PI / 2 + (R() - 0.5) * 0.9);
    const pts = angs.map(a => [Math.round(c[0] + Math.cos(a) * int(R, 4, 6)) + 0, Math.round(c[1] + Math.sin(a) * int(R, 4, 6)) + 0] as V);
    let ok = true;
    for (let i = 0; i < 4; i++) { const a = pts[i]!, b = pts[(i + 1) % 4]!, e = pts[(i + 2) % 4]!; if (cross(sub(b, a), sub(e, b)) <= 2) ok = false; }
    if (ok) return pts;
  }
};
export const sideDiag: Gen = (R, n) => retry(() => {
  const pent = n % 3 === 2;
  const letters = pent ? ['A', 'B', 'C', 'D', 'E'] : pickOf(R, [['A', 'C', 'B', 'D'], ['P', 'Q', 'R', 'S'], ['A', 'B', 'D', 'C'], ['K', 'M', 'N', 'J'], ['W', 'X', 'Y', 'Z']]);
  const N = letters.length, name = letters.join('');
  const pts: V[] = pent ? ([[0, 6], [6, 2], [4, -5], [-4, -5], [-6, 2]] as V[]).map(p => add(p, ipt(R, -2, 2))) : CONVEX(R);
  if (pts.some((p, i) => Math.abs(cross(sub(pts[(i + 1) % pts.length]!, p), sub(pts[(i + 2) % pts.length]!, p))) < 4)) throw new Reroll();
  const seg = (i: number, j: number) => [letters[i]!, letters[j]!].sort().join('');
  const sides = Array.from({ length: N }, (_, i) => seg(i, (i + 1) % N));
  const diags: string[] = [];
  for (let i = 0; i < N; i++) for (let j = i + 2; j < N; j++) if (!(i === 0 && j === N - 1)) diags.push(seg(i, j));
  const right = pickOf(R, diags);
  const closing = seg(N - 1, 0);
  const others = [closing, ...sides.filter(s => s !== closing)].slice(0, 3);
  return choice(R, {
    id: `sideDiag-${n}`, family: 'sideDiag', prompt: `Which segment is a diagonal of ${pent ? 'pentagon' : 'quadrilateral'} ${name}? (Its vertices are listed in order around it.)`,
    board: `${name}`,
    picture: { plane: plane({ pts: letters.map((l, i) => P(l, pts[i]!)) }, { polys: [{ key: 'q', pts, col: 'first' }], segs: diags.map(d => { const i = letters.indexOf(d[0]!), j = letters.indexOf(d[1]!); return { key: `d${d}`, a: pts[i]!, b: pts[j]!, col: (d === right ? 'link' : 'dim') as 'link', dash: true }; }) }) },
    solution: [`Sides join consecutive letters of ${name}, including the last back to the first: ${sides.join(', ')}.`, `A diagonal joins two vertices that are not next to each other: ${diags.join(', ')}.`],
  }, [
    { t: right, ok: true, say: `Right: ${right[0]} and ${right[1]} are not next to each other in ${name}.` },
    ...others.map(s => ({ t: s, mc: s === closing ? MC.diagSides : MC.diagSides, say: `${s[0]} and ${s[1]} are next to each other in ${name}${s === closing ? ' (the last letter goes back to the first)' : ''}: ${s} is a side.` })),
  ], { max: 3 });
});
export const closing: Gen = (R, n) => retry(() => {
  const letters = pickOf(R, [['P', 'Q', 'R', 'S'], ['A', 'C', 'B', 'D'], ['K', 'M', 'N', 'J'], ['A', 'B', 'D', 'C'], ['W', 'X', 'Y', 'Z']]);
  const name = letters.join(''), pts = CONVEX(R);
  const sides = [0, 1, 2, 3].map(i => letters[i]! + letters[(i + 1) % 4]!);
  const alpha = [...letters].sort(), alphaSides = [0, 1, 2, 3].map(i => alpha[i]! + alpha[(i + 1) % 4]!);
  const sameSet = (a: string[], b: string[]) => a.map(s => [...s].sort().join('')).sort().join() === b.map(s => [...s].sort().join('')).sort().join();
  const lst = (xs: string[]) => `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
  const opts: Opt[] = [
    { t: lst(sides), ok: true, key: [...sides].map(s => [...s].sort().join('')).sort().join(), say: 'Right: the four sides, including the closing side back to the first vertex.' },
    { t: lst(sides.slice(0, 3)), mc: MC.closing, say: `The perimeter goes all the way around: add the closing side ${sides[3]}.` },
    { t: lst([...sides.slice(0, 3), letters[0]! + letters[2]!]), mc: MC.diagSides, say: `${letters[0]}${letters[2]} is a diagonal. The last side runs from ${letters[3]} back to ${letters[0]}.` },
    ...(!sameSet(alphaSides, sides) ? [{ t: lst(alphaSides), key: [...alphaSides].map(s => [...s].sort().join('')).sort().join(), mc: MC.vertexOrder, say: `Follow the order in the name ${name}, not the alphabet.` }] : []),
  ];
  return choice(R, {
    id: `closing-${n}`, family: 'closing', prompt: `The perimeter of quadrilateral ${name} (vertices in order around it) is the sum of which lengths?`,
    board: name,
    picture: { plane: plane({ pts: letters.map((l, i) => P(l, pts[i]!)) }, { polys: [{ key: 'q', pts, col: 'link' }] }) },
    solution: [`Walk around ${name} in the order of its letters and back to the start.`, `Sides: ${sides.join(', ')}.`],
  }, opts, { max: 3 });
});

export { same2, slopeLine, eqT, CONVEX, legs, legTexts, P as dpt, vk };
void Am; void S; void qv;
