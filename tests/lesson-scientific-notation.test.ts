// Scientific notation and order of magnitude: every family x every sub-goal it serves x 300 seeds makes valid items
// (the answer passes, choices are unique with exactly one right, pictures can be drawn), the main misconceptions are
// classified (every misconception the topic JSON names is produced somewhere), the exact decimal maths and the
// models hold, and every voiced line of the page has a spoken text.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { FAMILIES, GENERATORS, MC, PAIRS, rng, type SnItem } from '../src/lesson/topics/scientific-notation/items';
import { PLAN } from '../src/lesson/topics/scientific-notation/plan';
import { D, add, div, eq, fromNumber, grouped, isCoef, mul, plain, roundSig, sciOf, sciVal, sub } from '../src/lesson/topics/scientific-notation/sci';
import { computeHop, hopEnd, hopForSci } from '../src/lesson/topics/scientific-notation/PointHop';
import { computeLadder } from '../src/lesson/topics/scientific-notation/PowerLadder';
import { LINES } from '../src/lesson/topics/scientific-notation/script';

const TOPIC_DIR = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials';
const TOPIC = `${TOPIC_DIR}/topics/secondary.scientific-notation-and-order-of-magnitude.json`;
const gen = (f: string, seed: number, sg?: string): SnItem => GENERATORS[f as keyof typeof GENERATORS](rng(seed), seed, sg);
const pairOf = (a: string, n: number) => ({ kind: 'pair' as const, x: Number(a), y: n });

describe('plan', () => {
  it('walks through all 15 sub-goals in topic JSON order, and every family it names exists and is used', () => {
    const ids = fs.existsSync(TOPIC) ? (JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] }).subgoals.map(s => s.id) : null;
    if (ids) expect(PLAN.map(p => p.id)).toEqual(ids);
    expect(PLAN.length).toBe(15);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENERATORS[f], f).toBeDefined(); }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
  });
});

describe('every family x every sub-goal it serves x 300 seeds', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = gen(f, s * 7 + 1, p.id);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        if (it.input === 'choice') {
          const ch = it.choices!;
          expect(new Set(ch).size, it.prompt).toBe(ch.length);
          expect(ch.length).toBeGreaterThanOrEqual(3);
          expect(ch.filter((_, i) => it.check({ kind: 'choice', i }).ok).length, it.prompt).toBe(1);
        }
        if (it.input === 'pair') {
          // the answer is normalised scientific notation
          const a = fromNumber((it.answer as { x: number }).x)!;
          expect(isCoef(a), `${it.prompt}: coefficient ${plain(a)}`).toBe(true);
          expect(Number.isInteger((it.answer as { y: number }).y)).toBe(true);
        }
        // pictures must be drawable: the model's maths accepts them
        if (it.pic?.kind === 'hop') { const pic = it.pic; expect(() => computeHop(pic.p), it.prompt).not.toThrow(); }
        if (it.pic?.kind === 'ladder') { const pic = it.pic; expect(() => computeLadder(pic.p), `${it.prompt} ${JSON.stringify(pic.p.marks.map(m => plain(m.v)))}`).not.toThrow(); }
        expect(it.solution.length).toBeGreaterThan(0);
        expect(it.prompt).not.toMatch(/undefined|NaN|null/);
        expect(it.solution.join(' ')).not.toMatch(/undefined|NaN|null/);
        if (it.choices) expect(it.choices.join(' ')).not.toMatch(/undefined|NaN|null/);
        seen.add(it.prompt + it.board);
      }
      const MIN: Record<string, number> = { 'choose-unit/pickUnit': 10, 'choose-unit/convertUnit': 10 };
      expect(seen.size, 'distinct items').toBeGreaterThanOrEqual(MIN[`${p.id}/${f}`] ?? 30);
    });
  }
});

