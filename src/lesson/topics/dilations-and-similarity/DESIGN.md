# Dilations and similarity (`dilations-and-similarity`)

Topic `secondary-t5-36-dilations-and-similarity` (grade 8; 8.G.A.3, 8.G.A.4, 8.G.A.5), 23 sub-goals, 37 families.

## Concept
A dilation has a **center** and a **scale factor k**: every point P moves along its own ray from the center to P′
with CP′ = k · CP. So every length is multiplied by k (one shared ratio, never "+ the same amount"), angles and the
way round stay, and only the center stays put. About the origin that is (x, y) → (kx, ky); about any other center,
multiplying the coordinates is wrong. Similar = a dilation followed by rigid motions (turned or flipped copies count,
k = 1 counts). To decide similarity, check EVERY side ratio and EVERY angle under one correspondence; for triangles
two equal angle pairs are enough (AA), for four-sided shapes they are not.

## Model
`DilBoard.ts` (maths in `dilMaths.ts`) draws with the congruence lesson's `TraceBoard` painters (read-only import:
same plane, washes, letters, label placement, tracing paper) and adds the dilation: a teal center pin, crisp teal
rays through every corner, **distance bars** beside one ray (amber = C to P, lime = C to P′ with a tick every 1/d of
the amber bar, so k = n/d can be counted), the image growing out along the rays, a tracing through "dilate, then
rigid motions", and a paper replay for figures off the grid (dilate in place, then flip / turn / slide onto the
partner). Paper figures are built from SSS or AA so every label equals the drawn shape; `simMap` and
`checkDilation` assert the maths; `picProblem` refuses pictures that would be unreadable (tests run it on every item).
Roles: amber = the figure we start from, teal = center / rays / moves, lavender = the other figure or candidates,
lime = the image / the answer, red = wrong.

## The five parts
1. **The question**: △ABC (right angle at A), center O, k = 2. Where does C (1, 4) land? Point 1 (−1, 5) = grown
   from the triangle's middle (`dilation-center-is-figure-middle`), point 2 (2, 8) = right, point 3 (3, 6) = 2 added
   to each coordinate (`additive-scaling`). How sure.
2. **Worked example**: rays from O → twice as far (bars on C, A, B; points 1 and 3 turn red) → join the image,
   (x, y) → (2x, 2y) → check what stays (right angles, order arrows, 8/4 = 4/2 = 2). Why is point 1 wrong? (right /
   additive / middle).
3. **Your turn**: △PQR, k = ½, faded from the end: rays and P′ given; the kid types Q′ (diagnoses ×2 instead of ×½,
   a dropped sign, one coordinate only, Q unchanged), then P′R′ (12, 6, 5.5 diagnosed), then what is true of the
   image (additive, angles halved). Callback to the part-1 card.
4. **Prove it**: Riley: "R (6 by 4) and S (9 by 5) both have four right angles, so they are similar." Because-chain
   from 6 chips (distractors `equal-angles-make-polygons-similar`, `additive-keep-difference`,
   `checks-one-side-ratio`); R dilated by 3/2 about its corner becomes 9 by 6, S slides onto it, the 1-unit strip
   that overhangs turns red, "R ~ S" is struck.
5. **Practice**: all 23 sub-goals in order, then mixed. After a miss the picture replays (rays → bars → grow, the
   tracing, or the paper replay) and the '?' turns into the answer. Review aid:
   `dilations-and-similarity.html?open&part=4&item=<family>:<subgoal>:<seed>&solve`.

## Sub-goal → families
| # | sub-goal | families | main misconceptions |
|---|---|---|---|
| 1 | correspondence-from-mapping | corrSide, corrStatement | matches-by-position-or-letters, matches-sides-by-apparent-length |
| 2 | dilation-center-ray | dilPoint, dilCenterOn | dilation-center-ignored, dilation-center-is-figure-middle, additive-scaling |
| 3 | dilation-reduction-identity | dilPoint (½, ⅓, ¾, 1, 3/2), kEffect | misjudges-enlarge-vs-reduce, fraction-must-be-less-than-one |
| 4 | coordinate-dilation-origin | ruleImage (pair; choice for thirds), ruleCenterTrap, kEffect (rule) | drops-sign, scales-one-step, dilation-center-ignored |
| 5 | angle-invariance | angleKeep, orientKeep, propTable | scales-angles, rotation-or-dilation-reverses-orientation, size-change-confused |
| 6 | proportional-sides-common-ratio | ratioK, addVsMult | additive-keep-difference |
| 7 | similarity-as-transformations | simYesNo (dilate+move, k = 1, one-way stretch), simSeq | turned-or-flipped-copy, similarity-judged-by-appearance |
| 8 | correspondence-across-orientation | corrRotated, corrStatement (turned) | matches-by-position-or-letters |
| 9 | directed-scale-factor | kFromSides, ratioK (grid, both directions) | scale-factor-larger-over-smaller, missing-factor-by-subtraction |
| 10 | identify-similar-polygons | simCheck, rectRhombus | checks-one-side-ratio, equal-angles / equal-ratios-make-polygons-similar |
| 11 | forward-missing-length | lenK, lenFig | additive-keep-difference |
| 12 | inverse-missing-length | lenK, lenFig | scale-factor-wrong-operation |
| 13 | missing-angle-direct | angCorr, angleKeep | scales-angles, matches-by-position |
| 14 | third-angle-across-figures | angThird, angThirdFlip | matches-by-position, scales-angles |
| 15 | context-missing-length-units | ctxShadow (ft / in), ctxMetric (m / cm) | arithmetic-on-unconverted-unit-numerals |
| 16 | refute-universal-claim | allSimilar, rectRhombus | equal-angles-make-polygons-similar, examples-as-proof |
| 17 | refute-stated-correspondence | stmtCheck, otherOrder | ignores-vertex-labels, failed-search-proves-impossible |
| 18 | sufficiency-of-evidence | enough, aaQuad | failed-argument-as-disproof, checks-one-side-ratio |
| 19 | measurement-vs-exact | measured, enough (measured / witness cases) | examples-as-proof |
| 20 | transformation-witness | witnessPick, simSeq (two rigid motions) | partial-match-as-whole-mapping |
| 21 | aa-informal-argument | aaArgue, aaWhy | two-matched-vertices-force-triangle-coincidence, step-without-reason |
| 22 | aa-apply | aaDecide, aaQuad | requires-side-measurements-despite-aa, equal-angles-make-polygons-similar |
| 23 | practical-resizing-claim | resize, resizeJudge | additive-keep-difference |
