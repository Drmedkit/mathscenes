// text.ts: words.wordsBox, safe outside a browser (tests lay the blocks out in node): without a document the width is
// a generous estimate (0.6 em per character), so a layout that fits in the tests also fits on the page.
import { type Box, box } from '../../../core/math';
import { type WordsOpts, wordsBox } from '../../words';

export function tbox(text: string, x: number, y: number, o: WordsOpts = {}): Box {
  if (typeof document !== 'undefined') return wordsBox(text, x, y, o);
  const size = o.size ?? 50, w = text.length * size * 0.6;
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  return box(x0, y - size * 0.42, x0 + w, y + size * 0.42);
}
