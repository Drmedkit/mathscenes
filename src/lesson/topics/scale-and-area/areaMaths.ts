// areaMaths.ts: the pure maths and layout of "scale factor and area" (no DOM, no canvas).
//   shapes      a rectangle, a parallelogram, a triangle or a figure made of unit squares, in grid units (y up)
//   copies      every length x kx (along) and x ky (up); kx = ky = k is a scaled copy
//   tiles       the copy split into whole copies of the original (k rows of k for rectangles and parallelograms,
//               k x k upright and turned triangles for a triangle), or a unit-square figure split into k-by-k groups
//   layoutArea  every position on grid paper inside a Frame: label boxes outside the figures, numbers >= 60 px,
//               tile counts >= 48 px only where they fit; `why` names the first rule that breaks (the block throws)
import { type Box, box } from '../../../core/math';
import type { Frame } from '../../../blocks/block';
import { texEst } from '../scale-factor/scaleMaths';

export type V = readonly [number, number];
export type Pt = [number, number];
export type Shape =
  | { kind: 'rect'; w: number; h: number }
  | { kind: 'para'; w: number; h: number; s: number }
  | { kind: 'tri'; w: number; h: number; a: number }
  | { kind: 'cells'; cells: V[] };

// ---------- shapes ----------
export function shapePts(S: Shape): V[] {
  switch (S.kind) {
    case 'rect': return [[0, 0], [S.w, 0], [S.w, S.h], [0, S.h]];
    case 'para': return [[0, 0], [S.w, 0], [S.w + S.s, S.h], [S.s, S.h]];
    case 'tri': return [[0, 0], [S.w, 0], [S.a, S.h]];
    case 'cells': return traceCells(S.cells);
  }
}
/** the outline of a connected figure made of unit squares (no holes), counter-clockwise, corners only */
export function traceCells(cells: readonly V[]): V[] {
  const key = (x: number, y: number) => `${x},${y}`;
  const has = new Set(cells.map(([x, y]) => key(x, y)));
  // boundary edges, each cell counter-clockwise; an edge shared by two cells cancels
  const edges = new Map<string, V>();
  for (const [x, y] of cells) {
    const sides: [V, V, number, number][] = [[[x, y], [x + 1, y], x, y - 1], [[x + 1, y], [x + 1, y + 1], x + 1, y], [[x + 1, y + 1], [x, y + 1], x, y + 1], [[x, y + 1], [x, y], x - 1, y]];
    for (const [a, b, nx, ny] of sides) if (!has.has(key(nx, ny))) edges.set(key(a[0], a[1]), b);
  }
  const start = [...edges.keys()].sort()[0]!;
  const out: V[] = [];
  let k = start;
  for (let guard = 0; guard < 4 * cells.length + 8; guard++) {
    const [x, y] = k.split(',').map(Number) as [number, number];
    out.push([x, y]);
    const nb = edges.get(k);
    if (!nb) throw new Error('traceCells: open outline');
    k = key(nb[0], nb[1]);
    if (k === start) break;
  }
  // drop the points in the middle of a straight run
  return out.filter((p, i) => {
    const a = out[(i - 1 + out.length) % out.length]!, b = out[(i + 1) % out.length]!;
    return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0;
  });
}
export function polyArea(P: readonly V[]): number {
  let s = 0;
  P.forEach((p, i) => { const q = P[(i + 1) % P.length]!; s += p[0] * q[1] - q[0] * p[1]; });
  return Math.abs(s) / 2;
}
/** the exact area of a shape in square units */
export function areaOf(S: Shape): number {
  switch (S.kind) {
    case 'rect': case 'para': return S.w * S.h;
    case 'tri': return (S.w * S.h) / 2;
    case 'cells': return S.cells.length;
  }
}
export const stretchPts = (P: readonly V[], kx: number, ky: number): V[] => P.map(([x, y]) => [x * kx, y * ky] as V);
export const movePts = (P: readonly V[], dx: number, dy: number): V[] => P.map(([x, y]) => [x + dx, y + dy] as V);
export function extentOf(P: readonly V[]): { x0: number; x1: number; y0: number; y1: number } {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

// ---------- tiling ----------
export interface Tile { pts: V[]; i: number; j: number; turned: boolean }
/** can the copy (kx, ky) be split into whole copies of the original? */
export function tiles(S: Shape, kx: number, ky: number): Tile[] | null {
  if (!Number.isInteger(kx) || !Number.isInteger(ky) || kx < 1 || ky < 1) return null;
  const P = shapePts(S);
  if (S.kind === 'rect' || S.kind === 'para') {
    const s = S.kind === 'para' ? S.s : 0, out: Tile[] = [];
    for (let j = 0; j < ky; j++) for (let i = 0; i < kx; i++) out.push({ pts: movePts(P, i * S.w + j * s, j * S.h), i, j, turned: false });
    return out;
  }
  if (S.kind === 'tri') {
    if (kx !== ky) return null;
    const k = kx, U: V = [S.w, 0], W: V = [S.a, S.h], out: Tile[] = [];
    const at = (i: number, j: number): V => [i * U[0] + j * W[0], i * U[1] + j * W[1]];
    for (let j = 0; j < k; j++) for (let i = 0; i + j < k; i++) {
      out.push({ pts: movePts(P, ...at(i, j)), i: 2 * i, j, turned: false });
      if (i + j <= k - 2) out.push({ pts: [at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)], i: 2 * i + 1, j, turned: true });
    }
    return out.sort((a, b) => a.j - b.j || a.i - b.i);
  }
  return null;
}
/** a unit-square figure scaled by a whole k: every unit square becomes one k-by-k group */
export function groups(S: Shape, k: number): { cell: V; sq: V[] }[] | null {
  if (S.kind !== 'cells' || !Number.isInteger(k) || k < 1) return null;
  return S.cells.map(([x, y]) => ({ cell: [x, y] as V, sq: [[x * k, y * k], [x * k + k, y * k], [x * k + k, y * k + k], [x * k, y * k + k]] as V[] }));
}

