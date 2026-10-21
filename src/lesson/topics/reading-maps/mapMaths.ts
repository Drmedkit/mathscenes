// mapMaths.ts: the exact maths and the layout of a map sheet for "Read a map" (pure: no DOM, no canvas).
//   A map is drawn in MAP UNITS (inches or centimeters on the paper); one map unit is UNIT_PX design px.
//   The sheet: a field (the map itself), a key column on the right, a strip at the bottom (scale bar / verbal scale).
//   layoutMap(spec) places every label (place names, overlay values) so that no label sits on a line, overlaps
//   another label or a symbol, or leaves the field, and returns the problems it could not solve (generators retry).
import { type Box, box } from '../../../core/math';

export type Pt = [number, number];
export type MapUnit = 'in' | 'cm';
export type RealUnit = 'mi' | 'km';
export type Role = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'ink' | 'dim';
export const UNIT_PX: Record<MapUnit, number> = { in: 120, cm: 80 };

// ---------- the sheet (design px, 1920 x 1080 stage) ----------
export const PAPER = box(60, 70, 1180, 1010);
export const FIELD = box(88, 98, 840, 786);
export const KEY = box(860, 98, 1156, 786);
export const STRIP = box(88, 806, 1156, 990);
export const LABEL = 44, NUM = 60;

export const UNIT_WORD: Record<MapUnit | RealUnit, [string, string]> = {
  in: ['inch', 'inches'], cm: ['centimeter', 'centimeters'], mi: ['mile', 'miles'], km: ['kilometer', 'kilometers'],
};
export const unitWord = (u: MapUnit | RealUnit, v: number) => UNIT_WORD[u][v === 1 ? 0 : 1];

// ---------- exact quarter numbers ----------
/** v as a whole number and a fraction with denominator 2, 4, 8 or 16 */
export function parts(v: number): { w: number; n: number; d: number } {
  const neg = v < 0, a = Math.abs(v);
  for (const d of [1, 2, 4, 8, 16, 32]) {
    const t = a * d;
    if (Math.abs(t - Math.round(t)) < 1e-9) {
      const T = Math.round(t), w = Math.floor(T / d), n = T - w * d;
      return { w: neg ? -w : w, n, d };
    }
  }
  return { w: Math.round(a * 1000) / 1000, n: 0, d: 1 };
}
const UNI: Record<string, string> = { '1/2': '½', '1/4': '¼', '3/4': '¾', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞' };
/** canvas text: 2¾, ½, 3 */
export function fx(v: number): string {
  const { w, n, d } = parts(v);
  if (!n) return String(w);
  const f = UNI[`${n}/${d}`] ?? `${n}/${d}`;
  return w ? `${w}${f}` : f;
}
/** TeX: 2\tfrac{3}{4} */
export function ft(v: number): string {
  const { w, n, d } = parts(v);
  if (!n) return String(w);
  return `${w || ''}\\tfrac{${n}}{${d}}`;
}
/** HTML (the runtime's stacked fraction) */
export function fh(v: number): string {
  const { w, n, d } = parts(v);
  if (!n) return String(w);
  const f = `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
  return w ? `${w}&#8202;${f}` : f;
}
/** plain text for choices and logs: 2 3/4 */
export function fp(v: number): string {
  const { w, n, d } = parts(v);
  if (!n) return String(w);
  return w ? `${w} ${n}/${d}` : `${n}/${d}`;
}
export const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// ---------- geometry in map units ----------
export const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export function polyLen(P: readonly Pt[]): number { let s = 0; for (let i = 1; i < P.length; i++) s += dist(P[i - 1]!, P[i]!); return s; }
/** the point at arc length s along P, and the unit direction there */
export function along(P: readonly Pt[], s: number): { p: Pt; d: Pt } {
  let acc = 0;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, b = P[i]!, L = dist(a, b);
    if (acc + L >= s - 1e-9 || i === P.length - 1) {
      const f = L ? Math.max(0, Math.min(1, (s - acc) / L)) : 0;
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], d: L ? [(b[0] - a[0]) / L, (b[1] - a[1]) / L] : [1, 0] };
    }
    acc += L;
  }
  return { p: P[0]!, d: [1, 0] };
}
/** the part of P between arc lengths s0 and s1 */
export function slice(P: readonly Pt[], s0: number, s1: number): Pt[] {
  const out: Pt[] = [along(P, s0).p];
  let acc = 0;
  for (let i = 1; i < P.length; i++) {
    acc += dist(P[i - 1]!, P[i]!);
    if (acc > s0 + 1e-9 && acc < s1 - 1e-9) out.push(P[i]!);
  }
  out.push(along(P, s1).p);
  return out;
}
/** exact-length directions: the axes and the 3-4-5 diagonals (a length L along any of them is exactly L) */
export const DIRS: readonly Pt[] = [[1, 0], [0, 1], [-1, 0], [0, -1], [0.6, 0.8], [0.8, 0.6], [-0.6, 0.8], [-0.8, 0.6], [0.6, -0.8], [0.8, -0.6], [-0.6, -0.8], [-0.8, -0.6]];
export const add = (a: Pt, d: Pt, L: number): Pt => [a[0] + d[0] * L, a[1] + d[1] * L];

