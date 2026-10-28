// famA.ts: stage 1 of "Arcs and angles in circles": why all circles are similar, the parts of a circle (chords,
// diameters, radii, secants, tangents), central / inscribed / circumscribed angles, arc names and arc measures, the
// intercepted arc, and halving / doubling degree measures. Every figure is exact (cfig.ts): arcs and angles at their
// true measures, a diameter through the centre, a tangent perpendicular to its radius.
import { type Pt, add, dirv, dist, mul, norm, sub, unit } from '../geometry-foundations/geo';
import { type ArcSpec, type CSpec, type SegSpec, R0, cfig } from './cfig';
import { arcKey, cross, inArc, placeCcw, splitArcs } from './cconf';
import { type Gen, type NumWrong, type Opt, MC, S, ans, arcN, choose, dg, fitted, fmt, mArc, numQ, pick, r, relabel, segN, shuffle } from './ckit';

const ROLES = 'ABCDEFMPQTO';
const t0 = (R: () => number) => relabel(R, ROLES, 'O');

// ---------- circle similarity ----------
const RATIOS: [number, number][] = [[2, 5], [4, 10], [5, 8], [4, 6], [2, 7], [5, 12], [8, 10], [3, 6], [6, 9], [10, 4], [8, 2], [5, 2], [4, 9], [6, 3], [10, 15], [2, 3], [5, 4], [8, 6], [4, 4], [6, 6]];
function twoCircles(R: () => number, rr: number, ss: number, unitW: string): CSpec {
  const big = Math.max(rr, ss), RA = (R0 * rr) / big, RB = (R0 * ss) / big;
  const gap = RA + RB + 170, d1 = r(R, 30, 150), d2 = r(R, 30, 150);
  return {
    R: RA, center: 'A', pts: { B: [gap, 0] }, more: [{ O: [gap, 0], R: RB }], on: { E: d1 }, onMore: { F: [1, d2] }, bare: ['E', 'F'],
    segs: [{ id: 'AE', text: `${rr} ${unitW}`, col: 'first' }, { id: 'BF', text: `${ss} ${unitW}`, col: 'second' }], pad: 90,
  };
}
export const simScale: Gen = (R, n) => fitted('simScale', () => {
  const [rr, ss] = pick(R, RATIOS), u = pick(R, ['cm', 'in.', 'ft']);
  const k = ss / rr;
  if (Math.abs(k * 100 - Math.round(k * 100)) > 1e-9) throw new Error('ratio');
  const fig = cfig(twoCircles(R, rr, ss, u));
  const wrong: NumWrong[] = [
    { v: Math.round((rr / ss) * 1000) / 1000, mc: MC.scaleRev, say: `That is ${rr} ÷ ${ss}: it maps circle B onto circle A. The dilation goes from radius ${rr} to radius ${ss}.` },
    { v: ss - rr, say: 'A dilation multiplies every distance from B; it does not add to it. Divide the new radius by the old one.' },
  ];
  return numQ(null, {
    id: `simScale-${n}`, family: 'simScale',
    prompt: `Circle A has radius ${rr} ${u}; circle B has radius ${ss} ${u}. A translation moves A onto B. Then a dilation centered at B maps the moved circle onto circle B. What is the scale factor of the dilation?`,
    board: `k = \\frac{${ss}}{${rr}}`,
    solution: [`The translation keeps the radius: ${rr} ${u}.`, `The dilation must stretch radius ${rr} to radius ${ss}: k = ${ss} ÷ ${rr}.`, `k = ${S(fmt(k))}${k === 1 ? ' (equal radii: the translation alone already gives a congruent circle)' : ''}.`],
    picture: { cfig: fig },
  }, k, wrong, `Right: every point ${rr} ${u} from B lands ${ss} ${u} from B.`, 'Scale factor = image radius ÷ original radius.');
});
export const simProof: Gen = (R, n) => fitted('simProof', () => {
  const term = (x: number) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-9;
  // every factor the item writes terminates (5/4 = 1.25, 4/5 = 0.8; never 4/3 = 1.33)
  const [rr, ss] = pick(R, RATIOS.filter(([a, b]) => a !== b && term(a / b) && term(b / a))), u = 'cm';
  const kind = pick(R, ['onto', 'onto', 'equal', 'concentric', 'arcs'] as const);
  const big = Math.max(rr, ss), d1 = r(R, 20, 70), d2 = d1 + r(R, 110, 160);
  const fig = kind === 'equal' ? cfig(twoCircles(R, rr, rr, u))
    : kind === 'concentric' ? cfig({ R: (R0 * rr) / big, center: 'A', more: [{ O: [0, 0], R: (R0 * ss) / big }], on: { E: d1 }, onMore: { F: [1, d2] }, bare: ['E', 'F'], segs: [{ id: 'AE', text: `${rr} ${u}`, col: 'first' }, { id: 'AF', text: `${ss} ${u}`, col: 'second' }], pad: 90 })
      : cfig(twoCircles(R, rr, ss, u));
  let prompt: string, opts: Opt[], sol: string[];
  if (kind === 'onto') {
    prompt = `A proof that circle A (radius ${rr} ${u}) and circle B (radius ${ss} ${u}) are similar: translate A onto B, then dilate about B by ${ss}/${rr}. Every point of the moved circle lands ${ss} ${u} from B, so it lands on circle B. What else must the proof show?`;
    opts = [
      { t: `that every point of circle B is reached: its preimage lies ${rr} ${u} from B`, ok: true, say: 'Right: images on circle B is half the job; the image must be ALL of circle B.' },
      { t: 'nothing: the images lie on circle B, so the proof is done', mc: MC.simIncomplete, say: 'Landing on circle B shows the image is inside circle B; it must also fill all of it.' },
      { t: `that the dilation uses ${rr}/${ss}`, mc: MC.scaleRev, say: `${rr}/${ss} would shrink radius ${rr} further; the factor that reaches ${ss} is ${ss}/${rr}.` },
      { t: 'nothing can: circles have no sides or angles, so similarity does not apply', mc: MC.curvedNot, say: 'Similar means one figure maps onto the other by a similarity transformation; that works for curves too.' },
    ];
    sol = ['The image must be exactly circle B: every image point is on circle B, AND every point of circle B is an image.', `Any point of circle B is ${ss} ${u} from B; the dilation by ${ss}/${rr} sends the point ${rr} ${u} from B in that direction onto it.`];
  } else if (kind === 'equal') {
    prompt = `Two circles have the same radius, ${rr} ${u}, and different centers A and B. What maps one onto the other?`;
    opts = [
      { t: 'the translation from A to B alone: the circles are congruent (scale factor 1)', ok: true, say: 'Right: a translation keeps every distance, so radius stays radius.' },
      { t: `a translation and then a dilation by ${rr}`, mc: MC.scaleRev, say: `A factor of ${rr} would make the radius ${rr * rr} ${u}.` },
      { t: 'nothing: only polygons can be congruent', mc: MC.curvedNot, say: 'Any figure can be congruent: a rigid motion maps one onto the other.' },
    ];
    sol = ['A translation keeps every distance.', `Every point ${rr} ${u} from A lands ${rr} ${u} from B: the translation alone does it.`];
  } else if (kind === 'concentric') {
    prompt = `Two circles have the SAME center A, with radii ${rr} ${u} and ${ss} ${u}. Which single transformation maps the smaller onto the larger?`;
    const [lo, hi] = rr < ss ? [rr, ss] : [ss, rr];
    opts = [
      { t: `a dilation centered at A by ${fmt(hi / lo)}`, ok: true, say: 'Right: no translation is needed when the centers already match.' },
      { t: `a translation, then a dilation by ${fmt(lo / hi)}`, mc: MC.scaleRev, say: `There is nothing to translate, and ${fmt(lo / hi)} shrinks.` },
      { t: `a dilation centered at A by ${hi - lo}`, say: 'A dilation multiplies distances from A; the factor is a ratio of radii.' },
    ];
    sol = ['The centers already coincide: no translation.', `Dilate about A by ${hi} ÷ ${lo} = ${fmt(hi / lo)}.`];
  } else {
    prompt = `Circle A has radius ${rr} ${u}; circle B has radius ${ss} ${u}. Each has an arc with a 60° central angle. Which is true?`;
    opts = [
      { t: 'both arcs measure 60°, but their lengths differ', ok: true, say: 'Right: a dilation keeps angles (degree measure) and scales lengths.' },
      { t: 'both arcs have the same length, because they both measure 60°', mc: MC.measLen, say: 'Degree measure and length are different: the length scales with the radius.' },
      { t: `the arc on circle B measures ${fmt((60 * ss) / rr)}°`, mc: MC.measLen, say: 'The dilation keeps the central angle, so the arc still measures 60°.' },
    ];
    sol = ['Arc measure is the central angle: a dilation keeps angles.', `Arc length scales by ${ss}/${rr}: the lengths differ.`];
  }
  return choose(R, null, { id: `simProof-${n}`, family: 'simProof', prompt, board: kind === 'concentric' ? '\\text{two circles centered at } A' : '\\text{circle } A \\sim \\text{circle } B', solution: sol, picture: { cfig: fig } }, opts);
});

