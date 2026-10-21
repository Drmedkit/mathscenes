// Chance.ts: the painted models of the probability lesson, each laid out inside a Frame, with named steps (read
// through a Progress) and `where` boxes for annotation. Colour roles: first (amber) = all outcomes / the total,
// link (lime) = the event and its probability, second (teal) = the other outcomes, pick (lavender) = one outcome
// in focus. Marble / sector colours are OBJECT colours (blue, white, pink, gray) and never play a role.
//   Bag       a cloth bag and its marbles laid out beside it, each marble named (B1 B2 B3 W), + optional 0-1 scale
//   Scale     the 0-1 probability scale with the five words and pins
//   Cube      the six faces of a number cube (pips)
//   Spinner   equal parts, grouped into sectors (equal or not); the parts stay visible so no angle is measured
//   Bars      counts or probabilities per category, with an optional reference line
//   Strip     n trials as one strip cut into d equal parts (prediction: about k/d of n)
//   Run       the running share of hits over the trials, against the probability (linear or log x axis)
//   Dots      a dot plot of reference batches with one observation
//   Digits    a random-digit string cut into trials
//   Table     a two-stage outcome table;  Tree  a coin-toss tree;  Streak  past results and the next trial
// The blocks throw (BlockError) when the picture would not be readable: numbers >= 60 px, labels >= 44 px.
import { type Box, box, clamp, lerp, unionBox, boxesOverlap } from '../../../core/math';
import { circlePts, rectPts, arcPts } from '../../../core/pts';
import { type Canvas, dot, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK, dusk } from '../../dusk';
import { type Frac, type Group, type MarbleCol, type Outcome, bagSpace, WORDS, num } from './chanceMaths';

const NAME = 'Chance';
export const OBJ: Record<MarbleCol, string> = { blue: '#3F67D9', white: '#ECE6F1', pink: '#E26A9F', gray: '#8E91A9' };
const CREAM = DUSK.cream;
type Role = 'first' | 'second' | 'link' | 'pick' | 'wrong' | 'ink' | 'dim';

export interface ChanceBlock<W = Record<string, unknown>> {
  readonly box: Box;
  readonly where: W;
  draw(c: Canvas, P: Progress<string>): void;
}

// ---------- shared bits ----------
interface TexLabel { F: Formula; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; box: Box }
function texLabel(src: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right' = 'center'): TexLabel {
  const F = tex(src) as Formula;
  return { F, x, y, size, align, box: texBox(F, x, y, { size, align }) };
}
function drawTex(c: Canvas, L: TexLabel, col: Paint, k: number, alpha = 1): void {
  if (k <= 0) return;
  texDraw(c, L.F, L.x, L.y, { size: L.size, align: L.align, col, k: clamp(k), alpha });
}
interface WordLabel { text: string; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; box: Box }
function wordLabel(text: string, x: number, y: number, size = 48, align: 'left' | 'center' | 'right' = 'center'): WordLabel {
  check(size >= 44, NAME, `label "${text}" below 44 px`);
  return { text, x, y, size, align, box: wordsBox(text, x, y, { size, align }) };
}
const drawWord = (c: Canvas, L: WordLabel, col: Paint, k: number) => drawWords(c, L.text, L.x, L.y, col, k, { size: L.size, align: L.align });
/** a glowing role-coloured ring around a box (rounded) */
export function ring(c: Canvas, R: Box, col: Role, k: number, r = 16, lw = 5): void {
  if (k <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(k);
  g.strokeStyle = paint(dusk, col, 'fill'); g.lineWidth = lw;
  g.shadowColor = paint(dusk, col, 'fill'); g.shadowBlur = 8;
  g.beginPath(); g.roundRect(R.x0, R.y0, R.w, R.h, r); g.stroke(); g.restore();
}
function ringCircle(c: Canvas, x: number, y: number, r: number, col: Role, k: number): void {
  if (k <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(k);
  g.strokeStyle = paint(dusk, col, 'fill'); g.lineWidth = 6; g.shadowColor = paint(dusk, col, 'fill'); g.shadowBlur = 10;
  g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * E.inOut(clamp(k))); g.stroke(); g.restore();
}
const rise = (c: Canvas, k: number, fn: () => void) => withAlpha(c, E.smooth(clamp(k)), () => { c.g.save(); c.g.translate(0, (1 - E.smooth(clamp(k))) * 18); fn(); c.g.restore(); });
/** a staggered share of k for item i of n */
const stag = (k: number, i: number, n: number, ratio = 0.5) => clamp((k - (i / Math.max(1, n)) * ratio) / (1 - ratio));

/** a marble: a round wash, a soft highlight, one ink line */
export function marble(c: Canvas, x: number, y: number, r: number, col: MarbleCol | string, seed: number, alpha = 1): void {
  const hex = col in OBJ ? OBJ[col as MarbleCol] : col;
  withAlpha(c, alpha, () => {
    wash(c, circlePts(x, y, r, 40), hex as Paint, { seed, rough: 1.1, ink: DUSK.ink, inkW: 3, shade: 0.35 });
    const { g } = c;
    g.save(); g.globalAlpha *= 0.55; g.fillStyle = '#FFFFFF';
    g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); g.fill(); g.restore();
  });
}
/** the cloth bag (a sack with a gathered neck and a cord) */
function sack(c: Canvas, B: Box, seed: number): void {
  const { x0, y0, w, h } = B;
  const X = (u: number) => x0 + u * w, Y = (v: number) => y0 + v * h;
  const P: [number, number][] = [];
  /** a cubic from the last point, sampled */
  const cub = (c1: [number, number], c2: [number, number], e: [number, number], n = 18) => {
    const s = P[P.length - 1]!;
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      P.push([u * u * u * s[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0], u * u * u * s[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1]]);
    }
  };
  const neckY = 0.25;
  P.push([X(0.62), Y(neckY)]);
  cub([X(1.04), Y(0.36)], [X(1.02), Y(1.0)], [X(0.5), Y(1.0)]);          // right side down to the bottom
  cub([X(-0.02), Y(1.0)], [X(-0.04), Y(0.36)], [X(0.38), Y(neckY)]);     // left side up to the neck
  cub([X(0.3), Y(0.16)], [X(0.16), Y(0.04)], [X(0.22), Y(0.0)], 10);     // the ruffle, left
  cub([X(0.36), Y(0.07)], [X(0.42), Y(-0.03)], [X(0.5), Y(0.03)], 8);    // a fold in the cloth
  cub([X(0.58), Y(-0.03)], [X(0.66), Y(0.07)], [X(0.78), Y(0.0)], 8);
  cub([X(0.84), Y(0.04)], [X(0.7), Y(0.16)], [X(0.62), Y(neckY)], 10);   // the ruffle, right
  wash(c, P, '#8C6B52', { seed, ink: DUSK.ink, inkW: 3, shade: 0.4, rough: 1.6 });
  // the drawstring and its two loose ends
  inkLine(c, [[X(0.35), Y(neckY + 0.01)], [X(0.65), Y(neckY + 0.01)]], { col: CREAM, w: 5, seed: seed + 3, alpha: 0.85 });
  inkLine(c, [[X(0.62), Y(neckY + 0.02)], [X(0.74), Y(neckY + 0.14)], [X(0.72), Y(neckY + 0.24)]], { col: CREAM, w: 4, seed: seed + 4, alpha: 0.8 });
  inkLine(c, [[X(0.6), Y(neckY + 0.02)], [X(0.64), Y(neckY + 0.18)]], { col: CREAM, w: 4, seed: seed + 5, alpha: 0.8 });
  // two soft folds in the body
  inkLine(c, [[X(0.42), Y(0.4)], [X(0.36), Y(0.7)]], { col: DUSK.ink, w: 2.5, seed: seed + 6, alpha: 0.35 });
  inkLine(c, [[X(0.6), Y(0.42)], [X(0.66), Y(0.66)]], { col: DUSK.ink, w: 2.5, seed: seed + 7, alpha: 0.35 });
}

