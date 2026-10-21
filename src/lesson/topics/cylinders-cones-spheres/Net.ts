// Net: the flat net of a right rectangular prism, a right triangular prism or a cylinder (the surface-area sub-goals).
// The lateral faces are one strip (length = the base perimeter, width = the height: L = Ph); the two bases sit on
// opposite sides of it. A cylinder's label unrolls to a rectangle 2 pi r long. Faces are washes (first = the lateral
// strip, second = the bases), fold lines are dashed, edge labels sit outside the net, off every line.
//   keys  'net' (show), 'lat' (the lateral strip glows), 'bases' (both bases glow), dims (default 'dims')
import { type Box, type Pt, box, clamp, unionBox } from '../../../core/math';
import { type Canvas, fillPts, strokePts } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import { type Frame, check, hitsLines } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

export type NetSpec =
  | { kind: 'rect'; l: number; w: number; h: number }
  | { kind: 'tri'; a: number; b: number; c: number; h: number }
  | { kind: 'cyl'; r: number; h: number };
/** an edge label: which edge, the text, its colour role, its key */
export interface NetLabel { edge: 'h' | 'f0' | 'f1' | 'f2' | 'f3' | 'baseW' | 'r' | 'C'; text: string; col?: 'first' | 'second' | 'pick' | 'link'; key?: string }
export interface NetBlock { readonly kind: 'Net'; readonly box: Box; draw(c: Canvas, p: Progress<string>): void; where: { strip: Box; bases: Box[] } }

