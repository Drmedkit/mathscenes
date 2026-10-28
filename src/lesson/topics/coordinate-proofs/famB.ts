// famB.ts: stage 3 families of "Distance, midpoint and coordinate proofs" (one specified figure): a property argued
// from exact computations, perimeter and area from coordinates, sufficient check sets, a verdict on a polygon claim,
// the right angle by the converse, and a point on a circle. Figures are built from vectors so their class is exact
// (a near-square rhombus is a rhombus, never a square); the class is then re-read from the coordinates (cg.qclass).
import { type V, add, area, cross, d2, dot, isA, isSq, mid, mul, near, q, qT, qclass, rad, radSum, radSumT, radSumV, radT, radTex, simple, slope, sub, triKind, type QClass } from './cg';
import { type DPt, type Gen, type Opt, MC, ans, choice, fmt, fmtT, int, ipt, nz, par, pickOf, plane, pt, ptN, ptNT, ptT, retry, Reroll, sq, num, PEOPLE } from './ckit';
import { CONVEX, same2, vk } from './famA';

const P = (key: string, at: V, name?: string, col?: DPt['col']): DPt => ({ key, at, name: name ?? key, col });
const L4 = ['A', 'B', 'C', 'D'];
const sides2 = (Q: V[]) => Q.map((p, i) => d2(p, Q[(i + 1) % Q.length]!));
const quadTex = (Q: V[]) => `${ptNT('A', Q[0]!)} \\quad ${ptNT('B', Q[1]!)} \\\\ ${ptNT('C', Q[2]!)} \\quad ${ptNT('D', Q[3]!)}`;
const quadTxt = (Q: V[]) => Q.map((p, i) => ptN(L4[i]!, p)).join(', ');
const quadPts = (Q: V[]) => Q.map((p, i) => P(L4[i]!, p));
const perpOf = (u: V): V => [-u[1], u[0]];

// ===================== single-property-claim =====================
export const claimArg: Gen = (R, n) => retry(() => {
  const c = n % 3, Ap = ipt(R, -5, 1);
  let Bp: V, Cp: V;
  if (c === 0) {
    const pairs: [V, V][] = [[[3, 4], [5, 0]], [[4, 3], [0, 5]], [[1, 3], [3, 1]], [[2, 4], [4, 2]], [[1, 5], [5, 1]], [[2, 3], [3, -2]], [[1, 4], [4, -1]], [[6, 2], [2, 6]]];
    const [u, v] = pickOf(R, pairs); Bp = add(Ap, u); Cp = add(Ap, v);
    if (near(dot(u, v), 0)) throw new Reroll();
  } else if (c === 1) {
    const u: V = [nz(R, 1, 4), nz(R, -3, 3)], k = pickOf(R, [1, 2]); Bp = add(Ap, u); Cp = add(Ap, mul(perpOf(u), k));
    if (Math.abs(u[0]) === Math.abs(u[1]) && k === 1) throw new Reroll();
  } else { Bp = add(Ap, [int(R, 3, 6), int(R, -2, 2)]); Cp = add(Ap, [int(R, -1, 3), int(R, 3, 6)]); }
  const ab = d2(Ap, Bp), ac = d2(Ap, Cp), bc = d2(Bp, Cp);
  if (Math.abs(cross(sub(Bp, Ap), sub(Cp, Ap))) < 6) throw new Reroll();
  let base: { claim: string; sol: string[] }, opts: Opt[];
  if (c === 0) {
    if (ab === bc || ac === bc) throw new Reroll();
    base = { claim: 'Triangle ABC is isosceles.', sol: [`AB² = ${ab}, AC² = ${ac}: equal squared lengths.`, 'Equal lengths, so AB ≅ AC, and a triangle with two congruent sides is isosceles.'] };
    opts = [
      { t: `AB² = AC² = ${ab}, so AB ≅ AC and ABC is isosceles.`, ok: true, say: 'Right: exact computations, then the named conclusion.' },
      { t: `AB² = ${ab} and AC² = ${ac}.`, mc: MC.noClaim, say: 'The numbers are right, but the argument never says what they show: name the conclusion.' },
      { t: 'AB and AC look the same length, so ABC is isosceles.', mc: MC.appearance, say: 'A picture is not evidence: compute the lengths exactly.' },
      { t: `AB² = ${ab} and BC² = ${bc}, so ABC is isosceles.`, say: `${ab} and ${bc} are not equal: those two sides are not congruent.` },
    ];
  } else if (c === 1) {
    const m1 = slope(Ap, Bp), m2 = slope(Ap, Cp);
    if (!m1 || !m2 || m1.n === 0 || m2.n === 0) throw new Reroll();
    base = { claim: '∠A is a right angle.', sol: [`Slope AB = ${qT(m1)}, slope AC = ${qT(m2)}.`, `${qT(m1)} × ${qT(m2)} = −1, so AB ⊥ AC: ∠A is right.`] };
    opts = [
      { t: `Slope AB × slope AC = ${qT(m1)} × ${qT(m2)} = −1, so AB ⊥ AC and ∠A is right.`, ok: true, say: 'Right: the computation, then the conclusion it licenses.' },
      { t: `Slope AB = ${qT(m1)} and slope AC = ${qT(m2)}.`, mc: MC.noClaim, say: 'Say what the slopes show: their product is −1, so the sides are perpendicular.' },
      { t: '∠A looks like a square corner, so it is a right angle.', mc: MC.appearance, say: 'Looking is not proving: use the slopes or the converse of the Pythagorean theorem.' },
      { t: `AB² + BC² = ${ab + bc}, so ∠B is a right angle.`, say: `The right angle is opposite the longest side, BC. AB² + AC² = ${ab + ac} = BC² puts it at A.` },
    ];
  } else {
    if (ab === ac || ab === bc || ac === bc) throw new Reroll();
    const r1 = Math.round(Math.sqrt(ab)), r2 = Math.round(Math.sqrt(ac));
    base = { claim: 'Triangle ABC is isosceles.', sol: [`AB² = ${ab}, BC² = ${bc}, CA² = ${ac}.`, 'No two squared lengths are equal, so no two sides are congruent: the claim fails.'] };
    opts = [
      { t: `AB² = ${ab}, BC² = ${bc}, CA² = ${ac}: no two are equal, so ABC is not isosceles.`, ok: true, say: 'Right: the failing computation, cited, settles it.' },
      { t: 'AB and CA look about the same, so ABC is isosceles.', mc: MC.appearance, say: 'Compute the lengths exactly: the picture can fool you.' },
      ...(r1 === r2 ? [{ t: `AB and CA both round to ${r1}, so ABC is isosceles.`, mc: MC.rounding, say: `Rounded values can match when exact ones do not: ${ab} ≠ ${ac}.` }] : []),
      { t: `AB² = ${ab} and CA² = ${ac}.`, mc: MC.noClaim, say: 'Finish the argument: say what the numbers show about the claim.' },
    ];
  }
  return choice(R, {
    id: `claimArg-${n}`, family: 'claimArg', prompt: `${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}. Claim: ${base.claim} Which is a complete, correct argument?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\quad ${ptNT('C', Cp)}`,
    picture: { plane: plane({ polys: [{ key: 't', pts: [Ap, Bp, Cp], col: 'first' }], pts: [P('A', Ap), P('B', Bp), P('C', Cp)] }) },
    solution: base.sol,
  }, opts, { max: 3 });
});