describe('misconceptions are classified', () => {
  it('every misconception the topic JSON names is produced by some family', () => {
    if (!fs.existsSync(TOPIC)) return;
    const topic = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; misconceptions: string[] }[] };
    const seen = new Set<string>();
    for (const f of FAMILIES) for (let s = 1; s <= 400; s++) {
      const it = gen(f.id, s);
      if (it.choices) it.choices.forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); });
    }
    // typed answers: the classic slips (below), collected the same way
    for (const m of typedSlips()) seen.add(m);
    const want = new Set(topic.subgoals.flatMap(s => s.misconceptions));
    for (const m of want) expect(seen.has(m), m).toBe(true);
    for (const m of Object.values(MC)) expect(want.has(m), `${m} is not in the topic JSON`).toBe(true);
  });
  it('typed slips get their misconception', () => {
    // scientific notation to decimal
    const findDec = (pred: (it: SnItem) => boolean) => { for (let s = 1; s < 3000; s++) { const it = gen('toDecimal', s); if (pred(it)) return it; } throw new Error('none'); };
    const pos = findDec(it => /10<sup>[3-6]<\/sup>/.test(it.prompt) && /\d\.\d\d/.test(it.prompt));
    const m = /(\d\.\d+) × 10<sup>(\d)<\/sup>/.exec(pos.prompt)!;
    expect(pos.check({ kind: 'num', v: Number(m[1]) }).mc).toBe(MC.appendsZero);
    expect(pos.check({ kind: 'num', v: Number(`${m[1]}e-${m[2]}`) }).mc).toBe(MC.shiftDir);
    const negI = findDec(it => /10<sup>−[2-5]<\/sup>/.test(it.prompt));
    const mn = /([\d.]+) × 10<sup>−(\d)<\/sup>/.exec(negI.prompt)!;
    expect(negI.check({ kind: 'num', v: Number(mn[1]) }).mc).toBe(MC.notSame);
    expect(negI.check({ kind: 'num', v: -Number(`${mn[1]}e${mn[2]}`) }).mc).toBe(MC.negMakesNeg);
  });
  it('decimal to scientific: counting zeros, counting digits, the wrong sign, a coefficient out of range', () => {
    for (let s = 1; s <= 300; s++) {
      const it = gen('toSci', s);
      const { x, y } = it.answer as { x: number; y: number };
      if (y < -1) expect(it.check({ kind: 'pair', x, y: y + 1 }).mc, it.prompt).toBe(MC.countZeros);
      if (y > 1 && Number.isInteger(x * 10 ** y)) expect(it.check({ kind: 'pair', x, y: y + 1 }).mc, it.prompt).toBe(MC.countDigits);
      if (y !== 0) expect(it.check({ kind: 'pair', x, y: -y }).mc, it.prompt).toBe(MC.shiftDir);
      expect(it.check({ kind: 'pair', x: Number(plain(mul(fromNumber(x)!, D(10)))), y: y - 1 }).mc).toBe(MC.coefOut);
    }
  });
  it('renormalising in the same direction', () => {
    for (let s = 1; s <= 300; s++) {
      const it = gen('renorm', s);
      const g = /^(.+?) × 10<sup>(.+?)<\/sup>/.exec(it.prompt.replace(/<b class="b">/, ''))!;
      const given = Number(g[2]!.replace('−', '-'));
      const { x, y } = it.answer as { x: number; y: number };
      expect(it.check({ kind: 'pair', x, y: 2 * given - y }).mc, it.prompt).toBe(MC.sameDir);
    }
  });
  it('multiply, divide, add: the classic exponent slips', () => {
    expect(gen('multiply', 3).check({ kind: 'pair', x: 1, y: 999 }).ok).toBe(false);
    for (let s = 1; s <= 300; s++) {
      const m = gen('multiply', s);
      const [n1, n2] = [...m.board.matchAll(/10\^\{(-?\d+)\}/g)].map(x => Number(x[1]));
      expect(m.check({ kind: 'pair', x: (m.answer as { x: number }).x, y: n1! * n2! }).mc, m.prompt).toBe(MC.prodMult);
      const d = gen('divide', s);
      const [d1, d2] = [...d.board.matchAll(/10\^\{(-?\d+)\}/g)].map(x => Number(x[1]));
      if (d2! < 0) expect(d.check({ kind: 'pair', x: (d.answer as { x: number }).x, y: d1! + d2! }).mc, d.prompt).toBe(MC.subNeg);
      const a = gen('addSame', s);
      const e = Number(/10\^\{(-?\d+)\}/.exec(a.board)![1]);
      if (a.board.includes('+') && e !== 0) {
        const { x, y } = a.answer as { x: number; y: number };
        if (y === e) expect(a.check({ kind: 'pair', x, y: 2 * e }).mc, a.prompt).toBe(MC.addAddsExp);
      }
      const al = gen('align', s);
      const [p1, p2] = [...al.board.matchAll(/(\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}/g)].map(x => [x[1]!, Number(x[2])] as const);
      if (al.board.includes('+')) {
        const naive = sciOf(sciVal(add(D(p1![0]), D(p2![0])), p1![1]));
        expect(al.check({ kind: 'pair', x: Number(plain(naive.a)), y: naive.n }).mc, al.prompt).toBe(MC.noAlign);
      }
    }
  });
  it('comparing: exponents only, leading digits only, the exponent difference', () => {
    let tested = 0;
    for (let s = 1; s <= 300; s++) {
      const it = gen('times', s);
      const [hi, lo] = [...it.board.matchAll(/([\d.]+) \\times 10\^\{(-?\d+)\}/g)].map(x => [D(x[1]!), Number(x[2])] as const);
      const k = hi![1] - lo![1], q = div(hi![0], lo![0])!;
      if (!eq(q, D(1))) { expect(it.check({ kind: 'num', v: 10 ** k }).mc, it.prompt).toBe(MC.expOnly); tested++; }
      if (!eq(q, D(10 ** k)) && k > 0) expect(it.check({ kind: 'num', v: Number(plain(q)) }).mc, it.prompt).toBe(MC.leadOnly);
      if (k >= 2 && !eq(q, D(k))) expect(it.check({ kind: 'num', v: k }).mc, it.prompt).toBe(MC.additive);
    }
    expect(tested).toBeGreaterThan(50);
    expect(PAIRS.every(p => p.length >= 4)).toBe(true);
  });
  it('E-notation read as a subtraction', () => {
    for (let s = 1; s <= 200; s++) {
      const it = gen('eDecimal', s);
      const m = /([\d.]+)E([+-]?\d+)/.exec(it.prompt)!;
      const a = D(m[1]!), e = Number(m[2]);
      if (e < 0) expect(it.check({ kind: 'num', v: Number(plain(sub(a, D(-e)))) }).mc, it.prompt).toBe(MC.eNote);
    }
  });
  it('estimates: 9.8 rounds up to the next power, zeros and digits are not the exponent', () => {
    let boundary = 0;
    for (let s = 1; s <= 400; s++) {
      const it = gen('estimate', s);
      const { x, y } = it.answer as { x: number; y: number };
      expect(Number.isInteger(x) && x >= 1 && x <= 9).toBe(true);
      if (x === 1 && /9\.?[5-9]|0\.0*9[5-9]|9[5-9]/.test(it.prompt)) boundary++;
      expect(it.check({ kind: 'pair', x: x * 10, y: y - 1 }).mc).toBe(MC.coefOut);
    }
    expect(boundary).toBeGreaterThan(5);
  });
});

