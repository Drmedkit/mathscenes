// plan.ts: the practice walks through every sub-goal of secondary-t5-34 (translations, reflections, rotations), in
// topic JSON order; each sub-goal has its own family (items.ts), generated with that sub-goal's cases.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'correspondence', title: 'Match the corners', families: ['match'] },
  { id: 'recog-translation', title: 'Spot a translation', families: ['nameT'] },
  { id: 'recog-reflection', title: 'Spot a reflection', families: ['isMirror'] },
  { id: 'recog-rotation', title: 'Name a rotation', families: ['nameR'] },
  { id: 'orientation-test', title: 'Order kept or reversed', families: ['order'] },
  { id: 'nonuniqueness', title: 'One motion or more?', families: ['howMany'] },
  { id: 'translate-grid', title: 'Slide on a grid', families: ['slide'] },
  { id: 'reflect-grid-line', title: 'Reflect across a grid line', families: ['flipGrid'] },
  { id: 'rotate-tracing', title: 'Turn 90° or 180°', families: ['turnGrid'] },
  { id: 'reflect-slanted-line', title: 'Reflect across a slanted line', families: ['flipDiag'] },
  { id: 'rotate-any-angle', title: 'Turn by 60° and more', families: ['turnAngle'] },
  { id: 'whole-figure', title: 'Move every corner', families: ['whole'] },
  { id: 'verify-lines', title: 'Lines stay lines', families: ['straight'] },
  { id: 'verify-distance', title: 'Lengths are kept', families: ['keepLen'] },
  { id: 'verify-angle', title: 'Angles are kept', families: ['keepAngle'] },
  { id: 'verify-parallel', title: 'Parallel stays parallel', families: ['keepPar'] },
  { id: 'coord-translate', title: 'Translation rule', families: ['ruleT'] },
  { id: 'coord-reflect-axes', title: 'Reflect in an axis', families: ['ruleAx'] },
  { id: 'coord-reflect-parallel', title: 'Reflect in x = h or y = k', families: ['ruleLine'] },
  { id: 'coord-rotate-180', title: 'Half-turn rule', families: ['rule180'] },
  { id: 'coord-rotate-90', title: 'Quarter-turn rule', families: ['rule90'] },
  { id: 'predict-measures', title: 'Find it without measuring', families: ['predict'] },
  { id: 'reject-nonrigid', title: 'Rigid or not?', families: ['rigid'] },
  { id: 'evidence-vs-proof', title: 'Examples or proof?', families: ['proof'] },
];
