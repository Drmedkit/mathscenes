# Similar triangles (Geometry, lesson 9)

Topic: `secondary-t6-22-similarity-criteria-and-applications` (25 sub-goals). Requires `triangle-congruence`; builds on
the grade 8 lesson `dilations-and-similarity` (similar = a dilation, then rigid motions). Colour roles as in the
course: amber = given parts / the small triangle's sides, teal = the second thing (cut parts, the other angle pair),
lime = what is earned (the answer, the image landing), lavender = focus / the moving copy, red = wrong.

**Concept.** Similar = a dilation followed by a rigid motion; congruence is the k = 1 case. For triangles three short
lists are enough: AA (two angle pairs fix the third), SAS~ (two sides in one ratio with the angle between them), SSS~
(one ratio for all three sorted side pairs). Each is justified by dilating by the common ratio and then using ASA /
SAS / SSS. Evidence has three statuses: established, not enough information (no criterion fits), disproved (no
correspondence can work: angle sets or sorted ratios differ). The ordered statement △ABC ~ △DEF is a correspondence;
the scale factor has a direction (new over old). The applications: nested triangles (whole side with whole side),
hourglass (A ↔ C through alternate interior angles: a half-turn about E, then a dilation), the altitude to the
hypotenuse (three similar right triangles, h² = pq, leg² = adjacent segment × c), the side-splitter theorem and its
converse, the Pythagorean theorem by similarity, circular arguments, indirect measurement.

**Models.**
- Reused read-only: geometry-foundations `geo.ts` + `GeoFig.ts` (exact figures and the layout check), `ProofFrame.ts`,
  `Card.ts`, `kit.ts` (`choiceItem`, `numItem`, `fitted`); triangle-congruence `tri.ts` (`buildFig` with checked mark
  groups, `pairFig`, `triSSS`, `triASA`, `beside`, `moveT`, letters).
- `sim.ts`: exact fractions, integer side sets with readable angles, `simPair` / `simFig` (two similar triangles, the
  second turned / flipped; labelled lengths drawn at their length), `simValid` / `validOrders` (a statement holds when
  the angles match vertex by vertex on the drawn points), `propHolds` on generic configurations (a proportion offered
  as wrong is false for the figure; a second true form is never offered as wrong), `nested`, `hourglass`, `altitude`.
- `figs.ts`: nested, hourglass and altitude figures with random letters (chevrons only when the parallel is given).
- `proofs.ts`: the lesson's reasons and a bank of six similarity proofs (nested AA, hourglass AA, altitude AA,
  nested SAS~ from lengths, separate AA with the hidden third angle, separate SSS~), each with decoys.

## The five parts
1. **The question**: a roof frame, brace DE ∥ beam BC, AD = 4 ft, DB = 6 ft, DE = 5 ft. BC? 7.5 (AD/DB = DE/BC,
   `part-segment-for-whole-side`) / 11 (adds the 6, `additive-keep-difference`) / 12.5 (right) + how sure.
2. **Worked example** (proof frame beside the figure): two angle pairs (shared ∠A, corresponding angles, arcs appear)
   -> △ADE ~ △ABC by AA, in order -> the small triangle dilates from A by k = 10/4 and lands on △ABC (why AA works) ->
   AD/AB = DE/BC, BC = 12.5. Why AB and not DB? (right / either works / DB is next to the beam).
3. **Your turn**: the hourglass AB ∥ CD, AE = 6, EC = 9, AB = 8. The statement (△ABE ~ △CDE right, △ABE ~ △DCE by
   position, "only vertical angles"); the copy of △ABE makes a half-turn about E and dilates by 3/2 onto △CDE; then
   the scale factor (typed fraction: 2/3 reversed, 3 a difference) and CD = 12 (16/3 reversed, 11 additive).
4. **Prove it**: the side-splitter theorem on the roof frame by the common-scale-factor route. Always / only for these
   numbers, then a because-chain from chips (AA; one k for all sides; whole minus part) while the proof frame fills,
   the small triangle grows onto the big one and the cut parts DB, EC turn teal; decoys "DB and EC are corresponding
   sides" (`part-segment-for-whole-side`) and "they look cut at the same place" (`diagram-appearance-as-given`). Then
   "does AD/DB = DE/BC too?" (no: DE and BC pair with whole sides). Callback to the part-1 card.
5. **Practice**: all 25 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 54 families
| sub-goal | families |
|---|---|
| congruence-as-scale-factor-1 | k1Classify (k = 1, 2, 1/2 with all sides), k1Claim (always / sometimes / never) |
| aa-criterion | aaThird (labelled angles, the hidden third angle, non-similar sets, acute / right / obtuse), aaMissing |
| sss-similarity | sssCheck (similar / two ratios match / additive copy), sssRatio (sides listed out of order) |
| sas-similarity | sasCheck (included / ambiguous SSA / included in one only), sasLen (shared angle, parts or whole) |
| aa-from-similarity-transformations | dilateWhy (gallery: ABC, its image, DEF; ASA / SAS / SSS, what finishes), dilateK |
| insufficient-vs-not-similar | evidence (fact lists, three statuses), evidenceJudge (a disproof with one correspondence) |
| classify-congruent-similar-neither | classify5 (AAA, ASA, AAS, SSS k = 1, SSS k ≠ 1, SSA, HL, obtuse SSA, dilate-then-HL, angle sets), critName |
| triangle-criteria-scope | polyScope (rectangles, rhombi, the triangle contrast), polyWhy |
| correspondence-from-statement | corrSide, corrRatio |
| correspondence-from-angle-marks | stmtMarks (isosceles: one of two valid orders offered), altStmt |
| directed-scale-factor | kDirected (both directions, k = 1), kFromStmt |
| missing-length-separated | missSep (unknown in either triangle), missStory (sails, models, garden beds) |
| nested-triangles-whole-vs-part | nestPart, nestWhole (EC = AC − AE) |
| altitude-similar-triangles | altStmt, altWhich (a non-right triangle with an altitude) |
| geometric-mean-relations | gmAlt (perfect squares typed; radicals as choices), gmLeg (c = p + q first), gmDerive |
| hourglass-figures | hourStmt (with a non-parallel look-alike), hourLen |
| algebraic-side-lengths | algNest (x/(x + d) = e/(e + f)), algSep ((ax + b)/P = x/Q) |
| justify-criterion-conditions | reasonPick, lookAlike (not marked parallel), proofReasonS |
| write-similarity-proof | proofOrder (Parsons with a decoy), proofReasonS, proofEnd |
| deduce-proportion-from-similarity | deduceProp, deduceCross, angleK |
| pythagorean-proof-by-similarity | pythGap, pythReason |
| side-splitter-theorem | ssAlgebra (faded algebra), ssNum, ssForm |
| side-splitter-converse | convWhich (theorem vs converse warm-up), convCheck (equal ratios or not) |
| repair-circular-argument | circFind, circRepair |
| indirect-measurement | shadow (feet; one variant in inches), mirror, river (nested) |

Rules the generators keep: labelled lengths are drawn at their length (one unit per figure; the test checks it),
labelled angles at their measure; a statement choice is valid exactly when the drawn angles match; a proportion
choice offered as wrong is false on a generic figure; SSA "not enough" cases are genuinely ambiguous (acute angle
opposite the shorter side, two triangles exist); shadows: a 5-6.5 ft person, objects 2.5-5 times taller.

No runtime or kit change. Could move to the kit: `sim.ts` (similar pairs, `simValid`, `propHolds`) next to tri.ts.
