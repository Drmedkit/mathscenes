# Multiply and divide rational numbers (secondary.multiply-and-divide-rational-numbers, grade 7, 7.NS.A.2-3, 7.EE.B.3)

**Concept.** A signed product is time × rate: a steady change is one equal jump per time step, always in the rate's
direction. Later is positive time (t jumps from now); EARLIER is negative time: the |t| jumps that led to now, so the
reading back then was on the other side of now. That is why one negative factor gives a negative product and two
give a positive one, and division (the missing factor) follows: 12 ÷ (−3) = −4 because (−3) × (−4) = 12. The proof
part makes the same point without a story: 0 = (−3)(4 + (−4)) = −12 + (−3)(−4) forces (−3)(−4) = 12.

**Models.**
- `TimeJumps.ts`: a vertical scale (sea depth with a painted sub, a thermometer, or a plain balance panel). Numbers left
  of the scale, the object on it, the amber jump arrows (first = the rate) in a column, the teal time stamps
  (second = the multiplier: "in 2 min", "3 min ago"), the lime answer arrow + value (link) nearest the board. Steps
  `axis now later earlier ask answer`. `computeJumps` builds every node by adding the jumps one at a time and asserts
  node = start + t × rate; `jumpsFit` says what it can draw (≤ 9 stamps, rate to hundredths). `where.jump(t)` is the
  middle band of a jump (leaders come in between two time stamps), `where.answerLabel` the value.
- `Counters.ts`: two-color counters on a felt mat (+ yellow, − rose), groups in dashed frames, removed groups lifted
  and faded; `computeMat` counts what is left. Used by the counters practice family (TEKS 6.3C/D).
- `rq.ts`: exact signed rationals, HTML/TeX with real minus signs, repeating decimals (long division with remainders),
  reading a typed answer with a minus sign in any box.

## The five parts
1. **The question**: a diver changes height by −4 ft every minute; where was she 3 minutes ago? Cards −12 ft
   (any-negative-makes-negative), +12 ft (right), −7 ft (addition-rules-in-multiplication); how sure. Board: rate −4,
   "3 min ago: −3", (−3) × (−4) = ?; the scale with the sub at now and a ring on "3 min ago".
2. **Worked example** (Rate, Later, Earlier, Divide): one jump + "−4 ft per min" (leader into the jump); three later
   jumps + lime −12 ft + "3 × (−4) = −12"; three earlier jumps leading DOWN to now + lime +12 ft + "(−3) × (−4) = 12";
   "12 ÷ (−3) = −4" with the earlier jumps glowing. Why: "3 minutes ago she had not made the 3 drops yet" vs
   two-negatives-positive-in-addition vs neg-times-neg-arbitrary.
3. **Your turn**: a cold front, −1.5 °F per hour, 30 °F now, 4 hours ago. Rate and later (2 × (−1.5) = −3) are given;
   the kid types the change (+6; −6 → any-negative, −5.5 → addition-rules), builds (−4) × (−1.5) from chips
   (+ → addition-rules, 4 × (−1.5) → sign-meaning-in-context), then 6 ÷ (−4) = −1.5 (1.5 → drops-sign). Callback to
   the card picked in part 1.
4. **Prove it**: Jordan says (−3)(−4) = −12 "because a negative times anything stays negative". Four claims
   (= 0 because 4 + (−4) = 0; distributive; (−3)(4) = −12; only 12 cancels −12) from 8 chips; distractors =
   any-negative-makes-negative, addition-rules, examples-as-proof, neg-times-neg-arbitrary. The scale backs each line:
   a ring at 0, an amber −12 arrow, a lime arrow back up to 0, the same +12 from now; Jordan's −12 is struck last.
5. **Practice**: runtime walk through all 23 sub-goals, then mixed. Rate stories draw the scale (a miss replays the
   answer arrow and t × rate with its leader); counter items draw the mat; the rest show the notation big.

## Sub-goal → family
| sub-goal | families |
|---|---|
| numerical-distribution | distribute (expand, compress, ½(a + b), a 0 inside the sum, 0 × (a + b)) |
| product-one-negative | jumps (later with a negative rate / earlier with a positive rate), oneNeg (int, fraction, factor order, closer to / farther from 0) |
| neg-times-neg-distributive | pattern (pattern table, 0 = (−a)(b + (−b)) chain, half-unit chain, why) |
| quotient-sign-missing-factor | missing (all four sign pairs, fractions, size of ÷ by a fraction below 1) |
| zero-in-division | zero (0 × a, 0 ÷ a, a ÷ 0, 0 ÷ 0, (a + 0) ÷ b, is 0 positive?) |
| concrete-mul-div-models | counters (put in groups, seed zero pairs first, what is left, share, how many groups) |
| fraction-sign-placement | signPlace (odd one out, (−p)/(−q), equal to p/(−q), 0/(−q)) |
| context-meaning-mul-div | meaning (read a product in a story, pick the expression for a debt / fall / descent) |
| int-multiply | intMul (two factors 0-10, 3-4 factors, multi-digit), signOnly (positive / negative / 0 for 3-6 factors) |
| int-divide | intDiv (fact set, zero dividend, long division, ÷ 0 statements) |
| rational-products-signed | ratMul (fractions, mixed, decimals, mixed formats, a zero factor) |
| rational-quotients-signed | ratDiv (fractions, complex fraction, decimals, −7 ÷ 2, zero dividend) |
| decimal-expansion-long-division | decimal (terminating, repeating with bar, terminate or repeat?) |
| rational-number-sets | sets (smallest set incl. disguised integers, 0, negatives) |
| compound-expressions | compound (a + b·c, ÷ × left to right, − + left to right, brackets) |
| multi-step-order-of-operations | powers (−a² vs (−a)², (−p/q)ⁿ × m, −\|a − b\| + c) |
| multiplicative-properties-strategies | strategy (distribute a mixed number, factor out, regroup, ÷ is not associative, name the property) |
| inverse-check-quotient | checkQ (which multiplication checks, is the claim right, ÷ 0) |
| general-neg-neg-argument | argument (which is a proof, next step of a fraction example, what the chain shows) |
| evidence-scope | evidence (example / counterexample / general argument, repair the wording) |
| apply-one-step-mul-div | story1 (debt shared, fall per hour, descent per second, level days ago, weekly fee), jumps |
| apply-multi-step | storyMulti (average temperature change, overdrawn account, Death Valley hike, diver) |
| reasonableness-estimate | estimate (wrong sign, 10× too big, fits, estimate ≈ 0 cannot decide) |
