// GrowthTable: a table of values on a card (an input column t and one or more output columns, one row per input),
// with a bracket between each pair of neighbouring rows and, beside it, the change of the LAST output column twice:
// the ratio ("×1.1", teal) and the difference ("+110", water). It is the model of the lesson: "exponential" means the
// ratio label is the same on every bracket, "linear" means the difference label is. Could move to the kit next to
// linear-functions-slope's TableCard (a table with changes is the third picture of a function after Plane and the
// number line).
//   card     the card, the header names
//   rows     the rows write in, one after another ('?' in pick colour for a hidden value)
//   ratios   the brackets and the ratio labels, one after another
//   diffs    the difference labels, one after another
//   reveal   hidden values turn into their values (link colour): the replay after a miss, never before the answer
// Focus: rings on rows, `hot` = ratio labels drawn in the wrong colour (unequal ratios), `lit` = how many labels glow.
// Pure layout inside a Frame (centred); throws BlockError when the rows do not fit or a label is too wide.
import { type Box, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'GrowthTable';
export type TabStep = 'card' | 'rows' | 'ratios' | 'diffs' | 'reveal';
export interface TabCol { name: string; vals: readonly (string | null)[]; reveal?: readonly (string | null)[]; col?: Paint }
export interface TabParams {
  tName: string; ts: readonly string[]; cols: readonly TabCol[];
  /** labels between rows i and i + 1 of the last column (null = none) */ ratios?: readonly (string | null)[]; diffs?: readonly (string | null)[];
  /** vertical placement in the frame (default centre) */ top?: boolean;
  /** number size (default 60) */ size?: number;
}
export interface TabFocus { ring?: { row: number; col: Paint; k: number }[]; hot?: readonly number[]; dimD?: number; /** only the first n ratio / difference labels (later ones wait) */ rUpto?: number; dUpto?: number; /** row alpha (fade a row out) */ rowA?: (i: number) => number }
export interface TabBlock { readonly box: Box; row(i: number): Box; label(kind: 'ratio' | 'diff', i: number): Box; draw(c: Canvas, p: Progress<TabStep>, f?: TabFocus): void }

const HEAD = 44, CHG = 46;
export function GrowthTable(t: TabParams, fr: Frame, th: Theme): TabBlock {
  const n = t.ts.length, NUM = t.size ?? 60;
  check(n >= 2 && n <= 8 && t.cols.length >= 1 && t.cols.every(c => c.vals.length === n), NAME, 'two to eight rows, one value per input');
  const w = (s: string, size: number, wt = 600) => wordsBox(s, 0, 0, { size, weight: wt }).w;
  const tW = Math.max(130, w(t.tName, HEAD, 650) + 44, ...t.ts.map(s => w(s, NUM) + 50));
  const cW = t.cols.map(c => Math.max(170, w(c.name, HEAD, 650) + 44, ...[...c.vals, ...(c.reveal ?? [])].map(s => w(s ?? '?', NUM, 650) + 56)));
  const rs = t.ratios ?? [], ds = t.diffs ?? [];
  const hasR = rs.some(Boolean), hasD = ds.some(Boolean);
  const rW = hasR ? 60 + Math.max(...rs.map(s => (s ? w(s, CHG, 700) : 0))) + 24 : 0;
  const dW = hasD ? (hasR ? 0 : 60) + Math.max(...ds.map(s => (s ? w(s, CHG, 700) : 0))) + 20 : 0;
  const cardW = tW + cW.reduce((a, b) => a + b, 0), W = cardW + rW + dW;
  check(W <= fr.w + 1, NAME, `the table is too wide (${Math.round(W)} > ${fr.w})`);
  const headH = 100, rowH = Math.min(112, (fr.h - headH - 10) / n);
  check(rowH >= Math.max(76, NUM + 16), NAME, 'the rows do not fit');
  const x0 = fr.x + (fr.w - W) / 2, y0 = t.top ? fr.y : fr.y + (fr.h - headH - rowH * n) / 2;
  const cardX1 = x0 + cardW;
  const rowY = (i: number) => y0 + headH + rowH * (i + 0.5);
  const colX = (j: number) => x0 + tW + cW.slice(0, j).reduce((a, b) => a + b, 0);   // left edge of value column j
  const card = box(x0, y0, cardX1, y0 + headH + rowH * n);
  const midY = (i: number) => (rowY(i) + rowY(i + 1)) / 2;
  const rX = cardX1 + 54, dX = hasR ? cardX1 + rW + 4 : cardX1 + 54;
  const rBox = (i: number) => wordsBox(rs[i] ?? '', rX, midY(i), { size: CHG, weight: 700 });
  const dBox = (i: number) => wordsBox(ds[i] ?? '', dX, midY(i), { size: CHG, weight: 700 });
  const ink = DUSK.cream;

  function draw(c: Canvas, P: Progress<TabStep>, f: TabFocus = {}): void {
    const kc = P.k('card');
    if (kc <= 0) return;
    const { g } = c;
    withAlpha(c, clamp(kc * 1.5), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 16), '#262B57', { seed: 29, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      g.save(); g.strokeStyle = '#4A4F82'; g.lineWidth = 2;
      for (let i = 1; i < n; i++) { const y = y0 + headH + rowH * i; g.beginPath(); g.moveTo(x0 + 16, y); g.lineTo(cardX1 - 16, y); g.stroke(); }
      g.strokeStyle = ink; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0 + 16, y0 + headH); g.lineTo(cardX1 - 16, y0 + headH); g.stroke();
      for (let j = 0; j < t.cols.length; j++) { g.beginPath(); g.moveTo(colX(j), y0 + 16); g.lineTo(colX(j), card.y1 - 16); g.stroke(); }
      g.restore();
      drawWords(c, t.tName, x0 + tW / 2, y0 + headH / 2, 'second', 1, { size: HEAD, align: 'center', weight: 650 });
      t.cols.forEach((cl, j) => drawWords(c, cl.name, colX(j) + cW[j]! / 2, y0 + headH / 2, cl.col ?? 'first', 1, { size: HEAD, align: 'center', weight: 650 }));
    });
    const kr = P.k('rows'), kf = P.k('reveal');
    for (let i = 0; i < n; i++) {
      const k = lag(kr, i, n, 0.5) * (f.rowA?.(i) ?? 1);
      if (k <= 0) continue;
      drawWords(c, t.ts[i]!, x0 + tW / 2, rowY(i), 'ink', k, { size: NUM, align: 'center' });
      t.cols.forEach((cl, j) => {
        const cx = colX(j) + cW[j]! / 2, v = cl.vals[i] ?? null, rv = cl.reveal?.[i] ?? null;
        if (v !== null) { drawWords(c, v, cx, rowY(i), 'ink', k, { size: NUM, align: 'center', weight: 650 }); return; }
        drawWords(c, '?', cx, rowY(i), 'pick', k * (rv !== null ? 1 - clamp(kf * 2) : 1), { size: NUM, align: 'center', weight: 700 });
        if (rv !== null && kf > 0) drawWords(c, rv, cx, rowY(i), 'link', clamp(kf * 2 - 0.6), { size: NUM, align: 'center', weight: 700 });
      });
    }
    const kR = P.k('ratios'), kD = P.k('diffs');
    for (let i = 0; i + 1 < n; i++) {
      const r = rs[i] ?? null, d = ds[i] ?? null;
      const ka = r && i < (f.rUpto ?? n) ? lag(kR, i, n - 1, 0.5) : 0, kd = d && i < (f.dUpto ?? n) ? lag(kD, i, n - 1, 0.5) : 0, kb = Math.max(ka, kd);
      if (kb <= 0) continue;
      g.save(); g.globalAlpha *= clamp(kb); g.strokeStyle = ink; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cardX1 - 6, rowY(i) + 8); g.quadraticCurveTo(cardX1 + 40, midY(i), cardX1 - 6, rowY(i + 1) - 8); g.stroke(); g.restore();
      const hot = f.hot?.includes(i) ?? false;
      if (r) drawWords(c, r, rX, midY(i), hot ? 'wrong' : 'second', ka, { size: CHG, weight: 700 });
      if (d) withAlpha(c, 1 - 0.6 * (f.dimD ?? 0), () => drawWords(c, d, dX, midY(i), 'water', kd, { size: CHG, weight: 700 }));
    }
    for (const R of f.ring ?? []) {
      if (R.k <= 0 || R.row < 0 || R.row >= n) continue;
      const B = row(R.row);
      g.save(); g.globalAlpha *= clamp(R.k); g.strokeStyle = paint(th, R.col, 'line'); g.lineWidth = 5;
      g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, 14); g.stroke(); g.restore();
    }
  }
  function row(i: number): Box { return box(x0 + 8, rowY(i) - rowH / 2 + 6, cardX1 - 8, rowY(i) + rowH / 2 - 6); }
  function label(kind: 'ratio' | 'diff', i: number): Box { return kind === 'ratio' ? rBox(i) : dBox(i); }
  return { box: box(card.x0, card.y0, card.x1 + rW + dW, card.y1), row, label, draw };
}
