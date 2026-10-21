# Area and circumference of circles — design

Topic `secondary-t5-21-area-and-circumference-of-circles`, grade 7 (7.G.B.4), slug `circles`.

## Concept
A circle is measured three ways: across (radius r, diameter d = 2r), around (the circumference, a length) and
inside (the area, in square units). Around ÷ across is the same for every circle: π ≈ 3.14 (never exactly), so
C = πd = 2πr. Cut a circle into thin wedges and lay them alternately up and down: the same area becomes a
near-rectangle with half the circumference on top (πr) and the radius as its height, so A = ½C · r = πr². Scaling
the radius by k scales every length (C) by k and the area by k² — C is proportional to r, A is not.
The tempting wrong ideas: area = r × r, area = the crust (πd), the whole crust as the long side (no ½), a diameter
used as r, π grows with the circle, area scales like length.

## Model: `Disc` (`Disc.ts` draws, `circleMaths.ts` is the pure maths + layout)
Five pictures in one block: `disc` (a round object — pizza, rug, pool, lid, garden, table or plain — with radius /
diameter / chord / stub / off-center segments and their labels, the circumference traced in teal, the area glazed
amber), `wedges` (the object cut into n wedges that slide into a near-rectangle; its top crust, its height (a radius)
and 3 r×r squares can be lit), `grid` (r = 3, 4, 5 on grid paper with the outer 2r square and the inner square cut
by its diagonals), `pair` (two circles to scale, with the k×k quad of small circles inside the big one's square) and
`unroll` (a circle rolls one turn: the line it lays down is C, and three diameters fit with a bit to spare).
`wedgeStrip` computes the rearrangement exactly (half of the first wedge moved to the far end; every angle used once,
so the area is the circle's; width n·r·sin(π/n) → πr). `layoutPic` places every label off every line, inside the
frame, clear of the rim and clearly nearer its own segment than any other, and returns `why` otherwise; generators
retry until it is readable and the tests check every practice picture.
Roles: area = first (amber), circumference = second (teal), r and d = ink, the answer = link (lime), focus = pick.

## The five parts
1. **The question** — a 12-inch pizza: how much cheese? Cards *about 38* (π × 12, the crust:
   confuses-area-with-perimeter), *about 113* (right), *exactly 36* (6 × 6: area-as-radius-based-rectangle); how sure.
2. **Worked example** (same pizza) — Find the radius (r = 12 ÷ 2 = 6, leader to the 6 in label) → Cut and rearrange
   (crust traced teal, C = 12π; 16 wedges slide into a row; the top crust lights up; top = 12π ÷ 2 = 6π, leader) →
   Multiply the sides (the right edge is a radius: A = 6π × 6 = 36π, leader to the 6) → Round and check (3 dashed
   r×r squares fill it with a sliver to spare; 36π ≈ 113 sq in). Why 6π, not 12π? 3 reasons (drops-half,
   diameter as length).
3. **Your turn** — a round rug 10 ft across. Radius and wedges are given (they play); the kid types the sides (top
   5π, height 5: diagnoses 10 → drops-half / diameter-for-radius), the area 25π (10 → power-as-base-times-exponent,
   100 → diameter-for-radius, 50 → drops-half) and the rounded 78.5 sq ft (31.4 → confuses-area-with-perimeter,
   246.5 → squares-pi-with-radius). Callback to the part-1 card and the how-sure rating.
4. **Prove it** — Sam: “two 8-inch pizzas = one 16-inch pizza”. Judge, then a 4-line because-chain: radius × 2 →
   crust × 2 (C = 2πr) → area × 4 (r used twice) → it takes four, not two. Distractor chips:
   area-scales-by-length-factor, pi-not-a-fixed-ratio, additive-keep-difference. The picture: the label pulses, the
   crusts trace, four small pizzas drawn in the big one's box (2 × 2), then Sam's line is struck.
5. **Practice** — every sub-goal in topic JSON order, then mixed (runtime). Pictures are the same block in a wider
   frame; after a miss the picture solves itself (trace, glaze, the answer label, the quad, the roll) and the board
   writes the worked line.

## Sub-goal → families (`plan.ts`)
| sub-goal | families |
|---|---|
| radius | whichSeg (which of A–D, how many radii incl. tilted, all radii equal) |
| diameter | whichSeg (which of A–D, is A a diameter: near-center chord / tilted diameter) |
| r-d-convert | convertRD (phase 1 / 1b / 2 ranges; pizza-across vs sprinkler-reaches wording) |
| circumference-meaning | aroundAcross (string around, around ≈ 3 × across, what the lit part shows) |
| area-meaning | lengthOrArea (measure + unit, unit only) |
| area-grid-estimate | gridBound (outer 4r², inner 2r², about 3r²) |
| pi-ratio | piRatio (measured C ÷ d, bigger circle, what π is, π on the number line) |
| c-from-d | cFromD (whole, decimal, fraction diameters; exact in π) |
| c-from-r | cFromR (exact; calculator with estimate) |
| a-from-r | aFromR (whole, fraction radii, calculator) |
| a-from-d | aFromD (even, odd → fraction radius, calculator; radius written first) |
| approx-pi | approx (3.14, 22/7, π key, = vs ≈, round only at the end) |
| choose-c-or-a | chooseMeasure (around or inside, r or d, exact or 3.14), lengthOrArea |
| sector-rearrangement | wedgeRead (the top is πr, same area, not exactly a rectangle; 8/16/32 wedges) |
| derive-area | deriveArea (r → area via the rectangle, the missing step ½ · 2πr · r, examples are no proof) |
| scale-c | scaleC (values, factor) |
| scale-a | scaleA (values, factor; the quad) |
| scale-fractional | scaleFrac (½, ⅓, 3/2, 1.5, 1, ⅔: both factors, area factor) |
| proportional-contrast | propCheck (table: which is proportional, C ÷ r = 2π, A ÷ r changes, other pairs) |
| context-compare | claimJudge (edging vs cover claims, ×2 / ×3 / ×½; how many small pizzas) |
| area-factor-to-length | areaBack (×4, 9, 16, 25, ¼, ⅑, 9/4 → radius factor) |
| reverse-c | reverseC (exact, 3.14, calculator; d or r) |
| reverse-a | reverseA (exact, 3.14) — the topic's optional extension |
