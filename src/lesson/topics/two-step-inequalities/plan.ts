// plan.ts: the practice walks through every sub-goal of secondary.two-step-inequalities, in topic JSON order
// (14 sub-goals). Each entry names the families that practise it; a generator gets the sub-goal id and uses that
// sub-goal's cases from the topic JSON (items.ts eqFor and the sub-goal branches inside the families).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'ineq-solution-set', title: 'Boundary, side and dot', families: ['pickSet', 'testPoint'] },
  { id: 'order-preserve-translation', title: 'Adding keeps the order', families: ['shift', 'solveShift'] },
  { id: 'order-preserve-positive-scaling', title: 'Positive scaling keeps it', families: ['scale'] },
  { id: 'reverse-by-minus-one', title: 'Times −1 turns it', families: ['mirror', 'keepOrFlip'] },
  { id: 'reverse-any-negative', title: 'Any negative factor turns it', families: ['negScale', 'keepOrFlip'] },
  { id: 'reverse-negative-division', title: 'Dividing by a negative turns it', families: ['divNeg', 'keepOrFlip'] },
  { id: 'solve-ineq-positive', title: 'Solve with p > 0', families: ['solve', 'firstMove'] },
  { id: 'solve-ineq-negative', title: 'Solve with p < 0', families: ['solve', 'revWhen', 'firstMove'] },
  { id: 'audit-solution-set', title: 'Check a solution set', families: ['audit', 'testPoint'] },
  { id: 'justify-reversal-general', title: 'Prove the reversal', families: ['proofStep', 'proofWhy'] },
  { id: 'inequality-context', title: 'From a story, with its limits', families: ['writeIneq', 'contextSolve'] },
  { id: 'discrete-domain', title: 'Whole numbers only', families: ['wholeCount', 'domainFor'] },
  { id: 'choose-equation-or-inequality', title: 'Equation or inequality?', families: ['chooseModel'] },
  { id: 'inequality-to-context', title: 'From an inequality to a story', families: ['storyFor', 'domainFor'] },
];
