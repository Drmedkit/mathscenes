// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): combine the π terms, and the exact area and the
// exact perimeter of a composite figure. The figure questions need their picture: figure() draws the plan (outline,
// holes, dashed seams) with the given lengths, as a small self-contained SVG in the lesson-page colours.
import type { Placement } from '../../placement/types';
import type { Item } from '../../runtime/item';
import type { FigPicture } from './items';
import { type Piece, type Pt, fmt, loopPts, pieceStart, pnText } from './figMaths';

const LINE = '#efe6f7', FILL = '#232850', HI = '#ffbe5c';
const r1 = (x: number) => Math.round(x * 10) / 10;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** the plan of a composite figure with its shown dimensions (y up in the figure, y down in the SVG) */
export function figSvg(p: FigPicture): string {
  const F = p.fig, pts = [...loopPts(F.outer, 8), ...F.holes.flatMap(h => loopPts(h, 8))];
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const W = 240, H = 180, pad = 60, s = Math.min(W / Math.max(x1 - x0, 1e-9), H / Math.max(y1 - y0, 1e-9));
  const P = (q: Pt): Pt => [r1(pad + (q[0] - x0) * s), r1(pad + (y1 - q[1]) * s)];
  const vw = Math.ceil((x1 - x0) * s + 2 * pad), vh = Math.ceil((y1 - y0) * s + 2 * pad);
  const loop = (L: readonly Piece[]) => {
    let d = `M${P(pieceStart(L[0]!)).join(' ')}`;
    for (const pc of L) {
      if (pc.kind === 'seg') { d += `L${P(pc.b).join(' ')}`; continue; }
      const end = P([pc.c[0] + pc.r * Math.cos(pc.t1), pc.c[1] + pc.r * Math.sin(pc.t1)]), rr = r1(pc.r * s);
      // y flips, so a counterclockwise arc in the figure runs counterclockwise on screen too: sweep-flag 0
      d += `A${rr} ${rr} 0 ${Math.abs(pc.t1 - pc.t0) > Math.PI + 1e-9 ? 1 : 0} ${pc.t1 > pc.t0 ? 0 : 1} ${end.join(' ')}`;
    }
    return `${d}Z`;
  };
  const body = [`<path d="${[loop(F.outer), ...F.holes.map(loop)].join('')}" fill="${FILL}" fill-rule="evenodd" stroke="${LINE}" stroke-width="2.5" stroke-linejoin="round"/>`];
  if (p.seam !== 'none') for (const sm of F.seams) { const a = P(sm.a), b = P(sm.b); body.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${LINE}" stroke-width="1.5" stroke-dasharray="5 5" opacity=".7"/>`); }
  const unit = p.unit ? ` ${p.unit}` : '';
  const text = (q: Pt, t: string, col = LINE) => body.push(`<text x="${r1(q[0])}" y="${r1(q[1] + 5)}" fill="${col}" font-size="15" font-family="sans-serif" text-anchor="middle">${esc(t)}</text>`);
  for (const ds of p.dims) {
    const d = F.dims.find(x => x.id === ds.id);
    if (!d) continue;
    const t = ds.text ?? (d.kind === 'arc' ? `${pnText(d.value)}${unit}` : `${fmt(d.value)}${unit}`), col = ds.text === '?' ? HI : LINE;
    if (d.kind === 'edge') {
      // a dimension line beside the measured feature (with end ticks), the value beyond it, as on the lesson page
      const a = P(d.a), b = P(d.b), n: Pt = [d.n[0], -d.n[1]], g = 12 + (d.extra ?? 0) * 0.3;
      const a2: Pt = [r1(a[0] + n[0] * g), r1(a[1] + n[1] * g)], b2: Pt = [r1(b[0] + n[0] * g), r1(b[1] + n[1] * g)];
      const tk = (q: Pt) => `M${r1(q[0] - n[0] * 5)} ${r1(q[1] - n[1] * 5)}L${r1(q[0] + n[0] * 5)} ${r1(q[1] + n[1] * 5)}`;
      body.push(`<path d="M${a2.join(' ')}L${b2.join(' ')}${tk(a2)}${tk(b2)}" stroke="${LINE}" stroke-width="1.2" opacity=".75"/>`);
      const off = 14 + Math.abs(n[0]) * 18;
      text([(a2[0] + b2[0]) / 2 + n[0] * off, (a2[1] + b2[1]) / 2 + n[1] * off], t, col);
    } else if (d.kind === 'arc') {
      const pc = [...F.outer, ...F.holes.flat()].find(x => x.id === d.piece);
      if (!pc || pc.kind !== 'arc') continue;
      const tm = (pc.t0 + pc.t1) / 2, m = P([pc.c[0] + pc.r * Math.cos(tm), pc.c[1] + pc.r * Math.sin(tm)]);
      text([m[0] + Math.cos(tm) * 26, m[1] - Math.sin(tm) * 22], t, col);
    } else {
      const u: Pt = [Math.cos(d.ang), Math.sin(d.ang)], a = P(d.diam ? [d.c[0] - u[0] * d.r, d.c[1] - u[1] * d.r] : d.c), b = P([d.c[0] + u[0] * d.r, d.c[1] + u[1] * d.r]);
      body.push(`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${HI}" stroke-width="2"/>`);
      // the label sits beside the line (on its normal), on the side of `toward`
      const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], to = P(d.toward), dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      let nx = -(b[1] - a[1]) / dl, ny = (b[0] - a[0]) / dl;
      if ((to[0] - m[0]) * nx + (to[1] - m[1]) * ny < 0 || (Math.abs(ny) > 0.9 && to[1] === m[1] && ny > 0)) { nx = -nx; ny = -ny; }
      text([m[0] + nx * 16, m[1] + ny * 16], t, col);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}">${body.join('')}</svg>`;
}

export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 's2-combine-pi-terms', family: 'combine', standalone: true },
    { subgoal: 's2-composite-area-add', family: 'areaAdd' },
    { subgoal: 's2-composite-perimeter', family: 'perimAdd' },
  ],
  figure: (it: Item) => {
    const pic = (it as Item & { picture?: FigPicture }).picture;
    return pic && pic.kind === 'fig' && (it.family === 'areaAdd' || it.family === 'perimAdd') ? figSvg(pic) : null;
  },
  errorLabel: {
    'mc.area-perimeter.includes-inside-segments-in-perimeter': 'Counts the seam inside the figure as part of the perimeter',
  },
};
