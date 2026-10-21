// ScalePair: a drawing next to the actual thing it shows, so "how many times as long" can be SEEN.
// The drawing sits on a small blueprint card (top); the actual object (a teal wash) lies under it, left edges aligned.
//   copies mode  drawing and actual are drawn at ONE px scale, so the actual length is literally n copies of the drawing
//                length: a tape of amber copies is laid along the actual length (copyL) and a column of copies of the
//                drawing width beside the actual width (copyW). A drawing that is not to scale overshoots (red) or
//                falls short (red bracket) when the factor taken from the other side is laid along it.
//   units mode   the actual length is too long to copy (1 : 100); the drawing's length is cut into its units and each
//                unit maps onto one block of the actual length ("100" per block): the tape becomes the scale.
// Steps: card fig labD real labA (actual length label) labAw (actual width label) copyL copyW tag units (named tr keys `${pre}${step}`). Labels sit OUTSIDE the sides
// (drawing: length under, width right; actual: length under, width left); the block throws BlockError when a label
// would sit on a line, overlap another label or leave the frame, so an unreadable picture is never drawn.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

export type PairStep = 'card' | 'fig' | 'labD' | 'real' | 'labA' | 'labAw' | 'copyL' | 'copyW' | 'tag' | 'units';
export const PAIR_STEPS: readonly PairStep[] = ['card', 'fig', 'labD', 'real', 'labA', 'labAw', 'tag', 'copyL', 'copyW', 'units'];
export interface PairParams {
  /** the unit word of the drawing (and of the actual lengths, unless realUnit) */
  unit: string;
  realUnit?: string;
  /** drawing length, width (units) */
  draw: [number, number];
  /** actual length, width (realUnit) */
  real: [number, number];
  mode?: 'copies' | 'units';
  shape?: 'board' | 'rect';
  /** copies to lay along the length / the width (default actual / drawing; 0 = none) */
  copies?: [number, number];
  /** TeX of the scale tag on the card (\cssId{d}{..} drawing part, \cssId{a}{..} actual part) */
  tag?: string;
  /** TeX label overrides (null = no label) */
  labD?: [string | null, string | null];
  labA?: [string | null, string | null];
  /** the caption inside the actual object ('actual skateboard') */
  name?: string;
  /** units mode: room for Sam's reading (the whole length = one block) on its own row under the actual object */
  sam?: boolean;
}
export interface PairFocus {
  /** glow a pair of sides: len = both lengths, wid = both widths, cross = drawing length with actual width */
  pair?: { which: 'len' | 'wid' | 'cross'; col: Paint; k: number };
  /** units mode: "100 cm" read as the whole length = only the first block */
  sam?: number;
}
export interface PairBlock {
  readonly kind: 'ScalePair';
  readonly u: number;
  readonly where: { card: Box; fig: Box; real: Box; labD(i: 0 | 1): Box; labA(i: 0 | 1): Box; tapeEnd: Box; colEnd: Box; block(i: number): Box; sam: Box };
  draw(c: Canvas, pr: { k(s: string): number }, f?: PairFocus): void;
}

const NAME = 'ScalePair';
const BLK = 60, DGAP = 26, LBL = 60, CAP = 44, CNT = 60, PAD = 22, ROW = 66, GAP = 40, TAPE_C = 34, TAPE_U = 80, COLW = 28;
const PAPER = '#1C3A70', GRIDC = '#4C6CAA';
const overlap = (a: Box, b: Box, g = 8) => a.x0 < b.x1 + g && b.x0 < a.x1 + g && a.y0 < b.y1 + g && b.y0 < a.y1 + g;
const inBox = (a: Box, b: Box) => a.x0 >= b.x0 && a.x1 <= b.x1 && a.y0 >= b.y0 && a.y1 <= b.y1;
const T = (u: string) => `\\text{ ${u}}`;
interface Lbl { F: Formula; x: number; y: number; box: Box; col: Paint }
/** a TeX label whose ink box is centred at (cx, cy) (align 'left' at x0 when left is given) */
function place(src: string, cx: number, cy: number, col: Paint, size = LBL, anchor: 'center' | 'left' | 'right' = 'center'): Lbl {
  const F = tex(src) as Formula;
  const b0 = texBox(F, 0, 0, { size, align: 'left' });
  const x = anchor === 'center' ? cx - b0.w / 2 - b0.x0 : anchor === 'left' ? cx - b0.x0 : cx - b0.w - b0.x0;
  const y = cy - b0.cy;
  return { F, x, y, box: texBox(F, x, y, { size, align: 'left' }), col };
}
const sizeOf = (src: string, size = LBL) => texBox(tex(src) as Formula, 0, 0, { size, align: 'left' });

