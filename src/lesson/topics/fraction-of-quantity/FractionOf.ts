// FractionOf: a/b of a whole-number quantity q, the model of "3/4 of 12 cookies" and "2/3 of 15 ft".
// Concreteness fading inside one block:
//   set   (optional) q painted objects that slide into b equal trays (the denominator's equal groups);
//   tape  the SAME quantity as one tape under the set, cut into b equal sections lined up under the trays, each
//         section labelled with the share q ÷ b; the a taken sections light up and a brace under them gives a/b of q.
// a > b: the whole keeps its brace, and the sections past it are copies of a share (lighter, dashed edge), so
// "5/4 of 12 ft" is visibly MORE than the whole. A tape with `ticks` shows unit cells, so 1/4 of 6 ft = 6/4 ft lands
// between the unit marks.
// Steps: labelQ, objects, group, labelB, tape, total, cut, share, take, count. The tape grows with its step, so
// tape = 0.75 shows three of four sections (cuts and share labels appear only where the tape already is).
import { type Box, type Pt, box, clamp, lag, lerp, unionBox } from '../../../core/math';
import { bracePts, rectPts } from '../../../core/pts';
import { type Canvas, drawOn, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, plainText } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { computeFractionOf, type FractionOfMaths, SET, setGeom } from './fractionOfMaths';

export interface FractionOfParams {
  q: number; a: number; b: number;
  /** draw the set of objects above the tape (q a multiple of b, at most 30, a ≤ b) */
  set?: boolean;
  /** the whole in words, e.g. '12 cookies' or 'a 15 ft ribbon' */
  whole: string;
  /** the groups in words, e.g. '4 equal groups' */
  groups: string;
  /** the unit after the numbers on the tape ('' for a count) */
  unit?: string;
  /** unit cells on the tape (fractional shares) */
  ticks?: boolean;
  /** the last `other` objects get a second colour (a subset, NOT the whole) */
  other?: number;
  /** the whole is unknown: its number shows "?" */
  hideTotal?: boolean;
  /** px per unit of the tape (two tapes drawn to one scale) */
  scale?: number;
  /** the object painted in the set */
  look?: 'cookie' | 'marble';
  /** answer label TeX (default: the result and the unit) */
  answerTex?: string;
  /** no word labels row (a second tape under a first one) */
  noLabels?: boolean;
  /** a lower tape (two tapes in one frame) */
  compact?: boolean;
}
export type FractionOfStep = 'labelQ' | 'objects' | 'group' | 'labelB' | 'tape' | 'total' | 'cut' | 'share' | 'take' | 'count';
export const FRACTION_OF_STEPS: readonly FractionOfStep[] = ['labelQ', 'objects', 'group', 'labelB', 'tape', 'total', 'cut', 'share', 'take', 'count'];

export interface FractionOfFocus {
  groups?: readonly number[];
  sections?: readonly number[];
  k?: number;
  col?: 'pick' | 'link' | 'first' | 'second' | 'wrong';
  /** pulse 0..1 of the group labels (a symbol and its label light up together) */
  labelQ?: number; labelB?: number;
}
export interface FractionOfBlock {
  readonly kind: 'FractionOf';
  readonly maths: FractionOfMaths;
  readonly box: Box;
  readonly where: {
    labelQ: Box; labelB: Box; objects: Box; tape: Box; whole: Box; total: Box; taken: Box; answer: Box;
    group(j: number): Box; section(j: number): Box; sectionLabel(j: number): Box;
  };
  draw(c: Canvas, p: Progress<FractionOfStep>, focus?: FractionOfFocus): void;
}

const NAME = 'FractionOf';
const LABEL = 50, NUM = 64, SEC = 60;

const texOf = (n: number, d: number): string => (n % d === 0 ? String(n / d) : `\\frac{${n}}{${d}}`);

