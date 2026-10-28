// DataCard: a card of paired data or of technology output, in the lesson's style (washed card, crisp rules, words in the
// page sans). Two shapes: columns (a data table x | y | ŷ, or TI-84 lists L1 | L2, one row per case, a header row) or
// lines (an output screen: "LinReg", "y=a+bx", "a=53.18" …, left aligned under a title). Rows can ring (focus) and a
// cell can be hidden as "?" until the solve. Could move to the kit (any lesson with paired data or calculator output).
// Steps: 'card' (the card and the header / title), 'rows' (the rows, one after another), 'fill' (hidden cells show).
// Pure layout inside a Frame; throws BlockError when the rows do not fit or a value is too wide.
import { type Box, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import type { Card } from './kit';

const NAME = 'DataCard';
export type CardStep = 'card' | 'rows' | 'fill';
export interface CardFocus { ring?: { row: number; col: Paint; k: number }[] }
export interface DataCardBlock { readonly box: Box; row(i: number): Box; draw(c: Canvas, p: Progress<CardStep>, f?: CardFocus): void }

const HEAD = 46, TITLE = 50;
const COLS: Paint[] = ['second', 'first', 'link'];

export function DataCard(s: Card, fr: Frame, th: Theme): DataCardBlock {
  const cols = s.cols ?? [], lines = s.lines ?? [];
  const n = cols.length ? cols[0]!.cells.length : lines.length;
  check(n >= 1 && n <= 12, NAME, 'one to twelve rows');
  check(cols.every(cc => cc.cells.length === n), NAME, 'every column has a cell per row');
  const titleH = s.title ? 96 : 0, headH = cols.length ? 100 : 0;
  const rowH = Math.min(100, (fr.h - titleH - headH - 40) / n);
  check(rowH >= 64, NAME, `the rows do not fit (${n})`);
  const NUM = Math.min(62, Math.round(rowH * 0.66));
  check(NUM >= 56, NAME, 'the numbers would be too small');
  // per-column widths (a wide head does not widen every column)
  let W: number, colWs: number[] = [];
  if (cols.length) {
    colWs = cols.map((cc, j) => Math.max(170, Math.max(wordsBox(cc.head, 0, 0, { size: HEAD, weight: 650 }).w, ...cc.cells.map(v => wordsBox(v, 0, 0, { size: NUM }).w), ...(s.solveCells ?? []).filter(q => q[0] === j).map(q => wordsBox(q[2], 0, 0, { size: NUM, weight: 700 }).w)) + 56));
    W = colWs.reduce((p, q) => p + q, 0);
  } else W = Math.max(360, ...lines.map(t => wordsBox(t, 0, 0, { size: NUM }).w + 100));
  if (s.title) W = Math.max(W, wordsBox(s.title, 0, 0, { size: TITLE, weight: 700 }).w + 80);
  check(W <= fr.w, NAME, 'the card is too wide');
  if (cols.length) { const sum0 = colWs.reduce((p, q) => p + q, 0); colWs = colWs.map(w => (w * W) / sum0); }
  const colX = (j: number) => colWs.slice(0, j).reduce((p, q) => p + q, 0);
  const H = titleH + headH + rowH * n + 30;
  const x0 = fr.x + (fr.w - W) / 2, y0 = fr.y + Math.max(0, (fr.h - H) / 2);
  const card = box(x0, y0, x0 + W, y0 + H);
  const bodyY = y0 + titleH + headH + 15;
  const rowY = (i: number) => bodyY + rowH * (i + 0.5);
  const ink = DUSK.cream;

  function row(i: number): Box { return box(x0 + 10, rowY(i) - rowH / 2 + 4, x0 + W - 10, rowY(i) + rowH / 2 - 4); }
  function draw(c: Canvas, P: Progress<CardStep>, f: CardFocus = {}): void {
    const kc = P.k('card');
    if (kc <= 0) return;
    const { g } = c;
    withAlpha(c, clamp(kc * 1.5), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 16), '#262B57', { seed: 29, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      g.save(); g.lineWidth = 3; g.strokeStyle = ink;
      if (s.title) { g.beginPath(); g.moveTo(x0 + 16, y0 + titleH); g.lineTo(x0 + W - 16, y0 + titleH); g.stroke(); }
      if (cols.length) {
        g.beginPath(); g.moveTo(x0 + 16, y0 + titleH + headH); g.lineTo(x0 + W - 16, y0 + titleH + headH); g.stroke();
        for (let j = 1; j < cols.length; j++) { g.beginPath(); g.moveTo(x0 + colX(j), y0 + titleH + 16); g.lineTo(x0 + colX(j), card.y1 - 16); g.stroke(); }
        g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
        for (let i = 1; i < n; i++) { const y = bodyY + rowH * i; g.beginPath(); g.moveTo(x0 + 16, y); g.lineTo(x0 + W - 16, y); g.stroke(); }
      }
      g.restore();
      if (s.title) drawWords(c, s.title, x0 + W / 2, y0 + titleH / 2 + 4, 'ink', 1, { size: TITLE, align: 'center', weight: 700 });
      cols.forEach((cc, j) => drawWords(c, cc.head, x0 + colX(j) + colWs[j]! / 2, y0 + titleH + headH / 2, COLS[j % 3]!, 1, { size: HEAD, align: 'center', weight: 650 }));
    });
    const kr = P.k('rows'), kf = P.k('fill');
    const fillOf = (j: number, i: number) => (s.solveCells ?? []).find(([a, b]) => a === j && b === i)?.[2];
    for (let i = 0; i < n; i++) {
      const k = lag(kr, i, n, 0.5);
      if (k <= 0) continue;
      if (cols.length) cols.forEach((cc, j) => {
        const cx = x0 + colX(j) + colWs[j]! / 2;
        if (cc.cells[i] === '?') {
          const fill = fillOf(j, i);
          drawWords(c, '?', cx, rowY(i), 'pick', k * (1 - (fill ? kf : 0)), { size: NUM, align: 'center', weight: 700 });
          if (fill && kf > 0) drawWords(c, fill, cx, rowY(i), 'link', kf, { size: NUM, align: 'center', weight: 700 });
        } else drawWords(c, cc.cells[i]!, cx, rowY(i), 'ink', k, { size: NUM, align: 'center' });
      });
      else drawWords(c, lines[i]!, x0 + 50, rowY(i), 'ink', k, { size: NUM, align: 'left' });
    }
    for (const r of f.ring ?? []) {
      if (r.k <= 0 || r.row < 0 || r.row >= n) continue;
      const B = row(r.row);
      g.save(); g.globalAlpha *= clamp(r.k); g.strokeStyle = paint(th, r.col, 'line'); g.lineWidth = 5;
      g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 14); g.stroke(); g.restore();
    }
  }
  return { box: card, row, draw };
}
