// Globe: the sphere model of spherical geometry (a ball seen from a little above the equator, exact orthographic
// projection). A "line" on the sphere is a great circle (equator, meridians, any tilted great circle); a latitude
// circle other than the equator is not. Paths carry a letter at a visible point; the front half is solid, the back
// half dashed. The triangle option draws the equator and two meridians d degrees apart: two right angles at the
// equator and d degrees at the pole (angle sum 180 + d).
// Steps: k (the ball), paths (draw on), tri (the triangle and its angle labels), sum (the label of the sum).
import type { Canvas } from '../../../core/draw';
import { dot, strokePts } from '../../../core/draw';
import { clamp } from '../../../core/math';
import type { Paint } from '../../../core/theme';
import { wash } from '../../wash';
import { label } from './GeoFig';
import type { Pt } from './geo';

export interface GlobePath { kind: 'great' | 'lat'; /** lat: the latitude; great: inclination and node longitude */ lat?: number; inc?: number; node?: number; name?: string; col: Paint }
export interface GlobeParams { paths: GlobePath[]; tri?: number; /** label at the pole after the solve */ cx: number; cy: number; R: number; tilt?: number; spin?: number }
export interface GlobeLook { k?: number; paths?: number[]; tri?: number; triLabels?: number; glow?: number[] }

type V3 = [number, number, number];
const rad = (d: number) => (d * Math.PI) / 180;
export const sph = (lon: number, lat: number): V3 => [Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon))];
export function project(p: GlobeParams, v: V3): { P: Pt; front: boolean } {
  const s = rad(p.spin ?? 0), t = rad(p.tilt ?? 22);
  const x1 = v[0] * Math.cos(s) - v[2] * Math.sin(s), z1 = v[0] * Math.sin(s) + v[2] * Math.cos(s), y1 = v[1];
  const y2 = y1 * Math.cos(t) - z1 * Math.sin(t), z2 = y1 * Math.sin(t) + z1 * Math.cos(t);
  return { P: [p.cx + p.R * x1, p.cy - p.R * y2], front: z2 > -1e-9 };
}
/** points of a path (n + 1 samples around the circle) */
export function pathPts(g: GlobePath, n = 180): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (360 * i) / n;
    if (g.kind === 'lat') out.push(sph(t, g.lat ?? 0));
    else {
      const O = rad(g.node ?? 0), inc = rad(g.inc ?? 0), a: V3 = [Math.sin(O), 0, Math.cos(O)], e: V3 = [Math.sin(O + Math.PI / 2), 0, Math.cos(O + Math.PI / 2)];
      const b: V3 = [Math.cos(inc) * e[0], Math.sin(inc), Math.cos(inc) * e[2]];
      const c = Math.cos(rad(t)), s = Math.sin(rad(t));
      out.push([c * a[0] + s * b[0], c * a[1] + s * b[1], c * a[2] + s * b[2]]);
    }
  }
  return out;
}
/** a visible spot on a path for its letter: the front sample farthest from the other paths' letters */
export function pathLabelAt(p: GlobeParams, g: GlobePath, avoid: Pt[]): Pt {
  const P = pathPts(g, 72).map(v => project(p, v)).filter(x => x.front).map(x => x.P);
  let best = P[0] ?? [p.cx, p.cy], score = -1;
  for (const q of P) {
    const edge = p.R - Math.hypot(q[0] - p.cx, q[1] - p.cy);
    const s = Math.min(edge * 0.8 + 40, ...avoid.map(a => Math.hypot(a[0] - q[0], a[1] - q[1])));
    if (s > score && edge > 30) { score = s; best = q; }
  }
  return best;
}

export function drawGlobe(c: Canvas, p: GlobeParams, look: GlobeLook = {}): void {
  const k = clamp(look.k ?? 1);
  if (k <= 0) return;
  c.g.save(); c.g.globalAlpha *= k;
  const disk: Pt[] = Array.from({ length: 96 }, (_, i) => [p.cx + p.R * Math.cos((i / 96) * Math.PI * 2), p.cy + p.R * Math.sin((i / 96) * Math.PI * 2)]);
  wash(c, disk, '#2C3A78', { seed: 61, rough: 1, ink: 'ink', inkW: 3, shade: 0.28 });
  const hl: Pt[] = Array.from({ length: 48 }, (_, i) => [p.cx - p.R * 0.32 + p.R * 0.36 * Math.cos((i / 48) * Math.PI * 2), p.cy - p.R * 0.38 + p.R * 0.22 * Math.sin((i / 48) * Math.PI * 2)]);
  wash(c, hl, '#5A6AB0', { seed: 62, rough: 2, ink: null, alpha: 0.35, shade: 0 });
  // the spherical triangle: equator from 0 to d, meridians at 0 and d, the north pole
  const kt = clamp(look.tri ?? 0);
  if (p.tri && kt > 0) {
    const d = p.tri, edge: V3[] = [];
    for (let i = 0; i <= 30; i++) edge.push(sph((d * i) / 30, 0));
    for (let i = 0; i <= 30; i++) edge.push(sph(d, (90 * i) / 30));
    for (let i = 0; i <= 30; i++) edge.push(sph(0, 90 - (90 * i) / 30));
    const P = edge.map(v => project(p, v).P);
    wash(c, P, 'link', { seed: 64, rough: 0.8, ink: null, alpha: 0.32 * kt, shade: 0 });
    strokePts(c, P, { col: 'link', lw: 6, alpha: kt, closed: true });
    // right-angle marks at the equator, exact on the sphere
    const e = 9;
    for (const [lon, sg] of [[0, 1], [d, -1]] as const) {
      const q = [sph(lon + sg * e, 0), sph(lon + sg * e, e), sph(lon, e)].map(v => project(p, v).P);
      strokePts(c, q, { col: 'first', lw: 4.5, alpha: kt });
    }
    const kl = clamp(look.triLabels ?? 0);
    label(c, '90°', project(p, sph(d * 0.22, 14)).P, 60, 'first', kl);
    label(c, '90°', project(p, sph(d * 0.78, 14)).P, 60, 'first', kl);
    const pole = project(p, sph(0, 90)).P;
    label(c, `${d}°`, [pole[0], pole[1] - 58], 60, 'second', kl);
    dot(c, pole[0], pole[1], 8, 'ink', kt);
  }
  const avoid: Pt[] = [];
  p.paths.forEach((g, i) => {
    const kp = clamp(look.paths?.[i] ?? 1);
    if (kp <= 0) return;
    const S = pathPts(g).map(v => project(p, v));
    const gl = look.glow?.[i] ?? 0;
    // split into front runs (solid) and back runs (dashed)
    let run: Pt[] = [], front = S[0]!.front;
    const flush = () => { if (run.length > 1) strokePts(c, run, front ? { col: g.col, lw: 6 + 2 * gl, alpha: kp, glow: gl > 0 ? 16 * gl : 0 } : { col: g.col, lw: 3, alpha: kp * 0.45, dash: [10, 12], cap: 'butt' }); };
    for (const s of S) { if (s.front !== front) { run.push(s.P); flush(); run = [s.P]; front = s.front; } else run.push(s.P); }
    flush();
    if (g.name) { const at = pathLabelAt(p, g, avoid); avoid.push(at); const off: Pt = [at[0] + (at[0] < p.cx ? -34 : 34), at[1] - 34]; label(c, g.name, off, 56, g.col, kp, true); }
  });
  c.g.restore();
}
