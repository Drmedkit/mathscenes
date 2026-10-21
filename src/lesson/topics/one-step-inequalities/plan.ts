// plan.ts: the practice walk-through, one entry per sub-goal of
// secondary.one-step-inequalities-and-signed-one-step-equations in topic JSON order, with the families that practise
// it (a family may serve several sub-goals; the generator gets the sub-goal id and uses that sub-goal's numbers).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'solve-ineq-additive', title: 'Add or subtract: the symbol stays', families: ['solveAdd', 'graph', 'testPoint'] },
  { id: 'solve-ineq-positive-scale', title: 'Multiply or divide by a positive', families: ['solveScale', 'boundaryNum'] },
  { id: 'model-solve-ineq-context', title: 'Inequalities in real situations', families: ['contextCount', 'contextSet'] },
  { id: 'model-solve-ineq-geometry', title: 'Fences, rugs, boxes and angles', families: ['geometry'] },
  { id: 'solve-additive-integer', title: 'Equations with negatives: + and −', families: ['addEq'] },
  { id: 'solve-multiplicative-integer', title: 'Equations with negatives: × and ÷', families: ['mulEq'] },
  { id: 'solve-signed-rational', title: 'Signed decimals and fractions', families: ['ratEq'] },
  { id: 'solve-ineq-signed-additive', title: 'Negative boundaries, symbol kept', families: ['solveAdd', 'graph', 'testPoint'] },
  { id: 'ineq-negative-scale-reverse', title: 'Times a negative: reverse the symbol', families: ['solveScale', 'flipMap', 'boundaryNum'] },
  { id: 'justify-ineq-steps', title: 'Name the reason for each step', families: ['justify', 'flipMap'] },
  { id: 'model-signed-context', title: 'Temperature, depth and balances', families: ['signedContext'] },
];
