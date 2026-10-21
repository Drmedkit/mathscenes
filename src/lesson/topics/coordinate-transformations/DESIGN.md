# Transformations in the coordinate plane: reflect and translate (grade 8) — design

Topic `primary.geometry.coordinate-plane-transformations`, slug `coordinate-transformations`, 21 sub-goals
(8.G.A.1, 8.G.A.3; two extension sub-goals). The neighbours `reflections`, `rotations` and `rigid-transformations` are
about the moves themselves; this lesson is about **the rule for the coordinates of the image**.

## Concept
ONE rule moves every point, and **the direction of the move decides which coordinate changes**: left / right changes
x, up / down changes y. A fold across the y-axis moves points sideways, so x becomes its opposite and y stays:
(x, y) → (−x, y); across the x-axis (x, y) → (x, −y); a slide 5 right and 4 down is (x, y) → (x + 5, y − 4). The image
of a figure is that rule applied to every vertex, each prime tied to its own letter.

## Model: `CoordGrid.ts` (maths in `coordMaths.ts`)
A four-quadrant grid card: crisp grid lines, axes, the numbers in the left / bottom margin (never on a line), axis
names outside. Figures are washes with a crisp outline and dots; letters (50 px) sit on plates, placed clear of every
edge, arrow, dot and letter, and nearer their own dot than any other.
- compute (`coordMaths.ts`): `apply(move, point)` for slides, axis reflections, mirrors x = k / y = k and two non-rigid
  rules; `partway` (the animation: a straight slide, a fold that closes and opens); lengths, angles, orientation,
  collinear, parallel; `movesFitting` (every translation / axis reflection that fits EVERY pair); rule text and TeX.
- layout checks: every point inside the window, a grid square ≥ 34 px, tick numbers 60 px every 1, 2 or 5 squares,
  no room for a letter → `BlockError` (the page then shows the item on a big slate).
- steps: `grid pre mirror move arrows a<i> d<i> img wrong extra`; `move` is a lavender tracing-paper copy that
  slides / folds onto the image; `arrows` are L-shaped legs for a slide (numbers +5 / −4 on the legs) or the
  perpendicular through the mirror with a right-angle mark and equal-distance ticks (numbers 3 | 3).
- roles: first (amber) = preimage; second (teal) = the move (legs, mirror line); link (lime) = the image / answer;
  pick (lavender) = focus, the tracing paper, a not-yet-judged proposal; wrong (red) = a wrong image.
- focus: rings on vertices, leg numbers, a lit grid line (x = 4 stays), angle arcs, order arrows (orientation), lit
  sides, dimmed figures, a strike over a wrong point.
- `where`: grid, vertices, letters, legs, the mirror.
The board is a wider slate than the runtime default (760 px) so a mapping such as K(4, −3) → K′(−4, −3) fits on one
line at ≥ 60 px; no leader lines (across the grid they crossed the figures), the image point rings as its line writes.

## The five parts
1. **The question** — a sprite's tip A(−2, 3) slides 5 right and 4 down: A′ = ? Cards (3, −1) / (−6, 8)
   (translation-shift-to-wrong-coordinate) / (−7, −1) (add-magnitudes-mixed-signs); how sure.
2. **Worked example** — the whole sprite A(−2, 3), B(1, 4), C(−1, 1): Move it (the tracing paper slides) → Follow one
   point (A's legs +5 then −4; x: −2 + 5 = 3, y: 3 − 4 = −1) → Every vertex (B′(6, 0) on the x-axis, C′(4, −3)) →
   Write the rule (x + 5, y − 4). Why does "5 right" change only x? *across, height stays* / *every move changes both*
   (shift-to-both) / *right makes x positive* (left-move-forces-negative-coordinate).
3. **Your turn** — a logo D(−5, 1), E(−1, 3), F(−3, −2) mirrored across the y-axis, faded from the end: the fold and
   D′ are given; the kid types F′ (pair input; (−3, 2) named-coordinate, (3, 2) both, (−3, −2) minus-sign-means-
   negative) and builds (x, y) → (−x, y) from the chips x, −x, y, −y. Callback to the part-1 card (+ "you were
   certain").
4. **Prove it** — Jordan: K(4, −3) across the x-axis is K′(−4, −3) "because it's the x-axis". Judge, then a
   because-chain: the fold is vertical (perpendicular) / so x stays 4 / 3 below → 3 above, K′(4, 3). Distractor chips:
   *x-axis, so x changes sign* (reflect-negates-named-coordinate), *both signs change* (reflect-negates-both). The
   picture backs each line (mirror + perpendicular, the line x = 4, the distances 3 | 3 and K′), then Jordan's point and
   his board line are struck.
5. **Practice** — every sub-goal in order, then mixed (runtime/practice.ts); 33 families.

Every line in parts 1–4 is voiced (`script.ts` → `voice/lines.json`); every card, chip and input is logged with its
misconception id.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| translation-uniform-slide | isSlide, slideVector |
| translation-coordinate-effect | moveOne, whichChanges |
| reflect-point-across-axis | reflectPlot, fixedPoint |
| x-axis-reflection-rule | reflectCalc, axisRule |
| y-axis-reflection-rule | reflectCalc, axisRule |
| prime-labels | matchPrime, primeMeaning |
| coordinate-rule-notation | writeRule, ruleMeaning, readRule |
| translate-point-by-rule | translateCalc, signedStep |
| mixed-point-transformations | mixedPoint |
| transform-polygon | polygonVertex, polygonCheck |
| identify-transformation-from-pairs | nameMove |
| verify-straightness | straightImage |
| verify-segment-length | sideLength, lengthKept |
| verify-angle-measure | angleImage, angleKept |
| verify-parallelism | parallelKept |
| orientation-reversal | orientation |
| check-proposed-image | checkImage |
| apply-in-context | contextMove, contextCheck |
| rational-coordinates | rationalPoint, rationalChoice |
| reflect-non-axis-line (extension) | reflectLine |
| non-rigid-non-examples (extension) | rigidOrNot |

All 39 catalogue misconceptions of the topic are reachable in practice (the test checks it). After a miss the picture
solves itself (tracing paper, legs with their numbers, the image), the hero line writes on the board, then a twin.
Bare items (reflect / slide by calculating, signed steps) start on a wide slate; the solution builds the grid.
