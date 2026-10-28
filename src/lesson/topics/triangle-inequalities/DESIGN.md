# Isosceles triangles and side-angle order (Geometry, lesson 5)

Topic: `secondary.triangle-side-angle-relationships-isosceles-theorems-side-an` (12 sub-goals). Requires
`geometry-foundations` (marks, the two-column proof, reasons) and `triangle-congruence` (SAS / ASA, CPCTC, the
mirror correspondence). Colour roles as in the course: amber = given / the whole, teal = the parts / the other
given, lime = what is earned, lavender = focus / the moving copy, red = wrong.

**Concept.** Inside one triangle, sides and the angles that face them go together. Equal sides face equal angles
(the isosceles theorem, proved by matching △ABC with its own mirror image △ACB by SAS) and, as a separate statement
with its own proof (ASA), equal angles face equal sides. More generally the longer side faces the larger angle, in
both directions; the order says nothing about ratios. From that order follows the triangle inequality: the two
shorter sides together beat the longest, strictly; equality means the three points are collinear (no triangle).
The compass check shows the same thing: the arcs cross above the base, meet only on it, or miss.

**Models.**
- Reused read-only: `geometry-foundations/geo.ts` + `GeoFig.ts` (exact figures), `ProofFrame.ts`, `Card.ts`,
  `kit.ts` (`choiceItem`, `numItem`); `triangle-congruence/tri.ts` (`buildFig` with exact mark groups, letters).
- `ineq.ts`: triKind (yes / flat / no, exact for decimals), the third-side range, side-angle order by index, and
  the figure builders: isosceles triangles by apex angle or by legs and base, SSS / ASA triangles, sticks at scale,
  the compass check (`arcsFig`: base + arcs at their true radii, the crossing drawn in the solve), exterior angles
  one per vertex (`extFig`), the angle-sum figure (a parallel through the apex, angles 1, 2, 3), and the
  triangle-inequality proof figure (BA extended to D with AD = AC).
- `RangeStrip.ts` (new block): a number line for the third side (or for x); the open interval and the whole
  lengths inside appear in the solve. Could move to the kit.
- `tkit.ts`: misconception ids, the picture type (+ strip), frames (`FR_TOP` above the strip, `FR_PLEFT` beside the
  wider proof frame `FR_PROOF`), `fitted` (retries until every label reads), `pairItem` ("□ < x < □").

## The five parts
1. **The question**: sticks 9 in, 4 in, 5 in. A triangle? Yes, a very flat one (`accepts-degenerate-triangle`) /
   yes, 9 + 4 > 5 and 9 + 5 > 4 (`checks-wrong-pair-in-triangle-inequality`) / no (right) + how sure.
2. **Worked example (the isosceles theorem, then the order)**: read the marks (AB ≅ AC, Given; which angle faces
   which side) -> a lavender copy flips over the axis: △ABC ≅ △ACB by SAS (Symmetric, Reflexive rows) -> ∠B ≅ ∠C
   by CPCTC, the arcs appear; the converse is named as a separate theorem (ASA) -> the proof gives way to a card and
   AC stretches: the angle facing it grows (live measures). Why? (the mirror match is SAS / it looks symmetric
   (`diagram-appearance-as-given`) / a mirror image is not congruent (`turned-or-flipped-copy-not-congruent`)).
3. **Your turn**: PQ ≅ PR, m∠P = 40°: m∠Q (num; 40 = `misplaces-isosceles-base-angles`, 140 = both together) ->
   ∠X ≅ ∠Y, XZ = 11 cm: which side is 11 cm (XY = `pairs-side-with-adjacent-angle`) -> m∠J = 48°, m∠K = 75°: order
   the sides (find ∠M first). Board lines after each.
4. **Prove it**: is the longest side always shorter than the other two? A because-chain while BA extends to D
   (AD = AC): ∠ACD = ∠ADC (isosceles) -> ∠BCD > ∠BDC -> BD > BC, BD = BA + AC. Decoys: looks longer
   (`diagram-appearance-as-given`), held in every drawing (`examples-as-proof`). Then the boundary: C on AB
   (flat triangle = `accepts-degenerate-triangle`, never = `overlooks-boundary-case`), shown by the 4 / 5 / 9 arcs
   meeting on the base. Callback to part 1.
5. **Practice**: all 12 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 32 families
| sub-goal | families |
|---|---|
| s1-isosceles-base-angles | baseAnglePick (two / three ticks, or none on a look-alike), isoStatement (the if-then; equilateral -> 60°) |
| s1-isosceles-converse | converseSides (two / three arcs, two close labelled angles), converseClaim (needs its own proof; false converses) |
| s1-side-angle-order | orderAngles (from sides, ties, right / obtuse), orderSides (from two angles, third by the sum, ties), orderRatio |
| s1-triangle-construction-check | arcsCheck (cross / touch on the base / miss, "nearly meet"), arcsSetup (what an arc is, which construction) |
| s1-triangle-existence | existCheck (sticks, scrambled), whichSet (four sets), oneCheck (the one comparison that settles it) |
| s2-isosceles-unknowns | isoAngle (vertex <-> base, decimals), isoSides (converse; numbers and expressions), isoAlgebra (base angles as expressions) |
| s2-triangle-inequality-range | rangePair (□ < x < □, decimals), rangeCount (whole lengths), rangePick (a length / the interval) |
| s3-angle-sum-proof | sumReason (reason menu), sumAux (which line to draw; why ∠1 = ∠A), sumWhy (measuring is not proving) |
| s3-isosceles-proof | isoProofReason, isoProofCorr (△ACB), isoProofEarly (CPCTC too early / circular) |
| s3-isosceles-converse-proof | convProofReason (ASA, CPCTC), convProofWhy |
| s3-exterior-angle-sum-proof | extMissing (with a walk around a park), extAlgebra, extProof (540° - 180°; one per vertex) |
| s3-triangle-inequality-proof | ineqProofReason (7-row proof), ineqBoundary (roads: on the road / impossible / a triangle), ineqAlgebra (x + k, kx) |

Rules the generators keep: every tick and arc group is exactly equal (buildFig throws otherwise); labelled lengths are
drawn in proportion and labelled angles at their measure (tests check both), so no figure contradicts the
side-angle order; a + b = c is always "collinear, no triangle"; ranges are strict; a "looks isosceles" triangle is
drawn 6-7 % off and unmarked.

Notes: no runtime or kit change. Could move to the kit: `RangeStrip.ts`; `arcsFig` (compass check) next to the
course's GeoFig.
