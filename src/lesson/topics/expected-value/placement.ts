// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): P(X = k) from equally likely outcomes (two
// dice), E(X) from fraction probabilities (a die or a spinner, the sectors listed in the question), and E(X) = np. All
// three stand alone (the numbers are in the question; the pictures only repeat them).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'build-equally-likely', family: 'buildDice', standalone: true },
    { subgoal: 'compute-ev', family: 'evFrac', standalone: true },
    { subgoal: 'binomial-expected-value', family: 'binomMean', standalone: true },
  ],
  use: it => !/calculator/.test(it.prompt) && plain(it.prompt).length <= 300,
  errorLabel: {
    'mc.probability.count-reported-as-probability': 'Gives the number of outcomes instead of dividing by all 36',
    'mc.probability.equiprobability-bias': 'Treats every value of X as equally likely',
    'mc.statistics.unweighted-average': 'Averages the values without weighting them by their probabilities',
    'mc.statistics.rounds-expectation-to-possible-count': 'Rounds the expected count to a whole number',
  },
};
