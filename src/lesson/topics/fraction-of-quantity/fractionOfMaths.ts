// fractionOfMaths.ts: the exact maths of "a/b of q" and the size of the set picture, pure (no DOM, no TeX), so the
// item generators only make problems the FractionOf model can draw, and the tests can check the maths in node.
import { type Q, qEq, qMul, rat } from '../../../core/math';
import { check } from '../../../blocks/block';

const NAME = 'FractionOf';

export interface FractionOfMaths {
  q: number; a: number; b: number;
  /** one of the b equal shares: q ÷ b */ share: Q;
  /** a copies of the share: (q ÷ b) × a = a/b × q */ result: Q;
  /** q is a multiple of b (every share is a whole number of objects / units) */ exact: boolean;
  /** -1: less than the whole, 0: the whole, 1: more than the whole (a compared with b) */ vsWhole: -1 | 0 | 1;
}

export function computeFractionOf(q: number, a: number, b: number): FractionOfMaths {
  check(Number.isInteger(q) && q >= 1 && q <= 100, NAME, `the whole q = ${q}: use a whole number from 1 to 100`);
  check(Number.isInteger(b) && b >= 2 && b <= 10, NAME, `the bottom number b = ${b}: cut the whole into 2 to 10 equal shares`);
  check(Number.isInteger(a) && a >= 1 && a <= 10, NAME, `the top number a = ${a}: take 1 to 10 shares`);
  const share = rat(q, b), result = rat(a * q, b);
  // the two facts the lesson rests on, asserted: b shares rebuild the whole, and a shares are the answer
  check(qEq(qMul(share, rat(b)), rat(q)), NAME, `${b} shares of ${q}/${b} do not rebuild ${q}`);
  check(qEq(qMul(share, rat(a)), result), NAME, `${a} copies of the share are not ${a}/${b} of ${q}`);
  return { q, a, b, share, result, exact: q % b === 0, vsWhole: a < b ? -1 : a === b ? 0 : 1 };
}

// ---------- the set picture: b trays side by side, each holding q / b objects ----------
export const SET = { gap: 18, pad: 12, og: 10, dMax: 84, dMin: 40, trayMax: 330 } as const;
export interface SetGeom { d: number; cols: number; rows: number; trayW: number; trayH: number }
/** object size and tray grid for q objects in b equal groups across width W, or null if it does not fit */
export function setGeom(q: number, b: number, W = 940): SetGeom | null {
  if (q % b !== 0 || q > 30) return null;
  const s = q / b, trayW = (W - (b - 1) * SET.gap) / b;
  for (let d = SET.dMax; d >= SET.dMin; d -= 2) {
    const cols = Math.max(1, Math.floor((trayW - 2 * SET.pad + SET.og) / (d + SET.og)));
    if (d > trayW - 2 * SET.pad) continue;
    const rows = Math.ceil(s / cols), trayH = 2 * SET.pad + rows * d + (rows - 1) * SET.og;
    if (trayH <= SET.trayMax) return { d, cols, rows, trayW, trayH };
  }
  return null;
}
export const setFits = (q: number, a: number, b: number): boolean => a <= b && setGeom(q, b) !== null;
/** a tape can always be drawn for these ranges; its sections must stay at least 60 px wide */
export const tapeFits = (q: number, a: number, b: number, W = 940): boolean =>
  b >= 2 && b <= 10 && a >= 1 && a <= 10 && q >= 1 && q <= 100 && (W * b / Math.max(a, b)) / b >= 60;
