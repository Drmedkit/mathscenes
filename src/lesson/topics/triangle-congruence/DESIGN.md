# Triangle congruence (Geometry, lesson 4)

Topic: `secondary-t6-19-triangle-congruence-sss-sas-asa-aas-hl` (31 sub-goals). Requires `geometry-foundations`
(the two-column proof, reasons, marks); builds on the grade 8 lesson `congruence` (congruent = a rigid motion carries
one figure onto the other). Colour roles as in the course: amber = given parts, teal = the other given / the swing,
lime = what is earned (the congruence, CPCTC), lavender = focus / the moving copy, red = wrong / off the ray.

**Concept.** Congruence means a rigid motion carries one triangle onto the other. A criterion is a short list of
three corresponding pairs that is *sufficient*: every triangle with those parts is the same triangle up to rigid
motion. SSS, SAS, ASA, AAS (ASA in disguise: the third angles match) and HL (right triangles) are criteria; AAA (fixes
the shape, not the size) and SSA with an acute angle (the opposite side can swing to two places) are not. Only marks
and givens count; a shared side or angle, vertical angles, parallel-line angles and definitions (midpoint, bisector,
perpendicular) supply hidden pairs. The statement △ABC ≅ △DEF is a correspondence (A↔D, B↔E, C↔F); CPCTC reads
further pairs from it.

**Models.**
- Reused read-only from `geometry-foundations`: `geo.ts` + `GeoFig.ts` (exact figures: ticks, arcs, boxes, labels,
  `figProblems`), `ProofFrame.ts` + `proofPanel.ts` (the proof frame), `Card.ts`, `kit.ts` (`choiceItem`, `numItem`,
  `fitted`).
- `tri.ts`: triangles by index (vertex i, angle i, side i opposite), SSS / SAS / ASA builders, rigid motions,
  `critOf` (the pattern of three pairs) and `critsOf` (every criterion the pairs reach once the third angle and a right
  triangle's third side are derived: a choice list never offers a second working criterion as wrong), `buildFig`
  (named points; **throws when a tick group is unequal, an arc group unequal or a box not 90°**), `pairFig`,
  random letters (`names2`, `relabeler`, `tw` for prose, `mapFig`).
- `configs.ts`: the textbook configurations (bowtie, kite, perpendicular bisector, parallel Z, overlapping triangles
  with a shared angle, overlapping triangles on a shared base), exact.
- `pairs.ts`: a marked pair per pattern (a congruent copy, turned or flipped; AAA a scaled copy; SSA the *other*
  triangle the same data allow, `ssaAlt`), the criterion choice list `critOpts`.
- `triProofs.ts`: the lesson's reasons (Reflexive Property of Congruence, Vertical Angles, Alternate Interior Angles,
  definitions, SSS ... HL, CPCTC), a bank of 9 proofs with hidden pairs, decoys and a CPCTC follow-up.

## The five parts
1. **The question**: Nia copies AB = 7 in, BC = 5 in, m∠A = 40° (the angle is not between the sides). Must her
   triangle be congruent? Yes, always (`ssa-accepted-as-criterion`) / yes unless she flips it
   (`turned-or-flipped-copy-not-congruent`) / not necessarily (right) + how sure.
2. **Worked example (SAS)**: read the marks (three Given rows, each pair glows) -> where is the angle (AB, BC amber,
   ∠B lime: included) -> carry one onto the other (a copy folds over, slides B onto E, turns: A lands on D, C on F) ->
   △ABC ≅ △DEF by SAS. Why must the angle be between? (right / order is a mnemonic / any angle works).
3. **Your turn**: the bowtie, E the midpoint of AC and BD. The proof frame: Parsons with two decoys (△AEB ≅ △DEC =
   vertex order; ∠A ≅ ∠C = before established), then the reason menu (Alternate Interior = wrong pair, SSA, ASA,
   Reflexive as distractors); the vertical angle arcs appear when that line is placed. Then CPCTC: AB ≅ CD (right) /
   AB ≅ DE (correspondence ignored) / nothing more (only marked parts count).
