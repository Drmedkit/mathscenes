# Combine percents and ratios in one problem (primary.ratios.combine-percentage-ratio-contexts, grade 7, 7.RP.A.3)

**Concept.** A combined problem is a chain of steps: ratio steps (share a total a : b, a rate), percent steps (p% of
some whole) and fixed amounts (neither). Every percent step has its OWN whole, and that whole can be the result
of an earlier step (art's share, the sale price). Plan by dependency (a step that needs another's result goes after
it, whatever the sentence order), run the chain with every middle amount labeled, then check against the story's
relationships (percent of its whole, shares add to the total AND keep the ratio), undo it last step first, or bound it.

**Model: `ChainTape`** (ChainTape.ts, maths in chainMaths.ts). One row per whole. Each row's whole fills the same
width (its 100%), so the same 20% is a different amount on different rows. A ratio step splits its row into dashed
units grouped a : b (teal = the share that goes on, pewter = the other share); a percent step marks p% of its row
(lime = the answer, amber = the rest of the whole, dashed teal = a cut, teal = an added percent). The output of a
step ZOOMS into the next row: a faint lavender trapezoid and two dashed guides stretch it to the full width = "the
output is the new 100%". Lead column: the row's name (44 px) over its amount (60 px). Inside labels sit in their
piece or above it; amounts under it; guides break around every label; dividers break into stubs where a word sits.
Focus: hi (ring), ghosts (red tint + bracket + label: "20% of the wrong whole"), marks (a dashed tick + label),
ask ("?" under a piece). Draw keys per row: r t L s u k h z d, n<r>.<j>, v<r>.<j>. Throws when labels overlap or
leave the frame; practice falls back to a bare board then. `scenes.ts` holds the lesson's fixed chains (tested).

**Board** (wider slate, x 1070..1860): the plan as an arrow chain `$240 →3:5→ art →20%→ paint`, the whole of the
percent step (`100% = art's share`), the computations with the middle amounts named, then the checks. Colours:
amber = a whole / amount, teal = ratio parts, lavender = the percent / the 100% mark, lime = the answer, red = wrong.

## The five parts
1. **The question**: $240 budget, art : music = 3 : 5, art spends 20% of its share on paint. Cards $48 (20% of the
   whole budget: uses-nonreference-quantity-as-whole), $18, $28.80 (3 : 5 read as 3/5: confuses-whole-with-other-part).
2. **Worked example**, four steps: Label + plan (split shows, plan chain, `100% = art's share`) → Share the budget
   (240 ÷ 8 = 30, art 90, music 150) → Take 20% of the new whole (zoom: art's $90 becomes the full tape, ticks,
   20% = $18) → Check (18 ÷ 90 = 20%, 90 + 150 = 240, 90 : 150 = 3 : 5). Why: "20% of $90, not of $240?" (right /
   "$240 is the whole of the problem" = wrong whole, shows the red $48 bracket on the top tape / "ratio came first in
   the story" = composition-flow-from-mention-order).
3. **Your turn** trail mix 36 oz, nuts : raisins = 7 : 2, 25% of the nuts are almonds. Plan + share given; the kid
   picks the whole (28 oz nuts / 36 oz mix = wrong whole, red 9 oz bracket / 8 oz raisins = other part), the zoom
   runs, types 7 (9, 2, 21, 28 diagnosed), checks 7 ÷ 28 = 25% (400 = divides-whole-by-part). Callback to the card.
4. **Prove it**: Maya, $80 jacket, 25% off, 8% tax on the sale price: "−25% + 8% = −17%, 83% of $80 = $66.40".
   Judge, then a because-chain: her 83% uses $80 as the tax's whole (strike her lines, zoom the $60 to a new 100%) /
   sale price $60 (0.75 × 80) / total $64.80 (8% of $60 = $4.80; the "you pay" tape with a red $66.40 tick past
   its end). Distractor chips: percents always add (adds-successive-percent-changes), her arithmetic is right
   (correct-arithmetic-validates-setup), tax is always of the tag price (uses-nonreference-quantity-as-whole).
5. **Practice**: every sub-goal in topic order, then mixed. Chain pictures for share, ratioPercent, percentRatio and
   twoChanges (the answer is "?", the solve replays every label and writes the steps on the board).

## Sub-goal → families (plan.ts), 35 families
| sub-goal | families |
|---|---|
| label-relationships | labelStep (one bold part: ratio / percent / fixed), findFixed (three in one story: which is fixed), doubleTest (number: does it grow when the whole doubles?) |
| name-whole-per-step | nameWhole (choice of the 100% amount), wholeValue (the 100% amount as a number) |
| order-plan | orderPlan (two-step plans), firstStep (which amount first in a 3-step story), planThree (3 steps with a fixed fee: order changes the answer) |
| share-total-in-ratio | share (2- and 3-term, decimal money), shareFromPart (one share → other share / total), shareFraction (a share as a fraction) |
| chain-ratio-then-percent | ratioPercent (picture), ratioPercentRest (what is left of the share, picture), rateThenPercent (unit rate, then a percent) |
| chain-percent-then-ratio | percentRatio (picture), percentThenRate (percent, then a unit rate), percentRatioGrow (an increase, then a share, picture) |
| successive-percents | twoChanges (picture), netChange (the overall change), threeStep (ratio share, tax, tip) |
| percent-multiplier | multiplier, chainProduct, multiplierToPercent (× 0.85 back to 15% off) |
| rounding-policy | rounding (discount + tax), roundingTip (tax + tip on the bill with tax) |
| audit-wrong-whole | audit (which line), fixAudit (the corrected answer; Sam's answer = correct-arithmetic-validates-setup) |
| check-against-relationships | checkShares (total and ratio), checkPercent (a percent checked by dividing by its whole) |
| backward-check | undo (discount + tax, −p then +p, paint → budget), undoPercentRatio (share → after tax → prize) |
| estimate-reasonableness | estimate (which total makes sense), direction (more, less or exactly the start) |
| transfer-new-context | transfer (commission, interest, garden, 5K), transferThree (3 steps with a fixed fee, no plan) |

Every misconception id is in `items.ts` MC (checked against misconceptions.json in the test). No runtime change was
needed; the page draws its own wider board (no leaders, pulses/rings instead) and keeps the tapes above the table.
