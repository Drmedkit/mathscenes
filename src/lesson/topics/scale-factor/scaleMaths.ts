// scaleMaths.ts: the pure maths and the pure layout of the scale-factor model (no DOM, no canvas).
//   shapes     rect, L, U, triangles (grid or side-side-side), parallelograms; scale / move / rotate / reflect
//   checks     side lengths, angles, "is B a scaled copy of A with factor k" (every side x k AND every angle kept)
//   Pic        a picture = figures on a grid (or on plain paper) with side labels, vertex letters, angle marks,
//              captions, dashed moves (right 3, up 2), a diagonal ray, a hop arrow (x2) and free marks ('?')
//   layoutPic  where every piece goes inside a Frame; checks the readability rules (numbers >= 60 px, nothing
//              outside the frame, no label on a line, no two labels overlapping) and says why when it cannot hold.
// Grid units, y UP (the way kids say "up 2"); the layout turns them into screen px.
import { type Box, type Pt, type Q, box, boxesOverlap, padBox, rat, toQ, unionBox } from '../../../core/math';
import { type Frame, hitsLines } from '../../../blocks/block';

export type V = readonly [number, number];
export type FigRole = 'first' | 'second' | 'wrong' | 'pick' | 'link' | 'dim';

// ---------- shapes (grid units, y up, counter-clockwise from the bottom-left corner) ----------
/** rectangle: sides 0 bottom, 1 right, 2 top, 3 left */
export const rect = (w: number, h: number): V[] => [[0, 0], [w, 0], [w, h], [0, h]];
/** L: width w, height h, the foot is b tall, the upright is a wide. sides: 0 bottom w, 1 right b, 2 step (w-a),
 *  3 inner (h-b), 4 top a, 5 left h */
export const ell = (w: number, h: number, a: number, b: number): V[] => [[0, 0], [w, 0], [w, b], [a, b], [a, h], [0, h]];
/** U (a notch cut into the top): width w, height h, posts a wide, notch d deep.
 *  sides: 0 bottom w, 1 right h, 2 top a, 3 down d, 4 notch floor (w-2a), 5 up d, 6 top a, 7 left h */
export const yoo = (w: number, h: number, a: number, d: number): V[] => [[0, 0], [w, 0], [w, h], [w - a, h], [w - a, h - d], [a, h - d], [a, h], [0, h]];
/** T: a bar w x b on top of a stem s wide, h tall in all (stem centred, w - s even) */
export const tee = (w: number, h: number, s: number, b: number): V[] => {
  const m = (w - s) / 2;
  return [[m, 0], [m + s, 0], [m + s, h - b], [w, h - b], [w, h], [0, h], [0, h - b], [m, h - b]];
};
/** a triangle with sides a (base), b, c: base from (0,0) to (a,0), apex above (side-side-side) */
export function sss(a: number, b: number, c: number): V[] {
  // apex P: |P - (0,0)| = c, |P - (a,0)| = b
  const x = (a * a + c * c - b * b) / (2 * a);
  const y = Math.sqrt(Math.max(0, c * c - x * x));
  return [[0, 0], [a, 0], [x, y]];
}
/** parallelogram: base w, slanted side s at angle deg (90 = rectangle) */
export function para(w: number, s: number, deg: number): V[] {
  const r = (deg * Math.PI) / 180, dx = s * Math.cos(r), dy = s * Math.sin(r);
  return [[0, 0], [w, 0], [w + dx, dy], [dx, dy]];
}
export const scale = (P: readonly V[], k: number, about: V = [0, 0]): V[] => P.map(([x, y]) => [about[0] + (x - about[0]) * k, about[1] + (y - about[1]) * k]);
export const stretch = (P: readonly V[], kx: number, ky: number): V[] => P.map(([x, y]) => [x * kx, y * ky]);
export const move = (P: readonly V[], dx: number, dy: number): V[] => P.map(([x, y]) => [x + dx, y + dy]);
/** turn a quarter turn counter-clockwise n times, then back into the first quadrant (min x = min y = 0) */
export function turn(P: readonly V[], n: number): V[] {
  let Q = P.map(p => [p[0], p[1]] as V);
  for (let i = 0; i < ((n % 4) + 4) % 4; i++) Q = Q.map(([x, y]) => [-y, x]);
  return home(Q);
}
/** mirror left-right (the vertex order is kept, so correspondence by index still holds) */
export const flip = (P: readonly V[]): V[] => home(P.map(([x, y]) => [-x, y]));
export function home(P: readonly V[]): V[] {
  const mx = Math.min(...P.map(p => p[0])), my = Math.min(...P.map(p => p[1]));
  return P.map(([x, y]) => [clean(x - mx), clean(y - my)]);
}
const clean = (x: number) => (Math.abs(x - Math.round(x)) < 1e-9 ? Math.round(x) : x);
export const extent = (P: readonly V[]): { w: number; h: number } => ({
  w: Math.max(...P.map(p => p[0])) - Math.min(...P.map(p => p[0])), h: Math.max(...P.map(p => p[1])) - Math.min(...P.map(p => p[1])),
});

