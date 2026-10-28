// famB.ts: stage 2 of "Arcs and angles in circles": measures. The Inscribed Angle Theorem (minor and major arcs,
// both directions, central angle on the same arc), same-arc angles, the semicircle right angle, inscribed
// quadrilaterals, tangent ⊥ radius, the circumscribed angle, tangent-chord, chord-chord and exterior angles, the
// radius isosceles triangle, linear equations from one relation, and 2-3 step chases. Every labelled angle and arc is
// drawn at its measure; givens never reveal the answer; every wrong typed value that equals the answer is dropped.
import { type Pt, add, dirv, dist, mul } from '../geometry-foundations/geo';
import { type AngSpec, type ArcSpec, type CSpec, R0, cfig } from './cfig';
import { cross, placeCcw, splitArcs } from './cconf';
import { tanSecConf } from './famA';
import { type CItem, type Gen, type NumWrong, type Opt, MC, S, arcN, choose, dg, fitted, fmt, lin, linT, mA, mArc, numQ, pick, r, relabel } from './ckit';

const ROLES = 'ABCDEPQST';
const t0 = (R: () => number) => relabel(R, ROLES + 'O', 'O');
const half = (x: number) => x / 2;
const tanAt = (d: number): [Pt, Pt] => { const T = mul(dirv(d), R0); return [T, add(T, dirv(d + 90))]; };
/** where the tangents at angles a and b meet */
const tanMeet = (a: number, b: number): Pt => { const [p, q] = tanAt(a), [u, w] = tanAt(b); return cross(p, q, u, w); };
const ok = 'Right.';

// ---------- the Inscribed Angle Theorem ----------
export const inscribedArc: Gen = (R, n) => fitted('inscribedArc', () => {
  const toAngle = R() < 0.55;
  const m = r(R, 40, 170), th = r(R, 0, 359), C = th + m + r(R, 35, 360 - m - 35), a = half(m);
  const fig = cfig({ center: 'O', on: { A: th, B: th + m, C }, segs: ['CA', 'CB'],
    angles: [{ id: 'ACB', col: 'second', text: toAngle ? '?' : dg(a), alt: toAngle ? dg(a) : undefined, r: 64 }],
    arcs: [{ from: 'A', to: 'B', col: 'first', text: toAngle ? dg(m) : '?', alt: toAngle ? undefined : dg(m) }] });
  return toAngle
    ? numQ(t0(R), { id: `inscribedArc-${n}`, family: 'inscribedArc', prompt: `A, B and C lie on circle O, with C not on ${arcN('AB')}, and ${mArc('AB')} = ${m}°. What is ${mA('ACB')}?`, board: `m\\angle ACB = \\tfrac{1}{2}(${m}^\\circ)`, unit: '°',
      solution: ['∠ACB is inscribed: its vertex C is on the circle and it intercepts arc AB.', `Inscribed angle = half its arc: ${m}° ÷ 2 = ${S(fmt(a))}°.`], picture: { cfig: fig, reveal: { solved: ['ACB'] } } },
      a, [{ v: m, mc: MC.fullArc, say: 'An angle with its vertex ON the circle is half its arc, not the whole arc.' }, { v: 2 * m, mc: MC.doubled, say: 'Halve the arc; do not double it.' }, { v: 180 - m, say: 'Use half the intercepted arc.' }], ok, 'Inscribed angle = ½ × intercepted arc.')
    : numQ(t0(R), { id: `inscribedArc-${n}`, family: 'inscribedArc', prompt: `A, B and C lie on circle O, with C not on ${arcN('AB')}, and ${mA('ACB')} = ${fmt(a)}°. What is ${mArc('AB')}?`, board: `m\\overparen{AB} = 2(${fmt(a)}^\\circ)`, unit: '°',
      solution: ['The inscribed angle is half its arc, so the arc is twice the angle.', `${mArc('AB')} = 2 × ${fmt(a)}° = ${S(m)}°.`], picture: { cfig: fig, reveal: { solved: ['AB'] } } },
      m, [{ v: a, mc: MC.fullArc, say: 'The arc is not equal to the inscribed angle: it is twice as big.' }, { v: a / 2, mc: MC.doubled, say: 'Going from angle to arc, double: the arc is twice the angle.' }], ok, 'Arc = 2 × inscribed angle.');
});
export const inscribedCentral: Gen = (R, n) => fitted('inscribedCentral', () => {
  const toIns = R() < 0.55;
  const c = r(R, 40, 170), th = r(R, 0, 359), C = th + c + r(R, 40, 360 - c - 40), a = half(c);
  const fig = cfig({ center: 'O', on: { A: th, B: th + c, C }, segs: ['OA', 'OB', 'CA', 'CB'],
    angles: [{ id: 'AOB', col: 'first', text: toIns ? dg(c) : '?', alt: toIns ? undefined : dg(c), r: 50 }, { id: 'ACB', col: 'second', text: toIns ? '?' : dg(a), alt: toIns ? dg(a) : undefined, r: 62 }],
    arcs: [{ from: 'A', to: 'B', col: 'link', thin: true }] });
  return toIns
    ? numQ(t0(R), { id: `inscribedCentral-${n}`, family: 'inscribedCentral', prompt: `O is the center; A, B and C lie on the circle; ${mA('AOB')} = ${c}°. What is ${mA('ACB')}?`, board: `m\\angle ACB = \\tfrac{1}{2}\\, m\\angle AOB`, unit: '°',
      solution: [`Both angles stand on arc AB: the central angle equals the arc, ${c}°.`, `The inscribed angle is half of it: ${S(fmt(a))}°.`], picture: { cfig: fig, reveal: { solved: ['ACB'] } } },
      a, [{ v: c, mc: MC.fullArc, say: 'Only the CENTRAL angle equals the arc; the inscribed angle is half.' }, { v: 2 * c, mc: MC.doubled, say: 'The inscribed angle is half the central angle, not double.' }, { v: 180 - c, say: 'Use half the central angle.' }], ok, 'Inscribed angle = ½ × central angle on the same arc.')
    : numQ(t0(R), { id: `inscribedCentral-${n}`, family: 'inscribedCentral', prompt: `O is the center; A, B and C lie on the circle; ${mA('ACB')} = ${fmt(a)}°. What is ${mA('AOB')}?`, board: `m\\angle AOB = 2\\, m\\angle ACB`, unit: '°',
      solution: ['Both angles stand on arc AB.', `The central angle is twice the inscribed angle: 2 × ${fmt(a)}° = ${S(c)}°.`], picture: { cfig: fig, reveal: { solved: ['AOB'] } } },
      c, [{ v: a, mc: MC.fullArc, say: 'The central angle is twice the inscribed angle on the same arc.' }, { v: a / 2, mc: MC.doubled, say: 'From inscribed to central: double.' }], ok, 'Central angle = 2 × inscribed angle on the same arc.');
});
export const inscribedMajor: Gen = (R, n) => fitted('inscribedMajor', () => {
  const toAngle = R() < 0.6;
  const m = 2 * r(R, 25, 80), th = r(R, 0, 359), C = th + r(R, 20, m - 20), D = th + m + r(R, 40, 360 - m - 40), a = (360 - m) / 2;
  const fig = cfig({ center: 'O', on: { A: th, B: th + m, C, D }, segs: ['CA', 'CB'],
    angles: [{ id: 'ACB', col: 'second', text: toAngle ? '?' : dg(a), alt: toAngle ? dg(a) : undefined, r: 46 }],
    arcs: [{ from: 'A', to: 'B', col: 'first', text: toAngle ? dg(m) : '?', alt: toAngle ? undefined : dg(m) }, { from: 'B', to: 'A', col: 'link', thin: true, solve: true }] });
  return toAngle
    ? numQ(t0(R), { id: `inscribedMajor-${n}`, family: 'inscribedMajor', prompt: `A, B, C and D lie on circle O; C is on the minor ${arcN('AB')}, and ${mArc('AB')} = ${m}°. What is ${mA('ACB')}?`, board: `m\\angle ACB = \\tfrac{1}{2}\\,m\\overparen{ADB}`, unit: '°',
      solution: ['C sits on arc AB, so ∠ACB opens onto the other arc: major arc ADB.', `${mArc('ADB')} = 360° − ${m}° = ${360 - m}°.`, `${mA('ACB')} = ${360 - m}° ÷ 2 = ${S(fmt(a))}°.`], picture: { cfig: fig, reveal: { solved: ['ACB'] } } },
      a, [{ v: m / 2, mc: MC.minorDefault, say: 'C is ON arc AB, so the angle cannot intercept it: it intercepts the major arc ADB.' }, { v: 360 - m, mc: MC.fullArc, say: 'That is the major arc itself; the inscribed angle is half of it.' }, { v: m, mc: MC.fullArc, say: 'Find the intercepted (major) arc, then halve it.' }], ok, 'Intercepted arc = 360° − the minor arc; then halve.')
    : numQ(t0(R), { id: `inscribedMajor-${n}`, family: 'inscribedMajor', prompt: `A, B, C and D lie on circle O; C is on the minor ${arcN('AB')}, and ${mA('ACB')} = ${fmt(a)}°. What is ${mArc('AB')} (the minor arc)?`, board: `m\\overparen{AB} = 360^\\circ - 2(${fmt(a)}^\\circ)`, unit: '°',
      solution: [`∠ACB intercepts the major arc ADB: ${mArc('ADB')} = 2 × ${fmt(a)}° = ${360 - m}°.`, `The minor arc is the rest: 360° − ${360 - m}° = ${S(m)}°.`], picture: { cfig: fig, reveal: { solved: ['AB'] } } },
      m, [{ v: 360 - m, mc: MC.minorDefault, say: 'Twice the angle is the MAJOR arc ADB (the one it intercepts); arc AB is the rest.' }, { v: a / 2, mc: MC.doubled, say: 'Double the angle to get its arc, then subtract from 360°.' }], ok, 'Double the angle (the major arc), subtract from 360°.');
});
export const sameArc: Gen = (R, n) => fitted('sameArc', () => {
  const same = R() < 0.6;
  const m = r(R, 50, 150), th = r(R, 0, 359), a = half(m);
  const C = th + m + r(R, 30, 360 - m - 80), D = same ? C + r(R, 30, th + 360 - C - 25) : th + r(R, 22, m - 22);
  if (same && D > th + 360 - 25) throw new Error('D');
  const ans = same ? a : 180 - a;
  const fig = cfig({ center: null, on: { A: th, B: th + m, C, D }, segs: ['CA', 'CB', 'DA', 'DB'],
    angles: [{ id: 'ACB', col: 'first', text: dg(a), r: 60 }, { id: 'ADB', col: 'link', text: '?', alt: dg(ans), r: same ? 60 : 46 }] });
  return numQ(t0(R), {
    id: `sameArc-${n}`, family: 'sameArc', prompt: `A, B, C and D lie on one circle, and ${mA('ACB')} = ${fmt(a)}°. What is ${mA('ADB')}?`, board: `m\\angle ADB = \\,?`, unit: '°',
    solution: same ? ['C and D are on the same side of chord AB: both angles intercept the same arc AB.', `Same arc, same angle: ${S(fmt(a))}°.`] : ['D is on the other side of chord AB: ∠ADB intercepts the other arc.', `The two arcs make 360°, so the two angles make 180°: 180° − ${fmt(a)}° = ${S(fmt(ans))}°.`],
    picture: { cfig: fig, reveal: { solved: ['ADB'] } },
  }, ans, same
    ? [{ v: 180 - a, mc: MC.congSupp, say: 'C and D see the SAME arc: the angles are congruent, not supplementary.' }, { v: m, mc: MC.fullArc, say: 'Both are inscribed angles on one arc: equal to each other, each half the arc.' }, { v: 2 * a, mc: MC.doubled, say: 'Same arc, same angle.' }]
    : [{ v: a, mc: MC.eitherSide, say: 'D is on the OTHER side of chord AB: it sees the other arc, so the angles are supplementary.' }, { v: 360 - a, say: 'Angles on opposite arcs add to 180°.' }], ok, 'Same arc: congruent; opposite arcs of one chord: supplementary.');
});
export const sameOrOpposite: Gen = (R, n) => fitted('sameOrOpposite', () => {
  const same = R() < 0.5;
  const m = r(R, 50, 150), th = r(R, 0, 359);
  const C = th + m + r(R, 30, 360 - m - 80), D = same ? C + r(R, 30, th + 360 - C - 25) : th + r(R, 22, m - 22);
  if (same && D > th + 360 - 25) throw new Error('D');
  const fig = cfig({ center: null, on: { A: th, B: th + m, C, D }, segs: ['CA', 'CB', 'DA', 'DB'], angles: [{ id: 'ACB', col: 'first', r: 60, arcs: 1 }, { id: 'ADB', col: 'second', r: same ? 60 : 46, arcs: 1 }] });
  const opts: Opt[] = [
    { t: 'congruent: they intercept the same arc', ok: same, mc: same ? undefined : MC.eitherSide, say: same ? 'Right: same arc AB, same measure.' : 'D is on the other side of chord AB; it intercepts the other arc.' },
    { t: 'supplementary: their arcs make the whole circle', ok: !same, mc: same ? MC.congSupp : undefined, say: same ? 'C and D are on the same side of AB: the same arc, so congruent.' : 'Right: the two arcs add to 360°, so the angles add to 180°.' },
    { t: 'nothing: their measures are not linked', say: 'They stand on the same chord AB, so their arcs are linked.' },
  ];
  return choose(R, t0(R), { id: `sameOrOpposite-${n}`, family: 'sameOrOpposite', prompt: 'A, B, C and D lie on one circle, and ∠ACB is not a right angle. How are ∠ACB and ∠ADB related?', board: '\\angle ACB \\ ?\\ \\angle ADB',
    solution: [same ? 'C and D are on the same arc cut off by chord AB.' : 'C and D are on opposite arcs of chord AB.', same ? 'Both intercept arc AB: congruent.' : 'Their intercepted arcs add to 360°: the angles add to 180°.'], picture: { cfig: fig } }, opts, true);
});

