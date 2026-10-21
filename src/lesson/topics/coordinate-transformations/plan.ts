// plan.ts: the practice walks through every sub-goal of primary.geometry.coordinate-plane-transformations, in topic
// JSON order. Each sub-goal names the families that practise it; a generator gets the sub-goal id and uses its cases.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'translation-uniform-slide', title: 'Every point, the same slide', families: ['isSlide', 'slideVector'] },
  { id: 'translation-coordinate-effect', title: 'Across changes x, up and down change y', families: ['moveOne', 'whichChanges'] },
  { id: 'reflect-point-across-axis', title: 'Reflect a point across an axis', families: ['reflectPlot', 'fixedPoint'] },
  { id: 'x-axis-reflection-rule', title: 'Across the x-axis: (x, −y)', families: ['reflectCalc', 'axisRule'] },
  { id: 'y-axis-reflection-rule', title: 'Across the y-axis: (−x, y)', families: ['reflectCalc', 'axisRule'] },
  { id: 'prime-labels', title: 'A and A′', families: ['matchPrime', 'primeMeaning'] },
  { id: 'coordinate-rule-notation', title: 'Read and write arrow rules', families: ['writeRule', 'ruleMeaning', 'readRule'] },
  { id: 'translate-point-by-rule', title: 'Slide by calculating, not counting', families: ['translateCalc', 'signedStep'] },
  { id: 'mixed-point-transformations', title: 'Slide or reflect: choose the rule', families: ['mixedPoint'] },
  { id: 'transform-polygon', title: 'Move a whole shape', families: ['polygonVertex', 'polygonCheck'] },
  { id: 'identify-transformation-from-pairs', title: 'Name the move', families: ['nameMove'] },
  { id: 'verify-straightness', title: 'Lines stay straight', families: ['straightImage'] },
  { id: 'verify-segment-length', title: 'Lengths stay the same', families: ['sideLength', 'lengthKept'] },
  { id: 'verify-angle-measure', title: 'Angles stay the same', families: ['angleImage', 'angleKept'] },
  { id: 'verify-parallelism', title: 'Parallel stays parallel', families: ['parallelKept'] },
  { id: 'orientation-reversal', title: 'Clockwise or counterclockwise?', families: ['orientation'] },
  { id: 'check-proposed-image', title: 'Check an image', families: ['checkImage'] },
  { id: 'apply-in-context', title: 'Screens, logos and maps', families: ['contextMove', 'contextCheck'] },
  { id: 'rational-coordinates', title: 'Halves and decimals', families: ['rationalPoint', 'rationalChoice'] },
  { id: 'reflect-non-axis-line', title: 'Mirror lines x = k and y = k', families: ['reflectLine'] },
  { id: 'non-rigid-non-examples', title: 'Slide, reflection, or neither?', families: ['rigidOrNot'] },
];
