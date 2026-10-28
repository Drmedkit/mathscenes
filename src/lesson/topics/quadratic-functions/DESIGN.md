# Quadratic functions and their graphs (Algebra 1, lesson 17)

Topic `secondary-t6-11-quadratic-functions-graphing-and-key-features`, slug `quadratic-functions`, 33 sub-goals,
54 families. Requires `factoring` (zeros from factors) and `units-and-quantities` (contexts); completing the square
comes from `completing-the-square` and is used, not re-taught.

## Concept
A parabola is symmetric: equal outputs come in mirror pairs, equally far from one vertical line. The zeros are one
such pair (both outputs 0), so the axis is halfway between them, the vertex sits on it, and its height is f(h). Each
form shows one feature for free: factored form the zeros, vertex form the vertex (and, because a square is never
negative, the extreme value), standard form the y-intercept. Everything else (the axis from −b/(2a), the zero count
from the vertex, transformations, domain and range, intervals) follows from that picture.

## Model
- The kit `Plane` for every graph: the parabola (`curve`), the axis (`vline`), zeros / vertex / y-intercept and
  mirror points (`point`), mirror segments and offsets (`seg`), a trace riding the curve in the worked example.
- `qf.ts`: exact maths on standard coefficients [a, b, c] (vertex form and factored form convert to it), the vertex,
  the real zeros, windows (`win`), and the HTML / TeX writers for all three forms.
- Practice pictures are data (`GPic` in `common.ts`: `show` items on screen from the start, `reveal` items for the
  replay, `slate` when nothing may be shown before the answer). `pic.ts` turns them into Plane params, so the tests
  build every picture with the page's frame. A graph that would give the answer away is a slate first; a plane is
  never empty before the answer (tested).
- Colour roles: the curve lime (`link`), zeros teal (`second`), the axis lavender (`pick`), given points amber
  (`first`), the y-intercept and its mirror blue (`water`).

## The five parts
1. **The question.** y = (x + 1)(x − 5) with its two zeros on the plane: where is the lowest point? Cards (2, −9) /
   (0, −5) (parabola centred on the y-axis) / (2, 0) (vertex height read as 0) + how sure.
2. **Worked example** (Find the zeros → Put the axis halfway → Find the vertex → Mirror the y-intercept, then
   sketch): the points move first, the board follows; the curve draws through everything and a trace rides it; the
   three forms are written equal. Why is the axis halfway? (mirror pairs / centred on the y-axis / half the distance)
3. **Your turn.** y = −(x + 2)(x − 4), zeros given: the kid types the axis (1; 3 = half difference, −1 = sign), the
   vertex height (9; −9 = ignores the minus, 0 = height 0) and the y-intercept (8; 9 = vertex height). Callback to
   the card.
4. **Prove it.** Sam checked f(1) = f(5) for (x − 3)² − 4 and calls it a proof. Not yet: a because-chain with a
   general distance d (substitute, (−d)² = d², equal for every d, every point has a partner). Decoys: (−d)² = −d²,
   f(3 + d) = f(3) + f(d), "it worked for d = 2".
5. **Practice**: all 33 sub-goals in order, then mixed.

## Sub-goal → families
| sub-goal | families |
|---|---|
| table-to-parabola | tableY (incl. half-integers vs straight segments), linVsQuad |
| vertex-extremum | vertexRead (graph), extremeVal (graph mode) |
| axis-of-symmetry | axisRead (graph), axisTable (incl. x = 1.5) |
| zeros-from-graph | zeroCount (2/1/0), zerosRead (incl. halves, a zero at 0) |
| mirror-points | mirrorPt (incl. the y-intercept), axisMid (opposite, same sign, half midpoint) |
| vertex-form-read | vfVertex, axisRead (vertex-form mode) |
| sign-of-a | openDir (k's sign disagrees with a's), extremeVal (equation mode) |
| magnitude-of-a | offsetY (a·d², not a·d), narrowest |
| parent-transformations | transformName (af, f + d, f(x − c)), mapPoint (combined af(x − c) + d) |
| horizontal-scale-fbx | fbxPoint (b = 2, 3, 1/2, −1, −2), fbxSame (f(bx) = b²x², both directions) |
| zero-count-from-vertex | countZeros (vertex form; standard form with the axis given, k = f(h)) |
| zeros-by-square-roots | sqrtZeros (perfect squares), sqrtExact (irrational, q = 0, q < 0) |
| factored-form-zeros | facZeros (incl. x factor, (2x − 3), negative a), facRepeat |
| factored-form-vertex | facVertex (incl. repeated factor, half midpoints), axisMid |
| y-intercept-f0 | yInt (all three forms, b = 0, c = 0, origin), cMeaning |
| standard-form-axis | stdAxis (incl. b = 0, fractional −b/(2a)), stdPair (the mirror pair 0 and −b/a) |
| graphing-technology | techWindow (standard window hides features), techTrace (−X^2) |
| complete-sketch | whichGraph (three graphs: right / mirrored h / flipped a), hiddenZero |
| domain-range | rangeOf (range or domain, graph or equation) |
| rising-falling | riseFall (lines and parabola arcs, rising below the axis), incInterval |
| increase-decrease | incInterval (incl. graphs wholly below the axis) |
| positive-negative-intervals | posNeg (2 / 1 repeated / 0 zeros, both signs) |
| equivalence-of-forms | expandVF (vertex and factored → standard), proofOrCheck (two checks are not a proof) |
| vertex-form-from-point | findA (coordinates, graph, table), findACtx (arch, ball, profit) |
| factored-form-from-zeros | zerosToA (incl. a double zero, a half zero), zerosToForm |
| factor-to-reveal-zeros | factorZeros (a = 1, GCF, a = 2, difference of squares), methodPick (does not factor) |
| complete-square-to-vertex | csVertexForm (even b, odd b, a ≠ 1), csMin |
| choose-form | chooseForm, bestFormValue |
| justify-zeros | zeroProd |
| justify-extremum | boundWhy |
| justify-symmetry | symProof, mirrorPt (proof mode) |
| interpret-context | projectile (−16t² + v₀t + h₀: landing, peak, time of peak), penMax (incl. a vertex outside the domain) |
| compare-representations | compareMax (equation vs graph; the constant term points the wrong way) |

Every choice list goes through `choiceItem`, which drops a wrong option whose `key` (number, point, function as
[a, b, c], zero set, sign pattern) equals the right one's, so symmetric zeros, h = 0, h = k, b = −1 and the like can
never make a distractor secretly right.
