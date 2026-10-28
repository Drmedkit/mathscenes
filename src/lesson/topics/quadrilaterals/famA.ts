// famA.ts: stage 1 of "Parallelograms and other quadrilaterals": marks as the only evidence, definitions, class
// inclusion, inheritance, the family tree, every name and the most specific one, evidence-limited classification and
// all / some / no statements. Every figure is exact and its drawn class is the class its marks guarantee (near-misses
// look special but are not: a parallelogram at 84°, a rhombus at 86°), so the marks and the drawing never disagree.
import type { Fig } from '../geometry-foundations/geo';
import { galleryFrames, figProblems } from '../geometry-foundations/geo';
import { SHAPES } from '../conditional-statements/logic';
import { type Q4, type QK, ART, ISO_DEF, NAME, PLURAL, TRAP_DEF, UP, every, kitePts, makeQ, paraPts, par, qfig, ri, some, trapPts, turnQ } from './quad';
import { type Gen, type Opt, MC, box, choice, choiceT, fitted, pick, prose, relabel, shuffle, tick } from './qkit';
import type { QMark } from './quad';

const ROLES = 'ABCDE';
export const quadN = (s = 'ABCD') => `quadrilateral ${s}`;
/** the marks of a kind's DEFINITION (nothing more) */
export function defMarks(k: QK): QMark[] {
  const boxes = [box('DAB'), box('ABC'), box('BCD'), box('CDA')];
  switch (k) {
    case 'square': return [...boxes, tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1)];
    case 'rect': return boxes;
    case 'rhombus': return [tick('AB', 1), tick('BC', 1), tick('DC', 1), tick('AD', 1)];
    case 'para': return [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)];
    case 'kite': return [tick('AB', 1), tick('AD', 1), tick('BC', 2), tick('DC', 2)];
    case 'trap': case 'isoTrap': return [par('AB', 1), par('DC', 1)];
    case 'quad': return [];
  }
}
const CLASSES: QK[] = ['square', 'rect', 'rhombus', 'para', 'kite', 'trap'];
/** a figure of kind k, marked with its definition, turned (non-prototypical orientations) */
export function defFig(R: () => number, k: QK, o: { turn?: number } = {}): Fig {
  const Q = makeQ(R, k === 'trap' ? 'trap' : k, { turn: o.turn ?? ri(R, 0, 359) });
  return qfig(Q, defMarks(k));
}

