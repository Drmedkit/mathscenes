// lesson-add-subtract-rational-numbers: every family × every sub-goal it serves × 300 seeds (the answer passes, choices
// are unique with exactly one right, the main misconceptions are classified, pictures are drawable); the models' maths;
// the plan covers the topic JSON; the voice lines match the panel script.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { GENS, PROBES, FAMILY_NAMES, type FamilyId, type Pic } from '../src/lesson/topics/add-subtract-rational-numbers/items';
import { PLAN } from '../src/lesson/topics/add-subtract-rational-numbers/plan';
import { LINES } from '../src/lesson/topics/add-subtract-rational-numbers/script';
import { lineFits, niceRange, numTex, onTick } from '../src/lesson/topics/add-subtract-rational-numbers/NumberLine';
import { computeMat, matFits } from '../src/lesson/topics/add-subtract-rational-numbers/CounterMat';
import { N, D, readQ, sumQ, exprTex, tx, hx, as } from '../src/lesson/topics/add-subtract-rational-numbers/num';
import { rat } from '../src/core/math';

// ---- quality layer (docs/lessons/QUALITY_LAYER.md): worked steps, check-in adapter, regressions ----
import { rng as qlRng, plain as qlPlain, type Item as QlItem } from '../src/lesson/runtime/item';
import { GENS as qlGens } from '../src/lesson/topics/add-subtract-rational-numbers/items';
import { PLAN as qlPlan } from '../src/lesson/topics/add-subtract-rational-numbers/plan';
import { explain as qlExplain } from '../src/lesson/topics/add-subtract-rational-numbers/explain';
import { PLACEMENT as qlPlacement } from '../src/lesson/topics/add-subtract-rational-numbers/placement';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-17-operations-with-rational-numbers.json';
const MISC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(19);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId], f).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) { expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy(); expect(PLAN.some(p => p.families.includes(f)), `${f} is in no sub-goal`).toBe(true); }
  });
});

