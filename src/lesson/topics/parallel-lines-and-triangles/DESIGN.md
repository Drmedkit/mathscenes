# Angle relationships with parallel lines and triangles (grade 8, 8.G.A.5)

Topic JSON: `secondary-t5-37-angle-relationships-in-parallel-lines-and-triangles` (25 sub-goals).

## Concept
Parallel lines let you MOVE an angle: a slide along the transversal (corresponding angles) or a half turn about the
middle of the crossing segment (alternate angles) carries one crossing exactly onto the other, because only one line
through a point is parallel to a given line. A straight line then turns "equal" into "adds to 180°" (same-side
interior). The same two moves prove the triangle angle sum (a line through a vertex drawn parallel to the opposite
side), and the triangle sum plus a linear pair gives the exterior-angle fact. Polygons split into n − 2 triangles.

## Model
`figMaths.ts` (pure): a figure is lines/segments (arrowheads, parallel chevrons, names), angle marks (arc or box,
matching arcs, a short label, `alt` = the value shown in the solution), point letters, washes, words.
`fitFig` places it in the 940 px frame, `layoutFig` puts every label on its angle's bisector far enough out to clear
both sides and the arc, a straight "whole" outside its parts' labels; `figProblems` refuses labels outside the frame,
on a line, on an arc or on another label, in two states (as first seen, and the worked solution with helper lines).
Builders: `trans()` (two lines + transversal, textbook slots 1-8, drawn true to the measures, rotation/mirror),
`tri()` (true to its angles; extension -> exterior angle; line through A parallel to BC; between two parallels),
`poly()` (regular or irregular convex, diagonals from one vertex, a point inside). `GeoFig.ts` paints it (dusk sheet,
crisp lines, washes for wedges and the band between parallel lines). Colour roles: second = given, link = unknown /
answer, pick = focus / the angle that moves, first = the whole (180°).

## The five parts
1. **The question**: Elm St ∥ Oak St, a rail line crosses both; 65° at Oak St, x at Elm St (same-side interior).
   Cards 115° / 65° (sets a supplementary pair equal) / can't tell (refuses the parallel facts) + how sure.
2. **Worked example** (sub-goals 1, 3, 7, 23): read the figure (two crossings, the interior band) -> slide Oak St's
   crossing up the rail line (a ghost translates and lands on y: y = 65°) -> the straight line at P (x = 180° − 65°)
   -> check (115° + 65° = 180°: same-side interior adds to 180°, not equal). Why? 3 reasons (right / looks / equal).
3. **Your turn** (faded from the end): ℓ ∥ m standing up, 108° given; read is given; the kid picks the alternate
   interior partner (a / b same-side / c corresponding), a half turn about M carries 108° onto a; a = ? (72 =
   congruent-pair-treated-as-supplementary); b = ? (108 = supplementary-pair-set-equal); callback to the card.
4. **Prove it**: Riley measured five triangles: a proof? (yes = examples-as-proof). Then a because-chain for the
   triangle sum: ∠1 = ∠B, ∠3 = ∠C (alternate interior, ℓ drawn ∥ BC: a half turn shows each), ∠1 + ∠A + ∠3 = 180°
   (straight angle), so ∠A + ∠B + ∠C = 180° (A slides along ℓ: no size used). Distractor chips = examples-as-proof,
   diagram-appearance-as-given, circular-reasoning.
5. **Practice**: all 25 sub-goals in order, then mixed.

## Sub-goal -> families (39 families)
| sub-goal | families |
|---|---|
| transversal-configuration | tcWhere, tcWhichTrans |
| corresponding-position | findPartner, pairName |
| corresponding-congruent-if-parallel | pairValue, classify |
| alternate-position | findPartner, pairName |
| alternate-congruent-if-parallel | pairValue, classify |
| same-side-interior-position | findPartner, pairName |
| same-side-supplementary | pairValue, ssRight |
| classify-pair-relation | classify, needsParallel |
| triangle-angle-sum | triSum, third |
| exterior-angle-identify | extFind, extName |
| exterior-angle-remote-sum | extRemote, extWrite |
| missing-angle-parallel-one-step | pairValue, allEight |
| triangle-third-angle | third, thirdRight |
| isosceles-marked-angles | isoBase, isoApex |
| exterior-angle-missing | extValue, extRemoteMissing |
| polygon-angle-sum | polyTriangles, polySum, polySides |
| regular-polygon-interior-angle | regAngle, regSides, regNot |
| multi-step-chain | chainTri, chainExt, zigzag |
| angle-expressions-equation | exprPair, exprTri |
| polygon-angle-equations | polyExpr, polySides |
| justify-step-with-condition | reasonPick, findBadStep |
| justify-angle-sum-equation | sumCheck, findBadStep |
| rigid-motion-argument | motionPick, critique |
| triangle-sum-argument | triArgReason, critique |
| exterior-angle-argument | extArgGeneral, critique |

Shared families read the sub-goal (findPartner / pairName: which pair; pairValue: which relations and the street
context; classify: which pairs; findBadStep: transversal steps or angle-sum steps; critique: which argument).
Only `polySides` and `triSum`'s "possible?" variant have no figure (the shape would give the answer away); they use
the wide slate. Note: the topic JSON has no angle-angle similarity sub-goal; practice follows the JSON.
