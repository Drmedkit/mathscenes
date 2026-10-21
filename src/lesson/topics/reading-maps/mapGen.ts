// mapGen.ts: compose a calm practice map around the maths of an item (pure, seeded).
//   The item gives the route (legs with exact lengths and directions) and the overlays it needs; compose() places the
//   route on the field, adds one or two quiet features (a lake, a forest, a highway) where they do not touch the
//   measuring, picks the key entries, and keeps trying placements until layoutMap() finds no problem.
import { type Area, type AreaKind, type BarSpec, DIRS, FIELD, STRIP, type KeyKind, type MapPic, type MapUnit, type Overlay, type Place, type PlaceKind,
  type Pt, type Road, type RoadKind, type Verbal, UNIT_PX, add, dist, mapProblems, near, polyLen } from './mapMaths';

export const TOWNS = ['Millbrook', 'Pinecrest', 'Oakdale', 'Fairview', 'Elm Grove', 'Riverton', 'Ashford', 'Cedar Hill', 'Brookside', 'Clayton', 'Linden', 'Hollis', 'Weston', 'Marion', 'Dover', 'Alton'] as const;
export const CAMPS = ['Fox Camp', 'Bear Camp', 'Elk Camp', 'Pine Camp', 'Owl Camp'] as const;
export const SCHOOLS = ['Hill School', 'Park School', 'Lee School'] as const;
export const TOWERS = ['Hawk Lookout', 'Bald Peak', 'Eagle Point'] as const;
export const nameFor = (R: () => number, kind: PlaceKind, used: string[]): string => {
  const pool = kind === 'camp' ? CAMPS : kind === 'school' ? SCHOOLS : kind === 'tower' ? TOWERS : TOWNS;
  const free = pool.filter(n => !used.includes(n));
  const n = free[Math.floor(R() * free.length)] ?? pool[0];
  used.push(n);
  return n;
};

export interface Leg { d: Pt; L: number }
export interface ComposeSpec {
  unit: MapUnit;
  /** the measured route from A; one leg = a straight road */
  legs: Leg[];
  roadKind: RoadKind;
  kinds: [PlaceKind, PlaceKind];
  /** a place at the end of every leg except the last (3 or more named places along the route) */
  midPlaces?: boolean;
  /** an extra place off the route (key items, wrong-endpoint items) */
  extra?: PlaceKind;
  deco?: ('lake' | 'forest' | 'highway' | 'lakeInBend')[];
  bar?: BarSpec;
  verbal?: Verbal;
  zoom?: number;
  /** extra points (relative to A, map units) that must stay on the field, e.g. a ruler's far end */
  reach?: Pt[];
  ov(g: Geo): Overlay[];
}
export interface Geo { A: Pt; B: Pt; route: Pt[]; corners: Pt[]; dirs: Pt[]; C?: Pt; ids: { A: string; B: string; C?: string; mid: string[] }; names: { A: string; B: string; C?: string; mid: string[] } }

const KEY_ORDER: KeyKind[] = ['city', 'town', 'camp', 'school', 'tower', 'highway', 'road', 'trail', 'lake', 'forest'];
export function legsPts(legs: readonly Leg[], start: Pt = [0, 0]): Pt[] {
  const P: Pt[] = [start];
  for (const l of legs) P.push(add(P[P.length - 1]!, l.d, l.L));
  return P;
}
/** a blob outline (map units) around c with radii rx, ry */
export function blob(c: Pt, rx: number, ry: number, seed: number, n = 14): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, w = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.06 * Math.cos(a * 5 + seed * 2);
    return [c[0] + Math.cos(a) * rx * w, c[1] + Math.sin(a) * ry * w] as Pt;
  });
}
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const polyDist = (p: Pt, P: readonly Pt[]) => { let m = Infinity; for (let i = 1; i < P.length; i++) m = Math.min(m, segDist(p, P[i - 1]!, P[i]!)); return P.length === 1 ? dist(p, P[0]!) : m; };

