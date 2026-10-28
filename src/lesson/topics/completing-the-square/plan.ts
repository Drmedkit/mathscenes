// plan.ts: practice walks through every sub-goal of secondary.solving-quadratic-equations-by-completing-the-square-and-the, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'perfect-square-trinomial', title: 'Perfect-square trinomials', families: ['pstSpot', 'pstWrite', 'pstMiddle'] },
  { id: 'completing-term', title: 'The term that completes the square', families: ['fillTerm', 'fillPair'] },
  { id: 'complete-square-even-b', title: 'Complete the square (even b)', families: ['csRhs', 'csSolve', 'csExact'] },
  { id: 'complete-square-odd-b', title: 'Complete the square (half of b a fraction)', families: ['oddTerm', 'oddRhs', 'oddSolve'] },
  { id: 'complete-square-nonmonic', title: 'Complete the square when a ≠ 1', families: ['nmDivide', 'nmTerm', 'nmSolve'] },
  { id: 'quadratic-formula-apply', title: 'Use the quadratic formula', families: ['readABC', 'discVal', 'formulaSolve', 'formulaExact', 'formulaRound'] },
  { id: 'choose-method', title: 'Choose the method', families: ['pickMethod', 'sqrtSolve'] },
  { id: 'letter-fraction-bridge', title: 'Fractions with letters', families: ['twinFrac', 'letterFrac', 'whyNonzero'] },
  { id: 'literal-complete-square', title: 'Complete the square with letters', families: ['literalTerm', 'literalNext'] },
  { id: 'derive-formula', title: 'Derive the formula', families: ['deriveNext', 'deriveWhy'] },
  { id: 'discriminant-count', title: 'How many real solutions', families: ['discCount', 'discKind'] },
  { id: 'discriminant-graph', title: 'Solutions on the graph', families: ['graphMatch', 'graphRead'] },
  { id: 'check-irrational-exact', title: 'Check irrational solutions exactly', families: ['exactCheck', 'roundCheck'] },
  { id: 'write-quadratic-from-context', title: 'Quadratics from stories', families: ['ctxModel', 'ctxSolve', 'ctxRoots'] },
  { id: 'rearrange-formula-square-root', title: 'Rearrange through a square root', families: ['rearrange', 'rearrangeEval'] },
  { id: 'solve-quadratic-inequality', title: 'Quadratic inequalities', families: ['ineqSet', 'ineqSpecial'] },
];
