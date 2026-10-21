// PlanFigure.ts: a composite figure seen from above (a patio, a garden bed, a floor, a window), the model of
// "area and perimeter of composite figures". Pure layout inside a Frame + a draw(c, progress, focus) function.
//
// Colour roles, the same in the picture, on the board and in the panel:
//   first  (amber)    the REGION and its parts: what the area measures
//   second (teal)     the BOUNDARY: every edge and arc the perimeter walks along
//   link   (lime)     the answer
//   pick   (lavender) the piece or part in focus, and an unknown "?"
//   wrong  (red)      a seam counted as an edge, a straight edge that is gone
// Steps:
//   region   the figure appears as one painted surface (ink outline)
//   dims     the dimension lines and their labels (outside the figure; round parts inside, beside their line)
//   parts    the surface splits into its parts: each its own wash, the seams dashed between them
//   trace    the outer boundary is walked piece by piece in teal
//   holes    the edge of every hole is walked
//   cut      the removed parts (a hole, a notch, a corner) are lifted out: before cut = the plain shape
// Labels are sans words (60 px), never on a line, never inside the surface unless they belong to a round part's
// radius; the layout throws a BlockError when that cannot hold.
import { type Box, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Dim, type Fig, type Piece, type Pt, figBounds, inFig, loopPts, piecePts, pnText, fmt } from './figMaths';

export type FigStep = 'region' | 'dims' | 'parts' | 'trace' | 'holes' | 'cut';
export const FIG_STEPS: readonly FigStep[] = ['region', 'dims', 'parts', 'trace', 'holes', 'cut'];
export interface DimShow { id: string; text?: string }
export interface FigParams {
  fig: Fig;
  unit: string;
  /** which labels to show (ids from the figure's dims); `text` replaces the value, e.g. '?' */
  dims: DimShow[];
  /** how the seam between the parts is drawn: dashed (default), solid (looks like an edge), or not at all */
  seam?: 'dashed' | 'solid' | 'none';
  /** the largest scale (px per unit) */
  maxScale?: number;
}
export interface FigFocus {
  /** one boundary piece glows (lavender) */ piece?: string | null; pieceK?: number;
  /** one part is ringed (lavender) */ part?: string | null; partK?: number;
  /** the seam drawn as if it were counted (red) */ seamWrong?: number;
  /** the straight edge a notch took away, shown in red */ removedK?: number;
  /** a fixed candidate trace (ids of pieces; 'seam' for the seams) instead of the animated one */ candidate?: string[] | null;
  /** the region pulses (the area) */ shade?: number;
  /** a dim label pulses with its symbol on the board */ dim?: string | null; dimK?: number;
  /** per-label visibility (0..1); a label not named here shows with the dims step */ dimAlpha?: Record<string, number>;
}
export interface FigBlock {
  readonly kind: 'PlanFigure';
  readonly fig: Fig;
  readonly box: Box;
  readonly scale: number;
  readonly where: {
    fig: Box;
    piece(id: string): Box;
    part(id: string): Box;
    label(id: string): Box;
    seam(i?: number): Box;
    /** a box in the middle of the region (for a leader to "the area") */ region: Box;
  };
  /** screen point of a figure point */ P(u: Pt): Pt;
  draw(c: Canvas, P: Progress<FigStep>, f?: FigFocus): void;
}
const BN = 'PlanFigure';
const LABEL = 60;

interface Lab { id: string; text: string; x: number; y: number; box: Box; lines: Pt[][]; ticks: Pt[][]; col: 'ink' | 'pick' }

