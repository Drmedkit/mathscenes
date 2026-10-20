// EqualShare: a wholes (granola bars) shared equally among b sharers (trays), the model of a ÷ b = a/b.
// Every bar is cut into b equal pieces; sharer j takes piece j of every bar, so each tray collects a pieces of 1/b.
// A tray holds a dashed GHOST of whole bars at the same size as the real bars, so the share is read against ONE
// whole bar (3/4 of a bar, not 3/12 of everything): rows of the ghost are wholes, so a/b > 1 shows 1 whole + more.
//
// Steps: labelA, bars, labelB, trays, cut, deal, count, regroup.  Highlights (outline + glow) are passed in by the
// scene through `focus` so annotations can point at any part: { pieces: [[bar, piece]], trays: [j], rows: [[j,row]] }.
import { type Box, type Pt, box, clamp, lag, lerp, rat, type Q, unionBox } from '../core/math';
import { rectPts } from '../core/pts';
import { type Canvas, withAlpha } from '../core/draw';
import { E } from '../core/easing';
import type { Progress } from '../core/clock';
import { type Theme, paint } from '../core/theme';
import { drawWords, wordsBox } from './words';
import { type Frame, check, plainText } from '../blocks/block';
import { inkLine, wash } from './wash';
import { DUSK } from './dusk';
import { L, H, BAR_GAP, PAD, ICON, TRAY_GAP_X, TRAY_GAP_Y, ROW_GAP, LABEL_H, MID } from './shareLayout';
export { equalShareFits, equalShareHeight } from './shareLayout';

export interface EqualShareParams {
  /** wholes shared (1 … 8) */ a: number;
  /** sharers (2 … 6) */ b: number;
  /** words for the group labels, e.g. ['bars', 'friends'] */ words?: readonly [string, string];
  /** singular, for 1 */ one?: readonly [string, string];
  /** the tray the count / regroup rings frame (default: the first tray in the right column, nearest the board) */
  focusTray?: number;
  /** the painted object: granola bars or pans of brownies (both in the 'first' role colour) */
  look?: 'granola' | 'brownie';
}
export type EqualShareStep = 'labelA' | 'bars' | 'labelB' | 'trays' | 'cut' | 'deal' | 'count' | 'regroup';
export const EQUAL_SHARE_STEPS: readonly EqualShareStep[] = ['labelA', 'bars', 'labelB', 'trays', 'cut', 'deal', 'count', 'regroup'];

export interface Deal { bar: number; piece: number; tray: number; slot: number; row: number; col: number }
export interface EqualShareMaths {
  a: number; b: number; share: Q; whole: number; rem: number;
  /** ghost rows per tray: whole bars a tray must be able to hold */ rows: number;
  deals: Deal[];
}

const NAME = 'EqualShare';

export function computeEqualShare(p: EqualShareParams): EqualShareMaths {
  const { a, b } = p;
  check(Number.isInteger(a) && a >= 1 && a <= 8, NAME, `a = ${a}: share 1 to 8 whole bars`);
  check(Number.isInteger(b) && b >= 2 && b <= 6, NAME, `b = ${b}: share among 2 to 6`);
  const rows = Math.max(1, Math.ceil(a / b));
  check(rows <= 2, NAME, `${a} ÷ ${b} is more than 2 whole bars each: the tray would need ${rows} rows`);
  const deals: Deal[] = [];
  for (let bar = 0; bar < a; bar++) for (let piece = 0; piece < b; piece++)
    deals.push({ bar, piece, tray: piece, slot: bar, row: Math.floor(bar / b), col: bar % b });
  // conservation (asserted, not assumed): every tray gets a pieces, all a*b pieces are dealt once
  for (let j = 0; j < b; j++) check(deals.filter(d => d.tray === j).length === a, NAME, 'uneven deal');
  return { a, b, share: rat(a, b), whole: Math.floor(a / b), rem: a % b, rows, deals };
}

export interface EqualShareFocus {
  pieces?: readonly (readonly [number, number])[];
  trays?: readonly number[];
  /** [tray, row]: a whole row of a tray (one whole bar of pieces) */
  rows?: readonly (readonly [number, number])[];
  /** emphasis 0..1 of the focus outlines */
  k?: number;
  /** colour role of the focus (default 'pick') */
  col?: 'pick' | 'link' | 'first' | 'second';
  /** dim everything that is not in focus (0..1) */
  dim?: number;
  /** draw the outline ring around focused trays (default true) */
  ring?: boolean;
  /** pulse 0..1 of the group labels (a notation symbol and its label light up together) */
  labelA?: number; labelB?: number;
}

