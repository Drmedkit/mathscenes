// geo.ts: exact figures for "Definitions, postulates and first proofs" (Geometry, lesson 2). Pure: no DOM, no canvas.
// A figure (Fig) is computed points, segments / rays / lines (with congruence ticks, parallel chevrons, a length
// label), angle marks (an arc or a right-angle box between two rays, matching arcs, a short label), point letters
// and words. Model coordinates are px-like with y UP. fitFig() places a figure in a frame; layoutFig() places every
// label; figProblems() refuses a layout where a label leaves the frame, touches a line, an arc or a tick, or overlaps
// another label (generators retry, the tests check every item).
// Nothing is "eyeballed": every angle is drawn at the measure its label says (unless the item says the figure is
// a sketch on purpose: a misleading diagram that is NOT marked), and every tick pair sits on segments of equal length.
import type { Box } from '../../../core/math';

export type Pt = [number, number];
export type MarkCol = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'plain';
export interface GSeg {
  id?: string;
  a: Pt; b: Pt;
  /** seg = no heads; ray = a head at b; line = heads at both ends */
  kind?: 'seg' | 'ray' | 'line';
  /** congruence ticks (1-3) across the middle */
  ticks?: number;
  /** parallel chevrons (1-2) pointing a -> b, at parAt (0..1) */
  par?: number; parAt?: number;
  /** a line name (ℓ, m, t) beyond end b */
  name?: string;
  dash?: boolean;
  col?: MarkCol | 'ink' | 'faint';
  /** a length label beside the middle (side +1 = left of a -> b) */
  text?: string; alt?: string; side?: 1 | -1;
  /** drawn only in the worked solution */
  solve?: boolean;
}
export interface GAngle {
  id: string;
  /** vertex and a point on each side; the mark is the non-reflex angle */
  v: Pt; p: Pt; q: Pt;
  text?: string;
  /** the label after the solve (layout reserves room for the longer one) */
  alt?: string;
  col?: MarkCol;
  box?: boolean;
  /** matching arcs (1-3) */
  arcs?: number;
  r?: number;
  /** no wash inside (an arc only) */
  bare?: boolean;
  /** a number name (1-8) without an arc, textbook style */
  nameOnly?: boolean;
  /** where the label sits across the angle (0..1 from its first side; default the bisector) */
  lab?: number;
  solve?: 'only';
}
export interface GPoint { at: Pt; name: string; /** direction of the letter from the point, degrees */ dir: number; dot?: boolean; dist?: number }
export interface GFill { pts: Pt[]; col: MarkCol | 'body'; alpha?: number }
export interface GWord { at: Pt; text: string; size?: number; col?: MarkCol }
export interface Fig { segs: GSeg[]; angles: GAngle[]; points: GPoint[]; fills?: GFill[]; words?: GWord[]; pad?: number; maxS?: number }

export interface Frame { x: number; y: number; w: number; h: number }
/** label sizes: measures and lengths are numbers (>= 60 px), point letters and words are labels (>= 44 px) */
export const LABEL = 60, LETTER = 50, NAME = 54, WORD = 44;

// ---------- vector maths (y up) ----------
export const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const len = (a: Pt): number => Math.hypot(a[0], a[1]);
export const unit = (a: Pt): Pt => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
export const dirv = (deg: number): Pt => [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
export const norm = (d: number): number => ((d % 360) + 360) % 360;
export const angOf = (a: Pt): number => norm((Math.atan2(a[1], a[0]) * 180) / Math.PI);
export const at = (o: Pt, deg: number, r: number): Pt => add(o, mul(dirv(deg), r));
export const lerpP = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a: Pt, b: Pt): number => len(sub(a, b));
/** the measure of angle p-v-q (non-reflex), degrees */
export const measure = (v: Pt, p: Pt, q: Pt): number => { const s = norm(angOf(sub(q, v)) - angOf(sub(p, v))); return s > 180 ? 360 - s : s; };
/** the intersection of line p + s·u and line q + t·w */
export function meet(p: Pt, u: Pt, q: Pt, w: Pt): Pt {
  const d = u[0] * w[1] - u[1] * w[0];
  const s = ((q[0] - p[0]) * w[1] - (q[1] - p[1]) * w[0]) / d;
  return [p[0] + s * u[0], p[1] + s * u[1]];
}
export const rotP = (p: Pt, deg: number, c: Pt = [0, 0]): Pt => {
  const r = (deg * Math.PI) / 180, x = p[0] - c[0], y = p[1] - c[1];
  return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)];
};
/** a whole figure turned about the origin (letters keep their direction relative to the figure) */
export function turnFig(f: Fig, deg: number): Fig {
  const T = (p: Pt) => rotP(p, deg);
  return {
    ...f,
    segs: f.segs.map(s => ({ ...s, a: T(s.a), b: T(s.b) })),
    angles: f.angles.map(a => ({ ...a, v: T(a.v), p: T(a.p), q: T(a.q) })),
    points: f.points.map(p => ({ ...p, at: T(p.at), dir: norm(p.dir + deg) })),
    fills: f.fills?.map(x => ({ ...x, pts: x.pts.map(T) })),
    words: f.words?.map(w => ({ ...w, at: T(w.at) })),
  };
}

