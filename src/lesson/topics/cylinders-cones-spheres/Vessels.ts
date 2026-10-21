// Vessels: the model block of "volume of cylinders, cones and spheres". Solids of revolution (and boxes / triangular
// prisms for the surface-area part) as glass vessels in the orthographic camera of composite-area-volume's Solids
// (elevation 24 deg, boxes turned 28 deg): body tinted in its role colour, hidden edges dashed, visible edges cream.
// A vessel can hold water (a volume fraction, so a cone poured into its cylinder stands exactly one third high), be
// built from stacked layers (the coin stack of V = Bh), sit inside another vessel (a ball in the can that just holds
// it), lie on its side (tilt) or be a dashed ghost. Dimensions (r, d, h, slant l, box edges) are coloured marks on the
// solid with a word label placed beside them, off every line (the block throws when a label has no readable place).
//   kinds   cyl | cone (point up) | cup (cone, point down) | sphere | dome (hemisphere, flat side down)
//           | bowl (hemisphere, flat side up) | box | tri (right-triangle prism)
//   keys    'solid' (show), `water` (volume fraction), `layers` (0..1 of the stack), 'base' (the base layer glows),
//           dims (default 'dims'), pours (the stream's alpha)
//   roles   first (amber) = the solid / the source, second (teal) = the container compared with, pick = the asked
//           length / a focus, link = the answer, wrong = a wrong input
import { type Box, type Pt, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, fillPts, pathOf, strokePts, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Theme, mix, paint, rgba } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { levelOf } from './volMaths';

export type VKind = 'cyl' | 'cone' | 'cup' | 'sphere' | 'dome' | 'bowl' | 'box' | 'tri';
export type Role = 'first' | 'second' | 'link' | 'pick' | 'wrong';
export interface Vessel {
  kind: VKind;
  /** radius (revolution solids) */ r?: number;
  /** height (cyl, cone, cup, box, tri: the prism's length is `len`) */ h?: number;
  /** box: length (x) and width (depth); tri: legs a (along the ground) and b (up), len (depth) */
  l?: number; w?: number; a?: number; b?: number; len?: number;
  role: Role;
  /** degrees: the drawing turns (a can lying on its side = 90) */ tilt?: number;
  /** drawn inside vessel i (at its spot), raised by z0 */ inside?: number; z0?: number;
  ghost?: boolean;
  /** progress keys */ show?: string; water?: string; layers?: { n: number; key: string };
  /** box: seams, n cells per edge */ grid?: number;
  caption?: string;
}
export type DimWhat = 'r' | 'd' | 'h' | 'l' | 'len' | 'w' | 'a' | 'b' | 'c';
export interface Dim { v: number; what: DimWhat; text: string; col?: Role; key?: string; optional?: boolean; size?: number }
export interface Pour { from: number; to: number; key: string }
export interface VesselsParams { vessels: Vessel[]; dims?: Dim[]; pours?: Pour[]; maxScale?: number; gap?: number; margin?: [number, number] }
export interface VesselsBlock {
  readonly kind: 'Vessels';
  readonly box: Box;
  readonly scale: number;
  readonly where: { body(i: number): Box; dim(i: number): Box | null; at(i: number, name: string): Pt; all: Box };
  draw(c: Canvas, p: Progress<string>): void;
}

const NAME = 'Vessels';
const EL = 24 * Math.PI / 180, AZ = 28 * Math.PI / 180;
const SE = Math.sin(EL), CE = Math.cos(EL);
const CAM = { C: [Math.sin(AZ) * CE, -Math.cos(AZ) * CE, SE], R: [Math.cos(AZ), Math.sin(AZ), 0], U: [-SE * Math.sin(AZ), SE * Math.cos(AZ), CE] };
type V3 = [number, number, number];
const dot3 = (a: readonly number[], b: readonly number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
const proj = (v: V3): Pt => [dot3(v, CAM.R), -dot3(v, CAM.U)];

/** an ellipse arc (t from t0 to t1), centre (cx, cy), semi-axes a (across) and b (depth) */
function arc(cx: number, cy: number, a: number, b: number, t0: number, t1: number, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / n; return [cx + a * Math.cos(t), cy + b * Math.sin(t)] as Pt; });
}
const ell = (cx: number, cy: number, a: number, b: number) => arc(cx, cy, a, b, 0, Math.PI * 2, 72);

