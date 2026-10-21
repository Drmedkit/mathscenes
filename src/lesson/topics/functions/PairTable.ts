// PairTable: a relation as a table of (input, output) rows, vertical (two columns) or horizontal (two rows).
//   grid    a dark card with crisp rules and the two names (input amber, output teal)
//   r<i>    one row (pair) writes in: its input in amber, its output in teal
// Focus: a row band in a role colour (link = allowed / the answer, wrong = the witness rows, pick = the row being
// read), a pulse on a row, and dimming of the rows not in focus. Numbers >= 60 px, names >= 44 px; throws when the
// table cannot fit its frame. Pure layout; draw(c, progress, focus) keeps no state.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, strokePts, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { drawWords } from '../../words';
import { tbox as wordsBox } from './text';
import { wash } from '../../wash';
import { type V, hn } from './relation';

const NAME = 'PairTable';
export interface TableParams {
  xs: readonly V[]; ys: readonly V[]; xName: string; yName: string; horizontal?: boolean; align?: 'top' | 'center';
  /** the colour roles of the two columns (default input amber, output teal) */ xCol?: Paint; yCol?: Paint;
}
export interface TableFocus {
  rowCol?: Record<number, Paint>; rowPulse?: Record<number, number>;
  lit?: readonly number[]; dim?: number;
  /** a pulse on the column / row names */ xName?: number; yName?: number;
}
export interface TableBlock {
  readonly kind: 'PairTable';
  readonly box: Box;
  readonly where: { row(i: number): Box; x(i: number): Box; y(i: number): Box; xName: Box; yName: Box };
  draw(c: Canvas, p: Progress<string>, f?: TableFocus): void;
}

const NUM = 60, NAMEW = 44;
const sizeOf = (v: V) => (typeof v === 'number' ? NUM : 50);
const w = (s: string, size: number) => wordsBox(s, 0, 0, { size, weight: 600 }).w;

