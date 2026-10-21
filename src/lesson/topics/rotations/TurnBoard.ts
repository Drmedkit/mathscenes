// TurnBoard: the model of the rotations lesson, drawn on the dusk canvas.
//   dot paper     a window of grid steps mapped into a Frame (y up), dots only, crisp
//   the sheet     a clear sheet (tracing paper) pinned at the center: it carries the figure round, so every point
//                 turns the same amount, the same way, and keeps its distance from the pin
//   figures       painted washes with one ink line; marked corners A B C with letters set outside the shape
//   roles         first (amber) = the figure before the move; second (teal) = the move: pin, turn arrow, mirror line,
//                 steps; link (lime) = the image / the answer; pick (lavender) = a given "after" picture or a
//                 candidate; wrong (red) = wrong
//   spinners      a disc with a four-section guide (or a clock face), a pointer arm and a curved turn arrow
//   panels        candidate pictures on the board, each on the same window (pin + faint start + candidate)
// Every painter is pure (inputs -> pixels). Layout throws (BlockError) when a step would be too small to read.
import { type Box, type Pt, box, clamp } from '../../../core/math';
import { type Canvas, arrow, dot, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Paint, paint } from '../../../core/theme';
import { check, type Frame } from '../../../blocks/block';
import { drawWords, SANS } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import {
  type Fig, type FlipLine, type GridPic, type Mark, type Motion, type Spinner, type TiltPic, type V, type Win,
  middle, motionAt, orient, rotA, sameSet, vadd, veq,
} from './turnMaths';

const NAME = 'TurnBoard';

// ---------- the view: grid -> px ----------
export interface View { win: Win; u: number; x0: number; y0: number; box: Box }
export function viewOf(win: Win, fr: Frame | Box, maxU = 92, minU = 18): View {
  const b = 'x0' in fr ? fr : box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const W = win.x1 - win.x0, H = win.y1 - win.y0;
  const u = Math.min(maxU, b.w / W, b.h / H);
  check(u >= minU, NAME, `grid steps of ${Math.round(u)} px are too small to read`);
  const x0 = b.cx - (W * u) / 2, y0 = b.cy + (H * u) / 2;
  return { win, u, x0, y0, box: box(x0, y0 - H * u, x0 + W * u, y0) };
}
export const px = (v: View, p: V): Pt => [v.x0 + (p[0] - v.win.x0) * v.u, v.y0 - (p[1] - v.win.y0) * v.u];
export const pxBox = (v: View, P: readonly V[], pad = 0): Box => {
  const Q = P.map(p => px(v, p)), xs = Q.map(q => q[0]), ys = Q.map(q => q[1]);
  return box(Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad);
};

