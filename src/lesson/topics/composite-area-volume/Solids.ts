// Solids: the 3-D model block of "composite area, volume and surface area". Composite solids drawn as glass bodies
// in an orthographic view (the camera of the cross-sections topic): faces tinted in their role colour, hidden edges
// dashed, visible edges in cream. A body is
//   boxes    a union of axis-aligned boxes minus cut boxes (stepped solids, a notch, a tunnel, a cavity, cubes in a
//            row); its faces and edges come from the exposed-face inventory of measure.ts, so a seam between two
//            glued boxes is never drawn as an edge (it is not one) unless `seams` asks for the cell outlines
//   prism    a right prism: a polygon base in the plane of two axes, extruded along the third (triangle, trapezoid,
//            house pentagon), lying on any side
//   pyramid  a polygon base and an apex                cyl  a right circular cylinder (upright)
// Bodies pull apart (`off` x progress 'explode' or their own key), glow faces mark contact regions and chosen faces,
// dashed measure lines show heights (with a right-angle mark), labels are words placed beside an edge, off every line
// and off the solid (the block throws when one has no readable place).
//   roles: first (amber) = the solid / piece A, second (teal) = piece B, pick (lavender) = contact faces / focus,
//          link (lime) = the answer, wrong = a removed part shown as wrong; ghost bodies are dashed outlines only.
import { type Box, type Pt, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, fillPts, strokePts, withAlpha, pathOf } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, mix, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { type Cam, camBasis, proj } from '../cross-sections/sliceMaths';
import { type BoxSpec, type P2, type V3, exposedFaces, gridOf, EPS } from './measure';

export type Role = 'first' | 'second' | 'link' | 'pick' | 'wrong';
interface BodyBase {
  role: Role;
  /** where the body moves when it is pulled out (world units) */ off?: V3;
  /** the progress key that moves it (default 'explode') */ offKey?: string;
  /** the progress key that shows it (default 'solid') */ show?: string;
  /** dashed outline only (a removed part, a container to compare with) */ ghost?: boolean;
  /** outline every exposed cell face (unit cubes) */ seams?: boolean;
}
export type Body =
  | (BodyBase & { kind: 'boxes'; add: BoxSpec[]; cut?: BoxSpec[] })
  | (BodyBase & { kind: 'prism'; axis: 0 | 1 | 2; base: P2[]; at: number; len: number })
  | (BodyBase & { kind: 'pyramid'; base: V3[]; apex: V3 })
  | (BodyBase & { kind: 'cyl'; c: V3; r: number; h: number });
export interface Glow { pts: V3[]; body?: number; col?: Role; key: string }
export interface Measure { a: V3; b: V3; body?: number; col?: Role; key: string; /** right-angle mark at b, along this direction */ right?: V3 }
export interface Label {
  text: string; a: V3; b: V3; body?: number; col?: Role;
  /** progress key (default 'dims') */ key?: string;
  /** placed with the bodies at rest or pulled apart; shown only in that state */ state?: 'rest' | 'open';
  /** may sit inside the solid's outline (still off every line) */ inside?: boolean;
  size?: number;
  /** dropped (not drawn) when it has no readable place: its number is also in the prompt */ optional?: boolean;
}
export interface SolidsParams { bodies: Body[]; glows?: Glow[]; measures?: Measure[]; labels?: Label[]; cam?: Cam; maxScale?: number; margin?: [number, number] }
export interface SolidsBlock {
  readonly kind: 'Solids';
  readonly box: Box;
  readonly scale: number;
  readonly where: {
    /** a world point on screen; with a body index it follows that body's pull-out (k = 0 rest, 1 out) */
    at(v: V3, body?: number, k?: number): Pt;
    body(i: number, k?: number): Box;
    glow(i: number, k?: number): Box;
    label(i: number): Box;
    all: Box;
  };
  draw(c: Canvas, p: Progress<string>): void;
}

const NAME = 'Solids';
const LABEL = 48;
const LIGHT: V3 = (() => { const v: V3 = [-0.45, -0.55, 1]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; })();
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit3 = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

interface MFace { pts: V3[]; n: V3; cell?: boolean }
interface MEdge { a: V3; b: V3; front: boolean }
interface Mesh { faces: MFace[]; edges: MEdge[]; cyl?: { c: V3; r: number; h: number }; pts: V3[] }

