// easing.ts: easing curves k 0..1 -> 0..1 and the "animation at t0 lasting d" helper.
import { clamp } from './math';

export type Ease = (k: number) => number;

export const E = {
  lin: (k: number) => k,
  /** the default: calm in, calm out (smootherstep) */
  smooth: (k: number) => k * k * k * (k * (k * 6 - 15) + 10),
  inOut: (k: number) => k * k * (3 - 2 * k),
  out: (k: number) => 1 - Math.pow(1 - k, 3),
  in: (k: number) => k * k * k,
  back: (k: number, s = 1.4) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
  /** 0 -> 1 -> 0 */
  bump: (k: number) => Math.sin(Math.PI * clamp(k)),
} as const satisfies Record<string, Ease | ((k: number, s?: number) => number)>;

export type EaseName = keyof typeof E;

/** eased progress of an animation starting at t0 lasting d */
export const ap = (t: number, t0: number, d = 0.8, ease: Ease = E.smooth): number => ease(clamp((t - t0) / (d || 1e-9)));
