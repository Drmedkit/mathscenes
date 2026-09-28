// morph.ts: shape morphs. A shape = closed subpaths (point lists, world px), filled evenodd. Subpaths are matched
// largest to largest; an unmatched subpath (e.g. the hole of a 6 when a 5 turns into a 6) grows from / shrinks to its
// own centre. Each pair is resampled to N points and B's start point is rotated to the shortest travel.
import { type Pt, clamp, lerp } from './math';
import { E } from './easing';
import { centroid, resample, signedArea, transformPts } from './pts';
import { type Canvas, glowOn, pathOf } from './draw';
import { type Paint, paint } from './theme';

export type Shape = readonly (readonly Pt[])[];
const N = 96;
type Pair = [Pt[], Pt[]];
const cache = new Map<string, Pair[]>();

function prepPair(A: Shape, B: Shape): Pair[] {
  const sortSubs = (S: Shape) => S.filter(P => P.length > 2).map(P => ({ P, a: Math.abs(signedArea(P)) })).sort((x, y) => y.a - x.a).map(x => x.P);
  const a = sortSubs(A), b = sortSubs(B), n = Math.max(a.length, b.length), pairs: Pair[] = [];
  for (let i = 0; i < n; i++) {
    const sa = a[i], sb = b[i];
    let pa = sa ? resample(sa, N) : null, pb = sb ? resample(sb, N) : null;
    if (!pa && pb) { const c = centroid(pb); pa = pb.map(() => [c[0], c[1]] as Pt); }
    else if (pa && !pb) { const c = centroid(pa); pb = pa.map(() => [c[0], c[1]] as Pt); }
    else if (pa && pb) {
      if (Math.sign(signedArea(pa)) !== Math.sign(signedArea(pb))) pb = pb.slice().reverse();
      const ca = centroid(pa), cb = centroid(pb);
      let best = 0, bd = Infinity;
      for (let s = 0; s < N; s++) {
        let d = 0;
        for (let j = 0; j < N; j += 3) {
          const p = pa[j]!, q = pb[(j + s) % N]!;
          d += (p[0] - ca[0] - q[0] + cb[0]) ** 2 + (p[1] - ca[1] - q[1] + cb[1]) ** 2;
        }
        if (d < bd) { bd = d; best = s; }
      }
      const pbb = pb;
      pb = pbb.map((_, j) => pbb[(j + best) % N]!);
    }
    if (pa && pb) pairs.push([pa, pb]);
  }
  return pairs;
}

/** the in-between shape at k (0 = A, 1 = B). rot: A also turns by rot (rad) on the way (+ turns into x). key: cache id */
export function morphShape(A: Shape, B: Shape, k: number, key?: string, rot = 0): Pt[][] {
  let pairs = key ? cache.get(key) : undefined;
  if (!pairs) { pairs = prepPair(A, B); if (key) cache.set(key, pairs); }
  const c = rot ? centroid(A.flat()) : null;
  return pairs.map(([pa, pb]) => {
    const qa = rot && c ? transformPts(pa, 0, 0, 1, -(1 - k) * rot, c[0], c[1]) : pa;
    return qa.map((p, j) => [lerp(p[0], pb[j]![0], k), lerp(p[1], pb[j]![1], k)] as Pt);
  });
}
export const clearMorphCache = (): void => cache.clear();

export interface MorphOpts { fill?: Paint; stroke?: Paint; lw?: number; alpha?: number; key?: string; rot?: number; glow?: number; glowCol?: Paint }
/** draw the morph A -> B at k (eased smooth) */
export function morph(c: Canvas, A: Shape, B: Shape, k: number, o: MorphOpts = {}): void {
  const S = morphShape(A, B, E.smooth(clamp(k)), o.key, o.rot ?? 0);
  const p = new Path2D();
  for (const P of S) p.addPath(pathOf(P, true));
  const { g, th } = c;
  g.save(); g.globalAlpha *= clamp(o.alpha ?? 1);
  if (o.glow) glowOn(c, paint(th, o.glowCol ?? o.fill ?? 'ink', 'fill'), o.glow);
  if (o.fill) { g.fillStyle = paint(th, o.fill, 'text'); g.fill(p, 'evenodd'); }
  if (o.stroke) { g.strokeStyle = paint(th, o.stroke, 'text'); g.lineWidth = o.lw ?? th.lw.thin; g.lineJoin = 'round'; g.stroke(p); }
  g.restore();
}
