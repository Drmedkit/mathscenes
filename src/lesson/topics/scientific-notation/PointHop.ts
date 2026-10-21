// PointHop: multiplying by 10^n moves the decimal point n places. The significant digits stay in their columns (amber);
// the decimal point (lime) hops one column per factor of 10, each hop drawn as a teal arc with its count over it, and
// placeholder zeros (dim) fill in as the point passes: 3.04 -> 0.0000304 (5 hops left) or 4.5 -> 4500000000 (9 right).
//   digits  the starting number appears (digits, its point, and the zeros it already needs)
//   hop     the point hops from `from` to `to`, one arc per hop, zeros fading in as they are needed
//   read    the finished number is underlined (the answer)
// Positions: the point sits after `p` significant digits (p <= 0: before the first digit, with 0. in front;
// p > number of digits: trailing zeros). Pure maths in computeHop(); the layout throws BlockError when unreadable.
import { type Box, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine } from '../../wash';
import { type Dec, norm, plain } from './sci';

export type HopStep = 'digits' | 'hop' | 'read';
export const HOP_STEPS: readonly HopStep[] = ['digits', 'hop', 'read'];
export interface HopParams {
  /** the significant digits, first and last not 0 ("304", "45", "7") */
  digits: string;
  /** where the point starts and ends: after this many digits */
  from: number; to: number;
}
export interface HopMaths {
  digits: string; L: number; from: number; to: number;
  /** hops, signed: + moves the point right (x 10 each), - left (/ 10 each) */
  hops: number;
  /** the first and last column shown (column 0 = the first significant digit) */
  jmin: number; jmax: number;
  start: Dec; end: Dec;
}
const NAME = 'PointHop';

/** the number the digits make with the point after p of them */
export const valueAt = (digits: string, p: number): Dec => norm(BigInt(digits), p - digits.length);

export function computeHop(p: HopParams): HopMaths {
  check(/^[1-9](\d*[1-9])?$/.test(p.digits), NAME, `digits "${p.digits}" must start and end with a non-zero digit`);
  check(Number.isInteger(p.from) && Number.isInteger(p.to), NAME, 'point positions must be whole numbers');
  const L = p.digits.length;
  const hops = p.to - p.from;
  check(Math.abs(hops) <= 12, NAME, `${Math.abs(hops)} hops do not fit`);
  const jmin = Math.min(0, p.from - 1, p.to - 1), jmax = Math.max(L - 1, p.from - 1, p.to - 1);
  check(jmax - jmin + 1 <= 15, NAME, `${jmax - jmin + 1} columns do not fit`);
  const start = valueAt(p.digits, p.from), end = valueAt(p.digits, p.to);
  // every hop is one factor of 10: end = start x 10^hops (asserted on the exact values)
  check(end.c === start.c && end.e === start.e + hops, NAME, 'the hops do not multiply by 10 each');
  return { digits: p.digits, L, from: p.from, to: p.to, hops, jmin, jmax, start, end };
}

export interface HopBlock {
  readonly kind: 'PointHop';
  readonly maths: HopMaths;
  readonly steps: readonly HopStep[];
  readonly box: Box;
  readonly where: {
    /** the finished number */ number: Box;
    /** all hop arcs and their counts */ arcs: Box;
    /** the point at position p */ point(p: number): Box;
    /** the significant digits */ digits: Box;
  };
  draw(c: Canvas, p: Progress<HopStep>): void;
}

