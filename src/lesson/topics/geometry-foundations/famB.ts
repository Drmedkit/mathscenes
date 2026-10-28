// famB.ts: families for notation, congruence vs equality, diagram markings and what a diagram licenses, one-step
// inferences, the direction of an implication, the properties of equality and the first numeric chains
// (sub-goals 11-21).
import { type Fig, type GAngle, type GSeg, type Pt, add, at } from './geo';
import { crossing, fan, letters, mark, onLine, transversal, twoLines } from './figs';
import { type Base, type Gen, type Opt, A, B, MC, NAMES, choiceItem, fitted, numItem, pick, q, r, segN, shuffle, ans } from './kit';
import { RS, type ReasonKey } from './proofs';

const rayN = (s: string) => `ray ${s}`;
const lineN = (s: string) => `line ${s}`;

// ======================= 11 naming angles, figure vs measure =======================
export const nameAngle: Gen = (R, n) => fitted('nameAngle', () => {
  const [A0, V, C0, D0] = letters(R, 4) as [string, string, string, string];
  const a0 = r(R, -30, 40), p = r(R, 30, 60), qq = r(R, 30, 60);
  const F = fan(V, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + p }, { name: C0, deg: a0 + p + qq }]);
  const which = r(R, 0, 2);
  const ends = [[A0, D0], [D0, C0], [A0, C0]][which]!;
  F.fig.angles = [mark('x', F.end, V, ends[0]!, ends[1]!, { col: 'pick', r: which === 2 ? 120 : 76, bare: false })];
  const nm = (x: string, y: string) => (R() < 0.5 ? `∠${x}${V}${y}` : `∠${y}${V}${x}`);
  const right = nm(ends[0]!, ends[1]!);
  const others = [[A0, D0], [D0, C0], [A0, C0]].filter((_, i) => i !== which);
  const key = (vx: string, s: string[]) => vx + [...s].sort().join('');
  const opts: Opt[] = [
    { t: right, ok: true, key: key(V, ends), say: 'Right: the vertex goes in the middle, one point on each side around it.' },
    { t: `∠${V}${ends[0]}${ends[1]}`, mc: MC.threeLetter, key: key(ends[0]!, [V, ends[1]!]), say: `The middle letter is the vertex. ∠${V}${ends[0]}${ends[1]} has its vertex at ${ends[0]}.` },
    { t: nm(others[0]![0]!, others[0]![1]!), key: key(V, others[0]!), say: 'That angle has the right vertex but different sides.' },
    { t: `∠${V}`, say: `Three angles have their vertex at ${V}, so ∠${V} does not say which one.` },
  ];
  return choiceItem(R, {
    id: `nameAngle-${n}`, family: 'nameAngle', prompt: `Three rays start at ${V}. Which name fits the shaded angle?`, board: `${A0}${D0}${C0} ${which}`,
    solution: [`The shaded angle has its vertex at ${V} and its sides through ${ends[0]} and ${ends[1]}.`, `Its name has ${V} in the middle: ${right}.`],
    picture: { fig: F.fig, reveal: { glow: ['x'] } },
  }, opts);
});

