# Percent increase and decrease (`percent-change`)

Topic `primary.ratios.calculate-percentage-change`, grade 7 (7.RP.A.3, 7.EE.A.2), 19 sub-goals.

## Concept
A percent change compares the change with the amount **before** the change (the base, 100%). Everything in the
topic follows from that one idea: the new amount is never the base, a dollar change is not a percent, the second of
two changes has a new base (so +20% then −20% does not cancel), and percent error uses the accepted value as base.

## Model: `ChangeTape` (`ChangeTape.ts`, maths in `changeMaths.ts`)
Every amount is a painted tape on one scale, one row per amount, oldest on top (2 or 3 rows). Row i is drawn
against row i−1: the kept part amber, an increase sticks out teal, a decrease stays as a dashed teal ghost. A base row
can be cut into n equal sections with a percent scale under it (a double number line, 0% … 100% and on past 100% as
far as the next row reaches). Steps per row: `row val chg clab cut scale slide`, plus `reveal` for hidden "?"
values. `where` boxes: label, value, tape, kept, change, under (leader end below a change piece), changeLabel,
section, tick, scale. Checks: positive base, nonnegative amounts, change pieces ≥ 14 px, sections ≥ 44 px, labels
inside the frame (change labels may hang into the empty gutter before the board). Colour roles: first = the base /
amounts (amber), second = the change (teal), link = the percent change (lime), pick = focus, wrong = struck.

## The five parts
1. **The question**: sneakers $40 → $50. Cards 20% (new price as base), 25%, 10% (dollars as percent) + how sure.
2. **Worked example** (same numbers): *Find the base* (cut $40 into 4, scale 0–125%, `$40 = 100%`) → *Find the
   change* (teal piece, `$50 − $40 = $10`, leader) → *Compare it with the base* (a copy of the $10 piece slides onto
   one section of the base; `10/40 = 1/4 = 25%`, the 25% tick lights) → *Name the change* (`a 25% increase`,
   `$50 is 125% of $40`). Why? "Why divide by 40, not 50?": base before the change / the bigger number / $10 = 10%.
3. **Your turn**: phone $250 → $200, faded from the end. Base and change are done; the kid types the percent (25 =
   new price as base, 50 = dollars, 80 = percent of) and names it (a 20% decrease / increase / an 80% / a 25%
   decrease). Callback to the commit and the "how sure".
4. **Prove it**: Sam says $50 back to $40 is a 25% decrease. Three rows $40 → $50 → $40. Because-chain: the sale
   takes $10 off / the base is now $50 / $10 is one fifth of $50 = 20%. Distractor chips: "up 25% and down 25%
   cancel", "the bigger number is always the base", "$10 changed, so 10%". Sam's 25% is struck only after the
   picture has shown the 1/5 section.
5. **Practice**: 19 sub-goals in order (2 right each), then mixed (runtime/practice.ts).

## Sub-goal → families (`plan.ts`, `items.ts`)
| sub-goal | families |
|---|---|
| identify-base | base, whichFrac |
| amount-of-change | byTo, changeWord |
| percent-of-original | benchPct |
| absolute-vs-relative | compare (two tapes on one scale) |
| compute-percent-change | pctChange, pctLabel |
| apply-increase | twoStepUp (two boxes: increase, new amount) |
| apply-decrease | twoStepDown (two boxes) |
| change-multiplier | multPick, multNum |
| over-100-percent | over100, over100Why |
| choose-operation | choose |
| check-reasonableness | estimate, sanity |
| round-results | round, exactOrNot |
| successive-new-base | successive (three tapes) |
| overall-change | overall |
| compose-multipliers | compose |
| multiplier-order | order |
| justify-no-cancel | undo, noCancelWhy |
| same-base-adding | sameBase |
| percent-error | pctError, closer |

Every misconception id the topic JSON names is produced by some family's classifier (tested).
