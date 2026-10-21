// Sampler: the model of "one random sample, then many". Up to two parts, stacked in a Frame:
//   roster   the population as a card of name slips (amber outline = the whole group the question is about); the
//            randomly drawn slips light teal ('pick'). One slip per member up to 200, else one per `per` members.
//   rows     dot plots on ONE shared number line (crisp axis, numbers >= 60 px under the last row only): the values of
//            one sample (dots fly down from the drawn slips), the means of many samples (one dot = one sample), two
//            groups to compare, or a box plot. Each row may carry a mark (a triangle under its line: a mean / median).
//   pop      an amber dashed line through every row at the population mean (known only in a simulation)
//   bands    lime bands of +- d round a value on a row ("most land within d"), steps band0, band1
//   gap      a lime ruler between the marks of two rows, in steps of one spread unit (MAD / IQR)
// Steps: roster, pick, row0..row3, mark0..mark3, pop, band0.., gap. `where` boxes for leaders and pulses.
// Colour roles: first (amber) = the population, second (teal) = a sample / its values, link (lime) = the estimate
// and the key relation, pick (lavender) = focus. Throws (BlockError) instead of drawing something unreadable.
import { type Box, type Pt, box, clamp, lag, lerp, padBox, unionBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dashLine, fillPts, strokePts } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint, rgba } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';

export interface SamplerRow {
  /** words above the row, e.g. 'one sample of 10' */
  label: string;
  values: readonly number[];
  col: Paint;
  /** stacking bin (default: the axis minor step); 0 = every dot at its exact value, stacked where dots would touch */
  bin?: number;
  /** a box plot (min, Q1, median, Q3, max) instead of dots */
  box?: { q: readonly [number, number, number, number, number] };
  /** a triangle under the row's line (a mean or a median) */
  mark?: { at: number; col: Paint };
  /** the dots fly in from the drawn slips (values in draw order; needs roster.picks of the same length) */
  fly?: boolean;
  /** the largest dot radius (default 17) */
  r?: number;
}
export interface SamplerParams {
  roster?: {
    N: number;
    /** e.g. '200 seventh graders' (amber, above the card) */
    label: string;
    /** the drawn members (roster positions, 0-based) */
    picks?: readonly number[];
    /** one slip stands for `per` members (N and every pick count must divide) */
    per?: number;
    /** e.g. 'students' for the '1 slip = 10 students' note */
    unit?: string;
    pickCol?: Paint;
  };
  axis: { lo: number; hi: number; major: number; minor: number; unit: string };
  rows: SamplerRow[];
  pop?: { at: number; label: string };
  bands?: { row: number; at: number; d: number }[];
  gap?: { rowA: number; rowB: number; unit: number };
}
export type SamplerStep = 'roster' | 'pick' | 'pop' | 'gap' | `row${number}` | `mark${number}` | `band${number}`;
export interface SamplerFocus {
  /** 0..1 dim per row */
  dim?: readonly number[];
  /** 0..1 pulse of the roster label / of each row label */
  pRoster?: number; pRows?: readonly number[];
  /** 0..1 pulse of the pop label */
  pPop?: number;
  /** 0..1 lift of the drawn slips (teal glow) */
  glowPicks?: number;
}
interface RowLay {
  base: number; top: number; labelY: number; r: number;
  dots: Pt[]; label: Box; area: Box; markBox: Box | null;
}
export interface SamplerBlock {
  readonly kind: 'Sampler';
  readonly box: Box;
  readonly x: (v: number) => number;
  readonly where: {
    roster: Box | null; rosterLabel: Box | null; picks: Box | null;
    rows: Box[]; rowLabels: Box[]; marks: (Box | null)[]; pop: Box | null; popLabel: Box | null; bands: Box[]; gap: Box | null;
  };
  draw(c: Canvas, p: Progress<SamplerStep>, f?: SamplerFocus): void;
}