export const figVsMeasure: Gen = (R, n, sg) => fitted('figVsMeasure', () => {
  const L = letters(R, 4);
  const v = sg === 'equal-vs-congruent' ? r(R, 2, 3) : sg === 'segment-angle-notation' ? r(R, 0, 1) : r(R, 0, 3);
  if (v === 0) {
    const len = r(R, 3, 19);
    const fig = onLine([L[0]!, L[1]!], [0, 520], { texts: [String(len)], deg: r(R, -20, 20) });
    return choiceItem(R, {
      id: `figVsMeasure-${n}`, family: 'figVsMeasure', prompt: `Segment ${L[0]}${L[1]} is ${len} units long. Which statement is written correctly?`, board: `${len}`,
      solution: [`${segN(L[0]! + L[1]!)} (with a bar) is the segment, a figure.`, `${L[0]}${L[1]} (no bar) is its length, a number: ${L[0]}${L[1]} = ${len}.`],
      picture: { fig },
    }, [
      { t: `${L[0]}${L[1]} = ${len}`, ok: true, say: 'Right: without a bar, AB is the length, a number.' },
      { t: `${segN(L[0]! + L[1]!)} = ${len}`, mc: MC.figMeasure, say: 'With a bar it is the segment itself, a figure. A figure is not a number.' },
      { t: `${lineN(L[0]! + L[1]!)} = ${len}`, mc: MC.figMeasure, say: 'A line goes on forever: it has no length.' },
    ]);
  }
  if (v === 1) {
    const m = r(R, 25, 150), a0 = r(R, -20, 20);
    const F = fan(L[1]!, [{ name: L[0]!, deg: a0 }, { name: L[2]!, deg: a0 + m }]);
    F.fig.angles = [mark('x', F.end, L[1]!, L[0]!, L[2]!, { text: `${m}°`, col: 'second' })];
    return choiceItem(R, {
      id: `figVsMeasure-${n}`, family: 'figVsMeasure', prompt: 'Which statement about the angle is written correctly?', board: `${m}^\\circ`,
      solution: [`∠${L[0]}${L[1]}${L[2]} is the angle, a figure; m∠${L[0]}${L[1]}${L[2]} is its measure, a number.`, `The vertex ${L[1]} goes in the middle.`],
      picture: { fig: F.fig },
    }, [
      { t: `m∠${L[0]}${L[1]}${L[2]} = ${m}°`, ok: true, say: 'Right: “m” makes it a measure, and the vertex is in the middle.' },
      { t: `∠${L[0]}${L[1]}${L[2]} = ${m}°`, mc: MC.figMeasure, say: 'Without “m” it is the angle itself, a figure, not a number of degrees.' },
      { t: `m∠${L[1]}${L[0]}${L[2]} = ${m}°`, mc: MC.threeLetter, say: `The vertex is ${L[1]}, so ${L[1]} must be the middle letter.` },
    ]);
  }
  if (v === 2) {
    const len = r(R, 260, 380);
    const fig: Fig = {
      segs: [{ id: 's1', a: [-len / 2, 110], b: [len / 2, 110], ticks: 2 }, { id: 's2', a: [-len / 2 + 40, -110], b: [len / 2 + 40, -110], ticks: 2 }], angles: [],
      points: [{ at: [-len / 2, 110], name: L[0]!, dir: 180 }, { at: [len / 2, 110], name: L[1]!, dir: 0 }, { at: [-len / 2 + 40, -110], name: L[2]!, dir: 180 }, { at: [len / 2 + 40, -110], name: L[3]!, dir: 0 }], pad: 90,
    };
    const useCong = R() < 0.5;
    const s1 = segN(L[0]! + L[1]!), s2 = segN(L[2]! + L[3]!), l1 = L[0]! + L[1]!, l2 = L[2]! + L[3]!;
    return choiceItem(R, {
      id: `figVsMeasure-${n}`, family: 'figVsMeasure', prompt: `The tick marks say that the segment from ${L[0]} to ${L[1]} and the segment from ${L[2]} to ${L[3]} are congruent. Which statement is written correctly?`, board: `${L.join('')}`,
      solution: ['Figures (segments, with bars) are congruent: ≅.', 'Their lengths (numbers, no bars) are equal: =.'],
      picture: { fig },
    }, [
      { t: useCong ? `${s1} ≅ ${s2}` : `${l1} = ${l2}`, ok: true, say: useCong ? 'Right: ≅ goes between figures.' : 'Right: = goes between numbers, the lengths.' },
      { t: `${s1} = ${s2}`, mc: MC.figMeasure, say: 'Two different segments are not equal; they are congruent (≅), and their lengths are equal.' },
      { t: `${l1} ≅ ${l2}`, mc: MC.figMeasure, say: 'Without bars these are numbers, and numbers are equal (=), not congruent.' },
    ]);
  }
  const m = r(R, 35, 75), sep = 340;
  const one = (o: Pt, d0: number, id: string, t: string): { segs: GSeg[]; angles: GAngle[] } => {
    const p = at(o, d0, 230), qq = at(o, d0 + m, 230);
    return { segs: [{ id: id + 'a', a: o, b: p, kind: 'ray' }, { id: id + 'b', a: o, b: qq, kind: 'ray' }], angles: [{ id, v: o, p, q: qq, text: t, col: 'second', arcs: 1, r: 70 }] };
  };
  const [n1, n2] = pick(R, [[1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [1, 4], [2, 6], [3, 8]]) as [number, number];
  const g1 = one([-sep, 0], r(R, -10, 30), 'a1', String(n1)), g2 = one([sep * 0.4, 0], r(R, -10, 30), 'a2', String(n2));
  const fig: Fig = { segs: [...g1.segs, ...g2.segs], angles: [...g1.angles, ...g2.angles], points: [], pad: 80 };
  const useCong = R() < 0.5;
  return choiceItem(R, {
    id: `figVsMeasure-${n}`, family: 'figVsMeasure', prompt: `The matching arcs say ∠${n1} and ∠${n2} are congruent. Which statement is written correctly?`, board: `${n1}, ${n2}, ${m}`,
    solution: [`Angles (figures) are congruent: ∠${n1} ≅ ∠${n2}.`, `Their measures (numbers) are equal: m∠${n1} = m∠${n2}.`],
    picture: { fig },
  }, [
    { t: useCong ? `∠${n1} ≅ ∠${n2}` : `m∠${n1} = m∠${n2}`, ok: true, say: useCong ? 'Right: ≅ goes between figures.' : 'Right: = goes between measures, which are numbers.' },
    { t: `∠${n1} = ∠${n2}`, mc: MC.figMeasure, say: 'Two different angles are congruent (≅); their measures are equal (=).' },
    { t: `m∠${n1} ≅ m∠${n2}`, mc: MC.figMeasure, say: 'Measures are numbers: numbers are equal (=), not congruent.' },
  ]);
});

export const defSwitch: Gen = (R, n) => {
  const L = letters(R, 6).filter(x => x !== 'M'), v = r(R, 0, 3);
  const [a, b] = [r(R, 1, 4), r(R, 5, 8)];
  const s1 = segN(L[0]! + L[1]!), s2 = segN(L[2]! + L[3]!), l1 = L[0]! + L[1]!, l2 = L[2]! + L[3]!;
  const cases = [
    { g: `${s1} ≅ ${s2}`, by: 'congruent segments', right: `${l1} = ${l2}`, wrong: [[`${s1} = ${s2}`, MC.figMeasure], [`${l1} ≅ ${l2}`, MC.figMeasure], [`${l1} + ${l2} = ${L[0]}${L[3]}`, undefined]] },
    { g: `${l1} = ${l2}`, by: 'congruent segments', right: `${s1} ≅ ${s2}`, wrong: [[`${s1} = ${s2}`, MC.figMeasure], [`${l1} ≅ ${l2}`, MC.figMeasure], [`${L[1]} is the midpoint of ${segN(L[0]! + L[3]!)}`, MC.converse]] },
    { g: `∠${a} ≅ ∠${b}`, by: 'congruent angles', right: `m∠${a} = m∠${b}`, wrong: [[`∠${a} = ∠${b}`, MC.figMeasure], [`m∠${a} + m∠${b} = 180°`, MC.congAsSupp], [`∠${a} and ∠${b} are vertical angles`, MC.converse]] },
    { g: `m∠${a} = m∠${b}`, by: 'congruent angles', right: `∠${a} ≅ ∠${b}`, wrong: [[`∠${a} = ∠${b}`, MC.figMeasure], [`m∠${a} ≅ m∠${b}`, MC.figMeasure], [`∠${a} and ∠${b} are vertical angles`, MC.converse]] },
  ][v]!;
  return choiceItem(R, {
    id: `defSwitch-${n}`, family: 'defSwitch', prompt: `Given: ${cases.g}. Which statement follows by the <b>definition of ${cases.by}</b>?`, board: cases.g,
    solution: [`The definition says: congruent figures ⇔ equal measures. It works in both directions.`, `So from ${cases.g} you may write ${cases.right}.`],
    picture: { card: { lines: [`Given: ${A(cases.g)}`, `Definition of ${cases.by}`] } },
  }, [
    { t: cases.right, ok: true, say: 'Right: the definition switches between ≅ for figures and = for their measures.' },
    ...cases.wrong.map(([t, mc]) => ({ t: t!, mc: mc ?? undefined, say: mc === MC.figMeasure ? '≅ goes between figures, = between numbers (lengths, measures).' : mc === MC.converse ? 'The definition does not say that; equal measures do not make angles vertical (or a point a midpoint).' : 'The definition only switches between ≅ and =.' })),
  ]);
};

// ======================= 13 markings =======================
export const readMark: Gen = (R, n) => fitted('readMark', () => {
  const L = letters(R, 6).filter(x => x !== 'M'), v = r(R, 0, 4);
  const [A0, M, B0, C0] = [L[0]!, 'M', L[1]!, L[2]!];
  const a = r(R, 170, 230);
  const base = (phi: number, o: { ticks?: boolean; box?: boolean }) => {
    const f = onLine([A0, M, B0], [0, a, 2 * a], { ticks: o.ticks ? [1, 1] : undefined });
    const Cp = at([0, 0], phi, 250);
    f.segs.push({ id: 'mc', a: [0, 0], b: Cp });
    f.points.push({ at: Cp, name: C0, dir: phi });
    if (o.box) f.angles.push({ id: 'bx', v: [0, 0], p: [100, 0], q: Cp, box: true, col: 'second' });
    return f;
  };
  if (v <= 1) {
    const phi = v === 1 ? 90 : r(R, 55, 125);
    const fig = base(phi, { ticks: v === 0, box: v === 1 });
    if (v === 0) return choiceItem(R, {
      id: `readMark-${n}`, family: 'readMark', prompt: `Which given do the markings on the figure (points ${A0}, M, ${B0}, ${C0}) code?`, board: `${A0}${B0}${C0}`,
      solution: ['One tick on each of two segments: those segments are congruent.', `So ${A0}M = M${B0}.`],
      picture: { fig },
    }, [
      { t: `${A0}M = M${B0}`, ok: true, say: 'Right: matching ticks mark congruent segments.' },
      { t: `m∠${A0}M${C0} = m∠${C0}M${B0}`, mc: MC.ticksAsArcs, say: 'Ticks sit on segments. Equal angles get matching arcs.' },
      { t: `${A0}M = M${C0}`, mc: MC.wrongPart, say: `The ticks are on ${segN(A0 + 'M')} and ${segN('M' + B0)}, not on ${segN('M' + C0)}.` },
      { t: `M${C0} = M${B0}`, mc: MC.wrongPart, say: `${segN('M' + C0)} has no tick.` },
    ]);
    return choiceItem(R, {
      id: `readMark-${n}`, family: 'readMark', prompt: `Which given does the marking at M code (points ${A0}, M, ${B0}, ${C0})?`, board: `${A0}${B0}${C0}`,
      solution: ['A small square in a corner marks a right angle: 90°.', `It sits between ${rayN('M' + C0)} and ${rayN('M' + B0)}, so ∠${C0}M${B0} is a right angle.`],
      picture: { fig, reveal: { glow: ['bx'] } },
    }, [
      { t: `m∠${C0}M${B0} = 90°`, ok: true, say: 'Right: the box says 90°.' },
      { t: `M${C0} = M${B0}`, mc: MC.wrongPart, say: 'The box is about the angle between the segments, not their lengths.' },
      { t: 'Nothing: a box only decorates the corner', mc: MC.boxValue, say: 'The box is a given: it says the angle is exactly 90°.' },
      { t: `m∠${A0}M${B0} = 90°`, mc: MC.wrongPart, say: `∠${A0}M${B0} is a straight angle; the box sits in ∠${C0}M${B0}.` },
    ]);
  }
  if (v === 2) {
    const h = r(R, 25, 40), a0 = r(R, -15, 20);
    const F = fan(B0, [{ name: A0, deg: a0 }, { name: C0, deg: a0 + h }, { name: L[3]!, deg: a0 + 2 * h }]);
    F.fig.angles = [mark('x', F.end, B0, A0, C0, { col: 'second', r: 84 }), mark('y', F.end, B0, C0, L[3]!, { col: 'second', r: 84 })];
    return choiceItem(R, {
      id: `readMark-${n}`, family: 'readMark', prompt: `Which given do the arcs at ${B0} code?`, board: `${A0}${B0}${C0}${L[3]}`,
      solution: ['Matching arcs mark congruent angles.', `So m∠${A0}${B0}${C0} = m∠${C0}${B0}${L[3]}: ${rayN(B0 + C0)} bisects ∠${A0}${B0}${L[3]}.`],
      picture: { fig: F.fig },
    }, [
      { t: `m∠${A0}${B0}${C0} = m∠${C0}${B0}${L[3]}`, ok: true, say: 'Right: one arc on each angle means the angles are congruent.' },
      { t: `${B0}${A0} = ${B0}${L[3]}`, mc: MC.wrongPart, say: 'Arcs mark angles. Equal segments get matching ticks.' },
      { t: `m∠${A0}${B0}${L[3]} = 90°`, say: 'No box: nothing says 90°.' },
    ]);
  }
  if (v === 3) {
    const fig = transversal({ theta: r(R, 55, 125), marks: true, numbers: false, turn: r(R, -8, 8) });
    return choiceItem(R, {
      id: `readMark-${n}`, family: 'readMark', prompt: 'Which given do the markings in the figure code?', board: '\\text{chevrons}',
      solution: ['Matching arrowheads (chevrons) on two lines mark them parallel.', 'They sit on ℓ and m, so ℓ ∥ m.'],
      picture: { fig },
    }, [
      { t: 'ℓ ∥ m', ok: true, say: 'Right: matching chevrons mark parallel lines.' },
      { t: 'ℓ ∥ t', mc: MC.wrongPart, say: 't carries no chevron.' },
      { t: 'ℓ ⊥ t', say: 'A right angle needs a box; there is none.' },
    ]);
  }
  const fig = base(90, { ticks: true, box: true });
  return choiceItem(R, {
    id: `readMark-${n}`, family: 'readMark', prompt: `Which statement lists <b>everything</b> the markings give (points ${A0}, M, ${B0}, ${C0})?`, board: `${A0}${B0}${C0}`,
    solution: ['The ticks give two congruent segments.', 'The box gives a right angle.'],
    picture: { fig },
  }, [
    { t: `${A0}M = M${B0} and m∠${C0}M${B0} = 90°`, ok: true, say: 'Right: two markings, two givens.' },
    { t: `${A0}M = M${B0} only`, mc: MC.boxValue, say: 'The box is a marking too: it gives the right angle.' },
    { t: `m∠${A0}M${C0} = m∠${C0}M${B0} only`, mc: MC.ticksAsArcs, say: 'Ticks mark segments, not angles.' },
  ]);
});

export const boxSplit: Gen = (R, n) => fitted('boxSplit', () => {
  const [A0, B0, C0, D0] = letters(R, 4) as [string, string, string, string];
  const b = r(R, 18, 65), a0 = r(R, -20, 10), v = R() < 0.5 ? 0 : 1;
  const F = fan(B0, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + 90 }, { name: C0, deg: a0 + 90 + b }]);
  const W = 90 + b;
  F.fig.angles = [mark('bx', F.end, B0, A0, D0, { box: true, col: 'first' }), mark('y', F.end, B0, D0, C0, v === 0 ? { text: `${b}°`, col: 'second', r: 70 } : { text: '?', alt: `${b}°`, col: 'link', r: 70 })];
  if (v === 0) return numItem({
    id: `boxSplit-${n}`, family: 'boxSplit', prompt: `Find m∠${A0}${B0}${C0}.`, board: `m\\angle ${A0}${B0}${C0}`, unit: 'degrees',
    solution: [`The box says m∠${A0}${B0}${D0} = 90°.`, `Angle Addition: 90 + ${b} = ${ans(W)}°`],
    picture: { fig: F.fig, reveal: { glow: ['bx'] } },
  }, W, [{ v: b, mc: MC.boxValue, say: `The box is a measure too: ∠${A0}${B0}${D0} is 90°. Add it.` }, { v: 90 - b, mc: MC.compSupp, say: 'The parts add up to the whole: 90 plus the other part.' }], 'Right: the box gives 90°, and the parts add up.', 'The box gives one part: 90°.');
  F.fig.words = [{ at: at([0, 0], a0 + W / 2 + 180, 130), text: `m∠${A0}${B0}${C0} = ${W}°` }];
  return numItem({
    id: `boxSplit-${n}`, family: 'boxSplit', prompt: `m∠${A0}${B0}${C0} = ${W}°. Find m∠${D0}${B0}${C0}.`, board: `m\\angle ${D0}${B0}${C0}`, unit: 'degrees',
    solution: [`The box says m∠${A0}${B0}${D0} = 90°.`, `90 + m∠${D0}${B0}${C0} = ${W}, so m∠${D0}${B0}${C0} = ${ans(b)}°`],
    picture: { fig: F.fig, reveal: { solved: ['y'], glow: ['bx'] } },
  }, b, [{ v: W, mc: MC.wholeAsPart, say: `${W}° is the whole angle; the question asks for one part.` }, { v: 180 - W, mc: MC.compSupp, say: 'Nothing here adds to 180°. The box gives 90°.' }], 'Right.', 'The box gives 90° for one part; subtract it from the whole.');
});

