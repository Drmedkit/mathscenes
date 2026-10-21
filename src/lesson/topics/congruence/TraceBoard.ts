// TraceBoard: the model of the congruence lesson. A coordinate plane (or plain grid paper) on the dusk wall, the
// figures as washes with one crisp outline, and a sheet of TRACING PAPER that carries a copy of a figure through a
// sequence of rigid motions (slide, turn, flip) until it lies exactly on the other figure, corner on corner.
//   plane     crisp grid lines; with axes: the x- and y-axis brighter, numbers in the margin (never on a line)
//   figures   first (amber) = the figure we start from; pick (lavender) = the figure we try to reach / candidates;
//             link (lime) = the tracing that landed / the answer; wrong (red) = a mismatch; ghost = dashed outline
//   moves     second (teal): the mirror line of a flip, the pin and arc of a turn, the arrow of a slide
//   labels    corner letters (46 px, dark halo) placed around their corner clear of every edge, line and letter;
//             side lengths (44 px) outside the side
//   steps     the page drives named keys: the plane, each figure, the tracing (s = 0..n through the sequence), the
//             move guides, order arrows, corner rings (the check), side glows
// Layout throws (BlockError) when a grid square would be too small to read. Pure painters: inputs -> pixels.
import { type Box, type Pt, box, clamp, padBox } from '../../../core/math';
import { type Canvas, arrow, dot, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Paint, paint } from '../../../core/theme';
import { check } from '../../../blocks/block';
import { SANS } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type CongPic, type FlipLine, type Move, type PFig, type Role, type V, type Win, mv, mvAt, orient, seqAt, veq } from './congMaths';

const NAME = 'TraceBoard';
export const LABEL = 46, NUM = 44;

// ---------- the view: plane units -> px ----------
export interface PView { win: Win; u: number; x0: number; y0: number; box: Box; axes: boolean }
/** fit the window into `area`; with axes, room is kept for the numbers (left, bottom) and the axis letters */
export function planeView(win: Win, area: Box, axes: boolean, maxU = 92, minU = 24): PView {
  const ml = axes ? 78 : 10, mb = axes ? 64 : 10, mt = axes ? 40 : 10, mr = axes ? 44 : 10;
  const W = win.x1 - win.x0, H = win.y1 - win.y0;
  const u = Math.min(maxU, (area.w - ml - mr) / W, (area.h - mt - mb) / H);
  check(u >= minU, NAME, `grid squares of ${Math.round(u)} px are too small to read`);
  const cx = area.x0 + ml + (area.w - ml - mr) / 2, cy = area.y0 + mt + (area.h - mt - mb) / 2;
  const x0 = cx - (W * u) / 2, y0 = cy + (H * u) / 2;
  return { win, u, x0, y0, box: box(x0, y0 - H * u, x0 + W * u, y0), axes };
}
export const px = (v: PView, p: V): Pt => [v.x0 + (p[0] - v.win.x0) * v.u, v.y0 - (p[1] - v.win.y0) * v.u];
export const pxs = (v: PView, P: readonly V[]): Pt[] => P.map(p => px(v, p));
/** a box around a plane point (for leaders) */
export const vertexBox = (v: PView, p: V, r = 18): Box => { const [x, y] = px(v, p); return box(x - r, y - r, x + r, y + r); };
export const roleCol = (r: Role): Paint => (r === 'ghost' ? 'first' : r);

