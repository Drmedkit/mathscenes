# Percent applications (secondary-t5-43-percent-applications-grade-7, grade 7)

## Concept
Every percent in a story is a percent OF one named amount: the 100% amount (cost for a markup, the original price
for a discount, the taxable amount for sales tax, the bill / sales / subtotal for tips, commission and fees, the
principal for simple interest). The percent is added, taken off, or (commission) paid out separately. A changed
amount is ONE percent of its base (15% off: pay 85%), so one change is one multiplier (x − 0.2x = 0.8x). When
changes follow each other, the output of one change is the 100% of the next, so the multipliers multiply
(20% off then 10% off = × 0.72 = 28% off, not 30%), up 20% then down 20% does not return to the start, and two
multipliers commute while a fixed-dollar coupon does not. Amounts that share one base just add.

## Model: `PercentTape` (PercentTape.ts, money maths in money.ts)
- Rows of tapes on ONE dollar scale. A row = pieces: `base` (amber, the 100% amount or its kept part), `change`
  (teal, a percent added on), `cut` (faded teal, dashed: taken off), `result` (lime, the answer), `plain` (neutral),
  `ghost` (dashed outline, e.g. "4% short of the start"). Percent text inside a piece (or above it when narrow; a
  narrow LAST piece puts its labels beside the tape end), dollars under it, the row's amount on its left (`lead`),
  an answer on its right (`end`). Numbers 60 px, labels pushed apart; the block throws when labels would overlap or
  leave the frame.
- Because the scale is shared, the kept part of a row is exactly as long as the next row: a dashed `guide` drops
  from one to the other ("the output is the new 100%"). `marks` (a dashed tick + a word: "$56", "start"), `hi`
  (a lit piece), `ask` (a "?" that turns into its value after a miss). Guides and ticks break around labels.
- Draw keys per row: `r<i>` (the tape grows on), `l<i>` labels, `v<i>` the dollar labels alone, `e<i>` the end
  label, `d<i>` dim. `scenes.ts` cross-fades a row from its whole-tape state to its split state (`drawSplit`).
- money.ts: cents as integers, rates as milli-percents, so every product is exact; generators insist on whole cents
  unless rounding is the point (round-to-cent, stated policies).
- Colours: first (amber) = the 100% amount, second (teal) = the percent part / change, link (lime) = the answer,
  pick (lavender) = a reference mark, wrong (red) = the tempting wrong value.

## The five parts
1. **The question**: $80 jacket, 20% off, then another 10% off the sale price. Cards $56.00 (rates added),
   $57.60, $22.40 (the savings reported as the price) + how sure. Canvas: one $80 tape = 100%; board the story.
2. **Worked example** (subgoal labels Name the 100% → Take 20% off → The new 100% → One multiplier): the $80 tape
   splits into 80% $64 | 20% $16; a guide drops to a $64 tape (new 100%) that splits into 90% | 10% $6.40; the lime
   $57.60 tape with a leader from 64 × 0.9 = 57.60; then 0.8 × 0.9 = 0.72, "pay 72%, so 28% off", a red $56 tick
   just short of the lime end. Why: "$57.60 and not $56?" (right / rates added / order).
3. **Your turn** ($50 game up 20%, then down 20%), faded from the end: 100% and the increase are given; the kid
   names the new 100% ($60 vs $50), types the price (48; 50 = rates added, 12 = the cut as the price), picks the
   net change (4% decrease / no change / 96% decrease). The result row has a dashed 4% gap and a "start" tick.
   Callback to the part-1 pick.
4. **Prove it**: Ava: "20% off then 8% tax is cheaper than tax first, because the tax is on a smaller amount."
   Judge, then a 3-line because-chain from 6 chips (distractors: 20% − 8% = 12% off; order always changes the
   total; a $10 coupon commutes too). Evidence: A rows $50 → $40 → $43.20, B rows $50 → $54 → $43.20 with lavender
   ticks at $43.20, both ends lit, the claim struck.
5. **Practice**: all 25 sub-goals in order (runtime/practice.ts), then mixed.

## Sub-goal → family
| sub-goal | family | input | main misconceptions |
|---|---|---|---|
| base-markup, base-discount, base-sales-tax, base-tip-commission, base-simple-interest | base (which amount is 100%), baseCalc (the percent of the right base) | choice / num | new-or-estimate-as-base, fraction-must-be-less-than-one, change-amount-as-whole, taxes-exempt-items, contextual-percent-base-misidentified, compounds-simple-interest, percent-numeral-without-dividing-by-100 |
| add-or-subtract | direction | choice / num | wrong-direction-of-change, commission-added-to-sales, change-reported-as-final-amount |
| percent-of-original | pctOf | num (%) | change-reported-as-final-amount, wrong-direction-of-change |
| multiplier-encode | mult (rate → ×, × → rate, % → decimal) | num / choice | dollars-cents-point-misplaced, change-reported-as-final-amount, percent-of-read-as-percent-change |
| single-change-in-context | single | num ($) | change-reported-as-final-amount, wrong-direction, commission-added-to-sales |
| commission-earnings | commission | num ($) | commission-added-to-sales, contextual-percent-base-misidentified |
| round-to-cent | round (a tax line, a stated policy, a total) | num ($) | cent-not-smallest-unit, intermediate-precision-always-invalid |
| income-tax-wages | wages (flat rate net pay, two brackets) | num ($) | reverses-money-in-and-money-out, top-bracket-rate-on-all-income, percent-as-fixed-amount |
| estimate-check | estimate | choice | accepts-result-without-size-check, rejects-answer-not-equal-to-estimate |
| successive-changes | successive | num ($) | adds-successive-percent-changes |
| reverse-percent | reverse | num ($) | adds-successive-percent-changes |
| percent-error | pctError | num (%) / choice | new-or-estimate-as-base, difference-number-as-percent, negative-percent-error |
| simple-interest-years | interest | num ($) | compounds-simple-interest, confuses-interest-and-balance, percent-numeral-without-dividing-by-100 |
| interest-months | months | num ($) | combine-mismatched-units |
| justify-single-multiplier | factor | choice / num | multiplier-without-percent-meaning, percent-as-fixed-amount |
| product-of-multipliers | product | num | adds-successive-percent-changes |
| net-percent-change | net | choice | adds-successive-percent-changes, percent-of-read-as-percent-change |
| undo-change-inverse | undo | num (%) | adds-successive-percent-changes |
| order-and-fixed-coupons | order | choice | composition-always-commutes, misjudges-order-of-changes |
| shared-vs-updated-base | shared | num ($) | multiplies-adjustments-sharing-original-base, adds-successive-percent-changes |
| compare-offers | offers | num / choice | rebate-lowers-taxed-price, different-wholes-treated-as-same, adds-successive |

Money answers are typed in dollars ("57.6" and "57.60" both count; a thousands comma still counts). A typed "$"
makes the shared input read NaN: the item answers with a hint and no misconception, but the runtime still counts
the try as a miss (a runtime change would be needed to strip "$").
