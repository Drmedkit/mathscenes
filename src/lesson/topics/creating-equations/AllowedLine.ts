// AllowedLine: the allowed values of ONE variable on a number line. It is the SetLine of solving-linear-equations (rows
// of sets with closed / open ends, rays, test values with a check or a cross; imported read-only) plus what this lesson
// adds: DISCRETE sets drawn as separate dots (whole numbers 0, 1, ..., 6, or quarter-hour blocks 0, 0.25, ...) next
// to CONTINUOUS sets drawn as a band. A row may hold a band, dots, or both (the bound as a faint band, the allowed
// whole numbers as dots on it). Could move to src/lesson/kit/ together with SetLine.
// Steps: SetLine's ('ax', '<row>.set', test keys) plus each dots key (the dots pop in left to right). Layout is checked:
// dots inside the window, at least 30 px apart.
import { type Box, box, clamp, lag } from '../../../core/math';
import { type Canvas, dot } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { DUSK } from '../../dusk';
import { SetLine, type SetLineBlock, type SLFocus, type SLParams, type Role } from '../solving-linear-equations/SetLine';

const NAME = 'AllowedLine';
export interface ALDots { key: string; row: string; vs: number[]; role?: Role }
export interface ALParams extends SLParams { dots?: ALDots[] }
export interface AllowedLineBlock {
  readonly kind: 'AllowedLine';
  readonly box: Box;
  readonly steps: readonly string[];
  readonly line: SetLineBlock;
  readonly where: SetLineBlock['where'] & { dots(key: string): Box };
  draw(c: Canvas, p: Progress<string>, f?: SLFocus): void;
}
export const R_DOTS = 14;

export function AllowedLine(p: ALParams, fr: Frame, th: Theme): AllowedLineBlock {
  const B = SetLine(p, fr, th);
  const dots = (p.dots ?? []).map(d => {
    check(p.rows.some(r => r.key === d.row), NAME, `no row '${d.row}'`);
    for (const v of d.vs) check(v >= p.lo - 1e-9 && v <= p.hi + 1e-9, NAME, `the dot ${v} is off the line`);
    const xs = d.vs.map(v => B.where.x(v)).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) check(xs[i]! - xs[i - 1]! >= 2 * R_DOTS + 2, NAME, 'the dots are too close together; use a wider step or a shorter window');
    const y = B.where.row(d.row).cy;
    return { ...d, xs, y };
  });
  function draw(c: Canvas, P: Progress<string>, f?: SLFocus): void {
    B.draw(c, P, f);
    for (const d of dots) {
      const k = clamp(P.k(d.key));
      if (k <= 0) continue;
      const al = 1 - 0.65 * clamp(f?.dim?.[d.row] ?? 0);
      d.xs.forEach((x, i) => {
        const ki = E.back(clamp(lag(k, i, d.xs.length, 0.5) / 1));
        if (ki <= 0) return;
        c.g.save(); c.g.globalAlpha *= al;
        dot(c, x, d.y, (R_DOTS + 3) * ki, DUSK.ink); dot(c, x, d.y, R_DOTS * ki, d.role ?? 'link');
        c.g.restore();
      });
    }
  }
  return {
    kind: 'AllowedLine', line: B, box: B.box,
    steps: [...B.steps, ...dots.map(d => d.key)],
    where: { ...B.where, dots: k => { const d = dots.find(q => q.key === k); check(d, NAME, `no dots '${k}'`); return box(Math.min(...d.xs) - R_DOTS, d.y - R_DOTS, Math.max(...d.xs) + R_DOTS, d.y + R_DOTS); } },
    draw,
  };
}
