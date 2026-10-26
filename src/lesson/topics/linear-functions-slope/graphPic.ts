// graphPic.ts: the practice pictures of "Linear functions and slope" as plain data (items.ts makes them, the page
// draws them): a coordinate plane (built on the shared kit's Plane), a table of values (TableCard) or a number line
// (NumberLine). A plane picture names its items; `show` are drawn with the question, `solve` come in on the worked
// solution after a miss (so no answer is on screen before the student answers). Lines are y = mx + b given by m and b,
// so a picture stays serialisable (the log and the check-in can keep it).
import type { Paint } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import type { Theme } from '../../../core/theme';
import { Plane, type PItem, type PlaneBlock } from '../../kit/Plane';

type End = 'open' | 'closed' | 'none';
export interface GAxis { min: number; max: number; step: number; name?: string }
export type GItem =
  | { kind: 'line'; key: string; m: number; b: number; lo?: number; hi?: number; ends?: [End, End]; col?: Paint; dash?: boolean; name?: string }
  | { kind: 'vline'; key: string; x: number; col?: Paint; dash?: boolean }
  | { kind: 'dots'; key: string; m: number; b: number; xs: number[]; col?: Paint }
  | { kind: 'point'; key: string; x: number; y: number; name?: string; col?: Paint; open?: boolean }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: Paint; arrow?: boolean; dash?: boolean; w?: number }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint; align?: 'left' | 'center' | 'right' };
export interface GPic { x: GAxis; y: GAxis; equal?: boolean; items: GItem[]; show: string[]; solve: string[] }
export interface TPic { xName: string; yName: string; xs: number[]; ys: string[]; /** rows ringed on the solve */ ring?: number[]; /** the changes between rows, shown on the solve */ diffs?: boolean; /** cells shown as ? (the solve fills them) */ hide?: number[]; ysSolved?: string[] }
export interface NPic { min: number; max: number; step: number; name?: string; lo?: { v: number; open: boolean }; hi?: { v: number; open: boolean }; /** the set appears with the question (else on the solve) */ given: boolean }
export type Pic = { g?: GPic; t?: TPic; n?: NPic; /** TeX lines written on the board on the solve */ tex?: string[] };

/** an axis window around the values: multiples of step, `pad` steps of room, 0 inside when asked */
export function fitAxis(vals: readonly number[], step: number, o: { pad?: number; zero?: boolean; name?: string; min?: number; max?: number } = {}): GAxis {
  const pad = o.pad ?? 1, vs = o.zero ? [...vals, 0] : [...vals];
  let min = Math.floor(Math.min(...vs) / step - 1e-9) * step - pad * step, max = Math.ceil(Math.max(...vs) / step + 1e-9) * step + pad * step;
  if (o.min !== undefined) min = Math.max(min, o.min);
  if (o.max !== undefined) max = Math.min(max, o.max);
  while (Math.round((max - min) / step) < 4) { max += step; if (Math.round((max - min) / step) < 4) min -= step; }
  return { min, max, step, name: o.name };
}
/** a square window (same step and same span on both axes, the longer span wins) around points */
export function squareWin(xs: readonly number[], ys: readonly number[], step = 1, zero = true): { x: GAxis; y: GAxis } {
  const x = fitAxis(xs, step, { zero }), y = fitAxis(ys, step, { zero });
  const nx = (x.max - x.min) / step, ny = (y.max - y.min) / step, n = Math.max(nx, ny);
  // too many grid lines: a coarser step (2, then 5)
  if (n > 16 && step < 5) return squareWin(xs, ys, step === 1 ? 2 : 5, zero);
  const grow = (a: GAxis, k: number): GAxis => ({ ...a, min: a.min - Math.floor(k / 2) * step, max: a.max + Math.ceil(k / 2) * step });
  return { x: grow(x, n - nx), y: grow(y, n - ny) };
}
/** run and rise arrows from A to B with their labels (placed off the line, away from the triangle) */
export function riseRun(pre: string, A: readonly [number, number], B: readonly [number, number], xs: number, ys: number, runText: string, riseText: string, o: { runInside?: boolean; riseY?: number } = {}): GItem[] {
  const C: [number, number] = [B[0], A[1]];
  const up = B[1] > A[1], right = B[0] > A[0];
  return [
    { kind: 'seg', key: pre + 'run', a: [A[0], A[1]], b: C, col: 'first', arrow: true },
    { kind: 'seg', key: pre + 'rise', a: C, b: [B[0], B[1]], col: 'second', arrow: true },
    { kind: 'text', key: pre + 'runT', x: (A[0] + B[0]) / 2, y: A[1] + (up !== !!o.runInside ? -0.62 : 0.62) * ys, text: runText, col: 'first' },
    { kind: 'text', key: pre + 'riseT', x: B[0] + (right ? 0.3 : -0.3) * xs, y: o.riseY ?? (A[1] + B[1]) / 2, text: riseText, col: 'second', align: right ? 'left' : 'right' },
  ];
}
/** the shared kit's Plane for a picture; dots become points keyed `key#i` (their step is `key`) */
export function planeOf(g: GPic, fr: Frame, th: Theme): PlaneBlock {
  const items: PItem[] = [];
  for (const it of g.items) {
    if (it.kind === 'line') items.push({ kind: 'curve', key: it.key, f: x => it.m * x + it.b, lo: it.lo, hi: it.hi, ends: it.ends, col: it.col, dash: it.dash, name: it.name });
    else if (it.kind === 'vline') items.push({ kind: 'vline', key: it.key, x: it.x, col: it.col ?? 'link', dash: it.dash ?? false });
    else if (it.kind === 'dots') it.xs.forEach((x, i) => items.push({ kind: 'point', key: `${it.key}#${i}`, x, y: it.m * x + it.b, col: it.col ?? 'link' }));
    else if (it.kind === 'seg') items.push({ kind: 'seg', key: it.key, a: it.a, b: it.b, col: it.col, arrow: it.arrow, dash: it.dash, w: it.w });
    else items.push(it as PItem);
  }
  return Plane({ x: { ...g.x }, y: { ...g.y }, equal: g.equal, items }, fr, th);
}
/** the step key of a Plane item key (dots share their family's key) */
export const stepOf = (key: string) => key.split('#')[0]!;
