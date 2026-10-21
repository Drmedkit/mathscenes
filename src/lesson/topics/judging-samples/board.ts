// board.ts: the notation board of this topic. The "notation" of judging a sample is a short audit card (the question
// is about / the data came from / the answers / the data support), so the board writes words in the page's sans with
// the numbers big, each row in its colour role: amber = the population, teal = the asked group, lime = the
// conclusion the data support, red = a claim that overreaches (struck). A row is a small dim label over one value
// line. Rows fade and rise in (write-on), dim when the step moves on, and can be struck.
// Pure layout (wordsBox) + draw; the page passes the row's progress values.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, strike } from '../../../core/draw';
import type { Paint } from '../../../core/theme';
import { BlockError } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';

export interface Run { t: string; col?: Paint; num?: boolean }
export interface BoardRow {
  key: string; y: number; label?: string; runs: Run[];
  x: number; size: number; nsize: number;
  /** boxes of the runs (for leaders) and of the whole value line */
  boxes: Box[]; value: Box; labelBox: Box | null;
}
const LABEL = 44, WORDS = 52, NUMS = 66, MIN_WORDS = 44, MIN_NUMS = 60;
export const LABEL_GAP = 60;

function measure(runs: readonly Run[], x: number, y: number, size: number, nsize: number): Box[] {
  const out: Box[] = [];
  let cx = x;
  for (const r of runs) {
    const b = wordsBox(r.t, cx, y, { size: r.num ? nsize : size, weight: r.num ? 650 : 600 });
    out.push(b); cx = b.x1;
  }
  return out;
}
/** lay out one row: the value line's middle at y, its dim label above; shrinks to fit width w (throws if it can't) */
export function boardRow(key: string, y: number, label: string | undefined, runs: Run[], x: number, w: number): BoardRow {
  let size = WORDS, nsize = NUMS, boxes = measure(runs, x, y, size, nsize);
  while ((boxes[boxes.length - 1]!.x1 - x) > w && (size > MIN_WORDS || nsize > MIN_NUMS)) {
    size = Math.max(MIN_WORDS, size - 2); nsize = Math.max(MIN_NUMS, nsize - 2);
    boxes = measure(runs, x, y, size, nsize);
  }
  const right = boxes[boxes.length - 1]!.x1;
  if (right - x > w + 1) throw new BlockError('Board', `"${runs.map(r => r.t).join('')}" is ${Math.round(right - x)} px, the board has ${w}`);
  const labelBox = label ? wordsBox(label, x, y - LABEL_GAP, { size: LABEL, weight: 500 }) : null;
  if (labelBox && labelBox.w > w + 1) throw new BlockError('Board', `the label "${label}" is too long for the board`);
  const value = box(x, Math.min(...boxes.map(b => b.y0)), right, Math.max(...boxes.map(b => b.y1)));
  return { key, y, label, runs, x, size, nsize, boxes, value, labelBox };
}
/** draw a row: k = write-on (fade + rise), dim = 0..1 toward 45 %, strikeK = a red strike through the value */
export function drawRow(c: Canvas, R: BoardRow, k: number, dim = 0, strikeK = 0): void {
  if (k <= 0) return;
  const a = clamp(k);
  c.g.save();
  c.g.globalAlpha *= 1 - 0.55 * clamp(dim);
  if (R.label) drawWords(c, R.label, R.x, R.y - LABEL_GAP, 'dim', a, { size: LABEL, weight: 500 });
  R.runs.forEach((r, i) => {
    const b = R.boxes[i]!;
    drawWords(c, r.t, b.x0, R.y, r.col ?? 'ink', clamp(a * 1.4 - i * 0.12), { size: r.num ? R.nsize : R.size, weight: r.num ? 650 : 600 });
  });
  c.g.restore();
  if (strikeK > 0) strike(c, R.value.x0 - 8, R.value.cy + 4, R.value.x1 + 8, R.value.cy - 4, strikeK);
}
