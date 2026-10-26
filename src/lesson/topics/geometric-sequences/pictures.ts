// pictures.ts: one geometric-sequence picture = the GeoStrip (indexed table with ×r hops, optional +d row) above a kit
// Plane of the discrete graph (n, a_n): separate points, an optional dashed guide curve a·r^(x − k) through them (r > 0:
// "only whole n are terms"), optional comparison points of an arithmetic sequence (the straight-line partner), an
// open ring on the guide at n = 0 (a value that is not a term), and a threshold line. Used by the lesson parts and by
// every practice item that has a picture.
// Steps (with a caller prefix): s.card s.vals s.hops s.adds s.reveal (strip), g.axes g.pts g.cmp g.guide g.zero g.line
// g.hide (plane). Pure layout (blocks throw when something would not read; callers use tryBlock).
import { type Box, clamp } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import { progressOf } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import { type Frame, frame } from '../../../blocks/block';
import { Plane, type PFocus, type PItem, type PlaneBlock } from '../../kit/Plane';
import { niceAxis } from '../arithmetic-sequences/pictures';
import { GeoStrip, type GStripBlock, type GStripFocus, type GStripParams, gstripH } from './GeoStrip';

export interface GraphPic {
  /** the points (n, a_n) drawn from the start */ pts: [number, number][];
  /** points drawn only in the replay (the answer) */ solvePts?: [number, number][];
  /** a dashed guide y = a·r^(x − k) (r > 0) */ guide?: { a: number; r: number; k: number };
  /** points of an arithmetic sequence for comparison (same start), drawn in a second colour */ cmp?: [number, number][];
  /** an open ring at (0, value) on the guide */ zero?: number;
  /** a horizontal line (a threshold) */ line?: number;
  xName?: string; yName?: string;
  /** a fixed value axis */ y?: { min: number; max: number; step: number };
  /** a fixed n axis (default 0 .. last n + 1) */ x?: { min: number; max: number; step: number };
}
export type GeoPic = {
  strip?: GStripParams; graph?: GraphPic;
  /** steps that wait for the replay after a miss: 'hops', 'adds' (strip arcs), 'guide', 'cmp', 'zero', 'line' */ hold?: string[];
  /** hops in the wrong colour in the replay (a list that is not geometric) */ hot?: number[];
  /** the replay counts the hops (they light up one by one) */ count?: boolean | number;
};
export interface GeoView {
  strip: GStripBlock | null; plane: PlaneBlock | null;
  draw(c: Canvas, k: (s: string) => number, f?: { strip?: GStripFocus; plane?: PFocus }): void;
  where(key: string): Box;
}
export function geoView(pic: GeoPic, area: Frame, th: Theme): GeoView {
  const both = !!pic.strip && !!pic.graph;
  const sh = pic.strip ? gstripH(pic.strip.hops ?? true, pic.strip.adds ?? false) : 0;
  const strip = pic.strip ? GeoStrip(pic.strip, frame(area.x, area.y, area.w, sh), th) : null;
  let plane: PlaneBlock | null = null;
  const G = pic.graph;
  const nP = G?.pts.length ?? 0, nH0 = G?.solvePts?.length ?? 0, nC = G?.cmp?.length ?? 0;
  if (G) {
    const all = [...G.pts, ...(G.solvePts ?? []), ...(G.cmp ?? [])];
    const ns = all.map(q => q[0]), vs = all.map(q => q[1]);
    if (G.zero !== undefined) vs.push(G.zero);
    if (G.line !== undefined) vs.push(G.line);
    const nMax = Math.max(...ns) + 1;
    const xs = G.x ?? (nMax <= 14 ? { min: 0, max: nMax, step: 1 } : { min: 0, max: Math.ceil(nMax / 2) * 2, step: 2 });
    const ys = G.y ?? niceAxis(Math.min(...vs), Math.max(...vs), both ? 8 : 12);
    const items: PItem[] = [];
    if (G.guide && G.guide.r > 0) {
      const { a, r, k } = G.guide;
      items.push({ kind: 'curve', key: 'guide', f: x => a * r ** (x - k), lo: Math.max(xs.min, G.zero !== undefined ? 0 : 1), hi: xs.max, dash: true, w: 3, col: 'dim' });
    }
    if (G.line !== undefined) items.push({ kind: 'hline', key: 'line', y: G.line, col: 'wrong', dash: true });
    (G.cmp ?? []).forEach((q, i) => items.push({ kind: 'point', key: `c${i}`, x: q[0], y: q[1], col: 'water', open: true }));
    if (G.zero !== undefined) items.push({ kind: 'point', key: 'zero', x: 0, y: G.zero, open: true, col: 'pick' });
    G.pts.forEach((q, i) => items.push({ kind: 'point', key: `p${i}`, x: q[0], y: q[1], col: 'first' }));
    (G.solvePts ?? []).forEach((q, i) => items.push({ kind: 'point', key: `h${i}`, x: q[0], y: q[1], col: 'link' }));
    const fr = both ? frame(area.x, area.y + sh + 18, area.w, area.h - sh - 18) : area;
    plane = Plane({ x: { ...xs, name: G.xName ?? 'n' }, y: { ...ys, name: G.yName ?? 'aₙ' }, items }, fr, th);
  }
  function draw(c: Canvas, k: (s: string) => number, f: { strip?: GStripFocus; plane?: PFocus } = {}): void {
    strip?.draw(c, progressOf(s => k('s.' + s)), f.strip);
    if (plane) {
      const kp = k('g.pts'), kh = k('g.hide'), kc = k('g.cmp');
      plane.draw(c, progressOf(s => {
        if (s === 'axes') return k('g.axes');
        if (s === 'guide' || s === 'zero' || s === 'line') return k('g.' + s);
        if (s.startsWith('p')) return clamp(kp * (nP + 1) - Number(s.slice(1)));
        if (s.startsWith('h')) return clamp(kh * (nH0 + 1) - Number(s.slice(1)));
        if (s.startsWith('c')) return clamp(kc * (nC + 1) - Number(s.slice(1)));
        return 0;
      }), f.plane);
    }
  }
  function where(key: string): Box {
    if (/^(val|idx|hop|add)\./.test(key) || key === 'card') return strip!.where(key);
    if (key === 'p.card') return plane!.box;
    const m = key.match(/^([phc])\.(\d+)$/);
    return plane!.where(m ? m[1]! + m[2]! : key);
  }
  return { strip, plane, draw, where };
}
