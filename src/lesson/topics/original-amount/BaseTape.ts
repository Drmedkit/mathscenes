// BaseTape: the model of "find the original amount". The ORIGINAL amount is the whole, 100% (amber, often "?"); every
// later amount is a tape on the SAME scale, drawn against the row above it (its base):
//   a decrease   the new tape is shorter; the part that came off stays as a dashed teal ghost up to the base's end
//   an increase  the new tape is longer; the extra piece sticks out past the base's end, teal
// A row can be CUT into equal sections across its extent (base length for a decrease, its own length for an
// increase), so "$48 after 20% off" is visibly 4 of the 5 sections of the original, the ghost is the 5th; the value of
// one section can be written in each section (the tape-diagram method: $48 ÷ 4 = $12, then 5 × $12 = $60). A percent
// scale under the original (a double number line) labels the cuts 0% … 100% and runs on past 100% for an increase.
// Concreteness fading inside one block: an optional painted price tag / receipt on top ("was $? · now $48"), whose
// "?" turns into the original at `reveal`, then the tapes, then the notation on the board beside it.
// Steps: obj, row{i}, val{i}, chg{i}, cut{i}, sv{i} (section values), pct{i} (labels under the row; the scale for row
// 0), copy (row 1's section values rise into the original's sections), reveal (hidden values -> numbers), mark (a
// dashed line where the original ends, down through every row).
// Labels never sit on lines: words + value above the tape, percent / change labels under it, section values inside
// the painted sections (dark ink on the wash).
import { type Box, type Pt, box, clamp, lag, lerp, unionBox } from '../../../core/math';
import { bracePts, rectPts } from '../../../core/pts';
import { type Canvas, drawOn, strokePts, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texBox, texDraw } from '../../../core/tex';
import { type Frame, check, plainText } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';
import { DUSK } from '../../dusk';
import { digits, usdTex } from './reverseMaths';

export interface TapeRow {
  /** the amount, cents */ cents: number;
  /** the word label above the tape ("original price") */ word: string;
  /** the value shows "?" until the `reveal` step */ hide?: boolean;
  /** cut the row's extent into n equal sections (0 / undefined = no cuts) */ sections?: number;
  /** write one section's value inside each section of the amount (needs whole cents per section) */ secVals?: boolean;
  /** TeX under the row (braced), e.g. '80\\%'; row 0 shows '100\\%' when it has no scale */ pct?: string;
  /** TeX label of the change piece (rows >= 1), e.g. '20\\%\\ \\text{off}' */ change?: string;
  /** colour role (default: row 0 first, the others link) */ role?: 'first' | 'link' | 'second';
}
export interface BaseTapeParams {
  rows: readonly TapeRow[];
  /** a percent scale under row 0 (needs rows[0].sections) */ scale?: boolean;
  /** a painted object on top: a price tag or a receipt with the old and the new amount */
  obj?: { kind: 'tag' | 'receipt'; title: string; old: string; now: string };
  /** money with cents everywhere ($48.00) */ cents?: boolean;
  /** a dashed line at this amount (cents) through all rows: "the original ends here" */ mark?: number;
}
export interface BaseTapeFocus {
  rows?: readonly number[];
  sections?: readonly (readonly [number, number])[];
  change?: readonly number[];
  k?: number;
  col?: Paint;
  /** pulses 0..1 on each row's value label (a board symbol and its label light up together) */
  pulse?: readonly number[];
  /** pulse 0..1 on the section values of a row: [row, k] */
  secPulse?: readonly (readonly [number, number])[];
  /** pulse on the object's old / new value */
  pObjOld?: number; pObjNew?: number;
  /** percent ticks of the scale that are lit (tick index j) */
  ticks?: readonly number[];
}
export interface BaseTapeBlock {
  readonly kind: 'BaseTape';
  readonly box: Box;
  readonly where: {
    label(i: number): Box; value(i: number): Box; tape(i: number): Box; kept(i: number): Box; change(i: number): Box;
    section(i: number, j: number): Box; secVal(i: number, j: number): Box | null;
    pctLabel(i: number): Box | null; changeLabel(i: number): Box | null; scale: Box | null; tick(j: number): Box | null;
    obj: Box | null; objOld: Box | null; objNew: Box | null;
    /** the right-most section value of a row (a leader target clear of the picture) */
    lastSecVal(i: number): Box | null;
  };
  draw(c: Canvas, p: Progress, focus?: BaseTapeFocus): void;
}

