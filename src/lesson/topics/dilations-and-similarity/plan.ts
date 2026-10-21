// plan.ts: practice walks through every sub-goal of secondary-t5-36-dilations-and-similarity, in topic JSON order.
// Each sub-goal has a short kid-friendly title and the families that practise it (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'correspondence-from-mapping', title: 'Partners from the statement', families: ['corrSide', 'corrStatement'] },
  { id: 'dilation-center-ray', title: 'Dilate from a center', families: ['dilPoint', 'dilCenterOn'] },
  { id: 'dilation-reduction-identity', title: 'Shrink, keep, or grow', families: ['dilPoint', 'kEffect'] },
  { id: 'coordinate-dilation-origin', title: 'The rule (x, y) → (kx, ky)', families: ['ruleImage', 'ruleCenterTrap', 'kEffect'] },
  { id: 'angle-invariance', title: 'What a dilation keeps', families: ['angleKeep', 'orientKeep', 'propTable'] },
  { id: 'proportional-sides-common-ratio', title: 'One ratio for every side', families: ['ratioK', 'addVsMult'] },
  { id: 'similarity-as-transformations', title: 'Similar = dilate, then move', families: ['simYesNo', 'simSeq'] },
  { id: 'correspondence-across-orientation', title: 'Partners when turned or flipped', families: ['corrRotated', 'corrStatement'] },
  { id: 'directed-scale-factor', title: 'Scale factor, in a direction', families: ['kFromSides', 'ratioK'] },
  { id: 'identify-similar-polygons', title: 'Check every side and angle', families: ['simCheck', 'rectRhombus'] },
  { id: 'forward-missing-length', title: 'Find an image length', families: ['lenK', 'lenFig'] },
  { id: 'inverse-missing-length', title: 'Find an original length', families: ['lenK', 'lenFig'] },
  { id: 'missing-angle-direct', title: 'Find a matching angle', families: ['angCorr', 'angleKeep'] },
  { id: 'third-angle-across-figures', title: 'The third angle', families: ['angThird', 'angThirdFlip'] },
  { id: 'context-missing-length-units', title: 'Shadows, photos and units', families: ['ctxShadow', 'ctxMetric'] },
  { id: 'refute-universal-claim', title: 'Break an “all” claim', families: ['allSimilar', 'rectRhombus'] },
  { id: 'refute-stated-correspondence', title: 'Check the vertex order', families: ['stmtCheck', 'otherOrder'] },
  { id: 'sufficiency-of-evidence', title: 'Proved, disproved, or not yet?', families: ['enough', 'aaQuad'] },
  { id: 'measurement-vs-exact', title: 'Measured is not proved', families: ['measured', 'enough'] },
  { id: 'transformation-witness', title: 'A sequence as proof', families: ['witnessPick', 'simSeq'] },
  { id: 'aa-informal-argument', title: 'Why two angles are enough', families: ['aaArgue', 'aaWhy'] },
  { id: 'aa-apply', title: 'Use AA', families: ['aaDecide', 'aaQuad'] },
  { id: 'practical-resizing-claim', title: 'Resize without stretching', families: ['resize', 'resizeJudge'] },
];
