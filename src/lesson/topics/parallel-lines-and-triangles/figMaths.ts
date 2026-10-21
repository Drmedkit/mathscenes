// figMaths.ts: the exact maths and the pure layout of the figures of "Angle relationships with parallel lines and
// triangles" (grade 8, 8.G.A.5). A figure (Fig) is drawn lines and segments, angle marks (an arc or a right-angle
// box at a vertex between two rays, with a short label: a measure, a name, an unknown), point letters, washes and
// words. Model coordinates are px-like with y UP; fitFig() places a figure in a frame, layoutFig() places every label
// and figProblems() refuses a layout where a label leaves the frame, touches a line, an arc or another label.
// The builders make the three figure families of the topic: two lines cut by a transversal (slots 1-8), a triangle
// (with an extended side, a parallel line through a vertex, or between two parallel lines) and a polygon.
// Pure: no DOM, no canvas (tests run it in node).
import { type Box, type Pt, box } from '../../../core/math';
import { hitsLines } from '../../../blocks/block';

export type MarkCol = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'plain';
export interface FSeg {
  id?: string;
  a: Pt; b: Pt;
  /** arrowheads: 0 = a segment, 1 = a ray (head at b), 2 = a line (heads at both ends) */
  arrows?: 0 | 1 | 2;
  /** parallel marks (chevrons pointing a -> b) and where they sit (0..1 along a -> b) */
  par?: number; parAt?: number;
  /** a line name (ℓ, m, t) beyond end b */
  name?: string;
  dash?: boolean;
  col?: MarkCol | 'ink';
  /** drawn only in the worked solution (a helper line, a diagonal) */
  solve?: boolean;
}
export interface FAngle {
  id: string;
  /** vertex and one point on each side; the mark is the non-reflex angle between v->p and v->q (unless reflex) */
  v: Pt; p: Pt; q: Pt;
  reflex?: boolean;
  text?: string;
  /** the label after solving (layout reserves room for the longer one) */
  alt?: string;
  col?: MarkCol;
  box?: boolean;
  /** matching arcs (equal-angle marks): 1, 2 or 3 arcs */
  arcs?: number;
  /** arc radius in px */
  r?: number;
  /** a whole drawn around parts (a straight angle): thin wash, bigger arc */
  whole?: boolean;
  /** 'only' = appears in the worked solution; 'hide' = its label goes away in the worked solution */
  solve?: 'only' | 'hide';
}
export interface FPoint { at: Pt; name: string; /** direction of the letter from the point, degrees */ dir: number; dot?: boolean; /** px from the point (default 44) */ dist?: number }
export interface FFill { id?: string; pts: Pt[]; col: MarkCol | 'band' | 'body'; alpha?: number }
export interface FWord { at: Pt; text: string; size?: number }
export interface Fig { segs: FSeg[]; angles: FAngle[]; points: FPoint[]; fills: FFill[]; words?: FWord[]; nts?: boolean; /** room around the drawing for labels */ pad?: number }

export interface Frame { x: number; y: number; w: number; h: number }
export const FIG: Frame = { x: 60, y: 70, w: 940, h: 940 };
export const LABEL = 60, LETTER = 48, NAME = 52, WORD = 46;

// ---------- small vector maths (model coordinates, y up) ----------
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt): number => Math.hypot(a[0], a[1]);
export const unit = (a: Pt): Pt => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const dirv = (deg: number): Pt => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
export const angOf = (a: Pt): number => norm((Math.atan2(a[1], a[0]) * 180) / Math.PI);
export const norm = (d: number): number => ((d % 360) + 360) % 360;
export const rotP = (p: Pt, deg: number, c: Pt = [0, 0]): Pt => {
  const r = (deg * Math.PI) / 180, x = p[0] - c[0], y = p[1] - c[1];
  return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
};
/** the intersection of line p + s·u and line q + t·w */
export function meet(p: Pt, u: Pt, q: Pt, w: Pt): Pt {
  const d = u[0] * w[1] - u[1] * w[0];
  const s = ((q[0] - p[0]) * w[1] - (q[1] - p[1]) * w[0]) / d;
  return [p[0] + s * u[0], p[1] + s * u[1]];
}
/** the measure of the angle p-v-q (non-reflex), degrees */
export const measure = (v: Pt, p: Pt, q: Pt): number => { const s = norm(angOf(sub(q, v)) - angOf(sub(p, v))); return s > 180 ? 360 - s : s; };

