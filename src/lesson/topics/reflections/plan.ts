// plan.ts: the practice walks through every sub-goal of primary.geometry.reflect-2d-shapes, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'flip-not-slide', title: 'Flipped, not slid', families: ['move'] },
  { id: 'fold-correspondence', title: 'Fold: every point has a partner', families: ['fold'] },
  { id: 'common-perpendicular', title: 'Across at a right angle', families: ['perp'] },
  { id: 'equal-distance-opposite-side', title: 'Just as far, on the other side', families: ['distance'] },
  { id: 'fixed-points', title: 'Points on the line stay put', families: ['fixed'] },
  { id: 'read-diagram-marks', title: 'Read the marks', families: ['marks'] },
  { id: 'grid-point-reflect', title: 'Count from the line', families: ['count', 'stepsNum'] },
  { id: 'construct-perpendicular', title: 'Draw the perpendicular', families: ['tool'] },
  { id: 'transfer-distance', title: 'Transfer the length', families: ['transfer'] },
  { id: 'polygon-vertex-by-vertex', title: 'Vertex by vertex', families: ['vertex'] },
  { id: 'polygon-touching-crossing', title: 'Shapes that touch or cross m', families: ['crossing', 'vertex'] },
  { id: 'diagonal-grid-reflect', title: 'A 45° line', families: ['diag', 'stepsNum'] },
  { id: 'diagonal-half-steps', title: 'Crossing in the middle of a square', families: ['half', 'stepsNum'] },
  { id: 'oblique-line-tools', title: 'A slanted line, with tools', families: ['oblique', 'tool'] },
  { id: 'extend-mirror-line', title: 'The line goes on', families: ['extend'] },
  { id: 'verify-point-pair', title: 'Check a point and its image', families: ['verify'] },
  { id: 'audit-polygon', title: 'Check every vertex', families: ['audit'] },
  { id: 'same-shape-not-enough', title: 'Same shape is not enough', families: ['sameShape'] },
  { id: 'orientation-test', title: 'The vertex order test', families: ['orient'] },
  { id: 'fold-perpendicular-bisector', title: 'Fold A onto A′', families: ['bisect'] },
  { id: 'locate-mirror-line', title: 'Find the line of reflection', families: ['locate'] },
  { id: 'diagnose-error', title: 'Spot the slip', families: ['slip'] },
  { id: 'exact-vs-measured', title: 'Measured or given?', families: ['exact'] },
];
