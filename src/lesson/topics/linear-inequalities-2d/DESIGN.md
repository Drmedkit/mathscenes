# Graphing inequalities in two variables (Algebra 1, lesson 7; secondary-t6-33, A-REI.D.12, A-CED.A.3)

Slug `linear-inequalities-2d`, 27 sub-goals, 46 families. Builds on `linear-functions-slope` (lines from y = mx + b,
point-slope and standard form, intercepts; its `lineMaths.ts` is imported read-only for writing numbers and lines),
`solving-linear-equations` (one-variable inequalities, turning the sign for a negative divisor) and
`creating-equations` (constraints as conditions, viability, bound phrases) without re-teaching them.

## Concept
A point is a solution when putting it in makes the comparison true. The points where the two sides are EQUAL form a
line, the boundary (the related equation); it is drawn solid when the sign allows equal (≤, ≥) and dashed when it does
not (<, >). Off the line the comparison cannot switch without passing through equality, so one test point off the line
decides its whole side: the solutions fill a half-plane, every point of it (decimals, far away), with no edge. With y
alone and a plus sign, > is above; otherwise (−2y, Ax + By) the test point decides, or y is isolated and the sign turns
when dividing by a negative. A system is AND: the overlap of half-planes (a wedge, a strip, a line, a half-plane, or
nothing); every added constraint cuts the old region. In context: feasible plans, whole-number domains, vertices
(crossings that also meet every constraint) and the corner principle of linear programming.

## Model: the shared kit's Plane, pictures as data (`ineqPic.ts`, maths in `ineq.ts`)
`ineq.ts`: the written forms (y op mx + b, Ax + By op C, x op c, y op c, point-slope), what each means as
A x + B y op C, membership with the equality case, the side, and HTML / TeX writing (`&lt;`/`&gt;` in HTML).
`ineqPic.ts`: a picture is what is DRAWN: `bline` (A x + B y = C, solid or dashed; vertical when B = 0), `shade` (the
intersection of half-planes s(Ax + By − C) ≥ 0, drawn by the kit's `shade` between a lower and an upper boundary over
the x-range the vertical parts leave; an empty system shades nothing), points, segments, texts. `show` keys come with
the question, `solve` keys with the worked solution. A picture with an empty `show` starts as a big slate and turns
into the plane on the solve (no empty grid with a question). A point name that finds no room is dropped and the plane
rebuilt (the coordinates are in the prompt). Colour roles: lime = the boundary / solutions / answers, amber and teal =
the first and second inequality of a system, lavender = candidate points and focus, red = failing points.

## The five parts
1. **The question** Which points make y > x + 1 true? Cards: only the points on the line (boundary-only-solution),
   every point above and the line too (strict-includes-boundary), every point above with the line left out + how sure.
   The plane shows the line y = x + 1 as a grey reference.
2. **Worked example** test four points (0, 3) ✓, (3, 1) ✗, (−2, 0.5) ✓ (between grid lines), (2, 3) ✗ ON the line →
   the equal-sides points are the boundary y = x + 1, dashed for > ((2, 3) ringed) → test (0, 0): 0 > 1 false, shade
   the other side (above) → why a whole side: at x = 3 the line is at 4 and y > 4 is everything straight up; the same
   at every x. Why? "to switch you must cross the line" / "just the rule" (test-point-as-unjustified-trick) /
   "test several points" (test-point-distrusted).
3. **Your turn** 3x − 2y ≥ 6, faded from the end: x-intercept (2, 0) given; the kid types the y-intercept (−3; 2 =
   intercept-zero-swap), picks solid (dashed = inclusive-excludes-boundary), then the side after (0, 0): 0 ≥ 6 false
   ("above: ≥ means above" = shades-above-for-greater; "the side with (0, 0)" = always-shades-test-point-side);
   shade below, check (4, 0). Callback to the card.