export function ScalePair(p: PairParams, fr: Frame): PairBlock {
  const mode = p.mode ?? 'copies';
  const [dL, dW] = p.draw, [rL, rW] = p.real;
  check(dL > 0 && dW > 0 && rL > 0 && rW > 0, NAME, 'lengths must be positive');
  const ru = p.realUnit ?? p.unit;
  const srcD: [string | null, string | null] = p.labD ?? [`${dL}${T(p.unit)}`, `${dW}${T(p.unit)}`];
  const srcA: [string | null, string | null] = p.labA ?? [`${rL}${T(ru)}`, `${rW}${T(ru)}`];
  const cL = p.copies?.[0] ?? (mode === 'copies' ? rL / dL : 0), cW = p.copies?.[1] ?? (mode === 'copies' ? rW / dW : 0);
  if (mode === 'copies') {
    check(ru === p.unit, NAME, 'copies need one unit');
    check(Number.isInteger(cL) && Number.isInteger(cW) && cL >= 0 && cW >= 0 && cL <= 24 && cW <= 24, NAME, 'copies must be whole (at most 24)');
  } else check(Number.isInteger(dL) && dL >= 1 && dL <= 8, NAME, 'units mode needs a whole drawing length (1 to 8)');
  const R = fr.x + fr.w, B = fr.y + fr.h;
  const lh = sizeOf('8\\text{ in}').h;
  const wLeft = srcA[1] ? sizeOf(srcA[1]).w : 0, wDright = srcD[1] ? sizeOf(srcD[1]).w : 0;
  const cntW = sizeOf(`\\times ${Math.max(cL, cW, 10)}`, CNT).w;
  const x0 = Math.round(fr.x + Math.max(wLeft + 24, PAD + 4));
  const TH = mode === 'copies' ? TAPE_C : TAPE_U;
  // units mode keeps a second row under the actual object for Sam's length (so it never crowds the actual length)
  // DGAP: air between the drawing and its labels (a thin drawing's two labels must not crowd each other)
  const fixedV = PAD + ROW + 10 + DGAP + 24 + lh + PAD + GAP + TH + 22 + 18 + lh + 8 + (mode === 'units' && p.sam ? lh + 22 : 0);

  // ---- px per unit ----
  let ud: number, ur: number;
  if (mode === 'copies') {
    const tapeLen = Math.max(rL, cL * dL);
    const uH = Math.min((R - x0 - 24 - cntW) / tapeLen, (R - x0 - 22 - COLW - 18 - cntW) / rL);
    const uV = (fr.h - fixedV) / (dW + rW);
    ud = ur = Math.min(uH, uV, 40);
    check(dL * ud >= 44 && dW * ud >= 12, NAME, `the drawing is too small to see (${ud.toFixed(1)} px per ${p.unit})`);
    check(rW * ur >= 40, NAME, 'the actual object is too thin');
  } else {
    ur = (R - x0 - 90) / rL;
    ud = Math.min(52, (R - x0 - PAD - wDright - 60) / dL);
    ur = Math.min(ur, (fr.h - fixedV - dW * ud) / rW);
    check(ud >= 26, NAME, 'the drawing grid is too small');
    check(rW * ur >= 60 && rL * ur >= 300, NAME, 'the actual object is too small');
  }

  // ---- vertical stack, centred ----
  const blockH = fixedV + dW * ud + rW * ur;
  check(blockH <= fr.h + 0.5, NAME, 'the picture does not fit');
  const top = Math.round(fr.y + (fr.h - blockH) / 2);
  const figY0 = top + PAD + ROW + 10, fig = box(x0, figY0, x0 + dL * ud, figY0 + dW * ud);
  const labDWid = srcD[1] ? place(srcD[1], fig.x1 + DGAP, fig.cy, 'first', LBL, 'left') : null;
  const labDLen = srcD[0] ? place(srcD[0], fig.cx, Math.max(fig.y1 + DGAP + lh / 2, (labDWid?.box.y1 ?? 0) + 36 + lh / 2), 'first') : null;
  // a thin drawing: the length label slides left so it clears the width label
  if (labDLen && labDWid && overlap(labDLen.box, labDWid.box, 10)) {
    const shift = labDLen.box.x1 - (labDWid.box.x0 - 14);
    labDLen.x -= shift; labDLen.box = box(labDLen.box.x0 - shift, labDLen.box.y0, labDLen.box.x1 - shift, labDLen.box.y1);
  }
  const capBox = wordsBox('drawing', 0, 0, { size: CAP, weight: 700 });
  const tagSz = p.tag ? sizeOf(p.tag, 54) : null;
  const cardX0 = Math.max(Math.round(fr.x), Math.min(x0 - PAD, (labDLen?.box.x0 ?? x0) - PAD));
  // a short drawing near the frame's edge: its length label moves right to stay on the card
  if (labDLen && labDLen.box.x0 < cardX0 + 12) {
    const shift = cardX0 + 12 - labDLen.box.x0;
    labDLen.x += shift; labDLen.box = box(labDLen.box.x0 + shift, labDLen.box.y0, labDLen.box.x1 + shift, labDLen.box.y1);
  }
  const cardX1 = Math.max(fig.x1 + (labDWid ? 18 + labDWid.box.w : 0) + PAD, cardX0 + PAD + capBox.w + (tagSz ? 30 + tagSz.w : 0) + PAD);
  const cardY1 = Math.max(fig.y1, labDWid?.box.y1 ?? 0, labDLen?.box.y1 ?? 0) + PAD;
  const card = box(cardX0, top, cardX1, cardY1);
  const capY = top + PAD + ROW / 2 - 4;
  const tag = p.tag ? place(p.tag, card.x0 + PAD + capBox.w + 30, capY, 'dim', 54, 'left') : null;
  const tapeY0 = card.y1 + GAP, tapeY1 = tapeY0 + TH;
  const real = box(x0, tapeY1 + 22, x0 + rL * ur, tapeY1 + 22 + rW * ur);
  const labALen = srcA[0] ? place(srcA[0], real.cx, real.y1 + 18 + lh / 2, 'second') : null;
  const labAWid = srcA[1] ? place(srcA[1], real.x0 - 22, real.cy, 'second', LBL, 'right') : null;
  // the caption sits in the middle of the object: clear of its outline, a rounded end and the bolts near the ends
  const nameX = real.cx, nameY = real.cy;
  const nameBox = p.name ? wordsBox(p.name, nameX, nameY, { size: CAP, weight: 700, align: 'center' }) : null;
  const showName = !!nameBox && nameBox.w <= real.w * (p.shape === 'board' ? 0.55 : 0.85) && nameBox.h <= real.h - 24;

  // copies: the tape along the length (above the actual object) and the column along the width (right of it)
  const cu = ud;   // copies mode: one px scale
  const tapeEndX = mode === 'copies' ? x0 + cL * dL * cu : real.x1;
  const cnt = (n: number) => place(`\\times ${n}`, Math.max(tapeEndX, real.x1) + 22, (tapeY0 + tapeY1) / 2, 'link', CNT, 'left');
  const cntL = mode === 'copies' && cL > 0 ? cnt(cL) : null;
  const colX0 = real.x1 + 22, colEnd = real.y0 + cW * dW * cu;
  const cntW_ = mode === 'copies' && cW > 0 ? place(`\\times ${cW}`, colX0 + COLW + 18, Math.min(real.cy, B - lh), 'link', CNT, 'left') : null;
  // units mode: one block per drawing unit
  const per = rL / dL;
  const blockW = (rL * ur) / dL;
  const perTxt = Number.isInteger(per) ? per.toLocaleString('en-US') : String(per);
  const blockLbl = wordsBox(perTxt, 0, 0, { size: BLK, weight: 700 });
  if (mode === 'units') check(blockLbl.w + 22 <= blockW, NAME, 'the blocks are too narrow for their numbers');
  const unitWord = mode === 'units' ? wordsBox(ru, real.x1 + 16, (tapeY0 + tapeY1) / 2, { size: CAP, weight: 600 }) : null;
  const samLbl = mode === 'units' && p.sam ? place(`${perTxt}${T(ru)}`, x0 + blockW / 2, real.y1 + 18 + lh + 22 + lh / 2, 'wrong') : null;

  // ---- readability checks ----
  const frameBox = box(fr.x - 2, fr.y - 2, R + 2, B + 2);
  const all: [string, Box | null | undefined][] = [
    ['drawing length label', labDLen?.box], ['drawing width label', labDWid?.box], ['actual length label', labALen?.box],
    ['actual width label', labAWid?.box], ['length count', cntL?.box], ['width count', cntW_?.box], ['scale tag', tag?.box], ['unit word', unitWord], ['Sam length', samLbl?.box],
  ];
  for (const [what, b] of all) if (b) check(inBox(b, frameBox), NAME, `the ${what} leaves the frame`);
  check(inBox(card, frameBox) && inBox(real, frameBox), NAME, 'the picture leaves the frame');
  const named = all.filter((x): x is [string, Box] => !!x[1]);
  for (let i = 0; i < named.length; i++) for (let j = i + 1; j < named.length; j++) check(!overlap(named[i]![1], named[j]![1], 10), NAME, `the ${named[i]![0]} runs into the ${named[j]![0]}`);
  for (const [what, b] of named) {
    check(!overlap(b, fig, 6) && !overlap(b, real, 6), NAME, `the ${what} sits on a figure`);
  }
  if (cntW_) check(colEnd <= B, NAME, 'the width copies leave the frame');
  if (samLbl && labALen) check(!overlap(samLbl.box, labALen.box, 12), NAME, 'Sam\'s length runs into the actual length');

  // ---------- drawing ----------
  const counts = new Map<number, Lbl>();
  const cntAt = (n: number, kind: 'L' | 'W'): Lbl => {
    const key = kind === 'L' ? n : 1000 + n;
    let l = counts.get(key);
    if (!l) { l = kind === 'L' ? cnt(n) : place(`\\times ${n}`, colX0 + COLW + 18, cntW_!.box.cy, 'link', CNT, 'left'); counts.set(key, l); }
    return l;
  };
  const shapePts = (b: Box, shape: PairParams['shape']): readonly [number, number][] => {
    const r = shape === 'board' ? Math.min(b.h / 2, b.w / 4) : Math.min(10, b.h / 4, b.w / 4);
    return rectPts(b.x0, b.y0, b.w, b.h, r, 8);
  };
  function lbl(c: Canvas, L: Lbl | null, k: number, size = LBL, tags?: unknown, pad?: string): void {
    if (!L || k <= 0) return;
    if (pad) withAlpha(c, E.smooth(clamp(k)), () => { c.g.save(); c.g.fillStyle = pad; c.g.beginPath(); c.g.roundRect(L.box.x0 - 10, L.box.y0 - 8, L.box.w + 20, L.box.h + 16, 10); c.g.fill(); c.g.restore(); });
    texDraw(c, L.F, L.x, L.y, { size, align: 'left', col: L.col, k: clamp(k), tags: tags as never });
  }
  /** the card's grid: one square per drawing unit, lined up with the drawing's corner (none when too dense) */
  function grid(c: Canvas, b: Box, u: number, col: string, alpha: number): void {
    if (u < 16) return;
    const gx0 = fig.x0 - Math.floor((fig.x0 - b.x0) / u) * u, gy0 = fig.y0 - Math.floor((fig.y0 - b.y0) / u) * u;
    for (let x = gx0; x < b.x1 - 3; x += u) if (x > b.x0 + 3) strokePts(c, [[x, b.y0 + 3], [x, b.y1 - 3]], { col: col as Paint, lw: 1.4, alpha });
    for (let y = gy0; y < b.y1 - 3; y += u) if (y > b.y0 + 3) strokePts(c, [[b.x0 + 3, y], [b.x1 - 3, y]], { col: col as Paint, lw: 1.4, alpha });
  }
  function bolts(c: Canvas, b: Box): void {
    if (p.shape !== 'board') return;
    const r = Math.max(2.5, b.h * 0.035);
    for (const fx of [0.17, 0.83]) for (const fy of [0.32, 0.68]) for (const dx of [-1, 1]) {
      const x = b.x0 + b.w * fx + dx * b.h * 0.09, y = b.y0 + b.h * fy;
      c.g.save(); c.g.fillStyle = DUSK.ink; c.g.globalAlpha *= 0.55; c.g.beginPath(); c.g.arc(x, y, r, 0, Math.PI * 2); c.g.fill(); c.g.restore();
    }
  }
  function sideOf(b: Box, s: 'bottom' | 'right' | 'left'): [number, number][] {
    return s === 'bottom' ? [[b.x0 + (p.shape === 'board' ? b.h / 2 : 4), b.y1], [b.x1 - (p.shape === 'board' ? b.h / 2 : 4), b.y1]]
      : s === 'right' ? [[b.x1, b.y0 + 4], [b.x1, b.y1 - 4]] : [[b.x0, b.y0 + 4], [b.x0, b.y1 - 4]];
  }

  function draw(c: Canvas, pr: { k(s: string): number }, f: PairFocus = {}): void {
    const k = (s: PairStep) => clamp(pr.k(s));
    const kC = k('card'), kF = k('fig'), kD = k('labD'), kR = k('real'), kA = k('labA'), kAw = k('labAw'), kT = k('tag');
    const kCL = k('copyL'), kCW = k('copyW'), kU = k('units');
    // the card
    if (kC > 0) withAlpha(c, E.smooth(kC), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 10), PAPER, { seed: 21, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.2 });
      grid(c, box(card.x0, card.y0, card.x1, card.y1), ud, GRIDC, 0.55);
      c.g.save(); c.g.fillStyle = PAPER; c.g.beginPath(); c.g.roundRect(card.x0 + PAD - 10, capY - capBox.h / 2 - 8, capBox.w + 20, capBox.h + 16, 10); c.g.fill(); c.g.restore();
      drawWords(c, 'drawing', card.x0 + PAD, capY, 'dim', 1, { size: CAP, weight: 700 });
    });
    if (tag && kT > 0) lbl(c, tag, kT, 54, { d: { col: 'first' }, a: { col: 'second' } }, PAPER);
    // the drawing
    if (kF > 0) withAlpha(c, E.smooth(kF), () => {
      const P = shapePts(fig, p.shape);
      withAlpha(c, 0.75, () => wash(c, P, 'first', { seed: 41, rough: 0.8, ink: null, shade: 0.15 }));
      // units mode: the drawing's length cut into its units; the unit being mapped glows
      if (mode === 'units') {
        for (let i = 1; i < dL; i++) strokePts(c, [[fig.x0 + i * ud, fig.y0 + 3], [fig.x0 + i * ud, fig.y1 - 3]], { col: DUSK.ink as Paint, lw: 2.5, alpha: 0.7 });
        const act = kU > 0 && kU < 1 ? Math.min(dL - 1, Math.floor(kU * dL)) : -1;
        if (act >= 0) withAlpha(c, 0.75, () => wash(c, rectPts(fig.x0 + act * ud, fig.y0, ud, fig.h, 4), 'link', { seed: 50 + act, rough: 0.6, ink: null }));
      }
      strokePts(c, P, { col: 'first', lw: 4, closed: true });
      bolts(c, fig);
    });
    if (kD > 0 && kF > 0) { lbl(c, labDLen, Math.min(kD, kF), LBL, undefined, PAPER); lbl(c, labDWid, Math.min(kD, kF), LBL, undefined, PAPER); }
    // the actual object
    if (kR > 0) withAlpha(c, E.smooth(kR), () => {
      const P = shapePts(real, p.shape);
      withAlpha(c, 0.6, () => wash(c, P, 'second', { seed: 43, rough: 1.4, ink: null, shade: 0.18 }));
      strokePts(c, P, { col: 'second', lw: 4.5, closed: true });
      bolts(c, real);
      if (showName) drawWords(c, p.name!, nameX, nameY, 'ink', 1, { size: CAP, weight: 700, align: 'center' });
    });
    if (kR > 0) { lbl(c, labALen, Math.min(kA, kR)); lbl(c, labAWid, Math.min(kAw, kR)); }
    // glowing pairs of sides
    if (f.pair && f.pair.k > 0 && kF > 0 && kR > 0) {
      const g = E.smooth(clamp(f.pair.k));
      const [s1, s2] = f.pair.which === 'len' ? [sideOf(fig, 'bottom'), sideOf(real, 'bottom')] : f.pair.which === 'wid' ? [sideOf(fig, 'right'), sideOf(real, 'left')] : [sideOf(fig, 'bottom'), sideOf(real, 'left')];
      for (const S of [s1, s2]) strokePts(c, S, { col: f.pair.col, lw: 9, glow: 12, alpha: g });
    }
    // copies along the length
    if (mode === 'copies' && cL > 0 && kCL > 0) {
      const n = cL, shown = kCL * n, w = dL * cu;
      for (let i = 0; i < n; i++) {
        const q = clamp(shown - i);
        if (q <= 0) break;
        const xa = x0 + i * w, xb = xa + w * E.out(q);
        const over = Math.max(xa, real.x1);
        const pts = rectPts(xa + 2, tapeY0, Math.max(1, xb - xa - 4), TH, 6);
        withAlpha(c, 0.35 + 0.65 * q, () => {
          wash(c, pts, 'first', { seed: 60 + i, rough: 0.6, ink: null, lift: i % 2 ? 0.28 : 0, shade: 0.1 });
          strokePts(c, pts, { col: DUSK.ink as Paint, lw: 2.5, closed: true, alpha: 0.8 });
          if (xb > real.x1 + 1) wash(c, rectPts(over, tapeY0, xb - over - 2, TH, 4), 'wrong', { seed: 70 + i, rough: 0.6, ink: null, alpha: 0.8 });
        });
      }
      const m = Math.min(n, Math.max(1, Math.ceil(shown - 0.35)));
      lbl(c, cntAt(m, 'L'), Math.min(1, kCL * n));
      // a drawing that is not to scale: the copies stop short of the actual length
      if (kCL >= 1 && tapeEndX < real.x1 - 1) {
        strokePts(c, [[tapeEndX + 4, tapeY1 - 4], [real.x1, tapeY1 - 4]], { col: 'wrong', lw: 6, dash: [12, 9] });
        strokePts(c, [[real.x1, tapeY0], [real.x1, tapeY1 + 14]], { col: 'wrong', lw: 4 });
      }
    }
    // copies along the width
    if (mode === 'copies' && cW > 0 && kCW > 0 && cntW_) {
      const n = cW, shown = kCW * n, hh = dW * cu;
      for (let i = 0; i < n; i++) {
        const q = clamp(shown - i);
        if (q <= 0) break;
        const ya = real.y0 + i * hh, yb = ya + hh * E.out(q);
        const pts = rectPts(colX0, ya + 1.5, COLW, Math.max(1, yb - ya - 3), 4);
        withAlpha(c, 0.35 + 0.65 * q, () => {
          wash(c, pts, 'first', { seed: 80 + i, rough: 0.5, ink: null, lift: i % 2 ? 0.28 : 0, shade: 0.1 });
          strokePts(c, pts, { col: DUSK.ink as Paint, lw: 2, closed: true, alpha: 0.8 });
          if (yb > real.y1 + 1) wash(c, rectPts(colX0, Math.max(ya, real.y1), COLW, yb - Math.max(ya, real.y1), 3), 'wrong', { seed: 90 + i, rough: 0.5, ink: null, alpha: 0.8 });
        });
      }
      const m = Math.min(n, Math.max(1, Math.ceil(shown - 0.35)));
      lbl(c, cntAt(m, 'W'), Math.min(1, kCW * n));
      if (kCW >= 1 && colEnd < real.y1 - 1) strokePts(c, [[colX0 + COLW / 2, colEnd + 4], [colX0 + COLW / 2, real.y1]], { col: 'wrong', lw: 6, dash: [12, 9] });
    }
    // units mode: one block of the actual length per drawing unit
    if (mode === 'units' && kU > 0) {
      const shown = kU * dL;
      for (let i = 0; i < dL; i++) {
        const q = clamp(shown - i);
        if (q <= 0) break;
        const xa = x0 + i * blockW, pts = rectPts(xa + 2, tapeY0, (blockW - 4) * E.out(q), TH, 6);
        withAlpha(c, 0.35 + 0.65 * q, () => {
          wash(c, pts, 'second', { seed: 100 + i, rough: 0.6, ink: null, lift: i % 2 ? 0.3 : 0.08, shade: 0.1 });
          strokePts(c, pts, { col: DUSK.ink as Paint, lw: 2.5, closed: true, alpha: 0.8 });
        });
        if (q > 0.6) drawWords(c, perTxt, xa + blockW / 2, (tapeY0 + tapeY1) / 2 + 2, DUSK.ink as Paint, clamp((q - 0.6) / 0.4), { size: BLK, align: 'center', weight: 700 });
      }
      if (unitWord) drawWords(c, ru, unitWord.x0, (tapeY0 + tapeY1) / 2, 'second', clamp(shown - dL + 1), { size: CAP, weight: 600 });
    }
    // Sam's reading: the whole length = one block
    if (mode === 'units' && (f.sam ?? 0) > 0 && samLbl) {
      const g = E.smooth(clamp(f.sam!));
      strokePts(c, rectPts(x0 + 2, tapeY0 - 4, blockW - 4, TH + 8, 8), { col: 'wrong', lw: 6, closed: true, alpha: g, glow: 8 });
      strokePts(c, [[x0 + 4, real.y1 + 10], [x0 + blockW - 4, real.y1 + 10]], { col: 'wrong', lw: 6, alpha: g });
      for (const x of [x0 + 4, x0 + blockW - 4]) strokePts(c, [[x, real.y1 + 2], [x, real.y1 + 18]], { col: 'wrong', lw: 5, alpha: g });
      lbl(c, samLbl, g);
    }
  }

  const blockBox = (i: number) => box(x0 + i * blockW, tapeY0, x0 + (i + 1) * blockW, tapeY1);
  return {
    kind: 'ScalePair', u: ud,
    where: {
      card, fig, real,
      labD: i => (i === 0 ? labDLen : labDWid)?.box ?? fig,
      labA: i => (i === 0 ? labALen : labAWid)?.box ?? real,
      tapeEnd: cntL?.box ?? box(tapeEndX - 10, tapeY0, tapeEndX + 10, tapeY1),
      colEnd: cntW_?.box ?? box(colX0, colEnd - 10, colX0 + COLW, colEnd + 10),
      block: blockBox,
      sam: samLbl?.box ?? blockBox(0),
    },
    draw,
  };
}
