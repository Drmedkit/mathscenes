// Construction: a triangle being drawn on a sheet of dark drawing paper, the model of "draw triangles from given
// conditions". It draws what a kid draws: segments and sides, rays, compass arcs, angle marks, vertices and candidate
// points, and the instruments (ruler, protractor, compass), each mark on its own named step, in figure units (in / cm)
// scaled to fit a Frame.
//   roles  first (amber)  = a given LENGTH (a side, a stick, the compass opening that carries it)
//          second (teal)  = a given ANGLE (its arc, its value, its ray)
//          link (lime)    = what the conditions fix: the found corner, the finished triangle, the answer
//          pick (lavender)= the current focus (the arc being swung, a candidate point)
//          wrong (red)    = wrong
// Layout is pure (text widths are estimated, so tests can build every practice picture in node): labels sit next to
// the part they name (sides outside the triangle, angle values inside their wedge, letters outside the corner), never
// on a line and never on each other. When no clean place exists the block throws (BlockError) instead of squeezing.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { type Canvas, drawOn, dot, strokePts, fillPts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, mix, paint } from '../../../core/theme';
import { type Frame, BlockError, check, hitsLines } from '../../../blocks/block';
import { drawWords } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { rectPts } from '../../../core/pts';
import type { P2, Unit } from './triangleMaths';

const NAME = 'Construction';
export type Ref = string | P2;
export interface Lbl { text: string; role?: Paint; size?: number; step?: string }
interface MarkBase { id?: string; step: string; hide?: string; role?: Paint }
export type Mark = MarkBase & (
  | { kind: 'seg'; a: Ref; b: Ref; w?: number; dash?: boolean; label?: Lbl; away?: Ref; ticks?: number }
  | { kind: 'ray'; from: Ref; deg: number; len: number; w?: number }
  | { kind: 'arc'; c: Ref; r: number; from: number; to: number; w?: number }
  | { kind: 'angle'; at: Ref; p: Ref; q: Ref; label?: Lbl; right?: boolean }
  | { kind: 'vertex'; at: Ref; name: string; away?: Ref; dot?: boolean; size?: number; /** the letter's own step (default: the dot's) */ lstep?: string }
  | { kind: 'cand'; at: Ref; name: string }
  | { kind: 'ruler'; at: Ref; deg: number; start: number; len: number; inset: number; side?: 1 | -1 }
  | { kind: 'protractor'; at: Ref; deg: number; dots?: { deg: number; name: string; role?: Paint }[] }
  | { kind: 'compass'; c: Ref; r: number; from: number; to: number; sweep: string }
);
export interface Drawing {
  unit: Unit;
  pts: Record<string, P2>;
  marks: Mark[];
  /** rotate the whole figure (degrees, counter-clockwise) */
  rot?: number;
  /** mirror left-right (a flipped copy) */
  mirror?: boolean;
  /** a freehand sketch (wobbly cream ink) rather than an instrument drawing */
  freehand?: boolean;
  /** px per unit cap (default 165 px/in, 66 px/cm), or a fixed scale */
  maxScale?: number;
  scale?: number;
  /** px kept free around the geometry for labels before the fit (default 17 % of the frame, at most 120) */
  margin?: number;
}
export interface Look { focus?: Record<string, number>; dim?: number }
export interface ConstructionBlock {
  readonly kind: 'Construction';
  /** px per unit */ readonly s: number;
  readonly box: Box;
  /** the px point of a named point or a unit point */ px(r: Ref): Pt;
  /** the px box of a mark (by id), or of its label (`id:label`) */ where(id: string): Box;
  draw(c: Canvas, p: Progress, look?: Look): void;
}

// ---------- text size estimate (pure) ----------
const CW: Record<string, number> = { ' ': 0.27, '°': 0.4, '½': 0.82, '¼': 0.82, '¾': 0.82, '.': 0.28, '?': 0.5, 'm': 0.86, 'i': 0.27, 'n': 0.56, 'c': 0.5 };
export function textW(t: string, size: number): number {
  let w = 0;
  for (const ch of t) w += CW[ch] ?? (/[0-9]/.test(ch) ? 0.56 : /[A-Z]/.test(ch) ? 0.66 : 0.55);
  return w * size;
}
const textBox = (t: string, size: number, cx: number, cy: number): Box => { const w = textW(t, size) / 2 + 4, h = size * 0.44; return box(cx - w, cy - h, cx + w, cy + h); };

// ---------- geometry helpers ----------
const RULER_H = 96, PROT_R = 290, ANG_R = 56;
const unitDir = (d: number): P2 => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180)];
const norm = (x: number, y: number): Pt => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
const rot = (v: Pt, a: number): Pt => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; };
const circ = (cx: number, cy: number, r: number, a0: number, a1: number, n = 40): Pt[] => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt; });

