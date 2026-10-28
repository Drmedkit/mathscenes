# Probability distributions and expected value (secondary-t8-19, HS Statistics 8, HSS-MD.A.1-4, B.5)

**Concept.** A random variable is a rule that turns each outcome into a number (several outcomes may share one value);
the event {X = k} is the set of outcomes behind a value. Its distribution pairs every value with its probability: a
table or a bar graph whose heights (not counts, not values) are probabilities between 0 and 1 that add to 1. E(X) =
Σ x·P(x) is the probability-weighted mean: the average per trial of a hypothetical 100 / 800 / 1,000 trials in exact
proportion, the long-run average of many independent trials (no compensation for streaks), and the **balance point**
of the bar graph: the turning effect about a pivot m is Σ(x − m)P(x) = E(X) − m, zero only at m = E(X). It need not
be a possible value, the most likely value or the plain average of the values. Net payoff = prize − cost for every
outcome; a game is fair when E(net) = 0. Expected totals are n·E(X) (not guaranteed; averages settle, totals stray).
Equal means do not make equal distributions. Named models: binomial (fixed n, independent, constant p; C(n, k) paths
of probability p^k q^(n−k); E = np), geometric (trial of the first success, q^(k−1)p, E = 1/p is no deadline),
Poisson (constant rate, rescale λ to the interval), and the normal model N(np, √(np(1 − p))) when np and n(1 − p) are
both at least 10.

**Conventions (stated in the items).** Probabilities as fractions accept any equivalent fraction (key in lowest
terms); stated decimals are exact unless a rounding is stated ("three decimal places"; never at a tie, slips that
round to the same value are avoided). Money to the nearest cent, exact. Geometric X counts the trial of the first
success; the "failures before" convention is named when it is used. Calculator items say so.

**Model: DistPic** (`DistPic.ts`, maths in `ev.ts`): one card per picture. `bars` = the bar graph on a balance beam
(values at true places on a number line, heights = probabilities with TeX labels, optional probability scale, a pivot
that the page slides; on 'tilt' the beam tips by Σ P(x)(x − m), level exactly at m = E(X); hidden bars dashed "?"
until the replay), `table` = the distribution on its side (head column x / P(X = x) / x·P(x), "?" cells, event columns
lime), plus wrappers for `cond` (CondPic: trees, the dice grid, spinners), `count` (CountPic: coin trees, outcome
tokens), `run` (running mean on the kit Plane, plays on a log scale, E as a dashed level) and `binorm` (binomial
histogram + normal curve on the kit Plane). Colours: amber (first) = bars / values, teal (second) = probabilities,
lime (link) = E(X) and answers, lavender (pick) = the pivot and "?", brown = the beam. The bars + table kinds could
move to `src/lesson/kit/` for every discrete-distribution lesson.

## The five parts
1. **The question**: a booth spinner, 8 equal sectors (4 × $0, 3 × $2, 1 × $10). Average payout per spin? Cards $0
   (ev-as-most-likely-value), $2, $4 (unweighted-average) + how sure.
2. **Worked example** (Table, Draw, Average, Balance): X = prize, table 4/8, 3/8, 1/8 (sum 1); the spinner turns into
   the bar graph on a beam; 800 spins: (400·0 + 300·2 + 100·10)/800 = 2 = Σ x·P(x); pivot at $4 (the plain average)
   tips, slides to $2 and balances. Why? (right / "the middle prize" / "the most likely prize").
3. **Your turn**: guess on 3 four-choice questions, X = number right. Given P(X = 0) = 27/64; typed P(X = 1) = 27/64
   (9/64 = omits-order-factor, 1/4 = equiprobability), the rest fill in; typed E(X) = 0.75 (1.5 unweighted, 1
   sums-probability-column), the pivot comes in level at 0.75; "can one quiz give 0.75?" (rounds / mode). Callback.
4. **Prove it**: Ana: "a distribution balances at its most likely value, $0". The pivot at $0 tips. Because-chain:
   Σ(x − m)P(x) = Σx·P(x) − mΣP(x) (multiply out) = E(X) − m (m constant, ΣP = 1) = 0 only at m = E(X) = 2; the pivot
   slides to $2. Decoys: equal weights (unweighted), tallest bar (mode), ΣP = number of values (not summing to one).
5. **Practice**: 24 sub-goals, 54 families.

## Sub-goal → families
| sub-goal | families |
|---|---|
| rv-assign | rvValue, rvWhich |
| event-x-equals-k | eventCount, eventList |
| distribution-concept | distParts, distRead |
| validity-check | validJudge, validMissing |
| build-equally-likely | buildCoins, buildDice |
| graph-distribution | graphHeight, graphAxis |
| event-probabilities | eventSymbols, eventWords |
| path-probability | pathGuess, pathSpinner |
| multi-path-distribution | multiGuess, multiShots |
| empirical-distribution | empRel, empEstimate |
| frequency-table-mean | freqMean, freqWhich |
| ev-weighted-mean | evHundred, evNotMode |
| compute-ev | evTable, evFrac |
| net-payoff-ev | netRaffle, netCarnival, fairGame |
| ev-single-outcome | evPossible, evOnePlay |
| long-run-average | runRead (a real simulation's running mean), runCheck |
| no-compensation | streakNext, streakCount |
| expected-total | totalN, totalPossible, totalSpread |
| same-mean-different-distributions | sameMean, sameMeanPick |
| binomial-distribution | binomSetting, binomExact, binomCumul |
| binomial-expected-value | binomMean, binomMeaning |
| geometric-distribution | geoExact, geoTail, geoMean |
| poisson-distribution | poisRescale, poisProb, poisMeaning |
| binomial-normal-connection | bnCheck, bnParams, bnEstimate |
