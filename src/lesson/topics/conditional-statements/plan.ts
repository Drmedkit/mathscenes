// plan.ts: practice walks through every sub-goal of v2.extension.logical-reasoning, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'statement-truth-value', title: 'Statements, open sentences and truth values', families: ['statementKind', 'openTruth'] },
  { id: 'negate-simple', title: 'Negate a simple statement', families: ['negateIneq', 'negateProperty', 'negBoundary'] },
  { id: 'conditional-form', title: 'If-then form: hypothesis and conclusion', families: ['ifThen', 'hypConc'] },
  { id: 'conditional-truth', title: 'When is an if-then statement false?', families: ['breaker', 'caseValue'] },
  { id: 'form-converse', title: 'The converse is a different statement', families: ['whichConverse', 'converseTrue'] },
  { id: 'biconditional', title: '“If and only if”: both directions', families: ['iffMeans', 'iffTrue', 'ifAsIff'] },
  { id: 'universal-quantifier', title: '“All” and “every” over a domain', families: ['allTrue', 'implicitAll'] },
  { id: 'existential-quantifier', title: '“Some” and a witness', families: ['someTrue', 'witnessCount'] },
  { id: 'logical-equivalence', title: 'Equivalent in every case', families: ['equivOnD', 'formsEquiv'] },
  { id: 'negate-universal', title: 'Negate an “all” statement', families: ['negAll', 'negAllWitness'] },
  { id: 'negate-existential', title: 'Negate a “some” statement', families: ['negSome', 'negSomeTruth'] },
  { id: 'form-inverse', title: 'Form the inverse', families: ['whichInverse', 'inverseFalse'] },
  { id: 'form-contrapositive', title: 'Form the contrapositive', families: ['whichContra', 'nameForm'] },
];
