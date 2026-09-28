// RatioGraph: a ratio a : b as a straight line through zero. The first amount runs across, the second up; every
// equivalent pair k·a : k·b is a point on the line y = (b/a)·x, and a rectangle from the origin to that point always
// has the same shape. Points that are not multiples (4 : 5 from "adding 2") sit off the line: the block computes the
// gap to the line exactly, the unit rate (1, b/a) and a staircase of n unit steps that lands on (n, n·b/a).
//
//   const g = RatioGraph({ a: 2, b: 3, ks: [1, 2, 3, 4], others: [{ x: 4, y: 5, id: 'add' }], unit: true, stairs: 5,
//                          labels: ['orange', 'green'] }, frame(120, 80, 1680, 920), ink);
//   g.draw(c, progress)                       steps: grid, xAxis, yAxis, rect:<id>, pt:<id>, line, origin, dir, gap:<id>,
//                                             ray:<id>, stairs
//   g.draw(c, progress, g.lerp('rects', 'plane', k))    a camera move between two named views
//
// Views (the camera): a view is { unit (px per 1), origin (px), xMax, yMax (axis extents) }. The default view fits the
// frame; named views (params.views) are checked like the default one: everything inside the frame, numbers >= 60 px,
// neighbouring axis labels 16 px apart, no label on a line. The painters (rect, point, coords, segment, …) take a
// Mapper, so a scene can choreograph single elements (a rectangle growing from 2×3 to 4×6, a bead on the line).
import { type Box, type Pt, type Q, box, clamp, lerp, qDiv, qEq, qMul, qNum, qStr, qTex, rat, toQ, unionBox } from '../core/math';
import { E } from '../core/easing';
import { circlePts } from '../core/pts';
import { type Canvas, arrow, dashLine, drawOn, fillPts, glowOn, halo, strokePts } from '../core/draw';
import type { Progress } from '../core/clock';
import { type Paint, type Role, type Theme, paint } from '../core/theme';
import { type Formula, tex, texBox, texDraw } from '../core/tex';
import { type Block, type Frame, type ParamSpec, check, friendly, hitsLines, plainText } from './block';

const NAME = 'RatioGraph';

export interface GraphPointSpec { readonly x: number; readonly y: number; readonly id?: string }
export interface GraphView {
  /** px per unit (the same across and up: shapes keep their shape) */ readonly unit: number;
  /** the origin in design px */ readonly origin: Pt;
  /** the axes run 0..xMax across and 0..yMax up */ readonly xMax: number; readonly yMax: number;
}
export interface RatioGraphParams {
  /** the ratio a : b (the line y = b/a · x) */
  readonly a: number; readonly b: number;
  /** points on the line: k·(a, b), ids p0, p1, … */
  readonly ks?: readonly number[];
  /** other points, tested against the line (on / off, with the gap), ids from the spec or o0, o1, … */
  readonly others?: readonly GraphPointSpec[];
  /** the unit-rate point (1, b/a), id 'unit' */
  readonly unit?: boolean;
  /** n unit steps (1 across, b/a up) from zero, landing on (n, n·b/a), id 'stairs' */
  readonly stairs?: number;
  /** axis names (plain words) */
  readonly labels?: readonly [string, string];
  /** colour roles: the two amounts, the line (accent), off-line points (wrong) */
  readonly roles?: readonly [Role, Role]; readonly accent?: Role; readonly wrong?: Role;
  /** axis extents of the default view (default: every point with some room) */
  readonly xMax?: number; readonly yMax?: number;
  /** named camera views, each checked against the frame */
  readonly views?: Readonly<Record<string, GraphView>>;
}

export type GraphPointKind = 'multiple' | 'on' | 'off' | 'unit';
export interface GraphPoint {
  readonly id: string; readonly x: Q; readonly y: Q; readonly kind: GraphPointKind;
  /** how many times (a, b) this is (null when off the line) */ readonly k: Q | null;
  /** the line's height at this x, and y minus that (0 on the line) */ readonly lineY: Q; readonly gap: Q;
  /** second ÷ first ("how many times bigger") and second − first ("the difference") */ readonly times: Q; readonly diff: Q;
}
export interface RatioGraphMaths {
  readonly a: Q; readonly b: Q; readonly rate: Q;
  readonly points: readonly GraphPoint[];
  /** staircase corners (0,0) → (1,0) → (1,r) → (2,r) → … → (n, n·r) */
  readonly stairs: readonly (readonly [Q, Q])[];
  readonly xMax: number; readonly yMax: number;
}
export type RatioGraphStep = 'grid' | 'xAxis' | 'yAxis' | 'line' | 'origin' | 'dir' | 'stairs'
  | `pt:${string}` | `rect:${string}` | `gap:${string}` | `ray:${string}`;

