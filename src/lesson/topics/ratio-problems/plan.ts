// plan.ts: practice walks through every sub-goal of primary.ratios.solve-complex-ratio-problems, in topic JSON order.
// Each sub-goal has a short title and the families that practise it (items.ts); a generator gets the sub-goal id.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'scale-up-same-factor', title: 'Scale both up by a fraction', families: ['scaleUp', 'sameRatio'] },
  { id: 'scale-down-factor-below-1', title: 'Scale both down', families: ['scaleDown', 'fracOk'] },
  { id: 'find-factor-as-quotient', title: 'The multiplier is new ÷ old', families: ['findFactor'] },
  { id: 'predict-direction-size', title: 'Predict the size first', families: ['predict'] },
  { id: 'factor-vs-unit-rate', title: 'Multiplier or rate?', families: ['betweenWithin'] },
  { id: 'unit-rate-decimal-route', title: 'Through the rate for one', families: ['unitRate'] },
  { id: 'common-factor-row', title: 'A building-block row', families: ['blockRow', 'pickBlock'] },
  { id: 'exact-fraction-factor', title: 'Keep the multiplier exact', families: ['exactFrac'] },
  { id: 'decimal-digits-past-precision', title: 'One digit past the place', families: ['longDiv'] },
  { id: 'round-at-final-step', title: 'Round once, at the end', families: ['roundEnd'] },
  { id: 'decimal-entries-table', title: 'Decimals in both columns', families: ['decTable'] },
  { id: 'fraction-quantities-unit-rate', title: 'Rates from fractions', families: ['complexRate'] },
  { id: 'equation-y-kx', title: 'Write and use y = kx', families: ['writeK', 'useK'] },
  { id: 'proportional-or-not', title: 'Proportional or not?', families: ['isProp'] },
  { id: 'choose-method', title: 'Choose a method', families: ['chooseMethod', 'mixed'] },
  { id: 'check-units', title: 'Check the units', families: ['unitCheck'] },
  { id: 'check-units-mixed', title: 'Different units (extra)', families: ['mixedUnits'] },
  { id: 'check-constant-ratio', title: 'Check the ratio', families: ['ratioCheck'] },
  { id: 'check-rounded-answer', title: 'Check a rounded answer', families: ['roundCheck'] },
  { id: 'check-size', title: 'Check the size', families: ['sizeCheck'] },
  { id: 'audit-and-revise', title: 'Audit a solution', families: ['audit'] },
];
