// plan.ts: practice walks through every sub-goal of secondary-t8-19-expected-value-and-probability-distributions, in
// topic JSON order, each with the families that practise it (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'rv-assign', title: 'A random variable turns outcomes into numbers', families: ['rvValue', 'rvWhich'] },
  { id: 'event-x-equals-k', title: 'The event {X = k}', families: ['eventCount', 'eventList'] },
  { id: 'distribution-concept', title: 'X, its values, its distribution', families: ['distParts', 'distRead'] },
  { id: 'validity-check', title: 'Valid distributions', families: ['validJudge', 'validMissing'] },
  { id: 'build-equally-likely', title: 'Build a distribution from equally likely outcomes', families: ['buildCoins', 'buildDice'] },
  { id: 'graph-distribution', title: 'Graph a distribution', families: ['graphHeight', 'graphAxis'] },
  { id: 'event-probabilities', title: 'Events stated with X', families: ['eventSymbols', 'eventWords'] },
  { id: 'path-probability', title: 'Multiply along a path', families: ['pathGuess', 'pathSpinner'] },
  { id: 'multi-path-distribution', title: 'Several paths, one value', families: ['multiGuess', 'multiShots'] },
  { id: 'empirical-distribution', title: 'A distribution from survey data', families: ['empRel', 'empEstimate'] },
  { id: 'frequency-table-mean', title: 'The mean of a frequency table', families: ['freqMean', 'freqWhich'] },
  { id: 'ev-weighted-mean', title: 'E(X) is a weighted mean', families: ['evHundred', 'evNotMode'] },
  { id: 'compute-ev', title: 'Calculate E(X)', families: ['evTable', 'evFrac'] },
  { id: 'net-payoff-ev', title: 'Expected net payoff', families: ['netRaffle', 'netCarnival', 'fairGame'] },
  { id: 'ev-single-outcome', title: 'E(X) and one trial', families: ['evPossible', 'evOnePlay'] },
  { id: 'long-run-average', title: 'E(X) as the long-run average', families: ['runRead', 'runCheck'] },
  { id: 'no-compensation', title: 'No catching up', families: ['streakNext', 'streakCount'] },
  { id: 'expected-total', title: 'Expected totals', families: ['totalN', 'totalPossible', 'totalSpread'] },
  { id: 'same-mean-different-distributions', title: 'Same mean, different distributions', families: ['sameMean', 'sameMeanPick'] },
  { id: 'binomial-distribution', title: 'The binomial distribution', families: ['binomSetting', 'binomExact', 'binomCumul'] },
  { id: 'binomial-expected-value', title: 'E(X) = np', families: ['binomMean', 'binomMeaning'] },
  { id: 'geometric-distribution', title: 'Waiting for the first success', families: ['geoExact', 'geoTail', 'geoMean'] },
  { id: 'poisson-distribution', title: 'Poisson counts', families: ['poisRescale', 'poisProb', 'poisMeaning'] },
  { id: 'binomial-normal-connection', title: 'A normal model for a binomial count', families: ['bnCheck', 'bnParams', 'bnEstimate'] },
];
