// plan.ts: the practice walks through every sub-goal of secondary-t5-19-two-step-equations-and-inequalities, in
// topic JSON order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses
// that sub-goal's number ranges (items.ts eqFor).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'op-chain', title: 'Read the chain of operations', families: ['chainOrder', 'chainRun'] },
  { id: 'backtrack', title: 'Undo it backward', families: ['thinkNumber', 'flowBack'] },
  { id: 'equivalent-equations', title: 'Same move on both sides', families: ['sameSolution', 'safeMove'] },
  { id: 'record-chain', title: 'Write the chain of equations', families: ['writtenChain', 'matchSteps'] },
  { id: 'solve-whole-positive', title: 'Solve px + q = r', families: ['solve', 'balance'] },
  { id: 'solve-signed', title: 'Negative numbers inside', families: ['solve', 'negCheck'] },
  { id: 'solve-rational', title: 'Fractions and decimals', families: ['solve', 'firstMove'] },
  { id: 'solve-grouped', title: 'Solve p(x + q) = r', families: ['solve', 'firstMove', 'balance'] },
  { id: 'equation-context', title: 'From a story to an equation', families: ['writeEq', 'storySolve'] },
  { id: 'equation-to-context', title: 'From an equation to a story', families: ['storyFor', 'meaning'] },
];
