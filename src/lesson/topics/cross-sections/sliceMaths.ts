// sliceMaths.ts: the exact geometry behind the cross-sections lesson. Pure (no DOM, no canvas), so tests and item
// generators use the same numbers the picture draws.
//   solids     a right rectangular prism (box) l x w x h, or a right rectangular pyramid on an l x w base with its
//              apex above the base centre, in LOCAL coordinates: x = length, y = width (depth), z = height
//   planes     n . p = d (n a unit vector); planeAxis, planeThrough (3 points), planeUpright (contains a base line)
//   section    the plane meets the solid face by face: every face it crosses gives exactly one side; the sides are
//              chained into the section polygon, each side tagged with its face (the face-by-face trace)
//   shape      name, side lengths, parallel sides and right angles of the section (in the plane's own 2-D frame)
//   pieces     the two pieces of the cut solid (faces clipped by the plane + the section as their cap)
//   pose/view  how a solid sits in the world (upright, upside down, tipped onto a side face) and an orthographic
//              camera (azimuth, elevation) that projects it to the screen
export type V3 = [number, number, number];
export const EPS = 1e-7;
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
export const unit = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const near = (a: V3, b: V3, e = 1e-6): boolean => len(sub(a, b)) < e;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- solids ----------
export type SolidKind = 'box' | 'pyramid';
export interface SolidSpec { kind: SolidKind; l: number; w: number; h: number }
export type FaceName = 'bottom' | 'top' | 'front' | 'back' | 'left' | 'right' | 'base' | 'cap';
export interface Face { name: FaceName; pts: V3[]; n: V3 }

/** the faces of an axis-aligned box from corner a to corner b (outward normals; front = y min, left = x min) */
export function boxFacesAt(a: V3, b: V3): Face[] {
  const [x0, y0, z0] = a, [x1, y1, z1] = b;
  return [
    { name: 'bottom', n: [0, 0, -1], pts: [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]] },
    { name: 'top', n: [0, 0, 1], pts: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]] },
    { name: 'front', n: [0, -1, 0], pts: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]] },
    { name: 'back', n: [0, 1, 0], pts: [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]] },
    { name: 'left', n: [-1, 0, 0], pts: [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]] },
    { name: 'right', n: [1, 0, 0], pts: [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]] },
  ];
}
export function apexOf(s: SolidSpec): V3 { return [s.l / 2, s.w / 2, s.h]; }
export function solidFaces(s: SolidSpec): Face[] {
  if (s.kind === 'box') return boxFacesAt([0, 0, 0], [s.l, s.w, s.h]);
  const A = apexOf(s);
  const c: V3[] = [[0, 0, 0], [s.l, 0, 0], [s.l, s.w, 0], [0, s.w, 0]];
  const side = (name: FaceName, p: V3, q: V3): Face => ({ name, pts: [p, q, A], n: unit(cross(sub(q, p), sub(A, p))) });
  return [
    { name: 'base', n: [0, 0, -1], pts: [c[0]!, c[3]!, c[2]!, c[1]!] },
    side('front', c[0]!, c[1]!), side('right', c[1]!, c[2]!), side('back', c[2]!, c[3]!), side('left', c[3]!, c[0]!),
  ];
}
export function solidVerts(s: SolidSpec): V3[] {
  const out: V3[] = [];
  for (const f of solidFaces(s)) for (const p of f.pts) if (!out.some(q => near(p, q))) out.push(p);
  return out;
}
export interface Edge { a: V3; b: V3; faces: [FaceName, FaceName] }
/** every edge once, with the two faces that meet there */
export function edgesOf(faces: readonly Face[]): Edge[] {
  const out: Edge[] = [];
  for (const f of faces) for (let i = 0; i < f.pts.length; i++) {
    const a = f.pts[i]!, b = f.pts[(i + 1) % f.pts.length]!;
    const e = out.find(x => (near(x.a, a) && near(x.b, b)) || (near(x.a, b) && near(x.b, a)));
    if (e) e.faces[1] = f.name; else out.push({ a, b, faces: [f.name, f.name] });
  }
  return out;
}
export const faceCount = (s: SolidSpec) => (s.kind === 'box' ? 6 : 5);
export const centroidOf = (P: readonly V3[]): V3 => mul(P.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / Math.max(1, P.length));

