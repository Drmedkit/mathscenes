// plan.ts: the practice walks through every sub-goal of secondary-t5-26 (rational and irrational numbers), in topic
// JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets the
// sub-goal id and uses that sub-goal's number ranges).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'define-rational', title: 'Rational = integer ÷ integer', families: ['asQuotient', 'notRational'] },
  { id: 'decimals-repeat', title: 'Why fractions end or repeat', families: ['remainders', 'barNotation'] },
  { id: 'decimal-address', title: 'A decimal is an address', families: ['addressOf', 'prefixWhere'] },
  { id: 'define-irrational', title: 'Never ends, never repeats', families: ['rOrI'] },
  { id: 'display-not-proof', title: 'A screen is a cut-off', families: ['displayRead'] },
  { id: 'form-vs-value', title: 'The value decides, not the look', families: ['rOrI'] },
  { id: 'real-number-sets', title: 'The sets inside the reals', families: ['innermost', 'setStatement'] },
  { id: 'perfect-square-test', title: '√n: perfect square or not', families: ['rOrI', 'whichRational'] },
  { id: 'root-of-fraction', title: 'Roots of fractions and decimals', families: ['rootFraction', 'rOrI'] },
  { id: 'convert-repeating-pure', title: 'Repeating decimal to fraction', families: ['toFraction', 'whichShift'] },
  { id: 'convert-repeating-delayed', title: 'When the repeat starts later', families: ['toFraction', 'whichShift', 'generalMethod'] },
  { id: 'bracket-root', title: 'A root between two integers', families: ['bracket'] },
  { id: 'refine-bounds', title: 'Zoom in: tenths, hundredths', families: ['refine', 'interpolate'] },
  { id: 'round-from-bounds', title: 'Round only when it is settled', families: ['roundRoot', 'settles'] },
  { id: 'locate-number-line', title: 'Place it on the line', families: ['locate'] },
  { id: 'order-reals', title: 'Compare and order', families: ['compare', 'order'] },
  { id: 'estimate-expressions', title: 'Estimate with approximations', families: ['estimate'] },
  { id: 'exact-vs-approx', title: '= or ≈', families: ['exactOrNot'] },
  { id: 'error-from-bounds', title: 'How accurate is it?', families: ['maxError', 'howClose'] },
  { id: 'bound-expressions', title: 'Carry bounds through', families: ['boundExpr', 'boundRound', 'notEqual'] },
  { id: 'choose-precision', title: 'Precise enough to decide', families: ['decide'] },
];