// ---------- chords, diameters, radii ----------
const SEG_OPTS = ['a chord that is not a diameter', 'a diameter (a chord through the center)', 'a radius', 'none of these: an endpoint is neither on the circle nor the center'];
export const segKind: Gen = (R, n) => fitted('segKind', () => {
  const kind = pick(R, ['chord', 'diam', 'radius', 'inside'] as const);
  const x = r(R, 55, 125), y = r(R, 55, 125);
  const arcs = kind === 'diam' || R() < 0.4 ? [x, 180 - x, y, 180 - y] : splitArcs(R, 4, 50, 130);
  const [a, b, c, d] = placeCcw(r(R, 0, 359), arcs);
  const eAng = d! + arcs[3]! / 2, E: Pt = mul(dirv(eAng), R0 * (0.42 + 0.15 * R()));
  const hl = kind === 'chord' ? 'AB' : kind === 'diam' ? (arcs[0]! + arcs[1]! === 180 ? 'AC' : 'BD') : kind === 'radius' ? 'OB' : pick(R, ['EB', 'EC']);
  if (kind === 'diam' && arcs[0]! + arcs[1]! !== 180) throw new Error('no diameter');
  const pool = ['CD', 'OD', 'ED', 'AC'].filter(s => s !== hl);
  const extra = shuffle(R, pool).slice(0, 2);
  const segs: SegSpec[] = [{ id: hl, col: 'pick' }, ...extra.map(id => ({ id, col: 'ink' as const }))];
  const fig = cfig({ center: 'O', on: { A: a!, B: b!, C: c!, D: d! }, pts: { E }, segs });
  const right = { chord: 0, diam: 1, radius: 2, inside: 3 }[kind];
  const mcs: Record<string, (string | undefined)[]> = {
    chord: [undefined, MC.everyDiam, MC.insideRadius, undefined],
    diam: [MC.trusts, undefined, MC.insideRadius, MC.diamNotChord],
    radius: [MC.segLook, MC.everyDiam, undefined, undefined],
    inside: [MC.segLook, MC.segLook, MC.insideRadius, undefined],
  };
  const why = [
    'A chord has both endpoints on the circle.', 'A diameter is a chord that passes through the center.',
    'A radius joins the center to a point of the circle.', 'Look at the endpoints: one must be on the circle or the center.',
  ];
  const opts: Opt[] = SEG_OPTS.map((t, i) => ({ t, ok: i === right, mc: mcs[kind]![i], say: i === right ? `Right: ${why[i]}` : why[right]! }));
  return choose(R, t0(R), {
    id: `segKind-${n}`, family: 'segKind',
    prompt: `O is the center of the circle. Points A, B, C and D lie on the circle; E is inside it (not the center). What is the highlighted segment ${segN(hl)}?`,
    board: `\\overline{${hl}}`,
    solution: [`Its endpoints: ${hl[0] === 'O' ? 'O is the center' : hl[0] === 'E' ? 'E is inside, not on the circle and not the center' : `${hl[0]} is on the circle`}; ${hl[1]} is on the circle.`, kind === 'diam' ? 'Both on the circle, and it passes through O: a diameter, which is a chord too.' : why[right]!],
    picture: { cfig: fig, reveal: { glow: [hl] } },
  }, opts, true);
});
export const chordCount: Gen = (R, n) => fitted('chordCount', () => {
  const withDiam = R() < 0.75;
  const x = r(R, 50, 120), y = r(R, 45, 90), z = r(R, 45, 90);
  const arcs = withDiam ? [x, 180 - x, y, z, 180 - y - z] : splitArcs(R, 5, 45, 110);
  if (arcs.some(a => a < 40)) throw new Error('arcs');
  const names = 'ABCDF';
  const ang = placeCcw(r(R, 0, 359), arcs);
  const on: Record<string, number> = {};
  [...names].forEach((nm, i) => { on[nm] = ang[i]!; });
  const diam = withDiam ? ['AC'] : [];
  const E: Pt = mul(dirv(ang[2]! + arcs[2]! / 2), R0 * 0.5);
  const chordPool = shuffle(R, ['AB', 'BC', 'CD', 'DF', 'BD', 'AD', 'BF'].filter(s => [...s].every(ch => on[ch] !== undefined)));
  const nChords = r(R, 1, 3), chords = chordPool.slice(0, nChords);
  const radPool = shuffle(R, ['OB', 'OD', 'OF'].filter(s => on[s[1]!] !== undefined)), nRad = r(R, 1, 2), radii = radPool.slice(0, nRad);
  const inside = R() < 0.6 ? [pick(R, ['EB', 'ED'])] : [];
  const segs = [...diam, ...chords, ...radii, ...inside];
  const fig = cfig({ center: 'O', on, pts: inside.length ? { E } : {}, segs: segs.map(id => ({ id, col: 'ink' as const })) });
  const a = diam.length + chords.length;
  const wrong: NumWrong[] = [
    { v: chords.length, mc: MC.diamNotChord, say: 'A diameter has both endpoints on the circle: it is a chord too.' },
    { v: segs.length, mc: MC.segLook, say: 'Not every segment inside a circle is a chord: both endpoints must be ON the circle.' },
    { v: a + radii.length, mc: MC.insideRadius, say: 'A radius has one endpoint at the center, not on the circle: it is not a chord.' },
  ];
  return numQ(t0(R), {
    id: `chordCount-${n}`, family: 'chordCount',
    prompt: `O is the center. Points ${[...names].join(', ')} lie on the circle${inside.length ? '; E is inside it' : ''}. How many of the drawn segments are chords?`,
    board: '\\text{chords} = \\,?',
    solution: [`Chords have both endpoints on the circle: ${[...diam, ...chords].map(segN).join(', ')}${diam.length ? ` (${segN(diam[0]!)} is a diameter, still a chord)` : ''}.`, `Not chords: ${[...radii, ...inside].map(segN).join(', ')}.`, `So ${S(a)} ${a === 1 ? 'chord' : 'chords'}.`],
    picture: { cfig: fig, reveal: { glow: [...diam, ...chords] } },
  }, a, wrong, 'Right: both endpoints on the circle, diameters included.', 'Count the segments whose two endpoints both lie on the circle.');
});

