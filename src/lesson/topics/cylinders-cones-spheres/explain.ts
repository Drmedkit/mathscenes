// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The answers are marked in the lesson's own solution lines (<b class="s">). A typed count can be as big as 1,000,000
// (cubic units): the runtime's reader stops at the second thousands comma, so the marked value is read here in full.
import type { Explain } from '../../runtime/item';
import { plain } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';

const fullNumber = (html: string): number | null => {
  const m = plain(html).replace(/[−–]/g, '-').replace(/,(?=\d{3}(?!\d))/g, '').trim().match(/^-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};
export const explain: Explain = it => {
  const ex = stepsFrom(it);
  if (!ex || it.input !== 'num') return ex;
  const mk = marked(ex.steps), v = mk.length ? fullNumber(mk[mk.length - 1]!) : null;
  return v === null ? ex : { ...ex, result: { kind: 'num', v } };
};
