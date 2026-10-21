# Volume of cylinders, cones, and spheres (grade 8, 8.G.C.9 + TEKS 8.7A/B)

**Concept.** A cylinder is a stack of circular layers (V = Bh = πr²h). A cone holds one third of the cylinder with
the same base and height. A ball holds two thirds of the can that just holds it (radius r, height 2r), so
V = ⅔ · πr² · 2r = ⁴⁄₃πr³. Exact answers stay in terms of π; rounding is a last, separate step.

**Model.** `Vessels.ts`: glass vessels in composite-area-volume's camera (elevation 24°, boxes turned 28°): cylinder,
cone (point up), cup (cone point down), sphere, dome / bowl (hemispheres), box and triangular prism. Vessels hold
water as a *volume fraction* (`levelOf` in `volMaths.ts`), so a pour is honest: a cone poured into its can stands
exactly ⅓ high, a ball ⅔. A cylinder can be built from layers (the coin stack). Dims (r, d, h, slant l, box edges) are
coloured marks with word labels placed off every line (the block throws otherwise). `Net.ts`: flat nets for the
surface-area sub-goals (lateral strip = P × h, two bases; a can's label unrolls to 2πr × h).
Roles: first (amber) = the cone / ball / the solid, second (teal) = the can, pick = the asked length, link = the
match / answer, water = poured water.

## Five parts
1. **The question.** A cone-shaped cup and a can, same radius 4 in and height 6 in: how many cupfuls fill the can?
   Cards 2 (`cone-half-of-cylinder`), 3, 4; how sure.
2. **Worked example** (r 3 in). Stack the layers (base glows, 5 layers stack: 9π · 5 = 45π) → Pour the cone (three
   pours fill the can: 15π) → Pour the ball (r 3 in, can 6 in tall = 54π, the ball fills ⅔: 36π) → Name the formulas
   (πr²h, ⅓πr²h, ⅔ · πr² · 2r = ⁴⁄₃πr³). Why? "Why was the ball's can 6 in tall?" (distractors:
   `sphere-height-independent`, `sphere-half-of-cylinder`).
3. **Your turn** (faded from the end). Snow-cone cup r 2, h 6: layers and the cone are done; the kid gives the
   gumball's can height (4; 6 and 2 = `sphere-height-independent`) and the gumball's volume ³²⁄₃π (8 = half,
   16⁄3 = the cone's third), then the pour checks it. Callback to the committed card.
4. **Prove it.** Jordan takes ⅓ of a can (r 3, h 5) for a cone vase (r 3, h 10): 15π. Because-chain from chips;
   distractors `one-third-for-any-pair`, `cone-half-of-cylinder`, `divides-by-three-twice`. The vase's own cylinder
   appears, the pour reaches ⅓ of it (30π), Jordan's 15π is struck.
5. **Practice**: 25 sub-goals, 37 families.

## Sub-goal → families
| sub-goal | families |
|---|---|
| identify-r-h | id-lengths (cone r/h/slant 3-4-5, upright or turned), id-sphere, id-lying (can on its side) |
| cylinder-bh | bh-layers, bh-twin (box vs cylinder, equal B), bh-layer-area |
| cone-third | cone-pour, cone-match (non-examples) |
| sphere-two-thirds | sph-pour, sph-can |
| cylinder / cone / sphere / hemisphere calc, diameter-given | calc-pic, calc-story (each with that sub-goal's ranges) |
| mixed-formula-choice | mix-formula, calc-pic, calc-story |
| exact-vs-approx | approx-round (3.14 by hand / π key), approx-signs (= vs ≈, units) |
| decimal-dimensions | calc-pic (decimal, odd diameters), dec-frac-r (fraction radii) |
| sa-prism-lateral-total | sa-prism-net, sa-prism-story |
| sa-cylinder | sa-cyl-net, sa-or-vol (label / soup / tin interleaved) |
| common-length-unit | unit-mixed, unit-trap |
| cubic-unit-conversion | cubic-conv, cubic-cube (yd³ with ft seams) |
| capacity-conversion | cap-tank (231 in³ = 1 gal), cap-liter (1000 cm³ = 1 L, 7.48 gal/ft³) |
| estimate-check | est-judge, est-nearest |
| audit-inputs | audit-input, audit-fix |
| solve-for-height / -radius | solve-h / solve-r, solve-story |
| scale-height / radius / uniform | scale-one, scale-compare |
| model-practical | model-inside (walls), model-pile, calc-story (rounded) |
