# Quadratic and exponential regression (secondary-t7-19, HS Statistics 3)

**Concept.** Two curved families can both hug the same data. Residuals (observed − predicted, on the original
scale, for a curve just as for a line) and their plot decide the FORM: a systematic pattern (U, arch, wave) means the
family is wrong; no pattern means the form is fine, and the residual SIZE against the units and the use decides
whether it is good enough. Technology fits by least squares (QuadReg on y; TI ExpReg on ln y, so y > 0 is needed;
Desmos default on y itself), and the output is recorded with enough digits. Fitted parameters are estimates ("about",
"predicted"): b − 1 is the percent change, the vertex the estimated peak, a/c the value at x = 0 (meaningful only when
0 is in the data; re-code calendar years as elapsed time). Solving model = target can give 0, 1 or 2 inputs; report
only the admissible ones, in context. Outside the data the evidence stops: models that fit alike can diverge, the
domain of use is a qualified interval (data, context, population), and observed residuals are no guaranteed bound.

**Requires** `linear-regression` (residuals, residual plots, LinReg, r), `quadratic-functions`, `exponential-functions`.

**Model.** The shared kit's Plane (scatter plots with fitted curves given as {family, parameters}, residual plots with
x tick labels under the grid, target lines), linear-regression's `DataCard` (data tables, TI-84 lists, technology
output screens) and function-families' `DiffTable` (difference and ratio columns). Maths in `nlMaths.ts` (QuadReg by
the normal equations, ExpReg on ln y, the Desmos original-scale fit by Gauss-Newton, PwrReg, the square-root model,
residual-pattern tests: sign runs, the share of the residuals a parabola or a cubic explains); contexts, data makers
and planes in `nkit.ts`; families in `famA/B/C.ts`; the lesson's data in `lessonData.ts`.

**Conventions stated to the student.** Technology output is shown as a TI-84 screen, coefficients rounded to 4
decimal places; every item that rounds names the places (or significant digits); generators reject values within 2%
of a rounding unit of a .x5 tie. Predictions use the coefficients as shown. Residual plots are drawn from the exact
residuals of the stated fit. "Pattern" = few long sign runs and most of the spread a smooth curve (a parabola or cubic
explains > 75-80%); "no pattern" = at least n/2 sign runs and a parabola explains < 35%; items only use data that
clearly pass one of the two. Endpoints of the observed inputs count as inside (interpolation).

## The five parts
1. **The question**: one patient, 9 blood samples (0-8 h), a quadratic and an exponential fit both hug the data; which
   model for 12 hours? Cards: quadratic, exponential (right), "either one: both fit, so both predict alike"
   (equal-fits-predict-alike) + how sure.
2. **Worked example** (4 steps, picture first): fit both (ŷ = 0.349x² − 5.339x + 23.293, ŷ = 23.87(0.751)^x); one
   residual each at 2 h (−0.61, −0.06, sticks); the two residual plots (quadratic + − − − − + + + −, a wave;
   exponential no pattern); extend to 12 h (quadratic bottoms out at 7.6 h and climbs to 9.5; exponential 0.8, a
   constant percent per hour). Why: "why only an estimate?" (extrapolation / a pattern / exact = extrapolates-without-limit).
3. **Your turn** (faded): a thrown ball, QuadReg output given. Record the equation (reversed coefficients, dropped t²),
   predict h(1.5) = 29.1 ft (28.9 observed = expects-points-on-fitted-line), report the landing time from t ≈ −0.11 and
   2.63 s (both = context-domain-all-reals). Callback to the commit.
4. **Prove it**: Jamal: a quadratic and an exponential fit 8 weeks of app sign-ups within ±0.2 thousand, so they
   predict alike at week 23. Judge, then a because-chain on the zoomed-out plane: 104 vs 768 (compounding vs adding),
   the data pin curves only inside weeks 1-8, residuals bound only the observed weeks. Distractor chips:
   equal-fits-predict-alike, observed-extremes-as-guaranteed-bounds, high-r-settles-everything.
5. **Practice**: 48 families over 21 sub-goals (below); most show a scatter or residual plot, a data / output card or a
   difference table; the solve replays on the picture (sticks, fitted curves, intersections, the change columns).

## Sub-goal → families
| sub-goal | families |
|---|---|
| family-from-shape | shapeFamily, shapeTurn |
| table-difference-ratio-test | diffTest, diffSpacing, diffNoisy |
| residuals-curved-model | residQuad, residExp, residOne |
| residual-pattern | patternPick, patternSumZero |
| residual-size | sizeUse, sizeTol |
| least-squares-criterion | sseCompare, sseCompute |
| quadratic-regression | quadPredict, quadPrecision, quadLists, quad3pts |
| log-response-scale | lnStep, lnNonpos, lnRelative |
| exponential-regression | expOut, expPredict, expZero, expTools |
| recode-input | recodeA, recodePredict |
| interpret-parameters | interpB, interpVertex, interpC |
| compare-own-fits | compareFits, expTools |
| solve-for-input | solveCount, solveExp |
| report-in-context | reportBall, reportNever, reportWords |
| square-root-regression | sqrtFit, sqrtShape |
| interp-vs-extrap | interpExtrap |
| context-domain | domainQuad, domainPop |
| model-divergence | divergePair, divergeClaim |
| log-linearization | linRecover, linCurved |
| model-choice-argument | cerPick, cerVerdict |
| no-guaranteed-bounds | boundsClaim |
