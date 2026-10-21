# Square roots of perfect squares (grade 8, 8.EE.A.2 / 8.NS.A.2)

Topic `primary.numbers.square-roots-of-perfect-squares`, slug `perfect-squares`.

## Concept
√A is the side of a square whose area is A: the number that, times itself, gives A back. It is checked by squaring,
it can be 0 and is never negative, and it is not "half of A". A number that is not a perfect square fills a k × k
square with tiles left over, so its root lies between k and k + 1.

## Model
- `TileSquare.ts`: n unit tiles (amber = the area) laid out as a square of side k (lime = the side / the root).
  Steps `slab` (only the area known), `tiles` (row by row), `area`, `morph` (a rectangle of tiles slides into the square
  layout: 16 = 2 × 8 = 4 × 4), `side` (bracket + label, or "side = ?" until `reveal`), `count` (the top-edge tiles ringed
  one by one), `rows` (a teal sweep: k rows of k), `extra` (tiles past k × k, lavender), `ghost` (a dashed square: the
  next square for a non-square, or a claimed side that is wrong, in red with its tile count). `computeTiles` asserts
  k² ≤ n < (k+1)² and that every tile has one place; layout throws when tiles get under 36 px.
- `RootLine.ts`: a number line 0..15 of side lengths. `axis`, `squares` (k² and (k+1)² in amber under k and k+1),
  `bracket` (lime band k..k+1 and √n over it), `near` (ring on the nearer whole number, by comparing n − k² with
  (k+1)² − n; asserted never to tie). No point is placed inside the interval (the topic stops at integer bounds).

Colour roles: amber (`first`) = area / radicand, lime (`link`) = side / root value, teal (`second`) = rows while
checking, lavender (`pick`) = leftover tiles, red (`wrong`) = a wrong claimed side.

## The five parts
1. **The question**: a square patio of 64 sq ft (a slab, "side = ?"). Cards 32 ft (half: root-as-dividing-by-index),
   8 ft, 16 ft (area shared by 4 sides: confuses-area-with-perimeter) + how sure.
2. **Worked example** (64 sq ft): Tile it → Count along one side (top tiles ringed, "side = 8 ft" with a leader to the
   side label) → Check by squaring (row sweep, 8 × 8 = 64, rows and area labels pulse) → Write it as a square root
   (√64 = 8, area and side pulse). Why is the side 8 ft? 8 rows of 8 / halving three times (64 → 32 → 16 → 8, lucky) /
   the 4 sides add up to 64.
3. **Your turn** (144 sq ft), faded from the end: tiles given; the kid types the side (72 → halving, 36 → perimeter),
   types 12 × 12 (24 → base-times-exponent), and taps √[144] = [12] from chips 144, 12, 72 (swap → swaps-radicand,
   72 → halving). Callback to the card picked in part 1.
4. **Prove it**: Sam: √4 = 2 = 4 ÷ 2, so "a square root is dividing by 2". Judge, then a because-chain:
   (1) for 4 they agree, because 2 × 2 = 4; (2) for 16 they don't, because 4 × 4 = 16 while a side of 8 needs 64 tiles
   (the 4 × 4 square with a red dashed 8 × 8 ghost); (3) so the rule is not always true, because one counterexample is
   enough. Distractor chips: different-rules-differ-everywhere, examples-as-proof. Sam's line is struck at the end.
5. **Practice**: all 13 sub-goals in order (runtime/practice.ts), then mixed. Pictures: tile squares (shown first for
   area/side/rectangle items, after a miss for recall items), the number line for bounds and nearer.

## Sub-goal → families
| sub-goal | families |
|---|---|
| perfect-square-as-area | squareOf (picture: how many unit squares), arrangement (rectangle of tiles → morph) |
| side-from-area | sideFromArea (tiled or slab), sideUnits (k ft / k sq ft / half or quarter) |
| radical-notation | translate (picture ↔ k × k = A ↔ √A = k, read aloud, name radicand/value), evalRoot |
| zero-and-nonnegative | zeroRoot (√0, √0 vs √1, "0 or more", k vs "k or −k") |
| evaluate-roots-to-100 | evalRoot (0..100), checkRoot (someone's root, check by squaring) |
| evaluate-roots-to-225 | squareOf (11²..15² by multiplying), evalRoot, whichSquare (multiples of 11), checkRoot |
| perfect-square-test | isSquare (yes/no with the reason), whichSquare (even near misses) |
| consecutive-squares-around-n | between (□ < n < □; tiles with leftover and the next square) |
| bound-root-between-integers | boundRoot (□ < √n < □; number line) |
| nearer-integer | nearer (distances to the squares; midpoint, tens digit, "exactly" distractors) |
| sqrt-vs-halving | halving (check a halving claim; k² vs 2k; which is bigger) |
| coincidence-counterexample | counterexample (always/sometimes/never; pick the counterexample; √(A+B) vs √A + √B) |
| apply-side-from-area | context (patios, rooms, quilts, stickers…, US units first, then cm², m²), sideUnits |

Not diagnosable with tap/typed whole numbers, so not classified: `mc.exponents-roots.root-by-linear-interpolation`
(needs decimal estimates, which the topic leaves to secondary-t5-28).
