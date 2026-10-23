// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): the percent change from two amounts, a percent
// taken off (the amount and the new amount), and the single multiplier for a change. Mental-maths items only: the
// check-in has no calculator ("No calculator." items; a decrease by a multiple of 5% with whole-number results).
import type { Item } from '../../runtime/item';
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

function mental(it: Item): boolean {
  const t = plain(it.prompt);
  if (it.family === 'pctChange') return /No calculator/.test(t);
  if (it.family === 'twoStepDown') {
    const p = Number(t.match(/(\d+(?:\.\d+)?)%/)?.[1]);
    return it.answer.kind === 'pair' && p % 5 === 0 && Number.isInteger(it.answer.x) && Number.isInteger(it.answer.y);
  }
  return true;
}
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'compute-percent-change', family: 'pctChange', standalone: true },
    { subgoal: 'apply-decrease', family: 'twoStepDown', standalone: true },
    { subgoal: 'change-multiplier', family: 'multNum', standalone: true },
  ],
  use: mental,
};