// ---------- text ----------
export function letter(c: Canvas, t: string, x: number, y: number, col: Paint, a = 1, size = LABEL, weight = 700): void {
  if (a <= 0 || !t) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(a);
  g.font = `${weight} ${size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 9; g.strokeStyle = 'rgba(16,18,42,0.92)'; g.lineJoin = 'round';
  g.strokeText(t, x, y);
  g.fillStyle = paint(c.th, col, 'text'); g.fillText(t, x, y);
  g.restore();
}
let meas: CanvasRenderingContext2D | null = null;
export function textW(t: string, size: number, weight = 700): number {
  meas ??= typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
  if (!meas) return t.length * size * 0.56;
  meas.font = `${weight} ${size}px ${SANS}`;
  return meas.measureText(t).width;
}

// ---------- the plane ----------
export function drawPlane(c: Canvas, v: PView, k = 1): void {
  if (k <= 0) return;
  const { g } = c, b = v.box;
  const pb = padBox(b, Math.min(30, v.u * 0.4));
  wash(c, [[pb.x0, pb.y0], [pb.x1, pb.y0], [pb.x1, pb.y1], [pb.x0, pb.y1]], '#1B1F45', { seed: 12, rough: 1.2, ink: null, shade: 0.08, alpha: k });
  g.save(); g.globalAlpha *= k;
  g.lineWidth = 1.6; g.strokeStyle = '#323867';
  g.beginPath();
  for (let x = v.win.x0; x <= v.win.x1; x++) { const X = px(v, [x, 0])[0]; g.moveTo(X, b.y0); g.lineTo(X, b.y1); }
  for (let y = v.win.y0; y <= v.win.y1; y++) { const Y = px(v, [0, y])[1]; g.moveTo(b.x0, Y); g.lineTo(b.x1, Y); }
  g.stroke();
  g.restore();
  if (!v.axes) return;
  const [OX, OY] = px(v, [0, 0]);
  strokePts(c, [[b.x0, OY], [b.x1, OY]], { col: '#8A8EB8', lw: 3, alpha: k });
  strokePts(c, [[OX, b.y0], [OX, b.y1]], { col: '#8A8EB8', lw: 3, alpha: k });
  // numbers in the margin: below the plane for x, left of it for y (every unit when the squares are big)
  const every = v.u >= 84 ? 1 : 2;
  for (let x = Math.ceil(v.win.x0 / every) * every; x <= v.win.x1; x += every) drawNum(c, String(x).replace('-', '−'), px(v, [x, 0])[0], b.y1 + 36, 'center', k);
  for (let y = Math.ceil(v.win.y0 / every) * every; y <= v.win.y1; y += every) drawNum(c, String(y).replace('-', '−'), b.x0 - 16, px(v, [0, y])[1], 'right', k);
  letter(c, 'x', b.x1 + 24, OY, 'dim', k, NUM, 600);
  letter(c, 'y', OX, b.y0 - 22, 'dim', k, NUM, 600);
}
function drawNum(c: Canvas, t: string, x: number, y: number, align: CanvasTextAlign, k: number): void {
  const { g } = c;
  g.save(); g.globalAlpha *= k;
  g.font = `600 ${NUM}px ${SANS}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = paint(c.th, 'faint', 'text');
  g.fillText(t, x, y);
  g.restore();
}

// ---------- figures ----------
export interface ShapeOpts { alpha?: number; seed?: number; dashed?: boolean; lift?: number }
export function drawShape(c: Canvas, v: PView, P: readonly V[], col: Paint, o: ShapeOpts = {}): void {
  const a = o.alpha ?? 1;
  if (a <= 0 || P.length < 2) return;
  const Q = pxs(v, P);
  if (o.dashed) { strokePts(c, Q, { col, lw: Math.max(3, v.u * 0.05), dash: [v.u * 0.2, v.u * 0.14], closed: true, alpha: a, cap: 'butt' }); return; }
  wash(c, Q, paint(c.th, col, 'fill'), { seed: o.seed ?? 3, rough: Math.min(1.3, v.u * 0.018), alpha: a * 0.92, ink: null, lift: o.lift ?? 0 });
  strokePts(c, Q, { col: paint(c.th, col, 'line'), lw: Math.max(3, v.u * 0.045), closed: true, alpha: a });
}
export function drawCorners(c: Canvas, v: PView, P: readonly V[], col: Paint, a = 1): void {
  if (a <= 0) return;
  for (const p of P) { const [x, y] = px(v, p); dot(c, x, y, Math.max(6, v.u * 0.1), DUSK.ink, a); dot(c, x, y, Math.max(4.5, v.u * 0.075), col, a); }
}

