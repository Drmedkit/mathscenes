// lesson-scale-calculations: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer
// passes, choices unique with exactly one right, misconception ids exist, a wrong number is never right, the picture
// builds), the main misconceptions are classified, the plan covers every sub-goal in order, the voice lines match the
// panel lines, the lesson pictures build, and the maths of a scale (both directions, one unit, per one unit) holds.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENERATORS, MC, type SCItem } from '../src/lesson/topics/scale-calculations/items';
import { PLAN } from '../src/lesson/topics/scale-calculations/plan';
import { convert, fmtT, mixS, normalized, per, ratioN, scale, toActual, toDrawing } from '../src/lesson/topics/scale-calculations/scaleCalc';
import { ScaleLines } from '../src/lesson/topics/scale-calculations/ScaleLines';
import { LESSON_PICS, LF } from '../src/lesson/topics/scale-calculations/lessonPics';
import { SCRIPT } from '../src/lesson/topics/scale-calculations/script';
import { texReady } from '../src/core/tex';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.scale-drawing-reality-calculations.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => SCItem>;
const num = (v: number): Response => ({ kind: 'num', v });
const strings = (x: unknown): string[] => typeof x === 'string' ? [x] : x && typeof x === 'object' ? Object.values(x).flatMap(strings) : [];
const LINES = JSON.parse(fs.readFileSync('pages/lessons/scale-calculations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;

beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  await texReady();
});

describe('scale-calculations: maths', () => {
  it('one factor, both directions, one unit, per one unit', () => {
    const s = scale(1, 'in', 8, 'ft');
    expect(toActual(s, 2.25)).toBe(18);
    expect(toDrawing(s, 20)).toBe(2.5);
    expect(toDrawing(s, 14)).toBe(1.75);
    expect(toDrawing(s, toActual(s, 3.75))).toBe(3.75);
    expect(ratioN(scale(1, 'in', 4, 'ft'))).toBe(48);
    expect(ratioN(scale(1, 'cm', 2, 'm'))).toBe(200);
    expect(ratioN(scale(5, 'mm', 1, 'mm'))).toBe(0.2);
    expect(toActual(scale(5, 'mm', 1, 'mm'), 35)).toBe(7);
    expect(per(scale(2, 'cm', 5, 'm'))).toBe(2.5);
    expect(normalized(scale(0.25, 'in', 1, 'ft'))).toEqual({ d: 1, dU: 'in', a: 4, aU: 'ft' });
    expect(convert(3.5, 'm', 'cm')).toBe(350);
    expect(convert(144, 'in', 'ft')).toBe(12);
    expect(convert(2, 'yd', 'ft')).toBe(6);
    expect(() => scale(1, 'in', 2, 'm')).toThrow();
    expect(fmtT(1200)).toBe('1{,}200');
    expect(mixS(2.25)).toBe('2 1/4');
  });
  it('the lesson pictures build, and a wrong pair cannot be drawn as one length', () => {
    for (const [name, p] of Object.entries(LESSON_PICS)) {
      expect(() => ScaleLines(p, LF), name).not.toThrow();
      for (const str of strings(p)) expect(str, name).not.toMatch(/[\u0000-\u001f]/);
    }
    expect(() => ScaleLines({ ...LESSON_PICS.WALL!, ask: { row: 0, v: 3 } }, LF)).toThrow();
  });
});

describe('scale-calculations: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) { expect(GEN[f], f).toBeDefined(); expect(FAMILY_NAMES[f], f).toBeTruthy(); } }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id exists in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

describe('scale-calculations: voice', () => {
  it('every panel line has a spoken line (and no extra ones), with no digits or symbols', () => {
    expect(Object.keys(LINES).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(LINES)) expect(l.text, id).not.toMatch(/[0-9×÷=<>/%$→]/);
  });
});

describe('scale-calculations: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        } else if (item.answer.kind === 'num') {
          expect(Number.isFinite(item.answer.v)).toBe(true);
          expect(item.check(num(item.answer.v + 0.37)).ok).toBe(false);
        }
        expect(item.prompt).not.toMatch(/NaN|undefined|Infinity/);
        expect(item.board).not.toMatch(/NaN|undefined|Infinity/);
        // no long or repeating decimals anywhere the kid reads (0.8333 is not a number a plan would give)
        for (const str of [item.prompt, item.board, ...(item.choices ?? []), ...(item.work ?? [])]) expect(str, item.prompt).not.toMatch(/\d\.\d{4}/);
        // TeX with a lost backslash (\t, \b ... become control characters)
        for (const str of [item.board, ...(item.work ?? []), ...strings(item.picture)]) expect(str, item.prompt).not.toMatch(/[\u0000-\u001f]/);
        if (item.picture) expect(() => ScaleLines(item.picture!.lines.p, LF), `${f} ${s} ${item.prompt}`).not.toThrow();
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join());
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

