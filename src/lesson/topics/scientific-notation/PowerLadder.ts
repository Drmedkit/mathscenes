// PowerLadder: the powers-of-ten ladder. Each rung is a power of 10 and each rung is 10 times the one below, so the
// exponent of a x 10^n says which rung a quantity is past, and the coefficient (1 <= a < 10) says how far up the gap
// it sits (a log scale inside every gap: 2, 3, ... 9 as small ticks; 10 would already be the next rung).
// Quantities hang off the ladder as painted marks with their name and value. Comparing two quantities is a climb:
// a ghost of the smaller one climbs whole rungs (x 10 each, the powers of 10 divided), then one arc inside a gap
// takes it to the other quantity (the coefficients divided).
//   rungs   the ladder, its rungs 10^lo .. 10^hi and the coefficient ticks
//   m0 m1 m2  the marks, one by one
//   climb   the ghost of mark climb.from climbs climb.rungs rungs, one "x 10" arc per rung
//   within  the arc from the ghost to mark within.to, with its label
//   band    the gap 10^band .. 10^(band+1) lights up (an order-of-magnitude band)
// Pure maths in computeLadder(); the layout throws BlockError when it cannot be read.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Dec, mul, plain, pow10, sciOf, toNum } from './sci';

export type LadderStep = 'rungs' | 'm0' | 'm1' | 'm2' | 'climb' | 'within' | 'band';
export const LADDER_STEPS: readonly LadderStep[] = ['rungs', 'm0', 'm1', 'm2', 'climb', 'within', 'band'];
export type Icon = 'planet' | 'cell' | 'grain' | 'town' | 'dot';
export interface LadderMark {
  v: Dec;
  /** a short name (words) */ name: string;
  /** the value as TeX (default: v in scientific notation) */ val?: string;
  col: Paint; icon?: Icon;
  /** a claimed value that is not real: dashed, in `wrong` */ dashed?: boolean;
}
export interface LadderParams {
  lo: number; hi: number;
  /** words over the ladder ("km from the Sun") */ unit?: string;
  marks: LadderMark[];
  climb?: { from: number; rungs: number };
  within?: { to: number; label: string };
  band?: number;
}
export interface LadderMaths {
  lo: number; hi: number;
  /** each mark's height in rungs: n + log10(a) */ pos: number[];
  /** each mark's a and n */ sci: { a: Dec; n: number }[];
  ghost: Dec | null; ghostPos: number | null;
}
const NAME = 'PowerLadder';
const log10 = (d: Dec) => Math.log10(toNum(d));

export function computeLadder(p: LadderParams): LadderMaths {
  check(Number.isInteger(p.lo) && Number.isInteger(p.hi) && p.hi > p.lo, NAME, 'rungs lo < hi, whole numbers');
  check(p.hi - p.lo <= 7, NAME, `${p.hi - p.lo} gaps do not fit`);
  check(p.marks.length >= 1 && p.marks.length <= 3, NAME, '1 to 3 marks');
  const sci = p.marks.map(mk => sciOf(mk.v));
  const pos = p.marks.map(mk => log10(mk.v));
  pos.forEach((x, i) => check(x >= p.lo - 1e-9 && x <= p.hi + 1e-9, NAME, `mark ${p.marks[i]!.name} is off the ladder (10^${p.lo} to 10^${p.hi})`));
  // the height inside a gap IS the coefficient: n <= pos < n + 1 exactly when 1 <= a < 10
  sci.forEach((s, i) => check(Math.floor(pos[i]! + 1e-9) === s.n, NAME, 'a mark sits in the wrong gap'));
  let ghost: Dec | null = null, ghostPos: number | null = null;
  if (p.climb) {
    const f = p.marks[p.climb.from];
    check(f && Number.isInteger(p.climb.rungs) && p.climb.rungs >= 0, NAME, 'climb: a mark and a whole number of rungs');
    ghost = mul(f.v, pow10(p.climb.rungs));
    ghostPos = log10(ghost);
    check(ghostPos <= p.hi + 1e-9, NAME, 'the climb runs off the top of the ladder');
  }
  if (p.within) check(p.climb && p.marks[p.within.to], NAME, 'within needs a climb and a target mark');
  if (p.band !== undefined) check(p.band >= p.lo && p.band < p.hi, NAME, 'the band is off the ladder');
  return { lo: p.lo, hi: p.hi, pos, sci, ghost, ghostPos };
}

