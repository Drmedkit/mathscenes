// AreaSplit: the distributive property as one rectangle cut in two. Height a, width b + c: the whole area a(b + c)
// is the two parts ab + ac. With a minus (7 × 98 = 7(100 − 2)) the full a × b rectangle is drawn and the a × c strip
// at its right end is cut away (dashed, struck), so a(b − c) = ab − ac. Not to scale: each part keeps room for its label.
//
// Steps: rect (the rectangle), split (the cut), labels (a, b, c on the sides), areas (ab and ac inside), cut (the minus strip leaves).
// Could move to the kit: an area model for products and factoring (partitioned rectangle).
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';

export interface AreaParams {
  /** TeX of the height and of the two widths */
  a: string; b: string; c: string;
  /** '+': a(b + c); '-': a(b − c), the c strip is cut from the end of b */
  op: '+' | '-';
  /** TeX of the two part areas (shown at 'areas') */
  ab: string; ac: string;
  /** relative widths (not to scale; clamped so each part keeps room) */
  wb?: number; wc?: number;
}
export type AreaStep = 'rect' | 'split' | 'labels' | 'areas' | 'cut';
export interface AreaFocus { rings?: readonly { at: 'b' | 'c' | 'all'; col: Paint; k: number }[] }
export interface AreaBlock {
  readonly kind: 'AreaSplit';
  readonly where: { all: Box; b: Box; c: Box; aLabel: Box };
  draw(c: Canvas, P: Progress<AreaStep>, f?: AreaFocus): void;
}
const NAME = 'AreaSplit';