/** why the last layout attempt failed (for debugging pictures) */
export let lastFail = '';
interface Placed { text: string; size: number; role: Paint; b: Box; step: string; id?: string; mark: MarkBase }

export function Construction(d: Drawing, f: Frame): ConstructionBlock {
  const ref = (r: Ref): P2 => { if (typeof r !== 'string') return r; const p = d.pts[r]; check(p, NAME, `no point named ${r}`); return p; };
  const rotA = ((d.rot ?? 0) * Math.PI) / 180, mir = d.mirror ? -1 : 1;
  // figure (units, y up) -> rotated figure units
  const fig = (p: P2): Pt => { const x = p[0] * mir, y = p[1]; const c = Math.cos(rotA), s = Math.sin(rotA); return [x * c - y * s, x * s + y * c]; };
  const figDeg = (dg: number): number => { const v = unitDir(dg); const w = fig(v); return Math.atan2(-w[1], w[0]); };   // px angle (y down)

  // geometry samples in units, for the fit
  const geo: Pt[] = [];
  for (const m of d.marks) {
    if (m.kind === 'seg') geo.push(fig(ref(m.a)), fig(ref(m.b)));
    else if (m.kind === 'ray') { const a = ref(m.from), u = unitDir(m.deg); geo.push(fig(a), fig([a[0] + u[0] * m.len, a[1] + u[1] * m.len])); }
    else if (m.kind === 'arc' || m.kind === 'compass') { const c = ref(m.c); for (let i = 0; i <= 12; i++) { const u = unitDir(lerp(m.from, m.to, i / 12)); geo.push(fig([c[0] + u[0] * m.r, c[1] + u[1] * m.r])); } }
    else if (m.kind === 'vertex' || m.kind === 'cand' || m.kind === 'angle') geo.push(fig(ref(m.at)));
    else if (m.kind === 'ruler') { const a = ref(m.at), u = unitDir(m.deg); for (const r of [-m.inset, m.len + 0.3]) geo.push(fig([a[0] + u[0] * (r - m.start), a[1] + u[1] * (r - m.start)])); }
    else if (m.kind === 'protractor') geo.push(fig(ref(m.at)));
  }
  check(geo.length > 0, NAME, 'nothing to draw');
  const gx0 = Math.min(...geo.map(p => p[0])), gx1 = Math.max(...geo.map(p => p[0])), gy0 = Math.min(...geo.map(p => p[1])), gy1 = Math.max(...geo.map(p => p[1]));
  const cap = d.maxScale ?? (d.unit === 'in' ? 165 : 66);
  const M = d.margin ?? Math.min(120, f.w * 0.17, f.h * 0.17);
  let s = d.scale ?? Math.min(cap, (f.w - 2 * M) / Math.max(1e-6, gx1 - gx0), (f.h - 2 * M) / Math.max(1e-6, gy1 - gy0));
  check(s > 8, NAME, `the figure is too large for its frame (scale ${s.toFixed(1)} px per ${d.unit})`);

  for (let attempt = 0; attempt < 14; attempt++) {
    const out = layout(s);
    if (out) return out;
    if (d.scale) break;
    s *= 0.93;
  }
  throw new BlockError(NAME, "no readable layout (labels collide with lines or leave the frame)");

  function layout(sc: number): ConstructionBlock | null {
    // origin chosen so the geometry is centred; then the whole ink box is re-centred below
    let ox = f.x + f.w / 2 - sc * (gx0 + gx1) / 2, oy = f.y + f.h / 2 + sc * (gy0 + gy1) / 2;
    const toPx = (p: P2): Pt => { const q = fig(p); return [ox + sc * q[0], oy - sc * q[1]]; };
    const build = () => {
      const lines: Pt[][] = [];
      const obstacles: Box[] = [];
      const inks: Box[] = [];
      const soft: Box[] = [];   // the compass stands above the paper: it may leave the frame, not the canvas left of the board
      const pushLine = (P: Pt[]) => { lines.push(P); inks.push(boxOfPts(P)); };
      for (const m of d.marks) {
        if (m.kind === 'seg') pushLine([toPx(ref(m.a)), toPx(ref(m.b))]);
        else if (m.kind === 'ray') { const a = ref(m.from), u = unitDir(m.deg); pushLine([toPx(a), toPx([a[0] + u[0] * m.len, a[1] + u[1] * m.len])]); }
        else if (m.kind === 'arc') pushLine(arcPx(m.c, m.r, m.from, m.to));
        else if (m.kind === 'angle') pushLine(anglePx(m));
        // an instrument that is put away later (hide) is not an obstacle: the labels near it appear after it is gone
        else if (m.kind === 'ruler') { const body = rulerBody(m); if (!m.hide) obstacles.push(boxOfPts(body)); inks.push(boxOfPts(body)); }
        else if (m.kind === 'protractor') { const P = protPts(m); if (!m.hide) { lines.push(P); obstacles.push(boxOfPts(P)); } inks.push(boxOfPts(P)); }
        else if (m.kind === 'compass') { for (let i = 0; i <= 6; i++) soft.push(boxOfPts(compassPts(m, lerp(m.from, m.to, i / 6)).all)); }
        else if (m.kind === 'vertex' || m.kind === 'cand') { const p = toPx(ref(m.at)); inks.push(box(p[0] - 12, p[1] - 12, p[0] + 12, p[1] + 12)); }
      }
      return { lines, obstacles, inks, soft };
    };
    function arcPx(cR: Ref, r: number, a0: number, a1: number): Pt[] {
      const c = toPx(ref(cR)), A0 = figDeg(a0), A1 = figDeg(a1);
      let dA = A1 - A0; while (dA > Math.PI) dA -= 2 * Math.PI; while (dA < -Math.PI) dA += 2 * Math.PI;
      if (Math.abs(a1 - a0) > 180) dA = dA > 0 ? dA - 2 * Math.PI : dA + 2 * Math.PI;
      return circ(c[0], c[1], r * sc, A0, A0 + dA, Math.max(12, Math.round(Math.abs(dA) * r * sc / 8)));
    }
    function anglePx(m: Extract<Mark, { kind: 'angle' }>): Pt[] {
      const P = toPx(ref(m.at)), u = norm(toPx(ref(m.p))[0] - P[0], toPx(ref(m.p))[1] - P[1]), v = norm(toPx(ref(m.q))[0] - P[0], toPx(ref(m.q))[1] - P[1]);
      if (m.right) { const r = 40; return [[P[0] + u[0] * r, P[1] + u[1] * r], [P[0] + (u[0] + v[0]) * r, P[1] + (u[1] + v[1]) * r], [P[0] + v[0] * r, P[1] + v[1] * r]]; }
      const a0 = Math.atan2(u[1], u[0]); let dA = Math.atan2(v[1], v[0]) - a0;
      while (dA > Math.PI) dA -= 2 * Math.PI; while (dA < -Math.PI) dA += 2 * Math.PI;
      return circ(P[0], P[1], ANG_R, a0, a0 + dA, 24);
    }
    function rulerFrame(m: Extract<Mark, { kind: 'ruler' }>) {
      const a = ref(m.at), u = unitDir(m.deg);
      const at = (r: number): Pt => toPx([a[0] + u[0] * (r - m.start), a[1] + u[1] * (r - m.start)]);
      const p0 = at(0), p1 = at(1), dir = norm(p1[0] - p0[0], p1[1] - p0[1]);
      const side = m.side ?? 1, n: Pt = [-dir[1] * side, dir[0] * side];    // side 1: to the right of the direction on screen (below for +x)
      return { at, dir, n };
    }
    function rulerBody(m: Extract<Mark, { kind: 'ruler' }>): Pt[] {
      const { at, dir, n } = rulerFrame(m), a = at(-m.inset), e = at(m.len), b: Pt = [e[0] + dir[0] * 96, e[1] + dir[1] * 96], o = 4;
      return [[a[0] + n[0] * o, a[1] + n[1] * o], [b[0] + n[0] * o, b[1] + n[1] * o], [b[0] + n[0] * (RULER_H + o), b[1] + n[1] * (RULER_H + o)], [a[0] + n[0] * (RULER_H + o), a[1] + n[1] * (RULER_H + o)]];
    }
    function protPts(m: Extract<Mark, { kind: 'protractor' }>): Pt[] {
      const c = toPx(ref(m.at)), A0 = figDeg(m.deg);
      // the half disc opens toward figure angles deg .. deg+180 (counter-clockwise = negative px angle)
      const P = circ(c[0], c[1], PROT_R, A0, A0 - Math.PI, 60);
      P.push(P[0]!);
      return P;
    }
    function compassPts(m: Extract<Mark, { kind: 'compass' }>, a: number) {
      const c = toPx(ref(m.c)), u = unitDir(a), cc = ref(m.c), p = toPx([cc[0] + u[0] * m.r, cc[1] + u[1] * m.r]);
      const dd = Math.hypot(p[0] - c[0], p[1] - c[1]), L = Math.max(dd * 0.62, 150), h = Math.sqrt(Math.max(0, L * L - (dd / 2) ** 2));
      let n = norm(-(p[1] - c[1]), p[0] - c[0]);
      if (n[1] > 0 || (Math.abs(n[1]) < 0.2 && n[0] > 0)) n = [-n[0], -n[1]];
      const H: Pt = [(c[0] + p[0]) / 2 + n[0] * h, (c[1] + p[1]) / 2 + n[1] * h];
      const top: Pt = [H[0] + n[0] * 70, H[1] + n[1] * 70];
      return { c, p, H, top, all: [c, p, H, top, [H[0] - 20, H[1] - 20], [H[0] + 20, H[1] + 20]] as Pt[] };
    }

    let g = build();
    // re-centre on the ink (geometry + instruments) and check it fits
    let ink = unionBox(g.inks);
    ox += f.x + f.w / 2 - ink.cx; oy += f.y + f.h / 2 - ink.cy;
    g = build(); ink = unionBox(g.inks);
    const F = box(f.x, f.y, f.x + f.w, f.y + f.h);
    if (ink.x0 < F.x0 - 1 || ink.x1 > F.x1 + 1 || ink.y0 < F.y0 - 1 || ink.y1 > F.y1 + 1) { lastFail = `ink ${ink.x0|0},${ink.y0|0},${ink.x1|0},${ink.y1|0} outside frame`; return null; }
    if (g.soft.length) { const sb = unionBox(g.soft); if (sb.x0 < 10 || sb.y0 < 10 || sb.x1 > 1200 || sb.y1 > 1070) { lastFail = 'compass leaves the canvas'; return null; } }

    // ---------- labels ----------
    const placed: Placed[] = [];
    const ok = (b: Box) => b.x0 >= F.x0 + 4 && b.x1 <= F.x1 - 4 && b.y0 >= F.y0 + 4 && b.y1 <= F.y1 - 4
      && !hitsLines(b, g.lines, 7) && !g.obstacles.some(o => overlap(o, b)) && !placed.some(q => overlap(padB(q.b, 8), b));
    const tryPlace = (cands: Pt[], text: string, size: number, role: Paint, step: string, mark: MarkBase, id?: string): boolean => {
      for (const p of cands) { const b = textBox(text, size, p[0], p[1]); if (ok(b)) { placed.push({ text, size, role, b, step, id, mark }); return true; } }
      return false;
    };
    const tri = ['A', 'B', 'C'].filter(k => d.pts[k]).map(k => toPx(d.pts[k]!));
    const allPts = Object.values(d.pts).map(toPx);
    const centre: Pt = tri.length === 3 ? [(tri[0]![0] + tri[1]![0] + tri[2]![0]) / 3, (tri[0]![1] + tri[1]![1] + tri[2]![1]) / 3]
      : [allPts.reduce((t, p) => t + p[0], 0) / Math.max(1, allPts.length), allPts.reduce((t, p) => t + p[1], 0) / Math.max(1, allPts.length)];
    const sizeOf = (l: Lbl | undefined, dflt: number) => l?.size ?? dflt;
    for (const m of d.marks) {
      if (m.kind === 'vertex') {
        const p = toPx(ref(m.at)), aw = m.away ? toPx(ref(m.away)) : centre, size = m.size ?? 52;
        const u = norm(p[0] - aw[0], p[1] - aw[1]), hw = textW(m.name, size) / 2 + 4, hh = size * 0.44;
        const cands: Pt[] = [];
        for (const dd of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5, 2.0, -2.0, 2.6, -2.6]) for (const extra of [0, 22, 48]) {
          const v = rot(u, dd), r = 22 + Math.abs(v[0]) * hw + Math.abs(v[1]) * hh + extra;
          cands.push([p[0] + v[0] * r, p[1] + v[1] * r]);
        }
        if (!tryPlace(cands, m.name, size, m.role ?? 'ink', m.lstep ?? m.step, m, m.id)) { lastFail = `label ${JSON.stringify((m.name))} has no place`; return null; }
      } else if (m.kind === 'cand') {
        const p = toPx(ref(m.at)), size = 52, hw = textW(m.name, size) / 2 + 4, hh = size * 0.44;
        const cands: Pt[] = [];
        for (const v of [[1, -1], [-1, -1], [1, 1], [-1, 1], [0, -1.3], [1.3, 0], [-1.3, 0], [0, 1.3]] as Pt[]) cands.push([p[0] + v[0] * (hw + 20), p[1] + v[1] * (hh + 20)]);
        // then every direction, farther out (a crossing of two arcs leaves narrow wedges)
        for (const r of [1.0, 1.35, 1.75]) for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 - Math.PI / 2; cands.push([p[0] + Math.cos(a) * (Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh + 22) * r, p[1] + Math.sin(a) * (Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh + 22) * r]); }
        if (!tryPlace(cands, m.name, size, m.role ?? 'pick', m.step, m, m.id)) { lastFail = `label ${JSON.stringify((m.name))} has no place`; return null; }
      } else if (m.kind === 'seg' && m.label) {
        const a = toPx(ref(m.a)), b = toPx(ref(m.b)), aw = m.away ? toPx(ref(m.away)) : centre, size = sizeOf(m.label, 60);
        const t = norm(b[0] - a[0], b[1] - a[1]);
        let n: Pt = [-t[1], t[0]];
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        if ((aw[0] - mid[0]) * n[0] + (aw[1] - mid[1]) * n[1] > 0) n = [-n[0], -n[1]];
        const hw = textW(m.label.text, size) / 2 + 4, hh = size * 0.44, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const cands: Pt[] = [];
        for (const side of [1, -1]) for (const along of [0, 0.14, -0.14, 0.26, -0.26]) for (const extra of [0, 26]) {
          const r = 16 + Math.abs(n[0]) * hw + Math.abs(n[1]) * hh + extra;
          cands.push([mid[0] + t[0] * along * L + side * n[0] * r, mid[1] + t[1] * along * L + side * n[1] * r]);
        }
        if (!tryPlace(cands, m.label.text, size, m.label.role ?? m.role ?? 'first', m.label.step ?? m.step, m, m.id)) { lastFail = `label ${JSON.stringify((m.label.text))} has no place`; return null; }
      } else if (m.kind === 'angle' && m.label) {
        const P = toPx(ref(m.at)), u = norm(toPx(ref(m.p))[0] - P[0], toPx(ref(m.p))[1] - P[1]), v = norm(toPx(ref(m.q))[0] - P[0], toPx(ref(m.q))[1] - P[1]);
        const size = sizeOf(m.label, 60), bis = norm(u[0] + v[0], u[1] + v[1]), half = Math.acos(clamp(u[0] * v[0] + u[1] * v[1], -1, 1)) / 2;
        const hw = textW(m.label.text, size) / 2 + 4, hh = size * 0.44, diag = Math.hypot(hw, hh);
        const r0 = Math.max(ANG_R + 18 + diag, diag / Math.max(0.08, Math.sin(half)) + 8);
        const cands: Pt[] = [];
        for (const extra of [0, 25, 50]) for (const tw of [0, 0.12, -0.12]) { const w = rot(bis, tw); cands.push([P[0] + w[0] * (r0 + extra), P[1] + w[1] * (r0 + extra)]); }
        if (!tryPlace(cands, m.label.text, size, m.label.role ?? m.role ?? 'second', m.label.step ?? m.step, m, m.id)) { lastFail = `label ${JSON.stringify((m.label.text))} has no place`; return null; }
      } else if (m.kind === 'protractor' && m.dots) {
        const c = toPx(ref(m.at));
        for (const dt of m.dots) {
          const A = figDeg(m.deg) - (dt.deg * Math.PI) / 180, size = 52;
          const hw = textW(dt.name, size) / 2 + 4, r = PROT_R + 46 + hw;
          if (!tryPlace([[c[0] + Math.cos(A) * r, c[1] + Math.sin(A) * r], [c[0] + Math.cos(A) * (r + 30), c[1] + Math.sin(A) * (r + 30)]], dt.name, size, dt.role ?? 'pick', m.step, m, `${m.id ?? 'prot'}.${dt.name}`)) { lastFail = `protractor dot ${dt.name} has no place`; return null; }
        }
      }
    }
    const all = unionBox([ink, ...placed.map(q => q.b)]);
    const self: ConstructionBlock = {
      kind: 'Construction', s: sc, box: all,
      px: r => toPx(ref(r)),
      where(id: string): Box {
        const lab = id.endsWith(':label');
        const key = lab ? id.slice(0, -6) : id;
        if (lab) { const q = placed.find(x => x.id === key); check(q, NAME, `no label for ${key}`); return q.b; }
        const m = d.marks.find(x => x.id === key);
        check(m, NAME, `no mark with id ${key}`);
        if (m.kind === 'seg') return boxOfPts([toPx(ref(m.a)), toPx(ref(m.b))]);
        if (m.kind === 'arc') return boxOfPts(arcPx(m.c, m.r, m.from, m.to));
        if (m.kind === 'angle') { const q = placed.find(x => x.id === key); return q ? unionBox([q.b, boxOfPts(anglePx(m))]) : boxOfPts(anglePx(m)); }
        if (m.kind === 'ray') { const a = ref(m.from), u = unitDir(m.deg); return boxOfPts([toPx(a), toPx([a[0] + u[0] * m.len, a[1] + u[1] * m.len])]); }
        if (m.kind === 'vertex' || m.kind === 'cand') { const p = toPx(ref(m.at)); const q = placed.find(x => x.id === key); return q ? unionBox([q.b, box(p[0] - 10, p[1] - 10, p[0] + 10, p[1] + 10)]) : box(p[0] - 14, p[1] - 14, p[0] + 14, p[1] + 14); }
        if (m.kind === 'ruler') return boxOfPts(rulerBody(m));
        if (m.kind === 'protractor') return boxOfPts(protPts(m));
        return boxOfPts(compassPts(m, m.to).all);
      },
      draw(c: Canvas, p: Progress, look: Look = {}): void {
        const fo = look.focus ?? {};
        const vis = (m: MarkBase) => clamp(p.k(m.step)) * (1 - clamp(m.hide ? p.k(m.hide) : 0));
        const glowOf = (m: MarkBase) => (m.id ? clamp(fo[m.id] ?? 0) : 0);
        const dimOf = (m: MarkBase) => 1 - (look.dim ?? 0) * (1 - glowOf(m));
        // instruments under the lines
        for (const m of d.marks) {
          const k = vis(m);
          if (k <= 0) continue;
          if (m.kind === 'ruler') drawRuler(c, m, k);
          else if (m.kind === 'protractor') drawProtractor(c, m, k);
        }
        for (const m of d.marks) {
          const k = vis(m);
          if (k <= 0) continue;
          const gl = glowOf(m), a = dimOf(m), col = m.role ?? 'ink';
          if (m.kind === 'seg') {
            const P = [toPx(ref(m.a)), toPx(ref(m.b))];
            const w = (m.w ?? 5) + 3 * gl;
            if (d.freehand) { if (k >= 0.999) inkLine(c, P, { col, w, seed: 7 + P[0]![0], rough: 1.4, alpha: a }); else drawOn(c, P, E.inOut(k), { col, lw: w, alpha: a }); }
            else drawOn(c, P, E.inOut(k), { col, lw: w, alpha: a, dash: m.dash ? [14, 12] : null, glow: gl ? 16 * gl : 0, glowCol: col, cap: 'round' });
            if (m.ticks) drawTicks(c, P[0]!, P[1]!, m.ticks, col, k * a);
          } else if (m.kind === 'ray') {
            const fr = ref(m.from), u = unitDir(m.deg);
            drawOn(c, [toPx(fr), toPx([fr[0] + u[0] * m.len, fr[1] + u[1] * m.len])], E.inOut(k), { col, lw: (m.w ?? 3.5) + 2 * gl, alpha: a * 0.95, glow: gl ? 14 * gl : 0, glowCol: col });
          } else if (m.kind === 'arc') {
            drawOn(c, arcPx(m.c, m.r, m.from, m.to), k, { col, lw: (m.w ?? 4) + 2.5 * gl, alpha: a, glow: gl ? 16 * gl : 0, glowCol: col });
          } else if (m.kind === 'angle') {
            const P = anglePx(m);
            if (m.right) drawOn(c, P, k, { col, lw: 4, alpha: a });
            else { drawOn(c, P, k, { col, lw: 4 + 2 * gl, alpha: a, glow: gl ? 12 * gl : 0, glowCol: col }); }
          } else if (m.kind === 'vertex') {
            const q = toPx(ref(m.at));
            if (m.dot !== false) { dot(c, q[0], q[1], 9 + 4 * gl, col, Math.min(1, k * 2) * a); }
          } else if (m.kind === 'cand') {
            const q = toPx(ref(m.at));
            strokePts(c, circ(q[0], q[1], 16 + 4 * gl, 0, Math.PI * 2, 30), { col, lw: 4, alpha: k * a, closed: true, glow: gl ? 12 : 0, glowCol: col });
            dot(c, q[0], q[1], 5, col, k * a);
          } else if (m.kind === 'compass') {
            drawCompass(c, m, k, lerp(m.from, m.to, E.inOut(clamp(p.k(m.sweep)))));
          }
        }
        // labels last, above every line
        for (const q of placed) {
          const m = q.mark;
          const k = clamp(p.k(q.step)) * (1 - clamp(m.hide ? p.k(m.hide) : 0));
          if (k <= 0) continue;
          const a = dimOf(m);
          drawWords(c, q.text, q.b.cx, q.b.cy + 1, q.role, k * a, { size: q.size, align: 'center', weight: 650 });
        }
      },
    };
    return self;

    // ----- instrument painters (closures over the layout) -----
    function drawRuler(c: Canvas, m: Extract<Mark, { kind: 'ruler' }>, k: number): void {
      const { at, dir, n } = rulerFrame(m), body = rulerBody(m);
      const ang = Math.atan2(dir[1], dir[0]);
      c.g.save(); c.g.globalAlpha *= k;
      wash(c, body, '#E6D7A6', { seed: 31, rough: 0.8, ink: DUSK.ink, inkW: 2.5, shade: 0.12, alpha: 0.96 });
      const sub = d.unit === 'in' ? 4 : 2;
      for (let i = 0; i <= m.len * sub; i++) {
        const r = i / sub, P = at(r), whole = i % sub === 0, half = !whole && (d.unit === 'cm' || i % 2 === 0);
        const L = whole ? 34 : half ? 24 : 14;
        strokePts(c, [[P[0] + n[0] * 4, P[1] + n[1] * 4], [P[0] + n[0] * (4 + L), P[1] + n[1] * (4 + L)]], { col: DUSK.ink, lw: whole ? 3 : 2 });
        if (whole) {
          const every = sc < 58 ? 2 : 1;
          if ((i / sub) % every === 0) {
            const q: Pt = [P[0] + n[0] * 66, P[1] + n[1] * 66];
            c.g.save(); c.g.translate(q[0], q[1]); c.g.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang);
            drawWords(c, String(i / sub), 0, 0, DUSK.ink, 1, { size: 44, align: 'center', weight: 650 });
            c.g.restore();
          }
        }
      }
      // the unit name at the far end
      const q0 = at(m.len), q: Pt = [q0[0] + dir[0] * 64, q0[1] + dir[1] * 64];
      c.g.save(); c.g.translate(q[0] + n[0] * 66, q[1] + n[1] * 66); c.g.rotate(ang > Math.PI / 2 || ang < -Math.PI / 2 ? ang + Math.PI : ang);
      drawWords(c, d.unit, 0, 0, '#6B5A3E', 1, { size: 32, align: 'center', weight: 600 });
      c.g.restore();
      c.g.restore();
    }
    function drawProtractor(c: Canvas, m: Extract<Mark, { kind: 'protractor' }>, k: number): void {
      const C = toPx(ref(m.at)), A0 = figDeg(m.deg);
      const P = protPts(m);
      c.g.save(); c.g.globalAlpha *= k;
      wash(c, P, '#CFC6EC', { seed: 41, rough: 0.6, ink: '#EFE6F7', inkW: 2.5, alpha: 0.28, shade: 0.05 });
      for (let v = 0; v <= 180; v += 5) {
        const A = A0 - (v * Math.PI) / 180, L = v % 10 === 0 ? 24 : 12;
        strokePts(c, [[C[0] + Math.cos(A) * PROT_R, C[1] + Math.sin(A) * PROT_R], [C[0] + Math.cos(A) * (PROT_R - L), C[1] + Math.sin(A) * (PROT_R - L)]], { col: 'ink', lw: v % 10 === 0 ? 2.5 : 1.6, alpha: 0.9 });
      }
      for (let v = 0; v <= 180; v += 30) {
        const A = A0 - (Math.min(172, Math.max(8, v)) * Math.PI) / 180;   // 0 and 180 sit just above the straight edge, not on it
        drawWords(c, String(v), C[0] + Math.cos(A) * (PROT_R - 56), C[1] + Math.sin(A) * (PROT_R - 56), 'ink', 1, { size: 44, align: 'center', weight: 650 });
        drawWords(c, String(180 - v), C[0] + Math.cos(A) * (PROT_R - 112), C[1] + Math.sin(A) * (PROT_R - 112), 'dim', 1, { size: 40, align: 'center', weight: 600 });
      }
      strokePts(c, [[C[0] - 10, C[1]], [C[0] + 10, C[1]]], { col: 'ink', lw: 2.5 });
      for (const dt of m.dots ?? []) {
        const A = A0 - (dt.deg * Math.PI) / 180;
        dot(c, C[0] + Math.cos(A) * (PROT_R + 22), C[1] + Math.sin(A) * (PROT_R + 22), 11, dt.role ?? 'pick');
      }
      c.g.restore();
    }
    function drawCompass(c: Canvas, m: Extract<Mark, { kind: 'compass' }>, k: number, a: number): void {
      const { c: P0, p: P1, H, top } = compassPts(m, a);
      c.g.save(); c.g.globalAlpha *= k;
      const leg = (from: Pt, to: Pt, w0: number, w1: number): Pt[] => { const t = norm(to[0] - from[0], to[1] - from[1]), nn: Pt = [-t[1], t[0]]; return [[from[0] + nn[0] * w0, from[1] + nn[1] * w0], [to[0] + nn[0] * w1, to[1] + nn[1] * w1], [to[0] - nn[0] * w1, to[1] - nn[1] * w1], [from[0] - nn[0] * w0, from[1] - nn[1] * w0]]; };
      wash(c, leg(H, P0, 12, 3), '#B9BDD0', { seed: 51, rough: 0.5, ink: DUSK.ink, inkW: 2.5 });
      // the pencil leg ends in a lavender pencil tip (the moving part)
      const t = norm(P1[0] - H[0], P1[1] - H[1]), tipStart: Pt = [P1[0] - t[0] * 46, P1[1] - t[1] * 46];
      wash(c, leg(H, tipStart, 12, 8), '#B9BDD0', { seed: 52, rough: 0.5, ink: DUSK.ink, inkW: 2.5 });
      fillPts(c, leg(tipStart, P1, 8, 1.5), 'pick');
      wash(c, leg(H, top, 9, 9), '#8E93AE', { seed: 53, rough: 0.5, ink: DUSK.ink, inkW: 2.5 });
      dot(c, H[0], H[1], 19, '#D9DCE8'); dot(c, H[0], H[1], 7, DUSK.ink);
      dot(c, P0[0], P0[1], 5, 'ink');
      c.g.restore();
    }
  }
}

