// items.ts: exercise families for "Systems of equations" (secondary-t6-08, Algebra 1, lesson 8), generated from
// templates, checked exactly, and every wrong answer a typical slip produces classified against the misconception
// catalogue (math-curriculum-essentials ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses that
// sub-goal's cases from the topic JSON. The families live in famA.ts (stage 1, the bridges, graphing, technology),
// famB.ts (substitution, elimination, method choice) and famC.ts (how many solutions, the proof, modelling, viability);
// shared makers in itemKit.ts (every choice list drops options that mean the same as the answer). Pure.
import type { FamilyId, SGen } from './itemKit';
import * as A from './famA';
import * as B from './famB';
import * as C from './famC';

export { MC, type SItem, type FamilyId } from './itemKit';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'pairCheck', name: 'Check both equations' },
  { id: 'whichPair', name: 'Which pair solves it?' },
  { id: 'readCross', name: 'Read the crossing' },
  { id: 'markedPoint', name: 'Which marked point?' },
  { id: 'ctxMeaning', name: 'What the crossing means' },
  { id: 'ctxRead', name: 'Both conditions at once' },
  { id: 'siMatch', name: 'Equation of a graphed line' },
  { id: 'stdIntercepts', name: 'Graph from the intercepts' },
  { id: 'stdSlope', name: 'Slope of ax + by = c' },
  { id: 'hvWhich', name: 'x = a and y = b' },
  { id: 'hvCross', name: 'Where x = a meets y = b' },
  { id: 'hvSlope', name: 'Slope 0 or undefined' },
  { id: 'toSI', name: 'Rewrite as y = mx + b' },
  { id: 'estimateExact', name: 'Estimate or exact?' },
  { id: 'roundedFails', name: 'Check a graph reading' },
  { id: 'techExact', name: 'What the tool shows' },
  { id: 'techWindow', name: 'Off the screen' },
  { id: 'subStep', name: 'Substitute in brackets' },
  { id: 'subSolve', name: 'Solve after substituting' },
  { id: 'backSub', name: 'Back-substitute' },
  { id: 'fullSub', name: 'Substitution start to finish' },
  { id: 'isolate', name: 'Get one letter alone' },
  { id: 'isoSubSolve', name: 'Isolate, then substitute' },
  { id: 'whereSub', name: 'Where does it go?' },
  { id: 'replaceSum', name: 'Replace by the sum' },
  { id: 'recover', name: 'Undo the replacement' },
  { id: 'elimAdd', name: 'Add to eliminate' },
  { id: 'elimSub', name: 'Subtract to eliminate' },
  { id: 'scaleRow', name: 'Multiply a whole equation' },
  { id: 'scaleSolve', name: 'Scale, then eliminate' },
  { id: 'bothMult', name: 'Two multipliers' },
  { id: 'anyMultiple', name: 'Any common multiple?' },
  { id: 'clearFrac', name: 'Clear the fractions' },
  { id: 'ratSolve', name: 'Fractions and decimals' },
  { id: 'chooseMethod', name: 'Pick the method' },
  { id: 'methodsAgree', name: 'Two methods, one answer' },
  { id: 'classifyGraph', name: 'One, none or infinitely many' },
  { id: 'cannotTell', name: 'Trust the picture?' },
  { id: 'termsCI', name: 'Consistent or inconsistent' },
  { id: 'predictSlopes', name: 'Predict from slopes' },
  { id: 'contraMeaning', name: 'When you get 0 = k' },
  { id: 'contraSub', name: 'A false statement' },
  { id: 'identityMeaning', name: 'When you get 0 = 0' },
  { id: 'identityMember', name: 'Which point is on it?' },
  { id: 'scaledConst', name: 'Compare c₂ with k·c₁' },
  { id: 'sameLineForms', name: 'The same line, another form' },
  { id: 'inspect', name: 'By inspection' },
  { id: 'proofDir', name: 'Both directions' },
  { id: 'proofReverse', name: 'The way back' },
  { id: 'writeVerbal', name: 'Words to a system' },
  { id: 'fromGraph', name: 'Graph to a system' },
  { id: 'fromTable', name: 'Table to a system' },
  { id: 'writeSolve', name: 'Model and solve' },
  { id: 'viable', name: 'Possible in the story?' },
  { id: 'planMeaning', name: 'Never, once or always' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export const GENERATORS: Record<FamilyId, SGen> = {
  pairCheck: A.pairCheck, whichPair: A.whichPair, readCross: A.readCross, markedPoint: A.markedPoint, ctxMeaning: A.ctxMeaning, ctxRead: A.ctxRead,
  siMatch: A.siMatch, stdIntercepts: A.stdIntercepts, stdSlope: A.stdSlope, hvWhich: A.hvWhich, hvCross: A.hvCross, hvSlope: A.hvSlope, toSI: A.toSI,
  estimateExact: A.estimateExact, roundedFails: A.roundedFails, techExact: A.techExact, techWindow: A.techWindow,
  subStep: B.subStep, subSolve: B.subSolve, backSub: B.backSub, fullSub: B.fullSub, isolate: B.isolate, isoSubSolve: B.isoSubSolve, whereSub: B.whereSub,
  replaceSum: B.replaceSum, recover: B.recover, elimAdd: B.elimAdd, elimSub: B.elimSub, scaleRow: B.scaleRow, scaleSolve: B.scaleSolve,
  bothMult: B.bothMult, anyMultiple: B.anyMultiple, clearFrac: B.clearFrac, ratSolve: B.ratSolve, chooseMethod: B.chooseMethod, methodsAgree: B.methodsAgree,
  classifyGraph: C.classifyGraph, cannotTell: C.cannotTell, termsCI: C.termsCI, predictSlopes: C.predictSlopes, contraMeaning: C.contraMeaning,
  contraSub: C.contraSub, identityMeaning: C.identityMeaning, identityMember: C.identityMember, scaledConst: C.scaledConst, sameLineForms: C.sameLineForms,
  inspect: C.inspect, proofDir: C.proofDir, proofReverse: C.proofReverse, writeVerbal: C.writeVerbal, fromGraph: C.fromGraph, fromTable: C.fromTable,
  writeSolve: C.writeSolve, viable: C.viable, planMeaning: C.planMeaning,
};
