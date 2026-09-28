// Block maths: valid params compute the right values; nonsense throws a BlockError with a readable message.
// Layout rules (sizes, overlaps) are checked through the factories (TeX runs in Node, no canvas needed).
import { beforeAll, describe, expect, it } from 'vitest';
import { texReady } from '../src/core/tex';
import { ink } from '../src/core/theme';
import { qStr, qTex, rat, qEq } from '../src/core/math';
import {
  BlockError, frame, computeRatioTable, RatioTable, factorTex, computeDoubleNumberLine, DoubleNumberLine,
  computeRatioFix, ratioFix, EquationMorph, planEquationMorph, tryBlock,
} from '../src/blocks';

beforeAll(async () => { await texReady(); });
const rows = (m: ReturnType<typeof computeRatioTable>) => m.rows.map(r => `${qStr(r.a)}:${qStr(r.b)}`);

describe('RatioTable maths', () => {
  it('computes the rows of 2 : 3 (the lemonade table)', () => {
    const m = computeRatioTable({ a: 2, b: 3, ks: [1, 2, 3], headers: ['lemon', 'water'] });
    expect(rows(m)).toEqual(['2:3', '4:6', '6:9']);
    expect(m.arrows.map(a => a.tex)).toEqual(['\\times 2', '\\times 3']);
  });
  it('handles fractions exactly: 2 : 3 -> 1 : 1 1/2 -> 5 : 7 1/2 (consecutive arrows ÷2 then ×5)', () => {
    const m = computeRatioTable({ a: 2, b: 3, ks: [1, 0.5, 2.5], headers: ['lemon', 'water'], arrows: 'consecutive' });
    expect(rows(m)).toEqual(['2:3', '1:3/2', '5:15/2']);
    expect(qTex(m.rows[2]!.b)).toBe('7\\tfrac{1}{2}');
    expect(m.arrows.map(a => a.tex)).toEqual(['\\div 2', '\\times 5']);
  });
  it('factor labels', () => {
    expect(factorTex(rat(3))).toBe('\\times 3');
    expect(factorTex(rat(1, 4))).toBe('\\div 4');
    expect(factorTex(rat(5, 2))).toBe('\\times 2\\tfrac{1}{2}');
  });
  it('rejects nonsense', () => {
    const base = { a: 2, b: 3, ks: [1, 2], headers: ['lemon', 'water'] as const };
    expect(() => computeRatioTable({ ...base, a: 0 })).toThrow(BlockError);
    expect(() => computeRatioTable({ ...base, b: -3 })).toThrow(/more than 0/);
    expect(() => computeRatioTable({ ...base, a: Math.PI })).toThrow(/friendly/);
    expect(() => computeRatioTable({ ...base, ks: [] })).toThrow(/at least one row/);
    expect(() => computeRatioTable({ ...base, ks: [1, 2, 2] })).toThrow(/same multiplier/);
    expect(() => computeRatioTable({ ...base, ks: [1, 2, 3, 4, 5, 6, 7, 8, 9] })).toThrow(/at most 8 rows/);
    expect(() => computeRatioTable({ ...base, highlight: 5 })).toThrow(/does not exist/);
    expect(() => computeRatioTable({ ...base, headers: ['lemon', 'wa{ter'] })).toThrow(/special/);
  });
  it('layout keeps the readability rules: numbers >= 60 px, too many rows for the frame is an error', () => {
    const t = RatioTable({ a: 2, b: 3, ks: [1, 2, 3], headers: ['lemon', 'water'] }, frame(1000, 200, 840, 700), ink);
    expect(t.steps).toEqual(['grid', 'head', 'row0', 'arrow1', 'row1', 'arrow2', 'row2', 'hl', 'emph']);
    expect(t.box.x0).toBeGreaterThanOrEqual(1000);
    expect(t.box.x1).toBeLessThanOrEqual(1840);
    expect(() => RatioTable({ a: 2, b: 3, ks: [1, 2, 3, 4, 5, 6, 7, 8], headers: ['lemon', 'water'] }, frame(0, 0, 900, 500), ink)).toThrow(/do not fit/);
    expect(() => RatioTable({ a: 2, b: 3, ks: [1, 2], headers: ['lemon', 'water'] }, frame(0, 0, 300, 500), ink)).toThrow(/wide/);
  });
});