// ---------- the semicircle ----------
export const semicircle: Gen = (R, n) => fitted('semicircle', () => {
  const askC = R() < 0.3;
  const c = 2 * r(R, 15, 75), th = r(R, 0, 359), a = c / 2;   // C = B + c: ∠CAB = ½ arc BC = c/2, ∠ABC = 90 − a
  if (c === 90) throw new Error('isosceles');
  const fig = cfig({ center: 'O', on: { A: th, B: th + 180, C: th + 180 + c }, segs: ['AB', 'CA', 'CB'],
    angles: askC ? [{ id: 'ACB', col: 'link', text: '?', alt: '90°', r: 50 }] : [{ id: 'CAB', col: 'first', text: dg(a), r: 70 }, { id: 'ABC', col: 'link', text: '?', alt: dg(90 - a), r: 70 }] });
  return askC
    ? numQ(t0(R), { id: `semicircle-${n}`, family: 'semicircle', prompt: 'AB is a diameter of circle O, and C is on the circle. What is m∠ACB?', board: 'm\\angle ACB', unit: '°',
      solution: ['∠ACB is inscribed and intercepts arc AB, a semicircle (AB is a diameter).', `Half of 180° is ${S(90)}°.`], picture: { cfig: fig, reveal: { solved: ['ACB'] } } },
      90, [{ v: 180, mc: MC.fullArc, say: 'The arc is 180°; the inscribed angle is half of it.' }, { v: 45, say: 'Half of the semicircle: 90°.' }], ok, 'An angle inscribed in a semicircle is a right angle.')
    : numQ(t0(R), { id: `semicircle-${n}`, family: 'semicircle', prompt: `AB is a diameter of circle O, C is on the circle, and ${mA('CAB')} = ${a}°. What is ${mA('ABC')}?`, board: `m\\angle ABC = 90^\\circ - ${a}^\\circ`, unit: '°',
      solution: ['AB is a diameter, so ∠ACB (at C) is a right angle.', `The triangle's angles add to 180°: 180° − 90° − ${a}° = ${S(90 - a)}°.`], picture: { cfig: fig, reveal: { solved: ['ABC'] } } },
      90 - a, [{ v: 180 - a, mc: MC.compSupp, say: 'The right angle is at C, so the other two angles add to 90°, not 180°.' }, { v: 90, mc: MC.rightWrongV, say: 'The right angle is at C, the vertex on the circle, not at B.' }, { v: a, say: 'The two acute angles add to 90°.' }], ok, 'The right angle is at C; the other two add to 90°.');
});
export const diameterGiven: Gen = (R, n) => fitted('diameterGiven', () => {
  const kind = pick(R, ['stated', 'unstated', 'labelled'] as const);
  const th = r(R, 0, 359), m = kind === 'stated' ? 180 : 2 * r(R, 79, 86), C = th + m + r(R, 50, 360 - m - 50);
  const fig = cfig({ center: kind === 'stated' ? 'O' : null, on: { A: th, B: th + m, C }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'ACB', col: 'pick', r: 52 }],
    arcs: kind === 'labelled' ? [{ from: 'A', to: 'B', col: 'first', text: dg(m) }] : [] });
  const facts = kind === 'stated' ? 'AB is a diameter of circle O, and C is on the circle.' : kind === 'unstated' ? 'A, B and C lie on a circle; nothing is given about where its center is.' : `A, B and C lie on a circle, and ${mArc('AB')} = ${m}° (C is not on it).`;
  const opts: Opt[] = kind === 'labelled'
    ? [{ t: `No: m∠ACB = ½(${m}°) = ${m / 2}°`, ok: true, say: 'Right: the arc is not a semicircle.' }, { t: 'Yes: AB looks like a diameter', mc: MC.appearance, say: `The arc is ${m}°, not 180°: AB is not a diameter.` }, { t: 'Yes: an angle inscribed in a semicircle is right', mc: MC.noHyp, say: 'Arc AB is not a semicircle.' }]
    : [
      { t: 'Yes: AB is a diameter, so ∠ACB intercepts a semicircle', ok: kind === 'stated', mc: kind === 'stated' ? undefined : MC.noHyp, say: kind === 'stated' ? 'Right: a semicircle gives a right inscribed angle.' : 'Nothing given says AB passes through the center.' },
      { t: 'Yes: it looks like a right angle', mc: MC.appearance, say: 'A look is not a reason; use the givens.' },
      { t: 'Not from the givens: nothing says AB passes through the center', ok: kind === 'unstated', mc: kind === 'stated' ? MC.failedDisproof : undefined, say: kind === 'unstated' ? 'Right: a long chord is not a diameter until it is given (or proved) to pass through the center.' : 'It IS given: AB is a diameter.' },
    ];
  return choose(R, t0(R), { id: `diameterGiven-${n}`, family: 'diameterGiven', prompt: `${facts} Is ∠ACB a right angle?`, board: 'm\\angle ACB = 90^\\circ?',
    solution: [kind === 'stated' ? 'AB is a diameter: arc AB is a semicircle, 180°.' : kind === 'labelled' ? `Arc AB is ${m}°, not 180°.` : 'The right-angle theorem needs AB to be a diameter.', kind === 'stated' ? 'The inscribed angle is half: 90°.' : kind === 'labelled' ? `∠ACB = ${m}° ÷ 2 = ${m / 2}°.` : 'The givens do not say so: no conclusion.'], picture: { cfig: fig } }, opts, kind !== 'labelled');
});

