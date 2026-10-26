# Linear equations from a context (secondary-t6-32, Algebra 1, lesson 6)

**Concept.** A model is a story turned into y = mx + b, and then the story decides which answers count. Lesson 5
(`linear-functions-slope`) built lines from points and read slope / intercept / zero in context; this lesson does
not repeat that. It adds what modelling needs: name the quantities (letter, unit, what input 0 means), the rate from
two data points that do not start at 0, walking back to an unstated start, a unit check, an exact target vs a limit
("at least", "no more than") as one equation or inequality in x, and stage 3: counted vs measured inputs, bounds,
every restriction at once, the whole-number boundary in the direction the limit needs, exact targets a count cannot
hit, and where the model is valid.

**Model: the kit's Plane** for every graph, built from serialisable data (`modelPic.ts`: line / ray, DOTS at whole
numbers for counted inputs, data points, a threshold line with its allowed side shaded, words). Colour roles: amber =
the input and its changes (run, data points), teal = the output's changes (rise), lime = the model, the allowed dots
and the answers, wrong = dots past a limit, lavender = the walk back to input 0. Two pictures the kit lacks:
`Restrictions.ts` (a stack of number lines on one scale, one per restriction, and a last row "all at once" with a
piece, whole-number dots, one dot, or "no value fits"; could move to the kit) and linear-functions-slope's
`TableCard` (imported read-only). `contexts.ts`: 16 real stories (arcade card, rideshare, gym, plumber, print shop,
concert tickets, savings, kayak, pool, bean plant; tank, gift card, candle, phone battery, road trip, phone loan),
rates in quarters so money stays in whole cents, decreasing stories that run out at a terminating value.

## The five parts
1. **The question**: Sam's arcade card, receipts (4 games, $13) and (10 games, $28), $40 to spend card included: how
   many games? Cards 14, 15 (rounds 14.8 to the nearest), 12 ($13 ÷ 4 as a price per game: proportional) + how sure.
2. **Worked example** (same story, board beside the plane): name the quantities (axis names glow; g = games, a count;
   C = total dollars) → the rate from the two receipts (run 6 games, rise +$15, $2.50 per game) → walk back 4 games to
   (0, $3): C = 2.5g + 3, the unit check, and the model drawn as dots on a dashed formula line (games come whole) →
   the $40 limit (line + shaded side): 2.5g + 3 ≤ 40, g ≤ 14.8; the 15th and 16th dots turn wrong, C(15) = 40.5 > 40:
   14 games. Why? "15 games would cost $40.50" / "round to the nearest" (rounds-nearest) / "always drop the decimal"
   (drops-remainder: right number, wrong reason).
3. **Your turn**: a car wash, (10 cars, −$80) and (25 cars, $40); the rate $8 per car is done. The student types the
   start (−160; −80 = first-output-as-intercept), picks the inequality for "at least $250" (> strictness, ≤ reversed,
   = equation-for-a-bound), types the whole number for w ≥ 51.25 (52; 51 = rounds-nearest, 51.25 = fractions). The
   plane walks back, draws the limit and its side, rings the 52nd car. Callback to the part-1 card.
4. **Prove it**: a print shop, C = 0.75p + 12. Ava: "(50 − 12) ÷ 0.75 = 50.67, so 51 posters cost exactly $50." Judge,
   then a because-chain: 51 posters cost $50.25 (the "≈ 51" is struck) / no order costs exactly $50 (the dots jump
   from $49.50 to $50.25: the $50 line passes between them) / "at most $50" has an answer, 50 posters. Distractor
   chips: "close enough counts as exact" (rounds-non-integer-exact-solution), "the equation has a solution, so the
   story does" (context-domain-all-reals), "drop the decimal: 50 cost exactly $50" (drops-remainder).
5. **Practice**: all 18 sub-goals in topic order, then mixed. Most items show the model on the plane, a table or the
   restriction stack, with the answer-giving parts (the line, the start point, the dots, the result row) held back
   for the worked solution; four families are words only and get a big slate.

## Sub-goal → families (plan.ts), 35 families, 2 per sub-goal
| sub-goal | families |
|---|---|
| s1-linear-criterion | isLinearStory (fixed amount vs percent / speeding up / doubling / flat rate, with a table), unevenTable (x = 0, 2, 5, 6: equal changes per ROW is the trap) |
| s1-initial-value | startValue (table from x = 1 or step 2, rate stated first, proportional b = 0), startGraph (data points from x = 1, walk back on the plane) |
| s1-proportional-contrast | propOrNot (matched stories, flat rate m = 0), doubleTest (double the input: the fee is paid once) |
| s1-interpret-rate-units | rateWords (rate with its compound unit and sign), bothNumbers (start and rate, each with its unit) |
| s2-define-variables | defineVars (input mentioned second, letter-as-thing, clock time), restartClock (t from 3:00 vs 3:02 pm) |
| s2-equation-given-parameters | buildModel (start before / after the rate, b + mx accepted), modelPair (C = □g + □) |
| s2-negative-rate | drainModel (V = □t + □, loss stated as a positive word), buildModel (decreasing stories) |
| s2-rate-from-two-points | rateTwoPoints (two points in words, later one first), rateTable (rows 2-5 apart, not from 0) |
| s2-back-solve-start | backStart (one point + rate, increasing and decreasing), twoPointModel (two points → the whole model) |
| s2-unit-check | unitCheck (Sam's swapped equation), pointCheck (does a record fit the model?) |
| s2-target-equation | targetEq (which equation for an exact target), targetValue (solve it, whole answers) |
| s2-threshold-inequality | phraseIneq (at least / at most / no more than / exceeds / fewer than / no less than → symbol), budgetIneq (the whole inequality in x) |
| s3-discrete-continuous | discreteOrNot (counts vs measures, whole-hour billing, money does not decide), graphForm (dots or a ray?) |
| s3-context-bounds | boundIneq (tank until empty, seats ≤ 300, temperatures below 0 °F are real), emptyTime (the upper bound) |
| s3-feasible-set | feasible (budget + time cap / minimum: overlap, empty, one value; restriction stack), feasibleMax (budget + inventory, whole numbers) |
| s3-boundary-direction | wholeBoundary (afford → down, enough → up, strict at a whole boundary: 3s > 48 → 17), boundaryWhy (the reason, checked on the neighbour) |
| s3-exact-no-solution | exactOrNot (fractional, negative, past inventory, or a real whole answer), reachable (which total can an order hit exactly?) |
| s3-validity-justify | validInterval (until the tank is empty, a rate that changes after 20 miles, a paper tray runs out), extrapolate (a 30-40 year projection, a fish count gone negative) |

All 29 misconception ids of the topic are diagnosed somewhere (the test checks it). No runtime or kit change.

## What the kit's Plane could get
- A `dots` item (points at whole-number inputs of a curve, one step key): every counted-quantity lesson needs it;
  here `modelPic.ts` expands dots into points keyed `key#i`.
- A one-sided `shade` against a constant (y ≤ c), with the boundary line drawn by the same item.
- Money tick labels as a built-in `fmt` (here `money: true` in `modelPic.ts`).
- The Restrictions stack (or at least a number-line block with several sets) next to the Plane.
