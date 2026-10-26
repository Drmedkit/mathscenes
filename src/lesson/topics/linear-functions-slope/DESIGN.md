# Linear functions and slope (secondary-t6-09, Algebra 1, lesson 5)

**Concept.** A line has ONE slope: the same Δy/Δx between any two of its points. From that one fact comes everything
the grade 8 lesson (`linear-functions`, y = mx + b in context) did not do: the slope formula with a consistent
subtraction order, point-slope form (the slope from a known point to EVERY point (x, y) is m), slope-intercept and
standard form as rewrites of the same line, zero vs undefined slope, and the features a function has (y-intercept,
zero, domain, range) read from an equation, a table or a scaled graph and judged in a context.

**Model: the shared kit's Plane** (`src/lesson/kit/Plane.ts`) for every graph. Pictures are data (`graphPic.ts`):
lines as m and b, points, segments, word labels, each with a step key; `riseRun()` adds the run (amber) and rise
(teal) arrows with their labels, `squareWin()` picks a square window (coarser steps when it would get crowded),
`planeOf()` turns the data into a Plane. Two blocks the kit does not have yet live here: `TableCard.ts` (a table of
values with the changes between rows and row rings) and `NumberLine.ts` (a bounded piece or ray with open/closed
dots). Colour roles: amber = run / Δx, teal = rise / Δy, lime = the line, answers and the forms, lavender = focus,
water = a second line, wrong = Riley's flat line.

**Board.** Part 2 writes the whole chain: m = (y₂ − y₁)/(x₂ − x₁) with the numbers → (y − 7)/(x − (−2)) = −3/2 →
y − 7 = −3/2(x + 2) → y = −3/2 x + 4 → 3x + 2y = 8 → the check with B. Older lines dim; rings on the plane (A, the
y-intercept, the zero, B) instead of leaders.

## The five parts
1. **The question**: the line through A(−2, 7) and B(4, −2): slope? Cards −3/2, −2/3 (rise-run-inverted),
   3/2 (inconsistent-subtraction-order) + how sure.
2. **Worked example** (same line): slope from two points (run 6, rise −9, B minus A top and bottom) → a trace point
   P(x, y) rides the line with the dashed run x + 2 and rise y − 7 from A: the same slope everywhere gives
   point-slope form → get y alone (distribute to BOTH terms; the y-intercept (0, 4) is ringed) → clear the fraction:
   standard form 3x + 2y = 8, the zero (8/3, 0), the check with B. Why? "a line has the same slope between any two
   points" / "point-slope only works with the first point" (unique-equation-for-graph) / "x and y are A's
   coordinates" (point-in-variable-slots).
3. **Your turn** C(−1, 5), D(3, −3), faded from the end: the slope is given; the student picks point-slope form
   (y + 5 = −2(x − 1) = wrong-sign-zero-factor, y − 5 = −2(x − 3) = mixes-coordinates), types b = 3 (5 =
   first-output, 6 = partial-distribution, −7 = moves-term-without-sign-change), picks standard form (−2x + y = 3 =
   moves-term-without-sign-change, y = −2x + 3 = standard-form-y-alone); the plane rings the intercepts and D.
   Callback to the part-1 card.
4. **Prove it**: Riley says the line through (2, 5) and (2, −1) has slope −6/0 = 0, "a flat line, a function".
   Judge, then a because-chain: undefined, not 0 (Δx = 0) / slope 0 is a flat line, like (2, 5) to (6, 5) / the
   line is x = 2, not a function (input 2 has two outputs). Distractor chips: "0 ÷ 6 and 6 ÷ 0 are both 0"
   (zero-over-k-vs-k-over-zero), "no slope and slope 0 mean the same" (no-slope-conflates-zero-and-undefined), "a
   rule with no x is not a function" (constant-rule-not-function). The plane backs each line: Riley's dashed flat
   line misses Q, the rise arrow with run 0, the point (6, 5), the vertical line x = 2 with P and Q ringed.
5. **Practice**: all 31 sub-goals in topic order, then mixed. Plane pictures on most items (table and number line
   where the sub-goal asks for one), answer-giving parts held back for the worked solution after a miss; items that
   are only an equation or a sentence get a big slate.