// ---------- inscribed quadrilaterals ----------
function quadFig(R: () => number) {
  const arcs = splitArcs(R, 4, 25, 60, 180).map(x => 2 * x);
  if (arcs.reduce((s, x) => s + x, 0) !== 360) throw new Error('sum');
  const [A, B, C, D] = placeCcw(r(R, 0, 359), arcs);
  const angA = (arcs[1]! + arcs[2]!) / 2, angB = (arcs[2]! + arcs[3]!) / 2, angC = (arcs[3]! + arcs[0]!) / 2, angD = (arcs[0]! + arcs[1]!) / 2;
  return { on: { A: A!, B: B!, C: C!, D: D! }, arcs, ang: { A: angA, B: angB, C: angC, D: angD } as Record<string, number> };
}
const QID: Record<string, string> = { A: 'DAB', B: 'ABC', C: 'BCD', D: 'CDA' };
const OPP: Record<string, string> = { A: 'C', B: 'D', C: 'A', D: 'B' };
export const cyclicQuad: Gen = (R, n) => fitted('cyclicQuad', () => {
  const q = quadFig(R), two = R() < 0.45;
  const g = pick(R, ['A', 'B', 'C', 'D']), ask = OPP[g]!, adj = two ? pick(R, ['A', 'B', 'C', 'D'].filter(x => x !== g && x !== ask)) : null;
  const angles: AngSpec[] = [{ id: QID[g]!, col: 'first', text: dg(q.ang[g]!), r: 58 }, { id: QID[ask]!, col: 'link', text: '?', alt: dg(q.ang[ask]!), r: 58 }];
  if (adj) angles.push({ id: QID[adj]!, col: 'second', text: dg(q.ang[adj]!), r: 58 });
  if (Object.values(q.ang).some(x => x > 140 || x < 40)) throw new Error('flat');
  const fig = cfig({ center: null, on: q.on, segs: ['AB', 'BC', 'CD', 'DA'], angles });
  const a = q.ang[ask]!;
  const wrong: NumWrong[] = [{ v: q.ang[g]!, mc: MC.cyclicEqual, say: 'Opposite angles of an inscribed quadrilateral are SUPPLEMENTARY (that is a parallelogram that has congruent ones).' }, { v: 360 - q.ang[g]!, say: 'Opposite angles add to 180°.' }];
  if (adj) wrong.push({ v: 180 - q.ang[adj]!, mc: MC.wrongAngle, say: `∠${adj} is next to ∠${ask}, not opposite it: pair ∠${ask} with ∠${g}.` }, { v: q.ang[adj]!, mc: MC.cyclicEqual, say: 'Use the opposite angle, and supplementary.' });
  return numQ(t0(R), {
    id: `cyclicQuad-${n}`, family: 'cyclicQuad', prompt: `Quadrilateral ABCD is inscribed in a circle. ${mA(QID[g]!)} = ${q.ang[g]}°${adj ? ` and ${mA(QID[adj]!)} = ${q.ang[adj]}°` : ''}. What is ${mA(QID[ask]!)}?`,
    board: `m\\angle ${QID[ask]} = 180^\\circ - ${q.ang[g]}^\\circ`, unit: '°',
    solution: [`∠${ask} and ∠${g} are opposite angles of an inscribed quadrilateral: they are supplementary.`, `180° − ${q.ang[g]}° = ${S(a)}°.`],
    picture: { cfig: fig, reveal: { solved: [QID[ask]!] } },
  }, a, wrong, ok, 'Opposite angles of an inscribed quadrilateral add to 180°.');
});
export const cyclicApplies: Gen = (R, n) => fitted('cyclicApplies', () => {
  const q = quadFig(R), on = R() < 0.35;
  const spec: CSpec = { center: null, on: { A: q.on.A, B: q.on.B, C: q.on.C }, segs: ['AB', 'BC', 'CD', 'DA'], angles: [{ id: 'DAB', col: 'first', text: '', r: 58 }] };
  let a: number;
  if (on) { spec.on!.D = q.on.D; a = q.ang.A!; }
  else {
    // D on the same ray from A as the on-circle D, pulled inside or pushed outside: m∠DAB stays a whole degree
    const A = mul(dirv(q.on.A), R0), B = mul(dirv(q.on.B), R0), Cc = mul(dirv(q.on.C), R0), D0 = mul(dirv(q.on.D), R0);
    const Dp = add(A, mul([D0[0] - A[0], D0[1] - A[1]], R() < 0.5 ? 0.72 : 1.22));
    spec.pts = { D: Dp };
    a = q.ang.A!;
    const m = (v: Pt, p: Pt, w: Pt) => { const x = Math.atan2(p[1] - v[1], p[0] - v[0]) - Math.atan2(w[1] - v[1], w[0] - v[0]); let d = Math.abs((x * 180) / Math.PI) % 360; if (d > 180) d = 360 - d; return d; };
    if (Math.abs(m(Cc, B, Dp) - (180 - a)) < 6) throw new Error('coincidence');
  }
  spec.angles = [{ id: 'DAB', col: 'first', text: dg(a), r: 58 }];
  const fig = cfig(spec);
  const where = on ? 'A, B, C and D all lie on the circle.' : `A, B and C lie on the circle; D is ${dist(spec.pts!.D!, [0, 0]) < R0 ? 'inside' : 'outside'} it.`;
  const opts: Opt[] = [
    { t: `Yes: opposite angles of an inscribed quadrilateral are supplementary, so m∠BCD = ${180 - a}°`, ok: on, mc: on ? undefined : MC.noHyp, say: on ? 'Right: all four vertices are on the circle.' : 'ABCD is not inscribed: D is not on the circle, so the theorem does not apply.' },
    { t: 'No: D is not on the circle, so ABCD is not inscribed', ok: !on, say: on ? 'D IS on the circle.' : 'Right: the theorem needs all four vertices on one circle.' },
    { t: `Yes: opposite angles are congruent, so m∠BCD = ${a}°`, mc: MC.cyclicEqual, say: 'Opposite angles congruent is a parallelogram fact, not a circle fact.' },
  ];
  return choose(R, t0(R), { id: `cyclicApplies-${n}`, family: 'cyclicApplies', prompt: `${where} m∠DAB = ${a}°. Can you conclude m∠BCD from the inscribed quadrilateral theorem?`, board: 'm\\angle BCD = \\,?',
    solution: ['The theorem needs ALL FOUR vertices on one circle.', on ? `They are: m∠BCD = 180° − ${a}° = ${180 - a}°.` : 'D is not on the circle: the theorem does not apply.'], picture: { cfig: fig } }, on ? opts.filter((_, i) => i !== 1).concat([{ t: 'No: one angle is not enough', say: 'One angle IS enough here: opposite angles are supplementary.' }]) : opts, true);
});

