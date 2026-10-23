// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): how many times as long (one unit), a legend
// written as a same-unit scale 1 : n, and a scale written as 1 : n from two lengths in different units.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'times-as-long-same-unit', family: 'timesAs', standalone: true },
    { subgoal: 'legend-to-ratio', family: 'legendToRatio', standalone: true },
    { subgoal: 'write-ratio-scale', family: 'writeScale', standalone: true },
  ],
};
