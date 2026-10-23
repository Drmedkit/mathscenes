// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): an area with a part taken away, the volume of a
// triangular pyramid (both heights given in words), and a missing height from a volume. No calculator: the 3.14 items
// are left out; a π answer is typed as the number in front of π.
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const noCalc = (it: { prompt: string }) => !/3\.14|nearest|calculator/i.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'area-subtractive', family: 'areaSub', standalone: true },
    { subgoal: 'pyramid-volume', family: 'pyrVol', standalone: true },
    { subgoal: 'vol-missing-dimension', family: 'missing', standalone: true },
  ],
  // items that point at the picture are left out; the rectangle-based pyramid gives its height only in the picture,
  // so the triangular one is asked (its words give both heights)
  use: it => noCalc(it) && !/the picture/.test(plain(it.prompt)) && (it.family !== 'pyrVol' || /tall/.test(plain(it.prompt))),
  errorLabel: {
    'mc.volume.drops-formula-coefficient': 'Forgets the ⅓ in the pyramid volume',
    'mc.area-perimeter.uses-base-triangle-height-as-pyramid-height': 'Uses the base triangle’s height as the pyramid’s height',
  },
};
