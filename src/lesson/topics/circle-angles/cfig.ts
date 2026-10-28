// cfig.ts: the circle figure of "Arcs and angles in circles" (Geometry, lesson 12), the pure half (no DOM). A CFig is
// one or more circles plus the course's exact figure (geometry-foundations/geo.ts Fig: chords, radii, tangent and
// secant lines, angle marks at their true measure, point letters) plus ARCS: a stretch of a circle between two
// points, highlighted in a colour role and labelled outside the circle with its measure ("84°", "?", "(2x + 6)°").
// Every arc is drawn at its true measure (a label "84°" on an arc of 83° throws), every labelled angle at its measure
// (geo.ts figProblems), and the layout refuses a label that leaves the frame, touches a line, the circle, an arc mark
// or another label. The draw half is CircleFig.ts.
//
// API (for chords-tangents, arcs-and-sectors, circle-equations as well):
//   cfig(spec)                    build a figure: points ON the circle by angle (degrees, ccw from east), free
//                                 points, segments, lines through two points (extended past both), tangent lines at
//                                 a point, angles, arcs (ccw from one named point to another)
//   cfLayout(cf, fr)              the fit and the full layout figure (circle polylines + arc labels as words)
//   cfProblems(cf, fr)            what breaks the readability rules (empty = fine)
//   repairCF(cf, fr)              moves point letters that collide to a free direction, returns what is left
//   mapCF(cf, t)                  the figure with its point letters relabelled
//   onCircle(cf, name) / arcOf    queries the families use for their checks
// Model coordinates are px-like with y UP (geo.ts).
import { type Fig, type Fit, type Frame, type GAngle, type GPoint, type GSeg, type GWord, type MarkCol, type Pt, add, angOf, at, dirv, dist, fitFig, figProblems, measure, mul, norm, sub, textW, unit } from '../geometry-foundations/geo';
import { mapFig } from '../triangle-congruence/tri';

export interface CArc {
  id: string;
  /** ccw from angle a to angle b (degrees, on circle `c`) */
  a: number; b: number;
  c?: number;
  col?: MarkCol;
  text?: string;
  /** the label after the solve */
  alt?: string;
  /** drawn only in the worked solution */
  solve?: boolean;
  /** a thin mark (an arc the item only names) instead of the thick highlight */
  thin?: boolean;
}
export interface CCircle { O: Pt; R: number }
export interface CFig { circles: CCircle[]; fig: Fig; arcs: CArc[] }

export const R0 = 300;
/** a point on circle cc at angle deg */
export const onC = (cc: CCircle, deg: number): Pt => at(cc.O, deg, cc.R);
export const span = (a: number, b: number): number => { const s = norm(b - a); return s === 0 ? 360 : s; };

export interface SegSpec {
  id: string;
  kind?: 'seg' | 'ray' | 'line';
  /** a line / ray: model units beyond each end (a line through the two points) */
  ext?: [number, number];
  col?: MarkCol | 'ink' | 'faint';
  dash?: boolean; ticks?: number; text?: string; alt?: string; side?: 1 | -1; solve?: boolean; name?: string;
}
export interface AngSpec { id: string; text?: string; alt?: string; col?: MarkCol; box?: boolean; arcs?: number; r?: number; lab?: number; solve?: 'only'; bare?: boolean }
export interface ArcSpec { id?: string; from: string; to: string; col?: MarkCol; text?: string; alt?: string; solve?: boolean; thin?: boolean; c?: number }
export interface CSpec {
  R?: number;
  /** the centre's letter ('' = a centre without a dot; null = no centre at all) */
  center?: string | null;
  /** points on circle 0: name -> angle */
  on?: Record<string, number>;
  /** free points (exterior points, a point inside) */
  pts?: Record<string, Pt>;
  /** more circles (the similarity items): circle i >= 1 */
  more?: CCircle[];
  /** points on a further circle: name -> [circle index, angle] */
  onMore?: Record<string, [number, number]>;
  segs?: (string | SegSpec)[];
  /** a tangent line at a point of circle 0: model units each way */
  tangents?: { at: string; len?: [number, number]; col?: MarkCol | 'ink'; id?: string; name?: string }[];
  angles?: AngSpec[];
  arcs?: ArcSpec[];
  dirs?: Record<string, number>;
  /** points drawn without a letter (and without a dot) */
  bare?: string[];
  pad?: number;
}