// ---------- planes ----------
export interface Plane { n: V3; d: number }
export const planeAxis = (axis: 0 | 1 | 2, at: number): Plane => ({ n: axis === 0 ? [1, 0, 0] : axis === 1 ? [0, 1, 0] : [0, 0, 1], d: at });
export function planeThrough(a: V3, b: V3, c: V3): Plane {
  const n = cross(sub(b, a), sub(c, a));
  if (len(n) < 1e-9) throw new Error('planeThrough: the three points are on one line');
  const u = unit(n);
  return { n: u, d: dot(u, a) };
}
/** a plane perpendicular to the base (vertical) that contains the base line through p and q */
export function planeUpright(p: V3, q: V3): Plane { const u = unit(cross(sub(q, p), [0, 0, 1])); return { n: u, d: dot(u, p) }; }
export const sideOf = (P: Plane, p: V3) => dot(P.n, p) - P.d;
export const shifted = (P: Plane, by: number): Plane => ({ n: P.n, d: P.d + by });

// ---------- the section ----------
export interface Section {
  /** the polygon, in order; side j runs from pts[j] to pts[j+1] */
  pts: V3[];
  /** the face each side lies in (the face-by-face trace) */
  sideFaces: FaceName[];
  /** faces whose INTERIOR the plane crosses (one side each) */
  crossed: FaceName[];
  kind: 'empty' | 'point' | 'segment' | 'polygon' | 'face';
  /** the plane passes through a vertex of the solid / contains a whole edge */
  throughVertex: boolean; containsEdge: boolean;
}
function dedupe(P: V3[], e = 1e-6): V3[] { const out: V3[] = []; for (const p of P) if (!out.some(q => near(p, q, e))) out.push(p); return out; }

export function sectionOfFaces(faces: readonly Face[], P: Plane): Section {
  const segs: { a: V3; b: V3; face: FaceName }[] = [];
  let all: V3[] = [];
  let throughVertex = false, faceIn = false;
  for (const f of faces) {
    const s = f.pts.map(p => sideOf(P, p));
    if (s.every(x => Math.abs(x) < EPS)) { faceIn = true; continue; }
    let hit: V3[] = [];
    for (let i = 0; i < f.pts.length; i++) {
      const j = (i + 1) % f.pts.length, a = f.pts[i]!, b = f.pts[j]!, sa = s[i]!, sb = s[j]!;
      if (Math.abs(sa) < EPS) { hit.push(a); throughVertex = true; }
      if ((sa > EPS && sb < -EPS) || (sa < -EPS && sb > EPS)) hit.push(lerp3(a, b, sa / (sa - sb)));
    }
    hit = dedupe(hit);
    all.push(...hit);
    if (hit.length >= 2) {
      // a convex face meets a plane in one segment: its two extreme points
      let best: [V3, V3] = [hit[0]!, hit[1]!], bl = -1;
      for (const p of hit) for (const q of hit) { const l = len(sub(p, q)); if (l > bl) { bl = l; best = [p, q]; } }
      if (bl > 1e-6) segs.push({ a: best[0], b: best[1], face: f.name });
    }
  }
  all = dedupe(all);
  if (faceIn) return { pts: [], sideFaces: [], crossed: [], kind: 'face', throughVertex, containsEdge: true };
  if (!segs.length) return { pts: all.slice(0, 1), sideFaces: [], crossed: [], kind: all.length ? 'point' : 'empty', throughVertex, containsEdge: false };
  // the same segment from two faces = the plane contains that edge: keep one
  const uniq: typeof segs = [];
  let containsEdge = false;
  for (const g of segs) {
    if (uniq.some(u => (near(u.a, g.a) && near(u.b, g.b)) || (near(u.a, g.b) && near(u.b, g.a)))) { containsEdge = true; continue; }
    uniq.push(g);
  }
  if (uniq.length === 1) return { pts: [uniq[0]!.a, uniq[0]!.b], sideFaces: [uniq[0]!.face], crossed: [], kind: 'segment', throughVertex, containsEdge };
  // chain the segments into one closed polygon
  const left = uniq.slice(1);
  const pts: V3[] = [uniq[0]!.a, uniq[0]!.b];
  const sideFaces: FaceName[] = [uniq[0]!.face];
  while (left.length) {
    const end = pts[pts.length - 1]!;
    const i = left.findIndex(g => near(g.a, end) || near(g.b, end));
    if (i < 0) break;
    const g = left.splice(i, 1)[0]!;
    pts.push(near(g.a, end) ? g.b : g.a);
    sideFaces.push(g.face);
  }
  if (near(pts[0]!, pts[pts.length - 1]!)) pts.pop();
  // merge straight runs (two collinear sides meeting at a vertex of the solid)
  for (let k = 0; k < pts.length && pts.length > 3; k++) {
    const n = pts.length, a = pts[(k - 1 + n) % n]!, b = pts[k]!, c = pts[(k + 1) % n]!;
    if (len(cross(sub(b, a), sub(c, b))) < 1e-7) { pts.splice(k, 1); sideFaces.splice(k, 1); k--; }
  }
  const crossed = faces.filter(f => {
    const s = f.pts.map(p => sideOf(P, p));
    return s.some(x => x > EPS) && s.some(x => x < -EPS);
  }).map(f => f.name);
  return { pts, sideFaces, crossed, kind: 'polygon', throughVertex, containsEdge };
}
export const sectionOf = (s: SolidSpec, P: Plane): Section => sectionOfFaces(solidFaces(s), P);

