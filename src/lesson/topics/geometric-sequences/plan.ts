// plan.ts: practice walks through every sub-goal of secondary-t6-14-sequences-geometric, in topic JSON order.
// Every sub-goal has two families (items.ts; fam1.ts and fam2.ts).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'seq-index', title: 'Term number vs term value', families: ['termRead', 'indexDomain'] },
  { id: 'ratio-whole', title: 'The common ratio r', families: ['findR', 'ratioCheck'] },
  { id: 'classify-arith-geo', title: 'Arithmetic, geometric, both or neither', families: ['classify', 'whichGeo'] },
  { id: 'ratio-fraction', title: 'Fraction and decimal ratios', families: ['findRfrac', 'findRdec'] },
  { id: 'ratio-negative', title: 'Negative ratios: the signs flip', families: ['findRneg', 'signCause'] },
  { id: 'notation-evaluate', title: 'Reading aₙ and f(n)', families: ['fEval', 'shiftNote'] },
  { id: 'recursive-generate', title: 'Terms from a recursive rule', families: ['recNext', 'recList'] },
  { id: 'recursive-write', title: 'Write a complete recursive definition', families: ['recWrite', 'recFromStory'] },
  { id: 'explicit-derive', title: 'n − 1 multiplications: a₁ · rⁿ⁻¹', families: ['countHops', 'deriveWhy'] },
  { id: 'explicit-evaluate', title: 'A far term, straight from the formula', families: ['evalTerm', 'evalFrac'] },
  { id: 'explicit-write', title: 'Explicit formula from a list', families: ['writeExp', 'expFromTable'] },
  { id: 'translate-forms', title: 'Recursive ↔ explicit', families: ['recToExp', 'expToRec'] },
  { id: 'nonadjacent-ratio', title: 'Ratio from terms far apart (extension)', families: ['gapRatio', 'gapCube'] },
  { id: 'nonadjacent-formula', title: 'Back to the first term (extension)', families: ['backFirst', 'backFormula'] },
  { id: 'index-zero', title: 'Start at n = 0: a₀ · rⁿ', families: ['zeroStart', 'zeroOrOne'] },
  { id: 'reindex', title: 'Relabel from 0 to 1 and back', families: ['relabel', 'relabelValue'] },
  { id: 'rewrite-same-index', title: 'Rewrite with the same n', families: ['rewriteCoef', 'rewriteVsRelabel'] },
  { id: 'factor-percent', title: 'Factor = repeated percent change', families: ['factorPct', 'compound'] },
  { id: 'context-model', title: 'A model in a story, with units', families: ['ctxEval', 'ctxMeaning'] },
  { id: 'context-threshold', title: 'The first period past a threshold', families: ['firstCross', 'crossCheck'] },
  { id: 'justify-model-type', title: 'Why geometric, not arithmetic', families: ['modelType', 'critique'] },
  { id: 'justify-forms-agree', title: 'Why both forms give the same sequence', families: ['agreeWhy', 'agreeStep'] },
  { id: 'diagnose-index', title: 'Find and fix a broken model', families: ['fixModel', 'fixValue'] },
];