// ---------- read-markings ----------
type Rel = { text: string; marked: boolean };
/** a near-miss figure: it LOOKS more special than its marks say, and the drawing agrees with the marks */
function nearMiss(R: () => number): { Q: Q4; marks: QMark[]; rels: Rel[]; looks: string } {
  const v = ri(R, 0, 3), turn = ri(R, -25, 25);
  if (v === 0) {   // a trapezoid that looks like a parallelogram: AB ∥ DC marked, the legs 5-8° off parallel
    const a = 380, h = 250, off = 110, top = a - 2 * h * Math.tan((ri(R, 5, 8) * Math.PI) / 180) * (R() < 0.5 ? 1 : -1) / 2;
    return { Q: turnQ(trapPts(a, top, off, h), turn), marks: [par('AB', 1), par('DC', 1)], rels: [{ text: 'AB ∥ DC', marked: true }, { text: 'BC ∥ AD', marked: false }, { text: 'AB ≅ DC', marked: false }], looks: 'a parallelogram' };
  }
  if (v === 1) {   // a parallelogram at 84-87° that looks like a rectangle: both pairs parallel marked
    return { Q: turnQ(paraPts(400, 250, ri(R, 84, 87)), turn), marks: [par('AB', 1), par('DC', 1), par('AD', 2), par('BC', 2)], rels: [{ text: 'AB ∥ DC', marked: true }, { text: '∠DAB is a right angle', marked: false }, { text: 'AC ≅ BD', marked: false }], looks: 'a rectangle' };
  }
  if (v === 2) {   // a rectangle that looks like a square: four right angles marked
    return { Q: turnQ(paraPts(360, 360 / (1.06 + R() * 0.04), 90), turn), marks: [box('DAB'), box('ABC'), box('BCD'), box('CDA')], rels: [{ text: '∠ABC is a right angle', marked: true }, { text: 'AB ≅ BC', marked: false }, { text: 'AC ⊥ BD', marked: false }], looks: 'a square' };
  }
  // a kite that looks like a rhombus: two pairs of adjacent sides marked
  const L = 420, p = L * (0.44 + R() * 0.03), h = L * 0.33;
  return { Q: turnQ(kitePts(p, L - p, h), turn), marks: [tick('AB', 1), tick('AD', 1), tick('BC', 2), tick('DC', 2)], rels: [{ text: 'AB ≅ AD', marked: true }, { text: 'AB ≅ BC', marked: false }, { text: 'AB ∥ DC', marked: false }], looks: 'a rhombus' };
}
export const markRead: Gen = (R, n) => fitted('markRead', () => {
  const m = nearMiss(R);
  const rel = R() < 0.3 ? m.rels[0]! : pick(R, m.rels.slice(1));
  const t = relabel(R, ROLES);
  const opts: Opt[] = [
    { t: 'yes: the marks show it', ok: rel.marked, say: rel.marked ? 'Right: that relation is marked.' : `Nothing marks it. The figure only looks like ${m.looks}; an unmarked relation is unknown.`, mc: rel.marked ? undefined : MC.appearance },
    { t: 'no: the marks show it is false', mc: MC.unmarkedFalse, say: rel.marked ? 'It is marked, so it is true.' : 'An unmarked relation is not false; it is simply not known.' },
    { t: 'not enough information: nothing marks it', ok: !rel.marked, say: rel.marked ? 'Look again: the marks do show it.' : 'Right: unmarked means unknown, not false.' },
  ];
  return choiceT(R, t, {
    id: `markRead-${n}`, family: 'markRead', prompt: `Use only the marks (the figure is not drawn to scale). In ${quadN()}, is “${rel.text}” given?`, board: rel.text.replace('∥', '\\parallel').replace('≅', '\\cong').replace('⊥', '\\perp').replace('∠', '\\angle ').replace(' is a right angle', '= 90^\\circ'),
    solution: [rel.marked ? 'The marks on the figure show this relation.' : `No tick, arrowhead, box or arc marks ${rel.text}; looking like ${m.looks} is not evidence.`, rel.marked ? 'So it is given.' : 'An unmarked relation is unknown, not false.'],
    picture: { fig: qfig(m.Q, m.marks), reveal: {} },
  }, opts, true);
});
const MEANING: { mark: (R: () => number) => { marks: QMark[]; ask: string; v: string }; right: string; wrong: { t: string; mc?: string; say: string }[] }[] = [
  { mark: () => ({ marks: [par('AB', 1), par('DC', 1)], ask: 'the arrowheads on AB and DC', v: 'do' }), right: 'AB ∥ DC', wrong: [{ t: 'AB ≅ DC', mc: MC.appearance, say: 'Arrowheads mark parallel sides; congruent sides get tick marks.' }, { t: 'AB ⊥ DC', say: 'Perpendicular is marked with a box at the corner.' }] },
  { mark: () => ({ marks: [tick('AB', 2), tick('DC', 2)], ask: 'the double ticks on AB and DC', v: 'do' }), right: 'AB ≅ DC', wrong: [{ t: 'AB ∥ DC', mc: MC.appearance, say: 'Ticks mark congruent segments; parallel sides get arrowheads.' }, { t: 'AB is twice DC', say: 'Two ticks are just the second group of congruent segments, not "twice as long".' }] },
  { mark: () => ({ marks: [box('ABC')], ask: 'the box at B', v: 'does' }), right: 'm∠ABC = 90°', wrong: [{ t: 'AB ≅ BC', say: 'A box marks a right angle, not equal sides.' }, { t: 'AB ∥ BC', say: 'AB and BC meet at B; they cannot be parallel.' }] },
];
export const markMeaning: Gen = (R, n) => fitted('markMeaning', () => {
  const k = pick(R, ['para', 'rect', 'trap', 'quad', 'rhombus'] as QK[]);
  const M = pick(R, MEANING), mm = M.mark(R);
  // the figure must be one where the mark is true
  const okKinds: Record<string, QK[]> = { 'AB ∥ DC': ['para', 'rect', 'trap', 'rhombus'], 'AB ≅ DC': ['para', 'rect', 'rhombus'], 'm∠ABC = 90°': ['rect'] };
  const kk = okKinds[M.right]!.includes(k) ? k : okKinds[M.right]![0]!;
  const Q = makeQ(R, kk, { turn: ri(R, 0, 359) });
  const t = relabel(R, ROLES);
  const opts: Opt[] = [{ t: M.right, ok: true, say: 'Right: that is what the mark means.' }, ...M.wrong];
  return choiceT(R, t, {
    id: `markMeaning-${n}`, family: 'markMeaning', prompt: `What ${mm.v} ${mm.ask} tell you?`, board: '\\text{read the marks}',
    solution: [prose('Ticks: congruent segments. Arrowheads: parallel lines. A box: a right angle. Arcs: congruent angles.'), `So ${mm.ask} ${mm.v === 'does' ? 'means' : 'mean'}: ${M.right}.`],
    picture: { fig: qfig(Q, mm.marks), reveal: {} },
  }, opts);
});

