// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the scale factor from two side lists (sides
// paired by size), what a fact list guarantees (congruent / similar / not enough / not similar), and a shadow
// problem. Every prompt states all the numbers and facts it needs, so the figure is not needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'sss-similarity', family: 'sssRatio', standalone: true },
    { subgoal: 'classify-congruent-similar-neither', family: 'classify5', standalone: true },
    { subgoal: 'indirect-measurement', family: 'shadow', standalone: true },
  ],
  errorLabel: {
    'mc.ratio-rate.matches-sides-by-list-order': 'Pairs triangle sides in the order they are listed, not by size',
    'mc.transformations.equal-angles-prove-congruence': 'Thinks equal angles prove two triangles congruent',
    'mc.ratio-rate.cross-pairs-objects-in-similarity-proportion': 'Pairs one object’s height with the other object’s shadow',
  },
};
