// SetLine: number lines that show SOLUTION SETS (one row per statement), the HS "number line with intervals" block
// (docs/lessons/HS_PLAN.md §3 item 7; could move to src/lesson/kit/).
//   rows   one horizontal number line per statement, all on the same scale, its name (TeX) in a column at the left;
//          tick numbers 'above' or 'below' the line (or 'none'); a set painted on it: rays to the ends (arrowheads),
//          segments, points, unions, all reals, or nothing; closed dot = included, open ring = left out. A finite end
//          that is not a numbered tick gets its own number in the number row (it covers the ticks it would hit).
//          `shift` slides the whole set by a number on step '<row>.shift' (the name cross-fades to `name2`): adding or
//          subtracting the same number on every part translates the band, the order is kept.
//   maps   "do the same to every number": arrows from numbers on one row to their images on a lower row.
//          + / − runs the arrows parallel; × or ÷ by a negative number mirrors through 0 and the arrows CROSS (the
//          order reverses). The block computes the images and asserts the order rule.
//   tests  test values on a row (on the side away from its numbers): a lavender dot, the value, and a check (the value
//          is in the row's set) or a cross (it is not), computed from the set unless the lesson gives `ok`.
// Steps (keys): 'ax' the lines, '<row>.set', '<row>.shift', each map key, each test key. Focus: glow on names /
// tests / ends, dimmed rows. Layout is pure and checked (numbers >= 60 px, nothing overlaps, everything in the frame);
// it throws BlockError when a window would not read.
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { type Canvas, arrow, dot, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type SSet, member, nT, near } from './sets';

export type Role = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'ink' | 'dim' | 'water';
export interface SLRow {
  key: string;
  /** TeX name in the left column (a short statement or expression: "x", "-3x", "x > 1") */ name?: string;
  /** the name after the shift step */ name2?: string;
  nameRole?: Role;
  set?: SSet; role?: Role; dashed?: boolean;
  /** slide the set by this much on step '<key>.shift' */ shift?: number;
  numbers?: 'above' | 'below' | 'none';
  /** y of the line (default: rows spread evenly in the frame) */ y?: number;
}
export interface SLTest { key: string; row: string; v: number; ok?: boolean }
export interface SLMap { key: string; from: string; to: string; vs: number[]; op: { kind: 'add' | 'mul'; by: number }; role?: Role }
export interface SLParams { lo: number; hi: number; tick: number; every?: number; rows: SLRow[]; tests?: SLTest[]; maps?: SLMap[]; nameCol?: number }
export interface SLFocus {
  /** 0..1 glow on a row name ('name.<row>'), a test key, or an end ('end.<row>.<i>') */ pulse?: Record<string, number>;
  /** rows drawn faint (0..1) */ dim?: Record<string, number>;
}
export interface SetLineBlock {
  readonly kind: 'SetLine';
  readonly box: Box;
  readonly steps: readonly string[];
  readonly mapped: Record<string, { from: number; to: number }[] & { reverses: boolean }>;
  readonly tests: readonly { key: string; v: number; ok: boolean }[];
  readonly where: { x(v: number): number; row(key: string): Box; name(key: string): Box; test(key: string): Box; end(row: string, v: number): Box };
  draw(c: Canvas, p: Progress<string>, f?: SLFocus): void;
}

const NAME = 'SetLine';
export const SL = { num: 60, name: 64, test: 60 } as const;
const NUM_ROW = 64, TEST_ROW = 64, CHECK_ROW = 132, R_DOT = 15, OVER = 30, BAND = 22;

/** estimated advance width of a short TeX source (numbers, a name); deterministic, so generators and tests can check a
 *  picture without MathJax */