export const GRAPH_MAX_UNITS = 40;

const eqPt = (p: GraphPoint, x: Q, y: Q) => qEq(p.x, x) && qEq(p.y, y);

/** the maths of a ratio graph, validated */
export function computeRatioGraph(P: RatioGraphParams): RatioGraphMaths {
  const a = friendly(P.a, NAME, 'a'), b = friendly(P.b, NAME, 'b'), rate = qDiv(b, a);
  if (P.labels) { plainText(P.labels[0], NAME, 'across label'); plainText(P.labels[1], NAME, 'up label'); }
  const pts: GraphPoint[] = [];
  const add = (id: string, x: Q, y: Q, kind: GraphPointKind) => {
    check(!pts.some(p => p.id === id), NAME, `two points are called '${id}'`);
    const dup = pts.find(p => eqPt(p, x, y));
    check(!dup, NAME, `point (${qStr(x)}, ${qStr(y)}) is listed twice ('${dup?.id}' and '${id}')`);
    const lineY = qMul(x, rate), gap = rat(y.p * lineY.q - lineY.p * y.q, y.q * lineY.q);
    const on = gap.p === 0;
    const k = on ? qDiv(x, a) : null;
    pts.push({ id, x, y, kind: kind === 'on' && !on ? 'off' : kind, k, lineY, gap, times: qDiv(y, x), diff: rat(y.p * x.q - x.p * y.q, y.q * x.q) });
  };
  (P.ks ?? []).forEach((kn, i) => {
    const k = friendly(kn, NAME, `multiple ${i + 1}`);
    add(`p${i}`, qMul(a, k), qMul(b, k), 'multiple');
  });
  (P.others ?? []).forEach((o, j) => {
    const x = friendly(o.x, NAME, `point ${o.id ?? j + 1} x`), y = friendly(o.y, NAME, `point ${o.id ?? j + 1} y`);
    if (o.id) check(/^[\w-]+$/.test(o.id), NAME, `point id '${o.id}' may only use letters, digits, - and _`);
    add(o.id ?? `o${j}`, x, y, 'on');
  });
  if (P.unit) add('unit', rat(1), rate, 'unit');
  const stairs: (readonly [Q, Q])[] = [];
  if (P.stairs !== undefined) {
    const n = P.stairs;
    check(Number.isInteger(n) && n >= 1 && n <= 12, NAME, `stairs must be a whole number of steps, 1 to 12 (got ${n})`);
    stairs.push([rat(0), rat(0)]);
    for (let i = 1; i <= n; i++) { stairs.push([rat(i), qMul(rat(i - 1), rate)]); stairs.push([rat(i), qMul(rat(i), rate)]); }
    const end = stairs[stairs.length - 1]!;
    // every step is 1 across and b/a up, so the staircase ends ON the line: (n, n·b/a) is n·(1 : b/a)
    check(qEq(qDiv(end[1], end[0]), rate), NAME, 'the staircase does not land on the line');
    if (!pts.some(p => eqPt(p, end[0], end[1]))) add('stairs', end[0], end[1], 'on');
  }
  // every multiple and every "on" point really is on the line (by construction; this guards future changes)
  pts.forEach(p => { if (p.kind !== 'off') check(p.gap.p === 0, NAME, `point '${p.id}' should be on the line`); });
  const fitX = Math.max(qNum(a) * 1.5, ...pts.map(p => qNum(p.x))), fitY = Math.max(qNum(b) * 1.5, ...pts.map(p => qNum(p.y)));
  const xMax = P.xMax ?? Math.ceil(fitX * 1.1 + 0.4), yMax = P.yMax ?? Math.ceil(fitY * 1.1 + 0.4);
  check(Number.isFinite(xMax) && xMax > 0 && Number.isFinite(yMax) && yMax > 0, NAME, 'xMax and yMax must be more than 0');
  check(xMax <= GRAPH_MAX_UNITS && yMax <= GRAPH_MAX_UNITS, NAME, `at most ${GRAPH_MAX_UNITS} units per axis (got ${xMax} × ${yMax})`);
  pts.forEach(p => check(qNum(p.x) <= xMax && qNum(p.y) <= yMax, NAME, `point '${p.id}' (${qStr(p.x)}, ${qStr(p.y)}) is outside the axes (0..${xMax}, 0..${yMax})`));
  return { a, b, rate, points: pts, stairs, xMax, yMax };
}