// ---------- label placement: clear of edges, lines, dots and other labels ----------
export interface Clear { segs: [Pt, Pt][]; dots: Pt[]; boxes: Box[] }
export const newClear = (): Clear => ({ segs: [], dots: [], boxes: [] });
export function addPoly(cl: Clear, Q: readonly Pt[], closed = true): void {
  for (let i = 0; i < Q.length - (closed ? 0 : 1); i++) cl.segs.push([Q[i]!, Q[(i + 1) % Q.length]!]);
  cl.dots.push(...Q);
}
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  const t = l ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
/** clearance of a label box: how far it is from the nearest edge / dot / label (negative = overlapping) */
function clearance(b: Box, cl: Clear, inside: Box): number {
  let s = 1e9;
  const pts: Pt[] = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1], [b.cx, b.cy], [b.cx, b.y0], [b.cx, b.y1], [b.x0, b.cy], [b.x1, b.cy]];
  for (const [a, e] of cl.segs) {
    // a segment through the box counts as 0
    if (segHitsBox(a, e, b)) return -1;
    for (const p of pts) s = Math.min(s, segDist(p, a, e));
  }
  for (const d of cl.dots) { const dx = Math.max(b.x0 - d[0], 0, d[0] - b.x1), dy = Math.max(b.y0 - d[1], 0, d[1] - b.y1); s = Math.min(s, Math.hypot(dx, dy) - 8); }
  for (const o of cl.boxes) { const dx = Math.max(o.x0 - b.x1, b.x0 - o.x1), dy = Math.max(o.y0 - b.y1, b.y0 - o.y1); s = Math.min(s, Math.max(dx, dy)); }
  if (b.x0 < inside.x0 || b.x1 > inside.x1 || b.y0 < inside.y0 || b.y1 > inside.y1) s -= 200;
  return s;
}
function segHitsBox(a: Pt, e: Pt, b: Box): boolean {
  // Liang-Barsky clip
  let t0 = 0, t1 = 1;
  const dx = e[0] - a[0], dy = e[1] - a[1];
  const p = [-dx, dx, -dy, dy], q = [a[0] - b.x0, b.x1 - a[0], a[1] - b.y0, b.y1 - a[1]];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i]! < 0) return false; continue; }
    const r = q[i]! / p[i]!;
    if (p[i]! < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}
