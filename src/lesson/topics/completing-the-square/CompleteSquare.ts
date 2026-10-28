// CompleteSquare: completing the square as an area picture. An x-by-x square (teal) and the bx strip next to it (amber,
// b·x); the strip is cut in half and one half turns down under the square, so x² + bx is a square with one corner
// missing. The missing corner is h-by-h (h = b/2): filling it (lime) adds h², and the whole is a square of side x + h.
// Not to scale: the h side keeps room for its labels.
//
// Steps: sq (the x² square), strip (the bx strip), halve (cut, one half turns under the square), corner (the missing
// corner, dashed, with "?"), fill (the corner filled with its area), side (a bracket over the top: the side x + h).
// Focus: rings on 'square' | 'strips' | 'corner' | 'all'; `hideCorner` keeps the corner's number off (answer hidden).
// where: the boxes of the pieces (for rings in the page).  Could move to the kit: the area model for (x + h)².
import { type Box, type Pt, box, clamp, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';

export interface SqParams {
  /** TeX: the half side h (3, \frac{3}{2}, \frac{b}{2a}), the whole strip (6x), one half strip (3x), the corner area (9) */
  hT: string; stripT: string; halfT: string; cornerT: string;
  /** TeX of the side of the completed square (x + 3); default "x + hT" */
  sideT?: string;
  /** h as a fraction of x in the drawing (default 0.38; clamped 0.3 .. 0.45) */
  rel?: number;
}
export type SqStep = 'sq' | 'strip' | 'halve' | 'corner' | 'fill' | 'side';
export interface SqFocus { rings?: readonly { at: 'square' | 'strips' | 'corner' | 'all'; col: Paint; k: number }[]; hideCorner?: boolean }
export interface SqBlock {
  readonly kind: 'CompleteSquare';
  readonly where: { square: Box; stripA: Box; stripB: Box; corner: Box; all: Box };
  draw(c: Canvas, P: Progress<SqStep>, f?: SqFocus): void;
}
const NAME = 'CompleteSquare';

export function CompleteSquare(p: SqParams, fr: Frame, th: Theme): SqBlock {
  const F = (s: string) => tex(s) as Formula;
  const Fx = F('x'), Fx2 = F('x^2'), Fh = F(p.hT), Fstrip = F(p.stripT), Fhalf = F(p.halfT), Fcorner = F(p.cornerT), Fq = F('?');
  const Fside = F(p.sideT ?? `x + ${p.hT}`);
  const SZ = 64;
  const hW = Math.max(texWidth(Fx, SZ), texWidth(Fh, SZ));
  // above the square: the top labels (bottom 14 px over it), the bracket, the side label over the bracket
  const topH = Math.max(texBox(Fx, 0, 0, { size: SZ }).h, texBox(Fh, 0, 0, { size: SZ }).h), sideH = texBox(Fside, 0, 0, { size: SZ }).h;
  const mL = hW + 60, mT = 14 + topH + 30 + 12 + sideH + 16, mR = 30, mB = 30;
  const r = clamp(p.rel ?? 0.38, 0.3, 0.45);
  const Wa = fr.w - mL - mR, Ha = fr.h - mT - mB;
  const X = Math.min(Wa / (1 + 2 * r), Ha / (1 + r)), H = X * r;
  check(X >= 260 && H >= 110, NAME, 'the frame is too small for the square');
  // centre the finished square (X + H) in the frame, keeping room for the strip before it turns
  const x0 = fr.x + mL + Math.max(0, (Wa - (X + 2 * H)) / 2), y0 = fr.y + mT + Math.max(0, (Ha - (X + H)) / 2);
  const square = box(x0, y0, x0 + X, y0 + X);
  const stripA = box(x0 + X, y0, x0 + X + H, y0 + X);            // the half that stays
  const stripB0 = box(x0 + X + H, y0, x0 + X + 2 * H, y0 + X);    // the half that turns
  const stripB = box(x0, y0 + X, x0 + X, y0 + X + H);             // where it lands
  const corner = box(x0 + X, y0 + X, x0 + X + H, y0 + X + H);
  const all = box(x0, y0, x0 + X + H, y0 + X + H);
  // label sizes: the largest of SZ .. 44 that fits each piece
  const fit = (Fm: Formula, w: number, max = SZ) => { let s = max; while (s > 44 && texWidth(Fm, s) > w) s -= 2; check(texWidth(Fm, s) <= w, NAME, 'a label does not fit its piece'); return s; };
  const sHalf = fit(Fhalf, H - 22), sCorner = fit(Fcorner, H - 18), sStrip = fit(Fstrip, 2 * H - 24), sH = fit(Fh, H - 10);
  const sSide = fit(Fside, X + H, SZ);

  /** the turning half: centre and angle */
  function turning(k: number): Pt[] {
    const t = E.inOut(clamp(k));
    const c0: Pt = [stripB0.cx, stripB0.cy], c1: Pt = [stripB.cx, stripB.cy];
    // lift out first, then swing round, then settle
    const cx = lerp(c0[0], c1[0], t), cy = lerp(c0[1], c1[1], t) + Math.sin(Math.PI * t) * 40;
    const ang = (Math.PI / 2) * t, w = H, hh = X;
    const cs = Math.cos(ang), sn = Math.sin(ang);
    return ([[-w / 2, -hh / 2], [w / 2, -hh / 2], [w / 2, hh / 2], [-w / 2, hh / 2]] as [number, number][]).map(([u, v]) => [cx + u * cs - v * sn, cy + u * sn + v * cs] as Pt);
  }
  function draw(c: Canvas, P: Progress<SqStep>, f: SqFocus = {}): void {
    const kQ = P.k('sq'), kS = P.k('strip'), kH = P.k('halve'), kC = P.k('corner'), kF = P.k('fill'), kD = P.k('side');
    if (kQ <= 0) return;
    const { g } = c;
    const dark = '#101330';
    wash(c, rectPts(square.x0, square.y0, square.w, square.h, 6), 'second', { seed: 611, rough: 1.3, alpha: E.smooth(clamp(kQ)) * 0.88, inkW: 3 });
    texDraw(c, Fx2, square.cx, square.cy, { size: 76, align: 'center', k: kQ, col: dark });
    // top / left x labels
    texDraw(c, Fx, square.cx, y0 - 14, { size: SZ, align: 'center', valign: 'bottom', k: kQ, col: 'second' });
    texDraw(c, Fx, x0 - 34, square.cy, { size: SZ, align: 'right', k: kQ, col: 'second' });
    if (kS > 0) {
      const a = E.smooth(clamp(kS));
      if (kH <= 0) {
        // the whole strip, one piece
        wash(c, rectPts(stripA.x0, y0, 2 * H, X, 6), 'first', { seed: 612, rough: 1.3, alpha: a * 0.86, inkW: 3 });
        texDraw(c, Fstrip, stripA.x0 + H, square.cy, { size: sStrip, align: 'center', k: kS, col: dark });
      } else {
        wash(c, rectPts(stripA.x0, stripA.y0, stripA.w, stripA.h, 6), 'first', { seed: 613, rough: 1.3, alpha: 0.86, inkW: 3 });
        wash(c, turning(kH), 'first', { seed: 614, rough: 1.3, alpha: 0.86, inkW: 3 });
        const kl = clamp((kH - 0.85) / 0.15);
        texDraw(c, Fhalf, stripA.cx, stripA.cy, { size: sHalf, align: 'center', k: Math.max(clamp(1 - kH * 4), kl), col: dark });
        if (kl > 0) {
          texDraw(c, Fhalf, stripB.cx, stripB.cy, { size: Math.min(SZ, sHalf + 4), align: 'center', k: kl, col: dark });
          texDraw(c, Fh, stripA.cx, y0 - 14, { size: sH, align: 'center', valign: 'bottom', k: kl, col: 'first' });
          texDraw(c, Fh, x0 - 34, stripB.cy, { size: sH, align: 'right', k: kl, col: 'first' });
        }
        // the cut line while it splits
        if (kH < 0.3) {
          g.save(); g.globalAlpha *= 1 - kH / 0.3; g.setLineDash([14, 10]); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 4;
          g.beginPath(); g.moveTo(stripA.x1, y0 - 14); g.lineTo(stripA.x1, y0 + X + 14); g.stroke(); g.restore();
        }
      }
    }
    if (kC > 0 && kF < 1) {
      g.save(); g.globalAlpha *= clamp(kC) * (1 - clamp(kF)); g.setLineDash([12, 10]); g.strokeStyle = paint(th, 'link', 'line'); g.lineWidth = 4;
      g.strokeRect(corner.x0 + 4, corner.y0 + 4, corner.w - 8, corner.h - 8); g.restore();
      texDraw(c, Fq, corner.cx, corner.cy, { size: 72, align: 'center', k: kC, col: 'link', alpha: 1 - clamp(kF) });
    }
    if (kF > 0) {
      wash(c, rectPts(corner.x0, corner.y0, corner.w, corner.h, 6), 'link', { seed: 615, rough: 1.3, alpha: E.smooth(clamp(kF)) * 0.9, inkW: 3 });
      if (!f.hideCorner) texDraw(c, Fcorner, corner.cx, corner.cy, { size: sCorner, align: 'center', k: kF, col: dark });
    }
    if (kD > 0) {
      // a bracket above the top labels, the side written above it
      const yb = y0 - 14 - topH - 30, k = E.smooth(clamp(kD)), xa = all.x0 + 4, xb = lerp(xa, all.x1 - 4, k);
      g.save(); g.strokeStyle = paint(th, 'link', 'line'); g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xa, yb + 16); g.lineTo(xa, yb); g.lineTo(xb, yb); if (k > 0.98) g.lineTo(all.x1 - 4, yb + 16); g.stroke(); g.restore();
      texDraw(c, Fside, all.cx, yb - 12, { size: sSide, align: 'center', valign: 'bottom', k: kD, col: 'link' });
    }
    for (const R of f.rings ?? []) {
      if (R.k <= 0) continue;
      const bs = R.at === 'square' ? [square] : R.at === 'strips' ? [stripA, stripB] : R.at === 'corner' ? [corner] : [all];
      g.save(); g.globalAlpha *= clamp(R.k); g.strokeStyle = paint(th, R.col, 'fill'); g.lineWidth = 6;
      for (const b of bs) { g.beginPath(); g.roundRect(b.x0 - 9, b.y0 - 9, b.w + 18, b.h + 18, 14); g.stroke(); }
      g.restore();
    }
  }
  return { kind: 'CompleteSquare', where: { square, stripA, stripB, corner, all }, draw };
}
