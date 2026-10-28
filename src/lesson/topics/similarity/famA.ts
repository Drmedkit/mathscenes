// famA.ts: stage 1 of "Similar triangles" (sub-goals congruence-as-scale-factor-1 ... triangle-criteria-scope):
// congruence as k = 1, AA (with the hidden third angle), SSS~, SAS~, the dilate-then-congruence argument, what the
// evidence establishes, the five-way classification, and why the triangle criteria stop at triangles.
// Every figure is exact: labelled lengths are drawn at their length (one unit per figure), labelled angles at their
// measure. Fact cards state exactly the givens; the right category follows from them alone.
import { type Fig, type Pt, add, at, dirv, mul } from '../geometry-foundations/geo';
import { triASA } from '../triangle-congruence/tri';
import { A, MC, NAMES, type Gen, type Opt, choice, deg, fitted, fr, fracItem, names2, numItem, pick, r, rt, S, shuffle, simH, simT, triN } from './common';
import { PERM6, SIDE_SETS, type Q, anglesOf, fmt, permOf, placeBeside, qHtml, red, sideOf, simFig, simPair, turnTri, figOf } from './sim';

const rot2 = (R: () => number) => r(R, 0, 359);
const tilt = (R: () => number) => r(R, -25, 25);
/** labels for all three sides of a triangle from side lengths by vertex index */
const labs = (s: readonly number[]) => ({ 0: fmt(s[0]!), 1: fmt(s[1]!), 2: fmt(s[2]!) });
const setOf = (R: () => number) => pick(R, SIDE_SETS).slice() as number[];
/** the sides by vertex index in a random order (the triangle is not drawn with its shortest side first) */
const scramble = (R: () => number, s: number[]) => shuffle(R, s.slice());

