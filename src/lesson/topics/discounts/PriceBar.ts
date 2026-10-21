// PriceBar: a sale as a price tag and a tape of the original price (the 100% whole), the model of "15% off $80".
// Concreteness fading inside one block:
//   tag    a painted hang tag with the item and its price (the real object); at the end the price is struck and the
//          sale price is written beside it, as a shop does;
//   bar    the SAME price as one tape, braced as "100% = $80" (the original price is the whole);
//   cut    the tape is cut at p%: the discount is the end you do NOT pay (teal, right), the sale price is the rest
//          (lime, left). Under each part: its percent, a brace, its dollars and its name.
// Optional equal cells (10 cells = 10% each) make benchmark percents readable; a dashed half mark is the bound
// check ("more or less than half price?"). The maths comes from discountMaths.ts (exact ticks of $0.0001).
// Steps: tag, bar, whole, ticks, cut, disc, sale, paid, tagSale, half.
// Leaders from the board should target the RIGHT-most parts (the discount labels, the bar's right end, the tag),
// so they never cross the picture; the sale labels are linked by a pulse.
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
import { type Sale, dollarSale, percentSale, usdTex } from './discountMaths';

export interface PriceBarParams {
  /** original price, cents */ price: number;
  /** percent off (0..100); leave out for a dollars-off sale */ pct?: number | null;
  /** dollars-off sale: the discount in cents */ off?: number;
  /** the item on the tag (no tag when left out) */ item?: string;
  /** amounts with cents ($80.00) */ cents?: boolean;
  /** equal cells across the tape (10 = 10% cells; 0 = none) */ ticks?: number;
  /** amounts shown as "?" */ hide?: { orig?: boolean; disc?: boolean; sale?: boolean; pct?: boolean; paid?: boolean };
  /** the sale label shows the exact value (fractions of a cent) instead of the rounded price */ exactSale?: boolean;
  /** word labels under the parts (default true) */ words?: boolean;
  /** dollar amounts under the parts (default true; false = percents only, the dollars only on the 100% whole) */ amounts?: boolean;
  /** the tag's sale price is unknown ("?") */ tagHide?: boolean;
}
export type PriceBarStep = 'tag' | 'bar' | 'whole' | 'ticks' | 'cut' | 'disc' | 'sale' | 'paid' | 'tagSale' | 'half';
export const PRICE_BAR_STEPS: readonly PriceBarStep[] = ['tag', 'bar', 'whole', 'ticks', 'cut', 'disc', 'sale', 'paid', 'tagSale', 'half'];
type Part = 'disc' | 'sale' | 'whole' | 'tag';
type Col = 'pick' | 'link' | 'first' | 'second' | 'wrong';
export interface PriceBarFocus {
  parts?: readonly Part[];
  k?: number;
  col?: Col;
  /** pulses 0..1: a symbol on the board and its label in the picture light up together */
  pOrig?: number; pDisc?: number; pSale?: number; pTag?: number;
}
export interface PriceBarBlock {
  readonly kind: 'PriceBar';
  readonly sale: Sale;
  readonly box: Box;
  readonly where: {
    tag: Box; tagPrice: Box; tagSale: Box;
    whole: Box; disc: Box; sale: Box; cutX: number; half: Box;
    origLabel: Box; origWord: Box;
    discPct: Box; discAmt: Box; discWord: Box; discLabels: Box;
    salePct: Box; saleAmt: Box; saleWord: Box; saleLabels: Box;
  };
  draw(c: Canvas, p: Progress<PriceBarStep>, focus?: PriceBarFocus): void;
}

const NAME = 'PriceBar';
const WORD = 46, PCT = 60, AMT = 66, TAG_PRICE = 78, TH = 120;
const TAG_COL = '#3B3166';

