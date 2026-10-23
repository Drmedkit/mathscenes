// lesson-integer-exponents: every family x every sub-goal it serves x 300 seeds (the answer passes, choices are unique
// with exactly one right, the main misconceptions are classified, pictures are drawable); the exact power maths and the
// factor mat's count; the plan covers the topic JSON; the voice lines match the panel script.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type FamilyId, type Pic } from '../src/lesson/topics/integer-exponents/items';
import { PLAN } from '../src/lesson/topics/integer-exponents/plan';
import { LINES } from '../src/lesson/topics/integer-exponents/script';
import { computeMat, matFits, tileNum } from '../src/lesson/topics/integer-exponents/FactorMat';
import { decStr, numQ, qPow, readQ, vTex } from '../src/lesson/topics/integer-exponents/expo';
import { rat } from '../src/core/math';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-27-integer-exponents-and-scientific-notation.json';
const MISC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(17);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId], f).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) { expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy(); expect(PLAN.some(p => p.families.includes(f)), `${f} is in no sub-goal`).toBe(true); }
  });
});

const known = fs.existsSync(MISC) ? new Set((JSON.parse(fs.readFileSync(MISC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam as FamilyId](rng(s * 7919 + fam.length * 31 + sg.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), v.say, ...(it.choices ?? [])]) expect(s, `${it.id} ${it.prompt}`).not.toMatch(/undefined|NaN|Infinity|\[object|--|\+ -|−−/);
      // a number-box answer must be typeable (an integer or a short decimal)
      if (it.answer.kind === 'num') expect(numQ(it.answer.v), it.id).not.toBeNull();
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length, it.prompt).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt + ' ' + ch.join(' | ')).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, it.prompt).toBe(1);
    }
  });
  it('the main misconceptions are classified (with catalogue ids)', () => {
    let n = 0;
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
      if (known) expect(known.has(p.mc), p.mc).toBe(true);
      n++;
    }
    expect(n, `${fam}: no misconception probes`).toBeGreaterThan(0);
  });
  it('pictures are drawable and count right', () => {
    for (const it of items) {
      const pic = it.picture as Pic | undefined;
      if (!pic) continue;
      expect(matFits(pic), it.id).toBe(true);
      const m = computeMat(pic);
      if (pic.resultValue && m.value) expect(m.value).toEqual(pic.resultValue);
    }
  });
  it('makes many different problems', () => {
    const distinct = new Set(items.map(i => i.prompt + i.board + (i.choices ?? []).join())).size;
    expect(distinct, fam).toBeGreaterThan(fam === 'justify' || fam === 'zeroContrast' || fam === 'tenExp' || fam === 'tenDec' || fam === 'negSame' || fam === 'quotPick' || fam === 'minusPair' ? 10 : 30);
  });
});