// ---------- congruence-as-scale-factor-1 ----------
export const k1Classify: Gen = (R, n) => fitted('k1Classify', () => {
  const k: Q = pick(R, [[1, 1], [2, 1], [1, 2]] as Q[]);
  const b = scramble(R, setOf(R));
  const s1 = k[1] === 2 ? b.map(x => 2 * x) : b, s2 = s1.map(x => (x * k[0]) / k[1]);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(s1, k[0] / k[1], L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const fig = simFig(S2, { l1: labs(s1), l2: labs(s2) });
  const one = k[0] === k[1], kt = qHtml(k);
  const opts: Opt[] = [
    { t: 'Congruent, and also similar with k = 1', ok: one, mc: one ? undefined : MC.sidesEqual, say: one ? 'Right: every ratio is 1, so a rigid motion alone does it. Congruent figures are similar with k = 1.' : `The sides are not equal: each side of ${triN(n2)} is ${kt} times its partner.` },
    { t: 'Congruent, so not similar', mc: MC.special, say: 'Congruent triangles are similar too: k = 1 is a scale factor like any other.' },
    { t: `Similar with k = ${kt}, not congruent`, ok: !one, say: one ? 'Every ratio is 1: the sides are equal, so the triangles are congruent (and similar, k = 1).' : `Right: every ratio is ${kt}, and k ≠ 1, so the sizes differ.` },
    { t: 'Neither: the copy is turned', mc: 'mc.transformations.turned-or-flipped-copy-not-congruent', say: 'A turned or flipped copy still counts: only the side ratios and the angles matter.' },
  ];
  if (one) opts[2]!.t = 'Similar, but not congruent';
  return choice(R, {
    id: `k1Classify-${n}`, family: 'k1Classify',
    prompt: `${simH(L1, n2)}, with the lengths shown. Which describes the pair best?`, board: simT(L1, n2),
    solution: [`Divide partner by partner: ${[0, 1, 2].map(i => `${fmt(s2[i]!)}/${fmt(s1[i]!)}`).join(', ')}.`, `Every ratio is ${kt}.`, one ? 'k = 1: the triangles are congruent, and congruent triangles are similar with k = 1.' : `k = ${kt} ≠ 1: similar, not congruent.`],
    picture: { fig, reveal: {} },
  }, opts);
});
type AST = 'Always' | 'Sometimes' | 'Never';
const CLAIMS: { t: string; a: AST; why: string; mc?: Partial<Record<AST, string>> }[] = [
  { t: 'Congruent triangles are similar.', a: 'Always', why: 'A rigid motion is a similarity with k = 1.', mc: { Never: MC.special, Sometimes: MC.special } },
  { t: 'Similar triangles are congruent.', a: 'Sometimes', why: 'Only when the scale factor is 1.', mc: { Always: MC.sidesEqual } },
  { t: 'A triangle and its image under a dilation with k = 1 are congruent.', a: 'Always', why: 'With k = 1 every length stays the same.' },
  { t: 'Two triangles with scale factor 3 are congruent.', a: 'Never', why: 'Each side of one is 3 times its partner, so the sides cannot be equal.', mc: { Always: MC.sidesEqual } },
  { t: 'Similar triangles with one pair of equal corresponding sides are congruent.', a: 'Always', why: 'One equal pair forces k = 1, so every pair is equal.' },
  { t: 'If two triangles are similar, they are not congruent.', a: 'Sometimes', why: 'They are congruent exactly when k = 1.', mc: { Always: MC.special } },
];
export const k1Claim: Gen = (R, n) => {
  const k = pick(R, [[2, 1], [3, 1], [1, 2], [3, 2], [2, 3], [5, 2]] as Q[]), kt = k[1] === 1 ? String(k[0]) : `${k[0]}/${k[1]}`;
  const [L1, L2] = names2(R);
  const extra: { t: string; a: AST; why: string; mc?: Partial<Record<AST, string>> }[] = [
    { t: `Two triangles with scale factor ${kt} are congruent.`, a: 'Never', why: `Each side of one is ${kt} times its partner, so the sides cannot be equal.`, mc: { Always: MC.sidesEqual } },
    { t: `A triangle and its image under a dilation with k = ${kt} are similar.`, a: 'Always', why: 'A dilation is a similarity transformation.' },
    { t: `If ${triN(L1)} ≅ ${triN(L2)}, then ${triN(L1)} ~ ${triN(L2)}.`, a: 'Always', why: 'Congruent triangles are similar with k = 1.', mc: { Never: MC.special, Sometimes: MC.special } },
    { t: `If ${triN(L1)} ~ ${triN(L2)}, then ${triN(L1)} ≅ ${triN(L2)}.`, a: 'Sometimes', why: 'Only when the scale factor is 1.', mc: { Always: MC.sidesEqual } },
  ];
  const c = pick(R, [...CLAIMS, ...extra, ...extra]);
  const opts: Opt[] = (['Always', 'Sometimes', 'Never'] as const).map(x => ({ t: x, ok: x === c.a, mc: x === c.a ? undefined : c.mc?.[x], say: x === c.a ? `Right: ${c.why}` : c.why }));
  return choice(R, {
    id: `k1Claim-${n}`, family: 'k1Claim', prompt: `Always, sometimes or never? ${A(c.t)}`, board: '\\cong\\ \\text{and}\\ \\sim',
    solution: ['Congruent means similar with scale factor k = 1.', c.why],
    picture: { card: { lines: [c.t, 'Always, sometimes or never?'] }, reveal: {} },
  }, opts, true);
};

// ---------- aa-criterion ----------
/** three distinct whole angles (all ≥ 30°, pairwise ≥ 7° apart): acute, right or obtuse */
function angles3(R: () => number, kind: 'acute' | 'right' | 'obtuse'): number[] {
  for (;;) {
    const a = r(R, 30, 80), b = r(R, 30, 80), c = kind === 'right' ? 90 : 180 - a - b;
    const A2 = kind === 'right' ? [a, 90 - a, 90] : [a, b, c];
    if (A2.some(x => x < 30)) continue;
    if (kind === 'acute' && A2.some(x => x >= 85)) continue;
    if (kind === 'obtuse' && !A2.some(x => x >= 100 && x <= 125)) continue;
    const s = A2.slice().sort((x, y) => x - y);
    if (s[1]! - s[0]! < 7 || s[2]! - s[1]! < 7) continue;
    return shuffle(R, A2);
  }
}
/** a triangle with angles ang (by vertex index), V0V1 = base */
const triAng = (ang: number[], base: number) => triASA(ang[0]!, base, ang[1]!);
export const aaThird: Gen = (R, n) => fitted('aaThird', () => {
  const kind = pick(R, ['acute', 'acute', 'right', 'obtuse'] as const);
  const a1 = angles3(R, kind);
  const cs = pick(R, ['hidden', 'hidden', 'same', 'not'] as const);
  let a2 = a1.slice();
  if (cs === 'not') {
    let ok = false;
    for (let k = 0; k < 60 && !ok; k++) { const d = r(R, 28, 180 - a1[0]! - 28), e = 180 - a1[0]! - d; if (e < 28) continue; if (Math.min(...[d, e].map(x => Math.min(...a1.map(y => Math.abs(x - y))))) < 6) continue; a2 = [a1[0]!, d, e]; ok = true; }
    if (!ok) return fitFail();
  }
  const k = pick(R, [0.6, 0.75, 1.3, 1.5]);
  const T1 = turnTri(triAng(a1, 300), tilt(R));
  const T2 = placeBeside(T1, triAng(a2, 300 * k), rot2(R), R() < 0.5, 'row');
  const [L1, L2] = names2(R);
  const P: Record<string, Pt> = {};
  [0, 1, 2].forEach(i => { P[L1[i]!] = T1[i]!; P[L2[i]!] = T2[i]!; });
  // T1 shows its angles 0 and 1; T2 shows 0 and 2 (hidden third) or 0 and 1
  const show2 = cs === 'hidden' ? [0, 2] : [0, 1];
  const S2 = { T1, T2, n1: L1, n2: L2, s1: [], s2: [], P };
  const fig = simFig(S2, { a1: { 0: deg(a1[0]!), 1: deg(a1[1]!) }, a2: { [show2[0]!]: deg(a2[show2[0]!]!), [show2[1]!]: deg(a2[show2[1]!]!) } });
  const third1 = 180 - a1[0]! - a1[1]!, third2 = 180 - a2[show2[0]!]! - a2[show2[1]!]!;
  const sim = cs !== 'not';
  return choice(R, {
    id: `aaThird-${n}`, family: 'aaThird',
    prompt: `Two angles of each triangle are labelled. Are ${triN(L1)} and ${triN(L2)} similar?`, board: `${triT2(L1)} \\overset{?}{\\sim} ${triT2(L2)}`,
    solution: [`Third angle of ${triN(L1)}: 180° − ${a1[0]}° − ${a1[1]}° = ${third1}°. Third angle of ${triN(L2)}: 180° − ${a2[show2[0]!]}° − ${a2[show2[1]!]}° = ${third2}°.`, `Angle sets: ${set(a1)} and ${set(a2)}.`, sim ? 'They match: two pairs of equal angles are enough (AA).' : 'The sets differ, so no correspondence can match all three angles.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Similar by AA', ok: sim, mc: sim ? undefined : MC.aaListed, say: sim ? 'Right: with the third angles worked out, two angle pairs match.' : `Work out the third angles: the sets ${set(a1)} and ${set(a2)} differ.` },
    { t: 'Not similar: the angle sets cannot be matched', ok: !sim, mc: sim ? MC.aaListed : undefined, say: sim ? `Do not compare only the labelled angles: the third angles complete the sets, ${set(a1)} and ${set(a2)}.` : 'Right: the full angle sets differ.' },
    { t: 'Not enough information: AA needs all three angle pairs labelled', mc: MC.allParts, say: 'Two angles fix the third (the sum is 180°), so two labelled angles per triangle are enough to decide.' },
    { t: 'Congruent: the angles match', mc: MC.aaaCong, say: 'Equal angles fix the shape, not the size: at most similar.' },
  ], true);
});
const set = (a: number[]) => `{${a.slice().sort((x, y) => x - y).join('°, ')}°}`;
const triT2 = (s: string) => `\\triangle ${s}`;
export const aaMissing: Gen = (R, n) => fitted('aaMissing', () => {
  const a1 = angles3(R, pick(R, ['acute', 'obtuse', 'acute'] as const));
  const [L1, L2] = names2(R), perm = pick(R, PERM6), n2 = permOf(L2, perm);
  const k = pick(R, [0.6, 0.7, 1.4, 1.6]);
  const T1 = turnTri(triAng(a1, 300), tilt(R));
  const T2 = placeBeside(T1, triAng(a1, 300 * k), rot2(R), R() < 0.5, 'row');
  const P: Record<string, Pt> = {};
  [0, 1, 2].forEach(i => { P[L1[i]!] = T1[i]!; P[n2[i]!] = T2[i]!; });
  const S2 = { T1, T2, n1: L1, n2, s1: [], s2: [], P };
  const ask = R() < 0.7 ? 2 : r(R, 0, 1);
  const fig = simFig(S2, { a1: { 0: deg(a1[0]!), 1: deg(a1[1]!) }, a2: { [ask]: '?' } });
  const v = a1[ask]!;
  fig.angles.find(g => g.id === angIdOf(n2, ask))!.alt = deg(v);
  const wrongs = [0, 1, 2].filter(j => j !== ask && a1[j] !== v).map(j => ({ v: a1[j]!, mc: MC.byPosition, say: `∠${n2[ask]} corresponds to ∠${L1[ask]}: match by the places in the statement, not by the page.` }));
  return numItem({
    id: `aaMissing-${n}`, family: 'aaMissing',
    prompt: `${simH(L1, n2)}. What is m∠${n2[ask]}?`, board: `${simT(L1, n2)},\\ m\\angle ${n2[ask]} = \\,?`, unit: '°',
    solution: [`Letter under letter: ${[0, 1, 2].map(i => `${L1[i]} ↔ ${n2[i]}`).join(', ')}.`, ask === 2 ? `∠${n2[2]} matches ∠${L1[2]} = 180° − ${a1[0]}° − ${a1[1]}° = ${v}°.` : `∠${n2[ask]} matches ∠${L1[ask]} = ${v}°.`, `m∠${n2[ask]} = <b class="s">${v}</b>°.`],
    picture: { fig, reveal: { solved: [angIdOf(n2, ask)] } },
  }, v, wrongs, 'Right: corresponding angles of similar triangles are equal.', 'Find the angle of the first triangle in the same place of the statement.');
});
const angIdOf = (nm: string, i: number) => nm[(i + 1) % 3]! + nm[i]! + nm[(i + 2) % 3]!;

// ---------- sss-similarity ----------
const KS: Q[] = [[2, 1], [3, 2], [2, 3], [3, 1], [1, 2], [5, 2], [4, 3], [3, 4]];
/** a side set that scales by k = p/q to whole or .5 numbers */
function scaled(R: () => number, k: Q): { s1: number[]; s2: number[] } {
  for (;;) {
    const b = setOf(R), m = k[1] === 1 ? 1 : k[1];
    const s1 = b.map(x => x * m), s2 = s1.map(x => (x * k[0]) / k[1]);
    if (Math.max(...s1, ...s2) <= 36) return { s1, s2 };
  }
}
export const sssCheck: Gen = (R, n) => fitted('sssCheck', () => {
  const cs = pick(R, ['sim', 'sim', 'oneOff', 'additive'] as const);
  const k = pick(R, KS.filter(x => x[0] > x[1]));
  let { s1, s2 } = scaled(R, k);
  if (cs === 'oneOff') { const i = r(R, 0, 2); s2 = s2.slice(); s2[i] = s2[i]! + pick(R, [-1, 1]) * (s2[i]! > 8 ? 2 : 1); }
  if (cs === 'additive') { const d = r(R, 2, 4); s2 = s1.map(x => x + d); }
  const srt = (a: number[]) => a.slice().sort((x, y) => x - y);
  const a = srt(s1), b = srt(s2);
  if (cs === 'oneOff') { const rs = [0, 1, 2].map(i => b[i]! / a[i]!); if (new Set(rs.map(x => x.toFixed(6))).size !== 2) return fitFail(); if (b[0]! + b[1]! <= b[2]!) return fitFail(); }
  const o1 = scramble(R, s1), o2 = scramble(R, s2);
  const [L1, L2] = names2(R);
  const S2 = simPair(o1, 1, L1, L2, { s2: o2, rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const fig = simFig(S2, { l1: labs(o1), l2: labs(o2) });
  const sim = cs === 'sim';
  const ratios = [0, 1, 2].map(i => `${fmt(b[i]!)}/${fmt(a[i]!)}`).join(', ');
  return choice(R, {
    id: `sssCheck-${n}`, family: 'sssCheck', prompt: `Are ${triN(L1)} and ${triN(L2)} similar?`, board: `${triT2(L1)} \\overset{?}{\\sim} ${triT2(L2)}`,
    solution: [`Sort each triangle's sides: ${a.map(fmt).join(', ')} and ${b.map(fmt).join(', ')}.`, `Pair them by size and divide: ${ratios}.`, sim ? `Every ratio is ${qHtml(k)}: similar by SSS~.` : 'The ratios are not all equal: not similar.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Similar by SSS~: all three side ratios are equal', ok: sim, mc: sim ? undefined : cs === 'additive' ? MC.additive : MC.oneRatio, say: sim ? 'Right: one common ratio across all three pairs.' : `Check all three ratios: ${ratios}.` },
    { t: 'Not similar: the three side ratios are not all equal', ok: !sim, say: sim ? `Pair the sides by size: ${ratios} are all ${qHtml(k)}.` : 'Right: one ratio differs, so no scale factor fits.' },
    { t: 'Similar: each side is longer by the same amount', mc: MC.additive, say: 'Similar means multiplied by one factor, not added to: compare ratios, not differences.' },
    { t: 'Not enough information: the angles are needed too', mc: MC.allParts, say: 'Three side lengths fix a triangle: SSS~ needs no angles.' },
  ], true);
});
function fitFail(): never { throw new Error('retry'); }
export const sssRatio: Gen = (R, n) => fitted('sssRatio', () => {
  const k = pick(R, KS);
  const { s1, s2 } = scaled(R, k);
  const o1 = scramble(R, s1), o2 = scramble(R, s2);
  // the listed order must not happen to pair the right sides first
  if (Math.abs(o2[0]! / o1[0]! - k[0] / k[1]) < 1e-9) return fitFail();
  const [L1, L2] = names2(R);
  const S2 = simPair(o1, 1, L1, L2, { s2: o2, rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const fig = simFig(S2, { l1: labs(o1), l2: labs(o2) });
  const lw = red(Math.round(o2[0]! * 2), Math.round(o1[0]! * 2)), inv: Q = [k[1], k[0]];
  const wrongs: { v: number; mc?: string; say: string }[] = [{ v: lw[0] / lw[1], mc: MC.listOrder, say: 'Pair the sides by size (shortest with shortest), not by the order they are listed.' }];
  if (k[0] < k[1]) wrongs.push({ v: k[1] / k[0], mc: MC.largerOver, say: `The direction is from ${triN(L1)} to ${triN(L2)}: new over old, which is less than 1 here.` });
  else wrongs.push({ v: k[1] / k[0], mc: MC.inconsistent, say: `From ${triN(L1)} to ${triN(L2)}: a side of ${triN(L2)} over its partner in ${triN(L1)}.` });
  void inv;
  const a = s1.slice().sort((x, y) => x - y), b = s2.slice().sort((x, y) => x - y);
  return fracItem({
    id: `sssRatio-${n}`, family: 'sssRatio',
    prompt: `The triangles are similar. ${triN(L1)} has sides ${o1.map(fmt).join(', ')}; ${triN(L2)} has sides ${o2.map(fmt).join(', ')}. What is the scale factor from ${triN(L1)} to ${triN(L2)}?`,
    board: `k = \\frac{\\text{side of } \\triangle ${L2}}{\\text{side of } \\triangle ${L1}}`, unit: '',
    solution: [`Sort both: ${a.map(fmt).join(', ')} and ${b.map(fmt).join(', ')}.`, `Shortest over shortest: ${fmt(b[0]!)}/${fmt(a[0]!)}; the other pairs give the same.`, `k = ${S(qHtml(k))}.`],
    picture: { fig, reveal: {} },
  }, k[0], k[1], wrongs, 'Right: new over old, sides paired by size.', 'Pair the sides by size, then divide a side of the second triangle by its partner.');
});

// ---------- sas-similarity ----------
export const sasCheck: Gen = (R, n) => fitted('sasCheck', () => {
  const cs = pick(R, ['sas', 'sas', 'ssa', 'mixed'] as const);
  const k = pick(R, KS.filter(x => x[0] !== x[1]));
  // T1: sides x (V0V1) and y (V0V2) with the angle t at V0 (included); SSA: the angle at V1 instead
  const x0 = cs === 'ssa' ? r(R, 5, 9) : r(R, 3, 7), y0 = cs === 'ssa' ? x0 - r(R, 1, 3) : x0 + r(R, 2, 4), m = k[1];
  const x = x0 * m, y = y0 * m, t = r(R, 38, 70);
  const u = 400 / (Math.max(x, y) * Math.max(1, k[0] / k[1]) * 1.5);
  const T1: [Pt, Pt, Pt] = [[0, 0], [x * u, 0], at([0, 0], t, y * u)];
  const kk = k[0] / k[1];
  let T2src: [Pt, Pt, Pt] = T1.map(p => mul(p, kk)) as [Pt, Pt, Pt];
  const ang1 = anglesOf(T1);
  // SSA: the angle at V1 (opposite y), between x and the third side; y opposite. Ambiguous when the angle is acute
  // and y < x (the shorter given side opposite the angle): build the other triangle with the same x, y and angle.
  if (cs === 'ssa') {
    const b1 = ang1[1]!;
    if (b1 >= 80 || y >= x) return fitFail();
    // C on the ray from V1 at angle 180 - b1 with |V0 C| = y: two solutions
    const d = dirv(180 - b1), V1: Pt = [x * u, 0], w: Pt = [-V1[0], -V1[1]];
    const pr = d[0] * w[0] + d[1] * w[1], disc = pr * pr - ((x * u) ** 2 - (y * u) ** 2);
    if (disc <= 0) return fitFail();
    const t1 = pr - Math.sqrt(disc), t2 = pr + Math.sqrt(disc);
    const C1 = add(V1, mul(d, t1)), C2 = add(V1, mul(d, t2));
    const other = Math.abs(C1[0] - T1[2][0]) + Math.abs(C1[1] - T1[2][1]) < 1e-6 ? C2 : C1;
    if (Math.abs(t2 - t1) < 0.3 * Math.min(t1, t2) || Math.min(t1, t2) <= 0) return fitFail();
    T2src = ([[0, 0], V1, other] as [Pt, Pt, Pt]).map(p => mul(p, kk)) as [Pt, Pt, Pt];
  }
  if (cs === 'mixed') {
    // T2 keeps the sides k·x and k·y, but its marked angle (equal to t) sits at V1, not between them
    const X = x * kk * u, Y = y * kk * u;
    // V0 (0,0), V1 (X,0), angle t at V1, |V0 V2| = Y: solve on the ray from V1
    const d = dirv(180 - t), V1: Pt = [X, 0], w: Pt = [-X, 0];
    const pr = d[0] * w[0] + d[1] * w[1], disc = pr * pr - (X * X - Y * Y);
    if (disc <= 0) return fitFail();
    const tt = pr + Math.sqrt(disc);
    T2src = [[0, 0], V1, add(V1, mul(d, tt))];
  }
  const T1t = turnTri(T1, tilt(R));
  const T2 = placeBeside(T1t, T2src, rot2(R), R() < 0.5, 'row');
  const [L1, L2] = names2(R);
  const P: Record<string, Pt> = {};
  [0, 1, 2].forEach(i => { P[L1[i]!] = T1t[i]!; P[L2[i]!] = T2[i]!; });
  const S2 = { T1: T1t, T2, n1: L1, n2: L2, s1: [], s2: [], P };
  const xs = fmt(x), ys = fmt(y), X2 = fmt(x * kk), Y2 = fmt(y * kk);
  const aIdx1 = cs === 'ssa' ? 1 : 0, aIdx2 = cs === 'sas' ? 0 : 1;
  const fig = simFig(S2, { l1: { 2: xs, 1: ys }, l2: { 2: X2, 1: Y2 }, arcs1: { [aIdx1]: 1 }, arcs2: { [aIdx2]: 1 } });
  const yes = cs === 'sas';
  return choice(R, {
    id: `sasCheck-${n}`, family: 'sasCheck', prompt: `The marked angles are congruent. What do the marks and lengths establish about ${triN(L1)} and ${triN(L2)}?`, board: `\\frac{${X2}}{${xs}} = \\frac{${Y2}}{${ys}} = ${qTexS(k)}`,
    solution: [`Both ratios are ${qHtml(k)}.`, yes ? 'In both triangles the marked angle sits between the two sides: SAS~.' : cs === 'ssa' ? 'In both triangles the marked angle is not between the two sides (SSA): the side opposite it can swing to two places.' : `In ${triN(L2)} the marked angle is not between the two sides, so SAS~ does not apply.`, yes ? 'Similar by SAS~.' : 'So the facts do not settle it.'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Similar by SAS~', ok: yes, mc: yes ? undefined : MC.ssa, say: yes ? 'Right: two proportional side pairs and the angle between them.' : 'SAS~ needs the angle between the two sides, in both triangles.' },
    { t: 'Not enough information: SAS~ needs the angle between the two sides in both triangles', ok: !yes, mc: yes ? MC.validSSA : undefined, say: yes ? 'Here the angle is between the two sides in both: SAS~ applies.' : 'Right: with the angle elsewhere, two different shapes fit the same data.' },
    { t: 'Not similar: no criterion fits', mc: MC.noCritNot, say: yes ? 'SAS~ fits.' : 'No criterion only means the facts do not decide it, not that the triangles are different.' },
    { t: 'Similar by SSA~', mc: MC.ssa, say: 'There is no SSA criterion: two sides and a non-included angle can fit two shapes.' },
  ], true);
});
const qTexS = (k: Q) => (k[1] === 1 ? String(k[0]) : `\\tfrac{${k[0]}}{${k[1]}}`);
export const sasLen: Gen = (R, n) => fitted('sasLen', () => {
  // nested: D on AB, E on AC, the angle at A shared; AD, DB (parts) or AB (whole), AE given; AC asked
  const k = pick(R, [[2, 1], [3, 1], [5, 2], [3, 2], [5, 3], [4, 3]] as Q[]);
  const AD = r(R, 2, 6) * k[1], AE = r(R, 2, 7) * k[1];
  if (AD === AE) return fitFail();
  const AB = (AD * k[0]) / k[1], AC = (AE * k[0]) / k[1], DB = AB - AD;
  const BC = Math.sqrt(AB * AB + AC * AC - 2 * AB * AC * Math.cos((r(R, 48, 72) * Math.PI) / 180));
  const parts = R() < 0.5;
  const P0 = nestedPts(AB, AC, BC, AD / AB, 360 / Math.max(AB, AC, BC));
  const t = relabel(R);
  const P = Object.fromEntries(Object.entries(P0).map(([kk, p]) => [t[kk]!, p]));
  const N = (s: string) => [...s].map(c => t[c]!).join('');
  const ask = R() < 0.5 ? 'AC' : 'EC';
  const labsL = [{ seg: N('AD'), text: fmt(AD) }, { seg: N('AE'), text: fmt(AE) }, ...(parts ? [{ seg: N('DB'), text: fmt(DB) }] : []), ...(ask === 'EC' ? [{ seg: N('EC'), text: '?', alt: fmt(AC - AE) }] : [])];
  const segs = [N('AD'), N('DB'), N('AE'), N('EC'), N('DE'), N('BC')];
  const fig = figOf(P, segs, { labs: labsL, marks: [], fills: [N('ABC')] });
  // the label on EC shows '?' for EC; for AC the question names the whole
  const a = ask === 'AC' ? AC : AC - AE;
  if (!Number.isInteger(a * 2)) return fitFail();
  const wrongs = [
    ...(parts ? [{ v: ask === 'AC' ? (AE * DB) / AD : (AE * DB) / AD - AE, mc: MC.partWhole, say: `Pair whole with whole: ${N('AD')}/${N('AB')} = ${N('AE')}/${N('AC')}, and ${N('AB')} = ${fmt(AD)} + ${fmt(DB)} = ${fmt(AB)}.` }] : []),
    { v: ask === 'AC' ? AE + (AB - AD) : AB - AD, mc: MC.additive, say: 'Similar sides are multiplied by one factor, not lengthened by the same amount.' },
    ...(ask === 'EC' ? [{ v: AC, mc: MC.intermediate, say: `That is ${N('AC')}, the whole side; ${N('EC')} = ${N('AC')} − ${N('AE')}.` }] : []),
  ].filter(w => w.v > 0 && Math.abs(w.v - a) > 1e-9);
  return numItem({
    id: `sasLen-${n}`, family: 'sasLen',
    prompt: `${N('D')} is on ${N('AB')} and ${N('E')} is on ${N('AC')}; the triangles share ∠${N('A')}. ${parts ? `${N('AD')} = ${fmt(AD)}, ${N('DB')} = ${fmt(DB)}` : `${N('AD')} = ${fmt(AD)}, ${N('AB')} = ${fmt(AB)}`}, ${N('AE')} = ${fmt(AE)}. How long must ${N(ask)} be so that ${simH(N('ADE'), N('ABC'))} by SAS~?`,
    board: `\\frac{${N('AD')}}{${N('AB')}} = \\frac{${N('AE')}}{${N('AC')}}`, unit: '',
    solution: [parts ? `The whole side: ${N('AB')} = ${fmt(AD)} + ${fmt(DB)} = ${fmt(AB)}.` : `${N('AB')} = ${fmt(AB)}.`, `SAS~ with the shared angle: ${N('AD')}/${N('AB')} = ${N('AE')}/${N('AC')}, so ${N('AC')} = ${fmt(AE)} × ${fmt(AB)}/${fmt(AD)} = ${fmt(AC)}.`, ask === 'AC' ? `${N('AC')} = <b class="s">${fmt(AC)}</b>.` : `${N('EC')} = ${fmt(AC)} − ${fmt(AE)} = <b class="s">${fmt(a)}</b>.`],
    picture: { fig, reveal: { solved: ask === 'EC' ? [N('EC')] : [] } },
  }, a, wrongs, 'Right: the two sides around the shared angle are in one ratio.', 'Pair the sides around the shared angle, whole with whole, and use one ratio.');
});
/** nested points (role letters A-E): B (0,0), C (BC,0), A from SSS; D, E at fraction f from A */
export function nestedPts(AB: number, AC: number, BC: number, f: number, u: number): Record<string, Pt> {
  const x = (AB * AB - AC * AC + BC * BC) / (2 * BC), y = Math.sqrt(Math.max(0, AB * AB - x * x));
  const Ap: Pt = [x * u, y * u], Bp: Pt = [0, 0], Cp: Pt = [BC * u, 0];
  return { A: Ap, B: Bp, C: Cp, D: add(Ap, mul(add(Bp, mul(Ap, -1)), f)), E: add(Ap, mul(add(Cp, mul(Ap, -1)), f)) };
}
/** random letters for the roles A-E (alphabetical along the roles, never I, L, O) */
export function relabel(R: () => number, roles = 'ABCDE'): Record<string, string> {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split('');
  const out: string[] = [];
  while (out.length < roles.length) { const c = pool[Math.floor(R() * pool.length)]!; if (!out.includes(c)) out.push(c); }
  out.sort();
  return Object.fromEntries([...roles].map((c, i) => [c, out[i]!]));
}

// ---------- aa-from-similarity-transformations ----------
type Crit3 = 'AA' | 'SAS~' | 'SSS~';
const CONG: Record<Crit3, string> = { AA: 'ASA', 'SAS~': 'SAS', 'SSS~': 'SSS' };
export const dilateWhy: Gen = (R, n) => fitted('dilateWhy', () => {
  const c = pick(R, ['AA', 'SAS~', 'SSS~'] as Crit3[]);
  const k = pick(R, [[2, 1], [3, 2], [1, 2], [2, 3]] as Q[]);
  const { s1, s2 } = scaled(R, k);
  const o = scramble(R, [0, 1, 2]);
  const s1o = o.map(i => s1[i]!), s2o = o.map(i => s2[i]!);
  const u = 330 / Math.max(...s1o, ...s2o);
  const T1 = turnTri(triOfS(s1o, u), tilt(R));
  const Ti = turnTri(triOfS(s2o, u), 0);
  const T2 = turnTri(triOfS(s2o, u), rot2(R));
  const flip = R() < 0.5;
  const T2f: typeof T2 = flip ? (T2.map(p => [-p[0], p[1]] as Pt) as typeof T2) : T2;
  const mk = (T: [Pt, Pt, Pt], nm: string, which: 'pre' | 'img' | 'tgt'): Fig => {
    const P: Record<string, Pt> = { [nm[0]!]: T[0], [nm[1]!]: T[1], [nm[2]!]: T[2] };
    const labsL = c === 'AA' ? [{ seg: nm[0]! + nm[1]!, text: fmt((which === 'pre' ? s1o : s2o)[2]!) }]
      : c === 'SAS~' ? [{ seg: nm[0]! + nm[1]!, text: fmt((which === 'pre' ? s1o : s2o)[2]!) }, { seg: nm[0]! + nm[2]!, text: fmt((which === 'pre' ? s1o : s2o)[1]!) }]
        : [0, 1, 2].map(i => ({ seg: nm[(i + 1) % 3]! + nm[(i + 2) % 3]!, text: fmt((which === 'pre' ? s1o : s2o)[i]!) }));
    const marks = c === 'AA' ? [{ ang: nm[1]! + nm[0]! + nm[2]!, n: 1 }, { ang: nm[0]! + nm[1]! + nm[2]!, n: 2 }] : c === 'SAS~' ? [{ ang: nm[1]! + nm[0]! + nm[2]!, n: 1 }] : [];
    return figOf(P, [nm[0]! + nm[1]!, nm[1]! + nm[2]!, nm[0]! + nm[2]!], { labs: labsL, marks, fills: [nm] });
  };
  const figs = [mk(T1, 'ABC', 'pre'), mk(Ti, 'PQR', 'img'), mk(T2f, 'DEF', 'tgt')];
  const kt = qHtml(k);
  const finish = R() < 0.4;
  const opts: Opt[] = finish ? [
    { t: 'A rigid motion carries △PQR onto △DEF, so the dilation and then that motion carry △ABC onto △DEF', ok: true, say: 'Right: a dilation followed by a rigid motion is a similarity transformation.' },
    { t: 'The dilation alone carries △ABC onto △DEF', mc: MC.wholeFig, say: 'The dilation gives the right size, but △PQR still has to be moved onto △DEF.' },
    { t: '△ABC ≅ △DEF, because △PQR ≅ △DEF', mc: MC.sidesEqual, say: `△ABC is not congruent to △DEF: its sides are ${k[0] < k[1] ? 'longer' : 'shorter'} (k = ${kt}).` },
    { t: 'Nothing more: congruence says nothing about similarity', mc: MC.special, say: 'A congruence is a rigid motion; after the dilation it finishes the similarity.' },
  ] : [
    { t: `${CONG[c]}: the dilation keeps the angles and multiplies every side by ${kt}`, ok: true, say: `Right: the image has the matching ${c === 'AA' ? 'side between the two equal angles' : c === 'SAS~' ? 'two sides and the angle between them' : 'three sides'}.` },
    { t: 'It looks the same as △DEF', mc: MC.wholeFig, say: 'Looking alike proves nothing: name the congruence criterion the image meets.' },
    { t: 'AAA: all three angles match', mc: MC.aaaCong, say: 'Equal angles do not fix the size: the image matches because of a side as well (ASA).' },
    { t: c === 'SSS~' ? 'SAS: two sides match' : 'SSS: every side was multiplied by the same k', mc: c === 'SSS~' ? MC.noHyp : MC.badK, say: c === 'SSS~' ? 'No angle is given here: the three sides make it SSS.' : 'Only the marked sides are known to scale to their partners: use what is given.' },
  ];
  return choice(R, {
    id: `dilateWhy-${n}`, family: 'dilateWhy',
    prompt: `Proving ${c}: dilate △ABC by k = ${kt} to get △PQR. ${finish ? '△PQR ≅ △DEF. What finishes the proof that △ABC ~ △DEF?' : 'Why is △PQR ≅ △DEF?'}`,
    board: `\\triangle ABC \\xrightarrow{\\ k = ${qTexS(k)}\\ } \\triangle PQR`,
    solution: [`The dilation keeps every angle and multiplies every length by ${kt}.`, finish ? '△PQR ≅ △DEF gives a rigid motion carrying △PQR onto △DEF.' : `So △PQR has the parts of △DEF that ${c} asks for: ${CONG[c]}.`],
    picture: { gallery: { figs, caps: ['△ABC', `dilated by ${qPlain(k)}`, '△DEF'] }, reveal: { cell: finish ? 2 : 1 } },
  }, opts);
});
const qPlain = (k: Q) => (k[1] === 1 ? String(k[0]) : `${k[0]}/${k[1]}`);
/** a triangle from side lengths by vertex index */
function triOfS(s: number[], u: number): [Pt, Pt, Pt] {
  const a = s[0]! * u, b = s[1]! * u, c = s[2]! * u, x = (b * b + c * c - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x));
  return [[0, 0], [c, 0], [x, y]];
}
export const dilateK: Gen = (R, n) => fitted('dilateK', () => {
  const k = pick(R, KS);
  const { s1, s2 } = scaled(R, k);
  const [L1, L2] = names2(R), n2 = permOf(L2, pick(R, PERM6));
  const S2 = simPair(s1, k[0] / k[1], L1, n2, { rot1: tilt(R), rot2: rot2(R), flip: R() < 0.5 });
  const i = r(R, 0, 2);
  const fig = simFig(S2, { l1: { [i]: fmt(s1[i]!) }, l2: { [i]: fmt(s2[i]!) }, arcs: { [(i + 1) % 3]: 1, [(i + 2) % 3]: 2 } });
  const sA = sideOf(L1, i), sB = sideOf(n2, i);
  const wrongs = [{ v: k[1] / k[0], mc: k[0] < k[1] ? MC.largerOver : MC.badK, say: `The image of ${triN(L1)} must have ${sB} = ${fmt(s2[i]!)}: k = ${sB}/${sA}, new over old.` }];
  return fracItem({
    id: `dilateK-${n}`, family: 'dilateK',
    prompt: `The marked angles show ${simH(L1, n2)} by AA. To prove it, dilate ${triN(L1)} so that its image is congruent to ${triN(n2)} (by ASA). What scale factor?`,
    board: `k = \\frac{${sB}}{${sA}}`, unit: '',
    solution: [`The image's side ${sA} must become ${sB} = ${fmt(s2[i]!)}.`, `k = ${fmt(s2[i]!)}/${fmt(s1[i]!)} = ${S(qHtml(k))}.`],
    picture: { fig, reveal: {} },
  }, k[0], k[1], wrongs, 'Right: new over old, so the image side equals its partner.', 'Divide the side of the target triangle by its partner in the triangle you dilate.');
});

/** an acute angle (whole degrees, 28-48) for SSA with the angle opposite the shorter side `short` and next to `long`:
 *  two triangles fit (short > long·sin a), and they differ clearly */
export function ambAngle(R: () => number, long: number, short: number): number | null {
  const ok: number[] = [];
  for (let a = 28; a <= 48; a++) { const sn = Math.sin((a * Math.PI) / 180); if (short < long && short > long * sn * 1.08 && short < long * 0.97) ok.push(a); }
  return ok.length ? pick(R, ok) : null;
}

// ---------- insufficient-vs-not-similar ----------
type Ev = 'est' | 'nei' | 'not';
interface EvCase { lines: [string, string]; ev: Ev; why: string; mc?: Partial<Record<Ev, string>> }
function evCase(R: () => number): EvCase {
  const [L1, L2] = names2(R);
  const v = (nm: string, i: number) => nm[i]!;
  const sd = (nm: string, i: number, j: number) => nm[i]! + nm[j]!;
  const kind = pick(R, ['oneAngle', 'twoSides', 'ssa', 'angleSets', 'ratios', 'swapped', 'aa'] as const);
  switch (kind) {
    case 'oneAngle': { const a = r(R, 35, 75); return { lines: [`${triN(L1)}: m∠${v(L1, 0)} = ${a}°`, `${triN(L2)}: m∠${v(L2, 0)} = ${a}°`], ev: 'nei', why: 'One angle pair fixes neither the other angles nor the side ratios.', mc: { not: MC.noCritNot } }; }
    case 'twoSides': { const x = r(R, 3, 6), y = x + r(R, 2, 4), k = pick(R, [2, 3]); return { lines: [`${triN(L1)}: ${sd(L1, 0, 1)} = ${x}, ${sd(L1, 1, 2)} = ${y}`, `${triN(L2)}: ${sd(L2, 0, 1)} = ${x * k}, ${sd(L2, 1, 2)} = ${y * k}`], ev: 'nei', why: 'Two proportional side pairs alone leave the angle between them free.', mc: { not: MC.noCritNot, est: MC.oneRatio } }; }
    case 'ssa': { const x = r(R, 6, 9), y = x - r(R, 2, 3), a = ambAngle(R, x, y), k = pick(R, [2, 3]); if (a === null) return evCase(R); return { lines: [`${triN(L1)}: ${sd(L1, 0, 1)} = ${x}, ${sd(L1, 1, 2)} = ${y}, m∠${v(L1, 0)} = ${a}°`, `${triN(L2)}: ${sd(L2, 0, 1)} = ${x * k}, ${sd(L2, 1, 2)} = ${y * k}, m∠${v(L2, 0)} = ${a}°`], ev: 'nei', why: `The angle at ${v(L1, 0)} is not between the two sides, and it is acute and opposite the shorter side: SSA can fit two different shapes.`, mc: { est: MC.ssa, not: MC.noCritNot } }; }
    case 'angleSets': {
      for (;;) {
        const a = r(R, 35, 60), b = r(R, 45, 75), c = 180 - a - b, d = b + pick(R, [-1, 1]) * r(R, 9, 15), e = 180 - a - d;
        if (c < 30 || e < 30 || [b, c].some(x => Math.abs(x - d) < 4 || Math.abs(x - e) < 4)) continue;
        return { lines: [`${triN(L1)}: m∠${v(L1, 0)} = ${a}°, m∠${v(L1, 1)} = ${b}°`, `${triN(L2)}: m∠${v(L2, 0)} = ${a}°, m∠${v(L2, 1)} = ${d}°`], ev: 'not', why: `The angle sets are {${[a, b, c].sort((x, y) => x - y).join('°, ')}°} and {${[a, d, e].sort((x, y) => x - y).join('°, ')}°}: no correspondence matches them.`, mc: { est: MC.aaListed } };
      }
    }
    case 'ratios': {
      const base = pick(R, [[4, 6, 8], [3, 5, 6], [4, 5, 7], [5, 6, 9]]), k = 1.5;
      const t = base.map(x => x * k); const j = r(R, 0, 2); t[j] = t[j]! + 1;
      return { lines: [`${triN(L1)}: sides ${base.join(', ')}`, `${triN(L2)}: sides ${t.map(fmt).join(', ')}`], ev: 'not', why: `Sorted, the ratios are ${[0, 1, 2].map(i => `${fmt(t.slice().sort((x, y) => x - y)[i]!)}/${base.slice().sort((x, y) => x - y)[i]}`).join(', ')}: not all equal, and sorting is the only pairing that could work.`, mc: { est: MC.oneRatio, nei: MC.allParts } };
    }
    case 'swapped': { const a = r(R, 35, 55), b = a + r(R, 12, 30); return { lines: [`${triN(L1)}: m∠${v(L1, 0)} = ${a}°, m∠${v(L1, 1)} = ${b}°`, `${triN(L2)}: m∠${v(L2, 0)} = ${b}°, m∠${v(L2, 1)} = ${a}°`], ev: 'est', why: `Match ${v(L1, 0)} with ${v(L2, 1)} and ${v(L1, 1)} with ${v(L2, 0)}: two angle pairs, AA.`, mc: { not: MC.failedSearch, nei: MC.allParts } }; }
    case 'aa': { const a = r(R, 35, 60), b = r(R, 40, 75); return { lines: [`${triN(L1)}: m∠${v(L1, 0)} = ${a}°, m∠${v(L1, 2)} = ${b}°`, `${triN(L2)}: m∠${v(L2, 0)} = ${a}°, m∠${v(L2, 2)} = ${b}°`], ev: 'est', why: 'Two angle pairs: AA.', mc: { nei: MC.allParts, not: MC.aaListed } }; }
  }
}
const EV_T: Record<Ev, string> = { est: 'Similar: a criterion establishes it', nei: 'Not enough information', not: 'Not similar: no correspondence can work' };
export const evidence: Gen = (R, n) => {
  const c = evCase(R);
  return choice(R, {
    id: `evidence-${n}`, family: 'evidence', prompt: `All you know: ${c.lines.join('; ')}. What do these facts establish?`, board: '\\text{established?}',
    solution: [c.why],
    picture: { card: { lines: [c.lines[0], c.lines[1], 'Nothing else is known.'] }, reveal: {} },
  }, (['est', 'nei', 'not'] as Ev[]).map(e => ({ t: EV_T[e], ok: e === c.ev, mc: e === c.ev ? undefined : c.mc?.[e], say: e === c.ev ? `Right: ${c.why}` : c.why })), true);
};
export const evidenceJudge: Gen = (R, n) => {
  const who = pick(R, NAMES), [L1, L2] = names2(R);
  const kind = pick(R, ['swap', 'noCrit', 'sorted'] as const);
  if (kind === 'swap') {
    const a = r(R, 35, 50), b = a + r(R, 15, 30);
    const claim = `m∠${L1[0]} = ${a}° and m∠${L1[1]} = ${b}°, but m∠${L2[0]} = ${b}° and m∠${L2[1]} = ${a}°. ∠${L1[0]} does not match ∠${L2[0]}, so the triangles are not similar.`;
    return choice(R, {
      id: `evidenceJudge-${n}`, family: 'evidenceJudge', prompt: `${who} says: ${A(claim)} Is ${who} right?`, board: '\\text{right or wrong?}',
      solution: [`${who} tried one correspondence only.`, `Match ${L1[0]} with ${L2[1]} and ${L1[1]} with ${L2[0]}: two angle pairs, so AA holds.`],
      picture: { card: { lines: [`${who}: “${claim}”`] }, reveal: {} },
    }, [
      { t: `No: matching ${L1[0]} with ${L2[1]} and ${L1[1]} with ${L2[0]} gives AA, so they are similar`, ok: true, say: 'Right: a disproof must rule out every correspondence.' },
      { t: `Yes: ∠${L1[0]} and ∠${L2[0]} have different measures`, mc: MC.failedSearch, say: 'One failed matching proves nothing: try the other correspondences.' },
      { t: 'Yes: the angles are listed in a different order', mc: MC.byPosition, say: 'The order of listing is not a correspondence: match equal angles.' },
      { t: 'No: but only because AA needs all three angles', mc: MC.allParts, say: 'Two angle pairs are enough; the point is the other correspondence.' },
    ]);
  }
  if (kind === 'noCrit') {
    const a = r(R, 35, 70);
    const claim = `The only fact is m∠${L1[0]} = m∠${L2[0]} = ${a}°. No similarity criterion fits, so the triangles are not similar.`;
    return choice(R, {
      id: `evidenceJudge-${n}`, family: 'evidenceJudge', prompt: `${who} says: ${A(claim)} Is ${who} right?`, board: '\\text{right or wrong?}',
      solution: ['No criterion fits one angle pair.', 'That leaves the question open: not enough information, not a disproof.'],
      picture: { card: { lines: [`${who}: “${claim}”`] }, reveal: {} },
    }, [
      { t: 'No: no criterion only means not enough information', ok: true, say: 'Right: the triangles might be similar or not.' },
      { t: 'Yes: without a criterion they cannot be similar', mc: MC.noCritNot, say: 'Missing evidence is not a disproof: a second angle pair could still make them similar.' },
      { t: 'No: one angle pair is enough for AA', mc: MC.aaListed, say: 'AA needs two angle pairs.' },
    ]);
  }
  const base = pick(R, [[4, 6, 8], [6, 8, 10], [4, 5, 7], [5, 7, 9]]), t = base.map(x => x * 1.5); t[2] = t[2]! + 1;
  const claim = `${triN(L1)} has sides ${base.join(', ')} and ${triN(L2)} has sides ${t.map(fmt).join(', ')}. Sorted, the ratios are ${[0, 1, 2].map(i => `${fmt(t[i]!)}/${base[i]}`).join(', ')}: not all equal, so the triangles are not similar.`;
  return choice(R, {
    id: `evidenceJudge-${n}`, family: 'evidenceJudge', prompt: `${who} says: ${A(claim)} Is ${who} right?`, board: '\\text{right or wrong?}',
    solution: ['Any similarity must pair shortest with shortest, middle with middle, longest with longest.', 'That pairing fails, so no correspondence works.'],
    picture: { card: { lines: [`${who}: “${claim}”`] }, reveal: {} },
  }, [
    { t: 'Yes: sorting is the only pairing that could work, and it fails', ok: true, say: 'Right: that rules out every correspondence at once.' },
    { t: 'No: two ratios match, so they are similar', mc: MC.oneRatio, say: 'All three ratios must be equal.' },
    { t: 'No: another order of the sides might still work', mc: MC.listOrder, say: 'Any other pairing puts a short side with a long one, which gives ratios even further apart.' },
    { t: 'No: side lengths alone never settle similarity', mc: MC.allParts, say: 'Three sides fix a triangle: the sorted ratios decide.' },
  ]);
};

// ---------- classify-congruent-similar-neither ----------
type Cat = 'cong' | 'und' | 'simnot' | 'nei' | 'not';
const CAT_T: Record<Cat, string> = { cong: 'Congruent (so similar, k = 1)', und: 'Similar; congruence not determined', simnot: 'Similar and not congruent (k ≠ 1)', nei: 'Not enough information', not: 'Not similar' };
interface Fact { lines: string[]; cat: Cat; crit: string; why: string; mc?: Partial<Record<Cat, string>> }
function factSet(R: () => number): Fact {
  const [L1, L2] = names2(R);
  const v = (nm: string, i: number) => nm[i]!, sd = (nm: string, i: number, j: number) => nm[i]! + nm[j]!;
  const kind = pick(R, ['aaa', 'asa', 'aas', 'sss1', 'sssk', 'ssa', 'hl', 'ssaObtuse', 'hlSim', 'angSets'] as const);
  const a = r(R, 35, 60), b = r(R, 45, 75), x = r(R, 4, 9), y = x + r(R, 2, 5);
  switch (kind) {
    case 'aaa': return { lines: [`∠${v(L1, 0)} ≅ ∠${v(L2, 0)}, ∠${v(L1, 1)} ≅ ∠${v(L2, 1)}, ∠${v(L1, 2)} ≅ ∠${v(L2, 2)}`], cat: 'und', crit: 'AA', why: 'Equal angles give similarity (AA), but nothing fixes the size.', mc: { cong: MC.aaaCong, not: MC.noCritNot } };
    case 'asa': return { lines: [`∠${v(L1, 0)} ≅ ∠${v(L2, 0)}, ${sd(L1, 0, 1)} = ${sd(L2, 0, 1)} = ${x}, ∠${v(L1, 1)} ≅ ∠${v(L2, 1)}`], cat: 'cong', crit: 'ASA', why: 'ASA: congruent, and congruent triangles are similar with k = 1.', mc: { und: MC.special, simnot: MC.special } };
    case 'aas': return { lines: [`m∠${v(L1, 0)} = m∠${v(L2, 0)} = ${a}°, m∠${v(L1, 1)} = m∠${v(L2, 1)} = ${b}°, ${sd(L1, 1, 2)} = ${sd(L2, 1, 2)} = ${x}`], cat: 'cong', crit: 'AAS', why: 'AAS: congruent (similar with k = 1).', mc: { und: MC.special } };
    case 'sss1': { const z = y + r(R, 1, 3); if (x + y <= z) return factSet(R); return { lines: [`${triN(L1)}: sides ${x}, ${y}, ${z}`, `${triN(L2)}: sides ${z}, ${x}, ${y}`], cat: 'cong', crit: 'SSS', why: 'The sorted sides are equal: SSS, k = 1.', mc: { simnot: MC.sidesEqual, und: MC.special } }; }
    case 'sssk': { const z = y + r(R, 1, 3); if (x + y <= z) return factSet(R); const k = pick(R, [2, 3]); return { lines: [`${triN(L1)}: sides ${x}, ${y}, ${z}`, `${triN(L2)}: sides ${y * k}, ${z * k}, ${x * k}`], cat: 'simnot', crit: 'SSS~', why: `Sorted, every ratio is ${k}: similar by SSS~, and k = ${k} ≠ 1, so not congruent.`, mc: { cong: MC.sidesEqual, und: MC.special } }; }
    case 'ssa': { const g = ambAngle(R, y, x); if (g === null) return factSet(R); return { lines: [`${sd(L1, 0, 1)} = ${sd(L2, 0, 1)} = ${y}, ${sd(L1, 1, 2)} = ${sd(L2, 1, 2)} = ${x}, m∠${v(L1, 0)} = m∠${v(L2, 0)} = ${g}°`], cat: 'nei', crit: 'none', why: `SSA with an acute angle opposite the shorter side: two different triangles fit.`, mc: { cong: MC.ssa, und: MC.ssa, not: MC.noCritNot } }; }
    case 'hl': return { lines: [`∠${v(L1, 0)} and ∠${v(L2, 0)} are right angles`, `hypotenuses ${sd(L1, 1, 2)} = ${sd(L2, 1, 2)} = ${y}, legs ${sd(L1, 0, 1)} = ${sd(L2, 0, 1)} = ${x}`], cat: 'cong', crit: 'HL', why: 'HL: right angles, equal hypotenuses and one pair of equal legs. Congruent, so similar with k = 1.', mc: { nei: MC.validSSA, und: MC.special } };
    case 'ssaObtuse': return { lines: [`${sd(L1, 0, 1)} = ${sd(L2, 0, 1)} = ${x}, ${sd(L1, 1, 2)} = ${sd(L2, 1, 2)} = ${y}, m∠${v(L1, 0)} = m∠${v(L2, 0)} = ${r(R, 100, 125)}°`], cat: 'cong', crit: 'SSA (obtuse)', why: `The angle at ${v(L1, 0)} is obtuse and opposite the longer side: the swing meets the ray once, so only one triangle fits. Congruent.`, mc: { nei: MC.validSSA } };
    case 'hlSim': { const k = pick(R, [2, 3]); return { lines: [`∠${v(L1, 0)} and ∠${v(L2, 0)} are right angles`, `${triN(L1)}: hypotenuse ${sd(L1, 1, 2)} = ${y}, leg ${sd(L1, 0, 1)} = ${x}`, `${triN(L2)}: hypotenuse ${sd(L2, 1, 2)} = ${y * k}, leg ${sd(L2, 0, 1)} = ${x * k}`], cat: 'simnot', crit: 'dilate, then HL', why: `Dilate ${triN(L1)} by ${k}: its image matches ${triN(L2)} by HL. So similar, with k = ${k} ≠ 1.`, mc: { nei: MC.validSSA, cong: MC.sidesEqual } }; }
    case 'angSets': { const c = 180 - a - b; const d = b + 10, e = 180 - a - d; if (c < 30 || e < 30 || [b, c].includes(d) || [b, c].includes(e)) return factSet(R); return { lines: [`${triN(L1)}: m∠${v(L1, 0)} = ${a}°, m∠${v(L1, 1)} = ${b}°`, `${triN(L2)}: m∠${v(L2, 0)} = ${a}°, m∠${v(L2, 1)} = ${d}°`], cat: 'not', crit: 'none', why: `Angle sets {${[a, b, c].sort((p, q) => p - q).join('°, ')}°} and {${[a, d, e].sort((p, q) => p - q).join('°, ')}°} differ: not similar.`, mc: { und: MC.aaListed, nei: MC.allParts } }; }
  }
}
export const classify5: Gen = (R, n) => {
  const f = factSet(R);
  return choice(R, {
    id: `classify5-${n}`, family: 'classify5', prompt: `All you know: ${f.lines.join('; ')}. What do these facts guarantee?`, board: '\\cong\\ ?\\ \\sim\\ ?',
    solution: [f.why],
    picture: { card: { lines: [...f.lines, 'Nothing else is known.'] }, reveal: {} },
  }, (['cong', 'und', 'simnot', 'nei', 'not'] as Cat[]).map(c => ({ t: CAT_T[c], ok: c === f.cat, mc: c === f.cat ? undefined : f.mc?.[c], say: c === f.cat ? `Right: ${f.why}` : f.why })), true);
};
/** which criterion: similarity facts (k ≠ 1) or a congruence */
export const critName: Gen = (R, n) => {
  const [L1, L2] = names2(R);
  const v = (nm: string, i: number) => nm[i]!, sd = (nm: string, i: number, j: number) => nm[i]! + nm[j]!;
  const kind = pick(R, ['AA', 'SAS~', 'SSS~', 'none'] as const);
  const x = r(R, 3, 7), y = x + r(R, 2, 4), z = y + r(R, 1, 2), k = pick(R, [2, 3]);
  if (x + y <= z) return critName(R, n);
  const a = r(R, 35, 70), b = r(R, 40, 75);
  const lines = kind === 'AA' ? [`m∠${v(L1, 0)} = m∠${v(L2, 0)} = ${a}°`, `m∠${v(L1, 2)} = m∠${v(L2, 2)} = ${b}°`, `${sd(L1, 0, 1)} = ${x}, ${sd(L2, 0, 1)} = ${x * k}`]
    : kind === 'SAS~' ? [`${sd(L1, 0, 1)} = ${x}, ${sd(L2, 0, 1)} = ${x * k}`, `${sd(L1, 0, 2)} = ${y}, ${sd(L2, 0, 2)} = ${y * k}`, `m∠${v(L1, 0)} = m∠${v(L2, 0)} = ${a}°`]
      : kind === 'SSS~' ? [`${triN(L1)}: ${sd(L1, 0, 1)} = ${x}, ${sd(L1, 1, 2)} = ${y}, ${sd(L1, 0, 2)} = ${z}`, `${triN(L2)}: ${sd(L2, 0, 1)} = ${x * k}, ${sd(L2, 1, 2)} = ${y * k}, ${sd(L2, 0, 2)} = ${z * k}`]
        : [`${sd(L1, 0, 1)} = ${y}, ${sd(L2, 0, 1)} = ${y * k}`, `${sd(L1, 1, 2)} = ${x}, ${sd(L2, 1, 2)} = ${x * k}`, `m∠${v(L1, 0)} = m∠${v(L2, 0)} = ${ambAngle(R, y, x) ?? 0}°`];
  if (kind === 'none' && /= 0°/.test(lines[2]!)) return critName(R, n);
  const ans2 = kind === 'none' ? 'None: the facts do not prove similarity' : kind;
  const why: Record<string, string> = {
    AA: 'Two angle pairs: AA (the side lengths are not needed).',
    'SAS~': `Two side pairs in ratio ${k}, and the angle at ${v(L1, 0)} is between them: SAS~.`,
    'SSS~': `All three ratios are ${k}: SSS~.`,
    none: `The angle at ${v(L1, 0)} is not between the two sides (SSA), acute and opposite the shorter side: no criterion.`,
  };
  const opts: Opt[] = ['AA', 'SAS~', 'SSS~', 'None: the facts do not prove similarity', 'SAS'].map(t => ({
    t, ok: t === ans2,
    mc: t === ans2 ? undefined : t === 'SAS' ? MC.sidesEqual : kind === 'none' && t === 'SAS~' ? MC.ssa : t.startsWith('None') ? MC.noCritNot : kind === 'SAS~' && t === 'SSS~' ? MC.oneRatio : undefined,
    say: t === ans2 ? `Right: ${why[kind]}` : t === 'SAS' ? 'SAS is a congruence criterion: it needs equal sides, and these sides are not equal.' : why[kind]!,
  }));
  return choice(R, {
    id: `critName-${n}`, family: 'critName', prompt: `Which criterion proves ${triN(L1)} ~ ${triN(L2)} from these facts?`, board: simT(L1, L2),
    solution: [why[kind]!],
    picture: { card: { lines } , reveal: {} },
  }, opts, true);
};

// ---------- triangle-criteria-scope ----------
function rectFig(w: number, h: number, u: number, nm: string): Fig {
  const P: Record<string, Pt> = { [nm[0]!]: [0, 0], [nm[1]!]: [w * u, 0], [nm[2]!]: [w * u, h * u], [nm[3]!]: [0, h * u] };
  return figOf(P, [nm[0]! + nm[1]!, nm[1]! + nm[2]!, nm[2]! + nm[3]!, nm[3]! + nm[0]!], { labs: [{ seg: nm[0]! + nm[1]!, text: fmt(w) }, { seg: nm[1]! + nm[2]!, text: fmt(h) }], marks: [0, 1, 2, 3].map(i => ({ ang: nm[(i + 3) % 4]! + nm[i]! + nm[(i + 1) % 4]!, box: true })), fills: [nm.slice(0, 3), nm[0]! + nm[2]! + nm[3]!].map(s => s) });
}
function rhombFig(s: number, t: number, u: number, nm: string): Fig {
  const P0: Pt = [0, 0], P1: Pt = [s * u, 0], P3 = at(P0, t, s * u), P2 = add(P1, P3);
  const P: Record<string, Pt> = { [nm[0]!]: P0, [nm[1]!]: P1, [nm[2]!]: P2, [nm[3]!]: P3 };
  return figOf(P, [nm[0]! + nm[1]!, nm[1]! + nm[2]!, nm[2]! + nm[3]!, nm[3]! + nm[0]!], { labs: [0, 1, 2, 3].map(i => ({ seg: nm[i]! + nm[(i + 1) % 4]!, text: fmt(s) })), marks: [{ ang: nm[3]! + nm[0]! + nm[1]!, text: `${t}°`, lone: true }], fills: [nm.slice(0, 3), nm[0]! + nm[2]! + nm[3]!] });
}
export const polyScope: Gen = (R, n) => fitted('polyScope', () => {
  const kind = pick(R, ['rect', 'rect', 'rhomb', 'tri'] as const);
  if (kind === 'rect') {
    const h = pick(R, [2, 3, 4]), w1 = h + r(R, 1, 2), w2 = w1 + r(R, 2, 4);
    if ((w1 / h) === (w2 / h)) return fitFail();
    const u = 300 / w2;
    const figs = [rectFig(w1, h, u, 'ABCD'), rectFig(w2, h, u, 'EFGH')];
    return choice(R, {
      id: `polyScope-${n}`, family: 'polyScope', prompt: `Rectangle ABCD is ${w1} by ${h}; rectangle EFGH is ${w2} by ${h}. Both have four right angles. Is ABCD similar to EFGH?`, board: '\\text{ABCD} \\overset{?}{\\sim} \\text{EFGH}',
      solution: [`All angles match, but the lengths are in ratio ${w2}/${w1} and the widths in ratio ${h}/${h} = 1.`, 'Not equal, so not similar: equal angles are not enough for four-sided figures.'],
      picture: { gallery: { figs, caps: ['ABCD', 'EFGH'] }, reveal: {} },
    }, [
      { t: `No: the lengths are in ratio ${w2}/${w1}, the widths in ratio 1`, ok: true, say: 'Right: for polygons both the angles and the side ratios must match.' },
      { t: 'Yes: all four angle pairs are equal', mc: MC.polyAngles, say: 'Equal angles are not enough for four-sided figures: the sides must be in one ratio too.' },
      { t: 'Yes, by AA', mc: MC.polyAngles, say: 'AA is a triangle criterion; it does not carry over to rectangles.' },
      { t: 'Not enough information', say: 'All sides and angles are known: compare the ratios.' },
    ]);
  }
  if (kind === 'rhomb') {
    const s = r(R, 2, 4), k = 2, t1 = r(R, 55, 70), t2 = t1 + r(R, 15, 25);
    const u = 250 / (s * k);
    const figs = [rhombFig(s, t1, u, 'ABCD'), rhombFig(s * k, t2, u, 'EFGH')];
    return choice(R, {
      id: `polyScope-${n}`, family: 'polyScope', prompt: `Rhombus ABCD has sides ${s} and an angle of ${t1}°; rhombus EFGH has sides ${s * k} and an angle of ${t2}°. Every side ratio is ${k}. Are the rhombi similar?`, board: '\\text{ABCD} \\overset{?}{\\sim} \\text{EFGH}',
      solution: [`The side ratios all equal ${k}, but the angles are ${t1}° and ${t2}°.`, 'A rhombus can flex: equal side ratios alone do not fix its angles. Not similar.'],
      picture: { gallery: { figs, caps: ['ABCD', 'EFGH'] }, reveal: {} },
    }, [
      { t: `No: the angles ${t1}° and ${t2}° differ`, ok: true, say: 'Right: for polygons the angles must match too.' },
      { t: 'Yes, by SSS~: every side ratio is the same', say: 'SSS~ is a triangle criterion: a rhombus can flex with the same sides.' },
      { t: 'Yes: all rhombi are similar', say: 'Rhombi with different angles have different shapes.' },
    ]);
  }
  const a1 = angles3(R, 'acute'), k = pick(R, [0.6, 1.5]);
  const T1 = turnTri(triAng(a1, 300), tilt(R)), T2 = placeBeside(T1, triAng(a1, 300 * k), rot2(R), false, 'row');
  const S2 = { T1, T2, n1: 'ABC', n2: 'DEF', s1: [], s2: [], P: { A: T1[0], B: T1[1], C: T1[2], D: T2[0], E: T2[1], F: T2[2] } };
  const fig = simFig(S2, { a1: { 0: deg(a1[0]!), 1: deg(a1[1]!) }, a2: { 0: deg(a1[0]!), 1: deg(a1[1]!) } });
  return choice(R, {
    id: `polyScope-${n}`, family: 'polyScope', prompt: `For rectangles, equal angles are not enough. These triangles both have angles of ${a1[0]}° and ${a1[1]}°. Are they similar?`, board: '\\triangle ABC \\overset{?}{\\sim} \\triangle DEF',
    solution: ['Two angle pairs match.', 'For triangles that is enough: the third angles match and the shape is fixed (AA).'],
    picture: { fig, reveal: {} },
  }, [
    { t: 'Similar by AA: for triangles two angle pairs fix the shape', ok: true, say: 'Right: triangles are rigid; rectangles and rhombi are not.' },
    { t: 'Not similar: equal angles are never enough', mc: MC.allParts, say: 'For triangles they are: the angles fix the shape (AA).' },
    { t: 'Not enough information: the side ratios are missing', mc: MC.allParts, say: 'AA needs no side lengths for triangles.' },
  ]);
});
export const polyWhy: Gen = (R, n) => {
  const rect = R() < 0.5;
  const h = r(R, 2, 4), w1 = h + r(R, 1, 2), w2 = w1 + r(R, 2, 4), s = r(R, 2, 4), t1 = r(R, 50, 65), t2 = t1 + r(R, 15, 30);
  const setup = rect ? `Rectangles ${w1} by ${h} and ${w2} by ${h} have four right angles each.` : `Rhombi with sides ${s} and ${2 * s} have angles of ${t1}° and ${t2}°.`;
  return choice(R, {
    id: `polyWhy-${n}`, family: 'polyWhy',
    prompt: rect ? `${setup} AA proves two triangles similar. Why do equal angles NOT prove these rectangles similar?` : `${setup} SSS~ proves two triangles similar. Why do equal side ratios NOT prove these rhombi similar?`,
    board: rect ? '\\text{AA: triangles only}' : '\\text{SSS}\\sim\\text{: triangles only}',
    solution: rect ? ['A triangle’s angles fix its shape: only its size can change.', 'A rectangle can be stretched in one direction and keep all four right angles.'] : ['Three sides fix a triangle: it cannot flex.', 'Four equal sides can lean: the angles change while every side stays the same.'],
    picture: { card: { lines: [setup, 'Similar?'] }, reveal: {} },
  }, rect ? [
    { t: 'A rectangle can stretch one way and keep its right angles; a triangle’s angles fix its shape', ok: true, say: 'Right: the sides of a rectangle can change by different factors.' },
    { t: 'They do: equal angles make any polygons similar', mc: MC.polyAngles, say: `${w1} by ${h} and ${w2} by ${h} have the same angles and different shapes.` },
    { t: 'Rectangles are never similar to each other', say: '2 by 3 and 4 by 6 are similar: every side doubles.' },
    { t: 'Because AA would need four angle pairs, AAAA', say: 'Even all four angle pairs are not enough: the side ratios must match too.' },
  ] : [
    { t: 'A rhombus can lean, changing its angles while every side stays the same', ok: true, say: 'Right: four sides do not fix a four-sided shape.' },
    { t: 'They do: equal side ratios make any polygons similar', mc: MC.polyAngles, say: `Rhombi with angles ${t1}° and ${t2}° have the same side ratios and different shapes.` },
    { t: 'Rhombi are never similar to each other', say: 'Two rhombi with the same angles are similar.' },
  ]);
};
export { MC, fr };
