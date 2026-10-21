// ScaleLines: a scale as aligned number lines (a double number line, the ratio table made visible).
//   card    a blueprint card on top: the scale written on it, and (step 'obj') the object drawn at the plan's own
//           size, left end on 0, so its length drops straight onto the drawing line
//   lines   row 0 = drawing lengths (amber), row 1 = actual lengths (teal), optional row 2 = the actual lengths in
//           another unit (teal, 'alt'). Every row has the same tick positions: tick i is i x step of that row, so ONE
//           position is one length read in every row. That is the whole idea of a scale.
//   ref     the reference pair (0 and tick 1 in rows 0 and 1, e.g. 1 in <-> 8 ft) labelled and glowing
//   nums    the other tick labels (dim). Thinned so they never touch; never shown where a marked value sits
//   down/up the two arrows in the right gutter: drawing -> actual (x 8) and back (/ 8), the same factor
//   conv    the arrows between row 1 and row 2 (/ 12: inches -> feet)
//   given   the given length: a bar from 0 along its row and its value; `drop` a dashed arrow straight to the asked
//           row; `ask` a '?' there, `answer` turns it into the value (lime)
//   wrong   a claimed (wrong) value on its own lane, `strike` crosses it out; `bench` a benchmark (door about 7 ft)
// The block CHECKS the maths: the given and the asked marks must sit at the same position (they are one length), so a
// wrong answer cannot be drawn as right. It throws BlockError when a label would leave the frame or two labels touch.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, arrow, strike, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { rectPts } from '../../../core/pts';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';
import { fmtT } from './scaleCalc';

export type LineStep = 'card' | 'obj' | 'lines' | 'ref' | 'nums' | 'down' | 'up' | 'alt' | 'conv' | 'given' | 'drop' | 'via' | 'ask' | 'answer' | 'wrong' | 'strike' | 'bench';
export const LINE_STEPS: readonly LineStep[] = ['card', 'lines', 'ref', 'down', 'up', 'nums', 'alt', 'conv', 'given', 'drop', 'via', 'ask', 'answer', 'obj', 'wrong', 'strike', 'bench'];
export interface LineRow { unit: string; step: number; col?: Paint }
export interface Mark { row: number; v: number; tex?: string }
export interface LinesParams {
  /** 2 or 3 rows: drawing, actual, (actual in another unit) */
  rows: LineRow[];
  /** major intervals on every row */
  n: number;
  /** minor ticks per major interval (2 = halves, 4 = quarters) */
  sub?: number;
  /** the scale written on the card (TeX); no tag and no obj = no card */
  tag?: string;
  /** the card's caption (default 'plan') */
  cap?: string;
  /** the object on the plan (drawn at the drawing's own size), length in row-0 units */
  obj?: { name: string; len: number };
  /** TeX on the arrows: [drawing -> actual, actual -> drawing] */
  ops?: [string, string];
  /** TeX on the arrows between rows 1 and 2 */
  conv?: [string, string];
  given?: Mark;
  ask?: Mark;
  /** a value on the middle row the drop passes on its way (3 rows), shown on 'via' */
  via?: Mark;
  wrong?: Mark;
  bench?: Mark & { name: string };
}
export interface LinesFocus {
  /** glow on the reference pair */
  ref?: number;
  /** glow on the down / up arrow */
  down?: number; up?: number;
  /** hide the tick labels of a row (practice: the kid computes, the line does not tell) */
  quietRow?: number;
}
export interface LinesBlock {
  readonly kind: 'ScaleLines';
  readonly where: { card: Box; tag: Box; obj: Box; row(i: number): Box; given: Box; ask: Box; via: Box; wrong: Box; bench: Box; down: Box; up: Box; conv: Box; dropVia: number };
  draw(c: Canvas, pr: { k(s: string): number }, f?: LinesFocus): void;
}

