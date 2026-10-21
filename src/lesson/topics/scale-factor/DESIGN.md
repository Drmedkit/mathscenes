# Scale factor (scaled copies) — design

Topic `primary.geometry.enlarge-reduce-scale-factor`, grade 7 (7.G.A.1), slug `scale-factor`.

## Concept
A scaled copy multiplies **every** length of the original by the **same** number k (copy ÷ original); angles stay.
k > 1 enlarges, k = 1 keeps the size, 0 < k < 1 reduces; back from the copy is ×1/k. Adding the same amount to
every side is the tempting wrong idea (it stretches a non-square shape); the shape test for rectangles is the
diagonal ray from a shared corner.

## Model: `ScaleGrid` (`ScaleGrid.ts` draws, `scaleMaths.ts` is the pure maths + layout)
Figures on grid paper (or plain labeled figures, drawn to scale): wash + crisp outline, corners on grid points.
Side labels outside each side (60 px TeX, a paper-coloured pad erases grid lines behind them), vertex letters,
angle marks (right-angle squares, arcs with a degree label), captions, dashed moves (right 3, up 2), a diagonal
ray, a hop arrow ×k, dots and free marks ('?'). A label can turn into its answer (`f<i>a<j>`). Figures can slide.
Roles: original = first (amber), copy = second (teal), k / the answer = link (lime), focus = pick, distorted =
wrong. `picMaths` asserts that a figure declared as a ×k copy is one (every side ×k, every angle kept) and that
every numeric label equals the drawn length (except a deliberate `liar` candidate); `layoutPic` throws on a label
outside the frame, on a line, or over another label. Every practice picture and the four lesson pictures pass
both checks in the tests.

## The five parts
1. **The question** — a 3 × 2 sticker, Jamie's copy is 6 wide: how tall? Cards 5 (+3, additive), 4, 2 (only the
   width changes); how sure. Board: `width: 3 → 6`, `height: 2 → ?`.
2. **Worked example** (same sticker) — Match (bottom ↔ bottom glow + label pulses) → Find k (hop ×2, `k = 6 ÷ 3 = 2`,
   leader to the hop) → Multiply (the copy draws, `height: 2 × 2 = 4`, leader to its 4) → Check (the sticker slides
   onto the copy's corner, right-angle marks, the ray runs through both top corners, `6/3 = 4/2 = 2`; the 6 × 5
   "+3" copy appears dashed red, its corner off the ray, `5/2 ≠ 2`). Why 4 and not 5? 3 reasons (additive,
   only-some-sides).
3. **Your turn** — an L-logo 6 × 4 reduced to 3 wide. Match given; kid types k = 1/2 (diagnoses inverted 2 and
   difference 3), the copy's left side 2 (diagnoses additive 1, unscaled 4, reversed 8), then the corners (still
   90°; distractors scales-angles, arm length). Callback to the part-1 card.
4. **Prove it** — Riley prints a 6 × 4 photo at 10 × 8 ("+4 to both sides"). Judge, then a 4-line because-chain:
   height ×2 (8 ÷ 4) → width ×5/3 (10 ÷ 6) → not a scaled copy (one factor for every length) → 12 × 8 would be
   (6 × 2). Distractor chips: additive, looks-the-same, one-pair-is-enough. The picture: pulses, the ray misses the
   print's corner (Riley's line is struck only then), the 12 × 8 print lands on the ray. The painted sun in the
   print is an oval: the distortion is visible.
5. **Practice** — every sub-goal in topic JSON order, then mixed (runtime). Pictures are the same block in a wider
   frame; after a miss the picture solves itself (the answer label, the hidden copy, a ring) and the board writes
   the worked line.

## Sub-goal → families (`plan.ts`)
| sub-goal | families |
|---|---|
| scaled-vs-distorted | whichCopy (A/B/C on a grid: scaled, stretched one way, +n or thin arms), scaledOrNot (incl. the 2 → 4 square) |
| corresponding-parts | partner (side by endpoints with a scrambled mapping; vertex by its corner after a turn/flip) |
| name-scale-factor | nameK (k = 2, 3, 4, 5, 10) |
| predict-size-from-factor | predict (3, 3/2, 5/4, 1, 3/4, 1/2, 2/3, …) |
| angles-preserved | angle (degrees typed, or compare) |
| compute-lengths-integer | computeSide, bothSides |
| grid-segment-check | readSeg (a side, or "right a, then down b") |
| draw-grid-enlargement | drawNext (the next side of a copy being drawn), pickDrawing (one candidate has labels that lie) |
| reduce-unit-fraction | reduce (1/2, 1/3, 1/4; on grid or labeled with fraction results) |
| noninteger-factors | nonInt (3/2, 1.5, 3/4, 2/3, 2.5, 0.75), predict with decimals |
| oblique-sides-on-grid | slant (scale both moves of a slanted side; k = 2, 3, 1/2) |
| find-factor-from-pair | findK (whole, unit and non-unit fraction results) |
| missing-side | missing (photo/poster contexts, k = 2, 3, 4, 3/2, 3/4) |
| reverse-factor | reverse (the original's side, or the factor back = 1/k) |
| refute-claimed-factor | refute (one pair fails; "most sides fit" is the counterexample-as-exception distractor) |
| all-ratios-test | allRatios (6/4 = 9/6, +n, one wrong side, close-but-not-equal) |
| side-ratios-not-sufficient | angleCheck (rectangle → parallelogram, square → rhombus, triangle contrast) |
| justify-in-context | resize (photo, poster +6, screenshot ×3/2, dragged wider), fixIt |
