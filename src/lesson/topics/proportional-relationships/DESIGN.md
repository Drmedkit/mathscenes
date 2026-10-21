# Proportional relationships (grade 7, 7.RP.A.2) — design

**Concept.** Two quantities are proportional when ONE fixed multiplier k turns every allowed input into its output:
y = kx. The test is the same-order quotient y ÷ x in every nonzero row (a zero row is checked by multiplying,
k × 0 = 0); on a graph it is "straight AND through (0, 0)"; one row with another rate refutes it, a few matching
rows are only *consistent* with it.

**Model.** `RateGraph` (first-quadrant graph: crisp axes and grid, painted beads for the rows, the ray from (0, 0)
through each point, the line y = kx as a ray / segment / separate points, the unit step from (0, 0) one unit across
and k up to (1, k), the origin) + `RateTable` on the board (input amber, output teal, the quotient column lime).
The picture of the concept: rows with the same y ÷ x share ONE ray from the origin; a row with another rate gets its
own (red) ray. Exact maths in `rateMaths.ts` (hundredths and reduced quotients, never floats compared). Labels are
placed by a search that refuses any spot on a line, a bead or another label; the block throws when nothing fits.

Colour roles: amber = the input quantity (pounds, gallons, x), teal = the output (dollars, y), lime = k / the rule /
the line, lavender = the row and point in focus, red = a row or point that breaks the pattern.

## The five parts
1. **The question** — three shops' price lists for trail mix on slates above three bins. Which one is proportional?
   A: 1→$3, 2→$6, 4→$10 (first two rows agree, the last breaks: `too-few-checks`), B: 2→$7, 4→$9, 6→$11 (goes up by
   the same amount: `scales-non-proportional`), C: 6→$15, 2→$5, 3→$7.50 (right; rows out of order, no 1-pound row).
   + how sure.
2. **Worked example** (shop C): *Plot* (each row lights up with its point) → *Divide* (each ray from (0, 0) draws, then
   its quotient 2.5 writes in the table: three rays, one line) → *Name k* (the unit step to (1, 2.5), board
   k = 2.5 dollars/pound) → *Write the rule* (the line draws through every point from (0, 0), board c = 2.5p with a
   leader to the line, the legend, 2.5 × 0 = 0). Why? "Why divide in EVERY row?" (distractors: two rows are enough;
   mixing the order).
3. **Your turn** (gas, 4→$14, 10→$35, 6→$21, k = 3.5 between grid lines): plotting and two quotients given; the kid
   divides the last row (number), names the point (1, k) (pair), picks c = 3.5g (vs g = 3.5c, c = g + 3.5), then the
   pump's 0 gal → $0 row: check by multiplying (vs 0 ÷ 0 = 0, vs "0 ÷ 0 breaks it"). Callback to the part-1 pick.
4. **Prove it** — Riley: "shop A is proportional: double the pounds, double the price." Judge, then a because-chain:
   rows 1 and 2 give $3/lb (3 ÷ 1, 6 ÷ 2) → but row 3 gives $2.50/lb (10 ÷ 4) → so no single multiplier: one row is
   enough. Distractor chips: the doubling check (`zero-and-doubling-prove-proportionality`), "most rows match"
   (`majority-matching-ratios-establishes-proportionality`). The graph backs each line (one shared ray, then a red
   one); "proportional" is struck at the end.
5. **Practice** — all 17 sub-goals in topic order (runtime/practice.ts), then mixed.

Every panel line of parts 1–4 is in `script.ts` (HTML + spoken text) = `voice/lines.json`; every card, chip and input
is logged with its misconception id.

## Sub-goal → families
| sub-goal | families | picture |
|---|---|---|
| table-test | tableTest (prop / +c / start / late break / doubling / squares), rowRate | table + beads; rays and quotients in the solution |
| zero-input | zeroRow ((0,0) row, 0 → fee, inferred 0) | table / graph |
| situation-test | situation (unit price, speed, recipe, ages, fee, painters, tiered parking) | bare |
| name-k-direction | nameK (table, reversed wording, y = kx, y = x/d, fractions, double number line) | table / bare |
| write-equation | writeEq (table, story, "times as many", check with 0) | table / bare |
| graph-ray | plotPoint (point for an input, where the ray starts), readScale (read a scaled axis, choose equal steps) | graph |
| graph-domain | domain (ray / segment / points / allowed part without 0 / 1.5 tickets) | graph in the solution |
| graph-test | graphTest (line, shifted, curve, decreasing, discrete, a few measurements) | graph |
| interpret-point | interpret (a point, a fraction point, the origin) | graph |
| k-from-graph | kGraph ((1,k) on / between grid lines, squares vs scale, two lines) | graph + unit step |
| translate-check | translate (equation → table, mismatched k, equation → sentence), writeEq | table / bare |
| ratio-counterexample | counterRatio (3 of 4 rows match) | table + beads, red ray |
| starting-amount-counterexample | fixedFee (entry, taxi, phone; first row is not a fee) | graph with intercept |
| changing-rate-counterexample | changingRate (bulk price, tiles by area, pattern, workers) | bare |
| premise-counterexample | buildCounter (origin / straight / increasing / doubling claims) | bare |
| apply-model | applyModel (unit price with bounds, speed, the fee contrast) | bare |
| evidence-vs-guarantee | evidence, graphTest, tableTest (sampled wording), situation | mixed |
