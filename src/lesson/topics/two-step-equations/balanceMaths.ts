// balanceMaths.ts: the maths and the layout of the pan balance for two-step equations, pure (no DOM, no TeX), so item
// generators only make balance pictures the model can draw and the tests can check every position.
//
//   px + q = r      p bags of x marbles and q loose marbles on the left pan, r marbles on the right
//   p(x + q) = r    p groups, each one bag and q marbles, on the left pan, r marbles on the right
//
// The two phases of the layout:
//   A  the equation as given: bags in a row with the loose marbles above (or one group per row), the right pan's
//      marbles in rows of 9 from the pan up
//   C  "split into p equal shares": one row per share across both pans (row i: one bag | x marbles, or
//      bag + q | x + q), so every bag lines up with what it balances
import { type Box, box, unionBox } from '../../../core/math';
import { check, type Frame } from '../../../blocks/block';

export const BAG_W = 96, BAG_H = 112, BAG_GAP = 18, MR = 24, MP = 54, ROW_H = 132, PAN_W = 500, PER_ROW = 9;
/** the balance's frame on the 1920 x 1080 lesson canvas: wider than the default model frame (leaders still fit) */
export const BALANCE_FRAME: Frame = { x: 50, y: 70, w: 1110, h: 940 };
const NAME = 'Balance';

export interface BalanceParams {
  /** bags (the x's), 1 … 4 */ p: number;
  /** loose marbles (px + q) or marbles in each group (p(x + q)) */ q: number;
  /** marbles on the right pan */ r: number;
  /** p(x + q) = r instead of px + q = r */ grouped?: boolean;
  /** what one bag really holds; leave it out and it is solved from the equation (then the pans balance) */ x?: number;
}
export interface BalanceMaths {
  p: number; q: number; r: number; grouped: boolean;
  /** marbles in one bag */ x: number;
  /** the left pan's total, with x in each bag */ lhs: number;
  level: boolean;
  /** right-pan marbles per row once split into p shares (x, or x + q grouped) */ per: number;
  /** left marbles (ids) that "take q off both sides" removes: the loose ones, or the kept group's q */ takeL: number[];
  /** right marbles (ids) it removes */ takeR: number[];
  /** left marble count (q, or p·q grouped) */ nL: number;
}

export function computeBalance(P: BalanceParams): BalanceMaths {
  const { p, q, r } = P, grouped = !!P.grouped;
  check(Number.isInteger(p) && p >= 1 && p <= 4, NAME, `p = ${p}: 1 to 4 bags`);
  check(Number.isInteger(q) && q >= 0 && q <= (grouped ? 6 : 18), NAME, `q = ${q}: 0 to ${grouped ? 6 : 18} marbles`);
  check(Number.isInteger(r) && r >= 1 && r <= 54, NAME, `r = ${r}: 1 to 54 marbles on the right`);
  const solved = grouped ? r / p - q : (r - q) / p;
  const x = P.x ?? solved;
  check(Number.isInteger(x) && x >= 1 && x <= 9, NAME, `one bag would hold ${x} marbles: it must be a whole number 1 to 9`);
  const lhs = grouped ? p * (x + q) : p * x + q;
  const level = lhs === r;
  if (P.x === undefined) check(level, NAME, 'the pans do not balance');
  const per = grouped ? x + q : x;
  if (level) check(per <= PER_ROW, NAME, `a share of ${per} marbles does not fit one row (9 at most)`);
  const nL = grouped ? p * q : q;
  const takeL = Array.from({ length: q }, (_, k) => k);
  const takeR = level ? (grouped ? Array.from({ length: q }, (_, k) => x + k) : Array.from({ length: q }, (_, k) => r - q + k)) : [];
  return { p, q, r, grouped, x, lhs, level, per, takeL, takeR, nL };
}

/** a world position (centre) */
export interface Pos { x: number; y: number }
export interface BalanceLayout {
  cx: number; table: number; pivot: number; floor: number; labelY: number; half: number;
  panL: Box; panR: Box;
  /** centres of the bags, the left marbles and the right marbles in phase A and phase C */
  bagA: Pos[]; bagC: Pos[]; leftA: Pos[]; leftC: Pos[]; rightA: Pos[]; rightC: Pos[];
  /** centre y of share row i (phase C) */ rowY(i: number): number;
  /** the highest point any content reaches (incl. a lifted marble) */ top: number;
}

