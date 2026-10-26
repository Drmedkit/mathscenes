// Race: two (or one) lanes on a track with a ruler in feet. Each lane holds a runner (a greyhound or a car) and its
// speed written in its own unit. 'run' plays ONE second: every runner moves its speed in feet per second, so the
// lanes compare two speeds in the same unit without any arithmetic on screen (the fair test of the lesson).
// Steps: track, lane0, lane1, run, marks.  Focus: rings on lanes, a dashed "one second" finish line.
import { type Box, box, clamp } from '../../../core/math';
import { type Canvas, withAlpha } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { DUSK } from '../../dusk';
import { drawWords, wordsBox } from '../../words';
import { fmt } from './units';

const NAME = 'Race';
export type RaceStep = 'track' | 'lane0' | 'lane1' | 'run' | 'marks';
export interface Lane { who: 'dog' | 'car'; name: string; rate: string; ftps: number; col?: Paint }
export interface RaceParams { lanes: readonly Lane[]; max: number; step: number }
export interface RaceFocus { ring?: { lane: number; col: Paint; k: number }[]; hideRates?: number }
export interface RaceBlock {
  readonly kind: 'Race';
  readonly where: { lane(i: number): Box; end(i: number): Box; rate(i: number): Box };
  draw(c: Canvas, P: Progress<RaceStep>, f?: RaceFocus): void;
}

const LAB = 46, NUM = 46, LANE_H = 118, GAP = 26, LW = 420;