// ---------- fit and layout ----------
export interface Fit { s: number; ox: number; oy: number; fr: Frame }
export const toScreen = (F: Fit, p: Pt): Pt => [F.ox + F.s * p[0], F.oy - F.s * p[1]];
export function fitFig(f: Fig, fr: Frame): Fit {
  const pad = f.pad ?? 90, maxS = f.maxS ?? 1.3;
  const P: Pt[] = [...f.segs.flatMap(s => [s.a, s.b]), ...f.points.map(p => p.at), ...(f.fills ?? []).flatMap(x => x.pts), ...f.angles.map(a => a.v), ...(f.words ?? []).map(w => w.at)];
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const s = Math.min(maxS, (fr.w - 2 * pad) / Math.max(1, x1 - x0), (fr.h - 2 * pad) / Math.max(1, y1 - y0));
  return { s, fr, ox: fr.x + fr.w / 2 - (s * (x0 + x1)) / 2, oy: fr.y + fr.h / 2 + (s * (y0 + y1)) / 2 };
}
/** the width of a label in the canvas sans at `size` (an estimate on the wide side; no DOM in tests) */
export function textW(t: string, size: number): number {
  let w = 0;
  for (const ch of t) w += ch === '°' ? 0.42 : ch === ' ' ? 0.3 : /[()]/.test(ch) ? 0.36 : /[1il]/.test(ch) ? 0.46 : /[mwMW]/.test(ch) ? 0.88 : /[−+=]/.test(ch) ? 0.62 : /[A-Z]/.test(ch) ? 0.68 : 0.58;
  return w * size;
}
const bx = (x0: number, y0: number, x1: number, y1: number): Box => ({ x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 });
export const tbox = (p: Pt, t: string, size: number): Box => { const w = textW(t, size); return bx(p[0] - w / 2, p[1] - size * 0.44, p[0] + w / 2, p[1] + size * 0.44); };

