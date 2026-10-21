// plan.ts: practice walks through every sub-goal of primary.ratios.combine-percentage-ratio-contexts, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'label-relationships', title: 'Ratio step, percent step, or neither', families: ['labelStep', 'findFixed', 'doubleTest'] },
  { id: 'name-whole-per-step', title: 'Name the whole (100%) of each step', families: ['nameWhole', 'wholeValue'] },
  { id: 'order-plan', title: 'Plan the steps in the order they need', families: ['orderPlan', 'firstStep', 'planThree'] },
  { id: 'share-total-in-ratio', title: 'Share a total in a ratio', families: ['share', 'shareFromPart', 'shareFraction'] },
  { id: 'chain-ratio-then-percent', title: 'Ratio step, then a percent of the share', families: ['ratioPercent', 'ratioPercentRest', 'rateThenPercent'] },
  { id: 'chain-percent-then-ratio', title: 'Percent step, then share the result', families: ['percentRatio', 'percentThenRate', 'percentRatioGrow'] },
  { id: 'successive-percents', title: 'Two percent changes on a changing whole', families: ['twoChanges', 'netChange', 'threeStep'] },
  { id: 'percent-multiplier', title: 'Each change as one multiplier', families: ['multiplier', 'chainProduct', 'multiplierToPercent'] },
  { id: 'rounding-policy', title: 'Round at the point the rule says', families: ['rounding', 'roundingTip'] },
  { id: 'audit-wrong-whole', title: 'Find the step with the wrong whole', families: ['audit', 'fixAudit'] },
  { id: 'check-against-relationships', title: 'Check against the ratio and the total', families: ['checkShares', 'checkPercent'] },
  { id: 'backward-check', title: 'Undo the chain, last step first', families: ['undo', 'undoPercentRatio'] },
  { id: 'estimate-reasonableness', title: 'Judge the answer with an estimate', families: ['estimate', 'direction'] },
  { id: 'transfer-new-context', title: 'Solve a new situation on your own', families: ['transfer', 'transferThree'] },
];
