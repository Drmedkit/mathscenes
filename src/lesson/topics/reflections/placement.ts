// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): count squares from a point to a vertical or
// horizontal line of reflection, how far a vertex moves, and diagonal steps to a 45° line. All three are read off the
// grid, so figure() draws the item's sheet (grid, line m, the figure, the points) as a small SVG.
import type { Item } from '../../runtime/item';
import type { Placement } from '../../placement/types';
import { type MirrorPic, type Pt, lineInSheet } from './mirrorMaths';

const COL = { line: '#efe6f7', fill: '#232850', hi: '#ffbe5c', second: '#4fd3cf', grid: '#3a3f6e' };
const r1 = (v: number) => Math.round(v * 10) / 10;

/** the item's sheet as an SVG: y goes up on the grid, down on the screen */
export function mirrorFigure(it: Item): string | null {
  const p = (it as Item & { pic?: MirrorPic }).pic;
  if (!p || !p.line) return null;
  const u = Math.min(26, 340 / p.cols), pad = 18, W = p.cols * u + 2 * pad, H = p.rows * u + 2 * pad;
  const X = (q: Pt) => r1(pad + q[0] * u), Y = (q: Pt) => r1(pad + (p.rows - q[1]) * u);
  const out: string[] = [];
  out.push(`<rect x="${pad}" y="${pad}" width="${r1(p.cols * u)}" height="${r1(p.rows * u)}" fill="${COL.fill}"/>`);
  if (p.grid) {
    let d = '';
    for (let i = 0; i <= p.cols; i++) d += `M${r1(pad + i * u)} ${pad}V${r1(pad + p.rows * u)}`;
    for (let j = 0; j <= p.rows; j++) d += `M${pad} ${r1(pad + j * u)}H${r1(pad + p.cols * u)}`;
    out.push(`<path d="${d}" stroke="${COL.grid}" stroke-width="1" fill="none"/>`);
  }
  const ends = lineInSheet(p.line, p.cols, p.rows);
  if (ends) {
    const [a, b] = ends;
    out.push(`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${COL.line}" stroke-width="3"/>`);
    out.push(`<text x="${X(b) + (X(b) > W - 30 ? -14 : 6)}" y="${Y(b) + (Y(b) < 30 ? 16 : -6)}" font-size="16" font-style="italic" fill="${COL.line}">m</text>`);
  }
  const label = (q: Pt, t: string, col: string) => `<text x="${X(q) + 7}" y="${Y(q) - 7}" font-size="15" font-weight="600" fill="${col}">${t.replace(/'/g, '′')}</text>`;
  for (const P of p.figure ?? []) {
    out.push(`<polygon points="${P.pts.map(q => `${X(q)},${Y(q)}`).join(' ')}" fill="${COL.hi}" fill-opacity="0.25" stroke="${COL.hi}" stroke-width="2"/>`);
    P.pts.forEach((q, i) => { const t = P.labels?.[i]; if (t) out.push(label(q, t, COL.hi)); });
  }
  for (const s of p.segs ?? []) out.push(`<line x1="${X(s.a)}" y1="${Y(s.a)}" x2="${X(s.b)}" y2="${Y(s.b)}" stroke="${COL.second}" stroke-width="2"${s.dash ? ' stroke-dasharray="5 4"' : ''}/>`);
  for (const pin of p.pins ?? []) {
    out.push(`<circle cx="${X(pin.at)}" cy="${Y(pin.at)}" r="4.5" fill="${COL.hi}"/>`);
    if (pin.label) out.push(label(pin.at, pin.label, COL.hi));
  }
  for (const s of p.spots ?? []) out.push(`<circle cx="${X(s.at)}" cy="${Y(s.at)}" r="9" fill="${COL.fill}" stroke="${COL.second}" stroke-width="2"/><text x="${X(s.at)}" y="${Y(s.at) + 5}" font-size="13" text-anchor="middle" fill="${COL.second}">${s.n}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(W)} ${r1(H)}" width="${r1(W)}" height="${r1(H)}" font-family="Segoe UI, system-ui, sans-serif">${out.join('')}</svg>`;
}

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'grid-point-reflect', family: 'stepsNum' },
    { subgoal: 'fixed-points', family: 'fixed' },
    { subgoal: 'diagonal-grid-reflect', family: 'stepsNum' },
  ],
  figure: mirrorFigure,
};
