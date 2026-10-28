// items.ts: the practice families of "Using probability to make decisions" (secondary-t8-20), one map for the
// runtime. Families live in famA (stage 1: structure, net payoff, distributions, fair selection), famB (stage 2: common
// basis, expected net payoff, fair price, EV rule, assumptions, sensitivity, insurance and warranty spreadsheets) and
// famC (stage 3: downside risk, SD, pooling, model uncertainty, preference, conditional recommendations). Pure: no DOM.
import type { Gen } from './common';
import { distComplete, distDie, dsBranches, dsWhich, fairJudge, fairProb, netInsure, netTicket } from './famA';
import { auditSource, auditWhich, basisNet, basisPeriod, evInsureCost, evNet, evRoutes, fairPrice, fairWhich, planTotal, ruleCost, ruleGain, sensFill, sensSwitch, warrantyScen } from './famB';
import { muKind, muRange, poolTotal, poolWho, prefConstraint, prefWhy, recCondition, recPick, riskCompare, riskRead, sdCompute, sdDiversify, sdPick } from './famC';

export type { PItem, Pic } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  dsWhich, dsBranches, netTicket, netInsure, distDie, distComplete, fairJudge, fairProb,
  basisPeriod, basisNet, evNet, evRoutes, evInsureCost, fairPrice, fairWhich, ruleGain, ruleCost, auditSource, auditWhich,
  sensFill, sensSwitch, planTotal, warrantyScen,
  riskRead, riskCompare, sdCompute, sdPick, sdDiversify, poolTotal, poolWho, muKind, muRange, prefConstraint, prefWhy, recPick, recCondition,
};
export const FAMILY_NAMES: Record<string, string> = {
  dsWhich: 'Choice or chance?', dsBranches: 'The do-nothing branch', netTicket: 'Net payoff of a ticket', netInsure: 'Net payoff with insurance',
  distDie: 'Build the payoff distribution', distComplete: 'A complete distribution', fairJudge: 'Is the pick fair?', fairProb: 'Chance of being picked',
  basisPeriod: 'Same time period', basisNet: 'Net, not gross', evNet: 'Expected net payoff', evRoutes: 'Expected prize minus cost', evInsureCost: 'Expected cost of a policy',
  fairPrice: 'The fair price', fairWhich: 'Which game is fair?', ruleGain: 'Best game by EV', ruleCost: 'Cheapest policy by EV',
  auditSource: 'Where a probability comes from', auditWhich: 'The hidden assumption', sensFill: 'Scenario table', sensSwitch: 'Where the choice changes',
  planTotal: 'Health plan: total cost', warrantyScen: 'Warranty scenarios', riskRead: 'Worst case and chance of loss', riskCompare: 'Same EV, different risk',
  sdCompute: 'SD of a payoff', sdPick: 'Choose on EV and SD', sdDiversify: 'Splitting the stake', poolTotal: 'Expected total', poolWho: 'Pooling and its limits',
  muKind: 'Randomness or model uncertainty', muRange: 'EV over a range', prefConstraint: 'A loss limit', prefWhy: 'Why people choose differently',
  recPick: 'The best recommendation', recCondition: 'The changeover chance',
};
