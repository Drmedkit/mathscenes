// PlaneDist: the distance between two points on the coordinate plane as the hypotenuse of a right triangle. The plane
// (the congruence lesson's crisp grid and axes, imported read-only), the two points with their names and coordinates,
// then the path along the grid: the run (amber, first) from A across to the corner C, the rise (teal, second) from C
// up or down to B, the right-angle mark at C (grid lines are perpendicular), and the straight segment AB (lime, link).
// A horizontal or vertical pair has no triangle: the run (or the rise) IS the distance.
//
// Steps: plane, pts, run, rise, mark, legs (the run / rise labels), hyp, hypl (its label), swap (hyp label -> hyp2).
// Labels are TeX next to their segment on the side away from the triangle (numbers 60 px, point names 56 px), never on
// a grid number; the layout throws (BlockError) when a label would leave the frame.
import { type Box, type Pt, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, dot, drawOn, strokePts } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { DUSK } from '../../dusk';
import { type PView, drawPlane, planeView, px } from '../congruence/TraceBoard';
import { type V, corner } from './theoremMaths';

export type PlaneStep = 'plane' | 'pts' | 'run' | 'rise' | 'mark' | 'legs' | 'hyp' | 'hypl' | 'swap';
export interface PlaneDistParams {
  A: V; B: V;
  names?: [string, string];
  /** write the coordinates next to the names */
  coords?: boolean;
  /** TeX labels of the run, the rise and the hypotenuse (the hypotenuse label may change to hyp2 at step swap) */
  run?: string; rise?: string; hyp?: string; hyp2?: string;
  maxU?: number;
}
export interface PlaneDistBlock {
  readonly kind: 'PlaneDist';
  readonly view: PView;
  readonly where: { A: Box; B: Box; C: Box; run: Box; rise: Box; hyp: Box; runL: Box; riseL: Box; hypL: Box };
  draw(c: Canvas, P: Progress<PlaneStep>, glow?: { run?: number; rise?: number; hyp?: number; mark?: number }): void;
}

const NAME = 'PlaneDist', NUM = 60, PT = 54;
const fmtC = (v: number) => (v < 0 ? `-${-v}` : String(v));

