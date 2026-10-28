// plan.ts: practice walks through every sub-goal of secondary-t6-08-solving-systems-of-equations-algebra-i, in topic
// JSON order, each with the families that practise it (items.ts; a family gets the sub-goal id and uses its cases).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'check-pair-both', title: 'Check a pair in both equations', families: ['pairCheck', 'whichPair'] },
  { id: 'intersection-common-solution', title: 'The crossing is the solution', families: ['readCross', 'markedPoint'] },
  { id: 'constraints-in-context', title: 'Both conditions at once, in context', families: ['ctxMeaning', 'ctxRead'] },
  { id: 'bridge-graph-line-forms', title: 'Graph a line from either form', families: ['siMatch', 'stdIntercepts', 'stdSlope'] },
  { id: 'bridge-horizontal-vertical', title: 'Lines x = a and y = b', families: ['hvWhich', 'hvCross', 'hvSlope'] },
  { id: 'bridge-rewrite-slope-intercept', title: 'Rewrite ax + by = c as y = mx + b', families: ['toSI', 'stdSlope'] },
  { id: 'solve-by-graphing', title: 'Solve by graphing: estimate or exact', families: ['readCross', 'estimateExact', 'roundedFails'] },
  { id: 'graph-with-technology', title: 'Use a graphing tool', families: ['techExact', 'techWindow'] },
  { id: 'substitute-isolated', title: 'Substitute an isolated letter', families: ['subStep', 'subSolve'] },
  { id: 'back-substitute-report', title: 'Back-substitute and report the pair', families: ['backSub', 'fullSub'] },
  { id: 'bridge-isolate-variable', title: 'Solve for y or for x', families: ['isolate', 'toSI'] },
  { id: 'isolate-then-substitute', title: 'Isolate, then substitute', families: ['isoSubSolve', 'whereSub'] },
  { id: 'replacement-preserves', title: 'Why replacing keeps the solutions', families: ['replaceSum', 'recover'] },
  { id: 'eliminate-ready', title: 'Eliminate: add or subtract', families: ['elimAdd', 'elimSub'] },
  { id: 'eliminate-scale-one', title: 'Eliminate after multiplying one equation', families: ['scaleRow', 'scaleSolve'] },
  { id: 'eliminate-scale-both', title: 'Eliminate after multiplying both', families: ['bothMult', 'anyMultiple', 'scaleSolve'] },
  { id: 'rational-coefficients', title: 'Clear fractions and decimals', families: ['clearFrac', 'ratSolve'] },
  { id: 'choose-method', title: 'Choose an efficient method', families: ['chooseMethod', 'methodsAgree'] },
  { id: 'graph-classify', title: 'One, none or infinitely many: the graph', families: ['classifyGraph', 'cannotTell', 'termsCI'] },
  { id: 'predict-by-slopes', title: 'Predict from slopes and intercepts', families: ['predictSlopes', 'hvSlope'] },
  { id: 'contradiction-no-solution', title: '0 = k: no solution', families: ['contraMeaning', 'contraSub'] },
  { id: 'identity-infinite-line', title: '0 = 0: a whole line of solutions', families: ['identityMeaning', 'identityMember'] },
  { id: 'connect-algebra-graph', title: 'Compare c₂ with k·c₁', families: ['scaledConst', 'sameLineForms'] },
  { id: 'inspect-structure', title: 'Solve or classify by inspection', families: ['inspect', 'chooseMethod'] },
  { id: 'prove-elimination', title: 'Prove elimination keeps the solutions', families: ['proofDir', 'proofReverse'] },
  { id: 'formulate-system', title: 'Write a system: words, graph, table', families: ['writeVerbal', 'fromGraph', 'fromTable', 'writeSolve'] },
  { id: 'judge-viability', title: 'Is the solution possible in context?', families: ['viable', 'planMeaning'] },
];