// ---------- shape comparison (rectangles from a shared corner) ----------
export interface ShapeCompare {
  /** same shape: other = base × s for one number s */ readonly same: boolean;
  /** the scale that makes the other rectangle as wide as the base */ readonly scale: Q;
  /** the other rectangle shrunk (or grown) to the base's width */ readonly shrunk: readonly [Q, Q];
  /** shrunk height minus base height (0 when the shape is the same) */ readonly gap: Q;
  /** the other is closer to a square than the base */ readonly squarer: boolean;
  readonly diff: readonly [Q, Q]; readonly times: readonly [Q, Q];
}
/** compare the shape of a w × h rectangle with a base rectangle (both from the same corner) */
export function compareShapes(base: readonly [number, number], other: readonly [number, number]): ShapeCompare {
  const [bw, bh] = base.map((v, i) => friendly(v, NAME, `base ${i ? 'height' : 'width'}`)) as [Q, Q];
  const [ow, oh] = other.map((v, i) => friendly(v, NAME, `other ${i ? 'height' : 'width'}`)) as [Q, Q];
  const scale = qDiv(bw, ow), shrunk = [bw, qMul(oh, scale)] as const;
  const gap = rat(shrunk[1].p * bh.q - bh.p * shrunk[1].q, shrunk[1].q * bh.q);
  const sq = (w: Q, h: Q) => Math.abs(Math.log(qNum(h) / qNum(w)));
  const d = (w: Q, h: Q) => rat(h.p * w.q - w.p * h.q, h.q * w.q);
  return { same: gap.p === 0, scale, shrunk, gap, squarer: sq(ow, oh) < sq(bw, bh) - 1e-12, diff: [d(bw, bh), d(ow, oh)], times: [qDiv(bh, bw), qDiv(oh, ow)] };
}

// ---------- views ----------
export interface Mapper extends GraphView {
  px(x: number, y: number): Pt;
}
export const mapper = (v: GraphView): Mapper => ({ ...v, px: (x, y) => [v.origin[0] + x * v.unit, v.origin[1] - y * v.unit] });
/** a camera move between two views (zoom geometric, so it feels even) */
export function lerpView(A: GraphView, B: GraphView, k: number): GraphView {
  const e = clamp(k);
  const unit = A.unit * Math.pow(B.unit / A.unit, e);
  // keep the zoom anchored: interpolate the origin so a fixed data point moves on a straight path
  return { unit, origin: [lerp(A.origin[0], B.origin[0], e), lerp(A.origin[1], B.origin[1], e)], xMax: lerp(A.xMax, B.xMax, e), yMax: lerp(A.yMax, B.yMax, e) };
}

export interface RectStyle {
  /** stroke of the bottom (width) and left (height) sides; default the two amount roles */
  readonly bottom?: Paint; readonly left?: Paint; readonly rest?: Paint;
  readonly fill?: Paint | null; readonly fillAlpha?: number; readonly alpha?: number; readonly lw?: number;
  readonly dash?: readonly number[] | null; readonly glow?: number; readonly glowCol?: Paint;
}
export interface RectProgress { bottom: number; left: number; close: number; fill: number }
export interface PointStyle { readonly col?: Paint; readonly r?: number; readonly glow?: number; readonly alpha?: number; readonly ring?: Paint }
export interface CoordStyle { readonly x?: boolean; readonly y?: boolean; readonly guides?: boolean; readonly alpha?: number; readonly glow?: number }

export interface RatioGraphBlock extends Block<RatioGraphStep> {
  readonly maths: RatioGraphMaths;
  readonly numSize: number; readonly nameSize: number;
  /** a named view (default: the fitted one) */
  view(name?: string): GraphView;
  /** a camera move between two named views */
  lerp(from: string, to: string, k: number): GraphView;
  point(id: string): GraphPoint;
  /** the line's height at x */
  lineAt(x: number): number;
  /** axis-label anchors (label boxes) for a value in a view */
  xLabelBox(m: Mapper, v: Q): Box;
  yLabelBox(m: Mapper, v: Q): Box;
  // painters (all pure: (canvas, mapper, progress, style))
  grid(c: Canvas, m: Mapper, k: number, alpha?: number): void;
  axes(c: Canvas, m: Mapper, kx: number, ky: number, o?: { names?: boolean; ticks?: boolean; alpha?: number }): void;
  rect(c: Canvas, m: Mapper, w: number, h: number, k: number | RectProgress, s?: RectStyle): void;
  segment(c: Canvas, m: Mapper, from: readonly [number, number], to: readonly [number, number], k: number, s?: { col?: Paint; lw?: number; dash?: readonly number[] | null; glow?: number; alpha?: number }): void;
  line(c: Canvas, m: Mapper, k: number, s?: { glow?: number; alpha?: number; lw?: number; from?: number }): void;
  dot(c: Canvas, m: Mapper, x: number, y: number, k: number, s?: PointStyle): void;
  coords(c: Canvas, m: Mapper, x: Q, y: Q, k: number, s?: CoordStyle): void;
  gap(c: Canvas, m: Mapper, id: string, k: number, alpha?: number): void;
  ray(c: Canvas, m: Mapper, id: string, k: number, alpha?: number): void;
  stairsDraw(c: Canvas, m: Mapper, k: number, alpha?: number): void;
  direction(c: Canvas, m: Mapper, k: number, glow?: number): void;
  originMark(c: Canvas, m: Mapper, k: number, glow?: number): void;
  draw(c: Canvas, p: Progress<RatioGraphStep>, v?: GraphView): void;
}

