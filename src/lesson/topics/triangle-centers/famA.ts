// famA.ts: stage 1 of "Midsegments and points of concurrency": read a special segment from its marks (midsegment,
// median, altitude, angle bisector, perpendicular bisector), the four centers with their lines, properties and
// locations. Every figure is exact; letters are random (role letters A, B, C, D, E, M, P relabelled).
import type { Pt } from '../geometry-foundations/geo';
import { dist, measure } from '../geometry-foundations/geo';
import { type Kind, type Tri, altitudeFoot, angles, circumcenterOf, footOf, incenterOf, inradiusOf, kindOf, lerpP, makeTri, mid, sub, unit, whereIs } from './centers';
import { type CK, type SK, CK_WORD, SK_WORD, centerOf, centerTri, inward, linesFig, ptsOf, special } from './tfigs';
import { type Gen, type Opt, MC, albl, arc, box, choiceT, fig, fitted, lbl, lineEnds, numT, pick, r, relabel, segN, shuffle, tick } from './tkit';
import { circleSegs, mapFig as mapFig0, tw as tw0 } from '../triangle-congruence/tri';

const ROLES = 'ABCDEMPQ';
const tri = (s: string) => `△${s}`;

// ---------- the five special segments ----------
const SK_SG: Record<string, SK> = { 's1-midsegment-identify': 'midseg', 's1-median-identify': 'median', 's1-altitude-identify': 'altitude', 's1-angle-bisector-identify': 'bisector', 's1-perp-bisector-identify': 'perpbis' };
function skMc(truth: SK, said: SK): string | undefined {
  const pair = [truth, said].sort().join('|');
  if (pair === 'altitude|median') return MC.medAlt;
  if (pair === 'median|midseg') return MC.medMidseg;
  if (pair === 'altitude|perpbis') return MC.altPerp;
  if (pair === 'bisector|median') return MC.bisMid;
  return undefined;
}
const SK_WHY: Record<SK, string> = {
  median: 'The ticks make D the midpoint of the opposite side, and the segment starts at a vertex.',
  altitude: 'The box makes AD perpendicular to the line of the opposite side, and it starts at a vertex.',
  bisector: 'The two equal arcs at A split the angle into two congruent angles.',
  perpbis: 'The ticks make M the midpoint of the side and the box makes ℓ perpendicular there.',
  midseg: 'The ticks make D and E the midpoints of two sides.',
};
const SK_NOT: Record<SK, string> = {
  median: 'That needs a marked midpoint of the opposite side, joined to the vertex.',
  altitude: 'That needs a right-angle box where the segment meets the opposite side.',
  bisector: 'That needs two equal arcs at the vertex.',
  perpbis: 'That needs both a marked midpoint and a right-angle box on the side.',
  midseg: 'That needs two marked midpoints, one on each of two sides.',
};
export const segKind: Gen = (R, n, sg) => fitted('segKind', () => {
  const main = SK_SG[sg ?? ''];
  const k: SK = main && R() < 0.7 ? main : pick(R, ['median', 'altitude', 'bisector', 'perpbis', 'midseg'] as SK[]);
  const T = k === 'altitude' && R() < 0.4 ? makeTri(R, 'obtuse', { at: 1, lo: 104, hi: 122 }) : makeTri(R, 'acute');
  const s = special(T, k);
  if (!s) throw new Error('looks like another kind');
  const t = relabel(R, ROLES);
  const others = shuffle(R, (['median', 'altitude', 'bisector', 'perpbis', 'midseg'] as SK[]).filter(x => x !== k)).slice(0, 3);
  const obj = s.obj === 'line ℓ' ? 'line ℓ' : segN(s.obj);
  const opts: Opt[] = [{ t: SK_WORD[k], ok: true, say: `Right: ${SK_WHY[k]}` }, ...others.map(o => ({ t: SK_WORD[o], mc: skMc(k, o), say: `${SK_NOT[o]} Read the marks: ${SK_WHY[k].charAt(0).toLowerCase()}${SK_WHY[k].slice(1)}` }))];
  return choiceT(R, t, {
    id: `segKind-${n}`, family: 'segKind', prompt: `Read only the marks. What is ${obj} in ${tri('ABC')}?`, board: '\\triangle ABC',
    solution: [SK_WHY[k], `So ${obj} is ${SK_WORD[k]}.`],
    picture: { fig: s.fig, reveal: {} },
  }, opts);
});

// ---------- s1-midsegment-identify ----------
export const midsegId: Gen = (R, n) => fitted('midsegId', () => {
  const T = makeTri(R, pick(R, ['acute', 'right', 'obtuse'] as Kind[]), { at: r(R, 0, 2) });
  const [A, B, C] = T;
  const v = pick(R, ['both', 'one', 'none'] as const);
  const tD = v === 'none' ? pick(R, [0.36, 0.4, 0.6, 0.64]) : 0.5;
  const tE = v === 'both' ? 0.5 : v === 'none' ? tD : pick(R, [0.32, 0.38, 0.62, 0.68]);
  const D = lerpP(A, B, tD), E = lerpP(A, C, tE);
  const marks = v === 'both' ? [tick('AD', 1), tick('DB', 1), tick('AE', 2), tick('EC', 2)] : v === 'one' ? [tick('AD', 1), tick('DB', 1)] : [];
  const f = fig({ pts: { ...ptsOf(T), D, E }, segs: ['AD', 'DB', 'AE', 'EC', 'BC', 'DE'], marks, body: 'ABC' });
  const t = relabel(R, ROLES);
  const opts: Opt[] = [
    { t: 'Yes: both endpoints are marked midpoints', ok: v === 'both', say: v === 'both' ? 'Right: D and E are both marked midpoints.' : 'Look at the marks again: not both endpoints are marked midpoints.' },
    { t: 'No: only one endpoint is a marked midpoint', ok: v === 'one', say: v === 'one' ? 'Right: E is not marked, so DE is not a midsegment.' : v === 'both' ? 'Both D and E carry midpoint marks.' : 'Neither endpoint carries a midpoint mark.' },
    { t: 'No: no endpoint is a marked midpoint, it only looks parallel', ok: v === 'none', say: v === 'none' ? 'Right: looking parallel is not a mark.' : 'At least one endpoint carries midpoint marks.' },
  ];
  if (v !== 'both') opts.push({ t: 'Yes: one marked midpoint is enough', mc: MC.midNoTwo, say: 'A midsegment joins TWO midpoints, one on each side.' });
  return choiceT(R, t, {
    id: `midsegId-${n}`, family: 'midsegId', prompt: `D is on ${segN('AB')} and E is on ${segN('AC')}. Is ${segN('DE')} a midsegment of ${tri('ABC')}?`, board: '\\overline{DE}\\text{: a midsegment?}',
    solution: [v === 'both' ? 'D and E are both marked as midpoints of two sides.' : v === 'one' ? 'Only D is marked as a midpoint; E is not.' : 'No midpoint is marked; a segment that looks parallel proves nothing.', `A midsegment joins the midpoints of two sides, so the answer is: ${v === 'both' ? 'yes' : 'no'}.`],
    picture: { fig: f, reveal: {} },
  }, opts, true);
});

