// CoordGrid: the model block of "transformations in the coordinate plane". A four-quadrant grid (crisp lines, the
// numbers in the margin, never on a line) with a labelled figure (the preimage), the move that maps it (a slide, a
// fold across an axis or a line x = k / y = k) and its image, built by applying ONE rule to every vertex.
//   Roles: first (amber) = the preimage; second (teal) = the move: arrows, legs, the mirror line;
//          link (lime) = the image (the answer); pick (lavender) = focus, the moving tracing-paper copy, extra points;
//          wrong (red) = a proposed image that is wrong.
//   Steps (Progress keys): grid, pre, mirror, move (the tracing-paper copy goes 0 -> 1 along the move),
//          arrows (all vertices) or a<i> (vertex i): the move of each vertex (L-shaped legs for a slide, a
//          perpendicular through the mirror for a fold), d<i> (image vertex i), img (the whole image), wrong, extra.
//   Focus: rings on vertices, numbers on one vertex's legs, a lit grid line (x = c or y = c), angle arcs, order arrows
//          (orientation), a lit side, dimmed figures, a strike over the wrong figure.
// Layout is pure and checked: every point inside the grid, a grid square >= 34 px, numbers 60 px in the margin,
// letters 50 px on plates placed clear of edges, dots and each other. Maths in coordMaths.ts.
import { type Box, type Pt, box, clamp, lerp } from '../../../core/math';
import { type Canvas, arrow, dot, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { SANS, drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { type Move, type V, apply, centroid, fmt, orient, partway } from './coordMaths';

const NAME = 'CoordGrid';
const PAPER = '#1A1E44', GRIDC = '#343A6A', HALFC = '#282D58', AXIS = '#9A9ED0';
const NUM = 60, LETTER = 50, AXN = 48;

export type FigId = 'pre' | 'img' | 'wrong' | 'extra';
export interface Fig { pts: readonly V[]; names?: readonly (string | null)[]; open?: boolean; /** points only, no edges */ loose?: boolean }
export interface Win { x0: number; x1: number; y0: number; y1: number }
export interface CGParams {
  pre: Fig;
  /** the move; the image is computed from it (every vertex, one rule) */
  move?: Move;
  /** names of the image vertices (default: the preimage names with a prime) */
  imgNames?: readonly (string | null)[];
  /** an explicit image (a figure and its image given, the move to be named) */
  img?: Fig;
  /** a proposed image that is wrong (dashed, red) */
  wrong?: Fig;
  /** extra points (lavender) */
  extra?: Fig;
  win?: Win;
  /** grid lines every half unit */
  half?: boolean;
}
export interface CGFocus {
  ring?: { fig: FigId; i: number; col?: Paint }[]; ringK?: number;
  /** the vertex whose arrow legs carry their numbers */
  legs?: number; legsK?: number;
  /** fade a figure (0..1) */
  dim?: Partial<Record<FigId, number>>;
  /** a lit grid line: x = c (vertical) or y = c (horizontal) */
  vline?: number; hline?: number; lineK?: number;
  /** angle arcs at vertex i on the preimage and the image */
  angle?: number; angleK?: number;
  /** order arrows inside the preimage and the image (orientation) */
  orient?: number;
  /** lit sides (vertex i to i + 1) on the preimage and the image */
  sides?: number[]; sideK?: number;
  /** a strike over the wrong figure */
  strike?: number;
  /** the 'wrong' figure is someone's proposal not judged yet: drawn in the focus colour, not in red */
  proposal?: boolean;
}
export interface CGBlock {
  readonly kind: 'CoordGrid';
  readonly pre: V[]; readonly img: V[] | null;
  readonly win: Win; readonly unit: number;
  readonly where: {
    grid: Box;
    vert(f: FigId, i: number): Box;
    label(f: FigId, i: number): Box | null;
    /** the arrow (legs) of vertex i */ leg(i: number): Box;
    mirror: Box | null;
  };
  px(p: V): Pt;
  draw(c: Canvas, P: Progress<string>, f?: CGFocus): void;
}

interface Lab { t: string; x: number; y: number; size: number; b: Box; align: 'left' | 'center' | 'right' }
const prime = (s: string) => s.replace(/'/g, '′');

export function CoordGrid(p: CGParams, fr: Frame, th: Theme): CGBlock {
  const pre = p.pre.pts.map(v => [v[0], v[1]] as V);
  check(pre.length >= 1, NAME, 'the preimage needs a point');
  const img: V[] | null = p.img ? p.img.pts.map(v => [v[0], v[1]] as V) : p.move ? pre.map(v => apply(p.move!, v)) : null;
  if (p.img) check(p.img.pts.length === pre.length, NAME, 'the image has one vertex per preimage vertex');
  const figs: Record<FigId, { pts: V[]; names: (string | null)[]; open: boolean; loose: boolean } | null> = {
    pre: { pts: pre, names: [...(p.pre.names ?? pre.map(() => null))], open: !!p.pre.open, loose: !!p.pre.loose },
    img: img ? { pts: img, names: [...(p.img?.names ?? p.imgNames ?? (p.pre.names ?? []).map(n => (n ? n + "'" : null)))], open: !!p.pre.open, loose: !!p.pre.loose } : null,
    wrong: p.wrong ? { pts: [...p.wrong.pts], names: [...(p.wrong.names ?? [])], open: !!p.wrong.open, loose: !!p.wrong.loose } : null,
    extra: p.extra ? { pts: [...p.extra.pts], names: [...(p.extra.names ?? [])], open: true, loose: p.extra.loose ?? true } : null,
  };
  const all = (Object.values(figs).filter(Boolean) as { pts: V[] }[]).flatMap(F => F.pts);
  for (const v of all) check(Number.isFinite(v[0]) && Number.isFinite(v[1]), NAME, 'a coordinate is not a number');
  const mv = p.move;
  // ----- window: every point, the origin, one square of margin, at least 8 squares each way -----
  let win: Win;
  if (p.win) win = p.win;
  else {
    const xs = [...all.map(v => v[0]), 0], ys = [...all.map(v => v[1]), 0];
    if (mv?.kind === 'mirror') (mv.line === 'x' ? xs : ys).push(mv.k);
    let x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + 1;
    while (x1 - x0 < 8) { if (x1 - x0 < 8) x1++; if (x1 - x0 < 8) x0--; }
    while (y1 - y0 < 8) { if (y1 - y0 < 8) y1++; if (y1 - y0 < 8) y0--; }
    win = { x0, x1, y0, y1 };
  }
  for (const v of all) check(v[0] >= win.x0 && v[0] <= win.x1 && v[1] >= win.y0 && v[1] <= win.y1, NAME, `the point (${fmt(v[0])}, ${fmt(v[1])}) is off the grid`);
  check(win.x0 <= 0 && win.x1 >= 0 && win.y0 <= 0 && win.y1 >= 0, NAME, 'the window shows both axes');
  // ----- geometry: numbers in the left / bottom margin, axis names outside the grid -----
  const ml = 128, mb = 92, mt = 70, mr = 70;
  const aw = fr.w - ml - mr, ah = fr.h - mt - mb;
  const sx = win.x1 - win.x0, sy = win.y1 - win.y0;
  const unit = Math.min(aw / sx, ah / sy, 96);
  check(unit >= 34, NAME, `a grid square would be ${Math.round(unit)} px (window ${sx} x ${sy})`);
  const gw = unit * sx, gh = unit * sy;
  const gx0 = fr.x + ml + (aw - gw) / 2, gy0 = fr.y + mt + (ah - gh) / 2, gx1 = gx0 + gw, gy1 = gy0 + gh;
  const grid = box(gx0, gy0, gx1, gy1);
  const px = (v: V): Pt => [gx0 + (v[0] - win.x0) * unit, gy1 - (v[1] - win.y0) * unit];
  const card = box(gx0 - ml + 14, gy0 - mt + 8, gx1 + mr - 8, gy1 + mb - 6);
  // tick numbers: every 1, 2 or 5 squares so they never touch
  const tickW = Math.max(...[win.x0, win.x1].map(v => wordsBox(fmt(v), 0, 0, { size: NUM }).w));
  const xs = [1, 2, 5, 10].find(s => s * unit >= tickW + 34) ?? 10;
  const ys = [1, 2, 5, 10].find(s => s * unit >= NUM + 8) ?? 10;
  const ticks = (a: number, b: number, s: number) => { const out: number[] = []; for (let v = Math.ceil(a / s) * s; v <= b; v += s) out.push(v); return out; };
  const xT = ticks(win.x0, win.x1, xs).map(v => lab(fmt(v), px([v, 0])[0], gy1 + 46, NUM, 'center'));
  // the lowest y number gives way when it would touch the first x number (the corner)
  const yT = ticks(win.y0, win.y1, ys).map(v => lab(fmt(v), gx0 - 22, px([0, v])[1], NUM, 'right')).filter(L => !xT.some(X => L.b.x1 + 10 > X.b.x0 && L.b.y1 + 6 > X.b.y0));
  check(xT.every(L => L.b.x0 >= fr.x - 30 && L.b.x1 <= fr.x + fr.w + 40), NAME, 'x numbers run off the frame');
  const xName = lab('x', gx1 + 30, px([0, 0])[1], AXN, 'center'), yName = lab('y', px([0, 0])[0], gy0 - 34, AXN, 'center');
  // the mirror line (in grid px)
  let mirrorP: [Pt, Pt] | null = null, mirrorName: Lab | null = null;
  if (mv?.kind === 'reflect') mirrorP = mv.axis === 'x' ? [[gx0, px([0, 0])[1]], [gx1, px([0, 0])[1]]] : [[px([0, 0])[0], gy0], [px([0, 0])[0], gy1]];
  if (mv?.kind === 'mirror') {
    if (mv.line === 'x') { const x = px([mv.k, 0])[0]; mirrorP = [[x, gy0], [x, gy1]]; mirrorName = lab(`x = ${fmt(mv.k)}`, x, gy0 - 34, AXN, 'center'); }
    else { const y = px([0, mv.k])[1]; mirrorP = [[gx0, y], [gx1, y]]; mirrorName = lab(`y = ${fmt(mv.k)}`, gx1 + 14, y, AXN, 'left'); }
    if (mirrorName) {
      // keep the line's name clear of the axis name
      const other = mv.line === 'x' ? yName : xName;
      if (Math.abs((mv.line === 'x' ? mirrorName.x - other.x : mirrorName.y - other.y)) < 90) {
        mirrorName = mv.line === 'x' ? lab(mirrorName.t, mirrorName.x + 70, mirrorName.y, AXN, 'left') : lab(mirrorName.t, mirrorName.x, mirrorName.y - 56, AXN, 'left');
      }
    }
  }

  // ----- arrows: per vertex, in grid px (their numbers are placed after the letters) -----
  type Arrow = { legs: Pt[][]; foot?: Pt; nums: Lab[]; vertical?: boolean; d?: number };
  const same2 = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.5 && Math.abs(a[1] - b[1]) < 0.5;
  const arrows: Arrow[] = img ? pre.map((v, i) => arrowOf(v, img[i]!)) : [];
  function arrowOf(a: V, b: V): Arrow {
    const A = px(a), B = px(b);
    if (mv?.kind === 'slide') {
      const M = px([b[0], a[1]]);
      const legs = [A[0] !== M[0] ? [A, M] : null, M[1] !== B[1] ? [M, B] : null].filter(Boolean) as Pt[][];
      return { legs, nums: [] };
    }
    if (mv?.kind === 'reflect' || mv?.kind === 'mirror') {
      const vertical = (mv.kind === 'reflect' && mv.axis === 'x') || (mv.kind === 'mirror' && mv.line === 'y');
      const footV: V = vertical ? [a[0], mv.kind === 'reflect' ? 0 : mv.k] : [mv.kind === 'reflect' ? 0 : mv.k, a[1]];
      const F = px(footV);
      const d = Math.abs(vertical ? a[1] - footV[1] : a[0] - footV[0]);
      if (d === 0) return { legs: [], nums: [] };
      return { legs: [[A, F], [F, B]], foot: F, nums: [], vertical, d };
    }
    return { legs: same2(A, B) ? [] : [[A, B]], nums: [] };
  }
  const legBox = (i: number): Box => {
    const L = arrows[i]?.legs.flat() ?? [px(pre[i]!)];
    const xs2 = L.map(q => q[0]), ys2 = L.map(q => q[1]);
    return box(Math.min(...xs2) - 8, Math.min(...ys2) - 8, Math.max(...xs2) + 8, Math.max(...ys2) + 8);
  };

  // ----- letters: around their vertex, clear of every edge, arrow, dot and letter -----
  const edges: Pt[][] = [];
  const figList = (Object.keys(figs) as FigId[]).filter(k => figs[k]);
  for (const k of figList) {
    const F = figs[k]!; const P = F.pts.map(px);
    if (P.length > 1 && !F.loose) edges.push(F.open ? P : [...P, P[0]!]);
  }
  const legLines = arrows.flatMap(A => A.legs);
  const dots = figList.flatMap(k => figs[k]!.pts.map(px));
  const axesL: Pt[][] = [[[gx0, px([0, 0])[1]], [gx1, px([0, 0])[1]]], [[px([0, 0])[0], gy0], [px([0, 0])[0], gy1]]];
  const placed: Box[] = [];
  const labels: Record<FigId, (Lab | null)[]> = { pre: [], img: [], wrong: [], extra: [] };
  const overlaps = (a: Box, b: Box, pad = 6) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
  const onDot = (B: Box, pad = 16) => dots.some(d => d[0] > B.x0 - pad && d[0] < B.x1 + pad && d[1] > B.y0 - pad && d[1] < B.y1 + pad);
  for (const k of ['pre', 'img', 'wrong', 'extra'] as FigId[]) {
    const F = figs[k];
    if (!F) continue;
    const cen = px(centroid(F.pts));
    labels[k] = F.pts.map((v, i) => {
      const nm = F.names[i];
      if (!nm) return null;
      const [x, y] = px(v);
      let best: Lab | null = null, bestS = Infinity;
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2;
        for (const r of [52, 64, 80, 100]) {
          const L = lab(prime(nm), x + Math.cos(ang) * r, y + Math.sin(ang) * r, LETTER, 'center');
          const B = L.b;
          let s = r * 0.4;
          if (B.x0 < fr.x || B.x1 > fr.x + fr.w || B.y0 < fr.y || B.y1 > fr.y + fr.h) continue;
          if (B.x0 < gx0 - 4 || B.x1 > gx1 + 4 || B.y0 < gy0 - 4 || B.y1 > gy1 + 4) s += 300;
          if (hitsLines(B, edges, 6)) s += 1000;
          if (hitsLines(B, legLines, 6)) s += 700;
          if (onDot(B)) s += 3000;
          if (placed.some(q => overlaps(q, B))) s += 3000;
          // a letter must read as ITS vertex's: no other dot nearer to it
          const own = Math.hypot(B.cx - x, B.cy - y);
          if (dots.some(d => (Math.abs(d[0] - x) > 0.5 || Math.abs(d[1] - y) > 0.5) && Math.hypot(B.cx - d[0], B.cy - d[1]) < own - 4)) s += 2500;
          if (mirrorP && hitsLines(B, [mirrorP], 6)) s += 140;
          if (hitsLines(B, axesL, 4)) s += 60;
          // away from the figure's middle
          const dx = Math.cos(ang), dy = Math.sin(ang), ox = x - cen[0], oy = y - cen[1], ol = Math.hypot(ox, oy) || 1;
          s += (1 - (dx * ox + dy * oy) / ol) * 40;
          if (s < bestS) { bestS = s; best = L; }
        }
      }
      // a letter may sit on a plate over a line as a last resort, never on another letter or a dot
      check(best && bestS < 2000, NAME, `no room for the letter ${nm}`);
      placed.push(best.b);
      return best;
    });
  }
  // ----- the numbers on the arrows: beside each leg, clear of edges, dots and letters -----
  function placeNum(t: string, leg: Pt[], horizontal: boolean, taken: Box[]): Lab {
    const [a, b] = [leg[0]!, leg[1]!];
    let best: Lab | null = null, bestS = Infinity;
    [0.5, 0.65, 0.35, 0.8, 0.2].forEach((u, j) => {
      for (const side of [-1, 1]) {
        const mx = lerp(a[0], b[0], u), my = lerp(a[1], b[1], u);
        const L = horizontal ? lab(t, mx, my + side * 46, NUM, 'center') : lab(t, mx + side * 24, my, NUM, side > 0 ? 'left' : 'right');
        const B = L.b;
        let s = j * 8 + (side > 0 ? 2 : 0);
        if (B.x0 < gx0 - 4 || B.x1 > gx1 + 4 || B.y0 < gy0 - 4 || B.y1 > gy1 + 4) s += 400;
        if (hitsLines(B, edges, 4)) s += 1000;
        if (hitsLines(B, legLines, 4)) s += 600;
        if (onDot(B, 10)) s += 3000;
        if ([...placed, ...taken].some(q => overlaps(q, B, 4))) s += 3000;
        if (s < bestS) { bestS = s; best = L; }
      }
    });
    return best!;
  }
  arrows.forEach(A => {
    const taken: Box[] = [];
    const put = (t: string, leg: Pt[], horizontal: boolean) => { const L = placeNum(t, leg, horizontal, taken); taken.push(L.b); A.nums.push(L); };
    if (mv?.kind === 'slide') {
      for (const leg of A.legs) { const horizontal = Math.abs(leg[0]![1] - leg[1]![1]) < 0.5; put(signedN(horizontal ? mv.dx : mv.dy), leg, horizontal); }
    } else if (A.foot && A.d) {
      for (const leg of A.legs) put(fmt(A.d), leg, !A.vertical);
    }
  });

  // ----- drawing -----
  function lab(t: string, x: number, y: number, size: number, align: Lab['align']): Lab { return { t, x, y, size, align, b: wordsBox(t, x, y, { size, align }) }; }
  function words(c: Canvas, L: Lab, col: Paint, k: number, weight = 650): void { drawWords(c, L.t, L.x, L.y, col, k, { size: L.size, align: L.align, weight }); }
  function plate(c: Canvas, B: Box, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.9; g.fillStyle = PAPER;
    g.beginPath(); g.roundRect(B.x0 - 8, B.y0 - 4, B.w + 16, B.h + 8, 10); g.fill(); g.restore();
  }
  function line(c: Canvas, a: Pt, b: Pt, col: string, w: number, k = 1, dash?: number[]): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
    if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); g.stroke(); g.restore();
  }
  function ring(c: Canvas, P: Pt, col: Paint, k: number, r = 22): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 12;
    g.beginPath(); g.arc(P[0], P[1], r, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  function figure(c: Canvas, id: FigId, k: number, kDots: (i: number) => number, col: Paint, o: { fill?: number; dash?: boolean; alpha?: number } = {}): void {
    const F = figs[id];
    if (!F) return;
    const a = (o.alpha ?? 1);
    if (a <= 0) return;
    const P = F.pts.map(px);
    c.g.save(); c.g.globalAlpha *= a;
    if (k > 0 && P.length >= 3 && !F.open && !F.loose) {
      wash(c, P, col, { seed: id.length * 13 + 5, rough: 1.0, ink: null, alpha: E.smooth(clamp(k * 1.4 - 0.4)) * (o.fill ?? 0.5), shade: 0.12 });
    }
    if (k > 0 && P.length >= 2 && !F.loose) {
      const path = F.open ? P : [...P, P[0]!];
      const { g } = c;
      g.save(); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round';
      if (o.dash) g.setLineDash([16, 12]);
      const L = partialPts(path, E.inOut(clamp(k * 1.3)));
      g.beginPath(); L.forEach((q, j) => (j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.restore();
    }
    P.forEach((q, i) => {
      const kd = Math.max(k, kDots(i));
      if (kd <= 0) return;
      const s = E.back(clamp(kd * 1.6));
      dot(c, q[0], q[1], 13 * s, '#0E1030');
      dot(c, q[0], q[1], 10 * s, col);
      const L = labels[id][i];
      if (L) { const kl = E.smooth(clamp(kd * 2 - 0.6)); plate(c, L.b, kl); words(c, L, col, kl, 700); }
    });
    c.g.restore();
  }

  function draw(c: Canvas, P: Progress<string>, f: CGFocus = {}): void {
    const kG = P.k('grid'), kPre = P.k('pre'), kMir = P.k('mirror'), kMove = P.k('move'), kArr = P.k('arrows');
    const kImg = P.k('img'), kW = P.k('wrong'), kX = P.k('extra');
    const dim = (id: FigId) => 1 - 0.62 * clamp(f.dim?.[id] ?? 0);
    const { g } = c;
    // ===== the grid =====
    if (kG > 0) {
      const ka = E.smooth(clamp(kG * 2));
      c.g.save(); c.g.globalAlpha *= ka;
      wash(c, rectOf(card), '#232856', { seed: 41, rough: 1.2, ink: '#0E1030', inkW: 3, shade: 0.2 });
      g.fillStyle = PAPER; g.fillRect(gx0, gy0, gw, gh);
      if (p.half) {
        g.strokeStyle = HALFC; g.lineWidth = 1.5;
        for (let v = win.x0 + 0.5; v < win.x1; v += 1) { const x = px([v, 0])[0]; g.beginPath(); g.moveTo(x, gy0); g.lineTo(x, gy1); g.stroke(); }
        for (let v = win.y0 + 0.5; v < win.y1; v += 1) { const y = px([0, v])[1]; g.beginPath(); g.moveTo(gx0, y); g.lineTo(gx1, y); g.stroke(); }
      }
      g.strokeStyle = GRIDC; g.lineWidth = 2;
      for (let v = win.x0; v <= win.x1; v++) { const x = px([v, 0])[0]; g.beginPath(); g.moveTo(x, gy0); g.lineTo(x, gy1); g.stroke(); }
      for (let v = win.y0; v <= win.y1; v++) { const y = px([0, v])[1]; g.beginPath(); g.moveTo(gx0, y); g.lineTo(gx1, y); g.stroke(); }
      c.g.restore();
      const kax = E.inOut(clamp(kG * 1.6 - 0.2));
      const o = px([0, 0]);
      line(c, [gx0, o[1]], [gx1, o[1]], AXIS, 4, kax);
      line(c, [o[0], gy1], [o[0], gy0], AXIS, 4, kax);
      const kl = E.smooth(clamp(kG * 2 - 0.9));
      for (const L of [...xT, ...yT]) words(c, L, 'dim', kl, 600);
      drawItalic(c, xName, kl); drawItalic(c, yName, kl);
    }
    // a lit grid line (x stays the same: a vertical line; y stays: a horizontal one)
    const kLn = f.lineK ?? 1;
    if (f.vline !== undefined && kLn > 0) { const x = px([f.vline, 0])[0]; withA(c, 0.85, () => line(c, [x, gy1], [x, gy0], paint(th, 'pick', 'fill'), 5, E.inOut(kLn), [14, 10])); }
    if (f.hline !== undefined && kLn > 0) { const y = px([0, f.hline])[1]; withA(c, 0.85, () => line(c, [gx0, y], [gx1, y], paint(th, 'pick', 'fill'), 5, E.inOut(kLn), [14, 10])); }
    // ===== the mirror =====
    if (mirrorP && kMir > 0) {
      g.save(); g.shadowColor = paint(th, 'second', 'fill'); g.shadowBlur = 10;
      line(c, mirrorP[0], mirrorP[1], paint(th, 'second', 'fill'), 7, E.inOut(kMir));
      g.restore();
      if (mirrorName) { plate(c, mirrorName.b, kMir); words(c, mirrorName, 'second', E.smooth(kMir), 700); }
    }
    // ===== figures =====
    const kd = (i: number) => P.k('d' + i);
    figure(c, 'pre', kPre, () => 0, 'first', { alpha: dim('pre') });
    if (kW > 0) figure(c, 'wrong', kW, () => 0, f.proposal ? 'pick' : 'wrong', { dash: true, fill: 0.18, alpha: dim('wrong') });
    if (kX > 0) figure(c, 'extra', kX, () => 0, 'pick', { alpha: dim('extra') });
    // the arrows of each vertex (behind the image)
    if (img) arrows.forEach((A, i) => {
      const k = Math.max(kArr > 0 ? clamp(kArr * pre.length - i * 0.7) : 0, P.k('a' + i));
      if (k <= 0 || !A.legs.length) return;
      const n = A.legs.length;
      A.legs.forEach((L, j) => {
        const kj = clamp(k * n - j);
        if (kj <= 0) return;
        const refl = !!A.foot;
        if (refl) withA(c, 0.95, () => line(c, L[0]!, L[1]!, paint(th, 'second', 'fill'), 4, E.inOut(kj), [12, 9]));
        else arrow(c, L, E.inOut(kj), { col: 'second', lw: 5, head: 20 });
      });
      if (A.foot && k > 0.5) {
        // a right-angle mark at the foot and equal-distance ticks on both halves
        const [a, b] = [A.legs[0]![0]!, A.legs[1]![1]!];
        const ux = Math.sign(b[0] - a[0]), uy = Math.sign(b[1] - a[1]);
        const F = A.foot, s = 16;
        const alongX = ux !== 0;
        const q1: Pt = alongX ? [F[0] - ux * s, F[1]] : [F[0], F[1] - uy * s];
        const q2: Pt = alongX ? [F[0] - ux * s, F[1] - s] : [F[0] + s, F[1] - uy * s];
        const q3: Pt = alongX ? [F[0], F[1] - s] : [F[0] + s, F[1]];
        withA(c, clamp(k * 2 - 1), () => strokePts(c, [q1, q2, q3], { col: 'second', lw: 3 }));
        for (const half of A.legs) {
          const m: Pt = [(half[0]![0] + half[1]![0]) / 2, (half[0]![1] + half[1]![1]) / 2];
          const t: [Pt, Pt] = alongX ? [[m[0], m[1] - 11], [m[0], m[1] + 11]] : [[m[0] - 11, m[1]], [m[0] + 11, m[1]]];
          withA(c, clamp(k * 2 - 1), () => line(c, t[0], t[1], paint(th, 'second', 'fill'), 4));
        }
      }
      if (f.legs === i) {
        const kn = (f.legsK ?? 1) * clamp(k * 2 - 1);
        for (const L of A.nums) { plate(c, L.b, kn); words(c, L, 'second', kn, 750); }
      }
    });
    // the tracing-paper copy moving along the move
    if (mv && kMove > 0) {
      const t = E.inOut(clamp(kMove));
      const Q = pre.map(v => px(partway(mv, v, t)));
      const a = 1 - clamp(kImg);
      if (a > 0) withA(c, a, () => {
        if (Q.length >= 3 && !p.pre.open && !p.pre.loose) fillPoly(c, Q, paint(th, 'pick', 'fill'), 0.22);
        if (Q.length >= 2 && !p.pre.loose) strokePts(c, p.pre.open ? Q : [...Q, Q[0]!], { col: 'pick', lw: 4, dash: [12, 9] });
        for (const q of Q) dot(c, q[0], q[1], 8, 'pick');
      });
    }
    if (img) figure(c, 'img', kImg, kd, 'link', { alpha: dim('img') });
    // ===== focus =====
    const rk = f.ringK ?? 1;
    for (const R of f.ring ?? []) { const F = figs[R.fig]; if (F && F.pts[R.i]) ring(c, px(F.pts[R.i]!), R.col ?? 'pick', rk); }
    if (f.sides && (f.sideK ?? 1) > 0) for (const id of ['pre', 'img'] as FigId[]) for (const sd of f.sides) {
      const F = figs[id]; if (!F || F.pts.length < 2) continue;
      const a = px(F.pts[sd % F.pts.length]!), b = px(F.pts[(sd + 1) % F.pts.length]!);
      g.save(); g.shadowColor = paint(th, 'pick', 'fill'); g.shadowBlur = 14;
      line(c, a, b, paint(th, 'pick', 'fill'), 8, E.inOut(f.sideK ?? 1)); g.restore();
    }
    if (f.angle !== undefined && (f.angleK ?? 1) > 0) for (const id of ['pre', 'img'] as FigId[]) {
      const F = figs[id]; if (!F || F.pts.length < 3) continue;
      angleArc(c, F.pts.map(px), f.angle, f.angleK ?? 1);
    }
    if ((f.orient ?? 0) > 0) for (const id of ['pre', 'img'] as FigId[]) {
      const F = figs[id]; if (!F || F.pts.length < 3) continue;
      orderArrow(c, F.pts, f.orient!);
    }
    if ((f.strike ?? 0) > 0 && figs.wrong) {
      for (const v of figs.wrong.pts) {
        const [x, y] = px(v), s = 26, k = clamp(f.strike!);
        line(c, [x - s, y - s], [x + s, y + s], paint(th, 'wrong', 'line'), 6, E.inOut(clamp(k * 2)));
        line(c, [x + s, y - s], [x - s, y + s], paint(th, 'wrong', 'line'), 6, E.inOut(clamp(k * 2 - 1)));
      }
    }
  }
  function drawItalic(c: Canvas, L: Lab, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.font = `italic 600 ${L.size}px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = paint(th, 'ink', 'text'); g.fillText(L.t, L.x, L.y); g.restore();
  }
  function angleArc(c: Canvas, Q: Pt[], i: number, k: number): void {
    const n = Q.length, b = Q[i]!, a = Q[(i - 1 + n) % n]!, d = Q[(i + 1) % n]!;
    const a0 = Math.atan2(a[1] - b[1], a[0] - b[0]), a1 = Math.atan2(d[1] - b[1], d[0] - b[0]);
    let sweep = a1 - a0;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    while (sweep < -Math.PI) sweep += 2 * Math.PI;
    const r = Math.min(46, 0.4 * Math.min(Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(d[0] - b[0], d[1] - b[1])));
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, 'pick', 'fill'); g.globalAlpha *= 0.35;
    g.beginPath(); g.moveTo(b[0], b[1]); g.arc(b[0], b[1], r, a0, a0 + sweep * E.inOut(clamp(k)), sweep < 0); g.closePath(); g.fill();
    g.globalAlpha /= 0.35; g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 4;
    g.beginPath(); g.arc(b[0], b[1], r, a0, a0 + sweep * E.inOut(clamp(k)), sweep < 0); g.stroke();
    g.restore();
  }
  /** a round arrow inside a polygon, turning the way its vertices are listed (A -> B -> C) */
  function orderArrow(c: Canvas, pts: V[], k: number): void {
    const o = orient(pts);
    if (!o) return;
    const cen = px(centroid(pts));
    const Q = pts.map(px);
    // the radius: well inside the polygon (a share of the distance from the middle to the nearest edge)
    let dmin = Infinity;
    for (let i = 0; i < Q.length; i++) dmin = Math.min(dmin, segDist(cen, Q[i]!, Q[(i + 1) % Q.length]!));
    const r = Math.max(14, Math.min(48, dmin * 0.62));
    // screen y points down: a counterclockwise (math) order turns counterclockwise on screen too
    const dir = o > 0 ? -1 : 1;
    const a0 = -Math.PI / 2, sweep = dir * Math.PI * 1.5 * E.inOut(clamp(k));
    const arc: Pt[] = Array.from({ length: 33 }, (_, j) => { const t = a0 + (sweep * j) / 32; return [cen[0] + r * Math.cos(t), cen[1] + r * Math.sin(t)]; });
    arrow(c, arc, 1, { col: 'pick', lw: 4, head: 14 });
  }
  function withA(c: Canvas, a: number, fn: () => void): void { if (a <= 0) return; c.g.save(); c.g.globalAlpha *= clamp(a); fn(); c.g.restore(); }
  function fillPoly(c: Canvas, Q: Pt[], col: string, a: number): void {
    const { g } = c;
    g.save(); g.globalAlpha *= a; g.fillStyle = col; g.beginPath(); Q.forEach((q, j) => (j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fill(); g.restore();
  }

  const vert = (fid: FigId, i: number): Box => { const F = figs[fid]; const v = F?.pts[i] ?? pre[0]!; const [x, y] = px(v); return box(x - 14, y - 14, x + 14, y + 14); };
  return {
    kind: 'CoordGrid', pre, img, win, unit,
    where: {
      grid, vert, label: (fid, i) => labels[fid][i]?.b ?? null, leg: legBox,
      mirror: mirrorP ? box(Math.min(mirrorP[0][0], mirrorP[1][0]) - 4, Math.min(mirrorP[0][1], mirrorP[1][1]) - 4, Math.max(mirrorP[0][0], mirrorP[1][0]) + 4, Math.max(mirrorP[0][1], mirrorP[1][1]) + 4) : null,
    },
    px, draw,
  };
}

const signedN = (n: number) => (n > 0 ? `+${fmt(n)}` : fmt(n));
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
  const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L);
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
const rectOf = (b: Box): Pt[] => [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
/** the first k (0..1) of a polyline */
function partialPts(P: readonly Pt[], k: number): Pt[] {
  if (k >= 1) return [...P];
  let L = 0;
  for (let i = 1; i < P.length; i++) L += Math.hypot(P[i]![0] - P[i - 1]![0], P[i]![1] - P[i - 1]![1]);
  let left = L * clamp(k);
  const out: Pt[] = [P[0]!];
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1]!, b = P[i]!, d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left >= d) { out.push(b); left -= d; continue; }
    const t = d ? left / d : 0;
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
    break;
  }
  return out;
}
