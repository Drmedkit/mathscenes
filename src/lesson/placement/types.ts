// types.ts: the check-in adapter a lesson gives (src/lesson/topics/<slug>/placement.ts, docs/lessons/QUALITY_LAYER.md).
import type { Item } from '../runtime/item';

export interface PlacementPick {
  /** a (sub-goal, family) pair of the lesson's plan.ts */
  subgoal: string;
  family: string;
  /** the items carry picture data, but the question stands alone without the picture (checked by a person) */
  standalone?: boolean;
}
export interface Placement {
  /** 1-3 practice families at the lesson's test level, answerable without the lesson's canvas in under a minute */
  picks: PlacementPick[];
  /** a small self-contained SVG for an item whose question needs its picture (viewBox, no external refs, <= 6 KB) */
  figure?: (it: Item) => string | null;
  /** only items this keeps are asked (e.g. no calculator items); default: all */
  use?: (it: Item) => boolean;
  /** optional wording per misconception id for the end report; default: the catalogue's name
   *  (pages/lessons/placement/mc-names.json from math-curriculum-essentials/misconceptions.json) */
  errorLabel?: Record<string, string>;
}
