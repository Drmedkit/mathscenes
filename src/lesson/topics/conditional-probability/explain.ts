// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every
// solution line set marks its answer (<b class="s">) or names the right choice (common.ts choice() ends on it).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** "undefined" is the right answer of an impossible condition (P(B) = 0), not a broken template */
export const TEXT_OK = [/ ?undefined ?/i];
