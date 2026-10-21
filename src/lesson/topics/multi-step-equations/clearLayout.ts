// clearLayout.ts: the layout of the "clearing" balance, pure (no DOM, no TeX), so generators only make pictures the
// block can draw and the tests can check every position.
//
// An equation with rational coefficients is drawn BY VALUE: each pan holds bags (teal, x each) and balls (amber, 1
// each), and a fraction of a bag or a ball is a piece: a bag cut into q vertical strips, a ball cut into q wedges,
// p of them there (the rest a dashed outline). Clearing by k is shown as k COPIES of each whole pan (still level),
// and the pieces then gather into whole bags and balls: the cleared whole-number equation, drawn exactly where the
// linear-equations SidesBalance (read-only import) puts its bags and marbles, so that block takes over from there
// (take bags off both pans, take balls off, split into rows, open).
//
//   phase A  one copy, full size, as given          (step "pieces")
//   phase K  k copies in a grid on each pan, scaled  (step "copy")
//   phase W  every strip / wedge in its slot of a whole item at the SidesBalance phase-A position (step "merge")
import { type Q } from '../../../core/math';
import { BAG_H, BAG_W, MR, PAN_W, SIDES_FRAME, computeSides, sidesFit, sidesLayout, type Pos, type SidesLayout, type SidesMaths } from '../linear-equations/sidesMaths';
import { type ClearPic, type Eq, cleared, isZ, lcm, sideLin } from './msMaths';

export type Kind = 'bag' | 'ball';
export type SideId = 'L' | 'R';
/** one drawn item of one copy: a whole bag / ball, or a piece of one (slots < den) */
export interface CItem { kind: Kind; side: SideId; copy: number; den: number; slots: number; A: Pos; K: Pos; seed: number }
/** one strip of a bag / wedge of a ball (a whole item when den = 1) */
export interface CSlice { item: number; kind: Kind; side: SideId; copy: number; den: number; idx: number; unit: number; slot: number; W: Pos }
export interface ClearLayout {
  sm: SidesMaths; S: SidesLayout; loose: boolean; k: number;
  /** scale of the items in the copy grid */ s: number;
  items: CItem[]; slices: CSlice[];
  /** the highest point any item reaches */ top: number;
}
const GAP_B = 10, GAP_CELL = 16, GAP_ROW = 12, PITCH = 50;

/** the whole-number balance after clearing, and whether it can split into rows (loose = it cannot) */
function sidesOf(p: ClearPic): { sm: SidesMaths; loose: boolean } {
  const { a, b, c, d } = cleared(p);
  const loose = !sidesFit(a, b, c, d, false);
  return { sm: computeSides({ a, b, c, d, loose }), loose };
}

