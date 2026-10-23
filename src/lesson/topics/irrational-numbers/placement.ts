// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): rational or irrational (the perfect-square test,
// with its reason), a repeating decimal as a fraction, and a square root between two whole numbers. Every question
// gives its number in the prompt and on the board; the zoom line and the tape are the lesson's pictures.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'perfect-square-test', family: 'rOrI', standalone: true },
    { subgoal: 'convert-repeating-pure', family: 'toFraction', standalone: true },
    { subgoal: 'bracket-root', family: 'bracket', standalone: true },
  ],
};
