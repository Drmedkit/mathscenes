# Radicals and rational exponents (Algebra 1, lesson 12)

Topic `secondary-t6-03-radicals-and-rational-exponents`, slug `radicals-exponents`, 28 sub-goals, 58 families.
Goes beyond the grade 8 lesson `integer-exponents` (whole-number exponents on the factor mat): here the exponent is a
FRACTION, the laws are used with rational exponents, radicals are simplified and combined, and stage 3 asks when a
root or a rational power is a real number at all (negative bases, domains, |x|, when a law may be used).

## Concept
An exponent counts equal FACTORS. On the exponent line, equal steps are equal factors: one whole step of the base
multiplies by a, so n equal hops of 1/n must each multiply by the number whose nth power is a. That is why a^(1/n)
is the principal nth root ((a^(1/n))^n = a^1 = a, the power-of-a-power rule forces it), a^(m/n) is m such hops
((ⁿ√a)^m, root first keeps it small), and a negative exponent hops to the LEFT, dividing (a reciprocal, never a
negative number). Radicals follow: an nth root takes a GROUP of n equal factors out as one factor (√72 = √(2·2·2·3·3)
= 2·3·√2). Every law is proved for positive bases; a negative base needs each step checked (the flawed chain −2 = 2).

## Models
- `ExpLadder.ts`: the exponent ladder. Tiles for the powers of one base on a line of exponents k/n (unreduced, equal
  steps), arcs between neighbours with the hop factor (× 2), brackets over runs of hops (a product = hops joined),
  a "?" tile for the asked power, dashed tiles for values not known yet. Computes nothing itself; the values come from
  `rad.ts` `powQ` (exact). Throws when ticks are closer than 100 px or a value / label does not fit. Kit candidate
  ("multiplicative number line").
- `RootTiles.ts`: prime-factor tiles under a radical (index shown for n > 2); groups of n equal tiles are ringed, one
  tile of each group drops out in front of a new radical, the rest of the group fades, the leftover tiles drop under
  the new radical. Kit candidate (simplifying radicals with numbers and variables).
- Domain items use the kit `Plane` in the replay: the radicand line (dashed), the allowed band, the root curve and
  the boundary point (closed for √, open for 1/√).
- The flawed chain (part 4 and `flawStep`) is a slate of steps with ✓ / ✗ marks drawn in the page (`chainRig`).
- `rad.ts`: exact roots (`iroot`), rational powers of rational bases with the lowest-terms convention (`powQ`:
  value / irrational / notreal), simplest radical form (`extract`), surds Σ c√r with + − × (`Surd`), TeX / HTML
  (a root in HTML is `√<u class="rb">…</u>` with hidden parentheses so plain text reads √(x + 4)).
- Colour roles: the asked power amber (`first` on the board), tiles teal (`second`), answers and lit tiles lime
  (`link`), the asked tile and focus lavender (`pick`), the broken step red (`wrong`).

## The five parts
1. **The question.** 8^(2/3) on the ladder (1 at 0, 8 at 1, "?" at 2/3). Cards 4 / 16/3 (power-as-base-times-exponent)
   / 17/3 (two thirds of the way in equal sums: root-by-linear-interpolation) + how sure.
2. **Worked example** (Whole steps → Split a step into three → Two of the hops → Power first): 1, 8, 64 with hops × 8;
   the ladder becomes thirds, three hops × r with r·r·r = 8, r = 2 = ∛8; 8^(2/3) = (∛8)² = 4 (tiles light up);
   ∛(8²) = ∛64 = 4. Why 8^(1/3) = 2: "three equal hops make × 8" / "8 × 1/3 ≈ 2.7 rounds to 2" (base × exponent) /
   "a calculator says so" (examples-as-proof).
3. **Your turn** 16^(−3/4) on a quarter ladder from −3/4 to 1, faded from the end: 16^(1/4) = 2 is given (four hops,
   2·2·2·2 = 16); the kid types 16^(3/4) (12 = base × exponent, 64 = root and power swapped), then 16^(−3/4) as a
   fraction (a negative = negative-exponent-makes-negative, 8 = the reciprocal forgotten); the left hops draw on and
   1/8 lights; callback to the card.
