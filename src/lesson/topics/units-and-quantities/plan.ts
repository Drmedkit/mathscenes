// plan.ts: practice walks through every sub-goal of secondary-t6-02-reasoning-with-units-and-quantities, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'quantity-number-unit', title: 'A quantity is a number, a unit and what is measured', families: ['attribute', 'sameAmount'] },
  { id: 'purpose-unit-choice', title: 'Choose a unit that fits the purpose', families: ['pickUnit', 'compareMixed'] },
  { id: 'derived-unit-meaning', title: 'Rates and square units as products and quotients', families: ['deriveUnit', 'productUnit'] },
  { id: 'graph-interval-scale', title: "Read a graph's scale", families: ['readTick', 'steeper'] },
  { id: 'graph-origin', title: 'Where a graph’s axis starts', families: ['cropBar', 'chooseStart'] },
  { id: 'exact-vs-measured', title: 'Exact or measured?', families: ['exactOrMeasured', 'whichExact'] },
  { id: 'measurement-interval', title: 'A rounded value stands for an interval', families: ['intervalRead', 'couldBe'] },
  { id: 'measurement-bounds-calculation', title: 'Calculate the bounds', families: ['boundsFrac', 'boundsDec'] },
  { id: 'digits-vs-accuracy', title: 'More digits are not more accurate', families: ['twoScales', 'whatDigitsSay'] },
  { id: 'unit-factor-orientation', title: 'Convert with a unit factor', families: ['convert', 'pickFactor'] },
  { id: 'common-unit-before-adding', title: 'Same unit before adding or comparing', families: ['addMixed', 'compareMixed'] },
  { id: 'unit-algebra', title: 'Units multiply, divide and cancel', families: ['unitResult', 'rateTime'] },
  { id: 'compound-rate-conversion', title: 'Convert both units of a rate', families: ['rateConvert', 'fracRate'] },
  { id: 'powered-unit-conversion', title: 'Square and cube the factor', families: ['areaConvert', 'powerFactor'] },
  { id: 'temperature-affine-conversion', title: 'Temperature is not a unit factor', families: ['tempReading', 'tempChange'] },
  { id: 'multistep-unit-planning', title: 'Plan and check with units', families: ['tripCost', 'avgSpeed', 'formulaUnits'] },
  { id: 'range-through-exact-scaling', title: 'Carry a range through exact scaling', families: ['scaleRange', 'rangePair'] },
  { id: 'justified-reporting-precision', title: 'Report a justified precision', families: ['reportPick', 'purposeRound'] },
  { id: 'model-scale-powers', title: 'Scale: k for lengths, k² for areas, k³ for volumes', families: ['mapArea'] },
  { id: 'dimension-check-diagnose-repair', title: 'Diagnose and repair a formula', families: ['dimCheck', 'repair', 'mismatchKind'] },
  { id: 'dimension-check-limits', title: 'Units check out is not proof', families: ['consistentWrong'] },
  { id: 'false-precision-critique', title: 'Spot false precision', families: ['critique', 'exactMean'] },
  { id: 'model-audit', title: 'Audit a model', families: ['audit'] },
];
