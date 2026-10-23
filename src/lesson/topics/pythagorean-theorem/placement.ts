// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a missing leg (the hypotenuse is given, so the
// student must subtract), a right triangle in a story, and the distance between two points. Whole or one-decimal
// answers, no calculator items (the check-in has none). The prompts give every length, so no picture is needed.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const noCalc = (it: { prompt: string }) => !/calculator/i.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'find-leg', family: 'leg', standalone: true },
    { subgoal: 'model-2d-context', family: 'story', standalone: true },
    { subgoal: 'coordinate-distance', family: 'dist', standalone: true },
  ],
  use: noCalc,
};
