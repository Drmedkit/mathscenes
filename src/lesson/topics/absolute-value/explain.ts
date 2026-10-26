// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md). Every family's
// solution lines follow the lesson's method (inside first; the breakpoint where the inside is 0; isolate, then split
// into u = c or u = −c; test each candidate in its own case; |u| < c is one band, |u| > c two rays) and mark the answer
// (pairs in the order of the boxes, smaller first) or end on the right choice, so the card shows them as they are.
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => stepsFrom(it);