// ---------- secants and tangents ----------
const LINE_OPTS = ['a secant: it meets the circle at two points', 'a tangent: it meets the circle at exactly one point', 'neither: it does not meet the circle', 'a chord: a segment with both endpoints on the circle'];
export const lineKind: Gen = (R, n) => fitted('lineKind', () => {
  const kind = pick(R, ['secant', 'tangent', 'close', 'miss', 'chord'] as const);
  const th = r(R, 0, 359);
  const on: Record<string, number> = {}, pts: Record<string, Pt> = {};
  const segs: SegSpec[] = [];
  const tangents: CSpec['tangents'] = [];
  let note = '';
  if (kind === 'secant' || kind === 'close' || kind === 'chord') {
    const w = kind === 'close' ? r(R, 26, 34) : r(R, 70, 140);
    on.P = th; on.Q = th + w;
    segs.push(kind === 'chord' ? { id: 'PQ', col: 'pick' } : { id: 'PQ', col: 'pick', ext: [R0 * 0.55, R0 * 0.55], name: 'ℓ' });
    if (kind === 'close') note = ' It crosses the circle at two points, P and Q, close together.';
  } else if (kind === 'tangent') {
    on.T = th;
    tangents.push({ at: 'T', col: 'pick', id: 'ℓT', name: 'ℓ', len: [R0 * 0.85, R0 * 0.85] });
  } else {
    const u = dirv(th), d = R0 * (1.14 + 0.12 * R()), base = mul(u, d), v: Pt = [-u[1], u[0]];
    pts.M = add(base, mul(v, -R0 * 0.8)); pts.N = add(base, mul(v, R0 * 0.8));
    segs.push({ id: 'MN', col: 'pick', ext: [10, 10], name: 'ℓ' });
  }
  // context: another chord, plain
  const c1 = th + r(R, 150, 200), c2 = c1 + r(R, 60, 100);
  on.A = c1; on.B = c2; segs.push({ id: 'AB', col: 'ink' });
  const fig = cfig({ center: 'O', on, pts, segs, tangents, bare: kind === 'miss' ? ['M', 'N'] : [] });
  const right = { secant: 0, close: 0, tangent: 1, miss: 2, chord: 3 }[kind];
  const mcs: Record<string, (string | undefined)[]> = {
    secant: [undefined, MC.trusts, MC.trusts, MC.segLook], close: [undefined, MC.trusts, MC.trusts, MC.segLook],
    tangent: [MC.trusts, undefined, MC.tanRatio, MC.segLook], miss: [MC.trusts, MC.trusts, undefined, undefined], chord: [MC.segLook, undefined, undefined, undefined],
  };
  const why = ['A secant is a line that meets the circle at two points.', 'A tangent is a line that meets the circle at exactly one point, the point of tangency.', 'This line stays outside the circle: no common point.', 'It is a segment (no arrowheads) with both endpoints on the circle: a chord.'];
  const opts: Opt[] = LINE_OPTS.map((t, i) => ({ t, ok: i === right, mc: mcs[kind]![i], say: i === right ? `Right: ${why[i]}` : why[right]! }));
  return choose(R, t0(R), {
    id: `lineKind-${n}`, family: 'lineKind',
    prompt: `O is the center. Which description fits the highlighted ${kind === 'chord' ? 'figure' : 'line ℓ'}?${note}`,
    board: kind === 'chord' ? '\\overline{PQ}' : '\\ell',
    solution: [kind === 'tangent' ? 'It touches the circle at T only.' : kind === 'miss' ? 'It never reaches the circle.' : kind === 'chord' ? 'It stops at P and at Q, both on the circle.' : 'It crosses the circle at P and at Q.', why[right]!],
    picture: { cfig: fig },
  }, opts, true);
});
/** a tangent at T and a secant P-A-B (A between P and B): angles of T, A, B and the point P */
export function tanSecConf(R: () => number, o: { near?: [number, number]; mid?: [number, number]; maxFar?: number } = {}): { T: number; A: number; B: number; P: Pt; near: number; far: number; mid: number } {
  for (let t = 0; t < 400; t++) {
    const near = r(R, ...(o.near ?? [40, 110])), mid = r(R, ...(o.mid ?? [50, 130])), far = 360 - near - mid;
    if (far - near < 40 || far > (o.maxFar ?? 270)) continue;
    const [T, A, B] = placeCcw(r(R, 0, 359), [near, mid, far]);
    const Tp = dirv(T!), tdir: Pt = [-Tp[1], Tp[0]];
    const P = cross(mul(dirv(A!), R0), mul(dirv(B!), R0), mul(Tp, R0), add(mul(Tp, R0), tdir));
    const dP = dist(P, [0, 0]);
    if (dP < R0 * 1.25 || dP > R0 * 2.5) continue;
    if (dist(P, mul(dirv(A!), R0)) > dist(P, mul(dirv(B!), R0))) continue;
    return { T: T!, A: A!, B: B!, P, near, far, mid };
  }
  throw new Error('tanSecConf');
}
export const tangentPoint: Gen = (R, n) => fitted('tangentPoint', () => {
  const c = tanSecConf(R);
  const ask = pick(R, ['point', 'count', 'which'] as const);
  const fig = cfig({ center: 'O', on: { T: c.T, A: c.A, B: c.B }, pts: { P: c.P }, segs: [{ id: 'PT', kind: 'line', ext: [R0 * 0.25, R0 * 0.6], col: 'ink' }, { id: 'PB', kind: 'line', ext: [R0 * 0.25, R0 * 0.4], col: 'ink' }] });
  let prompt: string, opts: Opt[], sol: string[], board: string;
  if (ask === 'point') {
    board = '\\text{point of tangency?}';
    prompt = 'O is the center. Line PT meets the circle only at T; line PB crosses it at A and B. Line PT is tangent to the circle. What is its point of tangency?';
    opts = [{ t: 'T', ok: true, say: 'Right: the one point the tangent shares with the circle.' }, { t: 'P', mc: MC.rightAtP, say: 'P is outside the circle; the tangent touches the circle at T.' }, { t: 'A', say: 'A is on the secant PB.' }, { t: 'O', say: 'O is the center; the point of tangency is on the circle.' }];
    sol = ['The point of tangency is the one point a tangent shares with the circle.', 'Line PT shares only T.'];
  } else if (ask === 'count') {
    board = '\\overleftrightarrow{PB}';
    prompt = 'O is the center. How many points does line PB share with the circle?';
    opts = [{ t: '2', ok: true, v: 2, say: 'Right: A and B, so line PB is a secant.' }, { t: '1', v: 1, mc: MC.trusts, say: 'It crosses at A AND at B.' }, { t: '0', v: 0, say: 'It crosses the circle at A and B.' }, { t: '3', v: 3, say: 'A line meets a circle at most twice.' }];
    sol = ['Line PB crosses the circle at A and at B.', 'Two points: a secant.'];
  } else {
    board = '\\text{tangent line?}';
    prompt = 'O is the center. Which line is tangent to the circle?';
    opts = [{ t: 'line PT', ok: true, say: 'Right: it meets the circle only at T.' }, { t: 'line PA', mc: MC.trusts, say: 'Line PA goes on through the circle: it meets it at A and at B, a secant.' }, { t: 'line AB', mc: MC.segLook, say: 'Line AB is the secant through A and B.' }, { t: 'line OT', mc: MC.perpAny, say: 'Line OT goes through the center and crosses the circle twice.' }];
    sol = ['A tangent meets the circle at exactly one point.', 'Line PT meets it only at T; line PA (the same line as PB and AB) meets it twice.'];
  }
  return choose(R, t0(R), { id: `tangentPoint-${n}`, family: 'tangentPoint', prompt, board, solution: sol, picture: { cfig: fig } }, opts);
});

