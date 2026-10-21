# Recognize a linear relationship (grade 8) — design

Topic `primary.patterns.recognize-linear-relationship`, slug `linear-patterns`, 19 sub-goals (8.F.A.3, 8.F.B.4-5).

## Concept
A relationship is linear when **every equal step in the input gives the same change in the output** (the same change
per 1 input unit). In a table that is a column of equal changes; on a graph it is points on **one straight line**; in
words it is "starts at __, goes up / down __ each __". One step with a different change is enough to break it.

## Model: `TableGraph.ts`
A table card and a graph card of the same pairs, side by side; the notation board on the right.
- compute: `computeTG` (exact rationals): changes, input gaps, change per unit, constant?, the start (rate held back to
  input 0), the first step that breaks. Asserts every point lies on start + rate × input when it says "constant".
- layout inside a Frame: numbers 60 px, labels 44 px, tick labels every grid line or every other one, headers checked
  against their columns, throws when rows / grid lines do not fit. Text never on a grid line (names sit on a plate).
- steps: `table xsteps changes axes points stairs units line segments ruler start points2 line2`.
- roles: first (amber) = the outputs / the start; second (teal) = the change (brackets, stairs); link (lime) = the
  straight line / the answer; wrong (red) = the step that breaks, points the ruler misses; pick = the input steps;
  `water` (blue) = a second series (Leo, the second person in a comparison).
- `where`: rows, cells, change labels, points, stairs, rises, runs, the line ends, the start — for leaders and focus.

## The five parts
1. **The question** — Maya's savings 5, 8, 11, 15, 19 (weeks 0-4). "Could it be linear?" Cards: *goes up every week*
   (illusion-of-linearity), *goes up $3 each week* (checks-only-some-given-cases), *not the same change* (right);
   how sure.
2. **Worked example** (same table) — Find the changes (+3 +3 +4 +4 brackets) → Check every step (the +4s turn red,
   "not the same every week") → Plot the points (a dashed ruler through the first points misses weeks 3 and 4; leader
   from "not linear" to the missed point) → Compare a linear plan (Leo 5, 8, 11, 14, 17 on one straight line).
   Why? *each step right goes up the same $3* / *his savings go up* / *his first two changes are +3*.
3. **Your turn** — a tank 40, 34, 28, 22, 16 gal every 2 minutes. Given: the changes (−6) and the check. Kid: change
   per 1 minute (6 → ignores-input-step), then start + change from chips (16 → first-output-as-intercept, 0 →
   linear-means-proportional, down 6 → ignores-input-step, up 3 → constant-change-must-increase), then "linear
   although it goes down?" (no → constant-change-must-increase). Callback to the part-1 pick (+ "you were certain").
4. **Prove it** — Riley's seedling 1, 3, 5, 8, 11 joined point to point: "straight pieces, so linear". Judge, then a
   because-chain: equal input steps / +2, +2 then +3 / one step is enough. Distractor chips: *made of straight
   pieces* (nonlinear-requires-smooth-curve), *goes up every day* (illusion-of-linearity). The picture backs each
   line (runs lit, red +3s, ruler misses); Riley's "linear" is struck last.
5. **Practice** — every sub-goal in order, then mixed (runtime/practice.ts).

Every line in parts 1–4 is voiced (`script.ts` → `voice/lines.json`); every card, chip and input is logged with its
misconception id.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| change-between-rows | rowChange |
| constant-or-not | couldBeLinear |
| constant-decrease-and-zero | couldBeLinear, rowChange |
| equal-steps-larger-than-one | perUnit |
| start-value | startValue |
| words-to-table | wordsToTable, tableToWords |
| table-to-graph-line | plotPoint, graphMeaning |
| change-on-graph | graphChange |
| graph-to-words | graphToWords |
| compare-two-lines | compareLines |
| discrete-vs-continuous | connectOrNot |
| growing-differences | lastChange, couldBeLinear |
| other-nonconstant | couldBeLinear, lastChange |
| curve-vs-line | onALine |
| unequal-gaps | unequalGaps, gapRate |
| classify-from-context | contextLinear |
| justify-with-changes | bestReason |
| table-could-be-linear | couldOrMust |
| far-prediction | farPredict |

After a miss the picture solves itself (changes → graph → stairs / units → line, or ruler + red misses), the hero line
writes on the board, then a twin. Words-only items start on a wide slate; the solution builds their table and graph.
