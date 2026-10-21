# Scientific notation and order of magnitude (`scientific-notation`)

Topic `secondary.scientific-notation-and-order-of-magnitude`, grade 8 (8.EE.A.3, 8.EE.A.4), 15 sub-goals.

## Concept
a × 10ⁿ is two pieces of information: the power of 10 says which **rung** of the powers-of-ten ladder a quantity is
past, the number in front (1 ≤ a < 10) says **how far up the gap** to the next rung it sits. Every rung is 10 times
the one below, so comparing two quantities is a climb: whole rungs from the powers (×10 each, exponents subtracted)
and one step inside a gap from the numbers in front. The misconceptions the lesson is built against: comparing by the
exponents only ("one power apart = 10 times"), by the leading digits only, and treating powers additively
("10⁹ is 1 more than 10⁸").

## Models
- **`PowerLadder`** (`PowerLadder.ts`): a vertical ladder, rungs 10^lo … 10^hi with log-spaced coefficient ticks 2…9
  inside each gap. Marks hang off the right rail (painted icon: planet, cell, grain, town; name over value; labels
  spread apart with elbow leaders, never overlapping). Steps `rungs m0 m1 m2 climb within band`: a dashed ghost of
  one mark climbs whole rungs (one "×10" arc each), then a wider "within" arc takes it to the other mark (×q). A dashed
  red mark is a claimed value that is not real (Mia's "10 × the town"). Checks: a mark's height inside its gap IS its
  coefficient (asserted), marks on the ladder, ≤ 7 gaps, gaps ≥ 100 px, labels inside the frame; arc labels are
  nudged off every leader, icon, other label and the within arc. `where`: rung, rungLabel, dot, icon, value, label,
  climb, climbLabel(i), within, band. Pulses for mark labels, ×10 labels and the within label.
- **`PointHop`** (`PointHop.ts`): multiplying by 10ⁿ moves the decimal point n places. Significant digits stay in
  their columns (amber), the point (lime) hops one column per factor of 10 with a counted teal arc per hop,
  placeholder zeros (dim) fade in as needed and stay faintly where the starting number had them. Asserted: end =
  start × 10^hops on the exact values. Used for conversions both ways, renormalising, estimates, unit changes.
- **`CalcScreen`** (`CalcScreen.ts`): a painted calculator LCD or a spreadsheet cell showing E-notation.
- All maths is exact: `sci.ts` (BigInt decimals; a kid's typed number is read back exactly via `String(v)`).

Colour roles: first (amber) = the quantity we compare with / the digits, second (teal) = the other quantity / the
hops, link (lime) = the ×10 rungs, the ×q step and the answer, wrong = a claimed value, pick = focus.

## The five parts
1. **The question**: Earth 1.5 × 10⁸ km and Neptune 4.5 × 10⁹ km from the Sun. Cards 3 (leading digits only),
   10 (exponents only), 30 + how sure. The ladder shows both, the board the quotient.
2. **Worked example** (same numbers): *Place them on the ladder* (marks + label pulses) → *Divide the powers of 10*
   (a ghost of Earth climbs one rung, ×10; `10⁹ ÷ 10⁸ = 10¹`, leader to the ×10 label) → *Divide the numbers in
   front* (×3 inside the gap; `4.5 ÷ 1.5 = 3`, leader to the ×3 label) → *Put it together* (`3 × 10¹ = 30`). Why?
   "Why isn't it just 10 times?": rung + inside / one power apart is always 10 times / 10⁹ is 1 more than 10⁸.
3. **Your turn**: grain of sand 2 × 10⁻⁴ m vs red blood cell 8 × 10⁻⁶ m, faded from the end. The ladder is set up;
   the kid types the power (−4 − (−6) = 2; −10 = subtracting a negative as positive, 2/3 = dividing exponents), the
   numbers in front (2 ÷ 8 = 0.25; 4 = divided the other way), and writes 0.25 × 10² in scientific notation
   ([2.5] × 10^[1]; 2.5 × 10³ = renormalised the same direction, 25 × 10⁰ = coefficient out of range). The climb
   overshoots the grain by two rungs and the ×0.25 arc comes back down. Callback to the commit.
4. **Prove it**: town 9 × 10⁴, city 1 × 10⁵; Mia: "one power of 10 bigger, so 10 times as many people". Judge,
   then a because-chain: 90,000 and 100,000 / 100,000 ÷ 90,000 ≈ 1.1 (the dashed "10 × the town" appears far up the
   ladder) / the exponents only give the band, the numbers in front the exact ratio. Distractor chips: "one power
   apart always means exactly 10 times" (exponents only), "10⁵ is just 1 more than 10⁴" (additive). Mia's line is
   struck only after the evidence.
5. **Practice**: 15 sub-goals in order (2 right each), then mixed (runtime/practice.ts).

## Sub-goal → families (`plan.ts`, `items.ts`)
| sub-goal | families | picture |
|---|---|---|
| sci-notation-structure | isSci, negMeaning | ladder band / hops (with the solution) |
| convert-sci-to-decimal | toDecimal | hops |
| convert-decimal-to-sci | toSci | hops |
| renormalize | renorm | hops |
| multiply-sci | multiply | board |
| divide-sci | divide | board |
| add-subtract-same-power | addSame, distribute | board |
| align-unequal-powers | align | board |
| mixed-notation-arithmetic | mixed, sameNumber | board / hops |
| e-notation | eNote, eDecimal | calculator or spreadsheet |
| estimate-single-digit-power | estimate (22 real facts + generated, incl. 9.8 → 1 × 10ⁿ⁺¹) | hops |
| compare-times-as-much | times (real pairs: cells, populations, space; bare) | ladder climb |
| order-of-magnitude-convention | band, bandVsRatio | ladder band |
| choose-unit | convertUnit, pickUnit | hops (with the solution) |
| sci-notation-word-problems | story (single- and two-step), storyOp, report | board |

Every misconception id the topic JSON names is produced by some family's classifier (tested).