export const claimProp: Gen = (R, n) => retry(() => {
  const c = n % 4, Bp = ipt(R, -2, 2);
  let Q: V[];
  if (c === 0) { const u: V = [int(R, 3, 5), int(R, -1, 2)], v: V = [int(R, 1, 3), int(R, 3, 5)]; Q = [sub(Bp, u), Bp, add(Bp, v), add(sub(Bp, u), v)]; }
  else if (c === 1) { const u: V = [nz(R, -4, -2), int(R, -1, 2)], k = pickOf(R, [2, 1.5]); const v = mul(perpOf(u), -k); if (!Number.isInteger(v[0]) || !Number.isInteger(v[1])) throw new Reroll(); Q = [add(Bp, u), Bp, add(Bp, v), add(Bp, [int(R, -6, -2), int(R, 2, 6)])]; }
  else if (c === 2) { const vs = pickOf(R, [[[-5, 0], [3, 4]], [[-4, 3], [0, 5]], [[-3, 1], [1, 3]], [[-4, 2], [2, 4]], [[-5, 1], [1, 5]]] as [V, V][]); Q = [add(Bp, vs[0]), Bp, add(Bp, vs[1]), add(Bp, [int(R, -7, -3), int(R, 3, 7)])]; }
  else { Q = CONVEX(R); }
  const [Ap, Bq, Cp, Dp] = Q as [V, V, V, V];
  if (!simple(Q) || Math.abs(cross(sub(Cp, Ap), sub(Dp, Bq))) < 4 || area(Q) < 10) throw new Reroll();
  for (let i = 0; i < 4; i++) if (Math.abs(cross(sub(Q[(i + 1) % 4]!, Q[i]!), sub(Q[(i + 2) % 4]!, Q[(i + 1) % 4]!))) < 2) throw new Reroll();
  const bis = same2(mid(Ap, Cp), mid(Bq, Dp)), perp = near(dot(sub(Ap, Bq), sub(Cp, Bq)), 0), cong = d2(Ap, Bq) === d2(Bq, Cp);
  const count = [bis, perp, cong].filter(Boolean).length;
  if (count > 1 || (c === 3 && count !== 0) || (c !== 3 && count !== 1)) throw new Reroll();
  const truth = bis ? 'bis' : perp ? 'perp' : cong ? 'cong' : 'none';
  const m1 = slope(Ap, Bq), m2 = slope(Cp, Bq);
  return choice(R, {
    id: `claimProp-${n}`, family: 'claimProp', prompt: `Quadrilateral ${quadTxt(Q)}. Which property do exact computations prove?`,
    board: quadTex(Q),
    picture: { plane: plane({ polys: [{ key: 'q', pts: Q, col: 'first' }], pts: quadPts(Q) }) },
    solution: [`Midpoints of AC and BD: ${pt(mid(Ap, Cp))} and ${pt(mid(Bq, Dp))}.`, `Slopes of BA and BC: ${m1 ? qT(m1) : 'undefined'} and ${m2 ? qT(m2) : 'undefined'}; AB² = ${d2(Ap, Bq)}, BC² = ${d2(Bq, Cp)}.`],
  }, [
    { t: 'The diagonals AC and BD bisect each other', ok: truth === 'bis', key: 'bis', mc: truth === 'bis' ? undefined : MC.appearance, say: truth === 'bis' ? 'Right: AC and BD share a midpoint.' : `The midpoints ${pt(mid(Ap, Cp))} and ${pt(mid(Bq, Dp))} differ.` },
    { t: 'AB ⊥ BC', ok: truth === 'perp', key: 'perp', mc: truth === 'perp' ? undefined : MC.appearance, say: truth === 'perp' ? 'Right: the slopes of BA and BC multiply to −1.' : 'The slopes of BA and BC do not multiply to −1.' },
    { t: 'AB ≅ BC', ok: truth === 'cong', key: 'cong', mc: truth === 'cong' ? undefined : MC.appearance, say: truth === 'cong' ? `Right: AB² = BC² = ${d2(Ap, Bq)}.` : `AB² = ${d2(Ap, Bq)} but BC² = ${d2(Bq, Cp)}.` },
    { t: 'None of these', ok: truth === 'none', key: 'none', say: truth === 'none' ? 'Right: each of the three computations fails.' : 'One of the three computations does work out.' },
  ], { keep: true, max: 3 });
});

