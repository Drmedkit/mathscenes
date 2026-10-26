// graph.ts: a GPic (pic.ts) on the shared kit's Plane. Pieces become curves with open / closed ends; an unbounded
// linear piece gets an arrow head where it leaves the window (a short seg keyed `<piece>~a`, drawn on the piece's own
// step: use `stepOf(key)` when you read progress). Reveal parts are added to the same Plane so the layout does not move
// when they come in.
import type { Frame } from '../../../blocks/block';
import type { Theme } from '../../../core/theme';
import { Plane, type PItem, type PlaneBlock, fmtN } from '../../kit/Plane';
import { ev } from './pw';
import { type GPart, type GPic, rayExit } from './pic';

export const stepOf = (key: string) => key.split('~')[0]!;
const money = (v: number) => (v < 0 ? '−$' : '$') + String(Math.abs(Math.round(v * 100) / 100));

export function itemsOf(g: GPic, parts: readonly GPart[]): PItem[] {
  const out: PItem[] = [];
  for (const P of parts) {
    if (P.kind === 'piece') {
      const f = P.fn;
      out.push({ kind: 'curve', key: P.key, f: x => ev(f, x), lo: P.lo, hi: P.hi, ends: P.ends, col: P.col, dash: P.dash, w: P.w });
      if (P.arrow && f.k === 'lin') {
        if (P.hi === undefined) { const r = rayExit(f.m, f.b, P.lo ?? g.x.min, 1, g.x, g.y); if (r) out.push({ kind: 'seg', key: P.key + '~a', a: r.back, b: r.at, col: P.col, arrow: true, w: P.w }); }
        if (P.lo === undefined) { const r = rayExit(f.m, f.b, P.hi ?? g.x.max, -1, g.x, g.y); if (r) out.push({ kind: 'seg', key: P.key + '~b', a: r.back, b: r.at, col: P.col, arrow: true, w: P.w }); }
      }
    } else if (P.kind === 'vline') out.push({ kind: 'vline', key: P.key, x: P.x, col: P.col ?? 'pick', dash: P.dash });
    else if (P.kind === 'hline') out.push({ kind: 'hline', key: P.key, y: P.y, col: P.col ?? 'pick', dash: P.dash });
    else out.push(P as PItem);
  }
  return out;
}
export function planeOf(g: GPic, fr: Frame, th: Theme): PlaneBlock {
  const items = itemsOf(g, [...g.parts, ...(g.reveal?.parts ?? [])]);
  return Plane({
    x: { ...g.x, fmt: g.money === 'x' ? money : fmtN },
    y: { ...g.y, fmt: g.money === 'y' ? money : fmtN },
    items,
  }, fr, th);
}
