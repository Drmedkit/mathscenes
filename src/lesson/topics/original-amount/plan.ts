// plan.ts: the practice walk for "Find the original amount after a percent change", one entry per sub-goal of the
// topic JSON (primary.ratios.find-the-original-amount-after-a-percent-change), in its order. 7 sub-goals, 18 families.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'change-to-resulting-percent', title: 'The new amount as a percent of the original', families: ['resultPct', 'tapeRead'] },
  { id: 'change-multiplier-expression', title: 'One multiplier: 1 − r or 1 + r', families: ['multNum', 'multExpr'] },
  { id: 'reverse-percent-change', title: 'Divide by the multiplier', families: ['tapeUnit', 'reverse', 'whichCalc'] },
  { id: 'round-to-cent', title: 'Round the original to the cent', families: ['roundOrig', 'roundPick'] },
  { id: 'rounding-check', title: 'Check it forward', families: ['forwardCheck', 'receiptCheck', 'checkHow'] },
  { id: 'explain-base-change', title: 'Why the same percent back does not undo it', families: ['addBack', 'undoPct', 'whyBase'] },
  { id: 'context-diagnose-change', title: 'Which amount is 100%?', families: ['diagnose', 'contextOrig', 'boundFirst'] },
];
