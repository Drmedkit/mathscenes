// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): where a pointer points after a quarter turn
// (no guide), the same distance from the pin after a turn, and a point turned on dot paper by its steps. The dot-paper
// question needs its picture, so figure() draws the item's grid (dots, the pin, the point, the numbered candidates).
import type { Item } from '../../runtime/item';
import type { Placement } from '../../placement/types';
import type { GridPic, V } from './turnMaths';

const COL = { line: '#efe6f7', fill: '#232850', hi: '#ffbe5c', second: '#4fd3cf', dot: '#6b70a0' };

/** the item's dot paper as an SVG (y up on the grid, down on the screen) */
export function gridFigure(it: Item): string | null {
  const p = (it as Item & { picture?: GridPic }).picture;
  if (!p || p.kind !== 'grid' || !p.dots?.length) return null;
  const { x0, y0, x1, y1 } = p.win, u = Math.min(34, 320 / Math.max(1, x1 - x0)), pad = 22;
  const W = Math.round((x1 - x0) * u + 2 * pad), H = Math.round((y1 - y0) * u + 2 * pad);
  const X = (q: V) => Math.round(pad + (q[0] - x0) * u), Y = (q: V) => Math.round(pad + (y1 - q[1]) * u);
  const out: string[] = [`<rect width="${W}" height="${H}" rx="10" fill="${COL.fill}"/>`];
  let d = '';
  for (let x = Math.ceil(x0); x <= x1; x++) for (let y = Math.ceil(y0); y <= y1; y++) d += `M${X([x, y])} ${Y([x, y])}h0`;
  out.push(`<path d="${d}" stroke="${COL.dot}" stroke-width="4" stroke-linecap="round"/>`);
  for (const s of p.dots) out.push(`<circle cx="${X(s.p)}" cy="${Y(s.p)}" r="10" fill="${COL.fill}" stroke="${COL.second}" stroke-width="2"/><text x="${X(s.p)}" y="${Y(s.p) + 5}" font-size="13" text-anchor="middle" fill="${COL.second}">${s.label}</text>`);
  if (p.pin && !p.pinHidden) out.push(`<circle cx="${X(p.pin)}" cy="${Y(p.pin)}" r="6" fill="${COL.line}"/><text x="${X(p.pin) + 9}" y="${Y(p.pin) - 8}" font-size="15" font-weight="600" fill="${COL.line}">${p.pinLabel ?? 'P'}</text>`);
  if (p.point) out.push(`<circle cx="${X(p.point.p)}" cy="${Y(p.point.p)}" r="6" fill="${COL.hi}"/><text x="${X(p.point.p) + 9}" y="${Y(p.point.p) - 8}" font-size="15" font-weight="600" fill="${COL.hi}">${p.point.label}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI, system-ui, sans-serif">${out.join('')}</svg>`;
}

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'pointer-endpoint-prediction', family: 'pointer', standalone: true },
    { subgoal: 'external-center', family: 'distance', standalone: true },
    { subgoal: 'rotate-point-grid', family: 'pointTurn' },
  ],
  // the distance family also asks "which dot does A land on?" from a figure with a tile: only its typed question
  use: it => it.family !== 'distance' || it.input === 'num',
  figure: it => (it.family === 'pointTurn' ? gridFigure(it) : null),
};
