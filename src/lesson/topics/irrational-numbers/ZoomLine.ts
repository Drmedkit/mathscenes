// ZoomLine: the decimal address of a number. Up to three number lines stacked top to bottom; each one zooms into
// the tenth of the line above that holds the number, so its digits are found one by one (nested intervals):
//   1 < sqrt2 < 2   ->   1.4 < sqrt2 < 1.5   ->   1.41 < sqrt2 < 1.42   -> ... it never stops for an irrational.
// Level i shows `L = from + i` decimal places: the whole numbers of a window (L = 0), or the interval of width
// 10^-(L-1) that holds x, cut into ten steps of 10^-L. The step that holds x is the lime band; a soft beam carries it
// down to the next line, which is that band blown up. For a square root the squares of the band ends are written
// under them in amber: 1.4^2 = 1.96 < 2 < 2.25 = 1.5^2 is why the band is where it is.
//   axis        the first line (ticks, numbers)            name     the number's name over the first band
//   band{i}     the band on line i and its two end labels   sq{i}    the squares of those ends (roots only)
//   zoom{i}     line i appears with the beam from band i-1  dot      the exact point on every line
//   mid         the middle tick of the last line (the rounding midpoint) in lavender
//   marks       lettered points on the first line (a "which point is it?" picture; no band then)
// Exact: every band, label and square comes from realMaths (BigInt); the block asserts the band holds x.
import { type Box, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine } from '../../wash';
import { DUSK } from '../../dusk';
import { type Real, approx, cmpDec, decStr, exactAt, fdiv, floorScaled } from './realMaths';

export type ZoomStep = 'axis' | 'name' | 'band0' | 'sq0' | 'zoom1' | 'band1' | 'sq1' | 'zoom2' | 'band2' | 'sq2' | 'dot' | 'mid' | 'marks';
export const ZOOM_STEPS: readonly ZoomStep[] = ['axis', 'name', 'band0', 'sq0', 'zoom1', 'band1', 'sq1', 'zoom2', 'band2', 'sq2', 'dot', 'mid', 'marks'];

export interface ZoomParams {
  x: Real;
  /** TeX name of the number ('\\sqrt{2}', '\\tfrac{2}{3}', '\\pi') */
  name: string;
  /** lines shown, 1..3 (default 3) */
  levels?: number;
  /** decimal places of the first line (0 = whole numbers) */
  from?: number;
  /** the whole-number window of a first line with from = 0 (default: 4 steps around x) */
  window?: [number, number];
  /** write the squares of the band ends (square roots only) */
  squares?: boolean;
  /** lettered points on the first line instead of a band */
  marks?: { t: string; x: Real }[];
}
interface LevelM {
  L: number;
  /** the line runs from lo / 10^L to hi / 10^L in steps of 1 / 10^L */
  lo: bigint; hi: bigint;
  /** the band [b, b + 1] / 10^L that holds x, or null when x sits on tick `on` */
  band: bigint | null; on: bigint | null;
}
export interface ZoomMaths { levels: LevelM[]; sqrtOf: number | null }
const NAME = 'ZoomLine';

export function computeZoom(p: ZoomParams): ZoomMaths {
  const n = p.levels ?? 3, from = p.from ?? 0;
  check(Number.isInteger(n) && n >= 1 && n <= 3, NAME, `levels ${n}: 1 to 3 lines fit`);
  check(Number.isInteger(from) && from >= 0 && from + n - 1 <= 6, NAME, `places ${from}..${from + n - 1}`);
  const v = approx(p.x);
  check(Math.abs(v) <= 16, NAME, `${v} is off the lines this topic draws (-16..16)`);
  const levels: LevelM[] = [];
  for (let i = 0; i < n; i++) {
    const L = from + i;
    let lo: bigint, hi: bigint;
    if (L === 0) {
      const f = Number(floorScaled(p.x, 0));
      const [w0, w1] = p.window ?? (() => { const a = Math.min(Math.max(f - 1, v >= 0 ? 0 : -16), f); return [a, a + 4] as [number, number]; })();
      check(Number.isInteger(w0) && Number.isInteger(w1) && w1 - w0 >= 2 && w1 - w0 <= 8, NAME, `window ${w0}..${w1}`);
      lo = BigInt(w0); hi = BigInt(w1);
    } else {
      const parent = floorScaled(p.x, L - 1);
      lo = parent * 10n; hi = lo + 10n;
    }
    const ex = exactAt(p.x, L);
    const F = floorScaled(p.x, L);
    const band = ex ? null : F, on = ex ? F : null;
    // the band holds x: b/10^L < x < (b+1)/10^L, and it lies on the line
    if (band !== null) {
      check(cmpDec(p.x, band, L) === 1 && cmpDec(p.x, band + 1n, L) === -1, NAME, 'band does not hold x');
      check(band >= lo && band + 1n <= hi, NAME, `x is outside the window of line ${i}`);
    } else check(on! >= lo && on! <= hi, NAME, `x is outside the window of line ${i}`);
    if (i > 0) {
      const up = levels[i - 1]!;
      check(up.band !== null && up.band * 10n === lo, NAME, 'each line must blow up the band above it');
    }
    levels.push({ L, lo, hi, band, on });
  }
  const sqrtOf = p.x.kind === 'sqrt' && p.x.b === 1 ? p.x.a : null;
  if (p.squares) check(p.x.kind === 'sqrt', NAME, 'squares are written for square roots only');
  if (p.marks) {
    check(n === 1, NAME, 'marks go on a single line');
    for (const m of p.marks) check(cmpDec(m.x, levels[0]!.lo, from) >= 0 && cmpDec(m.x, levels[0]!.hi, from) <= 0, NAME, `mark ${m.t} is off the line`);
  }
  return { levels, sqrtOf };
}
/** the square of a / 10^L as a trimmed decimal string (1.4 -> "1.96") */
export const squareStr = (a: bigint, L: number): string => decStr(a * a, 2 * L, true);

