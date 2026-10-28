// famB.ts: stage 2 of "Midsegments and points of concurrency": the midsegment theorem (parallel: angles; half:
// lengths, perimeters, equations), medians and angle bisectors as measure equations, the centroid's 2:1 split,
// angle chains with altitudes and bisectors, equidistance distances (with the Pythagorean theorem), the two circle
// constructions, mixed selection with "not enough information". Labelled lengths and angles are drawn at their size.
import type { Fig, GSeg, Pt } from '../geometry-foundations/geo';
import { dist, measure } from '../geometry-foundations/geo';
import { circleSegs, triASA, turnT } from '../triangle-congruence/tri';
import { letters } from '../constructions/ckit';
import { type Kind, type Tri, altitudeFoot, angles, bisectorFoot, centroidOf, circumcenterOf, footOf, incenterOf, kindOf, lerpP, makeTri, mid, sideMid, triFromSides, valid3 } from './centers';
import { ptsOf, special } from './tfigs';
import { circumCons, inCons } from './consTC';
import { incircleSetup } from './famA';
import { type Gen, type NumWrong, type Opt, type TCItem, MC, albl, arc, box, choice, choiceT, fig, fitted, lbl, lin, linT, numT, pick, r, relabel, segN, shuffle, tick } from './tkit';

const tri = (s: string) => `△${s}`;
const ri = r;
const dec1 = (R: () => number, lo: number, hi: number) => ri(R, lo * 10, hi * 10) / 10;
const f1 = (x: number) => String(Math.round(x * 100) / 100);
/** a scalene triangle with the angle at vertex 0 equal to a (whole degrees), turned */
function triA(R: () => number, a: number, o: { acute?: boolean } = {}): Tri {
  for (let t = 0; t < 200; t++) {
    const b = ri(R, 30, 100), c = 180 - a - b;
    if (c < 30 || Math.abs(b - c) < 10 || Math.abs(a - b) < 6 || Math.abs(a - c) < 6) continue;
    if (o.acute && (b >= 88 || c >= 88 || a >= 88)) continue;
    return turnT(triASA(a, 340, b), ri(R, 0, 359));
  }
  return turnT(triASA(a, 340, (180 - a) / 2 + 12), 0);
}

// ---------- the midsegment figure: D, E midpoints of AB, AC ----------
function midFig(T: Tri, o: { marks?: ReturnType<typeof lbl>[]; style?: Record<string, Partial<GSeg>>; extraSegs?: string[]; extraPts?: Record<string, Pt> } = {}): Fig {
  const [A, B, C] = T, D = mid(A, B), E = mid(A, C);
  const f = fig({ pts: { A, B, C, D, E, ...(o.extraPts ?? {}) }, segs: ['AD', 'DB', 'AE', 'EC', 'BC', 'DE', ...(o.extraSegs ?? [])], marks: [tick('AD', 1), tick('DB', 1), tick('AE', 2), tick('EC', 2), ...(o.marks ?? [])], segStyle: o.style ?? {}, body: 'ABC' });
  // a label on DE sits between DE and BC (roomy); a label on BC sits outside, away from A
  const sideTo = (a: Pt, b: Pt, x: Pt): 1 | -1 => ((b[0] - a[0]) * (x[1] - a[1]) - (b[1] - a[1]) * (x[0] - a[0]) > 0 ? 1 : -1);
  f.segs = f.segs.map(g => (g.id === 'DE' ? { ...g, side: sideTo(g.a, g.b, mid(B, C)) } : g.id === 'BC' ? { ...g, side: (-sideTo(g.a, g.b, A)) as 1 | -1 } : g));
  return f;
}

// ---------- s2-midsegment-parallel-angles ----------
export const midsegAngle: Gen = (R, n) => fitted('midsegAngle', () => {
  const v = pick(R, ['corrB', 'corrC', 'cons', 'alt'] as const);
  const T = makeTri(R, R() < 0.75 ? 'acute' : 'obtuse', { at: 0, lo: 100, hi: 116 });
  const [aA, aB, aC] = angles(T).map(Math.round) as [number, number, number];
  const t = relabel(R, 'ABCDE');
  if (v === 'alt') {
    const E = mid(T[0], T[2]);
    const x = Math.round(measure(T[1], E, T[2]) * 1000) / 1000;
    if (Math.abs(x - Math.round(x)) > 1e-6) {
      // make ∠EBC whole: rebuild until it is (rare); otherwise use the corresponding case
      return midsegAngleCorr(R, n, T, 'B', aB, t);
    }
    const f = midFig(T, { extraSegs: ['BE'], marks: [albl('EBC', `${Math.round(x)}°`), { ang: 'DEB', text: '?', lone: true }] });
    f.angles = f.angles.map(a => (a.id === 'DEB' ? { ...a, alt: `${Math.round(x)}°` } : a));
    return numT(t, {
      id: `midsegAngle-${n}`, family: 'midsegAngle', prompt: `D and E are the midpoints of ${segN('AB')} and ${segN('AC')}. m∠EBC = ${Math.round(x)}°. Find m∠DEB.`, board: `m\\angle EBC = ${Math.round(x)}^\\circ,\\ m\\angle DEB = \\,?`, unit: '°',
      solution: ['DE is a midsegment, so DE ∥ BC (the side it does not touch).', 'BE crosses the parallel lines: ∠DEB and ∠EBC are alternate interior angles.', `So m∠DEB = <b class="s">${Math.round(x)}</b>°.`],
      picture: { fig: f, reveal: { solved: ['DEB'] } },
    }, Math.round(x), [{ v: 180 - Math.round(x), say: 'Alternate interior angles are congruent, not supplementary.' }], 'Right: alternate interior angles.', 'DE ∥ BC; look for the angle pair the transversal BE makes.');
  }
  if (v === 'cons') {
    const f = midFig(T, { marks: [albl('DBC', `${aB}°`), { ang: 'BDE', text: '?', lone: true }] });
    f.angles = f.angles.map(a => (a.id === 'BDE' ? { ...a, alt: `${180 - aB}°` } : a));
    return numT(t, {
      id: `midsegAngle-${n}`, family: 'midsegAngle', prompt: `D and E are the midpoints of ${segN('AB')} and ${segN('AC')}. m∠ABC = ${aB}°. Find m∠BDE.`, board: `m\\angle ABC = ${aB}^\\circ,\\ m\\angle BDE = \\,?`, unit: '°',
      solution: ['DE is a midsegment, so DE ∥ BC.', 'Along AB, ∠BDE and ∠DBC are consecutive interior angles: they add to 180°.', `So m∠BDE = 180° − ${aB}° = <b class="s">${180 - aB}</b>°.`],
      picture: { fig: f, reveal: { solved: ['BDE'] } },
    }, 180 - aB, [{ v: aB, say: 'Those are consecutive interior angles (same side, between the parallels): they add to 180°.' }], 'Right: consecutive interior angles are supplementary.', 'DE ∥ BC. Which angle pair do ∠BDE and ∠ABC form along AB?');
  }
  return midsegAngleCorr(R, n, T, v === 'corrB' ? 'B' : 'C', v === 'corrB' ? aB : aC, t, aA);
});
function midsegAngleCorr(R: () => number, n: number, T: Tri, at: 'B' | 'C', x: number, t: (s: string) => string, other?: number): TCItem {
  void R; void other;
  const known = at === 'B' ? 'DBC' : 'ECB', ask = at === 'B' ? 'ADE' : 'AED';
  const f = midFig(T, { marks: [albl(known, `${x}°`), { ang: ask, text: '?', lone: true }] });
  f.angles = f.angles.map(a => (a.id === ask ? { ...a, alt: `${x}°` } : a));
  const nm = at === 'B' ? 'ABC' : 'ACB', anm = at === 'B' ? 'ADE' : 'AED';
  return numT(t, {
    id: `midsegAngle-${n}`, family: 'midsegAngle', prompt: `D and E are the midpoints of ${segN('AB')} and ${segN('AC')}. m∠${nm} = ${x}°. Find m∠${anm}.`, board: `m\\angle ${nm} = ${x}^\\circ,\\ m\\angle ${anm} = \\,?`, unit: '°',
    solution: ['DE is a midsegment, so DE ∥ BC (the side it does not touch).', `∠${anm} and ∠${nm} are corresponding angles along ${at === 'B' ? 'AB' : 'AC'}.`, `So m∠${anm} = <b class="s">${x}</b>°.`],
    picture: { fig: f, reveal: { solved: [ask] } },
  }, x, [{ v: 180 - x, say: 'Corresponding angles are congruent, not supplementary.' }], 'Right: corresponding angles.', 'DE ∥ BC. Find the angle pair along the side.');
}
export const midsegParallel: Gen = (R, n) => fitted('midsegParallel', () => {
  const T = makeTri(R, pick(R, ['acute', 'obtuse', 'right'] as Kind[]), { at: ri(R, 0, 2), lo: 100, hi: 115 });
  const [A, B, C] = T, D = sideMid(T, 0), E = sideMid(T, 1), F = sideMid(T, 2);   // D on BC, E on CA, F on AB
  const f = fig({ pts: { A, B, C, D, E, F }, segs: ['BD', 'DC', 'CE', 'EA', 'AF', 'FB', 'DE', 'EF', 'FD'], marks: [tick('BD', 1), tick('DC', 1), tick('CE', 2), tick('EA', 2), tick('AF', 3), tick('FB', 3)], body: 'ABC' });
  const which = pick(R, [['EF', 'BC'], ['FD', 'CA'], ['DE', 'AB']] as const);
  const t = relabel(R, 'ABCDEF');
  return choiceT(R, t, {
    id: `midsegParallel-${n}`, family: 'midsegParallel', prompt: `D, E and F are the midpoints of the sides. ${segN(which[0])} is parallel to which side of ${tri('ABC')}?`, board: `\\overline{${which[0]}} \\parallel \\,?`,
    solution: [`${which[0]} joins the midpoints of two sides.`, 'A midsegment is parallel to the third side, the one it does not touch.', `So: ${segN(which[1])}.`],
    picture: { fig: f, reveal: { glow: [which[0]] } },
  }, (['AB', 'BC', 'CA'] as const).map(s => ({ t: segN(s), ok: s === which[1], mc: s === which[1] ? undefined : MC.parWrong, say: s === which[1] ? 'Right: the side it does not touch.' : `${which[0]} touches ${s}; it is parallel to the third side.` })));
});

