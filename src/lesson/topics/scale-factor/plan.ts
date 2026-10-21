// plan.ts: the practice walks through every sub-goal of primary.geometry.enlarge-reduce-scale-factor, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'scaled-vs-distorted', title: 'Scaled or stretched?', families: ['whichCopy', 'scaledOrNot'] },
  { id: 'corresponding-parts', title: 'Matching parts', families: ['partner'] },
  { id: 'name-scale-factor', title: 'Name the scale factor', families: ['nameK'] },
  { id: 'predict-size-from-factor', title: 'Bigger, same or smaller?', families: ['predict'] },
  { id: 'angles-preserved', title: 'Angles stay the same', families: ['angle'] },
  { id: 'compute-lengths-integer', title: 'Scale every side', families: ['computeSide', 'bothSides'] },
  { id: 'grid-segment-check', title: 'Count on the grid', families: ['readSeg'] },
  { id: 'draw-grid-enlargement', title: 'Draw a copy on the grid', families: ['drawNext', 'pickDrawing'] },
  { id: 'reduce-unit-fraction', title: 'Reduce with 1/2, 1/3, 1/4', families: ['reduce'] },
  { id: 'noninteger-factors', title: 'Factors like 3/2 and 0.75', families: ['nonInt', 'predict'] },
  { id: 'oblique-sides-on-grid', title: 'Slanted sides', families: ['slant'] },
  { id: 'find-factor-from-pair', title: 'Find the factor', families: ['findK'] },
  { id: 'missing-side', title: 'The missing side', families: ['missing'] },
  { id: 'reverse-factor', title: 'Back to the original', families: ['reverse'] },
  { id: 'refute-claimed-factor', title: 'One side breaks the claim', families: ['refute'] },
  { id: 'all-ratios-test', title: 'Test every pair', families: ['allRatios'] },
  { id: 'side-ratios-not-sufficient', title: 'Check the angles too', families: ['angleCheck'] },
  { id: 'justify-in-context', title: 'Real resizes', families: ['resize', 'fixIt'] },
];