/** compose a map; throws if no placement works (tests run every family over 300 seeds) */
export function compose(R: () => number, s: ComposeSpec): MapPic {
  const u0 = UNIT_PX[s.unit];
  // a short route is drawn bigger (more px per map unit), as long as the scale bar still fits its strip
  const barLen = s.bar ? Math.max(s.bar.n * s.bar.len, s.bar.second ? s.bar.second.n * s.bar.second.len : 0) + (s.bar.leftSub ? s.bar.len : 0) : 0;
  const kBar = barLen ? (STRIP.w - 340) / (barLen * u0) : 9;
  // the 8 symmetries of the square keep every exact length exact
  const syms: [number, number, boolean][] = [[1, 1, false], [-1, 1, false], [1, -1, false], [-1, -1, false], [1, 1, true], [-1, 1, true], [1, -1, true], [-1, -1, true]];
  const start = Math.floor(R() * 8);
  let last: string[] = ['no room for the route'];
  for (let attempt = 0; attempt < 120; attempt++) {
    const [fx, fy, sw] = syms[(start + attempt) % 8]!;
    const T = (p: Pt): Pt => (sw ? [p[1] * fx, p[0] * fy] : [p[0] * fx, p[1] * fy]);
    const legs = s.legs.map(l => ({ d: T(l.d), L: l.L }));
    const rel = legsPts(legs);
    const reach = (s.reach ?? []).map(T);
    // the route keeps a margin for its labels; a ruler may reach almost to the edge of the map
    const bx = (P: Pt[]) => ({ x0: Math.min(...P.map(p => p[0])), x1: Math.max(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), y1: Math.max(...P.map(p => p[1])) });
    const all = bx([...rel, ...reach]), spanX = all.x1 - all.x0, spanY = all.y1 - all.y0;
    const kFit = Math.min(spanX > 0 ? (FIELD.w - 130) / (spanX * u0) : 9, spanY > 0 ? (FIELD.h - 130) / (spanY * u0) : 9);
    const k = s.zoom ? 1 : Math.max(1, Math.min(1.8, kBar, kFit * 0.85) * (1 - 0.06 * Math.floor(attempt / 8)));
    const u = u0 * k, W = FIELD.w / u, H = FIELD.h / u, pad = 44 / u;
    const r0 = bx(rel), e0 = reach.length ? bx(reach) : r0, ep = 0.04;
    const oxLo = Math.max(pad - r0.x0, ep - e0.x0), oxHi = Math.min(W - pad - r0.x1, W - ep - e0.x1);
    const oyLo = Math.max(pad - r0.y0, ep - e0.y0), oyHi = Math.min(H - pad - r0.y1, H - ep - e0.y1);
    if (oxHi < oxLo || oyHi < oyLo) continue;
    const ox = oxLo + R() * (oxHi - oxLo), oy = oyLo + R() * (oyHi - oyLo);
    const route = rel.map(p => [p[0] + ox, p[1] + oy] as Pt);
    const A = route[0]!, B = route[route.length - 1]!;
    const used: string[] = [];
    const ids = { A: 'A', B: 'B', mid: [] as string[] } as Geo['ids'];
    const names = { A: nameFor(R, s.kinds[0], used), B: nameFor(R, s.kinds[1], used), mid: [] as string[] } as Geo['names'];
    const places: Place[] = [{ id: 'A', name: names.A, at: A, kind: s.kinds[0] }, { id: 'B', name: names.B, at: B, kind: s.kinds[1] }];
    if (s.midPlaces) route.slice(1, -1).forEach((p, i) => { const id = 'M' + i, nm = nameFor(R, 'town', used); ids.mid.push(id); names.mid.push(nm); places.push({ id, name: nm, at: p, kind: 'town' }); });
    const roads: Road[] = [{ pts: route, kind: s.roadKind }];
    const areas: Area[] = [];
    const busy: Pt[][] = [route, [A, B]];
    let C: Pt | undefined;
    if (s.extra) {
      for (let t = 0; t < 30 && !C; t++) {
        const p: Pt = [pad + 36 / u + R() * (W - 2 * pad - 72 / u), pad + 36 / u + R() * (H - 2 * pad - 72 / u)];
        if (busy.every(P => polyDist(p, P) > 130 / u) && dist(p, A) > 144 / u && dist(p, B) > 144 / u) C = p;
      }
      if (!C) continue;
      ids.C = 'C'; names.C = nameFor(R, s.extra, used);
      places.push({ id: 'C', name: names.C, at: C, kind: s.extra });
      // a side road to the extra place from the nearest route corner
      const near0 = route.reduce((b, p) => (dist(p, C!) < dist(b, C!) ? p : b), route[0]!);
      const side: Pt[] = [near0, [C[0], near0[1]], C];
      roads.push({ pts: side.filter((p, i) => i === 0 || !near(dist(p, side[i - 1]!), 0)), kind: s.roadKind === 'trail' ? 'trail' : 'road' });
      busy.push(side);
    }
    for (const dk of s.deco ?? []) {
      if (dk === 'lakeInBend' && route.length >= 3) {
        const corner = route[1]!, mid: Pt = [(A[0] + route[2]![0]) / 2, (A[1] + route[2]![1]) / 2];
        const c: Pt = [(corner[0] + 2 * mid[0]) / 3, (corner[1] + 2 * mid[1]) / 3];
        const r = Math.min(polyDist(c, route) - 34 / u * 1.6, 1.1 * 120 / u);
        if (r > 0.35 * 120 / u) { areas.push({ kind: 'lake', pts: blob(c, r, r * 0.72, attempt) }); }
        continue;
      }
      if (dk === 'lake' || dk === 'forest') {
        for (let t = 0; t < 20; t++) {
          const r = (0.55 + R() * 0.35) * 120 / u, c: Pt = [r + 24 / u + R() * (W - 2 * r - 48 / u), r + 24 / u + R() * (H - 2 * r - 48 / u)];
          const clear = busy.every(P => polyDist(c, P) > r * 1.25 + 0.5 * 120 / u) && places.every(p => dist(c, p.at) > r * 1.25 + 1.6 * 120 / u);
          if (!clear) continue;
          const pts = blob(c, r * (dk === 'forest' ? 1.2 : 1), r * 0.75, attempt + t);
          areas.push({ kind: dk as AreaKind, pts }); busy.push([...pts, pts[0]!]);
          break;
        }
      }
      if (dk === 'highway') {
        for (let t = 0; t < 12; t++) {
          const y = 48 / u + R() * (H - 96 / u);
          const line: Pt[] = [[0, y], [W, y]];
          if (busy.every(P => P.every(p => Math.abs(p[1] - y) > 0.9 * 120 / u))) { roads.push({ pts: line, kind: 'highway' }); busy.push(line); break; }
        }
      }
    }
    const kinds = new Set<KeyKind>([...places.map(p => p.kind), ...roads.map(r => r.kind), ...areas.map(a => a.kind)]);
    const key = KEY_ORDER.filter(k => kinds.has(k)).slice(0, 6);
    const g: Geo = { A, B, route, corners: route.slice(1, -1), dirs: legs.map(l => l.d), C, ids, names };
    const m: MapPic = { unit: s.unit, places, roads, areas, key, bar: s.bar, verbal: s.verbal, ov: s.ov(g) };
    if (k > 1.001) m.px = u;
    if (s.zoom) m.zoom = { at: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], to: s.zoom };
    last = mapProblems(m);
    if (last.length === 0) return m;
  }
  throw new Error(`compose: no layout for ${JSON.stringify(s.legs)}: ${last.join('; ')}`);
}

