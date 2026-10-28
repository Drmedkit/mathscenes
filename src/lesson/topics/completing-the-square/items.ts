// items.ts: the exercise families of "Solving quadratics: square roots, completing the square, the formula"
// (secondary.solving-quadratic-equations-by-completing-the-square-and-the), generated from templates, checked exactly,
// every wrong answer classified against the misconception catalogue. The families live in fam1.ts (sub-goals 1-6) and
// fam2.ts (7-16); the shared builders and picture data in common.ts. Pure: no DOM.
import type { Gen } from './common';
import * as F1 from './fam1';
import * as F2 from './fam2';

export { MC, type QItem, type SqPic, type PlanePic } from './common';
export const FAMILIES: readonly { id: string; name: string; gen: Gen }[] = [
  { id: 'pstSpot', name: 'Spot the perfect square', gen: F1.pstSpot },
  { id: 'pstWrite', name: 'Write it as a square', gen: F1.pstWrite },
  { id: 'pstMiddle', name: 'The missing middle term', gen: F1.pstMiddle },
  { id: 'fillTerm', name: 'The missing corner', gen: F1.fillTerm },
  { id: 'fillPair', name: 'Complete the square', gen: F1.fillPair },
  { id: 'csRhs', name: 'Balance both sides', gen: F1.csRhs },
  { id: 'csSolve', name: 'Solve by completing the square', gen: F1.csSolve },
  { id: 'csExact', name: 'Exact solutions', gen: F1.csExact },
  { id: 'oddTerm', name: 'Half of an odd b', gen: F1.oddTerm },
  { id: 'oddRhs', name: 'Fractions on the right', gen: F1.oddRhs },
  { id: 'oddSolve', name: 'Solve with halves', gen: F1.oddSolve },
  { id: 'nmDivide', name: 'Divide every term by a', gen: F1.nmDivide },
  { id: 'nmTerm', name: 'The term after dividing', gen: F1.nmTerm },
  { id: 'nmSolve', name: 'Solve when a ≠ 1', gen: F1.nmSolve },
  { id: 'readABC', name: 'Read a, b and c', gen: F1.readABC },
  { id: 'discVal', name: 'Work out b² − 4ac', gen: F1.discVal },
  { id: 'formulaSolve', name: 'The formula, rational roots', gen: F1.formulaSolve },
  { id: 'formulaExact', name: 'The formula, exact roots', gen: F1.formulaExact },
  { id: 'formulaRound', name: 'The formula, rounded', gen: F1.formulaRound },
  { id: 'pickMethod', name: 'Pick the method', gen: F2.pickMethod },
  { id: 'sqrtSolve', name: 'Square roots of both sides', gen: F2.sqrtSolve },
  { id: 'twinFrac', name: 'Numbers first', gen: F2.twinFrac },
  { id: 'letterFrac', name: 'Letters over 4a²', gen: F2.letterFrac },
  { id: 'whyNonzero', name: 'Why a ≠ 0', gen: F2.whyNonzero },
  { id: 'literalTerm', name: 'Complete it with letters', gen: F2.literalTerm },
  { id: 'literalNext', name: 'The next line', gen: F2.literalNext },
  { id: 'deriveNext', name: 'Toward the formula', gen: F2.deriveNext },
  { id: 'deriveWhy', name: 'Why each step holds', gen: F2.deriveWhy },
  { id: 'discCount', name: 'How many solutions', gen: F2.discCount },
  { id: 'discKind', name: 'Rational or irrational', gen: F2.discKind },
  { id: 'graphMatch', name: 'Read the discriminant off the graph', gen: F2.graphMatch },
  { id: 'graphRead', name: 'Solutions on the graph', gen: F2.graphRead },
  { id: 'exactCheck', name: 'Check it exactly', gen: F2.exactCheck },
  { id: 'roundCheck', name: 'Rounded checks', gen: F2.roundCheck },
  { id: 'ctxModel', name: 'Story to equation', gen: F2.ctxModel },
  { id: 'ctxSolve', name: 'Solve the story', gen: F2.ctxSolve },
  { id: 'ctxRoots', name: 'Which roots make sense', gen: F2.ctxRoots },
  { id: 'rearrange', name: 'Solve a formula', gen: F2.rearrange },
  { id: 'rearrangeEval', name: 'Use the rearranged formula', gen: F2.rearrangeEval },
  { id: 'ineqSet', name: 'Between or outside', gen: F2.ineqSet },
  { id: 'ineqSpecial', name: 'Always, never, one point', gen: F2.ineqSpecial },
];
export const GENERATORS: Record<string, Gen> = Object.fromEntries(FAMILIES.map(f => [f.id, f.gen]));
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
