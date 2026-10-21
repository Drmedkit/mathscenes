// RootRuler: a number line for roots. Where a root lives between whole numbers or tenths, which tenth it rounds to,
// how two different roots compare, and the two solutions of x² = p, one each side of 0.
//   axis    the line, its minor ticks and the labelled values (staggered into a second row when they would touch)
//   powers  under each whole-number label its square or cube (amber): the radicands that have whole roots
//   band    a lime band between two values (k < root < k + 1, or two tenths)
//   mid     the midpoint of the band: a dashed tick (lavender) and its label
//   marks   points on the line with a TeX label above (stacked in rows when close); `f.marks[i]` stages them one by one
//   arcs    teal arcs from 0 to every mark (the same distance from 0, both ways)
// Pure: values are checked to lie on the line; the layout throws BlockError when labels cannot be read.
import { type Box, box, clamp, unionBox, lerp } from '../../../core/math';
import { type Canvas, strokePts, dot, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import type { Paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine } from '../../wash';

export type MarkCol = 'link' | 'first' | 'second' | 'pick' | 'ink' | 'wrong';
export interface RulerMark { v: number; tex: string; col: MarkCol }
export interface RulerParams {
  lo: number; hi: number;
  /** minor tick step (1, 0.5, 0.1 ...) */ minor: number;
  /** values that get a number under the line */ labels: number[];
  /** the square or the cube of each whole label, in amber under it */ powers?: 2 | 3 | null;
  marks?: RulerMark[];
  band?: [number, number] | null;
  mid?: number | null;
  arcs?: boolean;
  /** the line's height inside the frame, 0..1 (default 0.5) */ at?: number;
}
export type RulerStep = 'axis' | 'powers' | 'band' | 'mid' | 'marks' | 'arcs';
export const RULER_STEPS: readonly RulerStep[] = ['axis', 'powers', 'band', 'mid', 'marks', 'arcs'];
const NAME = 'RootRuler';
const NUM = 60;

/** TeX of a decimal value without float noise (minus as a TeX minus) */
export function numTex(v: number): string { const s = String(Number(v.toFixed(6))); return s; }

export function rulerFits(p: Pick<RulerParams, 'lo' | 'hi' | 'minor'>): boolean {
  const n = (p.hi - p.lo) / p.minor;
  return p.hi > p.lo && Math.abs(n - Math.round(n)) < 1e-6 && n >= 2 && n <= 40;
}

export interface RulerFocus { marks?: number[] }
export interface RulerBlock {
  readonly kind: 'RootRuler';
  readonly steps: readonly RulerStep[];
  readonly box: Box;
  readonly where: { line: Box; x(v: number): number; y: number; mark(i: number): Box; markDot(i: number): Box; band: Box; label(v: number): Box };
  draw(c: Canvas, p: Progress<RulerStep>, f?: RulerFocus): void;
}

export function RootRuler(p: RulerParams, fr: Frame): RulerBlock {
  check(rulerFits(p), NAME, `the line ${p.lo}..${p.hi} by ${p.minor} has too many or too few ticks`);
  const marks = p.marks ?? [];
  for (const v of [...p.labels, ...marks.map(m => m.v), ...(p.band ?? []), ...(p.mid != null ? [p.mid] : [])]) check(v >= p.lo - 1e-9 && v <= p.hi + 1e-9, NAME, `${v} is off the line ${p.lo}..${p.hi}`);
  const X0 = fr.x + 80, X1 = fr.x + fr.w - 80, Y = fr.y + fr.h * (p.at ?? 0.5);
  const x = (v: number) => lerp(X0, X1, (v - p.lo) / (p.hi - p.lo));
  // labels under the line, staggered into two rows when they would touch
  type Lab = { v: number; F: Formula; x: number; y: number; b: Box; col: Paint; pw?: { F: Formula; y: number; b: Box } };
  const labs: Lab[] = [];
  const all = [...p.labels.map(v => ({ v, col: 'ink' as Paint })), ...(p.mid != null ? [{ v: p.mid, col: 'pick' as Paint }] : [])].sort((a, b) => a.v - b.v);
  const rowEnd = [-Infinity, -Infinity];
  for (const L of all) {
    const F = tex(numTex(L.v)) as Formula;
    let row = 0, b = texBox(F, x(L.v), Y + 66, { size: NUM, align: 'center' });
    if (b.x0 < rowEnd[0]! + 14) { row = 1; b = texBox(F, x(L.v), Y + 136, { size: NUM, align: 'center' }); check(b.x0 >= rowEnd[1]! + 14, NAME, `labels at ${L.v} overlap`); }
    rowEnd[row] = b.x1;
    labs.push({ v: L.v, F, x: x(L.v), y: row ? Y + 136 : Y + 66, b, col: L.col });
  }
  const rows = rowEnd[1] === -Infinity ? 1 : 2;
  if (p.powers) {
    const py = Y + 66 + rows * 70;
    for (const L of labs) {
      if (L.col !== 'ink' || !Number.isInteger(L.v)) continue;
      const F = tex(String(L.v ** p.powers)) as Formula;
      L.pw = { F, y: py, b: texBox(F, L.x, py, { size: NUM, align: 'center' }) };
    }
    const pl = labs.filter(l => l.pw);
    for (let i = 1; i < pl.length; i++) check(pl[i]!.pw!.b.x0 > pl[i - 1]!.pw!.b.x1 + 10, NAME, 'the powers row overlaps');
  }
  // marks above the line, stacked in rows when close
  type Mk = { F: Formula; x: number; y: number; b: Box; dotB: Box; col: MarkCol };
  const mks: Mk[] = [];
  // with arcs the labels sit higher, so an arc never runs through a label
  const MK = p.arcs ? 165 : 92;
  const placed: Box[] = [];
  marks.forEach(m => {
    const F = tex(m.tex) as Formula;
    let r = 0, b: Box;
    for (;;) {
      b = texBox(F, x(m.v), Y - MK - r * 80, { size: NUM, align: 'center' });
      if (!placed.some(q => b.x0 < q.x1 + 12 && q.x0 < b.x1 + 12 && b.y0 < q.y1 && q.y0 < b.y1)) break;
      r++;
      check(r < 4, NAME, 'too many marks close together');
    }
    placed.push(b);
    mks.push({ F, x: x(m.v), y: Y - MK - r * 80, b, dotB: box(x(m.v) - 12, Y - 12, x(m.v) + 12, Y + 12), col: m.col });
  });
  for (const b of placed) check(b.x0 >= fr.x - 10 && b.x1 <= fr.x + fr.w + 10 && b.y0 >= fr.y - 10, NAME, 'a mark label runs off the frame');
  const bandB = p.band ? box(x(p.band[0]), Y - 22, x(p.band[1]), Y + 22) : box(X0, Y, X0, Y);

  function draw(c: Canvas, P: Progress<RulerStep>, f: RulerFocus = {}): void {
    const kA = P.k('axis'), kP = P.k('powers'), kB = P.k('band'), kM = P.k('mid'), kK = P.k('marks'), kR = P.k('arcs');
    if (kA > 0) {
      const a = E.smooth(kA);
      inkLine(c, [[X0 - 30, Y], [lerp(X0 - 30, X1 + 30, E.inOut(kA)), Y]], { col: 'ink', w: 4, seed: 51 });
      const n = Math.round((p.hi - p.lo) / p.minor);
      for (let i = 0; i <= n; i++) {
        const v = p.lo + i * p.minor, whole = Math.abs(v - Math.round(v)) < 1e-9, hl = whole ? 18 : 10;
        strokePts(c, [[x(v), Y - hl], [x(v), Y + hl]], { col: whole ? 'ink' : 'dim', lw: whole ? 3.5 : 2.5, alpha: a * (whole ? 1 : 0.8) });
      }
      for (const L of labs) if (L.col === 'ink') texDraw(c, L.F, L.x, L.y, { size: NUM, align: 'center', col: 'ink', alpha: a });
    }
    if (kP > 0) for (const L of labs) if (L.pw) texDraw(c, L.pw.F, L.x, L.pw.y, { size: NUM, align: 'center', col: 'first', alpha: E.smooth(kP) });
    if (kB > 0 && p.band) {
      const k = E.smooth(kB), { g } = c;
      g.save(); g.globalAlpha *= 0.32 * k; g.fillStyle = '#B4EA6A';
      g.beginPath(); g.roundRect(bandB.x0, bandB.y0, bandB.w * E.inOut(kB), bandB.h, 8); g.fill(); g.restore();
      strokePts(c, [[bandB.x0, Y - 26], [bandB.x0, Y + 26]], { col: 'link', lw: 5, alpha: k });
      strokePts(c, [[bandB.x1, Y - 26], [bandB.x1, Y + 26]], { col: 'link', lw: 5, alpha: k });
    }
    if (kM > 0 && p.mid != null) {
      const k = E.smooth(kM), xm = x(p.mid);
      strokePts(c, [[xm, Y - 40], [xm, Y + 34]], { col: 'pick', lw: 4, alpha: k, dash: [8, 7] });
      for (const L of labs) if (L.col === 'pick') texDraw(c, L.F, L.x, L.y, { size: NUM, align: 'center', col: 'pick', alpha: k });
    }
    mks.forEach((M, i) => {
      const k = clamp(f.marks?.[i] ?? kK);
      if (k <= 0) return;
      const a = E.smooth(k);
      strokePts(c, [[M.x, Y - 14], [M.x, lerp(Y - 14, M.b.y1 + 10, a)]], { col: M.col, lw: 3, alpha: 0.85 * a });
      dot(c, M.x, Y, 11, M.col, a);
      texDraw(c, M.F, M.x, M.y, { size: NUM, align: 'center', col: M.col, alpha: a });
    });
    if (kR > 0 && p.arcs) {
      const x0 = x(0);
      mks.forEach((M, i) => {
        const d = M.x - x0, h = Math.min(95, Math.abs(d) * 0.4);
        const pts: [number, number][] = [];
        for (let j = 0; j <= 32; j++) { const t = j / 32; pts.push([x0 + d * t, Y - 20 - 4 * h * t * (1 - t)]); }
        drawOn(c, pts, E.inOut(clamp(kR * 1.2 - i * 0.2)), { col: 'second', lw: 4 });
      });
    }
  }
  const line = box(X0 - 30, Y - 20, X1 + 30, Y + 20);
  return {
    kind: 'RootRuler', steps: RULER_STEPS,
    box: unionBox([line, ...labs.map(l => l.b), ...labs.filter(l => l.pw).map(l => l.pw!.b), ...placed]),
    where: {
      line, x, y: Y, band: bandB,
      mark: i => mks[i]!.b, markDot: i => mks[i]!.dotB,
      label: v => { const L = labs.find(l => Math.abs(l.v - v) < 1e-9); return L ? L.b : box(x(v), Y + 40, x(v), Y + 40); },
    },
    draw,
  };
}
