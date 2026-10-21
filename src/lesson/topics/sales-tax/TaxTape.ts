// TaxTape: a purchase as a receipt and a tape, the model of "8% sales tax on $60". Concreteness fading in one block:
//   receipt  a painted register slip: the item, Subtotal (the pre-tax price), Tax (rate) and Total (the real object);
//   tape     the SAME pre-tax price as one amber tape braced "100% = $60" (the pre-tax price is the whole);
//   tax      the tax sticks OUT of the tape on the right (teal, r% of the same whole), labelled in a column beside it
//            (tax / 8% / $4.80), so no label ever sits on the narrow stub;
//   total    a brace under tape + stub: "total 108% = $64.80" (lime): the total is MORE than 100% of the price.
// Optional: equal cells (10% each) on the 100% part; benchmark marks (a dashed ghost cell to 10% and a dashed tick at
// 5%, or 8% and 9%) so the tax can be seen between two bounds; a second "rebase" tape (the total taken as 100%, its
// own cells) whose cells drift past the first tape's cells: 8% of the total is 8% of a BIGGER whole.
// Maths: taxMaths.ts (exact cents, milli-percent rates, units of $0.0000001).
// Steps: receipt, rPrice, rTax, rTotal, tape, whole, cells, bench, tax, total, totalPct, rebase.
// Leaders from the board should target the RIGHT-most parts (the tax column, the receipt amounts, the total amount).
import { type Box, type Pt, box, clamp, lag, unionBox } from '../../../core/math';
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
import { type Tax, M_WHOLE, pct, salesTax, usdTex, usdUTex } from './taxMaths';

export interface TaxTapeParams {
  /** pre-tax price (the taxable amount), cents */ price: number;
  /** rate, milli-percent (8% = 8000) */ rate: number;
  /** the item named on the receipt */ item?: string;
  /** several items on the receipt (exempt ones are not taxed); the price is then the taxable subtotal */
  items?: { name: string; cents: number; exempt?: boolean }[];
  /** draw the receipt (default: when an item or items are given) */ receipt?: boolean;
  /** draw the tape (default true) */ tape?: boolean;
  /** equal cells across the 100% part (10 = 10% cells; 0 = none) */ cells?: number;
  /** benchmark percents bracketing the rate, e.g. [5, 10] or [8, 9] */ bench?: [number, number];
  /** amounts shown as "?" */ hide?: { price?: boolean; tax?: boolean; total?: boolean; rate?: boolean; totalPct?: boolean };
  /** the tax label shows the exact (unrounded) tax */ exactTax?: boolean;
  /** a second tape: the total taken as 100%, with its own cells */ rebase?: boolean;
}
export type TaxTapeStep = 'receipt' | 'rPrice' | 'rTax' | 'rTotal' | 'tape' | 'whole' | 'cells' | 'bench' | 'tax' | 'total' | 'totalPct' | 'rebase';
export const TAX_TAPE_STEPS: readonly TaxTapeStep[] = ['receipt', 'rPrice', 'rTax', 'rTotal', 'tape', 'whole', 'cells', 'bench', 'tax', 'total', 'totalPct', 'rebase'];
type Part = 'price' | 'tax' | 'total' | 'receipt' | 'bench' | 'rebase';
type Col = 'pick' | 'link' | 'first' | 'second' | 'wrong';
export interface TaxTapeFocus {
  parts?: readonly Part[];
  k?: number;
  col?: Col;
  /** pulses 0..1: a symbol on the board and its labels in the picture (receipt + tape) light up together */
  pPrice?: number; pTax?: number; pTotal?: number;
}
export interface TaxTapeBlock {
  readonly kind: 'TaxTape';
  readonly tax: Tax;
  readonly box: Box;
  readonly where: {
    receipt: Box; rPrice: Box; rTax: Box; rTotal: Box; rTaxWord: Box;
    whole: Box; stub: Box; total: Box; bench: Box; rebase: Box;
    priceLbl: Box; taxWord: Box; taxPct: Box; taxAmt: Box; taxCol: Box; totalLbl: Box; totalAmt: Box; totalPct: Box;
  };
  draw(c: Canvas, p: Progress<TaxTapeStep>, focus?: TaxTapeFocus): void;
}

