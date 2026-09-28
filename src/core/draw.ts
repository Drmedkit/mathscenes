// draw.ts: the primitive painters. Every painter takes a `Canvas` ({g, th}: a 2D context in design px + the theme)
// first, so the same code draws a video frame, a live page, or a gallery card. Everything takes a progress k 0..1.
//   bg, fillPts, strokePts, drawOn (stroke reveal), borderFill (outline draws on, then the fill fades in),
//   arrow (shaft draws on, the tip grows at the end), dashLine, strike, dot, glowOn / glow / halo
import { type Pt, clamp } from './math';
import { E } from './easing';
import { partial, polyLen } from './pts';
import { type Paint, type Theme, paint, rgba } from './theme';

export const W = 1920, H = 1080;

export interface Canvas {
  readonly g: CanvasRenderingContext2D;
  readonly th: Theme;
  /** design size (px) of the drawing area */
  readonly w: number;
  readonly h: number;
}

/** wrap a <canvas>: backing store = css size x dpr, context scaled so we draw in design px (w x h) */
export function canvasFor(el: HTMLCanvasElement, th: Theme, w = W, h = H, backingW = el.width): Canvas {
  const g = el.getContext('2d');
  if (!g) throw new Error('canvasFor: no 2D context');
  if (el.width !== backingW) { el.width = backingW; }
  el.height = Math.round((backingW * h) / w);
  return { g, th, w, h };
}
/** start a frame: reset the transform to design px, clear, paint the board */
export function begin(c: Canvas, o: { board?: boolean } = {}): void {
  const { g } = c, s = g.canvas.width / c.w;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.shadowBlur = 0; g.shadowColor = 'transparent';
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  g.setTransform(s, 0, 0, s, 0, 0);
  if (o.board !== false) bg(c);
}

export function pathOf(P: readonly Pt[], closed: boolean): Path2D {
  const p = new Path2D();
  P.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (closed) p.closePath();
  return p;
}

export function bg(c: Canvas, col?: string): void {
  const { g, th, w, h } = c;
  g.save();
  g.fillStyle = col ?? th.bg; g.fillRect(0, 0, w, h);
  const r = g.createRadialGradient(w / 2, h * 0.45, 80, w / 2, h * 0.45, w * 0.7);
  r.addColorStop(0, th.light.centre); r.addColorStop(1, th.light.edge);
  g.fillStyle = r; g.fillRect(0, 0, w, h);
  g.restore();
}

