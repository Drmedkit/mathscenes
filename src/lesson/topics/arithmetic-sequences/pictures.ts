// pictures.ts: one sequence picture = the SeqStrip (indexed table with jumps) above a kit Plane of the discrete graph
// (n, a_n): separate points, optional stairs (run 1, rise d), a dashed linear extension, an open ring at n = 0 (the
// intercept, not a term), named points. Used by the lesson parts and by every practice item that has a picture.
// Steps (with a caller prefix): s.card s.vals s.jumps s.reveal (strip), g.axes g.pts g.stairs g.guide g.zero g.hide
// g.names (plane). Pure layout (blocks throw when something would not read; callers use tryBlock).
import { type Box, clamp } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import { progressOf } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import { type Frame, frame } from '../../../blocks/block';
import { Plane, type PFocus, type PItem, type PlaneBlock } from '../../kit/Plane';
import { SeqStrip, type StripBlock, type StripFocus, type StripParams, stripH } from './SeqStrip';
import { nH, r6 } from './seq';

export type StripPic = StripParams;
export interface GraphPic {
  /** the points (n, a_n) drawn from the start */ pts: [number, number][];
  /** points drawn only in the replay (the answer) */ solvePts?: [number, number][];
  /** the linear extension y = p n + q, dashed (named) */ guide?: [number, number];
  /** an open ring at (0, q) on the guide: the intercept, not a term */ zero?: boolean;
  /** stairs from each point to the next (run 1, rise d) */ stairs?: boolean;
  /** points named with their coordinates (indices into pts) */ named?: number[];
  xName?: string; yName?: string;
  /** a fixed value axis (so points sit on grid lines and can be read) */ y?: { min: number; max: number; step: number };
}
export type SeqPic = {
  strip?: StripPic; graph?: GraphPic;
  /** steps that wait for the replay after a miss: 'jumps' (strip arcs), 'stairs', 'guide', 'zero' */ hold?: string[];
  /** jumps in the wrong colour in the replay (a list that is not arithmetic) */ hot?: number[];
  /** the replay counts the jumps (they light up one by one) */ count?: boolean;
};

const STEPS = [0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
/** a friendly axis over lo..hi with at most `max` cells (0 included when it is near) */
export function niceAxis(lo: number, hi: number, max = 10): { min: number; max: number; step: number } {
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
  for (const s of STEPS) {
    let a = Math.floor(lo / s + 1e-9) * s, b = Math.ceil(hi / s - 1e-9) * s;
    if (a > 0 && a / s <= 3) a = 0;
    if (b < 0 && -b / s <= 3) b = 0;
    // a point never sits on the window edge (0 may: it is the axis)
    if (a === lo && a !== 0) a -= s;
    if (b === hi && b !== 0) b += s;
    while ((b - a) / s < 2) b += s;
    if ((b - a) / s <= max) return { min: r6(a), max: r6(b), step: s };
  }
  return { min: lo, max: hi, step: (hi - lo) / max };
}
export interface SeqView {
  strip: StripBlock | null; plane: PlaneBlock | null;
  draw(c: Canvas, k: (s: string) => number, f?: { strip?: StripFocus; plane?: PFocus }): void;
  /** strip boxes 'val.i' / 'jump.i' / 'idx.i', plane items 'p.i' / 'h.i' / 'guide' / 'zero' */
  where(key: string): Box;
}
export function seqView(pic: SeqPic, area: Frame, th: Theme): SeqView {
  const both = !!pic.strip && !!pic.graph;
  const sh = pic.strip ? stripH(pic.strip.jumps ?? true) : 0;
  const strip = pic.strip ? SeqStrip(pic.strip, frame(area.x, area.y, area.w, sh), th) : null;
  let plane: PlaneBlock | null = null;
  const G = pic.graph;
  const nP = G?.pts.length ?? 0, nH0 = G?.solvePts?.length ?? 0;
  if (G) {
    const all = [...G.pts, ...(G.solvePts ?? [])];
    const ns = all.map(q => q[0]), vs = all.map(q => q[1]);
    if (G.guide) vs.push(G.guide[1]);
    const nMax = Math.max(...ns) + 1;
    const xs = nMax <= 14 ? { min: 0, max: nMax, step: 1 } : { min: 0, max: Math.ceil(nMax / 2) * 2, step: 2 };
    const ys = G.y ?? niceAxis(Math.min(...vs), Math.max(...vs), both ? 8 : 12);
    const items: PItem[] = [];
    if (G.guide) {
      const [p, q] = G.guide;
      items.push({ kind: 'curve', key: 'guide', f: x => p * x + q, lo: 0, hi: xs.max, dash: true, w: 3, col: 'dim', name: 'linear extension' });
    }
    if (G.stairs) G.pts.forEach((a, i) => {
      const b = G.pts[i + 1];
      if (!b || b[0] !== a[0] + 1) return;
      items.push({ kind: 'seg', key: `run${i}`, a, b: [b[0], a[1]], col: 'second', w: 4 });
      if (b[1] !== a[1]) items.push({ kind: 'seg', key: `rise${i}`, a: [b[0], a[1]], b, col: 'second', w: 4, arrow: true });
    });
    if (G.zero && G.guide) items.push({ kind: 'point', key: 'zero', x: 0, y: G.guide[1], open: true, col: 'pick', name: `(0, ${nH(G.guide[1])})` });
    G.pts.forEach((q, i) => items.push({ kind: 'point', key: `p${i}`, x: q[0], y: q[1], col: 'first', name: G.named?.includes(i) ? `(${nH(q[0])}, ${nH(q[1])})` : undefined }));
    (G.solvePts ?? []).forEach((q, i) => items.push({ kind: 'point', key: `h${i}`, x: q[0], y: q[1], col: 'link' }));
    const fr = both ? frame(area.x, area.y + sh + 18, area.w, area.h - sh - 18) : area;
    const P0 = { x: { ...xs, name: G.xName ?? 'n' }, y: { ...ys, name: G.yName ?? 'aₙ' }, items };
    try { plane = Plane(P0, fr, th); } catch {
      // no room for the guide's name: keep the guide unnamed
      plane = Plane({ ...P0, items: items.map(it => (it.key === 'guide' ? { ...it, name: undefined } : it)) }, fr, th);
    }
  }
  function draw(c: Canvas, k: (s: string) => number, f: { strip?: StripFocus; plane?: PFocus } = {}): void {
    strip?.draw(c, progressOf(s => k('s.' + s)), f.strip);
    if (plane) {
      const kp = k('g.pts'), kh = k('g.hide'), ks = k('g.stairs');
      plane.draw(c, progressOf(s => {
        if (s === 'axes') return k('g.axes');
        if (s === 'guide' || s === 'zero') return k('g.' + s);
        if (s.startsWith('p')) return clamp(kp * (nP + 1) - Number(s.slice(1)));
        if (s.startsWith('h')) return clamp(kh * (nH0 + 1) - Number(s.slice(1)));
        if (s.startsWith('run') || s.startsWith('rise')) { const i = Number(s.replace(/\D/g, '')); return clamp(ks * nP - i - (s.startsWith('rise') ? 0.5 : 0)); }
        return 0;
      }), f.plane);
    }
  }
  function where(key: string): Box {
    if (/^(val|idx|jump)\./.test(key) || key === 'card') return strip!.where(key);
    if (key === 'p.card') return plane!.box;
    const m = key.match(/^([ph])\.(\d+)$/);
    return plane!.where(m ? m[1]! + m[2]! : key);
  }
  return { strip, plane, draw, where };
}
