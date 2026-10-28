// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Number items
// mark their answer with <b class="s"> (ans) in the line that reaches it, pair items mark both boxes in order, and
// choice items end on "So: <the right choice>" (linear-regression's choice helper adds it through endOnChoice).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