/** a point in 3-D from an axis value and two coordinates in the other two axes (in order) */
function lift(axis: 0 | 1 | 2, a: number, u: number, v: number): V3 {
  const p: number[] = [0, 0, 0]; const o = [0, 1, 2].filter(x => x !== axis);
  p[axis] = a; p[o[0]!] = u; p[o[1]!] = v; return p as V3;
}

function meshOf(b: Body, C: V3): Mesh {
  const front = (n: V3) => dot3(n, C) > 1e-6;
  if (b.kind === 'boxes') {
    const add = b.add, cut = b.cut ?? [];
    const cells = exposedFaces(add, cut);
    const faces: MFace[] = cells.map(f => {
      const o = [0, 1, 2].filter(x => x !== f.axis) as [number, number];
      const q = (u: number, v: number): V3 => { const p: number[] = [0, 0, 0]; p[f.axis] = f.at; p[o[0]] = u; p[o[1]] = v; return p as V3; };
      const n: number[] = [0, 0, 0]; n[f.axis] = f.dir;
      return { pts: [q(f.lo[0], f.lo[1]), q(f.hi[0], f.lo[1]), q(f.hi[0], f.hi[1]), q(f.lo[0], f.hi[1])], n: n as V3, cell: true };
    });
    // creases: a grid edge is a real edge when the four cells around it are not flat (1 or 3 filled, or 2 diagonal)
    const G = gridOf(add, cut);
    const edges: MEdge[] = [];
    for (const a of [0, 1, 2] as const) {
      const [o0, o1] = [0, 1, 2].filter(x => x !== a) as [number, number];
      for (let p = 0; p <= G.n[o0]!; p++) for (let q = 0; q <= G.n[o1]!; q++) {
        let run: { s0: number; s1: number; front: boolean } | null = null;
        const flush = () => { if (run) { edges.push({ a: lift3(a, o0, o1, G.xs[a]![run.s0]!, G.xs[o0]![p]!, G.xs[o1]![q]!), b: lift3(a, o0, o1, G.xs[a]![run.s1]!, G.xs[o0]![p]!, G.xs[o1]![q]!), front: run.front }); run = null; } };
        for (let s = 0; s < G.n[a]; s++) {
          const cell = (dp: number, dq: number) => { const idx = [0, 0, 0]; idx[a] = s; idx[o0] = p + dp; idx[o1] = q + dq; return G.filled(idx[0]!, idx[1]!, idx[2]!); };
          const f = [cell(-1, -1), cell(0, -1), cell(-1, 0), cell(0, 0)];
          const cnt = f.filter(Boolean).length;
          const crease = cnt === 1 || cnt === 3 || (cnt === 2 && f[0] === f[3]);
          if (!crease) { flush(); continue; }
          // the exposed faces along this edge and their normals
          const ns: V3[] = [];
          const nAx = (ax: number, d: number): V3 => { const n = [0, 0, 0]; n[ax] = d; return n as V3; };
          if (f[0] !== f[1]) ns.push(nAx(o0, f[0] ? 1 : -1));
          if (f[2] !== f[3]) ns.push(nAx(o0, f[2] ? 1 : -1));
          if (f[0] !== f[2]) ns.push(nAx(o1, f[0] ? 1 : -1));
          if (f[1] !== f[3]) ns.push(nAx(o1, f[1] ? 1 : -1));
          const fr = ns.some(front);
          if (run && run.front === fr && run.s1 === s) run.s1 = s + 1;
          else { flush(); run = { s0: s, s1: s + 1, front: fr }; }
        }
        flush();
      }
    }
    return { faces, edges, pts: faces.flatMap(f => f.pts) };
  }
  if (b.kind === 'cyl') {
    const N = 64, faces: MFace[] = [];
    const ring = (z: number) => Array.from({ length: N }, (_, i) => { const t = (i / N) * Math.PI * 2; return [b.c[0] + b.r * Math.cos(t), b.c[1] + b.r * Math.sin(t), b.c[2] + z] as V3; });
    const lo = ring(0), hi = ring(b.h);
    faces.push({ pts: hi, n: [0, 0, 1] }, { pts: lo.slice().reverse(), n: [0, 0, -1] });
    for (let i = 0; i < N; i++) { const t = ((i + 0.5) / N) * Math.PI * 2; faces.push({ pts: [lo[i]!, lo[(i + 1) % N]!, hi[(i + 1) % N]!, hi[i]!], n: [Math.cos(t), Math.sin(t), 0] }); }
    return { faces, edges: [], cyl: { c: b.c, r: b.r, h: b.h }, pts: [...lo, ...hi] };
  }
  let faces: MFace[];
  if (b.kind === 'prism') {
    let P = b.base.slice();
    let s = 0; for (let i = 0; i < P.length; i++) { const p = P[i]!, q = P[(i + 1) % P.length]!; s += p[0] * q[1] - q[0] * p[1]; }
    if (s < 0) P = P.reverse();
    const A = (a: number, p: P2) => lift(b.axis, a, p[0], p[1]);
    const nA = (d: number): V3 => lift(b.axis, d, 0, 0);
    faces = [{ pts: P.map(p => A(b.at, p)), n: nA(-1) }, { pts: P.map(p => A(b.at + b.len, p)), n: nA(1) }];
    for (let i = 0; i < P.length; i++) {
      const p = P[i]!, q = P[(i + 1) % P.length]!, dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1;
      faces.push({ pts: [A(b.at, p), A(b.at, q), A(b.at + b.len, q), A(b.at + b.len, p)], n: lift(b.axis, 0, dy / l, -dx / l) });
    }
  } else {
    const cen = mul3(add3(b.base.reduce((x, y) => add3(x, y), [0, 0, 0] as V3), b.apex), 1 / (b.base.length + 1));
    const orient = (pts: V3[]): MFace => {
      let n = unit3(cross3(sub3(pts[1]!, pts[0]!), sub3(pts[2]!, pts[0]!)));
      const fc = mul3(pts.reduce((x, y) => add3(x, y), [0, 0, 0] as V3), 1 / pts.length);
      if (dot3(n, sub3(fc, cen)) < 0) n = mul3(n, -1);
      return { pts, n };
    };
    faces = [orient(b.base.slice())];
    for (let i = 0; i < b.base.length; i++) faces.push(orient([b.base[i]!, b.base[(i + 1) % b.base.length]!, b.apex]));
  }
  // edges: every polygon side, with the faces that share it
  const key = (p: V3) => p.map(x => Math.round(x * 1e6)).join(',');
  const m = new Map<string, { a: V3; b: V3; ns: V3[] }>();
  for (const f of faces) for (let i = 0; i < f.pts.length; i++) {
    const a = f.pts[i]!, c = f.pts[(i + 1) % f.pts.length]!;
    const k = [key(a), key(c)].sort().join('|');
    const e = m.get(k) ?? { a, b: c, ns: [] };
    e.ns.push(f.n); m.set(k, e);
  }
  const edges: MEdge[] = [...m.values()].map(e => ({ a: e.a, b: e.b, front: e.ns.some(front) }));
  return { faces, edges, pts: faces.flatMap(f => f.pts) };
}
function lift3(a: number, o0: number, o1: number, va: number, v0: number, v1: number): V3 { const p = [0, 0, 0]; p[a] = va; p[o0] = v0; p[o1] = v1; return p as V3; }

