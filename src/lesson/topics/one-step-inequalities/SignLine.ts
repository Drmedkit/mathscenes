// SignLine: number lines for signed one-step equations and inequalities.
//   axes   one or two horizontal number lines (ticks, numbers on ONE side, the quantity's name at the left end)
//   marks  a boundary or a value: a dot on the line (open = left out, closed = included) and its number in the
//          label row (the number takes the place of the tick numbers it would cover)
//   sets   a solution set painted on the line: a ray to one end (with an arrowhead) or a segment
//   maps   "do the same to both sides": arrows from numbers on the top line to their images on the bottom line.
//          + / − slides every number the same way (the arrows run parallel, the order is kept); × or ÷ by a
//          negative number mirrors the line through 0 (the arrows CROSS: the order reverses). The block computes the
//          images and asserts the order rule, so a picture cannot show a wrong flip.
//   tests  test values on the other side of the line from the numbers, each with a check or a cross
//   jumps  a signed change as an arc from one number to another (+9, −4), labelled at its top
// Layout: the top line of a pair has its numbers ABOVE it, the bottom line BELOW it, so the band between the lines
// holds only the arrows. Numbers 60 px (marks 68 px), names 68 px; overlapping numbers throw (BlockError).
// Every element has a key; draw(c, P) reads P.k(key) for each one (axis keys are 'ax.<id>').
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { type Canvas, arrow, dot, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export type LRole = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'ink' | 'dim';
export interface AxisSpec {
  id: string; lo: number; hi: number;
  /** tick spacing, and a number under every `every`-th tick (counted from 0) */ tick: number; every: number;
  /** y of the line; the numbers sit 'above' or 'below' it */ y: number; side: 'above' | 'below';
  /** TeX name of the quantity at the left end ("-2h", "x") */ name?: string; nameRole?: LRole;
}
export interface MarkSpec { key: string; axis: string; v: number; tex: string; role: LRole; dot: 'open' | 'closed' | 'none' }
export interface SetSpec {
  key: string; axis: string; from: number;
  /** a ray to the right (+1) or left (−1) end of the line, or a segment to `to` */ dir: -1 | 1; to?: number;
  role: LRole; dashed?: boolean;
}
export interface MapSpec { key: string; from: string; to: string; vs: number[]; op: { kind: 'add' | 'mul'; by: number }; role: LRole; tex: string }
export interface TestSpec { key: string; axis: string; v: number; tex: string; ok: boolean }
export interface JumpSpec { key: string; axis: string; from: number; to: number; tex: string; role: LRole }
export interface SignLineParams { axes: AxisSpec[]; marks?: MarkSpec[]; sets?: SetSpec[]; maps?: MapSpec[]; tests?: TestSpec[]; jumps?: JumpSpec[] }

export interface LineFocus {
  /** 0..1 glow around an element's number / name (keys of marks, tests, 'name.<axis>', 'op.<map>') */ pulse?: Record<string, number>;
}
export interface SignLineBlock {
  readonly kind: 'SignLine';
  readonly params: SignLineParams;
  readonly steps: readonly string[];
  readonly box: Box;
  /** the images of every map (computed) and whether the map reverses the order */
  readonly mapped: Record<string, { from: number; to: number }[] & { reverses: boolean }>;
  readonly where: {
    x(axis: string, v: number): number;
    axis(id: string): Box; name(id: string): Box;
    mark(key: string): Box; dot(key: string): Box; set(key: string): Box; test(key: string): Box; op(key: string): Box;
  };
  draw(c: Canvas, p: Progress<string>, f?: LineFocus): void;
}

const NAME = 'SignLine';
export const SIZES = { tick: 60, mark: 68, name: 60, op: 60 } as const;
const ROW = 66, CHECK_ROW = 146, NAME_COL = 240, R_DOT = 15, OVER = 34, BAND = 20, ARC = 104;

/** estimated advance width of a short TeX source (numbers, a name, an operation) at a size; deterministic, so
 *  generators and tests can check a picture without MathJax */
export function estTexW(src: string, size: number): number {
  let s = src.replace(/\\cssId\{[^}]*\}/g, '');
  let w = 0;
  s = s.replace(/\\t?frac\{([^}]*)\}\{([^}]*)\}/g, (m, a: string, b: string) => { w += Math.max(estTexW(a, 1000), estTexW(b, 1000)) * (m.startsWith('\\tfrac') ? 0.72 : 0.78) + 120; return ''; });
  s = s.replace(/\\(div|times|le|ge|cdot)/g, () => { w += 778 + 444; return ''; });
  s = s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}\s]/g, '');
  let prev = '';
  for (const ch of s) {
    const binary = /[0-9a-zA-Z)]/.test(prev);
    w += /[0-9]/.test(ch) ? 500 : ch === '.' ? 278 : ch === '-' || ch === '+' ? 778 + (binary ? 444 : 0) : ch === '=' || ch === '<' || ch === '>' ? 778 + 556 : ch === '(' || ch === ')' ? 389 : 560;
    prev = ch;
  }
  return (w * size) / 1000;
}
/** a nice axis around some values: tick step, range and number spacing that the line can show readably */
export function autoAxis(values: readonly number[], o: { zero?: boolean; width?: number; minTicks?: number; minTick?: number } = {}): Pick<AxisSpec, 'lo' | 'hi' | 'tick' | 'every'> {
  const vs = o.zero === false ? [...values] : [...values, 0];
  const m = Math.min(...vs), M = Math.max(...vs), width = o.width ?? 720;
  const minTick = o.minTick ?? (vs.every(v => Number.isInteger(v)) ? 1 : 0.25);
  for (const tick of [0.25, 0.5, 1, 2, 5, 10, 20, 25, 50].filter(t => t >= minTick)) {
    const lo = Math.floor(m / tick - 1e-9) * tick - tick, hi = Math.ceil(M / tick + 1e-9) * tick + tick;
    const n = Math.round((hi - lo) / tick);
    if (n > 20 || n < (o.minTicks ?? 6)) { if (n < (o.minTicks ?? 6)) { const pad = Math.ceil(((o.minTicks ?? 6) - n) / 2) * tick; return fitEvery(lo - pad, hi + pad, tick, width); } continue; }
    return fitEvery(lo, hi, tick, width);
  }
  return fitEvery(Math.floor(m / 100) * 100 - 100, Math.ceil(M / 100) * 100 + 100, 100, width);
}
function fitEvery(lo: number, hi: number, tick: number, width: number): Pick<AxisSpec, 'lo' | 'hi' | 'tick' | 'every'> {
  const px = (width * tick) / (hi - lo);
  const wMax = Math.max(estTexW(fmt(lo), SIZES.tick), estTexW(fmt(hi), SIZES.tick), estTexW(fmt(lo + tick), SIZES.tick));
  for (const every of [1, 2, 4, 5, 10]) if (px * every >= wMax + 30) return { lo, hi, tick, every };
  return { lo, hi, tick, every: 10 };
}
/** a tick number as TeX */
export function fmt(v: number): string {
  const r = Math.round(v * 1e6) / 1e6;
  return (r < 0 ? '-' : '') + String(Math.abs(r));
}

