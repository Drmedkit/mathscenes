# Using probability to make decisions (secondary-t8-20, HS Statistics 9, HSS-MD.B.5-7)

**Concept.** A decision separates what you choose (a square node) from what chance decides (round nodes). Every leaf
gets a net payoff from one named person's side: receipts minus every cost paid in that branch (a ticket in every
branch, a deductible only after a claim), costs and losses negative. Each choice is then a payoff distribution that
adds to 1 ("nothing happens" is an outcome too; a sure option is one value with probability 1). Options are compared
on a common basis (same person, period, net not gross) by expected value under a STATED objective (largest expected
gain or lowest expected cost); the fair price is the fixed cost that makes E(net) = 0 (= the expected prize). An EV
rests on assumptions (where each probability comes from, at most one claim, losses above the deductible), and a
scenario table shows where the best choice changes. EV is not the whole story: the downside (worst case, P(loss),
P(loss of at least T)) and the SD of the payoff measure risk; splitting a stake over independent options keeps the EV
and lowers the SD (not when they are linked); many independent repetitions pool toward the EV (an insurer), a single
try or a common shock does not. Uncertain inputs give a range of EVs. A stated preference or loss limit can rationally
change the choice with the model unchanged, so a good recommendation is conditional: EV comparison + downside + model
limitation + criterion.

**Model.** `DecTree.ts` (new, a kit candidate): the decision tree card: square node, elbows to the options (names
above), round chance nodes, outcome fans with probabilities on the branches, leaves with the outcome and its net payoff,
optional E per option, a lime glow on the chosen option ('hl'), hidden "?" cells that fade to their values on 'rev'.
`DecPic.ts` dispatches between DecTree and the read-only reuse of expected-value/DistPic (payoff bars on the balance
beam, tables). Maths in `common.ts` (evOf, sdOf, pLoss) on top of expected-value/common (money, dec, noTie). Every
choice list goes through ONE helper: `ch` = quadratics-complex `keyed` (a wrong choice with the right one's key or text
is dropped, so no distractor is secretly right).

**Conventions (stated in the items).** "A cost or a loss is negative" whenever a net payoff is typed; expected costs
are asked "as a positive number"; money to the cent, exact (no rounding ties); probabilities as decimals or fractions
(any equivalent fraction); the SD to the nearest cent with a calculator; "which is better" items name their rule.

## The five parts
1. **The question**: an $800 phone, a $120 2-year plan, a $300 repair, P(break) = 0.15. Cheaper on average? Cards:
   buy (it saves $300: chooses by the prize), skip (right), no difference (50-50: equiprobability) + how sure.
2. **Worked example** (Lay out, Payoffs, Average, Downside): the tree grows (square, branches, chance fans,
   probabilities); net payoffs on every leaf (−120, −120 / −300, 0); E(buy) = −$120, E(skip) = −$45, the skip branch
   glows; the tree turns into skip's bars on a beam, the pivot at −$120 tips and slides to −$45 where it balances, but
   one phone costs $0 or $300: skip, unless $300 would hurt. Why? (right / most likely cost / skipping is free).
3. **Your turn**: club fundraiser, outdoors $2,000 / −$500 (rain 0.2) vs the gym's sure $1,400. E(gym) given;
   E(outdoors) typed = $1,500 (750 unweighted, 1,600 drops the rain branch, 1,700 sign); the scenario table
   (P(rain) 0.1-0.4): the switch lies between 0.2 and 0.3 (choice; "never switches" = unqualified); the club holds only
   $300: recommend the gym (choice; "always the higher EV" = preference confused with the model; "50-50"). Callback.
4. **Prove it**: Theo: "splitting $2,000 over two independent stalls raises the EV". Two beams (one stall: −$200 / +$600;
   the split's bars hidden). Because-chain: four pairs at 1/4 each (independence) -> E = $200 unchanged (half of each
   EV) -> SD $400 -> about $283 (the extremes drop to 1/4). Decoys: three totals at 1/3, two chances double the EV,
   splitting helps even when one storm hits both.
5. **Practice**: 17 sub-goals, 36 families.

## Sub-goal -> families
| sub-goal | families |
|---|---|
| s1-decision-structure | dsWhich (choice or chance), dsBranches (the do-nothing branch: chance still acts, or one sure $0) |
| s1-net-payoff | netTicket (raffle buyer; booth player or booth), netInsure (premium, deductible, loss; 4 cells) |
| s1-payoff-distribution | distDie (die / 8 sectors, shared net values), distComplete (skip vs a sure plan) |
| s1-fair-random-decision | fairJudge (ranges, dice sums, re-roll, coin + die, weighted tickets, lots), fairProb |
| s2-common-basis | basisPeriod (monthly vs up front), basisNet (net gain per play, not gross) |
| s2-expected-net-payoff | evNet (bars of net payoffs), evRoutes (E(prize) − ticket), evInsureCost (premium + p·deductible) |
| s2-fair-price | fairPrice (price = expected prize, either direction), fairWhich (fair vs 50-50 vs equal-chance lottery) |
| s2-ev-decision-rule | ruleGain (two games or neither; must-play variant), ruleCost (two policies, stated rule) |
| s2-assumption-audit | auditSource (theoretical / empirical / assumed), auditWhich (what the formula relies on) |
| s2-sensitivity | sensFill (scenario cell, complement updated), sensSwitch (where the better option changes) |
| insurance-warranty-spreadsheet | planTotal (premiums, deductible, coinsurance, out-of-pocket max), warrantyScen (exclusions) |
| s3-downside-risk | riskRead (worst case, P(loss), P(loss ≥ T)), riskCompare (equal EV / higher EV with a loss) |
| s3-payoff-sd | sdCompute, sdPick (rule on EV and SD), sdDiversify (independent vs linked) |
| s3-repetition-pooling | poolTotal (n × EV), poolWho (insurer vs family, hail shock, one-time choice, streaks) |
| s3-model-uncertainty | muKind (randomness vs model uncertainty), muRange (EV over a probability range, pair) |
| s3-risk-preference | prefConstraint (loss limit, then highest EV), prefWhy (warranty, pulling the goalie, lottery) |
| s3-conditional-recommendation | recPick (conditional recommendation; EV order flips or not), recCondition (changeover p) |