export function FractionOf(p: FractionOfParams, fr: Frame, th: Theme): FractionOfBlock {
  const m = computeFractionOf(p.q, p.a, p.b);
  const { q, a, b } = m;
  plainText(p.whole, NAME, 'whole'); plainText(p.groups, NAME, 'groups');
  const unit = p.unit ?? '';
  const W = fr.w;
  const G = p.set ? setGeom(q, b, W) : null;
  check(!p.set || (G !== null && a <= b), NAME, `${q} objects in ${b} groups do not fit the set picture (use the tape alone)`);
  check((p.other ?? 0) >= 0 && (p.other ?? 0) < q, NAME, 'other must be a part of the set');
  const nSec = Math.max(a, b);
  const wholeW = p.scale ? p.scale * q : a > b ? (W * b) / a : W;
  check(wholeW <= W + 0.5 && (wholeW / b) * nSec <= W + 0.5, NAME, `the tape (${Math.round((wholeW / b) * nSec)} px) is wider than the frame (${W} px)`);
  const sw = wholeW / b;
  check(sw >= 56, NAME, `sections of ${Math.round(sw)} px are too narrow to read`);
  const TH = p.set ? 84 : p.compact ? 70 : 110;

  // ---------- vertical layout ----------
  const labelsH = p.noLabels ? 0 : 64, trayH = G ? G.trayH : 0;
  const shareSrc = texOf(q, b);
  const SF = tex(shareSrc) as Formula;
  const shareH = texBox(SF, 0, 0, { size: SEC, align: 'center' }).h;
  const ansSrc = p.answerTex ?? `\\cssId{r}{${texOf(a * q, b)}}${unit ? `\\ \\text{${unit}}` : ''}`;
  const AF = tex(ansSrc) as Formula;
  const ansH = texBox(AF, 0, 0, { size: NUM, align: 'center' }).h;
  const totalSrc = `${p.hideTotal ? '?' : q}${unit ? `\\ \\text{${unit}}` : ''}`;
  const TF = tex(totalSrc) as Formula;
  const numRow = 74, braceH = 34;
  const below = 22 + Math.max(60, shareH) + 26 + braceH + 18 + Math.max(64, ansH);
  const top = p.noLabels ? 0 : G ? 8 + trayH + 30 : 20;
  const total = labelsH + top + numRow + braceH + 8 + TH + below;
  check(total <= fr.h, NAME, `the model needs ${Math.round(total)} px, the frame has ${fr.h}`);
  const y0 = fr.y + Math.max(0, (fr.h - total) / 2);
  const labelY = y0 + labelsH / 2;
  const traysY = y0 + labelsH + 8;
  const numY = y0 + labelsH + top + numRow / 2;
  const braceY1 = numY + numRow / 2 + braceH;                      // the brace's base, just above the tape
  const tapeY = braceY1 + 8, tapeY1 = tapeY + TH;
  const secLabelY = tapeY1 + 22 + Math.max(60, shareH) / 2;
  const takeY0 = tapeY1 + 22 + Math.max(60, shareH) + 26;
  const ansY = takeY0 + braceH + 18 + Math.max(64, ansH) / 2;
  const x0 = fr.x;

  // ---------- horizontal layout ----------
  const trayBox = (j: number): Box => {
    const tw = G!.trayW, x = x0 + j * (tw + SET.gap);
    return box(x, traysY, x + tw, traysY + trayH);
  };
  const s = q / b;
  /** grouped place of object i: dealt like cards, object i goes to group i % b */
  const objGroup = (i: number) => i % b;
  const grouped = (i: number): Pt => {
    const g = G!, T = trayBox(objGroup(i)), slot = Math.floor(i / b);
    const cols = Math.min(g.cols, s), col = slot % g.cols, row = Math.floor(slot / g.cols);
    const rowW = cols * g.d + (cols - 1) * SET.og, rows = Math.ceil(s / g.cols);
    const colH = rows * g.d + (rows - 1) * SET.og;
    return [T.cx - rowW / 2 + g.d / 2 + col * (g.d + SET.og), T.cy - colH / 2 + g.d / 2 + row * (g.d + SET.og)];
  };
  /** the loose set before grouping: one even grid across the width */
  const loose = (i: number): Pt => {
    const g = G!, per = Math.max(1, Math.min(q, Math.floor((W + SET.og) / (g.d + 2 * SET.og)))), rows = Math.ceil(q / per);
    const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, q - row * per);
    const step = g.d + 2 * SET.og, rowW = inRow * step - 2 * SET.og;
    const colH = rows * (g.d + SET.og) - SET.og;
    return [x0 + W / 2 - rowW / 2 + g.d / 2 + col * step, traysY + trayH / 2 - colH / 2 + g.d / 2 + row * (g.d + SET.og)];
  };
  const section = (j: number): Box => box(x0 + j * sw, tapeY, x0 + (j + 1) * sw, tapeY1);
  const wholeBox = box(x0, tapeY, x0 + wholeW, tapeY1);
  const taken = unionBox(Array.from({ length: a }, (_, j) => section(j)));
  const labelQ = wordsBox(p.whole, x0, labelY, { size: LABEL });
  const labelB = wordsBox(p.groups, x0 + W, labelY, { size: LABEL, align: 'right' });
  check(!!p.noLabels || labelQ.x1 + 30 < labelB.x0, NAME, `the labels "${p.whole}" and "${p.groups}" collide`);
  const secWOf = () => texBox(SF, 0, 0, { size: SEC, align: 'center' }).w;
  const labelAll = secWOf() + 14 <= sw;
  const secLabel = (j: number): Box => {
    const S = section(j);
    let cx = S.cx;
    if (!labelAll) cx = Math.max(cx, x0 + secWOf() / 2);
    return texBox(SF, cx, secLabelY, { size: SEC, align: 'center' });
  };
  // measured when asked, not at build: a TeX box measured before its font range has loaded is wrong
  const ansXOf = () => { const aw = texBox(AF, 0, 0, { size: NUM, align: 'center' }).w; return clamp(taken.cx, x0 + aw / 2, x0 + W - aw / 2); };
  const answerBox = () => texBox(AF, ansXOf(), ansY, { size: NUM, align: 'center' });
  const totalBoxOf = () => texBox(TF, x0 + wholeW / 2, numY, { size: NUM, align: 'center' });
  const objects = G ? unionBox(Array.from({ length: b }, (_, j) => trayBox(j))) : box(x0, traysY, x0, traysY);
  const look = p.look ?? 'cookie';
  const other = p.other ?? 0;

  function draw(c: Canvas, P: Progress<FractionOfStep>, f: FractionOfFocus = {}): void {
    const kLQ = P.k('labelQ'), kObj = P.k('objects'), kGr = P.k('group'), kLB = P.k('labelB');
    const kTape = P.k('tape'), kTot = P.k('total'), kCut = P.k('cut'), kShare = P.k('share'), kTake = P.k('take'), kCount = P.k('count');
    const fk = clamp(f.k ?? 0), fcol = f.col ?? 'pick';
    pulse(c, labelQ, 'first', f.labelQ ?? 0);
    pulse(c, labelB, 'second', f.labelB ?? 0);
    if (!p.noLabels) {
      drawWords(c, p.whole, x0, labelY, 'first', kLQ, { size: LABEL });
      drawWords(c, p.groups, x0 + W, labelY, 'second', kLB, { size: LABEL, align: 'right' });
    }

    // ----- the set -----
    if (G) {
      for (let j = 0; j < b; j++) {
        const kt = E.smooth(lag(kGr, j, b, 0.3));
        if (kt <= 0) continue;
        const T = trayBox(j);
        withAlpha(c, kt, () => wash(c, rectPts(T.x0, T.y0, T.w, T.h, 18), '#2C6E78', { seed: 300 + j, ink: DUSK.ink, inkW: 3, shade: 0.3 }));
        const lit = kTake > 0 && j < a ? E.smooth(lag(kTake, j, a, 0.6)) : 0;
        if (lit > 0) ring(c, T, 'link', lit, 18, 0.5);
        if ((f.groups ?? []).includes(j) && fk > 0) ring(c, T, fcol, fk, 18);
      }
      const order: number[] = [];
      for (let i = 0; i < q; i++) order.push(i);
      for (const i of order) {
        const ko = E.smooth(lag(kObj, i, q, 0.25));
        if (ko <= 0) continue;
        const kg = E.smooth(lag(kGr, i, q, 0.5));
        const A = loose(i), B = grouped(i);
        const x = lerp(A[0], B[0], kg), y = lerp(A[1], B[1], kg) - Math.sin(Math.PI * kg) * 40 + (1 - ko) * -20;
        drawObject(c, x, y, G.d, i, i >= q - other, ko);
      }
    }

    // ----- the tape -----
    const kt = kTape, tapeEnd = x0 + wholeW * kt;
    if (kt > 0) {
      withAlpha(c, clamp(kt * 4), () => {
        // the whole
        wash(c, rectPts(x0, tapeY, Math.max(30, wholeW * kt), TH, 14), 'first', { seed: 41 + q, inkW: 3, shade: 0.3 });
        if (p.ticks) {
          for (let u = 1; u < q; u++) {
            const x = x0 + (u * wholeW) / q;
            if (x > x0 + wholeW * kt) break;
            inkLine(c, [[x, tapeY + 10], [x, tapeY + 26]], { col: DUSK.ink, w: 3, seed: 60 + u, alpha: 0.55 });
            inkLine(c, [[x, tapeY1 - 26], [x, tapeY1 - 10]], { col: DUSK.ink, w: 3, seed: 80 + u, alpha: 0.55 });
          }
        }
        // the brace and the total over the whole
        const bk = kTot;
        if (bk > 0) {
          drawOn(c, bracePts([x0 + 4, braceY1], [x0 + wholeW - 4, braceY1], 24), bk, { col: paint(th, 'first', 'line'), lw: 3.5 });
          texDraw(c, TF, x0 + wholeW / 2, numY, { size: NUM, align: 'center', col: 'first', k: bk });
        }
      });
      // copies of a share past the whole (a > b)
      for (let j = b; j < nSec; j++) {
        const kc = E.smooth(lag(kTake, j, nSec, 0.6));
        if (kc <= 0) continue;
        const S = section(j);
        withAlpha(c, kc, () => {
          wash(c, rectPts(S.x0 + 3, S.y0, S.w - 3, S.h, 12), 'first', { seed: 400 + j, inkW: 2.5, lift: 0.3, shade: 0.2 });
        });
      }
    }
    // the cuts: b - 1 teal lines across the tape (and the end of the whole when copies follow)
    for (let j = 1; j < b; j++) {
      const kj = E.inOut(lag(kCut, j - 1, b - 1, 0.5));
      const x = x0 + j * sw;
      if (kj <= 0 || x > tapeEnd + 1) continue;
      const g = c.g; g.save(); g.strokeStyle = paint(th, 'second', 'fill'); g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, tapeY - 12); g.lineTo(x, tapeY - 12 + (TH + 24) * kj); g.stroke(); g.restore();
    }
    // the sections in focus, the taken sections (lime), labels
    for (let j = 0; j < nSec; j++) {
      const S = section(j);
      if ((f.sections ?? []).includes(j) && fk > 0) ring(c, S, fcol, fk, 10);
      if (j < a && kTake > 0) {
        const lk = E.smooth(lag(kTake, j, nSec, 0.6));
        if (lk > 0) {
          const g = c.g; g.save(); g.globalAlpha *= lk * 0.35; g.fillStyle = paint(th, 'link', 'fill');
          g.beginPath(); g.roundRect(S.x0 + 5, S.y0 + 5, S.w - 10, S.h - 10, 10); g.fill(); g.restore();
          ring(c, box(S.x0 + 4, S.y0 + 4, S.x1 - 4, S.y1 - 4), 'link', lk, 10, 0.4);
        }
      }
      const onTape = j >= b || x0 + (j + 1) * sw <= tapeEnd + 1;
      if (kShare > 0 && (labelAll || j === 0) && onTape && (j < b || kTake > 0)) {
        const L = secLabel(j);
        texDraw(c, SF, L.cx, secLabelY, { size: SEC, align: 'center', col: 'pick', k: E.smooth(lag(kShare, j, nSec, 0.4)) });
      }
    }
    // the answer: a brace under the taken sections and the result
    if (kCount > 0) {
      drawOn(c, bracePts([taken.x1 - 4, takeY0], [taken.x0 + 4, takeY0], 24), kCount, { col: paint(th, 'link', 'line'), lw: 3.5 });
      texDraw(c, AF, ansXOf(), ansY, { size: NUM, align: 'center', col: 'link', k: kCount, tags: { r: { col: 'link' } } as never });
    }
  }

  function drawObject(c: Canvas, x: number, y: number, d: number, i: number, alt: boolean, k: number): void {
    const r = d / 2, n = 22;
    const P: Pt[] = Array.from({ length: n }, (_, t) => { const a2 = (t / n) * Math.PI * 2; return [x + Math.cos(a2) * r, y + Math.sin(a2) * r] as Pt; });
    const col = alt ? '#7FA7E0' : look === 'cookie' ? '#E2A04C' : paint(th, 'first', 'fill');
    wash(c, P, col, { seed: 600 + i, inkW: 2.5, rough: 1.4, alpha: k, shade: 0.3 });
    const g = c.g;
    g.save(); g.globalAlpha *= k;
    if (look === 'cookie' && !alt) {
      g.fillStyle = '#5A2E1A';
      for (let t = 0; t < 4; t++) {
        const ang = hashLocal(i, t) * Math.PI * 2, rr = r * 0.5 * hashLocal(i + 7, t);
        g.beginPath(); g.ellipse(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, r * 0.12, r * 0.09, ang, 0, Math.PI * 2); g.fill();
      }
    } else {
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.beginPath(); g.ellipse(x - r * 0.32, y - r * 0.34, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  function pulse(c: Canvas, B: Box, col: 'first' | 'second', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 8, B.y0 - 4, B.x1 + 8, B.y1 + 4), col, k, 14, 0.8);
  }
  function ring(c: Canvas, R: Box, col: 'pick' | 'link' | 'first' | 'second' | 'wrong', k: number, r: number, glow = 0.6): void {
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 16 * glow * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 6, R.y0 - 6, R.w + 12, R.h + 12, r); g.stroke(); g.restore();
  }

  const all = unionBox([labelQ, labelB, objects, section(0), section(nSec - 1), answerBox(), totalBoxOf()]);
  return {
    kind: 'FractionOf', maths: m, box: all,
    where: {
      labelQ, labelB, objects, tape: unionBox([section(0), section(nSec - 1)]), whole: wholeBox, get total() { return totalBoxOf(); }, taken, get answer() { return answerBox(); },
      group: j => (G ? trayBox(j) : section(j)), section, sectionLabel: secLabel,
    },
    draw,
  };
}

function hashLocal(a: number, b: number): number {
  let h = Math.imul(a * 2654435761 ^ b * 40503, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