const NAME = 'ScaleLines';
const NUM = 60, WORD = 44, PAD = 20, LANE_GAP = 16, GAP01 = 210, GAP12 = 84, PAPER = '#1C3A70', GRIDC = '#4C6CAA';
const overlap = (a: Box, b: Box, g = 8) => a.x0 < b.x1 + g && b.x0 < a.x1 + g && a.y0 < b.y1 + g && b.y0 < a.y1 + g;
const inBox = (a: Box, b: Box) => a.x0 >= b.x0 - 0.5 && a.x1 <= b.x1 + 0.5 && a.y0 >= b.y0 - 0.5 && a.y1 <= b.y1 + 0.5;
interface Lbl { F: Formula; x: number; y: number; box: Box; size: number }
function place(src: string, cx: number, cy: number, size = NUM, anchor: 'center' | 'left' = 'center'): Lbl {
  const F = tex(src) as Formula;
  const b0 = texBox(F, 0, 0, { size, align: 'left' });
  const x = anchor === 'center' ? cx - b0.w / 2 - b0.x0 : cx - b0.x0;
  const y = cy - b0.cy;
  return { F, x, y, box: texBox(F, x, y, { size, align: 'left' }), size };
}
const texW = (src: string, size = NUM) => texBox(tex(src) as Formula, 0, 0, { size, align: 'left' }).w;

