// MapSheet.ts: the pictures of "Use a map scale". One painted map card (a topo sheet: land, a lake, faint contours,
// the scale written in its corner, two pins and the straight line between them) and four ways to read it:
//   MapLines   the map card on top of ScaleLines (scale-calculations' aligned number lines, imported read-only):
//              the map's inch IS the line's inch, so the pin-to-pin line drops straight onto the map row; the rows
//              below read the same position in ground inches and in feet / miles (one length, every unit)
//   Ruler      the map card with a ruler laid under the line (inch ruler with quarter and eighth marks, or a cm ruler
//              with mm marks; the line may start at a whole mark); 'read' glows both ends, 'answer' writes the length
//   Bar        the map card with a bar scale (ground units on a ruler): labels at the ends only, or a 1-unit extension
//              left of 0 split into parts; the line is laid against it
//   Strips     the same ground length (a 1-mile road) drawn at several 1 : n scales, one strip per scale: the
//              smaller n, the longer the line (the larger scale)
//   Range      a zoomed ruler: a reading, the band of true lengths it stands for (half a unit either way), candidates
// Every block checks its own layout (labels inside the frame, no label on another) and throws BlockError otherwise;
// the page draws a block only through tryBlock. Steps are named; draw(c, pr) reads pr.k(step) in 0..1.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, dot, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, frame } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type LinesBlock, type LinesFocus, type LinesParams, ScaleLines } from '../scale-calculations/ScaleLines';
import { fmtT } from './mapMaths';

/** the model frame: wider than the default (the lines need room), ending 50 px before the board */
export const MAPF = frame(60, 70, 1130, 940);
const NUM = 60, WORD = 44, PAD = 22;
const LAND = '#2F4A3E', LAND2 = '#365744', LAKE = '#2C5F8A', CONTOUR = '#7FA08A';
const overlap = (a: Box, b: Box, g = 8) => a.x0 < b.x1 + g && b.x0 < a.x1 + g && a.y0 < b.y1 + g && b.y0 < a.y1 + g;
const inBox = (a: Box, b: Box) => a.x0 >= b.x0 - 0.5 && a.x1 <= b.x1 + 0.5 && a.y0 >= b.y0 - 0.5 && a.y1 <= b.y1 + 0.5;
const frameBox = (fr: Frame) => box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);

interface Lbl { F: Formula; x: number; y: number; box: Box; size: number }
function place(src: string, cx: number, cy: number, size = NUM, anchor: 'center' | 'left' | 'right' = 'center'): Lbl {
  const F = tex(src) as Formula;
  const b0 = texBox(F, 0, 0, { size, align: 'left' });
  const x = anchor === 'center' ? cx - b0.w / 2 - b0.x0 : anchor === 'left' ? cx - b0.x0 : cx - b0.x1;
  const y = cy - b0.cy;
  return { F, x, y, box: texBox(F, x, y, { size, align: 'left' }), size };
}
function lbl(c: Canvas, L: Lbl | null | undefined, k: number, col: Paint, pad = true): void {
  if (!L || k <= 0) return;
  const kk = E.smooth(clamp(k));
  if (pad) withAlpha(c, kk * 0.88, () => { c.g.save(); c.g.fillStyle = DUSK.navy; c.g.beginPath(); c.g.roundRect(L.box.x0 - 10, L.box.y0 - 8, L.box.w + 20, L.box.h + 16, 10); c.g.fill(); c.g.restore(); });
  texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'left', col, k: clamp(k) });
}
/** a word label with its box (centre / left / right anchored at x, vertical middle at y) */
interface Wd { t: string; x: number; y: number; align: 'left' | 'center' | 'right'; box: Box }
const word = (t: string, x: number, y: number, align: Wd['align'] = 'center'): Wd => ({ t, x, y, align, box: wordsBox(t, x, y, { size: WORD, weight: 700, align }) });
function drawWd(c: Canvas, w: Wd | null | undefined, col: Paint, k: number, pad = true): void {
  if (!w || k <= 0) return;
  if (pad) withAlpha(c, E.smooth(clamp(k)) * 0.8, () => { c.g.save(); c.g.fillStyle = DUSK.navy; c.g.beginPath(); c.g.roundRect(w.box.x0 - 10, w.box.y0 - 6, w.box.w + 20, w.box.h + 12, 10); c.g.fill(); c.g.restore(); });
  drawWords(c, w.t, w.x, w.y, col, k, { size: WORD, weight: 700, align: w.align });
}