// ---------- defining-properties ----------
const DEF: Record<string, { right: string; wrong: Opt[] }> = {
  square: { right: 'a quadrilateral with four right angles and four congruent sides', wrong: [{ t: 'a rectangle with congruent diagonals', say: 'Every rectangle has congruent diagonals; most are not squares.' }, { t: 'a quadrilateral with four congruent sides', say: 'That is a rhombus: its angles need not be right angles.' }, { t: 'a quadrilateral with four right angles', say: 'That is a rectangle: its sides need not all be congruent.' }, { t: 'a box shape that sits flat on one side', mc: MC.prototypeDef, say: 'A square turned on its corner is still a square: a definition names properties, not a pose.' }] },
  rect: { right: 'a quadrilateral with four right angles', wrong: [{ t: 'a parallelogram with four congruent sides', say: 'That is a rhombus.' }, { t: 'a quadrilateral with two long sides and two short sides', mc: MC.prototypeDef, say: 'That describes the usual picture. A square is a rectangle too, and its sides are all equal.' }, { t: 'a quadrilateral with both pairs of opposite sides congruent', say: 'That is true of every parallelogram, slanted ones too.' }, { t: 'a quadrilateral with congruent diagonals', say: 'An isosceles trapezoid has congruent diagonals and no right angle.' }] },
  rhombus: { right: 'a quadrilateral with four congruent sides', wrong: [{ t: 'a quadrilateral with two pairs of congruent sides', say: 'A kite or a parallelogram has two pairs of congruent sides.' }, { t: 'a diamond shape standing on one corner', mc: MC.prototypeDef, say: 'The pose does not matter; a rhombus can lie on a side.' }, { t: 'a quadrilateral with perpendicular diagonals', say: 'A kite has perpendicular diagonals without four congruent sides.' }, { t: 'a quadrilateral with both pairs of opposite sides parallel', say: 'That is a parallelogram; its sides need not all be congruent.' }] },
  para: { right: 'a quadrilateral with both pairs of opposite sides parallel', wrong: [{ t: 'a quadrilateral with congruent diagonals', say: 'An isosceles trapezoid has congruent diagonals.' }, { t: 'a slanted rectangle with no right angles', mc: MC.prototypeDef, say: 'That is the usual picture; rectangles and squares are parallelograms too.' }, { t: 'a quadrilateral with one pair of parallel sides', say: 'One pair is a trapezoid; a parallelogram needs both pairs.' }, { t: 'a quadrilateral with four congruent sides', say: 'That is a rhombus; most parallelograms do not have four congruent sides.' }] },
  trap: { right: 'a quadrilateral with at least one pair of parallel sides', wrong: [{ t: 'a quadrilateral with no parallel sides', say: 'A trapezoid needs a pair of parallel sides.' }, { t: 'a triangle with its top cut off', mc: MC.prototypeDef, say: 'That is one picture of it, not a definition.' }, { t: 'a quadrilateral with two pairs of parallel sides', say: 'That is a parallelogram.' }, { t: 'a quadrilateral with two congruent legs', say: 'Congruent legs make an isosceles trapezoid, and a kite can have two congruent sides too.' }] },
  kite: { right: 'a convex quadrilateral with two pairs of adjacent congruent sides', wrong: [{ t: 'a quadrilateral with one pair of congruent sides', say: 'A kite needs two pairs of adjacent congruent sides.' }, { t: 'a convex quadrilateral with two pairs of opposite congruent sides', say: 'Opposite congruent sides belong to a parallelogram.' }, { t: 'a diamond with one long point, like a toy kite', mc: MC.prototypeDef, say: 'That is the picture, not the defining property.' }, { t: 'a quadrilateral with perpendicular diagonals', say: 'Other quadrilaterals have perpendicular diagonals too, with no congruent sides at all.' }] },
};
export const defPick: Gen = (R, n) => {
  const k = pick(R, CLASSES);
  const D = DEF[k]!;
  return choice(R, {
    id: `defPick-${n}`, family: 'defPick', prompt: `${k === 'trap' || k === 'kite' ? TRAP_DEF + ' ' : ''}Which is the definition of ${ART[k]}: the defining property, not a typical look?`, board: `\\text{${NAME[k]}}`,
    solution: ['A definition names the minimal property that every member has and nothing else has.', `For ${ART[k]}: ${D.right}.`],
    picture: { fig: defFig(R, k), reveal: {} },
  }, [{ t: D.right, ok: true, say: 'Right: that property is the whole definition.' }, ...shuffle(R, D.wrong.slice()).slice(0, 3)]);
};
/** three marked figures; which one is marked as the definition of class k */
export const defGallery: Gen = (R, n) => {
  for (let t = 0; t < 80; t++) {
    const k = pick(R, CLASSES);
    // two other figures whose marks do NOT meet k's definition
    const others = shuffle(R, CLASSES.filter(x => !every(x, k))).slice(0, 2);
    const kinds = shuffle(R, [k, ...others]);
    let figs: Fig[];
    try { figs = kinds.map(x => ({ ...defFig(R, x), points: [] })); } catch { continue; }
    const frs = galleryFrames(3);
    if (figs.some((f, i) => figProblems(f, frs[i]!).length)) continue;
    const i = kinds.indexOf(k), L = ['A', 'B', 'C'];
    const opts: Opt[] = kinds.map((x, j) => ({ t: `figure ${L[j]}`, ok: j === i, say: j === i ? 'Right: its marks are exactly the definition.' : `Figure ${L[j]}'s marks show ${ART[x]}, which need not be ${ART[k]}.`, mc: j === i ? undefined : MC.prototypeDef }));
    return choice(R, {
      id: `defGallery-${n}`, family: 'defGallery', prompt: `${k === 'trap' || k === 'kite' ? TRAP_DEF + ' ' : ''}Which figure is marked as ${ART[k]} (its marks meet the definition)?`, board: `\\text{${NAME[k]}?}`,
      solution: [`${NAME[k][0]!.toUpperCase() + NAME[k].slice(1)}: ${DEF[k]!.right}.`, `Only figure ${L[i]} carries those marks, whatever its pose.`],
      picture: { gallery: { figs, caps: ['A', 'B', 'C'] }, reveal: { cell: i } },
    }, opts, true);
  }
  throw new Error('defGallery: no readable gallery');
};

