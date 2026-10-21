# Ratio problems with fractions and decimals (grade 7) — design

Topic `primary.ratios.solve-complex-ratio-problems`, slug `ratio-problems`, 21 sub-goals (6.RP.A.3, 7.RP.A.1-3,
7.EE.B.3, 7.NS.A.2.d). The sister topic `ratio-tables-and-proportions` owns whole-number ratio tables; this one is the
non-whole multiplier, exact values, one rounding at the end, and checking a ratio answer.

## Concept
Two proportional quantities travel as pairs. Going from one pair to another multiplies BOTH by the same number, and
that number need not be whole: 4 lb → 6 lb is × 1.5 (= ÷ 2 then × 3), so $10 → $15. The multiplier is new ÷ old,
has no unit and lives BETWEEN pairs; the rate (dollars per pound) lives INSIDE a pair and has a unit. When no route is
friendly, keep the multiplier exact (12/7), carry long division one digit past the stated place, and round once at
the end. A ratio answer is checked by its unit, by equal quotients (exact) or by "the exact value rounds to it"
(rounded), and by its size.

## Model: `DoubleLine.ts` (maths in `ratioMaths.ts`)
A double number line: the first quantity as an amber tape above, the second as a teal tape below, on ONE scale so a
pair lines up on one vertical tick (the dashed alignment line through the gap). Steps: `rails given target cut count
unit arc{i} arcB{i} within{i} claim fix fill`. "cut" splits the given tapes into equal pieces on both lines (divide
both); "count" lights pieces one by one, extra pieces pop in past the given (multiply both); arcs carry the multiplier
on both lines with the same label (the bottom arc can draw later: the same multiplier applied to the other quantity);
within-arrows carry the rate (× 2.5) from the top line to the bottom one; a wrong claim (the additive $12) gets its own
red tick that does not line up with the target tick. Labels: values 60 px, names 44 px; the given and target values
must fit, piece / unit / zero labels give way; the layout (`planDL`, pure with a measure function) throws instead of
overlapping. `where` boxes: label, fill, claim, arc, within. Colour roles: first = first quantity, second = second,
link = the answer and the rate, pick = the target / focus, wrong = the claim.

## The five parts
1. **The question** — 4 lb of cherries cost $10; 6 lb? Cards $12 (`additive-keep-difference`), $15, $2.40
   (`unit-rate-division-reversed`) + how sure. Canvas: the double line, given and target ticks; board 4 lb : $10, 6 lb : ?.
2. **Worked example** — Find the multiplier (arc on the pounds, 6 ÷ 4 = 1.5) → Do it in whole steps (cut into 2
   pieces of 2 lb ↔ $5, count 3: $15) → Same multiplier on both (the dollars' arc, $10 × 1.5 = $15) → Check with the
   rate (1 lb ↔ $2.50, within-arrows × 2.5 at both pairs; 1.5 has no unit, $2.50 per lb has one). Why the dollars get
   × 1.5 too: right / "add $2" (the red $12 tick does not line up) / "the price per pound is 1.5" (`confuses-between-
   and-within-multipliers`).
3. **Your turn** — Maya hikes 12 miles in 4 hours; 9 miles? The multiplier (× 0.75 on the miles) is given; the kid
   predicts less/more (`multiplication-makes-bigger`, `scale-factor-inverted`), types 3 hours (1 = additive, 5.33 =
   inverted, 6.75 / 0.75 = wrong quantity), picks the rate 3 miles per hour (0.75 = between/within, ⅓ = reversed);
   the line cuts and counts, within-arrows check both pairs. Callback to the part-1 card (+ how sure).
4. **Prove it** — 7 lb of pears cost $20; Alex rounds $2.857… to $2.86 and gets $34.32. Judge, then a because-chain:
   exactly 240/7 dollars (× 12/7 kept as a fraction; 7 pieces cut, 12 counted) → $34.29 (the 5 after the cents
   rounds up once) → Alex's 3 cents (0.003 × 12). Distractor chips: "round to cents at every step"
   (`intermediate-precision-always-invalid`), "cut off: $34.28" (`truncates-instead-of-rounding`). Alex's line is
   struck last.
5. **Practice** — all 21 sub-goals in topic order, then mixed (runtime/practice.ts), 26 families. Missing-value items
   draw the double line; after a miss it solves itself (arcs, cut / count, unit + rate, fill).

Every panel line of parts 1–4 is in `script.ts` (HTML + spoken text) = `voice/lines.json`; every card, chip and input
is logged with its misconception id. The lesson pictures live in `specs.ts` (the tests check them).

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| scale-up-same-factor | scaleUp (× 3/2, 5/2, 5/4; pieces), sameRatio (multiply vs add vs one term) |
| scale-down-factor-below-1 | scaleDown (× 1/2, 2/3, 3/4; fraction answers), fracOk (part of a recipe) |
| find-factor-as-quotient | findFactor (new ÷ old; old ÷ new and the difference classified) |
| predict-direction-size | predict (multipliers 0.4–2.5, four bands) |
| factor-vs-unit-rate | betweenWithin (multiplier / rate / reversed rate / difference) |
| unit-rate-decimal-route | unitRate (decimal rate × whole number; unit tick + rate arrow) |
| common-factor-row | blockRow (through 3, 6, 7; repeating rate), pickBlock |
| exact-fraction-factor | exactFrac (coprime, answer as a fraction or mixed number) |
| decimal-digits-past-precision | longDiv (one digit past cents / tenths; remainder-after-point classified) |
| round-at-final-step | roundEnd (early rounding, cut off, wrong place classified) |
| decimal-entries-table | decTable (tenths in both columns; pieces of 0.1) |
| fraction-quantities-unit-rate | complexRate (miles per hour, per whole batch / wall) |
| equation-y-kx | writeK (incl. reversed variable names), useK (find x or y) |
| proportional-or-not | isProp (fee, additive ages, constant song, proportional) |
| choose-method | chooseMethod (whole multiplier / rate / building block / exact), mixed |
| check-units | unitCheck (label does not repair a division; a rate is not an equation) |
| check-units-mixed | mixedUnits (ounces, minutes, inches; given conversion) |
| check-constant-ratio | ratioCheck (exact claims: right, additive, inverted, off) |
| check-rounded-answer | roundCheck (right rounding vs early, cut off, tenth) |
| check-size | sizeCheck (× 10 slips, wrong direction; friendly estimate) |
| audit-and-revise | audit (right, reversed rate, additive, decimal slip, early, rounded, painters) |

No runtime change was needed. Notes: the walk blocks Vite's HMR client; contexts are US (pounds, miles, gallons,
cups, feet); money only where the price is the point.
