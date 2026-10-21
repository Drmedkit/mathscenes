// ProofSquare: the rearrangement proof of a² + b² = c² as one big square of side a + b holding four copies of the
// right triangle (legs a, b, hypotenuse c). First the triangles sit around a tilted square in the middle: its four
// sides are hypotenuses (length c) and each corner is 90° (the two sharp angles of the triangle add to 90°, and with
// the corner they make the straight side of the big square), so its area is c². Then the triangles slide (no turn)
// into two a-by-b rectangles, and what is left uncovered is an a-square and a b-square: a² + b². The big square and
// the four triangles never changed, so the uncovered area never changed: c² = a² + b².
//
// Colour roles as in SideSquares: a amber (first), b teal (second), c lime (link); triangles a calm plum wash, the
// angle marks lavender (pick).
// Steps: outer (the big square draws on), edges (a and b along the bottom and right edges), tris (the triangles land),
//        mid (the middle c-square fills, c labels), angles (the two sharp angles and the 90° corner at one corner),
//        move (the triangles slide, one after another), left (the a- and b-squares fill, a² and b² labels).
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { proofLeft, proofMiddle, proofTris } from './pythag';

export type ProofStep = 'outer' | 'edges' | 'tris' | 'mid' | 'angles' | 'move' | 'left';
export const PROOF_STEPS: readonly ProofStep[] = ['outer', 'edges', 'tris', 'mid', 'angles', 'move', 'left'];
export interface ProofFocus { glow?: { mid?: number; left?: number; outer?: number; tris?: number } }
export interface ProofSquareBlock {
  readonly kind: 'ProofSquare';
  readonly where: { outer: Box; mid: Box; aSq: Box; bSq: Box };
  draw(c: Canvas, P: Progress<ProofStep>, f?: ProofFocus): void;
}

const NAME = 'ProofSquare', LABEL = 64, TRI = '#4A4580';