export interface AngleLay { m: GAngle; V: Pt; a0: number; span: number; r: number; label: { at: Pt; box: Box; size: number } | null }
export interface SegLay { s: GSeg; A: Pt; B: Pt; ticks: Pt[][]; chev: Pt[][]; label: { at: Pt; box: Box } | null; name: { at: Pt; box: Box } | null }
export interface FigLay {
  fit: Fit;
  segs: SegLay[];
  angles: AngleLay[];
  points: { p: GPoint; P: Pt; at: Pt; box: Box }[];
  words: { w: GWord; at: Pt; box: Box; size: number }[];
}
/** the arc polyline of an angle mark (screen, y down) */
export function arcPts(V: Pt, r: number, a0: number, span: number): Pt[] {
  const n = Math.max(6, Math.ceil(span / 4)), P: Pt[] = [];
  for (let i = 0; i <= n; i++) { const a = ((a0 + (span * i) / n) * Math.PI) / 180; P.push([V[0] + r * Math.cos(a), V[1] - r * Math.sin(a)]); }
  return P;
}
export function boxPts(V: Pt, a0: number, span: number, s: number): Pt[] {
  const u = dirv(a0), w = dirv(a0 + span);
  return [[V[0] + s * u[0], V[1] - s * u[1]], [V[0] + s * (u[0] + w[0]), V[1] - s * (u[1] + w[1])], [V[0] + s * w[0], V[1] - s * w[1]]];
}
function angleLay(m: GAngle, S: (p: Pt) => Pt): AngleLay {
  const V = S(m.v);
  const pa = angOf(sub(m.p, m.v)), qa = angOf(sub(m.q, m.v));
  let a0 = pa, span = norm(qa - pa);
  if (span > 180) { a0 = qa; span = 360 - span; }
  const r = m.r ?? (m.box ? 36 : m.nameOnly ? 30 : 54) + ((m.arcs ?? 1) - 1) * 12;
  const t = [m.text ?? '', m.alt ?? ''].sort((x, y) => textW(y, LABEL) - textW(x, LABEL))[0]!;
  let label: AngleLay['label'] = null;
  if (t) {
    const f = m.lab ?? 0.5, size = LABEL, w = textW(t, size), h = size * 0.88, mid = a0 + span * f, half = span * Math.min(f, 1 - f);
    const ext = (deg: number) => { const n = dirv(deg + 90); return (w / 2) * Math.abs(n[0]) + (h / 2) * Math.abs(n[1]); };
    const along = (w / 2) * Math.abs(dirv(mid)[0]) + (h / 2) * Math.abs(dirv(mid)[1]);
    let d = (m.nameOnly ? 10 : r) + along + (m.box ? 22 : 12);
    if (half < 90) d = Math.max(d, (Math.max(ext(mid - half), ext(mid + half)) + 14) / Math.sin((half * Math.PI) / 180));
    const P: Pt = [V[0] + d * Math.cos((mid * Math.PI) / 180), V[1] - d * Math.sin((mid * Math.PI) / 180)];
    label = { at: P, box: tbox(P, t, size), size };
  }
  return { m, V, a0, span, r, label };
}
export function layoutFig(f: Fig, fit: Fit): FigLay {
  const S = (p: Pt) => toScreen(fit, p);
  const segs: SegLay[] = f.segs.map(s => {
    const A = S(s.a), B = S(s.b), d = sub(B, A), L = len(d) || 1, u: Pt = [d[0] / L, d[1] / L], n: Pt = [u[1], -u[0]];   // n = left of A->B on screen
    const M = lerpP(A, B, 0.5);
    const ticks: Pt[][] = [];
    for (let i = 0; i < (s.ticks ?? 0); i++) {
      const o = (i - ((s.ticks ?? 1) - 1) / 2) * 13, c = add(M, mul(u, o));
      ticks.push([add(c, mul(n, 16)), add(c, mul(n, -16))]);
    }
    const chev: Pt[][] = [];
    if (s.par) {
      const P = lerpP(A, B, s.parAt ?? 0.22);
      for (let i = 0; i < s.par; i++) {
        const tip = add(P, mul(u, 18 * i));
        chev.push([add(add(tip, mul(u, -18)), mul(n, 14)), tip, add(add(tip, mul(u, -18)), mul(n, -14))]);
      }
    }
    let label: SegLay['label'] = null;
    const t = [s.text ?? '', s.alt ?? ''].sort((x, y) => textW(y, LABEL) - textW(x, LABEL))[0]!;
    if (t) {
      const side = s.side ?? 1, w = textW(t, LABEL), h = LABEL * 0.88;
      const ext = (w / 2) * Math.abs(n[0]) + (h / 2) * Math.abs(n[1]);
      const P = add(M, mul(n, side * (ext + (s.ticks ? 28 : 16))));
      label = { at: P, box: tbox(P, t, LABEL) };
    }
    let name: SegLay['name'] = null;
    if (s.name) { const P = add(B, mul(u, 42)); name = { at: P, box: tbox(P, s.name, NAME) }; }
    return { s, A, B, ticks, chev, label, name };
  });
  const angles = f.angles.map(m => angleLay(m, S));
  const points = f.points.map(p => { const P = S(p.at), u = dirv(p.dir), dd = p.dist ?? 46, Q: Pt = [P[0] + dd * u[0], P[1] - dd * u[1]]; return { p, P, at: Q, box: tbox(Q, p.name, LETTER) }; });
  const words = (f.words ?? []).map(w => { const size = w.size ?? WORD, P = S(w.at); return { w, at: P, size, box: tbox(P, w.text, size) }; });
  return { fit, segs, angles, points, words };
}

