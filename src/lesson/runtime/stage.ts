// stage.ts: the 1920 x 1080 lesson canvas. The model on the left, the notation board on the right.
//   tr        named animated values (tr.set('e.cut', 1, 1.4); a block reads tr.k('e.cut'))
//   seq(fn)   an async beat sequence that stops when the kid leaves the part (epoch)
//   line()    a line of TeX on the board (shrinks to fit), drawn with write-on; 'key:dim' dims it
//   Lead      a leader line from a symbol to a part of the picture ('key' draws it on)
//   scene     what to draw now: the model (any painter), board lines, leaders, extras
import { begin, type Canvas } from '../../core/draw';
import { type Box, box, lerp } from '../../core/math';
import { E } from '../../core/easing';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../core/tex';
import type { Paint } from '../../core/theme';
import { frame } from '../../blocks/block';
import { dusk } from '../dusk';
import { duskRoom } from '../wash';
import { leader, slate } from '../annotate';
import { canvasFor } from '../../core/draw';

export const th = dusk;
/** the model's frame and the board */
export const MF = frame(60, 70, 940, 940);
export const BOARD = box(1240, 70, 1860, 1010), BX = BOARD.x0, LX = BX + 54, BOARD_W = BOARD.w - 108;

export class Track {
  private m = new Map<string, { a: number; b: number; t0: number; d: number }>();
  now(): number { return performance.now() / 1000; }
  set(name: string, to: number, d = 0.9, delay = 0): void {
    this.m.set(name, { a: this.k(name), b: to, t0: this.now() + delay, d: Math.max(0.001, d) });
  }
  jump(name: string, v: number): void { this.m.set(name, { a: v, b: v, t0: 0, d: 0.001 }); }
  k(name: string): number {
    const e = this.m.get(name);
    if (!e) return 0;
    const t = (this.now() - e.t0) / e.d;
    return t <= 0 ? e.a : t >= 1 ? e.b : lerp(e.a, e.b, E.smooth(t));
  }
  busy(): boolean { const n = this.now(); for (const e of this.m.values()) if (n < e.t0 + e.d + 0.05) return true; return false; }
  reset(prefix: string): void { for (const k of [...this.m.keys()]) if (k.startsWith(prefix)) this.m.delete(k); }
}
export const tr = new Track();
let epoch = 0;
export const newEpoch = (): number => ++epoch;
export const wait = (s: number) => new Promise<void>(res => setTimeout(res, s * 1000));
/** run an async sequence that stops when the kid leaves the part or the item */
export function seq(fn: (alive: () => boolean) => Promise<void>): void { const e = epoch; void fn(() => e === epoch); }
/** a value goes 0 -> 1 -> 0 (a pulse on a label while its symbol writes on) */
export async function bump(key: string, alive: () => boolean): Promise<void> {
  tr.set(key, 1, 0.35); await wait(0.9); if (!alive()) return; tr.set(key, 0, 0.6);
}

// ---------- notation lines ----------
export interface Line { key: string; F: Formula; x: number; y: number; size: number; tags?: Record<string, { col: Paint }>; col?: Paint; align?: 'left' | 'center' }
export function line(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  return { key, F, x: LX, y, size: s, tags, col };
}
/** a big centred line on a wide slate (bare-notation items) */
export function bigLine(key: string, src: string, b: Box, size = 150): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 70 && texWidth(F, s) > b.w - 140) s -= 4;
  return { key, F, x: b.cx - texWidth(F, s) / 2, y: b.cy, size: s };
}
export function drawLine(c: Canvas, L: Line): void {
  const k = tr.k(L.key);
  if (k <= 0) return;
  texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'left', k, alpha: 1 - 0.55 * tr.k(L.key + ':dim'), tags: L.tags as never, col: L.col ?? 'ink' });
}
export const partOf = (L: Line, tag: string): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }, tag as never);
export interface Lead { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
function drawLead(c: Canvas, d: Lead): void {
  const k = tr.k(d.key);
  if (k <= 0) return;
  leader(c, d.from(), d.to(), { col: d.col, k, boardX: BX, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') });
}

// ---------- the scene ----------
export interface Scene {
  /** draw the model (washes) under the board */
  model?: (c: Canvas) => void;
  /** y of the table top (default: no table above 840) */
  table?: number;
  lines: Line[];
  leads: Lead[];
  /** the slate behind the notation (null = none) */
  boardBox?: Box | null;
  extra?: (c: Canvas) => void;
}
let scene: Scene = { lines: [], leads: [] };
let dirty = true, frames = 0, wasBusy = false;
export function setScene(s: Scene): void { scene = s; dirty = true; }
export function markDirty(): void { dirty = true; }

export function startStage(cv: HTMLCanvasElement): { frames: () => number; render: () => void } {
  const render = () => {
    const cssW = cv.clientWidth || 1920, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.aspectRatio = '1920 / 1080';
    const c = canvasFor(cv, th, 1920, 1080, Math.round(cssW * dpr));
    begin(c, { board: false });
    const S = scene;
    duskRoom(c, { table: S.table ?? 840 });
    S.model?.(c);
    if (S.boardBox !== null) slate(c, S.boardBox ?? BOARD);
    for (const L of S.lines) drawLine(c, L);
    for (const d of S.leads) drawLead(c, d);
    S.extra?.(c);
  };
  const loop = (): void => {
    // draw while anything animates, and one more frame after it stops, so every animation ends on its final state
    try {
      const busy = tr.busy();
      if (dirty || busy || wasBusy) { render(); dirty = false; frames++; }
      wasBusy = busy;
    } catch (e) { console.error('render failed', e); }
    // animation frames with a timer fallback: a background page gets few frames, but state must stay current
    let next = true;
    const f = () => { if (next) { next = false; loop(); } };
    requestAnimationFrame(f); setTimeout(f, 50);
  };
  window.addEventListener('resize', () => { dirty = true; });
  loop();
  return { frames: () => frames, render };
}
