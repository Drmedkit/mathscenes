// pictures.ts: from an item's line picture (items.ts LinePic) to SetLine parameters: the window (axisFor; 0 is kept
// in view only when an arrow map multiplies, since a mirror goes through 0), the line width the row names leave, and
// a check that the picture lays out readably. Generators retry until their picture fits (or drop it), so the page
// never meets a picture SetLine refuses. Pure (no DOM): items, the page and the tests share it.
import { frame } from '../../../blocks/block';
import { dusk } from '../../dusk';
import type { Theme } from '../../../core/theme';
import { SetLine, type SetLineBlock, type SLParams, axisFor, estW, SL } from './SetLine';
import type { LinePic } from './items';

export const LINE_FRAME = frame(60, 70, 940, 940);
/** the line length the row names leave in the frame (SetLine's own layout rule) */
export const lineWidth = (names: readonly string[]) => LINE_FRAME.w - Math.max(150, ...names.map(n => estW(n, SL.name) + 40)) - 100;
export function picParams(pic: LinePic): SLParams {
  const names = pic.rows.flatMap(r => [r.name ?? '', r.name2 ?? '']).filter(Boolean);
  const mirror = (pic.maps ?? []).some(m => m.op.kind === 'mul');
  return {
    ...axisFor(pic.values, lineWidth(names.length ? names : ['x']), { zero: mirror || pic.values.some(v => Math.abs(v) <= 3) }),
    rows: pic.rows.map(r => ({ ...r, nameRole: r.role === 'link' ? 'second' : r.role })), tests: pic.tests, maps: pic.maps,
  };
}
export const picBlock = (pic: LinePic, th: Theme = dusk): SetLineBlock => SetLine(picParams(pic), LINE_FRAME, th);
export function picFits(pic: LinePic): boolean { try { picBlock(pic); return true; } catch { return false; } }
