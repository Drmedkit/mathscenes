// DegreeShelf: a polynomial as signed term cards on a shelf with one column per power (x^4 … x, then numbers).
// Every card carries its own sign (the minus belongs to the term after it). Cards are washed in their degree's
// colour. A polynomial can first lie loose in its WRITTEN order on a strip above the shelf; 'sort' slides every card
// down into its power's column, so reading the shelf left to right is the standard form, an empty column is a missing
// power (coefficient 0), and the leftmost filled column is the degree. Like terms land in the same column (stacked).
// Rows: one polynomial per row (adding = two rows over one shelf; vertical layout with gaps for missing powers).
// 'flip' turns every card of a row into its opposite (the opposite of a whole polynomial; subtraction adds it);
// focus.flipOnly flips only some cards (the slip: the minus reaches only the first term). 'sum' writes each column's
// total under a rule (a cancelled column shows a faint 0).
//
// Steps: shelf (columns and headers), loose (row 0 as written, on the strip), sort (row 0 into its columns),
//        rows (the other rows drop in), flip (the flip row turns), sum (column totals).
// Could move to the kit: a place-value-like "power shelf" for polynomial addition and subtraction.
import { type Box, box, clamp, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { degRole } from './poly';

export interface ShelfCard { tex: string; deg: number; flipTex?: string }
export interface ShelfParams {
  /** the highest power column (columns maxDeg … 0) */
  maxDeg: number;
  rows: { cards: ShelfCard[]; label?: string }[];
  /** row 0 starts loose, in written order, on a strip above the shelf */
  loose?: boolean;
  /** the row that flips at 'flip' (default none) */
  flipRow?: number;
  /** the column totals [maxDeg … 0]: TeX or null (nothing / cancelled) */
  sum?: (string | null)[];
}
export type ShelfStep = 'shelf' | 'loose' | 'sort' | 'rows' | 'flip' | 'sum';
export interface ShelfFocus {
  /** ring a column (by power) */
  colRing?: { d: number; col: Paint; k: number }[];
  /** ring single cards [row, index in row] */
  cardRing?: { r: number; i: number; col: Paint; k: number }[];
  /** per-card flip progress of the flip row (overrides P.k('flip')): flip the cards one by one, or only some (the slip) */
  flipK?: readonly number[];
  /** sum cells asked: a '?' until reveal */
  askSum?: { d: number; reveal: number }[];
  /** strike a sum cell (wrong), by power */
  strikeSum?: { d: number; k: number }[];
  /** hide the row labels' words */
  noLabels?: boolean;
}
export interface ShelfBlock {
  readonly kind: 'DegreeShelf';
  readonly where: { all: Box; col(d: number): Box; card(r: number, i: number): Box; sum(d: number): Box };
  draw(c: Canvas, P: Progress<ShelfStep>, f?: ShelfFocus): void;
}
const NAME = 'DegreeShelf';
const INK_ON_WASH = '#101330';

export function DegreeShelf(p: ShelfParams, fr: Frame, th: Theme): ShelfBlock {
  const D = p.maxDeg, nCol = D + 1;
  check(D >= 0 && D <= 4, NAME, 'powers 0-4 only');
  check(p.rows.length >= 1 && p.rows.length <= 3, NAME, '1-3 rows');
  for (const r of p.rows) for (const cd of r.cards) check(cd.deg >= 0 && cd.deg <= D, NAME, 'a card outside the shelf');
  const FR = p.rows.map(r => r.cards.map(cd => ({ F: tex(cd.tex) as Formula, G: cd.flipTex ? (tex(cd.flipTex) as Formula) : null })));
  const FS = (p.sum ?? []).map(s => (s ? (tex(s) as Formula) : null));
  const F0 = tex('0') as Formula, FQ = tex('?') as Formula;
  const head = Array.from({ length: nCol }, (_, j) => { const d = D - j; return d === 0 ? null : (tex(d === 1 ? 'x' : `x^{${d}}`) as Formula); });
  let SZ = 70;
  const labelW = p.rows.some(r => r.label) ? 70 : 0;
  const X0 = fr.x + labelW, X1 = fr.x + fr.w;
  const colW = (X1 - X0) / nCol;
  const colX = (d: number) => X0 + (D - d) * colW;
  const allTex = [...FR.flat().flatMap(c => [c.F, c.G]), ...FS].filter(Boolean) as Formula[];
  while (SZ > 60 && allTex.some(F => texWidth(F, SZ) > colW - 36)) SZ -= 2;
  check(allTex.every(F => texWidth(F, SZ) <= colW - 26), NAME, 'a card is wider than its column');
  // loose strip: the cards of row 0 in written order, centred
  const looseW = p.loose ? FR[0]!.map(c => Math.max(texWidth(c.F, SZ), c.G ? texWidth(c.G, SZ) : 0) + 44) : [];
  const gap = 18, looseTot = looseW.reduce((a, b) => a + b, 0) + gap * Math.max(0, looseW.length - 1);
  check(!p.loose || looseTot <= fr.w, NAME, 'the written polynomial does not fit on the strip');
  // rows: each row as tall as its tallest stack of like cards
  const cardH = SZ * 1.45, stackOf = (r: number) => Math.max(1, ...Array.from({ length: nCol }, (_, j) => p.rows[r]!.cards.filter(cd => cd.deg === D - j).length));
  // the whole picture is centred in the frame (vertically, a little above the middle)
  const rowsH = p.rows.reduce((s, _, r) => s + stackOf(r) * (cardH + 12) + 18, 0);
  const H = (p.loose ? 200 : 0) + 30 + 70 + rowsH + 30 + (p.sum ? cardH + 10 : 0) + 40;
  check(H <= fr.h, NAME, 'the shelf is too tall');
  const top = fr.y + Math.max(0, (fr.h - H) * 0.4);
  const headY = top + (p.loose ? 200 : 0) + 70;
  const rowY0: number[] = [];
  let y = headY + 70;
  for (let r = 0; r < p.rows.length; r++) { rowY0.push(y); y += stackOf(r) * (cardH + 12) + 18; }
  const sumY0 = y + 30;
  const yEnd = sumY0 + (p.sum ? cardH + 10 : 0);
  const looseY = top + 90;
  const cardBoxAt = (r: number, i: number): Box => {
    const cd = p.rows[r]!.cards[i]!, j = p.rows[r]!.cards.filter((x, k) => k < i && x.deg === cd.deg).length;
    const x = colX(cd.deg), yy = rowY0[r]! + j * (cardH + 12);
    return box(x + 10, yy, x + colW - 10, yy + cardH);
  };
  const looseBox = (i: number): Box => {
    let x = fr.x + (fr.w - looseTot) / 2;
    for (let k = 0; k < i; k++) x += looseW[k]! + gap;
    return box(x, looseY - cardH / 2, x + looseW[i]!, looseY + cardH / 2);
  };
  const sumBox = (d: number) => box(colX(d) + 10, sumY0, colX(d) + colW - 10, sumY0 + cardH);
  const all = box(X0, headY - 40, X1, yEnd);
  if (labelW) for (const r of p.rows) if (r.label) check(wordsBox(r.label, 0, 0, { size: 44 }).w <= labelW - 6, NAME, 'row label too wide');

  function card(c: Canvas, b: Box, col: Paint, F: Formula, k: number, seed: number, G: Formula | null = null, flipK = 0): void {
    if (k <= 0) return;
    // the flip: the card squeezes to a line and opens as its opposite
    const sx = G && flipK > 0 ? Math.abs(Math.cos(Math.PI * clamp(flipK))) : 1;
    const showG = !!G && flipK >= 0.5;
    const { g } = c;
    g.save(); g.translate(b.cx, b.cy); g.scale(Math.max(0.04, sx), 1); g.translate(-b.cx, -b.cy);
    wash(c, rectPts(b.x0, b.y0, b.w, b.h, 12), col, { seed, rough: 1.2, alpha: clamp(k) * 0.85, inkW: 2.5 });
    texDraw(c, showG ? G! : F, b.cx, b.cy, { size: SZ, align: 'center', k: clamp(k * 1.3 - 0.3), col: INK_ON_WASH });
    g.restore();
  }
  function ring(c: Canvas, b: Box, col: Paint, k: number, pad = 8): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 6;
    g.beginPath(); g.roundRect(b.x0 - pad, b.y0 - pad, b.w + 2 * pad, b.h + 2 * pad, 16); g.stroke(); g.restore();
  }
  function draw(c: Canvas, P: Progress<ShelfStep>, f: ShelfFocus = {}): void {
    const kSh = P.k('shelf'), kL = P.k('loose'), kSo = P.k('sort'), kR = P.k('rows'), kF = P.k('flip'), kSu = P.k('sum');
    if (kSh <= 0 && kL <= 0) return;
    const { g } = c;
    // the shelf: column bands and headers
    if (kSh > 0) {
      const a = E.smooth(clamp(kSh));
      for (let j = 0; j < nCol; j++) {
        const d = D - j, x = colX(d);
        g.save(); g.globalAlpha *= a * 0.55; g.fillStyle = j % 2 ? '#1F2349' : '#242956';
        g.beginPath(); g.roundRect(x + 4, headY - 40, colW - 8, yEnd - headY + 40, 14); g.fill(); g.restore();
        const H = head[j];
        if (H) texDraw(c, H, x + colW / 2, headY, { size: 60, align: 'center', k: kSh, col: degRole(d) });
        else drawWords(c, 'number', x + colW / 2, headY, degRole(0), kSh, { size: 44, align: 'center' });
      }
      if (p.sum) {
        g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3.5;
        g.beginPath(); g.moveTo(X0 + 8, sumY0 - 18); g.lineTo(X1 - 8, sumY0 - 18); g.stroke(); g.restore();
      }
      if (labelW && !f.noLabels) p.rows.forEach((r, i) => { if (r.label) drawWords(c, r.label, fr.x + 4, rowY0[i]! + cardH / 2, 'dim', kSh, { size: 44 }); });
      if (labelW && p.sum && !f.noLabels) drawWords(c, '=', fr.x + 14, sumY0 + cardH / 2, 'dim', kSh, { size: 52 });
    }
    // rows
    p.rows.forEach((row, r) => {
      row.cards.forEach((cd, i) => {
        const target = cardBoxAt(r, i);
        let b = target, k: number;
        if (r === 0 && p.loose) {
          const from = looseBox(i), t = E.inOut(clamp(kSo * 1.25 - (i / Math.max(1, row.cards.length)) * 0.25));
          b = box(lerp(from.x0, target.x0, t), lerp(from.y0, target.y0, t), lerp(from.x1, target.x1, t), lerp(from.y1, target.y1, t));
          k = kL;
        } else k = r === 0 ? kSh : clamp(kR * row.cards.length - i * 0.8);
        const flips = p.flipRow === r;
        const FF = FR[r]![i]!;
        card(c, b, degRole(cd.deg), FF.F, k, 400 + r * 20 + i, flips ? FF.G : null, flips ? (f.flipK ? f.flipK[i] ?? 0 : kF) : 0);
      });
    });
    // column totals
    if (p.sum && kSu > 0) {
      for (let j = 0; j < nCol; j++) {
        const d = D - j, b = sumBox(d), F = FS[j] ?? null;
        const kk = clamp(kSu * nCol - j * 0.8);
        if (kk <= 0) continue;
        const asked = f.askSum?.find(a => a.d === d);
        if (!F) { texDraw(c, F0, b.cx, b.cy, { size: SZ, align: 'center', k: kk, col: 'faint' }); continue; }
        if (asked && asked.reveal < 1) {
          wash(c, rectPts(b.x0, b.y0, b.w, b.h, 12), 'pick', { seed: 700 + j, rough: 1.2, alpha: kk * 0.5 * (1 - asked.reveal), inkW: 2.5 });
          texDraw(c, FQ, b.cx, b.cy, { size: SZ, align: 'center', k: kk, alpha: 1 - asked.reveal, col: INK_ON_WASH });
          if (asked.reveal > 0) card(c, b, degRole(d), F, asked.reveal, 720 + j);
        } else card(c, b, degRole(d), F, kk, 720 + j);
      }
    }
    for (const s of f.strikeSum ?? []) {
      if (s.k <= 0) continue;
      const b = sumBox(s.d);
      g.save(); g.globalAlpha *= clamp(s.k); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(b.x0 + 10, b.y1 - 8); g.lineTo(b.x0 + 10 + (b.w - 20) * clamp(s.k), b.y1 - 8 - (b.h - 16) * clamp(s.k)); g.stroke(); g.restore();
    }
    for (const R of f.colRing ?? []) ring(c, box(colX(R.d) + 6, headY - 36, colX(R.d) + colW - 6, yEnd - 4), R.col, R.k, 0);
    for (const R of f.cardRing ?? []) ring(c, R.r === 0 && p.loose && kSo < 0.5 ? looseBox(R.i) : cardBoxAt(R.r, R.i), R.col, R.k, 6);
  }
  return { kind: 'DegreeShelf', where: { all, col: d => box(colX(d), headY - 40, colX(d) + colW, yEnd), card: cardBoxAt, sum: sumBox }, draw };
}