// ---------- measures ----------
export const sideLen = (P: readonly V[], i: number): number => { const a = P[i]!, b = P[(i + 1) % P.length]!; return Math.hypot(b[0] - a[0], b[1] - a[1]); };
export const sides = (P: readonly V[]): number[] => P.map((_, i) => sideLen(P, i));
/** the interior angle at vertex i in degrees (0..360, counter-clockwise polygons) */
export function angleAt(P: readonly V[], i: number): number {
  const n = P.length, v = P[i]!, a = P[(i - 1 + n) % n]!, b = P[(i + 1) % n]!;
  const ccw = signed(P) > 0;
  const t1 = Math.atan2(a[1] - v[1], a[0] - v[0]), t2 = Math.atan2(b[1] - v[1], b[0] - v[0]);
  let d = ((ccw ? t1 - t2 : t2 - t1) * 180) / Math.PI;
  while (d < 0) d += 360; while (d >= 360) d -= 360;
  return d;
}
export const signed = (P: readonly V[]): number => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]!; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

/** is B a scaled copy of A (vertex i of A goes to vertex i of B)? every side x the same k AND every angle kept */
export function scaledCopy(A: readonly V[], B: readonly V[]): { ok: boolean; k: number | null; ratios: number[]; anglesKept: boolean } {
  if (A.length !== B.length) return { ok: false, k: null, ratios: [], anglesKept: false };
  const ra = sides(A), rb = sides(B);
  const ratios = ra.map((l, i) => rb[i]! / l);
  const same = ratios.every(r => near(r, ratios[0]!));
  const anglesKept = A.every((_, i) => Math.abs(angleAt(A, i) - angleAt(B, i)) < 1e-6);
  return { ok: same && anglesKept, k: same ? ratios[0]! : null, ratios, anglesKept };
}
/** the scale factor as an exact friendly fraction (copy / original), asserted */
export function factorQ(orig: number, copy: number): Q {
  if (Number.isInteger(orig) && Number.isInteger(copy)) return rat(copy, orig);
  const q = toQ(copy / orig, 24);
  if (!q) throw new Error(`factorQ: ${copy}/${orig} is not a friendly fraction`);
  return q;
}

// ---------- the picture ----------
/** a side label: TeX; `alt` replaces it when the answer is revealed (step 'fiaj') */
export type Lab = string | { t: string; alt?: string; col?: FigRole | 'ink'; altCol?: FigRole | 'ink' };
export interface PicFig {
  pts: V[];
  role: FigRole;
  style?: 'wash' | 'line' | 'dash';
  /** TeX per side i (pts[i] -> pts[i+1]); null = none */
  labels?: (Lab | null)[];
  /** vertex letters (TeX) */
  letters?: (string | null)[];
  /** angle marks: a right-angle square, or an arc with an optional label inside the corner */
  angles?: { at: number; t?: string; right?: boolean; col?: FigRole | 'ink' }[];
  caption?: string;
  /** a painted photo inside the frame; [w0, h0] = the original photo's size (the content scales with the figure) */
  photo?: [number, number];
  /** a polyline (a copy being drawn), not a closed shape */
  open?: boolean;
  /** the figure slides by this many units as step 'fiS' goes 0 -> 1 */
  slide?: V;
  /** this figure is a scaled copy of figs[of.fig] with factor k (asserted when the block is built) */
  of?: { fig: number; k: number };
  /** labels that knowingly do NOT match the drawn lengths (the "labels over drawn lengths" candidate) */
  liar?: boolean;
}
export interface Pic {
  cols: number; rows: number;
  /** grid paper (true) or plain labeled figures (false) */
  grid: boolean;
  figs: PicFig[];
  /** dashed moves: right/left dx, then up/down dy, with the numbers beside the legs */
  moves?: { from: V; dx: number; dy: number; role: FigRole; nums?: boolean; vFirst?: boolean }[];
  ray?: { from: V; to: V };
  dots?: { at: V; role: FigRole }[];
  marks?: { at: V; t: string; role: FigRole }[];
  hops?: { from: V; to: V; t: string; lift?: number }[];
  /** the largest grid square in px (default 120) */
  umax?: number;
  /** the order the figures are painted in (default: as listed) */
  order?: number[];
}