interface Face { pts: Pt[]; front: boolean; lit: number }
interface Geo {
  sil: Pt[]; front: Pt[][]; back: Pt[][]; top?: Pt[]; faces?: Face[];
  anchors: Record<string, Pt>;
  /** water: the surface at depth fraction y -> centre y and half-width (revolution solids, local units) */
  surf?: (y: number) => { yc: number; a: number } | null;
  levelKind?: 'cyl' | 'cup' | 'cone' | 'sphere' | 'bowl' | 'box';
  /** extra lines the stack draws (for label placement) */
}

/** the geometry of a vessel at scale 1, origin = the centre of its base (screen y down) */
function geoOf(v: Vessel): Geo {
  const r = v.r ?? 1, h = v.h ?? 1, b = r * SE;
  switch (v.kind) {
    case 'cyl': {
      const H = h * CE;
      return {
        sil: [...arc(0, 0, r, b, 0, Math.PI), ...arc(0, -H, r, b, Math.PI, 2 * Math.PI)],
        front: [arc(0, 0, r, b, 0, Math.PI), ell(0, -H, r, b), [[r, 0], [r, -H]], [[-r, 0], [-r, -H]]],
        back: [arc(0, 0, r, b, Math.PI, 2 * Math.PI)],
        top: ell(0, -H, r, b),
        anchors: { baseC: [0, 0], baseR: [r, 0], baseL: [-r, 0], topC: [0, -H], topR: [r, -H], topL: [-r, -H] },
        surf: y => ({ yc: -y * H, a: r }), levelKind: 'cyl',
      };
    }
    case 'cone': {
      const H = h * CE;
      check(H > b * 1.15, NAME, 'the cone is too flat to draw');
      const t1 = Math.asin(-b / H), t2 = Math.PI - t1;
      const R: Pt = [r * Math.cos(t1), b * Math.sin(t1)], L: Pt = [r * Math.cos(t2), b * Math.sin(t2)];
      return {
        sil: [[0, -H], R, ...arc(0, 0, r, b, t1, t2), L],
        front: [arc(0, 0, r, b, t1, t2), [L, [0, -H], R]],
        back: [arc(0, 0, r, b, t2, t1 + 2 * Math.PI)],
        anchors: { baseC: [0, 0], baseR: [r, 0], baseL: [-r, 0], apex: [0, -H] },
        surf: y => ({ yc: -y * H, a: r * (1 - y) }), levelKind: 'cone',
      };
    }
    case 'cup': {
      const H = h * CE;
      check(H > b * 1.15, NAME, 'the cup is too flat to draw');
      const t1 = Math.asin(b / H), t2 = Math.PI - t1;      // tangent points on the rim, front side
      const R: Pt = [r * Math.cos(t1), -H + b * Math.sin(t1)], L: Pt = [r * Math.cos(t2), -H + b * Math.sin(t2)];
      return {
        sil: [[0, 0], R, ...arc(0, -H, r, b, t1, t2 - 2 * Math.PI), L],
        front: [ell(0, -H, r, b), [L, [0, 0], R]],
        back: [],
        top: ell(0, -H, r, b),
        anchors: { apex: [0, 0], rimC: [0, -H], rimR: [r, -H], rimL: [-r, -H] },
        surf: y => ({ yc: -y * H, a: r * y }), levelKind: 'cup',
      };
    }
    case 'sphere': {
      const cy = -r * CE;
      return {
        sil: ell(0, cy, r, r),
        front: [ell(0, cy, r, r), arc(0, cy, r, b, 0, Math.PI)],
        back: [arc(0, cy, r, b, Math.PI, 2 * Math.PI)],
        anchors: { C: [0, cy], R: [r, cy], L: [-r, cy], top: [0, cy - r], bottom: [0, cy + r] },
        surf: y => { const z = 2 * r * y - r; const a = Math.sqrt(Math.max(0, r * r - z * z)); return { yc: cy - z * CE, a }; }, levelKind: 'sphere',
      };
    }
    case 'dome': {
      return {
        sil: [...arc(0, 0, r, b, 0, Math.PI), ...arc(0, 0, r, r, Math.PI, 2 * Math.PI)],
        front: [arc(0, 0, r, b, 0, Math.PI), arc(0, 0, r, r, Math.PI, 2 * Math.PI)],
        back: [arc(0, 0, r, b, Math.PI, 2 * Math.PI)],
        anchors: { baseC: [0, 0], baseR: [r, 0], baseL: [-r, 0], top: [0, -r * CE] },
      };
    }
    case 'bowl': {
      const cy = -r * CE;
      return {
        sil: [...arc(0, cy, r, r, 0, Math.PI), ...arc(0, cy, r, b, Math.PI, 2 * Math.PI)],
        front: [ell(0, cy, r, b), arc(0, cy, r, r, 0, Math.PI)],
        back: [],
        top: ell(0, cy, r, b),
        anchors: { rimC: [0, cy], rimR: [r, cy], rimL: [-r, cy], bottom: [0, cy + r] },
        surf: y => ({ yc: -r * y * CE, a: Math.sqrt(Math.max(0, r * r - (r - r * y) ** 2)) }), levelKind: 'bowl',
      };
    }
    case 'box': case 'tri': {
      // a polygon in the x-z plane (front face), extruded along y (depth)
      const poly: [number, number][] = v.kind === 'box'
        ? [[-(v.l ?? 1) / 2, 0], [(v.l ?? 1) / 2, 0], [(v.l ?? 1) / 2, h], [-(v.l ?? 1) / 2, h]]
        : [[-(v.a ?? 1) / 2, 0], [(v.a ?? 1) / 2, 0], [-(v.a ?? 1) / 2, v.b ?? 1]];
      const D = v.kind === 'box' ? (v.w ?? 1) : (v.len ?? 1);
      const P3 = (x: number, z: number, y: number): V3 => [x, y, z];
      const front3 = poly.map(([x, z]) => P3(x, z, -D / 2)), back3 = poly.map(([x, z]) => P3(x, z, D / 2));
      const faces3: { pts: V3[]; n: V3 }[] = [{ pts: front3, n: [0, -1, 0] }, { pts: back3, n: [0, 1, 0] }];
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i]!, q2 = poly[(i + 1) % poly.length]!, dx = q2[0] - p[0], dz = q2[1] - p[1], L = Math.hypot(dx, dz);
        faces3.push({ pts: [front3[i]!, front3[(i + 1) % poly.length]!, back3[(i + 1) % poly.length]!, back3[i]!], n: [dz / L, 0, -dx / L] });
      }
      const LIGHT = [-0.45, -0.55, 1];
      const faces: Face[] = faces3.map(f => ({ pts: f.pts.map(proj), front: dot3(f.n, CAM.C) > 1e-6, lit: dot3(f.n, LIGHT) }));
      // edges: front if any face that shares it faces the camera
      const key = (p: V3) => p.map(x => Math.round(x * 1e5)).join(',');
      const m = new Map<string, { a: V3; b: V3; front: boolean }>();
      for (const f of faces3) for (let i = 0; i < f.pts.length; i++) {
        const a = f.pts[i]!, c = f.pts[(i + 1) % f.pts.length]!, k = [key(a), key(c)].sort().join('|');
        const e = m.get(k) ?? { a, b: c, front: false };
        e.front ||= dot3(f.n, CAM.C) > 1e-6; m.set(k, e);
      }
      const all = faces.flatMap(f => f.pts);
      const hullPts = hull(all);
      const an: Record<string, Pt> = {};
      const A = (x: number, z: number, y: number) => proj(P3(x, z, y));
      if (v.kind === 'box') {
        const l = v.l ?? 1;
        Object.assign(an, { lenA: A(-l / 2, 0, -D / 2), lenB: A(l / 2, 0, -D / 2), wA: A(l / 2, 0, -D / 2), wB: A(l / 2, 0, D / 2), hA: A(l / 2, 0, -D / 2), hB: A(l / 2, h, -D / 2), topC: A(0, h, 0), baseC: A(0, 0, 0) });
      } else {
        const a = v.a ?? 1, bb = v.b ?? 1;
        Object.assign(an, { aA: A(-a / 2, 0, -D / 2), aB: A(a / 2, 0, -D / 2), bA: A(-a / 2, 0, -D / 2), bB: A(-a / 2, bb, -D / 2), cA: A(a / 2, 0, -D / 2), cB: A(-a / 2, bb, -D / 2), lenA: A(a / 2, 0, -D / 2), lenB: A(a / 2, 0, D / 2), baseC: A(0, 0, 0) });
      }
      const surfBox = v.kind === 'box' ? (y: number) => ({ yc: -y * h * CE, a: 0 }) : undefined;
      return {
        sil: hullPts, faces,
        front: [...m.values()].filter(e => e.front).map(e => [proj(e.a), proj(e.b)]),
        back: [...m.values()].filter(e => !e.front).map(e => [proj(e.a), proj(e.b)]),
        anchors: an, surf: surfBox, levelKind: v.kind === 'box' ? 'box' : undefined,
      };
    }
  }
}
function hull(P: Pt[]): Pt[] {
  const S = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const p of S) { while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, p) <= 0) lo.pop(); lo.push(p); }
  for (const p of S.reverse()) { while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, p) <= 0) up.pop(); up.push(p); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
