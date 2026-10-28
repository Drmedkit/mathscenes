# Distance, midpoint and coordinate proofs (Geometry, lesson 11)

Topic: `secondary-t6-24-coordinate-geometry-distance-midpoint-and-slope-proofs` (33 sub-goals). Requires
`geometry-foundations` (proof frames), `linear-functions-slope` (slope of nonvertical lines) and `quadrilaterals`
(classes, sufficient tests). Colour roles: amber = the run / givens, teal = the rise / the second segment, lime = what
is earned (the answer), lavender = focus, red = wrong.

**Concept.** Coordinates turn geometry into exact arithmetic. Distance is the Pythagorean theorem on the run and rise
(compare squared lengths: no decimals), the midpoint is an average (and a missing endpoint undoes it: B = 2M − A),
slopes test parallel (equal, distinct lines) and perpendicular (product −1; horizontal with vertical outside the rule).
A partition point is A + t(B − A), a weighted average of the endpoints. One exact computation proves a claim about one
specified figure; a claim about every figure needs a general placement that imposes nothing extra (letters alone do not
guarantee that), and one verified counterexample disproves a universal claim.

**Model.** The kit Plane (equal cells) with points exactly at their stated coordinates, segments, full lines, circles,
and a polygon wash drawn by the page (`fillPoly`); `pic.ts` turns a practice picture into Plane parameters. Every
picture has a `reveal` layer (a midpoint, the dashed legs' lengths, the line, the enclosing box, the medians) that only
comes in at the solve, so no answer is on screen before the student answers. Argument items (scope, critique, audit,
general proofs) show their set-up on a card (geometry-foundations `Card.ts`). Exact maths in `cg.ts` (squared
distances, simplest radicals and sums of radicals, slopes as fractions, line relations, shoelace area, the class of a
quadrilateral read from its coordinates). `ckit.ts`: misconception ids, picture types, the window, and the builders:
ONE choice helper (`choice`, on quadratics-complex `keyed`: a wrong option with the right one's value key is dropped),
`num`, `point` (a typed pair, swapped coordinates get their own hint), `radItem` (an exact length typed as k √ r, any
equivalent form accepted; a perfect square is a typed number).

## The five parts
1. **The question**: four stakes of a garden bed at A(−6, 0), B(0, −5), C(6, 0), D(0, 5), "a square turned on its
   corner". Yes (appearance) / No, a rhombus (right) / can't tell without measuring the corners (rejects computation)
   + how sure.
2. **Worked example: one triangle, four tools.** A(1, 1), B(7, 3), C(5, 9). Measure (the dashed legs, AB² = 40 = BC²),
   why? (the legs meet at a right angle; adds-lengths and difference-of-squares as wrong reasons), slopes 1/3 and −3
   (product −1: right angle at B), the midpoint M(3, 5) of AC, MB² = 20 = MA² (B on the circle with diameter AC).
3. **Your turn** (faded): P(−3, 2), Q(5, −4) with run 8 and rise −6 shown: PQ = 10 (typed; 14 = adds), the midpoint
   (1, −1) (typed pair; (4, −3) = half difference), the perpendicular slope 4/3 (typed fraction; 3/4 reciprocal only,
   −4/3 / −3/4 opposite only); the perpendicular bisector draws in.
4. **Prove it**: the diagonals of every parallelogram bisect each other. Pick the general placement (rectangle and
   square placements as special-case distractors), then a Parsons proof (5 lines, decoys "OB = AC" and a numerical
   check) with a reason menu (distance formula, and the claim itself as a circular reason). Back to the garden bed:
   AC = 12, BD = 10, so which check settles it (unequal diagonals; four equal sides only make a rhombus; looks).
   Callback to part 1.
5. **Practice**: all 33 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 61 families
| sub-goal | families |
|---|---|
| distance-as-pythagoras | distTri (dashed legs; axis-parallel case typed, negative distance), distLegs (which expression) |
| segment-vocabulary | vocabMid (on the segment and equidistant), vocabBisect (one-way bisecting) |
| exact-length-comparison | congExact (equal squares; rounding trap), whichLonger |
| midpoint-as-average | midPt, midWhich (half difference, off-segment equidistant point, halving one addend) |
| missing-endpoint | missEnd (B = 2M − A, half-integer M), missEndPick |
| common-midpoint-bisection | bisectEach (same midpoint vs same length, isosceles trapezoid), parFourth |
| zero-undefined-slope | slopeZU (points and equations; 0, undefined, infinity) |
| parallel-slope-criterion | parTest (distinct, vertical pair, coincident), parSlope |
| perpendicular-slope-criterion | perpSlope, perpTest (opposite only, reciprocal only; never slope ±1) |
| horizontal-vertical-case | hvRel, hvLine |
| distance-fluent | distX (simplest radical), distSq (half-integer coordinates) |
| midpoint-fluent | midMix (forward and inverse mixed), midPt, missEnd |
| fractional-partition | partT (from either end), partRatio (m:n is t = m/(m + n)) |
| weighted-average-points | wAvg (2 or 3 points), wMove (toward the heavier point; weights for a ratio), centroid |
| line-relationship-select | lineRel (equations, disguised same line), perpTest |
| side-diagonal-identification | sideDiag (names out of alphabetical order, pentagon), closing |
| single-property-claim | claimArg (a complete argument), claimProp (which property the numbers prove) |
| coordinate-perimeter | perimExact (like radicals combined), perimRound (context in feet, yards, meters) |
| coordinate-area | areaBox (axis base; enclose and subtract), areaRect (tilted rectangle or square) |
| sufficient-check-set | checkSet, checkNeed |
| prove-disprove-specific-figure | verdict (true, one failing condition, a square called a rectangle, a near-square rhombus), classify |
| right-angle-by-converse | converse (longest side), rightWhere |
| point-on-circle | onCircle (an irrational coordinate exactly on; just off with a rounding trap; radius from a point), whichOnCircle |
| vary-examples-investigation | varyEx (varied shapes; the next example after a table of special cases) |
| proof-scope | scope (one figure exact, examples, measurement, general coordinates) |
| counterexample | cxPick (candidates as coordinates), cxCheck (hypothesis fails, conclusion holds, arithmetic slip) |
| parameter-scope | paramFam, nondegen |
| placement-invariance | whyMove, preserved (translation keeps slopes, rotation does not) |
| general-placement | placeGen, placeFourth (the fourth vertex; 2a, 2b, 2c for midpoints) |
| general-coordinate-proof | genProofStep (midpoint, slope with a cancelling slip, distance, midsegment length), genProofEnd |
| prove-slope-criteria | slopeProof (no common point, the meeting x, vertical lines), perpProof (P(k, km₁), Q(k, km₂)), iffBoth |
| critique-argument | critique (one example, a special placement, a valid general proof, a valid counterexample) |
| audit-omitted-cases | audit (division by a run, vertical sides in a slope check, c ≠ 0 already guaranteed) |

Oracle notes: every point is plotted at the coordinates the prompt or board states; the choice text names the
candidate points of the choice families; slopes ±1 never appear where the opposite and the negative reciprocal would
coincide; a figure's class is built from vectors and re-read from the coordinates.

Could move to the kit: the polygon wash (`fillPoly`) and a `reveal` layer for Plane pictures (pic.ts).