// =====================================================================================================
// Scale: the 0-1 line with the five words
export interface Pin { v: Frac; tex: string; col: Role }
export interface ScaleWhere { line: Box; pin(i: number): Box; pinLabel(i: number): Box; word(i: number): Box; at(v: Frac): number }
export function Scale(x0: number, x1: number, y: number, pins: readonly Pin[] = [], o: { ticks?: number } = {}): ChanceBlock<ScaleWhere> {
  check(x1 - x0 >= 640, NAME, 'the probability scale needs 640 px');
  const at = (v: Frac) => lerp(x0, x1, num(v));
  const n0 = texLabel('0', x0, y + 64, 62), nh = texLabel('\\tfrac{1}{2}', (x0 + x1) / 2, y + 64, 62), n1 = texLabel('1', x1, y + 64, 62);
  const zU = wordLabel('unlikely', lerp(x0, x1, 0.25), y + 64, 44), zL = wordLabel('likely', lerp(x0, x1, 0.75), y + 64, 44);
  const wI = wordLabel('impossible', x0 - 20, y + 140, 44, 'left'), wA = wordLabel('as likely as not', (x0 + x1) / 2, y + 140, 44), wC = wordLabel('certain', x1 + 20, y + 140, 44, 'right');
  const words = [wI, zU, wA, zL, wC];
  const row1 = [n0.box, zU.box, nh.box, zL.box, n1.box];
  for (let i = 1; i < row1.length; i++) check(row1[i - 1]!.x1 + 10 < row1[i]!.x0, NAME, 'the scale words overlap the numbers');
  check(wI.box.x1 + 14 < wA.box.x0 && wA.box.x1 + 14 < wC.box.x0, NAME, 'the scale words overlap');
  // pins: the value above the line; labels that would touch are lifted
  const pinBoxes: Box[] = [], labels: TexLabel[] = [];
  pins.forEach((p, i) => {
    const x = at(p.v);
    pinBoxes.push(box(x - 16, y - 46, x + 16, y - 4));
    let ly = y - 104;
    let L = texLabel(p.tex, x, ly, 64);
    for (let t = 0; t < 4 && labels.some(o2 => boxesOverlap(o2.box, L.box)); t++) { ly -= 96; L = texLabel(p.tex, x, ly, 64); }
    labels.push(L);
    void i;
  });
  const lineBox = box(x0, y - 8, x1, y + 8);
  const where: ScaleWhere = { line: lineBox, pin: i => pinBoxes[i]!, pinLabel: i => labels[i]!.box, word: i => words[i]!.box, at };
  const ticks = o.ticks ?? 0;
  return {
    box: unionBox([lineBox, wI.box, wC.box, ...labels.map(l => l.box)]), where,
    draw(c, P) {
      const ks = P.k('scale');
      if (ks > 0) {
        drawOn(c, [[x0, y], [x1, y]], E.inOut(ks), { col: CREAM, lw: 5 });
        for (const [v, big] of [[0, 1], [0.5, 1], [1, 1]] as const) {
          const x = lerp(x0, x1, v);
          strokePts(c, [[x, y - (big ? 18 : 10)], [x, y + (big ? 18 : 10)]], { col: CREAM, lw: 4, alpha: E.smooth(ks) });
        }
        for (let t = 1; t < ticks; t++) {
          if (2 * t === ticks) continue;
          const x = lerp(x0, x1, t / ticks);
          strokePts(c, [[x, y - 10], [x, y + 10]], { col: CREAM, lw: 3, alpha: E.smooth(ks) * 0.7 });
        }
        drawTex(c, n0, 'ink', ks); drawTex(c, nh, 'ink', ks); drawTex(c, n1, 'ink', ks);
        const kw = P.k('words');
        drawWord(c, zU, 'dim', kw); drawWord(c, zL, 'dim', kw);
        drawWord(c, wI, 'dim', kw); drawWord(c, wA, 'dim', kw); drawWord(c, wC, 'dim', kw);
      }
      pins.forEach((p, i) => {
        const k = P.k(`pin${i}`);
        if (k <= 0) return;
        const x = at(p.v), kk = E.smooth(k);
        withAlpha(c, kk, () => {
          const { g } = c;
          g.save(); g.fillStyle = paint(dusk, p.col, 'fill');
          g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x - 17, y - 40 - (1 - kk) * 20); g.lineTo(x + 17, y - 40 - (1 - kk) * 20); g.closePath(); g.fill(); g.restore();
        });
        drawTex(c, labels[i]!, p.col, k);
      });
    },
  };
}