// ---------- s2-midsegment-length ----------
const UNITS = ['cm', 'in', 'ft', 'm'] as const;
export const midsegLen: Gen = (R, n) => fitted('midsegLen', () => {
  const up = R() < 0.45, decimal = R() < 0.35, u = pick(R, UNITS);
  const v = decimal ? dec1(R, 6, 30) : ri(R, 8, 44);                     // the given length
  const BC = up ? 2 * v : v;
  const AB = ri(R, Math.ceil(BC * 0.6), Math.floor(BC * 1.5));
  const AC = Math.round((AB + BC) * (0.55 + R() * 0.3));
  if (!valid3(BC, AC, AB) || Math.abs(AB - BC) < 2 || Math.abs(AC - AB) < 2 || Math.abs(AC - BC) < 2 || AB === 2 * v || AB / 2 === (up ? BC : v / 2)) throw new Error('triangle');
  const T = triFromSides(BC, AC, AB, ri(R, 0, 359));
  const ans = up ? BC : v / 2;
  const f = midFig(T, {
    marks: [{ seg: 'DE', text: up ? `${f1(v)} ${u}` : '?', lone: true }, { seg: 'BC', text: up ? '?' : `${f1(v)} ${u}`, lone: true }],
    style: { [up ? 'BC' : 'DE']: { alt: `${f1(ans)} ${u}`, text: '?' } },
  });
  // AB is split at D: its length goes in the words
  const t = relabel(R, 'ABCDE');
  const wrong: NumWrong[] = [{ v: AB / 2, mc: MC.halvesTouched, say: `AB is a side DE touches. DE is half of the side it does NOT touch, BC.` }];
  if (up) wrong.push({ v: v / 2, mc: MC.halfMis, say: 'BC is the longer one: it is TWICE the midsegment.' }, { v, mc: MC.midEqPar, say: 'The midsegment is half of BC, not equal to it.' });
  else wrong.push({ v: 2 * v, mc: MC.halfMis, say: 'The midsegment is HALF of the third side.' }, { v, mc: MC.midEqPar, say: 'The midsegment is half of BC, not equal to it.' });
  return numT(t, {
    id: `midsegLen-${n}`, family: 'midsegLen', prompt: `D and E are the midpoints of ${segN('AB')} and ${segN('AC')}. AB = ${AB} ${u} and ${up ? `DE = ${f1(v)}` : `BC = ${f1(v)}`} ${u}. Find ${up ? 'BC' : 'DE'}.`, board: up ? `DE = ${f1(v)},\\ BC = \\,?` : `BC = ${f1(v)},\\ DE = \\,?`, unit: u,
    solution: ['DE joins the midpoints of AB and AC: a midsegment, half as long as the third side BC.', up ? `BC = 2 · ${f1(v)} = <b class="s">${f1(ans)}</b> ${u}.` : `DE = ${f1(v)} ÷ 2 = <b class="s">${f1(ans)}</b> ${u}.`],
    picture: { fig: f, reveal: { solved: [up ? 'BC' : 'DE'] } },
  }, ans, wrong, 'Right: the midsegment is half the third side.', 'DE is half of the side it does not touch.');
});
export const medialPerim: Gen = (R, n) => fitted('medialPerim', () => {
  const decimal = R() < 0.3;
  const a = decimal ? dec1(R, 6, 24) : ri(R, 6, 30), b = decimal ? dec1(R, 6, 24) : ri(R, 6, 30), c = decimal ? dec1(R, 6, 24) : ri(R, 6, 30);
  if (!valid3(a, b, c) || Math.abs(a - b) < 1.5 || Math.abs(b - c) < 1.5 || Math.abs(a - c) < 1.5) throw new Error('triangle');
  const u = pick(R, UNITS);
  const T = triFromSides(a, b, c, ri(R, 0, 359));
  const [A, B, C] = T, D = sideMid(T, 0), E = sideMid(T, 1), F = sideMid(T, 2);
  const f = fig({ pts: { A, B, C, D, E, F }, segs: ['BD', 'DC', 'CE', 'EA', 'AF', 'FB', 'DE', 'EF', 'FD'], marks: [tick('BD', 1), tick('DC', 1), tick('CE', 2), tick('EA', 2), tick('AF', 3), tick('FB', 3)], fills: [{ pts: 'ABC' }, { pts: 'DEF', col: 'second', alpha: 0.3 }] });
  const P = Math.round((a + b + c) * 10) / 10, ans = Math.round(P * 50) / 100;
  const t = relabel(R, 'ABCDEF');
  return numT(t, {
    id: `medialPerim-${n}`, family: 'medialPerim', prompt: `D, E and F are the midpoints of the sides of ${tri('ABC')}: BC = ${f1(a)} ${u}, CA = ${f1(b)} ${u}, AB = ${f1(c)} ${u}. Find the perimeter of ${tri('DEF')}.`, board: `BC = ${f1(a)},\\ CA = ${f1(b)},\\ AB = ${f1(c)}`, unit: u,
    solution: ['Each side of △DEF is a midsegment: half of the side of △ABC it is parallel to.', `So the perimeter is half of ${f1(a)} + ${f1(b)} + ${f1(c)} = ${f1(P)}.`, `Perimeter of △DEF = <b class="s">${f1(ans)}</b> ${u}.`],
    picture: { fig: f, reveal: {} },
  }, ans, [{ v: P, mc: MC.midEqPar, say: 'That is the perimeter of △ABC. Each midsegment is half a side.' }, { v: P / 4, mc: MC.halfMis, say: 'Halve once: each midsegment is half of one side.' }], 'Right: half the perimeter.', 'Each side of △DEF is half of a side of △ABC.');
});

// ---------- s2-midsegment-algebra ----------
export const midsegAlg: Gen = (R, n) => fitted('midsegAlg', () => {
  const x = ri(R, 2, 9), a = ri(R, 1, 4), b = ri(R, -4, 9), DE = a * x + b;
  if (DE < 4 || b === 0) throw new Error('length');
  let c = ri(R, 1, 7); if (c === 2 * a) c++;
  const d = 2 * DE - c * x;
  if (d === 0 || Math.abs(d) > 40) throw new Error('d');
  const askBC = R() < 0.5;
  const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: 0, lo: 100, hi: 115 });
  const f = midFig(T, { marks: [lbl('DE', lin(a, b)), lbl('BC', lin(c, d))] });
  const ans = askBC ? 2 * DE : DE;
  const xEq = (d - b) / (a - c), eqVal = askBC ? c * xEq + d : a * xEq + b;
  const wrong: NumWrong[] = [{ v: x, mc: MC.reportsX, say: `x = ${x} is not the length. Put it back: ${askBC ? `BC = ${lin(c, d)}` : `DE = ${lin(a, b)}`}.` }];
  if (Number.isFinite(xEq) && xEq > 0 && Number.isInteger(xEq) && eqVal > 0) wrong.push({ v: eqVal, mc: MC.midEqPar, say: 'DE is half of BC, not equal: write 2(DE) = BC.' });
  wrong.push({ v: askBC ? DE : 2 * DE, say: askBC ? 'That is DE; BC is twice as long.' : 'That is BC; DE is half of it.' });
  const t = relabel(R, 'ABCDE');
  return numT(t, {
    id: `midsegAlg-${n}`, family: 'midsegAlg', prompt: `D and E are the midpoints of ${segN('AB')} and ${segN('AC')}. DE = ${lin(a, b)} and BC = ${lin(c, d)}. Find ${askBC ? 'BC' : 'DE'}.`, board: `DE = ${linT(a, b)},\\ BC = ${linT(c, d)}`,
    solution: [`DE is a midsegment, so BC = 2 · DE: ${lin(c, d)} = 2(${lin(a, b)}) = ${lin(2 * a, 2 * b)}.`, `${c - 2 * a > 0 ? `${c - 2 * a}x = ${2 * b - d}` : `${2 * a - c}x = ${d - 2 * b}`}, so x = ${x}.`, `${askBC ? `BC = ${lin(c, d).replace('x', `(${x})`)}` : `DE = ${lin(a, b).replace('x', `(${x})`)}`} = <b class="s">${ans}</b>. It is positive, so it is a length.`],
    picture: { fig: f, reveal: {} },
  }, ans, wrong, 'Right: x first, then the length.', 'Write BC = 2 · DE, solve for x, then find the length asked for.');
});

