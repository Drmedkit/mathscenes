# Linear functions and slope-intercept form (secondary-t5-33, grade 8, 8.F.B.4)

**Concept.** A linear function in context is "start at b, change by m for every ONE unit of input": y = mx + b.
m is the change in output per one unit of input (divide by the input step when it is not 1); b is the output at
input 0 (walk back to it with the rate when the data do not show it). The equation is checked against every given
point, read with units (m in output per input unit, b and mx in output units), and used only for the inputs where the
story makes sense. Function language and modelling only: slope triangles, why slope is constant and the
similar-triangle derivation belong to the sibling topic `slope-and-lines`.

**Model: `LineModel.ts`** (maths in `lfMaths.ts`, exact rationals). A table card beside a graph card whose axes carry
quantities and units; any window (negative values, non-unit and unequal scales, windows that do not reach x = 0, in
which case the window edge is drawn as an edge, not an axis). Steps: `axes ticks table tableQ points line line2 line3
start back step read domain`. Roles: amber = b (the start ring on the output axis, the dashed walk back to input 0),
teal = m (the rate step's rise), lavender = the input step (the run), lime = the line / answers, water = a second
function, wrong = a wrong guess (a ghost point, a proportional ray from (0, 0)). No leaders: the board's coloured
m and b match the teal step and the amber start on the graph. Layout throws on dense grids, values outside the window
or colliding labels (a too-small rate step is left out instead); the practice page falls back to a big slate.

## The five parts
1. **The question**: a bike rental, 2, 4, 6 hours cost $34, $50, $66. How big is the fee? Cards $34
   (first-output-as-intercept), $18, $0 (linear-means-proportional) + how sure.
2. **Worked example** (same rental): the rate per ONE hour (the 2-hour step, 16 ÷ 2 = 8) → walk back 2 hours to
   0 (b = 34 − 8·2 = 18, ring on the cost axis) → write C = 8h + 18 with the letters defined → check the row not used
   (8·6 + 18 = 66). Why? "$34 is after 2 hours of riding" / "the fee is the first number" (first-output) / "the fee
   is what you pay each hour" (swaps-m-and-b).
3. **Your turn**, faded from the end: a phone battery 85, 65, 45 % at 5, 15, 25 min. Given: the rate (−2 per minute).
   Kid: b (95; 85 = first-output, 75 = intercept-sign-error-back-solve), the equation (B = 95t − 2 = swap,
   B = 2t + 95 = drops-slope-sign), the check at 25 min (145 = drops-slope-sign). Callback to the part-1 card.
4. **Prove it**: Jordan doubles ("2 h cost $34, so 4 h cost $68"). Judge, then a because-chain: the table says $50 /
   the $18 fee is paid once, only 8h doubles / the line meets the cost axis at 18, not (0, 0). Distractor chips:
   "every straight line is proportional" (linear-means-proportional), "it goes up every hour, so double the hours is
   double the cost" (scales-non-proportional). The graph backs each line: Jordan's ray from (0, 0) and his ghost
   point at (4, 68), the real point (4, 50) ringed, the walk back to the fee, Jordan's line struck.
5. **Practice**: every sub-goal in topic order, then mixed. LineModel pictures on most items (the test asserts more than 8 in 10), the
   worked solution replayed on the picture and written on the board after a miss; equation-only items (spot m and
   b, unit conversion) get a big slate.

## Sub-goal → families (plan.ts), 38 families
| sub-goal | families |
|---|---|
| rate-unit-steps | tableRate (steps of 1, zero rate), fasterLine (the higher line grows slower) |
| initial-value-at-zero | startTable (reordered rows with x = 0), startGraph (cross the y-axis; x-intercept distractor) |
| rate-uneven-steps | tableRate (steps 2, 5 and unequal), scaledRate |
| extrapolate-initial-value | startTable (rows from 2, 4, 6; negative b), startGraph (window without the y-axis) |
| verbal-rate-interpretation | rateSentence (direction, per one, zero rate), rateUnit |
| identify-m-b-in-equation | pickMB (constant first, subtraction, b = 0, m = 0, hidden 1), sameFunction |
| parameter-effects-on-graph | whatChanged, predictShift, fasterLine |
| write-from-description | storyToEq, storyPair (rate per 2 / 5 / 10 units) |
| slope-two-points | twoPointRate (reversed order, halves), specialSlope (flat, vertical) |
| linearity-check | isLinear (unequal steps, squares, one break), fitsRule |
| back-solve-b | backSolve (abstract and story), startGraph |
| equation-from-two-points | eqTwoPoints, eqFromTable, graphToEq |
| graph-from-points | onTheLine (incl. "only plotted points"), plotPoint |
| graph-slope-step | slopeStep (2/3, negative, m = 0), whichGraph |
| equation-from-graph | graphToEq, whichGraph |
| non-unit-scales | scaledRate, scaledRead |
| contextual-axes | chooseScale, scaledRead, dotsOrLine |
| slope-units | rateUnit (m and mx), refuteClaim (reversed unit) |
| slope-units-conversion | convertRate, rewriteEq |
| intercept-units | interceptMeaning, rateUnit (b) |
| proportional-contrast | isProportional, doubleInput |
| evidence-justification | whichEvidence, refuteClaim |
| meaningful-domain | validInputs, interceptMeaning (teen height, lake ice), dotsOrLine |
| qualified-prediction | predict, predictValid |

Every classified slip carries its catalogue id (`items.ts` MC table, checked against misconceptions.json in the test).
No runtime change was needed.