// ---------- tangents ----------
export const tangentRadius: Gen = (R, n) => fitted('tangentRadius', () => {
  const kind = pick(R, ['P', 'O', 'P', 'T'] as const);
  const a = r(R, 32, 62), th = r(R, 0, 359), side = R() < 0.5 ? 1 : -1;
  const T = mul(dirv(th), R0), P = add(T, mul(dirv(th + 90 * side), R0 * Math.tan((a * Math.PI) / 180)));
  const A = th + 180 + r(R, -50, 50);
  const angles: AngSpec[] = kind === 'P' ? [{ id: 'TOP', col: 'first', text: dg(a), r: 50 }, { id: 'OPT', col: 'link', text: '?', alt: dg(90 - a), r: 64 }]
    : kind === 'O' ? [{ id: 'OPT', col: 'first', text: dg(90 - a), r: 64 }, { id: 'TOP', col: 'link', text: '?', alt: dg(a), r: 50 }]
      : [{ id: 'OTP', col: 'link', text: '?', alt: '90°', r: 40 }, { id: 'TOP', col: 'first', text: dg(a), r: 50 }];
  const fig = cfig({ center: 'O', on: { T: th, A }, pts: { P }, segs: ['OT', 'OP', 'OA', { id: 'PT', kind: 'line', ext: [0, R0 * 0.55], col: 'ink' }], angles });
  const ans = kind === 'P' ? 90 - a : kind === 'O' ? a : 90;
  const wrong: NumWrong[] = kind === 'T'
    ? [{ v: 90 - a, mc: MC.rightAtP, say: 'The right angle is at T, the point of tangency, between the radius and the tangent.' }, { v: 180 - a, say: 'A tangent meets the radius at its point of tangency at 90°.' }]
    : [{ v: 180 - (kind === 'P' ? a : 90 - a), mc: MC.rightAtP, say: 'The right angle is at T, not at P: the other two angles add to 90°.' }, { v: kind === 'P' ? a : 90 - a, say: 'The two acute angles of right △OTP add to 90°.' }, { v: 90, mc: MC.rightAtP, say: 'The right angle is at T (radius ⊥ tangent), not at this vertex.' }];
  return numQ(t0(R), {
    id: `tangentRadius-${n}`, family: 'tangentRadius', prompt: `Line PT is tangent to circle O at T; A is another point of the circle. ${kind === 'O' ? `${mA('OPT')} = ${90 - a}°` : `${mA('TOP')} = ${a}°`}. What is ${mA(kind === 'P' ? 'OPT' : kind === 'O' ? 'TOP' : 'OTP')}?`,
    board: kind === 'T' ? '\\overline{OT} \\perp \\overleftrightarrow{PT}' : 'm\\angle OTP = 90^\\circ', unit: '°',
    solution: ['A tangent is perpendicular to the radius drawn to the point of tangency: m∠OTP = 90° (radius OT, not OA).', kind === 'T' ? `So ${S(90)}°.` : `In △OTP the other two angles add to 90°: 90° − ${kind === 'P' ? a : 90 - a}° = ${S(ans)}°.`],
    picture: { cfig: fig, reveal: { solved: [kind === 'P' ? 'OPT' : kind === 'O' ? 'TOP' : 'OTP'] } },
  }, ans, wrong, ok, 'Radius ⊥ tangent at T, then the triangle angle sum.');
});
export const circumValue: Gen = (R, n) => fitted('circumValue', () => {
  const toP = R() < 0.6, byArc = R() < 0.35;
  const c = r(R, 50, 150), th = r(R, 0, 359), P = tanMeet(th, th + c), p = 180 - c;
  if (dist(P, [0, 0]) > R0 * 2.5) throw new Error('far');
  const fig = cfig({ center: 'O', on: { A: th, B: th + c }, pts: { P }, segs: ['OA', 'OB', 'PA', 'PB'],
    angles: [{ id: 'OAP', box: true, r: 32 }, { id: 'PBO', box: true, r: 32 }, ...(byArc ? [] : [{ id: 'AOB', col: 'first' as const, text: toP ? dg(c) : '?', alt: toP ? undefined : dg(c), r: 50 }]), { id: 'APB', col: toP ? 'link' : 'second', text: toP ? '?' : dg(p), alt: toP ? dg(p) : undefined, r: 58 }],
    arcs: byArc ? [{ from: 'A', to: 'B', col: 'first', text: toP ? dg(c) : '?', alt: toP ? undefined : dg(c) }] : [] });
  const giv = byArc ? `${mArc('AB')} = ${c}°` : `${mA('AOB')} = ${c}°`;
  return toP
    ? numQ(t0(R), { id: `circumValue-${n}`, family: 'circumValue', prompt: `PA and PB are tangent to circle O at A and B, and ${giv}. What is ${mA('APB')}?`, board: 'm\\angle APB = 180^\\circ - m\\angle AOB', unit: '°',
      solution: ['Radii OA and OB meet the tangents at 90°, so OAPB has angles 90°, 90°, ∠AOB and ∠APB, adding to 360°.', `${mA('APB')} = 180° − ${c}° = ${S(p)}°.`], picture: { cfig: fig, reveal: { solved: ['APB'] } } },
      p, [{ v: c / 2, mc: MC.inscribedOff, say: 'P is outside the circle: the inscribed rule (half the arc) does not apply. Use 180° minus the central angle.' }, { v: c, say: 'The circumscribed angle and the central angle are supplementary.' }, { v: 360 - c, say: 'The quadrilateral OAPB has two right angles: the other two add to 180°.' }], ok, 'Circumscribed angle = 180° − central angle.')
    : numQ(t0(R), { id: `circumValue-${n}`, family: 'circumValue', prompt: `PA and PB are tangent to circle O at A and B, and ${mA('APB')} = ${p}°. What is ${byArc ? mArc('AB') : mA('AOB')}?`, board: 'm\\angle AOB = 180^\\circ - m\\angle APB', unit: '°',
      solution: ['OAPB has two right angles (radius ⊥ tangent), so ∠AOB + ∠APB = 180°.', `${180} − ${p} = ${S(c)}°${byArc ? ' (the arc equals its central angle)' : ''}.`], picture: { cfig: fig, reveal: { solved: [byArc ? 'AB' : 'AOB'] } } },
      c, [{ v: 2 * p, mc: MC.inscribedOff, say: 'Doubling is for an inscribed angle; P is outside the circle.' }, { v: p, say: 'They are supplementary, not equal.' }], ok, 'Central angle = 180° − circumscribed angle.');
});
export const tangentChord: Gen = (R, n) => fitted('tangentChord', () => {
  const kind = pick(R, ['angle', 'arc', 'obtuse', 'angle', 'x'] as const);
  const m = kind === 'x' ? 2 * (2 * r(R, 10, 35) + 6) : r(R, 50, 160), th = r(R, 0, 359), a = half(m);
  const T = mul(dirv(th), R0), Q = add(T, mul(dirv(th + 90), R0 * 0.75)), Sp = add(T, mul(dirv(th - 90), R0 * 0.75));
  const x0 = (a - 6) / 2;
  const angle: AngSpec = kind === 'obtuse' ? { id: 'ATS', col: 'link', text: '?', alt: dg(180 - a), r: 50 }
    : { id: 'ATQ', col: kind === 'arc' ? 'first' : 'link', text: kind === 'arc' ? dg(a) : kind === 'x' ? '(2x + 6)°' : '?', alt: kind === 'angle' ? dg(a) : undefined, r: 62 };
  const arc: ArcSpec = { from: 'T', to: 'A', col: kind === 'arc' ? 'link' : 'first', text: kind === 'arc' ? '?' : dg(m), alt: kind === 'arc' ? dg(m) : undefined };
  const fig = cfig({ center: null, on: { T: th, A: th + m }, pts: { Q, S: Sp }, segs: ['TA', { id: 'SQ', kind: 'line', ext: [R0 * 0.15, R0 * 0.15], col: 'ink' }], angles: [angle], arcs: [arc] });
  const base = { family: 'tangentChord', id: `tangentChord-${n}`, picture: { cfig: fig, reveal: { solved: [kind === 'arc' ? 'TA' : kind === 'obtuse' ? 'ATS' : 'ATQ'] } } };
  const intro = 'Line SQ is tangent to the circle at T, and A is on the circle.';
  if (kind === 'angle') return numQ(t0(R), { ...base, prompt: `${intro} ${mArc('TA')} = ${m}° (the arc inside ∠ATQ). What is ${mA('ATQ')}?`, board: 'm\\angle ATQ = \\tfrac{1}{2}\\,m\\overparen{TA}', unit: '°', solution: ['A tangent-chord angle is half its intercepted arc (like an inscribed angle).', `${m}° ÷ 2 = ${S(fmt(a))}°.`] }, a, [{ v: m, mc: MC.fullArc, say: 'The vertex T is on the circle: the angle is HALF its arc.' }, { v: 180 - a, mc: MC.wrongArc, say: '∠ATQ opens onto arc TA, the one given; the other side of the chord is ∠ATS.' }, { v: 2 * m, mc: MC.doubled, say: 'Halve, do not double.' }], ok, 'Tangent-chord angle = ½ × intercepted arc.');
  if (kind === 'arc') return numQ(t0(R), { ...base, prompt: `${intro} ${mA('ATQ')} = ${fmt(a)}°. What is ${mArc('TA')}, the arc inside ∠ATQ?`, board: 'm\\overparen{TA} = 2\\,m\\angle ATQ', unit: '°', solution: ['The tangent-chord angle is half its arc, so the arc is twice the angle.', `2 × ${fmt(a)}° = ${S(m)}°.`] }, m, [{ v: a, mc: MC.fullArc, say: 'The arc is twice the angle.' }, { v: 360 - m, mc: MC.wrongArc, say: 'Twice the angle gives the arc INSIDE the angle, arc TA.' }], ok, 'Arc = 2 × tangent-chord angle.');
  if (kind === 'obtuse') return numQ(t0(R), { ...base, prompt: `${intro} ${mArc('TA')} = ${m}° (the arc inside ∠ATQ). What is ${mA('ATS')}?`, board: 'm\\angle ATS = \\tfrac{1}{2}(360^\\circ - m\\overparen{TA})', unit: '°', solution: [`∠ATS opens onto the other arc: 360° − ${m}° = ${360 - m}°.`, `Half of it: ${S(fmt(180 - a))}°. (Check: ∠ATS + ∠ATQ = 180°.)`] }, 180 - a, [{ v: a, mc: MC.wrongArc, say: '∠ATS is on the other side of chord TA: it intercepts the major arc.' }, { v: 360 - m, mc: MC.fullArc, say: 'Halve the major arc.' }], ok, 'The partner angle intercepts the other arc: half of (360° − arc).');
  return numQ(t0(R), { ...base, prompt: `${intro} ${mA('ATQ')} = (2x + 6)° and ${mArc('TA')} = ${m}° (the arc inside ∠ATQ). What is x?`, board: `2x + 6 = \\tfrac{1}{2}(${m})`, unit: '', solution: [`The tangent-chord angle is half its arc: 2x + 6 = ${m} ÷ 2 = ${fmt(a)}.`, `2x = ${fmt(a - 6)}, so x = ${S(fmt(x0))}.`] }, x0, [{ v: (m - 6) / 2, mc: MC.fullArc, say: 'The angle is HALF the arc: 2x + 6 = ' + fmt(a) + '.' }, { v: a, mc: MC.reportsX, say: `${fmt(a)}° is the angle; the question asks for x.` }], ok, 'Set 2x + 6 equal to half the arc, then solve.');
});

