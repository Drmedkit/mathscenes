# Draw triangles from given conditions (grade 7, 7.G.A.2)

**Concept.** A drawing request is a *set of conditions* the triangle must meet all at once. Drawing it means
locating the third corner where two conditions meet (two compass arcs, two angle rays, a ray and a length).
Whether they meet decides the answer: no triangle, exactly one (up to a turn or a flip), or many (angles only).

**Model.** `Construction.ts`: a sheet of dark drawing paper on a wooden board, with the marks a kid draws (sides,
rays, compass arcs, angle marks, vertices, candidate points) and the instruments (ruler, protractor, compass), each
on a named step, in figure units (in / cm) scaled into a Frame. Layout is pure (text widths estimated) and throws
when a label cannot sit next to its part without touching a line or another label. Colour roles: amber = a given
length (sides, sticks, the compass opening), teal = a given angle, lime = what the conditions fix (the found corner,
the answer), lavender = focus / candidate points, red = wrong. `triangleMaths.ts` holds the exact maths (SSS / SAS /
ASA solvers that measure themselves back, circle meets, existence, angle sum, side-angle order, none/one/many).
`pictures.ts` turns plain-data pictures (`Pic`) into drawings; items carry a `Pic`, tests build every one in node.

## The five parts
1. **The question.** Sticks of 3, 4 and 7 in. How many triangles? Cards: *One* (mc any-measurements-make-a-triangle),
   *None* (right), *Flat* (mc accepts-degenerate-triangle) + how sure.
2. **Worked example** (5, 4, 3 in), subgoal steps *List the givens* (freehand sketch, givens become a checklist on the
   board) → *Draw the base* (ruler, tick) → *Swing two arcs* (compass 4 in around A, 3 in around B, each arc glows
   while its line is the focus) → *Join at the crossing* (C, sides, ticks, `4 + 3 > 5`, "C is on both arcs" with C
   glowing). Why? "Why does C have to be where the arcs cross?" (distractors: by eye = construction-by-eye-or-measure,
   any size = compass-width-changed).
3. **Your turn** (6, 3½, 4 in), faded from the end: sketch and base given; the kid opens the compass for the arc
   around A (chips 3½ / 4 / 6 in), then picks C among P (crossing), Q, R (on one arc only = stops-after-some-conditions).
   Then the sticks from part 1 on paper: base 7, arcs 3 and 4 only touch on the base; callback to the commit.
4. **Prove it.** Jordan: "40°, 60°, 80° make only one triangle." Because-chain over two nested triangles on 3 in and
   5 in bases: angle sum 180 → same angles meet farther out on a longer base → same angles, different sides: many.
   Distractor chips: equal-angles-prove-congruence, angle-sum-depends-on-size-or-shape. Jordan's line is struck.
5. **Practice** through all 11 sub-goals, then mixed (runtime/practice.ts). After a miss the construction plays its
   remaining steps (or the worked picture is drawn), the panel shows the steps, then a twin.

## Sub-goal → families
| sub-goal | families | misconceptions classified |
|---|---|---|
| condition-set | sketch (pick 1 of 3 sketches), included (is the angle between the sides?), invent (given or just looks?) | diagram-appearance-as-given, triangle-angle-at-wrong-vertex |
| draw-given-length | segLen (read a drawn segment, nonzero start / inset zero, slanted), endMark (where does it end?) | aligns-at-ruler-end-or-1, counts-points-not-intervals |
| draw-triangle-sas | sasWhere (which corner gets the angle), protractor (which dot: the scale with 0 on the side) | triangle-angle-at-wrong-vertex, reads-wrong-protractor-scale |
| draw-triangle-asa | asaRays (pick the drawing: right / common direction / swapped), asaWhere (where the rays meet) | base-angle-rays-use-common-direction, triangle-angle-at-wrong-vertex, stops-after-some-conditions |
| compass-transfer | compassCopy (keep the opening; slipped compass), compassOpen (opening read off a ruler) | compass-width-changed, construction-by-eye-or-measure, aligns-at-ruler-end-or-1 |
| draw-triangle-sss | sssNext (which arcs), sssPoint (which point is the corner) | construction-by-eye-or-measure, stops-after-some-conditions |
| tolerance-audit | audit (measured drawing vs request, ±2 mm / ±2°) | stops-after-some-conditions, audits-one-feature-without-tolerances |
| triangle-existence | exists (sticks: yes / flat / short), thirdSide (shortest and longest whole third side) | checks-wrong-pair, accepts-degenerate-triangle, any-measurements-make-a-triangle |
| angle-sum-investigate | thirdAngle (number), sumCheck (measured total ≠ 180; a huge triangle) | measurement-error-disproves-rule, angle-sum-depends-on-size-or-shape |
| side-angle-order | longest (largest/smallest from angles, from sides, isosceles), ratio (twice the angle, twice the side?) | pairs-side-with-adjacent-angle, triangle-side-ratios-equal-angle-ratios |
| triangle-uniqueness | howMany (SSS / SAS / ASA / AAA, feasible or not), flipped (turned copy vs same angles other size) | any-measurements-make-a-triangle, equal-angles-prove-congruence, turned-or-flipped-copy-not-congruent |