// ===================== the map card =====================
export interface CardSpec {
  /** the scale written in the corner (TeX), e.g. 1 : 24{,}000 or 1\text{ in} = 10\text{ mi} */
  tag?: string;
  /** the names at the two pins */
  from?: string; to?: string;
  /** the caption (default 'map') */
  cap?: string;
  seed?: number;
}
export interface Card {
  box: Box; tag: Lbl | null; segY: number; names: (Wd | null)[];
  draw(c: Canvas, k: number, kSeg: number, xa: number, xb: number, kNames?: number): void;
}
/** lay out a map card in `b` with the pin line at segY (relative layout: tag row, names row, line row) */
function card(spec: CardSpec, b: Box, xa: number, xb: number, segY: number): Card {
  const cap = spec.cap ?? 'map', capW = wordsBox(cap, 0, 0, { size: WORD, weight: 700 }).w;
  const tagY = b.y0 + PAD + 34;
  const tag = spec.tag ? place(spec.tag, b.x0 + PAD + capW + 34, tagY, NUM, 'left') : null;
  if (tag) check(tag.box.x1 <= b.x1 - 12, 'MapCard', 'the scale is wider than the card');
  // names above the pins; when they would touch, push them apart (from: right-aligned, to: left-aligned)
  const ny = segY - 62;
  let A = spec.from ? word(spec.from, xa, ny) : null, B = spec.to ? word(spec.to, xb, ny) : null;
  if (A && B && overlap(A.box, B.box, 16)) { A = word(spec.from!, xa + 24, ny, 'right'); B = word(spec.to!, xb - 24, ny, 'left'); }
  const inner = box(b.x0 + 8, b.y0, b.x1 - 8, b.y1);
  if (A && !inBox(A.box, inner)) A = word(spec.from!, Math.max(inner.x0 + 4, A.box.x0) , ny, 'left');
  if (B && !inBox(B.box, inner)) B = word(spec.to!, Math.min(inner.x1 - 4, B.box.x1), ny, 'right');
  if (A && B && overlap(A.box, B.box, 12)) { A = null; B = null; }
  if (tag) for (const w of [A, B]) if (w && overlap(w.box, tag.box, 8)) { if (w === A) A = null; else B = null; }
  const seed = spec.seed ?? 3;
  function draw(c: Canvas, k: number, kSeg: number, x0: number, x1: number, kNames = kSeg): void {
    if (k <= 0) return;
    withAlpha(c, E.smooth(clamp(k)), () => {
      wash(c, rectPts(b.x0, b.y0, b.w, b.h, 12), LAND, { seed, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.22 });
      // terrain: a lake in the top-right corner, a darker woods patch, faint contour lines (all far from the labels)
      c.g.save(); c.g.beginPath(); c.g.roundRect(b.x0 + 4, b.y0 + 4, b.w - 8, b.h - 8, 10); c.g.clip();
      const lx = b.x1 - 150, ly = b.y0 + 58;
      const lake: [number, number][] = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return [lx + Math.cos(a) * (120 + 14 * Math.sin(3 * a + seed)), ly + Math.sin(a) * (54 + 8 * Math.cos(2 * a))]; });
      wash(c, lake, LAKE, { seed: seed + 9, rough: 2, ink: null, alpha: 0.85, shade: 0.1 });
      const woods: [number, number][] = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return [b.x0 + 120 + Math.cos(a) * (150 + 20 * Math.sin(4 * a)), b.y1 - 20 + Math.sin(a) * 60]; });
      wash(c, woods, LAND2, { seed: seed + 4, rough: 3, ink: null, alpha: 0.9, shade: 0.05 });
      for (let i = 0; i < 4; i++) {
        const yy = b.y0 + b.h * (0.3 + 0.18 * i);
        const P: [number, number][] = Array.from({ length: 40 }, (_, j) => { const x = b.x0 + (j / 39) * b.w; return [x, yy + 16 * Math.sin(j / 5 + i + seed) + 10 * Math.cos(j / 9 + 2 * i)]; });
        strokePts(c, P, { col: CONTOUR as Paint, lw: 1.6, alpha: 0.28 });
      }
      c.g.restore();
      // caption + scale
      const cy = tagY;
      withAlpha(c, 0.85, () => { c.g.save(); c.g.fillStyle = DUSK.navy; c.g.beginPath(); c.g.roundRect(b.x0 + PAD - 10, cy - WORD * 0.6, capW + 20, WORD * 1.2, 10); c.g.fill(); c.g.restore(); });
      drawWords(c, cap, b.x0 + PAD, cy, 'dim', 1, { size: WORD, weight: 700 });
      lbl(c, tag, 1, 'ink');
    });
    // the straight line between the pins
    if (kSeg > 0 && k > 0) {
      const xe = x0 + (x1 - x0) * E.out(clamp(kSeg));
      strokePts(c, [[x0, segY], [xe, segY]], { col: 'first', lw: 7 });
      for (const [x, kk] of [[x0, kSeg * 4], [x1, (kSeg - 0.75) * 4]] as const) {
        if (kk <= 0) continue;
        dot(c, x, segY, 15, DUSK.navy as Paint, clamp(kk));
        dot(c, x, segY, 10, 'first', clamp(kk));
      }
      drawWd(c, A, 'first', kNames); drawWd(c, B, 'first', kNames);
    }
  }
  return { box: b, tag, segY, names: [A, B], draw };
}
const CARD_H = 250;

