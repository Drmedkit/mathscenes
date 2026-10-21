// plan.ts: the practice walks through every sub-goal of secondary-t5-17-operations-with-rational-numbers, in topic
// JSON order (ids = the topic's subgoal ids); each names the families that practise it (items.ts uses its ranges).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: readonly SubgoalPlan[] = [
  { id: 'minus-sign-roles', title: 'The three jobs of a minus sign', families: ['signRole', 'opposite'] },
  { id: 'zero-pairs', title: 'Opposites make zero', families: ['mat', 'inverse'] },
  { id: 'directed-addition', title: 'Adding is a jump', families: ['jumpAdd', 'lineRead'] },
  { id: 'subtract-as-add-opposite', title: 'Subtracting flips the jump', families: ['flipJump', 'rewrite'] },
  { id: 'distance-abs-difference', title: 'Change or distance?', families: ['distChange'] },
  { id: 'negative-mixed-number-meaning', title: 'Negative mixed numbers', families: ['mixedMeaning'] },
  { id: 'context-meaning-add-sub', title: 'What the signs mean', families: ['whatMeans'] },
  { id: 'int-add-same-sign', title: 'Same signs, no model', families: ['addSame'] },
  { id: 'int-add-opposite-sign', title: 'Opposite signs, no model', families: ['addOpp'] },
  { id: 'int-subtract', title: 'Subtracting integers', families: ['subInt'] },
  { id: 'model-to-algorithm-add-sub', title: 'Counters and the rule', families: ['matStep', 'mat'] },
  { id: 'fraction-add-sub-signed', title: 'Signed fractions', families: ['fracSigned', 'fracSign'] },
  { id: 'mixed-number-add-sub-signed', title: 'Signed mixed numbers', families: ['mixedOps'] },
  { id: 'decimal-add-sub-signed', title: 'Signed decimals', families: ['decSigned'] },
  { id: 'mixed-format-operands', title: 'Fractions and decimals together', families: ['mixFormat'] },
  { id: 'additive-properties-strategies', title: 'Reorder and regroup', families: ['regroup', 'property'] },
  { id: 'model-check-add-sub', title: 'Test a claim on the line', families: ['lineCheck'] },
  { id: 'inverse-check-difference', title: 'Check by adding back', families: ['checkPick', 'checkJudge'] },
  { id: 'apply-one-step-add-sub', title: 'Real-world problems', families: ['story', 'signMeaning'] },
];
