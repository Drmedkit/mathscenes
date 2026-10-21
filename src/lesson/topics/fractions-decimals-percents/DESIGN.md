# Convert fractions, decimals, and percents: extended (primary.fractions.fraction-decimal-percentage-extend, grade 7)

## Concept
A fraction is a division, and long division decides everything: each step leaves a remainder smaller than the
denominator. A remainder of 0 means the decimal STOPS (every later digit is 0); a remainder that comes back means
the same lines, so the same digits, come back forever (bar notation over exactly that block). A percent is the same
number counted in hundredths: × 100 slides the point two places, and the repeating block is read again from the
new point (7/22 = 0.3(18) = 31.(81)%). A finite decimal cut off from a repeating one is a different number: only ≈.

## Model: DivisionLadder (`DivisionLadder.ts`, maths in `fdpMaths.ts`)
- Concrete: a painted calculator (`Calculator.ts`) whose display is a finite window (0.1666666667).
- Picture model: a strip of digit cells (ones, the point, six places) above a ladder of division lines
  ("40 ÷ 6 = 6", the digit, the remainder in a ring). Amount amber (n, each 10 × remainder, the remainders), divisor
  teal, digits lime, the repeat lavender (both rings, a loop arrow, brackets under each repeating block).
- Steps: cells, digits (strip-only items), row0..row5, stop (remainder 0 rings lime), loop, more (the pattern fills
  the cells), zeros (only zeros after a stop), groups (block brackets), shift (× 100: the point slides two cells,
  leading zeros fade, a % appears, the brackets re-anchor from the new point).
- Exact: `longDivide` works on integers only (rows x = q d + r, stop on 0 or on a repeated remainder);
  `expand` / `pctOf` give whole, prefix and block; the test rebuilds the fraction from every expansion (BigInt).
- `where`: cell(j), strip, tail, pct, groups / groupsAfter, row(i), digit(i), rem(i), amount(i). Leaders target the
  right-most parts (rings, brackets, the %), so none cross the picture; rails on fraction lines drop below the
  denominator (page helper `under`).

## The five parts
1. **The question.** A 1-mile relay, 6 runners; the calculator shows 0.1666666667. Which is EXACTLY 1/6?
   Cards 0.1666666667 (mc.decimals.truncation-taken-as-full-decimal), 0.1(6) (right), 0.(16)
   (mc.decimals.repeat-block-notation) + how sure.
2. **Worked example** 1/6: Divide (1 ÷ 6 = 0 r 1, 10 ÷ 6 = 1 r 4) → Track the remainder (40 ÷ 6 = 6 r 4: the 4 is
   back; leader to the ring) → Spot the repeat (loop arrow, the cells fill with 6s, brackets; 1/6 = 0.1(6) with a
   leader from the bar to the brackets) → Make it a percent (the point slides: 16.(6)%). Why only the 6?
   remainder 1 never comes back / a bar covers every digit (repeat-block-notation) / the bar goes on the last digit
   (repeat-bar-only-on-final-cycle-digit).
3. **Your turn** 5/12 (faded from the end): three lines given; the kid writes 80 ÷ 12 = [6] r [8] (too big / remainder
   too big feedback), picks the bar form 0.41(6) (vs 0.(416), 0.4(16), 0.416), then the exact percent 41.(6)%
   (vs 4.1(6)%, 0.41(6)%, 41.6%). Callback to the part 1 card.
4. **Prove it.** Ava: 1/3 = 0.333 exactly. Judge, then a because-chain on the ladder of 1 ÷ 3 (four rows):
   remainder still 1 after three digits (10 ÷ 3 = 3 r 1 every step) → 3 × 0.333 = 0.999 (the leftover thousandth)
   → 1/3 = 0.(3) and 0.333 ≈ 1/3 (cutting off gives a smaller number). Distractors: "three 3s already repeat"
   (finite-decimal-length-implies-repetition), "the remainder reaches 0 in the end"
   (every-rational-division-eventually-terminates), "every decimal is approximate"
   (all-decimal-notations-classified-as-inexact). Ava's "=" is struck after the evidence.
5. **Practice:** all 23 sub-goals in order, then mixed (runtime/practice.ts). Ladder / strip pictures replay the
   division or the shift after a miss; the calculator for display items; bare notation otherwise.

## Sub-goal → families
| sub-goal | families |
|---|---|
| place-value-ten-thousandths | placeValue (words → decimal; digit in a place), compareDec (0.0375 vs 0.375, 0.305 vs 0.35, 0.5 vs 0.5000) |
| terminating-means-zeros | terminates ("…" with only zeros; long terminators; trailing zero) |
| bar-notation | barForm (blocks of 1-3 digits incl. 0, both directions) |
| prefix-and-block | barForm (prefix 1-2 digits + block 1-2 digits, both directions) |
| truncation-not-equal | approx (bar form vs fraction; cut-off / rounded finite vs the bar form) |
| fraction-to-terminating-by-division | divide (8ths, 16ths, 40ths, 80ths, typed), ladderStep (the next line, quotient zeros) |
| fraction-to-repeating-by-remainders | divide (bar choices), ladderStep, digitTrap (a digit repeats but the remainder does not: 1/17; what a returning remainder means) |
| classify-fractions-by-remainder | classify (look-alike pairs 3/12, 2/15, 7/14, 1/16 vs 1/15 …) |
| terminating-decimal-to-fraction | decToFrac (3-4 places, simplest form on about half) |
| decimal-percent-small-and-decimal | decPct (both directions, < 1%, sales tax, "percents must be whole") |
| decimal-percent-to-fraction | pctToFrac (12.5% → 1/8, x.5%, x.25%, x.75%) |
| beyond-one-whole | beyondOne (mixed → %, decimal → %, % → mixed) |
| repeating-decimal-percent | repPct (re-read the block: 7/22 → 31.(81)%; reverse) |
| mixed-number-percent | mixedPct (1/6 = (16 2/3)%, reverse) |
| common-equivalents-recall | recall (eighths, thirds, sixths, 1/20, 1/25, both directions) |
| finite-remainders-argument (enrichment) | remainders (at most d − 1 digits; 1/7's next remainder; can it go on forever?) |
| denominator-two-five-test (enrichment) | twoFive (simplify first, odd is not the test) |
| exact-vs-approx-symbols | approx (which form is exactly / only ≈ the target; $100 shared by 3) |
| round-to-reporting-precision | roundFinal (nearest hundredth of a percent, thousandth; rounding too early) |
| calculator-display | calcDisplay (rounded, truncated and exact displays vs long division) |
| rounding-error-grows | roundingError (0.33 × $600, how far off, 3 × $33.33) |
| round-only-at-end | roundEnd (bill split to the cent, measured length, exact recipe amounts) |
| signed-forms | signed (−1 3/5 = −1.6 = −160%, contexts), signedCompare (−0.33 > −0.(3)) |
