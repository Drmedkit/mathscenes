// AreaModel.ts: the distributive property made visible, in two stages of concreteness.
//
// AreaTiles  a(px + q) built from algebra tiles, to scale: a rows; each row is p x-strips (amber, an unknown length,
//            never a whole number of squares) and q unit squares (teal). The rectangle is a high and px + q long, so
//            its area is a(px + q). Split at the seam, the strip part is a·p x-strips (ap·x) and the square part is
//            a rows of q squares (a·q, NOT q: the classic 4x + 3 slip is visibly missing three rows of squares).
//            Steps: frame, row, rows, split, area, join (join slides the parts back: reading it backwards = factoring)
// AreaGrid   the generic box for any signs, fractions, decimals and monomials: the factor on the left, the terms
//            on top, each cell = factor × term. Factoring = the cells are given, the factor and the terms are '?'.
//            Steps: frame, factor, terms, cells (cells write on left to right)
//
// Colour roles, the same in picture, board and panel: x-terms amber (first), constants teal (second), x² blue (water).
// Pure compute (computeTiles / computeGrid check their own maths); the blocks lay out inside a Frame and throw
// BlockError when they cannot be read.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Ex, type Fmt, type Term, ROLE, expand, mulTerm, termTex, t } from './expr';

// ====================================================================================== tiles
export interface TilesParams {
  /** rows: the factor (1 … 9) */ a: number;
  /** x-strips per row (1 … 3) */ p: number;
  /** unit squares per row (0 … 8) */ q: number;
  /** a unit word after the side labels, e.g. ' ft' (garden bed) */ unit?: string;
  /** the letter on the strips (default x) */ letter?: string;
}
export type TileStep = 'frame' | 'row' | 'rows' | 'split' | 'area' | 'join';
export const TILE_STEPS: readonly TileStep[] = ['frame', 'row', 'rows', 'split', 'area', 'join'];
export interface TilesMaths { a: number; p: number; q: number; strips: number; squares: number; xCoef: number; constant: number }
const TN = 'AreaTiles';
/** does the tile picture exist for these numbers? (generators only make what the model can draw) */
export function tilesFit(a: number, p: number, q: number): boolean {
  return [a, p, q].every(Number.isInteger) && a >= 1 && a <= 9 && p >= 1 && p <= 3 && q >= 0 && q <= 8 && p * 3.3 + q <= 14;
}
export function computeTiles(P: Pick<TilesParams, 'a' | 'p' | 'q'>): TilesMaths {
  const { a, p, q } = P;
  check(tilesFit(a, p, q), TN, `${a}(${p}x + ${q}): the tiles draw 1–9 rows, 1–3 strips and 0–8 squares a row`);
  // count the tiles one by one (asserted, not assumed): every row is one copy of (px + q)
  let strips = 0, squares = 0;
  for (let r = 0; r < a; r++) { for (let i = 0; i < p; i++) strips++; for (let j = 0; j < q; j++) squares++; }
  check(strips === a * p && squares === a * q, TN, 'tile count does not match a·p and a·q');
  const e = expand(t(a), [t(p, 'x'), t(q)]);
  check(e[0]!.c.p === strips && e[1]!.c.p === squares, TN, 'the area does not match a(px + q) = apx + aq');
  return { a, p, q, strips, squares, xCoef: strips, constant: squares };
}
export interface TilesFocus {
  /** a ring around: the x part, the squares part, one row, or the whole */ ring?: 'x' | 'u' | 'row' | 'all' | null; ringK?: number;
  /** dim the other part (0..1) */ dim?: number;
  /** label pulses (a board symbol and its label light up together) */ pA?: number; pTop?: number;
  /** the squares counted so far (0..1 of all squares get a lime dot) */ count?: number;
}
export interface TilesBlock {
  readonly kind: 'AreaTiles';
  readonly maths: TilesMaths;
  readonly box: Box;
  readonly where: {
    xPart(k?: number): Box; uPart(k?: number): Box; all(k?: number): Box; row(r: number): Box;
    rod(r: number, i: number): Box; unit(r: number, j: number): Box;
    labelA: Box; labelX(i: number): Box; labelQ: Box; areaX: Box; areaU: Box;
  };
  /** px the squares part sits right of the strips at this progress */ shift(P: Progress<TileStep>): number;
  draw(c: Canvas, P: Progress<TileStep>, f?: TilesFocus): void;
}
const XR = 3.3, SPLIT = 90;