export function balanceLayout(m: BalanceMaths, fr: Frame): BalanceLayout {
  const cx = fr.x + fr.w / 2, table = fr.y + fr.h - 90, pivot = table - 78, floor = pivot - 74, labelY = pivot + 50, half = 280;
  const panL = box(cx - half - PAN_W / 2, floor - 4, cx - half + PAN_W / 2, floor + 26);
  const panR = box(cx + half - PAN_W / 2, floor - 4, cx + half + PAN_W / 2, floor + 26);
  const rowY = (i: number) => floor - 8 - ROW_H * (i + 0.5);
  const rowOf = (n: number, i: number, cx0: number, y0: number, pitch: number): Pos => {
    const row = Math.floor(i / PER_ROW), col = i % PER_ROW, inRow = Math.min(PER_ROW, n - row * PER_ROW);
    return { x: cx0 - ((inRow - 1) * pitch) / 2 + col * pitch, y: y0 - row * pitch };
  };
  const bagA: Pos[] = [], bagC: Pos[] = [], leftA: Pos[] = [], leftC: Pos[] = [];
  if (!m.grouped) {
    const w = m.p * BAG_W + (m.p - 1) * BAG_GAP;
    for (let i = 0; i < m.p; i++) {
      bagA.push({ x: panL.cx - w / 2 + BAG_W / 2 + i * (BAG_W + BAG_GAP), y: floor - BAG_H / 2 - 4 });
      bagC.push({ x: panL.cx, y: rowY(i) });
    }
    for (let k = 0; k < m.q; k++) {
      const P = rowOf(m.q, k, panL.cx, floor - BAG_H - 14 - MR, MP);
      leftA.push(P); leftC.push(P);   // the loose marbles are taken off before the split
    }
  } else {
    const w = BAG_W + 16 + m.q * MP - (MP - 2 * MR);
    for (let g = 0; g < m.p; g++) {
      const x0 = panL.cx - w / 2, y = rowY(g);
      const bag = { x: x0 + BAG_W / 2, y };
      bagA.push(bag); bagC.push(bag);
      for (let k = 0; k < m.q; k++) { const P = { x: x0 + BAG_W + 16 + MR + k * MP, y }; leftA.push(P); leftC.push(P); }
    }
  }
  const rightA: Pos[] = [], rightC: Pos[] = [];
  const kept = m.grouped ? m.r : m.r - m.q;
  for (let j = 0; j < m.r; j++) {
    const A = rowOf(m.r, j, panR.cx, floor - MR - 6, MP);
    rightA.push(A);
    if (m.level && j < kept) {
      const row = Math.floor(j / m.per), col = j % m.per;
      rightC.push({ x: panR.cx - ((m.per - 1) * MP) / 2 + col * MP, y: rowY(row) });
    } else rightC.push(A);
  }
  const ys = [...bagA.map(b => b.y - BAG_H / 2), ...bagC.map(b => b.y - BAG_H / 2), ...leftA.map(p => p.y - MR), ...rightA.map(p => p.y - MR), ...rightC.map(p => p.y - MR)];
  const top = Math.min(...ys) - 150;
  return { cx, table, pivot, floor, labelY, half, panL, panR, bagA, bagC, leftA, leftC, rightA, rightC, rowY, top };
}

/** the boxes a marble set or a bag set covers (for rings and leaders) */
export const marbleBox = (P: readonly Pos[]): Box => unionBox(P.map(p => box(p.x - MR, p.y - MR, p.x + MR, p.y + MR)));
export const bagBox = (P: readonly Pos[]): Box => unionBox(P.map(p => box(p.x - BAG_W / 2, p.y - BAG_H / 2, p.x + BAG_W / 2, p.y + BAG_H / 2)));

/** can the balance draw this equation inside its frame? */
export function balanceFits(p: number, q: number, r: number, grouped = false): boolean {
  try {
    const m = computeBalance({ p, q, r, grouped });
    const L = balanceLayout(m, BALANCE_FRAME);
    return L.top >= 70 && m.p * ROW_H <= 470;
  } catch { return false; }
}
