# The lesson line, phase 2: high school and AP (plan)

Written 2026-10-26, after the 7-8 line went online (Cloudflare Pages project `math-path`). Source of the topic list:
`mathua-vergelijking/coverage/coverage.json` (every topic with no product yet) and the dependencies in
`math-curriculum-us/curriculum/links.csv` (kind `required`). The machine-readable plan is `docs/lessons/hs_lessons.json`.

## 1. Scope

**136 open topics** (118 HS, 16 AP/extension, the 2 grade 7-8 money topics) with **2,866 different sub-goals**.
Eleven small topics are folded into the lesson that teaches the same idea (for example "composite functions: domain
and range" into "combining and composing functions", "study design" and "judging and reporting" into "estimating with a
margin of error"), so the line gets **125 lessons**. Every topic id is in exactly one lesson; the first id of a lesson
is its main topic, the others are listed as `alsoTopics` and their sub-goals go into the same practice plan.

A lesson here is the same five-part lesson as grades 7-8 (the question, a worked example, your turn, prove it,
practice through every sub-goal), with the same quality layer (independent oracle, worked steps after a miss, check-in
adapter). HS topics are bigger: 23 sub-goals on average against about 15 in grades 7-8.

## 2. Eight courses, in this order

The order follows the usual US sequence and the dependencies: no lesson needs a later one (checked by a topological
sort over every `required` link between open topics).

| course | lessons | sub-goals | of which AP | what it rests on |
|---|---|---|---|---|
| Algebra 1 | 19 | 465 | 0 | grades 7-8 |
| Geometry | 18 | 482 | 0 | grades 7-8; coordinate proofs and circle equations use Algebra 1 slope |
| Statistics and probability | 15 | 313 | 5 | Algebra 1 (regression), Geometry logic (advanced counting) |
| Algebra 2 | 20 | 477 | 0 | Algebra 1; circle equations; counting (binomial theorem) |
| Precalculus | 20 | 483 | 2 | Algebra 2, right-triangle trig, arcs and sectors |
| Calculus | 18 | 311 | 8 | Precalculus (limits, trig, logs) |
| Discrete math and reasoning | 10 | 238 | 1 | counting, logic, expected value |
| Money | 5 | 97 | 0 | piecewise functions, exponential growth, series |

Statistics comes third, before Algebra 2, because the binomial theorem and the series tests need counting and because
it needs nothing from Algebra 2. Discrete math and money can be built at any point after the lessons they name.

## 3. What has to exist before the first HS lesson (phase H0, the lead)

The 7-8 lessons each carry their own drawing code (about 2,300 lines per topic, with a coordinate grid written again in
several topics). HS needs the same few pictures in most lessons, so the lead builds a shared kit first in
`src/lesson/kit/`, each piece checking its own maths like the existing blocks:

1. **Plane**: a coordinate plane with zoom levels, function curves (sampled with asymptote breaks), points, segments,
   intervals on an axis, shaded regions (inequalities, areas under a curve), a draggable point or slider, and a trace
   readout. Needed in most HS lessons.
2. **Proof frame**: two-column and flow proofs where every step needs a reason chosen from a menu (the Aleven &
   Koedinger finding in LESSON_LINE.md), with Parsons ordering and a decoy step. Geometry, logic, induction, number
   theory.
3. **Data plots**: dot plot, histogram, box plot, scatter plot with a fitted line and residuals, normal curve with a
   shaded area, two-way table. Statistics, regression, money.
4. **Simulator**: repeat a chance process many times and build the distribution live (coins, dice, spinners, samples
   from a population, randomization tests). Probability, sampling distributions, simulation tests.
5. **Unit circle and angle tools**: angle in degrees and radians, reference triangle, sine and cosine as coordinates,
   wrapping onto a graph. Precalculus, calculus.
6. **Space**: a light 3D view (orbit by drag) for solids, cross-sections, 3D vectors and solids of revolution.
7. **Small blocks**: matrix with row operations, truth table, network graph (vertices, edges, paths), number line with
   intervals and open/closed ends, algebra tiles for factoring.

Plus three changes to the line itself: the path page groups lessons by course (tabs: Math 7-8, Algebra 1, ...) using a
`course` field in `topics.json`; the scaffold reads `alsoTopics`; the check-in gets a version per course.

## 4. How each lesson is built (unchanged from 7-8, with the kit)

scaffold (`tools/lesson-scaffold.py`) → builder writes DESIGN.md, the maths module, items, the five parts and the voice
lines, using the kit → `tools/walk-<slug>.mjs` + `tools/walk-practice.mjs` → builder fixes from the contact sheets →
an independent oracle (a different agent) + explain + placement adapter → `tools/quality/sweep.mjs` 0 errors → ship
(`tools/lesson-ship.sh`). Voice: lines are written now and voiced from 2026-11-03 (`tools/lesson-voice.py`).

**Who builds:** the lead built the kit's first piece and the builder brief (`docs/lessons/HS_BRIEF.md`). Every lesson
goes to a builder agent on Opus (at most three at once, one lesson each, never two on the same files); the builder
also writes the builder half of the quality layer (explain, placement adapter). A second Opus agent writes the
independent oracle. The lead scaffolds, keeps the dev server up, reviews the contact sheets and the sweep of every
lesson, promotes pictures that recur into the kit, commits, and ships per course.

**Size and cost:** a 7-8 lesson took 400-500k tokens including one fix round; HS lessons are about a quarter bigger,
so plan on about 0.55M per lesson, or roughly 70M tokens for all 125, plus the kit. At three builders at once that is
about 10 lessons a day.

## 5. Waves

| wave | what | lessons |
|---|---|---|
| H0 | kit, path page per course, scaffold `alsoTopics`, check-in per course | - |
| H1 | Algebra 1 | 19 |
| H2 | Geometry | 18 |
| H3 | Statistics and probability | 15 |
| H4 | Algebra 2 | 20 |
| H5 | Precalculus | 20 |
| H6 | Calculus | 18 |
| H7 | Discrete math and reasoning, Money | 15 |

Each wave ships when its lessons pass the sweep; the site (`tools/lesson-deploy.sh`) is redeployed per wave.
A course is useful on its own, so the site gets each course as soon as its wave is done.

## 6. The lessons

### Algebra 1 (`algebra-1`): 19 lessons, 465 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `number-properties` | Properties and the real numbers | 25 | - | secondary-t6-01-real-number-properties-and-classification<br>secondary.real-number-system-classification-and-closure |
| 2 | `units-and-quantities` | Reasoning with units | 23 | - | secondary-t6-02-reasoning-with-units-and-quantities |
| 3 | `solving-linear-equations` | Solving linear equations and inequalities | 21 | - | secondary-t6-07-solving-linear-equations-and-inequalities-algebra-i |
| 4 | `creating-equations` | Writing equations and inequalities from constraints | 18 | - | secondary-t6-06-creating-equations-and-inequalities |
| 5 | `linear-functions-slope` | Linear functions and slope | 31 | - | secondary-t6-09-linear-functions-and-slope |
| 6 | `linear-models` | Linear equations from a context | 18 | linear-functions-slope | secondary-t6-32-writing-linear-equations-from-context |
| 7 | `linear-inequalities-2d` | Graphing inequalities in two variables | 27 | creating-equations, linear-functions-slope, solving-linear-equations | secondary-t6-33-graphing-linear-inequalities-two-variables |
| 8 | `linear-systems` | Systems of equations | 27 | creating-equations, linear-functions-slope, solving-linear-equations | secondary-t6-08-solving-systems-of-equations-algebra-i |
| 9 | `arithmetic-sequences` | Arithmetic sequences | 21 | - | secondary-t6-10-sequences-arithmetic |
| 10 | `piecewise-functions` | Piecewise and step functions | 24 | solving-linear-equations | secondary-t7-12-piecewise-and-step-functions |
| 11 | `absolute-value` | Absolute value functions and equations | 27 | piecewise-functions, solving-linear-equations | secondary-t7-13-absolute-value-functions-and-equations |
| 12 | `radicals-exponents` | Radicals and rational exponents | 28 | - | secondary-t6-03-radicals-and-rational-exponents |
| 13 | `exponential-functions` | Exponential growth and decay | 26 | units-and-quantities | secondary-t6-13-exponential-functions-and-growth-decay |
| 14 | `geometric-sequences` | Geometric sequences | 23 | arithmetic-sequences | secondary-t6-14-sequences-geometric |
| 15 | `polynomials` | Polynomial expressions | 27 | - | secondary-t6-04-algebraic-expressions-and-polynomials |
| 16 | `factoring` | Factoring | 24 | polynomials | secondary-t6-05-factoring-polynomials |
| 17 | `quadratic-functions` | Quadratic functions and their graphs | 33 | factoring, units-and-quantities | secondary-t6-11-quadratic-functions-graphing-and-key-features |
| 18 | `completing-the-square` | Solving quadratics: square roots, completing the square, the formula | 16 | - | secondary.solving-quadratic-equations-by-completing-the-square-and-the |
| 19 | `function-families` | Linear, quadratic or exponential? | 26 | exponential-functions, linear-functions-slope, quadratic-functions | secondary-t6-34-function-families-overview |

### Geometry (`geometry`): 18 lessons, 482 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `conditional-statements` | If-then statements and logical language | 13 | - | v2.extension.logical-reasoning |
| 2 | `geometry-foundations` | Definitions, postulates and first proofs | 31 | - | secondary-t6-17-foundations-of-geometry-definitions-postulates-and-reasoning |
| 3 | `counterexamples-and-proof` | Counterexamples, inference and proof | 15 | conditional-statements, geometry-foundations | v2.extension.counterexample-inference-and-proof |
| 4 | `triangle-congruence` | Triangle congruence | 31 | geometry-foundations | secondary-t6-19-triangle-congruence-sss-sas-asa-aas-hl |
| 5 | `triangle-inequalities` | Isosceles triangles and side-angle order | 12 | geometry-foundations, triangle-congruence | secondary.triangle-side-angle-relationships-isosceles-theorems-side-an |
| 6 | `constructions` | Constructions with compass and straightedge | 34 | geometry-foundations, triangle-congruence | secondary-t6-35-geometric-constructions<br>secondary.geometric-constructions |
| 7 | `triangle-centers` | Midsegments and points of concurrency | 35 | constructions, geometry-foundations, triangle-congruence | secondary-t6-20-properties-of-triangles |
| 8 | `quadrilaterals` | Parallelograms and other quadrilaterals | 41 | conditional-statements, triangle-centers | secondary-t6-21-parallelogram-and-quadrilateral-properties |
| 9 | `similarity` | Similar triangles | 25 | triangle-congruence | secondary-t6-22-similarity-criteria-and-applications |
| 10 | `right-triangle-trig` | Right triangle trigonometry | 29 | similarity, triangle-centers | secondary-t6-23-right-triangle-trigonometry |
| 11 | `coordinate-proofs` | Distance, midpoint and coordinate proofs | 33 | geometry-foundations, linear-functions-slope, quadrilaterals | secondary-t6-24-coordinate-geometry-distance-midpoint-and-slope-proofs |
| 12 | `circle-angles` | Arcs and angles in circles | 33 | geometry-foundations, triangle-centers | secondary-t6-26-circle-theorems |
| 13 | `chords-tangents` | Tangents, chords and segment lengths | 14 | circle-angles, constructions, similarity | secondary.tangents-chords-and-segment-lengths-in-circles |
| 14 | `arcs-and-sectors` | Arc length, sectors and radians | 26 | right-triangle-trig | secondary-t6-27-arc-length-and-sector-area |
| 15 | `circle-equations` | Equations of circles | 23 | circle-angles, linear-functions-slope | secondary-t6-28-equations-of-circles |
| 16 | `solids` | Surface area and volume of solids | 42 | - | secondary-t6-30-surface-area-and-volume-of-prisms-cylinders-pyramids-cones-spheres<br>secondary.scaling-similar-solids-surface-area-by-k-volume-by-k |
| 17 | `geometric-probability` | Geometric probability | 20 | - | secondary-t6-31-geometric-probability-and-modeling |
| 18 | `perspective` | Perspective drawing | 25 | - | v2.extension.perspective-geometry |

### Statistics and probability (`statistics`): 15 lessons, 313 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `one-variable-data` | Summarizing and comparing data | 28 | - | secondary-t6-15-statistics-summarizing-and-interpreting-data-algebra-i |
| 2 | `linear-regression` | Scatter plots, correlation and the regression line | 27 | linear-functions-slope | secondary-t6-16-linear-regression-and-correlation |
| 3 | `nonlinear-regression` | Quadratic and exponential regression | 21 | exponential-functions, linear-regression, quadratic-functions | secondary-t7-19-regression-models-non-linear |
| 4 | `counting` | Counting: permutations and combinations | 25 | - | secondary-t7-16-probability-counting-permutations-and-combinations |
| 5 | `advanced-counting` | Repeated objects and circular arrangements (AP) | 15 | conditional-statements, counterexamples-and-proof, counting | us.statistics.advanced-counting-repeated-objects-circular-and-pigeonhole |
| 6 | `conditional-probability` | Conditional probability and independence | 31 | - | secondary-t7-17-probability-conditional-and-independent-events |
| 7 | `normal-distribution` | The normal distribution | 30 | one-variable-data | secondary-t7-18-statistical-inference-normal-distribution |
| 8 | `expected-value` | Probability distributions and expected value | 24 | conditional-probability, counting, normal-distribution | secondary-t8-19-expected-value-and-probability-distributions |
| 9 | `probability-decisions` | Using probability to make decisions | 17 | expected-value | secondary-t8-20-using-probability-for-decisions |
| 10 | `margin-of-error` | Study design and estimating with a margin of error | 32 | linear-regression, normal-distribution | v2.extension.statistical-investigation<br>secondary.study-design-surveys-observational-studies-and-experiments<br>v2.extension.judging-and-reporting-a-statistical-investigation |
| 11 | `simulation-tests` | Testing a claim by simulation | 8 | margin-of-error | v2.extension.testing-a-claim-and-comparing-treatments-by-simulation |
| 12 | `sampling-distributions` | Sampling distributions and the central limit theorem (AP) | 13 | expected-value, margin-of-error, normal-distribution, one-variable-data | us.statistics.sampling-distributions-and-the-central-limit-theorem |
| 13 | `t-procedures` | t procedures for a mean (AP) | 15 | margin-of-error, normal-distribution, one-variable-data, sampling-distributions, simulation-tests | us.statistics.t-procedures-for-a-population-mean |
| 14 | `errors-and-power` | Type I and type II errors and power (AP) | 13 | conditional-probability, normal-distribution, sampling-distributions, simulation-tests | us.statistics.type-i-and-type-ii-errors-and-power |
| 15 | `chi-square` | Chi-square tests (AP) | 14 | conditional-probability, margin-of-error, simulation-tests | us.statistics.chi-square-tests-goodness-of-fit-independence-homogeneity |

### Algebra 2 (`algebra-2`): 20 lessons, 477 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `complex-numbers` | Complex numbers | 21 | number-properties, polynomials, radicals-exponents | secondary-t7-01-complex-numbers |
| 2 | `quadratics-complex` | Quadratics with complex solutions | 14 | complex-numbers, radicals-exponents | secondary-t7-09-solving-quadratic-equations-with-complex-solutions |
| 3 | `polynomial-identities` | Polynomial operations and identities | 14 | polynomials | secondary-t7-02-polynomial-operations-and-identities |
| 4 | `polynomial-division` | Polynomial division | 25 | polynomial-identities | secondary-t7-05-polynomial-division-long-and-synthetic |
| 5 | `higher-degree-factoring` | Factoring higher-degree polynomials | 26 | polynomial-identities | secondary-t7-03-factoring-higher-degree-polynomials |
| 6 | `polynomial-graphs` | Polynomial functions: graphs and behavior | 30 | quadratic-functions | secondary-t7-04-polynomial-functions-graphing-and-behavior |
| 7 | `polynomial-theorems` | Remainder and factor theorems, complex zeros | 23 | complex-numbers, polynomial-division, quadratics-complex | secondary-t8-13-polynomial-theorems-and-complex-zeros |
| 8 | `rational-expressions` | Rational expressions and equations | 28 | factoring, solving-linear-equations | secondary-t7-06-rational-expressions-and-equations<br>secondary.rational-equations-and-extraneous-solutions |
| 9 | `rational-functions` | Rational functions | 24 | polynomial-division, polynomial-graphs, rational-expressions | secondary-t8-10-rational-functions-graphing-and-analysis |
| 10 | `function-transformations` | Transformations of functions | 22 | polynomials | secondary-t7-11-transformations-of-functions-general |
| 11 | `radical-functions` | Square-root and cube-root functions and equations | 27 | function-transformations, radicals-exponents, solving-linear-equations | secondary-t7-07-radical-equations-and-functions<br>secondary.radical-equations-and-extraneous-solutions |
| 12 | `function-analysis` | Key features: local and global claims | 25 | absolute-value, function-families, function-transformations, polynomial-graphs, quadratic-functions, radical-functions, rational-expressions | secondary-t7-21-function-notation-and-analysis-advanced |
| 13 | `composition` | Combining and composing functions | 25 | function-analysis, polynomials, quadratic-functions, units-and-quantities | secondary-t7-10-function-operations-and-composition<br>secondary.composite-functions-domain-range-and-behavior |
| 14 | `inverse-functions` | Inverse functions | 18 | composition, quadratic-functions, units-and-quantities | secondary.inverse-functions-and-domain-restrictions |
| 15 | `logarithms` | Exponential and logarithmic functions | 27 | composition, exponential-functions, radicals-exponents | secondary-t7-08-exponential-and-logarithmic-functions |
| 16 | `exp-log-equations` | Exponential and logarithmic equations | 28 | composition, logarithms, solving-linear-equations | secondary-t8-12-exponential-and-logarithmic-equations-advanced |
| 17 | `nonlinear-systems` | Systems of nonlinear equations | 26 | circle-equations, creating-equations, linear-inequalities-2d, quadratic-functions, linear-systems | secondary-t7-14-systems-of-equations-nonlinear |
| 18 | `three-variable-systems` | Systems of three equations | 21 | quadratic-functions, linear-systems | secondary-t7-20-solving-systems-of-three-equations |
| 19 | `series` | Arithmetic and geometric series | 29 | arithmetic-sequences, conditional-statements, exponential-functions, geometric-sequences | secondary-t7-15-sequences-and-series<br>secondary.infinite-geometric-series-and-convergence |
| 20 | `binomial-theorem` | The binomial theorem | 24 | counting, polynomial-identities | secondary-t8-18-binomial-theorem-and-pascal-s-triangle |

### Precalculus (`precalculus`): 20 lessons, 483 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `unit-circle` | The unit circle | 33 | arcs-and-sectors, radicals-exponents, right-triangle-trig, triangle-centers | secondary-t8-01-trigonometric-functions-unit-circle |
| 2 | `trig-graphs` | Graphs of trig functions and periodic models | 32 | function-analysis, function-transformations, unit-circle | secondary-t8-02-graphing-trigonometric-functions |
| 3 | `inverse-trig` | Inverse trig functions | 17 | composition, unit-circle | secondary-t8-03-inverse-trigonometric-functions |
| 4 | `trig-identities` | Fundamental trig identities | 23 | radicals-exponents, rational-expressions, unit-circle | secondary-t8-04-trigonometric-identities |
| 5 | `trig-equations` | Solving trig equations | 27 | function-analysis, inverse-trig, trig-identities, unit-circle | secondary-t8-05-solving-trigonometric-equations |
| 6 | `sum-difference-identities` | Sum, difference, double- and half-angle identities | 28 | coordinate-proofs, inverse-trig, trig-equations, trig-graphs, trig-identities, unit-circle | us.functions.sum-difference-double-angle-and-half-angle-identities<br>secondary.sum-difference-and-double-angle-identities |
| 7 | `laws-of-sines-cosines` | Law of sines and law of cosines | 27 | creating-equations, right-triangle-trig, triangle-centers, triangle-congruence | secondary-t8-06-law-of-sines-and-law-of-cosines |
| 8 | `vectors` | Vectors in the plane and the dot product | 32 | inverse-trig, laws-of-sines-cosines, unit-circle | secondary-t8-08-vectors-2d<br>secondary.dot-product-and-angles-between-vectors-in-2d |
| 9 | `polar-complex` | Polar coordinates and complex numbers in trig form | 27 | complex-numbers, inverse-trig, sum-difference-identities, unit-circle | secondary-t8-07-polar-coordinates-and-complex-numbers-in-trig-form |
| 10 | `polar-graphs` | Polar equations and their graphs | 17 | circle-equations, polar-complex, trig-graphs, trig-identities | us.functions.polar-equations-and-their-graphs |
| 11 | `parabola-focus` | Circle and parabola as loci | 23 | circle-equations | secondary-t8-11-conic-sections |
| 12 | `ellipse-hyperbola` | Ellipse and hyperbola | 28 | function-analysis, linear-functions-slope, parabola-focus, radical-functions | secondary.ellipse-and-hyperbola-locus-standard-form-features-and-deriv |
| 13 | `parametric` | Parametric equations | 30 | circle-equations, function-analysis, quadratic-functions, solving-linear-equations, trig-identities, unit-circle | secondary-t8-17-parametric-equations |
| 14 | `matrices` | Matrices | 23 | - | secondary-t8-09-matrices-operations-and-applications |
| 15 | `vectors-3d` | Vectors in three dimensions | 18 | matrices, vectors | us.geometry.vectors-in-three-dimensions-dot-and-cross-product |
| 16 | `matrix-systems` | Matrix methods for linear systems | 24 | matrices, linear-systems | secondary.matrix-methods-for-linear-systems |
| 17 | `induction` | Proof by induction | 20 | conditional-statements, polynomials, series | secondary-t8-14-sequences-series-and-mathematical-induction |
| 18 | `de-moivre` | Powers and roots of complex numbers (AP) | 13 | complex-numbers, induction, polar-complex, radicals-exponents, unit-circle | us.functions.complex-powers-and-roots-de-moivre-theorem |
| 19 | `nonlinear-inequalities` | Logarithmic, radical and trig inequalities (AP) | 15 | exp-log-equations, function-analysis, logarithms, polynomial-graphs, radical-functions, solving-linear-equations, trig-equations, trig-graphs, unit-circle | us.algebra.logarithmic-radical-and-trigonometric-inequalities |
| 20 | `limits` | Limits | 26 | function-analysis, logarithms, radicals-exponents, rational-expressions, trig-identities, unit-circle | secondary-t8-15-limits-intuitive-and-algebraic |

### Calculus (`calculus`): 18 lessons, 311 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `derivative-idea` | The derivative: rate of change and tangent slope | 18 | limits, linear-functions-slope | secondary-t8-16-introduction-to-derivatives-pre-calculus |
| 2 | `derivative-rules` | Differentiation rules | 22 | composition, derivative-idea, limits, logarithms, unit-circle | v2.extension.derivative-techniques |
| 3 | `implicit-differentiation` | Implicit, inverse and logarithmic differentiation | 24 | composition, derivative-rules, exp-log-equations, inverse-trig, logarithms, trig-identities | us.functions.implicit-inverse-and-logarithmic-differentiation |
| 4 | `derivative-applications` | Motion, related rates and linearization | 24 | derivative-idea, derivative-rules, exp-log-equations, limits, similarity, solids | us.functions.applications-of-derivatives-motion-related-rates-linearizati |
| 5 | `definite-integral` | The definite integral as accumulation | 17 | derivative-idea, limits | v2.extension.integral-calculus |
| 6 | `fundamental-theorem` | Antiderivatives and the fundamental theorem | 20 | definite-integral, derivative-rules, unit-circle | v2.extension.antiderivatives-and-the-fundamental-theorem-of-calculus |
| 7 | `integration-applications` | Area, average value and volume | 27 | composition, definite-integral, derivative-idea, nonlinear-systems, solids | us.functions.applications-of-integration-area-between-curves-average-valu |
| 8 | `integration-techniques` | Integration by parts and partial fractions (AP) | 16 | definite-integral, derivative-rules, factoring, fundamental-theorem, implicit-differentiation, polynomial-division, rational-expressions, solving-linear-equations, linear-systems | us.functions.integration-by-parts-and-partial-fractions |
| 9 | `improper-integrals` | Improper integrals (AP) | 13 | derivative-applications, fundamental-theorem, limits, logarithms | us.functions.improper-integrals |
| 10 | `differential-equations` | Differential equations: growth, decay, cooling | 21 | definite-integral, derivative-rules, exp-log-equations, exponential-functions, units-and-quantities | v2.extension.differential-equations |
| 11 | `optimization` | Derivative tests, curve sketching and optimization | 16 | creating-equations, derivative-idea, differential-equations, limits, rational-functions, solids | v2.extension.derivative-tests-curve-sketching-and-optimization |
| 12 | `euler-method` | Euler's method | 10 | differential-equations | v2.extension.euler-s-method-approximating-solutions-and-judging-their-acc |
| 13 | `parametric-calculus` | Parametric and vector calculus, arc length (AP) | 15 | coordinate-proofs, definite-integral, derivative-rules, fundamental-theorem, limits, optimization, parametric, vectors | us.functions.parametric-and-vector-valued-calculus-and-arc-length |
| 14 | `polar-calculus` | Calculus in polar coordinates (AP) | 13 | arcs-and-sectors, definite-integral, derivative-rules, fundamental-theorem, parametric-calculus, polar-complex, polar-graphs, sum-difference-identities, trig-equations | us.functions.polar-calculus-slope-and-area |
| 15 | `series-tests-1` | Infinite series I: nth-term, integral and comparison tests (AP) | 15 | improper-integrals, limits, optimization, series | us.functions.series-convergence-nth-term-integral-p-series-and-comparison |
| 16 | `series-tests-2` | Infinite series II: alternating series and the ratio test (AP) | 13 | counting, limits, optimization, series, series-tests-1 | us.functions.alternating-series-ratio-test-and-absolute-convergence |
| 17 | `taylor-polynomials` | Taylor polynomials and the error bound (AP) | 13 | counting, derivative-applications, derivative-rules, optimization, series-tests-2 | us.functions.taylor-polynomials-and-lagrange-error-bound |
| 18 | `power-series` | Power series (AP) | 14 | derivative-rules, function-analysis, fundamental-theorem, limits, series, series-tests-1, series-tests-2, taylor-polynomials | us.functions.power-series-radius-interval-and-taylor-series |

### Discrete math and reasoning (`discrete`): 10 lessons, 238 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `sets` | Sets and Venn diagrams | 24 | counting, number-properties | us.algebra.sets-operations-venn-diagrams-relations-and-set-proofs |
| 2 | `propositional-logic` | Truth tables and indirect proof | 21 | conditional-statements, geometry-foundations | us.algebra.propositional-logic-truth-tables-equivalence-and-indirect-pr |
| 3 | `number-theory` | Number bases, the Euclidean algorithm and clock arithmetic (AP) | 15 | counterexamples-and-proof | us.numbers.number-bases-euclidean-algorithm-and-modular-arithmetic |
| 4 | `graph-theory` | Networks, paths, circuits and trees | 38 | counting, probability-decisions | us.algebra.graph-theory-networks-paths-circuits-coloring-and-trees |
| 5 | `fair-division` | Fair division and apportionment | 26 | - | us.algebra.fair-division-and-apportionment |
| 6 | `voting` | Voting methods and fairness | 25 | counting | us.algebra.election-theory-voting-methods-fairness-criteria-and-weighte |
| 7 | `game-theory` | Game theory: payoff matrices | 17 | expected-value, probability-decisions, linear-systems | us.statistics.game-theory-payoff-matrices-and-optimal-strategies |
| 8 | `modeling` | Modeling new situations | 20 | - | v2.extension.reasoning-transfer |
| 9 | `scheduling` | Scheduling and bin packing | 22 | modeling | us.algebra.scheduling-and-bin-packing |
| 10 | `tech-projects` | Modeling projects with technology | 30 | arithmetic-sequences, creating-equations, geometric-sequences | v2.extension.technology-projects |

### Money (`money`): 5 lessons, 97 sub-goals

| # | slug | lesson | sub-goals | needs (earlier lessons) | topic ids |
|---|---|---|---|---|---|
| 1 | `budgets-net-worth-7` | Budgets, net worth and responsibility (grade 7-8) | 15 | - | us.pfl.personal-budgets-net-worth-and-financial-responsibility |
| 2 | `credit-college-7` | Credit, saving and paying for college (grade 7-8) | 15 | - | us.pfl.credit-saving-and-paying-for-college |
| 3 | `income-tax` | Budgets, net worth and income tax | 27 | piecewise-functions | us.pfl.budgets-net-worth-and-income-tax |
| 4 | `investing` | Investing and retirement saving | 23 | exponential-functions, one-variable-data, series, tech-projects | us.pfl.investing-and-retirement-saving |
| 5 | `economic-indicators` | CPI, inflation, GDP and unemployment | 17 | - | us.pfl.economic-indicators-cpi-inflation-gdp-and-unemployment |

## 7. Progress

- 2026-10-26: plan written; 7-8 line deployed (`tools/lesson-deploy.sh`, https://math-path-3vc.pages.dev); H0 part 1:
  `pages/lessons/topics-hs.json`, path page with a tab per course, scaffold folds `alsoTopics` (shared sub-goal ids
  kept once), STATUS.md per course; kit piece 1 **Plane** (`src/lesson/kit/Plane.ts`, `tests/kit-plane.test.ts`, dev
  page `pages/kit.html?n=0..5&k=1`). Next: proof frame, data plots, simulator, unit circle, space, small blocks; then
  the Algebra 1 blueprint lesson.
