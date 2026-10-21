// plan.ts: the practice walks through every sub-goal of primary.geometry.rotate-quarter-half-turns, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'full-turn-unit', title: 'A full turn', families: ['watch'] },
  { id: 'quarter-turn-amount', title: 'A quarter turn', families: ['amount', 'armLength'] },
  { id: 'half-turn-amount', title: 'A half turn', families: ['amount'] },
  { id: 'direction-cw-ccw', title: 'Clockwise or counterclockwise', families: ['direction'] },
  { id: 'center-fixed-point', title: 'The point that stays still', families: ['center'] },
  { id: 'describe-rotation', title: 'Describe a turn completely', families: ['describe'] },
  { id: 'execute-pointer-quarter-turn', title: 'Turn a pointer a quarter', families: ['pointer'] },
  { id: 'execute-pointer-half-turn', title: 'Turn a pointer a half', families: ['pointer'] },
  { id: 'pointer-endpoint-prediction', title: 'Predict without a guide', families: ['pointer'] },
  { id: 'rotate-whole-figure', title: 'Turn the whole figure', families: ['figure', 'square'] },
  { id: 'external-center', title: 'A pin off the figure', families: ['distance', 'figure'] },
  { id: 'predict-image', title: 'Predict the picture', families: ['figure'] },
  { id: 'grid-steps-locate', title: 'Steps on dot paper', families: ['steps'] },
  { id: 'rotate-point-grid', title: 'Turn a point by its steps', families: ['pointTurn'] },
  { id: 'draw-image-grid', title: 'Corner by corner', families: ['build', 'slip'] },
  { id: 'recognize-slide', title: 'A slide', families: ['motion'] },
  { id: 'turn-vs-slide', title: 'Turn or slide?', families: ['motion'] },
  { id: 'recognize-flip', title: 'A flip', families: ['motion'] },
  { id: 'turn-vs-flip', title: 'Turn or flip?', families: ['order'] },
  { id: 'opposite-half-turns', title: 'Half turns both ways', families: ['opposite'] },
  { id: 'symmetric-multiple-motions', title: 'More than one move fits', families: ['symmetric'] },
  { id: 'select-justify-turn', title: 'Choose the turn', families: ['target'] },
];