// ===================== MapLines: the map card + aligned number lines =====================
export interface MapLinesParams { lines: LinesParams; card?: CardSpec & { len: number } }
export type MapLinesStep = 'map' | 'seg' | 'drop' | string;
export interface MapLinesBlock {
  readonly kind: 'MapLines';
  readonly lines: LinesBlock;
  readonly where: LinesBlock['where'] & { map: Box; seg: Box; tagBox: Box };
  draw(c: Canvas, pr: { k(s: string): number }, f?: LinesFocus): void;
}
export function MapLines(p: MapLinesParams, fr: Frame = MAPF): MapLinesBlock {
  const has = !!p.card;
  const lf = has ? frame(fr.x, fr.y + CARD_H + 24, fr.w, fr.h - CARD_H - 24) : fr;
  const L = ScaleLines(p.lines, lf);
  const r0 = L.where.row(0), n = p.lines.n, step0 = p.lines.rows[0]!.step;
  const U = r0.w / n, X = (v: number) => r0.x0 + (v / step0) * U;
  let C: Card | null = null, xa = 0, xb = 0;
  if (p.card) {
    check(p.card.len > 0 && p.card.len <= n * step0 + 1e-9, 'MapLines', 'the map line does not fit the scale line');
    xa = X(0); xb = X(p.card.len);
    C = card(p.card, box(fr.x, fr.y, fr.x + fr.w, fr.y + CARD_H), xa, xb, fr.y + CARD_H - 56);
    if (C.tag) check(inBox(C.tag.box, frameBox(fr)), 'MapLines', 'the scale tag leaves the frame');
  }
  const segBox = C ? box(xa - 16, C.segY - 16, xb + 16, C.segY + 16) : r0;
  return {
    kind: 'MapLines', lines: L,
    where: { ...L.where, map: C?.box ?? r0, seg: segBox, tagBox: C?.tag?.box ?? r0 },
    draw(c, pr, f) {
      if (C) {
        const kM = clamp(pr.k('map')), kS = clamp(pr.k('seg'));
        C.draw(c, kM, kS, xa, xb);
        // projection: the map's own length drops onto the map row (dashed, it stops above the row's labels)
        const kD = Math.min(kS, clamp(pr.k('lines')));
        if (kD > 0) {
          const yb = r0.cy - 112, ya = C.segY + 18;
          if (yb > ya + 10) for (const x of [xa, xb]) strokePts(c, [[x, ya], [x, ya + (yb - ya) * E.smooth(kD)]], { col: 'first', lw: 3, dash: [8, 9], alpha: 0.7 });
        }
      }
      L.draw(c, pr, f);
    },
  };
}

