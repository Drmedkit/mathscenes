// AreaSquare: the square of a sum as a real square. Each side is cut into a and b, so the square falls into four
// pieces: a², two congruent a·b strips, and b². Pieces are washed by role (a² blue, the ab strips amber, b² teal),
// side lengths sit on dimension lines outside the square, and each piece carries its area. A second label set can
// cross-fade in (numbers 20 and 3 turning into the letters a and b), a piece can be asked ('?'), the two strips can
// be ringed together, and the whole picture can fade back (a negative a has no picture).
// To scale when b's share of the side is 0.22-0.45 of it; otherwise b is drawn at the clamp and a small note says
// "not to scale". (The picture only ever shows positive lengths; the algebra covers every real value.)
//
// Steps: frame (the empty square), cut (the two cut lines and the pieces' washes), sides (dimension lines and side
//        labels), cells (the area of each piece).
// Could move to the kit: an area model of (a + b)² (and, with share, any two-part square).
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords } from '../../words';

export interface SqLabels {
  /** TeX of the two parts of the side */
  a: string; b: string;
  /** TeX of the four pieces in reading order: a·a (top left), a·b (top right), b·a (bottom left), b·b */
  cells: readonly [string, string, string, string];
}
export interface SqParams { L: SqLabels; L2?: SqLabels; share: number; note?: string }
export type SqStep = 'frame' | 'cut' | 'sides' | 'cells';
export interface SqFocus {
  /** 0..1: cross-fade from L to L2 */
  swap?: number;
  /** asked pieces: '?' until reveal */
  ask?: readonly { i: number; reveal: number }[];
  /** rings around groups of pieces */
  ring?: readonly { cells: readonly number[]; col: Paint; k: number }[];
  /** fade the whole picture back, 0..1 */
  fade?: number;
  /** a slide of one strip onto the other's place (0..1): shows the two strips are congruent */
  turn?: number;
}
export interface SqBlock {
  readonly kind: 'AreaSquare';
  readonly where: { all: Box; cell(i: number): Box };
  draw(c: Canvas, P: Progress<SqStep>, f?: SqFocus): void;
}
const NAME = 'AreaSquare';
const INK_ON_WASH = '#101330';
const ROLE: readonly Paint[] = ['water', 'first', 'first', 'second'];