// ---------- central, inscribed, circumscribed angles ----------
const KIND_OPTS = ['a central angle', 'an inscribed angle', 'a circumscribed angle', 'none of these'];
type AK = 'central' | 'straight' | 'nearCenter' | 'inscribed' | 'insideV' | 'outsideSec' | 'tanChord' | 'circum' | 'twoSec' | 'secTan';
const KINDS_BY: Record<string, AK[]> = {
  'central-angle': ['central', 'central', 'straight', 'nearCenter', 'nearCenter', 'inscribed'],
  'inscribed-angle-classify': ['inscribed', 'inscribed', 'insideV', 'outsideSec', 'tanChord', 'central'],
  'circumscribed-angle-classify': ['circum', 'circum', 'twoSec', 'secTan', 'inscribed'],
};
function kindFig(R: () => number, k: AK): { spec: CSpec; facts: string; right: number; ang: string; why: string } {
  const th = r(R, 0, 359);
  if (k === 'central' || k === 'straight') {
    const c = k === 'straight' ? 180 : pick(R, [r(R, 40, 85), 90, r(R, 95, 160)]);
    return { spec: { center: 'O', on: { A: th, B: th + c }, segs: ['OA', 'OB'], angles: [{ id: 'AOB', col: 'pick', r: 60 }] }, facts: 'A and B lie on the circle.', right: 0, ang: 'AOB', why: 'Its vertex is the center O and its sides are radii: a central angle.' };
  }
  if (k === 'nearCenter') {
    const E: Pt = mul(dirv(th + 180 + r(R, -40, 40)), R0 * (0.2 + 0.12 * R()));
    const c = r(R, 70, 140);
    return { spec: { center: 'O', on: { A: th, B: th + c }, pts: { E }, segs: ['EA', 'EB'], angles: [{ id: 'AEB', col: 'pick', r: 56 }] }, facts: 'A and B lie on the circle; E is inside it, near the center but not at it.', right: 3, ang: 'AEB', why: 'Its vertex E is not the center, and not on the circle: none of these.' };
  }
  if (k === 'inscribed') {
    const a = r(R, 50, 150), cpos = th + a + r(R, 30, 360 - a - 30);
    return { spec: { center: 'O', on: { A: th, B: th + a, C: cpos }, segs: ['CA', 'CB'], angles: [{ id: 'ACB', col: 'pick', r: 62 }] }, facts: 'A, B and C lie on the circle.', right: 1, ang: 'ACB', why: 'Its vertex C is on the circle and both sides are chords: an inscribed angle.' };
  }
  if (k === 'insideV') {
    const a = r(R, 70, 130), E: Pt = mul(dirv(th + a + (360 - a) / 2), R0 * (0.35 + 0.2 * R()));
    return { spec: { center: 'O', on: { A: th, B: th + a }, pts: { E }, segs: ['EA', 'EB'], angles: [{ id: 'AEB', col: 'pick', r: 56 }] }, facts: 'A and B lie on the circle; E is inside it, not at the center.', right: 3, ang: 'AEB', why: 'The vertex E is inside the circle, not on it: not inscribed (and not central).' };
  }
  if (k === 'outsideSec' || k === 'twoSec') {
    // secants P-A-D and P-B-C
    for (let t = 0; t < 200; t++) {
      const near = r(R, 30, 70), s1 = r(R, 50, 100), farA = r(R, 120, 170), s2 = 360 - near - s1 - farA;
      if (s2 < 40) continue;
      const [A, B, C, D] = placeCcw(th, [near, s1, farA, s2]);
      const P = cross(mul(dirv(A!), R0), mul(dirv(D!), R0), mul(dirv(B!), R0), mul(dirv(C!), R0));
      const dP = dist(P, [0, 0]);
      if (dP < R0 * 1.3 || dP > R0 * 2.4) continue;
      return { spec: { center: 'O', on: { A: A!, B: B!, C: C!, D: D! }, pts: { P }, segs: ['PD', 'PC'], angles: [{ id: 'DPC', col: 'pick', r: 64 }] }, facts: 'A, B, C and D lie on the circle; line PD crosses it at A and D, line PC at B and C.', right: 3, ang: 'DPC', why: 'Its vertex is outside, but its sides are secants, not tangents: none of these.' };
    }
    throw new Error('two secants');
  }
  if (k === 'tanChord') {
    const a = r(R, 60, 140);
    return { spec: { center: 'O', on: { T: th, A: th + a }, pts: { Q: add(mul(dirv(th), R0), mul(dirv(th + 90), R0 * 0.8)) }, segs: ['TA', { id: 'TQ', kind: 'line', ext: [R0 * 0.8, R0 * 0.1], col: 'ink' }], angles: [{ id: 'ATQ', col: 'pick', r: 62 }] }, facts: 'A and T lie on the circle; line TQ is tangent to the circle at T.', right: 3, ang: 'ATQ', why: 'One side is a tangent, not a chord: not inscribed. (It is a tangent-chord angle.)' };
  }
  if (k === 'circum') {
    const m = r(R, 70, 150), A = th, B = th + m;
    const P = cross(mul(dirv(A), R0), add(mul(dirv(A), R0), dirv(A + 90)), mul(dirv(B), R0), add(mul(dirv(B), R0), dirv(B + 90)));
    return { spec: { center: 'O', on: { A, B }, pts: { P }, segs: [{ id: 'PA', ext: [0, R0 * 0.25], kind: 'line', col: 'ink' }, { id: 'PB', ext: [0, R0 * 0.25], kind: 'line', col: 'ink' }], angles: [{ id: 'APB', col: 'pick', r: 64 }] }, facts: 'Lines PA and PB are tangent to the circle at A and B.', right: 2, ang: 'APB', why: 'Two tangents from one outside point P: a circumscribed angle.' };
  }
  // secTan
  const c = tanSecConf(R);
  return { spec: { center: 'O', on: { T: c.T, A: c.A, B: c.B }, pts: { P: c.P }, segs: [{ id: 'PT', kind: 'line', ext: [0, R0 * 0.3], col: 'ink' }, { id: 'PB', kind: 'line', ext: [0, R0 * 0.3], col: 'ink' }], angles: [{ id: 'TPB', col: 'pick', r: 64 }] }, facts: 'Line PT is tangent to the circle at T; line PB crosses it at A and B.', right: 3, ang: 'TPB', why: 'One side is a secant: a circumscribed angle needs two tangents. None of these.' };
}
export const angleKind: Gen = (R, n, sg) => fitted('angleKind', () => {
  const k = pick(R, KINDS_BY[sg ?? 'central-angle'] ?? KINDS_BY['central-angle']!);
  const f = kindFig(R, k);
  const fig = cfig(f.spec);
  const mcFor = (i: number): string | undefined => {
    if (k === 'nearCenter' && i === 0) return MC.insideCentral;
    if (k === 'insideV' && i === 1) return MC.insideInscribed;
    if (k === 'insideV' && i === 0) return MC.insideCentral;
    if ((k === 'twoSec' || k === 'secTan' || k === 'outsideSec') && i === 2) return MC.anyExterior;
    if (k === 'tanChord' && i === 1) return MC.insideInscribed;
    if (k === 'central' && i === 1) return MC.insideInscribed;
    if (k === 'inscribed' && i === 0) return MC.insideCentral;
    return undefined;
  };
  const opts: Opt[] = KIND_OPTS.map((t, i) => ({ t, ok: i === f.right, mc: mcFor(i), say: i === f.right ? `Right: ${f.why}` : f.why }));
  return choose(R, t0(R), {
    id: `angleKind-${n}`, family: 'angleKind',
    prompt: `O is the center. ${f.facts} What kind of angle is the marked ∠${f.ang}?`,
    board: `\\angle ${f.ang}`,
    solution: ['Look at the vertex (center, on the circle, inside, outside) and at the sides (radii, chords, tangents, secants).', f.why],
    picture: { cfig: fig },
  }, opts, true);
});
export const whichAngle: Gen = (R, n, sg) => fitted('whichAngle', () => {
  const m = r(R, 80, 140), th = r(R, 0, 359), A = th, B = th + m, C = B + r(R, 60, 360 - m - 60);
  const P = cross(mul(dirv(A), R0), add(mul(dirv(A), R0), dirv(A + 90)), mul(dirv(B), R0), add(mul(dirv(B), R0), dirv(B + 90)));
  if (dist(P, [0, 0]) > R0 * 2.4) throw new Error('far');
  const fig = cfig({ center: 'O', on: { A, B, C }, pts: { P }, segs: ['OA', 'OB', 'CA', 'CB', 'PA', 'PB'], angles: [{ id: 'AOB', col: 'first', r: 50 }, { id: 'ACB', col: 'second', r: 62 }, { id: 'APB', col: 'pick', r: 56 }] });
  const want = sg === 'inscribed-angle-classify' ? 1 : sg === 'circumscribed-angle-classify' ? 2 : 0;
  const names = ['∠AOB', '∠ACB', '∠APB', '∠OAP'];
  const why = ['∠AOB has its vertex at the center and radii for sides.', '∠ACB has its vertex on the circle and chords for sides.', '∠APB is formed by two tangents from P.', '∠OAP is between a radius and a tangent: none of the three kinds.'];
  const mcs = [[undefined, MC.insideCentral, MC.anyExterior, undefined], [MC.insideInscribed, undefined, undefined, undefined], [undefined, undefined, undefined, MC.anyExterior]][want]!;
  const opts: Opt[] = names.map((t, i) => ({ t, ok: i === want, mc: mcs[i], say: i === want ? `Right: ${why[i]}` : `${why[i]} ${why[want]}` }));
  return choose(R, t0(R), {
    id: `whichAngle-${n}`, family: 'whichAngle',
    prompt: `O is the center; A, B and C lie on the circle; PA and PB are tangent to the circle at A and B. Which angle is ${['central', 'inscribed', 'circumscribed'][want]}?`,
    board: '\\angle\\,?', solution: [why[want]!], picture: { cfig: fig },
  }, opts);
});
export const circumTangency: Gen = (R, n) => fitted('circumTangency', () => {
  const m = r(R, 80, 150), th = r(R, 0, 359), A = th, B = th + m;
  const P = cross(mul(dirv(A), R0), add(mul(dirv(A), R0), dirv(A + 90)), mul(dirv(B), R0), add(mul(dirv(B), R0), dirv(B + 90)));
  if (dist(P, [0, 0]) > R0 * 2.4) throw new Error('far');
  // a secant from P between the tangents: through C (near) and D (far)
  const u = unit(sub([0, 0], P)), off = (R() < 0.5 ? 1 : -1) * R0 * (0.3 + 0.25 * R());
  const v: Pt = [-u[1], u[0]], foot = add([0, 0], mul(v, off));
  const h = Math.sqrt(R0 * R0 - off * off);
  const Cp = add(foot, mul(u, -h)), Dp = add(foot, mul(u, h));
  const angOf = (p: Pt) => norm((Math.atan2(p[1], p[0]) * 180) / Math.PI);
  const fig = cfig({ center: 'O', on: { A, B, C: angOf(Cp), D: angOf(Dp) }, pts: { P }, segs: [{ id: 'PA', kind: 'line', ext: [0, R0 * 0.25], col: 'ink' }, { id: 'PB', kind: 'line', ext: [0, R0 * 0.25], col: 'ink' }, { id: 'PD', kind: 'line', ext: [0, R0 * 0.3], col: 'ink' }] });
  const opts: Opt[] = [
    { t: '∠APB, with points of tangency A and B', ok: true, say: 'Right: two tangents from P, touching at A and B.' },
    { t: '∠APD, with points of tangency A and D', mc: MC.anyExterior, say: 'Line PD is a secant (it crosses at C and D): ∠APD is not circumscribed.' },
    { t: '∠APB, with points of tangency P and O', say: 'Points of tangency are on the circle: A and B.' },
    { t: '∠AOB, with points of tangency A and B', mc: MC.insideCentral, say: '∠AOB is the central angle; the circumscribed angle has its vertex at P.' },
  ];
  return choose(R, t0(R), {
    id: `circumTangency-${n}`, family: 'circumTangency',
    prompt: 'O is the center. Lines PA and PB are tangent to the circle; line PD crosses it at C and D. Which angle is circumscribed, and what are its points of tangency?',
    board: '\\angle APB', solution: ['A circumscribed angle is formed by two tangents from one outside point.', 'Tangents PA and PB touch at A and B.'], picture: { cfig: fig, reveal: { glow: ['APB'] } },
  }, opts);
});