// ===================== Ruler: measure the line on the map =====================
export interface RulerParams extends CardSpec {
  unit: 'in' | 'cm';
  /** the whole mark the line starts at (0, 1, 2) */
  start: number;
  /** the true length (quarter inches / whole mm) */
  len: number;
  /** ruler length in units (6 in, 10 cm) */
  total: number;
  /** TeX of the length, written at 'answer' */
  ans?: string;
}
export type RulerStep = 'map' | 'seg' | 'ruler' | 'read' | 'answer';
export interface RulerBlock { readonly kind: 'Ruler'; readonly where: { map: Box; seg: Box; ruler: Box; answer: Box; start: Box; end: Box }; draw(c: Canvas, pr: { k(s: RulerStep): number }): void }
export function Ruler(p: RulerParams, fr: Frame = MAPF): RulerBlock {
  check(p.total >= 2 && p.total <= 16, 'Ruler', 'ruler length 2 to 16 units');
  check(p.start >= 0 && p.start + p.len <= p.total + 1e-9 && p.len > 0, 'Ruler', 'the line does not fit the ruler');
  const RH = 150, ansH = p.ans ? 100 : 0;
  const H = 120 + 70 + 40 + RH + ansH + 40;
  check(H <= fr.h, 'Ruler', 'the ruler does not fit');
  const y0 = fr.y + (fr.h - H) / 2;
  const cardB = box(fr.x, y0, fr.x + fr.w, y0 + H);
  const rx0 = fr.x + 50, rx1 = fr.x + fr.w - 50;
  // the unit word sits at the ruler's right end, clear of the last number
  const unitWd = wordsBox(p.unit, 0, 0, { size: WORD, weight: 700 }).w;
  const P = (rx1 - rx0 - 90 - unitWd - 30) / p.total, zero = rx0 + 30;
  const X = (v: number) => zero + v * P;
  const segY = y0 + 120 + 70 + 10;
  const C = card(p, cardB, X(p.start), X(p.start + p.len), segY);
  const rTop = segY + 26, rBot = rTop + RH;
  const nums: Lbl[] = [];
  for (let i = 0; i <= p.total; i++) nums.push(place(String(i), X(i), rTop + 98, NUM));
  for (let i = 0; i + 1 < nums.length; i++) check(!overlap(nums[i]!.box, nums[i + 1]!.box, 6), 'Ruler', 'ruler numbers touch');
  const ans = p.ans ? place(p.ans, (X(p.start) + X(p.start + p.len)) / 2, rBot + 56, NUM) : null;
  if (ans) { const fb = frameBox(fr); if (!inBox(ans.box, fb)) { const sh = ans.box.x0 < fb.x0 + 10 ? fb.x0 + 10 - ans.box.x0 : fb.x1 - 10 - ans.box.x1; ans.x += sh; ans.box = box(ans.box.x0 + sh, ans.box.y0, ans.box.x1 + sh, ans.box.y1); } }
  if (C.tag) check(inBox(C.tag.box, frameBox(fr)), 'Ruler', 'the scale leaves the frame');
  const unitW = word(p.unit, rx1 - 16, rTop + 98, 'right');
  const tickLen = (i: number, per: number): number => {
    if (p.unit === 'in') return i % per === 0 ? 62 : i % (per / 2) === 0 ? 46 : i % (per / 4) === 0 ? 34 : 20;
    return i % per === 0 ? 56 : i % (per / 2) === 0 ? 40 : 24;
  };
  const per = p.unit === 'in' ? 8 : 10;
  return {
    kind: 'Ruler',
    where: { map: cardB, seg: box(X(p.start) - 16, segY - 16, X(p.start + p.len) + 16, segY + 16), ruler: box(rx0, rTop, rx1, rBot), answer: ans?.box ?? box(0, 0, 0, 0), start: box(X(p.start) - 10, rTop, X(p.start) + 10, rTop + 70), end: box(X(p.start + p.len) - 10, rTop, X(p.start + p.len) + 10, rTop + 70) },
    draw(c, pr) {
      const k = (s: RulerStep) => clamp(pr.k(s));
      C.draw(c, k('map'), k('seg'), X(p.start), X(p.start + p.len));
      const kR = k('ruler');
      if (kR > 0) withAlpha(c, E.smooth(kR), () => {
        wash(c, rectPts(rx0, rTop, rx1 - rx0, RH, 8), '#E8D9B0', { seed: 61, rough: 0.8, ink: DUSK.ink, inkW: 3, shade: 0.15 });
        for (let i = 0; i <= p.total * per; i++) {
          const x = zero + (i / per) * P;
          strokePts(c, [[x, rTop + 2], [x, rTop + tickLen(i, per)]], { col: DUSK.ink as Paint, lw: i % per === 0 ? 3.5 : 2.2 });
        }
        for (const L of nums) texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'left', col: DUSK.ink as Paint, k: 1 });
        drawWords(c, p.unit, unitW.x, unitW.y, DUSK.ink as Paint, 1, { size: WORD, weight: 700, align: 'right' });
      });
      const kRd = k('read');
      if (kRd > 0) for (const x of [X(p.start), X(p.start + p.len)]) strokePts(c, [[x, segY - 30], [x, rTop + 70]], { col: 'pick', lw: 5, glow: 12, alpha: E.smooth(kRd) });
      lbl(c, ans, k('answer'), 'link');
    },
  };
}

