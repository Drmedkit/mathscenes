# Multi-step linear equations with rational coefficients (secondary-t5-44, grade 8, 8.EE.C.7.b)

Slug `multi-step-equations`, 22 sub-goals, 36 families. Direct successor of `two-step-equations` (the pan balance)
and `linear-equations` (x on both sides); their pure maths (`lin.ts`, `solving.ts`, `sidesMaths.ts`) and the
`SidesBalance` block are imported read-only, never edited.

## Concept
Multiplying EVERY term on both sides by the same nonzero number keeps the solutions; a common multiple of the
denominators (the least one is tidiest, any one works) turns a fraction equation into a whole-number one, which is
then solved as before (take the same off both sides, split). Fraction bars group a numerator; a check is done in
the ORIGINAL equation; cancelling x-terms leaves a statement that is always true (every number) or never (none).

## Model: the clearing balance (`ClearBalance.ts`, layout in `clearLayout.ts`, maths in `msMaths.ts`)
The two-step / linear-equations balance with PIECES, drawn by value: a fraction of a bag (teal, x each) is a bag cut
into q vertical strips with p there (the rest a dashed outline); a fraction of a marble (amber) is a marble cut into q
wedges. Steps `stand pieces copy merge` + the SidesBalance steps `takeX takeN split keep open`:
- `copy`: k copies of each WHOLE pan in a grid, each copy in a dashed frame, "× k" under each pan, the beam stays level;
- `merge`: every strip / wedge slides into its slot of a whole bag / marble at exactly the position where SidesBalance
  draws the cleared equation, then SidesBalance takes over (labels "3 bags + 4", takes, rows, open bags).
- `focus.only` copies only some terms (the x pieces, or one pan): the beam tips. That is how "scale only some terms"
  (Maya, the wrong cards) and "multiply only the left side" are shown, not told.
Pure layout is tested: everything inside the frame, every whole item receives exactly its q pieces.
Colours as in the line: x / bags teal (`second`), numbers / marbles amber (`first`), the move lavender (`pick`), the
answer lime (`link`), strikes red. Board on the wide SidesBalance slate, equations aligned on `=`, the move written
under both sides (× 6 | × 6, − 2x − 4 | − 2x − 4, ÷ 2 | ÷ 2), `\dfrac` so numerals stay ≥ 60 px. No leaders (the
pans sit side by side; a leader would cross the other pan): rings and label pulses link symbol and picture.

## The five parts
1. **The question** ½x + ⅔ = ⅓x + 1 on the balance (half a bag + two thirds of a marble | a third of a bag + 1).
   "Multiply every term by 6: which equation?" Cards 3x + 4 = 2x + 1 (the 1 not multiplied: scales-only-some-terms),
   3x + 4 = 2x + 6, 3x + ⅔ = 2x + 1 (only the x-terms) + how sure.
2. **Worked example**, four subgoal steps: Find the multiplier (halves, thirds ringed → 6) → Multiply every term by
   6 (six copies of each pan, the pieces gather: 3x + 4 = 2x + 6) → Solve the whole-number equation (2 bags and 4
   marbles off both pans: x = 2) → Check in the original (both sides 5/3). Why: "why may we multiply every term by 6?"
   (copies of both whole pans balance / only 6 works = only-one-multiplier-clears / only the fractions =
   scales-only-some-terms).
3. **Your turn** ¾x + ½ = ¼x + 3, faded from the end: the multiplier 4 is found for you; the kid picks the cleared line
   (3x + 2 = x + 3 copies only the right pan's bag piece, 3x + 2 = ¼x + 3 copies only the left pan: the beam tips
   both times), types x = 5 from the rows (10 = intermediate), then the left side of the ORIGINAL at x = 5 (17/4;
   17 = derived-equation-check-proves-original); callback to the card.
