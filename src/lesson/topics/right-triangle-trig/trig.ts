// trig.ts: the exact maths and the figures of "Right triangle trigonometry" (Geometry, lesson 10). Pure: no DOM.
//   numbers     degree trig, rounding that refuses a .x5 tie (an item retries), exact radicals k√2 / k√3, triples
//   triangles   a right triangle from its two legs (C the right angle, A and B acute; side a = BC opposite A,
//               b = AC opposite B, c = AB the hypotenuse), turned and maybe reflected; every labelled length and
//               angle is drawn at its value (one unit per figure)
//   contexts    ladder, kite, flagpole shadow, building (elevation), cliff / lighthouse (depression, the horizontal
//               drawn at the top), a regular polygon with its apothem
// The figure block is the course's GeoFig (geometry-foundations) through similarity's figOf (read-only).
import { type Fig, type GSeg, type MarkCol, type Pt, rotP } from '../geometry-foundations/geo';
import type { FMark } from '../triangle-congruence/tri';
import { type Lab, figOf } from '../similarity/sim';

// ---------- numbers ----------
export const RAD = Math.PI / 180;
export const sinD = (d: number) => Math.sin(d * RAD);
export const cosD = (d: number) => Math.cos(d * RAD);
export const tanD = (d: number) => Math.tan(d * RAD);
export const asinD = (x: number) => Math.asin(x) / RAD;
export const acosD = (x: number) => Math.acos(x) / RAD;
export const atanD = (x: number) => Math.atan(x) / RAD;
/** a gradian-mode calculator: 400 grad in a turn */
export const sinG = (g: number) => Math.sin((g * Math.PI) / 200);
export const fnD: Record<Fn, (d: number) => number> = { sin: sinD, cos: cosD, tan: tanD };
export const fnR: Record<Fn, (r: number) => number> = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
export const invD: Record<Fn, (x: number) => number> = { sin: asinD, cos: acosD, tan: atanD };
export type Fn = 'sin' | 'cos' | 'tan';
export const FNS: Fn[] = ['sin', 'cos', 'tan'];

/** fail an attempt (the item maker retries) */
export function fail(): never { throw new Error('retry'); }
/** x rounded to p places; an attempt whose exact value sits near a .5 tie in the next place is refused */
export function rnd(x: number, p: number): number {
  const m = x * 10 ** p, f = m - Math.floor(m);
  if (Math.abs(f - 0.5) < 0.08) fail();
  return Math.round(m) / 10 ** p;
}
/** rounding for wrong answers and displays (no tie check) */
export const rd = (x: number, p: number) => Math.round(x * 10 ** p) / 10 ** p;
/** a rounded value as printed with exactly p places (64.3, 15.0, 0.6428) */
export const fx = (x: number, p: number) => rd(x, p).toFixed(p);
/** a length as printed: integers plain, else up to 2 decimals */
export function fmt(x: number): string {
  const r = Math.round(x * 100) / 100;
  return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : String(r);
}
export const PLACE: Record<number, string> = { 0: 'the nearest whole number', 1: 'the nearest tenth', 2: 'the nearest hundredth', 3: 'three decimal places', 4: 'four decimal places' };

// ---------- exact radicals: k·√r (r = 1, 2, 3) ----------
export interface Rad { k: number; r: 1 | 2 | 3 }
export const radV = (x: Rad) => x.k * Math.sqrt(x.r);
/** "5√2", "√3", "7", "3.5√3" */
export function radS(x: Rad): string {
  const k = fmt(x.k);
  if (x.r === 1) return k;
  return `${k === '1' ? '' : k}√${x.r}`;
}
export const radT = (x: Rad) => (x.r === 1 ? fmt(x.k) : `${fmt(x.k) === '1' ? '' : fmt(x.k)}\\sqrt{${x.r}}`);