function typedSlips(): Set<string> {
  // every typed family with a few systematic wrong answers; collect what the classifiers say
  const out = new Set<string>();
  const typed = FAMILIES.filter(f => { const it = gen(f.id, 1); return it.input !== 'choice'; }).map(f => f.id);
  for (const f of typed) for (let s = 1; s <= 300; s++) {
    const it = gen(f, s);
    const tries: unknown[] = [];
    if (it.answer.kind === 'pair') {
      const { x, y } = it.answer;
      for (const dx of [x, x * 10, x / 10, x + 1, x - 1, 2, 3, 4, 5, 6, 7, 8, 9, 1.1, 0.5, 2.5, 7.3]) for (let dy = -30; dy <= 30; dy++) tries.push(pairOf(String(dx), y + dy));
    } else if (it.answer.kind === 'num') {
      const v = it.answer.v;
      for (const t of [v * 10, v / 10, -v, v + 1, 1, 2, 3, 4, 5, 10, 100, 1000, 10000, 0.25, 6, -6, 0.2, 3.2, 1.2]) tries.push({ kind: 'num', v: t });
      for (let k = -12; k <= 12; k++) tries.push({ kind: 'num', v: v * 10 ** k });
      const m = /([\d.]+) × 10<sup>(−?\d+)<\/sup>|([\d.]+)E([+-]?\d+)/.exec(it.prompt);
      if (m) { const a = Number(m[1] ?? m[3]); tries.push({ kind: 'num', v: a }); for (let k = -12; k <= 12; k++) { tries.push({ kind: 'num', v: a * 10 ** k }, { kind: 'num', v: -a * 10 ** k }); } tries.push({ kind: 'num', v: Number(plain(sub(D(m[1] ?? m[3]!), D(Math.abs(Number((m[2] ?? m[4])!.replace('−', '-'))))))) }); }
    }
    for (const r of tries) { const v = it.check(r as never); if (v.mc) out.add(v.mc); }
  }
  return out;
}

