# Calculate a discount (primary.ratios.discounts, grade 7, 7.RP.A.3)

## Concept
A sale splits ONE whole, the original price (100%), into two parts: the discount (what comes off) and the sale price
(what is left). Every percent in a sale is a percent of the original price, so "p% off" and "pay (100 - p)%" are two
parts of the same bar and the two methods (subtract the discount / multiply by the percent paid) must agree. Money is
exact: intermediate amounts may have parts of a cent; only the final price is rounded (halves up).

## Model: PriceBar (`PriceBar.ts`, maths in `discountMaths.ts`)
- Concrete: a painted hang tag with the item and its price; at the end the price is struck and the sale price written
  beside it, as a shop does.
- Picture model: the same price as a tape braced "100% = $80" (amber, the whole). A cut at p% splits it: the
  discount is the end you do not pay (teal, right), the sale price the rest (lime, left). Under each part: its
  percent, a brace, its dollars and its name. Optional equal cells (10% each) for benchmarks; a dashed half mark for
  bounds ("more or less than half price?").
- Exact: amounts are integer ticks of $0.0001 (15% of $15.99 = 23985 ticks); `percentSale` checks
  discount + sale = original; the sale label is rounded under the course policy.
- Steps: tag, bar, whole, ticks, cut, disc, sale, paid, tagSale, half. `where` boxes for every label, the parts,
  the tag prices, the cut and the half mark. Leaders target the right-most parts (the discount labels), the sale
  labels are linked by a pulse, so no leader crosses the picture.
- Board: money equations do not fit the runtime board at 60 px, so the page uses an 860 px model frame and a wider
  slate from x = 1000 with its own line/leader helpers (page-local; runtime unchanged).

## The five parts
1. **The question.** Headphones $80, 15% off: what do you pay? Cards $65 (15 taken as dollars,
   mc.percent.adds-or-subtracts-percent-numeral), $68, $12 (the discount as the price,
   mc.percent.change-reported-as-final-amount) + how sure. Tag and whole bar on the left.
2. **Worked example** (4 subgoal steps, picture first, notation beside it):
   Name the whole ($80 = 100%) → Find the discount (10% → $8, 5% → $4, 15% → $12; leader to the $12) → Subtract it
   ($80 − $12 = $68, the tag gets its sale price) → Check with the percent you pay (85% on the bar,
   0.85 × $80 = $68). Why? "both ways give $68": two parts of one bar / luck (methods-can-disagree) / 15% = $15.
3. **Your turn** (faded from the end): $45.00 hoodie, 35% off. The whole and the discount ($15.75) are given; the
   kid subtracts across the zeros ($29.25; diagnoses: discount, $35 off, adding, regrouping slips), picks the one-step
   check (0.65 × $45.00 vs the discount, the wrong whole, subtracting twice), judges "more or less than half?"
   (the half mark). Callback to the part 1 card.
4. **Prove it.** Riley: 70% off $50 is $35. Judge, then a because-chain: you pay 30% (100 − 70) → so under half,
   under $25 (half mark) → so it is 0.3 × $50 = $15 and $35 is the discount ($35 + $15 = $50). Distractors:
   "$35 < $50 so fair" (one-sided-bound-check), "the smaller amount is the discount"
   (smaller-amount-always-discount), "two ways can give two answers" (methods-can-disagree).
5. **Practice:** 13 sub-goals in order, then mixed (runtime/practice.ts).

## Sub-goal → families
| sub-goal | families |
|---|---|
| name-sale-amounts | roles (which amount is the sale price / discount / original; discount larger than the sale price; cents read only), partWhole (original = discount + sale price) |
| find-missing-amount | missing (unknown sale price, discount, or original; whole dollars, no regrouping) |
| original-is-100 | whichWhole (p% of which amount?), pctOrDollars (p% off vs $p off: compare the price with $100) |
| percent-split-model | readSplit (read the teal part on a 100% bar with cells), judgeSplit (shading $p of the bar vs p% of it) |
| discount-amount | discAmt (benchmarks, 15/30 from 10% + 5%, non-benchmarks, 5% = 0.05, 0% and 100%) |
| subtract-discount | salePrice, saveAndPay (both amounts labelled; across zeros; above 50%) |
| multiply-cents-prices | exactDisc (0.15 × $15.99 = $2.3985, unrounded), keepExact (parts of a cent are fine) |
| round-to-cent | roundFinal (round only the final price; halfway cases; exact difference supplied for 4 places), policy (rounding the discount first vs at the end) |
| percent-paid | pctPaid (100 − p, incl. 0, 50, 100, > 50), paidOfWhat (of the original, not the discount) |
| one-step-remaining | oneStep ((100 − p)% × original, cents prices rounded), whichProduct |
| explain-equivalence | whyAgree (same bar / methods-can-disagree / examples-as-proof; symbolic P − 0.15P = 0.85P) |
| check-and-correct | checkClaim (right, discount as price, $p off, 0.5 for 5%, discount rounded first, wrong base; above 50%) |
| estimate-reasonableness | estimate (closest estimate, receipt check), bounds (more/less than half, 0% off, 100% off, 50% off an odd-cent price) |