// ---------- the picture ----------
export interface AreaPic {
  shape: Shape;
  /** the copy's factors along (kx) and up (ky); a scaled copy has kx = ky */
  kx: number; ky: number;
  grid?: boolean;
  /** original above the copy (stack) or beside it (side); default: whichever is bigger */
  arrange?: 'side' | 'stack';
  /** TeX labels: the original's base and height, the copy's base and height */
  labels?: { ow?: string; oh?: string; cw?: string; ch?: string };
  /** TeX inside the figures (their areas) */
  area?: { o?: string; c?: string };
  /** copies: the copy is tiled by originals; groups: unit squares become k-by-k groups; reverse: the original is tiled by copies (k = 1/m) */
  tile?: 'copies' | 'groups' | 'reverse' | null;
  /** number the tiles 1, 2, 3 ... */
  count?: boolean;
  /** the largest grid square in px */
  umax?: number;
  /** the copy's squares stay hidden until step 'cG' (practice: counting them would give the answer away) */
  hideCopyGrid?: boolean;
  /** only the original (a plan or a figure whose copy is not drawn): no room is kept for a copy */
  solo?: boolean;
}
export const NUM = 60, AREA = 60, COUNT = 48, MIN_U = 34, GAP = 18;

export interface Placed { t: string; cx: number; cy: number; box: Box; size: number }
export interface AreaLayout {
  u: number;
  cols: number; rows: number;
  gridBox: Box;
  P(v: V): Pt;
  /** the original's and the copy's corners in px */
  o: Pt[]; c: Pt[];
  /** the offsets (units) of the original and the copy on the grid */
  oAt: V; cAt: V;
  labels: Partial<Record<'ow' | 'oh' | 'cw' | 'ch', Placed>>;
  area: { o?: Placed; c?: Placed };
  /** tiles (px corners), the centre each flies in from (the original's, or its row-0 twin's) and whether it is
   *  turned half a turn (a triangle's middle tiles: it turns while it flies) */
  tiles: { pts: Pt[]; at: Pt; from: Pt; row0: Pt | null; j: number; turned: boolean; num: Placed | null }[];
  groups: { cell: Pt[]; sq: Pt[]; k: number }[];
  /** the big figure that holds the tiles */
  tileIn: 'o' | 'c' | null;
  box: Box;
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
const placed = (t: string, cx: number, cy: number, size: number): Placed => {
  const [w, h] = texEst(t, size);
  return { t, cx, cy, size, box: box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) };
};
const boxIn = (b: Box, P: readonly Pt[], pad = 4): boolean =>
  [[b.x0 - pad, b.y0 - pad], [b.x1 + pad, b.y0 - pad], [b.x1 + pad, b.y1 + pad], [b.x0 - pad, b.y1 + pad]].every(([x, y]) => inside(P, x!, y!));
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const inFrame = (b: Box, fr: Frame) => b.x0 >= fr.x - 0.5 && b.x1 <= fr.x + fr.w + 0.5 && b.y0 >= fr.y - 0.5 && b.y1 <= fr.y + fr.h + 0.5;
/** a point inside the polygon to put an area label: the centroid, or the centre of the cell nearest to it */
function labelSpot(S: Shape, P: readonly V[], k: number): V {
  if (S.kind === 'cells') {
    const cx = S.cells.reduce((s, c) => s + c[0] + 0.5, 0) / S.cells.length, cy = S.cells.reduce((s, c) => s + c[1] + 0.5, 0) / S.cells.length;
    const best = [...S.cells].sort((a, b) => Math.hypot(a[0] + 0.5 - cx, a[1] + 0.5 - cy) - Math.hypot(b[0] + 0.5 - cx, b[1] + 0.5 - cy))[0]!;
    return [(best[0] + 0.5) * k, (best[1] + 0.5) * k];
  }
  const n = P.length;
  return [P.reduce((s, p) => s + p[0], 0) / n, P.reduce((s, p) => s + p[1], 0) / n];
}

