// items.ts: the practice families of "Conditional probability and independence" (secondary-t7-17), one map for the
// runtime. Families live in famA (stage 1), famB (stage 2) and famC (stage 3); shared makers in common.ts. Pure: no DOM.
import type { Gen } from './common';
import { andDice, andList, diceCount, jarCond, notDice, notVenn, notationRead, notationWrite, orDice, orList, restrictDice, restrictTable, spinnerCond, tableFill, tableRead, treeCount, zeroFormula, zeroOrUndef } from './famA';
import { assocClaim, buildCell, buildCond, condDice, condNumbers, formulaDec, formulaVenn, indepModel, indepTable, multChoose, multCount, productForward, productTest, relCompute, relKind, replaceCond, replaceDecide, reverseClaim, reverseTable, tableCond, tableSwitch, treePath, twoDraws } from './famB';
import { addDice, addGiven, addTable, approxIndep, baseRateCompare, bayesMachine, bayesScreen, classifyList, classifyVenn, dotsTwoGroups, dotsUnusual, emptyEvent, emptyWhich, exclDep, exclDepWhy, exclWhich, exclYesNo, freeThrow, laterEvent, screenTable, secondTest, totalThree, totalTwo } from './famC';

export type { CItem, Pic } from './common';
export { MC } from './common';

export const GENERATORS: Record<string, Gen> = {
  diceCount, treeCount, andDice, andList, orDice, orList, notDice, notVenn, tableRead, tableFill, restrictDice, restrictTable,
  notationRead, notationWrite, spinnerCond, jarCond, zeroOrUndef, zeroFormula,
  condDice, condNumbers, tableCond, tableSwitch, buildCell, buildCond, relKind, relCompute, assocClaim, reverseTable, reverseClaim,
  formulaDec, formulaVenn, indepTable, indepModel, productTest, productForward, replaceCond, replaceDecide, twoDraws, treePath,
  multCount, multChoose,
  exclWhich, exclYesNo, addTable, addGiven, addDice, exclDep, exclDepWhy, classifyVenn, classifyList, emptyEvent, emptyWhich,
  dotsUnusual, dotsTwoGroups, approxIndep, screenTable, freeThrow, laterEvent, totalTwo, totalThree, bayesScreen, bayesMachine,
  baseRateCompare, secondTest,
};
export const FAMILY_NAMES: Record<string, string> = {
  diceCount: 'Read the dice grid', treeCount: 'Paths of a tree', andDice: 'A and B on two dice', andList: 'Which numbers are in both?',
  orDice: 'A or B on two dice', orList: 'List A or B once', notDice: 'Not A on two dice', notVenn: 'Outside the circle',
  tableRead: 'Cells and margins', tableFill: 'The missing count', restrictDice: 'What is still possible?', restrictTable: 'The new whole',
  notationRead: 'Read P(A | B)', notationWrite: 'Write P(A | B)', spinnerCond: 'Rescale the spinner', jarCond: 'Not that color',
  zeroOrUndef: 'Zero or undefined?', zeroFormula: 'Dividing by P(B) = 0',
  condDice: 'Count inside B', condNumbers: 'Given B, count A', tableCond: 'Conditional from a table', tableSwitch: 'A new condition, a new whole',
  buildCell: 'Sort the cards', buildCond: 'Build, then condition', relKind: 'Joint, marginal or conditional?', relCompute: 'Relative frequency',
  assocClaim: 'Compare the rows', reverseTable: 'Turn it around', reverseClaim: 'Which way round?',
  formulaDec: 'P(A and B) ÷ P(B)', formulaVenn: 'Conditional from a Venn diagram', indepTable: 'Independent? Use the table', indepModel: 'Independent? Do the math',
  productTest: 'The product test', productForward: 'Multiply independent events', replaceCond: 'The second draw', replaceDecide: 'Does putting back matter?',
  twoDraws: 'Both draws', treePath: 'Multiply along a path', multCount: 'P(A) × P(B | A)', multChoose: 'Which product?',
  exclWhich: 'Mutually exclusive pair', exclYesNo: 'Disjoint or not?', addTable: 'Or from a table', addGiven: 'The addition rule', addDice: 'Or on two dice',
  exclDep: 'Disjoint, so dependent', exclDepWhy: 'Why disjoint means dependent', classifyVenn: 'Classify from a Venn diagram', classifyList: 'Classify the pair',
  emptyEvent: 'The impossible event', emptyWhich: 'Both disjoint and independent', dotsUnusual: 'Is that sample unusual?', dotsTwoGroups: 'Two samples, one population',
  approxIndep: 'Approximately independent?', screenTable: 'Positive: what now?', freeThrow: 'The right comparison', laterEvent: 'Conditioning on a later draw',
  totalTwo: 'Add the paths', totalThree: 'Three machines', bayesScreen: 'Bayes on a tree', bayesMachine: 'Which machine?',
  baseRateCompare: 'The base rate matters', secondTest: 'A second test',
};