4. **Prove it.** Jay's chain −2 = (−8)^(1/3) = (−8)^(2/6) = ((−8)²)^(1/6) = 64^(1/6) = 2. Judge (Jay is right =
   exponent-laws-without-restrictions), pick the broken step (1 = odd-root-of-negative-undefined, 2 =
   domain-from-wrong-feature, 5 = every-radical-as-plus-minus), then a because-chain: steps 1, 2, 4, 5 hold (✓ on the
   slate), so step 3 breaks (✗, the law needs a > 0; −2 = 2 is struck). Distractor chips: odd root not real, 64^(1/6)
   = ±2, laws hold for every base, no law works for negative bases (rejects-all-negative-base-exponent-laws).
5. **Practice.** All 28 sub-goals in topic order, then mixed. Ladder pictures for roots and numeric powers (hops and
   values appear in the replay), tiles for simplest radical form, a Plane graph for domains (replay), the chain slate
   for `flawStep`, a big slate otherwise. Exponent answers are typed as a fraction (pair: numerator / denominator, any
   equivalent fraction accepted); simplest radical form as a pair (coefficient, radicand).

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | nth-roots | rootEval (index 2-5, odd roots of negatives, 0 and 1), rootReal (even root of a negative, ± traps) |
| 2 | unit-fraction-exponent | unitEval, unitForm (non-perfect bases), unitWhy (the (a^(1/n))^n = a argument) |
| 3 | rational-exponent-m-over-n | mnEval (proper, improper, unreduced 16^(2/4)), mnForm (both directions) |
| 4 | negative-rational-exponent | negEval (unit / non-unit, fractional bases, decimal exponents), negForm |
| 5 | variable-notation-translation | toExp (whole radicand vs coefficient outside), negForm, mnForm |
| 6 | exp-law-product | prodExp (pair exponent), prodCoef (coefficients, positive-exponent answer), prodNum (ladder spans) |
| 7 | exp-law-quotient | quotExp (positive / zero / negative differences), quotNum |
| 8 | exp-law-power-of-power | powPow, powPowNum |
| 9 | exp-law-power-of-product | prodPow ((8x⁶)^(2/3), (x²y⁴)^(−1/2)), coefOut (∛(8x) = 2x^(1/3)) |
| 10 | radical-product-rule | radProd (square, signed cube, fourth roots, √a·√a), sumVsProd (√(9 + 16) vs √9 + √16) |
| 11 | radical-quotient-rule | radQuot (signed cube roots too), radQuotForm (√(5/4); which quotient may be combined) |
| 12 | extract-perfect-powers-numeric | simplifyRoot (square and cube, nothing to extract), simplestPick (partial forms) |
| 13 | extract-variable-powers | varExtract (x ≥ 0, cube roots), varPower (groups of the index) |
| 14 | like-radicals | likeAdd (like, like after simplifying), likeWhich (unlike, other index, integer + radical) |
| 15 | distribute-radicals | monoMono, monoSum (√p(√q + c), a√p(b − √p)) |
| 16 | radical-binomial-products | binProd (incl. squares), conjProd |
| 17 | rationalize-monomial-denominator | ratMono (k/√m, √(p/q), c/∛m), ratFactor (which form of 1) |
| 18 | operate-variable-radicals | varLike (simplify, then combine), varMulDiv |
| 19 | rationalize-binomial-denominator | ratBin, conjPick |
| 20 | choose-form-and-calculator | calcKeys (parentheses; piano, monthly growth), estimate (bounds; sanity-check a calculator value), combineForm |
| 21 | rational-power-existence | negBaseReal (lowest-terms convention), minusParen (−a^(m/n) vs (−a)^(m/n)) |
| 22 | domain-linear-radicand | domLin (√, ⁴√, (x − c)^(3/2); reversal), domKind (odd roots, even powers) |
| 23 | domain-radical-denominator | domDen (√ and ∛ in a denominator), allowedInput |
| 24 | domain-rational-power | domPow (x^(m/n), unreduced, x⁰), domPowLin ((x − c)^(m/n)) |
| 25 | even-root-absolute-value | absRoot (√(x²) = |x|, √(x⁴) = x², ∛(x³) = x, √(72x²)), absCheck (x negative) |
| 26 | exponent-law-validity | flawStep (the chain, several bases), lawHolds (true for every x?) |
| 27 | preserve-domain-when-rewriting | keepDomain, samePair |
| 28 | context-domain | ctxDomain (melting ice sheet, pendulum length), ctxOverlap |

Calculator items are marked "(calculator)"; the rest are no calculator. Every misconception id is checked against
misconceptions.json in the generic test. No runtime or kit change. Walk: `tools/walk-radicals-exponents.mjs`.
