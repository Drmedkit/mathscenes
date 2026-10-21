# Translations, reflections, and rotations (`rigid-transformations`)

Topic `secondary-t5-34-transformations-translations-reflections-rotations` (grade 8; 8.G.A.1–3, TX 8.10A–C,
FL MA.8.GR.2.1/2.3), 24 sub-goals.

## Concept
A rigid motion is ONE move applied the same way to every point. You decide which one (and its parameters) from
corresponding points: a translation moves every point the same distance in the same direction; a reflection keeps
the points of one line fixed and that line cuts every point–image segment in half at a right angle; a rotation keeps
one center fixed and turns every other point the same directed angle at the same distance. The vertex order is a
quick test (kept: slide or turn; reversed: flip), never the whole proof. Because every distance and angle is kept,
lines stay lines, parallels stay parallel, and image measures are known without measuring; one broken length is
enough to show a map is not rigid. On the coordinate plane the moves have rules: (x + a, y + b), (x, −y), (−x, y),
(−x, −y), (−y, x), (y, −x).

## Model: `MotionGrid` (MotionGrid.ts, maths in motionMaths.ts)
- `motionMaths.ts`: `Motion` = T (a, b) | R (center, deg, ccw +) | M (mirror through p, q) | S (non-rigid stretch);
  `apply` exact for quarter turns and axis-parallel / 45° mirrors; `at` = the point part-way through the motion (the
  slide, the turn, the fold of a flip); `identify(P, Q)` recovers the single rigid motion from corresponding points
  (or null); `orient`, `angleAt`, `keepsDistances`, `collinear`, `parallel`.
- `MotionGrid`: a coordinate grid (crisp lines, numbers in the margin, never on a line) squared up around the
  picture (8–18 units; throws when a square would be < 42 px). Figures: wash + crisp outline + vertex dots. Letters
  (50 px, dark halo) are placed around their vertex clear of every edge, mirror, arrow, link, axis, letter and dot
  (`clashes` counts the ones that could not be; tests require ≥ 90 % clean pictures).
