// ratioWorld.ts: the pictures of "What Is a Ratio, Really?" that are not maths blocks: the three 16:9 screens (phone,
// laptop, cinema) with ONE picture that scales with the screen, check / cross marks, answer cards, the camera, and a
// few TeX helpers (a digit that morphs into another while it moves). Scene-level painters: pure, theme colours only.
import { type Box, type Pt, box, clamp, lerp } from '../../src/core/math';
import { E } from '../../src/core/easing';
import { circlePts, rectPts } from '../../src/core/pts';
import { type Canvas, drawOn, fillPts, halo, strokePts } from '../../src/core/draw';
import { morph, type Shape } from '../../src/core/morph';
import { type Paint, mix, paint } from '../../src/core/theme';
import { type Formula, type TexDrawOpts, tex, texBox, texDraw, texShape } from '../../src/core/tex';

// ---------- camera ----------
export interface Cam { readonly x: number; readonly y: number; readonly z: number }
export const CAM0: Cam = { x: 960, y: 540, z: 1 };
export const lerpCam = (a: Cam, b: Cam, k: number): Cam => {
  const e = clamp(k);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: a.z * Math.pow(b.z / a.z, e) };
};
/** draw fn() through a camera: world point (cam.x, cam.y) lands on the screen centre, zoomed by cam.z */
export function withCam(c: Canvas, cam: Cam, fn: () => void): void {
  const g = c.g;
  g.save(); g.translate(960, 540); g.scale(cam.z, cam.z); g.translate(-cam.x, -cam.y); fn(); g.restore();
}
/** a world point seen through the camera */
export const camPt = (cam: Cam, p: Pt): Pt => [(p[0] - cam.x) * cam.z + 960, (p[1] - cam.y) * cam.z + 540];

// ---------- timing ----------
/** visible between a and b: fades in over fi after a, out over fo after b */
export const vis = (t: number, a: number, b: number, fi = 0.5, fo = 0.6): number =>
  E.smooth(clamp((t - a) / fi)) * (1 - E.smooth(clamp((t - b) / fo)));

// ---------- the screens ----------
export interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });
export const rectBox = (r: Rect): Box => box(r.x, r.y, r.x + r.w, r.y + r.h);

/** the same little landscape in every screen (sky, orange sun, two green hills), scaled with the screen */
export function screenPicture(c: Canvas, S: Rect, alpha = 1): void {
  if (alpha <= 0 || S.w < 2) return;
  const { g, th } = c;
  g.save(); g.globalAlpha *= clamp(alpha);
  const R = rectPts(S.x, S.y, S.w, S.h, Math.min(S.w, S.h) * 0.03, 3);
  const clip = new Path2D(); R.forEach(([x, y], i) => (i ? clip.lineTo(x, y) : clip.moveTo(x, y))); clip.closePath();
  g.clip(clip);
  const sky = g.createLinearGradient(0, S.y, 0, S.y + S.h);
  const lav = paint(th, 'link', 'fill');
  sky.addColorStop(0, mix(th.bg, lav, th.dark ? 0.16 : 0.22)); sky.addColorStop(0.75, mix(th.bg2, lav, th.dark ? 0.34 : 0.4));
  g.fillStyle = sky; g.fillRect(S.x, S.y, S.w, S.h);
  const sx = S.x + S.w * 0.7, sy = S.y + S.h * 0.44, sr = S.h * 0.13;
  halo(c, sx, sy, sr * 3.2, 'first', 0.35);
  fillPts(c, circlePts(sx, sy, sr, 48), 'first', 0.95);
  const hill = (base: number, amp: number, ph: number, col: string) => {
    const P: Pt[] = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40; P.push([S.x + u * S.w, S.y + S.h * (base - amp * Math.sin(u * Math.PI * 1.3 + ph))]); }
    P.push([S.x + S.w, S.y + S.h], [S.x, S.y + S.h]);
    fillPts(c, P, col as Paint, 1);
  };
  const green = paint(th, 'second', 'fill');
  hill(0.74, 0.12, 0.4, mix(green, th.bg, 0.55));
  hill(0.86, 0.09, 2.1, mix(green, th.bg, 0.12));
  g.restore();
}