const NAME = 'TaxTape';
const WORD = 46, PCT = 60, AMT = 66, RAMT = 62, TH = 110, TH2 = 100, ROW = 70;
const SLIP = '#2B2752', SLIP_EDGE = '#8C80B8';

export function TaxTape(p: TaxTapeParams, fr: Frame, th: Theme): TaxTapeBlock {
  const T = salesTax(p.price, p.rate);
  if (p.item) plainText(p.item, NAME, 'item');
  for (const it of p.items ?? []) plainText(it.name, NAME, 'item name');
  if (p.items) {
    check(p.items.length >= 1 && p.items.length <= 4, NAME, 'a receipt lists 1 to 4 items');
    const taxable = p.items.filter(i => !i.exempt).reduce((s, i) => s + i.cents, 0);
    check(taxable === p.price, NAME, `the taxable items (${taxable}¢) must add up to the price (${p.price}¢)`);
  }
  const hide = p.hide ?? {}, cells = p.cells ?? 0, r = p.rate / M_WHOLE;
  const showReceipt = p.receipt ?? !!(p.item || p.items), showTape = p.tape ?? true;
  check(showReceipt || showTape, NAME, 'draw the receipt, the tape or both');
  check(cells === 0 || (Number.isInteger(cells) && cells >= 2 && cells <= 20), NAME, `cells = ${cells}: use 0 or 2 to 20`);
  if (p.bench) check(p.bench[0] < p.bench[1] && p.bench[1] <= 20 && p.bench[0] >= 0, NAME, 'benchmarks must be two percents, low then high, up to 20%');
  const x0 = fr.x, W = fr.w, x1 = x0 + W;
  const Q = '\\$\\,?';
  const F = (s: string) => tex(s) as Formula;
  const rateTxt = hide.rate ? '?' : pct(p.rate);
  const subtotalC = p.items ? p.items.reduce((s, i) => s + i.cents, 0) : p.price;

  // ---------- the formulas ----------
  const PL = F(`100\\% = ${hide.price ? Q : usdTex(p.price, true)}`);
  const TP = F(`${rateTxt}\\%`);
  const TA = F(hide.tax ? Q : p.exactTax ? usdUTex(T.taxU) : usdTex(T.tax, true));
  const TT1 = F(`${hide.totalPct || hide.rate ? '?' : pct(M_WHOLE + p.rate)}\\% =`);
  const TT2 = F(hide.total ? Q : usdTex(T.total, true));
  const TOTW = p.items && subtotalC !== p.price ? 'with tax' : 'total';
  const RP = F(hide.price && !p.items ? Q : usdTex(subtotalC, true));
  const RT = F(hide.tax ? Q : usdTex(T.tax, true));
  const RTo = F(hide.total ? Q : usdTex(subtotalC - p.price + T.total, true));
  const RQ = F(Q);
  const RI = (p.items ?? []).map(i => F(usdTex(i.cents, true)));

  // ---------- the receipt ----------
  const rows: { word: string; F: Formula; col: 'ink' | 'first' | 'second' | 'link' | 'dim'; key: 'item' | 'price' | 'tax' | 'total'; dimWord?: boolean }[] = [];
  (p.items ?? []).forEach((it, i) => rows.push({ word: it.name + (it.exempt ? ' (no tax)' : ''), F: RI[i]!, col: 'ink', key: 'item' }));
  rows.push({ word: 'Subtotal', F: RP, col: p.items ? 'ink' : 'first', key: 'price' });
  rows.push({ word: `Tax (${rateTxt}%)`, F: RT, col: 'second', key: 'tax' });
  rows.push({ word: 'Total', F: RTo, col: 'link', key: 'total' });
  const header = p.items ? 'Receipt' : (p.item ?? 'Receipt');
  let receipt = box(x0, fr.y, x0, fr.y);
  const rowY: number[] = [];
  const rowAmt: Box[] = [], rowWord: Box[] = [];
  const GAP = 52;
  const usedTape = 72 + 8 + 30 + 10 + TH + 18 + 26 + 18 + 72 + (p.rebase ? 30 + TH2 : 0);
  const usedReceipt = showReceipt ? 30 + 58 + rows.length * ROW + 26 : 0;
  const usedAll = (showReceipt ? usedReceipt : 0) + (showReceipt && showTape ? GAP : 0) + (showTape ? usedTape : 0);
  const rTop = fr.y + clamp((fr.h - usedAll) / 2, 14, 200);
  if (showReceipt) {
    const wordW = Math.max(wordsBox(header, 0, 0, { size: WORD }).w, ...rows.map(rw => wordsBox(rw.word, 0, 0, { size: WORD }).w));
    const amtW = Math.max(...rows.map(rw => texBox(rw.F, 0, 0, { size: RAMT }).w), texBox(RQ, 0, 0, { size: RAMT }).w);
    const RW = 48 + wordW + 64 + amtW + 48;
    const RH = usedReceipt;
    check(RW <= W - 20, NAME, `the receipt (${Math.round(RW)} px) is wider than the frame`);
    const rx0 = x0 + 24;
    receipt = box(rx0, rTop, rx0 + RW, rTop + RH);
    rows.forEach((rw, i) => {
      const y = rTop + 30 + 58 + ROW * i + ROW / 2;
      rowY.push(y);
      rowWord.push(wordsBox(rw.word, rx0 + 48, y, { size: WORD }));
      rowAmt.push(texBox(rw.F, receipt.x1 - 48, y, { size: RAMT, align: 'right' }));
    });
  }
  const idx = (k: 'price' | 'tax' | 'total') => rows.findIndex(rw => rw.key === k);
  const rPrice = showReceipt ? rowAmt[idx('price')]! : receipt, rTax = showReceipt ? rowAmt[idx('tax')]! : receipt, rTotal = showReceipt ? rowAmt[idx('total')]! : receipt;
  const rTaxWord = showReceipt ? rowWord[idx('tax')]! : receipt;

  // ---------- the tape: vertical layout ----------
  const colW = Math.max(wordsBox('tax', 0, 0, { size: WORD }).w, texBox(TP, 0, 0, { size: PCT }).w, texBox(TA, 0, 0, { size: AMT }).w);
  const reach = Math.max(r, p.bench ? p.bench[1] / 100 : 0);
  const W100 = Math.min(600, (W - 24 - colW - 8) / (1 + reach));
  check(W100 >= 380, NAME, `the tape would be only ${Math.round(W100)} px for 100%: the tax column is too wide`);
  const xc = x0 + W100, xT = xc + W100 * r;
  const xb = (q: number) => xc + (W100 * q) / 100;
  const colX = Math.max(xT, p.bench ? xb(p.bench[1]) : xT) + 24;
  const tTop = showReceipt ? receipt.y1 + GAP : rTop;
  const yA = tTop + 36;
  const braceY1 = yA + 36 + 8 + 30;
  const barY0 = braceY1 + 10, barY1 = barY0 + TH, barCy = (barY0 + barY1) / 2;
  const tBrace = barY1 + 18;
  const yTot = tBrace + 26 + 18 + 36;
  const rbY0 = yTot + 36 + 30, rbY1 = rbY0 + TH2;
  const bottom = p.rebase ? rbY1 : yTot + 36;
  if (showTape) check(bottom <= fr.y + fr.h + 0.5, NAME, `the model needs ${Math.round(bottom - fr.y)} px, the frame has ${fr.h}`);

  // ---------- the tape: horizontal layout ----------
  const whole = box(x0, barY0, xc, barY1), stub = box(xc, barY0, Math.max(xc, xT), barY1), total = box(x0, barY0, xT, barY1);
  const centreIn = (cx: number, w: number, lo: number, hi: number) => clamp(cx, lo + w / 2, hi - w / 2);
  const plW = texBox(PL, 0, 0, { size: AMT }).w;
  const priceLbl = texBox(PL, centreIn((x0 + xc) / 2, plW, x0, xc), yA, { size: AMT, align: 'center' });
  check(priceLbl.x1 <= xc + 1, NAME, 'the 100% label is wider than the pre-tax part of the tape');
  const colH = WORD + 10 + PCT + 10 + AMT, colTop = barCy - colH / 2;
  const taxWord = wordsBox('tax', colX, colTop + WORD / 2, { size: WORD });
  const taxPct = texBox(TP, colX, colTop + WORD + 10 + PCT / 2, { size: PCT, align: 'left' });
  const taxAmt = texBox(TA, colX, colTop + WORD + 10 + PCT + 10 + AMT / 2, { size: AMT, align: 'left' });
  const taxCol = unionBox([taxWord, taxPct, taxAmt]);
  check(taxCol.x1 <= x1 + 0.5, NAME, `the tax column runs out of the frame (${Math.round(taxCol.x1 - x1)} px)`);
  check(taxCol.y0 > priceLbl.y1 || taxCol.x0 > priceLbl.x1 + 20, NAME, 'the tax column and the 100% label collide');
  const twW = wordsBox(TOTW, 0, 0, { size: WORD }).w, t1W = texBox(TT1, 0, 0, { size: AMT }).w, t2W = texBox(TT2, 0, 0, { size: AMT }).w;
  const groupW = twW + 22 + t1W + 14 + t2W;
  const gx0 = centreIn((x0 + xT) / 2, groupW, x0, x1) - groupW / 2;
  const totalWord = wordsBox(TOTW, gx0, yTot, { size: WORD });
  const totalPct = texBox(TT1, gx0 + twW + 22, yTot, { size: AMT, align: 'left' });
  const totalAmt = texBox(TT2, totalPct.x1 + 14, yTot, { size: AMT, align: 'left' });
  const totalLbl = unionBox([totalWord, totalPct, totalAmt]);
  check(totalLbl.x1 <= x1 + 0.5, NAME, 'the total label runs out of the frame');
  check(totalLbl.y0 > taxCol.y1 + 4 || totalLbl.x1 < taxCol.x0 - 20, NAME, 'the total label and the tax column collide');
  const bench = p.bench ? box(xc, barY0 - 16, xb(p.bench[1]), barY1 + 16) : box(xc, barY0, xc, barY1);
  const rebase = box(x0, rbY0, xT, rbY1);
  if (showReceipt && showTape) check(receipt.y1 + 20 < priceLbl.y0, NAME, 'the receipt and the tape overlap');
  const inside = 'pre-tax price', insideW = wordsBox(inside, 0, 0, { size: WORD }).w;
  const insideFits = insideW + 40 < W100;

  const roleFill = (c: Col | 'first' | 'second' | 'link') => paint(th, c, 'fill');

  function draw(c: Canvas, P: Progress<TaxTapeStep>, f: TaxTapeFocus = {}): void {
    const kR = P.k('receipt'), kRP = P.k('rPrice'), kRT = P.k('rTax'), kRTo = P.k('rTotal');
    const kTape = P.k('tape'), kWhole = P.k('whole'), kCells = P.k('cells'), kBench = P.k('bench'), kTax = P.k('tax');
    const kTot = P.k('total'), kTotP = P.k('totalPct'), kReb = P.k('rebase');
    const fk = clamp(f.k ?? 0), fcol = f.col ?? 'pick';
    const on = (pt: Part) => (f.parts ?? []).includes(pt) && fk > 0;

    // ----- the receipt -----
    if (showReceipt && kR > 0) {
      withAlpha(c, E.smooth(kR), () => {
        const dy = (1 - E.out(kR)) * -20;
        c.g.save(); c.g.translate(0, dy);
        const slip = slipPts(receipt);
        wash(c, slip, SLIP, { seed: 31, rough: 1.2, inkW: 2.5, shade: 0.25 });
        inkLine(c, slip, { col: SLIP_EDGE, w: 2, seed: 32, closed: true, alpha: 0.55, rough: 0.5 });
        drawWords(c, header, receipt.x0 + 48, rTop + 30 + 26, 'dim', 1, { size: WORD });
        // a dotted rule under the header and above the total
        const rule = (y: number, seed: number) => inkLine(c, [[receipt.x0 + 40, y], [receipt.x1 - 40, y]], { col: SLIP_EDGE, w: 2, seed, alpha: 0.5, rough: 0.4 });
        rule(rTop + 30 + 58 - 4, 33);
        rule(rowY[rows.length - 1]! - ROW / 2 + 2, 34);
        rows.forEach((rw, i) => {
          const y = rowY[i]!;
          drawWords(c, rw.word, receipt.x0 + 48, y, rw.key === 'item' ? 'dim' : rw.col === 'ink' ? 'dim' : rw.col, 1, { size: WORD });
          const k = rw.key === 'price' ? kRP : rw.key === 'tax' ? kRT : rw.key === 'total' ? kRTo : kRP;
          if (k < 1) texDraw(c, RQ, receipt.x1 - 48, y, { size: RAMT, align: 'right', col: 'faint', alpha: 1 - k });
          if (k > 0) texDraw(c, rw.F, receipt.x1 - 48, y, { size: RAMT, align: 'right', col: rw.col === 'dim' ? 'ink' : rw.col, k });
        });
        if (on('receipt')) ring(c, receipt, fcol, fk, 18);
        c.g.restore();
      });
      if (showReceipt) {
        pulse(c, rPrice, 'first', f.pPrice ?? 0);
        pulse(c, rTax, 'second', f.pTax ?? 0);
        pulse(c, rTotal, 'link', f.pTotal ?? 0);
      }
    }
    if (!showTape) return;

    // ----- the 100% tape -----
    if (kTape > 0) {
      const w = Math.max(30, W100 * E.inOut(kTape));
      wash(c, rectPts(x0, barY0, w, TH, 14), 'first', { seed: 41, inkW: 3, shade: 0.3 });
      if (insideFits) drawWords(c, inside, (x0 + xc) / 2, barCy, DUSK.navy, clamp(kTape * 2 - 1), { size: WORD, align: 'center', weight: 650 });
    }
    // equal cells: short ticks at the top and bottom edges
    if (kCells > 0 && cells > 1) ticks(c, x0, W100, barY0, barY1, cells, kCells, 30, 60);
    // the benchmarks: a dashed ghost cell out to the upper bound, a dashed tick at the lower bound
    if (kBench > 0 && p.bench) {
      const g = c.g, kk = E.inOut(kBench);
      g.save(); g.globalAlpha *= clamp(kBench); g.setLineDash([12, 9]); g.strokeStyle = roleFill('pick'); g.lineWidth = 4;
      const xh = xb(p.bench[1]), xl = xb(p.bench[0]);
      g.beginPath(); g.moveTo(xc, barY0 - 16); g.lineTo(xc + (xh - xc) * kk, barY0 - 16); g.lineTo(xh, barY0 - 16 + (TH + 32) * kk);
      g.moveTo(xc, barY1 + 16); g.lineTo(xc + (xh - xc) * kk, barY1 + 16);
      if (p.bench[0] > 0) { g.moveTo(xl, barY0 - 16); g.lineTo(xl, barY0 - 16 + (TH + 32) * kk); }
      g.stroke(); g.restore();
    }
    // the tax sticks out on the right
    if (kTax > 0 && xT - xc > 0.5) {
      const w = Math.max(2, (xT - xc) * E.inOut(kTax));
      withAlpha(c, E.smooth(clamp(kTax * 3)), () => wash(c, rectPts(xc - 3, barY0, w + 3, TH, Math.min(10, w / 2)), 'second', { seed: 52, inkW: 3, rough: 0.8, shade: 0.25 }));
    }
    if (kTax > 0) {
      const kl = clamp(kTax * 1.6 - 0.6);
      drawWords(c, 'tax', taxWord.x0, taxWord.cy, 'second', kl, { size: WORD });
      texDraw(c, TP, taxPct.x0, taxPct.cy, { size: PCT, align: 'left', col: 'second', k: kl });
      texDraw(c, TA, taxAmt.x0, taxAmt.cy, { size: AMT, align: 'left', col: 'second', k: kl });
    }
    pulse(c, unionBox([taxPct, taxAmt]), 'second', kTax > 0.5 ? f.pTax ?? 0 : 0);
    // the pre-tax price over the 100% part
    pulse(c, priceLbl, 'first', f.pPrice ?? 0);
    if (kWhole > 0) {
      texDraw(c, PL, priceLbl.cx, yA, { size: AMT, align: 'center', col: 'first', k: kWhole });
      drawOn(c, bracePts([x0 + 4, braceY1], [xc - 4, braceY1], 24), kWhole, { col: paint(th, 'first', 'line'), lw: 3.5 });
    }
    // the total under tape + tax
    if (kTot > 0) {
      drawOn(c, bracePts([xT - 4, tBrace], [x0 + 4, tBrace], 24), kTot, { col: paint(th, 'link', 'line'), lw: 3.5 });
      drawWords(c, TOTW, totalWord.x0, yTot, 'link', kTot, { size: WORD });
      texDraw(c, TT2, totalAmt.x0, yTot, { size: AMT, align: 'left', col: 'link', k: kTot });
    }
    if (kTotP > 0) texDraw(c, TT1, totalPct.x0, yTot, { size: AMT, align: 'left', col: 'link', k: kTotP });
    pulse(c, kTotP > 0.5 ? unionBox([totalPct, totalAmt]) : totalAmt, 'link', kTot > 0.5 ? f.pTotal ?? 0 : 0);
    // the rebase tape: the total taken as 100%, with its own cells
    if (kReb > 0) {
      const w = Math.max(30, (xT - x0) * E.inOut(kReb));
      withAlpha(c, 0.9, () => wash(c, rectPts(x0, rbY0, w, TH2, 14), 'link', { seed: 61, inkW: 3, shade: 0.3 }));
      drawWords(c, 'the total as 100%', (x0 + xT) / 2, (rbY0 + rbY1) / 2, DUSK.navy, clamp(kReb * 2 - 1), { size: WORD, align: 'center', weight: 650 });
      ticks(c, x0, xT - x0, rbY0, rbY1, cells || 10, clamp(kReb * 1.5 - 0.5), 22, 90);
    }
    if (on('price')) ring(c, whole, fcol, fk, 14);
    if (on('tax') && stub.w > 0) ring(c, box(stub.x0, stub.y0, Math.max(stub.x1, stub.x0 + 12), stub.y1), fcol, fk, 10);
    if (on('total')) ring(c, total, fcol, fk, 14);
    if (on('bench')) ring(c, bench, fcol, fk, 10);
    if (on('rebase')) ring(c, rebase, fcol, fk, 14);
  }

  function ticks(c: Canvas, xa: number, w: number, y0: number, y1: number, n: number, k: number, len: number, seed: number): void {
    for (let j = 1; j < n; j++) {
      const kj = E.smooth(lag(k, j - 1, n - 1, 0.5));
      if (kj <= 0) continue;
      const x = xa + (w * j) / n;
      inkLine(c, [[x, y0 + 6], [x, y0 + len]], { col: DUSK.ink, w: 3, seed: seed + j, alpha: 0.65 * kj });
      inkLine(c, [[x, y1 - len], [x, y1 - 6]], { col: DUSK.ink, w: 3, seed: seed + 30 + j, alpha: 0.65 * kj });
    }
  }
  function pulse(c: Canvas, B: Box, col: 'first' | 'second' | 'link', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = roleFill(col);
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 8, B.y0 - 4, B.x1 + 8, B.y1 + 4), col, k, 14, 0.8);
  }
  function ring(c: Canvas, R: Box, col: Col | 'first' | 'second' | 'link', k: number, rr: number, glow = 0.6): void {
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = roleFill(col); g.lineWidth = 5;
    g.shadowColor = roleFill(col); g.shadowBlur = 16 * glow * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 6, R.y0 - 6, R.w + 12, R.h + 12, rr); g.stroke(); g.restore();
  }

  const parts: Box[] = [];
  if (showReceipt) parts.push(receipt);
  if (showTape) parts.push(priceLbl, total, taxCol, totalLbl, ...(p.rebase ? [rebase] : []));
  return {
    kind: 'TaxTape', tax: T, box: unionBox(parts),
    where: { receipt, rPrice, rTax, rTotal, rTaxWord, whole, stub, total, bench, rebase, priceLbl, taxWord, taxPct, taxAmt, taxCol, totalLbl, totalAmt, totalPct },
    draw,
  };
}

/** a register slip: straight sides, a torn zigzag top and bottom */
function slipPts(b: Box): Pt[] {
  const n = Math.max(6, Math.round(b.w / 34)), step = b.w / n, z = 9;
  const P: Pt[] = [];
  for (let i = 0; i <= n; i++) P.push([b.x0 + i * step, b.y0 + (i % 2 ? z : 0)]);
  for (let i = n; i >= 0; i--) P.push([b.x0 + i * step, b.y1 - (i % 2 ? z : 0)]);
  return P;
}