// ---------- the map spec ----------
export type PlaceKind = 'city' | 'town' | 'camp' | 'school' | 'tower';
export type RoadKind = 'highway' | 'road' | 'trail';
export type AreaKind = 'lake' | 'forest';
export type KeyKind = PlaceKind | RoadKind | AreaKind;
export const KEY_NAME: Record<KeyKind, string> = {
  city: 'City', town: 'Town', camp: 'Camp', school: 'School', tower: 'Lookout', highway: 'Highway', road: 'Road', trail: 'Trail', lake: 'Lake', forest: 'Forest',
};
export const SYMBOL_R: Record<PlaceKind, number> = { city: 19, town: 13, camp: 19, school: 15, tower: 16 };
export const ROAD_W: Record<RoadKind, number> = { highway: 18, road: 11, trail: 5 };
export interface Place { id: string; name: string; at: Pt; kind: PlaceKind }
export interface Road { pts: Pt[]; kind: RoadKind }
export interface Area { pts: Pt[]; kind: AreaKind }
export interface BarSpec {
  /** real distance per labeled interval */ step: number;
  /** map units per interval */ len: number;
  /** intervals right of 0 */ n: number;
  real: RealUnit;
  /** subdivision ticks inside each interval (2 = halves, 4 = quarters) */ sub?: number;
  /** a divided section left of 0 (one interval, subdivided) */ leftSub?: number;
  /** which marks carry a number (default all) */ labels?: number[];
  /** drawn big in the field instead of in the strip */ big?: boolean;
  /** a second bar under the first (a dual mi / km bar) */ second?: { step: number; len: number; n: number; real: RealUnit };
}
export interface Verbal { per: number; real: RealUnit }
export type Target = { place: string } | { key: KeyKind } | { mark: number } | { span: [number, number] } | { pt: Pt; r: number } | { seg: [Pt, Pt] };
export type Overlay = { id: string } & (
  | { k: 'route'; pts: Pt[]; col?: Role }
  | { k: 'straight'; a: Pt; b: Pt; col?: Role }
  | { k: 'copies'; pts: Pt[]; len: number; sub?: number }
  | { k: 'ruler'; a: Pt; dir: Pt; start: number; len: number; side?: 1 | -1; sub?: number; mark?: number; markId?: string }
  | { k: 'leg'; a: Pt; b: Pt; text: string; col: Role }
  | { k: 'tag'; at: Pt; text: string; col: Role; r?: number }
  | { k: 'ring'; t: Target; col: Role }
  | { k: 'brace'; a: Pt; b: Pt; text: string; col: Role; side?: 1 | -1 }
  | { k: 'strip'; from: number; to: number }
);
export interface MapPic {
  unit: MapUnit;
  /** px per map unit for this picture (default UNIT_PX): small maps are drawn bigger */
  px?: number;
  places: Place[];
  roads: Road[];
  areas: Area[];
  key: KeyKind[];
  bar?: BarSpec;
  verbal?: Verbal;
  /** enlarge the map about `at` (map units) by `to` (focus 0..1 drives it) */
  zoom?: { at: Pt; to: number };
  ov: Overlay[];
}

