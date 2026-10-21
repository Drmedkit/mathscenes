# Rotate: quarter turn and half turn (`rotations`)

Topic `primary.geometry.rotate-quarter-half-turns` (8.G.A.1), 22 sub-goals, grades 7–8.

## Concept
A turn is fixed by three things: the **center** (the one point that stays still), the **direction** (clockwise or
counterclockwise) and the **amount** (a quarter = one of four equal parts of a full turn; a half = two quarters).
Every point of the figure turns the same amount, the same way, and keeps its distance from the center, so sides keep
their length and the marked corners A → B → C keep going the same way round. A flip reverses that order; a slide
keeps the facing direction. Two end pictures cannot tell no move from a full turn.

## Model
**A clear sheet pinned at P on dot paper** (`TurnBoard.ts`, maths in `turnMaths.ts`). The sheet carries the figure
round, so "every point keeps its distance" is something you see. A corner's steps from P (horizontal, then vertical)
turn as one rigid piece, like a pointer: right turns into down, up turns into right (clockwise). Pointers are a
spinner disc with a four-section guide, or a clock face. Exact maths: `rotQ` (integer quarter turns), `reflect`,
`checkTurn` asserts distances, side lengths and corner order; `picFits` refuses pictures the canvas cannot draw.
Colour roles: amber = the figure before; teal = the move (pin, arrow, mirror line, steps); lime = the image / answer;
lavender = a given "after" picture or a candidate; red = wrong. Candidates are numbered 1–4 so they never clash with
corner letters.

## The five parts
1. **The question** – a block-puzzle game: the L-block on a sheet pinned at P makes a quarter turn clockwise. Three
   pictures on the board: 1 turned about its own corner (`rotates-about-wrong-center`), 2 right, 3 flipped down
   (`reflection-treated-as-rotation`). How sure.
2. **Worked example** – Pin it (P glows, "¼ turn ↻ about P" with a leader) → Turn one corner (A's steps 3 right, 1 up
   swing to 1 right, 3 down; A′ with a leader) → Turn every corner (B, C strings swing; B′, C′) → Join and check (the
   whole sheet turns and lands on the dots; round arrows show the same corner order). Why: "why did C move farther than
   B?" (right / `angle-size-from-arm-length` / `calls-any-move-a-translation`).
3. **Your turn** – a triangle, a quarter turn counterclockwise. Pin and A given; the kid turns B by tapping one of
   four dots (right / clockwise `reverses-rotation-direction` / one step turned `rotates-one-step-component` / one short
   `counts-points-not-intervals`); C follows; then "what did the turn keep?" (`prototype-only-recognition`,
   `one-point-checked-for-whole-figure`). Callback to the card picked in part 1.
4. **Prove it** – Riley: "my upside-down L is a half turn". Because-chain of three claims from five chips (two
   distractors: `reflection-treated-as-rotation`, `one-point-checked-for-whole-figure`); the picture backs each line:
   a real half turn drawn as a ghost, round arrows A → B → C in both pictures, then the sheet folds over line m.
5. **Practice** – all 22 sub-goals in order, then mixed (runtime). Dots can be tapped on the canvas.

## Sub-goal → family
| # | sub-goal | families |
|---|---|---|
| 1 | full-turn-unit | watch (live full turn; same photos; live half turn) |
| 2 | quarter-turn-amount | amount (quarter, eighth, unequal sections), armLength |
| 3 | half-turn-amount | amount (half, two quarters = num) |
| 4 | direction-cw-ccw | direction (describe the arrow; which arrow is …) |
| 5 | center-fixed-point | center (pinwheel / hinge / pin off the tile, watched live) |
| 6 | describe-rotation | describe (path, endpoints only, none fits, same pictures) |
| 7–9 | execute quarter / half / predict | pointer (guide, then no guide and slanted) |
| 10 | rotate-whole-figure | figure (pin on the tile), square (still a square on its corner) |
| 11 | external-center | distance (dots / num), figure (pin off the tile) |
| 12 | predict-image | figure (on and off the tile) |
| 13 | grid-steps-locate | steps (one move, two moves, read the steps = pair) |
| 14 | rotate-point-grid | pointTurn |
| 15 | draw-image-grid | build (corner by corner), slip (spot the slip) |
| 16–18 | recognize-slide / turn-vs-slide / recognize-flip | motion |
| 19 | turn-vs-flip | order (corner order) |
| 20 | opposite-half-turns | opposite (half turns agree, quarter turns do not) |
| 21 | symmetric-multiple-motions | symmetric (H, rectangle, Z/S, square; listed moves) |
| 22 | select-justify-turn | target (every corner, not just the pinned one) |
