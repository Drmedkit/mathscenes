// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): translate a point by a rule, reflect a point
// across an axis by the coordinate rule, and use a rule written as (x, y) → (…). Typed coordinates; every question
// gives its point in the prompt, so the grid is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'translate-point-by-rule', family: 'translateCalc', standalone: true },
    { subgoal: 'y-axis-reflection-rule', family: 'reflectCalc', standalone: true },
    { subgoal: 'coordinate-rule-notation', family: 'readRule', standalone: true },
  ],
};
