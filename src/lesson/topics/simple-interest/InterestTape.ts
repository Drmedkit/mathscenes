// InterestTape: the model of simple interest as a stack of tapes, one row per year (the year-by-year table, drawn).
//   row 0   "start": the principal as one amber tape, braced "$2,000 = 100%" (the principal is the whole);
//   cells   ten dashed 10% cells on every principal tape (benchmarks: 5% is half a cell);
//   row k   "year k": the same principal tape plus k teal interest stubs. Simple interest takes the rate of the
//           PRINCIPAL every year, so every stub is the same width and they line up in columns down the stack;
//           compound interest takes it of the LATEST balance, so each stub is a little wider than the last.
//   base    a lavender ring around what the rate is taken of (the principal part only, or the whole row);
//   gain    a brace under the last row's stubs with the total interest;
//   span    one "end" row over t = months / 12 years: whole-year stubs and a partial one (a dashed full-year ghost).
// The label under each row's NEWEST stub says what that year added ("+ $100"); amounts never sit on a tape.
// Focus `compound` morphs the stubs toward the compound rule (Alex's way) and `gap` shows the compound excess as a
// dashed red ghost at the row ends. Layout and maths are pure (tapeLayout, interestMaths.ts) and tested.
// Steps: tape, whole, cells, rows, y1 .. y10, gain.
import { type Box, box, clamp, lerp } from '../../../core/math';
import { bracePts, rectPts } from '../../../core/pts';
import { type Canvas, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, type Role, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords } from '../../words';
import { type YearRow, U_CENT, compoundOrNull, interestU, roundHalfUp, usdTex } from './interestMaths';

const NAME = 'InterestTape';
export interface TapeParams {
  /** principal, cents */ P: number;
  /** annual rate, hundredths of a percent (5% = 500) */ bp: number;
  /** rows mode: the number of year rows under the start row (1-3) */ years?: number;
  /** span mode: one end row over this many months (t = months / 12) */ months?: number;
  /** which rule the stubs follow (compound needs whole cents every year) */ rule?: 'simple' | 'compound';
  /** a loan: the principal is the amount borrowed, the stubs are interest owed */ loan?: boolean;
  /** amounts shown as "?" (P: the principal; rows: the stub labels of these rows; gain: the total) */
  hide?: { P?: boolean; rows?: number[]; gain?: boolean };
}
export type TapeStep = 'tape' | 'whole' | 'cells' | 'rows' | `y${number}` | 'gain';
export interface TapeFocus {
  /** rings around what the rate is taken of: the principal part of a row, or the whole row */
  rings?: readonly { row: number; at: 'P' | 'row'; col: Role; k: number }[];
  /** pulses on the principal label / the gain label / a row's stub label */
  pulseP?: number; pulseGain?: number; pulseRow?: { row: number; k: number };
  /** 0..1: stubs morph toward the compound rule */ compound?: number;
  /** 0..1: the compound excess as a dashed ghost at the end of each row */ gap?: number;
}

