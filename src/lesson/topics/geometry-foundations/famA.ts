// famA.ts: families for the starting kit of a geometry: undefined terms, definitions, postulates, the sphere,
// if-then statements, conjectures and theorems, proofs vs claims, givens vs targets (sub-goals 1-9).
import { type Fig, type GSeg, type Pt, at, dirv, add, mul } from './geo';
import { fan, letters, mark, onLine, quad, rightAngle, twoLines, box3d } from './figs';
import { type Base, type GFItem, type Gen, type Opt, A, B, MC, NAMES, S, ans, choiceItem, fitted, numItem, pick, q, r, segN, shuffle } from './kit';
import type { GlobePath } from './Globe';

// ======================= 1 undefined terms =======================
function termFig(t: string, R: () => number): Fig {
  const L = letters(R, 3), d = r(R, -20, 20);
  switch (t) {
    case 'point': return { segs: [], angles: [], points: [{ at: [0, 0], name: L[0]!, dir: 45 }], pad: 120, maxS: 1 };
    case 'line': return { segs: [{ id: 'l', a: at([0, 0], d + 180, 220), b: at([0, 0], d, 220), kind: 'line' }], angles: [], points: [{ at: at([0, 0], d + 180, 120), name: L[0]!, dir: d + 90 }, { at: at([0, 0], d, 120), name: L[1]!, dir: d + 90 }], pad: 70 };
    case 'plane': { const P: Pt[] = [[-200, -110], [140, -110], [220, 110], [-120, 110]]; return { segs: P.map((p, i) => ({ id: 'e' + i, a: p, b: P[(i + 1) % 4]!, col: 'faint' as const })), angles: [], points: [{ at: [20, 0], name: L[0]!, dir: 0, dist: 0, dot: false }], fills: [{ pts: P, col: 'second', alpha: 0.28 }], pad: 60 }; }
    case 'segment': return { segs: [{ id: 's', a: at([0, 0], d + 180, 200), b: at([0, 0], d, 200) }], angles: [], points: [{ at: at([0, 0], d + 180, 200), name: L[0]!, dir: d + 90 }, { at: at([0, 0], d, 200), name: L[1]!, dir: d + 90 }], pad: 80 };
    case 'ray': return { segs: [{ id: 'r', a: at([0, 0], d + 180, 200), b: at([0, 0], d, 230), kind: 'ray' }], angles: [], points: [{ at: at([0, 0], d + 180, 200), name: L[0]!, dir: d + 90 }, { at: at([0, 0], d, 60), name: L[1]!, dir: d + 90 }], pad: 70 };
    case 'angle': { const F = fan(L[1]!, [{ name: L[0]!, deg: d, len: 260 }, { name: L[2]!, deg: d + r(R, 50, 80), len: 260 }]); return F.fig; }
    default: {   // circle
      const n = 48, segs: GSeg[] = Array.from({ length: n }, (_, i) => ({ id: 'c' + i, a: at([0, 0], (360 * i) / n, 190), b: at([0, 0], (360 * (i + 1)) / n, 190) }));
      return { segs, angles: [], points: [{ at: [0, 0], name: L[0]!, dir: 270, dist: 44 }], pad: 70 };
    }
  }
}
const UNDEF = ['point', 'line', 'plane'], DEFINED = ['segment', 'ray', 'angle', 'circle'];
export const undefTerm: Gen = (R, n) => fitted('undefTerm', () => {
  const askUndef = R() < 0.55;
  const terms = askUndef ? [pick(R, UNDEF), ...shuffle(R, DEFINED.slice()).slice(0, 3)] : [...UNDEF, pick(R, DEFINED)];
  const right = askUndef ? terms[0]! : terms[3]!;
  const order = shuffle(R, terms.slice());
  const base: Base = {
    id: `undefTerm-${n}`, family: 'undefTerm',
    prompt: askUndef ? 'Our course starts from <b>undefined terms</b>: words it describes but does not define. Which of these four is one of them?' : 'Three of these are undefined terms of our course. Which one is <b>defined</b> from the others?',
    board: order.join(', '),
    solution: [`The undefined terms of our course are point, line and plane.`, askUndef ? `Segment, ray, angle and circle are all defined from them (a segment is two points of a line and every point between them).` : `${right.charAt(0).toUpperCase() + right.slice(1)} is defined from points and lines.`],
    picture: { gallery: { figs: order.map(t => termFig(t, R)), caps: order } },
  };
  return choiceItem(R, base, order.map(t => {
    if (t === right) return { t, ok: true, say: askUndef ? `Yes: ${t} is one of the starting words (point, line, plane).` : `Yes: a ${t} is defined from points and lines.` };
    if (askUndef) return { t, say: `A ${t} is defined from points and lines, so it is not a starting word.` };
    return { t, mc: MC.everyDefined, say: `${t.charAt(0).toUpperCase() + t.slice(1)} is a starting word: defining it would need other words, which need definitions too.` };
  }), true);
});

export const markVsObject: Gen = (R, n) => {
  const v = r(R, 0, 3), L = letters(R, 2), w = pick(R, [1, 2, 3, 4]), len = r(R, 8, 22);
  const sol = ['A drawing only shows where a point or a line is.', 'The point itself has no size, and a line has no ends.'];
  if (v === 0) return choiceItem(R, {
    id: `markVsObject-${n}`, family: 'markVsObject', prompt: `You mark point ${L[0]} with a dot ${w} mm wide. How wide is point ${L[0]}?`, board: `${L[0]}: ${w}\\text{ mm dot}`, solution: sol,
    picture: { card: { lines: [`A dot ${w} mm wide marks point ${A(L[0]!)}.`, 'How wide is the point?'] } },
  }, [
    { t: 'It has no width: the dot only shows where the point is', ok: true, say: 'Right: a point has a place but no size. The dot is only a mark for it.' },
    { t: `${w} mm, the width of the dot`, mc: MC.drawnMark, say: 'That is the width of the mark, not of the point. A point has no size.' },
    { t: `${w / 2} mm, half the dot`, mc: MC.drawnMark, say: 'A point has no size at all; the dot just shows where it is.' },
    { t: 'It depends on how sharp the pencil is', mc: MC.drawnMark, say: 'A sharper pencil changes the mark, not the point. The point has no size.' },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `markVsObject-${n}`, family: 'markVsObject', prompt: `On your paper, line ${L[0]}${L[1]} is drawn ${len} cm long, with an arrowhead at each end. How long is line ${L[0]}${L[1]}?`, board: `\\overleftrightarrow{${L[0]}${L[1]}}: ${len}\\text{ cm drawn}`, solution: sol,
    picture: { card: { lines: [`Line ${A(L[0]! + L[1]!)} is drawn ${len} cm long.`, 'How long is the line?'] } },
  }, [
    { t: 'It has no length: a line goes on forever both ways; the drawing shows a piece', ok: true, say: 'Right: the arrowheads say the line keeps going. Only a segment has a length.' },
    { t: `${len} cm`, mc: MC.drawnMark, say: `${len} cm is the drawn piece. The arrowheads mean the line goes on forever.` },
    { t: `${len} cm plus the two arrowheads`, mc: MC.drawnMark, say: 'The arrowheads are not extra length: they say the line never ends.' },
  ]);
  if (v === 2) return choiceItem(R, {
    id: `markVsObject-${n}`, family: 'markVsObject', prompt: `Two lines drawn with a thick marker cross. The crossing looks like a blob about ${w} mm wide. How many points do the two lines share?`, board: `\\text{two lines cross}`, solution: ['Two different lines cross in exactly one point.', 'The blob is the ink of two thick marks; the lines themselves have no width.'],
    picture: { card: { lines: ['Two lines cross.', `The ink at the crossing is ${w} mm wide.`, 'How many points do they share?'] } },
  }, [
    { t: 'Exactly one point', ok: true, say: 'Right: two different lines meet in one point. The ink blob is just the marks.' },
    { t: `A whole patch of points, ${w} mm wide`, mc: MC.drawnMark, say: 'The patch is ink. Lines have no width, so they share one point only.' },
    { t: 'Two points, one on each edge of the blob', mc: MC.drawnMark, say: 'Two lines that shared two points would be the same line. They share one point.' },
  ]);
  return choiceItem(R, {
    id: `markVsObject-${n}`, family: 'markVsObject', prompt: `Why does our course leave “point” <b>undefined</b> (point ${L[0]})?`, board: '\\text{point: undefined}', solution: ['Every definition uses other words.', 'If every word needed a definition, the chain would go in circles or never end, so it starts from a few undefined words.'],
    picture: { card: { lines: ['Undefined terms: point, line, plane.', 'Why not define point?'] } },
  }, [
    { t: 'A definition uses other words; the chain of definitions has to start somewhere', ok: true, say: 'Right: a few words are taken as starting points, and everything else is defined from them.' },
    { t: 'Nobody has found a good enough definition yet', mc: MC.everyDefined, say: 'It is not missing: any definition would need more words, so some words must come first.' },
    { t: 'A point is just the dot you draw, so there is nothing to define', mc: MC.drawnMark, say: 'The dot is a mark for a point, not the point itself.' },
  ]);
};