// ---------- class-inclusion ----------
const INCL: { q: string; k: QK; right: string; wrong: Opt[] }[] = [
  { q: 'Is every rectangle a parallelogram? Why?', k: 'rect', right: 'yes: each pair of opposite sides is perpendicular to the same side, so the pair is parallel, and that holds for both pairs', wrong: [{ t: 'yes: they look alike', mc: MC.recites, say: 'Looks are not a reason; use the right angles: two lines perpendicular to the same line are parallel.' }, { t: 'no: a parallelogram has slanted sides', mc: MC.excluded, say: 'Slanted is the usual picture, not the definition. Both pairs of opposite sides of a rectangle are parallel.' }] },
  { q: 'Is every square a parallelogram? Why?', k: 'square', right: 'yes: a square has four right angles, so it is a rectangle, and every rectangle is a parallelogram', wrong: [{ t: 'no: a square is its own kind of shape', mc: MC.excluded, say: 'A square meets the definition of a rectangle and of a rhombus, so it is a parallelogram too.' }, { t: 'yes: every quadrilateral is a parallelogram', say: 'A kite or a trapezoid can fail to have two pairs of parallel sides.' }] },
  { q: 'Is every rhombus a parallelogram? Why?', k: 'rhombus', right: 'yes: both pairs of opposite sides of a rhombus are parallel (checked with a set square for now; proved later from the four congruent sides)', wrong: [{ t: 'no: a rhombus is a diamond, not a parallelogram', mc: MC.excluded, say: 'The diamond is a pose. Both pairs of opposite sides of a rhombus are parallel.' }, { t: 'yes: because it is called a rhombus', mc: MC.recites, say: 'A name is not a reason; the parallel opposite sides are.' }] },
  { q: `${TRAP_DEF} Is every parallelogram a trapezoid? Why?`, k: 'para', right: 'yes: it has two pairs of parallel sides, so it has at least one pair', wrong: [{ t: 'no: a trapezoid has only one pair of parallel sides', mc: MC.excluded, say: 'The definition here says at least one pair: two pairs is at least one.' }, { t: 'no: a trapezoid has a short top and a long bottom', mc: MC.prototypeDef, say: 'That is a picture, not the definition.' }] },
  { q: `${TRAP_DEF} Is every rhombus a kite? Why?`, k: 'rhombus', right: 'yes: all four sides are congruent, so both pairs of adjacent sides are congruent', wrong: [{ t: 'no: a kite has one long point', mc: MC.prototypeDef, say: 'That is a picture. The definition only asks for two pairs of adjacent congruent sides.' }, { t: 'no: a rhombus is a parallelogram, so it cannot be a kite', mc: MC.excluded, say: 'A shape can belong to two classes at once.' }] },
  { q: 'Is every square a rhombus? Why?', k: 'square', right: 'yes: a square has four congruent sides, which is the definition of a rhombus', wrong: [{ t: 'no: a rhombus is slanted', mc: MC.prototypeDef, say: 'Slanted is a picture; four congruent sides is the definition.' }, { t: 'no: a square is its own kind of shape', mc: MC.excluded, say: 'A shape can belong to several classes.' }] },
  { q: `${TRAP_DEF} Is every square a kite? Why?`, k: 'square', right: 'yes: its four sides are congruent, so both pairs of adjacent sides are congruent', wrong: [{ t: 'no: a kite has one long point', mc: MC.prototypeDef, say: 'That is a picture, not the definition.' }, { t: 'no: a square is a parallelogram, so it cannot be a kite', mc: MC.excluded, say: 'Classes overlap; the square is in both.' }] },
  { q: `${TRAP_DEF} Is every rectangle a trapezoid? Why?`, k: 'rect', right: 'yes: both pairs of opposite sides are parallel, so it has at least one pair', wrong: [{ t: 'no: a trapezoid has slanted legs', mc: MC.prototypeDef, say: 'That is a picture; the definition asks for at least one pair of parallel sides.' }, { t: 'no: a trapezoid has exactly one pair of parallel sides', mc: MC.excluded, say: 'The definition here says AT LEAST one pair.' }] },
  { q: 'Is every rhombus a square? Why?', k: 'rhombus', right: 'no: a rhombus with a 60° angle has no right angle', wrong: [{ t: 'yes: both have four congruent sides', mc: MC.converse, say: 'Every square is a rhombus, not the other way round.' }, { t: 'yes: a rhombus is a square turned on its corner', mc: MC.prototypeDef, say: 'Turning does not change angles; most rhombuses have no right angle.' }] },
  { q: `${TRAP_DEF} Is every kite a rhombus? Why?`, k: 'kite', right: 'no: a kite can have two short sides and two long sides', wrong: [{ t: 'yes: both have perpendicular diagonals', mc: MC.converse, say: 'Sharing a property does not make every kite a rhombus.' }, { t: 'yes: every rhombus is a kite, so every kite is a rhombus', mc: MC.converse, say: 'That reverses the statement.' }] },
  { q: `${TRAP_DEF} Is every trapezoid a parallelogram? Why?`, k: 'trap', right: 'no: a trapezoid can have only one pair of parallel sides', wrong: [{ t: 'yes: every parallelogram is a trapezoid, so every trapezoid is a parallelogram', mc: MC.converse, say: 'That reverses the statement.' }, { t: 'yes: both have parallel sides', mc: MC.upHier, say: 'A parallelogram needs BOTH pairs parallel.' }] },
  { q: 'Is every parallelogram a rectangle? Why?', k: 'para', right: 'no: a parallelogram with a 70° angle has no right angle', wrong: [{ t: 'yes: both have opposite sides parallel', mc: MC.converse, say: 'Every rectangle is a parallelogram, but not the other way round.' }, { t: 'yes: a parallelogram is a pushed-over rectangle', mc: MC.prototypeDef, say: 'Pushed over, its angles are no longer right angles.' }] },
];
export const inclWhy: Gen = (R, n) => {
  const I = pick(R, INCL);
  return choice(R, {
    id: `inclWhy-${n}`, family: 'inclWhy', prompt: I.q, board: '\\text{every one?}',
    solution: ['Check the definition of the bigger class against what the smaller class guarantees.', `So: ${I.right}.`],
    picture: { fig: defFig(R, I.k), reveal: {} },
  }, [{ t: I.right, ok: true, say: 'Right: a reason from the definitions.' }, ...I.wrong]);
};

