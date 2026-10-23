// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): estimate a count from a random sample's
// proportion, predict a population percent (the complement), and judge a statistic against a parameter. Typed answers
// where the skill has one; the questions carry every number they need, so no plot is shown.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'estimate-count-from-proportion', family: 'scaleCount', standalone: true },
    { subgoal: 'predict-population-percent', family: 'complementPct', standalone: true },
    { subgoal: 'bias-vs-variability', family: 'biasOrChance', standalone: true },
  ],
  use: it => !/\bplot|calculator/i.test(plain(it.prompt)),
};
