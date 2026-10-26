// pic.ts: the practice and lesson pictures of "Piecewise and step functions" as plain, serialisable data (items.ts
// makes them, graph.ts turns them into the shared kit's Plane, the page draws them). A graph picture names its parts;
// `parts` are drawn with the question, `reveal` comes in on the worked solution after a miss (hidden from the oracle,
// so no answer is on screen or in the student's view before they answer). Pure: no DOM.
import type { Paint } from '../../../core/theme';
import { type Axis, type Fn, type Piece, axisOver, breaks, clean, covers, ev, fAt, piecesRange } from './pw';

export type End = 'open' | 'closed' | 'none';
export type GPart =
  | { kind: 'piece'; key: string; fn: Fn; lo?: number; hi?: number; ends?: [End, End]; col?: Paint; dash?: boolean; /** arrow heads where a ray leaves the window */ arrow?: boolean; w?: number }
  | { kind: 'point'; key: string; x: number; y: number; open?: boolean; name?: string; col?: Paint }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: Paint; dash?: boolean; arrow?: boolean; w?: number }
  | { kind: 'vline'; key: string; x: number; col?: Paint; dash?: boolean }
  | { kind: 'hline'; key: string; y: number; col?: Paint; dash?: boolean }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint; align?: 'left' | 'center' | 'right' };
export interface GPic {
  x: Axis; y: Axis;
  parts: GPart[];
  /** solution side: parts that come in on the replay, and a point riding a piece with its (x, y) */
  reveal?: { parts?: GPart[]; trace?: { key: string; x: number } };
  /** x-axis tick labels as money / plain (the y axis of a price graph shows $) */
  money?: 'x' | 'y';
}
/** a picture: one graph (left), or 2-3 option graphs (A, B, C) across the stage */
export type Pic = { g?: GPic; opts?: GPic[] };

const PCOL: Paint[] = ['link', 'water', 'first'];
/**
 * the parts of a piecewise rule drawn correctly: each piece only over its interval; at each finite end a closed dot
 * when the piece includes it, an open ring when it does not, and nothing when another piece covers that point with
 * the same value (a continuous join shows one filled dot); x = a rows become single points; linear rays get arrows
 */
export function pieceParts(ps: readonly Piece[], pre = 'p', o: { cols?: Paint[]; arrows?: boolean } = {}): GPart[] {
  const out: GPart[] = [];
  ps.forEach((p, i) => {
    const key = `${pre}${i}`, col = (o.cols ?? PCOL)[i % (o.cols ?? PCOL).length];
    if (p.lo !== undefined && p.lo === p.hi) { out.push({ kind: 'point', key, x: p.lo, y: ev(p.fn, p.lo), col }); return; }
    const endAt = (x: number | undefined, incl: boolean | undefined): End => {
      if (x === undefined) return 'none';
      if (incl) return 'closed';
      const y = ev(p.fn, x), f = fAt(ps, x);
      return f !== undefined && Math.abs(f - y) < 1e-9 ? 'none' : 'open';
    };
    out.push({ kind: 'piece', key, fn: p.fn, lo: p.lo, hi: p.hi, ends: [endAt(p.lo, p.loIn), endAt(p.hi, p.hiIn)], col, arrow: o.arrows ?? true });
  });
  return out;
}
/** a window that holds the rule's breakpoints, the asked inputs and the pieces' values there */
export function windowFor(ps: readonly Piece[], xs: readonly number[] = [], o: { xCells?: number; yCells?: number; xName?: string; yName?: string; zero?: boolean; ys?: number[]; x0?: number; x1?: number } = {}): { x: Axis; y: Axis } {
  const bx = breaks(ps);
  const xv = [...bx, ...xs];
  if (o.x0 !== undefined) xv.push(o.x0);
  if (o.x1 !== undefined) xv.push(o.x1);
  // rays get room: two units past the last breakpoint on an open side
  if (ps.some(p => p.lo === undefined)) xv.push(Math.min(...xv) - 2);
  if (ps.some(p => p.hi === undefined)) xv.push(Math.max(...xv) + 2);
  const x = axisOver(xv, { cells: o.xCells ?? 12, zero: o.zero, name: o.xName });
  const ys = piecesRange(ps, x.min, x.max).concat(o.ys ?? []);
  const y = axisOver(ys.length ? ys : [0, 1], { cells: o.yCells ?? 12, zero: o.zero, name: o.yName });
  return { x, y };
}
/** a rule's graph clipped so that every drawn end dot is inside the window: rays get trimmed by the window anyway */
export function fits(g: GPic): boolean {
  const inX = (v: number) => v >= g.x.min - 1e-9 && v <= g.x.max + 1e-9, inY = (v: number) => v >= g.y.min - 1e-9 && v <= g.y.max + 1e-9;
  for (const P of [...g.parts, ...(g.reveal?.parts ?? [])]) {
    if (P.kind === 'piece') {
      for (const [j, e] of (P.ends ?? ['none', 'none']).entries()) {
        const x = j === 0 ? P.lo : P.hi;
        if (e !== 'none' && (x === undefined || !inX(x) || !inY(ev(P.fn, x)))) return false;
      }
      const a = Math.max(P.lo ?? g.x.min, g.x.min), b = Math.min(P.hi ?? g.x.max, g.x.max);
      if (b <= a) return false;
      let hit = false;
      for (let i = 0; i <= 30; i++) { const y = ev(P.fn, a + (b - a) * i / 30); if (Number.isFinite(y) && inY(y)) hit = true; }
      if (!hit) return false;
    } else if (P.kind === 'point' || P.kind === 'text') { if (!inX(P.x) || !inY(P.y)) return false; }
    else if (P.kind === 'seg') { if (!inX(P.a[0]) || !inY(P.a[1]) || !inX(P.b[0]) || !inY(P.b[1])) return false; }
  }
  return true;
}
/** where a linear ray leaves the window, nudged inside (for its arrow head); null when it does not */
export function rayExit(m: number, b: number, from: number, dir: 1 | -1, x: Axis, y: Axis): { at: [number, number]; back: [number, number] } | null {
  const xEdge = dir > 0 ? x.max : x.min;
  let xe = xEdge;
  if (m !== 0) {
    for (const yb of [y.min, y.max]) {
      const xc = (yb - b) / m;
      if ((dir > 0 ? xc > from && xc < xe : xc < from && xc > xe)) xe = xc;
    }
  }
  const at: [number, number] = [clean(from + (xe - from) * 0.985), 0];
  at[1] = m * at[0] + b;
  if (at[1] < y.min - 1e-9 || at[1] > y.max + 1e-9) return null;
  let dx = Math.min(0.7 * x.step, m === 0 ? Infinity : (0.7 * y.step) / Math.abs(m));
  // the arrow's tail must sit inside the window too (a full line may enter the window far from `from`)
  for (let i = 0; i < 6; i++, dx /= 2) {
    const bx = at[0] - dir * dx, by = m * bx + b;
    if (dir > 0 ? bx <= from : bx >= from) continue;
    if (bx >= x.min && bx <= x.max && by >= y.min && by <= y.max && dx >= 0.15 * x.step) return { at, back: [clean(bx), clean(by)] };
  }
  return null;
}
/** the y value a reader takes at x from a drawn rule (the closed dot / the piece through x) */
export const drawnValue = (ps: readonly Piece[], x: number) => fAt(ps, x);
export { covers };