// ---------- sizes ----------
export const NUM = 60, LET = 50, CAP = 44, MIN_U_GRID = 40, MIN_SIDE_PX = 34;
const CW: Record<string, number> = { '?': 0.47, '.': 0.28, ',': 0.28, '°': 0.4, '×': 0.78, ' ': 0.25, '−': 0.78, '+': 0.78, "'": 0.28 };
/** a generous estimate of a TeX label's ink box (w, h) at size s (the real box is measured in the browser) */
export function texEst(t: string, s: number): [number, number] {
  let w = 0, h = 0.74 * s;
  let rest = t;
  for (const m of t.matchAll(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g)) {
    w += Math.max(m[1]!.length, m[2]!.length) * 0.4 * s + 0.26 * s; h = 1.32 * s; rest = rest.replace(m[0], '');
  }
  rest = rest.replace(/\^\\circ/g, '°').replace(/\\times/g, '×').replace(/\\[,;: ]/g, ' ').replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\[a-zA-Z]+/g, '').replace(/[{}^_]/g, '');
  for (const ch of rest) w += (CW[ch] ?? (/[A-Z]/.test(ch) ? 0.78 : /[0-9]/.test(ch) ? 0.52 : 0.56)) * s;
  return [w + 6, h];
}
/** a generous estimate of a sans label's width */
export const wordsEst = (t: string, s: number): [number, number] => [t.length * 0.58 * s + 4, 0.84 * s];

// ---------- layout ----------
export interface Placed { t: string; cx: number; cy: number; box: Box; size: number }
export interface FigLayout {
  pts: Pt[];
  box: Box;
  labels: (Placed | null)[];
  alts: (Placed | null)[];
  letters: (Placed | null)[];
  angles: { at: number; v: Pt; a0: number; a1: number; r: number; right: boolean; label: Placed | null }[];
  caption: Placed | null;
  /** the slide in px */
  dx: number; dy: number;
}
export interface PicLayout {
  u: number;
  gridBox: Box;
  P(v: V): Pt;
  figs: FigLayout[];
  moves: { legs: [Pt, Pt][]; nums: Placed[] }[];
  ray: [Pt, Pt] | null;
  dots: Pt[];
  marks: Placed[];
  hops: { a: Pt; b: Pt; apex: Pt; label: Placed }[];
  /** null when every rule holds, else the first rule that breaks */
  why: string | null;
}

function inside(P: readonly Pt[], x: number, y: number): boolean {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i]!, [xj, yj] = P[j]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const placed = (t: string, cx: number, cy: number, w: number, h: number, size: number): Placed => ({ t, cx, cy, size, box: box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) });
const labT = (l: Lab): string => (typeof l === 'string' ? l : l.t);
const labAlt = (l: Lab): string | null => (typeof l === 'string' ? null : l.alt ?? null);