const NAME = 'BaseTape';
const LABEL = 46, NUM = 64, SEC = 60, UND = 60, PCT = 50, OBJ = 70;
const LINE_H = 64, GAP = 10, TH = 96, UNDER = 112, SCALE_H = 104, ROW_GAP = 22, OBJ_H = 186, OBJ_H2 = 262, OBJ_GAP = 34;
const OBJ_COL = '#3B3166';

export function BaseTape(p: BaseTapeParams, fr: Frame, th: Theme): BaseTapeBlock {
  const R = p.rows, n = R.length;
  check(n >= 1 && n <= 3, NAME, 'one to three rows');
  // word labels are canvas text (not TeX), so "25% off $75" is fine
  for (const r of R) { check(Number.isInteger(r.cents) && r.cents > 0, NAME, `amounts are positive whole cents (got ${r.cents})`); check(r.word.trim().length > 0, NAME, 'a row needs a word label'); }
  const cents = !!p.cents;
  const A = R.map(r => r.cents);
  const dir = (i: number) => (A[i]! < A[i - 1]! ? 'down' : A[i]! > A[i - 1]! ? 'up' : 'none');
  /** the extent of a row: its base's length for a decrease, its own length otherwise */
  const extent = (i: number) => (i > 0 && dir(i) === 'down' ? A[i - 1]! : A[i]!);
  const role = (i: number): 'first' | 'link' | 'second' => R[i]!.role ?? (i === 0 ? 'first' : 'link');
  const cuts = R.map(r => r.sections ?? 0);
  cuts.forEach((k, i) => check(Number.isInteger(k) && k >= 0 && k <= 16, NAME, `row ${i}: sections must be a whole number 0..16`));
  check(!p.scale || cuts[0]! > 1, NAME, 'the percent scale needs row 0 cut into sections');

  // ---------- horizontal scale ----------
  const x0 = fr.x, W = fr.w;
  const maxA = Math.max(...R.map((_, i) => extent(i)));
  const s = W / maxA;
  const X = (c: number) => x0 + c * s;
  check(A[0]! * s >= 110, NAME, `the original tape is only ${Math.round(A[0]! * s)} px long`);
  for (let i = 1; i < n; i++) {
    const w = Math.abs(A[i]! - A[i - 1]!) * s;
    check(w === 0 || w >= 14, NAME, `the change in row ${i} is only ${Math.round(w)} px wide (too thin to see)`);
  }
  /** sections: equal cuts across the extent */
  const secW = (i: number) => (cuts[i] ? (extent(i) * s) / cuts[i]! : 0);
  cuts.forEach((k, i) => { if (k) check(secW(i) >= 40, NAME, `sections of row ${i} are ${Math.round(secW(i))} px (too narrow)`); });
  /** sections that belong to the amount itself (a decrease's ghost is not part of it) */
  const amountSecs = (i: number): number => {
    const k = cuts[i]!;
    if (!k) return 0;
    const v = (A[i]! * k) / extent(i);
    check(Math.abs(v - Math.round(v)) < 1e-9, NAME, `row ${i}: the amount is not a whole number of sections`);
    return Math.round(v);
  };
  const secCents = (i: number) => extent(i) / (cuts[i] || 1);

  // ---------- formulas ----------
  const F = (src: string) => tex(src) as Formula;
  const qF = F('\\$\\,?');
  const valF = A.map(a => F(usdTex(a, cents)));
  const secF = R.map((r, i) => {
    if (!r.secVals) return null;
    check(cuts[i]! > 0, NAME, `row ${i}: section values need sections`);
    const v = secCents(i);
    check(Number.isInteger(v), NAME, `row ${i}: one section is ${v}¢, not a whole number of cents`);
    return F(usdTex(v, cents && v % 100 !== 0));
  });
  const pctF = R.map((r, i) => (r.pct ? F(r.pct) : i === 0 && !p.scale ? F('100\\%') : null));
  const chF = R.map((r, i) => (i > 0 && r.change ? F(r.change) : null));

  // ---------- vertical layout ----------
  const underH = (i: number) => (i === 0 && p.scale ? SCALE_H : UNDER);
  const rowH = (i: number) => LINE_H + GAP + TH + underH(i);
  // the object: one row "was $? · now $48" when it fits the frame, else the two amounts stacked (receipt lines)
  let objOldQ: Formula | null = null, objOldV: Formula | null = null, objNewF: Formula | null = null;
  let objStack = false, objW = 0;
  const objX0 = x0 + (p.obj?.kind === 'tag' ? 40 : 20), objIn = objX0 + (p.obj?.kind === 'tag' ? 92 : 44);
  if (p.obj) {
    check(p.obj.title.trim().length > 0, NAME, 'the object needs a title'); plainText(p.obj.old, NAME, 'old word'); plainText(p.obj.now, NAME, 'new word');
    objOldQ = F(`\\text{${p.obj.old}}\\ \\$\\,?`);
    objOldV = F(`\\text{${p.obj.old}}\\ ${usdTex(A[0]!, cents)}`);
    objNewF = F(`\\text{${p.obj.now}}\\ ${usdTex(A[n - 1]!, cents)}`);
    const oldW = Math.max(texBox(objOldQ, 0, 0, { size: OBJ }).w, texBox(objOldV, 0, 0, { size: OBJ }).w);
    const newW = texBox(objNewF, 0, 0, { size: OBJ }).w;
    const titleW = wordsBox(p.obj.title, 0, 0, { size: LABEL }).w;
    objW = (objIn - objX0) + Math.max(titleW, oldW + 84 + newW) + 44;
    if (objX0 + objW > x0 + W) { objStack = true; objW = (objIn - objX0) + Math.max(titleW, oldW, newW) + 44; }
    check(objX0 + objW <= x0 + W, NAME, `the ${p.obj.kind} (${Math.round(objW)} px) is wider than the frame`);
  }
  const objHt = objStack ? OBJ_H2 : OBJ_H;
  const objH = p.obj ? objHt + OBJ_GAP : 0;
  const total = objH + R.reduce((t, _, i) => t + rowH(i), 0) + ROW_GAP * (n - 1);
  check(total <= fr.h + 0.5, NAME, `the model needs ${Math.round(total)} px, the frame has ${fr.h}`);
  const top = fr.y + Math.max(0, Math.min(90, (fr.h - total) / 2));
  const tops: number[] = [];
  let y = top + objH;
  for (let i = 0; i < n; i++) { tops.push(y); y += rowH(i) + ROW_GAP; }
  const labelY = (i: number) => tops[i]! + LINE_H / 2;
  const tapeY = (i: number) => tops[i]! + LINE_H + GAP;

  // ---------- boxes ----------
  const label = (i: number) => wordsBox(R[i]!.word, x0, labelY(i), { size: LABEL });
  const valueAt = (i: number, Fm: Formula): Box => {
    const end = X(A[i]!), w = texBox(Fm, 0, 0, { size: NUM }).w;
    const xr = Math.max(end, label(i).x1 + 34 + w);
    return texBox(Fm, xr, labelY(i), { size: NUM, align: 'right' });
  };
  for (let i = 0; i < n; i++) {
    const v = valueAt(i, valF[i]!);
    check(v.x1 <= fr.x + fr.w + 1, NAME, `the value of row ${i} runs out of the frame`);
  }
  const tape = (i: number) => box(x0, tapeY(i), X(extent(i)), tapeY(i) + TH);
  const kept = (i: number) => box(x0, tapeY(i), X(i === 0 ? A[0]! : Math.min(A[i]!, A[i - 1]!)), tapeY(i) + TH);
  const changeBox = (i: number) => {
    if (i === 0) return box(x0, tapeY(0), x0, tapeY(0) + TH);
    const a = A[i - 1]!, b = A[i]!;
    return box(X(Math.min(a, b)), tapeY(i), X(Math.max(a, b)), tapeY(i) + TH);
  };
  const section = (i: number, j: number) => { const u = secCents(i); return box(X(j * u), tapeY(i), X((j + 1) * u), tapeY(i) + TH); };
  const secVal = (i: number, j: number): Box | null => {
    const Fm = secF[i];
    if (!Fm || j >= amountSecs(i)) return null;
    const S = section(i, j);
    return texBox(Fm, S.cx, S.cy, { size: SEC, align: 'center' });
  };
  R.forEach((r, i) => {
    if (!r.secVals) return;
    const b = secVal(i, 0)!;
    check(b.w + 22 <= secW(i), NAME, `row ${i}: the section value (${Math.round(b.w)} px) does not fit a ${Math.round(secW(i))} px section`);
  });

  // under the rows: braced percent label (centred under the amount) and the change label (under the change piece)
  const underY = (i: number) => tapeY(i) + TH + 18 + 26 + 14 + UND / 2;
  const pctLabel: (Box | null)[] = [], chLabel: (Box | null)[] = [];
  for (let i = 0; i < n; i++) {
    if (i === 0 && p.scale) { pctLabel.push(null); chLabel.push(null); continue; }
    const yU = underY(i);
    let cl: Box | null = null;
    const Fc = chF[i];
    if (Fc) {
      const C = changeBox(i), w = texBox(Fc, 0, 0, { size: UND }).w;
      const cx = clamp(C.cx, x0 + w / 2, x0 + W - w / 2);
      cl = texBox(Fc, cx, yU, { size: UND, align: 'center' });
    }
    let pl: Box | null = null;
    const Fp = pctF[i];
    if (Fp) {
      const w = texBox(Fp, 0, 0, { size: UND }).w;
      const span = i > 0 && dir(i) === 'up' ? tape(i) : kept(i);
      let cx = clamp(span.cx, x0 + w / 2, x0 + W - w / 2);
      if (cl && cx + w / 2 + 28 > cl.x0) cx = cl.x0 - 28 - w / 2;
      check(cx - w / 2 >= x0 - 1, NAME, `row ${i}: the percent label and the change label collide`);
      pl = texBox(Fp, cx, yU, { size: UND, align: 'center' });
    }
    pctLabel.push(pl); chLabel.push(cl);
  }

  // the percent scale under row 0: ticks at the cuts, as far as the longest row reaches
  const scaleY = tapeY(0) + TH + 20;
  const k0 = cuts[0]!, u0 = secCents(0);
  const nT = k0 ? Math.floor(maxA / u0 + 1e-9) : 0;
  const tickLabels = new Map<number, Box>();
  if (p.scale) {
    const ly = scaleY + 18 + PCT * 0.55;
    const ends = R.slice(1).map(r => r.cents / u0).filter(v => Math.abs(v - Math.round(v)) < 1e-9).map(Math.round);
    // label every s-th tick, s the smallest stride at which the widest label fits; 100% and the rows' ends first
    const wMax = Math.max(...Array.from({ length: nT + 1 }, (_, j) => wordsBox(pctText(j, k0), 0, ly, { size: PCT }).w));
    const step = X(u0) - x0;
    const stride = Math.max(1, Math.ceil((wMax + 18) / step));
    const order = [k0, ...ends, 0, ...Array.from({ length: nT + 1 }, (_, j) => j).filter(j => j % stride === 0)];
    const placed: Box[] = [];
    const right = fr.x + fr.w + 60;          // labels may hang into the empty gutter before the board
    for (const j of order) {
      if (j > nT || tickLabels.has(j)) continue;
      const t = pctText(j, k0);
      let b = j === 0 ? wordsBox(t, x0, ly, { size: PCT }) : wordsBox(t, X(j * u0), ly, { size: PCT, align: 'center' });
      if (b.x1 > right) b = box(right - b.w, b.y0, right, b.y1);
      if (placed.some(q => b.x0 < q.x1 + 18 && q.x0 < b.x1 + 18)) continue;
      placed.push(b); tickLabels.set(j, b);
    }
  }
  const scaleBox = p.scale ? box(x0, scaleY - 10, X(maxA), scaleY + 18 + PCT) : null;

  // ---------- the object (price tag or receipt) ----------
  let obj: Box | null = null, objOld: Box | null = null, objNew: Box | null = null, objPts: Pt[] = [];
  const objTop = top + 10;
  const ryOld = objTop + 124, ryNew = objStack ? objTop + 202 : ryOld;
  if (p.obj && objOldQ && objOldV && objNewF) {
    const tx0 = objX0, inner = objIn;
    obj = box(tx0, objTop, tx0 + objW, objTop + objHt);
    const oldW = Math.max(texBox(objOldQ, 0, 0, { size: OBJ }).w, texBox(objOldV, 0, 0, { size: OBJ }).w);
    objOld = unionBox([texBox(objOldV, inner, ryOld, { size: OBJ, align: 'left' }), texBox(objOldQ, inner, ryOld, { size: OBJ, align: 'left' })]);
    objNew = texBox(objNewF, objStack ? inner : inner + oldW + 84, ryNew, { size: OBJ, align: 'left' });
    if (p.obj.kind === 'tag') objPts = [[tx0, obj.cy], [tx0 + 56, obj.y0], [obj.x1, obj.y0], [obj.x1, obj.y1], [tx0 + 56, obj.y1]];
    else {
      // a receipt: straight top, zigzag bottom edge
      objPts = [[obj.x0, obj.y0], [obj.x1, obj.y0]];
      const teeth = Math.max(6, Math.round(obj.w / 44));
      for (let t = 0; t <= teeth; t++) objPts.push([obj.x1 - (obj.w * t) / teeth, obj.y1 - (t % 2 ? 0 : 14)]);
    }
  }

  function draw(c: Canvas, P: Progress, f: BaseTapeFocus = {}): void {
    const fk = clamp(f.k ?? 0), fcol = f.col ?? 'pick', kRev = P.k('reveal');
    // ----- the object -----
    const kObj = P.k('obj');
    if (p.obj && obj && kObj > 0) {
      withAlpha(c, E.smooth(kObj), () => {
        const g = c.g, dy = (1 - E.out(kObj)) * -20;
        g.save(); g.translate(0, dy);
        if (p.obj!.kind === 'tag') {
          const hole: Pt = [obj!.x0 + 44, obj!.cy];
          inkLine(c, [hole, [hole[0] - 16, objTop + 30], [hole[0] - 28, fr.y - 6]], { col: '#CDBFE0', w: 3, seed: 21 });
          wash(c, objPts, OBJ_COL, { seed: 23, rough: 1.4, inkW: 3, shade: 0.3 });
          inkLine(c, objPts, { col: '#8C80B8', w: 2, seed: 24, closed: true, alpha: 0.6, rough: 0.6 });
          g.save(); g.fillStyle = DUSK.navy; g.beginPath(); g.arc(hole[0], hole[1], 12, 0, Math.PI * 2); g.fill(); g.restore();
        } else {
          wash(c, objPts, OBJ_COL, { seed: 33, rough: 1.0, inkW: 3, shade: 0.25 });
          inkLine(c, objPts, { col: '#8C80B8', w: 2, seed: 34, closed: true, alpha: 0.6, rough: 0.5 });
          // a printed rule under the title
          inkLine(c, [[obj!.x0 + 44, objTop + 82], [obj!.x1 - 44, objTop + 82]], { col: '#6E6498', w: 2, seed: 35, alpha: 0.7 });
        }
        const inner = obj!.x0 + (p.obj!.kind === 'tag' ? 92 : 44);
        drawWords(c, p.obj!.title, inner, objTop + 48, 'dim', 1, { size: LABEL });
        if (R[0]!.hide && kRev < 1) texDraw(c, objOldQ!, inner, ryOld, { size: OBJ, align: 'left', col: 'first', alpha: 1 - kRev });
        if (!R[0]!.hide || kRev > 0) texDraw(c, objOldV!, inner, ryOld, { size: OBJ, align: 'left', col: 'first', k: R[0]!.hide ? clamp(kRev * 1.4) : 1 });
        texDraw(c, objNewF!, objNew!.x0, ryNew, { size: OBJ, align: 'left', col: role(n - 1) });
        g.restore();
      });
      glowBox(c, objOld!, 'first', f.pObjOld ?? 0);
      glowBox(c, objNew!, role(n - 1), f.pObjNew ?? 0);
    }

    for (let i = 0; i < n; i++) {
      const kr = E.smooth(P.k(`row${i}`)), kv = P.k(`val${i}`), kc = E.smooth(P.k(`chg${i}`)), kcut = P.k(`cut${i}`);
      const ksv = P.k(`sv${i}`), kpct = P.k(`pct${i}`);
      const ty = tapeY(i), col = role(i), fill = paint(th, col, 'fill'), teal = paint(th, 'second', 'fill');
      // word label + value
      glowBox(c, valueAt(i, R[i]!.hide && kRev < 1 ? qF : valF[i]!), col, f.pulse?.[i] ?? 0);
      drawWords(c, R[i]!.word, x0, labelY(i), col, kr, { size: LABEL });
      if (kv > 0) {
        const hidden = !!R[i]!.hide;
        if (hidden && kRev < 1) { const b = valueAt(i, qF); texDraw(c, qF, b.x1, labelY(i), { size: NUM, align: 'right', k: kv, alpha: 1 - kRev, col }); }
        if (!hidden || kRev > 0) { const b = valueAt(i, valF[i]!); texDraw(c, valF[i]!, b.x1, labelY(i), { size: NUM, align: 'right', k: hidden ? clamp(kRev * 1.3) : kv, col }); }
      }
      // the tape (the kept part grows), the change piece
      const K = kept(i);
      if (kr > 0 && K.w * kr > 2) wash(c, rectPts(x0, ty, K.w * kr, TH, 10), fill, { seed: 40 + i * 7, ink: DUSK.ink, inkW: 3, shade: 0.25 });
      if (i > 0 && kc > 0) {
        const C = changeBox(i), d = dir(i);
        if (d === 'up') {
          const w = C.w * kc;
          if (w > 2) wash(c, rectPts(C.x0 - 1, ty, w + 1, TH, 10), teal, { seed: 90 + i, ink: DUSK.ink, inkW: 3, shade: 0.25 });
        } else if (d === 'down') {
          withAlpha(c, kc, () => {
            c.g.save(); c.g.globalAlpha *= 0.22; c.g.fillStyle = teal; c.g.fillRect(C.x0, ty + 3, C.w - 3, TH - 6); c.g.restore();
            strokePts(c, rectPts(C.x0, ty, C.w, TH, 10), { col: 'second', lw: 3.5, dash: [12, 9], closed: true, cap: 'butt' });
          });
        }
      }
      // the cuts
      const k = cuts[i]!;
      if (k && kcut > 0) {
        for (let j = 1; j < k; j++) {
          const kj = E.smooth(lag(kcut, j - 1, Math.max(1, k - 1), 0.35));
          if (kj <= 0) continue;
          const xx = section(i, j).x0;
          const inGhost = i > 0 && dir(i) === 'down' && xx > X(A[i]!) + 1;
          drawOn(c, [[xx, ty + 4], [xx, ty + TH - 4]], kj, { col: inGhost ? paint(th, 'second', 'line') : DUSK.ink, lw: 4 });
        }
      }
      // section values (dark ink on the wash)
      const Fs = secF[i];
      if (Fs && ksv > 0) {
        const m = amountSecs(i);
        const sp = (f.secPulse ?? []).find(q => q[0] === i)?.[1] ?? 0;
        for (let j = 0; j < m; j++) {
          const kj = clamp(lag(ksv, j, m, 0.45));
          if (kj <= 0) continue;
          const S = section(i, j);
          if (sp > 0) { const g = c.g; g.save(); g.globalAlpha *= 0.35 * clamp(sp); g.fillStyle = paint(th, 'pick', 'fill'); g.beginPath(); g.roundRect(S.x0 + 6, S.y0 + 6, S.w - 12, S.h - 12, 10); g.fill(); g.restore(); }
          texDraw(c, Fs, S.cx, S.cy, { size: SEC, align: 'center', col: DUSK.navy, k: kj });
        }
      }
      // under the row: the scale (row 0) or the braced percent and the change label
      if (i === 0 && p.scale && kpct > 0) {
        const xe = X(maxA);
        drawOn(c, [[x0, scaleY], [xe, scaleY]], E.smooth(kpct), { col: 'dim', lw: 2.5 });
        for (let j = 0; j <= nT; j++) {
          const xx = X(j * u0), kj = clamp(kpct * (nT + 1) - j);
          if (kj <= 0) continue;
          const lit = (f.ticks ?? []).includes(j) ? fk : 0;
          const tc: Paint = lit > 0 ? 'link' : j === k0 ? 'first' : 'dim';
          strokePts(c, [[xx, scaleY - 9], [xx, scaleY + 9]], { col: tc, lw: j === k0 ? 4 : 3, alpha: kj });
          const b = tickLabels.get(j);
          if (b) drawWords(c, pctText(j, k0), b.cx, b.cy, tc, kj, { size: PCT, align: 'center', weight: lit > 0 || j === k0 ? 700 : 600 });
        }
      } else if (kpct > 0) {
        const pl = pctLabel[i], Fp = pctF[i];
        if (pl && Fp) {
          const span = i > 0 && dir(i) === 'up' ? tape(i) : kept(i);
          const bt = ty + TH + 18;
          drawOn(c, bracePts([span.x1 - 4, bt], [span.x0 + 4, bt], Math.min(24, span.w / 3)), kpct, { col: paint(th, col, 'line'), lw: 3.5 });
          texDraw(c, Fp, pl.cx, pl.cy, { size: UND, align: 'center', col, k: kpct });
        }
      }
      const kcl = i > 0 ? Math.min(kc, kpct > 0 ? 1 : kc) : 0;
      if (chLabel[i] && chF[i] && kcl > 0) texDraw(c, chF[i]!, chLabel[i]!.cx, chLabel[i]!.cy, { size: UND, align: 'center', col: 'second', k: kcl });
      // focus rings
      if (fk > 0) {
        if ((f.rows ?? []).includes(i)) ring(c, tape(i), fcol, fk);
        for (const [r, j] of f.sections ?? []) if (r === i) ring(c, section(i, j), fcol, fk);
        if (i > 0 && (f.change ?? []).includes(i)) ring(c, changeBox(i), fcol, fk);
      }
    }
    // copy: row 1's section values rise into the original's sections
    const kcp = P.k('copy');
    if (n > 1 && kcp > 0 && kcp < 1 && secF[1] && cuts[0]) {
      const m = Math.min(amountSecs(1), cuts[0]!);
      for (let j = 0; j < m; j++) {
        const kj = E.inOut(clamp(lag(kcp, j, m, 0.5)));
        const a = section(1, j), b = section(0, j);
        const xx = lerp(a.cx, b.cx, kj), yy = lerp(a.cy, b.cy, kj);
        texDraw(c, secF[1]!, xx, yy, { size: SEC, align: 'center', col: 'pick', alpha: kj > 0.92 ? 1 - (kj - 0.92) / 0.08 : 1 });
      }
    }
    // the mark: where the original ends
    const km = P.k('mark');
    if (p.mark !== undefined && km > 0) {
      const xm = X(p.mark), g = c.g;
      g.save(); g.globalAlpha *= clamp(km); g.setLineDash([12, 9]); g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 4;
      // one dashed segment per tape band (never through the labels between the rows)
      for (let i = 0; i < n; i++) {
        const ki = E.inOut(clamp(lag(km, i, n, 0.4)));
        if (ki <= 0) continue;
        const y0 = tapeY(i) - 14, y1 = tapeY(i) + TH + 14;
        g.beginPath(); g.moveTo(xm, y0); g.lineTo(xm, lerp(y0, y1, ki)); g.stroke();
      }
      g.restore();
    }
  }

  const parts: Box[] = [...R.map((_, i) => tape(i)), ...R.map((_, i) => label(i)), ...R.map((_, i) => valueAt(i, valF[i]!))];
  if (obj) parts.push(obj);
  const lastSecVal = (i: number) => { const m = amountSecs(i); return m ? secVal(i, m - 1) : null; };
  return {
    kind: 'BaseTape',
    box: unionBox(parts),
    where: {
      label, value: (i: number) => valueAt(i, R[i]!.hide ? qF : valF[i]!), tape, kept, change: changeBox, section, secVal,
      pctLabel: i => pctLabel[i] ?? null, changeLabel: i => chLabel[i] ?? null, scale: scaleBox, tick: j => tickLabels.get(j) ?? null,
      obj, objOld, objNew, lastSecVal,
    },
    draw,
  };
}

/** "20%", "12.5%", "125%" for tick j of k sections */
export function pctText(j: number, k: number): string {
  const v = Math.round((j * 1000) / k) / 10;
  return `${v}%`;
}
function ring(c: Canvas, b: Box, col: Paint, k: number): void {
  drawOn(c, rectPts(b.x0 - 7, b.y0 - 7, b.w + 14, b.h + 14, 14), E.inOut(clamp(k)), { col, lw: 5, closed: true });
}
function glowBox(c: Canvas, b: Box, col: Paint, k: number): void {
  if (k <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= 0.3 * clamp(k); g.fillStyle = paint(c.th, col, 'fill');
  g.beginPath(); g.roundRect(b.x0 - 14, b.y0 - 8, b.w + 28, b.h + 16, 12); g.fill(); g.restore();
}
/** money digits for a section value (tests) */
export const secText = (c: number): string => digits(c);