export function RatioGraph(P: RatioGraphParams, f: Frame, th: Theme): RatioGraphBlock {
  const M = computeRatioGraph(P);
  const [rA, rB] = P.roles ?? (['first', 'second'] as const), acc: Role = P.accent ?? 'link', bad: Role = P.wrong ?? 'wrong';
  const numSize = Math.max(th.font.minNum, 64), nameSize = Math.max(th.font.minLabel, th.font.label);
  const names = P.labels ? [tex(`\\text{${P.labels[0]}}`), tex(`\\text{${P.labels[1]}}`)] as const : null;
  const rateN = qNum(M.rate);
  // ---- default view: fit the frame, room for the labels ----
  const fracSize = Math.max(numSize, Math.ceil(th.font.minNum / 0.7));
  const labW = Math.max(60, ...M.points.map(p => texBox(tex(qTex(p.y)), 0, 0, { size: p.y.q === 1 ? numSize : fracSize }).w));
  const labH = Math.max(50, ...M.points.map(p => texBox(tex(qTex(p.x)), 0, 0, { size: p.x.q === 1 ? numSize : fracSize }).h));
  const padL = 24 + labW + 12, padB = 22 + labH + 10, padT = names ? 84 : 36, padR = names ? Math.max(60, 40 + texBox(names[0], 0, 0, { size: nameSize }).w) : 40;
  const unitFit = Math.min((f.w - padL - padR) / M.xMax, (f.h - padT - padB) / M.yMax);
  check(P.views !== undefined || unitFit >= 18, NAME, `${M.xMax} × ${M.yMax} units do not fit in ${Math.round(f.w)} × ${Math.round(f.h)} px (a unit would be ${Math.round(unitFit)} px, minimum 18)`);
  const fitted: GraphView = { unit: unitFit, origin: [f.x + padL, f.y + padT + unitFit * M.yMax], xMax: M.xMax, yMax: M.yMax };
  // named views replace the fitted one (the first named view is the default); every view in use is checked
  const views: Record<string, GraphView> = P.views && Object.keys(P.views).length ? { ...P.views } : { default: fitted };
  const def: GraphView = Object.values(views)[0]!;

  // ---- labels ----
  const labF = new Map<string, Formula>();
  const labOf = (v: Q) => { const s = qTex(v); let F = labF.get(s); if (!F) { F = tex(s); labF.set(s, F); } return F; };
  // a mixed number's small digits are set at ~71 % (script style): its label is bigger so they stay >= minNum
  const sizeOf = (v: Q) => (v.q === 1 ? numSize : fracSize);
  const XO = (v: Q) => ({ size: sizeOf(v), align: 'center' as const, valign: 'top' as const });
  const YO = (v: Q) => ({ size: sizeOf(v), align: 'right' as const, valign: 'middle' as const });
  const xLabelAt = (m: Mapper, v: Q): Pt => [m.px(qNum(v), 0)[0], m.origin[1] + 22];
  const yLabelAt = (m: Mapper, v: Q): Pt => [m.origin[0] - 24, m.px(0, qNum(v))[1]];
  const xLabelBox = (m: Mapper, v: Q) => { const [x, y] = xLabelAt(m, v); return texBox(labOf(v), x, y, XO(v)); };
  const yLabelBox = (m: Mapper, v: Q) => { const [x, y] = yLabelAt(m, v); return texBox(labOf(v), x, y, YO(v)); };
  const xNameAt = (m: Mapper): Pt => [m.px(m.xMax, 0)[0] + 34, m.origin[1]];
  const yNameAt = (m: Mapper): Pt => [m.origin[0], m.px(0, m.yMax)[1] - 40];
  const lineEnd = (m: Mapper): number => Math.min(m.xMax, m.yMax / rateN);   // the line leaves the view here (x)

  // ---- readability rules, for every view ----
  for (const [vn, v] of Object.entries(views)) {
    check(v.unit > 0 && v.xMax > 0 && v.yMax > 0, NAME, `view '${vn}' needs unit, xMax and yMax more than 0`);
    const m = mapper(v);
    const inView = M.points.filter(p => qNum(p.x) <= v.xMax + 1e-9 && qNum(p.y) <= v.yMax + 1e-9);
    const boxes: Box[] = [];
    const lines: Pt[][] = [[m.px(0, 0), m.px(v.xMax, 0)], [m.px(0, 0), m.px(0, v.yMax)], [m.px(0, 0), m.px(lineEnd(m), lineEnd(m) * rateN)]];
    const xs = [...new Map(inView.map(p => [qStr(p.x), p.x])).values()].sort((u, w) => qNum(u) - qNum(w));
    const ys = [...new Map(inView.map(p => [qStr(p.y), p.y])).values()].sort((u, w) => qNum(u) - qNum(w));
    const xb = xs.map(x => xLabelBox(m, x)), yb = ys.map(y => yLabelBox(m, y));
    for (let i = 1; i < xb.length; i++) check(xb[i - 1]!.x1 + 16 <= xb[i]!.x0, NAME, `view '${vn}': labels ${qStr(xs[i - 1]!)} and ${qStr(xs[i]!)} across would overlap (zoom in or use fewer points)`);
    for (let i = 1; i < yb.length; i++) check(yb[i]!.y1 + 12 <= yb[i - 1]!.y0, NAME, `view '${vn}': labels ${qStr(ys[i - 1]!)} and ${qStr(ys[i]!)} up would overlap (zoom in or use fewer points)`);
    boxes.push(...xb, ...yb);
    if (names) {
      const [nx, ny] = xNameAt(m), [mx, my] = yNameAt(m);
      boxes.push(texBox(names[0], nx, ny, { size: nameSize, align: 'left' }), texBox(names[1], mx, my, { size: nameSize, align: 'center' }));
    }
    boxes.forEach(bx => check(!hitsLines(bx, lines, 4), NAME, `view '${vn}': a label would sit on a line`));
    const all = unionBox([...boxes, box(v.origin[0], v.origin[1] - v.yMax * v.unit, v.origin[0] + v.xMax * v.unit, v.origin[1])]);
    check(all.x0 >= f.x - 1 && all.y0 >= f.y - 1 && all.x1 <= f.x + f.w + 1 && all.y1 <= f.y + f.h + 1, NAME,
      `view '${vn}' does not fit the frame (content ${Math.round(all.x0)}..${Math.round(all.x1)} × ${Math.round(all.y0)}..${Math.round(all.y1)})`);
  }

  const pointById = (id: string): GraphPoint => {
    const p = M.points.find(q => q.id === id);
    check(p, NAME, `no point '${id}' (points: ${M.points.map(q => q.id).join(', ')})`);
    return p;
  };
  const ordered: RatioGraphStep[] = ['grid', 'xAxis', 'yAxis'];
  M.points.forEach(p => { if (p.kind === 'multiple') ordered.push(`rect:${p.id}`, `pt:${p.id}`); });
  ordered.push('line', 'origin', 'dir');
  M.points.forEach(p => { if (p.kind !== 'multiple') ordered.push(`pt:${p.id}`); if (p.kind === 'off') ordered.push(`gap:${p.id}`, `ray:${p.id}`); });
  if (M.stairs.length) ordered.push('stairs');

  // ---- painters ----
  const lwAxis = th.lw.thin + 0.5;
  const grid = (c: Canvas, m: Mapper, k: number, alpha = 1) => {
    if (k <= 0) return;
    const col = paint(th, 'faint', 'line'), a = 0.42 * alpha;
    for (let i = 1; i <= Math.floor(m.xMax + 1e-9); i++) drawOn(c, [m.px(i, 0), m.px(i, m.yMax)], clamp(k * 1.6 - (i / m.xMax) * 0.6), { col, lw: th.lw.hair, alpha: a });
    for (let j = 1; j <= Math.floor(m.yMax + 1e-9); j++) drawOn(c, [m.px(0, j), m.px(m.xMax, j)], clamp(k * 1.6 - (j / m.yMax) * 0.6), { col, lw: th.lw.hair, alpha: a });
  };
  const axes = (c: Canvas, m: Mapper, kx: number, ky: number, o: { names?: boolean; ticks?: boolean; alpha?: number } = {}) => {
    const al = o.alpha ?? 1;
    c.g.save(); c.g.globalAlpha *= clamp(al);
    if (kx > 0) {
      arrow(c, [m.px(0, 0), m.px(m.xMax + 0.25 * 66 / m.unit, 0)], clamp(kx / 0.8), { col: 'ink', lw: lwAxis, head: 18 });
      if (o.ticks !== false) for (let i = 1; i <= Math.floor(m.xMax + 1e-9); i++) {
        const [x, y] = m.px(i, 0);
        drawOn(c, [[x, y - 9], [x, y + 9]], clamp(kx * 1.5 - (i / m.xMax) * 0.9), { col: 'dim', lw: th.lw.thin });
      }
      if (names && o.names !== false) texDraw(c, names[0], ...xNameAt(m), { size: nameSize, align: 'left', col: rA, k: clamp((kx - 0.5) / 0.5) });
    }
    if (ky > 0) {
      arrow(c, [m.px(0, 0), m.px(0, m.yMax + 0.25 * 66 / m.unit)], clamp(ky / 0.8), { col: 'ink', lw: lwAxis, head: 18 });
      if (o.ticks !== false) for (let j = 1; j <= Math.floor(m.yMax + 1e-9); j++) {
        const [x, y] = m.px(0, j);
        drawOn(c, [[x - 9, y], [x + 9, y]], clamp(ky * 1.5 - (j / m.yMax) * 0.9), { col: 'dim', lw: th.lw.thin });
      }
      if (names && o.names !== false) texDraw(c, names[1], ...yNameAt(m), { size: nameSize, align: 'center', col: rB, k: clamp((ky - 0.5) / 0.5) });
    }
    c.g.restore();
  };
  /** a rectangle from the origin: the bottom (first amount) and left (second amount) sides draw out of the corner,
   *  then the top and right sides close it at the far corner, then a soft fill */
  const rect = (c: Canvas, m: Mapper, w: number, h: number, k: number | RectProgress, s: RectStyle = {}) => {
    const kp: RectProgress = typeof k === 'number'
      ? { bottom: clamp(k / 0.4), left: clamp(k / 0.4), close: clamp((k - 0.3) / 0.45), fill: E.inOut(clamp((k - 0.5) / 0.5)) }
      : k;
    const al = s.alpha ?? 1;
    if (al <= 0) return;
    const O = m.px(0, 0), X = m.px(w, 0), Y = m.px(0, h), C = m.px(w, h);
    const lw = s.lw ?? th.lw.base, dash = s.dash ?? null;
    c.g.save(); c.g.globalAlpha *= clamp(al);
    if (s.fill !== null && kp.fill > 0) fillPts(c, [O, X, C, Y], s.fill ?? acc, kp.fill * (s.fillAlpha ?? 0.14));
    const g = s.glow ? { glow: s.glow, glowCol: s.glowCol ?? acc } : {};
    const rest = s.rest ?? 'dim';
    if (kp.close > 0) {
      drawOn(c, [Y, C], kp.close, { col: rest, lw, dash, cap: dash ? 'butt' : 'round', ...g });
      drawOn(c, [X, C], kp.close, { col: rest, lw, dash, cap: dash ? 'butt' : 'round', ...g });
    }
    drawOn(c, [O, X], kp.bottom, { col: s.bottom ?? rA, lw: lw + 1, dash, cap: dash ? 'butt' : 'round', ...g });
    drawOn(c, [O, Y], kp.left, { col: s.left ?? rB, lw: lw + 1, dash, cap: dash ? 'butt' : 'round', ...g });
    c.g.restore();
  };
  const segment = (c: Canvas, m: Mapper, a: readonly [number, number], b: readonly [number, number], k: number, s: { col?: Paint; lw?: number; dash?: readonly number[] | null; glow?: number; alpha?: number } = {}) => {
    drawOn(c, [m.px(a[0], a[1]), m.px(b[0], b[1])], k, { col: s.col ?? acc, lw: s.lw ?? th.lw.base, dash: s.dash ?? null, cap: s.dash ? 'butt' : 'round', alpha: s.alpha ?? 1, ...(s.glow ? { glow: s.glow, glowCol: s.col ?? acc } : {}) });
  };
  const line = (c: Canvas, m: Mapper, k: number, s: { glow?: number; alpha?: number; lw?: number; from?: number } = {}) => {
    const x1 = lineEnd(m), x0 = s.from ?? 0;
    segment(c, m, [x0, x0 * rateN], [x1, x1 * rateN], k, { col: acc, lw: s.lw ?? th.lw.bold - 1, glow: s.glow ?? 0, alpha: s.alpha ?? 1 });
  };
  const dot = (c: Canvas, m: Mapper, x: number, y: number, k: number, s: PointStyle = {}) => {
    if (k <= 0 || (s.alpha ?? 1) <= 0) return;
    const [px, py] = m.px(x, y), col = s.col ?? acc, r = (s.r ?? 12) * E.back(clamp(k), 2.2);
    c.g.save(); c.g.globalAlpha *= clamp(s.alpha ?? 1) * clamp(k * 3);
    halo(c, px, py, 46 + 20 * (s.glow ?? 0), col, 0.35 + 0.35 * (s.glow ?? 0));
    if (s.glow) glowOn(c, paint(th, col, 'fill'), 14 * s.glow);
    fillPts(c, circlePts(px, py, Math.max(0.1, r), 40), col, 1);
    c.g.restore();
    c.g.save(); c.g.globalAlpha *= clamp(s.alpha ?? 1) * clamp(k * 3);
    strokePts(c, circlePts(px, py, Math.max(0.1, r), 40), { col: s.ring ?? paint(th, col, 'line'), lw: 2.5, closed: true });
    c.g.restore();
  };
  const coords = (c: Canvas, m: Mapper, x: Q, y: Q, k: number, s: CoordStyle = {}) => {
    if (k <= 0) return;
    const al = s.alpha ?? 1, P0 = m.px(qNum(x), qNum(y));
    c.g.save(); c.g.globalAlpha *= clamp(al);
    if (s.guides !== false) {
      const kg = clamp(k / 0.6);
      if (s.x !== false) dashLine(c, P0, [P0[0], P0[1] + (m.origin[1] - P0[1]) * kg], { col: 'faint', lw: th.lw.thin, dash: [9, 9] });
      if (s.y !== false) dashLine(c, P0, [P0[0] + (m.origin[0] - P0[0]) * kg, P0[1]], { col: 'faint', lw: th.lw.thin, dash: [9, 9] });
    }
    const kl = clamp((k - 0.35) / 0.65), gl = s.glow ?? 0;
    if (s.x !== false) texDraw(c, labOf(x), ...xLabelAt(m, x), { ...XO(x), col: rA, k: kl, glow: gl, glowCol: rA });
    if (s.y !== false) texDraw(c, labOf(y), ...yLabelAt(m, y), { ...YO(y), col: rB, k: kl, glow: gl, glowCol: rB });
    c.g.restore();
  };
  const gap = (c: Canvas, m: Mapper, id: string, k: number, alpha = 1) => {
    const p = pointById(id);
    if (k <= 0 || p.kind !== 'off') return;
    const x = qNum(p.x), y = qNum(p.y), ly = qNum(p.lineY);
    const A = m.px(x, y), B = m.px(x, ly), dir = Math.sign(B[1] - A[1]) || 1;
    c.g.save(); c.g.globalAlpha *= clamp(alpha);
    drawOn(c, [[A[0], A[1] + dir * 16], [B[0], B[1] - dir * 12]], k, { col: bad, lw: th.lw.base, dash: [7, 8], cap: 'butt' });
    const tw = 12;
    drawOn(c, [[B[0] - tw, B[1]], [B[0] + tw, B[1]]], clamp(k * 2 - 1), { col: bad, lw: th.lw.base });
    c.g.restore();
  };
  const ray = (c: Canvas, m: Mapper, id: string, k: number, alpha = 1) => {
    const p = pointById(id);
    if (k <= 0) return;
    const r = qNum(p.times), x1 = Math.min(m.xMax, m.yMax / r);
    segment(c, m, [0, 0], [x1, x1 * r], k, { col: p.kind === 'off' ? bad : acc, lw: th.lw.thin + 0.5, dash: [14, 10], alpha });
  };
  const stairsDraw = (c: Canvas, m: Mapper, k: number, alpha = 1) => {
    const S = M.stairs;
    if (k <= 0 || S.length < 2) return;
    const n = S.length - 1;
    c.g.save(); c.g.globalAlpha *= clamp(alpha);
    for (let i = 0; i < n; i++) {
      const a = S[i]!, b = S[i + 1]!, horiz = qEq(a[1], b[1]);
      const kk = clamp(k * n - i);
      if (kk <= 0) break;
      drawOn(c, [m.px(qNum(a[0]), qNum(a[1])), m.px(qNum(b[0]), qNum(b[1]))], kk, { col: horiz ? rA : rB, lw: th.lw.bold });
    }
    c.g.restore();
  };
  const direction = (c: Canvas, m: Mapper, k: number, glow = 0) => {
    if (k <= 0) return;
    const x1 = Math.min(qNum(M.a), lineEnd(m) * 0.9);
    arrow(c, [m.px(0, 0), m.px(x1, x1 * rateN)], k, { col: acc, lw: th.lw.heavy, head: 34, glow: 16 * glow, glowCol: acc });
  };
  const zero = tex('0');
  const originMark = (c: Canvas, m: Mapper, k: number, glow = 0) => {
    if (k <= 0) return;
    const [x, y] = m.px(0, 0);
    halo(c, x, y, 60, acc, 0.5 * k + 0.4 * glow);
    dot(c, m, 0, 0, k, { col: acc, r: 10, glow });
    texDraw(c, zero, x - 24, y + 22, { size: numSize, align: 'right', valign: 'top', col: 'dim', k });
  };

  const drawAll = (c: Canvas, p: Progress<RatioGraphStep>, v?: GraphView) => {
    const m = mapper(v ?? def);
    grid(c, m, p.k('grid'));
    axes(c, m, p.k('xAxis'), p.k('yAxis'));
    // rectangles from the origin, then their corner points
    for (const q of M.points) {
      if (q.kind !== 'multiple') continue;
      const kr = p.k(`rect:${q.id}`), kp = p.k(`pt:${q.id}`);
      rect(c, m, qNum(q.x), qNum(q.y), kr, { alpha: 1 - 0.7 * kp });
    }
    line(c, m, p.k('line'), { glow: 8 * E.bump(p.k('dir')) });
    originMark(c, m, p.k('origin'));
    direction(c, m, p.k('dir'), E.bump(p.k('dir')));
    for (const q of M.points) {
      if (q.kind === 'off') { ray(c, m, q.id, p.k(`ray:${q.id}`)); gap(c, m, q.id, p.k(`gap:${q.id}`)); }
    }
    stairsDraw(c, m, p.k('stairs'));
    for (const q of M.points) {
      const kp = p.k(`pt:${q.id}`);
      if (kp <= 0) continue;
      coords(c, m, q.x, q.y, kp);
      dot(c, m, qNum(q.x), qNum(q.y), kp, { col: q.kind === 'off' ? bad : acc });
    }
  };

  const allBox = unionBox(Object.values(views).map(v => box(v.origin[0] - padL, v.origin[1] - v.yMax * v.unit - padT, v.origin[0] + v.xMax * v.unit + padR, v.origin[1] + padB)));
  const viewOf = (name?: string): GraphView => {
    if (name === undefined) return def;
    const v = views[name];
    check(v, NAME, `no view '${name}' (views: ${Object.keys(views).join(', ')})`);
    return v;
  };
  return {
    kind: NAME, steps: ordered, box: allBox, maths: M, numSize, nameSize,
    view: viewOf,
    lerp: (from: string, to: string, k: number) => lerpView(viewOf(from), viewOf(to), E.smooth(clamp(k))),
    point: pointById,
    lineAt: (x: number) => x * rateN,
    xLabelBox, yLabelBox,
    grid, axes, rect, segment, line, dot, coords, gap, ray, stairsDraw, direction, originMark,
    draw: drawAll,
  };
}

