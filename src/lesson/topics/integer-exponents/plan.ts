// plan.ts: the practice walks through every sub-goal of secondary-t5-27-integer-exponents-and-scientific-notation, in
// topic JSON order (ids = the topic's subgoal ids); each names the families that practise it (items.ts uses its ranges).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'product-rule-positive', title: 'Multiply powers: count the factors', families: ['prodExp', 'prodPick'] },
  { id: 'quotient-rule-positive', title: 'Divide powers: cancel factors', families: ['quotExp', 'quotPick'] },
  { id: 'power-rules-whole', title: 'Powers of powers, products, fractions', families: ['powPow', 'powProd', 'powQuot'] },
  { id: 'negative-base-whole-laws', title: 'Negative and fraction bases', families: ['negBase', 'negSame'] },
  { id: 'zero-exponent', title: 'The zero exponent', families: ['zeroExp', 'zeroContrast'] },
  { id: 'negative-exponent-base-10', title: 'Negative powers of 10', families: ['tenDec', 'tenExp'] },
  { id: 'negative-exponent-general', title: 'Negative exponents', families: ['negExp', 'negWhich'] },
  { id: 'neg-power-fraction-base', title: 'Negative powers of fractions', families: ['negExp', 'negWhich'] },
  { id: 'neg-power-negative-base', title: 'Negative bases, zero and negative powers', families: ['negExp', 'negWhich'] },
  { id: 'external-minus-contrast', title: 'Minus sign inside or outside', families: ['minusPair', 'zeroMix'] },
  { id: 'product-rule-integer', title: 'Multiply powers, any integer exponents', families: ['prodExp', 'lawVal'] },
  { id: 'quotient-rule-integer', title: 'Divide powers, any integer exponents', families: ['quotExp', 'lawVal'] },
  { id: 'power-of-a-power', title: 'Power of a power, any integer exponents', families: ['powPow', 'lawVal'] },
  { id: 'power-of-a-product', title: 'Power of a product (not a sum)', families: ['powProd', 'sumPow'] },
  { id: 'power-of-a-quotient', title: 'Power of a quotient', families: ['powQuot', 'quotPick'] },
  { id: 'justify-zero-negative-definitions', title: 'Why a⁰ = 1 and a⁻ⁿ = 1/aⁿ', families: ['justify'] },
  { id: 'monomial-exponent-laws', title: 'Monomials with variables', families: ['monoExp', 'monoPick'] },
];
