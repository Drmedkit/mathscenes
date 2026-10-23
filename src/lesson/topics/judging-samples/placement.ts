// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): who a way of choosing leaves out, which
// conclusion the data allow, and what is sure for the whole group with missing answers (each study told in words;
// only the stories short enough for the check-in card).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'selection-bias', family: 'leftOut', standalone: true },
    { subgoal: 'generalize-scope', family: 'scope', standalone: true },
    { subgoal: 'generalize-scope', family: 'complete', standalone: true },
  ],
  use: it => plain(it.prompt).length <= 240,
};