export function AreaSquare(p: SqParams, fr: Frame, th: Theme): SqBlock {
  const sh = clamp(p.share, 0.22, 0.45);
  const scaled = Math.abs(sh - p.share) > 1e-9;
  const SIDE = 72;
  const sets = [p.L, ...(p.L2 ? [p.L2] : [])].map(L => ({ a: tex(L.a) as Formula, b: tex(L.b) as Formula, cells: L.cells.map(s => tex(s) as Formula) }));
  const leftW = Math.max(...sets.flatMap(s => [texWidth(s.a, SIDE), texWidth(s.b, SIDE)])) + 70;
  const topH = 130, botH = scaled || p.note ? 70 : 20;
  const S = Math.min(fr.w - leftW - 30, fr.h - topH - botH);
  check(S >= 420, NAME, 'the square is too small');
  const x0 = fr.x + leftW + Math.max(0, (fr.w - leftW - 30 - S) / 2), y0 = fr.y + topH;
  const A = S * (1 - sh);
  const cells = [box(x0, y0, x0 + A, y0 + A), box(x0 + A, y0, x0 + S, y0 + A), box(x0, y0 + A, x0 + A, y0 + S), box(x0 + A, y0 + A, x0 + S, y0 + S)];
  // every piece label fits its piece (at >= 60 px) in every label set
  const cellSize = sets.map(s => s.cells.map((F, i) => {
    let z = i === 0 ? 96 : 76;
    while (z > 60 && (texWidth(F, z) > cells[i]!.w - 24 || z * 1.05 > cells[i]!.h - 16)) z -= 2;
    check(texWidth(F, z) <= cells[i]!.w - 16 && z <= cells[i]!.h - 8, NAME, `piece ${i} label does not fit`);
    return z;
  }));
  for (const s of sets) {
    check(texWidth(s.a, SIDE) <= A - 30, NAME, 'side label a does not fit');
    check(texWidth(s.b, SIDE) <= S - A + 40, NAME, 'side label b does not fit');
  }
  const all = box(x0, y0, x0 + S, y0 + S);
  const qF = tex('?') as Formula;

  function dim(c: Canvas, xa: number, ya: number, xb: number, yb: number, k: number): void {
    // a dimension line with end ticks (horizontal or vertical)
    const { g } = c;
    g.save(); g.globalAlpha *= k; g.strokeStyle = paint(th, 'dim', 'line'); g.lineWidth = 3;
    g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
    const horiz = Math.abs(yb - ya) < 1;
    for (const [x, y] of [[xa, ya], [xb, yb]] as const) { g.beginPath(); if (horiz) { g.moveTo(x, y - 12); g.lineTo(x, y + 12); } else { g.moveTo(x - 12, y); g.lineTo(x + 12, y); } g.stroke(); }
    g.restore();
  }
  function draw(c: Canvas, P: Progress<SqStep>, f: SqFocus = {}): void {
    const kF = P.k('frame'), kC = P.k('cut'), kS = P.k('sides'), kL = P.k('cells');
    if (kF <= 0) return;
    const { g } = c;
    const fade = 1 - 0.75 * clamp(f.fade ?? 0);
    g.save(); g.globalAlpha *= fade;
    const a = E.smooth(clamp(kF));
    wash(c, rectPts(x0 + 4, y0 + 4, S - 8, S - 8, 8), '#262B57', { seed: 811, rough: 1.0, alpha: a * 0.9, inkW: 2.5 });
    if (kC > 0) cells.forEach((b, i) => wash(c, rectPts(b.x0 + 8, b.y0 + 8, b.w - 16, b.h - 16, 8), ROLE[i]!, { seed: 830 + i, rough: 1.2, alpha: clamp(kC * 4 - i * 0.8) * 0.82, inkW: 2.5 }));
    g.save(); g.globalAlpha *= a; g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3.5; g.strokeRect(x0, y0, S, S); g.restore();
    if (kC > 0) {
      const k = E.inOut(clamp(kC));
      g.save(); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0 + A, y0); g.lineTo(x0 + A, y0 + S * k); g.moveTo(x0, y0 + A); g.lineTo(x0 + S * k, y0 + A); g.stroke(); g.restore();
    }
    const sw = clamp(f.swap ?? 0);
    const alphaOf = (si: number) => (sets.length === 1 ? 1 : si === 0 ? 1 - sw : sw);
    if (kS > 0) {
      dim(c, x0, y0 - 40, x0 + A, y0 - 40, kS); dim(c, x0 + A, y0 - 40, x0 + S, y0 - 40, kS);
      dim(c, x0 - 40, y0, x0 - 40, y0 + A, kS); dim(c, x0 - 40, y0 + A, x0 - 40, y0 + S, kS);
      sets.forEach((s, si) => {
        const al = alphaOf(si); if (al <= 0) return;
        texDraw(c, s.a, x0 + A / 2, y0 - 88, { size: SIDE, align: 'center', k: kS, alpha: al, col: 'water' });
        texDraw(c, s.b, x0 + A + (S - A) / 2, y0 - 88, { size: SIDE, align: 'center', k: kS, alpha: al, col: 'second' });
        texDraw(c, s.a, x0 - 58, y0 + A / 2, { size: SIDE, align: 'right', k: kS, alpha: al, col: 'water' });
        texDraw(c, s.b, x0 - 58, y0 + A + (S - A) / 2, { size: SIDE, align: 'right', k: kS, alpha: al, col: 'second' });
      });
    }
    if (kL > 0) {
      sets.forEach((s, si) => {
        const al = alphaOf(si); if (al <= 0) return;
        s.cells.forEach((F, i) => {
          const b = cells[i]!, z = cellSize[si]![i]!;
          const k = clamp(kL * 4 - i * 0.8);
          const asked = f.ask?.find(q => q.i === i);
          if (asked && asked.reveal < 1) texDraw(c, qF, b.cx, b.cy, { size: Math.max(z, 64), align: 'center', k, alpha: al * (1 - asked.reveal), col: INK_ON_WASH });
          const kk = asked ? asked.reveal : k;
          if (kk > 0) texDraw(c, F, b.cx, b.cy, { size: z, align: 'center', k: kk, alpha: al, col: INK_ON_WASH });
        });
      });
    }
    for (const R of f.ring ?? []) {
      if (R.k <= 0) continue;
      g.save(); g.globalAlpha *= clamp(R.k); g.strokeStyle = paint(th, R.col, 'fill'); g.lineWidth = 7;
      for (const i of R.cells) { const b = cells[i]!; g.beginPath(); g.roundRect(b.x0 + 5, b.y0 + 5, b.w - 10, b.h - 10, 14); g.stroke(); }
      g.restore();
    }
    // the turn: a ghost of the top-right strip swings down onto the bottom-left one (they are the same rectangle)
    const t = clamp(f.turn ?? 0);
    if (t > 0 && t < 1) {
      const src = cells[1]!, dst = cells[2]!, k = E.inOut(t);
      const cx = src.cx + (dst.cx - src.cx) * k, cy = src.cy + (dst.cy - src.cy) * k, ang = (Math.PI / 2) * k;
      g.save(); g.translate(cx, cy); g.rotate(ang); g.globalAlpha *= Math.sin(Math.PI * t) * 0.9;
      g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 6; g.setLineDash([14, 10]);
      g.strokeRect(-src.w / 2 + 6, -src.h / 2 + 6, src.w - 12, src.h - 12); g.restore();
    }
    const note = scaled ? 'not to scale' : p.note;
    if (note) drawWords(c, note, all.cx, y0 + S + 50, 'dim', kS, { size: 44, align: 'center' });
    g.restore();
  }
  return { kind: 'AreaSquare', where: { all, cell: i => cells[i]! }, draw };
}
