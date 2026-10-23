// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// A typed number is read from the marked value with every thousands comma removed (1,200,000 is 1200000).
import type { Explain, Response } from '../../runtime/item';
import { plain } from '../../runtime/item';
import { leadValue, marked, stepsFrom } from '../../runtime/explain';

export const explain: Explain = it => {
  const ex = stepsFrom(it);
  if (!ex || it.input !== 'num') return ex;
  const mk = marked(ex.steps), last = mk[mk.length - 1];
  if (last === undefined) return ex;
  const v = leadValue(plain(last).replace(/(\d),(?=\d{3}(?!\d))/g, '$1'))?.v;
  if (v === undefined) return ex;
  const result: Response = { kind: 'num', v };
  return { steps: ex.steps, result };
};