export function layoutPic(pic: Pic, fr: Frame): PicLayout {
  const umax = pic.umax ?? 120;
  const u = Math.min(umax, fr.w / pic.cols, fr.h / pic.rows);
  const gx = fr.x + (fr.w - pic.cols * u) / 2, gy1 = fr.y + (fr.h + pic.rows * u) / 2;
  const P = (v: V): Pt => [gx + v[0] * u, gy1 - v[1] * u];
  const gridBox = box(gx, gy1 - pic.rows * u, gx + pic.cols * u, gy1);
  const GAP = 14;

  const figs: FigLayout[] = pic.figs.map(f => {
    const dx = (f.slide?.[0] ?? 0) * u, dy = -(f.slide?.[1] ?? 0) * u;
    const pts = f.pts.map(P);
    const n = pts.length, closed = !f.open;
    const segs = closed ? n : n - 1;
    const labels: (Placed | null)[] = [], alts: (Placed | null)[] = [];
    for (let i = 0; i < segs; i++) {
      const l = f.labels?.[i] ?? null;
      if (!l) { labels.push(null); alts.push(null); continue; }
      const a = pts[i]!, b = pts[(i + 1) % n]!;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const d: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
      let nx = d[1], ny = -d[0];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      // closed: outward; open (a copy being drawn): below a horizontal leg, right of a vertical one
      const flipIt = closed ? inside(pts, mx + nx * 3, my + ny * 3) : Math.abs(d[0]) > Math.abs(d[1]) ? ny < 0 : nx < 0;
      if (flipIt) { nx = -nx; ny = -ny; }
      const put = (t: string): Placed => {
        const [w, h] = texEst(t, NUM);
        const ext = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2;
        return placed(t, mx + nx * (GAP + ext), my + ny * (GAP + ext), w, h, NUM);
      };
      labels.push(put(labT(l)));
      const alt = labAlt(l);
      alts.push(alt ? put(alt) : null);
    }
    // vertex letters: outside the corner, along the outward bisector
    const letters = pts.map((v, i) => {
      const t = f.letters?.[i];
      if (!t) return null;
      const a = pts[(i - 1 + n) % n]!, b = pts[(i + 1) % n]!;
      const ua = unit([a[0] - v[0], a[1] - v[1]]), ub = unit([b[0] - v[0], b[1] - v[1]]);
      let bx = -(ua[0] + ub[0]), by = -(ua[1] + ub[1]);
      if (Math.hypot(bx, by) < 1e-6) { bx = ua[1]; by = -ua[0]; }
      [bx, by] = unit([bx, by]);
      if (inside(pts, v[0] + bx * 4, v[1] + by * 4)) { bx = -bx; by = -by; }
      const [w, h] = texEst(t, LET);
      const ext = Math.abs(bx) * w / 2 + Math.abs(by) * h / 2;
      return placed(t, v[0] + bx * (12 + ext), v[1] + by * (12 + ext), w, h, LET);
    });
    // angle marks: inside the corner
    const angles = (f.angles ?? []).map(an => {
      const v = pts[an.at]!, a = pts[(an.at - 1 + n) % n]!, b = pts[(an.at + 1) % n]!;
      const ta = Math.atan2(a[1] - v[1], a[0] - v[0]), tb = Math.atan2(b[1] - v[1], b[0] - v[0]);
      // the interior sweep: from the arm whose sweep to the other contains the inside
      let a0 = ta, a1 = tb;
      let sweep = a1 - a0; while (sweep <= 0) sweep += Math.PI * 2;
      const mid = a0 + sweep / 2;
      if (!inside(pts, v[0] + Math.cos(mid) * 6, v[1] + Math.sin(mid) * 6)) { a0 = tb; a1 = ta; sweep = Math.PI * 2 - sweep; }
      const shortest = Math.min(sideLen(f.pts, an.at), sideLen(f.pts, (an.at - 1 + n) % n)) * u;
      const r = Math.max(24, Math.min(54, 0.42 * u, shortest * 0.4));
      let label: Placed | null = null;
      if (an.t) {
        const m2 = a0 + sweep / 2, [w, h] = texEst(an.t, 46);
        const cxy = [Math.cos(m2), Math.sin(m2)], ext = Math.abs(cxy[0]!) * w / 2 + Math.abs(cxy[1]!) * h / 2;
        label = placed(an.t, v[0] + cxy[0]! * (r + 10 + ext), v[1] + cxy[1]! * (r + 10 + ext), w, h, 46);
      }
      return { at: an.at, v, a0, a1: a0 + sweep, r, right: !!an.right, label };
    });
    const fbox = unionBox([box(Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1])))]);
    let caption: Placed | null = null;
    if (f.caption) {
      const all = unionBox([fbox, ...labels.filter((x): x is Placed => !!x).map(l => l.box), ...letters.filter((x): x is Placed => !!x).map(l => l.box)]);
      const [w, h] = wordsEst(f.caption, CAP);
      caption = placed(f.caption, fbox.cx, all.y1 + 14 + h / 2, w, h, CAP);
    }
    return { pts, box: fbox, labels, alts, letters, angles, caption, dx, dy };
  });

  const moves = (pic.moves ?? []).map(m => {
    const a = P(m.from), c = P([m.from[0] + m.dx, m.from[1] + m.dy]);
    const legs: [Pt, Pt][] = [];
    const nums: Placed[] = [];
    const num = (n: number, x: number, y: number, dir: Pt) => {
      const t = String(Math.abs(n)), [w, h] = texEst(t, NUM);
      nums.push(placed(t, x + dir[0] * (GAP + w / 2), y + dir[1] * (GAP + h / 2), w, h, NUM));
    };
    if (!m.vFirst) {
      // across, then up/down: the across number on the side away from the climb, the climb number outside the turn
      const b = P([m.from[0] + m.dx, m.from[1]]);
      if (m.dx) legs.push([a, b]);
      if (m.dy) legs.push([b, c]);
      if (m.nums !== false) {
        if (m.dx) num(m.dx, (a[0] + b[0]) / 2, a[1], [0, m.dy > 0 ? 1 : -1]);
        if (m.dy) num(m.dy, b[0], (b[1] + c[1]) / 2, [m.dx >= 0 ? 1 : -1, 0]);
      }
    } else {
      // up/down first, then across (the legs stay outside a triangle whose slanted side they replace)
      const b = P([m.from[0], m.from[1] + m.dy]);
      if (m.dy) legs.push([a, b]);
      if (m.dx) legs.push([b, c]);
      if (m.nums !== false) {
        if (m.dy) num(m.dy, a[0], (a[1] + b[1]) / 2, [m.dx >= 0 ? -1 : 1, 0]);
        if (m.dx) num(m.dx, (b[0] + c[0]) / 2, b[1], [0, m.dy > 0 ? -1 : 1]);
      }
    }
    return { legs, nums };
  });
  const ray: [Pt, Pt] | null = pic.ray ? [P(pic.ray.from), P(pic.ray.to)] : null;
  const dots = (pic.dots ?? []).map(d => P(d.at));
  const marks = (pic.marks ?? []).map(m => { const [w, h] = texEst(m.t, NUM); const p = P(m.at); return placed(m.t, p[0], p[1], w, h, NUM); });
  const hops = (pic.hops ?? []).map(hp => {
    const a = P(hp.from), b = P(hp.to);
    const lift = (hp.lift ?? 1.2) * u;
    const apex: Pt = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
    const [w, h] = texEst(hp.t, NUM);
    return { a, b, apex, label: placed(hp.t, apex[0], apex[1] - 16 - h / 2, w, h, NUM) };
  });

  // ---------- the readability rules ----------
  let why: string | null = null;
  const fail = (s: string) => { why ??= s; };
  if (pic.grid && u < MIN_U_GRID) fail(`grid squares of ${Math.round(u)} px are too small to count`);
  pic.figs.forEach((f, i) => {
    const L = sides(f.pts).slice(0, f.open ? f.pts.length - 1 : f.pts.length);
    if (Math.min(...L) * u < MIN_SIDE_PX) fail(`figure ${i} has a side of ${Math.round(Math.min(...L) * u)} px`);
  });
  // two states: before and after the slides
  for (const s of [0, 1]) {
    const shift = (b: Box, fl: FigLayout) => (s ? box(b.x0 + fl.dx, b.y0 + fl.dy, b.x1 + fl.dx, b.y1 + fl.dy) : b);
    const texts: { b: Box; what: string }[] = [];
    figs.forEach((fl, i) => {
      fl.labels.forEach((l, j) => { if (l) texts.push({ b: shift(l.box, fl), what: `label ${i}.${j} "${l.t}"` }); });
      fl.alts.forEach((l, j) => { if (l && !fl.labels[j]) texts.push({ b: shift(l.box, fl), what: `answer ${i}.${j}` }); });
      fl.letters.forEach((l, j) => { if (l) texts.push({ b: shift(l.box, fl), what: `letter ${i}.${j} "${l.t}"` }); });
      fl.angles.forEach((a, j) => { if (a.label) texts.push({ b: shift(a.label.box, fl), what: `angle ${i}.${j}` }); });
      if (fl.caption) texts.push({ b: shift(fl.caption.box, fl), what: `caption ${i}` });
    });
    moves.forEach((m, i) => m.nums.forEach((nb, j) => texts.push({ b: nb.box, what: `move ${i}.${j}` })));
    marks.forEach((m, i) => texts.push({ b: m.box, what: `mark ${i}` }));
    hops.forEach((h, i) => texts.push({ b: h.label.box, what: `hop ${i}` }));
    const lines: Pt[][] = [];
    figs.forEach((fl, i) => {
      const Q = fl.pts.map(p => (s ? [p[0] + fl.dx, p[1] + fl.dy] : p) as Pt);
      lines.push(pic.figs[i]!.open ? Q : [...Q, Q[0]!]);
    });
    moves.forEach(m => m.legs.forEach(l => lines.push(l)));
    if (ray) lines.push(ray);
    hops.forEach(h => lines.push(hopPts(h.a, h.b, h.apex)));
    for (const t of texts) {
      if (t.b.x0 < fr.x - 2 || t.b.x1 > fr.x + fr.w + 2 || t.b.y0 < fr.y - 2 || t.b.y1 > fr.y + fr.h + 2) fail(`${t.what} runs outside the frame`);
      if (hitsLines(t.b, lines, 3)) fail(`${t.what} sits on a line`);
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      if (boxesOverlap(padBox(texts[i]!.b, 4), padBox(texts[j]!.b, 4))) fail(`${texts[i]!.what} overlaps ${texts[j]!.what}`);
    }
  }
  return { u, gridBox, P, figs, moves, ray, dots, marks, hops, why };
}
const unit = (v: Pt): Pt => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
/** the hop arrow: a quadratic arc over the top */
export function hopPts(a: Pt, b: Pt, apex: Pt, n = 32): Pt[] {
  const c: Pt = [2 * apex[0] - (a[0] + b[0]) / 2, 2 * apex[1] - (a[1] + b[1]) / 2];
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s = 1 - t; return [s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]] as Pt; });
}

