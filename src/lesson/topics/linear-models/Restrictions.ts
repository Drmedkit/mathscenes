// Restrictions: a stack of number lines on one scale, one row per restriction on the input (the budget, the time
// the tank lasts, the tickets left, "a count"), and a last row "all at once" with the values that satisfy every
// restriction: a piece with open / closed ends, whole-number dots, a single dot, or nothing (no feasible value).
// Could move to the kit next to a plain number line (feasible sets, compound inequalities, domains in context).
// Steps: 'card' (the card, the scale, the row labels), 'r0', 'r1', ... (each restriction's set draws on), 'res' (the
// last row). Pure layout inside a Frame; throws BlockError when the scale is too dense or a row label is too wide.
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'Restrictions';
export interface REnd { v: number; open: boolean }
export interface RSet { lo?: REnd; hi?: REnd; /** whole numbers only: dots instead of a piece */ whole?: boolean; /** no value at all */ empty?: boolean }
export interface RRow extends RSet { label: string }
export interface RPic { min: number; max: number; step: number; /** the variable with its unit, under the scale */ name: string; rows: RRow[]; result: RSet; /** the result row's label */ resLabel?: string }
export interface RestrictionsBlock { readonly box: Box; draw(c: Canvas, p: Progress<string>): void }

const fmt = (v: number) => { const r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };

export function Restrictions(p: RPic, fr: Frame, th: Theme): RestrictionsBlock {
  const n = Math.round((p.max - p.min) / p.step);
  check(n >= 4 && n <= 20 && Math.abs(n * p.step - (p.max - p.min)) < 1e-9, NAME, 'four to twenty ticks, ending on a tick');
  check(p.rows.length >= 1 && p.rows.length <= 3, NAME, 'one to three restrictions');
  const inside = (v: number) => v >= p.min - 1e-9 && v <= p.max + 1e-9;
  for (const r of [...p.rows, p.result]) for (const e of [r.lo, r.hi]) check(!e || inside(e.v), NAME, `an end (${e?.v}) is off the scale`);
  const rows = [...p.rows, { ...p.result, label: p.resLabel ?? 'All at once' }];
  const rowH = 172, numH = 150, cardH = rows.length * rowH + numH + 40;
  check(cardH <= fr.h, NAME, 'the rows do not fit');
  const y0 = fr.y + (fr.h - cardH) / 2, card = box(fr.x, y0, fr.x + fr.w, y0 + cardH);
  const lx0 = fr.x + 70, lx1 = fr.x + fr.w - 70;
  const X = (v: number) => lx0 + (v - p.min) / (p.max - p.min) * (lx1 - lx0);
  const lineY = (i: number) => y0 + 40 + i * rowH + 112;
  const tw = Math.max(...Array.from({ length: n + 1 }, (_, i) => wordsBox(fmt(p.min + i * p.step), 0, 0, { size: 54 }).w));
  const stride = [1, 2, 3, 4, 5].find(s => (lx1 - lx0) / n * s >= tw + 22);
  check(stride, NAME, 'tick labels collide');
  for (const r of rows) check(wordsBox(r.label, 0, 0, { size: 44, weight: 650 }).w <= lx1 - lx0 + 40, NAME, `the label "${r.label}" is too wide`);
  check(wordsBox(p.name, 0, 0, { size: 46, weight: 650 }).w <= fr.w - 40, NAME, 'the scale name is too wide');
  const ink = DUSK.cream, cardFill = '#262B57';

  function drawSet(c: Canvas, s: RSet, y: number, k: number, col: Paint): void {
    if (k <= 0 || s.empty) return;
    const { g } = c;
    if (s.whole) {
      const a = Math.ceil((s.lo ? s.lo.v + (s.lo.open ? 1e-9 : 0) : p.min) - 1e-9), b = Math.floor((s.hi ? s.hi.v - (s.hi.open ? 1e-9 : 0) : p.max) + 1e-9);
      const xs: number[] = [];
      for (let v = Math.max(a, Math.ceil(p.min)); v <= b; v++) xs.push(v);
      xs.forEach((v, i) => { const kk = clamp(k * (xs.length + 2) / 2 - i * 0.5); if (kk > 0) { dot(c, X(v), y, 14 * kk, DUSK.ink); dot(c, X(v), y, 10.5 * kk, col); } });
      // whole numbers go on past the scale: a faint arrow when the set has no upper end
      if (!s.hi && k > 0.9) drawWords(c, '…', lx1 + 26, y - 6, col, 1, { size: 50, align: 'left', weight: 800 });
      return;
    }
    const a = s.lo ? X(s.lo.v) : lx0 - 40, b = s.hi ? X(s.hi.v) : lx1 + 40;
    const kk = E.inOut(clamp(k * 1.3));
    g.save(); g.strokeStyle = paint(th, col, 'line'); g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(a, y); g.lineTo(a + (b - a) * kk, y); g.stroke(); g.restore();
    const kd = clamp(k * 2 - 1);
    for (const e of [s.lo, s.hi]) if (e && kd > 0) {
      dot(c, X(e.v), y, 19 * kd, DUSK.ink);
      dot(c, X(e.v), y, 15 * kd, col);
      if (e.open) dot(c, X(e.v), y, 9 * kd, cardFill);
    }
  }
  function draw(c: Canvas, P: Progress<string>): void {
    const kc = P.k('card');
    if (kc <= 0) return;
    const { g } = c;
    withAlpha(c, clamp(kc * 1.5), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 16), cardFill, { seed: 29, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      // faint tick guides through every row, the scale numbers under the last row
      g.save(); g.strokeStyle = '#3A3F72'; g.lineWidth = 2;
      for (let i = 0; i <= n; i++) { const x = X(p.min + i * p.step); g.beginPath(); g.moveTo(x, lineY(0) - 30); g.lineTo(x, lineY(rows.length - 1) + 16); g.stroke(); }
      g.restore();
      rows.forEach((r, i) => {
        const y = lineY(i), last = i === rows.length - 1;
        if (last) { g.save(); g.strokeStyle = '#5A5F92'; g.lineWidth = 2; g.setLineDash([10, 10]); g.beginPath(); g.moveTo(card.x0 + 30, y - 128); g.lineTo(card.x1 - 30, y - 128); g.stroke(); g.restore(); }
        g.save(); g.strokeStyle = ink; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(lx0 - 40, y); g.lineTo(lx1 + 40, y); g.stroke();
        for (let t = 0; t <= n; t++) { const x = X(p.min + t * p.step); g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x, y + 12); g.stroke(); }
        g.restore();
        drawWords(c, r.label, lx0 - 30, y - 66, last ? 'link' : 'ink', last ? P.k('res') : 1, { size: 44, align: 'left', weight: 650 });
      });
      const yb = lineY(rows.length - 1);
      for (let i = 0; i <= n; i += stride!) drawWords(c, fmt(p.min + i * p.step), X(p.min + i * p.step), yb + 58, 'dim', 1, { size: 54, align: 'center' });
      drawWords(c, p.name, card.cx, yb + 118, 'ink', 1, { size: 46, align: 'center', weight: 650 });
    });
    p.rows.forEach((r, i) => drawSet(c, r, lineY(i), P.k('r' + i), 'first'));
    const kr = P.k('res');
    const last = rows.length - 1;
    if (p.result.empty && kr > 0) drawWords(c, 'no value fits', lx1 + 30, lineY(last) - 66, 'wrong', kr, { size: 46, align: 'right', weight: 700 });
    else drawSet(c, p.result, lineY(last), kr, 'link');
  }
  return { box: card, draw };
}
