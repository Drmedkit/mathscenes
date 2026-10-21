// plan.ts: the practice walks through every sub-goal of secondary-t5-21-area-and-circumference-of-circles, in topic
// JSON order (the last one, reverse-a, is the topic's optional extension).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'radius', title: 'Spot a radius', families: ['whichSeg'] },
  { id: 'diameter', title: 'Spot a diameter', families: ['whichSeg'] },
  { id: 'r-d-convert', title: 'Radius ↔ diameter', families: ['convertRD'] },
  { id: 'circumference-meaning', title: 'Around: the circumference', families: ['aroundAcross'] },
  { id: 'area-meaning', title: 'Inside: the area', families: ['lengthOrArea'] },
  { id: 'area-grid-estimate', title: 'Between 2r² and 4r²', families: ['gridBound'] },
  { id: 'pi-ratio', title: 'Pi = C ÷ d', families: ['piRatio'] },
  { id: 'c-from-d', title: 'C = πd', families: ['cFromD'] },
  { id: 'c-from-r', title: 'C = 2πr', families: ['cFromR'] },
  { id: 'a-from-r', title: 'A = πr²', families: ['aFromR'] },
  { id: 'a-from-d', title: 'Area when d is given', families: ['aFromD'] },
  { id: 'approx-pi', title: 'Exact or about', families: ['approx'] },
  { id: 'choose-c-or-a', title: 'Around or inside?', families: ['chooseMeasure', 'lengthOrArea'] },
  { id: 'sector-rearrangement', title: 'Wedges in a row', families: ['wedgeRead'] },
  { id: 'derive-area', title: 'Why A = πr²', families: ['deriveArea'] },
  { id: 'scale-c', title: 'Radius × k: C × k', families: ['scaleC'] },
  { id: 'scale-a', title: 'Radius × k: A × k²', families: ['scaleA'] },
  { id: 'scale-fractional', title: 'Factors like ½ and 1.5', families: ['scaleFrac'] },
  { id: 'proportional-contrast', title: 'C ∝ r, but A is not', families: ['propCheck'] },
  { id: 'context-compare', title: 'Check a claim', families: ['claimJudge'] },
  { id: 'area-factor-to-length', title: 'Area factor back to r', families: ['areaBack'] },
  { id: 'reverse-c', title: 'From C back to d or r', families: ['reverseC'] },
  { id: 'reverse-a', title: 'From A back to r', families: ['reverseA'] },
];