/** build a circle figure; throws when an arc or an angle is not drawn at its label's measure */
export function cfig(s: CSpec): CFig {
  const R = s.R ?? R0;
  const c0: CCircle = { O: [0, 0], R };
  const circles = [c0, ...(s.more ?? [])];
  const P: Record<string, Pt> = {};
  const deg: Record<string, [number, number]> = {};
  for (const [n, d] of Object.entries(s.on ?? {})) { P[n] = onC(c0, d); deg[n] = [0, norm(d)]; }
  for (const [n, [ci, d]] of Object.entries(s.onMore ?? {})) { P[n] = onC(circles[ci]!, d); deg[n] = [ci, norm(d)]; }
  for (const [n, p] of Object.entries(s.pts ?? {})) P[n] = p;
  if (s.center) P[s.center] = c0.O;
  const pt = (n: string): Pt => { const p = P[n]; if (!p) throw new Error(`cfig: no point ${n}`); return p; };
  const segs: GSeg[] = (s.segs ?? []).map(x => {
    const o: SegSpec = typeof x === 'string' ? { id: x } : x;
    let a = pt(o.id[0]!), b = pt(o.id[1]!);
    if (o.ext) { const u = unit(sub(b, a)); a = add(a, mul(u, -o.ext[0])); b = add(b, mul(u, o.ext[1])); }
    const { id, kind, col, dash, ticks, text, alt, side, solve, name } = o;
    return { id, a, b, kind: kind ?? (o.ext ? 'line' : 'seg'), col, dash, ticks, text, alt, side, solve, name };
  });
  for (const t of s.tangents ?? []) {
    const T = pt(t.at), d = deg[t.at];
    if (!d) throw new Error(`cfig: tangent at ${t.at}, which is not on a circle`);
    const u = dirv(d[1] + 90), [l0, l1] = t.len ?? [R * 0.9, R * 0.9];
    segs.push({ id: t.id ?? `t${t.at}`, a: add(T, mul(u, -l0)), b: add(T, mul(u, l1)), kind: 'line', col: t.col, name: t.name });
  }
  const angles: GAngle[] = (s.angles ?? []).map(a => {
    const [p, v, q] = [...a.id];
    return { id: a.id, v: pt(v!), p: pt(p!), q: pt(q!), text: a.text, alt: a.alt, col: a.col, box: a.box, arcs: a.arcs, r: a.r, lab: a.lab, solve: a.solve, bare: a.bare };
  });
  const arcs: CArc[] = (s.arcs ?? []).map(a => {
    const da = deg[a.from], db = deg[a.to];
    if (!da || !db || da[0] !== db[0]) throw new Error(`cfig: arc ${a.from}-${a.to} needs two points on one circle`);
    return { id: a.id ?? a.from + a.to, a: da[1], b: db[1], c: da[0], col: a.col, text: a.text, alt: a.alt, solve: a.solve, thin: a.thin };
  });
  for (const a of arcs) for (const t of [a.text, a.alt]) {
    const m = /^(\d+(?:\.5)?)°$/.exec(t ?? '');
    if (m && Math.abs(span(a.a, a.b) - Number(m[1])) > 1e-6) throw new Error(`cfig: arc ${a.id} spans ${span(a.a, a.b).toFixed(2)}°, labelled ${m[1]}°`);
  }
  // letters: on a circle, straight out from its centre; elsewhere, away from circle 0's centre
  const bare = new Set(s.bare ?? []);
  const points: GPoint[] = Object.entries(P).filter(([n]) => !bare.has(n)).map(([n, p]) => {
    const d = deg[n];
    const dir = s.dirs?.[n] ?? (d ? d[1] : n === s.center ? 235 : dist(p, c0.O) < 1 ? 235 : angOf(sub(p, c0.O)));
    return { at: p, name: n, dir, dot: true };
  });
  if (s.center === '') points.push({ at: c0.O, name: '', dir: 0, dot: true });
  return { circles, fig: { segs, angles, points, pad: s.pad ?? 96, maxS: 3 }, arcs };
}

