# Linear, quadratic or exponential? (Algebra 1, lesson 19; secondary-t6-34, 26 sub-goals)

## Concept
The capstone of the function line. Over **equal input steps** a linear function adds the same amount (constant 1st
differences), a quadratic changes its change by the same amount (constant, nonzero 2nd differences) and an
exponential multiplies by the same factor (constant ratios, no zero outputs). The rule guarantees the pattern for
every step (f(x + h) − f(x) = mh, f(x + h) ÷ f(x) = bʰ); a finite table is only *consistent* with a family. Graphs,
equations and stories carry the same signatures (line / vertex and symmetry / asymptote; the variable's place in the
rule; same amount / same percent / product of two linear quantities / a rate that changes steadily). Exponential
growth wins in the long run; a model holds only on a sensible domain.

## Model
`DiffTable.ts`: the finite-difference table. Rows x | y on a card, and beside it the tests as staggered columns:
Δx (left, pick), 1st Δ (water), 2nd Δ (amber, joined to the two 1st differences it comes from), ratio (teal). A test
that passes is ringed in link colour, one that fails turns the wrong colour. Hidden cells ('?') reveal on the replay.
Graphs use the kit `Plane`. `ff.ts` = exact maths (classify, fits, parent functions y = a·g(x − h) + k with HTML/TeX);
`tables.ts` = random tables of exactly one kind (redrawn until `classify` agrees), and a table as a picture.
Picture data (`common.ts` TPic / GPic): question-time columns at the top level, replay columns under `solve`
(hidden from oracles).

## The five parts
1. **The question**: a sensor logs 2, 4, 8, 14, 22 at x = 0..4. Cards Linear / Quadratic / Exponential (the first rows
   double: exponential = initial-rows-only-model-check).
2. **Worked example**: check the x-steps (+1) → ratios ×2, ×2, ×1.75, ≈×1.57 (hot: not exponential) → 1st differences
   +2, +4, +6, +8 (hot: not linear) → 2nd differences +2, +2, +2 (ringed: quadratic, y = x² + x + 2). Why-question:
   why did the doubling not prove exponential?
3. **Your turn**: x = 0, 2, 4, 6, 8; y = 3, 6, 12, 24, 48. Kid checks the steps (+2, "must be +1" = ignores-input-step),
   types the 1st difference 6 (2 = a ratio), decides changing differences do not mean quadratic yet
   (difference-test-only), types the ratio 2, names the family: exponential, ×2 per step of 2 (per 1 unit = ignores
   the step). Callback to the commit.
4. **Prove it**: Sam's table has equal 1st differences, "so linear, proved". Judge; the table grows a second rule g
   (= 3x + 1 + ¼x(x−1)(x−2)(x−3)(x−4)) that agrees on all five rows and gives 46 at x = 5. Then a because-chain for
   the true direction: f(x + h) − f(x) = m(x + h) + c − (mx + c) = mh, the same for every x. Distractors:
   examples-as-proof, f(x + h) = f(x) + h, the converse (finite-data-fixes-unique-rule).
5. **Practice**: 26 sub-goals, 57 families (below), then mixed.

## Sub-goal → families
| sub-goal | families |
|---|---|
| equal-spacing | spacingCheck, unequalSlope, unequalVerdict |
| first-differences | slopeFromDiff, isLinear |
| second-differences | secondDiffClassify, nextValue |
| ratio-test | ratioClassify, ratioDirection, ratioValue |
| explain-signatures | genericStep, directionImplication |
| factor-to-percent | factorToPercent, tableToPercent, negativeContrast |
| degenerate-cases | constantTable, zeroOutput |
| mixed-classification | classifyMixed, whichTable |
| compare-outputs | compareAt, compareTableAt |
| avg-rate-nonlinear | avgRateFormula, avgRateGraph, avgRateMeaning |
| compare-rate-patterns | ratePattern, rateRace |
| family-graph-signatures | graphFamily, graphFeature |
| parent-function-gallery | equationFamily, graphGallery, asymptoteShift |
| parent-function-gallery-extended | extendedGraph, tableCandidates |
| compare-linear-pair | linearPair, rangeFromTable |
| cross-representation | linVsNonlin, maxFromTable |
| eventual-dominance | whoWinsLongRun, tableOrder |
| crossover-estimate | lastCrossoverTable, lastCrossoverGraph |
| context-linear | contextLinModel, contextLinValue |
| context-exponential | contextWhichFamily, contextExpValue |
| context-quadratic-product | productFamily, productModel |
| context-quadratic-rate | rateChangeFamily, savingsTotal |
| finite-data-nonunique | twoModelsAgree, enoughData |
| noisy-data | noisyChoose, noisyFormula |
| model-domain | domainChoice, extrapolate |
| justify-choice | justification, insufficientOrNone |

Rules the generators keep: classification tables have 4+ rows on equal steps and exactly one family (a constant table
is linear only; quadratic needs nonzero 2nd differences; exponential needs no zeros and a ratio r > 0, r ≠ 1); the
test checks every table picture with an independent fit (`fits`). "f is larger for every x ≥ 0" is never secretly
true (pairs where the exponential leads everywhere are redrawn). Exponents and radicands in HTML hold plain text only
(`<sup>x</sup>`, `√(x − 2)`), so the plain-text reading keeps the grouping.