// ======================= 14 what a diagram licenses =======================
function sketch(R: () => number, L: string[], equal = false) {
  const [A0, B0, C0, D0] = L as [string, string, string, string];
  const phi = pick(R, [86, 87, 88, 92, 93, 94]), a = r(R, 190, 230), b = equal ? a : a + pick(R, [-9, -7, 7, 9]);
  const f = onLine([A0, B0, C0], [0, a, a + b], { kind: 'line' });
  const P = at(f.points[1]!.at, phi, 260);
  f.segs.push({ id: 'bd', a: f.points[1]!.at, b: P, kind: 'ray' });
  f.points.push({ at: at(f.points[1]!.at, phi, 220), name: D0, dir: phi > 90 ? 180 : 0, dist: 40 });
  return { fig: f, phi };
}
export const mayConclude: Gen = (R, n) => fitted('mayConclude', () => {
  const L = letters(R, 4), [A0, B0, C0, D0] = L as [string, string, string, string];
  if (R() < 0.65) {
    const { fig } = sketch(R, L);
    const lic = pick(R, [`${B0} lies between ${A0} and ${C0}`, `∠${A0}${B0}${D0} and ∠${D0}${B0}${C0} are adjacent`, `${A0}, ${B0} and ${C0} lie on one line`]);
    return choiceItem(R, {
      id: `mayConclude-${n}`, family: 'mayConclude', prompt: `Nothing in this figure (line ${A0}${C0}, ray ${B0}${D0}) is marked, and there are no givens. Which statement may you read from the diagram?`, board: `${A0}${B0}${C0}${D0}`,
      solution: ['A diagram may be read for how points and lines lie: which points are on which lines, which point is between, which angles share a side.', 'Sizes (equal lengths, right angles) count only when marked or given.'],
      picture: { fig },
    }, [
      { t: lic, ok: true, say: 'Right: that is about how the points and lines lie, which a diagram may show.' },
      { t: `∠${A0}${B0}${D0} is a right angle`, mc: MC.appearance, say: 'It looks close to 90°, but nothing marks it. Looks are not a given.' },
      { t: `${A0}${B0} = ${B0}${C0}`, mc: MC.appearance, say: 'They look about equal, but no ticks say so.' },
      { t: `${rayN(B0 + D0)} is perpendicular to ${lineN(A0 + C0)}`, mc: MC.appearance, say: 'No box, no given: you may not assume a right angle.' },
    ]);
  }
  const th = r(R, 60, 120);
  const fig = transversal({ theta: th, delta: pick(R, [-2, 2, -3, 3]), numbers: true, only: [1, 2, 5, 6] });
  return choiceItem(R, {
    id: `mayConclude-${n}`, family: 'mayConclude', prompt: 'Nothing in this figure (lines ℓ, m and t) is marked, and there are no givens. Which statement may you read from the diagram?', board: `t ${th}`,
    solution: ['How lines cross and which angles sit side by side may be read from a diagram.', 'Parallel lines and equal angles need markings or givens.'],
    picture: { fig },
  }, [
    { t: '∠1 and ∠2 are adjacent', ok: true, say: 'Right: they share a vertex and a side, which the diagram shows.' },
    { t: 'ℓ ∥ m', mc: MC.appearance, say: 'They look parallel, but there are no chevrons and no given.' },
    { t: 'm∠1 = m∠5', mc: MC.appearance, say: 'That would need ℓ ∥ m, which is not marked.' },
    { t: 'm∠2 = m∠6', mc: MC.appearance, say: 'That would need ℓ ∥ m, which is not marked.' },
  ]);
});
export const canAssume: Gen = (R, n) => fitted('canAssume', () => {
  const L = letters(R, 4), [A0, B0, C0, D0] = L as [string, string, string, string];
  const v = r(R, 0, 3);
  const { fig } = sketch(R, L, v === 0);
  let claim: string, right: 0 | 1 | 2;
  if (v === 0) { fig.segs = fig.segs.map(s => (s.id === 'p0' || s.id === 'p1' ? { ...s, ticks: 1 } : s)); claim = `${A0}${B0} = ${B0}${C0}`; right = 0; }
  else if (v === 1) { claim = `${B0} lies between ${A0} and ${C0}`; right = 1; }
  else if (v === 2) { claim = `∠${A0}${B0}${D0} is a right angle`; right = 2; }
  else { claim = `${A0}${B0} = ${B0}${C0}`; right = 2; }
  const opts: Opt[] = [
    { t: 'Yes: it is marked in the diagram', ok: right === 0, mc: right === 2 ? MC.appearance : undefined, say: right === 0 ? 'Right: the matching ticks are a given.' : 'Look again: no marking says it.' },
    { t: 'Yes: a diagram may be read for how points lie on lines', ok: right === 1, mc: right === 2 ? MC.appearance : undefined, say: right === 1 ? 'Right: betweenness on a drawn line may be read off.' : right === 0 ? 'It is about a length, so it needs a marking; here it has one.' : 'That covers how points lie, not sizes.' },
    { t: 'No: it only looks that way', ok: right === 2, say: right === 2 ? 'Right: no marking or given says it, so it may not be used.' : 'It is licensed here.' },
  ];
  return choiceItem(R, {
    id: `canAssume-${n}`, family: 'canAssume', prompt: `There are no givens apart from the figure. May you use ${q(claim)} in a proof?`, board: claim,
    solution: ['Markings are givens; how points lie on lines may be read off.', 'Anything about size that is not marked only looks that way.'],
    picture: { fig },
  }, opts, true);
});

