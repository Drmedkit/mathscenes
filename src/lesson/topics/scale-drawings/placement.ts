// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): drawing length to real length, real length to
// drawing length, and a fraction-of-an-inch scale (the lesson's test level). The questions name every length they
// use, so the plan picture is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'drawing-to-actual', family: 'toActual', standalone: true },
    { subgoal: 'actual-to-drawing', family: 'toDrawing', standalone: true },
    { subgoal: 'unit-fraction-legend', family: 'fracLegend', standalone: true },
  ],
};
