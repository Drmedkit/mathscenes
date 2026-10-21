// plan.ts: practice walks through every sub-goal of primary.ratios.scale-introduction, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'corresponding-lengths', title: 'Match length with length', families: ['match', 'pairUp'] },
  { id: 'times-as-long-same-unit', title: 'How many times as long?', families: ['timesAs', 'timesSay'] },
  { id: 'one-factor-all-lengths', title: 'One factor for every length', families: ['scaleCheck', 'toScale'] },
  { id: 'common-unit-first', title: 'One unit before comparing', families: ['sameUnit', 'convertFirst'] },
  { id: 'read-ratio-scale', title: 'Read a scale 1 : n', families: ['readScale', 'whichPart'] },
  { id: 'write-ratio-scale', title: 'Write a scale 1 : n', families: ['writeScale'] },
  { id: 'read-unit-legend', title: 'Read a legend “1 in represents 10 ft”', families: ['legendMeaning', 'legendWrite'] },
  { id: 'legend-to-ratio', title: 'Legend to 1 : n and back', families: ['legendToRatio', 'ratioToLegend'] },
  { id: 'factor-vs-length', title: 'The scale is a factor, not a length', families: ['whatIsN', 'useFactor'] },
  { id: 'unit-invariance', title: 'Same scale in any unit', families: ['unitSwap'] },
  { id: 'factor-direction', title: 'n one way, 1/n the other', families: ['direction'] },
  { id: 'enlargement-scales', title: 'Enlargements n : 1 and 1 : 1', families: ['enlarge'] },
  { id: 'compare-scales', title: 'Bigger n, smaller drawing', families: ['compareScales'] },
  { id: 'rate-vs-factor', title: 'A legend’s rate vs the factor', families: ['rateFactor', 'rateOrFactor'] },
  { id: 'critique-scale-claims', title: 'Correct a scale claim', families: ['critique'] },
];
