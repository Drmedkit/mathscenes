# Writing equations and inequalities from constraints (Algebra 1, lesson 4; secondary-t6-06, A-CED.A.1-3, N-Q.A.1-2)

Slug `creating-equations`, 18 sub-goals, 39 families. Builds on solving linear equations (lesson 3) for the
bound-rounding items, without re-teaching it. The new pieces: a constraint as a CONDITION (true or false for a
candidate), an inequality as a whole allowed SET, translating bound phrases, defining variables as quantities with a
unit, two-variable resource and comparison constraints, unstated bounds, separated vs continuous values, a complete
model (system + restrictions), viability, the extreme whole number, empty sets, and changed model assumptions.

## Concept
A model is a list of conditions on named quantities. A candidate (a value, or a pair) is viable only when EVERY
condition holds with the SAME values, including the ones nobody says out loud (not negative, whole numbers, a
maximum). Equations pin a quantity down; inequalities allow a set with the boundary in or out; the context decides
whether that set is separate dots or a range.

## Models
- **CheckTable** (`CheckTable.ts`, maths in `cons.ts`): rows = rules (words | symbols), columns = candidate plans,
  cells = the left side's value and a check or a cross, last row "every rule?" = the AND. The block evaluates every
  cell itself; layout is pure and checked (TeX >= 60 px, words >= 44 px, wraps to 2-3 lines). Full-width frame,
  no separate board: the symbols column IS the notation, next to the words it translates. Kit candidate.
- **AllowedLine** (`AllowedLine.ts`): SetLine of solving-linear-equations (imported read-only) plus dots for
  separated values (whole numbers, quarter-hour blocks) next to bands for ranges; tests with check / cross.
  Kit candidate together with SetLine.
- Colour roles: candidates and focus lavender (`pick`), checks and the viable column lime (`link`), crosses and failing
  values red, the two stated rules amber / teal on the number lines.

## The five parts
1. **The question** Climbing trip: $60, $8 an adult, $5 a student, at least 2 adults, van seats 10. Cards: plan 1
   (1, 9) passes money and van but not the adults (one-condition-enough), plan 2 (3, 6) right, plan 3 (4, 5.6) spends
   exactly $60 (fractional count). The table shows the three plans and the rules in words.
2. **Worked example** name the unknowns (columns pulse, (a, s) writes) → the money rule 8a + 5s ≤ 60 (cells 53, 54,
   60 all pass; 60 at the limit) → a ≥ 2 and a + s ≤ 10 (plan 1 crosses, plan 1 hits 10 exactly) → the unstated rule
   a, s whole (5.6 crosses) → "every rule?" row, plan 2 ringed. Why: plan 1 is out because every rule must hold
   (distractors: one-condition-enough, equation-for-a-bound).
3. **Your turn** Food truck: 2t + 3b ≤ 60 and t, b whole given; the kid writes "at least twice as many tacos as
   burritos" (t ≥ 2b; 2t ≥ b = reverses-multiplicative-comparison; t = 2b = equation-for-a-bound), then judges (12, 10)
   (not viable: 12 < 20; "54 fits" = one-condition-enough; "not exactly 60" = equation-for-a-bound). Both columns
   fill, (20, 6) is viable. Callback to the card.
4. **Prove it** 28 students, vans of 12, at most 2 vans; Kai rounds 2.33 to 2. Number lines: 12n ≥ 28 (dots 3, 4, 5),
   n ≤ 2 (dots 0, 1, 2), "both" stays empty. Because-chain: 2 vans too few (12 × 2 = 24 < 28, test ✗) / 3 or more
   break "at most 2" (test ✗) / every rule at once, no whole number: no viable option (Kai struck). Distractor chips:
   rounds-nearest, one-determinable-answer.
5. **Practice** all 18 sub-goals in order, then mixed. Tables (checks fill in the replay after a miss), number lines
   (bands, dots and tests appear in the replay), a big slate for translation items.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | equation-as-condition | eqTest (table of candidate values), eqMeaning (condition vs instruction vs label) |
| 2 | inequality-as-allowed-set | allowedSet (the set in words; boundary-only, strict/inclusive, reversed), boundaryCand |
| 3 | test-candidates | pairTest (which check is right: one coordinate, counts, boundary), pairValue (typed left side, decimals) |
| 4 | conjunction-of-constraints | bothValue (n ≥ m and pn ≤ B, three number lines), pairBoth (a pair against two rules; changed values) |
| 5 | bound-phrase-to-symbol | phraseSymbol (17 phrases, "no more / no fewer than" doubled), phraseWrite (either order) |
| 6 | define-variables | defineVar (quantity + unit vs label vs a given number), unitCheck (dollars with dollars) |
| 7 | one-var-equation | feeRate (fixed + rate; word order, dropped start, unused number), groupEq (p(x + q) = r) |
| 8 | one-var-inequality | rateIneq (55 mph, pump, 1.07p, pages), feeIneq (fee + rate with a bound phrase) |
| 9 | two-var-resource | budget2 (incl. $0.75 / $1.20; swapped rates, counts), total2 (exactly vs at most; time, weight) |
| 10 | two-var-comparison | timesAsMany (times, for every, more than), atLeastTwice, compareCheck (typed check with a number) |
| 11 | implicit-bounds | unstatedBound (hours, lengths > 0, percentages, seats, °F), boundCandidate (0, negative, over the max) |
| 12 | discrete-vs-continuous | discreteOrNot (dots vs band), fracValue (is 2.5 sensible?) |
| 13 | assemble-system | systemPick (dropped, merged, one letter, no restriction; incl. nutrition-and-cost), missingCon |
| 14 | viability-of-candidates | viablePair (fraction, negative, one broken rule, viable), whichViable (three plans) |
| 15 | bound-rounding | busRound (least buses / most tickets, nearest is the trap), intEnd (< ≤ > ≥ 6), solveRound |
| 16 | represent-allowed-values | pickRep (dots / segment / ray), notation (0 ≤ n ≤ 6, n whole), pairRange (linked variables) |
| 17 | empty-feasible-set | noOption (n ≥ 8 and n ≤ 6), betweenInt (4.2 ≤ g ≤ 4.8, g whole) |
| 18 | model-assumption | blocks (any part / whole hours / quarter-hour blocks), packs (sold in packs of k) |

Every misconception id is checked against misconceptions.json in the test. No runtime or kit change. Walk:
`tools/walk-creating-equations.mjs`.
