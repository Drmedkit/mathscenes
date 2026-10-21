// scenes.ts: the fixed chains of parts 1-4 (the page draws them, the test builds them and checks the maths behind
// every label). Pure data + the frame and the board box.
import { box } from '../../../core/math';
import { frame } from '../../../blocks/block';
import type { ChainParams } from './ChainTape';
import { money, pctOf, shareOf } from './chainMaths';

/** the model's frame (left) and the notation board (right, wider than the default board) */
export const CHAIN_FRAME = frame(50, 50, 960, 770);
export const PBOARD = box(1070, 70, 1860, 1010);

// 1-2: $240 budget, art : music = 3 : 5, art spends 20% of its share on paint
export const EX = { T: 240, a: 3, b: 5, p: 20 } as const;
export const EX_ART = shareOf(EX.T, [EX.a, EX.b], 0), EX_MUSIC = shareOf(EX.T, [EX.a, EX.b], 1), EX_PAINT = pctOf(EX.p, EX_ART);
export const EX_CHAIN: ChainParams = {
  rows: [
    { title: 'budget', lead: money(EX.T), base: EX.T, units: EX.a + EX.b, ticks: 10, hundred: true,
      pieces: [{ amt: EX_ART, role: 'part', inside: 'art', under: money(EX_ART) }, { amt: EX_MUSIC, role: 'rest', inside: 'music', under: money(EX_MUSIC) }] },
    { title: 'art', lead: money(EX_ART), base: EX_ART, zoomFrom: { row: 0, a: 0, b: EX_ART }, ticks: 10, hundred: true,
      pieces: [{ amt: EX_PAINT, role: 'answer', inside: `${EX.p}%`, under: money(EX_PAINT) }, { amt: EX_ART - EX_PAINT, role: 'whole', inside: `${100 - EX.p}%` }] },
  ],
};
/** the part-1 cards: the right answer, 20% of the whole budget, 20% of 3/5 of the budget */
export const EX_CARDS = { right: EX_PAINT, whole: pctOf(EX.p, EX.T), other: pctOf(EX.p, (EX.T * EX.a) / EX.b) } as const;

// 3: 36 oz of trail mix, nuts : raisins = 7 : 2, 25% of the nuts are almonds
export const TURN = { T: 36, a: 7, b: 2, p: 25 } as const;
export const TURN_NUTS = shareOf(TURN.T, [TURN.a, TURN.b], 0), TURN_RAISINS = shareOf(TURN.T, [TURN.a, TURN.b], 1), TURN_ALMONDS = pctOf(TURN.p, TURN_NUTS);
export const TURN_CHAIN: ChainParams = {
  rows: [
    { title: 'trail mix', lead: `${TURN.T} oz`, base: TURN.T, units: TURN.a + TURN.b, ticks: 4,
      pieces: [{ amt: TURN_NUTS, role: 'part', inside: 'nuts', under: `${TURN_NUTS} oz` }, { amt: TURN_RAISINS, role: 'rest', inside: 'raisins', under: `${TURN_RAISINS} oz` }] },
    { title: 'nuts', lead: `${TURN_NUTS} oz`, base: TURN_NUTS, zoomFrom: { row: 0, a: 0, b: TURN_NUTS }, ticks: 4, hundred: true,
      pieces: [{ amt: TURN_ALMONDS, role: 'answer', inside: `${TURN.p}%`, under: `${TURN_ALMONDS} oz` }, { amt: TURN_NUTS - TURN_ALMONDS, role: 'whole', inside: `${100 - TURN.p}%` }] },
  ],
};

// 4: Maya, $80 jacket, 25% off, then 8% tax on the sale price; she adds the percents: 83% of $80 = $66.40
export const PROVE = { P: 80, d: 25, t: 8 } as const;
export const PROVE_SALE = pctOf(100 - PROVE.d, PROVE.P), PROVE_TAX = pctOf(PROVE.t, PROVE_SALE), PROVE_TOTAL = PROVE_SALE + PROVE_TAX;
export const PROVE_MAYA = pctOf(100 - PROVE.d + PROVE.t, PROVE.P);
export const PROVE_CHAIN: ChainParams = {
  reach: 1.16,
  rows: [
    { title: 'price', lead: money(PROVE.P), base: PROVE.P, ticks: 4,
      pieces: [{ amt: PROVE_SALE, role: 'whole', inside: `${100 - PROVE.d}%`, under: money(PROVE_SALE) }, { amt: PROVE.P - PROVE_SALE, role: 'cut', inside: `${PROVE.d}% off`, under: money(PROVE.P - PROVE_SALE) }] },
    { title: 'sale', lead: money(PROVE_SALE), base: PROVE_SALE, zoomFrom: { row: 0, a: 0, b: PROVE_SALE },
      pieces: [{ amt: PROVE_SALE, role: 'whole', inside: '100%' }, { amt: PROVE_TAX, role: 'add', inside: `${PROVE.t}%`, under: money(PROVE_TAX) }] },
    { title: 'you pay', lead: money(PROVE_TOTAL), leadCol: 'link', base: PROVE_SALE,
      pieces: [{ amt: PROVE_TOTAL, role: 'answer', inside: `${100 + PROVE.t}%` }] },
  ],
};
