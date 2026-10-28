// tri.ts: the exact maths of "Triangle congruence" (Geometry, lesson 4). Pure: no DOM, no canvas.
//   triangles      built from SSS / SAS / ASA data (model units, y up), sides and angles by index
//                  (vertex i, angle i at vertex i, side i opposite vertex i: between vertices i+1 and i+2)
//   rigid motions  rotate, reflect, translate; a motion that carries one triangle onto another (for the animations)
//   criteria       the pattern of three corresponding pairs (SSS, SAS, ASA, AAS, HL or none for AAA / SSA) and every
//                  criterion the known pairs reach once the third angle (and, for right triangles, the third side)
//                  are derived: a choice list never offers a second criterion that also works
//   figures        buildFig: named points, segments, tick / arc / box marks (marks are checked: every tick group has
//                  equal lengths, every arc group equal measures, every box 90°), letters in the widest gap
// The figure block itself is the course's GeoFig (geometry-foundations/geo.ts + GeoFig.ts), used read-only.
import { type Fig, type GAngle, type GPoint, type GSeg, type MarkCol, type Pt, add, at, dirv, dist, measure, meet, mul, norm, rotP, sub } from '../geometry-foundations/geo';
import { oppositeGap } from '../geometry-foundations/figs';

export type Tri = [Pt, Pt, Pt];
export const side = (T: Tri, i: number): number => dist(T[(i + 1) % 3]!, T[(i + 2) % 3]!);
export const angle = (T: Tri, i: number): number => measure(T[i]!, T[(i + 1) % 3]!, T[(i + 2) % 3]!);
export const centroid = (P: readonly Pt[]): Pt => mul(P.reduce((a, b) => add(a, b), [0, 0] as Pt), 1 / P.length);

/** V0 at the origin, V1 at (c, 0); angles A at V0 and B at V1; V2 above */
export function triASA(A: number, c: number, B: number): Tri {
  return [[0, 0], [c, 0], meet([0, 0], dirv(A), [c, 0], dirv(180 - B))];
}
/** sides a (opposite V0), b (opposite V1), c (opposite V2) */
export function triSSS(a: number, b: number, c: number): Tri {
  const x = (b * b + c * c - a * a) / (2 * c), y = Math.sqrt(Math.max(0, b * b - x * x));
  return [[0, 0], [c, 0], [x, y]];
}
/** sides c = V0V1 and b = V0V2 with the angle A between them at V0 */
export function triSAS(c: number, A: number, b: number): Tri { return [[0, 0], [c, 0], at([0, 0], A, b)]; }

