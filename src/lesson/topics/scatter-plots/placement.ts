// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): predict with a trend-line equation, what its
// slope means in context, and why a prediction far outside the observed range is risky. These three name their
// equation and range in the prompt; the other families read a plot, so they are not asked.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'trend-equation', family: 'predictEq', standalone: true },
    { subgoal: 'interpret-slope-intercept', family: 'slopeMeaning', standalone: true },
    { subgoal: 'extrap-unjustified', family: 'whyRisky', standalone: true },
  ],
};
