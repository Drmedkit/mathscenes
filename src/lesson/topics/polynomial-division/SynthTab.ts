// SynthTab: the synthetic-division tableau of P ÷ (x − c). The number c sits in its box on the left; the complete
// coefficient row of P (0 placeholders included) on top; the products c · (previous bottom entry) in the middle row,
// written diagonally one column to the right; a rule; the bottom row (sums). The last bottom entry is the remainder,
// fenced off in its own box; the others are the quotient's coefficients, one degree lower than P.
// Colours: c teal (second, from the divisor), the top row amber (first, the dividend), quotient entries lime (link),
// the remainder lavender (pick), the multiply arrow lavender while it moves.
//
// Steps: frame (c, the fence, the top row), b0 (bring down), then per column j ≥ 1: m<j> (the product, with an arrow
//        from the bottom entry before it) and b<j> (the sum). A solve animates column by column.
// Focus: the next bottom entry asked ('?'), c asked ('?'), a column ringed.
// Could move to the kit (with LongDiv).
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { type Co, type Q, qT, synth, trim } from './pd';

export interface SdParams { P: Co; c: Q; max?: number }
export interface SdFocus {
  /** bottom entry j shows '?' until reveal 1 */
  ask?: { j: number; reveal: number };
  /** c shows '?' until reveal 1 */
  cAsk?: number;
  /** ring around column j */
  ring?: { j: number; k: number; col?: Paint };
  /** the remainder box glows */
  rem?: number;
}
export interface SdBlock {
  readonly kind: 'SynthTab';
  readonly n: number;
  readonly size: number;
  readonly where: { all: Box; c: Box; cell(row: 'top' | 'mid' | 'bot', j: number): Box };
  draw(c: Canvas, P: Progress<string>, f?: SdFocus): void;
}
const NAME = 'SynthTab';