// ===================== Bar: a bar scale is a ruler in ground units =====================
export interface BarParams extends CardSpec {
  unit: 'mi' | 'km';
  /** ground units per main interval, and the number of main intervals */
  step: number; n: number;
  /** extension left of 0: one main interval split into `ext` parts (0 = none) */
  ext: 0 | 2 | 4 | 5;
  /** 'ends': only 0 and the end are labelled (count intervals), 'all': every main mark */
  labels: 'ends' | 'all';
  /** the line from a to b in ground units (a < 0 lies in the extension) */
  a: number; b: number;
  ans?: string;
}
export type BarStep = 'map' | 'seg' | 'bar' | 'read' | 'answer';
export interface BarBlock { readonly kind: 'Bar'; readonly where: { map: Box; seg: Box; bar: Box; answer: Box }; draw(c: Canvas, pr: { k(s: BarStep): number }): void }
export function Bar(p: BarParams, fr: Frame = MAPF): BarBlock {
  check(p.n >= 2 && p.n <= 10 && p.step > 0, 'Bar', 'bar intervals');
  const lo = p.ext ? -p.step : 0;
  check(p.a >= lo - 1e-9 && p.b <= p.n * p.step + 1e-9 && p.b > p.a, 'Bar', 'the line does not fit the bar');
  const BH = 30, ansH = p.ans ? 100 : 0;
  const H = 120 + 70 + 70 + BH + 90 + ansH + 30;
  check(H <= fr.h, 'Bar', 'the bar does not fit');
  const y0 = fr.y + (fr.h - H) / 2;
  const cardB = box(fr.x, y0, fr.x + fr.w, y0 + H);
  const unitW = wordsBox(p.unit, 0, 0, { size: WORD, weight: 700 }).w;
  const bx0 = fr.x + 70, bx1 = fr.x + fr.w - 70 - unitW - 30;
  const U = (bx1 - bx0) / (p.n + (p.ext ? 1 : 0));
  check(U >= 60, 'Bar', 'the bar intervals are too short');
  const X = (v: number) => bx0 + ((v - lo) / p.step) * U;
  const segY = y0 + 120 + 70 + 10;
  const C = card(p, cardB, X(p.a), X(p.b), segY);
  const barY = segY + 60;
  const labs: Lbl[] = [];
  const at = (v: number) => place(fmtT(v), X(v), barY + BH + 46, NUM);
  if (p.ext) labs.push(at(p.step));
  labs[labs.length] = place('0', X(0), barY + BH + 46, NUM);
  if (p.labels === 'all') for (let i = 1; i <= p.n; i++) labs.push(at(i * p.step)); else labs.push(at(p.n * p.step));
  // the extension's left label sits at its left end
  if (p.ext) { const e = place(fmtT(p.step), X(lo), barY + BH + 46, NUM); labs[0] = e; }
  for (let i = 0; i + 1 < labs.length; i++) check(!overlap(labs[i]!.box, labs[i + 1]!.box, 6), 'Bar', 'bar labels touch');
  const uW = word(p.unit, X(p.n * p.step) + 40, barY + BH / 2, 'left');
  check(uW.box.x1 <= fr.x + fr.w - 10, 'Bar', 'the unit leaves the frame');
  const ans = p.ans ? place(p.ans, (X(p.a) + X(p.b)) / 2, barY + BH + 46 + 96, NUM) : null;
  if (C.tag) check(inBox(C.tag.box, frameBox(fr)), 'Bar', 'the scale leaves the frame');
  return {
    kind: 'Bar',
    where: { map: cardB, seg: box(X(p.a) - 16, segY - 16, X(p.b) + 16, segY + 16), bar: box(X(lo), barY, X(p.n * p.step), barY + BH), answer: ans?.box ?? box(0, 0, 0, 0) },
    draw(c, pr) {
      const k = (s: BarStep) => clamp(pr.k(s));
      C.draw(c, k('map'), k('seg'), X(p.a), X(p.b));
      const kB = k('bar');
      if (kB > 0) withAlpha(c, E.smooth(kB), () => {
        // main intervals alternate dark / light; the extension is split into its parts, alternating too
        const blocks: [number, number][] = [];
        if (p.ext) for (let i = 0; i < p.ext; i++) blocks.push([lo + (i * p.step) / p.ext, lo + ((i + 1) * p.step) / p.ext]);
        for (let i = 0; i < p.n; i++) blocks.push([i * p.step, (i + 1) * p.step]);
        blocks.forEach(([u, v], i) => {
          const col = (i % 2 === 0 ? DUSK.cream : DUSK.ink) as Paint;
          c.g.save(); c.g.fillStyle = col === DUSK.cream ? DUSK.cream : '#2A2340'; c.g.fillRect(X(u), barY, X(v) - X(u), BH); c.g.restore();
        });
        strokePts(c, rectPts(X(lo), barY, X(p.n * p.step) - X(lo), BH), { col: DUSK.cream as Paint, lw: 3, closed: true });
        for (let i = 0; i <= p.n; i++) strokePts(c, [[X(i * p.step), barY - 10], [X(i * p.step), barY + BH + 10]], { col: 'ink', lw: 3 });
        if (p.ext) strokePts(c, [[X(lo), barY - 10], [X(lo), barY + BH + 10]], { col: 'ink', lw: 3 });
        for (const L of labs) lbl(c, L, 1, 'ink', false);
        drawWd(c, uW, 'ink', 1, false);
      });
      const kRd = k('read');
      if (kRd > 0) for (const x of [X(p.a), X(p.b)]) strokePts(c, [[x, segY - 30], [x, barY + BH + 12]], { col: 'pick', lw: 5, glow: 12, alpha: E.smooth(kRd) });
      lbl(c, ans, k('answer'), 'link');
    },
  };
}

