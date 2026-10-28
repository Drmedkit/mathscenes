// RangeStrip: a number line for the third side of a triangle (or for x when a side is x + k / kx). The axis with its
// ticks and tick numbers shows from the start; the solve brings in the open circles at both ends (the endpoints are
// excluded: a + b would lay the sides flat), the interval between them and, for "whole lengths", a dot on every whole
// number strictly inside. Layout is pure (layoutStrip, stripProblems for the tests); the painter draws it.
// Steps: k (axis), ks (the solved interval). Could move to the kit: a number line with an open interval.
import type { Canvas } from '../../../core/draw';
import { dot, strokePts } from '../../../core/draw';
import { type Box, clamp } from '../../../core/math';
import { paint } from '../../../core/theme';
import { label } from '../geometry-foundations/GeoFig';
import { textW } from '../geometry-foundations/geo';
import { fmt, wholeIn } from './ineq';

export interface StripSpec {
  lo: number; hi: number;
  /** the axis runs from 0 to max */
  max: number;
  /** dots on the whole numbers strictly inside */
  whole?: boolean;
  /** the name at the right end (x) */
  name?: string;
  /** the axis starts below zero (x-ranges can start negative) */
  min?: number;
}
export interface StripLay { x0: number; x1: number; y: number; X: (v: number) => number; ticks: number[]; labels: number[]; size: number }
const NAME = 'RangeStrip';
export function layoutStrip(s: StripSpec, b: Box): StripLay {
  const min = s.min ?? 0, span = s.max - min;
  const x0 = b.x0 + 60, x1 = b.x1 - 90, y = b.y0 + 0.55 * b.h;
  const X = (v: number) => x0 + ((v - min) / span) * (x1 - x0);
  const steps = [1, 2, 5, 10, 20, 50];
  const labStep = steps.find(st => span / st <= 12) ?? 100;
  const tickStep = span <= 40 ? 1 : labStep;
  const ticks: number[] = [], labels: number[] = [];
  for (let v = Math.ceil(min / tickStep) * tickStep; v <= s.max + 1e-9; v += tickStep) ticks.push(v);
  for (let v = Math.ceil(min / labStep) * labStep; v <= s.max + 1e-9; v += labStep) labels.push(v);
  return { x0, x1, y, X, ticks, labels, size: 60 };
}
/** what would not read (empty = fine): endpoint labels apart, tick labels apart, everything inside the box */
export function stripProblems(s: StripSpec, b: Box): string[] {
  const L = layoutStrip(s, b), out: string[] = [];
  if (!(s.lo < s.hi)) out.push(`${NAME}: lo must be below hi`);
  if (s.lo < (s.min ?? 0) || s.hi > s.max) out.push(`${NAME}: the interval leaves the axis`);
  const gap = L.labels.length > 1 ? L.X(L.labels[1]!) - L.X(L.labels[0]!) : 999;
  if (gap < 1.4 * L.size) out.push(`${NAME}: tick numbers too close`);
  const wl = textW(fmt(s.lo), 60), wh = textW(fmt(s.hi), 60);
  if (L.X(s.hi) - L.X(s.lo) < (wl + wh) / 2 + 20) out.push(`${NAME}: endpoint numbers overlap`);
  return out;
}
export function drawStrip(c: Canvas, s: StripSpec, b: Box, k: number, ks: number): void {
  if (k <= 0) return;
  const L = layoutStrip(s, b);
  const { g } = c;
  g.save(); g.globalAlpha *= clamp(k);
  strokePts(c, [[L.x0 - 20, L.y], [L.x1 + 30, L.y]], { col: 'ink', lw: 4 });
  // arrow head at the right end
  strokePts(c, [[L.x1 + 12, L.y - 14], [L.x1 + 32, L.y], [L.x1 + 12, L.y + 14]], { col: 'ink', lw: 4 });
  for (const v of L.ticks) { const x = L.X(v), big = L.labels.includes(v); strokePts(c, [[x, L.y - (big ? 16 : 9)], [x, L.y + (big ? 16 : 9)]], { col: big ? 'ink' : 'dim', lw: big ? 4 : 3 }); }
  for (const v of L.labels) label(c, fmt(v), [L.X(v), L.y + 58], 60, 'dim', 1);
  if (s.name) label(c, s.name, [L.x1 + 64, L.y - 40], 56, 'ink', 1, true);
  g.restore();
  const kk = clamp(ks) * clamp(k);
  if (kk <= 0) return;
  const a = L.X(s.lo), z = L.X(s.hi);
  strokePts(c, [[a + 14, L.y], [a + 14 + (z - a - 28) * clamp(ks * 1.4), L.y]], { col: 'link', lw: 12, alpha: kk });
  if (s.whole) for (const v of wholeIn(s.lo, s.hi)) dot(c, L.X(v), L.y, 9, 'link', clamp(ks * 2 - 1) * clamp(k));
  for (const x of [a, z]) {
    g.save(); g.globalAlpha *= kk;
    g.beginPath(); g.arc(x, L.y, 14, 0, Math.PI * 2);
    g.fillStyle = '#1C2047'; g.fill(); g.lineWidth = 5; g.strokeStyle = paint(c.th, 'link', 'fill'); g.stroke();
    g.restore();
  }
  label(c, fmt(s.lo), [a, L.y - 66], 60, 'link', kk);
  label(c, fmt(s.hi), [z, L.y - 66], 60, 'link', kk);
}