// =====================================================================================================
// Bag: the sack and its marbles, each marble named; optional scale below
export interface BagParams {
  groups: readonly Group[];
  /** marble ids in the event (lime rings) and in the other part (teal rings) */
  event?: readonly string[]; other?: readonly string[];
  /** the marble in focus (lavender ring), by index */
  pick?: number;
  /** words above the set ("4 marbles") */
  title?: string;
  scale?: readonly Pin[] | null;
  /** keep the bag in the top part of the frame (part 4 puts a chart below) */
  compact?: boolean;
}
export interface BagWhere { sack: Box; marble(i: number): Box; label(i: number): Box; set: Box; title: Box; event: Box | null; scale: ScaleWhere | null; outcomes: Outcome[] }
export function Bag(p: BagParams, fr: Frame): ChanceBlock<BagWhere> {
  const space = bagSpace(p.groups), n = space.length;
  check(n >= 2 && n <= 12, NAME, `a bag of ${n} marbles: draw 2 to 12`);
  const perRow = n <= 6 ? n : Math.ceil(n / 2), rows = n <= 6 ? 1 : 2;
  const top = fr.y + 30;
  const sackB = box(fr.x + 10, top + 60, fr.x + 250, top + 370);
  const ax0 = fr.x + 290, ax1 = fr.x + fr.w - 10;
  const sp = Math.min(150, (ax1 - ax0) / perRow);
  const r = Math.min(56, sp * 0.4);
  check(r >= 30, NAME, 'marbles too small to read');
  const rowY = rows === 1 ? [top + 210] : [top + 130, top + 330];
  const cx0 = ax0 + (ax1 - ax0 - sp * perRow) / 2 + sp / 2;
  const pos = space.map((_, i) => { const row = Math.floor(i / perRow), col = i % perRow; return { x: cx0 + col * sp, y: rowY[row]! }; });
  const labels = space.map((o, i) => texLabel(o.tex, pos[i]!.x, pos[i]!.y + r + 48, 56));
  const mBox = (i: number) => box(pos[i]!.x - r, pos[i]!.y - r, pos[i]!.x + r, pos[i]!.y + r);
  const set = box(cx0 - sp / 2 - 4, rowY[0]! - r - 26, cx0 + sp * (perRow - 0.5) + 4, rowY[rows - 1]! + r + 96);
  const title = wordLabel(p.title ?? `${n} marbles`, set.x0 + 6, set.y0 - 40, 48, 'left');
  check(title.box.y0 >= fr.y - 6, NAME, 'the bag title does not fit');
  for (let i = 1; i < n; i++) if (Math.floor(i / perRow) === Math.floor((i - 1) / perRow)) check(labels[i - 1]!.box.x1 + 6 < labels[i]!.box.x0, NAME, 'marble names overlap');
  const ev = new Set(p.event ?? []), ot = new Set(p.other ?? []);
  const evIdx = space.map((o, i) => (ev.has(o.id) ? i : -1)).filter(i => i >= 0);
  const evBox = evIdx.length ? unionBox(evIdx.map(mBox)) : null;
  const sc = p.scale ? Scale(fr.x + 90, fr.x + fr.w - 70, fr.y + fr.h - 230, p.scale, { ticks: 4 }) : null;
  if (sc) check(sc.box.y0 > set.y1 + 10, NAME, 'the scale runs into the marbles');
  const where: BagWhere = { sack: sackB, marble: mBox, label: i => labels[i]!.box, set, title: title.box, event: evBox, scale: sc?.where ?? null, outcomes: space };
  return {
    box: unionBox([sackB, set, title.box, ...(sc ? [sc.box] : [])]), where,
    draw(c, P) {
      const kb = P.k('bag'), km = P.k('marbles'), kl = P.k('labels');
      rise(c, kb, () => sack(c, sackB, 31));
      // the set of outcomes (amber outline) and its title
      const kS = P.k('space');
      if (kS > 0) {
        inkLine(c, rectPts(set.x0, set.y0, set.w, set.h, 26), { col: 'first', w: 4, closed: true, seed: 71, alpha: E.smooth(kS) * 0.9 });
      }
      drawWord(c, title, 'first', Math.max(kS, P.k('title')));
      const dimK = P.k('dim');
      space.forEach((o, i) => {
        const k = stag(km, i, n);
        if (k <= 0) return;
        const inEv = ev.has(o.id);
        const a = 1 - dimK * (inEv ? 0 : 0.55);
        rise(c, k, () => marble(c, pos[i]!.x, pos[i]!.y, r, o.group, 100 + i, a));
        drawTex(c, labels[i]!, 'ink', stag(kl, i, n, 0.6), a);
      });
      const kE = P.k('event'), kO = P.k('other'), kP = P.k('each');
      space.forEach((o, i) => {
        if (ev.has(o.id)) ringCircle(c, pos[i]!.x, pos[i]!.y, r + 12, 'link', stag(kE, evIdx.indexOf(i), evIdx.length, 0.5));
        if (ot.has(o.id)) ringCircle(c, pos[i]!.x, pos[i]!.y, r + 12, 'second', kO);
      });
      if (p.pick !== undefined && kP > 0) ringCircle(c, pos[p.pick]!.x, pos[p.pick]!.y, r + 12, 'pick', kP);
      sc?.draw(c, P);
    },
  };
}

// =====================================================================================================
// Cube: the six faces
export interface CubeWhere { face(v: number): Box; row: Box }
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
export function cubeFace(c: Canvas, x: number, y: number, s: number, v: number, seed: number, alpha = 1): void {
  withAlpha(c, alpha, () => {
    wash(c, rectPts(x - s / 2, y - s / 2, s, s, s * 0.16), '#EDE5D8' as Paint, { seed, ink: DUSK.ink, inkW: 3, shade: 0.3, rough: 1 });
    for (const [px, py] of PIPS[v]!) dot(c, x + px * s * 0.27, y + py * s * 0.27, s * 0.085, '#2A2238' as Paint);
  });
}
export function Cube(fr: Frame, o: { event?: readonly number[]; other?: readonly number[]; title?: string } = {}): ChanceBlock<CubeWhere> {
  const s = 112, gap = 32, w = 6 * s + 5 * gap;
  check(w <= fr.w, NAME, 'the six faces do not fit');
  const x0 = fr.x + (fr.w - w) / 2 + s / 2, y = fr.y + 330;
  const fx = (v: number) => x0 + (v - 1) * (s + gap);
  const face = (v: number) => box(fx(v) - s / 2, y - s / 2, fx(v) + s / 2, y + s / 2);
  const title = wordLabel(o.title ?? 'one roll of a number cube', fr.x + fr.w / 2, y - s / 2 - 90, 48);
  const row = unionBox([face(1), face(6)]);
  const ev = new Set(o.event ?? []), ot = new Set(o.other ?? []);
  return {
    box: unionBox([row, title.box]), where: { face, row },
    draw(c, P) {
      drawWord(c, title, 'dim', P.k('show'));
      for (let v = 1; v <= 6; v++) {
        const k = stag(P.k('show'), v - 1, 6);
        rise(c, k, () => cubeFace(c, fx(v), y, s, v, 210 + v, 1 - P.k('dim') * (ev.has(v) ? 0 : 0.55)));
        if (ev.has(v)) ring(c, box(fx(v) - s / 2 - 12, y - s / 2 - 12, fx(v) + s / 2 + 12, y + s / 2 + 12), 'link', P.k('event'), 22);
        if (ot.has(v)) ring(c, box(fx(v) - s / 2 - 12, y - s / 2 - 12, fx(v) + s / 2 + 12, y + s / 2 + 12), 'second', P.k('other'), 22);
      }
    },
  };
}

