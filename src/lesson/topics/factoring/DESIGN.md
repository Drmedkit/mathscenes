# Factoring (Algebra 1, lesson 16)

Topic `secondary-t6-05-factoring-polynomials`, slug `factoring`, 24 sub-goals, 51 families. Requires `polynomials`
(multiplying with the product box). Goes beyond grade 8 `expand-and-factor` (a(px + q) only): GCF with powers and
negative GCFs, x² + bx + c in every sign case, ax² + bx + c (ac method), difference of squares, perfect squares,
grouping, prime over the integers, factoring completely, dividing by a monomial / by a factor / with a remainder,
justifying (expansion proves, one value does not), completeness, and context (area sides, perimeter / area / volume /
profit / border / missing dimension).

## Concept
Factoring is multiplying read backwards: the product box is full (the polynomial's terms are its cells) and the
sides are unknown. The corners fix the first terms and the product of the constants; the middle cells must add to
the middle term. So for x² + bx + c we need a pair with product c AND sum b (with a ≠ 1: product ac, then split and
group). A factorization is checked by expanding (equal for every x); a correct product is complete only when no
factor factors further over the integers.

## Model
- The polynomials lesson's `ProductBox` (read-only import), drawn with its own side labels hidden: the page draws
  the sides itself at the box's `where` places, as '?' (lavender) until each side is found, then in its degree
  colour. Held-back cells ('?') are the middle cells (the split); at the solve they reveal, cancelling cells
  (difference of squares) are struck. GCF / monomial division use a 1 × n box (the factor on the left, the
  quotient across the top). A box with unknown sides could move to the kit as a ProductBox option.
- `fx.ts`: factored forms (monomial in front × factors with powers), `expand`, integer `pairs` / `sumProd`,
  `irreducible` / `isComplete` (primitive, degree 1 or a non-square discriminant), HTML / TeX writers.
- `common.ts` `choiceItem`: a wrong option equal by value to the right one (seven test x) is dropped unless the
  family marks it `same` (correct-but-incomplete products, a right expression with a wrong unit); with
  `ex.target` (hidden from oracles) the right option must equal the given polynomial, or the generator throws.

## The five parts
1. **The question**: patio x² + 7x + 12 sq ft, box full, sides '?'. Cards (x + 2)(x + 6) (sum unchecked),
   (x + 3)(x + 4), x = −3 or x = −4 (factoring vs solving) + how sure.
2. **Worked example**: corners (x² ringed: both sides start with x; 12 = the two numbers multiplied) → search
   the pairs on the board (1·12 sum 13, 2·6 sum 8, 3·4 sum 7 ✓) with the middle cells ringed → read the sides (cells
   3x, 4x reveal, sides 3 and 4 write on) → expand to check, (x + 2)(x + 6) = x² + 8x + 12 struck. Why sum 7:
   the middle cells / any product-12 pair (sum unchecked) / product 7, sum 12 (roles swapped).
3. **Your turn** x² − 2x − 15, faded: corners and x-sides given; the kid picks the pair (−3 and 5 = larger sign
   reversed; −3 and −5 = a positive product), types the middle coefficient after expanding (2 sign slip, −15 the
   corner), the product writes on. Callback to the card.
4. **Prove it**: Sam: 2x² − 18 = (2x + 6)(x − 3), "it multiplies back, so it is complete". Judge, then a
   because-chain: the product is correct (middle cells struck) → 2x + 6 = 2(x + 3) still factors (left sides
   ringed) → 2(x² − 9) = 2(x + 3)(x − 3). Distractor chips: product-check-proves-complete, examples-as-proof,
   dos-as-squared-binomial.
5. **Practice**: every sub-goal in topic order, then mixed. Box pictures for GCF, division by a monomial,
   trinomials, squares, grouping, the ac method and area items; a big slate with the board otherwise.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | sum-vs-product-form | formPick, formKind |
| 2 | reverse-distribution | numGcfSum (36 + 8 = □(9 + 2)), distBack (box 1 × 2), sameValue |
| 3 | area-model-trinomial | areaSides, areaPair (all cells given), areaParallel (156 = 12 × 13 at x = 10) |
| 4 | verify-by-expansion | verifyJudge (middle sign / wrong constant / right), verifyMid |
| 5 | numeric-gcf-extraction | gcfNum (incl. GCF 1, smaller common factor), gcfOut |
| 6 | monomial-quotient | missingMono (identity and ÷ with x ≠ 0, 9x²·□ = 9x², xy), zeroCond |
| 7 | monomial-gcf | gcfMonoPick (lowest power), gcfMonoOut (the hidden 1) |
| 8 | negative-gcf | negOut, negOne |
| 9 | divide-by-monomial | divTerms (exact, non-exact 1/(3x), constant result), divSigned (negative and fractional divisors) |
| 10 | monic-positive | monicPair, monicPick |
| 11 | monic-both-negative | monicNegPair, monicNegPick |
| 12 | monic-opposite-signs | monicOppPair, monicMixed (all four sign cases) |
| 13 | difference-of-squares | dosPick (incl. x² + k², x² − 8), dosFill |
| 14 | perfect-square-trinomial | pstPick (incl. near misses), pstMid (2AB) |
| 15 | factor-by-grouping | groupPick (incl. x(x + 3) + 2(x + 3)), groupStep (a negative second group) |
| 16 | nonmonic-ac-method | acSplit, acPick (incl. a negative leading coefficient) |
| 17 | prime-over-integers | primeJudge (prime and not; "no real zeros" trap), primeGcf (2x² + 2x + 2) |
| 18 | factor-completely | completePick, completeFill |
| 19 | divide-by-factor-cancel | cancelPick (with the restriction), cancelExcl |
| 20 | divide-by-binomial | longPick (Q + R/D vs "R", keep-dividing), longRem |
| 21 | justify-equivalence-check | agreeProof (agree at x = 0), whyExpand |
| 22 | judge-completeness | judgeWhich, judgeYes (6(x + 1)(x − 1) and 3(x + 2)² are complete) |
| 23 | area-dimensions-application | roomSides, roomAt, roomWidth (a given width) |
| 24 | polynomial-operations-in-context | ctxOp, ctxValue |

Every misconception id the topic names is used (common.ts `MC`, all in misconceptions.json). Tests:
`tests/lesson-factoring.test.ts`; click-through: `tools/walk-factoring.mjs`. No runtime or kit change.