export function estW(src: string, size: number): number {
  let s = src.replace(/\\cssId\{[^}]*\}/g, '');
  let w = 0;
  s = s.replace(/\\t?frac\{([^}]*)\}\{([^}]*)\}/g, (_m, a: string, b: string) => { w += Math.max(estW(a, 1000), estW(b, 1000)) * 0.72 + 120; return ''; });
  s = s.replace(/\\(le|ge)/g, () => { w += 778 + 556; return ''; });
  s = s.replace(/\\(div|times|cdot)/g, () => { w += 778 + 444; return ''; });
  s = s.replace(/\\text\{([^}]*)\}/g, (_m, t: string) => { w += t.length * 470; return ''; });
  s = s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}\s]/g, '');
  let prev = '';
  for (const ch of s) {
    const binary = /[0-9a-zA-Z)]/.test(prev);
    w += /[0-9]/.test(ch) ? 500 : ch === '.' ? 278 : ch === '-' || ch === '+' ? 778 + (binary ? 444 : 0) : ch === '=' || ch === '<' || ch === '>' ? 778 + 556 : ch === '(' || ch === ')' ? 389 : 572;
    prev = ch;
  }
  return (w * size) / 1000;
}
/** a readable window around some values: range, tick and number spacing for a line `width` px long */
export function axisFor(values: readonly number[], width = 600, o: { zero?: boolean } = {}): { lo: number; hi: number; tick: number; every: number } {
  const vs = o.zero === false ? [...values] : [...values, 0];
  const m = Math.min(...vs), M = Math.max(...vs);
  const whole = vs.every(v => near(v, Math.round(v)));
  for (const tick of [0.5, 1, 2, 5, 10, 20, 25, 50, 100].filter(t => whole ? t >= 1 : true)) {
    let lo = Math.floor(m / tick - 1e-9) * tick - tick, hi = Math.ceil(M / tick + 1e-9) * tick + tick;
    let n = Math.round((hi - lo) / tick);
    while (n < 8) { lo -= tick; hi += tick; n += 2; }
    if (n > 20) continue;
    const px = (width * tick) / (hi - lo);
    const wMax = Math.max(estW(nT(lo), SL.num), estW(nT(hi), SL.num), estW(nT(lo + tick), SL.num));
    for (const every of [1, 2, 4, 5, 10]) if (px * every >= wMax + 34) return { lo, hi, tick, every };
  }
  const t = 10 ** Math.ceil(Math.log10(Math.max(1, M - m) / 6));
  return { lo: Math.floor(m / t) * t - t, hi: Math.ceil(M / t) * t + t, tick: t, every: 2 };
}

