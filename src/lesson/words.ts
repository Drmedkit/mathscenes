// words.ts: plain words on the canvas in a clean sans (labels such as "3 bars"), measured exactly so annotation
// leaders and layout checks can use their boxes. Notation stays MathJax; words are not maths and read better in the
// same sans as the page UI.
import { type Box, box, clamp } from '../core/math';
import type { Canvas } from '../core/draw';
import { type Paint, paint } from '../core/theme';

export const SANS = '"Segoe UI Variable Display", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
let meas: CanvasRenderingContext2D | null = null;
const font = (size: number, weight: number) => `${weight} ${size}px ${SANS}`;

export interface WordsOpts { size?: number; weight?: number; align?: 'left' | 'center' | 'right' }
/** the ink box of a word label whose vertical middle is at y */
export function wordsBox(text: string, x: number, y: number, o: WordsOpts = {}): Box {
  const size = o.size ?? 50;
  meas ??= document.createElement('canvas').getContext('2d');
  let w = text.length * size * 0.52;
  if (meas) { meas.font = font(size, o.weight ?? 600); w = meas.measureText(text).width; }
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  return box(x0, y - size * 0.42, x0 + w, y + size * 0.42);
}
/** draw a label: it fades in and rises 12 px as k goes 0 -> 1 */
export function drawWords(c: Canvas, text: string, x: number, y: number, col: Paint, k = 1, o: WordsOpts = {}): void {
  const kk = clamp(k);
  if (kk <= 0) return;
  const { g } = c, size = o.size ?? 50;
  g.save();
  g.globalAlpha *= kk;
  g.font = font(size, o.weight ?? 600);
  g.textAlign = o.align ?? 'left'; g.textBaseline = 'middle';
  g.fillStyle = paint(c.th, col, 'text');
  g.fillText(text, x, y + (1 - kk) * 12);
  g.restore();
}
