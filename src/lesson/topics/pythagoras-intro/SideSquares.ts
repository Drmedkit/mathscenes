// SideSquares: the model of the Pythagorean relation. A triangle (any pose, on grid paper or not) with a square built
// outward on each side; the area of the square on a side is that side squared. For a right triangle the two leg
// squares together cover exactly the square on the hypotenuse, and you can SEE it: the square on the hypotenuse is
// tilted, so its area is found by surround-and-subtract (the upright square around it minus four corner triangles).
//
// Sides are named by role: a = R–A and b = R–B are the legs (they make the angle at R), c = A–B is the side across
// from R (the hypotenuse when R is a right angle). Colour roles: a amber (first), b teal (second), c lime (link),
// the corner triangles of surround-and-subtract lavender (pick), the right-angle mark cream with a pick glow.
//
// Steps: grid, tri, mark, labels, sqa, sqb, sqc (a square grows out of its side), outc (only the outline of the
//        c-square, dashed), areaa, areab, areac (area labels), surround (the upright square around the c-square),
//        corners (its four corner triangles), lift (the corners fade out of the surround), swap (side labels change
//        to labelsB), verts (vertex letters).
// Pure maths in pythag.ts; the layout fits everything named in params into the frame and throws (BlockError) when a
// label would not fit inside its square, so the page falls back to a plainer picture instead of drawing a cramped one.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Role, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { sideLen2, squareOn } from './pythag';

export type SideId = 'a' | 'b' | 'c';
export const SIDES: readonly SideId[] = ['a', 'b', 'c'];
export type SideStep = 'grid' | 'tri' | 'mark' | 'labels' | 'sqa' | 'sqb' | 'sqc' | 'outc' | 'areaa' | 'areab' | 'areac'
  | 'surround' | 'corners' | 'lift' | 'swap' | 'verts';
export const SIDE_STEPS: readonly SideStep[] = ['grid', 'tri', 'mark', 'labels', 'sqa', 'sqb', 'sqc', 'outc', 'areaa', 'areab', 'areac', 'surround', 'corners', 'lift', 'swap', 'verts'];

export interface SideSquaresParams {
  /** [R, A, B] in grid units, y up. Side a = R–A, b = R–B, c = A–B. */
  pts: readonly [Pt, Pt, Pt];
  /** draw the right-angle mark at R */
  right?: boolean;
  /** grid paper behind the figure (whole-number vertices) */
  grid?: boolean;
  /** the squares that are part of the layout (steps sqa / sqb / sqc draw them) */
  squares?: readonly SideId[];
  /** the upright square around the c-square is part of the layout (steps surround / corners / lift) */
  surround?: boolean;
  /** TeX side labels (next to the side, outside the triangle) */
  labels?: Partial<Record<SideId, string>>;
  /** TeX labels the side labels turn into at step swap */
  labelsB?: Partial<Record<SideId, string>>;
  /** TeX area labels in the middle of the squares */
  areas?: Partial<Record<SideId, string>>;
  /** TeX label of each corner triangle of the surround */
  corner?: string;
  /** vertex letters at R, A, B */
  verts?: readonly [string, string, string];
  /** largest grid unit in px */
  maxUnit?: number;
  roles?: Partial<Record<SideId, Role>>;
}
export interface SideFocus {
  /** glow pulses (0..1) on a side, a square or the right angle */
  glow?: Partial<Record<SideId | 'R' | 'sqa' | 'sqb' | 'sqc' | 'corners', number>>;
  /** 0..1: a side's label is hidden (the kid has to find it) */
  hide?: Partial<Record<SideId, number>>;
}
export interface SideSquaresBlock {
  readonly kind: 'SideSquares';
  /** px per grid unit */
  readonly u: number;
  readonly where: {
    tri: Box; R: Box; all: Box;
    side(s: SideId): Box;
    /** the side's label box */
    label(s: SideId): Box;
    square(s: SideId): Box;
    surround: Box;
  };
  /** screen position of a point given in grid units */
  at(p: Pt): Pt;
  draw(c: Canvas, P: Progress<SideStep>, f?: SideFocus): void;
}

