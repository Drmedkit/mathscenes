// IsoBox: a box of unit cubes in isometric view, the model of "the cube root is the edge of a cube with that volume"
// (and, as a one-layer slab, of "the square root is the side of a flat square of that many cubes").
//   box     a closed cardboard box (the container; nothing inside is visible yet)
//   open    the cardboard fades to a dashed wireframe: the space to fill
//   layers  amber unit cubes fill the box from the bottom, one layer after another (grid lines = the unit cubes)
//   vol     the volume label above (amber: the amount, the radicand)
//   edge    a bracket along one bottom edge and its label (lime: the edge, the root)
//   count   the cubes along that edge light up one by one (lime)
//   ghosts  for a volume that is not a perfect cube: the k-cube and the (k+1)-cube as dashed outlines from the same
//           front corner, and a ruler along the other bottom edge with k and k + 1, so k < cbrt(V) < k + 1 is visible
// The edge label sits on the side nearest the board (right) unless asked otherwise, so leaders reach it without
// crossing the picture. Pure maths in computeBox(); the layout throws BlockError when something cannot be read.
import { type Box, box, clamp, type Pt, unionBox, lerp } from '../../../core/math';
import { type Canvas, withAlpha, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import type { Paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface BoxParams {
  /** size in units along the right edge, the left edge and up; whole numbers draw unit cubes */
  nx: number; ny: number; nz: number;
  /** labels (TeX); null = none */
  volTex?: string | null; edgeTex?: string | null;
  /** which bottom edge carries the edge label */
  edgeSide?: 'right' | 'left';
  /** the edge's colour role: lime = the root asked for, teal = a side that only compares */
  edgeCol?: 'link' | 'second';
  /** draw the k- and (k+1)-cube outlines and the ruler (a cube whose edge is not whole) */
  ghosts?: boolean;
  /** fixed placement (shared scale for two boxes side by side); otherwise the box fits the frame */
  place?: { u: number; x: number; y: number };
}
export type BoxStep = 'box' | 'open' | 'layers' | 'vol' | 'edge' | 'count' | 'ghosts';
export const BOX_STEPS: readonly BoxStep[] = ['box', 'open', 'layers', 'vol', 'edge', 'count', 'ghosts'];

export interface BoxMaths {
  nx: number; ny: number; nz: number;
  /** the volume in unit cubes */ vol: number;
  /** whole edges (unit cubes can be drawn) */ whole: boolean;
  /** a cube (all edges equal) */ cube: boolean;
  /** for ghosts: the whole numbers around the edge */ lo: number; hi: number;
}
const NAME = 'IsoBox';
const C30 = Math.cos(Math.PI / 6), S30 = 0.5;

export function computeBox(p: Pick<BoxParams, 'nx' | 'ny' | 'nz' | 'ghosts'>): BoxMaths {
  const { nx, ny, nz } = p;
  check([nx, ny, nz].every(v => Number.isFinite(v) && v > 0), NAME, 'every edge must be more than 0');
  check(Math.max(nx, ny, nz) <= 12, NAME, 'the model draws edges up to 12 units');
  const whole = [nx, ny, nz].every(Number.isInteger);
  // count the unit cubes one by one when the edges are whole (asserted, not assumed)
  let vol = nx * ny * nz;
  if (whole) { let n = 0; for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) for (let c = 0; c < nz; c++) n++; check(n === nx * ny * nz, NAME, 'cube count'); vol = n; }
  const cube = Math.abs(nx - ny) < 1e-9 && Math.abs(ny - nz) < 1e-9;
  const lo = Math.floor(nx + 1e-9), hi = lo + 1;
  if (p.ghosts) {
    check(cube && !Number.isInteger(nx) && lo >= 1, NAME, 'ghosts need a cube whose edge is not a whole number');
    check(lo ** 3 < vol && vol < hi ** 3, NAME, `${lo}³ < V < ${hi}³ does not hold`);
  }
  return { nx, ny, nz, vol, whole, cube, lo, hi };
}

export interface BoxFocus {
  /** pulse 0..1 of the labels */ vol?: number; edge?: number;
  /** a glowing ring around the edge label */ ringEdge?: number;
}
export interface BoxBlock {
  readonly kind: 'IsoBox';
  readonly maths: BoxMaths;
  readonly steps: readonly BoxStep[];
  readonly box: Box;
  readonly u: number;
  readonly where: {
    /** the whole drawn box (full height) */ body: Box;
    /** y of the table edge behind the box (the middle of its base), so it stands ON the table */ floor: number;
    /** the edge label, the bracket, the volume label */ edgeLabel: Box; edgeBar: Box; volLabel: Box;
    /** ruler labels of the ghosts (k, k + 1) */ rulerLo: Box; rulerHi: Box;
    /** a point of the iso grid: a along the right edge, b along the left edge, c up */ at(a: number, b: number, c: number): Pt;
  };
  draw(c: Canvas, p: Progress<BoxStep>, f?: BoxFocus): void;
}

const LABEL = 60, MAXU = 110;

export function IsoBox(p: BoxParams, fr: Frame): BoxBlock {
  const m = computeBox(p);
  const span = p.ghosts ? m.hi : Math.max(m.nx, m.ny, m.nz);
  const nx = p.ghosts ? m.hi : m.nx, ny = p.ghosts ? m.hi : m.ny, nz = p.ghosts ? m.hi : m.nz;
  let u: number, P0x: number, P0y: number;
  const TOPPAD = p.volTex === null ? 30 : 120, BOTPAD = 150;
  if (p.place) ({ u, x: P0x, y: P0y } = p.place);
  else {
    const availW = fr.w - 120, availH = fr.h - TOPPAD - BOTPAD;
    u = Math.min(MAXU, availW / ((nx + ny) * C30), availH / ((nx + ny) * S30 + nz));
    const w = (nx + ny) * C30 * u, h = ((nx + ny) * S30 + nz) * u;
    // the front corner: centred under the box, the box sits on the bottom of its band
    P0x = fr.x + (fr.w - w) / 2 + ny * C30 * u;
    P0y = fr.y + TOPPAD + (availH + h) / 2;
  }
  void span;
  check(u >= 26, NAME, `unit cubes of ${Math.round(u)} px are too small to read`);
  if (p.ghosts) check(u >= 50, NAME, `ruler marks ${Math.round(u)} px apart are too close for labels`);
  const at = (a: number, b: number, c: number): Pt => [P0x + (a - b) * C30 * u, P0y - (a + b) * S30 * u - c * u];
  const E1 = m.nx, E2 = m.ny, E3 = m.nz;   // the real box
  const body = box(at(0, ny, 0)[0], at(nx, ny, nz)[1], at(nx, 0, 0)[0], P0y);
  // labels
  const side = p.edgeSide ?? 'right';
  const ecol = p.edgeCol ?? 'link', ehex = ecol === 'link' ? '#B4EA6A' : '#3CC6C2';
  const edgeA: Pt = at(0, 0, 0), edgeB: Pt = side === 'right' ? at(E1, 0, 0) : at(0, E2, 0);
  const nrm: Pt = side === 'right' ? [S30, C30] : [-S30, C30];
  const mid: Pt = [(edgeA[0] + edgeB[0]) / 2, (edgeA[1] + edgeB[1]) / 2];
  const off = (P: Pt, d: number): Pt => [P[0] + nrm[0] * d, P[1] + nrm[1] * d];
  const barA = off(edgeA, 26), barB = off(edgeB, 26);
  const edgeF = p.edgeTex ? (tex(p.edgeTex) as Formula) : null;
  const lc = off(mid, 92);
  const edgeLabel = edgeF ? texBox(edgeF, lc[0], lc[1], { size: LABEL, align: 'center' }) : box(lc[0], lc[1], lc[0], lc[1]);
  const edgeBar = unionBox([box(barA[0], barA[1], barA[0], barA[1]), box(barB[0], barB[1], barB[0], barB[1])]);
  const volF = p.volTex ? (tex(p.volTex) as Formula) : null;
  const top = at(nx, ny, nz)[1];
  const vy = Math.min(top, at(0, 0, nz)[1]) - 62;
  const vx = at(nx / 2, ny / 2, nz)[0];
  const volLabel = volF ? texBox(volF, vx, vy, { size: LABEL, align: 'center' }) : box(vx, vy, vx, vy);
  if (volF) check(volLabel.y0 >= fr.y - 6, NAME, 'the volume label does not fit above the box');
  if (edgeF) check(edgeLabel.y1 <= fr.y + fr.h + 70, NAME, 'the edge label does not fit under the box');
  // ghost ruler along the other bottom edge
  // the ruler runs along the right edge (left to right: k, k + 1) unless the edge label is there
  const rSide = p.edgeTex && side === 'right' ? 'left' : 'right';
  const rN: Pt = rSide === 'right' ? [S30, C30] : [-S30, C30];
  const rAt = (t: number): Pt => (rSide === 'right' ? at(t, 0, 0) : at(0, t, 0));
  const rLab = (t: number): { F: Formula; x: number; y: number; b: Box } => {
    const P = rAt(t), F = tex(String(t)) as Formula, x = P[0] + rN[0] * 70, y = P[1] + rN[1] * 70;
    return { F, x, y, b: texBox(F, x, y, { size: LABEL, align: 'center' }) };
  };
  const RL = p.ghosts ? rLab(m.lo) : null, RH = p.ghosts ? rLab(m.hi) : null;
  if (RL && RH) check(RL.b.x1 < RH.b.x0 - 6 || RL.b.x0 > RH.b.x1 + 6, NAME, 'ruler labels overlap');

  const faceR = (a: number, b: number, h: number): Pt[] => [at(0, 0, 0), at(a, 0, 0), at(a, 0, h), at(0, 0, h)];
  const faceL = (a: number, b: number, h: number): Pt[] => [at(0, 0, 0), at(0, b, 0), at(0, b, h), at(0, 0, h)];
  const faceT = (a: number, b: number, h: number): Pt[] => [at(0, 0, h), at(a, 0, h), at(a, b, h), at(0, b, h)];
  const seg = (c: Canvas, A: Pt, B: Pt, col: Paint, w: number, alpha: number, dash?: number[]) => strokePts(c, [A, B], { col, lw: w, alpha, dash: dash ?? null, cap: 'round' });
  /** a cube outline from the front corner: visible edges solid-dashed, hidden edges fainter */
  function outline(c: Canvas, a: number, b: number, h: number, col: Paint, alpha: number, dash: number[] | undefined, hidden = 0.45): void {
    if (alpha <= 0) return;
    const V = (x: number, y: number, z: number) => at(x * a, y * b, z * h);
    const vis: [Pt, Pt][] = [[V(0, 0, 0), V(1, 0, 0)], [V(0, 0, 0), V(0, 1, 0)], [V(0, 0, 0), V(0, 0, 1)], [V(1, 0, 0), V(1, 0, 1)], [V(0, 1, 0), V(0, 1, 1)],
      [V(0, 0, 1), V(1, 0, 1)], [V(0, 0, 1), V(0, 1, 1)], [V(1, 0, 1), V(1, 1, 1)], [V(0, 1, 1), V(1, 1, 1)]];
    const hid: [Pt, Pt][] = [[V(1, 1, 0), V(1, 0, 0)], [V(1, 1, 0), V(0, 1, 0)], [V(1, 1, 0), V(1, 1, 1)]];
    for (const [A, B] of vis) seg(c, A, B, col, 3, alpha, dash);
    for (const [A, B] of hid) seg(c, A, B, col, 2.5, alpha * hidden, [8, 10]);
  }
  function solid(c: Canvas, a: number, b: number, h: number, col: Paint, alpha: number, seed: number, grid: boolean, gridK = 1): void {
    if (alpha <= 0 || h <= 0.001) return;
    withAlpha(c, alpha, () => {
      wash(c, faceL(a, b, h), col, { seed, ink: null, rough: 1.2, shade: 0.25 });
      wash(c, faceR(a, b, h), col, { seed: seed + 1, ink: null, rough: 1.2, shade: 0.4 });
      c.g.save(); c.g.fillStyle = 'rgba(20,14,40,0.22)'; c.g.beginPath(); const R = faceR(a, b, h); c.g.moveTo(R[0]![0], R[0]![1]); for (const q of R) c.g.lineTo(q[0], q[1]); c.g.closePath(); c.g.fill(); c.g.restore();
      wash(c, faceT(a, b, h), col, { seed: seed + 2, ink: null, rough: 1.2, lift: 0.3, shade: 0.1 });
      if (grid && gridK > 0) {
        const ga = 0.75 * gridK, gw = u >= 50 ? 3 : 2.2;
        for (let i = 1; i < a; i++) { seg(c, at(i, 0, 0), at(i, 0, h), DUSK.cream, gw, ga); seg(c, at(i, 0, h), at(i, b, h), DUSK.cream, gw, ga); }
        for (let j = 1; j < b; j++) { seg(c, at(0, j, 0), at(0, j, h), DUSK.cream, gw, ga); seg(c, at(0, j, h), at(a, j, h), DUSK.cream, gw, ga); }
        for (let z = 1; z < h - 1e-6; z++) { seg(c, at(0, 0, z), at(a, 0, z), DUSK.cream, gw, ga); seg(c, at(0, 0, z), at(0, b, z), DUSK.cream, gw, ga); }
      }
      // one ink line round the silhouette and the front edges
      const H = h;
      inkLine(c, [at(0, 0, 0), at(a, 0, 0), at(a, 0, H), at(a, b, H), at(0, b, H), at(0, b, 0)], { col: DUSK.ink, w: 3, seed: seed + 5, closed: true, rough: 0.8 });
      inkLine(c, [at(a, 0, H), at(0, 0, H), at(0, b, H)], { col: DUSK.ink, w: 2.5, seed: seed + 6, rough: 0.6 });
      inkLine(c, [at(0, 0, H), at(0, 0, 0)], { col: DUSK.ink, w: 2.5, seed: seed + 7, rough: 0.6 });
    });
  }
  function pulse(c: Canvas, B: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = typeof col === 'string' && col.startsWith('#') ? col : col === 'first' ? '#FFB547' : '#B4EA6A';
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 14); g.fill(); g.restore();
  }

  function draw(c: Canvas, P: Progress<BoxStep>, f: BoxFocus = {}): void {
    const kB = P.k('box'), kO = P.k('open'), kL = P.k('layers'), kV = P.k('vol'), kE = P.k('edge'), kC = P.k('count'), kG = P.k('ghosts');
    // the closed box (cardboard), fading as it opens
    if (kB > 0) withAlpha(c, E.smooth(kB) * (1 - E.smooth(kO)), () => solid(c, E1, E2, E3, DUSK.woodLight, 1, 11, false));
    // the wireframe of the space to fill
    if (kO > 0) outline(c, E1, E2, E3, DUSK.cream, 0.55 * E.smooth(kO) * (1 - 0.6 * kG), [12, 10]);
    // the unit cubes, layer by layer
    if (kL > 0) {
      const h = E3 * clamp(kL);
      solid(c, E1, E2, h, 'first', 1, 21, m.whole, 1);
    }
    // ghosts: k-cube inside (dashed, seen through), (k+1)-cube outside
    if (kG > 0 && p.ghosts) {
      const g = E.smooth(kG);
      outline(c, m.lo, m.lo, m.lo, DUSK.cream, 0.9 * g, [10, 9], 0.7);
      outline(c, m.hi, m.hi, m.hi, DUSK.cream, 0.75 * g, [10, 9], 0.6);
      // the ruler
      const A = rAt(0), B = rAt(m.hi);
      const o = (Q: Pt, d: number): Pt => [Q[0] + rN[0] * d, Q[1] + rN[1] * d];
      strokePts(c, [o(A, 24), o(B, 24)], { col: 'ink', lw: 3, alpha: g });
      for (const t of [m.lo, m.hi]) strokePts(c, [o(rAt(t), 12), o(rAt(t), 36)], { col: 'ink', lw: 3.5, alpha: g });
      const e = m.nx;
      strokePts(c, [o(rAt(e), 8), o(rAt(e), 40)], { col: 'link', lw: 6, alpha: g });
      for (const L of [RL!, RH!]) texDraw(c, L.F, L.x, L.y, { size: LABEL, align: 'center', col: 'ink', alpha: g });
    }
    // the edge: cubes counted, bracket, label
    if (kC > 0 && m.whole) {
      const n = side === 'right' ? m.nx : m.ny;
      for (let i = 0; i < n; i++) {
        const ki = E.smooth(clamp(kC * n - i));
        if (ki <= 0) continue;
        const Q = side === 'right' ? [at(i, 0, 0), at(i + 1, 0, 0), at(i + 1, 0, 1), at(i, 0, 1)] : [at(0, i, 0), at(0, i + 1, 0), at(0, i + 1, 1), at(0, i, 1)];
        const inset = (q: Pt): Pt => { const cx = (Q[0]![0] + Q[2]![0]) / 2, cy = (Q[0]![1] + Q[2]![1]) / 2; return [lerp(q[0], cx, 0.14), lerp(q[1], cy, 0.14)]; };
        withAlpha(c, ki, () => wash(c, Q.map(inset), ecol, { seed: 600 + i, ink: null, rough: 1, shade: 0.15 }));
      }
    }
    if (kE > 0) {
      const k = E.inOut(kE);
      const A = off(edgeA, 12), B = off(edgeB, 12);
      inkLine(c, [A, barA, [lerp(barA[0], barB[0], k), lerp(barA[1], barB[1], k)]], { col: ecol, w: 4, seed: 701 });
      if (k > 0.98) inkLine(c, [barB, B], { col: ecol, w: 4, seed: 702 });
      pulse(c, edgeLabel, ehex, f.edge ?? 0);
      if (edgeF) texDraw(c, edgeF, lc[0], lc[1], { size: LABEL, align: 'center', col: ecol, alpha: E.smooth(kE) });
      const rk = clamp(f.ringEdge ?? 0);
      if (rk > 0) { const { g } = c; g.save(); g.globalAlpha *= rk; g.strokeStyle = ehex; g.lineWidth = 5; g.beginPath(); g.roundRect(edgeLabel.x0 - 16, edgeLabel.y0 - 12, edgeLabel.w + 32, edgeLabel.h + 24, 14); g.stroke(); g.restore(); }
    }
    if (kV > 0 && volF) {
      pulse(c, volLabel, 'first', f.vol ?? 0);
      texDraw(c, volF, vx, vy, { size: LABEL, align: 'center', col: 'first', alpha: E.smooth(kV) });
    }
  }

  const all = [body, edgeLabel, volLabel, ...(RL ? [RL.b, RH!.b] : [])];
  return {
    kind: 'IsoBox', maths: m, steps: BOX_STEPS, box: unionBox(all), u,
    where: { body, floor: (at(nx, ny, 0)[1] + P0y) / 2, edgeLabel, edgeBar, volLabel, rulerLo: RL?.b ?? body, rulerHi: RH?.b ?? body, at },
    draw,
  };
}
