// items.ts: the practice families of "Probability distributions and expected value" (secondary-t8-19), one map for
// the runtime. Families live in famA (stage 1-2: the variable, its distribution, paths), famB (stage 2: E(X), payoffs,
// the long run, totals) and famC (stage 3: binomial, geometric, Poisson, the normal approximation); shared makers in
// common.ts. Pure: no DOM.
import type { Gen } from './common';
import { buildCoins, buildDice, distParts, distRead, eventCount, eventList, eventSymbols, eventWords, graphAxis, graphHeight, multiGuess, multiShots, pathGuess, pathSpinner, rvValue, rvWhich, validJudge, validMissing } from './famA';
import { empEstimate, empRel, evFrac, evHundred, evNotMode, evOnePlay, evPossible, evTable, fairGame, freqMean, freqWhich, netCarnival, netRaffle, runCheck, runRead, sameMean, sameMeanPick, streakCount, streakNext, totalN, totalPossible, totalSpread } from './famB';
import { binomCumul, binomExact, binomMean, binomMeaning, binomSetting, bnCheck, bnEstimate, bnParams, geoExact, geoMean, geoTail, poisMeaning, poisProb, poisRescale } from './famC';

export type { DItem, Pic } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  rvValue, rvWhich, eventCount, eventList, distParts, distRead, validJudge, validMissing, buildCoins, buildDice, graphHeight, graphAxis,
  eventSymbols, eventWords, pathGuess, pathSpinner, multiGuess, multiShots,
  empRel, empEstimate, freqMean, freqWhich, evHundred, evNotMode, evTable, evFrac, netRaffle, netCarnival, fairGame, evPossible, evOnePlay,
  runRead, runCheck, streakNext, streakCount, totalN, totalPossible, totalSpread, sameMean, sameMeanPick,
  binomSetting, binomExact, binomCumul, binomMean, binomMeaning, geoExact, geoTail, geoMean, poisRescale, poisProb, poisMeaning, bnCheck, bnParams, bnEstimate,
};
export const FAMILY_NAMES: Record<string, string> = {
  rvValue: 'Outcome to number', rvWhich: 'What a random variable is', eventCount: 'Outcomes in {X = k}', eventList: 'The event {X = k}',
  distParts: 'Value or probability?', distRead: 'Read the distribution', validJudge: 'A valid distribution?', validMissing: 'The missing probability',
  buildCoins: 'Coins: build P(X = k)', buildDice: 'Dice: build P(X = k)', graphHeight: 'How tall is the bar?', graphAxis: 'Draw the distribution',
  eventSymbols: 'P(X ≥ k) and friends', eventWords: 'At least, at most', pathGuess: 'Multiply along a path', pathSpinner: 'An unequal spinner',
  multiGuess: 'Several paths, one value', multiShots: 'Add the paths',
  empRel: 'Estimate from a survey', empEstimate: 'What a survey estimates', freqMean: 'Mean from a frequency table', freqWhich: 'The weighted mean',
  evHundred: 'Picture 100 trials', evNotMode: 'Mean, mode or plain average?', evTable: 'E(X) from a table', evFrac: 'E(X) with fractions',
  netRaffle: 'Raffle ticket: net payoff', netCarnival: 'Carnival game: net payoff', fairGame: 'Is the game fair?', evPossible: 'Can one trial give E(X)?',
  evOnePlay: 'One play vs. the mean', runRead: 'The running mean', runCheck: 'A short run', streakNext: 'After a streak', streakCount: 'No catching up',
  totalN: 'Expected total', totalPossible: 'Which totals can happen?', totalSpread: 'Totals vs. averages', sameMean: 'Same mean, different spread',
  sameMeanPick: 'Find the same mean', binomSetting: 'Is it binomial?', binomExact: 'Binomial: exactly k', binomCumul: 'Binomial: at least, at most',
  binomMean: 'E(X) = np', binomMeaning: 'What np means', geoExact: 'First success on trial k', geoTail: 'Waiting longer than k',
  geoMean: 'Mean waiting time', poisRescale: 'Rescale the rate', poisProb: 'Poisson probabilities', poisMeaning: 'Poisson: when and what',
  bnCheck: 'Normal model reasonable?', bnParams: 'Mean and SD of the count', bnEstimate: 'Survey results by the normal rule',
};
