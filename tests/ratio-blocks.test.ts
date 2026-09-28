// RatioGraph + RatioTiles: the maths each block computes (points on / off the line, gaps, unit rate, staircase, shape
// comparison, part-to-whole) and the readability rules of their layouts.
import { beforeAll, describe, expect, it } from 'vitest';
import { texReady } from '../src/core/tex';
import { ink, paper } from '../src/core/theme';
import { qStr, qNum } from '../src/core/math';
import {
  BlockError, frame, tryBlock, computeRatioGraph, RatioGraph, compareShapes, mapper, lerpView,
  computeRatioTiles, RatioTiles, ratioTilesSteps, RatioTable, ratioFix, computeRatioFix,
} from '../src/blocks';

beforeAll(async () => { await texReady(); });
const pt = (m: ReturnType<typeof computeRatioGraph>, id: string) => m.points.find(p => p.id === id)!;

describe('RatioGraph maths', () => {
  it('multiples of 2 : 3 sit on the line; 4 : 5 (2+2 : 3+2) sits 1 below it', () => {
    const m = computeRatioGraph({ a: 2, b: 3, ks: [1, 2, 3, 4], others: [{ x: 4, y: 5, id: 'add' }, { x: 10, y: 15, id: 'ten' }] });
    expect(m.points.filter(p => p.kind === 'multiple').map(p => `${qStr(p.x)},${qStr(p.y)}`)).toEqual(['2,3', '4,6', '6,9', '8,12']);
    const add = pt(m, 'add');
    expect(add.kind).toBe('off');
    expect(qStr(add.lineY)).toBe('6');
    expect(qStr(add.gap)).toBe('-1');
    expect(add.k).toBeNull();
    expect(qStr(add.times)).toBe('5/4');
    expect(qStr(add.diff)).toBe('1');
    const ten = pt(m, 'ten');
    expect(ten.kind).toBe('on');
    expect(qStr(ten.k!)).toBe('5');
  });
  it('the unit rate is (1, b/a) and n unit steps land on the line at (n, n·b/a)', () => {
    const m = computeRatioGraph({ a: 2, b: 3, unit: true, stairs: 5 });
    expect(qStr(pt(m, 'unit').y)).toBe('3/2');
    expect(qStr(m.rate)).toBe('3/2');
    const end = pt(m, 'stairs');
    expect(`${qStr(end.x)},${qStr(end.y)}`).toBe('5,15/2');
    expect(end.kind).toBe('on');
    expect(m.stairs).toHaveLength(11);
    expect(qStr(m.stairs[2]![1])).toBe('3/2');
  });
  it('the 16 : 9 screens: quarter, half and whole sizes are all on one line', () => {
    const m = computeRatioGraph({ a: 16, b: 9, ks: [0.25, 0.5, 1] });
    expect(m.points.map(p => `${qStr(p.x)},${qStr(p.y)}`)).toEqual(['4,9/4', '8,9/2', '16,9']);
    expect(m.points.every(p => p.gap.p === 0)).toBe(true);
  });
  it('rejects nonsense', () => {
    expect(() => computeRatioGraph({ a: 0, b: 3 })).toThrow(BlockError);
    expect(() => computeRatioGraph({ a: 2, b: 3, ks: [1, 1] })).toThrow(/listed twice/);
    expect(() => computeRatioGraph({ a: 2, b: 3, ks: [2], others: [{ x: 4, y: 6 }] })).toThrow(/listed twice/);
    expect(() => computeRatioGraph({ a: 2, b: 3, others: [{ x: 1, y: 1, id: 'a b' }] })).toThrow(/may only use/);
    expect(() => computeRatioGraph({ a: 2, b: 3, stairs: 0 })).toThrow(/stairs/);
    expect(() => computeRatioGraph({ a: 2, b: 3, ks: [4], xMax: 5 })).toThrow(/outside the axes/);
    expect(() => computeRatioGraph({ a: 2, b: 3, xMax: 50 })).toThrow(/at most/);
    expect(() => computeRatioGraph({ a: 2, b: 3, labels: ['or{ange', 'green'] })).toThrow(/special/);
  });
});

describe('shape comparison', () => {
  it('x2 keeps the shape, +2 makes it squarer', () => {
    const dbl = compareShapes([2, 3], [4, 6]);
    expect(dbl.same).toBe(true);
    expect(qStr(dbl.scale)).toBe('1/2');
    expect(dbl.shrunk.map(qStr)).toEqual(['2', '3']);
    const add = compareShapes([2, 3], [4, 5]);
    expect(add.same).toBe(false);
    expect(add.shrunk.map(qStr)).toEqual(['2', '5/2']);
    expect(qStr(add.gap)).toBe('-1/2');
    expect(add.squarer).toBe(true);
    expect(add.diff.map(qStr)).toEqual(['1', '1']);          // adding keeps the difference ...
    expect(add.times.map(qStr)).toEqual(['3/2', '5/4']);     // ... but changes how many times bigger
    expect(qNum(add.times[1]!)).toBe(1.25);
  });
});

