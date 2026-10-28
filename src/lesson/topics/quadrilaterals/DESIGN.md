# Parallelograms and other quadrilaterals (Geometry, lesson 8)

Topic: `secondary-t6-21-parallelogram-and-quadrilateral-properties` (41 sub-goals, three stages). Requires
`conditional-statements` (if-then, converse, counterexample, Euler pictures) and `triangle-centers` (the triangle
midsegment theorem, the proof frame habits). Colour roles as in the course: amber = givens / the class, teal = the
second given / a known part, lime = what is earned (the answer), lavender = focus, red = wrong.

**Concept.** A quadrilateral is classified by its MARKS and definitions, never by its looks; the classes nest
(square ⊂ rectangle, rhombus ⊂ parallelogram ⊂ trapezoid (inclusive: at least one pair of parallel sides) ⊂
quadrilateral; rhombus ⊂ kite; an isosceles trapezoid here is a trapezoid with congruent legs that is NOT a
parallelogram). Properties pass DOWN the tree. A property every member has is necessary; a condition that guarantees
membership is sufficient, and that depends on the stated universe (congruent diagonals: not enough among quadrilaterals,
the rectangle test among parallelograms). Every converse is its own claim.

**Models.**
- `quad.ts`: exact shapes from their defining numbers (parallelogram family from two sides and an angle, kite from its
  axis, trapezoid from its bases), `factsOf` (what the coordinates show and the most specific class), the hierarchy
  (`UP`, `every`, `some`), `qfig` (the course's buildFig: tick groups equal, arcs equal, boxes 90°, plus a chevron
  check: every group parallel and pointing the same way), regular polygons and polygons with prescribed angles.
- `Tree.ts`: the family tree as a directed inclusion diagram (square below rectangle AND rhombus, rhombus below
  parallelogram AND kite); nodes can wait as "?", glow or dim. Could move to the kit (a labelled DAG painter).
- Reused read-only: geometry-foundations GeoFig/geo/ProofFrame/proofPanel/Card, triangle-congruence buildFig/mapFig,
  triangle-centers tkit (`fitted`, relabelling, choice / number helpers), conditional-statements Euler (rectangles and
  rhombuses inside parallelograms, the square in the overlap).
- `qProofs.ts`: 11 proofs (opposite sides, consecutive angles, diagonals bisect, rectangle diagonals; the tests from
  opposite sides, from bisecting diagonals, from one pair, rhombus from perpendicular diagonals, rectangle from
  congruent diagonals; isosceles-trapezoid diagonals; the trapezoid midsegment) with decoys and per-row wrong reasons.
- `conds.ts`: conditions and hand-written necessary / sufficient labels per class and universe; the test checks every
  label against a catalogue of exact shapes (a counterexample must exist for every "no", none for every "yes").

**Rules the generators keep.** A figure's drawn class is the class its marks guarantee; near-misses (a parallelogram
at 84-87°, a rectangle 6-10 % off square, a kite 1-3 % off a rhombus, a trapezoid whose legs are 5-8° off parallel)
look special but are not, so the drawing never contradicts the marks. Labelled lengths are drawn at one scale,
labelled angles at their measure, an expression label at the value x gives it. Every item that names trapezoids or
kites states the inclusive definitions; every item that names an isosceles trapezoid states its convention. "Not
enough information" appears only where the marks leave the relation open (tested by construction). "Most specific"
items offer only class names and exactly one is right. Halving follows the sub-goal's ranges (even, odd → .5, even
tenths). Letters are relabelled (4-letter names too: `twQ` in qkit.ts).

## The five parts
1. **The question**: a framer measures both diagonals of a picture frame (34 in. each): is it a rectangle? Yes
   (`necessary-property-as-sufficient-test`) / not yet, it must be a parallelogram first (right) / only the four
   corners can tell (`unmarked-relation-assumed-false`) + how sure. The frame is drawn with its two tape measures.
2. **Worked example: one parallelogram, three moves.** Measure (opposite sides and angles, live readout) → draw the
   diagonals (E is the midpoint of each) → push the corners to 90° (rectangle: congruent diagonals) → squeeze the sides
   equal (rhombus: perpendicular diagonals). A moving shape is unmarked; marks return when it settles. Why does the
   rectangle still bisect? (inheritance / "because congruent" / looks).