// ---------- inheritance ----------
const OWN: { owner: QK; prop: string }[] = [
  { owner: 'para', prop: 'both pairs of opposite sides parallel' },
  { owner: 'rect', prop: 'four right angles' },
  { owner: 'rhombus', prop: 'four congruent sides' },
  { owner: 'kite', prop: 'two pairs of adjacent congruent sides' },
  { owner: 'trap', prop: 'at least one pair of parallel sides' },
];
export const inheritWhich: Gen = (R, n) => {
  for (;;) {
    const o = pick(R, OWN), k = pick(R, CLASSES.filter(x => x !== o.owner));
    const yes = every(k, o.owner);
    if (!yes && R() < 0.45) continue;
    const opts: Opt[] = [
      { t: `yes: every ${NAME[k]} is ${ART[o.owner]}, so it has every property of ${PLURAL[o.owner]}`, ok: yes, mc: yes ? undefined : MC.upHier, say: yes ? 'Right: the property comes down the tree.' : `Not every ${NAME[k]} is ${ART[o.owner]}: the property does not pass to it.` },
      { t: `no: only ${PLURAL[o.owner]} have it`, mc: yes ? MC.noInherit : undefined, say: yes ? `Every ${NAME[k]} is ${ART[o.owner]}, so it inherits the property.` : `The reason is wrong: other shapes can have it too. The point is that some ${NAME[k]} lacks it.` },
      { t: `no: some ${NAME[k]} is not ${ART[o.owner]}, so the property is not guaranteed`, ok: !yes, mc: yes ? MC.noInherit : undefined, say: yes ? `Every ${NAME[k]} is ${ART[o.owner]}.` : 'Right: the property only comes down the tree, never up or across.' },
    ];
    return choice(R, {
      id: `inheritWhich-${n}`, family: 'inheritWhich', prompt: `${o.owner === 'trap' || o.owner === 'kite' || k === 'kite' || k === 'trap' ? TRAP_DEF + ' ' : ''}Every ${NAME[o.owner]} has ${o.prop}. Must every ${NAME[k]} have ${o.prop}?`, board: `\\text{${NAME[k]}} \\to \\text{${NAME[o.owner]}}?`,
      solution: [yes ? `Every ${NAME[k]} is ${ART[o.owner]}.` : `Not every ${NAME[k]} is ${ART[o.owner]}.`, yes ? 'A property of a class passes down to every class inside it.' : 'A property passes down the tree, never up or across.'],
      picture: { tree: { glow: [k, o.owner] }, reveal: {} },
    }, opts, true);
  }
};
const CHAINS: { says: string; right: string; wrong: Opt[] }[] = [
  { says: '“Every rectangle has four right angles, and every rectangle is a parallelogram. So every parallelogram has four right angles.”', right: 'the property went up the tree: rectangles are inside parallelograms, not the other way round', wrong: [{ t: 'nothing: the argument is right', mc: MC.upHier, say: 'A slanted parallelogram has no right angle.' }, { t: 'a rectangle is not a parallelogram', mc: MC.excluded, say: 'It is: both pairs of opposite sides are parallel.' }] },
  { says: '“Every square is a rhombus, and every rhombus has four congruent sides. So every square has four congruent sides.”', right: 'nothing: the property comes down from rhombuses to squares', wrong: [{ t: 'a square is not a rhombus', mc: MC.excluded, say: 'A square has four congruent sides, so it is a rhombus.' }, { t: 'only rhombuses can have four congruent sides', mc: MC.noInherit, say: 'Every square is a rhombus, so it inherits the property.' }] },
  { says: '“Every rhombus is a kite, and every kite has two pairs of adjacent congruent sides. So every rhombus has two pairs of adjacent congruent sides.”', right: 'nothing: the property comes down from kites to rhombuses', wrong: [{ t: 'a rhombus cannot be a kite, because it is a parallelogram', mc: MC.excluded, say: 'A shape can be in two classes; the rhombus is in both.' }, { t: 'the property went up the tree', mc: MC.upHier, say: 'Rhombuses are inside kites: the property comes down.' }] },
  { says: '“Every square has four congruent sides, and every square is a rectangle. So every rectangle has four congruent sides.”', right: 'the property went up the tree: squares are inside rectangles, not the other way round', wrong: [{ t: 'nothing: the argument is right', mc: MC.upHier, say: 'A long rectangle does not have four congruent sides.' }, { t: 'a square is not a rectangle', mc: MC.excluded, say: 'A square has four right angles, so it is a rectangle.' }] },
];
export const inheritChain: Gen = (R, n) => {
  const c = pick(R, CHAINS), who = pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo']);
  return choice(R, {
    id: `inheritChain-${n}`, family: 'inheritChain', prompt: `${c.says.includes('kite') ? TRAP_DEF + ' ' : ''}${who} argues: ${c.says} What, if anything, is wrong?`, board: '\\text{check the direction}',
    solution: ['Properties pass DOWN the tree: from a class to every class inside it.', `So: ${c.right}.`],
    picture: { tree: {}, reveal: {} },
  }, [{ t: c.right, ok: true, say: 'Right: check which class sits inside which.' }, ...c.wrong]);
};

