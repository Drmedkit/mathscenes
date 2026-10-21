// SampleMap: the model of "who the question is about vs. who gave the data". A map of the population as one painted
// region (amber outline = the whole group the question is about), every member a small mark (a person, an apple, a
// day, a phone), and the group that supplied the data ringed in teal:
//   census     the ring hugs the whole population
//   part       the asked members sit in their own block at the right of the map (nearest the board); the rest are
//              the members the data do not cover, shaded lavender when the lesson points at them ("left out")
//   different  the asked group is a separate box OUTSIDE the population
// Answers (no reply, no, yes from left to right): a yes is a filled cream mark, a no a dark mark with a cream ring, no reply a dashed teal ring; the
// completion focus fills the no-reply marks all-yes or all-no (every way the missing could have answered).
// The supported conclusion is a lime outline (around the asked group, or the whole map for a census); an
// overreaching claim is a red dashed outline around the population.
// Steps: pop, dots, sample, answers, leftOut, scope, over. One mark per member when the population has at most 300
// (and the outside group at most 120); a bigger group gets one mark per k members (k divides both counts, a
// '1 mark = k students' note under the map), or, failing that, a crowd of 240 with the asked block to scale.
import { type Box, type Pt, box, clamp, lag, padBox, unionBox } from '../../../core/math';
import { rectPts, circlePts, arcPts } from '../../../core/pts';
import { type Canvas, drawOn, fillPts, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint, rgba } from '../../../core/theme';
import { type Frame, check, plainText } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { computeStudy, type Match, type Study } from './sampling';

export type Mark = 'person' | 'apple' | 'day' | 'phone';
export interface SampleMapParams {
  /** the population on the map, e.g. '240 seventh graders' (amber, above the map) */
  popLabel: string;
  N: number;
  match: Match;
  /** the asked group, e.g. '60 at the gym' (teal, under the ring) */
  sampleLabel: string;
  n: number;
  answered?: number;
  yes?: number;
  /** the left-out part (part only), e.g. '180 not asked' (lavender, under the rest) */
  leftLabel?: string;
  /** the outside group's name above its box (different), e.g. 'parents' */
  outsideLabel?: string;
  mark?: Mark;
  /** what one member is called, plural ('students', 'apples', 'days'): the scale legend of a big population */
  unit?: string;
  /** 'asked' for people, 'checked' for days and things (legend: 'not asked') */
  verb?: string;
  /** draw the answer legend under the map (default: when answers are drawn) */
  legend?: boolean;
}
export type SampleMapStep = 'pop' | 'dots' | 'sample' | 'answers' | 'leftOut' | 'scope' | 'over';
export const SAMPLE_MAP_STEPS: readonly SampleMapStep[] = ['pop', 'dots', 'sample', 'answers', 'leftOut', 'scope', 'over'];
export interface SampleMapFocus {
  /** pulses 0..1 of the labels (a group's label lights up while its words write on the board) */
  popLabel?: number; sampleLabel?: number; leftLabel?: number;
  /** the no-reply marks shown all-yes / all-no (0..1) */
  fillYes?: number; fillNo?: number;
  /** a lime glow on the yes marks / a teal glow on the no-reply marks */
  yesGlow?: number; missGlow?: number;
  /** the scope outline goes round the whole population instead of the ring (census with missing answers) */
  scopeAll?: boolean;
}
export interface SampleMapBlock {
  readonly kind: 'SampleMap';
  readonly study: Study;
  /** one mark per member (false: a crowd to scale) */
  readonly exact: boolean;
  readonly answersShown: boolean;
  readonly box: Box;
  readonly where: {
    pop: Box; popLabel: Box; ring: Box; sampleLabel: Box; left: Box | null; leftLabel: Box | null;
    outside: Box | null; outsideLabel: Box | null; yes: Box | null; missing: Box | null; legend: Box | null;
  };
  draw(c: Canvas, p: Progress<SampleMapStep>, f?: SampleMapFocus): void;
}

const NAME = 'SampleMap';
const LABEL = 50, SMALL = 46, MIN = 44;
const PAD = 32, ZONE_GAP = 40, OUT_GAP = 60, MAX_CELL = 58, MIN_CELL = 22;
const POP_FILL = '#262A57', LEFT_DOT = '#4E5385', MEMBER = '#8C90BC', NO_FILL = '#1B1E3C';

