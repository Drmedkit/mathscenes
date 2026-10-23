// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): percent to degrees, a central angle from a count
// table, and the whole from a slice (whole-number answers only: no calculator on the check-in).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const whole = (it: { prompt: string }) => !/nearest tenth|Calculator/i.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'percent-degree-double-scale', family: 'toDeg', standalone: true },
    { subgoal: 'central-angle-from-share', family: 'angle', standalone: true },
    { subgoal: 'circle-is-whole', family: 'whole', standalone: true },
  ],
  use: whole,
};