export interface EqualShareBlock {
  readonly kind: 'EqualShare';
  readonly maths: EqualShareMaths;
  readonly steps: readonly EqualShareStep[];
  readonly box: Box;
  readonly focusTray: number;
  /** world boxes for annotation leaders */
  readonly where: {
    bars: Box; trays: Box; labelA: Box; labelB: Box;
    bar(i: number): Box; piece(i: number, j: number): Box; tray(j: number): Box; slots(j: number): Box; row(j: number, r: number): Box;
    /** where piece (bar, piece) sits once dealt */ dealt(i: number, j: number): Box;
  };
  draw(c: Canvas, p: Progress<EqualShareStep>, focus?: EqualShareFocus): void;
}


export function EqualShare(p: EqualShareParams, fr: Frame, th: Theme): EqualShareBlock {
  const m = computeEqualShare(p);
  const [wa, wb] = p.words ?? ['bars', 'friends'];
  const [oa, ob] = p.one ?? ['bar', 'friend'];
  plainText(wa, NAME, 'words[0]'); plainText(wb, NAME, 'words[1]');
  const trayW = ICON + L + PAD, trayH = m.rows * H + (m.rows - 1) * ROW_GAP + 2 * PAD;
  const cols = 2, colX = (k: number) => fr.x + k * (trayW + TRAY_GAP_X);
  check(cols * trayW + TRAY_GAP_X <= fr.w, NAME, `two trays (${2 * trayW + TRAY_GAP_X} px) do not fit ${fr.w} px`);
  const barCols = m.a > 3 ? 2 : 1, barRows = Math.ceil(m.a / barCols);
  const barsH = barRows * H + (barRows - 1) * BAR_GAP;
  const trayRows = Math.ceil(m.b / cols), traysH = trayRows * trayH + (trayRows - 1) * TRAY_GAP_Y;
  const totalH = LABEL_H + barsH + MID + LABEL_H + traysH;
  check(totalH <= fr.h, NAME, `${m.a} bars among ${m.b} need ${Math.round(totalH)} px, the frame has ${fr.h}`);
  const y0 = fr.y + (fr.h - totalH) / 2;
  const barsY = y0 + LABEL_H, traysY = barsY + barsH + MID + LABEL_H;
  // bars line up with the ghost bars in the trays below (same x, same size: the same whole)
  const barBox = (i: number): Box => {
    const c = barCols === 2 ? i % 2 : 0, r = barCols === 2 ? Math.floor(i / 2) : i;
    const x = colX(c) + ICON, y = barsY + r * (H + BAR_GAP);
    return box(x, y, x + L, y + H);
  };
  const pw = L / m.b;
  const pieceBox = (i: number, j: number): Box => { const B = barBox(i); return box(B.x0 + j * pw, B.y0, B.x0 + (j + 1) * pw, B.y1); };
  const trayBox = (j: number): Box => {
    const c = j % cols, r = Math.floor(j / cols), x = colX(c), y = traysY + r * (trayH + TRAY_GAP_Y);
    return box(x, y, x + trayW, y + trayH);
  };
  const rowBox = (j: number, r: number): Box => { const T = trayBox(j), x = T.x0 + ICON, y = T.y0 + PAD + r * (H + ROW_GAP); return box(x, y, x + L, y + H); };
  const dealtBox = (i: number, j: number): Box => {
    const d = m.deals.find(q => q.bar === i && q.piece === j)!, R = rowBox(d.tray, d.row);
    return box(R.x0 + d.col * pw, R.y0, R.x0 + (d.col + 1) * pw, R.y1);
  };
  const barsAll = unionBox(Array.from({ length: m.a }, (_, i) => barBox(i)));
  const traysAll = unionBox(Array.from({ length: m.b }, (_, j) => trayBox(j)));
  const TA = `${m.a} ${m.a === 1 ? oa : wa}`, TB = `${m.b} ${m.b === 1 ? ob : wb}`;
  const size = Math.max(th.font.minLabel, 50);
  const laX = colX(0) + ICON, laY = barsY - LABEL_H / 2 - 4, lbX = colX(0), lbY = traysY - LABEL_H / 2 - 4;
  const labelA = wordsBox(TA, laX, laY, { size }), labelB = wordsBox(TB, lbX, lbY, { size });
  check(labelA.y0 >= fr.y - 1 && labelB.y1 < traysY, NAME, 'group labels do not fit');

  const ft = p.focusTray ?? Math.min(1, m.b - 1);
  check(ft >= 0 && ft < m.b, NAME, `focusTray ${ft} does not exist`);
  const brownie = p.look === 'brownie';
  function slotsBox(j: number): Box { return unionBox(Array.from({ length: m.rows }, (_, r) => rowBox(j, r))); }

  function draw(c: Canvas, P: Progress<EqualShareStep>, f: EqualShareFocus = {}): void {
    const kLA = P.k('labelA'), kBars = P.k('bars'), kLB = P.k('labelB'), kTr = P.k('trays');
    const kCut = P.k('cut'), kDeal = P.k('deal'), kCount = P.k('count'), kReg = P.k('regroup');
    const fk = clamp(f.k ?? 0), dim = clamp(f.dim ?? 0) * fk, fcol = f.col ?? 'pick';
    const inFocusPiece = (i: number, j: number) => (f.pieces ?? []).some(([a, b]) => a === i && b === j);
    const anyPieceFocus = (f.pieces ?? []).length > 0;
    // group labels
    labelPulse(c, labelA, 'first', f.labelA ?? 0);
    labelPulse(c, labelB, 'second', f.labelB ?? 0);
    drawWords(c, TA, laX, laY, 'first', kLA, { size });
    drawWords(c, TB, lbX, lbY, 'second', kLB, { size });
    // trays: a teal napkin tray with a sharer mark and a dashed ghost of the whole bar(s)
    for (let j = 0; j < m.b; j++) {
      const T = trayBox(j), kt = E.smooth(lag(kTr, j, m.b, 0.4));
      if (kt <= 0) continue;
      const lift = (1 - kt) * 30, trayFocus = (f.trays ?? []).includes(j);
      withAlpha(c, kt * (trayFocus || !(f.trays ?? []).length ? 1 : 1 - dim * 0.6), () => {
        c.g.save(); c.g.translate(0, lift);
        wash(c, rectPts(T.x0, T.y0, T.w, T.h, 18), '#2C6E78', { seed: 300 + j, ink: DUSK.ink, inkW: 3, shade: 0.3 });
        sharerMark(c, T.x0 + ICON / 2 + 2, T.y0 + Math.min(T.h / 2, PAD + H / 2), j);
        for (let r = 0; r < m.rows; r++) ghostBar(c, rowBox(j, r), m.b);
        c.g.restore();
      });
      if (trayFocus && fk > 0 && f.ring !== false) focusRing(c, T, fcol, fk, 14);
    }
    // bars and pieces
    const pieceCut = kCut >= 1 || kDeal > 0;
    for (let i = 0; i < m.a; i++) {
      const B = barBox(i), kb = E.smooth(lag(kBars, i, m.a, 0.4));
      if (kb <= 0) continue;
      if (!pieceCut) {
        withAlpha(c, kb, () => {
          c.g.save(); c.g.translate(0, (1 - kb) * -24);
          granola(c, rectPts(B.x0, B.y0, B.w, B.h, 14), 100 + i, 1 - (anyPieceFocus ? dim * 0.6 : 0));
          // the cut lines draw on, bar by bar
          for (let j = 1; j < m.b; j++) {
            const kc = E.inOut(lag(kCut, i * (m.b - 1) + (j - 1), m.a * (m.b - 1), 0.5));
            if (kc <= 0) continue;
            const x = B.x0 + j * pw;
            inkLine(c, [[x, B.y0 - 10], [x, B.y0 - 10 + (B.h + 20) * kc]], { col: DUSK.cream, w: 4, seed: i * 10 + j, alpha: 0.9 });
          }
          c.g.restore();
        });
        continue;
      }
      // empty slots stay as faint outlines where the bar was
      if (kDeal > 0) inkLine(c, rectPts(B.x0, B.y0, B.w, B.h, 14), { col: DUSK.cream, w: 2, closed: true, alpha: 0.18 * Math.min(1, kDeal * 4), seed: 900 + i });
    }
    // pieces (after the cut): resting, moving, or dealt; moving pieces are drawn last (on top)
    if (pieceCut) {
      const N = m.deals.length, moving: [Deal, number][] = [];
      m.deals.forEach((d, idx) => {
        const kd = E.smooth(lag(kDeal, idx, N, 0.35));
        if (kd > 0 && kd < 1) moving.push([d, kd]); else drawPiece(d, kd);
      });
      for (const [d, kd] of moving) drawPiece(d, kd);
    }
    function drawPiece(d: Deal, kd: number): void {
      const A = pieceBox(d.bar, d.piece), Bx = dealtBox(d.bar, d.piece);
      const gap = 4 * Math.min(1, kCut);
      const x = lerp(A.x0, Bx.x0, kd), yy = lerp(A.y0, Bx.y0, kd) - Math.sin(Math.PI * kd) * 60;
      const focused = inFocusPiece(d.bar, d.piece) || ((f.trays ?? []).includes(d.tray) && kd >= 1 && !anyPieceFocus);
      const a = focused || fk === 0 ? 1 : 1 - dim * 0.65;
      granola(c, rectPts(x + gap / 2, yy, pw - gap, H, 10), 500 + d.bar * 13 + d.piece, a);
      if (inFocusPiece(d.bar, d.piece) && fk > 0) focusRing(c, box(x, yy, x + pw, yy + H), fcol, fk, 8);
    }
    // count: the share on tray 0 framed in lime
    if (kCount > 0) focusRing(c, slotsBox(ft), 'link', kCount, 10, 0.5);
    // regroup: the first row of tray 0 is one whole bar
    if (kReg > 0 && m.rows > 1) {
      const R = rowBox(ft, 0);
      focusRing(c, box(R.x0 - 2, R.y0 - 2, R.x1 + 2, R.y1 + 2), 'link', kReg, 8, 0.9);
    }
  }

  function labelPulse(c: Canvas, B: Box, col: 'first' | 'second', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save();
    g.globalAlpha *= clamp(k) * 0.9;
    g.fillStyle = paint(th, col, 'fill');
    g.globalAlpha *= 0.22;
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill();
    g.restore();
    focusRing(c, box(B.x0 - 8, B.y0 - 4, B.x1 + 8, B.y1 + 4), col, k, 14, 0.8);
  }
  function sharerMark(c: Canvas, cx: number, cy: number, j: number): void {
    // a simple head-and-shoulders mark (no character): the sharer this tray belongs to
    const col = paint(th, 'second', 'fill');
    wash(c, [[cx - 22, cy + 30], [cx - 20, cy + 10], [cx - 10, cy + 2], [cx + 10, cy + 2], [cx + 20, cy + 10], [cx + 22, cy + 30]], col, { seed: 700 + j, inkW: 2.5, rough: 1.2 });
    const head: Pt[] = Array.from({ length: 20 }, (_, i) => { const t = (i / 20) * Math.PI * 2; return [cx + Math.cos(t) * 13, cy - 14 + Math.sin(t) * 13] as Pt; });
    wash(c, head, col, { seed: 720 + j, inkW: 2.5, rough: 1 });
  }
  function ghostBar(c: Canvas, R: Box, n: number): void {
    const { g } = c;
    g.save();
    g.setLineDash([10, 9]); g.strokeStyle = 'rgba(239,230,247,0.42)'; g.lineWidth = 2.5;
    g.beginPath(); g.roundRect(R.x0, R.y0, R.w, R.h, 12); g.stroke();
    g.setLineDash([4, 10]); g.strokeStyle = 'rgba(239,230,247,0.22)';
    for (let j = 1; j < n; j++) { const x = R.x0 + (j * R.w) / n; g.beginPath(); g.moveTo(x, R.y0 + 8); g.lineTo(x, R.y1 - 8); g.stroke(); }
    g.restore();
  }
  function granola(c: Canvas, P: Pt[], seed: number, alpha: number): void {
    wash(c, P, brownie ? '#D9873A' : 'first', { seed, alpha, inkW: 3, shade: brownie ? 0.4 : 0.28 });
    // oat flecks, seeded and sparse (no digits ever sit on a bar)
    const xs = P.map(q => q[0]), ys = P.map(q => q[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const n = Math.round((x1 - x0) / 22);
    const { g } = c;
    g.save(); g.globalAlpha *= alpha * 0.55; g.fillStyle = brownie ? '#5A2E1A' : '#B9722A';
    for (let k = 0; k < n; k++) {
      const fx = x0 + 10 + (x1 - x0 - 20) * hashLocal(seed, k), fy = y0 + 12 + (y1 - y0 - 24) * hashLocal(seed + 1, k);
      g.beginPath(); g.ellipse(fx, fy, 5, 3, hashLocal(seed + 2, k) * 3, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  function focusRing(c: Canvas, R: Box, col: 'pick' | 'link' | 'first' | 'second', k: number, r: number, glow = 0.6): void {
    const { g } = c;
    g.save();
    g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 16 * glow * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 6, R.y0 - 6, R.w + 12, R.h + 12, r); g.stroke();
    g.restore();
  }

  const all = unionBox([barsAll, traysAll, labelA, labelB]);
  return {
    kind: 'EqualShare', maths: m, steps: EQUAL_SHARE_STEPS, box: all, focusTray: ft,
    where: { bars: barsAll, trays: traysAll, labelA, labelB, bar: barBox, piece: pieceBox, tray: trayBox, slots: slotsBox, row: rowBox, dealt: dealtBox },
    draw,
  };
}

function hashLocal(a: number, b: number): number {
  let h = Math.imul(a * 2654435761 ^ b * 40503, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
