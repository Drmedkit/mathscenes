// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): evaluate a piecewise rule inside a piece, decide
// which rule owns a breakpoint, and price a per-started-unit charge. All three stand alone without the canvas (the rule
// or the story is in the question; the graph only comes in on the replay).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'evaluate-interior', family: 'evalPiece', standalone: true },
    { subgoal: 'boundary-ownership', family: 'ownerAtBreak', standalone: true },
    { subgoal: 'step-graph-context', family: 'startedCost', standalone: true },
  ],
  errorLabel: {
    'mc.functions-concept.breakpoint-always-second-piece': 'Uses the second rule at a breakpoint, whatever the symbols say',
    'mc.functions-concept.ignores-piece-conditions': 'Uses the first rule without testing its condition',
    'mc.estimation.rounds-nearest-when-context-needs-direction': 'Rounds to the nearest unit where every started unit counts',
  },
};
