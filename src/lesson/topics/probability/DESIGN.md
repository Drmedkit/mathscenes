# Probability concepts (grade 7, 7.SP.C.5-8): design

**Concept.** A probability is a number from 0 to 1 that measures how likely an event is. When the outcomes of one
trial are equally likely, P(event) = favorable outcomes / all outcomes, counted at the level where the outcomes
really are equally likely (the marbles, not the colors). It describes the long run: a few trials can wander far from
it, many trials settle near it, and the past does not change the next trial.

**Model** (`Chance.ts`, maths in `chanceMaths.ts`): a cloth bag with its marbles laid out beside it, each marble its
own outcome (B₁ B₂ B₃ W), above a crisp 0-1 probability scale with the five words. Colour roles: amber (first) = all
outcomes / the total, lime (link) = the event's outcomes and its probability, teal (second) = the other outcomes
(complement), lavender (pick) = one outcome in focus, red = wrong. Marble colours are object colours (blue, white,
pink, gray) that never play a role. Other painters for practice: number cube faces, spinner (equal or not), count
bars, a strip of n trials, a running-share chart, a dot plot of reference batches, a random-digit strip, an outcome
table and a tree. The experiment in part 4 is a seeded simulation the kid starts (no Math.random in drawing).

## The five parts
1. **The question.** 3 blue + 1 white marble, pull one without looking: how likely is blue? Cards 1/2 (two colors:
   equiprobability bias), 3/4, "3 to 1" (other part as the whole). How sure.
2. **Worked example** (List, Check, Count, Write). List: every marble gets a name, the amber bracket and
   S = {B₁, B₂, B₃, W}. Check: same size, well mixed, so each marble 1/4 (lavender leader to one marble); the colors are
   not equally likely. Count: the event "blue" = {B₁, B₂, B₃}, lime rings. Write: P(blue) = 3/4, the pin goes on the
   scale at "likely", leader from the fraction to the pin. Why: "why isn't it 1/2 with two colors?" (3 reasons).
3. **Your turn** (faded from the end): 2 blue, 3 white, 1 pink; event "not white". List and Check are given; the kid
   taps the marbles of the event (chips), types P(not white) (3/6 or 1/2; 2/3 = counting colors), places it on the
   scale (as likely as not). Callback to the card picked in part 1.
4. **Prove it.** Sam draws 4 times with replacement (B W B W) and claims P(blue) is really 1/2. Judge, then a
   because-chain: (1) four draws easily give 2 blue, because 10 batches of 4 jump around (dot plot of a seeded run);
   (2) many draws settle near 3/4, because 400 draws end close to 3/4 after wandering (running-share chart); (3) so
   four draws can't overturn 3/4, because a probability describes the long run. Decoy chips: "4 draws should give
   exactly 3 blue", "every draw brings the share closer", "after two whites blue is due". Sam's 1/2 is struck after
   the evidence.
5. **Practice**: all 20 sub-goals one after another, then mixed (runtime/practice.ts).

## Sub-goal → family
| # | sub-goal | family | input | picture |
|---|---|---|---|---|
| 1 | probability-scale-0-1 | scale (event/value/forecast → word, forecast not a promise) | choice | scale |
| 2 | sample-space-single-stage | space (complete list; how many outcomes, by color or by marble) | choice / num | bag, cube, spinner |
| 3 | event-as-subset | event (outcomes of "at most 2", "greater than 4", ...) | choice / num | cube, bag |
| 4 | equal-likelihood-assumption | equal (justified / not / can't tell without data) | choice | spinner, bag, cube |
| 5 | experimental-relative-frequency | relFreq (count / total trials from a table) | frac | bars |
| 6 | theoretical-uniform | theory (favorable / total, object level) | frac | bag, cube, spinner |
| 7 | complete-model-sums-to-1 | model (missing probability; which table is a model) | frac / choice | bars |
| 8 | complement | complement (1 − P; tens of percent) | frac / num | scale |
| 9 | probability-notation-forms | forms (most likely in mixed forms; valid values; decimal complement) | choice | scale |
| 10 | predict-expected-count | predict (about n·P; "about" not "exactly") | num / choice | trials strip |
| 11 | event-probability-nonuniform | nonUniform (add outcome probabilities) | frac | spinner, bars |
| 12 | batch-variation | batches (why batches differ; closest share) | choice | bars |
| 13 | long-run-stabilization | longRun (run chart: settles, not monotonic) | choice | run chart |
| 14 | no-due-outcomes | streak (the mechanism sets the next trial) | choice | streak |
| 15 | model-data-discrepancy | discrepancy (observation against reference batches) | choice | dot plot |
| 16 | simulate-compound-event | simDigits (blocks of digits, successful trials) | num / frac / choice | digit strip |
| 17 | compound-sample-space | compoundSpace (ordered outcomes; without replacement) | num / choice | table, tree |
| 18 | compound-theoretical-probability | compoundP (favorable ordered outcomes / total) | frac / choice | table, tree |
| 19 | design-simulation | designSim (device, trial, replacement) | choice | spinner / none |
| 20 | compound-predict-and-compare | compoundPredict (P × trials, not stages; compare) | num / choice | trials strip |