// ---------- hierarchy-diagram ----------
export const treeName: Gen = (R, n) => {
  const k = pick(R, ['trap', 'kite', 'para', 'rect', 'rhombus', 'square', 'isoTrap'] as QK[]);
  const others = shuffle(R, (['trap', 'kite', 'para', 'rect', 'rhombus', 'square', 'quad'] as QK[]).filter(x => x !== k)).slice(0, 3);
  const why: Partial<Record<QK, string>> = {
    square: 'It sits below BOTH rectangle and rhombus: squares are exactly the shapes that are both.',
    rhombus: 'It sits below parallelogram and below kite: every rhombus is both.',
    rect: 'It sits below parallelogram only, and above square.',
    para: 'It sits below trapezoid (two pairs of parallel sides is at least one) and above rectangle and rhombus.',
    trap: 'It sits just below quadrilateral and contains the parallelograms.',
    kite: 'It sits just below quadrilateral and contains the rhombuses.',
    isoTrap: 'It sits below trapezoid, apart from the parallelograms (its convention: not a parallelogram).',
  };
  const opts: Opt[] = [{ t: NAME[k], ok: true, say: `Right. ${why[k]}` }, ...others.map(o => ({ t: NAME[o], mc: (k === 'square' && (o === 'rect' || o === 'rhombus')) || (k === 'rhombus' && o === 'kite') ? MC.disjoint : undefined, say: `${NAME[o][0]!.toUpperCase() + NAME[o].slice(1)} is not there. ${why[k]}` }))];
  return choice(R, {
    id: `treeName-${n}`, family: 'treeName', prompt: `${TRAP_DEF} ${ISO_DEF} In the family tree each class sits below the classes that contain it. Which class belongs in the box marked “?”`, board: '\\text{the family tree}',
    solution: ['Read the lines: a class is joined to the next class up that contains it.', why[k]!],
    picture: { tree: { hide: [k] }, reveal: {} },
  }, opts);
};
const VENN_SHAPES: { kind: QK; shape: () => ReturnType<typeof SHAPES.square> }[] = [
  { kind: 'square', shape: () => SHAPES.square(0) }, { kind: 'square', shape: () => SHAPES.square(30) },
  { kind: 'rect', shape: () => SHAPES.rect(56, 28, 0) }, { kind: 'rect', shape: () => SHAPES.rect(30, 54, 20) },
  { kind: 'rhombus', shape: () => SHAPES.rhombus(54, 32) }, { kind: 'rhombus', shape: () => SHAPES.rhombus(30, 52) },
  { kind: 'para', shape: () => SHAPES.para() },
];
export const vennZone: Gen = (R, n) => {
  const pickV = shuffle(R, VENN_SHAPES.slice()).slice(0, 4);
  if (!pickV.some(v => v.kind === 'square') && R() < 0.6) pickV[0] = VENN_SHAPES[R() < 0.5 ? 0 : 1]!;
  const ti = ri(R, 0, pickV.length - 1), tk = pickV[ti]!.kind;
  const zoneOf = (k: QK) => (k === 'square' ? 'pq' : k === 'rect' ? 'p' : k === 'rhombus' ? 'q' : 'o') as 'pq' | 'p' | 'q' | 'o';
  const zone = zoneOf(tk);
  const W: Record<string, string> = { pq: 'in the overlap: inside both rectangles and rhombuses', p: 'inside rectangles only', q: 'inside rhombuses only', o: 'inside parallelograms, outside both' };
  const opts: Opt[] = (['pq', 'p', 'q', 'o'] as const).map(z => ({ t: W[z]!, ok: z === zone, mc: z !== zone && tk === 'square' ? MC.disjoint : undefined, say: z === zone ? 'Right: read its marks.' : tk === 'square' ? 'A square has four right angles AND four congruent sides: it belongs to both, in the overlap.' : 'Read its marks: right-angle boxes make a rectangle, four matching ticks make a rhombus.' }));
  const marks = (k: QK) => (k === 'square' ? 'four right angles and four congruent sides' : k === 'rect' ? 'four right angles, and its adjacent sides are NOT congruent' : k === 'rhombus' ? 'four congruent sides, and its angles are NOT right angles' : 'opposite sides congruent, no right angle, and its adjacent sides are NOT congruent');
  return choice(R, {
    id: `vennZone-${n}`, family: 'vennZone', prompt: `Every shape here is a parallelogram. Shape ${String.fromCharCode(65 + ti)} has ${marks(tk)}. Where does it belong in the diagram?`, board: '\\text{rectangles and rhombuses}',
    solution: [tk === 'square' ? 'Four right angles make it a rectangle; four congruent sides make it a rhombus.' : tk === 'rect' ? 'Four right angles: a rectangle. The sides are not all marked congruent.' : tk === 'rhombus' ? 'Four congruent sides: a rhombus. No right angle is marked.' : 'No right angle and the sides are not all congruent: neither.', `So it goes ${W[zone]}.`],
    picture: { euler: { layout: 'overlap', domain: 'parallelograms', P: 'rectangles', Q: 'rhombuses', tokens: pickV.map((v, i) => ({ shape: v.shape(), letter: String.fromCharCode(65 + i), zone: zoneOf(v.kind) })), reveal: { zones: [[zone === 'o' ? 'o' : zone, 'link']], glow: [[ti, 'link']] } }, reveal: {} },
  }, opts, true);
};

