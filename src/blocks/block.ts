// block.ts: what every block shares.
//
// A block is made in two phases, both pure:
//   1. compute<X>(params)          -> the maths (exact rationals), validated. Throws BlockError on nonsense.
//   2. <X>(params, frame, theme)   -> layout inside a frame (design px) + a draw(c, progress) function. Layout checks
//                                     the readability rules (numbers >= theme.font.minNum px, labels >= minLabel, no
//                                     overlapping labels, no text over lines) and throws BlockError if they can't hold.
// draw() keeps no state: the same (params, progress) always gives the same picture.
import { type Box, type Pt, type Q, toQ } from '../core/math';
import type { Canvas } from '../core/draw';
import type { Progress } from '../core/clock';

export class BlockError extends Error {
  constructor(readonly block: string, message: string) { super(`${block}: ${message}`); this.name = 'BlockError'; }
}
export function check(cond: unknown, block: string, msg: string): asserts cond {
  if (!cond) throw new BlockError(block, msg);
}

/** the area a block may use, in design px */
export interface Frame { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export const frame = (x: number, y: number, w: number, h: number): Frame => ({ x, y, w, h });

export interface Block<S extends string> {
  readonly kind: string;
  /** the build steps in their natural order (the gallery sweeps them; a StepDriver can stage them) */
  readonly steps: readonly S[];
  /** the ink bounds of the fully built block */
  readonly box: Box;
  draw(c: Canvas, p: Progress<S>): void;
}

/** a slider description for the gallery (numbers only; enums as index sliders) */
export interface ParamSpec<P> {
  readonly key: keyof P & string;
  readonly label: string;
  readonly min: number; readonly max: number; readonly step: number;
}

/** layout rule "never text over lines": does any polyline pass through the (padded) box? */
export function hitsLines(b: Box, lines: readonly (readonly Pt[])[], pad = 6): boolean {
  const x0 = b.x0 - pad, x1 = b.x1 + pad, y0 = b.y0 - pad, y1 = b.y1 + pad;
  for (const P of lines) {
    for (let i = 1; i < P.length; i++) {
      const a = P[i - 1]!, c = P[i]!, n = Math.max(1, Math.ceil(Math.hypot(c[0] - a[0], c[1] - a[1]) / 4));
      for (let j = 0; j <= n; j++) {
        const x = a[0] + ((c[0] - a[0]) * j) / n, y = a[1] + ((c[1] - a[1]) * j) / n;
        if (x > x0 && x < x1 && y > y0 && y < y1) return true;
      }
    }
  }
  return false;
}
/** a positive whole number or friendly fraction (denominator <= 12), as an exact rational */
export function friendly(x: number, block: string, what: string, o: { positive?: boolean; whole?: boolean } = {}): Q {
  check(Number.isFinite(x), block, `${what} must be a number`);
  if (o.positive !== false) check(x > 0, block, `${what} must be more than 0 (got ${x})`);
  const q = toQ(x);
  check(q !== null, block, `${what} = ${x} is not a friendly number (a whole number or a fraction with a small denominator)`);
  if (o.whole) check(q.q === 1, block, `${what} must be a whole number (got ${x})`);
  return q;
}
/** text safe inside \text{...} */
export function plainText(s: string, block: string, what: string): string {
  check(s.trim().length > 0, block, `${what} is empty`);
  check(!/[\\{}$%#&_^~]/.test(s), block, `${what} "${s}" may not contain TeX special characters`);
  return s;
}

/** run a factory, turning BlockErrors into a message (for pages that show the problem instead of drawing) */
export function tryBlock<T>(make: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try { return { ok: true, value: make() }; }
  catch (e) {
    if (e instanceof BlockError) return { ok: false, error: e.message };
    if (e instanceof Error && e.name === 'TexError') return { ok: false, error: e.message };
    throw e;
  }
}
