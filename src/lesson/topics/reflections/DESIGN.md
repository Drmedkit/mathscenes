# Reflections (primary.geometry.reflect-2d-shapes, grade 8)

**Concept.** A reflection in a line m sends every point P to its own partner P′: on the line through P at a right
angle to m, just as far beyond m as P is in front of it (m bisects PP′ at a right angle); points on m stay put.
Everything else in the topic (grids, 45° lines, tools, checking, finding m) is this one criterion used forwards,
backwards or as a test.

**Model** (`Mirror.ts`, maths in `mirrorMaths.ts`). A sheet of graph paper (or plain paper) taped to the dusk wall,
the line m in teal across it (or only a piece, with arrowheads). Amber = the original, teal = m, lime = the image,
lavender = the focus or someone's claim (Riley, a purple copy), red = struck. The block computes every image
exactly (`checkReflection` asserts: foot on m, PP′ ⟂ m, equal distances, involution, fixed points) and draws named
steps: `sheet line figure image spots cands segs perp hops beyond answer join orient fold` (per solve point also
`perp0`, `hops1`, ...). `fold` turns the figure's half of the sheet over the crease (an affine squash about m), so
the paint at P visibly lands on P′. Labels are placed greedily so they never sit on a line, point, tape or label;
`where` boxes (perp, hops, beyond, image, foot, spot, point) carry the board's leaders.

## The five parts
1. **The question** (part 1): wet paint at P, fold along a slanted crease. Three spots, all as far from m as P:
   spot 1 straight across the page (mc reflects-not-perpendicular), spot 2 right, spot 3 moved along m
   (mc reflection-one-condition-only). How sure.
2. **Worked example**: Go to m at a right angle → Count the steps (2 diagonal steps) → Count the same steps beyond
   → Fold to check. Board: `PM ⊥ m`, `PM = 2 steps`, `MP′ = 2 steps`, hero `P → P′`, each with a leader to its
   part (the image side faces the board, so no leader crosses m). Why? 3 reasons (right / straight across the page /
   any spot as far).
3. **Your turn**: triangle ABC across y = −x + 10, faded from the end: A is done; the kid counts B's steps (number;
   6 = counted across the page, 4 = counted corners), picks B′ (2 / 3 / 4 steps beyond), says where C (on m) goes,
   then reads the reversed vertex order (clockwise → counterclockwise). Callback to the part-1 pick.
4. **Prove it**: Riley: "Q is the image of P because it is on the other side and just as far". Judge, then a
   because-chain (image on the perpendicular / Q is off it / P′ is 2 steps beyond M) from 5 chips; distractors =
   one-condition-only and opposite-sides-suffice. Riley's line is struck after the picture shows P′.
5. **Practice**: all 23 sub-goals in topic order, then mixed (runtime). After a miss the picture solves itself
   (perpendicular, counted hops, the same count beyond, the image / true line / order arrows).

## Sub-goal → family
| # | sub-goal | families |
|---|---|---|
| 1 | flip-not-slide | move (reflection / slide / half turn of an F, L, P-shape or flag) |
| 2 | fold-correspondence | fold (which spot does B land on) |
| 3 | common-perpendicular | perp (which segment crosses m at a right angle; v/h/45°/oblique) |
| 4 | equal-distance-opposite-side | distance (perpendicular given; same side, unequal, shifted, on-the-line spots) |
| 5 | fixed-points | fixed (how many squares does a vertex move; 0 for a vertex on m) |
| 6 | read-diagram-marks | marks (ticks and right-angle box, not to scale, marks contradicting the look) |
| 7 | grid-point-reflect | count (spots), stepsNum (number: to m / P to P′) |
| 8 | construct-perpendicular | tool (which dashed line the right-angle tool draws) |
| 9 | transfer-distance | transfer (PM in whole cm or half inches → PP′) |
| 10 | polygon-vertex-by-vertex | vertex |
| 11 | polygon-touching-crossing | crossing (is Ben's image right), vertex (touching/crossing figures) |
| 12 | diagonal-grid-reflect | diag, stepsNum (whole diagonal steps) |
| 13 | diagonal-half-steps | half (incl. "no image" option), stepsNum (small steps) |
| 14 | oblique-line-tools | oblique, tool (oblique lines) |
| 15 | extend-mirror-line | extend (piece of m drawn; "no image" option) |
| 16 | verify-point-pair | verify (name the failed condition) |
| 17 | audit-polygon | audit (which vertex fails / reflected in a different line) |
| 18 | same-shape-not-enough | sameShape (true, glide, other parallel line, slide) |
| 19 | orientation-test | orient (same order rules out; reversed decides nothing) |
| 20 | fold-perpendicular-bisector | bisect (which crease) |
| 21 | locate-mirror-line | locate (which line; slanted lines, a fixed vertex) |
| 22 | diagnose-error | slip (Riley's slide / straight across / off by one / corner / from P) |
| 23 | exact-vs-measured | exact (measured lengths vs given marks) |

Review aid: `reflections.html?open&part=4&solve&item=<family>:<subgoal>:<seed>` shows one item and its solution;
`node tools/walk-reflections.mjs gallery` screenshots every family.
