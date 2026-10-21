// plan.ts: practice walks through every sub-goal of primary.geometry.read-map-scale-legend-distance, in topic JSON order.
// Each sub-goal names the families that practise it (items.ts); a family can serve more than one sub-goal.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'legend-locate', title: 'Read the map key', families: ['keyLookup', 'symbolSize', 'measurePoint'] },
  { id: 'uniform-scale', title: 'One scale for the whole map', families: ['sameEverywhere', 'biggerMap'] },
  { id: 'scale-bar-read', title: 'Read the scale bar', families: ['barInterval', 'barPoint'] },
  { id: 'straight-vs-route', title: 'By road or in a straight line', families: ['whichDistance', 'compareDist'] },
  { id: 'bar-iterate', title: 'Lay the bar along', families: ['layBar', 'countIntervals'] },
  { id: 'bar-fraction-intervals', title: 'Parts of an interval', families: ['halfBar', 'leftSub'] },
  { id: 'ruler-map-measure', title: 'Measure with a ruler', families: ['rulerRead', 'shiftedRuler'] },
  { id: 'ruler-round', title: 'Round to the nearest mark', families: ['roundRuler', 'roundCm'] },
  { id: 'unit-scale-whole', title: '1 inch represents N miles', families: ['unitScale', 'unitPick'] },
  { id: 'bar-to-unit-scale', title: 'What one inch stands for', families: ['barToUnit', 'halfSections'] },
  { id: 'unit-scale-fraction', title: 'Fractions of an inch', families: ['fracScale', 'roundFirst'] },
  { id: 'estimate-with-bar', title: 'Estimate by eye', families: ['estimateRange', 'benchmarkName'] },
  { id: 'route-length', title: 'The length of a route', families: ['routeSum', 'routeBar'] },
  { id: 'select-evidence', title: 'Choose a fair check', families: ['pickEvidence', 'whichDistance'] },
  { id: 'benchmark-check', title: 'Does the answer make sense?', families: ['plausible', 'whichReasonable'] },
  { id: 'error-scaling', title: 'Small slips, big errors', families: ['errorSize', 'whichMapWorse'] },
  { id: 'tolerance-agreement', title: 'Close enough to agree?', families: ['agree', 'gapRead'] },
  { id: 'diagnose-discrepancy', title: 'Find and fix the mistake', families: ['findError', 'fixIt'] },
];
