# Reasoning with units (Algebra 1, lesson 2): design

Topic `secondary-t6-02-reasoning-with-units-and-quantities` (HSN-Q.A.1, A.3), 23 sub-goals, no `requires`.

## Concept
A quantity is a number, a unit and an attribute. Units are part of the quantity: they multiply, divide and cancel
like numbers, so a conversion is a multiplication by a unit factor that equals 1, turned so the unwanted unit
cancels. The same habit carries the measurement half of the topic: a recorded value stands for an interval
(half a step either side), an exact factor scales both ends, and a report keeps only the digits the whole range
agrees on.

## Models (topic folder)
- `Race.ts`: two lanes, a ruler in feet, a greyhound and a car with their speeds in their own units. `run` plays
  ONE second, so both speeds become ft per second on screen: the fair test of "which is faster".
- `Chain.ts`: a unit-factor chain in TeX with every unit a named part; matching top/bottom units are struck one pair
  at a time (pick colour), the units that are left glow in the answer colour. Hidden factors/results show "?".
- `Ruler.ts`: a zoomed ruler, subdivided finer than the recording, the rounding band [v − r/2, v + r/2) with a
  closed and an open end, a probe value, and an optional second row: the band carried through an exact factor.
- `Grid.ts`: one big square unit as n × n small ones (1 ft² = 12 × 12 in²), Jo's single row (the linear-factor
  slip) vs the full fill; optional room (12 × 10 ft) with one square foot zoomed; optional cube with layers.
- `Thermo.ts`: one thermometer read on a °C and a °F scale lined up by temperature (0 °C next to 32 °F): a reading
  needs the offset, a rise is the same stretch of tube and only scales by 9/5.
- kit `Plane` for graph scale / origin / audit items (bars are `shade` items).

## The five parts
1. **Question**: greyhound 44 ft/s vs car 40 mi/h, which is faster? Cards: the greyhound (44 > 40,
   `compares-numerals-without-units`), the car (right), can't tell (`labels-mean-different-dimensions`).
2. **Worked example** (4 steps): read the quantity (rings on the lanes, 44 ft / 1 s written) → seconds to hours
   (× 3,600 s / 1 h, s struck, 158,400 ft/h) → feet to miles (× 1 mi / 5,280 ft, ft struck, 30 mi/h) → compare
   30 < 40 and race one second (car 58.7 ft, dog 44 ft). Why? 3,600 s over 1 h (cancel) vs either way
   (`unit-factor-upside-down`) vs bigger on top (`scale-factor-wrong-operation`).
3. **Your turn**: 60 mi/h in ft/s; miles → feet given; the student picks the hour factor (1 h / 3,600 s; the flip and
   1 h / 60 min are distractors), types 88 (316,800 = `converts-one-unit-of-rate`), checks by "a mile a minute"
   (5,280 ÷ 60), the car races one second. Callback to the committed card.
4. **Prove it**: Jo: 120 ft² × 12 = 1,440 in². The room grid, one square foot zoomed; a because-chain: Jo's × 12 is
   one row → one ft² is 12 rows of 12 = 144 in² → 120 × 144 = 17,280 in². Distractor chips:
   `linear-factor-for-area`, `units-as-decoration`.
5. **Practice**: all 23 sub-goals in order, then mixed.

## Sub-goal → families (44 families)
| sub-goal | families |
|---|---|
| quantity-number-unit | attribute, sameAmount |
| purpose-unit-choice | pickUnit, compareMixed |
| derived-unit-meaning | deriveUnit, productUnit |
| graph-interval-scale | readTick, steeper |
| graph-origin | cropBar, chooseStart |
| exact-vs-measured | exactOrMeasured, whichExact |
| measurement-interval | intervalRead, couldBe |
| measurement-bounds-calculation | boundsFrac, boundsDec |
| digits-vs-accuracy | twoScales, whatDigitsSay |
| unit-factor-orientation | convert, pickFactor |
| common-unit-before-adding | addMixed, compareMixed |
| unit-algebra | unitResult, rateTime |
| compound-rate-conversion | rateConvert, fracRate |
| powered-unit-conversion | areaConvert, powerFactor |
| temperature-affine-conversion | tempReading, tempChange |
| multistep-unit-planning | tripCost, avgSpeed, formulaUnits |
| range-through-exact-scaling | scaleRange, rangePair |
| justified-reporting-precision | reportPick, purposeRound |
| model-scale-powers | mapArea |
| dimension-check-diagnose-repair | dimCheck, repair, mismatchKind |
| dimension-check-limits | consistentWrong |
| false-precision-critique | critique, exactMean |
| model-audit | audit |
