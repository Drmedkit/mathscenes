// ChangeTape: the model of percent change. Every amount is a painted tape on ONE scale (px per unit), one row per
// amount, oldest on top: [before, after] or [start, middle, end]. Row i > 0 is drawn against row i-1, its base:
//   the kept part        amber (the same stuff as the base)
//   an increase          the extra piece sticks out past the base, teal
//   a decrease           the removed piece stays as a dashed teal ghost where the base ended
// A base row can be CUT into n equal sections; a percent scale under it (a double number line) labels the cuts
// 0 %, 100/n %, ... 100 % and runs on past 100 % as far as the next row reaches, so "+$10 on $40" is visibly one of
// four sections = 25 %, and the new tape ends at 125 %. Labels never sit on lines: word labels above the tape on the
// left, the value above the tape's end, the change to the right of the row, percent labels under the scale.
// Steps per row i: row{i} (tape grows, word label), val{i} (value), chg{i} (extra piece / ghost), clab{i} (change
// label), cut{i} (section lines), scale{i} (percent scale), slide{i} (a copy of the change slides onto base row i-1's
// first section: "this change is one section of the base"), reveal (hidden "?" values turn into numbers).
import { type Box, box, clamp, lag, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, plainText } from '../../../blocks/block';
import { wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { type Change, type Unit, change, fmtNum, r9, texMoney, texNum, texQ } from './changeMaths';

export interface ChangeTapeParams {
  /** the amounts in order (2 or 3); the first is positive, all are nonnegative */
  amounts: readonly number[];
  /** a word label per row ("last year", "now") */
  names: readonly string[];
  unit: Unit;
  /** cut base row i into cuts[i] equal sections and draw its percent scale (0 / undefined = no cuts) */
  cuts?: readonly (number | undefined)[];
  /** the change label of row i (TeX; default "+$10" / "−$10", "?" when hidden) */
  changeTex?: readonly (string | undefined)[];
  /** row i's value shows "?" until the `reveal` step */
  hide?: readonly boolean[];
  /** hide the change labels until `reveal` */
  hideChange?: boolean;
  /** the value labels' TeX (default: the amount with its unit) */
  valueTex?: readonly (string | undefined)[];
  /** px per unit (two blocks drawn to one scale) */
  scale?: number;
  /** the reserved width right of the tapes for change labels (two blocks aligned) */
  reserve?: number;
  /** change labels may hang this far past the frame's right edge (the empty gutter before the board) */
  overhang?: number;
}
export interface ChangeTapeMaths { amounts: number[]; changes: (Change | null)[]; overall: Change }
export interface ChangeTapeFocus {
  /** [row, section] pairs ringed in the focus colour */
  sections?: readonly (readonly [number, number])[];
  /** rows whose change piece is ringed */
  change?: readonly number[];
  /** whole rows ringed */
  rows?: readonly number[];
  /** percent ticks [row, j] lit */
  ticks?: readonly (readonly [number, number])[];
  k?: number;
  col?: Paint;
  /** colour of the lit percent ticks (default link: the answer) */
  tickCol?: Paint;
  /** pulse 0..1 of each row's word label */
  pulse?: readonly number[];
}
export interface ChangeTapeBlock {
  readonly kind: 'ChangeTape';
  readonly maths: ChangeTapeMaths;
  readonly box: Box;
  readonly scale: number;
  readonly where: {
    label(i: number): Box; value(i: number): Box; tape(i: number): Box; kept(i: number): Box;
    change(i: number): Box; changeLabel(i: number): Box; section(i: number, j: number): Box; under(i: number): Box;
    /** the label of percent tick j under base row i (null when it is not labelled) */
    tick(i: number, j: number): Box | null;
    scale(i: number): Box;
  };
  draw(c: Canvas, p: Progress, focus?: ChangeTapeFocus): void;
}

const NAME = 'ChangeTape';
const LABEL = 46, NUM = 64, PCT = 52, CH = 62;
const TH = 84, LINE_H = 66, GAP = 12, SCALE_H = 96, PLAIN_H = 26, ROW_GAP = 30;

export function computeChangeTape(amounts: readonly number[]): ChangeTapeMaths {
  check(amounts.length >= 2 && amounts.length <= 3, NAME, 'two or three amounts (before, after; or start, middle, end)');
  for (const a of amounts) check(Number.isFinite(a) && a >= 0, NAME, `amounts are nonnegative numbers (got ${a})`);
  check(amounts[0]! > 0, NAME, 'the first amount (the base) must be positive');
  const changes = amounts.map((a, i) => (i === 0 ? null : (check(amounts[i - 1]! > 0, NAME, `row ${i - 1} is a base and cannot be 0`), change(amounts[i - 1]!, a))));
  return { amounts: [...amounts], changes, overall: change(amounts[0]!, amounts[amounts.length - 1]!) };
}

export function ChangeTape(p: ChangeTapeParams, fr: Frame, th: Theme): ChangeTapeBlock {
  const m = computeChangeTape(p.amounts);
  const n = m.amounts.length, A = m.amounts;
  check(p.names.length === n, NAME, 'one word label per row');
  p.names.forEach((s, i) => plainText(s, NAME, `name ${i}`));
  const cuts = A.map((_, i) => p.cuts?.[i] ?? 0);
  cuts.forEach((k, i) => check(Number.isInteger(k) && k >= 0 && k <= 12, NAME, `cuts[${i}] must be a whole number 0..12`));

  // ---------- the change labels (right of each row) ----------
  const chSrc = A.map((_, i) => {
    if (i === 0) return '';
    const c = m.changes[i]!;
    const def = c.dir === 'none' ? '\\pm 0' : `${c.dir === 'up' ? '+' : '-'}${p.unit.money ? texMoney(c.size) : texNum(c.size)}`;
    return p.changeTex?.[i] ?? def;
  });
  const chF = chSrc.map(s => (s ? (tex(s) as Formula) : null));
  const qF = tex('?') as Formula;
  const chW = Math.max(0, ...chF.map(F => (F ? texBox(F, 0, 0, { size: CH, align: 'left' }).w : 0)), p.hideChange ? texBox(qF, 0, 0, { size: CH }).w : 0);
  const over = p.overhang ?? 0;
  const reserve = p.reserve ?? (n > 1 ? Math.max(0, chW + 34 - over) : 0);
  const Wt = fr.w - reserve;
  const maxA = Math.max(...A);
  const s = p.scale ?? Wt / maxA;
  check(maxA * s <= Wt + 0.5, NAME, `the longest tape (${Math.round(maxA * s)} px) is wider than the room (${Math.round(Wt)} px)`);
  const x0 = fr.x;
  const X = (v: number) => x0 + v * s;
  check(A[0]! * s >= 110, NAME, `the base tape is only ${Math.round(A[0]! * s)} px long`);
  for (let i = 1; i < n; i++) {
    const w = m.changes[i]!.size * s;
    check(w === 0 || w >= 14, NAME, `the change in row ${i} is only ${Math.round(w)} px wide (too thin to see)`);
  }
  cuts.forEach((k, i) => { if (k) check((A[i]! * s) / k >= 44, NAME, `sections of row ${i} are ${Math.round((A[i]! * s) / k)} px (too narrow)`); });

  // ---------- vertical layout ----------
  const rowH = (i: number) => LINE_H + GAP + TH + (cuts[i] ? SCALE_H : PLAIN_H);
  const total = A.reduce((t, _, i) => t + rowH(i), 0) + ROW_GAP * (n - 1);
  check(total <= fr.h + 0.5, NAME, `the model needs ${Math.round(total)} px, the frame has ${fr.h}`);
  const tops: number[] = [];
  let y = fr.y + Math.max(0, (fr.h - total) / 2);
  for (let i = 0; i < n; i++) { tops.push(y); y += rowH(i) + ROW_GAP; }
  const labelY = (i: number) => tops[i]! + LINE_H / 2;
  const tapeY = (i: number) => tops[i]! + LINE_H + GAP;

  // ---------- boxes ----------
  const valSrc = A.map((a, i) => p.valueTex?.[i] ?? texQ(p.unit, a));
  const valF = valSrc.map(sr => tex(sr) as Formula);
  const label = (i: number) => wordsBox(p.names[i]!, x0, labelY(i), { size: LABEL });
  const valueAt = (i: number, F: Formula): Box => {
    const end = Math.max(X(A[i]!), x0);
    const w = texBox(F, 0, 0, { size: NUM, align: 'left' }).w;
    const L = label(i);
    const xr = Math.max(end, L.x1 + 30 + w);
    return texBox(F, xr, labelY(i), { size: NUM, align: 'right' });
  };
  const value = (i: number) => valueAt(i, p.hide?.[i] ? qF : valF[i]!);
  for (let i = 0; i < n; i++) {
    const v = valueAt(i, valF[i]!);
    check(v.x1 <= fr.x + fr.w + 1, NAME, `the value "${valSrc[i]}" of row ${i} runs out of the frame`);
  }
  const tape = (i: number) => box(x0, tapeY(i), Math.max(x0, X(A[i]!)), tapeY(i) + TH);
  const kept = (i: number) => (i === 0 ? tape(0) : box(x0, tapeY(i), X(Math.min(A[i]!, A[i - 1]!)), tapeY(i) + TH));
  const changeBox = (i: number) => {
    const a = A[i - 1]!, b = A[i]!;
    return box(X(Math.min(a, b)), tapeY(i), X(Math.max(a, b)), tapeY(i) + TH);
  };
  const changeLabel = (i: number) => {
    const F = p.hideChange ? qF : chF[i]!;
    return texBox(F, X(Math.max(A[i]!, A[i - 1]!)) + 24, tapeY(i) + TH / 2, { size: CH, align: 'left' });
  };
  for (let i = 1; i < n; i++) check(texBox(chF[i]!, X(Math.max(A[i]!, A[i - 1]!)) + 24, 0, { size: CH, align: 'left' }).x1 <= fr.x + fr.w + over + 1, NAME, `the change label of row ${i} runs out of the frame`);
  const section = (i: number, j: number) => { const u = A[i]! / (cuts[i] || 1); return box(X(j * u), tapeY(i), X((j + 1) * u), tapeY(i) + TH); };
  const scaleY = (i: number) => tapeY(i) + TH + 18;
  /** the scale of base row i runs as far as the longest later row */
  const ext = (i: number) => Math.max(A[i]!, ...(i + 1 < n ? [A[i + 1]!] : []));
  // percent ticks of each base row: the ones that get a label (greedy by priority, never overlapping)
  const tickLabels: Map<number, Box>[] = A.map((a, i) => {
    const out = new Map<number, Box>();
    const k = cuts[i]!;
    if (!k) return out;
    const u = a / k, nT = Math.floor(r9(ext(i) / u)) + 0, ly = scaleY(i) + 16 + PCT * 0.55;
    const nextJ = i + 1 < n ? r9((A[i + 1]! / u)) : -1;
    const order = [k, ...(Number.isInteger(nextJ) ? [nextJ] : []), 0, ...Array.from({ length: nT + 1 }, (_, j) => j)];
    const placed: Box[] = [];
    for (const j of order) {
      if (j > nT || out.has(j)) continue;
      const b = j === 0 ? wordsBox(pctText(j, k), x0, ly, { size: PCT, align: 'left' }) : wordsBox(pctText(j, k), X(j * u), ly, { size: PCT, align: 'center' });
      if (b.x0 < fr.x - 30 || b.x1 > fr.x + fr.w + Math.min(over, 120)) continue;
      if (placed.some(q => b.x0 < q.x1 + 16 && q.x0 < b.x1 + 16)) continue;
      placed.push(b); out.set(j, b);
    }
    return out;
  });
  const where = {
    label, value, tape, kept, change: changeBox, changeLabel, section,
    /** a thin box just under a change piece: a leader ends there, clear of the change label on its right */
    under: (i: number) => { const C = changeBox(i); return box(C.x0, C.y1 + 8, C.cx, C.y1 + 34); },
    tick: (i: number, j: number) => tickLabels[i]?.get(j) ?? null,
    scale: (i: number) => box(x0, scaleY(i) - 4, X(ext(i)), scaleY(i) + 16 + PCT),
  };
  const all = box(fr.x, tops[0]!, fr.x + fr.w, tops[n - 1]! + rowH(n - 1));

  function draw(c: Canvas, P: Progress, f: ChangeTapeFocus = {}): void {
    const fk = clamp(f.k ?? 0), fcol = f.col ?? 'pick', kRev = P.k('reveal');
    const amber = paint(th, 'first', 'fill'), teal = paint(th, 'second', 'fill');
    for (let i = 0; i < n; i++) {
      const kr = E.smooth(P.k(`row${i}`)), kv = P.k(`val${i}`), kc = E.smooth(P.k(`chg${i}`)), kl = P.k(`clab${i}`);
      const kcut = P.k(`cut${i}`), ksc = P.k(`scale${i}`);
      const L = label(i);
      // word label (with a pulse when its symbol is written)
      const pu = f.pulse?.[i] ?? 0;
      if (pu > 0) glowBox(c, L, i === 0 ? 'first' : 'ink', pu);
      drawWords(c, p.names[i]!, x0, labelY(i), i === 0 ? 'first' : 'dim', kr, { size: LABEL });
      // the tape
      const T = tape(i), Kp = kept(i), ty = tapeY(i);
      if (kr > 0) {
        const kw = Kp.w * kr;
        if (kw > 2) wash(c, rectPts(x0, ty, kw, TH, 10), amber, { seed: 40 + i * 7, lift: i === 0 ? 0 : 0.22, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      }
      if (i > 0 && kc > 0) {
        const C = changeBox(i), ch = m.changes[i]!;
        if (ch.dir === 'up') {
          const w = C.w * kc;
          if (w > 2) wash(c, rectPts(C.x0 - 1, ty, w + 1, TH, 10), teal, { seed: 90 + i, ink: DUSK.ink, inkW: 3, shade: 0.25 });
        } else if (ch.dir === 'down') {
          withAlpha(c, kc, () => {
            c.g.save(); c.g.globalAlpha *= 0.22; c.g.fillStyle = teal; c.g.fillRect(C.x0, ty + 3, C.w - 3, TH - 6); c.g.restore();
            strokePts(c, rectPts(C.x0, ty, C.w, TH, 10), { col: 'second', lw: 3.5, dash: [12, 9], closed: true, cap: 'butt' });
          });
        }
      }
      // cuts across the whole tape (kept + extra)
      const k = cuts[i]!;
      if (k && kcut > 0) {
        for (let j = 1; j < k; j++) {
          const kj = E.smooth(lag(kcut, j - 1, k - 1, 0.35));
          if (kj <= 0) continue;
          const xx = section(i, j).x0;
          drawOn(c, [[xx, ty + 4], [xx, ty + TH - 4]], kj, { col: DUSK.ink, lw: 4 });
        }
      }
      // percent scale
      if (k && ksc > 0) {
        const u = A[i]! / k, sy = scaleY(i), xe = X(ext(i));
        drawOn(c, [[x0, sy], [xe, sy]], E.smooth(ksc), { col: 'dim', lw: 2.5 });
        const nT = Math.floor(r9(ext(i) / u));
        for (let j = 0; j <= nT; j++) {
          const xx = X(j * u), kj = clamp(ksc * (nT + 1) - j);
          if (kj <= 0) continue;
          const lit = (f.ticks ?? []).some(([r, q]) => r === i && q === j) ? fk : 0;
          const col: Paint = lit > 0 ? f.tickCol ?? 'link' : j === k ? 'first' : 'dim';
          strokePts(c, [[xx, sy - 9], [xx, sy + 9]], { col, lw: j === k ? 4 : 3, alpha: kj });
          const b = tickLabels[i]!.get(j);
          if (b) drawWords(c, pctText(j, k), b.cx, b.cy, col, kj, { size: PCT, align: 'center', weight: lit > 0 || j === k ? 700 : 600 });
        }
      }
      // value above the tape's end
      if (kv > 0) {
        const hidden = !!p.hide?.[i];
        const col: Paint = i === 0 ? 'first' : 'ink';
        if (hidden && kRev < 1) { const b = valueAt(i, qF); texDraw(c, qF, b.x1, labelY(i), { size: NUM, align: 'right', k: kv, alpha: 1 - kRev, col }); }
        if (!hidden || kRev > 0) { const b = valueAt(i, valF[i]!); texDraw(c, valF[i]!, b.x1, labelY(i), { size: NUM, align: 'right', k: hidden ? kRev : kv, col }); }
      }
      // change label right of the row
      if (i > 0 && kl > 0) {
        const xL = X(Math.max(A[i]!, A[i - 1]!)) + 24, yL = ty + TH / 2;
        if (p.hideChange && kRev < 1) texDraw(c, qF, xL, yL, { size: CH, align: 'left', k: kl, alpha: 1 - kRev, col: 'second' });
        if (!p.hideChange || kRev > 0) texDraw(c, chF[i]!, xL, yL, { size: CH, align: 'left', k: p.hideChange ? kRev : kl, col: 'second' });
      }
      // focus rings
      if (fk > 0) {
        if ((f.rows ?? []).includes(i)) ring(c, T, fcol, fk);
        for (const [r, j] of f.sections ?? []) if (r === i) ring(c, section(i, j), fcol, fk);
        if (i > 0 && (f.change ?? []).includes(i)) ring(c, changeBox(i), fcol, fk);
      }
      // slide: a copy of this row's change moves up onto the first section of the base row above
      const ksl = P.k(`slide${i}`);
      if (i > 0 && ksl > 0) {
        const C = changeBox(i), e = E.inOut(clamp(ksl / 0.8));
        const tx = lerp(C.x0, x0, e), tyy = lerp(C.y0, tapeY(i - 1), e);
        const a = ksl < 0.9 ? 1 : 1 - (ksl - 0.9) / 0.1 * 0.35;
        strokePts(c, rectPts(tx, tyy, C.w, TH, 10), { col: 'pick', lw: 5, closed: true, alpha: a });
      }
    }
  }
  return { kind: 'ChangeTape', maths: m, box: all, scale: s, where, draw };
}

/** "25%", "12.5%", "133.3%" for tick j of k sections */
export function pctText(j: number, k: number): string { return `${fmtNum((j * 100) / k, 1)}%`; }
function ring(c: Canvas, b: Box, col: Paint, k: number): void {
  drawOn(c, rectPts(b.x0 - 7, b.y0 - 7, b.w + 14, b.h + 14, 14), E.inOut(clamp(k)), { col, lw: 5, closed: true });
}
function glowBox(c: Canvas, b: Box, col: Paint, k: number): void {
  const { g } = c;
  g.save(); g.globalAlpha *= 0.3 * clamp(k); g.fillStyle = paint(c.th, col, 'fill');
  g.beginPath(); g.roundRect(b.x0 - 14, b.y0 - 8, b.w + 28, b.h + 16, 12); g.fill(); g.restore();
}