// ---------- arcs: names and measures ----------
export const arcName: Gen = (R, n) => fitted('arcName', () => {
  const kind = pick(R, ['minor', 'major', 'major', 'semi'] as const);
  const x = r(R, 60, 120);
  const arcs = kind === 'semi' ? [x, 180 - x, ...splitArcs(R, 2, 60, 120)] : splitArcs(R, 4, 45, 135);
  if (kind === 'semi' && arcs[2]! + arcs[3]! !== 180) throw new Error('semi');
  const ang = placeCcw(r(R, 0, 359), arcs);
  const on = { A: ang[0]!, B: ang[1]!, C: ang[2]!, D: ang[3]! };
  let hl: ArcSpec, right: string;
  if (kind === 'minor') { hl = { from: 'B', to: 'C', col: 'pick' }; right = 'BC'; if (arcs[1]! >= 180) throw new Error('x'); }
  else if (kind === 'major') { hl = { from: 'C', to: 'B', col: 'pick' }; right = pick(R, ['CDB', 'CAB']); }
  else { hl = { from: 'A', to: 'C', col: 'pick' }; right = 'ABC'; }
  const fig = cfig({ center: 'O', on, segs: kind === 'semi' ? ['AC'] : [], arcs: [hl] });
  const key = arcKey(on, right);
  const cands: Opt[] = [
    { t: arcN(right), ok: true, v: key, say: `Right: ${kind === 'minor' ? 'two letters name the minor arc' : 'three letters: the endpoints and a point on the arc'}.` },
    { t: arcN(right[0]! + right[right.length - 1]!), v: arcKey(on, right[0]! + right[right.length - 1]!), mc: kind === 'minor' ? undefined : MC.majorTwo, say: kind === 'semi' ? 'Two letters do not tell which semicircle: add a point on it.' : 'Two letters name the MINOR arc; a major arc needs a third letter.' },
    ...['A', 'B', 'C', 'D'].filter(p => !right.includes(p)).map(p => { const nm = right[0]! + p + right[right.length - 1]!; return { t: arcN(nm), v: arcKey(on, nm), mc: MC.wrongArc, say: `The middle letter must be a point ON the highlighted arc; ${p} is not on it.` }; }),
    { t: `chord ${right[0]}${right[right.length - 1]}`, v: 'chord', mc: MC.chordArc, say: 'The chord is the straight segment; the arc is the curved part of the circle.' },
  ];
  if (kind === 'minor') cands.splice(1, 1, { t: arcN('B' + 'A' + 'C'), v: arcKey(on, 'BAC'), mc: MC.wrongArc, say: 'A is not on the highlighted arc.' });
  return choose(R, t0(R), {
    id: `arcName-${n}`, family: 'arcName',
    prompt: `O is the center; A, B, C and D lie on the circle${kind === 'semi' ? ', and AC is a diameter' : ''}. Which name fits the highlighted arc?`,
    board: '\\overparen{\\ ?\\ }',
    solution: [kind === 'minor' ? 'It is a minor arc (less than 180°): its two endpoints name it.' : kind === 'semi' ? 'It is a semicircle: two letters could mean either half, so name a point on it.' : 'It is a major arc (more than 180°): endpoints plus a point on the arc.'],
    picture: { cfig: fig, reveal: { glow: [right[0]! + right[right.length - 1]!] } },
  }, cands.slice(0, 5));
});
export const arcMeasure: Gen = (R, n) => fitted('arcMeasure', () => {
  const kind = pick(R, ['minor', 'major', 'major', 'semi', 'add', 'add', 'length'] as const);
  const th = r(R, 0, 359);
  let spec: CSpec, ask: string, a: number, wrong: NumWrong[], sol: string[], given: string;
  if (kind === 'minor' || kind === 'major' || kind === 'length') {
    const c = r(R, 35, 165), rad = r(R, 3, 12);
    const C = th + c + r(R, 40, 360 - c - 40);
    spec = { center: 'O', on: { A: th, B: th + c, C }, segs: kind === 'length' ? [{ id: 'OA', text: `${rad} in.` }, 'OB'] : ['OA', 'OB'], angles: [{ id: 'AOB', text: `${c}°`, col: 'first', r: 52 }], arcs: [kind === 'major' ? { from: 'B', to: 'A', col: 'link', text: '?', alt: `${360 - c}°` } : { from: 'A', to: 'B', col: 'link', text: '?', alt: `${c}°` }] };
    ask = kind === 'major' ? 'BCA' : 'AB';
    a = kind === 'major' ? 360 - c : c;
    given = `m∠AOB = ${c}°${kind === 'length' ? `; the radius is ${rad} in.` : ''}`;
    wrong = kind === 'major'
      ? [{ v: c, mc: MC.minorDefault, say: `${c}° is the minor arc AB; arc BCA goes the long way, through C.` }, { v: 180 - c, say: 'The whole circle is 360°, not 180°.' }]
      : [{ v: c / 2, mc: MC.doubled, say: 'A central angle and its arc have the SAME measure (halving is for inscribed angles).' }, { v: 360 - c, mc: MC.wrongArc, say: 'That is the major arc, the long way round.' }, { v: rad, mc: MC.measLen, say: 'The radius sets the arc length, not the degree measure.' }];
    sol = kind === 'major' ? [`m(arc AB) = m∠AOB = ${c}°.`, `Arc BCA is the rest of the circle: 360° − ${c}° = ${S(dg(360 - c))}.`] : [`An arc's degree measure equals its central angle${kind === 'length' ? ' (the radius only changes its length)' : ''}.`, `m(arc AB) = ${S(dg(c))}.`];
  } else if (kind === 'semi') {
    const x = r(R, 40, 140);
    spec = { center: 'O', on: { A: th, B: th + x, C: th + 180 }, segs: ['AC', 'OB'], arcs: [{ from: 'A', to: 'B', col: 'first', text: `${x}°` }, { from: 'A', to: 'C', col: 'link', text: '?', alt: '180°', thin: true }] };
    ask = 'ABC'; a = 180; given = `AC is a diameter and m(arc AB) = ${x}°`;
    wrong = [{ v: x, mc: MC.wrongArc, say: 'Arc ABC runs from A through B all the way to C.' }, { v: 180 - x, say: `That is arc BC; arc ABC also includes arc AB.` }, { v: 360, say: 'A diameter cuts the circle into two halves.' }];
    sol = ['A diameter splits the circle into two semicircles.', `Arc ABC is one of them: ${S('180°')}.`];
  } else {
    const [x, y] = [r(R, 40, 130), r(R, 40, 130)];
    spec = { center: 'O', on: { A: th, B: th + x, C: th + x + y }, segs: ['OA', 'OB', 'OC'], arcs: [{ from: 'A', to: 'B', col: 'first', text: `${x}°` }, { from: 'B', to: 'C', col: 'second', text: `${y}°` }] };
    ask = 'ABC'; a = x + y; given = `m(arc AB) = ${x}° and m(arc BC) = ${y}°`;
    wrong = [{ v: Math.abs(x - y), say: 'Adjacent arcs add.' }, { v: 360 - x - y, mc: MC.wrongArc, say: 'That is the rest of the circle, not arc ABC.' }, { v: (x + y) / 2, say: 'Arcs add; nothing is halved.' }];
    sol = ['Arc Addition: adjacent arcs add.', `m(arc ABC) = ${x}° + ${y}° = ${S(dg(x + y))}.`];
  }
  return numQ(t0(R), {
    id: `arcMeasure-${n}`, family: 'arcMeasure', prompt: `O is the center; ${given}. What is ${mArc(ask)} in degrees?`,
    board: `m\\overparen{${ask}} = \\,?`, unit: '°', solution: sol, picture: { cfig: cfig(spec), reveal: { solved: ['AB', 'BA', 'AC'] } },
  }, a, wrong, 'Right.', 'Arc measure: the central angle; adjacent arcs add; the whole circle is 360°.');
});
export const interceptPick: Gen = (R, n) => fitted('interceptPick', () => {
  const kind = pick(R, ['minor', 'major', 'major', 'central'] as const);
  const m = r(R, 60, 150), th = r(R, 0, 359), A = th, B = th + m;
  const on: Record<string, number> = { A, B };
  let spec: CSpec;
  if (kind === 'central') { on.D = B + r(R, 40, 360 - m - 40); spec = { center: 'O', on, segs: ['OA', 'OB'], angles: [{ id: 'AOB', col: 'pick', r: 54 }] }; }
  else if (kind === 'minor') { on.C = B + r(R, 40, 360 - m - 40); on.D = A + m / 2 + r(R, -8, 8); spec = { center: 'O', on, segs: ['CA', 'CB'], angles: [{ id: 'ACB', col: 'pick', r: 60 }] }; }
  else { on.C = A + r(R, 22, m - 22); on.D = B + r(R, 50, 360 - m - 50); spec = { center: 'O', on, segs: ['CA', 'CB'], angles: [{ id: 'ACB', col: 'pick', r: 54 }] }; }
  const vtx = kind === 'central' ? 'O' : 'C';
  const right = kind === 'major' ? 'ADB' : 'AB';
  const names = kind === 'major' ? ['ADB', 'AB', 'ACB'] : kind === 'minor' ? ['AB', 'ACB', 'ADB'] : ['AB', 'ADB'];
  const opts: Opt[] = names.map(nm => {
    const key = arcKey(on, nm);
    const ok = nm === right;
    const mc = ok ? undefined : nm === 'AB' ? MC.minorDefault : nm.includes('C') ? MC.wrongArc : MC.wrongArc;
    return { t: arcN(nm), ok, v: key, mc, say: ok ? 'Right: the arc inside the angle, between its sides, not through the vertex.' : nm.includes('C') ? 'The intercepted arc lies inside the angle; it cannot pass through the vertex C.' : 'That arc is outside the angle: follow the two sides out to the circle.' };
  });
  opts.push({ t: `chord AB`, v: 'chord', mc: MC.chordArc, say: 'An angle intercepts an ARC, the curved part.' });
  const fig = cfig({ ...spec, arcs: [{ from: right === 'AB' ? 'A' : 'B', to: right === 'AB' ? 'B' : 'A', col: 'link', solve: true }] });
  return choose(R, t0(R), {
    id: `interceptPick-${n}`, family: 'interceptPick',
    prompt: `O is the center; ${Object.keys(on).filter(x => x !== 'O').join(', ')} lie on the circle. Which arc does ∠A${vtx}B intercept?`,
    board: `\\angle A${vtx}B`,
    solution: ['The intercepted arc lies in the interior of the angle, between the points where its sides meet the circle.', kind === 'major' ? 'The vertex C is on the minor arc, so the angle opens onto the major arc, through D.' : `The angle opens onto the minor arc between A and B.`],
    picture: { cfig: fig },
  }, opts);
});