// ---------- the plane's own 2-D frame and the shape ----------
/** u to the right, v "up" inside the plane (v = world up projected into the plane; a level plane uses the depth axis) */
export function planeFrame(P: Plane, up: V3 = [0, 0, 1], right: V3 = [1, 0, 0]): { u: V3; v: V3 } {
  let v = sub(up, mul(P.n, dot(up, P.n)));
  if (len(v) < 1e-6) { const depth: V3 = [0, 1, 0]; v = sub(depth, mul(P.n, dot(depth, P.n))); }
  v = unit(v);
  let u = unit(cross(v, P.n));
  if (dot(u, right) < 0) u = mul(u, -1);
  return { u, v };
}
export const to2 = (p: V3, F: { u: V3; v: V3 }): [number, number] => [dot(p, F.u), dot(p, F.v)];

export type ShapeName = 'point' | 'segment' | 'triangle' | 'square' | 'rectangle' | 'rhombus' | 'parallelogram' | 'trapezoid' | 'quadrilateral' | 'pentagon' | 'hexagon' | 'polygon';
export interface ShapeInfo { sides: number; name: ShapeName; lengths: number[]; equalSides: boolean; parallelPairs: number; rightAngles: number; regular: boolean; isoTrapezoid: boolean }
const close = (a: number, b: number, e = 1e-6) => Math.abs(a - b) < e * Math.max(1, Math.abs(a), Math.abs(b));
export function shapeOf(pts: readonly V3[]): ShapeInfo {
  const n = pts.length;
  if (n <= 1) return { sides: 0, name: 'point', lengths: [], equalSides: false, parallelPairs: 0, rightAngles: 0, regular: false, isoTrapezoid: false };
  if (n === 2) return { sides: 1, name: 'segment', lengths: [len(sub(pts[1]!, pts[0]!))], equalSides: false, parallelPairs: 0, rightAngles: 0, regular: false, isoTrapezoid: false };
  const E = pts.map((p, i) => sub(pts[(i + 1) % n]!, p));
  const lengths = E.map(len);
  const equalSides = lengths.every(l => close(l, lengths[0]!));
  let rightAngles = 0;
  for (let i = 0; i < n; i++) if (Math.abs(dot(unit(E[i]!), unit(E[(i + 1) % n]!))) < 1e-6) rightAngles++;
  let parallelPairs = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (len(cross(unit(E[i]!), unit(E[j]!))) < 1e-6) parallelPairs++;
  // a regular polygon: equal sides and equal angles
  const ang = E.map((e, i) => dot(unit(e), unit(E[(i + 1) % n]!)));
  const regular = equalSides && ang.every(a => close(a, ang[0]!));
  let name: ShapeName = n === 3 ? 'triangle' : n === 5 ? 'pentagon' : n === 6 ? 'hexagon' : n === 4 ? 'quadrilateral' : 'polygon';
  let isoTrapezoid = false;
  if (n === 4) {
    if (parallelPairs === 2) name = rightAngles === 4 ? (equalSides ? 'square' : 'rectangle') : equalSides ? 'rhombus' : 'parallelogram';
    else if (parallelPairs === 1) {
      name = 'trapezoid';
      const k = len(cross(unit(E[0]!), unit(E[2]!))) < 1e-6 ? 1 : 0;   // the legs are the non-parallel pair
      isoTrapezoid = close(lengths[k]!, lengths[k + 2]!);
    }
  }
  return { sides: n, name, lengths, equalSides, parallelPairs, rightAngles, regular, isoTrapezoid };
}