/** layout of dots in one zone: column-major, R rows, cell s */
interface Zone { n: number; x0: number; y0: number; R: number; s: number; cols: number }
const zoneBox = (z: Zone): Box => box(z.x0, z.y0, z.x0 + z.cols * z.s, z.y0 + Math.min(z.n, z.R) * z.s);
const dotAt = (z: Zone, i: number): Pt => [z.x0 + Math.floor(i / z.R) * z.s + z.s / 2, z.y0 + (i % z.R) * z.s + z.s / 2];
function dotsBox(z: Zone, from: number, to: number): Box | null {
  if (to <= from) return null;
  const pts = Array.from({ length: to - from }, (_, k) => dotAt(z, from + k));
  const r = z.s * 0.42;
  return box(Math.min(...pts.map(p => p[0])) - r, Math.min(...pts.map(p => p[1])) - r, Math.max(...pts.map(p => p[0])) + r, Math.max(...pts.map(p => p[1])) + r);
}

export function SampleMap(p: SampleMapParams, fr: Frame, th: Theme): SampleMapBlock {
  const st = computeStudy({ N: p.N, n: p.n, match: p.match, answered: p.answered, yes: p.yes });
  plainText(p.popLabel, NAME, 'popLabel'); plainText(p.sampleLabel, NAME, 'sampleLabel');
  check(p.match !== 'different' || !!p.outsideLabel, NAME, 'a different group needs its own label');
  check(p.match === 'part' || !p.leftLabel, NAME, 'only part of a population leaves members out');
  const exact = st.N <= 300 && (st.match !== 'different' || st.n <= 120);
  // a big population: one mark per k members when k divides both counts (an honest scale), else a crowd to scale
  const ks = [2, 4, 5, 10, 20, 25, 50, 100].filter(k => st.N % k === 0 && st.n % k === 0 && st.N / k <= 300 && st.n / k >= 4 && (st.match !== 'different' || st.n / k <= 120));
  const scale = exact ? 1 : ks.find(k => st.N / k <= 160) ?? ks[0] ?? 0;
  const answersShown = exact && st.yes !== null;
  const showLegend = p.legend ?? answersShown;
  const scaleNote = scale > 1 && p.unit ? `1 mark = ${scale} ${p.unit}` : '';
  const mark = p.mark ?? 'person';

  // ---------- how many marks ----------
  const popDots = exact ? st.N : scale ? st.N / scale : 240;
  let sampleDots: number, restDots: number, outDots = 0;
  if (st.match === 'census') { sampleDots = popDots; restDots = 0; }
  else if (st.match === 'part') {
    sampleDots = exact ? st.n : scale ? st.n / scale : clamp(Math.round((st.n / st.N) * popDots), 8, 120);
    restDots = popDots - sampleDots;
    check(restDots >= 1, NAME, 'part of the population must leave someone out');
  } else { sampleDots = 0; restDots = popDots; outDots = exact ? st.n : scale ? st.n / scale : Math.min(st.n, 48); }

  // ---------- vertical budget ----------
  const labelRow = 72, belowRow = 86, legendRow = showLegend || scaleNote ? 66 : 0;
  const gridHMax = fr.h - labelRow - belowRow - legendRow - 2 * PAD;
  check(gridHMax > 200, NAME, `the frame (${fr.h} px) is too short for the map`);

  // ---------- best rows / cell size ----------
  const zonesN = st.match === 'part' ? [restDots, sampleDots] : [popDots];
  let best = { s: 0, R: 0 };
  for (let R = 2; R <= 30; R++) {
    const cols = zonesN.reduce((a, z) => a + Math.ceil(z / R), 0);
    const outCols = outDots ? Math.ceil(outDots / R) : 0;
    const fixed = 2 * PAD + (zonesN.length - 1) * ZONE_GAP + (outDots ? OUT_GAP + 2 * PAD : 0);
    let sw = (fr.w - fixed) / (cols + outCols);
    if (outDots && 2 * PAD + outCols * sw < 220) sw = (fr.w - fixed + 2 * PAD - 220) / cols;   // the outside box is at least 220 wide
    const s = Math.min(gridHMax / R, sw, MAX_CELL);
    if (s > best.s + 0.01) best = { s, R };
  }
  const { R } = best, s = Math.floor(best.s);
  check(s >= MIN_CELL, NAME, `${popDots + outDots} marks need cells of ${s} px; at least ${MIN_CELL} px is readable`);
  const rowsUsed = Math.min(R, Math.max(...zonesN, outDots));
  const gridH = rowsUsed * s;
  const colsOf = (z: number) => Math.ceil(z / R);
  // a small population still gets a wide map (room for the labels under it): the zones spread apart / centre
  const outW = outDots ? Math.max(220, 2 * PAD + colsOf(outDots) * s) : 0;
  const rawW = 2 * PAD + zonesN.reduce((a, z) => a + colsOf(z) * s, 0) + (zonesN.length - 1) * ZONE_GAP;
  const labelsW = p.leftLabel ? wordsBox(p.leftLabel, 0, 0, { size: 46 }).w + wordsBox(p.sampleLabel, 0, 0, { size: 46 }).w + 70 : 0;
  const minW = Math.min(Math.max(st.match === 'different' ? 560 : 800, labelsW), fr.w - (outDots ? OUT_GAP + outW : 0));
  const extra = Math.max(0, minW - rawW);
  const zoneGap = ZONE_GAP + (zonesN.length > 1 ? extra : 0), lead = zonesN.length > 1 ? 0 : extra / 2;
  const popW = rawW + extra;
  const totalW = popW + (outDots ? OUT_GAP + outW : 0);
  const totalH = labelRow + gridH + 2 * PAD + belowRow + legendRow;
  const x0 = fr.x + Math.max(0, (fr.w - totalW) / 2), y0 = fr.y + Math.max(0, (fr.h - totalH) / 2);
  const popB = box(x0, y0 + labelRow, x0 + popW, y0 + labelRow + gridH + 2 * PAD);
  const gy = popB.y0 + PAD;
  const zones: Zone[] = [];
  let zx = popB.x0 + PAD + lead;
  for (const z of zonesN) { zones.push({ n: z, x0: zx, y0: gy, R, s, cols: colsOf(z) }); zx += colsOf(z) * s + zoneGap; }
  const outB = outDots ? box(popB.x1 + OUT_GAP, popB.y0, popB.x1 + OUT_GAP + outW, popB.y1) : null;
  const outZone: Zone | null = outB ? { n: outDots, x0: outB.cx - (colsOf(outDots) * s) / 2, y0: gy, R, s, cols: colsOf(outDots) } : null;
  const sampleZone: Zone | null = st.match === 'part' ? zones[1]! : st.match === 'census' ? zones[0]! : outZone;
  const restZone: Zone | null = st.match === 'part' ? zones[0]! : st.match === 'different' ? zones[0]! : null;

  // the ring round the asked group
  const ring = st.match === 'census' ? padBox(popB, -12) : st.match === 'part' ? padBox(zoneBox(sampleZone!), 14) : padBox(outB!, -12);

  // ---------- labels ----------
  const labelY = y0 + labelRow / 2 - 4;
  let lsize = LABEL;
  const popLabel = () => wordsBox(p.popLabel, popB.x0, labelY, { size: lsize });
  let outLabelBox: Box | null = null;
  if (outB) {
    while (lsize > MIN && (popLabel().x1 + 30 > outB.x0 || wordsBox(p.outsideLabel!, outB.x0, labelY, { size: lsize }).x1 > fr.x + fr.w + 40)) lsize -= 2;
    outLabelBox = wordsBox(p.outsideLabel!, outB.x0, labelY, { size: lsize });
    check(popLabel().x1 + 24 <= outLabelBox.x0, NAME, `"${p.popLabel}" and "${p.outsideLabel}" overlap`);
  }
  while (lsize > MIN && popLabel().x1 > Math.max(popB.x1, fr.x + fr.w)) lsize -= 2;
  const popLabelB = popLabel();
  check(popLabelB.x1 <= fr.x + fr.w + 40, NAME, `"${p.popLabel}" is too long for the map`);

  const belowY = Math.max(popB.y1, ring.y1) + belowRow / 2 + 2;
  let bsize = 48;
  const sampleAlign: 'center' | 'right' = st.match === 'part' ? 'right' : 'center';
  const sampleX = sampleAlign === 'right' ? ring.x1 : ring.cx;
  const sLab = () => wordsBox(p.sampleLabel, sampleX, belowY, { size: bsize, align: sampleAlign });
  const lLab = () => (p.leftLabel ? wordsBox(p.leftLabel, popB.x0 + 4, belowY, { size: bsize }) : null);
  while (bsize > MIN && ((lLab() && lLab()!.x1 + 28 > sLab().x0) || sLab().x0 < fr.x - 20)) bsize -= 2;
  const sampleLabelB = sLab(), leftLabelB = lLab();
  check(!leftLabelB || leftLabelB.x1 + 24 <= sampleLabelB.x0, NAME, `"${p.leftLabel}" and "${p.sampleLabel}" overlap under the map`);
  check(sampleLabelB.x1 <= fr.x + fr.w + 60, NAME, `"${p.sampleLabel}" runs off the map`);

  // ---------- answers: no reply first, then no, then yes (column by column: the yes block is nearest the board) ----------
  const nYes = answersShown ? st.yes! : 0, nNo = answersShown ? st.no! : 0, nMiss = answersShown ? st.missing : 0;
  const yesB = answersShown && sampleZone ? dotsBox(sampleZone, nMiss + nNo, nMiss + nNo + nYes) : null;
  const missB = answersShown && sampleZone ? dotsBox(sampleZone, 0, nMiss) : null;

  // ---------- legend ----------
  const legend: { t: string; kind: 'yes' | 'no' | 'miss' | 'out' }[] = [];
  if (showLegend) {
    legend.push({ t: 'yes', kind: 'yes' }, { t: 'no', kind: 'no' });
    if (st.missing > 0) legend.push({ t: 'no reply', kind: 'miss' });
    if (st.match !== 'census') legend.push({ t: `not ${p.verb ?? 'asked'}`, kind: 'out' });
  }
  const legendY = belowY + belowRow / 2 + legendRow / 2 - 6;
  const legendItems = legend.map(() => ({ x: 0, tb: box(0, 0, 0, 0) }));
  if (legend.length) {
    let x = popB.x0 + 4;
    legend.forEach((L, i) => { const tb = wordsBox(L.t, x + 40, legendY, { size: MIN }); legendItems[i] = { x: x + 14, tb }; x = tb.x1 + 44; });
    check(x - 44 <= fr.x + fr.w + 40, NAME, 'the legend does not fit under the map');
  }
  const scaleB = scaleNote ? wordsBox(scaleNote, legend.length ? legendItems[legend.length - 1]!.tb.x1 + 60 : popB.x0 + 4, legendY, { size: MIN, weight: 500 }) : null;
  check(!scaleB || scaleB.x1 <= fr.x + fr.w + 40, NAME, 'the scale note does not fit under the map');
  const legendB = legend.length || scaleB ? unionBox([...legendItems.map(l => box(l.x - 16, l.tb.y0, l.tb.x1, l.tb.y1)), ...(scaleB ? [scaleB] : [])]) : null;

  const all = unionBox([popB, popLabelB, sampleLabelB, ...(outB ? [outB] : []), ...(legendB ? [legendB] : [])]);
  check(all.y1 <= fr.y + fr.h + 1, NAME, `the map needs ${Math.round(all.y1 - fr.y)} px, the frame has ${fr.h}`);

  // ---------- painters ----------
  function markShape(c: Canvas, x: number, y: number, r: number, fillS: string, ringS?: string, dashed = false, alpha = 1): void {
    if (alpha <= 0) return;
    const fill = fillS as Paint, ring = ringS as Paint | undefined;
    withAlpha(c, alpha, () => {
      const g = c.g;
      let P: Pt[];
      if (mark === 'person') {
        // head and shoulders
        const head = circlePts(x, y - r * 0.42, r * 0.42, 20);
        const sh = [...arcPts(x, y + r * 0.95, r * 0.88, r * 0.78, Math.PI, 2 * Math.PI, 16)];
        if (!dashed) { fillPts(c, head, fill); fillPts(c, sh, fill); }
        if (ring) { strokePts(c, head, { col: ring, lw: 2.4, closed: true, dash: dashed ? [5, 4] : null }); strokePts(c, sh, { col: ring, lw: 2.4, closed: true, dash: dashed ? [5, 4] : null }); }
        return;
      }
      if (mark === 'apple') P = circlePts(x, y + r * 0.08, r * 0.8, 24);
      else if (mark === 'day') P = rectPts(x - r * 0.78, y - r * 0.78, r * 1.56, r * 1.56, r * 0.25, 3);
      else P = rectPts(x - r * 0.5, y - r * 0.85, r, r * 1.7, r * 0.22, 3);
      if (!dashed) fillPts(c, P, fill);
      if (ring) strokePts(c, P, { col: ring, lw: 2.4, closed: true, dash: dashed ? [5, 4] : null });
      if (mark === 'apple' && !dashed) strokePts(c, [[x, y - r * 0.7], [x + r * 0.22, y - r * 1.05]], { col: '#6E4A30' as never, lw: 3 });
      void g;
    });
  }
  function labelPulse(c: Canvas, b: Box, col: 'first' | 'second' | 'pick', k: number): void {
    if (k <= 0) return;
    fillPts(c, rectPts(b.x0 - 14, b.y0 - 10, b.w + 28, b.h + 20, 14), rgba(paint(th, col, 'fill'), 1), 0.22 * k);
  }

  function draw(c: Canvas, P: Progress<SampleMapStep>, f: SampleMapFocus = {}): void {
    const kPop = P.k('pop'), kDots = P.k('dots'), kS = P.k('sample'), kA = P.k('answers'), kL = P.k('leftOut'), kSc = P.k('scope'), kO = P.k('over');
    // the population region
    if (kPop > 0) {
      withAlpha(c, E.smooth(clamp(kPop * 1.6)), () => wash(c, rectPts(popB.x0, popB.y0, popB.w, popB.h, 26), POP_FILL, { seed: 61, ink: null, rough: 1.6, shade: 0.25 }));
      drawOn(c, rectPts(popB.x0, popB.y0, popB.w, popB.h, 26), E.inOut(kPop), { col: 'first', lw: 5, closed: true });
      labelPulse(c, popLabelB, 'first', f.popLabel ?? 0);
      drawWords(c, p.popLabel, popB.x0, labelY, 'first', kPop, { size: lsize });
    }
    if (outB && kS > 0) {
      withAlpha(c, E.smooth(kS), () => wash(c, rectPts(outB.x0, outB.y0, outB.w, outB.h, 26), '#1E2F45', { seed: 62, ink: null, rough: 1.6, shade: 0.25 }));
      inkLine(c, rectPts(outB.x0, outB.y0, outB.w, outB.h, 26), { col: DUSK.rule, w: 3, closed: true, seed: 63, alpha: kS });
      drawWords(c, p.outsideLabel!, outB.x0, labelY, 'dim', kS, { size: lsize });
    }
    // the left-out part, shaded
    if (restZone && kL > 0 && st.match === 'part') {
      const b = padBox(zoneBox(restZone), 12);
      fillPts(c, rectPts(b.x0, b.y0, b.w, b.h, 18), paint(th, 'pick', 'fill'), 0.17 * E.smooth(kL));
      drawOn(c, rectPts(b.x0, b.y0, b.w, b.h, 18), E.inOut(kL), { col: 'pick', lw: 3, closed: true, dash: [12, 10], alpha: 0.8 });
    }
    // marks
    const r = s * 0.36;
    const total = zonesN.reduce((a, b) => a + b, 0) + outDots;
    let idx = 0;
    const appear = (i: number) => E.smooth(lag(kDots, i, total, 0.6));
    if (restZone) {
      for (let i = 0; i < restZone.n; i++, idx++) {
        const a = appear(idx); if (a <= 0) continue;
        const [x, y] = dotAt(restZone, i);
        const k = st.match === 'part' ? kS : 0;
        const col = kL > 0 ? LEFT_DOT : MEMBER;
        markShape(c, x, y - (1 - a) * 10, r * (1 - 0.12 * k), col, undefined, false, a * (1 - 0.35 * Math.max(k, kL)));
      }
    }
    const sz = sampleZone;
    if (sz && (st.match !== 'different' || kS > 0)) {
      for (let i = 0; i < sz.n; i++) {
        const a = st.match === 'different' ? E.smooth(lag(kS, i, sz.n, 0.5)) : appear(idx++);
        if (a <= 0) continue;
        const [x, y0d] = dotAt(sz, i), y = y0d - (1 - a) * 10;
        const teal = paint(th, 'second', 'fill');
        let fill: string = kS > 0 ? teal : MEMBER;
        if (st.match === 'different') fill = teal;
        if (answersShown && kA > 0) {
          const kind = i < nMiss ? 'miss' : i < nMiss + nNo ? 'no' : 'yes';
          const ka = E.smooth(lag(kA, i, sz.n, 0.5));
          if (kind === 'yes') { markShape(c, x, y, r, fill, undefined, false, a * (1 - ka)); markShape(c, x, y, r, DUSK.cream, undefined, false, a * ka); }
          else if (kind === 'no') { markShape(c, x, y, r, fill, undefined, false, a * (1 - ka)); markShape(c, x, y, r, NO_FILL, DUSK.cream, false, a * ka); }
          else {
            markShape(c, x, y, r, fill, undefined, false, a * (1 - ka));
            const fy = clamp(f.fillYes ?? 0), fn = clamp(f.fillNo ?? 0);
            markShape(c, x, y, r, '', teal, true, a * ka * (1 - Math.max(fy, fn)));
            if (fy > 0) markShape(c, x, y, r, DUSK.cream, teal, false, a * ka * fy);
            if (fn > 0) markShape(c, x, y, r, NO_FILL, teal, false, a * ka * fn);
          }
          continue;
        }
        markShape(c, x, y, r, fill, undefined, false, a);
      }
    }
    // glows on parts of the answers
    if (yesB && (f.yesGlow ?? 0) > 0) drawOn(c, rectPts(yesB.x0 - 6, yesB.y0 - 6, yesB.w + 12, yesB.h + 12, 12), 1, { col: 'link', lw: 3.5, closed: true, alpha: f.yesGlow });
    if (missB && (f.missGlow ?? 0) > 0) drawOn(c, rectPts(missB.x0 - 6, missB.y0 - 6, missB.w + 12, missB.h + 12, 12), 1, { col: 'second', lw: 3.5, closed: true, alpha: f.missGlow });
    // the ring round the asked group
    if (kS > 0) {
      if (st.match !== 'different') fillPts(c, rectPts(ring.x0, ring.y0, ring.w, ring.h, 20), paint(th, 'second', 'fill'), 0.07 * kS);
      drawOn(c, rectPts(ring.x0, ring.y0, ring.w, ring.h, 20), E.inOut(kS), { col: 'second', lw: 5, closed: true });
      labelPulse(c, sampleLabelB, 'second', f.sampleLabel ?? 0);
      drawWords(c, p.sampleLabel, sampleX, belowY, 'second', kS, { size: bsize, align: sampleAlign });
    }
    if (leftLabelB && kL > 0) {
      labelPulse(c, leftLabelB, 'pick', f.leftLabel ?? 0);
      drawWords(c, p.leftLabel!, popB.x0 + 4, belowY, 'pick', kL, { size: bsize });
    }
    // the conclusion's scope: lime round the group the data support
    if (kSc > 0) {
      const b = f.scopeAll ? padBox(popB, 14) : padBox(ring, 6);
      drawOn(c, rectPts(b.x0, b.y0, b.w, b.h, 26), E.inOut(kSc), { col: 'link', lw: 6, closed: true, glow: 8 });
    }
    // an overreaching claim: red dashed round the whole population
    if (kO > 0) {
      const b = padBox(popB, f.scopeAll ? 30 : 14);
      drawOn(c, rectPts(b.x0, b.y0, b.w, b.h, 30), E.inOut(kO), { col: 'wrong', lw: 5, closed: true, dash: [16, 12] });
    }
    // the scale of a big population
    if (scaleB && kPop > 0) drawWords(c, scaleNote, scaleB.x0, legendY, 'dim', kPop, { size: MIN, weight: 500 });
    // legend
    if (legend.length && kA > 0) {
      legend.forEach((L, i) => {
        const it = legendItems[i]!, x = it.x, y = legendY, rr = 17;
        const a = E.smooth(kA);
        if (L.kind === 'yes') markShape(c, x, y, rr, DUSK.cream, undefined, false, a);
        else if (L.kind === 'no') markShape(c, x, y, rr, NO_FILL, DUSK.cream, false, a);
        else if (L.kind === 'miss') markShape(c, x, y, rr, '', paint(th, 'second', 'fill'), true, a);
        else markShape(c, x, y, rr, MEMBER, undefined, false, a * 0.7);
        drawWords(c, L.t, it.tb.x0, y, 'dim', a, { size: MIN, weight: 500 });
      });
    }
  }

  return {
    kind: 'SampleMap', study: st, exact, answersShown, box: all,
    where: {
      pop: popB, popLabel: popLabelB, ring, sampleLabel: sampleLabelB,
      left: restZone && st.match === 'part' ? padBox(zoneBox(restZone), 12) : null, leftLabel: leftLabelB,
      outside: outB, outsideLabel: outLabelBox, yes: yesB, missing: missB, legend: legendB,
    },
    draw,
  };
}
void SMALL;
