// DivisionLadder: a fraction n/d turned into its decimal by long division, the model of this topic.
//   strip   a row of digit cells (the ones place, the point, six places after it). Each digit drops into its cell
//           as the ladder makes it, so place value is visible: the 4th cell IS the ten-thousandths place.
//   ladder  one line per step: "40 ÷ 6 = 6", the digit, and the remainder in a ring. The remainder times 10 is the
//           next line's amount (amber both times), so the kid sees what drives the next digit.
//   stop    remainder 0: the division stops, every later cell is 0 ('zeros'): a terminating decimal.
//   loop    a remainder comes back: both rings light up and a loop arrow joins them. From there the same lines, so
//           the same digits, come again forever ('more' fills the cells, 'groups' brackets each repeating block).
//   shift   × 100 for a percent: the point slides two cells right, a % appears, leading zeros fade, and the
//           repeating blocks are read again from the new point (7/22: 0.3|18|18 → 31.|81|81 %).
// Colours: the amount being divided (n, each 10 × remainder, the remainders) amber = first; the divisor teal =
// second; the digits of the answer lime = link; the repeat (rings, loop, block brackets) lavender = pick.
// Steps: cells, digits (strip only: the digits drop in), row0..row5, stop, loop, more, zeros, groups, shift. `where` has boxes for annotation leaders; the
// right-most parts are the remainder rings, the strip's end and the brackets, so leaders from the board never cross it.
import { type Box, type Pt, box, clamp, lerp, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { type LongDiv, digitAt, longDivide } from './fdpMaths';

export interface LadderParams {
  n: number; d: number;
  /** rows to compute past a repeat (the proof writes 0.333 and shows the remainder still there) */ extra?: number;
  /** false: the digit strip only, centred in the frame (decimal ↔ percent items) */ ladder?: boolean;
  /** fraction cells in the strip (default 6) */ cells?: number;
  /** show at most this many ladder rows (row 0 included); the rest are not drawn */ maxRows?: number;
}
export type LadderStep = 'cells' | 'digits' | 'row0' | 'row1' | 'row2' | 'row3' | 'row4' | 'row5' | 'stop' | 'loop' | 'more' | 'zeros' | 'groups' | 'shift';
export const LADDER_STEPS: readonly LadderStep[] = ['cells', 'digits', 'row0', 'row1', 'row2', 'row3', 'row4', 'row5', 'stop', 'loop', 'more', 'zeros', 'groups', 'shift'];
export const rowStep = (i: number): LadderStep => `row${i}` as LadderStep;
type Col = 'pick' | 'link' | 'first' | 'second' | 'wrong';
export interface LadderFocus {
  /** ring these remainders (row indexes) */ rems?: readonly number[];
  /** ring these cells (0 = ones, j = j-th place after the point) */ cells?: readonly number[];
  k?: number; col?: Col;
  /** pulses 0..1: a symbol on the board and its part of the picture light up together */
  pStrip?: number; pGroups?: number; pRem?: number; pRemRow?: number; pPct?: number;
}
export interface LadderBlock {
  readonly kind: 'DivisionLadder';
  readonly L: LongDiv;
  readonly box: Box;
  /** rows drawn (row 0 included) */ readonly nRows: number;
  readonly where: {
    cell(j: number): Box; strip: Box; tail: Box; pct: Box;
    groups: Box; groupsAfter: Box;
    row(i: number): Box; digit(i: number): Box; rem(i: number): Box; amount(i: number): Box;
    ladder: Box;
  };
  draw(c: Canvas, p: Progress<LadderStep>, focus?: LadderFocus): void;
}

const NAME = 'DivisionLadder';
const CW = 88, CH = 112, GAP = 22, DIG = 72, ROWT = 64, ROW_H = 104, REM = 60, WORD = 44;

export function DivisionLadder(p: LadderParams, fr: Frame, th: Theme): LadderBlock {
  check(Number.isInteger(p.n) && Number.isInteger(p.d) && p.n >= 0 && p.d >= 1, NAME, `${p.n}/${p.d} is not a nonnegative fraction`);
  const L = longDivide(p.n, p.d, p.extra ?? 0);
  const C = p.cells ?? 6, showLadder = p.ladder ?? true;
  check(L.whole <= 9, NAME, `the whole part ${L.whole} needs more than one cell`);
  const nRows = Math.min(L.rows.length, p.maxRows ?? 99, showLadder ? 99 : C + 1);
  check(!showLadder || nRows <= 6, NAME, `${p.n}/${p.d} needs ${L.rows.length} ladder rows; the frame holds 6`);
  check(nRows - 1 <= C, NAME, 'more ladder rows than digit cells');
  const F = (s: string) => tex(s) as Formula;

  // ---------- the strip ----------
  const left = fr.x + 30;
  const stripTop = showLadder ? fr.y + 24 : fr.y + fr.h / 2 - CH / 2 - 40;
  const cellX = (j: number) => left + j * (CW + GAP);
  const cellBox = (j: number) => box(cellX(j), stripTop, cellX(j) + CW, stripTop + CH);
  const cy = stripTop + CH / 2;
  const tailX = cellX(C) + CW + 14;            // the "…" after the last cell
  const tail = box(tailX, cy - 10, tailX + 52, cy + 30);
  const PCT = F('\\%');
  const pctBox = texBox(PCT, tail.x1 + 12, cy, { size: DIG, align: 'left' });
  check(pctBox.x1 <= fr.x + fr.w + 0.5, NAME, `the strip needs ${Math.round(pctBox.x1 - fr.x)} px, the frame has ${fr.w}`);
  const pointX = (after: number) => cellX(after) + CW + GAP / 2;
  const pointY = cy + 30;
  const digitF = Array.from({ length: C + 1 }, (_, j) => F(String(j === 0 ? L.whole : digitAt(L, j))));
  const rowsDigit = (j: number) => j <= nRows - 1;     // cell j is filled by a drawn ladder row
  // repeating blocks: before the shift from the block start, after it from the first place after the new point
  const s0 = L.pre.length + 1, per = L.rep.length;
  const groupsFrom = (start: number) => {
    const out: [number, number][] = [];
    if (!per) return out;
    for (let a = start; a + per - 1 <= C; a += per) out.push([a, a + per - 1]);
    return out;
  };
  const G0 = groupsFrom(s0);
  // after the shift the point sits after cell 2; the repeating tail from max(s0, 3), still in blocks of `per`
  const G1 = groupsFrom(Math.max(s0, 3));
  const brY = stripTop + CH + 12;
  const gBox = (G: [number, number][]) => G.length ? box(cellX(G[0]![0]) + 4, brY, cellX(G[G.length - 1]![1]) + CW - 4, brY + 22) : box(cellX(1), brY, cellX(1), brY + 22);
  // leading zeros after the shift (0.0825 → 08.25 %): cells before the new ones place that are all 0 so far
  const fadeAfter = (j: number) => { if (j >= 2) return false; for (let i = 0; i <= j; i++) if ((i === 0 ? L.whole : digitAt(L, i)) !== 0) return false; return true; };

  // ---------- the ladder ----------
  const ladTop = stripTop + CH + 120;
  const rowY = (i: number) => ladTop + ROW_H / 2 + i * ROW_H;
  const colEq = left + 400, colQ = left + 470, colR = left + 680;
  const rowsF = L.rows.slice(0, nRows).map(w => ({
    A: F(`\\cssId{x}{${w.x}} \\div \\cssId{d}{${p.d}} =`), Q: F(String(w.q)), R: F(String(w.r)),
  }));
  const amountBox = (i: number) => texBox(rowsF[i]!.A, colEq, rowY(i), { size: ROWT, align: 'right' }, 'x');
  const digitBox = (i: number) => texBox(rowsF[i]!.Q, colQ, rowY(i), { size: ROWT, align: 'center' });
  const remText = (i: number) => texBox(rowsF[i]!.R, colR, rowY(i), { size: REM, align: 'center' });
  const remBox = (i: number) => { const t = remText(i), w = Math.max(84, t.w + 40); return box(colR - w / 2, rowY(i) - 42, colR + w / 2, rowY(i) + 42); };
  const rowBox = (i: number) => unionBox([texBox(rowsF[i]!.A, colEq, rowY(i), { size: ROWT, align: 'right' }), digitBox(i), remBox(i)]);
  if (showLadder) {
    check(rowY(nRows - 1) + ROW_H / 2 <= fr.y + fr.h + 0.5, NAME, `the ladder needs ${Math.round(rowY(nRows - 1) + ROW_H / 2 - fr.y)} px, the frame has ${fr.h}`);
    for (let i = 0; i < nRows; i++) check(texBox(rowsF[i]!.A, colEq, rowY(i), { size: ROWT, align: 'right' }).x0 >= fr.x, NAME, 'a ladder line is too wide');
    check(remBox(0).x1 + 150 <= fr.x + fr.w + 0.5, NAME, 'no room for the loop arrow');
  }
  const hdQ = wordsBox('digit', colQ, ladTop - 30, { size: WORD, align: 'center' });
  const hdR = wordsBox('remainder', colR, ladTop - 30, { size: WORD, align: 'center' });
  check(!showLadder || hdQ.x1 + 20 < hdR.x0, NAME, 'the ladder headers collide');
  const ladder = showLadder ? unionBox([hdQ, hdR, ...Array.from({ length: nRows }, (_, i) => rowBox(i))]) : box(left, stripTop, left, stripTop);
  const loopFrom = L.stop === 'repeat' && L.from < nRows && L.at < nRows ? L.from : -1;

  const fill = (r: Col | 'first') => paint(th, r, 'fill');
  const strip = unionBox([cellBox(0), cellBox(C), tail]);

  function draw(c: Canvas, P: Progress<LadderStep>, f: LadderFocus = {}): void {
    const kCells = P.k('cells'), kStop = P.k('stop'), kLoop = P.k('loop'), kMore = P.k('more'), kZeros = P.k('zeros');
    const kGroups = P.k('groups'), kShift = P.k('shift');
    const kRow = (i: number) => (i < nRows ? P.k(rowStep(i)) : 0);
    const fk = clamp(f.k ?? 0), fcol = f.col ?? 'pick';

    // ----- the strip: cells, digits, the point -----
    if (kCells > 0) {
      withAlpha(c, E.smooth(kCells), () => {
        for (let j = 0; j <= C; j++) {
          const b = cellBox(j);
          wash(c, rectPts(b.x0, b.y0, b.w, b.h, 12), DUSK.panel, { seed: 300 + j, rough: 1.2, ink: '#4A4F80', inkW: 2.5, shade: 0.12 });
        }
      });
      pulseBox(c, strip, 'link', f.pStrip ?? 0);
      for (let j = 0; j <= C; j++) {
        const b = cellBox(j);
        // where this digit comes from: its ladder row, or the pattern ('more' for a repeat, 'zeros' after a stop)
        let k = 0, faint = false;
        if (rowsDigit(j) && showLadder) k = kRow(j);
        // strip only: the digits, plus the zeros up to the hundredths so 3.5 reads 350 % after the shift
        else if (!showLadder && (rowsDigit(j) || (j <= 2 && L.stop === 'zero'))) k = P.k('digits');
        else if (L.stop === 'repeat') { k = kMore; faint = true; }
        else { k = kZeros; faint = true; }
        if (k <= 0) continue;
        const fade = fadeAfter(j) ? 1 - 0.75 * kShift : 1;
        texDraw(c, digitF[j]!, b.cx, cy, { size: DIG, align: 'center', col: faint ? 'dim' : j === 0 && L.whole === 0 ? 'dim' : 'link', k, alpha: (faint ? 0.75 : 1) * fade });
      }
      // the point
      const px = lerp(pointX(0), pointX(2), E.inOut(kShift));
      c.g.save(); c.g.globalAlpha *= E.smooth(kCells); c.g.fillStyle = paint(th, 'ink', 'fill');
      c.g.beginPath(); c.g.arc(px, pointY, 9, 0, Math.PI * 2); c.g.fill(); c.g.restore();
      // the "…": the digits go on (repeat), or only zeros go on (terminating)
      const kTail = L.stop === 'repeat' ? kMore : kZeros;
      if (kTail > 0) for (let i = 0; i < 3; i++) {
        c.g.save(); c.g.globalAlpha *= clamp(kTail * 3 - i); c.g.fillStyle = paint(th, 'dim', 'fill');
        c.g.beginPath(); c.g.arc(tail.x0 + 8 + i * 18, pointY, 5.5, 0, Math.PI * 2); c.g.fill(); c.g.restore();
      }
      if (kShift > 0.5) texDraw(c, PCT, pctBox.x0, cy, { size: DIG, align: 'left', col: 'link', k: clamp(kShift * 2 - 1) });
      pulseBox(c, pctBox, 'link', f.pPct ?? 0);
      // repeating blocks: brackets under the cells, read again after the shift
      if (kGroups > 0 && per) {
        brackets(c, G0, kGroups * (1 - E.inOut(clamp(kShift * 1.6))));
        brackets(c, G1, kGroups * E.inOut(clamp(kShift * 1.6 - 0.6)));
      }
      pulseBox(c, kShift > 0.5 ? gBox(G1) : gBox(G0), 'pick', f.pGroups ?? 0);
      if (f.cells && fk > 0) for (const j of f.cells) ring(c, cellBox(j), fcol, fk, 14);
    }

    // ----- the ladder -----
    if (showLadder) {
      const kHead = kRow(0);
      if (kHead > 0) {
        drawWords(c, 'digit', colQ, ladTop - 30, 'dim', kHead, { size: WORD, align: 'center' });
        drawWords(c, 'remainder', colR, ladTop - 30, 'dim', kHead, { size: WORD, align: 'center' });
      }
      for (let i = 0; i < nRows; i++) {
        const k = kRow(i);
        if (k <= 0) continue;
        const y = rowY(i), R = rowsF[i]!;
        texDraw(c, R.A, colEq, y, { size: ROWT, align: 'right', k: clamp(k * 1.6), tags: { x: { col: 'first' }, d: { col: 'second' } } as never });
        texDraw(c, R.Q, colQ, y, { size: ROWT, align: 'center', col: 'link', k: clamp(k * 1.6 - 0.4) });
        const rb = remBox(i), kr = clamp(k * 1.6 - 0.6);
        if (kr > 0) {
          const zero = L.rows[i]!.r === 0;
          withAlpha(c, E.smooth(kr), () => {
            wash(c, rectPts(rb.x0, rb.y0, rb.w, rb.h, rb.h / 2), zero ? 'link' : 'first', { seed: 400 + i, rough: 1, ink: null, lift: 0.0, alpha: 0.22, shade: 0 });
            inkLine(c, rectPts(rb.x0, rb.y0, rb.w, rb.h, rb.h / 2), { col: zero ? paint(th, 'link', 'line') : paint(th, 'first', 'line'), w: 3, closed: true, seed: 410 + i, rough: 0.5 });
          });
          texDraw(c, R.R, colR, y, { size: REM, align: 'center', col: zero ? 'link' : 'first', k: kr });
        }
      }
      // the stop: remainder 0 rings in lime
      if (L.stop === 'zero' && L.at < nRows && kStop > 0) ring(c, remBox(L.at), 'link', kStop, 42);
      // the repeat: both remainders ring, a loop arrow from the later one back up to the earlier one
      if (loopFrom >= 0 && kLoop > 0) {
        const a = remBox(L.at), b = remBox(loopFrom);
        ring(c, a, 'pick', kLoop, 42); ring(c, b, 'pick', kLoop, 42);
        const x = Math.max(a.x1, b.x1) + 12, bulge = 92;
        const pts: Pt[] = [];
        for (let s = 0; s <= 32; s++) {
          const t = s / 32, u = 1 - t;
          const P0: Pt = [a.x1 + 12, a.cy], P1: Pt = [x + bulge, a.cy], P2: Pt = [x + bulge, b.cy], P3: Pt = [b.x1 + 16, b.cy];
          pts.push([u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]);
        }
        arrow(c, pts, E.inOut(kLoop), { col: 'pick', lw: 5, head: 22 });
      }
      if (f.rems && fk > 0) for (const i of f.rems) if (i < nRows) ring(c, remBox(i), fcol, fk, 42);
      if (f.pRem) pulseBox(c, remBox(Math.min(nRows - 1, f.pRemRow ?? nRows - 1)), 'first', f.pRem);
    }
  }

  function brackets(c: Canvas, G: [number, number][], k: number): void {
    if (k <= 0) return;
    G.forEach(([a, b], i) => {
      const x0 = cellX(a) + 6, x1 = cellX(b) + CW - 6;
      const P: Pt[] = [[x0, brY], [x0, brY + 16], [x1, brY + 16], [x1, brY]];
      withAlpha(c, clamp(k * 1.4 - i * 0.15), () => inkLine(c, P, { col: paint(th, 'pick', 'fill'), w: 5, seed: 500 + a, rough: 0.4 }));
    });
  }
  function pulseBox(c: Canvas, B: Box, col: Col | 'first', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.18; g.fillStyle = fill(col);
    g.beginPath(); g.roundRect(B.x0 - 12, B.y0 - 10, B.w + 24, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 6, B.y0 - 4, B.x1 + 6, B.y1 + 4), col, k, 14, 0.8);
  }
  function ring(c: Canvas, R: Box, col: Col | 'first', k: number, r: number, glow = 0.6): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = fill(col); g.lineWidth = 5;
    g.shadowColor = fill(col); g.shadowBlur = 16 * glow * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 6, R.y0 - 6, R.w + 12, R.h + 12, Math.min(r, (R.h + 12) / 2)); g.stroke(); g.restore();
  }

  return {
    kind: 'DivisionLadder', L, nRows,
    box: unionBox([strip, pctBox, ladder]),
    where: {
      cell: cellBox, strip, tail, pct: pctBox, groups: gBox(G0), groupsAfter: gBox(G1),
      row: rowBox, digit: digitBox, rem: remBox, amount: amountBox, ladder,
    },
    draw,
  };
}