interface Lab { F: Formula; x: number; y: number; size: number; box: Box }
const lab = (src: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right' = 'center'): Lab => {
  const F = tex(src) as Formula;
  return { F, x, y, size, box: texBox(F, x, y, { size, align }) };
};

export function AreaTiles(P: TilesParams, fr: Frame, th: Theme): TilesBlock {
  const m = computeTiles(P);
  const { a, p, q: nq } = m;
  const u = P.unit ? `\\text{${P.unit}}` : '';
  const LAW = texWidth(tex(`${a}${u}`) as Formula, 80);
  const LEFT = Math.max(150, LAW + 80), TOP = 140, BOTTOM = 160;
  const availW = fr.w - LEFT - 30 - (nq ? SPLIT : 0), availH = fr.h - TOP - BOTTOM;
  const U = Math.floor(Math.min(112, availW / (p * XR + nq), availH / a));
  check(U >= 40, TN, `tiles of ${U} px are too small to read`);
  const X = XR * U;
  const W0 = p * X + nq * U, H0 = a * U;
  const x0 = fr.x + LEFT + (availW - W0) / 2, y0 = fr.y + TOP + (availH - H0) / 2;
  const sx = (k: number) => SPLIT * clamp(k);
  const rod = (r: number, i: number): Box => box(x0 + i * X, y0 + r * U, x0 + (i + 1) * X, y0 + (r + 1) * U);
  const unit = (r: number, j: number, k = 0): Box => { const x = x0 + p * X + sx(k) + j * U; return box(x, y0 + r * U, x + U, y0 + (r + 1) * U); };
  const xPart = (): Box => box(x0, y0, x0 + p * X, y0 + H0);
  const uPart = (k = 0): Box => box(x0 + p * X + sx(k), y0, x0 + p * X + sx(k) + nq * U, y0 + H0);
  const all = (k = 0): Box => box(x0, y0, x0 + W0 + sx(k), y0 + H0);
  const row = (r: number): Box => box(x0, y0 + r * U, x0 + W0, y0 + (r + 1) * U);
  const LA = lab(`${a}${u}`, x0 - 52, y0 + H0 / 2, 80, 'right');
  check(LA.box.x0 >= fr.x - 6, TN, 'the factor label does not fit left of the tiles');
  const V = P.letter ?? 'x';
  const LX = Array.from({ length: p }, (_, i) => lab(`${V}${u}`, x0 + (i + 0.5) * X, y0 - 70, 64));
  const LQ = lab(`${nq}${u}`, x0 + p * X + (nq * U) / 2, y0 - 70, 64);
  const AX = lab(`${m.xCoef === 1 ? '' : m.xCoef}${V}`, x0 + (p * X) / 2, y0 + H0 + 92, 80);
  const AU = lab(`${m.constant}`, x0 + p * X + SPLIT + (nq * U) / 2, y0 + H0 + 92, 80);
  check(AX.box.x1 + 20 < AU.box.x0 || nq === 0, TN, 'the two area labels collide');
  check(AU.box.x1 <= fr.x + fr.w + 40, TN, 'the squares run off the frame');

  function ringBox(c: Canvas, R: Box, col: 'first' | 'second' | 'link' | 'pick' | 'ink', k: number, pad = 10): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 12 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - pad, R.y0 - pad, R.w + 2 * pad, R.h + 2 * pad, 14); g.stroke(); g.restore();
  }
  function pulse(c: Canvas, B: Box, col: 'first' | 'second' | 'ink', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 14); g.fill(); g.restore();
    ringBox(c, B, col, k, 8);
  }
  function draw(c: Canvas, Pr: Progress<TileStep>, f: TilesFocus = {}): void {
    const kF = Pr.k('frame'), kR = Pr.k('row'), kRs = Pr.k('rows'), kS = Pr.k('split') - Pr.k('join'), kA = Pr.k('area');
    const dim = clamp(f.dim ?? 0);
    const dimX = f.ring === 'u' ? dim : 0, dimU = f.ring === 'x' ? dim : 0;
    // the bed: a soft dark base under the whole rectangle (soil), so the tiles read as one object
    withAlpha(c, E.smooth(kF), () => wash(c, rectPts(x0 - 16, y0 - 16, W0 + 32 + sx(kS), H0 + 32, 18), '#2B2547', { seed: 31, ink: DUSK.ink, inkW: 2.5, shade: 0.3, rough: 1.6 }));
    for (let r = 0; r < a; r++) {
      const k = r === 0 ? E.smooth(kR) : E.smooth(clamp((kRs * a - (r - 1)) / 1.6));
      if (k <= 0) continue;
      const dy = (1 - k) * -40;
      for (let i = 0; i < p; i++) {
        const B = rod(r, i);
        withAlpha(c, k * (1 - 0.6 * dimX), () => wash(c, rectPts(B.x0 + 3, B.y0 + 3 + dy, B.w - 6, B.h - 6, 8), 'first', { seed: 100 + r * 7 + i, ink: DUSK.ink, inkW: 2.5, shade: 0.24, rough: 1.3 }));
      }
      for (let j = 0; j < nq; j++) {
        const B = unit(r, j, kS);
        withAlpha(c, k * (1 - 0.6 * dimU), () => wash(c, rectPts(B.x0 + 3, B.y0 + 3 + dy, B.w - 6, B.h - 6, 7), 'second', { seed: 300 + r * 11 + j, ink: DUSK.ink, inkW: 2.5, shade: 0.24, rough: 1.1 }));
      }
    }
    // counting the squares: a lime dot lands on each square in reading order
    const kc = clamp(f.count ?? 0);
    if (kc > 0 && nq) {
      const n = a * nq;
      for (let s = 0; s < n; s++) {
        const kk = clamp(kc * n - s);
        if (kk <= 0) break;
        const B = unit(Math.floor(s / nq), s % nq, kS);
        c.g.save(); c.g.globalAlpha *= E.smooth(kk); c.g.fillStyle = paint(th, 'link', 'fill');
        c.g.beginPath(); c.g.arc(B.cx, B.cy, Math.max(6, U * 0.14), 0, Math.PI * 2); c.g.fill(); c.g.restore();
      }
    }
    // the side and top labels (dimensions), with ink brackets
    pulse(c, LA.box, 'ink', f.pA ?? 0);
    if (kF > 0) {
      const al = E.smooth(kF);
      texDraw(c, LA.F, LA.x, LA.y, { size: LA.size, align: 'right', col: 'ink', k: 1, alpha: al });
      const bx = x0 - 34;
      inkLine(c, [[bx + 12, y0 + 4], [bx, y0 + 4], [bx, y0 + H0 - 4], [bx + 12, y0 + H0 - 4]], { col: DUSK.cream, w: 3.5, seed: 7, alpha: al * 0.85 });
    }
    const kT = E.smooth(kR);
    if (kT > 0) {
      for (const [i, L] of LX.entries()) {
        pulse(c, L.box, 'first', f.pTop ?? 0);
        texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'center', col: 'first', k: 1, alpha: kT });
        const R = rod(0, i), y = y0 - 26;
        inkLine(c, [[R.x0 + 8, y + 10], [R.x0 + 8, y], [R.x1 - 8, y], [R.x1 - 8, y + 10]], { col: 'first', w: 3.5, seed: 20 + i, alpha: kT });
      }
      if (nq) {
        const B = uPart(kS);
        pulse(c, box(B.cx - LQ.box.w / 2, LQ.box.y0, B.cx + LQ.box.w / 2, LQ.box.y1), 'second', f.pTop ?? 0);
        texDraw(c, LQ.F, B.cx, LQ.y, { size: LQ.size, align: 'center', col: 'second', k: 1, alpha: kT });
        const y = y0 - 26;
        inkLine(c, [[B.x0 + 8, y + 10], [B.x0 + 8, y], [B.x1 - 8, y], [B.x1 - 8, y + 10]], { col: 'second', w: 3.5, seed: 29, alpha: kT });
      }
    }
    // the area of each part, under it (only once the parts are apart)
    if (kA > 0) {
      const al = E.smooth(kA), y = y0 + H0 + 30;
      const XP = xPart(), UP = uPart(kS);
      texDraw(c, AX.F, XP.cx, AX.y, { size: AX.size, align: 'center', col: 'first', k: al });
      inkLine(c, [[XP.x0 + 8, y - 10], [XP.x0 + 8, y], [XP.x1 - 8, y], [XP.x1 - 8, y - 10]], { col: 'first', w: 3.5, seed: 41, alpha: al });
      if (nq) {
        texDraw(c, AU.F, UP.cx, AU.y, { size: AU.size, align: 'center', col: 'second', k: al });
        inkLine(c, [[UP.x0 + 8, y - 10], [UP.x0 + 8, y], [UP.x1 - 8, y], [UP.x1 - 8, y - 10]], { col: 'second', w: 3.5, seed: 43, alpha: al });
      }
    }
    // rings
    const rk = clamp(f.ringK ?? 0);
    if (f.ring && rk > 0) {
      const R = f.ring === 'x' ? xPart() : f.ring === 'u' ? uPart(kS) : f.ring === 'row' ? row(0) : all(kS);
      ringBox(c, R, f.ring === 'x' ? 'first' : f.ring === 'u' ? 'second' : f.ring === 'row' ? 'pick' : 'link', rk, 14);
    }
  }
  const areaX = box(xPart().cx - AX.box.w / 2, AX.box.y0, xPart().cx + AX.box.w / 2, AX.box.y1);
  return {
    kind: 'AreaTiles', maths: m,
    box: unionBox([LA.box, all(1), ...LX.map(L => L.box), AU.box]),
    where: {
      xPart: () => xPart(), uPart: (k = 1) => uPart(k), all: (k = 0) => all(k), row, rod, unit: (r, j) => unit(r, j, 1),
      labelA: LA.box, labelX: i => LX[i]!.box, labelQ: LQ.box, areaX, areaU: AU.box,
    },
    shift: Pr => sx(Pr.k('split') - Pr.k('join')),
    draw,
  };
}