// ===================== Strips: one ground length at several scales =====================
export interface StripsParams {
  /** the scales (n of 1 : n), top to bottom */
  ns: number[];
  /** the ground length drawn on every strip, in miles */
  mi: number;
  /** what it is ('1-mile road') */
  name: string;
  /** TeX length labels written at 'answer' (one per strip; '' = none) */
  ans?: string[];
  /** a strip to ring (pick) */
  pick?: number;
  /** the tag of each strip instead of 1 : n (e.g. an enlarged copy) */
  tags?: string[];
}
export type StripsStep = 'rows' | 'lines' | 'answer' | 'pick';
export interface StripsBlock { readonly kind: 'Strips'; readonly where: { row(i: number): Box; line(i: number): Box; name: Box }; draw(c: Canvas, pr: { k(s: StripsStep): number }): void }
export function Strips(p: StripsParams, fr: Frame = MAPF): StripsBlock {
  const m = p.ns.length;
  check(m >= 2 && m <= 4, 'Strips', 'two to four scales');
  const tags = p.ns.map((n, i) => place(p.tags?.[i] ?? `1 : ${fmtT(n)}`, 0, 0, NUM, 'left'));
  const tagW = Math.max(...tags.map(t => t.box.w));
  const lens = p.ns.map(n => (p.mi * 63360) / n);   // inches on the map
  const sx0 = fr.x + tagW + 50, sx1 = fr.x + fr.w - 10;
  const lineX0 = sx0 + 40;
  const ansW = Math.max(0, ...(p.ans ?? []).map(s => (s ? place(s, 0, 0).box.w : 0)));
  const room = sx1 - 30 - lineX0 - (ansW ? ansW + 40 : 0);
  const ppi = Math.min(240, room / Math.max(...lens));
  check(ppi > 20, 'Strips', 'the longest line does not fit');
  const RH = 150, GAP = 34, top = 90;
  const H = top + m * RH + (m - 1) * GAP;
  check(H <= fr.h, 'Strips', 'the strips do not fit');
  const y0 = fr.y + (fr.h - H) / 2;
  const name = word(p.name, fr.x + fr.w / 2, y0 + 30);
  const rows = p.ns.map((_, i) => box(sx0, y0 + top + i * (RH + GAP), sx1, y0 + top + i * (RH + GAP) + RH));
  tags.forEach((t, i) => { const r = rows[i]!; const L = place(p.tags?.[i] ?? `1 : ${fmtT(p.ns[i]!)}`, fr.x + 6, r.cy, NUM, 'left'); tags[i] = L; });
  const lineY = (i: number) => rows[i]!.cy + 18;
  const ends = lens.map(l => lineX0 + l * ppi);
  const ans = (p.ans ?? []).map((s, i) => (s ? place(s, ends[i]! + 28, lineY(i), NUM, 'left') : null));
  for (const a of ans) if (a) check(a.box.x1 <= sx1 - 6, 'Strips', 'a length label leaves its strip');
  return {
    kind: 'Strips',
    where: { row: i => rows[i]!, line: i => box(lineX0, lineY(i) - 14, ends[i]!, lineY(i) + 14), name: name.box },
    draw(c, pr) {
      const k = (s: StripsStep) => clamp(pr.k(s));
      const kR = k('rows'), kL = k('lines'), kA = k('answer'), kP = k('pick');
      drawWd(c, name, 'first', kR, false);
      rows.forEach((r, i) => {
        if (kR <= 0) return;
        withAlpha(c, E.smooth(kR), () => {
          wash(c, rectPts(r.x0, r.y0, r.w, r.h, 10), LAND, { seed: 11 + i, rough: 1, ink: DUSK.ink, inkW: 3, shade: 0.2 });
          c.g.save(); c.g.beginPath(); c.g.rect(r.x0 + 4, r.y0 + 4, r.w - 8, r.h - 8); c.g.clip();
          for (let j = 0; j < 2; j++) {
            const yy = r.y0 + r.h * (0.3 + 0.4 * j);
            const P: [number, number][] = Array.from({ length: 30 }, (_, q) => [r.x0 + (q / 29) * r.w, yy + 10 * Math.sin(q / 4 + i + j)]);
            strokePts(c, P, { col: CONTOUR as Paint, lw: 1.5, alpha: 0.25 });
          }
          c.g.restore();
          lbl(c, tags[i], 1, 'ink', false);
        });
        if (kL > 0) {
          const xe = lineX0 + (ends[i]! - lineX0) * E.out(kL);
          strokePts(c, [[lineX0, lineY(i)], [Math.max(lineX0 + 2, xe), lineY(i)]], { col: 'first', lw: 9 });
          dot(c, lineX0, lineY(i), 9, 'first', kL);
          if (kL >= 1) dot(c, ends[i]!, lineY(i), 9, 'first', 1);
        }
        lbl(c, ans[i], kA, 'link');
        if (kP > 0 && p.pick === i) inkLine(c, rectPts(r.x0 - 10, r.y0 - 10, r.w + 20, r.h + 20, 16), { col: 'pick', w: 5, closed: true, alpha: E.smooth(kP), seed: 7 });
      });
    },
  };
}

