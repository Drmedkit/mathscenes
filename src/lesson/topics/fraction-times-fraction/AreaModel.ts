// AreaModel: a fraction of a fraction on a pan of brownies (or a 1 ft square garden bed), the model of
// (a/b) x (c/d) = (a x c)/(b x d).
//   cols   every whole is cut into d equal columns (cream cuts)
//   first  c of those columns are painted amber: c/d of a pan (the amount; c may pass d, then a second pan is used)
//   rows   the amber part is cut into b equal rows (solid cuts through the amber part only)
//   take   a of the b rows of the amber part are painted teal: a/b OF the amber part
//   grid   the row cuts run on, dashed, through the rest of the pan: every whole is now b x d equal cells
//   name   the taken cells turn lime, each cell outlined: a x c cells out of the b x d cells of ONE whole
// The amber part sits against the RIGHT edge of the pan (nearest the board), so leaders from the board reach the
// taken cells without crossing the picture. Rows are taken from the top.
//
// Pure maths in computeArea(); the block lays out inside a Frame and throws BlockError when it cannot be read.
import { type Box, box, clamp, rat, type Q, unionBox, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface AreaParams {
  /** taken rows a of b (the multiplier a/b, proper or equal to 1) */ a: number; b: number;
  /** painted columns c of d (the amount c/d; up to 2 wholes) */ c: number; d: number;
  look?: 'pan' | 'plot';
  /** labels: plain words, or TeX when the string holds a backslash */
  words?: { whole?: string; first?: string; take?: string };
}
export type AreaStep = 'whole' | 'cols' | 'first' | 'rows' | 'take' | 'grid' | 'name';
export const AREA_STEPS: readonly AreaStep[] = ['whole', 'cols', 'first', 'rows', 'take', 'grid', 'name'];

export interface AreaMaths {
  a: number; b: number; c: number; d: number;
  /** pans (unit squares) drawn side by side */ wholes: number;
  /** cells taken (a x c) and cells in ONE whole (b x d) */ taken: number; perWhole: number;
  /** cells in the amber part (b x c) */ firstCells: number;
  product: Q; amount: Q; multiplier: Q;
}
const NAME = 'AreaModel';

/** does the picture exist for these numbers? (generators only make what the model can draw) */
export function areaFits(a: number, b: number, c: number, d: number): boolean {
  const ints = [a, b, c, d].every(Number.isInteger);
  return ints && b >= 1 && b <= 6 && a >= 1 && a <= b && d >= 2 && d <= 6 && c >= 1 && c <= 2 * d && b * d <= 36
    && (c <= d || d <= 4);
}
export function computeArea(p: Pick<AreaParams, 'a' | 'b' | 'c' | 'd'>): AreaMaths {
  const { a, b, c, d } = p;
  check(areaFits(a, b, c, d), NAME, `${a}/${b} of ${c}/${d}: the model draws a ≤ b ≤ 6, 2 ≤ d ≤ 6, c ≤ 2d, b·d ≤ 36`);
  const wholes = Math.ceil(c / d);
  // count the cells one by one (asserted, not assumed): taken = rows < a and columns among the last c
  let taken = 0, firstCells = 0;
  const cols = wholes * d;
  for (let r = 0; r < b; r++) for (let k = 0; k < cols; k++) {
    const inFirst = k >= cols - c;
    if (inFirst) firstCells++;
    if (inFirst && r < a) taken++;
  }
  check(taken === a * c, NAME, 'cell count does not match a × c');
  check(firstCells === b * c, NAME, 'amber cells do not match b × c');
  const product = rat(taken, b * d);
  const want = rat(a * c, b * d);
  check(product.p === want.p && product.q === want.q, NAME, 'product rule broken');
  return { a, b, c, d, wholes, taken, perWhole: b * d, firstCells, product, amount: rat(c, d), multiplier: rat(a, b) };
}

export interface AreaFocus {
  /** pulse 0..1 of the labels (a symbol on the board and its label light up together) */
  whole?: number; first?: number; take?: number;
  /** a glowing ring around one region */
  ring?: 'first' | 'take' | 'pan' | null; ringK?: number;
  /** dim everything outside the taken cells (0..1) */
  dim?: number;
}
export interface AreaBlock {
  readonly kind: 'AreaModel';
  readonly maths: AreaMaths;
  readonly steps: readonly AreaStep[];
  readonly box: Box;
  readonly where: {
    pan: Box; whole(i: number): Box; first: Box; take: Box; cell(r: number, k: number): Box;
    /** the top-right taken cell (the nearest one to the board) */ takeCell: Box;
    labelWhole: Box; labelFirst: Box; labelTake: Box;
  };
  draw(c: Canvas, p: Progress<AreaStep>, f?: AreaFocus): void;
}

const TOP = 120, LEFT = 230, BOTTOM = 110, GAP = 26, MAXSIDE = 660;
const isTex = (s: string) => s.includes('\\');

interface Label { text: string; F: Formula | null; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; box: Box }
function mkLabel(text: string, x: number, y: number, size: number, align: 'left' | 'center' | 'right'): Label {
  if (isTex(text)) {
    const F = tex(text) as Formula;
    return { text, F, x, y, size, align, box: texBox(F, x, y, { size, align }) };
  }
  return { text, F: null, x, y, size, align, box: wordsBox(text, x, y, { size, align }) };
}

export function AreaModel(p: AreaParams, fr: Frame, th: Theme): AreaBlock {
  const m = computeArea(p);
  const W = m.wholes, cols = W * m.d;
  const availW = fr.w - LEFT - 20, availH = fr.h - TOP - BOTTOM;
  const side = Math.min(MAXSIDE, (availW - GAP * (W - 1)) / W, availH);
  const cw = side / m.d, rh = side / m.b;
  check(cw >= 56 && rh >= 56, NAME, `cells of ${Math.round(cw)} × ${Math.round(rh)} px are too small to read`);
  const totalW = W * side + (W - 1) * GAP;
  const x0 = fr.x + LEFT + (availW - totalW) / 2 + 10, y0 = fr.y + TOP + (availH - side) / 2;
  const wholeBox = (i: number): Box => { const x = x0 + i * (side + GAP); return box(x, y0, x + side, y0 + side); };
  const colX = (k: number) => wholeBox(Math.floor(k / m.d)).x0 + (k % m.d) * cw;
  const cell = (r: number, k: number): Box => { const x = colX(k), y = y0 + r * rh; return box(x, y, x + cw, y + rh); };
  const firstK = cols - m.c;
  const pan = unionBox(Array.from({ length: W }, (_, i) => wholeBox(i)));
  const first = unionBox([cell(0, firstK), cell(m.b - 1, cols - 1)]);
  const take = unionBox([cell(0, firstK), cell(m.a - 1, cols - 1)]);
  const takeCell = cell(0, cols - 1);
  const words = p.words ?? {};
  const look = p.look ?? 'pan';
  const lw = mkLabel(words.whole ?? (look === 'pan' ? (W > 1 ? '2 pans' : '1 pan') : '1 square foot'), pan.cx, pan.y1 + 62, 50, 'center');
  const lf = mkLabel(words.first ?? (look === 'pan' ? 'frosted' : 'planted'), first.cx, y0 - 62, 50, 'center');
  const lt = mkLabel(words.take ?? (look === 'pan' ? 'eaten' : 'carrots'), x0 - 36, take.cy, 50, 'right');
  check(lt.box.x0 >= fr.x - 4, NAME, `the label "${lt.text}" does not fit left of the pan`);
  check(lf.box.y0 >= fr.y - 4, NAME, 'the top label does not fit');
  check(lf.box.x0 >= fr.x && lf.box.x1 <= fr.x + fr.w + 120, NAME, 'the top label runs off the frame');

  function drawLabel(c: Canvas, L: Label, col: 'first' | 'second' | 'ink' | 'link', k: number): void {
    if (k <= 0) return;
    if (L.F) texDraw(c, L.F, L.x, L.y, { size: L.size, align: L.align, col, k: 1, alpha: k });
    else drawWords(c, L.text, L.x, L.y, col, k, { size: L.size, align: L.align });
  }
  function pulse(c: Canvas, B: Box, col: 'first' | 'second' | 'ink', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 8, B.y0 - 4, B.x1 + 8, B.y1 + 4), col, k, 14);
  }
  function ring(c: Canvas, R: Box, col: 'first' | 'second' | 'ink' | 'link' | 'pick', k: number, r: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 7, R.y0 - 7, R.w + 14, R.h + 14, r); g.stroke(); g.restore();
  }
  /** a region of columns [k0, k1) and rows [r0, r1), split at the gap between wholes */
  function regionRects(r0: number, r1: number, k0: number, k1: number): Box[] {
    const out: Box[] = [];
    for (let i = 0; i < W; i++) {
      const a0 = Math.max(k0, i * m.d), a1 = Math.min(k1, (i + 1) * m.d);
      if (a1 <= a0) continue;
      out.push(unionBox([cell(r0, a0), cell(r1 - 1, a1 - 1)]));
    }
    return out;
  }

  function draw(c: Canvas, P: Progress<AreaStep>, f: AreaFocus = {}): void {
    const kW = P.k('whole'), kC = P.k('cols'), kF = P.k('first'), kR = P.k('rows'), kT = P.k('take'), kG = P.k('grid'), kN = P.k('name');
    const dim = clamp(f.dim ?? 0);
    // the pan(s)
    for (let i = 0; i < W; i++) {
      const B = wholeBox(i), kw = E.smooth(clamp(kW * 1.4 - i * 0.4));
      if (kw <= 0) continue;
      withAlpha(c, kw, () => {
        c.g.save(); c.g.translate(0, (1 - kw) * 24);
        if (look === 'pan') {
          wash(c, rectPts(B.x0 - 22, B.y0 - 22, B.w + 44, B.h + 44, 26), '#3B3352', { seed: 40 + i, ink: DUSK.ink, inkW: 3, shade: 0.35 });
          wash(c, rectPts(B.x0, B.y0, B.w, B.h, 8), '#5E3E33', { seed: 60 + i, ink: DUSK.ink, inkW: 2.5, shade: 0.3, rough: 1.4 });
        } else {
          wash(c, rectPts(B.x0 - 14, B.y0 - 14, B.w + 28, B.h + 28, 16), '#3E2C24', { seed: 40 + i, ink: DUSK.ink, inkW: 3, shade: 0.3 });
          wash(c, rectPts(B.x0, B.y0, B.w, B.h, 4), '#4B3A2E', { seed: 60 + i, ink: DUSK.ink, inkW: 2.5, shade: 0.2, rough: 1.2 });
        }
        c.g.restore();
      });
    }
    // amber: the amount c/d
    if (kF > 0) for (const R of regionRects(0, m.b, firstK, cols)) {
      withAlpha(c, E.smooth(kF) * (1 - dim * 0.45), () => wash(c, rectPts(R.x0 + 3, R.y0 + 3, R.w - 6, R.h - 6, 6), 'first', { seed: 80 + Math.round(R.x0), ink: null, shade: 0.22, rough: 1.6 }));
    }
    // teal: a/b of the amber part, then lime: named against the whole pan
    if (kT > 0) for (const R of regionRects(0, m.a, firstK, cols)) {
      withAlpha(c, E.smooth(kT) * (1 - kN), () => wash(c, rectPts(R.x0 + 6, R.y0 + 6, R.w - 12, R.h - 12, 6), 'second', { seed: 90 + Math.round(R.x0), ink: null, shade: 0.2, rough: 1.4 }));
      if (kN > 0) withAlpha(c, E.smooth(kN), () => wash(c, rectPts(R.x0 + 6, R.y0 + 6, R.w - 12, R.h - 12, 6), 'link', { seed: 95 + Math.round(R.x0), ink: null, shade: 0.18, rough: 1.4 }));
    }
    // column cuts: across every whole, draw on top to bottom
    for (let k = 1; k < cols; k++) {
      if (k % m.d === 0) continue;
      const kc = E.inOut(clamp(kC * 1.3 - (k / cols) * 0.3));
      if (kc <= 0) continue;
      const x = colX(k);
      inkLine(c, [[x, y0 - 4], [x, y0 - 4 + (side + 8) * kc]], { col: DUSK.cream, w: 3.5, seed: 200 + k, alpha: 0.85 });
    }
    // row cuts: solid through the amber part, then dashed on through the rest of the pan (grid)
    const fx0 = colX(firstK), fx1 = pan.x1;
    for (let r = 1; r < m.b; r++) {
      const y = y0 + r * rh;
      const kr = E.inOut(clamp(kR * 1.3 - (r / m.b) * 0.3));
      if (kr > 0) for (const R of regionRects(0, m.b, firstK, cols)) {
        inkLine(c, [[R.x1 + 4, y], [lerp(R.x1 + 4, R.x0 - 4, kr), y]], { col: DUSK.cream, w: 3.5, seed: 300 + r + Math.round(R.x0), alpha: 0.9 });
      }
      const kg = E.inOut(clamp(kG));
      if (kg > 0 && firstK > 0) {
        const { g } = c;
        g.save(); g.globalAlpha *= 0.75 * (1 - dim * 0.5);
        g.setLineDash([12, 10]); g.strokeStyle = DUSK.cream; g.lineWidth = 3;
        for (let i = 0; i < W; i++) {
          const B = wholeBox(i), xa = B.x0 - 4, xb = Math.min(B.x1 + 4, fx0);
          if (xb <= xa + 4) continue;
          g.beginPath(); g.moveTo(xb, y); g.lineTo(lerp(xb, xa, kg), y); g.stroke();
        }
        g.restore();
      }
    }
    void fx1;
    // the named cells: every taken cell outlined in lime
    if (kN > 0) for (let r = 0; r < m.a; r++) for (let k = firstK; k < cols; k++) {
      const B = cell(r, k);
      inkLine(c, rectPts(B.x0 + 9, B.y0 + 9, B.w - 18, B.h - 18, 8), { col: 'link', w: 3, closed: true, seed: 400 + r * 9 + k, alpha: E.smooth(kN) * 0.9 });
    }
    // labels and pulses
    pulse(c, lw.box, 'ink', f.whole ?? 0);
    pulse(c, lf.box, 'first', f.first ?? 0);
    pulse(c, lt.box, 'second', f.take ?? 0);
    drawLabel(c, lw, 'ink', kW);
    drawLabel(c, lf, 'first', kF);
    // the amber bracket under the top label
    if (kF > 0) {
      const y = y0 - 22;
      inkLine(c, [[first.x0 + 6, y + 10], [first.x0 + 6, y], [first.x1 - 6, y], [first.x1 - 6, y + 10]], { col: 'first', w: 3.5, seed: 501, alpha: E.smooth(kF) });
    }
    drawLabel(c, lt, kN > 0.5 ? 'link' : 'second', kT);
    if (kT > 0) {
      const x = x0 - 22;
      inkLine(c, [[x + 10, take.y0 + 6], [x, take.y0 + 6], [x, take.y1 - 6], [x + 10, take.y1 - 6]], { col: kN > 0.5 ? 'link' : 'second', w: 3.5, seed: 502, alpha: E.smooth(kT) });
    }
    // rings
    const rk = clamp(f.ringK ?? 0);
    if (f.ring && rk > 0) ring(c, f.ring === 'first' ? first : f.ring === 'take' ? take : pan, f.ring === 'first' ? 'first' : f.ring === 'take' ? 'link' : 'ink', rk, 12);
  }

  return {
    kind: 'AreaModel', maths: m, steps: AREA_STEPS,
    box: unionBox([pan, lw.box, lf.box, lt.box]),
    where: { pan, whole: wholeBox, first, take, cell, takeCell, labelWhole: lw.box, labelFirst: lf.box, labelTake: lt.box },
    draw,
  };
}
