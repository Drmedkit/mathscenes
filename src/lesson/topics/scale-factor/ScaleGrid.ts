// ScaleGrid: the model block of "scale factor". Figures on grid paper (or plain labeled figures) drawn as washes
// with a crisp outline, so a copy's corners land exactly on grid points; side labels outside each side; vertex
// letters; angle marks; captions; dashed right/up moves; a diagonal ray (the shape test for rectangles); a hop arrow
// (x2) from the original to its copy; dots and free marks.
//   Roles: the original = first (amber), the copy = second (teal), the scale factor / the answer = link (lime),
//          the focus = pick (lavender), a distorted copy = wrong (red).
//   Steps (Progress keys): grid; f<i> (figure i draws on: outline then wash); f<i>L (its labels); f<i>l<j> (one label);
//          f<i>a<j> (label j turns into its answer); f<i>T (letters); f<i>A (angle marks); f<i>C (caption);
//          f<i>S (its slide); m<i> (move i); ray; d<i> (dot i); k<i> (mark i); h<i> (hop i).
// Maths and layout are pure (scaleMaths.ts); the block asserts them (picMaths, layoutPic.why) and throws BlockError.
import { type Box, type Pt, box, clamp, padBox, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow, dot, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint, mix } from '../../../core/theme';
import { type Formula, tex, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type FigLayout, type Pic, type PicLayout, type Placed, hopPts, layoutPic, picMaths } from './scaleMaths';

const NAME = 'ScaleGrid';
export const PAPER = '#1C2046', PAPER_LINE = '#353B6C';

export interface GridFocus {
  /** a soft ring around side labels (a symbol on the board and its label light up together) */
  pulse?: { f: number; i: number; k: number; col?: Paint }[];
  /** a thick glow along sides */
  sides?: { f: number; i: number; k: number; col: Paint }[];
  /** a ring around a whole figure */
  ring?: { f: number; k: number; col: Paint }[];
  /** dim figures (0..1) */
  dim?: { f: number; k: number }[];
}
export interface ScaleGridBlock {
  readonly kind: 'ScaleGrid';
  readonly pic: Pic;
  readonly L: PicLayout;
  readonly box: Box;
  readonly where: {
    fig(i: number): Box;
    label(f: number, i: number): Box;
    side(f: number, i: number): Box;
    vertex(f: number, i: number): Box;
    caption(f: number): Box;
    grid: Box;
  };
  draw(c: Canvas, p: Progress<string>, f?: GridFocus): void;
}

const F = (t: string): Formula => tex(t) as Formula;