describe('RatioGraph layout', () => {
  it('fits the frame, numbers >= 60 px, and every named view is checked', () => {
    const g = RatioGraph({ a: 2, b: 3, ks: [1, 2, 3, 4], others: [{ x: 4, y: 5, id: 'add' }], unit: true, stairs: 5, labels: ['orange', 'green'],
      views: { plane: { unit: 60, origin: [520, 900], xMax: 9.5, yMax: 12.8 } } }, frame(80, 80, 1760, 920), ink);
    expect(g.numSize).toBeGreaterThanOrEqual(60);
    expect(g.nameSize).toBeGreaterThanOrEqual(44);
    expect(g.view('plane').unit).toBe(60);
    expect(g.view().unit).toBe(60);                       // the first named view is the default
    expect(g.lineAt(5)).toBe(7.5);
    const m = mapper(g.view('plane'));
    expect(m.px(2, 3)).toEqual([520 + 120, 900 - 180]);
    const mid = lerpView({ unit: 100, origin: [520, 960], xMax: 4.6, yMax: 6.8 }, g.view('plane'), 0.5);
    expect(mid.unit).toBeCloseTo(Math.sqrt(100 * 60), 6);  // zoom is geometric
    const fit = RatioGraph({ a: 2, b: 3, ks: [1, 2, 3] }, frame(80, 80, 1760, 920), ink);
    expect(fit.box.x0).toBeGreaterThanOrEqual(80);
    expect(fit.box.y1).toBeLessThanOrEqual(1000);
    expect(() => g.view('nope')).toThrow(/no view/);
    expect(() => g.point('nope')).toThrow(/no point/);
  });
  it('refuses a view whose labels would collide or that leaves the frame', () => {
    const P = { a: 2, b: 3, ks: [1, 2, 3, 4], unit: true, labels: ['orange', 'green'] as const };
    const tiny = tryBlock(() => RatioGraph({ ...P, views: { tiny: { unit: 22, origin: [300, 900], xMax: 9, yMax: 13 } } }, frame(80, 80, 1760, 920), ink));
    expect(tiny.ok).toBe(false);
    if (!tiny.ok) expect(tiny.error).toMatch(/overlap/);
    const out = tryBlock(() => RatioGraph({ ...P, views: { out: { unit: 120, origin: [300, 900], xMax: 9, yMax: 13 } } }, frame(80, 80, 1760, 920), ink));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/does not fit/);
    expect(() => RatioGraph({ a: 2, b: 3, xMax: 40, yMax: 40 }, frame(0, 0, 400, 300), paper)).toThrow(/do not fit/);
  });
});

describe('RatioTiles', () => {
  it('computes the stack totals and the parts of the whole (2 : 3 is 2/5 and 3/5, not 2/3)', () => {
    const m = computeRatioTiles({ a: 2, b: 3, groups: 4 });
    expect(m.rows.map(r => `${qStr(r.first)}:${qStr(r.second)}`)).toEqual(['2:3', '4:6', '6:9', '8:12']);
    expect(m.rows.map(r => qStr(r.total))).toEqual(['5', '10', '15', '20']);
    expect(qStr(m.whole)).toBe('5');
    expect(qStr(m.fracA)).toBe('2/5');
    expect(qStr(m.fracB)).toBe('3/5');
    expect(qStr(m.partToPart)).toBe('2/3');
    expect(ratioTilesSteps(3)).toEqual(['a', 'b', 'link', 'countA', 'countB', 'join', 'frame', 'copy1', 'copy2', 'bar', 'whole', 'partA', 'partB']);
  });
  it('rejects nonsense', () => {
    expect(() => computeRatioTiles({ a: 1.5, b: 3 })).toThrow(/whole/);
    expect(() => computeRatioTiles({ a: 0, b: 3 })).toThrow(BlockError);
    expect(() => computeRatioTiles({ a: 8, b: 7 })).toThrow(/at most 12 tiles/);
    expect(() => computeRatioTiles({ a: 2, b: 3, groups: 7 })).toThrow(/groups/);
    expect(() => computeRatioTiles({ a: 2, b: 3, linkLabel: 'for {every}' })).toThrow(/special/);
  });
  it('layout: fits or refuses', () => {
    const t = RatioTiles({ a: 2, b: 3, groups: 4, size: 96, linkLabel: 'for every' }, frame(200, 80, 1000, 900), ink);
    expect(t.box.y0).toBeGreaterThanOrEqual(80);
    expect(t.groupBox(3).y1).toBeLessThanOrEqual(980);
    expect(() => RatioTiles({ a: 2, b: 3, groups: 6, size: 140 }, frame(0, 0, 1000, 600), ink)).toThrow(/height/);
    expect(() => RatioTiles({ a: 5, b: 6, size: 140 }, frame(0, 0, 800, 900), ink)).toThrow(/wide/);
    expect(() => RatioTiles({ a: 2, b: 3, size: 20 }, frame(0, 0, 800, 900), ink)).toThrow(/out of range/);
  });
});

describe('accent roles on the older blocks', () => {
  it('RatioTable / ratioFix take the amount palette (first / second / link)', () => {
    const t = RatioTable({ a: 2, b: 3, ks: [1, 2, 3, 4], headers: ['orange', 'green'], roles: ['first', 'second'], accent: 'link' }, frame(1000, 150, 840, 780), ink);
    expect(t.maths.rows).toHaveLength(4);
    const p = ratioFix({ a: 2, b: 3, add: 2, factor: 2, roles: ['first', 'second'], accent: 'link' });
    expect(p.colFrom).toMatchObject({ a: 'first', b: 'second', rb: 'second' });
    expect(p.colTo).toMatchObject({ opa: 'link' });
    expect(computeRatioFix({ a: 2, b: 3, add: 2, factor: 2 }).wrong).toEqual([4, 5]);
  });
});