// ---------- px ----------
export const U = (m: MapPic) => m.px ?? UNIT_PX[m.unit];
export function toPx(m: MapPic, p: Pt, z = 1): Pt {
  const u = U(m);
  if (m.zoom && z !== 1) {
    const c = m.zoom.at;
    return [FIELD.x0 + (c[0] + (p[0] - c[0]) * z) * u, FIELD.y0 + (c[1] + (p[1] - c[1]) * z) * u];
  }
  return [FIELD.x0 + p[0] * u, FIELD.y0 + p[1] * u];
}
export const fieldUnits = (u: MapUnit) => ({ w: FIELD.w / UNIT_PX[u], h: FIELD.h / UNIT_PX[u] });

/** label width estimate (Segoe UI semibold), the same in the browser and in tests, a little generous */
export function textW(s: string, size: number): number {
  let w = 0;
  for (const ch of s) {
    w += /[il1.,'|:;!]/.test(ch) ? 0.3 : ch === ' ' ? 0.29 : /[mwMW]/.test(ch) ? 0.86 : /[A-Z]/.test(ch) ? 0.67
      : /[0-9]/.test(ch) ? 0.58 : /[¼½¾⅛⅜⅝⅞]/.test(ch) ? 0.9 : /[ft]/.test(ch) ? 0.38 : /[r]/.test(ch) ? 0.4 : 0.56;
  }
  return w * size;
}
export const textBox = (s: string, cx: number, cy: number, size: number): Box => { const w = textW(s, size); return box(cx - w / 2, cy - size * 0.45, cx + w / 2, cy + size * 0.45); };

// ---------- the scale bar ----------
export interface BarMark { i: number; x: number; text: string | null; box: Box | null }
export interface BarGeom { x0: number; ipx: number; top: number; h: number; labelY: number; left: number; right: number; marks: BarMark[]; unit: { text: string; box: Box }; body: Box; second?: BarGeom }
function oneBar(b: { step: number; len: number; n: number; real: RealUnit; leftSub?: number; labels?: number[] }, u: number, left: number, top: number, h: number, labelY: number): BarGeom {
  const ipx = b.len * u, x0 = left + (b.leftSub ? ipx : 0), right = x0 + b.n * ipx;
  const show = new Set(b.labels ?? Array.from({ length: b.n + 1 }, (_, i) => i));
  const marks: BarMark[] = [];
  if (b.leftSub) marks.push({ i: -1, x: left, text: fx(b.step), box: textBox(fx(b.step), left, labelY, NUM) });
  for (let i = 0; i <= b.n; i++) {
    const x = x0 + i * ipx, t = show.has(i) ? fx(i * b.step) : null;
    marks.push({ i, x, text: t, box: t === null ? null : textBox(t, x, labelY, NUM) });
  }
  const last = [...marks].reverse().find(m => m.box)!;
  const uw = b.real === 'mi' ? 'miles' : 'km';
  const ux0 = Math.max(right + 22, (last.box?.x1 ?? right) + 22), uwW = textW(uw, LABEL);
  return { x0, ipx, top, h, labelY, left, right, marks, unit: { text: uw, box: box(ux0, labelY - LABEL * 0.45, ux0 + uwW, labelY + LABEL * 0.45) }, body: box(left, top, right, top + h) };
}
export function barGeom(m: MapPic): BarGeom | null {
  const b = m.bar;
  if (!b) return null;
  const u = U(m);
  if (b.big) {
    const tot = (b.n + (b.leftSub ? 1 : 0)) * b.len * u, uw = textW(b.real === 'mi' ? 'miles' : 'km', LABEL) + 22;
    const left = Math.round(FIELD.x0 + Math.max(80, (FIELD.w - tot - uw) / 2)), top = FIELD.y0 + 300;
    return oneBar(b, u, left, top, 38, top - 52);
  }
  const g = oneBar(b, u, STRIP.x0 + 50, 866, 24, 836);
  if (b.second) g.second = oneBar({ ...b.second }, u, STRIP.x0 + 50, 902, 22, 958);
  return g;
}
/** the 0 mark of a big bar, bottom edge, in map units (rulers and strips are laid from here) */
export function bigBarOrigin(m: MapPic): Pt {
  const g = barGeom(m)!, u = U(m);
  return [(g.x0 - FIELD.x0) / u, (g.top + g.h - FIELD.y0) / u];
}

// ---------- the ruler ----------
export const RULER_W = 92;
/** the ruler as a polygon (px): measuring edge on the line through a, body on the side `side` */
export function rulerPoly(m: MapPic, o: Extract<Overlay, { k: 'ruler' }>): { P: Pt[]; at: (r: number) => Pt; n: Pt; ang: number } {
  const u = U(m), A = toPx(m, o.a), d = o.dir;
  let n: Pt = [-d[1], d[0]];
  if ((o.side ?? 1) * (n[1] !== 0 ? Math.sign(n[1]) : Math.sign(n[0])) < 0) n = [-n[0], -n[1]];
  const at = (r: number): Pt => [A[0] + d[0] * (r - o.start) * u, A[1] + d[1] * (r - o.start) * u];
  const s0 = at(-0.3), s1 = at(o.len + 0.3);
  const P: Pt[] = [s0, s1, [s1[0] + n[0] * RULER_W, s1[1] + n[1] * RULER_W], [s0[0] + n[0] * RULER_W, s0[1] + n[1] * RULER_W]];
  return { P, at, n, ang: Math.atan2(d[1], d[0]) };
}

// ---------- layout ----------
const inside = (b: Box, F: Box, pad = 0) => b.x0 >= F.x0 + pad && b.x1 <= F.x1 - pad && b.y0 >= F.y0 + pad && b.y1 <= F.y1 - pad;
const overlap = (a: Box, b: Box, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
function hits(b: Box, lines: readonly (readonly Pt[])[], pad: number): boolean {
  const x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  for (const P of lines) for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, c = P[i]!, n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 4));
    for (let j = 0; j <= n; j++) { const x = a[0] + ((c[0] - a[0]) * j) / n, y = a[1] + ((c[1] - a[1]) * j) / n; if (x > x0 && x < x1 && y > y0 && y < y1) return true; }
  }
  return false;
}
function inPoly(p: Pt, P: readonly Pt[]): boolean {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i]!, b = P[j]!;
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
const boxHitsPoly = (b: Box, P: readonly Pt[], pad: number) => hits(b, [[...P, P[0]!]], pad) || inPoly([b.cx, b.cy], P);
export const pxPts = (m: MapPic, P: readonly Pt[], z = 1) => P.map(p => toPx(m, p, z));