4. **Prove it** Jordan shades the strip between y ≥ 2x + 1 and y ≤ 2x − 3: "two inequalities always make a region".
   Judge, then a because-chain: (0, −1) in the strip breaks y ≥ 2x + 1 / the half-planes face away (amber above the
   upper line, teal below the lower) / both at once need 2x + 1 ≤ y ≤ 2x − 3, so 1 ≤ −3: no solution (the strip
   fades). Distractor chips: inequality-system-always-region, one-condition-enough, examples-as-proof.
5. **Practice** all 27 sub-goals in topic order, then mixed.

## Sub-goal → families (plan.ts), 46 families
| sub-goal | families |
|---|---|
| entry-check | readPoint (halves, swapped order), evalExpr (3x − y at signed / half pairs; subtract-negative), compareTF (−12 ≥ −12) |
| point-membership | isSolution (on / in / out, swap changes the verdict), whichSolution (boundary point for strict, swapped point) |
| vertical-horizontal-lines | hvMember ((3, −100) on x = 3), hvGraph (line vs point vs horizontal) |
| region-discovery | regionShape (half-plane vs lattice vs line vs grid-bounded), farPoint ((40, −100), (2.5, 1.25)) |
| boundary-equation | boundaryOf (all four forms), regionShape |
| boundary-inclusion | inclusionPair (which sign keeps a line point), lineStyle |
| boundary-lines | intercepts (integer and half intercepts, negative coefficients), throughOrigin (second point), matchBoundary (intercept swap) |
| dashed-solid | lineStyle (style + reason; convention reversed, by side, no line), wrongStyle (supplied graph with the wrong style) |
| test-point-side | testPointSide ((0, 0) true / false; boundary through the origin: pick an off-line point) |
| graph-slope-intercept | siGraph (style × side, line only), writeGraph (y-isolated) |
| axis-aligned-inequalities | axisSide (x > 3 right, not above, not a ray), writeGraph (x / y boundaries) |
| standard-form-inequalities | stdSide (−2x − 3y > 6 below: the test point beats the symbol), testPointSide |
| isolate-y-reversal | isolateY (B < 0, B = −1, B > 0), bZero (−2x ≥ 6: solve for x, no divide by 0) |
| graph-point-slope | psRead (point and slope; sign of x1, y1; order), psToSI (distribute to both terms) |
| system-meaning | sysPoint (both / only the first / only the second / neither, supplied half-planes) |
| graph-two-system | sysRegion (four wedges A-D), sysCorner (the crossing with a dashed boundary) |
| special-intersections | specialKind (strip, empty, line only, y > 1 and y ≤ 1, oblique parallels, nested) |
| multiple-constraints | multiPoint (last-constraint-only and one-fails decoys), addConstraint (redundant / cuts / empties / "replaces") |
| justify-boundary | whyIncluded (equal sides on the line vs "the rule says"), wrongStyle |
| justify-test-point | oneTestWhy (no crossing, no switch), vertCompare (straight up from the line at x = a) |
| write-from-graph | writeGraph (integer / fractional slopes, B < 0, x / y), writeTable (boundary pairs + labeled pairs; a finite list does not fix the rule) |
| critique-graphs | critique (style, side from a missed reversal, swapped-intercept line, nothing), critiqueSystem (union, closed corner, region for an empty system, nothing) |
| interpret-feasible | viablePlan (jobs: hours cap + earnings target; fence: budget + length; name the broken condition), multiPoint |
| formulate-constraints | phraseIneq (at least / more than / at most / less than; swapped rates; equation), psContext (savings $200 by week 4, +$25 a week) |
| discrete-domain | wholeOnly (ticket counts: fractions and negatives out), countBoundary (whole-number points on ax + by = T) |
| feasible-vertices | vertexPair (elimination, halves), notVertex (a crossing that breaks another constraint) |
| linear-programming | lpBest (corners vs farthest corner vs inside point), lpSpecial (one corner / an edge ties / unbounded / empty) |
