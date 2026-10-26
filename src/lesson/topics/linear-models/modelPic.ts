// modelPic.ts: the practice pictures of "Linear equations from a context" as plain data (items.ts makes them, the page
// draws them). A model plane (the shared kit's Plane) whose items are serialisable: the model as a line or a ray over
// its valid inputs, the model as DOTS at whole-number inputs (counted quantities), data points, a target / threshold
// line with the side that is allowed shaded, words. `show` come in with the question, `solve` on the worked solution
// after a miss (so nothing on screen gives the answer away). A table (linear-functions-slope's TableCard) or a stack
// of restrictions (Restrictions.ts) where the sub-goal is about those.
import type { Paint, Theme } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import { Plane, type PItem, type PlaneBlock, fmtN } from '../../kit/Plane';
import type { TPic } from '../linear-functions-slope/graphPic';
import type { RPic } from './Restrictions';

type End = 'open' | 'closed' | 'none';
export interface MAxis { min: number; max: number; step: number; name?: string; /** tick labels as money ($20) */ money?: boolean }
export type MItem =
  | { kind: 'line'; key: string; m: number; b: number; lo?: number; hi?: number; ends?: [End, End]; col?: Paint; dash?: boolean; name?: string }
  | { kind: 'dots'; key: string; m: number; b: number; xs: number[]; col?: Paint }
  | { kind: 'point'; key: string; x: number; y: number; name?: string; col?: Paint; open?: boolean }
  | { kind: 'seg'; key: string; a: [number, number]; b: [number, number]; col?: Paint; arrow?: boolean; dash?: boolean }
  | { kind: 'hline'; key: string; y: number; col?: Paint; dash?: boolean }
  | { kind: 'vline'; key: string; x: number; col?: Paint; dash?: boolean }
  /** the allowed side of a threshold y = c, between x = lo and hi: below ('below') or above it */
  | { kind: 'band'; key: string; y: number; side: 'below' | 'above'; lo: number; hi: number; col?: Paint }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint; align?: 'left' | 'center' | 'right' };
export interface MPic { x: MAxis; y: MAxis; items: MItem[]; show: string[]; solve: string[] }
export type Pic = { g?: MPic; t?: TPic; r?: RPic; /** TeX lines written on the board on the solve */ tex?: string[] };

export const money = (v: number): string => {
  const a = Math.abs(v), s = Number.isInteger(Math.round(a * 1000) / 1000) ? String(Math.round(a)) : a.toFixed(2);
  return (v < 0 ? '−$' : '$') + s;
};
/** an axis around the values: a friendly step that keeps the grid at most `max` cells, `pad` cells of room */
export function axis(vals: readonly number[], o: { name?: string; money?: boolean; max?: number; min?: number; pad?: number; zero?: boolean } = {}): MAxis {
  const vs = o.zero === false ? [...vals] : [...vals, 0];
  for (const s of [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) {
    const pad = o.pad ?? 1;
    let min = Math.floor(Math.min(...vs) / s + 1e-9) * s, max = Math.ceil(Math.max(...vs) / s - 1e-9) * s + pad * s;
    if (min < 0) min -= pad * s;
    if (o.min !== undefined) min = Math.max(min, o.min);
    while (Math.round((max - min) / s) < 4) max += s;
    if ((max - min) / s <= (o.max ?? 12)) return { min, max, step: s, name: o.name, money: o.money };
  }
  return { min: 0, max: 10000, step: 1000, name: o.name, money: o.money };
}
/** the kit's Plane for a picture; dots become points keyed `key#i` (their step is `key`) */
export function planeOfM(g: MPic, fr: Frame, th: Theme): PlaneBlock {
  const items: PItem[] = [];
  const ax = (a: MAxis) => ({ min: a.min, max: a.max, step: a.step, name: a.name, fmt: a.money ? (v: number) => (v < 0 ? '−$' : '$') + fmtN(Math.abs(v)) : undefined });
  for (const it of g.items) {
    if (it.kind === 'line') items.push({ kind: 'curve', key: it.key, f: x => it.m * x + it.b, lo: it.lo, hi: it.hi, ends: it.ends, col: it.col, dash: it.dash, name: it.name });
    else if (it.kind === 'dots') it.xs.forEach((x, i) => items.push({ kind: 'point', key: `${it.key}#${i}`, x, y: it.m * x + it.b, col: it.col ?? 'link' }));
    else if (it.kind === 'hline') items.push({ kind: 'hline', key: it.key, y: it.y, col: it.col ?? 'first', dash: it.dash ?? false });
    else if (it.kind === 'vline') items.push({ kind: 'vline', key: it.key, x: it.x, col: it.col ?? 'dim', dash: it.dash ?? true });
    else if (it.kind === 'band') items.push({ kind: 'shade', key: it.key, lo: it.lo, hi: it.hi, top: it.side === 'below' ? () => it.y : 'top', bottom: it.side === 'below' ? 'bottom' : () => it.y, col: it.col ?? 'link', alpha: 0.16 });
    else if (it.kind === 'seg') items.push({ kind: 'seg', key: it.key, a: it.a, b: it.b, col: it.col, arrow: it.arrow, dash: it.dash });
    else items.push(it as PItem);
  }
  return Plane({ x: ax(g.x), y: ax(g.y), items }, fr, th);
}
/** the step key of a Plane item key (dots share their family's key) */
export const stepOf = (key: string) => key.split('#')[0]!;