/** the best spot for a label of w x h around `at`, preferring the direction `away` points to */
export function placeAround(at: Pt, away: Pt, w: number, h: number, cl: Clear, inside: Box, r0 = 30): { at: Pt; box: Box; clear: number } {
  let best = { at: at, box: box(at[0] - w / 2, at[1] - h / 2, at[0] + w / 2, at[1] + h / 2), clear: -Infinity };
  const a0 = Math.atan2(away[1], away[0]);
  for (const rad of [r0, r0 + 14, r0 + 30]) for (let i = 0; i < 16; i++) {
    const t = a0 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8);
    const rr = rad + Math.abs(Math.cos(t)) * w * 0.32 + Math.abs(Math.sin(t)) * h * 0.18;
    const p: Pt = [at[0] + rr * Math.cos(t), at[1] + rr * Math.sin(t)];
    const b = box(p[0] - w / 2, p[1] - h / 2, p[0] + w / 2, p[1] + h / 2);
    const s = Math.min(clearance(b, cl, inside), 24) - i * 0.4 - (rad - r0) * 0.1;
    if (s > best.clear) best = { at: p, box: b, clear: s };
  }
  return best;
}
const mid = (Q: readonly Pt[]): Pt => [Q.reduce((s, q) => s + q[0], 0) / Q.length, Q.reduce((s, q) => s + q[1], 0) / Q.length];
/** corner letters of a figure, placed around their corners away from the middle; returns the boxes used */
export function drawLetters(c: Canvas, v: PView, P: readonly V[], labels: readonly string[], col: Paint, a: number, cl: Clear, size = LABEL): void {
  if (a <= 0) return;
  const Q = pxs(v, P), m = mid(Q);
  labels.forEach((t, i) => {
    if (!t) return;
    const q = Q[i]!;
    const w = textW(t, size) + 8, h = size * 0.9;
    const s = placeAround(q, [q[0] - m[0], q[1] - m[1]], w, h, cl, padBox(v.box, 40), Math.max(16, v.u * 0.16) + size * 0.3);
    cl.boxes.push(s.box);
    letter(c, t, s.at[0], s.at[1], col, a, size);
  });
}
/** side lengths, each outside its side */
export function drawLens(c: Canvas, v: PView, P: readonly V[], lens: readonly (string | null)[], col: Paint, a: number, cl: Clear, size = NUM): void {
  if (a <= 0) return;
  const Q = pxs(v, P), m = mid(Q);
  const o = orient(P);
  lens.forEach((t, i) => {
    if (!t) return;
    const p = Q[i]!, q = Q[(i + 1) % Q.length]!;
    const sm: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    // the outward normal of the side (screen y is down; o > 0 means counterclockwise in plane coordinates)
    let nx = (q[1] - p[1]) * -o, ny = -(q[0] - p[0]) * -o;
    const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if ((sm[0] - m[0]) * nx + (sm[1] - m[1]) * ny < 0) { nx = -nx; ny = -ny; }
    const w = textW(t, size, 650) + 8, h = size * 0.88;
    const s = placeAround(sm, [nx, ny], w, h, cl, padBox(v.box, 40), 18 + size * 0.2);
    cl.boxes.push(s.box);
    letter(c, t, s.at[0], s.at[1], col, a, size, 650);
  });
}
/** a round arrow inside the figure that follows A -> B -> C (its way round) */
export function drawOrder(c: Canvas, v: PView, P: readonly V[], col: Paint, k = 1, a = 1): void {
  if (k <= 0 || a <= 0 || P.length < 3) return;
  const o = orient(P);
  const m: V = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
  // the radius: a little less than the distance from the middle to the nearest side
  let r = 1e9;
  for (let i = 0; i < P.length; i++) {
    const A = px(v, P[i]!), B = px(v, P[(i + 1) % P.length]!);
    r = Math.min(r, segDist(px(v, m), A, B));
  }
  r = clamp(r * 0.62, 18, v.u * 0.9);
  const a0 = Math.atan2(P[0]![1] - m[1], P[0]![0] - m[0]);
  const Q: Pt[] = [];
  const [mx, my] = px(v, m);
  for (let i = 0; i <= 30; i++) { const t = a0 + o * (i / 30) * Math.PI * 1.5; Q.push([mx + r * Math.cos(t), my - r * Math.sin(t)]); }
  arrow(c, Q, E.inOut(clamp(k)), { col, lw: Math.max(4, v.u * 0.06), head: Math.max(15, v.u * 0.22), alpha: a });
}
export function drawRight(c: Canvas, v: PView, P: readonly V[], i: number, col: Paint, a = 1): void {
  if (a <= 0) return;
  const p = P[i]!, b = P[(i + 1) % P.length]!, q = P[(i - 1 + P.length) % P.length]!;
  const s = 0.42;
  const u1: V = [(b[0] - p[0]) / Math.hypot(b[0] - p[0], b[1] - p[1]), (b[1] - p[1]) / Math.hypot(b[0] - p[0], b[1] - p[1])];
  const u2: V = [(q[0] - p[0]) / Math.hypot(q[0] - p[0], q[1] - p[1]), (q[1] - p[1]) / Math.hypot(q[0] - p[0], q[1] - p[1])];
  const A: V = [p[0] + u1[0] * s, p[1] + u1[1] * s], C: V = [p[0] + u2[0] * s, p[1] + u2[1] * s], B: V = [A[0] + u2[0] * s, A[1] + u2[1] * s];
  strokePts(c, pxs(v, [A, B, C]), { col, lw: 3, alpha: a });
}
/** an angle measure written inside the corner */
export function drawAngle(c: Canvas, v: PView, P: readonly V[], i: number, t: string, col: Paint, a: number, cl: Clear): void {
  if (a <= 0) return;
  const p = P[i]!, b = P[(i + 1) % P.length]!, q = P[(i - 1 + P.length) % P.length]!;
  const [x, y] = px(v, p);
  const a1 = Math.atan2(-(b[1] - p[1]), b[0] - p[0]), a2 = Math.atan2(-(q[1] - p[1]), q[0] - p[0]);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const r = Math.max(26, v.u * 0.42), arc: Pt[] = [];
  for (let k = 0; k <= 16; k++) { const tt = a1 + d * (k / 16); arc.push([x + r * Math.cos(tt), y + r * Math.sin(tt)]); }
  strokePts(c, arc, { col, lw: 3, alpha: a });
  const bis = a1 + d / 2, w = textW(t, NUM, 650) + 6, h = NUM * 0.88;
  const at: Pt = [x + (r + 14 + w * 0.45) * Math.cos(bis), y + (r + 14 + h * 0.45) * Math.sin(bis)];
  cl.boxes.push(box(at[0] - w / 2, at[1] - h / 2, at[0] + w / 2, at[1] + h / 2));
  letter(c, t, at[0], at[1], col, a, NUM, 650);
}

