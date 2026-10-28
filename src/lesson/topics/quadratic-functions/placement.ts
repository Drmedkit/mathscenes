// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the vertex from vertex form, the zeros from
// factored form, and the axis from standard form. Typed answers; the pictures only replay.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'vertex-form-read', family: 'vfVertex', standalone: true },
    { subgoal: 'factored-form-zeros', family: 'facZeros', standalone: true },
    { subgoal: 'standard-form-axis', family: 'stdAxis', standalone: true },
  ],
  errorLabel: {
    'mc.quadratic-polynomial.wrong-sign-zero-factor': 'Reads the vertex or a zero with the wrong sign ((x − 3) as −3)',
    'mc.quadratic-polynomial.vertex-formula-misremembered': 'Uses x = b/(2a) for the axis, without the minus sign',
    'mc.quadratic-polynomial.zero-of-bx-c-as-c': 'Takes 3 as the zero of 2x − 3 instead of 3/2',
    'mc.quadratic-polynomial.outside-coefficient-multiplies-zeros': 'Multiplies the zeros by the number in front',
  },
};
