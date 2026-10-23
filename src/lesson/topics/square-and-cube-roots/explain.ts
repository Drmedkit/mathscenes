// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** "0 and −0 are the same number" is the maths of x² = 0, not a broken value */
export const TEXT_OK = [/ and −0 are /];
