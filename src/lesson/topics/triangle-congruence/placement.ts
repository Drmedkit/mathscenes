// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): name the criterion from a written list of
// congruent pairs (or "not enough information" for AAA / SSA), write a congruence statement from given pairs, and
// solve for x in corresponding parts. The first two stand alone (their card repeats the prompt); find-x needs the
// statement and the expressions, which the prompt gives.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'classify-mixed', family: 'classifyList', standalone: true },
    { subgoal: 'write-correspondence', family: 'stmtFromList', standalone: true },
    { subgoal: 'cpctc-solve', family: 'solveX', standalone: true },
  ],
  errorLabel: {
    'mc.transformations.ssa-accepted-as-criterion': 'Accepts two sides and a non-included angle (SSA) as proof of congruence',
    'mc.transformations.equal-angles-prove-congruence': 'Thinks three equal angles (AAA) prove congruence',
    'mc.transformations.statement-vertex-order-ignored': 'Writes a congruence statement without matching the vertex order',
  },
};