export function PlanFigure(p: FigParams, fr: Frame, th: Theme): FigBlock {
  const F = p.fig;
  const B = figBounds(F);
  const bw = Math.max(1e-6, B.x1 - B.x0), bh = Math.max(1e-6, B.y1 - B.y0);
  // room for labels: dims sit outside the figure on any side (a label beside a vertical edge needs its width)
  const MX = 220, MY = 125;
  const s = Math.min((fr.w - 2 * MX) / bw, (fr.h - 2 * MY) / bh, p.maxScale ?? 130);
  check(s > 12, BN, `the figure (${fmt(bw)} x ${fmt(bh)}) is too big for the frame`);
  const ox = fr.x + fr.w / 2 - ((B.x0 + B.x1) / 2) * s, oy = fr.y + fr.h / 2 + ((B.y0 + B.y1) / 2) * s;
  const P = (u: Pt): Pt => [ox + u[0] * s, oy - u[1] * s];
  const PP = (U: readonly Pt[]) => U.map(P);
  const outerPx = PP(loopPts(F.outer, 96));
  const holesPx = F.holes.map(H => PP(loopPts(H, 96)));
  const piecePx = new Map<string, Pt[]>();
  for (const pc of [...F.outer, ...F.holes.flat()]) piecePx.set(pc.id, PP(piecePts(pc)));
  const seamPx = F.seams.map(sm => PP([sm.a, sm.b]));
  const removedPx = F.removed.map(sm => PP([sm.a, sm.b]));
  const partPx = new Map(F.parts.map(pt => [pt.id, PP(pt.outline)]));
  const bb = (Q: readonly Pt[]): Box => box(Math.min(...Q.map(q => q[0])), Math.min(...Q.map(q => q[1])), Math.max(...Q.map(q => q[0])), Math.max(...Q.map(q => q[1])));
  const figBox = bb([...outerPx, ...[...partPx.values()].flat()]);

  // ---------- labels ----------
  const unit = p.unit ? ` ${p.unit}` : '';
  const labs: Lab[] = [];
  const lineSet: Pt[][] = [outerPx, ...holesPx, ...seamPx, ...removedPx];
  const placeAt = (text: string, cx: number, cy: number) => { const b = wordsBox(text, cx, cy, { size: LABEL, align: 'center' }); return b; };
  // straight and arc labels first, then the radii (they look for room around what is already placed)
  const order = (id: string) => (F.dims.find(x => x.id === id)?.kind === 'rad' ? 1 : 0);
  for (const ds of [...p.dims].sort((x, y) => order(x.id) - order(y.id))) {
    const d = F.dims.find(x => x.id === ds.id);
    check(d, BN, `no dimension "${ds.id}" on ${F.name}`);
    const text = ds.text ?? (d.kind === 'arc' ? `${pnText(d.value)}${unit}` : `${fmt(d.value)}${unit}`);
    const col = ds.text === '?' ? 'pick' as const : 'ink' as const;
    labs.push(layoutDim(d, text, col));
  }
  function layoutDim(d: Dim, text: string, col: 'ink' | 'pick'): Lab {
    const w0 = wordsBox(text, 0, 0, { size: LABEL, align: 'center' });
    if (d.kind === 'edge') {
      const n: Pt = [d.n[0], -d.n[1]];
      const gap = 34 + (d.extra ?? 0);
      const A = P(d.a), Bp = P(d.b);
      const a2: Pt = [A[0] + n[0] * gap, A[1] + n[1] * gap], b2: Pt = [Bp[0] + n[0] * gap, Bp[1] + n[1] * gap];
      const off = Math.abs(n[0]) * (w0.w / 2) + Math.abs(n[1]) * (w0.h / 2) + 16;
      const cx = (a2[0] + b2[0]) / 2 + n[0] * off, cy = (a2[1] + b2[1]) / 2 + n[1] * off;
      const t: Pt = [b2[0] - a2[0], b2[1] - a2[1]], tl = Math.hypot(t[0], t[1]) || 1;
      const tick = (q: Pt): Pt[] => [[q[0] - n[0] * 12 - (t[0] / tl) * 0, q[1] - n[1] * 12], [q[0] + n[0] * 12, q[1] + n[1] * 12]];
      // extension lines: from the feature (or the edge's end) out past the dimension line
      const fa = d.fa ? P(d.fa) : A, fb = d.fb ? P(d.fb) : Bp;
      const ext = (f: Pt, q: Pt): Pt[] => { const dx = q[0] - f[0], dy = q[1] - f[1], L = Math.hypot(dx, dy); return L < 1 ? [] : [[f[0] + (dx / L) * 8, f[1] + (dy / L) * 8], [q[0] + n[0] * 10, q[1] + n[1] * 10]]; };
      const lines = [[a2, b2], ext(fa, a2), ext(fb, b2)].filter(L => L.length);
      check(tl >= 34, BN, `the ${d.id} edge is too short to label (${Math.round(tl)} px)`);
      return { id: d.id, text, x: cx, y: cy, box: placeAt(text, cx, cy), lines, ticks: [tick(a2), tick(b2)], col };
    }
    if (d.kind === 'arc') {
      const pc = [...F.outer, ...F.holes.flat()].find(x => x.id === d.piece);
      check(pc && pc.kind === 'arc', BN, `no arc "${d.piece}"`);
      const tm = (pc.t0 + pc.t1) / 2;
      const mid: Pt = [pc.c[0] + pc.r * Math.cos(tm), pc.c[1] + pc.r * Math.sin(tm)];
      // the label goes to the side of the arc that is outside the surface (out of a bump, into a notch or a hole)
      const out = [Math.cos(tm), Math.sin(tm)] as Pt;
      const probe: Pt = [mid[0] + out[0] * 0.05 * pc.r, mid[1] + out[1] * 0.05 * pc.r];
      const dir: Pt = inFig(F, probe) ? [-out[0], -out[1]] : out;
      const n: Pt = [dir[0], -dir[1]];
      const M0 = P(mid);
      const off = Math.abs(n[0]) * (w0.w / 2) + Math.abs(n[1]) * (w0.h / 2) + 22;
      const cx = M0[0] + n[0] * off, cy = M0[1] + n[1] * off;
      return { id: d.id, text, x: cx, y: cy, box: placeAt(text, cx, cy), lines: [], ticks: [], col };
    }
    // a radius / diameter drawn inside the round part; the label sits beside the line on the `toward` side, or, when
    // that does not fit, just past the line's end (beyond the circle's edge)
    const u: Pt = [Math.cos(d.ang), Math.sin(d.ang)];
    const a = d.diam ? [d.c[0] - u[0] * d.r, d.c[1] - u[1] * d.r] as Pt : d.c;
    const b: Pt = [d.c[0] + u[0] * d.r, d.c[1] + u[1] * d.r];
    const A = P(a), Bp = P(b), n: Pt = [d.toward[0], -d.toward[1]], us: Pt = [u[0], -u[1]];
    const line: Pt[] = [A, Bp];
    const others = [...lineSet, ...labs.flatMap(l => l.lines)];
    const fits = (bx: Box) => !hitsLines(bx, [...others, line], 5) && bx.x0 >= fr.x - 30 && bx.x1 <= fr.x + fr.w + 30 && bx.y0 >= fr.y - 30 && bx.y1 <= fr.y + fr.h + 30
      && !labs.some(K => bx.x0 < K.box.x1 + 10 && K.box.x0 < bx.x1 + 10 && bx.y0 < K.box.y1 + 6 && K.box.y0 < bx.y1 + 6);
    const pl = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
    const offN = Math.abs(n[0]) * (w0.w / 2) + Math.abs(n[1]) * (w0.h / 2) + 14;
    const mid = { x: (A[0] + Bp[0]) / 2 + n[0] * offN, y: (A[1] + Bp[1]) / 2 + n[1] * offN };
    const offU = Math.abs(us[0]) * (w0.w / 2) + Math.abs(us[1]) * (w0.h / 2) + 18;
    const end = { x: Bp[0] + us[0] * offU, y: Bp[1] + us[1] * offU };
    const start = { x: A[0] - us[0] * offU, y: A[1] - us[1] * offU };
    const R0 = d.r * s, offC = Math.abs(n[0]) * (w0.w / 2) + Math.abs(n[1]) * (w0.h / 2) + 16;
    const over = { x: P(d.c)[0] + n[0] * (R0 + offC), y: P(d.c)[1] + n[1] * (R0 + offC) };
    const cands = [mid, end, ...(d.diam ? [start] : []), over];
    void pl;
    const at = cands.find(q => fits(placeAt(text, q.x, q.y)));
    check(at, BN, `the ${d.id} label "${text}" fits neither beside its line nor past its end`);
    return { id: d.id, text, x: at.x, y: at.y, box: placeAt(text, at.x, at.y), lines: [line], ticks: [[...dotTick(A)], [...dotTick(Bp)]], col };
  }
  function dotTick(q: Pt): Pt[] { return [[q[0] - 0.1, q[1]], [q[0] + 0.1, q[1]]]; }
  // readability: inside the frame, no label on any line (figure, seams, other dims), no two labels touching
  const allLines = [...lineSet, ...labs.flatMap(l => l.lines)];
  for (const L of labs) {
    check(L.box.x0 >= fr.x - 30 && L.box.x1 <= fr.x + fr.w + 30 && L.box.y0 >= fr.y - 30 && L.box.y1 <= fr.y + fr.h + 30, BN, `label ${L.id} "${L.text}" runs off the frame`);
    check(!hitsLines(L.box, allLines, 5), BN, `label ${L.id} "${L.text}" sits on a line`);
    for (const K of labs) if (K !== L) check(!(L.box.x0 < K.box.x1 + 10 && K.box.x0 < L.box.x1 + 10 && L.box.y0 < K.box.y1 + 6 && K.box.y0 < L.box.y1 + 6), BN, `labels ${L.id} and ${K.id} collide`);
    const d = F.dims.find(x => x.id === L.id)!;
    if (d.kind !== 'rad') {
      const inv: Pt = [(L.x - ox) / s, (oy - L.y) / s];
      check(!inFig(F, inv), BN, `label ${L.id} would sit on the surface`);
    }
  }
  const labBox = (id: string) => labs.find(l => l.id === id)?.box ?? figBox;
  const all = unionBox([figBox, ...labs.map(l => l.box)]);
  const regionBox = (() => {
    // a point well inside the surface: the centre of the biggest added part, nudged until it is inside
    const big = [...F.parts].filter(q => q.sign > 0).sort((a, b) => b.area.a + b.area.b * Math.PI - (a.area.a + a.area.b * Math.PI))[0]!;
    const Q = partPx.get(big.id)!, b = bb(Q);
    return box(b.cx - 20, b.cy - 20, b.cx + 20, b.cy + 20);
  })();

  // ---------- drawing ----------
  const ringPx = (Q: readonly Pt[]) => Q;
  function region(c: Canvas, alpha: number, kParts: number, kCut: number): void {
    if (alpha <= 0) return;
    withAlpha(c, alpha, () => {
      // 1. the surface as one wash (fades as the parts take over)
      if (kParts < 1) withAlpha(c, 1 - kParts, () => wash(c, outerPx, 'first', { seed: 11, ink: null, rough: 1.4, shade: 0.22 }));
      // 2. the parts, each its own wash (rect plain, round parts lighter, triangles a touch darker)
      if (kParts > 0) withAlpha(c, kParts, () => F.parts.forEach((pt, i) => {
        if (pt.sign < 0) return;
        const lift = pt.kind === 'semi' || pt.kind === 'quarter' || pt.kind === 'circle' ? 0.32 : pt.kind === 'tri' || pt.kind === 'trap' || pt.kind === 'para' ? 0.12 : 0;
        wash(c, partPx.get(pt.id)!, 'first', { seed: 20 + i * 7, ink: null, rough: 1.2, lift, shade: 0.2 });
      }));
      // 3. holes show the ground through them
      for (const H of holesPx) wash(c, H, '#1A1D3C', { seed: 41, ink: null, rough: 1.0, shade: 0.05 });
      // 4. removed parts sit in place until they are cut, then lift away
      const kc = E.inOut(clamp(kCut));
      if (kc < 1) F.parts.forEach((pt, i) => {
        if (pt.sign > 0) return;
        const Q = partPx.get(pt.id)!.map(q => [q[0] + kc * 40, q[1] + kc * 90] as Pt);
        withAlpha(c, 1 - kc, () => wash(c, Q, 'first', { seed: 60 + i, ink: null, rough: 1.2, shade: 0.2 }));
      });
      // 5. the ink outline: kept edges always; a notch's arc / a hole's edge appear as the cut happens; the straight
      //    edge the notch took away fades out
      const holeIds = new Set(F.holes.flat().map(q => q.id));
      const cutArcs = new Set(F.removed.length ? F.outer.filter(q => q.kind === 'arc').map(q => q.id) : []);
      for (const pc of [...F.outer, ...F.holes.flat()]) {
        const a = holeIds.has(pc.id) || cutArcs.has(pc.id) ? kc : 1;
        if (a > 0) withAlpha(c, a, () => inkLine(c, piecePx.get(pc.id)!, { col: DUSK.ink, w: 3.5, seed: 70 + pc.id.length, rough: 0.6 }));
      }
      for (const R of removedPx) withAlpha(c, 1 - kc, () => inkLine(c, R, { col: DUSK.ink, w: 3.5, seed: 81, rough: 0.6 }));
    });
  }
  function seams(c: Canvas, k: number, wrongK: number): void {
    const style = p.seam ?? 'dashed';
    if (style === 'none' && wrongK <= 0) return;
    for (const S of seamPx) {
      if (style === 'solid') withAlpha(c, k, () => inkLine(c, S, { col: DUSK.ink, w: 3.5, seed: 91, rough: 0.6 }));
      else if (style === 'dashed') strokePts(c, S, { col: DUSK.cream, lw: 3, dash: [14, 12], alpha: 0.75 * k, cap: 'butt' });
      if (wrongK > 0) strokePts(c, S, { col: 'wrong', lw: 9, alpha: clamp(wrongK), glow: 10 });
    }
  }
  function trace(c: Canvas, k: number, L: readonly Piece[]): void {
    if (k <= 0 || !L.length) return;
    const lens = L.map(q => piecePx.get(q.id)!).map(Q => { let s2 = 0; for (let i = 1; i < Q.length; i++) s2 += Math.hypot(Q[i]![0] - Q[i - 1]![0], Q[i]![1] - Q[i - 1]![1]); return s2; });
    const tot = lens.reduce((a, b) => a + b, 0);
    let done = clamp(k) * tot;
    L.forEach((q, i) => {
      const kk = clamp(done / lens[i]!); done -= lens[i]!;
      if (kk > 0) drawOn(c, piecePx.get(q.id)!, kk, { col: 'second', lw: 8, glow: 8 });
    });
  }
  function dims(c: Canvas, k: number, f: FigFocus): void {
    if (k <= 0) return;
    for (const L of labs) {
      withAlpha(c, E.smooth(k) * clamp(f.dimAlpha?.[L.id] ?? 1), () => {
        for (const ln of L.lines) strokePts(c, ln, { col: 'dim', lw: 2.5, alpha: 0.85 });
        for (const t of L.ticks) strokePts(c, t, { col: 'dim', lw: 3, alpha: 0.85 });
        const pk = f.dim === L.id ? clamp(f.dimK ?? 0) : 0;
        if (pk > 0) {
          const { g } = c;
          g.save(); g.globalAlpha *= pk * 0.28; g.fillStyle = paint(th, 'pick', 'fill');
          g.beginPath(); g.roundRect(L.box.x0 - 14, L.box.y0 - 10, L.box.w + 28, L.box.h + 20, 12); g.fill(); g.restore();
        }
        drawWords(c, L.text, L.x, L.y, L.col, 1, { size: LABEL, align: 'center' });
      });
    }
  }
  function draw(c: Canvas, Pr: Progress<FigStep>, f: FigFocus = {}): void {
    const kR = E.smooth(Pr.k('region')), kP = Pr.k('parts'), kC = Pr.k('cut');
    region(c, kR, kP, F.removed.length || F.holes.length ? kC : 1);
    if ((f.shade ?? 0) > 0) withAlpha(c, clamp(f.shade!) * 0.35, () => { c.g.save(); c.g.fillStyle = paint(th, 'first', 'line'); c.g.beginPath(); for (const Q of [outerPx, ...holesPx]) { Q.forEach((q, i) => (i ? c.g.lineTo(q[0], q[1]) : c.g.moveTo(q[0], q[1]))); c.g.closePath(); } c.g.fill('evenodd'); c.g.restore(); });
    seams(c, Math.max(kP, (p.seam ?? 'dashed') === 'solid' ? kR : 0), f.seamWrong ?? 0);
    const kRm = clamp(f.removedK ?? 0);
    if (kRm > 0) for (const R of removedPx) strokePts(c, R, { col: 'pick', lw: 9, alpha: kRm, glow: 10 });
    if (f.candidate) {
      for (const id of f.candidate) {
        if (id === 'seam') { for (const S of seamPx) strokePts(c, S, { col: 'second', lw: 8, glow: 8 }); continue; }
        const Q = piecePx.get(id); if (Q) strokePts(c, Q, { col: 'second', lw: 8, glow: 8 });
      }
    } else {
      trace(c, Pr.k('trace'), F.outer);
      F.holes.forEach(H => trace(c, Pr.k('holes'), H));
    }
    const pk = clamp(f.pieceK ?? 0);
    if (f.piece && pk > 0) { const Q = piecePx.get(f.piece); if (Q) strokePts(c, Q, { col: 'pick', lw: 12, alpha: pk, glow: 14 }); }
    const ptk = clamp(f.partK ?? 0);
    if (f.part && ptk > 0) { const Q = partPx.get(f.part); if (Q) strokePts(c, ringPx(Q), { col: 'pick', lw: 6, alpha: ptk, closed: true, glow: 10 }); }
    dims(c, Pr.k('dims'), f);
  }
  return {
    kind: 'PlanFigure', fig: F, box: all, scale: s,
    where: {
      fig: figBox,
      piece: id => { const Q = piecePx.get(id); return Q ? bb(Q) : figBox; },
      part: id => { const Q = partPx.get(id); return Q ? bb(Q) : figBox; },
      label: labBox,
      seam: (i = 0) => { const Q = seamPx[i]; return Q ? bb(Q) : figBox; },
      region: regionBox,
    },
    P, draw,
  };
}