/** label pulses 0..1: a mark's name and value, the x 10 labels, the within label (a symbol and its picture part light up together) */
export interface LadderPulse { pulse?: number[]; climb?: number; within?: number }
export interface LadderBlock {
  readonly kind: 'PowerLadder';
  readonly maths: LadderMaths;
  readonly steps: readonly LadderStep[];
  readonly box: Box;
  readonly where: {
    rung(n: number): Box; rungLabel(n: number): Box;
    /** a mark's dot on the ladder, its icon, its value label */ dot(i: number): Box; icon(i: number): Box; value(i: number): Box; label(i: number): Box;
    /** the climb arcs with their x 10 labels, one x 10 label, the within arc's label */ climb: Box | null; climbLabel(i: number): Box | null; within: Box | null;
    band: Box | null;
  };
  draw(c: Canvas, p: Progress<LadderStep>, f?: LadderPulse): void;
}

export function PowerLadder(p: LadderParams, fr: Frame, th: Theme): LadderBlock {
  const m = computeLadder(p);
  const X = fr.x + 200, R = 18;
  const top = fr.y + (p.unit ? 130 : 70), bottom = fr.y + fr.h - 60;
  const bh = (bottom - top) / (p.hi - p.lo);
  check(bh >= 100, NAME, `gaps of ${Math.round(bh)} px are too small`);
  const Y = (pos: number) => bottom - (pos - p.lo) * bh;
  const RUNG = 60;
  const rungF: Formula[] = [];
  for (let n = p.lo; n <= p.hi; n++) rungF.push(tex(`10^{${n}}`) as Formula);
  const rungLabel = (n: number) => texBox(rungF[n - p.lo]!, X - R - 26, Y(n), { size: RUNG, align: 'right' });
  for (let n = p.lo; n <= p.hi; n++) check(rungLabel(n).x0 >= fr.x - 50, NAME, `the label 10^${n} does not fit left of the ladder`);
  // marks: dot on the right rail, a leader out to the icon, name over value
  const ICON_X = X + 300, TXT_X = X + 345, GAP = 132;
  const valF = p.marks.map((mk, i) => tex(mk.val ?? `${plain(m.sci[i]!.a)} \\times 10^{${m.sci[i]!.n}}`) as Formula);
  const ym = m.pos.map(Y);
  // spread the labels: keep them GAP apart, in ladder order, inside the frame
  const order = ym.map((y, i) => ({ y, i })).sort((a, b) => b.y - a.y);
  const yl = ym.slice();
  for (let it = 0; it < 40; it++) {
    let moved = false;
    for (let k = 1; k < order.length; k++) {
      const lo = order[k - 1]!.i, hi = order[k]!.i;
      const d = yl[lo]! - yl[hi]!;
      if (d < GAP) { const s = (GAP - d) / 2; yl[lo]! += s; yl[hi]! -= s; moved = true; }
    }
    const minY = fr.y + 70, maxY = fr.y + fr.h - 50;
    for (let i = 0; i < yl.length; i++) { if (yl[i]! < minY) { yl[i] = minY; moved = true; } if (yl[i]! > maxY) { yl[i] = maxY; moved = true; } }
    if (!moved) break;
  }
  for (let k = 1; k < order.length; k++) check(yl[order[k - 1]!.i]! - yl[order[k]!.i]! >= GAP - 2, NAME, 'the mark labels overlap');
  const nameBox = (i: number) => wordsBox(p.marks[i]!.name, TXT_X, yl[i]! - 34, { size: 44 });
  const valBox = (i: number) => texBox(valF[i]!, TXT_X, yl[i]! + 30, { size: 56, align: 'left' });
  p.marks.forEach((_, i) => check(Math.max(nameBox(i).x1, valBox(i).x1) <= fr.x + fr.w + 210, NAME, `the label of ${p.marks[i]!.name} runs into the board`));
  if (p.unit) check(wordsBox(p.unit, X - R, top - 78, { size: 44 }).x1 <= fr.x + fr.w + 210, NAME, 'the unit runs into the board');
  const leaderPts = (i: number): Pt[] => {
    const y0 = ym[i]!, y1 = yl[i]!;
    return Math.abs(y1 - y0) < 2 ? [[X + R, y0], [ICON_X - 36, y0]] : [[X + R, y0], [X + 226, y0], [X + 254, y1], [ICON_X - 36, y1]];
  };
  // the climb: one "x 10" arc per rung on the right of the ladder; the within arc bulges further out. Labels sit
  // beside their arc and are nudged (inside the arc's span) off the mark leaders, the icons, the other labels and
  // the within arc's line.
  const ARC_W = 58, ARC_W2 = 124, ALX = X + R + ARC_W + 18, ALX2 = X + R + ARC_W2 + 18;
  const timesF = tex('\\times 10') as Formula;
  const g0 = p.climb ? m.pos[p.climb.from]! : 0;
  const busy: (readonly [number, number])[] = [...ym.map((y, i) => [Math.min(y, yl[i]!) - 40, Math.max(y, yl[i]!) + 40] as const), ...yl.map(y => [y - 46, y + 46] as const)];
  const nudge = (y: number, a: number, b: number): number => {
    const lo = Math.min(a, b) + 24, hi = Math.max(a, b) - 24;
    const free = (v: number) => busy.every(([u, w]) => v < u || v > w);
    if (free(y)) return y;
    for (let d = 6; d < 300; d += 6) for (const v of [y - d, y + d]) if (v >= lo && v <= hi && free(v)) return v;
    return y;
  };
  const withinArc = p.within && m.ghostPos !== null ? (() => {
    const a = Y(m.ghostPos!), b = ym[p.within!.to]!;
    const ly = nudge((a + b) / 2, a, b);
    busy.push([ly - 34, ly + 34]);
    return { a, b, ly, F: tex(p.within!.label) as Formula };
  })() : null;
  // the climb labels also stay off the within arc's line (it crosses their column)
  if (withinArc) busy.push([Math.min(withinArc.a, withinArc.b) - 30, Math.max(withinArc.a, withinArc.b) + 30]);
  const climbArcs = p.climb ? Array.from({ length: p.climb.rungs }, (_, i) => {
    const a = Y(g0 + i), b = Y(g0 + i + 1);
    const ly = nudge((a + b) / 2, a, b);
    busy.push([ly - 34, ly + 34]);
    return { a, b, ly };
  }) : [];
  const climbBox = climbArcs.length ? unionBox(climbArcs.map(c => unionBox([box(X + R, Math.min(c.a, c.b), X + R + ARC_W, Math.max(c.a, c.b)), texBox(timesF, ALX, c.ly, { size: 50 })]))) : null;
  const climbLabels = climbArcs.map(c => texBox(timesF, ALX, c.ly, { size: 50 }));
  const withinLabel = withinArc ? texBox(withinArc.F, ALX2, withinArc.ly, { size: 50 }) : null;
  const bandBox = p.band !== undefined ? box(X - R - 14, Y(p.band + 1), X + R + 14, Y(p.band)) : null;

  const arcPts = (a: number, b: number, W = ARC_W): Pt[] => {
    const P: Pt[] = [];
    const w = Math.min(W, 18 + Math.abs(b - a) * 0.5);
    for (let i = 0; i <= 28; i++) { const t = i / 28; P.push([X + R + 4 + Math.sin(Math.PI * t) * w, lerp(a, b, t)]); }
    return P;
  };
  function icon(c: Canvas, i: number, x: number, y: number, k: number): void {
    const mk = p.marks[i]!, kind = mk.icon ?? 'dot';
    const col: Paint = mk.dashed ? 'wrong' : mk.col;
    const { g } = c;
    if (mk.dashed) {
      g.save(); g.globalAlpha *= k; g.setLineDash([9, 8]); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 4;
      g.beginPath(); g.arc(x, y, 28, 0, Math.PI * 2); g.stroke(); g.restore();
      return;
    }
    withAlpha(c, k, () => {
      if (kind === 'planet' || kind === 'dot') {
        const r = kind === 'planet' ? 30 : 16;
        wash(c, circlePts(x, y, r), col, { seed: 80 + i, ink: DUSK.ink, inkW: 2.5, rough: 0.8 });
        if (kind === 'planet') inkLine(c, [[x - r * 0.8, y + 6], [x, y + 11], [x + r * 0.8, y + 4]], { col: DUSK.ink, w: 2.5, seed: 90 + i, alpha: 0.5 });
      } else if (kind === 'cell') {
        wash(c, circlePts(x, y, 30, 0.82), col, { seed: 81 + i, ink: DUSK.ink, inkW: 2.5, rough: 0.8 });
        wash(c, circlePts(x, y, 12, 0.82), DUSK.navy2, { seed: 82 + i, ink: null, rough: 0.6, alpha: 0.35 });
      } else if (kind === 'grain') {
        wash(c, [[x - 30, y + 4], [x - 18, y - 22], [x + 8, y - 26], [x + 30, y - 6], [x + 22, y + 20], [x - 10, y + 24]], col, { seed: 83 + i, ink: DUSK.ink, inkW: 2.5, rough: 1.2 });
      } else {
        // a town: three small houses
        for (let h = 0; h < 3; h++) {
          const hx = x - 30 + h * 22, hy = y + 20 - (h === 1 ? 10 : 0), w = 20, hh = h === 1 ? 34 : 24;
          wash(c, [[hx, hy], [hx, hy - hh], [hx + w / 2, hy - hh - 12], [hx + w, hy - hh], [hx + w, hy]], col, { seed: 84 + h + i, ink: DUSK.ink, inkW: 2, rough: 0.6 });
        }
      }
    });
  }

  function glowBox(c: Canvas, B: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = paint(th, col, 'fill'); g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 3.5; g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.stroke(); g.restore();
  }
  function draw(c: Canvas, P: Progress<LadderStep>, f: LadderPulse = {}): void {
    const kR = E.smooth(P.k('rungs'));
    if (kR <= 0) return;
    const { g } = c;
    // the band first (under the rails)
    const kB = E.smooth(P.k('band'));
    if (kB > 0 && bandBox) {
      g.save(); g.globalAlpha *= 0.32 * kB; g.fillStyle = paint(th, 'link', 'fill');
      g.beginPath(); g.roundRect(bandBox.x0, bandBox.y0 + 3, bandBox.w, bandBox.h - 6, 10); g.fill(); g.restore();
    }
    // rails and rungs
    const yTop = Y(p.hi) - 34, yBot = Y(p.lo) + 34;
    const grow = (y: number) => lerp(yBot, y, kR);
    inkLine(c, [[X - R, yBot], [X - R, grow(yTop)]], { col: DUSK.woodLight, w: 7, seed: 401, rough: 0.5 });
    inkLine(c, [[X + R, yBot], [X + R, grow(yTop)]], { col: DUSK.woodLight, w: 7, seed: 402, rough: 0.5 });
    for (let n = p.lo; n <= p.hi; n++) {
      const a = clamp(kR * (p.hi - p.lo + 1.5) - (n - p.lo));
      if (a <= 0) continue;
      const y = Y(n);
      const lit = kB > 0 && p.band !== undefined && (n === p.band || n === p.band + 1);
      inkLine(c, [[X - R - 10, y], [X + R + 10, y]], { col: lit ? 'link' : 'ink', w: 6, seed: 410 + n, alpha: a, rough: 0.4 });
      texDraw(c, rungF[n - p.lo]!, X - R - 26, y, { size: RUNG, align: 'right', alpha: a, col: lit && kB > 0.5 ? 'link' : 'ink' });
      // the coefficient ticks 2..9 inside the gap above (log spaced)
      if (n < p.hi) for (let d = 2; d <= 9; d++) {
        const ty = Y(n + Math.log10(d));
        withAlpha(c, a * 0.75, () => { g.save(); g.strokeStyle = paint(th, 'faint', 'line'); g.lineWidth = d === 5 ? 3 : 2; g.beginPath(); g.moveTo(X + R + 3, ty); g.lineTo(X + R + (d === 5 ? 16 : 10), ty); g.stroke(); g.restore(); });
      }
    }
    if (p.unit) drawWords(c, p.unit, X - R, top - 78, 'dim', kR, { size: 44 });
    // marks
    p.marks.forEach((mk, i) => {
      const k = E.smooth(P.k(`m${i}` as LadderStep));
      if (k <= 0) return;
      const col: Paint = mk.dashed ? 'wrong' : mk.col;
      const L = leaderPts(i);
      if (mk.dashed) withAlpha(c, k, () => { g.save(); g.setLineDash([10, 9]); g.strokeStyle = paint(th, 'wrong', 'line'); g.lineWidth = 3; g.beginPath(); L.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); });
      else inkLine(c, L, { col, w: 3.5, seed: 420 + i, alpha: k, rough: 0.4 });
      // the dot on the ladder
      g.save(); g.globalAlpha *= k; g.fillStyle = paint(th, col, 'fill');
      g.beginPath(); g.arc(X + R, ym[i]!, 10, 0, Math.PI * 2); g.fill(); g.restore();
      icon(c, i, ICON_X, yl[i]!, k);
      glowBox(c, unionBox([nameBox(i), valBox(i)]), col, f.pulse?.[i] ?? 0);
      drawWords(c, mk.name, TXT_X, yl[i]! - 34, mk.dashed ? 'wrong' : 'dim', k, { size: 44 });
      texDraw(c, valF[i]!, TXT_X, yl[i]! + 30, { size: 56, align: 'left', alpha: k, col });
    });
    // the climb: a ghost ring of mark `from` rises rung by rung
    const kC = P.k('climb');
    if (p.climb && kC > 0) {
      const col = p.marks[p.climb.from]!.col;
      const n = p.climb.rungs, u = kC * n;
      for (let i = 0; i < n; i++) {
        const t = clamp(u - i);
        if (t <= 0) break;
        const A = arcPts(climbArcs[i]!.a, climbArcs[i]!.b);
        inkLine(c, A.slice(0, Math.max(2, Math.ceil(A.length * clamp(t * 1.2)))), { col: 'link', w: 4, seed: 440 + i, rough: 0.3 });
        texDraw(c, timesF, ALX, climbArcs[i]!.ly, { size: 50, align: 'left', alpha: clamp(t * 2 - 0.7), col: 'link' });
        if (t >= 1) glowBox(c, climbLabels[i]!, 'link', f.climb ?? 0);
      }
      const gy = Y(g0 + Math.min(n, E.inOut(clamp(u / Math.max(1, n))) * n));
      g.save(); g.setLineDash([7, 6]); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4;
      g.beginPath(); g.arc(X, gy, 15, 0, Math.PI * 2); g.stroke(); g.restore();
    }
    const kW = P.k('within');
    if (withinArc && kW > 0) {
      const A = arcPts(withinArc.a, withinArc.b, ARC_W2);
      inkLine(c, A.slice(0, Math.max(2, Math.ceil(A.length * clamp(kW * 1.2)))), { col: 'link', w: 4, seed: 450, rough: 0.3 });
      texDraw(c, withinArc.F, ALX2, withinArc.ly, { size: 50, align: 'left', alpha: clamp(kW * 2 - 0.7), col: 'link' });
      if (kW >= 1 && withinLabel) glowBox(c, withinLabel, 'link', f.within ?? 0);
    }
  }
  const all: Box[] = [box(X - R - 12, Y(p.hi) - 34, X + R + 12, Y(p.lo) + 34)];
  for (let n = p.lo; n <= p.hi; n++) all.push(rungLabel(n));
  p.marks.forEach((_, i) => all.push(nameBox(i), valBox(i)));
  return {
    kind: 'PowerLadder', maths: m, steps: LADDER_STEPS,
    box: unionBox(all),
    where: {
      rung: n => box(X - R - 10, Y(n) - 4, X + R + 10, Y(n) + 4), rungLabel,
      dot: i => box(X + R - 10, ym[i]! - 10, X + R + 10, ym[i]! + 10),
      icon: i => box(ICON_X - 32, yl[i]! - 30, ICON_X + 32, yl[i]! + 30),
      value: valBox, label: i => unionBox([nameBox(i), valBox(i)]),
      climb: climbBox, climbLabel: i => climbLabels[i] ?? null, within: withinLabel, band: bandBox,
    },
    draw,
  };
}
function circlePts(x: number, y: number, r: number, sq = 1): Pt[] {
  return Array.from({ length: 28 }, (_, i) => { const t = (i / 28) * Math.PI * 2; return [x + Math.cos(t) * r, y + Math.sin(t) * r * sq] as Pt; });
}