// ---------- the moves (teal) ----------
export function lineEnds(v: PView, L: FlipLine): [V, V] {
  const w = v.win;
  if (L.kind === 'v') return [[L.x, w.y0], [L.x, w.y1]];
  if (L.kind === 'h') return [[w.x0, L.y], [w.x1, L.y]];
  const s = L.s;
  const lo = s === 1 ? Math.max(w.x0 - L.p[0], w.y0 - L.p[1]) : Math.max(w.x0 - L.p[0], L.p[1] - w.y1);
  const hi = s === 1 ? Math.min(w.x1 - L.p[0], w.y1 - L.p[1]) : Math.min(w.x1 - L.p[0], L.p[1] - w.y0);
  return [[L.p[0] + lo, L.p[1] + s * lo], [L.p[0] + hi, L.p[1] + s * hi]];
}
export function drawMirror(c: Canvas, v: PView, L: FlipLine, label: string | undefined, a: number, cl?: Clear, glowK = 0): void {
  if (a <= 0) return;
  const [p, q] = lineEnds(v, L), A = px(v, p), B = px(v, q);
  if (glowK > 0) strokePts(c, [A, B], { col: 'second', lw: 16, alpha: 0.22 * glowK * a });
  strokePts(c, [A, B], { col: 'second', lw: Math.max(4, v.u * 0.06), dash: [16, 11], alpha: a, cap: 'butt' });
  cl?.segs.push([A, B]);
  if (label && cl) {
    const top = A[1] < B[1] ? A : B, w = textW(label, LABEL) + 8;
    const s = placeAround([top[0], top[1] + 40], [1, 0.4], w, LABEL * 0.9, cl, padBox(v.box, 40), 26);
    cl.boxes.push(s.box);
    letter(c, label, s.at[0], s.at[1], 'second', a);
  }
}
export function drawPin(c: Canvas, v: PView, p: V, label: string | undefined, a: number, cl?: Clear, glowK = 0): void {
  if (a <= 0) return;
  const [x, y] = px(v, p), r = Math.max(9, Math.min(15, v.u * 0.17));
  if (glowK > 0) dot(c, x, y, r * 2.6, 'second', 0.25 * glowK * a);
  dot(c, x, y, r + 3, DUSK.ink, a); dot(c, x, y, r, 'second', a); dot(c, x, y, r * 0.38, DUSK.cream, a);
  if (label && cl) {
    const w = textW(label, LABEL) + 8;
    const s = placeAround([x, y], [-1, 1], w, LABEL * 0.9, cl, padBox(v.box, 40), r + 22);
    cl.boxes.push(s.box);
    letter(c, label, s.at[0], s.at[1], 'second', a);
  }
  cl?.dots.push([x, y]);
}
/** a turn arc about c, from the direction of `from`, sweeping q quarter turns (drawn on by k) */
export function drawTurnArc(c: Canvas, v: PView, ctr: V, from: V, q: number, k: number, a = 1): void {
  if (k <= 0 || a <= 0) return;
  const r = Math.max(1.1, Math.min(2.2, Math.hypot(from[0] - ctr[0], from[1] - ctr[1]) * 0.55));
  const a0 = Math.atan2(from[1] - ctr[1], from[0] - ctr[0]) + (q > 0 ? 0.15 : -0.15);
  const sweep = q * Math.PI / 2 - (q > 0 ? 0.3 : -0.3);
  const P: Pt[] = [];
  for (let i = 0; i <= 30; i++) { const t = a0 + sweep * (i / 30); P.push(px(v, [ctr[0] + r * Math.cos(t), ctr[1] + r * Math.sin(t)])); }
  arrow(c, P, E.inOut(clamp(k)), { col: 'second', lw: Math.max(4, v.u * 0.06), head: Math.max(18, v.u * 0.28), alpha: a });
}
/** the guide of one move while it runs: the mirror line, the pin and its arc, or the slide arrow */
export function drawGuide(c: Canvas, v: PView, m: Move, P: readonly V[], k: number, a: number, cl?: Clear): void {
  if (a <= 0) return;
  if (m.kind === 'flip') drawMirror(c, v, m.line, undefined, a * clamp(k * 3), cl, 1);
  else if (m.kind === 'turn') { drawPin(c, v, m.c, veq(m.c, [0, 0]) ? undefined : undefined, a * clamp(k * 3), cl, 1); const far = P.reduce((b, p) => (Math.hypot(p[0] - m.c[0], p[1] - m.c[1]) > Math.hypot(b[0] - m.c[0], b[1] - m.c[1]) ? p : b), P[0]!); drawTurnArc(c, v, m.c, far, m.q, k, a); }
  else if (m.kind === 'slide') {
    const from = P[0]!, to = mv(m, from);
    const A = px(v, from), B = px(v, to);
    arrow(c, [A, B], E.inOut(clamp(k)), { col: 'second', lw: Math.max(4, v.u * 0.06), head: Math.max(18, v.u * 0.28), alpha: a });
    cl?.segs.push([A, B]);
  } else if (m.kind === 'dil') drawPin(c, v, m.c, undefined, a * clamp(k * 3), cl, 1);
}

