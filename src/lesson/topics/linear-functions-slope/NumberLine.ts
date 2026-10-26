// NumberLine: a number line card with a set of inputs on it: a bounded piece (a ≤ x < b) or a ray, with closed and
// open dots at the ends. Could move to the kit (inequalities, domains, intervals). Steps: 'axes' (the card, the line,
// the ticks), 'set' (the piece drawn on, then its dots). Pure layout inside a Frame; throws BlockError when the ticks
// would collide or an end is outside the line.
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import type { NPic } from './graphPic';

const NAME = 'NumberLine';
export type NLStep = 'axes' | 'set';
export interface NumberLineBlock { readonly box: Box; draw(c: Canvas, p: Progress<NLStep>): void }
const fmt = (v: number) => { const r = Math.round(v * 1000) / 1000; return (r < 0 ? '−' : '') + String(Math.abs(r)); };

export function NumberLine(p: NPic, fr: Frame, th: Theme): NumberLineBlock {
  const n = Math.round((p.max - p.min) / p.step);
  check(n >= 4 && n <= 20, NAME, 'four to twenty ticks');
  const inside = (v: number) => v >= p.min - 1e-9 && v <= p.max + 1e-9;
  check(!p.lo || inside(p.lo.v), NAME, 'the low end is off the line');
  check(!p.hi || inside(p.hi.v), NAME, 'the high end is off the line');
  const cardH = 380, y0 = fr.y + (fr.h - cardH) / 2, card = box(fr.x, y0, fr.x + fr.w, y0 + cardH);
  const lx0 = fr.x + 70, lx1 = fr.x + fr.w - 70, ly = y0 + 200;
  const X = (v: number) => lx0 + (v - p.min) / (p.max - p.min) * (lx1 - lx0);
  const tw = Math.max(...Array.from({ length: n + 1 }, (_, i) => wordsBox(fmt(p.min + i * p.step), 0, 0, { size: 54 }).w));
  const stride = [1, 2, 3, 4, 5].find(s => (lx1 - lx0) / n * s >= tw + 22);
  check(stride, NAME, 'tick labels collide');
  const ink = DUSK.cream;
  function draw(c: Canvas, P: Progress<NLStep>): void {
    const ka = P.k('axes');
    if (ka <= 0) return;
    const { g } = c;
    withAlpha(c, clamp(ka * 1.5), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 16), '#262B57', { seed: 17, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      g.save(); g.strokeStyle = ink; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(lx0 - 40, ly); g.lineTo(lx1 + 40, ly); g.stroke();
      // arrow heads: the line goes on
      for (const [x, d] of [[lx1 + 40, 1], [lx0 - 40, -1]] as const) { g.beginPath(); g.moveTo(x - d * 22, ly - 14); g.lineTo(x, ly); g.lineTo(x - d * 22, ly + 14); g.stroke(); }
      for (let i = 0; i <= n; i++) { const x = X(p.min + i * p.step); g.beginPath(); g.moveTo(x, ly - 16); g.lineTo(x, ly + 16); g.stroke(); }
      g.restore();
      for (let i = 0; i <= n; i += stride!) drawWords(c, fmt(p.min + i * p.step), X(p.min + i * p.step), ly + 62, 'dim', 1, { size: 54, align: 'center' });
      if (p.name) drawWords(c, p.name, card.cx, card.y0 + 56, 'ink', 1, { size: 46, align: 'center', weight: 650 });
    });
    const ks = P.k('set');
    if (ks <= 0) return;
    const a = p.lo ? X(p.lo.v) : lx0 - 40, b = p.hi ? X(p.hi.v) : lx1 + 40;
    const kk = E.inOut(clamp(ks * 1.3));
    g.save(); g.strokeStyle = paint(th, 'link', 'line'); g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(a, ly); g.lineTo(a + (b - a) * kk, ly); g.stroke(); g.restore();
    const kd = clamp(ks * 2 - 1);
    for (const e of [p.lo, p.hi]) if (e && kd > 0) {
      dot(c, X(e.v), ly, 19 * kd, DUSK.ink);
      dot(c, X(e.v), ly, 15 * kd, 'link');
      if (e.open) dot(c, X(e.v), ly, 9 * kd, '#262B57');
    }
  }
  return { box: card, draw };
}
