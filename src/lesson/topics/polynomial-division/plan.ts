// plan.ts: practice walks through every sub-goal of secondary-t7-05-polynomial-division-long-and-synthetic, in topic
// JSON order, each with the families that practise it.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'pdqr-roles', title: 'P = D·Q + R: the four parts', families: ['roleName', 'rebuildP'] },
  { id: 'remainder-degree-bound', title: 'When a division is finished', families: ['stopCheck', 'remCandidates', 'smallDividend'] },
  { id: 'reverse-area-model', title: 'The missing side of a box', families: ['areaSide', 'areaSide3'] },
  { id: 'rational-form-restriction', title: 'Where P/D has no value', families: ['excluded', 'restrictionPick'] },
  { id: 'q-plus-r-over-d', title: 'Write P/D as Q + R/D', families: ['rewriteQR', 'qrFill'] },
  { id: 'zero-remainder-factor', title: 'Remainder 0 means a factor', families: ['isFactor', 'factorPick'] },
  { id: 'ld-layout', title: 'Set up long division', families: ['layoutRow', 'placeholderCount'] },
  { id: 'ld-next-term', title: 'The next quotient term', families: ['monoDivide', 'nextTerm'] },
  { id: 'ld-residual-update', title: 'Subtract the whole product', families: ['subtractRow', 'updateChoice'] },
  { id: 'ld-iterate-stop', title: 'Divide to the end', families: ['ldFull', 'ldRemainder', 'ldQuotientPick'] },
  { id: 'ld-nonmonic-linear', title: 'Divisors like 2x + 1', families: ['nonmonicQ', 'nonmonicFrac'] },
  { id: 'ld-quadratic-divisor', title: 'Quadratic divisors', families: ['quadDivR', 'quadDivQ'] },
  { id: 'sd-scope', title: 'When synthetic division works', families: ['sdApplies', 'sdC'] },
  { id: 'sd-coefficient-row', title: 'The coefficient row', families: ['coefRow', 'rowBack'] },
  { id: 'sd-recurrence', title: 'Bring down, multiply, add', families: ['sdNext', 'sdLast'] },
  { id: 'sd-decode', title: 'Read the bottom row', families: ['sdDecodeQ', 'sdDecodeCoef'] },
  { id: 'sd-link-long-division', title: 'Synthetic is short long division', families: ['linkBottom', 'linkWhyAdd'] },
  { id: 'inspection-rewrite', title: 'Divide by inspection', families: ['inspectLinear', 'inspectSquare'] },
  { id: 'method-select', title: 'Choose a method', families: ['methodPick', 'methodDo', 'ldRemainder'] },
  { id: 'verify-expand', title: 'Check by expanding', families: ['verifyClaim', 'firstMismatch'] },
  { id: 'verify-remainder-bound', title: 'True but not finished', families: ['finishedPick', 'smallDividend'] },
  { id: 'numeric-spot-check', title: 'Spot checks: evidence, not proof', families: ['spotValue', 'spotVerdict'] },
  { id: 'update-invariant', title: 'Why long division works', families: ['invariantStep', 'cycleCount'] },
  { id: 'domain-identity-contrast', title: 'The identity and the restriction', families: ['domainCheck', 'domainFix'] },
  { id: 'apply-known-factor', title: 'Factor with a known factor', families: ['factorFull', 'boxDims', 'quotientFirst'] },
];