// ---------- the tracing paper ----------
/** a clear sheet around the figure, carried through the sequence (s = 0..n) */
export function drawTracing(c: Canvas, v: PView, P: readonly V[], seq: readonly Move[], s: number, a = 1): void {
  if (a <= 0) return;
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs) - 0.45, x1 = Math.max(...xs) + 0.45, y0 = Math.min(...ys) - 0.45, y1 = Math.max(...ys) + 0.45;
  const R: V[] = [];
  const n = 5, rr = 0.25;
  const corner = (cx: number, cy: number, t0: number) => { for (let i = 0; i <= n; i++) { const t = t0 + (i / n) * Math.PI / 2; R.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]); } };
  corner(x1 - rr, y0 + rr, -Math.PI / 2); corner(x1 - rr, y1 - rr, 0); corner(x0 + rr, y1 - rr, Math.PI / 2); corner(x0 + rr, y0 + rr, Math.PI);
  const Q = pxs(v, R.map(p => seqAt(seq, p, s)));
  const { g } = c;
  g.save(); g.globalAlpha *= a;
  g.fillStyle = 'rgba(239,230,247,0.11)'; g.beginPath(); Q.forEach(([X, Y], i) => (i ? g.lineTo(X, Y) : g.moveTo(X, Y))); g.closePath(); g.fill();
  g.restore();
  strokePts(c, Q, { col: 'rgba(239,230,247,0.45)', lw: 2.5, closed: true, alpha: a });
}

