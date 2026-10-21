# Enlarge and reduce shapes on grid paper (primary.geometry.enlarge-reduce-shapes-informal, grade 7, 7.G.A.1)

**Concept.** A scaled copy multiplies every length by the same factor (2, 3 or 1/2): on grid paper, every horizontal
and vertical move. You draw one by walking around the original from a marked start vertex and making every move k
times as far from the copy's start dot; a slanted side is two moves (a run across and a rise up or down), and both get
the factor. Adding the same amount to every side is the tempting wrong idea: it only works for a square, because then
both sides happen to be multiplied by the same factor. Scaled vs stretched is decided by the factor across vs the
factor up (and by every inner side, not only the outer width and height); angles stay, but equal angles alone do not
decide (a stretched rectangle keeps its right angles).

**Model: WalkGrid** (`WalkGrid.ts`, maths in `walkMaths.ts`). Grid paper with the original (amber), start dots
(lavender) on it and on the copy, and the copy (teal) walked out LEG BY LEG: one open figure per move, dashed run /
rise legs (with numbers) for slanted sides, the copy's wash and side labels at the end. Steps: `grid f0 f0L d0 d1`,
`leg(j)`, `rr0(j)`, `rr1(j)`, `f1`, `lab1(j)`, `ans1(j)`, `extra(i)`; `glow0/glow1` light a side. It draws with the
ScaleGrid painter of the scale-factor topic (imported read-only, same look) and asserts: both walks close, every copy
move is k x the original's, the copy is a scaled copy, plus ScaleGrid's honesty and layout checks.

**Board.** A move table beside the picture: `house | copy x2`, one row per move in arrows (`→ 2 | → 4`,
`← 1 ↑ 1 | ← 2 ↑ 2`), each row written while that side glows in the picture (no leaders: the table sits beside the
grid, colour + glow link them).

## The five parts
1. **The question**: a house icon 2 wide with walls 3; a same-shape copy is 4 wide. Walls? Cards 5 (+2, additive),
   6, 3 (only the width, scales-only-some-sides) + how sure. Board: `width: 2 → 4`, `walls: 3 → ?`.
2. **Worked example** (same house), four steps: Find the factor (two amber 2-pieces lie along the copy's base,
   `4 = 2 × 2`) → Walk the original (start dot, each side glows, its row writes; the roof as left 1 + up 1 legs) →
   Multiply every move (the copy walks leg by leg, x2, the right column fills, walls 6) → Check (the copy closes on
   its dot and fills; the "+2" house with walls 5 appears dashed red, `3 + 2 = 5 ≠ 6`). Why 6 and not 5? (right /
   additive / only-some-sides).
3. **Your turn**: a sail, x3, faded from the end: the base is walked for you (→ 3 | → 9); the kid types the slanted
   side's two steps (left 3, up 9; diagnoses one-step-only and unscaled), then the last side back to the dot
   (left 6, down 9), then compares the corners (same / bigger because longer sides = arm length / 3 times =
   scales-angles); angle marks show; callback to the part-1 card.
4. **Prove it**: Jordan: "add the same number of squares to every side: always a scaled copy". Always (additive) /
   sometimes / never (addition-never-allowed), then a because-chain: the 2 by 2 square + 2 = 4 by 4 is x2 both ways;
   the 1 by 3 strip + 1 = 2 by 4 should be 6 tall (the red strip, the dashed lime 2 by 6); so only sometimes.
   Distractor chips: additive, equal angles, one pair of sides, looks.
5. **Practice**: every sub-goal in topic order, then mixed (runtime). Pictures are ScaleGrid pictures (walk pictures
   from `walkPic`: the copy walked up to the pen dot, the side in focus lavender, a '?' where the next leg goes);
   after a miss the leg / copy / answer label draws and the board writes the worked line.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| scaled-vs-distorted-visual | whichScaled (A/B/C: scaled, stretched one way, +n; bigger and smaller), photoFit (a photo resized vs stretched to a frame) |
| correspondence | matchPart (side or corner; the copy's letters start at another corner) |
| factor-one-length | timesAsLong (factor vs difference), countLen (spaces, not points) |
| common-factor-both-directions | missingDim (incl. same-size factor 1), oneFactor (statements; area distractor) |
| additive-vs-multiplicative | addOrTimes (predict the scaled height from the known factor), addCheck (squares yes, rectangles no) |
| reduction-concept | halfOf (factor 1/2 widths and heights), halfReverse (the original from a x2 copy) |
| enlarge-rectangle-from-vertex | rectWalk (the next move), rectCorner (the far corner as right / up) |
| scale-every-side-rectilinear | walkNext (L, T, stairs: the next move), walkList (which move list draws the copy) |
| slanted-sides-run-rise | slantMove (both steps, pair input), slantHow (incl. "squares crossed" = diagonal-unit) |
| construct-reduction | halfWalk (rect, L, triangle, house; straight or slanted, all moves even) |
| classify-by-two-factors | twoFactors (equal, factor 1, 2 and 3, additive, halves), factorPair (both factors) |
| whole-figure-check | notch (outer x k, an inner side not), notchFix |
| angle-test | angleSame (scaled vs stretched triangle), rectAngles (a stretched rectangle keeps its right angles) |
| justify-and-repair-resize | repair (the right height; 2, 3 or 1/2), resizeJudge (the fix, appearance / bigger distractors) |

Every wrong answer the classifier recognises carries its catalogue id (`MC` in items.ts, checked against
misconceptions.json in the test). No runtime change needed. Reuse: `scale-factor/scaleMaths.ts` (pure) and
`scale-factor/ScaleGrid.ts` (the painter), both imported read-only.
