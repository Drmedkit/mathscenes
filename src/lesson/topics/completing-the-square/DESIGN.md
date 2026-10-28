# Solving quadratics: square roots, completing the square, the formula (Algebra 1, lesson 18)

Topic `secondary.solving-quadratic-equations-by-completing-the-square-and-the`, slug `completing-the-square`,
16 sub-goals, 41 families.

## Concept
x² + bx is an x-by-x square with a b-by-x strip. Cut the strip in half and turn one half under the square: the same
area is now a square with one (b/2)-by-(b/2) corner missing. Adding (b/2)² fills it, so x² + bx + (b/2)² = (x + b/2)²,
and what is added on one side of an equation is added on the other. A square equal to q has two roots when q > 0,
one when q = 0, none when q < 0: that is the discriminant, and doing all of it once with letters IS the quadratic
formula.

## Models
- `CompleteSquare.ts` (block): the x² square (teal), the bx strip (amber), the cut and the half that swings under the
  square, the missing corner (dashed "?", then lime with its area), the bracket with the side x + h. Steps
  `sq strip halve corner fill side`, rings on strips / corner / all, `hideCorner` keeps the corner's number off until
  the replay. Positive h only (a negative h has no honest area picture; those items use a slate). Labels shrink to
  44 px and the block throws when a label does not fit its piece. Kit candidate (area model of (x + h)²).
- The kit `Plane` for graphs: parabolas with their x-intercepts (graph items, shown at once) and the solution set of
  an inequality on the x-axis (lime band, open/closed ends; replay only, so the answer is never on screen before).
- `quad.ts`: exact roots of ax² + bx + c = 0 in simplest radical form ((P ± K√m)/Q, reduced), completing the square
  with exact fractions, text for TeX / HTML (linear fractions in choices so plain text reads unambiguously), and
  `noTie` for rounded answers.
- Colour roles: the strip and the h side amber (`first`), the square teal (`second`), the corner, the added terms and
  the answers lime (`link`), focus lavender (`pick`).

## The five parts
1. **The question.** x² + 6x = 16 on the square and its strip. Cards 2 and −8 / 1 and −7 (the 9 added on one side
   only: one-side-only) / 2 only (only-positive-root) + how sure.
2. **Worked example** (Split the strip → Fill the corner → Read the big square → Take both square roots), board
   x² + 6x = 16 → x² + 6x + 9 = 16 + 9 → (x + 3)² = 25 → x + 3 = ±5 → x = 2 or x = −8. Why two solutions: both
   roots / "−8 is extra, a side can't be negative" (only-positive-root) / "always two" (repeated-root-two-solutions).
3. **Your turn** x² + 8x = 9, faded from the end: the split is given; the kid types the corner 16 (4 = cs-wrong-term,
   8 or 64 = incomplete formula), the right side 25 (9 = cs-unbalanced), both roots 1 and −9 (±5 = forgets-to-add-h,
   one root twice = only-positive-root, 9 and −1 = sign); callback to the card.
4. **Prove it.** Lee: "the formula has nothing to do with completing the square". Judge (right = formula-unrelated-to-cs),
   then a four-claim because-chain on a wide board: divide by a and move c/a; add (b/(2a))² to both sides; the
   perfect square = (b² − 4ac)/(4a²); both roots and subtract b/(2a) = the formula. The letter square (b/a x strip,
   b/(2a) corner) moves with each claim. Distractor chips: divide only x² (cs-not-dividing-a), add (b/2)²
   (cs-not-dividing-a), split the root over the minus (distributes-root-over-sum).
5. **Practice.** All 16 sub-goals in topic order, then mixed. Area picture for positive h (the corner fills in the
   replay), Plane for graph and inequality items, a slate otherwise. Exact irrational answers are choices among forms
   that differ by one typical slip (each checked to have different roots); rational roots are typed (pair, either
   order, decimals for halves); fractions in the fraction box; rounded answers avoid ties (π items keep 0.25 of a
   hundredth away from a tie, so 3.14 and the π key agree).

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | perfect-square-trinomial | pstSpot (one real perfect square among non-examples), pstWrite (h, signed, fractional last), pstMiddle (the middle coefficient 2h, picture) |
| 2 | completing-term | fillTerm ((b/2)², picture), fillPair (x² + bx + □ = (x ± □)²) |
| 3 | complete-square-even-b | csRhs (the right side after adding), csSolve (integer roots, pair), csExact (q > 0 irrational, q = 0, q < 0) |
| 4 | complete-square-odd-b | oddTerm (b²/4 as a fraction), oddRhs (exact fraction), oddSolve ((−b ± √D)/2) |
| 5 | complete-square-nonmonic | nmDivide (divide every term), nmTerm ((b/(2a))²), nmSolve (exact roots) |
| 6 | quadratic-formula-apply | readABC (standard form first), discVal, formulaSolve (rational, pair), formulaExact, formulaRound (calculator) |
| 7 | choose-method | pickMethod (square roots / zero product / completing the square / formula, "no factors = no solution" trap), sqrtSolve |
| 8 | letter-fraction-bridge | twinFrac (numbers first), letterFrac (b²/(4a²) ± c/a), whyNonzero |
| 9 | literal-complete-square | literalTerm (what completes x² + (b/a)x), literalNext (the next line of the general derivation) |
| 10 | derive-formula | deriveNext (×4a², ± roots, solve the linear equation; letters or a numerical twin), deriveWhy (a ≠ 0, ±, negative a, D < 0) |
| 11 | discriminant-count | discCount (two / one / none), discKind (rational / irrational / one rational / none) |
| 12 | discriminant-graph | graphMatch (crosses / touches / misses), graphRead (intercepts from the graph) |
| 13 | check-irrational-exact | exactCheck (substitute r ± √s exactly), roundCheck (a rounded check leaves a small gap) |
| 14 | write-quadratic-from-context | ctxModel (rectangle, frame, consecutive integers, revenue, projectile), ctxSolve, ctxRoots (keep, reject, interpret no real solution) |
| 15 | rearrange-formula-square-root | rearrange (principal root vs ±, divisor conditions), rearrangeEval (calculator, hundredths) |
| 16 | solve-quadratic-inequality | ineqSet (between / outside, endpoints, irrational zeros, x² < k², a < 0, projectile), ineqSpecial (all reals, none, one point, all but one) |
