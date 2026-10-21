// NumberLine: signed numbers as directed moves (the model of p + q and p - q = p + (-q)).
//   line    a painted track with crisp ticks every 1/den and number labels underneath (a stride when they are dense)
//   point   a dot ON the line in its role colour; its tick label turns that colour (a ghost point is a dashed ring)
//   jump    a directed segment ABOVE the line in a row: from `from`, `by` units (right for +, left for -), its value
//           written above it; dashed drops tie the tail and the tip to the line
//   flip    a jump turns around its tail (it shrinks, passes zero, grows the other way): "taking q away" = adding -q
// Colour roles: first = the number you start from, second = the number added or taken away, pick = the flipped
// arrow (its opposite), link = where you land (the answer), wrong = a wrong landing.
//
// Pure helpers first (no DOM: generators and tests use them), then the block, which lays out inside a Frame and throws
// BlockError when it cannot be read (labels >= 60 px, no label over another, rows inside the frame).
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, arrow, dot, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { circlePts, rectPts } from '../../../core/pts';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'NumberLine';
export type Col = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'ink' | 'dim';

// ---------- pure helpers ----------
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
/** TeX of a number on the line: -3, -1\tfrac{1}{2}, -0.3 (dec), with a real minus */
export function numTex(v: number, den = 1, dec = false, improper = false): string {
  if (near(v, Math.round(v))) return String(Math.round(v));
  const neg = v < 0, a = Math.abs(v);
  if (dec) return (neg ? '-' : '') + String(Number(a.toFixed(3)));
  const n = Math.round(a * den), g = gcd(n, den), p = n / g, q = den / g, w = Math.floor(p / q), r = p % q;
  if (improper) return `${neg ? '-' : ''}\\tfrac{${p}}{${q}}`;
  return `${neg ? '-' : ''}${w ? w : ''}\\tfrac{${r}}{${q}}`;
}
/** is v a tick of a line with ticks every 1/den? */
export const onTick = (v: number, den: number) => near(v * den, Math.round(v * den));
/** the ticks the model can draw: 4..44 ticks, at most 40 units */
export function lineFits(lo: number, hi: number, den: number): boolean {
  const n = Math.round((hi - lo) * den);
  return onTick(lo, den) && onTick(hi, den) && hi > lo && n >= 4 && n <= 44 && hi - lo <= 40;
}
/** a calm range that shows every value and 0, at least `minSpan` units wide (null when the line would be too dense) */
export function niceRange(vals: readonly number[], den = 1, minSpan = 8): { lo: number; hi: number } | null {
  const all = [...vals, 0];
  let lo = Math.floor(Math.min(...all)) - 1, hi = Math.ceil(Math.max(...all)) + 1;
  const maxSpan = Math.min(40, Math.floor(44 / den));
  const want = Math.min(maxSpan, minSpan);
  while (hi - lo < want) { if ((hi - lo) % 2) hi++; else lo--; }
  if (hi - lo > maxSpan) return null;
  return lineFits(lo, hi, den) ? { lo, hi } : null;
}

// ---------- the block ----------
export interface NLPoint { key: string; v: number; col: Col; ghost?: boolean }
export interface NLJump {
  key: string; from: number; by: number; col: Col; row: number;
  /** TeX written above the arrow (its value, e.g. "-3") */ label: string;
  /** the arrow turns around: drawn by key, ends pointing the other way in its own colour and label */
  flip?: { key: string; col: Col; label: string };
  dash?: boolean;
}
export interface NLParams { lo: number; hi: number; den?: number; dec?: boolean; points?: NLPoint[]; jumps?: NLJump[] }
export interface NLFocus { pulse?: Record<string, number> }
export interface NumberLineBlock {
  readonly kind: 'NumberLine';
  readonly box: Box;
  readonly lineY: number;
  x(v: number): number;
  readonly where: { point(key: string): Box; jump(key: string): Box; jumpLabel(key: string, flipped?: boolean): Box; tick(v: number): Box; line: Box };
  draw(c: Canvas, p: Progress<string>, f?: NLFocus): void;
}