// =====================================================================================================
// Spinner: `of` equal parts grouped into sectors (parts visible as thin cuts)
export interface Sector { parts: number; col: MarbleCol | string; label?: string }
export interface SpinnerWhere { sector(i: number): Box; disc: Box }
export function Spinner(sectors: readonly Sector[], fr: Frame, o: { event?: readonly number[]; title?: string; partCuts?: boolean; angles?: readonly number[] } = {}): ChanceBlock<SpinnerWhere> {
  const of = sectors.reduce((s, x) => s + x.parts, 0);
  check(of >= 2 && of <= 12, NAME, `a spinner of ${of} parts`);
  const R = Math.min(300, fr.w / 2 - 60, fr.h / 2 - 140);
  const cx = fr.x + fr.w / 2, cy = fr.y + 90 + R + 40;
  // angles: equal parts unless explicit sector shares are given (a visibly unequal spinner)
  const shares = o.angles ?? sectors.map(s => s.parts / of);
  check(Math.abs(shares.reduce((a, b) => a + b, 0) - 1) < 1e-9, NAME, 'spinner sectors do not fill the circle');
  const a0s: number[] = []; let acc = -Math.PI / 2;
  for (const s of shares) { a0s.push(acc); acc += s * Math.PI * 2; }
  const mid = (i: number) => a0s[i]! + shares[i]! * Math.PI;
  const lab = sectors.map((s, i) => {
    if (!s.label) return null;
    const rr = shares[i]! >= 0.3 ? R * 0.55 : R * 0.64;
    const L = texLabel(s.label, cx + Math.cos(mid(i)) * rr, cy + Math.sin(mid(i)) * rr, 62);
    check(shares[i]! * Math.PI * 2 * rr >= L.box.w + 16 || shares[i]! >= 0.25, NAME, `sector ${s.label} too narrow for its label`);
    return L;
  });
  const title = o.title ? wordLabel(o.title, cx, fr.y + 40, 48) : null;
  const ev = new Set(o.event ?? []);
  const secBox = (i: number) => { const x = cx + Math.cos(mid(i)) * R * 0.6, y = cy + Math.sin(mid(i)) * R * 0.6; return box(x - 40, y - 40, x + 40, y + 40); };
  const disc = box(cx - R, cy - R, cx + R, cy + R);
  return {
    box: unionBox([disc, ...(title ? [title.box] : [])]), where: { sector: secBox, disc },
    draw(c, P) {
      const k = P.k('show');
      if (title) drawWord(c, title, 'dim', k);
      rise(c, k, () => {
        wash(c, circlePts(cx, cy, R + 18, 72), '#3B3352' as Paint, { seed: 301, ink: DUSK.ink, inkW: 3, shade: 0.3 });
        sectors.forEach((s, i) => {
          const pts = [[cx, cy] as [number, number], ...arcPts(cx, cy, R, R, a0s[i]!, a0s[i]! + shares[i]! * Math.PI * 2, Math.max(6, Math.round(shares[i]! * 72)))];
          const hex = s.col in OBJ ? OBJ[s.col as MarbleCol] : s.col;
          wash(c, pts, hex as Paint, { seed: 310 + i, ink: null, shade: 0.2, rough: 0.8, alpha: 1 - P.k('dim') * (ev.has(i) ? 0 : 0.55) });
        });
        // the equal parts: thin cream cuts inside a sector, ink lines between sectors
        if (o.partCuts !== false && !o.angles) for (let j = 0; j < of; j++) {
          const a = -Math.PI / 2 + (j / of) * Math.PI * 2;
          const isEdge = a0s.some(x => Math.abs(x - a) < 1e-6 || Math.abs(x - a - Math.PI * 2) < 1e-6);
          if (!isEdge) strokePts(c, [[cx + Math.cos(a) * R * 0.18, cy + Math.sin(a) * R * 0.18], [cx + Math.cos(a) * R, cy + Math.sin(a) * R]], { col: CREAM, lw: 2.5, dash: [10, 9], alpha: 0.7 });
        }
        for (const a of a0s) inkLine(c, [[cx, cy], [cx + Math.cos(a) * R, cy + Math.sin(a) * R]], { col: DUSK.ink, w: 4, seed: 330 + Math.round(a * 10) });
        inkLine(c, circlePts(cx, cy, R, 72), { col: DUSK.ink, w: 4, closed: true, seed: 340 });
      });
      lab.forEach((L, i) => { if (L) drawTex(c, L, sectors[i]!.col === 'white' || sectors[i]!.col === 'pink' || sectors[i]!.col === 'gray' ? ('#221B2E' as Paint) : 'ink', k); });
      // event sectors: a lime outline along the sector edge
      const kE = P.k('event');
      if (kE > 0) sectors.forEach((_, i) => {
        if (!ev.has(i)) return;
        const pts = [[cx, cy] as [number, number], ...arcPts(cx, cy, R - 6, R - 6, a0s[i]! + 0.03, a0s[i]! + shares[i]! * Math.PI * 2 - 0.03, 40)];
        withAlpha(c, E.smooth(kE), () => strokePts(c, pts, { col: 'link', lw: 7, closed: true, glow: 8 }));
      });
      // the pointer
      withAlpha(c, E.smooth(k), () => {
        const tip: [number, number] = [cx + Math.cos(-1.1) * R * 0.78, cy + Math.sin(-1.1) * R * 0.78];
        inkLine(c, [[cx, cy], tip], { col: CREAM, w: 7, seed: 350 });
        dot(c, cx, cy, 16, CREAM as Paint); dot(c, cx, cy, 7, DUSK.ink as Paint);
      });
    },
  };
}

// =====================================================================================================
// Bars: one row per category: name, bar, value
export interface BarRow { label: string; n: number; tex?: string }
export interface BarsWhere { row(i: number): Box; value(i: number): Box; title: Box | null }
export function Bars(rows: readonly BarRow[], fr: Frame, o: { title?: string; event?: readonly number[]; ref?: { v: number; tex: string }; max?: number; col?: string } = {}): ChanceBlock<BarsWhere> {
  check(rows.length >= 2 && rows.length <= 6, NAME, 'bars: 2 to 6 rows');
  const lw = Math.max(...rows.map(r => wordLabel(r.label, 0, 0, 46).box.w));
  check(lw <= 320, NAME, 'a bar label is too long');
  const lx = fr.x + 10 + lw;
  const top = fr.y + (o.title ? 150 : 70), rowH = Math.min(130, (fr.h - (top - fr.y) - 120) / rows.length);
  check(rowH >= 96, NAME, 'bar rows too tight');
  const bx0 = lx + 30, valW = 200, bx1 = fr.x + fr.w - valW - 30;
  const max = o.max ?? Math.max(1, ...rows.map(r => r.n), o.ref?.v ?? 0);
  const yOf = (i: number) => top + rowH * (i + 0.5);
  const L2 = rows.map((r, i) => wordLabel(r.label, lx, yOf(i), 46, 'right'));
  const refX0 = o.ref ? lerp(bx0, bx1, o.ref.v / max) : -1e9;
  const vals = rows.map((r, i) => {
    const end = Math.max(bx0, lerp(bx0, bx1, r.n / max));
    let L = texLabel(r.tex ?? String(r.n), end + 26, yOf(i), 62, 'left');
    // a value label never sits on the reference line: it moves past the line
    if (L.box.x0 - 12 < refX0 && L.box.x1 + 12 > refX0) L = texLabel(r.tex ?? String(r.n), refX0 + 24, yOf(i), 62, 'left');
    return L;
  });
  const title = o.title ? wordLabel(o.title, fr.x + 30, fr.y + 70, 48, 'left') : null;
  const rowBox = (i: number) => box(lx - L2[i]!.box.w - 14, yOf(i) - rowH / 2 + 8, vals[i]!.box.x1 + 14, yOf(i) + rowH / 2 - 8);
  const ev = new Set(o.event ?? []);
  const refX = o.ref ? lerp(bx0, bx1, o.ref.v / max) : 0;
  const refL = o.ref ? texLabel(o.ref.tex, refX, top + rowH * rows.length + 56, 62) : null;
  return {
    box: unionBox([...rows.map((_, i) => rowBox(i)), ...(title ? [title.box] : []), ...(refL ? [refL.box] : [])]),
    where: { row: rowBox, value: i => vals[i]!.box, title: title?.box ?? null },
    draw(c, P) {
      const k = P.k('show');
      if (title) drawWord(c, title, 'first', k);
      rows.forEach((r, i) => {
        const ki = stag(k, i, rows.length);
        const a = 1 - P.k('dim') * (ev.has(i) ? 0 : 0.5);
        withAlpha(c, a, () => {
          drawWord(c, L2[i]!, 'ink', ki);
          const w = Math.max(6, (bx1 - bx0) * (r.n / max) * E.inOut(ki));
          if (r.n > 0) wash(c, rectPts(bx0, yOf(i) - rowH * 0.3, w, rowH * 0.6, 10), (o.col ?? '#6C74B8') as Paint, { seed: 400 + i, ink: DUSK.ink, inkW: 2.5, shade: 0.25, rough: 1.2 });
          else strokePts(c, [[bx0, yOf(i) - rowH * 0.3], [bx0, yOf(i) + rowH * 0.3]], { col: 'faint', lw: 4, alpha: ki });
          drawTex(c, vals[i]!, 'ink', ki);
        });
        if (ev.has(i)) ring(c, rowBox(i), 'link', P.k('event'), 16);
      });
      if (o.ref && refL) {
        const kr = P.k('ref');
        if (kr > 0) {
          strokePts(c, [[refX, top - 10], [refX, top + rowH * rows.length + 10]], { col: 'link', lw: 4, dash: [14, 10], alpha: E.smooth(kr) });
          drawTex(c, refL, 'link', kr);
        }
      }
    },
  };
}

