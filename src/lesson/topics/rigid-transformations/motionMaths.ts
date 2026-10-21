// motionMaths.ts: the exact maths of rigid motions on the coordinate plane (pure, no DOM).
//   Motion    T = translation by (a, b); R = rotation about c by deg (counterclockwise positive); M = reflection across
//             the line through p and q; S = a NON-rigid map (stretch / dilation about c by sx, sy) for contrast
//   apply     the image of a point (exact integers for quarter turns and axis-parallel or 45° mirror lines)
//   at        the point part-way through the motion (k 0..1): slide, turn, or the fold of a flip
//   identify  which single rigid motion maps a labelled figure onto its image (or null), from corresponding points
//   checks    distances, angles, orientation (vertex order), straightness, parallelism
export type V = readonly [number, number];
export type Motion =
  | { kind: 'T'; a: number; b: number }
  | { kind: 'R'; c: V; deg: number }
  | { kind: 'M'; p: V; q: V }
  | { kind: 'S'; c: V; sx: number; sy: number };

const EPS = 1e-9;
/** snap float noise to integers / clean values */
export const clean = (v: number): number => { const r = Math.round(v); return Math.abs(v - r) < 1e-9 ? r + 0 : Math.round(v * 1e9) / 1e9 + 0; };
/** snap to a whole number when within 1e-6 (centers and angles found from float data) */
const snap = (v: number): number => { const r = Math.round(v); return Math.abs(v - r) < 1e-6 ? r + 0 : v; };
export const cleanV = (p: V): V => [clean(p[0]), clean(p[1])];
export const eqV = (a: V, b: V, eps = 1e-7): boolean => Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1]];
export const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const dist = (a: V, b: V): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerpV = (a: V, b: V, k: number): V => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const cross = (a: V, b: V): number => a[0] * b[1] - a[1] * b[0];
const dotp = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1];

/** rotate p about c by deg counterclockwise; exact for multiples of 90 */
export function rot(p: V, c: V, deg: number): V {
  const d = ((Math.round(deg * 1e6) / 1e6) % 360 + 360) % 360;
  const x = p[0] - c[0], y = p[1] - c[1];
  if (d === 0) return [p[0], p[1]];
  if (d === 90) return [c[0] - y, c[1] + x];
  if (d === 180) return [c[0] - x, c[1] - y];
  if (d === 270) return [c[0] + y, c[1] - x];
  const t = (deg * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
  return cleanV([c[0] + x * cs - y * sn, c[1] + x * sn + y * cs]);
}
/** reflect p across the line through a and b */
export function reflect(p: V, a: V, b: V): V {
  const d = sub(b, a), L = dotp(d, d);
  if (L < EPS) throw new Error('reflect: the mirror line needs two different points');
  const t = dotp(sub(p, a), d) / L;
  const f: V = [a[0] + d[0] * t, a[1] + d[1] * t];
  return cleanV([2 * f[0] - p[0], 2 * f[1] - p[1]]);
}
export function apply(m: Motion, p: V): V {
  switch (m.kind) {
    case 'T': return cleanV([p[0] + m.a, p[1] + m.b]);
    case 'R': return rot(p, m.c, m.deg);
    case 'M': return reflect(p, m.p, m.q);
    case 'S': return cleanV([m.c[0] + (p[0] - m.c[0]) * m.sx, m.c[1] + (p[1] - m.c[1]) * m.sy]);
  }
}
export const applyAll = (m: Motion, P: readonly V[]): V[] => P.map(p => apply(m, p));
/** the point part-way through the motion: a slide, a turn about the center, or the fold of a flip (straight across) */
export function at(m: Motion, p: V, k: number): V {
  if (k <= 0) return p;
  if (k >= 1) return apply(m, p);
  if (m.kind === 'T') return [p[0] + m.a * k, p[1] + m.b * k];
  if (m.kind === 'R') { const t = (m.deg * k * Math.PI) / 180, x = p[0] - m.c[0], y = p[1] - m.c[1]; return [m.c[0] + x * Math.cos(t) - y * Math.sin(t), m.c[1] + x * Math.sin(t) + y * Math.cos(t)]; }
  return lerpV(p, apply(m, p), k);
}
export const isRigid = (m: Motion): boolean => m.kind !== 'S' || (Math.abs(Math.abs(m.sx) - 1) < EPS && Math.abs(Math.abs(m.sy) - 1) < EPS);

// ---------- measures ----------
/** twice the signed area: > 0 when the vertices go counterclockwise (y up) */
export function area2(P: readonly V[]): number { let s = 0; for (let i = 0; i < P.length; i++) s += cross(P[i]!, P[(i + 1) % P.length]!); return s; }
export const orient = (P: readonly V[]): 1 | -1 | 0 => { const a = area2(P); return a > EPS ? 1 : a < -EPS ? -1 : 0; };
/** the interior angle at vertex i of a polygon, degrees */
export function angleAt(P: readonly V[], i: number): number {
  const n = P.length, a = P[(i - 1 + n) % n]!, b = P[i]!, c = P[(i + 1) % n]!;
  const u = sub(a, b), v = sub(c, b);
  return clean((Math.acos(Math.max(-1, Math.min(1, dotp(u, v) / (Math.hypot(...u) * Math.hypot(...v))))) * 180) / Math.PI);
}
export const collinear = (a: V, b: V, c: V): boolean => Math.abs(cross(sub(b, a), sub(c, a))) < 1e-7;
export const parallel = (a: V, b: V, c: V, d: V): boolean => Math.abs(cross(sub(b, a), sub(d, c))) < 1e-7;
export const centroid = (P: readonly V[]): V => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];