/** map every point of a figure (a ghost copy that slides or turns) */
export function mapFig(f: Fig, T: (p: Pt) => Pt): Fig {
  return {
    segs: f.segs.map(s => ({ ...s, a: T(s.a), b: T(s.b) })),
    angles: f.angles.map(a => ({ ...a, v: T(a.v), p: T(a.p), q: T(a.q) })),
    points: f.points.map(p => ({ ...p, at: T(p.at), dir: angOf(sub(T(add(p.at, dirv(p.dir))), T(p.at))) })),
    fills: f.fills.map(x => ({ ...x, pts: x.pts.map(T) })),
    words: f.words?.map(w => ({ ...w, at: T(w.at) })),
    nts: f.nts,
  };
}

// ---------- fit and layout ----------
export interface Fit { s: number; ox: number; oy: number; fr: Frame }
export const toScreen = (F: Fit, p: Pt): Pt => [F.ox + F.s * p[0], F.oy - F.s * p[1]];
export function fitFig(f: Fig, fr: Frame = FIG, pad = f.pad ?? 74, maxS = 1.25): Fit {
  const P: Pt[] = [...f.segs.flatMap(s => [s.a, s.b]), ...f.points.map(p => p.at), ...f.fills.flatMap(x => x.pts), ...f.angles.map(a => a.v)];
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min(maxS, (fr.w - 2 * pad) / Math.max(1, x1 - x0), (fr.h - 2 * pad - (f.nts ? 50 : 0)) / Math.max(1, y1 - y0));
  return { s, fr, ox: fr.x + fr.w / 2 - (s * (x0 + x1)) / 2, oy: fr.y + (fr.h - (f.nts ? 50 : 0)) / 2 + (s * (y0 + y1)) / 2 };
}
/** the width of a label in the canvas sans at `size` (an estimate a little on the wide side) */
export function textW(t: string, size: number): number {
  let w = 0;
  for (const ch of t) w += ch === '°' ? 0.4 : ch === ' ' ? 0.28 : /[()]/.test(ch) ? 0.34 : /[1]/.test(ch) ? 0.5 : /[mw]/.test(ch) ? 0.84 : 0.58;
  return w * size;
}
const tbox = (at: Pt, t: string, size: number): Box => { const w = textW(t, size); return box(at[0] - w / 2, at[1] - size * 0.42, at[0] + w / 2, at[1] + size * 0.42); };

