// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Every family's solution lines end on the answer: typed numbers are marked <b class="s"> (ckit.num adds a marked
// line when a family has none), a point marks both coordinates (ckit.endPt), an exact radical marks the number in
// front and the number under the root, and choice items end on the right choice (ckit.choice via endOnChoice).
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
/** the lesson says "undefined" as maths (a vertical line has undefined slope) and writes rise/0 to show why */
export const TEXT_OK = [/ ?undefined ?/i, / ?\d+\/0(?![\d.]) ?/];