const NAME = 'Sampler';
const LAB = 46, NUM = 62, UNIT = 44;
const SLIP = '#8C90BC', CARD = '#262A57', PLOT = '#1B1F42';

export function Sampler(P: SamplerParams, fr: Frame, th: Theme): SamplerBlock {
  const A = P.axis;
  check(A.hi > A.lo && A.major > 0 && A.minor > 0, NAME, 'the axis is empty');
  check(P.rows.length <= 4 && (P.rows.length >= 1 || !!P.roster), NAME, `1 to 4 rows, or a roster alone (got ${P.rows.length})`);
  for (const r of P.rows) for (const v of r.values) check(v >= A.lo - 1e-9 && v <= A.hi + 1e-9, NAME, `the value ${v} is off the axis ${A.lo} to ${A.hi}`);
  const ax0 = fr.x + 56, ax1 = fr.x + fr.w - 70;
  const X = (v: number) => ax0 + ((v - A.lo) / (A.hi - A.lo)) * (ax1 - ax0);
  let y = fr.y;

  // ---------- roster ----------
  let rosterB: Box | null = null, rosterLabelB: Box | null = null, picksB: Box | null = null;
  const slips: Pt[] = [];
  let slipW = 0, slipH = 0;
  const picks = P.roster?.picks ?? [];
  const per = P.roster?.per ?? 1;
  let note: { t: string; b: Box } | null = null;
  if (P.roster) {
    const R0 = P.roster;
    check(R0.N % per === 0, NAME, `${R0.N} is not a whole number of slips of ${per}`);
    const marks = R0.N / per;
    check(marks >= 4 && marks <= 220, NAME, `${marks} slips is not a readable roster`);
    for (const i of picks) check(Number.isInteger(i) && i >= 0 && i < marks, NAME, `slip ${i} is not on the roster`);
    check(new Set(picks).size === picks.length, NAME, 'a slip was drawn twice (a sample is drawn without replacement)');
    rosterLabelB = wordsBox(R0.label, fr.x + 8, y + 26, { size: LAB });
    check(rosterLabelB.x1 <= fr.x + fr.w, NAME, `"${R0.label}" is too long`);
    y += 60;
    const cols = marks > 120 ? 25 : marks > 60 ? 20 : marks > 24 ? 12 : marks;
    const rowsN = Math.ceil(marks / cols);
    const s = Math.min(36, Math.floor((fr.w - 40) / cols), Math.floor(300 / rowsN));
    check(s >= 22, NAME, `slips of ${s} px are too small`);
    slipW = s * 0.74; slipH = s * 0.52;
    const gw = cols * s, gx = fr.x + (fr.w - gw) / 2;
    rosterB = box(gx - 18, y, gx + gw + 18, y + rowsN * s + 24);
    for (let i = 0; i < marks; i++) slips.push([gx + (i % cols) * s + s / 2, y + 12 + Math.floor(i / cols) * s + s / 2]);
    if (picks.length) picksB = unionBox(picks.map(i => box(slips[i]![0] - slipW / 2, slips[i]![1] - slipH / 2, slips[i]![0] + slipW / 2, slips[i]![1] + slipH / 2)));
    y = rosterB.y1 + 8;
    if (per > 1) {
      // the scale note sits under the card, at its right edge
      const t = `1 slip = ${per} ${R0.unit ?? 'members'}`;
      note = { t, b: wordsBox(t, rosterB.x1, rosterB.y1 + 30, { size: UNIT, align: 'right' }) };
      y = note.b.y1 + 8;
    }
    y += 14;
  }

  // ---------- vertical budget for the rows ----------
  const bottom = fr.y + fr.h;
  if (P.rows.length === 0) return rosterOnly();
  const axisH = 64 + 54;                   // numbers + unit word under the last line
  const popH = P.pop ? 56 : 0;
  const gapH = P.gap ? 64 : 0;
  const nR = P.rows.length;
  const labH = 56, markH = 34;
  const SEP = 26;                          // air between a row's line and the next row's label
  const free = bottom - axisH - y - popH - gapH - SEP * (nR - 1);
  const rowH = free / nR;
  check(rowH >= labH + markH + 40, NAME, `rows of ${Math.round(rowH)} px are too short`);
  const popLabelY = y + 24;
  y += popH;
  const rows: RowLay[] = [];
  const minorPx = (ax1 - ax0) * A.minor / (A.hi - A.lo);
  P.rows.forEach((row, ri) => {
    const labelY = y + 24;
    const top = y + labH;
    const markSpace = row.mark || row.box ? markH : 10;
    const base = y + rowH - markSpace;
    const label = wordsBox(row.label, ax0 - 30, labelY, { size: LAB });
    check(label.x1 <= fr.x + fr.w, NAME, `"${row.label}" is too long`);
    const dots: Pt[] = [];
    let r = 0;
    if (!row.box && row.bin === 0) {
      // exact positions: a dot rises one level where it would touch a dot already placed
      const xs = row.values.map(X);
      const avail = base - top - 4;
      for (r = row.r ?? 17; r >= 5.5; r -= 0.5) {
        const lv: number[] = [];
        xs.forEach((x, i) => { let l = 0; while (xs.some((x2, j) => j < i && lv[j] === l && Math.abs(x2 - x) < 2 * r - 0.5)) l++; lv.push(l); });
        if ((Math.max(...lv) + 1) * 2 * r <= avail) { lv.forEach((l, i) => dots.push([xs[i]!, base - 3 - r - l * 2 * r])); break; }
      }
      check(dots.length === row.values.length, NAME, `"${row.label}": the dots do not fit`);
    } else if (!row.box) {
      const bin = row.bin ?? A.minor;
      const binPx = (ax1 - ax0) * bin / (A.hi - A.lo);
      const counts = new Map<number, number>();
      const idx = row.values.map(v => Math.round((v - A.lo) / bin));
      for (const k of idx) counts.set(k, (counts.get(k) ?? 0) + 1);
      const stack = Math.max(1, ...counts.values());
      r = Math.min(row.r ?? 17, binPx / 2 - 1, (base - top - 4) / (2 * stack));
      check(r >= 5.5, NAME, `"${row.label}": ${stack} dots in one stack need dots of ${r.toFixed(1)} px`);
      const used = new Map<number, number>();
      for (const k of idx) { const j = used.get(k) ?? 0; used.set(k, j + 1); dots.push([X(A.lo + k * bin), base - 3 - r - j * 2 * r]); }
    } else check(base - top >= 60, NAME, 'a box plot needs 60 px');
    const markBox = row.mark ? box(X(row.mark.at) - 17, base + 6, X(row.mark.at) + 17, base + 34) : null;
    if (row.mark) check(row.mark.at >= A.lo && row.mark.at <= A.hi, NAME, 'the mark is off the axis');
    if (row.fly) check(picks.length === row.values.length && slips.length > 0, NAME, 'flying dots need one drawn slip per value');
    const area = box(ax0, top - 6, ax1, base);
    rows.push({ base, top, labelY, r, dots, label, area, markBox });
    y += rowH + SEP;
    if (P.gap && ri === P.gap.rowA) y += gapH;
  });
  void minorPx;
  const lastBase = rows[nR - 1]!.base;
  const numY = lastBase + (P.rows[nR - 1]!.mark || P.rows[nR - 1]!.box ? markH : 10) + 34;
  const ticks: number[] = [];
  for (let v = A.lo; v <= A.hi + 1e-9; v += A.major) ticks.push(v);
  const numBoxes = ticks.map(v => wordsBox(String(+v.toFixed(4)), X(v), numY, { size: NUM, align: 'center' }));
  for (let i = 1; i < numBoxes.length; i++) check(numBoxes[i]!.x0 - numBoxes[i - 1]!.x1 >= 16, NAME, 'the axis numbers touch');
  const unitB = wordsBox(A.unit, (ax0 + ax1) / 2, numY + 58, { size: UNIT, align: 'center' });
  check(unitB.y1 <= bottom + 6, NAME, 'the axis runs off the frame');

  // ---------- overlays ----------
  let popB: Box | null = null, popLabelB: Box | null = null;
  if (P.pop) {
    const x = X(P.pop.at);
    popB = box(x - 4, rows[0]!.top - 10, x + 4, lastBase + 4);
    const right = wordsBox(P.pop.label, x + 14, popLabelY, { size: LAB });
    popLabelB = right.x1 <= fr.x + fr.w ? right : wordsBox(P.pop.label, x - 14, popLabelY, { size: LAB, align: 'right' });
    check(popLabelB.x0 >= fr.x - 10, NAME, `"${P.pop.label}" does not fit beside the line`);
  }
  const bandBs = (P.bands ?? []).map(bd => { const R = rows[bd.row]!; check(!!R, NAME, 'a band needs its row'); return box(X(bd.at - bd.d), R.top - 4, X(bd.at + bd.d), R.base); });
  let gapB: Box | null = null, gapY = 0;
  if (P.gap) {
    const a = P.rows[P.gap.rowA]!.mark, b = P.rows[P.gap.rowB]!.mark;
    check(!!a && !!b, NAME, 'the gap ruler runs between two marks');
    check(P.gap.unit > 0, NAME, 'the ruler unit must be positive');
    gapY = rows[P.gap.rowA]!.base + markH + gapH / 2 - 4;
    gapB = box(Math.min(X(a!.at), X(b!.at)), gapY - 14, Math.max(X(a!.at), X(b!.at)), gapY + 14);
    check((X(P.gap.unit) - X(0)) >= 14, NAME, 'one ruler unit is too short to see');
  }
  const all = unionBox([...(rosterB ? [rosterB] : []), ...rows.map(r => r.area), unitB]);

  // ---------- drawing ----------
  const markTri = (c: Canvas, x: number, base: number, col: Paint, k: number) => {
    const s = 17 * E.out(clamp(k));
    if (s <= 0) return;
    const T: Pt[] = [[x, base + 7], [x + s, base + 7 + 1.6 * s], [x - s, base + 7 + 1.6 * s]];
    fillPts(c, T, col);
    strokePts(c, [...T, T[0]!], { col: DUSK.ink, lw: 2.5 });
  };
  function drawRoster(c: Canvas, p: Progress<SamplerStep>, f: SamplerFocus): void {
    const g = c.g;
    const kR = p.k('roster');
    if (P.roster && rosterB && kR > 0) {
      g.save(); g.globalAlpha *= clamp(kR);
      wash(c, rectPts(rosterB.x0, rosterB.y0, rosterB.w, rosterB.h, 16), CARD, { seed: 31, rough: 1.6, ink: 'first', inkW: 3.5, shade: 0.1 });
      const pr = f.pRoster ?? 0;
      drawWords(c, P.roster.label, rosterLabelB!.x0, rosterLabelB!.cy, 'first', kR, { size: LAB });
      if (pr > 0) { g.save(); g.globalAlpha *= pr * 0.5; g.fillStyle = rgba(paint(th, 'first', 'fill'), 0.35); g.fillRect(rosterLabelB!.x0 - 10, rosterLabelB!.y0 - 6, rosterLabelB!.w + 20, rosterLabelB!.h + 12); g.restore(); }
      if (note) drawWords(c, note.t, note.b.x1, note.b.cy, 'dim', kR, { size: UNIT, align: 'right' });
      const kP = p.k('pick');
      const pickSet = new Map(picks.map((i, j) => [i, j] as const));
      slips.forEach((s, i) => {
        const j = pickSet.get(i);
        const kk = j === undefined ? 0 : E.out(lag(kP, j, picks.length, 0.5));
        const w = slipW * (1 + 0.18 * kk), h = slipH * (1 + 0.18 * kk);
        g.fillStyle = kk > 0 ? mixHex(SLIP, paint(th, P.roster!.pickCol ?? 'second', 'fill'), kk) : SLIP;
        g.globalAlpha = clamp(kR) * (kk > 0 ? 1 : 0.85);
        roundRect(g, s[0] - w / 2, s[1] - h / 2, w, h, 3);
        g.fill();
        if (kk > 0.05) { g.strokeStyle = DUSK.ink; g.lineWidth = 2; g.stroke(); }
      });
      g.globalAlpha = clamp(kR);
      if ((f.glowPicks ?? 0) > 0 && picksB) {
        g.save(); g.globalAlpha *= f.glowPicks!;
        for (const i of picks) { const s = slips[i]!; g.strokeStyle = paint(th, 'second', 'line'); g.lineWidth = 3; roundRect(g, s[0] - slipW / 2 - 5, s[1] - slipH / 2 - 5, slipW + 10, slipH + 10, 5); g.stroke(); }
        g.restore();
      }
      g.restore();
    }
  }
  function draw(c: Canvas, p: Progress<SamplerStep>, f: SamplerFocus = {}): void {
    const g = c.g;
    drawRoster(c, p, f);
    // the plot panel (one calm slate behind every row)
    const top = rows[0]!.labelY - 34 - popH;
    wash(c, rectPts(fr.x, top, fr.w, unitB.y1 + 14 - top, 18), PLOT, { seed: 41, rough: 1.2, ink: null, shade: 0.05 });
    // bands (under the dots)
    (P.bands ?? []).forEach((bd, bi) => {
      const bandB = bandBs[bi]!;
      const k = p.k(`band${bi}`);
      if (k > 0) {
        const cx = X(bd.at), hw = (bandB.w / 2) * E.out(clamp(k));
        g.save();
        g.fillStyle = rgba(paint(th, 'link', 'fill'), 0.16 * clamp(k * 2));
        g.fillRect(cx - hw, bandB.y0, 2 * hw, bandB.h);
        strokePts(c, [[cx - hw, bandB.y0], [cx - hw, bandB.y1]], { col: 'link', lw: 3, alpha: clamp(k * 2) });
        strokePts(c, [[cx + hw, bandB.y0], [cx + hw, bandB.y1]], { col: 'link', lw: 3, alpha: clamp(k * 2) });
        g.restore();
      }
    });
    // rows
    P.rows.forEach((row, ri) => {
      const L = rows[ri]!;
      const k = p.k(`row${ri}`);
      const dim = 1 - 0.6 * clamp(f.dim?.[ri] ?? 0);
      g.save(); g.globalAlpha *= dim;
      // the line and its ticks: always there once anything is (a calm frame for the dots)
      const kl = Math.max(clamp(k * 3), p.k('roster') > 0 ? 0 : 0);
      const lineK = Math.max(kl, clamp(p.k(`mark${ri}`) * 3));
      if (lineK > 0) {
        g.save(); g.globalAlpha *= lineK;
        strokePts(c, [[ax0 - 16, L.base], [ax1 + 16, L.base]], { col: 'dim', lw: 3 });
        for (let v = A.lo; v <= A.hi + 1e-9; v += A.minor) {
          const major = Math.abs(v / A.major - Math.round(v / A.major)) < 1e-9;
          strokePts(c, [[X(v), L.base], [X(v), L.base + (major ? 14 : 7)]], { col: 'dim', lw: major ? 3 : 2 });
        }
        const pl = f.pRows?.[ri] ?? 0;
        if (pl > 0) { g.save(); g.globalAlpha *= pl * 0.5; g.fillStyle = rgba(paint(th, row.col, 'fill'), 0.35); g.fillRect(L.label.x0 - 10, L.label.y0 - 6, L.label.w + 20, L.label.h + 12); g.restore(); }
        drawWords(c, row.label, L.label.x0, L.labelY, 'dim', lineK, { size: LAB });
        g.restore();
      }
      if (k > 0) {
        if (row.box) drawBox(c, row.box.q, L, row.col, k);
        else {
          const n = row.values.length;
          L.dots.forEach((d, i) => {
            const kk = lag(k, i, n, row.fly ? 0.55 : 0.75);
            if (kk <= 0) return;
            let pt: Pt = d;
            if (row.fly) {
              const s = slips[picks[i]!]!, e = E.inOut(kk);
              pt = [lerp(s[0], d[0], e), lerp(s[1], d[1], e) - Math.sin(Math.PI * e) * 40];
            }
            const rr = row.fly ? lerp(slipH / 2, L.r, E.inOut(kk)) : L.r * E.out(clamp(kk * 1.5));
            g.beginPath(); g.arc(pt[0], pt[1], Math.max(0.5, rr), 0, Math.PI * 2);
            g.fillStyle = paint(th, row.col, 'fill'); g.fill();
            g.strokeStyle = DUSK.ink; g.lineWidth = Math.min(2.5, L.r * 0.22); g.stroke();
          });
        }
      }
      if (row.mark) markTri(c, X(row.mark.at), L.base, row.mark.col, p.k(`mark${ri}`));
      g.restore();
    });
    // the axis numbers under the last row
    const kAx = Math.max(...P.rows.map((_, ri) => p.k(`row${ri}`)), ...P.rows.map((_, ri) => p.k(`mark${ri}`)));
    if (kAx > 0) {
      ticks.forEach((v, i) => drawWords(c, String(+v.toFixed(4)), numBoxes[i]!.cx, numY, 'ink', clamp(kAx * 2), { size: NUM, align: 'center' }));
      drawWords(c, A.unit, unitB.cx, unitB.cy, 'dim', clamp(kAx * 2), { size: UNIT, align: 'center' });
    }
    // the population mean line
    if (P.pop && popB) {
      const k = p.k('pop');
      if (k > 0) {
        const x = popB.cx, yEnd = lerp(popB.y0, popB.y1, E.inOut(clamp(k)));
        g.save();
        // a stub under the label, then one segment per row's plot area (never through a row label)
        const stub1 = Math.min(rows[0]!.label.y0 - 6, yEnd);
        if (stub1 > popLabelB!.y1 + 4) dashLine(c, [x, popLabelB!.y1 + 2], [x, stub1], { col: 'first', lw: 4.5 });
        for (const L of rows) {
          const a0 = L.label.x1 + 8 > x && L.label.x0 - 8 < x ? L.top - 8 : L.label.y0 - 4, a1 = Math.min(L.base + 4, yEnd);
          if (a1 > a0) dashLine(c, [x, a0], [x, a1], { col: 'first', lw: 4.5 });
        }
        const pp = f.pPop ?? 0;
        if (pp > 0) { g.save(); g.globalAlpha *= pp * 0.5; g.fillStyle = rgba(paint(th, 'first', 'fill'), 0.35); g.fillRect(popLabelB!.x0 - 10, popLabelB!.y0 - 6, popLabelB!.w + 20, popLabelB!.h + 12); g.restore(); }
        drawWords(c, P.pop.label, popLabelB!.x0, popLabelB!.cy, 'first', clamp(k * 1.5), { size: LAB });
        g.restore();
      }
    }
    // the gap ruler between two marks, in spread units
    if (P.gap && gapB) {
      const k = p.k('gap');
      if (k > 0) {
        const a = P.rows[P.gap.rowA]!.mark!.at, b = P.rows[P.gap.rowB]!.mark!.at;
        const lo = Math.min(a, b), hi = Math.max(a, b), u = P.gap.unit;
        const xa = X(a), xb = X(b);
        g.save();
        dashLine(c, [xa, rows[P.gap.rowA]!.base + 34], [xa, gapY], { col: 'dim', lw: 2.5 });
        // the guide down to row B stops above its label and resumes under it (never through the words)
        const LB = rows[P.gap.rowB]!;
        if (LB.label.x0 - 8 < xb && LB.label.x1 + 8 > xb) {
          dashLine(c, [xb, gapY], [xb, LB.label.y0 - 6], { col: 'dim', lw: 2.5 });
          dashLine(c, [xb, LB.label.y1 + 6], [xb, LB.top - 2], { col: 'dim', lw: 2.5 });
        } else dashLine(c, [xb, gapY], [xb, LB.top - 2], { col: 'dim', lw: 2.5 });
        const nSeg = Math.ceil((hi - lo) / u - 1e-9);
        for (let i = 0; i < nSeg; i++) {
          const s0 = lo + i * u, s1 = Math.min(hi, s0 + u);
          const kk = clamp(k * nSeg - i);
          if (kk <= 0) break;
          const x0 = X(s0), x1 = lerp(x0, X(s1), E.out(kk));
          const R: Pt[] = [[x0, gapY - 11], [x1, gapY - 11], [x1, gapY + 11], [x0, gapY + 11]];
          fillPts(c, R, i % 2 ? rgba(paint(th, 'link', 'fill'), 0.35) : 'link');
          strokePts(c, [...R, R[0]!], { col: DUSK.ink, lw: 2 });
        }
        g.restore();
      }
    }
  }
  function rosterOnly(): SamplerBlock {
    check(!!rosterB, NAME, 'nothing to draw');
    const drawR = (c: Canvas, p: Progress<SamplerStep>, f: SamplerFocus = {}) => drawRoster(c, p, f);
    return {
      kind: 'Sampler', box: rosterB!, x: X,
      where: { roster: rosterB, rosterLabel: rosterLabelB, picks: picksB, rows: [], rowLabels: [], marks: [], pop: null, popLabel: null, bands: [], gap: null },
      draw: drawR,
    };
  }
  function drawBox(c: Canvas, q: readonly [number, number, number, number, number], L: RowLay, col: Paint, k: number): void {
    const [mn, q1, md, q3, mx] = q;
    const cy = (L.top + L.base) / 2, hh = Math.min(36, (L.base - L.top) / 2 - 4);
    const g = c.g;
    g.save(); g.globalAlpha *= clamp(k * 1.5);
    strokePts(c, [[X(mn), cy], [X(q1), cy]], { col, lw: 4 });
    strokePts(c, [[X(q3), cy], [X(mx), cy]], { col, lw: 4 });
    strokePts(c, [[X(mn), cy - hh * 0.5], [X(mn), cy + hh * 0.5]], { col, lw: 4 });
    strokePts(c, [[X(mx), cy - hh * 0.5], [X(mx), cy + hh * 0.5]], { col, lw: 4 });
    const R: Pt[] = [[X(q1), cy - hh], [X(q3), cy - hh], [X(q3), cy + hh], [X(q1), cy + hh]];
    fillPts(c, R, rgba(paint(th, col, 'fill'), 0.35));
    strokePts(c, [...R, R[0]!], { col, lw: 4 });
    strokePts(c, [[X(md), cy - hh], [X(md), cy + hh]], { col: 'ink', lw: 5 });
    g.restore();
  }
  void inkLine; void padBox;
  return {
    kind: 'Sampler', box: all, x: X,
    where: {
      roster: rosterB, rosterLabel: rosterLabelB, picks: picksB,
      rows: rows.map(r => r.area), rowLabels: rows.map(r => r.label), marks: rows.map(r => r.markBox),
      pop: popB, popLabel: popLabelB, bands: bandBs, gap: gapB,
    },
    draw,
  };
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}
function mixHex(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp(k)));
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}
