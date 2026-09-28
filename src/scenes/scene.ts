// scene.ts: a scene = blocks + pictures composed on beats bound to narration cues. build() runs once (after TeX is
// ready) and returns a pure draw(c, t): the same t always gives the same frame, so frames can render in any order.
import type { Canvas } from '../core/draw';
import type { Theme } from '../core/theme';

export interface SceneRun {
  /** draw the frame at narration time t (the canvas is already cleared + boarded) */
  draw(c: Canvas, t: number): void;
}
export interface SceneDef {
  readonly id: string;
  readonly title: string;
  /** the scene's span on the narration timeline (s) */
  readonly t0: number;
  readonly t1: number;
  /** the narration mix this scene is timed against (repo-relative), and where scene time 0 sits in it */
  readonly audio?: { readonly file: string; readonly offset: number };
  build(th: Theme): SceneRun;
}