// ======================= 2 definitions fix meanings =======================
export const tiltedDef: Gen = (R, n) => fitted('tiltedDef', () => {
  const v = r(R, 0, 3), d = r(R, 15, 70) * (R() < 0.5 ? 1 : -1), L = letters(R, 5).filter(x => x !== 'M');
  const yes = { t: 'Yes: it meets every condition of the definition', ok: true, say: 'Right: the definition says nothing about which way the figure is turned.' };
  if (v === 0) {
    const fig = twoLines(d, 90, { box: true, names: ['ℓ', 'm'] });
    return choiceItem(R, {
      id: `tiltedDef-${n}`, family: 'tiltedDef', prompt: `Definition: <b>perpendicular lines</b> are two lines that meet to form right angles. Are lines ℓ and m perpendicular?`, board: '\\ell, m', solution: ['The box marks a right angle where ℓ and m meet.', 'The definition asks only for right angles; turning the page changes nothing.'],
      picture: { fig, reveal: { glow: ['x'] } },
    }, [yes,
      { t: 'No: one line has to be vertical and the other horizontal', mc: MC.prototype, say: 'That is the usual picture, not the definition. Only the right angle counts.' },
      { t: 'Only after you turn the page so ℓ is level', mc: MC.prototype, say: 'Turning the page does not change the lines. They meet at a right angle now.' }]);
  }
  if (v === 1) {
    const a = r(R, 78, 86), dd = r(R, -6, 6);
    const fig = twoLines(dd, a, { text: `${a}°`, names: ['ℓ', 'm'] });
    return choiceItem(R, {
      id: `tiltedDef-${n}`, family: 'tiltedDef', prompt: `Definition: <b>perpendicular lines</b> are two lines that meet to form right angles. Are lines ℓ and m perpendicular?`, board: `${a}^\\circ`, solution: [`The lines meet at ${a}°, not 90°.`, 'Looking almost upright is not a condition of the definition; the right angle is.'],
      picture: { fig, reveal: { glow: ['x'] } },
    }, [
      { t: `No: they meet at ${a}°, not at a right angle`, ok: true, say: 'Right: the definition needs right angles, and this angle is not one.' },
      { t: 'Yes: one line is level and the other stands almost upright', mc: MC.prototype, say: 'Upright-looking is the usual picture, not the definition. The angle is not 90°.' },
      { t: 'Yes: any two lines that cross are perpendicular', say: 'Crossing is not enough: the definition needs right angles.' }]);
  }
  if (v === 2) {
    const a = r(R, 150, 210);
    const fig = onLine([L[0]!, 'M', L[2] === 'M' ? 'N' : L[2]!], [0, a, 2 * a], { ticks: [1, 1], deg: d });
    const seg = segN(L[0]! + (L[2] === 'M' ? 'N' : L[2]!));
    return choiceItem(R, {
      id: `tiltedDef-${n}`, family: 'tiltedDef', prompt: `Definition: the <b>midpoint</b> of a segment is the point on the segment that splits it into two congruent segments. Is M the midpoint of ${seg}?`, board: `M`, solution: ['M lies on the segment, and the tick marks say the two parts are congruent.', 'The slant of the segment is not part of the definition.'],
      picture: { fig },
    }, [yes,
      { t: 'No: a midpoint sits on a level segment', mc: MC.prototype, say: 'Level is the usual picture, not the definition. M meets both conditions.' },
      { t: 'You cannot tell until the segment is turned level', mc: MC.prototype, say: 'The marks already say it: M is on the segment and the parts are congruent.' }]);
  }
  const fig = rightAngle(d + (d < 0 ? 180 : 0), [L[0]!, L[1]!, L[2]!]);
  return choiceItem(R, {
    id: `tiltedDef-${n}`, family: 'tiltedDef', prompt: `Definition: a <b>right angle</b> is an angle whose measure is 90°. Is ∠${L[0]}${L[1]}${L[2]} a right angle?`, board: `\\angle ${L[0]}${L[1]}${L[2]}`, solution: ['The box marks the angle as 90°.', 'Which way its sides point is not part of the definition.'],
    picture: { fig, reveal: { glow: ['r'] } },
  }, [yes,
    { t: 'No: the sides of a right angle point straight up and straight across', mc: MC.prototype, say: 'That is the usual picture. The definition only asks for 90°.' },
    { t: 'No: its sides are not level', mc: MC.prototype, say: 'Level sides are not a condition; the 90° is.' }]);
});

interface DefCase { term: (L: string[]) => string; right: (L: string[]) => string; wrong: { t: (L: string[]) => string; mc?: string; say: string }[] }
const DEFS: DefCase[] = [
  { term: L => `the midpoint of ${segN(L[0]! + L[1]!)}`, right: L => `the point M on ${segN(L[0]! + L[1]!)} with ${L[0]}M = M${L[1]}`, wrong: [
    { t: () => 'the dot drawn in the middle of a segment', mc: MC.prototype, say: 'A drawn dot can be off. The definition is a condition: on the segment, equal parts.' },
    { t: L => `any point M with ${L[0]}M = M${L[1]}`, mc: MC.midMis, say: 'That lets in points off the segment. A midpoint must also lie on it.' },
    { t: () => 'a point that cuts a segment', say: 'Too loose: any point of the segment cuts it.' }] },
  { term: L => `a bisector of ∠${L[0]}${L[1]}${L[2]}`, right: L => `a ray from ${L[1]} that splits ∠${L[0]}${L[1]}${L[2]} into two angles of equal measure`, wrong: [
    { t: () => 'a ray that points straight up through the middle of the angle', mc: MC.prototype, say: 'Straight up is a picture. The condition is two equal parts.' },
    { t: L => `the ray from ${L[1]} through the midpoint of any segment joining the two sides`, mc: MC.bisArb, say: 'Through the midpoint of an arbitrary segment the parts need not be equal.' },
    { t: L => `any ray from ${L[1]} inside the angle`, say: 'Too loose: most rays inside split the angle unequally.' }] },
  { term: L => `perpendicular lines ${L[0]}${L[1]} and ${L[1]}${L[2]}`, right: () => 'two lines that meet to form right angles', wrong: [
    { t: () => 'a vertical line and a horizontal line', mc: MC.prototype, say: 'That is the usual picture. Tilted lines can be perpendicular too.' },
    { t: () => 'two lines that cross', say: 'Too loose: lines can cross at any angle.' },
    { t: () => 'two lines drawn with a square corner', mc: MC.prototype, say: 'The drawing is a sketch; the condition is right angles.' }] },
  { term: L => `a circle with center ${L[0]}`, right: L => `all the points in a plane at one given distance from ${L[0]}`, wrong: [
    { t: () => 'a round shape', mc: MC.prototype, say: 'An oval is round too. The definition fixes one distance from the center.' },
    { t: () => 'a closed curve with no corners', say: 'An oval fits that, and it is not a circle.' },
    { t: L => `a shape drawn around ${L[0]} with a compass`, mc: MC.prototype, say: 'That is how we draw one, not what it is: one distance from the center.' }] },
  { term: L => `parallel lines ${L[0]}${L[1]} and ${L[2]}${L[3]}`, right: () => 'lines in the same plane that never meet', wrong: [
    { t: () => 'two lines that never meet', mc: MC.skew, say: 'Two edges of a box can miss each other without being parallel: they must be in one plane.' },
    { t: () => 'two lines drawn side by side, pointing the same way', mc: MC.prototype, say: 'That is the usual picture, not a condition you can check.' },
    { t: () => 'two lines with the same length', say: 'Lines have no length.' }] },
  { term: L => `congruent segments ${segN(L[0]! + L[1]!)} and ${segN(L[2]! + L[3]!)}`, right: () => 'segments that have equal lengths', wrong: [
    { t: () => 'segments that look the same in the drawing', mc: MC.appearance, say: 'Looks can be off. Congruent means equal lengths.' },
    { t: () => 'segments that are both level', mc: MC.prototype, say: 'Direction has nothing to do with it: equal lengths.' },
    { t: () => 'segments that are parallel', say: 'Parallel segments can have different lengths.' }] },
];
export const pickDef: Gen = (R, n) => {
  const L = letters(R, 6).filter(x => x !== 'M');
  if (R() < 0.2) {
    const nm = pick(R, NAMES), [shape, extra, why] = pick(R, [
      ['square', 'its diagonals are congruent', 'they follow from four right angles and four equal sides'],
      ['rectangle', 'its opposite sides are parallel', 'that follows from the four right angles'],
      ['midpoint', `${L[0]}M = ½·${L[0]}${L[1]}`, 'it follows from the definition and the Segment Addition Postulate'],
    ] as const);
    return choiceItem(R, {
      id: `pickDef-${n}`, family: 'pickDef', prompt: `${nm} says the definition of a ${shape} is not finished until it also says that ${extra}. Is ${nm} right?`, board: `\\text{${shape}}`, solution: ['A definition only needs enough conditions to pick out exactly the right figures.', `Other properties are proved from it: ${why}.`],
      picture: { card: { lines: [`${nm}: “A definition must list`, `${A('every')} property.”`] } },
    }, [
      { t: 'No: a definition needs just enough to pick out the figures; other properties are proved', ok: true, say: 'Right: a definition names; the other properties are theorems you prove from it.' },
      { t: 'Yes: a definition has to list every property', mc: MC.listAll, say: 'Then definitions would never end. The other properties follow from it.' },
      { t: 'Yes: otherwise the definition would be false', mc: MC.listAll, say: 'A shorter definition is not false: it picks out the same figures.' },
    ]);
  }
  const c = pick(R, DEFS);
  const term = c.term(L);
  return choiceItem(R, {
    id: `pickDef-${n}`, family: 'pickDef', prompt: `Which sentence <b>defines</b> ${term}?`, board: term, solution: ['A definition is a condition you can check, not a description of the usual picture.', `${c.right(L).charAt(0).toUpperCase() + c.right(L).slice(1)}.`],
    picture: { card: { lines: [`Define ${term}.`] } },
  }, [{ t: c.right(L), ok: true, say: 'Right: every figure that meets this condition is one, and nothing else is.' }, ...c.wrong.map(w => ({ t: w.t(L), mc: w.mc, say: w.say }))]);
};