// ---------- chords and secants ----------
export const chordChord: Gen = (R, n) => fitted('chordChord', () => {
  const kind = pick(R, ['angle', 'angle', 'arc', 'adj'] as const);
  const arcs = splitArcs(R, 4, 40, 140);
  if ((arcs[0]! + arcs[2]!) % 2) throw new Error('odd');
  const [A, B, C, D] = placeCcw(r(R, 0, 359), arcs);
  const on = { A: A!, B: B!, C: C!, D: D! };
  const E = cross(mul(dirv(A!), R0), mul(dirv(C!), R0), mul(dirv(B!), R0), mul(dirv(D!), R0));
  const x = (arcs[0]! + arcs[2]!) / 2;
  const arcSp: ArcSpec[] = [{ from: 'A', to: 'B', col: 'first', text: dg(arcs[0]!) }, { from: 'C', to: 'D', col: 'second', text: kind === 'arc' ? '?' : dg(arcs[2]!), alt: kind === 'arc' ? dg(arcs[2]!) : undefined }];
  const ang: AngSpec = kind === 'adj' ? { id: 'BEC', col: 'link', text: '?', alt: dg(180 - x), r: 50 } : { id: 'AEB', col: kind === 'arc' ? 'pick' : 'link', text: kind === 'arc' ? dg(x) : '?', alt: kind === 'arc' ? undefined : dg(x), r: 50 };
  const fig = cfig({ center: null, on, pts: { E }, segs: ['AC', 'BD'], angles: [ang], arcs: arcSp });
  const intro = 'Chords AC and BD of one circle meet at E.';
  const base = { id: `chordChord-${n}`, family: 'chordChord', picture: { cfig: fig, reveal: { solved: [kind === 'arc' ? 'CD' : kind === 'adj' ? 'BEC' : 'AEB'] } } };
  if (kind === 'angle') return numQ(t0(R), { ...base, prompt: `${intro} ${mArc('AB')} = ${arcs[0]}° and ${mArc('CD')} = ${arcs[2]}°. What is ${mA('AEB')}?`, board: 'm\\angle AEB = \\tfrac{1}{2}(m\\overparen{AB} + m\\overparen{CD})', unit: '°', solution: ['∠AEB and its vertical angle ∠CED intercept arcs AB and CD.', `Half the sum: (${arcs[0]}° + ${arcs[2]}°) ÷ 2 = ${S(fmt(x))}°.`] },
    x, [{ v: arcs[0]! + arcs[2]!, mc: MC.notHalved, say: 'Add the two arcs, then HALVE.' }, { v: arcs[0]! / 2, mc: MC.firstArc, say: 'The vertex is inside, not on the circle: use BOTH arcs, the one of the angle and the one of its vertical angle.' }, { v: 180 - x, mc: MC.wrongAngle, say: 'That is the neighbouring angle ∠BEC; ∠AEB opens onto arc AB.' }], ok, 'Two chords inside: half the sum of the two intercepted arcs.');
  if (kind === 'arc') return numQ(t0(R), { ...base, prompt: `${intro} ${mA('AEB')} = ${fmt(x)}° and ${mArc('AB')} = ${arcs[0]}°. What is ${mArc('CD')}?`, board: `${fmt(x)} = \\tfrac{1}{2}(${arcs[0]} + m\\overparen{CD})`, unit: '°', solution: [`Half the sum: ${fmt(x)} = (${arcs[0]} + arc CD) ÷ 2.`, `So ${arcs[0]} + arc CD = ${2 * x}, and arc CD = ${S(arcs[2]!)}°.`] },
    arcs[2]!, [{ v: x - arcs[0]!, mc: MC.notHalved, say: 'Double the angle first: the arcs add to twice the angle.' }, { v: 2 * x, mc: MC.firstArc, say: 'Twice the angle is the SUM of both arcs; subtract arc AB.' }], ok, 'Double the angle, then subtract the known arc.');
  return numQ(t0(R), { ...base, prompt: `${intro} ${mArc('AB')} = ${arcs[0]}° and ${mArc('CD')} = ${arcs[2]}°. What is ${mA('BEC')}?`, board: 'm\\angle BEC = 180^\\circ - m\\angle AEB', unit: '°', solution: [`m∠AEB = (${arcs[0]}° + ${arcs[2]}°) ÷ 2 = ${fmt(x)}°.`, `∠BEC is its neighbour on a line: 180° − ${fmt(x)}° = ${S(fmt(180 - x))}°.`] },
    180 - x, [{ v: x, mc: MC.wrongAngle, say: 'Arcs AB and CD belong to ∠AEB; ∠BEC is the neighbouring angle, supplementary to it.' }, { v: arcs[0]! + arcs[2]!, mc: MC.notHalved, say: 'Find ∠AEB (half the sum), then its supplement.' }], ok, 'Find ∠AEB, then use the linear pair.');
});
/** two secants P-A-D and P-B-C (near arc AB, far arc CD) */
function secSecConf(R: () => number) {
  for (let t = 0; t < 400; t++) {
    const near = r(R, 24, 80), far = near + 2 * r(R, 20, 60), s1 = r(R, 40, 140), s2 = 360 - near - far - s1;
    if (s2 < 40 || far >= 180) continue;   // a two-letter arc name is the minor arc
    const [A, B, C, D] = placeCcw(r(R, 0, 359), [near, s1, far, s2]);
    const P = cross(mul(dirv(A!), R0), mul(dirv(D!), R0), mul(dirv(B!), R0), mul(dirv(C!), R0));
    const dP = dist(P, [0, 0]);
    if (dP < R0 * 1.3 || dP > R0 * 2.5) continue;
    return { on: { A: A!, B: B!, C: C!, D: D! }, P, near, far };
  }
  throw new Error('secSec');
}
export const exteriorAngle: Gen = (R, n) => fitted('exteriorAngle', () => {
  const kind = pick(R, ['ss', 'st', 'tt'] as const), askArc = kind !== 'tt' && R() < 0.35;
  let spec: CSpec, near: number, farA: number, nearN: string, farN: string, angId: string, desc: string;
  if (kind === 'ss') {
    const c = secSecConf(R);
    near = c.near; farA = c.far; nearN = 'AB'; farN = 'CD'; angId = 'APB';
    spec = { center: null, on: c.on, pts: { P: c.P }, segs: ['PD', 'PC'], arcs: [{ from: 'A', to: 'B', col: 'first', text: dg(near) }, { from: 'C', to: 'D', col: 'second', text: askArc ? '?' : dg(farA), alt: askArc ? dg(farA) : undefined }] };
    desc = 'Secants PAD and PBC meet at P outside the circle.';
  } else if (kind === 'st') {
    const c = tanSecConf(R, { near: [30, 90], maxFar: 178 });
    if ((c.far - c.near) % 2) throw new Error('odd');
    near = c.near; farA = c.far; nearN = 'TA'; farN = 'TB'; angId = 'TPB';
    spec = { center: null, on: { T: c.T, A: c.A, B: c.B }, pts: { P: c.P }, segs: ['PB', { id: 'PT', kind: 'line', ext: [0, R0 * 0.45], col: 'ink' }], arcs: [{ from: 'T', to: 'A', col: 'first', text: dg(near) }, { from: 'B', to: 'T', col: 'second', text: askArc ? '?' : dg(farA), alt: askArc ? dg(farA) : undefined }] };
    desc = 'Line PT is tangent to the circle at T; secant PAB crosses it at A and B.';
  } else {
    const m = r(R, 60, 160), th = r(R, 0, 359), P = tanMeet(th, th + m);
    if (dist(P, [0, 0]) > R0 * 2.5) throw new Error('far');
    near = m; farA = 360 - m; nearN = 'AB'; farN = 'ACB'; angId = 'APB';
    spec = { center: null, on: { A: th, B: th + m, C: th + m + (360 - m) / 2 }, pts: { P }, segs: ['PA', 'PB'], arcs: [{ from: 'A', to: 'B', col: 'first', text: dg(m) }] };
    desc = 'PA and PB are tangent to the circle at A and B; C is on the major arc.';
  }
  const x = (farA - near) / 2;
  spec.angles = [{ id: angId, col: askArc ? 'pick' : 'link', text: askArc ? dg(x) : '?', alt: askArc ? undefined : dg(x), r: 60 }];
  const fig = cfig(spec);
  const base = { id: `exteriorAngle-${n}`, family: 'exteriorAngle', picture: { cfig: fig, reveal: { solved: [askArc ? (kind === 'ss' ? 'CD' : 'BT') : angId] } } };
  if (askArc) return numQ(t0(R), { ...base, prompt: `${desc} ${mA(angId)} = ${fmt(x)}° and ${mArc(nearN)} = ${near}° (the near arc). What is ${mArc(farN)}, the far arc?`, board: `${fmt(x)} = \\tfrac{1}{2}(m\\overparen{${farN}} - ${near})`, unit: '°', solution: [`Outside the circle: angle = ½(far arc − near arc), so far − ${near} = 2 × ${fmt(x)} = ${2 * x}.`, `Far arc = ${2 * x} + ${near} = ${S(farA)}°.`] },
    farA, [{ v: 2 * x - near, mc: MC.interiorRule, say: 'Outside the circle it is the DIFFERENCE of the arcs, not the sum: add the near arc back.' }, { v: x + near, mc: MC.notHalved, say: 'Double the angle first: far − near = 2 × angle.' }], ok, 'Far arc = 2 × angle + near arc.');
  return numQ(t0(R), { ...base, prompt: `${desc} ${kind === 'tt' ? `${mArc('AB')} = ${near}°` : `${mArc(nearN)} = ${near}° and ${mArc(farN)} = ${farA}°`}. What is ${mA(angId)}?`, board: `m\\angle ${angId} = \\tfrac{1}{2}(m\\overparen{${farN}} - m\\overparen{${nearN}})`, unit: '°',
    solution: [kind === 'tt' ? `The far arc is the major arc: 360° − ${near}° = ${farA}°.` : `The angle at P intercepts the far arc ${farN} and the near arc ${nearN}.`, `Half the difference: (${farA}° − ${near}°) ÷ 2 = ${S(fmt(x))}°${kind === 'tt' ? ` (check: 180° − ${near}° = ${180 - near}°)` : ''}.`] },
    x, [{ v: (farA + near) / 2, mc: MC.interiorRule, say: 'The vertex is OUTSIDE the circle: half the DIFFERENCE (half the sum is for chords meeting inside).' }, { v: farA - near, mc: MC.notHalved, say: 'Subtract, then halve.' }, { v: (near - farA) / 2, mc: MC.nearFar, say: 'Far arc minus near arc: the angle is positive.' }, ...(kind === 'tt' ? [{ v: near / 2, mc: MC.inscribedOff, say: 'P is outside: half the difference of the arcs (180° − the minor arc).' }] : [])], ok, 'Outside the circle: half (far arc − near arc).');
});

