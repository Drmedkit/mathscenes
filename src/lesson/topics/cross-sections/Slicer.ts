// Slicer: a solid (box or right rectangular pyramid) drawn as a see-through glass block, a slicing plane as a teal
// sheet, and the cross-section where they meet (lime). The model of THE idea of the topic: a cross-section is the
// flat region the plane shares with the solid, and it is traced face by face (one side per face crossed).
//   solid   the glass solid fades in (hidden edges dashed)          dims    its edge lengths (amber words)
//   plane   the sheet slides in along its normal                    points  marked points on the edges (letters)
//   trace   the section's sides draw on one by one; the face each side lies in glows while it draws
//   fill    the section fills                                       open    the cut-off piece slides away (a ghost)
//   flat    the section flies to the board and lies flat (true shape: drawFlat, after the slate)
//   sides   its side lengths appear on the flat sketch
// Colour roles: first (amber) = the solid and its edges' lengths, second (teal) = the plane, link (lime) = the
// section, pick (lavender) = the face being traced / a face in focus. Geometry is exact (sliceMaths.ts); the block
// lays itself out inside a Frame and throws BlockError when it cannot be read.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, drawOn, fillPts, strokePts, dot as disc, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, mix, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import {
  type Cam, type Face, type FaceName, type Plane, type Pose, type SolidSpec, type V3, add, camBasis, centroidOf, dot, edgesOf, isNice,
  lenWords, mul, pieceOf, planeFrame, poseFn, proj, sectionOfFaces, sheetOf, shifted, solidFaces, solidVerts, stayingSide, sub, to2, unit,
} from './sliceMaths';

export type Dim = 'l' | 'w' | 'h';
export interface Mark { name: string; at: V3 }
export interface SlicerParams {
  solid: SolidSpec;
  pose?: Pose;
  cam?: Cam;
  /** unit word for lengths ("in", "ft") */ unit: string;
  /** slicing planes in the solid's own (local) coordinates; the first one is the main one */ planes: Plane[];
  /** names written next to the sheets ("A", "B") */ planeNames?: string[];
  dims?: Dim[];
  points?: Mark[];
  /** keep room for the cut-off piece to slide away */ open?: boolean;
  /** where the true-shape sketch of the main section lies (usually on the board) */ flat?: Box;
  /** which sides of the sketch get a length: those along an edge direction ('auto'), or none */ sideLabels?: 'auto' | 'none';
  /** a sheet a little larger than the solid (share of its size) */ pad?: number;
  /** fit the drawing to this many px per unit at most */ maxScale?: number;
  /** extra planes whose sheets the fit keeps room for (so two blocks of one solid share a layout) */ fitExtra?: Plane[];
  /** reuse another block's layout (scale and offset) instead of fitting */ view?: SlicerView;
}
export interface SlicerView { scale: number; ox: number; oy: number }
export type SlicerStep = 'solid' | 'dims' | 'plane' | 'points' | 'trace' | 'fill' | 'open' | 'flat' | 'sides';
export const SLICER_STEPS: readonly SlicerStep[] = ['solid', 'dims', 'plane', 'points', 'trace', 'fill', 'open', 'flat', 'sides'];
export interface SlicerFocus {
  /** a face glows (lavender) */ face?: FaceName | null; faceK?: number;
  /** a dimension label pulses */ dim?: Dim | null; dimK?: number;
  /** the main plane slides along its normal by this many units; the section follows, live */ shift?: number;
  /** fade the sheets out (0..1) once the section is what matters */ sheetFade?: number;
  /** a ring round the section (0..1) */ ring?: number;
}
export interface SlicerBlock {
  readonly kind: 'Slicer';
  readonly box: Box;
  readonly scale: number;
  readonly view: SlicerView;
  readonly where: {
    solid: Box;
    /** the section of plane i, on screen (live: follows `shift`) */ section(i?: number, shift?: number): Box;
    /** a small box round the section's corner nearest the board (where a leader lands) */ sectionTip(i?: number, shift?: number): Box;
    dim(d: Dim): Box | null;
    flat: Box | null;
    point(name: string): Box | null;
    /** the lowest screen point of the solid */ bottom: number;
    /** the highest screen point of what the solid rests on (a face or an edge on the floor), or null (on a point) */ rest: number | null;
  };
  /** the screen points of the main section (for tests / leaders) */
  sectionPts(shift?: number): Pt[];
  draw(c: Canvas, p: Progress<SlicerStep>, f?: SlicerFocus): void;
  /** the flying / flat section and its side lengths: call after the slate is drawn */
  drawFlat(c: Canvas, p: Progress<SlicerStep>, f?: SlicerFocus): void;
}

