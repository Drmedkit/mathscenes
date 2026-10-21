# Cross-sections of right rectangular prisms and pyramids (grade 7, 7.G.A.3)

Topic `secondary-t5-23-cross-sections-and-composite-area-volume`, slug `cross-sections`.

## Concept
A cross-section is the flat region (no thickness) a plane shares with a solid. It is found face by face: every face
the plane crosses gives exactly one side, so the faces crossed decide the shape, and the plane's direction decides
which edges the sides run along (parallel to a face: a copy of that face; pyramids shrink toward the apex; a standing
pyramid slice is a triangle through the apex, a trapezoid off it; a cube gives 3 to 6 sides, never more).

## Model: `Slicer` (Slicer.ts on sliceMaths.ts)
A see-through glass solid (box or right rectangular pyramid; upright, upside down or tipped onto a side face) in an
orthographic 3-D view, hidden edges dashed; the plane as a teal sheet; the section in lime.
- maths (`sliceMaths.ts`, pure, tested): faces with outward normals, the section chained from one segment per face
  (`sideFaces` = the trace), faces crossed, shape (name, side lengths, parallel sides, right angles, regular), the two
  pieces of the cut solid, poses, camera.
- steps: `solid dims plane points trace fill open flat sides`; focus: a face glows, a dimension pulses, the plane
  slides (`shift`: the section follows live), a ring round the section.
- `drawFlat` flies the section out of the solid onto the board and lays it flat (true shape, to the solid's scale),
  with the side lengths that run along an edge direction.
- labels sit beside an edge, outside the solid and the lifted piece, never on a line (a sheet's edge stops short of
  a label); the block throws when nothing readable fits.
- roles: first (amber) = the solid and its lengths, second (teal) = the plane, link (lime) = the section,
  pick (lavender) = the face being traced / in focus.

## The five parts
1. **The question**: a 6 x 4 x 3 in block of cheese, the knife straight down parallel to the end, 2 in from it.
   Cards: 6 in x 4 in (copies the base), 4 in x 3 in (right), the 2 in piece (piece, not section) + how sure.
2. **Worked example** (same block), steps Place -> Trace -> Lift -> Name: the end face glows (plane || end face); the
   four sides draw on, each with its face glowing (4 faces -> 4 sides); the cut-off piece slides away and the section
   flies flat onto the board; "rectangle", 4 in x 3 in, leader to the section. Why: three reasons (right / copies the
   base / the piece).
3. **Your turn**: a 6 x 4 in pyramid paperweight. Place, Trace, Lift given (level plane halfway up); the kid names it
   (3 in x 2 in / same as the base / a triangle), the plane rises and the section shrinks to a point; then the plane
   stands up through the apex (triangle, shown), slides off the apex: the kid picks trapezoid (vs triangle / rectangle)
   and types the bottom side (4 in). Callback to the commit.
4. **Prove it**: Jordan: "a cube can be cut into an octagon". Judge, then a because-chain: each side lies on one face
   (the surface is made of faces) / no face holds two sides (flat meets flat in one segment) / at most 6 sides (6
   faces). Distractor chips: only squares and rectangles, tilt it and anything is possible, two sides on one face.
   The hexagon through six edge midpoints is traced face by face, filled, laid flat; Jordan's 8 is struck.
5. **Practice**: `runtime/practice.ts` over `plan.ts`; after a miss the canvas traces, fills and lays flat the section
   and names it on the board.

## Sub-goal -> families
| sub-goal | families |
|---|---|
| cs-plane-section-parallel | name (pick the section: right / the piece / another face), dims (its two lengths) |
| cs-perpendicular-orientation | orient (which cut gives a w x h rectangle; the slanted cut through two opposite edges), dims, name |
| cs-pyramid-tapering | taper (shape of a level slice, which of two is larger, at the apex, which face is the base when tipped), half (halfway up: half x half) |
| cs-pyramid-perpendicular | upright (triangle / trapezoid / rectangle), bottom (the bottom side = the base edge it is parallel to) |
| cs-oblique-trace | join (which two marked points share a face), count (one side per face crossed), equi (corner cuts: equilateral only with equal distances) |
| cs-section-possibility | possible (the bound rules shapes out; a real cut shows one is possible), most (sides <= faces) |

Misconceptions classified: piece/face/silhouette, copies the base, base = bottom face, every pyramid slice a triangle,
off-apex slice a rectangle, joins through the interior, corner cut always equilateral, cube sections only
squares/rectangles, case assumed possible without an example, overgeneralises (cube -> pyramid), more sides than faces.