const NAME = 'SideSquares', LABEL = 64, AREA = 66, CORNER = 60, VERT = 56, PAD = 26;
const TRI = '#4A4580', GRIDBG = '#1B1F42';
const ROLE: Record<SideId, Role> = { a: 'first', b: 'second', c: 'link' };

export function SideSquares(p: SideSquaresParams, fr: Frame, th: Theme): SideSquaresBlock {
  const [R, A, B] = p.pts;
  const ends: Record<SideId, [Pt, Pt, Pt]> = { a: [R, A, B], b: [R, B, A], c: [A, B, R] };   // [p, q, opposite]
  const roles = { ...ROLE, ...(p.roles ?? {}) };
  const sqIn = new Set(p.squares ?? []);
  check(Math.abs((A[0] - R[0]) * (B[1] - R[1]) - (A[1] - R[1]) * (B[0] - R[0])) > 1e-6, NAME, 'the three points lie on one line');
  const sqU: Record<SideId, [Pt, Pt, Pt, Pt]> = { a: squareOn(R, A, B), b: squareOn(R, B, A), c: squareOn(A, B, R) };
  const cxs = sqU.c.map(q => q[0]), cys = sqU.c.map(q => q[1]);
  const sur = { x0: Math.min(...cxs), y0: Math.min(...cys), x1: Math.max(...cxs), y1: Math.max(...cys) };
  if (p.surround) check(sqIn.has('c'), NAME, 'a surround needs the c-square');
  // the four corner triangles of the surround (between the tilted c-square and its upright box)
  const cornersU: [Pt, Pt, Pt][] = p.surround ? sqU.c.map((v, i) => {
    const w = sqU.c[(i + 1) % 4]!;
    // the box corner that sees side v-w: same x as one end, same y as the other, outside the square
    const k1: Pt = [v[0], w[1]], k2: Pt = [w[0], v[1]];
    const out = (k: Pt) => k[0] >= sur.x0 - 1e-9 && k[0] <= sur.x1 + 1e-9 && k[1] >= sur.y0 - 1e-9 && k[1] <= sur.y1 + 1e-9;
    const mid: Pt = [(sqU.c[0][0] + sqU.c[2][0]) / 2, (sqU.c[0][1] + sqU.c[2][1]) / 2];
    const far = (k: Pt) => Math.hypot(k[0] - mid[0], k[1] - mid[1]);
    const k = [k1, k2].filter(out).sort((x, y) => far(y) - far(x))[0]!;
    return [v, w, k] as [Pt, Pt, Pt];
  }) : [];

  // ---------- fit: the unit size so that everything in the layout (and every label) is inside the frame ----------
  const contentU: Pt[] = [R, A, B, ...SIDES.filter(s => sqIn.has(s)).flatMap(s => sqU[s])];
  if (p.surround) contentU.push([sur.x0, sur.y0], [sur.x1, sur.y1]);
  const ux0 = Math.min(...contentU.map(q => q[0])), ux1 = Math.max(...contentU.map(q => q[0]));
  const uy0 = Math.min(...contentU.map(q => q[1])), uy1 = Math.max(...contentU.map(q => q[1]));
  const F = (s: string | undefined) => (s ? (tex(s) as Formula) : null);
  const FL = { a: F(p.labels?.a), b: F(p.labels?.b), c: F(p.labels?.c) };
  const FL2 = { a: F(p.labelsB?.a), b: F(p.labelsB?.b), c: F(p.labelsB?.c) };
  const FA = { a: F(p.areas?.a), b: F(p.areas?.b), c: F(p.areas?.c) };
  const FC = F(p.corner);
  const FV = p.verts ? p.verts.map(v => tex(v) as Formula) : null;
  let u = p.maxUnit ?? 90;
  let ox = 0, oy = 0;
  const at = (q: Pt): Pt => [ox + q[0] * u, oy - q[1] * u];
  const fb = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  /** a leg whose square is in the layout carries its label INSIDE the triangle (when it fits there), so the label
   *  never shares the square with its area */
  const inward: Record<SideId, boolean> = { a: false, b: false, c: false };
  /** the label of a side: on the side's outward normal (or inward, see above), clear of the side by PAD */
  const labelBox = (s: SideId, Fm: Formula | null): Box | null => {
    if (!Fm) return null;
    const [P0, Q0, O] = ends[s];
    const P1 = at(P0), Q1 = at(Q0), O1 = at(O);
    const mx = (P1[0] + Q1[0]) / 2, my = (P1[1] + Q1[1]) / 2;
    let nx = -(Q1[1] - P1[1]), ny = Q1[0] - P1[0];
    const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    if ((O1[0] - mx) * nx + (O1[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    if (inward[s]) { nx = -nx; ny = -ny; }
    const b0 = texBox(Fm, 0, 0, { size: LABEL, align: 'center' });
    const d = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2 + PAD;
    const cx = mx + nx * d, cy = my + ny * d;
    return box(cx - b0.w / 2, cy - b0.h / 2, cx + b0.w / 2, cy + b0.h / 2);
  };
  const sqPx = (s: SideId) => sqU[s].map(at);
  const centreOf = (P: Pt[]): Pt => [P.reduce((t, q) => t + q[0], 0) / P.length, P.reduce((t, q) => t + q[1], 0) / P.length];
  const areaBox = (s: SideId): Box | null => {
    const Fm = FA[s];
    if (!Fm) return null;
    const [cx, cy] = centreOf(sqPx(s));
    const b0 = texBox(Fm, cx, cy, { size: AREA, align: 'center' });
    return box(b0.x0, cy - b0.h / 2, b0.x1, cy + b0.h / 2);
  };
  const vertBox = (i: number): Box | null => {
    if (!FV) return null;
    const P = [R, A, B].map(at), g = centreOf(P), v = P[i]!;
    let dx = v[0] - g[0], dy = v[1] - g[1];
    const l = Math.hypot(dx, dy); dx /= l; dy /= l;
    const b0 = texBox(FV[i]!, 0, 0, { size: VERT, align: 'center' });
    const cx = v[0] + dx * (b0.w / 2 + 22), cy = v[1] + dy * (b0.h / 2 + 22);
    return box(cx - b0.w / 2, cy - b0.h / 2, cx + b0.w / 2, cy + b0.h / 2);
  };
  const inside = (b: Box, P: Pt[], pad: number): boolean => {
    // b inside the convex polygon P (any orientation), with a margin of pad px
    for (let i = 0; i < P.length; i++) {
      const p0 = P[i]!, p1 = P[(i + 1) % P.length]!;
      let nx = -(p1[1] - p0[1]), ny = p1[0] - p0[0];
      const l = Math.hypot(nx, ny); nx /= l; ny /= l;
      const [gx, gy] = centreOf(P);
      if ((gx - p0[0]) * nx + (gy - p0[1]) * ny < 0) { nx = -nx; ny = -ny; }
      for (const [x, y] of [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]] as const) if ((x - p0[0]) * nx + (y - p0[1]) * ny < pad) return false;
    }
    return true;
  };
  const over = (x: Box, y: Box) => x.x0 < y.x1 + 8 && y.x0 < x.x1 + 8 && x.y0 < y.y1 + 8 && y.y0 < x.y1 + 8;
  // shrink only while something sticks out of the frame; a label that does not fit its square is an error at once
  // (a smaller drawing would only make the square smaller)
  let why = '';
  for (let it = 0; it < 40; it++) {
    u = Math.min(u, (fr.w - 40) / (ux1 - ux0), (fr.h - 40) / (uy1 - uy0));
    ox = fr.x + fr.w / 2 - ((ux0 + ux1) / 2) * u; oy = fr.y + fr.h / 2 + ((uy0 + uy1) / 2) * u;
    const triPx = [R, A, B].map(at);
    for (const s of ['a', 'b'] as const) {
      inward[s] = false;
      if (!sqIn.has(s) || !(FL[s] || FL2[s])) continue;
      inward[s] = true;
      const ok = [FL[s], FL2[s]].every(Fm => { const b = labelBox(s, Fm); return !b || inside(b, triPx, 4); });
      if (!ok) inward[s] = false;
    }
    if (inward.a && inward.b) {
      const la = [FL.a, FL2.a].map(Fm => labelBox('a', Fm)).filter((b): b is Box => !!b), lb = [FL.b, FL2.b].map(Fm => labelBox('b', Fm)).filter((b): b is Box => !!b);
      if (la.some(x => lb.some(y => over(x, y)))) inward.b = false;
    }
    const boxes: Box[] = [];
    why = '';
    for (const s of SIDES) for (const Fm of [FL[s], FL2[s]]) {
      const b = labelBox(s, Fm);
      if (!b) continue;
      boxes.push(b);
      if (sqIn.has(s) && !inward[s] && !inside(b, sqPx(s), 6)) why ||= `the ${s} label does not fit inside its square (u = ${u.toFixed(1)})`;
    }
    for (const s of SIDES) {
      const b = areaBox(s);
      if (!b) continue;
      boxes.push(b);
      if (!inside(b, sqPx(s), 10)) why ||= `the ${s}-square area label does not fit (u = ${u.toFixed(1)})`;
      for (const Fm of [FL[s], FL2[s]]) { const lb = labelBox(s, Fm); if (lb && over(lb, b)) why ||= `the ${s} side and area labels collide (u = ${u.toFixed(1)})`; }
    }
    check(!why, NAME, why);
    for (let i = 0; i < 3; i++) { const b = vertBox(i); if (b) boxes.push(b); }
    const all = boxes.length ? unionBox(boxes) : null;
    if (!all || (all.x0 >= fb.x0 && all.x1 <= fb.x1 && all.y0 >= fb.y0 && all.y1 <= fb.y1)) break;
    why = 'labels outside the frame';
    u *= 0.95;
    check(u >= 14, NAME, why);
  }
  // labels never sit on a line: side label boxes clear of the triangle's sides
  const T = [R, A, B].map(at);
  const triB = unionBox([box(T[0]![0], T[0]![1], T[0]![0], T[0]![1]), box(T[1]![0], T[1]![1], T[1]![0], T[1]![1]), box(T[2]![0], T[2]![1], T[2]![0], T[2]![1])]);
  const corPx = cornersU.map(t => t.map(at) as [Pt, Pt, Pt]);
  if (FC) for (const t of corPx) {
    const [gx, gy] = centreOf(t), b0 = texBox(FC, gx, gy, { size: CORNER, align: 'center' });
    check(inside(box(b0.x0, gy - b0.h / 2, b0.x1, gy + b0.h / 2), t, 4), NAME, 'the corner label does not fit its triangle');
  }

  // ---------- painters ----------
  function gridPaper(c: Canvas, k: number): void {
    if (k <= 0 || !p.grid) return;
    const pad = 0.6;
    const gx0 = Math.floor(ux0 - pad), gx1 = Math.ceil(ux1 + pad), gy0 = Math.floor(uy0 - pad), gy1 = Math.ceil(uy1 + pad);
    const [X0, Y1] = at([gx0, gy0]), [X1, Y0] = at([gx1, gy1]);
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = GRIDBG; g.beginPath(); g.roundRect(X0, Y0, X1 - X0, Y1 - Y0, 18); g.fill();
    g.strokeStyle = 'rgba(160,166,214,0.22)'; g.lineWidth = 1.5;
    g.beginPath();
    for (let x = gx0; x <= gx1; x++) { const X = at([x, 0])[0]; g.moveTo(X, Y0); g.lineTo(X, Y1); }
    for (let y = gy0; y <= gy1; y++) { const Y = at([0, y])[1]; g.moveTo(X0, Y); g.lineTo(X1, Y); }
    g.stroke(); g.restore();
  }
  function glowPoly(c: Canvas, P: Pt[], col: Role, k: number, closed = true): void {
    if (k <= 0) return;
    strokePts(c, P, { col, lw: 7, closed, alpha: clamp(k), glow: 18, glowCol: col });
  }
  function square(c: Canvas, s: SideId, k: number, seed: number): void {
    if (k <= 0) return;
    const [p0, p1, q1, q0] = sqPx(s) as [Pt, Pt, Pt, Pt];
    const kk = E.smooth(clamp(k));
    const Q1: Pt = [lerp(p1[0], q1[0], kk), lerp(p1[1], q1[1], kk)], Q0: Pt = [lerp(p0[0], q0[0], kk), lerp(p0[1], q0[1], kk)];
    wash(c, [p0, p1, Q1, Q0], paint(th, roles[s], 'fill'), { seed, inkW: 3, rough: 1.2, shade: 0.25, alpha: 0.92 * Math.min(1, k * 3) });
  }
  function label(c: Canvas, s: SideId, Fm: Formula | null, a: number, onWash: number): void {
    if (!Fm || a <= 0) return;
    const b = labelBox(s, Fm)!;
    const dark = clamp(onWash);
    if (dark < 1) texDraw(c, Fm, b.cx, b.cy, { size: LABEL, align: 'center', col: roles[s], alpha: a * (1 - dark) });
    if (dark > 0) texDraw(c, Fm, b.cx, b.cy, { size: LABEL, align: 'center', col: '#141633', alpha: a * dark });
  }
  function rightMark(c: Canvas, k: number, glowK: number): void {
    if (k <= 0) return;
    const r = at(R), pa = at(A), pb = at(B);
    const la = Math.hypot(pa[0] - r[0], pa[1] - r[1]), lb = Math.hypot(pb[0] - r[0], pb[1] - r[1]);
    const m = Math.min(34, 0.28 * Math.min(la, lb));
    const ua: Pt = [(pa[0] - r[0]) / la * m, (pa[1] - r[1]) / la * m], ub: Pt = [(pb[0] - r[0]) / lb * m, (pb[1] - r[1]) / lb * m];
    const P: Pt[] = [[r[0] + ua[0], r[1] + ua[1]], [r[0] + ua[0] + ub[0], r[1] + ua[1] + ub[1]], [r[0] + ub[0], r[1] + ub[1]]];
    if (glowK > 0) strokePts(c, P, { col: 'pick', lw: 8, alpha: clamp(glowK), glow: 20, glowCol: 'pick' });
    drawOn(c, P, clamp(k), { col: DUSK.cream, lw: 3.5 });
  }

  function draw(c: Canvas, P: Progress<SideStep>, f: SideFocus = {}): void {
    const gl = f.glow ?? {};
    gridPaper(c, P.k('grid'));
    const kT = clamp(P.k('tri'));
    // the surround (behind the squares)
    const kSur = clamp(P.k('surround')), kCor = clamp(P.k('corners')), kLift = clamp(P.k('lift'));
    if (p.surround && kSur > 0) {
      const [X0, Y0] = at([sur.x0, sur.y1]), [X1, Y1] = at([sur.x1, sur.y0]);
      drawOn(c, [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]], kSur, { col: 'pick', lw: 4, closed: true, dash: [14, 10] });
    }
    // squares
    for (const s of SIDES) if (sqIn.has(s)) square(c, s, P.k(`sq${s}` as SideStep), s === 'a' ? 101 : s === 'b' ? 131 : 161);
    if (sqIn.has('c')) { const k = clamp(P.k('outc')); if (k > 0) drawOn(c, sqPx('c'), k, { col: 'link', lw: 4, closed: true, dash: [12, 9] }); }
    for (const s of SIDES) { const g = gl[`sq${s}` as 'sqa'] ?? 0; if (g > 0 && sqIn.has(s)) glowPoly(c, sqPx(s), roles[s], g); }
    // the triangle
    if (kT > 0) withAlpha(c, kT, () => {
      wash(c, T, TRI, { seed: 7, inkW: 3, rough: 1.1, shade: 0.3 });
      for (const s of SIDES) {
        const [p0, q0] = ends[s];
        const g = gl[s] ?? 0;
        if (g > 0) glowPoly(c, [at(p0), at(q0)], roles[s], g, false);
        inkLine(c, [at(p0), at(q0)], { col: paint(th, roles[s], 'fill'), w: 6, seed: 20 + SIDES.indexOf(s), rough: 0.6 });
      }
    });
    // the corner triangles of surround-and-subtract lie over the triangle (it IS one of them), under the mark
    if (p.surround && kCor > 0) corPx.forEach((t, i) => {
      const a = E.smooth(clamp(kCor * 1.6 - i * 0.2)) * (1 - 0.82 * kLift);
      if (a <= 0) return;
      const [gx, gy] = centreOf(t);
      const dx = (gx - at([(sur.x0 + sur.x1) / 2, 0])[0]) * 0.12 * kLift, dy = (gy - at([0, (sur.y0 + sur.y1) / 2])[1]) * 0.12 * kLift;
      const T2 = t.map(([x, y]) => [x + dx, y + dy] as Pt);
      wash(c, T2, paint(th, 'pick', 'fill'), { seed: 300 + i, inkW: 2.5, rough: 1, alpha: a * 0.9, shade: 0.2 });
      if (FC) texDraw(c, FC, gx + dx, gy + dy, { size: CORNER, align: 'center', col: '#141633', alpha: a });
      if ((gl.corners ?? 0) > 0) glowPoly(c, T2, 'pick', gl.corners!);
    });
    if (p.right !== false && triRight()) rightMark(c, P.k('mark'), gl.R ?? 0);
    // area labels
    for (const s of SIDES) { const Fm = FA[s], k = clamp(P.k(`area${s}` as SideStep)); if (Fm && k > 0) { const b = areaBox(s)!; texDraw(c, Fm, b.cx, b.cy, { size: AREA, align: 'center', col: '#141633', k }); } }
    // side labels: on the wall in their role colour, dark once their square is under them
    const kL = clamp(P.k('labels')), kS = clamp(P.k('swap'));
    for (const s of SIDES) {
      const hide = 1 - clamp(f.hide?.[s] ?? 0);
      const onWash = sqIn.has(s) && !inward[s] ? clamp(P.k(`sq${s}` as SideStep) * 1.4 - 0.2) : 0;
      label(c, s, FL[s], kL * (FL2[s] ? 1 - kS : 1) * hide, onWash);
      label(c, s, FL2[s], kS * hide, onWash);
    }
    // vertex letters
    const kV = clamp(P.k('verts'));
    if (FV && kV > 0) for (let i = 0; i < 3; i++) { const b = vertBox(i)!; texDraw(c, FV[i]!, b.cx, b.cy, { size: VERT, align: 'center', col: 'ink', alpha: kV }); }
  }
  function triRight(): boolean {
    const ax = A[0] - R[0], ay = A[1] - R[1], bx = B[0] - R[0], by = B[1] - R[1];
    return Math.abs(ax * bx + ay * by) < 1e-9 * (1 + sideLen2(R, A) + sideLen2(R, B));
  }
  const R1 = at(R);
  const sideBox = (s: SideId) => { const [p0, q0] = ends[s]; const P0 = at(p0), Q0 = at(q0); return box(Math.min(P0[0], Q0[0]), Math.min(P0[1], Q0[1]), Math.max(P0[0], Q0[0]), Math.max(P0[1], Q0[1])); };
  const polyBox = (Pp: Pt[]) => box(Math.min(...Pp.map(q => q[0])), Math.min(...Pp.map(q => q[1])), Math.max(...Pp.map(q => q[0])), Math.max(...Pp.map(q => q[1])));
  const allBoxes = [triB, ...SIDES.filter(s => sqIn.has(s)).map(s => polyBox(sqPx(s)))];
  return {
    kind: 'SideSquares', u, at,
    where: {
      tri: triB, R: box(R1[0] - 20, R1[1] - 20, R1[0] + 20, R1[1] + 20), all: unionBox(allBoxes),
      side: sideBox,
      label: s => labelBox(s, FL[s]) ?? sideBox(s),
      square: s => polyBox(sqPx(s)),
      surround: p.surround ? polyBox([at([sur.x0, sur.y0]), at([sur.x1, sur.y1])]) : box(0, 0, 0, 0),
    },
    draw,
  };
}