4. **Prove it**: SSA always? A because-chain while the construction moves: the ray and the 5-in radius, the swing
   (the circle crosses the ray at C₁ and C₂), the two triangles with AC₁ ≈ 3.2 in and AC₂ ≈ 7.5 in. Decoy chips:
   facing (`turned-or-flipped`), one drawing (`examples-as-proof`). Then the right-angle case (3-4-5): the circle meets
   the line at C and its mirror image C′, only C is on the ray: HL. Callback to part 1.
5. **Practice**: all 31 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 57 families
| sub-goal | families |
|---|---|
| read-markings | listPairs (marks + a given in words; an unmarked look-alike, a mark on the wrong part), countPairs, whyNotList |
| read-correspondence | corrPart (scrambled statements, turned / flipped copies), corrPick |
| sufficiency-meaning | fixOne (cards), mirrorCopy (a mirror image across a shared side) |
| included-parts | includedPart, patternName (SAS / SSA / ASA / AAS from a scrambled list) |
| hypotenuse-legs | findHyp (any orientation, hypotenuse horizontal), isRight (a look-right triangle without a box) |
| sss, sas, asa, aas, hl | classify (marks; SSA, AAA and two-leg SAS cases mixed in), sssNum, missingPair, aasThird, aasSide, hlCheck (one triangle right, hypotenuse paired with a leg) |
| classify-mixed | classify (all 7 patterns), classifyList |
| sas-, asa-, sss-rigid-motion | motionWhy (the reason for one step), motionNext |
| circle-intersection | circlesMeet (0 / 1 / 2 points, tangent cases), mirrorPoint |
| write-correspondence | writeStmt (separate, turned, flipped, shared vertex), stmtAndCrit, stmtFromList |
| shared-side | sharedPart (kite, shared angle), reflexReason |
| angle-pair-hidden | hiddenAngle (bowtie, parallel Z), hiddenCrit |
| bisect-meaning | bisectDef (a point that only looks halfway, a ray with 32° and 38°), bisectNum |
| definitions-to-parts | defToPair (midpoint, CD bisects AB, angle bisector, perpendicular), defReason |
| overlapping-triangles | overlapShare, overlapCrit |
| short-proof | proofParsons, proofReason, proofGap |
| cpctc | cpctcNext, cpctcNum, cpctcEarly |
| conditional-claim | critIfThen, claimAbout |
| counterexample-check | cxCheck (meets every condition / breaks one / congruent turned copy), cxWhich |
| aaa-counterexample | aaaBuild, aaaSize |
| ssa-verify | ssaVerify (whole-number data: AB, BC, 60°, two values of AC), ssaWhich |
| ssa-construct | ssaSwing (circle about B and the 30° ray, the distance d = AB/2), ssaArc |
| ssa-scope-hl | scopeJudge, hlSwing |
| critique-repair | critique (SSA, AAA, a valid AAS called invalid, a counterexample called an exception), repairPick |
| cpctc-solve | solveX, solvePart (sides or angles; one- and two-step) |

Rules the generators keep: exactly three pairs are marked in a classification item; a criterion that also works
(ASA with AAS, HL with SSS / SAS through the right triangle's third side) is never offered as wrong; labelled measures
are drawn at their measure; SSA items use acute angles only; no unmarked part is ever drawn with a mark (labelled
angles without a congruence meaning are drawn as a wedge without an arc).

Proof rule (whole lesson): a given is cited straight from the Given header. Givens that are congruent pairs are rows
with the reason Given; a midpoint, bisector, parallel or perpendicular given is not restated, its definition / theorem
row uses nothing (`triProofs.ts` givensFromHeader). Parsons accepts every order valid under that rule.

Notes: no runtime or kit change. Could move to the kit later: `tri.ts` (criteria + exact two-triangle figures) next
to the course's GeoFig and proof frame.
