# Two-way tables, relative frequencies and segmented bar graphs (grade 8, 8.SP.A.4, HSS-ID.B.5)

**Concept.** A two-way table counts every case once, by two categorical variables. Every relative frequency is a
part over a WHOLE, and the question's "of the ..." phrase picks the whole: one row (row-conditional), one column
(column-conditional), or everybody (joint: one cell; marginal: one margin). The same cell gives different percents
(84 of 120 = 70%, 84 of 116 ≈ 72.4%, 84 of 200 = 42%). A segmented (100%) bar graph is the conditional table drawn:
one row (or column) becomes one full-length bar. Bars that split in different places show an association; an
association in a survey is not a cause.

**Model: the table that drops into bars.**
- `TwoWayTable.ts`: the table as one painted card; crisp grid lines; totals in amber (each total is a possible whole);
  cells tinted by the category that becomes a bar segment. Focus: an amber ring round the whole (row / column /
  all), a lime glow on the part, a dashed red ring on a wrong whole (evidence), dimming outside the whole, hidden
  cells as "?" that reveal. `tableLayout` is pure (numbers ≥ 60 px, labels 44 px, two-line headers).
- `SegBars.ts`: 100% bars, horizontal or vertical, amber outline = the group's 100%, segments in one order with a
  key, axis 0-100% (gridlines for reading), group sizes in a Total column. Bars morph out of the table cells
  (`barsUnder`), so "the row becomes a bar" is watched. A dashed lime line along a boundary shows "same split".
- `Tree.ts`: marginal branches, conditional branches, joint leaves (branch × branch); percents beside the branches.
- `twoWayMaths.ts`: totals, exact percents, conditional / joint tables, rounding, the RF-table solver, screening
  counts, and 13 survey contexts whose words build every prompt ("of the eighth graders with a curfew", "do chores").
- Colour roles: amber = the whole (totals, ring, bar outline), lime = the part / answer, category tints = segments,
  red = a wrong whole.

## The five parts
1. **The question**: 200 eighth graders, curfew × chores (topic anchor 84 / 36 / 32 / 48). "Of the students with a
   curfew, what percent do chores?" Cards 42% (all 200: condition-not-made-new-whole), 70%, about 72% (the chores
   column: confusion-of-the-inverse) + how sure. Board: 84 over "?".
2. **Worked example**: Read the table (totals both ways, 200 twice) → Name the whole (amber ring on the Curfew row,
   84 glows) → Part ÷ whole (84/120 = 70%; the row drops into a 70 | 30 bar) → Compare the other group (No curfew
   row → 40 | 60 bar; 70 − 40 = 30 points: associated). Why: "why 120, not 200?" (right / everybody =
   condition-not-made-new-whole / always the row total = fixed-row-denominator; a wrong pick rings that whole).
3. **Your turn** (250 students, bus × breakfast, a COLUMN question), faded from the end: the totals are given; the
   kid names the whole (90 breakfast eaters / 120 bus riders = fixed-row / all 250 = not-new-whole, rings shown),
   types 80% (60 / 28.8 / 72 diagnosed), the columns drop into vertical bars, judges the association (the causal
   option = correlation-implies-causation). Callback to the part-1 card.
4. **Prove it**: Jordan: "120 is the biggest cell, so music students are more likely to play a sport" (300 students,
   120 / 60 / 80 / 40: two thirds of BOTH groups). Judge, then a because-chain: the music group is big (ring, strike
   Jordan's lines) / 120 of 180 ≈ 66.7% (row → bar) / 80 of 120 ≈ 66.7% (bar, lime alignment line: same split).
   Distractor chips: one-cell-count, condition-not-made-new-whole, correlation-implies-causation.
5. **Practice**: 15 sub-goals in order, then mixed; 35 families, every item has a picture (table, table + bars,
   bars, tree, or three small graphs); after a miss the whole rings, the part glows, hidden values reveal, bars grow
   out of the table and the board writes the solution lines.

## Sub-goal → families (plan.ts)
| sub-goal | families | main misconceptions |
|---|---|---|
| conditional-both-directions | rowPct, colPct, matchQuestion | confusion-of-the-inverse, fixed-row-denominator, condition-not-made-new-whole |
| joint-relative-frequency | jointPct (odd totals), jointRound (99.9 / 100.1) | subgroup-denominator, forces-last-value, rounded-parts-must-sum |
| marginal-relative-frequency | marginalPct, marginalFromJoint, weightedTrap | unweighted-average |
| name-the-whole | nameType ("and" traps), nameWhole | relative-frequency-named-by-keywords, subgroup-denominator, swaps-whole-and-part |
| conditional-from-joint | condFromJoint (whole, tenth, hundredth %), countUnknown | condition-not-made-new-whole, percent-as-fixed-amount, total-cell-as-joint-cell |
| segmented-bar-construct | barSegment (rows or columns), pickGraph | segmented-bars-as-counts, segment-order-varies |
| segmented-bar-read | readSeg (gridlines, middle segment), readSentence | end-reading-as-length, confusion-of-the-inverse |
| segmented-bar-limits | moreWho (no sizes / flip / keep), countFromBar | different-wholes-treated-as-same |
| association-compare-distributions | assocTable (pos / neg / none with biggest yes-yes cell), pointsDiff, assocBars | independence-from-one-cell-count, negative-r-as-weak |
| tree-joint | treeLeaf, treeMissing | adds-stage-counts, subgroup-denominator |
| complete-rf-table | fillCell (3-4 givens, solver-checked), fromConditional | subgroup-denominator, total-cell-as-joint-cell |
| screening-test-frequencies | screenWord, screenPPV (2-30% base rates) | false-positive-negative-confused, confusion-of-the-inverse |
| relative-frequency-as-probability | chanceAll, chanceGroup, chanceWho (another population) | condition-not-made-new-whole, asks-questions-data-cannot-answer |
| association-not-causation | rewriteClaim, confounder (and "what study tests it") | correlation-implies-causation, no-cause-no-association |
| categorical-problems-mixed | combineGroups, pieAngle, rawCountClaim | unweighted-average, percent-as-degrees, one-cell-count |

Notes: no runtime change was needed. `\cssId` inside `\frac` makes MathJax emit empty `<text>` nodes; they are not
missing glyphs (the test ignores empty entries). The test fails on any control character in a board, label, chip,
panel line or solution string, and on a single-backslash TeX command in a page string.