// ======================= 3 testing a definition =======================
interface DefTest { def: string; cells: { fig: Fig; cap: string; fits: boolean; example: boolean }[]; verdict: 'broad' | 'narrow' | 'works'; why: string; mcWorks?: string }
function defTest(R: () => number, want3: boolean): DefTest {
  const v = r(R, 0, 6), L = letters(R, 9).filter(x => x !== 'M' && x !== 'P' && x !== 'E');
  const cell = (fig: Fig, example: boolean, fits: boolean, cap?: string) => ({ fig, cap: cap ?? (example ? 'example' : 'non-example'), fits, example });
  const tilt = () => r(R, 20, 65) * (R() < 0.5 ? 1 : -1);
  switch (v) {
    case 0: {   // square: four equal sides -> too broad (rhombus)
      const ac = r(R, 55, 75);
      const cells = [cell(quad('square', r(R, -10, 10)), true, true), cell(quad('rhombus', r(R, -10, 10), ac), false, true)];
      if (want3) cells.push(cell(quad('rect', r(R, -10, 10)), false, false));
      return { def: 'A square is a quadrilateral with four equal sides.', cells, verdict: 'broad', why: `The rhombus has four equal sides but angles of ${ac}° and ${180 - ac}°: the definition lets in a non-example.` };
    }
    case 1: {   // parallel = never meet -> too broad (skew edges of a box)
      const N = 'ABCDEFGH'.split('');
      const bx = box3d(N);
      bx.segs = bx.segs.map(s => (s.id === 'AB' || s.id === 'CG' ? { ...s, col: 'first' as const } : s));
      const par = twoLines(r(R, -15, 15), 0.0001, {});
      const pr: Fig = { segs: [{ id: 'l1', a: [-260, 70], b: [260, 70], kind: 'line', par: 1, parAt: 0.7 }, { id: 'l2', a: [-260, -70], b: [260, -70], kind: 'line', par: 1, parAt: 0.7 }], angles: [], points: [], pad: 90 };
      void par;
      const cells = [cell(pr, true, true), cell(bx, false, true, 'non-example: AB and CG are not in one plane')];
      return { def: 'Parallel lines are lines that never meet.', cells, verdict: 'broad', why: 'Edges AB and CG of the box never meet, but they are not in one plane, so they are not parallel. The definition needs “in the same plane”.', mcWorks: MC.skew };
    }
    case 2: {   // right angle = horizontal + vertical rays -> too narrow
      const d = tilt();
      const cells = [cell(rightAngle(d), true, false), cell(twoLines(0, r(R, 100, 120), { text: undefined }), false, false)];
      cells[1]!.fig = (() => { const a = r(R, 100, 125); const f = fan('', [{ name: '', deg: 0 }, { name: '', deg: a }]).fig; f.points = []; f.angles = [{ id: 'x', v: [0, 0], p: [100, 0], q: at([0, 0], a, 100), text: `${a}°` }]; return f; })();
      if (want3) cells.push(cell(rightAngle(0), true, true));
      return { def: 'A right angle is an angle with one horizontal side and one vertical side.', cells, verdict: 'narrow', why: 'The tilted right angle is an example, but its sides are neither horizontal nor vertical: the definition leaves it out.', mcWorks: MC.prototype };
    }
    case 3: {   // midpoint, correct
      const a = r(R, 140, 190), h = r(R, 130, 190);
      const m = onLine([L[0]!, 'M', L[1]!], [0, a, 2 * a], { ticks: [1, 1] });
      const pOff: Fig = { segs: [{ id: 'ab', a: [-a, 0], b: [a, 0] }, { id: 'pa', a: [0, h], b: [-a, 0], ticks: 1, col: 'faint' }, { id: 'pb', a: [0, h], b: [a, 0], ticks: 1, col: 'faint' }], angles: [], points: [{ at: [-a, 0], name: L[0]!, dir: 225 }, { at: [a, 0], name: L[1]!, dir: 315 }, { at: [0, h], name: 'P', dir: 90 }], pad: 80 };
      const cells = [cell(m, true, true), cell(pOff, false, false)];
      return { def: `The midpoint of ${segN(L[0]! + L[1]!)} is the point M on ${segN(L[0]! + L[1]!)} with ${L[0]}M = M${L[1]}.`, cells, verdict: 'works', why: `M is in. P has P${L[0]} = P${L[1]} but is not on the segment, so it stays out. The definition fits.` };
    }
    case 4: {   // perpendicular = lines that cross -> too broad
      const a = r(R, 50, 70);
      const cells = [cell(twoLines(tilt(), 90, { box: true }), true, true), cell(twoLines(r(R, -10, 10), a, { text: `${a}°` }), false, true)];
      return { def: 'Perpendicular lines are lines that cross.', cells, verdict: 'broad', why: `The lines that cross at ${a}° are a non-example, but the definition lets them in.` };
    }
    case 5: {   // perpendicular = vertical + horizontal -> too narrow
      const cells = [cell(twoLines(tilt(), 90, { box: true }), true, false), cell(twoLines(r(R, -10, 10), r(R, 55, 70), {}), false, false)];
      return { def: 'Perpendicular lines are a vertical line and a horizontal line that meet.', cells, verdict: 'narrow', why: 'The tilted pair meets at a right angle, so it is an example, but the definition leaves it out.', mcWorks: MC.prototype };
    }
    default: {   // angle bisector, correct
      const h = r(R, 28, 38), a0 = r(R, -10, 15), p1 = r(R, 22, 30), p2 = r(R, 42, 55);
      const F = fan(L[1]!, [{ name: L[0]!, deg: a0 }, { name: L[3]!, deg: a0 + h }, { name: L[2]!, deg: a0 + 2 * h }]);
      F.fig.angles = [mark('x', F.end, L[1]!, L[0]!, L[3]!, { col: 'second', r: 80 }), mark('y', F.end, L[1]!, L[3]!, L[2]!, { col: 'second', r: 80 })];
      const G = fan(L[1]!, [{ name: L[0]!, deg: a0 }, { name: 'E', deg: a0 + p1 }, { name: L[2]!, deg: a0 + p1 + p2 }]);
      G.fig.angles = [mark('x', G.end, L[1]!, L[0]!, 'E', { text: `${p1}°`, r: 70 }), mark('y', G.end, L[1]!, 'E', L[2]!, { text: `${p2}°`, r: 70 })];
      return { def: `A bisector of ∠${L[0]}${L[1]}${L[2]} is a ray from ${L[1]} that splits it into two angles of equal measure.`, cells: [cell(F.fig, true, true), cell(G.fig, false, false)], verdict: 'works', why: `The marked ray splits the angle equally, so it is in; the ray to E makes ${p1}° and ${p2}°, so it is out.` };
    }
  }
}
const VERD = {
  broad: 'Too broad: it lets in a non-example',
  narrow: 'Too narrow: it leaves out an example',
  works: 'It works: every example is in, every non-example is out',
};
export const defVerdict: Gen = (R, n) => fitted('defVerdict', () => {
  const T = defTest(R, false);
  const cells = shuffle(R, T.cells.slice());
  return choiceItem(R, {
    id: `defVerdict-${n}`, family: 'defVerdict', prompt: `Proposed definition: ${q(T.def)} Test it on the figures. It is:`, board: T.def,
    solution: [T.why],
    picture: { gallery: { figs: cells.map(c => c.fig), caps: cells.map(c => c.cap) } },
  }, (['broad', 'narrow', 'works'] as const).map(k => ({
    t: VERD[k], ok: k === T.verdict,
    mc: k === 'works' && T.verdict !== 'works' ? T.mcWorks : undefined,
    say: k === T.verdict ? `Right. ${T.why}` : T.why,
  })), true);
});
export const whichBreaks: Gen = (R, n) => fitted('whichBreaks', () => {
  for (;;) {
    const T = defTest(R, true);
    if (T.cells.length < 3 && T.verdict !== 'works') continue;
    const cells = shuffle(R, T.cells.slice());
    const tags = cells.map((_, i) => String.fromCharCode(65 + i));
    const bad = cells.findIndex(c => c.fits !== c.example);
    return choiceItem(R, {
      id: `whichBreaks-${n}`, family: 'whichBreaks', prompt: `Proposed definition: ${q(T.def)} Each figure is labeled as an example or a non-example. Which figure does the definition get <b>wrong</b>?`, board: T.def,
      solution: [T.why],
      picture: { gallery: { figs: cells.map(c => c.fig), caps: cells.map((c, i) => `${tags[i]}: ${c.cap}`), tags }, reveal: { cell: bad >= 0 ? bad : undefined } },
    }, [
      ...cells.map((c, i) => ({ t: `Figure ${tags[i]}`, ok: i === bad, mc: i !== bad && c.example && T.mcWorks === MC.prototype ? undefined : undefined, say: i === bad ? `Right. ${T.why}` : c.example ? `Figure ${tags[i]} is an example${c.fits ? ', and the definition lets it in' : ''}. ${T.why}` : `Figure ${tags[i]} is a non-example${c.fits ? '' : ', and the definition keeps it out'}. ${T.why}` })),
      { t: 'None: the definition works', ok: bad < 0, mc: bad >= 0 ? T.mcWorks : undefined, say: bad < 0 ? `Right. ${T.why}` : T.why },
    ], true);
  }
});

