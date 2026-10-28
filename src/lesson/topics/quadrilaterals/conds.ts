// conds.ts: conditions on a quadrilateral and whether each is necessary / sufficient for a class within a stated
// universe (all quadrilaterals, or parallelograms only). The labels are written by hand from the theorems; the topic
// test checks every label against a catalogue of exact shapes (a counterexample must exist for every "no", and none
// for every "yes"), so a label that a real shape breaks cannot ship.
import type { Pt } from '../geometry-foundations/geo';
import { type Q4, type QFacts, type QK, UP, diagMeet, factsOf, kitePts, paraPts, trapPts } from './quad';

export interface Cond { key: string; text: string; test: (f: QFacts) => boolean }
const eqv = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, a, b);
const C = (key: string, text: string, test: (f: QFacts) => boolean): Cond => ({ key, text, test });
const isK = (k: QK) => (f: QFacts) => UP[f.kind].includes(k);
export const CONDS: Record<string, Cond> = {
  onePar: C('onePar', 'one pair of opposite sides parallel', f => f.parAB || f.parAD),
  onePairBoth: C('onePairBoth', 'one pair of opposite sides both parallel and congruent', f => (f.parAB && eqv(f.sides[0]!, f.sides[2]!)) || (f.parAD && eqv(f.sides[1]!, f.sides[3]!))),
  oppSides: C('oppSides', 'both pairs of opposite sides congruent', f => eqv(f.sides[0]!, f.sides[2]!) && eqv(f.sides[1]!, f.sides[3]!)),
  oppAngles: C('oppAngles', 'both pairs of opposite angles congruent', f => eqv(f.angles[0]!, f.angles[2]!) && eqv(f.angles[1]!, f.angles[3]!)),
  diagBis: C('diagBis', 'diagonals that bisect each other', f => f.diagBisect),
  fourRight: C('fourRight', 'four right angles', f => f.angles.every(a => Math.abs(a - 90) < 1e-6)),
  fourSides: C('fourSides', 'four congruent sides', f => f.sides.every(s => eqv(s, f.sides[0]!))),
  exactlyOnePar: C('exactlyOnePar', 'exactly one pair of parallel sides', f => f.parAB !== f.parAD),
  parOtherCong: C('parOtherCong', 'one pair of opposite sides parallel and the other pair congruent', f => (f.parAB && eqv(f.sides[1]!, f.sides[3]!)) || (f.parAD && eqv(f.sides[0]!, f.sides[2]!))),
  diagCong: C('diagCong', 'congruent diagonals', f => f.diagCong),
  diagPerp: C('diagPerp', 'perpendicular diagonals', f => f.diagPerp),
  oneRight: C('oneRight', 'at least one right angle', f => f.angles.some(a => Math.abs(a - 90) < 1e-6)),
  diagCongBis: C('diagCongBis', 'congruent diagonals that bisect each other', f => f.diagCong && f.diagBisect),
  diagPerpBis: C('diagPerpBis', 'diagonals that are perpendicular bisectors of each other', f => f.diagPerp && f.diagBisect),
  kiteSides: C('kiteSides', 'two pairs of adjacent congruent sides', f => (eqv(f.sides[0]!, f.sides[3]!) && eqv(f.sides[1]!, f.sides[2]!)) || (eqv(f.sides[0]!, f.sides[1]!) && eqv(f.sides[2]!, f.sides[3]!))),
  consSides: C('consSides', 'two congruent consecutive sides', f => f.sides.some((s, i) => eqv(s, f.sides[(i + 1) % 4]!))),
  allDiag: C('allDiag', 'congruent, perpendicular diagonals that bisect each other', f => f.diagCong && f.diagPerp && f.diagBisect),
  rhombRight: C('rhombRight', 'four congruent sides and a right angle', f => f.sides.every(s => eqv(s, f.sides[0]!)) && f.angles.some(a => Math.abs(a - 90) < 1e-6)),
  isPara: C('isPara', 'being a parallelogram', isK('para')),
  isRect: C('isRect', 'being a rectangle', isK('rect')),
  isRhombus: C('isRhombus', 'being a rhombus', isK('rhombus')),
  isSquare: C('isSquare', 'being a square', isK('square')),
};
export type Universe = 'quad' | 'para';
export interface Label { cond: string; target: QK; universe: Universe; nec: boolean; suff: boolean }
const L = (cond: string, target: QK, universe: Universe, nec: boolean, suff: boolean): Label => ({ cond, target, universe, nec, suff });
export const LABELS: Label[] = [
  // parallelogram, among quadrilaterals
  L('onePar', 'para', 'quad', true, false), L('onePairBoth', 'para', 'quad', true, true), L('oppSides', 'para', 'quad', true, true),
  L('oppAngles', 'para', 'quad', true, true), L('diagBis', 'para', 'quad', true, true), L('fourRight', 'para', 'quad', false, true),
  L('fourSides', 'para', 'quad', false, true), L('exactlyOnePar', 'para', 'quad', false, false), L('parOtherCong', 'para', 'quad', true, false),
  L('diagCong', 'para', 'quad', false, false), L('diagPerp', 'para', 'quad', false, false),
  // rectangle, among quadrilaterals
  L('isPara', 'rect', 'quad', true, false), L('fourRight', 'rect', 'quad', true, true), L('diagCong', 'rect', 'quad', true, false),
  L('diagCongBis', 'rect', 'quad', true, true), L('isSquare', 'rect', 'quad', false, true), L('oneRight', 'rect', 'quad', true, false),
  L('diagPerp', 'rect', 'quad', false, false), L('oppSides', 'rect', 'quad', true, false),
  // rhombus, among quadrilaterals
  L('diagPerp', 'rhombus', 'quad', true, false), L('fourSides', 'rhombus', 'quad', true, true), L('isSquare', 'rhombus', 'quad', false, true),
  L('kiteSides', 'rhombus', 'quad', true, false), L('diagPerpBis', 'rhombus', 'quad', true, true), L('diagCong', 'rhombus', 'quad', false, false),
  // square, among quadrilaterals
  L('isRect', 'square', 'quad', true, false), L('isRhombus', 'square', 'quad', true, false), L('rhombRight', 'square', 'quad', true, true),
  L('fourSides', 'square', 'quad', true, false), L('diagCong', 'square', 'quad', true, false), L('diagPerp', 'square', 'quad', true, false),
  L('allDiag', 'square', 'quad', true, true), L('fourRight', 'square', 'quad', true, false),
  // among parallelograms
  L('diagCong', 'rect', 'para', true, true), L('oneRight', 'rect', 'para', true, true), L('diagPerp', 'rect', 'para', false, false), L('fourSides', 'rect', 'para', false, false),
  L('fourSides', 'rhombus', 'para', true, true), L('fourRight', 'rect', 'para', true, true), L('diagPerp', 'square', 'para', true, false), L('diagCong', 'square', 'para', true, false),
  L('consSides', 'rhombus', 'quad', true, false), L('oneRight', 'rhombus', 'quad', false, false), L('oneRight', 'square', 'quad', true, false), L('oneRight', 'square', 'para', true, false),
  L('fourRight', 'square', 'para', true, false), L('fourSides', 'square', 'para', true, false),
  L('diagPerp', 'rhombus', 'para', true, true), L('consSides', 'rhombus', 'para', true, true), L('diagCong', 'rhombus', 'para', false, false), L('oneRight', 'rhombus', 'para', false, false),
];
/** a catalogue of exact shapes (with a few special ones a counterexample needs) */
export interface CatShape { name: string; Q: Q4 }
export function catalogue(): CatShape[] {
  const rightTrap: Q4 = [[0, 0], [400, 0], [260, 220], [0, 220]];
  // a kite with congruent diagonals (AC = BD = 400) that do not bisect each other
  const kiteEq = kitePts(120, 280, 200);
  // an isosceles trapezoid whose diagonals are perpendicular: bases 400 and 160, height 280
  const isoPerp = trapPts(400, 160, 120, 280);
  return [
    { name: 'a square', Q: paraPts(300, 300, 90) },
    { name: 'a rectangle that is not a square', Q: paraPts(400, 240, 90) },
    { name: 'a rhombus that is not a square', Q: paraPts(300, 300, 64) },
    { name: 'a parallelogram with no right angle and unequal sides', Q: paraPts(400, 250, 66) },
    { name: 'a kite that is not a rhombus', Q: kitePts(130, 300, 150) },
    { name: 'a kite with congruent diagonals', Q: kiteEq },
    { name: 'an isosceles trapezoid', Q: trapPts(420, 220, 100, 200) },
    { name: 'an isosceles trapezoid with perpendicular diagonals', Q: isoPerp },
    { name: 'a trapezoid with two right angles', Q: rightTrap },
    { name: 'a trapezoid with no special sides', Q: trapPts(420, 180, 60, 210) },
    { name: 'a quadrilateral with no special properties', Q: [[0, 0], [380, 30], [330, 260], [-40, 210]] as Q4 },
  ];
}
export const inUniverse = (f: QFacts, u: Universe) => (u === 'quad' ? true : UP[f.kind].includes('para'));
export const inClass = (f: QFacts, k: QK) => UP[f.kind].includes(k);
/** a shape in the universe that meets the condition but is not in the class (null: none in the catalogue) */
export function suffCounter(l: Label): CatShape | null {
  return catalogue().find(s => { const f = factsOf(s.Q); return inUniverse(f, l.universe) && CONDS[l.cond]!.test(f) && !inClass(f, l.target); }) ?? null;
}
/** a member of the class (in the universe) that lacks the condition */
export function necCounter(l: Label): CatShape | null {
  return catalogue().find(s => { const f = factsOf(s.Q); return inUniverse(f, l.universe) && inClass(f, l.target) && !CONDS[l.cond]!.test(f); }) ?? null;
}
export const UNIV_WORD: Record<Universe, string> = { quad: 'among all quadrilaterals', para: 'among parallelograms' };
void diagMeet; void (null as unknown as Pt);
