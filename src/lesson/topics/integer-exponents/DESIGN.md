# Integer exponents (grade 8, 8.EE.A.1)

Topic `secondary-t5-27-integer-exponents-and-scientific-notation`, slug `integer-exponents`, 17 sub-goals.

## Concept and model
The concept that carries the topic: **an exponent counts factors of the base, and its sign says on which side of the
bar they sit** (top = multiply, below the bar = divide). Every product starts from 1, so with no factors left the
value is 1, not 0 (a⁰ = 1), and a⁻ⁿ is 1 over n factors (never a negative number). All the rules come from counting:
product = join the rows, quotient / negative exponent = a tile on top cancels a tile below (base ÷ base = 1),
power of a power = repeat the group, power of a product = regroup the tiles.

- `FactorMat.ts`: the factor mat. A dashed 1 tile at the left of each row; factor tiles (washes in role colours,
  digits 64 px TeX in dark ink) with × signs between them; a fraction bar; brackets naming a group by its power
  (above the top row, under the bottom row, or under a product without a bar), an empty dashed slot for a zero power;
  `c<i>` rings a top/bottom pair in lime and fades both to ghosts; `sort` slides tiles to new slots (tiles moving left
  lift so they never pass through another); `one` lights the 1 tile as the value. `computeMat` counts the tiles and
  asserts the value base^(top − bottom) exactly (expo.ts, repeated multiplication). Throws when slots or bracket labels
  do not fit; `matFits` (pure) lets generators make only drawable pictures.
- `Colony.ts`: a painted petri dish with a colony whose AREA is to scale (1 mm² = radius 53 px), the concrete object
  of the story; 2⁻³ mm² is a visible speck, not a negative area.
- `expo.ts`: exact powers (0 to a zero or negative power throws), TeX / HTML formatting, reading an answer with a minus
  sign in any box.
- Colour roles: first (amber) = factors you multiply by / the amount; second (teal) = factors you divide by; link
  (lime) = the answer, the 1 tile as value, cancelled pairs; pick (lavender) = the board column the mat shows now;
  wrong (red) = Sam's 0 tile and struck claim.
- Layout: the board on top (y 34–404), the mat below at the left, the dish (parts 1–2) at the right; readouts of the
  mat's value right of the mat. No leaders: the board column the picture shows is ringed instead (no rails through
  notation).

## The five parts
1. **The question.** A colony doubles every hour; 1 mm² at noon, 8 mm² = 2³ at 3 pm. At 9 am, t = −3: 2⁻³ = ? Cards
   −8 mm² (negative-exponent-makes-negative) / 1/8 mm² / −6 mm² (power-as-base-times-exponent) + how sure. Three dishes:
   9 am "?", noon, 3 pm.
2. **Worked example** (Write the factors → Go back: divide by 2 → Keep dividing → Read it): 2³ as 1 × 2 × 2 × 2; each
   hour back a teal 2 goes below the bar and cancels a 2 on top, the table column 2^k / value writes on with a ÷2
   arc, the dish halves; at noon the 1 tile lights up (2⁰ = 1); past noon the 2s stay below the bar, bracket 2⁻³;
   readout 1/8. Why? "each step divides by 2" (right) / "the minus sign belongs to the answer"
   (negative-exponent-makes-negative) / "2⁻³ means 2 × (−3)" (power-as-base-times-exponent).
3. **Your turn** 3² ÷ 3⁵ (a tripling colony), faded from the end: write + cancel given (board writes
   3²/3⁵ = 3×3 / 3×3×3×3×3 = 1/(3×3×3)); the kid types the exponent (3 = drops-sign, 0.4 = quotient-divides-exponents)
   and the value as a fraction (−27 / −1/27 = negative-exponent-makes-negative, 1/9 = power-as-base-times-exponent);
   callback to the part 1 card (+ "you were sure" line for confident errors).