export function PlaneDist(p: PlaneDistParams, fr: Frame, th: Theme): PlaneDistBlock {
  const { A, B } = p;
  check(!(A[0] === B[0] && A[1] === B[1]), NAME, 'the two points are the same');
  const C = corner(A, B);
  const flatX = A[1] === B[1], flatY = A[0] === B[0];
  const xs = [A[0], B[0], 0], ys = [A[1], B[1], 0];
  const win = { x0: Math.min(...xs) - 1, x1: Math.max(...xs) + 1, y0: Math.min(...ys) - 1, y1: Math.max(...ys) + 1 };
  const area = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const v = planeView(win, area, true, p.maxU ?? 92, 26);
  const P = (q: V): Pt => px(v, q);
  const [nA, nB] = p.names ?? ['A', 'B'];
  const ptTex = (n: string, q: V) => (p.coords === false ? `\\text{${n}}` : `\\text{${n}}(${fmtC(q[0])}, ${fmtC(q[1])})`);
  const FA = tex(ptTex(nA, A)) as Formula, FB = tex(ptTex(nB, B)) as Formula;
  const F = (s?: string) => (s ? (tex(s) as Formula) : null);
  const Frun = F(p.run), Frise = F(p.rise), Fhyp = F(p.hyp), Fhyp2 = F(p.hyp2);
  const sz = (Fm: Formula, s: number) => { const b = texBox(Fm, 0, 0, { size: s, align: 'center' }); return [b.w, b.h] as const; };
  const at = (cx: number, cy: number, w: number, h: number) => box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  const pa = P(A), pb = P(B), pc = P(C);
  // the point names: beside the point, preferably away from the other point; another corner when that one would
  // leave the frame, cross a segment of the triangle or cover a label
  const fb0 = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const segsPx: Pt[][] = [[pa, pc], [pc, pb], [pa, pb]];
  const nameBox = (Fm: Formula, q: Pt, other: Pt, taken: Box[]): Box => {
    const [w, h] = sz(Fm, PT);
    const sx0 = q[0] - other[0] >= 0 ? 1 : -1, sy0 = q[1] - other[1] >= 0 ? 1 : -1;
    const cands = [[sx0, sy0], [-sx0, sy0], [sx0, -sy0], [-sx0, -sy0]].map(([sx, sy]) => at(q[0] + sx! * (w / 2 + 22), q[1] + sy! * (h / 2 + 14), w, h));
    const inside = (b: Box) => b.x0 >= fb0.x0 && b.x1 <= fb0.x1 && b.y0 >= fb0.y0 && b.y1 <= fb0.y1;
    const free = (b: Box) => !taken.some(t => t.w > 0 && b.x0 < t.x1 + 14 && t.x0 < b.x1 + 14 && b.y0 < t.y1 + 8 && t.y0 < b.y1 + 8);
    return cands.find(b => inside(b) && free(b) && !hitsLines(b, segsPx, 4)) ?? cands.find(b => inside(b) && free(b)) ?? cands[0]!;
  };
  // leg labels: the run under (or over) its segment, away from B; the rise beside its segment, away from A
  const runL = (() => {
    if (!Frun) return box(0, 0, 0, 0);
    const [w, h] = sz(Frun, NUM), cx = (pa[0] + pc[0]) / 2;
    const below = pb[1] < pa[1] || flatX;   // B above A: the run label goes below the run
    return at(cx, pa[1] + (below ? 1 : -1) * (h / 2 + 16), w, h);
  })();
  const riseL = (() => {
    if (!Frise) return box(0, 0, 0, 0);
    const [w, h] = sz(Frise, NUM), cy = (pc[1] + pb[1]) / 2;
    const right = pa[0] < pc[0] || flatY;
    return at(pc[0] + (right ? 1 : -1) * (w / 2 + 18), cy, w, h);
  })();
  const hypL = (() => {
    const Fs = [Fhyp, Fhyp2].filter((x): x is Formula => !!x);
    if (!Fs.length || flatX || flatY) return box(0, 0, 0, 0);
    const w = Math.max(...Fs.map(f => sz(f, NUM)[0])), h = Math.max(...Fs.map(f => sz(f, NUM)[1]));
    const mx = (pa[0] + pb[0]) / 2, my = (pa[1] + pb[1]) / 2;
    let nx = -(pb[1] - pa[1]), ny = pb[0] - pa[0];
    const n = Math.hypot(nx, ny); nx /= n; ny /= n;
    if ((pc[0] - mx) * nx + (pc[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    const d = Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2 + 20;
    return at(mx + nx * d, my + ny * d, w, h);
  })();
  const bA = nameBox(FA, pa, pb, [runL, riseL, hypL]);
  const bB = nameBox(FB, pb, flatX || flatY ? pa : pc, [runL, riseL, hypL, bA]);
  const fb = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  for (const [b, what] of [[bA, 'name A'], [bB, 'name B'], [runL, 'run label'], [riseL, 'rise label'], [hypL, 'hypotenuse label']] as [Box, string][]) {
    if (b.w <= 0) continue;
    check(b.x0 >= fb.x0 - 40 && b.x1 <= fb.x1 + 40 && b.y0 >= fb.y0 - 30 && b.y1 <= fb.y1 + 30, NAME, `the ${what} leaves the frame`);
  }
  const over = (x: Box, y: Box) => x.w > 0 && y.w > 0 && x.x0 < y.x1 && y.x0 < x.x1 && x.y0 < y.y1 && y.y0 < x.y1;
  const ls = [bA, bB, runL, riseL, hypL];
  for (let i = 0; i < ls.length; i++) for (let j = i + 1; j < ls.length; j++) check(!over(ls[i]!, ls[j]!), NAME, 'two labels overlap');

  function label(c: Canvas, Fm: Formula | null, B: Box, col: Paint, a: number, size = NUM): void {
    if (!Fm || a <= 0 || B.w <= 0) return;
    // a dark halo keeps a label readable over grid lines
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a) * 0.82; g.fillStyle = '#181B3A';
    g.beginPath(); g.roundRect(B.x0 - 8, B.y0 - 4, B.w + 16, B.h + 8, 12); g.fill(); g.restore();
    texDraw(c, Fm, B.cx, B.cy, { size, align: 'center', col, alpha: a });
  }
  function rightMark(c: Canvas, k: number, glowK: number): void {
    if (k <= 0 || flatX || flatY) return;
    const m = Math.min(30, v.u * 0.4);
    const ux = Math.sign(pa[0] - pc[0]) * m, uy = Math.sign(pb[1] - pc[1]) * m;
    const Q: Pt[] = [[pc[0] + ux, pc[1]], [pc[0] + ux, pc[1] + uy], [pc[0], pc[1] + uy]];
    if (glowK > 0) strokePts(c, Q, { col: 'pick', lw: 8, alpha: clamp(glowK), glow: 20, glowCol: 'pick' });
    drawOn(c, Q, k, { col: DUSK.cream, lw: 3.5 });
  }
  function draw(c: Canvas, S: Progress<PlaneStep>, gl: { run?: number; rise?: number; hyp?: number; mark?: number } = {}): void {
    drawPlane(c, v, clamp(S.k('plane')));
    const kR = clamp(S.k('run')), kU = clamp(S.k('rise')), kH = clamp(S.k('hyp'));
    const seg = (a: Pt, b: Pt, k: number, col: 'first' | 'second' | 'link', g = 0) => {
      if (k <= 0) return;
      if (g > 0) strokePts(c, [a, b], { col, lw: 13, alpha: clamp(g), glow: 20, glowCol: col });
      drawOn(c, [a, b], k, { col, lw: 7 });
    };
    if (!flatY) seg(pa, pc, kR, 'first', gl.run ?? 0);
    if (!flatX) seg(pc, pb, kU, 'second', gl.rise ?? 0);
    rightMark(c, clamp(S.k('mark')), gl.mark ?? 0);
    if (!flatX && !flatY) seg(pa, pb, kH, 'link', gl.hyp ?? 0);
    const kP = clamp(S.k('pts'));
    if (kP > 0) for (const q of [pa, pb]) { dot(c, q[0], q[1], 13, DUSK.ink, kP); dot(c, q[0], q[1], 9.5, 'ink', kP); }
    label(c, FA, bA, 'ink', kP, PT); label(c, FB, bB, 'ink', kP, PT);
    const kL = clamp(S.k('legs'));
    label(c, Frun, runL, 'first', kL); label(c, Frise, riseL, 'second', kL);
    const kHl = clamp(S.k('hypl')), kS = Fhyp2 ? clamp(S.k('swap')) : 0;
    label(c, Fhyp, hypL, 'link', kHl * (1 - kS)); if (kS > 0) label(c, Fhyp2, hypL, 'link', kHl * kS);
  }
  const seg = (a: Pt, b: Pt) => box(Math.min(a[0], b[0]), Math.min(a[1], b[1]) - 6, Math.max(a[0], b[0]), Math.max(a[1], b[1]) + 6);
  const pt = (q: Pt) => box(q[0] - 16, q[1] - 16, q[0] + 16, q[1] + 16);
  return {
    kind: 'PlaneDist', view: v,
    where: { A: pt(pa), B: pt(pb), C: pt(pc), run: seg(pa, pc), rise: seg(pc, pb), hyp: seg(pa, pb), runL, riseL, hypL: hypL.w > 0 ? hypL : unionBox([pt(pa), pt(pb)]) },
    draw,
  };
}