const known = fs.existsSync(MISC) ? new Set((JSON.parse(fs.readFileSync(MISC, "utf8")) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
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
      for (const s of [it.prompt, it.board, it.solution.join(' '), v.say, ...(it.choices ?? [])]) expect(s, `${it.id} ${it.prompt}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length).toBeGreaterThanOrEqual(3);
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
    // every family recognises at least one misconception somewhere in its 300 items (property naming is the exception)
    if (fam !== 'property') expect(n, `${fam}: no misconception probes`).toBeGreaterThan(0);
  });
  it('pictures are drawable', () => {
    for (const it of items) {
      const pic = it.picture as Pic | undefined;
      if (!pic) continue;
      if (pic.kind === 'mat') { expect(matFits(pic), it.id).toBe(true); computeMat(pic); }
      else {
        expect(lineFits(pic.lo, pic.hi, pic.den), `${it.id} ${pic.lo}..${pic.hi}/${pic.den}`).toBe(true);
        const vs = pic.kind === 'line' ? [pic.p, pic.p + pic.q, ...(pic.op === '-' ? [pic.p - pic.q] : []), ...(pic.claim !== undefined ? [pic.claim] : [])] : pic.kind === 'gap' ? [pic.a, pic.b] : [pic.v];
        for (const v of vs) { expect(onTick(v, pic.den), `${it.id} ${v}`).toBe(true); expect(v >= pic.lo && v <= pic.hi, `${it.id} ${v} in ${pic.lo}..${pic.hi}`).toBe(true); }
      }
    }
  });
  it('makes many different problems', () => {
    expect(new Set(items.map(i => i.prompt + i.board + JSON.stringify(i.picture ?? null) + (i.choices ?? []).join())).size).toBeGreaterThan(fam === 'property' || fam === 'signMeaning' ? 40 : 60);
  });
});

describe('exact numbers and the models', () => {
  it('forms and reading answers', () => {
    expect(tx(N(-9, 4, 'mixed'))).toBe('-2\\tfrac{1}{4}');
    expect(tx(N(-3), true)).toBe('(-3)');
    expect(hx(D(-2.75))).toBe('−2.75');
    expect(exprTex([{ op: null, n: N(4) }, { op: '-', n: N(-3) }])).toBe('4 - (-3)');
    expect(sumQ([{ op: null, n: N(4) }, { op: '-', n: N(-3) }])).toEqual(rat(7));
    // a minus sign in any fraction box makes the whole value negative: -2 1/4 typed as [-2] 1/4
    expect(readQ({ kind: 'frac', w: -2, n: 1, d: 4 })).toEqual(rat(-9, 4));
    expect(readQ({ kind: 'frac', w: 0, n: -3, d: 4 })).toEqual(rat(-3, 4));
    expect(readQ({ kind: 'num', v: -4.25 })).toEqual(rat(-17, 4));
    expect(readQ({ kind: 'num', v: NaN })).toBeNull();
    expect(as(rat(-5, 2), 'dec').form).toBe('dec');
    expect(numTex(-1.5, 2)).toBe('-1\\tfrac{1}{2}');
    expect(numTex(-0.3, 10, true)).toBe('-0.3');
  });
  it('the number line picks calm ranges', () => {
    expect(niceRange([4, 1, 7], 1)).toEqual({ lo: -1, hi: 8 });
    expect(niceRange([-30, 25], 1)).toBeNull();
    expect(lineFits(-9, 5, 1)).toBe(true);
    expect(lineFits(-3, 3, 10)).toBe(false);
  });
  it('the counter mat conserves its value', () => {
    const m = computeMat({ pos: 4, neg: 7 });
    expect(m.end).toBe(-3); expect(m.pairs).toBe(4); expect(m.leftSign).toBe(-1);
    const s = computeMat({ pos: 3, neg: 0, add: 5, take: { sign: -1, n: 5 } });   // 3 - (-5)
    expect(s.afterAdd).toBe(3); expect(s.end).toBe(8);
    const t = computeMat({ pos: 2, neg: 0, add: 3, take: { sign: 1, n: 5 } });   // 2 - 5
    expect(t.end).toBe(-3);
    expect(() => computeMat({ pos: 2, neg: 0, take: { sign: 1, n: 5 } })).toThrow();
  });
});

describe('voice', () => {
  it('every panel line has a spoken text, and lines.json matches the script', () => {
    const file = 'pages/lessons/add-subtract-rational-numbers/voice/lines.json';
    const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(json).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(json[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[<>]|\d\/\d|−\d/);   // read-aloud text: no HTML, no "3/4", no symbol minus before a digit
    }
  });
});

describe('quality layer', () => {
  const gens = qlGens as unknown as Record<string, (R: () => number, n: number, sg?: string) => QlItem>;
  it('the steps card ends on an answer the lesson accepts, in every pair (200 seeds)', () => {
    for (const p of qlPlan) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it0 = gens[f]!(qlRng(s * 37 + 5), s, p.id);
      const ex = qlExplain(it0);
      expect(ex, `${p.id}/${f}: ${it0.prompt}`).not.toBeNull();
      expect(it0.check(ex!.result).ok, `${p.id}/${f}: ${JSON.stringify(ex!.result)} for ${it0.prompt}`).toBe(true);
    }
  });
  it('the check-in picks are pairs of the plan and their answers pass', () => {
    for (const pk of qlPlacement.picks) {
      expect(qlPlan.find(p => p.id === pk.subgoal)?.families as string[] | undefined).toContain(pk.family);
      for (let s = 1; s <= 50; s++) { const it0 = gens[pk.family]!(qlRng(s), s, pk.subgoal); expect(it0.check(it0.answer).ok).toBe(true); }
    }
  });
  it('no "1 …s" in questions, choices or steps', () => {
    for (const p of qlPlan) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it0 = gens[f]!(qlRng(s * 7 + 3), s, p.id);
      const text = qlPlain([it0.prompt, ...(it0.choices ?? []), ...it0.solution].join(' | '));
      expect(text, `${p.id}/${f}`).not.toMatch(/(?<![\d.\/])1 dollars\b/);
    }
  });
  it('a negative fraction or mixed number in the steps is read as a signed fraction the lesson accepts', () => {
    for (const [f, sg] of [['fracSigned', 'fraction-add-sub-signed'], ['mixedOps', 'mixed-number-add-sub-signed'], ['opposite', 'minus-sign-roles']] as const)
      for (let s = 1; s <= 200; s++) {
        const it0 = gens[f]!(qlRng(s), s, sg), r = qlExplain(it0)!.result;
        if (r.kind === 'frac') expect([r.w, r.n, r.d].every(Number.isInteger), JSON.stringify(r)).toBe(true);
        expect(it0.check(r).ok, `${it0.board}: ${JSON.stringify(r)}`).toBe(true);
      }
  });
});

describe('quality layer: oracle findings (phase 2)', () => {
  const gens = qlGens as unknown as Record<string, (R: () => number, n: number, sg?: string) => QlItem>;
  it('a property step always changes something; a submarine stays under water; no "− −"', () => {
    for (let s = 1; s <= 400; s++) {
      const pr = gens.property!(qlRng(s), s, 'additive-properties-strategies');
      const [l, r] = pr.board.split(' = ');
      expect(l, pr.board).not.toBe(r);
      const st = gens.story!(qlRng(s), s, 'apply-one-step-add-sub');
      if (/submarine/.test(st.prompt) && st.answer.kind === 'num') expect(st.answer.v, st.prompt).toBeLessThan(0);
      const sr = gens.signRole!(qlRng(s), s, 'minus-sign-roles');
      expect(qlPlain(sr.prompt)).not.toMatch(/[−-]\s+[−-]\s*\(/);
    }
  });
});
