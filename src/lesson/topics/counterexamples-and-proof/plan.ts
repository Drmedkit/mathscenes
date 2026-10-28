// plan.ts: practice walks through every sub-goal of v2.extension.counterexample-inference-and-proof, in topic JSON order.
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'counterexample', title: "Break a claim with one checked counterexample", families: ['cxPick', 'cxJudge', 'cxShape'] },
  { id: 'generality-of-proof', title: "Examples vs a proof that covers every case", families: ['examplesProof', 'argCovers', 'afterProof'] },
  { id: 'general-representation', title: "Write any number of a kind with letters", families: ['repPick', 'repWhyInt', 'repRead'] },
  { id: 'detachment', title: "From “if p, then q” and p, conclude q", families: ['detach', 'detachWhich'] },
  { id: 'chaining', title: "Chain two if-then statements", families: ['chain', 'chainValid'] },
  { id: 'direct-proof', title: "Write a short direct proof", families: ['proofFill', 'proofAngle'] },
  { id: 'invalid-inference', title: "Spot invalid arguments with a countermodel", families: ['validForm', 'countermodel'] },
  { id: 'proof-audit', title: "Find circular or unjustified steps", families: ['auditFind', 'auditKind'] },
  { id: 'converse-truth', title: "Is the converse true?", families: ['converseJudge', 'converseCx'] },
  { id: 'contrapositive-equivalence', title: "Which related statements must be true", families: ['fourCases', 'mustBeTrue'] },
  { id: 'modus-tollens', title: "From “if p, then q” and not q, conclude not p", families: ['tollens', 'formName'] },
  { id: 'sufficient-condition', title: "“p is sufficient for q”", families: ['suffRead', 'suffTrue'] },
  { id: 'necessary-condition', title: "“q is necessary for p”, “p only if q”", families: ['necRead', 'necTrue'] },
  { id: 'iff-proof', title: "Prove “if and only if” both ways", families: ['iffParts', 'iffJudge'] },
  { id: 'classify-condition', title: "Necessary, sufficient, both or neither", families: ['classify', 'classifyWhy'] },
];