// =====================================================================================================
// Strip: n trials, cut into d equal parts; k parts are the event (about k/d of n)
export interface StripWhere { strip: Box; part: Box; partLabel: Box; title: Box }
export function Strip(n: number, d: number, k: number, fr: Frame, o: { title?: string; answer?: string } = {}): ChanceBlock<StripWhere> {
  check(d >= 2 && d <= 12 && k >= 0 && k <= d, NAME, `a strip of ${d} parts, ${k} taken`);
  const x0 = fr.x + 60, x1 = fr.x + fr.w - 40, y = fr.y + 360, h = 130;
  const pw = (x1 - x0) / d;
  check(pw >= 56, NAME, 'strip parts too thin');
  const title = wordLabel(o.title ?? `${n} trials`, (x0 + x1) / 2, y - h / 2 - 70, 50);
  const strip = box(x0, y - h / 2, x1, y + h / 2);
  const part = box(x0, y - h / 2, x0 + pw * k, y + h / 2);
  const ans = texLabel(o.answer ?? '?', x0 + (pw * k) / 2, y + h / 2 + 80, 66);
  return {
    box: unionBox([strip, title.box, ans.box]), where: { strip, part, partLabel: ans.box, title: title.box },
    draw(c, P) {
      const ks = P.k('show');
      drawWord(c, title, 'first', ks);
      rise(c, ks, () => wash(c, rectPts(x0, y - h / 2, x1 - x0, h, 12), '#4A4F86' as Paint, { seed: 501, ink: DUSK.ink, inkW: 3, shade: 0.3 }));
      if (ks > 0) {
        // the amber bracket over the whole strip: all n trials
        inkLine(c, [[x0 + 4, y - h / 2 - 18], [x0 + 4, y - h / 2 - 30], [x1 - 4, y - h / 2 - 30], [x1 - 4, y - h / 2 - 18]], { col: 'first', w: 4, seed: 502, alpha: E.smooth(ks) });
      }
      const kc = P.k('cut');
      for (let j = 1; j < d; j++) { const x = x0 + j * pw; const kk = E.inOut(clamp(kc * 1.3 - (j / d) * 0.3)); if (kk > 0) inkLine(c, [[x, y - h / 2 - 2], [x, y - h / 2 - 2 + (h + 4) * kk]], { col: CREAM, w: 3.5, seed: 510 + j, alpha: 0.85 }); }
      const kt = P.k('take');
      if (kt > 0 && k > 0) {
        withAlpha(c, E.smooth(kt), () => wash(c, rectPts(x0 + 5, y - h / 2 + 5, pw * k - 10, h - 10, 10), 'link', { seed: 520, ink: null, shade: 0.2 }));
        inkLine(c, [[x0 + 6, y + h / 2 + 18], [x0 + 6, y + h / 2 + 30], [x0 + pw * k - 6, y + h / 2 + 30], [x0 + pw * k - 6, y + h / 2 + 18]], { col: 'link', w: 4, seed: 521, alpha: E.smooth(kt) });
      }
      drawTex(c, ans, 'link', P.k('answer'));
    },
  };
}