// ---------- the radius isosceles triangle ----------
export const radiusIso: Gen = (R, n) => fitted('radiusIso', () => {
  const toCentral = R() < 0.5;
  const c = 2 * r(R, 20, 75), b = (180 - c) / 2, th = r(R, 0, 359);
  const fig = cfig({ center: 'O', on: { A: th, B: th + c }, segs: ['OA', 'OB', 'AB'],
    angles: toCentral ? [{ id: 'OAB', col: 'first', text: dg(b), r: 62 }, { id: 'AOB', col: 'link', text: '?', alt: dg(c), r: 50 }] : [{ id: 'AOB', col: 'first', text: dg(c), r: 50 }, { id: 'OBA', col: 'link', text: '?', alt: dg(b), r: 62 }] });
  return toCentral
    ? numQ(t0(R), { id: `radiusIso-${n}`, family: 'radiusIso', prompt: `O is the center of the circle; A and B lie on it. ${mA('OAB')} = ${b}°. What is ${mA('AOB')}?`, board: 'm\\angle AOB = 180^\\circ - 2\\,m\\angle OAB', unit: '°',
      solution: ['OA and OB are radii, so OA = OB: △OAB is isosceles (no tick marks needed).', `Base angles: m∠OBA = ${b}° too. ${mA('AOB')} = 180° − 2 × ${b}° = ${S(c)}°.`], picture: { cfig: fig, reveal: { solved: ['AOB'] } } },
      c, [{ v: 180 - b, mc: MC.onlyMarked, say: 'OA = OB (both radii), so ∠OBA is ALSO ' + b + '°: subtract both base angles.' }, { v: 2 * b, say: 'The angle sum is 180°: subtract the two base angles from 180°.' }, { v: b, say: 'Two radii make △OAB isosceles: m∠OBA = ' + b + '° too.' }], ok, 'Two radii: isosceles triangle, equal base angles.')
    : numQ(t0(R), { id: `radiusIso-${n}`, family: 'radiusIso', prompt: `O is the center of the circle; A and B lie on it. ${mA('AOB')} = ${c}°. What is ${mA('OBA')}?`, board: 'm\\angle OBA = \\tfrac{1}{2}(180^\\circ - m\\angle AOB)', unit: '°',
      solution: ['OA = OB (radii): △OAB is isosceles with equal base angles at A and B.', `(180° − ${c}°) ÷ 2 = ${S(b)}°.`], picture: { cfig: fig, reveal: { solved: ['OBA'] } } },
      b, [{ v: 180 - c, mc: MC.onlyMarked, say: 'Two base angles share what is left: halve it.' }, { v: c / 2, mc: MC.wrongAngle, say: 'Half the central angle is an inscribed angle on arc AB, not ∠OBA.' }], ok, 'Base angles: (180° − apex) ÷ 2.');
});