// ---------- s1-median-identify ----------
export const medianWhich: Gen = (R, n) => fitted('medianWhich', () => {
  const T = makeTri(R, 'acute');
  const [A, B, C] = T;
  const M = mid(B, C), N = mid(A, C);
  const alt = R() < 0.5;
  const H = alt ? altitudeFoot(T, 0) : lerpP(B, C, pick(R, [0.22, 0.28, 0.72, 0.78]));
  const tH = (H[0] - B[0]) / (C[0] - B[0] || 1e-9);
  if (dist(H, M) < 0.16 * dist(B, C) || dist(H, B) < 0.12 * dist(B, C) || dist(H, C) < 0.12 * dist(B, C)) throw new Error('too close');
  if (Math.abs(measure(M, A, B) - 90) < 12) throw new Error('median looks perpendicular');
  void tH;
  // order the points on BC: B, then the nearer of M / H
  const onBC = [{ n: 'M', p: M }, { n: 'H', p: H }].sort((x, y) => dist(B, x.p) - dist(B, y.p));
  const segs = ['AB', 'AN', 'NC', `B${onBC[0]!.n}`, `${onBC[0]!.n}${onBC[1]!.n}`, `${onBC[1]!.n}C`, 'AM', 'AH', 'MN'];
  const marks = [tick('AN', 2), tick('NC', 2), ...(alt ? [box(`AH${onBC[0]!.n === 'H' ? 'C' : 'B'}`)] : [])];
  // ticks on the halves of BC: BM and MC as whole pieces (H splits one of them)
  const f = fig({ pts: { ...ptsOf(T), M, N, H }, segs, marks, body: 'ABC', extra: [] });
  // the halves of BC carry one tick each: draw them as overlays on the pieces next to M
  f.segs.push({ a: B, b: M, ticks: 1 }, { a: M, b: C, ticks: 1 });
  const t = relabel(R, 'ABCMNH');
  const opts: Opt[] = [
    { t: segN('AM'), ok: true, say: 'Right: AM joins vertex A to the midpoint M of the opposite side.' },
    { t: segN('MN'), mc: MC.medMidseg, say: 'MN joins two midpoints: that is a midsegment, not a median.' },
    { t: segN('AH'), mc: alt ? MC.medAlt : undefined, say: alt ? 'AH is perpendicular to BC (the box), but H is not the midpoint: an altitude.' : 'H is not marked as a midpoint of BC.' },
  ];
  return choiceT(R, t, {
    id: `medianWhich-${n}`, family: 'medianWhich', prompt: `Which segment is a median of ${tri('ABC')}?`, board: '\\text{a median?}',
    solution: ['A median joins a vertex to the midpoint of the opposite side.', 'The ticks make M the midpoint of BC; A is the opposite vertex.', `So: ${segN('AM')}.`],
    picture: { fig: f, reveal: {} },
  }, opts);
});