// ---------- pieces (the solid cut in two) ----------
/** clip the solid's faces to the side keep*(n.p - d) >= 0 and close it with the section as a cap */
export function pieceOf(faces: readonly Face[], P: Plane, keep: 1 | -1): Face[] {
  const out: Face[] = [];
  for (const f of faces) {
    const s = f.pts.map(p => keep * sideOf(P, p));
    const q: V3[] = [];
    for (let i = 0; i < f.pts.length; i++) {
      const j = (i + 1) % f.pts.length, a = f.pts[i]!, b = f.pts[j]!, sa = s[i]!, sb = s[j]!;
      if (sa >= -EPS) q.push(a);
      if ((sa > EPS && sb < -EPS) || (sa < -EPS && sb > EPS)) q.push(lerp3(a, b, sa / (sa - sb)));
    }
    const d = dedupe(q);
    if (d.length >= 3) out.push({ name: f.name, n: f.n, pts: d });
  }
  const sec = sectionOfFaces(faces, P);
  if (sec.kind === 'polygon') out.push({ name: 'cap', n: mul(P.n, -keep), pts: sec.pts });
  return out;
}
/** which side of the plane holds the solid's centroid (that piece stays; the other one is lifted away) */
export function stayingSide(s: SolidSpec, P: Plane): 1 | -1 {
  const c = centroidOf(solidVerts(s));
  const v = sideOf(P, c);
  return v > EPS ? 1 : v < -EPS ? -1 : -1;
}

// ---------- pose and camera ----------
export type Pose = 'upright' | 'upsideDown' | 'onFace';
/** local -> world for a pose (the world floor is z = 0) */
export function poseFn(s: SolidSpec, pose: Pose): (p: V3) => V3 {
  if (pose === 'upright') return p => p;
  if (pose === 'upsideDown') return p => [p[0], s.w - p[1], s.h - p[2]];
  // tipped over the left base edge (x = 0): it rests on its left side face and the base faces up and to the right
  const nL = solidFaces(s).find(f => f.name === 'left')!.n;
  const cur = Math.atan2(nL[2], nL[0]), th = -Math.PI / 2 - cur;
  const c = Math.cos(th), sn = Math.sin(th);
  const rot = (p: V3): V3 => [p[0] * c - p[2] * sn, p[1], p[0] * sn + p[2] * c];
  const R = solidVerts(s).map(rot);
  const minZ = Math.min(...R.map(p => p[2])), minX = Math.min(...R.map(p => p[0]));
  return p => { const q = rot(p); return [q[0] - minX, q[1], q[2] - minZ]; };
}
/** the world direction a pose turns local "up" into (to keep the sketch of a section upright) */
export function poseUp(s: SolidSpec, pose: Pose): V3 {
  const f = poseFn(s, pose), o = f([0, 0, 0]);
  return unit(sub(f([0, 0, 1]), o));
}
export interface Cam { az: number; el: number }
export interface CamBasis { C: V3; R: V3; U: V3 }
/** az: degrees the viewer has moved round to the right of the front; el: degrees above the floor */
export function camBasis(cam: Cam): CamBasis {
  const a = cam.az * Math.PI / 180, e = cam.el * Math.PI / 180;
  return {
    C: [Math.sin(a) * Math.cos(e), -Math.cos(a) * Math.cos(e), Math.sin(e)],
    R: [Math.cos(a), Math.sin(a), 0],
    U: [-Math.sin(e) * Math.sin(a), Math.sin(e) * Math.cos(a), Math.cos(e)],
  };
}
/** world -> screen at scale 1 (y down) */
export const proj = (p: V3, B: CamBasis): [number, number] => [dot(p, B.R), -dot(p, B.U)];

/** the bounding box of the solid, padded on every side by a share of its size (the plane is drawn as a sheet cut by it) */
export function sheetOf(s: SolidSpec, P: Plane, pad = 0.12): V3[] {
  const m = Math.max(s.l, s.w, s.h) * pad;
  const sec = sectionOfFaces(boxFacesAt([-m, -m, -m], [s.l + m, s.w + m, s.h + m]), P);
  return sec.kind === 'polygon' ? sec.pts : [];
}

// ---------- readable numbers ----------
/** a length as words: 3 -> "3 in", 1.5 -> "1.5 in" (lengths in this lesson are whole or half units) */
export function lenWords(x: number, unitW: string): string {
  const r = Math.round(x * 2) / 2;
  return `${Number.isInteger(r) ? r : r.toFixed(1)} ${unitW}`;
}
export const isNice = (x: number) => Math.abs(x * 2 - Math.round(x * 2)) < 1e-6 && x > 0;
