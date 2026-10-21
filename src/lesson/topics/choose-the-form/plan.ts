// plan.ts: practice walks through every sub-goal of primary.fractions.choose-calculation-form-fractions, in topic JSON order.
// Each sub-goal has a short kid-friendly title and the families that practise it (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'benchmark-three-forms', title: 'One amount, three names', families: ['threeNames', 'sameAmount'] },
  { id: 'decimal-percent-zeros', title: 'Decimals and percents with zeros', families: ['decPct', 'centsDollars'] },
  { id: 'over-100-percent', title: 'More than 100%', families: ['over100', 'overChoice'] },
  { id: 'same-whole-check', title: 'Check the whole first', families: ['sameWhole', 'moreHow'] },
  { id: 'context-language', title: 'The same amount in everyday words', families: ['contextMatch', 'sameAmount'] },
  { id: 'fraction-form-benchmark', title: 'Benchmark percents as fractions', families: ['fractionRoute', 'whichFraction', 'routeEqual'] },
  { id: 'decimal-multiplier-choice', title: 'Pick a route from the numbers', families: ['routeCompute', 'routePick', 'routeEqual'] },
  { id: 'common-form-compare', title: 'One form to compare', families: ['orderForms', 'compareTwo'] },
  { id: 'reporting-form', title: 'The form that fits the context', families: ['reportForm', 'eitherForm'] },
  { id: 'calc-vs-report', title: 'Calculate one way, report another', families: ['reportAs', 'reportPick'] },
  { id: 'exact-vs-rounded', title: 'Exact or rounded?', families: ['eqOrApprox', 'calcDisplay'] },
  { id: 'rounding-effect', title: 'What rounding costs', families: ['roundingGap', 'keepExact'] },
  { id: 'accuracy-tolerance', title: 'Close enough?', families: ['tolerance', 'nearestCent'] },
  { id: 'convenience-compare', title: 'The shorter route', families: ['fasterRoute', 'fractionRoute'] },
  { id: 'benchmark-check', title: 'Check with a benchmark', families: ['checkResult', 'estimateFirst'] },
  { id: 'multistep-choice', title: 'Forms across two steps', families: ['multiStep', 'keepExact'] },
];