// ---------- Pythagorean triples ----------
export const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
export const isRight = (a: number, b: number, c: number) => Math.abs(a * a + b * b - c * c) < 1e-9;

// ---------- the right triangle ----------
/** letters for a right triangle: [acute A, acute B, right angle C], never I, L, O */
export function letters(R: () => number): string {
  const pool = 'ABCDEFGHJKMNPQRSTUVWXYZ'.split(''), out: string[] = [];
  while (out.length < 3) { const c = pool[Math.floor(R() * pool.length)]!; if (!out.includes(c)) out.push(c); }
  return out.join('');
}
export interface RTSpec {
  /** [A, B, C]: A and B the acute vertices, C the right angle */
  names: string;
  /** leg a = BC (opposite A), leg b = AC (adjacent to A) */
  a: number; b: number;
  rot?: number; flip?: boolean;
  /** side labels: a (BC), b (AC), c (AB); alt = the label after the solve */
  lab?: Partial<Record<'a' | 'b' | 'c', { text: string; alt?: string; col?: MarkCol }>>;
  /** angle marks at A (one arc) and B (two arcs), with an optional label */
  angA?: { text?: string; alt?: string; col?: MarkCol } | null;
  angB?: { text?: string; alt?: string; col?: MarkCol } | null;
  /** no right-angle box (a sketch that must not give the right angle away) */
  noBox?: boolean;
}
/** the right triangle's points (model units, y up): C at the origin, A along +x, B along +y, then turned */
export function rtPts(s: RTSpec): Record<string, Pt> {
  const c = Math.hypot(s.a, s.b), u = 420 / c;
  let P: Pt[] = [[s.b * u, 0], [0, s.a * u], [0, 0]];
  if (s.flip) P = P.map(p => [-p[0], p[1]] as Pt);
  P = P.map(p => rotP(p, s.rot ?? 0));
  return { [s.names[0]!]: P[0]!, [s.names[1]!]: P[1]!, [s.names[2]!]: P[2]! };
}
/** segment ids: a = BC, b = AC, c = AB (as listed in the figure) */
export const sideId = (names: string, k: 'a' | 'b' | 'c') => (k === 'a' ? names[1]! + names[2]! : k === 'b' ? names[0]! + names[2]! : names[0]! + names[1]!);
/** angle ids: the acute angle at A (B-A-C), at B (A-B-C), the right angle (A-C-B) */
export const angAId = (n: string) => n[1]! + n[0]! + n[2]!;
export const angBId = (n: string) => n[0]! + n[1]! + n[2]!;
export function rtFig(s: RTSpec): Fig {
  const n = s.names, P = rtPts(s);
  const segs = [sideId(n, 'a'), sideId(n, 'b'), sideId(n, 'c')];
  const labs: Lab[] = [];
  for (const k of ['a', 'b', 'c'] as const) { const l = s.lab?.[k]; if (l) labs.push({ seg: sideId(n, k), text: l.text, alt: l.alt, col: l.col }); }
  const marks: FMark[] = [];
  if (!s.noBox) marks.push({ ang: n[0]! + n[2]! + n[1]!, box: true });
  if (s.angA) marks.push({ ang: angAId(n), n: 1, text: s.angA.text, col: s.angA.col, r: 64 });
  if (s.angB) marks.push({ ang: angBId(n), n: 2, text: s.angB.text, col: s.angB.col, r: 76 });
  const f = figOf(P, segs, { labs, marks, fills: [n] });
  for (const [id, a] of [[angAId(n), s.angA], [angBId(n), s.angB]] as const) if (a?.alt) { const g = f.angles.find(x => x.id === id); if (g) g.alt = a.alt; }
  return f;
}
/** legs from an acute angle A (degrees) and the hypotenuse c */
export const legsOf = (A: number, c: number) => ({ a: c * sinD(A), b: c * cosD(A) });
/** turns that keep a figure readable; reflections give the mirrored orientations */
export const TURNS = [0, 0, 90, 180, 270, 25, 155, 205, 335, 60, 120];

