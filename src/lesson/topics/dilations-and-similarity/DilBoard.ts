// DilBoard: the model of the dilations-and-similarity lesson. It draws with the congruence lesson's TraceBoard
// painters (imported read-only: the same plane, washes, letters, labels and tracing paper) and adds what a dilation
// needs:
//   center    a teal pin (the one point that stays)
//   rays      crisp teal rays from the center through every corner, out past the image
//   bars      the distance along one ray as two bars beside it: amber = center to P, lime = center to P', with a
//             tick every 1/d of the amber bar, so "P' is k times as far" can be counted (k = n/d)
//   grow      the image grows out of the figure along the rays (dashed while it moves, a lime wash when it lands)
//   seq       a tracing carried through a dilation and rigid motions (the congruence tracing, plus the dilation)
//   sim       paper figures (no grid): one figure is dilated in place, then flipped, turned and slid onto the other
//   labels    corner letters, side lengths, angle measures, equal-angle arcs, right-angle squares, the unknown ('?'
//             in lime until the solution reveals it), all placed clear of edges, rays and each other
// Roles: first (amber) = the figure we start from, second (teal) = the center, rays and moves, pick (lavender) = a
// candidate / the other figure, link (lime) = the image / the answer, wrong (red) = a wrong image.
// Layout throws (BlockError) when a grid square is too small (planeView); pictures are checked by dilMaths.picProblem.
import { type Box, type Pt, box, clamp, padBox } from '../../../core/math';
import { type Canvas, dot, drawOn, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import { type Paint, paint } from '../../../core/theme';
import { DUSK } from '../../dusk';
import { SANS } from '../../words';
import {
  type Clear, type PView, NUM, addPoly, drawCorners, drawLetters, drawLens, drawOrder, drawPin, drawPlane, drawRight, drawShape,
  drawTracing, drawGuide, letter, newClear, placeAround, planeView, px, pxs, textW,
} from '../congruence/TraceBoard';
import { type DFig, type DRole, type DilPic, type V, dilate, dilateAll, kv, seqAt, simAt, simMap, centroid, orientOf } from './dilMaths';

export const colOf = (r: DRole): Paint => (r === 'ghost' ? 'first' : r);
const SEEDS: Record<DRole, number> = { first: 4, second: 5, pick: 6, link: 8, ghost: 9, wrong: 10 };

/** the view of a picture inside `area`: a plane keeps its grid squares >= 30 px; paper fits the figures */
export function viewOf(p: DilPic, area: Box): PView {
  if (p.kind === 'plane') return planeView(p.win, area, p.axes, 96, 30);
  return planeView(p.win, padBox(area, -30), false, 400, 2);
}

// ---------- small painters ----------
/** equal-angle marks: n arcs at the corner */
export function drawMarks(c: Canvas, v: PView, P: readonly V[], i: number, n: number, col: Paint, a = 1, lw = 3.5): void {
  if (n <= 0 || a <= 0) return;
  const p = px(v, P[i]!), b = px(v, P[(i + 1) % P.length]!), q = px(v, P[(i - 1 + P.length) % P.length]!);
  const a1 = Math.atan2(b[1] - p[1], b[0] - p[0]), a2 = Math.atan2(q[1] - p[1], q[0] - p[0]);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const short = Math.min(Math.hypot(b[0] - p[0], b[1] - p[1]), Math.hypot(q[0] - p[0], q[1] - p[1]));
  const r0 = clamp(short * 0.2, 22, 40);
  for (let j = 0; j < n; j++) {
    const r = r0 + j * 9, arc: Pt[] = [];
    for (let s = 0; s <= 18; s++) { const t = a1 + d * (s / 18); arc.push([p[0] + r * Math.cos(t), p[1] + r * Math.sin(t)]); }
    strokePts(c, arc, { col, lw, alpha: a });
  }
}
/** an angle measure at a corner: a thin arc and the number placed in the opening, clear of everything */
export function drawAngleText(c: Canvas, v: PView, P: readonly V[], i: number, t: string, col: Paint, a: number, cl: Clear, arc = true): void {
  if (a <= 0 || !t) return;
  const p = px(v, P[i]!), b = px(v, P[(i + 1) % P.length]!), q = px(v, P[(i - 1 + P.length) % P.length]!);
  const a1 = Math.atan2(b[1] - p[1], b[0] - p[0]), a2 = Math.atan2(q[1] - p[1], q[0] - p[0]);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const short = Math.min(Math.hypot(b[0] - p[0], b[1] - p[1]), Math.hypot(q[0] - p[0], q[1] - p[1]));
  const r = clamp(short * 0.18, 20, 34);
  if (arc) {
    const pts: Pt[] = [];
    for (let s = 0; s <= 16; s++) { const tt = a1 + d * (s / 16); pts.push([p[0] + r * Math.cos(tt), p[1] + r * Math.sin(tt)]); }
    strokePts(c, pts, { col, lw: 3, alpha: a });
  }
  const bis = a1 + d / 2, w = textW(t, NUM, 650) + 6, h = NUM * 0.88;
  const s = placeAround(p, [Math.cos(bis), Math.sin(bis)], w, h, cl, padBox(v.box, 60), r + 14);
  cl.boxes.push(s.box);
  letter(c, t, s.at[0], s.at[1], col, a, NUM, 650);
}
/** the box the order arrow (TraceBoard.drawOrder) takes, so labels stay off it */
function orderBox(v: PView, P: readonly V[]): Box {
  const Q = pxs(v, P), m: Pt = [Q.reduce((s, q) => s + q[0], 0) / Q.length, Q.reduce((s, q) => s + q[1], 0) / Q.length];
  let r = 1e9;
  for (let i = 0; i < Q.length; i++) {
    const A = Q[i]!, B = Q[(i + 1) % Q.length]!, dx = B[0] - A[0], dy = B[1] - A[1], l = dx * dx + dy * dy;
    const t = l ? clamp(((m[0] - A[0]) * dx + (m[1] - A[1]) * dy) / l) : 0;
    r = Math.min(r, Math.hypot(m[0] - A[0] - t * dx, m[1] - A[1] - t * dy));
  }
  r = clamp(r * 0.62, 18, v.u * 0.9) + 14;
  return box(m[0] - r, m[1] - r, m[0] + r, m[1] + r);
}
/** a caption word under a figure */
function drawCaption(c: Canvas, v: PView, P: readonly V[], t: string, col: Paint, a: number, cl: Clear): void {
  const Q = pxs(v, P), xs = Q.map(q => q[0]), ys = Q.map(q => q[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, y = Math.max(...ys);
  const w = textW(t, NUM, 600) + 8, h = NUM * 0.9;
  const s = placeAround([cx, y + 34], [0, 1], w, h, cl, padBox(v.box, 70), 12);
  cl.boxes.push(s.box);
  letter(c, t, s.at[0], s.at[1], col, a, NUM, 600);
}
/** the distance bars beside the ray c -> p: amber = cP, lime = cP' (= k cP), ticks every cP / d */
export function drawBars(c: Canvas, v: PView, cen: V, p: V, k: { n: number; d: number }, t: number, a = 1): void {
  if (t <= 0 || a <= 0) return;
  const C = px(v, cen), P = px(v, p), Q = px(v, dilate(p, cen, kv(k)));
  const L = Math.hypot(P[0] - C[0], P[1] - C[1]);
  if (L < 1) return;
  const ux = (P[0] - C[0]) / L, uy = (P[1] - C[1]) / L, nx = -uy, ny = ux, off = 15;
  const ta = clamp(t * 2), tb = clamp(t * 2 - 1);
  const bar = (from: Pt, to: Pt, s: number, col: Paint, kk: number) => {
    const A: Pt = [from[0] + nx * off * s, from[1] + ny * off * s], B: Pt = [to[0] + nx * off * s, to[1] + ny * off * s];
    drawOn(c, [A, B], E.inOut(kk), { col, lw: 8, alpha: a });
    // end caps
    if (kk > 0.98) for (const e of [A, B]) strokePts(c, [[e[0] - nx * 9, e[1] - ny * 9], [e[0] + nx * 9, e[1] + ny * 9]], { col, lw: 3.5, alpha: a });
  };
  bar(C, P, 1, 'first', ta);
  if (tb > 0) {
    bar(C, Q, -1, 'link', tb);
    // ticks every cP / d along the lime bar
    const step = L / k.d, n = Math.round((Math.hypot(Q[0] - C[0], Q[1] - C[1])) / step);
    for (let j = 1; j < n; j++) {
      const along = j * step;
      if (along > tb * n * step) break;
      const X = C[0] + ux * along - nx * off, Y = C[1] + uy * along - ny * off;
      strokePts(c, [[X - nx * 10, Y - ny * 10], [X + nx * 10, Y + ny * 10]], { col: 'link', lw: 3, alpha: a });
    }
    if (k.d > 1) for (let j = 1; j < k.d; j++) {
      const X = C[0] + ux * j * step + nx * off, Y = C[1] + uy * j * step + ny * off;
      strokePts(c, [[X - nx * 10, Y - ny * 10], [X + nx * 10, Y + ny * 10]], { col: 'first', lw: 3, alpha: a * ta });
    }
  }
}
/** a ray from the center through p and its image, a little past the farther one (clipped to the plane) */
function rayEnd(v: PView, cen: V, p: V, q: V): Pt {
  const C = px(v, cen), far = Math.hypot(...(px(v, q).map((x, i) => x - C[i]!) as [number, number])) > Math.hypot(...(px(v, p).map((x, i) => x - C[i]!) as [number, number])) ? px(v, q) : px(v, p);
  const L = Math.hypot(far[0] - C[0], far[1] - C[1]) || 1, ux = (far[0] - C[0]) / L, uy = (far[1] - C[1]) / L;
  let ext = L + Math.max(40, v.u * 0.7);
  const b = v.box;
  if (ux > 1e-9) ext = Math.min(ext, (b.x1 - C[0]) / ux); if (ux < -1e-9) ext = Math.min(ext, (b.x0 - C[0]) / ux);
  if (uy > 1e-9) ext = Math.min(ext, (b.y1 - C[1]) / uy); if (uy < -1e-9) ext = Math.min(ext, (b.y0 - C[1]) / uy);
  return [C[0] + ux * Math.max(ext, L), C[1] + uy * Math.max(ext, L)];
}

// ---------- the whole picture ----------
export interface DState {
  /** fade-in */ k?: number;
  /** rays drawn on (0..1) */ rays?: number;
  /** distance bars (0..n over the `bars` corners) */ bars?: number;
  /** the image grows out along the rays (0..1) */ grow?: number;
  /** the tracing runs the sequence (0..1) */ seqK?: number;
  /** the paper replay (0..1) */ simK?: number;
  /** '?' turns into the answer, hidden figures and points appear (0..1) */ reveal?: number;
  /** rings on the target's corners (0..1) */ ring?: number;
  /** a glow on side i of figure f */ glow?: { fig: number; side: number; k: number; col?: Paint }[];
  /** hide the letters of the image */ noImageLetters?: boolean;
  /** dim these figures */ dim?: Record<number, number>;
  /** extra alpha per figure (0 = hidden) */ show?: Record<number, number>;
  /** alpha of the side / angle labels per figure */ lab?: Record<number, number>;
  /** the picture's highlighted sides and angles (0..1) */ hi?: number;
}
export function drawDilPic(c: Canvas, v: PView, p: DilPic, st: DState = {}): void {
  const k = st.k ?? 1;
  if (k <= 0) return;
  const reveal = clamp(st.reveal ?? 0);
  if (p.kind === 'plane') drawPlane(c, v, k);
  const cl = newClear();
  if (p.kind === 'plane' && v.axes) { const [OX, OY] = px(v, [0, 0]); cl.segs.push([[v.box.x0, OY], [v.box.x1, OY]], [[OX, v.box.y0], [OX, v.box.y1]]); }
  const alphaOf = (f: DFig, i: number) => k * (f.hidden ? reveal : 1) * (st.show?.[i] ?? 1) * (1 - 0.55 * (st.dim?.[i] ?? 0));
  const solvingSeq = (st.seqK ?? 0) > 0 && p.seq, solvingSim = (st.simK ?? 0) > 0 && p.sim;
  p.figs.forEach((f, i) => { if (alphaOf(f, i) > 0.02) addPoly(cl, pxs(v, f.pts)); });
  // glows under the figures
  for (const g of st.glow ?? []) {
    const f = p.figs[g.fig];
    if (!f || g.k <= 0) continue;
    const A = px(v, f.pts[g.side]!), B = px(v, f.pts[(g.side + 1) % f.pts.length]!);
    strokePts(c, [A, B], { col: g.col ?? colOf(f.role), lw: 22, alpha: 0.35 * g.k * k });
  }
  const hk = clamp(st.hi ?? 0);
  if (hk > 0) for (const g of p.hi ?? []) {
    const f = p.figs[g.fig];
    if (!f) continue;
    const A = px(v, f.pts[g.side]!), B = px(v, f.pts[(g.side + 1) % f.pts.length]!);
    strokePts(c, [A, B], { col: 'link', lw: 22, alpha: 0.38 * hk * k });
  }
  // the figures
  p.figs.forEach((f, i) => {
    let a = alphaOf(f, i);
    if ((solvingSeq && p.seq!.fig === i) || (solvingSim && p.sim!.fig === i)) a *= 0.5;
    if (a <= 0) return;
    drawShape(c, v, f.pts, colOf(f.role), { alpha: a, seed: SEEDS[f.role] + i, dashed: f.dashed || f.role === 'ghost' });
    if (!f.dashed && f.role !== 'ghost') drawCorners(c, v, f.pts, colOf(f.role), a);
    for (const r of f.rights ?? []) drawRight(c, v, f.pts, r, colOf(f.role), a);
    (f.marks ?? []).forEach((n, j) => drawMarks(c, v, f.pts, j, n, colOf(f.role), a));
    if (f.order) { drawOrder(c, v, f.pts, colOf(f.role), 1, a); cl.boxes.push(orderBox(v, f.pts)); }
    if (f.tag) { const m = centroid(pxs(v, f.pts) as unknown as V[]); letter(c, f.tag, m[0], m[1], 'ink', a, Math.min(64, Math.max(46, v.u * 0.7)), 750); cl.boxes.push(box(m[0] - 30, m[1] - 30, m[0] + 30, m[1] + 30)); }
  });
  // the dilation: rays, center, bars, the growing image
  const D = p.dil;
  const rk = clamp(Math.max(st.rays ?? 0, D?.given ? 1 : 0));
  if (D && rk > 0) {
    const F = p.figs[D.fig]!, kd = kv(D.k);
    const C = px(v, D.c);
    F.pts.forEach(q => {
      const e = rayEnd(v, D.c, q, dilate(q, D.c, kd));
      drawOn(c, [C, e], E.inOut(rk), { col: 'second', lw: 3, alpha: 0.9 * k });
      cl.segs.push([C, e]);
    });
  }
  if (D) {
    const bk = st.bars ?? 0, B = D.bars ?? [];
    const F = p.figs[D.fig]!;
    B.forEach((vi, j) => drawBars(c, v, D.c, F.pts[vi]!, D.k, clamp(bk - j), k));
  }
  const gk = clamp(st.grow ?? 0);
  if (D && gk > 0) {
    const F = p.figs[D.fig]!, kd = kv(D.k), kt = 1 + (kd - 1) * E.smooth(gk);
    const Q = F.pts.map(q => dilate(q, D.c, kt)) as V[];
    const col = colOf(D.role ?? 'link');
    if (gk < 1) { drawShape(c, v, Q, col, { dashed: true, alpha: k }); drawCorners(c, v, Q, col, k); }
    else {
      drawShape(c, v, Q, col, { alpha: k * 0.95, seed: 8 }); drawCorners(c, v, Q, col, k);
      addPoly(cl, pxs(v, Q));
      for (const r of F.rights ?? []) drawRight(c, v, Q, r, col, k);
      if (F.order) drawOrder(c, v, Q, col, 1, k);
      if (D.labels !== false && !st.noImageLetters && F.labels) drawLetters(c, v, Q, F.labels.map(l => (l ? l + '′' : '')), col, k, cl);
    }
  }
  // the tracing through a sequence (plane)
  const sk = clamp(st.seqK ?? 0);
  if (p.seq && sk > 0) {
    const F = p.figs[p.seq.fig]!, ms = p.seq.moves, n = ms.length, s = E.smooth(sk) * n;
    for (let i = 1; i < n; i++) if (s >= i) drawShape(c, v, F.pts.map(q => seqAt(ms, q, i)), 'link', { dashed: true, alpha: 0.55 });
    const step = Math.min(n - 1, Math.floor(s));
    if (s < n) drawGuide(c, v, ms[step]!, F.pts.map(q => seqAt(ms, q, step)), s - step, 1);
    drawTracing(c, v, F.pts, ms, s, 0.9);
    const Q = F.pts.map(q => seqAt(ms, q, s));
    drawShape(c, v, Q, s >= n ? 'link' : 'first', { alpha: 0.95, seed: 8 }); drawCorners(c, v, Q, s >= n ? 'link' : 'first', 1);
  }
  // the paper replay: dilate in place, then flip / turn / slide onto the other figure
  const mk = clamp(st.simK ?? 0);
  if (p.sim && mk > 0) {
    const F = p.figs[p.sim.fig]!, T = p.figs[p.sim.to]!, m = simMap(F.pts, T.pts);
    const Q = F.pts.map(q => simAt(m, q, E.smooth(mk)));
    drawShape(c, v, Q, mk >= 1 ? 'link' : 'first', { alpha: 0.85, seed: 8, dashed: mk < 1 }); drawCorners(c, v, Q, mk >= 1 ? 'link' : 'first', 1);
  }
  // the center on top of the rays
  if (p.center) drawPin(c, v, p.center.p, p.center.label, k, cl);
  // letters, then side lengths, then angles (letters keep the best spots)
  p.figs.forEach((f, i) => { const a = alphaOf(f, i); if (a > 0 && f.labels) drawLetters(c, v, f.pts, f.labels, colOf(f.role), a, cl); });
  // marked points
  for (const q of p.pts ?? []) {
    const a = k * (q.hidden ? reveal : 1);
    if (a <= 0) continue;
    const [x, y] = px(v, q.p), col = colOf(q.role);
    dot(c, x, y, 13, DUSK.ink, a); dot(c, x, y, 10, col, a);
    const w = textW(q.label, 50) + 8;
    const s = placeAround([x, y], [1, -1], w, 46, cl, padBox(v.box, 40), 34);
    cl.boxes.push(s.box); cl.dots.push([x, y]);
    letter(c, q.label, s.at[0], s.at[1], col, a, 50);
  }
  p.figs.forEach((f, i) => {
    const a = alphaOf(f, i);
    if (a <= 0) return;
    const col = colOf(f.role), la = a * (st.lab?.[i] ?? 1);
    if (f.lens && la > 0) drawLens(c, v, f.pts, f.lens, col, la, cl);
    if (la > 0) (f.angs ?? []).forEach((t, j) => { if (t) drawAngleText(c, v, f.pts, j, t, col, la, cl, !(f.rights ?? []).includes(j)); });
    if (f.ask) {
      const t = reveal > 0.5 ? f.ask.ans : '?', aa = a * (reveal > 0 && reveal < 1 ? Math.abs(reveal - 0.5) * 2 : 1);
      if (f.ask.side !== undefined) drawLens(c, v, f.pts, f.pts.map((_, j) => (j === f.ask!.side ? t : null)), 'link', aa, cl);
      if (f.ask.angle !== undefined) drawAngleText(c, v, f.pts, f.ask.angle, t, 'link', aa, cl);
    }
    if (f.caption) drawCaption(c, v, f.pts, f.caption, 'dim', a, cl);
  });
  if (hk > 0) for (const g of p.hiAng ?? []) { const f = p.figs[g.fig]; if (f) drawMarks(c, v, f.pts, g.at, 1, 'link', hk * k, 6); }
  // the check: a ring on every corner of the target
  const ring = st.ring ?? 0, to = p.seq?.to ?? p.sim?.to;
  if (ring > 0 && to !== undefined) {
    const T = p.figs[to]!;
    T.pts.forEach((q, i) => {
      const kk = clamp(ring * T.pts.length - i);
      if (kk <= 0) return;
      const [x, y] = px(v, q);
      const { g } = c; g.save(); g.globalAlpha *= kk;
      g.lineWidth = 5; g.strokeStyle = paint(c.th, 'link', 'line'); g.beginPath(); g.arc(x, y, Math.max(18, v.u * 0.26), 0, Math.PI * 2); g.stroke(); g.restore();
    });
  }
  if (p.note) {
    const { g } = c;
    g.save(); g.globalAlpha *= k; g.font = `italic 600 ${NUM}px ${SANS}`; g.textAlign = 'left'; g.textBaseline = 'top';
    g.fillStyle = paint(c.th, 'dim', 'text'); g.fillText(p.note, v.box.x0 - 20, v.box.y0 - 40); g.restore();
  }
}
/** the image of figure `fig` under the picture's dilation (for leaders and boxes) */
export function imageOf(p: DilPic): V[] { const D = p.dil!; return dilateAll(p.figs[D.fig]!.pts, D.c, kv(D.k)); }
export { orientOf };
