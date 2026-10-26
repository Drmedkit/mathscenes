// plan.ts: practice walks through every sub-goal of secondary-t6-10-sequences-arithmetic, in topic JSON order.
// Every sub-goal has two or three families (items.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'common-difference', title: 'The common difference d', families: ['findD', 'consistent'] },
  { id: 'function-notation', title: 'Reading f(n) = v', families: ['fRead', 'fMeaning'] },
  { id: 'index-notation', title: 'Term number vs term value', families: ['termAt', 'neighbor'] },
  { id: 'discrete-linear-graph', title: 'Table and graph of separate points', families: ['graphRead', 'graphPick'] },
  { id: 'recursive-generate', title: 'Terms from a recursive rule', families: ['recNext', 'recTwo'] },
  { id: 'recursive-write', title: 'Write a complete recursive definition', families: ['recWrite', 'recFinite'] },
  { id: 'explicit-derive', title: 'n − 1 jumps: the explicit formula', families: ['countJumps', 'deriveForm'] },
  { id: 'explicit-evaluate', title: 'A far term, straight from the formula', families: ['evalFar', 'evalMoney'] },
  { id: 'explicit-from-list', title: 'Explicit formula from a list or graph', families: ['formFromList', 'formFromGraph'] },
  { id: 'solve-for-position', title: 'Which term is it, and is it a term?', families: ['whichN', 'isTerm', 'constCase'] },
  { id: 'explicit-from-two-terms', title: 'Formula from two terms', families: ['twoTerms', 'gapD', 'determined'] },
  { id: 'recursive-to-explicit', title: 'Recursive to explicit', families: ['recToExp', 'recToExpChoice'] },
  { id: 'explicit-expanded-form', title: 'dn + (a₁ − d): d is the slope', families: ['expand', 'slopeOf'] },
  { id: 'explicit-to-recursive', title: 'Explicit to recursive', families: ['seedOf', 'expToRec'] },
  { id: 'forms-equivalence', title: 'Why both forms give the same sequence', families: ['equivWhich', 'equivPair'] },
  { id: 'collinear-justification', title: 'Why the points lie on one line', families: ['whyLine', 'slopeBetween'] },
  { id: 'first-term-vs-intercept', title: 'First term vs the value at n = 0', families: ['firstVsZero', 'interceptTerm'] },
  { id: 'recursive-notation-shift', title: 'Writing the rule forward', families: ['shiftRule', 'shiftBound'] },
  { id: 'reindex-explicit', title: 'Relabel from n = 0 (explicit)', families: ['reindexExp', 'sameTerms'] },
  { id: 'reindex-recursive', title: 'Relabel from n = 0 (recursive)', families: ['reindexRec', 'relabelBound'] },
  { id: 'context-index-choice', title: 'Stories: choose the start index', families: ['ctxValue', 'ctxModel'] },
];