// ===================== Range: a reading stands for a band of true lengths =====================
export interface RangeParams {
  lo: number; hi: number;
  /** tick spacing and labelled-tick spacing */
  minor: number; major: number;
  reading: number;
  /** the reading's precision (0.1 cm, 1 mm, 1/4 in): the band is half of it either way */
  unitStep: number;
  unit: string;
  /** label formatter: decimals (default) or quarter-inch fractions */
  frac?: boolean;
  cands?: { v: number }[];
  /** show the band's end values at 'ends' */
  ends?: boolean;
}
export type RangeStep = 'line' | 'reading' | 'band' | 'ends' | 'cands';
export interface RangeBlock { readonly kind: 'Range'; readonly where: { line: Box; band: Box; reading: Box }; draw(c: Canvas, pr: { k(s: RangeStep): number }): void }
const fracT = (x: number): string => {
  const e = Math.round(x * 16), w = Math.floor(e / 16);
  let r = e - 16 * w, d = 16;
  if (r === 0) return String(w);
  while (r % 2 === 0) { r /= 2; d /= 2; }
  return `${w ? w : ''}\\tfrac{${r}}{${d}}`;
};
export function Range(p: RangeParams, fr: Frame = MAPF): RangeBlock {
  check(p.hi > p.lo && p.reading > p.lo && p.reading < p.hi, 'Range', 'the reading lies off the line');
  const lab = (v: number) => (p.frac ? fracT(v) : fmtT(Math.round(v * 1e6) / 1e6));
  const x0 = fr.x + 60, unitWd = wordsBox(p.unit, 0, 0, { size: WORD, weight: 700 }).w, x1 = fr.x + fr.w - 60 - unitWd - 56;
  const X = (v: number) => x0 + ((v - p.lo) / (p.hi - p.lo)) * (x1 - x0);
  const lineY = fr.y + fr.h * 0.5;
  const half = p.unitStep / 2, a = p.reading - half, b = p.reading + half;
  const majors: Lbl[] = [];
  const nMaj = Math.round((p.hi - p.lo) / p.major);
  for (let i = 0; i <= nMaj; i++) { const v = p.lo + i * p.major; majors.push(place(lab(v), X(v), lineY + 72, NUM)); }
  for (let i = 0; i + 1 < majors.length; i++) check(!overlap(majors[i]!.box, majors[i + 1]!.box, 8), 'Range', 'tick labels touch');
  const reading = place(lab(p.reading), X(p.reading), lineY - 210, NUM);
  const ends = p.ends ? [place(lab(a), X(a), lineY - 92, NUM), place(lab(b), X(b), lineY - 92, NUM)] : [];
  if (ends.length) check(!overlap(ends[0]!.box, ends[1]!.box, 8), 'Range', 'the band ends touch');
  const cands = (p.cands ?? []).map(cd => ({ v: cd.v, L: place(lab(cd.v), X(cd.v), lineY + 170, NUM) }));
  for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) check(!overlap(cands[i]!.L.box, cands[j]!.L.box, 8), 'Range', 'candidate labels touch');
  const fb = frameBox(fr);
  for (const L of [...majors, reading, ...ends, ...cands.map(c => c.L)]) check(inBox(L.box, fb), 'Range', 'a label leaves the frame');
  const nMin = Math.round((p.hi - p.lo) / p.minor);
  const uW = word(p.unit, x1 + 56, lineY - 28, 'left');
  return {
    kind: 'Range',
    where: { line: box(x0, lineY - 20, x1, lineY + 20), band: box(X(a), lineY - 40, X(b), lineY + 40), reading: reading.box },
    draw(c, pr) {
      const k = (s: RangeStep) => clamp(pr.k(s));
      const kL = k('line');
      if (kL > 0) withAlpha(c, E.smooth(kL), () => {
        wash(c, rectPts(x0 - 40, lineY - 60, x1 - x0 + 80, 60, 8), '#E8D9B0', { seed: 63, rough: 0.8, ink: DUSK.ink, inkW: 3, shade: 0.12 });
        for (let i = 0; i <= nMin; i++) {
          const v = p.lo + i * p.minor, x = X(v);
          const isMaj = Math.abs((v - p.lo) / p.major - Math.round((v - p.lo) / p.major)) < 1e-6;
          const isHalf = !isMaj && Math.abs((v - p.lo) / (p.major / 2) - Math.round((v - p.lo) / (p.major / 2))) < 1e-6;
          strokePts(c, [[x, lineY], [x, lineY - (isMaj ? 52 : isHalf ? 36 : 22)]], { col: DUSK.ink as Paint, lw: isMaj ? 3.5 : 2.2 });
        }
        strokePts(c, [[x0 - 40, lineY], [x1 + 40, lineY]], { col: 'ink', lw: 4 });
        for (const L of majors) lbl(c, L, 1, 'dim', false);
        drawWd(c, uW, 'dim', 1, false);
      });
      const kB = k('band');
      if (kB > 0) withAlpha(c, E.smooth(kB), () => {
        c.g.save(); c.g.fillStyle = 'rgba(180,234,106,0.32)'; c.g.fillRect(X(a), lineY - 64, (X(b) - X(a)) * E.out(kB), 70); c.g.restore();
        strokePts(c, [[X(a), lineY - 70], [X(a), lineY + 12]], { col: 'link', lw: 4 });
        strokePts(c, [[X(b), lineY - 70], [X(b), lineY + 12]], { col: 'link', lw: 4, alpha: E.smooth(kB) });
      });
      const kR = k('reading');
      if (kR > 0) {
        strokePts(c, [[X(p.reading), lineY - 170], [X(p.reading), lineY + 10]], { col: 'first', lw: 6, alpha: E.smooth(kR) });
        lbl(c, reading, kR, 'first');
      }
      for (const L of ends) lbl(c, L, k('ends'), 'link');
      const kC = k('cands');
      for (const cd of cands) {
        if (kC <= 0) continue;
        // the dashed drop skips any tick label it would cross (a leader never runs through notation)
        const x = X(cd.v), y1 = cd.L.box.y0 - 10;
        const cut = majors.find(L => x > L.box.x0 - 8 && x < L.box.x1 + 8);
        const segs: [number, number][] = cut ? [[lineY + 16, cut.box.y0 - 8], [cut.box.y1 + 8, y1]] : [[lineY + 16, y1]];
        for (const [ya, yb] of segs) if (yb > ya + 4) strokePts(c, [[x, ya], [x, yb]], { col: 'pick', lw: 4, dash: [7, 7], alpha: E.smooth(kC) });
        dot(c, X(cd.v), lineY, 9, 'pick', kC);
        lbl(c, cd.L, kC, 'pick');
      }
    },
  };
}