// ---------- glow ----------
/** shadowBlur ignores the transform: scale it by the current zoom so 540p and 1080p look the same */
export function glowOn(c: Canvas, col: string, r: number): void {
  if (r <= 0) return;
  const m = c.g.getTransform();
  c.g.shadowColor = col; c.g.shadowBlur = r * c.th.glow * Math.hypot(m.a, m.b);
}
/** draw fn() with a soft halo (two passes: a wide faint one, then the crisp one) */
export function glow(c: Canvas, fn: () => void, col: string, r = 18, strength = 1): void {
  if (strength <= 0 || r <= 0) { fn(); return; }
  const { g } = c;
  g.save(); g.globalAlpha *= 0.55 * clamp(strength); glowOn(c, col, r * 1.8); fn(); g.restore();
  g.save(); glowOn(c, col, r * 0.7 * clamp(strength)); fn(); g.restore();
}
/** a soft light pool behind something ("look here") */
export function halo(c: Canvas, x: number, y: number, r: number, col: Paint, a = 0.25): void {
  if (a <= 0) return;
  const { g, th } = c;
  g.save();
  const gr = g.createRadialGradient(x, y, 0, x, y, r), hx = paint(th, col, 'fill');
  gr.addColorStop(0, rgba(hx, a * th.glow)); gr.addColorStop(1, rgba(hx, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
  g.restore();
}

// ---------- fills and strokes ----------
export function fillPts(c: Canvas, P: readonly Pt[], col: Paint, alpha = 1, rule: CanvasFillRule = 'nonzero'): void {
  if (alpha <= 0 || P.length < 3) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(alpha); g.fillStyle = paint(c.th, col, 'fill'); g.fill(pathOf(P, true), rule); g.restore();
}

export interface StrokeOpts {
  col?: Paint; lw?: number; alpha?: number; dash?: readonly number[] | null; cap?: CanvasLineCap;
  closed?: boolean; glow?: number; glowCol?: Paint;
}
export function strokePts(c: Canvas, P: readonly Pt[], o: StrokeOpts = {}): void {
  const a = o.alpha ?? 1;
  if (a <= 0 || P.length < 2) return;
  const { g, th } = c, col = paint(th, o.col ?? 'ink', 'text');
  g.save(); g.globalAlpha *= clamp(a);
  g.strokeStyle = col; g.lineWidth = o.lw ?? th.lw.base; g.lineCap = o.cap ?? 'round'; g.lineJoin = 'round';
  if (o.dash) g.setLineDash([...o.dash]);
  if (o.glow) glowOn(c, paint(th, o.glowCol ?? o.col ?? 'ink', 'fill'), o.glow);
  g.stroke(pathOf(P, !!o.closed));
  g.restore();
}
/** stroke reveal: the first k of the line */
export function drawOn(c: Canvas, P: readonly Pt[], k: number, o: StrokeOpts = {}): void {
  if (k <= 0) return;
  const done = k >= 1;
  strokePts(c, done && o.closed ? P : partial(P, k, !!o.closed), { ...o, closed: done && !!o.closed });
}

export interface BorderFillOpts {
  fill?: Paint; stroke?: Paint; lw?: number; fillAlpha?: number; alpha?: number;
  /** the outline stays at the end (default true) */ keepStroke?: boolean;
  glow?: number; glowCol?: Paint; dash?: readonly number[] | null;
}
/** the outline draws on (k 0 -> .6), the fill fades in (k .35 -> 1) */
export function borderFill(c: Canvas, P: readonly Pt[], k: number, o: BorderFillOpts = {}): void {
  if (k <= 0) return;
  const ks = clamp(k / 0.6), kf = E.inOut(clamp((k - 0.35) / 0.65)), a = o.alpha ?? 1;
  if (o.fill && kf > 0) {
    c.g.save();
    if (o.glow) glowOn(c, paint(c.th, o.glowCol ?? o.fill, 'fill'), o.glow);
    fillPts(c, P, o.fill, kf * (o.fillAlpha ?? 1) * a);
    c.g.restore();
  }
  const sa = o.keepStroke === false ? 1 - kf : 1;
  if (o.stroke && sa > 0) drawOn(c, P, ks, { col: o.stroke, lw: o.lw ?? c.th.lw.thin, closed: true, alpha: sa * a, dash: o.dash ?? null });
}

export interface ArrowOpts { col?: Paint; lw?: number; head?: number; alpha?: number; glow?: number; glowCol?: Paint }
/** arrow along a polyline: the shaft draws on, the tip grows in over the last 40 % */
export function arrow(c: Canvas, P: readonly Pt[], k = 1, o: ArrowOpts = {}): void {
  if (k <= 0 || P.length < 2) return;
  const col = o.col ?? 'ink', lw = o.lw ?? c.th.lw.base, head = o.head ?? lw * 4.2;
  const Q = partial(P, k), n = Q.length;
  const [x1, y1] = Q[n - 1]!, [x0, y0] = Q[Math.max(0, n - 2)]!;
  let ang = Math.atan2(y1 - y0, x1 - x0);
  if (n < 2 || (x1 === x0 && y1 === y0)) ang = Math.atan2(P[1]![1] - P[0]![1], P[1]![0] - P[0]![0]);
  const hk = clamp((k - 0.6) / 0.4), hl = head * hk;
  const shaft = hk > 0 ? partial(Q, Math.max(0, 1 - (hl * 0.6) / (polyLen(Q) || 1))) : Q;
  const so: StrokeOpts = { col, lw, alpha: o.alpha ?? 1 };
  if (o.glow) { so.glow = o.glow; so.glowCol = o.glowCol ?? col; }
  strokePts(c, shaft, so);
  if (hk > 0) {
    const w = hl * 0.62, cs = Math.cos(ang), sn = Math.sin(ang);
    const tip: Pt = [x1, y1];
    const L: Pt = [x1 - cs * hl - sn * w, y1 - sn * hl + cs * w];
    const R: Pt = [x1 - cs * hl + sn * w, y1 - sn * hl - cs * w];
    const M: Pt = [x1 - cs * hl * 0.72, y1 - sn * hl * 0.72];
    c.g.save();
    if (o.glow) glowOn(c, paint(c.th, o.glowCol ?? col, 'fill'), o.glow);
    fillPts(c, [tip, L, M, R], paint(c.th, col, 'text'), o.alpha ?? 1);
    c.g.restore();
  }
}
export function dashLine(c: Canvas, a: Pt, b: Pt, o: StrokeOpts = {}): void {
  strokePts(c, [a, b], { col: 'faint', lw: c.th.lw.thin, dash: [10, 10], cap: 'butt', ...o });
}
/** a strike: a line that draws on from (x0, y0) to (x1, y1), in `wrong` with a faint glow */
export function strike(c: Canvas, x0: number, y0: number, x1: number, y1: number, k: number, o: StrokeOpts = {}): void {
  const col = o.col ?? 'wrong';
  drawOn(c, [[x0, y0], [x1, y1]], k, { col, lw: c.th.lw.bold, glow: 10, glowCol: col, ...o });
}
export function dot(c: Canvas, x: number, y: number, r: number, col: Paint, alpha = 1): void {
  if (alpha <= 0 || r <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(alpha); g.fillStyle = paint(c.th, col, 'fill');
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
}
/** run fn with the global alpha multiplied by a (skips when a <= 0) */
export function withAlpha(c: Canvas, a: number, fn: () => void): void {
  if (a <= 0) return;
  c.g.save(); c.g.globalAlpha *= clamp(a); fn(); c.g.restore();
}
