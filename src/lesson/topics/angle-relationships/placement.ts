// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): find a vertical angle from two crossing lines,
// a complement or supplement, and a mixed "which relationship" item. Only questions that name every angle they use
// (the figure is the lesson's canvas; "the box marks…" or "line CE is drawn" items need it, so they are left out).
import type { Item } from '../../runtime/item';
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const standsAlone = (it: Item) => /are (complementary|supplementary)|Lines \w+ and \w+ cross at \w+, and|Ray \w+ splits/.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'find-vertical', family: 'findVertical', standalone: true },
    { subgoal: 'find-supplement', family: 'findPair', standalone: true },
    { subgoal: 'select-relationship', family: 'mixed', standalone: true },
  ],
  use: it => standsAlone(it),
};