// ---------- small painters ----------
const LABEL = 46;
function letter(c: Canvas, t: string, x: number, y: number, col: Paint, a = 1, size = LABEL): void {
  if (a <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(a);
  g.font = `700 ${size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 9; g.strokeStyle = 'rgba(16,18,42,0.92)'; g.lineJoin = 'round';
  g.strokeText(t, x, y);
  g.fillStyle = paint(c.th, col, 'text'); g.fillText(t, x, y);
  g.restore();
}
export function dotPaper(c: Canvas, v: View, a = 1): void {
  if (a <= 0) return;
  const r = Math.max(2.2, v.u * 0.055);
  const { g } = c;
  g.save(); g.globalAlpha *= a; g.fillStyle = '#6F74A6';
  for (let x = v.win.x0; x <= v.win.x1; x++) for (let y = v.win.y0; y <= v.win.y1; y++) {
    const [X, Y] = px(v, [x, y]);
    g.beginPath(); g.arc(X, Y, r, 0, Math.PI * 2); g.fill();
  }
  g.restore();
}
export interface ShapeOpts { alpha?: number; seed?: number; ghost?: boolean; outline?: Paint | null; lift?: number }
/** a painted figure (wash + one ink line), or a dashed ghost outline */
export function drawFig(c: Canvas, v: View, P: readonly V[], col: Paint, o: ShapeOpts = {}): void {
  const a = o.alpha ?? 1;
  if (a <= 0 || P.length < 2) return;
  const Q = P.map(p => px(v, p));
  if (o.ghost) { strokePts(c, Q, { col, lw: Math.max(2.5, v.u * 0.045), dash: [v.u * 0.18, v.u * 0.14], closed: true, alpha: a, cap: 'butt' }); return; }
  wash(c, Q, paint(c.th, col, 'fill'), { seed: o.seed ?? 3, rough: Math.min(1.4, v.u * 0.02), alpha: a, ink: null, lift: o.lift ?? 0 });
  strokePts(c, Q, { col: o.outline ?? DUSK.ink, lw: Math.max(2, v.u * 0.04), closed: true, alpha: a });
}
/** the marked corners: a dot and a letter set outside the figure (away from its middle) */
/** where a corner's letter goes: outside the figure, away from its middle */
export function markLabelPos(v: View, k: Mark, P: readonly V[], size = LABEL): Pt {
  const mp = px(v, middle(P)), [x, y] = px(v, k.p);
  let dx = x - mp[0], dy = y - mp[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  return [x + dx * (size * 0.72 + 6), y + dy * (size * 0.62 + 6)];
}
/** the corner dots and letters; a letter that would sit on one of `taken` (another figure's letters) moves to a free spot */
export function drawMarks(c: Canvas, v: View, marks: readonly Mark[], P: readonly V[], col: Paint, a = 1, size = LABEL, taken?: Pt[]): void {
  if (a <= 0 || !marks.length) return;
  for (const k of marks) {
    const [x, y] = px(v, k.p);
    dot(c, x, y, Math.max(5, v.u * 0.11), DUSK.ink, a);
    dot(c, x, y, Math.max(3.5, v.u * 0.08), col, a);
    if (size <= 0) continue;
    let at = markLabelPos(v, k, P, size);
    if (taken) {
      if (taken.some(q => Math.hypot(q[0] - at[0], q[1] - at[1]) < size * 1.1)) at = freeSpot(v, [x, y], size * 0.95, [...taken, ...P.map(q => px(v, q))]);
      taken.push(at);
    }
    letter(c, k.label, at[0], at[1], col, a, size);
  }
}
/** the free spot around `at` (8 directions at distance rad) farthest from the obstacles, inside the view */
export function freeSpot(v: View, at: Pt, rad: number, avoid: readonly Pt[], prefer = 0): Pt {
  let best: Pt = [at[0], at[1] - rad], score = -Infinity;
  for (let i = 0; i < 8; i++) {
    const t = -Math.PI / 2 + ((i + prefer) % 8) * (Math.PI / 4);
    const p: Pt = [at[0] + rad * Math.cos(t), at[1] + rad * Math.sin(t)];
    let s = Math.min(1e9, ...avoid.map(q => Math.hypot(q[0] - p[0], q[1] - p[1])));
    const b = v.box;
    if (p[0] < b.x0 - 30 || p[0] > b.x1 + 30 || p[1] < b.y0 - 30 || p[1] > b.y1 + 30) s -= 400;
    s -= i * 0.5;   // ties: the first direction tried wins
    if (s > score) { score = s; best = p; }
  }
  return best;
}
export function drawPin(c: Canvas, v: View, p: V, label: string | undefined, a = 1, glowK = 0, size = LABEL, at?: Pt): void {
  if (a <= 0) return;
  const [x, y] = px(v, p), r = Math.max(7, Math.min(15, v.u * 0.17));
  if (glowK > 0) dot(c, x, y, r * 2.6, 'second', 0.25 * glowK * a);
  dot(c, x, y, r + 3, DUSK.ink, a);
  dot(c, x, y, r, 'second', a);
  dot(c, x, y, r * 0.38, DUSK.cream, a);
  if (label && size > 0) { const [lx, ly] = at ?? [x - size * 0.62 - r, y + size * 0.62 + r * 0.4]; letter(c, label, lx, ly, 'second', a, size); }
}
/** the clear sheet: a rounded rectangle around `around` (grid points), turned by `ang` about the pin */
export function drawSheet(c: Canvas, v: View, around: readonly V[], pin: V, ang: number, a = 1, motion?: Motion, k = 0): void {
  if (a <= 0) return;
  const xs = around.map(p => p[0]), ys = around.map(p => p[1]);
  const x0 = Math.min(...xs) - 0.55, x1 = Math.max(...xs) + 0.55, y0 = Math.min(...ys) - 0.55, y1 = Math.max(...ys) + 0.55;
  const n = 7, P: V[] = [];
  const corner = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= n; i++) { const t = a0 + (i / n) * Math.PI / 2; P.push([cx + 0.3 * Math.cos(t), cy + 0.3 * Math.sin(t)]); } };
  corner(x1 - 0.3, y0 + 0.3, -Math.PI / 2); corner(x1 - 0.3, y1 - 0.3, 0); corner(x0 + 0.3, y1 - 0.3, Math.PI / 2); corner(x0 + 0.3, y0 + 0.3, Math.PI);
  const R = motion ? P.map(p => motionAt(motion, p, k)) : P.map(p => rotA(p, pin, ang));
  const Q = R.map(p => px(v, p));
  const { g } = c;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(239,230,247,0.10)'; g.beginPath(); Q.forEach(([X, Y], i) => (i ? g.lineTo(X, Y) : g.moveTo(X, Y))); g.closePath(); g.fill();
  g.restore();
  strokePts(c, Q, { col: 'rgba(239,230,247,0.42)', lw: 2.5, closed: true, alpha: a });
}
/** a curved turn arrow about the pin: from angle a0 (radians, math convention) through q quarter turns */
export function drawTurnArrow(c: Canvas, v: View, pin: V, r: number, a0: number, q: number, k = 1, col: Paint = 'second', a = 1): void {
  if (k <= 0 || a <= 0) return;
  const sweep = q * Math.PI / 2, n = Math.max(12, Math.round(Math.abs(q) * 18));
  const P: Pt[] = [];
  for (let i = 0; i <= n; i++) { const t = a0 + sweep * (i / n); P.push(px(v, [pin[0] + r * Math.cos(t), pin[1] + r * Math.sin(t)])); }
  arrow(c, P, E.inOut(clamp(k)), { col, lw: Math.max(4, v.u * 0.06), head: Math.max(18, v.u * 0.3), alpha: a });
}
/** the angle (math convention) at which an arrow about the pin starts: toward the figure, nudged off its corners */
export function arrowStart(pin: V, fig?: readonly V[]): number {
  if (!fig) return Math.PI / 2;
  const m = middle(fig);
  if (Math.abs(m[0] - pin[0]) < 1e-9 && Math.abs(m[1] - pin[1]) < 1e-9) return Math.PI / 2 + 0.3;
  return Math.atan2(m[1] - pin[1], m[0] - pin[0]);
}
/** steps from a point: horizontal first, then vertical, as two teal arrows with their counts */
export function drawSteps(c: Canvas, v: View, from: V, d: V, k = 1, a = 1, nums = true): void {
  if (k <= 0 || a <= 0) return;
  const mid: V = [from[0] + d[0], from[1]];
  const to: V = vadd(from, d);
  const kh = d[0] ? clamp(k * (d[1] ? 2 : 1)) : 0, kv = d[1] ? clamp(d[0] ? k * 2 - 1 : k) : 0;
  const lw = Math.max(4, v.u * 0.06), head = Math.max(16, v.u * 0.26);
  if (kh > 0) arrow(c, [px(v, from), px(v, mid)], kh, { col: 'second', lw, head, alpha: a });
  if (kv > 0) arrow(c, [px(v, mid), px(v, to)], kv, { col: 'second', lw, head, alpha: a });
  if (!nums) return;
  const sz = Math.max(44, Math.min(60, v.u * 0.7));
  if (d[0] && kh >= 1) { const [X, Y] = px(v, [from[0] + d[0] / 2, from[1]]); letter(c, String(Math.abs(d[0])), X, Y + (d[1] > 0 ? 1 : -1) * (sz * 0.62), 'second', a, sz); }
  if (d[1] && kv >= 1) { const [X, Y] = px(v, [to[0], from[1] + d[1] / 2]); letter(c, String(Math.abs(d[1])), X + (d[0] >= 0 ? 1 : -1) * (sz * 0.6), Y, 'second', a, sz); }
}
export function drawMirror(c: Canvas, v: View, L: FlipLine, label: string | undefined, a = 1): void {
  if (a <= 0) return;
  const w = v.win;
  let p0: V, p1: V;
  if (L.kind === 'v') { p0 = [L.x, w.y0 + 0.2]; p1 = [L.x, w.y1 - 0.2]; }
  else if (L.kind === 'h') { p0 = [w.x0 + 0.2, L.y]; p1 = [w.x1 - 0.2, L.y]; }
  else {
    const lo = L.s === 1 ? Math.max(w.x0 - L.p[0], w.y0 - L.p[1]) : Math.max(w.x0 - L.p[0], L.p[1] - w.y1);
    const hi = L.s === 1 ? Math.min(w.x1 - L.p[0], w.y1 - L.p[1]) : Math.min(w.x1 - L.p[0], L.p[1] - w.y0);
    p0 = [L.p[0] + lo + 0.2, L.p[1] + L.s * (lo + 0.2)]; p1 = [L.p[0] + hi - 0.2, L.p[1] + L.s * (hi - 0.2)];
  }
  const A = px(v, p0), B = px(v, p1);
  strokePts(c, [A, B], { col: 'second', lw: Math.max(3, v.u * 0.05), dash: [14, 10], alpha: a, cap: 'butt' });
  if (label) {
    const size = Math.max(40, Math.min(LABEL, v.u * 0.6));
    const top = A[1] < B[1] ? A : B;
    letter(c, label, top[0] + size * 0.62, top[1] + size * 0.45, 'second', a, size);
  }
}
/** a round arrow at the middle of A, B, C showing the way round A -> B -> C goes */
export function drawOrderArrow(c: Canvas, v: View, marks: readonly Mark[], col: Paint, k = 1, a = 1): void {
  if (marks.length < 3 || k <= 0) return;
  const [A, B, C] = marks;
  const o = orient(A!.p, B!.p, C!.p);
  const m: V = [(A!.p[0] + B!.p[0] + C!.p[0]) / 3, (A!.p[1] + B!.p[1] + C!.p[1]) / 3];
  const a0 = Math.atan2(A!.p[1] - m[1], A!.p[0] - m[0]);
  const r = 0.55, P: Pt[] = [];
  for (let i = 0; i <= 30; i++) { const t = a0 + o * (i / 30) * Math.PI * 1.55; P.push(px(v, [m[0] + r * Math.cos(t), m[1] + r * Math.sin(t)])); }
  arrow(c, P, k, { col, lw: Math.max(4, v.u * 0.06), head: Math.max(16, v.u * 0.26), alpha: a });
}
export type DotState = 'idle' | 'right' | 'wrong' | 'pick';
export function drawCandDot(c: Canvas, v: View, k: Mark, st: DotState = 'idle', a = 1, at?: Pt): void {
  if (a <= 0) return;
  const [x, y] = px(v, k.p), r = Math.max(12, v.u * 0.19);
  const col: Paint = st === 'right' ? 'link' : st === 'wrong' ? 'wrong' : st === 'pick' ? 'pick' : 'ink';
  if (st !== 'idle') dot(c, x, y, r * 1.9, col, 0.22 * a);
  const { g } = c;
  g.save(); g.globalAlpha *= a;
  g.lineWidth = 9; g.strokeStyle = 'rgba(16,18,42,0.9)'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 4.5; g.strokeStyle = paint(c.th, col, 'line'); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.restore();
  const [lx, ly] = at ?? [x, y - r - 40];
  letter(c, k.label, lx, ly, col, a, 60);
}
export function drawPoint(c: Canvas, v: View, k: Mark, col: Paint, a = 1, size = LABEL, at?: Pt): void {
  if (a <= 0) return;
  const [x, y] = px(v, k.p), r = Math.max(8, v.u * 0.13);
  dot(c, x, y, r + 3, DUSK.ink, a); dot(c, x, y, r, col, a);
  if (size > 0) { const [lx, ly] = at ?? [x + r + size * 0.42, y - r - size * 0.3]; letter(c, k.label, lx, ly, col, a, size); }
}
export function drawString(c: Canvas, v: View, a: V, b: V, al = 1): void {
  strokePts(c, [px(v, a), px(v, b)], { col: 'dim', lw: Math.max(2.5, v.u * 0.035), alpha: al * 0.85 });
}

// ---------- a whole grid picture ----------
export interface GridState {
  /** fade-in of the picture */ k?: number;
  /** 0..1 of the live motion (watch) */ watchK?: number;
  /** 0..1 of the worked solution */ solveK?: number;
  /** candidate dot states by letter */ dotSt?: Record<string, DotState>;
  /** draw the step path (when it is a 'solve' path: once the solution starts) */
  /** hide the corner letters (small panels) */ small?: boolean;
}
/** where the arrows sit: radius in grid steps scaled so the arrow clears the pin */
export function drawGridPic(c: Canvas, v: View, p: GridPic, st: GridState = {}): void {
  const k = st.k ?? 1, sk = st.solveK ?? 0, wk = st.watchK ?? 0;
  const lab = st.small ? 0 : LABEL;
  dotPaper(c, v, k);
  const pin = p.pin;
  // the clear sheet: still, or carried by the watched motion / the solution
  if (p.sheet && pin && p.start) {
    const around = [...p.start.pts, pin, ...(p.segs ?? [])];
    if (p.watch) drawSheet(c, v, around, pin, 0, k, p.watch, wk);
    else drawSheet(c, v, around, pin, 0, k * (sk > 0 ? 0.5 : 1));
    if (sk > 0 && p.solve) drawSheet(c, v, around, pin, 0, k * clamp(sk * 4), p.solve.motion, E.smooth(sk));
  }
  for (const L of p.lines ?? []) drawMirror(c, v, L.line, st.small ? undefined : L.label, k);
  if (p.target) drawFig(c, v, p.target, 'link', { ghost: true, alpha: k });
  // the start figure (moving with the watch)
  if (p.start) {
    if (p.watch) {
      drawFig(c, v, p.start.pts, 'first', { ghost: true, alpha: 0.45 * k });
      drawFig(c, v, p.start.pts.map(q => motionAt(p.watch!, q, wk)), 'first', { alpha: k, seed: 4 });
    } else drawFig(c, v, p.start.pts, 'first', { alpha: k * (sk > 0 ? 0.55 : 1), seed: 4 });
  }
  const taken: Pt[] = p.start && lab ? p.start.marks.map(m => markLabelPos(v, m, p.start!.pts, lab)) : [];
  if (p.pin && lab) taken.push(px(v, p.pin));
  if (p.after) {
    drawFig(c, v, p.after.pts, 'pick', { alpha: k, seed: 6 });
    // a corner sitting on the pin keeps only the amber letter (two letters on one dot read as noise)
    drawMarks(c, v, p.after.marks.map(m => (p.pin && veq(m.p, p.pin) ? { ...m, label: '' } : m)), p.after.pts, 'pick', k, lab, taken);
  }
  for (const s of p.segs ?? []) if (pin) drawString(c, v, pin, s, k * (sk > 0 ? 0.4 : 1));
  if (p.steps && (p.steps.when !== 'solve' || sk > 0)) drawSteps(c, v, p.steps.from ?? pin ?? [0, 0], p.steps.d, p.steps.when === 'solve' ? clamp(sk * 1.4) : k, k, !st.small);
  if (p.start && !p.watch) drawMarks(c, v, p.start.marks, p.start.pts, 'first', k * (sk > 0 ? 0.6 : 1), lab);
  if (p.arrows && pin) {
    for (const ar of p.arrows) drawTurnArrow(c, v, pin, ar.r, arrowStart(pin, p.start?.pts), ar.q, k, 'second', k);
  }
  // the worked solution: the figure (or the point) travels to its image
  if (sk > 0 && p.solve) {
    const s = p.solve, kk = E.smooth(clamp(sk));
    for (const sol of [{ motion: s.motion, to: s.to }, ...(s.also ? [s.also] : [])]) {
      if (p.start && sol.to && sol.motion.kind !== 'none') {
        const P = p.start.pts.map(q => motionAt(sol.motion, q, kk));
        drawFig(c, v, P, 'link', { alpha: clamp(sk * 3), seed: 8 });
        // the image's letters, unless the lavender picture already shows them in the same place
        const shown = p.after && sameSet(p.after.pts, sol.to.pts);
        if (kk >= 1 && !shown) drawMarks(c, v, sol.to.marks.map(m => (p.pin && veq(m.p, p.pin) ? { ...m, label: '' } : m)), sol.to.pts, 'link', 1, lab, [...taken]);
        else if (kk >= 1) drawMarks(c, v, sol.to.marks, sol.to.pts, 'link', 1, 0);
      }
    }
    if (s.point && p.point) {
      const q = motionAt(s.motion, p.point.p, kk);
      if (pin && s.motion.kind === 'turn') drawString(c, v, pin, q, 1);
      drawPoint(c, v, { p: q, label: '' }, 'link', 1, 0);
    }
    if (s.point && pin && s.motion.kind === 'turn' && !p.point && p.segs?.length) {
      const q = motionAt(s.motion, p.segs[0]!, kk);
      drawString(c, v, pin, q, 1); drawPoint(c, v, { p: q, label: '' }, 'link', 1, 0);
    }
    if (p.orderArrows && p.start && p.after) {
      drawOrderArrow(c, v, p.start.marks, 'first', clamp(sk * 2));
      drawOrderArrow(c, v, p.after.marks, 'pick', clamp(sk * 2 - 0.6));
    }
  }
  // labeled points (on the sheet: they ride with the watched motion, leaving a trail)
  // labels that must not collide: the corner letters are fixed; the pin and the candidate dots find free spots
  const avoid: Pt[] = [];
  for (const f of [p.start, p.after]) if (f) avoid.push(...f.pts.map(q => px(v, q)));
  avoid.push(...taken);
  for (const d of p.dots ?? []) avoid.push(px(v, d.p));
  if (p.point) avoid.push(px(v, p.point.p));
  if (pin) avoid.push(px(v, pin));
  if (!p.watch) for (const m of p.points ?? []) avoid.push(px(v, m.p));
  let pinAt: Pt | undefined;
  if (pin && !p.pinHidden && p.pinLabel && lab) { pinAt = freeSpot(v, px(v, pin), lab * 0.95, avoid.filter(q => Math.hypot(q[0] - px(v, pin)[0], q[1] - px(v, pin)[1]) > 2), 5); avoid.push(pinAt); }
  if (p.point && lab) avoid.push([px(v, p.point.p)[0] + 40, px(v, p.point.p)[1] - 36]);
  for (const m of p.points ?? []) {
    if (p.watch) {
      const q = motionAt(p.watch, m.p, wk);
      if (wk > 0.02) {
        const T: Pt[] = []; for (let i = 0; i <= 24; i++) T.push(px(v, motionAt(p.watch, m.p, (wk * i) / 24)));
        strokePts(c, T, { col: 'pick', lw: 3, dash: [8, 8], alpha: 0.8 * k });
      }
      drawPoint(c, v, { p: q, label: m.label }, 'pick', k, lab);
    } else {
      const at = px(v, m.p);
      const spot = lab ? freeSpot(v, at, Math.max(8, v.u * 0.13) + lab * 0.85, avoid.filter(q => Math.hypot(q[0] - at[0], q[1] - at[1]) > 2), 1) : undefined;
      if (spot) avoid.push(spot);
      drawPoint(c, v, m, 'second', k, lab, spot);
    }
  }
  if (pin && !p.pinHidden) drawPin(c, v, pin, p.pinLabel, k, 0, lab, pinAt);
  if (p.point) drawPoint(c, v, p.point, 'first', k, lab);
  for (const d of p.dots ?? []) {
    const at = px(v, d.p);
    const spot = freeSpot(v, at, Math.max(12, v.u * 0.19) + 36, avoid.filter(q => Math.hypot(q[0] - at[0], q[1] - at[1]) > 2));
    avoid.push(spot);
    const ds = st.dotSt?.[d.label] ?? 'idle';
    // during the worked solution the dots nobody picked step back
    const back = sk > 0 && ds === 'idle';
    drawCandDot(c, v, back ? { ...d, label: '' } : d, ds, k * (back ? 0.3 : 1), spot);
  }
}

// ---------- candidate panels on the board ----------
export function panelBoxes(n: number, area: Box): { panel: Box; tag: Pt }[] {
  const out: { panel: Box; tag: Pt }[] = [];
  if (n <= 3) {
    const rh = area.h / n, side = Math.min(rh - 26, area.w - 110);
    for (let i = 0; i < n; i++) {
      const cy = area.y0 + rh * i + rh / 2, x0 = area.x0 + 90 + (area.w - 90 - side) / 2;
      out.push({ panel: box(x0, cy - side / 2, x0 + side, cy + side / 2), tag: [area.x0 + 30, cy] });
    }
    return out;
  }
  const cols = 2, rows = Math.ceil(n / 2);
  const cw = area.w / cols, rh = area.h / rows;
  const side = Math.min(cw - 34, rh - 66);
  for (let i = 0; i < n; i++) {
    const cx = area.x0 + cw * (i % cols) + cw / 2, top = area.y0 + rh * Math.floor(i / cols);
    const panel = box(cx - side / 2, top + 58, cx + side / 2, top + 58 + side);
    out.push({ panel, tag: [panel.x0 + 4, top + 26] });
  }
  return out;
}
export type PanelState = 'idle' | 'right' | 'wrong';
export function drawPanels(c: Canvas, p: GridPic, area: Box, st: Record<string, PanelState> = {}, k = 1): void {
  if (!p.cands || k <= 0) return;
  const boxes = panelBoxes(p.cands.length, area);
  p.cands.forEach((cd, i) => {
    const { panel, tag } = boxes[i]!;
    const s = st[cd.label] ?? 'idle';
    const v = viewOf(p.win, box(panel.x0 + 10, panel.y0 + 10, panel.x1 - 10, panel.y1 - 10), 60, 12);
    const { g } = c;
    g.save(); g.globalAlpha *= k;
    g.fillStyle = '#171A3A'; g.beginPath(); g.roundRect(panel.x0, panel.y0, panel.w, panel.h, 14); g.fill();
    g.lineWidth = s === 'idle' ? 2 : 5; g.strokeStyle = s === 'right' ? paint(c.th, 'link', 'fill') : s === 'wrong' ? paint(c.th, 'wrong', 'fill') : '#3A3F6B';
    g.beginPath(); g.roundRect(panel.x0, panel.y0, panel.w, panel.h, 14); g.stroke();
    g.restore();
    dotPaper(c, v, 0.7 * k);
    if (p.start) drawFig(c, v, p.start.pts, 'first', { ghost: true, alpha: 0.75 * k });
    drawFig(c, v, cd.fig.pts, s === 'right' ? 'link' : 'pick', { alpha: k, seed: 11 + i });
    drawMarks(c, v, cd.fig.marks.slice(0, 1), cd.fig.pts, s === 'right' ? 'link' : 'pick', k, 0);
    if (p.pin) drawPin(c, v, p.pin, undefined, k, 0, 0);
    drawWords(c, cd.label, tag[0], tag[1], s === 'right' ? 'link' : s === 'wrong' ? 'wrong' : 'ink', k, { size: 60, weight: 700 });
  });
}

// ---------- spinners ----------
const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;   // degrees clockwise from up -> canvas radians
export interface SpinState { /** the pointer's extra turn now, degrees + counterclockwise */ turnNow?: number; /** draw the arrow (0..1) */ arrowK?: number; /** trail of the live turn */ trail?: number; k?: number; ghostStart?: boolean }
export function drawSpinner(c: Canvas, cx: number, cy: number, R: number, s: Spinner, st: SpinState = {}): void {
  const k = st.k ?? 1;
  if (k <= 0) return;
  const look = s.look ?? 'spinner';
  // the disc
  const disc: Pt[] = []; for (let i = 0; i < 72; i++) { const t = (i / 72) * Math.PI * 2; disc.push([cx + R * Math.cos(t), cy + R * Math.sin(t)]); }
  wash(c, disc, look === 'clock' ? '#E6DCCB' : '#2C3166', { seed: 21, rough: 1, alpha: k, ink: null, shade: 0.12, lift: look === 'clock' ? 0 : 0.05 });
  inkLine(c, disc, { col: look === 'clock' ? '#8C7B64' : '#4B5190', w: 4, closed: true, seed: 22, rough: 0.6, alpha: k });
  const faceInk = look === 'clock' ? '#5B4B3A' : '#8E93C7';
  if (look === 'clock') {
    for (let i = 0; i < 12; i++) {
      const t = toRad(i * 30), r0 = R * (i % 3 === 0 ? 0.8 : 0.87);
      strokePts(c, [[cx + r0 * Math.cos(t), cy + r0 * Math.sin(t)], [cx + R * 0.94 * Math.cos(t), cy + R * 0.94 * Math.sin(t)]], { col: faceInk as Paint, lw: i % 3 === 0 ? 6 : 3.5, alpha: k });
    }
  }
  for (const cut of s.cuts ?? []) {
    const t = toRad(cut);
    strokePts(c, [[cx, cy], [cx + R * 0.97 * Math.cos(t), cy + R * 0.97 * Math.sin(t)]], { col: faceInk as Paint, lw: 3, dash: [12, 9], alpha: 0.9 * k, cap: 'butt' });
  }
  const armL = R * 0.86 * (s.arm ?? 1);
  const turnNow = st.turnNow ?? 0;
  // the turn arrow: just outside the pointer's tip
  const turn = s.turn ?? 0;
  const ar = armL + Math.max(26, R * 0.12);
  if (turn && (st.arrowK ?? 1) > 0) {
    const P: Pt[] = [], n = Math.max(10, Math.round(Math.abs(turn) / 6));
    for (let i = 0; i <= n; i++) { const t = toRad(s.deg - turn * (i / n)); P.push([cx + ar * Math.cos(t), cy + ar * Math.sin(t)]); }
    arrow(c, P, E.inOut(clamp(st.arrowK ?? 1)), { col: 'second', lw: 6, head: 26, alpha: k });
  }
  // the live trail
  if (st.trail && st.trail > 0 && turnNow) {
    const P: Pt[] = [], n = Math.max(6, Math.round(Math.abs(turnNow) / 5)), tr = armL * 0.72;
    for (let i = 0; i <= n; i++) { const t = toRad(s.deg - turnNow * (i / n)); P.push([cx + tr * Math.cos(t), cy + tr * Math.sin(t)]); }
    strokePts(c, P, { col: 'pick', lw: 5, alpha: st.trail * k });
  }
  if (st.ghostStart && turnNow) {
    const t0 = toRad(s.deg);
    strokePts(c, [[cx, cy], [cx + armL * Math.cos(t0), cy + armL * Math.sin(t0)]], { col: 'first', lw: 6, dash: [10, 10], alpha: 0.5 * k });
  }
  // the pointer arm
  const t = toRad(s.deg - turnNow);
  const tip: Pt = [cx + armL * Math.cos(t), cy + armL * Math.sin(t)];
  const w = Math.max(9, R * 0.045);
  const nx = -Math.sin(t), ny = Math.cos(t);
  const back: Pt = [cx - armL * 0.12 * Math.cos(t), cy - armL * 0.12 * Math.sin(t)];
  const neck: Pt = [cx + (armL - w * 3.2) * Math.cos(t), cy + (armL - w * 3.2) * Math.sin(t)];
  const body: Pt[] = [[back[0] + nx * w, back[1] + ny * w], [neck[0] + nx * w, neck[1] + ny * w], [neck[0] + nx * w * 2.4, neck[1] + ny * w * 2.4], tip,
    [neck[0] - nx * w * 2.4, neck[1] - ny * w * 2.4], [neck[0] - nx * w, neck[1] - ny * w], [back[0] - nx * w, back[1] - ny * w]];
  wash(c, body, paint(c.th, 'first', 'fill'), { seed: 31, rough: 0.8, alpha: k, ink: DUSK.ink, inkW: 3 });
  // the pin
  dot(c, cx, cy, 15, DUSK.ink, k); dot(c, cx, cy, 12, 'second', k); dot(c, cx, cy, 4.5, DUSK.cream, k);
  if (s.label) drawWords(c, s.label, cx, cy + R + 52, 'ink', k, { size: 46, weight: 700, align: 'center' });
}
/** the clockwise reference: a small clock face, its hands and a curved arrow the way they go */
export function drawClockRef(c: Canvas, cx: number, cy: number, r: number, k = 1): void {
  if (k <= 0) return;
  drawSpinner(c, cx, cy, r, { deg: 90, look: 'clock', cuts: null, arm: 0.8 }, { k });
  const P: Pt[] = [];
  for (let i = 0; i <= 30; i++) { const t = toRad(-60 + 120 * (i / 30)); P.push([cx + (r + 34) * Math.cos(t), cy + (r + 34) * Math.sin(t)]); }
  arrow(c, P, 1, { col: 'second', lw: 6, head: 24, alpha: k });
  drawWords(c, 'clockwise', cx, cy + r + 66, 'second', k, { size: 46, weight: 650, align: 'center' });
}

// ---------- a tilted card ----------
export function drawTilt(c: Canvas, p: TiltPic, area: Box, k = 1): void {
  if (k <= 0) return;
  const s = Math.min(area.w / 5.2, area.h / 2.6), h = p.shape === 'square' ? s : s * 0.6;
  const base = area.y0 + area.h * 0.72;
  const card = (cx: number, cy: number, deg: number): Pt[] => {
    const t = (deg * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
    return ([[-s / 2, -h / 2], [s / 2, -h / 2], [s / 2, h / 2], [-s / 2, h / 2]] as Pt[]).map(([x, y]) => [cx + x * cs - y * sn, cy + x * sn + y * cs] as Pt);
  };
  const flat = card(area.x0 + area.w * 0.27, base - h / 2, 0);
  const lowest = Math.max(...card(0, 0, p.deg).map(q => q[1]));
  const tilted = card(area.x0 + area.w * 0.72, base - lowest, p.deg);
  strokePts(c, [[area.x0 + 20, base + 2], [area.x1 - 20, base + 2]], { col: 'faint', lw: 4, alpha: k });
  wash(c, flat, paint(c.th, 'first', 'fill'), { seed: 41, rough: 1, alpha: k, inkW: 3 });
  wash(c, tilted, paint(c.th, 'first', 'fill'), { seed: 41, rough: 1, alpha: k, inkW: 3 });
  // the same corner marked on both, so it reads as the same card
  dot(c, flat[0]![0], flat[0]![1], 10, 'second', k);
  dot(c, tilted[0]![0], tilted[0]![1], 10, 'second', k);
  drawWords(c, 'before', flat[0]![0] + s / 2, base + 56, 'dim', k, { size: 44, align: 'center' });
  drawWords(c, 'after', area.x0 + area.w * 0.72, base + 56, 'dim', k, { size: 44, align: 'center' });
}
