// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the area of a scaled copy (× k²), the area factor
// of a fraction scale factor, and back from an area factor to the length factor. Typed answers, no picture needed.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'area-of-copy', family: 'areaGiven', standalone: true },
    { subgoal: 'area-factor-fraction-decimal', family: 'fracFactor', standalone: true },
    { subgoal: 'recover-k-from-area-factor', family: 'rootK', standalone: true },
  ],
  errorLabel: {
    'mc.area-perimeter.area-scales-by-length-factor': 'Multiplies the area by k instead of k × k',
    'mc.exponents-roots.power-as-base-times-exponent': 'Reads k² as k × 2',
    'mc.exponents-roots.root-as-dividing-by-index': 'Takes half of the area factor instead of its square root',
  },
};