describe('the exact decimal maths', () => {
  it('reads typed numbers exactly and does arithmetic without float error', () => {
    expect(plain(fromNumber(0.1)!)).toBe('0.1');
    expect(eq(add(D('0.1'), D('0.2')), D('0.3'))).toBe(true);
    expect(plain(mul(D('3.04'), D('1e-5')))).toBe('0.0000304');
    expect(plain(fromNumber(4.5e9)!)).toBe('4500000000');
    expect(plain(fromNumber(3.04e-7)!)).toBe('0.000000304');
    expect(grouped(D('4500000000'))).toBe('4,500,000,000');
    expect(grouped(D('8849'))).toBe('8,849');
    expect(sciOf(D('0.00038'))).toEqual({ a: D('3.8'), n: -4 });
    expect(sciOf(D('45000'))).toEqual({ a: D('4.5'), n: 4 });
    expect(eq(roundSig(D('0.00098'), 1), D('0.001'))).toBe(true);
    expect(div(D(1), D(3))).toBeNull();
    expect(plain(div(D('2e-4'), D('8e-6'))!)).toBe('25');
  });
});

describe('the models', () => {
  it('PointHop: every hop is one factor of 10, zeros are placeholders', () => {
    expect(hopEnd(hopForSci(D('3.04'), -5))).toBe('0.0000304');
    expect(hopEnd(hopForSci(D('4.5'), 9))).toBe('4500000000');
    expect(hopEnd({ digits: '42', from: 2, to: 1 })).toBe('4.2');
    expect(computeHop(hopForSci(D('3.04'), -5)).hops).toBe(-5);
    expect(() => computeHop({ digits: '0', from: 1, to: 2 })).toThrow();
    expect(() => computeHop({ digits: '5', from: 1, to: 20 })).toThrow();
  });
  it('PowerLadder: the height in a gap is the coefficient, marks stay on the ladder', () => {
    const m = computeLadder({ lo: 7, hi: 10, marks: [{ v: D('1.5e8'), name: 'Earth', col: 'first' }, { v: D('4.5e9'), name: 'Neptune', col: 'second' }], climb: { from: 0, rungs: 1 }, within: { to: 1, label: '\\times 3' } });
    expect(m.pos[0]! - 8).toBeCloseTo(Math.log10(1.5));
    expect(plain(m.ghost!)).toBe('1500000000');
    expect(() => computeLadder({ lo: 7, hi: 9, marks: [{ v: D('4.5e9'), name: 'x', col: 'first' }] })).toThrow(/off the ladder/);
    expect(() => computeLadder({ lo: 1, hi: 10, marks: [{ v: D('5'), name: 'x', col: 'first' }] })).toThrow(/gaps/);
  });
  it('the lesson numbers: 30 times as far, 25 times as wide, about 1.1 times the town', () => {
    expect(plain(div(D('4.5e9'), D('1.5e8'))!)).toBe('30');
    expect(plain(div(D('2e-4'), D('8e-6'))!)).toBe('25');
    expect(div(D('1e5'), D('9e4'))).toBeNull();
    expect((1e5 / 9e4).toFixed(1)).toBe('1.1');
  });
});