// ---------- a whole picture ----------
export interface PicState {
  /** fade-in */ k?: number;
  /** 0..1 of the worked solution (the tracing runs the sequence) */ solveK?: number;
  /** 0..1 of the second sequence (also) */ alsoK?: number;
  /** corner rings on the target (0..1) */ ringK?: number;
  /** hide every corner letter (small panels) */ small?: boolean;
  /** dim the figures (the solution plays over them) */
}
const SEEDS: Record<Role, number> = { first: 4, pick: 6, link: 8, ghost: 9, wrong: 10 };
export function drawFigure(c: Canvas, v: PView, f: PFig, a: number, cl: Clear, letters = true, lift = 0): void {
  if (a <= 0) return;
  const col = roleCol(f.role);
  drawShape(c, v, f.pts, col, { alpha: a, seed: SEEDS[f.role], dashed: f.role === 'ghost', lift });
  if (f.role !== 'ghost') drawCorners(c, v, f.pts, col, a);
  if (f.tag) {
    const m = mid(pxs(v, f.pts));
    letter(c, f.tag, m[0], m[1], f.role === 'ghost' ? 'first' : 'ink', a, Math.min(60, Math.max(44, v.u * 0.7)), 750);
  }
  if (letters && f.labels) drawLetters(c, v, f.pts, f.labels, col, a, cl);
}
/** everything of a picture; the solution (a tracing through the sequence) on top */
export function drawCongPic(c: Canvas, v: PView, p: CongPic, st: PicState = {}): void {
  const k = st.k ?? 1, sk = clamp(st.solveK ?? 0), ak = clamp(st.alsoK ?? 0);
  drawPlane(c, v, k);
  const cl = newClear();
  if (v.axes) { const [OX, OY] = px(v, [0, 0]); cl.segs.push([[v.box.x0, OY], [v.box.x1, OY]], [[OX, v.box.y0], [OX, v.box.y1]]); }
  for (const f of p.figs) addPoly(cl, pxs(v, f.pts));
  for (const L of p.lines ?? []) drawMirror(c, v, L.line, st.small ? undefined : L.label, k, cl);
  const solving = sk > 0 && p.solve;
  p.figs.forEach((f, i) => {
    const moving = p.solve && p.solve.fig === i && solving;
    drawFigure(c, v, f, k * (moving ? 0.55 : 1), cl, !st.small);
  });
  p.figs.forEach((f, i) => {
    for (const r of p.rights ?? []) if (r.fig === i) drawRight(c, v, f.pts, r.at, roleCol(f.role), k);
  });
  // side lengths after the letters, so letters keep the best spots
  p.figs.forEach((f, i) => {
    if (f.lens && !st.small) drawLens(c, v, f.pts, f.lens, roleCol(f.role), k, cl);
    for (const g of p.angles ?? []) if (g.fig === i) drawAngle(c, v, f.pts, g.at, g.text, roleCol(f.role), k, cl);
  });
  for (const i of p.orderArrows ?? []) { const f = p.figs[i]; if (f) drawOrder(c, v, f.pts, roleCol(f.role), k, k); }
  for (const q of p.pins ?? []) drawPin(c, v, q.p, st.small ? undefined : q.label, k, cl);
  if (p.solve && (sk > 0 || ak > 0)) {
    const F = p.figs[p.solve.fig]!;
    const runs: { seq: Move[]; kk: number; col: Paint }[] = [{ seq: p.solve.seq, kk: sk, col: p.solve.miss ? 'wrong' : 'link' }];
    if (p.solve.also) runs.push({ seq: p.solve.also, kk: ak, col: 'pick' });
    for (const r of runs) {
      if (r.kk <= 0) continue;
      const n = r.seq.length, s = E.smooth(r.kk) * n;
      // the images after finished steps stay as dashed ghosts
      for (let i = 1; i < n; i++) if (s >= i) drawShape(c, v, F.pts.map(q => seqAt(r.seq, q, i)), r.col, { dashed: true, alpha: 0.55 });
      const step = Math.min(n - 1, Math.floor(s));
      const before = F.pts.map(q => seqAt(r.seq, q, step));
      if (s < n) drawGuide(c, v, r.seq[step]!, before, s - step, 1);
      drawTracing(c, v, F.pts, r.seq, s, 0.9);
      const Q = F.pts.map(q => seqAt(r.seq, q, s));
      drawShape(c, v, Q, s >= n ? r.col : 'first', { alpha: 0.95, seed: 8 });
      drawCorners(c, v, Q, s >= n ? r.col : 'first', 1);
      if (s >= n && p.orderArrows?.includes(p.solve.fig)) drawOrder(c, v, Q, r.col, 1, 1);
      if (s >= n && p.solve.to === undefined && F.labels && !st.small && r.col === 'link') drawLetters(c, v, Q, F.labels.map(l => (l ? l + '′'.repeat(n > 1 ? 2 : 1) : '')), 'link', 1, cl);
    }
  }
  // the check: a ring on every corner of the target
  const rk = st.ringK ?? 0;
  if (rk > 0 && p.solve?.to !== undefined) {
    const T = p.figs[p.solve.to]!;
    T.pts.forEach((q, i) => {
      const kk = clamp(rk * T.pts.length - i);
      if (kk <= 0) return;
      const [x, y] = px(v, q);
      const { g } = c; g.save(); g.globalAlpha *= kk;
      g.lineWidth = 5; g.strokeStyle = paint(c.th, 'link', 'line'); g.beginPath(); g.arc(x, y, Math.max(16, v.u * 0.26), 0, Math.PI * 2); g.stroke(); g.restore();
    });
  }
}