/** the honesty checks of a picture: copies really are copies, numeric labels match the drawn lengths */
export function picMaths(pic: Pic): string | null {
  for (const [i, f] of pic.figs.entries()) {
    if (f.of) {
      const src = pic.figs[f.of.fig];
      if (!src) return `figure ${i}: no figure ${f.of.fig}`;
      const sc = scaledCopy(src.pts, f.pts);
      if (!sc.ok || sc.k === null || !near(sc.k, f.of.k)) return `figure ${i} is not a x${f.of.k} copy of figure ${f.of.fig}`;
    }
    if (f.liar) continue;
    const L = sides(f.pts);
    for (const [j, l] of (f.labels ?? []).entries()) {
      if (!l) continue;
      for (const t of [labT(l), labAlt(l)]) {
        const v = t === null ? null : texNumber(t);
        if (v !== null && !near(v, L[j]!)) return `figure ${i} side ${j} is ${L[j]!.toFixed(3)} but labelled ${t}`;
      }
    }
  }
  return null;
}
/** the value of a numeric TeX label (12, 7.5, \tfrac{5}{2}, 2\tfrac{1}{2}), or null for anything else */
export function texNumber(t: string): number | null {
  let m = /^(\d+(?:\.\d+)?)$/.exec(t);
  if (m) return Number(m[1]);
  m = /^(\d*)\\tfrac\{(\d+)\}\{(\d+)\}$/.exec(t);
  if (m) return (m[1] ? Number(m[1]) : 0) + Number(m[2]) / Number(m[3]);
  return null;
}