const NAME = 'Net';
export function Net(spec: NetSpec, labels: NetLabel[], fr: Frame, th: Theme): NetBlock {
  void th;
  // ---- the net in units, y up ----
  const strip: Pt[][] = [], bases: Pt[][] = [], folds: Pt[][] = [];
  let circles: { c: Pt; r: number }[] = [];
  const edges: Record<string, [Pt, Pt]> = {};
  let H = 0, W = 0;
  if (spec.kind === 'cyl') {
    const C = 2 * Math.PI * spec.r; H = spec.h; W = C;
    strip.push([[0, 0], [C, 0], [C, H], [0, H]]);
    circles = [{ c: [spec.r * 1.6, H + spec.r], r: spec.r }, { c: [spec.r * 1.6, -spec.r], r: spec.r }];
    edges.h = [[C, 0], [C, H]]; edges.C = [[0, 0], [C, 0]];
    edges.r = [[spec.r * 1.6, H + spec.r], [spec.r * 2.6, H + spec.r]];
  } else {
    const ws = spec.kind === 'rect' ? [spec.l, spec.w, spec.l, spec.w] : [spec.a, spec.b, spec.c];
    H = spec.h;
    let x = 0;
    ws.forEach((w, i) => { strip.push([[x, 0], [x + w, 0], [x + w, H], [x, H]]); edges['f' + i] = [[x, 0], [x + w, 0]]; if (i) folds.push([[x, 0], [x, H]]); x += w; });
    W = x; edges.h = [[W, 0], [W, H]];
    if (spec.kind === 'rect') {
      bases.push([[0, H], [spec.l, H], [spec.l, H + spec.w], [0, H + spec.w]], [[0, 0], [spec.l, 0], [spec.l, -spec.w], [0, -spec.w]]);
      edges.baseW = [[0, H], [0, H + spec.w]];
    } else {
      bases.push([[0, H], [spec.a, H], [0, H + spec.b]], [[0, 0], [spec.a, 0], [0, -spec.b]]);
      edges.baseW = [[0, H], [0, H + spec.b]];
    }
    folds.push([[0, H], [ws[0]!, H]], [[0, 0], [ws[0]!, 0]]);
  }
  const allPts: Pt[] = [...strip.flat(), ...bases.flat(), ...circles.flatMap(c => [[c.c[0] - c.r, c.c[1] - c.r], [c.c[0] + c.r, c.c[1] + c.r]] as Pt[])];
  const x0 = Math.min(...allPts.map(p => p[0])), x1 = Math.max(...allPts.map(p => p[0]));
  const y0 = Math.min(...allPts.map(p => p[1])), y1 = Math.max(...allPts.map(p => p[1]));
  const MX = 150, MY = 70;
  const s = Math.min((fr.w - 2 * MX) / (x1 - x0), (fr.h - 2 * MY) / (y1 - y0), 120);
  check(s > 10, NAME, 'the net would be too small to read');
  const ox = fr.x + fr.w / 2 - s * (x0 + x1) / 2, oy = fr.y + fr.h / 2 + s * (y0 + y1) / 2;
  const T = (p: Pt): Pt => [ox + s * p[0], oy - s * p[1]];
  const circ = (c: { c: Pt; r: number }) => Array.from({ length: 73 }, (_, i) => T([c.c[0] + c.r * Math.cos(i / 72 * 2 * Math.PI), c.c[1] + c.r * Math.sin(i / 72 * 2 * Math.PI)]));
  const S = { strip: strip.map(f => f.map(T)), bases: [...bases.map(f => f.map(T)), ...circles.map(circ)], folds: folds.map(f => f.map(T)) };
  const lines: Pt[][] = [...S.strip.map(f => [...f, f[0]!]), ...S.bases.map(f => [...f, f[0]!]), ...S.folds];
  const shapeBox = unionBox([...S.strip, ...S.bases].map(boxOf));
  // ---- labels: outside the net, off every line ----
  const placed: { L: NetLabel; x: number; y: number; box: Box }[] = [];
  const inShape = (q: Pt) => [...S.strip, ...S.bases].some(P => inPoly(q, P));
  for (const L of labels) {
    const e = edges[L.edge];
    check(e, NAME, `the net has no edge ${L.edge}`);
    let a = T(e[0]), b = T(e[1]);
    if (L.edge === 'r') { a = T(e[0]); b = T(e[1]); }
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    let best: { x: number; y: number; box: Box } | null = null;
    const b0 = wordsBox(L.text, 0, 0, { size: 50, align: 'center' });
    for (const inside of [false, true]) for (const g of [14, 30, 50, 80]) for (const t of [0.5, 0.3, 0.7, 1.35, 1.7, 2.1]) for (const sg of [1, -1]) {
      if (best) break;
      const nx = (-dy / len) * sg, ny = (dx / len) * sg;
      const ext = Math.abs(nx) * b0.w / 2 + Math.abs(ny) * b0.h / 2;
      const X = a[0] + dx * t + nx * (g + ext), Y = a[1] + dy * t + ny * (g + ext);
      const bx = wordsBox(L.text, X, Y, { size: 50, align: 'center' });
      if (bx.x0 < fr.x - 20 || bx.x1 > fr.x + fr.w + 20 || bx.y0 < fr.y - 20 || bx.y1 > fr.y + fr.h + 20) continue;
      if (hitsLines(bx, lines, 8)) continue;
      if (!inside && ([[bx.x0, bx.y0], [bx.x1, bx.y0], [bx.x0, bx.y1], [bx.x1, bx.y1], [bx.cx, bx.cy]] as Pt[]).some(inShape)) continue;
      if (placed.some(q => q.box.x0 < bx.x1 + 10 && bx.x0 < q.box.x1 + 10 && q.box.y0 < bx.y1 + 6 && bx.y0 < q.box.y1 + 6)) continue;
      best = { x: X, y: Y, box: bx };
    }
    check(best, NAME, `no readable place for "${L.text}"`);
    placed.push({ L, ...best });
  }
  const cream = DUSK.cream as never;
  function draw(c: Canvas, P: Progress<string>): void {
    const k = clamp(P.k('net'));
    if (k <= 0) return;
    c.g.save(); c.g.globalAlpha *= k;
    S.strip.forEach((f, i) => wash(c, f, 'first', { seed: 31 + i, rough: 1.4, ink: null, alpha: 0.55 }));
    S.bases.forEach((f, i) => wash(c, f, 'second', { seed: 51 + i, rough: 1.4, ink: null, alpha: 0.55 }));
    const kl = clamp(P.k('lat')), kb = clamp(P.k('bases'));
    if (kl > 0) { const sb = unionBox(S.strip.map(boxOf)); strokePts(c, [[sb.x0, sb.y0], [sb.x1, sb.y0], [sb.x1, sb.y1], [sb.x0, sb.y1]], { col: 'link', lw: 6, alpha: kl, closed: true }); }
    for (const f of S.strip) strokePts(c, f, { col: cream, lw: 3.4, closed: true, alpha: 0.9 });
    for (const f of S.bases) { strokePts(c, f, { col: cream, lw: 3.4, closed: true, alpha: 0.9 }); if (kb > 0) { fillPts(c, f, 'pick', 0.35 * kb); strokePts(c, f, { col: 'pick', lw: 5, closed: true, alpha: kb }); } }
    for (const f of S.folds) strokePts(c, f, { col: cream, lw: 2.4, dash: [10, 8], alpha: 0.6, cap: 'butt' });
    if (spec.kind === 'cyl') { const e = edges.r!; strokePts(c, [T(e[0]), T(e[1])], { col: 'first', lw: 4.5, alpha: clamp(P.k('dims')) }); }
    for (const q of placed) drawWords(c, q.L.text, q.x, q.y, q.L.col ?? 'first', clamp(P.k(q.L.key ?? 'dims')), { size: 50, align: 'center' });
    c.g.restore();
  }
  return { kind: 'Net', box: unionBox([shapeBox, ...placed.map(q => q.box)]), draw, where: { strip: unionBox(S.strip.map(boxOf)), bases: S.bases.map(boxOf) } };
}
function boxOf(P: readonly Pt[]): Box { return box(Math.min(...P.map(q => q[0])), Math.min(...P.map(q => q[1])), Math.max(...P.map(q => q[0])), Math.max(...P.map(q => q[1]))); }
function inPoly(q: Pt, H: readonly Pt[]): boolean { let ins = false; for (let i = 0, j = H.length - 1; i < H.length; j = i++) { const a = H[i]!, b = H[j]!; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) ins = !ins; } return ins; }
