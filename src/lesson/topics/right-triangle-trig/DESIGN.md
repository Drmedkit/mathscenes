# Right triangle trigonometry (Geometry, lesson 10)

Topic: `secondary-t6-23-right-triangle-trigonometry` (29 sub-goals). Requires `similarity` (AA, scale factors) and
`triangle-centers`; builds on the grade 8 `pythagorean-theorem` lesson (legs, hypotenuse, a² + b² = c²). Colour roles
as in the course: amber = the opposite leg / a given, teal = the adjacent leg, lavender = the hypotenuse / focus,
lime = what is earned (the answer), red = wrong.

**Concept.** Every right triangle with the same acute angle is similar (AA: the right angle and that angle), so each
side ratio is a property of the ANGLE, not of the triangle's size: sin = opposite/hypotenuse, cos =
adjacent/hypotenuse, tan = opposite/adjacent, the sides named from the angle you stand at (SOH-CAH-TOA only as a
memory aid). Bounds follow from the sides (sin, cos between 0 and 1; tan any positive number). The side opposite A is
adjacent to B, so sin A = cos(90° − A). Solving: choose the ratio that holds the known side and the unknown, solve
(x on top: multiply; x below: x = k ÷ ratio), inverse keys for angles, degree mode, full precision until one final
rounding, size checks. Exact values from the halved square (1 : 1 : √2) and the halved equilateral triangle
(1 : √3 : 2). Applications: ladders, kites, shadows, ADA ramps, elevation / depression (measured from the
horizontal, equal by alternate interior angles), regular polygons (A = ½aP, apothem from half the central angle).

**Models.**
- Reused read-only: geometry-foundations `geo.ts` + `GeoFig.ts` (exact figures with the layout check), `Card.ts`,
  `kit.ts` (`choiceItem`, `fitted`); similarity `sim.ts` (`figOf`).
- `trig.ts`: degree trig, `rnd` (rounds and REFUSES a value within 0.08 of a .x5 tie: the item retries), exact
  radicals k√2 / k√3, triples, `rtFig` (a right triangle from its legs, turned / reflected, sides labelled by
  a / b / c, marked acute angles), `standFig` (a triangle standing on level ground: ladder, kite, shadow, building),
  `depressionFig` (the horizontal drawn at the top), `polyFig` (a regular n-gon with apothem and radius).
- `common.ts`: misconception ids, `choice` (a wrong choice whose VALUE equals the answer is dropped, so sin A / cos B
  and opposite / adjacent swaps at 45° never appear as wrong), `numR` (rounded answers, precision always stated),
  `numX`, `fracR` (any equal fraction is right).
- famA (stage 1), famB (stage 2), famC (stage 3). Exact figures: labelled lengths and angles are drawn at their
  value (one unit per figure); the test checks it.

## The five parts
1. **The question**: a kite on 100 ft of string at 40°. How high? 44 ft (40/90 of the string: the height in step
   with the angle) / cannot be known (`ratio-depends-on-size`) / about 64 ft (right) + how sure.
2. **Worked example** (board on the right): name the sides from 40° (hypotenuse = string, opposite = height,
   adjacent = ground) -> a 30 ft string at 40° rises 19.28 ft (19.28/30 ≈ 0.643); the small triangle dilates from the
   hand onto the kite's (AA), the ratio stays: sin 40° -> sin 40° = h/100 -> h = 100 sin 40° ≈ 64.3 ft. Why may we
   use the small triangle's ratio? (similar by AA / bigger triangle bigger ratio / any two right triangles).
3. **Your turn**: a ladder at 75°, foot 4 ft out. Which ratio (cos 75° = 4/L; sin by position, tan brings in a
   second unknown) -> L ≈ 15.5 ft (1.0 = multiplied, 4.3 = radian mode) -> the 4-to-1 rule: 16 ft ladder 4 ft out,
   x = cos⁻¹(0.25) ≈ 76° (14 = the angle at the top, 0.25 = the ratio as an angle).
