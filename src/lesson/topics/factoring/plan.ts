// plan.ts: practice walks through every sub-goal of secondary-t6-05-factoring-polynomials, in topic JSON order.
// Give each sub-goal a short kid-friendly title and the families that practise it (every sub-goal needs >= 1).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'sum-vs-product-form', title: 'Sum form or product form', families: ['formPick', 'formKind'] },
  { id: 'reverse-distribution', title: 'Distribution in reverse', families: ['numGcfSum', 'distBack', 'sameValue'] },
  { id: 'area-model-trinomial', title: 'Read the area box backwards', families: ['areaSides', 'areaPair', 'areaParallel'] },
  { id: 'verify-by-expansion', title: 'Check by expanding', families: ['verifyJudge', 'verifyMid'] },
  { id: 'numeric-gcf-extraction', title: 'The greatest common factor', families: ['gcfNum', 'gcfOut'] },
  { id: 'monomial-quotient', title: 'The missing monomial factor', families: ['missingMono', 'zeroCond'] },
  { id: 'monomial-gcf', title: 'A GCF with powers of x', families: ['gcfMonoPick', 'gcfMonoOut'] },
  { id: 'negative-gcf', title: 'Take out a negative factor', families: ['negOut', 'negOne'] },
  { id: 'divide-by-monomial', title: 'Divide by a monomial', families: ['divTerms', 'divSigned'] },
  { id: 'monic-positive', title: 'x² + bx + c, all positive', families: ['monicPair', 'monicPick'] },
  { id: 'monic-both-negative', title: 'Both numbers negative', families: ['monicNegPair', 'monicNegPick'] },
  { id: 'monic-opposite-signs', title: 'Numbers of opposite sign', families: ['monicOppPair', 'monicMixed'] },
  { id: 'difference-of-squares', title: 'Difference of squares', families: ['dosPick', 'dosFill'] },
  { id: 'perfect-square-trinomial', title: 'Perfect-square trinomials', families: ['pstPick', 'pstMid'] },
  { id: 'factor-by-grouping', title: 'Factor by grouping', families: ['groupPick', 'groupStep'] },
  { id: 'nonmonic-ac-method', title: 'ax² + bx + c: the ac method', families: ['acSplit', 'acPick'] },
  { id: 'prime-over-integers', title: 'Prime over the integers', families: ['primeJudge', 'primeGcf'] },
  { id: 'factor-completely', title: 'Factor completely', families: ['completePick', 'completeFill'] },
  { id: 'divide-by-factor-cancel', title: 'Divide by factoring and canceling', families: ['cancelPick', 'cancelExcl'] },
  { id: 'divide-by-binomial', title: 'Divide with a remainder', families: ['longPick', 'longRem'] },
  { id: 'justify-equivalence-check', title: 'Why expanding proves it', families: ['agreeProof', 'whyExpand'] },
  { id: 'judge-completeness', title: 'Is it complete?', families: ['judgeWhich', 'judgeYes'] },
  { id: 'area-dimensions-application', title: 'Sides from an area', families: ['roomSides', 'roomAt', 'roomWidth'] },
  { id: 'polynomial-operations-in-context', title: 'Polynomials in context', families: ['ctxOp', 'ctxValue'] },
];
