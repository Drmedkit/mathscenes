# Congruence via transformations (`congruence`)

Topic `secondary-t5-35-congruence-via-transformations` (grade 8; 8.G.A.2, HSG-CO.A.2/B.6), 18 sub-goals.

## Concept
Two figures are congruent exactly when a sequence of slides, turns and flips carries one onto the other, every
vertex onto its partner. Looking alike is not enough (a near miss), facing another way is fine (turned / flipped
copies), and one or two matched corners prove nothing. To rule congruence OUT, name what no move can change: a side
length or an angle with no partner. A dilation with k ≠ 1 changes lengths, so it is not rigid and nothing rigid can
undo it; k = 1 is the identity.

## Model
**Tracing paper on a coordinate plane** (`TraceBoard.ts`, maths in `congMaths.ts`). The plane is crisp (grid,
axes, numbers in the margin), figures are washes with one outline, and a clear sheet carries a copy of the figure
through the sequence (slide glides, turn sweeps about a teal pin, flip folds over a teal dashed line); finished
steps stay as dashed ghosts; the landed tracing turns lime and rings every target corner. `checkCongruence` asserts
rigid steps + every vertex on its partner; `picFits` refuses pictures the canvas cannot draw. Labels are placed
around their corner clear of edges, lines and other labels. Roles: amber = the figure we start from, lavender = the
figure we try to reach / candidates, teal = the moves, lime = landed / answer, red = mismatch or overhang.
The page draws its own wide board (x 1070-1860) and its own leaders from it (local helper, runtime unchanged).

## The five parts
1. **The question**: floor tiles from template ABC. Tile 1 looks alike (long side 5, not 4), tile 2 is the
   template flipped and slid. Cards Tile 1 (`turned-or-flipped-copy-not-congruent`) / Tile 2 / Both
   (`visual-resemblance-proves-congruence`) + how sure.
2. **Worked example**: Match the corners (right angle, 4 and 3 sides) → Flip (order arrows: ccw vs cw; tracing folds
   over the y-axis; A′(6, 2) with a leader) → Slide (arrow A′ → D; A″(6, −4) = D with a leader) → Check every corner
   (rings on D, E, F; hero △ABC ≅ △DEF). Why? right / looks alike (`visual-resemblance…`) / A landed on D
   (`partial-match-as-whole-mapping`).
3. **Your turn**: a new pair, faded from the end. Matching and the 90° turn about O are given (A′ ring instead of a
   long leader), the kid types the slide rule (x + 2, y − 5); (0, −5) = counted from A (`applies-sequence-steps-to-
   original`, a red arrow A → D shows it). Then the check: all three corners / two corners
   (`two-matched-vertices-force-triangle-coincidence`) / one corner (`partial-match…`). Callback to the part-1 card.
4. **Prove it**: Jordan: "6 by 2 and 4 by 3 both cover 12 squares, so they are congruent." Judge, then a because-chain
   (moves keep lengths / P has a 6, Q has none / every sequence would need a 6-unit partner) from 5 chips;
   distractors `equal-area-or-perimeter-proves-congruence`, `failed-search-proves-impossible`. Evidence: the tracing
   turns keeping 6 and 2; side lengths with the 6s glowing; the tracing laid on Q two ways, the overhang red; then
   Jordan's ≅ is struck.
5. **Practice**: all 18 sub-goals in order, then mixed (runtime). After a miss the tracing replays the sequence.
   Review aid: `congruence.html?open&part=4&item=<family>:<subgoal>:<seed>&solve`; `node tools/walk-congruence.mjs
   gallery` screenshots every family.

## Sub-goal → family
| # | sub-goal | family | main misconceptions |
|---|---|---|---|
| 1 | congruence-definition | cover (panels / yes-no, near miss) | visual-resemblance, turned-or-flipped |
| 2 | correspondence | partner (corner, side, statement) | matches-by-position-or-letters, statement-vertex-order |
| 3 | rule-out-by-invariant | invariant (area / perimeter rectangles, square vs rhombus, mislabeled pair) | equal-area-or-perimeter, failed-search |
| 4 | vertex-orientation | orient | rotation-or-dilation-reverses-orientation |
| 5 | motion-type-by-orientation | whichMove | parallel-sides-prove-translation, rotation-and-reflection-confused |
| 6 | specify-single-motion | specify (rule choice / slide pair) | reflect-negates-named-coordinate, rotates-about-wrong-center, names-motion-without-parameters |
| 7 | execute-given-sequence | sequence (pair) | applies-sequence-steps-to-original |
| 8 | order-dependence | order | order-always / never-matters |
| 9 | verify-whole-figure | verify | partial-match, ignores-vertex-labels |
| 10 | plan-sequence | plan | sequence-must-have-one-step, applies-sequence-steps-to-original |
| 11 | fix-mirror-placement | finish | two-matched-vertices-force-triangle-coincidence |
| 12 | equivalent-sequences | twoWays | end-image-determines-one-motion |
| 13 | reverse-sequence | undo | undoes-sequence-wrongly, return-reverses-order-only, undoes-by-repeating |
| 14 | dilation-not-rigid | dilate (num / choice) | size-change-confused, equal-angles, calls-any-move-a-translation |
| 15 | identity-dilation | identity | dilation-and-rigid-motion-disjoint |
| 16 | transformation-properties-table | table (row / shape / general) | rotation-or-dilation-reverses-orientation, preserved-orientation-proves-congruence, size-changes-shape |
| 17 | rule-length-test | rule | examples-as-proof, stretched-copy-is-enlargement, coordinate-sign-change-means-nonrigid |
| 18 | justify-congruence-claim | justify (resized, enlarged, tiles, stencil, k = 1) | rigid-motion-can-undo-resizing, omits-invariant-obstruction, failed-search |
