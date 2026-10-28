# Midsegments and points of concurrency (Geometry, lesson 7)

Topic: `secondary-t6-20-properties-of-triangles` (35 sub-goals). Requires `constructions` (compass and straightedge,
perpendicular and angle bisectors), `geometry-foundations` (definitions, marks, the two-column proof) and
`triangle-congruence` (SAS, SSS, AAS, HL, CPCTC). Colour roles as in the course: amber = the defining lines / givens,
teal = the second given / equal distances, lime = what is earned (the center, the answer), lavender = focus / a
spoke that is measured, red = wrong.

**Concept.** A special segment is read from its MARKS: median (ticks: the midpoint of the opposite side), altitude
(a box on the LINE of the opposite side, outside for an obtuse triangle), angle bisector (equal arcs at the vertex;
it does not halve the opposite side), perpendicular bisector (ticks AND a box; it need not pass through a vertex),
midsegment (two marked midpoints). Each kind of line meets in one point: centroid (medians; inside; 2 : 1 from the
vertex; the balance point), circumcenter (perpendicular bisectors; equidistant from the VERTICES; inside / the
hypotenuse midpoint / outside for acute / right / obtuse), incenter (angle bisectors; equidistant from the SIDES along
perpendiculars; inside), orthocenter (altitude lines; inside / the right-angle vertex / outside; no equal distances).
The equidistances are theorems (SAS for the perpendicular bisector, AAS for the angle bisector), their converses are
separate claims (SSS + linear pair; HL, only for points inside the angle), and concurrency is "on two lines, so equal
distances, so on the third by the converse", never "two lines meet, so three do".

**Models.**
- Reused read-only: `geometry-foundations` geo.ts + GeoFig.ts (exact figures), ProofFrame.ts + proofPanel.ts, Card.ts,
  kit.ts (`choiceItem` drops a wrong choice equal to the answer, `numItem`); `triangle-congruence` tri.ts (`buildFig`
  throws when a tick group is unequal, an arc group unequal or a box not 90°); `constructions` cons.ts + Construct.ts
  (the step player).
- `centers.ts`: random scalene triangles by kind (whole-degree angles, angles ≥ 8° apart, sides ≥ 10 % apart, so no
  center or special segment coincides with another by accident), the four centers, feet, where a point lies.
- `tfigs.ts`: one special segment from its marks (`special`, rejects a drawing where it also LOOKS like another kind:
  a median within 12° of perpendicular, a bisector foot near the midpoint, a perpendicular bisector near the vertex),
  the three lines of a center with their marks (`linesFig`).
- `consTC.ts`: the circumscribed circle (two perpendicular bisectors, the center, needle on the center, pencil on a
  vertex) and the inscribed circle (two angle bisectors, the center, the perpendicular to a side and its foot, needle
  on the center, pencil on the foot) as Cons for the constructions player.
- `tcProofs.ts`: ten proofs (perpendicular-bisector theorem and converse, circumcenter concurrency, angle-bisector
  theorem and converse, incenter concurrency, midsegment theorem in two halves, the two-thirds point, the medians'
  concurrence) with decoy lines and per-row wrong reasons (an AAS row never offers ASA, an HL row never SSS).
- `tkit.ts`: misconception ids, the picture type (GFPicture + `cons`), relabelled letters (role letters A, B, C ... ->
  random, never I, L, O), and `fitted`: a maker is retried until its figure, construction and proof frame lay out in
  the frame the page uses; point letters that touch a line are moved to a free direction first (`repairLetters`).

## The five parts
1. **The question**: three towns want a water tower exactly the same distance from all three town halls (an obtuse
   triangle). The middle (medians; `visually-central-point-equidistant`) / where the angle bisectors meet
   (`incenter-circumcenter-swap`) / where the perpendicular bisectors of the roads meet (right) + how sure.
2. **Worked example: four centers, one test**: medians -> G with its three distances (all different), angle bisectors
   -> I (equal perpendicular distances to the roads, not to the towns), the camera pulls back: perpendicular
   bisectors -> O outside the triangle, three equal distances, the circle through the towns; altitudes -> H, outside.
   Why is O equidistant? (on two perpendicular bisectors / in the middle / on the angle bisectors).
3. **Your turn** (faded): MN = AB/2 is worked; AG from AM = 12 (2 : 1; the halfway, reversed and 3 : 1 slips are
   classified), GN from BN = 15. The triangle is built from BC = 20, AC = √292, AB = 14, so AM = 12 and BN = 15 exactly.
