// pts.ts: shapes as point lists (Pt[]), so every shape can draw on, fill, and morph the same way.
import { type Box, type Pt, box, clamp, lerp } from './math';
import { E } from './easing';

export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function polyLen(P: readonly Pt[], closed = false): number {
  let l = 0;
  for (let i = 1; i < P.length; i++) l += dist(P[i - 1]!, P[i]!);
  if (closed && P.length > 1) l += dist(P[P.length - 1]!, P[0]!);
  return l;
}

/** the prefix of a polyline covering fraction k of its length */
export function partial(P: readonly Pt[], k: number, closed = false): Pt[] {
  const Q: Pt[] = closed && P.length ? [...P, P[0]!] : [...P];
  if (k >= 1 || Q.length < 2) return Q;
  const L = polyLen(Q) * clamp(k), out: Pt[] = [Q[0]!];
  let acc = 0;
  for (let i = 1; i < Q.length; i++) {
    const a = Q[i - 1]!, b = Q[i]!, d = dist(a, b);
    if (acc + d >= L) {
      const f = d ? (L - acc) / d : 0;
      out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]);
      return out;
    }
    acc += d; out.push(b);
  }
  return out;
}

/** n points evenly spaced along the length (closed: no duplicate end point) */
export function resample(P: readonly Pt[], n: number, closed = true): Pt[] {
  const Q: Pt[] = closed ? [...P, P[0]!] : [...P];
  const L = [0];
  for (let i = 1; i < Q.length; i++) L.push(L[i - 1]! + dist(Q[i - 1]!, Q[i]!));
  const tot = L[L.length - 1] || 1, out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (tot * k) / (closed ? n : n - 1);
    while (j < L.length - 2 && L[j + 1]! < s) j++;
    const a = Q[j]!, b = Q[Math.min(j + 1, Q.length - 1)]!;
    const f = (s - L[j]!) / (L[j + 1]! - L[j]! || 1);
    out.push([lerp(a[0], b[0], f), lerp(a[1], b[1], f)]);
  }
  return out;
}

export function signedArea(P: readonly Pt[]): number {
  let a = 0;
  for (let i = 0; i < P.length; i++) { const p = P[i]!, q = P[(i + 1) % P.length]!; a += p[0] * q[1] - q[0] * p[1]; }
  return a / 2;
}
export function centroid(P: readonly Pt[]): Pt {
  let x = 0, y = 0;
  for (const p of P) { x += p[0]; y += p[1]; }
  return P.length ? [x / P.length, y / P.length] : [0, 0];
}
export function bboxOf(P: readonly Pt[]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return P.length ? box(x0, y0, x1, y1) : box(0, 0, 0, 0);
}
/** move / scale / rotate a point list about (cx, cy) */
export function transformPts(P: readonly Pt[], dx = 0, dy = 0, s = 1, rot = 0, cx = 0, cy = 0): Pt[] {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return P.map(([x, y]) => { const u = (x - cx) * s, v = (y - cy) * s; return [cx + u * c - v * sn + dx, cy + u * sn + v * c + dy] as Pt; });
}

/** rounded rect, clockwise, starting at the top-left corner's end (so a draw-on starts top-left) */
export function rectPts(x: number, y: number, w: number, h: number, r = 0, n = 6): Pt[] {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const P: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; P.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  };
  corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
  P.unshift(P.pop()!);
  return P;
}
export const rectOf = (b: Box, pad = 0, r = 0): Pt[] => rectPts(b.x0 - pad, b.y0 - pad, b.w + 2 * pad, b.h + 2 * pad, r);

export function arcPts(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 48): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt; });
}
export const circlePts = (cx: number, cy: number, r: number, n = 64, a0 = -Math.PI / 2): Pt[] => arcPts(cx, cy, r, r, a0, a0 + Math.PI * 2, n).slice(0, n);

/** quadratic curve a -> b bulging sideways by `bend` px (positive = to the left of the direction of travel) */
export function curvePts(a: Pt, b: Pt, bend = 0, n = 32): Pt[] {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  const cx = mx + (dy / l) * bend, cy = my - (dx / l) * bend;
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n;
    return [lerp(lerp(a[0], cx, s), lerp(cx, b[0], s), s), lerp(lerp(a[1], cy, s), lerp(cy, b[1], s), s)] as Pt;
  });
}
/** the apex (furthest point) of curvePts(a, b, bend) */
export function curveApex(a: Pt, b: Pt, bend: number): Pt {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [mx + (dy / l) * bend / 2, my - (dx / l) * bend / 2];
}

/** a curly brace from a to b, the tip pointing to the left of the travel direction by `depth` px */
export function bracePts(a: Pt, b: Pt, depth = 26, n = 140): Pt[] {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l;
  const sh = Math.min(0.12, 40 / l), tp = Math.min(0.08, 30 / l);
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = i / n, e = Math.min(s, 1 - s);
    const o = depth * (0.5 * E.inOut(clamp(e / sh)) + 0.5 * E.inOut(clamp((e - (0.5 - tp)) / tp)));
    return [a[0] + dx * s + nx * o, a[1] + dy * s + ny * o] as Pt;
  });
}

/** Sutherland-Hodgman: clip a closed polygon to an axis-aligned box */
export function clipToBox(P: readonly Pt[], b: Box): Pt[] {
  let out: Pt[] = [...P];
  const edges: Array<[(p: Pt) => boolean, (p: Pt, q: Pt) => Pt]> = [
    [p => p[0] >= b.x0, (p, q) => [b.x0, p[1] + (q[1] - p[1]) * (b.x0 - p[0]) / (q[0] - p[0])]],
    [p => p[0] <= b.x1, (p, q) => [b.x1, p[1] + (q[1] - p[1]) * (b.x1 - p[0]) / (q[0] - p[0])]],
    [p => p[1] >= b.y0, (p, q) => [p[0] + (q[0] - p[0]) * (b.y0 - p[1]) / (q[1] - p[1]), b.y0]],
    [p => p[1] <= b.y1, (p, q) => [p[0] + (q[0] - p[0]) * (b.y1 - p[1]) / (q[1] - p[1]), b.y1]],
  ];
  for (const [inside, cut] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const p = inp[i]!, q = inp[(i + 1) % inp.length]!;
      if (inside(q)) { if (!inside(p)) out.push(cut(p, q)); out.push(q); }
      else if (inside(p)) out.push(cut(p, q));
    }
    if (!out.length) break;
  }
  return out;
}

/** outline polygon(s) of a stroked polyline (for morphing stroked TeX parts: strikes, circles) */
export function strokeOutline(P: readonly Pt[], lw: number, closed: boolean): Pt[][] {
  const h = lw / 2;
  const normals = (Q: readonly Pt[]): Pt[] => Q.map((p, i) => {
    const a = Q[Math.max(0, i - 1)]!, b = Q[Math.min(Q.length - 1, i + 1)]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });
  if (closed) {
    const n = P.length;
    const N = P.map((_, i) => {
      const a = P[(i - 1 + n) % n]!, b = P[(i + 1) % n]!, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l] as Pt;
    });
    return [P.map((p, i) => [p[0] + N[i]![0] * h, p[1] + N[i]![1] * h] as Pt), P.map((p, i) => [p[0] - N[i]![0] * h, p[1] - N[i]![1] * h] as Pt)];
  }
  const N = normals(P);
  const L = P.map((p, i) => [p[0] + N[i]![0] * h, p[1] + N[i]![1] * h] as Pt);
  const R = P.map((p, i) => [p[0] - N[i]![0] * h, p[1] - N[i]![1] * h] as Pt).reverse();
  return [[...L, ...R]];
}