// =====================================================================================================
// Run: the running share of hits against the probability
export interface RunWhere { plot: Box; ref: Box; refLabel: Box; end: Box; mark(i: number): Box }
export function Run(hits: readonly boolean[], p: Frac, fr: Frame, o: { log?: boolean; refTex?: string; marks?: readonly number[]; yTitle?: string; xTitle?: string } = {}): ChanceBlock<RunWhere> {
  const N = hits.length;
  check(N >= 10, NAME, 'a running share needs at least 10 trials');
  const px0 = fr.x + 150, px1 = fr.x + fr.w - 150, py0 = fr.y + 90, py1 = fr.y + fr.h - 150;
  check(px1 - px0 >= 520 && py1 - py0 >= 260, NAME, 'the chart frame is too small');
  const X = (i: number) => (o.log ? lerp(px0, px1, Math.log10(i) / Math.log10(N)) : lerp(px0, px1, i / N));
  const Y = (v: number) => lerp(py1, py0, v);
  let h = 0;
  const pts: [number, number][] = hits.map((x, i) => { if (x) h++; return [X(i + 1), Y(h / (i + 1))]; });
  const yl = [texLabel('0', px0 - 34, Y(0), 60, 'right'), texLabel('\\tfrac{1}{2}', px0 - 34, Y(0.5), 60, 'right'), texLabel('1', px0 - 34, Y(1), 60, 'right')];
  const ticksX = o.log ? [1, 10, 100, 1000, 10000].filter(v => v <= N) : [0, N / 4, N / 2, (3 * N) / 4, N].map(Math.round);
  const xl = ticksX.map(v => texLabel(v.toLocaleString('en-US').replace(/,/g, '{,}'), o.log ? X(v) : lerp(px0, px1, v / N), py1 + 56, 60));
  for (let i = 1; i < xl.length; i++) check(xl[i - 1]!.box.x1 + 12 < xl[i]!.box.x0, NAME, 'axis numbers overlap');
  const refL = texLabel(o.refTex ?? `\\tfrac{${p[0]}}{${p[1]}}`, px1 + 30, Y(num(p)), 64, 'left');
  const xT = wordLabel(o.xTitle ?? 'trials', (px0 + px1) / 2, py1 + 122, 44);
  const yT = o.yTitle ? wordLabel(o.yTitle, px0 - 20, py0 - 54, 44, 'left') : null;
  const end = box(pts[N - 1]![0] - 14, pts[N - 1]![1] - 14, pts[N - 1]![0] + 14, pts[N - 1]![1] + 14);
  const marks = o.marks ?? [];
  const markBox = (i: number) => { const t = marks[i]! - 1; return box(pts[t]![0] - 14, pts[t]![1] - 14, pts[t]![0] + 14, pts[t]![1] + 14); };
  return {
    box: unionBox([box(px0, py0, px1, py1), refL.box, xT.box, ...yl.map(l => l.box)]),
    where: { plot: box(px0, py0, px1, py1), ref: box(px0, Y(num(p)) - 6, px1, Y(num(p)) + 6), refLabel: refL.box, end, mark: markBox },
    draw(c, P) {
      const ka = P.k('axes');
      if (ka > 0) {
        withAlpha(c, E.smooth(ka), () => {
          const { g } = c;
          g.save(); g.fillStyle = 'rgba(10,12,32,0.35)'; g.beginPath(); g.roundRect(px0, py0, px1 - px0, py1 - py0, 10); g.fill(); g.restore();
          for (const v of [0.5, 1]) strokePts(c, [[px0, Y(v)], [px1, Y(v)]], { col: 'faint', lw: 1.5, alpha: 0.6 });
        });
        drawOn(c, [[px0, py0], [px0, py1], [px1, py1]], E.inOut(ka), { col: CREAM, lw: 4 });
        for (const L of yl) drawTex(c, L, 'ink', ka);
        for (const L of xl) drawTex(c, L, 'ink', ka);
        drawWord(c, xT, 'dim', ka);
        if (yT) drawWord(c, yT, 'dim', ka);
      }
      const kr = P.k('ref');
      if (kr > 0) {
        strokePts(c, [[px0, Y(num(p))], [lerp(px0, px1, E.inOut(kr)), Y(num(p))]], { col: 'link', lw: 4, dash: [16, 11] });
        drawTex(c, refL, 'link', kr);
      }
      const k = P.k('run');
      if (k > 0) {
        const m = Math.max(2, Math.round(N * clamp(k)));
        strokePts(c, pts.slice(0, m), { col: 'first', lw: 4.5 });
        const e = pts[m - 1]!;
        dot(c, e[0], e[1], 9, 'first');
      }
      const km = P.k('marks');
      marks.forEach((t, i) => { const q = pts[t - 1]!; dot(c, q[0], q[1], 11, 'pick', stag(km, i, marks.length)); });
    },
  };
}

// =====================================================================================================
// Dots: reference batches as a dot plot (binned when the range is wide), one observation marked
export interface DotsWhere { axis: Box; obs: Box; obsLabel: Box; title: Box }
export function Dots(ref: readonly number[], obs: number | null, fr: Frame, o: { title?: string; obsLabel?: string; obsCol?: Role; lo?: number; hi?: number } = {}): ChanceBlock<DotsWhere> {
  check(ref.length >= 5 && ref.length <= 40, NAME, 'a dot plot of 5 to 40 batches');
  const all = obs === null ? [...ref] : [...ref, obs];
  const lo0 = o.lo ?? Math.min(...all), hi0 = o.hi ?? Math.max(...all);
  const span = hi0 - lo0 + 1, bin = span <= 18 ? 1 : span <= 60 ? 5 : 10;
  const lo = o.lo ?? Math.floor(lo0 / bin) * bin - bin, hi = o.hi !== undefined ? o.hi + 1 : Math.ceil((hi0 + 1) / bin) * bin + bin;
  const ax0 = fr.x + 70, ax1 = fr.x + fr.w - 70, ay = fr.y + fr.h - (obs === null ? 120 : 290);
  const nb = (hi - lo) / bin, cw = (ax1 - ax0) / nb;
  const X = (v: number) => lerp(ax0, ax1, (v - lo) / (hi - lo));
  const binOf = (v: number) => Math.floor((v - lo) / bin);
  const stacks = new Map<number, number>();
  const dots = ref.map(v => { const b = binOf(v), s = stacks.get(b) ?? 0; stacks.set(b, s + 1); return { b, s }; });
  const r = Math.min(15, cw * 0.42);
  const maxStack = Math.max(...stacks.values());
  const title = wordLabel(o.title ?? `${ref.length} batches`, (ax0 + ax1) / 2, fr.y + 40, 48);
  const binNote = bin > 1 ? wordLabel(`each dot: one batch, in steps of ${bin}`, (ax0 + ax1) / 2, fr.y + 96, 44) : null;
  const top = (binNote ?? title).box.y1 + 16;
  check(r >= 8, NAME, 'dots too small');
  check(maxStack * (2 * r + 4) + 10 < ay - top, NAME, 'the dot plot is too tall');
  const step = [1, 2, 5, 10, 20, 25, 50].find(s => s % bin === 0 && ((hi - lo) / s) <= 8 && (cw * s) / bin >= 110) ?? 50;
  const ticks: number[] = []; for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) if (bin > 1 || v < hi) ticks.push(v);
  const tx = (v: number) => (bin === 1 ? X(v + 0.5) : X(v));
  const tl = ticks.map(v => texLabel(String(v), tx(v), ay + 56, 60));
  for (let i = 1; i < tl.length; i++) check(tl[i - 1]!.box.x1 + 10 < tl[i]!.box.x0, NAME, 'dot plot numbers overlap');
  const ox = obs === null ? 0 : tx(obs);
  const oL = obs === null ? null : texLabel(o.obsLabel ?? String(obs), ox, ay + 222, 64);
  return {
    box: unionBox([box(ax0, top, ax1, ay + 90), title.box, ...(oL ? [oL.box] : [])]),
    where: { axis: box(ax0, ay - 4, ax1, ay + 4), obs: box(ox - 20, ay + 100, ox + 20, ay + 150), obsLabel: oL?.box ?? box(ox, ay, ox, ay), title: title.box },
    draw(c, P) {
      const ka = P.k('show');
      drawWord(c, title, 'first', ka);
      if (binNote) drawWord(c, binNote, 'dim', ka);
      drawOn(c, [[ax0, ay], [ax1, ay]], E.inOut(ka), { col: CREAM, lw: 4 });
      for (let i = 0; i < ticks.length; i++) {
        strokePts(c, [[tx(ticks[i]!), ay], [tx(ticks[i]!), ay + 16]], { col: CREAM, lw: 3, alpha: E.smooth(ka) });
        drawTex(c, tl[i]!, 'ink', ka);
      }
      const kd = P.k('dots');
      dots.forEach((d, i) => {
        const k = stag(kd, i, dots.length, 0.7);
        if (k <= 0) return;
        const x = ax0 + (d.b + 0.5) * cw, y = ay - r - 6 - d.s * (2 * r + 4);
        withAlpha(c, E.smooth(k), () => { dot(c, x, y, r, '#B8B2CE' as Paint); });
      });
      const ko = P.k('obs');
      if (oL && ko > 0) {
        const col = o.obsCol ?? 'link';
        withAlpha(c, E.smooth(ko), () => {
          const { g } = c;
          g.save(); g.fillStyle = paint(dusk, col, 'fill');
          g.beginPath(); g.moveTo(ox, ay + 98); g.lineTo(ox - 18, ay + 136); g.lineTo(ox + 18, ay + 136); g.closePath(); g.fill(); g.restore();
          strokePts(c, [[ox, ay + 132], [ox, ay + 172]], { col, lw: 5 });
        });
        drawTex(c, oL, col, ko);
      }
    },
  };
}