describe('exact powers and the factor mat', () => {
  it('powers by repeated multiplication', () => {
    expect(qPow(rat(2), -3)).toEqual(rat(1, 8));
    expect(qPow(rat(-2), -3)).toEqual(rat(-1, 8));
    expect(qPow(rat(-3), 0)).toEqual(rat(1));
    expect(qPow(rat(2, 3), -2)).toEqual(rat(9, 4));
    expect(qPow(rat(-1, 2), -3)).toEqual(rat(-8));
    expect(qPow(rat(10), -3)).toEqual(rat(1, 1000));
    expect(() => qPow(rat(0), 0)).toThrow();
    expect(() => qPow(rat(0), -1)).toThrow();
    expect(qPow(rat(3), 2)).toEqual(rat(9));
    expect(vTex(rat(-9, 4))).toBe('-\\frac{9}{4}');
    expect(decStr(rat(1, 1000))).toBe('0.001');
  });
  it('reading answers: a minus sign in any box makes it negative', () => {
    expect(readQ({ kind: 'frac', w: 0, n: -1, d: 8 })).toEqual(rat(-1, 8));
    expect(readQ({ kind: 'frac', w: 0, n: 1, d: -8 })).toEqual(rat(-1, 8));
    expect(readQ({ kind: 'frac', w: -2, n: 1, d: 4 })).toEqual(rat(-9, 4));
    expect(readQ({ kind: 'num', v: 0.001 })).toEqual(rat(1, 1000));
    expect(readQ({ kind: 'num', v: -0.125 })).toEqual(rat(-1, 8));
    expect(readQ({ kind: 'frac', w: 0, n: 1, d: 0 })).toBeNull();
  });
  it('the mat counts its tiles: 2^3 over 2^6 is 2^-3 = 1/8', () => {
    const two = { label: '2', col: 'first' as const };
    const m = computeMat({ top: [two, two, two], bottom: Array.from({ length: 6 }, () => ({ ...two, col: 'second' as const })), cancel: 3 });
    expect(m.exp).toBe(-3); expect(m.value).toEqual(rat(1, 8)); expect(m.leftBottom).toBe(3);
    const n = computeMat({ top: [], bottom: [] });
    expect(n.value).toEqual(rat(1));   // the empty product: a^0 = 1
    const neg = computeMat({ top: [{ label: '-2', col: 'first' }, { label: '-2', col: 'first' }, { label: '-2', col: 'first' }], bottom: [] });
    expect(neg.value).toEqual(rat(-8));
    expect(() => computeMat({ top: [two], bottom: [{ label: '3', col: 'second' }], cancel: 1 })).toThrow();
    expect(tileNum('(-3)')).toBe(-3); expect(tileNum('x')).toBeNull();
    expect(matFits({ top: Array.from({ length: 7 }, () => two), bottom: [] })).toBe(true);
    expect(matFits({ top: Array.from({ length: 12 }, () => two), bottom: [] })).toBe(false);
  });
});

describe('voice', () => {
  it('every panel line has a spoken text, and lines.json matches the script', () => {
    const file = 'pages/lessons/integer-exponents/voice/lines.json';
    const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(json).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(json[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[<>]|\d\/\d|−\d|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]|\^/);   // read-aloud text: no HTML, no "3/4", no symbol minus, no superscripts
    }
  });
});

describe('integer-exponents: quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  const G = GENS as Record<string, (R: () => number, n: number, sg?: string) => Item>;
  const txt = (h: string) => h.replace(/<[^>]+>/g, '');
  const all = () => PLAN.flatMap(p => p.families.map(f => [p.id, f] as const));
  it('signed sums are written with brackets ("2 + (−5)"), plurals agree ("1 factor"), the minus is a real minus', () => {
    for (const [sg, f] of all()) for (let s = 1; s <= 80; s++) {
      const it = G[f]!(rng(s * 17 + 9), s, sg);
      for (const l of it.solution.map(txt)) {
        expect(l, f).not.toMatch(/[+−÷] [−-]\d/);
        expect(l, f).not.toMatch(/(^|[^\d.])1 factors/);
        expect(l, f).not.toMatch(/\(-\d/);
      }
    }
  });
  it('"a^3 × a^0 = a^(3+0) = a^3": the step shows the sum, not "a^3 = a^3"', () => {
    for (let s = 1; s <= 300; s++) {
      const it = G.justify!(rng(s * 3 + 2), s, 'justify-zero-negative-definitions');
      for (const t of [...it.solution, ...(it.choices ?? [])]) expect(t, t).not.toMatch(/(<sup>(\d+)<\/sup>) = \d+\1/);
    }
  });
  it('"type the exponent" steps end on the exponent (3^6 is not read as 36)', async () => {
    const { explain } = await import('../src/lesson/topics/integer-exponents/explain');
    for (const [sg, f] of all().filter(([, f]) => ['prodExp', 'quotExp', 'powPow', 'monoExp'].includes(f))) for (let s = 1; s <= 60; s++) {
      const it = G[f]!(rng(s * 5 + 1), s, sg);
      expect(explain(it)?.result, `${f}: ${txt(it.prompt)}`).toEqual(it.answer);
    }
  });
});
