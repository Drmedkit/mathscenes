// pic.ts: a practice picture (ckit PlanePic) as kit Plane parameters, and the polygon wash the kit Plane does not have.
// Pure (kit types only), so the tests build every picture in the frame the page uses and catch a window that would
// not read. Keys: the picture's own keys; the reveal layer's keys start with 'r.' (the page brings them in at the solve);
// a polygon's sides are segments '<key>.s0', '<key>.s1', ...; a circle is two curves '<key>.u' and '<key>.d'.
import type { PItem, PParams } from '../../kit/Plane';
import type { Layer, PlanePic } from './ckit';
import { type V, near } from './cg';

const M = (v: V): [number, number] => [v[0], v[1]];

function itemsOf(l: Layer | undefined, pre: string, dashed = false): PItem[] {
  if (!l) return [];
  const out: PItem[] = [];
  for (const p of l.polys ?? []) p.pts.forEach((a, i) => out.push({ kind: 'seg', key: `${pre}${p.key}.s${i}`, a: M(a), b: M(p.pts[(i + 1) % p.pts.length]!), col: p.col ?? 'first', w: 5, dash: dashed && p.col === 'pick' }));
  for (const L of l.lines ?? []) {
    if (near(L.a[0], L.b[0])) out.push({ kind: 'vline', key: pre + L.key, x: L.a[0], col: L.col ?? 'link', dash: false });
    else { const m = (L.b[1] - L.a[1]) / (L.b[0] - L.a[0]), c = L.a[1] - m * L.a[0]; out.push({ kind: 'curve', key: pre + L.key, f: x => m * x + c, col: L.col ?? 'link', w: 5 }); }
  }
  for (const C of l.circles ?? []) {
    const f = (s: number) => (x: number) => C.c[1] + s * Math.sqrt(Math.max(0, C.r * C.r - (x - C.c[0]) ** 2));
    out.push({ kind: 'curve', key: `${pre}${C.key}.u`, f: f(1), lo: C.c[0] - C.r, hi: C.c[0] + C.r, col: C.col ?? 'first', w: 5 });
    out.push({ kind: 'curve', key: `${pre}${C.key}.d`, f: f(-1), lo: C.c[0] - C.r, hi: C.c[0] + C.r, col: C.col ?? 'first', w: 5 });
  }
  for (const s of l.segs ?? []) out.push({ kind: 'seg', key: pre + s.key, a: M(s.a), b: M(s.b), col: s.col ?? 'pick', dash: s.dash, w: s.w ?? 5 });
  for (const t of l.texts ?? []) out.push({ kind: 'text', key: pre + t.key, x: t.at[0], y: t.at[1], text: t.text, col: t.col ?? 'ink', size: 46 });
  for (const p of l.pts ?? []) out.push({ kind: 'point', key: pre + p.key, x: p.at[0], y: p.at[1], name: p.name || undefined, col: p.col ?? 'first', open: p.open });
  return out;
}
/** the kit Plane parameters of a practice picture; `reveal` adds the solve layer (keys 'r.…') */
export function planeParams(p: PlanePic, reveal: boolean): PParams {
  return {
    x: { min: p.x[0], max: p.x[1], step: p.x[2], name: 'x' }, y: { min: p.y[0], max: p.y[1], step: p.y[2], name: 'y' }, equal: true,
    items: [...itemsOf(p, ''), ...(reveal ? itemsOf(p.reveal, 'r.', true) : [])],
  };
}
/** every item key of a layer as the Plane knows it (for bringing them in) */
export function keysOf(p: PlanePic, layer: 'base' | 'reveal'): string[] {
  return itemsOf(layer === 'base' ? p : p.reveal, layer === 'base' ? '' : 'r.').map(i => i.key);
}
