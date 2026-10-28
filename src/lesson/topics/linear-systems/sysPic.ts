// sysPic.ts: the pictures of "Systems of equations" as plain data (items.ts and the page make them, the page draws them
// on the shared kit's Plane, src/lesson/kit/Plane.ts). Everything is what is DRAWN:
//   line   the line a x + b y = c (a full-height vline when b = 0), solid or dashed (a dashed line over a solid one =
//          the same line written twice)
//   point / seg / text   as in the kit
// `show` keys are drawn with the question, `solve` keys come in on the worked solution after a miss, so no answer is on
// screen before the student answers. A picture with an empty `show` starts as a big slate and turns into the plane on
// the solve: never an empty grid with a question. Plane item keys live under their own prefix in the page ('x.g.'),
// apart from the board's step keys ('x.board', 'x.given0', 'x.sol0').
import type { Paint, Theme } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import { Plane, type PItem, type PlaneBlock } from '../../kit/Plane';
import type { Eq } from './sysMaths';

export interface GAxis { min: number; max: number; step: number; name?: string }
export type GItem =
  | { kind: 'line'; key: string; E: Eq; col?: Paint; dash?: boolean; name?: string; w?: number }
  | { kind: 'point'; key: string; x: number; y: number; name?: string; col?: Paint; open?: boolean }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: Paint; arrow?: boolean; dash?: boolean; w?: number }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint; align?: 'left' | 'center' | 'right'; size?: number };
export interface GPic { x: GAxis; y: GAxis; equal?: boolean; items: GItem[]; show: string[]; solve: string[] }
/** g = the plane; bd = extra TeX lines on the board with the question (the second equation, a table row); cols = the
 *  colour of the board line and of each bd line; tex = the worked TeX lines written on the solve */
export type Pic = { g?: GPic; bd?: string[]; cols?: (Paint | undefined)[]; tex?: string[] };

/** a square window around the points that matter: every point inside with a margin, 0 on both axes, 8-16 cells wide */
export function winAround(pts: readonly (readonly [number, number])[], o: { pad?: number; min?: number } = {}): Pick<GPic, 'x' | 'y' | 'equal'> {
  const pad = o.pad ?? 2, minSpan = o.min ?? 10;
  let x0 = Math.min(0, ...pts.map(p => Math.floor(p[0]))) - pad, x1 = Math.max(0, ...pts.map(p => Math.ceil(p[0]))) + pad;
  let y0 = Math.min(0, ...pts.map(p => Math.floor(p[1]))) - pad, y1 = Math.max(0, ...pts.map(p => Math.ceil(p[1]))) + pad;
  while (x1 - x0 < minSpan) { if (x1 - x0 < minSpan) x1++; if (x1 - x0 < minSpan) x0--; }
  while (y1 - y0 < minSpan) { if (y1 - y0 < minSpan) y1++; if (y1 - y0 < minSpan) y0--; }
  const step = Math.max(x1 - x0, y1 - y0) > 18 ? 2 : 1;
  const snap = (v: number, up: boolean) => (up ? Math.ceil(v / step) * step : Math.floor(v / step) * step);
  return { x: { min: snap(x0, false), max: snap(x1, true), step, name: 'x' }, y: { min: snap(y0, false), max: snap(y1, true), step, name: 'y' }, equal: true };
}

/** the shared kit's Plane for a picture */
export function planeOf(g: GPic, fr: Frame, th: Theme): PlaneBlock {
  const items: PItem[] = [];
  for (const it of g.items) {
    if (it.kind === 'line') {
      const E = it.E;
      if (E.b === 0) items.push({ kind: 'vline', key: it.key, x: E.c / E.a, col: it.col ?? 'link', dash: it.dash ?? false });
      else items.push({ kind: 'curve', key: it.key, f: x => (E.c - E.a * x) / E.b, col: it.col ?? 'link', dash: it.dash, name: it.name, w: it.w ?? 5 });
    } else if (it.kind === 'seg') items.push({ kind: 'seg', key: it.key, a: it.a, b: it.b, col: it.col, arrow: it.arrow, dash: it.dash, w: it.w });
    else items.push(it as PItem);
  }
  return Plane({ x: { ...g.x }, y: { ...g.y }, equal: g.equal, items }, fr, th);
}