describe('DoubleNumberLine maths', () => {
  it('ticks, unit rate and the answer for 5 cups of lemon (2 : 3)', () => {
    const m = computeDoubleNumberLine({ a: 2, b: 3, count: 3, labels: ['lemon', 'water'], unitRate: true, target: 5 });
    expect(m.ticks.map(t => `${qStr(t.top)}:${qStr(t.bottom)}:${t.kind}`)).toEqual([
      '0:0:unit-multiple', '1:3/2:unit-rate', '2:3:unit-multiple', '4:6:unit-multiple', '5:15/2:target', '6:9:unit-multiple']);
    expect(qEq(m.rate, rat(3, 2))).toBe(true);
    expect(qStr(m.target!.bottom)).toBe('15/2');
    expect(m.arcs.map(a => a.tex)).toEqual(['\\times 5']);
  });
  it('a target on an existing tick does not add a tick; arcs from the first unit', () => {
    const m = computeDoubleNumberLine({ a: 2, b: 3, count: 3, labels: ['lemon', 'water'], target: 6 });
    expect(m.ticks).toHaveLength(4);
    expect(m.arcs.map(a => a.tex)).toEqual(['\\times 3']);
    const n = computeDoubleNumberLine({ a: 3, b: 4, count: 4, labels: ['x', 'y'], arcs: [2, 4] });
    expect(n.arcs.map(a => `${qStr(a.from)}->${qStr(a.to)}`)).toEqual(['3->6', '3->12']);
  });
  it('rejects nonsense', () => {
    const base = { a: 2, b: 3, count: 3, labels: ['lemon', 'water'] as const };
    expect(() => computeDoubleNumberLine({ ...base, a: 1.5 })).toThrow(/whole/);
    expect(() => computeDoubleNumberLine({ ...base, count: 0 })).toThrow(BlockError);
    expect(() => computeDoubleNumberLine({ ...base, count: 13 })).toThrow(/at most/);
    expect(() => computeDoubleNumberLine({ ...base, target: 7 })).toThrow(/beyond/);
    expect(() => computeDoubleNumberLine({ ...base, arcs: [1] })).toThrow(/does not exist/);
  });
  it('layout: overlapping labels are refused', () => {
    const ok = tryBlock(() => DoubleNumberLine({ a: 2, b: 3, count: 4, labels: ['lemon', 'water'], unitRate: true, target: 5 }, frame(40, 120, 1840, 900), ink));
    expect(ok.ok).toBe(true);
    const bad = tryBlock(() => DoubleNumberLine({ a: 2, b: 3, count: 12, labels: ['lemon', 'water'], unitRate: true, target: 23 }, frame(40, 120, 900, 900), ink));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/overlap|line/);
  });
});

describe('EquationMorph maths', () => {
  it('ratioFix computes the wrong and the right way', () => {
    expect(computeRatioFix({ a: 2, b: 3, add: 2, factor: 2 })).toEqual({ wrong: [4, 5], right: [4, 6] });
    expect(computeRatioFix({ a: 3, b: 5, add: 1, factor: 3 })).toEqual({ wrong: [4, 6], right: [9, 15] });
  });
  it('strikes only what is wrong: 2+2 = 4 is also 2×2, so only the 5 is struck among the results', () => {
    const p = ratioFix({ a: 2, b: 3, add: 2, factor: 2 });
    expect(p.strike).toEqual(['opa', 'na', 'opb', 'nb', 'rb']);
    const plan = planEquationMorph(p);
    const kinds = Object.fromEntries(plan.parts.map(x => [x.tag, x.kind]));
    expect(kinds).toMatchObject({ a: 'same', b: 'same', opa: 'change', na: 'change', ra: 'same', rb: 'change' });
    expect(plan.untagged).toBe('glide');
  });
  it('rejects nonsense', () => {
    expect(() => computeRatioFix({ a: 3, b: 3, add: 2, factor: 2 })).toThrow(/nothing wrong/);
    expect(() => computeRatioFix({ a: 2, b: 3, add: 2, factor: 1 })).toThrow(/2 or more/);
    expect(() => computeRatioFix({ a: 2.5, b: 3, add: 2, factor: 2 })).toThrow(/whole/);
    expect(() => planEquationMorph({ from: '\\cssId{a}{2}', to: '\\cssId{a}{3}', strike: ['b'] })).toThrow(/strike part/);
    expect(() => planEquationMorph({ from: '\\frac{2}{', to: '2' })).toThrow(BlockError);
  });
  it('layout fits the frame or refuses', () => {
    const b = EquationMorph(ratioFix({ a: 2, b: 3, add: 2, factor: 2 }), frame(1000, 300, 880, 200), ink);
    expect(b.size).toBeGreaterThanOrEqual(60);
    expect(() => EquationMorph(ratioFix({ a: 2, b: 3, add: 2, factor: 2 }), frame(0, 0, 300, 200), ink)).toThrow(/too wide/);
  });
});