export interface AngleLay { m: FAngle; V: Pt; a0: number; span: number; r: number; label: { at: Pt; box: Box; size: number } | null }
export interface FigLay {
  fit: Fit;
  segs: { s: FSeg; A: Pt; B: Pt }[];
  angles: AngleLay[];
  points: { p: FPoint; at: Pt; box: Box }[];
  names: { s: FSeg; at: Pt; box: Box }[];
  words: { w: FWord; at: Pt; box: Box; size: number }[];
  nts: Pt | null;
}
/** the arc polyline of an angle mark (screen) */
export function arcPts(V: Pt, r: number, a0: number, span: number): Pt[] {
  const n = Math.max(6, Math.ceil(span / 4)), P: Pt[] = [];
  for (let i = 0; i <= n; i++) { const a = ((a0 + (span * i) / n) * Math.PI) / 180; P.push([V[0] + r * Math.cos(a), V[1] - r * Math.sin(a)]); }
  return P;
}
export function boxPts(V: Pt, a0: number, span: number, s: number): Pt[] {
  const u = dirv(a0), w = dirv(a0 + span);
  return [[V[0] + s * u[0], V[1] - s * u[1]], [V[0] + s * (u[0] + w[0]), V[1] - s * (u[1] + w[1])], [V[0] + s * w[0], V[1] - s * w[1]]];
}
/** a plain angle that only carries its number (1-8): drawn as the number alone, no arc (textbook style) */
export const isNumberOnly = (m: FAngle): boolean => (m.col ?? 'plain') === 'plain' && !m.box && !m.whole && /^\d$/.test(m.text ?? '');
export function layoutFig(f: Fig, fit: Fit = fitFig(f)): FigLay {
  const S = (p: Pt) => toScreen(fit, p);
  const segs = f.segs.map(s => ({ s, A: S(s.a), B: S(s.b) }));
  // parts first; a whole (a straight angle drawn around parts) gets an arc outside the labels of its parts
  const partR = new Map<string, number>();
  const one = (m: FAngle): AngleLay => {
    const V = S(m.v);
    const pa = angOf(sub(m.p, m.v)), qa = angOf(sub(m.q, m.v));
    let a0 = pa, span = norm(qa - pa);
    if ((!m.reflex && span > 180) || (m.reflex && span < 180)) { a0 = qa; span = 360 - span; }
    const key = `${Math.round(V[0])},${Math.round(V[1])}`;
    const r = m.r ?? (m.box ? 34 : m.whole ? Math.max(96, partR.get(key) ?? 0) : isNumberOnly(m) ? 30 : 50) + ((m.arcs ?? 1) - 1) * 12;
    const t = [m.text ?? '', m.alt ?? ''].sort((x, y) => textW(y, LABEL) - textW(x, LABEL))[0]!;
    let label: AngleLay['label'] = null;
    if (t) {
      const size = LABEL, w = textW(t, size), h = size * 0.84, mid = a0 + span / 2, half = Math.min(span, 359) / 2;
      // the distance along the bisector where the label box clears both sides of the angle and the arc
      const ext = (deg: number) => { const n = dirv(deg + 90); return (w / 2) * Math.abs(n[0]) + (h / 2) * Math.abs(n[1]); };
      const along = (w / 2) * Math.abs(dirv(mid)[0]) + (h / 2) * Math.abs(dirv(mid)[1]);
      let d = r + along + (m.box ? 22 : 12);
      if (half < 90) d = Math.max(d, (Math.max(ext(a0), ext(a0 + span)) + 14) / Math.sin((half * Math.PI) / 180));
      const at: Pt = [V[0] + d * Math.cos((mid * Math.PI) / 180), V[1] - d * Math.sin((mid * Math.PI) / 180)];
      label = { at, box: tbox(at, t, size), size };
    }
    if (!m.whole) partR.set(key, Math.max(partR.get(key) ?? 0, label ? Math.hypot(label.at[0] - V[0], label.at[1] - V[1]) + Math.hypot(label.box.w, label.box.h) / 2 + 14 : r + 30));
    return { m, V, a0, span, r, label };
  };
  const parts = new Map(f.angles.filter(m => !m.whole).map(m => [m, one(m)]));
  const angles: AngleLay[] = f.angles.map(m => parts.get(m) ?? one(m));
  const points = f.points.map(p => { const P = S(p.at), u = dirv(p.dir); const dd = p.dist ?? 44, at: Pt = [P[0] + dd * u[0], P[1] - dd * u[1]]; return { p, at, box: tbox(at, p.name, LETTER) }; });
  const names = segs.filter(x => x.s.name).map(x => {
    const u = unit(sub(x.B, x.A)), at: Pt = [x.B[0] + 40 * u[0], x.B[1] + 40 * u[1]];
    return { s: x.s, at, box: tbox(at, x.s.name!, NAME) };
  });
  const words = (f.words ?? []).map(w => { const size = w.size ?? WORD, at = S(w.at); return { w, at, size, box: tbox(at, w.text, size) }; });
  const nts = f.nts ? [fit.fr.x + fit.fr.w / 2, fit.fr.y + fit.fr.h - 34] as Pt : null;
  return { fit, segs, angles, points, names, words, nts };
}
/** what breaks the readability rules (empty = fine) */
export function figProblems(f: Fig, fit: Fit = fitFig(f)): string[] {
  // two states: as the kid first sees it, and the worked solution (helper lines in, some labels out)
  const pre: Fig = { ...f, segs: f.segs.filter(s => !s.solve), angles: f.angles.filter(a => a.solve !== 'only') };
  const post: Fig = { ...f, angles: f.angles.map(a => (a.solve === 'hide' ? { ...a, text: '', alt: undefined } : a)) };
  const out = stateProblems(pre, fit);
  if (f.segs.some(s => s.solve) || f.angles.some(a => a.solve)) for (const x of stateProblems(post, fit)) if (!out.includes(x)) out.push('solution: ' + x);
  return out;
}
function stateProblems(f: Fig, fit: Fit): string[] {
  const L = layoutFig(f, fit), fr = fit.fr, out: string[] = [];
  const lines: Pt[][] = L.segs.map(x => [x.A, x.B]);
  const arcs: { id: string; P: Pt[] }[] = L.angles.map(a => ({ id: a.m.id, P: a.m.box ? boxPts(a.V, a.a0, a.span, a.r) : arcPts(a.V, a.r, a.a0, a.span) }));
  const labels: { id: string; b: Box }[] = [
    ...L.angles.filter(a => a.label).map(a => ({ id: 'angle ' + a.m.id, b: a.label!.box })),
    ...L.points.map(p => ({ id: 'point ' + p.p.name, b: p.box })),
    ...L.names.map(n => ({ id: 'name ' + n.s.name, b: n.box })),
    ...L.words.map(w => ({ id: 'word ' + w.w.text, b: w.box })),
  ];
  for (const { id, b } of labels) {
    if (b.x0 < fr.x + 4 || b.x1 > fr.x + fr.w - 4 || b.y0 < fr.y + 4 || b.y1 > fr.y + fr.h - 4) out.push(`${id} leaves the frame`);
    if (hitsLines(b, lines, 3)) out.push(`${id} touches a line`);
    if (hitsLines(b, arcs.filter(a => 'angle ' + a.id !== id).map(a => a.P), 2)) out.push(`${id} touches an arc`);
  }
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i]!.b, b = labels[j]!.b;
    if (a.x0 < b.x1 + 4 && b.x0 < a.x1 + 4 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4) out.push(`${labels[i]!.id} overlaps ${labels[j]!.id}`);
  }
  return out;
}