// =====================================================================================================
// Digits: a random-digit string in rows, cut into trials
export interface DigitsWhere { block(i: number): Box; legend: Box }
export function Digits(digits: readonly number[], size: number, fr: Frame, o: { wins?: readonly boolean[]; legend?: string } = {}): ChanceBlock<DigitsWhere> {
  const blocksN = digits.length / size;
  check(Number.isInteger(blocksN), NAME, 'digits do not cut into whole trials');
  const perRow = Math.max(1, Math.floor(12 / size)) * size;
  const rows = Math.ceil(digits.length / perRow);
  const cw = 64, gapB = 26;
  const rowW = perRow * cw + (perRow / size - 1) * gapB;
  check(rowW <= fr.w - 40, NAME, 'a digit row does not fit');
  check(rows <= 4, NAME, 'too many digit rows');
  const x0 = fr.x + (fr.w - rowW) / 2, y0 = fr.y + 200, rh = 150;
  const pos = digits.map((_, i) => { const row = Math.floor(i / perRow), j = i % perRow; return { x: x0 + j * cw + Math.floor(j / size) * gapB + cw / 2, y: y0 + row * rh }; });
  const lab = digits.map((d, i) => texLabel(String(d), pos[i]!.x, pos[i]!.y, 64));
  const blockBox = (b: number) => unionBox([box(pos[b * size]!.x - cw / 2, pos[b * size]!.y - 48, pos[b * size]!.x + cw / 2, pos[b * size]!.y + 48), box(pos[b * size + size - 1]!.x - cw / 2, pos[b * size + size - 1]!.y - 48, pos[b * size + size - 1]!.x + cw / 2, pos[b * size + size - 1]!.y + 48)]);
  const legend = o.legend ? wordLabel(o.legend, fr.x + fr.w / 2, y0 + rows * rh + 40, 46) : null;
  return {
    box: unionBox([blockBox(0), blockBox(blocksN - 1), ...(legend ? [legend.box] : [])]), where: { block: blockBox, legend: legend?.box ?? box(0, 0, 0, 0) },
    draw(c, P) {
      const k = P.k('show'), kb = P.k('blocks'), kw = P.k('event');
      for (let b = 0; b < blocksN; b++) {
        const B = blockBox(b);
        if (kb > 0) withAlpha(c, E.smooth(stag(kb, b, blocksN)), () => wash(c, rectPts(B.x0 + 2, B.y0, B.w - 4, B.h, 12), (b % 2 ? '#2E3466' : '#383F78') as Paint, { seed: 600 + b, ink: null, rough: 0.8 }));
      }
      digits.forEach((_, i) => drawTex(c, lab[i]!, 'ink', stag(k, i, digits.length, 0.6)));
      if (o.wins) for (let b = 0; b < blocksN; b++) if (o.wins[b]) ring(c, padB(blockBox(b), 6), 'link', stag(kw, b, blocksN), 14);
      if (legend) drawWord(c, legend, 'dim', k);
    },
  };
}
const padB = (b: Box, p: number) => box(b.x0 - p, b.y0 - p, b.x1 + p, b.y1 + p);

// =====================================================================================================
// Table: a two-stage outcome table (row stage x column stage)
export interface TableWhere { cell(r: number, k: number): Box; grid: Box }
export function Table(rowsH: readonly string[], colsH: readonly string[], cells: readonly (readonly (string | null)[])[], fr: Frame, o: { event?: readonly [number, number][]; rowTitle?: string; colTitle?: string } = {}): ChanceBlock<TableWhere> {
  const R = rowsH.length, C = colsH.length;
  const cs = Math.min(124, (fr.w - 170) / C, (fr.h - 260) / R);
  check(cs >= 84, NAME, `table cells of ${Math.round(cs)} px are too small`);
  const gx0 = fr.x + 150 + (fr.w - 150 - cs * C) / 2, gy0 = fr.y + 200;
  const cell = (r: number, k: number) => box(gx0 + k * cs, gy0 + r * cs, gx0 + (k + 1) * cs, gy0 + (r + 1) * cs);
  const size = Math.min(60, cs * 0.5);
  const lab = cells.map((row, r) => row.map((t, k) => (t === null ? null : texLabel(t, cell(r, k).cx, cell(r, k).cy, Math.max(60, size)))));
  for (const row of lab) for (const L of row) if (L) check(L.box.w <= cs - 8, NAME, 'a table entry is wider than its cell');
  const rl = rowsH.map((t, r) => texLabel(t, gx0 - 40, cell(r, 0).cy, 60, 'right'));
  const cl = colsH.map((t, k) => texLabel(t, cell(0, k).cx, gy0 - 50, 60));
  const grid = box(gx0, gy0, gx0 + C * cs, gy0 + R * cs);
  const ev = o.event ?? [];
  const evKey = new Set(ev.map(([r, k]) => `${r},${k}`));
  const rT = o.rowTitle ? wordLabel(o.rowTitle, fr.x + 20, gy0 - 120, 44, 'left') : null;
  const cT = o.colTitle ? wordLabel(o.colTitle, grid.cx, gy0 - 130, 44) : null;
  return {
    box: unionBox([grid, ...rl.map(l => l.box), ...cl.map(l => l.box)]), where: { cell, grid },
    draw(c, P) {
      const k = P.k('show');
      if (rT) drawWord(c, rT, 'dim', k);
      if (cT) drawWord(c, cT, 'dim', k);
      withAlpha(c, E.smooth(k), () => {
        for (let r = 0; r <= R; r++) strokePts(c, [[gx0, gy0 + r * cs], [gx0 + C * cs, gy0 + r * cs]], { col: 'faint', lw: 2.5 });
        for (let q = 0; q <= C; q++) strokePts(c, [[gx0 + q * cs, gy0], [gx0 + q * cs, gy0 + R * cs]], { col: 'faint', lw: 2.5 });
      });
      const kE = P.k('event');
      for (let r = 0; r < R; r++) for (let q = 0; q < C; q++) {
        const B = cell(r, q);
        if (evKey.has(`${r},${q}`) && kE > 0) withAlpha(c, E.smooth(kE) * 0.85, () => wash(c, rectPts(B.x0 + 6, B.y0 + 6, B.w - 12, B.h - 12, 8), 'link', { seed: 700 + r * 13 + q, ink: null, rough: 0.8, shade: 0.1 }));
        const L = lab[r]![q];
        if (L) drawTex(c, L, evKey.has(`${r},${q}`) && kE > 0.5 ? ('#16192F' as Paint) : 'ink', stag(k, r * C + q, R * C, 0.6));
        else withAlpha(c, E.smooth(k) * 0.6, () => { strokePts(c, [[B.x0 + 18, B.y0 + 18], [B.x1 - 18, B.y1 - 18]], { col: 'faint', lw: 3 }); strokePts(c, [[B.x1 - 18, B.y0 + 18], [B.x0 + 18, B.y1 - 18]], { col: 'faint', lw: 3 }); });
      }
      for (const L of rl) drawTex(c, L, 'first', k);
      for (const L of cl) drawTex(c, L, 'first', k);
    },
  };
}

