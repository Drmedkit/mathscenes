# Scale drawings (secondary-t5-20-scale-drawings-and-geometric-constructions, grade 7)

## Concept
A scale drawing multiplies EVERY length by the same factor and keeps every angle. The legend ("1 in represents
4 ft") says what one drawing unit stands for; written in one unit it is the scale factor (1 in : 48 in = 1 : 48).
Drawing to real: multiply by the real length per drawing unit; real to drawing: divide. A unit-fraction legend
(1/4 in : 1 ft) is rewritten as a whole-inch one (1 in : 4 ft). Areas grow by the factor squared, because both the
length and the width grow. Stage 3: audit a drawing (every side ratio AND every angle), choose a scale that fits
both page dimensions, and chain a scale result into a cost.

## Model: `PlanSheet` (PlanSheet.ts, maths in scaleMaths.ts)
A blueprint sheet with a 1 in / 1 cm grid; the drawn figures (wash + crisp outline) with side labels OUTSIDE each
side on a paper pad (no grid line through a digit); the legend tag above the sheet (drawing part amber, real part
teal); a ruler under the sheet, to scale with the drawing (zero inset from its edge, quarter-inch / half-cm ticks),
whose second row gives the real length under every inch: the legend made visible (0, 4, 8, 12, 16 ft).
- Steps: `legend sheet figs labels marks names ruler seg actual labels2 zoom` (+ a figure's own key, e.g. `shed`);
  `labels2` crossfades a side's drawing length into its real length (per-side keys, so walls turn one at a time).
- Focus: a glowing side, a lit figure, dashed projection lines from a side down to the ruler.
- `zoom`: one grid square blown up into k x k squares (the area proof).
- `where`: sheet, legend, fig(i), side(i, s), label / label2(i, s), ruler, seg, edge(x), zoom, zoomCell.
- Layout: px per unit as big as fits; margins per sheet side from the real label sizes. Throws BlockError when a
  label leaves the sheet, sits on a line or inside a figure, or two labels / captions overlap; the ruler's real row
  thins itself (every 2nd, 3rd unit) before it would crowd.
- Roles: first (amber) = drawing lengths and the drawing, second (teal) = real lengths, link (lime) = the answer,
  pick = focus (the zoomed square, angle sizes), wrong = Sam's claim struck.

## The five parts
1. **The question**: bedroom plan at 1 in : 4 ft, the long wall 3 1/2 in. Cards 14 ft / 6 1/2 ft (additive: "1 -> 4
   is +3") / 7/8 ft (divided by the rate) + how sure.
2. **Worked example** (same plan): Read the scale (ruler + real row, `1 in -> 4 ft`) -> Measure on the plan (wall
   glows, projection lines, the segment grows to 3 1/2) -> Multiply by the scale (`3 1/2 x 4 = 14 ft`, the label
   turns into 14 ft, leader) -> Every length, same scale (`2 1/2 x 4 = 10 ft`, leader, right-angle marks,
   `angles: 90 -> 90`). Why 14 and not 6 1/2: 3 reasons (right, additive, divide).
3. **Your turn** (school garden 6 cm x 4.5 cm at 1 cm : 3 m), faded from the end: scale + measurement given; the kid
   types 18 m, 13.5 m (additive / divide / plan-as-real diagnosed) and draws a 6 m shed (2 cm; x3 = wrong
   operation). Callback to the part-1 pick.
4. **Prove it**: Sam: "6 sq in at scale 4 is 24 sq ft". Judge, then a because-chain from 6 chips (3 distractors =
   area-scales-by-length-factor, drawing-length-used-as-actual, examples-as-proof). Evidence: the labels turn into
   12 ft and 8 ft, the room lights, one square inch blows up into 4 x 4 square feet, Sam's 24 is struck.
5. **Practice**: all 13 sub-goals in order (runtime/practice.ts), then mixed.

## Sub-goal -> family
| sub-goal | family | input | main misconceptions |
|---|---|---|---|
| scale-copy-factor | copy, copyLen | choice (A/B/C on grid), num | additive-keep-difference, same-name-means-similar, scales-angles, equal-ratios, scales-only-some-sides |
| scale-legend | legend, legendNum | choice, num | mixed-unit-scale-not-converted, reverses-scale-ratio-order |
| drawing-to-actual | toActual | num / mixed number | additive, divides-by-rate, drawing-length-used-as-actual, wrong-unit-on-scale-result |
| actual-to-drawing | toDrawing | num / mixed number | scale-factor-wrong-operation, reverses-scale-ratio-order |
| unit-fraction-legend | fracLegend, fracRewrite | num / mixed, choice | scale-factor-wrong-operation, reverses, mixed-unit |
| draw-computed-length | ruler | choice, num | counts-points-not-intervals, aligns-at-ruler-end-or-1 |
| make-scale-drawing | makePlan | choice, mixed number, num (angle) | scales-only-some-drawing-lengths, wrong-operation, scales-angles |
| rescale-drawing | rescale | num / mixed | drawing-length-used-as-actual, wrong-unit |
| area-from-drawing | area | num | area-scales-by-length-factor, drawing-length-used-as-actual |
| check-scale-drawing | audit | choice | checks-one-side-ratio, equal-ratios-make-polygons-similar |
| choose-scale | fit | choice, num | scale-fits-one-dimension |
| area-factor-justify | areaWhy | num, choice | area-scales-by-length-factor, examples-as-proof |
| scale-context-application | cost | num ($) | drawing-length-used-as-actual, area-scales-by-length-factor |