export function clearLayout(p: ClearPic): ClearLayout {
  const { sm, loose } = sidesOf(p);
  const S = sidesLayout(sm, SIDES_FRAME);
  const k = p.k, floor = S.floor;
  const items: CItem[] = [], slices: CSlice[] = [];
  const per = (v: Q) => Math.ceil(v.p / v.q);
  // copy-grid scale: the largest that fits both pans
  const cell = (side: SideId, s: number) => {
    const v = p[side], nb = per(v.x), nm = per(v.n);
    const w = (nb * BAG_W + Math.max(0, nb - 1) * 8 + (nb && nm ? 14 : 0) + nm * 2 * MR + Math.max(0, nm - 1) * 6) * s;
    const h = (nb ? BAG_H : 2 * MR) * s;
    const cols = Math.max(1, Math.min(k, Math.floor((PAN_W - 10 + GAP_CELL) / (w + GAP_CELL))));
    const rows = Math.ceil(k / cols);
    return { w, h, cols, rows, H: rows * h + (rows - 1) * GAP_ROW, nb, nm };
  };
  const avail = floor - 8 - (SIDES_FRAME.y + 40);
  let s = 1;
  while (s > 0.4 && (['L', 'R'] as const).some(sd => cell(sd, s).H > avail)) s = Math.round((s - 0.05) * 100) / 100;
  if ((['L', 'R'] as const).some(sd => cell(sd, s).H > avail)) throw new RangeError('clearLayout: the copies do not fit the pan');

  for (const side of ['L', 'R'] as const) {
    const v = p[side], pan = side === 'L' ? S.panL : S.panR, P = side === 'L' ? S.L : S.R;
    const C = cell(side, s);
    // phase A: bags in a row on the pan, balls in a row above them (or on the pan)
    const wA = C.nb * BAG_W + Math.max(0, C.nb - 1) * GAP_B;
    const bagA = (t: number): Pos => ({ x: pan.cx - wA / 2 + BAG_W / 2 + t * (BAG_W + GAP_B), y: floor - BAG_H / 2 - 4 });
    const ballY = C.nb ? floor - BAG_H - 12 - MR : floor - MR - 6;
    const ballA = (t: number): Pos => ({ x: pan.cx - ((C.nm - 1) * PITCH) / 2 + t * PITCH, y: ballY });
    // phase K: copy j in cell (row, col), rows from the pan up, the top row centred
    const cellPos = (j: number) => {
      const row = Math.floor(j / C.cols), col = j % C.cols, inRow = Math.min(C.cols, k - row * C.cols);
      const x0 = pan.cx - (inRow * C.w + (inRow - 1) * GAP_CELL) / 2 + col * (C.w + GAP_CELL);
      const yb = floor - 6 - row * (C.h + GAP_ROW);
      return { x0, yb };
    };
    const bagK = (j: number, t: number): Pos => { const { x0, yb } = cellPos(j); return { x: x0 + (BAG_W / 2 + t * (BAG_W + 8)) * s, y: yb - (BAG_H / 2) * s }; };
    const ballK = (j: number, t: number): Pos => {
      const { x0, yb } = cellPos(j), off = C.nb ? C.nb * BAG_W + (C.nb - 1) * 8 + 14 : 0;
      return { x: x0 + (off + MR + t * (2 * MR + 6)) * s, y: yb - MR * s };
    };
    for (const kind of ['bag', 'ball'] as const) {
      const V = kind === 'bag' ? v.x : v.n, pp = V.p, qq = V.q;
      if (pp === 0) continue;
      const units = kind === 'bag' ? P.bagA : P.marA;
      for (let j = 0; j < k; j++) {
        const first = items.length, nIt = Math.ceil(pp / qq);
        for (let t = 0; t < nIt; t++) {
          items.push({ kind, side, copy: j, den: qq, slots: Math.min(qq, pp - t * qq), A: kind === 'bag' ? bagA(t) : ballA(t), K: kind === 'bag' ? bagK(j, t) : ballK(j, t), seed: (side === 'L' ? 0 : 50) + (kind === 'bag' ? 0 : 25) + t });
        }
        for (let sI = 0; sI < pp; sI++) {
          const g = j * pp + sI, unit = Math.floor(g / qq);
          const W = units[unit];
          if (!W) throw new RangeError(`clearLayout: no unit ${unit} for ${kind} on ${side}`);
          slices.push({ item: first + Math.floor(sI / qq), kind, side, copy: j, den: qq, idx: sI % qq, unit, slot: g % qq, W });
        }
      }
    }
  }
  const tops = items.flatMap(it => {
    const hA = it.kind === 'bag' ? BAG_H / 2 : MR, hK = hA * s;
    return [it.A.y - hA, it.K.y - hK];
  });
  return { sm, S, loose, k, s, items, slices, top: Math.min(...tops, S.top + 150) };
}

/** can the clearing balance draw this picture (copies fit, the cleared balance fits its frame)? */
export function picFits(p: ClearPic): boolean {
  const per = (v: Q) => Math.ceil(v.p / v.q);
  for (const s of [p.L, p.R]) if (per(s.x) > 3 || per(s.n) > 6 || per(s.x) + per(s.n) > 7) return false;
  if (p.k < 1 || p.k > 6) return false;
  const { a, b, c, d } = cleared(p);
  if (![a, b, c, d].every(Number.isInteger)) return false;
  if (a + b === 0 || c + d === 0) return false;
  if (a !== c && !((d - b) / (a - c) > 0)) return false;
  if (a === c ? !sidesFit(a, b, c, d, true) : !(sidesFit(a, b, c, d, false) || sidesFit(a, b, c, d, true))) return false;
  try { const L = clearLayout(p); return L.top >= SIDES_FRAME.y + 10; } catch { return false; }
}

/** the picture of an equation (by value), or null when the balance cannot draw it (negative parts, too many pieces) */
export function pictureOf(e: Eq, kMax = 6): ClearPic | null {
  const l = sideLin(e.L), r = sideLin(e.R);
  if ([l.m, l.k, r.m, r.k].some(c => c.p < 0)) return null;
  if ((isZ(l.m) && isZ(l.k)) || (isZ(r.m) && isZ(r.k))) return null;
  const k = [l.m, l.k, r.m, r.k].reduce((m, c) => lcm(m, c.q), 1);
  if (k > kMax) return null;
  const pic: ClearPic = { L: { x: l.m, n: l.k }, R: { x: r.m, n: r.k }, k };
  return picFits(pic) ? pic : null;
}