// ---------- s1-altitude-identify ----------
export const altitudeCase: Gen = (R, n) => fitted('altitudeCase', () => {
  const v = pick(R, ['obtuse', 'right', 'both'] as const);
  if (v === 'obtuse') {
    const T = makeTri(R, 'obtuse', { at: 1, lo: 106, hi: 125 });
    const [, B, C] = T;
    const tilt = Math.abs(((Math.atan2(C[1] - B[1], C[0] - B[0]) * 180) / Math.PI + 360) % 180);
    const tilted = Math.min(tilt, 180 - tilt) > 20 && Math.abs(tilt - 90) > 20;
    const f = fig({ pts: ptsOf(T), segs: ['AB', 'BC', 'AC'], body: 'ABC', marks: [albl('ABC', `${Math.round(angles(T)[1])}°`)] });
    const t = relabel(R, 'ABC');
    const opts: Opt[] = [
      { t: 'From A, perpendicular to line BC extended, meeting it outside the triangle', ok: true, say: 'Right: extend BC past B; the perpendicular from A meets the extension.' },
      { t: 'There is none: the perpendicular from A misses side BC', mc: MC.extAlt, say: 'An altitude meets the LINE of the opposite side; extend BC.' },
      { t: 'From A to the midpoint of BC', mc: MC.medAlt, say: 'That is the median from A.' },
    ];
    if (tilted) opts.push({ t: 'Straight down the page from A', mc: MC.vertical, say: 'Perpendicular to BC, not vertical on the page: BC is tilted.' });
    return choiceT(R, t, {
      id: `altitudeCase-${n}`, family: 'altitudeCase', prompt: `${tri('ABC')} has an obtuse angle at B. Where is the altitude from A?`, board: `m\\angle ABC = ${Math.round(angles(T)[1])}^\\circ`,
      solution: ['An altitude is perpendicular from a vertex to the LINE of the opposite side.', 'The angle at B is obtuse, so the foot lands on BC extended past B, outside the triangle.'],
      picture: { fig: f, reveal: {} },
    }, opts);
  }
  if (v === 'right') {
    const T = makeTri(R, 'right', { at: 2 });
    const f = fig({ pts: ptsOf(T), segs: ['AB', 'BC', 'AC'], body: 'ABC', marks: [box('ACB')] });
    const t = relabel(R, 'ABC');
    return choiceT(R, t, {
      id: `altitudeCase-${n}`, family: 'altitudeCase', prompt: `${tri('ABC')} has a right angle at C. Which segment is the altitude from A?`, board: '\\angle C = 90^\\circ',
      solution: ['The altitude from A is perpendicular to the line BC.', 'AC is already perpendicular to BC (the box at C), so the leg is the altitude.', `So: the leg ${segN('AC')}.`],
      picture: { fig: f, reveal: {} },
    }, [
      { t: `the leg ${segN('AC')}`, ok: true, say: 'Right: in a right triangle each leg is an altitude.' },
      { t: 'the segment from A to the midpoint of BC', mc: MC.medAlt, say: 'That is the median from A.' },
      { t: 'there is none: an altitude must be drawn inside the triangle', mc: MC.extAlt, say: 'The leg itself is perpendicular to BC.' },
      { t: 'the hypotenuse AB', say: 'AB is not perpendicular to BC.' },
    ]);
  }
  // an altitude that also carries midpoint marks (an isosceles drawing, read from the marks only)
  const base = r(R, 300, 380), h = base * (0.55 + R() * 0.5), turn = r(R, 0, 359);
  const rot = (p: Pt): Pt => { const a = (turn * Math.PI) / 180; return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; };
  const B = rot([-base / 2, 0]), C = rot([base / 2, 0]), A = rot([0, h]), D = rot([0, 0]);
  const f = fig({ pts: { A, B, C, D }, segs: ['AB', 'AC', 'BD', 'DC', 'AD'], marks: [tick('BD', 1), tick('DC', 1), box('ADC')], body: 'ABC' });
  const t = relabel(R, 'ABCD');
  return choiceT(R, t, {
    id: `altitudeCase-${n}`, family: 'altitudeCase', prompt: `Read only the marks. What is ${segN('AD')}?`, board: '\\overline{AD}',
    solution: ['The box makes AD perpendicular to BC: an altitude.', 'The ticks make D the midpoint of BC: a median.', 'So: both an altitude and a median.'],
    picture: { fig: f, reveal: {} },
  }, [
    { t: 'both an altitude and a median', ok: true, say: 'Right: each mark gives one of the two names.' },
    { t: 'only an altitude: a segment cannot be two things', mc: MC.medAlt, say: 'The ticks make D the midpoint too: it is also a median.' },
    { t: 'only a median', mc: MC.medAlt, say: 'The box makes it perpendicular too: it is also an altitude.' },
  ]);
});

// ---------- s1-angle-bisector-identify ----------
export const bisectorMid: Gen = (R, n) => fitted('bisectorMid', () => {
  const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: R() < 0.5 ? 0 : 1 });
  const [A, B, C] = T;
  if (Math.abs(dist(A, B) / dist(A, C) - 1) < 0.28) throw new Error('nearly isosceles');
  const s = special(T, 'bisector');
  if (!s) throw new Error('looks like another kind');
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `bisectorMid-${n}`, family: 'bisectorMid', prompt: `The arcs show that ${segN('AD')} bisects ∠BAC. Which statement must be true?`, board: '\\overline{AD}\\text{ bisects }\\angle BAC',
    solution: ['Bisecting an angle splits the ANGLE into two congruent angles.', 'Nothing is said about the opposite side: D is not marked as its midpoint.', 'So: ∠BAD ≅ ∠DAC.'],
    picture: { fig: s.fig, reveal: {} },
  }, [
    { t: '∠BAD ≅ ∠DAC', ok: true, say: 'Right: that is what bisecting the angle means.' },
    { t: `${segN('BD')} ≅ ${segN('DC')}`, mc: MC.bisMid, say: 'An angle bisector halves the angle, not the opposite side: here BD and DC differ.' },
    { t: `${segN('AD')} ⊥ ${segN('BC')}`, mc: MC.bisRight, say: 'Nothing marks a right angle at D.' },
    { t: `${segN('AD')} is a median`, mc: MC.bisMid, say: 'A median needs D to be the midpoint of BC.' },
  ]);
});

