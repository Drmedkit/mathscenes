// TableCard: a table of values on a card (the input column and the output column, one row per pair), with the
// changes between rows written beside it ("+3 → −6") and rings on rows. Could move to the kit (a table is the third
// picture of a function next to the Plane and the number line). Steps: 'card' (the card, the header), 'rows' (the
// rows, one after another), 'diffs' (the changes), 'fill' (hidden cells turn into their values). Focus: rings on rows.
// Pure layout inside a Frame; throws BlockError when the rows do not fit or a label is too wide.
import { type Box, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import type { TPic } from './graphPic';

const NAME = 'TableCard';
export type TableStep = 'card' | 'rows' | 'diffs' | 'fill';
export interface TableFocus { ring?: { row: number; col: Paint; k: number }[] }
export interface TableBlock { readonly box: Box; row(i: number): Box; draw(c: Canvas, p: Progress<TableStep>, f?: TableFocus): void }

const NUM = 62, HEAD = 46, CHG = 46;
const fmt = (v: number) => { const r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };
const signed = (v: number) => (v >= 0 ? '+' : '−') + String(Math.abs(Math.round(v * 1000) / 1000));

export function TableCard(t: TPic, fr: Frame, th: Theme): TableBlock {
  const n = t.xs.length;
  check(n >= 2 && n <= 7 && t.ys.length === n, NAME, 'two to seven rows, one output per input');
  const diffs = !!t.diffs;
  const colW = Math.max(220, ...[t.xName, t.yName].map(s => wordsBox(s, 0, 0, { size: HEAD, weight: 650 }).w + 50));
  const chgW = diffs ? 330 : 0;
  const W = colW * 2 + chgW, x0 = fr.x + (fr.w - W) / 2;
  check(W <= fr.w, NAME, 'the table is too wide');
  const headH = 110, rowH = Math.min(118, (fr.h - headH - 60) / n);
  check(rowH >= 84, NAME, 'the rows do not fit');
  const y0 = fr.y + (fr.h - headH - rowH * n) / 2;
  const cardX1 = x0 + colW * 2;
  const rowY = (i: number) => y0 + headH + rowH * (i + 0.5);
  const card = box(x0, y0, cardX1, y0 + headH + rowH * n);
  // the changes: input change and output change between consecutive rows (rows as listed)
  const chg = t.xs.slice(1).map((x, i) => {
    const dx = x - t.xs[i]!, a = Number(t.ys[i]!.replace('−', '-')), b = Number(t.ys[i + 1]!.replace('−', '-'));
    return { dx, dy: Number.isFinite(a) && Number.isFinite(b) ? b - a : NaN, y: (rowY(i) + rowY(i + 1)) / 2 };
  });
  for (const v of [...t.xs.map(fmt), ...t.ys, ...(t.ysSolved ?? [])]) check(wordsBox(v, 0, 0, { size: NUM }).w < colW - 30, NAME, `the value ${v} is too wide`);
  const ink = DUSK.cream;
  function draw(c: Canvas, P: Progress<TableStep>, f: TableFocus = {}): void {
    const kc = P.k('card');
    if (kc <= 0) return;
    const { g } = c;
    withAlpha(c, clamp(kc * 1.5), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 16), '#262B57', { seed: 23, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
      for (let i = 1; i < n; i++) { const y = y0 + headH + rowH * i; g.beginPath(); g.moveTo(x0 + 16, y); g.lineTo(cardX1 - 16, y); g.stroke(); }
      g.strokeStyle = ink; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0 + 16, y0 + headH); g.lineTo(cardX1 - 16, y0 + headH); g.stroke();
      g.beginPath(); g.moveTo(x0 + colW, y0 + 16); g.lineTo(x0 + colW, card.y1 - 16); g.stroke();
      g.restore();
      drawWords(c, t.xName, x0 + colW / 2, y0 + headH / 2, 'second', 1, { size: HEAD, align: 'center', weight: 650 });
      drawWords(c, t.yName, x0 + colW * 1.5, y0 + headH / 2, 'first', 1, { size: HEAD, align: 'center', weight: 650 });
    });
    const kr = P.k('rows'), kf = P.k('fill');
    for (let i = 0; i < n; i++) {
      const k = lag(kr, i, n, 0.5);
      if (k <= 0) continue;
      drawWords(c, fmt(t.xs[i]!), x0 + colW / 2, rowY(i), 'ink', k, { size: NUM, align: 'center' });
      const hidden = (t.hide ?? []).includes(i);
      if (hidden) {
        drawWords(c, '?', x0 + colW * 1.5, rowY(i), 'pick', k * (1 - kf), { size: NUM, align: 'center', weight: 700 });
        if (kf > 0) drawWords(c, t.ysSolved?.[i] ?? t.ys[i]!, x0 + colW * 1.5, rowY(i), 'link', kf, { size: NUM, align: 'center', weight: 700 });
      } else drawWords(c, t.ys[i]!, x0 + colW * 1.5, rowY(i), 'ink', k, { size: NUM, align: 'center' });
    }
    const kd = P.k('diffs');
    if (diffs && kd > 0) chg.forEach((d, i) => {
      const k = lag(kd, i, chg.length, 0.4);
      if (k <= 0) return;
      const tx = cardX1 + 26;
      // a bracket joining the two rows, then the input change and the output change
      g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = ink; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cardX1 - 6, rowY(i) + 6); g.quadraticCurveTo(tx + 6, d.y, cardX1 - 6, rowY(i + 1) - 6); g.stroke(); g.restore();
      drawWords(c, signed(d.dx), tx + 20, d.y, 'second', k, { size: CHG, weight: 700 });
      if (Number.isFinite(d.dy)) drawWords(c, signed(d.dy), tx + 160, d.y, 'first', k, { size: CHG, weight: 700 });
    });
    for (const r of f.ring ?? []) {
      if (r.k <= 0 || r.row < 0 || r.row >= n) continue;
      const B = row(r.row);
      g.save(); g.globalAlpha *= clamp(r.k); g.strokeStyle = paint(th, r.col, 'line'); g.lineWidth = 5;
      g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 14); g.stroke(); g.restore();
    }
  }
  function row(i: number): Box { return box(x0 + 8, rowY(i) - rowH / 2 + 6, cardX1 - 8, rowY(i) + rowH / 2 - 6); }
  return { box: diffs ? box(card.x0, card.y0, card.x1 + chgW, card.y1) : card, row, draw };
}