// ===================== coordinate-perimeter =====================
function polyFor(R: () => number, c: number): V[] {
  if (c === 0) { const Ap = ipt(R, -6, -1), a = int(R, 3, 8); return [Ap, add(Ap, [a, 0]), add(Ap, [int(R, -2, a + 2), int(R, 2, 6) * (R() < 0.5 ? 1 : -1)])]; }
  if (c === 1) { const Ap = ipt(R, -6, -1), a = int(R, 3, 7); return [Ap, add(Ap, [a, 0]), add(Ap, [int(R, 0, a + 3), int(R, 3, 6)]), add(Ap, [int(R, -3, 1), int(R, 3, 6)])]; }
  if (c === 2) { const Q = CONVEX(R); return Q; }
  // concave: a dart (the fourth vertex pushed inside)
  const Ap = ipt(R, -6, -3), Bp = add(Ap, [int(R, 8, 10), int(R, -1, 1)]), Cp = add(Ap, [int(R, 3, 6), int(R, 7, 9)]);
  const Dp = add(Ap, [int(R, 3, 5), int(R, 2, 4)]);
  return [Ap, Bp, Cp, Dp];
}
const LET = ['A', 'B', 'C', 'D', 'E'];
/** three consecutive vertices on one line (a degenerate polygon) */
export const flat = (Q: readonly V[]) => Q.some((p, i) => near(cross(sub(Q[(i + 1) % Q.length]!, p), sub(Q[(i + 2) % Q.length]!, p)), 0));
const polyTxt = (Q: V[]) => Q.map((p, i) => ptN(LET[i]!, p)).join(', ');
const polyTex = (Q: V[]) => Q.length > 3 ? `${Q.slice(0, 2).map((p, i) => ptNT(LET[i]!, p)).join(' \\quad ')} \\\\ ${Q.slice(2).map((p, i) => ptNT(LET[i + 2]!, p)).join(' \\quad ')}` : Q.map((p, i) => ptNT(LET[i]!, p)).join(' \\quad ');
const nameOf = (Q: V[]) => LET.slice(0, Q.length).join('');
const sideNames = (Q: V[]) => Q.map((_, i) => LET[i]! + LET[(i + 1) % Q.length]!);
export const perimExact: Gen = (R, n) => retry(() => {
  const Q = polyFor(R, n % 4);
  if (flat(Q)) throw new Reroll();
  if (!simple(Q) || area(Q) < 8 || Q.some((p, i) => Q.some((r, j) => j > i && same2(p, r)))) throw new Reroll();
  const s = sides2(Q);
  if (s.filter(x => !isSq(x)).length < 2) throw new Reroll();
  const m = radSum(s), right = radSumT(m), key = (v: number) => v.toFixed(6);
  const open = radSum(s.slice(0, -1));
  const taxi = Q.reduce((t, p, i) => { const r = Q[(i + 1) % Q.length]!; return t + Math.abs(r[0] - p[0]) + Math.abs(r[1] - p[1]); }, 0);
  const opts: Opt[] = [
    { t: right, ok: true, key: key(radSumV(m)), say: `Right: ${right}, with like radicals combined.` },
    { t: radSumT(open), key: key(radSumV(open)), mc: MC.closing, say: `Add the closing side ${sideNames(Q)[Q.length - 1]} too: the perimeter goes all the way around.` },
    { t: `√${s.reduce((a, b) => a + b, 0)}`, key: key(Math.sqrt(s.reduce((a, b) => a + b, 0))), mc: MC.addRad, say: 'Square roots do not add under one root: simplify each length, then combine only like radicals.' },
    { t: String(taxi), key: key(taxi), mc: MC.adds, say: 'The x- and y-changes are legs at a right angle: each slanted side is √(run² + rise²), not run + rise.' },
  ];
  return choice(R, {
    id: `perimExact-${n}`, family: 'perimExact', prompt: `Find the exact perimeter of ${Q.length === 3 ? 'triangle' : 'polygon'} ${nameOf(Q)}: ${polyTxt(Q)}.`,
    board: polyTex(Q),
    picture: { plane: plane({ polys: [{ key: 'q', pts: Q, col: 'first' }], pts: Q.map((p, i) => P(LET[i]!, p)) }) },
    solution: [`Squared sides ${sideNames(Q).join(', ')}: ${s.join(', ')}.`, `Lengths: ${s.map(radT).join(', ')}.`, `Add, combining like radicals: ${right}.`],
  }, opts, { max: 3 });
});
export const perimRound: Gen = (R, n) => retry(() => {
  const Q = polyFor(R, n % 4);
  if (flat(Q)) throw new Reroll();
  if (!simple(Q) || area(Q) < 8 || Q.some((p, i) => Q.some((r, j) => j > i && same2(p, r)))) throw new Reroll();
  const s = sides2(Q), L = s.reduce((t, x) => t + Math.sqrt(x), 0);
  if (Math.abs((L * 10) % 1 - 0.5) < 0.06 || s.every(isSq)) throw new Reroll();
  const r1 = Math.round(L * 10) / 10, unit = pickOf(R, ['feet', 'yards', 'meters']);
  const ctx = n % 2 === 0 ? `A garden bed has corners at ${polyTxt(Q)}, in ${unit} (one grid unit is 1 ${({ feet: 'foot', yards: 'yard', meters: 'meter' } as Record<string, string>)[unit]}).` : `Polygon ${nameOf(Q)} has vertices ${polyTxt(Q)}.`;
  const word = n % 2 === 0 ? `How many ${unit} of edging go all the way around, to the nearest tenth?` : 'Find its perimeter to the nearest tenth.';
  const open = s.slice(0, -1).reduce((t, x) => t + Math.sqrt(x), 0);
  const taxi = Q.reduce((t, p, i) => { const r = Q[(i + 1) % Q.length]!; return t + Math.abs(r[0] - p[0]) + Math.abs(r[1] - p[1]); }, 0);
  return num({
    id: `perimRound-${n}`, family: 'perimRound', prompt: `${ctx} ${word}`, board: polyTex(Q), unit: n % 2 === 0 ? unit : '',
    picture: { plane: plane({ polys: [{ key: 'q', pts: Q, col: 'first' }], pts: Q.map((p, i) => P(LET[i]!, p)) }) },
    solution: [`Squared sides ${sideNames(Q).join(', ')}: ${s.join(', ')}.`, `Lengths: ${s.map(x => (isSq(x) ? String(Math.sqrt(x)) : `${radT(x)} ≈ ${(Math.sqrt(x)).toFixed(3)}`)).join(', ')}.`, `Sum ≈ ${L.toFixed(3)}, so the perimeter is about ${ans(fmt(r1))}.`],
  }, r1, `Right: about ${fmt(r1)}.`, [
    { v: Math.round(open * 10) / 10, mc: MC.closing, say: `Add the closing side ${sideNames(Q)[Q.length - 1]}: the perimeter goes all the way around.` },
    { v: taxi, mc: MC.adds, say: 'Each slanted side is √(run² + rise²), not run + rise.' },
    { v: Math.round(L), say: 'Round to the nearest tenth, not to a whole number.' },
  ], 'Find each side with the distance formula (including the closing side), add, then round once at the end.');
});

