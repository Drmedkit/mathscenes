// plan.ts: the practice walk-through, one entry per sub-goal of secondary.multiply-and-divide-rational-numbers in
// topic JSON order, with the families that practise it (a family may serve several sub-goals; the generator gets the
// sub-goal id and uses that sub-goal's number ranges).
import type { SubgoalPlan } from '../../runtime/practice';
import type { FamilyId } from './items';

interface Plan extends SubgoalPlan { families: FamilyId[] }
export const PLAN: Plan[] = [
  { id: 'numerical-distribution', title: 'Spread a product over a sum', families: ['distribute'] },
  { id: 'product-one-negative', title: 'One negative factor', families: ['jumps', 'oneNeg'] },
  { id: 'neg-times-neg-distributive', title: 'Why negative × negative is positive', families: ['pattern'] },
  { id: 'quotient-sign-missing-factor', title: 'The sign of a quotient', families: ['missing'] },
  { id: 'zero-in-division', title: 'Zero, and dividing by zero', families: ['zero'] },
  { id: 'concrete-mul-div-models', title: 'Two-color counters', families: ['counters'] },
  { id: 'fraction-sign-placement', title: 'Where the minus sign goes', families: ['signPlace'] },
  { id: 'context-meaning-mul-div', title: 'What a signed product means', families: ['meaning'] },
  { id: 'int-multiply', title: 'Multiply integers', families: ['intMul', 'signOnly'] },
  { id: 'int-divide', title: 'Divide integers', families: ['intDiv'] },
  { id: 'rational-products-signed', title: 'Multiply fractions and decimals', families: ['ratMul'] },
  { id: 'rational-quotients-signed', title: 'Divide fractions and decimals', families: ['ratDiv'] },
  { id: 'decimal-expansion-long-division', title: 'Terminating or repeating decimals', families: ['decimal'] },
  { id: 'rational-number-sets', title: 'Counting, whole, integer, rational', families: ['sets'] },
  { id: 'compound-expressions', title: 'Two or three operations', families: ['compound'] },
  { id: 'multi-step-order-of-operations', title: 'Powers and absolute value', families: ['powers'] },
  { id: 'multiplicative-properties-strategies', title: 'Smart ways to calculate', families: ['strategy'] },
  { id: 'inverse-check-quotient', title: 'Check a quotient', families: ['checkQ'] },
  { id: 'general-neg-neg-argument', title: 'A proof for every number', families: ['argument'] },
  { id: 'evidence-scope', title: 'Example, counterexample, proof', families: ['evidence'] },
  { id: 'apply-one-step-mul-div', title: 'One-step word problems', families: ['story1', 'jumps'] },
  { id: 'apply-multi-step', title: 'Multi-step word problems', families: ['storyMulti'] },
  { id: 'reasonableness-estimate', title: 'Is the answer reasonable?', families: ['estimate'] },
];
