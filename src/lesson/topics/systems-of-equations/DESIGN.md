# Systems of linear equations (secondary-t5-31, grade 8, 8.EE.C.8)

**Concept.** One linear equation in x and y has infinitely many solutions: the pairs fill a line. A system asks
for the pairs that make BOTH equations true at once, so its solutions are the points on both lines: one crossing,
none (parallel lines), or every point of one line (the same line twice). Substitution and elimination find the
crossing without drawing; when the letters cancel, 0 = c (false) means parallel lines and 0 = 0 (true) means one
line. A combined equation (2x = 8) is itself a line through the crossing.

**Model: the plane with two lines** (`SysPlane.ts`, maths in `sysMaths.ts`). Line 1 amber (first), line 2 teal
(second), the crossing lime (link), candidates and focus lavender (pick). Painters: grid (a grid step per axis, so a
context gets a scaled first-quadrant plane with axis names), lines that draw on across the window (dashed over solid
when they coincide), solution dots along a line, dashed guides (x = 4, y = 3), gap arrows between parallel lines,
marks with labels placed clear of every line, axis and dot (the congruence lesson's `placeAround`, read-only).
`sysMaths`: Cramer solve (one / none / inf), clip to a window, lattice points, and the line written in standard
form, solved for y or for x, with real minus signs and no "1x" / "+ −3". No leaders: they would cross the plane, so
the crossing gets a ring pulse instead.

**Board.** The system on the right, line 1 amber, line 2 teal, every row aligned on its = sign; the work under it.
The elimination in part 2 puts a lavender + left of row 2 and a rule under it, like a column sum.

## The five parts
1. **The question**: x + y = 7 and x − y = 1, three marked points: (5, 2) fits only the first
   (one-condition-enough), (4, 3), (3, 4) is (4, 3) reversed (reverses-coordinate-order). Lines are NOT drawn yet.
2. **Worked example** (same system): solution dots of x + y = 7 fill a line → the second line → the crossing,
   checked in both (and (5, 2) on one line only) → add the equations: 2x = 8 is the vertical line x = 4 through the
   crossing, 4 + y = 7, (4, 3). Why-question: on both lines / where a line meets an axis (intercept mc) / any point
   on one line (one-condition-enough).
3. **Your turn** y = 2x − 1, x + y = 8: lines given; the kid substitutes (x + 2x = 8 = first-term-only, y + (…) =
   wrong letter), solves 3x − 1 = 8 (9 = stopped at 3x), reports (3, 5) ((5, 3) = reversed). Guides x = 3, y = 5
   draw on the plane; callback to the card.
4. **Prove it**: Riley sets y = 2x + 3 equal to y = 2x − 1, gets 3 = −1, writes x = 0 and (0, 3). Judge, then a
   because-chain: (0, 3) is on line 1 only (the teal line is at −1 there; Riley's line struck) / the lines never meet
   (gap arrows, 4 everywhere) / no solution (3 = −1 false for every x). Distractor chips: "when the x's cancel,
   x = 0" (zero-vs-no-solution), "parallel lines meet far away" (parallel-lines-meet-offscreen).
5. **Practice**: 23 sub-goals in topic order, then mixed. Almost every item draws its system on the plane; the parts
   that would give the answer away (the crossing, a line through the right candidate) appear only on the solve,
   with the work lines written under the system.

## Sub-goal → families (plan.ts), 42 families
| sub-goal | families |
|---|---|
| pair-on-one-line | onLine (which pair; reversed pair diagnosed), makeSolution (x given → y; swapped role), howMany (one equation: infinitely many) |
| pair-satisfies-both | pickPair (on line 1 only / line 2 only / neither), checkWork (y changed between equations, one equation enough) |
| intersection-as-solution | readCross (pair from the graph; axis intercepts diagnosed; horizontal/vertical lines), pointPick (crossing vs intercept vs reversed) |
| no-solution-parallel | parallelGraph (parallel vs crossing; "meets off the graph"), howManySys |
| infinite-coincident | sameLine (2y = 4x + 6; every point of the plane), solOrNot |
| substitute-expression | subChoice (y or x isolated; parentheses, first term only), setEqual (both y =) |
| solve-and-back-substitute | subSolve (pair; halves), reportPair (x = 3 only, bare numbers, reversed) |
| isolate-then-substitute | isolate (sign change), whichVar (coefficient 1; "can't substitute yet"), subSolve |
| eliminate-by-adding | addEq (deletes terms / keeps a right side), elimSolve, afterAdd (stop at x, every pair with x = 3) |
| eliminate-by-subtracting | subEq (−(−b), minus on the first term only, added instead), elimSolve |
| scale-one-equation | scaleOne (some terms only), pickMult (×k vs ×−k), elimSolve |
| scale-both-equations | pickMult (multipliers that don't match), elimSolve |
| clear-rational-coefficients | clearFrac (fractions, money decimals), ratSolve (coins; x/2 + y/3) |
| contradiction-no-solution | zeroEq (0 = c: x = 0, 0x = c so x = c), howManySys (scaled forms) |
| identity-infinite | zeroEq (0 = 0: no solution, x = 0, every pair), solOrNot |
| choose-method | chooseMethod, methodsAgree, elimSolve, subSolve (mixed structures) |
| graph-solve-estimate | graphRead (two marked points per line), sketchTrap (crossing outside the window / truly parallel), estimate |
| write-one-constraint | writeOne (count-and-value, swapped rates, coefficient as addition; fee + rate), fillCount |
| model-two-constraints | writeSystem (count/value mixed, swapped rates, one letter), timesAsMany |
| verify-in-originals | verify (fits one equation / only the sum equation), findSlip (parentheses, sign, back-substitution) |
| graph-estimate-vs-exact | exactVsEst (graph overrides algebra, estimate = exact), estimate |
| interpret-viability | viable (half a bus, a negative count, rounding), planMeaning (break-even meaning, same rate never meets) |
| systems-from-lines | twoPoints (by points or a table; rise/run inverted diagnosed), meetOrNot (parallel / same / one) |

Every misconception id is checked against misconceptions.json in the test; the test also fails on any control
character in a board, label, work line, prompt, choice, solution or verdict (the `\t` bug), and on any TeX escape in
the page source written with a single backslash. No runtime change was needed.