export function SynthTab(p: SdParams, fr: Frame, th: Theme): SdBlock {
  const sd = synth(trim(p.P), p.c);
  const n = sd.top.length;                       // entries per row (degree + 1)
  check(n >= 2 && n <= 6, NAME, 'the tableau draws 2-6 columns');
  const F = (v: Q) => tex(qT(v)) as Formula;
  const FT = sd.top.map(F), FM = sd.mid.map(F), FB = sd.bot.map(F), FC = F(p.c), FQm = tex('?') as Formula;
  const colW100 = Array.from({ length: n }, (_, j) => Math.max(110, texWidth(FT[j]!, 100), texWidth(FM[j]!, 100), texWidth(FB[j]!, 100)) + 46);
  const cW100 = Math.max(texWidth(FC, 100), texWidth(FQm, 100)) + 70;
  const w100 = cW100 + 40 + colW100.reduce((a, b) => a + b, 0) + 30;
  const RH = 1.55;
  let S = Math.min(p.max ?? 88, (fr.w * 100) / w100, fr.h / (3 * RH + 0.6));
  S = Math.floor(S);
  check(S >= 60, NAME, 'the tableau does not fit at 60 px type');
  const k = S / 100;
  const W = w100 * k, H = 3 * RH * S;
  const x0 = fr.x + (fr.w - W) / 2, yTop = fr.y + (fr.h - H) / 2 + S * 0.75;
  const ys = [yTop, yTop + RH * S, yTop + 2 * RH * S + S * 0.2];
  const fenceX = x0 + cW100 * k;
  const colR: number[] = [];
  let xx = fenceX + 40 * k;
  for (let j = 0; j < n; j++) { xx += colW100[j]! * k; colR.push(xx - 24 * k); }
  const right = xx + 10;
  const ruleY = ys[1]! + S * 0.75;
  const cell = (row: 'top' | 'mid' | 'bot', j: number): Box => {
    const y = ys[row === 'top' ? 0 : row === 'mid' ? 1 : 2]!;
    const Fx = (row === 'top' ? FT : row === 'mid' ? FM : FB)[j]!;
    return box(colR[j]! - texWidth(Fx, S), y - S * 0.55, colR[j]!, y + S * 0.45);
  };
  const cBox = box(x0 + 10, ys[0]! - S * 0.62, fenceX - 18, ys[0]! + S * 0.55);
  const all = box(x0, ys[0]! - S * 0.8, right, ys[2]! + S * 0.7);
  check(all.x1 <= fr.x + fr.w + 2 && all.y1 <= fr.y + fr.h + 2, NAME, 'tableau leaves the frame');
  const remBox = box(colR[n - 1]! - colW100[n - 1]! * k + 18 * k, ys[2]! - S * 0.72, right - 4, ys[2]! + S * 0.62);

  function draw(c: Canvas, PR: Progress<string>, f: SdFocus = {}): void {
    const kF = PR.k('frame');
    if (kF <= 0) return;
    const { g } = c;
    // c in its box, the fence, the rule
    g.save(); g.globalAlpha *= clamp(kF * 1.4); g.strokeStyle = paint(th, 'second', 'line'); g.lineWidth = 4;
    g.beginPath(); g.roundRect(cBox.x0, cBox.y0, cBox.w, cBox.h, 10); g.stroke();
    g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(fenceX, ys[0]! - S * 0.7); g.lineTo(fenceX, ruleY); g.lineTo(right, ruleY); g.stroke();
    g.restore();
    const ca = f.cAsk;
    if (ca !== undefined && ca < 1) texDraw(c, FQm, cBox.cx, cBox.cy, { size: S, align: 'center', k: kF, col: 'second', alpha: 1 - ca });
    if (ca === undefined || ca > 0) texDraw(c, FC, cBox.cx, cBox.cy, { size: S, align: 'center', k: ca === undefined ? kF : ca, col: 'second' });
    for (let j = 0; j < n; j++) texDraw(c, FT[j]!, colR[j]!, ys[0]!, { size: S, align: 'right', k: kF, col: 'first' });
    // the remainder box
    const kR = PR.k('b' + (n - 1));
    g.save(); g.globalAlpha *= clamp(kF) * 0.9; g.strokeStyle = paint(th, 'pick', 'line'); g.lineWidth = 3.5;
    g.beginPath(); g.roundRect(remBox.x0, remBox.y0, remBox.w, remBox.h, 10); g.stroke(); g.restore();
    if (f.rem && kR > 0) { g.save(); g.globalAlpha *= clamp(f.rem) * 0.25; g.fillStyle = paint(th, 'pick', 'fill'); g.beginPath(); g.roundRect(remBox.x0, remBox.y0, remBox.w, remBox.h, 10); g.fill(); g.restore(); }
    for (let j = 0; j < n; j++) {
      if (j > 0) {
        const km = PR.k('m' + j);
        if (km > 0) {
          texDraw(c, FM[j]!, colR[j]!, ys[1]!, { size: S, align: 'right', k: km, col: 'ink' });
          // the multiply arrow: from the bottom entry before it, up to this product (fades once written)
          const a = clamp(km * 3) * (1 - clamp((PR.k('b' + j) - 0.2) * 2));
          if (a > 0) {
            const from = cell('bot', j - 1), to = cell('mid', j);
            g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 4; g.lineCap = 'round';
            const x1 = from.x1 + 8, y1 = from.y0 - 4, x2 = to.x0 - 8, y2 = to.y1 + 2;
            g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
            const ang = Math.atan2(y2 - y1, x2 - x1);
            g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 16 * Math.cos(ang - 0.45), y2 - 16 * Math.sin(ang - 0.45));
            g.moveTo(x2, y2); g.lineTo(x2 - 16 * Math.cos(ang + 0.45), y2 - 16 * Math.sin(ang + 0.45)); g.stroke(); g.restore();
          }
        }
      }
      const kb = PR.k('b' + j);
      if (kb <= 0) continue;
      const col: Paint = j === n - 1 ? 'pick' : 'link';
      const asked = f.ask && f.ask.j === j ? f.ask : null;
      if (asked && asked.reveal < 1) texDraw(c, FQm, colR[j]!, ys[2]!, { size: S, align: 'right', k: kb, col, alpha: 1 - asked.reveal });
      const kv = asked ? Math.min(kb, asked.reveal) : kb;
      if (kv > 0) texDraw(c, FB[j]!, colR[j]!, ys[2]!, { size: S, align: 'right', k: kv, col });
    }
    if (f.ring && f.ring.k > 0) {
      const b = box(colR[f.ring.j]! - colW100[f.ring.j]! * k + 16 * k, ys[0]! - S * 0.75, colR[f.ring.j]! + 14, ys[2]! + S * 0.65);
      g.save(); g.globalAlpha *= clamp(f.ring.k); g.strokeStyle = paint(th, f.ring.col ?? 'link', 'fill'); g.lineWidth = 5;
      g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 14); g.stroke(); g.restore();
    }
  }
  return { kind: 'SynthTab', n, size: S, where: { all, c: cBox, cell }, draw };
}
/** the steps of the whole tableau in order (frame, b0, m1, b1, m2, b2, ...) */
export const sdSteps = (n: number): string[] => ['frame', 'b0', ...Array.from({ length: n - 1 }, (_, i) => [`m${i + 1}`, `b${i + 1}`]).flat()];