// ---------- s2-median-equal-parts ----------
export const medianParts: Gen = (R, n) => fitted('medianParts', () => {
  const v = pick(R, ['whole', 'part', 'alg'] as const);
  const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: ri(R, 0, 2), lo: 100, hi: 115 });
  const s = special(T, 'median');
  if (!s) throw new Error('kind');
  const t = relabel(R, 'ABCD');
  const u = pick(R, UNITS);
  if (v === 'alg') {
    const x = ri(R, 2, 9), a = ri(R, 1, 5), b = ri(R, -3, 9), BD = a * x + b;
    if (BD < 4 || b === 0) throw new Error('len');
    let c = ri(R, 1, 7); if (c === a) c++;
    const d = BD - c * x;
    if (d === 0) throw new Error('d');
    s.fig.segs = s.fig.segs.map(g => (g.id === 'BD' ? { ...g, text: lin(a, b) } : g.id === 'DC' ? { ...g, text: lin(c, d) } : g));
    return numT(t, {
      id: `medianParts-${n}`, family: 'medianParts', prompt: `${segN('AD')} is a median of ${tri('ABC')}. BD = ${lin(a, b)} and DC = ${lin(c, d)}. Find BC.`, board: `BD = ${linT(a, b)},\\ DC = ${linT(c, d)},\\ BC = \\,?`,
      solution: ['A median ends at the midpoint of the opposite side, so BD = DC.', `${lin(a, b)} = ${lin(c, d)} gives x = ${x}, so BD = DC = ${BD}.`, `BC = BD + DC = <b class="s">${2 * BD}</b>.`],
      picture: { fig: s.fig, reveal: {} },
    }, 2 * BD, [{ v: x, mc: MC.reportsX, say: `x = ${x} is not BC. Find BD, then double it.` }, { v: BD, say: 'That is BD, half of BC.' }], 'Right.', 'BD = DC: solve for x, then add the two halves.');
  }
  const k = R() < 0.35 ? dec1(R, 3, 18) : ri(R, 3, 24);
  const whole = v === 'whole';
  s.fig.segs = s.fig.segs.map(g => (g.id === 'BD' && whole ? { ...g, text: `${f1(k)} ${u}` } : g.id === 'DC' && !whole ? { ...g, text: '?', alt: `${f1(k / 2)} ${u}` } : g));
  return numT(t, {
    id: `medianParts-${n}`, family: 'medianParts', prompt: whole ? `${segN('AD')} is a median of ${tri('ABC')} and BD = ${f1(k)} ${u}. Find BC.` : `${segN('AD')} is a median of ${tri('ABC')} and BC = ${f1(k)} ${u}. Find DC.`, board: whole ? `BD = ${f1(k)},\\ BC = \\,?` : `BC = ${f1(k)},\\ DC = \\,?`, unit: u,
    solution: ['A median ends at the midpoint of the opposite side: D splits BC into two equal parts.', whole ? `BC = 2 · ${f1(k)} = <b class="s">${f1(2 * k)}</b> ${u}.` : `DC = ${f1(k)} ÷ 2 = <b class="s">${f1(k / 2)}</b> ${u}.`],
    picture: { fig: s.fig, reveal: whole ? {} : { solved: ['DC'] } },
  }, whole ? 2 * k : k / 2, [{ v: k, say: whole ? 'BD is only half of BC.' : 'BC is the whole side; DC is half of it.' }], 'Right.', 'D is the midpoint of BC.');
});
export const medianLength: Gen = (R, n) => fitted('medianLength', () => {
  const T = makeTri(R, 'acute', { at: ri(R, 0, 2) });
  const s = special(T, 'median');
  if (!s) throw new Error('kind');
  const BC = ri(R, 8, 30), u = pick(R, UNITS);
  const AD = dist(T[0], s.D!) / dist(T[1], T[2]) * BC;
  if (Math.abs(AD - BC / 2) < 0.15 * BC || Math.abs(AD - BC) < 0.15 * BC) throw new Error('looks');
  s.fig.segs = s.fig.segs.map(g => (g.id === 'BD' ? { ...g, text: undefined } : g));
  const t = relabel(R, 'ABCD');
  return choiceT(R, t, {
    id: `medianLength-${n}`, family: 'medianLength', prompt: `${segN('AD')} is a median of ${tri('ABC')} and BC = ${BC} ${u}. How long is ${segN('AD')}?`, board: `BC = ${BC},\\ AD = \\,?`,
    solution: ['The median tells you about BC: BD = DC = ' + f1(BC / 2) + ` ${u}.`, 'It says nothing about the length of AD itself: A could be anywhere.', 'So: it cannot be found from this information.'],
    picture: { fig: s.fig, reveal: {} },
  }, [
    { t: 'it cannot be found from this information', ok: true, say: 'Right: the median only splits BC in half.' },
    { t: `${f1(BC / 2)} ${u}`, mc: MC.medHalf, say: 'Half of BC is BD and DC, not the median AD.' },
    { t: `${BC} ${u}`, say: 'Nothing makes AD equal to BC.' },
    { t: `${f1((BC * 2) / 3)} ${u}`, say: 'Two thirds belongs to the centroid on a median, not to its length.' },
  ]);
});

// ---------- s2-angle-bisector-equal-parts ----------
function bisFig(T: Tri) { const s = special(T, 'bisector'); if (!s) throw new Error('kind'); return s; }
export const bisectAngle: Gen = (R, n) => fitted('bisectAngle', () => {
  const half = ri(R, 16, 46), whole = 2 * half, toHalf = R() < 0.55;
  const T = triA(R, whole);
  const s = bisFig(T);
  if (toHalf) s.fig.angles = s.fig.angles.map(a => (a.id === 'DAC' ? { ...a, text: '?', alt: `${half}°` } : a));
  else s.fig.angles = s.fig.angles.map(a => (a.id === 'BAD' ? { ...a, text: `${half}°` } : a));
  const t = relabel(R, 'ABCD');
  return numT(t, {
    id: `bisectAngle-${n}`, family: 'bisectAngle', prompt: toHalf ? `${segN('AD')} bisects ∠BAC and m∠BAC = ${whole}°. Find m∠DAC.` : `${segN('AD')} bisects ∠BAC and m∠BAD = ${half}°. Find m∠BAC.`, board: toHalf ? `m\\angle BAC = ${whole}^\\circ,\\ m\\angle DAC = \\,?` : `m\\angle BAD = ${half}^\\circ,\\ m\\angle BAC = \\,?`, unit: '°',
    solution: ['AD bisects ∠BAC: it splits it into two congruent angles, ∠BAD ≅ ∠DAC.', toHalf ? `m∠DAC = ${whole}° ÷ 2 = <b class="s">${half}</b>°.` : `m∠BAC = 2 · ${half}° = <b class="s">${whole}</b>°.`],
    picture: { fig: s.fig, reveal: toHalf ? { solved: ['DAC'] } : {} },
  }, toHalf ? half : whole, toHalf ? [{ v: whole, mc: MC.wholeNotHalf, say: 'That is the whole angle; the bisector splits it in half.' }, { v: 90, mc: MC.bisRight, say: 'Bisecting an angle halves it; it does not make right angles.' }, { v: 45, mc: MC.bisRight, say: 'Half of THIS angle, not half of a right angle.' }] : [{ v: half, say: 'That is one half; the whole angle is twice it.' }], 'Right.', 'The bisector splits ∠BAC into two equal halves.');
});
export const bisectAlg: Gen = (R, n) => fitted('bisectAlg', () => {
  const x = ri(R, 3, 12), a = ri(R, 1, 5), half = ri(R, 18, 46), b = half - a * x;
  if (b === 0 || Math.abs(b) > 40) throw new Error('b');
  let c = ri(R, 1, 6); if (c === a) c++;
  const d = half - c * x;
  if (d === 0 || Math.abs(d) > 50) throw new Error('d');
  const askWhole = R() < 0.6;
  const T = triA(R, 2 * half);
  const s = bisFig(T);
  const t = relabel(R, 'ABCD');
  return numT(t, {
    id: `bisectAlg-${n}`, family: 'bisectAlg', prompt: `${segN('AD')} bisects ∠BAC. m∠BAD = (${lin(a, b)})° and m∠DAC = (${lin(c, d)})°. Find ${askWhole ? 'm∠BAC' : 'm∠BAD'}.`, board: `m\\angle BAD = (${linT(a, b)})^\\circ,\\ m\\angle DAC = (${linT(c, d)})^\\circ`, unit: '°',
    solution: ['A bisector makes the two halves equal: ' + `${lin(a, b)} = ${lin(c, d)}.`, `So x = ${x}, and each half is ${half}°.`, askWhole ? `m∠BAC = 2 · ${half}° = <b class="s">${2 * half}</b>°.` : `m∠BAD = <b class="s">${half}</b>°.`],
    picture: { fig: s.fig, reveal: {} },
  }, askWhole ? 2 * half : half, [{ v: x, mc: MC.reportsX, say: `x = ${x} is not the angle. Put it back into the expression.` }, ...(askWhole ? [{ v: half, say: 'That is one half of ∠BAC.' }] : [{ v: 2 * half, mc: MC.wholeNotHalf, say: 'That is the whole angle; ∠BAD is one half.' }])], 'Right.', 'Set the two halves equal, solve for x, then find the angle asked for.');
});