// ====================================================================================== the generic box
export interface GridParams {
  factor: Term;
  terms: Ex;
  fmt?: Fmt;
  /** what starts as '?' (the kid finds it): factoring hides the factor and the terms */
  ask?: { factor?: boolean; terms?: boolean; cells?: boolean };
  /** write cells with an explicit + (signed work) */
  signed?: boolean;
  /** the letter for x (default x) */
  letter?: string;
}
export type GridStep = 'frame' | 'factor' | 'terms' | 'cells';
export const GRID_STEPS: readonly GridStep[] = ['frame', 'factor', 'terms', 'cells'];
export interface GridMaths { factor: Term; terms: Term[]; cells: Term[] }
const GN = 'AreaGrid';
export function computeGrid(P: Pick<GridParams, 'factor' | 'terms'>): GridMaths {
  check(P.terms.length >= 1 && P.terms.length <= 3, GN, 'the box takes 1 to 3 terms');
  check(P.factor.c.p !== 0, GN, 'a zero factor has no box');
  const cells = P.terms.map(s => mulTerm(P.factor, s));
  // every cell divided by the factor gives its term back (the box reads both ways)
  for (const [i, c] of cells.entries()) check(c.c.p * P.factor.c.q * P.terms[i]!.c.q === P.factor.c.p * P.terms[i]!.c.p * c.c.q, GN, 'cell ≠ factor × term');
  return { factor: P.factor, terms: [...P.terms], cells };
}
export interface GridFocus { cell?: number | null; k?: number; dim?: number; pFactor?: number; pTerms?: number }
export interface GridBlock {
  readonly kind: 'AreaGrid';
  readonly maths: GridMaths;
  readonly box: Box;
  readonly where: { cell(i: number): Box; term(i: number): Box; factor: Box; cellText(i: number): Box; all: Box };
  draw(c: Canvas, P: Progress<GridStep>, f?: GridFocus): void;
}
const CELL_SIZE = 72, HEAD_SIZE = 72;

