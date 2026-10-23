// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): write a decimal in scientific notation,
// multiply two numbers in scientific notation, and add two with different powers (line them up first).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'convert-decimal-to-sci', family: 'toSci', standalone: true },
    { subgoal: 'multiply-sci', family: 'multiply', standalone: true },
    { subgoal: 'align-unequal-powers', family: 'align', standalone: true },
  ],
  errorLabel: {
    'mc.exponents-roots.product-of-powers-multiplies-exponents': 'Multiplies the exponents instead of adding them',
    'mc.exponents-roots.sci-add-without-aligning-powers': 'Adds the numbers in front without lining up the powers',
    'mc.exponents-roots.negative-exponent-shift-direction': 'Moves the point the wrong way for a negative exponent',
  },
};