/** a random exact-length direction; `axis` = only the four axis directions */
export const dirOf = (R: () => number, axis = false): Pt => (axis ? DIRS.slice(0, 4) : DIRS)[Math.floor(R() * (axis ? 4 : DIRS.length))]!;
/** a route of legs with turns of 90 degrees (axis directions), lengths given */
export function bentLegs(R: () => number, Ls: readonly number[]): Leg[] {
  const out: Leg[] = [];
  let d = dirOf(R, true);
  for (const L of Ls) {
    out.push({ d, L });
    const turn = R() < 0.5 ? 1 : -1;
    d = [-d[1] * turn, d[0] * turn];
  }
  return out;
}
/** a winding road: alternating axis and diagonal legs that keep a general heading */
export function windingLegs(R: () => number, Ls: readonly number[]): Leg[] {
  const heads: Pt[][] = [[[1, 0], [0.8, 0.6], [0.6, 0.8], [0.8, -0.6]], [[0, 1], [0.6, 0.8], [0.8, 0.6], [-0.6, 0.8]]];
  const H = heads[Math.floor(R() * 2)]!;
  let last = -1;
  return Ls.map(L => { let i = Math.floor(R() * H.length); if (i === last) i = (i + 1) % H.length; last = i; return { d: H[i]!, L }; });
}
/** does a route (plus margin) fit on the field in some orientation? */
export function fits(legs: readonly Leg[], unit: MapUnit, margin = 1): boolean {
  const u = UNIT_PX[unit], W = FIELD.w / u - margin, H = FIELD.h / u - margin, P = legsPts(legs);
  const w = Math.max(...P.map(p => p[0])) - Math.min(...P.map(p => p[0])), h = Math.max(...P.map(p => p[1])) - Math.min(...P.map(p => p[1]));
  return (w <= W && h <= H) || (h <= W && w <= H);
}
export const routeLen = (legs: readonly Leg[]) => legs.reduce((s, l) => s + l.L, 0);
export { polyLen };
