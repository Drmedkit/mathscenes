// plan.ts: practice walks through every sub-goal of secondary-t7-12-piecewise-and-step-functions, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'read-function-notation', title: 'Read and evaluate f(a)', families: ['evalOne', 'readPoint'] },
  { id: 'pick-piece', title: 'Pick the piece for an input', families: ['whichRule', 'whichInput'] },
  { id: 'boundary-ownership', title: 'Who owns a breakpoint', families: ['ownerAtBreak', 'nearBreak'] },
  { id: 'one-function-many-rules', title: 'Several rules, one function', families: ['isFunction', 'manyToOne'] },
  { id: 'step-as-constant-pieces', title: 'Step functions: constant pieces', families: ['isStep', 'stepRead'] },
  { id: 'evaluate-interior', title: 'Evaluate inside a piece', families: ['evalPiece', 'evalBoth'] },
  { id: 'evaluate-boundary-domain', title: 'Evaluate at a breakpoint, or undefined', families: ['evalBreak', 'isolatedPoint'] },
  { id: 'endpoint-dots', title: 'Open and filled dots', families: ['dotFill', 'joinDot', 'readOpen'] },
  { id: 'restrict-branch-graph', title: 'Graph one piece over its interval', families: ['pieceGraph', 'segEnds'] },
  { id: 'assemble-piecewise-graph', title: 'Graph the whole function', families: ['wholeGraph', 'graphPoints'] },
  { id: 'threshold-language', title: 'Threshold words to conditions', families: ['phraseCond', 'twoThreshold'] },
  { id: 'step-graph-context', title: 'Per started unit: the staircase', families: ['startedCost', 'startedGraph'] },
  { id: 'completed-unit-steps', title: 'Per completed unit', families: ['completedPay', 'whichWay'] },
  { id: 'greatest-integer-extension', title: 'The greatest integer function', families: ['floorEval', 'floorSolve'] },
  { id: 'intervals-from-graph', title: 'Conditions from a graph', families: ['condFromGraph', 'joinOwner'] },
  { id: 'write-from-graph', title: 'Write the rule from a graph', families: ['ruleFromGraph', 'pieceLine'] },
  { id: 'context-model', title: 'Model a tiered price', families: ['tierCost', 'tierRule'] },
  { id: 'count-domain', title: 'Count or measure: the domain', families: ['domainKind', 'countGraph'] },
  { id: 'coverage-audit', title: 'Does it cover the domain?', families: ['findGap', 'gapFix'] },
  { id: 'overlap-audit', title: 'Overlaps that agree or clash', families: ['overlapOk', 'overlapInput'] },
  { id: 'repair-endpoint-errors', title: 'Find and fix graph mistakes', families: ['findError', 'fixDot'] },
  { id: 'threshold-decision-context', title: 'At the threshold: the jump', families: ['jumpMeaning', 'atThreshold'] },
  { id: 'nonlinear-piece-graphs', title: 'Curved pieces: evaluate and solve', families: ['nlEval', 'nlSolve'] },
  { id: 'nonlinear-piecewise-key-features', title: 'Key features of curved pieces', families: ['nlRange', 'nlFeature'] },
];
