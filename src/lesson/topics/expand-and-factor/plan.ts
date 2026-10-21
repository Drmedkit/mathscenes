// plan.ts: the practice walks through every sub-goal of secondary-t5-18-expressions-expand-and-factor, in topic JSON
// order (22 sub-goals). Each entry names the families that practise it; a family gets the sub-goal id and uses that
// sub-goal's cases (signs, fractions, decimals, monomials) from the topic JSON.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'equal-sign-relational', title: '= means "same value"', families: ['equalSign'] },
  { id: 'classify-like-terms', title: 'Like and unlike terms', families: ['likeTerms'] },
  { id: 'reorder-regroup', title: 'Order or grouping?', families: ['property'] },
  { id: 'model-distributive', title: 'The area model, both ways', families: ['areaToSum', 'areaToProduct'] },
  { id: 'equivalence-meaning', title: 'Equal for every value', families: ['equivalent'] },
  { id: 'expand-positive', title: 'Expand', families: ['expand'] },
  { id: 'collect-positive', title: 'Combine like terms', families: ['collect'] },
  { id: 'read-signed-terms', title: 'A sign belongs to its term', families: ['signedTerms'] },
  { id: 'collect-signed', title: 'Combine with negatives', families: ['collect'] },
  { id: 'expand-negative', title: 'Expand with a negative', families: ['expand'] },
  { id: 'rational-coefficients', title: 'Fractions and decimals', families: ['expand', 'collect'] },
  { id: 'expand-then-collect', title: 'Expand, then combine', families: ['expandCollect'] },
  { id: 'subtract-expression', title: 'Subtract a whole expression', families: ['subtract'] },
  { id: 'factor-given-factor', title: 'Factor out a number', families: ['factorOut'] },
  { id: 'factor-gcf', title: 'Factor completely', families: ['gcf', 'twoFactorings'] },
  { id: 'factor-signed-rational', title: 'Factor out a negative or a fraction', families: ['factorOut'] },
  { id: 'two-variable-rewrites', title: 'Two variables', families: ['twoVar'] },
  { id: 'property-justified-chain', title: 'A reason for every step', families: ['nameStep', 'faultyStep'] },
  { id: 'counterexample-logic', title: 'One counterexample is enough', families: ['counter'] },
  { id: 'context-forms', title: 'What each form shows', families: ['context'] },
  { id: 'monomial-distribute', title: 'Multiply by a monomial', families: ['monomial'] },
  { id: 'monomial-factor', title: 'Factor out a monomial', families: ['monoFactor'] },
];
