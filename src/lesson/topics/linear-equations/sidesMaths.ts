// sidesMaths.ts: the maths and the layout of the two-sided pan balance for ax + b = cx + d, pure (no DOM, no TeX), so
// item generators only make balance pictures the model can draw and the tests can check every position.
//
//   left pan   a bags (x marbles each, unknown) and b loose marbles
//   right pan  c bags and d loose marbles
//
// Solving moves (each done to BOTH pans, so a level beam stays level):
//   takeX  take min(a, c) bags off both pans (subtract the x-term from both sides)
//   takeN  take min(b, d) marbles off both pans
//   split  the pan with bags left lines up in p rows (one bag a row); the other pan's marbles line up in the same p rows
//   keep   one row stays: one bag | x marbles
// The beam's tilt is the difference of the two pans; a move done to both pans never changes the difference, so an
// equation with no solution (2x + 5 = 2x + 9) tips the same way whatever is in the bags, and an identity never tips.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { check, type Frame } from '../../../blocks/block';

export const BAG_W = 80, BAG_H = 100, BAG_GAP = 10, MR = 22, MP = 50, ROW_H = 116, PAN_W = 480, PER_ROW = 9, HALF = 265;
/** the balance's frame on the 1920 x 1080 canvas (the board is x 1160 … 1860) */
export const SIDES_FRAME: Frame = { x: 40, y: 70, w: 1070, h: 940 };
export const SIDES_BOARD = box(1160, 70, 1860, 1010);
const NAME = 'SidesBalance';

/** loose: also draw an equation whose solution is not a whole 1 … 9 (to try values or take bags off; no rows) */
export interface SidesParams { a: number; b: number; c: number; d: number; x?: number; loose?: boolean }
export type Kind = 'one' | 'none' | 'all';
export interface SidesMaths {
  a: number; b: number; c: number; d: number;
  /** bags taken off both pans, marbles taken off both pans */ tx: number; tn: number;
  /** after the takes: bags and marbles left on each pan */ aL: number; bL: number; aR: number; bR: number;
  kind: Kind;
  /** the solution (one) or the bag content used for drawing (none / all: x param or 0) */ x: number;
  /** can the picture split into rows (one solution, bags on one pan, marbles on the other, whole share) */ canSplit: boolean;
  /** which pan keeps the bags after the takes ('L' | 'R'), rows p, marbles per row */ bagSide: 'L' | 'R'; p: number; per: number;
}
export function computeSides(P: SidesParams): SidesMaths {
  const { a, b, c, d } = P;
  for (const [v, n, hi] of [[a, 'a', 5], [c, 'c', 5], [b, 'b', 18], [d, 'd', 18]] as const) check(Number.isInteger(v) && v >= 0 && v <= hi, NAME, `${n} = ${v}: 0 to ${hi}`);
  check(a + b > 0 && c + d > 0, NAME, 'a pan is empty');
  const tx = Math.min(a, c), tn = Math.min(b, d);
  const aL = a - tx, aR = c - tx, bL = b - tn, bR = d - tn;
  let kind: Kind, x = P.x ?? 0, nice = false;
  if (a === c) kind = b === d ? 'all' : 'none';
  else {
    kind = 'one';
    const s = (d - b) / (a - c);
    nice = Number.isInteger(s) && s >= 1 && s <= 9;
    if (!P.loose) {
      check(nice, NAME, `one bag would hold ${s} marbles: it must be a whole number 1 to 9`);
      check(P.x === undefined || P.x === s, NAME, 'the bags do not hold the solution');
    }
    // a loose picture still needs bags that could hold the solution (a level beam with closed bags says so)
    else check(s > 0, NAME, `one bag would hold ${s} marbles: it must be more than 0`);
    x = nice ? s : (P.x ?? 0);
  }
  check(Number.isInteger(x) && x >= 0 && x <= 12, NAME, `x = ${x}: 0 to 12`);
  const bagSide: 'L' | 'R' = aL > 0 ? 'L' : 'R';
  const p = bagSide === 'L' ? aL : aR, M = bagSide === 'L' ? bR : bL, other = bagSide === 'L' ? bL : bR;
  const per = p ? M / p : 0;
  const canSplit = kind === 'one' && nice && other === 0 && p >= 1 && p <= 4 && Number.isInteger(per) && per >= 1 && per <= PER_ROW;
  return { a, b, c, d, tx, tn, aL, bL, aR, bR, kind, x, canSplit, bagSide, p, per };
}
/** the two pans' totals with v marbles in every bag (before any take) */
export const panTotals = (m: Pick<SidesMaths, 'a' | 'b' | 'c' | 'd'>, v: number): [number, number] => [m.a * v + m.b, m.c * v + m.d];
/** the beam's tilt for bags holding v (+ = the left pan down), the same before and after any both-pans move */
export function tiltAt(m: Pick<SidesMaths, 'a' | 'b' | 'c' | 'd'>, v: number): number { const [l, r] = panTotals(m, v); return clamp((l - r) / 8, -1, 1); }

