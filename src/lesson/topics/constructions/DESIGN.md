# Constructions with compass and straightedge (Geometry, lesson 6)

Topics: `secondary-t6-35-geometric-constructions` + folded `secondary.geometric-constructions` (34 sub-goals).
Requires `geometry-foundations` (proof frame, reasons, figures) and `triangle-congruence` (SSS / SAS / CPCTC).
Colour roles as in the course: ink = given, teal = compass arcs, amber = a helper line / a given equality,
lime = the result / what is earned, lavender = the compass and focus, red = a broken step (after the answer).

**Concept.** A construction is exact in principle because every arc is a distance condition (every point on it is
the compass width from the needle point) and every crossing inherits all the conditions of its curves. Points are
given, freely chosen (any width wide enough, any line through P: the result must hold for every such choice) or
determined as crossings; nothing is measured or eyeballed. Why a construction works is a congruence argument built
from exactly those equal widths (SSS, then corresponding parts; for the perpendicular bisector SSS then SAS and a
congruent linear pair).

**Models.**
- `cons.ts`: the exact maths. A construction (`Cons`) = given lines / arcs, named points (each lists the steps it
  depends on) and steps (tool: compass / straightedge / mark, or the non-construction tools ruler / protractor /
  eye; the points each step needs, the steps it must follow because it keeps their width). Circle-circle,
  line-circle, line-line intersections; `validOrder` (any order where every step comes after what it needs);
  `withFake` (one step replaced by a measuring / guessing step that makes the same points). Builders: copy a segment
  (twice, short ray), equilateral triangle (one or both crossings), perpendicular bisector (also with two widths),
  angle bisector (also with unequal marks), perpendicular at a point (also off-centre), perpendicular from a point,
  copy an angle (also radius-only), parallel by two perpendiculars, parallel by a corresponding angle (also the wrong
  side), hexagon / triangle in a circle, square in a circle (also two skew diameters).
- `Construct.ts`, **the construction player** (could move to the kit): draws a `Cons` step by step on the course's
  sheet (`upto` fractional = the current step drawing on, with a compass glyph: needle on the centre, pencil on the
  arc tip), points appear when determined, overlays (ticks for guaranteed equal lengths, triangle washes, angle arcs
  and right-angle boxes, a ring, red broken steps). Layout is pure: fit + every letter in a direction clear of every
  line, arc and letter of the FINAL state; `consProblems` refuses a layout that would not read.
- Reused read-only: `geometry-foundations` geo.ts + GeoFig.ts (definition figures, loci), ProofFrame.ts (the
  missing-reason proofs), Card.ts, kit.ts (`choiceItem`, `numItem`).

## The five parts
1. **The question**: Jun measures the midpoint of AB = 9.8 cm with a ruler; Ava swings equal arcs and joins the
   crossings. Whose midpoint is exact, even in principle? Jun (`construction-by-eye-or-measure`) / Ava (right) /
   neither, both just draw a point (`construction-arcs-seen-as-decoration`) + how sure.
2. **Worked example** (Ava's construction on the player): arcs about A (board PA = w, QA = w) -> same width about B
   (P and Q inherit both: PA = PB, QA = QB, ticks) -> join PQ (M) -> read: AM = BM, PQ ⊥ AB. Why keep the width?
   (right / neat = decoration / any arcs = `compass-width-changed`).
3. **Your turn**: bisect an angle. Tap the four steps in an order that works (a protractor decoy is refused as a
   non-construction, a step that needs a point not yet drawn is refused), each plays on the player. Then why it
   works: SSS (right) / looks halfway (`diagram-appearance-as-given`) / SAS with the angles at O (`circular`).
   Board: OA = OB, AX = BX, OX = OX, △OAX ≅ △OBX, ∠AOX ≅ ∠BOX.
4. **Prove it**: always, or only when drawn carefully? Because-chain on Ava's figure: PA = PB, QA = QB (one width)
   -> △APQ ≅ △BPQ (SSS) so ∠APM ≅ ∠BPM -> AM = BM and both angles at M are 90° (SAS + congruent linear pair).
   Decoy chips: M looks in the middle (appearance), a protractor reads 90° (`procedure-or-measurement-as-proof`).
   Callback to part 1.
5. **Practice**: 34 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 67 families
| sub-goal | families |
|---|---|
| construction-rules | spotFake (any construction), toolRules, freeChoice |
| arc-distance | arcRead (num), onInside, reopened |
| circle-intersections | howMany (num 0/1/2), bothCond |
| perp-bisector-definition | pbWhich (gallery: midpoint at 70°, perpendicular off the midpoint, both), pbBoth |
| angle-bisector-definition | abHalf (num), abMid (scalene: the bisector misses the midpoint) |
| compass-transfer | nextStep (copy a segment), keepWidth, needleWhere |
| copy-segment | orderSteps (short ray / twice), copyTwice (num), turnedCopy |
| equilateral-triangle | eqWhy, eqRhombus (num), orderSteps |
| perp-bisector-construct | pbWidth, orderSteps, spotFake |
| midpoint-from-bisector | midPick, midNum (num) |
| angle-bisector-construct | orderSteps, abFlawRays, nextStep |
| perp-through-point-on-line | orderSteps, ponWrong |
| inscribed-regular-polygons | hexClose, centralAngle (num), polyJoin (square / skew diameters), spotFake |
| perp-through-point-off-line | poffRadius (tangent / too short), orderSteps |
| copy-angle | caChord, orderSteps, armLength |
| parallel-double-perpendicular | secondPerp (at the foot), ddWhy |
| parallel-corresponding-angle | corrCheck (right / wrong side), corrWhy (converse), nextStep |
| other-tools-constructions | foldWhich, dragTest, foldWhy |
| construction-conjectures | circumWhere (acute / right / obtuse), guaranteed (width = AB coincidences), testConj |
| construction-givens | givenFromArcs (distractors at least 10 % unequal in the drawing), sharedSide |
| justify-angle-bisector | abProofCrit, abProofNext, proofReason (proof frame, one reason asked) |
| justify-copy-angle | caProof, caMissing (radius-only copy) |
| justify-perp-bisector | pbProof1, pbProof2, pbLinear (num), proofReason |
| equidistance-forward | fwdNum (any point Y of the bisector), fwdWhy |
| equidistance-converse | convWhy, iffBoth, boundaryCase |
| diagnose-failed-construction | diagnose (two widths / unequal marks / radius-only / off-centre), measuredProof |
| choose-locus | chooseLocus, onPath (one / none / every point) |
| intersect-loci | threeTowns (collinear: none), whyTwo |
| circle-locus | circleLocus, arcMeaning |
| perpendicular-bisector | nextStep, midPick, spotFake |
| angle-bisector | abArbitrary (midpoint of unequal marks), nextStep, spotFake |
| perp-on-line | nextStep, ponSlant |
| perp-off-line | nextStep, connector |
| parallel-through-point | orderSteps (two perpendiculars), secondPerp, spotFake |

Generic families (ckit.ts): `nextStep` (a second valid next step is never offered; wrong = a step that needs
something not drawn yet, a measuring / guessing step, the same step with a new width), `orderSteps` (exactly one
offered order is valid; the test re-checks every choice with `validOrder`), `spotFake` (exactly one step uses a
ruler, a protractor or the eye; free choices are legal).