4. **Prove it**: sin A = cos B in right triangle ABC: always / only some angles, then a because-chain (angle sum,
   sides named from the angle, the same leg over the same hypotenuse) while the arcs, the leg a and the hypotenuse
   light up and the board fills; decoys "equal at every angle" (`cofunction-misuse`) and "the bottom side is
   adjacent" (`opposite-adjacent-by-position`). Then "which equals sin 40°?" (cos 50°), callback to part 1.
5. **Practice**: all 29 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 65 families
| sub-goal | families |
|---|---|
| label-sides | nameSide (rotated / reflected, unlabelled and labelled), swapAngle (same side from the other angle), compositeSide (rectangle + diagonal) |
| ratio-invariance | scaleRatio (two similar triangles at one scale, k non-integer too), invClaim (size claim, examples-as-proof, symbolic ko/kh), sameAngle |
| sine-ratio | writeSin (fraction, either acute angle), sinVar (letters for sides) |
| cosine-ratio | writeCos, cosDec (decimal sides, terminating cosine) |
| tangent-ratio | writeTan (incl. 45-45-90, tan = 1), sohMix (which of the six ratios has this value) |
| ratio-bounds | possible (reported values), whichPossible |
| ratio-covariation | compareRatio (two triangles, same hypotenuse / same adjacent leg), doubleClaim (not proportional) |
| cofunction | cofMissing, cofMatch, cofTri |
| degree-mode | modeRead (DEG / RAD / GRAD display), modeCheck (benchmark) |
| evaluate-trig | evalTrig (4 places, whole and decimal degrees), estimateTrig |
| carry-precision | carry (stored value between two ladders), roundCompare |
| choose-ratio | chooseEq (all pairings, both directions), chooseFn (incl. two sides -> which inverse) |
| side-unknown-numerator | sideNum (figure), sideNumEq (equation) |
| side-unknown-denominator | sideDen, sideDenEq |
| inverse-meaning | invTable (table, no calculator), invMeaning (meaning; which input has no acute angle) |
| inverse-calc | invCalc (figure, nearest tenth of a degree), invEq |
| solve-complete-triangle | solveAll (pair: the other angle and a side), solvePlan (angle-only data, which tool) |
| special-right-derive | specialDerive (halved square / equilateral, figures), specialFwd (from a leg, incl. k√3 given) |
| special-right-reverse | specialRev (hypotenuse or long leg given, rationalized), specialRevNum (tile, truss) |
| exact-trig-values | exactVal, exactSolve (x = k sin 60° = (k/2)√3) |
| pythagorean-triples | tripleSpot (consecutive and additive non-examples), tripleMissing, methodPick |
| regular-polygon-area | polyArea (3, 4, 6 exact-able; 5, 8, 10 by tan), apothem, polyDerive |
| audit-angle-choice | auditAngle (complement used, or the work is right) |
| audit-setup-reasonableness | auditSetup (which size check exposes it), auditFix |
| diagnose-mode-error | modeDiag (negative sine, a 0.6° ramp, plausible positive output), modeFix |
| context-model | ladder, kite, shadowTrig, adaRamp (1 : 12) |
| report-precision | precision, precisionCritique (nearest foot and degree vs nearest tenth of each) |
| elevation-depression | elevation (eye height stated), depression, depWhere (where the angle is; elevation = depression) |
| regular-polygon-context | polyContext (stop sign across flats, gazebo, tiles, patios, ft² and in²), polyUnits |

Rules the generators keep: every rounded answer states its places and is never within 0.08 of a tie (full precision
computed); degrees always stated; choices are deduplicated by value; no 45° where opposite / adjacent swaps would
coincide; realistic stories (ladders 65°-80°, rafters 20°-45°, sun 25°-70°, ADA ramps at most 1 : 12, US stop signs
30 / 36 / 48 in); radian outputs shown only where the mode is the point.

No runtime or kit change. Could move to the kit: `trig.ts` `rtFig` / `standFig` / `depressionFig` / `polyFig`
(right-triangle and regular-polygon figures on the course's GeoFig) next to geometry-foundations' figure block.