// ---------- algebra ----------
export const algebra: Gen = (R, n) => fitted('algebra', () => {
  const kind = pick(R, ['ins', 'cyc', 'circ', 'semi'] as const);
  const th = r(R, 0, 359);
  if (kind === 'ins') {
    const a = r(R, 2, 5), x0 = r(R, 4, 18), b = r(R, -8, 12), ang = a * x0 + b;
    if (ang < 20 || ang > 80) throw new Error('range');
    const m = 2 * ang, C = th + m + r(R, 40, 360 - m - 40);
    const fig = cfig({ center: null, on: { A: th, B: th + m, C }, segs: ['CA', 'CB'], angles: [{ id: 'ACB', col: 'second', text: `(${lin(a, b)})°`, r: 64 }], arcs: [{ from: 'A', to: 'B', col: 'first', text: dg(m) }] });
    const wr = (m - b) / a;
    return numQ(t0(R), { id: `algebra-${n}`, family: 'algebra', prompt: `A, B and C lie on a circle. ${mA('ACB')} = (${lin(a, b)})° and ${mArc('AB')} = ${m}°. What is x?`, board: `${linT(a, b)} = \\tfrac{1}{2}(${m})`, unit: '',
      solution: [`Inscribed angle = half its arc: ${lin(a, b)} = ${ang}.`, `${a}x = ${ang - b}, so x = ${S(x0)}.`], picture: { cfig: fig } },
      x0, [...(Number.isInteger(wr) ? [{ v: wr, mc: MC.fullArc, say: `The angle is HALF the arc: ${lin(a, b)} = ${ang}, not ${m}.` }] : []), { v: ang, mc: MC.reportsX, say: `${ang}° is the angle; the question asks for x.` }], ok, 'Write the relation as an equation, then solve for x.');
  }
  if (kind === 'circ') {
    const a = 2, x0 = r(R, 15, 45), b = r(R, -10, 20), p = a * x0 + b;
    if (p < 40 || p > 130) throw new Error('range');
    const c = 180 - p, P = tanMeet(th, th + c);
    if (dist(P, [0, 0]) > R0 * 2.5) throw new Error('far');
    const fig = cfig({ center: 'O', on: { A: th, B: th + c }, pts: { P }, segs: ['OA', 'OB', 'PA', 'PB'], angles: [{ id: 'AOB', col: 'first', text: dg(c), r: 50 }, { id: 'APB', col: 'second', text: `(${lin(a, b)})°`, r: 60 }] });
    return numQ(t0(R), { id: `algebra-${n}`, family: 'algebra', prompt: `PA and PB are tangent to circle O at A and B. ${mA('APB')} = (${lin(a, b)})° and ${mA('AOB')} = ${c}°. What is x?`, board: `${linT(a, b)} = 180 - ${c}`, unit: '',
      solution: [`Circumscribed angle = 180° − central angle: ${lin(a, b)} = ${p}.`, `2x = ${p - b}, so x = ${S(x0)}.`] , picture: { cfig: fig } },
      x0, [{ v: (c / 2 - b) / a, mc: MC.inscribedOff, say: 'P is outside: use 180° − ' + c + '°, not half of it.' }, { v: (c - b) / a, say: 'The two angles are supplementary, not equal.' }, { v: p, mc: MC.reportsX, say: `${p}° is the angle; the question asks for x.` }], ok, 'Circumscribed + central = 180°: solve for x.');
  }
  if (kind === 'cyc') {
    const q = quadFig(R);
    const [a1, a2] = [r(R, 2, 4), r(R, 2, 5)];
    const x0 = (q.ang.A! + q.ang.C! - 0);
    void x0;
    const xs = r(R, 8, 25), b1 = q.ang.A! - a1 * xs, b2 = q.ang.C! - a2 * xs;
    if (Math.abs(b1) > 40 || Math.abs(b2) > 40 || b1 === 0 && b2 === 0) throw new Error('b');
    const fig = cfig({ center: null, on: q.on, segs: ['AB', 'BC', 'CD', 'DA'], angles: [{ id: 'DAB', col: 'first', text: `(${lin(a1, b1)})°`, r: 58 }, { id: 'BCD', col: 'second', text: `(${lin(a2, b2)})°`, r: 58 }] });
    return numQ(t0(R), { id: `algebra-${n}`, family: 'algebra', prompt: `ABCD is inscribed in a circle. ${mA('DAB')} = (${lin(a1, b1)})° and ${mA('BCD')} = (${lin(a2, b2)})°. What is ${mA('DAB')}?`, board: `(${linT(a1, b1)}) + (${linT(a2, b2)}) = 180`, unit: '°',
      solution: [`Opposite angles are supplementary: ${a1 + a2}x ${b1 + b2 < 0 ? '−' : '+'} ${Math.abs(b1 + b2)} = 180, so x = ${xs}.`, `${mA('DAB')} = ${a1}(${xs}) ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${S(q.ang.A!)}°.`], picture: { cfig: fig } },
      q.ang.A!, [{ v: xs, mc: MC.reportsX, say: `x = ${xs}, but the question asks for m∠DAB: substitute back.` }, { v: q.ang.C!, mc: MC.wrongAngle, say: 'That is m∠BCD; the question asks for m∠DAB.' }], ok, 'Solve for x, then substitute to get the angle.');
  }
  // semicircle: AB diameter, ∠CAB + ∠CBA = 90
  const c = 2 * r(R, 20, 70), angA = c / 2, angB = (180 - c) / 2;
  const a1 = r(R, 2, 4), a2 = r(R, 1, 3), xs = r(R, 4, 14), b1 = angA - a1 * xs, b2 = angB - a2 * xs;
  if (Math.abs(b1) > 30 || Math.abs(b2) > 30 || angA === angB) throw new Error('b');
  const fig = cfig({ center: 'O', on: { A: th, B: th + 180, C: th + 180 + c }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'CAB', col: 'first', text: `(${lin(a1, b1)})°`, r: 74 }, { id: 'ABC', col: 'second', text: `(${lin(a2, b2)})°`, r: 74 }] });
  return numQ(t0(R), { id: `algebra-${n}`, family: 'algebra', prompt: `AB is a diameter of circle O, and C is on the circle. ${mA('CAB')} = (${lin(a1, b1)})° and ${mA('ABC')} = (${lin(a2, b2)})°. What is ${mA('ABC')}?`, board: `(${linT(a1, b1)}) + (${linT(a2, b2)}) = 90`, unit: '°',
    solution: [`∠ACB = 90° (semicircle), so the other two add to 90°: ${a1 + a2}x ${b1 + b2 < 0 ? '−' : '+'} ${Math.abs(b1 + b2)} = 90, x = ${xs}.`, `${mA('ABC')} = ${a2 === 1 ? '' : a2}(${xs}) ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)} = ${S(angB)}°.`], picture: { cfig: fig } },
    angB, [{ v: xs, mc: MC.reportsX, say: `x = ${xs}; substitute to get m∠ABC.` }, { v: angA, mc: MC.wrongAngle, say: 'That is m∠CAB.' }, ...(Number.isInteger((180 - b1 - b2) / (a1 + a2)) ? [{ v: a2 * ((180 - b1 - b2) / (a1 + a2)) + b2, mc: MC.rightWrongV, say: 'The right angle is at C, so the two angles at A and B add to 90°, not 180°.' }] : [])], ok, 'The angles at A and B add to 90°: solve, then substitute.');
});

