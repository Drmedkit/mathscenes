# Ratio tables and proportional relationships (grade 7) — design

Topic `primary.measurement.relationships-between-quantities`, slug `ratio-tables-and-proportions`, 20 sub-goals
(6.RP.A.1-3, 7.RP.A.2.a-b). The sister topic `proportional-relationships` (built separately) owns graphs, y = kx and
the constant of proportionality as a rule; this lesson's tool is the **ratio table**.

## Concept
Two quantities that keep a constant ratio travel as **pairs**: one observation is one row. Every new row comes from
doing **the same thing to both columns** — multiply both, divide both, add one more copy of the base pair (build-up),
add or subtract two rows. Adding the same *number* to both columns keeps the difference, not the ratio. A table is
proportional only when second ÷ first is the same in **every** row with a positive first value, and 0 goes with 0;
a fee, an inverse or a constant output breaks it — and then adding rows breaks too.

## Model: `RatioRows.ts`
A painted two-column table card (washes, crisp sans digits ≥ 60 px, labels ≥ 44 px), with:
- `shelf{i}`: painted objects above it, regrouping from config to config (cups of lemon juice and water in trays;
  amber cases holding teal bottles) — the concrete stage of concreteness fading.
- `op{j}`: × / ÷ / +copy arcs on **both** sides with the same label (lanes when spans overlap; labels checked for
  collisions), or a + / − sign and a sum line written like column addition (row addition / subtraction).
- `quot`: a third card, second ÷ first per row (exact rationals, `none` for a 0 row), wrong rows in red.
- `zero`, `fill` / `fill{r}` (hidden `?` cells), `strike` / `fix`, two tables side by side (`B…` keys) with titles,
  and a small first-quadrant graph (`axes points line origin`) for the enrichment sub-goal.
- compute (`computeTable`): exact quotients, constant?, first break, zero kind, every op checked on both columns
  (throws if a row does not follow). Layout (`planLayout`) is pure with a measure function, so the tests check every
  practice picture fits; `where` boxes: row, cell, rowMid (a leader straight along a row), quot, op, group, point.
- Colour roles: first (amber) = the first quantity, second (teal) = the second, link (lime) = the answer / the
  constant quotient, pick = the row in focus / Jordan's claim, wrong = the row or quotient that breaks.

## The five parts
1. **The question** — lemonade 4 cups lemon : 6 cups water, you have 10 cups of lemon juice. Cards: 15 cups (right),
   12 cups (`additive-keep-difference`), "can't tell, 10 is not a multiple of 4" (`whole-number-row-scaling-only`);
   how sure. Canvas: the recipe tray and the 10 cups; board 4 : 6, 10 : ?.
2. **Worked example** — Pair them (table, row 4 | 6) → Divide both (the 10 cups regroup into 2 trays of 2 + 3; ÷2
   arcs on both sides; 2 | 3) → Multiply both (5 trays; ×5; 10 | 15) → Check every row (water ÷ lemon = 1.5 in
   every row). Board lines sit at the height of their rows; each leader runs straight along its row. Why may we
   divide both by 2? (half a recipe has half of each / take 2 off both → additive / only the lemon → scale-only-one-term).
3. **Your turn** — 3 cases hold 24 bottles; 7 cases? Pair given; the kid finds the row for 1 (8; 0.125 → reversed,
   21 → additive), scales to 7 (56; 28 → additive, 168 → wrong row), names the rate (8 bottles per case / 8 cases per
   bottle → reversed / 8 → omits-unit). The cases regroup above the table. Callback to the part-1 card (+ certain).
4. **Prove it** — bike rental $5 fee + $3/h: 1 h $8, 2 h $11. Jordan adds the rows: 3 h = $19. Judge, then a
   because-chain: not proportional (8 ÷ 1 = 8, 11 ÷ 2 = 5.5) → every price holds the fee once (0 h costs $5) → adding
   rows pays the fee twice: $14, not $19. Distractor chips: "adding two rows always gives a row"
   (`combines-rows-of-different-tables`), "more hours cost more, so proportional" (`scales-non-proportional`). The
   table backs each line (quotient card, the 0 row, 19 struck → 14); Jordan's 19 is struck last.
5. **Practice** — all 20 sub-goals in topic order, then mixed (runtime/practice.ts), 26 families.

Every panel line of parts 1–4 is in `script.ts` (HTML + spoken text) = `voice/lines.json`; every card, chip and
input is logged with its misconception id.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| paired-observation | pairUp |
| constant-multiplier | timesAsMany, whatStays |
| ratio-vs-difference | ratioOrDiff |
| fixed-start-nonexample | situation (fee), doubleIt (fee) |
| inverse-nonexample | situation (inverse), doubleIt (painters) |
| constant-output-nonexample | situation (constant output + mixed sort), doubleIt (musicians) |
| table-of-pairs | pairTable, labelTable |
| build-up-rows | buildUp |
| unit-row | unitRow, rateUnit |
| intermediate-row | midRow, canWeFind |
| add-rows | addRows, feeRows |
| subtract-rows | subRows |
| choose-route | route |
| compare-tables | compare (price / mix / speed, two tables) |
| test-every-pair | testTable |
| zero-row | zeroRow |
| justify-in-context | predict |
| rational-entry-tables | moneyRow, fracRate, moneyTest |
| graph-through-origin | graphLine |
| measurement-tolerance | tolerance |

After a miss the picture solves itself (arcs, sum lines, the quotient card, fills, strike → fix, the graph line),
the hero line writes on the board, then a twin. Words-only situations get a table in the solution.
