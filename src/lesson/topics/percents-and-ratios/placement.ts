// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a ratio step then a percent of one share, a
// percent step then a ratio split of the result, and two percent changes on a changing whole. Typed answers; the
// chain tape is the lesson's picture, not part of the question; no calculator items.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'chain-ratio-then-percent', family: 'ratioPercent', standalone: true },
    { subgoal: 'chain-percent-then-ratio', family: 'percentRatio', standalone: true },
    { subgoal: 'successive-percents', family: 'twoChanges', standalone: true },
  ],
  use: it => !/calculator/i.test(plain(it.prompt)) && !/\.\d{3}/.test(plain(it.prompt)),
};