// ---------- chases ----------
type Chase = { spec: CSpec; prompt: string; ask: string; a: number; wrong: NumWrong[]; sol: string[]; board: string };
function chaseOf(R: () => number, k: string): Chase {
  const th = r(R, 0, 359);
  if (k === 'isoIns') {
    const c = 2 * r(R, 25, 75), b = (180 - c) / 2, C = th + c + r(R, 50, 360 - c - 50);
    return { spec: { center: 'O', on: { A: th, B: th + c, C }, segs: ['OA', 'OB', 'AB', 'CA', 'CB'], angles: [{ id: 'OAB', col: 'first', text: dg(b), r: 66 }, { id: 'ACB', col: 'link', text: '?', alt: dg(c / 2), r: 60 }] },
      prompt: `O is the center; A, B and C lie on the circle. ${mA('OAB')} = ${b}°. What is ${mA('ACB')}?`, ask: 'ACB', a: c / 2, board: 'm\\angle ACB',
      wrong: [{ v: c, mc: MC.fullArc, say: `${c}° is the central angle AOB; the inscribed angle is half of it.` }, { v: b, say: 'Use the isosceles triangle OAB first, then the inscribed angle.' }, { v: 180 - b, mc: MC.onlyMarked, say: 'OA = OB, so m∠OBA = ' + b + '° too.' }],
      sol: [`OA = OB (radii), so m∠OBA = ${b}°.`, `m∠AOB = 180° − 2(${b}°) = ${c}°.`, `∠ACB is inscribed on the same arc: ${S(c / 2)}°.`] };
  }
  if (k === 'diamArc') {
    const c = 2 * r(R, 18, 72), a = c / 2;   // C at B + c: ∠CAB = c/2, ∠ABC = 90 − c/2, arc AC (not B) = 180 − c
    if (c === 90) throw new Error('iso');
    // A = th, B = th + 180, C = th + 180 + c: arc BC (ccw B->C) = c, arc CA = 180 - c
    return { spec: { center: 'O', on: { A: th, B: th + 180, C: th + 180 + c }, segs: ['AB', 'CA', 'CB'], angles: [{ id: 'CAB', col: 'first', text: dg(a), r: 72 }], arcs: [{ from: 'C', to: 'A', col: 'link', text: '?', alt: dg(180 - c) }] },
      prompt: `AB is a diameter of circle O, and C is on the circle. ${mA('CAB')} = ${a}°. What is ${mArc('AC')}?`, ask: 'CA', a: 180 - c, board: 'm\\overparen{AC}',
      wrong: [{ v: 90 - a, mc: MC.fullArc, say: `${90 - a}° is ∠ABC; the arc it intercepts is twice that.` }, { v: 2 * a, mc: MC.wrongArc, say: `${2 * a}° is arc BC, the arc ∠CAB intercepts; arc AC is opposite ∠ABC.` }, { v: 180 - a, say: 'The right angle is at C: the angles at A and B add to 90°.' }],
      sol: ['AB is a diameter: m∠ACB = 90°.', `m∠ABC = 90° − ${a}° = ${90 - a}°.`, `∠ABC intercepts arc AC: ${mArc('AC')} = 2 × ${90 - a}° = ${S(180 - c)}°.`] };
  }
  if (k === 'tanCentral' || k === 'tanIso') {
    const m = 2 * r(R, 25, 75), t = m / 2, Q = add(mul(dirv(th), R0), mul(dirv(th + 90), R0 * 0.75));
    const iso = k === 'tanIso';
    return { spec: { center: 'O', on: { A: th, B: th + m }, pts: { Q }, segs: ['AB', 'OA', 'OB', { id: 'AQ', kind: 'line', ext: [R0 * 0.7, R0 * 0.1], col: 'ink' }], angles: [{ id: 'BAQ', col: 'first', text: dg(t), r: 70 }, iso ? { id: 'OBA', col: 'link', text: '?', alt: dg(90 - t), r: 56 } : { id: 'AOB', col: 'link', text: '?', alt: dg(m), r: 48 }] },
      prompt: `Line AQ is tangent to circle O at A, and B is on the circle. ${mA('BAQ')} = ${t}°. What is ${mA(iso ? 'OBA' : 'AOB')}?`, ask: iso ? 'OBA' : 'AOB', a: iso ? 90 - t : m, board: iso ? 'm\\angle OBA' : 'm\\angle AOB',
      wrong: iso ? [{ v: t, say: 'Find the central angle first: arc AB = 2 × ' + t + '°.' }, { v: m, mc: MC.wrongAngle, say: `${m}° is ∠AOB; the base angles share 180° − ${m}°.` }, { v: 180 - m, mc: MC.onlyMarked, say: 'OA = OB: the two base angles split what is left.' }]
        : [{ v: t, mc: MC.fullArc, say: 'The tangent-chord angle is HALF its arc; the central angle equals the arc.' }, { v: 90 - t, mc: MC.lastMethod, say: `${90 - t}° is the base angle OAB; the question asks for the central angle.` }, { v: 180 - m, say: 'Arc AB = twice the tangent-chord angle, and the central angle equals it.' }],
      sol: iso ? [`Tangent-chord: ${mArc('AB')} = 2 × ${t}° = ${m}°, so m∠AOB = ${m}°.`, 'OA = OB (radii): △OAB is isosceles.', `${mA('OBA')} = (180° − ${m}°) ÷ 2 = ${S(90 - t)}°.`] : [`Tangent-chord: ${mArc('AB')} = 2 × ${t}° = ${m}°.`, `The central angle equals its arc: ${mA('AOB')} = ${S(m)}°.`] };
  }
  if (k === 'isoCyc') {
    const c = 2 * r(R, 25, 70), b = (180 - c) / 2, C = th + c + r(R, 50, 360 - c - 50), D = th + r(R, 22, c - 22);
    return { spec: { center: 'O', on: { A: th, B: th + c, C, D }, segs: ['OA', 'OB', 'AB', 'CA', 'CB', 'DA', 'DB'], angles: [{ id: 'OAB', col: 'first', text: dg(b), r: 66 }, { id: 'ADB', col: 'link', text: '?', alt: dg(90 + b), r: 42 }] },
      prompt: `O is the center; A, B, C and D lie on the circle, with D on the minor ${arcN('AB')}. ${mA('OAB')} = ${b}°. What is ${mA('ADB')}?`, ask: 'ADB', a: 90 + b, board: 'm\\angle ADB',
      wrong: [{ v: 90 - b, mc: MC.eitherSide, say: 'D is on the minor arc AB, opposite C: ∠ADB is supplementary to ∠ACB, not equal.' }, { v: c, mc: MC.fullArc, say: `${c}° is the central angle.` }, { v: 180 - c / 2 - b, say: 'Chain it: central angle, inscribed ∠ACB, then the inscribed quadrilateral ACBD.' }],
      sol: [`OA = OB: m∠AOB = 180° − 2(${b}°) = ${c}°.`, `∠ACB is inscribed on arc AB: ${c / 2}°.`, `ACBD is inscribed, so ∠ADB = 180° − ${c / 2}° = ${S(90 + b)}°.`] };
  }
  // diamTan: AB diameter, tangent at B, C on the circle; ∠CAB = a -> angle between chord BC and the tangent = a
  const c = 2 * r(R, 18, 72), a = c / 2;
  if (c === 90) throw new Error('iso');
  const B = th + 180, Q = add(mul(dirv(B), R0), mul(dirv(B + 90), R0 * 0.75));
  return { spec: { center: 'O', on: { A: th, B, C: B + c }, pts: { Q }, segs: ['AB', 'CA', 'CB', { id: 'BQ', kind: 'line', ext: [R0 * 0.75, R0 * 0.1], col: 'ink' }], angles: [{ id: 'CAB', col: 'first', text: dg(a), r: 72 }, { id: 'CBQ', col: 'link', text: '?', alt: dg(c / 2), r: 62 }] },
    prompt: `AB is a diameter of circle O; line BQ is tangent to the circle at B; C is on the circle. ${mA('CAB')} = ${a}°. What is ${mA('CBQ')}?`, ask: 'CBQ', a: c / 2, board: 'm\\angle CBQ',
    wrong: [{ v: 90 - c / 2, mc: MC.lastMethod, say: `${90 - c / 2}° is ∠ABC; ∠CBQ is the rest of the right angle ABQ.` }, { v: 90, mc: MC.rightAtP, say: 'The right angle is ∠ABQ (diameter ⊥ tangent); ∠CBQ is only part of it.' }],
    sol: ['AB is a diameter, so ∠ACB = 90°, and m∠ABC = 90° − ' + a + '° = ' + (90 - a) + '°.', 'The tangent is perpendicular to radius OB: m∠ABQ = 90°.', `${mA('CBQ')} = 90° − ${90 - a}° = ${S(c / 2)}°.`] };
}
function chaseItem(R: () => number, n: number, fam: string, kinds: string[]): CItem {
  return fitted(fam, () => {
    const ch = chaseOf(R, pick(R, kinds));
    const fig = cfig(ch.spec);
    return numQ(t0(R), { id: `${fam}-${n}`, family: fam, prompt: ch.prompt, board: ch.board, unit: '°', solution: ch.sol, picture: { cfig: fig, reveal: { solved: [ch.ask] } } }, ch.a, ch.wrong, ok, 'Chain the relations one at a time: which fact does each given unlock?');
  });
}
export const chase2: Gen = (R, n) => chaseItem(R, n, 'chase2', ['isoIns', 'diamArc', 'tanCentral']);
export const chase3: Gen = (R, n) => chaseItem(R, n, 'chase3', ['tanIso', 'isoCyc', 'diamTan']);
export { chaseOf, quadFig, secSecConf, tanMeet };
void choose;
