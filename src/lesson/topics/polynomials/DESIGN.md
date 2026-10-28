# Polynomial expressions (Algebra 1, lesson 15)

Topic `secondary-t6-04-algebraic-expressions-and-polynomials`, slug `polynomials`, 27 sub-goals, 56 families.
Goes beyond the grade 8 lesson `expand-and-factor` (linear expressions, a(px + q)): here terms have POWERS, so the
lesson is about degree, standard form, collecting by power, the opposite of a whole polynomial, and multiplying
polynomials of up to three terms each (every term times every term), with special products, closure, auditing a
rewrite and context. Factoring is left to `factoring`.

## Concept
A polynomial is a sum of signed terms whose exponents are whole numbers. Each term's POWER decides what it can
combine with: like terms share a power (x² with x², never with x), and their coefficients add while the exponent
stays. Adding is collecting all terms by power; subtracting is adding the opposite of the WHOLE subtracted polynomial
(every sign flips); multiplying is every term times every term (m × n partial products), then collecting by power.
Two forms are equal only when they agree for every x: one test value that disagrees disproves a rewrite, agreeing
values prove nothing.

## Models
- `ProductBox.ts` (kit candidate): an m × n box of partial products. Factor terms down the left and across the top,
  each cell = row term × column term, washed in its DEGREE colour. With both factors in standard form like terms lie
  on a diagonal, which is where collecting happens (rings). Cancelling cells are struck ((a + b)(a − b)); a cell can
  be asked ('?') or missing (dashed red: FOIL's firsts-and-lasts slip). Optional side words (units). Steps
  `frame sides cells collect`; `rowK` fills one row at a time.
- `DegreeShelf.ts` (kit candidate): a shelf with one column per power (x⁴ … x, number). Signed term cards (each card
  carries its own sign). A polynomial can lie loose in its written order on a strip above; `sort` slides each card
  into its power's column (standard form = read left to right; an empty column = a missing power, coefficient 0;
  the leftmost filled column = the degree). Rows are polynomials (adding = vertical layout with gaps), `flip` turns
  a row into its opposite (per-card `flipK`: Riley's slip flips only the first card), `sum` writes column totals.
- `poly.ts`: exact polynomial maths (rational coefficients, x and y exponents, written order kept, `collect`, `mul`,
  `table`, `degree`, `evalP`) and TeX / HTML writers (HTML exponents as `<sup>`, a hair space after an exponent
  before a letter, so plain text reads `3x^2 y − x + 1/2 x^2`).
- Colour roles by degree, the same in pictures, board and panel: constant teal (`second`), x amber (`first`), x²
  blue (`water`), x³ lavender (`pick`), x⁴ brown; the answer lime (`link`), wrong red.
- Board: a wider board (x 1070-1860) than the standard one; long lines wrap at a top-level + or − (`stack` in the
  page), never below 60 px. No leader lines: colour + rings link a symbol to its cell.

## The five parts
1. **The question**: a square garden x ft on a side, 3 ft longer and wider: (x + 3)² = ? on the empty box. Cards
   x² + 9 (function-distributes-over-sum), x² + 6x + 9, 2x + 6 (power-as-base-times-exponent) + how sure.
2. **Worked example** on the box: write the square as a product (both sides x + 3) → every term times every term
   (4 cells write on; board x² + 3x + 3x + 9) → collect (the two 3x cells ringed: x² + 6x + 9, "quadratic
   trinomial") → check at x = 2 (25 = 25 ✓; x² + 9 = 13, the two strips flash as missing, the line is struck).
   Why the 6x: two of the four partial products / squaring squares each term (fn-sum) / x and 3 combine (unlike).
3. **Your turn** (x − 2)(x² + x + 3), faded from the end: the box and row 1 are given; the kid picks row 2
   (partial-distribution, unlike-signs-product-positive), types the x² coefficient (−1; −2 = a missed partial
   product), the x coefficient (1), the degree (3; 4 = degree-is-term-count, 6 = degree-sum-of-exponents).
   Callback to the part 1 card.
4. **Prove it**: Riley: (5x² + 3x − 2) − (2x² − 4x + 1) = 3x² − x − 1 (negates only the first term). Judge, then
   a because-chain on the degree shelf: not equivalent (x = 1: 7 ≠ 1, Riley's line struck) → the opposite of the
   whole polynomial (row B: Riley's flip of the first card, the two kept cards ringed red, then all flip) → collect
   by power (the sum row: 3x² + 7x − 3). Distractor chips: counterexample-as-exception, negate-first-term-only,
   examples-as-proof.
5. **Practice**: every sub-goal in topic order, then mixed. Pictures: the box (products; cells fill, diagonals
   ring, cancelling cells strike at the solve), the shelf (reading, collecting, adding, opposite, subtracting:
   sort, flip, sum at the solve), a numbered chain slate (auditing a rewrite, with values at a test x), else a big
   slate with the board.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | exponent-reading | powerRead (x·x·x, 3x² vs (3x)², implicit 1), powerEval (x² vs 2x, kx², (kx)², −x², x³ at 3, −2 …) |
| 2 | poly-definition | isPoly, notPoly (x/2 + 1, −7, 0.5x; 2/x, √x, x⁻², 2ˣ) |
| 3 | signed-terms | countTerms (shelf), whichTerms (sign attached / detached / split into factors) |
| 4 | coefficients | coefOf (implicit ±1, decimal, missing power = 0, constant), coefPick (x/4, (1/2)x, −x/5) |
| 5 | degree-of-term | termDegree (7x², constant, x), degreeHigh (big coefficients on low powers) |
| 6 | degree-of-polynomial | polyDegree (scrambled, missing powers, constant; shelf), degreeCh (zero polynomial, constant) |
| 7 | name-by-term-count | termName (x⁵ and 3x² are monomials) |
| 8 | name-by-degree | degreeName, fullName (x³ + 1 cubic binomial) |
| 9 | standard-form | stdForm (signs travel with terms), leadCoef (first written ≠ leading) |
| 10 | multivariable-degree | mvDegree (term and polynomial), mvHigh (largest single exponent is not highest) |
| 11 | like-terms-powers | likePick, likeCount |
| 12 | multivariable-like-terms | mvLike (x²y vs xy², yx = xy), mvPair |
| 13 | combine-like-terms-powers | collect (shelf), collectCoef (decimals), collectName (leading term cancels) |
| 14 | add-polynomials | addPoly (shelf rows; fractions/decimals), addVertical (one column) |
| 15 | opposite-of-polynomial | opposite (shelf flip), oppositeCoef |
| 16 | subtract-polynomials | subPoly (double negatives), subCoef |
| 17 | multiply-monomials | monoMul (x·x, ±1, fractions, unequal exponents), monoMulPair (coefficient, exponent) |
| 18 | monomial-times-polynomial | monoPoly (box 1 × n), monoPolyCoef |
| 19 | binomial-times-binomial | binBin (non-monic, (x² + 1)(x − 3)), binBinCoef (pair) |
| 20 | square-of-binomial | squareBin, squareMid |
| 21 | sum-times-difference | conj (cross products strike), conjMatch (vs (x − a)², (x + a)²) |
| 22 | multi-term-products | multiTerm (2 × 3, 3 × 3, trinomial squared), multiCoef (one diagonal), cellCount |
| 23 | counterexample-test | testValue (0 and 1 hide errors), testVerdict (agreement proves nothing; one disagreement disproves) |
| 24 | locate-invalid-step | badStep (product / subtraction / monomial chains, or no error), badStepSub (values at a test x) |
| 25 | explain-and-repair | nameError (rule vs answer swap), repair |
| 26 | closure | closure (+, −, × always; ÷ not; a constant result is still a polynomial), closureEx |
| 27 | interpret-in-context | ctxMeaning (patio, box, profit), ctxWrite (patio, box, frame, profit), ctxValue |

Every wrong answer the classifiers recognise carries its catalogue id (common.ts `MC`, all 48 ids the topic names
are used and exist in misconceptions.json). Tests: `tests/lesson-polynomials.test.ts`; click-through:
`tools/walk-polynomials.mjs`. No runtime or kit change was needed.