// ---------- the pure layout ----------
export const TH = 68, LABEL = 44, NUM = 60;
/** stubs are drawn at least this wide so a 0.5% year still shows (they stay equal to each other) */
const MIN_STUB = 6;
export interface TapeLayout {
  n: number; span: boolean;
  x0: number; xr: number; Lp: number; scale: number;
  rowY: number[];
  /** stub x-intervals per row (index 0 = start, no stubs), per rule */
  simple: [number, number][][]; compound: [number, number][][] | null;
  /** span mode: the fraction of the last stub (1 = whole) */ lastFrac: number;
  /** stub label centre y per row, gain label centre y, principal label centre y */
  stubLabelY: number[]; gainY: number; topY: number; labelX: number;
}
export interface TapeMaths { simple: YearRow[]; compound: YearRow[] | null; yearU: number; totalU: number; months: number; stubs: number }
export function tapeMaths(p: TapeParams): TapeMaths {
  check(Number.isInteger(p.P) && p.P > 0 && p.P <= 1_000_000_00, NAME, 'principal must be $0.01 to $1,000,000');
  check(Number.isInteger(p.bp) && p.bp > 0 && p.bp <= 5000, NAME, 'rate must be 0.01% to 50%');
  const span = p.months !== undefined, years = p.years ?? 1;
  check(span ? p.months! > 0 && p.months! <= 120 : years >= 1 && years <= 3, NAME, 'rows: 1-3 years; span: up to 10 years');
  const yearU = interestU(p.P, p.bp, 12);
  const sim: YearRow[] = [{ year: 0, base: p.P, interest: 0, balance: p.P }];
  if (!span) for (let y = 1; y <= years; y++) sim.push({ year: y, base: p.P, interest: yearU / U_CENT, balance: p.P + (y * yearU) / U_CENT });
  const comp = span ? null : compoundOrNull(p.P, p.bp, years);
  check(p.rule !== 'compound' || comp, NAME, 'compound rows must be whole cents every year');
  const months = span ? p.months! : years * 12;
  return { simple: sim, compound: comp, yearU, totalU: interestU(p.P, p.bp, months), months, stubs: span ? Math.ceil(months / 12) : years };
}
export function tapeLayout(p: TapeParams, m: TapeMaths, fr: Frame): TapeLayout {
  const span = p.months !== undefined, n = span ? 2 : m.simple.length;
  const x0 = fr.x + 200, xr = fr.x + fr.w - 12, labelX = fr.x + 176;
  const yearPx = m.yearU / U_CENT;   // cents of one year's interest
  const endCents = span ? p.P + m.totalU / U_CENT : Math.max(m.simple[n - 1]!.balance, m.compound?.[n - 1]?.balance ?? 0);
  const Lp = Math.min(600, ((xr - x0) * p.P) / endCents);
  const scale = Lp / p.P, yearW = Math.max(MIN_STUB, yearPx * scale);
  const pitch = n === 2 ? 250 : 190;
  const total = 150 + (n - 1) * pitch + 140;
  const y0 = fr.y + (fr.h - total) / 2 + 150;
  const rowY = Array.from({ length: n }, (_, i) => y0 + i * pitch);
  const simple: [number, number][][] = [[]], compound: [number, number][][] | null = m.compound ? [[]] : null;
  let lastFrac = 1;
  if (span) {
    const st: [number, number][] = [];
    for (let j = 0; j < m.stubs; j++) {
      const f = Math.min(1, m.months / 12 - j);
      const a = x0 + Lp + j * yearW;
      st.push([a, a + f * yearW]);
      lastFrac = f;
    }
    simple.push(st);
  } else {
    for (let k = 1; k < n; k++) {
      simple.push(Array.from({ length: k }, (_, j) => [x0 + Lp + j * yearW, x0 + Lp + (j + 1) * yearW] as [number, number]));
      if (compound && m.compound) {
        const st: [number, number][] = [];
        let x = x0 + Lp;
        for (let j = 1; j <= k; j++) { const w = Math.max(MIN_STUB, m.compound[j]!.interest * scale); st.push([x, x + w]); x += w; }
        compound.push(st);
      }
    }
  }
  const stubLabelY = rowY.map(y => y + TH / 2 + 52);
  const L: TapeLayout = { n, span, x0, xr, Lp, scale, rowY, simple, compound, lastFrac, stubLabelY, gainY: rowY[n - 1]! + TH / 2 + 84, topY: rowY[0]! - TH / 2 - 76, labelX };
  const right = Math.max(...simple.flat().map(s => s[1]), ...(compound ?? []).flat().map(s => s[1]), x0 + Lp);
  check(right <= fr.x + fr.w + 0.5, NAME, 'the longest row must fit the frame');
  check(L.topY - 34 >= fr.y - 0.5 && L.gainY + 34 <= fr.y + fr.h + 0.5, NAME, 'the rows must fit the frame vertically');
  return L;
}

export interface TapeBlock {
  readonly kind: 'InterestTape';
  readonly params: TapeParams;
  readonly maths: TapeMaths;
  readonly layout: TapeLayout;
  readonly where: { P(row: number): Box; row(row: number): Box; stub(row: number, j: number): Box; label: Box; gain: Box; stubLabel(row: number): Box };
  draw(c: Canvas, P: Progress<string>, f?: TapeFocus): void;
}

