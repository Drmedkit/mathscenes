# Area and perimeter of composite figures (grade 7, 7.G.B.4 / 7.G.B.6)

Topic `secondary-t6-29-area-and-perimeter-of-composite-figures`, slug `composite-figures`.

## Concept
A composite figure is measured part by part, but area and perimeter are built differently. Area: split the surface
into parts that cover it once (rectangles, triangles, trapezoids, half / quarter / whole circles) and add them;
removed parts (holes, notches, corner cuts) are subtracted. Perimeter: walk the boundary once and list every exposed
straight piece and arc; seams (shared sides) are inside and never count, a hole's edge does count (the outer perimeter
leaves it out). Arcs are a fraction of a circumference; answers stay exact as a + bπ, rounded once at the end.

## Model: `PlanFigure` (PlanFigure.ts on figMaths.ts)
A figure in plan view (patio, garden bed, deck, window, table top), painted surface + one ink line.
- maths (`figMaths.ts`, pure, tested): `PN` = a + bπ (exact), figure templates (rectSemi full / partial, track,
  rectQuarter, triSemi, trapSemi, rectHole, squareInscribed, ring, cornerCut, edgeNotch, semiOnly, quarterOnly,
  circleOnly, lShape, rotFig). Each figure lists parts (+/-, exact area), boundary loops of pieces (exact lengths),
  seams, removed straight edges and dimension labels. `checkFig` asserts closing loops, piece lengths, sampled area =
  sum of parts, seams inside.
- steps `region dims parts trace holes cut`; focus: piece glow, part ring, seam flash (red = counted wrongly),
  removed edge (lavender), candidate trace (fixed teal trace a question asks about), region shade, label pulse.
- labels: sans 60 px; edge dims outside with dimension + extension lines; arc labels on the outside of the arc;
  radius / diameter labels beside their line or past its end. The layout throws when a label would sit on a line,
  leave the frame or collide.
- roles: first (amber) = surface / area, second (teal) = boundary / perimeter, link (lime) = answer,
  pick (lavender) = focus and "?", wrong (red) = a seam counted as an edge.

## The five parts
1. **The question**: a 12 ft x 8 ft patio with a half circle on an 8 ft end gets edging. Cards: 40 + 4π (seam
   walked), 32 + 4π (right), 32 (curve left out) + how sure.
2. **Worked example** Split -> Area -> Walk the edge -> Exact, then round: parts + dashed seam, r = 4; parts ring as
   A = 12·8 + ½π·4² writes (leader to the half circle) = 96 + 8π; the edge is traced piece by piece (seam never),
   P = 12 + 4π + 12 + 8 (leader to the arc) = 32 + 4π ≈ 44.6 ft. Why: the seam is inside (vs every line counts /
   the curve is 8 ft).
3. **Your turn**: 14 ft x 8 ft track-shaped flower bed; split and area given (112 + 16π); kid picks the edge pieces
   (seams flash red / curves glow on a wrong pick), writes 28 + 8π (pair input), rounds to 53.1; callback.
4. **Prove it**: Riley: "cut a piece out and the perimeter always gets smaller". Table top 10 x 6 with a half-circle
   notch, r = 2: chain 4 ft straight edge gone / 2π ≈ 6.3 ft curve added / one counterexample breaks "always";
   distractors = cutting-out-shrinks-perimeter, area-and-perimeter-change-together, distance-around-as-across.
5. **Practice**: `runtime/practice.ts` over `plan.ts`; after a miss the figure replays (parts, cut, trace, shade) and
   the board writes the worked lines.

## Sub-goal -> families
| sub-goal | families |
|---|---|
| s1-region-vs-boundary | shown |
| s1-context-measure-unit | measure |
| s1-seam-exclusion | inventory, shown |
| s1-hole-boundary | shown, inventory (hole variants) |
| s1-arc-part-of-circumference | arcVs, arcEst |
| s2-exact-pi-notation | exact, readPi |
| s2-fraction-circle-area | partArea |
| s2-arc-length | arcLen |
| s2-infer-dimensions | infer |
| s2-combine-pi-terms | combine, likeTerms |
| s2-composite-area-add | areaAdd |
| s2-composite-perimeter | perimAdd |
| s2-cutout-area | cutArea, cutPick |
| s2-notch-perimeter | notch |
| s2-exact-and-approx | round, approx |
| s3-hole-area-and-boundary | hole |
| s3-parts-inventory-justification | critique, inventory |
| s3-counterexample-area-perimeter | counter |
| s3-context-model | which, job |

All 30 misconception ids of the topic JSON are classified (test: misconception coverage).
