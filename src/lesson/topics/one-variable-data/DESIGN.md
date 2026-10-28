# Summarizing and comparing data (secondary-t6-15, HS Statistics 1, HSS-ID.A.1-3)

**Concept.** A distribution has a shape, a center and a spread, read along ONE measurement axis. Which summary fits
depends on the shape: the median and IQR come from the middle of the ordered list and resist a long tail or an
outlier; the mean and SD use every value (the SD weights big distances more). A 1.5 × IQR fence is one stated
convention for flagging outliers, never a reason to delete them. Comparing groups means the same measures for both,
on one scale, with units and n.

**Conventions (stated in every item that needs them, `common.ts` RULE).** Quartiles: the median of each half of the
ordered list, the median left out for odd n (TI-84). Outlier: strictly beyond Q1 − 1.5·IQR or Q3 + 1.5·IQR (on a
fence is not an outlier). Modified box plot: whiskers end at the most extreme non-outliers. SD = σ, the population SD
(σx), unless the item reads Sx. Histogram bins: lower end in, upper end out. Rounding: the item names the place; data
are built so the exact value is never a .x5 tie (`tenth()`).

**Model: DataPlot** (`DataPlot.ts`, maths in `stats.ts`): one card, one axis, 1 to 4 panels stacked on it (dot plot,
histogram with chosen bins and a count scale, box plot from data or a given summary, standard or modified), plus marks
(vline with a label, bracket, band, fulcrum = the mean as the balance point, devs = each dot's distance to the mean).
Every element has a step key (`<panel>`, `<panel>.med/.q/.box/.whisk/.out`, `<mark>`), `where()` boxes, focus
(recoloured / faded / shifted dots, dimmed panels, rings). It throws a BlockError when dots would overlap (r < 7.5),
a value or mark leaves the axis, or tick labels collide. Candidate for `src/lesson/kit/`.

## The five parts
1. **The question**: 11 commute times, one of 59 min. Typical commute? Cards 22 (mean: mean-always-best-summary),
   19 (median), 33.5 (midrange-as-median) + how sure. The 59 dot is coloured.
2. **Worked example** (dot plot over a modified box plot, shared axis): count in from both ends (dots light in pairs,
   the 6th = median 19) → halves turn teal, Q1 13 / Q3 26 ring, the box builds, IQR 13 → fence 26 + 19.5 = 45.5, the
   zone beyond it shades red, 59 turns red, whisker to 29, 59 a point → the mean fulcrum lands at 22, right of the
   median: report median 19, IQR 13 (n = 11). Why? (right / "the median is always better" = center-choice-ignores-
   question-purpose / "59 must be a mistake" = unusual-value-must-be-error).
3. **Your turn**: 11 battery lives with a LOW outlier (4 h). Median and quartiles given; the student types the IQR
   (23 = range, 7 = count between quartiles), the fences (12, 30 = one IQR), picks the lower whisker end (9 = whisker to
   the fence, 4 = the outlier). Callback to the card.
4. **Prove it**: Sam: "every reading +5°F, so the SD goes from 2 to 7". Before / after dot plots; the after plot
   slides 5 to the right with its fulcrum; distance segments match. Chain: mean 65 → 70 / distances unchanged / SD
   stays 2. Decoy chips: shift-changes-spread, sd-must-be-observed-value.
5. **Practice**: all 28 sub-goals, then mixed. Plot items draw the DataPlot (empty panels and answer marks come in
   on the replay after a miss); list / output / stem-and-leaf items get the big slate.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| median-review | medianList (unsorted, odd/even, repeats), medianDots |
| center-location | differIn (shift / spread), sameCenter |
| spread-along-axis | differIn (+ same range, different concentration), spreadMore (flat vs mound histograms) |
| shape-skew-by-tail | shapeName (skew both ways, mound, uniform, bimodal), shapeFeature (gap, clusters) |
| boxplot-approx-quarters | boxPercent (n = 7, 11, 15 distinct, box + dots), boxTruth |
| unusual-value-informal | unusualWhere (same value, two sets), unusualMax |
| deviation-from-mean | devOne, devBalance (missing value from the balance point) |
| mad-typical-distance | madCompute (whole MAD), madMeaning |
| sd-meaning | sdRank (3 sets by eye; the {3,3,9,9} vs {0,6,6,12} contrast), sdTransform (+c, ×k, unit change) |
| supplied-scale-displays | binCount (no edge values), dotStack |
| dotplot-scale | scaleChoice (decimals, negatives), scaleRead |
| histogram-intervals | boundaryBin, binCount (edge values) |
| histogram-bin-width | binWidth (wide bins hide two peaks; same data, other bins) |
| five-number-summary | quartiles (odd/even, decimals, negatives), iqr |
| outlier-fence-rule | fences (decimal quartiles, negative lower fence), isOutlier (high, low, both, none, on a fence) |
| modified-boxplot | whiskerEnd, modPlotPick (standard / to the fences / right) |
| choose-display | displayChoice |
| data-structure-displays | dataType (codes, two categorical), stemLeaf |
| data-list-entry | entryCheck (n, impossible mean, header in range), entryFix |
| sd-technology | sdOutput (1-Var Stats: σx vs Sx), sdPlausible (bounds) |
| weighted-average | weighted (grade, GPA, price per lb), weightedSense |
| context-summary | summaryPick |
| two-set-summary | twoSet, comparableRow |
| outlier-effect-center | effectCenter (replace max: d/n; add a value; the right-tail counterexample), meanShift |
| outlier-effect-spread | effectSpread (CEO salary; adding a value moves the IQR), iqrAfter |
| choose-measures | choosePair (symmetric, skewed, outlier, two clusters, total matters) |
| compare-distributions | compareClaim, differIn (+ both differ) |
| outlier-handling | handleOutlier (typo, verified, unknown, the point of the study), typoFix |
