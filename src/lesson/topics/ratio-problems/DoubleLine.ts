// DoubleLine: the model of "ratio problems with fractions and decimals". A double number line: the first quantity
// (amber tape) above, the second (teal tape) below, on ONE scale so that every pair lines up on one vertical tick.
// Because the pairs line up, multiplying one quantity by a number moves the other by the SAME number, whole or not.
//   rails      both number lines and their names draw on
//   given      the given pair: both tapes grow from 0 to the pair, the tick and its two values
//   target     the target tick across both lines: the known value and a ? for the missing one
//   cut        the given tapes are cut into `cut` equal pieces (the building block: divide both by the same number);
//              the first piece's two values write on
//   count      `count` pieces are counted off (lit one by one; extra pieces pop in past the given): multiply both
//   unit       the tick at 1 on the first line and the rate (second per one first) on the second
//   arc{i}     a between-pairs arc on BOTH lines with the same label (× 3/2, ÷ 2, × 3): the multiplier, no unit
//   within{i}  a within-pair arrow from the first line down to the second at a pair, labelled with the rate (unit)
//   claim/fix  a wrong claim for the missing value sits at its own place on its line (red): it does not line up
//   fill       the ? turns into the missing value (link colour)
// Pure maths in computeDL() (exact rationals) and a pure layout (planDL with a measure function), so the tests check
// that every practice picture fits; the block throws BlockError instead of drawing something unreadable.
import { type Box, box, clamp, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, arrow, dashLine, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check, frame } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { type Q, Qv, fmt, missing, qDiv, qEq, qLess, qMul, qNum, rat, rateOf } from './ratioMaths';

const NAME = 'DoubleLine';
export const NUM = 60, LAB = 44;
/** the model's frame on the lesson canvas (left of the board) */
export const DL_FRAME = frame(60, 70, 1120, 940);

export type At = 'zero' | 'given' | 'target' | 'piece' | 'unit';
export interface ArcSpec { from: At; to: At; label: string }
export interface WithinSpec { at: 'given' | 'target' | 'unit'; label: string }
export interface DLSpec {
  top: { name: string; money?: boolean };
  bot: { name: string; money?: boolean };
  given: readonly [number | Q, number | Q];
  /** the target pair: one known value, one null (the missing value, shown as ? until fill) */
  target: readonly [number | Q | null, number | Q | null];
  /** cut the given into `cut` equal pieces; the target is `count` of them */
  pieces?: { cut: number; count: number } | null;
  unit?: boolean;
  arcs?: readonly ArcSpec[];
  within?: readonly WithinSpec[];
  /** a wrong claim for the missing value (drawn in red at its own place on its line) */
  claim?: number | Q | null;
  /** the text the missing value shows after fill (default: its exact value) */
  fillText?: string;
}

// ---------- maths ----------
export interface DLMaths {
  gA: Q; gB: Q; tA: Q; tB: Q;
  /** which line holds the missing value */
  miss: 'top' | 'bot';
  /** second per one first (the rate within a pair) */
  rate: Q;
  /** the multiplier between the pairs (target ÷ given), the same on both lines */
  mult: Q;
  /** one piece (given ÷ cut) on each line, if cut */
  pA: Q | null; pB: Q | null;
  claim: Q | null;
}
export function computeDL(S: Pick<DLSpec, 'given' | 'target' | 'pieces' | 'claim'>): DLMaths {
  const gA = Qv(S.given[0]), gB = Qv(S.given[1]);
  check(gA.p > 0 && gB.p > 0, NAME, 'the given pair is two positive values');
  const [ta, tb] = S.target;
  check((ta === null) !== (tb === null), NAME, 'the target pair has exactly one missing value');
  const miss = tb === null ? 'bot' : 'top';
  const tA = ta === null ? missing(gB, gA, tb!) : Qv(ta), tB = tb === null ? missing(gA, gB, ta!) : Qv(tb);
  check(tA.p > 0 && !qEq(tA, gA), NAME, 'the target differs from the given pair');
  const mult = qDiv(tA, gA);
  check(qEq(mult, qDiv(tB, gB)), NAME, 'the target pair keeps the ratio');
  let pA: Q | null = null, pB: Q | null = null;
  if (S.pieces) {
    const { cut, count } = S.pieces;
    check(Number.isInteger(cut) && Number.isInteger(count) && cut >= 1 && count >= 1 && cut <= 24 && count <= 24, NAME, 'pieces: 1 to 24 whole pieces');
    pA = qDiv(gA, rat(cut)); pB = qDiv(gB, rat(cut));
    check(qEq(qMul(pA, rat(count)), tA), NAME, `the target is not ${count} pieces of ${fmt(pA)}`);
  }
  const claim = S.claim === undefined || S.claim === null ? null : Qv(S.claim);
  if (claim) check(claim.p > 0 && !qEq(claim, miss === 'bot' ? tB : tA), NAME, 'a claim is a wrong positive value');
  return { gA, gB, tA, tB, miss, rate: rateOf(gA, gB), mult, pA, pB, claim };
}