const NAME = 'Slicer';
const LABEL = 48, MARK = 50;
const LIGHT = unit([-0.45, -0.55, 1]);

export function Slicer(p: SlicerParams, fr: Frame, th: Theme): SlicerBlock {
  const S = p.solid, pose = p.pose ?? 'upright', cam = p.cam ?? { az: 32, el: 24 };
  check(S.l > 0 && S.w > 0 && S.h > 0, NAME, 'the solid needs a positive length, width and height');
  const B = camBasis(cam);
  const W = poseFn(S, pose);
  const faces = solidFaces(S);
  const wN = (n: V3): V3 => unit(sub(W(n), W([0, 0, 0])));       // a local direction in the world
  const faceFront = (f: Face) => dot(wN(f.n), B.C) > 1e-6;
  const planes = p.planes;
  const pad = p.pad ?? 0.12;

  // ---- the moving piece (open) ----
  const P0 = planes[0];
  const stay = P0 ? stayingSide(S, P0) : 1;
  const sizeU = Math.max(S.l, S.w, S.h);
  const gapU = 0.32 * sizeU;
  const moveDir = P0 ? wN(mul(P0.n, -stay)) : ([0, 0, 0] as V3);

  // ---- fit: everything that will be drawn, at scale 1 ----
  const world: V3[] = solidVerts(S).map(W);
  for (const P of [...planes, ...(p.fitExtra ?? [])]) world.push(...sheetOf(S, P, pad).map(W));
  if (p.open && P0) for (const v of solidVerts(S)) world.push(add(W(v), mul(moveDir, gapU)));
  const s1 = world.map(v => proj(v, B));
  const bx0 = Math.min(...s1.map(q => q[0])), bx1 = Math.max(...s1.map(q => q[0]));
  const by0 = Math.min(...s1.map(q => q[1])), by1 = Math.max(...s1.map(q => q[1]));
  const MX = 84, MY = 80;
  const scale = p.view?.scale ?? Math.min((fr.w - 2 * MX) / (bx1 - bx0), (fr.h - 2 * MY) / (by1 - by0), p.maxScale ?? 150);
  check(scale > 30, NAME, `the solid would be drawn at ${Math.round(scale)} px per unit: too small to read`);
  const ox = p.view?.ox ?? fr.x + fr.w / 2 - scale * (bx0 + bx1) / 2, oy = p.view?.oy ?? fr.y + fr.h / 2 - scale * (by0 + by1) / 2;
  const S2 = (v: V3): Pt => { const q = proj(v, B); return [ox + scale * q[0], oy + scale * q[1]]; };
  const L2 = (v: V3): Pt => S2(W(v));                                  // local -> screen

  const solidPts = solidVerts(S).map(L2);
  const solidBox = boxOf(solidPts);
  const cen = centroidOf(solidVerts(S));
  const cenS = L2(cen);
  const hull = convexHull(solidPts);
  const edges = edgesOf(faces);
  const edgeLines: Pt[][] = edges.map(e => [L2(e.a), L2(e.b)]);
  const sheets = [...planes, ...(p.fitExtra ?? [])].map(P => sheetOf(S, P, pad));
  const sheetLines: Pt[][] = sheets.map(sh => sh.map(L2));

  // ---- section of a plane (live) ----
  const secCache = new Map<string, ReturnType<typeof sectionOfFaces>>();
  function sec(i: number, sh = 0) {
    const key = `${i}:${sh.toFixed(4)}`;
    let r = secCache.get(key);
    if (!r) { r = sectionOfFaces(faces, shifted(planes[i]!, sh)); if (secCache.size > 200) secCache.clear(); secCache.set(key, r); }
    return r;
  }

  // ---- labels: dims and marked points, placed outside the solid, never on a line ----
  const placed: Box[] = [];
  // the cut-off piece at its lifted place: labels keep clear of it too
  const liftOff = mul(moveDir, gapU);
  const liftEdges: Pt[][] = p.open && P0 ? edgesOf(pieceOf(faces, P0, (-stay) as 1 | -1)).map(e => [S2(add(W(e.a), liftOff)), S2(add(W(e.b), liftOff))]) : [];
  const liftHull = liftEdges.length ? convexHull(liftEdges.flat()) : null;
  const solidLines = [...edgeLines, ...liftEdges];
  const blockers = [...solidLines, ...sheetLines.map(l => [...l, l[0]!])];
  function insideHull(b: Box): boolean {
    const corners: Pt[] = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1], [b.cx, b.cy]];
    return corners.some(q => pointIn(q, hull) || (liftHull !== null && pointIn(q, liftHull)));
  }
  /** pass 0: off every line; pass 1: off the solid's edges (a label may sit on the translucent sheet) */
  function okBox(b: Box, pass = 0): boolean {
    if (b.x0 < fr.x - 30 || b.x1 > fr.x + fr.w + 150 || b.y0 < fr.y - 20 || b.y1 > fr.y + fr.h + 20) return false;
    if (insideHull(b) || hitsLines(b, pass === 0 ? blockers : solidLines, 8)) return false;
    return !placed.some(q => q.x0 < b.x1 + 10 && b.x0 < q.x1 + 10 && q.y0 < b.y1 + 8 && b.y0 < q.y1 + 8);
  }
  interface DimLabel { d: Dim; text: string; x: number; y: number; box: Box; edge: [Pt, Pt] }
  const dimLabels: DimLabel[] = [];
  const dimVal: Record<Dim, number> = { l: S.l, w: S.w, h: S.h };
  for (const d of p.dims ?? []) {
    const text = lenWords(dimVal[d], p.unit);
    const axis = d === 'l' ? 0 : d === 'w' ? 1 : 2;
    let cands = edges.filter(e => {
      const v = sub(e.b, e.a);
      const along = Math.abs(v[axis]) > 1e-6 && [0, 1, 2].every(k => k === axis || Math.abs(v[k]!) < 1e-6);
      return along;
    });
    let isAltitude = false;
    if (!cands.length && d === 'h' && S.kind === 'pyramid') { isAltitude = true; cands = [{ a: [S.l / 2, S.w / 2, 0], b: [S.l / 2, S.w / 2, S.h], faces: ['base', 'base'] }]; }
    const vis = (e: (typeof edges)[number]) => faces.filter(f => e.faces.includes(f.name)).some(faceFront);
    const scored = cands.map(e => {
      const a = L2(e.a), b = L2(e.b), m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return { e, a, b, m, score: (vis(e) ? 0 : 1000) + (d === 'h' ? -m[0] : -m[1]) };
    }).sort((x, y) => x.score - y.score);
    let best: DimLabel | null = null;
    // beside an edge, outside the solid: the middle first, then slid along the edge, then further out
    for (const pass of [0, 1]) for (const c of scored) for (const at of [0.5, 0.36, 0.64, 0.26, 0.74]) for (const sgn of [1, -1]) for (const gap of [26, 44, 70]) {
      if (best) break;
      const dx = c.b[0] - c.a[0], dy = c.b[1] - c.a[1], L = Math.hypot(dx, dy) || 1;
      const m: Pt = [c.a[0] + dx * at, c.a[1] + dy * at];
      let nx = -dy / L, ny = dx / L;
      if ((nx * (c.m[0] - cenS[0]) + ny * (c.m[1] - cenS[1])) * sgn < 0) { nx = -nx; ny = -ny; }
      const b0 = wordsBox(text, 0, 0, { size: LABEL, align: 'center' });
      const ext = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2;
      const x = m[0] + nx * (gap + ext), y = m[1] + ny * (gap + ext);
      const bx = wordsBox(text, x, y, { size: LABEL, align: 'center' });
      if (okBox(bx, pass) || isAltitude) best = { d, text, x, y, box: bx, edge: [c.a, c.b] };
    }
    check(best !== null, NAME, `no readable place for the label "${text}"`);
    placed.push(best.box);
    dimLabels.push(best);
  }
  interface MarkLabel { name: string; at: Pt; x: number; y: number; box: Box }
  const markLabels: MarkLabel[] = [];
  const dotBoxes = (p.points ?? []).map(m => { const q = L2(m.at); return box(q[0] - 12, q[1] - 12, q[0] + 12, q[1] + 12); });
  const secPolys = planes.map(P => sectionOfFaces(faces, P)).filter(x => x.kind === 'polygon').map(x => x.pts.map(L2));
  for (const m of p.points ?? []) {
    const q = L2(m.at);
    let out = [q[0] - cenS[0], q[1] - cenS[1]];
    const ol = Math.hypot(out[0]!, out[1]!) || 1; out = [out[0]! / ol, out[1]! / ol];
    const base = Math.atan2(out[1]!, out[0]!);
    let best: MarkLabel | null = null;
    // pass 0: off every line and off the section; 1: may sit on a sheet; 2: may sit on the section's fill
    for (const pass of [0, 1, 2]) for (const r of [44, 62, 84, 108]) {
      if (best) break;
      for (const da of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
        const a = base + da, x = q[0] + Math.cos(a) * r, y = q[1] + Math.sin(a) * r;
        const bx = wordsBox(m.name, x, y, { size: MARK, align: 'center' });
        const hitsDot = dotBoxes.some(d => d.x0 < bx.x1 && bx.x0 < d.x1 && d.y0 < bx.y1 && bx.y0 < d.y1)
          || (pass < 2 && boxCorners(bx).some(q => secPolys.some(P => pointIn(q, P))));   // never on the section (it fills in the solution)
        const free = !hitsLines(bx, pass === 0 ? blockers : solidLines, 5) && !hitsDot && !placed.some(pq => pq.x0 < bx.x1 + 6 && bx.x0 < pq.x1 + 6 && pq.y0 < bx.y1 + 6 && bx.y0 < pq.y1 + 6);
        if (free) { best = { name: m.name, at: q, x, y, box: bx }; break; }
      }
      if (best) break;
    }
    check(best !== null, NAME, `no readable place for the point label ${m.name}`);
    placed.push(best.box);
    markLabels.push(best);
  }
  // plane names next to the right end of each sheet
  const planeLabels = (p.planeNames ?? []).map((nm, i) => {
    const L = sheetLines[i] ?? [];
    if (!L.length) return null;
    const r = L.reduce((a, b) => (b[0] > a[0] ? b : a));
    const x = r[0] + 40;
    let y = r[1], bx = wordsBox(nm, x, y, { size: 54, align: 'center' });
    // two names never sit on each other: the later one steps away from the earlier one
    for (let k = 0; k < 6 && placed.some(q => q.x0 < bx.x1 + 6 && bx.x0 < q.x1 + 6 && q.y0 < bx.y1 + 6 && bx.y0 < q.y1 + 6); k++) {
      const clash = placed.find(q => q.x0 < bx.x1 + 6 && bx.x0 < q.x1 + 6 && q.y0 < bx.y1 + 6 && bx.y0 < q.y1 + 6)!;
      y += (y >= clash.cy ? 1 : -1) * (bx.h * 0.6 + 8);
      bx = wordsBox(nm, x, y, { size: 54, align: 'center' });
    }
    placed.push(bx);
    return { nm, x, y, box: bx };
  });

  // ---- the flat sketch (true shape) ----
  const flatBox = p.flat ?? null;
  // the sketch's frame keeps it upright as the solid is posed: v = world up, u = screen right (in local coordinates)
  const Wi = invertPose(S, pose);
  const worldUpLocal = unit(sub(Wi(add(W([0, 0, 0]), [0, 0, 1])), Wi(W([0, 0, 0]))));
  const rightLocal = unit(sub(Wi(add(W([0, 0, 0]), B.R)), Wi(W([0, 0, 0]))));
  const FF = P0 ? planeFrame(P0, worldUpLocal, rightLocal) : null;
  let sketchScale = scale;
  if (flatBox && P0) {
    const sc = sec(0);
    if (sc.kind === 'polygon') {
      const q = sc.pts.map(v => to2(v, FF!));
      const w = Math.max(...q.map(a => a[0])) - Math.min(...q.map(a => a[0])), h = Math.max(...q.map(a => a[1])) - Math.min(...q.map(a => a[1]));
      const room = (p.sideLabels ?? 'auto') === 'none' ? [60, 40] : [230, 150];
      sketchScale = Math.min(scale, (flatBox.w - room[0]!) / Math.max(w, 1e-6), (flatBox.h - room[1]!) / Math.max(h, 1e-6));
    }
  }
  function sketchPts(sh: number): Pt[] {
    const sc = sec(0, sh);
    if (!flatBox || sc.kind !== 'polygon') return [];
    const q = sc.pts.map(v => to2(v, FF!));
    const cx = (Math.max(...q.map(a => a[0])) + Math.min(...q.map(a => a[0]))) / 2, cy = (Math.max(...q.map(a => a[1])) + Math.min(...q.map(a => a[1]))) / 2;
    return q.map(a => [flatBox.cx + (a[0] - cx) * sketchScale, flatBox.cy - (a[1] - cy) * sketchScale] as Pt);
  }
  /** side j of the live section gets a length when it runs along an edge direction of the solid */
  function sideLabelOf(sh: number, j: number): string | null {
    if ((p.sideLabels ?? 'auto') === 'none') return null;
    const sc = sec(0, sh);
    const a = sc.pts[j]!, b = sc.pts[(j + 1) % sc.pts.length]!, v = sub(b, a), L = Math.hypot(v[0], v[1], v[2]);
    const axisAligned = [0, 1, 2].filter(k => Math.abs(v[k]!) > 1e-6).length === 1;
    if (!axisAligned || !isNice(L)) return null;
    if (S.kind === 'pyramid') {
      const inBase = Math.abs(a[2]) < 1e-6 && Math.abs(b[2]) < 1e-6;
      const level = Math.abs(P0!.n[2]) > 1 - 1e-9;
      if (!inBase && !level) return null;
    }
    return lenWords(L, p.unit);
  }

  // ---- drawing helpers ----
  const amber = paint(th, 'first', 'fill');
  function tone(f: Face, front: boolean): string {
    const nW = wN(f.n), lit = dot(nW, LIGHT);
    const base = lit > 0.55 ? mix(amber, DUSK.cream, 0.28) : lit > 0.05 ? amber : mix(amber, DUSK.ink, 0.32);
    return front ? base : mix(base, DUSK.ink, 0.45);
  }
  const ptsOf = (f: Face, off: V3) => f.pts.map(v => S2(add(W(v), off)));
  const isFront = (f: Face) => dot(wN(f.n), B.C) > 1e-6;
  /** the far side of a solid: tinted glass and dashed hidden edges */
  function drawBack(c: Canvas, fs: readonly Face[], off: V3, a: number, skipCap: boolean): void {
    withAlpha(c, a, () => {
      for (const f of fs) if (!isFront(f) && !(skipCap && f.name === 'cap')) fillPts(c, ptsOf(f, off), tone(f, false) as never, 0.34);
      for (const f of fs) if (!isFront(f)) strokePts(c, ptsOf(f, off), { col: DUSK.cream as never, lw: 2.5, alpha: 0.42, dash: [11, 9], closed: true, cap: 'butt' });
    });
  }
  /** the near side: thin glass over whatever is inside, then the visible edges */
  function drawFront(c: Canvas, fs: readonly Face[], off: V3, a: number, skipCap: boolean): void {
    withAlpha(c, a, () => {
      for (const f of fs) if (isFront(f) && !(skipCap && f.name === 'cap')) fillPts(c, ptsOf(f, off), tone(f, true) as never, 0.2);
      for (const f of fs) if (isFront(f)) strokePts(c, ptsOf(f, off), { col: DUSK.cream as never, lw: 3.6, alpha: 0.95, closed: true });
    });
  }
  function ringBox(c: Canvas, R: Box, col: 'first' | 'second' | 'link' | 'pick', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(R.x0 - 14, R.y0 - 10, R.w + 28, R.h + 20, 14); g.fill(); g.restore();
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4;
    g.beginPath(); g.roundRect(R.x0 - 14, R.y0 - 10, R.w + 28, R.h + 20, 14); g.stroke(); g.restore();
  }

  function draw(c: Canvas, P: Progress<SlicerStep>, f: SlicerFocus = {}): void {
    const kS = P.k('solid'), kD = P.k('dims'), kP = P.k('plane'), kM = P.k('points'), kT = P.k('trace'), kF = P.k('fill'), kO = P.k('open');
    const sh = f.shift ?? 0;
    if (kS <= 0) return;
    const sheetA = clamp(kP) * (1 - 0.75 * clamp(f.sheetFade ?? 0));
    const main = P0 ? sec(0, sh) : null;
    const opened = kO > 0 && P0 && main && main.kind === 'polygon';
    const O: V3 = [0, 0, 0];
    // the sheets: a teal fill (under the glass), the outline later
    const sheetPts = planes.map((Pl, i) => {
      if (sheetA <= 0) return [] as Pt[];
      const slide = (1 - E.smooth(clamp(kP))) * 0.6 * sizeU;
      return sheetOf(S, shifted(Pl, (i === 0 ? sh : 0) + slide), pad).map(L2);
    });
    const sheetFill = () => sheetPts.forEach(L => { if (L.length >= 3) fillPts(c, L, 'second', 0.17 * sheetA); });
    // a sheet's edge stops short of every label (never a line through text)
    const sheetLine = () => {
      const { g } = c;
      g.save(); g.beginPath(); g.rect(-50, -50, 2100, 1200);
      for (const b of placed) g.rect(b.x0 - 10, b.y0 - 8, b.w + 20, b.h + 16);
      g.clip('evenodd');
      sheetPts.forEach(L => { if (L.length >= 3) strokePts(c, L, { col: 'second', lw: 3, alpha: 0.85 * sheetA, closed: true }); });
      g.restore();
    };
    // faces in focus, and the trace: one side per face, the face glowing while its side draws
    const glows = () => {
      if (f.face && (f.faceK ?? 0) > 0) {
        const fc = faces.find(x => x.name === f.face);
        if (fc) { const L = fc.pts.map(L2); fillPts(c, L, 'pick', 0.34 * clamp(f.faceK ?? 0)); strokePts(c, L, { col: 'pick', lw: 4, alpha: clamp(f.faceK ?? 0), closed: true }); }
      }
    };
    const sections = (skipMainFill: boolean) => planes.forEach((_, i) => {
      const sc = sec(i, i === 0 ? sh : 0);
      if (sc.kind !== 'polygon') {
        if (sc.kind === 'point' && kT > 0 && sc.pts[0]) { const q = L2(sc.pts[0]); disc(c, q[0], q[1], 9, 'link', clamp(kT)); }
        return;
      }
      const Q = sc.pts.map(L2), n = Q.length;
      if (kF > 0 && !(skipMainFill && i === 0)) withAlpha(c, E.smooth(clamp(kF)) * 0.92, () => wash(c, Q, 'link', { seed: 31 + i, ink: null, rough: 0.7, shade: 0.12 }));
      for (let j = 0; j < n; j++) {
        const t = clamp(kT * n - j);
        if (t <= 0) continue;
        if (t < 1) {
          const fc = faces.find(x => x.name === sc.sideFaces[j]);
          if (fc) { const L = fc.pts.map(L2), gk = Math.sin(Math.PI * clamp(t * 1.15)); fillPts(c, L, 'pick', 0.3 * gk); strokePts(c, L, { col: 'pick', lw: 3.5, alpha: gk, closed: true }); }
        }
        drawOn(c, [Q[j]!, Q[(j + 1) % n]!], E.inOut(t), { col: 'link', lw: 6 });
      }
      if (kT >= 1) for (const q of Q) disc(c, q[0], q[1], 6, 'link');
    });
    if (opened) {
      // two pieces: the one further from the eye first; the staying piece keeps the section as its cut face
      const Pm = shifted(P0, sh);
      const near = pieceOf(faces, Pm, stay), far = pieceOf(faces, Pm, (-stay) as 1 | -1);
      const off = mul(moveDir, gapU * E.inOut(clamp(kO)));
      const dNear = dot(W(centroidOf(near.flatMap(x => x.pts))), B.C), dFar = dot(add(W(centroidOf(far.flatMap(x => x.pts))), off), B.C);
      const fa = 1 - 0.62 * clamp(kO);
      const drawFar = () => { drawBack(c, far, off, fa, false); drawFront(c, far, off, fa, false); };
      const drawNear = () => {
        drawBack(c, near, O, 1, true);
        sheetFill(); glows();
        const cap = near.find(x => x.name === 'cap');
        if (cap && kF > 0) withAlpha(c, E.smooth(clamp(kF)), () => wash(c, ptsOf(cap, O), 'link', { seed: 31, ink: null, rough: 0.7, shade: 0.12 }));
        sections(true);
        drawFront(c, near, O, 1, true);
      };
      if (dFar < dNear) { drawFar(); drawNear(); } else { drawNear(); drawFar(); }
      sheetLine();
    } else {
      const k = E.smooth(clamp(kS));
      drawBack(c, faces, O, k, false);
      sheetFill(); glows(); sections(false);
      drawFront(c, faces, O, k, false);
      sheetLine();
    }
    // 4. marked points and their letters
    if (kM > 0) for (const m of markLabels) {
      disc(c, m.at[0], m.at[1], 10, DUSK.ink as never, clamp(kM));
      disc(c, m.at[0], m.at[1], 7.5, 'pick', clamp(kM));
      drawWords(c, m.name, m.x, m.y, 'pick', clamp(kM), { size: MARK, align: 'center', weight: 650 });
    }
    // 5. dims and plane names
    for (const L of dimLabels) {
      if (f.dim === L.d) ringBox(c, L.box, 'first', f.dimK ?? 0);
      drawWords(c, L.text, L.x, L.y, 'first', clamp(kD), { size: LABEL, align: 'center' });
    }
    planeLabels.forEach(L => { if (L) drawWords(c, L.nm, L.x, L.y, 'second', sheetA, { size: 54, align: 'center', weight: 700 }); });
    if ((f.ring ?? 0) > 0 && main && main.kind === 'polygon') ringBox(c, boxOf(main.pts.map(L2)), 'link', f.ring ?? 0);
  }

  function drawFlat(c: Canvas, P: Progress<SlicerStep>, f: SlicerFocus = {}): void {
    const kL = P.k('flat'), kSd = P.k('sides');
    if (kL <= 0 || !flatBox || !P0) return;
    const sh = f.shift ?? 0;
    const sc = sec(0, sh);
    if (sc.kind !== 'polygon') return;
    const from = sc.pts.map(L2), to = sketchPts(sh), t = E.inOut(clamp(kL));
    const Q = from.map((a, i) => [lerp(a[0], to[i]![0], t), lerp(a[1], to[i]![1], t)] as Pt);
    withAlpha(c, 0.35 + 0.65 * clamp(kL * 3), () => wash(c, Q, 'link', { seed: 37, ink: null, rough: 0.6, shade: 0.1 }));
    strokePts(c, Q, { col: paint(th, 'link', 'line') as never, lw: 4.5, closed: true, alpha: 0.95 });
    if (kSd <= 0 || t < 0.999) return;
    const cx = Q.reduce((a, q) => a + q[0], 0) / Q.length, cy = Q.reduce((a, q) => a + q[1], 0) / Q.length;
    const cand: { j: number; text: string; m: Pt; nx: number; ny: number; dir: Pt; L: number }[] = [];
    for (let j = 0; j < Q.length; j++) {
      const text = sideLabelOf(sh, j);
      if (!text) continue;
      const a = Q[j]!, b = Q[(j + 1) % Q.length]!, m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 40) continue;
      let nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      if (nx * (m[0] - cx) + ny * (m[1] - cy) < 0) { nx = -nx; ny = -ny; }
      cand.push({ j, text, m, nx, ny, dir: [(b[0] - a[0]) / L, (b[1] - a[1]) / L], L });
    }
    // two parallel sides of the same length carry one label: the lower one, or the one on the right
    const keep = cand.filter(q => !cand.some(o => o !== q && o.text === q.text && Math.abs(o.dir[0] * q.dir[1] - o.dir[1] * q.dir[0]) < 0.02
      && (o.ny + o.nx * 0.6 > q.ny + q.nx * 0.6)));
    for (const q of keep) {
      const b0 = wordsBox(q.text, 0, 0, { size: 46, align: 'center' });
      const ext = Math.abs(q.nx) * b0.w / 2 + Math.abs(q.ny) * b0.h / 2;
      drawWords(c, q.text, q.m[0] + q.nx * (22 + ext), q.m[1] + q.ny * (22 + ext), 'link', clamp(kSd), { size: 46, align: 'center' });
    }
  }

  const where = {
    solid: solidBox,
    section(i = 0, sh = 0): Box { const sc = sec(i, sh); return sc.pts.length ? boxOf(sc.pts.map(L2)) : solidBox; },
    sectionTip(i = 0, sh = 0): Box {
      const sc = sec(i, sh);
      if (!sc.pts.length) return solidBox;
      const q = sc.pts.map(L2).reduce((a, b) => (b[0] - 0.25 * b[1] > a[0] - 0.25 * a[1] ? b : a));
      return box(q[0] - 30, q[1] - 12, q[0] - 10, q[1] + 12);
    },
    dim: (d: Dim) => dimLabels.find(x => x.d === d)?.box ?? null,
    flat: flatBox,
    point: (name: string) => markLabels.find(m => m.name === name)?.box ?? null,
    bottom: Math.max(...solidPts.map(q => q[1])),
    rest: (() => { const fl = solidVerts(S).filter(v => Math.abs(W(v)[2]) < 1e-6).map(L2); return fl.length >= 2 ? Math.min(...fl.map(q => q[1])) : null; })(),
  };
  return {
    kind: 'Slicer', scale, view: { scale, ox, oy },
    box: unionBox([solidBox, ...placed]),
    where,
    sectionPts: (sh = 0) => sec(0, sh).pts.map(L2),
    draw, drawFlat,
  };
}