export function AreaGrid(P: GridParams, fr: Frame, th: Theme): GridBlock {
  const m = computeGrid(P);
  const fmt = P.fmt ?? 'frac', n = m.terms.length, V = P.letter ?? 'x', sub = (x: string) => (V === 'x' ? x : x.replace(/x/g, V));
  const cellSrc = m.cells.map((s, i) => sub((P.signed && i > 0 && s.c.p > 0 ? '+' : '') + termTex(s, fmt)));
  const termSrc = m.terms.map(s => sub(termTex(s, fmt)));
  const facSrc = sub(termTex(m.factor, fmt));
  const CF = cellSrc.map(s => tex(s) as Formula), TF = termSrc.map(s => tex(s) as Formula), FF = tex(facSrc) as Formula, QF = tex('?') as Formula;
  let size = CELL_SIZE;
  const widest = () => Math.max(...CF.map(F => texWidth(F, size)), ...TF.map(F => texWidth(F, size)));
  const HW = Math.max(150, texWidth(FF, HEAD_SIZE) + 70);
  let CW = Math.max(210, widest() + 80);
  while (HW + n * CW > fr.w - 20 && size > 60) { size -= 2; CW = Math.max(200, widest() + 70); }
  check(HW + n * CW <= fr.w, GN, `the box (${Math.round(HW + n * CW)} px) is wider than the frame`);
  const CH = 190, HH = 120;
  const W0 = HW + n * CW, x0 = fr.x + (fr.w - W0) / 2 + HW, y0 = fr.y + (fr.h - CH - HH) / 2 + HH;
  const cell = (i: number): Box => box(x0 + i * CW, y0, x0 + (i + 1) * CW, y0 + CH);
  const termBox = (i: number): Box => { const C = cell(i); return texBox(TF[i]!, C.cx, y0 - HH / 2, { size, align: 'center' }); };
  const facBox = texBox(FF, x0 - HW / 2, y0 + CH / 2, { size: HEAD_SIZE, align: 'center' });
  const all = box(x0, y0, x0 + n * CW, y0 + CH);

  function draw(c: Canvas, Pr: Progress<GridStep>, f: GridFocus = {}): void {
    const kF = E.smooth(Pr.k('frame')), kFa = Pr.k('factor'), kT = Pr.k('terms'), kC = Pr.k('cells');
    const dim = clamp(f.dim ?? 0);
    if (kF <= 0) return;
    const { g } = c;
    for (let i = 0; i < n; i++) {
      const C = cell(i), role = ROLE[m.cells[i]!.v];
      const focus = f.cell === i ? clamp(f.k ?? 1) : 0, fade = f.cell !== null && f.cell !== undefined && f.cell !== i ? dim : 0;
      withAlpha(c, kF * (1 - 0.55 * fade), () => {
        wash(c, rectPts(C.x0 + 4, C.y0 + 4, C.w - 8, C.h - 8, 12), '#1A1D3D', { seed: 70 + i, ink: null, shade: 0.12, rough: 1.0 });
        inkLine(c, rectPts(C.x0 + 6, C.y0 + 6, C.w - 12, C.h - 12, 12), { col: role, w: 3.5 + 2 * focus, closed: true, seed: 80 + i, rough: 0.7, alpha: 0.75 + 0.25 * focus });
        if (focus > 0) { g.save(); g.globalAlpha *= 0.12 * focus; g.fillStyle = paint(th, role, 'fill'); g.beginPath(); g.roundRect(C.x0 + 6, C.y0 + 6, C.w - 12, C.h - 12, 12); g.fill(); g.restore(); }
        // the cell: its product writes on (left to right), or a quiet '?' while it is asked
        const kc = clamp(kC * n * 1.15 - i * 1.0);
        if (P.ask?.cells && kc < 1) texDraw(c, QF, C.cx, C.cy, { size: 64, align: 'center', col: 'faint', alpha: 1 - kc });
        if (kc > 0) texDraw(c, CF[i]!, C.cx, C.cy, { size, align: 'center', col: role, k: kc });
      });
      // the term above its column
      const kt = clamp(kT * n * 1.15 - i * 1.0), TB = termBox(i);
      if (f.pTerms) halo(c, TB, ROLE[m.terms[i]!.v], f.pTerms);
      if (P.ask?.terms && kt < 1) texDraw(c, QF, C.cx, y0 - HH / 2, { size: 64, align: 'center', col: 'faint', alpha: kF * (1 - kt) });
      if (kt > 0) texDraw(c, TF[i]!, C.cx, y0 - HH / 2, { size, align: 'center', col: ROLE[m.terms[i]!.v], k: kt, alpha: kF });
    }
    if (f.pFactor) halo(c, facBox, 'ink', f.pFactor);
    if (P.ask?.factor && kFa < 1) texDraw(c, QF, x0 - HW / 2, y0 + CH / 2, { size: 64, align: 'center', col: 'faint', alpha: kF * (1 - kFa) });
    if (kFa > 0) texDraw(c, FF, x0 - HW / 2, y0 + CH / 2, { size: HEAD_SIZE, align: 'center', col: 'ink', k: kFa, alpha: kF });
    // the outer frame: ink, so the box reads as one rectangle
    inkLine(c, rectPts(x0, y0, n * CW, CH, 14), { col: DUSK.cream, w: 3, closed: true, seed: 90, rough: 0.6, alpha: kF * 0.55 });
  }
  function halo(c: Canvas, B: Box, col: 'first' | 'second' | 'ink' | 'water' | 'lemon', k: number): void {
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 16, B.y0 - 12, B.w + 32, B.h + 24, 14); g.fill(); g.restore();
  }
  return {
    kind: 'AreaGrid', maths: m,
    box: unionBox([all, facBox, ...m.terms.map((_, i) => termBox(i))]),
    where: { cell, term: termBox, factor: facBox, cellText: i => texBox(CF[i]!, cell(i).cx, cell(i).cy, { size, align: 'center' }), all },
    draw,
  };
}
