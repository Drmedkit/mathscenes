# Scale factor and area (primary.ratios.scale-area, grade 7, 7.G.A.1)

**Concept.** Multiplying every length by k multiplies the area by k × k = k²: the length gives one factor of k (k
copies in a row), the width gives another (k rows). Stretching one side only gives × k; unequal factors give a × b.
It holds for any shape (triangles tile into k² copies, unit-square figures grow part by part) and any positive k.
Tempting wrong idea: the area is × k ("3 times as big"), or the factors add (k + k).

**Model: `AreaGrid`** (`AreaGrid.ts` draws, `areaMaths.ts` is the pure maths + layout). Grid paper (the ScaleGrid
paper of `scale-factor`), the original (amber wash) and the copy (teal, a lighter wash: the space to fill). The copy
fills with whole copies of the original that fly in from it: row 0 first (`row`, the length's factor), then the row
is copied up (`rows`, the width's factor); triangles fly in all at once (`tiles`), the middle ones turning half a
turn; unit-square figures send every square over to grow into a k-by-k group (`groups`); a reduction 1/m tiles the
original with m × m copies of the copy (`reverse`). Tile numbers appear as each tile lands. Labels: base under the
figure, height to the left (paper pads), areas inside on a light pad. `layoutArea` picks stack/side, keeps numbers
≥ 60 px (counts 48 px only where they fit inside the tile) and fails on a label outside the frame, on a figure or on
another label; the block throws on any failure. Roles: original + its copies = first, the copy = second, the factor
/ answer = link, focus rings = pick.

## The five parts
1. **The question**: a 3 ft × 2 ft rug (6 sq ft); every length × 3: how much fabric? Cards 18 (area-scales-by-
   length-factor), 54, 36 (additive-reasoning: 3 + 3) + how sure. Only the rug is drawn (the copy would give it away).
2. **Worked example** (same rug): Scale every length (the 9 × 6 copy draws, labels pulse with `3 →×3→ 9`, `2 →×3→ 6`)
   → Stretch the length (one row of 3 rugs flies in, row ring, `6 × 3 = 18`) → Stretch the width (the row is copied
   up, `18 × 3 = 54`) → Name the area factor (numbers dim, 54 inside, `6 × 3² = 54 sq ft`, `9 × 6 = 54 ✓`). Why 9
   times, not 3? (right / × k / adds the factors).
3. **Your turn**: a 4 in × 3 in photo printed × 2. Scale and the first row are given; the kid types the number of
   photos (4; 2 = × k) — the second row flies in — then the area (48; 24 = × k, 4 = factor as area, 144 = squares
   the area). Then the area factor line and the check. Callback to the part-1 card.
4. **Prove it**: Riley: "k × k is for rectangles; my triangle scaled by 2 just doubles: 6 → 12." Judge, then three
   claims: 4 copies, not 2 (four triangles fly in, the middle one turns; Riley's line struck) / 4 × 6 = 24 / any
   figure scaled by 2 gets 4 times the area (base and height double; ½ × 8 × 6 = 24 ✓). Distractor chips: doubling
   doubles (× k), only rectangles (limits-k-squared), it worked for this one (examples-as-proof).
5. **Practice**: every sub-goal in topic order, then mixed. Pictures in a wider frame with a narrow board; after a
   miss the copies fly in and the board writes the worked line.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| stretch-one-dimension | stretchOne (new area; adds-side-increase, squares-for-nonuniform), stretchTimes |
| scale-both-dimensions | fillCopy (k rows of k), copyArea |
| uniform-scaling-check | twoFactors (a × b, incl. one side only), isScaled |
| non-rectangular-tiling | tileCount (triangles, parallelograms), onlyRects |
| composite-figure-parts | unitSquares (squares in the copy / area factor: counts-pieces-as-copies), noWholeCopies (circle, heart…) |
| area-factor-whole | areaFactor (k = 1–10, 11–12 rarely), squaredMeans (k² ≠ "a square", ≠ k × 2) |
| area-of-copy | areaGiven (A 4–200), areaFromDims |
| area-factor-fraction-decimal | fracFactor (factor or new area; 1/2 … 5/2), decFactor (omits-digits), shrinkOrGrow |
| ratio-scale-to-area-ratio | areaRatio (a : b → a² : b², order kept), planRatio (1 : 100 → 1 : 10,000) |
| legend-scale-to-area-scale | legendArea (1 in : 8 ft, ¼ in : 1 ft, 1 in : 50 mi, 1 cm : 2 m), legendUnit |
| recover-k-from-area-factor | rootK (perfect squares, 1/4, 4/9 …), planBack (actual → plan) |
| justify-doubling | whyFour (rule-as-why, examples-as-proof), onlyLength (non-example) |
| justify-general-k | eachFactor (k = 3, 3/2, 1/2 …: whole-copy-tiling, drawn-case), twoStretches |
| triangle-formula-justification | triFormula (scales-only-some-sides, scales-formula-constant), triWhy |
| contrast-perimeter-area | whichMeasure (side / perimeter / area: applies-area-factor-to-lengths), fieldJobs |
| apply-area-factor-multistep | costArea (carpet $/sq ft, paint cans, cloth price), pizzaDeal |

No runtime change was needed. Imports from `scale-factor` (read-only): `PAPER`, `PAPER_LINE`, `texEst`.