export function ScaleLines(p: LinesParams, fr: Frame): LinesBlock {
  const nr = p.rows.length, n = p.n, sub = p.sub ?? 1;
  check(nr === 2 || nr === 3, NAME, 'two or three rows');
  check(Number.isInteger(n) && n >= 2 && n <= 16, NAME, 'major intervals 2 to 16');
  for (const r of p.rows) check(r.step > 0, NAME, 'steps must be positive');
  const pos = (m: Mark) => m.v / p.rows[m.row]!.step;   // in major intervals
  for (const m of [p.given, p.ask, p.wrong, p.bench]) if (m) { check(m.row < nr, NAME, 'no such row'); check(pos(m) >= -1e-9 && pos(m) <= n + 1e-9, NAME, `${m.v} ${p.rows[m.row]!.unit} is off the line`); }
  // the maths: the given and the asked value are ONE length, so they sit at one position
  if (p.given && p.ask) check(Math.abs(pos(p.given) - pos(p.ask)) < 1e-6, NAME, `${p.given.v} and ${p.ask.v} are not the same length at this scale`);
  if (p.given && p.via) check(Math.abs(pos(p.given) - pos(p.via)) < 1e-6, NAME, `${p.via.v} is not the same length as ${p.given.v}`);
  if (p.obj) check(p.obj.len > 0 && p.obj.len <= n * p.rows[0]!.step + 1e-9, NAME, 'the object does not fit the line');

  // ---- horizontal: unit words left, the arrows and their labels right ----
  const unitW = Math.max(...p.rows.map(r => wordsBox(r.unit, 0, 0, { size: WORD, weight: 700 }).w));
  const opW = Math.max(0, ...[...(p.ops ?? []), ...(p.conv ?? [])].map(s => texW(s)));
  const xL = Math.round(fr.x + unitW + 46);
  // the last tick label sticks out past the line's end by half its width; the arrows stand clear of it
  const endHalf = Math.max(...p.rows.map(r => texW(fmtT(n * r.step)) / 2));
  const xR = Math.round(fr.x + fr.w - (opW ? endHalf + 28 + 30 + 26 + opW + 8 : endHalf + 10));
  const U = (xR - xL) / n;
  check(U >= 44, NAME, 'the ticks are too close');
  const X = (row: number, v: number) => xL + (v / p.rows[row]!.step) * U;

  // ---- vertical stack ----
  const lh = texBox(tex('80') as Formula, 0, 0, { size: NUM }).h;
  const hasCard = !!(p.tag || p.obj);
  const tagH = p.tag ? texBox(tex(p.tag) as Formula, 0, 0, { size: NUM }).h : 0;
  const OBJ_H = 58;
  const cardH = hasCard ? PAD + Math.max(tagH, WORD) + (p.obj ? 26 + OBJ_H : 0) + PAD : 0;
  const lane = lh + LANE_GAP;
  const extra = (row: number) => [p.wrong, p.bench].some(m => m && m.row === row);
  let h = (hasCard ? cardH + 30 : 0) + (extra(0) ? lane : 0) + lane + 14 + GAP01 + 14 + lane + (extra(1) ? lane : 0);
  if (nr === 3) h += GAP12 + 14 + lane + (extra(2) ? lane : 0);
  check(h <= fr.h, NAME, 'the lines do not fit');
  // spare height opens the gaps (calmer, bigger picture) instead of leaving the frame half empty
  const slack = fr.h - h;
  const g01 = GAP01 + Math.min(130, slack * 0.45), g12 = GAP12 + (nr === 3 ? Math.min(50, slack * 0.15) : 0), gc = 30 + (hasCard ? Math.min(50, slack * 0.15) : 0);
  h += (g01 - GAP01) + (nr === 3 ? g12 - GAP12 : 0) + (hasCard ? gc - 30 : 0);
  let y = fr.y + (fr.h - h) / 2;
  const card = box(xL - unitW - 30, y, xR + 24, y + cardH);
  if (hasCard) y += cardH + gc;
  const lineY: number[] = [];
  const laneY: number[] = [], extraY: number[] = [];
  // row 0: extra lane, tick lane, then the line (labels above it)
  if (extra(0)) { extraY[0] = y + lh / 2; y += lane; }
  laneY[0] = y + lh / 2; y += lane + 14;
  lineY[0] = y; y += g01; lineY[1] = y;
  y += 14 + LANE_GAP; laneY[1] = y + lh / 2; y += lh;
  if (extra(1)) { y += LANE_GAP; extraY[1] = y + lh / 2; y += lh; }
  if (nr === 3) {
    y += g12; lineY[2] = y;
    y += 14 + LANE_GAP; laneY[2] = y + lh / 2; y += lh;
    if (extra(2)) { y += LANE_GAP; extraY[2] = y + lh / 2; y += lh; }
  }

  // ---- labels ----
  const markTex = (m: Mark) => m.tex ?? fmtT(m.v);
  const given = p.given ? place(markTex(p.given), X(p.given.row, p.given.v), laneY[p.given.row]!) : null;
  const askQ = p.ask ? place('?', X(p.ask.row, p.ask.v), laneY[p.ask.row]!) : null;
  const askA = p.ask ? place(markTex(p.ask), X(p.ask.row, p.ask.v), laneY[p.ask.row]!) : null;
  const via = p.via ? place(markTex(p.via), X(p.via.row, p.via.v), laneY[p.via.row]!) : null;
  const wrong = p.wrong ? place(markTex(p.wrong), X(p.wrong.row, p.wrong.v), extraY[p.wrong.row]!) : null;
  const bench = p.bench ? place(`\\text{${p.bench.name} } ${markTex(p.bench)}`, X(p.bench.row, p.bench.v), extraY[p.bench.row]!) : null;
  // a label that would leave the line's ends slides inward (its value still points at the mark)
  for (const L of [given, askQ, askA, via, wrong, bench]) if (L) {
    const lo = xL - unitW * 0.2 - 20, hi = xR + 40;
    const sh = L.box.x0 < lo ? lo - L.box.x0 : L.box.x1 > hi ? hi - L.box.x1 : 0;
    if (sh) { L.x += sh; L.box = box(L.box.x0 + sh, L.box.y0, L.box.x1 + sh, L.box.y1); }
  }
  const marks: { row: number; b: Box; by: 'given' | 'ask' }[] = [];
  if (given) marks.push({ row: p.given!.row, b: given.box, by: 'given' });
  if (askQ && askA) marks.push({ row: p.ask!.row, b: askQ.box, by: 'ask' }, { row: p.ask!.row, b: askA.box, by: 'ask' });
  if (via) marks.push({ row: p.via!.row, b: via.box, by: 'ask' });
  // tick labels per row; the reference pair (0 and 1 in rows 0, 1) first, then every e-th one
  // a tick label under the given value comes back while the given value is not shown yet (a ruler to read);
  // one under the asked value never shows (it would give the answer away)
  const ticks: { row: number; i: number; L: Lbl; ref: boolean; hidden: boolean; givenOnly: boolean }[] = [];
  for (let r = 0; r < nr; r++) for (let i = 0; i <= n; i++) {
    const L = place(fmtT(i * p.rows[r]!.step), xL + i * U, laneY[r]!);
    const hit = marks.filter(m => m.row === r && overlap(m.b, L.box, 14));
    ticks.push({ row: r, i, L, ref: r < 2 && i <= 1, hidden: hit.length > 0, givenOnly: hit.length > 0 && hit.every(m => m.by === 'given') });
  }
  let every = 1;
  for (const e of [1, 2, 3, 4, 5, 6, 8, 10]) {
    every = e;
    const ok = [...Array(nr).keys()].every(r => {
      const vis = ticks.filter(t => t.row === r && !t.hidden && (t.i % e === 0 || t.ref));
      for (let a = 0; a + 1 < vis.length; a++) if (overlap(vis[a]!.L.box, vis[a + 1]!.L.box, 16)) {
        // a reference label may hide its crowded neighbour
        if (vis[a]!.ref && !vis[a + 1]!.ref) continue;
        return false;
      }
      return true;
    });
    if (ok) break;
  }
  for (const t of ticks) if (!t.ref && t.i % every !== 0) { t.hidden = true; t.givenOnly = false; }
  for (const t of ticks) if (!t.ref) { const r = ticks.find(o => o.ref && o.row === t.row && !o.hidden && o !== t && overlap(o.L.box, t.L.box, 16)); if (r) { t.hidden = true; t.givenOnly = false; } }

  // ---- arrows in the right gutter ----
  const ax = xR + endHalf + 28, ax2 = ax + 30, lx = ax2 + 26;
  const midY = (lineY[0]! + lineY[1]!) / 2;
  const opDown = p.ops ? place(p.ops[0], lx, midY - 44, NUM, 'left') : null;
  const opUp = p.ops ? place(p.ops[1], lx, midY + 44, NUM, 'left') : null;
  const mid12 = nr === 3 ? (lineY[1]! + lineY[2]!) / 2 : 0;
  const cvDown = nr === 3 && p.conv ? place(p.conv[0], lx, mid12 - 30, NUM, 'left') : null;
  const cvUp = nr === 3 && p.conv ? place(p.conv[1], lx, mid12 + 30, NUM, 'left') : null;
  if (cvDown && cvUp) check(!overlap(cvDown.box, cvUp.box, 4), NAME, 'the conversion labels touch');

  // ---- object on the card ----
  const objY0 = card.y0 + PAD + Math.max(tagH, WORD) + 26;
  const objB = p.obj ? box(xL, objY0, X(0, p.obj.len), objY0 + OBJ_H) : box(xL, objY0, xL, objY0);
  const objName = p.obj ? wordsBox(p.obj.name, 0, 0, { size: WORD, weight: 700 }) : null;
  const nameInside = !!objName && objName.w + 36 <= objB.w;
  const nameX = nameInside ? objB.cx : objB.x1 + 22;
  const cap = p.cap ?? 'plan', capW = wordsBox(cap, 0, 0, { size: WORD, weight: 700 }).w;
  const tag = p.tag ? place(p.tag, card.x0 + PAD + capW + 30, card.y0 + PAD + Math.max(tagH, WORD) / 2, NUM, 'left') : null;

  // ---- readability checks ----
  const frameBox = box(fr.x, fr.y, fr.x + fr.w, fr.y + fr.h);
  const named: [string, Box | undefined][] = [
    ['given value', given?.box], ['asked value', askA?.box], ['claim', wrong?.box], ['benchmark', bench?.box],
    ['arrow label', opDown?.box], ['arrow label (back)', opUp?.box], ['conversion label', cvDown?.box], ['conversion label (back)', cvUp?.box], ['scale tag', tag?.box],
  ];
  for (const [w, b] of named) if (b) check(inBox(b, frameBox), NAME, `the ${w} leaves the frame`);
  if (hasCard) check(inBox(card, frameBox), NAME, 'the card leaves the frame');
  if (tag) check(tag.box.x1 <= card.x1 - 10, NAME, 'the scale tag is wider than the card');
  if (p.obj && !nameInside) check(nameX + objName!.w <= card.x1 - 10, NAME, 'the object name leaves the card');
  const nb = named.filter((x): x is [string, Box] => !!x[1]);
  for (let i = 0; i < nb.length; i++) for (let j = i + 1; j < nb.length; j++) check(!overlap(nb[i]![1], nb[j]![1], 6), NAME, `the ${nb[i]![0]} runs into the ${nb[j]![0]}`);
  if (wrong && given) check(!overlap(wrong.box, given.box, 6), NAME, 'the claim runs into the given value');

  // ---------- drawing ----------
  const roleOf = (r: number): Paint => p.rows[r]!.col ?? (r === 0 ? 'first' : 'second');
  function lbl(c: Canvas, L: Lbl | null, k: number, col: Paint, pad = true): void {
    if (!L || k <= 0) return;
    const kk = E.smooth(clamp(k));
    if (pad) withAlpha(c, kk, () => { c.g.save(); c.g.fillStyle = DUSK.navy; c.g.globalAlpha *= 0.85; c.g.beginPath(); c.g.roundRect(L.box.x0 - 10, L.box.y0 - 8, L.box.w + 20, L.box.h + 16, 10); c.g.fill(); c.g.restore(); });
    texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'left', col, k: clamp(k) });
  }
  function bar(c: Canvas, row: number, v: number, col: Paint, k: number): void {
    if (k <= 0) return;
    const x1 = xL + (X(row, v) - xL) * E.out(clamp(k)), yy = lineY[row]!;
    if (x1 - xL < 2) return;
    withAlpha(c, 0.9, () => wash(c, rectPts(xL, yy - 9, x1 - xL, 18, 6), col, { seed: 30 + row, rough: 0.5, ink: null, shade: 0.1 }));
  }
  function dropSeg(c: Canvas, x: number, ya: number, yb: number, k: number, col: Paint, avoid: Box[]): void {
    if (k <= 0) return;
    const dir = Math.sign(yb - ya), end = ya + (yb - ya) * clamp(k);
    // skip label boxes on the way (a leader never runs through notation)
    let cur = ya;
    const cuts = avoid.filter(b => x > b.x0 - 6 && x < b.x1 + 6).map(b => dir > 0 ? [b.y0 - 8, b.y1 + 8] : [b.y1 + 8, b.y0 - 8]).sort((a, b) => dir * (a[0]! - b[0]!));
    for (const [s, e] of cuts) {
      if (dir * (s! - end) >= 0) break;            // this label lies beyond the end of the drop
      if (dir * (e! - cur) <= 0) continue;         // already passed
      if (dir * (s! - cur) > 0) strokePts(c, [[x, cur], [x, s!]], { col, lw: 5 });
      cur = e!;
    }
    if (dir * (end - cur) > 0) arrow(c, [[x, cur], [x, end]], 1, { col, lw: 5, head: 20 });
  }

  function draw(c: Canvas, pr: { k(s: string): number }, f: LinesFocus = {}): void {
    const k = (s: LineStep) => clamp(pr.k(s));
    // the card
    const kC = k('card');
    if (hasCard && kC > 0) withAlpha(c, E.smooth(kC), () => {
      wash(c, rectPts(card.x0, card.y0, card.w, card.h, 10), PAPER, { seed: 21, rough: 1.2, ink: DUSK.ink, inkW: 3, shade: 0.2 });
      const gu = U / sub;
      if (gu >= 16) {
        for (let gx = xL; gx < card.x1 - 4; gx += gu) strokePts(c, [[gx, card.y0 + 4], [gx, card.y1 - 4]], { col: GRIDC as Paint, lw: 1.3, alpha: 0.45 });
        for (let gx = xL - gu; gx > card.x0 + 4; gx -= gu) strokePts(c, [[gx, card.y0 + 4], [gx, card.y1 - 4]], { col: GRIDC as Paint, lw: 1.3, alpha: 0.45 });
        for (let gy = card.y1 - gu; gy > card.y0 + 4; gy -= gu) strokePts(c, [[card.x0 + 4, gy], [card.x1 - 4, gy]], { col: GRIDC as Paint, lw: 1.3, alpha: 0.45 });
      }
      const cy = card.y0 + PAD + Math.max(tagH, WORD) / 2;
      c.g.save(); c.g.fillStyle = PAPER; c.g.beginPath(); c.g.roundRect(card.x0 + PAD - 10, cy - WORD * 0.6, capW + 20, WORD * 1.2, 10); c.g.fill(); c.g.restore();
      drawWords(c, cap, card.x0 + PAD, cy, 'dim', 1, { size: WORD, weight: 700 });
      if (tag) lbl(c, tag, 1, 'ink');
    });
    const kO = k('obj');
    if (p.obj && kO > 0 && kC > 0) {
      const w = objB.w * E.out(kO);
      withAlpha(c, 0.85, () => wash(c, rectPts(objB.x0, objB.y0, Math.max(2, w), objB.h, 8), 'first', { seed: 44, rough: 0.8, ink: null, shade: 0.15 }));
      strokePts(c, rectPts(objB.x0, objB.y0, Math.max(2, w), objB.h, 8), { col: 'first', lw: 4, closed: true });
      if (kO > 0.7) drawWords(c, p.obj.name, nameX, objB.cy, nameInside ? DUSK.ink as Paint : 'first', (kO - 0.7) / 0.3, { size: WORD, weight: 700, align: nameInside ? 'center' : 'left' });
      // projection lines from the plan's ends down to the drawing line (they stop above its labels)
      const yb = laneY[0]! - lh / 2 - 12;
      for (const x of [objB.x0, objB.x1]) strokePts(c, [[x, objB.y1 + 6], [x, objB.y1 + 6 + (yb - objB.y1 - 6) * E.smooth(kO)]], { col: 'first', lw: 3, dash: [8, 8], alpha: 0.8 });
    }
    // the lines
    for (let r = 0; r < nr; r++) {
      const kl = r === 2 ? Math.min(k('lines'), k('alt')) : k('lines');
      if (kl <= 0) continue;
      const yy = lineY[r]!, col = roleOf(r), up = r === 0 ? -1 : 1;
      strokePts(c, [[xL, yy], [xL + (xR - xL) * E.smooth(kl), yy]], { col: 'ink', lw: 4 });
      for (let i = 0; i <= n; i++) {
        const x = xL + i * U;
        if (x > xL + (xR - xL) * kl + 1) break;
        strokePts(c, [[x, yy], [x, yy + up * 16]], { col: 'ink', lw: 3.5 });
        if (r === 0 && sub > 1 && i < n) for (let s = 1; s < sub; s++) { const xs = x + (s * U) / sub; strokePts(c, [[xs, yy], [xs, yy - (s * 2 === sub ? 11 : 7)]], { col: 'ink', lw: 2.5, alpha: 0.85 }); }
      }
      drawWords(c, p.rows[r]!.unit, xL - 30, yy, col, kl, { size: WORD, weight: 700, align: 'right' });
    }
    // the reference pair and the tick labels
    const kRef = k('ref'), kN = k('nums'), kAlt = k('alt');
    const kG0 = k('given');
    for (const t of ticks) {
      if ((t.hidden && !(t.givenOnly && kG0 <= 0)) || f.quietRow === t.row && !t.ref) continue;
      const kk = t.ref ? kRef : (t.row === 2 ? Math.min(kN, kAlt) : kN);
      if (t.row === 2 && t.ref === false && kAlt <= 0) continue;
      lbl(c, t.L, kk, t.ref ? roleOf(t.row) : 'dim', false);
    }
    if (nr === 3 && kAlt > 0) for (const t of ticks) if (t.row === 2 && t.i <= 1 && !t.hidden) lbl(c, t.L, kAlt, roleOf(2), false);
    if ((f.ref ?? 0) > 0 && kRef > 0) {
      const g = E.smooth(clamp(f.ref!)), x = xL + U;
      strokePts(c, [[x, lineY[0]! + 22], [x, lineY[1]! - 22]], { col: 'pick', lw: 6, glow: 12, alpha: g });
    }
    // arrows: drawing -> actual and back
    const kD = k('down'), kU = k('up');
    if (kD > 0) { arrow(c, [[ax, lineY[0]! + 14], [ax, lineY[1]! - 14]], E.smooth(kD), { col: 'pick', lw: 5, head: 20, glow: (f.down ?? 0) * 14 }); lbl(c, opDown, kD, 'pick', false); }
    if (kU > 0) { arrow(c, [[ax2, lineY[1]! - 14], [ax2, lineY[0]! + 14]], E.smooth(kU), { col: 'pick', lw: 5, head: 20, glow: (f.up ?? 0) * 14 }); lbl(c, opUp, kU, 'pick', false); }
    const kCv = k('conv');
    if (nr === 3 && kCv > 0 && p.conv) {
      arrow(c, [[ax, lineY[1]! + 14], [ax, lineY[2]! - 14]], E.smooth(kCv), { col: 'pick', lw: 5, head: 18 });
      arrow(c, [[ax2, lineY[2]! - 14], [ax2, lineY[1]! + 14]], E.smooth(kCv), { col: 'pick', lw: 5, head: 18 });
      lbl(c, cvDown, kCv, 'pick', false); lbl(c, cvUp, kCv, 'pick', false);
    }
    // the given length, the drop, the asked length
    const kG = k('given'), kDr = k('drop'), kQ = k('ask'), kA = k('answer');
    if (p.given && kG > 0) {
      const r = p.given.row, x = X(r, p.given.v);
      bar(c, r, p.given.v, roleOf(r), kG);
      strokePts(c, [[x, lineY[r]! - 20], [x, lineY[r]! + 20]], { col: roleOf(r), lw: 6, alpha: E.smooth(kG) });
      lbl(c, given, kG, roleOf(r));
    }
    if (p.given && p.ask && kDr > 0) {
      const x = X(p.given.row, p.given.v), ya = lineY[p.given.row]!, yb = lineY[p.ask.row]!, dir = Math.sign(yb - ya);
      const avoid = [given?.box, askQ?.box, via?.box, ...ticks.filter(t => !t.hidden).map(t => t.L.box)].filter((b): b is Box => !!b);
      dropSeg(c, x, ya + dir * 24, yb - dir * 24, kDr, 'link', avoid);
    }
    const kV = k('via');
    if (p.via && via && kV > 0) {
      const r = p.via.row, x = X(r, p.via.v);
      bar(c, r, p.via.v, roleOf(r), kV);
      strokePts(c, [[x, lineY[r]! - 20], [x, lineY[r]! + 20]], { col: roleOf(r), lw: 6, alpha: E.smooth(kV) });
      lbl(c, via, kV, roleOf(r));
    }
    if (p.ask && (kQ > 0 || kA > 0)) {
      const r = p.ask.row, x = X(r, p.ask.v);
      if (kA > 0) bar(c, r, p.ask.v, 'link', kA);
      strokePts(c, [[x, lineY[r]! - 20], [x, lineY[r]! + 20]], { col: 'link', lw: 6, alpha: E.smooth(Math.max(kQ, kA)) });
      if (kA < 1) lbl(c, askQ, kQ * (1 - kA), 'link');
      lbl(c, askA, kA, 'link');
    }
    // a claim and its strike, a benchmark
    const kW = k('wrong'), kS = k('strike'), kB = k('bench');
    if (p.wrong && wrong && kW > 0) {
      const r = p.wrong.row, x = X(r, p.wrong.v), yy = lineY[r]!;
      strokePts(c, [[x, yy - 22], [x, yy + 22]], { col: 'wrong', lw: 6, alpha: E.smooth(kW) });
      const towards = r === 0 ? wrong.box.y1 + 6 : wrong.box.y0 - 6;
      strokePts(c, [[x, r === 0 ? yy - 26 : yy + 26], [x, towards]], { col: 'wrong', lw: 3, dash: [6, 7], alpha: E.smooth(kW) * 0.8 });
      lbl(c, wrong, kW, 'wrong');
      if (kS > 0) strike(c, wrong.box.x0 - 10, wrong.box.y1 + 2, wrong.box.x1 + 10, wrong.box.y0 - 2, kS, { col: 'wrong' });
    }
    if (p.bench && bench && kB > 0) {
      const r = p.bench.row, x = X(r, p.bench.v), yy = lineY[r]!;
      strokePts(c, [[x, yy - 22], [x, yy + 22]], { col: 'pick', lw: 6, alpha: E.smooth(kB) });
      lbl(c, bench, kB, 'pick');
    }
  }

  /** the drop's progress at which it reaches the via row (it starts and ends 24 px off the lines) */
  function dropFrac(ya: number, yb: number, yv: number): number { const dir = Math.sign(yb - ya), a = ya + dir * 24, b = yb - dir * 24; return clamp((yv - a) / (b - a)); }
  const rowBox = (i: number) => box(xL, lineY[i]! - 24, xR, lineY[i]! + 24);
  const none = box(xL, lineY[0]!, xL, lineY[0]!);
  return {
    kind: 'ScaleLines',
    where: {
      card, tag: tag?.box ?? card, obj: objB, row: rowBox,
      given: given?.box ?? none, ask: askA?.box ?? none, via: via?.box ?? none, wrong: wrong?.box ?? none, bench: bench?.box ?? none,
      down: opDown?.box ?? none, up: opUp?.box ?? none, conv: cvDown?.box ?? none,
      dropVia: p.given && p.ask && p.via ? dropFrac(lineY[p.given.row]!, lineY[p.ask.row]!, lineY[p.via.row]!) : 1,
    },
    draw,
  };
}