export function PriceBar(p: PriceBarParams, fr: Frame, th: Theme): PriceBarBlock {
  const sale = p.pct === undefined || p.pct === null ? dollarSale(p.price, p.off ?? 0) : percentSale(p.price, p.pct);
  const isPct = sale.pct !== null;
  if (p.item) plainText(p.item, NAME, 'item');
  const cents = !!p.cents, hide = p.hide ?? {}, words = p.words ?? true, amounts = p.amounts ?? true;
  const x0 = fr.x, W = fr.w, x1 = x0 + W;
  const ticks = p.ticks ?? 0;
  check(ticks === 0 || (Number.isInteger(ticks) && ticks >= 2 && ticks <= 20), NAME, `ticks = ${ticks}: use 0 or 2 to 20 equal cells`);
  const Q = '\\$\\,?';
  const F = (s: string) => tex(s) as Formula;

  // ---------- the formulas ----------
  const origSrc = isPct ? `100\\% = ${hide.orig ? Q : usdTex(sale.origT, cents)}` : hide.orig ? Q : usdTex(sale.origT, cents);
  const OF = F(origSrc);
  const DP = isPct ? F(hide.pct ? '?\\%\\ \\text{off}' : `${sale.pct}\\%\\ \\text{off}`) : null;
  const DA = F(hide.disc ? Q : usdTex(sale.discT, cents));
  const SP = isPct ? F(hide.paid ? '?\\%' : `${sale.paid}\\%`) : null;
  const SA = F(hide.sale ? Q : usdTex(p.exactSale ? sale.saleT : sale.saleRT, cents));
  const TP = F(usdTex(sale.origT, cents));
  const TS = F(p.tagHide ? Q : usdTex(sale.saleRT, cents));

  // ---------- vertical layout ----------
  const tagH = 196, tagZone = p.item ? tagH + 44 : 0;
  const rowA = 72, braceH = 30;
  // the model's height (from the tag or the original-price row down to the last label row), centred in the frame
  const used = tagZone + rowA + 8 + braceH + 10 + TH + (isPct ? 24 + PCT : 0) + 18 + 26 + (amounts ? 18 + AMT : 0) + (words && amounts ? 16 + WORD : !amounts ? 18 + WORD : 0);
  const top = fr.y + clamp((fr.h - used) / 2, 0, 140);
  const yA = top + tagZone + rowA / 2;
  const braceY1 = yA + rowA / 2 + 8 + braceH;
  const barY0 = braceY1 + 10, barY1 = barY0 + TH;
  const yP = barY1 + 24 + PCT / 2;
  const bTop = (isPct ? yP + PCT / 2 : barY1) + 18;
  const bBase = bTop + 26;
  const yD = bBase + 18 + AMT / 2;
  const yW = amounts ? yD + AMT / 2 + 16 + WORD / 2 : yD - (AMT - WORD) / 2;
  const bottom = (words || !amounts ? yW + WORD / 2 : yD + AMT / 2);
  check(bottom <= fr.y + fr.h + 0.5, NAME, `the model needs ${Math.round(bottom - fr.y)} px, the frame has ${fr.h}`);

  // ---------- horizontal layout ----------
  const xc = x0 + W * (1 - sale.frac);                       // the cut: sale on the left, discount on the right
  const whole = box(x0, barY0, x1, barY1);
  const saleBox = box(x0, barY0, xc, barY1), discBox = box(xc, barY0, x1, barY1);
  const centreIn = (cx: number, w: number) => clamp(cx, x0 + w / 2, x1 - w / 2);
  const texAt = (Fm: Formula, cx: number, y: number, size: number) => {
    const w = texBox(Fm, 0, 0, { size, align: 'center' }).w;
    return texBox(Fm, centreIn(cx, w), y, { size, align: 'center' });
  };
  const wordAt = (t: string, cx: number, y: number) => {
    const w = wordsBox(t, 0, y, { size: WORD }).w;
    return wordsBox(t, centreIn(cx, w), y, { size: WORD, align: 'center' });
  };
  const sCx = (x0 + xc) / 2, dCx = (xc + x1) / 2;
  const origWord = wordsBox('original price', x0, yA, { size: WORD + 2 });
  const origLabel = texBox(OF, x1, yA, { size: AMT, align: 'right' });
  check(!words || origWord.x1 + 30 < origLabel.x0, NAME, 'the original-price label and its words collide');
  const discPct = DP ? texAt(DP, dCx, yP, PCT) : box(dCx, yP, dCx, yP);
  const salePct = SP ? texAt(SP, sCx, yP, PCT) : box(sCx, yP, sCx, yP);
  const discAmt = texAt(DA, dCx, yD, AMT), saleAmt = texAt(SA, sCx, yD, AMT);
  const discWord = wordAt('discount', dCx, yW), saleWord = wordAt('sale price', sCx, yW);
  const rows: [Box, Box][] = amounts ? [[saleAmt, discAmt]] : [];
  if (DP && SP) rows.push([salePct, discPct]);
  if (words || !amounts) rows.push([saleWord, discWord]);
  for (const [a, b] of rows) check(a.x1 + 24 < b.x0, NAME, `labels under the bar collide (${Math.round(a.x1)} > ${Math.round(b.x0)})`);
  const discLabels = unionBox([...(amounts ? [discAmt] : []), ...(DP ? [discPct] : []), ...(words || !amounts ? [discWord] : [])]);
  const saleLabels = unionBox([...(amounts ? [saleAmt] : []), ...(SP ? [salePct] : []), ...(words || !amounts ? [saleWord] : [])]);
  const half = box(x0 + W / 2 - 3, barY0 - 26, x0 + W / 2 + 3, barY1 + 26);

  // ---------- the tag ----------
  const tx0 = x0 + 64, ty0 = top + 22;
  const tpW = texBox(TP, 0, 0, { size: TAG_PRICE }).w, tsW = texBox(TS, 0, 0, { size: TAG_PRICE }).w;
  const itemW = p.item ? wordsBox(p.item, 0, 0, { size: WORD }).w : 0;
  const tagW = 96 + Math.max(itemW, tpW + 48 + tsW) + 44;
  check(!p.item || tx0 + tagW <= x1, NAME, `the tag (${Math.round(tagW)} px) is wider than the frame`);
  const tag = box(tx0, ty0, tx0 + tagW, ty0 + tagH);
  const tagPrice = texBox(TP, tx0 + 96, ty0 + 132, { size: TAG_PRICE, align: 'left' });
  const tagSale = texBox(TS, tagPrice.x1 + 48, ty0 + 132, { size: TAG_PRICE, align: 'left' });
  const tagPts: Pt[] = [[tx0, tag.cy], [tx0 + 58, ty0], [tag.x1, ty0], [tag.x1, tag.y1], [tx0 + 58, tag.y1]];
  const hole: Pt = [tx0 + 46, tag.cy];

  const roleFill = (r: Col | 'first') => paint(th, r, 'fill');

  function draw(c: Canvas, P: Progress<PriceBarStep>, f: PriceBarFocus = {}): void {
    const kTag = P.k('tag'), kBar = P.k('bar'), kWhole = P.k('whole'), kTicks = P.k('ticks'), kCut = P.k('cut');
    const kDisc = P.k('disc'), kSale = P.k('sale'), kPaid = P.k('paid'), kTS = P.k('tagSale'), kHalf = P.k('half');
    const fk = clamp(f.k ?? 0), fcol = f.col ?? 'pick';
    const on = (pt: Part) => (f.parts ?? []).includes(pt) && fk > 0;

    // ----- the tag -----
    if (p.item && kTag > 0) {
      withAlpha(c, E.smooth(kTag), () => {
        const dy = (1 - E.out(kTag)) * -24;
        c.g.save(); c.g.translate(0, dy);
        // the string from the hole up to the top of the frame
        inkLine(c, [[hole[0], hole[1]], [hole[0] - 18, ty0 + 30], [hole[0] - 30, fr.y - 6]], { col: '#CDBFE0', w: 3, seed: 21 });
        wash(c, tagPts, TAG_COL, { seed: 23, rough: 1.4, inkW: 3, shade: 0.3 });
        inkLine(c, tagPts, { col: '#8C80B8', w: 2, seed: 24, closed: true, alpha: 0.6, rough: 0.6 });
        c.g.save(); c.g.fillStyle = DUSK.navy; c.g.beginPath(); c.g.arc(hole[0], hole[1], 13, 0, Math.PI * 2); c.g.fill(); c.g.restore();
        inkLine(c, circle(hole, 14), { col: '#CDBFE0', w: 2.5, closed: true, seed: 25, rough: 0.4 });
        drawWords(c, p.item!, tx0 + 96, ty0 + 52, 'dim', 1, { size: WORD });
        texDraw(c, TP, tagPrice.x0, tagPrice.cy, { size: TAG_PRICE, align: 'left', col: 'first', alpha: 1 - 0.45 * kTS });
        if (kTS > 0) {
          drawOn(c, [[tagPrice.x0 - 8, tagPrice.cy + 10], [tagPrice.x1 + 8, tagPrice.cy - 8]], E.inOut(clamp(kTS * 2)), { col: paint(th, 'ink', 'line'), lw: 5 });
          texDraw(c, TS, tagSale.x0, tagSale.cy, { size: TAG_PRICE, align: 'left', col: 'link', k: clamp(kTS * 2 - 0.6) });
        }
        if (on('tag')) ring(c, tag, fcol, fk, 18);
        c.g.restore();
      });
      pulse(c, tagPrice, 'first', f.pTag ?? 0);
    }

    // ----- the original price over the whole tape -----
    pulse(c, origLabel, 'first', f.pOrig ?? 0);
    if (kWhole > 0) {
      if (words) drawWords(c, 'original price', x0, yA, 'first', kWhole, { size: WORD + 2 });
      texDraw(c, OF, origLabel.x1, yA, { size: AMT, align: 'right', col: 'first', k: kWhole });
      drawOn(c, bracePts([x0 + 4, braceY1], [x1 - 4, braceY1], 24), kWhole, { col: paint(th, 'first', 'line'), lw: 3.5 });
    }

    // ----- the tape -----
    if (kBar > 0) {
      const w = Math.max(30, W * E.inOut(kBar));
      wash(c, rectPts(x0, barY0, w, TH, 14), 'first', { seed: 41, inkW: 3, shade: 0.3 });
    }
    // the parts take their colours (the discount first, then the sale price)
    const partWash = (B: Box, col: 'second' | 'link', k: number, seed: number) => {
      if (k <= 0 || B.w < 1) return;
      withAlpha(c, E.smooth(k), () => wash(c, rectPts(B.x0 + 3, B.y0 + 3, Math.max(4, B.w - 6), B.h - 6, 11), col, { seed, ink: null, rough: 1.2, shade: 0.25 }));
    };
    partWash(discBox, 'second', kDisc, 52);
    partWash(saleBox, 'link', kSale, 53);
    // equal cells: short ticks at the top and bottom edges
    if (kTicks > 0 && ticks > 1) {
      for (let j = 1; j < ticks; j++) {
        const kj = E.smooth(lag(kTicks, j - 1, ticks - 1, 0.5));
        if (kj <= 0) continue;
        const x = x0 + (W * j) / ticks;
        inkLine(c, [[x, barY0 + 6], [x, barY0 + 30]], { col: DUSK.ink, w: 3, seed: 60 + j, alpha: 0.6 * kj });
        inkLine(c, [[x, barY1 - 30], [x, barY1 - 6]], { col: DUSK.ink, w: 3, seed: 80 + j, alpha: 0.6 * kj });
      }
    }
    // the cut at p%
    if (kCut > 0 && sale.frac > 0 && sale.frac < 1) {
      const g = c.g, kk = E.inOut(kCut);
      g.save(); g.strokeStyle = roleFill('second'); g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xc, barY0 - 14); g.lineTo(xc, barY0 - 14 + (TH + 28) * kk); g.stroke(); g.restore();
    }
    if (on('whole')) ring(c, whole, fcol, fk, 14);
    if (on('disc') && discBox.w > 0) ring(c, discBox, fcol, fk, 12);
    if (on('sale') && saleBox.w > 0) ring(c, saleBox, fcol, fk, 12);
    // the half mark (bounds)
    if (kHalf > 0) {
      const g = c.g; g.save(); g.globalAlpha *= clamp(kHalf); g.setLineDash([12, 9]); g.strokeStyle = roleFill('pick'); g.lineWidth = 4;
      g.beginPath(); g.moveTo(half.cx, half.y0); g.lineTo(half.cx, half.y0 + (half.h) * E.inOut(kHalf)); g.stroke(); g.restore();
    }

    // ----- labels under the parts -----
    pulse(c, discLabels, 'second', f.pDisc ?? 0);
    pulse(c, saleLabels, 'link', f.pSale ?? 0);
    const partLabels = (B: Box, k: number, col: 'second' | 'link', Pc: Formula | null, pcBox: Box, kPc: number, Am: Formula, amBox: Box, word: string, wBox: Box) => {
      if (k <= 0) return;
      if (Pc && kPc > 0) texDraw(c, Pc, pcBox.cx, yP, { size: PCT, align: 'center', col, k: kPc });
      if (B.w > 8) drawOn(c, bracePts([B.x1 - 4, bTop], [B.x0 + 4, bTop], Math.min(22, B.w / 3)), k, { col: paint(th, col, 'line'), lw: 3.5 });
      if (amounts) texDraw(c, Am, amBox.cx, yD, { size: AMT, align: 'center', col, k });
      if (words || !amounts) drawWords(c, word, wBox.cx, yW, col, k, { size: WORD, align: 'center' });
    };
    partLabels(discBox, kDisc, 'second', DP, discPct, kDisc, DA, discAmt, 'discount', discWord);
    partLabels(saleBox, kSale, 'link', SP, salePct, kPaid, SA, saleAmt, 'sale price', saleWord);
  }

  function pulse(c: Canvas, B: Box, col: 'first' | 'second' | 'link', k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k) * 0.2; g.fillStyle = roleFill(col);
    g.beginPath(); g.roundRect(B.x0 - 14, B.y0 - 10, B.w + 28, B.h + 20, 14); g.fill(); g.restore();
    ring(c, box(B.x0 - 8, B.y0 - 4, B.x1 + 8, B.y1 + 4), col, k, 14, 0.8);
  }
  function ring(c: Canvas, R: Box, col: Col | 'first', k: number, r: number, glow = 0.6): void {
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k);
    g.strokeStyle = roleFill(col); g.lineWidth = 5;
    g.shadowColor = roleFill(col); g.shadowBlur = 16 * glow * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(R.x0 - 6, R.y0 - 6, R.w + 12, R.h + 12, r); g.stroke(); g.restore();
  }

  const all = unionBox([...(p.item ? [tag] : []), origLabel, whole, discLabels, saleLabels]);
  return {
    kind: 'PriceBar', sale, box: all,
    where: {
      tag, tagPrice, tagSale, whole, disc: discBox, sale: saleBox, cutX: xc, half, origLabel, origWord,
      discPct, discAmt, discWord, discLabels, salePct, saleAmt, saleWord, saleLabels,
    },
    draw,
  };
}

function circle(c: Pt, r: number, n = 24): Pt[] {
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r] as Pt; });
}
