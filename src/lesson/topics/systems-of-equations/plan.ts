// plan.ts: practice walks through every sub-goal of secondary-t5-31-systems-of-linear-equations, in topic JSON order.
// Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses that sub-goal's cases
// (items.ts: elimSys kinds, sysKind scaled forms, subSys / isoReady).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'pair-on-one-line', title: 'Solutions of one equation', families: ['onLine', 'makeSolution', 'howMany'] },
  { id: 'pair-satisfies-both', title: 'A pair that fits both', families: ['pickPair', 'checkWork'] },
  { id: 'intersection-as-solution', title: 'The crossing is the solution', families: ['readCross', 'pointPick'] },
  { id: 'no-solution-parallel', title: 'Parallel lines: no solution', families: ['parallelGraph', 'howManySys'] },
  { id: 'infinite-coincident', title: 'One line: infinitely many', families: ['sameLine', 'solOrNot'] },
  { id: 'substitute-expression', title: 'Substitute the expression', families: ['subChoice', 'setEqual'] },
  { id: 'solve-and-back-substitute', title: 'Solve and report the pair', families: ['subSolve', 'reportPair'] },
  { id: 'isolate-then-substitute', title: 'Get a letter alone first', families: ['isolate', 'whichVar', 'subSolve'] },
  { id: 'eliminate-by-adding', title: 'Eliminate by adding', families: ['addEq', 'elimSolve', 'afterAdd'] },
  { id: 'eliminate-by-subtracting', title: 'Eliminate by subtracting', families: ['subEq', 'elimSolve'] },
  { id: 'scale-one-equation', title: 'Multiply one equation', families: ['scaleOne', 'pickMult', 'elimSolve'] },
  { id: 'scale-both-equations', title: 'Multiply both equations', families: ['pickMult', 'elimSolve'] },
  { id: 'clear-rational-coefficients', title: 'Clear fractions and decimals', families: ['clearFrac', 'ratSolve'] },
  { id: 'contradiction-no-solution', title: 'When you get 0 = 5', families: ['zeroEq', 'howManySys'] },
  { id: 'identity-infinite', title: 'When you get 0 = 0', families: ['zeroEq', 'solOrNot'] },
  { id: 'choose-method', title: 'Choose a method', families: ['chooseMethod', 'methodsAgree', 'elimSolve', 'subSolve'] },
  { id: 'graph-solve-estimate', title: 'Solve by graphing', families: ['graphRead', 'sketchTrap', 'estimate'] },
  { id: 'write-one-constraint', title: 'One equation from a story', families: ['writeOne', 'fillCount'] },
  { id: 'model-two-constraints', title: 'A system from a story', families: ['writeSystem', 'timesAsMany'] },
  { id: 'verify-in-originals', title: 'Check in the originals', families: ['verify', 'findSlip'] },
  { id: 'graph-estimate-vs-exact', title: 'Estimate or exact?', families: ['exactVsEst', 'estimate'] },
  { id: 'interpret-viability', title: 'Does the answer make sense?', families: ['viable', 'planMeaning'] },
  { id: 'systems-from-lines', title: 'Lines through given points', families: ['twoPoints', 'meetOrNot'] },
];
