// pic.ts: a practice picture (GPic, data) as kit Plane parameters. Pure (types from the kit only), so the tests can
// build every picture with the same frame the page uses and catch a window that would not read.
import type { PItem, PParams } from '../../kit/Plane';
import type { GItem, GPic } from './common';
import { fn } from './qf';

export function planeItem(g: GItem): PItem {
  switch (g.kind) {
    case 'curve': return { kind: 'curve', key: g.key, f: fn(g.s), col: g.col ?? 'link', name: g.name, dash: g.dash, lo: g.lo, hi: g.hi, ends: g.ends };
    case 'point': return { kind: 'point', key: g.key, x: g.x, y: g.y, col: g.col ?? 'first', name: g.name, open: g.open };
    case 'vline': return { kind: 'vline', key: g.key, x: g.x, col: g.col ?? 'pick' };
    case 'hline': return { kind: 'hline', key: g.key, y: g.y, col: g.col ?? 'dim' };
    case 'seg': return { kind: 'seg', key: g.key, a: g.a, b: g.b, col: g.col ?? 'pick', dash: g.dash, arrow: g.arrow, w: g.w };
    case 'text': return { kind: 'text', key: g.key, x: g.x, y: g.y, text: g.text, col: g.col ?? 'ink' };
  }
}
export function planeParams(p: GPic): PParams {
  return {
    x: { min: p.x[0], max: p.x[1], step: p.x[2], name: p.xName ?? 'x' },
    y: { min: p.y[0], max: p.y[1], step: p.y[2], name: p.yName ?? 'y' },
    items: [...p.show, ...p.reveal].map(planeItem),
  };
}
