# Complex numbers (Algebra 2, lesson 1)

Topic `secondary-t7-01-complex-numbers`, slug `complex-numbers`, 21 sub-goals, 46 families. Requires
`number-properties` (the number sets), `polynomials` (every term times every term) and `radicals-exponents`
(simplifying roots). First lesson of the Algebra 2 course: it sets the look (the complex plane on the kit Plane).

## Concept
i is a NEW number, off the real line, with one rule: i² = −1 (no real number squares to a negative). A complex number
is a + bi: two parts, the real part a and the imaginary part b (a signed real number, not bi). Everything else is the
algebra the student knows: add and subtract part by part, multiply every term by every term and replace i² with −1,
then collect real with real and i with i. Dividing clears i from the bottom by multiplying by a form of 1: i/i, or
the conjugate (c − di)/(c − di), because (c + di)(c − di) = c² + d² is a positive real. On the plane, × i is a
quarter turn about 0 (so i · i is a half turn: −1), the conjugate is the mirror image in the real axis, and a² + b²
is the squared distance from 0. The trap: √a · √b = √(ab) fails when both are negative; write roots in i-form first.

## Models
- **The complex plane** = the kit `Plane` (real across, imaginary up, square cells, imaginary tick labels `2i`, `−i`).
  Points and arrows from 0; a quarter-turn arrow with an arc (`drawTurn` in the page) for × i, ÷ i, powers of i
  and the √(−4)·√(−9) proof.
- **The product box** = `polynomials/ProductBox.ts` reused read-only, with the "degree" = the power of i: real cells
  teal (`second`), i cells amber (`first`), i² cells blue (`water`). At "replace i² with −1" an i² cell is washed
  over in teal with its real value (`drawTurned` in the page); collecting rings the real cells and the i cells;
  cancelling i cells (a conjugate pair) are struck.
- **The number sets** = `ComplexSets.ts`: `number-properties/SetMap.ts` (the reals) inside an outer region "Complex
  numbers", with the non-real numbers (b ≠ 0) beside it and the purely imaginary ones (a = 0) inside those.
  Kit candidate together with SetMap.
- **Worked lines**: a numbered column of supplied work on a wide slate (audit items); the first invalid line is
  ringed red at the solve, unfinished correct work is ringed lime ("not finished yet").
- `cx.ts`: exact complex numbers with rational parts (number-properties' Q), a + bi text for board (TeX) and panel
  (HTML: a fractional imaginary part in brackets, "(1/5)i", so the plain-text reading keeps the grouping).

## Answers
a + bi answers use the `pair` input "[a] + [b] i" (b can be negative; decimals are accepted). Only answers whose
parts are whole numbers or terminating decimals are asked as pairs; thirds, sixths, sevenths go to choice families
(`fracAddSub`, `divRealFrac`). Every choice list of complex VALUES goes through `cxChoice`, which drops a wrong option
equal in value to the right one (e.g. (5 + 2i)(5 − 2i) next to (2 + 5i)(2 − 5i), swapped parts when a = b).
`i√12` (correct but not fully simplified) is never offered as a wrong choice. Powers of i are a fixed four-way choice
1, i, −1, −i.

## The five parts
1. **The question**: "i is a new number with i² = −1. What is (2 + 3i)(4 + i)?" on the empty box. Cards 5 + 14i,
   11 + 14i (i² as +1), 5 (firsts and lasts only) + how sure.
2. **Worked example**: meet i on the plane (an arrow from 1 turns a quarter turn to i, again to −1: i² = −1) →
   the plane gives way to the box: every term times every term (8, 2i, 12i, 3i²) → replace i² with −1 (the 3i² cell
   turns teal: −3) → collect (rings: 8 and −3, 2i and 12i): 5 + 14i. Why −3: i² = −1 / i = −1 (i-equals-negative-one)
   / squares are never negative (i-squared-as-plus-one).
3. **Your turn** (3 − 2i)(1 + 4i), faded from the end: the box is filled; the kid turns −8i² into 8 (−8 =
   i-squared-as-plus-one), then types 11 + 10i (−5 + 10i: forgot the turned cell). Callback to the card.
4. **Prove it**: Sam: √(−4)·√(−9) = √36 = 6. Judge, then a because-chain on the plane: √(−4) = 2i and √(−9) = 3i
   (arrows up) → 2i · 3i = 6 · i · i (an arrow 6) → = 6i² = −6 (the 6 turns two quarter turns to −6; Sam's 6 and his
   line are struck). Distractor chips: the product rule for all a, b (product-rule-for-negative-radicands), √(−4) = −2
   (root-of-negative-as-negative-real), i · i = i (i-times-i-as-i).
5. **Practice**: all 21 sub-goals in order, then mixed.

## Sub-goal → families
| sub-goal | families |
|---|---|
| define-i | squareSign (num; plane quarter turns for i², (−i)²), whyNoReal (choice; x² = −k, graph of y = x² + k, what i is) |
| sqrt-neg-perfect | sqrtNeg (pair; √(−k), −√(−k), −√k), rootContrast (choice; one principal root vs two solutions) |
| sqrt-neg-nonperfect | sqrtNonPerfect (choice), nonPerfectCoef (num: √(−k) = □ i√m) |
| standard-form | readParts (pair a, b; any written order, fractions), planeRead (pair; a point on the plane), stdFormPick (choice; parts → number, signed b of a radical) |
| reals-in-complex | classify (choice real / purely imaginary / neither; set map), setTruth (choice; is 5 complex, solutions of x² = −k, R ⊂ C) |
| equal-by-parts | whichEqual (choice; reordered, 5 = 5 + 0i, coefficient-sum decoy), solveEqual (pair x, y) |
| add-complex | addPair (pair; tip-to-tail on the plane), fracAddSub (choice; thirds/sixths), propertyName (choice; commutative + associative) |
| subtract-complex | subPair (pair), fracAddSub |
| multiply-by-imaginary | monoProduct (pair), scaleDistribute (pair; 1 × 2 box), rotateByI (pair; quarter turn) |
| multiply-complex | binProduct (pair; box), squareComplex (pair; box), propertyName (choice; distributive, i · 3 = 3i) |
| radical-product-trap | radProduct (pair; both / one / no negative radicand), radTrapChoice (choice; value, Sam's first step) |
| powers-of-i | iPower (choice 1/i/−1/−i; turns on the plane), iPowerSum (pair) |
| conjugate | conjPair (pair; general, real, imaginary, 0, conjugate of the conjugate), conjPlane (choice of points; mirror) |
| conjugate-product | conjProduct (pair; box with cancelling cells), sumSquaresPick (choice of products), distance (num; |z|) |
| divide-by-real | divReal (pair; decimals), divRealFrac (choice; exact fractions) |
| divide-by-imaginary | divI (pair), divIRotate (choice of points; ÷ i = clockwise quarter turn) |
| divide-complex | divComplex (pair; denominator × conjugate box), divSteps (choice; which factor, ÷ 0, 0 ÷ w) |
| diagnose-product-error | findError (choice of line or none; worked lines), nameRule (choice), finishWork (pair; finish or fix) |
| justify-conjugate-identity | conjProofStep (choice; middle terms, −b²i², ≥ 0, = 0 only at 0, examples vs proof), alwaysSometimes |
| verify-quotient-by-multiplying | checkProduct (pair; q · w), verifyQuot (choice; checks / does not / equal but unfinished) |
| justify-division-method | whyConj (choice; form of 1, c² + d² > 0, surface check, why not w/w), newDenominator (num) |