/** a friendly number or throw (for scene code that builds points from arithmetic) */
export const graphQ = (x: number): Q => { const q = toQ(x); check(q !== null, NAME, `${x} is not a friendly number`); return q; };

/** gallery: defaults + sliders */
export const GRAPH_DEMO = {
  params: { a: 2, b: 3, ks: [1, 2, 3, 4], others: [{ x: 4, y: 5, id: 'add' }], unit: true, stairs: 5, labels: ['orange', 'green'] } satisfies RatioGraphParams,
  specs: [
    { key: 'a', label: 'a (across)', min: 0, max: 6, step: 1 },
    { key: 'b', label: 'b (up)', min: 0, max: 6, step: 1 },
    { key: 'multiples', label: 'points on the line', min: 0, max: 6, step: 1 },
    { key: 'add', label: 'off point: a+n : b+n (n)', min: 0, max: 4, step: 1 },
    { key: 'stairs', label: 'unit steps', min: 0, max: 8, step: 1 },
  ] as const satisfies readonly ParamSpec<{ a: number; b: number; multiples: number; add: number; stairs: number }>[],
};
export const graphDemoParams = (v: { a: number; b: number; multiples: number; add: number; stairs: number }): RatioGraphParams => ({
  a: v.a, b: v.b, ks: Array.from({ length: v.multiples }, (_, i) => i + 1), labels: ['orange', 'green'], unit: true,
  others: v.add > 0 ? [{ x: v.a + v.add, y: v.b + v.add, id: 'add' }] : [],
  ...(v.stairs > 0 ? { stairs: v.stairs } : {}),
});