/** every pairwise distance kept (the definition of a rigid image) */
export function keepsDistances(P: readonly V[], Q: readonly V[]): boolean {
  if (P.length !== Q.length) return false;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) if (Math.abs(dist(P[i]!, P[j]!) - dist(Q[i]!, Q[j]!)) > 1e-7) return false;
  return true;
}

/** the single rigid motion that maps P onto Q point by point (P[i] -> Q[i]), or null (none, or not rigid) */
export function identify(P: readonly V[], Q: readonly V[]): Motion | null {
  if (P.length !== Q.length || P.length < 2 || !keepsDistances(P, Q)) return null;
  const d0 = sub(Q[0]!, P[0]!);
  if (P.every((p, i) => eqV(sub(Q[i]!, p), d0))) return { kind: 'T', a: clean(d0[0]), b: clean(d0[1]) };
  const o = P.length >= 3 ? orient(P) * orient(Q) : 0;
  const tryM = (m: Motion) => (P.every((p, i) => eqV(apply(m, p), Q[i]!, 1e-6)) ? m : null);
  // a flip: the perpendicular bisector of a moved point and its image
  if (o <= 0) {
    const i = P.findIndex((p, j) => !eqV(p, Q[j]!));
    const m = mid(P[i]!, Q[i]!), d = sub(Q[i]!, P[i]!);
    const r = tryM({ kind: 'M', p: [snap(m[0]), snap(m[1])], q: [snap(m[0] - d[1]), snap(m[1] + d[0])] });
    if (r) return r;
  }
  // a turn: the center lies on the perpendicular bisectors of AA' and BB'
  if (o >= 0) {
    const moved = P.map((p, j) => j).filter(j => !eqV(P[j]!, Q[j]!));
    const fixed = P.findIndex((p, j) => eqV(p, Q[j]!));
    let c: V | null = fixed >= 0 ? P[fixed]! : null;
    if (!c && moved.length >= 2) {
      for (let x = 0; x < moved.length && !c; x++) for (let y = x + 1; y < moved.length && !c; y++) {
        const i = moved[x]!, j = moved[y]!;
        const m1 = mid(P[i]!, Q[i]!), n1 = sub(Q[i]!, P[i]!), m2 = mid(P[j]!, Q[j]!), n2 = sub(Q[j]!, P[j]!);
        // n1 . X = n1 . m1 and n2 . X = n2 . m2
        const det = n1[0] * n2[1] - n1[1] * n2[0];
        if (Math.abs(det) < 1e-6 * Math.hypot(...n1) * Math.hypot(...n2)) continue;   // AA' parallel to BB': try another pair
        const r1 = dotp(n1, m1), r2 = dotp(n2, m2);
        c = [snap((r1 * n2[1] - n1[1] * r2) / det), snap((n1[0] * r2 - r1 * n2[0]) / det)];
      }
    }
    if (c) {
      const i = moved[0]!;
      const deg = snap((Math.atan2(cross(sub(P[i]!, c), sub(Q[i]!, c)), dotp(sub(P[i]!, c), sub(Q[i]!, c))) * 180) / Math.PI);
      const r = tryM({ kind: 'R', c, deg: deg <= -180 + EPS ? 180 : deg });
      if (r) return r;
    }
  }
  return null;
}

// ---------- words and TeX ----------
export const sgn = (v: number): string => (v < 0 ? `−${-v}` : String(v));
/** (x, y) for HTML, with real minus signs */
export const pt = (p: V): string => `(${sgn(clean(p[0]))}, ${sgn(clean(p[1]))})`;
/** (x, y) in TeX */
export const ptTex = (p: V): string => `(${clean(p[0])}, ${clean(p[1])})`;
export const dirWord = (deg: number): string => (deg > 0 ? 'counterclockwise' : 'clockwise');
/** a translation in words: "3 right and 2 down" */
export function slideWords(a: number, b: number): string {
  const h = a === 0 ? '' : `${Math.abs(a)} ${a > 0 ? 'right' : 'left'}`, v = b === 0 ? '' : `${Math.abs(b)} ${b > 0 ? 'up' : 'down'}`;
  return h && v ? `${h} and ${v}` : h || v || 'nowhere';
}
/** the name of a mirror line that is axis-parallel or at 45° */
export function lineName(p: V, q: V): string {
  if (Math.abs(p[0] - q[0]) < EPS) return p[0] === 0 ? 'the y-axis' : `x = ${sgn(p[0])}`;
  if (Math.abs(p[1] - q[1]) < EPS) return p[1] === 0 ? 'the x-axis' : `y = ${sgn(p[1])}`;
  const s = (q[1] - p[1]) / (q[0] - p[0]), c = clean(p[1] - s * p[0]);
  const cs = c === 0 ? '' : c > 0 ? ` + ${c}` : ` − ${-c}`;
  if (Math.abs(s - 1) < EPS) return `y = x${cs}`;
  if (Math.abs(s + 1) < EPS) return `y = −x${cs}`;
  return 'line m';
}
export function describe(m: Motion, centerName = 'P'): string {
  switch (m.kind) {
    case 'T': return `a translation ${slideWords(m.a, m.b)}`;
    case 'M': return `a reflection across ${lineName(m.p, m.q)}`;
    case 'R': {
      const d = ((m.deg % 360) + 360) % 360;
      const where = m.c[0] === 0 && m.c[1] === 0 ? 'the origin' : centerName;
      return d === 180 ? `a 180° rotation about ${where}` : `a ${Math.abs(m.deg)}° ${dirWord(m.deg)} rotation about ${where}`;
    }
    case 'S': return `a stretch`;
  }
}
