# Circle graphs with percents (primary.data.make-pie-chart, grade 7)

## Concept
The whole circle is ONE named data set: 100% and 360° at the same time. A category's share is count ÷ total; the
same share is taken of 100% (the label) and of 360° (the angle you draw). Slices go around one after another, the
angle list closes at exactly 360°, labels show name + percent, the title names the whole and its n. Stage 3: a right
total is needed but not enough (audit each slice), rounding can explain at most 0.5 point per label, and a circle
graph only fits non-overlapping parts of one stated whole.

## Model: `CircleGraph` (CircleGraph.ts, maths in pieMaths.ts)
- `computePie(cats, n?)`: exact shares, percents and angles (rationals), rounded labels, independently rounded angles,
  rounded cumulative boundaries and the closed drawing list (checked: totals 360°, every angle within 1° of exact).
- Steps `circle` (empty disc, amber rim = the whole), `dots` (one dot per observation, 360/n° each), `ring` (double
  scale 0% 0°, 25% 90°, 50% 180°, 75% 270°, or a 1% percent circle), `sweep` (slices clockwise from the start ray, one
  after another; k = j/m shows the first j), `labels` (name + percent outside the rim, pushed apart, never on a line),
  `title`.
- Focus: one slice in a role colour, lit dots of one category, a dashed ghost wedge, a right-angle mark, a marked ray
  with its degree, an arc arrow ("go around"), labels sliding back from swapped places.
- `where`: centre, circle, sector(i) (leader target inside a slice), rim(i), label(i), title.
- Colours: first (amber) = the whole (rim, n, 100%, 360°), second (teal family) = the parts / counts, link (lime) = the
  answer slice and its number, pick = focus marks, wrong = wrong. Crisp cream radii (precision), washed slices.
- `BarGraph`: a plain bar graph for data that a circle graph does not fit.

## The five parts
1. **The question**: 40 students, 10 picked pizza. Angle of the pizza slice? 25° (x% as x°), 90°, 45° (180° circle) +
   how sure. Canvas: the empty circle with 40 dots; board "10 of 40", "angle = ?°".
2. **Worked example** (lunch 10/14/6/10 of 40): Name the whole (rim pulse, double scale, "40 → 100% → 360°") → Find
   the share (pizza dots light, 10/40 = 1/4) → Percent and degrees (pizza slice sweeps a quarter, right-angle mark,
   1/4 × 100% = 25%, 1/4 × 360° = 90° with a leader to the slice) → Go around (arc arrow, the other slices sweep from
   the last edge, 90 + 126 + 54 + 90 = 360°, labels and title). Why: "90°, not 25°?" (3 reasons, 2 misconceptions).
3. **Your turn** (sport 21/15/12/12 of 60), faded from the end: whole + share given; the kid types the percent (35)
   and the angle (126), says where basketball starts (126° vs the top again), picks the label (35% vs 126° vs 21).
   Callback to the part-1 pick.
4. **Prove it**: Riley's lunch graph has the pizza/tacos labels swapped; "totals 100% and 360°, so it's right."
   Judge, then a 3-line because-chain from 6 chips (3 distractors = judges-by-final-answer, percent-as-degrees,
   share-changes-with-radius). Evidence: ghost 126° wedge + leader, right-angle mark on the 90° slice, labels slide
   back, the claim is struck.
5. **Practice**: all 18 sub-goals in order (runtime/practice.ts), then mixed.

## Sub-goal → family
| sub-goal | family | input | main misconceptions |
|---|---|---|---|
| circle-is-whole | whole | num / choice | percent-as-fixed-amount, incomplete-subtotal-as-whole |
| sector-share-by-central-angle | sameShare | choice | sector-share-changes-with-position-or-radius, unequal-parts-counted-as-fractions |
| percent-degree-double-scale | toDeg, toPct | num | percent-as-degrees, wrong-total-line-or-circle |
| estimate-sector-share | estimate | choice | percent-as-degrees, sector-share-changes-with-position-or-radius |
| relative-frequency | share | fraction | divides-by-wrong-total |
| percent-from-relative-frequency | pct | num | percent-as-fixed-amount, appends-percent-sign-to-unscaled-value |
| round-displayed-percent | roundPct | num | intermediate-precision-always-invalid, dollars-cents-point-misplaced |
| central-angle-from-share | angle | num | count-times-360, percent-as-degrees, wrong-total-line-or-circle |
| keep-unrounded-shares | exact | choice | intermediate-precision-always-invalid |
| close-angle-list | close | choice | forces-last-value-to-close-whole, counts-not-summing-to-total |
| draw-adjacent-sectors | adjacent | num | sectors-from-same-radius, reads-wrong-protractor-scale |
| draw-reflex-sector | reflex | num / choice | no-reflex-angles, wrong-total-line-or-circle |
| label-circle-graph | label | choice | unconverted-quantities-as-percent-labels, omits-total, small-share-rounds-to-zero |
| audit-against-source | audit | choice | judges-work-by-final-answer (swapped labels, compensating errors) |
| rounding-error-bound | bound | choice | rounded-parts-must-sum-to-total, near-miss-accepted-as-match |
| disclose-rounding | disclose | choice | forces-last-value-to-close-whole |
| incomplete-whole | gap | choice | assigns-unaccounted-remainder, incomplete-subtotal-as-whole, pie-of-non-whole |
| reject-overlapping-categories | fit | choice | pie-of-non-whole, near-miss-accepted-as-match |
