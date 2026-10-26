// Grid: one big square unit (1 ft²) drawn as an n x n grid of small square units (12 x 12 in²): the side is n small
// units long, so ONE row holds n small squares and the whole square holds n x n. The tempting slip (use the length
// factor for an area) is the single row; the fill shows why the factor is squared. Optional room: an a x b floor of
// big squares on the left, one of them picked and zoomed into the grid. Optional cube (cubic units): an oblique
// n x n x n block whose front face is the square, with the layers behind it.
// Steps: room, pick, square, side, row, fill, layers.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { wash, inkLine } from '../../wash';
import { drawWords, wordsBox } from '../../words';

const NAME = 'Grid';
export type GridStep = 'room' | 'pick' | 'square' | 'side' | 'row' | 'fill' | 'layers';
export interface GridParams {
  n: number; big: string; small: string;
  /** a floor of a x b big squares, drawn on the left */ room?: [number, number];
  cube?: boolean;
  /** label of the side in big units (default "1 ft") */ bigSide?: string;
}
export interface GridBlock { readonly kind: 'Grid'; readonly where: { square: Box; row: Box; room: Box }; draw(c: Canvas, P: Progress<GridStep>, f?: { wrongRow?: number }): void }

const LAB = 46;

export function Grid(p: GridParams, fr: Frame, th: Theme): GridBlock {
  check(p.n >= 2 && p.n <= 12, NAME, 'n from 2 to 12');
  const hasRoom = !!p.room;
  // the zoomed square: right part when there is a room, else centred
  const side = Math.min(fr.h - 150, hasRoom ? fr.w * 0.42 : p.cube ? (fr.h - 130) / 1.34 : fr.h - 150);
  const depth = p.cube ? side * 0.45 : 0;
  const sx = hasRoom ? fr.x + fr.w - side - 140 : fr.x + (fr.w - side - depth) / 2;
  const sy = fr.y + 70 + depth * 0.75;
  const cell = side / p.n;
  check(cell >= 18, NAME, 'cells too small');
  const sq = box(sx, sy, sx + side, sy + side);
  // the room
  const [ra, rb] = p.room ?? [1, 1];
  const rCell = hasRoom ? Math.min((fr.w * 0.42) / ra, (fr.h - 170) / rb) : 0;
  const rx = fr.x + 110, ry = fr.y + 70 + (fr.h - 170 - rCell * rb) / 2;
  const room = box(rx, ry, rx + rCell * ra, ry + rCell * rb);
  const pickCell = box(rx + rCell * (ra - 1), ry, rx + rCell * ra, ry + rCell);
  const amber = paint(th, 'first', 'fill'), teal = paint(th, 'second', 'fill'), lime = paint(th, 'link', 'fill');

  function gridLines(c: Canvas, B: Box, nx: number, ny: number, col: string, w: number, a: number): void {
    const g = c.g; g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = w;
    for (let i = 1; i < nx; i++) { const x = B.x0 + (i / nx) * B.w; g.beginPath(); g.moveTo(x, B.y0); g.lineTo(x, B.y1); g.stroke(); }
    for (let j = 1; j < ny; j++) { const y = B.y0 + (j / ny) * B.h; g.beginPath(); g.moveTo(B.x0, y); g.lineTo(B.x1, y); g.stroke(); }
    g.restore();
  }
  function draw(c: Canvas, P: Progress<GridStep>, f: { wrongRow?: number } = {}): void {
    const g = c.g;
    if (hasRoom) {
      const kR = clamp(P.k('room'));
      if (kR > 0) withAlpha(c, kR, () => {
        wash(c, [[room.x0, room.y0], [room.x1, room.y0], [room.x1, room.y1], [room.x0, room.y1]], '#8C6A4E', { seed: 11, inkW: 3, shade: 0.25, rough: 0.8 });
        gridLines(c, room, ra, rb, 'rgba(34,27,46,0.55)', 2, 1);
        drawWords(c, `${ra} ft`, room.cx, room.y1 + 44, 'first', 1, { size: LAB, align: 'center' });
        drawWords(c, `${rb} ft`, room.x0 - 20, room.cy, 'first', 1, { size: LAB, align: 'right' });
      });
      const kP = clamp(P.k('pick'));
      if (kP > 0) {
        g.save(); g.globalAlpha *= kP; g.fillStyle = teal; g.globalAlpha *= 0.55; g.fillRect(pickCell.x0, pickCell.y0, pickCell.w, pickCell.h); g.restore();
        g.save(); g.globalAlpha *= kP; g.strokeStyle = teal; g.lineWidth = 4; g.setLineDash([10, 8]);
        g.beginPath(); g.moveTo(pickCell.x1, pickCell.y0); g.lineTo(sq.x0, sq.y0); g.moveTo(pickCell.x1, pickCell.y1); g.lineTo(sq.x0, sq.y1); g.stroke(); g.restore();
      }
    }
    const kS = clamp(P.k('square'));
    if (kS <= 0) return;
    const kL = clamp(P.k('layers'));
    withAlpha(c, kS, () => {
      if (p.cube) {
        // top and side faces (oblique), gridded, under the front face
        const d = depth, dx = d * 0.9, dy = -d * 0.75;
        const top: [number, number][] = [[sq.x0, sq.y0], [sq.x1, sq.y0], [sq.x1 + dx, sq.y0 + dy], [sq.x0 + dx, sq.y0 + dy]];
        const rs: [number, number][] = [[sq.x1, sq.y0], [sq.x1 + dx, sq.y0 + dy], [sq.x1 + dx, sq.y1 + dy], [sq.x1, sq.y1]];
        wash(c, top, '#4C8FB0', { seed: 14, inkW: 3, shade: 0.2, rough: 0.6 });
        wash(c, rs, '#2F6B88', { seed: 15, inkW: 3, shade: 0.3, rough: 0.6 });
        g.save(); g.strokeStyle = 'rgba(16,19,48,0.6)'; g.lineWidth = 2; g.globalAlpha *= 0.4 + 0.6 * kL;
        for (let i = 1; i < p.n; i++) {
          const t = i / p.n;
          g.beginPath(); g.moveTo(sq.x0 + t * side, sq.y0); g.lineTo(sq.x0 + t * side + dx, sq.y0 + dy); g.stroke();
          g.beginPath(); g.moveTo(sq.x0 + t * dx, sq.y0 + t * dy); g.lineTo(sq.x1 + t * dx, sq.y0 + t * dy); g.stroke();
          g.beginPath(); g.moveTo(sq.x1 + t * dx, sq.y0 + t * dy); g.lineTo(sq.x1 + t * dx, sq.y1 + t * dy); g.stroke();
          g.beginPath(); g.moveTo(sq.x1, sq.y0 + t * side); g.lineTo(sq.x1 + dx, sq.y0 + t * side + dy); g.stroke();
        }
        g.restore();
        if (kL > 0) drawWords(c, `${p.n} layers`, sq.x1 + dx + 24, sq.y0 + dy / 2 + 10, 'second', kL, { size: LAB });
      }
      wash(c, [[sq.x0, sq.y0], [sq.x1, sq.y0], [sq.x1, sq.y1], [sq.x0, sq.y1]], '#3F7FA0', { seed: 12, inkW: 4, shade: 0.2, rough: 0.6 });
    });
    // fill: rows of small squares light up one after another (the row step = the first row only)
    const kRow = clamp(P.k('row')), kF = clamp(P.k('fill'));
    const rows = kF > 0 ? kF * p.n : 0;
    for (let j = 0; j < p.n; j++) {
      const a = j === 0 ? Math.max(kRow, clamp(rows)) : clamp(rows - j);
      if (a <= 0) continue;
      const wrong = j === 0 && (f.wrongRow ?? 0) > 0;
      g.save(); g.globalAlpha *= a * 0.6; g.fillStyle = wrong ? paint(th, 'wrong', 'fill') : j === 0 && kF <= 0 ? amber : lime;
      g.fillRect(sq.x0, sq.y1 - (j + 1) * cell, side, cell); g.restore();
    }
    gridLines(c, sq, p.n, p.n, 'rgba(16,19,48,0.7)', 2.2, kS);
    const kSd = clamp(P.k('side'));
    if (kSd > 0) {
      drawWords(c, `${p.n} ${p.small}`, sq.cx, sq.y1 + 46, 'first', kSd, { size: LAB, align: 'center' });
      // with a room the left side carries the zoom connectors, so the side label goes on the right
      if (hasRoom) drawWords(c, `${p.n} ${p.small}`, sq.x1 + 22, sq.cy, 'first', kSd, { size: LAB });
      else drawWords(c, `${p.n} ${p.small}`, sq.x0 - 22, sq.cy, 'first', kSd, { size: LAB, align: 'right' });
      drawWords(c, p.bigSide ?? `1 ${p.big}`, sq.cx, sq.y0 - 34 + (p.cube ? -depth * 0.75 - 6 : 0), 'second', kSd * (p.cube ? 0 : 1), { size: LAB, align: 'center' });
      // tick marks of one small unit along the bottom edge
      inkLine(c, [[sq.x0, sq.y1 + 10], [sq.x0 + cell, sq.y1 + 10]], { col: amber, w: 5, seed: 3, alpha: kSd });
    }
  }
  const rowBox = box(sq.x0, sq.y1 - cell, sq.x1, sq.y1);
  check(!hasRoom || room.x1 + 80 < sq.x0, NAME, 'room and square overlap');
  check(wordsBox(`${p.n} ${p.small}`, sq.x0 - 22, sq.cy, { size: LAB, align: 'right' }).x0 >= fr.x, NAME, 'side label leaves the frame');
  return { kind: 'Grid', where: { square: sq, row: rowBox, room }, draw };
}