// ---------- s1-perp-bisector-identify ----------
export const perpBisCheck: Gen = (R, n) => fitted('perpBisCheck', () => {
  const v = pick(R, ['both', 'perp', 'mid', 'vertex'] as const);
  let T: Tri, M: Pt, u: Pt;
  if (v === 'vertex') {
    const base = r(R, 300, 380), h = base * (0.6 + R() * 0.5);
    T = [[0, h], [-base / 2, 0], [base / 2, 0]] as Tri;
    M = [0, 0]; u = [0, 1];
  } else {
    T = makeTri(R, 'acute');
    const [A, B, C] = T;
    const tM = v === 'perp' ? pick(R, [0.32, 0.38, 0.62, 0.68]) : 0.5;
    M = lerpP(B, C, tM);
    u = inward(A, B, C);
    if (v === 'mid') { const a = (pick(R, [62, 68, 112, 118]) * Math.PI) / 180, w = unit(sub(C, B)); u = [w[0] * Math.cos(a) - w[1] * Math.sin(a), w[0] * Math.sin(a) + w[1] * Math.cos(a)]; if ((A[0] - B[0]) * u[0] + (A[1] - B[1]) * u[1] < 0) u = [-u[0], -u[1]]; }
    const nrm: Pt = [-u[1], u[0]];
    if (Math.abs((A[0] - M[0]) * nrm[0] + (A[1] - M[1]) * nrm[1]) < 0.16 * dist(B, C)) throw new Error('through the vertex');
  }
  const [A, B, C] = T;
  const h = dist(A, M);
  const [P, Q] = lineEnds(M, u, 0.32 * h, v === 'vertex' ? 1.25 * h : 1.15 * h);
  const marks = [...(v !== 'perp' ? [tick('BM', 1), tick('MC', 1)] : []), ...(v !== 'mid' ? [box('QMC')] : [])];
  const f = fig({ pts: { A, B, C, M, P, Q }, bare: ['P', 'Q'], segs: ['AB', 'AC', 'BM', 'MC', 'PQ'], marks, segStyle: { PQ: { kind: 'line', name: 'ℓ' } }, body: 'ABC' });
  const t = relabel(R, 'ABCM');
  const opts: Opt[] = [
    { t: 'Yes: it is perpendicular to BC at its midpoint', ok: v === 'both' || v === 'vertex', say: v === 'both' || v === 'vertex' ? 'Right: both conditions are marked.' : 'One of the two conditions is not marked.' },
    { t: 'No: it is perpendicular to BC, but M is not marked as the midpoint', ok: v === 'perp', say: v === 'perp' ? 'Right: perpendicular alone is not enough.' : v === 'mid' ? 'Look again: nothing marks a right angle at M.' : 'M is marked as the midpoint (the ticks).' },
    { t: 'No: M is the midpoint, but ℓ is not marked perpendicular', ok: v === 'mid', say: v === 'mid' ? 'Right: bisecting alone is not enough.' : 'There is a right-angle box at M.' },
  ];
  if (v === 'vertex') opts.push({ t: 'No: it passes through a vertex, so it is only an altitude', mc: MC.altPerp, say: 'It is perpendicular at the midpoint of BC: a perpendicular bisector, whether or not it also passes through A.' });
  else opts.push({ t: 'No: a perpendicular bisector must pass through the opposite vertex', mc: MC.altPerp, say: 'That describes an altitude. A perpendicular bisector need not pass through any vertex.' });
  return choiceT(R, t, {
    id: `perpBisCheck-${n}`, family: 'perpBisCheck', prompt: `Read only the marks. Is line ℓ the perpendicular bisector of ${segN('BC')}?`, board: '\\ell\\text{: perpendicular bisector of }\\overline{BC}?',
    solution: ['A perpendicular bisector needs BOTH marks: the midpoint (ticks) and the right angle (box).', v === 'both' || v === 'vertex' ? 'Both are marked, so yes; passing through a vertex or not does not matter.' : v === 'perp' ? 'Only the box is marked, so no.' : 'Only the ticks are marked, so no.'],
    picture: { fig: f, reveal: {} },
  }, opts, true);
});

// ---------- s1-centroid-concurrence ----------
export const thirdMedian: Gen = (R, n) => fitted('thirdMedian', () => {
  const kind = pick(R, ['acute', 'right', 'obtuse'] as Kind[]);
  const T = makeTri(R, kind, { at: r(R, 0, 2) });
  const f = linesFig(T, 'centroid', { only: [0, 1] });
  const K = mid(T[0], T[1]);
  f.points.push({ at: K, name: 'K', dir: 0 });
  const [A, B] = T;
  f.segs = f.segs.filter(s => s.id !== 'AB');
  f.segs.push({ id: 'AK', a: A, b: K, ticks: 3 }, { id: 'KB', a: K, b: B, ticks: 3 }, { id: 'CK', a: T[2], b: K, col: 'link', solve: true });
  // the K letter: away from the triangle
  const C0 = T[2], d = sub(K, C0), L = Math.hypot(d[0], d[1]);
  f.points[f.points.length - 1]!.dir = (Math.atan2(d[1] / L, d[0] / L) * 180) / Math.PI;
  const t = relabel(R, 'ABCKP');
  return choiceT(R, t, {
    id: `thirdMedian-${n}`, family: 'thirdMedian', prompt: `The medians from A and B meet at P. K is the midpoint of ${segN('AB')}. Where does the median ${segN('CK')} go?`, board: '\\text{the third median } \\overline{CK}',
    solution: ['The three medians of every triangle meet in one point, the centroid.', 'P is where two of them meet, so the third passes through P as well.', 'So: through P, in every triangle.'],
    picture: { fig: f, reveal: { solve: true } },
  }, [
    { t: 'through P, in every triangle', ok: true, say: 'Right: the medians are always concurrent.' },
    { t: 'it misses P slightly: three lines rarely meet in one point', mc: MC.thirdMiss, say: 'For medians it is a theorem: all three always meet at the centroid.' },
    { t: 'through P only if the triangle is acute', mc: MC.thirdMiss, say: 'The medians meet at the centroid in every triangle, acute, right or obtuse.' },
    { t: 'through P only if the triangle is isosceles', mc: MC.thirdMiss, say: 'No condition is needed: all three medians always meet.' },
  ]);
});
export const centroidLines: Gen = (R, n) => fitted('centroidLines', () => {
  const v = pick(R, ['lines', 'where'] as const);
  const kind: Kind = pick(R, ['acute', 'obtuse', 'right'] as Kind[]);
  const T = makeTri(R, kind, { at: r(R, 0, 2), lo: 104, hi: 118 });
  const f = linesFig(T, 'centroid');
  const t = relabel(R, 'ABCP');
  if (v === 'lines') return choiceT(R, t, {
    id: `centroidLines-${n}`, family: 'centroidLines', prompt: 'P is the centroid of △ABC. Which lines must pass through P?', board: 'P\\text{: the centroid}',
    solution: ['The centroid is defined as the point where the three medians meet.', 'The altitudes and angle bisectors meet at other points (in any triangle that is not equilateral).', 'So: the three medians.'],
    picture: { fig: f, reveal: {} },
  }, [
    { t: 'the three medians', ok: true, say: 'Right: the centroid is where the medians meet.' },
    { t: 'the medians and the altitudes', mc: MC.allCentroid, say: 'The altitudes meet at the orthocenter, a different point here.' },
    { t: 'every special segment of the triangle', mc: MC.allCentroid, say: 'Each kind of line has its own meeting point.' },
    { t: 'only two of the medians; the third may miss', mc: MC.thirdMiss, say: 'All three medians always pass through the centroid.' },
  ]);
  return choiceT(R, t, {
    id: `centroidLines-${n}`, family: 'centroidLines', prompt: `P is the centroid of this ${kind} triangle. Where does it lie?`, board: `\\text{${kind} triangle}`,
    solution: ['Each median runs from a vertex to a point of the opposite side, inside the triangle.', 'Their meeting point is inside too, for every triangle.', 'So: inside the triangle, as it always is.'],
    picture: { fig: f, reveal: {} },
  }, [
    { t: 'inside the triangle, as it always is', ok: true, say: 'Right: the medians stay inside, so the centroid does too.' },
    { t: 'outside the triangle', say: 'The centroid is inside every triangle; it is the circumcenter and orthocenter that can move outside.' },
    { t: 'on the longest side', say: 'Only a right triangle\'s circumcenter sits on a side.' },
  ]);
});

