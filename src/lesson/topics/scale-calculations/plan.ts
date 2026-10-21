// plan.ts: practice walks through every sub-goal of primary.ratios.scale-drawing-reality-calculations, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'scale-as-ordered-ratio', title: 'Drawing first, then actual', families: ['table', 'order', 'whichPair'] },
  { id: 'unitless-scale-meaning', title: 'A scale with no units', families: ['unitless', 'unitlessCalc', 'sameUnitPick'] },
  { id: 'reverse-direction', title: 'One scale, both directions', families: ['reverse', 'predict', 'arrowBack'] },
  { id: 'compute-actual-whole', title: 'Plan to actual', families: ['toActual', 'roomCalc'] },
  { id: 'compute-actual-nonwhole', title: 'Plan to actual with decimals and fractions', families: ['toActual', 'mixedPick'] },
  { id: 'compute-drawing-from-actual', title: 'Actual to plan', families: ['toDrawing', 'fitPaper'] },
  { id: 'decimal-to-ruler-mark', title: 'Decimal inches on a ruler', families: ['rulerRead', 'fracForm'] },
  { id: 'normalize-nonunit-scale', title: 'Make the scale per one unit', families: ['normalize', 'normTable'] },
  { id: 'scale-with-units-to-unitless', title: 'A scale with units, with no units', families: ['toUnitless', 'unitsBack'] },
  { id: 'convert-input-unit', title: 'Convert the given length', families: ['convertIn', 'convertFirst'] },
  { id: 'convert-output-unit', title: 'A sensible unit for the answer', families: ['convertOut', 'sensibleUnit'] },
  { id: 'find-scale-from-pair', title: 'Find the scale from a pair', families: ['findScale', 'pairPick'] },
  { id: 'magnitude-direction-check', title: 'Is the answer reasonable?', families: ['reasonable', 'plausible'] },
  { id: 'diagnose-reversed-factor', title: 'Find a reversed step', families: ['diagnoseRev', 'fixRev'] },
  { id: 'diagnose-missing-conversion', title: 'Find a unit slip', families: ['diagnoseConv', 'sizeError'] },
  { id: 'audit-scale-solution', title: 'Check a whole solution', families: ['audit', 'auditFix'] },
];