export function Race(p: RaceParams, fr: Frame, th: Theme): RaceBlock {
  const n = p.lanes.length;
  check(n >= 1 && n <= 2, NAME, 'one or two lanes');
  const x0 = fr.x + LW, x1 = fr.x + fr.w - 60, ppf = (x1 - x0) / p.max;
  const ticks = Math.round(p.max / p.step);
  check(Math.abs(ticks * p.step - p.max) < 1e-9 && (x1 - x0) / ticks >= 90, NAME, 'ruler labels too dense');
  for (const L of p.lanes) check(L.ftps > 0 && L.ftps <= p.max * 0.92, NAME, `${L.name} runs off the ruler`);
  const laneY = (i: number) => fr.y + 30 + i * (LANE_H + GAP) + LANE_H / 2;
  const rulerY = laneY(n - 1) + LANE_H / 2 + 34;
  check(rulerY + 90 <= fr.y + fr.h, NAME, 'the ruler leaves the frame');
  const X = (ft: number) => x0 + ft * ppf;

  function dog(c: Canvas, x: number, y: number, col: Paint, a: number): void {
    const P: [number, number][] = [[-150, -4], [-132, -24], [-70, -30], [-36, -24], [-22, -40], [-10, -46], [2, -40], [14, -30], [2, -24], [-14, -20],
      [-30, -6], [-44, 10], [-74, 12], [-118, 10], [-142, 12]];
    withAlpha(c, a, () => {
      for (const [ax, bx, s] of [[-44, -22, 1], [-52, -66, 2], [-120, -150, 3], [-112, -96, 4]] as const)
        inkLine(c, [[x + ax, y + 4], [x + bx, y + 40]], { col: col, w: 9, seed: 30 + s });
      inkLine(c, [[x - 148, y - 2], [x - 168, y - 18], [x - 178, y - 40]], { col: col, w: 7, seed: 41 });
      wash(c, P.map(([u, v]) => [x + u, y + v]), col, { seed: 21, inkW: 3, shade: 0.3, rough: 1.2 });
      c.g.save(); c.g.fillStyle = DUSK.ink; c.g.beginPath(); c.g.arc(x - 4, y - 34, 3.5, 0, Math.PI * 2); c.g.fill(); c.g.restore();
    });
  }
  function car(c: Canvas, x: number, y: number, col: Paint, a: number): void {
    withAlpha(c, a, () => {
      wash(c, [[x - 170, y + 22], [x - 170, y - 6], [x - 140, y - 12], [x - 110, y - 44], [x - 52, y - 44], [x - 26, y - 12], [x, y - 4], [x, y + 22]].map(([u, v]) => [u, v] as [number, number]), col, { seed: 23, inkW: 3, shade: 0.3, rough: 1.0 });
      wash(c, [[x - 104, y - 14], [x - 86, y - 36], [x - 58, y - 36], [x - 40, y - 14]], '#CFE6F2', { seed: 24, inkW: 2, shade: 0.1, rough: 0.6 });
      for (const wx of [x - 134, x - 38]) {
        c.g.save(); c.g.fillStyle = DUSK.ink; c.g.beginPath(); c.g.arc(wx, y + 24, 18, 0, Math.PI * 2); c.g.fill();
        c.g.fillStyle = '#9A9EC0'; c.g.beginPath(); c.g.arc(wx, y + 24, 7, 0, Math.PI * 2); c.g.fill(); c.g.restore();
      }
    });
  }
  function ring(c: Canvas, B: Box, col: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 5;
    g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 12;
    g.beginPath(); g.roundRect(B.x0 - 10, B.y0 - 8, B.w + 20, B.h + 16, 16); g.stroke(); g.restore();
  }
  const laneBox = (i: number) => box(fr.x + 6, laneY(i) - LANE_H / 2, x1 + 30, laneY(i) + LANE_H / 2);
  const rateBox = (i: number) => wordsBox(p.lanes[i]!.rate, fr.x + 24, laneY(i) + 26, { size: LAB });
  const endBox = (i: number) => { const x = X(p.lanes[i]!.ftps); return box(x - 4, laneY(i) - 50, x + 4, rulerY); };

  function draw(c: Canvas, P: Progress<RaceStep>, f: RaceFocus = {}): void {
    const kT = P.k('track');
    if (kT <= 0) return;
    const kRun = clamp(P.k('run')), kM = clamp(P.k('marks'));
    withAlpha(c, kT, () => {
      // lanes: dark asphalt strips with dashed centre lines
      for (let i = 0; i < n; i++) {
        const y = laneY(i);
        wash(c, [[x0 - 190, y - LANE_H / 2], [x1 + 30, y - LANE_H / 2], [x1 + 30, y + LANE_H / 2], [x0 - 190, y + LANE_H / 2]], '#2B2F55', { seed: 50 + i, inkW: 2.5, shade: 0.15, rough: 0.8 });
      }
      // start line and ruler
      const g = c.g;
      g.save(); g.strokeStyle = DUSK.cream; g.lineWidth = 4;
      g.beginPath(); g.moveTo(x0, laneY(0) - LANE_H / 2 - 6); g.lineTo(x0, rulerY); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.moveTo(x0, rulerY); g.lineTo(x1, rulerY); g.stroke();
      for (let t = 0; t <= ticks; t++) {
        const x = X(t * p.step);
        g.beginPath(); g.moveTo(x, rulerY); g.lineTo(x, rulerY + 16); g.stroke();
        drawWords(c, fmt(t * p.step), x, rulerY + 46, 'dim', 1, { size: NUM, align: 'center' });
        if (t % 1 === 0 && t < ticks) { g.save(); g.lineWidth = 2; g.beginPath(); const xm = X((t + 0.5) * p.step); g.moveTo(xm, rulerY); g.lineTo(xm, rulerY + 9); g.stroke(); g.restore(); }
      }
      g.restore();
      drawWords(c, 'feet', x0 - 30, rulerY + 46, 'dim', 1, { size: LAB, align: 'right' });
    });
    for (let i = 0; i < n; i++) {
      const L = p.lanes[i]!, kl = clamp(P.k(i === 0 ? 'lane0' : 'lane1'));
      if (kl <= 0) continue;
      const y = laneY(i), col = paint(th, L.col ?? (L.who === 'dog' ? 'second' : 'first'), 'fill');
      const x = X(L.ftps * kRun);
      // trail behind the runner while it moves
      if (kRun > 0) { const g = c.g; g.save(); g.globalAlpha *= 0.35 * kl; g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y + 40); g.lineTo(x, y + 40); g.stroke(); g.restore(); }
      if (L.who === 'dog') dog(c, x, y + 2, col, kl); else car(c, x, y + 4, col, kl);
      drawWords(c, L.name, fr.x + 24, y - 24, 'ink', kl, { size: LAB });
      drawWords(c, L.rate, fr.x + 24, y + 26, L.who === 'dog' ? 'second' : 'first', kl * (1 - clamp(f.hideRates ?? 0)), { size: LAB });
      if (kM > 0) {
        const xe = X(L.ftps), g = c.g;
        g.save(); g.globalAlpha *= kM; g.setLineDash([8, 7]); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 3;
        g.beginPath(); g.moveTo(xe, y + 48); g.lineTo(xe, rulerY - 4); g.stroke(); g.restore();
        drawWords(c, `${fmt(Math.round(L.ftps * 10) / 10)} ft`, xe + 18, y - 34, L.who === 'dog' ? 'second' : 'first', kM, { size: LAB });
      }
    }
    for (const R of f.ring ?? []) ring(c, laneBox(R.lane), R.col, R.k);
  }
  return { kind: 'Race', where: { lane: laneBox, end: endBox, rate: rateBox }, draw };
}
