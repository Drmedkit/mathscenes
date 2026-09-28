// TeX parsing (Node, lite adaptor): glyph counts, \cssId tags, every SVG element kind MathJax emits.
import { beforeAll, describe, expect, it } from 'vitest';
import { flattenD, tex, texAsync, texBox, texReady, texShape, texT, TexError, type Formula } from '../src/core/tex';

beforeAll(async () => { await texReady(); });

const kinds = (F: Formula) => F.glyphs.map(g => `${g.el}:${g.mode}`);

describe('tex parse', () => {
  it('parses a tagged ratio: 3 glyphs, tags a and b, one glyph each', () => {
    const F = tex('\\cssId{a}{2} : \\cssId{b}{3}');
    expect(F.glyphs).toHaveLength(3);
    expect(F.tags).toEqual(['a', 'b']);
    expect(F.count).toEqual({ a: 1, '': 1, b: 1 });
    expect(F.glyphs.map(g => g.ch)).toEqual(['32', '3A', '33']);
    expect(F.glyphs.map(g => g.tag)).toEqual(['a', null, 'b']);
    expect(F.missing).toEqual([]);
    // the tag type is inferred from the literal: F is Formula<'a' | 'b'>
    const b = texBox(F, 0, 0, { size: 100 }, 'b');
    expect(b.w).toBeGreaterThan(20);
  });

  it('counts glyphs of words and nested tags', () => {
    const F = tex('\\cssId{fe}{\\text{for every}}\\ \\cssId{l}{2}');
    expect(F.count['fe']).toBe(8);            // f o r e v e r y (the space has no glyph)
    expect(F.count['l']).toBe(1);
    const N = tex('\\cssId{all}{\\cssId{x}{2}+3}');
    expect(N.glyphs.filter(g => g.tags.includes('all'))).toHaveLength(3);
    expect(N.glyphs[0]!.tags).toEqual(['all', 'x']);
  });

  it('handles every element kind: rect (fill + stroke), line, ellipse, polygon, stroked path with arcs, nested svg', async () => {
    expect(kinds(tex('\\frac{1}{2}'))).toContain('rect:fill');
    expect(kinds(tex('\\boxed{6}'))).toContain('rect:stroke');
    expect(kinds(tex('\\cancel{5}'))).toContain('line:stroke');
    expect(kinds(tex('\\enclose{circle}{6}'))).toContain('ellipse:stroke');
    const bb = await texAsync('\\bbox[border:2px solid]{6}');
    expect(kinds(bb).filter(k => k === 'polygon:fill').length).toBe(4);
    const ld = await texAsync('4\\enclose{longdiv}{1234}');
    expect(kinds(ld)).toContain('path:stroke');
    const ol = tex('\\overline{AB}');
    expect(ol.glyphs.some(g => g.clip !== null)).toBe(true);
    // stroked parts become outline polygons for morphing
    expect(texShape(tex('\\cancel{5}'), 0, 0, { size: 100 }).length).toBeGreaterThan(1);
  });

  it('flattens SVG arcs to the right end point', () => {
    const [s] = flattenD('M 0 0 A 50 50 0 0 1 100 0');
    const last = s!.pts[s!.pts.length - 1]!;
    expect(last[0]).toBeCloseTo(100, 6);
    expect(last[1]).toBeCloseTo(0, 6);
    expect(Math.min(...s!.pts.map(p => p[1]))).toBeCloseTo(-50, 0);   // sweep 1 bulges up (y down)
  });

  it('our macros work: \\sfrac, \\qty, \\unit', () => {
    expect(tex('\\sfrac{1}{2}').glyphs.length).toBe(3);
    expect(tex('\\qty{5}{ft}').glyphs.length).toBe(3);
    expect(tex('\\unit{mi}').glyphs.length).toBe(2);
  });

  it('bad TeX throws a TexError; texT checks declared parts', () => {
    expect(() => tex('\\frac{1}{')).toThrow(TexError);
    expect(() => tex('\\nosuchmacro{2}')).toThrow(TexError);
    expect(() => texT('\\cssId{a}{2}', ['a', 'b'])).toThrow(/missing part/);
  });
});
