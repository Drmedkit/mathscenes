# Sampling and comparative inferences (grade 7, 7.SP.A.1-2, 7.SP.B.3-4)

Topic `secondary-t5-25-sampling-and-comparative-inferences`, page `pages/lessons/sampling-and-inference.html`.
Follows `judging-samples` (who the data cover); this topic adds chance: random samples, how much they vary, and how
far a sample-based claim may reach.

## Concept
A random sample's mean is an **estimate**: it lands near the population mean, not on it, and a different random
sample gives a different mean (sampling variability). Bigger random samples give steadier means, but the individuals
vary as much as ever. A biased method misses the same way every time, and more answers don't fix it. A share in the
sample predicts the share in the population (scale up, round once, say "about"); two groups are compared by the gap
between centers measured in spread units (MAD or IQR), weighed against sample size.

## Models
- **Sampler** (`Sampler.ts`): a roster card of name slips (the population, amber outline; drawn slips light teal) over
  up to four dot plots on ONE shared number line (crisp axis, numbers 62 px under the last row only). Rows: one
  sample's values (dots fly down from the drawn slips), means of many samples (`bin: 0` = exact positions, a dot
  rises where it would touch), two groups, or box plots. Marks (triangles) under a row = a mean / median. Overlays:
  the population mean (amber dashed line, one segment per plot area, never through a label), bands +-d
  ("most within d", lime), and a gap ruler between two marks in spread units. Steps `roster pick rowN markN pop
  bandN gap`; `where` boxes for leaders (marks) and pulses (labels). Throws when dots would get under 5.5 px.
- **ScaleBars** (`ScaleBars.ts`): the sample bar (teal) and the population bar (amber), same length, the counted
  share lime in both, numbers under their segments, a curved x-factor arrow. Steps `top bottom shade factor nums`.
- **Nested** (`Nested.ts`): nested sets (population region, sample region inside; census; "population: ?"; a lime
  outline for how far a claim reaches). Steps `outer inner claim`.
- **Maths** (`samplingMaths.ts`): seeded populations on a grid (exact total), draws without replacement, mean /
  median / quartiles (medians of halves) / MAD / IQR, repeated sampling, `mostWithin` (3 of 4 means within d),
  whole and non-whole scaling kept exact and rounded once, percent of a count.
- **Story** (`story.ts`): Ridgeview Middle, 200 seventh graders, homework minutes, population mean 42 (the planner app
  logged everyone). Seeded and asserted at load: Maya 46, Leo 34 (halfway 40 is NOT 42), 20 means of 10 from 34 to
  50.5 (most within 6), a sample of 40 totaling 1,720 (43), means of 40 most within 3, volunteer polls of 60 near 55.
- Board: TeX lines on a wider slate (x 1000-1860) placed at the height of the row they talk about; one leader (sample
  mean -> its mark) whose rail runs under the mark, below the ticks.

## The five parts
1. **The question**: Maya's 10 names: 46; Leo puts them back and draws 10: 34. Cards: one made a mistake
   (`sample-should-mirror-population`), both fair estimates (right), exactly 40, halfway
   (`sample-statistic-as-exact-parameter`) + how sure.
2. **Worked example** (same study): Name the population and the sample (roster pulse, slips light, 2 board lines) ->
   Find the sample mean (dots fly down, mark, 460 / 10 = 46 with a leader) -> Draw again and again (20 means appear)
   -> Check against the population (amber line at 42, band +-6). Why don't the means all equal 42? (right: chance
   picks a different 10; `sample-should-mirror-population`; `sampling-dot-as-individual`).
3. **Your turn** (samples of 40, faded from the end): step 1 given; the kid types the mean (1,720 / 40 = 43), predicts
   how the means of 40 spread (`individual-vs-statistic-spread`, `smaller-sample-guarantees-smaller-spread`), the
   picture settles it, then "most within about 3" (vs 6 for samples of 10, vs 14 = single students). Callback to
   the part-1 card.
4. **Prove it**: the online poll (60 volunteers, mean 55); Jordan: 60 beats 40. Judge, then a 3-line because-chain:
   random samples land near 42 (equal chance) / the poll leans (heavy-homework students answer) / so it misses the
   same way every time (size shrinks chance error, not selection error). Distractors: `large-sample-cures-bias`,
   `bias-means-dishonesty`, `sample-should-mirror-population`. The picture: 20 random samples of 40 round 42, 20
   polls of 60 round 55, a ruler 42 -> 55 ("13 every time"), Jordan's line struck.
5. **Practice**: all 17 sub-goals in topic order, then mixed (runtime/practice.ts).

## Sub-goal -> families (plan.ts)
| sub-goal | families | picture | main misconceptions |
|---|---|---|---|
| pop-sample-id | popSample (explicit, wider than the place, census, unstated) | roster / nested | confuses-sample-and-population-terms, population-means-everyone-everywhere |
| within-variability | spreadCompare (less / more / same, by MAD) | two dot plots | smaller-sample-guarantees-smaller-spread, sample-should-mirror-population |
| statistic-parameter | statParam (known in a simulation / unknown) | board | sample-statistic-as-exact-parameter, confuses-sample-and-population-terms, mean-as-every-individual-value |
| random-representative | isRandom, randomDiffers | board | collects-from-whoever-is-convenient, hand-picked-typical-sample-as-random, large-sample-cures-bias, sample-should-mirror-population |
| sampling-variability-concept | whatDot, twoSamples | values + means | sampling-dot-as-individual, sample-should-mirror-population, sample-statistic-as-exact-parameter |
| sample-size-effect | whichSize (n 10 vs 50), biggerSample | two means plots | individual-vs-statistic-spread, smaller-sample-guarantees-smaller-spread |
| random-sampling-protocol | drawNumbers (repeat + off-roster number), absent | board (the random numbers) | reuses-object-without-replacement, random-protocol-deviations-ok |
| estimate-from-sample | estimate (mean / median, typed), report | sample dot plot + mark | sample-statistic-as-exact-parameter, mean-as-every-individual-value |
| simulate-repeated-samples | typical (most within d of a known mean), plan | values + means + band | individual-vs-statistic-spread, recompute-same-sample-as-resampling |
| estimate-count-from-proportion | scaleCount (typed), reportCount | ScaleBars x k | additive-keep-difference, sample-statistic-as-exact-parameter |
| center-difference-in-mad-units | madUnits (typed; exact MADs by construction), pickMeasure | two groups + MAD ruler | center-difference-ignores-spread, center-gap-divided-by-unrequested-spread |
| informal-comparative-inference | compare (clear gap / samples of 5 / half a MAD) | two groups + ruler | overlap-makes-comparison-impossible, spread-ratio-as-automatic-verdict, center-difference-ignores-spread |
| selection-bias-mechanism | biasWay (convenience / voluntary / undercoverage, 8 contexts) | board | bias-means-dishonesty, large-sample-cures-bias |
| bias-vs-variability | biasOrChance, whichBiased (random vs volunteer polls) | means plots + pop line | large-sample-cures-bias, sample-should-mirror-population |
| scope-of-generalization | scope (random / volunteers / two schools) | nested + claim outline | generalizes-beyond-sampled-group, mean-as-every-individual-value |
| estimate-count-nonwhole-factor | scaleNonWhole (typed, round once) | ScaleBars | intermediate-precision-always-invalid (factor rounded first), additive-keep-difference |
| predict-population-percent | complementPct, complementCount (2 and 3 categories) | ScaleBars | complement-subtracts-unscaled-sample-count, sample-percent-applied-to-sample-size |
