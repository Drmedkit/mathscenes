# Composite area, volume and surface area (grade 7, 7.G.B.6; TEKS 7.8-7.9; B.E.S.T. MA.7.GR.2)

Topic `secondary.composite-area-volume-and-surface-area`, slug `composite-area-volume`, 21 sub-goals.

## Concept
Split a composite figure or solid into pieces that cover it exactly once. **Area and volume add** (or subtract a
removed part), whatever split you choose. **Surface area does not add**: where two pieces touch, the contact region
was counted once on each piece and is inside now, so it comes off twice (S = S1 + S2 - 2A); a cut does the opposite
(same volume, two new faces). Prisms are layers of their base (V = Bh, the base is an end, not the bottom face), a
pyramid is a third of its prism, a cylinder is V = pi r^2 h.

## Model
- `measure.ts` (pure, tested): a composite solid as a union of boxes minus cut boxes on a compressed grid; volume and
  surface are counted cell by cell (the exposed-face inventory), so every shortcut (V1 + V2, S1 + S2 - 2A, V - Vcut)
  is checked against a direct count; polygon, prism, pyramid, cylinder formulas; number formatting and words.
- `Solids.ts`: glass bodies in the cross-sections camera (boxes unions with creases only where the union has an
  edge, right prisms with any polygon base, pyramids, cylinders), pull-apart offsets (`explode`), glowing contact /
  base regions, dashed heights with right-angle marks, labels beside outline edges (pass 0 off the solid, pass 1 on
  a face but off every line; `optional` labels are dropped rather than drawn on a line; `SolidsSafe` falls back to
  all-optional for the rare picture that does not fit).
- `FloorPlan.ts`: a composite figure from above: one wash with holes, right-angle marks, side labels outside, "?" for
  an unlabeled side, dashed heights, a proposed split as translucent pieces (overlaps darker, gaps visible).
- Roles: first (amber) = the solid / block A, second (teal) = block B / the pool / opening, pick (lavender) = where
  blocks touch / the "?", link (lime) = the answer, cut faces, the base B; wrong = removed or doubly counted part.

## The five parts
1. **The question**: a gym step, 4 x 3 x 1 ft block with a 2 x 3 x 1 ft block on its left half (38 ft^2 and 22 ft^2
   on their own), covered in vinyl. Cards 60 (counts-hidden-contact-faces), 54 (removes-shared-part-only-once),
   48 + how sure.
2. **Worked example** Split -> Add the volumes -> Each block's surface -> Glue it back: the blocks pull apart, the
   contact regions glow on both; V = 12 + 6 = 18 ft^3; 38 + 22 = 60; the blocks close, both glows go inside,
   S = 60 - 2 x 6 = 48 ft^2. Why twice? (right / only one face covered / nothing taken away).
3. **Your turn**: trophy stand, a 6 x 6 x 4 in block centred on a 10 x 10 x 4 in base. Split, volume (544) and
   skins (528) given; the kid types the contact region (36; 100 = removes-whole-face-under-partial-contact) and the
   surface (456; 528 / 492 / 392 classified); callback to the commit card.
4. **Prove it**: Riley: "cut a block of clay in two, the total surface stays the same". Judge, then a because-chain
   (fill exactly once -> new face on each piece -> volume same, surface + 2 x cut area) with three misconception chips;
   the pieces part, the cut faces glow, 108 + 24 = 132, Riley's 108 struck last.
5. **Practice**: `runtime/practice.ts` over `plan.ts`; a miss replays the item's solution (pieces part / regions
   light up, then the board solves).

## Sub-goal -> family
| sub-goal | family |
|---|---|
| comp-partition | split (exact / overlap / gap, L and stairs plans) |
| comp-hidden-dimension | hidden (L plan, stairs, stepped solid; some not to scale) |
| area-additive | areaAdd (L with hidden length, house, rect + trapezoid; whole, decimal, fraction; unit choice) |
| area-subtractive | areaSub (notch, walkway, frame, triangular hole) |
| vol-additive | volAdd (2 and 3 boxes) |
| vol-subtractive | volSub (notch, cavity, tunnel) |
| vol-prism-bh | prismBh (iso / right / trapezoid prisms lying down, standing triangle; which formula) |
| vol-composite-base-prism | tent (house-shaped end, L-shaped end; methods agree) |
| pyramid-one-third-prism | third (how many fills, value, unequal heights, slant height) |
| pyramid-volume | pyrVol (rectangular with slant distractor, triangular with two heights) |
| partition-independence | twoWays (other split, add vs subtract, lucky total) |
| sa-contact-classify | classify (contact / hidden outside / visible) |
| sa-whole-face | faces (cubes in a row, stacked boxes, roof on a box) |
| sa-double-subtraction | joinSA (number, why twice) |
| sa-partial-contact | partialSA (centred / offset / flush; bottom in or out) |
| sa-cut-join-invariance | cutJoin (cut number, cut / join choice, rearranged cubes) |
| apply-choose-measure | which (fill, coat with / without bottom, depth unit) |
| cyl-volume-bh | cylVol (exact in pi, 3.14; radius or diameter) |
| cyl-surface-area-net | cylSA (tank / open can / label, taller can, label length) |
| vol-missing-dimension | missing (box, pyramid height or base, cylinder height) |
| apply-cost-coverage | cost (paint cans round up, sod price, concrete in cubic yards) |