// ---------- layout ----------
const LAB = 60;
const circlePoly = (cc: CCircle, a = 0, b = 360, step = 4): Pt[] => {
  const n = Math.max(6, Math.ceil(Math.abs(b - a) / step));
  return Array.from({ length: n + 1 }, (_, i) => at(cc.O, a + ((b - a) * i) / n, cc.R));
};
/** the circle (and thin arc marks) as segments, so the course's layout checks see them */
function circleSegs(cf: CFig): GSeg[] {
  return cf.circles.flatMap((cc, ci) => {
    const P = circlePoly(cc, 0, 360, 5);
    return P.slice(1).map((b, k) => ({ id: `~c${ci}~${k}`, a: P[k]!, b, col: 'ink' as const }));
  });
}
export interface CLay { fit: Fit; full: Fig; labels: { arc: CArc; at: Pt; size: number }[] }
/** the fit, and a full figure (circle segments + arc labels as words) for the course's checks */
export function cfLayout(cf: CFig, fr: Frame, fixed?: Fit): CLay {
  const base: Fig = { ...cf.fig, segs: [...cf.fig.segs, ...circleSegs(cf)] };
  let fit = fixed ?? fitFig(base, fr);
  let words: GWord[] = [];
  let model: { arc: CArc; at: Pt; t: string }[] = [];
  for (let pass = 0; pass < 3; pass++) {
    model = cf.arcs.filter(a => a.text || a.alt).map(a => {
      const cc = cf.circles[a.c ?? 0]!, mid = a.a + span(a.a, a.b) / 2, u = dirv(mid);
      const t = [a.text ?? '', a.alt ?? ''].sort((x, y) => textW(y, LAB) - textW(x, LAB))[0]!;
      const w = textW(t, LAB), h = LAB * 0.88;
      const d = (w / 2) * Math.abs(u[0]) + (h / 2) * Math.abs(u[1]) + (a.thin ? 18 : 24);
      return { arc: a, at: add(cc.O, mul(u, cc.R + d / fit.s)), t };
    });
    words = model.map(m => ({ at: m.at, text: m.t, size: LAB }));
    if (fixed) break;
    fit = fitFig({ ...base, words: [...(cf.fig.words ?? []), ...words] }, fr);
  }
  const full: Fig = { ...base, words: [...(cf.fig.words ?? []), ...words] };
  return { fit, full, labels: model.map(m => ({ arc: m.arc, at: m.at, size: LAB })) };
}
/** readability problems in the frame the page uses (before and after the solve) */
export function cfProblems(cf: CFig, fr: Frame): string[] {
  const L = cfLayout(cf, fr);
  return figProblems(L.full, fr);
}
/** move colliding point letters to a free direction (mutates the figure's points); returns what is still wrong */
export function repairCF(cf: CFig, fr: Frame): string[] {
  const L = cfLayout(cf, fr);
  const f = L.full;
  let probs = figProblems(f, fr);
  for (let pass = 0; pass < 2 && probs.length; pass++) {
    const bad = [...new Set(probs.flatMap(p => [...p.matchAll(/point (\S+)/g)].map(m => m[1]!)))];
    if (!bad.length) break;
    for (const name of bad) {
      const p = f.points.find(x => x.name === name);
      if (!p) continue;
      const o = { dir: p.dir, dist: p.dist };
      let found = false;
      search: for (const [dd, step, n] of [[48, 25, 14], [62, 20, 18], [78, 15, 24]] as const) for (let k = 0; k < n; k++) {
        p.dir = o.dir + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step; p.dist = dd;
        if (!figProblems(f, fr).some(x => x.includes('point ' + name))) { found = true; break search; }
      }
      if (!found) { p.dir = o.dir; p.dist = o.dist; }
    }
    probs = figProblems(f, fr);
  }
  return probs;
}

// ---------- relabelling and queries ----------
export function mapCF(cf: CFig, t: (s: string) => string): CFig {
  return { ...cf, fig: mapFig(cf.fig, t), arcs: cf.arcs.map(a => ({ ...a, id: t(a.id) })) };
}
/** the polyline of an arc in model units */
export const arcPoly = (cf: CFig, a: CArc): Pt[] => { const cc = cf.circles[a.c ?? 0]!; return circlePoly(cc, a.a, a.a + span(a.a, a.b), 3); };
export const circlePts = (cc: CCircle): Pt[] => circlePoly(cc, 0, 360, 3);
/** the measure of an angle of the figure by its id */
export function angleOf(cf: CFig, id: string): number {
  const a = cf.fig.angles.find(x => x.id === id);
  if (!a) throw new Error(`no angle ${id}`);
  return measure(a.v, a.p, a.q);
}
export { measure, dist };
