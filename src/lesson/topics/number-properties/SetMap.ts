// SetMap: the US real number system as nested regions, and closure as "where does the answer land?".
// Counting inside Whole inside Integers inside Rational; Irrational is a separate region beside Rational; the two
// together fill Real numbers, and nothing is in both. A number sits in the INNERMOST region that holds its value
// (12/4 = 3 sits with the counting numbers, √49 = 7 too, √2 with the irrationals) and belongs to every region around it.
// Closure: two numbers of a set combine (an arrow from each) into a result token; the claimed set is ringed, and the
// result lands inside it (closed for this pair) or outside it (a counterexample).
//
// Steps: real, rational, integer, whole, counting, irrational (the regions), t0 … t11 (each number drops in).
// Focus: rings on regions, glows on numbers, arrows from inputs to a result.
// Could move to the kit: a nested-set diagram with tokens placed by value and closure arrows.
import { type Box, box, clamp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { type Real, type SetId, SET_NAME, innermost } from './numbers';

export type Region = SetId | 'real';
export type MapStep = 'real' | 'rational' | 'integer' | 'whole' | 'counting' | 'irrational' | `t${number}`;
export const REGION_STEPS: readonly MapStep[] = ['real', 'rational', 'integer', 'whole', 'counting', 'irrational'];
export interface Token {
  tex: string;
  /** the exact value: decides the region */
  x?: Real;
  /** the region, when no value is given (or a deliberate wrong place: the page shows a misplacement) */
  at?: SetId;
}
export interface MapParams { tokens: readonly Token[] }
export interface MapFocus {
  rings?: readonly { at: Region; col: Paint; k: number }[];
  glows?: readonly { i: number; col: Paint; k: number }[];
  /** inputs -> result (closure) */
  arrows?: readonly { from: number; to: number; col: Paint; k: number }[];
  /** numbers struck (a wrong place) */
  strikes?: readonly { i: number; k: number }[];
  /** 0..1 fade of a number (it leaves) */
  fade?: Readonly<Record<number, number>>;
}
export interface SetMapBlock {
  readonly kind: 'SetMap';
  readonly box: Box;
  readonly sets: readonly SetId[];
  readonly where: { region(s: Region): Box; token(i: number): Box; name(s: Region): Box };
  draw(c: Canvas, P: Progress<MapStep>, f?: MapFocus): void;
}
const NAME = 'SetMap';
const LAB = 46, NUM = 62;

export function setOf(t: Token): SetId { return t.at ?? innermost(t.x!); }
export function SetMap(p: MapParams, fr: Frame, th: Theme): SetMapBlock {
  check(p.tokens.length <= 12, NAME, 'at most 12 numbers');
  for (const t of p.tokens) check(t.at !== undefined || t.x !== undefined, NAME, `${t.tex} has no value and no region`);
  const where = p.tokens.map(setOf);
  const outer = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const ratW = Math.round(fr.w * 0.62);
  const Rg = {} as Record<SetId, Box>;
  Rg.rational = box(fr.x + 22, fr.y + 78, fr.x + 22 + ratW, fr.y + fr.h - 18);
  Rg.irrational = box(Rg.rational.x1 + 22, fr.y + 78, fr.x + fr.w - 22, fr.y + fr.h - 18);
  const inset = (b: Box, top: number, bottom: number) => box(b.x0 + 24, b.y0 + top, b.x1 - 24, b.y1 - bottom);
  Rg.integer = inset(Rg.rational, 70, 132);
  Rg.whole = inset(Rg.integer, 70, 132);
  Rg.counting = inset(Rg.whole, 70, 132);
  check(Rg.counting.h >= 170, NAME, 'the counting numbers region is too small');
  const nameAt = (b: Box) => [b.x0 + 18, b.y0 + 36] as const;
  const names = {
    real: wordsBox('Real numbers', fr.x + 22, fr.y + 38, { size: LAB }),
  } as Record<Region, Box>;
  for (const s of ['rational', 'integer', 'whole', 'counting', 'irrational'] as SetId[]) {
    names[s] = wordsBox(SET_NAME[s], ...nameAt(Rg[s]), { size: LAB });
    check(names[s].x1 <= Rg[s].x1 - 10, NAME, `the name "${SET_NAME[s]}" does not fit its region`);
  }
  const per = (s: SetId) => where.filter(w => w === s).length;
  check(per('counting') <= 3 && per('whole') <= 3 && per('integer') <= 3 && per('rational') <= 3 && per('irrational') <= 4, NAME, 'too many numbers in one region');
  // token slots: the free strip of each ring (under its inner region), the irrational column, the counting region
  const slots = (s: SetId, count: number): [number, number][] => {
    if (!count) return [];
    if (s === 'irrational') {
      const b = Rg.irrational, top = b.y0 + 150, gap = Math.min(180, (b.y1 - 80 - top) / Math.max(1, count - 1));
      return Array.from({ length: count }, (_, i) => [b.cx, top + i * gap] as [number, number]);
    }
    const inner = s === 'counting' ? null : Rg[({ rational: 'integer', integer: 'whole', whole: 'counting' } as Record<string, SetId>)[s]!];
    const b = Rg[s];
    const y = inner ? (inner.y1 + b.y1) / 2 : (b.y0 + 64 + b.y1) / 2 + 4;
    const w = b.w - 50, step = Math.min(175, w / count);
    return Array.from({ length: count }, (_, i) => [b.cx + (i - (count - 1) / 2) * step, y] as [number, number]);
  };
  const F = p.tokens.map(t => tex(t.tex) as Formula);
  const pos: [number, number][] = new Array(p.tokens.length);
  for (const s of ['counting', 'whole', 'integer', 'rational', 'irrational'] as SetId[]) {
    const ids = where.map((w, i) => (w === s ? i : -1)).filter(i => i >= 0);
    const sl = slots(s, ids.length);
    ids.forEach((id, j) => { pos[id] = sl[j]!; });
  }
  const tb = (i: number) => texBox(F[i]!, pos[i]![0], pos[i]![1], { size: NUM, align: 'center' });
  p.tokens.forEach((t, i) => {
    const b = tb(i), own = Rg[where[i]!];
    check(b.x0 >= own.x0 + 6 && b.x1 <= own.x1 - 6, NAME, `${t.tex} is too wide for its region`);
    for (let j = 0; j < i; j++) { const o = tb(j); check(!(b.x0 < o.x1 + 10 && o.x0 < b.x1 + 10 && b.y0 < o.y1 && o.y0 < b.y1), NAME, 'two numbers overlap'); }
  });
  const fills: Record<SetId, string> = { rational: '#26305E', integer: '#2C3868', whole: '#334072', counting: '#3A487C', irrational: '#3A2C5C' };

  function ring(c: Canvas, b: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 6;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 16 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(b.x0 - 4, b.y0 - 4, b.w + 8, b.h + 8, 28); g.stroke(); g.restore();
  }
  function region(c: Canvas, s: SetId, k: number, hot: Paint | null): void {
    if (k <= 0) return;
    const b = Rg[s], a = E.smooth(clamp(k)), P = rectPts(b.x0, b.y0, b.w, b.h, 26);
    wash(c, P, fills[s] as never, { seed: 300 + s.length * 7, rough: 1.4, ink: null, alpha: a, shade: 0.1 });
    inkLine(c, P, { col: '#7C82B8', w: 3, closed: true, seed: 310 + s.length, alpha: a, rough: 0.8 });
    drawWords(c, SET_NAME[s], ...nameAt(b), hot ?? 'dim', a, { size: LAB });
  }
  function draw(c: Canvas, P: Progress<MapStep>, f: MapFocus = {}): void {
    const ringOf = (r: Region) => (f.rings ?? []).filter(x => x.at === r && x.k > 0.3).map(x => x.col)[0] ?? null;
    const kR = P.k('real');
    if (kR > 0) {
      const Po = rectPts(outer.x0, outer.y0, outer.w, outer.h, 30);
      wash(c, Po, '#1D2248' as never, { seed: 290, rough: 1.4, ink: null, alpha: E.smooth(clamp(kR)), shade: 0.1 });
      inkLine(c, Po, { col: '#8A90C4', w: 3, closed: true, seed: 291, alpha: E.smooth(clamp(kR)), rough: 0.8 });
      drawWords(c, 'Real numbers', fr.x + 22, fr.y + 38, ringOf('real') ?? 'ink', E.smooth(clamp(kR)), { size: LAB });
    }
    for (const s of ['rational', 'integer', 'whole', 'counting', 'irrational'] as SetId[]) region(c, s, P.k(s), ringOf(s));
    for (const r of f.rings ?? []) ring(c, r.at === 'real' ? outer : Rg[r.at], r.col, r.k);
    // arrows under the numbers
    for (const A of f.arrows ?? []) {
      if (A.k <= 0) continue;
      const a = tb(A.from), b = tb(A.to);
      const s: [number, number] = [a.cx, a.cy], e: [number, number] = [b.cx, b.cy];
      const dx = e[0] - s[0], dy = e[1] - s[1], L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const p0: [number, number] = [s[0] + ux * (a.w / 2 + 14), s[1] + uy * (a.h / 2 + 14)], p1: [number, number] = [e[0] - ux * (b.w / 2 + 18), e[1] - uy * (b.h / 2 + 18)];
      const mx = (p0[0] + p1[0]) / 2 - uy * 50, my = (p0[1] + p1[1]) / 2 + ux * 50;
      const pts: [number, number][] = [];
      for (let t = 0; t <= 1.0001; t += 1 / 24) { const u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * mx + t * t * p1[0], u * u * p0[1] + 2 * u * t * my + t * t * p1[1]]); }
      arrow(c, pts, E.inOut(clamp(A.k)), { col: A.col, lw: 4.5, head: 18 });
    }
    p.tokens.forEach((_, i) => {
      const ki = E.smooth(clamp(P.k(`t${i}`))) * (1 - clamp(f.fade?.[i] ?? 0));
      if (ki <= 0) return;
      const gl = (f.glows ?? []).find(g => g.i === i && g.k > 0);
      const col: Paint = gl && gl.k > 0.3 ? gl.col : 'ink';
      texDraw(c, F[i]!, pos[i]![0], pos[i]![1] - (1 - ki) * 40, { size: NUM, align: 'center', k: ki, col, glow: (gl?.k ?? 0) * 0.9 });
      const st = (f.strikes ?? []).find(x => x.i === i);
      if (st && st.k > 0) {
        const b = tb(i), { g } = c;
        g.save(); g.globalAlpha *= clamp(st.k); g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(b.x0 - 10, b.y1 + 6); g.lineTo(b.x0 - 10 + (b.w + 20) * E.inOut(clamp(st.k)), b.y1 + 6 - (b.h + 12) * E.inOut(clamp(st.k))); g.stroke(); g.restore();
      }
    });
  }
  return {
    kind: 'SetMap', box: outer, sets: where,
    where: { region: s => (s === 'real' ? outer : Rg[s]), token: tb, name: s => names[s] },
    draw,
  };
}
