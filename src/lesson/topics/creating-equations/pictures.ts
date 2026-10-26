// pictures.ts: from an item's picture data (items.ts LinePic / TablePic) to the lesson's blocks, and a check that the
// picture lays out readably. Generators retry until their picture fits (or drop it), so the page never meets a picture
// a block refuses. Pure (no DOM): items, the page and the tests share it.
import { frame } from '../../../blocks/block';
import { dusk } from '../../dusk';
import type { Theme } from '../../../core/theme';
import { axisFor, estW, SL } from '../solving-linear-equations/SetLine';
import { AllowedLine, type AllowedLineBlock, type ALParams } from './AllowedLine';
import { CheckTable, type CheckTableBlock } from './CheckTable';
import type { LinePic, TablePic } from './items';

/** the model frame left of the board (number lines) and the full-width frame (tables) */
export const LINE_FRAME = frame(60, 70, 940, 940);
export const TABLE_FRAME = frame(60, 60, 1800, 960);
/** the line length the row names leave in the frame (SetLine's own layout rule) */
export const lineWidth = (names: readonly string[]) => LINE_FRAME.w - Math.max(150, ...names.map(n => estW(n, SL.name) + 40)) - 100;
export function lineParams(pic: LinePic): ALParams {
  const names = pic.rows.map(r => r.name ?? '').filter(Boolean);
  const ax = pic.axis ?? axisFor(pic.values, lineWidth(names.length ? names : ['x']), { zero: false });
  return {
    ...ax,
    rows: pic.rows.map(r => ({ key: r.key, name: r.name, set: r.set, role: r.role, dashed: r.dashed, numbers: r.numbers, nameRole: r.role === 'link' || r.role === 'dim' ? 'second' : r.role })),
    tests: pic.tests, dots: pic.dots?.map(d => ({ key: d.key, row: d.row, vs: d.vs, role: d.role })),
  };
}
export const lineBlock = (pic: LinePic, th: Theme = dusk): AllowedLineBlock => AllowedLine(lineParams(pic), LINE_FRAME, th);
export const tableBlock = (pic: TablePic, th: Theme = dusk): CheckTableBlock => CheckTable(pic, TABLE_FRAME, th);
export function picFits(p: { line?: LinePic; table?: TablePic } | undefined): boolean {
  if (!p) return true;
  try { if (p.line) lineBlock(p.line); if (p.table) tableBlock(p.table); return true; } catch { return false; }
}