export function AreaSplit(p: AreaParams, fr: Frame, th: Theme): AreaBlock {
  const SZ = 72;
  const Fa = tex(p.a) as Formula, Fb = tex(p.b) as Formula, Fc = tex(p.c) as Formula, Fab = tex(p.op === '+' ? p.ab : `${p.a} \\cdot ${p.b} = ${p.ab}`) as Formula, Fac = tex(p.ac) as Formula;
  const left = fr.x + Math.max(150, texWidth(Fa, SZ) + 70), right = fr.x + fr.w - 30;
  const top = fr.y + 170, bottom = fr.y + fr.h - 170;
  const W = right - left;
  check(W > 400, NAME, 'no room for the rectangle');
  // widths: proportional, but each part at least 34 % of the whole so its label and area fit
  const wb0 = p.wb ?? 2, wc0 = p.wc ?? 1;
  let fc = p.op === '+' ? wc0 / (wb0 + wc0) : wc0 / wb0;
  fc = Math.min(0.5, Math.max(0.34, fc));
  const xCut = p.op === '+' ? left + W * (1 - fc) : right - W * fc;
  const bBox = box(left, top, p.op === '+' ? xCut : right, bottom), cBox = box(xCut, top, right, bottom);
  const all = box(left, top, right, bottom);
  // labels fit their sides
  const partB = p.op === '+' ? bBox : box(left, top, xCut, bottom);
  // with a minus the whole a × b area is named (a · b = ab), so it does not read as the area left after the cut
  const abSize = p.op === '+' ? SZ : Math.max(60, Math.min(SZ, Math.floor((partB.w - 40) / (texWidth(Fab, 1) || 1))));
  check(texWidth(Fab, abSize) <= partB.w - 40 && texWidth(Fac, SZ) <= cBox.w - 40, NAME, 'an area label does not fit its part');
  check(texWidth(Fb, SZ) <= (p.op === '+' ? bBox.w : all.w) - 20 && texWidth(Fc, SZ) <= cBox.w - 20, NAME, 'a side label does not fit');
  const aLabel = texBox(Fa, left - 40, (top + bottom) / 2, { size: SZ, align: 'right' });

  function draw(c: Canvas, P: Progress<AreaStep>, f: AreaFocus = {}): void {
    const kR = P.k('rect'), kS = P.k('split'), kL = P.k('labels'), kA = P.k('areas'), kC = P.k('cut');
    if (kR <= 0) return;
    const a = E.smooth(clamp(kR));
    if (p.op === '+') {
      wash(c, rectPts(bBox.x0, bBox.y0, bBox.w, bBox.h, 6), 'second', { seed: 501, rough: 1.4, alpha: a * 0.85, inkW: 3 });
      wash(c, rectPts(cBox.x0, cBox.y0, cBox.w, cBox.h, 6), 'first', { seed: 502, rough: 1.4, alpha: a * (0.25 + 0.6 * clamp(kS)), inkW: 3 });
    } else {
      wash(c, rectPts(all.x0, all.y0, all.w, all.h, 6), 'second', { seed: 503, rough: 1.4, alpha: a * 0.85, inkW: 3 });
      if (kS > 0) wash(c, rectPts(cBox.x0, cBox.y0, cBox.w, cBox.h, 6), 'first', { seed: 504, rough: 1.4, alpha: clamp(kS) * 0.8 * (1 - 0.75 * clamp(kC)), inkW: 3 });
    }
    // the cut: a crisp dashed line from top to bottom
    if (kS > 0) {
      const { g } = c, y1 = top + (bottom - top) * E.inOut(clamp(kS));
      g.save(); g.setLineDash([14, 10]); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 4;
      g.beginPath(); g.moveTo(xCut, top - 16); g.lineTo(xCut, y1 + 16); g.stroke(); g.restore();
    }
    if (kC > 0) {
      const { g } = c;
      g.save(); g.globalAlpha *= clamp(kC); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 5;
      g.beginPath(); g.moveTo(cBox.x0 + 16, cBox.y1 - 16); g.lineTo(cBox.x1 - 16, cBox.y0 + 16); g.stroke(); g.restore();
    }
    if (kL > 0) {
      texDraw(c, Fa, left - 40, (top + bottom) / 2, { size: SZ, align: 'right', k: kL, col: 'ink' });
      if (p.op === '+') {
        texDraw(c, Fb, bBox.cx, top - 70, { size: SZ, align: 'center', k: kL, col: 'second' });
        texDraw(c, Fc, cBox.cx, top - 70, { size: SZ, align: 'center', k: kL, col: 'first' });
      } else {
        texDraw(c, Fb, all.cx, top - 70, { size: SZ, align: 'center', k: kL, col: 'second' });
        texDraw(c, Fc, cBox.cx, bottom + 72, { size: SZ, align: 'center', k: kL * clamp(kS), col: 'first' });
        // the brace under the cut strip
        const { g } = c;
        g.save(); g.globalAlpha *= clamp(kL * kS); g.strokeStyle = paint(th, 'first', 'line'); g.lineWidth = 3;
        g.beginPath(); g.moveTo(cBox.x0 + 6, bottom + 16); g.lineTo(cBox.x0 + 6, bottom + 26); g.lineTo(cBox.x1 - 6, bottom + 26); g.lineTo(cBox.x1 - 6, bottom + 16); g.stroke(); g.restore();
      }
    }
    if (kA > 0) {
      texDraw(c, Fab, partB.cx, partB.cy, { size: abSize, align: 'center', k: kA, col: '#101330' });
      texDraw(c, Fac, cBox.cx, cBox.cy, { size: SZ, align: 'center', k: kA, col: '#101330' });
    }
    for (const R of f.rings ?? []) {
      if (R.k <= 0) continue;
      const b = R.at === 'all' ? all : R.at === 'b' ? partB : cBox, { g } = c;
      g.save(); g.globalAlpha *= clamp(R.k); g.strokeStyle = paint(th, R.col, 'fill'); g.lineWidth = 6;
      g.beginPath(); g.roundRect(b.x0 - 10, b.y0 - 10, b.w + 20, b.h + 20, 14); g.stroke(); g.restore();
    }
  }
  return { kind: 'AreaSplit', where: { all, b: partB, c: cBox, aLabel }, draw };
}
