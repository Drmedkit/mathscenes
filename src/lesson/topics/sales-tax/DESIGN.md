# Calculate sales tax, totals, and pre-tax prices (`sales-tax`)

Topic `primary.ratios.calculate-sales-tax`, grade 7 (7.RP.A.3, 7.EE.A.2, 7.EE.B.3), 19 sub-goals. Same look as
`discounts` and `original-amount`: amber = the pre-tax price (the whole), teal = the tax, lime = the total.

## Concept
The US shelf price is BEFORE tax. It is the **100% whole**; the tax is r% OF it and is added at the register, so the
total is (100 + r)% of the price: total = price + tax = (1 + r) × price (8% → × 1.08). Going back undoes the
multiplier (÷ 1.08); taking r% of the TOTAL off fails because the total is a bigger whole. Money is exact (cents,
rates in milli-percent, tax in units of $0.0000001); the tax is rounded once to the cent (halves up), then added.
With rounded tax a backward answer is only a candidate, confirmed by forward checks.

## Model: `TaxTape` (`TaxTape.ts`, maths in `taxMaths.ts`)
- Concrete: a painted register slip (item, Subtotal, Tax (r%), Total); unknown amounts show a faint "$?" until
  their step writes the value.
- Picture model: the same pre-tax price as one amber tape braced "100% = $60" with "pre-tax price" inside it. The
  tax sticks OUT on the right (teal stub, r% of the same scale); its labels stand in a column beside the stub
  (tax / 8% / $4.80), never on the narrow stub. A lime brace under tape + stub: "total 108% = $64.80" (the percent
  part has its own step, so the two-step total comes before the multiplier).
- Options: 10% cells; benchmark marks (a dashed ghost cell out to 10% and a dashed tick at 5%, or 8% and 9%); a
  "rebase" tape (the total taken as 100%, its own 10 cells) whose cells drift past the price tape's cells: 8% of the
  total is 8% of a bigger whole; a multi-item receipt with exempt items (the tape is the taxable subtotal).
- Steps: receipt, rPrice, rTax, rTotal, tape, whole, cells, bench, tax, total, totalPct, rebase. `where` boxes for every
  label; pulses link a receipt amount and its tape label (pPrice / pTax / pTotal). Layout checks throw (tape ≥ 380 px,
  the tax column inside the frame, no collisions, the model fits the frame). Leaders target the tax column and the
  receipt amounts (the right-most parts).
- Board: as in `discounts`, an 860 px model frame and a page-local wider slate (x ≥ 1000); runtime unchanged.

## The five parts
1. **The question.** Sneakers $60, 8% tax: what do you pay? Cards $68 (8% as $8, `adds-or-subtracts-percent-numeral`),
   $64.80, $4.80 (the tax as the total, `change-reported-as-final-amount`) + how sure. Receipt with "$?" and the tape.
2. **Worked example** (picture first, notation beside it): *Name the whole* ($60 = 100%) → *Find the tax* (1% → $0.60,
   8 × $0.60 = $4.80; the stub grows, leader to the column, the receipt fills) → *Add it* ($60 + $4.80 = $64.80, the
   total brace) → *One step* (100% + 8% = 108%, 1.08 × $60). Why does × 1.08 give the total? 1 keeps the price, 0.08
   adds the tax / "a percent of a price can't exceed it" (`fraction-must-be-less-than-one`) / "write the 8 after the
   1." (`appends-rate-digits-after-one`).
3. **Your turn** (faded from the end): a $40 board game at 7.5%. Given: the whole and the tax ($3.00). The kid types
   the total ($43; 47.50 numeral, 3 change-as-final, 37 wrong direction, 40 shelf price), picks the multiplier (1.075;
   1.75 appended, 0.075 change-as-final, 0.925 wrong direction), and checks the tax between 5% ($2) and 10% ($4)
   (the bench marks; "less than $40" = `one-sided-bound-check`, "$30" = `product-decimal-scale-not-preserved`).
   Callback to the part 1 card.
4. **Prove it.** Ana: total $81 at 8%, "8% of $81 is $6.48, so the price was $74.52". Because-chain: $81 is 108% of
   the price → so $81 ÷ 1.08 = $75 and the tax $6 (the receipt fills, $75 + $6 = $81 ✓) → Ana's $6.48 is 8% of a
   bigger whole (the rebase tape: 10% of $81 = $8.10 vs 10% of $75 = $7.50; Ana's line is struck). Distractors:
   "+8% then −8% cancel" (`adds-successive-percent-changes`), "divide by 0.08" (`divides-by-rate-to-undo-change`),
   "take $8 off" (`adds-or-subtracts-percent-numeral`).
5. **Practice:** 19 sub-goals in order, then mixed (runtime/practice.ts), 38 families.

## Sub-goal → families
| sub-goal | families |
|---|---|
| identify-quantities | roles (verbal / shuffled receipt lines), missingAmt (price + tax = total) |
| rate-vs-amount | rateOrAmount (7% vs $7), perHundred ($r per $100) |
| pretax-is-100 | whichWhole (100% / 105%), totalPct (100 + r), dollarAt (double number line) |
| tax-whole-rate | taxAmt (1% / 10% routes) |
| total-two-step | totalPay (cents, 0%), planTotal |
| extend-place-value | readDecimal (75 thousandths), compareDec (0.0825 vs 0.09), placeDigit (calculator display) |
| convert-decimal-percent | pctToDec, decBetween (0.08 < 0.0825 < 0.09) |
| decimal-rate | decTax (exact-cent products), placePoint |
| round-to-cent | roundTax (cut off / all digits / rate rounded first), roundTotal |
| benchmark-check | benchCheck (right, 10× too big or small), boundsPick |
| taxable-subtotal | exemptCart (receipt with exempt food), taxableBase |
| rate-from-receipt | findRate (from tax or from total, whole and non-integer rates) |
| price-from-tax | priceFromTax |
| total-multiplier | multiplier, multExpr, oneStepTotal |
| price-from-total | priceFromTotal (torn receipt), whichDivision |
| explain-subtract-fails | subtractFails, testNumber (rebase tape) |
| rounded-receipt-check | roundedTotal (candidate + neighbors), roundedTaxRange (step out to the first failure), roundedRate |
| budget-max-price | budgetMax (cut-off quotient, then step up) |
| compare-totals | compareStores (shelf price vs total, rate vs total), saveGap |

Every misconception id the topic JSON names is produced by some family's classifier (tested).