4. **Prove it.** Sam: "5⁰ = 0, there are no 5s." Yes 5⁰ = 0 (zero-exponent-as-zero-or-base) / No 5⁰ = 1 / No 5⁰ = 5
   (zero-exponent-as-base), then a because-chain: 5² × 5⁰ = 5²⁺⁰ = 5² (product rule) → so 5⁰ = 1 (× 1 changes nothing)
   → 5⁰ = 0 would give 0, not 25 (anything × 0 is 0). Distractor chips: "just a rule to memorize"
   (zero-exponent-definition-seen-as-arbitrary), "2⁰, 3⁰, 10⁰ give 1 on a calculator" (examples-as-proof), "the 5 stays"
   (zero-exponent-as-base). The mat shows 1 × 5 × 5 × [empty 5⁰ slot] = 25, then a red 0 tile in the slot gives 0;
   Sam's 0 is struck only after that, and 1 is written beside it. Closing line: why base 0 is left out (0⁻¹ = 1 ÷ 0).
5. **Practice** (runtime/practice.ts): every sub-goal in topic order, then mixed. A miss replays the solution on the
   mat when the item has one (cancel pairs, regroup, the 1 tile, the readout).

## Sub-goal → families
| # | sub-goal | families |
|---|---|---|
| 1 | product-rule-positive | prodExp (exponent of a^m × a^n; base 10, 2–7, ½, ⅔; mat), prodPick (one power? incl. unequal bases) |
| 2 | quotient-rule-positive | quotExp (bar and ÷, m > n; mat), quotPick (b^(m−n) vs b^(m/n) vs 1^(m−n)) |
| 3 | power-rules-whole | powPow ((a^m)^n; mat of repeated groups), powProd ((a×b)^n; mat regroups), powQuot ((a/b)^n value) |
| 4 | negative-base-whole-laws | negBase (laws on (−2), (−3), (−½), (2/3), evaluated; mat), negSame (one power of a negative base) |
| 5 | zero-exponent | zeroExp (a⁰, aⁿ/aⁿ, the descending table; mat), zeroContrast (5⁰ vs 5 × 0 vs 0⁵) |
| 6 | negative-exponent-base-10 | tenDec (10⁻ⁿ as decimal / fraction; mat), tenExp (0.001 = 10^?) |
| 7 | negative-exponent-general | negExp (b⁻ⁿ for 2–10, and 1/8 = 2^?; mat), negWhich |
| 8 | neg-power-fraction-base | negExp, negWhich (unit then non-unit fractions) |
| 9 | neg-power-negative-base | negExp, negWhich ((−3)⁰, (−2)⁻², (−2)⁻³, (−½)⁻³ …) |
| 10 | external-minus-contrast | minusPair (−3⁰ vs (−3)⁰, −2⁻² vs (−2)⁻², −2⁴ vs (−2)⁴), zeroMix (4 × 10⁰ + 3⁰, 5 − 2⁰, −a⁰ + c) |
| 11 | product-rule-integer | prodExp (exponents −6..6), lawVal (value after the rule; mat) |
| 12 | quotient-rule-integer | quotExp (m ≤ n, subtracting a negative), lawVal |
| 13 | power-of-a-power | powPow (zero / negative exponents), lawVal |
| 14 | power-of-a-product | powProd ((4 × 10²)², (2 × 3)⁻², (−2 × 5)⁻¹), sumPow ((2 + 3)² is not 2² + 3²) |
| 15 | power-of-a-quotient | powQuot ((2/5)⁻³, (−3/4)⁻²), quotPick (which equals (a/b)⁻ⁿ) |
| 16 | justify-zero-negative-definitions | justify (why a⁰ = 1, why a⁻ⁿ = 1/aⁿ, Sam's 5⁰ = 0, why 0⁻¹ has no value, examples vs proof) |
| 17 | monomial-exponent-laws | monoExp (x^m·x^n, x^m/x^n, (x^m)^n with x ≠ 0), monoPick ((3x³y⁻²)³, 12x⁴y / 4x⁶y, x²·y³) |
