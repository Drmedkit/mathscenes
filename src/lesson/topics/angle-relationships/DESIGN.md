# Angle relationships (`angle-relationships`)

Topic `secondary-t5-22-angle-relationships` (grade 7, 7.G.B.5), 25 sub-goals, grades 7–8.

## Concept
Angles at one vertex get two kinds of names. **Position** names say where they are: adjacent (shared vertex and
side, no overlap), vertical (across a crossing of two lines), linear pair (adjacent, outer sides opposite rays).
**Measure** names say what they add to: complementary (90°), supplementary (180°). Each name gives a fact
(vertical: equal; linear pair: 180; around a point: 360; parts of a given whole: the whole), the fact becomes an
equation, and the equation finds the unknown, through intermediate angles when needed. Only **encoded evidence**
counts: a drawn and labeled line, a right-angle box, arcs, labels, words. Looks and protractor readings of a sketch
do not.

## Model
**An angle figure on drawing paper** (`AngleFig.ts` paints, `angleMaths.ts` computes and lays out). A picture is one
or two fans: a vertex, rays by direction, the lines that are DRAWN through the vertex (two opposite rays as one
stroke with two arrowheads), and marks (arc or right-angle box, a label: a measure, a number name, x, an
expression; an `alt` label revealed after solving; equal-angle ticks). `layoutPic` sizes the fan to the frame and
searches a spot for every label inside its own angle, off every ray and arc, clear of every other label and the frame
edge; `picFits` refuses a picture that cannot be drawn readably (generators retry). Relationship predicates
(`adjacent`, `linearPair`, `vertical`, `isLine`) use the drawn lines only, so "looks aligned" never counts.
Colour roles: amber = the whole (the straight angle 180, the right-angle box, a given whole), teal = a known part,
lime = the unknown / the answer, lavender = the angle being named, red = wrong. Part 1 paints the lines as streets
(concreteness fading: streets → lines → bare equations).

The board is wider than the runtime's (angle names are long): `bl()` fits a line to it and the leaders are drawn
against its edge locally; symbol ↔ wedge links that would cross the figure are glows instead of leaders.

## The five parts
1. **The question** – Main St and Oak Ave are straight and cross; one corner is 65°: the corner across? Cards 115°
   (`congruent-pair-treated-as-supplementary`), 65°, "can't tell, it has no number" (`unlabeled-unknowable`) + how sure.
