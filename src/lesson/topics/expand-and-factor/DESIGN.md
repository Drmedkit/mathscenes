# Expand, combine, and factor linear expressions (grade 7, 7.EE.A.1–2)

Topic `secondary-t5-18-expressions-expand-and-factor`, slug `expand-and-factor`, 22 sub-goals.

## Concept
An expression can be rewritten without changing its value, and the distributive property is the rewrite that
moves between a product and a sum: a(x + b) = ax + ab, read both ways (expand → / ← factor). Like terms (same
variable part) combine because ax + bx = (a + b)x; a sign belongs to the term after it; two expressions are
equivalent only when they agree for EVERY x (one counterexample refutes, checks alone never prove).

## Models (concreteness fading: tiles → box → bare notation)
- `AreaTiles` (AreaModel.ts): a(px + q) built from algebra tiles to scale. Rows = the factor; each row = p amber
  x-strips (an unknown length, 3.3 squares, never a whole number) + q teal unit squares. Split at the seam, both
  parts keep ALL rows: the squares are a·q, not q (the 4x + 3 slip is visibly three rows of squares short).
  `join` slides them back = factoring. Steps frame, row, rows, split, area, join; `count` drops a lime dot on
  each square.
- `AreaGrid` (AreaModel.ts): the generic box for signs, fractions, decimals, monomials. Factor left, terms on top,
  cells = factor × term; any part can be asked ('?'): cells for expanding, factor/terms for factoring.
- `TermTiles`: combining like terms. Terms lie in written order, sort into an x-tray and a constants tray,
  negative tiles (dark, drawn minus bar) pair with positive ones as zero pairs and leave; the rest is counted.
- `ValueTable`: two expressions evaluated side by side; = rows ringed lime, ≠ rows ringed lavender.
Colour roles everywhere (picture, board, panel): x-terms amber (`first`), constants teal (`second`), the answer /
equivalence lime (`link`), focus and counterexamples lavender (`pick`), x² blue (`water`), y lemon. Strike = `wrong`.
Layout: model frame x 60–1040, a wider board x 1100–1860 (chains of equalities need room). No leader lines: in this
model the parts sit side by side, a leader to the strip part would cross the squares, so a symbol is linked to its
part by colour + a ring/pulse while it writes on (LESSON_LINE rule 3).

## The five parts
1. **The question** — garden bed 4 ft wide: x ft tomatoes + 3 ft herbs, area 4(x + 3). Cards 4x + 3
   (partial-distribution), 4x + 12, 16x (combines-unlike-terms) + how sure.
2. **Worked example** 4(x + 3), four subgoal steps: Build (row ring, rows drop in, factor pulses) → Split (the
   squares slide off; = 4·x + 4·3 with each part ringed) → Count (dots on all 12 squares, area labels;
   = 4x + 12) → Both ways (hero 4(x + 3) = 4x + 12, "the distributive property", expand →, ← factor as the
   parts slide back). Why "+ 12, not + 3?": every row has 3 squares / the 4 only multiplies the x
   (partial-distribution) / PEMDAS (names-non-property).
3. **Your turn** 3(2x + 5), faded from the end: Build and Split play by themselves; the kid types the areas
   (□x + □; partial, concatenation 32x and unlike-combining are classified), names the property, and reads it
   backwards 6x + 15 = □(2x + 5) (factors-out-of-one-term-only); callback to the part 1 card.
4. **Prove it** Riley: "2(x + 3) and 3x + 4 are equivalent, I tried x = 2 (both 10)". Judge, then a because-chain:
   2(x + 3) = 2x + 6 (distributive; the box fills) → at x = 0: 6 ≠ 4 (substitute; the table row) → not
   equivalent (one counterexample; the other rows fill, x = 2 is the only match, Riley's = is struck). Distractor
   chips: PEMDAS-as-property, examples-as-proof, counterexample-as-exception.
5. **Practice** — every sub-goal in topic order (runtime/practice.ts), then mixed. Pictures: tiles, box, term
   tiles, value table, or the bare board.

## Sub-goal → families
| # | sub-goal | families | picture |
|---|---|---|---|
| 1 | equal-sign-relational | equalSign (true/false with reasons, run-on chain, box) | bare |
| 2 | classify-like-terms | likeTerms (which is like, hidden 1, finished?, letters are numbers) | bare |
| 3 | reorder-regroup | property (commutative vs associative vs none) | bare |
| 4 | model-distributive | areaToSum, areaToProduct | tiles / box |
| 5 | equivalence-meaning | equivalent | value table |
| 6 | expand-positive | expand | tiles / box |
| 7 | collect-positive | collect | term tiles |
| 8 | read-signed-terms | signedTerms | bare |
| 9 | collect-signed | collect | term tiles |
| 10 | expand-negative | expand | box |
| 11 | rational-coefficients | expand, collect | box / bare |
| 12 | expand-then-collect | expandCollect | box |
| 13 | subtract-expression | subtract | bare |
| 14 | factor-given-factor | factorOut | box (terms asked) |
| 15 | factor-gcf | gcf, twoFactorings | box (factor + terms asked) |
| 16 | factor-signed-rational | factorOut | box |
| 17 | two-variable-rewrites | twoVar | bare |
| 18 | property-justified-chain | nameStep, faultyStep | bare (aligned chain) |
| 19 | counterexample-logic | counter | value table |
| 20 | context-forms | context | tiles / bare |
| 21 | monomial-distribute | monomial | box |
| 22 | monomial-factor | monoFactor | box |

Every wrong answer the classifiers know carries its catalogue id (all 40 ids the topic JSON names except the
optional percent extension). Tests: `tests/lesson-expand-and-factor.test.ts`; click-through:
`tools/walk-expand-and-factor.mjs`.
