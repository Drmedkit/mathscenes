// MotionGrid: the model block of "translations, reflections and rotations". A coordinate grid (crisp lines, the
// numbers in the margin, never on a line) with labelled figures, the motion's own marks and a tracing-paper copy that
// carries the figure along the motion, so "one move, the same for every point" is something you watch.
//   Roles: first (amber) = the preimage; second (teal) = the motion: mirror line, center, slide arrow, turn arc;
//          link (lime) = the image / the answer; pick (lavender) = focus marks, links point -> image, candidates,
//          the tracing paper; wrong (red) = wrong.
//   Steps (Progress keys): grid; f<i> (figure i draws on: outline, then wash); n<i> (its letters); mirror; center;
//          arrow; turn; d<i> (dot i); l<i> (dashed link i); ghost (the tracing paper shows) + move (it moves 0..1).
//   Focus: round "order" arrows inside figures (vertex order kept or reversed), side glows, vertex rings, angle arcs,
//          right-angle marks, rays from the center, dimmed figures.
// Layout is pure: letters are placed around their vertex clear of every edge, letter and dot; the block throws a
// BlockError when the grid would be too small to read. Maths in motionMaths.ts.
import { type Box, type Pt, box, clamp, padBox, boxesOverlap } from '../../../core/math';
import { type Canvas, arrow, dot, drawOn, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { SANS, wordsBox } from '../../words';
import { wash } from '../../wash';
import { type Motion, type V, at, centroid, orient } from './motionMaths';

const NAME = 'MotionGrid';
export const PAPER = '#1A1E44', GRID = '#343A6A', AXIS = '#8F93C4';
const LETTER = 50, TICK = 44, LINE_NAME = 44;

export interface Win { x0: number; x1: number; y0: number; y1: number }
export interface FigSpec {
  pts: readonly V[];
  /** a letter per vertex (null = none) */
  names?: readonly (string | null)[];
  role: Paint;
  /** a segment / polyline instead of a closed polygon */
  open?: boolean;
  dash?: boolean;
  /** the wash under a closed figure (0 = outline only) */
  fill?: number;
}
export interface GridPic {
  win?: Win;
  grid?: boolean;
  axes?: boolean;
  figs: readonly FigSpec[];
  mirror?: { p: V; q: V; name?: string };
  center?: { p: V; name?: string };
  arrow?: { from: V; to: V };
  dots?: readonly { p: V; name?: string; role: Paint }[];
  links?: readonly { a: V; b: V }[];
  /** a turn arrow about c, starting at `from`, at r x its distance from c (default 0.5; 1 = the point's own path) */
  turn?: { c: V; from: V; deg: number; r?: number };
  /** segments the letters must keep clear of (focus marks drawn later, such as rays from a center) */
  avoid?: readonly (readonly [V, V])[];
  ghost?: { fig: number; m: Motion };
}
export interface GridFocus {
  order?: readonly { fig: number; k: number; col: Paint }[];
  sides?: readonly { fig: number; i: number; k: number; col: Paint }[];
  verts?: readonly { fig: number; i: number; k: number; col: Paint }[];
  angles?: readonly { fig: number; i: number; k: number; col: Paint }[];
  rays?: readonly { from: V; to: V; k: number; col: Paint }[];
  /** a ring around a point (the right candidate after a miss) */
  rings?: readonly { p: V; k: number; col: Paint }[];
  right?: readonly { at: V; a: V; b: V; k: number; col: Paint }[];
  dim?: readonly { fig: number; k: number }[];
  /** fade the dashed point-to-image links (0..1) */
  linkFade?: number;
}
interface Placed { t: string; x: number; y: number; box: Box; col: Paint }
export interface MotionGridBlock {
  readonly kind: 'MotionGrid';
  readonly pic: GridPic;
  readonly box: Box;
  readonly u: number;
  readonly win: Win;
  /** letters that could not be placed clear of everything (0 = clean) */
  readonly clashes: number;
  px(p: V): Pt;
  readonly where: {
    grid: Box; vertex(f: number, i: number): Box; name(f: number, i: number): Box; fig(f: number): Box;
    center: Box; dot(i: number): Box; mirror: Box; arrow: Box; point(p: V): Box;
  };
  draw(c: Canvas, p: Progress<string>, f?: GridFocus): void;
}

/** every point a picture needs to show */
export function picPoints(pic: GridPic): V[] {
  const P: V[] = [];
  for (const f of pic.figs) P.push(...f.pts);
  if (pic.center) P.push(pic.center.p);
  if (pic.arrow) P.push(pic.arrow.from, pic.arrow.to);
  for (const d of pic.dots ?? []) P.push(d.p);
  for (const l of pic.links ?? []) P.push(l.a, l.b);
  if (pic.turn) P.push(pic.turn.c, pic.turn.from);
  if (pic.ghost) { const f = pic.figs[pic.ghost.fig]; if (f) for (let k = 0; k <= 1; k += 0.25) P.push(...f.pts.map(p => at(pic.ghost!.m, p, k))); }
  return P;
}
/** the window: everything plus a unit of air (the origin when the axes show), squared up, 8..18 units */
export function autoWin(pic: GridPic): Win {
  const P = picPoints(pic);
  if (pic.axes !== false) P.push([0, 0]);
  if (pic.mirror) P.push(pic.mirror.p, pic.mirror.q);
  let x0 = Math.floor(Math.min(...P.map(p => p[0])) - 1), x1 = Math.ceil(Math.max(...P.map(p => p[0])) + 1);
  let y0 = Math.floor(Math.min(...P.map(p => p[1])) - 1), y1 = Math.ceil(Math.max(...P.map(p => p[1])) + 1);
  const S = Math.max(8, x1 - x0, y1 - y0);
  const grow = (a: number, b: number): [number, number] => { const d = S - (b - a); const l = Math.floor(d / 2); return [a - l, b + (d - l)]; };
  [x0, x1] = grow(x0, x1); [y0, y1] = grow(y0, y1);
  return { x0, x1, y0, y1 };
}
export const winSize = (w: Win): number => Math.max(w.x1 - w.x0, w.y1 - w.y0);

/** clip the infinite line through p, q to the window rectangle (in grid units) */
function clipLine(p: V, q: V, w: Win): [V, V] {
  const d: V = [q[0] - p[0], q[1] - p[1]];
  let t0 = -1e9, t1 = 1e9;
  const lim = (pp: number, dd: number, lo: number, hi: number) => {
    if (Math.abs(dd) < 1e-12) return;
    let a = (lo - pp) / dd, b = (hi - pp) / dd; if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
  };
  lim(p[0], d[0], w.x0, w.x1); lim(p[1], d[1], w.y0, w.y1);
  return [[p[0] + d[0] * t0, p[1] + d[1] * t0], [p[0] + d[0] * t1, p[1] + d[1] * t1]];
}

export function MotionGrid(pic: GridPic, fr: Frame): MotionGridBlock {
  const win = pic.win ?? autoWin(pic);
  const axes = pic.axes !== false, gridOn = pic.grid !== false;
  const W = win.x1 - win.x0, H = win.y1 - win.y0;
  check(W > 0 && H > 0, NAME, 'empty window');
  const mL = axes ? 70 : 20, mB = axes ? 60 : 20, mT = axes ? 56 : 20, mR = axes ? 50 : 20;
  const u = Math.min(92, (fr.w - mL - mR) / W, (fr.h - mT - mB) / H);
  check(u >= 42, NAME, `grid squares of ${Math.round(u)} px are too small to read (window ${W} x ${H})`);
  const gx0 = fr.x + mL + (fr.w - mL - mR - W * u) / 2, gy1 = fr.y + mT + (fr.h - mT - mB + H * u) / 2;
  const px = (p: V): Pt => [gx0 + (p[0] - win.x0) * u, gy1 - (p[1] - win.y0) * u];
  const gridBox = box(gx0, gy1 - H * u, gx0 + W * u, gy1);
  const inWin = (p: V) => p[0] >= win.x0 - 1e-9 && p[0] <= win.x1 + 1e-9 && p[1] >= win.y0 - 1e-9 && p[1] <= win.y1 + 1e-9;
  for (const p of picPoints(pic)) check(inWin(p), NAME, `point (${p[0]}, ${p[1]}) is outside the window`);

  // ---- the lines letters must stay clear of ----
  const figPx = pic.figs.map(f => f.pts.map(px));
  const edges: Pt[][] = figPx.map((P, i) => (pic.figs[i]!.open || P.length < 3 ? P : [...P, P[0]!]));
  const mirrorPx = pic.mirror ? clipLine(pic.mirror.p, pic.mirror.q, win).map(px) : null;
  const extraLines: Pt[][] = [];
  if (mirrorPx) extraLines.push(mirrorPx);
  if (pic.arrow) extraLines.push([px(pic.arrow.from), px(pic.arrow.to)]);
  for (const l of pic.links ?? []) extraLines.push([px(l.a), px(l.b)]);
  const axisLines: Pt[][] = axes ? [[px([win.x0, 0]), px([win.x1, 0])], [px([0, win.y0]), px([0, win.y1])]] : [];
  for (const [a, b] of pic.avoid ?? []) extraLines.push([px(a), px(b)]);
  const allLines = [...edges, ...extraLines, ...axisLines];

  // ---- letters: around their vertex, clear of edges, letters and dots ----
  const placed: Placed[] = [];
  const names: (Placed | null)[][] = pic.figs.map(() => []);
  const pointsPx: Pt[] = [...figPx.flat(), ...(pic.dots ?? []).map(d => px(d.p)), ...(pic.center ? [px(pic.center.p)] : [])];
  let clashes = 0;
  const closedPx = figPx.filter((P, i) => P.length >= 3 && !pic.figs[i]!.open);
  /** is a point inside a polygon (even-odd) */
  const inside = (p: Pt, P: readonly Pt[]): boolean => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i]!, b = P[j]!; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const dirs: Pt[] = Array.from({ length: 16 }, (_, i) => [Math.cos((i * Math.PI) / 8), Math.sin((i * Math.PI) / 8)]);
  function placeLetter(t: string, at_: Pt, prefer: Pt, col: Paint): Placed {
    let best: Placed | null = null, bestS = Infinity;
    for (const r of [0.5, 0.68, 0.9]) for (const d of dirs) {
      const rr = r * Math.min(u, 80) + 22;
      const x = at_[0] + d[0] * rr, y = at_[1] + d[1] * rr;
      const b = padBox(wordsBox(t, x, y, { size: LETTER, weight: 700, align: 'center' }), 4);
      let s = (1 - (d[0] * prefer[0] + d[1] * prefer[1])) * 6 + r * 4;
      if (hitsLines(b, allLines, 2)) s += 60;
      for (const q of placed) { if (boxesOverlap(padBox(b, 4), q.box)) s += 200; else if (boxesOverlap(padBox(b, 22), q.box)) s += 25; }
      if (closedPx.some(P => inside([x, y], P))) s += 30;
      for (const q of pointsPx) if (q !== at_ && q[0] > b.x0 - 8 && q[0] < b.x1 + 8 && q[1] > b.y0 - 8 && q[1] < b.y1 + 8) s += 80;
      if (b.x0 < fr.x || b.x1 > fr.x + fr.w || b.y0 < fr.y || b.y1 > fr.y + fr.h) s += 300;
      if (s < bestS) { bestS = s; best = { t, x, y, box: b, col }; }
    }
    if (bestS >= 60) clashes++;
    placed.push(best!);
    return best!;
  }
  pic.figs.forEach((f, fi) => {
    if (!f.names) return;
    const P = figPx[fi]!, cen: Pt = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
    f.pts.forEach((_, i) => {
      const t = f.names![i];
      if (!t) { names[fi]!.push(null); return; }
      const p = P[i]!;
      let pr: Pt = [p[0] - cen[0], p[1] - cen[1]];
      if (P.length === 2) { const o = P[1 - i]!; pr = [p[0] - o[0], p[1] - o[1]]; }
      const l = Math.hypot(...pr) || 1;
      names[fi]!.push(placeLetter(t, p, [pr[0] / l, pr[1] / l], f.role));
    });
  });
  const dotNames = (pic.dots ?? []).map(d => (d.name ? placeLetter(d.name, px(d.p), [0.6, -0.8], d.role) : null));
  const centerName = pic.center?.name ? placeLetter(pic.center.name, px(pic.center.p), [-0.7, 0.7], 'second') : null;

  // the mirror line's name: near its upper end, beside the line, on the paper
  let mirrorName: Placed | null = null;
  if (mirrorPx && pic.mirror?.name) {
    const [a, b] = mirrorPx[0]![1] < mirrorPx[1]![1] ? [mirrorPx[0]!, mirrorPx[1]!] : [mirrorPx[1]!, mirrorPx[0]!];
    const d: Pt = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d) || 1;
    let bestS = Infinity;
    for (const t of [0.07, 0.14, 0.86, 0.93, 0.25, 0.75]) for (const side of [1, -1]) {
      const n: Pt = [(-d[1] / L) * side, (d[0] / L) * side];
      const sz = wordsBox(pic.mirror.name, 0, 0, { size: LINE_NAME, weight: 700, align: 'center' });
      const off = 18 + Math.abs(n[0]) * sz.w / 2 + Math.abs(n[1]) * sz.h / 2;
      const x = a[0] + d[0] * t + n[0] * off, y = a[1] + d[1] * t + n[1] * off;
      const bx = padBox(wordsBox(pic.mirror.name, x, y, { size: LINE_NAME, weight: 700, align: 'center' }), 4);
      let s = t;
      if (hitsLines(bx, allLines, 2)) s += 60;
      for (const q of placed) if (boxesOverlap(bx, q.box)) s += 200;
      if (bx.x0 < gridBox.x0 || bx.x1 > gridBox.x1 || bx.y0 < gridBox.y0 || bx.y1 > gridBox.y1) s += 300;
      if (s < bestS) { bestS = s; mirrorName = { t: pic.mirror.name, x, y, box: bx, col: 'second' }; }
    }
    if (bestS >= 60) clashes++;
    placed.push(mirrorName!);
  }

  // ---- the margin numbers (even values) and axis names ----
  const ticks: { t: string; x: number; y: number; align: 'center' | 'right' }[] = [];
  if (axes) {
    const stride = u >= 70 ? 1 : 2;
    for (let x = Math.ceil(win.x0); x <= win.x1; x++) if (x % stride === 0 || stride === 1) ticks.push({ t: x < 0 ? `−${-x}` : String(x), x: px([x, 0])[0], y: gridBox.y1 + 34, align: 'center' });
    for (let y = Math.ceil(win.y0) + 1; y <= win.y1; y++) if (y % stride === 0 || stride === 1) ticks.push({ t: y < 0 ? `−${-y}` : String(y), x: gridBox.x0 - 14, y: px([0, y])[1], align: 'right' });
    if (stride === 1 && u < 76) for (let i = ticks.length - 1; i >= 0; i--) { const t = ticks[i]!; const v = Number(t.t.replace('−', '-')); if (v % 2 !== 0) ticks.splice(i, 1); }
  }

  const figBox = (fi: number): Box => { const P = figPx[fi]!; return padBox(box(Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1]))), 8); };
  const ptBox = (p: Pt, r = 12): Box => box(p[0] - r, p[1] - r, p[0] + r, p[1] + r);
  const where = {
    grid: gridBox,
    vertex: (f: number, i: number) => ptBox(figPx[f]![i]!),
    name: (f: number, i: number) => names[f]?.[i]?.box ?? ptBox(figPx[f]![i]!),
    fig: figBox,
    center: pic.center ? ptBox(px(pic.center.p), 16) : gridBox,
    dot: (i: number) => ptBox(px(pic.dots![i]!.p)),
    mirror: (mirrorName as Placed | null)?.box ?? gridBox,
    arrow: pic.arrow ? ptBox(px([(pic.arrow.from[0] + pic.arrow.to[0]) / 2, (pic.arrow.from[1] + pic.arrow.to[1]) / 2])) : gridBox,
    point: (p: V) => ptBox(px(p)),
  };

  // ---------- painters ----------
  function letter(c: Canvas, L: Placed, a: number, col?: Paint): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a);
    g.font = `700 ${LETTER}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 10; g.strokeStyle = 'rgba(20,23,54,0.94)'; g.lineJoin = 'round';
    g.strokeText(L.t, L.x, L.y);
    g.fillStyle = paint(c.th, col ?? L.col, 'text'); g.fillText(L.t, L.x, L.y);
    g.restore();
  }
  function word(c: Canvas, t: string, x: number, y: number, size: number, col: Paint, a: number, align: CanvasTextAlign = 'center'): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a);
    g.font = `600 ${size}px ${SANS}`; g.textAlign = align; g.textBaseline = 'middle';
    g.fillStyle = paint(c.th, col, 'text'); g.fillText(t, x, y);
    g.restore();
  }
  function drawGrid(c: Canvas, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = PAPER;
    g.beginPath(); g.roundRect(gridBox.x0 - 10, gridBox.y0 - 10, gridBox.w + 20, gridBox.h + 20, 14); g.fill();
    if (gridOn) {
      g.strokeStyle = GRID; g.lineWidth = 1.6;
      g.beginPath();
      for (let x = Math.ceil(win.x0); x <= win.x1; x++) { const X = px([x, 0])[0]; g.moveTo(X, gridBox.y0); g.lineTo(X, gridBox.y1); }
      for (let y = Math.ceil(win.y0); y <= win.y1; y++) { const Y = px([0, y])[1]; g.moveTo(gridBox.x0, Y); g.lineTo(gridBox.x1, Y); }
      g.stroke();
    }
    if (axes) {
      g.strokeStyle = AXIS; g.lineWidth = 3;
      g.beginPath();
      if (win.y0 <= 0 && win.y1 >= 0) { const Y = px([0, 0])[1]; g.moveTo(gridBox.x0, Y); g.lineTo(gridBox.x1, Y); }
      if (win.x0 <= 0 && win.x1 >= 0) { const X = px([0, 0])[0]; g.moveTo(X, gridBox.y0); g.lineTo(X, gridBox.y1); }
      g.stroke();
      for (const t of ticks) word(c, t.t, t.x, t.y, TICK, 'faint', 1, t.align);
      if (win.y0 <= 0 && win.y1 >= 0) word(c, 'x', gridBox.x1 + 26, px([0, 0])[1], 46, 'dim', 1);
      if (win.x0 <= 0 && win.x1 >= 0) word(c, 'y', px([0, 0])[0], gridBox.y0 - 32, 46, 'dim', 1);
    }
    g.restore();
  }
  function figure(c: Canvas, fi: number, P: readonly Pt[], k: number, alpha = 1, dashed?: boolean): void {
    if (k <= 0 || alpha <= 0) return;
    const f = pic.figs[fi]!;
    const col = f.role;
    c.g.save(); c.g.globalAlpha *= clamp(alpha);
    if (P.length === 1) { dot(c, P[0]![0], P[0]![1], 11 * E.out(clamp(k * 1.4)), col); c.g.restore(); return; }
    const closed = !f.open && P.length >= 3;
    const kf = E.inOut(clamp((k - 0.4) / 0.6));
    if (closed && (f.fill ?? 0.55) > 0 && kf > 0) wash(c, P, col, { seed: 31 + fi * 7, rough: 1.1, ink: null, alpha: kf * (f.fill ?? 0.55), shade: 0.12 });
    drawOn(c, closed ? [...P, P[0]!] : P, clamp(k / 0.6), { col, lw: f.open ? 6 : 4.5, dash: (dashed ?? f.dash) ? [14, 10] : null });
    for (const p of P) dot(c, p[0], p[1], f.open ? 8 : 6.5, col, kf || clamp(k * 2));
    c.g.restore();
  }
  function orderArrow(c: Canvas, fi: number, k: number, col: Paint): void {
    if (k <= 0) return;
    const f = pic.figs[fi]!, P = figPx[fi]!;
    const o = orient(f.pts);
    if (o === 0 || P.length < 3) return;
    const cg = centroid(f.pts), C = px(cg);
    // radius: well inside the figure (distance from the centroid to the nearest edge)
    let dmin = Infinity;
    for (let i = 0; i < P.length; i++) {
      const a = P[i]!, b = P[(i + 1) % P.length]!, d: Pt = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...d) || 1;
      dmin = Math.min(dmin, Math.abs((C[0] - a[0]) * d[1] - (C[1] - a[1]) * d[0]) / L);
    }
    const r = clamp(dmin * 0.62, 16, 60);
    // start toward vertex 0, sweep 290° in the vertex order (y up on the grid = screen angles reversed)
    const a0 = Math.atan2(P[0]![1] - C[1], P[0]![0] - C[0]);
    const sweep = (-o * 290 * Math.PI) / 180;
    const Q: Pt[] = [];
    for (let j = 0; j <= 40; j++) { const t = a0 + (sweep * j) / 40; Q.push([C[0] + r * Math.cos(t), C[1] + r * Math.sin(t)]); }
    arrow(c, Q, E.inOut(clamp(k)), { col, lw: 5, head: 20 });
  }
  function arc(c: Canvas, C: Pt, r: number, a0: number, a1: number, k: number, col: Paint, lw = 4, head = true): void {
    if (k <= 0) return;
    const Q: Pt[] = [];
    for (let j = 0; j <= 48; j++) { const t = a0 + ((a1 - a0) * j) / 48; Q.push([C[0] + r * Math.cos(t), C[1] - r * Math.sin(t)]); }
    if (head) arrow(c, Q, k, { col, lw, head: 20 }); else drawOn(c, Q, k, { col, lw });
  }

  function draw(c: Canvas, p: Progress<string>, f: GridFocus = {}): void {
    drawGrid(c, p.k('grid'));
    const dimOf = (fi: number) => 1 - 0.6 * Math.max(0, ...(f.dim ?? []).filter(d => d.fig === fi).map(d => d.k));
    // the mirror line (under the figures)
    if (mirrorPx) {
      const k = p.k('mirror');
      if (k > 0) drawOn(c, mirrorPx, k, { col: 'second', lw: 5 });
    }
    (pic.links ?? []).forEach((l, i) => { const k = p.k('l' + i); if (k > 0) drawOn(c, [px(l.a), px(l.b)], k, { col: 'pick', lw: 3.5, dash: [12, 10], alpha: 1 - 0.75 * (f.linkFade ?? 0) }); });
    // rays from a center (focus)
    for (const r of f.rays ?? []) if (r.k > 0) drawOn(c, [px(r.from), px(r.to)], r.k, { col: r.col, lw: 4 });
    pic.figs.forEach((_, fi) => figure(c, fi, figPx[fi]!, p.k('f' + fi), dimOf(fi)));
    // side glows, vertex rings, angle arcs, right-angle marks
    for (const s of f.sides ?? []) {
      if (s.k <= 0) continue;
      const P = figPx[s.fig]!, a = P[s.i]!, b = P[(s.i + 1) % P.length]!;
      drawOn(c, [a, b], s.k, { col: s.col, lw: 9, glow: 10, glowCol: s.col });
    }
    for (const a of f.angles ?? []) {
      if (a.k <= 0) continue;
      const P = figPx[a.fig]!, n = P.length, B = P[a.i]!, A_ = P[(a.i - 1 + n) % n]!, C_ = P[(a.i + 1) % n]!;
      const t1 = Math.atan2(-(A_[1] - B[1]), A_[0] - B[0]);
      let t2 = Math.atan2(-(C_[1] - B[1]), C_[0] - B[0]);
      let d = t2 - t1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; t2 = t1 + d;
      arc(c, B, 40, t1, t2, a.k, a.col, 5, false);
    }
    for (const r of f.right ?? []) {
      if (r.k <= 0) continue;
      const A_ = px(r.at), ua = px(r.a), ub = px(r.b);
      const da: Pt = [ua[0] - A_[0], ua[1] - A_[1]], db: Pt = [ub[0] - A_[0], ub[1] - A_[1]];
      const la = Math.hypot(...da) || 1, lb = Math.hypot(...db) || 1, s = 32;
      const p1: Pt = [A_[0] + (da[0] / la) * s, A_[1] + (da[1] / la) * s], p3: Pt = [A_[0] + (db[0] / lb) * s, A_[1] + (db[1] / lb) * s];
      const p2: Pt = [p1[0] + p3[0] - A_[0], p1[1] + p3[1] - A_[1]];
      drawOn(c, [p1, p2, p3], r.k, { col: r.col, lw: 4 });
    }
    // the motion's marks
    if (pic.arrow) { const k = p.k('arrow'); if (k > 0) arrow(c, [px(pic.arrow.from), px(pic.arrow.to)], k, { col: 'second', lw: 6, head: 26 }); }
    if (pic.turn) {
      const k = p.k('turn');
      if (k > 0) {
        const C = px(pic.turn.c), F = px(pic.turn.from);
        const d = Math.hypot(F[0] - C[0], F[1] - C[1]), r = pic.turn.r === undefined ? clamp(d * 0.5, 34, 3 * u) : d * pic.turn.r;
        const a0 = Math.atan2(-(F[1] - C[1]), F[0] - C[0]);
        arc(c, C, r, a0, a0 + (pic.turn.deg * Math.PI) / 180, k, 'second', 5);
      }
    }
    if (pic.center) {
      const k = p.k('center'), C = px(pic.center.p);
      if (k > 0) {
        c.g.save(); c.g.globalAlpha *= clamp(k);
        strokePts(c, Array.from({ length: 33 }, (_, j) => [C[0] + 17 * Math.cos(j * Math.PI / 16), C[1] + 17 * Math.sin(j * Math.PI / 16)] as Pt), { col: 'second', lw: 3.5 });
        dot(c, C[0], C[1], 8, 'second');
        c.g.restore();
      }
    }
    (pic.dots ?? []).forEach((d, i) => {
      const k = p.k('d' + i);
      if (k <= 0) return;
      const Pp = px(d.p);
      dot(c, Pp[0], Pp[1], 15 * E.out(clamp(k * 1.3)), d.role);
      dot(c, Pp[0], Pp[1], 5, '#161A36', clamp(k * 1.3));
    });
    // the tracing paper
    if (pic.ghost) {
      const kg = p.k('ghost');
      if (kg > 0) {
        const g = pic.ghost, fs = pic.figs[g.fig]!, km = p.k('move');
        const Q = fs.pts.map(q => px(at(g.m, q, E.inOut(clamp(km)))));
        c.g.save(); c.g.globalAlpha *= clamp(kg);
        if (Q.length >= 3 && !fs.open) wash(c, Q, 'pick', { seed: 91, rough: 0.8, ink: null, alpha: 0.32, shade: 0 });
        strokePts(c, Q.length >= 3 && !fs.open ? [...Q, Q[0]!] : Q, { col: 'pick', lw: 4, dash: [14, 9] });
        for (const q of Q) dot(c, q[0], q[1], 6, 'pick');
        c.g.restore();
      }
    }
    for (const r of f.rings ?? []) {
      if (r.k <= 0) continue;
      const P = px(r.p);
      strokePts(c, Array.from({ length: 33 }, (_, j) => [P[0] + 26 * Math.cos(j * Math.PI / 16), P[1] + 26 * Math.sin(j * Math.PI / 16)] as Pt), { col: r.col, lw: 6, alpha: r.k, glow: 10, glowCol: r.col });
    }
    for (const v of f.verts ?? []) {
      if (v.k <= 0) continue;
      const P = figPx[v.fig]![v.i]!;
      strokePts(c, Array.from({ length: 33 }, (_, j) => [P[0] + 20 * Math.cos(j * Math.PI / 16), P[1] + 20 * Math.sin(j * Math.PI / 16)] as Pt), { col: v.col, lw: 4.5, alpha: v.k });
    }
    for (const o of f.order ?? []) orderArrow(c, o.fig, o.k, o.col);
    // letters last, always on top
    names.forEach((row, fi) => row.forEach(L => { if (L) letter(c, L, p.k('n' + fi) * dimOf(fi)); }));
    dotNames.forEach((L, i) => { if (L) letter(c, L, p.k('d' + i)); });
    if (centerName) letter(c, centerName, p.k('center'));
    if (mirrorName) {
      const L = mirrorName as Placed, k = p.k('mirror');
      if (k > 0) {
        c.g.save(); c.g.globalAlpha *= clamp(k); c.g.fillStyle = PAPER;
        c.g.beginPath(); c.g.roundRect(L.box.x0 - 4, L.box.y0 - 2, L.box.w + 8, L.box.h + 4, 8); c.g.fill(); c.g.restore();
        word(c, L.t, L.x, L.y, LINE_NAME, 'second', k);
      }
    }
  }

  return { kind: 'MotionGrid', pic, box: padBox(gridBox, 70), u, win, clashes, px, where, draw };
}
