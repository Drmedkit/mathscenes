// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): could a table be linear (changes that are not
// all the same), the start value read back from a table, and a far prediction from the start and the change.
// All three read a table, so figure() draws the item's table (input row, output row) as a small SVG.
import type { Item } from '../../runtime/item';
import type { Placement } from '../../placement/types';

interface TG { xs: number[]; ys: number[]; xHead?: [string, string]; yHead?: [string, string] }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const head = (h: [string, string] | undefined, fb: string) => esc(h ? `${h[0]}${h[1] ? ' ' + h[1] : ''}` : fb);

/** the item's table: a header cell, then one cell per row of the lesson's table (input on top, output below) */
export function tableFigure(it: Item): string | null {
  const tg = (it as Item & { pic?: { tg?: TG; at?: string[] } }).pic?.tg;
  if (!tg || !tg.xs?.length || tg.xs.length !== tg.ys.length) return null;
  const n = tg.xs.length, hw = 110, cw = 56, rh = 40, W = hw + n * cw + 2, H = 2 * rh + 2;
  const cell = (x: number, y: number, w: number, t: string, col: string, fill: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${fill}" stroke="#efe6f7" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + rh / 2 + 6}" text-anchor="middle" font-size="17" fill="${col}">${t}</text>`;
  let s = cell(1, 1, hw, head(tg.xHead, 'input'), '#4fd3cf', '#1a1e3f') + cell(1, 1 + rh, hw, head(tg.yHead, 'output'), '#ffbe5c', '#1a1e3f');
  tg.xs.forEach((x, i) => { s += cell(1 + hw + i * cw, 1, cw, String(x), '#efe6f7', '#232850') + cell(1 + hw + i * cw, 1 + rh, cw, String(tg.ys[i]), '#efe6f7', '#232850'); });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI, system-ui, sans-serif">${s}</svg>`;
}

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'other-nonconstant', family: 'couldBeLinear' },
    { subgoal: 'start-value', family: 'startValue' },
    { subgoal: 'far-prediction', family: 'farPredict' },
  ],
  figure: tableFigure,
};
