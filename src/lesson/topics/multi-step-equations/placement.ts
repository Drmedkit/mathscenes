// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): solve a multi-step equation with rational
// coefficients: a fraction in front of parentheses, x on both sides, and the full plan (clear, expand, collect, solve).
// The balance picture some items carry only replays the solve, so every question stands alone.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'distribute-rational-factor', family: 'distSolve', standalone: true },
    { subgoal: 'variables-both-sides-rational', family: 'bothSolve', standalone: true },
    { subgoal: 'plan-multi-step-strategy', family: 'planSolve', standalone: true },
  ],
};
