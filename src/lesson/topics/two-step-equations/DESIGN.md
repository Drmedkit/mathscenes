# Two-step equations (secondary-t5-19, grade 7, 7.EE.B.4.a)

**Concept.** A two-step expression is a chain of operations done to x (3x + 6: × 3, then + 6). Solving undoes
the chain from the END (− 6 first, then ÷ 3), and every undo is done to BOTH sides, which keeps the solution.
The arithmetic way (27 − 6 = 21, 21 ÷ 3 = 7) and the chain of equations (3x = 21, x = 7) are the same moves.

**Model: the pan balance** (`Balance.ts`, maths + layout in `balanceMaths.ts`). Bags (teal, the x's) and marbles
(amber, the numbers) on two pans of one beam; the beam is level exactly when both sides are equal. Steps:
`stand left right take split keep open`. "Take q off both pans" lifts q marbles from each pan (still level);
"split" lines both pans up in p equal rows, one bag per row, dashed lines between the shares; "keep" ghosts all
rows but one (one bag | x marbles, still level); "open" turns the x on each bag into its value. A move on ONE side
(`focus.gone` + `focus.tilt`) ghosts items on one pan and tips the beam: that is how wrong moves are shown. The
grouped form p(x + q) = r draws p dashed groups (bag + q marbles), split first, then take. Labels under the pans
say what each pan holds now ("3 bags + 6" | "27"). Pure maths: `computeBalance` (x solved, level check, which
marbles a take removes) and `balanceLayout` (every position, tested inside the frame and overlap-free).

**Board.** The forward chain `x →×3→ 3x →+6→ 27`, under it the backward (arithmetic) chain written part by part as
the balance undoes it (`27 →−6→ 21 →÷3→ 7`), then the vertical chain of equations aligned on the = sign with the
move written under both sides (− 6 | − 6, ÷ 3 | ÷ 3), then the substitution check `3(7) + 6 = 27 ✓`. Colour roles:
teal = bags / the x term, amber = marbles / numbers, lavender = the move, lime = the answer. One leader: x = 7 → the
kept share of marbles; groups get rings and label pulses instead (leaders to the left pan would cross the right pan).

## The five parts
1. **The question**: 3 bags + 6 loose marbles balance 27. Cards 11 (adds the 6 again: forward-op-when-backward),
   7, 3 (divides first: undoes-in-wrong-order) + how sure. Board: 3x + 6 = 27, x = ?
2. **Worked example** (same balance), four subgoal steps: Read the chain → Undo the last step first (6 off both
   pans, 3x = 21) → Undo the × 3 (split into 3 shares, keep one, x = 7) → Check it (marbles back, bags open,
   3(7) + 6 = 27). Why-question: "why did the 6 come off before dividing by 3?" (right / either order works =
   undoes-in-wrong-order / "the 6 moves to the right" = term-transfer).
3. **Your turn** 4x + 9 = 33, faded from the end: read + undo the + 9 are given; the kid picks the move that
   undoes × 4 (÷ 4 both sides / left side only = different-operations, the beam tips / × 4 = forward-op), types
   x = 6 (the pan labels hide so the kid counts the share), then checks 4 × 6 + 9 = 33. Callback to the card.
4. **Prove it**: Sam turns 2x + 8 = 20 into x + 8 = 10 (scales-only-some-terms). Judge, then a because-chain:
   Sam's line does not keep the balance (the beam tips, his lines are struck) / 2x = 12 (8 off both) / x = 6 and
   it checks (split into 2). Distractor chips: "moving the 8 across is always allowed" (term-transfer), "divide just
   the first term" (scales-only-some-terms).
5. **Practice**: every sub-goal in topic order, then mixed (runtime/practice.ts). Balance pictures for whole
   positive px + q = r and p(x + q) = r items, with the full solve replayed on a miss.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| op-chain | chainOrder (which chain builds 3(x + 5)?), chainRun (evaluate it) |
| backtrack | thinkNumber (think-of-a-number puzzles), flowBack (fill the box and x backward) |
| equivalent-equations | sameSolution (which equation is equivalent; balance picture), safeMove (× 0, ÷ 0, which move, without re-solving) |
| record-chain | writtenChain (vertical chain vs run-on = signs), matchSteps (arithmetic step ↔ equation step) |
| solve-whole-positive | solve (px ± q = r, q + px = r, r = px + q; balance), balance (bags-and-marbles story) |
| solve-signed | solve (negative p, − (−q), q − px, negative and zero solutions), negCheck |
| solve-rational | solve (x/p + q, (a/b)x + q, decimals, money), firstMove (last step / reciprocal) |
| solve-grouped | solve (p(x ± q), decimals inside, negative and 1/p outside), firstMove, balance (grouped) |
| equation-context | writeEq (gym fee + rate, "less than", perimeter, groups, growth), storySolve (with units; intermediate result diagnosed) |
| equation-to-context | storyFor (which story fits; swapped roles, question mismatch, missing constant), meaning (what the constant / the solution means) |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table, all checked against
misconceptions.json in the test). Notes: no runtime change was needed; the walk blocks Vite's HMR client so other
topics' edits cannot reload the page mid-walk.
