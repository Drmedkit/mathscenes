// TripleTriangle: a right triangle drawn to scale from a Pythagorean triple (legs u, v and hypotenuse w), the payoff
// of (x² + y²)² = (x² − y²)² + (2xy)²: every choice of whole numbers x > y > 0 gives legs x² − y² and 2xy and the
// hypotenuse x² + y². Several triples can be shown one after another: the triangle morphs (each fitted to the frame)
// and its labels cross-fade. Labels: the horizontal leg below it, the vertical leg to its right, the hypotenuse
// outside its slope (never on a line); the right angle has its square mark. A small heading names x and y.
//
// Steps: tri (the triangle washes in), labels (the side lengths), head (the x, y heading).
// Could move to the kit: a right triangle to scale with side labels (Pythagorean theorem lessons).
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';

export interface Triple { u: number; v: number; w: number; head: string; lu?: string; lv?: string; lw?: string }
export type TriStep = 'tri' | 'labels' | 'head';
export interface TriFocus { from?: number; to?: number; k?: number; ringW?: number }
export interface TriBlock {
  readonly kind: 'TripleTriangle';
  readonly where: { all: Box };
  draw(c: Canvas, P: Progress<TriStep>, f?: TriFocus): void;
}
const NAME = 'TripleTriangle';

export function TripleTriangle(ts: readonly Triple[], fr: Frame, th: Theme): TriBlock {
  check(ts.length >= 1, NAME, 'no triple');
  for (const t of ts) check(t.u * t.u + t.v * t.v === t.w * t.w, NAME, `${t.u}, ${t.v}, ${t.w} is not a right triangle`);
  const LAB = 72;
  const F = ts.map(t => ({ u: tex(t.lu ?? String(t.u)) as Formula, v: tex(t.lv ?? String(t.v)) as Formula, w: tex(t.lw ?? String(t.w)) as Formula, h: tex(t.head) as Formula }));
  const headY = fr.y + 50;
  const area = box(fr.x + 60, fr.y + 150, fr.x + fr.w - 60 - Math.max(...F.map(f => texWidth(f.v, LAB))) - 40, fr.y + fr.h - 110);
  // each triangle fitted: the right angle bottom right, the horizontal leg along the bottom
  const geo = ts.map(t => {
    const s = Math.min(area.w / t.u, area.h / t.v);
    const W = t.u * s, H = t.v * s;
    const R = { x: area.x1 - (area.w - W) / 2, y: area.y1 };
    return { A: { x: R.x - W, y: R.y }, R, B: { x: R.x, y: R.y - H } };
  });
  for (const g of geo) check(g.R.x - g.A.x >= 200 && g.R.y - g.B.y >= 160, NAME, 'triangle too thin');
  const all = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

  function draw(c: Canvas, P: Progress<TriStep>, f: TriFocus = {}): void {
    const kT = P.k('tri'), kL = P.k('labels'), kH = P.k('head');
    if (kT <= 0) return;
    const i0 = f.from ?? 0, i1 = f.to ?? i0, k = E.inOut(clamp(f.k ?? 0));
    const G0 = geo[i0]!, G1 = geo[i1]!;
    const pt = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
    const A = pt(G0.A, G1.A), R = pt(G0.R, G1.R), B = pt(G0.B, G1.B);
    const { g } = c;
    wash(c, [[A.x, A.y], [R.x, R.y], [B.x, B.y]], 'water', { seed: 77, rough: 1.1, alpha: E.smooth(clamp(kT)) * 0.75, inkW: 3 });
    // right-angle mark
    g.save(); g.globalAlpha *= clamp(kT); g.strokeStyle = paint(th, 'ink', 'line'); g.lineWidth = 3;
    g.beginPath(); g.moveTo(R.x - 36, R.y); g.lineTo(R.x - 36, R.y - 36); g.lineTo(R.x, R.y - 36); g.stroke();
    if ((f.ringW ?? 0) > 0) { g.globalAlpha = clamp(f.ringW!); g.strokeStyle = paint(th, 'link', 'fill'); g.lineWidth = 8; g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
    g.restore();
    // labels of the two triples, cross-faded
    const lab = (j: number, al: number) => {
      if (al <= 0 || kL <= 0) return;
      const Fj = F[j]!;
      texDraw(c, Fj.u, (A.x + R.x) / 2, R.y + 62, { size: LAB, align: 'center', k: kL, alpha: al, col: 'first' });
      texDraw(c, Fj.v, R.x + 34, (R.y + B.y) / 2, { size: LAB, align: 'left', k: kL, alpha: al, col: 'second' });
      // the hypotenuse label: outside the slope, along its outward normal (up and left)
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy);
      const nx = dy / L, ny = -dx / L;   // points up-left for a slope rising to the right
      const off = 40 + texWidth(Fj.w, LAB) * 0.5 * Math.abs(nx) + LAB * 0.5 * Math.abs(ny);
      texDraw(c, Fj.w, mx + nx * off, my + ny * off, { size: LAB, align: 'center', k: kL, alpha: al, col: 'link' });
    };
    if (i0 === i1) lab(i0, 1); else { lab(i0, 1 - k); lab(i1, k); }
    const head = (j: number, al: number) => { if (al > 0 && kH > 0) texDraw(c, F[j]!.h, all.cx, headY, { size: 64, align: 'center', k: kH, alpha: al, col: 'dim' }); };
    if (i0 === i1) head(i0, 1); else { head(i0, 1 - k); head(i1, k); }
  }
  return { kind: 'TripleTriangle', where: { all }, draw };
}