export interface MapLayout {
  placeLabel: Record<string, Box>;
  /** label boxes of overlays (leg, tag, brace) by overlay index */
  ovLabel: Record<number, Box>;
  /** brace side per overlay index */
  ovSide: Record<number, 1 | -1>;
  rulerSide: Record<number, 1 | -1>;
  problems: string[];
}
export function symbolBox(m: MapPic, p: Place, z = 1): Box { const [x, y] = toPx(m, p.at, z), r = SYMBOL_R[p.kind]; return box(x - r, y - r, x + r, y + r); }

export function layoutMap(m: MapPic): MapLayout {
  const problems: string[] = [];
  const zs = m.zoom ? [1, m.zoom.to] : [1];
  const L: MapLayout = { placeLabel: {}, ovLabel: {}, ovSide: {}, rulerSide: {}, problems };
  // ----- geometry every label must avoid (px, at zoom 1) -----
  const lines: Pt[][] = [], polys: Pt[][] = [], taken: Box[] = [];
  for (const r of m.roads) lines.push(pxPts(m, r.pts));
  for (const a of m.areas) lines.push([...pxPts(m, a.pts), toPx(m, a.pts[0]!)]);
  for (const p of m.places) { const b = symbolBox(m, p); taken.push(b); if (!inside(b, FIELD, 4)) problems.push(`symbol ${p.name} leaves the map`); }
  m.ov.forEach((o, i) => {
    if (o.k === 'route' || o.k === 'copies') { const P = pxPts(m, o.pts); lines.push(P); if (P.some(q => q[0] < FIELD.x0 || q[0] > FIELD.x1 || q[1] < FIELD.y0 || q[1] > FIELD.y1)) problems.push(`${o.k} leaves the map`); }
    if (o.k === 'straight') lines.push(pxPts(m, [o.a, o.b]));
    if (o.k === 'ruler') {
      // pick the side that stays on the map and crosses the fewest symbols
      const sides: (1 | -1)[] = o.side ? [o.side] : [1, -1];
      let best: { s: 1 | -1; P: Pt[]; bad: number } | null = null;
      for (const s of sides) {
        const R = rulerPoly(m, { ...o, side: s }), xs = R.P.map(q => q[0]), ys = R.P.map(q => q[1]);
        const out = Math.min(...xs) < FIELD.x0 - 1 || Math.max(...xs) > FIELD.x1 + 1 || Math.min(...ys) < FIELD.y0 - 1 || Math.max(...ys) > FIELD.y1 + 1;
        const bad = (out ? 100 : 0) + m.places.filter(p => boxHitsPoly(symbolBox(m, p), R.P, 2)).length;
        if (!best || bad < best.bad) best = { s, P: R.P, bad };
      }
      L.rulerSide[i] = best!.s; polys.push(best!.P);
      if (best!.bad >= 100) problems.push('ruler leaves the map');
    }
  });
  const g = barGeom(m);
  if (g) {
    const all = [g, ...(g.second ? [g.second] : [])], frameBox = m.bar!.big ? FIELD : STRIP;
    for (const G of all) {
      const bx = G.marks.filter(k => k.box).map(k => k.box!);
      for (let i = 1; i < bx.length; i++) if (overlap(bx[i - 1]!, bx[i]!, 8)) problems.push('scale bar numbers touch');
      if (!inside(G.unit.box, frameBox) || bx.some(b => !inside(b, frameBox))) problems.push('scale bar leaves its strip');
    }
    if (m.bar!.big) for (const G of all) taken.push(G.body, G.unit.box, ...G.marks.filter(k => k.box).map(k => k.box!));
  }
  if (m.verbal && g && !m.bar!.big) problems.push('verbal scale and bar both in the strip');
  const free = (b: Box, zFree = true): boolean => {
    if (!inside(b, FIELD, 6)) return false;
    if (taken.some(t => overlap(t, b, 8))) return false;
    if (hits(b, lines, 9)) return false;
    if (polys.some(P => boxHitsPoly(b, P, 6))) return false;
    if (zFree && m.zoom) {
      // the label follows its symbol when the map is enlarged: it must stay on the map there too
      return true;
    }
    return true;
  };
  // ----- place labels -----
  for (const p of m.places) {
    const [x, y] = toPx(m, p.at), r = SYMBOL_R[p.kind], w = textW(p.name, LABEL), hh = LABEL * 0.45;
    const cands: Pt[] = [[x + r + 12 + w / 2, y], [x + r * 0.6 + 8 + w / 2, y + r + 8 + hh], [x + r * 0.6 + 8 + w / 2, y - r - 8 - hh],
      [x - r - 12 - w / 2, y], [x - r * 0.6 - 8 - w / 2, y + r + 8 + hh], [x - r * 0.6 - 8 - w / 2, y - r - 8 - hh], [x, y + r + 10 + hh], [x, y - r - 10 - hh]];
    let got: Box | null = null;
    for (const [cx, cy] of cands) {
      const b = textBox(p.name, cx, cy, LABEL);
      if (!free(b)) continue;
      if (m.zoom && !zs.every(z => { const [zx, zy] = toPx(m, p.at, z); const bz = box(b.x0 + zx - x, b.y0 + zy - y, b.x1 + zx - x, b.y1 + zy - y); return inside(bz, FIELD, 4); })) continue;
      got = b; break;
    }
    if (!got) { problems.push(`no room for the label ${p.name}`); got = textBox(p.name, x + r + 12 + w / 2, y, LABEL); }
    L.placeLabel[p.id] = got; taken.push(got);
  }
  // ----- overlay labels -----
  m.ov.forEach((o, i) => {
    if (o.k === 'leg' || o.k === 'brace') {
      const A = toPx(m, o.a), B = toPx(m, o.b), len = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1;
      const d: Pt = [(B[0] - A[0]) / len, (B[1] - A[1]) / len], n: Pt = [-d[1], d[0]];
      const w = textW(o.text, NUM), h = NUM * 0.9;
      const ext = Math.abs(n[0]) * w / 2 + Math.abs(n[1]) * h / 2 + (o.k === 'brace' ? 44 : 22);
      const sides: (1 | -1)[] = o.k === 'brace' && o.side ? [o.side] : [1, -1];
      let got: Box | null = null;
      outer: for (const more of [0, 34, 70]) for (const t of o.k === 'brace' ? [0.5] : [0.5, 0.38, 0.62, 0.28, 0.72]) for (const s of sides) {
        const e = ext + more;
        const c: Pt = [A[0] + (B[0] - A[0]) * t + n[0] * s * e, A[1] + (B[1] - A[1]) * t + n[1] * s * e];
        const b = textBox(o.text, c[0], c[1], NUM);
        if (free(b)) { got = b; L.ovSide[i] = s; break outer; }
      }
      if (!got) { problems.push(`no room for the value ${o.text}`); got = textBox(o.text, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, NUM); L.ovSide[i] = 1; }
      L.ovLabel[i] = got; taken.push(got);
      if (o.k === 'brace') { const s = L.ovSide[i]!; lines.push([[A[0] + n[0] * s * 14, A[1] + n[1] * s * 14], [B[0] + n[0] * s * 14, B[1] + n[1] * s * 14]]); }
    }
    if (o.k === 'tag') {
      const [x, y] = toPx(m, o.at), r = o.r ?? 16, w = textW(o.text, NUM), hh = NUM * 0.45;
      const cands: Pt[] = [[x + r + 14 + w / 2, y], [x - r - 14 - w / 2, y], [x, y - r - 12 - hh], [x, y + r + 12 + hh],
        [x + r + 8 + w / 2, y - r - hh], [x + r + 8 + w / 2, y + r + hh], [x - r - 8 - w / 2, y - r - hh], [x - r - 8 - w / 2, y + r + hh]];
      let got: Box | null = null;
      for (const [cx, cy] of cands) { const b = textBox(o.text, cx, cy, NUM); if (free(b)) { got = b; break; } }
      if (!got) { problems.push(`no room for the value ${o.text}`); got = textBox(o.text, x + r + 14 + w / 2, y, NUM); }
      L.ovLabel[i] = got; taken.push(got);
    }
  });
  return L;
}
export const mapProblems = (m: MapPic): string[] => layoutMap(m).problems;