3. **Your turn** (faded): a rhombus with m∠DAB = 64°: m∠ABC = 116° worked; m∠DAC = 32 (64 whole, 58 crossing,
   116) and m∠ABD = 58 (32, 116, 64) typed.
4. **Prove it**: a parallelogram with congruent diagonals is a rectangle (6 lines, Parsons with two decoys: AC ⊥ DB,
   the right angle as "Given"; then reasons, with SAS and the converse theorem as wrong reasons). Back to the frame:
   the rectangle slides into an isosceles trapezoid, both diagonals still 34 in.; what must the framer add (opposite
   sides equal)? The trapezoid slides back. Callback to part 1.
5. **Practice**: all 41 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 58 families
| sub-goal | families |
|---|---|
| read-markings | markRead (near-miss figures: marked / unknown, never "false"), markMeaning |
| defining-properties | defPick (definition vs prototype vs a property that is not enough), defGallery |
| class-inclusion | inclWhy (12 questions with a reason), treeName |
| inheritance | inheritWhich (down, not up or across), inheritChain (an argument that passes a property up) |
| hierarchy-diagram | treeName (a hidden node), vennZone (Euler: rectangles, rhombuses, the square in the overlap) |
| classify-all-names | allNames, mostSpecific |
| evidence-limited | guaranteed (near-miss figures), couldBe (must vs could) |
| all-some-no | allSomeNo (witnesses from the hierarchy, converse distractors) |
| measure-part-whole | partWhole (segment sum / difference / halves, angle parts, perimeter from four sides) |
| opposite-consecutive | oppCons |
| opposite-sides | oppSide, perim |
| opposite-angles | oppAngle |
| consecutive-angles | consAngle (incl. halves and the 90-90 case) |
| polygon-angle-sums | polySum (sum from n, n from sum), polyMissing, measuredSum (538° measured vs 540°), extSum |
| regular-polygon-angles | regAngle, regSides (incl. impossible angles) |
| diagonal-vocabulary | diagVocab |
| diagonal-conjecture | conjTable (measured tables, conjecture vs "proved") |
| diagonals-bisect | diagHalf (incl. the other diagonal: not enough information) |
| rectangle-diagonals | rectDiag |
| rhombus-perpendicular | rhombPerp (incl. the side from half-diagonals, Pythagorean triples) |
| angle-bisector-meaning | bisMeaning (vertex part vs crossing angle; halves and wholes) |
| rhombus-angle-bisect | rhombBis |
| diagonal-angle-chase | chaseRect (isosceles △AEB), chaseRhomb (right △AEB) |
| mixed-selection | mixedProp (rhombus + one right angle = square; parallelogram diagonals not congruent; ...) |
| property-to-equation | eqOpp (one side, both sides, half-diagonals; report the measure), eqCons |
| prove-parallelogram-properties | propReason, propOrder (Parsons or statement) |
| sufficient-meaning | suffMean |
| converse-formation | converseForm |
| necessary-meaning | necMean (proved properties count; accidental properties do not) |
| parallelogram-tests | paraTest (three tests; one congruent pair, congruent diagonals: not enough) |
| one-pair-test | onePair (the same pair vs different pairs) |
| rectangle-tests | rectTestF (with and without the parallelogram premise) |
| rhombus-tests | rhombTest (three tests, the kite contrast, the square as both, four sides is not a square) |
| kite-diagonals | kiteDiag |
| isosceles-trapezoid-diagonals | isoTrapDiag (BD = AE + EC, not 2·AE) |
| counterexample-sufficiency | counterEx (12 claims; meets both / misses the hypothesis as distractors) |
| four-way-classification | fourWay (labels from conds.ts) |
| universe-dependence | universe (each universe judged on its own) |
| justify-sufficient-test | testReason (proofs of the tests), solveForTest (x that makes it one) |
| trapezoid-theorems | trapMid (bases, a missing base, contexts, algebra), isoTrapAngle, trapProof |
| practical-check | practical (frames, doors, tabletops, patios) |

Notes: no runtime or kit change. Could move to the kit: `Tree.ts` (a labelled inclusion diagram), `quad.ts` figures
next to the course's GeoFig.