export type DeviceKind = 'phone' | 'laptop' | 'cinema';
/** the body around a screen rect S: drawn on with k, faded with `body` (the screen itself is drawn separately) */
export function deviceBody(c: Canvas, kind: DeviceKind, S: Rect, k: number, alpha = 1): void {
  if (k <= 0 || alpha <= 0) return;
  const { th } = c, col: Paint = 'dim', lw = th.lw.thin + 0.5, fillA = 0.95 * E.inOut(clamp((k - 0.3) / 0.7));
  c.g.save(); c.g.globalAlpha *= clamp(alpha);
  if (kind === 'phone') {
    const B = rectPts(S.x - 22, S.y - 12, S.w + 44, S.h + 24, 26, 8);
    fillPts(c, B, th.panel, fillA);
    drawOn(c, B, k, { col, lw, closed: true });
    fillPts(c, circlePts(S.x - 11, S.y + S.h / 2, 3.5, 16), 'faint', fillA);
  } else if (kind === 'laptop') {
    const L = rectPts(S.x - 16, S.y - 16, S.w + 32, S.h + 32, 14, 6);
    const lb = S.y + S.h + 16;
    const base: Pt[] = [[S.x - 40, lb], [S.x + S.w + 40, lb], [S.x + S.w + 64, lb + 22], [S.x - 64, lb + 22]];
    fillPts(c, L, th.panel, fillA); fillPts(c, base, th.panel, fillA);
    drawOn(c, L, k, { col, lw, closed: true });
    drawOn(c, base, clamp(k * 1.3 - 0.3), { col, lw, closed: true });
    drawOn(c, [[S.x + S.w / 2 - 40, lb + 7], [S.x + S.w / 2 + 40, lb + 7]], clamp(k * 1.3 - 0.3), { col: 'faint', lw: th.lw.thin });
  } else {
    const F = rectPts(S.x - 10, S.y - 10, S.w + 20, S.h + 20, 6, 3);
    fillPts(c, F, th.panel, fillA * 0.6);
    drawOn(c, F, k, { col, lw, closed: true });
    // a row of seat backs in front of the screen
    const n = 9, sw = 58, gap = (S.w - n * sw) / (n - 1), y = S.y + S.h + 30;
    for (let i = 0; i < n; i++) {
      const P = rectPts(S.x + i * (sw + gap), y, sw, 28, 10, 4);
      const ki = clamp(k * 1.6 - 0.6 - i * 0.03);
      fillPts(c, P, th.panel, ki * 0.9);
      drawOn(c, P, ki, { col: 'faint', lw: th.lw.thin, closed: true });
    }
  }
  c.g.restore();
}
/** a screen: its picture (fades in with k) and outline */
export function screen(c: Canvas, S: Rect, k: number, o: { alpha?: number; outline?: Paint; lw?: number; glow?: number; pic?: number; solid?: boolean } = {}): void {
  if (k <= 0) return;
  const a = o.alpha ?? 1;
  const R = rectPts(S.x, S.y, S.w, S.h, Math.min(S.w, S.h) * 0.03, 3);
  // solid: the screen covers what is behind it (nested screens read as picture-in-picture, no ghosting)
  if (o.solid) fillPts(c, R, c.th.bg, a * E.inOut(clamp((k - 0.2) / 0.5)));
  screenPicture(c, S, a * (o.pic ?? 1) * E.inOut(clamp((k - 0.35) / 0.65)));
  const col = o.outline ?? 'dim';
  drawOn(c, R, clamp(k / 0.7), { col, lw: o.lw ?? c.th.lw.thin, closed: true, alpha: a, ...(o.glow ? { glow: o.glow, glowCol: col } : {}) });
}

// ---------- marks and cards ----------
export function checkMark(c: Canvas, x: number, y: number, s: number, k: number, col: Paint = 'link', alpha = 1): void {
  if (k <= 0) return;
  halo(c, x, y, s * 1.4, col, 0.3 * clamp(k * 2) * alpha);
  drawOn(c, [[x - 0.5 * s, y + 0.02 * s], [x - 0.14 * s, y + 0.38 * s], [x + 0.55 * s, y - 0.45 * s]], k, { col, lw: 12, glow: 16, glowCol: col, alpha });
}
export function crossMark(c: Canvas, x: number, y: number, s: number, k: number, col: Paint = 'wrong', alpha = 1): void {
  if (k <= 0) return;
  halo(c, x, y, s * 1.4, col, 0.3 * clamp(k * 2) * alpha);
  drawOn(c, [[x - 0.42 * s, y - 0.42 * s], [x + 0.42 * s, y + 0.42 * s]], clamp(k * 2), { col, lw: 12, glow: 14, glowCol: col, alpha });
  drawOn(c, [[x + 0.42 * s, y - 0.42 * s], [x - 0.42 * s, y + 0.42 * s]], clamp(k * 2 - 1), { col, lw: 12, glow: 14, glowCol: col, alpha });
}
export function card(c: Canvas, b: Box, k: number, alpha = 1, edge: Paint = 'faint'): void {
  if (k <= 0 || alpha <= 0) return;
  const R = rectPts(b.x0, b.y0, b.w, b.h, 28, 8);
  fillPts(c, R, c.th.panel, 0.85 * alpha * E.inOut(clamp((k - 0.2) / 0.8)));
  drawOn(c, R, k, { col: edge, lw: c.th.lw.thin, closed: true, alpha });
}
/** a soft rounded frame around a box (lavender by default) */
export function frameAround(c: Canvas, b: Box, k: number, o: { pad?: number; col?: Paint; glow?: number; alpha?: number; r?: number } = {}): void {
  if (k <= 0) return;
  const p = o.pad ?? 24, col = o.col ?? 'link';
  drawOn(c, rectPts(b.x0 - p, b.y0 - p, b.w + 2 * p, b.h + 2 * p, o.r ?? 22), k, { col, lw: c.th.lw.base, closed: true, glow: o.glow ?? 10, glowCol: col, alpha: o.alpha ?? 1 });
}