// =====================================================================================================
// Tree: n coin tosses (n <= 3), leaves listed on the right
export interface TreeWhere { leaf(i: number): Box; leaves: Box }
export function Tree(n: number, fr: Frame, o: { event?: readonly number[] } = {}): ChanceBlock<TreeWhere> {
  check(n >= 1 && n <= 3, NAME, 'a tree of 1 to 3 tosses');
  const leaves = 2 ** n, lh = Math.min(110, (fr.h - 140) / leaves);
  check(lh >= 96, NAME, 'tree leaves too tight');
  const x0 = fr.x + 70, xs = Array.from({ length: n + 1 }, (_, s) => lerp(x0, fr.x + fr.w - 330, s / n));
  const yTop = fr.y + 70 + (fr.h - 140 - lh * leaves) / 2;
  const leafY = (i: number) => yTop + lh * (i + 0.5);
  const nodeY = (s: number, j: number) => { const span = leaves / 2 ** s; return (leafY(j * span) + leafY(j * span + span - 1)) / 2; };
  const names: string[] = []; for (let i = 0; i < leaves; i++) { let t = ''; for (let s = n - 1; s >= 0; s--) t += (i >> s) & 1 ? 'T' : 'H'; names.push(t); }
  const nodeL: TexLabel[][] = [];
  for (let s = 1; s <= n; s++) { const row: TexLabel[] = []; for (let j = 0; j < 2 ** s; j++) row.push(texLabel(j % 2 ? '\\mathrm{T}' : '\\mathrm{H}', xs[s]!, nodeY(s, j), 60)); nodeL.push(row); }
  const leafL = names.map((t, i) => texLabel(`\\mathrm{${t}}`, fr.x + fr.w - 40, leafY(i), 60, 'right'));
  const ev = new Set(o.event ?? []);
  const leafBox = (i: number) => padB(leafL[i]!.box, 10);
  return {
    box: unionBox([box(x0, yTop, fr.x + fr.w - 40, yTop + lh * leaves)]), where: { leaf: leafBox, leaves: unionBox(leafL.map(l => l.box)) },
    draw(c, P) {
      const k = P.k('show');
      dot(c, x0, nodeY(0, 0), 10, CREAM as Paint, E.smooth(k));
      for (let s = 1; s <= n; s++) for (let j = 0; j < 2 ** s; j++) {
        const ks = stag(k, s - 1, n, 0.5);
        const px = s === 1 ? x0 + 12 : xs[s - 1]! + 34, py = nodeY(s - 1, Math.floor(j / 2));
        const L = nodeL[s - 1]![j]!;
        drawOn(c, [[px, py], [L.box.x0 - 14, L.y]], E.inOut(ks), { col: 'faint', lw: 3 });
        drawTex(c, L, 'ink', ks);
      }
      const kE = P.k('event');
      leafL.forEach((L, i) => {
        drawTex(c, L, ev.has(i) && kE > 0.3 ? 'link' : 'dim', stag(k, n - 1, n, 0.5));
        strokePts(c, [[nodeL[n - 1]![i]!.box.x1 + 16, leafY(i)], [L.box.x0 - 18, leafY(i)]], { col: 'faint', lw: 2, dash: [6, 8], alpha: 0.6 * E.smooth(k) });
        if (ev.has(i)) ring(c, leafBox(i), 'link', kE, 12, 4);
      });
    },
  };
}

// =====================================================================================================
// Streak: past results in a row, then the next trial
export interface StreakWhere { past: Box; next: Box }
export function Streak(past: readonly string[], fr: Frame, o: { coin?: boolean; dice?: boolean; title?: string; next?: boolean } = {}): ChanceBlock<StreakWhere> {
  const n = past.length;
  check(n >= 3 && n <= 8, NAME, 'a streak of 3 to 8 results');
  const r = 48, sp = Math.min(118, (fr.w - 300) / n);
  const x0 = fr.x + 70, y = fr.y + 340;
  const pos = past.map((_, i) => x0 + i * sp + r);
  const nx = pos[n - 1]! + sp + 70;
  check(nx + r <= fr.x + fr.w, NAME, 'the next trial does not fit');
  const lab = past.map((t, i) => texLabel(o.coin === false || o.dice ? '1' : `\\mathrm{${t}}`, pos[i]!, y, 60));
  const q = texLabel('?', nx, y, 72);
  const title = wordLabel(o.title ?? 'so far', x0, y - r - 70, 46, 'left');
  const nt = wordLabel('next', nx, y - r - 70, 46);
  return {
    box: unionBox([box(x0, y - r, nx + r, y + r), title.box]), where: { past: box(x0, y - r, pos[n - 1]! + r, y + r), next: box(nx - r, y - r, nx + r, y + r) },
    draw(c, P) {
      const k = P.k('show');
      drawWord(c, title, 'dim', k);
      if (o.next !== false) drawWord(c, nt, 'dim', k);
      past.forEach((t, i) => {
        const ki = stag(k, i, n);
        if (o.dice) rise(c, ki, () => cubeFace(c, pos[i]!, y, r * 2, Number(t), 800 + i));
        else if (o.coin === false) rise(c, ki, () => marble(c, pos[i]!, y, r, t as MarbleCol, 800 + i));
        else {
          rise(c, ki, () => wash(c, circlePts(pos[i]!, y, r, 40), '#B9BCCB' as Paint, { seed: 800 + i, ink: DUSK.ink, inkW: 3, shade: 0.35 }));
          drawTex(c, lab[i]!, '#221B2E' as Paint, ki);
        }
      });
      if (o.next === false) return;
      withAlpha(c, E.smooth(k), () => inkLine(c, o.dice ? rectPts(nx - r, y - r, 2 * r, 2 * r, r * 0.32) : circlePts(nx, y, r, 40), { col: 'pick', w: 4, closed: true, seed: 820 }));
      drawTex(c, q, 'pick', k);
    },
  };
}

export { WORDS };