describe('scale-calculations: misconceptions are classified', () => {
  const find = (f: string, sg: string, pred: (it: SCItem) => boolean): SCItem => {
    for (let s = 1; s < 4000; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; }
    throw new Error(`no ${f} item found`);
  };
  it('table: additive and reversed', () => {
    const it = find('table', 'scale-as-ordered-ratio', i => i.board.includes('1 & 8 '));
    const v = (it.answer as { v: number }).v, d = v / 8;
    expect(it.check(num(d + 7)).mc).toBe(MC.additive);
    expect(it.check(num(d / 8)).mc).toBe(MC.reverse);
  });
  it('toDrawing: multiplied on the way back, whole-number quotient', () => {
    const it = find('toDrawing', 'compute-drawing-from-actual', i => i.unit === 'in' && !Number.isInteger((i.answer as { v: number }).v) && i.board.includes(': 8\\text'));
    const q = (it.answer as { v: number }).v, y = q * 8;
    expect(it.check(num(y * 8)).mc).toBe(MC.wrongOp);
    expect(it.check(num(Math.floor(q))).mc).toBe(MC.wholeQuot);
  });
  it('toActual (non-whole): part by part', () => {
    const it = find('toActual', 'compute-actual-nonwhole', i => i.unit === 'ft' && i.board.includes('2\\tfrac{1}{2}') && i.board.includes(': 8\\text'));
    expect(it.check(num(16.5)).mc).toBe(MC.partByPart);
  });
  it('normalize: a non-unit reference used as one', () => {
    const it = find('normalize', 'normalize-nonunit-scale', i => i.board.startsWith('2\\text{ cm} : 5') && i.unit === 'm');
    const d = (it.answer as { v: number }).v / 2.5;
    expect(it.check(num(d * 5)).mc).toBe(MC.nonunit);
  });
  it('toUnitless: units dropped, a foot as 10 inches', () => {
    const it = find('toUnitless', 'scale-with-units-to-unitless', i => i.board.includes('\\text{ ft}'));
    const N = (it.answer as { v: number }).v;
    expect(it.check(num(N / 12)).mc).toBe(MC.notConverted);
    expect(it.check(num(N / 12 * 10)).mc).toBe(MC.base10);
  });
  it('convertIn / convertOut: unconverted and relabelled', () => {
    const a = find('convertIn', 'convert-input-unit', i => i.board.includes('yd'));
    const m = a.board.match(/(\d+)\\text\{ yd\}/)!, k = Number(a.board.match(/: (\d+)\\text\{ ft\}/)![1]);
    expect(a.check(num(Number(m[1]) / k)).mc).toBe(MC.unconverted);
    const b = find('convertOut', 'convert-output-unit', i => i.unit === 'ft');
    expect(b.check(num((b.answer as { v: number }).v * 12)).mc).toBe(MC.relabel);
  });
  it('audit: an error claimed in a correct solution, one error of two', () => {
    const ok = find('audit', 'audit-scale-solution', i => i.choices!.length === 4 && i.check({ kind: 'choice', i: i.choices!.indexOf('It is correct.') }).ok);
    expect(ok.check({ kind: 'choice', i: ok.choices!.indexOf('Wrong: both of those.') }).mc).toBe(MC.everyError);
    const both = find('audit', 'audit-scale-solution', i => i.choices!.length === 4 && i.check({ kind: 'choice', i: i.choices!.indexOf('Wrong: both of those.') }).ok);
    expect(both.check({ kind: 'choice', i: both.choices!.indexOf('Wrong: a unit conversion is missing.') }).mc).toBe(MC.stopsAudit);
  });
});
