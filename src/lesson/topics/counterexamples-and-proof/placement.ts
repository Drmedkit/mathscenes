// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): judge an offered counterexample, name what
// follows from a rule and a fact (detachment, modus tollens, or nothing), and classify a condition as necessary,
// sufficient, both or neither. All choice items whose prompt carries everything (the picture only illustrates).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'counterexample', family: 'cxJudge', standalone: true },
    { subgoal: 'modus-tollens', family: 'tollens', standalone: true },
    { subgoal: 'classify-condition', family: 'classify', standalone: true },
  ],
  errorLabel: {
    'mc.reasoning-language.counterexample-violates-premise': 'Takes a value with a false hypothesis as a counterexample',
    'mc.reasoning-language.counterexample-as-exception': 'Keeps a claim after a counterexample, as an “exception”',
    'mc.geometric-proof.misses-modus-tollens': 'Sees nothing following from “if p, then q” and “not q”',
    'mc.geometric-proof.inverse-error': 'Concludes “not q” from “if p, then q” and “not p”',
    'mc.geometric-proof.necessary-sufficient-confused': 'Swaps necessary and sufficient',
    'mc.geometric-proof.usual-condition-as-necessary': 'Calls a condition necessary because it usually comes along',
  },
};
