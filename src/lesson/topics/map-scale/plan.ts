// plan.ts: practice walks through every sub-goal of primary.ratios.use-map-scale, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'verbal-scale-meaning', title: 'What 1 in = 10 mi means', families: ['verbalTimes', 'verbalMeaning'] },
  { id: 'scale-invariance', title: 'One factor for every pair', families: ['ratioTable', 'zeroPair'] },
  { id: 'bar-scale', title: 'A bar scale is a ruler in miles', families: ['barCount', 'barExt'] },
  { id: 'ratio-scale-same-unit', title: '1 : n uses one unit on both sides', families: ['rfUnit', 'rfJudge', 'whyMile'] },
  { id: 'verbal-scale-calc', title: 'Part of an inch on the map', families: ['verbalCalc', 'verbalMixed'] },
  { id: 'decompose-large-multiplier', title: 'Times 24,000 without a calculator', families: ['decompose', 'splitPick'] },
  { id: 'ratio-scale-calc', title: 'Map to ground with 1 : n', families: ['rfCalc', 'rfUnit', 'decompose'] },
  { id: 'metric-route', title: 'Then centimeters to meters and kilometers', families: ['metricRoute', 'measureKm'] },
  { id: 'customary-route', title: 'Then inches to feet and miles', families: ['customaryFt', 'customaryMi', 'whyMile'] },
  { id: 'ruler-subdivisions', title: 'Read a ruler to the quarter inch or millimeter', families: ['rulerInch', 'rulerMm'] },
  { id: 'measure-then-calc', title: 'Measure, then scale', families: ['measureCalc', 'measureKm'] },
  { id: 'map-from-ground', title: 'Ground to map', families: ['mapFromVerbal', 'mapFromRf', 'whichWay'] },
  { id: 'compare-denominators', title: 'Smaller denominator, larger scale', families: ['largerScale', 'sameRoad'] },
  { id: 'detail-vs-information', title: 'Bigger is not more detailed', families: ['enlarge', 'enlargeScale'] },
  { id: 'reading-as-range', title: 'A reading is a range', families: ['rangePossible', 'rangeEdge'] },
  { id: 'error-propagation', title: 'A slip on the map is bigger on the ground', families: ['errorScale', 'errorCompare'] },
  { id: 'report-precision', title: 'Report only the digits you trust', families: ['reportRound', 'reportClaim'] },
  { id: 'choose-scale', title: 'Choose a scale for the trip', families: ['chooseScale', 'fitLength'] },
];