// ---------- context figures (feet, drawn true) ----------
export interface Ctx { fig: Fig; ids: Record<string, string> }
const W = (at: Pt, text: string): { at: Pt; text: string } => ({ at, text });
/** a right triangle standing on level ground: foot F, corner G (right angle), top T. run = FG, rise = GT */
export function standFig(run: number, rise: number, o: {
  mirror?: boolean; labs?: { run?: Lab['text']; rise?: string; hyp?: string; runAlt?: string; riseAlt?: string; hypAlt?: string };
  angF?: { text: string; alt?: string } | null; angT?: { text: string; alt?: string } | null;
  words?: { run?: string; rise?: string; hyp?: string }; hypDash?: boolean; riseDash?: boolean; wall?: boolean;
}): Ctx {
  const L = Math.hypot(run, rise), u = 420 / Math.max(L, 1), sx = o.mirror ? -1 : 1;
  const F: Pt = [0, 0], G: Pt = [sx * run * u, 0], T: Pt = [sx * run * u, rise * u];
  const P = { F, G, T };
  const labs: Lab[] = [];
  if (o.labs?.run) labs.push({ seg: 'FG', text: o.labs.run, alt: o.labs.runAlt });
  if (o.labs?.rise) labs.push({ seg: 'GT', text: o.labs.rise, alt: o.labs.riseAlt });
  if (o.labs?.hyp) labs.push({ seg: 'FT', text: o.labs.hyp, alt: o.labs.hypAlt });
  const marks: FMark[] = [{ ang: 'FGT', box: true }];
  if (o.angF) marks.push({ ang: 'TFG', n: 1, text: o.angF.text });
  if (o.angT) marks.push({ ang: 'FTG', n: 2, text: o.angT.text });
  const segStyle: Record<string, Partial<GSeg>> = {};
  if (o.hypDash) segStyle.FT = { dash: true };
  if (o.riseDash) segStyle.GT = { dash: true };
  const f = figOf(P, ['FG', 'GT', 'FT'], { labs, marks, fills: ['FGT'], bare: ['F', 'G', 'T'], segStyle });
  for (const [id, a] of [['TFG', o.angF], ['FTG', o.angT]] as const) if (a?.alt) { const g = f.angles.find(x => x.id === id); if (g) g.alt = a.alt; }
  // the ground runs on past both ends; the wall (if any) goes up past the top
  const g0: Pt = [-sx * 70, 0], g1: Pt = [sx * (run * u + 90), 0];
  f.segs.push({ id: 'gr', a: g0, b: g1, col: 'faint' });
  if (o.wall) f.segs.push({ id: 'wl', a: G, b: [G[0], rise * u + 70], col: 'faint' });
  const words = [];
  const midRun: Pt = [sx * run * u * 0.5, 0], midRise: Pt = [G[0], rise * u * 0.5], midHyp: Pt = [sx * run * u * 0.5, rise * u * 0.5];
  if (o.words?.run) words.push(W([midRun[0], -62], o.words.run));
  if (o.words?.rise) words.push(W([G[0] + sx * 150, Math.max(rise * u * 0.85, 60)], o.words.rise));
  if (o.words?.hyp) words.push(W([midHyp[0] - sx * 120, midHyp[1] + 90], o.words.hyp));
  f.words = words;
  void midRise;
  return { fig: f, ids: { run: 'FG', rise: 'GT', hyp: 'FT', angF: 'TFG', angT: 'FTG' } };
}
/** looking down from the top T of a height h onto a point S on the ground d away; the horizontal TH drawn at the top */
export function depressionFig(h: number, d: number, o: { mirror?: boolean; labH?: string; labD?: string; labDAlt?: string; labHAlt?: string; dep?: { text: string }; elev?: { text: string }; what: string; target: string }): Ctx {
  const L = Math.hypot(h, d), u = 420 / L, sx = o.mirror ? -1 : 1;
  const G: Pt = [0, 0], T: Pt = [0, h * u], S: Pt = [sx * d * u, 0], H: Pt = [sx * (d * u + 40), h * u];
  const labs: Lab[] = [];
  if (o.labH) labs.push({ seg: 'GT', text: o.labH, alt: o.labHAlt });
  if (o.labD) labs.push({ seg: 'GS', text: o.labD, alt: o.labDAlt });
  const marks: FMark[] = [{ ang: 'TGS', box: true }];
  if (o.dep) marks.push({ ang: 'HTS', n: 1, text: o.dep.text });
  if (o.elev) marks.push({ ang: 'GST', n: 2, text: o.elev.text });
  const f = figOf({ G, T, S, H }, ['GT', 'GS', 'TS', 'TH'], { labs, marks, fills: ['GTS'], bare: ['G', 'T', 'S', 'H'], segStyle: { TH: { dash: true, col: 'faint' }, TS: { dash: true } } });
  f.segs.push({ id: 'gr', a: [-sx * 70, 0], b: [sx * (d * u + 90), 0], col: 'faint' });
  f.words = [W([-sx * 120, h * u * 0.5], o.what), W([S[0], -62], o.target), W([H[0] - sx * 60, h * u + 56], 'horizontal')];
  return { fig: f, ids: { h: 'GT', d: 'GS', sight: 'TS', dep: 'HTS', elev: 'GST' } };
}

