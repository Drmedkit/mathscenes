// plan.ts: practice walks through every sub-goal of primary.geometry.enlarge-reduce-shapes-informal, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'scaled-vs-distorted-visual', title: 'Same shape or stretched?', families: ['whichScaled', 'photoFit'] },
  { id: 'correspondence', title: 'Matching sides and corners', families: ['matchPart'] },
  { id: 'factor-one-length', title: 'How many times as long', families: ['timesAsLong', 'countLen'] },
  { id: 'common-factor-both-directions', title: 'One factor, across and up', families: ['missingDim', 'oneFactor'] },
  { id: 'additive-vs-multiplicative', title: 'Adding is not scaling', families: ['addOrTimes', 'addCheck'] },
  { id: 'reduction-concept', title: 'Half as long', families: ['halfOf', 'halfReverse'] },
  { id: 'enlarge-rectangle-from-vertex', title: 'Walk a bigger rectangle', families: ['rectWalk', 'rectCorner'] },
  { id: 'scale-every-side-rectilinear', title: 'Scale every side in turn', families: ['walkNext', 'walkList'] },
  { id: 'slanted-sides-run-rise', title: 'Slanted sides: both steps', families: ['slantMove', 'slantHow'] },
  { id: 'construct-reduction', title: 'Walk a half-size copy', families: ['halfWalk'] },
  { id: 'classify-by-two-factors', title: 'Scaled or stretched: two factors', families: ['twoFactors', 'factorPair'] },
  { id: 'whole-figure-check', title: 'Check every side', families: ['notch', 'notchFix'] },
  { id: 'angle-test', title: 'Angles as a second check', families: ['angleSame', 'rectAngles'] },
  { id: 'justify-and-repair-resize', title: 'Fix a resize', families: ['repair', 'resizeJudge'] },
];
