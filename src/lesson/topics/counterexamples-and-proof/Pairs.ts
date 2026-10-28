// Pairs: the dot picture of parity. An even number is dots standing in pairs (two rows, one column per pair); an odd
// number is pairs plus one extra dot on the top row. A GENERAL number is drawn with a few columns, "⋯" and a last
// column, and a brace under it naming the count ("m pairs"): the same picture stands for every count, so an argument
// about it covers every number of that kind (with zero = no columns, the empty collection).
// Two groups side by side are a sum: 'join' slides them together into one row of columns, and the extra dots of two
// odd groups meet at the end and become one more pair. Colours by role: the first number amber, the second teal.
//
// Steps: g0, g1 (each group appears), brace (the brace under every group), join, total (the brace under the joined row).
// Focus: extra (glow on the extra dots), pulse (a soft glow on a group).
// Could move to the kit: a dot / pairs picture for parity and divisibility arguments (number theory, proof).
import { type Box, box, clamp, lerp } from '../../../core/math';
import type { Canvas } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';

export interface PGroup {
  /** a number of pairs (concrete), or a TeX letter (general: "m") */
  pairs: number | string;
  extra?: boolean;
  col: Paint;
  /** TeX under the group's brace ("4", "2m", "m\\ \\text{pairs}") */
  label?: string;
}
export interface PairsParams {
  groups: readonly PGroup[];
  /** TeX under the brace of the joined row */
  total?: string;
  /** words above the picture ("4 + 6") */
  title?: string;
}
export type PairsStep = 'g0' | 'g1' | 'brace' | 'join' | 'total';
export interface PairsFocus { extra?: number; pulse?: readonly number[] }
export interface PairsBlock {
  readonly kind: 'Pairs';
  readonly where: { group(i: number): Box; all: Box };
  draw(c: Canvas, P: Progress<PairsStep>, f?: PairsFocus): void;
}
const NAME = 'Pairs';
const DX0 = 60, DY0 = 64, R0 = 18, GAP0 = 110, DOTS = 2;

interface Col { g: number; kind: 'pair' | 'dots' | 'extra'; ax: number; jx: number }
export function pairsWidth(p: PairsParams, sc = 1): number {
  const cols = p.groups.map(g => (typeof g.pairs === 'number' ? g.pairs : DOTS + 2) + (g.extra ? 1 : 0));
  return (cols.reduce((s, n) => s + n * DX0, 0) + GAP0 * (p.groups.length - 1)) * sc;
}