// ---------- small 2-D helpers ----------
function boxOf(P: readonly Pt[]): Box { return box(Math.min(...P.map(q => q[0])), Math.min(...P.map(q => q[1])), Math.max(...P.map(q => q[0])), Math.max(...P.map(q => q[1]))); }
const boxCorners = (b: Box): Pt[] => [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1], [b.cx, b.cy]];
function convexHull(P: readonly Pt[]): Pt[] {
  const pts = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Pt[] = [], up: Pt[] = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2]!, lo[lo.length - 1]!, p) <= 0) lo.pop(); lo.push(p); }
  for (const p of [...pts].reverse()) { while (up.length >= 2 && cr(up[up.length - 2]!, up[up.length - 1]!, p) <= 0) up.pop(); up.push(p); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
function pointIn(q: Pt, H: readonly Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = H.length - 1; i < H.length; j = i++) {
    const a = H[i]!, b = H[j]!;
    if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
/** world -> local for a pose (numerically: the pose is a rotation + a shift) */
function invertPose(s: SolidSpec, pose: Pose): (p: V3) => V3 {
  const W = poseFn(s, pose), o = W([0, 0, 0]);
  const ex = sub(W([1, 0, 0]), o), ey = sub(W([0, 1, 0]), o), ez = sub(W([0, 0, 1]), o);
  return q => { const d = sub(q, o); return [dot(d, ex), dot(d, ey), dot(d, ez)]; };
}
