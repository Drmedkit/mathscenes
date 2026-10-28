// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): sort a statement into definition / postulate /
// theorem / conjecture from how it was obtained, name the property of equality behind a proof step, and judge whether
// evidence proves a claim. All choice items that stand alone (their card repeats the prompt).
import type { Placement } from '../../placement/types';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'postulate', family: 'kindOf', standalone: true },
    { subgoal: 'equality-properties', family: 'propName', standalone: true },
    { subgoal: 'empirical-vs-deductive', family: 'evidenceVerdict', standalone: true },
  ],
  errorLabel: {
    'mc.geometric-proof.postulate-definition-confused': 'Confuses postulates (accepted claims) with definitions (names)',
    'mc.geometric-proof.informal-reason-not-named-property': 'Gives "it is obvious" instead of naming the property',
    'mc.reasoning-language.examples-as-proof': 'Treats checked examples as a proof',
  },
};
