# One-step inequalities and signed one-step equations (grade 7, 7.EE.B.4, 7.NS.A.3)

**Concept.** Solving means finding EVERY number that makes the statement true. Doing the same thing to both sides
moves every number on the line the same way: + and − slide them (order kept), × or ÷ by a positive stretches or
shrinks them (order kept), × or ÷ by a negative mirrors them through 0 (order reversed). So the symbol reverses for
exactly one reason: you multiplied or divided both sides by a negative number. Not because a negative number shows
up, not because numbers got smaller. A boundary plus one test value on each side confirms the whole set, because a
one-step expression only grows (or only shrinks) as the variable grows.

**Model.** `SignLine.ts`: one or two number lines. A mark is a boundary (open dot = left out, filled = included) whose
number takes the place of the tick numbers it would cover; a set is the solution ray or segment, painted; a map draws
"the same step to both sides" as arrows from the top line to the bottom line, with the step in the left column.
The block computes the images and asserts the order rule (+ parallel / × negative crossing), so a picture cannot
show a wrong flip. Tests are values on the other side of the line with a check or a cross; jumps are signed changes
(+9, −4) as arcs. Top line numbers above it, bottom line numbers below it: the band between holds only arrows.
Colour roles: amber = the bound / other side, teal = the unknown's side (−2h, x ÷ (−3), −3 + x), lime = the answer,
lavender = the step and the test values, red = wrong (Jordan's ray). `vlead.ts` (local helper): leaders reach a
number from above or below, never along an axis. `ineq.ts`: exact rationals, solve, substitution, TeX/HTML.

## The five parts
1. **The question**: the temperature falls 2 °F an hour; Ava writes −2h < −6 for "fallen more than 6 °F". Cards
   h < 3 (no-reversal-for-negative), h > 3 (right), h = 3 (boundary-only-solution); how sure.
2. **Worked example** (Read it, Divide, Graph, Check): the teal ray of changes < −6 (leader −6 → the mark);
   ÷ (−2): arrows −6→3, −8→4, −10→5 cross (the order reverses), (−2h)/(−2) > (−6)/(−2); the lime ray h > 3 with an
   open dot (leader 3 → the mark); test h = 4 (true) and h = 2 (false). Why did < turn into >? mirror (right) /
   "a negative shows, so flip" (reverses-for-any-negative-sign) / "numbers get smaller" (proper-fraction-scaling).
3. **Your turn** x ÷ (−3) ≥ 2: the reading is given; the kid picks × (−3) (× 3 = divide-by-coefficient-without-sign,
   ÷ (−3) = operates-on-visible-numbers), types where 2 lands (−6; 6 = without-sign), picks x ≤ −6 (x ≥ −6 =
   no-reversal, x = −6 = boundary-only, x < −6 = drops the "or equal"), tests x = 0; callback to the part-1 card.
4. **Prove it**: Jordan flips −3 + x ≤ 5 to x ≥ 8 "because there is a negative". Chain: add 3 to both sides (arrows
   run parallel) → the order stays, x ≤ 8 (lime ray) → x = 10 fits Jordan but 7 ≤ 5 is false (red dashed ray, test
   cross, Jordan's line struck). Distractors: reverses-for-any-negative-sign, reverses-after-addition-or-subtraction,
   boundary-only-solution.
5. **Practice**: runtime walk through all 11 sub-goals, then mixed. Inequality items draw an empty line; a miss plays
   the boundary, the set and the test values, and writes the solution on the board. Map items play the arrows.

## Sub-goal → families
| sub-goal | families |
|---|---|
| solve-ineq-additive | solveAdd (x + p, p + x, x − p, unknown right; whole, decimal, fraction, nonnegative steps), graph, testPoint |
| solve-ineq-positive-scale | solveScale (px, x/p, 0.4x, (3/4)x), boundaryNum |
| model-solve-ineq-context | contextCount (whole counts: round down for "at most", up for "at least"), contextSet (0 ≤ x ≤ b loads) |
| model-solve-ineq-geometry | geometry (square pen, rug area, box volume, acute angle; 1 in 5 is an "exactly" equation) |
| solve-additive-integer | addEq (x + 9 = 4, −6 + x = −10, x − (−3) = 15; jump on the line; candidate testing) |
| solve-multiplicative-integer | mulEq (−5x = 35, x/(−4) = 3, −3x = 0, temperature drops) |
| solve-signed-rational | ratEq (x + 2.5 = −1.25, −2/3 = x − 1/6, −(3/4)x = 6, x/(−0.5) = 8, −1.2x = −0.36) |
| solve-ineq-signed-additive | solveAdd, graph, testPoint (negative boundaries, x − (−4), −3.5 + x) |
| ineq-negative-scale-reverse | solveScale, flipMap (2 < 5 → × (−3) on two lines; keep or reverse?), boundaryNum |
| justify-ineq-steps | justify (name the order property; why boundary + tests suffice), flipMap |
| model-signed-context | signedContext (diver, temperature, submarine, shared debt, −2h ≤ −10, balance b − 15 > −20) |
