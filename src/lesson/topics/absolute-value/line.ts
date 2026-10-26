// line.ts: a NumPic (av.ts) on the solving-linear-equations SetLine: one number line named x, the solution set and
// test values on it (solution side: they come in on the replay). The page draws the center marker and the distance
// arcs on top (where.x). Pure layout: generators check that a picture fits before they use it.
import { frame } from '../../../blocks/block';
import type { Theme } from '../../../core/theme';
import { dusk } from '../../dusk';
import { SetLine, type SetLineBlock, type SLParams, axisFor } from '../solving-linear-equations/SetLine';
import type { NumPic } from './av';

export const LINE_FRAME = frame(60, 170, 940, 760);
export const LINE_Y = 600;
export function lineParams(p: NumPic): SLParams {
  const ax = axisFor(p.values, LINE_FRAME.w - 150 - 100, { zero: p.values.some(v => Math.abs(v) <= 4) });
  return { ...ax, rows: [{ key: 'x', name: 'x', nameRole: 'second', set: p.reveal.set, role: 'link', numbers: 'below', y: LINE_Y }], tests: p.reveal.tests?.map(t => ({ ...t, row: 'x' })) };
}
export const lineBlock = (p: NumPic, th: Theme = dusk): SetLineBlock => SetLine(lineParams(p), LINE_FRAME, th);
export function lineFits(p: NumPic): boolean { try { lineBlock(p); return true; } catch { return false; } }