export function Solids(p: SolidsParams, fr: Frame, th: Theme): SolidsBlock {
  check(p.bodies.length > 0, NAME, 'no bodies to draw');
  const B = camBasis(p.cam ?? { az: 30, el: 24 });
  const meshes = p.bodies.map(b => meshOf(b, B.C));
  const offOf = (i: number | undefined, k: number): V3 => (i === undefined ? [0, 0, 0] : mul3(p.bodies[i]?.off ?? [0, 0, 0], k));

  // ---- fit: every body at rest and pulled out, and the measure lines ----
  const world: V3[] = [];
  meshes.forEach((M, i) => { world.push(...M.pts); if (p.bodies[i]!.off) world.push(...M.pts.map(v => add3(v, offOf(i, 1)))); });
  for (const m of p.measures ?? []) world.push(add3(m.a, offOf(m.body, 0)), add3(m.b, offOf(m.body, 0)));
  const s1 = world.map(v => proj(v, B));
  const bx0 = Math.min(...s1.map(q => q[0])), bx1 = Math.max(...s1.map(q => q[0])), by0 = Math.min(...s1.map(q => q[1])), by1 = Math.max(...s1.map(q => q[1]));
  const [MX, MY] = p.margin ?? [120, 86];
  const scale = Math.min((fr.w - 2 * MX) / Math.max(bx1 - bx0, 1e-6), (fr.h - 2 * MY) / Math.max(by1 - by0, 1e-6), p.maxScale ?? 160);
  check(scale > 18, NAME, `the solid would be drawn at ${Math.round(scale)} px per unit: too small to read`);
  const ox = fr.x + fr.w / 2 - scale * (bx0 + bx1) / 2, oy = fr.y + fr.h / 2 - scale * (by0 + by1) / 2;
  const S2 = (v: V3): Pt => { const q = proj(v, B); return [ox + scale * q[0], oy + scale * q[1]]; };
  const at = (v: V3, body?: number, k = 0): Pt => S2(add3(v, offOf(body, k)));
  const front = (n: V3) => dot3(n, B.C) > 1e-6;
  const boxOfPts = (P: readonly Pt[]): Box => box(Math.min(...P.map(q => q[0])), Math.min(...P.map(q => q[1])), Math.max(...P.map(q => q[0])), Math.max(...P.map(q => q[1])));

  // ---- the silhouettes and lines of a state (for label placement) ----
  function stateGeom(k: number): { polys: Pt[][]; lines: Pt[][] } {
    const polys: Pt[][] = [], lines: Pt[][] = [];
    meshes.forEach((M, i) => {
      for (const f of M.faces) polys.push(f.pts.map(v => at(v, i, k)));
      for (const e of M.edges) lines.push([at(e.a, i, k), at(e.b, i, k)]);
      if (M.cyl) for (const f of M.faces.slice(0, 2)) lines.push([...f.pts.map(v => at(v, i, k)), at(f.pts[0]!, i, k)]);
    });
    for (const m of p.measures ?? []) lines.push([at(m.a, m.body, k), at(m.b, m.body, k)]);
    return { polys, lines };
  }
  const geo = { rest: stateGeom(0), open: stateGeom(1) };
  const inPoly = (q: Pt, H: readonly Pt[]) => {
    let inside = false;
    for (let i = 0, j = H.length - 1; i < H.length; j = i++) {
      const a = H[i]!, b = H[j]!;
      if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  };
  const solidCentre = (k: number): Pt => { const all = meshes.flatMap((M, i) => M.pts.map(v => at(v, i, k))); const b = boxOfPts(all); return [b.cx, b.cy]; };

  // ---- labels ----
  interface Placed { L: Label; x: number; y: number; box: Box; state: 'rest' | 'open'; size: number }
  const placed: Placed[] = [];
  for (const L of p.labels ?? []) {
    const state = L.state ?? 'rest', k = state === 'open' ? 1 : 0, G = geo[state];
    const size = L.size ?? LABEL;
    const a = at(L.a, L.body, k), b = at(L.b, L.body, k), cen = solidCentre(k);
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let best: Placed | null = null;
    // pass 0: off the solid (unless the label belongs inside); pass 1: on a face, still off every line and label
    const ok = (bx: Box, pass: number) => {
      if (bx.x0 < fr.x - 40 || bx.x1 > fr.x + fr.w + 40 || bx.y0 < fr.y - 30 || bx.y1 > fr.y + fr.h + 30) return false;
      if (!L.inside && pass === 0) { const cs: Pt[] = [[bx.x0, bx.y0], [bx.x1, bx.y0], [bx.x1, bx.y1], [bx.x0, bx.y1], [bx.cx, bx.cy]]; if (cs.some(q => G.polys.some(P => inPoly(q, P)))) return false; }
      if (hitsLines(bx, G.lines, 8)) return false;
      return !placed.some(q => q.state === state && q.box.x0 < bx.x1 + 10 && bx.x0 < q.box.x1 + 10 && q.box.y0 < bx.y1 + 8 && bx.y0 < q.box.y1 + 8);
    };
    for (const pass of [0, 1]) for (const gap of [18, 34, 56, 84, 116, 150, 190]) for (const t of [0.5, 0.38, 0.62, 0.28, 0.72, 0.16, 0.84]) for (const sgn of [1, -1]) {
      if (best) break;
      let nx = -dy / len, ny = dx / len;
      const m: Pt = [a[0] + dx * t, a[1] + dy * t];
      if ((nx * (m[0] - cen[0]) + ny * (m[1] - cen[1])) * sgn < 0) { nx = -nx; ny = -ny; }
      const b0 = wordsBox(L.text, 0, 0, { size, align: 'center' });
      const ext = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2;
      const x = m[0] + nx * (gap + ext), y = m[1] + ny * (gap + ext);
      const bx = wordsBox(L.text, x, y, { size, align: 'center' });
      if (ok(bx, pass)) best = { L, x, y, box: bx, state, size };
    }
    if (best === null && L.optional) continue;
    check(best !== null, NAME, `no readable place for the label "${L.text}"`);
    placed.push(best);
  }

  // ---- drawing ----
  const tone = (role: Role, n: V3, isFront: boolean) => {
    const base = paint(th, role, 'fill'), lit = dot3(n, LIGHT);
    const t = lit > 0.55 ? mix(base, DUSK.cream, 0.26) : lit > 0.05 ? base : mix(base, DUSK.ink, 0.3);
    return isFront ? t : mix(t, DUSK.ink, 0.45);
  };
  function drawBody(c: Canvas, i: number, P: Progress<string>, glowsOf: Glow[]): void {
    const b = p.bodies[i]!, M = meshes[i]!;
    const a = clamp(P.k(b.show ?? 'solid'));
    if (a <= 0) return;
    const k = clamp(P.k(b.offKey ?? 'explode'));
    const Q = (v: V3) => at(v, i, k);
    withAlpha(c, a, () => {
      const { g } = c;
      if (b.ghost) {
        const col = paint(th, b.role, 'line');
        for (const f of M.faces) if (front(f.n)) fillPts(c, f.pts.map(Q), b.role, 0.06);
        for (const e of M.edges) strokePts(c, [Q(e.a), Q(e.b)], { col: col as never, lw: 3, alpha: e.front ? 0.9 : 0.45, dash: [12, 9], cap: 'butt' });
        if (M.cyl) for (const f of M.faces.slice(0, 2)) strokePts(c, f.pts.map(Q), { col: col as never, lw: 3, alpha: 0.8, dash: [12, 9], closed: true, cap: 'butt' });
        return;
      }
      // back faces: tinted glass, grouped by normal so overlapping cells never darken
      const groups = new Map<string, { n: V3; path: Path2D }>();
      for (const f of M.faces) {
        // a cylinder's side is one smooth wash (front half, back half), not 64 bands
        const lat = M.cyl && Math.abs(f.n[2]) < 1e-9;
        const kk = lat ? (front(f.n) ? 'latF' : 'latB') : f.n.map(x => Math.round(x * 100)).join(',');
        const gq = groups.get(kk) ?? { n: lat ? (front(f.n) ? [B.C[0], B.C[1], 0] as V3 : f.n) : f.n, path: new Path2D() };
        gq.path.addPath(pathOf(f.pts.map(Q), true)); groups.set(kk, gq);
      }
      const fillGroup = (isFront: boolean) => {
        for (const gq of groups.values()) {
          if (front(gq.n) !== isFront) continue;
          g.save(); g.globalAlpha *= isFront ? 0.3 : 0.4; g.fillStyle = tone(b.role, gq.n, isFront); g.fill(gq.path); g.restore();
        }
      };
      fillGroup(false);
      const cream = DUSK.cream as never;
      for (const e of M.edges) if (!e.front) strokePts(c, [Q(e.a), Q(e.b)], { col: cream, lw: 2.5, alpha: 0.4, dash: [11, 9], cap: 'butt' });
      if (M.cyl) drawCylEdges(c, M, Q, false);
      fillGroup(true);
      for (const gl of glowsOf) drawGlow(c, gl, P);
      if (b.seams) for (const f of M.faces) if (front(f.n) && f.cell) strokePts(c, f.pts.map(Q), { col: cream, lw: 1.6, alpha: 0.4, closed: true });
      for (const e of M.edges) if (e.front) strokePts(c, [Q(e.a), Q(e.b)], { col: cream, lw: 3.6, alpha: 0.95 });
      if (M.cyl) drawCylEdges(c, M, Q, true);
    });
  }
  function drawCylEdges(c: Canvas, M: Mesh, Q: (v: V3) => Pt, frontPass: boolean): void {
    const { c: ce, r, h } = M.cyl!;
    const cream = DUSK.cream as never;
    // silhouette angles: where the side's normal is square to the camera
    const t0 = Math.atan2(-B.C[0], B.C[1]);
    const ptAt = (t: number, z: number): V3 => [ce[0] + r * Math.cos(t), ce[1] + r * Math.sin(t), ce[2] + z];
    const arc = (ta: number, tb: number, z: number) => Array.from({ length: 41 }, (_, i) => Q(ptAt(ta + (tb - ta) * i / 40, z)));
    // the front half of a circle: normals with n.C > 0
    const mid = Math.atan2(B.C[1], B.C[0]);
    const fa = mid - Math.PI / 2, fb = mid + Math.PI / 2;
    if (!frontPass) { strokePts(c, arc(fb, fa + 2 * Math.PI, 0), { col: cream, lw: 2.5, alpha: 0.4, dash: [11, 9], cap: 'butt' }); return; }
    void t0;
    strokePts(c, arc(fa, fb, 0), { col: cream, lw: 3.6, alpha: 0.95 });
    strokePts(c, arc(0, 2 * Math.PI, h), { col: cream, lw: 3.6, alpha: 0.95 });
    for (const t of [fa, fb]) strokePts(c, [Q(ptAt(t, 0)), Q(ptAt(t, h))], { col: cream, lw: 3.6, alpha: 0.95 });
  }
  function drawGlow(c: Canvas, gl: Glow, P: Progress<string>): void {
    const k = clamp(P.k(gl.key));
    if (k <= 0) return;
    const kb = gl.body === undefined ? 0 : clamp(P.k(p.bodies[gl.body]!.offKey ?? 'explode'));
    const pts = gl.pts.map(v => at(v, gl.body, kb));
    fillPts(c, pts, gl.col ?? 'pick', 0.42 * k);
    strokePts(c, pts, { col: gl.col ?? 'pick', lw: 4.5, alpha: k, closed: true });
  }
  function drawMeasure(c: Canvas, m: Measure, P: Progress<string>): void {
    const k = clamp(P.k(m.key));
    if (k <= 0) return;
    const kb = m.body === undefined ? 0 : clamp(P.k(p.bodies[m.body]!.offKey ?? 'explode'));
    const a = at(m.a, m.body, kb), b = at(m.b, m.body, kb);
    strokePts(c, [a, b], { col: m.col ?? 'pick', lw: 3.5, alpha: k, dash: [12, 8], cap: 'butt' });
    if (m.right) {
      const u = unit3(sub3(m.a, m.b)), v = unit3(m.right), s = 0.32 * Math.min(1, Math.hypot(...sub3(m.a, m.b)) / 3);
      const q1 = add3(m.b, mul3(u, s)), q2 = add3(add3(m.b, mul3(u, s)), mul3(v, s)), q3 = add3(m.b, mul3(v, s));
      strokePts(c, [at(q1, m.body, kb), at(q2, m.body, kb), at(q3, m.body, kb)], { col: m.col ?? 'pick', lw: 3, alpha: k });
    }
  }

  function draw(c: Canvas, P: Progress<string>): void {
    // far bodies first (each is glass, so the order only settles which tint sits on top)
    const depth = (i: number) => { const M = meshes[i]!; const cen = mul3(M.pts.reduce((x, y) => add3(x, y), [0, 0, 0] as V3), 1 / M.pts.length); return dot3(add3(cen, offOf(i, clamp(P.k(p.bodies[i]!.offKey ?? 'explode')))), B.C); };
    const order = p.bodies.map((_, i) => i).sort((x, y) => depth(x) - depth(y));
    const loose = (p.glows ?? []).filter(gl => gl.body === undefined);
    for (const i of order) drawBody(c, i, P, (p.glows ?? []).filter(gl => gl.body === i));
    for (const gl of loose) drawGlow(c, gl, P);
    for (const m of p.measures ?? []) drawMeasure(c, m, P);
    const kOpen = clamp(P.k('explode'));
    for (const L of placed) {
      const show = clamp(P.k(L.L.key ?? 'dims')) * (L.state === 'open' ? clamp((kOpen - 0.6) / 0.4) : 1 - clamp(kOpen / 0.4));
      if (show <= 0) continue;
      drawWords(c, L.L.text, L.x, L.y, L.L.col ?? 'first', show, { size: L.size, align: 'center' });
    }
  }

  const where = {
    at,
    body: (i: number, k = 0) => boxOfPts(meshes[i]!.pts.map(v => at(v, i, k))),
    glow: (i: number, k = 0) => { const gl = p.glows![i]!; return boxOfPts(gl.pts.map(v => at(v, gl.body, k))); },
    label: (i: number) => placed[i]!.box,
    all: boxOfPts(meshes.flatMap((M, i) => M.pts.map(v => at(v, i, 0)))),
  };
  void EPS;
  return { kind: 'Solids', scale, box: unionBox([where.all, ...placed.map(q => q.box)]), where, draw };
}

/** strict layout first; if a label has no readable place, the same picture with every label optional (a label that
 *  does not fit is left off rather than drawn on a line). `strict` tells the caller which one it got. */
export function SolidsSafe(p: SolidsParams, fr: Frame, th: Theme): SolidsBlock & { strict: boolean } {
  try { return { ...Solids(p, fr, th), strict: true }; } catch {
    return { ...Solids({ ...p, labels: (p.labels ?? []).map(L => ({ ...L, optional: true })) }, fr, th), strict: false };
  }
}