// ---------- s2-centroid-ratio ----------
function centroidFig(T: Tri, lab: Record<string, string>, alt: Record<string, string> = {}): Fig {
  const [A, B, C] = T, M = mid(B, C), N = mid(A, C), G = centroidOf(T);
  const f = fig({ pts: { A, B, C, M, N, G }, segs: ['AB', 'BM', 'MC', 'CN', 'NA', 'AG', 'GM', 'BG', 'GN'], marks: [tick('BM', 1), tick('MC', 1), tick('CN', 2), tick('NA', 2)], body: 'ABC' });
  f.segs = f.segs.map(g => (g.id && lab[g.id] !== undefined ? { ...g, text: lab[g.id], alt: alt[g.id], col: 'first' } : g));
  return f;
}
type CPart = 'BG' | 'GN' | 'BN';
export const centroidPart: Gen = (R, n) => fitted('centroidPart', () => {
  const k = R() < 0.3 ? ri(R, 3, 12) + 0.5 : ri(R, 2, 14);
  const val: Record<CPart, number> = { GN: k, BG: 2 * k, BN: 3 * k };
  const giv = pick(R, ['GN', 'BG', 'BN'] as CPart[]), ask = pick(R, (['GN', 'BG', 'BN'] as CPart[]).filter(x => x !== giv));
  const u = pick(R, UNITS);
  const T = makeTri(R, R() < 0.7 ? 'acute' : 'obtuse', { at: ri(R, 0, 2), lo: 100, hi: 116 });
  const lab: Record<string, string> = {}, alt: Record<string, string> = {};
  if (giv !== 'BN') lab[giv] = `${f1(val[giv])} ${u}`;
  const f = centroidFig(T, lab, alt);
  const wr: Record<string, NumWrong[]> = {
    'GN>BG': [{ v: k / 2, mc: MC.ratioWrong, say: 'The longer part is next to the vertex: BG = 2 · GN.' }, { v: k, mc: MC.bisects, say: 'G is not the midpoint of the median: BG is twice GN.' }, { v: 3 * k, mc: MC.threeOne, say: 'BG : GN is 2 : 1, not 3 : 1.' }],
    'GN>BN': [{ v: 2 * k, mc: MC.bisects, say: 'G is not the midpoint: BN = BG + GN = 3 · GN.' }, { v: 4 * k, mc: MC.threeOne, say: 'BG = 2 · GN, so BN = 3 · GN.' }],
    'BG>GN': [{ v: 4 * k, mc: MC.ratioWrong, say: 'GN is the SHORT part, next to the midpoint: GN = BG ÷ 2.' }, { v: 2 * k, mc: MC.bisects, say: 'G is not the midpoint of the median.' }, { v: (2 * k) / 3, mc: MC.threeOne, say: 'BG : GN is 2 : 1, not 3 : 1.' }],
    'BG>BN': [{ v: 4 * k, mc: MC.bisects, say: 'BG is two thirds of BN, not half.' }, { v: 2 * k + (2 * k) / 3, mc: MC.threeOne, say: 'BG : GN is 2 : 1, so GN = BG ÷ 2.' }],
    'BN>BG': [{ v: k, mc: MC.ratioWrong, say: 'BG is the LONG part: two thirds of BN.' }, { v: 1.5 * k, mc: MC.bisects, say: 'G is not the midpoint: BG is two thirds of BN.' }, { v: 2.25 * k, mc: MC.threeOne, say: 'BG : GN is 2 : 1, so BG is two thirds of BN.' }],
    'BN>GN': [{ v: 2 * k, mc: MC.ratioWrong, say: 'GN is the SHORT part: one third of BN.' }, { v: 1.5 * k, mc: MC.bisects, say: 'G is not the midpoint: GN is one third of BN.' }, { v: 0.75 * k, mc: MC.threeOne, say: 'BG : GN is 2 : 1, so GN is one third of BN.' }],
  };
  const t = relabel(R, 'ABCMNG');
  const how: Record<string, string> = {
    'GN>BG': `BG = 2 · ${f1(k)}`, 'GN>BN': `BN = 3 · ${f1(k)}`, 'BG>GN': `GN = ${f1(2 * k)} ÷ 2`, 'BG>BN': `BN = ${f1(2 * k)} + ${f1(k)}`, 'BN>BG': `BG = ⅔ · ${f1(3 * k)}`, 'BN>GN': `GN = ⅓ · ${f1(3 * k)}`,
  };
  return numT(t, {
    id: `centroidPart-${n}`, family: 'centroidPart', prompt: `G is the centroid of ${tri('ABC')} and ${segN('BN')} is a median. ${giv} = ${f1(val[giv])} ${u}. Find ${ask}.`, board: `${giv} = ${f1(val[giv])},\\ ${ask} = \\,?`, unit: u,
    solution: ['The centroid cuts every median 2 : 1, the longer part next to the vertex: BG = 2 · GN, BN = 3 · GN.', `${how[`${giv}>${ask}`]} = <b class="s">${f1(val[ask])}</b> ${u}.`],
    picture: { fig: f, reveal: { glow: ask === 'BN' ? ['BG', 'GN'] : [ask] } },
  }, val[ask], wr[`${giv}>${ask}`]!, 'Right: 2 : 1 from the vertex.', 'BG : GN = 2 : 1 (the long part at the vertex).');
});
export const centroidAlg: Gen = (R, n) => fitted('centroidAlg', () => {
  const x = ri(R, 2, 8), c = ri(R, 1, 3), g = ri(R, 4, 16), d = g - c * x;
  let a = ri(R, 1, 6); if (a === 2 * c) a++;
  const b = 2 * g - a * x;
  if (d === 0 || b === 0 || Math.abs(b) > 40 || Math.abs(d) > 30) throw new Error('coef');
  const ask = pick(R, ['BG', 'GN', 'BN'] as CPart[]);
  const val: Record<CPart, number> = { GN: g, BG: 2 * g, BN: 3 * g };
  const T = makeTri(R, 'acute', { at: ri(R, 0, 2) });
  const f = centroidFig(T, {});
  f.segs = f.segs.map(g => (g.id === 'BG' || g.id === 'GN' ? { ...g, col: 'first' } : g));
  const at = (xx: number): Record<CPart, number> => ({ BG: a * xx + b, GN: c * xx + d, BN: a * xx + b + c * xx + d });
  const wrong: NumWrong[] = [{ v: x, mc: MC.reportsX, say: `x = ${x} is not the length; put it back in.` }];
  const xe = (d - b) / (a - c); if (Number.isInteger(xe) && xe > 0 && at(xe)[ask] > 0) wrong.push({ v: at(xe)[ask], mc: MC.bisects, say: 'G is not the midpoint: BG = 2 · GN, not BG = GN.' });
  const x3 = (3 * d - b) / (a - 3 * c); if (Number.isInteger(x3) && x3 > 0 && at(x3)[ask] > 0) wrong.push({ v: at(x3)[ask], mc: MC.threeOne, say: 'The ratio is 2 : 1, not 3 : 1.' });
  const xr = (2 * b - d) / (c - 2 * a); if (Number.isInteger(xr) && xr > 0 && at(xr)[ask] > 0) wrong.push({ v: at(xr)[ask], mc: MC.ratioWrong, say: 'The LONG part is next to the vertex: BG = 2 · GN.' });
  const t = relabel(R, 'ABCMNG');
  return numT(t, {
    id: `centroidAlg-${n}`, family: 'centroidAlg', prompt: `G is the centroid of ${tri('ABC')} and ${segN('BN')} is a median. BG = ${lin(a, b)} and GN = ${lin(c, d)}. Find ${ask}.`, board: `BG = ${linT(a, b)},\\ GN = ${linT(c, d)},\\ ${ask} = \\,?`,
    solution: [`The centroid makes BG = 2 · GN: ${lin(a, b)} = 2(${lin(c, d)}) = ${lin(2 * c, 2 * d)}.`, `So x = ${x}: BG = ${2 * g} and GN = ${g}.`, `${ask} = <b class="s">${val[ask]}</b>.`],
    picture: { fig: f, reveal: {} },
  }, val[ask], wrong, 'Right: x first, then the length.', 'Write BG = 2 · GN, solve for x, then find the length asked for.');
});

