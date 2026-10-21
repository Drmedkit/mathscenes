# Slope and lines (secondary-t5-29, grade 8: 8.EE.B.5-6, 8.F.A.3, 8.F.B.4)

**Concept.** Slope is the change in output for each 1 across: rise ÷ run between any two points. On one straight line
every slope triangle is similar to every other (AA: the horizontal legs are parallel, so the line meets them at equal
corresponding angles, and both have a right angle), so rise ÷ run never changes: one line, one slope. Taking the
triangle from the y-intercept (0, b) to any point (x, y) gives (y − b)/x = m, so y = mx + b; b = 0 is exactly the
proportional case, where y/x equals the slope. Sibling `linear-functions` owns function language (rate of change and
initial value of functions in context, comparing functions, linear vs nonlinear functions); this topic keeps to slope,
graphs and equations of lines, and touches its stage-3 sub-goals through slope (y/x vs Δy/Δx, constant rate).

**Model: the coordinate grid with slope triangles** (`SlopeGrid.ts`; exact maths in `slopeMaths.ts`). Any quadrants,
any axis scales, square cells, tick labels on the plot edges (never on a grid line). Steps: `axes`, `line:<id>` (full
line with arrows, ray, segment, points, curve), `pt:<id>` / `ptl:<id>` (bead / label), `tri:<id>` (run leg amber, rise
leg teal, faint fill), `run:<id>` / `rise:<id>` (leg labels), `ang:<id>` (the angle at the start + the right angle),
`path:<id>` (a broken path), `ray:<id>` (dashed from (0, 0): y/x). Focus: rings, a glow along a leg, a triangle fade.
Labels are placed by a search that refuses lines, beads and other labels, and the block throws when nothing fits.
Second model: `TableCard.ts`, an input-output table with change brackets (input change amber on the left, output change
teal on the right), a row highlight and an optional y/x column. Colour roles: amber = run / input, teal = rise /
output, lime = the line / the answer, lavender = focus and angle marks, red = wrong.

## The five parts
1. **The question**: y = 2/3 x + 1, Jo's slope triangle (0, 1) → (3, 3): 3 across, 2 up, slope 2/3. Kai's on the same
   line (3, 3) → (9, 7): 6 across, 4 up. What slope does Kai's show? Cards 2/3, 4/3 (twice the triangle, twice the
   slope: slope-depends-on-points), 4 (the rise alone: ignores-input-step) + how sure.
2. **Worked example** (same graph), four steps: Rise over run (Jo's legs draw on, slope = rise/run = 2/3) → Same angles
   (Kai's triangle, the parallel run legs glow, the angle arcs + right angles: the triangles are similar) → Same ratio
   (Kai's labels, 4/6 = 2/3, a leader from the 4 to Kai's rise leg) → The equation (the triangles fade, a general point
   (x, y) and its triangle from (0, 1): (y − 1)/x = 2/3, y − 1 = 2/3 x, y = 2/3 x + 1). Why-question: "why does Kai's
   triangle give the same slope?" (similar → same ratio / they look alike = similarity-judged-by-appearance /
   coincidence = slope-depends-on-points).
3. **Your turn**: a candle 6 in tall, y = −1/2 x + 6 on 0 to 12 h. Given: the small triangle (2 across, −1). The kid
   types the big triangle's rise (−3; 3 = drops-slope-sign), picks its slope (−1/2; 1/2 sign, −2 rise-run-inverted,
   −3 ignores-input-step), picks the equation (swaps-m-and-b, drops-start-value, drops-slope-sign). Callback to the card.
4. **Prove it**: Riley: "y = 2x + 3 has the same slope everywhere, so y/x is constant and it is proportional" (scales-
   non-proportional). Judge, then a because-chain: slope 2 everywhere (similar slope triangles; two triangles draw) /
   y/x is 5 at P(1, 5) but 3 at Q(3, 9) (the + 3 is inside every y; two dashed rays from (0, 0)) / linear but not
   proportional (b = 0 needed; rings at (0, 0) and (0, 3), Riley's line is struck). Distractor chips: "every straight
   line is proportional" (linear-means-proportional), "a constant slope means a constant y/x" (scales-non-proportional).
5. **Practice**: every sub-goal in topic order, then mixed (runtime/practice.ts). Graph or table pictures on all but
   one family (classify3: a big slate); hidden steps (triangles, labels, the answer point, change brackets) and solve
   lines replay after a miss.

## Sub-goal → families (plan.ts), 42 families
| sub-goal | families |
|---|---|
| unit-rate-run-one | unitRate (graph, whole/fraction/money k), rateTable (unit-rate table, choice) |
| paired-changes | changes (two points, both orders), tableChanges (two rows, zero input) |
| change-quotient | slopePts (two points, runs 2-10, fraction answers), slopeTri (count a triangle), slopeMeaning (per-unit meaning) |
| scaled-axes-slope | slopeTri (scaled axes), squaresToScale (squares → units) |
| slope-triangles-similar | whySimilar (AA reason; parallel-lines variant), similarOrNot (legs 1:2 vs 1:3 non-examples) |
| slope-invariance | bigTriangle (scale the rise), brokenPath (one line or not) |
| negative-slope | slopePts (signed), bigTriangle (decreasing), rateTable (draining tank, battery) |
| zero-slope | specialSlope (horizontal), flatMeaning (flat = no change, not zero) |
| vertical-undefined | specialSlope (vertical), hvMatch (zero vs undefined) |
| uneven-table-rate | rateTable (uneven, unsorted, decreasing), tableChanges (non-adjacent rows) |
| point-on-line-check | onLine (on / swapped / just off), whichPoint |
| write-y-equals-kx | writeFromGraph (through (0, 0), negative x), directVar (find y, find x) |
| graph-y-equals-kx | graphStep (run d, rise kd), whichGraph (three lines) |
| initial-value | readB (graph above / below / at 0), tableB (x = 0 row unsorted, taxi fare) |
| write-y-mx-plus-b | writeFromGraph (with b), wordsToMB (gym, battery, plant, taxi) |
| graph-y-mx-plus-b | graphStep (from (0, b)), whichGraph |
| contextual-domain | domainShape (points / segment / ray / line), allowedInput |
| recover-b | bFromPoint (b = y − mx), lineFromTwo |
| missing-coordinate | missingY, missingX |
| interpret-m-b-in-context | meaningMB (incl. an intercept outside the measured weeks), slopeMeaning (units, negative rate) |
| compare-two-relationships | compareRates (equation vs table / graph / words), compareGraphs (higher vs steeper) |
| ratio-vs-slope | ratioOrSlope (y/x column vs Δy/Δx), yOverX |
| nonlinear-varying-rate | varyingRate, rateTable (x² tables, uneven steps) |
| three-way-classification | classify3 (equations and contexts, slate), classifyGraph |
| justify-b-zero | bZero (necessity; sufficiency vs examples-as-proof), yOverX (counterexample) |
| choose-model-in-context | chooseModel (fee or not), doubling (the doubling test) |
| evidence-limits | evidence (observations / stated rule / a break), brokenPath |

Every wrong answer the classifiers recognise carries its catalogue id (items.ts MC, checked against misconceptions.json
in the test). No runtime change was needed. `scenes.ts` holds the parts 1-4 graphs and board TeX (asserted against the
exact maths at import); `script.ts` holds the panel HTML and spoken text of every voiced line (= voice/lines.json).
