// pictures.ts: the practice (and lesson) pictures of "Exponential growth and decay" as plain data: a GrowthTable (a
// table of values with ratio / difference labels between rows) and / or a coordinate plane on the shared kit's Plane
// (exponential curves a·b^x, point graphs at whole inputs, lines, points, asymptotes). Data shown with the question
// sits in `ratios`, `diffs`, `items`; data that waits for the replay after a miss sits in `solveRatios`, `solveDiffs`,
// `solveItems` and the table's `reveal` cells, so no answer is on screen before the student answers.
import type { Paint, Theme } from '../../../core/theme';
import type { Frame } from '../../../blocks/block';
import { Plane, type PItem, type PlaneBlock } from '../../kit/Plane';
import { GrowthTable, type TabBlock } from './GrowthTable';
import { nH } from './expo';

export interface TPic {
  tName: string; ts: string[]; cols: { name: string; vals: (string | null)[]; reveal?: (string | null)[]; col?: Paint }[];
  ratios?: (string | null)[]; diffs?: (string | null)[]; solveRatios?: (string | null)[]; solveDiffs?: (string | null)[];
  /** ratio labels drawn in the wrong colour in the replay (unequal ratios) */ hot?: number[];
}
type End = 'open' | 'closed' | 'none';
export type GItem =
  | { kind: 'exp'; key: string; a: number; b: number; lo?: number; hi?: number; ends?: [End, End]; col?: Paint; dash?: boolean; name?: string }
  | { kind: 'line'; key: string; m: number; c: number; lo?: number; hi?: number; col?: Paint; dash?: boolean; name?: string }
  | { kind: 'pts'; key: string; a: number; b: number; xs: number[]; col?: Paint; /** indices of xs whose point is named (x, y) */ named?: number[] }
  | { kind: 'dots'; key: string; pts: [number, number][]; col?: Paint; named?: number[] }
  | { kind: 'hline'; key: string; y: number; col?: Paint; dash?: boolean }
  | { kind: 'text'; key: string; x: number; y: number; text: string; col?: Paint; align?: 'left' | 'center' | 'right' };
export interface GAxis { min: number; max: number; step: number; name?: string }
export interface GPic { x: GAxis; y: GAxis; items: GItem[]; solveItems?: GItem[] }
export type Pic = { t?: TPic; g?: GPic };

/** a friendly axis over lo..hi with at most `max` cells (0 included when near) */
const STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000];
export function niceAxis(lo: number, hi: number, max = 10, zero = true): GAxis {
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  for (const s of STEPS) {
    let a = Math.floor(lo / s + 1e-9) * s, b = Math.ceil(hi / s - 1e-9) * s;
    if (b === hi && hi !== 0) b += s;
    if (a === lo && lo !== 0) a -= s;
    while ((b - a) / s < 3) b += s;
    if ((b - a) / s <= max) return { min: Math.round(a * 1e6) / 1e6, max: Math.round(b * 1e6) / 1e6, step: s };
  }
  return { min: lo, max: hi, step: (hi - lo) / max };
}
const ptName = (x: number, y: number) => `(${nH(x)}, ${nH(y, 3)})`;
function planeItems(items: readonly GItem[]): PItem[] {
  const out: PItem[] = [];
  for (const it of items) {
    if (it.kind === 'exp') out.push({ kind: 'curve', key: it.key, f: x => it.a * it.b ** x, lo: it.lo, hi: it.hi, ends: it.ends, col: it.col, dash: it.dash, name: it.name });
    else if (it.kind === 'line') out.push({ kind: 'curve', key: it.key, f: x => it.m * x + it.c, lo: it.lo, hi: it.hi, col: it.col, dash: it.dash, name: it.name });
    else if (it.kind === 'pts') it.xs.forEach((x, i) => { const y = it.a * it.b ** x; out.push({ kind: 'point', key: `${it.key}#${i}`, x, y, col: it.col ?? 'first', name: it.named?.includes(i) ? ptName(x, y) : undefined }); });
    else if (it.kind === 'dots') it.pts.forEach(([x, y], i) => out.push({ kind: 'point', key: `${it.key}#${i}`, x, y, col: it.col ?? 'first', name: it.named?.includes(i) ? ptName(x, y) : undefined }));
    else if (it.kind === 'hline') out.push({ kind: 'hline', key: it.key, y: it.y, col: it.col ?? 'dim', dash: it.dash ?? true });
    else out.push({ kind: 'text', key: it.key, x: it.x, y: it.y, text: it.text, col: it.col, align: it.align });
  }
  return out;
}
/** the kit Plane of a picture (question items and solve items); point keys `key#i` step with `key` */
export function planeOf(g: GPic, fr: Frame, th: Theme): PlaneBlock {
  const fmt = (v: number) => nH(v, 3);
  const items = planeItems([...g.items, ...(g.solveItems ?? [])]);
  try { return Plane({ x: { ...g.x, fmt }, y: { ...g.y, fmt }, items }, fr, th); } catch {
    // no room for a curve's name: draw the curves unnamed (their colours still match the table / prompt)
    return Plane({ x: { ...g.x, fmt }, y: { ...g.y, fmt }, items: items.map(it => (it.kind === 'curve' ? { ...it, name: undefined } : it)) }, fr, th);
  }
}
export const stepOf = (key: string): { key: string; i: number } => { const [k, i] = key.split('#'); return { key: k!, i: i === undefined ? -1 : Number(i) }; };
/** the GrowthTable of a picture (question labels; solve labels join them on the replay steps) */
export function tableOf(t: TPic, fr: Frame, th: Theme, top = false, size?: number): TabBlock {
  const n = t.ts.length - 1;
  const merge = (a?: (string | null)[], b?: (string | null)[]) => (a || b ? Array.from({ length: n }, (_, i) => a?.[i] ?? b?.[i] ?? null) : undefined);
  return GrowthTable({ tName: t.tName, ts: t.ts, cols: t.cols, ratios: merge(t.ratios, t.solveRatios), diffs: merge(t.diffs, t.solveDiffs), top, size }, fr, th);
}
