# Understand scale: drawings and actual lengths (primary.ratios.scale-introduction, grade 7, 7.G.A.1)

**Concept.** A scale compares a drawing length with the MATCHING actual length, multiplicatively and in ONE unit:
"the actual length is n times as long". Written drawing : actual (4 : 32 = 1 : 8), so 1 : n has no unit and the n is
a factor, never a length. A legend "1 in represents 10 ft" is a rate (two units); in one unit it is 1 : 120. This is
the gentle way in before `scale-drawings` (same blueprint look; its unit table is imported read-only).

**Model: ScalePair** (`ScalePair.ts`, maths in `scaleBasicsMaths.ts`). The drawing on a small blueprint card (top),
the actual object as a teal wash under it, left edges aligned. *Copies mode*: both drawn at ONE px scale, so the
actual length is literally n copies of the drawing's length: `copyL` lays an amber tape of copies along it (count
"× n" at its end), `copyW` a column along the width. A drawing that is not to scale overshoots (red) or falls short
(red bracket). *Units mode* (1 : 100): the drawing's length is cut into its centimeters and each maps onto one teal
block "100" of the actual length; `focus.sam` rings the first block and writes "100 cm" under it (Sam's length).
Steps `card fig labD real labA labAw tag copyL copyW units`; `focus.pair` glows corresponding sides (len / wid).
Labels sit outside sides on paper pads; the block throws when a label leaves the frame, overlaps or sits on a figure.
Colour roles: amber = drawing, teal = actual, lime = the factor / answer, lavender = focus, red = wrong.

## The five parts
1. **The question**: a skateboard drawn 4 in long, actual 32 in. Which scale? 1 : 28 (the difference,
   factor-reported-as-difference), 1 : 8, 8 : 1 (reverses-scale-ratio-order) + how sure. Board: drawing / actual /
   scale = 1 : ?
2. **Worked example** (skateboard 4 by 1 in, actual 32 by 8 in): Match the lengths (len pair glows, then wid) →
   Count the copies (8 copies fill the board; 32 ÷ 4 = 8, actual = 8 × drawing) → Check the width (8 copies of 1 in;
   8 ÷ 1 = 8 ✓) → Write the scale (tag on the card; 4 : 32 = 1 : 8, drawing : actual). Why "1 : 8, not 1 : 28?":
   right / difference / "only the length counts" (too-few-checks).
3. **Your turn**: laptop 6 by 4 cm, actual 30 by 20 cm, faded from the end. Match + copies done for you; the kid
   types the width factor 5 (16 = difference, 0.2 = reversed, 20 = the length itself), the width copies play, then
   writes 1 : 5 in two boxes (5 : 1 reversed, 1 : 24 / x : x+24 difference, 1 : 30 one term only, 6 : 30 equivalent
   but not 1 : n). Callback to the card.
4. **Prove it**: Sam: "1 : 100, so the hallway is 100 cm long" (plan 5 by 2 cm). Judge, then a because-chain:
   100 is a factor (the plan's centimeters map onto blocks of 100) / 500 cm, not 100 (Sam's 100 cm is one block, on
   its own row under the hallway, struck) / width 200 cm, same scale. Distractor chips: scale-denominator-as-length,
   different-segments-different-scale, same-unit-scale-changes-with-unit.
5. **Practice**: every sub-goal in topic order, then mixed. ScalePair pictures for match (labels and the matching
   glow after a miss), timesAs / timesSay (copies or units replayed) and scaleCheck (both copy directions, overshoot
   or shortfall shown); the rest are bare notation on the wide slate.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| corresponding-lengths | match (which actual side goes with this one), pairUp (which pair corresponds) |
| times-as-long-same-unit | timesAs (facts 2-10, then × 10 / 100 / 1,000), timesSay (the right sentence) |
| one-factor-all-lengths | scaleCheck (factor from the widths, test on the lengths), toScale (true / stretched / +2) |
| common-unit-first | sameUnit (cm-m, in-ft, in-yd, ft-yd, all facts or powers of ten), convertFirst |
| read-ratio-scale | readScale (1 : 2 ... 1 : 1,000, in and cm), whichPart (which number is the drawing's) |
| write-ratio-scale | writeScale (1 : n given, to normalise, mixed units; two boxes) |
| read-unit-legend | legendMeaning (represents vs "=" as equality), legendWrite (1 in represents ? ft) |
| legend-to-ratio | legendToRatio (1 in : 10 ft → 1 : 120 ...), ratioToLegend (back) |
| factor-vs-length | whatIsN (what is the 100?), useFactor (two walls, one scale) |
| unit-invariance | unitSwap (cm → in / mm, in → ft: still 1 : n) |
| factor-direction | direction (× n up, 1/n down as a fraction, or the right sentence) |
| enlargement-scales | enlarge (n : 1 reading, which scale enlarges, 1 : 1 boundary) |
| compare-scales | compareScales (1 : 50 vs 1 : 200, larger / smaller) |
| rate-vs-factor | rateFactor (legend → factor), rateOrFactor (what the rate number means) |
| critique-scale-claims | critique (factor as length, rate as factor, different segments, unit change) |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table, checked against
misconceptions.json in the test). No runtime change was needed; the walk blocks Vite's HMR client.
