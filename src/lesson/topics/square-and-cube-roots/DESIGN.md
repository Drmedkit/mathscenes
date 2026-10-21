# Square roots and cube roots (grade 8, 8.EE.A.2, 8.NS.A.1-2)

Topic `secondary-t5-28-square-roots-and-cube-roots`, slug `square-and-cube-roots`. Builds on `perfect-squares`.

## Concept
A root undoes a power. √p is the side of a square with area p: the ONE number, 0 or more, whose square is p. ∛p is
the edge of a cube with volume p: the number used as a factor three times to make p (one value, any sign). The same
64 cubes make a flat 8 × 8 layer (√64 = 8) or a 4 × 4 × 4 cube (∛64 = 4): the little 3 changes the question, it is
not "divide by 3". A root that is not whole lies between whole numbers (k³ < 200 < (k+1)³), is closed in by squaring
trial decimals and rounded by squaring the midpoint. The EQUATION x² = p has two solutions ±√p; the SYMBOL √p names one.

## Models
- `IsoBox.ts`: unit cubes in isometric view. Steps `box` (closed cardboard box), `open` (wireframe), `layers` (amber
  cubes fill layer by layer), `vol` (amber volume label), `edge` (bracket + label, lime; teal for a side that only
  compares), `count` (the cubes along the edge light up), `ghosts` (k- and (k+1)-cube outlines from one corner with a
  k / k+1 ruler: k < ∛V < k+1). `computeBox` counts the cubes and asserts k³ < V < (k+1)³; `place` lets two boxes
  share one scale (the worked example's slab 8 × 8 × 1 next to the 4 × 4 × 4 cube). `where.floor` puts the table
  edge behind the base, so boxes stand on it.
- `SquareTiles.ts`: a square from above. `slab`, `tiles`, `area`, `side`, `count`, `ghosts`; cut mode draws ONE unit
  square cut b × b with a × a painted (√(a²/b²) = a/b). Tiles only for whole sides ≤ 15, layout throws under 30 px.
- `RootRuler.ts`: a number line of roots. `axis` (labels staggered into two rows when they touch), `powers` (k² or k³
  in amber under each whole number), `band` (lime, k..k+1 or two tenths), `mid` (lavender midpoint), `marks` (TeX
  labels stacked when close), `arcs` (teal, from 0 to ±√p; labels then sit higher so no arc crosses a label).

Colour roles: amber (`first`) = area / volume / radicand, lime (`link`) = the root asked for, teal (`second`) = the flat
side that only compares (√64 = 8) and the ± arcs, lavender (`pick`) = a midpoint or a decimal to compare, red = struck.

## The five parts
1. **The question**: a cube-shaped gift box holds 64 one-inch cubes. Cards 8 in (ignores-root-index), 4 in, 21⅓ in
   (root-as-dividing-by-index) + how sure. Board `e × e × e = 64`, `edge e = ?`.
2. **Worked example** (Lay flat, Stack, Count, Check and write): the 64 cubes as an 8 × 8 slab (`√64 = 8`, the slab's
   teal edge label pulses), stacked in the box (`4 × 4 = 16`, `16 × 4 = 64`), the edge counted (`edge = 4 in`, leader),
   `4 × 4 × 4 = 64`, hero `∛64 = 4` with a leader to the edge. Why 4 and not 8: cube uses its edge 3 times / "every root
   of 64 is 8" (ignores-root-index) / "divides by 3" (root-as-dividing-by-index).
3. **Your turn** (216 cubes), faded from the end: stacking given; the kid types the edge (72 → dividing), checks
   6 × 6 × 6 (18 → base-times-exponent), writes ∛216 = 6 from chips √ ∛ 216 6 72 (√ → ignores-root-index, 72 →
   dividing); then the 6-cube becomes the outer ghost of a 200 in³ cube and the kid bounds 5 < ∛200 < 6 (14, 15 →
   ignores-root-index; 125, 216 → squares-as-root-bounds). Callback to the card from part 1.
4. **Prove it**: Jordan: "√49 = ±7, because (−7)² = 49 too." Judge, then a because-chain: x² = 49 has two solutions
   (7 · 7 and (−7)(−7); arcs on the number line), but √49 names only 7 (the side of the 7 × 7 square; leader), so
   x = ±√49 = ±7 and Jordan's line is wrong (the ± comes from the equation). Distractors: principal-root-as-plus-minus,
   only-positive-root. Jordan's ±7 is struck at the end.
5. **Practice**: all 21 sub-goals in order (runtime/practice.ts), then mixed. Squares, cubes and rulers are drawn where
   they carry the idea; a miss replays the solution on the picture (tiles/cubes counted, edge or side written, band and
   marks placed, the bound or midpoint comparison written on the board). Lines that link to a label sit at the label's
   height, so their leader runs straight across and never over the model.

## Sub-goal → families
| sub-goal | families |
|---|---|
| undo-squaring | sqSide (rug/patio side from area with tiles; square forward; undo squaring; does halving undo it?) |
| radical-notation-principal | principal (√64 names 8 only, ± on the line; (√7)² = 7 exactly; √(k²) = k) |
| undo-cubing | cubeEdge (box edge from volume; cube forward; undo cubing) |
| cube-root-notation | rootIndex (√64 and ∛64 side by side on slab + cube; ∛ of cubes 0..1000; what the 3 asks) |
| sign-domain | signRoot (∛(−8) = −2; √(−9) not real; −√9; −3² vs (−3)²) |
| eval-perfect-square-roots | evalSq (0..144, slab → tiles on a miss) |
| square-roots-to-225 | evalSq (13² by splitting; √169, √196, √225; check a digit guess by squaring) |
| eval-perfect-cube-roots | evalCube (6³..9³ by multiplying; ∛ of cubes to 1000; ±k distractor) |
| rational-radicand-roots | ratRoot (√(a²/b²) on a cut unit square; decimals; ∛(a³/b³); root of 0 < p < 1 is bigger; √0.9 ≠ 0.3) |
| exact-vs-approximate | rational (perfect → rational; √(1/9) = 1/3 repeating; non-square → irrational; = vs ≈) |
| bound-square-root-integers | boundSq (□ < √n < □ on a ruler with squares under the numbers) |
| bound-cube-root-integers | boundCube (ghost cubes for small n, ruler with cubes otherwise; negative radicands as extension) |
| refine-decimal-bounds | refine (trial squares → tenths bounds on a tenths ruler) |
| locate-compare-roots | compare (√n vs a decimal; √p vs ∛q with the bigger radicand smaller; order a mixed set) |
| round-root-nearest-tenth | roundRoot (midpoint square to the tenth; nearer whole number incl. the 56.4-type counterexample) |
| square-equation-two-solutions | solveSq (both solutions typed; exact ±√p; fractions; true/false √64 = ±8; check −k) |
| square-equation-boundary-cases | countSol (x² = 0, x² = −k², x² = k², x³ = ±k³: none / one / two) |
| cube-equation-one-solution | solveCube (x³ = k³; is −k a solution; x = ∛q exact; fractions; typed) |
| isolate-then-root | isolate (3x² = 48; x² + 9 = 25 and x² − 9 = 16 with the split-root slip; 2x³ = 54) |
| context-select-root | context (side from area; round with the midpoint square; keep the nonnegative side; units; cube tanks; keep working digits) |
| multistep-expressions-radicals | multistep (√(9 + 16) = 5 not 7; 3 + 2√49 − ∛(−27); −0.5² vs (−0.5)²; face of a cube box) |

Not diagnosable with these inputs, so not classified: `mc.exponents-roots.root-guessed-without-squaring-check` is only
tagged on the "which is √196" choice and Riley's √0.9 claim (an observation, not a rule).
