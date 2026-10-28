// items.ts: the practice families of "Counting: permutations and combinations" (secondary-t7-16), one map for the
// runtime. Families live in famA (stage 1), famB (stage 2) and famC (stage 3); shared makers in common.ts. Pure: no DOM.
import type { Gen } from './common';
import { classify, classifyTests, listCount, missingOutcome, reuseCount, reuseTest, sameCup, scoopList, swapList, swapTest } from './famA';
import { atLeastOne, chooseOrder, codeLengths, codeVsNumeral, combEval, combPick, evenDistinct, factorialEval, factorialMeaning, groupsDivide, handshakes, lineUp, menu, methodPick, mixedCount, officers, orAnd, overcountFactor, permCancel, permFormula, pinCount, probBag, probCode, probComm, productMissing, repeatDigit, restrictFirst, symCompare, symShortcut, twoGroups } from './famB';
import { auditImpossible, divisibleOr, doubleCount, listComplete, listVerify, repairCount, skippedCase, teamsHalve, timesCounted, uniformCheck, vennCount, verifyMethod } from './famC';

export type { CItem, Pic } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  listCount, missingOutcome, swapTest, swapList, reuseTest, reuseCount, scoopList, sameCup, classify, classifyTests,
  menu, productMissing, orAnd, codeLengths, pinCount, codeVsNumeral, officers, lineUp, factorialEval, factorialMeaning,
  permFormula, permCancel, groupsDivide, handshakes, overcountFactor, combEval, combPick, symShortcut, symCompare,
  twoGroups, chooseOrder, restrictFirst, evenDistinct, atLeastOne, repeatDigit, mixedCount, methodPick,
  probComm, probBag, probCode,
  auditImpossible, repairCount, doubleCount, teamsHalve, vennCount, divisibleOr, uniformCheck, timesCounted,
  listComplete, skippedCase, verifyMethod, listVerify,
};
export const FAMILY_NAMES: Record<string, string> = {
  listCount: 'Count from a tree', missingOutcome: 'The missing outcome', swapTest: 'The swap test', swapList: 'Ordered or not: count them',
  reuseTest: 'The reuse test', reuseCount: 'With or without putting back', scoopList: 'Repeats allowed, no order', sameCup: 'The same selection?',
  classify: 'What kind of count?', classifyTests: 'Swap and reuse', menu: 'Multiply the stages', productMissing: 'The missing stage',
  orAnd: 'Or, or and?', codeLengths: 'Add the cases', pinCount: 'Codes with repeats', codeVsNumeral: 'Codes or numbers?',
  officers: 'Fill the places in order', lineUp: 'Everyone in a row', factorialEval: 'Factorials', factorialMeaning: 'What n! counts',
  permFormula: 'The permutation formula', permCancel: 'Cancel the tail', groupsDivide: 'Ordered count ÷ r!', handshakes: 'Handshakes and games',
  overcountFactor: 'Orders of one group', combEval: 'The combination formula', combPick: 'Which formula is C(n, r)?', symShortcut: 'Count the ones left out',
  symCompare: 'C(n, r) and C(n, n − r)', twoGroups: 'Choose from two groups', chooseOrder: 'Choose, then arrange', restrictFirst: 'Restricted place first',
  evenDistinct: 'Split into cases', atLeastOne: 'At least one', repeatDigit: 'At least one repeat', mixedCount: 'Choose the method',
  methodPick: 'Which expression?', probComm: 'Probability of a committee', probBag: 'Probability from a bag', probCode: 'Probability of a code',
  auditImpossible: 'Find a forbidden outcome', repairCount: 'Repair the count', doubleCount: 'Counted twice', teamsHalve: 'Two teams, no names',
  vennCount: 'Subtract the overlap', divisibleOr: 'Divisible by one or the other', uniformCheck: 'Does ÷ r! work?', timesCounted: 'How often in the list?',
  listComplete: 'Is the list complete?', skippedCase: 'A skipped case', verifyMethod: 'What proves a count?', listVerify: 'Check by listing',
};