export function ProofSquare(a: number, b: number, fr: Frame, th: Theme): ProofSquareBlock {
  check(a > 0 && b > 0 && a < b, NAME, 'legs a < b');
  const s = a + b, margin = 96;
  const L = Math.min(fr.w, fr.h) - 2 * margin, u = L / s;
  const x0 = fr.x + (fr.w - L) / 2 - 30, y0 = fr.y + (fr.h - L) / 2 - 30;
  const at = (q: Pt): Pt => [x0 + q[0] * u, y0 + (s - q[1]) * u];
  check(a * u >= 150, NAME, 'the a-square is too small for its label');
  const Fa = tex('a') as Formula, Fb = tex('b') as Formula, Fc = tex('c') as Formula;
  const Fa2 = tex('a^2') as Formula, Fb2 = tex('b^2') as Formula, Fc2 = tex('c^2') as Formula;
  const mid = proofMiddle(a, b), left = proofLeft(a, b);
  const polyBox = (P: Pt[]) => box(Math.min(...P.map(q => q[0])), Math.min(...P.map(q => q[1])), Math.max(...P.map(q => q[0])), Math.max(...P.map(q => q[1])));
  const outerPx: Pt[] = [at([0, 0]), at([s, 0]), at([s, s]), at([0, s])];
  const midPx = mid.map(at), aPx = left.A.map(at), bPx = left.B.map(at);
  const cen = (P: Pt[]): Pt => [P.reduce((t, q) => t + q[0], 0) / P.length, P.reduce((t, q) => t + q[1], 0) / P.length];

  function draw(c: Canvas, P: Progress<ProofStep>, f: ProofFocus = {}): void {
    const g = f.glow ?? {};
    const kO = clamp(P.k('outer')), kE = clamp(P.k('edges')), kT = clamp(P.k('tris')), kM = clamp(P.k('mid')), kA = clamp(P.k('angles')), kMv = clamp(P.k('move')), kL = clamp(P.k('left'));
    // the uncovered regions first (the triangles lie on top)
    const midA = kM * (1 - E.smooth(clamp(kMv * 4)));
    if (midA > 0) wash(c, midPx, paint(th, 'link', 'fill'), { seed: 51, inkW: 2.5, rough: 1, alpha: 0.9 * midA, shade: 0.2 });
    if (kL > 0) {
      wash(c, aPx, paint(th, 'first', 'fill'), { seed: 61, inkW: 2.5, rough: 1, alpha: 0.9 * kL, shade: 0.2 });
      wash(c, bPx, paint(th, 'second', 'fill'), { seed: 71, inkW: 2.5, rough: 1, alpha: 0.9 * kL, shade: 0.2 });
    }
    if ((g.mid ?? 0) > 0) strokePts(c, midPx, { col: 'link', lw: 7, closed: true, alpha: g.mid, glow: 18, glowCol: 'link' });
    if ((g.left ?? 0) > 0) { strokePts(c, aPx, { col: 'first', lw: 7, closed: true, alpha: g.left, glow: 18, glowCol: 'first' }); strokePts(c, bPx, { col: 'second', lw: 7, closed: true, alpha: g.left, glow: 18, glowCol: 'second' }); }
    // the four triangles; they slide in the order T4, T3, T1 (T2 stays)
    const km: [number, number, number, number] = [E.smooth(lag(kMv, 2, 3, 0.45)), 0, E.smooth(lag(kMv, 1, 3, 0.45)), E.smooth(lag(kMv, 0, 3, 0.45))];
    const tris = proofTris(a, b, km);
    tris.forEach((t, i) => {
      const k = E.smooth(lag(kT, i, 4, 0.4));
      if (k <= 0) return;
      const T = t.map(at).map(([x, y]) => [x, y - (1 - k) * 40] as Pt);
      wash(c, T, TRI, { seed: 11 + i * 7, inkW: 3, rough: 1.1, alpha: k, shade: 0.3 });
      // the hypotenuse of each triangle in lime: it is a side of the middle square
      inkLine(c, [T[1]!, T[2]!], { col: paint(th, 'link', 'fill'), w: 5, seed: 40 + i, rough: 0.5, alpha: k });
      if ((g.tris ?? 0) > 0) strokePts(c, T, { col: 'ink', lw: 5, closed: true, alpha: g.tris, glow: 14, glowCol: 'pick' });
    });
    // the big square
    if (kO > 0) drawOn(c, outerPx, kO, { col: DUSK.cream, lw: 4.5, closed: true });
    if ((g.outer ?? 0) > 0) strokePts(c, outerPx, { col: 'pick', lw: 7, closed: true, alpha: g.outer, glow: 18, glowCol: 'pick' });
    // edge labels: the bottom edge is a then b, the right edge a then b (true before AND after the slide)
    if (kE > 0) withAlpha(c, kE, () => {
      const ticks: [Pt, Pt][] = [[at([a, 0]), [0, 1]], [at([s, a]), [1, 0]], [at([0, 0]), [0, 1]], [at([s, 0]), [0, 1]], [at([s, 0]), [1, 0]], [at([s, s]), [1, 0]]];
      for (const [q, d] of ticks) strokePts(c, [[q[0] + d[0] * 8, q[1] + d[1] * 8], [q[0] + d[0] * 30, q[1] + d[1] * 30]], { col: 'dim', lw: 3 });
      const yb = at([0, 0])[1] + 52, xr = at([s, 0])[0] + 50;
      texDraw(c, Fa, (at([0, 0])[0] + at([a, 0])[0]) / 2, yb, { size: LABEL, align: 'center', col: 'first' });
      texDraw(c, Fb, (at([a, 0])[0] + at([s, 0])[0]) / 2, yb, { size: LABEL, align: 'center', col: 'second' });
      texDraw(c, Fa, xr, (at([s, 0])[1] + at([s, a])[1]) / 2, { size: LABEL, align: 'center', col: 'first' });
      texDraw(c, Fb, xr, (at([s, a])[1] + at([s, s])[1]) / 2, { size: LABEL, align: 'center', col: 'second' });
    });
    // c on each side of the middle square, inside it, and c² in the middle
    if (midA > 0) {
      const [gx, gy] = cen(midPx);
      for (let i = 0; i < 4; i++) {
        const p0 = midPx[i]!, p1 = midPx[(i + 1) % 4]!, mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
        const dx = gx - mx, dy = gy - my, l = Math.hypot(dx, dy);
        texDraw(c, Fc, mx + dx / l * 52, my + dy / l * 52, { size: LABEL - 6, align: 'center', col: '#141633', alpha: midA });
      }
      texDraw(c, Fc2, gx, gy, { size: LABEL + 8, align: 'center', col: '#141633', alpha: midA });
    }
    if (kL > 0) {
      const [ax, ay] = cen(aPx), [bx, by] = cen(bPx);
      texDraw(c, Fa2, ax, ay, { size: LABEL + 8, align: 'center', col: '#141633', alpha: kL });
      texDraw(c, Fb2, bx, by, { size: LABEL + 8, align: 'center', col: '#141633', alpha: kL });
    }
    // the angles at the corner (a, 0) of the middle square: the triangle's two sharp angles and the 90° between them
    const ka = kA * (1 - E.smooth(clamp(kMv * 4)));
    if (ka > 0) withAlpha(c, ka, () => {
      const v = at([a, 0]), toL = at([0, b]), toR = at([s, a]);
      const ang = (q: Pt) => Math.atan2(q[1] - v[1], q[0] - v[0]);
      const aUpL = ang(toL), aUpR = ang(toR);   // canvas angles (y down): up-left in (-pi, -pi/2), up-right in (-pi/2, 0)
      const arc = (r: number, a0: number, a1: number) => { const n = 24, P: Pt[] = []; for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; P.push([v[0] + r * Math.cos(t), v[1] + r * Math.sin(t)]); } return P; };
      // one arc for the angle on the left (between the bottom edge and the hypotenuse), two arcs for the other one
      strokePts(c, arc(58, -Math.PI, aUpL), { col: 'pick', lw: 4 });
      strokePts(c, arc(58, aUpR, 0), { col: 'pick', lw: 4 });
      strokePts(c, arc(70, aUpR, 0), { col: 'pick', lw: 4 });
      // the right-angle mark of the middle square's corner
      const m = 30, ul = [(toL[0] - v[0]), (toL[1] - v[1])], ur = [(toR[0] - v[0]), (toR[1] - v[1])];
      const nl = Math.hypot(ul[0]!, ul[1]!), nr = Math.hypot(ur[0]!, ur[1]!);
      const e1: Pt = [ul[0]! / nl * m, ul[1]! / nl * m], e2: Pt = [ur[0]! / nr * m, ur[1]! / nr * m];
      strokePts(c, [[v[0] + e1[0], v[1] + e1[1]], [v[0] + e1[0] + e2[0], v[1] + e1[1] + e2[1]], [v[0] + e2[0], v[1] + e2[1]]], { col: '#141633', lw: 3.5 });
    });
  }
  return {
    kind: 'ProofSquare',
    where: { outer: polyBox(outerPx), mid: polyBox(midPx), aSq: polyBox(aPx), bSq: polyBox(bPx) },
    draw,
  };
}