export function PairTable(p: TableParams, fr: Frame, _th: Theme): TableBlock {
  const n = p.xs.length, XC: Paint = p.xCol ?? 'first', YC: Paint = p.yCol ?? 'second';
  check(n >= 1 && n === p.ys.length, NAME, 'the two columns need the same number of values');
  const xW = Math.max(...p.xs.map(v => w(hn(v), sizeOf(v)))), yW = Math.max(...p.ys.map(v => w(hn(v), sizeOf(v))));
  const nxW = w(p.xName, NAMEW), nyW = w(p.yName, NAMEW);
  let cells: { x: Box; y: Box }[], xNameB: Box, yNameB: Box, card: Box, rules: [number, number][][];
  if (!p.horizontal) {
    const cw0 = Math.max(xW, nxW) + 64, cw1 = Math.max(yW, nyW) + 64, rh = Math.min(92, (fr.h - 90) / (n + 1));
    check(rh >= 76, NAME, `${n} rows do not fit`);
    const W = cw0 + cw1, H = rh * (n + 1);
    check(W <= fr.w, NAME, `the table is ${Math.round(W)} px wide, the frame ${fr.w}`);
    const x0 = fr.x + (fr.w - W) / 2, y0 = p.align === 'center' ? fr.y + (fr.h - H) / 2 : fr.y + 10;
    card = box(x0, y0, x0 + W, y0 + H);
    xNameB = wordsBox(p.xName, x0 + cw0 / 2, y0 + rh / 2, { size: NAMEW, align: 'center' });
    yNameB = wordsBox(p.yName, x0 + cw0 + cw1 / 2, y0 + rh / 2, { size: NAMEW, align: 'center' });
    cells = p.xs.map((_, i) => {
      const cy = y0 + rh * (i + 1.5);
      return { x: box(x0, cy - rh / 2, x0 + cw0, cy + rh / 2), y: box(x0 + cw0, cy - rh / 2, x0 + W, cy + rh / 2) };
    });
    rules = [[[x0 + cw0, y0 + 14], [x0 + cw0, y0 + H - 14]], [[x0 + 14, y0 + rh], [x0 + W - 14, y0 + rh]]];
  } else {
    const hw = Math.max(nxW, nyW) + 60, cw = Math.max(xW, yW) + 48, rh = 104;
    const W = hw + cw * n, H = rh * 2;
    check(W <= fr.w, NAME, `the table is ${Math.round(W)} px wide, the frame ${fr.w}`);
    const x0 = fr.x + (fr.w - W) / 2, y0 = p.align === 'center' ? fr.y + (fr.h - H) / 2 : fr.y + 10;
    card = box(x0, y0, x0 + W, y0 + H);
    xNameB = wordsBox(p.xName, x0 + hw / 2, y0 + rh / 2, { size: NAMEW, align: 'center' });
    yNameB = wordsBox(p.yName, x0 + hw / 2, y0 + rh * 1.5, { size: NAMEW, align: 'center' });
    cells = p.xs.map((_, i) => {
      const cx0 = x0 + hw + cw * i;
      return { x: box(cx0, y0, cx0 + cw, y0 + rh), y: box(cx0, y0 + rh, cx0 + cw, y0 + H) };
    });
    rules = [[[x0 + 14, y0 + rh], [x0 + W - 14, y0 + rh]], ...Array.from({ length: n }, (_, i): [number, number][] => [[x0 + hw + cw * i, y0 + 14], [x0 + hw + cw * i, y0 + H - 14]])];
  }
  const rowBox = (i: number) => (p.horizontal ? box(cells[i]!.x.x0, cells[i]!.x.y0, cells[i]!.y.x1, cells[i]!.y.y1) : box(cells[i]!.x.x0, cells[i]!.x.y0, cells[i]!.y.x1, cells[i]!.y.y1));

  function draw(c: Canvas, P: Progress<string>, f: TableFocus = {}): void {
    const kG = clamp(P.k('grid'));
    if (kG <= 0) return;
    withAlpha(c, kG, () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 18), '#1B1F44', { seed: 41, ink: '#3A3F6B', inkW: 3, rough: 1.2, shade: 0.12 });
      for (const R of rules) strokePts(c, R, { col: '#4A5085', lw: 3, cap: 'butt' });
      const nameRing = (B: Box, col: Paint, k: number) => {
        if (k <= 0) return;
        const g = c.g; g.save(); g.globalAlpha *= clamp(k) * 0.9; g.strokeStyle = paint(c.th, col, 'fill'); g.lineWidth = 4;
        g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 12); g.stroke(); g.restore();
      };
      nameRing(xNameB, XC, f.xName ?? 0); nameRing(yNameB, YC, f.yName ?? 0);
      drawWords(c, p.xName, xNameB.cx, xNameB.cy, XC, 1, { size: NAMEW, align: 'center' });
      drawWords(c, p.yName, yNameB.cx, yNameB.cy, YC, 1, { size: NAMEW, align: 'center' });
    });
    for (let i = 0; i < n; i++) {
      const k = clamp(P.k('r' + i));
      if (k <= 0) continue;
      const R = rowBox(i), col = f.rowCol?.[i], pulse = f.rowPulse?.[i] ?? 0;
      const dimmed = f.lit && !f.lit.includes(i) ? 1 - 0.6 * clamp(f.dim ?? 0) : 1;
      const g = c.g;
      if (col || pulse > 0) {
        const pc = paint(c.th, col ?? 'pick', 'fill');
        g.save(); g.globalAlpha *= k * Math.max(col ? 1 : 0, pulse);
        g.fillStyle = pc; g.globalAlpha *= 0.2; g.beginPath(); g.roundRect(R.x0 + 8, R.y0 + 6, R.w - 16, R.h - 12, 12); g.fill();
        g.globalAlpha /= 0.2; g.strokeStyle = pc; g.lineWidth = 3.5; g.beginPath(); g.roundRect(R.x0 + 8, R.y0 + 6, R.w - 16, R.h - 12, 12); g.stroke();
        g.restore();
      }
      withAlpha(c, dimmed, () => {
        const vx = p.xs[i]!, vy = p.ys[i]!, cx = cells[i]!.x, cyB = cells[i]!.y;
        drawWords(c, hn(vx), cx.cx, cx.cy, col === 'wrong' ? 'wrong' : XC, k, { size: sizeOf(vx), align: 'center' });
        drawWords(c, hn(vy), cyB.cx, cyB.cy, col === 'wrong' ? 'wrong' : YC, k, { size: sizeOf(vy), align: 'center' });
      });
    }
  }
  return {
    kind: 'PairTable', box: unionBox([card, xNameB, yNameB]),
    where: { row: rowBox, x: i => cells[i]!.x, y: i => cells[i]!.y, xName: xNameB, yName: yNameB },
    draw,
  };
}