export function PointHop(params: HopParams, fr: Frame, th: Theme): HopBlock {
  const m = computeHop(params);
  const cols = m.jmax - m.jmin + 1;
  const cw = Math.min(124, (fr.w - 60) / cols);
  check(cw >= 72, NAME, `columns of ${Math.round(cw)} px are too narrow`);
  const size = clamp(cw * 1.2, 76, 132);
  const x0 = fr.x + (fr.w - cols * cw) / 2;
  const base = fr.y + fr.h - 70;
  const colX = (j: number) => x0 + (j - m.jmin + 0.5) * cw;    // centre of column j
  const ptX = (p: number) => x0 + (p - m.jmin) * cw;            // the gap before column p
  const digitTop = base - size * 0.72;
  const arcY = digitTop - 26, arcH = Math.min(70, cw * 0.55);
  const labelY = arcY - arcH - 34;
  check(labelY - 30 >= fr.y - 6, NAME, 'the hop counts do not fit above the digits');
  const F: Formula[] = Array.from({ length: 10 }, (_, d) => tex(String(d)) as Formula);
  const counts: Formula[] = Array.from({ length: Math.abs(m.hops) }, (_, i) => tex(String(i + 1)) as Formula);
  const cnt = 52;
  check(cw >= 60 || Math.abs(m.hops) <= 1, NAME, 'hop counts too crowded');
  const hopPos = (i: number) => m.from + Math.sign(m.hops) * i;    // the point before hop i
  const digitsBox = box(colX(0) - cw / 2, digitTop, colX(m.L - 1) + cw / 2, base + 8);
  const endCols = [Math.min(0, m.to - 1), Math.max(m.L - 1, m.to - 1)] as const;
  const numberBox = box(colX(endCols[0]) - cw / 2, digitTop, colX(endCols[1]) + cw / 2, base + 12);
  const arcsBox = m.hops ? box(Math.min(ptX(m.from), ptX(m.to)) - 10, labelY - 32, Math.max(ptX(m.from), ptX(m.to)) + 10, arcY + 4) : box(ptX(m.from), arcY - 4, ptX(m.from), arcY);
  const arcPts = (a: number, b: number) => {
    const P: [number, number][] = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; P.push([lerp(ptX(a), ptX(b), t), arcY - Math.sin(Math.PI * t) * arcH]); }
    return P;
  };

  function draw(c: Canvas, P: Progress<HopStep>): void {
    const kD = E.smooth(P.k('digits')), kH = P.k('hop'), kR = E.smooth(P.k('read'));
    if (kD <= 0) return;
    const H = Math.abs(m.hops);
    // the point's position: hop by hop, each hop eased, with a short rest between hops
    const u = H ? kH * H : 0;
    const done = Math.min(H, Math.floor(u)), frac = H ? E.inOut(clamp((u - done) * 1.25)) : 0;
    const pt = H ? lerp(hopPos(done), hopPos(Math.min(H, done + 1)), done >= H ? 0 : frac) : m.from;
    const ptNow = done >= H ? m.to : pt;
    const { g } = c;
    // the significant digits
    for (let j = 0; j < m.L; j++) texDraw(c, F[Number(m.digits[j])]!, colX(j), base, { size, align: 'center', valign: 'baseline', alpha: kD, col: 'first' });
    // placeholder zeros: leading (between the point and the first digit, and the 0 before the point), trailing
    for (let j = m.jmin; j <= m.jmax; j++) {
      if (j >= 0 && j < m.L) continue;
      // zeros the starting number needed stay faintly in place once the point has left them (where it came from)
      const before = m.from !== m.to && (j < 0 ? j >= m.from - 1 : j <= m.from - 1);
      const a = Math.max(j < 0 ? clamp(j - ptNow + 2) : clamp(ptNow - j), before ? 0.28 : 0);
      if (a <= 0) continue;
      texDraw(c, F[0]!, colX(j), base, { size, align: 'center', valign: 'baseline', alpha: kD * a, col: 'dim' });
    }
    // hop arcs and counts
    for (let i = 0; i < H; i++) {
      const t = clamp(u - i);
      if (t <= 0) break;
      const A = arcPts(hopPos(i), hopPos(i + 1));
      withAlpha(c, kD, () => inkLine(c, A.slice(0, Math.max(2, Math.ceil(A.length * clamp(t * 1.25)))), { col: 'second', w: 4, seed: 700 + i, rough: 0.4 }));
      const mid = (ptX(hopPos(i)) + ptX(hopPos(i + 1))) / 2;
      texDraw(c, counts[i]!, mid, labelY, { size: cnt, align: 'center', alpha: kD * clamp(t * 2 - 0.6), col: 'second' });
    }
    // the decimal point (it rides up over the arc while it hops)
    const lift = H && done < H ? Math.sin(Math.PI * frac) * arcH : 0;
    const dx = ptX(ptNow), dy = base - 4 - lift * (1 - 0.15);
    if (ptNow !== m.to || m.to < m.L || m.to <= 0) {
      g.save(); g.globalAlpha *= kD; g.fillStyle = paint(th, 'link', 'fill');
      g.beginPath(); g.arc(dx, lift ? arcY - lift + 6 : dy, Math.max(8, size * 0.075), 0, Math.PI * 2); g.fill(); g.restore();
    } else {
      // a whole number at the end: the point fades (no "4500000000." on the board)
      g.save(); g.globalAlpha *= kD * (1 - kR); g.fillStyle = paint(th, 'link', 'fill');
      g.beginPath(); g.arc(dx, dy, Math.max(8, size * 0.075), 0, Math.PI * 2); g.fill(); g.restore();
    }
    // read: the finished number underlined
    if (kR > 0) inkLine(c, [[numberBox.x0 + 6, base + 22], [lerp(numberBox.x0 + 6, numberBox.x1 - 6, kR), base + 22]], { col: 'link', w: 5, seed: 731, rough: 0.5 });
  }
  return {
    kind: 'PointHop', maths: m, steps: HOP_STEPS,
    box: unionBox([numberBox, arcsBox, box(x0, labelY - 32, x0 + cols * cw, base + 26)]),
    where: { number: numberBox, arcs: arcsBox, point: p => box(ptX(p) - 10, base - 14, ptX(p) + 10, base + 6), digits: digitsBox },
    draw,
  };
}
/** the hop picture for a x 10^n -> decimal: the digits of a with the point after the first digit, hopping n places */
export const hopForSci = (a: Dec, n: number): HopParams => {
  const s = (a.c < 0n ? -a.c : a.c).toString();
  return { digits: s, from: s.length + a.e, to: s.length + a.e + n };
};
/** plain text of a hop's end (tests) */
export const hopEnd = (p: HopParams): string => plain(valueAt(p.digits, p.to));