4. **Prove it**: the Perpendicular Bisector Theorem on the course's proof frame (Parsons with two decoys: an angle pair
   used before it is established, a pair that only looks congruent; then reasons, with SSA, Vertical Angles and the
   theorem itself as wrong reasons). Back to the towns: why the third bisector passes through O (OA = OC + the converse;
   decoys: two lines meet so three do, it looks like it, the theorem used backwards). The third line draws on, the
   circle closes. Callback to part 1.
5. **Practice**: all 35 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 58 families
| sub-goal | families |
|---|---|
| s1-midsegment-identify | midsegId (both / one / no marked midpoints, a segment that only looks parallel), segKind |
| s1-median-identify | medianWhich (median vs midsegment vs altitude / a cevian to an unmarked point), segKind |
| s1-altitude-identify | altitudeCase (obtuse: outside on the extended side; right: the leg; box + ticks: both), segKind |
| s1-angle-bisector-identify | bisectorMid (scalene: halves the angle, not the side, not perpendicular), segKind |
| s1-perp-bisector-identify | perpBisCheck (both marks / only the box / only the ticks / through the vertex), segKind |
| s1-centroid-concurrence | thirdMedian (the third median always passes), centroidLines (which lines; always inside) |
| s1-perp-bisector-equidistance | pbEquiNum (PB from PA, AM a distractor), pbEquiWhich (on the line, the midpoint itself) |
| s1-circumcenter | circumWhere (acute / right / obtuse), circumWhich (equidistant from the vertices) |
| s1-angle-bisector-equidistance | abEquiNum (perpendicular distance; AP to the vertex a distractor), abEquiWhich |
| s1-incenter | inWhich (equidistant from the sides), inRadius (the perpendicular, not the vertex distance) |
| s1-orthocenter | orthoWhere, centerFig |
| s1-centers-discriminate | centerMatch (16 descriptions: lines, property, location), centerFig (marked lines) |
| s2-midsegment-parallel-angles | midsegAngle (corresponding, consecutive, alternate interior), midsegParallel |
| s2-midsegment-length | midsegLen (either direction, decimals, a touched side given), medialPerim |
| s2-midsegment-algebra | midsegAlg (2·DE = BC with x on both sides; reports x, sets equal) |
| s2-median-equal-parts | medianParts (whole, part, one unknown), medianLength (the median's length is not determined) |
| s2-angle-bisector-equal-parts | bisectAngle (whole to half, half to whole), bisectAlg |
| s2-centroid-ratio | centroidPart (any part from any part), centroidAlg (BG = 2·GN) |
| s2-angle-chains | chainAlt, chainBisAlt (the angle between altitude and bisector), chainExt (exterior angle) |
| s2-equidistance-distances | equiAlg (PA = PB, PE = PF as expressions), centerDist (circumcenter, right triangle, incenter) |
| s2-center-distance-pythagorean | pythIn (tangent segment), pythCirc (half chord); triples, then nearest tenth |
| s2-construct-circumcircle | circNext (the next step; bisectors / medians / a side midpoint as the radius), circRadius |
| s2-construct-incircle | inNext, inRadiusCons (the perpendicular, not a vertex, not the midpoint) |
| s2-mixed-selection | mixedNum (a random stage 2 family in a new orientation), enoughInfo (marks missing -> not enough) |
| s3-perp-bisector-theorem-proof | pbProofReason (incl. the case P = M), pbProofOrder |
| s3-perp-bisector-converse-proof | pbConvReason (incl. P on AB), converseState |
| s3-circumcenter-concurrency-proof | concurChain |
| s3-angle-bisector-theorem-proof | abProofReason |
| s3-angle-bisector-converse-proof | abConvReason (incl. the external-bisector counterexample), converseState |
| s3-incenter-concurrency-proof | inConcur |
| s3-midsegment-proof | midProofStep (both halves of the extension proof), midProofWhy (examples, half a proof, two methods) |
| s3-median-two-thirds-proof | twoThirdsStep |
| s3-median-concurrence-proof | medConcur |
| s3-critique-proof | critique (measured examples, an unmarked midpoint, SSA, circular, two-meet, slanted distance) |
| s3-apply-context | contextBrace (measured midpoints vs "roughly halfway"), contextTowns (which point, outside, right triangle) |

Rules the generators keep: every labelled angle is drawn at its measure and every labelled length at its size (one
scale per figure); a choice that names a special segment or center is only offered as wrong where the drawing cannot
also be it (scalene triangles, feet away from midpoints, lines away from vertices); right triangles never offer half
the hypotenuse or the hypotenuse midpoint as a wrong radius; an asked proof cell is blank in the picture data.

Notes: no runtime or kit change. Could move to the kit: `centers.ts` + `tfigs.ts` (triangle centers and their lines)
next to the course's GeoFig, and `repairLetters` (GeoFig letters moved off lines) could live in geo.ts.