export function ScaleGrid(pic: Pic, fr: Frame, th: Theme): ScaleGridBlock {
  const bad = picMaths(pic);
  check(bad === null, NAME, bad ?? '');
  const L = layoutPic(pic, fr);
  check(L.why === null, NAME, L.why ?? '');
  const u = L.u;

  const slideOf = (fl: FigLayout, k: number): Pt => [fl.dx * k, fl.dy * k];
  const where = {
    fig: (i: number) => L.figs[i]!.box,
    label: (f: number, i: number) => (L.figs[f]!.labels[i] ?? L.figs[f]!.alts[i])!.box,
    side: (f: number, i: number) => { const P = L.figs[f]!.pts, a = P[i]!, b = P[(i + 1) % P.length]!; return padBox(box(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])), 6); },
    vertex: (f: number, i: number) => { const p = L.figs[f]!.pts[i]!; return box(p[0] - 10, p[1] - 10, p[0] + 10, p[1] + 10); },
    caption: (f: number) => L.figs[f]!.caption!.box,
    grid: L.gridBox,
  };

  function texLabel(c: Canvas, pl: Placed, col: Paint, a: number, pad: boolean, sh: Pt): void {
    if (a <= 0) return;
    const cx = pl.cx + sh[0], cy = pl.cy + sh[1];
    if (pad && pic.grid) {
      const b = pl.box;
      c.g.save(); c.g.globalAlpha *= clamp(a); c.g.fillStyle = PAPER;
      c.g.beginPath(); c.g.roundRect(b.x0 + sh[0] - 5, b.y0 + sh[1] - 4, b.w + 10, b.h + 8, 10); c.g.fill(); c.g.restore();
    }
    texDraw(c, F(pl.t), cx, cy, { size: pl.size, align: 'center', valign: 'center', col, alpha: clamp(a) });
  }
  function ringBox(c: Canvas, b: Box, col: Paint, k: number, r = 14): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.fillStyle = paint(th, col, 'fill'); g.globalAlpha *= 0.16;
    g.beginPath(); g.roundRect(b.x0 - 12, b.y0 - 9, b.w + 24, b.h + 18, r); g.fill();
    g.globalAlpha /= 0.16;
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4.5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(b.x0 - 12, b.y0 - 9, b.w + 24, b.h + 18, r); g.stroke(); g.restore();
  }

  function drawPhoto(c: Canvas, fi: number, Q: Pt[], a: number): void {
    const f = pic.figs[fi]!, [w0, h0] = f.photo!;
    const x0 = Math.min(...Q.map(p => p[0])), x1 = Math.max(...Q.map(p => p[0])), y0 = Math.min(...Q.map(p => p[1])), y1 = Math.max(...Q.map(p => p[1]));
    const sx = (x1 - x0) / (w0 * u), sy = (y1 - y0) / (h0 * u);
    // content in the ORIGINAL photo's units (0..w0, 0..h0, y up), mapped onto this frame: a stretched copy stretches it
    const m = 0.09 * Math.min(w0, h0);
    const X = (x: number) => x0 + x * u * sx, Y = (y: number) => y1 - y * u * sy;
    withAlpha(c, a, () => {
      const g = c.g;
      g.save();
      g.beginPath(); g.rect(X(m), Y(h0 - m), (w0 - 2 * m) * u * sx, (h0 - 2 * m) * u * sy); g.clip();
      g.fillStyle = '#4A5585'; g.fillRect(X(0), Y(h0), w0 * u * sx, h0 * u * sy);
      const sky = g.createLinearGradient(0, Y(h0), 0, Y(0));
      sky.addColorStop(0, '#6E7FB8'); sky.addColorStop(1, '#C49A8E');
      g.fillStyle = sky; g.fillRect(X(0), Y(h0), w0 * u * sx, h0 * u * sy);
      // the sun: a circle in the original, an oval in a stretched copy
      const r = 0.17 * Math.min(w0, h0);
      g.fillStyle = '#F7D27A'; g.beginPath(); g.ellipse(X(0.68 * w0), Y(0.66 * h0), r * u * sx, r * u * sy, 0, 0, Math.PI * 2); g.fill();
      // two hills
      g.fillStyle = '#5C7F5A';
      g.beginPath(); g.moveTo(X(0), Y(0.42 * h0));
      for (let i = 0; i <= 24; i++) { const t = i / 24; g.lineTo(X(t * w0), Y((0.3 + 0.16 * Math.sin(Math.PI * (t * 1.3 + 0.1))) * h0)); }
      g.lineTo(X(w0), Y(0)); g.lineTo(X(0), Y(0)); g.closePath(); g.fill();
      g.fillStyle = '#3F6247';
      g.beginPath(); g.moveTo(X(0), Y(0.2 * h0));
      for (let i = 0; i <= 24; i++) { const t = i / 24; g.lineTo(X(t * w0), Y((0.14 + 0.1 * Math.sin(Math.PI * (t * 1.6 + 0.9))) * h0)); }
      g.lineTo(X(w0), Y(0)); g.lineTo(X(0), Y(0)); g.closePath(); g.fill();
      g.restore();
    });
  }

  function drawFig(c: Canvas, i: number, P: Progress<string>, fo: GridFocus): void {
    const f = pic.figs[i]!, fl = L.figs[i]!;
    const k = P.k(`f${i}`);
    const sh = slideOf(fl, P.k(`f${i}S`));
    const dim = fo.dim?.find(d => d.f === i)?.k ?? 0;
    const Q = fl.pts.map(p => [p[0] + sh[0], p[1] + sh[1]] as Pt);
    const style = f.style ?? 'wash';
    const lineCol = paint(th, f.role, 'line');
    c.g.save(); c.g.globalAlpha *= 1 - 0.6 * dim;
    if (k > 0) {
      const kf = E.inOut(clamp((k - 0.35) / 0.65)), ks = clamp(k / 0.6);
      if (style === 'wash' && !f.open && kf > 0) {
        withAlpha(c, kf, () => wash(c, Q, f.role, { seed: 31 + i * 7, rough: 1.1, ink: null, shade: 0.22, alpha: 0.92 }));
        if (f.photo) drawPhoto(c, i, Q, kf);
        // on grid paper the squares stay countable through the paint: faint grid lines clipped to the figure
        else if (pic.grid) withAlpha(c, kf, () => {
          const { g } = c, G = L.gridBox;
          g.save(); g.beginPath(); Q.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.clip();
          g.strokeStyle = 'rgba(28,20,44,0.30)'; g.lineWidth = 1.6; g.beginPath();
          for (let x = 0; x <= pic.cols; x++) { g.moveTo(G.x0 + x * u, G.y0); g.lineTo(G.x0 + x * u, G.y1); }
          for (let y = 0; y <= pic.rows; y++) { g.moveTo(G.x0, G.y0 + y * u); g.lineTo(G.x1, G.y0 + y * u); }
          g.stroke(); g.restore();
        });
      }
      if (style === 'line' && !f.open && kf > 0) withAlpha(c, kf * 0.22, () => { c.g.fillStyle = paint(th, f.role, 'fill'); c.g.beginPath(); Q.forEach((p, j) => (j ? c.g.lineTo(p[0], p[1]) : c.g.moveTo(p[0], p[1]))); c.g.closePath(); c.g.fill(); });
      const outline = f.open ? Q : [...Q, Q[0]!];
      if (style === 'dash') drawOn(c, outline, ks, { col: lineCol, lw: 5, dash: [16, 12], cap: 'butt' });
      else if (style === 'line' || f.open) drawOn(c, outline, ks, { col: lineCol, lw: f.open ? 7 : 5.5 });
      else drawOn(c, outline, ks, { col: mix(paint(th, f.role, 'fill'), DUSK.ink, 0.55), lw: 4 });
      // corners on grid points: small crisp dots
      if (pic.grid && style !== 'dash') for (const p of Q) dot(c, p[0], p[1], 4.5, mix(paint(th, f.role, 'fill'), DUSK.ink, 0.55), ks);
    }
    // glowing sides (focus)
    for (const s of fo.sides ?? []) if (s.f === i && s.k > 0) {
      const a = Q[s.i]!, b = Q[(s.i + 1) % Q.length]!;
      strokePts(c, [a, b], { col: s.col, lw: 11, alpha: 0.85 * clamp(s.k), glow: 14, glowCol: s.col });
    }
    // angle marks
    const kA = P.k(`f${i}A`);
    if (kA > 0) for (const an of fl.angles) {
      const v: Pt = [an.v[0] + sh[0], an.v[1] + sh[1]];
      // on a painted figure the mark is dark ink (a role colour would vanish into its own wash)
      const col = (style === 'wash' && !f.open ? mix(paint(th, f.role, 'fill'), DUSK.ink, 0.78) : f.angles?.find(x => x.at === an.at)?.col ?? 'ink') as Paint;
      if (an.right) {
        const s = Math.min(an.r * 0.62, 30), ua: Pt = [Math.cos(an.a0), Math.sin(an.a0)], ub: Pt = [Math.cos(an.a1), Math.sin(an.a1)];
        strokePts(c, [[v[0] + ua[0] * s, v[1] + ua[1] * s], [v[0] + (ua[0] + ub[0]) * s, v[1] + (ua[1] + ub[1]) * s], [v[0] + ub[0] * s, v[1] + ub[1] * s]], { col, lw: 3.5, alpha: kA });
      } else {
        const n = 28, arc: Pt[] = Array.from({ length: n + 1 }, (_, j) => { const t = an.a0 + ((an.a1 - an.a0) * j) / n; return [v[0] + Math.cos(t) * an.r, v[1] + Math.sin(t) * an.r] as Pt; });
        drawOn(c, arc, kA, { col, lw: 4 });
      }
      if (an.label) texLabel(c, an.label, col, kA, false, sh);
    }
    c.g.restore();
  }

  function drawLabels(c: Canvas, i: number, P: Progress<string>, fo: GridFocus): void {
    const f = pic.figs[i]!, fl = L.figs[i]!;
    const sh = slideOf(fl, P.k(`f${i}S`));
    const dim = fo.dim?.find(d => d.f === i)?.k ?? 0;
    const kL = P.k(`f${i}L`);
    c.g.save(); c.g.globalAlpha *= 1 - 0.6 * dim;
    fl.labels.forEach((pl, j) => {
      const lab = f.labels?.[j];
      if (!lab) return;
      const a = Math.max(kL, P.k(`f${i}l${j}`)), ka = P.k(`f${i}a${j}`);
      const col = (typeof lab === 'string' ? f.role : lab.col ?? f.role) as Paint;
      const pulse = fo.pulse?.find(p => p.f === i && p.i === j);
      const alt = fl.alts[j];
      if (pulse && pulse.k > 0) ringBox(c, padBox((ka > 0.5 && alt ? alt : pl!).box, 0, 0), pulse.col ?? col, pulse.k * Math.max(a, ka));
      if (pl) texLabel(c, pl, col, a * (alt ? 1 - ka : 1), true, sh);
      if (alt && ka > 0) texLabel(c, alt, (typeof lab === 'string' ? 'link' : lab.altCol ?? 'link') as Paint, ka, true, sh);
    });
    const kT = P.k(`f${i}T`);
    if (kT > 0) fl.letters.forEach(pl => { if (pl) texLabel(c, pl, 'ink', kT, true, sh); });
    const kC = P.k(`f${i}C`);
    if (fl.caption && kC > 0) drawWords(c, fl.caption.t, fl.caption.cx + sh[0], fl.caption.cy + sh[1], f.role === 'dim' ? 'dim' : 'ink', kC, { size: fl.caption.size, align: 'center', weight: 600 });
    for (const r of fo.ring ?? []) if (r.f === i && r.k > 0) {
      const all = unionBox([fl.box, ...fl.labels.filter((x): x is Placed => !!x).map(x => x.box)]);
      ringBox(c, box(all.x0 + sh[0], all.y0 + sh[1], all.x1 + sh[0], all.y1 + sh[1]), r.col, r.k, 22);
    }
    c.g.restore();
  }

  function draw(c: Canvas, P: Progress<string>, fo: GridFocus = {}): void {
    const kg = P.k('grid');
    if (kg > 0 && pic.grid) {
      const G = L.gridBox;
      withAlpha(c, kg, () => {
        wash(c, rectPts(G.x0 - 18, G.y0 - 18, G.w + 36, G.h + 36, 16), PAPER, { seed: 12, rough: 1.2, ink: null, shade: 0.12 });
        const { g } = c;
        g.save(); g.strokeStyle = PAPER_LINE; g.lineWidth = 1.6;
        g.beginPath();
        for (let x = 0; x <= pic.cols; x++) { g.moveTo(G.x0 + x * u, G.y0); g.lineTo(G.x0 + x * u, G.y1); }
        for (let y = 0; y <= pic.rows; y++) { g.moveTo(G.x0, G.y0 + y * u); g.lineTo(G.x1, G.y0 + y * u); }
        g.stroke(); g.restore();
        inkLine(c, rectPts(G.x0 - 18, G.y0 - 18, G.w + 36, G.h + 36, 16), { col: '#3A3F6B', w: 3, closed: true, seed: 13, rough: 0.8 });
      });
    }
    const order = pic.order ?? pic.figs.map((_, i) => i);
    for (const i of order) drawFig(c, i, P, fo);
    // moves: dashed legs with arrow heads and their numbers
    pic.moves?.forEach((m, i) => {
      const k = P.k(`m${i}`), ml = L.moves[i]!;
      if (k <= 0) return;
      ml.legs.forEach((leg, j) => {
        const kk = clamp(k * ml.legs.length - j);
        if (kk > 0) arrow(c, [leg[0], leg[1]], E.inOut(kk), { col: m.role, lw: 5, head: 20 });
      });
      ml.nums.forEach((nb, j) => texLabel(c, nb, m.role, clamp(k * ml.legs.length - j), true, [0, 0]));
    });
    if (L.ray && pic.ray) {
      const k = P.k('ray');
      if (k > 0) {
        const [a, b] = L.ray;
        c.g.save(); c.g.setLineDash([18, 12]);
        drawOn(c, [a, b], E.inOut(k), { col: 'pick', lw: 4 });
        c.g.restore();
      }
    }
    L.hops.forEach((hp, i) => {
      const k = P.k(`h${i}`);
      if (k <= 0) return;
      arrow(c, hopPts(hp.a, hp.b, hp.apex), E.inOut(k), { col: 'link', lw: 5, head: 22 });
      texLabel(c, hp.label, 'link', clamp(k * 1.4 - 0.3), false, [0, 0]);
    });
    for (const i of order) drawLabels(c, i, P, fo);
    pic.dots?.forEach((d, i) => { const k = P.k(`d${i}`); const p = L.dots[i]!; if (k > 0) { dot(c, p[0], p[1], 15, d.role, 0.35 * k); dot(c, p[0], p[1], 9, d.role, k); } });
    pic.marks?.forEach((m, i) => texLabel(c, L.marks[i]!, m.role, P.k(`k${i}`), true, [0, 0]));
  }

  const all = unionBox([L.gridBox, ...L.figs.map(f => f.box)]);
  return { kind: 'ScaleGrid', pic, L, box: all, where, draw };
}

/** every step of a picture (to show it whole, or stagger it in) */
export function picSteps(pic: Pic): string[] {
  const s = ['grid'];
  pic.figs.forEach((f, i) => { s.push(`f${i}`, `f${i}L`); if (f.letters) s.push(`f${i}T`); if (f.angles) s.push(`f${i}A`); if (f.caption) s.push(`f${i}C`); });
  pic.moves?.forEach((_, i) => s.push(`m${i}`));
  pic.hops?.forEach((_, i) => s.push(`h${i}`));
  pic.dots?.forEach((_, i) => s.push(`d${i}`));
  pic.marks?.forEach((_, i) => s.push(`k${i}`));
  if (pic.ray) s.push('ray');
  return s;
}