describe('voice', () => {
  it('every line the page shows has a spoken text, written to be read aloud, and every spoken text is used', () => {
    const page = fs.readFileSync('pages/lessons/scientific-notation.ts', 'utf8');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/scientific-notation/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]?.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[<>×÷=^]|\d\/\d|\d\s*E\s*-?\d|10\^/);
    }
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const id of Object.keys(LINES)) {
      const dyn = /^(e\.s\d|p\.c\d|t\.cb-)/.test(id);
      if (!dyn) expect(page.includes(`'${id}'`), `${id} is never shown`).toBe(true);
    }
  });
});

describe('quality layer (worked steps, regressions)', () => {
  it('explain reads a big decimal with all its thousands commas (7,400,000 is 7400000) and marks a × 10ⁿ', async () => {
    const { explain } = await import('../src/lesson/topics/scientific-notation/explain');
    const { GENS } = await import('../src/lesson/topics/scientific-notation/items');
    const { rng } = await import('../src/lesson/runtime/item');
    let big = 0;
    for (let s = 1; s <= 300; s++) {
      const it0 = GENS.toDecimal!(rng(s * 13 + 5), s, 'convert-sci-to-decimal'), ex = explain(it0)!;
      expect(ex.result).toEqual(it0.answer);
      if (it0.answer.kind === 'num' && it0.answer.v >= 1e6) big++;
      const it1 = GENS.multiply!(rng(s * 17 + 3), s, 'multiply-sci'), ex1 = explain(it1)!;
      expect(ex1.result).toEqual(it1.answer);
    }
    expect(big).toBeGreaterThan(0);
  });
  it('distribute: the "adds the exponents" choice is written as one power (10^−10), never "10^−5 + −5"; "1 place", not "1 places"', async () => {
    const { GENS } = await import('../src/lesson/topics/scientific-notation/items');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 300; s++) {
      const it0 = GENS.distribute!(rng(s * 7 + 1), s, 'add-subtract-same-power');
      for (const c of it0.choices ?? []) expect(c).not.toMatch(/\+ [−-]/);
      const it1 = GENS.eDecimal!(rng(s * 7 + 2), s, 'e-notation');
      expect(it1.solution.join(' ')).not.toMatch(/\b1 places\b/);
    }
  });
});

describe('quality layer (phase 2 regressions)', () => {
  it('pickUnit: the keyed unit gives a number from 1 to 1,000, the others do not', async () => {
    const { GENS } = await import('../src/lesson/topics/scientific-notation/items');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 400; s++) {
      const it0 = GENS.pickUnit!(rng(s * 131 + 7), s, 'choose-unit');
      if (!/1 to 1,000/.test(it0.prompt)) continue;
      it0.choices!.forEach((c, i) => {
        const v = Number(c.replace(/<[^>]+>/g, '').replace(/,/g, '').split(' ')[0]);
        expect(v >= 1 && v <= 1000, c).toBe(i === (it0.answer as { i: number }).i);
      });
    }
  });
  it('estimate: never an exact tie like 7.5 × 10ⁿ', async () => {
    const { GENS } = await import('../src/lesson/topics/scientific-notation/items');
    const { rng } = await import('../src/lesson/runtime/item');
    for (let s = 1; s <= 1500; s++) {
      const it0 = GENS.estimate!(rng(s * 131 + 7), s, 'estimate-single-digit-power');
      const step = it0.solution[0]!.replace(/<[^>]+>/g, '');
      const a = Number(step.match(/= (\d+(?:\.\d+)?) ×/)![1]);
      expect(Math.abs(a * 10 - Math.round(a * 10)) < 1e-9 && Math.round(a * 10) % 10 === 5, step).toBe(false);
    }
  });
});
