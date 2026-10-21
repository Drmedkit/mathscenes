// scenes.ts: where the tapes go on the lesson canvas, and how a row turns into its next state. A row that is split
// (the whole 100% tape becomes "kept + taken off") is drawn as two blocks with the same layout, cross-faded per row,
// so the tape changes in place instead of jumping.
import { frame } from '../../../blocks/block';
import type { Canvas } from '../../../core/draw';
import { withAlpha } from '../../../core/draw';
import type { TapeBlock, TapeFocus } from './PercentTape';

/** the model's frame: the left of the canvas up to just before the board (1240) */
export const TF = frame(50, 70, 1140, 940);

/** only the keys of row r ('r0', 'l0', 'e0', 'd0' for r = 0) */
const only = (k: (key: string) => number, r: number) => (key: string) => (key.slice(1) === String(r) ? k(key) : 0);

/**
 * draw n rows: row r shows `before` while split(r) = 0, `after` when it is 1, cross-faded in between;
 * then the focus marks of `after` on top
 */
export function drawSplit(c: Canvas, after: TapeBlock, before: TapeBlock | null, n: number, k: (key: string) => number, split: (r: number) => number, f?: TapeFocus, fBefore?: TapeFocus): void {
  for (let r = 0; r < n; r++) {
    const s = before ? Math.max(0, Math.min(1, split(r))) : 1;
    if (before && s < 1) withAlpha(c, 1 - s, () => before.draw(c, only(k, r)));
    if (s > 0) withAlpha(c, s, () => after.draw(c, only(k, r)));
  }
  if (before && fBefore) before.draw(c, () => 0, fBefore);
  if (f) after.draw(c, () => 0, f);
}
