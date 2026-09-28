// DoubleNumberLine: two aligned number lines. Each unit (a batch) adds `a` on the top line and `b` on the bottom line,
// so tick i reads i·a over i·b. Optionally the unit rate 1 : b/a is marked and boxed, ×n arcs jump from a tick to
// another on both lines, and a target value on the top line gets its answer on the bottom line.
//
//   DoubleNumberLine({ a: 2, b: 3, count: 3, labels: ['lemon', 'water'], unitRate: true, target: 5 }, frame, ink)
//   steps: lines, ticks, unit, arcs, target, answer
import { type Box, type Pt, type Q, box, clamp, qDiv, qEq, qMul, qNum, qTex, rat, unionBox } from '../core/math';
import { E } from '../core/easing';
import { curveApex, curvePts, rectPts } from '../core/pts';
import { type Canvas, arrow, drawOn, halo } from '../core/draw';
import type { Progress } from '../core/clock';
import { type Role, type Theme } from '../core/theme';
import { type Formula, tex, texBox, texDraw } from '../core/tex';
import { type Block, type Frame, type ParamSpec, check, friendly, hitsLines, plainText } from './block';
import { factorTex } from './RatioTable';

const NAME = 'DoubleNumberLine';

export interface DoubleNumberLineParams {
  /** per unit: a on the top line, b on the bottom line (whole numbers) */
  readonly a: number; readonly b: number;
  /** units shown: ticks 0..count */
  readonly count: number;
  /** line names (plain words) */
  readonly labels: readonly [string, string];
  readonly roles?: readonly [Role, Role];
  /** colour role of the unit-rate box, the arcs and the answer frame (default ratio) */
  readonly accent?: Role;
  /** mark and box the unit rate 1 : b/a */
  readonly unitRate?: boolean;
  /** a top-line value to find: its bottom value is the answer */
  readonly target?: number | null;
  /** ×n arcs from tick 1 to these tick indices (when there is no target) */
  readonly arcs?: readonly number[];
}
export type DoubleNumberLineStep = 'lines' | 'ticks' | 'unit' | 'arcs' | 'target' | 'answer';
export const DNL_STEPS: readonly DoubleNumberLineStep[] = ['lines', 'ticks', 'unit', 'arcs', 'target', 'answer'];

export interface DnlTick { readonly top: Q; readonly bottom: Q; readonly kind: 'unit-multiple' | 'unit-rate' | 'target' }
export interface DnlArc { readonly from: Q; readonly to: Q; readonly factor: Q; readonly tex: string }
export interface DoubleNumberLineMaths {
  readonly a: Q; readonly b: Q; readonly rate: Q;
  readonly ticks: readonly DnlTick[];
  readonly arcs: readonly DnlArc[];
  readonly target: DnlTick | null;
  readonly max: Q;
}
export const DNL_MAX_COUNT = 12;

export function computeDoubleNumberLine(P: DoubleNumberLineParams): DoubleNumberLineMaths {
  const a = friendly(P.a, NAME, 'a', { whole: true }), b = friendly(P.b, NAME, 'b', { whole: true });
  check(Number.isInteger(P.count) && P.count >= 1, NAME, `count must be a whole number of units, at least 1 (got ${P.count})`);
  check(P.count <= DNL_MAX_COUNT, NAME, `at most ${DNL_MAX_COUNT} units (got ${P.count})`);
  plainText(P.labels[0], NAME, 'top label'); plainText(P.labels[1], NAME, 'bottom label');
  const rate = qDiv(b, a);                                   // bottom per 1 on top
  const ticks: DnlTick[] = [];
  for (let i = 0; i <= P.count; i++) ticks.push({ top: qMul(a, rat(i)), bottom: qMul(b, rat(i)), kind: 'unit-multiple' });
  const one = rat(1);
  const unit: DnlTick = { top: one, bottom: rate, kind: 'unit-rate' };
  if (P.unitRate && a.p !== 1) ticks.push(unit);
  const max = qMul(a, rat(P.count));
  let target: DnlTick | null = null;
  if (P.target !== undefined && P.target !== null) {
    const T = friendly(P.target, NAME, 'target', { whole: true });
    check(qNum(T) <= qNum(max), NAME, `target ${qNum(T)} is beyond the end of the line (${qNum(max)}): use more units`);
    target = { top: T, bottom: qMul(T, rate), kind: 'target' };
    // the answer keeps the ratio: T : answer = a : b
    check(qEq(qDiv(target.top, target.bottom), qDiv(a, b)), NAME, 'answer does not keep the ratio');
    if (!ticks.some(t => qEq(t.top, T))) ticks.push(target);
  }
  ticks.sort((x, y) => qNum(x.top) - qNum(y.top));
  // arcs: from the unit rate to the target, or from the first unit to the listed ticks
  const arcs: DnlArc[] = [];
  if (target) {
    const from = P.unitRate ? one : a;
    if (!qEq(from, target.top)) arcs.push({ from, to: target.top, factor: qDiv(target.top, from), tex: factorTex(qDiv(target.top, from)) });
  } else for (const i of P.arcs ?? []) {
    check(Number.isInteger(i) && i >= 2 && i <= P.count, NAME, `arc to tick ${i} does not exist (ticks 2..${P.count})`);
    arcs.push({ from: a, to: qMul(a, rat(i)), factor: rat(i), tex: factorTex(rat(i)) });
  }
  return { a, b, rate, ticks, arcs, target, max };
}

