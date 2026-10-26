# Solving linear equations and inequalities (Algebra 1, lesson 3; secondary-t6-07, A-REI.A.1, A-REI.B.3, A-CED.A.3)

Slug `solving-linear-equations`, 21 sub-goals, 45 families. Builds on the grade 7-8 lessons `two-step-equations`,
`multi-step-equations` and `linear-equations` (the balance, clearing denominators, x on both sides) without repeating
them: here every step gets a REASON, answers are SETS, and the new pieces are literal equations / formulas with their
nonzero conditions, multi-step and compound inequalities, empty and all-real sets, test points vs proof, and context.

## Concept
An equation or inequality is a statement about x; its solution set is the set of numbers that make it true. A step is
safe when it can be undone (same operation on both whole sides, nonzero factor) or rewrites a side without changing its
value: then the new statement has exactly the same set. Adding or scaling by a positive number keeps an inequality's
order; × or ÷ by a negative number mirrors the number line through 0, so EVERY symbol it touches turns. Testing points
checks single numbers; only the reversible chain proves the whole set.

## Model: SetLine (`SetLine.ts`, maths in `sets.ts`, item pictures via `pictures.ts`)
Number lines for solution sets, one row per statement on one scale: rays with arrowheads, segments, unions, points, all
reals, nothing; closed dot = included, open ring = left out; a finite end that is not a numbered tick gets its own
number. `shift` slides a band (+ / − on all parts keeps the order); `maps` draw arrows from numbers on an upper row to
their images on a lower row, parallel for + / −, CROSSING for × or ÷ by a negative (the block computes the images and
asserts the order rule); `tests` put a lavender dot with a check or a cross on a row. Layout is pure and checked
(numbers ≥ 60 px, no overlaps, all in the frame); generators retry until their picture fits. Colour roles: the
middle expression / values amber (`first`), x teal (`second`), the solution set and answers lime (`link`), moves and
claims lavender (`pick`), wrong red. Board: inequalities centred, the move written under every part (− 1 | − 1 | − 1,
÷(−2) under all three), the turned symbols lavender, checks under them.

## The five parts
1. **The question** −5 ≤ 1 − 2x < 3 (the top line shows the band of 1 − 2x). Cards −1 < x ≤ 3, x < −1 (only one
   symbol turned: compound-negative-division-one-symbol-reversed), "No number works" (no symbol turned:
   no-reversal-for-negative) + how sure.
2. **Worked example** four steps: subtract 1 from all three parts (the band slides, the name becomes −2x) → divide all
   three by −2 (the arrows cross, the x band appears, both symbols lavender: 3 ≥ x > −1) → read it smallest first
   (−1 < x ≤ 3, the ends glow) → test x = 3 (closed end), 1 (inside), −2 (outside) in the original. Why: "why did BOTH
   symbols turn?" (mirror / only one symbol = one-symbol-reversed / any minus sign = reverses-for-any-negative-sign).
3. **Your turn** 7 − 2x ≤ 3x + 2, faded from the end: −3x and −7 on both sides are given; the kid picks the line after
   −5x ≤ −5 (x ≥ 1; x ≤ 1 = no-reversal, shown as a red dashed ray that holds 0 while the test at 0 is a cross;
   x ≥ −1 = divide-by-coefficient-without-sign), then judges x = 0 in the original (false), sees the other way
   (collect on the right: 5 ≤ 5x, no flip) and the callback to the card.
4. **Prove it** Jay: 2x + 3 > 7 "is x > 1" because x = 0 and x = 5 agree. Judge, then a because-chain: two tests do not
   settle a ray (tests check single numbers) → 2x + 3 > 7 has exactly the solutions of x > 2 (− 3 and ÷ positive 2 can
   both be undone; the true ray draws) → Jay's set is wrong: 2 is in it but 2(2) + 3 = 7 is not more than 7 (tests at 2
   on both rows, Jay's line struck). Distractor chips: one-test-proves-inequality-set, move-and-change-sign.
5. **Practice** every sub-goal in topic order, then mixed. SetLine pictures for the inequality families (the set,
   arrows and tests appear in the replay after a miss, never before the answer), a stacked slate for worked solutions
   and pairs, the bare board otherwise.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | equiv-solution-set | sameSet (scale / shift both sides vs some terms / one side; x = 0 agreement trap), pickEquiv |
| 2 | reversible-ops-preserve | undoStep (inverse on both sides; "one way only"), whyKeeps (incl. distributive rewrite) |
| 3 | non-equivalent-steps | badStep (× 0, ÷ x, one side only, −(x − m) to the first term), lostSolution (÷ x lost 0, × 0 gained all, Ray's minus) |
| 4 | order-preserving-ops | keepDir (numbers, arrows parallel / stretch), stepIneq (one step, negatives around) |
| 5 | negative-scaling-reverses | flipNum (× −1, −2, −½, ÷ −k; arrows cross), doesFlip (keep / reverse / trap) |
| 6 | annotate-worked-solution | reasonFor (full reason vs "move and change sign" vs "subtract 5x"), propName |
| 7 | justified-chain-two-step | chainSolve (px + q = r, p(x + q) = r, |p| ≤ 12, terminating answers), nextReason |
| 8 | variable-terms-both-sides | bothSolve, collectSide (positive coefficient; only-constants-cross) |
| 9 | identity-contradiction-equations | howMany (incl. x = 0 as a real solution), whySet |
| 10 | rational-coefficients-lcd | lcdSolve, lcdLine (sums, binomial numerators, minus before a fraction, decimals) |
| 11 | letter-coefficients | rearrange (15 formula/target pairs), formulaCheck (rearrange, then numbers), nonzeroCond |
| 12 | zero-parameter-cases | paramCases (a = 0: all / none; a ≠ 0), paramValue, nonzeroCond |
| 13 | inequality-no-reversal | ineqSolve (incl. v < x read from x's side), ineqGraph (open / closed, direction) |
| 14 | inequality-with-reversal | revSolve (half need the flip), revStep (which step turns it) |
| 15 | inequality-special-cases | ineqCancel, constStatement (0 < 0 vs 0 ≤ 0) |
| 16 | compound-inequalities | compSolve (shift + crossing maps picture), andOr (overlap, empty, union, all), compContext |
| 17 | check-original-equation | checkVerdict (repeat-the-steps and last-line traps), checkSide, firstBad |
| 18 | boundary-test-points | testPoint (missed flip caught or not), whichTests |
| 19 | prove-complete-set | completeArg (one / ray / all / none), memberVsAll |
| 20 | contextual-domain | viable (round down for a limit, up for a goal; calculator), domainPick (count vs amount) |
| 21 | validate-model | modelCheck (at most / at least, roles, strict), critique (right algebra, wrong model) |

Every misconception id is checked against misconceptions.json in the test. Notes: no runtime or kit change; SetLine is
a kit candidate (HS_PLAN §3 item 7, "number line with intervals"). Walk: `tools/walk-solving-linear-equations.mjs`.
