// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): one percent change in a story, two changes one
// after another, and back to the original from the new amount (the lesson's test level). Typed answers; the tape
// picture is not needed. Rounding-to-the-cent items (a calculator task) are left out.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'single-change-in-context', family: 'single', standalone: true },
    { subgoal: 'successive-changes', family: 'successive', standalone: true },
    { subgoal: 'reverse-percent', family: 'reverse', standalone: true },
  ],
  use: it => !/calculator|nearest cent/i.test(plain(it.prompt)),
};