// ---------- s1-perp-bisector-equidistance ----------
function pbSetup(R: () => number, PA: number, AM: number, below: boolean) {
  const k = 330 / PA, PM = Math.sqrt(PA * PA - AM * AM);
  const A: Pt = [-AM * k, 0], B: Pt = [AM * k, 0], M: Pt = [0, 0], P: Pt = [0, (below ? -1 : 1) * PM * k];
  const Q: Pt = [0, (below ? 1 : -1) * Math.max(110, PM * k * 0.45)], P2: Pt = [0, (below ? -1 : 1) * (PM * k + 120)];
  return { A, B, M, P, ends: [Q, P2] as [Pt, Pt] };
}
export const pbEquiNum: Gen = (R, n) => fitted('pbEquiNum', () => {
  const dec = R() < 0.4;
  const AM = dec ? r(R, 30, 70) / 10 : r(R, 3, 9), PA = dec ? Math.round((AM + r(R, 15, 60) / 10) * 10) / 10 : AM + r(R, 2, 7);
  const S = pbSetup(R, PA, AM, R() < 0.4);
  const turn = r(R, -40, 40), rot = (p: Pt): Pt => { const a = (turn * Math.PI) / 180; return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; };
  const f = fig({
    pts: { A: rot(S.A), B: rot(S.B), M: rot(S.M), P: rot(S.P), X: rot(S.ends[0]), Y: rot(S.ends[1]) }, bare: ['X', 'Y'],
    segs: ['AM', 'MB', 'XY', 'PA', 'PB'], marks: [tick('AM', 1), tick('MB', 1), box('YMB'), lbl('PA', `${PA} cm`), { seg: 'AM', n: 1, text: `${AM} cm` }, lbl('PB', '?')],
    segStyle: { XY: { kind: 'line', name: 'ℓ' }, PB: { alt: `${PA} cm`, text: '?' } },
  });
  const t = relabel(R, 'ABMP');
  return numT(t, {
    id: `pbEquiNum-${n}`, family: 'pbEquiNum', prompt: `Line ℓ is the perpendicular bisector of ${segN('AB')}, and P is on ℓ. PA = ${PA} cm and AM = ${AM} cm. How long is ${segN('PB')}?`, board: `PA = ${PA},\\ AM = ${AM},\\ PB = \\,?`, unit: 'cm',
    solution: ['P is on the perpendicular bisector of AB.', 'Every point on it is the same distance from A and from B.', `So PB = PA = <b class="s">${PA}</b> cm.`],
    picture: { fig: f, reveal: { solved: ['PB'] } },
  }, PA, [{ v: AM, say: 'AM is half of AB; the question asks for the distance from P to B.' }, { v: 2 * AM, say: 'That is AB. P is the same distance from A and B.' }], 'Right: on the perpendicular bisector, PA = PB.', 'Every point on the perpendicular bisector of AB is the same distance from A and from B.');
});
export const pbEquiWhich: Gen = (R, n) => fitted('pbEquiWhich', () => {
  const AM = r(R, 4, 7), k = 180 / AM;
  const A: Pt = [-AM * k, 0], B: Pt = [AM * k, 0], M: Pt = [0, 0];
  const midRight = R() < 0.3;
  const hP = r(R, 4, 9) * k * (R() < 0.5 ? -1 : 1);
  const onL: Pt = [0, hP];
  const off1: Pt = [pick(R, [-1, 1]) * r(R, 2, 4) * k * 0.7, -hP * (0.5 + R() * 0.4)];
  const off2: Pt = [pick(R, [-1, 1]) * r(R, 2, 3) * k * 0.6, 0];
  const pts: Record<string, Pt> = { A, B, M, X: [0, -Math.sign(hP) * 140], Y: [0, hP + Math.sign(hP) * 120] };
  const right = midRight ? 'M' : 'P';
  pts.P = midRight ? [pick(R, [-1, 1]) * r(R, 2, 4) * k * 0.6, hP] : onL;
  pts.Q = off1;
  if (!midRight) pts.R = off2;
  const f = fig({ pts, bare: ['X', 'Y'], segs: ['AM', 'MB', 'XY'], marks: [tick('AM', 1), tick('MB', 1), box('YMB')], segStyle: { XY: { kind: 'line', name: 'ℓ' } } });
  const t = relabel(R, 'ABMPQR');
  const names = midRight ? ['M', 'P', 'Q'] : ['P', 'Q', 'R'];
  return choiceT(R, t, {
    id: `pbEquiWhich-${n}`, family: 'pbEquiWhich', prompt: `Line ℓ is the perpendicular bisector of ${segN('AB')}. Which of the points ${names.join(', ')} must be the same distance from A and from B?`, board: '\\ell \\perp \\overline{AB}\\text{ at its midpoint}',
    solution: ['Every point ON the perpendicular bisector is equidistant from A and B.', midRight ? 'M is on ℓ (it is the midpoint itself); P and Q are not on ℓ.' : 'Only P lies on ℓ; Q and R are off it.', `So: ${right}.`],
    picture: { fig: f, reveal: {} },
  }, names.map(nm => ({ t: nm, ok: nm === right, say: nm === right ? 'Right: it lies on the perpendicular bisector.' : `${nm} is not on ℓ, so its distances to A and B differ.` })));
});

