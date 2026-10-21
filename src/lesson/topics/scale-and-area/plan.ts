// plan.ts: practice walks through every sub-goal of primary.ratios.scale-area, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'stretch-one-dimension', title: 'Stretch one side: the area is × k', families: ['stretchOne', 'stretchTimes'] },
  { id: 'scale-both-dimensions', title: 'Scale both sides: k rows of k copies', families: ['fillCopy', 'copyArea'] },
  { id: 'uniform-scaling-check', title: 'One factor for every length?', families: ['twoFactors', 'isScaled'] },
  { id: 'non-rectangular-tiling', title: 'Triangles and parallelograms tile too', families: ['tileCount', 'onlyRects'] },
  { id: 'composite-figure-parts', title: 'Every part gets the same multiplier', families: ['unitSquares', 'noWholeCopies'] },
  { id: 'area-factor-whole', title: 'The area factor k²', families: ['areaFactor', 'squaredMeans'] },
  { id: 'area-of-copy', title: 'The area of the copy', families: ['areaGiven', 'areaFromDims'] },
  { id: 'area-factor-fraction-decimal', title: 'Fraction and decimal factors', families: ['fracFactor', 'decFactor', 'shrinkOrGrow'] },
  { id: 'ratio-scale-to-area-ratio', title: 'Length ratio to area ratio', families: ['areaRatio', 'planRatio'] },
  { id: 'legend-scale-to-area-scale', title: 'Real areas from a plan’s legend', families: ['legendArea', 'legendUnit'] },
  { id: 'recover-k-from-area-factor', title: 'Back from the area factor to k', families: ['rootK', 'planBack'] },
  { id: 'justify-doubling', title: 'Why doubling makes 4 times the area', families: ['whyFour', 'onlyLength'] },
  { id: 'justify-general-k', title: 'Why k × k for any k', families: ['eachFactor', 'twoStretches'] },
  { id: 'triangle-formula-justification', title: 'Triangles by the area formula', families: ['triFormula', 'triWhy'] },
  { id: 'contrast-perimeter-area', title: 'Times k or times k²?', families: ['whichMeasure', 'fieldJobs'] },
  { id: 'apply-area-factor-multistep', title: 'Cost, paint and pizza', families: ['costArea', 'pizzaDeal'] },
];