// ---------- s2-angle-chains ----------
export const chainAlt: Gen = (R, n) => fitted('chainAlt', () => {
  const T = makeTri(R, 'acute', { at: 0, lo: 52, hi: 82 });
  const [aA, aB, aC] = angles(T).map(Math.round) as [number, number, number];
  const s = special(T, 'altitude');
  if (!s) throw new Error('kind');
  const v = R() < 0.5;
  const ask = 90 - aB;
  s.fig.angles.push(...(v ? [{ id: 'ABD', v: T[1], p: T[0], q: s.D!, text: `${aB}°`, arcs: 0 }] : [{ id: 'ACD', v: T[2], p: T[0], q: s.D!, text: `${aC}°`, arcs: 0 }, { id: 'BAC', v: T[0], p: T[1], q: T[2], text: `${aA}°`, arcs: 0, r: 110 }]), { id: 'BAD', v: T[0], p: T[1], q: s.D!, text: '?', alt: `${ask}°`, arcs: 0, r: 70 });
  const t = relabel(R, 'ABCD');
  return numT(t, {
    id: `chainAlt-${n}`, family: 'chainAlt', prompt: v ? `${segN('AD')} is an altitude of ${tri('ABC')} and m∠ABC = ${aB}°. Find m∠BAD.` : `${segN('AD')} is an altitude of ${tri('ABC')}, m∠BAC = ${aA}° and m∠ACB = ${aC}°. Find m∠BAD.`, board: v ? `m\\angle B = ${aB}^\\circ,\\ m\\angle BAD = \\,?` : `m\\angle BAC = ${aA}^\\circ,\\ m\\angle C = ${aC}^\\circ`, unit: '°',
    solution: v ? ['AD ⊥ BC, so ∠ADB = 90°.', `In △ABD: m∠BAD = 180° − 90° − ${aB}° = <b class="s">${ask}</b>°.`] : ['AD ⊥ BC, so ∠ADC = 90°.', `In △ADC: m∠DAC = 180° − 90° − ${aC}° = ${90 - aC}°.`, `m∠BAD = ${aA}° − ${90 - aC}° = <b class="s">${ask}</b>°.`],
    picture: { fig: s.fig, reveal: { solved: ['BAD'] } },
  }, ask, v ? [{ v: aB, say: 'That is ∠B. Use the right angle at D: the angles of △ABD add to 180°.' }, { v: 180 - aB, say: 'Do not forget the 90° at D.' }] : [{ v: 90 - aC, mc: MC.appearance, say: `That is ∠DAC, the other part of ∠A.` }, { v: aA - aC, say: 'Use the right angle at D in △ADC first.' }], 'Right.', 'The altitude makes a right angle at D; use the angle sum in the small triangle.');
});
export const chainBisAlt: Gen = (R, n) => fitted('chainBisAlt', () => {
  const aA = 2 * ri(R, 26, 40), dd = ri(R, 9, 16), aB0 = (180 - aA) / 2 + dd * (R() < 0.5 ? 1 : -1);
  if (aB0 >= 86 || 180 - aA - aB0 >= 86) throw new Error('acute');
  const T = turnT(triASA(aA, 340, aB0), ri(R, 0, 359));
  const [, aB, aC] = angles(T).map(Math.round) as [number, number, number];
  const [A, B, C] = T, H = altitudeFoot(T, 0), D = bisectorFoot(T, 0);
  if (dist(H, D) < 0.1 * dist(B, C)) throw new Error('close');
  const ordered = [{ n: 'H', p: H }, { n: 'D', p: D }].sort((x, y) => dist(B, x.p) - dist(B, y.p));
  const f = fig({ pts: { A, B, C, H, D }, segs: ['AB', 'AC', `B${ordered[0]!.n}`, `${ordered[0]!.n}${ordered[1]!.n}`, `${ordered[1]!.n}C`, 'AH', 'AD'], marks: [box(`AH${ordered[0]!.n === 'H' ? 'C' : 'B'}`), arc('BAD', 1), arc('DAC', 1), albl('ABC', `${aB}°`), albl('ACB', `${aC}°`)], body: 'ABC' });
  const ans = Math.abs(aB - aC) / 2;
  const t = relabel(R, 'ABCDH');
  return numT(t, {
    id: `chainBisAlt-${n}`, family: 'chainBisAlt', prompt: `In ${tri('ABC')}, ${segN('AH')} is an altitude and ${segN('AD')} bisects ∠BAC. m∠B = ${aB}° and m∠C = ${aC}°. Find m∠HAD, the angle between them.`, board: `m\\angle B = ${aB}^\\circ,\\ m\\angle C = ${aC}^\\circ,\\ m\\angle HAD = \\,?`, unit: '°',
    solution: [`m∠BAC = 180° − ${aB}° − ${aC}° = ${aA}°, so the bisector makes m∠BAD = ${aA / 2}°.`, `In right △ABH: m∠BAH = 90° − ${aB}° = ${90 - aB}°.`, `m∠HAD = |${aA / 2}° − ${90 - aB}°| = <b class="s">${ans}</b>°.`],
    picture: { fig: f, reveal: { glow: ['AH', 'AD'] } },
  }, ans, [{ v: Math.abs(aA - (90 - aB)), mc: MC.wholeNotHalf, say: 'Use HALF of ∠BAC: the bisector splits it.' }, { v: 90 - aB, say: 'That is ∠BAH; the bisector is the other ray.' }, { v: aA / 2, say: 'That is ∠BAD; subtract ∠BAH.' }], 'Right.', 'Find ∠BAD (half of ∠A) and ∠BAH (from the right angle), then subtract.');
});
export const chainExt: Gen = (R, n) => fitted('chainExt', () => {
  const half = ri(R, 18, 38), aA = 2 * half;
  const T = triA(R, aA);
  const [, aB] = angles(T).map(Math.round) as [number, number, number];
  const s = bisFig(T);
  const ans = aB + half;
  s.fig.angles.push({ id: 'ABD', v: T[1], p: T[0], q: s.D!, text: `${aB}°`, arcs: 0 }, { id: 'ADC', v: s.D!, p: T[0], q: T[2], text: '?', alt: `${ans}°`, arcs: 0, r: 60 });
  const t = relabel(R, 'ABCD');
  return numT(t, {
    id: `chainExt-${n}`, family: 'chainExt', prompt: `${segN('AD')} bisects ∠BAC, m∠BAC = ${aA}° and m∠ABC = ${aB}°. Find m∠ADC.`, board: `m\\angle BAC = ${aA}^\\circ,\\ m\\angle B = ${aB}^\\circ,\\ m\\angle ADC = \\,?`, unit: '°',
    solution: [`The bisector gives m∠BAD = ${aA}° ÷ 2 = ${half}°.`, '∠ADC is an exterior angle of △ABD: it equals the two remote interior angles.', `m∠ADC = ${aB}° + ${half}° = <b class="s">${ans}</b>°.`],
    picture: { fig: s.fig, reveal: { solved: ['ADC'] } },
  }, ans, [{ v: aB + aA, mc: MC.wholeNotHalf, say: 'Only half of ∠BAC is in △ABD.' }, { v: 180 - ans, say: 'That is ∠ADB; ∠ADC is its supplement.' }], 'Right: exterior angle = the two remote interior angles.', 'Halve ∠BAC, then use the exterior angle of △ABD.');
});