// ======================= two lines cut by a transversal =======================
// Slots (the textbook numbering): at crossing P (line ℓ): 1 out-left, 2 out-right, 3 in-left, 4 in-right;
// at crossing Q (line m): 5 in-left, 6 in-right, 7 out-left, 8 out-right. "in" = between the two lines; left/right =
// the side of the transversal. With tau the drawn angle of the transversal against the lines and delta the tilt of m:
//   1 = 180 - tau, 2 = tau, 3 = tau, 4 = 180 - tau, 5 = 180 + delta - tau, 6 = tau - delta, 7 = tau - delta, 8 = 180 + delta - tau
export type Slot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const SLOTS: readonly Slot[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const SLOT: Record<Slot, { c: 0 | 1; io: 'in' | 'out'; s: 'L' | 'R' }> = {
  1: { c: 0, io: 'out', s: 'L' }, 2: { c: 0, io: 'out', s: 'R' }, 3: { c: 0, io: 'in', s: 'L' }, 4: { c: 0, io: 'in', s: 'R' },
  5: { c: 1, io: 'in', s: 'L' }, 6: { c: 1, io: 'in', s: 'R' }, 7: { c: 1, io: 'out', s: 'L' }, 8: { c: 1, io: 'out', s: 'R' },
};
export type Rel = 'same' | 'vertical' | 'linear' | 'corresponding' | 'altInt' | 'altExt' | 'ssInt' | 'ssExt' | 'none';
export const REL_NAME: Record<Rel, string> = {
  same: 'the same angle', vertical: 'vertical angles', linear: 'a linear pair', corresponding: 'corresponding angles',
  altInt: 'alternate interior angles', altExt: 'alternate exterior angles', ssInt: 'same-side interior angles', ssExt: 'same-side exterior angles', none: 'not a named pair',
};
export function relation(a: Slot, b: Slot): Rel {
  if (a === b) return 'same';
  const A = SLOT[a], B = SLOT[b];
  if (A.c === B.c) return A.io !== B.io && A.s !== B.s ? 'vertical' : 'linear';
  // "same direction from its line": out at P and in at Q both lie on the far side of the transversal's travel
  const dirA = A.c === 0 ? A.io : A.io === 'in' ? 'out' : 'in', dirB = B.c === 0 ? B.io : B.io === 'in' ? 'out' : 'in';
  if (dirA === dirB && A.s === B.s) return 'corresponding';
  if (A.io === 'in' && B.io === 'in') return A.s === B.s ? 'ssInt' : 'altInt';
  if (A.io === 'out' && B.io === 'out') return A.s === B.s ? 'ssExt' : 'altExt';
  return 'none';
}
/** does the relation make the pair equal (E) or supplementary (S), and does it need parallel lines? */
export function relFact(r: Rel): { eq: boolean; needsPar: boolean } {
  switch (r) {
    case 'vertical': return { eq: true, needsPar: false };
    case 'linear': return { eq: false, needsPar: false };
    case 'corresponding': case 'altInt': case 'altExt': return { eq: true, needsPar: true };
    case 'ssInt': case 'ssExt': return { eq: false, needsPar: true };
    default: return { eq: true, needsPar: true };
  }
}
export function slotMeasure(s: Slot, tau: number, delta = 0): number {
  switch (s) { case 1: case 4: return 180 - tau; case 2: case 3: return tau; case 5: case 8: return 180 + delta - tau; default: return tau - delta; }
}
/** the partner of slot s for a named relation */
export function partner(s: Slot, r: 'corresponding' | 'altInt' | 'altExt' | 'ssInt' | 'ssExt' | 'vertical'): Slot {
  return SLOTS.find(t => relation(s, t) === r)!;
}

export interface TransMark { text?: string; alt?: string; col?: MarkCol; box?: boolean; id?: string }
export interface TransOpts {
  tau: number;
  delta?: number;
  rot?: number;
  mirror?: boolean;
  gap?: number;
  /** half-length of lines ℓ and m, and how far the transversal runs past the crossings */
  half?: number; tail?: number;
  par?: boolean;
  names?: { l?: string; m?: string; t?: string };
  /** letters at the crossings */
  cross?: [string, string];
  marks?: Partial<Record<Slot, TransMark>>;
  /** tint the band between the lines */
  band?: boolean;
  /** words beside lines ℓ and m (street names) */
  words?: { l?: string; m?: string };
}
export interface Trans {
  fig: Fig; P: Pt; Q: Pt; M: Pt;
  /** the model transform applied after the canonical layout (for ghosts built in canonical coordinates) */
  T: (p: Pt) => Pt;
  /** a point on a ray of a slot (canonical): the two sides of slot s */
  sides(s: Slot): [Pt, Pt];
  /** the angle mark of slot s */
  mark(s: Slot, m: TransMark & { id: string }): FAngle;
  /** the 180° whole of the transversal at a crossing on side L/R */
  straight(c: 0 | 1, side: 'L' | 'R', id: string): FAngle;
  e: Pt; em: Pt; u: Pt;
}
export function trans(o: TransOpts): Trans {
  const g = o.gap ?? 330, tau = o.tau, delta = o.delta ?? 0, H = o.half ?? 400, Tl = o.tail ?? 220;
  const u = dirv(tau), e: Pt = [1, 0], em = dirv(delta);
  // the crossings: P on ℓ (y = g/2), Q on m; the transversal goes through the origin
  const P: Pt = [(g / 2) * (u[0] / u[1]), g / 2], Q: Pt = [-(g / 2) * (u[0] / u[1]), -g / 2];
  const M: Pt = [0, 0];
  const rot = o.rot ?? 0, mir = !!o.mirror;
  const T = (p: Pt): Pt => rotP(mir ? [-p[0], p[1]] : p, rot);
  // ℓ and m are centred above / below the middle of PQ (so both lines span the same width)
  const lA: Pt = [-H, g / 2], lB: Pt = [H, g / 2];
  const mA = meet(Q, em, [-H, 0], [0, 1]), mB = meet(Q, em, [H, 0], [0, 1]);
  const tA = sub(Q, mul(u, Tl)), tB = add(P, mul(u, Tl));
  const parAt = (x: number) => (x > 0 ? 0.16 : 0.84);
  const segs: FSeg[] = [
    { id: 'l', a: lA, b: lB, arrows: 2, par: o.par ? 1 : 0, parAt: parAt(P[0]), name: o.names?.l },
    { id: 'm', a: mA, b: mB, arrows: 2, par: o.par ? 1 : 0, parAt: parAt(Q[0]), name: o.names?.m },
    { id: 't', a: tA, b: tB, arrows: 2, name: o.names?.t },
  ];
  const sides = (s: Slot): [Pt, Pt] => {
    const S = SLOT[s], V = S.c === 0 ? P : Q, ee = S.c === 0 ? e : em;
    const along = S.s === 'R' ? ee : mul(ee, -1);
    const across = S.c === 0 ? (S.io === 'out' ? u : mul(u, -1)) : (S.io === 'in' ? u : mul(u, -1));
    return [add(V, mul(along, 100)), add(V, mul(across, 100))];
  };
  const mark = (s: Slot, m: TransMark & { id: string }): FAngle => {
    const [a, b] = sides(s), V = SLOT[s].c === 0 ? P : Q;
    return { id: m.id, v: V, p: a, q: b, text: m.text, alt: m.alt, col: m.col, box: m.box };
  };
  const straight = (c: 0 | 1, side: 'L' | 'R', id: string): FAngle => {
    const V = c === 0 ? P : Q, ee = c === 0 ? e : em;
    // from the transversal's up ray, around through the line on that side, to its down ray (nudged to that side so
    // the 180° mark keeps its side under a mirror)
    const nudge = mul(ee, side === 'L' ? -0.08 : 0.08);
    return { id, v: V, p: add(V, mul(u, 100)), q: add(add(V, mul(u, -100)), nudge), whole: true, col: 'first' };
  };
  const angles: FAngle[] = [];
  for (const s of SLOTS) { const m = o.marks?.[s]; if (m) angles.push(mark(s, { ...m, id: m.id ?? `s${s}` })); }
  const fills: FFill[] = o.band ? [{ id: 'band', pts: [lA, lB, mB, mA], col: 'band', alpha: 1 }] : [];
  const points: FPoint[] = [];
  if (o.cross) {
    // each crossing letter sits on the bisector of a corner that carries no mark (outside corners first), far
    // enough out to clear both sides of that corner
    const spot = (cands: Slot[], V: Pt) => {
      const s = cands.find(c => !o.marks?.[c]) ?? cands[0]!;
      const [a, b] = sides(s), da = angOf(sub(a, V)), db = angOf(sub(b, V));
      let span = norm(db - da), a0 = da; if (span > 180) { a0 = db; span = 360 - span; }
      return { dir: a0 + span / 2, dist: Math.max(50, 36 / Math.sin((span / 2) * Math.PI / 180)) };
    };
    points.push({ at: P, name: o.cross[0], dot: true, ...spot([1, 2, 3, 4], P) }, { at: Q, name: o.cross[1], dot: true, ...spot([7, 8, 5, 6], Q) });
  }
  const words: FWord[] = [];
  if (o.words?.l) words.push({ at: [P[0] > 0 ? -H * 0.55 : H * 0.55, g / 2 + 48], text: o.words.l });
  if (o.words?.m) words.push({ at: [Q[0] > 0 ? -H * 0.55 : H * 0.55, -g / 2 - 48], text: o.words.m });
  const fig0: Fig = { segs, angles, points, fills, words };
  return { fig: mapFig(fig0, T), P: T(P), Q: T(Q), M: T(M), T, sides, mark: (s, m) => mapAngle(mark(s, m), T), straight: (c, side, id) => mapAngle(straight(c, side, id), T), e, em, u };
}
const mapAngle = (a: FAngle, T: (p: Pt) => Pt): FAngle => ({ ...a, v: T(a.v), p: T(a.p), q: T(a.q) });

// ======================= triangles =======================
export type V3 = 'A' | 'B' | 'C';
export interface TriMark { text?: string; alt?: string; col?: MarkCol; box?: boolean; arcs?: number; id?: string }
export interface TriOpts {
  A: number; B: number; C: number;
  rot?: number; mirror?: boolean;
  /** the longest side, model px */
  size?: number;
  names?: [string, string, string] | null;
  marks?: Partial<Record<V3, TriMark>>;
  /** extend side XY beyond vertex `at` (from = the other end of that side): the exterior angle at `at` */
  ext?: { at: V3; from: V3; mark?: TriMark; name?: string; len?: number };
  /** a line through A parallel to BC (drawn on construction) */
  parTop?: { name?: string; marks?: { left?: TriMark; right?: TriMark }; dash?: boolean; show?: boolean; /** parallel marks on ℓ and BC (default true) */ marked?: boolean };
  /** BC lies on a line m and A on a line ℓ parallel to it */
  between?: { l?: string; m?: string; topLeft?: TriMark; topRight?: TriMark };
  /** a cevian from A to a point on BC (a distractor) at share t of BC */
  cevian?: number;
  fillBody?: boolean;
  nts?: boolean;
}
export interface Tri { fig: Fig; P: Record<V3, Pt>; T: (p: Pt) => Pt; ext: Pt | null }
export function triPts(A: number, B: number, size = 640): Record<V3, Pt> {
  const b: Pt = [0, 0], c: Pt = [1, 0];
  const C = 180 - A - B;
  const apex = meet(b, dirv(B), c, dirv(180 - C));
  const P = { A: apex, B: b, C: c };
  const L = Math.max(len(sub(P.A, P.B)), len(sub(P.A, P.C)), 1);
  const k = size / L;
  const cx = (P.A[0] + P.B[0] + P.C[0]) / 3, cy = (P.A[1] + P.B[1] + P.C[1]) / 3;
  const f = (p: Pt): Pt => [(p[0] - cx) * k, (p[1] - cy) * k];
  return { A: f(P.A), B: f(P.B), C: f(P.C) };
}
export function tri(o: TriOpts): Tri {
  const P0 = triPts(o.A, o.B, o.size ?? 640);
  const rot = o.rot ?? 0, mir = !!o.mirror;
  const T = (p: Pt): Pt => rotP(mir ? [-p[0], p[1]] : p, rot);
  const P = P0;
  const segs: FSeg[] = [{ id: 'AB', a: P.A, b: P.B }, { id: 'BC', a: P.B, b: P.C }, { id: 'CA', a: P.C, b: P.A }];
  const other = (x: V3, y: V3): V3 => (['A', 'B', 'C'] as V3[]).find(z => z !== x && z !== y)!;
  const angles: FAngle[] = [];
  for (const v of ['A', 'B', 'C'] as V3[]) {
    const m = o.marks?.[v];
    if (!m) continue;
    const [p, q] = (['A', 'B', 'C'] as V3[]).filter(z => z !== v) as [V3, V3];
    angles.push({ id: m.id ?? v, v: P[v], p: P[p], q: P[q], text: m.text, alt: m.alt, col: m.col, box: m.box, arcs: m.arcs });
  }
  let ext: Pt | null = null;
  const points: FPoint[] = [];
  const centroid: Pt = [(P.A[0] + P.B[0] + P.C[0]) / 3, (P.A[1] + P.B[1] + P.C[1]) / 3];
  if (o.ext) {
    const Y = P[o.ext.at], X = P[o.ext.from], Z = P[other(o.ext.at, o.ext.from)];
    ext = add(Y, mul(unit(sub(Y, X)), o.ext.len ?? 300));
    segs.push({ id: 'ext', a: Y, b: ext, arrows: 0 });
    if (o.ext.mark) angles.push({ id: o.ext.mark.id ?? 'ext', v: Y, p: ext, q: Z, text: o.ext.mark.text, alt: o.ext.mark.alt, col: o.ext.mark.col, arcs: o.ext.mark.arcs });
    if (o.ext.name) {
      // the letter beyond the end, on the side away from the triangle
      const away = unit(sub(ext, Y)), side = sub(ext, centroid);
      const nrm: Pt = [-away[1], away[0]], s = nrm[0] * side[0] + nrm[1] * side[1] > 0 ? 1 : -1;
      points.push({ at: ext, name: o.ext.name, dir: angOf(add(mul(nrm, s), mul(away, 0.6))), dot: true });
    }
  }
  if (o.parTop || o.between) {
    const d = unit(sub(P.C, P.B)), W = 520;
    if (o.parTop && o.parTop.show !== false) {
      const mk = o.parTop.marked !== false;
      segs.push({ id: 'par', a: sub(P.A, mul(d, W)), b: add(P.A, mul(d, W)), arrows: 2, par: mk ? 2 : 0, parAt: 0.12, name: o.parTop.name, dash: o.parTop.dash });
      if (mk) segs[1] = { ...segs[1]!, par: 2, parAt: 0.62 };
    }
    if (o.between) {
      segs.push({ id: 'lineL', a: sub(P.A, mul(d, W)), b: add(P.A, mul(d, W)), arrows: 2, par: 1, parAt: 0.1, name: o.between.l });
      const mid: Pt = mul(add(P.B, P.C), 0.5);
      segs.push({ id: 'lineM', a: sub(mid, mul(d, W)), b: add(mid, mul(d, W)), arrows: 2, par: 1, parAt: 0.1, name: o.between.m });
    }
    const left = o.parTop?.marks?.left ?? o.between?.topLeft, right = o.parTop?.marks?.right ?? o.between?.topRight;
    if (left) angles.push({ id: left.id ?? 'top1', v: P.A, p: sub(P.A, mul(d, 100)), q: P.B, text: left.text, alt: left.alt, col: left.col, arcs: left.arcs });
    if (right) angles.push({ id: right.id ?? 'top3', v: P.A, p: add(P.A, mul(d, 100)), q: P.C, text: right.text, alt: right.alt, col: right.col, arcs: right.arcs });
  }
  if (o.cevian !== undefined) {
    const D = add(P.B, mul(sub(P.C, P.B), o.cevian));
    segs.push({ id: 'cev', a: P.A, b: D });
  }
  if (o.names) {
    (['A', 'B', 'C'] as V3[]).forEach((v, i) => {
      const out = unit(sub(P[v], centroid));
      points.push({ at: P[v], name: o.names![i]!, dir: angOf(out), dot: false });
    });
  }
  const fills: FFill[] = o.fillBody === false ? [] : [{ id: 'body', pts: [P.A, P.B, P.C], col: 'body' }];
  const fig0: Fig = { segs, angles, points, fills, nts: o.nts };
  return { fig: mapFig(fig0, T), P: { A: T(P.A), B: T(P.B), C: T(P.C) }, T, ext: ext ? T(ext) : null };
}

// ======================= polygons =======================
export interface PolyOpts {
  n: number;
  regular?: boolean;
  /** a seeded wobble for irregular convex polygons: one number per vertex in -1..1 */
  wobble?: number[];
  rot?: number;
  size?: number;
  names?: string[] | null;
  marks?: { at: number; text?: string; alt?: string; col?: MarkCol; id?: string }[];
  /** diagonals from vertex 0 (ids d2..d{n-2}) and the triangle washes (ids t1..t{n-2}) */
  diagonals?: boolean;
  /** segments from a point inside to every vertex (ids c0..c{n-1}) */
  centre?: boolean;
  nts?: boolean;
}
export interface Poly { fig: Fig; V: Pt[] }
export function poly(o: PolyOpts): Poly {
  const n = o.n, R = (o.size ?? 760) / 2, rot = o.rot ?? 90 + 180 / n;
  const V: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const w = o.regular ? 0 : (o.wobble?.[i] ?? 0);
    const a = rot + (360 * i) / n + w * (120 / n), rr = R * (o.regular ? 1 : 1 - 0.1 * Math.abs(o.wobble?.[(i + 1) % n] ?? 0));
    V.push(mul(dirv(a), rr));
  }
  const segs: FSeg[] = V.map((p, i) => ({ id: `e${i}`, a: p, b: V[(i + 1) % n]! }));
  const fills: FFill[] = [{ id: 'body', pts: V, col: 'body' }];
  if (o.diagonals) {
    for (let k = 2; k <= n - 2; k++) segs.push({ id: `d${k}`, a: V[0]!, b: V[k]!, col: 'first', solve: true });
    for (let k = 1; k <= n - 2; k++) fills.push({ id: `t${k}`, pts: [V[0]!, V[k]!, V[k + 1]!], col: k % 2 ? 'second' : 'pick', alpha: 0.5 });
  }
  if (o.centre) {
    const c: Pt = [V.reduce((s, p) => s + p[0], 0) / n * 0.4, V.reduce((s, p) => s + p[1], 0) / n * 0.4];
    for (let k = 0; k < n; k++) segs.push({ id: `c${k}`, a: c, b: V[k]!, col: 'first' });
  }
  const angles: FAngle[] = (o.marks ?? []).map(m => ({ id: m.id ?? `v${m.at}`, v: V[m.at]!, p: V[(m.at + n - 1) % n]!, q: V[(m.at + 1) % n]!, text: m.text, alt: m.alt, col: m.col }));
  const points: FPoint[] = (o.names ?? []).map((nm, i) => ({ at: V[i]!, name: nm, dir: angOf(V[i]!), dot: false }));
  return { fig: { segs, angles, points, fills, nts: o.nts }, V };
}
/** interior angles of a (convex) polygon, in order */
export function polyAngles(V: Pt[]): number[] { const n = V.length; return V.map((v, i) => measure(v, V[(i + n - 1) % n]!, V[(i + 1) % n]!)); }

// ---------- polygon numbers ----------
export const polySum = (n: number): number => (n - 2) * 180;
export const POLY_NAME: Record<number, string> = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' };
