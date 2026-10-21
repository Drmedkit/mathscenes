// plan.ts: the practice walks through every sub-goal of
// primary.data.judge-sample-representativeness-and-limit-conclusions, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'name-population', title: 'Name the population', families: ['namePop', 'popOrSample'] },
  { id: 'sample-vs-population', title: 'The group studied vs. the population', families: ['matchKind', 'whoGave'] },
  { id: 'nonresponse-bias', title: 'Missing for a reason?', families: ['missingWhy', 'missingWay'] },
  { id: 'selection-bias', title: 'Who is left out or over-included', families: ['leftOut', 'biasWay'] },
  { id: 'generalize-scope', title: 'Which group the claim may cover', families: ['scope', 'complete'] },
  { id: 'integrate-report', title: 'Fix a claim and justify it', families: ['revise', 'audit'] },
];
