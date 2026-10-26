// items.ts: practice families for "Geometric sequences" (Algebra 1, secondary-t6-14). The families live in fam1.ts
// (stages 1-2) and fam2.ts (extension and stage 3); shared helpers and misconception ids in common.ts, exact maths in
// geo.ts. Every family is generated from templates, checked exactly (rationals, never rounded floats), and every
// wrong answer it recognises carries a misconception id from math-curriculum-essentials/misconceptions.json.
// Formulas are asked as choices among forms that differ by one typical slip, or as numbers that pin the form down
// (a_1 and r in a_n = □ · (□)^(n−1)); values, ratios and positions are typed. Pure: no DOM, no canvas.
import { FAM1 } from './fam1';
import { FAM2 } from './fam2';
import type { Gen } from './common';

export { MC, type QItem } from './common';
export const GENERATORS: Record<string, Gen> = { ...FAM1, ...FAM2 };
export const FAMILY_NAMES: Record<string, string> = {
  termRead: 'Term number vs value', indexDomain: 'Whole term numbers only',
  findR: 'The common ratio', ratioCheck: 'Every ratio the same?',
  classify: 'Arithmetic, geometric, both, neither', whichGeo: 'Which list is geometric?',
  findRfrac: 'A fraction ratio', findRdec: 'A decimal ratio',
  findRneg: 'A negative ratio', signCause: 'Negative terms or a negative ratio?',
  fEval: 'Evaluate f(n)', shiftNote: 'f(n + 1) vs f(n) + 1',
  recNext: 'Terms from the recursive rule', recList: 'Which list does the rule make?',
  recWrite: 'A complete recursive definition', recFromStory: 'Recursive rule from a story',
  countHops: 'Count the multiplications', deriveWhy: 'Why r to the n − 1',
  evalTerm: 'A term from the explicit formula', evalFrac: 'A term with a fraction ratio',
  writeExp: 'Explicit formula from a list', expFromTable: 'Which explicit formula fits?',
  recToExp: 'Recursive to explicit', expToRec: 'Explicit to recursive',
  gapRatio: 'Two steps apart: r²', gapCube: 'Three steps apart: r³',
  backFirst: 'Step back to the first term', backFormula: 'Formulas from two terms',
  zeroStart: 'Starting at n = 0', zeroOrOne: 'Start at 0 or at 1?',
  relabel: 'Relabel from 0', relabelValue: 'A relabelled term',
  rewriteCoef: 'Rewrite with r to the n', rewriteVsRelabel: 'Rewrite is not relabel',
  factorPct: 'Factor and percent change', compound: 'Percent changes compound',
  ctxEval: 'A term in a story', ctxMeaning: 'What a term means',
  firstCross: 'First past a threshold', crossCheck: 'Prove it is the first',
  modelType: 'Same amount or same factor?', critique: 'Fix a straight-line model',
  agreeWhy: 'Why the two forms agree', agreeStep: 'The step in the proof',
  fixModel: 'Find the mistake in a model', fixValue: 'Use the corrected model',
};
