// plan.ts: practice walks through every sub-goal of secondary-t8-20-using-probability-for-decisions, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 's1-decision-structure', title: 'Choices and chance outcomes', families: ['dsWhich', 'dsBranches'] },
  { id: 's1-net-payoff', title: 'Net payoff of each outcome', families: ['netTicket', 'netInsure'] },
  { id: 's1-payoff-distribution', title: 'The net-payoff distribution', families: ['distDie', 'distComplete'] },
  { id: 's1-fair-random-decision', title: 'A fair random pick', families: ['fairJudge', 'fairProb'] },
  { id: 's2-common-basis', title: 'Compare on the same basis', families: ['basisPeriod', 'basisNet'] },
  { id: 's2-expected-net-payoff', title: 'Expected net payoff', families: ['evNet', 'evRoutes', 'evInsureCost'] },
  { id: 's2-fair-price', title: 'The fair price', families: ['fairPrice', 'fairWhich'] },
  { id: 's2-ev-decision-rule', title: 'Choose by expected value', families: ['ruleGain', 'ruleCost'] },
  { id: 's2-assumption-audit', title: 'The assumptions behind an EV', families: ['auditSource', 'auditWhich'] },
  { id: 's2-sensitivity', title: 'Scenario tables and the changeover', families: ['sensFill', 'sensSwitch'] },
  { id: 'insurance-warranty-spreadsheet', title: 'Insurance and warranty scenarios', families: ['planTotal', 'warrantyScen'] },
  { id: 's3-downside-risk', title: 'Downside risk', families: ['riskRead', 'riskCompare'] },
  { id: 's3-payoff-sd', title: 'SD of a payoff', families: ['sdCompute', 'sdPick', 'sdDiversify'] },
  { id: 's3-repetition-pooling', title: 'Repetition and pooling', families: ['poolTotal', 'poolWho'] },
  { id: 's3-model-uncertainty', title: 'Randomness vs model uncertainty', families: ['muKind', 'muRange'] },
  { id: 's3-risk-preference', title: 'Risk preference and limits', families: ['prefConstraint', 'prefWhy'] },
  { id: 's3-conditional-recommendation', title: 'A conditional recommendation', families: ['recPick', 'recCondition'] },
];