4. **Prove it** Maya: (2/3)x + 4 = 6, × 3 → 2x + 4 = 18, x = 7. Judge, then a because-chain: her line does not keep
   the balance (only the bag piece is copied, the beam tips, her lines are struck) → × 3 on every term gives
   2x + 12 = 18 (three copies, merge) → x = 3 and it checks (12 off both pans, 2 rows; ⅔·3 + 4 = 6). Distractor
   chips: "whole numbers have no fraction to clear" (scales-only-some-terms), "x = 7 makes 2x + 4 = 18 true"
   (derived-equation-check-proves-original).
5. **Practice** every sub-goal in topic order, then mixed. Pictures: the clearing balance for positive equations it
   can draw (replay after a miss: copy + merge, then takes and rows for "solve" items; howMany shows the balance only
   in the replay, so a tipped beam never gives "no solution" away), stacked lines on a big slate (two equations, a
   worked solution, a step), or the bare board.

## Sub-goal → families (plan.ts)
| # | sub-goal | families | picture |
|---|---|---|---|
| 1 | coefficient-as-multiplier | evalTerm (−¾x at x = −8: coefficient-as-addition, minus-means-negative), coefMeaning | board |
| 2 | equivalent-coefficient-forms | formMatch (2x/3 = (2/3)x, decimals, 0.33x ≠ x/3, forms-treated-as-different), mixedCoef (2½x = 5/2 x; solve) | board / balance |
| 3 | fraction-bar-grouping | barSplit ((x + 2)/3, −(x − 3)/4), barClear | board / balance |
| 4 | equivalent-equations-solution-set | sameSet (one shared value vs identity, some-terms pairs), scaleKeep | two lines / balance |
| 5 | scale-whole-equation | scaleKeep (some terms, × 0), scaleBy (negative, fractional, 0) | balance / lines |
| 6 | choose-clearing-multiplier | lcdPick (unreduced 6/8, product, largest denominator, power of 10), validMult | balance |
| 7 | clear-every-term-two-step | clearLine (some terms, left side only), clearSolve (fractions, decimals, negatives) | balance |
| 8 | collect-like-terms-one-side | collectLine (detached minus, unlike terms), collectSolve | board |
| 9 | distribute-rational-factor | distFirst (reciprocal first, negative factor), distSolve | board / balance |
| 10 | clear-binomial-numerators | barClear (grouping, cross-multiplying a sum, some terms), barSolve | balance |
| 11 | variables-both-sides-rational | bothLine (sign not changed, two x's different), bothSolve | balance |
| 12 | plan-multi-step-strategy | planFirst (method from the numbers), planSolve, exactForm (rounded, precision) | board / balance |
| 13 | identity-after-cancel | howMany, zeroTrap (x = 0) | board → balance replay |
| 14 | contradiction-after-cancel | howMany, makeKind (pick the number / coefficient), zeroTrap | board |
| 15 | check-in-original | checkCand (derived-equation check, repeating steps), checkSide | lines / balance |
| 16 | estimate-reasonableness | estimate (benchmarks, size check, equal-after-rounding), checkCand | board |
| 17 | justify-steps-properties | nameProp (move-and-change-sign), scaleBy | lines |
| 18 | locate-first-invalid-step | firstBad (familiar step, first suspicious result), checkCand | numbered lines |
| 19 | check-versus-justification | oneValue (counterexample, examples-as-proof), sameSet | board |
| 20 | interpret-solution-in-context | planMeaning (bare number, direction), feasible (negative weeks, half tickets) | lines |
| 21 | model-comparison-both-sides | writeModel (word order, reversed bound), planMeaning | board |
| 22 | write-context-for-relation | storyFor (wrong roles, dropped slope sign, reversed bound), writeModel | board |

Every id the topic JSON names is classified somewhere (tested against misconceptions.json, plus the catalogue
ids the classifiers add). Tests: `tests/lesson-multi-step-equations.test.ts`; click-through of parts 1–4:
`tools/walk-multi-step-equations.mjs`. No runtime change was needed.
