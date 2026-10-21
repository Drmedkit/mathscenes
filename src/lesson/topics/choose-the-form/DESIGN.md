# Choose the form (primary.fractions.choose-calculation-form-fractions, grade 7, 7.EE.B.3)

**Concept.** A fraction, a decimal and a percent of the same whole are ONE number: one point on one line, three
names (25% = 1/4 = 0.25). So every valid route gives the same answer, and the numbers decide which route is
shortest (48 ÷ 4 beats 0.25 × 48; 10% + 8% beats 0.18 × 45; with a calculator 0.175 × 83.20 wins). Then report the
answer in the form the context needs. A finite decimal or whole percent for a third is only a rounded name
(33% ≠ 1/3), and the gap grows when it is multiplied.

**Model: FormLine** (`FormLine.ts`, maths in `formMaths.ts`). A painted amber bar (the whole: $48, $45, $900, or
0..1 / 0..2 for over 100%) on a double number line: amounts above, a crisp percent axis under it. A lavender marker
carries a stack of its names (percent on the axis row, then the fraction, then the decimal) on a soft lavender tag:
one point, three names. `cut` splits the bar into equal teal-dashed pieces (the fraction route); lime stretches are
the answer, a teal second stretch a decomposition part (8% of 10% + 8%) or Ava's rounded shares; a zoom lens magnifies
[0.96, 1] of the bar so a $9 gap of $900 is visible. Steps: bar, top i, bot i, cut, fill i, mark, pct, frac, dec,
lens, gap. `formLineLayout` clamps labels into the frame and throws on values off the line (tested for every
practice picture). Colour roles: amber = the whole/amount, teal = the pieces, lime = the answer, lavender = the
marked point and its names, red = the gap.

**Board.** Short TeX lines beside the bar: the task, the three names (25% = 1/4 = 0.25), each route with its
result, the reported answer. No leaders: they would cross the bar; rings pulse on the bar part while its line writes.

## The five parts
1. **The question.** 25% off a $48 jacket; Mia: 1/4 of 48, Leo: 0.25 × 48. Cards: Only Leo
   (believes-one-method-is-right) / Both, same amount (right) / Both, but amounts can differ (methods-can-disagree).
2. **Worked example** (same bar): Name it three ways (names write under the marker) → The fraction route (cut in 4,
   one piece lime, $12) → The decimal route (0.25 × 48 = 12: the same piece rings) → Choose and report ($12
   discount). Why both $12? one number (right) / luck (methods-can-disagree) / decimal is the real one (one-method).
3. **Your turn**: 18% tip on $45, faded from the end. Given: 18% = 18/100 = 0.18 (no friendly fraction). Kid picks
   the route (10% + 8% / ÷ 18 = one-pth / × 18 = numeral), finds 10% ($4.50, the bar cut in tenths), then the whole
   tip ($8.10; $3.60 alone = reports-intermediate-result). Callback to the card.
4. **Prove it**: Ava splits $900 three ways with 33% and calls $297 exactly a third. Judge, then a because-chain:
   33% is not exactly 1/3 (1/3 = 0.333…) / the exact share is $300 (cut in 3) / her shares leave $9 out (the lens:
   3 × 297 = 891); Ava's line is struck after the lens shows the gap. Distractors: all decimals are estimates
   (all-decimal-notations-classified-as-inexact), rounding a little can't change it (intermediate-rounding-cannot-
   change-result), the calculator shows 0.33 (truncation-taken-as-full-decimal).
5. **Practice**: all 16 sub-goals in order, then mixed. Most families draw a FormLine (about 22 of 30): a marked
   point with only the given name (conversions, context words, cups, cents, hours), p% of an amount (the cut, the
   part and its amount come in the solve), pins on a zoomed stretch (compare and order: the pins drop in the solve),
   a zoom lens on the rounding gap (1/3 vs 0.33 of $W), a benchmark piece with its estimate. The opening picture
   never shows the asked name or the answer. Families with no honest picture (two different wholes, = or ≈,
   calculator displays, tolerances, nearest cent, two-step totals) keep a big slate.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| benchmark-three-forms | threeNames (FormLine), sameAmount |
| decimal-percent-zeros | decPct (FormLine; tenths, leading zero, thousandths), centsDollars |
| over-100-percent | over100 (FormLine 0..2; decimal / percent / fraction-or-mixed answers), overChoice |
| same-whole-check | sameWhole (same and different wholes), moreHow |
| context-language | contextMatch (off, cents, batting average, cups, "1 in 4"), sameAmount |
| fraction-form-benchmark | fractionRoute (FormLine cut), whichFraction, routeEqual |
| decimal-multiplier-choice | routeCompute (FormLine; exact cents, 10% + k% or decimal multiplier), routePick, routeEqual |
| common-form-compare | orderForms (digit-key trap guaranteed), compareTwo |
| reporting-form | reportForm (recipe, ruler, price, metric, survey, and a two-forms-fine case), eitherForm (no form asked vs a stated form) |
| calc-vs-report | reportAs (percent, cents, minutes), reportPick |
| exact-vs-rounded | eqOrApprox (= or ≈), calcDisplay |
| rounding-effect | roundingGap (1/3 vs 33%, 2/3 cup vs 0.67, $10 three ways), keepExact |
| accuracy-tolerance | tolerance (1/8 inch, 0.5 lb, 0.1 mi, 0.05 L), nearestCent |
| convenience-compare | fasterRoute (incl. the calculator counter-case), fractionRoute (12.5% = 1/8 supplied) |
| benchmark-check | checkResult (correct, ×10, ÷ p slips), estimateFirst |
| multistep-choice | multiStep (cups with a 0.1-cup scoop; discount then tax), keepExact |

Every misconception id lives in `items.ts` MC (checked against misconceptions.json in the test, and every sub-goal's
listed misconception is diagnosed by a choice distractor or a probed typed-answer trap). No runtime change was needed.