export function SetLine(p: SLParams, fr: Frame, th: Theme): SetLineBlock {
  check(p.rows.length >= 1 && p.rows.length <= 3, NAME, 'one to three rows');
  check(p.hi > p.lo && p.tick > 0, NAME, 'lo < hi and a positive tick');
  const nT0 = (p.hi - p.lo) / p.tick;
  check(Math.abs(nT0 - Math.round(nT0)) < 1e-9 && nT0 <= 24, NAME, `${p.lo}..${p.hi} must be at most 24 whole ticks of ${p.tick}`);
  const every = p.every ?? 1;
  const hasName = p.rows.some(r => r.name);
  const nameCol = hasName ? (p.nameCol ?? Math.max(150, ...p.rows.map(r => Math.max(r.name ? estW(r.name, SL.name) : 0, r.name2 ? estW(r.name2, SL.name) : 0) + 40))) : 0;
  const x0 = fr.x + nameCol + OVER + 20, x1 = fr.x + fr.w - OVER - 20;
  check(x1 - x0 >= 440, NAME, 'the frame is too narrow for the number line (the names are too wide)');
  const X = (v: number) => x0 + ((v - p.lo) / (p.hi - p.lo)) * (x1 - x0);
  const inWin = (v: number, what: string) => check(v >= p.lo - 1e-9 && v <= p.hi + 1e-9, NAME, `${what} ${nT(v)} is off the line ${nT(p.lo)}..${nT(p.hi)}`);
  const hits = (a: Box, b: Box, pad = 0) => a.x0 - pad < b.x1 && b.x0 - pad < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const lb = (x: number, y: number, src: string, size: number): Box => { const w = estW(src, size); return box(x - w / 2, y - size * 0.45, x + w / 2, y + size * 0.45); };

  // rows: y positions
  const nR = p.rows.length;
  const rows = p.rows.map((r, i) => {
    const y = r.y ?? Math.round(fr.y + fr.h * (i + 0.5) / nR + (nR === 1 ? 0 : 0));
    const side = r.numbers ?? 'below';
    return { ...r, i, y, side, role: r.role ?? 'link' as Role };
  });
  const R = new Map(rows.map(r => [r.key, r] as const));
  const row = (k: string) => { const r = R.get(k); check(r, NAME, `no row '${k}'`); return r; };
  const numY = (r: (typeof rows)[number]) => (r.side === 'above' ? r.y - NUM_ROW : r.y + NUM_ROW);
  const awayY = (r: (typeof rows)[number], d: number) => (r.side === 'above' ? r.y + d : r.y - d);
  for (const r of rows) {
    check(r.y - (r.side === 'above' ? NUM_ROW + 40 : CHECK_ROW + 30) >= fr.y - 20, NAME, `row '${r.key}' is too close to the top`);
    check(r.y + (r.side === 'below' ? NUM_ROW + 40 : 40) <= fr.y + fr.h + 20, NAME, `row '${r.key}' is too close to the bottom`);
  }
  for (let i = 1; i < rows.length; i++) check(rows[i]!.y - rows[i - 1]!.y >= 200, NAME, 'rows are too close together');

  // tick numbers
  interface Tick { row: string; v: number; x: number; label: string | null; box: Box | null }
  const ticks: Tick[] = [];
  const nTick = Math.round(nT0);
  for (const r of rows) {
    let prev: Box | null = null;
    for (let i = 0; i <= nTick; i++) {
      const v = p.lo + i * p.tick, x = X(v);
      const show = r.side !== 'none' && Math.abs(Math.round(v / p.tick) % every) === 0;
      const src = show ? nT(v) : null;
      const b = src ? lb(x, numY(r), src, SL.num) : null;
      if (b && prev) check(!hits(prev, b, 16), NAME, `the numbers ${nT(v - every * p.tick)} and ${nT(v)} overlap; number fewer ticks`);
      if (b) prev = b;
      ticks.push({ row: r.key, v, x, label: src, box: b });
    }
  }
  // sets and their end marks
  const isTick = (r: string, v: number) => ticks.some(t => t.row === r && t.label !== null && near(t.v, v));
  interface Mark { row: string; v: number; x: number; src: string; box: Box; after: boolean }
  const marks: Mark[] = [];
  for (const r of rows) {
    if (!r.set) continue;
    for (const I of r.set) for (const v of [I.lo, I.hi]) {
      if (!Number.isFinite(v)) continue;
      inWin(v, 'the end');
      if (r.shift !== undefined) inWin(v + r.shift, 'the shifted end');
      if (r.side !== 'none' && !isTick(r.key, v) && !marks.some(m => m.row === r.key && near(m.v, v))) marks.push({ row: r.key, v, x: X(v), src: nT(v), box: lb(X(v), numY(r), nT(v), SL.num), after: false });
      if (r.shift !== undefined && r.side !== 'none' && !isTick(r.key, v + r.shift) && !marks.some(m => m.row === r.key && near(m.v, v + r.shift!)))
        marks.push({ row: r.key, v: v + r.shift, x: X(v + r.shift), src: nT(v + r.shift), box: lb(X(v + r.shift), numY(r), nT(v + r.shift), SL.num), after: true });
    }
  }
  for (let i = 0; i < marks.length; i++) for (let j = i + 1; j < marks.length; j++) {
    const A = marks[i]!, B = marks[j]!;
    if (A.row === B.row && A.after === B.after) check(!hits(A.box, B.box, 12), NAME, `the numbers ${A.src} and ${B.src} overlap`);
  }
  // tests
  const tests = (p.tests ?? []).map(t => {
    const r = row(t.row); inWin(t.v, 'the test value');
    const ok = t.ok ?? (r.set ? member(r.set, t.v) : false);
    const lbox = lb(X(t.v), awayY(r, TEST_ROW), nT(t.v), SL.test);
    // the check / cross above the number is ~50 px wide: test values need that much room too
    const room = lbox.w < 56 ? box(lbox.cx - 28, lbox.y0, lbox.cx + 28, lbox.y1) : lbox;
    return { ...t, ok, x: X(t.v), y: r.y, lbox, room, cy: awayY(r, CHECK_ROW) };
  });
  for (let i = 0; i < tests.length; i++) for (let j = i + 1; j < tests.length; j++) {
    const A = tests[i]!, B = tests[j]!;
    if (A.row === B.row) check(!hits(A.room, B.room, 10), NAME, `the test values ${nT(A.v)} and ${nT(B.v)} overlap`);
  }
  // maps
  const mapped: SetLineBlock['mapped'] = {};
  const maps = (p.maps ?? []).map(m => {
    const A = row(m.from), B = row(m.to);
    check(A.y < B.y && A.side !== 'below' && B.side !== 'above', NAME, `map '${m.key}': from an upper row (numbers above) to a lower row (numbers below)`);
    check(m.op.kind === 'add' || m.op.by !== 0, NAME, 'map: × 0 is not a reversible step');
    const pairs = m.vs.map(v => ({ from: v, to: m.op.kind === 'add' ? v + m.op.by : v * m.op.by }));
    for (const q of pairs) { inWin(q.from, 'the map starts at'); inWin(q.to, 'the map lands at'); }
    const reverses = m.op.kind === 'mul' && m.op.by < 0;
    for (const P of pairs) for (const Q of pairs) if (P.from < Q.from - 1e-9) check((P.to < Q.to) === !reverses, NAME, `map '${m.key}': ${nT(P.from)} < ${nT(Q.from)} must ${reverses ? 'reverse' : 'keep'} its order`);
    mapped[m.key] = Object.assign(pairs, { reverses });
    return { ...m, pairs, A, B, role: m.role ?? 'pick' as Role };
  });
  // names
  const names = rows.filter(r => r.name).map(r => ({ r, box: box(fr.x, r.y - SL.name * 0.5, fr.x + nameCol, r.y + SL.name * 0.5) }));
  const allY = rows.flatMap(r => [r.y - (r.side === 'above' ? NUM_ROW + 36 : tests.some(t => t.row === r.key) ? CHECK_ROW + 30 : 40), r.y + (r.side === 'below' ? NUM_ROW + 36 : 40)]);

  // ---------- drawing ----------
  const fCache = new Map<string, Formula>();
  const F = (src: string): Formula => { let f = fCache.get(src); if (!f) { f = tex(src) as Formula; fCache.set(src, f); } return f; };
  const col = (r: Role): Paint => r;
  function glowBox(c: Canvas, B: Box, r: Role, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, col(r), 'fill'); g.globalAlpha *= 0.16;
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill();
    g.globalAlpha /= 0.16; g.strokeStyle = paint(th, col(r), 'fill'); g.lineWidth = 4;
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.stroke();
    g.restore();
  }
  function checkMark(c: Canvas, x: number, y: number, ok: boolean, k: number): void {
    if (k <= 0) return;
    if (ok) drawOn(c, [[x - 22, y + 2], [x - 6, y + 18], [x + 24, y - 20]], E.inOut(clamp(k)), { col: 'link', lw: 8 });
    else { drawOn(c, [[x - 17, y - 17], [x + 17, y + 17]], E.inOut(clamp(k * 2)), { col: 'wrong', lw: 8 }); drawOn(c, [[x + 17, y - 17], [x - 17, y + 17]], E.inOut(clamp(k * 2 - 1)), { col: 'wrong', lw: 8 }); }
  }
  function drawSet(c: Canvas, r: (typeof rows)[number], k: number, dx: number, alpha: number): void {
    if (!r.set || k <= 0) return;
    const ke = E.inOut(clamp(k));
    const cl = (v: number) => Math.max(x0 - OVER + 4, Math.min(x1 + OVER - 4, v));
    for (const I of r.set) {
      const point = near(I.lo, I.hi);
      const xa = Number.isFinite(I.lo) ? X(I.lo + dx) : x0 - OVER, xb = Number.isFinite(I.hi) ? X(I.hi + dx) : x1 + OVER;
      // grow from the finite end(s) outward
      let a = xa, b = xb;
      if (!point) {
        if (Number.isFinite(I.lo) && Number.isFinite(I.hi)) { const m = (xa + xb) / 2; a = m - (m - xa) * ke; b = m + (xb - m) * ke; }
        else if (Number.isFinite(I.lo)) b = xa + (xb - xa) * ke;
        else if (Number.isFinite(I.hi)) a = xb - (xb - xa) * ke;
        else { const m = (x0 + x1) / 2; a = m - (m - xa) * ke; b = m + (xb - m) * ke; }
        const tipL = !Number.isFinite(I.lo) ? 28 : 0, tipR = !Number.isFinite(I.hi) ? 28 : 0;
        const ba = cl(a + (tipL && k > 0.9 ? tipL : 0)), bb = cl(b - (tipR && k > 0.9 ? tipR : 0));
        c.g.save(); c.g.globalAlpha *= alpha;
        if (bb - ba > 2) {
          if (r.dashed) {
            c.g.setLineDash([18, 12]); c.g.strokeStyle = paint(th, col(r.role), 'fill'); c.g.lineWidth = 5;
            c.g.strokeRect(ba, r.y - BAND / 2 - 4, bb - ba, BAND + 8);
          } else wash(c, rectPts(ba, r.y - BAND / 2, bb - ba, BAND, 7), col(r.role), { seed: 700 + r.i * 31, rough: 1.0, ink: DUSK.ink, inkW: 2, shade: 0.15 });
        }
        const head = (tx: number, sgn: number) => {
          c.g.save(); c.g.globalAlpha *= clamp((k - 0.9) / 0.1); c.g.setLineDash([]); c.g.fillStyle = paint(th, col(r.role), 'fill');
          c.g.beginPath(); c.g.moveTo(tx, r.y); c.g.lineTo(tx - sgn * 36, r.y - 24); c.g.lineTo(tx - sgn * 36, r.y + 24); c.g.closePath(); c.g.fill(); c.g.restore();
        };
        if (tipR && k > 0.9) head(x1 + OVER, 1);
        if (tipL && k > 0.9) head(x0 - OVER, -1);
        c.g.restore();
      }
      // end dots
      const kd = E.back(clamp(k / 0.35));
      for (const [j, [v, closed]] of ([[I.lo, I.loC], [I.hi, I.hiC]] as [number, boolean][]).entries()) {
        if (!Number.isFinite(v)) continue;
        if (point && j === 1) continue;
        const x = X(v + dx);
        c.g.save(); c.g.globalAlpha *= alpha;
        if (closed) { dot(c, x, r.y, (R_DOT + 3) * kd, DUSK.ink); dot(c, x, r.y, R_DOT * kd, col(r.role)); }
        else { dot(c, x, r.y, (R_DOT + 3) * kd, col(r.role)); dot(c, x, r.y, (R_DOT - 3.5) * kd, '#181B3A'); }
        c.g.restore();
      }
    }
  }

  function draw(c: Canvas, P: Progress<string>, f: SLFocus = {}): void {
    const pulse = f.pulse ?? {}, dimOf = (k: string) => 1 - 0.65 * clamp(f.dim?.[k] ?? 0);
    const kAx = clamp(P.k('ax'));
    for (const r of rows) {
      const al = dimOf(r.key);
      if (kAx > 0) {
        const cx = (x0 + x1) / 2, ke = E.inOut(kAx);
        c.g.save(); c.g.globalAlpha *= al;
        arrow(c, [[cx, r.y], [cx - (cx - x0 + OVER) * ke, r.y]], 1, { col: DUSK.cream, lw: 4, head: kAx > 0.9 ? 20 : 0 });
        arrow(c, [[cx, r.y], [cx + (x1 + OVER - cx) * ke, r.y]], 1, { col: DUSK.cream, lw: 4, head: kAx > 0.9 ? 20 : 0 });
        const kt = clamp((kAx - 0.3) / 0.7);
        const kSet = clamp(P.k(r.key + '.set')), kSh = r.shift !== undefined ? clamp(P.k(r.key + '.shift')) : 0;
        for (const t of ticks) {
          if (t.row !== r.key || kt <= 0) continue;
          const big = t.label !== null;
          c.g.save(); c.g.globalAlpha *= kt; c.g.strokeStyle = DUSK.cream; c.g.lineWidth = big ? 3.5 : 2.5;
          c.g.beginPath(); c.g.moveTo(t.x, r.y - (big ? 15 : 10)); c.g.lineTo(t.x, r.y + (big ? 15 : 10)); c.g.stroke(); c.g.restore();
          if (!t.label || !t.box) continue;
          let hide = 0;
          for (const m of marks) if (m.row === r.key && hits(m.box, t.box, 30)) hide = Math.max(hide, kSet * (m.after ? kSh : 1 - kSh));
          const a = kt * (1 - hide);
          if (a > 0.01) texDraw(c, F(t.label), t.x, numY(r), { size: SL.num, align: 'center', col: 'dim', alpha: a });
        }
        for (const m of marks) {
          if (m.row !== r.key) continue;
          const a = kt * kSet * (r.shift !== undefined ? (m.after ? kSh : 1 - kSh) : 1);
          if (a > 0.01) texDraw(c, F(m.src), m.x, numY(r), { size: SL.num, align: 'center', col: col(r.role), alpha: a });
        }
        c.g.restore();
      }
      // name (cross-fades to name2 on the shift)
      const n = names.find(q => q.r.key === r.key);
      if (n && kAx > 0) {
        const kSh = r.shift !== undefined ? clamp(P.k(r.key + '.shift')) : 0;
        glowBox(c, box(n.box.x1 - Math.max(estW(r.name!, SL.name), r.name2 ? estW(r.name2, SL.name) : 0), n.box.y0, n.box.x1, n.box.y1), r.nameRole ?? 'ink', pulse['name.' + r.key] ?? 0);
        const na = kAx * al;
        if (r.name2 && kSh > 0) {
          texDraw(c, F(r.name!), n.box.x1, r.y, { size: SL.name, align: 'right', col: col(r.nameRole ?? 'ink'), alpha: na * (1 - kSh) });
          texDraw(c, F(r.name2), n.box.x1, r.y, { size: SL.name, align: 'right', col: col(r.nameRole ?? 'ink'), alpha: na * kSh });
        } else texDraw(c, F(r.name!), n.box.x1, r.y, { size: SL.name, align: 'right', col: col(r.nameRole ?? 'ink'), alpha: na });
      }
    }
    // maps (under the sets)
    for (const m of maps) {
      const k = clamp(P.k(m.key));
      if (k <= 0) continue;
      const fade = 1 - clamp(P.k(m.key + ':fade'));
      if (fade <= 0) continue;
      m.pairs.forEach((q, i) => {
        const ki = lag(k, i, m.pairs.length, 0.3);
        if (ki <= 0) return;
        const xa = X(q.from), xb = X(q.to);
        c.g.save(); c.g.globalAlpha *= fade;
        arrow(c, [[xa, m.A.y + 26], [xb, m.B.y - 26]], E.inOut(ki), { col: col(m.role), lw: 4.5, head: 22 });
        c.g.restore();
      });
    }
    // sets
    for (const r of rows) {
      const k = clamp(P.k(r.key + '.set'));
      const dx = r.shift !== undefined ? r.shift * E.inOut(clamp(P.k(r.key + '.shift'))) : 0;
      drawSet(c, r, k, dx, dimOf(r.key));
      if (r.set) r.set.forEach((I, i) => { for (const v of [I.lo, I.hi]) if (Number.isFinite(v)) { const pk = pulse[`end.${r.key}.${i}`] ?? 0; if (pk > 0) glowBox(c, box(X(v + dx) - 22, r.y - 22, X(v + dx) + 22, r.y + 22), r.role, pk); } });
    }
    // tests
    for (const t of tests) {
      const k = clamp(P.k(t.key));
      if (k <= 0) continue;
      dot(c, t.x, t.y, 11 * E.back(clamp(k / 0.4)), 'pick');
      glowBox(c, t.lbox, 'pick', pulse[t.key] ?? 0);
      texDraw(c, F(nT(t.v)), t.x, t.lbox.cy, { size: SL.test, align: 'center', col: 'pick', alpha: clamp(k / 0.4) });
      checkMark(c, t.x, t.cy, t.ok, clamp((k - 0.55) / 0.45));
    }
  }

  const steps = ['ax', ...rows.map(r => r.key + '.set'), ...rows.filter(r => r.shift !== undefined).map(r => r.key + '.shift'), ...maps.map(m => m.key), ...tests.map(t => t.key)];
  return {
    kind: 'SetLine', steps, mapped,
    tests: tests.map(t => ({ key: t.key, v: t.v, ok: t.ok })),
    box: box(fr.x, Math.min(...allY), x1 + OVER, Math.max(...allY)),
    where: {
      x: X,
      row: k => { const r = row(k); return box(x0 - OVER, r.y - 18, x1 + OVER, r.y + 18); },
      name: k => { const n = names.find(q => q.r.key === k); check(n, NAME, `row '${k}' has no name`); return n.box; },
      test: k => { const t = tests.find(q => q.key === k); check(t, NAME, `no test '${k}'`); return t.lbox; },
      end: (k, v) => { const r = row(k); return box(X(v) - R_DOT - 3, r.y - R_DOT - 3, X(v) + R_DOT + 3, r.y + R_DOT + 3); },
    },
    draw,
  };
}
export type { Pt };
