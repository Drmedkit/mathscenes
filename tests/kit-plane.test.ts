// kit-plane: the shared coordinate plane lays out, converts coordinates both ways, and refuses what would not read.
import { beforeAll, describe, expect, it } from 'vitest';
import type { PParams } from '../src/lesson/kit/Plane';

let Plane: typeof import('../src/lesson/kit/Plane').Plane;
let MF: import('../src/blocks/block').Frame, dusk: import('../src/core/theme').Theme;
beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  ({ Plane } = await import('../src/lesson/kit/Plane'));
  MF = (await import('../src/blocks/block')).frame(60, 70, 940, 940);
  dusk = (await import('../src/lesson/dusk')).dusk;
});

const lines: PParams = { x: { min: -2, max: 8, step: 1, name: 'x' }, y: { min: -2, max: 8, step: 1, name: 'y' }, equal: true, items: [
  { kind: 'curve', key: 'l1', f: x => 0.5 * x + 2, name: 'y = 0.5x + 2' },
  { kind: 'curve', key: 'l2', f: x => -x + 5, col: 'water', name: 'y = −x + 5' },
  { kind: 'point', key: 'P', x: 2, y: 3, name: '(2, 3)' },
] };

describe('kit Plane', () => {
  it('lays out curves, points and names, and maps data to pixels and back', () => {
    const B = Plane(lines, MF, dusk);
    for (const [x, y] of [[0, 0], [-2, 8], [3.5, -1]] as const) {
      const [a, b] = B.px(x, y), [x2, y2] = B.toData(a, b);
      expect(x2).toBeCloseTo(x, 9); expect(y2).toBeCloseTo(y, 9);
    }
    // equal scale: one unit is as long on both axes
    expect(B.px(1, 0)[0] - B.px(0, 0)[0]).toBeCloseTo(B.px(0, 0)[1] - B.px(0, 1)[1], 6);
    const g = B.grid, d = B.where('P');
    expect(d.x0 > g.x0 && d.x1 < g.x1 && d.y0 > g.y0 && d.y1 < g.y1).toBe(true);
    expect(B.snap(3.4, 0.5, 'x')).toBe(3.5);
    expect(B.snap(99, 1, 'y')).toBe(8);
  });
  it('lays out asymptotes, shades, open ends and non-number ticks', () => {
    expect(() => Plane({ x: { min: -6, max: 6, step: 1 }, y: { min: -6, max: 6, step: 1 }, items: [
      { kind: 'vline', key: 'va', x: 2 }, { kind: 'hline', key: 'ha', y: 1 },
      { kind: 'curve', key: 'r', f: x => (x + 1) / (x - 2), name: 'y = (x + 1)/(x − 2)' },
      { kind: 'shade', key: 's', lo: -6, hi: 0, top: 'top', bottom: x => x },
      { kind: 'curve', key: 'p', f: () => 4, lo: -5, hi: -2, ends: ['closed', 'open'] },
    ] }, MF, dusk)).not.toThrow();
    expect(() => Plane({ x: { min: 0, max: 2 * Math.PI, step: Math.PI / 4, fmt: v => ['0', 'π/4', 'π/2', '3π/4', 'π', '5π/4', '3π/2', '7π/4', '2π'][Math.round(v / (Math.PI / 4))]! },
      y: { min: -1.5, max: 1.5, step: 0.5 }, items: [{ kind: 'curve', key: 's', f: Math.sin }] }, MF, dusk)).not.toThrow();
  });
  it('refuses what would not read', () => {
    expect(() => Plane({ x: { min: 0, max: 50, step: 1 }, y: { min: 0, max: 5, step: 1 } }, MF, dusk)).toThrow(/grid lines/);
    expect(() => Plane({ x: { min: 0, max: 5, step: 1 }, y: { min: 0, max: 5, step: 1 }, items: [{ kind: 'point', key: 'P', x: 7, y: 1 }] }, MF, dusk)).toThrow(/outside/);
    expect(() => Plane({ x: { min: 0, max: 5, step: 1 }, y: { min: 0, max: 5, step: 1 }, items: [{ kind: 'curve', key: 'c', f: x => x + 20 }] }, MF, dusk)).toThrow(/misses/);
    expect(() => Plane({ x: { min: 0, max: 5, step: 1 }, y: { min: 0, max: 5, step: 1 }, items: [{ kind: 'point', key: 'a', x: 1, y: 1 }, { kind: 'point', key: 'a', x: 2, y: 2 }] }, MF, dusk)).toThrow(/twice/);
  });
});
