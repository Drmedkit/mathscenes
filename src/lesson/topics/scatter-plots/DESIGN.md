# Scatter plots and bivariate data (secondary-t5-40, grade 8, 8.SP.A.1-4)

**Concept.** A case is ONE paired observation (two measurements of the same individual) and becomes ONE dot. The
cloud of dots has a direction (a tendency, not a rule), a form (straight or curved, possibly changing direction), a
strength (how close the dots stay to the pattern, not how steep it is), and maybe clusters or outliers. A trend
line summarises a linear cloud; its predictions are estimates for a typical case, trustworthy only inside the
observed x-range; its slope and intercept read "on average". Paired categorical data go in a two-way table, and
association there is judged by comparing relative frequencies, never raw counts, and never as cause.

**Model: the scatter plot** (`Scatter.ts`, maths in `bivariate.ts`). A crisp grid, each axis its own equal-interval
scale (60 px numbers outside the plot, a zigzag break when an axis starts above 0), axis names with units (44 px),
amber beads for cases (a doubled case shows ×2), letter tags. Focus: plot dots one by one with dashed guides from
both axes, rings, sticks from dots to a line (closeness), a straight edge, a direction arrow, a slope triangle with
run / rise beside its legs, a prediction guide (up to the LINE, across to the y-axis), the observed x-range band,
cluster rings, a wrong join, candidate spots A-D. `TableCard.ts` draws a case table (split into two halves on the
narrow board) or a two-way table with margins; rows / columns / cells light up, a "?" cell can reveal its value.
Colour roles: amber = data, lime = the trend line and predictions, lavender = focus and construction, red = wrong.

**Data.** `SMOOTHIE`: 12 summer days at a smoothie stand, high temperature (°F) and smoothies sold; two days at 80°F
(58 and 72). Trend line by eye through (70, 40) and (90, 90): y = 2.5x - 135 (least squares slope within 0.3, 5 dots
above, 7 below, r > 0.95). Predictions: 65 at 80°F, 80 at 86°F, 165 at 120°F (extrapolation), -135 at 0°F
(meaningless intercept). Practice contexts (`CONTEXTS`, `CURVED`, `NONE`, `CLUSTERS`, `SURVEYS`) are realistic US
contexts with seeded noise; tests assert every fact an answer claims (r gaps for strength, best-line gaps, share gaps).

## The five parts
1. **The question**: the 12-day table on the board, the dots fall in, the two 80°F days ring. Tomorrow is 80°F: cards
   72 (one day: single-case-instead-of-distribution), about 65, can't tell (expects-points-on-fitted-line) + how sure.
2. **Worked example**: One day, one dot (each table row lights and becomes a dot with axis guides; both 80°F days
   kept) → Describe the cloud (arrow: positive; straight edge: linear; sticks: strong) → Fit a trend line (line,
   P and Q, slope triangle 20 / 50, m = 50/20 = 2.5, 40 = 2.5(70) + b, y = 2.5x - 135) → Predict at 80°F (guide,
   y = 2.5(80) - 135 = 65, leader to the hit, the real days 58 and 72 ring). Why: "why about 65, not 72?" (right /
   exactly 65 = prediction-as-certain / only the 80°F days = single-case).
3. **Your turn** (faded from the end): plot, description, line given. Predict at 86°F (80; 82 or 79 = the nearest
   dot: reads-nearest-point-not-line), the slope (on average / exactly = slope-exact / causes = correlation-implies-
   causation), the intercept (band shows 68-94; meaningless / real start = intercept-always-meaningful / useless =
   all-predictions-worthless), then the callback to the commit.
4. **Prove it**: Riley: "at 120°F she will sell 165". Wide window, the line extended dashed to a red "?". Chain:
   120°F is an extrapolation (band) / the data say nothing at 120°F (extension dims, 165 struck) / 65 at 80°F stays a
   fair estimate (guide). Distractor chips: no day was exactly 120°F (unobserved-input-as-extrapolation), the axis
   stopped at 95°F (misidentifies-observed-range), a line goes on forever (extrapolates-without-limit), no prediction
   can be trusted (all-predictions-worthless).
5. **Practice**: 38 families over 22 sub-goals (below), most with the plot or table as the picture; the solve replays
   on the canvas (guide, sticks, best line, band, rings, clusters, table cells).

## Sub-goal → families
| sub-goal | families |
|---|---|
| pair-case | caseVars, keepPairs |
| point-as-case | readPoint, countCases |
| plot-cases | whereDot, countCases, joinOrNot |
| axis-roles | whichOnX, axisPlan |
| axis-scales | pickScale, readScaleY |
| construct-plot | findTheFlaw, axisPlan, whereDot (table on a blank grid) |
| direction | nameDirection (incl. swapped axes), exceptionPair |
| form | linearOrCurve, straightEdge |
| strength | whichStronger (steep-loose vs shallow-tight; rescaled), strongMeans |
| clusters | countClusters, completeDesc |
| outliers | findOutlier, keepOrDelete |
| describe-in-context | fullDescription, completeDesc |
| scatter-vs-line-graph | whichDisplay, joinOrNot |
| fit-trend-line | bestLine, equalCounts, straightEdge |
| prediction-from-line | readPrediction, estimateMeaning |
| trend-equation | predictEq, writeEq |
| interp-vs-extrap | classify, observedRange |
| extrap-unjustified | whyRisky, estimateMeaning (interpolation caveat) |
| interpret-slope-intercept | slopeMeaning, interceptMeaning |
| two-way-table | readCell (incl. 2 x 3), grandTotal |
| relative-frequencies | relFreq, associated |
| categorical-association | associated, relFreq |