const dimEnds: Record<string, Partial<Record<DimWhat, [string, string, 'edge' | 'axis' | 'line']>>> = {
  cyl: { r: ['topC', 'topR', 'line'], d: ['topL', 'topR', 'line'], h: ['baseR', 'topR', 'edge'] },
  cone: { r: ['baseC', 'baseR', 'line'], d: ['baseL', 'baseR', 'line'], h: ['apex', 'baseC', 'axis'], l: ['baseR', 'apex', 'line'] },
  cup: { r: ['rimC', 'rimR', 'line'], d: ['rimL', 'rimR', 'line'], h: ['rimC', 'apex', 'axis'], l: ['rimR', 'apex', 'line'] },
  sphere: { r: ['C', 'R', 'line'], d: ['L', 'R', 'line'] },
  dome: { r: ['baseC', 'baseR', 'line'], d: ['baseL', 'baseR', 'line'], h: ['top', 'baseC', 'axis'] },
  bowl: { r: ['rimC', 'rimR', 'line'], d: ['rimL', 'rimR', 'line'] },
  box: { len: ['lenA', 'lenB', 'edge'], w: ['wA', 'wB', 'edge'], h: ['hA', 'hB', 'edge'] },
  tri: { a: ['aA', 'aB', 'edge'], b: ['bA', 'bB', 'edge'], c: ['cA', 'cB', 'edge'], len: ['lenA', 'lenB', 'edge'] },
};

