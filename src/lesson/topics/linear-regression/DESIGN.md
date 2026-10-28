# Scatter plots, correlation and the regression line (secondary-t6-16, HS Statistics 2)

**Concept.** A fitted line is a model: it gives one predicted value ŷ for each x (a function), and real cases scatter
around it. The residual e = y − ŷ is the signed vertical miss (positive = above the line = under-predicted). The
least-squares line is the line with the smallest sum of squared residuals (signed residuals cancel, hitting points
exactly is not the goal). Its slope and intercept read "predicted / on average", the intercept only means something
when x = 0 is in the data. r (no units, −1 to 1) measures only the direction and strength of a LINEAR association;
the residual plot, not r, decides whether a line is the right form. A model reaches only the x-interval, population
and conditions the data represent; correlation in observational data is not cause (a randomized experiment can be).
AP extension: r² = 1 − SSE / SST, the share of the variation in y the line accounts for; r² compares models only for
the same response and the same data.

**Grade-8 lesson `scatter-plots`** already did plotting, describing a cloud, a trend line by eye and interpolation.
This lesson goes beyond it: residuals and residual plots, the least-squares criterion, technology output (TI-84 a+bx
and ax+b, Desmos, spreadsheet), r and r², influential points, scope, lurking variables and experiments, the three-check
critique.

**Model.** The shared kit's Plane (scatter plots, the fitted line, residual sticks as segments, a residual plot with
its 0 line and x tick labels under the grid); `DataCard.ts` (data tables x | y | ŷ, TI lists L1 | L2, technology output
screens; could move to the kit). Maths in `regMaths.ts` (least squares, r, residuals, rounding half away from zero with
a tie guard), contexts and item makers in `kit.ts`, families in `famA/B/C.ts`, lesson data in `lessonData.ts`.

**Conventions stated to the student.** Coefficients and r are rounded to the places each item names (2 decimals for
technology output, 1 for predictions and residuals unless exact); generators reject values within 2% of a rounding
unit of a .x5 tie. Endpoints of the observed x-interval count as inside (interpolation). Strength is never asked as a
label ("strong / weak"): only as a comparison of |r| (gap ≥ 0.15) or of residual sizes on the same vertical scale.

## The five parts
1. **The question**: 8 used cars (mileage, price) and three lines: A joins the first and last car, B passes exactly
   through 3 cars, C through none. Which fits best? Cards A (line-through-first-and-last), B (line-through-most-points),
   C + how sure.
2. **Worked example** (4 steps, picture first): one car's residual (the car at 95: ŷ = 12.5, e = +1.5); least squares
   (the sticks of B, A, C: Σe² = 62.0, 19.8, 8.6; C is the rounded least-squares line); slope (−$120 per 1,000 miles,
   on average; slope triangle) and intercept (0 miles is outside 20-110: only an anchor); r = −0.96 and the residual
   plot (no pattern). Why: "why square instead of add?" (right / most points / signed sum).
3. **Your turn** (faded): 10 students (hours studied, score), LinReg(a+bx) output given. The student picks the equation
   (swaps-a-and-b, r as slope), predicts at 8 hours (90.7; observed 81 = expects-points-on-line; swapped), finds the
   residual of the student who scored 81 (−9.7; +9.7 = residual-sign-errors) and interprets it (over-predicts / under /
   bare number). Callback to the commit.
4. **Prove it**: Riley: "r = 0.99 for stopping distance against speed, so a line is right". Chain: the residual plot
   is U-shaped (residuals + at both ends, − in the middle) / the line misses in a system (295 ft predicted at 70 mph,
   315 needed; the data curve upward) / r = 0.99 does not rescue it (r measures closeness to some line, not form).
   Distractor chips: high-r-settles-everything, small-residuals-ignore-pattern, r-as-percent-correct.
5. **Practice**: 53 families over 27 sub-goals (below), most with a scatter plot, a residual plot, a data table or a
   technology screen; the solve replays on the picture (sticks, the point on the line, the refit line, hidden cells).

## Sub-goal → families
| sub-goal | families |
|---|---|
| variable-roles | roles, rolesAxis |
| exact-vs-statistical | exactStat, exactSample |
| observed-vs-predicted | yhatRead, obsPred |
| fit-by-eye | eyeEq, eyeCritique |
| predict-from-model | predict, predictTable |
| residual-compute | residual, residGraph |
| residual-in-context | residMeaning, residCompare |
| residual-plot-construct | residPoint, residZero |
| residual-pattern | pattern, strengthResid |
| least-squares-criterion | sseCompare, sseCompute |
| enter-paired-data | pairedLists |
| technology-lsrl | readOutput, lsrlData |
| slope-interpret | slopeSentence, slopeChange |
| intercept-interpret | interceptMeaning, whichCoef |
| r-obtain | readR, rData, rUnits |
| r-direction | rSign, rMismatch |
| r-strength | rStrongest, steepTight |
| r-linear-only | rZero, highRCurve |
| interpolation-extrapolation | interExtra, extraNonsense |
| representative-data | represent, bigSample |
| population-scope | scope, scopeWhich |
| lurking-variable | lurking, causeClaim |
| experiment-for-cause | design, designLimits |
| influential-point | refit, reportNotDelete |
| three-check-critique | critique |
| r-squared-meaning | r2SS, r2Sentence, rFromR2 |
| r-squared-limits | r2Compare, highRCurve |
