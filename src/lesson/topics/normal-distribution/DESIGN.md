# The normal distribution (HS Statistics 7)

Topic `secondary-t7-18-statistical-inference-normal-distribution` (S-ID.A.4, S-IC.A.2), 30 sub-goals. Requires
`one-variable-data` (mean, SD, histograms, shape).

## Concept
A normal curve is a **model** for data: areas under it are shares of a population (and probabilities for one random
pick). Its two numbers: the mean locates it, the SD sets its width (area stays 1). Whole-SD regions come from
68-95-99.7 (halves by symmetry, tails by complement, bands by difference); everything else goes through the z-score
(a signed distance in SDs) and a cumulative-left area (table or normalcdf). Last stage: when is the model fair at
all, what is a fact and what an estimate, and why data never match a model exactly.

## Model
The kit Plane (`src/lesson/kit/Plane.ts`): the curve is a `curve`, an area is a `shade`, a density histogram is flat
`shade`s with `seg` edges. `NormalView.ts` turns a serializable picture (`common.ts` `NPic.card`) into Plane params:
the x axis in data units with a tick every SD (labels from the model, `?` / blank ticks for questions), the y axis
unlabelled for curves (height is not the point) and labelled for density histograms. Reused read-only: the
linear-regression `DataCard` (z-table excerpt "Area left of z", calculator screens) and the one-variable-data
`DataPlot` (simulated sample shares as two dot plots).

Methods stated in every item: **table** = z rounded to 2 decimal places, cumulative-left table, 4 decimal places (the
excerpt is in the picture, with neighbouring rows and the mirror row as decoys); **calculator** = normalcdf with raw
values; **68-95-99.7** = "about". Generators reject .x5 ties (z, table areas, counts, cutoffs) and ambiguous backwards
table reads (`zForAreaClear`).

## The five parts
1. **The question**: women N(64, 2.5); share taller than 69 in? 2.5% / 5% (both tails) / 47.5% (half of 95).
2. **Worked example** (curve card): SD axis (69 = 2 SD up), 68 and 95 as shaded areas, the tail (100 − 95) ÷ 2,
   then 67 in: z = 1.2, table 0.8849, 1 − 0.8849 = 0.1151. Why 1 − ...? (left area / z as percent / doubling).
3. **Your turn**: men N(69, 3): 66-75 in = 34 + 47.5 = 81.5%; z(73.5) = 1.5; table row 1.50 = 0.9332 → 0.0668.
4. **Prove it**: Riley "1-2 SD band = 95 − 68 = 27%". Chain: rule → nested regions subtract → symmetry halves.
5. **Practice**: 66 families, every sub-goal 2-3.

## Sub-goal → families
| sub-goal | families |
|---|---|
| density-histogram | densArea, densTotal, densUnequal |
| density-curve-area | curveHeight, curveVsBars |
| event-notation | eventWords, eventMeaning |
| point-vs-interval | pointEq, pointRound |
| normal-shape | shapeFit, shapeFacts |
| mean-as-location | meanMatch, meanShift |
| sd-as-scale | sdMatch, sdHeight |
| sketch-sd-axis | axisTick, axisParam |
| population-percent-interpretation | popCount, popStatement |
| empirical-rule | erCentral, erCount, erBeyond |
| benchmark-halves | halfPct, halfSide |
| benchmark-tails-complement | tailPct, tailOutside |
| benchmark-band-difference | bandPct, bandSum |
| z-meaning | zRead, zLocate |
| z-compute | zCalc, zCalcDec |
| z-compare | zCompare, zMatch |
| standardize-event | stdEvent, stdBetween |
| left-tail-area | leftTable, leftCount, leftBounds |
| right-tail-complement | rightSupplied, rightTable |
| between-area | betweenTable, betweenCommand |
| outside-area | outsideTable, outsideSym |
| specify-model-from-summaries | specModel, specEstimate |
| mixed-event-selection | mixedRegion, mixedFull, mixedData |
| inverse-normal | invZ, invCut, invMiddle |
| judge-normal-fit | fitContext, fitBound, fitCheck |
| z-does-not-normalize | stdShape, stdTable |
| data-fact-vs-model-estimate | factModel, factDiscrete |
| repeated-sample-variation | sampSpread, sampRead |
| model-data-discrepancy | discExplain, discCoin |
| precision-vs-model-uncertainty | precReport, precTableCalc |
