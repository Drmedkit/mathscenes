# Quadratics with complex solutions (Algebra 2, lesson 2)

Topic `secondary-t7-09-solving-quadratic-equations-with-complex-solutions`, slug `quadratics-complex`, 14 sub-goals,
30 families. Requires `complex-numbers` (i, a + bi, the complex plane) and `radicals-exponents` (simplest radical
form). Same look as `complex-numbers`: the kit Plane, model left, a wide board right.

## Concept
A parabola that misses the x-axis has no REAL zeros, but the equation still has two solutions: b² − 4ac < 0 makes
√(b² − 4ac) = i√(4ac − b²), and the ± gives −b/(2a) ± (√(4ac − b²)/(2a))i. Both share the real part −b/(2a), the
vertex's x, and have opposite imaginary parts: a conjugate pair, mirror images in the real axis. "No real solution" is
not "no solution". Conjugacy can only rule a proposed pair OUT (it is necessary, not sufficient), it needs real
coefficients, and only substitution (with i² = −1, both parts 0) confirms a root. In a real model (a height, a
length) non-real solutions mean the event never happens.

## Models
- **The parabola** on the kit Plane (x-y): the vertex, the dashed gap under it, the axis x = −b/(2a).
- **The complex plane** on the kit Plane (real across, imaginary up, square cells, ticks 2i, −i): the two roots on
  the dashed line real part = −b/(2a), mirrored. In parts 2 and 3 the parabola turns into the complex plane on the
  same vertical line. In part 4 the ticks are blank and the points are p ± qi.
- **The completed square** (completing-the-square's CompleteSquare, read-only) for completeQ when b > 0.
- Practice pictures are data (`pic.ts`: graphPic, modelPic, rootsPic → kit Plane params; the tests build every one).
  A graph that would give the answer away comes in at the solve (`late`).
- `qc.ts`: NR = re ± im·i√m (exact, simplest radical form) from the formula; value keys (a root set, a quadratic up
  to a factor, a complex number); substitution with the i² = +1 and part-by-part slips for classifying.

## Answers
`x = [a] ± [b] i` (pair, op ±) for integer / terminating-decimal parts; the form fixes the order and b is accepted
with either sign (same pair). `[a] + [b] i` for one complex value. Radical and fractional answers are choices.
Every choice list goes through `keyed` (common.ts): a wrong option with the same VALUE key as the right one is dropped,
so `−1 ± i√24` next to `−1 ± 2i√6`, `(4 ± 6i)/2` next to `2 ± 3i`, `2x² − 12x + 26` next to `x² − 6x + 13`, or
`x² − (qi)²` next to `x² + q²` can never appear as a wrong choice. A root never sits in a stacked fraction ((√7/4)i).

## The five parts
1. **The question**: the parabola y = x² − 4x + 13 (vertex (2, 9)) misses the x-axis; how many solutions does
   x² − 4x + 13 = 0 have? Cards: no solutions (no-solution-vs-no-real), two non-real (right), one non-real
   (negative-discriminant-one-complex-solution) + how sure.
2. **Worked example**: b² − 4ac = −36 (the gap under the vertex) → √(−36) = 6i → (4 ± 6i)/2 = 2 ± 3i (the axis
   x = 2, then the complex plane with 2 ± 3i on that line) → check 2 + 3i. Why the same real part: the ± only
   touches the root / the roots are opposites (nonreal-roots-are-opposites) / the graph crosses at 2.
3. **Your turn** x² + 6x + 25 = 0 (b² − 4ac = −64 given): √(−64) = □i (−8 = root-of-negative-as-negative-real),
   then x = □ ± □i (3 ± 4i = formula-uses-b; −6 ± 4i or −3 ± 8i = divides one term); the roots land above the
   vertex x = −3. Callback to the card.
4. **Prove it**: Jordan's three examples → "always". Judge (yes = examples-as-proof), then the general chain on a
   blank complex plane: √(b² − 4ac) = i√(4ac − b²) (arrows up and down), x = −b/(2a) ± (…)i (the shared line), p ± qi
   with p, q real (the mirrored points). Distractor chips: examples, opposites, conjugate flips both parts.
5. **Practice**: all 14 sub-goals in order, then mixed.

## Sub-goal → families
| sub-goal | families |
|---|---|
| sqrt-of-negative | rootNeg (choice; perfect, then square factors; i under the root, ±, −√k, dropped i), rootNegCoef (num; the number in front, the square check (i√k)² = −k) |
| neg-discriminant-meaning | discCount (choice; < 0 / = 0 / > 0, a < 0 too; graph at the solve), discValue (num; b² + 4ac slip), complexTruth (choice; x² − k has complex solutions, x² + k, Ana's "no solution") |
| sqrt-method-negative | sqrtSolve (x = □ ± □i; x² = −k, ax² + c, (x − h)² = −k, A(x − h)² = −m), sqrtSolvePick (choice; non-perfect squares, only +, dropped i, sign of h) |
| formula-perfect-square | formulaInt (x = □ ± □i; with / without the discriminant given), splitPick (choice; split (−b ± ci)/2) |
| formula-nonsquare-radical | formulaRad (choice; simplest radical form), radCoef (num; under the root / in front) |
| formula-nonunit-a | formulaA (choice; a ≠ 1, a < 0 sign slip, divides one term), partsA (x = □ ± □i decimals; fractional / decimal coefficients cleared first) |
| method-choice-mixed | mixedSolve (x = □ ± □i; x(x + 4) = −8, x² + 2x = −10, square form, scaled), contrastSolve (choice; D ≥ 0 contrast, abc before standard form), completeQ (num; (x + h)² = □ < 0, a ≠ 1 dividing out; area picture) |
| verify-by-substitution | residual (□ + □i; pure imaginary, integer, halves; right and wrong candidates), verifyVerdict (choice; real part 0 only, both sides of x² + c = −bx, a wrong reason is not a disproof) |
| conjugate-pair-justify | conjProofStep (choice; shared real part, why √(4ac − b²) is real, examples vs proof, what flips), secondRoot (□ + □i) |
| conjugate-pair-check | pairCheck (choice, fixed: impossible / not ruled out / must be; correct, sign error, identical, real + non-real, pure imaginary), whichPair (choice) |
| conjugacy-not-sufficient | conjEnough (choice; conjugates of this or another quadratic, substitution decides), whichEquation (choice) |
| real-coefficient-boundary | complexCoef (choice; x² − (p + q)ix − pq = 0 roots pi, qi vs a real contrast), coefResidual (□ + □i; substitute into the complex-coefficient quadratic) |
| build-from-conjugate-root | buildQuad (x² + □x + □; pure imaginary, a ≠ 1), buildPick (choice; one factor, opposites, i² = +1) |
| interpret-in-model | modelInterp (choice; ball h(t) = −16t² + vt + h0, pen x(s − x); never happens), modelMax (num with a unit check: the time / side is not the height / area) |

Kit candidate: none new (the kit Plane carries both pictures).