// ======================= 15 one-step inference, 21 angle reasons =======================
interface Step1 { fig: Fig; given: string; st: string; right: ReasonKey; wrong: [ReasonKey | 'looks', string | undefined][] }
function step1(R: () => number, sg?: string): Step1 {
  const L = letters(R, 6).filter(x => x !== 'M' && x !== 'E'), [A0, B0, C0, D0] = L as [string, string, string, string];
  const v = sg === 'angle-pair-chains' ? r(R, 5, 8) : sg === 'one-step-inference' ? r(R, 0, 4) : r(R, 0, 8);
  const a = r(R, 160, 210), h = r(R, 25, 38), a0 = r(R, -10, 15);
  switch (v) {
    case 0: { const M = 'M', B1 = B0 === 'M' ? 'N' : B0; return { fig: onLine([A0, M, B1], [0, a, 2 * a], { ticks: [1, 1], deg: r(R, -10, 10) }), given: `M is the midpoint of ${segN(A0 + B1)}`, st: `${A0}M = M${B1}`, right: 'defMid', wrong: [['defBis', MC.noHyp], ['segAdd', undefined], ['looks', MC.appearance]] }; }
    case 1: { const F = fan(B0, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + h }, { name: C0, deg: a0 + 2 * h }]); F.fig.angles = [mark('x', F.end, B0, A0, D0, { col: 'second', r: 84 }), mark('y', F.end, B0, D0, C0, { col: 'second', r: 84 })]; return { fig: F.fig, given: `${rayN(B0 + D0)} bisects ∠${A0}${B0}${C0}`, st: `m∠${A0}${B0}${D0} = m∠${D0}${B0}${C0}`, right: 'defBis', wrong: [['defMid', MC.noHyp], ['angAdd', undefined], ['vert', MC.wrongPair]] }; }
    case 2: { const d = r(R, 20, 60); const f = twoLines(d, 90, { box: true, names: ['ℓ', 'm'] }); f.angles[0]!.text = '1'; return { fig: f, given: 'ℓ ⊥ m', st: '∠1 is a right angle', right: 'defPerp', wrong: [['linPair', undefined], ['vert', MC.wrongPair], ['looks', MC.appearance]] }; }
    case 3: { const m = r(R, 40, 140); const F = fan(B0, [{ name: A0, deg: 0 }, { name: D0, deg: m }, { name: C0, deg: 180 }]); F.fig.angles = [mark('x', F.end, B0, A0, D0, { text: '1', nameOnly: true }), mark('y', F.end, B0, D0, C0, { text: '2', nameOnly: true })]; return { fig: F.fig, given: '∠1 and ∠2 form a linear pair', st: 'm∠1 + m∠2 = 180°', right: 'linPair', wrong: [['vert', MC.wrongPair], ['defSupp', MC.noHyp], ['angAdd', undefined]] }; }
    case 4: { const len = r(R, 260, 360); const fig: Fig = { segs: [{ id: 's1', a: [-len / 2, 100], b: [len / 2, 100], ticks: 1 }, { id: 's2', a: [-len / 2 + 50, -100], b: [len / 2 + 50, -100], ticks: 1 }], angles: [], points: [{ at: [-len / 2, 100], name: A0, dir: 180 }, { at: [len / 2, 100], name: B0, dir: 0 }, { at: [-len / 2 + 50, -100], name: C0, dir: 180 }, { at: [len / 2 + 50, -100], name: D0, dir: 0 }], pad: 90 }; return { fig, given: `${segN(A0 + B0)} ≅ ${segN(C0 + D0)}`, st: `${A0}${B0} = ${C0}${D0}`, right: 'defCongSeg', wrong: [['defMid', MC.noHyp], ['sym', undefined], ['segAdd', undefined]] }; }
    case 5: { const th = R() < 0.5 ? r(R, 50, 75) : r(R, 105, 130); const X = crossing(th, r(R, -12, 12), [A0, B0, C0, D0, 'E']); return { fig: X.fig, given: `${lineN(A0 + C0)} and ${lineN(B0 + D0)} meet at E`, st: 'm∠1 + m∠2 = 180°', right: 'linPair', wrong: [['vert', MC.wrongPair], ['defSupp', MC.noHyp], ['angAdd', undefined]] }; }
    case 6: { const th = R() < 0.5 ? r(R, 50, 75) : r(R, 105, 130); const X = crossing(th, r(R, -12, 12), [A0, B0, C0, D0, 'E']); return { fig: X.fig, given: `${lineN(A0 + C0)} and ${lineN(B0 + D0)} meet at E`, st: 'm∠1 = m∠3', right: 'vert', wrong: [['linPair', MC.wrongPair], ['defMid', MC.noHyp], ['looks', MC.appearance]] }; }
    case 7: { const p = r(R, 25, 55), w = p + r(R, 25, 55); const F = fan(B0, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + p }, { name: C0, deg: a0 + w }]); return { fig: F.fig, given: `${D0} is in the interior of ∠${A0}${B0}${C0}`, st: `m∠${A0}${B0}${D0} + m∠${D0}${B0}${C0} = m∠${A0}${B0}${C0}`, right: 'angAdd', wrong: [['linPair', MC.wrongPair], ['segAdd', MC.noHyp], ['defBis', MC.noHyp]] }; }
    default: {
      const m = r(R, 40, 70);
      const one = (o: Pt, d0: number, k: number, mm: number): { segs: GSeg[]; angles: GAngle[] } => { const p = at(o, d0, 200), qq = at(o, d0 + mm, 200); return { segs: [{ id: `r${k}a`, a: o, b: p, kind: 'ray' }, { id: `r${k}b`, a: o, b: qq, kind: 'ray' }], angles: [{ id: 'a' + k, v: o, p, q: qq, text: String(k), nameOnly: true }] }; };
      const parts = [one([-330, 120], r(R, 0, 20), 1, m), one([150, 120], r(R, 0, 20), 3, m), one([-80, -230], r(R, -10, 10), 2, 180 - m)];
      return { fig: { segs: parts.flatMap(p => p.segs), angles: parts.flatMap(p => p.angles), points: [], pad: 70 }, given: '∠1 and ∠2 are supplementary; ∠3 and ∠2 are supplementary', st: '∠1 ≅ ∠3', right: 'congSupp', wrong: [['vert', MC.wrongPair], ['linPair', MC.wrongPair], ['defCongAng', MC.noHyp]] };
    }
  }
}
export const matchReason: Gen = (R, n, sg) => fitted('matchReason', () => {
  const S0 = step1(R, sg);
  const RN = (k: ReasonKey | 'looks') => (k === 'looks' ? 'It looks that way in the figure' : RS[k]);
  return choiceItem(R, {
    id: `matchReason-${n}`, family: 'matchReason', prompt: `Given: ${S0.given}. Which reason justifies the step ${q(S0.st)}?`, board: S0.st,
    solution: [`The step needs a reason whose “if” part is already known: ${S0.given}.`, `${RS[S0.right]}.`],
    picture: { fig: S0.fig, card: { lines: [`Given: ${A(S0.given)}`, `Step: ${B(S0.st)}`] } },
  }, [
    { t: RS[S0.right], ok: true, say: 'Right: its hypothesis is exactly what is given.' },
    ...S0.wrong.map(([k, mc]) => ({ t: RN(k), mc, say: k === 'looks' ? 'Looks are not a reason; only givens, definitions, postulates and theorems are.' : mc === MC.wrongPair ? 'That reason is about a different kind of angle pair.' : mc === MC.noHyp ? 'Its hypothesis is not met here.' : 'That reason does not give this step.' })),
  ]);
});
export const midAlg: Gen = (R, n) => fitted('midAlg', () => {
  const L = letters(R, 6).filter(x => x !== 'M');
  const bis = R() < 0.45;
  for (;;) {
    const x = r(R, 3, 12), p = r(R, 2, 6), qq = r(R, 1, 5);
    if (p === qq) continue;
    const a = r(R, -12, 15), val = p * x + a, b = val - qq * x;
    if (Math.abs(b) > 30 || b === 0) continue;
    const ex = (k: number, c: number) => `${k === 1 ? '' : k}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    if (!bis) {
      if (val < 5 || val > 30) continue;
      const A0 = L[0]!, B0 = L[1] === 'M' ? 'N' : L[1]!;
      const askWhole = R() < 0.6;
      const fig = onLine([A0, 'M', B0], [0, 260, 520], { ticks: [1, 1], texts: [ex(p, a), ex(qq, b)], deg: r(R, -8, 8) });
      return numItem({
        id: `midAlg-${n}`, family: 'midAlg', prompt: `M is the midpoint of ${segN(A0 + B0)}. ${A0}M = ${ex(p, a)} and M${B0} = ${ex(qq, b)}. Find ${askWhole ? `${A0}${B0}` : '<i>x</i>'}.`, board: `${p}x + ${a} = ${qq}x + ${b}`, unit: askWhole ? 'units' : '',
        solution: [`Definition of midpoint: ${A0}M = M${B0}, so ${ex(p, a)} = ${ex(qq, b)}.`, `${p - qq}x = ${b - a}, so x = ${x} and ${A0}M = ${val}.`, askWhole ? `${A0}${B0} = ${val} + ${val} = ${ans(2 * val)}` : `x = ${ans(x)}`],
        picture: { fig },
      }, askWhole ? 2 * val : x, askWhole ? [{ v: x, mc: MC.reportsX, say: `x = ${x} is a step; put it back in and add both halves.` }, { v: val, mc: MC.intermediate, say: `${val} is one half, ${A0}M. ${A0}${B0} is both halves.` }] : [{ v: val, say: `${val} is the length ${A0}M; the question asks for x.` }], 'Right.', 'A midpoint makes the two parts equal: set them equal and solve.');
    }
    if (val < 20 || val > 70) continue;
    const [A0, B0, C0, D0] = L as [string, string, string, string];
    const a0 = r(R, -15, 15);
    const F = fan(B0, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + val }, { name: C0, deg: a0 + 2 * val }]);
    const exd = (k: number, c: number) => `(${ex(k, c)})°`;
    F.fig.angles = [mark('x', F.end, B0, A0, D0, { text: exd(p, a), col: 'second', r: 70 }), mark('y', F.end, B0, D0, C0, { text: exd(qq, b), col: 'second', r: 70, arcs: 1 })];
    const askWhole = R() < 0.6;
    return numItem({
      id: `midAlg-${n}`, family: 'midAlg', prompt: `${rayN(B0 + D0)} bisects ∠${A0}${B0}${C0}. m∠${A0}${B0}${D0} = ${exd(p, a)} and m∠${D0}${B0}${C0} = ${exd(qq, b)}. Find ${askWhole ? `m∠${A0}${B0}${C0}` : '<i>x</i>'}.`, board: `${p}x + ${a} = ${qq}x + ${b}`, unit: askWhole ? 'degrees' : '',
      solution: [`Definition of angle bisector: the two parts are equal, so ${ex(p, a)} = ${ex(qq, b)}.`, `${p - qq}x = ${b - a}, so x = ${x} and each part is ${val}°.`, askWhole ? `m∠${A0}${B0}${C0} = ${val} + ${val} = ${ans(2 * val)}°` : `x = ${ans(x)}`],
      picture: { fig: F.fig },
    }, askWhole ? 2 * val : x, askWhole ? [{ v: x, mc: MC.reportsX, say: `x = ${x} is a step; the question asks for the whole angle.` }, { v: val, mc: MC.intermediate, say: `${val}° is one part. The whole angle is both parts.` }] : [{ v: val, say: `${val}° is one part; the question asks for x.` }], 'Right.', 'A bisector makes the two parts equal: set them equal and solve.');
  }
});

// ======================= 16 direction of an implication =======================
export const validUse: Gen = (R, n) => fitted('validUse', () => {
  const v = r(R, 0, 3), L = letters(R, 5).filter(x => x !== 'M' && x !== 'D');
  const two = (m1: number, m2: number, t1: string, t2: string, arcs = false): Fig => {
    const o1: Pt = [-300, 0], o2: Pt = [130, -60], d1 = r(R, -10, 25), d2 = r(R, 40, 80);
    const mk = (o: Pt, d: number, m: number, id: string, t: string) => ({ segs: [{ id: id + 'a', a: o, b: at(o, d, 220), kind: 'ray' as const }, { id: id + 'b', a: o, b: at(o, d + m, 220), kind: 'ray' as const }], ang: { id, v: o, p: at(o, d, 100), q: at(o, d + m, 100), text: t, col: arcs ? 'second' as const : undefined, r: arcs ? 64 : undefined } as GAngle });
    const g1 = mk(o1, d1, m1, 'a1', t1), g2 = mk(o2, d2, m2, 'a2', t2);
    return { segs: [...g1.segs, ...g2.segs], angles: [g1.ang, g2.ang], points: [], pad: 80 };
  };
  if (v === 0) {
    const m = r(R, 55, 80);
    return choiceItem(R, {
      id: `validUse-${n}`, family: 'validUse', prompt: `Linear Pair Postulate: if two angles form a linear pair, then they are supplementary. Here m∠1 = ${m}° and m∠2 = ${180 - m}°, so they are supplementary. May you conclude that ∠1 and ∠2 form a linear pair?`, board: `${m} + ${180 - m} = 180`,
      solution: ['The postulate goes from “linear pair” to “supplementary”.', 'Going back would be its converse, which the course has not accepted, and this figure shows why: the angles are apart.'],
      picture: { fig: two(m, 180 - m, `${m}°`, `${180 - m}°`) },
    }, [
      { t: 'No: that would use the postulate backward (its converse)', ok: true, say: 'Right: supplementary angles do not have to sit side by side.' },
      { t: 'Yes, by the Linear Pair Postulate', mc: MC.converse, say: 'The postulate only goes one way. These two angles are not even adjacent.' },
      { t: 'Yes: their measures add to 180°', mc: MC.converse, say: 'Adding to 180° makes them supplementary, not a linear pair.' },
    ]);
  }
  if (v === 1) {
    const m = r(R, 30, 70);
    return choiceItem(R, {
      id: `validUse-${n}`, family: 'validUse', prompt: 'Vertical Angles Theorem: if two angles are vertical angles, then they are congruent. The arcs say ∠1 ≅ ∠2. May you conclude that ∠1 and ∠2 are vertical angles?', board: '\\angle 1 \\cong \\angle 2',
      solution: ['The theorem goes from “vertical” to “congruent”.', 'Its converse is false: congruent angles can be anywhere.'],
      picture: { fig: two(m, m, '1', '2', true) },
    }, [
      { t: 'No: congruent angles do not have to be vertical angles', ok: true, say: 'Right: the theorem does not run backward.' },
      { t: 'Yes, by the Vertical Angles Theorem', mc: MC.converse, say: 'That uses the theorem backward. These angles do not even share a vertex.' },
      { t: 'Yes: congruent angles are always vertical', mc: MC.converse, say: 'Two 40° angles in different places are congruent and not vertical.' },
    ]);
  }
  if (v === 2) {
    const a = r(R, 160, 210);
    const B1 = L[1] === 'M' ? 'N' : L[1]!;
    return choiceItem(R, {
      id: `validUse-${n}`, family: 'validUse', prompt: `Definition: the midpoint of a segment is the point on the segment that splits it into two congruent segments. M lies on ${segN(L[0]! + B1)} and the ticks say ${L[0]}M = M${B1}. May you conclude that M is the midpoint?`, board: `${L[0]}M = M${B1}`,
      solution: ['A definition is an “if and only if”: it works in both directions.', 'M is on the segment and the parts are congruent, so M is the midpoint.'],
      picture: { fig: onLine([L[0]!, 'M', B1], [0, a, 2 * a], { ticks: [1, 1], deg: r(R, -10, 10) }) },
    }, [
      { t: 'Yes: a definition may be used in both directions', ok: true, say: 'Right: both conditions hold, so the definition applies.' },
      { t: 'No: that is the converse, and converses are never allowed', say: 'A definition is a biconditional: both directions are allowed.' },
      { t: 'No: you may only go from “midpoint” to “equal parts”', say: 'That is only true of one-way theorems. A definition goes both ways.' },
    ]);
  }
  const m = r(R, 40, 140), [A0, B0, C0] = [L[0]!, L[1]!, L[2]!];
  const F = fan(B0, [{ name: A0, deg: 0 }, { name: 'D', deg: m }, { name: C0, deg: 180 }]);
  F.fig.angles = [mark('x', F.end, B0, A0, 'D', { text: '1', nameOnly: true }), mark('y', F.end, B0, 'D', C0, { text: '2', nameOnly: true })];
  return choiceItem(R, {
    id: `validUse-${n}`, family: 'validUse', prompt: 'Linear Pair Postulate: if two angles form a linear pair, then they are supplementary. ∠1 and ∠2 form a linear pair. May you conclude that they are supplementary?', board: '\\angle 1, \\angle 2',
    solution: ['The hypothesis (linear pair) holds.', 'So the postulate gives its conclusion: supplementary.'],
    picture: { fig: F.fig },
  }, [
    { t: 'Yes, by the Linear Pair Postulate', ok: true, say: 'Right: this is the direction the postulate goes.' },
    { t: 'No: you would have to measure them first', say: 'The postulate is the reason; no measuring is needed.' },
    { t: 'No: only a definition may be used to conclude something', mc: MC.onlyDefs, say: 'Postulates and theorems are reasons too, in their own direction.' },
  ]);
});
export const bothWays: Gen = (R, n) => {
  if (R() < 0.5) {
    const L = letters(R, 3);
    const def = pick(R, [`The definition of midpoint (point M of ${segN(L[0]! + L[1]!)})`, `The definition of congruent segments`, `The definition of angle bisector (∠${L[0]}${L[1]}${L[2]})`, 'The definition of perpendicular lines']);
    return choiceItem(R, {
      id: `bothWays-${n}`, family: 'bothWays', prompt: 'Which of these may you use in <b>both</b> directions, without proving anything else?', board: def,
      solution: ['A definition is an “if and only if”: it names exactly the figures with the property.', 'Postulates and theorems go one way unless their converse is accepted or proved too.'],
      picture: { card: { lines: ['Used both ways?', def] } },
    }, [
      { t: def, ok: true, say: 'Right: a definition works both ways.' },
      { t: 'The Linear Pair Postulate', mc: MC.converse, say: 'Its converse is false: supplementary angles need not be a linear pair.' },
      { t: 'The Vertical Angles Theorem', mc: MC.converse, say: 'Its converse is false: congruent angles need not be vertical.' },
      { t: 'If two angles are right angles, then they are congruent', mc: MC.converse, say: 'Its converse is false: two 40° angles are congruent and not right.' },
    ]);
  }
  const pairs: [number, number, string][] = [[3, 6, 'Alternate Interior Angles'], [4, 5, 'Alternate Interior Angles'], [1, 8, 'Alternate Exterior Angles'], [2, 7, 'Alternate Exterior Angles']];
  const [x, y, nm] = pick(R, pairs);
  return choiceItem(R, {
    id: `bothWays-${n}`, family: 'bothWays', prompt: `The ${nm} Theorem and its converse have <b>both</b> been proved. In a figure, ∠${x} ≅ ∠${y}. What may you conclude?`, board: `\\angle ${x} \\cong \\angle ${y}`,
    solution: ['A theorem whose converse is also proved can be used both ways (“if and only if”).', 'From the angle fact, the converse gives ℓ ∥ m.'],
    picture: { fig: transversal({ theta: r(R, 55, 125), numbers: true, turn: r(R, -6, 6) }) },
  }, [
    { t: 'ℓ ∥ m, by the converse', ok: true, say: 'Right: the converse was proved, so it may be used.' },
    { t: 'Nothing: only definitions work in both directions', mc: MC.onlyDefs, say: 'A theorem whose converse has been proved works both ways too.' },
    { t: 'Nothing: a theorem may only be used forward', mc: MC.onlyDefs, say: 'Here the backward direction was proved separately, so it may be used.' },
  ]);
};
export const partialDef: Gen = (R, n) => fitted('partialDef', () => {
  const L = letters(R, 4).filter(x => x !== 'P'), a = r(R, 170, 230), off = R() < 0.65;
  const A0 = L[0]!, B0 = L[1]!;
  let fig: Fig;
  if (off) {
    const h = r(R, 130, 220) * (R() < 0.5 ? 1 : -1);
    fig = { segs: [{ id: 'ab', a: [-a, 0], b: [a, 0] }, { id: 'pa', a: [0, h], b: [-a, 0], ticks: 1, col: 'faint' }, { id: 'pb', a: [0, h], b: [a, 0], ticks: 1, col: 'faint' }], angles: [], points: [{ at: [-a, 0], name: A0, dir: 180 }, { at: [a, 0], name: B0, dir: 0 }, { at: [0, h], name: 'P', dir: h > 0 ? 90 : 270 }], pad: 90 };
  } else fig = onLine([A0, 'P', B0], [0, a, 2 * a], { ticks: [1, 1], deg: r(R, -10, 10) });
  return choiceItem(R, {
    id: `partialDef-${n}`, family: 'partialDef', prompt: `The ticks say P${A0} = P${B0}. Is P the midpoint of ${segN(A0 + B0)}?`, board: `P${A0} = P${B0}`,
    solution: ['The definition has two conditions: P lies on the segment, and the two parts are congruent.', off ? 'P is not on the segment, so it is not the midpoint.' : 'P is on the segment and the parts are congruent.'],
    picture: { fig },
  }, [
    { t: off ? `No: P is not on ${segN(A0 + B0)}` : `Yes: P is on ${segN(A0 + B0)} and P${A0} = P${B0}`, ok: true, say: off ? 'Right: equal distances alone are not enough.' : 'Right: both conditions hold.' },
    { t: off ? `Yes: P${A0} = P${B0}` : 'No: a midpoint also needs a right angle', mc: off ? MC.someConds : undefined, say: off ? 'That is only one condition. A midpoint must also lie on the segment.' : 'The definition has no right angle in it.' },
    { t: off ? 'Yes: P is halfway between them' : `No: P${A0} = P${B0} is not enough`, mc: off ? MC.midMis : undefined, say: off ? 'Halfway in distance, but off the segment.' : 'Here P is also on the segment, so both conditions hold.' },
  ]);
});

// ======================= 17-19 properties of equality =======================
type Prop = 'refl' | 'sym' | 'trans' | 'subst' | 'addP' | 'subP';
function propStep(R: () => number, k: Prop): { step: string; also: Prop[] } {
  const L = letters(R, 6), seg = (i: number, j: number) => L[i]! + L[j]!;
  const ang = R() < 0.4, [a, b, c] = [r(R, 1, 3), r(R, 4, 6), r(R, 7, 9)];
  const X = ang ? `m∠${a}` : seg(0, 1), Y = ang ? `m∠${b}` : seg(2, 3), Z = ang ? `m∠${c}` : seg(4, 5);
  const num = r(R, 3, 70);
  switch (k) {
    case 'refl': return { step: `${X} = ${X}`, also: [] };
    case 'sym': return { step: `${X} = ${Y}, so ${Y} = ${X}`, also: ['subst'] };
    case 'trans': return { step: `${X} = ${Y} and ${Y} = ${Z}, so ${X} = ${Z}`, also: ['subst'] };
    case 'subst': return ang ? { step: `m∠${L[0]}${L[1]}${L[3]} + m∠${L[3]}${L[1]}${L[2]} = m∠${L[0]}${L[1]}${L[2]} and m∠${L[0]}${L[1]}${L[3]} = ${num}°, so ${num}° + m∠${L[3]}${L[1]}${L[2]} = m∠${L[0]}${L[1]}${L[2]}`, also: [] } : { step: `${L[0]}${L[2]} = ${L[0]}${L[1]} + ${L[1]}${L[2]} and ${L[0]}${L[1]} = ${num}, so ${L[0]}${L[2]} = ${num} + ${L[1]}${L[2]}`, also: [] };
    case 'addP': return { step: `${X} = ${Y}, so ${X} + ${Z} = ${Y} + ${Z}`, also: ['subst'] };
    default: return { step: `${X} + ${Z} = ${Y} + ${Z}, so ${X} = ${Y}`, also: ['subst'] };
  }
}
const PROP_NAME: Record<Prop, string> = { refl: RS.refl, sym: RS.sym, trans: RS.trans, subst: RS.subst, addP: RS.addP, subP: RS.subP };
const PROP_WHY: Record<Prop, string> = {
  refl: 'Anything equals itself: reflexive.', sym: 'The two sides swap places: symmetric.', trans: 'Two equalities that share a middle give a third: transitive.',
  subst: 'A quantity is replaced by one shown equal to it: substitution.', addP: 'The same quantity is added to both sides: addition.', subP: 'The same quantity is subtracted from both sides: subtraction.',
};
const SG_PROPS: Record<string, Prop[]> = { 'equality-properties': ['refl', 'sym', 'trans'], 'substitution-property': ['subst'], 'addition-subtraction-property': ['addP', 'subP'] };
export const propName: Gen = (R, n, sg) => {
  const k: Prop = pick(R, SG_PROPS[sg ?? ''] ?? (['refl', 'sym', 'trans', 'subst', 'addP', 'subP'] as Prop[]));
  const { step, also } = propStep(R, k);
  const others = shuffle(R, (['refl', 'sym', 'trans', 'subst', 'addP', 'subP'] as Prop[]).filter(p => p !== k && !also.includes(p))).slice(0, 2);
  return choiceItem(R, {
    id: `propName-${n}`, family: 'propName', prompt: `Which property justifies this step? ${q(step)}`, board: step,
    solution: [PROP_WHY[k]],
    picture: { card: { lines: [step] } },
  }, [
    { t: PROP_NAME[k], ok: true, say: `Right. ${PROP_WHY[k]}` },
    ...others.map(p => ({ t: PROP_NAME[p], say: PROP_WHY[k] })),
    { t: 'No property: it is obvious', mc: MC.informal, say: `In a proof every step names its reason. ${PROP_WHY[k]}` },
  ]);
};
export const propApply: Gen = (R, n, sg) => fitted('propApply', () => {
  const L = letters(R, 6), seg = (i: number, j: number) => L[i]! + L[j]!;
  const pool: Prop[] = SG_PROPS[sg ?? ''] ?? ['sym', 'trans', 'subst', 'addP', 'subP'];
  const k = pick(R, pool.filter(p => p !== 'refl').length ? pool.filter(p => p !== 'refl') : pool);
  if (k === 'subst') {
    const ang = R() < 0.5, num = ang ? r(R, 20, 75) : r(R, 3, 19);
    const [A0, M, B0] = [L[0]!, L[1]!, L[2]!];
    if (ang) {
      const D0 = L[3]!, w = num + r(R, 20, 60), a0 = r(R, -10, 15);
      const F = fan(M, [{ name: A0, deg: a0 }, { name: D0, deg: a0 + num }, { name: B0, deg: a0 + w }]);
      F.fig.angles = [mark('x', F.end, M, A0, D0, { text: `${num}°`, col: 'second', r: 64 })];
      const s1 = `m∠${A0}${M}${D0} + m∠${D0}${M}${B0} = m∠${A0}${M}${B0}`;
      return choiceItem(R, {
        id: `propApply-${n}`, family: 'propApply', prompt: `Known: ${q(s1)} and m∠${A0}${M}${D0} = ${num}°. Which statement follows by <b>substitution</b>?`, board: s1,
        solution: [`Replace m∠${A0}${M}${D0} by ${num}°, the only quantity shown equal to something.`],
        picture: { fig: F.fig, card: { lines: [s1, `m∠${A0}${M}${D0} = ${num}°`] } },
      }, [
        { t: `${num}° + m∠${D0}${M}${B0} = m∠${A0}${M}${B0}`, ok: true, say: 'Right: one quantity replaced by its equal.' },
        { t: `${num}° + ${num}° = m∠${A0}${M}${B0}`, mc: MC.beforeEst, say: `Nothing says m∠${D0}${M}${B0} = ${num}°: you may only substitute what was shown equal.` },
        { t: `m∠${A0}${M}${D0} + ${num}° = m∠${A0}${M}${B0}`, mc: MC.beforeEst, say: `${num}° belongs to ∠${A0}${M}${D0}, not ∠${D0}${M}${B0}.` },
        { t: `m∠${A0}${M}${D0} = ${num}° + m∠${A0}${M}${B0}`, say: 'The sum stays on its own side; only the one quantity is replaced.' },
      ]);
    }
    const f = onLine([A0, M, B0], [0, num * 25, num * 25 + r(R, 8, 18) * 25], { texts: [String(num), undefined] });
    const s1 = `${A0}${B0} = ${A0}${M} + ${M}${B0}`;
    return choiceItem(R, {
      id: `propApply-${n}`, family: 'propApply', prompt: `Known: ${q(s1)} and ${A0}${M} = ${num}. Which statement follows by <b>substitution</b>?`, board: s1,
      solution: [`Replace ${A0}${M} by ${num}, the only quantity shown equal to something.`],
      picture: { fig: f, card: { lines: [s1, `${A0}${M} = ${num}`] } },
    }, [
      { t: `${A0}${B0} = ${num} + ${M}${B0}`, ok: true, say: 'Right: AM replaced by its equal.' },
      { t: `${A0}${B0} = ${num} + ${num}`, mc: MC.beforeEst, say: `Nothing says ${M}${B0} = ${num}: only ${A0}${M} was shown equal to ${num}.` },
      { t: `${A0}${B0} = ${A0}${M} + ${num}`, mc: MC.beforeEst, say: `${num} is ${A0}${M}, not ${M}${B0}.` },
      { t: `${A0}${M} = ${num} + ${M}${B0}`, say: `The left side is ${A0}${B0}; only ${A0}${M} on the right is replaced.` },
    ]);
  }
  const ang = R() < 0.5, [a, b, c] = [r(R, 1, 3), r(R, 4, 6), r(R, 7, 9)];
  const X = ang ? `m∠${a}` : seg(0, 1), Y = ang ? `m∠${b}` : seg(2, 3), Z = ang ? `m∠${c}` : seg(4, 5);
  const cases: Record<Exclude<Prop, 'subst' | 'refl'>, { from: string; name: string; right: string; wrong: [string, string | undefined, string][] }> = {
    sym: { from: `${X} = ${Y}`, name: 'symmetric', right: `${Y} = ${X}`, wrong: [[`${X} = ${X}`, undefined, 'That is the reflexive property, true of anything.'], [`${Y} + ${X} = 0`, undefined, 'Symmetric swaps the two sides of the equation.'], [`${X} ≠ ${Y}`, undefined, 'The property keeps the equation true.']] },
    trans: { from: `${X} = ${Y} and ${Y} = ${Z}`, name: 'transitive', right: `${X} = ${Z}`, wrong: [[`${X} = ${Y} + ${Z}`, undefined, 'Transitive links the two ends of the chain: X = Z.'], [`${Y} = ${X} + ${Z}`, undefined, 'Nothing is added: X = Y = Z gives X = Z.'], [`${X} + ${Y} = ${Z}`, undefined, 'Nothing is added: the ends of the chain are equal.']] },
    addP: { from: `${X} = ${Y}`, name: 'addition', right: `${X} + ${Z} = ${Y} + ${Z}`, wrong: [[`${X} + ${Z} = ${Y}`, MC.oneSide, `${Z} must be added to both sides.`], [`${X} = ${Y} + ${Z}`, MC.oneSide, `${Z} must be added to both sides.`], [`${X} + ${Y} = ${Z}`, undefined, 'Add the same quantity to both sides of the equation.']] },
    subP: { from: `${X} + ${Z} = ${Y} + ${Z}`, name: 'subtraction', right: `${X} = ${Y}`, wrong: [[`${X} + ${Z} = ${Y}`, MC.oneSide, `${Z} must be subtracted from both sides.`], [`${X} = ${Y} + ${Z}`, MC.oneSide, `${Z} must be subtracted from both sides.`], [`${Z} = ${Z}`, undefined, 'True, but that is the reflexive property, not what subtraction gives.']] },
  };
  const C = cases[k as keyof typeof cases];
  return choiceItem(R, {
    id: `propApply-${n}`, family: 'propApply', prompt: `Known: ${q(C.from)}. Which statement follows by the <b>${C.name} property of equality</b>?`, board: C.from,
    solution: [PROP_WHY[k]],
    picture: { card: { lines: [`Known: ${A(C.from)}`, `${C.name} property`] } },
  }, [{ t: C.right, ok: true, say: `Right. ${PROP_WHY[k]}` }, ...C.wrong.map(([t, mc, say]) => ({ t, mc, say }))]);
});

// ======================= 20-21 numeric chains =======================
export const chainNum: Gen = (R, n) => fitted('chainNum', () => {
  const [A0, B0, C0, D0] = letters(R, 4) as [string, string, string, string];
  if (R() < 0.5) {
    const ab = r(R, 6, 20), bc = r(R, 4, 16), t = ab + bc, s = 560 / (2 * ab + bc);
    const fig = onLine([A0, B0, C0, D0], [0, ab * s, (ab + bc) * s, (2 * ab + bc) * s], { kind: 'line', texts: [undefined, String(bc), '?'], alts: [undefined, undefined, String(ab)], cols: [undefined, undefined, 'link'] });
    return numItem({
      id: `chainNum-${n}`, family: 'chainNum', prompt: `${A0}, ${B0}, ${C0}, ${D0} lie on a line in that order, and ${A0}${C0} = ${B0}${D0}. ${A0}${C0} = ${t} and ${B0}${C0} = ${bc}. Find ${C0}${D0}.`, board: `${A0}${C0} = ${B0}${D0} = ${t}`, unit: 'units',
      solution: [`${B0}${D0} = ${A0}${C0} = ${t}.`, `Segment Addition: ${B0}${C0} + ${C0}${D0} = ${B0}${D0}, so ${bc} + ${C0}${D0} = ${t}.`, `${C0}${D0} = ${ans(ab)}`],
      picture: { fig, reveal: { solved: ['p2'] } },
    }, ab, [{ v: t, mc: MC.wholeAsPart, say: `${t} is the whole ${B0}${D0}; ${C0}${D0} is one part of it.` }, { v: t + bc, say: `${C0}${D0} is a part of ${B0}${D0}: subtract.` }], 'Right: the chain AC = BD, then Segment Addition.', `Use ${B0}${D0} = ${A0}${C0}, then ${B0}${C0} + ${C0}${D0} = ${B0}${D0}.`);
  }
  for (;;) {
    const x = r(R, 3, 10), p = r(R, 2, 5), qq = r(R, 1, 4), a = r(R, -6, 10);
    if (p === qq) continue;
    const val = p * x + a, b = val - qq * x, bc = r(R, 5, 14);
    if (val < 6 || val > 26 || Math.abs(b) > 20 || b === 0) continue;
    const ex = (k: number, c: number) => `${k === 1 ? '' : k}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    const s = 560 / (2 * val + bc);
    const fig = onLine([A0, B0, C0, D0], [0, val * s, (val + bc) * s, (2 * val + bc) * s], { kind: 'line', texts: [ex(p, a), undefined, ex(qq, b)] });
    return numItem({
      id: `chainNum-${n}`, family: 'chainNum', prompt: `${A0}, ${B0}, ${C0}, ${D0} lie on a line in that order, and ${A0}${C0} = ${B0}${D0}. ${A0}${B0} = ${ex(p, a)} and ${C0}${D0} = ${ex(qq, b)}. Find ${A0}${B0}.`, board: `${p}x + ${a} = ${qq}x + ${b}`, unit: 'units',
      solution: [`From ${A0}${C0} = ${B0}${D0} the class proved ${A0}${B0} = ${C0}${D0} (subtract ${B0}${C0}).`, `${ex(p, a)} = ${ex(qq, b)}, so x = ${x}.`, `${A0}${B0} = ${ans(val)}`],
      picture: { fig },
    }, val, [{ v: x, mc: MC.reportsX, say: `x = ${x}; put it back in to get ${A0}${B0}.` }], 'Right.', `${A0}${B0} = ${C0}${D0}: set the two expressions equal.`);
  }
});
export const congSuppNum: Gen = (R, n) => fitted('congSuppNum', () => {
  for (;;) {
    const x = r(R, 6, 25), p = r(R, 2, 6), qq = r(R, 1, 5);
    if (p === qq) continue;
    const a = r(R, -20, 30), m1 = p * x + a, b = m1 - qq * x;
    if (m1 < 35 || m1 > 145 || Math.abs(m1 - 90) < 8 || Math.abs(b) > 40 || b === 0) continue;
    const ex = (k: number, c: number) => `(${k === 1 ? '' : k}x ${c < 0 ? '−' : '+'} ${Math.abs(c)})°`;
    const L = letters(R, 4);
    const X = crossing(m1, r(R, -10, 10), [L[0]!, L[1]!, L[2]!, L[3]!, 'E'], { texts: { 1: ex(p, a), 3: ex(qq, b), 2: '?' }, alts: { 2: `${180 - m1}°` }, cols: { 1: 'second', 3: 'second', 2: 'link' } });
    X.fig.angles = X.fig.angles.filter(g => g.id !== 'a4');
    X.fig.points = X.fig.points.filter(p0 => p0.name !== 'E');
    // the mistaken equation m1 + m3 = 180
    const xw = (180 - a - b) / (p + qq), wrongAns = Number.isInteger(xw) ? 180 - (p * xw + a) : NaN;
    return numItem({
      id: `congSuppNum-${n}`, family: 'congSuppNum', prompt: `Two lines cross. m∠1 = ${ex(p, a)} and m∠3 = ${ex(qq, b)}. Find m∠2.`, board: `${p}x + ${a} = ${qq}x + ${b}`, unit: 'degrees',
      solution: ['∠1 and ∠3 are vertical angles, so they are congruent.', `${ex(p, a)} = ${ex(qq, b)} gives x = ${x}, so m∠1 = ${m1}°.`, `∠1 and ∠2 form a linear pair: m∠2 = 180 − ${m1} = ${ans(180 - m1)}°`],
      picture: { fig: X.fig, reveal: { solved: ['a2'] } },
    }, 180 - m1, [
      { v: x, mc: MC.reportsX, say: `x = ${x} is a step; the question asks for m∠2.` },
      { v: m1, mc: MC.suppEqual, say: `${m1}° is m∠1. ∠2 forms a linear pair with ∠1, so they add to 180°.` },
      ...(Number.isFinite(wrongAns) ? [{ v: wrongAns, mc: MC.congAsSupp, say: '∠1 and ∠3 are vertical angles: they are equal, not supplementary.' }] : []),
    ], 'Right: vertical angles first, then the linear pair.', '∠1 and ∠3 are vertical (equal); ∠1 and ∠2 are a linear pair (180°).');
  }
});
export { add };
export type { Base };
void B;
void NAMES;