const LABEL = 62, PLABEL = 70, JLABEL = 74, ROW0 = 116, ROWH = 150;

export function NumberLine(p: NLParams, fr: Frame, th: Theme): NumberLineBlock {
  const den = p.den ?? 1, dec = !!p.dec;
  check(lineFits(p.lo, p.hi, den), NAME, `line ${p.lo}..${p.hi} every 1/${den}: needs 4..44 ticks`);
  const pts = p.points ?? [], jumps = p.jumps ?? [];
  for (const q of pts) check(onTick(q.v, den) && q.v >= p.lo - 1e-9 && q.v <= p.hi + 1e-9, NAME, `point ${q.v} is not a tick of the line`);
  for (const j of jumps) {
    check(onTick(j.from, den) && onTick(j.from + j.by, den), NAME, `jump ${j.from} + ${j.by} is off the ticks`);
    for (const v of [j.from, j.from + j.by, ...(j.flip ? [j.from - j.by] : [])]) check(v >= p.lo - 1e-9 && v <= p.hi + 1e-9, NAME, `jump ${j.from} + ${j.by} leaves the line`);
  }
  const lineY = fr.y + fr.h - 118, x0 = fr.x + 70, x1 = fr.x + fr.w - 70;
  const unit = (x1 - x0) / (p.hi - p.lo);
  check(unit / den >= 36, NAME, `ticks ${Math.round(unit / den)} px apart are too dense`);
  const X = (v: number) => x0 + (v - p.lo) * unit;
  const rowY = (r: number) => lineY - ROW0 - r * ROWH;
  const maxRow = Math.max(0, ...jumps.map(j => j.row));
  check(rowY(maxRow) - JLABEL * 0.9 - 40 >= fr.y, NAME, `${maxRow + 1} rows of jumps do not fit`);

  // tick labels: every point's value, 0, then integers at a stride that leaves room
  const labelF = new Map<string, Formula>();
  const F = (s: string) => { let f = labelF.get(s); if (!f) { f = tex(s) as Formula; labelF.set(s, f); } return f; };
  const lblY = lineY + 66;
  interface Lbl { v: number; src: string; size: number; box: Box; col: Col | null; key: string | null }
  const fixed: Lbl[] = [];
  for (const q of pts) {
    if (fixed.some(l => near(l.v, q.v))) continue;
    const src = numTex(q.v, den, dec), size = PLABEL;
    fixed.push({ v: q.v, src, size, box: texBox(F(src), X(q.v), lblY, { size, align: 'center' }), col: q.col, key: q.key });
  }
  for (const L of fixed) for (const M of fixed) if (L !== M) check(L.box.x1 + 14 <= M.box.x0 || M.box.x1 + 14 <= L.box.x0, NAME, `point labels ${L.src} and ${M.src} overlap`);
  const ints: number[] = [];
  for (let v = Math.ceil(p.lo - 1e-9); v <= p.hi + 1e-9; v++) ints.push(v);
  const widest = Math.max(...ints.map(v => texWidth(F(numTex(v)), LABEL)));
  const stride = [1, 2, 5, 10].find(s => s * unit >= widest + 26) ?? 10;
  const free: Lbl[] = [];
  for (const v of ints) {
    if (v % stride !== 0 && v !== 0) continue;
    if (fixed.some(l => near(l.v, v))) continue;
    const src = numTex(v), b = texBox(F(src), X(v), lblY, { size: LABEL, align: 'center' });
    if (fixed.some(l => b.x1 + 16 > l.box.x0 && l.box.x1 + 16 > b.x0)) continue;
    if (free.some(l => b.x1 + 16 > l.box.x0 && l.box.x1 + 16 > b.x0)) continue;
    free.push({ v, src, size: LABEL, box: b, col: null, key: null });
  }

  // jump geometry (final state, and flipped state)
  const jBox = (j: NLJump, flipped = false): Box => { const by = flipped ? -j.by : j.by, a = X(j.from), b = X(j.from + by), y = rowY(j.row); return box(Math.min(a, b) - 4, y - 16, Math.max(a, b) + 4, y + 16); };
  const jLabelAt = (j: NLJump, flipped = false): { F: Formula; x: number; y: number; box: Box } => {
    const by = flipped ? -j.by : j.by, src = flipped && j.flip ? j.flip.label : j.label, f = F(src);
    const x = (X(j.from) + X(j.from + by)) / 2, y = rowY(j.row) - 52;
    return { F: f, x, y, box: texBox(f, x, y, { size: JLABEL, align: 'center' }) };
  };
  // labels in the same row must not collide (final states)
  for (const a of jumps) for (const b of jumps) {
    if (a === b || a.row !== b.row) continue;
    for (const fa of a.flip ? [false, true] : [false]) for (const fb of b.flip ? [false, true] : [false]) {
      const A = jLabelAt(a, fa).box, B = jLabelAt(b, fb).box;
      check(A.x1 + 10 <= B.x0 || B.x1 + 10 <= A.x0 || a.from === b.from, NAME, `jump labels ${a.label} and ${b.label} collide in row ${a.row}`);
    }
  }

  const colOf = (c: Col): Paint => c;
  function ring(c: Canvas, B: Box, col: Col, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, colOf(col), 'fill'); g.globalAlpha *= 0.18;
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 16); g.fill();
    g.globalAlpha /= 0.18;
    g.strokeStyle = paint(th, colOf(col), 'fill'); g.lineWidth = 4;
    g.shadowColor = paint(th, colOf(col), 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 16); g.stroke();
    g.restore();
  }
  const dropLine = (c: Canvas, x: number, y: number, col: Col, a: number) =>
    strokePts(c, [[x, y + 18], [x, lineY - 20]], { col: colOf(col), lw: 2.5, dash: [8, 9], alpha: 0.55 * a, cap: 'butt' });

  function draw(c: Canvas, P: Progress<string>, f: NLFocus = {}): void {
    const kL = E.smooth(clamp(P.k('line')));
    const pulse = f.pulse ?? {};
    if (kL > 0) withAlpha(c, kL, () => {
      // the track: a soft painted band, then a crisp line with arrow ends
      wash(c, rectPts(x0 - 46, lineY - 30, x1 - x0 + 92, 60, 26), '#2C3163', { seed: 31, ink: null, rough: 1.6, shade: 0.25 });
      const ends = 30;
      strokePts(c, [[x0 - ends, lineY], [x1 + ends, lineY]], { col: DUSK.cream, lw: 4 });
      for (const [x, s] of [[x1 + ends + 4, 1], [x0 - ends - 4, -1]] as const) {
        c.g.save(); c.g.fillStyle = DUSK.cream; c.g.beginPath();
        c.g.moveTo(x, lineY); c.g.lineTo(x - s * 22, lineY - 12); c.g.lineTo(x - s * 22, lineY + 12); c.g.closePath(); c.g.fill(); c.g.restore();
      }
      const n = Math.round((p.hi - p.lo) * den);
      for (let i = 0; i <= n; i++) {
        const v = p.lo + i / den, x = X(v), whole = onTick(v, 1);
        const h = whole ? (near(v, 0) ? 26 : 18) : 10;
        strokePts(c, [[x, lineY - h], [x, lineY + h]], { col: DUSK.cream, lw: whole ? 3.5 : 2.5, alpha: whole ? 1 : 0.75, cap: 'butt' });
      }
      for (const L of free) texDraw(c, F(L.src), X(L.v), lblY, { size: L.size, align: 'center', col: near(L.v, 0) ? 'ink' : 'dim' });
    });
    // jumps (under the points, so a landing dot sits on top)
    for (const j of jumps) {
      const k = clamp(P.k(j.key));
      if (k <= 0) continue;
      const kf = j.flip ? clamp(P.k(j.flip.key)) : 0;
      const s = Math.cos(Math.PI * kf);
      const flipped = kf > 0.5, col = flipped && j.flip ? j.flip.col : j.col;
      const a = X(j.from), y = rowY(j.row), len = j.by * unit * s;
      const b = a + len * (kf > 0 ? 1 : E.inOut(k));
      dropLine(c, a, y, col, k);
      if (k >= 1 && Math.abs(len) > 1) dropLine(c, a + len, y, col, kf > 0 ? Math.min(1, Math.abs(s) * 1.4) : 1);
      // the tail: a short upright bar, so the start reads
      strokePts(c, [[a, y - 18], [a, y + 18]], { col: colOf(col), lw: 6, alpha: Math.min(1, k * 3) });
      if (Math.abs(b - a) > 6) {
        if (j.dash) strokePts(c, [[a, y], [b - Math.sign(b - a) * 26, y]], { col: colOf(col), lw: 7, dash: [16, 12], cap: 'butt' });
        arrow(c, j.dash ? [[b - Math.sign(b - a) * 34, y], [b, y]] : [[a, y], [b, y]], j.dash ? 1 : 1, { col: colOf(col), lw: 7, head: 34 });
      }
      // its value, above the middle (switches at the turn)
      const lab = jLabelAt(j, flipped);
      const la = Math.min(1, k * 2) * (j.flip && kf > 0 ? Math.min(1, Math.abs(s) * 2) : 1);
      const lx = (a + a + len) / 2;
      ring(c, lab.box, col, pulse[j.key] ?? 0);
      texDraw(c, lab.F, kf > 0 ? lx : (a + b) / 2, lab.y, { size: JLABEL, align: 'center', col: colOf(col), alpha: la });
    }
    // points: a dot on the line, its tick label in the role colour
    for (const q of pts) {
      const k = clamp(P.k(q.key));
      if (k <= 0) continue;
      const x = X(q.v), r = 18 * E.back(Math.min(1, k * 1.2));
      if (q.ghost) inkLine(c, circlePts(x, lineY, 19, 40), { col: colOf(q.col), w: 4, closed: true, seed: 7, alpha: k * 0.9 });
      else {
        wash(c, circlePts(x, lineY, Math.max(1, r), 40), colOf(q.col), { seed: 13 + Math.round(x), ink: DUSK.ink, inkW: 2.5, rough: 0.8, shade: 0.2 });
      }
    }
    for (const L of fixed) {
      const q = pts.find(z => z.key === L.key)!;
      const k = clamp(P.k(q.key));
      if (pulse[q.key]) ring(c, L.box, L.col ?? 'ink', pulse[q.key]!);
      // before its point shows, an integer keeps its plain label; then the role colour takes over
      if (kL > 0 && k < 1 && onTick(L.v, 1) && Math.round(L.v) % stride === 0) texDraw(c, F(L.src), X(L.v), lblY, { size: LABEL, align: 'center', col: 'dim', alpha: kL * (1 - k) });
      if (k > 0) texDraw(c, F(L.src), X(L.v), lblY, { size: L.size, align: 'center', col: colOf(L.col ?? 'ink'), alpha: q.ghost ? 0.75 * k : k });
    }
  }

  const pointBox = (key: string): Box => { const q = pts.find(z => z.key === key); check(q, NAME, `no point ${key}`); const x = X(q.v); return box(x - 18, lineY - 18, x + 18, lineY + 18); };
  const jumpOf = (key: string): NLJump => { const j = jumps.find(z => z.key === key); check(j, NAME, `no jump ${key}`); return j; };
  const allBoxes = [box(x0 - 80, lineY - 30, x1 + 80, lblY + 40), ...jumps.flatMap(j => [jLabelAt(j).box, jBox(j)])];
  return {
    kind: 'NumberLine', lineY, x: X,
    box: unionBox(allBoxes),
    where: {
      point: pointBox,
      jump: key => jBox(jumpOf(key)),
      jumpLabel: (key, flipped = false) => jLabelAt(jumpOf(key), flipped).box,
      tick: v => texBox(F(numTex(v, den, dec)), X(v), lblY, { size: LABEL, align: 'center' }),
      line: box(x0, lineY - 30, x1, lineY + 30),
    },
    draw,
  };
}