## Sub-goal → families (plan.ts), 47 families
| sub-goal | families |
|---|---|
| linear-constant-rate | tableLinear (table: linear / proportional / not; words: +$4 per hour vs doubling, s²), changeTable (step 1) |
| slope-ratio-of-changes | changeTable (uneven input steps), graphSlope (rise over run on the graph) |
| slope-two-points | twoPointSlope (negatives, reversed order, zero slope, which set-up), graphSlope |
| slope-scaled-graph | scaledSlope (unequal scales, A given, B read), steeperScaled (looks steep vs is steep) |
| zero-vs-undefined-slope | flatOrSteep (equal x / equal y; which is true, the value), hvLine (y = c, x = c) |
| function-notation-evaluate | evalF (f(3), f(−2), f(1/2)), readNotation (read f(a) / solve f(x) = c on a graph; what f(4) = 9 says) |
| y-intercept-input-zero | yIntercept (table with x = 0 not first; graph), evalF (f(0)) |
| read-m-b-from-equation | readMB (7 − 2x, −x, x/4 − 1, 0.5x, y = 6), matchGraph |
| zero-identify | zeroGraph (graph, table), zeroCount (y = 3, y = 0, y = mx) |
| zero-by-solving | solveZero (fractions, negative slope, m = 0), zeroCount |
| inequality-bounds | phraseToIneq (at least / fewer than / up to and including; number line with open and closed dots) |
| domain-input-set | domainGraph (segment with ends, unrestricted line in a window, list of points, set-builder) |
| domain-context-restriction | contextDomain (tickets = whole numbers, tank = continuous; how to draw it) |
| range-linear-function | rangeInterval (negative slope flips the order, ends carried over; list; constant), hvLine |
| feature-discrimination | mixedFeature (slope / y-intercept / zero on scaled graphs and tables, unlabeled) |
| build-from-m-and-b | buildMB (m = 0, b = 0, (0, 4) given as a point), matchGraph |
| build-from-slope-and-point | bFromPoint, writePS |
| build-from-two-points | eqTwoPoints (one point the y-intercept, flat line), twoPointsStory (miles left, money paid) |
| build-from-table | tableRule (step 3 from 2, uneven, reordered, x = 0 absent), tableCheck (a row that breaks the rule) |
| build-from-scaled-graph | graphRule (y-axis off the picture), exactPoints (grid crossings vs estimates) |
| build-from-verbal | storyEq (fee + rate, drain, rate + observation), storyValue |
| point-slope-form | readPS (y + 3 = −2(x − 1) sign traps), writePS (from a point or two points) |
| standard-form | stdSlope (−A/B), stdIntercepts (tickets 8a + 5c = 200) |
| convert-among-forms | toSlopeInt (from point-slope, from standard), siToStd (clear fractions, two points) |
| graph-from-forms | stepFrom (start point + one slope step), hvLine |
| transform-linear-parent | transformPoint (af(x), f(x) + d, f(x − c), f(bx)), transformWords (and same-graph pairs) |
| uniqueness-sufficiency | enoughInfo (one point, repeated, same input, inconsistent third), sameLineForms |
| interpret-slope-units | slopeSentence ($/mile, gal/min, in/day, m/s, °F/hour, 0), twoPointsStory (the rate) |
| interpret-y-intercept | bMeaning (positive, negative, zero), storyValue |
| interpret-zero | zeroWhen (tank, break-even, candle, loan; the number and what it means) |
| intercept-meaningfulness | isZero (root outside the domain, 0 not in the domain, a real but implausible y-intercept), firstWhole |

Every classified slip carries its catalogue id (`items.ts` MC table; the test checks they exist and that the
topic's misconceptions are diagnosed somewhere). No runtime or kit change was needed.

## What the kit's Plane could get
- An option for word labels (`text`) to avoid point names and curves the way names do (now the lesson places run /
  rise labels itself, on the side away from the names).
- `trace` with a rounding / fixed-format option for the readout (it shows two decimals while it moves).
- Room for labels near the grid edge: a `pad` in data units, so a picture does not have to widen its window itself.