// ---------- arranging figures ----------
/** shapes side by side, bottom-aligned, `gap` units apart, `margin` units around; returns the moved shapes + grid size */
export function sideBySide(shapes: readonly (readonly V[])[], gap = 2, margin = 1, top = 0): { placed: V[][]; cols: number; rows: number } {
  let x = margin;
  const placed: V[][] = [];
  let hmax = 0;
  for (const S of shapes) {
    const h0 = home(S), e = extent(h0);
    placed.push(move(h0, x, margin));
    x += e.w + gap; hmax = Math.max(hmax, e.h);
  }
  return { placed, cols: Math.ceil(x - gap + margin), rows: Math.ceil(hmax + 2 * margin + top) };
}
/** four shapes in a 2 x 2 block (reading order), each centred bottom-aligned in its cell */
export function twoByTwo(shapes: readonly (readonly V[])[], gap = 2, margin = 1): { placed: V[][]; cols: number; rows: number } {
  const H = shapes.map(s => extent(home(s)));
  const cw = Math.max(...H.map(e => e.w)), ch = [Math.max(H[0]!.h, H[1]?.h ?? 0), Math.max(H[2]?.h ?? 0, H[3]?.h ?? 0)];
  const placed = shapes.map((S, i) => {
    const col = i % 2, row = Math.floor(i / 2), e = H[i]!;
    const x = margin + col * (cw + gap) + Math.floor((cw - e.w) / 2);
    const y = row === 0 ? margin + ch[1]! + gap : margin;
    return move(home(S), x, y);
  });
  return { placed, cols: Math.ceil(2 * margin + 2 * cw + gap), rows: Math.ceil(2 * margin + ch[0]! + ch[1]! + gap) };
}
export const fitsIn = (pic: Pic, fr: Frame): boolean => layoutPic(pic, fr).why === null && picMaths(pic) === null;