// ---------- s1-circumcenter / s1-orthocenter: where the center lies ----------
function whereItem(R: () => number, n: number, fam: string, ck: 'circumcenter' | 'orthocenter') {
  const kind = pick(R, ['acute', 'right', 'obtuse'] as Kind[]);
  const T = makeTri(R, kind, { at: r(R, 0, 2), lo: 102, hi: 125 });
  const a = angles(T).map(Math.round);
  const iBig = a.indexOf(Math.max(...a));
  const marks = [0, 1, 2].map(i => {
    const v = 'ABC'[i]!, p = 'ABC'[(i + 1) % 3]!, q = 'ABC'[(i + 2) % 3]!;
    return a[i] === 90 ? box(p + v + q) : albl(p + v + q, `${a[i]}°`);
  });
  const f = fig({ pts: ptsOf(T), segs: ['AB', 'BC', 'CA'], marks, body: 'ABC' });
  const w = whereIs(T, centerOf(T, ck));
  const truth = w === 'inside' ? 'in' : w === 'outside' ? 'out' : w === 'side' ? 'side' : 'vertex';
  const say = { in: 'inside the triangle', out: 'outside the triangle', side: 'at the midpoint of the longest side', vertex: 'at the vertex of the right angle' } as const;
  const why = ck === 'circumcenter'
    ? { in: 'In an acute triangle the perpendicular bisectors meet inside.', out: 'In an obtuse triangle the perpendicular bisectors meet outside, beyond the longest side.', side: 'In a right triangle the circumcenter is the midpoint of the hypotenuse.', vertex: '' }
    : { in: 'In an acute triangle the altitudes meet inside.', out: 'In an obtuse triangle the altitude lines meet outside, beyond the obtuse vertex.', side: '', vertex: 'In a right triangle the two legs are altitudes: they meet at the right-angle vertex.' };
  const keys = ['in', 'side', 'vertex', 'out'] as const;
  const t = relabel(R, 'ABC');
  return choiceT(R, t, {
    id: `${fam}-${n}`, family: fam, prompt: `Where is the ${ck} of this triangle?`, board: `${[0, 1, 2].map(i => `m\\angle ${'ABC'[i]} = ${a[i]}^\\circ`).join(',\\ ')}`,
    solution: [`The largest angle is ${a[iBig]}°: the triangle is ${kind}.`, why[truth], `So: ${say[truth]}.`],
    picture: { fig: f, reveal: {} },
  }, keys.map(k => ({ t: say[k], ok: k === truth, mc: k === 'in' && truth !== 'in' ? MC.inside : undefined, say: k === truth ? `Right: ${why[truth]}` : why[truth] })), true);
}
export const circumWhere: Gen = (R, n) => fitted('circumWhere', () => whereItem(R, n, 'circumWhere', 'circumcenter'));
export const orthoWhere: Gen = (R, n) => fitted('orthoWhere', () => whereItem(R, n, 'orthoWhere', 'orthocenter'));

// ---------- equidistant from what: circumcenter / incenter ----------
function equiFromItem(R: () => number, n: number, fam: string, ck: 'circumcenter' | 'incenter') {
  const T = centerTri(R, ck, pick(R, ['acute', 'acute', 'obtuse'] as Kind[]));
  const f = linesFig(T, ck);
  const t = relabel(R, 'ABCP');
  const right = ck === 'circumcenter' ? 'the three vertices' : 'the three sides';
  return choiceT(R, t, {
    id: `${fam}-${n}`, family: fam, prompt: `The marked ${ck === 'circumcenter' ? 'perpendicular bisectors' : 'angle bisectors'} meet at P. P is the same distance from ...`, board: `P\\text{: where the ${ck === 'circumcenter' ? 'perpendicular' : 'angle'} bisectors meet}`,
    solution: ck === 'circumcenter' ? ['Every point on the perpendicular bisector of a side is equidistant from that side\'s endpoints.', 'P is on all three, so PA = PB = PC.', 'So: the three vertices.'] : ['Every point on an angle bisector is equidistant from the two sides of the angle.', 'P is on all three, so it is the same distance from all three sides.', 'So: the three sides.'],
    picture: { fig: f, reveal: {} },
  }, [
    { t: 'the three vertices', ok: ck === 'circumcenter', mc: ck === 'incenter' ? MC.swap : undefined, say: ck === 'circumcenter' ? 'Right: P is the circumcenter.' : 'Equal distances to the vertices belong to the perpendicular bisectors (circumcenter).' },
    { t: 'the three sides', ok: ck === 'incenter', mc: ck === 'circumcenter' ? MC.swap : undefined, say: ck === 'incenter' ? 'Right: P is the incenter.' : 'Equal distances to the sides belong to the angle bisectors (incenter).' },
    { t: 'the midpoints of the three sides', mc: ck === 'circumcenter' ? MC.circToMid : undefined, say: `Those distances differ here. P is equidistant from ${right}.` },
  ]);
}
export const circumWhich: Gen = (R, n) => fitted('circumWhich', () => equiFromItem(R, n, 'circumWhich', 'circumcenter'));
export const inWhich: Gen = (R, n) => fitted('inWhich', () => equiFromItem(R, n, 'inWhich', 'incenter'));

