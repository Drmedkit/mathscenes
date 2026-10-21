// plan.ts: the practice walks through every sub-goal of primary.ratios.calculate-percentage-change, in topic JSON
// order (19 sub-goals, 28 families). Titles are short and kid-facing; the ids are the topic JSON subgoal ids.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'identify-base', title: 'The base is the amount before', families: ['base', 'whichFrac'] },
  { id: 'amount-of-change', title: 'Changed by, changed to', families: ['byTo', 'changeWord'] },
  { id: 'percent-of-original', title: 'The change as a percent of the base', families: ['benchPct'] },
  { id: 'absolute-vs-relative', title: 'Dollars more or percent more?', families: ['compare'] },
  { id: 'compute-percent-change', title: 'Percent change from any two amounts', families: ['pctChange', 'pctLabel'] },
  { id: 'apply-increase', title: 'Add a percent', families: ['twoStepUp'] },
  { id: 'apply-decrease', title: 'Take off a percent', families: ['twoStepDown'] },
  { id: 'change-multiplier', title: 'One multiplier: 1 + r or 1 − r', families: ['multPick', 'multNum'] },
  { id: 'over-100-percent', title: 'More than 100%', families: ['over100', 'over100Why'] },
  { id: 'choose-operation', title: 'Find the rate or apply it?', families: ['choose'] },
  { id: 'check-reasonableness', title: 'Check with an estimate', families: ['estimate', 'sanity'] },
  { id: 'round-results', title: 'Round at the end', families: ['round', 'exactOrNot'] },
  { id: 'successive-new-base', title: 'A second change, a new base', families: ['successive'] },
  { id: 'overall-change', title: 'The overall change', families: ['overall'] },
  { id: 'compose-multipliers', title: 'Two multipliers make one', families: ['compose'] },
  { id: 'multiplier-order', title: 'Does the order matter?', families: ['order'] },
  { id: 'justify-no-cancel', title: 'Up and down don’t cancel', families: ['undo', 'noCancelWhy'] },
  { id: 'same-base-adding', title: 'When percents add', families: ['sameBase'] },
  { id: 'percent-error', title: 'Percent error', families: ['pctError', 'closer'] },
];