export function Vessels(p: VesselsParams, fr: Frame, th: Theme): VesselsBlock {
  check(p.vessels.length > 0, NAME, 'no vessels');
  const geos = p.vessels.map(geoOf);
  // ---- local frames: tilt about the vessel's own box centre ----
  const rotOf = (i: number) => {
    const v = p.vessels[i]!, t = (v.tilt ?? 0) * Math.PI / 180, G = geos[i]!;
    const bx = boxOf(G.sil), c0: Pt = [bx.cx, bx.cy], cs = Math.cos(t), sn = Math.sin(t);
    return (q: Pt): Pt => t === 0 ? q : [c0[0] + (q[0] - c0[0]) * cs - (q[1] - c0[1]) * sn, c0[1] + (q[0] - c0[0]) * sn + (q[1] - c0[1]) * cs];
  };
  const rots = p.vessels.map((_, i) => rotOf(i));
  // ---- layout: hosts left to right on one ground line, nested vessels at their host's spot ----
  const hosts = p.vessels.map((v, i) => (v.inside === undefined ? i : -1)).filter(i => i >= 0);
  const localBox = (i: number) => boxOf(geos[i]!.sil.map(rots[i]!));
  const gap = p.gap ?? 130;
  const widths = hosts.map(i => localBox(i).w), sumW = widths.reduce((a, b) => a + b, 0);
  const tops = hosts.map(i => localBox(i).y0), bots = hosts.map(i => localBox(i).y1);
  const [MX, MY] = p.margin ?? [110, 90];
  const hgt = Math.max(...bots) - Math.min(...tops);
  const scale = Math.min((fr.w - 2 * MX - gap * (hosts.length - 1)) / Math.max(sumW, 1e-6), (fr.h - 2 * MY) / Math.max(hgt, 1e-6), p.maxScale ?? 150);
  check(scale > 14, NAME, `the vessels would be drawn at ${Math.round(scale)} px per unit`);
  const totalW = sumW * scale + gap * (hosts.length - 1);
  const origin: Pt[] = [];
  let x = fr.x + fr.w / 2 - totalW / 2;
  const yMid = fr.y + fr.h / 2, ground = yMid - scale * (Math.max(...bots) + Math.min(...tops)) / 2;
  hosts.forEach((i, k) => { const lb = localBox(i); origin[i] = [x - lb.x0 * scale, ground]; x += widths[k]! * scale + gap; });
  p.vessels.forEach((v, i) => { if (v.inside !== undefined) { const o = origin[v.inside]!; origin[i] = [o[0], o[1] - (v.z0 ?? 0) * CE * scale]; } });
  const T = (i: number) => (q: Pt): Pt => { const r = rots[i]!(q), o = origin[i]!; return [o[0] + r[0] * scale, o[1] + r[1] * scale]; };
  const Ts = p.vessels.map((_, i) => T(i));
  const S = geos.map((G, i) => {
    const t = Ts[i]!;
    return { sil: G.sil.map(t), front: G.front.map(l => l.map(t)), back: G.back.map(l => l.map(t)), top: G.top?.map(t), faces: G.faces?.map(f => ({ ...f, pts: f.pts.map(t) })), anchors: Object.fromEntries(Object.entries(G.anchors).map(([k, q]) => [k, t(q)])) as Record<string, Pt> };
  });

  // ---- dims: the coloured mark and its label ----
  const allLines: Pt[][] = S.flatMap(s => [...s.front, ...s.back, [...s.sil, s.sil[0]!]]);
  const dimSegs = (p.dims ?? []).map(d => {
    const kind = p.vessels[d.v]!.kind, e = dimEnds[kind]?.[d.what];
    check(e, NAME, `a ${kind} has no ${d.what}`);
    return { a: S[d.v]!.anchors[e[0]]!, b: S[d.v]!.anchors[e[1]]!, style: e[2] };
  });
  for (const s of dimSegs) allLines.push([s.a, s.b]);
  // captions first: fixed under each host
  const caps: { text: string; x: number; y: number; box: Box; v: number }[] = [];
  p.vessels.forEach((v, i) => {
    if (!v.caption) return;
    const bb = boxOf(S[i]!.sil);
    const y = bb.y1 + 54;
    caps.push({ text: v.caption, x: bb.cx, y, v: i, box: wordsBox(v.caption, bb.cx, y, { size: 44, align: 'center' }) });
  });
  const silPolys = S.map(s => s.sil);
  const inPoly = (q: Pt, H: readonly Pt[]) => { let ins = false; for (let i = 0, j = H.length - 1; i < H.length; j = i++) { const a = H[i]!, b = H[j]!; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; };
  interface Placed { d: Dim; x: number; y: number; box: Box; size: number }
  const placed: (Placed | null)[] = [];
  const taken: Box[] = caps.map(c => c.box);
  (p.dims ?? []).forEach((d, di) => {
    const { a, b } = dimSegs[di]!, size = d.size ?? 50;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    const cen = boxOf(S[d.v]!.sil);
    const ok = (bx: Box, pass: number) => {
      if (bx.x0 < fr.x - 30 || bx.x1 > fr.x + fr.w + 30 || bx.y0 < fr.y - 20 || bx.y1 > fr.y + fr.h + 20) return false;
      if (pass === 0) { const cs: Pt[] = [[bx.x0, bx.y0], [bx.x1, bx.y0], [bx.x1, bx.y1], [bx.x0, bx.y1], [bx.cx, bx.cy]]; if (cs.some(q => silPolys.some(P => inPoly(q, P)))) return false; }
      if (hitsLines(bx, allLines, 10)) return false;
      return !taken.some(q => q.x0 < bx.x1 + 12 && bx.x0 < q.x1 + 12 && q.y0 < bx.y1 + 8 && bx.y0 < q.y1 + 8);
    };
    let best: Placed | null = null;
    const b0 = wordsBox(d.text, 0, 0, { size, align: 'center' });
    // a label for a line inside the solid (an axis, a radius) sits right next to it; edges and slants stay outside
    const passes = dimSegs[di]!.style === 'axis' || d.what === 'r' || d.what === 'd' ? [1] : [0, 1];
    for (const pass of passes) for (const g of [14, 28, 46, 70, 100, 140]) for (const t of [0.5, 0.35, 0.65, 0.2, 0.8, 1.0, 0.0]) for (const sgn of [1, -1]) {
      if (best) break;
      let nx = -dy / len, ny = dx / len;
      const m: Pt = [a[0] + dx * t, a[1] + dy * t];
      if ((nx * (m[0] - cen.cx) + ny * (m[1] - cen.cy)) * sgn < 0) { nx = -nx; ny = -ny; }
      const ext = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2;
      const X = m[0] + nx * (g + ext), Y = m[1] + ny * (g + ext);
      const bx = wordsBox(d.text, X, Y, { size, align: 'center' });
      if (ok(bx, pass)) best = { d, x: X, y: Y, box: bx, size };
    }
    if (!best) { check(d.optional, NAME, `no readable place for the label "${d.text}"`); placed.push(null); return; }
    taken.push(best.box); placed.push(best);
  });

  // ---- drawing ----
  const cream = DUSK.cream as never;
  function drawVessel(c: Canvas, i: number, P: Progress<string>): void {
    const v = p.vessels[i]!, s = S[i]!, G = geos[i]!;
    const al = clamp(P.k(v.show ?? 'solid'));
    if (al <= 0) return;
    withAlpha(c, al, () => {
      const { g } = c;
      const col = paint(th, v.role, 'fill');
      if (v.ghost) {
        fillPts(c, s.sil, v.role, 0.05);
        for (const l of [...s.front, ...s.back]) strokePts(c, l, { col: paint(th, v.role, 'line') as never, lw: 3, alpha: 0.85, dash: [12, 9], cap: 'butt' });
        return;
      }
      const silPath = pathOf(s.sil, true);
      // body: one glass wash, lit from the left
      if (s.faces) {
        for (const f of s.faces.filter(f => !f.front)) fillPts(c, f.pts, mix(col, DUSK.ink, 0.45), 0.35);
      } else {
        const bb = boxOf(s.sil);
        const lg = g.createLinearGradient(bb.x0, 0, bb.x1, 0);
        lg.addColorStop(0, rgba(mix(col, DUSK.cream, 0.3), 0.36)); lg.addColorStop(0.55, rgba(col, 0.28)); lg.addColorStop(1, rgba(mix(col, DUSK.ink, 0.35), 0.36));
        g.save(); g.fillStyle = lg; g.fill(silPath); g.restore();
      }
      for (const l of s.back) strokePts(c, l, { col: cream, lw: 2.5, alpha: 0.42, dash: [11, 9], cap: 'butt' });
      // layers (the coin stack): slices appear bottom up
      if (v.layers && (v.kind === 'cyl')) drawLayers(c, i, P);
      // water
      if (v.water && G.surf && G.levelKind) {
        const f = clamp(P.k(v.water));
        if (f > 0.002) drawWater(c, i, f);
      }
      if (s.faces) for (const f of s.faces.filter(f => f.front)) fillPts(c, f.pts, f.lit > 0.55 ? mix(col, DUSK.cream, 0.26) : f.lit > 0.05 ? col : mix(col, DUSK.ink, 0.3), 0.3);
      if (s.top) fillPts(c, s.top, mix(col, DUSK.cream, 0.35), 0.18);
      const kb = clamp(P.k('base'));
      if (kb > 0) { const base = baseEllipse(i); if (base) { fillPts(c, base, 'pick', 0.5 * kb); strokePts(c, base, { col: 'pick', lw: 4.5, alpha: kb, closed: true }); } }
      if (v.grid && v.kind === 'box' && s.faces) drawGrid(c, i);
      for (const l of s.front) strokePts(c, l, { col: cream, lw: 3.6, alpha: 0.95 });
    });
  }
  function baseEllipse(i: number): Pt[] | null {
    const v = p.vessels[i]!, r = v.r ?? 1, t = Ts[i]!;
    if (v.kind === 'cyl' || v.kind === 'cone' || v.kind === 'dome') return ell(0, 0, r, r * SE).map(t);
    return null;
  }
  function drawLayers(c: Canvas, i: number, P: Progress<string>): void {
    const v = p.vessels[i]!, L = v.layers!, r = v.r ?? 1, h = v.h ?? 1, t = Ts[i]!, b = r * SE;
    const k = clamp(P.k(L.key)) * L.n;
    const col = paint(th, v.role, 'fill');
    for (let j = 0; j < L.n; j++) {
      const a = clamp(k - j);
      if (a <= 0) break;
      const y0 = -(j * h / L.n) * CE, y1 = -((j + 1) * h / L.n) * CE;
      const drop = (1 - a) * 0.6 * h / L.n * CE;      // the newest layer settles from just above
      const sl = [...arc(0, y0 - drop, r, b, 0, Math.PI), ...arc(0, y1 - drop, r, b, Math.PI, 2 * Math.PI)].map(t);
      fillPts(c, sl, mix(col, DUSK.ink, 0.15), 0.55 * a);
      strokePts(c, arc(0, y0 - drop, r, b, 0, Math.PI).map(t), { col: cream, lw: 2.2, alpha: 0.6 * a });
      strokePts(c, ell(0, y1 - drop, r, b).map(t), { col: cream, lw: 2.2, alpha: 0.6 * a });
    }
  }
  function drawWater(c: Canvas, i: number, f: number): void {
    const v = p.vessels[i]!, s = S[i]!, G = geos[i]!, t = Ts[i]!;
    check(!v.tilt, NAME, 'water in a tilted vessel');
    const y = levelOf(G.levelKind!, f);
    const { g } = c;
    const water = paint(th, 'water', 'fill');
    if (G.levelKind === 'box') {
      const sub = geoOf({ ...v, h: (v.h ?? 1) * y });
      for (const fc of sub.faces!) if (fc.front) fillPts(c, fc.pts.map(t), water, 0.42);
      return;
    }
    const sf = G.surf!(y);
    if (!sf) return;
    const r = v.r ?? 1, b = sf.a * SE;
    void r;
    const yc = t([0, sf.yc])[1];
    g.save();
    g.clip(pathOf(s.sil, true));
    g.fillStyle = rgba(water, 0.5);
    const bb = boxOf(s.sil);
    g.fillRect(bb.x0 - 4, yc, bb.w + 8, bb.y1 - yc + 4);
    g.restore();
    if (sf.a > 1e-3) {
      const top = ell(0, sf.yc, sf.a, b).map(t);
      fillPts(c, top, mix(water, DUSK.cream, 0.35), 0.55);
      strokePts(c, top, { col: paint(th, 'water', 'line') as never, lw: 2.5, alpha: 0.9, closed: true });
    }
  }
  function drawGrid(c: Canvas, i: number): void {
    const v = p.vessels[i]!, n = v.grid!, l = v.l ?? 1, w = v.w ?? 1, h = v.h ?? 1, t = Ts[i]!;
    const A = (x: number, z: number, y: number) => t(proj([x, y, z]));
    const L: Pt[][] = [];
    for (let k = 1; k < n; k++) {
      const fx = -l / 2 + l * k / n, fz = h * k / n, fy = -w / 2 + w * k / n;
      L.push([A(fx, 0, -w / 2), A(fx, h, -w / 2)], [A(-l / 2, fz, -w / 2), A(l / 2, fz, -w / 2)]);         // front face
      L.push([A(fx, h, -w / 2), A(fx, h, w / 2)], [A(-l / 2, h, fy), A(l / 2, h, fy)]);                     // top
      L.push([A(l / 2, 0, fy), A(l / 2, h, fy)], [A(l / 2, fz, -w / 2), A(l / 2, fz, w / 2)]);              // right side
    }
    for (const q2 of L) strokePts(c, q2, { col: cream, lw: 1.8, alpha: 0.45 });
  }
  function drawDim(c: Canvas, di: number, P: Progress<string>): void {
    const d = p.dims![di]!, k = clamp(P.k(d.key ?? 'dims')) * clamp(P.k(p.vessels[d.v]!.show ?? 'solid'));
    if (k <= 0) return;
    const { a, b, style } = dimSegs[di]!, col = d.col ?? 'first';
    if (style === 'axis') {
      strokePts(c, [a, b], { col, lw: 4, alpha: k, dash: [12, 8], cap: 'butt' });
      // a right-angle mark where the height meets the base
      const base = b, ux = a[0] - b[0], uy = a[1] - b[1], ul = Math.hypot(ux, uy) || 1, s = 22;
      strokePts(c, [[base[0] + ux / ul * s, base[1] + uy / ul * s], [base[0] + ux / ul * s + s, base[1] + uy / ul * s], [base[0] + s, base[1]]], { col, lw: 3, alpha: k });
    } else strokePts(c, [a, b], { col, lw: style === 'edge' ? 6 : 4.5, alpha: k });
    if (style === 'line') for (const q2 of [a, b]) fillPts(c, ell(q2[0], q2[1], 6, 6), col, k);
    const L = placed[di];
    if (L) drawWords(c, d.text, L.x, L.y, col, k, { size: L.size, align: 'center' });
  }
  function drawPour(c: Canvas, po: Pour, P: Progress<string>): void {
    const k = clamp(P.k(po.key));
    if (k <= 0) return;
    const A = boxOf(S[po.from]!.sil), B2 = boxOf(S[po.to]!.sil);
    const toRight = B2.cx > A.cx;
    const s0: Pt = [toRight ? A.x1 - 10 : A.x0 + 10, A.y0 + 8];
    const e: Pt = [B2.cx + (toRight ? -0.15 : 0.15) * B2.w, B2.y0 + 10];
    const mid: Pt = [(s0[0] + e[0]) / 2, Math.min(s0[1], e[1]) - 120];
    const pts = Array.from({ length: 30 }, (_, j) => { const t = j / 29, u = 1 - t; return [u * u * s0[0] + 2 * u * t * mid[0] + t * t * e[0], u * u * s0[1] + 2 * u * t * mid[1] + t * t * e[1]] as Pt; });
    strokePts(c, pts, { col: paint(th, 'water', 'fill') as never, lw: 16, alpha: 0.75 * k });
    strokePts(c, pts, { col: paint(th, 'water', 'line') as never, lw: 4, alpha: 0.8 * k });
  }
  function draw(c: Canvas, P: Progress<string>): void {
    p.vessels.forEach((_, i) => drawVessel(c, i, P));
    for (const po of p.pours ?? []) drawPour(c, po, P);
    (p.dims ?? []).forEach((_, i) => drawDim(c, i, P));
    const kc = clamp(P.k('caption'));
    for (const cp of caps) drawWords(c, cp.text, cp.x, cp.y, 'dim', kc * clamp(P.k(p.vessels[cp.v]!.show ?? 'solid')), { size: 44, align: 'center' });
  }
  const bodyBox = (i: number) => boxOf(S[i]!.sil);
  const all = unionBox(S.map(s => boxOf(s.sil)));
  return {
    kind: 'Vessels', scale,
    box: unionBox([all, ...placed.filter((x): x is Placed => !!x).map(x => x.box), ...caps.map(c => c.box)]),
    where: { body: bodyBox, dim: i => placed[i]?.box ?? null, at: (i, n) => S[i]!.anchors[n]!, all },
    draw,
  };
}
function boxOf(P: readonly Pt[]): Box { return box(Math.min(...P.map(q => q[0])), Math.min(...P.map(q => q[1])), Math.max(...P.map(q => q[0])), Math.max(...P.map(q => q[1]))); }

/** strict layout first; a label with no readable place is dropped (its number is in the prompt) */
export function VesselsSafe(p: VesselsParams, fr: Frame, th: Theme): VesselsBlock & { strict: boolean } {
  try { return { ...Vessels(p, fr, th), strict: true }; } catch {
    return { ...Vessels({ ...p, dims: (p.dims ?? []).map(d => ({ ...d, optional: true })) }, fr, th), strict: false };
  }
}
