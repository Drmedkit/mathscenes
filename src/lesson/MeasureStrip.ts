// MeasureStrip: a measured amount (26 yd of rope, 14 lb of rice) as one painted strip with unit ticks, cut into b
// equal pieces. The tape-diagram stage between the real objects (EqualShare) and the bare notation: the same
// "amount shared ÷ number of shares", read as a LENGTH, so a/b lands between the whole-number ticks.
// Steps: strip, ticks, labelA, labelB, cuts, piece.
import { type Box, box, clamp, lag, rat, type Q, unionBox } from '../core/math';
import { rectPts } from '../core/pts';
import type { Canvas } from '../core/draw';
import { E } from '../core/easing';
import type { Progress } from '../core/clock';
import { type Theme, paint } from '../core/theme';
import { type Formula, tex, texBox, texDraw } from '../core/tex';
import { type Frame, check, plainText } from '../blocks/block';
import { inkLine, wash } from './wash';
import { drawWords, wordsBox } from './words';

export interface MeasureStripParams { a: number; b: number; unit: string; sharers: string }
export type MeasureStripStep = 'strip' | 'ticks' | 'labelA' | 'labelB' | 'cuts' | 'piece';
export interface MeasureStripBlock {
  readonly kind: 'MeasureStrip';
  readonly share: Q;
  readonly where: { strip: Box; piece: Box; labelA: Box; labelB: Box; pieceLabel: Box };
  draw(c: Canvas, p: Progress<MeasureStripStep>): void;
}
const NAME = 'MeasureStrip';

export function MeasureStrip(p: MeasureStripParams, fr: Frame, th: Theme): MeasureStripBlock {
  const { a, b } = p;
  check(Number.isInteger(a) && a >= 1 && a <= 90, NAME, `a = ${a}: 1 to 90 units`);
  check(Number.isInteger(b) && b >= 2 && b <= 12, NAME, `b = ${b}: 2 to 12 pieces`);
  plainText(p.unit, NAME, 'unit'); plainText(p.sharers, NAME, 'sharers');
  const share = rat(a, b), q = Math.floor(a / b), r = a % b;
  const x0 = fr.x + 30, Ls = fr.w - 60, u = Ls / a, T = 74, cy = fr.y + fr.h * 0.5;
  const y0 = cy - T / 2, y1 = cy + T / 2;
  // tick labels: a step so neighbouring labels keep >= 110 px apart
  const step = [1, 2, 5, 10, 20].find(k => k * u >= 110) ?? 30;
  const labels: number[] = [];
  for (let v = 0; v <= a; v += step) labels.push(v);
  if (labels[labels.length - 1] !== a) { if ((a - labels[labels.length - 1]!) * u < 110) labels.pop(); labels.push(a); }
  const numSize = Math.max(th.font.minNum, 60);
  const tickF = new Map<number, Formula>(labels.map(v => [v, tex(String(v)) as Formula]));
  const labelY = y1 + 64;
  const TA = `${a} ${p.unit}`, TB = `${b} ${p.sharers}`;
  const labelA = wordsBox(TA, x0, y0 - 150, { size: 50 }), labelB = wordsBox(TB, x0 + Ls, y0 - 150, { size: 50, align: 'right' });
  check(labelA.x1 + 40 < labelB.x0, NAME, 'labels collide');
  const pieceL = Ls / b;
  const piece = box(x0, y0, x0 + pieceL, y1);
  const PF = tex(`\\cssId{s}{${r === 0 ? String(q) : `${q ? q : ''}\\tfrac{${r}}{${b}}`}}\\ \\text{${p.unit}}`) as Formula;
  const plX = x0 + pieceL / 2, plY = y0 - 62;
  const pieceLabel = texBox(PF, plX, plY, { size: 64, align: 'center' });
  check(pieceLabel.y0 > labelA.y1 + 8, NAME, 'piece label hits the top labels');

  function draw(c: Canvas, P: Progress<MeasureStripStep>): void {
    const ks = P.k('strip'), kt = P.k('ticks'), kc = P.k('cuts'), kp = P.k('piece');
    drawWords(c, TA, x0, y0 - 150, 'first', P.k('labelA'));
    drawWords(c, TB, x0 + Ls, y0 - 150, 'second', P.k('labelB'), { align: 'right' });
    if (ks > 0) {
      const w = Ls * E.smooth(ks);
      wash(c, rectPts(x0, y0, Math.max(30, w), T, 18), 'first', { seed: 41 + a, inkW: 3, shade: 0.3 });
      // a few twist strokes so it reads as rope, not as a bar
      for (let i = 0; i * 34 < w - 30; i++) {
        const x = x0 + 22 + i * 34;
        inkLine(c, [[x, y0 + 10], [x + 18, y1 - 10]], { col: '#B9722A', w: 3, seed: i, alpha: 0.55 });
      }
    }
    // unit ticks under the strip, labels every `step`
    for (let v = 0; v <= a; v++) {
      const kv = E.smooth(lag(kt, v, a + 1, 0.6));
      if (kv <= 0) continue;
      const x = x0 + v * u, big = labels.includes(v);
      inkLine(c, [[x, y1 + 6], [x, y1 + 6 + (big ? 22 : 12) * kv]], { col: paint(th, 'dim', 'line'), w: big ? 3 : 2, seed: v });
      if (big) texDraw(c, tickF.get(v)!, x, labelY, { size: numSize, align: 'center', col: 'dim', alpha: kv });
    }
    // the b - 1 cuts, drawn on one after another
    for (let j = 1; j < b; j++) {
      const kj = E.inOut(lag(kc, j - 1, b - 1, 0.5));
      if (kj <= 0) continue;
      const x = x0 + j * pieceL;
      const g = c.g; g.save(); g.setLineDash([12, 8]); g.strokeStyle = paint(th, 'second', 'fill'); g.lineWidth = 5;
      g.beginPath(); g.moveTo(x, y0 - 18); g.lineTo(x, y0 - 18 + (T + 36) * kj); g.stroke(); g.restore();
    }
    if (kp > 0) {
      const g = c.g; g.save(); g.globalAlpha *= clamp(kp);
      g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 6; g.shadowColor = g.strokeStyle; g.shadowBlur = 10;
      g.beginPath(); g.roundRect(piece.x0 - 6, piece.y0 - 6, piece.w + 12, piece.h + 12, 14); g.stroke(); g.restore();
      texDraw(c, PF, plX, plY, { size: 64, align: 'center', col: 'link', k: kp });
    }
  }
  return { kind: 'MeasureStrip', share, where: { strip: box(x0, y0, x0 + Ls, y1), piece, labelA, labelB, pieceLabel: unionBox([pieceLabel]) }, draw };
}