// ---------- TeX helpers ----------
const shapeCache = new Map<string, Shape>();
/** outlines of a TeX source placed with its anchor at (0, 0) (cached): morph between two numbers anywhere */
export function texOutline(src: string, size: number, align: 'left' | 'center' | 'right' = 'center'): Shape {
  const key = `${src}@${size}/${align}`;
  let S = shapeCache.get(key);
  if (!S) { S = texShape(tex(src), 0, 0, { size, align }); shapeCache.set(key, S); }
  return S;
}
/** a number that morphs from srcA into srcB (k) while sitting at (x, y) */
export function texMorphAt(c: Canvas, srcA: string, srcB: string, x: number, y: number, size: number, k: number, col: Paint, o: { align?: 'left' | 'center' | 'right'; alpha?: number; glow?: number } = {}): void {
  const al = o.align ?? 'center';
  if (k <= 0 || srcA === srcB) { texDraw(c, tex(k <= 0 ? srcA : srcB), x, y, { size, align: al, col, alpha: o.alpha ?? 1, glow: o.glow ?? 0 }); return; }
  if (k >= 1) { texDraw(c, tex(srcB), x, y, { size, align: al, col, alpha: o.alpha ?? 1, glow: o.glow ?? 0 }); return; }
  c.g.save(); c.g.translate(x, y);
  morph(c, texOutline(srcA, size, al), texOutline(srcB, size, al), k, { fill: col, key: `${srcA}>${srcB}@${size}/${al}`, alpha: o.alpha ?? 1, glow: 14 * E.bump(k), glowCol: col });
  c.g.restore();
}
/** TeX drawn at an interpolated place and size (a formula gliding somewhere) */
export function texGlide(c: Canvas, F: Formula, from: Pt, to: Pt, s0: number, s1: number, k: number, o: TexDrawOpts = {}): void {
  const e = E.smooth(clamp(k));
  texDraw(c, F, lerp(from[0], to[0], e), lerp(from[1], to[1], e), { ...o, size: lerp(s0, s1, e) });
}
/** offset that moves part `tag` of formula A (placed at a) onto part `tag2` of formula B (placed at b) */
export function partShift(A: Formula, a: Pt, oa: { size: number; align?: 'left' | 'center' | 'right' }, tag: string, B: Formula, b: Pt, ob: { size: number; align?: 'left' | 'center' | 'right' }, tag2 = tag): Pt {
  const p = texBox(A, a[0], a[1], oa, tag), q = texBox(B, b[0], b[1], ob, tag2);
  return [q.cx - p.cx, q.cy - p.cy];
}

// ---------- tiny icons (recap) ----------
export function miniTiles(c: Canvas, x: number, y: number, s: number, k: number): void {
  for (let i = 0; i < 5; i++) {
    const ki = clamp(k * 1.8 - i * 0.18);
    if (ki <= 0) continue;
    const P = rectPts(x + i * (s + 6) + (i >= 2 ? 8 : 0), y - s / 2, s, s, s * 0.14, 3);
    const role = i < 2 ? 'first' : 'second';
    fillPts(c, P, role, 0.9 * ki);
    strokePts(c, P, { col: paint(c.th, role, 'line'), lw: 2, closed: true, alpha: ki });
  }
}
export function miniRects(c: Canvas, x: number, y: number, u: number, k: number): void {
  // 2×3 inside 4×6 from the bottom-left corner (x, y), with the shared diagonal
  const R = (w: number, h: number) => [[x, y], [x + w * u, y], [x + w * u, y - h * u], [x, y - h * u]] as Pt[];
  drawOn(c, R(4, 6), clamp(k * 1.5), { col: 'dim', lw: 3, closed: true });
  drawOn(c, R(2, 3), clamp(k * 1.5 - 0.2), { col: 'ink', lw: 3, closed: true });
  drawOn(c, [[x, y], [x + 4 * u, y - 6 * u]], clamp(k * 1.5 - 0.5), { col: 'link', lw: 4, glow: 8, glowCol: 'link' });
}
export function miniPlane(c: Canvas, x: number, y: number, s: number, k: number): void {
  drawOn(c, [[x, y], [x + s, y]], clamp(k * 2), { col: 'ink', lw: 3 });
  drawOn(c, [[x, y], [x, y - s]], clamp(k * 2), { col: 'ink', lw: 3 });
  drawOn(c, [[x, y], [x + s * 0.62, y - s * 0.93]], clamp(k * 1.6 - 0.4), { col: 'link', lw: 4, glow: 8, glowCol: 'link' });
  [0.2, 0.4, 0.6].forEach((u, i) => {
    const kk = clamp(k * 2 - 1 - i * 0.15);
    if (kk > 0) fillPts(c, circlePts(x + s * u, y - s * u * 1.5, 6 * E.back(kk), 20), 'link', 1);
  });
}

