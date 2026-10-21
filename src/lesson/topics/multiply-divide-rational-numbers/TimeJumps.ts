// TimeJumps: a signed product as time × rate on a vertical scale (depth in the sea, a thermometer, a balance).
// A steady rate is one equal jump per time step, always in the rate's direction. The time stamps run through "now":
// later (+1, +2, ...) and EARLIER (1 min ago = -1, ...). The change at time t is t × rate:
//   later    t > 0: t jumps from now, in the rate's direction          3 × (-4) = -12 (deeper)
//   earlier  t < 0: the |t| jumps that LED to now, so the reading was    (-3) × (-4) = +12 (higher)
//            on the other side of now: the sign of the product flips
// The block computes every node by summing the jumps one by one and asserts it equals start + t × rate.
// Steps `axis now later earlier ask answer`; `where.*` boxes for leaders; pulses for symbols writing on.
// Layout: numbers left of the scale, the painted object ON the scale (sub / thermometer), the jump arrows in a column
// right of it, the time stamps (teal) right of the arrows, the answer arrow (lime) and its value nearest the board.
import { type Box, type Q, box, clamp, lerp, unionBox, qNum } from '../../../core/math';
import { rectPts, circlePts } from '../../../core/pts';
import { type Canvas, arrow, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Paint, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { qAdd, qMul, qSame, q, withUnit, isDec } from './rq';

export interface JumpParams {
  /** the steady change per time step (signed, nonzero) */ rate: Q;
  /** the time stamps shown: t0 ≤ 0 ≤ t1, integers */ t0: number; t1: number;
  /** the reading now (default 0) */ start?: Q;
  /** the time asked about (an integer in [t0, t1], not 0), or null */ ask?: number | null;
  look: 'sea' | 'thermo' | 'plain';
  /** unit of the reading: 'ft', '°F', '$', 'in.' */ unit: string;
  /** the time step word: 'min', 'h', 's', 'wk' */ step: string;
  /** the caption above the scale */ caption: string;
  /** show + on positive numbers (a change compared with now) */ signed?: boolean;
}
export type JumpStep = 'axis' | 'now' | 'later' | 'earlier' | 'ask' | 'answer';
export const JUMP_STEPS: readonly JumpStep[] = ['axis', 'now', 'later', 'earlier', 'ask', 'answer'];
export interface JumpMaths { rate: Q; start: Q; t0: number; t1: number; ask: number | null; pos(t: number): Q; change: Q | null; end: Q | null }
export interface JumpFocus { rate?: number; time?: number; later?: number; earlier?: number; answer?: number; now?: number }
export interface JumpBlock {
  readonly kind: 'TimeJumps';
  readonly maths: JumpMaths;
  readonly steps: readonly JumpStep[];
  readonly where: {
    y(v: Q | number): number; axisX: number; colX: number; ansX: number;
    node(t: number): Box; jump(t: number): Box; time(t: number): Box; later: Box; earlier: Box; answer: Box; answerLabel: Box; scale: Box; now: Box;
  };
  draw(c: Canvas, p: Progress<JumpStep>, f?: JumpFocus): void;
}
const NAME = 'TimeJumps';
const MAXNODES = 9;

/** can the picture be drawn for these numbers? (generators only make what the model can draw) */
export function jumpsFit(p: Pick<JumpParams, 'rate' | 't0' | 't1' | 'ask'>): boolean {
  const n = p.t1 - p.t0;
  const ask = p.ask ?? null;
  return Number.isInteger(p.t0) && Number.isInteger(p.t1) && p.t0 <= 0 && p.t1 >= 0 && n >= 1 && n + 1 <= MAXNODES && p.rate.p !== 0
    && isDec(p.rate, 2) && (ask === null || (Number.isInteger(ask) && ask !== 0 && ask >= p.t0 && ask <= p.t1));
}
export function computeJumps(p: JumpParams): JumpMaths {
  check(jumpsFit(p), NAME, `rate ${p.rate.p}/${p.rate.q}, times ${p.t0}..${p.t1}: the model draws up to ${MAXNODES} time stamps through now`);
  const start = p.start ?? q(0);
  // every node by summing jumps one at a time (later: add the rate; earlier: the jumps that led to now)
  const nodes = new Map<number, Q>([[0, start]]);
  for (let t = 1; t <= p.t1; t++) nodes.set(t, qAdd(nodes.get(t - 1)!, p.rate));
  for (let t = -1; t >= p.t0; t--) nodes.set(t, qAdd(nodes.get(t + 1)!, q(-p.rate.p, p.rate.q)));
  for (const [t, v] of nodes) check(qSame(v, qAdd(start, qMul(q(t), p.rate))), NAME, `node ${t}: the jumps do not add up to t × rate`);
  const ask = p.ask ?? null;
  const change = ask === null ? null : qMul(q(ask), p.rate);
  return { rate: p.rate, start, t0: p.t0, t1: p.t1, ask, pos: t => nodes.get(t)!, change, end: ask === null ? null : nodes.get(ask)! };
}

const num = (v: Q, signed: boolean, unit: string): string => {
  const s = withUnit(v, unit === '$' ? '$' : '', signed);
  return s;
};
export function timeWord(t: number, step: string): string {
  if (t === 0) return 'now';
  return t > 0 ? `in ${t} ${step}` : `${-t} ${step} ago`;
}

export function TimeJumps(p: JumpParams, fr: Frame, th: Theme): JumpBlock {
  const m = computeJumps(p);
  const AX = fr.x + 270, COL = AX + 100, TX = AX + 150, ANS = AX + 460;
  const thermo = p.look === 'thermo';
  const yTop = fr.y + 150, yBot = fr.y + fr.h - (thermo ? 170 : 80);
  const vals: number[] = [];
  for (let t = m.t0; t <= m.t1; t++) vals.push(qNum(m.pos(t)));
  const vmax = Math.max(...vals), vmin = Math.min(...vals);
  let ppu = (yBot - yTop) / (vmax - vmin);
  const r = Math.abs(qNum(m.rate));
  if (ppu * r > 210) ppu = 210 / r;
  const mid = (yTop + yBot) / 2, vmid = (vmax + vmin) / 2;
  const y = (v: Q | number) => mid - ((typeof v === 'number' ? v : qNum(v)) - vmid) * ppu;
  const jumpPx = ppu * r;
  check(jumpPx >= 84, NAME, `jumps of ${Math.round(jumpPx)} px are too short for the time stamps`);
  const signed = p.signed ?? false;

  const nodeBox = (t: number): Box => { const yy = y(m.pos(t)); return box(AX - 12, yy - 12, AX + 12, yy + 12); };
  /** the arrow from time t to t + 1 */
  const arrowBox = (t: number): Box => { const a = y(m.pos(t)), b = y(m.pos(t + 1)); return box(COL - 18, Math.min(a, b) + 8, COL + 18, Math.max(a, b) - 8); };
  /** the middle band of that arrow, clear of the time stamps on its ends (a leader comes in here) */
  const jumpBox = (t: number): Box => { const B = arrowBox(t); return box(B.x0, B.cy - 8, B.x1, B.cy + 8); };
  const timeBox = (t: number): Box => wordsBox(timeWord(t, p.step), TX, y(m.pos(t)), { size: 44, align: 'left' });
  for (let t = m.t0; t <= m.t1; t++) check(timeBox(t).x1 <= ANS - 30, NAME, `the time stamp "${timeWord(t, p.step)}" runs into the answer column`);
  const later = m.t1 > 0 ? unionBox(Array.from({ length: m.t1 }, (_, i) => arrowBox(i))) : nodeBox(0);
  const earlier = m.t0 < 0 ? unionBox(Array.from({ length: -m.t0 }, (_, i) => arrowBox(-i - 1))) : nodeBox(0);
  const ansLabel = m.change ? withUnit(m.change, p.unit, true) : '';
  const ansY = m.end ? (y(m.start) + y(m.end)) / 2 : mid;
  const ansText = wordsBox(ansLabel, ANS + 34, ansY, { size: 60, align: 'left', weight: 700 });
  check(!m.change || ansText.x1 <= fr.x + fr.w + 40, NAME, `the answer label "${ansLabel}" runs off the frame`);
  const ansArrow = m.end ? box(ANS - 18, Math.min(y(m.start), y(m.end)), ANS + 18, Math.max(y(m.start), y(m.end))) : nodeBox(0);
  const answer = m.change ? unionBox([ansArrow, ansText]) : ansArrow;
  const scale = box(AX - 200, yTop - 30, AX + 30, yBot + 30);
  const nowBox = box(AX - 70, y(m.start) - 36, AX + 70, y(m.start) + 36);
  // which numbers get a label: every node, or every other one when they crowd (now and the asked node always)
  const every = jumpPx >= 96 ? 1 : 2;
  const capBox = wordsBox(p.caption, fr.x + 30, fr.y + 52, { size: 46, align: 'left' });
  check(capBox.x1 <= fr.x + fr.w + 60, NAME, 'the caption is too long');

  function pulseBox(c: Canvas, B: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.22; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 6, B.y0 - 4, B.x1 + 6, B.y1 + 4), col, k);
  }
  function ring(c: Canvas, R: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4.5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 6, R.y0 - 6, R.w + 12, R.h + 12, 12); g.stroke(); g.restore();
  }
  function sub(c: Canvas, yy: number, a: number, ghost: boolean): void {
    if (a <= 0) return;
    withAlpha(c, a, () => {
      if (ghost) {
        const { g } = c;
        g.save(); g.setLineDash([10, 8]); g.strokeStyle = DUSK.cream; g.lineWidth = 3; g.globalAlpha *= 0.8;
        g.beginPath(); g.roundRect(AX - 62, yy - 28, 124, 56, 28); g.stroke(); g.restore();
        return;
      }
      wash(c, rectPts(AX - 18, yy - 52, 36, 30, 8), '#B9B2A6', { seed: 31, ink: DUSK.ink, inkW: 2.5, shade: 0.3 });
      wash(c, rectPts(AX - 64, yy - 28, 128, 56, 28), '#CFC6B8', { seed: 32, ink: DUSK.ink, inkW: 3, shade: 0.35 });
      wash(c, circlePts(AX + 26, yy - 2, 13, 28), '#2B5C7C', { seed: 33, ink: DUSK.ink, inkW: 2.5, shade: 0.2, rough: 0.6 });
      wash(c, [[AX - 64, yy - 14], [AX - 90, yy - 30], [AX - 90, yy + 30], [AX - 64, yy + 14]], '#B9B2A6', { seed: 34, ink: DUSK.ink, inkW: 2.5, shade: 0.3 });
    });
  }

  function draw(c: Canvas, P: Progress<JumpStep>, f: JumpFocus = {}): void {
    const kA = P.k('axis'), kN = P.k('now'), kL = P.k('later'), kE = P.k('earlier'), kQ = P.k('ask'), kS = P.k('answer');
    const { g } = c;
    // the painted world behind the scale
    if (kA > 0) withAlpha(c, E.smooth(kA), () => {
      if (p.look === 'sea') {
        wash(c, rectPts(fr.x + 6, fr.y + 96, fr.w - 12, fr.h - 106, 34), '#1C4466', { seed: 21, ink: DUSK.ink, inkW: 3, shade: 0.45, rough: 2.6 });
        for (let i = 0; i < 3; i++) {
          const yy = fr.y + 150 + i * 46;
          inkLine(c, [[fr.x + 60 + i * 30, yy], [fr.x + fr.w - 90 - i * 50, yy + 8]], { col: '#5E8FB3', w: 3, seed: 22 + i, alpha: 0.35 - i * 0.08, rough: 3 });
        }
      } else if (thermo) {
        wash(c, rectPts(AX - 34, yTop - 70, 68, yBot - yTop + 130, 34), '#3A3A5E', { seed: 23, ink: DUSK.ink, inkW: 3, shade: 0.25, rough: 1.2 });
        wash(c, circlePts(AX, yBot + 92, 52, 48), '#3A3A5E', { seed: 24, ink: DUSK.ink, inkW: 3, shade: 0.25, rough: 1.2 });
      } else {
        wash(c, rectPts(fr.x + 30, fr.y + 96, fr.w - 60, fr.h - 106, 30), '#2A2550', { seed: 25, ink: DUSK.ink, inkW: 3, shade: 0.3, rough: 1.6 });
      }
    });
    if (kA > 0) drawWords(c, p.caption, fr.x + 30, fr.y + 52, 'dim', kA, { size: 46, align: 'left' });
    // thermometer liquid up to the reading now
    if (thermo && kN > 0) withAlpha(c, E.smooth(kN), () => {
      const top = y(m.start);
      wash(c, circlePts(AX, yBot + 92, 36, 40), '#D8604E', { seed: 26, ink: null, shade: 0.25, rough: 0.8 });
      wash(c, rectPts(AX - 13, top, 26, yBot + 70 - top, 12), '#D8604E', { seed: 27, ink: null, shade: 0.2, rough: 0.6 });
    });
    // the scale: crisp line, a tick and a number at every node
    if (kA > 0) {
      const k = E.inOut(clamp(kA * 1.2));
      inkLine(c, [[AX, y(vmax) - 40], [AX, lerp(y(vmax) - 40, y(vmin) + 40, k)]], { col: DUSK.cream, w: 4, seed: 41, rough: 0.3, alpha: 0.9 });
      for (let t = m.t0; t <= m.t1; t++) {
        const v = m.pos(t), yy = y(v);
        const kt = clamp(kA * 1.6 - 0.4 - ((t - m.t0) / (m.t1 - m.t0 + 1)) * 0.3);
        if (kt <= 0) continue;
        inkLine(c, [[AX - 22, yy], [AX + 22, yy]], { col: DUSK.cream, w: 4, seed: 42 + t, rough: 0.2, alpha: kt });
        const lab = t === 0 || t === m.ask || (t - m.t0) % every === 0;
        if (lab) drawWords(c, num(v, signed, p.unit), AX - 112, yy, t === 0 ? 'ink' : 'dim', kt, { size: 60, align: 'right' });
      }
    }
    // the object at now (the sub, or the thermometer's level mark)
    if (p.look === 'sea') sub(c, y(m.start), E.smooth(kN), false);
    else if (kN > 0) inkLine(c, [[AX - 34, y(m.start)], [AX + 34, y(m.start)]], { col: DUSK.cream, w: 5, seed: 44, alpha: E.smooth(kN) });
    if (kN > 0) {
      pulseBox(c, timeBox(0), 'ink', f.now ?? 0);
      drawWords(c, 'now', TX, y(m.start), 'ink', kN, { size: 44, align: 'left', weight: 700 });
    }
    // the jumps: later from now on, earlier (the jumps that led to now), each one equal and in the rate's direction
    const jumpArrow = (t: number, k: number, glowK: number) => {
      if (k <= 0) return;
      const a = y(m.pos(t)), b = y(m.pos(t + 1)), d = Math.sign(b - a);
      arrow(c, [[COL, a + d * 10], [COL, b - d * 10]], E.inOut(clamp(k)), { col: 'first', lw: 7, head: 26, glow: glowK > 0 ? 14 * glowK : undefined });
    };
    for (let i = 0; i < m.t1; i++) {
      const k = clamp(kL * m.t1 - i);
      jumpArrow(i, k, Math.max(f.later ?? 0, i === 0 ? f.rate ?? 0 : 0));
      if (k > 0.5) drawWords(c, timeWord(i + 1, p.step), TX, y(m.pos(i + 1)), 'second', clamp((k - 0.5) * 2), { size: 44, align: 'left' });
    }
    for (let j = 1; j <= -m.t0; j++) {
      const k = clamp(kE * -m.t0 - (j - 1));
      jumpArrow(-j, k, Math.max(f.earlier ?? 0, j === 1 && m.t1 === 0 ? f.rate ?? 0 : 0));
      if (k > 0.5) drawWords(c, timeWord(-j, p.step), TX, y(m.pos(-j)), 'second', clamp((k - 0.5) * 2), { size: 44, align: 'left' });
    }
    if (m.ask !== null && (f.time ?? 0) > 0) pulseBox(c, timeBox(m.ask), 'second', f.time ?? 0);
    // the question: a ring on the asked time stamp and its node
    if (m.ask !== null && kQ > 0) {
      const a = m.ask;
      const drawn = a > 0 ? clamp(kL * m.t1 - (a - 1)) > 0.5 : clamp(kE * -m.t0 - (-a - 1)) > 0.5;
      if (!drawn) drawWords(c, timeWord(a, p.step), TX, y(m.pos(a)), 'pick', kQ, { size: 44, align: 'left' });
      ring(c, unionBox([nodeBox(a), timeBox(a)]), 'pick', kQ * (1 - 0.85 * kS));
    }
    // the answer: the change from now to the asked time, lime, with its value; a ghost of the object there
    if (m.end && m.change && kS > 0) {
      const a = y(m.start), b = y(m.end), d = Math.sign(b - a);
      arrow(c, [[ANS, a + d * 6], [ANS, b - d * 4]], E.inOut(clamp(kS * 1.2)), { col: 'link', lw: 9, head: 30, glow: f.answer ? 14 * f.answer : undefined });
      g.save(); g.setLineDash([8, 10]); g.strokeStyle = paint(th, 'link', 'line'); g.lineWidth = 2.5; g.globalAlpha *= 0.55 * clamp(kS * 2);
      // guides from the end of each time stamp to the answer arrow (never through the words)
      const xa = timeBox(0).x1 + 16, xb = timeBox(m.ask!).x1 + 16;
      g.beginPath(); if (xa < ANS - 30) { g.moveTo(xa, a); g.lineTo(ANS - 14, a); } if (xb < ANS - 30) { g.moveTo(xb, b); g.lineTo(ANS - 14, b); } g.stroke(); g.restore();
      drawWords(c, ansLabel, ANS + 34, ansY, 'link', clamp(kS * 2 - 0.6), { size: 60, align: 'left', weight: 700 });
      if (p.look === 'sea') sub(c, b, clamp(kS * 2 - 0.8), true);
      else inkLine(c, [[AX - 34, b], [AX + 34, b]], { col: 'link', w: 5, seed: 45, alpha: clamp(kS * 2 - 0.8) });
      pulseBox(c, ansText, 'link', f.answer ?? 0);
    }
  }

  return {
    kind: 'TimeJumps', maths: m, steps: JUMP_STEPS,
    where: { y, axisX: AX, colX: COL, ansX: ANS, node: nodeBox, jump: jumpBox, time: timeBox, later, earlier, answer, answerLabel: m.change ? ansText : answer, scale, now: nowBox },
    draw,
  };
}

/** a free vertical arrow on the scale (the proof draws its own arrows); `label` is plain words beside it */
export function scaleArrow(c: Canvas, x: number, y0: number, y1: number, col: Paint, k: number, label?: string, labelSide: 'left' | 'right' = 'right'): void {
  if (k <= 0) return;
  const d = Math.sign(y1 - y0);
  arrow(c, [[x, y0 + d * 6], [x, y1 - d * 4]], E.inOut(clamp(k)), { col, lw: 9, head: 30 });
  if (label) drawWords(c, label, labelSide === 'right' ? x + 34 : x - 34, (y0 + y1) / 2, col, clamp(k * 2 - 1), { size: 60, align: labelSide === 'right' ? 'left' : 'right', weight: 700 });
}
