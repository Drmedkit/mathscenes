// pictures.ts: a practice picture (plain data, common.ts) as block parameters: the kit Plane for graphs and the
// DiffTable for tables. Pure (types and maths only), so the tests can build every picture with the frame the page
// uses and catch a window or a table that would not read.
import type { PItem, PParams } from '../../kit/Plane';
import type { DParams } from './DiffTable';
import type { GItem, GPic, TPic } from './common';
import { fnOf, nH } from './ff';

export function planeItem(g: GItem): PItem {
  switch (g.kind) {
    case 'fn': return { kind: 'curve', key: g.key, f: fnOf(g.s), col: g.col ?? 'link', name: g.name, dash: g.dash, lo: g.lo, hi: g.hi, ends: g.ends };
    case 'point': return { kind: 'point', key: g.key, x: g.x, y: g.y, col: g.col ?? 'first', name: g.name, open: g.open };
    case 'seg': return { kind: 'seg', key: g.key, a: g.a, b: g.b, col: g.col ?? 'pick', dash: g.dash };
    case 'hline': return { kind: 'hline', key: g.key, y: g.y, col: g.col ?? 'dim' };
    case 'vline': return { kind: 'vline', key: g.key, x: g.x, col: g.col ?? 'dim' };
    case 'text': return { kind: 'text', key: g.key, x: g.x, y: g.y, text: g.text, col: g.col ?? 'ink' };
  }
}
const fmt = (v: number) => nH(v);
export function planeParams(p: GPic): PParams {
  return {
    x: { min: p.x[0], max: p.x[1], step: p.x[2], name: p.xName ?? 'x', fmt },
    y: { min: p.y[0], max: p.y[1], step: p.y[2], name: p.yName ?? 'y', fmt },
    items: [...p.items, ...(p.solve ?? [])].map(planeItem),
  };
}
export function tableParams(t: TPic, size?: number): DParams {
  const S = t.solve ?? {};
  return { xName: t.xName, xs: t.xs, cols: t.cols, dx: t.dx ?? S.dx, d1: t.d1 ?? S.d1, d2: t.d2 ?? S.d2, rt: t.rt ?? S.rt, size };
}
/** a window [min, max, step] holding lo..hi with at most `max` cells, ending on grid lines */
const STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];
export function win(lo: number, hi: number, max = 10, zero = true): [number, number, number] {
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  for (const s of STEPS) {
    let a = Math.floor(lo / s + 1e-9) * s, b = Math.ceil(hi / s - 1e-9) * s;
    if (b - hi < s * 0.25 && hi !== 0) b += s;
    if (lo - a < s * 0.25 && lo !== 0) a -= s;
    while ((b - a) / s < 3) b += s;
    if ((b - a) / s <= max) return [Math.round(a * 1e6) / 1e6, Math.round(b * 1e6) / 1e6, s];
  }
  return [lo, hi, (hi - lo) / max];
}
