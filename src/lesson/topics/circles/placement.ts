// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): circumference and area from the radius or the
// diameter, exact in terms of π (no calculator items: the check-in has no π key).
import type { Placement } from '../../placement/types';
import { plain } from '../../runtime/item';

const noCalc = (it: { prompt: string }) => !/\(calculator\)|π key/.test(plain(it.prompt));
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'c-from-d', family: 'cFromD', standalone: true },
    { subgoal: 'a-from-r', family: 'aFromR', standalone: true },
    { subgoal: 'a-from-d', family: 'aFromD', standalone: true },
  ],
  use: noCalc,
};
