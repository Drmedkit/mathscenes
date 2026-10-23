// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): plan to actual with decimals and fractions,
// actual to plan, and a sensible unit for the answer. Typed answers; the scale lines are the lesson's picture, not part
// of the question; no calculator or ruler-reading items, and none worded "drawn at" (the check-in reads that as a
// question about a picture).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'compute-actual-nonwhole', family: 'toActual', standalone: true },
    { subgoal: 'compute-drawing-from-actual', family: 'toDrawing', standalone: true },
    { subgoal: 'convert-output-unit', family: 'convertOut', standalone: true },
  ],
  use: it => !/calculator|ruler|\bdrawn\b|\bshown\b/i.test(plain(it.prompt)),
};