// ---------- rigid motions ----------
export interface Motion { rot: number; flip: boolean; off: Pt }
export const move = (p: Pt, m: Motion): Pt => add(rotP(m.flip ? [p[0], -p[1]] : p, m.rot), m.off);
export const moveT = (T: Tri, m: Motion): Tri => T.map(p => move(p, m)) as Tri;
export const turnT = (T: Tri, deg: number): Tri => { const c = centroid(T); return T.map(p => rotP(p, deg, c)) as Tri; };
export const shiftT = (T: Tri, d: Pt): Tri => T.map(p => add(p, d)) as Tri;
export function bbox(P: readonly Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
/** T2 moved beside T1: to the right (row) or below (col), centred on the other axis */
export function beside(T1: Tri, T2: Tri, layout: 'row' | 'col', gap = 190): Tri {
  const a = bbox(T1), b = bbox(T2);
  if (layout === 'row') return shiftT(T2, [a.x1 + gap - b.x0, (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2]);
  return shiftT(T2, [(a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2, a.y0 - gap - b.y1]);
}

/** a random scalene triangle: angles in [38, 100], no two sides within 9 % (no accidental look-alike pairs) */
export function randTri(R: () => number, o: { base?: number; turn?: boolean; right?: boolean; minA?: number } = {}): Tri {
  const r = (lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
  for (let t = 0; t < 200; t++) {
    const lo = o.minA ?? 38;
    const A = o.right ? 90 : r(lo, 98), B = r(lo, 92), C = 180 - A - B;
    if (C < lo || C > 100) continue;
    if (!o.right && [A, B, C].some(x => Math.abs(x - 90) < 3)) continue;
    const T = triASA(A, o.base ?? r(300, 360), B);
    const s = [0, 1, 2].map(i => side(T, i)).sort((x, y) => x - y);
    if (s[1]! / s[0]! < 1.09 || s[2]! / s[1]! < 1.09) continue;
    return o.turn === false ? T : turnT(T, r(0, 359));
  }
  return triASA(50, 320, 70);
}

// ---------- criteria ----------
export type Crit = 'SSS' | 'SAS' | 'ASA' | 'AAS' | 'HL' | 'none';
/** a corresponding pair: side i or angle i (the same index in both triangles); right = both angles are marked right */
export interface Part { k: 's' | 'a'; i: number; right?: boolean }
export const CRITS: Crit[] = ['SSS', 'SAS', 'ASA', 'AAS', 'HL'];
/** the pattern of exactly three pairs */
export function critOf(parts: readonly Part[]): Crit {
  if (parts.length !== 3) throw new Error('three pairs');
  const S = parts.filter(p => p.k === 's').map(p => p.i), A = parts.filter(p => p.k === 'a');
  if (new Set(S).size !== S.length || new Set(A.map(a => a.i)).size !== A.length) throw new Error('a part twice');
  if (S.length === 3) return 'SSS';
  if (A.length === 3) return 'none';
  if (S.length === 2) {
    const m = [0, 1, 2].find(i => !S.includes(i))!, a = A[0]!;
    if (a.i === m) return 'SAS';
    return a.right ? 'HL' : 'none';
  }
  const s = S[0]!, js = A.map(a => a.i);
  return js.includes(s) ? 'AAS' : 'ASA';
}
/** the known pairs plus what follows at once: the third angle from two angles, the third side of a right triangle */
export function derived(parts: readonly Part[]): Part[] {
  const out = parts.slice();
  const angs = () => out.filter(p => p.k === 'a').map(p => p.i);
  if (angs().length === 2) out.push({ k: 'a', i: [0, 1, 2].find(i => !angs().includes(i))! });
  const right = out.find(p => p.k === 'a' && p.right);
  const sides = out.filter(p => p.k === 's').map(p => p.i);
  if (right && sides.length === 2) out.push({ k: 's', i: [0, 1, 2].find(i => !sides.includes(i))! });
  return out;
}
/** every criterion that some three of the (derived) pairs meet */
export function critsOf(parts: readonly Part[]): Set<Crit> {
  const D = derived(parts), out = new Set<Crit>();
  for (let a = 0; a < D.length; a++) for (let b = a + 1; b < D.length; b++) for (let c = b + 1; c < D.length; c++) {
    const k = critOf([D[a]!, D[b]!, D[c]!]);
    if (k !== 'none') out.add(k);
  }
  return out;
}
export const CRIT_WORD: Record<Crit, string> = { SSS: 'SSS', SAS: 'SAS', ASA: 'ASA', AAS: 'AAS', HL: 'HL', none: 'Not enough information' };

// ---------- names and notation ----------
export const ov = (s: string) => `\\overline{${s}}`;
/** panel text: a segment name with real combining overlines (survives plain text) */
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
export const angN = (s: string) => `∠${s}`;
export const triN = (s: string) => `△${s}`;
export const triT = (s: string) => `\\triangle ${s}`;
/** side i of a triangle named n (letters in vertex order) */
export const sideName = (n: string, i: number) => n[(i + 1) % 3]! + n[(i + 2) % 3]!;
/** angle i named by three letters (vertex in the middle) or by its vertex letter */
export const angName3 = (n: string, i: number) => n[(i + 1) % 3]! + n[i]! + n[(i + 2) % 3]!;
export const partHtml = (n: string, p: Part) => (p.k === 's' ? segN(sideName(n, p.i)) : angN(n[p.i]!));
export const partTex = (n: string, p: Part) => (p.k === 's' ? ov(sideName(n, p.i)) : `\\angle ${n[p.i]}`);
export const pairHtml = (n1: string, n2: string, p: Part) => `${partHtml(n1, p)} ≅ ${partHtml(n2, p)}`;
export const pairTex = (n1: string, n2: string, p: Part) => `${partTex(n1, p)} \\cong ${partTex(n2, p)}`;

/** point letters (never I, L, O) */
export const POOL = 'ABCDEFGHJKMNPQRSTUVWXYZ';
/** n distinct letters in alphabetical order (a figure reads in order) */
export function pickLetters(R: () => number, n: number, avoid = ''): string {
  const pool = [...POOL].filter(c => !avoid.includes(c)), out: string[] = [];
  while (out.length < n) { const c = pool[Math.floor(R() * pool.length)]!; if (!out.includes(c)) out.push(c); }
  return out.sort().join('');
}
/** letters for two triangles: the first three and the last three of six letters in order */
export function names2(R: () => number): [string, string] { const s = pickLetters(R, 6); return [s.slice(0, 3), s.slice(3)]; }
/** a relabelling of a figure's role letters (e.g. 'ABCDE') to random letters; `keep` roles stay as they are */
export function relabeler(R: () => number, roles: string, keep = ''): (s: string) => string {
  const free = [...roles].filter(c => !keep.includes(c));
  const L = pickLetters(R, free.length, keep);
  const map: Record<string, string> = {};
  free.forEach((c, i) => { map[c] = L[i]!; });
  return (s: string) => s.replace(/[A-Z]/g, ch => map[ch] ?? ch);
}
/** a relabelling applied to prose: only point-name tokens (1-3 capitals standing alone, never a criterion name)
 *  change; the prose must not use the article "A" */
export function tw(s: string, t: (s: string) => string): string {
  return s.replace(/(?<![A-Za-z])[A-Z]{1,3}(?![A-Za-z])/g, m => (/^(SSS|SAS|ASA|AAS|HL|AAA|SSA)$/.test(m) ? m : t(m)));
}
/** a figure with its point letters relabelled (point names, segment and angle ids) */
export function mapFig(f: Fig, t: (s: string) => string): Fig {
  return { ...f, points: f.points.map(p => ({ ...p, name: t(p.name) })), segs: f.segs.map(x => ({ ...x, id: x.id ? t(x.id) : x.id })), angles: f.angles.map(a => ({ ...a, id: t(a.id) })) };
}
/** letter sets for two triangles (6 distinct letters; never I, L, O) */
export const NAME_SETS: [string, string][] = [['ABC', 'DEF'], ['PQR', 'STU'], ['JKM', 'XYZ'], ['GHJ', 'RST'], ['ABC', 'XYZ'], ['DEF', 'PQR'], ['KMN', 'UVW']];
/** a permutation of [0,1,2] */
export const PERMS: [number, number, number][] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
/** the second triangle's letters re-assigned so that vertex i of T2 gets letter L[perm[i]] (a scrambled statement) */
export const permName = (L: string, perm: readonly number[]) => perm.map(k => L[k]!).join('');

// ---------- figures ----------
export interface FMark {
  /** a segment "AB" (as listed in segs, either order) */
  seg?: string;
  /** an angle "ABC" (vertex in the middle) */
  ang?: string;
  /** ticks / arcs (1-3) */
  n?: number;
  box?: boolean;
  /** parallel chevrons on a segment */
  par?: number;
  text?: string;
  col?: MarkCol;
  r?: number;
  /** a mark that is not a congruence group (a lone labelled angle) */
  lone?: boolean;
}
export interface FigSpec {
  pts: Record<string, Pt>;
  segs: string[];
  marks?: FMark[];
  /** washed bodies (polygons by letters) */
  fills?: { pts: string; col?: MarkCol | 'body'; alpha?: number }[];
  /** letter direction overrides (degrees) and distance */
  dirs?: Record<string, number>;
  dist?: Record<string, number>;
  /** points drawn without a letter or a dot (construction points) */
  bare?: string[];
  /** extra segments (arcs as polylines, dashed helpers) */
  extra?: GSeg[];
  /** per segment: colour / dash / kind / a length label */
  segStyle?: Record<string, Partial<GSeg>>;
  pad?: number;
}
const segKey = (segs: readonly string[], s: string) => segs.find(x => x === s || x === s[1]! + s[0]!);
/** the figure; throws when a mark group is not exact (equal ticks, equal arcs, boxes at 90°) */
export function buildFig(s: FigSpec): Fig {
  const P = (n: string): Pt => { const p = s.pts[n]; if (!p) throw new Error(`no point ${n}`); return p; };
  const marks = s.marks ?? [];
  const segs: GSeg[] = s.segs.map(id => {
    const m = marks.filter(x => x.seg && segKey([id], x.seg));
    const tick = m.find(x => x.n && !x.par), par = m.find(x => x.par), txt = m.find(x => x.text);
    const st = s.segStyle?.[id] ?? {};
    const a = P(id[0]!), b = P(id[1]!);
    const C = centroid(Object.values(s.pts));
    const mid = mul(add(a, b), 0.5), d = sub(b, a), left: Pt = [-d[1], d[0]];
    const out = (mid[0] - C[0]) * left[0] + (mid[1] - C[1]) * left[1] > 0 ? 1 : -1;
    return { id, a, b, ticks: tick?.n, par: par?.par, parAt: par ? 0.3 : undefined, text: txt?.text, side: out as 1 | -1, col: tick?.col ?? txt?.col, ...st };
  });
  for (const m of marks) if (m.seg && !segKey(s.segs, m.seg)) throw new Error(`mark on a missing segment ${m.seg}`);
  const angles: GAngle[] = marks.filter(m => m.ang).map(m => {
    const [p, v, q] = [...m.ang!];
    return { id: m.ang!, v: P(v!), p: P(p!), q: P(q!), arcs: m.box ? undefined : m.lone ? 0 : (m.n ?? 1), box: m.box, text: m.text, col: m.col, r: m.r, bare: false };
  });
  // exactness: every tick group equal, every arc group equal, every box a right angle
  const groups = new Map<string, number[]>();
  for (const m of marks) {
    if (m.lone || m.par) continue;
    if (m.seg && m.n) { const k = 's' + m.n; groups.set(k, [...(groups.get(k) ?? []), dist(P(m.seg[0]!), P(m.seg[1]!))]); }
    if (m.ang && m.box) { const [p, v, q] = [...m.ang]; const x = measure(P(v!), P(p!), P(q!)); if (Math.abs(x - 90) > 1e-6) throw new Error(`box at ${m.ang} is ${x.toFixed(2)}°`); }
    if (m.ang && !m.box) { const [p, v, q] = [...m.ang]; const k = 'a' + (m.n ?? 1); groups.set(k, [...(groups.get(k) ?? []), measure(P(v!), P(p!), P(q!))]); }
  }
  for (const [k, v] of groups) if (Math.max(...v) - Math.min(...v) > 1e-6 * Math.max(1, ...v)) throw new Error(`mark group ${k} is not equal: ${v.map(x => x.toFixed(3)).join(', ')}`);
  // letters in the widest gap between a point's segments
  const points: GPoint[] = Object.entries(s.pts).filter(([n]) => !(s.bare ?? []).includes(n)).map(([n, p]) => {
    const nb = [...s.segs, ...(s.extra ?? []).filter(e => e.id?.length === 2).map(e => e.id!)].filter(id => id.includes(n)).map(id => (id[0] === n ? id[1]! : id[0]!)).filter(x => s.pts[x]);
    const dirs = nb.map(x => { const d = sub(P(x), p); return norm((Math.atan2(d[1], d[0]) * 180) / Math.PI); });
    const dir = s.dirs?.[n] ?? (dirs.length ? oppositeGap(dirs) : 90);
    return { at: p, name: n, dir, dist: s.dist?.[n] ?? 46 };
  });
  const fills = (s.fills ?? []).map(f => ({ pts: [...f.pts].map(P), col: f.col ?? ('body' as const), alpha: f.alpha }));
  return { segs: [...segs, ...(s.extra ?? [])], angles, points, fills, pad: s.pad ?? 80 };
}
/** a circle (or an arc from d0 to d1 degrees) as short segments */
export function circleSegs(id: string, c: Pt, r: number, o: { d0?: number; d1?: number; col?: MarkCol | 'faint' | 'ink'; n?: number } = {}): GSeg[] {
  const d0 = o.d0 ?? 0, d1 = o.d1 ?? 360, n = o.n ?? Math.max(12, Math.ceil(Math.abs(d1 - d0) / 5));
  return Array.from({ length: n }, (_, k) => ({ id: `${id}~${k}`, a: at(c, d0 + ((d1 - d0) * k) / n, r), b: at(c, d0 + ((d1 - d0) * (k + 1)) / n, r), col: o.col ?? 'second' }));
}

/** a marked pair of corresponding parts in a two-triangle figure */
export interface PMark { k: 's' | 'a'; i: number; n?: number; box?: boolean; /** only in one triangle (0 or 1) */ only?: 0 | 1; /** the part of T2 if it is not the corresponding one */ j?: number; text1?: string; text2?: string; col?: MarkCol }
/** two triangles: T1 named n1, T2 named n2 (vertex i of T2 corresponds to vertex i of T1) */
export function pairFig(T1: Tri, T2: Tri, n1: string, n2: string, marks: readonly PMark[], o: { texts?: { t: 0 | 1; k: 's' | 'a'; i: number; text: string }[]; pad?: number } = {}): Fig {
  const pts: Record<string, Pt> = {};
  [0, 1, 2].forEach(i => { pts[n1[i]!] = T1[i]!; pts[n2[i]!] = T2[i]!; });
  const segs = [0, 1, 2].flatMap(i => [sideName(n1, i), sideName(n2, i)]);
  const fm: FMark[] = [];
  for (const m of marks) {
    for (const t of [0, 1] as const) {
      if (m.only !== undefined && m.only !== t) continue;
      const nm = t === 0 ? n1 : n2, idx = t === 1 && m.j !== undefined ? m.j : m.i;
      const text = t === 0 ? m.text1 : m.text2;
      if (m.k === 's') fm.push({ seg: sideName(nm, idx), n: m.n, text, col: m.col });
      else fm.push({ ang: angName3(nm, idx), n: m.n, box: m.box, text, col: m.col });
    }
  }
  for (const x of o.texts ?? []) {
    const nm = x.t === 0 ? n1 : n2, id = x.k === 's' ? sideName(nm, x.i) : angName3(nm, x.i);
    const had = fm.find(m => (x.k === 's' ? m.seg === id : m.ang === id));
    if (had) { had.text = x.text; continue; }
    if (x.k === 's') fm.push({ seg: id, text: x.text, lone: true });
    else fm.push({ ang: id, text: x.text, lone: true });
  }
  const f = buildFig({ pts, segs, marks: fm, fills: [{ pts: n1 }, { pts: n2 }], pad: o.pad ?? 80 });
  // a length label sits outside its own triangle
  const C1 = centroid(T1), C2 = centroid(T2);
  f.segs = f.segs.map(s => {
    const C = n1.includes(s.id![0]!) ? C1 : C2, mid = mul(add(s.a, s.b), 0.5), d = sub(s.b, s.a);
    return { ...s, side: ((mid[0] - C[0]) * -d[1] + (mid[1] - C[1]) * d[0] > 0 ? 1 : -1) as 1 | -1 };
  });
  return f;
}
/** a congruent second triangle: T1 moved by a random rotation, maybe a reflection, placed beside T1 */
export function copyBeside(R: () => number, T1: Tri, layout: 'row' | 'col', o: { flip?: boolean } = {}): { T2: Tri; flip: boolean } {
  const flip = o.flip ?? R() < 0.5;
  const T2 = moveT(T1, { rot: Math.floor(R() * 360), flip, off: [0, 0] });
  return { T2: beside(T1, T2, layout), flip };
}