export interface DoubleNumberLineBlock extends Block<DoubleNumberLineStep> {
  readonly maths: DoubleNumberLineMaths;
  /** x of a top-line value */
  x(top: number): number;
  readonly yTop: number; readonly yBottom: number;
}

export function DoubleNumberLine(P: DoubleNumberLineParams, f: Frame, th: Theme): DoubleNumberLineBlock {
  const M = computeDoubleNumberLine(P);
  const roles = P.roles ?? (['lemon', 'water'] as const), acc: Role = P.accent ?? 'ratio';
  const numSize = th.font.num * 0.9 >= th.font.minNum ? Math.round(th.font.num * 0.9) : th.font.minNum;
  const nameSize = th.font.label, arcSize = Math.max(th.font.minNum, Math.round(numSize * 0.85));
  const NF = [tex(`\\text{${P.labels[0]}}`), tex(`\\text{${P.labels[1]}}`)] as const;
  const nameW = Math.max(...NF.map(F => texBox(F, 0, 0, { size: nameSize }).w));
  // horizontal: [names][gap][line .......][overhang]
  const xL = f.x + nameW + 48, xR = f.x + f.w - 40, len = xR - 30 - xL;
  check(len > 300, NAME, 'the frame is too narrow for a number line');
  const maxV = qNum(M.max);
  const X = (v: number) => xL + (v / maxV) * len;
  // vertical: arcs over the top labels, arcs under the bottom labels
  const hasArcs = M.arcs.length > 0;
  const arcBand = hasArcs ? 150 + arcSize : 0;
  const tickH = 16, labGap = 34 + numSize * 0.5;
  const gapLines = Math.max(170, numSize * 2.2);
  const totalH = 2 * (arcBand + labGap + numSize * 0.4) + gapLines;
  check(totalH <= f.h + 1, NAME, `needs ${Math.round(totalH)} px of height, the frame has ${Math.round(f.h)}`);
  const yT = f.y + (f.h - gapLines) / 2, yB = yT + gapLines;

  // ticks + labels
  interface TickGeo { t: DnlTick; x: number; FT: Formula; FB: Formula; bt: Box; bb: Box; i: number }
  // labels sit on a shared baseline per line, far enough that the deepest (a fraction) clears the ticks
  const FTs = M.ticks.map(t => tex(qTex(t.top))), FBs = M.ticks.map(t => tex(qTex(t.bottom)));
  const s = numSize / 1000;
  const baseT = yT - tickH - 14 - Math.max(...FTs.map(F => F.bottom)) * s;
  const baseB = yB + tickH + 14 - Math.min(...FBs.map(F => F.top)) * s;
  const LT = { size: numSize, align: 'center' as const, valign: 'baseline' as const };
  const tg: TickGeo[] = M.ticks.map((t, i) => {
    const x = X(qNum(t.top)), FT = FTs[i]!, FB = FBs[i]!;
    return { t, x, FT, FB, i, bt: texBox(FT, x, baseT, LT), bb: texBox(FB, x, baseB, LT) };
  });
  // readability: neighbouring labels must not collide (16 px air)
  for (let i = 1; i < tg.length; i++) {
    const p = tg[i - 1]!, q = tg[i]!;
    const clash = (u: Box, v: Box) => u.x1 + 16 > v.x0;
    check(!clash(p.bt, q.bt) && !clash(p.bb, q.bb), NAME,
      `labels ${qTex(p.t.bottom).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/, ' $1/$2')} and ${qTex(q.t.bottom).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/, ' $1/$2')} would overlap: use fewer units`);
  }
  const lineT: Pt[] = [[xL - 24, yT], [xR, yT]], lineB: Pt[] = [[xL - 24, yB], [xR, yB]];
  const tickPts = (x: number, y: number): Pt[] => [[x, y - tickH], [x, y + tickH]];
  const links = tg.map(g => [[g.x, yT + tickH + 10], [g.x, yB - tickH - 10]] as Pt[]);
  // the unit-rate box: around both labels at 1
  const unitG = tg.find(g => g.t.kind === 'unit-rate') ?? (P.unitRate ? tg.find(g => qEq(g.t.top, rat(1))) : undefined);
  const unitBox = unitG ? (() => { const u = unionBox([unitG.bt, unitG.bb]); return box(u.x0 - 22, u.y0 - 18, u.x1 + 22, u.y1 + 18); })() : null;
  // arcs: above the top labels and below the bottom labels
  interface ArcGeo { top: Pt[]; bot: Pt[]; labT: Pt; labB: Pt; F: Formula }
  const labTopY = Math.min(...tg.map(g => g.bt.y0)), labBotY = Math.max(...tg.map(g => g.bb.y1));
  const arcG: ArcGeo[] = M.arcs.map(ar => {
    const x0 = X(qNum(ar.from)), x1 = X(qNum(ar.to)), yA = (unitBox && qEq(ar.from, rat(1)) ? Math.min(labTopY, unitBox.y0) : labTopY) - 14;
    const yZ = (unitBox && qEq(ar.from, rat(1)) ? Math.max(labBotY, unitBox.y1) : labBotY) + 14;
    const bend = Math.min(120, 40 + (x1 - x0) * 0.12);
    const top = curvePts([x0 + 6, yA], [x1 - 6, yA], bend), bot = curvePts([x0 + 6, yZ], [x1 - 6, yZ], -bend);
    const at = curveApex([x0 + 6, yA], [x1 - 6, yA], bend), ab = curveApex([x0 + 6, yZ], [x1 - 6, yZ], -bend);
    return { top, bot, labT: [at[0], at[1] - 18 - arcSize * 0.35], labB: [ab[0], ab[1] + 18 + arcSize * 0.35], F: tex(ar.tex) };
  });
  // layout rules: no text over lines
  const lines: Pt[][] = [lineT, lineB, ...links, ...tg.flatMap(g => [tickPts(g.x, yT), tickPts(g.x, yB)]), ...arcG.flatMap(g => [g.top, g.bot])];
  if (unitBox) lines.push(rectPts(unitBox.x0, unitBox.y0, unitBox.w, unitBox.h, 20));
  const labels: Box[] = [...tg.flatMap(g => [g.bt, g.bb]),
    ...arcG.flatMap(g => [texBox(g.F, g.labT[0], g.labT[1], { size: arcSize, align: 'center' }), texBox(g.F, g.labB[0], g.labB[1], { size: arcSize, align: 'center' })])];
  labels.forEach(b => check(!hitsLines(b, lines, 3), NAME, 'a label would sit on a line: use fewer units'));
  const nameT: Pt = [xL - 48, yT], nameB: Pt = [xL - 48, yB];
  const all = unionBox([...labels, box(f.x, yT - 20, xR, yB + 20)]);
  check(all.y0 >= f.y - 1 && all.y1 <= f.y + f.h + 1, NAME, 'the arcs do not fit in the frame height');

  return {
    kind: NAME, steps: DNL_STEPS, box: all, maths: M, x: X, yTop: yT, yBottom: yB,
    draw(c: Canvas, p: Progress<DoubleNumberLineStep>) {
      const kl = p.k('lines'), kt = p.k('ticks'), ku = p.k('unit'), ka = p.k('arcs'), kg = p.k('target'), kans = p.k('answer');
      // names + lines
      texDraw(c, NF[0], nameT[0], nameT[1], { size: nameSize, align: 'right', col: roles[0], k: kl });
      texDraw(c, NF[1], nameB[0], nameB[1], { size: nameSize, align: 'right', col: roles[1], k: clamp(kl * 1.2 - 0.2) });
      arrow(c, lineT, kl, { col: 'ink', lw: th.lw.thin + 0.5, head: 16 });
      arrow(c, lineB, clamp(kl * 1.15 - 0.15), { col: 'ink', lw: th.lw.thin + 0.5, head: 16 });
      // unit multiples: tick + labels + dashed link, left to right
      const mult = tg.filter(g => g.t.kind === 'unit-multiple');
      mult.forEach((g, i) => {
        const k = clamp(kt * (1 + mult.length * 0.25) - i * 0.25);
        if (k <= 0) return;
        drawOn(c, tickPts(g.x, yT), k, { col: 'ink', lw: th.lw.thin });
        drawOn(c, tickPts(g.x, yB), k, { col: 'ink', lw: th.lw.thin });
        drawOn(c, links[g.i]!, clamp(k * 1.4 - 0.4), { col: 'faint', lw: th.lw.thin, dash: [8, 9], cap: 'butt' });
        texDraw(c, g.FT, g.x, baseT, { ...LT, col: roles[0], k });
        texDraw(c, g.FB, g.x, baseB, { ...LT, col: roles[1], k: clamp(k * 1.3 - 0.3) });
      });
      // the unit rate: its tick (if new), then the box
      if (unitG && ku > 0) {
        const kk = clamp(ku / 0.6), kb = clamp((ku - 0.35) / 0.65);
        if (unitG.t.kind === 'unit-rate') {
          drawOn(c, tickPts(unitG.x, yT), kk, { col: acc, lw: th.lw.base });
          drawOn(c, tickPts(unitG.x, yB), kk, { col: acc, lw: th.lw.base });
          drawOn(c, links[unitG.i]!, kk, { col: acc, lw: th.lw.thin, dash: [8, 9], cap: 'butt' });
          texDraw(c, unitG.FT, unitG.x, baseT, { ...LT, col: roles[0], k: kk });
          texDraw(c, unitG.FB, unitG.x, baseB, { ...LT, col: roles[1], k: clamp(kk * 1.3 - 0.3) });
        }
        if (unitBox) {
          halo(c, unitBox.cx, unitBox.cy, unitBox.h * 0.8, acc, 0.14 * kb);
          drawOn(c, rectPts(unitBox.x0, unitBox.y0, unitBox.w, unitBox.h, 20), kb, { col: acc, lw: th.lw.base, closed: true, glow: 12, glowCol: acc });
        }
      }
      // ×n arcs on both lines
      arcG.forEach(g => {
        if (ka <= 0) return;
        const k = clamp(ka / 0.75), kl2 = clamp((ka - 0.4) / 0.6);
        arrow(c, g.top, k, { col: acc, lw: th.lw.base, head: 18 });
        arrow(c, g.bot, k, { col: acc, lw: th.lw.base, head: 18 });
        texDraw(c, g.F, g.labT[0], g.labT[1], { size: arcSize, align: 'center', col: acc, k: kl2 });
        texDraw(c, g.F, g.labB[0], g.labB[1], { size: arcSize, align: 'center', col: acc, k: kl2 });
      });
      // the target: its tick and top value, a ? below, then the answer
      const tgt = M.target ? tg.find(g => qEq(g.t.top, M.target!.top)) : undefined;
      if (tgt && kg > 0) {
        const isNew = tgt.t.kind === 'target';
        if (isNew) {
          drawOn(c, tickPts(tgt.x, yT), kg, { col: 'ink', lw: th.lw.base });
          drawOn(c, tickPts(tgt.x, yB), kg, { col: 'ink', lw: th.lw.base });
          drawOn(c, links[tgt.i]!, kg, { col: 'faint', lw: th.lw.thin, dash: [8, 9], cap: 'butt' });
          texDraw(c, tgt.FT, tgt.x, baseT, { ...LT, col: roles[0], k: kg });
        }
        halo(c, tgt.bt.cx, tgt.bt.cy, numSize * 1.1, roles[0], 0.2 * E.bump(kg));
        const q = tex('?');
        if (kans < 1) texDraw(c, q, tgt.x, baseB, { ...LT, col: 'dim', k: kg, alpha: 1 - kans });
      }
      if (tgt && kans > 0) {
        const bb = tgt.bb;
        halo(c, bb.cx, bb.cy, bb.w + 60, acc, 0.22 * kans);
        texDraw(c, tgt.FB, tgt.x, baseB, { ...LT, col: roles[1], k: kans, glow: 18 * E.bump(kans) });
        drawOn(c, rectPts(bb.x0 - 18, bb.y0 - 14, bb.w + 36, bb.h + 28, 18), clamp((kans - 0.3) / 0.7), { col: acc, lw: th.lw.base, closed: true });
      }
    },
  };
}

export const DNL_DEMO = {
  params: { a: 2, b: 3, count: 4, labels: ['lemon', 'water'], unitRate: true, target: 5 } satisfies DoubleNumberLineParams,
  specs: [
    { key: 'a', label: 'a (top per unit)', min: 0, max: 10, step: 1 },
    { key: 'b', label: 'b (bottom per unit)', min: 0, max: 10, step: 1 },
    { key: 'count', label: 'units', min: 1, max: 14, step: 1 },
    { key: 'unitRate', label: 'unit rate', min: 0, max: 1, step: 1 },
    { key: 'target', label: 'target (0 = none)', min: 0, max: 30, step: 1 },
  ] as const satisfies readonly ParamSpec<{ a: number; b: number; count: number; unitRate: number; target: number }>[],
};
export const dnlDemoParams = (v: { a: number; b: number; count: number; unitRate: number; target: number }): DoubleNumberLineParams => ({
  a: v.a, b: v.b, count: v.count, labels: ['lemon', 'water'], unitRate: !!v.unitRate, target: v.target > 0 ? v.target : null, arcs: v.target > 0 || v.count < 2 ? [] : [v.count],
});
