# Use a map scale (primary.ratios.use-map-scale, grade 7, 7.G.A.1)

**Concept.** A map scale is one fixed factor between map length and ground length. A ratio scale 1 : n has no units,
so both sides use the SAME unit (1 in -> n in, 1 cm -> n cm); a sensible unit comes after, by converting.
1 mi = 5,280 ft x 12 = 63,360 in, so 1 : 63,360 is exactly 1 in = 1 mi; 1 : 24,000 (USGS topo) is 1 in = 2,000 ft.
Ground -> map uses the same factor the other way, after the ground length is in the map unit. (Map key, bar-scale
routes and estimating along roads belong to the sibling topic `reading-maps`.)

**Model** (`MapSheet.ts`, maths in `mapMaths.ts`). A painted topo card (land, lake, faint contours, the scale in the
corner, two pins and the straight line between them) on top of scale-calculations' `ScaleLines` (imported
read-only): the card's inch IS the line's inch, so the pin line drops straight onto the `map, in` row; the rows
below read the same position as `ground, in` and `ground, mi / ft` (one length, every unit). `MapLines` = card +
lines; `Ruler` (inch ruler with 1/8 marks or cm ruler with mm, shifted starts), `Bar` (bar scale, labels at the ends
or a split extension left of 0), `Strips` (one road at several 1 : n), `Range` (a zoomed ruler: reading, band of
half a unit either way, candidates). Every block checks its layout and throws; the page draws through tryBlock.
Colours: amber = map lengths, teal = ground lengths, lime = the answer, lavender = focus, red = wrong.

## The five parts
1. **The question**: Alaska map, 1 : 63,360, trailhead -> lake = 2.5 in. Cards 158,400 ft (inches called feet:
   assigns-mixed-units), 2.5 mi, 30 mi (skips the / 12: omits-middle-conversion-factor) + how sure.
2. **Worked example** (same map): read the scale (same unit, the reference pair glows) -> multiply (2.5 x 63,360 =
   158,400 in, the drop stops at the ground-inch row) -> pick a sensible unit (/ 12, / 5,280: 2.5 mi on the third row)
   -> the shortcut (63,360 in = 1 mi, so 1 : 63,360 = 1 in = 1 mi). Why: "a mile is 63,360 inches" / "63,360 feet"
   (mixed units) / "only centimeters" (same-unit-scale-depends-on-unit).
3. **Your turn**: 1 : 24,000 topo, 3.5 in, faded: scale given; kid types 84,000 in (72,000 = whole part, 8,400 /
   840,000 = wrong power of ten), 7,000 ft (84,000 = relabel, 15.9 = omits / 12, 1,008,000 = reversed), then sizes it
   against a mile (about 1.3 mi; "about 16 mi" = omits / 12). Callback to the card.
4. **Prove it**: Jo puts a 6,000 ft trail on the 1 : 24,000 map as 6,000 / 24,000 = 0.25 in (feet not converted).
   Judge, then a because-chain: 0.25 in is too short (feet vs inches: the claim is struck on the map row and the
   board) / 6,000 ft = 72,000 in (x 12, drop to the ground-inch row) / so 3 in on the map (/ 24,000, the pin line
   appears). Distractors: "multiply by 24,000" (scale-factor-wrong-operation), "units don't matter"
   (mixed-unit-scale-not-converted).
5. **Practice**: all 18 sub-goals in order, then mixed. 32 of 36 families draw a picture (MapLines, Ruler, Bar,
   Strips, Range); the rest (choose a scale, slips, reporting) get the big slate. The solve replays on the picture.

## Sub-goal -> families (plan.ts)
| sub-goal | families |
|---|---|
| verbal-scale-meaning | verbalTimes, verbalMeaning (incl. the 1 in = 1 mi contrast) |
| scale-invariance | ratioTable (one pair given, 0 -> 0), zeroPair (proportional vs additive vs offset table) |
| bar-scale | barCount (count spaces, not marks), barExt (extension left of 0) |
| ratio-scale-same-unit | rfUnit, rfJudge, whyMile |
| verbal-scale-calc | verbalCalc (halves, fourths, tenths of a cm), verbalMixed (mixed-number answer) |
| decompose-large-multiplier | decompose, splitPick |
| ratio-scale-calc | rfCalc, rfUnit (the answer stays in the map unit), decompose |
| metric-route | metricRoute (cm -> m -> km), measureKm |
| customary-route | customaryFt, customaryMi (1 : 63,360 exact; 1 : 24,000 exact or to the hundredth), whyMile |
| ruler-subdivisions | rulerInch (quarters with eighth marks, shifted starts), rulerMm |
| measure-then-calc | measureCalc (inch ruler, verbal or 1 : 63,360), measureKm (cm ruler, 1 : n) |
| map-from-ground | mapFromVerbal, mapFromRf (convert to cm first), whichWay |
| compare-denominators | largerScale (incl. coverage vs scale), sameRoad |
| detail-vs-information | enlarge, enlargeScale |
| reading-as-range | rangePossible, rangeEdge |
| error-propagation | errorScale, errorCompare |
| report-precision | reportRound, reportClaim |
| choose-scale | chooseScale (hike vs road trip on 7.5 x 10 in), fitLength |

Every classified slip carries its catalogue id (items.ts MC table; the test checks them against
misconceptions.json). No runtime change was needed. The walk blocks Vite's HMR client.