- Steps: `grid`, `f<i>` (draw on, then wash), `n<i>` letters, `mirror` (+ its name on a paper pad), `center`, `arrow`,
  `turn` (an arc arrow; `r: 1` = the point's own path), `d<i>` candidate dots, `l<i>` dashed point→image links,
  `ghost` + `move` (the tracing paper: a lavender copy carried along the motion onto the image).
- Focus: round order arrows inside figures (follow the vertex order), side glows, vertex rings, angle arcs, right-angle
  marks, rays from the center, dimmed figures, faded links.
- Colours: first (amber) = preimage; second (teal) = the motion (mirror, center, arrow, turn); link (lime) = image /
  answer; pick (lavender) = links, candidates, tracing paper, focus marks; wrong (red) = wrong.
- The page uses its own wide board (x 1060–1860, line fitting ≥ 56 px, leaders leaving at its edge) because the grid
  only needs the left 1000 px and coordinates such as A′(−1, −1) need room. (Local to the page; the runtime is
  unchanged.)

## The five parts
1. **The question**: a puzzle tile ABC → A′B′C′ (a half turn about O that looks upside down). Turn / Flip
   (`rotation-and-reflection-confused`) / Slide (`calls-any-move-a-translation`) + how sure.
2. **Worked example** (same tile): Match the points (dashed links A→A′…) → Compare the order (round arrows, both
   counterclockwise: kept, not a flip) → Find what stays fixed (O halves every link; the tracing paper turns 180°
   about O onto the image) → Write the rule (A(1, 1) → A′(−1, −1) with a leader, (x, y) → (−x, −y)). Why "a turn,
   not a flip?": order kept / upside down means flip (`rotation-and-reflection-confused`) / like a slide
   (`calls-any-move-a-translation`).
3. **Your turn**: a new tile under 90° ccw about O, faded from the end: match + order given; the kid names the motion
   (cw: `reverses-rotation-direction`, y-axis flip: `rotation-and-reflection-confused`), picks the rule ((y, x):
   `coordinate-swap-as-motion-rule`, (y, −x): reversed), uses it on D(4, −3) (typed pair; swap / reversed / flip
   answers tagged), and says how long A′B′ is (`rigid-image-measures-require-new-measurement`,
   `equal-distance-means-same-displacement`). Callback to the part-1 card.
4. **Prove it**: Maya: "(x, y) → (2x, −y) flips the triangle, so it is rigid: the right angle is kept." Judge, then
   a 3-line because-chain from 6 chips (distractors: `partial-measure-agreement-proves-rigid-mapping`,
   `size-change-confused-with-rigid-motion`, `calls-any-move-a-translation`). Evidence: B′ ringed with a leader,
   AB (amber) and A′B′ (red) glow, "rigid" struck.
5. **Practice**: all 24 sub-goals in order (runtime/practice.ts), then mixed. After a miss the picture solves itself
   (the tracing paper moves, hidden images / links / turn arcs / order arrows appear) and the board writes the work.

## Sub-goal → family
| # | sub-goal | family | input | main misconceptions |
|---|---|---|---|---|
| 1 | correspondence | match | choice (numbered corners) | matches-parts-by-position-or-letters |
| 2 | recog-translation | nameT | choice | calls-any-move-a-translation, translation-measured-as-gap |
| 3 | recog-reflection | isMirror | choice | reflection-one-condition-only (glide), reflects-not-perpendicular-to-line, reflection-as-slide |
| 4 | recog-rotation | nameR | choice | reverses-rotation-direction, rotates-about-wrong-center |
| 5 | orientation-test | order | choice | rotation-and-reflection-confused, preserved-orientation-proves-translation, calls-any-move-a-translation |
| 6 | nonuniqueness | howMany | choice | end-image-determines-one-motion, ignores-vertex-labels-when-matching-images |
| 7 | translate-grid | slide | pair / choice | diagonal-square-as-unit-length |
| 8 | reflect-grid-line | flipGrid | pair | reflection-distance-taken-from-figure-edge, axis-rule-for-other-lines-or-centers |
| 9 | rotate-tracing | turnGrid | pair | reverses-rotation-direction, rotates-about-wrong-center, coordinate-swap-as-motion-rule |
| 10 | reflect-slanted-line | flipDiag | pair | reflects-not-perpendicular-to-line, axis-rule-for-other-lines-or-centers |
| 11 | rotate-any-angle | turnAngle | choice (candidate points) | reverses-rotation-direction, rotation-ignores-distance-to-center, rotation-angle-measured-at-vertex |
| 12 | whole-figure | whole | pair | transforms-one-anchor-sketches-rest, translation-vertices-move-differently |
| 13 | verify-lines | straight | choice (candidate points) | segment-image-may-bend, matches-parts-by-position-or-letters |
| 14 | verify-distance | keepLen | choice | verifies-lengths-of-noncorresponding-parts, equal-distance-means-same-displacement |
| 15 | verify-angle | keepAngle | num / choice | measures-change-when-figure-faces-another-way, angle-size-from-arm-length |
| 16 | verify-parallel | keepPar | choice | direction-change-destroys-parallelism |
| 17 | coord-translate | ruleT | pair (forward, and find a, b) | translation-shift-to-wrong-coordinate, add-magnitudes-mixed-signs |
| 18 | coord-reflect-axes | ruleAx | pair | reflect-negates-named-coordinate, coordinate-swap-as-motion-rule |
| 19 | coord-reflect-parallel | ruleLine | pair | axis-rule-for-other-lines-or-centers, reflect-negates-named-coordinate |
| 20 | coord-rotate-180 | rule180 | pair / choice | coordinate-swap-as-motion-rule, opposite-turn-directions-never-match |
| 21 | coord-rotate-90 | rule90 | pair (90, 270, 360, off-origin center) | coordinate-swap-as-motion-rule, reverses-rotation-direction, full-turn-changes-position, axis-rule-for-other-lines-or-centers |
| 22 | predict-measures | predict | num / choice | verifies-lengths-of-noncorresponding-parts, measures-change-…, rigid-image-measures-require-new-measurement |
| 23 | reject-nonrigid | rigid | choice | partial-measure-agreement-proves-rigid-mapping, size-change-confused-with-rigid-motion |
| 24 | evidence-vs-proof | proof | choice | examples-as-proof |
