// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): quartiles of a list, the 1.5 x IQR fences, and
// how far one changed value moves the mean. All three stand alone (the numbers are in the question).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'five-number-summary', family: 'quartiles', standalone: true },
    { subgoal: 'outlier-fence-rule', family: 'fences', standalone: true },
    { subgoal: 'outlier-effect-center', family: 'meanShift', standalone: true },
  ],
  use: it => plain(it.prompt).length <= 230,   // the check-in shows short questions only
  errorLabel: {
    'mc.statistics.quartiles-split-range-equally': 'Puts the quartiles at quarter points of the range instead of the middle of each half',
    'mc.statistics.median-without-sorting': 'Finds a middle value without ordering the data first',
    'mc.statistics.mean-change-ignores-n': 'Expects one changed value to move the mean by the whole change, not change ÷ n',
  },
};
