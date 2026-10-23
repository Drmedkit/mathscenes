// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
