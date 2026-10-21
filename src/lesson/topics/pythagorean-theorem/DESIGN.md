# Pythagorean theorem (secondary-t5-38, grade 8, 8.G.B.6-8, 8.EE.A.2, 8.NS.A.2)

Slug `pythagorean-theorem`. The intro topic (`pythagoras-intro`) built a² + b² = c² from squares on the sides; this
topic starts from the theorem and goes on: the converse, distance on the plane, diagonals in boxes, applied problems,
critique, and the proofs of the theorem and of its converse.

## Concept
Wherever a right angle is GIVEN, the hidden right triangle turns two perpendicular distances into a straight one:
square, add, take the root. On the plane the legs are the coordinate differences (not the coordinates); in a box
two triangles chain (the floor diagonal is a leg of the standing triangle; keep it exact). The theorem needs the right
angle; its converse (a² + b² = c² for the longest side c → right angle) is true, but because of a proof (build a
right triangle with legs a, b: its hypotenuse is c, same three sides, same angles), not because rules flip.

## Models
- `PlaneDist.ts`: the congruence lesson's crisp plane (imported read-only), two points with names and coordinates,
  the run (amber), the rise (teal), the right-angle mark at the corner C, the straight segment (lime). Steps
  `plane pts run rise mark legs hyp hypl swap`; labels beside their segment, the point names try four corners (in the
  frame, off the triangle, off the labels), throws when a label leaves the frame.
- `Sketch.ts`: a figure from named points (plain data, so items describe pictures): washes, crisp lines (dashed =
  hidden), right-angle marks, "?" angles, corner letters, side labels (never on a line: the other side is tried,
  else BlockError), TeX at a point, and groups that turn + slide (the converse proof). `sketches.ts` builds the
  situations (ladder, TV, walk, ramp, park, deck), the box (oblique drawing, hidden edges dashed, floor diagonal,
  edge up, space diagonal, a projected 3-D right-angle mark), a rectangle / isosceles figure, the converse figure,
  a number line with a root, a lone square, a triangle true to three lengths.
- Read-only from the intro: `SideSquares` (triangles with squares on the sides, tilted grid squares), `ProofSquare`
  (the rearrangement proof), `pythag.ts` maths. `theoremMaths.ts`: kind3 (exact, decimals too), sssPts, run/rise,
  box projection, MIDWAY_BOXES (rounding the floor diagonal mid-way changes the tenth), wholeCellsInside, the
  converse motion (tested: it lands exactly on the given triangle).
- Layout: the model frame is narrowed to 860 px (`PIC_FRAME`) and the notation slate widened to 910 px
  (`WIDE_SLATE`), so lines like AG² = 145 + 12² = 289 stay at 60 px or more (tested for every board and step).

## The five parts
1. **The question**: a drone flies straight from A(3, 4) to B(9, 12), 1 unit = 1 mile. Cards 14 mi
   (adds-lengths-not-squares), 10 mi, 15 mi (coordinate-as-length: B's coordinates as legs) + how sure.
2. **Worked example** (same plane): Draw the right triangle (corner C(9, 4), grid lines are perpendicular) → Read the
   legs (run 9 − 3 = 6, rise 12 − 4 = 8) → Square and add (36 + 64 = 100) → Take the root, check the size (10;
   8 < 10 < 14). Why 6 and 8, not 9 and 12? (right / coordinate-as-length / center-sign-flip: adding coordinates).
3. **Your turn** (3-D, faded from the end): a 3 × 4 × 12 in box; the floor triangle is given (AC = 5); the kid picks
   the standing triangle (ACG; ABC / ABF = face-diagonal-as-space-diagonal, the wrong triangle lights up), types
   AG² (25 face diagonal, 17 adds lengths) and AG (169 r-squared, 84.5 root-as-dividing, 5 face diagonal, 17 / 19
   adds lengths). Callback to the card.
4. **Prove it**: Lena: "right → a² + b² = c², so a² + b² = c² → right: every rule works backward". Judge her reason
   (good = converse-assumed-true; a square / rectangle counterexample). Because-chain on the converse figure: build
   a right triangle with legs 5 and 12 / its hypotenuse is 13 (theorem) / same three sides → it turns and slides onto
   Lena's triangle, the right-angle mark lands on her corner. Distractor chips: every rule works backward
   (converse-assumed-true), it looks square (diagram-appearance-as-given), it worked for 3-4-5 (examples-as-proof).
5. **Practice**: 22 sub-goals in topic order, then mixed; every item has a picture (answer hidden until the replay).

## Sub-goal → families (plan.ts), 40 families
| sub-goal | families |
|---|---|
| identify-hyp-legs | hypOpp (vertex or side letters, c often on a leg), embedded (rectangle + diagonal, isosceles + height) |
| tilted-square-area | tiltArea (horizontal run², whole cells only), tiltSteps (which calculation) |
| area-relationship | missingSq (leg or hypotenuse square), unitsAreas (square area vs length vs triangle area, units) |
| symbolic-equation | writeEq (any letters, vertex pairs), legOrHyp (which equation finds x) |
| right-triangles-only | holdsOrNot (evaluate a² + b², or decide; acute / obtuse up to 15), counterEx (one counterexample) |
| find-hypotenuse | hyp (fluency / applied triples), rootFinish (c² = 25 + 144: √25 + √144 diagnosed) |
| find-leg | leg, legOrHyp |
| decimal-sides | hyp, leg (0.6-0.8-1, 1.5-2-2.5, 0.5-1.2-1.3 …; decimal-square slip) |
| approximate-root | bracketRt (number line), tenthRt (calculator display; truncation), squareCheck (3.6² = 12.96) |
| irrational-lengths | exactLen (exact √ vs rounded; why irrational: full display), lenTenth, squareCheck |
| converse-test | isRight (unsorted, longest not last half the time, near misses, carpenter), whereRight |
| model-2d-context | story (ladder, TV, walk, ramp, park; role swap), whichTri (labels come after the kid models) |
| coordinate-distance | dist (Q1, across quadrants, horizontal / vertical, irrational to a tenth), distLegs (pair input) |
| prism-perpendicularity | perp3d (90° that looks acute; space diagonal not ⟂ floor; why), whichTri3d |
| locate-3d-triangle | whichTri3d, faceOrSpace |
| chain-3d | spaceDiag (3-4-12 and whole-diagonal boxes), keepExact (rounding AC mid-way changes the tenth) |
| critique-hypotenuse-assignment | findError (a leg used as c, in contexts), sizeCheck |
| insufficient-information | enough (mark, rectangle, perpendicular, looks only, known 80°), deckBrace |
| disprove-right-angle | refute (exact failure vs near; measured lengths are not conclusive), isRight |
| inner-square-justification | whySquare (both arrangements), innerAngle |
| dissection-area-argument | equalRemainders, proofLogic |
| converse-proof | converseStep (the reason for each step), converseWhy (rules that do not flip) |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table, checked against
misconceptions.json). No runtime change; the walk blocks Vite's HMR client.
