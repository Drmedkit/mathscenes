// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the size of a slice parallel to a face, a pyramid
// slice halfway up, and which polygons a cut can make (every question is told in words; the solid's picture only helps).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'cs-perpendicular-orientation', family: 'dims', standalone: true },
    { subgoal: 'cs-pyramid-tapering', family: 'half', standalone: true },
    { subgoal: 'cs-section-possibility', family: 'possible', standalone: true },
  ],
  // "It is shown upside down" talks about the picture: ask only the pyramids that stand the usual way
  use: it => !/\bshown\b/.test(plain(it.prompt)),
};
