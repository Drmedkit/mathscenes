# Find the original amount after a percent change (`original-amount`)

Topic `primary.ratios.find-the-original-amount-after-a-percent-change`, grade 7 (7.RP.A.3, 7.EE.A.2, 7.EE.B.3),
7 sub-goals. Follows `percent-change` and `discounts` (same look: amber whole, teal change, lime new amount).

## Concept
The original is the **100%**; the amount after the change is (100 ∓ r)% of it, one multiplier m = 1 ∓ r/100. So the
original is the new amount **÷ m**. Adding (or taking) the same r% of the NEW amount fails because the percent was of
the original: the base changed. Money is exact (cents and basis points); a non-terminating original is rounded once,
at the end, and checked by applying the change forward (Model 1: within m × $0.005; Model 2: the receipt rule).

## Model: `BaseTape` (`BaseTape.ts`, maths in `reverseMaths.ts`)
- Concrete: a painted price tag ("was $? · now $48") or a receipt ("price $? · total $54"); the "?" becomes the
  original at `reveal`. Two amounts on one row when they fit, stacked when they carry cents.
- Picture model: 2–3 tapes on one scale. Row 0 is the original (amber, often "$?", braced 100% or a percent scale);
  a later row is drawn against the row above: a decrease leaves a dashed teal ghost, an increase sticks out teal.
  Rows can be cut into equal sections across their extent (the ghost is a section too); one section's value is
  written inside the sections (`$48 ÷ 4 = $12`), and `copy` lifts those values into the original's sections
  (`5 × $12 = $60`). A dashed `mark` shows where the original ends in every row (the base-change proof).
- Exact: `reverse()` keeps the original as a reduced fraction of cents and checks original × m = new; rounding is
  half up; `receiptTotal()` is Model 2. Layout checks throw (tapes ≥ 110 px, change pieces ≥ 14 px, sections ≥ 40 px,
  section values must fit, labels never collide or leave the frame).
- Steps: obj, row{i}, val{i}, chg{i}, cut{i}, sv{i}, pct{i}, copy, reveal, mark. `where` boxes for every label, the
  sections, the change pieces, the object's amounts. Leaders target the row values (top right, clear of the tapes).
- Board: as in `discounts`, the page lays out its own wider slate (x ≥ 1000) and an 860 px model frame.

## The five parts
1. **The question.** Jacket 20% off, sale price $48: the original? Cards $57.60 (20% of $48 added back,
   `mc.percent.opposite-percent-to-undo-change`), $60, $68 (20% as $20, `mc.percent.adds-or-subtracts-percent-numeral`)
   + how sure. Tag and two tapes, the original "$?".
2. **Worked example** (picture first, notation beside it): *Name the whole* (cut into five 20% sections, scale 0–100%,
   `$48 = 80% of $?`, leader to the "$?") → *Find one section* (`$48 ÷ 4 = $12` in each section) → *Build the whole*
   (the $12s rise into the original, `5 × $12 = $60`, the tag reads "was $60") → *Divide by the multiplier*
   (`0.8 × x = $48`, `x = $48 ÷ 0.8 = $60`). Why? "Why ÷ 0.8 and not add 20% of $48 back?": the 20% was of the
   original / adding back undoes it (opposite-percent) / ÷ 0.2 (divides-by-rate).
3. **Your turn** (faded from the end): concert ticket $54 with 8% tax, receipt + two tapes. Named for the kid:
   108%. The kid types the multiplier (1.08; 0.08 = change as final, 0.92 = wrong direction), divides ($50; 49.68 =
   opposite percent, 675 = divides by rate, 58.32 = applies it again, 46 = percent as dollars) and picks a real
   check (forward ✓; divide again = check-by-repeating; 8% of $54 off = opposite percent; "less than $54" =
   one-sided bound). Callback to the part 1 card.
4. **Prove it.** Theo: a 25% markup took $60 to $75, so 25% off $75 brings it back. Three tapes ($15 sections, then
   $18.75 sections of the new base), because-chain: 25% of $60 = $15 / 25% of $75 = $18.75 (new base) / leaves
   $56.25, the way back is ÷ 1.25. Distractors: up and down cancel (`adds-successive-percent-changes`), "just
   rounding" (`near-miss-accepted-as-match`), ÷ 0.25 (`divides-by-rate`). Theo's $60 is struck after the mark shows
   the gap.
5. **Practice:** 7 sub-goals in order, then mixed (runtime/practice.ts), 18 families.

## Sub-goal → families
| sub-goal | families |
|---|---|
| change-to-resulting-percent | resultPct (type 100 ∓ r, whole then decimal rates), tapeRead (which sentence fits the tape) |
| change-multiplier-expression | multNum (x − 0.2x = ? x), multExpr (1.06x vs 0.06x vs 1 + 0.06x vs 0.94x) |
| reverse-percent-change | tapeUnit (one section, then the whole; two boxes), reverse (exact, no calculator), whichCalc |
| round-to-cent | roundOrig (type to the cent: cut off, 1% rounded first, multiplier rounded first), roundPick |
| rounding-check | forwardCheck (Model 1: accept/reject by m × $0.005), receiptCheck (Model 2: which price gives the total), checkHow |
| explain-base-change | addBack (−r% then +r%, three tapes + mark), undoPct (+25% undoes −20%, ÷ the new base), whyBase |
| context-diagnose-change | diagnose (wrong base in a worked solution; the part-and-percent contrast), contextOrig (coupon, rebate, tip, "the $12 discount was 20%", rounded), boundFirst |

Every misconception id the topic JSON names is produced by some family's classifier (tested).
