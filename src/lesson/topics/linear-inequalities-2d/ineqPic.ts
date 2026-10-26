// ineqPic.ts: the pictures of "Graphing inequalities in two variables" as plain data (items.ts and the page make them,
// the page draws them on the shared kit's Plane). Everything is what is DRAWN, never what it means:
//   bline  the line A x + B y = C, solid or dashed (a vertical line when B = 0)
//   shade  the region where every part s(A x + B y − C) ≥ 0 holds (an intersection of half-planes; one part = one
//          half-plane); drawn between a lower and an upper boundary over the x-range the vertical parts leave
//   point / text / seg   as in the kit
// `show` keys are drawn with the question, `solve` keys come in on the worked solution after a miss (so no answer is
// on screen before the student answers). A picture with an empty `show` starts as a big slate and turns into the
// plane on the solve (never an empty grid with a question).
import type { Paint, Theme } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import { Plane, type PItem, type PlaneBlock } from '../../kit/Plane';
import type { Half } from './ineq';

export interface GAxis { min: number; max: number; step: number; name?: string }
export type GItem =
  | { kind: 'bline'; key: string; A: number; B: number; C: number; dash: boolean; col?: Paint; name?: string }
  | { kind: 'shade'; key: string; parts: Half[]; col?: Paint; alpha?: number }
  | { kind: 'point'; key: string; x: number; y: number; name?: string; col?: Paint; open?: boolean }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: Paint; arrow?: boolean; dash?: boolean; w?: number }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint; align?: 'left' | 'center' | 'right'; size?: number };
export interface GPic { x: GAxis; y: GAxis; equal?: boolean; items: GItem[]; show: string[]; solve: string[] }
/** g = the plane; bd = extra TeX lines on the board with the question (a list of constraints, a table); tex = the
 *  worked TeX lines written on the solve */
export type Pic = { g?: GPic; bd?: string[]; tex?: string[] };

/** a square window: x and y from lo to hi */
export const win = (lo = -6, hi = 6, step = 1, xn = 'x', yn = 'y'): Pick<GPic, 'x' | 'y' | 'equal'> =>
  ({ x: { min: lo, max: hi, step, name: xn }, y: { min: lo, max: hi, step, name: yn }, equal: true });

/** the lower and upper y of a shade at x, and its x-range (null when the vertical parts leave nothing) */
export function shadeGeom(parts: readonly Half[], x0: number, x1: number): { lo: number; hi: number; low: (x: number) => number; up: (x: number) => number } | null {
  let lo = x0, hi = x1;
  const lows: ((x: number) => number)[] = [], ups: ((x: number) => number)[] = [];
  for (const p of parts) {
    if (Math.abs(p.B) < 1e-12) {
      // s(A x − C) ≥ 0: x ≥ C/A when sA > 0, else x ≤ C/A
      const c = p.C / p.A;
      if (p.s * p.A > 0) lo = Math.max(lo, c); else hi = Math.min(hi, c);
    } else {
      const f = (x: number) => (p.C - p.A * x) / p.B;
      if (p.s * p.B > 0) lows.push(f); else ups.push(f);
    }
  }
  if (hi - lo < 1e-9) return null;
  const BIG = 1e4;
  const low = (x: number) => Math.max(-BIG, ...lows.map(f => f(x)));
  const up = (x: number) => Math.max(low(x), Math.min(BIG, ...ups.map(f => f(x))));
  return { lo, hi, low, up };
}

/** the shared kit's Plane for a picture. A point name that finds no free spot is dropped (last point first) and the
 *  plane is built again: the coordinates are in the question anyway, and a picture without one label beats none */
export function planeOf(g: GPic, fr: Frame, th: Theme): PlaneBlock {
  let cur = g;
  for (;;) {
    try { return buildPlane(cur, fr, th); }
    catch (e) {
      const named = cur.items.map((it, i) => (it.kind === 'point' && it.name ? i : -1)).filter(i => i >= 0);
      if (!(e instanceof Error) || !/no room for the point name/.test(e.message) || !named.length) throw e;
      const drop = named[named.length - 1]!;
      cur = { ...cur, items: cur.items.map((it, i) => (i === drop ? { ...it, name: undefined } as GItem : it)) };
    }
  }
}
function buildPlane(g: GPic, fr: Frame, th: Theme): PlaneBlock {
  const items: PItem[] = [];
  const span = g.y.max - g.y.min;
  for (const it of g.items) {
    if (it.kind === 'bline') {
      if (Math.abs(it.B) < 1e-12) items.push({ kind: 'vline', key: it.key, x: it.C / it.A, col: it.col ?? 'link', dash: it.dash });
      else items.push({ kind: 'curve', key: it.key, f: x => (it.C - it.A * x) / it.B, col: it.col ?? 'link', dash: it.dash, name: it.name, w: 5 });
    } else if (it.kind === 'shade') {
      const G = shadeGeom(it.parts, g.x.min, g.x.max);
      // an empty region still gets a (flat) shade, so its step key exists; it draws nothing
      const clampY = (v: number) => Math.min(g.y.max + span, Math.max(g.y.min - span, v));
      if (G) items.push({ kind: 'shade', key: it.key, lo: G.lo, hi: G.hi, bottom: x => clampY(G.low(x)), top: x => clampY(G.up(x)), col: it.col ?? 'link', alpha: it.alpha ?? 0.3 });
    } else if (it.kind === 'seg') items.push({ kind: 'seg', key: it.key, a: it.a, b: it.b, col: it.col, arrow: it.arrow, dash: it.dash, w: it.w });
    else items.push(it as PItem);
  }
  return Plane({ x: { ...g.x }, y: { ...g.y }, equal: g.equal, items }, fr, th);
}