/** what breaks the readability rules (empty = fine); both states: before the answer and in the worked solution */
export function figProblems(f: Fig, fr: Frame): string[] {
  const fit = fitFig(f, fr);
  const pre: Fig = { ...f, segs: f.segs.filter(s => !s.solve), angles: f.angles.filter(a => a.solve !== 'only') };
  const out = stateProblems(pre, fit);
  for (const x of stateProblems(f, fit)) if (!out.includes(x)) out.push('solution: ' + x);
  return out;
}
const hit = (b: Box, P: readonly Pt[], pad: number): boolean => {
  const x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, c = P[i]!, n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 4));
    for (let j = 0; j <= n; j++) { const x = a[0] + ((c[0] - a[0]) * j) / n, y = a[1] + ((c[1] - a[1]) * j) / n; if (x > x0 && x < x1 && y > y0 && y < y1) return true; }
  }
  return false;
};
function stateProblems(f: Fig, fit: Fit): string[] {
  const L = layoutFig(f, fit), fr = fit.fr, out: string[] = [];
  const lines: Pt[][] = [...L.segs.map(x => [x.A, x.B]), ...L.segs.flatMap(x => [...x.ticks, ...x.chev])];
  const arcs = L.angles.filter(a => !a.m.nameOnly).map(a => ({ id: a.m.id, P: a.m.box ? boxPts(a.V, a.a0, a.span, a.r) : arcPts(a.V, a.r, a.a0, a.span) }));
  const labels: { id: string; b: Box }[] = [
    ...L.angles.filter(a => a.label).map(a => ({ id: 'angle ' + a.m.id, b: a.label!.box })),
    ...L.segs.filter(s => s.label).map(s => ({ id: 'length ' + (s.s.text ?? ''), b: s.label!.box })),
    ...L.segs.filter(s => s.name).map(s => ({ id: 'name ' + s.s.name, b: s.name!.box })),
    ...L.points.map(p => ({ id: 'point ' + p.p.name, b: p.box })),
    ...L.words.map(w => ({ id: 'word ' + w.w.text, b: w.box })),
  ];
  for (const { id, b } of labels) {
    if (b.x0 < fr.x + 4 || b.x1 > fr.x + fr.w - 4 || b.y0 < fr.y + 4 || b.y1 > fr.y + fr.h - 4) out.push(`${id} leaves the frame`);
    if (lines.some(P => hit(b, P, 3))) out.push(`${id} touches a line`);
    if (arcs.some(a => 'angle ' + a.id !== id && hit(b, a.P, 2))) out.push(`${id} touches an arc`);
  }
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) {
    const a = labels[i]!.b, b = labels[j]!.b;
    if (a.x0 < b.x1 + 4 && b.x0 < a.x1 + 4 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4) out.push(`${labels[i]!.id} overlaps ${labels[j]!.id}`);
  }
  // every drawn angle with a label must match its label when the label is a plain measure ("62°")
  for (const a of f.angles) {
    const m = /^(\d+)°$/.exec(a.alt ?? a.text ?? '');
    if (m && Math.abs(measure(a.v, a.p, a.q) - Number(m[1])) > 0.5) out.push(`angle ${a.id} is drawn at ${measure(a.v, a.p, a.q).toFixed(1)}°, labelled ${m[1]}°`);
  }
  return out;
}

// ---------- the frames the page draws figures in (pure, so generators check the same layout) ----------
/** a figure alone on the stage */
export const FR_WIDE: Frame = { x: 220, y: 80, w: 1480, h: 920 };
/** a figure beside a proof frame or a card (practice) */
export const FR_LEFT: Frame = { x: 40, y: 80, w: 620, h: 920 };
/** parts 1-4: the figure above the lesson's proof / board */
export const FR_LESSON: Frame = { x: 40, y: 70, w: 640, h: 940 };
/** the right-hand area beside a figure: a proof frame or a card */
export const FR_RIGHT: Frame = { x: 690, y: 70, w: 1190, h: 940 };
/** one cell of a gallery of n figures */
export function galleryFrames(n: number, area: Frame = { x: 60, y: 90, w: 1800, h: 900 }): Frame[] {
  const gap = 36, w = (area.w - gap * (n - 1)) / n;
  return Array.from({ length: n }, (_, i) => ({ x: area.x + i * (w + gap), y: area.y, w, h: area.h - 120 }));
}