export function layoutArea(pic: AreaPic, fr: Frame): AreaLayout {
  const S = pic.shape, Po = shapePts(S), Pc = stretchPts(Po, pic.kx, pic.ky);
  const eo = extentOf(Po), ec = extentOf(Pc);
  const lab = pic.labels ?? {};
  const wOf = (t?: string) => (t ? texEst(t, NUM)[0] : 0), hOf = (t?: string) => (t ? texEst(t, NUM)[1] : 0);
  const umax = pic.umax ?? 140;
  // margins in whole units for a square size u; the gap between the figures holds the labels that live there
  function plan(arr: 'side' | 'stack', u: number) {
    const left = (t?: string) => Math.max(1, Math.ceil((wOf(t) + 2 * GAP + 6) / u));
    const below = (t?: string) => Math.max(1, Math.ceil((hOf(t) + 2 * GAP + 6) / u));
    const oW = eo.x1 - eo.x0, oH = eo.y1, cW = ec.x1 - ec.x0, cH = ec.y1;
    if (pic.solo) {
      const mL = left(lab.oh), mB = below(lab.ow);
      return { cols: mL + oW + 1, rows: 1 + oH + mB, oAt: [mL - eo.x0, mB] as V, cAt: [mL - eo.x0, mB] as V };
    }
    if (arr === 'side') {
      const mL = left(lab.oh), g = left(lab.ch), mB = below(lab.ow || lab.cw);
      const cols = mL + oW + g + cW + 1, rows = 1 + Math.max(oH, cH) + mB;
      return { cols, rows, oAt: [mL - eo.x0, mB] as V, cAt: [mL + oW + g - ec.x0, mB] as V };
    }
    const mL = Math.max(left(lab.oh), left(lab.ch)), g = below(lab.ow), mB = below(lab.cw);
    const cols = mL + Math.max(oW, cW) + 1, rows = 1 + oH + g + cH + mB;
    return { cols, rows, oAt: [mL - eo.x0, mB + cH + g] as V, cAt: [mL - ec.x0, mB] as V };
  }
  function fit(arr: 'side' | 'stack') {
    let u = umax;
    for (let i = 0; i < 30; i++) {
      const p = plan(arr, u), u2 = Math.min(umax, fr.w / p.cols, fr.h / p.rows);
      if (u2 >= u - 1e-6) return { u, ...p };
      u = u2;
    }
    return { u, ...plan(arr, u) };
  }
  const cand = pic.arrange ? [fit(pic.arrange)] : [fit('stack'), fit('side')];
  const F = cand.sort((a, b) => b.u - a.u)[0]!;
  const u = Math.floor(F.u * 10) / 10, { cols, rows, oAt, cAt } = F;
  const gx = fr.x + (fr.w - cols * u) / 2, gy1 = fr.y + (fr.h + rows * u) / 2;
  const P = (v: V): Pt => [gx + v[0] * u, gy1 - v[1] * u];
  const gridBox = box(gx, gy1 - rows * u, gx + cols * u, gy1);
  const o = movePts(Po, oAt[0], oAt[1]).map(P), c = pic.solo ? o : movePts(Pc, cAt[0], cAt[1]).map(P);
  const ext = (Q: Pt[]) => ({ x0: Math.min(...Q.map(p => p[0])), x1: Math.max(...Q.map(p => p[0])), y0: Math.min(...Q.map(p => p[1])), y1: Math.max(...Q.map(p => p[1])) });
  const xo = ext(o), xc = ext(c);
  let why: string | null = null;
  const fail = (s: string) => { why ??= s; };
  if (u < MIN_U) fail(`grid squares ${u.toFixed(0)} px < ${MIN_U}`);

  // labels: the base under the bottom side, the height left of the figure
  const labels: AreaLayout['labels'] = {};
  const baseLab = (t: string, Q: Pt[], e: ReturnType<typeof ext>, sw: number) => {
    const a = Q[0]!, b: Pt = [Q[0]![0] + sw * u, Q[0]![1]];
    const p = placed(t, (a[0] + b[0]) / 2, 0, NUM);
    return placed(t, p.cx, e.y1 + GAP + (p.box.h) / 2, NUM);
  };
  const leftLab = (t: string, e: ReturnType<typeof ext>) => { const p = placed(t, 0, (e.y0 + e.y1) / 2, NUM); return placed(t, e.x0 - GAP - p.box.w / 2, p.cy, NUM); };
  const baseW = S.kind === 'cells' ? eo.x1 - eo.x0 : S.w;
  if (lab.ow) labels.ow = baseLab(lab.ow, o, xo, baseW);
  if (lab.oh) labels.oh = leftLab(lab.oh, xo);
  if (lab.cw) labels.cw = baseLab(lab.cw, c, xc, baseW * pic.kx);
  if (lab.ch) labels.ch = leftLab(lab.ch, xc);

  // areas inside
  const area: AreaLayout['area'] = {};
  const spot = (Q0: readonly V[], k: number, at: V) => { const s = labelSpot(S, Q0, k); return P([s[0] + at[0], s[1] + at[1]]); };
  if (pic.area?.o) { const s = spot(Po, 1, oAt); area.o = placed(pic.area.o, s[0], s[1], AREA); if (!boxIn(area.o.box, o)) fail(`the original's area label ${pic.area.o} does not fit inside it`); }
  if (pic.area?.c) {
    const s = S.kind === 'cells' ? spot(Po, pic.kx, cAt) : spot(Pc, 1, cAt);
    area.c = placed(pic.area.c, s[0], s[1], AREA);
    if (!boxIn(area.c.box, c)) fail(`the copy's area label ${pic.area.c} does not fit inside it`);
  }

  // tiles
  const tl: AreaLayout['tiles'] = [], gr: AreaLayout['groups'] = [];
  let tileIn: 'o' | 'c' | null = null;
  if (pic.tile === 'copies') {
    const T = tiles(S, pic.kx, pic.ky);
    if (!T) fail('the copy cannot be tiled by whole copies of the original');
    else {
      tileIn = 'c';
      const strip = S.kind === 'rect' || S.kind === 'para';
      T.forEach(t => {
        const pts = movePts(t.pts, cAt[0], cAt[1]).map(P);
        const row0 = strip && t.j > 0 ? mid(movePts(movePts(t.pts, -(S.kind === 'para' ? S.s : 0) * t.j, -S.h * t.j), cAt[0], cAt[1]).map(P)) : null;
        tl.push({ pts, at: mid(pts), from: mid(o), row0, j: t.j, turned: t.turned, num: null });
      });
    }
  } else if (pic.tile === 'reverse') {
    const m = Math.round(1 / pic.kx);
    if (pic.kx !== pic.ky || Math.abs(m * pic.kx - 1) > 1e-9) fail('reverse tiling needs k = 1/m');
    else {
      const small: Shape = S.kind === 'rect' ? { kind: 'rect', w: S.w / m, h: S.h / m } : S.kind === 'para' ? { kind: 'para', w: S.w / m, h: S.h / m, s: S.s / m } : S.kind === 'tri' ? { kind: 'tri', w: S.w / m, h: S.h / m, a: S.a / m } : S;
      const T = tiles(small, m, m);
      if (!T || S.kind === 'cells') fail('the original cannot be tiled by copies');
      else {
        tileIn = 'o';
        T.forEach(t => { const pts = movePts(t.pts, oAt[0], oAt[1]).map(P); tl.push({ pts, at: mid(pts), from: mid(c), row0: null, j: t.j, turned: t.turned, num: null }); });
      }
    }
  } else if (pic.tile === 'groups') {
    const G = groups(S, pic.kx);
    if (!G || pic.kx !== pic.ky) fail('groups need a unit-square figure and one whole k');
    else G.forEach(g => gr.push({ cell: movePts([[g.cell[0], g.cell[1]], [g.cell[0] + 1, g.cell[1]], [g.cell[0] + 1, g.cell[1] + 1], [g.cell[0], g.cell[1] + 1]], oAt[0], oAt[1]).map(P), sq: movePts(g.sq, cAt[0], cAt[1]).map(P), k: pic.kx }));
  }
  if (pic.count) tl.forEach((t, i) => {
    const pl = placed(String(i + 1), t.at[0], t.at[1], COUNT);
    if (!boxIn(pl.box, t.pts, 2)) fail(`tile number ${i + 1} does not fit in its tile`);
    t.num = pl;
  });

  // rules: labels inside the frame, off the figures, off each other
  const all = [...Object.values(labels), area.o, area.c].filter((x): x is Placed => !!x);
  for (const L of Object.values(labels)) {
    if (!L) continue;
    if (!inFrame(L.box, fr)) fail(`label ${L.t} outside the frame`);
    for (const Q of pic.solo ? [o] : [o, c]) if (boxHitsPoly(L.box, Q)) fail(`label ${L.t} sits on a figure`);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlap(all[i]!.box, all[j]!.box)) fail(`labels ${all[i]!.t} and ${all[j]!.t} overlap`);
  const bx = box(Math.min(gridBox.x0, ...all.map(a => a.box.x0)), Math.min(gridBox.y0, ...all.map(a => a.box.y0)), Math.max(gridBox.x1, ...all.map(a => a.box.x1)), Math.max(gridBox.y1, ...all.map(a => a.box.y1)));
  if (!inFrame(bx, fr)) fail('the picture leaves the frame');
  return { u, cols, rows, gridBox, P, o, c, oAt, cAt, labels, area, tiles: tl, groups: gr, tileIn, box: bx, why };
}
/** the centre (vertex mean) of a polygon: a tile and its source share it up to a move (and a half turn) */
export const mid = (Q: readonly Pt[]): Pt => [Q.reduce((s, p) => s + p[0], 0) / Q.length, Q.reduce((s, p) => s + p[1], 0) / Q.length];
/** does a label box cut into a polygon (a corner inside, or an edge crossing)? */
function boxHitsPoly(b: Box, Q: readonly Pt[]): boolean {
  const pad = 3, bb = box(b.x0 - pad, b.y0 - pad, b.x1 + pad, b.y1 + pad);
  const corners: Pt[] = [[bb.x0, bb.y0], [bb.x1, bb.y0], [bb.x1, bb.y1], [bb.x0, bb.y1]];
  if (corners.some(([x, y]) => inside(Q, x, y))) return true;
  for (let i = 0; i < Q.length; i++) {
    const a = Q[i]!, c = Q[(i + 1) % Q.length]!;
    if (Math.max(a[0], c[0]) < bb.x0 || Math.min(a[0], c[0]) > bb.x1 || Math.max(a[1], c[1]) < bb.y0 || Math.min(a[1], c[1]) > bb.y1) continue;
    // sample the segment
    for (let t = 0; t <= 1; t += 0.02) { const x = a[0] + (c[0] - a[0]) * t, y = a[1] + (c[1] - a[1]) * t; if (x > bb.x0 && x < bb.x1 && y > bb.y0 && y < bb.y1) return true; }
  }
  return false;
}
/** is the picture honest and readable in this frame? (tests + generators) */
export const fitsArea = (pic: AreaPic, fr: Frame): boolean => layoutArea(pic, fr).why === null;