export function InterestTape(p: TapeParams, fr: Frame, th: Theme): TapeBlock {
  const m = tapeMaths(p), L = tapeLayout(p, m, fr);
  const rule = p.rule ?? 'simple', hideRows = new Set(p.hide?.rows ?? []);
  const yearC = roundHalfUp(m.yearU);
  // span mode labels the FIRST stub: one full year, or the partial amount when the whole time is under a year
  const firstC = L.span ? roundHalfUp(interestU(p.P, p.bp, Math.min(12, m.months))) : yearC;
  // ---------- labels (TeX, crisp) ----------
  const money = (c: number) => usdTex(c, c % 100 !== 0);
  const FP = tex(p.hide?.P ? '\\$\\,?\\; = 100\\%' : `${money(p.P)} = 100\\%`) as Formula;
  const stubTex = (row: number, which: 'simple' | 'compound'): string => {
    if (hideRows.has(row)) return '+\\,\\$\\,?';
    if (L.span) return `+\\,${money(firstC)}`;
    const I = which === 'compound' && m.compound ? m.compound[row]!.interest : yearC;
    return `+\\,${money(I)}`;
  };
  const FS = L.rowY.map((_, r) => (r === 0 ? null : tex(stubTex(r, rule === 'compound' ? 'compound' : 'simple')) as Formula));
  const FC = L.rowY.map((_, r) => (r === 0 || !m.compound ? null : tex(stubTex(r, 'compound')) as Formula));
  const gainC = L.span ? roundHalfUp(m.totalU) : rule === 'compound' && m.compound ? m.compound[L.n - 1]!.balance - p.P : roundHalfUp(m.yearU * (L.n - 1));
  const FG = tex(p.hide?.gain ? '\\$\\,?' : money(gainC)) as Formula;
  const rowName = (r: number) => (r === 0 ? 'start' : L.span ? (m.months % 12 === 0 ? `year ${m.months / 12}` : 'end') : `year ${r}`);

  const stubsOf = (r: number, cmix: number): [number, number][] => {
    const s = L.simple[r] ?? [];
    const base = rule === 'compound' && L.compound ? L.compound[r]! : s;
    if (!L.compound || cmix <= 0 || rule === 'compound') return base;
    const cs = L.compound[r]!;
    return s.map((q, j) => [lerp(q[0], cs[j]![0], cmix), lerp(q[1], cs[j]![1], cmix)] as [number, number]);
  };
  const top = (r: number) => L.rowY[r]! - TH / 2;
  const PBox = (r: number) => box(L.x0, top(r), L.x0 + L.Lp, top(r) + TH);
  const stubLabelBox = (r: number, F: Formula, cmix: number): Box => {
    const st = stubsOf(r, cmix), last = L.span ? st[0] : st[st.length - 1];
    const cx = last ? (last[0] + last[1]) / 2 : L.x0 + L.Lp;
    const b = texBox(F, cx, L.stubLabelY[r]!, { size: NUM, align: 'center' });
    const dx = b.x1 > L.xr ? L.xr - b.x1 : b.x0 < L.x0 ? L.x0 - b.x0 : 0;
    return box(b.x0 + dx, b.y0, b.x1 + dx, b.y1);
  };
  const gainSpan = (cmix: number): [number, number] => { const st = stubsOf(L.n - 1, cmix); return [st[0]?.[0] ?? L.x0 + L.Lp, st[st.length - 1]?.[1] ?? L.x0 + L.Lp]; };
  const gainBox = (cmix: number): Box => {
    const [a, b] = gainSpan(cmix);
    const B = texBox(FG, (a + b) / 2, L.gainY, { size: NUM, align: 'center' });
    const dx = B.x1 > L.xr ? L.xr - B.x1 : 0;
    return box(B.x0 + dx, B.y0, B.x1 + dx, B.y1);
  };
  const labelBox = texBox(FP, L.x0 + L.Lp / 2, L.topY, { size: NUM, align: 'center' });

  // ---------- painters ----------
  function ring(c: Canvas, R: Box, col: Role, k: number, r = 14): void {
    if (k <= 0 || R.w <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 14 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 10, R.y0 - 10, R.w + 20, R.h + 20, r); g.stroke();
    g.restore();
  }
  function pulse(c: Canvas, B: Box, col: Role, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = paint(th, col, 'fill');
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 2, B.y0 + 2, B.x1 + 2, B.y1 - 2), col, k, 14);
  }
  function principal(c: Canvas, r: number, a: number, dy: number, cells: number): void {
    if (a <= 0) return;
    const y = top(r) + dy;
    wash(c, rectPts(L.x0, y, L.Lp, TH, 6), 'first', { seed: 10 + r * 7, inkW: 3, shade: 0.3, rough: 1.0, alpha: a });
    if (cells > 0) {
      const { g } = c;
      g.save(); g.globalAlpha *= a * cells; g.setLineDash([8, 7]); g.strokeStyle = 'rgba(34,27,46,0.55)'; g.lineWidth = 2.5;
      for (let i = 1; i < 10; i++) { const x = L.x0 + (L.Lp * i) / 10; g.beginPath(); g.moveTo(x, y + 9); g.lineTo(x, y + TH - 9); g.stroke(); }
      g.restore();
    }
  }
  function stub(c: Canvas, x0: number, x1: number, r: number, j: number, a: number, dy: number, grow: number): void {
    if (a <= 0 || grow <= 0) return;
    const w = (x1 - x0) * grow;
    if (w < 0.5) return;
    wash(c, rectPts(x0, top(r) + dy, w, TH, Math.min(4, w / 3)), 'second', { seed: 50 + r * 11 + j, inkW: w < 14 ? 2 : 3, shade: 0.25, rough: Math.min(0.9, w / 20), alpha: a });
  }
  function ghost(c: Canvas, x0: number, x1: number, y: number, col: string, a: number, fill = 0): void {
    if (a <= 0 || x1 - x0 < 0.5) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(a);
    if (fill > 0) { g.fillStyle = col; g.globalAlpha *= fill; g.fillRect(x0, y, x1 - x0, TH); g.globalAlpha /= fill; }
    g.setLineDash([7, 6]); g.strokeStyle = col; g.lineWidth = 2.4; g.strokeRect(x0, y, x1 - x0, TH);
    g.restore();
  }

  function draw(c: Canvas, P: Progress<string>, f: TapeFocus = {}): void {
    const kT = clamp(P.k('tape')), kW = clamp(P.k('whole')), kC = clamp(P.k('cells')), kR = clamp(P.k('rows')), kG = clamp(P.k('gain'));
    const cmix = clamp(f.compound ?? 0);
    if (kT <= 0) return;
    for (let r = 0; r < L.n; r++) {
      // when this row shows: row 0 with the tape; later rows with 'rows' or their own year step
      const ky = r === 0 ? 1 : clamp(P.k(L.span ? 'y1' : `y${r}`));
      const body = r === 0 ? kT : Math.max(kR, clamp(ky / 0.35));
      if (body <= 0) continue;
      const dy = (1 - E.smooth(body)) * -26;
      drawWords(c, rowName(r), L.labelX, L.rowY[r]! + dy, 'dim', body, { size: LABEL, align: 'right' });
      principal(c, r, body, dy, kC);
      if (r === 0) continue;
      const st = stubsOf(r, cmix);
      if (L.span) {
        st.forEach(([a, b], j) => {
          const kj = clamp(P.k(`y${j + 1}`));
          if (kj <= 0) return;
          const g0 = clamp((kj - 0.3) / 0.6);
          if (j === st.length - 1 && L.lastFrac < 1) ghost(c, a, a + (b - a) / L.lastFrac, top(r), paint(th, 'second', 'line'), g0 * 0.8);
          stub(c, a, b, r, j, 1, 0, E.smooth(g0));
        });
      } else {
        st.forEach(([a, b], j) => {
          const isNew = j === r - 1;
          const al = isNew ? 1 : clamp((ky - 0.15) / 0.3);
          const grow = isNew ? E.smooth(clamp((ky - 0.4) / 0.5)) : 1;
          stub(c, a, b, r, j, al, isNew ? 0 : (1 - al) * -20, grow);
        });
        // the compound excess (Alex's extra) as a dashed red ghost past the simple row
        const gp = clamp(f.gap ?? 0);
        if (gp > 0 && L.compound && rule === 'simple') {
          const se = L.simple[r]![r - 1]![1], ce = L.compound[r]![r - 1]![1];
          ghost(c, Math.min(se, lerp(se, ce, 1)), ce, top(r), paint(th, 'wrong', 'fill'), gp * ky, 0.35);
        }
      }
    }
    // rings (under the labels)
    for (const R of f.rings ?? []) {
      if (R.row >= L.n) continue;
      const st = stubsOf(R.row, cmix);
      const B = R.at === 'P' || !st.length ? PBox(R.row) : box(L.x0, top(R.row), st[st.length - 1]![1], top(R.row) + TH);
      ring(c, B, R.col, R.k);
    }
    // the principal: brace above row 0 and "$2,000 = 100%"
    if (kW > 0) {
      const y = top(0) - 14;
      drawOn(c, bracePts([L.x0 + 4, y], [L.x0 + L.Lp - 4, y], 22), E.inOut(kW), { col: 'first', lw: 3.5 });
      pulse(c, labelBox, 'first', f.pulseP ?? 0);
      texDraw(c, FP, L.x0 + L.Lp / 2, L.topY, { size: NUM, align: 'center', col: 'first', k: kW });
    }
    // what each row's newest stub added (one label per row; the last row's gives way to the gain brace)
    for (let r = 1; r < L.n; r++) {
      const ky = clamp(P.k(L.span ? 'y1' : `y${r}`));
      const la = clamp((ky - 0.7) / 0.3) * (r === L.n - 1 ? 1 - kG : 1);
      if (la <= 0) continue;
      if (f.pulseRow && f.pulseRow.row === r) pulse(c, stubLabelBox(r, FS[r]!, cmix), 'second', f.pulseRow.k);
      const cAl = FC[r] && cmix > 0 ? cmix : 0;
      if (cAl < 1) { const b = stubLabelBox(r, FS[r]!, 0); texDraw(c, FS[r]!, b.cx, L.stubLabelY[r]!, { size: NUM, align: 'center', col: 'second', alpha: la * (1 - cAl) }); }
      if (cAl > 0) { const b = stubLabelBox(r, FC[r]!, 1); texDraw(c, FC[r]!, b.cx, L.stubLabelY[r]!, { size: NUM, align: 'center', col: 'second', alpha: la * cAl }); }
    }
    // the gain: a brace under the last row's stubs and the total interest
    if (kG > 0) {
      const [a, b] = gainSpan(cmix), y = top(L.n - 1) + TH + 12;
      if (b - a > 30) drawOn(c, bracePts([b, y], [a, y], 20), E.inOut(kG), { col: 'second', lw: 3.5 });
      else drawOn(c, [[(a + b) / 2, y], [(a + b) / 2, y + 18]], E.inOut(kG), { col: 'second', lw: 3.5 });
      const B = gainBox(cmix);
      pulse(c, B, 'second', f.pulseGain ?? 0);
      texDraw(c, FG, B.cx, L.gainY, { size: NUM, align: 'center', col: 'second', k: kG });
    }
  }

  return {
    kind: 'InterestTape', params: p, maths: m, layout: L,
    where: {
      P: PBox,
      row: r => { const st = stubsOf(r, 0); return box(L.x0, top(r), st.length ? st[st.length - 1]![1] : L.x0 + L.Lp, top(r) + TH); },
      stub: (r, j) => { const s = stubsOf(r, 0)[j]!; return box(s[0], top(r), s[1], top(r) + TH); },
      label: labelBox,
      gain: gainBox(0),
      stubLabel: r => stubLabelBox(r, FS[r]!, 0),
    },
    draw,
  };
}
