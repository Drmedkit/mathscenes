// kit.ts: a look at the shared high school kit (src/lesson/kit) on the lesson stage. Dev only (not in the build).
// ?n=0.. picks an example; ?k=0..1 freezes the steps at that point (screenshots); otherwise the steps play in turn.
import { canvasFor, begin } from '../src/core/draw';
import { progressOf } from '../src/core/clock';
import { clamp } from '../src/core/math';
import { duskRoom } from '../src/lesson/wash';
import { dusk } from '../src/lesson/dusk';
import { MF } from '../src/lesson/runtime/stage';
import { frame } from '../src/blocks/block';
import { Plane, type PFocus, type PParams } from '../src/lesson/kit/Plane';

const wide = frame(60, 70, 1800, 940);
const EX: { title: string; fr: typeof MF; p: PParams; f?: PFocus }[] = [
  { title: 'two lines and a point (systems)', fr: MF, p: { x: { min: -2, max: 8, step: 1, name: 'x' }, y: { min: -2, max: 8, step: 1, name: 'y' }, equal: true, items: [
    { kind: 'curve', key: 'l1', f: x => 0.5 * x + 2, name: 'y = 0.5x + 2' },
    { kind: 'curve', key: 'l2', f: x => -x + 5, col: 'water', name: 'y = −x + 5' },
    { kind: 'point', key: 'P', x: 2, y: 3, name: '(2, 3)' },
  ] } },
  { title: 'parabola, vertex, axis of symmetry, trace', fr: MF, p: { x: { min: -3, max: 5, step: 1, name: 'x' }, y: { min: -5, max: 6, step: 1, name: 'y' }, items: [
    { kind: 'vline', key: 'axis', x: 1, col: 'pick' },
    { kind: 'curve', key: 'q', f: x => (x - 1) ** 2 - 4, name: 'y = (x − 1)² − 4' },
    { kind: 'point', key: 'V', x: 1, y: -4, name: 'vertex' },
    { kind: 'point', key: 'r1', x: -1, y: 0, col: 'second' }, { kind: 'point', key: 'r2', x: 3, y: 0, col: 'second' },
  ] }, f: { trace: { key: 'q', x: 3.5, k: 1 } } },
  { title: 'inequality: shaded half-plane, dashed boundary', fr: MF, p: { x: { min: -4, max: 6, step: 1, name: 'x' }, y: { min: -4, max: 6, step: 1, name: 'y' }, items: [
    { kind: 'shade', key: 'region', lo: -4, hi: 6, top: 'top', bottom: x => 2 * x - 1 },
    { kind: 'curve', key: 'b', f: x => 2 * x - 1, dash: true, name: 'y > 2x − 1' },
  ] } },
  { title: 'rational function with asymptotes', fr: MF, p: { x: { min: -6, max: 6, step: 1, name: 'x' }, y: { min: -6, max: 6, step: 1, name: 'y' }, items: [
    { kind: 'vline', key: 'va', x: 2 }, { kind: 'hline', key: 'ha', y: 1 },
    { kind: 'curve', key: 'r', f: x => (x + 1) / (x - 2), name: 'y = (x + 1)/(x − 2)' },
  ] } },
  { title: 'piecewise with open and closed ends', fr: MF, p: { x: { min: -4, max: 6, step: 1, name: 'hours' }, y: { min: 0, max: 10, step: 2, name: 'cost ($)' }, items: [
    { kind: 'curve', key: 'a', f: () => 4, lo: 0, hi: 2, ends: ['closed', 'open'] },
    { kind: 'curve', key: 'b', f: x => 2 * x, lo: 2, hi: 5, ends: ['closed', 'none'], col: 'water' },
  ] } },
  { title: 'sine wave, radian ticks, area under a curve (wide)', fr: wide, p: {
    x: { min: 0, max: 2 * Math.PI, step: Math.PI / 4, name: 'angle (radians)', fmt: v => (['0', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4', '2π'][Math.round(v / (Math.PI / 4))] ?? '') },
    y: { min: -1.5, max: 1.5, step: 0.5, name: 'y' }, items: [
      { kind: 'shade', key: 'area', lo: 0, hi: Math.PI, top: Math.sin, bottom: () => 0, col: 'second' },
      { kind: 'curve', key: 's', f: Math.sin, name: 'y = sin x' },
      { kind: 'seg', key: 'v', a: [Math.PI / 2, 0], b: [Math.PI / 2, 1], col: 'first', arrow: true },
    ] } },
];

const q = new URLSearchParams(location.search), n = Number(q.get('n') ?? 0) % EX.length, fixed = q.get('k');
const ex = EX[n]!;
document.querySelector('h1')!.textContent = `Kit · Plane · ${n}: ${ex.title}`;
const block = Plane(ex.p, ex.fr, dusk);
const steps = ['axes', ...(ex.p.items ?? []).map(i => i.key)];
const cv = document.getElementById('cv') as HTMLCanvasElement;
const t0 = performance.now();
function render(): void {
  const t = fixed !== null ? Number(fixed) * steps.length : (performance.now() - t0) / 700;
  const c = canvasFor(cv, dusk, 1920, 1080, Math.round((cv.clientWidth || 1920) * Math.min(2, devicePixelRatio || 1)));
  begin(c, { board: false });
  duskRoom(c, { table: 1040 });
  block.draw(c, progressOf(s => clamp(t - steps.indexOf(s))), t >= steps.length ? ex.f : undefined);
  if (fixed === null && t < steps.length + 1) requestAnimationFrame(render);
}
cv.style.aspectRatio = '1920 / 1080';
render();
(window as unknown as { kitReady: boolean }).kitReady = true;
