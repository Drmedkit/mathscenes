// Sketch: a figure made of named points (any picture of this topic that is not a plane or squares on sides): a right
// triangle inside a rectangle, a ladder against a wall, a box in an oblique drawing with its hidden edges dashed, the
// converse proof (a constructed right triangle that turns and slides onto the given one). Plain data in, so items
// can describe a picture without touching the canvas.
//   polys    washes (the objects), segs: crisp lines (dashed = hidden or helper), rights: right-angle marks,
//   angles   an arc with a label inside it ("?"), verts: corner letters, labels: TeX next to a segment (never on a
//            line: the other side is tried, else the layout throws), groups: a set of elements that turns about a
//            point and slides (k from a step key) - the converse proof's "lay one triangle on the other".
// Every element may name a step (its key drives it 0..1) and a glow key. The layout fits the points and every
// label into the frame and throws (BlockError) when a label would sit on a line or on another label.
import { type Box, type Pt, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { moveAt } from './theoremMaths';

export interface SkPoly { pts: string[]; col: Paint; step?: string; alpha?: number; group?: string; glow?: string }
export interface SkSeg { a: string; b: string; col: Paint; w?: number; dash?: boolean; step?: string; group?: string; glow?: string }
export interface SkRight { at: string; a: string; b: string; step?: string; group?: string; glow?: string }
export interface SkAngle { at: string; a: string; b: string; t: string; step?: string; col?: Paint }
export interface SkVert { at: string; t: string; step?: string; group?: string }
export interface SkLabel {
  a: string; b: string; t: string; col: Paint; step?: string; group?: string;
  /** the label is placed on the side of the segment away from this point (default: the middle of the figure) */
  ref?: string;
  /** the label changes to t2 at step2 */
  t2?: string; step2?: string;
  /** a 0..1 key that hides the label (the kid has to find it) */
  hide?: string;
}
export interface SkGroup { id: string; key: string; about: string; rot: number; dx: number; dy: number }
export interface SketchSpec {
  /** points in units, y up */
  pts: Record<string, Pt>;
  polys?: SkPoly[]; segs?: SkSeg[]; rights?: SkRight[]; angles?: SkAngle[]; verts?: SkVert[]; labels?: SkLabel[];
  groups?: SkGroup[];
  /** TeX centred on a point (an area inside a square) */
  texts?: { at: string; t: string; col?: Paint; step?: string; size?: number }[];
  /** extra polylines (point names) drawn thin in cream, e.g. a projected 3-D right-angle mark */
  marks?: { pts: string[]; step?: string; glow?: string }[];
  maxUnit?: number;
}
export interface SketchBlock {
  readonly kind: 'Sketch';
  readonly u: number;
  readonly where: { all: Box; pt(n: string): Box; seg(a: string, b: string): Box; label(i: number): Box };
  draw(c: Canvas, P: Progress<string>, glow?: (key: string) => number): void;
}

const NAME = 'Sketch', LABEL = 60, VERT = 52, ANG = 56, PAD = 18;

export function Sketch(sp: SketchSpec, fr: Frame, th: Theme): SketchBlock {
  const names = Object.keys(sp.pts);
  check(names.length >= 2, NAME, 'a sketch needs points');
  const P0 = (n: string): Pt => { const p = sp.pts[n]; check(!!p, NAME, `no point ${n}`); return p!; };
  const groups = new Map((sp.groups ?? []).map(g => [g.id, g]));
  const xs = names.map(n => P0(n)[0]), ys = names.map(n => P0(n)[1]);
  const ux0 = Math.min(...xs), ux1 = Math.max(...xs), uy0 = Math.min(...ys), uy1 = Math.max(...ys);
  const cU: Pt = [(ux0 + ux1) / 2, (uy0 + uy1) / 2];
  let u = sp.maxUnit ?? 110, ox = 0, oy = 0;
  const at = (q: Pt): Pt => [ox + q[0] * u, oy - q[1] * u];
  const fb = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const F = (s: string) => tex(s) as Formula;
  const FL = (sp.labels ?? []).map(l => F(l.t)), FL2 = (sp.labels ?? []).map(l => (l.t2 ? F(l.t2) : null));
  const FV = (sp.verts ?? []).map(v => F(v.t)), FA = (sp.angles ?? []).map(a => F(a.t)), FT = (sp.texts ?? []).map(t => F(t.t));
  const segPx = (): Pt[][] => [
    ...(sp.segs ?? []).filter(s => !s.group).map(s => [at(P0(s.a)), at(P0(s.b))]),
    ...(sp.polys ?? []).filter(p => !p.group).map(p => [...p.pts.map(n => at(P0(n))), at(P0(p.pts[0]!))]),
  ];
  const sizeOf = (Fm: Formula, size: number) => { const b = texBox(Fm, 0, 0, { size, align: 'center' }); return [b.w, b.h] as const; };
  const placeAway = (mid: Pt, nx: number, ny: number, w: number, h: number): Box => {
    const d = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2 + PAD;
    const cx = mid[0] + nx * d, cy = mid[1] + ny * d;
    return box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  };
  let labBoxes: Box[] = [], vertBoxes: Box[] = [], angBoxes: Box[] = [];
  const layout = (): string => {
    const lines = segPx();
    labBoxes = (sp.labels ?? []).map((l, i) => {
      const p = at(P0(l.a)), q = at(P0(l.b)), mid: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      let nx = -(q[1] - p[1]), ny = q[0] - p[0];
      const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
      const ref = at(l.ref ? P0(l.ref) : cU);
      if ((ref[0] - mid[0]) * nx + (ref[1] - mid[1]) * ny > 0) { nx = -nx; ny = -ny; }
      const ws = [FL[i]!, FL2[i]].filter((x): x is Formula => !!x).map(Fm => sizeOf(Fm, LABEL));
      const w = Math.max(...ws.map(s => s[0])), h = Math.max(...ws.map(s => s[1]));
      const out = placeAway(mid, nx, ny, w, h);
      if (l.group || !hitsLines(out, lines, 4)) return out;
      const inn = placeAway(mid, -nx, -ny, w, h);
      return hitsLines(inn, lines, 4) ? out : inn;
    });
    vertBoxes = (sp.verts ?? []).map((v, i) => {
      const p = at(P0(v.at)), c = at(cU);
      const a0 = Math.atan2(p[1] - c[1], p[0] - c[0]);
      const [w, h] = sizeOf(FV[i]!, VERT);
      // straight out from the middle of the figure, else turned a little at a time until no line runs through it
      const cands = [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.2, -2.2].map(t => placeAway(p, Math.cos(a0 + t), Math.sin(a0 + t), w, h));
      return cands.find(b => !hitsLines(b, lines, 3)) ?? cands[0]!;
    });
    angBoxes = (sp.angles ?? []).map((a, i) => {
      const v = at(P0(a.at)), p = at(P0(a.a)), q = at(P0(a.b));
      const d1 = Math.atan2(p[1] - v[1], p[0] - v[0]), d2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
      const bx = Math.cos(d1) + Math.cos(d2), by = Math.sin(d1) + Math.sin(d2), n = Math.hypot(bx, by) || 1;
      const [w, h] = sizeOf(FA[i]!, ANG), r = 66 + Math.max(w, h) / 2;
      const cx = v[0] + (bx / n) * r, cy = v[1] + (by / n) * r;
      return box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    });
    const all = [...labBoxes, ...vertBoxes, ...angBoxes, ...names.map(nm => { const p = at(P0(nm)); return box(p[0], p[1], p[0], p[1]); })];
    const U = unionBox(all);
    if (U.x0 < fb.x0 || U.x1 > fb.x1 || U.y0 < fb.y0 || U.y1 > fb.y1) return 'outside the frame';
    return '';
  };
  let why = '';
  for (let it = 0; it < 60; it++) {
    u = Math.min(u, (fr.w - 60) / Math.max(1e-6, ux1 - ux0), (fr.h - 60) / Math.max(1e-6, uy1 - uy0));
    ox = fr.x + fr.w / 2 - cU[0] * u; oy = fr.y + fr.h / 2 + cU[1] * u;
    why = layout();
    if (!why) {
      // re-centre on everything that is drawn (labels included), then check once more
      const U = unionBox([...labBoxes, ...vertBoxes, ...angBoxes, ...names.map(nm => { const p = at(P0(nm)); return box(p[0], p[1], p[0], p[1]); })]);
      ox += fb.cx - U.cx; oy += fb.cy - U.cy;
      why = layout();
      if (!why) break;
    }
    u *= 0.95;
    check(u >= 18, NAME, why);
  }
  check(!why, NAME, why);
  // labels never on a line, never on each other
  const lines = segPx();
  (sp.labels ?? []).forEach((l, i) => { if (!l.group) check(!hitsLines(labBoxes[i]!, lines, 2), NAME, `label ${l.t} sits on a line`); });
  const free = [...labBoxes.filter((_, i) => !(sp.labels ?? [])[i]!.group), ...vertBoxes, ...angBoxes];
  for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
    const a = free[i]!, b = free[j]!;
    check(!(a.x0 < b.x1 - 4 && b.x0 < a.x1 - 4 && a.y0 < b.y1 - 4 && b.y0 < a.y1 - 4), NAME, 'two labels overlap');
  }

  // ---------- painters ----------
  const gk = (P: Progress<string>, g?: string) => { if (!g) return 0; const G = groups.get(g); return G ? clamp(P.k(G.key)) : 0; };
  const pos = (n: string, P: Progress<string>, g?: string): Pt => {
    const p = P0(n);
    if (!g) return at(p);
    const G = groups.get(g)!;
    return at(moveAt(p, P0(G.about), G.rot, G.dx, G.dy, gk(P, g)));
  };
  const kOf = (P: Progress<string>, s?: string) => (s ? clamp(P.k(s)) : 1);
  function rightMark(c: Canvas, r: Pt, pa: Pt, pb: Pt, k: number, glowK: number): void {
    const la = Math.hypot(pa[0] - r[0], pa[1] - r[1]), lb = Math.hypot(pb[0] - r[0], pb[1] - r[1]);
    const m = Math.min(34, 0.28 * Math.min(la, lb));
    const ua: Pt = [((pa[0] - r[0]) / la) * m, ((pa[1] - r[1]) / la) * m], ub: Pt = [((pb[0] - r[0]) / lb) * m, ((pb[1] - r[1]) / lb) * m];
    const Q: Pt[] = [[r[0] + ua[0], r[1] + ua[1]], [r[0] + ua[0] + ub[0], r[1] + ua[1] + ub[1]], [r[0] + ub[0], r[1] + ub[1]]];
    if (glowK > 0) strokePts(c, Q, { col: 'pick', lw: 8, alpha: clamp(glowK), glow: 20, glowCol: 'pick' });
    drawOn(c, Q, k, { col: DUSK.cream, lw: 3.5 });
  }
  function draw(c: Canvas, P: Progress<string>, glow: (key: string) => number = () => 0): void {
    (sp.polys ?? []).forEach((p, i) => {
      const k = kOf(P, p.step);
      if (k <= 0) return;
      const Q = p.pts.map(n => pos(n, P, p.group));
      wash(c, Q, paint(th, p.col, 'fill'), { seed: 30 + i * 7, inkW: 2.5, rough: 1, shade: 0.22, alpha: k * (p.alpha ?? 0.9) });
      const g = p.glow ? glow(p.glow) : 0;
      if (g > 0) strokePts(c, Q, { col: p.col, lw: 7, closed: true, alpha: g, glow: 18, glowCol: p.col });
    });
    (sp.segs ?? []).forEach(s => {
      const k = kOf(P, s.step);
      if (k <= 0) return;
      const a = pos(s.a, P, s.group), b = pos(s.b, P, s.group);
      const g = s.glow ? glow(s.glow) : 0;
      if (g > 0) strokePts(c, [a, b], { col: s.col, lw: (s.w ?? 5) + 5, alpha: g, glow: 20, glowCol: s.col });
      drawOn(c, [a, b], k, { col: s.col, lw: s.w ?? 5, dash: s.dash ? [14, 11] : null, cap: s.dash ? 'butt' : 'round' });
    });
    (sp.marks ?? []).forEach(m => {
      const k = kOf(P, m.step);
      if (k <= 0) return;
      const Q = m.pts.map(n => at(P0(n)));
      const g = m.glow ? glow(m.glow) : 0;
      if (g > 0) strokePts(c, Q, { col: 'pick', lw: 8, alpha: g, glow: 20, glowCol: 'pick' });
      drawOn(c, Q, k, { col: DUSK.cream, lw: 3.5 });
    });
    (sp.rights ?? []).forEach(r => {
      const k = kOf(P, r.step);
      if (k <= 0) return;
      rightMark(c, pos(r.at, P, r.group), pos(r.a, P, r.group), pos(r.b, P, r.group), k, r.glow ? glow(r.glow) : 0);
    });
    (sp.angles ?? []).forEach((a, i) => {
      const k = kOf(P, a.step);
      if (k <= 0) return;
      const v = at(P0(a.at)), p = at(P0(a.a)), q = at(P0(a.b));
      let d1 = Math.atan2(p[1] - v[1], p[0] - v[0]), d2 = Math.atan2(q[1] - v[1], q[0] - v[0]);
      if (d2 - d1 > Math.PI) d1 += 2 * Math.PI; else if (d1 - d2 > Math.PI) d2 += 2 * Math.PI;
      const arc: Pt[] = [];
      for (let j = 0; j <= 24; j++) { const t = d1 + ((d2 - d1) * j) / 24; arc.push([v[0] + 44 * Math.cos(t), v[1] + 44 * Math.sin(t)]); }
      strokePts(c, arc, { col: a.col ?? 'pick', lw: 4, alpha: k });
      const B = angBoxes[i]!;
      texDraw(c, FA[i]!, B.cx, B.cy, { size: ANG, align: 'center', col: a.col ?? 'pick', alpha: k });
    });
    (sp.labels ?? []).forEach((l, i) => {
      const k = kOf(P, l.step) * (1 - (l.hide ? clamp(P.k(l.hide)) : 0));
      if (k <= 0) return;
      let B = labBoxes[i]!;
      if (l.group) {
        // a label that moves with its group: keep its offset from the segment's middle
        const a0 = at(P0(l.a)), b0 = at(P0(l.b)), a1 = pos(l.a, P, l.group), b1 = pos(l.b, P, l.group);
        const G = groups.get(l.group)!, t = G.rot * gk(P, l.group), cs = Math.cos(-t), sn = Math.sin(-t);
        const ox0 = B.cx - (a0[0] + b0[0]) / 2, oy0 = B.cy - (a0[1] + b0[1]) / 2;
        const cx = (a1[0] + b1[0]) / 2 + ox0 * cs - oy0 * sn, cy = (a1[1] + b1[1]) / 2 + ox0 * sn + oy0 * cs;
        B = box(cx - B.w / 2, cy - B.h / 2, cx + B.w / 2, cy + B.h / 2);
      }
      const k2 = l.t2 && l.step2 ? clamp(P.k(l.step2)) : 0;
      if (k2 < 1) texDraw(c, FL[i]!, B.cx, B.cy, { size: LABEL, align: 'center', col: l.col, alpha: k * (1 - k2) });
      if (k2 > 0) texDraw(c, FL2[i]!, B.cx, B.cy, { size: LABEL, align: 'center', col: l.col, alpha: k * k2 });
    });
    (sp.texts ?? []).forEach((t, i) => {
      const k = kOf(P, t.step);
      if (k <= 0) return;
      const q = at(P0(t.at));
      texDraw(c, FT[i]!, q[0], q[1], { size: t.size ?? LABEL, align: 'center', col: t.col ?? '#141633', alpha: k });
    });
    (sp.verts ?? []).forEach((v, i) => {
      const k = kOf(P, v.step);
      if (k <= 0) return;
      const B = vertBoxes[i]!;
      withAlpha(c, k, () => texDraw(c, FV[i]!, B.cx, B.cy, { size: VERT, align: 'center', col: 'ink' }));
    });
  }
  const ptBox = (n: string) => { const p = at(P0(n)); return box(p[0] - 18, p[1] - 18, p[0] + 18, p[1] + 18); };
  return {
    kind: 'Sketch', u,
    where: {
      all: unionBox(names.map(ptBox)),
      pt: ptBox,
      seg: (a, b) => { const p = at(P0(a)), q = at(P0(b)); return box(Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[0], q[0]), Math.max(p[1], q[1])); },
      label: i => labBoxes[i] ?? box(0, 0, 0, 0),
    },
    draw,
  };
}
