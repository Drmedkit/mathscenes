# Add and subtract rational numbers (grade 7, 7.NS.A.1)

Topic `secondary-t5-17-operations-with-rational-numbers`, slug `add-subtract-rational-numbers`, 19 sub-goals.

## Concept and model
The concept that carries the topic: **p − q = p + (−q)**. On a number line a number is a move (a directed arrow);
adding it makes the move, **taking it away undoes the move, so the arrow flips**. The flip is drawn literally: the arrow
of q turns around its tail and becomes the arrow of −q. Addition, subtraction, the check by adding back (7 + (−3) = 4)
and "subtracting can make bigger" all live on the same line.

- `NumberLine.ts`: a painted track with crisp ticks (1, 1/2, 1/4, 1/10), labels ≥ 60 px (a stride when dense, point
  labels always), points on the line in role colours (ghost = dashed ring), jumps in rows above the line with their
  value written above, dashed drops to the line, and the flip. Throws when labels collide or rows do not fit.
  Pure helpers (`niceRange`, `lineFits`, `numTex`) are used by the generators so they only make drawable lines.
- `CounterMat.ts`: two-colour counters (light = +1, dark = −1), zero pairs ringed in lime and removed; adding zero pairs
  so there is something to take away. `computeMat` counts every counter at every stage and asserts the value.
- Colour roles: first (amber) = the number you start from; second (teal) = the number added / taken away; pick
  (lavender) = the flipped arrow (its opposite); link (lime) = where you land; wrong (red) = the struck word.
- Layout: the board is a wide slate on top (y 34–404), the line (or the mat) underneath, full width. Each board line
  is written after the picture moves; the symbol and its picture partner light up together (pulse ring on the arrow
  label / point label); the bottom board line ties to the flipped arrow with a dotted leader. No text on the canvas
  except numbers and the mat legend.

## The five parts
1. **The question.** Quiz score: you have 4 points; a −3 penalty is taken away. 4 − (−3) = ? Cards 1 / 7 / −7
   (subtract-negative-as-positive, right, add-magnitudes-mixed-signs) + how sure. Line −2..8, 4 marked.
2. **Worked example** (Draw the number → Flip it → Land → Check by adding back): −3 arrow from 4 (ghost landing at 1,
   board "adding −3: 4 + (−3) = 1"); the arrow flips to +3 (board "taking −3 away: 4 − (−3) = 4 + 3"); land on 7
   (hero 4 − (−3) = 7); check arrow 7 + (−3) back to 4. Why? Undo-reason (right) / "two negatives make a positive"
   (two-negatives-positive-in-addition) / "subtracting always moves left" (jump-direction-single-cue).
3. **Your turn** −2 − (−6), faded from the end: Draw is given; the kid picks the flip direction (left =
   jump-direction-single-cue), types the landing (−8 = subtract-negative-as-positive, −4 = subtract-changes-both-signs),
   picks the check (4 + (−6) = −2; wrong pair = checks-subtraction-with-wrong-pair; redo = check-by-repeating-same-steps);
   callback to the part 1 card (+ "you were sure" line for confident errors).
4. **Prove it.** Sam: "subtracting always makes a number smaller". Always (minus-sign-only-subtract) / sometimes /
   never, then a because-chain: 5 − 2 = 3 < 5 (subtracting a positive moves left), 5 − (−2) = 7 > 5 (taking −2 away
   flips its move), so only sometimes (one counterexample is enough). Distractor chips: "a minus always means move left"
   (jump-direction-single-cue), "5 − 2 works, so it works for every number" (examples-as-proof). "always" is struck
   after both cases are on the line.
5. **Practice** (runtime/practice.ts): every sub-goal in topic order, then mixed.

## Sub-goal → families
| # | sub-goal | families |
|---|---|---|
| 1 | minus-sign-roles | signRole (choice, the marked minus), opposite (−(−a), −x for x < 0) |
| 2 | zero-pairs | mat (read a counter mat, ≤ 8 each), inverse (p + (−p) vs −p + (−p), fractions/decimals, line) |
| 3 | directed-addition | jumpAdd (cases a–f, integers −20..20, then halves/quarters/tenths), lineRead (which sum is drawn) |
| 4 | subtract-as-add-opposite | flipJump (cases a–e, integers then halves/quarters), rewrite (which addition) |
| 5 | distance-abs-difference | distChange (signed change AND distance: °F, $, ft, Death Valley / Whitney / Denali) |
| 6 | negative-mixed-number-meaning | mixedMeaning (improper form, between which integers, −(w + f)) |
| 7 | context-meaning-add-sub | whatMeans ($ debts incl. a canceled debt, °F, sea level) |
| 8 | int-add-same-sign | addSame (±50, three terms, adding 0) |
| 9 | int-add-opposite-sign | addOpp (±50, either larger, equal, either order) |
| 10 | int-subtract | subInt (all sign cases, subtracting 0, chains) |
| 11 | model-to-algorithm-add-sub | matStep (model action ↔ rule step), mat (±12, subtraction that needs zero pairs) |
| 12 | fraction-add-sub-signed | fracSigned (denominators ≤ 12, crossing 0, improper), fracSign (compare numerators) |
| 13 | mixed-number-add-sub-signed | mixedOps (−2 1/4 + 1 1/2, −3 1/3 − 1 1/2, −1 1/2 − (−2/3) shapes) |
| 14 | decimal-add-sub-signed | decSigned (1–3 places, crossing 0, subtracting negatives, $ balances) |
| 15 | mixed-format-operands | mixFormat (halves … twentieths with decimals, exact decimal answer) |
| 16 | additive-properties-strategies | regroup (rewrite then reorder; swapping a subtraction), property (name it) |
| 17 | model-check-add-sub | lineCheck (claim vs. the line; right and wrong claims; "proves every case" distractor) |
| 18 | inverse-check-difference | checkPick (which addition checks), checkJudge (add back: right or wrong) |
| 19 | apply-one-step-add-sub | story (reading vs change, $, ft, °F, a bucket below a well rim; units), signMeaning |