// ---------- s1-angle-bisector-equidistance ----------
function abSetup(R: () => number, PE: number, AP: number) {
  const k = 380 / AP, half = Math.asin(PE / AP) * 180 / Math.PI, turn = r(R, 0, 359);
  const rot = (p: Pt): Pt => { const a = (turn * Math.PI) / 180; return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)]; };
  const A: Pt = [0, 0], P: Pt = [AP * k, 0];
  const ray = (s: number): Pt => [Math.cos((s * half * Math.PI) / 180), Math.sin((s * half * Math.PI) / 180)];
  const E = footOf(P, A, ray(1)), F = footOf(P, A, ray(-1));
  const far = AP * k * 1.45;
  const Bp: Pt = [ray(1)[0] * far, ray(1)[1] * far], Cp: Pt = [ray(-1)[0] * far, ray(-1)[1] * far], X: Pt = [AP * k * 1.4, 0];
  return { half, pts: { A: rot(A), P: rot(P), E: rot(E), F: rot(F), B: rot(Bp), C: rot(Cp), X: rot(X) } as Record<string, Pt> };
}
export const abEquiNum: Gen = (R, n) => fitted('abEquiNum', () => {
  const dec = R() < 0.35;
  const PE = dec ? r(R, 30, 65) / 10 : r(R, 3, 8), AP = Math.round(PE * (1.9 + R() * 1.0) * (dec ? 10 : 1)) / (dec ? 10 : 1);
  const S = abSetup(R, PE, AP);
  if (S.half < 17 || S.half > 33 || AP === PE) throw new Error('angle');
  const f = fig({
    pts: S.pts, bare: ['X'], segs: ['AB', 'AC', 'AP', 'PX', 'PE', 'PF'], marks: [arc('BAX', 1), arc('XAC', 1), box('AEP'), box('AFP'), lbl('PE', `${PE} cm`), lbl('AP', `${AP} cm`)],
    segStyle: { AB: { kind: 'ray' }, AC: { kind: 'ray' }, PX: { kind: 'ray', col: 'faint' }, AP: { col: 'faint' } },
  });
  const t = relabel(R, 'ABCEFP');
  return numT(t, {
    id: `abEquiNum-${n}`, family: 'abEquiNum', prompt: `P is on the bisector of ∠BAC, ${segN('PE')} ⊥ ${segN('AB')} and ${segN('PF')} ⊥ ${segN('AC')}. PE = ${PE} cm and AP = ${AP} cm. How far is P from ray AC?`, board: `PE = ${PE},\\ AP = ${AP},\\ PF = \\,?`, unit: 'cm',
    solution: ['The distance from P to a side is measured along the perpendicular: PE and PF.', 'P is on the bisector, so it is equidistant from the two sides.', `So PF = PE = <b class="s">${PE}</b> cm.`],
    picture: { fig: f, reveal: { glow: ['PF'] } },
  }, PE, [{ v: AP, mc: MC.slanted, say: 'AP is the distance to the vertex A, not to the side. Use the perpendicular PF.' }], 'Right: equal perpendicular distances to the sides.', 'Measure the distance to a side along the perpendicular; on the bisector those distances are equal.');
});
export const abEquiWhich: Gen = (R, n) => fitted('abEquiWhich', () => {
  const S = abSetup(R, r(R, 3, 6), r(R, 9, 13));
  if (S.half < 16 || S.half > 34) throw new Error('angle');
  const pts = S.pts;
  // a slanted segment from P to ray AB, beyond E (not perpendicular)
  const Q: Pt = lerpP(pts.A!, pts.B!, Math.min(0.92, dist(pts.A!, pts.E!) / dist(pts.A!, pts.B!) + pick(R, [0.22, 0.28])));
  pts.Q = Q;
  const f = fig({ pts, bare: ['X'], segs: ['AB', 'AC', 'AX', 'PE', 'PF', 'PQ'], marks: [arc('BAX', 1), arc('XAC', 1), box('AEP'), box('AFP')], segStyle: { AB: { kind: 'ray' }, AC: { kind: 'ray' }, AX: { kind: 'ray', col: 'faint' } } });
  const t = relabel(R, 'ABCEFPQ');
  return choiceT(R, t, {
    id: `abEquiWhich-${n}`, family: 'abEquiWhich', prompt: 'P is on the bisector of ∠BAC. Which segment\'s length is the distance from P to ray AB?', board: '\\text{distance from P to } \\overrightarrow{AB}',
    solution: ['The distance from a point to a line is the length of the perpendicular segment.', `The box marks ${segN('PE')} ⊥ AB.`, `So: ${segN('PE')}.`],
    picture: { fig: f, reveal: {} },
  }, [
    { t: segN('PE'), ok: true, say: 'Right: the perpendicular segment.' },
    { t: segN('PQ'), mc: MC.slanted, say: 'PQ is slanted; the shortest way to the side is the perpendicular PE.' },
    { t: segN('AP'), mc: MC.slanted, say: 'AP runs to the vertex, not to the side.' },
    { t: segN('PF'), say: 'PF is the distance to ray AC, the other side.' },
  ]);
});

// ---------- s1-incenter: the inscribed circle's radius ----------
/** an incircle figure: vertex A at the origin, the bisector along +x, angle A = 2·asin(r/IA), BC tangent to the
 *  circle at angle phi (beyond I), I the incenter; E the touch point on AB */
export function incircleSetup(rr: number, IA: number, phi: number, k = 22) {
  const half = Math.asin(rr / IA), I: Pt = [IA * k, 0], R0 = rr * k;
  const T0: Pt = [I[0] + R0 * Math.cos(phi), I[1] + R0 * Math.sin(phi)], tdir: Pt = [-Math.sin(phi), Math.cos(phi)];
  const hit = (s: number): Pt | null => {
    const d: Pt = [Math.cos(s * half), Math.sin(s * half)];
    const den = d[0] * tdir[1] - d[1] * tdir[0];
    if (Math.abs(den) < 1e-9) return null;
    const lam = (T0[0] * tdir[1] - T0[1] * tdir[0]) / den;
    return lam > 0 ? [d[0] * lam, d[1] * lam] : null;
  };
  const B = hit(1), C = hit(-1);
  if (!B || !C) return null;
  const A: Pt = [0, 0], E = footOf(I, A, B);
  return { A, B, C, I, E, F: footOf(I, A, C), Tg: T0, R0, half: (half * 180) / Math.PI };
}
export const inRadius: Gen = (R, n) => fitted('inRadius', () => {
  const rr = r(R, 3, 8), IA = Math.round(rr * (2.4 + R() * 1.2));
  const S = incircleSetup(rr, IA, ((r(R, -55, 55)) * Math.PI) / 180, 300 / IA);
  if (!S || S.half < 15 || S.half > 40) throw new Error('shape');
  const T: Tri = [S.A, S.B, S.C];
  if (Math.abs(incenterOf(T)[0] - S.I[0]) > 1e-6 || Math.abs(inradiusOf(T) - S.R0) > 1e-6) throw new Error('not the incircle');
  const f = fig({
    pts: { A: S.A, B: S.B, C: S.C, I: S.I, E: S.E }, segs: ['AB', 'BC', 'CA', 'IE', 'IA'], marks: [box('AEI')],
    extra: circleSegs('ic', S.I, S.R0, { col: 'second' }), body: 'ABC',
  });
  const t = relabel(R, 'ABCEI');
  return numT(t, {
    id: `inRadius-${n}`, family: 'inRadius', prompt: `I is the incenter of ${tri('ABC')} and the circle is its inscribed circle. ${segN('IE')} ⊥ ${segN('AB')}, IE = ${rr} cm and IA = ${IA} cm. How long is the radius of the inscribed circle?`, board: `IE = ${rr},\\ IA = ${IA},\\ r = \\,?`, unit: 'cm',
    solution: ['The inscribed circle touches each side; the radius to a touching point is perpendicular to the side.', 'IE is perpendicular to AB, so IE is a radius; IA runs to a vertex, outside the circle.', `So r = IE = <b class="s">${rr}</b> cm.`],
    picture: { fig: f, reveal: { glow: ['IE'] } },
  }, rr, [{ v: IA, mc: MC.radiusWrong, say: 'IA reaches a vertex, which is outside the inscribed circle. The radius is the perpendicular IE.' }], 'Right: the radius is the perpendicular distance to a side.', 'The radius of the inscribed circle is the perpendicular distance from I to a side.');
});