export function Pairs(p: PairsParams, fr: Frame, th: Theme): PairsBlock {
  check(p.groups.length >= 1 && p.groups.length <= 2, NAME, 'one or two groups');
  // the dots grow to fill a wide frame (at most 1.5 times), never shrink below their base size
  const W0 = pairsWidth(p);
  check(W0 <= fr.w - 40, NAME, `the dots are too wide (${Math.round(W0)} px)`);
  const sc = Math.min(1.5, (fr.w - 40) / W0);
  const DX = DX0 * sc, DY = DY0 * sc, R = R0 * sc, GAP = GAP0 * sc, W = W0 * sc;
  for (const g of p.groups) if (typeof g.pairs === 'number') check(g.pairs >= 0 && g.pairs <= 12, NAME, 'at most 12 pairs');
  const labels = p.groups.map(g => (g.label ? tex(g.label) as Formula : null));
  const totalF = p.total ? tex(p.total) as Formula : null;
  const dotsF = tex('\\cdots') as Formula, plusF = tex('+') as Formula;
  // apart: groups with a gap; joined: every pair column in a row, then the extras together in one last column
  const cols: Col[] = [];
  let x = fr.x + fr.w / 2 - W / 2 + DX / 2;
  const nExtra = p.groups.filter(g => g.extra).length;
  const jW = W - GAP * (p.groups.length - 1) - (nExtra === 2 ? DX : 0);
  let jx = fr.x + fr.w / 2 - jW / 2 + DX / 2;
  const groupBox: Box[] = [];
  p.groups.forEach((g, gi) => {
    const x0 = x;
    const n = typeof g.pairs === 'number' ? g.pairs : DOTS + 2;
    for (let k = 0; k < n; k++) {
      const kind = typeof g.pairs === 'string' && k === DOTS ? 'dots' : 'pair';
      cols.push({ g: gi, kind, ax: x, jx }); x += DX; jx += DX;
    }
    if (g.extra) { cols.push({ g: gi, kind: 'extra', ax: x, jx: 0 }); x += DX; }
    groupBox.push(box(x0 - DX / 2, 0, x - DX / 2, 0));
    x += GAP;
  });
  const extraX = jx;   // the joined extras sit after every pair column
  // the content (title, two rows of dots, a brace and its label) sits in the middle of the frame
  const contentH = (p.title ? 100 : 0) + 2 * R + DY + 26 + 64 + 40;
  const top = fr.y + Math.max(0, (fr.h - contentH) / 2);
  const yTop = top + (p.title ? 100 : 0) + R, yBot = yTop + DY;
  const braceY = yBot + R + 26, labelY = braceY + 64;
  check(labelY + 40 <= fr.y + fr.h + 1, NAME, 'no room for the braces');
  const all = box(fr.x + fr.w / 2 - W / 2, yTop - R, fr.x + fr.w / 2 + W / 2, labelY + 40);

  function dot(c: Canvas, x: number, y: number, col: Paint, a: number, glow = 0): void {
    if (a <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a);
    if (glow > 0) { g.shadowColor = paint(th, 'link', 'fill'); g.shadowBlur = 22 * glow; }
    g.fillStyle = paint(th, col, 'fill'); g.beginPath(); g.arc(x, y, R, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0; g.strokeStyle = paint(th, col, 'line'); g.lineWidth = 3; g.stroke();
    g.restore();
  }
  function brace(c: Canvas, x0: number, x1: number, y: number, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c, mid = (x0 + x1) / 2;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'line'); g.lineWidth = 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y - 12); g.quadraticCurveTo(x0, y, x0 + 18, y); g.lineTo(mid - 16, y); g.quadraticCurveTo(mid, y, mid, y + 14);
    g.quadraticCurveTo(mid, y, mid + 16, y); g.lineTo(x1 - 18, y); g.quadraticCurveTo(x1, y, x1, y - 12); g.stroke();
    g.restore();
  }
  function draw(c: Canvas, P: Progress<PairsStep>, f: PairsFocus = {}): void {
    const kJ = E.smooth(clamp(P.k('join')));
    if (p.title) drawWords(c, p.title, fr.x + fr.w / 2, top + 44, 'dim', Math.max(P.k('g0'), 0), { size: 50, align: 'center' });
    let extraSeen = 0;
    for (const cl of cols) {
      const g = p.groups[cl.g]!, kG = P.k(cl.g === 0 ? 'g0' : 'g1');
      if (kG <= 0) continue;
      const a = E.smooth(clamp(kG)), pul = (f.pulse ?? [])[cl.g] ?? 0;
      if (cl.kind === 'extra') {
        const ei = extraSeen++;
        const tx = extraX, ty = ei === 0 ? yTop : yBot;
        dot(c, lerp(cl.ax, tx, kJ), lerp(yTop, ty, kJ), g.col, a, Math.max(f.extra ?? 0, pul));
        continue;
      }
      const cx = lerp(cl.ax, cl.jx, kJ);
      if (cl.kind === 'dots') {
        texDraw(c, dotsF, cx, yTop, { size: 60, align: 'center', valign: 'center', col: g.col, alpha: a });
        texDraw(c, dotsF, cx, yBot, { size: 60, align: 'center', valign: 'center', col: g.col, alpha: a });
      } else { dot(c, cx, yTop, g.col, a, pul); dot(c, cx, yBot, g.col, a, pul); }
    }
    // the plus sign between the groups (fades as they join)
    if (p.groups.length === 2 && P.k('g1') > 0) {
      const b0 = groupBox[0]!, b1 = groupBox[1]!;
      texDraw(c, plusF, (b0.x1 + b1.x0) / 2, (yTop + yBot) / 2, { size: 64, align: 'center', valign: 'center', col: 'dim', alpha: clamp(P.k('g1')) * (1 - kJ) });
    }
    const kB = P.k('brace') * (1 - kJ);
    p.groups.forEach((g, i) => {
      const b = groupBox[i]!;
      brace(c, b.x0 + 8, b.x1 - 8, braceY, g.col, kB);
      if (labels[i] && kB > 0) texDraw(c, labels[i]!, (b.x0 + b.x1) / 2, labelY, { size: 60, align: 'center', valign: 'center', col: g.col, alpha: kB });
    });
    const kT = P.k('total');
    if (kT > 0) {
      const x0 = fr.x + fr.w / 2 - jW / 2, x1 = fr.x + fr.w / 2 + jW / 2;
      brace(c, x0 + 8, x1 - 8, braceY, 'link', kT);
      if (totalF) texDraw(c, totalF, (x0 + x1) / 2, labelY, { size: 60, align: 'center', valign: 'center', col: 'link', alpha: kT });
    }
  }
  // the label must fit under its brace's group or at least inside the frame
  labels.forEach((F, i) => { if (F) { const w = texWidth(F, 60), b = groupBox[i]!; check((b.x0 + b.x1) / 2 - w / 2 >= fr.x && (b.x0 + b.x1) / 2 + w / 2 <= fr.x + fr.w, NAME, 'a brace label leaves the frame'); } });
  if (totalF) check(texWidth(totalF, 60) <= fr.w - 40, NAME, 'the total label is too wide');
  return { kind: 'Pairs', where: { group: i => box(groupBox[i]!.x0, yTop - R, groupBox[i]!.x1, yBot + R), all }, draw };
}
