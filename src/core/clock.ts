// clock.ts: where a block's progress comes from. A block draws from (params, Progress): progress.k(step) is 0..1 for
// each of its named steps. Two drivers produce the SAME Progress object:
//   TimeDriver  (video):        beats bound to narration cue times: k(step) = eased position of t inside its beat
//   StepDriver  (interactive):  stages of steps the kid walks through: (stage index, 0..1 inside the stage)
// A third helper, sweep(), plays all steps one after another from a single 0..1 slider (the gallery).
import { clamp, lag } from './math';
import { E, type Ease } from './easing';

export interface Progress<S extends string = string> {
  /** 0..1 progress of a step (0 = not started, 1 = done) */
  k(step: S): number;
}

export const DONE: Progress<never> & Progress<string> = { k: () => 1 };
export const NONE: Progress<never> & Progress<string> = { k: () => 0 };

/** a view of a namespaced progress: scoped(p, 'table') reads 'table.row0' as 'row0' */
export function scoped<S extends string, Pre extends string>(p: Progress<`${Pre}.${S}`>, pre: Pre): Progress<S> {
  return { k: (s: S) => p.k(`${pre}.${s}` as `${Pre}.${S}`) };
}
/** a progress from a plain function */
export const progressOf = <S extends string>(f: (s: S) => number): Progress<S> => ({ k: f });

// ---------- time (video) ----------
export interface Beat {
  /** start time (s, narration timeline) */ at: number;
  /** duration (s) */ dur?: number;
  ease?: Ease;
}
export type Beats<S extends string> = { readonly [K in S]?: Beat };

export class TimeDriver<S extends string> {
  constructor(readonly beats: Beats<S>, readonly missing: 0 | 1 = 0) {}
  /** progress at time t */
  at(t: number): Progress<S> {
    return {
      k: (s: S) => {
        const b = this.beats[s];
        if (!b) return this.missing;
        return (b.ease ?? E.smooth)(clamp((t - b.at) / ((b.dur ?? 0.8) || 1e-9)));
      },
    };
  }
  /** the time range covered by the beats */
  span(): [number, number] {
    const bs = Object.values(this.beats) as Beat[];
    return [Math.min(...bs.map(b => b.at)), Math.max(...bs.map(b => b.at + (b.dur ?? 0.8)))];
  }
}

// ---------- steps (interactive) ----------
export class StepDriver<S extends string> {
  /** stages[i] = the steps that animate when the kid reaches stage i (staggered by `lagRatio`) */
  constructor(readonly stages: readonly (readonly S[])[], readonly lagRatio = 0.25, readonly ease: Ease = E.smooth) {}
  get count(): number { return this.stages.length; }
  /** progress at stage index `stage` (0-based) and p 0..1 inside it. Earlier stages are done; later ones not started. */
  at(stage: number, p: number): Progress<S> {
    const where = new Map<S, [number, number, number]>();   // step -> [stage, index in stage, stage size]
    this.stages.forEach((st, i) => st.forEach((s, j) => { if (!where.has(s)) where.set(s, [i, j, st.length]); }));
    return {
      k: (s: S) => {
        const w = where.get(s);
        if (!w) return 0;
        const [i, j, n] = w;
        if (i < stage) return 1;
        if (i > stage) return 0;
        return this.ease(lag(clamp(p), j, n, this.lagRatio));
      },
    };
  }
}

/** all steps one after another over u 0..1 (each gets an equal slice; `overlap` lets neighbours overlap) */
export function sweep<S extends string>(steps: readonly S[], u: number, overlap = 0.15): Progress<S> {
  const n = steps.length, idx = new Map(steps.map((s, i) => [s, i] as const));
  return {
    k: (s: S) => {
      const i = idx.get(s);
      if (i === undefined || !n) return 0;
      return E.smooth(lag(clamp(u), i, n, 1 - overlap));
    },
  };
}