// ---------- s2-equidistance-distances ----------
export const equiAlg: Gen = (R, n) => fitted('equiAlg', () => {
  const pb = R() < 0.5;
  const x = ri(R, 2, 9), a = ri(R, 1, 5), L = ri(R, 6, 30), b = L - a * x;
  let c = ri(R, 1, 6); if (c === a) c++;
  const d = L - c * x;
  if (b === 0 || d === 0 || Math.abs(b) > 40 || Math.abs(d) > 40) throw new Error('coef');
  const t = relabel(R, 'ABCEFMP');
  if (pb) {
    const AM = L * (0.35 + R() * 0.4), k = 330 / L, PM = Math.sqrt(L * L - AM * AM);
    const A: Pt = [-AM * k, 0], B: Pt = [AM * k, 0], M: Pt = [0, 0], P: Pt = [0, PM * k];
    const f = fig({ pts: { A, B, M, P, X: [0, -110], Y: [0, PM * k + 110] }, bare: ['X', 'Y'], segs: ['AM', 'MB', 'XY', 'PA', 'PB'], marks: [tick('AM', 1), tick('MB', 1), box('YMB'), lbl('PA', lin(a, b)), lbl('PB', lin(c, d))], segStyle: { XY: { kind: 'line', name: 'ℓ' } } });
    return numT(t, {
      id: `equiAlg-${n}`, family: 'equiAlg', prompt: `Line ℓ is the perpendicular bisector of ${segN('AB')} and P is on ℓ. PA = ${lin(a, b)} and PB = ${lin(c, d)}. Find PA.`, board: `PA = ${linT(a, b)},\\ PB = ${linT(c, d)}`,
      solution: ['P is on the perpendicular bisector of AB, so PA = PB.', `${lin(a, b)} = ${lin(c, d)} gives x = ${x}.`, `PA = <b class="s">${L}</b>.`],
      picture: { fig: f, reveal: {} },
    }, L, [{ v: x, mc: MC.reportsX, say: `x = ${x}; the question asks for PA.` }], 'Right.', 'On the perpendicular bisector PA = PB: solve, then evaluate.');
  }
  const half = ri(R, 18, 34) * Math.PI / 180, AP = L / Math.sin(half), k = 380 / AP;
  const A: Pt = [0, 0], P: Pt = [AP * k, 0], u1: Pt = [Math.cos(half), Math.sin(half)], u2: Pt = [Math.cos(half), -Math.sin(half)];
  const far = AP * k * 1.4, E = footOf(P, A, u1), F = footOf(P, A, u2);
  const f = fig({ pts: { A, P, E, F, B: [u1[0] * far, u1[1] * far], C: [u2[0] * far, u2[1] * far], X: [AP * k * 1.35, 0] }, bare: ['X'], segs: ['AB', 'AC', 'AP', 'PX', 'PE', 'PF'], marks: [arc('BAX', 1), arc('XAC', 1), box('AEP'), box('AFP'), lbl('PE', lin(a, b)), lbl('PF', lin(c, d))], segStyle: { AB: { kind: 'ray' }, AC: { kind: 'ray' }, PX: { kind: 'ray', col: 'faint' } } });
  return numT(t, {
    id: `equiAlg-${n}`, family: 'equiAlg', prompt: `P is on the bisector of ∠BAC, ${segN('PE')} ⊥ ${segN('AB')} and ${segN('PF')} ⊥ ${segN('AC')}. PE = ${lin(a, b)} and PF = ${lin(c, d)}. Find PE.`, board: `PE = ${linT(a, b)},\\ PF = ${linT(c, d)}`,
    solution: ['P is on the angle bisector, so its perpendicular distances to the sides are equal: PE = PF.', `${lin(a, b)} = ${lin(c, d)} gives x = ${x}.`, `PE = <b class="s">${L}</b>.`],
    picture: { fig: f, reveal: {} },
  }, L, [{ v: x, mc: MC.reportsX, say: `x = ${x}; the question asks for PE.` }], 'Right.', 'On the bisector PE = PF: solve, then evaluate.');
});
export const centerDist: Gen = (R, n) => fitted('centerDist', () => {
  const v = pick(R, ['circ', 'right', 'in'] as const);
  const u = pick(R, UNITS);
  if (v === 'right') {
    const h = R() < 0.4 ? dec1(R, 8, 30) : 2 * ri(R, 4, 20);
    const T = makeTri(R, 'right', { at: 2 });
    const [A, B, C] = T, O = mid(A, B), k = h / dist(A, B);
    const leg = Math.round(dist(B, C) * k * 10) / 10;
    const f = fig({ pts: { A, B, C, O }, segs: ['AO', 'OB', 'BC', 'CA', 'OC'], marks: [box('ACB'), tick('AO', 1), tick('OB', 1), lbl('BC', `${f1(leg)} ${u}`)], body: 'ABC', segStyle: { OC: { col: 'faint', text: '?', alt: `${f1(h / 2)} ${u}` } } });
    const t = relabel(R, 'ABCO');
    return numT(t, {
      id: `centerDist-${n}`, family: 'centerDist', prompt: `${tri('ABC')} has a right angle at C and hypotenuse AB = ${f1(h)} ${u}. O is its circumcenter. How far is O from C?`, board: `AB = ${f1(h)},\\ OC = \\,?`, unit: u,
      solution: ['The circumcenter of a right triangle is the midpoint of the hypotenuse.', 'It is the same distance from all three vertices: OC = OA = half of AB.', `OC = ${f1(h)} ÷ 2 = <b class="s">${f1(h / 2)}</b> ${u}.`],
      picture: { fig: f, reveal: { solved: ['OC'] } },
    }, h / 2, [{ v: h, say: 'OC is a radius: half the hypotenuse.' }, { v: leg / 2, mc: MC.radiusWrong, say: 'Halve the hypotenuse, not a leg.' }], 'Right: half the hypotenuse.', 'O is the midpoint of the hypotenuse and is equidistant from A, B and C.');
  }
  if (v === 'circ') {
    const T = makeTri(R, 'acute', { at: ri(R, 0, 2) });
    const [A, B, C] = T, O = circumcenterOf(T), M = mid(A, B);
    const OA = R() < 0.4 ? dec1(R, 5, 20) : ri(R, 6, 24), k = OA / dist(O, A);
    const OM = Math.round(dist(O, M) * k * 10) / 10;
    if (OM < 1 || Math.abs(OM - OA) < 1) throw new Error('om');
    const f = fig({ pts: { A, B, C, O, M }, segs: ['AM', 'MB', 'BC', 'CA', 'OA', 'OM', 'OC'], marks: [tick('AM', 1), tick('MB', 1), box('OMB'), lbl('OA', `${f1(OA)} ${u}`), lbl('OM', `${f1(OM)} ${u}`)], body: 'ABC', segStyle: { OC: { text: '?', alt: `${f1(OA)} ${u}` } } });
    const t = relabel(R, 'ABCMO');
    return numT(t, {
      id: `centerDist-${n}`, family: 'centerDist', prompt: `O is the circumcenter of ${tri('ABC')} and M is the midpoint of ${segN('AB')}. OA = ${f1(OA)} ${u} and OM = ${f1(OM)} ${u}. Find OC.`, board: `OA = ${f1(OA)},\\ OM = ${f1(OM)},\\ OC = \\,?`, unit: u,
      solution: ['The circumcenter is the same distance from all three VERTICES.', `So OC = OA = <b class="s">${f1(OA)}</b> ${u}.`],
      picture: { fig: f, reveal: { solved: ['OC'] } },
    }, OA, [{ v: OM, mc: MC.circToMid, say: 'OM is the distance to the midpoint of a side; the circumcenter is equidistant from the vertices.' }], 'Right: OA = OB = OC.', 'O is equidistant from the three vertices.');
  }
  // incenter: perpendicular distances to the sides are equal; a vertex distance is a trap
  const rr = ri(R, 3, 9), IA = Math.round(rr * (2.4 + R() * 1.0) * 10) / 10;
  const S = incircleSetup(rr, IA, (ri(R, -50, 50) * Math.PI) / 180, 300 / IA);
  if (!S || S.half < 14 || S.half > 38) throw new Error('shape');
  const G = footOf(S.I, S.B, S.C);
  const f = fig({ pts: { A: S.A, B: S.B, C: S.C, I: S.I, E: S.E, G }, segs: ['AE', 'EB', 'BG', 'GC', 'CA', 'IE', 'IA', 'IG'], marks: [box('AEI'), box('IGC'), lbl('IA', `${f1(IA)} ${u}`)], body: 'ABC' });
  const t = relabel(R, 'ABCEGI');
  return numT(t, {
    id: `centerDist-${n}`, family: 'centerDist', prompt: `I is the incenter of ${tri('ABC')}. ${segN('IE')} ⊥ ${segN('AB')}, ${segN('IG')} ⊥ ${segN('BC')}, IE = ${rr} ${u} and IA = ${f1(IA)} ${u}. Find IG.`, board: `IE = ${rr},\\ IA = ${f1(IA)},\\ IG = \\,?`, unit: u,
    solution: ['The incenter is the same distance from all three SIDES, measured along perpendiculars.', `IE and IG are those perpendicular distances, so IG = IE = <b class="s">${rr}</b> ${u}.`],
    picture: { fig: f, reveal: { glow: ['IG'] } },
  }, rr, [{ v: IA, mc: MC.swap, say: 'IA is a distance to a vertex. The incenter is equidistant from the sides.' }], 'Right: equal distances to the sides.', 'The incenter is equidistant from the three sides.');
});

