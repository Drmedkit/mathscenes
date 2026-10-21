# Read a map: map key, scale, and estimating distance (primary.geometry.read-map-scale-legend-distance, grade 7)

**Concept.** Reading a real map is three moves: the **key** tells you which symbol is the place and that you
measure from its location point (the center; a symbol's size is not the place's size, an area outline is to scale);
the **scale bar** is a number line whose equal intervals each represent the same real distance everywhere on the map;
and you measure **along the path you travel** (route) or **straight** (as the crow flies), never mixing the two. A bar
laid along a path, part by part, gives the distance and is also the benchmark for estimating by eye. Checking:
same-distance evidence, a size benchmark, a tolerance, and a scale that magnifies every map slip.
Sibling `map-scale` owns ratio scales (1:63,360) and the computing; this topic stays with reading a real-looking map.

**Model: MapSheet** (`MapSheet.ts`, maths and layout in `mapMaths.ts`). A calm painted sheet: the field (land, a
lake and a forest as washes, roads as crisp lines because they get measured, place symbols with an ink location
point), the key column, and a strip with the scale bar or a verbal scale. Steps `paper land roads places key bar`.
Overlays by id: `route` (lavender glow), `straight` (dashed), `copies` (copies of one bar interval or a whole bar laid
along a path, joints and subdivision ticks; partial last copy), `ruler` (to scale, any direction, start at 0 or a
whole mark, a lime mark at a reading), `leg`/`tag` (values beside a segment / a point), `ring`, `brace`, `strip`
(paper strip on a big bar, incl. the divided section left of 0), and a zoom (the enlarged map, bar grows too).
`layoutMap` places every place name and value so no label sits on a line, touches a symbol or another label, or
leaves the field; the block throws on any problem, generators retry (`mapGen.compose`, 8 symmetries). `Evidence.ts`
paints the evidence (road sign, trip meter, note) and the half-mile number line (pins, tolerance band, gap brace).
Roles: amber = map lengths (in, cm), teal = real distances (mi, km), lime = answer, lavender = path measured, red = wrong.

## The five parts (one map, `lessonMap.ts`: 1 in represents 2 mi)
1. **The question**: Maya bikes Millbrook → Lake Camp by road (highway east 4 in, road north 3 in). Cards 14 mi,
   10 mi (straight across the lake: straight-line-for-route), 7 mi (intervals counted as miles: subdivision-read-as-
   whole-unit) + how sure. The route glows; no copies, no numbers.
2. **Worked example**, four steps: Find the places (key rings, symbol rings, location points glow; `center → center`)
   → Read the scale bar (intervals ring one by one; `1 in → 2 mi`) → Lay the bar along the road (4 copies on the
   highway `4 × 2 = 8 mi`, 3 north `3 × 2 = 6 mi`, `8 + 6 = 14 mi`) → Road or straight line (dashed line across the
   lake, 5 copies, `line: 5 × 2 = 10 mi`). Why: right / "highway drawn wider counts more" (symbol-appearance) /
   "roads use a different scale" (different-segments-different-scale).
3. **Your turn**: Lake Camp → Pinecrest, faded from the end: places and bar given; copies (3½) are laid, the kid types
   7 mi (8 / 6 = partial-span-fixed-rounding, 3½ = subdivision); then picks the straight line 5 mi (2½ = intervals
   as miles). Callback to the card.
4. **Prove it**: Sam: "the bar ends at 6, so each interval is 6 mi; the trail is 5½ intervals: 33 mi". Judge, then the
   because-chain: each interval is 2 mi (bar is a number line; intervals ring; Sam's line struck) / the trail is 5½
   intervals (copies along the trail) / 5½ × 2 = 11 mi (every interval represents the same distance; tag, strike).
   Distractor chips: scale-bar-total-as-one-interval, counts-points-not-intervals.
5. **Practice**: all 18 sub-goals in topic order, then mixed; every item has a map (or number line) picture, the solve
   replays overlays s0, s1… and writes the answer line.

## Sub-goal → families (plan.ts), 36 families
| sub-goal | families |
|---|---|
| legend-locate | keyLookup (symbol/line/place), symbolSize (dot not to scale; what is to scale), measurePoint (edge vs center) |
| uniform-scale | sameEverywhere (1 in and k in on one map), biggerMap (zoom ×2: enlargement, "represents" vs "equals") |
| scale-bar-read | barInterval (all labels or ends only), barPoint (unlabeled mark) |
| straight-vs-route | whichDistance (drive/hike vs drone/crow), compareDist (bent or straight road) |
| bar-iterate | layBar (whole-bar copies; dual mi/km bar), countIntervals (interval copies, 1–2 legs) |
| bar-fraction-intervals | halfBar (½ / ¼ leftover), leftSub (divided section left of 0, paper strip) |
| ruler-map-measure | rulerRead (in quarters / cm halves, any direction), shiftedRuler (start at 1–3) |
| ruler-round | roundRuler (nearest ¼ in), roundCm (nearest ½ cm, mm ticks) |
| unit-scale-whole | unitScale (ruler + verbal scale, mi and km), unitPick (which unit) |
| bar-to-unit-scale | barToUnit (ruler under a friendly bar), halfSections (½-inch / ½-cm sections) |
| unit-scale-fraction | fracScale (quarters / halves × N), roundFirst (round now or later) |
| estimate-with-bar | estimateRange (range vs exact), benchmarkName (named benchmark vs guess) |
| route-length | routeSum (2–4 labeled parts × N), routeBar (winding road, interval copies) |
| select-evidence | pickEvidence (trip meter / GPS vs re-measure vs other distance type), whichDistance |
| benchmark-check | plausible (trip context, ×10 slips), whichReasonable (city-block benchmark) |
| error-scaling | errorSize (¼-in slip × N), whichMapWorse (two scales) |
| tolerance-agreement | agree (number line, within tolerance?), gapRead (read the gap) |
| diagnose-discrepancy | findError (endpoint, section, additive, unit, bar ×10, zero point, none), fixIt |

Every classified slip carries a catalogue id (`items.ts` MC table, checked against misconceptions.json in the test).
No runtime change was needed.
