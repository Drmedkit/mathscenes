// Colony: a petri dish with a bacteria colony painted to scale (its AREA is proportional to the number of square
// millimeters), the concrete object of the lesson's story: the colony doubles every hour, so going back an hour
// halves it. A colony of 2^-3 mm^2 is a small speck, never "negative": the picture is the fair test of that idea.
//   dish(c, o)   the glass dish (rim + soft glass), the colony wash in the amount colour, a word label under it.
// Pure painter: the same options always draw the same picture.
import { type Box, type Pt, box, clamp } from '../../../core/math';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import { paint } from '../../../core/theme';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { texDraw, tex, type Formula } from '../../../core/tex';
import { check } from '../../../blocks/block';

/** px of radius for a colony of 1 mm^2 (8 mm^2 -> 150 px, 1/8 mm^2 -> 19 px) */
export const R1 = 53;
export const DISH_R = 172;
const circle = (cx: number, cy: number, r: number, n = 64): Pt[] => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)] as Pt);

export interface DishOpts {
  cx: number; cy: number;
  /** colony area in mm^2 (> 0), or null for an unknown colony ("?") */ area: number | null;
  label: string;
  /** 0..1 fade-in of the dish, the colony, the label */ k?: number; kCol?: number;
  /** a lavender ring (focus) */ ring?: number;
  seed?: number;
}
export function colonyRadius(area: number): number {
  check(area > 0, 'Colony', `a colony area must be more than 0 (got ${area})`);
  const r = R1 * Math.sqrt(area);
  check(r <= DISH_R - 14, 'Colony', `a colony of ${area} mm² does not fit in the dish`);
  return r;
}
export function dishBox(o: Pick<DishOpts, 'cx' | 'cy' | 'label'>): { dish: Box; label: Box } {
  return { dish: box(o.cx - DISH_R, o.cy - DISH_R, o.cx + DISH_R, o.cy + DISH_R), label: wordsBox(o.label, o.cx, o.cy + DISH_R + 46, { size: 48, align: 'center' }) };
}
let qF: Formula | null = null;
export function dish(c: Canvas, o: DishOpts): void {
  const k = clamp(o.k ?? 1);
  if (k <= 0) return;
  const { g } = c;
  const seed = o.seed ?? 1;
  g.save(); g.globalAlpha *= k;
  // the glass: a dark disc, a lighter rim, a highlight arc
  wash(c, circle(o.cx, o.cy, DISH_R), '#2A3060', { seed, rough: 1.2, ink: '#8C90C4', inkW: 3, shade: 0.25 });
  inkLine(c, circle(o.cx, o.cy, DISH_R - 12, 72), { col: '#4A5088', w: 2.5, closed: true, seed: seed + 3, rough: 0.6 });
  inkLine(c, Array.from({ length: 18 }, (_, i) => { const a = Math.PI * (1.1 + 0.45 * i / 17); return [o.cx + (DISH_R - 26) * Math.cos(a), o.cy + (DISH_R - 26) * Math.sin(a)] as Pt; }), { col: 'rgba(239,230,247,0.35)', w: 5, seed: seed + 9, rough: 0.4 });
  if (o.area === null) {
    qF ??= tex('?') as Formula;
    g.save(); g.setLineDash([10, 10]); g.strokeStyle = paint(c.th, 'faint', 'line'); g.lineWidth = 3;
    g.beginPath(); g.arc(o.cx, o.cy, 70, 0, Math.PI * 2); g.stroke(); g.restore();
    texDraw(c, qF, o.cx, o.cy, { size: 96, align: 'center', col: 'dim', alpha: clamp(o.kCol ?? 1) });
  } else {
    const kc = E.out(clamp(o.kCol ?? 1));
    if (kc > 0) {
      const r = colonyRadius(o.area) * (0.35 + 0.65 * kc);
      wash(c, circle(o.cx, o.cy, Math.max(4, r), Math.max(18, Math.round(r / 2.2))), 'first', { seed: seed + 20, rough: Math.min(2.4, r / 9), alpha: kc, inkW: r < 30 ? 2 : 3 });
    }
  }
  if ((o.ring ?? 0) > 0) {
    g.save(); g.globalAlpha *= clamp(o.ring!); g.strokeStyle = paint(c.th, 'pick', 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(c.th, 'pick', 'fill'); g.shadowBlur = 12;
    g.beginPath(); g.arc(o.cx, o.cy, DISH_R + 14, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  drawWords(c, o.label, o.cx, o.cy + DISH_R + 46, 'ink', 1, { size: 48, align: 'center' });
  g.restore();
}