// ---------- s2-center-distance-pythagorean ----------
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [9, 40, 41], [12, 16, 20], [20, 21, 29]];
const tieFree = (x: number) => Math.abs(((x * 10) % 1) - 0.5) > 0.02;
export const pythIn: Gen = (R, n) => fitted('pythIn', () => {
  const calc = R() < 0.35;
  let rr: number, IA: number, t0: number;
  if (calc) { rr = ri(R, 3, 9); IA = rr + ri(R, 3, 9); t0 = Math.sqrt(IA * IA - rr * rr); if (Number.isInteger(t0) || !tieFree(t0)) throw new Error('tie'); }
  else { const [p, q, h] = pick(R, TRIPLES); rr = p; IA = h; t0 = q; }
  const ans = calc ? Math.round(t0 * 10) / 10 : t0;
  const S = incircleSetup(rr, IA, (ri(R, -50, 50) * Math.PI) / 180, 260 / IA);
  if (!S || S.half < 13 || S.half > 40) throw new Error('shape');
  const f = fig({ pts: { A: S.A, B: S.B, C: S.C, I: S.I, E: S.E }, segs: ['AE', 'EB', 'BC', 'CA', 'IE', 'IA'], marks: [box('AEI')], extra: circleSegs('ic', S.I, S.R0, { col: 'second' }), body: 'ABC', segStyle: { AE: { col: 'first' } } });
  const u = pick(R, UNITS);
  const t = relabel(R, 'ABCEI');
  return numT(t, {
    id: `pythIn-${n}`, family: 'pythIn', prompt: `I is the incenter of ${tri('ABC')}; the inscribed circle touches ${segN('AB')} at E. The radius is ${rr} ${u} and IA = ${IA} ${u}. Find AE${calc ? ', to the nearest tenth' : ''}.`, board: `r = ${rr},\\ IA = ${IA},\\ AE = \\,?`, unit: u,
    solution: ['The radius IE is perpendicular to AB, so △AEI has a right angle at E with hypotenuse IA.', `AE² = ${IA}² − ${rr}² = ${IA * IA - rr * rr}.`, `AE = √${IA * IA - rr * rr} ${calc ? '≈' : '='} <b class="s">${ans}</b> ${u}.`],
    picture: { fig: f, reveal: { glow: ['AE'] } },
  }, ans, [{ v: IA - rr, say: 'Subtracting lengths does not work in a right triangle: use AE² + IE² = IA².' }, { v: calc ? Math.round(Math.sqrt(IA * IA + rr * rr) * 10) / 10 : Math.sqrt(IA * IA + rr * rr), mc: MC.radiusWrong, say: 'IA is the hypotenuse (opposite the right angle at E): subtract the squares.' }], 'Right.', 'Right angle at E: AE² + IE² = IA².');
});
export const pythCirc: Gen = (R, n) => fitted('pythCirc', () => {
  const calc = R() < 0.3;
  let Rr: number, d: number, h0: number;
  if (calc) { Rr = ri(R, 6, 15); d = ri(R, 2, Rr - 2); h0 = Math.sqrt(Rr * Rr - d * d); if (Number.isInteger(h0) || !tieFree(h0) || !tieFree(2 * h0)) throw new Error('tie'); }
  else { const [p, q, hh] = pick(R, TRIPLES.filter(x => x[2] <= 29)); const sw = R() < 0.5; Rr = hh; d = sw ? p : q; h0 = sw ? q : p; }
  const askBC = R() < 0.5;
  const k = 260 / Rr, O: Pt = [0, 0], B: Pt = [-h0 * k, -d * k], C: Pt = [h0 * k, -d * k], M: Pt = [0, -d * k];
  const th = (pick(R, [ri(R, 38, 72), ri(R, 108, 142)]) * Math.PI) / 180, A: Pt = [Rr * k * Math.cos(th), Rr * k * Math.sin(th)];
  if (dist(A, B) / dist(A, C) < 1.12 && dist(A, C) / dist(A, B) < 1.12) throw new Error('isosceles');
  const f = fig({ pts: { A, B, C, O, M }, segs: ['AB', 'BM', 'MC', 'CA', 'OB', 'OM'], marks: [box('OMC')], extra: circleSegs('cc', O, Rr * k, { col: 'second' }), body: 'ABC', segStyle: { BM: { col: 'first' } } });
  const half = calc ? Math.round(h0 * 10) / 10 : h0, whole = calc ? Math.round(2 * h0 * 10) / 10 : 2 * h0;
  const u = pick(R, UNITS);
  const t = relabel(R, 'ABCMO');
  return numT(t, {
    id: `pythCirc-${n}`, family: 'pythCirc', prompt: `O is the circumcenter of ${tri('ABC')}, so the circle through A, B and C has radius OB = ${Rr} ${u}. ${segN('OM')} ⊥ ${segN('BC')} and OM = ${d} ${u}. Find ${askBC ? 'BC' : 'BM'}${calc ? ', to the nearest tenth' : ''}.`, board: `OB = ${Rr},\\ OM = ${d},\\ ${askBC ? 'BC' : 'BM'} = \\,?`, unit: u,
    solution: ['O lies on the perpendicular bisector of BC, so M is the midpoint of BC and △OMB has a right angle at M.', `BM² = ${Rr}² − ${d}² = ${Rr * Rr - d * d}, so BM ${calc ? '≈ ' + half : '= ' + half}.`, askBC ? `BC = 2 · BM ${calc ? '≈' : '='} <b class="s">${whole}</b> ${u}.` : `BM ${calc ? '≈' : '='} <b class="s">${half}</b> ${u}.`],
    picture: { fig: f, reveal: { glow: ['BM'] } },
  }, askBC ? whole : half, [...(askBC ? [{ v: half, say: 'That is BM, half of BC.' }] : [{ v: whole, say: 'That is BC; BM is half of it.' }]), { v: Rr - d, say: 'Use the right angle at M: BM² + OM² = OB².' }], 'Right.', 'Right angle at M: BM² + OM² = OB².');
});

// ---------- s2-construct-circumcircle / s2-construct-incircle ----------
const pickNames = (R: () => number, n: number) => letters(R, n).slice();
export const circNext: Gen = (R, n) => fitted('circNext', () => {
  const kind = pick(R, ['acute', 'right', 'obtuse'] as Kind[]);
  const T = makeTri(R, kind, { at: 2, lo: 100, hi: 118 });
  const [a, b, c, o] = pickNames(R, 4) as [string, string, string, string];
  const cons = circumCons(T, [a, b, c, o]);
  const k = ri(R, 0, 3);
  const sgN = (s: string) => segN(s);
  const opts: Opt[][] = [
    [{ t: `Construct the perpendicular bisector of ${sgN(a + b)}`, ok: true, say: 'Right: the center is equidistant from A and B, so it lies on this line.'.replace('A and B', `${a} and ${b}`) },
     { t: `Bisect ∠${a} and ∠${b}`, mc: MC.circFromBis, say: 'Angle bisectors find the INcenter (equal distances to the sides).' },
     { t: `Draw the median from ${c}`, mc: MC.circFromBis, say: 'Medians find the centroid, which is not equidistant from the vertices.' },
     { t: 'Mark the point that looks central and draw a circle', mc: MC.central, say: 'Looking central is no guarantee: construct it.' }],
    [{ t: `Construct the perpendicular bisector of ${sgN(b + c)}`, ok: true, say: 'Right: a second line to cross the first.' },
     { t: `Bisect ∠${c}`, mc: MC.circFromBis, say: 'Angle bisectors find the incenter.' },
     kind === 'right' ? { t: `Draw the circle about ${b} through ${a}`, say: 'A vertex is not the center: first find the point equidistant from all three.' } : { t: `Draw the circle about the midpoint of ${sgN(a + b)} through ${a}`, mc: MC.circToMid, say: `That circle misses ${c}: first find the center.` }],
    [{ t: `Mark ${o} where the two perpendicular bisectors meet`, ok: true, say: 'Right: two lines are enough to fix the center.' },
     { t: `Mark where the perpendicular bisector of ${sgN(b + c)} crosses ${sgN(b + c)}`, mc: MC.circToMid, say: 'That is the midpoint of a side, not the center.' },
     { t: 'Mark the centroid', mc: MC.circFromBis, say: 'The centroid comes from the medians.' }],
    [{ t: `Put the needle on ${o} and the pencil on ${a}; draw the circle`, ok: true, say: 'Right: the radius reaches a vertex.' },
     { t: `Put the needle on ${o} and the pencil on the midpoint of ${sgN(b + c)}`, mc: MC.circToMid, say: 'That circle is too small: it misses the vertices.' },
     { t: `Put the needle on ${a} and the pencil on ${o}`, say: 'The center of the circle is the constructed point, not a vertex.' }],
  ];
  return choice(R, {
    id: `circNext-${n}`, family: 'circNext', prompt: `Construct the circumscribed circle of ${tri(a + b + c)}. ${k === 0 ? 'Nothing is drawn yet.' : `The first ${k === 1 ? 'step is' : `${k} steps are`} done.`} What comes next?`, board: '\\text{the circumscribed circle}',
    solution: [k === 0 ? 'The center must be equidistant from the vertices: it lies on the perpendicular bisectors.' : k === 1 ? 'One perpendicular bisector is drawn; a second one crosses it at the center.' : k === 2 ? 'Two perpendicular bisectors meet in one point: the center.' : 'The radius is the distance from the center to a vertex.', `So: ${opts[k]![0]!.t}.`],
    picture: { cons: { c: cons, upto: k, after: k + 1 } },
  }, opts[k]!);
});
export const circRadius: Gen = (R, n) => fitted('circRadius', () => {
  const kind = pick(R, ['acute', 'right', 'obtuse'] as Kind[]);
  const T = makeTri(R, kind, { at: 2, lo: 100, hi: 118 });
  const [a, b, c, o] = pickNames(R, 4) as [string, string, string, string];
  const cons = circumCons(T, [a, b, c, o]);
  if (R() < 0.5) return choice(R, {
    id: `circRadius-${n}`, family: 'circRadius', prompt: `Two perpendicular bisectors of ${tri(a + b + c)} meet at ${o}. Do you need the third one to find the center?`, board: '\\text{two or three bisectors?}',
    solution: [`${o} is equidistant from ${a} and ${b}, and from ${b} and ${c}: so from all three vertices.`, 'Two lines fix the point; the third passes through it anyway (a check).', 'So: no: two locate the center; the third is only a check.'],
    picture: { cons: { c: cons, upto: 3 } },
  }, [
    { t: 'no: two locate the center; the third is only a check', ok: true, say: 'Right: the third must pass through it.' },
    { t: 'yes: the center is only certain where all three cross', mc: MC.twoMeet, say: 'Two bisectors already give equal distances to all three vertices.' },
    { t: 'yes: two lines can meet in more than one point', say: 'Two different lines meet in at most one point.' },
  ]);
  // the circle's radius
  const legs = kind === 'right' ? [`${b}${c}`, `${c}${a}`] : [`${a}${b}`, `${b}${c}`];
  const sd = pick(R, legs);
  return choice(R, {
    id: `circRadius-${n}`, family: 'circRadius', prompt: `${o} is the center of the circumscribed circle of ${tri(a + b + c)}. Which compass width draws the circle?`, board: '\\text{the radius?}',
    solution: ['The circumscribed circle passes through all three vertices.', `So its radius is the distance from ${o} to a vertex: ${o}${a}.`],
    picture: { cons: { c: cons, upto: 3, after: 4 } },
  }, [
    { t: `${o}${a}, from the center to a vertex`, ok: true, say: 'Right: the circle passes through the vertices.' },
    { t: `from ${o} to the midpoint of ${segN(sd)}`, mc: MC.circToMid, say: 'That circle would miss the vertices.' },
    { t: `half of ${segN(sd)}`, mc: MC.circToMid, say: `The radius is the distance from ${o} to a vertex, not half a side.` },
  ]);
});
export const inNext: Gen = (R, n) => fitted('inNext', () => {
  const T = makeTri(R, pick(R, ['acute', 'acute', 'obtuse', 'right'] as Kind[]), { at: 2, lo: 100, hi: 116 });
  const [a, b, c, i, f] = pickNames(R, 5) as [string, string, string, string, string];
  const cons = inCons(T, [a, b, c, i, f]);
  const k = ri(R, 0, 4);
  const opts: Opt[][] = [
    [{ t: `Bisect ∠${a}`, ok: true, say: 'Right: the center is equidistant from the sides of each angle.' },
     { t: `Construct the perpendicular bisector of ${segN(a + b)}`, mc: MC.swap, say: 'Perpendicular bisectors find the CIRCUMcenter (equal distances to the vertices).' },
     { t: `Draw the median from ${a}`, mc: MC.circFromBis, say: 'Medians find the centroid.' }],
    [{ t: `Bisect ∠${b}`, ok: true, say: 'Right: a second bisector to cross the first.' },
     { t: `Construct the perpendicular bisector of ${segN(b + c)}`, mc: MC.swap, say: 'That would look for the circumcenter.' },
     { t: `Draw the circle about ${a}`, say: 'First find the center.' }],
    [{ t: `Mark ${i} where the two angle bisectors meet`, ok: true, say: 'Right: two bisectors fix the incenter.' },
     { t: `Mark where the bisector of ∠${a} meets ${segN(b + c)}`, say: 'That point is on a side; the center is inside, where the bisectors cross.' }],
    [{ t: `Construct the perpendicular from ${i} to ${segN(a + b)} and mark its foot ${f}`, ok: true, say: 'Right: the radius is the perpendicular distance to a side.' },
     { t: `Put the needle on ${i} and the pencil on ${a}; draw the circle`, mc: MC.radiusWrong, say: 'A circle through a vertex crosses the sides; it does not touch them.' },
     { t: `Join ${i} to any point of ${segN(a + b)} and use that as the radius`, mc: MC.slanted, say: 'Only the perpendicular gives the distance to the side.' }],
    [{ t: `Put the needle on ${i} and the pencil on ${f}; draw the circle`, ok: true, say: 'Right: it touches all three sides.' },
     { t: `Put the needle on ${i} and the pencil on ${a}`, mc: MC.radiusWrong, say: 'That circle passes through a vertex and crosses the sides.' },
     { t: `Put the needle on ${i} and the pencil on the midpoint of ${segN(a + b)}`, mc: MC.slanted, say: `The midpoint is not where the perpendicular from ${i} meets the side.` }],
  ];
  return choice(R, {
    id: `inNext-${n}`, family: 'inNext', prompt: `Construct the inscribed circle of ${tri(a + b + c)}. ${k === 0 ? 'Nothing is drawn yet.' : `The first ${k === 1 ? 'step is' : `${k} steps are`} done.`} What comes next?`, board: '\\text{the inscribed circle}',
    solution: [k <= 1 ? 'The center must be equidistant from the sides: it lies on the angle bisectors.' : k === 2 ? 'Two angle bisectors meet in one point: the incenter.' : k === 3 ? 'The radius is the perpendicular distance from the incenter to a side.' : 'The foot of the perpendicular is where the circle touches the side.', `So: ${opts[k]![0]!.t}.`],
    picture: { cons: { c: cons, upto: k, after: k + 1 } },
  }, opts[k]!);
});
export const inRadiusCons: Gen = (R, n) => fitted('inRadiusCons', () => {
  const T = makeTri(R, pick(R, ['acute', 'obtuse'] as Kind[]), { at: 2, lo: 100, hi: 116 });
  const [A, B] = T;
  const I = incenterOf(T), F = footOf(I, A, B);
  if (dist(F, mid(A, B)) < 0.08 * dist(A, B)) throw new Error('foot near the midpoint');
  const [a, b, c, i, f] = pickNames(R, 5) as [string, string, string, string, string];
  const cons = inCons(T, [a, b, c, i, f]);
  return choice(R, {
    id: `inRadiusCons-${n}`, family: 'inRadiusCons', prompt: `${i} is the incenter of ${tri(a + b + c)} and ${f} is the foot of the perpendicular from ${i} to ${segN(a + b)}. Which compass width draws the inscribed circle?`, board: '\\text{the radius?}',
    solution: ['The inscribed circle touches each side; its radius is the perpendicular distance from the center to a side.', `So: ${i}${f}, the perpendicular to a side.`],
    picture: { cons: { c: cons, upto: 4, after: 5 } },
  }, [
    { t: `${i}${f}, the perpendicular to a side`, ok: true, say: 'Right: the circle touches the side at the foot.' },
    { t: `${i}${a}, from the center to a vertex`, mc: MC.radiusWrong, say: 'A circle through a vertex crosses the sides.' },
    { t: `from ${i} to the midpoint of ${segN(a + b)}`, mc: MC.slanted, say: 'The midpoint is not the foot of the perpendicular: that distance is too long.' },
  ]);
});