// ---------- classify-all-names ----------
const ORDER: QK[] = ['square', 'rect', 'rhombus', 'para', 'kite', 'trap', 'quad'];
const listOf = (ks: QK[]) => ORDER.filter(k => ks.includes(k)).map(k => NAME[k]).join(', ');
export const allNames: Gen = (R, n) => fitted('allNames', () => {
  const k = pick(R, ['square', 'square', 'rect', 'rhombus', 'para', 'kite', 'trap'] as QK[]);
  const names = UP[k];
  const opts: Opt[] = [{ t: listOf(names), ok: true, say: 'Right: every class the marks guarantee.' }];
  opts.push({ t: NAME[k], mc: MC.oneName, say: `${NAME[k][0]!.toUpperCase() + NAME[k].slice(1)} is the most specific name, but the figure has more: ${listOf(names)}.` });
  const drop = names.filter(x => x !== k && x !== 'quad');
  if (drop.length) { const d = pick(R, drop); opts.push({ t: listOf(names.filter(x => x !== d)), mc: MC.excluded, say: `Every ${NAME[k]} is also ${ART[d]}.` }); }
  const add = (['rect', 'rhombus', 'para', 'kite', 'square'] as QK[]).filter(x => !names.includes(x));
  if (add.length) { const a = pick(R, add); opts.push({ t: listOf([...names, a]), mc: MC.appearance, say: `Nothing marked makes it ${ART[a]}.` }); }
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `allNames-${n}`, family: 'allNames', prompt: `${TRAP_DEF} Use only the marks. Which list gives every name that applies to ${quadN()}?`, board: '\\text{every name}',
    solution: [`The marks show the definition of ${ART[k]}.`, `Every class above it in the tree applies too: ${listOf(names)}.`],
    picture: { fig: defFig(R, k), reveal: {} },
  }, opts);
});
export const mostSpecific: Gen = (R, n) => fitted('mostSpecific', () => {
  const k = pick(R, ['square', 'rect', 'rhombus', 'para', 'kite', 'trap'] as QK[]);
  const truer = UP[k].filter(x => x !== k);
  const falses = (['square', 'rect', 'rhombus', 'para', 'kite', 'trap'] as QK[]).filter(x => !UP[k].includes(x));
  const opts: Opt[] = [{ t: NAME[k], ok: true, say: 'Right: the most specific class its marks guarantee.' }];
  for (const x of shuffle(R, truer.slice()).slice(0, 2)) opts.push({ t: NAME[x], mc: MC.oneName, say: `It is ${ART[x]}, but ${NAME[k]} says more.` });
  for (const x of shuffle(R, falses.slice()).slice(0, 4 - opts.length)) opts.push({ t: NAME[x], mc: MC.prototypeOnly, say: `Nothing marked makes it ${ART[x]}.` });
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `mostSpecific-${n}`, family: 'mostSpecific', prompt: `${k === 'trap' || k === 'kite' || truer.includes('trap') ? TRAP_DEF + ' ' : ''}Use only the marks. What is the most specific name for ${quadN()}?`, board: '\\text{the most specific name}',
    solution: [`The marks show the definition of ${ART[k]}.`, `${NAME[k][0]!.toUpperCase() + NAME[k].slice(1)} is the lowest class in the tree that fits.`],
    picture: { fig: defFig(R, k), reveal: {} },
  }, opts);
});

// ---------- evidence-limited ----------
export const guaranteed: Gen = (R, n) => fitted('guaranteed', () => {
  const m = nearMiss(R);
  const k: QK = m.looks === 'a parallelogram' ? 'trap' : m.looks === 'a rectangle' ? 'para' : m.looks === 'a square' ? 'rect' : 'kite';
  const look: QK = m.looks === 'a parallelogram' ? 'para' : m.looks === 'a rectangle' ? 'rect' : m.looks === 'a square' ? 'square' : 'rhombus';
  const opts: Opt[] = [
    { t: NAME[k], ok: true, say: 'Right: that is all the marks guarantee.' },
    { t: NAME[look], mc: MC.appearance, say: `It looks like ${ART[look]}, but nothing marked makes it one.` },
    { t: 'quadrilateral only', mc: MC.unmarkedFalse, say: `The marks do show ${ART[k]}.` },
  ];
  if (look !== 'square') opts.push({ t: 'square', mc: MC.appearance, say: 'Nothing marks four right angles and four congruent sides.' });
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `guaranteed-${n}`, family: 'guaranteed', prompt: `${TRAP_DEF} The figure is not drawn to scale. Which is the most specific name the marks GUARANTEE for ${quadN()}?`, board: '\\text{guaranteed?}',
    solution: [`The marks show the definition of ${ART[k]} and nothing more.`, `It looks like ${ART[look]}, but that is only possible, not guaranteed.`, `So the name is ${NAME[k]}.`],
    picture: { fig: qfig(m.Q, m.marks), reveal: {} },
  }, opts, false);
});
const COULD: { k: QK; could: QK; not: QK }[] = [
  { k: 'para', could: 'rect', not: 'kite' }, { k: 'para', could: 'rhombus', not: 'kite' }, { k: 'rhombus', could: 'square', not: 'rect' },
  { k: 'rect', could: 'square', not: 'rhombus' }, { k: 'trap', could: 'para', not: 'kite' }, { k: 'kite', could: 'rhombus', not: 'para' },
];
export const couldBe: Gen = (R, n) => fitted('couldBe', () => {
  const c = pick(R, COULD);
  const opts: Opt[] = [
    { t: `it must be ${ART[c.k]}, and it could also be ${ART[c.could]}`, ok: true, say: 'Right: guaranteed versus possible.' },
    { t: `it must be ${ART[c.could]}`, mc: MC.appearance, say: `Nothing marked forces ${ART[c.could]}; it is only possible.` },
    { t: `it cannot be ${ART[c.could]}`, mc: MC.unmarkedFalse, say: `An unmarked relation is unknown, not false: ${ART[c.could]} also fits these marks.` },
    { t: `it must be ${ART[c.not]}`, mc: MC.appearance, say: `Nothing marked makes it ${ART[c.not]}.` },
  ];
  const t = relabel(R, ROLES);
  return choiceT(R, t, {
    id: `couldBe-${n}`, family: 'couldBe', prompt: `${TRAP_DEF} The marks are all you know about ${quadN()}. Which statement is right?`, board: '\\text{must or could?}',
    solution: [`The marks show the definition of ${ART[c.k]}: guaranteed.`, `${NAME[c.could][0]!.toUpperCase() + NAME[c.could].slice(1)}s fit the same marks, so ${ART[c.could]} is possible, not guaranteed.`],
    picture: { fig: defFig(R, c.k), reveal: {} },
  }, opts);
});