export function SignLine(p: SignLineParams, fr: Frame, th: Theme): SignLineBlock {
  check(p.axes.length >= 1 && p.axes.length <= 2, NAME, 'one or two number lines');
  const hasName = p.axes.some(a => a.name) || (p.maps ?? []).length > 0;
  const x0 = fr.x + (hasName ? NAME_COL : 50), x1 = fr.x + fr.w - 30;
  check(x1 - x0 >= 500, NAME, 'the frame is too narrow for a number line');
  const AX = new Map(p.axes.map(a => [a.id, a] as const));
  const ax = (id: string): AxisSpec => { const a = AX.get(id); check(a, NAME, `no number line '${id}'`); return a; };
  for (const a of p.axes) {
    check(a.lo < a.hi && a.tick > 0, NAME, `line '${a.id}': lo < hi and a positive tick`);
    const n = (a.hi - a.lo) / a.tick;
    check(Math.abs(n - Math.round(n)) < 1e-9 && n <= 40, NAME, `line '${a.id}': ${a.lo}..${a.hi} must be at most 40 whole ticks of ${a.tick}`);
    check(a.y - 230 >= fr.y - 10 || a.side === 'below', NAME, `line '${a.id}' is too close to the top of the frame`);
  }
  const xOf = (id: string, v: number): number => { const a = ax(id); return x0 + ((v - a.lo) / (a.hi - a.lo)) * (x1 - x0); };
  const on = (id: string, v: number, what: string) => { const a = ax(id); check(v >= a.lo - 1e-9 && v <= a.hi + 1e-9, NAME, `${what} ${fmt(v)} is off the line ${fmt(a.lo)}..${fmt(a.hi)}`); };
  /** names and steps sit right-aligned just left of the line's arrowhead */
  const nameX = (src: string, size: number) => x0 - OVER - 22 - estTexW(src, size) / 2;
  const rowY = (a: AxisSpec) => (a.side === 'above' ? a.y - ROW : a.y + ROW);
  const otherY = (a: AxisSpec, d: number) => (a.side === 'above' ? a.y + d : a.y - d);
  const labelBox = (x: number, y: number, src: string, size: number): Box => { const w = estTexW(src, size); return box(x - w / 2, y - size * 0.42, x + w / 2, y + size * 0.42); };
  const hits = (a: Box, b: Box, pad = 0) => a.x0 - pad < b.x1 && b.x0 - pad < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

  // tick numbers
  interface Tick { axis: string; v: number; x: number; label: string | null; box: Box | null }
  const ticks: Tick[] = [];
  for (const a of p.axes) {
    const n = Math.round((a.hi - a.lo) / a.tick);
    let prev: Box | null = null;
    for (let i = 0; i <= n; i++) {
      const v = a.lo + i * a.tick, x = xOf(a.id, v);
      const lab = Math.abs(Math.round(v / a.tick) % a.every) === 0;
      const src = lab ? fmt(v) : null;
      const b = src ? labelBox(x, rowY(a), src, SIZES.tick) : null;
      if (b && prev) check(!hits(prev, b, 18), NAME, `line '${a.id}': the numbers ${fmt(v - a.every * a.tick)} and ${fmt(v)} overlap; number fewer ticks`);
      if (b) prev = b;
      ticks.push({ axis: a.id, v, x, label: src, box: b });
    }
  }
  // marks
  const marks = (p.marks ?? []).map(m => {
    on(m.axis, m.v, 'the mark');
    const a = ax(m.axis), x = xOf(m.axis, m.v);
    return { ...m, x, y: a.y, lb: labelBox(x, rowY(a), m.tex, SIZES.mark) };
  });
  for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
    const A = marks[i]!, B = marks[j]!;
    if (A.axis === B.axis && A.v !== B.v) check(!hits(A.lb, B.lb, 14), NAME, `the numbers ${A.tex} and ${B.tex} overlap on line '${A.axis}'`);
  }
  // sets
  const sets = (p.sets ?? []).map(s => {
    on(s.axis, s.from, 'the set starts at');
    if (s.to !== undefined) on(s.axis, s.to, 'the set ends at');
    const a = ax(s.axis), xa = xOf(s.axis, s.from);
    const xb = s.to !== undefined ? xOf(s.axis, s.to) : s.dir > 0 ? x1 + OVER : x0 - OVER;
    return { ...s, xa, xb, y: a.y, ray: s.to === undefined };
  });
  // maps: compute the images, assert the order rule
  const mapped: SignLineBlock['mapped'] = {};
  const maps = (p.maps ?? []).map(m => {
    const A = ax(m.from), B = ax(m.to);
    check(A.side === 'above' && B.side === 'below' && A.y < B.y, NAME, `map '${m.key}': from a line with numbers above to a lower line with numbers below`);
    check(m.op.kind === 'add' || m.op.by !== 0, NAME, 'map: × 0 is not an inverse step');
    const pairs = m.vs.map(v => ({ from: v, to: m.op.kind === 'add' ? v + m.op.by : v * m.op.by }));
    for (const q of pairs) { on(m.from, q.from, 'the map starts at'); on(m.to, q.to, 'the map lands at'); }
    const reverses = m.op.kind === 'mul' && m.op.by < 0;
    for (let i = 0; i < pairs.length; i++) for (let j = 0; j < pairs.length; j++) {
      const P = pairs[i]!, Q = pairs[j]!;
      if (P.from < Q.from) check((P.to < Q.to) === !reverses, NAME, `map '${m.key}': ${fmt(P.from)} < ${fmt(Q.from)} must ${reverses ? 'reverse' : 'keep'} its order`);
    }
    mapped[m.key] = Object.assign(pairs, { reverses });
    const midY = (A.y + B.y) / 2;
    const ob = labelBox(nameX(m.tex, SIZES.op), midY, m.tex, SIZES.op);
    check(ob.x0 >= fr.x - 30, NAME, `the step ${m.tex} does not fit left of the lines`);
    return { ...m, pairs, A, B, ob };
  });
  // tests
  const tests = (p.tests ?? []).map(t => {
    on(t.axis, t.v, 'the test value');
    const a = ax(t.axis), x = xOf(t.axis, t.v);
    return { ...t, x, y: a.y, lb: labelBox(x, otherY(a, ROW), t.tex, SIZES.tick), cy: otherY(a, CHECK_ROW) };
  });
  for (let i = 0; i < tests.length; i++) for (let j = i + 1; j < tests.length; j++) {
    const A = tests[i]!, B = tests[j]!;
    if (A.axis === B.axis) check(!hits(A.lb, B.lb, 14), NAME, `the test values ${A.tex} and ${B.tex} overlap`);
  }
  // jumps
  const jumps = (p.jumps ?? []).map(j => {
    on(j.axis, j.from, 'the jump starts at'); on(j.axis, j.to, 'the jump ends at');
    check(j.from !== j.to, NAME, 'a jump needs two different numbers');
    check(!tests.some(t => t.axis === j.axis), NAME, 'a line shows test values or jumps, not both');
    const a = ax(j.axis), xa = xOf(j.axis, j.from), xb = xOf(j.axis, j.to);
    const s = a.side === 'above' ? 1 : -1;
    const apexY = a.y + s * (18 + ARC);
    const lb = labelBox((xa + xb) / 2, apexY + s * 50, j.tex, SIZES.mark);
    check(lb.x1 - lb.x0 < Math.abs(xb - xa) + 120, NAME, `the jump label ${j.tex} is wider than its jump`);
    return { ...j, xa, xb, y: a.y, s, lb };
  });
  const names = p.axes.filter(a => a.name).map(a => ({ a, lb: labelBox(nameX(a.name!, SIZES.name), a.y, a.name!, SIZES.name) }));
  for (const n of names) check(n.lb.x0 >= fr.x - 30, NAME, `the name ${n.a.name} does not fit left of the line`);

  // ---------- formulas (made lazily: MathJax only when drawing) ----------
  const fCache = new Map<string, Formula>();
  const F = (src: string): Formula => { let f = fCache.get(src); if (!f) { f = tex(src) as Formula; fCache.set(src, f); } return f; };
  const col = (r: LRole) => (r === 'dim' ? 'dim' : r);

  function glowBox(c: Canvas, B: Box, r: LRole, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, col(r), 'fill'); g.globalAlpha *= 0.18;
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 14); g.fill();
    g.globalAlpha /= 0.18;
    g.strokeStyle = paint(th, col(r), 'fill'); g.lineWidth = 4;
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 14); g.stroke();
    g.restore();
  }
  function checkMark(c: Canvas, x: number, y: number, ok: boolean, k: number): void {
    if (k <= 0) return;
    if (ok) drawOn(c, [[x - 20, y + 2], [x - 6, y + 17], [x + 22, y - 18]], E.inOut(clamp(k)), { col: 'link', lw: 7 });
    else { drawOn(c, [[x - 16, y - 16], [x + 16, y + 16]], E.inOut(clamp(k * 2)), { col: 'wrong', lw: 7 }); drawOn(c, [[x + 16, y - 16], [x - 16, y + 16]], E.inOut(clamp(k * 2 - 1)), { col: 'wrong', lw: 7 }); }
  }

  function draw(c: Canvas, P: Progress<string>, f: LineFocus = {}): void {
    const pulse = f.pulse ?? {};
    const markK = (m: (typeof marks)[number]) => clamp(P.k(m.key));
    // axes
    for (const a of p.axes) {
      const k = clamp(P.k('ax.' + a.id));
      if (k <= 0) continue;
      const cx = (x0 + x1) / 2, ke = E.inOut(k);
      const L: Pt[] = [[cx, a.y], [cx - (cx - x0 + OVER) * ke, a.y]], R: Pt[] = [[cx, a.y], [cx + (x1 + OVER - cx) * ke, a.y]];
      arrow(c, L, 1, { col: DUSK.cream, lw: 4, head: k > 0.9 ? 20 : 0 });
      arrow(c, R, 1, { col: DUSK.cream, lw: 4, head: k > 0.9 ? 20 : 0 });
      const kt = clamp((k - 0.3) / 0.7);
      for (const t of ticks) {
        if (t.axis !== a.id || kt <= 0) continue;
        const big = t.label !== null;
        c.g.save(); c.g.globalAlpha *= kt; c.g.strokeStyle = DUSK.cream; c.g.lineWidth = big ? 3.5 : 2.5;
        c.g.beginPath(); c.g.moveTo(t.x, a.y - (big ? 15 : 10)); c.g.lineTo(t.x, a.y + (big ? 15 : 10)); c.g.stroke(); c.g.restore();
        if (!t.label || !t.box) continue;
        let hide = 0;
        for (const m of marks) if (m.axis === a.id && hits(m.lb, t.box, 34)) hide = Math.max(hide, markK(m));
        // a test value names its own tick (on the other side of the line): do not say the number twice
        for (const q of tests) if (q.axis === a.id && Math.abs(q.x - t.x) < 2) hide = Math.max(hide, clamp(P.k(q.key) * 2));
        const al = kt * (1 - hide);
        if (al > 0.01) texDraw(c, F(t.label), t.x, rowY(a), { size: SIZES.tick, align: 'center', col: 'dim', alpha: al });
      }
      if (a.name) {
        const n = names.find(q => q.a.id === a.id)!;
        glowBox(c, n.lb, a.nameRole ?? 'ink', pulse['name.' + a.id] ?? 0);
        texDraw(c, F(a.name), x0 - OVER - 22, a.y, { size: SIZES.name, align: 'right', col: col(a.nameRole ?? 'ink'), alpha: k });
      }
    }
    // sets (under the dots)
    for (const s of sets) {
      const k = clamp(P.k(s.key));
      if (k <= 0) continue;
      const xe = s.xa + (s.xb - s.xa) * E.inOut(k), lo = Math.min(s.xa, xe), hi = Math.max(s.xa, xe);
      const tip = s.ray ? 26 : 0, sgn = Math.sign(s.xb - s.xa);
      const xBand1 = s.ray ? xe - sgn * tip : xe;
      const bl = Math.min(s.xa, xBand1), bh = Math.max(s.xa, xBand1);
      if (bh - bl > 2) {
        if (s.dashed) {
          c.g.save(); c.g.globalAlpha *= 0.85; c.g.setLineDash([16, 12]); c.g.strokeStyle = paint(th, col(s.role), 'fill'); c.g.lineWidth = 4;
          c.g.strokeRect(bl, s.y - BAND / 2 - 6, bh - bl, BAND + 12); c.g.restore();
        } else wash(c, rectPts(bl, s.y - BAND / 2, bh - bl, BAND, 6), col(s.role), { seed: 700 + Math.round(s.xa), rough: 1.1, ink: DUSK.ink, inkW: 2, shade: 0.15 });
      }
      if (s.ray && k > 0.85) {
        const a = clamp((k - 0.85) / 0.15), tx = xe;
        c.g.save(); c.g.globalAlpha *= a; c.g.fillStyle = paint(th, col(s.role), 'fill');
        c.g.beginPath(); c.g.moveTo(tx, s.y); c.g.lineTo(tx - sgn * 34, s.y - 22); c.g.lineTo(tx - sgn * 34, s.y + 22); c.g.closePath(); c.g.fill();
        if (s.dashed) { c.g.globalAlpha *= 0.5; }
        c.g.restore();
      }
      void lo; void hi;
    }
    // jumps
    for (const j of jumps) {
      const k = clamp(P.k(j.key));
      if (k <= 0) continue;
      const y0 = j.y + j.s * 18, n = 40, P2: Pt[] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = j.xa + (j.xb - j.xa) * t, yy = y0 + j.s * ARC * 4 * t * (1 - t) * 1.0;
        P2.push([x, yy]);
      }
      arrow(c, P2, E.inOut(k), { col: col(j.role), lw: 5, head: 22 });
      texDraw(c, F(j.tex), j.lb.cx, j.lb.cy, { size: SIZES.mark, align: 'center', col: col(j.role), alpha: clamp((k - 0.5) / 0.5) });
    }
    // maps
    for (const m of maps) {
      const k = clamp(P.k(m.key));
      if (k <= 0) continue;
      m.pairs.forEach((q, i) => {
        const ki = lag(k, i, m.pairs.length, 0.35);
        if (ki <= 0) return;
        const xa = xOf(m.from, q.from), xb = xOf(m.to, q.to);
        arrow(c, [[xa, m.A.y + 24], [xb, m.B.y - 24]], E.inOut(ki), { col: col(m.role), lw: 4, head: 20 });
      });
      glowBox(c, m.ob, m.role, pulse['op.' + m.key] ?? 0);
      texDraw(c, F(m.tex), x0 - OVER - 22, m.ob.cy, { size: SIZES.op, align: 'right', col: col(m.role), alpha: clamp(k * 2) });
    }
    // marks
    for (const m of marks) {
      const k = markK(m);
      if (k <= 0) continue;
      const kr = E.back(clamp(k / 0.6));
      if (m.dot !== 'none') {
        if (m.dot === 'closed') { dot(c, m.x, m.y, (R_DOT + 3) * kr, DUSK.ink); dot(c, m.x, m.y, R_DOT * kr, col(m.role)); }
        else {
          dot(c, m.x, m.y, (R_DOT + 3) * kr, col(m.role)); dot(c, m.x, m.y, (R_DOT - 3) * kr, '#181B3A');
        }
      } else {
        c.g.save(); c.g.globalAlpha *= clamp(k * 2); c.g.strokeStyle = paint(th, col(m.role), 'fill'); c.g.lineWidth = 5;
        c.g.beginPath(); c.g.moveTo(m.x, m.y - 20); c.g.lineTo(m.x, m.y + 20); c.g.stroke(); c.g.restore();
      }
      glowBox(c, m.lb, m.role, pulse[m.key] ?? 0);
      texDraw(c, F(m.tex), m.x, m.lb.cy, { size: SIZES.mark, align: 'center', col: col(m.role), alpha: clamp((k - 0.2) / 0.5) });
    }
    // tests
    for (const t of tests) {
      const k = clamp(P.k(t.key));
      if (k <= 0) continue;
      dot(c, t.x, t.y, 10 * E.back(clamp(k / 0.4)), 'pick');
      glowBox(c, t.lb, 'pick', pulse[t.key] ?? 0);
      texDraw(c, F(t.tex), t.x, t.lb.cy, { size: SIZES.tick, align: 'center', col: 'pick', alpha: clamp(k / 0.4) });
      checkMark(c, t.x, t.cy, t.ok, clamp((k - 0.55) / 0.45));
    }
  }

  const keys = [...p.axes.map(a => 'ax.' + a.id), ...(p.sets ?? []).map(s => s.key), ...(p.marks ?? []).map(m => m.key), ...(p.maps ?? []).map(m => m.key), ...(p.tests ?? []).map(t => t.key), ...(p.jumps ?? []).map(j => j.key)];
  const ys = p.axes.flatMap(a => [a.y - (a.side === 'above' ? ROW + 40 : CHECK_ROW + 30), a.y + (a.side === 'below' ? ROW + 40 : CHECK_ROW + 30)]);
  const find = <T extends { key: string }>(xs: readonly T[], k: string, what: string): T => { const e = xs.find(x => x.key === k); check(e, NAME, `no ${what} '${k}'`); return e; };
  return {
    kind: 'SignLine', params: p, steps: keys, mapped,
    box: box(fr.x, Math.min(...ys), x1 + OVER, Math.max(...ys)),
    where: {
      x: xOf,
      axis: id => { const a = ax(id); return box(x0 - OVER, a.y - 16, x1 + OVER, a.y + 16); },
      name: id => { const n = names.find(q => q.a.id === id); check(n, NAME, `line '${id}' has no name`); return n.lb; },
      mark: k => find(marks, k, 'mark').lb,
      dot: k => { const m = find(marks, k, 'mark'); return box(m.x - R_DOT - 3, m.y - R_DOT - 3, m.x + R_DOT + 3, m.y + R_DOT + 3); },
      set: k => { const s = find(sets, k, 'set'); return box(Math.min(s.xa, s.xb), s.y - BAND / 2, Math.max(s.xa, s.xb), s.y + BAND / 2); },
      test: k => find(tests, k, 'test').lb,
      op: k => find(maps, k, 'map').ob,
    },
    draw,
  };
}
