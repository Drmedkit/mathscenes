# Scale calculations: drawing lengths and actual lengths (primary.ratios.scale-drawing-reality-calculations, grade 7, 7.G.A.1)

**Concept.** A scale is drawing : actual, in that order, and ONE factor links every drawing length to its actual
length. Plan → actual is × k at 1 : k (÷ k at k : 1); the step back undoes it with the SAME factor. Units must fit the
scale: convert the given length first or the result after (with a unitless scale either order works). Check an answer
by going back and against a benchmark. Builds on `scale-basics` (what a scale means) and `scale-drawings` (the plan
look); their unit table is imported read-only (`scaleCalc.ts` wraps `scale-drawings/scaleMaths.convert`).

**Model: ScaleLines** (`ScaleLines.ts`, maths in `scaleCalc.ts`). Aligned number lines, the ratio table made
visible: row 0 = drawing lengths (amber), row 1 = actual lengths (teal), optional row 2 = the actual lengths in another
unit. Tick i is i × step in every row, so ONE position is one length read in every unit. A blueprint card on top holds
the scale (and, step `obj`, the object drawn at the plan's own size, left end on 0, projecting onto row 0). Steps
`card lines ref nums down up alt conv given drop via ask answer obj wrong strike bench`: `ref` labels and glows the
reference pair (1 in ↔ 8 ft); `down` / `up` are the × k / ÷ k arrows in the right gutter; `conv` the unit arrows
between rows 1 and 2; `given` a bar from 0 and the value; `drop` an arrow straight to the asked row (it skips label
boxes); `ask` shows '?', `answer` the value (lime). The block CHECKS the maths: given, via and asked marks must sit at
one position (one length), so a wrong answer cannot be drawn as right. Tick labels thin themselves and never show
under an asked value (no answer before the kid answers); `focus.quietRow` hides a row's labels in practice. Throws
BlockError when a label leaves the frame or two labels touch. Roles: amber drawing, teal actual, lime answer,
lavender the operation, red Sam's claim.

## The five parts
1. **The question**: plan at 1 in : 8 ft, a 20 ft wall. Cards 160 in (multiplies on the way back:
   scale-factor-wrong-operation), 2.5 in, 13 in (adds the difference: additive-keep-difference) + how sure. Picture:
   the lines with 20 ft marked, no '?' yet (its position would give it away).
2. **Worked example**: Read the scale (ref glows, × 8 arrow; `1 in : 8 ft`, `plan →×8 actual`) → Turn back (÷ 8 arrow;
   `actual →÷8 plan`) → Divide (drop from 20 ft to the plan row, '?' → 2.5; `20 ÷ 8 = 2.5 in`) → Check and draw
   (`2.5 × 8 = 20 ft ✓`, the wall drawn on the plan to 2½ in; `2.5 in = 2 1/2 in`). Why divide: right / "always
   multiply by the scale number" (wrong-operation) / "12 more, so 13 in" (additive).
3. **Your turn**: bedroom wall 2.25 in, faded from the end: scale given; the kid picks the step (× 8; ÷ 8 =
   divides-by-rate-when-multiplying-needed, the ÷ arrow lights to show it goes the other way; add 7 = additive),
   computes 18 ft (16.25 part-by-part, 0.28125 divides, 9.25 additive), checks by going back 18 ÷ 8 = 2.25 (144 =
   wrong-operation, 2 / 2.2 = forces-whole-number-quotient); the wall is drawn on the plan. Callback to the card.
4. **Prove it**: Sam: model shed at 1 : 48, 12 ft → 12 ÷ 48 = 0.25, "0.25 in" (relabels-without-converting). Three
   rows (model in, real in, real ft); Sam's 0.25 marked red on the model row. Because-chain: 0.25 is far too small
   (12 ft drops straight onto 3, Sam's mark struck) / 144 in (1 ft = 12 in, one unit for 1 : 48; via 144) / 3 in
   (144 ÷ 48). Distractors: "always convert before you divide" (one-valid-order-convert-scale), "a foot is 10 inches"
   (customary-as-base-ten).
5. **Practice**: all 16 sub-goals in topic order, then mixed. ScaleLines pictures for every computing family (the
   asked row quiet; a miss replays arrow → drop → answer and writes the work on the board); choice families (meaning,
   prediction, diagnosis, audit) on the wide slate.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| scale-as-ordered-ratio | table (ratio table, also "8 ft are shown as 1 in"), order (which is drawing : actual), whichPair (which pair fits: additive / swapped pairs) |
| unitless-scale-meaning | unitless (1 : N and N : 1 meaning), unitlessCalc (basic facts, x 10 / x 100), sameUnitPick (which real length: cm vs m) |
| reverse-direction | reverse (/ k back; 5 : 1 both ways), predict (more or fewer inches; larger or smaller drawing, 1 : 1), arrowBack (the arrow back) |
| compute-actual-whole | toActual (1 in : 8 / 12 ft, 1 cm : 5 m, 1 : 24 ... 1 : 200, 5 : 1 and 10 : 1), roomCalc (real perimeter / length minus width of a room) |
| compute-actual-nonwhole | toActual (decimal cm, halves and quarters of an inch), mixedPick (which calculation multiplies every part) |
| compute-drawing-from-actual | toDrawing (exact, decimal quotients, / 12, 1 : 50 / 100 / 200, 5 : 1), fitPaper (does it fit across the sheet) |
| decimal-to-ruler-mark | rulerRead (a half-inch ruler under the drawn object), fracForm (1.75 in = 1 3/4 in) |
| normalize-nonunit-scale | normalize (1/4 in = 1 ft, 2 cm : 5 m both directions with groups), normTable (the row per one unit) |
| scale-with-units-to-unitless | toUnitless (1 in : 4 ft = 1 : 48; three rows), unitsBack (1 : 96 = 1 in : ? ft) |
| convert-input-unit | convertIn (yards into a feet scale; meters at 1 : N, both orders), convertFirst (which conversion first) |
| convert-output-unit | convertOut (1 : 12 / 24 / 48 inches -> feet, 1 : N cm -> m), sensibleUnit (the same length in ft / m) |
| find-scale-from-pair | findScale (distractor length, metric 1 : N, half-inch drawing doubled), pairPick (which two lengths belong together) |
| magnitude-direction-check | reasonable (off by k squared, 12 / 100, 10, or plausible, against a benchmark), plausible (which model length can be true) |
| diagnose-reversed-factor | diagnoseRev (x vs /, enlargement, read as actual : model), fixRev (type the corrected value) |
| diagnose-missing-conversion | diagnoseConv (cm-m, in-ft, yd-ft, converted twice, a correct scale-first solution), sizeError (how many times off) |
| audit-scale-solution | audit (correct either order / reversed / missing conversion / both; the couch), auditFix (check, then type the right length) |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table, checked against
misconceptions.json in the test). No runtime change was needed; the model uses its own wider frame (`lessonPics.LF`,
60..1190 px) because three labelled number lines and the arrow gutter do not fit the default 940 px frame.