2. **Worked example** – the streets fade into lines AC and BD. Read the givens (only the drawn lines and the 65°) →
   Name the pair (the straight angle AOC lights up: linear pair, 180°) → Write and solve (65 + x = 180, x = 115) →
   Go across (line BD gives a second linear pair: m∠COD = 65°, with a leader; ∠AOD = 115°; equal ticks: "across:
   equal"). Why: "why do ∠AOB and ∠BOC add to 180°?" (right / `adjacency-implies-special-total` / `trusts-diagram-appearance`).
3. **Your turn** – lines PR and QS with 38° opening to the LEFT (vertical angles that open sideways). Read and name
   are given; the kid types m∠QOR (142; 52 = `complementary-supplementary-swapped`, 38 = `supplementary-pair-set-equal`,
   180 = `reports-whole-as-missing-part`) and picks m∠ROS (38° / 142° `congruent-pair-treated-as-supplementary` / 52°).
   Callback to the card picked in part 1.
4. **Prove it** – Jordan measured five crossings and says that proves it. Judge, then a two-column proof (panel table
   Statement | Reason; the board writes each statement and its short reason as the chip lands): m∠1 + m∠2 = 180
   (linear pair, line AC) / m∠2 + m∠3 = 180 (linear pair, line BD) / m∠1 + m∠2 = m∠2 + m∠3 (both equal 180) /
   m∠1 = m∠3 (subtract m∠2). Distractor chips: "I measured them" (`examples-as-proof`), "adjacent, so 180"
   (`adjacency-implies-special-total`); a right reason in the wrong row says so. The picture backs each row (the two
   straight angles, ∠2 fades away, ticks on ∠1 and ∠3); then line BD swings through many crossings with live
   measures, ∠1 = ∠3 all the way (`proof-covers-only-drawn-case`).
5. **Practice** – all 25 sub-goals in order, then mixed (runtime). A miss reveals the unknown's value in the figure,
   lights the angles that matter, and writes the worked equations on the board.

## Sub-goal → families (plan.ts)
| # | sub-goal | families | misconceptions classified |
|---|---|---|---|
| 1 | rays-opposite-rays | rays (which pair, name the ray, how many pairs, bent) | any-two-rays-opposite, ray-name-order-ignored |
| 2 | read-angle-names | names (marked angle, sides of ∠PQR, numbered angle at a crossing) | misreads-three-letter-angle-names, ignores-last-letter |
| 3 | diagram-conventions | evidence (no box, box, not to scale, drawn line, look-alike rays) | trusts-diagram-appearance, measures-not-to-scale-drawing-as-exact, rejects-drawn-labeled-info |
| 4 | identify-adjacent | adjacent (which pair; total of an adjacent pair) | misidentifies-adjacent-angles, assumes-whole-is-90-or-180 |
| 5 | angle-additivity | addParts (sum, three parts, overlapping, right-angle parts), armLength | adds-overlapping-angles, angle-size-from-arm-length, assumes-whole, reports-whole |
| 6–7 | identify-complementary / -supplementary | pairName (pairs, near misses, two right angles, 120° has no complement) | complementary-supplementary-swapped, pair-must-be-adjacent, each-complementary-angle-90, supplementary-needs-obtuse |
| 8 | identify-linear-pair | linearPair (drawn line, look-alike, bent, why 180) | trusts-diagram-appearance, assumes-whole, rejects-drawn-labeled-info, supplementary-pair-set-equal |
| 9 | identify-vertical | vertical (two lines opening sideways, three lines, bent ray) | misidentifies-vertical-angles, any-nonadjacent-pair-is-vertical |
| 10 | vertical-angles-equal | equalPick (which statement; equal ≠ vertical) | congruent-pair-treated-as-supplementary, equal-measures-imply-pair-relation |
| 11 | cross-classify | allNames (linear, adjacent+complementary, vertical right angles, adjacent only, separated supplementary) | figure-gets-only-one-name |
| 12–13 | find-complement / find-supplement | findPair (adjacent with box / line, separated, bare 1–89 / 1–179) | complementary-supplementary-swapped, reports-whole-as-missing-part |
| 14 | find-vertical | findVertical (across or next door) | congruent-pair-treated-as-supplementary, supplementary-pair-set-equal |
| 15 | find-missing-part | missingPart (non-benchmark whole) | adjacency-implies-special-total, adds-overlapping-angles |
| 16 | several-parts-on-line | lineParts (3–4 parts on a line, 3 in a right angle) | omits-known-parts, swaps-straight-and-full-turn-totals |
| 17 | angles-around-point | aroundPoint (4–5 angles) | swaps-straight-and-full-turn-totals, omits-known-parts |
| 18 | select-relationship | mixed (one-step items of every kind, no name prompt) | the kind's own + last-practiced-rule |
| 19 | chain-relationships | chain (vertical then part, complement then vertical, supplement then part, "can it be found?") | wrong-angle-in-figure, applies-sequence-steps-to-original, unlabeled-unknowable |
| 20 | justify-steps | reason (vertical, linear pair, right angle, full turn) | cites-theorem-without-checking-hypotheses, step-without-reason |
| 21 | reject-unsupported | critique (look-alike line, no box, wrong fact, supported) | trusts-diagram-appearance, cites-theorem-without-checking-hypotheses |
| 22 | vertical-general-argument | argument (which argument, does it transfer, last step) | examples-as-proof, proof-covers-only-drawn-case |
| 23 | angle-expressions | expr (supplementary, right angle, vertical, three on a line; ask x or the angle) | supplementary-pair-set-equal, reports-x-not-asked-quantity |
| 24 | combined-expression-angles | exprCombined (linear pair of two expressions, x + x around a point, right angle) | repeated-addends-collapsed, minus-sign-detached, supplementary-pair-set-equal, reports-x |
| 25 | model-context | context (streets, scissors, frame brace, ladder, ramp, what must you assume) | wrong-angle-in-figure, trusts-diagram-appearance + the relationship's own |