// ---------- regular polygon ----------
/** apothem and radius of a regular n-gon with side s */
export const apothemOf = (n: number, s: number) => s / 2 / tanD(180 / n);
export const radiusOf = (n: number, s: number) => s / 2 / sinD(180 / n);
export const polyArea = (n: number, s: number) => 0.5 * apothemOf(n, s) * n * s;
export const POLY: Record<number, string> = { 3: 'equilateral triangle', 4: 'square', 5: 'regular pentagon', 6: 'regular hexagon', 8: 'regular octagon', 10: 'regular decagon' };
/** the n-gon centred at O with M the midpoint of the bottom side 0-1; labels: side (on side 1-2), apothem OM, radius O1 */
export function polyFig(n: number, s: number, o: { side?: string; apo?: string; apoAlt?: string; rad?: string; radAlt?: string; half?: string; showRad?: boolean }): Fig {
  const u = 380 / radiusOf(n, s), r = radiusOf(n, s) * u, a = apothemOf(n, s) * u;
  const P: Record<string, Pt> = { O: [0, 0], M: [0, -a] };
  for (let i = 0; i < n; i++) { const t = (-90 - 180 / n + (i * 360) / n) * RAD; P[String(i)] = [r * Math.cos(t), r * Math.sin(t)]; }
  // side 0-1 is split at M (the apothem's foot)
  const segs = ['0M', 'M1', ...Array.from({ length: n - 1 }, (_, i) => `${i + 1}${(i + 2) % n}`), 'OM'];
  if (o.showRad) segs.push('O1');
  const labs: Lab[] = [];
  if (o.side) labs.push({ seg: '12', text: o.side });
  if (o.apo) labs.push({ seg: 'OM', text: o.apo, alt: o.apoAlt });
  if (o.rad && o.showRad) labs.push({ seg: 'O1', text: o.rad, alt: o.radAlt });
  const marks: FMark[] = [{ ang: 'OM1', box: true }];
  if (o.half && o.showRad) marks.push({ ang: 'MO1', n: 1, text: o.half });
  const segStyle: Record<string, Partial<GSeg>> = { OM: { side: o.showRad ? -1 : 1 }, O1: { dash: true } };
  return figOf(P, segs, { labs, marks, fills: [], bare: Array.from({ length: n }, (_, i) => String(i)), segStyle, dirs: { O: 90, M: 270 } });
}