// ======================= 4 postulates =======================
type Kind = 'Definition' | 'Postulate' | 'Theorem' | 'Conjecture';
const KIND_BANK: { s: (L: string[]) => string; how: (nm: string, k: number) => string; kind: Kind }[] = [
  { s: L => `The midpoint of ${segN(L[0]! + L[1]!)} is the point M on it with ${L[0]}M = M${L[1]}.`, how: () => 'It says what the word “midpoint” means.', kind: 'Definition' },
  { s: () => 'Congruent segments are segments that have equal lengths.', how: () => 'It says what the word “congruent” means for segments.', kind: 'Definition' },
  { s: () => 'A linear pair is two adjacent angles whose outer sides are opposite rays.', how: () => 'It gives the name “linear pair” to a kind of angle pair.', kind: 'Definition' },
  { s: () => 'Through any two points there is exactly one line.', how: () => 'The course accepts it as a starting statement, without proof.', kind: 'Postulate' },
  { s: L => `If ${L[1]} is between ${L[0]} and ${L[2]}, then ${L[0]}${L[1]} + ${L[1]}${L[2]} = ${L[0]}${L[2]}.`, how: () => 'The course accepts it as a starting statement, without proof.', kind: 'Postulate' },
  { s: () => 'If two angles form a linear pair, then they are supplementary.', how: () => 'The course accepts it without proof, as a starting statement.', kind: 'Postulate' },
  { s: () => 'Through a point not on a line there is exactly one line parallel to it.', how: () => 'The course accepts it without proof, as a starting statement.', kind: 'Postulate' },
  { s: () => 'Vertical angles are congruent.', how: () => 'It was proved from the Linear Pair Postulate and properties of equality.', kind: 'Theorem' },
  { s: () => 'If two angles are supplementary to the same angle, then they are congruent.', how: () => 'It was proved from the definition of supplementary angles and properties of equality.', kind: 'Theorem' },
  { s: () => 'If two parallel lines are cut by a transversal, then alternate interior angles are congruent.', how: () => 'It was proved from the Corresponding Angles Postulate and the Vertical Angles Theorem.', kind: 'Theorem' },
  { s: () => 'The three angle bisectors of a triangle meet in one point.', how: (nm, k) => `${nm} saw it happen in ${k} drawings made with geometry software. Nobody has proved it yet.`, kind: 'Conjecture' },
  { s: () => 'If two angles are both acute, then they are complementary.', how: (nm, k) => `${nm} noticed it in ${Math.min(k, 3)} drawings and wrote it down. Nobody has proved it.`, kind: 'Conjecture' },
  { s: () => 'The diagonals of a rectangle are congruent.', how: (nm, k) => `${nm} measured ${k} rectangles and the diagonals always matched. No proof yet.`, kind: 'Conjecture' },
];
const KIND_MC = (truth: Kind, said: Kind): string | undefined => {
  if ((truth === 'Postulate' && said === 'Definition') || (truth === 'Definition' && said === 'Postulate')) return MC.postDef;
  if (truth === 'Postulate' && (said === 'Conjecture' || said === 'Theorem')) return MC.postThm;
  if (truth === 'Conjecture' && said === 'Theorem') return MC.examples;
  return undefined;
};
const KIND_WHY: Record<Kind, string> = {
  Definition: 'A definition only gives a name a meaning; it makes no claim to prove.',
  Postulate: 'A postulate is a claim the course accepts without proof, as a starting point.',
  Theorem: 'A theorem is a claim proved from definitions, postulates and earlier theorems.',
  Conjecture: 'A conjecture is a claim seen in examples but not proved.',
};
export const kindOf: Gen = (R, n) => {
  const L = letters(R, 3), c = pick(R, KIND_BANK), nm = pick(R, NAMES), k = r(R, 5, 40);
  const s = c.s(L), how = c.how(nm, k);
  return choiceItem(R, {
    id: `kindOf-${n}`, family: 'kindOf', prompt: `${q(s)} ${how} What kind of statement is it in our course?`, board: s,
    solution: [how, KIND_WHY[c.kind]],
    picture: { card: { lines: [s, how] } },
  }, (['Definition', 'Postulate', 'Theorem', 'Conjecture'] as Kind[]).map(kd => ({ t: kd, ok: kd === c.kind, mc: kd === c.kind ? undefined : KIND_MC(c.kind, kd), say: kd === c.kind ? `Right. ${KIND_WHY[kd]}` : `${KIND_WHY[c.kind]} ${how}` })), true);
};