// ---------- candidate panels on the board ----------
export function panelBoxes(n: number, area: Box): { panel: Box; tag: Pt }[] {
  const out: { panel: Box; tag: Pt }[] = [];
  if (n <= 2) {
    const rh = area.h / n, side = Math.min(rh - 24, area.w - 110);
    for (let i = 0; i < n; i++) {
      const cy = area.y0 + rh * i + rh / 2, x0 = area.x0 + 90 + (area.w - 90 - side) / 2;
      out.push({ panel: box(x0, cy - side / 2, x0 + side, cy + side / 2), tag: [area.x0 + 36, cy] });
    }
    return out;
  }
  // 3 or 4: a 2 x 2 grid, the number above each panel's top-left corner
  const cols = 2, rows = Math.ceil(n / 2), cw = area.w / cols, rh = area.h / rows;
  const side = Math.min(cw - 34, rh - 66);
  for (let i = 0; i < n; i++) {
    const cx = area.x0 + cw * (i % cols) + cw / 2, top = area.y0 + rh * Math.floor(i / cols);
    const panel = box(cx - side / 2, top + 58, cx + side / 2, top + 58 + side);
    out.push({ panel, tag: [panel.x0 + 14, top + 28] });
  }
  return out;
}
export type PanelState = 'idle' | 'right' | 'wrong';
/** candidate figures, each on its own small copy of the grid (same window), with a faint copy of `ref` */
export function drawPanels(c: Canvas, p: CongPic, area: Box, st: Record<string, PanelState> = {}, k = 1, ref?: PFig): void {
  if (!p.cands || k <= 0) return;
  const boxes = panelBoxes(p.cands.length, area);
  p.cands.forEach((cd, i) => {
    const { panel, tag } = boxes[i]!;
    const s = st[cd.label] ?? 'idle';
    const v = planeView(p.win, box(panel.x0 + 8, panel.y0 + 8, panel.x1 - 8, panel.y1 - 8), false, 60, 8);
    const { g } = c;
    g.save(); g.globalAlpha *= k;
    g.fillStyle = '#171A3A'; g.beginPath(); g.roundRect(panel.x0, panel.y0, panel.w, panel.h, 14); g.fill();
    g.lineWidth = s === 'idle' ? 2 : 5; g.strokeStyle = s === 'right' ? paint(c.th, 'link', 'fill') : s === 'wrong' ? paint(c.th, 'wrong', 'fill') : '#3A3F6B';
    g.beginPath(); g.roundRect(panel.x0, panel.y0, panel.w, panel.h, 14); g.stroke();
    g.restore();
    // a plain grid (no wash behind it: the panel is the paper)
    g.save(); g.globalAlpha *= k * 0.9; g.lineWidth = 1.2; g.strokeStyle = '#2C3160'; g.beginPath();
    for (let x = p.win.x0; x <= p.win.x1; x++) { const X = px(v, [x, 0])[0]; g.moveTo(X, v.box.y0); g.lineTo(X, v.box.y1); }
    for (let y = p.win.y0; y <= p.win.y1; y++) { const Y = px(v, [0, y])[1]; g.moveTo(v.box.x0, Y); g.lineTo(v.box.x1, Y); }
    g.stroke(); g.restore();
    if (ref) drawShape(c, v, ref.pts, 'first', { dashed: true, alpha: 0.6 * k });
    const col: Paint = s === 'right' ? 'link' : s === 'wrong' ? 'wrong' : roleCol(cd.fig.role);
    drawShape(c, v, cd.fig.pts, col, { alpha: k, seed: 11 + i });
    drawCorners(c, v, cd.fig.pts, col, k);
    letter(c, cd.label, tag[0], tag[1], s === 'right' ? 'link' : s === 'wrong' ? 'wrong' : 'ink', k, 60, 700);
  });
}
