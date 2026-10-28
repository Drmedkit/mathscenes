// plan.ts: practice walks through every sub-goal of secondary-t7-02-polynomial-operations-and-identities, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'identity-meaning', title: 'Every value, some values, or none', families: ['classify', 'identityPick'] },
  { id: 'two-variable-terms', title: 'Terms in two letters: ab = ba', families: ['monoProd', 'collect2', 'likeTwo'] },
  { id: 'square-of-sum-structure', title: '(a + b)²: the square and its two strips', families: ['sumSquareNum', 'sumSquareSym'] },
  { id: 'square-of-difference-structure', title: '(a − b)², not a² − b²', families: ['diffSquare', 'lastTerm'] },
  { id: 'sum-times-difference-structure', title: '(a + b)(a − b): the cross terms cancel', families: ['conjExpand', 'conjCancel'] },
  { id: 'extended-multiplication', title: 'Three factors and bigger factors', families: ['triple', 'bigCoef', 'cubes'] },
  { id: 'special-products-direct', title: 'Pick the template, expand in one step', families: ['whichPattern', 'oneStep', 'middleCoef'] },
  { id: 'composite-inputs', title: 'A whole chunk as a or b', families: ['chunkExpand', 'chunkName'] },
  { id: 'reverse-special-products', title: 'Factor with templates, reject near-matches', families: ['factorChunk', 'nearMatch'] },
  { id: 'closure', title: 'What stays a polynomial', families: ['closureWhich', 'degProduct'] },
  { id: 'prove-by-expansion', title: 'Prove it: rewrite each side', families: ['proofStep', 'proofLogic'] },
  { id: 'counterexample-refute', title: 'One counterexample is enough', families: ['counterPick', 'counterValues'] },
  { id: 'error-locate-repair', title: 'Audit a proof: the first wrong step', families: ['firstBad', 'repairStep', 'auditLogic'] },
  { id: 'numerical-relationships', title: 'Identities that explain numbers', families: ['mentalProduct', 'squareMental', 'consecutive', 'pyTriple'] },
];