/** Segment Addition Postulate with numbers or expressions */
export const segAdd: Gen = (R, n) => fitted('segAdd', () => {
  const [A0, B0, C0] = letters(R, 3) as [string, string, string];
  const v = r(R, 0, 2), unit = pick(R, ['cm', 'in.', 'units']);
  if (v < 2) {
    const a = r(R, 4, 19), b = r(R, 4, 19), t = a + b, s = 600 / t;
    const askWhole = v === 0;
    const fig = onLine([A0, B0, C0], [0, a * s, t * s], { texts: askWhole ? [String(a), String(b)] : [String(a), '?'], alts: askWhole ? undefined : [undefined, String(b)], cols: [undefined, askWhole ? undefined : 'link'], deg: r(R, -8, 8) });
    if (!askWhole) fig.words = [{ at: [0, -95], text: `${A0}${C0} = ${t}` }];
    return numItem({
      id: `segAdd-${n}`, family: 'segAdd', prompt: askWhole ? `${B0} is between ${A0} and ${C0}. ${A0}${B0} = ${a} ${unit} and ${B0}${C0} = ${b} ${unit}. Find ${A0}${C0}.` : `${B0} is between ${A0} and ${C0}. ${A0}${C0} = ${t} ${unit} and ${A0}${B0} = ${a} ${unit}. Find ${B0}${C0}.`,
      board: askWhole ? `${A0}${C0} = ${A0}${B0} + ${B0}${C0}` : `${B0}${C0} = ${A0}${C0} - ${A0}${B0}`, unit,
      solution: [`Segment Addition Postulate: ${A0}${B0} + ${B0}${C0} = ${A0}${C0}.`, askWhole ? `${a} + ${b} = ${ans(t)}` : `${a} + ${B0}${C0} = ${t}, so ${B0}${C0} = ${ans(b)}`],
      picture: { fig, reveal: { solved: askWhole ? [] : ['p1'] } },
    }, askWhole ? t : b, askWhole ? [] : [{ v: t + a, say: `${B0}${C0} is a part of ${A0}${C0}, so it is smaller than ${t}: subtract.` }], 'Right: the parts add up to the whole segment.', `Use ${A0}${B0} + ${B0}${C0} = ${A0}${C0}.`);
  }
  // expressions: AB = px + a, BC = qx + b, AC = t
  for (;;) {
    const x = r(R, 3, 9), p = r(R, 2, 4), qq = r(R, 1, 3), a = r(R, -4, 8), b = r(R, 1, 9);
    const AB = p * x + a, BC = qq * x + b, t = AB + BC;
    if (AB < 6 || BC < 6 || t > 60) continue;
    const s = 600 / t, ex = (k: number, c: number) => `${k === 1 ? '' : k}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    const askX = R() < 0.5;
    const fig = onLine([A0, B0, C0], [0, AB * s, t * s], { texts: [ex(p, a), ex(qq, b)], deg: r(R, -6, 6) });
    fig.words = [{ at: [0, -95], text: `${A0}${C0} = ${t}` }];
    return numItem({
      id: `segAdd-${n}`, family: 'segAdd', prompt: `${B0} is between ${A0} and ${C0}. ${A0}${B0} = ${ex(p, a)}, ${B0}${C0} = ${ex(qq, b)} and ${A0}${C0} = ${t}. Find ${askX ? '<i>x</i>' : `${A0}${B0}`}.`,
      board: `${p}x ${a < 0 ? '-' : '+'} ${Math.abs(a)} + ${qq}x + ${b} = ${t}`, unit: askX ? '' : 'units',
      solution: [`Segment Addition Postulate: (${ex(p, a)}) + (${ex(qq, b)}) = ${t}.`, `${p + qq}x ${a + b < 0 ? '−' : '+'} ${Math.abs(a + b)} = ${t}, so x = ${x}.`, askX ? `x = ${ans(x)}` : `${A0}${B0} = ${p}·${x} ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${ans(AB)}`],
      picture: { fig },
    }, askX ? x : AB, askX ? [{ v: AB, say: `${AB} is ${A0}${B0}; the question asks for x.` }] : [{ v: x, mc: MC.reportsX, say: `x = ${x}, but the question asks for ${A0}${B0}: put x back in.` }, { v: BC, say: `${BC} is ${B0}${C0}.` }], 'Right.', 'Write the parts as a sum equal to the whole, then solve.');
  }
});

/** Angle Addition Postulate */
export const angleAdd: Gen = (R, n) => fitted('angleAdd', () => {
  const [A0, B0, C0, D0] = letters(R, 4) as [string, string, string, string];
  const v = r(R, 0, 2), a0 = r(R, -15, 20);
  const make = (p: number, w: number, texts: [string, string], alts?: [string | undefined, string | undefined], cols?: ['second' | 'link' | undefined, 'second' | 'link' | undefined]) => {
    const F = fan(B0, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + p }, { name: C0, deg: a0 + w }]);
    F.fig.angles = [mark('x', F.end, B0, A0, D0, { text: texts[0], alt: alts?.[0], col: cols?.[0] ?? 'second', r: 64 }), mark('y', F.end, B0, D0, C0, { text: texts[1], alt: alts?.[1], col: cols?.[1] ?? 'second', r: 64 }), mark('w', F.end, B0, A0, C0, { col: 'first', r: 150, bare: true })];
    return F.fig;
  };
  if (v < 2) {
    const p = r(R, 22, 70), q0 = r(R, 22, 70), w = p + q0;
    if (w > 150) return angleAdd(R, n);
    const askWhole = v === 0;
    const fig = askWhole ? make(p, w, [`${p}°`, `${q0}°`]) : make(p, w, [`${p}°`, '?'], [undefined, `${q0}°`], ['second', 'link']);
    if (!askWhole) fig.words = [{ at: at([0, 0], a0 + w / 2 + 180, 120), text: `m∠${A0}${B0}${C0} = ${w}°` }];
    return numItem({
      id: `angleAdd-${n}`, family: 'angleAdd', prompt: askWhole ? `${D0} is in the interior of ∠${A0}${B0}${C0}. m∠${A0}${B0}${D0} = ${p}° and m∠${D0}${B0}${C0} = ${q0}°. Find m∠${A0}${B0}${C0}.` : `${D0} is in the interior of ∠${A0}${B0}${C0}. m∠${A0}${B0}${C0} = ${w}° and m∠${A0}${B0}${D0} = ${p}°. Find m∠${D0}${B0}${C0}.`,
      board: `m\\angle ${A0}${B0}${D0} + m\\angle ${D0}${B0}${C0} = m\\angle ${A0}${B0}${C0}`, unit: 'degrees',
      solution: [`Angle Addition Postulate: m∠${A0}${B0}${D0} + m∠${D0}${B0}${C0} = m∠${A0}${B0}${C0}.`, askWhole ? `${p} + ${q0} = ${ans(w)}` : `${p} + m∠${D0}${B0}${C0} = ${w}, so m∠${D0}${B0}${C0} = ${ans(q0)}`],
      picture: { fig, reveal: { solved: askWhole ? [] : ['y'] } },
    }, askWhole ? w : q0, askWhole ? [] : [{ v: w + p, say: 'The part is smaller than the whole: subtract.' }, { v: 180 - p, mc: MC.compSupp, say: `The whole is ${w}°, not 180°.` }], 'Right: the two parts add up to the whole angle.', 'Parts add to the whole: use the Angle Addition Postulate.');
  }
  for (;;) {
    const x = r(R, 5, 14), p = r(R, 2, 5), qq = r(R, 1, 4), a = r(R, -10, 15), b = r(R, -5, 20);
    const m1 = p * x + a, m2 = qq * x + b, w = m1 + m2;
    if (m1 < 22 || m2 < 22 || w > 150 || p === qq) continue;
    const ex = (k: number, c: number) => `(${k === 1 ? '' : k}x ${c < 0 ? '−' : '+'} ${Math.abs(c)})°`;
    const askX = R() < 0.4;
    const fig = make(m1, w, [ex(p, a), ex(qq, b)]);
    fig.words = [{ at: at([0, 0], a0 + w / 2 + 180, 120), text: `m∠${A0}${B0}${C0} = ${w}°` }];
    return numItem({
      id: `angleAdd-${n}`, family: 'angleAdd', prompt: `${D0} is in the interior of ∠${A0}${B0}${C0}. m∠${A0}${B0}${D0} = ${ex(p, a)}, m∠${D0}${B0}${C0} = ${ex(qq, b)} and m∠${A0}${B0}${C0} = ${w}°. Find ${askX ? '<i>x</i>' : `m∠${A0}${B0}${D0}`}.`,
      board: `${p}x + ${a} + ${qq}x + ${b} = ${w}`, unit: askX ? '' : 'degrees',
      solution: [`Angle Addition Postulate: ${ex(p, a)} + ${ex(qq, b)} = ${w}°.`, `${p + qq}x ${a + b < 0 ? '−' : '+'} ${Math.abs(a + b)} = ${w}, so x = ${x}.`, askX ? `x = ${ans(x)}` : `m∠${A0}${B0}${D0} = ${p}·${x} ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${ans(m1)}°`],
      picture: { fig },
    }, askX ? x : m1, askX ? [{ v: m1, say: `${m1}° is m∠${A0}${B0}${D0}; the question asks for x.` }] : [{ v: x, mc: MC.reportsX, say: `x = ${x}; put it back in to get the angle.` }, { v: m2, say: `${m2}° is the other part, m∠${D0}${B0}${C0}.` }], 'Right.', 'Write part + part = whole, then solve.');
  }
});

// ======================= 5 the sphere =======================
const PCOL = ['first', 'second', 'pick'] as const;
export const sphereLine: Gen = (R, n) => {
  const askNot = R() < 0.5;
  const lat = pick(R, [30, 35, 40, 45, 50, 55]) * (R() < 0.5 ? 1 : -1);
  const great: GlobePath[] = shuffle(R, [
    { kind: 'great', inc: 0, node: 0, col: 'ink' },
    { kind: 'great', inc: 90, node: r(R, 20, 70), col: 'ink' },
    { kind: 'great', inc: r(R, 30, 60), node: r(R, -40, 40), col: 'ink' },
  ] as GlobePath[]);
  const lats: GlobePath[] = [{ kind: 'lat', lat, col: 'ink' }, { kind: 'lat', lat: -lat * 0.6 + (lat > 0 ? -10 : 10), col: 'ink' }];
  const paths = askNot ? [great[0]!, great[1]!, lats[0]!] : [great[0]!, lats[0]!, lats[1]!];
  const order = shuffle(R, paths.map((p, i) => ({ p, i })));
  const names = ['a', 'b', 'c'];
  const P: GlobePath[] = order.map((o, j) => ({ ...o.p, name: names[j], col: PCOL[j]! }));
  const right = order.findIndex(o => (askNot ? o.p.kind === 'lat' : o.p.kind === 'great'));
  const desc = (p: GlobePath) => (p.kind === 'lat' ? 'a latitude circle, smaller than the sphere’s widest circle' : (p.inc ?? 0) === 0 ? 'the equator, a great circle' : (p.inc ?? 0) === 90 ? 'a meridian, a great circle through both poles' : 'a tilted great circle');
  return choiceItem(R, {
    id: `sphereLine-${n}`, family: 'sphereLine',
    prompt: askNot ? 'On a sphere, a “line” is a <b>great circle</b>: a circle whose center is the center of the sphere (the shortest path along the surface). Which path is <b>not</b> a line on this sphere?' : 'On a sphere, a “line” is a <b>great circle</b>: a circle whose center is the center of the sphere. Which path <b>is</b> a line on this sphere?',
    board: `a, b, c;\\ ${lat}^\\circ`,
    solution: P.map(p => `Path ${p.name} is ${desc(p)}.`),
    picture: { globe: { paths: P }, reveal: { paths: [right] } },
  }, P.map((p, j) => ({
    t: `path ${p.name}`, ok: j === right,
    mc: j !== right && !askNot && p.kind === 'lat' ? MC.latitude : undefined,
    say: j === right ? `Right: path ${p.name} is ${desc(p)}.` : `Path ${p.name} is ${desc(p)}.`,
  })), true);
};
export const sphereTriangle: Gen = (R, n) => {
  const d = pick(R, [45, 50, 60, 70, 80, 90, 100, 110, 120]);
  const askSum = R() < 0.6;
  return numItem({
    id: `sphereTriangle-${n}`, family: 'sphereTriangle',
    prompt: askSum ? `On a globe, a triangle is made by the equator and two meridians that are ${d}° apart. Both meridians meet the equator at right angles. What is the sum of its three angles?` : `On a globe, a triangle is made by the equator and two meridians ${d}° apart. By how many degrees is its angle sum <b>more</b> than 180°?`,
    board: `90 + 90 + ${d}`, unit: 'degrees',
    solution: ['The meridians meet the equator at 90° each.', `At the pole they meet at ${d}°, the gap between them.`, askSum ? `90 + 90 + ${d} = ${ans(180 + d)}°` : `90 + 90 + ${d} = ${180 + d}°, which is ${ans(d)}° more than 180°.`],
    picture: { globe: { paths: [{ kind: 'great', inc: 0, node: 0, col: 'faint' }], tri: d }, reveal: { tri: true } },
  }, askSum ? 180 + d : d, [{ v: 180, mc: MC.euclid, say: `180° is the flat-plane fact. On the sphere two angles are already 90° each, plus ${d}° at the pole.` }, ...(askSum ? [{ v: d, say: `${d}° is only the angle at the pole; add the two right angles.` }] : [{ v: 180 + d, say: `That is the whole sum; the question asks how much more than 180°.` }])], 'Right: on the sphere the angle sum is more than 180°.', 'Add the two right angles at the equator and the angle at the pole.');
};
const SPHERE_STMTS: { s: string; holds: boolean; why: string }[] = [
  { s: 'Through a point not on a line there is exactly one line parallel to it.', holds: false, why: 'On a sphere any two great circles meet, so there are no parallel lines at all.' },
  { s: 'The angles of a triangle add up to 180°.', holds: false, why: 'A triangle of the equator and two meridians already has two right angles plus the angle at the pole.' },
  { s: 'Through any two points there is exactly one line.', holds: false, why: 'Two opposite points (like the poles) lie on infinitely many great circles.' },
  { s: 'Two different lines meet in at most one point.', holds: false, why: 'Two great circles meet in two opposite points.' },
  { s: 'Vertical angles are congruent.', holds: true, why: 'Where two great circles cross, the angles across still come in equal pairs.' },
  { s: 'If two angles form a linear pair, they are supplementary.', holds: true, why: 'Angles along one great circle at a point still make a straight angle, 180°.' },
  { s: 'A circle is the set of points at one given distance from a center.', holds: true, why: 'That is a definition: it still names the same idea on the sphere (distance measured along the surface).' },
  { s: 'An angle is formed by two rays (here: arcs) that start at the same point.', holds: true, why: 'A definition still names the same idea.' },
];
export const holdsOnSphere: Gen = (R, n) => {
  const c = pick(R, SPHERE_STMTS), nm = pick(R, NAMES);
  return choiceItem(R, {
    id: `holdsOnSphere-${n}`, family: 'holdsOnSphere',
    prompt: `${nm} moves from the flat plane to a sphere, where lines are great circles and there is no parallel postulate. Does this statement still hold? ${q(c.s)}`,
    board: c.s,
    solution: [c.why, c.holds ? 'It does not depend on the parallel postulate.' : 'Which statements hold depends on the starting postulates.'],
    picture: { globe: { paths: [{ kind: 'great', inc: 0, node: 0, col: 'first' }, { kind: 'great', inc: 90, node: r(R, 20, 60), col: 'second' }] }, card: { lines: [c.s] } },
  }, [
    { t: 'It still holds on the sphere', ok: c.holds, mc: c.holds ? undefined : MC.euclid, say: c.holds ? `Right. ${c.why}` : c.why },
    { t: 'It changes: it is false on the sphere', ok: !c.holds, say: c.holds ? c.why : `Right. ${c.why}` },
  ], true);
};

// ======================= 6 if-then =======================
interface Cond { hyp: string; conc: string; plain: string; rev?: boolean; about?: string }
function conds(R: () => number): Cond[] {
  const [a, b, c] = [r(R, 1, 4), r(R, 5, 8), 0].map(String);
  const L = letters(R, 3);
  void c;
  return [
    { hyp: `∠${a} and ∠${b} are vertical angles`, conc: `∠${a} ≅ ∠${b}`, plain: 'Vertical angles are congruent.', about: `∠${a} and ∠${b}` },
    { hyp: `∠${a} and ∠${b} form a linear pair`, conc: `m∠${a} + m∠${b} = 180°`, plain: 'Two angles that form a linear pair are supplementary.', about: `∠${a} and ∠${b}` },
    { hyp: `M is the midpoint of ${segN(L[0]! + L[1]!)}`, conc: `${L[0]}M = M${L[1]}`, plain: 'A midpoint splits its segment into two congruent segments.', about: `point M and ${segN(L[0]! + L[1]!)}` },
    { hyp: `${L[1]} is between ${L[0]} and ${L[2]}`, conc: `${L[0]}${L[1]} + ${L[1]}${L[2]} = ${L[0]}${L[2]}`, plain: 'The parts of a segment add up to the whole segment.', about: `points ${L[0]}, ${L[1]}, ${L[2]}` },
    { hyp: `∠${L[0]}${L[1]}${L[2]} is a right angle`, conc: `m∠${L[0]}${L[1]}${L[2]} = 90°`, plain: 'Every right angle measures 90°.', about: `∠${L[0]}${L[1]}${L[2]}` },
    { hyp: `m∠${a} = m∠${b}`, conc: `∠${a} ≅ ∠${b}`, plain: 'Angles with equal measures are congruent.', rev: true },
    { hyp: `ℓ ∥ m and t crosses both`, conc: `corresponding angles are congruent`, plain: 'Parallel lines cut by a transversal make congruent corresponding angles.', about: 'lines ℓ, m and t' },
  ];
}
export const hypConc: Gen = (R, n) => {
  const C = pick(R, conds(R));
  const v = r(R, 0, 2);
  if (v === 2) {
    return choiceItem(R, {
      id: `hypConc-${n}`, family: 'hypConc', prompt: `Theorem: “If ${C.hyp}, then ${C.conc}.” In a proof that uses it, what job does “${C.hyp}” do?`, board: `p \\to q`,
      solution: ['The hypothesis is what must already be true (given or proved) before you may use the theorem.', 'The conclusion is what the theorem then lets you write.'],
      picture: { card: { lines: [`If ${A(C.hyp)},`, `then ${B(C.conc)}.`] } },
    }, [
      { t: 'It must already be known before you may use the theorem', ok: true, say: 'Right: the hypothesis is the condition you check first.' },
      { t: 'It is the answer the theorem gives you', mc: MC.partsReason, say: 'The theorem gives you the conclusion. The hypothesis is what you need first.' },
      { t: 'It is the reason you write in the reason column', mc: MC.partsReason, say: 'The reason column names the theorem itself. The hypothesis must already be a line above.' },
    ]);
  }
  const askHyp = v === 0;
  const form = R() < 0.35 ? `${C.conc.charAt(0).toUpperCase() + C.conc.slice(1)} if ${C.hyp}.` : `If ${C.hyp}, then ${C.conc}.`;
  return choiceItem(R, {
    id: `hypConc-${n}`, family: 'hypConc', prompt: `${q(form)} What is its ${askHyp ? '<b>hypothesis</b>' : '<b>conclusion</b>'}?`, board: form,
    solution: ['The hypothesis is the condition (after “if”, wherever it stands).', `Hypothesis: ${C.hyp}. Conclusion: ${C.conc}.`],
    picture: { card: { lines: [form] }, reveal: { lines: [`hypothesis: ${A(C.hyp)}`, `conclusion: ${B(C.conc)}`] } },
  }, [
    { t: C.hyp, ok: askHyp, mc: askHyp ? undefined : MC.wrongClause, say: askHyp ? 'Right: it is the condition after “if”.' : `That is the hypothesis: it follows “if”. The conclusion is ${C.conc}.` },
    { t: C.conc, ok: !askHyp, mc: askHyp ? MC.wrongClause : undefined, say: askHyp ? `That is the conclusion. The hypothesis is the part after “if”: ${C.hyp}.` : 'Right: it is what the statement promises.' },
    { t: 'the whole sentence', say: 'The hypothesis and the conclusion are each one part of the sentence.' },
  ]);
};
export const toIfThen: Gen = (R, n) => {
  const C = pick(R, conds(R).filter(c => !c.rev));
  const right = `If ${C.hyp}, then ${C.conc}.`;
  return choiceItem(R, {
    id: `toIfThen-${n}`, family: 'toIfThen', prompt: `Write ${q(C.plain)} in if-then form, about ${C.about ?? 'the figures named'}.`, board: C.plain,
    solution: ['The kind of figure the statement is about goes in the hypothesis.', 'What it promises about them goes in the conclusion.'],
    picture: { card: { lines: [C.plain] }, reveal: { lines: [right] } },
  }, [
    { t: right, ok: true, say: 'Right: the condition comes after “if”, the promise after “then”.' },
    { t: `If ${C.conc}, then ${C.hyp}.`, say: 'That swaps the parts: it is the converse, a different statement (and not always true).' },
    { t: `${C.hyp.charAt(0).toUpperCase() + C.hyp.slice(1)} because ${C.conc}.`, mc: MC.partsReason, say: '“Because” turns it into a reason and an answer. If-then is a condition and a promise.' },
  ]);
};

// ======================= 7 conjecture vs theorem =======================
const CONJ = ['the angle bisectors of a triangle meet in one point', 'the diagonals of a rectangle are congruent', 'vertical angles are congruent', 'the midpoints of the sides of any quadrilateral form a parallelogram', 'alternate interior angles of parallel lines are congruent'];
export const conjOrThm: Gen = (R, n) => {
  const nm = pick(R, NAMES), k = r(R, 6, 40), claim = pick(R, CONJ), v = r(R, 0, 4);
  const S0 = [
    { how: `${nm} measured ${k} drawings with a protractor, and every one fit.`, kind: 'Conjecture', mcThm: MC.examples },
    { how: `${nm} dragged the points around in geometry software ${k} times, and it always held.`, kind: 'Conjecture', mcThm: MC.examples },
    { how: `${nm}’s older cousin, a math major, says it is always true. Nobody in the class has seen a proof.`, kind: 'Conjecture', mcThm: MC.authority },
    { how: `${nm}’s class proved it from postulates, definitions and earlier theorems.`, kind: 'Theorem', mcThm: undefined },
    { how: `${nm}’s class wrote a chain of steps, each with a definition, postulate or earlier theorem as its reason, from the givens to the claim.`, kind: 'Theorem', mcThm: undefined },
  ][v]!;
  return choiceItem(R, {
    id: `conjOrThm-${n}`, family: 'conjOrThm', prompt: `Claim: ${claim}. ${S0.how} For ${nm}’s class, the claim is a:`, board: claim,
    solution: [S0.kind === 'Theorem' ? 'A proof from accepted statements makes a claim a theorem.' : 'Examples, measurements and someone’s word are evidence, not a proof.', `So it is a ${S0.kind.toLowerCase()}.`],
    picture: { card: { lines: [`Claim: ${claim}.`, S0.how] } },
  }, ['Conjecture', 'Theorem', 'Postulate'].map(kd => ({
    t: kd, ok: kd === S0.kind,
    mc: kd === S0.kind ? undefined : kd === 'Theorem' ? S0.mcThm : kd === 'Postulate' ? MC.everyPostulate : undefined,
    say: kd === S0.kind ? (kd === 'Theorem' ? 'Right: it was proved.' : 'Right: it is checked, not proved.') : kd === 'Postulate' ? 'A postulate is accepted without proof as a starting statement of the course; this claim was not.' : S0.kind === 'Conjecture' ? 'Checked cases or someone’s word do not prove it for every figure.' : 'It has a proof now, so it is more than a guess.',
  })), true);
};
export const whatMakesThm: Gen = (R, n) => {
  const nm = pick(R, NAMES), k = r(R, 20, 200), claim = pick(R, CONJ);
  return choiceItem(R, {
    id: `whatMakesThm-${n}`, family: 'whatMakesThm', prompt: `${nm} conjectures that ${claim}. What would turn the conjecture into a <b>theorem</b>?`, board: claim,
    solution: ['A theorem is proved: every step follows from definitions, postulates or earlier theorems.'],
    picture: { card: { lines: [`Conjecture: ${claim}.`] } },
  }, [
    { t: 'A proof from definitions, postulates and earlier theorems', ok: true, say: 'Right: a proof covers every figure that meets the conditions.' },
    { t: `Checking ${k} more drawings`, mc: MC.examples, say: `${k} more drawings are more evidence, but they never cover every figure.` },
    { t: 'A teacher or a textbook saying it is true', mc: MC.authority, say: 'Who says it does not make it proved; an argument does.' },
    { t: 'Writing it in if-then form', say: 'If-then form makes it clear, not proved.' },
  ]);
};

// ======================= 8 proof vs claim =======================
function claimSet(R: () => number) {
  // claims that are real theorems (proved from definitions, postulates and properties), never a definition read forward
  const L = letters(R, 6).filter(x => x !== 'M');
  const [p, q, c] = pick(R, [[1, 3, 2], [2, 4, 3], [5, 7, 6], [6, 8, 7]] as const);
  const AB = segN(L[0]! + L[1]!), A0 = L[0]!, B0 = L[1]!;
  return pick(R, [
    { claim: `If ∠${p} and ∠${q} are vertical angles, then ∠${p} ≅ ∠${q}.`, proof: `∠${p} and ∠${q} each form a linear pair with ∠${c}. By the Linear Pair Postulate, m∠${p} + m∠${c} = 180° and m∠${c} + m∠${q} = 180°. By substitution and subtraction, m∠${p} = m∠${q}, so ∠${p} ≅ ∠${q} by the definition of congruent angles.`, circ: `∠${p} ≅ ∠${q}, because vertical angles are congruent.`, def: 'Definition: congruent angles are angles with equal measures.' },
    { claim: `If M is the midpoint of ${AB}, then ${A0}M + ${A0}M = ${A0}${B0}.`, proof: `We are given that M is the midpoint of ${AB}, so ${A0}M = M${B0} by the definition of midpoint. By the Segment Addition Postulate, ${A0}M + M${B0} = ${A0}${B0}. By substitution, ${A0}M + ${A0}M = ${A0}${B0}.`, circ: `${A0}M + ${A0}M = ${A0}${B0}, because that is what the claim says.`, def: 'Definition: a midpoint splits a segment into two congruent segments.' },
    { claim: `If ∠${p} and ∠${q} are both supplementary to ∠${c}, then ∠${p} ≅ ∠${q}.`, proof: `By the definition of supplementary angles, m∠${p} + m∠${c} = 180° and m∠${q} + m∠${c} = 180°. By substitution and subtraction, m∠${p} = m∠${q}, so ∠${p} ≅ ∠${q} by the definition of congruent angles.`, circ: `∠${p} ≅ ∠${q}, because two angles supplementary to the same angle are congruent.`, def: 'Definition: supplementary angles are two angles whose measures add to 180°.' },
  ]);
}
const rayNm = (s: string) => `ray ${s}`;
export const whichIsProof: Gen = (R, n) => {
  const C = claimSet(R);
  const cards = shuffle(R, [
    { head: 'Theorem', text: C.claim, kind: 'thm' },
    { head: 'Argument', text: C.proof, kind: 'proof' },
    { head: 'Argument', text: C.circ, kind: 'circ' },
  ]);
  const tags = ['A', 'B', 'C'];
  return choiceItem(R, {
    id: `whichIsProof-${n}`, family: 'whichIsProof', prompt: `Claim: ${q(C.claim)} Which card is a <b>proof</b> of the claim?`, board: C.claim,
    solution: ['A proof is an argument: each step follows from the givens and accepted statements.', 'The theorem card is the claim itself; the definition card is a reason a proof can use.'],
    picture: { cards: cards.map((c, i) => ({ head: `${tags[i]}: ${c.head}`, text: c.text })) },
  }, cards.map((c, i) => ({
    t: `Card ${tags[i]}`, ok: c.kind === 'proof',
    mc: c.kind === 'circ' ? MC.circular : undefined,
    say: c.kind === 'proof' ? 'Right: every step has a reason, and none of them is the claim itself.' : c.kind === 'thm' ? 'That card states the claim; a proof argues for it.' : c.kind === 'circ' ? 'That argument uses the claim as its own reason: it goes in a circle.' : 'A definition is a reason a proof can use, not the proof itself.',
  })), true);
};
export const proofOf: Gen = (R, n) => {
  const C = claimSet(R), v = r(R, 0, 3);
  const card = [
    { head: 'Card', text: C.proof, kind: 'A proof' },
    { head: 'Card', text: C.claim, kind: 'A theorem' },
    { head: 'Card', text: C.def.replace('Definition: ', ''), kind: 'A definition' },
    { head: 'Card', text: pick(R, ['Through any two points there is exactly one line. (accepted without proof)', 'If B is between A and C, then AB + BC = AC. (accepted without proof)']), kind: 'A postulate' },
  ][v]!;
  const WHY: Record<string, string> = { 'A proof': 'It argues: every step comes with a reason (a given, a definition, a postulate or a property).', 'A theorem': 'It is a claim (an if-then statement) that a proof establishes.', 'A definition': 'It says what a word means.', 'A postulate': 'It is a claim accepted without proof.' };
  return choiceItem(R, {
    id: `proofOf-${n}`, family: 'proofOf', prompt: `What is this card?`, board: card.text,
    solution: [WHY[card.kind]!],
    picture: { cards: [card] },
  }, ['A proof', 'A theorem', 'A definition', 'A postulate'].map(k => ({
    t: k, ok: k === card.kind,
    mc: (card.kind === 'A postulate' && k === 'A definition') || (card.kind === 'A definition' && k === 'A postulate') ? MC.postDef : undefined,
    say: k === card.kind ? `Right. ${WHY[k]}` : WHY[card.kind]!,
  })), true);
};

// ======================= 9 givens vs target =======================
export const givenOrProve: Gen = (R, n) => fitted('givenOrProve', () => {
  const L = letters(R, 6).filter(x => x !== 'M'), v = r(R, 0, 2), askGiven = R() < 0.6;
  let fig: Fig, hyp: string, conc: string;
  if (v === 0) { const a = r(R, 150, 200); fig = onLine([L[0]!, 'M', L[1] === 'M' ? 'N' : L[1]!], [0, a, 2 * a], { deg: r(R, -10, 10) }); hyp = `M is the midpoint of ${segN(L[0]! + (L[1] === 'M' ? 'N' : L[1]!))}`; conc = `${L[0]}M = M${L[1] === 'M' ? 'N' : L[1]}`; }
  else if (v === 1) { const h = r(R, 25, 38), a0 = r(R, -10, 15); const F = fan(L[1]!, [{ name: L[0]!, deg: a0 }, { name: L[3]!, deg: a0 + h }, { name: L[2]!, deg: a0 + 2 * h }]); fig = F.fig; hyp = `${rayNm(L[1]! + L[3]!)} bisects ∠${L[0]}${L[1]}${L[2]}`; conc = `m∠${L[0]}${L[1]}${L[3]} = m∠${L[3]}${L[1]}${L[2]}`; }
  else { const a = r(R, 40, 140); const F = fan(L[1]!, [{ name: L[0]!, deg: 0 }, { name: L[3]!, deg: a }, { name: L[2]!, deg: 180 }]); F.fig.segs[0]!.kind = 'ray'; F.fig.angles = [mark('x', F.end, L[1]!, L[0]!, L[3]!, { text: '1', nameOnly: true }), mark('y', F.end, L[1]!, L[3]!, L[2]!, { text: '2', nameOnly: true })]; fig = F.fig; hyp = '∠1 and ∠2 form a linear pair'; conc = 'm∠1 + m∠2 = 180°'; }
  const st = `If ${hyp}, then ${conc}.`;
  return choiceItem(R, {
    id: `givenOrProve-${n}`, family: 'givenOrProve', prompt: `You want to prove ${q(st)} What goes after ${askGiven ? '<b>Given:</b>' : '<b>Prove:</b>'}?`, board: st,
    solution: ['Given = the hypothesis: what this problem lets you start from.', 'Prove = the conclusion: where the proof has to arrive.'],
    picture: { fig, card: { lines: [`If ${A(hyp)},`, `then ${B(conc)}.`] } },
  }, [
    { t: hyp, ok: askGiven, say: askGiven ? 'Right: the hypothesis is what you start from.' : 'That is the hypothesis: it goes after Given.' },
    { t: conc, ok: !askGiven, mc: askGiven ? MC.circular : undefined, say: askGiven ? 'That is what you must prove. Starting from it would assume the answer.' : 'Right: the conclusion is the target.' },
    { t: 'the Segment Addition Postulate', mc: askGiven ? MC.everyPostulate : undefined, say: 'A postulate holds in every problem of the course; the given is what THIS problem states.' },
  ]);
});
export const readGiven: Gen = (R, n) => {
  const L = letters(R, 4), v = r(R, 0, 2);
  if (v === 0) return choiceItem(R, {
    id: `readGiven-${n}`, family: 'readGiven', prompt: `Given: ${L[0]}${L[1]} = ${L[2]}${L[3]}. How do you read it?`, board: `${L[0]}${L[1]} = ${L[2]}${L[3]}`,
    solution: ['Without a bar, AB is a number: the length of segment AB.'],
    picture: { card: { lines: [`Given: ${L[0]}${L[1]} = ${L[2]}${L[3]}`] } },
  }, [
    { t: `The length of ${segN(L[0]! + L[1]!)} equals the length of ${segN(L[2]! + L[3]!)}`, ok: true, say: 'Right: AB without a bar is a length, a number.' },
    { t: `Segment ${L[0]}${L[1]} is the same segment as ${L[2]}${L[3]}`, mc: MC.figMeasure, say: 'The segments are different; their lengths are equal numbers.' },
    { t: `Line ${L[0]}${L[1]} is line ${L[2]}${L[3]}`, mc: MC.figMeasure, say: 'No bar and no arrows: these are lengths, not lines.' },
  ]);
  if (v === 1) return choiceItem(R, {
    id: `readGiven-${n}`, family: 'readGiven', prompt: `Given: ${segN(L[0]! + L[1]!)} ≅ ${segN(L[2]! + L[3]!)}. How do you read it?`, board: `\\overline{${L[0]}${L[1]}} \\cong \\overline{${L[2]}${L[3]}}`,
    solution: ['With a bar, AB names the segment itself (a figure).', '≅ between figures says they are congruent: equal lengths.'],
    picture: { card: { lines: [`Given: ${segN(L[0]! + L[1]!)} ≅ ${segN(L[2]! + L[3]!)}`] } },
  }, [
    { t: `Segment ${L[0]}${L[1]} is congruent to segment ${L[2]}${L[3]}`, ok: true, say: 'Right: bars name segments, ≅ relates figures.' },
    { t: `The number ${L[0]}${L[1]} is about the same as the number ${L[2]}${L[3]}`, mc: MC.figMeasure, say: 'The bars make them segments, and congruent means exactly equal lengths.' },
    { t: `${L[0]}${L[1]} and ${L[2]}${L[3]} are the same segment`, mc: MC.figMeasure, say: 'They are two segments with equal lengths.' },
  ]);
  const g = `${L[0]}${L[1]} = ${L[2]}${L[3]}`;
  return choiceItem(R, {
    id: `readGiven-${n}`, family: 'readGiven', prompt: `Problem: Given: ${g}. Prove: ${L[0]}${L[2]} = ${L[1]}${L[3]}. Which line is a <b>given of this problem</b> (not a postulate that holds in every problem)?`, board: g,
    solution: ['The given is what this problem states.', 'Postulates are accepted for every problem of the course.'],
    picture: { card: { lines: [`Given: ${g}`, `Prove: ${L[0]}${L[2]} = ${L[1]}${L[3]}`] } },
  }, [
    { t: g, ok: true, say: 'Right: only this problem says it.' },
    { t: 'Through any two points there is exactly one line', mc: MC.everyPostulate, say: 'That is a postulate: it holds in every problem, not just this one.' },
    { t: `${L[0]}${L[1]} + ${L[1]}${L[2]} = ${L[0]}${L[2]}`, mc: MC.everyPostulate, say: 'That comes from the Segment Addition Postulate, not from this problem’s givens.' },
    { t: `${L[0]}${L[2]} = ${L[1]}${L[3]}`, mc: MC.circular, say: 'That is what you must prove, not what you are given.' },
  ]);
};
export { add, mul, dirv, at };
export type { GFItem };