// ---------- halving and doubling ----------
export const halveArc: Gen = (R, n) => fitted('halveArc', () => {
  const dir = R() < 0.6 ? 'halve' : 'double';
  const whole = 2 * r(R, 20, 170) + 1, half = whole / 2, th = r(R, 0, 359);
  const name = whole > 180 ? 'AMB' : 'AB';
  const fig = cfig({ center: 'O', on: { A: th, M: th + half, B: th + whole }, arcs: [
    { from: 'A', to: 'M', col: 'first', text: dir === 'halve' ? '?' : dg(half), alt: dir === 'halve' ? dg(half) : undefined },
    { from: 'M', to: 'B', col: 'second' },
  ] });
  if (dir === 'halve') {
    return numQ(t0(R), {
      id: `halveArc-${n}`, family: 'halveArc', prompt: `M is the midpoint of ${arcN(name)}, and ${mArc(name)} = ${whole}°. What is ${mArc('AM')}?`,
      board: `\\tfrac{1}{2}\\cdot ${whole}^\\circ`, unit: '°',
      solution: [`The midpoint splits the arc into two equal arcs: ${whole}° ÷ 2.`, `${whole - 1} ÷ 2 = ${(whole - 1) / 2}, and the 1 left over gives one half: ${S(fmt(half))}°.`],
      picture: { cfig: fig, reveal: { solved: ['AM'] } },
    }, half, [
      { v: Math.floor(half), mc: MC.dropsRem, say: `The leftover 1° still splits: half of it is 0.5°. Answer ${fmt(half)}.` },
      { v: Math.floor(half) + 0.1, mc: MC.remainder, say: 'A remainder of 1 is not .1: 1 ÷ 2 = 0.5.' },
      { v: whole * 2, say: 'The midpoint HALVES the arc.' },
    ], 'Right: an odd measure halves to a .5.', 'Divide by 2; an odd number ends in .5.');
  }
  return numQ(t0(R), {
    id: `halveArc-${n}`, family: 'halveArc', prompt: `M is the midpoint of ${arcN(name)}, and ${mArc('AM')} = ${fmt(half)}°. What is ${mArc(name)}?`,
    board: `2\\cdot ${fmt(half)}^\\circ`, unit: '°',
    solution: [`The two halves are equal, so the whole arc is twice ${fmt(half)}°.`, `2 × ${Math.floor(half)} = ${2 * Math.floor(half)}, and 2 × 0.5 = 1: ${S(whole)}°.`],
    picture: { cfig: fig },
  }, whole, [
    { v: whole - 1, mc: MC.dropsRem, say: 'Two halves of a degree make one more degree.' },
    { v: half / 2, say: 'M is the midpoint, so the whole arc is TWICE arc AM.' },
  ], 'Right.', 'Double it: two halves make the whole arc.');
});
void ans; void inArc;