// ---------- s2-mixed-selection ----------
const MIXED: Gen[] = [];
export const mixedNum: Gen = (R, n, sg) => {
  const g = pick(R, MIXED);
  const it = g(R, n, sg);
  return { ...it, id: `mixedNum-${n}`, family: 'mixedNum' };
};
export const enoughInfo: Gen = (R, n) => fitted('enoughInfo', () => {
  const v = pick(R, ['midsegOne', 'medianNo', 'medianYes', 'bisNo', 'bisYes', 'midsegYes'] as const);
  const u = pick(R, UNITS);
  const T = makeTri(R, 'acute', { at: ri(R, 0, 2) });
  const [A, B, C] = T;
  const t = relabel(R, 'ABCDE');
  let f: Fig, q: string, board: string, val: number, enough: boolean, sol: string[];
  if (v === 'midsegOne' || v === 'midsegYes') {
    const BC = 2 * ri(R, 5, 18), D = mid(A, B), E = lerpP(A, C, v === 'midsegYes' ? 0.5 : pick(R, [0.4, 0.42, 0.58, 0.6]));
    f = fig({ pts: { A, B, C, D, E }, segs: ['AD', 'DB', 'AE', 'EC', 'BC', 'DE'], marks: [tick('AD', 1), tick('DB', 1), ...(v === 'midsegYes' ? [tick('AE', 2), tick('EC', 2)] : []), lbl('BC', `${BC} ${u}`)], body: 'ABC' });
    q = `BC = ${BC} ${u}. Find DE.`; board = `BC = ${BC},\\ DE = \\,?`; val = BC / 2; enough = v === 'midsegYes';
    sol = enough ? ['D and E are both marked midpoints: DE is a midsegment.', `DE = ${BC} ÷ 2 = ${val} ${u}.`] : ['Only D is marked as a midpoint; E only looks like one.', 'Without two marked midpoints DE is not a midsegment: not enough information.'];
  } else if (v === 'medianNo' || v === 'medianYes') {
    const BC = 2 * ri(R, 5, 18), D = mid(B, C);
    if (Math.abs(measure(D, A, B) - 90) < 12) throw new Error('perp');
    f = fig({ pts: { A, B, C, D }, segs: ['AB', 'AC', 'BD', 'DC', 'AD'], marks: v === 'medianYes' ? [tick('BD', 1), tick('DC', 1)] : [], body: 'ABC' });
    q = `BC = ${BC} ${u}. Find BD.`; board = `BC = ${BC},\\ BD = \\,?`; val = BC / 2; enough = v === 'medianYes';
    sol = enough ? ['The ticks make D the midpoint of BC.', `BD = ${BC} ÷ 2 = ${val} ${u}.`] : ['Nothing marks D as the midpoint of BC; it only looks like one.', 'So BD is not determined: not enough information.'];
  } else {
    const half = ri(R, 18, 40), Tb = triA(R, 2 * half), s = special(Tb, 'bisector');
    if (!s) throw new Error('kind');
    f = s.fig;
    if (v === 'bisNo') f.angles = [];
    q = `m∠BAC = ${2 * half}°. Find m∠BAD.`; board = `m\\angle BAC = ${2 * half}^\\circ,\\ m\\angle BAD = \\,?`; val = half; enough = v === 'bisYes';
    sol = enough ? ['The equal arcs make AD the bisector of ∠BAC.', `m∠BAD = ${2 * half}° ÷ 2 = ${half}°.`] : ['No arcs mark the two angles at A as equal; AD only looks like a bisector.', 'So m∠BAD is not determined: not enough information.'];
  }
  const unit = v.startsWith('bis') ? '°' : ` ${u}`;
  const valT = `${val}${unit}`;
  const opts: Opt[] = [
    { t: valT, ok: enough, mc: enough ? undefined : MC.trusts, say: enough ? 'Right: the marks support it.' : 'That trusts how the figure looks: no mark supports it.' },
    { t: 'not enough information', ok: !enough, say: enough ? 'The marks do give it here.' : 'Right: the marks do not determine it.' },
    { t: `${v.startsWith('bis') ? 2 * val : 2 * val}${unit}`, say: 'Check which part is half of which.' },
  ];
  return choiceT(R, t, {
    id: `enoughInfo-${n}`, family: 'enoughInfo', prompt: `Use only the marks and the givens. ${q}`, board,
    solution: [...sol, `So: ${enough ? valT : 'not enough information'}.`],
    picture: { fig: f, reveal: {} },
  }, opts);
});
MIXED.push(midsegLen, medianParts, centroidPart, bisectAngle, midsegAngle, chainAlt);
void kindOf; void ptsOf; void shuffle;
