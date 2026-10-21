# Rational and irrational numbers (grade 8, 8.NS.A.1-2)

Topic `secondary-t5-26-the-number-system-rational-and-irrational-numbers`, slug `irrational-numbers`. Follows
`perfect-squares` (imports its `rad()` panel helper read-only).

## Concept
Every number has a decimal ADDRESS: zoom into the tenth that holds it, then the hundredth, and so on. A number is
rational when it is a quotient of integers; then the address ends or repeats (the long-division remainders run out),
and every repeating address is a fraction again (shift and subtract). An address that never ends and never repeats
(sqrt 2, pi) is irrational, yet it is one exact point. The VALUE decides, never the look: sqrt 49 = 7 is natural,
22/7 and 3.14 are rational, a calculator screen is only a cut-off, so = versus ≈ matters.

## Models (all maths exact in `realMaths.ts`: BigInt floors, no float decisions)
- `ZoomLine.ts`: up to three stacked number lines; each blows up the band of the line above (whole numbers →
  tenths → hundredths). Lime band = where the number is; its end labels (lime) and, for roots, the squares of the
  ends (amber) beside it; a soft beam with dashed edges carries the band down. Steps `axis name band{i} sq{i}
  zoom{i} dot mid marks` (mid = the rounding midpoint, lavender; marks = lettered points for "which point?").
  `computeZoom` asserts every band holds x and every line blows up the band above; layout checks label overlaps.
- `DigitTape.ts`: a decimal as digit tiles on the point; `top` slides a copy s places left (×10^s); `align` rings
  the tail columns (lime = equal, red = a wrong shift); `subtract` / `cancel` leave a whole number. `computeTape`
  asserts "tails agree" ⇔ "difference is whole".
- `RealSets.ts`: natural ⊂ whole ⊂ integers ⊂ rational, irrational beside, all in the reals; a token goes in the
  innermost region of its VALUE (`innermost()`).
- `Calc.ts`: a painted square (area amber, side lime) and calculator; `cut` shows the digits that run on past the
  screen (lavender, dashed edge).

Colour roles: amber (`first`) = area / squares / the number under the root, lime (`link`) = the root, its band and
bounds, the answer; teal (`second`) = the lower copy in shift and subtract; lavender (`pick`) = cut-off digits,
midpoints, lettered points, repeating tiles; red (`wrong`) = a wrong shift or a struck claim.

## The five parts
1. **The question**: a tile of exactly 2 sq ft, side sqrt2; the calculator shows 1.414213562. Square the screen's
   number: Exactly 2 (`truncation-taken-as-full-decimal`) / Just under 2 / No exact answer
   (`irrational-has-no-exact-value`) + how sure.
2. **Worked example** (zoom on sqrt2): Bracket (1 < sqrt2 < 2, squares 1 and 4) → Zoom to tenths (1.96 / 2.25) →
   Zoom to hundredths (1.9881 / 2.0164) → Read the address (sqrt2 = 1.41421356…, never ends or repeats: irrational;
   the screen is a cut-off: ≈). Each board line sits at the height of its line and its band pulses (no leaders: they
   would cross the tick numbers). Why between 1.4 and 1.5? squares under/over / a third of the way
   (`root-by-linear-interpolation`) / 1.96 rounds to 2 (`rounded-value-treated-as-exact`).
3. **Your turn** (sqrt10), faded from the end: bracket given; the kid types the tenths from trial squares
   (3.2, 3.3 → `accepts-close-trial-either-side`; the squares → `squares-as-root-bounds`), the hundredths, then taps
   √10 [≈] [3.2] (= → `rounded-value-treated-as-exact`, 3.1 → `truncates-instead-of-rounding`). Callback to part 1.
4. **Prove it**: Ava: "0.272727… never ends, so it is irrational." Judge, then a because-chain on the digit tiles:
   100x slides two places → the tails cancel, 99x = 27 → x = 27/99 = 3/11, a quotient of integers. Distractors:
   never-ends-means-irrational (`repeating-decimal-called-irrational`), 10x − x (`cancels-unaligned-repeating-tails`,
   the red misaligned tape is shown), only-this-example (`general-derivation-seen-as-one-example`). Ava's claim is
   struck at the end.
5. **Practice**: all 21 sub-goals in topic order (runtime/practice.ts), then mixed.

## Sub-goal → families
| sub-goal | families | picture |
|---|---|---|
| define-rational | asQuotient (pair a/b), notRational (n/0, integers are rational, (−3)/4 placement) | bare |
| decimals-repeat | remainders (count, what comes next, why), barNotation | bare |
| decimal-address | addressOf (tenths/hundredths of p/q), prefixWhere (prefix fences it, infinitely many between, exact point) | zoom |
| define-irrational | rOrI (√2, π, patterns, repeating decimals) | sets after |
| display-not-proof | displayRead (1/17-type screens, √a screens, a bare screen) | calc + cut |
| form-vs-value | rOrI (√49, 22/7, 3.14, 1.414, 0.125) | sets after |
| real-number-sets | innermost, setStatement | sets |
| perfect-square-test | rOrI (√n, −√n to 225), whichRational | sets after |
| root-of-fraction | rootFraction (reduce first, decimals), rOrI | bare |
| convert-repeating-pure | toFraction, whichShift | tape |
| convert-repeating-delayed | toFraction, whichShift, generalMethod | tape |
| bracket-root | bracket (to 224, negatives) | zoom |
| refine-bounds | refine (trial squares), interpolate | zoom |
| round-from-bounds | roundRoot (midpoint square; next digit), settles | zoom + mid |
| locate-number-line | locate (lettered points, whole or tenth lines, negatives, π) | zoom marks |
| order-reals | compare (<, =, >), order (lists) | bare |
| estimate-expressions | estimate (π², m√a + c, √a + √b, πr², kπ) | bare |
| exact-vs-approx | exactOrNot | bare |
| error-from-bounds | maxError (width; padded digits), howClose | zoom / bare |
| bound-expressions | boundExpr, boundRound, notEqual | bare |
| choose-precision | decide (tabletop through a gap, 25π vs 78.5, measured tile) | zoom after |

Not classified (no tap/typed answer shows them cleanly): `rounding-up-always-overestimates` is only logged when the
two carried bounds are typed swapped (the topic keeps to increasing operations, as its cases say).
