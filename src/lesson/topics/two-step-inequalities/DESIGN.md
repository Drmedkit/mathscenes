# Two-step inequalities (secondary.two-step-inequalities, grade 7, 7.EE.B.4.b)

**Concept.** A two-step inequality is solved like its related equation (undo the last step first), but the answer
is a whole SET: a boundary (from the related equation) plus one side of it. Doing the same move to both sides moves
every number on the line: adding or subtracting slides them (the order stays), × or ÷ by a positive scales them (the
order stays), × or ÷ by a NEGATIVE mirrors them through 0 (the order turns). So the symbol turns for exactly one
reason, never because a negative number shows up, and test values on each side and at the boundary confirm the set.

**Model: StepLines** (`StepLines.ts`, maths in `ineqMaths.ts`, practice pictures in `pictures.ts`). Up to three
stacked number lines, one per line of the solving chain: the values of the expression (50 − 6h), the values after
the first undo (−6h), and x itself. Each line carries its set (a boundary dot, open or filled, and a painted ray);
between two lines the move draws an arrow from every sample value to where it lands. The arrows run side by side for
± and for positive scaling and CROSS for a negative factor, and the ray turns around with them. `compute()` asserts
it: images inside the next window, the order of every sample pair kept or reversed by the sign of the factor, the
boundary mapped onto the next boundary, the ray reversed iff the factor is negative, test marks agreeing with the set.
A picture with a wrong flip cannot be built (tested). Numbers are written only where they matter (the samples, the
boundary in amber, the test values in lavender), under the axis; arrows leave under the numbers and land on the next
axis from above, captions sit above-left and are checked against the arrows and the test marks. Colour roles: teal =
the variable expression and its set, amber = the bound / boundary, lime = the solution set, lavender = the moves and
test values, red = wrong (Jordan's ray). `Freezer.ts`: the painted freezer of parts 1–2 (fades when the other lines
come up). Board: the chain aligned on the inequality symbol, each row at the height of its number line, the move
under both sides between them, the turned symbol ringed in lavender, the test rows (substitution) last. One leader:
the answer's number → the tip of the lime ray (only for a ray pointing right, so it never crosses a line); the
boundary dots get pulses instead. A slightly wider slate than the runtime board (the test rows need it).

## The five parts
1. **The question**: a freezer at 50 °F cools 6 °F an hour; colder than 8 °F? 50 − 6h < 8. Cards h < 7
   (no-reversal-for-negative), h > 7, h = 7 (boundary-only-solution) + how sure. The painted freezer and the
   temperature line with its open dot at 8.
2. **Worked example**, four subgoal steps: Read it (the change and hours lines come up, the set pulses) → Undo the
   + 50 (− 50 under both sides, the arrows slide straight down, −6h < −42) → Undo the × (−6) (÷ (−6), the arrows
   cross, the ray turns, h > 7, the symbol ringed) → Test both sides (h = 9 ✓, h = 5 ✗ on the line and the board).
   Why did < turn into >? mirror (right) / "a minus sign" (reverses-for-any-negative-sign) / "subtracting turns it"
   (reverses-after-addition-or-subtraction).
3. **Your turn** −3x + 4 ≤ 19, faded from the end: read + undo the + 4 are given; the kid types where 15 lands under
   ÷ (−3) (5 = divide-by-coefficient-without-sign), the arrows cross, the kid picks the set (x ≤ −5 = no-reversal,
   x > −5 = reversal-flips-inclusion, x = −5 = boundary-only), then tests x = −7 (types 25; 25 ≤ 19 is false).
   Callback to the part-1 card.
4. **Prove it**: Jordan solves 2x − 5 > −11 and writes x < −3 "because the numbers are negative" (his dashed ray on
   the x line). Because-chain: + 5 keeps the order (arrows parallel) / ÷ 2 keeps it (no crossing, the lime ray x > −3)
   / x = −5 is in Jordan's set but gives −15, not > −11 (test marks; his ray turns red and his line is struck, only
   after the evidence). Distractor chips: reverses-for-any-negative-sign, reverses-after-addition-or-subtraction,
   boundary-only-solution, one-test-proves-inequality-set.
5. **Practice**: every sub-goal in topic order, then mixed (runtime/practice.ts). Solve items draw the three lines
   (only the first set shown; a miss plays both moves, the turning arrows, the set and the tests); order items draw
   two lines and play the arrows; set items draw one line with someone's proposed set and play the true set + tests.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| ineq-solution-set | pickSet (which mini graph: dot, side; endpoint-style, strict-includes-boundary, boundary-only), testPoint (boundary, inside, outside) |
| order-preserve-translation | shift (a < b, add a signed number; numbers or letters), solveShift (x + q < r, signed q, either side) |
| order-preserve-positive-scaling | scale (× 2…5, × ½ ⅓ ⅔ ¾ 0.25, ÷ 2…5; proper-fraction-scaling, reverses-for-positive-division) |
| reverse-by-minus-one | mirror (× (−1): both positive, both negative, across 0), keepOrFlip (which move turns it?) |
| reverse-any-negative | negScale (× −3, −½, −⅔; reversal-limited-to-special-case), keepOrFlip |
| reverse-negative-division | divNeg (÷ negative; positive divisor with a negative side), keepOrFlip |
| solve-ineq-positive | solve (px + q, q + px, r < px + q, p(x ± q), fractions, decimals), firstMove |
| solve-ineq-negative | solve (5 − 2x > 11, 11 < 5 − 2x, −½x − 1 < 3, −2(x − 1.5) ≤ 7…), revWhen, firstMove |
| audit-solution-set | audit (a proposed set + one agreeing test: right / ray / dot), testPoint (either sign of p) |
| justify-reversal-general | proofStep (a + (−a − b) with numbers, then letters), proofWhy (proof vs examples vs the rule) |
| inequality-context | writeIneq (at most / at least / more / less; plumber, rental, savings, sales, elevator, °F/°C), contextSolve (domain: hours ≥ 0, negative °C allowed) |
| discrete-domain | wholeCount (fewest / most whole count; round in the right direction), domainFor |
| choose-equation-or-inequality | chooseModel (exact vs bound, one- vs two-step, strict vs inclusive, equal groups, an extra number) |
| inequality-to-context | storyFor (which story fits; strictness, "exactly", swapped roles), domainFor (whole tickets vs hours) |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table, checked against
misconceptions.json in the test). No runtime change was needed; `ts()` (a tr.set that schedules one more frame) is a
local helper in the page, as in multiply-divide-rational-numbers. The walk switches off Vite's HMR socket.
