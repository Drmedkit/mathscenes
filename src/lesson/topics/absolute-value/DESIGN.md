# Absolute value functions and equations (Algebra 1, lesson 11; secondary-t7-13, F-IF.C.7.b, F-BF.B.3, A-REI.B.3, A-REI.D.11)

Slug `absolute-value`, 27 sub-goals, 58 families. Requires `piecewise-functions` (a rule picked by its condition,
pieces drawn only over their interval) and `solving-linear-equations` (solution sets on a number line, reversing for a
negative factor, and/or sets); builds both on the shared kit Plane and the SetLine block.

## Concept
|u| is the distance of u from 0, so |x − a| is the distance between x and a. The bars are a two-piece rule that switches
where the INSIDE is 0: keep the inside where it is ≥ 0, take the opposite of the WHOLE inside where it is < 0. So
y = a|mx + b| + k is two linear pieces meeting at the vertex x = −b/m (slopes ∓a|m|), opening down when a < 0.
|u| = c: isolate first, then the sign of c decides (two / one / none); for c > 0 the inside is c or −c. A case result
counts only where its case condition holds (extraneous candidates), and the cases cover every x, which is why they find
ALL solutions (checking one candidate never proves completeness). |u| < c is one band (an "and"), |u| > c two rays (an
"or"); zero and negative targets give no solution / one point / all reals / all but one point. Contexts: "exactly c
from a target" (|x − t| = c, reject what the context forbids), a V-shaped distance model with rates in units, and
tolerances (|x − t| ≤ e). Extensions: a right side with x, an identity inside a case, two absolute values.

## Model: the kit Plane + SetLine, pictures as data
`av.ts` (exact maths: AbsF a|mx + b| + k, vertex / slopes / branches, solveEq, absIneq on sets.ts; HTML / TeX
formatting; the V as piecewise-functions GPic parts, crossings with dashed drops), `line.ts` (a NumPic on the
solving-linear-equations SetLine: one line named x, the set and tests on the replay; the page draws the amber center
marker and lavender distance arcs over it). Colour roles: the V lime (`link`; in the example the left piece teal
`water`), the line y = c amber (`first`, dashed), crossings teal (`second`), drops / distances / focus lavender
(`pick`), rejected candidates red.

## The five parts
1. **The question** |x − 4| = 3: which x? Cards 1 or 7 / only 7 (only-one-number-per-abs) / 3 or −3
   (abs-plus-minus-c-ignoring-inside) + how sure. Axes only, the equation on the board.
2. **Worked example** the inside is 0 at x = 4 (vertex ring) → the two pieces x − 4 (lime, right) and 4 − x (teal,
   left), cases on the board → the line y = 3 meets the V twice → solve each piece, the drops to 1 and 7 and the two
   distance arrows of length 3 from 4. Why does 4 − x = 3 count? (left piece / bars on every part =
   abs-applied-to-parts / always two = abs-fixed-solution-count).
3. **Your turn** 2|x − 2| − 4 = 6, the V drawn: the kid isolates (|x − 2| = 5; split-before-isolating and a sign slip
   as distractors), then types both solutions (±5 = ignoring the inside); the line y = 6 and the crossings at −3 and 7
   draw. Callback to the card.
4. **Prove it** Jordan: |2x − 3| = −5 has the solutions −1 and 4 (he split a negative target). Judge, then a
   because-chain: −1 came from the case 2x − 3 ≥ 0, but 2(−1) − 3 = −5 (the point (−1, 5) on the V rings red) / 4
   came from 2x − 3 < 0, but 2(4) − 3 = 5 / so no solution: the V never reaches y = −5. Distractor chips:
   case-condition-ignored, negative-target-made-positive, must-satisfy-both-conditions. Jordan's line is struck.
5. **Practice** every sub-goal in topic order, then mixed. A Plane per graph item (when the graph IS the answer, the
   board sits on a big slate and the graph comes in on the replay), option graphs A-C, a number line (bare before the
   answer; the set, center, arcs and tests on the replay), or worked branch lines on a slate. Bars on the boards are
   drawn as \left| \right| so −|−6| reads right.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | abs-eval-expressions | evalAbs (single, sum, difference, product, |x − 4| at x, decimals), outsideMinus (−|−a|, |−(−a)|, −|p − q|, k|x − h| + c) |
| 2 | distance-x-minus-a | distSolve (number line, |x + 2| rewrite), distMeaning |
| 3 | piecewise-def-abs | pieceEval (positive, negative, 0, halves), oppositeValue |
| 4 | breakpoint-x-minus-a | breakX (positive / negative / half breakpoints), pieceForm |
| 5 | graph-parent-abs | parentSlope, parentFeature (true statement among range / rounded U / slopes / domain traps) |
| 6 | graph-horizontal-shift | hShiftVertex (integers, halves), hShiftPick (graphs A-C: sign, outside shift) |
| 7 | graph-vertical-shift | vertexHK (pair), rangeK |
| 8 | graph-vertical-stretch | branchSlope (a = ½, 1, 2, 3), stretchPoint (shift-before-scale) |
| 9 | graph-reflection-negative-a | negPick (graphs A-C: one branch, left-right flip), sameGraph (|h − x| vs −|x − h|) |
| 10 | piecewise-affine-inner | affineCond (reverse for m < 0, breakpoint at 0, sign), affineForm |
| 11 | graph-affine-inner | affineVertex (−b/m vs −b), affineSlope (a·|m|) |
| 12 | solve-abs-eq-positive | splitSolve (pair, halves), splitPick (or / and / only / ±c) |
| 13 | solution-count-by-sign | howManySol (c > 0, 0, < 0), whichOne |
| 14 | isolate-first | isolateSolve (pair), isolateLine (negative p, negative right side), isolateCount |
| 15 | solve-graphically | graphCount (a < 0 included), graphSolve (pair; the height trap) |
| 16 | filter-candidates-by-condition | keepReject (positive / zero / negative targets), branchCount |
| 17 | completeness-justification | checkVsCases (a checked candidate is not completeness), completeWhy |
| 18 | model-distance-context | modelEq (thermostat, mile marker, bolt, cruise control, oven), exactlyAway, domainReject (trail, sensor) |
| 19 | model-abs-function-context | rideRead (start, at the marker, later time), rateUnits, rideDomain (domain / range) |
| 20 | abs-ineq-less-and | andSolve (pair ends, < and ≤, |3 − x|), andPick (or / one case / same direction) |
| 21 | abs-ineq-greater-or | orSolve (pair ends), orPick (band / three-part chain / one ray) |
| 22 | abs-ineq-isolate | isoForm (negative p flips), isoSolve |
| 23 | abs-ineq-special-targets | specialSet (four relations × 0 / negative), specialIsolate (incl. made-positive distractor) |
| 24 | model-tolerance-inequality | toleranceModel (≤, <, >, ≥ phrases), toleranceEnds, toleranceReverse (midpoint, half width) |
| 25 | variable-rhs-cases | varRhsSolve (kept / rejected candidates, graph on the replay), varRhsBranch |
| 26 | branch-identity | identitySet (|x − a| = ±(x − a), |x| = x ± k), identityCount (more than two) |
| 27 | two-abs-interval-table | twoAbsSum (supplied graph; two-case trap), twoAbsEqual (pair, both V's on the replay) |

Every misconception id is checked against misconceptions.json in the test; every picture is built (Plane / SetLine) in
the test, 120 seeds per family. No runtime or kit change. Walk: `tools/walk-absolute-value.mjs`.