// ---------- the number line (tolerance items) ----------
export interface LineMark { v: number; name: string; col: Role }
export interface LinePic { from: number; to: number; marks: LineMark[]; tol?: number; ask: 'none' | 'gap'; real: RealUnit }
export const LINE_BOX = box(110, 300, 1130, 820);
export function lineGeom(L: LinePic): { x: (v: number) => number; y: number; half: number } {
  const x0 = LINE_BOX.x0 + 50, x1 = LINE_BOX.x1 - 50, span = L.to - L.from;
  return { x: v => x0 + ((v - L.from) / span) * (x1 - x0), y: LINE_BOX.y0 + 300, half: (x1 - x0) / (span * 2) };
}
export function lineProblems(L: LinePic): string[] {
  const out: string[] = [], g = lineGeom(L);
  if (g.half < 30) out.push('half-mile ticks too close');
  for (let v = Math.ceil(L.from); v <= L.to; v++) { const b = textBox(String(v), g.x(v), 0, NUM); const nb = textBox(String(v + 1), g.x(v + 1), 0, NUM); if (v < L.to && overlap(b, nb, 6)) out.push('numbers touch'); }
  const nb = L.marks.map(k => textBox(k.name, g.x(k.v), 0, LABEL));
  if (nb.length === 2 && overlap(nb[0]!, nb[1]!, 10) && Math.abs(L.marks[0]!.v - L.marks[1]!.v) < 1e-9) out.push('same value');
  for (const k of L.marks) { const b = textBox(k.name, g.x(k.v), 0, LABEL); if (b.x0 < LINE_BOX.x0 || b.x1 > LINE_BOX.x1) out.push('mark name leaves the card'); }
  return out;
}