/** pulses 0..1: a band (and its labels), the squares of a line, the name */
export interface ZoomFocus { band?: (i: number) => number; sq?: (i: number) => number; name?: number }
export interface ZoomBlock {
  readonly kind: 'ZoomLine';
  readonly maths: ZoomMaths;
  readonly box: Box;
  readonly where: { axis(i: number): Box; band(i: number): Box; bandLabels(i: number): Box; squares(i: number): Box; name: Box; dot(i: number): Box; mark(j: number): Box };
  draw(c: Canvas, p: Progress<ZoomStep>, focus?: ZoomFocus): void;
}

export function ZoomLine(p: ZoomParams, fr: Frame, th: Theme): ZoomBlock {
  const M = computeZoom(p);
  const n = M.levels.length;
  const NUM = 60, SQ = 56;
  const ax0 = fr.x + 150, ax1 = fr.x + fr.w - 150;
  const top = fr.y + (p.marks ? 260 : 175);
  const pitch = n > 1 ? Math.min(300, (fr.h - 175 - 200) / (n - 1)) : 0;
  check(n === 1 || pitch >= 250, NAME, `lines ${Math.round(pitch)} px apart are too close`);
  const Y = (i: number) => top + i * pitch;
  const X = (i: number, a: bigint) => { const l = M.levels[i]!; return ax0 + (Number(a - l.lo) / Number(l.hi - l.lo)) * (ax1 - ax0); };
  const XR = (i: number, x: Real) => { const l = M.levels[i]!; const s = 10 ** l.L; return ax0 + ((approx(x) * s - Number(l.lo)) / Number(l.hi - l.lo)) * (ax1 - ax0); };
  const step = (ax1 - ax0) / Number(M.levels[0]!.hi - M.levels[0]!.lo);
  if (M.levels[0]!.L === 0) check(step >= 80, NAME, 'whole-number ticks are too close for their numbers');

  // ---- labels, measured ----
  interface Lab { F: Formula; x: number; y: number; align: 'left' | 'center' | 'right'; size: number; b: Box }
  const lab = (src: string, x: number, y: number, align: Lab['align'], size: number): Lab => { const F = tex(src) as Formula; return { F, x, y, align, size, b: texBox(F, x, y, { size, align }) }; };
  /** shift a row of labels so it stays inside the frame (the row keeps its order and gaps) */
  const keepIn = (row: Lab[]): Lab[] => {
    if (!row.length) return row;
    const u = unionBox(row.map(r => r.b));
    const dx = u.x0 < fr.x - 30 ? fr.x - 30 - u.x0 : u.x1 > fr.x + fr.w + 30 ? fr.x + fr.w + 30 - u.x1 : 0;
    return dx ? row.map(r => ({ ...r, x: r.x + dx, b: box(r.b.x0 + dx, r.b.y0, r.b.x1 + dx, r.b.y1) })) : row;
  };
  const ticksL0: Lab[] = [];
  const l0 = M.levels[0]!;
  if (l0.L === 0) for (let a = l0.lo; a <= l0.hi; a++) ticksL0.push(lab(String(a), X(0, a), Y(0) + 62, 'center', NUM));
  const ends: Lab[][] = M.levels.map((l, i) => (l.L === 0 ? [] : [lab(decStr(l.lo, l.L, true), ax0 - 24, Y(i), 'right', NUM), lab(decStr(l.hi, l.L, true), ax1 + 24, Y(i), 'left', NUM)]));
  const bandLab: Lab[][] = M.levels.map((l, i) => {
    if (l.L === 0) return [];
    if (l.band === null) return keepIn([lab(decStr(l.on!, l.L, true), X(i, l.on!), Y(i) + 70, 'center', NUM)]);
    return keepIn([lab(decStr(l.band, l.L), X(i, l.band) - 16, Y(i) + 70, 'right', NUM), lab(decStr(l.band + 1n, l.L), X(i, l.band + 1n) + 16, Y(i) + 70, 'left', NUM)]);
  });
  const sqLab: Lab[][] = M.levels.map((l, i) => {
    if (!p.squares || l.band === null) return [];
    const a = l.band, b = l.band + 1n;
    const sa = squareStr(a, l.L), sb = squareStr(b, l.L);
    if (l.L === 0) {
      // under the whole numbers, pushed apart a little when they are wide (3-digit squares)
      const La = lab(sa, X(i, a), Y(i) + 145, 'center', SQ), Lb = lab(sb, X(i, b), Y(i) + 145, 'center', SQ);
      const push = Math.max(0, (La.b.w / 2 + Lb.b.w / 2 + 40 - (Lb.x - La.x)) / 2);
      return keepIn([lab(sa, X(i, a) - push, Y(i) + 145, 'center', SQ), lab(sb, X(i, b) + push, Y(i) + 145, 'center', SQ)]);
    }
    return keepIn([lab(sa, X(i, a) - 16, Y(i) + 145, 'right', SQ), lab(sb, X(i, b) + 16, Y(i) + 145, 'left', SQ)]);
  });
  // the name over the first band (or tick)
  const Fname = tex(p.name) as Formula;
  const nx = l0.band !== null ? (X(0, l0.band) + X(0, l0.band + 1n)) / 2 : l0.on !== null ? X(0, l0.on) : (ax0 + ax1) / 2;
  const nameB = texBox(Fname, nx, Y(0) - 110, { size: 76, align: 'center' });
  const mid = n ? M.levels[n - 1]! : null;
  const midX = mid ? X(n - 1, mid.lo + 5n) : 0;
  const midLab = mid && mid.L > 0 ? lab(decStr(mid.lo + 5n, mid.L), midX, Y(n - 1) - 48, 'center', SQ) : null;
  // marks: lettered points over the first line
  const marks = (p.marks ?? []).map(m => ({ t: m.t, x: XR(0, m.x), b: wordsBox(m.t, XR(0, m.x), Y(0) - 64, { size: 52, align: 'center' }) }));
  const xs = marks.map(m => m.x).sort((a, b) => a - b);
  for (let j = 1; j < xs.length; j++) check(xs[j]! - xs[j - 1]! >= 56, NAME, 'two lettered points are too close to tell apart');

  // ---- readability checks: rows never overlap each other ----
  for (let i = 0; i < n; i++) {
    const rows = [...(i === 0 ? ticksL0 : []), ...bandLab[i]!, ...sqLab[i]!, ...ends[i]!];
    for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
      const A = rows[a]!.b, Bx = rows[b]!.b;
      check(!(A.x0 < Bx.x1 + 8 && Bx.x0 < A.x1 + 8 && A.y0 < Bx.y1 + 4 && Bx.y0 < A.y1 + 4), NAME, `labels overlap on line ${i}`);
    }
    for (const r of [...bandLab[i]!, ...sqLab[i]!, ...ends[i]!, ...(i === 0 ? ticksL0 : [])]) check(r.b.x0 >= 4 && r.b.x1 <= 1916, NAME, 'a label runs off the canvas');
  }
  check(nameB.y0 >= fr.y - 30, NAME, 'the name does not fit over the first line');

  const bandBox = (i: number): Box => {
    const l = M.levels[i]!;
    if (l.band === null) return box(X(i, l.on!) - 10, Y(i) - 12, X(i, l.on!) + 10, Y(i) + 12);
    return box(X(i, l.band), Y(i) - 12, X(i, l.band + 1n), Y(i) + 12);
  };
  const ink = paint(th, 'ink', 'line');

  function drawAxis(c: Canvas, i: number, k: number): void {
    if (k <= 0) return;
    const l = M.levels[i]!, y = Y(i), a = E.smooth(k);
    inkLine(c, [[ax0 - 18, y], [ax0 - 18 + (ax1 - ax0 + 36) * a, y]], { col: 'ink', w: 4, seed: 700 + i, rough: 0.5 });
    const g = c.g, steps = Number(l.hi - l.lo);
    for (let j = 0; j <= steps; j++) {
      const kj = E.smooth(clamp(k * 1.6 - (j / steps) * 0.6));
      if (kj <= 0) continue;
      const big = l.L === 0 || j === 0 || j === steps, h = big ? 18 : j === 5 ? 15 : 11;
      withAlpha(c, kj, () => { g.save(); g.strokeStyle = ink; g.lineWidth = big ? 3.5 : 2.5; g.lineCap = 'round'; const x = ax0 + (j / steps) * (ax1 - ax0); g.beginPath(); g.moveTo(x, y - h); g.lineTo(x, y + h); g.stroke(); g.restore(); });
    }
    for (const L of ends[i]!) texDraw(c, L.F, L.x, L.y, { size: L.size, align: L.align, k: a, col: 'dim' });
  }
  function drawBeam(c: Canvas, i: number, k: number): void {
    // the band of line i-1 carried down to line i: a soft lime light, no outline (labels may sit on it)
    if (k <= 0 || i < 1) return;
    const up = M.levels[i - 1]!;
    if (up.band === null) return;
    const xa = X(i - 1, up.band), xb = X(i - 1, up.band + 1n), y0 = Y(i - 1) + 12, y1 = Y(i) - 16, yc = Y(i - 1) + 186;
    const a = E.smooth(k), yb = lerp(y0, y1, a);
    const ya = Math.min(yc, yb);
    const t = yb > yc ? (yb - yc) / (y1 - yc) : 0;
    const g = c.g;
    g.save();
    g.fillStyle = paint(th, 'link', 'fill'); g.globalAlpha *= 0.06;
    g.beginPath(); g.moveTo(xa, y0); g.lineTo(xb, y0); g.lineTo(xb, ya); g.lineTo(lerp(xb, ax1, t), yb); g.lineTo(lerp(xa, ax0, t), yb); g.lineTo(xa, ya); g.closePath(); g.fill();
    g.restore();
    // its two edges, thin and dashed: the piece above becomes the whole line below
    g.save();
    g.strokeStyle = paint(th, 'link', 'line'); g.globalAlpha *= 0.55; g.lineWidth = 2.5; g.setLineDash([7, 8]); g.lineCap = 'round';
    g.beginPath();
    g.moveTo(xa, y0 + 4); g.lineTo(xa, ya); if (t > 0) g.lineTo(lerp(xa, ax0, t), yb);
    g.moveTo(xb, y0 + 4); g.lineTo(xb, ya); if (t > 0) g.lineTo(lerp(xb, ax1, t), yb);
    g.stroke();
    g.restore();
  }
  function drawBand(c: Canvas, i: number, k: number, pulse: number): void {
    if (k <= 0) return;
    const l = M.levels[i]!, y = Y(i), a = E.smooth(k);
    const g = c.g;
    if (l.band !== null) {
      const xa = X(i, l.band), xb = X(i, l.band + 1n);
      g.save(); g.globalAlpha *= a; g.fillStyle = paint(th, 'link', 'fill');
      g.beginPath(); g.roundRect(xa, y - 10, (xb - xa) * a, 20, 8); g.fill(); g.restore();
      if (pulse > 0) withAlpha(c, pulse, () => { g.save(); g.strokeStyle = paint(th, 'link', 'line'); g.lineWidth = 3; g.beginPath(); g.roundRect(xa - 8, y - 20, xb - xa + 16, 40, 12); g.stroke(); g.restore(); });
    }
    if (l.L === 0) {
      // the whole numbers at the band ends turn lime (drawn by drawTicks); nothing else to write
    } else for (const L of bandLab[i]!) texDraw(c, L.F, L.x, L.y, { size: L.size, align: L.align, k: a, col: 'link', glow: pulse * 0.8 });
  }
  function drawTicks0(c: Canvas, k: number, kB: number): void {
    if (k <= 0 || l0.L !== 0) return;
    ticksL0.forEach((L, j) => {
      const a = l0.lo + BigInt(j);
      const ki = E.smooth(clamp(k * 1.6 - (j / ticksL0.length) * 0.6));
      const hot = kB > 0.5 && (l0.band !== null ? a === l0.band || a === l0.band + 1n : a === l0.on);
      texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'center', k: 1, alpha: ki, col: hot ? 'link' : 'ink' });
    });
  }
  function drawDot(c: Canvas, i: number, k: number): void {
    if (k <= 0) return;
    const x = XR(i, p.x), y = Y(i), g = c.g;
    withAlpha(c, E.smooth(k), () => {
      g.save(); g.fillStyle = paint(th, 'link', 'line'); g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = DUSK.navy; g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill(); g.restore();
    });
  }

  function draw(c: Canvas, P: Progress<ZoomStep>, focus: ZoomFocus = {}): void {
    const kA = P.k('axis');
    // beams under everything
    for (let i = 1; i < n; i++) drawBeam(c, i, P.k(`zoom${i}` as ZoomStep));
    for (let i = 0; i < n; i++) drawAxis(c, i, i === 0 ? kA : P.k(`zoom${i}` as ZoomStep));
    drawTicks0(c, kA, P.k('band0'));
    for (let i = 0; i < n; i++) {
      const kB = P.k(`band${i}` as ZoomStep);
      drawBand(c, i, kB, focus.band?.(i) ?? 0);
      const kS = P.k(`sq${i}` as ZoomStep);
      if (kS > 0) for (const L of sqLab[i]!) texDraw(c, L.F, L.x, L.y, { size: L.size, align: L.align, k: E.smooth(kS), col: 'first', glow: (focus.sq?.(i) ?? 0) * 0.8 });
    }
    const kN = P.k('name');
    if (kN > 0 && l0.band !== null) {
      const a = E.smooth(kN), xa = X(0, l0.band), xb = X(0, l0.band + 1n), y = Y(0);
      inkLine(c, [[xa, y - 26], [xa, y - 50], [xb, y - 50], [xb, y - 26]], { col: 'link', w: 4, seed: 712, alpha: a, rough: 0.5 });
      texDraw(c, Fname, nx, y - 110, { size: 76, align: 'center', k: a, col: 'link', glow: focus.name ? focus.name * 0.9 : 0 });
    } else if (kN > 0) texDraw(c, Fname, nx, Y(0) - 110, { size: 76, align: 'center', k: E.smooth(kN), col: 'link' });
    const kM = P.k('mid');
    if (kM > 0 && mid && mid.L > 0) {
      const y = Y(n - 1), g = c.g;
      withAlpha(c, E.smooth(kM), () => { g.save(); g.strokeStyle = paint(th, 'pick', 'line'); g.lineWidth = 4; g.setLineDash([8, 7]); g.beginPath(); g.moveTo(midX, y - 30); g.lineTo(midX, y + 30); g.stroke(); g.restore(); });
      if (midLab) texDraw(c, midLab.F, midLab.x, midLab.y, { size: midLab.size, align: 'center', k: E.smooth(kM), col: 'pick' });
    }
    const kD = P.k('dot');
    for (let i = 0; i < n; i++) drawDot(c, i, kD);
    const kK = P.k('marks');
    if (kK > 0) for (const m of marks) {
      const g = c.g, y = Y(0);
      withAlpha(c, E.smooth(kK), () => { g.save(); g.fillStyle = paint(th, 'pick', 'line'); g.beginPath(); g.arc(m.x, y, 10, 0, Math.PI * 2); g.fill(); g.restore(); });
      drawWords(c, m.t, m.x, y - 64, 'pick', E.smooth(kK), { size: 52, align: 'center' });
    }
  }
  const all = [...ticksL0, ...bandLab.flat(), ...sqLab.flat(), ...ends.flat()].map(l => l.b);
  return {
    kind: 'ZoomLine', maths: M,
    box: unionBox([box(ax0 - 20, Y(0) - 30, ax1 + 20, Y(n - 1) + 30), nameB, ...all]),
    where: {
      axis: i => box(ax0, Y(i) - 18, ax1, Y(i) + 18),
      band: bandBox,
      bandLabels: i => (bandLab[i]!.length ? unionBox([bandBox(i), ...bandLab[i]!.map(l => l.b)]) : bandBox(i)),
      squares: i => (sqLab[i]!.length ? unionBox(sqLab[i]!.map(l => l.b)) : bandBox(i)),
      name: nameB,
      dot: i => box(XR(i, p.x) - 10, Y(i) - 10, XR(i, p.x) + 10, Y(i) + 10),
      mark: j => marks[j]!.b,
    },
    draw,
  };
}
/** the interval of x at L places as decimal strings [lo, hi] (null when x is exactly a tick) */
export function bounds(x: Real, L: number): [string, string] | null {
  if (exactAt(x, L)) return null;
  const F = floorScaled(x, L);
  return [decStr(F, L), decStr(F + 1n, L)];
}
export { fdiv };
