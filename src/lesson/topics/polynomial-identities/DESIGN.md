# Polynomial operations and identities (Algebra 2, lesson 3)

Topic `secondary-t7-02-polynomial-operations-and-identities`, slug `polynomial-identities`, 14 sub-goals, 34 families.
Requires `polynomials` (Algebra 1: every term times every term, the product box, special products with numbers).
This lesson goes beyond it: an identity is a claim about EVERY value; the special products for arbitrary a and b
(two-variable terms, ab = ba); products of three factors and of bigger factors (sums and differences of cubes);
templates chosen and applied in one step, with chunks as a or b, forward and in reverse (with near-matches to reject);
closure and the degree of a product; proof by rewriting each side; counterexamples; auditing an argument; identities
that explain numbers (51 × 49, 99², consecutive squares, Pythagorean triples).

## Concept
An identity is an equation that is true for every value of its letters. Expanding (a + b)(a + b) proves
(a + b)² = a² + 2ab + b² for every real a and b: the 2ab is two equal cross products (ab and ba are like terms). A
picture of a square shows it for positive lengths only; the algebra never used positivity. One value where two sides
differ disproves a claimed identity; agreeing values never prove one. A proof rewrites each side on its own, with steps
that hold for every value, until both are the same standard form.

## Models
- `AreaSquare.ts` (kit candidate): (a + b)² as a real square cut into a², two congruent ab strips and b², washed by
  role (a² blue, the strips amber, b² teal); dimension lines with side parts; pieces can be asked ('?'); a second
  label set cross-fades in (20 and 3 become a and b); a ghost of one strip swings onto the other (the same rectangle,
  turned: ab = ba); the whole square fades back when a value is negative (no picture, the algebra still holds).
  Clamped to "not to scale" when b's share is outside 0.22-0.45.
- `TripleTriangle.ts` (kit candidate): a right triangle to scale from a Pythagorean triple; morphs between triples
  with cross-faded labels (legs below and right, the hypotenuse outside its slope).
- Reused read-only: `polynomials/ProductBox.ts` (the partial-products box; colours passed per cell by like-term group).
- `idm.ts`: polynomials in several letters with exact rational coefficients, and an expression tree (sum, product,
  power, opposite, explicit chunk brackets) that is written as built (TeX / HTML) AND expanded exactly. Every choice
  list of expressions goes through `exChoice` (common.ts), which drops a wrong choice that expands to the same
  polynomial as the answer: no distractor can be secretly right.

## The five parts
1. **The question**: a 23 ft square deck, cut into 20 ft + 3 ft: (20 + 3)² = ? Cards 409 (squares each part,
   function-distributes-over-sum), 529, 452 (middle part 2·20 + 3, middle-term-2a-plus-b) + how sure.
2. **Worked example** on the area square: cut it (400 + 60 + 60 + 9 = 529) → the numbers become a and b ((a + b)(a +
   b) = a² + ab + ba + b²) → the strip swings onto the other (ab = ba): a² + 2ab + b² → every real value: a = −5,
   b = 2 has no picture, the square fades, 9 = 9; a² + b² = 29 is struck. Why the 2ab: two cross products / squaring
   each part (fn-sum) / 2a + b.
3. **Your turn** (a − b)² on the product box, faded from the end: row 1 given; the kid picks row 2 (−ab, +b²;
   minus-sign-spreads, unlike-signs-product-positive), types the ab coefficient (−2), then a² − b² at a = 5, b = 2
   (21 ≠ 9: a counterexample to (a − b)² = a² − b²). Callback to the card.
4. **Prove it**: Dana checks (x² + y²)² = (x² − y²)² + (2xy)² at x = 2, y = 1 and calls it proved. Judge, then a
   because-chain (left side by the square of a sum with a = x², b = y²; right side by the square of a difference and
   (2xy)² = 4x²y²; collect; both sides the same standard form, for every value). Distractor chips: squaring each term,
   (2xy)² = 2x²y², Dana's check, "simplify both sides to 0 = 0". Payoff: the triangle morphs 3-4-5 → 5-12-13 → 15-8-17.
5. **Practice**: every sub-goal in topic order, then mixed. Pictures: the product box (cells fill, like cells ring,
   cancelling cells strike; a held-back cell shows '?'), the area square (pieces asked), a chain of lines on a slate
   (proofs with a '?' line written in at the solve; audits with the broken step ringed), else a big slate.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | identity-meaning | classify (every / some / no value, linear and quadratic), identityPick (one true right side) |
| 2 | two-variable-terms | monoProd ((3x)(−2y), (kxy)², a·b exponents), collect2 (ab + ba, x²y vs xy²), likeTwo |
| 3 | square-of-sum-structure | sumSquareNum (deck/patio pieces, area square), sumSquareSym (letters; where 2ab comes from) |
| 4 | square-of-difference-structure | diffSquare ((a − b)², (b − a)², −(a − b)²), lastTerm (the (−b)(−b) cell) |
| 5 | sum-times-difference-structure | conjExpand ((a + b)(a − b), (a − b)(a + b), 3x ± 2), conjCancel (the ab coefficient is 0) |
| 6 | extended-multiplication | triple ((x + p)(x + q)(x + r), (x + p)³, (2x − 1)³), bigCoef (3 × 3 box), cubes (sums/differences of cubes) |
| 7 | special-products-direct | whichPattern (incl. none: (x + 3)(x − 4)), oneStep ((ax ± b)², (3x − 2y)², (x² + 3)², (2x + ½)²), middleCoef |
| 8 | composite-inputs | chunkExpand (((x + 1) + 3)((x + 1) − 3), (x + y ± k), (x + y + k)², (x² ± k)), chunkName |
| 9 | reverse-special-products | factorChunk ((x + s)² − k², (x + y)² − k², x² − (y − k)², (2x − 1)² − x², chunk perfect square, x⁴ − y⁴), nearMatch |
| 10 | closure | closureWhich (product, cancel to a constant, two-variable sum, quotients), degProduct |
| 11 | prove-by-expansion | proofStep (missing line of a separate-sides proof), proofLogic (what counts as a proof) |
| 12 | counterexample-refute | counterPick (separating values; what one counterexample means), counterValues (both sides at a pair) |
| 13 | error-locate-repair | firstBad (first invalid step or none), repairStep, auditLogic (valid / examples / circular / algebra error) |
| 14 | numerical-relationships | mentalProduct (51 × 49), squareMental (99²), consecutive ((n + 1)² − n²), pyTriple |

Every wrong answer the classifiers recognise carries its catalogue id (common.ts `MC`; all 28 ids the topic names are
used, plus 4 shared ones; all exist in misconceptions.json). Tests: `tests/lesson-polynomial-identities.test.ts`;
click-through: `tools/walk-polynomial-identities.mjs`. No runtime or kit change was needed.
