// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): convert with a unit factor, convert both units of a
// rate, and find the bounds of a rounded measurement. All three stand alone without the lesson's canvas.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'unit-factor-orientation', family: 'convert', standalone: true },
    { subgoal: 'compound-rate-conversion', family: 'rateConvert', standalone: true },
    { subgoal: 'measurement-bounds-calculation', family: 'boundsDec', standalone: true },
  ],
  use: it => !/calculator|1\.609|2\.54/.test(it.prompt),
  errorLabel: {
    'mc.measurement-units.unit-factor-upside-down': 'Turns the unit factor upside down',
    'mc.measurement-units.converts-one-unit-of-rate': 'Converts only one unit of a rate',
    'mc.measurement-units.uncertainty-whole-increment': 'Uses a whole step instead of half a step for rounding bounds',
  },
};