// ===================== coordinate-area =====================
export const areaBox: Gen = (R, n) => retry(() => {
  const c = n % 3;
  let T: V[];
  if (c === 0) { const Ap = ipt(R, -7, 0), b = int(R, 3, 9), apex = add(Ap, [int(R, -2, b + 2), nz(R, -7, 7)]); T = R() < 0.5 ? [Ap, add(Ap, [b, 0]), apex] : [Ap, add(Ap, [0, b]), add(Ap, [apex[1] - Ap[1], apex[0] - Ap[0]])]; }
  else { T = [ipt(R, -7, 7), ipt(R, -7, 7), ipt(R, -7, 7)]; }
  const xs = T.map(p => p[0]), ys = T.map(p => p[1]);
  const W = Math.max(...xs) - Math.min(...xs), H = Math.max(...ys) - Math.min(...ys);
  const A0 = area(T);
  if (A0 < 6 || W < 3 || H < 3) throw new Reroll();
  const [Ap, Bp, Cp] = T as [V, V, V];
  const axisBase = c === 0;
  const pieces = T.map((p, i) => { const r = T[(i + 1) % 3]!; return Math.abs((r[0] - p[0]) * (r[1] - p[1])) / 2; });
  if (!axisBase && !near(W * H - pieces.reduce((s, x) => s + x, 0), A0)) throw new Reroll();
  if (!axisBase && pieces.filter(x => x > 0).length < 3) throw new Reroll();
  const feet = n % 2 === 1, unit = feet ? 'sq ft' : 'square units';
  const sorted = [...pieces].sort((a, b) => b - a);
  const horiz0 = near(Ap[1], Bp[1]);
  const baseL = horiz0 ? Math.abs(Bp[0] - Ap[0]) : Math.abs(Bp[1] - Ap[1]), hL = horiz0 ? Math.abs(Cp[1] - Ap[1]) : Math.abs(Cp[0] - Ap[0]);
  const coordH = Math.abs(horiz0 ? Cp[1] : Cp[0]);
  const slips = axisBase ? [
    { v: baseL * hL, say: 'A triangle is half of base times height.' },
    ...(coordH !== hL ? [{ v: baseL * coordH / 2, mc: MC.coordLen, say: `The height is the distance from C to line AB, not C's coordinate: subtract.` }] : []),
  ] : [{ v: W * H - sorted[0]!, mc: MC.somePieces, say: 'Subtract every outside piece: there are three right triangles around this one.' },
      { v: W * H - sorted[0]! - sorted[1]!, mc: MC.somePieces, say: 'One outside piece is still included: subtract all three right triangles.' },
      { v: W * H, say: 'That is the whole box: subtract the right triangles outside the triangle.' }];
  let sol: string[];
  if (axisBase) {
    const horiz = near(Ap[1], Bp[1]);
    const base = horiz ? Math.abs(Bp[0] - Ap[0]) : Math.abs(Bp[1] - Ap[1]), h = horiz ? Math.abs(Cp[1] - Ap[1]) : Math.abs(Cp[0] - Ap[0]);
    sol = [`AB is ${horiz ? 'horizontal' : 'vertical'}: base = ${base}.`, `The height is the ${horiz ? 'vertical' : 'horizontal'} distance from C to line AB: ${h}.`, `Area = ½ × ${base} × ${h} = ${ans(fmt(A0))}.`];
  } else sol = [`Enclose the triangle in a ${W} by ${H} box: ${W * H}.`, `The three outside right triangles: ${pieces.map(fmt).join(', ')}.`, `Area = ${W * H} − ${pieces.map(fmt).join(' − ')} = ${ans(fmt(A0))}.`];
  return num({
    id: `areaBox-${n}`, family: 'areaBox', prompt: `${feet ? 'A triangular patio has corners at' : 'Triangle'} ${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}${feet ? ' (one grid unit is 1 foot)' : ''}. Find its area.`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\quad ${ptNT('C', Cp)}`, unit,
    picture: { plane: plane({ polys: [{ key: 't', pts: T, col: 'first' }], pts: [P('A', Ap), P('B', Bp), P('C', Cp)] }, axisBase ? undefined : { polys: [{ key: 'box', pts: [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)], [Math.min(...xs), Math.max(...ys)]], col: 'pick' }] }) },
    solution: sol,
  }, A0, `Right: ${fmt(A0)} ${unit}.`, slips, axisBase ? 'Half of base times height, with the height perpendicular to the base.' : 'Enclose the triangle in a box and subtract all three outside right triangles.');
});
export const areaRect: Gen = (R, n) => retry(() => {
  const sqr = n % 3 === 0, u: V = [nz(R, 1, 4), nz(R, 1, 4) * (R() < 0.5 ? -1 : 1)];
  if (Math.abs(u[0]) === Math.abs(u[1]) && !sqr) throw new Reroll();
  const k = sqr ? 1 : pickOf(R, [2, 3]), v = mul(perpOf(u), k);
  const Ap = ipt(R, -6, 0), Q = [Ap, add(Ap, u), add(add(Ap, u), v), add(Ap, v)];
  if (Math.max(...Q.flat().map(Math.abs)) > 10) throw new Reroll();
  const a1 = d2(Q[0]!, Q[1]!), a2 = d2(Q[1]!, Q[2]!), A0 = Math.sqrt(a1 * a2);
  const m1 = slope(Q[0]!, Q[1]!)!, m2 = slope(Q[1]!, Q[2]!)!;
  const yd = n % 2 === 1;
  return num({
    id: `areaRect-${n}`, family: 'areaRect', prompt: `${yd ? 'A tilted rectangular rug on a floor plan has corners' : `${sqr ? 'Square' : 'Rectangle'} ABCD has vertices`} ${quadTxt(Q)}${yd ? ' (one grid unit is 1 yard)' : ''}. Find its area.`,
    board: quadTex(Q), unit: yd ? 'sq yd' : 'square units',
    picture: { plane: plane({ polys: [{ key: 'q', pts: Q, col: 'first' }], pts: quadPts(Q) }, { segs: [{ key: 'run', a: Q[0]!, b: [Q[1]![0], Q[0]![1]], col: 'first', dash: true }, { key: 'rise', a: [Q[1]![0], Q[0]![1]], b: Q[1]!, col: 'second', dash: true }] }) },
    solution: [`Slopes AB = ${qT(m1)}, BC = ${qT(m2)}: product −1, so ∠B is right.`, `AB = √${a1} = ${radT(a1)}, BC = √${a2} = ${radT(a2)}.`, `Area = AB × BC = √${a1 * a2} = ${ans(fmt(A0))}.`],
  }, A0, `Right: ${fmt(A0)}.`, [
    { v: Math.abs(u[0]) * Math.abs(v[0]), mc: MC.tiltRun, say: 'The sides are tilted: their lengths come from the distance formula, not from the horizontal runs.' },
    { v: (Math.abs(u[0]) + Math.abs(u[1])) * (Math.abs(v[0]) + Math.abs(v[1])), mc: MC.adds, say: 'A side is √(run² + rise²), not run + rise.' },
    { v: a1 + a2, say: 'Multiply the two side lengths; do not add their squares.' },
  ], 'Show the corner is right (slopes), find two adjacent sides with the distance formula, and multiply.');
});

// ===================== sufficient-check-set =====================
type Cls = 'parallelogram' | 'rectangle' | 'rhombus' | 'square';
const CHECKS: Record<Cls, { ok: string[]; bad: { t: string; mc?: string; why: string }[] }> = {
  parallelogram: { ok: ['both pairs of opposite sides are parallel (equal slopes)', 'the diagonals share a midpoint'], bad: [
    { t: 'one pair of opposite sides is parallel', mc: MC.necSuff, why: 'A trapezoid also has one parallel pair.' },
    { t: 'the diagonals are congruent', mc: MC.necSuff, why: 'An isosceles trapezoid also has congruent diagonals.' },
    { t: 'two pairs of consecutive sides are congruent', mc: MC.necSuff, why: 'A kite has two pairs of congruent consecutive sides.' }] },
  rectangle: { ok: ['the diagonals share a midpoint and are congruent', 'both pairs of opposite sides are parallel and one angle is right'], bad: [
    { t: 'the diagonals are congruent', mc: MC.necSuff, why: 'An isosceles trapezoid also has congruent diagonals: first show a parallelogram.' },
    { t: 'both pairs of opposite sides are parallel', mc: MC.skipsRight, why: 'That makes a parallelogram; a right angle is still needed.' },
    { t: 'one angle is a right angle', mc: MC.necSuff, why: 'Many quadrilaterals have one right angle without being rectangles.' }] },
  rhombus: { ok: ['all four sides are congruent', 'the diagonals share a midpoint and are perpendicular'], bad: [
    { t: 'the diagonals are perpendicular', mc: MC.necSuff, why: 'A kite also has perpendicular diagonals.' },
    { t: 'two consecutive sides are congruent', mc: MC.necSuff, why: 'A kite (or many other shapes) has two congruent consecutive sides.' },
    { t: 'the diagonals share a midpoint', mc: MC.necSuff, why: 'That makes a parallelogram, not yet a rhombus.' }] },
  square: { ok: ['all four sides are congruent and one angle is right', 'the diagonals share a midpoint, are congruent and are perpendicular'], bad: [
    { t: 'all four sides are congruent', mc: MC.skipsRight, why: 'That makes a rhombus: a right angle is still needed.' },
    { t: 'all four angles are right angles', mc: MC.skipsRight, why: 'That makes a rectangle: equal sides are still needed.' },
    { t: 'the diagonals are congruent and perpendicular', mc: MC.necSuff, why: 'A kite can have congruent perpendicular diagonals that do not bisect each other.' }] },
};
export const checkSet: Gen = (R, n) => retry(() => {
  const cls = (['parallelogram', 'rectangle', 'rhombus', 'square'] as Cls[])[n % 4]!, T = CHECKS[cls];
  const ok = pickOf(R, T.ok);
  return choice(R, {
    id: `checkSet-${n}`, family: 'checkSet', prompt: `ABCD is given by its coordinates. Which set of checks, if they all pass, proves ABCD is a ${cls}?`,
    board: `ABCD \\text{ a ${cls}?}`,
    solution: [`A sufficient set must rule out every other quadrilateral.`, `${ok[0]!.toUpperCase()}${ok.slice(1)}: that guarantees a ${cls}.`],
  }, [{ t: ok, ok: true, say: `Right: that set is sufficient for a ${cls}.` }, ...T.bad.map(b => ({ t: b.t, mc: b.mc, say: `Not enough. ${b.why}` }))], { max: 3 });
});
export const checkNeed: Gen = (R, n) => retry(() => {
  const who = pickOf(R, PEOPLE), c = n % 3;
  const set = c === 0
    ? { have: 'the diagonals of ABCD are congruent', goal: 'rectangle', need: 'the diagonals share a midpoint', bad: [{ t: 'nothing: congruent diagonals make a rectangle', mc: MC.necSuff }, { t: 'the diagonals are perpendicular' }, { t: 'one pair of opposite sides is congruent' }] }
    : c === 1 ? { have: 'all four sides of ABCD are congruent', goal: 'square', need: 'one angle is a right angle', bad: [{ t: 'nothing: four congruent sides make a square', mc: MC.skipsRight }, { t: 'the diagonals share a midpoint' }, { t: 'one pair of opposite sides is parallel' }] }
      : { have: 'both pairs of opposite sides of ABCD are parallel', goal: 'rhombus', need: 'two consecutive sides are congruent', bad: [{ t: 'nothing: a parallelogram is a rhombus', mc: MC.necSuff }, { t: 'one angle is a right angle' }, { t: 'the diagonals are congruent' }] };
  return choice(R, {
    id: `checkNeed-${n}`, family: 'checkNeed', prompt: `${who} has shown that ${set.have}. What else must ${who} show to conclude ABCD is a ${set.goal}?`,
    board: `ABCD \\text{ a ${set.goal}?}`,
    solution: [`What ${who} has shown is necessary for a ${set.goal}, but other shapes have it too.`, `Add: ${set.need}.`],
  }, [{ t: set.need, ok: true, say: `Right: together the checks guarantee a ${set.goal}.` }, ...set.bad.map(b => ({ t: b.t, mc: b.mc, say: b.mc ? `Other quadrilaterals pass that check too, so it is not enough on its own.` : `That check does not finish the job: together with what ${who} has, it still allows other shapes.` }))], { max: 3 });
});

// ===================== prove-disprove-specific-figure =====================
const RH: [V, V][] = [[[5, 0], [3, 4]], [[3, 4], [4, 3]], [[5, 0], [4, 3]], [[1, 3], [3, 1]], [[2, 3], [3, 2]], [[1, 4], [4, 1]], [[2, 4], [4, 2]], [[7, 1], [5, 5]], [[4, 7], [7, 4]], [[1, 5], [5, 1]]];
/** a parallelogram of the class asked: tilted (no horizontal side), exact class */
function figOf(R: () => number, cls: QClass): V[] {
  for (let t = 0; t < 200; t++) {
    let u: V, v: V;
    if (cls === 'square') { u = [nz(R, 1, 4), nz(R, 1, 3)]; v = perpOf(u); }
    else if (cls === 'rectangle') { u = [nz(R, 1, 3), nz(R, 1, 3)]; v = mul(perpOf(u), pickOf(R, [2, 3])); }
    else if (cls === 'rhombus') { const [a, b] = pickOf(R, RH); u = a; v = R() < 0.5 ? b : [b[1] * -1, b[0]]; if (near(dot(u, v), 0)) continue; }
    else { u = [nz(R, 2, 5), nz(R, -2, 2)]; v = [nz(R, -2, 2), nz(R, 3, 5)]; }
    if (cross(u, v) < 0) v = mul(v, -1) as V;
    const Ap = ipt(R, -5, 0), Q = [Ap, add(Ap, u), add(add(Ap, u), v), add(Ap, v)];
    if (Math.max(...Q.flat().map(Math.abs)) > 9 || qclass(Q[0]!, Q[1]!, Q[2]!, Q[3]!) !== cls) continue;
    if (Q.some((p, i) => near(p[1], Q[(i + 1) % 4]![1]) || near(p[0], Q[(i + 1) % 4]![0])) && cls !== 'parallelogram') continue;
    return Q;
  }
  throw new Reroll();
}
export const verdict: Gen = (R, n) => retry(() => {
  const c = n % 4;
  const cls: QClass = c === 0 ? 'rectangle' : c === 1 ? 'parallelogram' : c === 2 ? 'square' : 'rhombus';
  const claim: Cls = c === 3 ? 'square' : 'rectangle';
  const Q = figOf(R, cls);
  const [Ap, Bp, Cp, Dp] = Q as [V, V, V, V];
  const ac = d2(Ap, Cp), bd = d2(Bp, Dp), Mx = mid(Ap, Cp), truth = isA(cls, claim);
  let opts: Opt[];
  const shareCong = `AC and BD share the midpoint ${pt(Mx)}, and AC² = BD² = ${ac}`;
  if (c === 0 || c === 2) opts = [
    { t: `True: ${shareCong}.`, ok: true, say: 'Right: a shared midpoint makes a parallelogram, congruent diagonals make it a rectangle.' },
    { t: 'False: its sides are not horizontal and vertical', mc: MC.rectAxis, say: 'A rectangle can be tilted: its sides need only meet at right angles.' },
    c === 2 ? { t: 'False: it is a square, so it is not a rectangle', mc: MC.excluded, say: 'Every square is a rectangle: it has four right angles.' } : { t: `False: AB² = ${d2(Ap, Bp)} but BC² = ${d2(Bp, Cp)}`, say: 'A rectangle does not need equal consecutive sides: that is a square.' },
    { t: 'True: AB is parallel to DC', mc: MC.someConds, say: 'One parallel pair is not enough: a trapezoid has that too.' },
  ];
  else if (c === 1) opts = [
    { t: `False: AC and BD share a midpoint, but AC² = ${ac} and BD² = ${bd}, so it is a parallelogram that is not a rectangle.`, ok: true, say: 'Right: the failing condition, cited.' },
    { t: 'True: both pairs of opposite sides are parallel', mc: MC.someConds, say: 'That only shows a parallelogram. A rectangle also needs a right angle (or congruent diagonals).' },
    { t: 'True: it looks like a rectangle', mc: MC.appearance, say: 'Compute: the diagonals are not congruent, so no angle is right.' },
  ];
  else opts = [
    { t: `False: AC² = ${ac} and BD² = ${bd}, so the diagonals are not congruent and it is a rhombus that is not a square.`, ok: true, say: 'Right: four equal sides make a rhombus, but a square also needs congruent diagonals (or a right angle).' },
    { t: `True: all four sides have squared length ${d2(Ap, Bp)}`, mc: MC.skipsRight, say: 'Four congruent sides make a rhombus; a square also needs a right angle.' },
    { t: 'True: it looks like a square', mc: MC.appearance, say: 'Close is not equal: compute the diagonals.' },
  ];
  void truth; void bd;
  return choice(R, {
    id: `verdict-${n}`, family: 'verdict', prompt: `${quadTxt(Q)}. Claim: ABCD is a ${claim}. Which verdict is fully justified?`,
    board: quadTex(Q),
    picture: { plane: plane({ polys: [{ key: 'q', pts: Q, col: 'first' }], pts: quadPts(Q) }, { segs: [{ key: 'ac', a: Ap, b: Cp, col: 'second', dash: true }, { key: 'bd', a: Bp, b: Dp, col: 'pick', dash: true }] }) },
    solution: [`Midpoints of AC and BD: ${pt(Mx)} and ${pt(mid(Bp, Dp))}.`, `AC² = ${ac}, BD² = ${bd}${c === 3 ? `; AB² = BC² = ${d2(Ap, Bp)}` : ''}.`, `A parallelogram with congruent diagonals is a rectangle; a rhombus with congruent diagonals is a square.`],
  }, opts, { max: 3 });
});
export const classify: Gen = (R, n) => retry(() => {
  const cls = (['parallelogram', 'rectangle', 'rhombus', 'square'] as QClass[])[n % 4]!;
  const Q = figOf(R, cls), [Ap, Bp, Cp, Dp] = Q as [V, V, V, V];
  const ab = d2(Ap, Bp), bc = d2(Bp, Cp), m1 = slope(Ap, Bp), m2 = slope(Bp, Cp);
  const names: Cls[] = ['square', 'rectangle', 'rhombus', 'parallelogram'];
  return choice(R, {
    id: `classify-${n}`, family: 'classify', prompt: `${quadTxt(Q)}. What is the most specific name for ABCD?`,
    board: quadTex(Q),
    picture: { plane: plane({ polys: [{ key: 'q', pts: Q, col: 'first' }], pts: quadPts(Q) }) },
    solution: [`AC and BD share the midpoint ${pt(mid(Ap, Cp))}: a parallelogram.`, `AB² = ${ab}, BC² = ${bc}; slopes AB = ${m1 ? qT(m1) : 'undefined'}, BC = ${m2 ? qT(m2) : 'undefined'}.`, `${ab === bc ? 'Consecutive sides congruent' : 'Consecutive sides not congruent'}; ${near(dot(sub(Ap, Bp), sub(Cp, Bp)), 0) ? 'right angle at B' : 'no right angle'}.`],
  }, names.map(nm => ({
    t: `${nm[0]!.toUpperCase()}${nm.slice(1)}`, ok: nm === cls,
    mc: nm === cls ? undefined : nm === 'square' ? MC.skipsRight : nm === 'parallelogram' ? undefined : MC.appearance,
    say: nm === cls ? `Right: the computations make it a ${cls}${cls === 'parallelogram' ? '' : ', and nothing more'}.` : isA(cls, nm) ? `It is a ${nm}, but a more specific name fits.` : `It is not a ${nm}: check ${nm === 'rhombus' || nm === 'square' ? 'the side lengths' : ''}${nm === 'square' ? ' and ' : ''}${nm === 'rectangle' || nm === 'square' ? 'the corner angles' : ''}.`,
  })), { keep: true, max: 3 });
});

// ===================== right-angle-by-converse =====================
export const converse: Gen = (R, n) => retry(() => {
  const c = n % 4, Ap = ipt(R, -5, 1);
  const u: V = [nz(R, 1, 5), nz(R, -3, 3)];
  let v: V;
  if (c === 0) v = mul(perpOf(u), pickOf(R, [2, -2, 3]));
  else if (c === 1) v = perpOf(u);
  else if (c === 2) v = [int(R, -6, -1), int(R, 2, 6)];
  else v = [int(R, 0, 4), int(R, 3, 6)];
  const Bp = add(Ap, u), Cp = add(Ap, v);
  const s = [d2(Ap, Bp), d2(Bp, Cp), d2(Cp, Ap)], kind = triKind(Ap, Bp, Cp);
  if (Math.abs(cross(u, v)) < 5 || (c === 2 && kind !== 'obtuse') || (c === 3 && kind !== 'acute') || s.every(isSq)) throw new Reroll();
  const sorted = [...s].sort((a, b) => a - b), [a2, b2, c2] = sorted as [number, number, number];
  const opts: Opt[] = (['right', 'acute', 'obtuse'] as const).map(k => ({
    t: k === 'right' ? 'A right triangle' : k === 'acute' ? 'An acute triangle' : 'An obtuse triangle', ok: kind === k,
    mc: kind === k ? undefined : k === 'acute' ? MC.longest : undefined,
    say: kind === k ? `Right: ${a2} + ${b2} ${kind === 'right' ? '=' : kind === 'acute' ? '>' : '<'} ${c2}, with ${c2} from the longest side.` : k === 'acute' ? 'Compare the two shorter squared sides with the LONGEST one: with any other side as c the sum is always bigger.' : `Compare: ${a2} + ${b2} = ${a2 + b2} and the longest squared side is ${c2}.`,
  }));
  return choice(R, {
    id: `converse-${n}`, family: 'converse', prompt: `Triangle ${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}. Is it right, acute or obtuse?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\quad ${ptNT('C', Cp)}`,
    picture: { plane: plane({ polys: [{ key: 't', pts: [Ap, Bp, Cp], col: 'first' }], pts: [P('A', Ap), P('B', Bp), P('C', Cp)] }) },
    solution: [`Squared sides: AB² = ${s[0]}, BC² = ${s[1]}, CA² = ${s[2]}. The longest is ${c2}.`, `${a2} + ${b2} = ${a2 + b2}, ${a2 + b2 === c2 ? 'equal to' : a2 + b2 > c2 ? 'more than' : 'less than'} ${c2}.`],
  }, opts, { keep: true });
});
export const rightWhere: Gen = (R, n) => retry(() => {
  const at = n % 4, Bp0 = ipt(R, -4, 2), u: V = [nz(R, 1, 5), nz(R, -3, 3)], k = pickOf(R, [1, 2, -2]);
  let T: V[];
  if (at === 3) T = [Bp0, add(Bp0, u), add(Bp0, [int(R, -4, 0), int(R, 3, 6)])];
  else { const corner = Bp0, a = add(corner, u), b = add(corner, mul(perpOf(u), k)); T = at === 0 ? [corner, a, b] : at === 1 ? [a, corner, b] : [a, b, corner]; }
  const [Ap, Bp, Cp] = T as [V, V, V];
  if (Math.abs(cross(sub(Bp, Ap), sub(Cp, Ap))) < 5 || (at === 3 && triKind(Ap, Bp, Cp) === 'right')) throw new Reroll();
  const s = { A: d2(Bp, Cp), B: d2(Cp, Ap), C: d2(Ap, Bp) };
  const truth = at === 3 ? 'none' : (['A', 'B', 'C'] as const)[at]!;
  const longest = (Object.entries(s).sort((x, y) => y[1] - x[1])[0]![0]);
  return choice(R, {
    id: `rightWhere-${n}`, family: 'rightWhere', prompt: `Triangle ${ptN('A', Ap)}, ${ptN('B', Bp)}, ${ptN('C', Cp)}. At which vertex is there a right angle?`,
    board: `${ptNT('A', Ap)} \\quad ${ptNT('B', Bp)} \\quad ${ptNT('C', Cp)}`,
    picture: { plane: plane({ polys: [{ key: 't', pts: T, col: 'first' }], pts: [P('A', Ap), P('B', Bp), P('C', Cp)] }) },
    solution: [`BC² = ${s.A}, CA² = ${s.B}, AB² = ${s.C}.`, `The longest side is opposite ${longest}; the other two squares add to ${Object.entries(s).filter(([k2]) => k2 !== longest).reduce((t, [, x]) => t + x, 0)}, ${truth === 'none' ? 'not' : 'equal to'} ${s[longest as 'A']}.`],
  }, [
    ...(['A', 'B', 'C'] as const).map(L => ({ t: `At ${L}`, ok: truth === L, key: L, mc: truth === L ? undefined : L !== longest ? MC.longest : undefined, say: truth === L ? `Right: the side opposite ${L} is the longest, and the other two squares add to its square.` : `A right angle sits opposite the longest side, and only when the other two squares add up to it.` })),
    { t: 'No right angle', ok: truth === 'none', key: 'none', say: truth === 'none' ? 'Right: the two smaller squares do not add to the largest.' : 'The two smaller squared sides do add to the largest: there is a right angle.' },
  ], { keep: true, max: 3 });
});

// ===================== point-on-circle =====================
const ON_IRR: { a: number; b: number; r: number }[] = []; for (let r = 2; r <= 6; r++) for (let a = 1; a < r; a++) if (!isSq(r * r - a * a)) ON_IRR.push({ a, b: r * r - a * a, r });
export const onCircle: Gen = (R, n) => retry(() => {
  const c = n % 4;
  let C: V = ipt(R, -2, 2), r2: number, Ptxt: string, Ptex: string, Pdata: V, givenQ: V | null = null, sqLine = '';
  if (c === 0) {
    C = [0, 0]; const e = pickOf(R, ON_IRR), sx = R() < 0.5 ? -1 : 1, sy = R() < 0.5 ? -1 : 1, swap = R() < 0.5;
    r2 = e.r * e.r;
    const rt = `${sy < 0 ? '−' : ''}√${e.b}`, rtex = `${sy < 0 ? '-' : ''}\\sqrt{${e.b}}`, xt = fmt(sx * e.a), xtex = fmtT(sx * e.a);
    Ptxt = swap ? `(${rt}, ${xt})` : `(${xt}, ${rt})`; Ptex = swap ? `(${rtex}, ${xtex})` : `(${xtex}, ${rtex})`;
    Pdata = swap ? [sy * Math.sqrt(e.b), sx * e.a] : [sx * e.a, sy * Math.sqrt(e.b)];
    sqLine = `CP² = ${swap ? `(${rt})² + ${sq(sx * e.a)}` : `${sq(sx * e.a)} + (${rt})²`} = ${swap ? `${e.b} + ${e.a * e.a}` : `${e.a * e.a} + ${e.b}`} = ${e.a * e.a + e.b}.`;
  } else {
    const vs = [...Array(13).keys()].flatMap(i => [...Array(13).keys()].map(j => [i - 6, j - 6] as V)).filter(v => v[0] || v[1]);
    const v0 = pickOf(R, vs.filter(v => v[0] ** 2 + v[1] ** 2 >= 9 && v[0] ** 2 + v[1] ** 2 <= 36));
    r2 = v0[0] ** 2 + v0[1] ** 2;
    if (c === 3) { givenQ = add(C, pickOf(R, vs.filter(v => v[0] ** 2 + v[1] ** 2 === r2 && !(v[0] === v0[0] && v[1] === v0[1])))); }
    const off = c === 1 ? pickOf(R, [1, -1]) : c === 2 ? 0 : pickOf(R, [0, 1, -1]);
    const cand = vs.filter(v => v[0] ** 2 + v[1] ** 2 === r2 + off);
    if (!cand.length) throw new Reroll();
    Pdata = add(C, pickOf(R, cand)); Ptxt = pt(Pdata); Ptex = ptT(Pdata);
    sqLine = `CP² = ${sq(Pdata[0] - C[0])} + ${sq(Pdata[1] - C[1])} = ${fmt((Pdata[0] - C[0]) ** 2 + (Pdata[1] - C[1]) ** 2)}.`;
  }
  if (givenQ && same2(givenQ, Pdata)) throw new Reroll();
  const p2 = (Pdata[0] - C[0]) ** 2 + (Pdata[1] - C[1]) ** 2, rel = near(p2, r2) ? 'on' : p2 < r2 ? 'in' : 'out';
  const rr = Math.sqrt(r2), roundsSame = Math.round(Math.sqrt(p2)) === Math.round(rr) && rel !== 'on';
  const rT = isSq(r2) ? String(rr) : radT(r2);
  const opts: Opt[] = [
    { t: 'On the circle', ok: rel === 'on', key: 'on', mc: rel === 'on' ? undefined : MC.locusEye, say: rel === 'on' ? `Right: CP² = ${fmt(p2)} = r².` : `CP² = ${fmt(p2)} but r² = ${r2}: close, not equal.` },
    { t: 'Inside the circle', ok: rel === 'in', key: 'in', say: rel === 'in' ? `Right: CP² = ${fmt(p2)} < ${r2}.` : `CP² = ${fmt(p2)}, which is not less than ${r2}.` },
    { t: 'Outside the circle', ok: rel === 'out', key: 'out', say: rel === 'out' ? `Right: CP² = ${fmt(p2)} > ${r2}.` : `CP² = ${fmt(p2)}, which is not more than ${r2}.` },
    ...(roundsSame ? [{ t: `On the circle: CP rounds to ${Math.round(rr)}`, key: 'round', mc: MC.rounding, say: `Rounding hides the gap: CP² = ${fmt(p2)}, r² = ${r2}.` }] : []),
  ];
  return choice(R, {
    id: `onCircle-${n}`, family: 'onCircle',
    prompt: givenQ ? `A circle has center ${ptN('C', C)} and passes through ${ptN('Q', givenQ)}. Where is ${'P' + Ptxt}?` : `A circle has center ${ptN('C', C)} and radius ${rT}. Where is ${'P' + Ptxt}?`,
    board: givenQ ? `${ptNT('C', C)} \\quad ${ptNT('Q', givenQ)} \\quad P${Ptex}` : `${ptNT('C', C)} \\quad r = ${radTex(r2)} \\quad P${Ptex}`,
    picture: { plane: plane({ circles: [{ key: 'c', c: C, r: rr, col: 'first' }], pts: [P('C', C, 'C', 'dim'), P('P', Pdata, 'P', 'pick'), ...(givenQ ? [P('Q', givenQ, 'Q', 'second')] : [])] }, { segs: [{ key: 'cp', a: C, b: Pdata, col: 'link', dash: true }] }) },
    solution: [givenQ ? `r² = CQ² = ${sq(givenQ[0] - C[0])} + ${sq(givenQ[1] - C[1])} = ${r2}.` : `r = ${rT}, so r² = ${r2}.`, sqLine, `Compare CP² with r²: ${rel === 'on' ? 'equal, so P is on the circle' : rel === 'in' ? 'less, so P is inside' : 'more, so P is outside'}.`],
  }, opts, { keep: true, max: 3 });
});
export const whichOnCircle: Gen = (R, n) => retry(() => {
  const C = ipt(R, -3, 3), vs = [...Array(15).keys()].flatMap(i => [...Array(15).keys()].map(j => [i - 7, j - 7] as V)).filter(v => v[0] || v[1]);
  const r2 = pickOf(R, [25, 50, 65, 10, 13, 17, 20, 29, 34, 40, 45]);
  const on = vs.filter(v => v[0] ** 2 + v[1] ** 2 === r2);
  if (on.length < 2) throw new Reroll();
  const [q0, p0] = [pickOf(R, on), pickOf(R, on)];
  if (q0[0] === p0[0] && q0[1] === p0[1]) throw new Reroll();
  const Qp = add(C, q0), right = add(C, p0);
  const near6 = vs.filter(v => { const e = v[0] ** 2 + v[1] ** 2 - r2; return e !== 0 && Math.abs(e) <= 6; });
  const wrong: V[] = [];
  for (let t = 0; t < 40 && wrong.length < 3; t++) { const w = add(C, pickOf(R, near6)); if (!wrong.some(x => same2(x, w))) wrong.push(w); }
  if (wrong.length < 3) throw new Reroll();
  return choice(R, {
    id: `whichOnCircle-${n}`, family: 'whichOnCircle', prompt: `A circle has center ${ptN('C', C)} and passes through ${ptN('Q', Qp)}. Which point lies on it?`,
    board: `${ptNT('C', C)} \\quad ${ptNT('Q', Qp)}`,
    picture: { plane: plane({ circles: [{ key: 'c', c: C, r: Math.sqrt(r2), col: 'first' }], pts: [P('C', C, 'C', 'dim'), P('Q', Qp, 'Q', 'second')] }, { pts: [P('p', right, '', 'link')] }) },
    solution: [`r² = CQ² = ${sq(q0[0])} + ${sq(q0[1])} = ${r2}.`, `A point is on the circle exactly when its squared distance from C is ${r2}.`],
  }, [
    { t: pt(right), ok: true, key: vk(right), say: `Right: its squared distance from C is ${r2}.` },
    ...wrong.map(w => ({ t: pt(w), key: vk(w), mc: MC.locusEye, say: `Its squared distance from C is ${(w[0] - C[0]) ** 2 + (w[1] - C[1]) ** 2}, not ${r2}: close, but off the circle.` })),
  ], { max: 3 });
});

void qT; void q; void par; void rad;
