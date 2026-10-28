# Arcs and angles in circles (Geometry, lesson 12): design

Topic `secondary-t6-26-circle-theorems`, 33 sub-goals. Requires geometry-foundations (proofs, reasons) and
triangle-centers (circles through points).

## Concept and model
An angle's measure is decided by where its vertex sits relative to the circle and which arcs it opens onto:
at the center = the arc; on the circle = half the arc; inside = half the sum; outside = half the difference.
The model is an exact circle figure (`cfig.ts` + `CircleFig.ts`, new block): points on the circle by angle, chords,
radii, tangent and secant lines, angle marks at their true measure, and ARCS drawn as thick strokes at their true
measure with labels outside the circle. The layout refuses a label that touches a line, the circle or another label.
Could move to the kit (chords-tangents, arcs-and-sectors, circle-equations).

## The five parts
1. **Question**: a round plaza, a gate AB (arc 70°), three friends P, Q, R on the far wall. Who sees the gate
   widest? nearest / straight across / all the same (right).
2. **Worked example**: arc AB = 100°: the central angle (100°); C on the circle, chords CA, CB, C slides and the live
   angle keeps reading 50°; C pushed across the chord: 130° (half of 260°). Why half? reasons: radii make an
   isosceles triangle and the central angle is its exterior angle (right) / distance (wrong) / looks (wrong).
3. **Your turn**: arc AB = 128°: m∠ACB = 64° worked; m∠ADB typed (same arc, 64°); m∠AEB typed (across, 116°).
4. **Prove it**: base case of the Inscribed Angle Theorem (x = m∠ACB; OA = OC; m∠OAC = x; m∠AOB = 2x; arc AB = 2x;
   x = ½ arc AB), Parsons with two decoys (circular, look), then reasons with a circular distractor. Back to the
   plaza: 35° for each friend. Callback to part 1.
5. **Practice**: 44 families over all 33 sub-goals.

## Sub-goal -> families
| sub-goal | families |
|---|---|
| circle-similarity | simScale, simProof |
| chord-vs-radius | segKind, chordCount |
| secant-vs-tangent | lineKind, tangentPoint |
| central-angle | angleKind, whichAngle |
| arc-measure | arcName, arcMeasure |
| inscribed-angle-classify | angleKind, whichAngle |
| intercepted-arc | interceptPick |
| circumscribed-angle-classify | angleKind, circumTangency, whichAngle |
| halve-odd-measures | halveArc |
| inscribed-angle-half-arc | inscribedArc, inscribedCentral |
| inscribed-major-arc | inscribedMajor |
| same-arc-congruent | sameArc, sameOrOpposite |
| semicircle-right-angle | semicircle, diameterGiven |
| cyclic-quadrilateral | cyclicQuad, cyclicApplies |
| tangent-radius-perpendicular | tangentRadius |
| circumscribed-angle-value | circumValue |
| tangent-chord-angle | tangentChord |
| interior-chord-angle | chordChord |
| exterior-angle-arcs | exteriorAngle |
| radius-isosceles | radiusIso |
| algebraic-circle-relations | algebra |
| multi-step-chase | chase2, chase3 |
| hypothesis-check | hypCheck, hypMatch |
| reject-missing-condition | rejectVerdict |
| converse-vs-theorem | converseClass |
| contrapositive | contraForm, contraUse |
| right-angle-diameter-converse | rightDiameter, findCenter |
| justified-solution-chain | chainReason |
| prove-inscribed-base | proofBase |
| prove-inscribed-sum | proofSum |
| prove-inscribed-difference | proofDiff |
| prove-cyclic-quadrilateral | proofCyclic |
| justify-chord-secant-angles | proofChord, realWorld |

## Oracle-proofing
- One choice helper (`ckit.choose`): a wrong option with the right one's text or value (`v`, e.g. the arc a name
  denotes) is dropped. Same-arc items never use 90° (congruent = supplementary); exterior items keep the near arc
  >= 20° (half-sum differs from half-difference); arcs are whole degrees, never 0° or 360°, always adding to 360°.
- "Not justified" items draw a figure in which the claim is TRUE (only the reason is missing), so "false" is never
  secretly right; the "unstated diameter" item draws a long chord that is not a diameter and offers no "it is 8x°"
  option.
- Relabelling (`ckit.twC`) changes only tokens made of role letters, masks the article "A"; a vitest probe checks
  every capital token against the figure's points.