export interface Pos { x: number; y: number }
/** A = as given, B = after the bags came off (the rest re-centred, marbles drop when no bag is left), C = split rows */
export interface PanLayout { bagA: Pos[]; bagB: Pos[]; bagC: Pos[]; marA: Pos[]; marB: Pos[]; marC: Pos[]; takenBags: number[]; takenMar: number[] }
export interface SidesLayout {
  cx: number; table: number; pivot: number; floor: number; labelY: number; half: number;
  panL: Box; panR: Box; L: PanLayout; R: PanLayout;
  rowY(i: number): number;
  /** the value strip on the table (x = 0 … 8 and whether the beam is level there) */ strip: Box; stripX(v: number): number; stripY: number;
  top: number;
}
export const STRIP_FROM = 0, STRIP_TO = 8;

export function sidesLayout(m: SidesMaths, fr: Frame): SidesLayout {
  const cx = fr.x + fr.w / 2, table = fr.y + fr.h - 160, pivot = table - 78, floor = pivot - 74, labelY = pivot + 50, half = HALF;
  const panL = box(cx - half - PAN_W / 2, floor - 4, cx - half + PAN_W / 2, floor + 26);
  const panR = box(cx + half - PAN_W / 2, floor - 4, cx + half + PAN_W / 2, floor + 26);
  const rowY = (i: number) => floor - 8 - ROW_H * (i + 0.5);
  const rowOf = (n: number, i: number, cx0: number, y0: number): Pos => {
    const row = Math.floor(i / PER_ROW), col = i % PER_ROW, inRow = Math.min(PER_ROW, n - row * PER_ROW);
    return { x: cx0 - ((inRow - 1) * MP) / 2 + col * MP, y: y0 - row * MP };
  };
  function pan(P: Box, bags: number, mar: number, side: 'L' | 'R'): PanLayout {
    const w = bags * BAG_W + Math.max(0, bags - 1) * BAG_GAP;
    const bagA: Pos[] = Array.from({ length: bags }, (_, i) => ({ x: P.cx - w / 2 + BAG_W / 2 + i * (BAG_W + BAG_GAP), y: floor - BAG_H / 2 - 4 }));
    const marA: Pos[] = Array.from({ length: mar }, (_, k) => rowOf(mar, k, P.cx, bags ? floor - BAG_H - 12 - MR : floor - MR - 6));
    // taken: the outer bags (left pan: leftmost, right pan: rightmost), the last marbles
    const takenBags = side === 'L' ? Array.from({ length: m.tx }, (_, i) => i) : Array.from({ length: m.tx }, (_, i) => bags - m.tx + i);
    const takenMar = Array.from({ length: m.tn }, (_, i) => mar - m.tn + i);
    const left = bags - m.tx, wB = left * BAG_W + Math.max(0, left - 1) * BAG_GAP;
    let r0 = 0;
    const bagB: Pos[] = bagA.map((p, i) => (takenBags.includes(i) ? { ...p } : { x: P.cx - wB / 2 + BAG_W / 2 + (r0++) * (BAG_W + BAG_GAP), y: p.y }));
    const marB: Pos[] = Array.from({ length: mar }, (_, k) => rowOf(mar, k, P.cx, left ? floor - BAG_H - 12 - MR : floor - MR - 6));
    const bagC = bagB.map(p => ({ ...p })), marC = marB.map(p => ({ ...p }));
    if (m.canSplit) {
      if (m.bagSide === side) { let r = 0; bagA.forEach((_, i) => { if (!takenBags.includes(i)) { bagC[i] = { x: P.cx, y: rowY(r) }; r++; } }); }
      else { let j = 0; marA.forEach((_, k) => { if (!takenMar.includes(k)) { const row = Math.floor(j / m.per), col = j % m.per; marC[k] = { x: P.cx - ((m.per - 1) * MP) / 2 + col * MP, y: rowY(row) }; j++; } }); }
    }
    return { bagA, bagB, bagC, marA, marB, marC, takenBags, takenMar };
  }
  const L = pan(panL, m.a, m.b, 'L'), R = pan(panR, m.c, m.d, 'R');
  const ys = [L, R].flatMap(p => [...p.bagA.map(b => b.y - BAG_H / 2), ...p.bagC.map(b => b.y - BAG_H / 2), ...p.marA.map(q => q.y - MR), ...p.marB.map(q => q.y - MR), ...p.marC.map(q => q.y - MR)]);
  const top = Math.min(...ys) - 150;
  const strip = box(fr.x + 70, table + 26, fr.x + fr.w - 70, fr.y + fr.h - 4);
  const sx0 = strip.x0 + 150, sx1 = strip.x1 - 50;
  const stripX = (v: number) => sx0 + ((v - STRIP_FROM) / (STRIP_TO - STRIP_FROM)) * (sx1 - sx0);
  return { cx, table, pivot, floor, labelY, half, panL, panR, L, R, rowY, strip, stripX, stripY: strip.y0 + 40, top };
}
export const marbleBox = (P: readonly Pos[]): Box => unionBox(P.map(p => box(p.x - MR, p.y - MR, p.x + MR, p.y + MR)));
export const bagBox = (P: readonly Pos[]): Box => unionBox(P.map(p => box(p.x - BAG_W / 2, p.y - BAG_H / 2, p.x + BAG_W / 2, p.y + BAG_H / 2)));

/** can the balance draw this equation inside its frame? (and solve it by rows when it has one solution) */
export function sidesFit(a: number, b: number, c: number, d: number, loose = false): boolean {
  try {
    const m = computeSides({ a, b, c, d, loose });
    const L = sidesLayout(m, SIDES_FRAME);
    if (L.top < 70) return false;
    if (!loose && m.kind === 'one' && !m.canSplit) return false;
    return true;
  } catch { return false; }
}