// ---------- s1-centers-discriminate ----------
const CK_LIST: CK[] = ['centroid', 'circumcenter', 'incenter', 'orthocenter'];
function ckMc(truth: CK, said: CK): string | undefined {
  const pair = [truth, said].sort().join('|');
  if (pair === 'circumcenter|incenter') return MC.swap;
  if (pair === 'centroid|orthocenter') return truth === 'orthocenter' ? MC.allCentroid : MC.medAlt;
  if (pair === 'circumcenter|orthocenter') return MC.altPerp;
  if (pair === 'centroid|incenter') return MC.bisMid;
  if (pair === 'centroid|circumcenter') return truth === 'circumcenter' ? MC.allCentroid : MC.central;
  return undefined;
}
const CK_DESC: [string, CK][] = [
  ['the point where the three medians meet', 'centroid'],
  ['the point where the perpendicular bisectors of the sides meet', 'circumcenter'],
  ['the point where the three angle bisectors meet', 'incenter'],
  ['the point where the lines containing the altitudes meet', 'orthocenter'],
  ['the point the same distance from all three vertices', 'circumcenter'],
  ['the point the same distance from all three sides', 'incenter'],
  ['the balance point of a cardboard triangle', 'centroid'],
  ['the center that sits at the right-angle vertex of a right triangle', 'orthocenter'],
  ['the center that is the midpoint of the hypotenuse of a right triangle', 'circumcenter'],
  ['the center of the circle through all three vertices', 'circumcenter'],
  ['the center of the circle that touches all three sides', 'incenter'],
  ['the point where the segments from each vertex to the midpoint of the opposite side meet', 'centroid'],
  ['the point where the perpendiculars from each vertex to the opposite side line meet', 'orthocenter'],
  ['a center that can lie outside an obtuse triangle and is equidistant from the vertices', 'circumcenter'],
  ['a center that can lie outside an obtuse triangle and has no equal-distance property', 'orthocenter'],
  ['a center that is always inside and is equidistant from the sides', 'incenter'],
];
export const centerMatch: Gen = (R, n) => {
  const [d, k] = pick(R, CK_DESC);
  return choice4(R, n, 'centerMatch', `Which center is ${d}?`, `\\text{which center?}`, k, [`That is ${CK_WORD[k]}.`], undefined);
};
function choice4(R: () => number, n: number, fam: string, prompt: string, board: string, k: CK, sol: string[], picture: Parameters<typeof choiceT>[2]['picture']) {
  const t = (s: string) => s;
  return choiceT(R, t, { id: `${fam}-${n}`, family: fam, prompt, board, solution: [...sol, `So: ${CK_WORD[k]}.`], picture }, CK_LIST.map(c => ({ t: CK_WORD[c], ok: c === k, mc: c === k ? undefined : ckMc(k, c), say: c === k ? 'Right.' : `${CK_WORD[c][0]!.toUpperCase()}${CK_WORD[c].slice(1)} is where the ${CK_LINES2[c]} meet; here ${CK_WHAT[k]}.` })));
}
const CK_LINES2: Record<CK, string> = { centroid: 'medians', circumcenter: 'perpendicular bisectors', incenter: 'angle bisectors', orthocenter: 'altitudes' };
const CK_WHAT: Record<CK, string> = { centroid: 'it is the medians\' point', circumcenter: 'it is the perpendicular bisectors\' point', incenter: 'it is the angle bisectors\' point', orthocenter: 'it is the altitudes\' point' };
export const centerFig: Gen = (R, n, sg) => fitted('centerFig', () => {
  const k: CK = sg === 's1-orthocenter' && R() < 0.75 ? 'orthocenter' : pick(R, CK_LIST);
  const T = centerTri(R, k, pick(R, ['acute', 'acute', 'obtuse'] as Kind[]));
  if (kindOf(T) === 'obtuse' && (k === 'circumcenter' || k === 'orthocenter') && dist(centerOf(T, k), centroid3(T)) > 3.2 * Math.max(dist(T[0], T[1]), dist(T[1], T[2]), dist(T[0], T[2]))) throw new Error('far');
  const f = linesFig(T, k);
  const t = relabel(R, 'ABCP');
  const marks = { centroid: 'Each line ends at a marked midpoint of the opposite side: medians.', circumcenter: 'Each line is perpendicular to a side at its marked midpoint: perpendicular bisectors.', incenter: 'Each line splits a vertex angle into two equal angles: angle bisectors.', orthocenter: 'Each line runs from a vertex perpendicular to the opposite side line: altitudes.' }[k];
  const it = choice4(R, n, 'centerFig', 'Read the marks. The three marked lines meet at P. Which center is P?', '\\text{which center is } P?', k, [marks], { fig: f, reveal: {} });
  return { ...it, prompt: tw0(it.prompt, t), board: tw0(it.board, t), picture: it.picture?.fig ? { ...it.picture, fig: mapFig0(it.picture.fig, t) } : it.picture };
});
const centroid3 = (T: Tri): Pt => [(T[0][0] + T[1][0] + T[2][0]) / 3, (T[0][1] + T[1][1] + T[2][1]) / 3];
void circumcenterOf;
