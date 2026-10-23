// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the row for 1, a row in between (divide, then
// multiply), and a ratio table with cents.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'unit-row', family: 'unitRow', standalone: true },
    { subgoal: 'intermediate-row', family: 'midRow', standalone: true },
    { subgoal: 'rational-entry-tables', family: 'moneyRow', standalone: true },
  ],
};