function drawTicks(c: Canvas, a: Pt, b: Pt, n: number, col: Paint, alpha: number): void {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], t = norm(b[0] - a[0], b[1] - a[1]), nn: Pt = [-t[1], t[0]];
  for (let i = 0; i < n; i++) {
    const o = (i - (n - 1) / 2) * 12;
    const q: Pt = [m[0] + t[0] * o, m[1] + t[1] * o];
    strokePts(c, [[q[0] - nn[0] * 16, q[1] - nn[1] * 16], [q[0] + nn[0] * 16, q[1] + nn[1] * 16]], { col, lw: 4, alpha });
  }
}
function boxOfPts(P: readonly Pt[]): Box {
  return box(Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1])));
}
const overlap = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const padB = (b: Box, p: number) => box(b.x0 - p, b.y0 - p, b.x1 + p, b.y1 + p);

// ---------- the sheet, and the sticks ----------
/** the drawing board: a wooden board with a sheet of dark drawing paper on it */
export function sheet(c: Canvas, b: Box): void {
  wash(c, rectPts(b.x0 - 18, b.y0 - 18, b.w + 36, b.h + 36, 18), DUSK.wood, { seed: 61, rough: 1.4, ink: DUSK.ink, inkW: 3, shade: 0.3 });
  wash(c, rectPts(b.x0, b.y0, b.w, b.h, 6), '#1E2350', { seed: 62, rough: 1.0, ink: '#3A3F6B', inkW: 2.5, shade: 0.12 });
}
export interface SticksBlock { where: Box[]; labels: Box[]; s: number; draw(c: Canvas, k: number, look?: { focus?: number[]; dim?: number }): void }
/** wooden sticks of the given lengths, one under the other, left-aligned, with their length on the right */
export function Sticks(lens: readonly number[], unit: Unit, f: Frame, text: (i: number) => string): SticksBlock {
  check(lens.length >= 1 && lens.every(x => x > 0), 'Sticks', 'lengths must be positive');
  const size = 60, labW = Math.max(...lens.map((_, i) => textW(text(i), size))) + 50;
  const s = Math.min(unit === 'in' ? 120 : 48, (f.w - labW - 40) / Math.max(...lens));
  check(s > 20, 'Sticks', 'sticks too long to draw');
  const gap = Math.min(170, (f.h - 40) / lens.length), y0 = f.y + f.h / 2 - (gap * (lens.length - 1)) / 2;
  const x0 = f.x + 20;
  const where = lens.map((L, i) => box(x0, y0 + i * gap - 17, x0 + s * L, y0 + i * gap + 17));
  const labels = lens.map((L, i) => textBox(text(i), size, x0 + s * L + 30 + textW(text(i), size) / 2, y0 + i * gap));
  return {
    where, labels, s,
    draw(c, k, look = {}) {
      lens.forEach((_, i) => {
        const b = where[i]!, foc = look.focus?.includes(i) ? 1 : 0, a = clamp(k) * (1 - (look.dim ?? 0) * (1 - foc));
        if (a <= 0) return;
        c.g.save(); c.g.globalAlpha *= a;
        wash(c, rectPts(b.x0, b.y0, b.w, b.h, 8), i % 2 ? DUSK.woodLight : mix(DUSK.woodLight, '#C99A6B', 0.4), { seed: 70 + i, rough: 1.0, ink: DUSK.ink, inkW: 3 });
        if (foc) strokePts(c, rectPts(b.x0 - 6, b.y0 - 6, b.w + 12, b.h + 12, 12), { col: 'pick', lw: 4, closed: true, glow: 12 });
        const l = labels[i]!;
        drawWords(c, text(i), l.cx, l.cy + 1, 'first', 1, { size, align: 'center', weight: 650 });
        c.g.restore();
      });
    },
  };
}
export { paint };