// ---------- layout (pure: a measure function gives text widths) ----------
export type Measure = (t: string, size: number, weight?: number) => number;
/** a generous estimate for tests (no canvas in node) */
export const roughMeasure: Measure = (t, size) => [...t].reduce((w, ch) => w + size * (/[0-9$.?]/.test(ch) ? 0.58 : /[il1.,'|/]/.test(ch) ? 0.34 : /[mwMW×÷]/.test(ch) ? 0.88 : /[A-Z]/.test(ch) ? 0.68 : /\s/.test(ch) ? 0.3 : 0.56), 0);

export interface Lab { t: string; x: number; y: number; size: number; align: 'left' | 'center' | 'right'; b: Box }
export interface Mark { at: At; v: Q; x: number; top: Lab | null; bot: Lab | null }
export interface ArcGeom { spec: ArcSpec; x0: number; x1: number; lane: number; bul: number; yTop: number; yBot: number; labT: Lab; labB: Lab }
export interface WithinGeom { spec: WithinSpec; x: number; y0: number; y1: number; lab: Lab }
export interface DLLayout {
  m: DLMaths;
  x0: number; x1: number; sTop: number; sBot: number;
  yTL: number; yTB0: number; yTB1: number; yBB0: number; yBB1: number; yBL: number;
  names: [Lab, Lab];
  marks: Mark[];
  pieceXs: number[];
  arcs: ArcGeom[]; within: WithinGeom[];
  claim: { x: number; lab: Lab } | null;
  fillLab: Lab;
  box: Box;
}
const BH = 46, GAP = 210, LANE = 72;

export function planDL(S: DLSpec, fr: Frame, measure: Measure): DLLayout {
  const m = computeDL(S);
  const lab = (t: string, x: number, y: number, size: number, align: Lab['align'] = 'center', weight = 650): Lab => {
    const w = measure(t, size, weight), x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    return { t, x, y, size, align, b: box(x0, y - size * 0.42, x0 + w, y + size * 0.42) };
  };
  for (const n of [S.top.name, S.bot.name]) check(n.trim().length > 0 && n.length <= 12, NAME, `a line name is 1 to 12 letters ("${n}")`);
  const nameW = Math.max(measure(S.top.name, LAB, 650), measure(S.bot.name, LAB, 650));
  const fx0 = fr.x, fx1 = fr.x + fr.w;
  const x0 = fx0 + nameW + 64, x1 = fx1 - 24, xEnd = x1 - 104;
  // the scale: the largest first value on the picture fits before the arrow head
  const tops = [m.gA, m.tA, ...(S.unit ? [rat(1)] : []), ...(m.claim && m.miss === 'top' ? [m.claim] : []), ...(m.claim && m.miss === 'bot' ? [qDiv(m.claim, m.rate)] : [])];
  const maxTop = Math.max(...tops.map(qNum));
  const sTop = (xEnd - x0) / maxTop, sBot = sTop / qNum(m.rate);
  check(sTop * Math.min(...tops.map(qNum)) >= 40, NAME, 'two ticks are too close to 0');
  const X = (v: Q, line: 'top' | 'bot' = 'top') => x0 + qNum(v) * (line === 'top' ? sTop : sBot);
  // arcs: lanes when spans overlap
  const atV = (a: At): Q => (a === 'zero' ? rat(0) : a === 'given' ? m.gA : a === 'target' ? m.tA : a === 'unit' ? rat(1) : (check(m.pA, NAME, 'an arc to a piece needs pieces'), m.pA!));
  const spans: [number, number, number][] = [];
  const lanes = (S.arcs ?? []).map(a => {
    check(a.from !== a.to, NAME, 'an arc joins two different ticks');
    const xa = X(atV(a.from)), xb = X(atV(a.to)), lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    let lane = 0;
    while (spans.some(([p, q, l]) => l === lane && p < hi - 2 && lo < q - 2)) lane++;
    spans.push([lo, hi, lane]);
    return lane;
  });
  const nL = lanes.length ? Math.max(...lanes) + 1 : 0;
  check(nL <= 2, NAME, 'at most two lanes of arcs');
  const arcH = nL ? 30 + 34 + (nL - 1) * LANE + 74 : 0;
  // vertical stack, centred in the frame
  const H = arcH + 52 + BH + GAP + BH + 52 + 34 + arcH;
  check(H <= fr.h, NAME, `the picture is ${Math.round(H)} px tall, the frame ${fr.h}`);
  const y0 = fr.y + (fr.h - H) / 2;
  const yTL = y0 + arcH + 34, yTB0 = yTL + 52, yTB1 = yTB0 + BH, yBB0 = yTB1 + GAP, yBB1 = yBB0 + BH, yBL = yBB1 + 52;
  const names: [Lab, Lab] = [lab(S.top.name, fx0 + 8, (yTB0 + yTB1) / 2, LAB, 'left'), lab(S.bot.name, fx0 + 8, (yBB0 + yBB1) / 2, LAB, 'left')];
  // ticks and their values: the given and the target must fit; the piece, unit and zero labels give way
  const txt = (v: Q, money: boolean) => fmt(v, money);
  const marks: Mark[] = [];
  const placed: { top: Box[]; bot: Box[] } = { top: [], bot: [] };
  // the given and target values need 14 px between labels; a piece / unit / zero label needs 28 px or it gives way
  const fits = (line: 'top' | 'bot', b: Box, gap = 14) => b.x0 >= fx0 + nameW + 18 && b.x1 <= fx1 && !placed[line].some(o => o.x0 < b.x1 + gap && b.x0 < o.x1 + gap);
  const add = (at: At, vA: Q, vB: Q, must: boolean) => {
    const x = X(vA);
    const topMiss = at === 'target' && m.miss === 'top', botMiss = at === 'target' && m.miss === 'bot';
    let top: Lab | null = lab(topMiss ? '?' : txt(vA, !!S.top.money), x, yTL, NUM);
    let bot: Lab | null = lab(botMiss ? '?' : txt(vB, !!S.bot.money), x, yBL, NUM);
    if (!fits('top', top.b, must ? 14 : 28)) { check(!must, NAME, `the ${at} value ${top.t} collides on the first line`); top = null; }
    if (!fits('bot', bot.b, must ? 14 : 28)) { check(!must, NAME, `the ${at} value ${bot.t} collides on the second line`); bot = null; }
    if (top) placed.top.push(top.b);
    if (bot) placed.bot.push(bot.b);
    marks.push({ at, v: vA, x, top, bot });
  };
  add('given', m.gA, m.gB, true);
  add('target', m.tA, m.tB, true);
  // the filled value must fit where the ? was
  const fillText = S.fillText ?? txt(m.miss === 'bot' ? m.tB : m.tA, m.miss === 'bot' ? !!S.bot.money : !!S.top.money);
  const tMark = marks[1]!;
  const fillLab = lab(fillText, tMark.x, m.miss === 'bot' ? yBL : yTL, NUM);
  { const line = m.miss === 'bot' ? 'bot' : 'top', others = placed[line].filter(b => b !== (line === 'bot' ? tMark.bot!.b : tMark.top!.b)); check(!others.some(o => o.x0 < fillLab.b.x1 + 10 && fillLab.b.x0 < o.x1 + 10) && fillLab.b.x1 <= fx1, NAME, `the answer ${fillText} collides`); placed[line].push(fillLab.b); }
  if (S.unit) add('unit', rat(1), m.rate, false);
  if (m.pA && S.pieces && S.pieces.cut > 1) add('piece', m.pA, m.pB!, false);
  add('zero', rat(0), rat(0), false);
  // pieces
  const pieceXs: number[] = [];
  if (S.pieces) {
    const n = Math.max(S.pieces.cut, S.pieces.count);
    for (let i = 0; i <= n; i++) pieceXs.push(X(qMul(m.pA!, rat(i))));
    check(pieceXs[1]! - pieceXs[0]! >= 22, NAME, `pieces are ${Math.round(pieceXs[1]! - pieceXs[0]!)} px wide`);
    check(pieceXs[n]! <= x1 - 20, NAME, 'the pieces run off the line');
  }
  // arcs (same label on both lines)
  const arcs: ArcGeom[] = (S.arcs ?? []).map((a, i) => {
    const xa = X(atV(a.from)), xb = X(atV(a.to)), lane = lanes[i]!, bul = 34 + lane * LANE;
    const yTop = yTL - 40, yBot = yBL + 40;
    return { spec: a, x0: xa, x1: xb, lane, bul, yTop, yBot, labT: lab(a.label, (xa + xb) / 2, yTop - bul - 44, NUM, 'center', 700), labB: lab(a.label, (xa + xb) / 2, yBot + bul + 44, NUM, 'center', 700) };
  });
  const AL = arcs.flatMap(a => [a.labT, a.labB]);
  // a wrong claim sits beside the ?, never on it: on the value row, or one row further out when that row is full
  let claim: DLLayout['claim'] = null;
  if (m.claim) {
    const line = m.miss, x = X(m.claim, line), t = txt(m.claim, line === 'bot' ? !!S.bot.money : !!S.top.money);
    const free = (L: Lab, row: Box[]) => !row.some(o => o.x0 < L.b.x1 + 8 && L.b.x0 < o.x1 + 8 && o.y0 < L.b.y1 + 4 && L.b.y0 < o.y1 + 4) && L.b.x1 <= fx1 && L.b.x0 >= fx0;
    let L = lab(t, x, line === 'bot' ? yBL : yTL, NUM);
    if (!free(L, placed[line])) L = lab(t, x, line === 'bot' ? yBL + 60 : yTL - 60, NUM);
    check(free(L, [...placed[line], ...AL.map(a => a.b)]), NAME, `the claim ${t} collides`);
    claim = { x, lab: L };
  }
  for (const L of AL) check(L.b.x0 >= fx0 && L.b.x1 <= fx1, NAME, `the arc label ${L.t} runs off the frame`);
  for (let i = 0; i < AL.length; i++) for (let j = i + 1; j < AL.length; j++) { const a = AL[i]!.b, b = AL[j]!.b; check(!(a.x0 < b.x1 + 8 && b.x0 < a.x1 + 8 && a.y0 < b.y1 + 4 && b.y0 < a.y1 + 4), NAME, 'two arc labels collide'); }
  // within-pair arrows (the rate)
  // within-pair arrows (the rate): the label right of its arrow (left when there is no room), in two rows when
  // there are several, so labels never meet and no arrow runs through a label
  const nW = (S.within ?? []).length;
  // every label on the same side of its arrow, so each label reads with the arrow next to it
  const wx = (S.within ?? []).map(w => X(w.at === 'given' ? m.gA : w.at === 'target' ? m.tA : rat(1)));
  const leftSide = (S.within ?? []).some((w, i) => wx[i]! + 22 + measure(w.label, NUM, 700) > fx1);
  const within: WithinGeom[] = (S.within ?? []).map((w, i) => {
    const x = wx[i]!, y = (yTB1 + yBB0) / 2 + (nW > 1 ? (i % 2 ? 46 : -46) : 0);
    const L = leftSide ? lab(w.label, x - 22, y, NUM, 'right', 700) : lab(w.label, x + 22, y, NUM, 'left', 700);
    return { spec: w, x, y0: yTB1 + 14, y1: yBB0 - 14, lab: L };
  });
  for (const w of within) check(w.lab.b.x1 <= fx1 && w.lab.b.x0 >= lay0(), NAME, `the rate label ${w.lab.t} runs off the frame`);
  for (let i = 0; i < within.length; i++) for (let j = i + 1; j < within.length; j++) { const a = within[i]!.lab.b, b = within[j]!.lab.b; check(!(a.x0 < b.x1 + 10 && b.x0 < a.x1 + 10 && a.y0 < b.y1 + 6 && b.y0 < a.y1 + 6), NAME, 'two rate labels collide'); }
  for (const w of within) for (const o of within) if (o !== w) check(!(o.x > w.lab.b.x0 - 12 && o.x < w.lab.b.x1 + 12), NAME, 'a rate arrow runs through a rate label');
  function lay0() { return x0 - 30; }
  return { m, x0, x1, sTop, sBot, yTL, yTB0, yTB1, yBB0, yBB1, yBL, names, marks, pieceXs, arcs, within, claim, fillLab, box: box(fx0, y0, fx1, y0 + H) };
}
/** can this picture be drawn? (tests; rough text widths) */
export function dlFits(S: DLSpec, fr: Frame): boolean { try { planDL(S, fr, roughMeasure); return true; } catch { return false; } }

// ---------- the block ----------
export interface DLRing { at: At | 'claim' | 'fill'; line: 'top' | 'bot'; col: Paint; k: number }
export interface DLFocus {
  rings?: DLRing[];
  /** arcs drawn on one line only (a multiplier found on one quantity first) */ arcLines?: 'top' | 'bot' | 'both';
  /** the second line's arcs draw on with their own keys (arcB{i}): the same multiplier, applied afterwards */ splitArcs?: boolean;
}
export interface DLBlock {
  readonly kind: 'DoubleLine';
  readonly maths: DLMaths;
  readonly lay: DLLayout;
  readonly where: {
    label(at: At, line: 'top' | 'bot'): Box; fill: Box; claim: Box | null;
    arc(i: number, line: 'top' | 'bot'): Box; within(i: number): Box; box: Box;
  };
  draw(c: Canvas, p: Progress<string>, f?: DLFocus): void;
}

export function DoubleLine(S: DLSpec, fr: Frame, th: Theme): DLBlock {
  const lay = planDL(S, fr, (t, size, weight) => wordsBox(t, 0, 0, { size, weight: weight ?? 650 }).w);
  const { m } = lay;
  const words = (c: Canvas, L: Lab, col: Paint, k: number, weight = 650) => drawWords(c, L.t, L.x, L.y, col, k, { size: L.size, align: L.align, weight });
  const ring = (c: Canvas, B: Box, col: Paint, k: number) => {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 16); g.stroke(); g.restore();
  };
  const tape = (c: Canvas, xa: number, xb: number, y0: number, col: Paint, seed: number, o: { lift?: number; alpha?: number } = {}) => {
    if (xb - xa < 2) return;
    wash(c, rectPts(xa, y0, xb - xa, BH, 9), col, { seed, rough: 0.9, inkW: 2.5, shade: 0.25, lift: o.lift ?? 0, alpha: o.alpha ?? 1 });
  };
  const markOf = (at: At) => lay.marks.find(k => k.at === at);
  const bars = [{ y0: lay.yTB0, col: 'first' as Paint, s: lay.sTop, v: m.gA, line: 'top' as const }, { y0: lay.yBB0, col: 'second' as Paint, s: lay.sBot, v: m.gB, line: 'bot' as const }];

  function draw(c: Canvas, p: Progress<string>, f: DLFocus = {}): void {
    const kR = p.k('rails');
    if (kR <= 0) return;
    const ka = E.inOut(clamp(kR * 1.3));
    // names and rails
    lay.names.forEach((L, i) => words(c, L, i === 0 ? 'first' : 'second', E.smooth(clamp(kR * 2 - 0.4)), 650));
    for (const b of bars) {
      const y = b.y0 + BH / 2;
      if (ka > 0) arrow(c, [[lay.x0 - 14, y], [lerp(lay.x0 - 14, lay.x1, ka), y]], 1, { col: 'dim', lw: 3, head: 14 });
    }
    // tapes: the given grows; past the given, the pieces counted beyond it pop in; or a dashed outline to the target
    const kG = E.smooth(clamp(p.k('given'))), kCut = clamp(p.k('cut')), kCount = clamp(p.k('count')), kT = E.smooth(clamp(p.k('target')));
    const P = lay.pieceXs, cut = S.pieces?.cut ?? 0, count = S.pieces?.count ?? 0;
    bars.forEach((b, bi) => {
      const xg = lay.x0 + qNum(b.v) * b.s;
      if (kG > 0) tape(c, lay.x0, lerp(lay.x0, xg, kG), b.y0, b.col, 11 + bi);
      if (P.length && count > cut) for (let i = cut; i < count; i++) {
        const k = E.back(clamp(kCount * (count + 1) - (i + 1)));
        if (k > 0) withAlpha(c, clamp(k), () => tape(c, P[i]! + 2, P[i]! + 2 + (P[i + 1]! - P[i]! - 4) * clamp(k), b.y0, b.col, 40 + i * 3 + bi));
      }
      if (!P.length && kT > 0 && qLess(m.gA, m.tA)) {
        const xt = lay.marks[1]!.x;
        withAlpha(c, kT * (1 - E.smooth(clamp(p.k('fill') * 1.5))), () => { c.g.save(); c.g.strokeStyle = paint(th, b.col, 'fill'); c.g.lineWidth = 3; c.g.setLineDash([10, 8]); c.g.beginPath(); c.g.roundRect(xg + 3, b.y0 + 2, xt - xg - 6, BH - 4, 8); c.g.stroke(); c.g.restore(); });
        const kf = E.smooth(clamp(p.k('fill') * 1.5));
        if (kf > 0) tape(c, xg + 2, lerp(xg + 2, xt, kf), b.y0, b.col, 60 + bi);
      }
      // lit pieces (counted)
      if (P.length && kCount > 0) for (let i = 0; i < count; i++) {
        const k = E.smooth(clamp(kCount * (count + 1) - i));
        if (k > 0) tape(c, P[i]! + 3, P[i + 1]! - 3, b.y0 + 5, b.col, 80 + i * 3 + bi, { lift: 0.5, alpha: 0.75 * k });
      }
      // cut marks across the tape
      if (P.length && kCut > 0) for (let i = 1; i < Math.max(cut, count); i++) {
        if (i >= cut && kCount <= 0) continue;
        const k = i < cut ? E.smooth(clamp(kCut * cut - (i - 1) * 0.8)) : 1;
        if (k > 0) inkLine(c, [[P[i]!, b.y0 - 6], [P[i]!, lerp(b.y0 - 6, b.y0 + BH + 6, k)]], { col: DUSK.ink, w: 4, seed: 120 + i + bi * 40, rough: 0.3 });
      }
    });
    // ticks and values
    const tick = (x: number, k: number, col: Paint = 'ink') => {
      if (k <= 0) return;
      const { g } = c; g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, lay.yTB0 - 18); g.lineTo(x, lay.yTB1 + 6); g.moveTo(x, lay.yBB0 - 6); g.lineTo(x, lay.yBB1 + 18); g.stroke(); g.restore();
    };
    const kFill = E.smooth(clamp(p.k('fill') * 1.4));
    for (const mk of lay.marks) {
      const k = mk.at === 'zero' ? E.smooth(clamp(kR * 2 - 0.6)) : mk.at === 'given' ? E.smooth(clamp(kG * 1.5 - 0.3)) : mk.at === 'target' ? kT
        : mk.at === 'piece' ? E.smooth(clamp(kCut * 1.4 - 0.4)) : E.smooth(clamp(p.k('unit')));
      if (k <= 0) continue;
      if (mk.at !== 'zero') tick(mk.x, k, mk.at === 'target' ? 'pick' : mk.at === 'unit' ? 'link' : 'ink');
      if (mk.at === 'target') {
        // the dashed alignment line through the gap: the target pair lines up
        withAlpha(c, 0.7 * k, () => dashLine(c, [mk.x, lay.yTB1 + 10], [mk.x, lay.yBB0 - 10], { col: 'pick', lw: 3 }));
        const missTop = m.miss === 'top';
        for (const [L, line] of [[mk.top, 'top'], [mk.bot, 'bot']] as const) {
          if (!L) continue;
          const isMiss = (line === 'top') === missTop;
          if (isMiss) { words(c, L, 'pick', k * (1 - kFill), 700); if (kFill > 0) words(c, lay.fillLab, 'link', kFill, 700); }
          else words(c, L, line === 'top' ? 'first' : 'second', k);
        }
        continue;
      }
      const colT: Paint = mk.at === 'unit' ? 'link' : 'first', colB: Paint = mk.at === 'unit' ? 'link' : 'second';
      if (mk.top) words(c, mk.top, mk.at === 'zero' ? 'dim' : colT, k);
      if (mk.bot) words(c, mk.bot, mk.at === 'zero' ? 'dim' : colB, k);
    }
    // a wrong claim: its own tick on its line, in red, off the alignment line
    const kC = E.smooth(clamp(p.k('claim'))) * (1 - E.smooth(clamp(p.k('fix'))));
    if (lay.claim && kC > 0) {
      const { x, lab } = lay.claim, line = m.miss;
      const { g } = c; g.save(); g.globalAlpha *= kC; g.strokeStyle = paint(th, 'wrong', 'fill'); g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath();
      if (line === 'bot') { g.moveTo(x, lay.yBB0 - 10); g.lineTo(x, lay.yBB1 + 18); } else { g.moveTo(x, lay.yTB0 - 18); g.lineTo(x, lay.yTB1 + 10); }
      g.stroke(); g.restore();
      const b = bars[line === 'top' ? 0 : 1]!;
      withAlpha(c, kC, () => { c.g.save(); c.g.strokeStyle = paint(th, 'wrong', 'fill'); c.g.lineWidth = 3; c.g.setLineDash([8, 7]); c.g.beginPath(); c.g.roundRect(lay.x0 + 2, b.y0 - 8, x - lay.x0 - 2, BH + 16, 10); c.g.stroke(); c.g.restore(); });
      words(c, lab, 'wrong', kC, 700);
    }
    // arcs between pairs, the same label on both lines
    lay.arcs.forEach((a, i) => {
      const kTop = p.k('arc' + i), kBot = f.splitArcs ? p.k('arcB' + i) : kTop;
      if (kTop <= 0 && kBot <= 0) return;
      const one = (y: number, dir: -1 | 1, L: Lab, k: number) => {
        if (k <= 0) return;
        const ka2 = E.inOut(clamp(k * 1.5)), kl = E.smooth(clamp(k * 2 - 0.5));
        const pts: [number, number][] = [];
        const xa = a.x0 + (a.x1 > a.x0 ? 8 : -8), xb = a.x1 - (a.x1 > a.x0 ? 8 : -8);
        for (let j = 0; j <= 30; j++) { const t = j / 30; pts.push([lerp(xa, xb, t), y + dir * a.bul * Math.sin(Math.PI * t)]); }
        arrow(c, pts, ka2, { col: 'ink', lw: 4, head: 16 });
        words(c, L, 'ink', kl, 700);
      };
      const on = f.arcLines ?? 'both';
      if (on !== 'bot') one(a.yTop, -1, a.labT, kTop);
      if (on !== 'top') one(a.yBot, 1, a.labB, kBot);
    });
    // within-pair arrows: the rate, first line down to the second
    lay.within.forEach((w, i) => {
      const k = p.k('within' + i);
      if (k <= 0) return;
      arrow(c, [[w.x, w.y0], [w.x, w.y1]], E.inOut(clamp(k * 1.5)), { col: 'link', lw: 5, head: 18 });
      words(c, w.lab, 'link', E.smooth(clamp(k * 2 - 0.6)), 700);
    });
    for (const r of f.rings ?? []) {
      const B = r.at === 'claim' ? lay.claim?.lab.b : r.at === 'fill' ? lay.fillLab.b : (r.line === 'top' ? markOf(r.at)?.top?.b : markOf(r.at)?.bot?.b);
      if (B) ring(c, B, r.col, r.k);
    }
  }
  const nothing = box(0, 0, 1, 1);
  return {
    kind: 'DoubleLine', maths: m, lay,
    where: {
      label: (at, line) => (line === 'top' ? markOf(at)?.top?.b : markOf(at)?.bot?.b) ?? nothing,
      fill: lay.fillLab.b, claim: lay.claim?.lab.b ?? null,
      arc: (i, line) => (line === 'top' ? lay.arcs[i]!.labT.b : lay.arcs[i]!.labB.b),
      within: i => lay.within[i]!.lab.b,
      box: lay.box,
    },
    draw,
  };
}