// ---------- all-some-no ----------
const ASN: QK[] = ['square', 'rect', 'rhombus', 'para', 'trap', 'kite', 'isoTrap'];
const GENERIC: Record<QK, string> = { square: 'a square', rect: 'a rectangle that is not a square', rhombus: 'a rhombus that is not a square', para: 'a parallelogram with no right angle and unequal sides', kite: 'a kite that is not a rhombus', trap: 'a trapezoid with only one pair of parallel sides', isoTrap: 'an isosceles trapezoid', quad: 'a quadrilateral' };
export const allSomeNo: Gen = (R, n) => {
  for (;;) {
    const X = pick(R, ASN), Y = pick(R, ASN.filter(x => x !== X)), q = pick(R, ['all', 'all', 'some', 'no'] as const);
    const truth = q === 'all' ? every(X, Y) : q === 'some' ? some(X, Y) : !some(X, Y);
    const stmt = q === 'all' ? `All ${PLURAL[X]} are ${PLURAL[Y]}.` : q === 'some' ? `Some ${PLURAL[X]} are ${PLURAL[Y]}.` : `No ${NAME[X]} is ${ART[Y]}.`;
    // a witness: a class in X not in Y (breaks "all"), a class in both (makes "some" true, breaks "no")
    const both = (['square', 'rect', 'rhombus', 'para', 'kite', 'isoTrap', 'trap'] as QK[]).find(k => UP[k].includes(X) && UP[k].includes(Y));
    const onlyX = (['square', 'rect', 'rhombus', 'para', 'kite', 'isoTrap', 'trap'] as QK[]).find(k => UP[k].includes(X) && !UP[k].includes(Y));
    let right: string, wrong: Opt[];
    if (q === 'all') {
      right = truth ? `true: every ${NAME[X]} meets the definition of ${ART[Y]}` : `false: ${GENERIC[onlyX!]} is ${ART[X]} but not ${ART[Y]}`;
      wrong = truth
        ? [{ t: `false: ${ART[Y]} need not be ${ART[X]}`, mc: MC.converse, say: 'That is the reverse statement. Read which class is inside which.' }, { t: `false: ${PLURAL[X]} and ${PLURAL[Y]} are different shapes`, mc: MC.disjoint, say: `Every ${NAME[X]} is ${ART[Y]} too; classes overlap.` }]
        : [{ t: `true: every ${NAME[Y]} is ${ART[X]}`, mc: every(Y, X) ? MC.converse : undefined, say: every(Y, X) ? 'That is the reverse statement; it does not make this one true.' : `Not every ${NAME[Y]} is ${ART[X]} either.` }, { t: `true: they share some properties`, mc: MC.upHier, say: 'Sharing properties is not membership: one counterexample makes "all" false.' }];
    } else if (q === 'some') {
      right = truth ? `true: ${ART[both!]} is both ${ART[X]} and ${ART[Y]}` : `false: no shape is both ${ART[X]} and ${ART[Y]}`;
      wrong = truth
        ? [{ t: `false: ${PLURAL[X]} and ${PLURAL[Y]} are different classes`, mc: MC.disjoint, say: `${ART[both!][0]!.toUpperCase() + ART[both!].slice(1)} is in both classes.` }, { t: `false: “some” needs most of them to be`, say: '"Some" means at least one.' }]
        : [{ t: `true: they are both quadrilaterals`, mc: MC.upHier, say: 'Being in the same big class does not put any shape in both.' }, { t: `true: one could be drawn to look like the other`, mc: MC.appearance, say: 'Looks do not count; the definitions must both hold.' }];
    } else {
      right = truth ? `true: no shape meets both definitions` : `false: ${ART[both!]} is both ${ART[X]} and ${ART[Y]}`;
      wrong = truth
        ? [{ t: `false: they are both quadrilaterals`, mc: MC.upHier, say: 'Being in the same big class does not put any shape in both.' }, { t: 'false: any shape can be drawn to look like another', mc: MC.appearance, say: 'Looks do not count; the definitions must both hold.' }]
        : [{ t: `true: ${PLURAL[X]} and ${PLURAL[Y]} are different classes`, mc: MC.disjoint, say: `${ART[both!][0]!.toUpperCase() + ART[both!].slice(1)} is in both classes.` }, { t: `true: ${ART[X]} is never drawn like ${ART[Y]}`, mc: MC.prototypeOnly, say: 'Pictures do not decide it; the definitions do.' }];
    }
    if (q === 'all' && !truth && !onlyX) continue;
    if ((q === 'some' && truth && !both) || (q === 'no' && !truth && !both)) continue;
    return choice(R, {
      id: `allSomeNo-${n}`, family: 'allSomeNo', prompt: `${TRAP_DEF}${[stmt, right, ...wrong.map(w => w.t)].some(x => /isosceles/.test(x)) ? ' ' + ISO_DEF : ''} True or false: “${stmt}”`, board: `\\text{${q} ?}`,
      solution: [q === 'all' ? (truth ? `Every ${NAME[X]} is ${ART[Y]}.` : `Not every ${NAME[X]} is ${ART[Y]}: ${GENERIC[onlyX!]} is a counterexample.`) : truth === (q === 'some') ? `${ART[both!][0]!.toUpperCase() + ART[both!].slice(1)} is in both classes.` : 'No class sits below both in the tree.', `So: ${right}.`],
      picture: { tree: { glow: [X, Y] }, reveal: {} },
    }, [{ t: right, ok: true, say: 'Right.' }, ...wrong]);
  }
};
