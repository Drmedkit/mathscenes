// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): find the case that breaks an if-then statement
// over a stated domain, form a contrapositive, and negate an "all" statement. All choice items that stand alone.
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'conditional-truth', family: 'breaker', standalone: true },
    { subgoal: 'form-contrapositive', family: 'whichContra', standalone: true },
    { subgoal: 'negate-universal', family: 'negAll', standalone: true },
  ],
  errorLabel: {
    'mc.geometric-proof.false-hypothesis-breaks-conditional': 'Thinks a case with a false hypothesis breaks an if-then statement',
    'mc.geometric-proof.conditional-forms-mixed-up': 'Gives the inverse when asked for the contrapositive',
    'mc.geometric-proof.not-all-means-none': 'Negates "all" as "none"',
  },
};
