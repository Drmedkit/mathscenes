// SquareTiles: a square seen from above, the model of "the square root is the side of a square with that area".
//   slab    the square painted amber (the area, the radicand)
//   tiles   unit tiles drawn on (cream grid lines), only when the side is a whole number
//   area    the area label above (amber)
//   side    a bracket under the bottom edge and the side label (lime: the root)
//   count   the tiles along the bottom edge light up one by one (lime)
//   ghosts  for an area that is not a perfect square: the k-square and the (k+1)-square as dashed outlines from the
//           same corner and a ruler under them with k and k + 1, so k < sqrt(A) < k + 1 is visible
// Cut mode (a fraction area): ONE unit square cut into b × b small squares, a × a of them painted; the painted square
// has side a/b of the unit and area a²/b² of it.
// Pure maths in computeSquare(); the layout throws BlockError when something cannot be read.
import { type Box, box, clamp, unionBox, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface SquareParams {
  /** the area in square units (any positive number) */
  area: number;
  /** a fraction area a²/b² of one unit square */
  cut?: { a: number; b: number };
  /** draw unit tiles (the side must be a whole number up to 15) */
  tiles?: boolean;
  ghosts?: boolean;
  /** labels (TeX); null = none */
  areaTex?: string | null; sideTex?: string | null;
  /** the unit-square label for cut mode, e.g. 1\text{ ft} */
  unitTex?: string;
  maxPx?: number;
}
export type SquareStep = 'slab' | 'tiles' | 'area' | 'side' | 'count' | 'ghosts';
export const SQUARE_STEPS: readonly SquareStep[] = ['slab', 'tiles', 'area', 'side', 'count', 'ghosts'];

export interface SquareMaths { area: number; side: number; whole: boolean; lo: number; hi: number; cut?: { a: number; b: number } }
const NAME = 'SquareTiles';

export function computeSquare(p: Pick<SquareParams, 'area' | 'cut' | 'tiles' | 'ghosts'>): SquareMaths {
  if (p.cut) {
    const { a, b } = p.cut;
    check(Number.isInteger(a) && Number.isInteger(b) && a >= 1 && a < b && b <= 12, NAME, 'cut mode draws a × a of b × b, a < b ≤ 12');
    check(Math.abs(p.area - (a * a) / (b * b)) < 1e-12, NAME, 'the area must be a²/b²');
    // count the painted small squares one by one
    let n = 0; for (let i = 0; i < a; i++) for (let j = 0; j < a; j++) n++;
    check(n === a * a, NAME, 'painted count');
    return { area: p.area, side: a / b, whole: false, lo: 0, hi: 1, cut: { a, b } };
  }
  check(Number.isFinite(p.area) && p.area > 0, NAME, 'the area must be more than 0');
  const r = Math.round(Math.sqrt(p.area));
  const whole = r * r === p.area;
  const side = whole ? r : Math.sqrt(p.area);
  if (p.tiles) check(whole && r <= 15, NAME, `tiles need a whole side up to 15 (area ${p.area})`);
  const lo = Math.floor(side + 1e-12), hi = lo + 1;
  if (p.ghosts) check(!whole && lo >= 1 && lo * lo < p.area && p.area < hi * hi, NAME, 'ghosts need an area between two perfect squares');
  return { area: p.area, side, whole, lo, hi };
}

export interface SquareFocus { area?: number; side?: number; ringSide?: number }
export interface SquareBlock {
  readonly kind: 'SquareTiles';
  readonly maths: SquareMaths;
  readonly steps: readonly SquareStep[];
  readonly box: Box;
  readonly where: { sq: Box; outer: Box; sideLabel: Box; areaLabel: Box; sideBar: Box; rulerLo: Box; rulerHi: Box };
  draw(c: Canvas, p: Progress<SquareStep>, f?: SquareFocus): void;
}

const LABEL = 60;

export function SquareTiles(p: SquareParams, fr: Frame): SquareBlock {
  const m = computeSquare(p);
  const TOP = p.areaTex === null ? 40 : 130, BOT = p.ghosts ? 150 : p.sideTex === null ? 40 : 170, LEFT = m.cut ? 190 : 60;
  const span = m.cut ? 1 : p.ghosts ? m.hi : m.side;
  const S = Math.min(p.maxPx ?? 640, fr.w - LEFT - 60, fr.h - TOP - BOT);
  const u = S / span;
  if (p.tiles) check(u >= 30, NAME, `tiles of ${Math.round(u)} px are too small`);
  if (p.ghosts) check(u >= 66, NAME, `ruler marks ${Math.round(u)} px apart are too close for labels`);
  if (m.cut) check(u / m.cut.b >= 30, NAME, 'small squares are too small');
  const x0 = fr.x + LEFT + (fr.w - LEFT - 60 - S) / 2, y1 = fr.y + TOP + (fr.h - TOP - BOT + S) / 2;
  const outer = box(x0, y1 - S, x0 + S, y1);
  const sidePx = m.cut ? m.side * u : m.side * u;
  const sq = box(x0, y1 - sidePx, x0 + sidePx, y1);
  // labels
  const areaF = p.areaTex ? (tex(p.areaTex) as Formula) : null;
  const sideF = p.sideTex ? (tex(p.sideTex) as Formula) : null;
  const ax = (m.cut ? outer : sq).cx, ay = (m.cut ? outer : p.ghosts ? outer : sq).y0 - 62;
  const areaLabel = areaF ? texBox(areaF, ax, ay, { size: LABEL, align: 'center' }) : box(ax, ay, ax, ay);
  const sx = sq.cx, sy = y1 + 104;
  const sideLabel = sideF ? texBox(sideF, sx, sy, { size: LABEL, align: 'center' }) : box(sx, sy, sx, sy);
  const sideBar = box(sq.x0, y1 + 20, sq.x1, y1 + 40);
  if (areaF) check(areaLabel.y0 >= fr.y - 6, NAME, 'the area label does not fit above');
  if (sideF) check(sideLabel.x1 - sideLabel.x0 <= Math.max(sq.w + 160, 340) && sideLabel.y1 <= fr.y + fr.h + 40, NAME, 'the side label does not fit under the square');
  const unitF = m.cut && p.unitTex ? (tex(p.unitTex) as Formula) : null;
  const unitLabel = unitF ? texBox(unitF, outer.x0 - 34, outer.cy, { size: 52, align: 'right' }) : null;
  if (unitLabel) check(unitLabel.x0 >= fr.x - 4, NAME, 'the unit label does not fit left of the square');
  // ghost ruler labels
  const rl = (t: number) => { const F = tex(String(t)) as Formula, x = x0 + t * u, y = y1 + 92; return { F, x, y, b: texBox(F, x, y, { size: LABEL, align: 'center' }) }; };
  const RL = p.ghosts ? rl(m.lo) : null, RH = p.ghosts ? rl(m.hi) : null;
  if (RL && RH) check(RL.b.x1 < RH.b.x0 - 6, NAME, 'ruler labels overlap');

  function pulse(c: Canvas, B: Box, hex: string, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = hex; g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 14); g.fill(); g.restore();
  }

  function draw(c: Canvas, P: Progress<SquareStep>, f: SquareFocus = {}): void {
    const kS = P.k('slab'), kT = P.k('tiles'), kA = P.k('area'), kD = P.k('side'), kC = P.k('count'), kG = P.k('ghosts');
    if (m.cut) {
      // the unit square: dark, with its b × b cuts; the painted a × a corner
      const { a, b } = m.cut, cu = u / b;
      withAlpha(c, E.smooth(kS), () => {
        wash(c, rectPts(outer.x0, outer.y0, outer.w, outer.h, 4), '#4B3A5E', { seed: 31, ink: DUSK.ink, inkW: 3, shade: 0.25, rough: 1.2 });
        wash(c, rectPts(sq.x0 + 3, sq.y0 + 3, sq.w - 6, sq.h - 6, 4), 'first', { seed: 32, ink: null, shade: 0.2, rough: 1.2 });
      });
      if (kT > 0) for (let i = 1; i < b; i++) {
        const kk = E.inOut(clamp(kT * 1.3 - (i / b) * 0.3));
        strokePts(c, [[outer.x0 + i * cu, outer.y0], [outer.x0 + i * cu, lerp(outer.y0, outer.y1, kk)]], { col: DUSK.cream, lw: 2.5, alpha: 0.7 });
        strokePts(c, [[outer.x0, outer.y0 + i * cu], [lerp(outer.x0, outer.x1, kk), outer.y0 + i * cu]], { col: DUSK.cream, lw: 2.5, alpha: 0.7 });
      }
      if (unitF && unitLabel) texDraw(c, unitF, outer.x0 - 34, outer.cy, { size: 52, align: 'right', col: 'dim', alpha: E.smooth(kS) });
      if (unitLabel && kS > 0) inkLine(c, [[outer.x0 - 22, outer.y0 + 4], [outer.x0 - 22, outer.y1 - 4]], { col: 'dim', w: 3, seed: 33, alpha: E.smooth(kS) * 0.8 });
    } else {
      // ghosts behind the slab: the (k+1)-square
      if (kG > 0 && p.ghosts) {
        const g = E.smooth(kG);
        strokePts(c, rectPts(x0, y1 - m.hi * u, m.hi * u, m.hi * u), { col: DUSK.cream, lw: 3, alpha: 0.7 * g, dash: [12, 10], closed: true });
      }
      if (kS > 0) withAlpha(c, E.smooth(kS), () => wash(c, rectPts(sq.x0, sq.y0, sq.w, sq.h, 6), 'first', { seed: 41, ink: DUSK.ink, inkW: 3, shade: 0.25, rough: 1.6 }));
      if (kT > 0 && m.whole) {
        const n = m.side;
        for (let i = 1; i < n; i++) {
          const kk = E.inOut(clamp(kT * 1.3 - (i / n) * 0.3));
          if (kk <= 0) continue;
          strokePts(c, [[x0 + i * u, sq.y0 + 3], [x0 + i * u, lerp(sq.y0 + 3, y1 - 3, kk)]], { col: DUSK.cream, lw: u >= 50 ? 3 : 2.2, alpha: 0.75 });
          strokePts(c, [[x0 + 3, sq.y0 + i * u], [lerp(x0 + 3, sq.x1 - 3, kk), sq.y0 + i * u]], { col: DUSK.cream, lw: u >= 50 ? 3 : 2.2, alpha: 0.75 });
        }
      }
      if (kG > 0 && p.ghosts) {
        const g = E.smooth(kG);
        strokePts(c, rectPts(x0, y1 - m.lo * u, m.lo * u, m.lo * u), { col: DUSK.cream, lw: 3, alpha: 0.9 * g, dash: [12, 10], closed: true });
        // the ruler under the squares
        const ry = y1 + 34;
        strokePts(c, [[x0, ry], [x0 + m.hi * u, ry]], { col: 'ink', lw: 3, alpha: g });
        for (const t of [0, m.lo, m.hi]) strokePts(c, [[x0 + t * u, ry - 12], [x0 + t * u, ry + 12]], { col: 'ink', lw: 3.5, alpha: g });
        strokePts(c, [[sq.x1, ry - 18], [sq.x1, ry + 18]], { col: 'link', lw: 6, alpha: g });
        for (const L of [RL!, RH!]) texDraw(c, L.F, L.x, L.y, { size: LABEL, align: 'center', col: 'ink', alpha: g });
      }
    }
    // tiles counted along the bottom edge
    if (kC > 0) {
      const n = m.cut ? m.cut.a : m.whole ? m.side : 0, cu = m.cut ? u / m.cut.b : u;
      for (let i = 0; i < n; i++) {
        const ki = E.smooth(clamp(kC * n - i));
        if (ki <= 0) continue;
        withAlpha(c, ki, () => wash(c, rectPts(x0 + i * cu + cu * 0.14, y1 - cu * 0.86, cu * 0.72, cu * 0.72, 5), 'link', { seed: 800 + i, ink: null, rough: 1, shade: 0.15 }));
      }
    }
    if (kD > 0 && !p.ghosts) {
      const k = E.inOut(kD), y = y1 + 26;
      inkLine(c, [[sq.x0 + 2, y1 + 10], [sq.x0 + 2, y], [lerp(sq.x0 + 2, sq.x1 - 2, k), y]], { col: 'link', w: 4, seed: 901 });
      if (k > 0.98) inkLine(c, [[sq.x1 - 2, y], [sq.x1 - 2, y1 + 10]], { col: 'link', w: 4, seed: 902 });
      pulse(c, sideLabel, '#B4EA6A', f.side ?? 0);
      if (sideF) texDraw(c, sideF, sx, sy, { size: LABEL, align: 'center', col: 'link', alpha: E.smooth(kD) });
      const rk = clamp(f.ringSide ?? 0);
      if (rk > 0) { const { g } = c; g.save(); g.globalAlpha *= rk; g.strokeStyle = '#B4EA6A'; g.lineWidth = 5; g.beginPath(); g.roundRect(sideLabel.x0 - 16, sideLabel.y0 - 12, sideLabel.w + 32, sideLabel.h + 24, 14); g.stroke(); g.restore(); }
    }
    if (kA > 0 && areaF) {
      pulse(c, areaLabel, '#FFB547', f.area ?? 0);
      texDraw(c, areaF, ax, ay, { size: LABEL, align: 'center', col: 'first', alpha: E.smooth(kA) });
    }
  }
  const all = [outer, sq, areaLabel, sideLabel, ...(RL ? [RL.b, RH!.b] : []), ...(unitLabel ? [unitLabel] : [])];
  return {
    kind: 'SquareTiles', maths: m, steps: SQUARE_STEPS, box: unionBox(all),
    where: { sq, outer, sideLabel, areaLabel, sideBar, rulerLo: RL?.b ?? sq, rulerHi: RH?.b ?? sq },
    draw,
  };
}
