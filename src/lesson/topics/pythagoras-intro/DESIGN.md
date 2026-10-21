# Pythagorean theorem: introduction and use (grade 8, 8.G.B.6-7, 8.EE.A.2, 8.NS.A.2)

Topic `primary.geometry.pythagorean-theorem-introduction`, slug `pythagoras-intro`. The intro only: the converse,
distance on the plane and 3-D belong to the later topic `pythagorean-theorem`.

## Concept
In a right triangle the hypotenuse is the side across from the right angle (not "the slanted one", not "the one called
c"). A square built on a side has area side². For a right triangle the two leg squares together cover exactly the
square on the hypotenuse: a² + b² = c², an equation about AREAS. The hypotenuse is then a square root: whole when
a² + b² is a perfect square, else exact as √n and about a tenth-rounded decimal. It needs the right angle.

## Model
- `SideSquares.ts` (maths in `pythag.ts`): a triangle [R, A, B] (any pose, optional grid paper) with squares built
  outward on its sides. Sides by role: a = R–A amber (`first`), b = R–B teal (`second`), c = A–B lime (`link`).
  Steps `grid tri mark labels sqa sqb sqc outc areaa areab areac surround corners lift swap verts`: a square grows out
  of its side; the tilted c-square is measured by surround-and-subtract (dashed upright square, four lavender corner
  triangles, which lift away; one of them IS the triangle). Side labels sit next to their side, inside its square once
  it grows (then in dark ink); area labels in the middle. The layout fits everything into the frame and throws when a
  label would not fit its square (the page then drops squares, never squeezes).
- `ProofSquare.ts`: the rearrangement proof. A big square of side a + b with four copies of the triangle around a
  tilted middle square (four hypotenuse sides, 90° corners shown with the two sharp angles), then the triangles slide
  (translations only, tested) into two a-by-b rectangles, leaving a² (amber) and b² (teal).
- `pythag.ts`: isqrt, bracket, round1, triples, squareOn, tilted(p, q) (surround, corners, area, cells touched for
  the "count every piece as one" slip), proofTris (both configurations), triKind.

## The five parts
1. **The question**: legs 3 in and 4 in on grid paper, "slanted side = ?". Cards 7 in (adds-lengths-not-squares),
   5 in, 6 in (counts the grid squares the side crosses: bundle-counted-as-one) + how sure.
2. **Worked example** (3-4-5): Name the sides (right angle pulses, c glows, a = 3, b = 4, c = ?) → Build squares on
   the legs (9, 16) → Measure the tilted square (surround 7 × 7 = 49, corners 4 × 6, c² = 25) → Compare (9 + 16 = 25,
   c = √25 = 5, the c label turns into 5 in), then the rule a² + b² = c² is named last. Why 5 and not 7? (5 × 5 = 25 /
   3 + 4 = 7: adds-lengths / 25 inches: stops-before-taking-root).
3. **Your turn** (6-8-10), faded from the end: sides and leg squares given (36, 64); the kid types c² (14 →
   adds-lengths, 28, 10 diagnosed) and c (100 → stops-before-taking-root, 50 → root-as-dividing-by-index, 14 →
   adds-lengths). Callback to the card from part 1.
4. **Prove it**: Sam checked 3-4-5 and 6-8-10, "so it is true for every right triangle". Is that a proof? (yes →
   examples-as-proof). Because-chain on the proof square: the middle is a c-square (4 hypotenuse sides, corners 180° −
   90°) → slid, the triangles leave a² + b² → same big square and same triangles, so c² = a² + b² for every right
   triangle. Distractor chips: looks like a square (diagram-appearance-as-given), it worked for two triangles
   (examples-as-proof), the triangle's area is a² + b² (theorem-about-triangle-area).
5. **Practice**: all 16 sub-goals in topic order, then mixed. Pictures: triangles in any pose (squares grow in the
   worked-solution replay), tilted grid squares (surround and corners in the replay), the proof square; situations
   show their sketch only after a miss (the kid models first).

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| name-legs-hypotenuse | findHyp (vertex letters, any pose, hypotenuse flat at the bottom too), letterC (c sometimes on a leg) |
| square-area-labels | squareArea (3-4-5 / 6-8-10 on grid, then letters), areaUnit (sq units vs units, × 2, perimeter) |
| tilted-square-area | tilted (steps (1,1) … (3,4): areas 2, 5, 10, 13, 25; touched cells diagnosed), surroundCalc |
| area-relation-right | missingArea (one square "?"), eqTrue (25 = 9 + 16 style, equal-sign bridge), meaning (squares vs triangle area) |
| relation-fails-nonright | nonRight (acute / obtuse grid triangles, equilateral 4-4-4 style, right ones mixed in), rightFirst |
| side-from-area | exactSide (√A exactly; half, ÷ 4, "no exact length"), bracketRoot (k < √A < k + 1) |
| write-equation | writeEq (unknown hypotenuse / leg / c on a leg) |
| hypotenuse-whole | hypWhole (the six triples, either order) |
| missing-leg | missingLeg, mixedSides (leg or hypotenuse unknown, shuffled) |
| irrational-exact-approx | exactRoot (√(a² + b²) vs a + b, √(a + b), c²), roundTenth (calculator; nearest whole / chop diagnosed) |
| model-context | contextHyp (which length is the hypotenuse), story (ladder, screen, walk, isosceles height, square diagonal) |
| unit-consistency | mixedUnits (1 ft and 5 in → 13 in, ramp 6 in over 2 ft …), unitName (in vs sq in) |
| substitution-check | subCheck (right whole / √ candidates, forgot the root, added instead of subtracting) |
| size-check | sizeCheck (leg longer than hypotenuse, c = a + b, passes both checks but wrong, right) |
| rounding-aware-check | roundCheck (3.6² = 12.96 vs 13: close is right; a too-far rounding is wrong) |
| explain-proof | proofStep (why the middle is a square, why the uncovered area stays, the numbers, what it shows) |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table, all checked against
misconceptions.json in the test). Voice: `script.ts` holds html + spoken text side by side; lines.json is generated
from it (the test keeps them equal). No runtime change was needed.
