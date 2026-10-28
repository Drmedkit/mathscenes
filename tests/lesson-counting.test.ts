// lesson-counting: the generic checks (every family x every sub-goal it serves x 300 seeds), then the topic checks:
// the counting maths against exhaustive lists, generated answers against brute force, misconception probes, no
// secretly-right distractor, and every practice picture lays out.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { type Item, rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/counting/items';
import { PLAN } from '../src/lesson/topics/counting/plan';
import { C, P, combs, countNumbers, fact, multi, multisets, perms, pow, words } from '../src/lesson/topics/counting/count';
import { CountPic, type CPic } from '../src/lesson/topics/counting/CountPic';
import { dusk } from '../src/lesson/dusk';
import { frame } from '../src/blocks/block';

const TOPIC = { subgoals: [...new Map(["secondary-t7-16-probability-counting-permutations-and-combinations"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => Item>;

describe('counting: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('counting: families', () => {
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
        }
        seen.add(item.prompt + '|' + item.board);
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

describe('counting: the maths agrees with exhaustive lists', () => {
  const xs = 'ABCDEFG'.split('');
  it('P, C, n^r and multisets match the lists', () => {
    for (let n = 0; n <= 7; n++) for (let r = 0; r <= n + 1; r++) {
      const L = xs.slice(0, n);
      expect(perms(L, r).length, `P(${n},${r})`).toBe(r > n ? 0 : P(n, r));
      expect(combs(L, r).length, `C(${n},${r})`).toBe(C(n, r));
      if (n >= 1 && r <= 4) { expect(words(L, r).length).toBe(pow(n, r)); expect(multisets(L, r).length, `multi(${n},${r})`).toBe(multi(n, r)); }
    }
  });
  it('n!/(n-r)! = P, C = P/r!, C(n,r) = C(n,n-r), 0! = 1', () => {
    expect(fact(0)).toBe(1);
    for (let n = 0; n <= 12; n++) for (let r = 0; r <= n; r++) {
      expect(fact(n) / fact(n - r)).toBe(P(n, r));
      expect(P(n, r) / fact(r)).toBe(C(n, r));
      expect(C(n, n - r)).toBe(C(n, r));
    }
    expect(C(52, 5)).toBe(2598960);
  });
  it('the topic JSON examples', () => {
    expect(P(8, 3)).toBe(336); expect(P(10, 4)).toBe(5040); expect(C(9, 3) - C(5, 3)).toBe(74);
    expect(countNumbers([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 3, ds => ds[2]! % 2 === 0)).toBe(328);
    expect(C(5, 2) * C(6, 3)).toBe(200); expect(C(20, 18)).toBe(190);
  });
});

const val = (it: Item) => (it.answer as { v: number }).v;
describe('counting: generated answers against brute force', () => {
  it('evenDistinct matches a brute-force count of the numbers', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.evenDistinct!(rng(s * 13 + 1), s);
      const p = it.prompt.match(/(\d)-digit <b>(even|odd)<\/b> numbers have all different digits, using only the digits (\d) to (\d)/)!;
      const L = Number(p[1]), even = p[2] === 'even', lo = Number(p[3]), hi = Number(p[4]);
      const ds = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
      expect(val(it), it.prompt).toBe(countNumbers(ds, L, d => (d[L - 1]! % 2 === 0) === even));
    }
  });
  it('restrictFirst digit items match a brute-force count', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.restrictFirst!(rng(s * 17 + 3), s);
      const m = it.prompt.match(/How many (\d)-digit numbers have all different digits, using only the digits 0 to (\d)/);
      if (!m) continue;
      const ds = Array.from({ length: Number(m[2]) + 1 }, (_, i) => i);
      expect(val(it)).toBe(countNumbers(ds, Number(m[1]), () => true));
    }
  });
  it('divisibleOr matches a direct count', () => {
    for (let s = 1; s <= 200; s++) {
      const it = GEN.divisibleOr!(rng(s * 7 + 2), s);
      const [, N, p, q] = it.prompt.match(/1 to (\d+) are divisible by (\d+) or by (\d+)/)!.map(Number);
      expect(val(it)).toBe(Array.from({ length: N! }, (_, i) => i + 1).filter(x => x % p! === 0 || x % q! === 0).length);
    }
  });
  it('probabilities are in lowest terms and below 1', () => {
    for (const f of ['probComm', 'probBag', 'probCode']) for (let s = 1; s <= 300; s++) {
      const a = GEN[f]!(rng(s * 5 + 9), s).answer as { n: number; d: number };
      expect(a.n).toBeGreaterThan(0); expect(a.n).toBeLessThan(a.d);
      let g = a.n, h = a.d; while (h) [g, h] = [h, g % h];
      expect(g).toBe(1);
    }
  });
  it('scoopList matches the listed multisets', () => {
    for (let s = 1; s <= 200; s++) {
      const it = GEN.scoopList!(rng(s * 19 + 4), s);
      const r = ['two', 'three'].indexOf((it.prompt.match(/(?:holds|grab) (two|three)/) ?? [])[1] ?? '') + 2;
      const k = /dimes/.test(it.prompt) ? 3 : /pennies/.test(it.prompt) ? 2 : (it.prompt.match(/has (.*?), and a cup/)![1]!.split(/, | and /).length);
      expect(val(it), it.prompt).toBe(multisets('abc'.slice(0, k).split(''), r).length);
    }
  });
});

describe('counting: misconception probes', () => {
  const probe = (f: string, wrong: (it: Item) => number | null, mc: string, min: number) => {
    let hit = 0;
    for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 11 + 5), s);
      const w = wrong(it);
      if (w === null) continue;
      const v = it.check({ kind: 'num', v: w });
      if (!v.ok && v.mc === mc) hit++;
    }
    expect(hit, `${f} → ${mc}`).toBeGreaterThan(min);
  };
  it('officers: n^r keeps all slot choices', () => {
    probe('officers', it => { const m = it.prompt.match(/A club of (\d+) members elects (.*?), a different/); if (!m) return null; return pow(Number(m[1]), (m[2]!.match(/\ba /g) ?? []).length); }, 'mc.probability.keeps-all-slot-choices-without-replacement', 30);
  });
  it('groupsDivide: the ordered count counts orders as different', () => {
    probe('groupsDivide', it => Number(it.prompt.match(/There are ([\d,]+) ways/)![1]!.replace(/,/g, '')), 'mc.probability.counts-orders-as-different', 150);
  });
  it('vennCount: a + b double counts the overlap', () => {
    probe('vennCount', it => { const m = it.prompt.match(/: (\d+) are in .*?, (\d+) are in/)!; return Number(m[1]) + Number(m[2]); }, 'mc.probability.double-counts-overlap', 150);
  });
  it('handshakes: n(n − 1) counts each handshake twice', () => {
    probe('handshakes', it => 2 * val(it), 'mc.probability.counts-orders-as-different', 150);
  });
  it('factorialEval: n × n reads n! as a square', () => {
    probe('factorialEval', it => { const n = Number(it.board.match(/^(\d+)!/)![1]); return n >= 2 ? n * n : null; }, 'mc.probability.factorial-read-as-square', 100);
  });
  it('atLeastOne: senior-first construction overcounts', () => {
    probe('atLeastOne', it => {
      const m = it.prompt.match(/A (\d)-person committee \(no roles\) is chosen from (\d) seniors and (\d) juniors/)!;
      const r = Number(m[1]), s = Number(m[2]), j = Number(m[3]);
      return s * C(s + j - 1, r - 1);
    }, 'mc.probability.at-least-one-constructive-overcount', 150);
  });
  it('pinCount: n × r and r^n', () => {
    probe('pinCount', it => { const sl = (it.picture as { pics: { rows: { slots: { reveal: number }[] }[] }[] }).pics[0]!.rows[0]!.slots; return sl[0]!.reveal * sl.length; }, 'mc.probability.multiplies-n-by-r', 120);
  });
});

describe('counting: no secretly-right distractor', () => {
  // the expression choices are evaluated as written; exactly one equals the right value
  const evalChoice = (t: string): number | null => {
    const s = t.replace(/<sup>(\d+)<\/sup>/g, '^$1').trim();
    let m = s.match(/^(\d+)! \/ \((\d+)! · (\d+)!\)$/); if (m) return fact(+m[1]!) / (fact(+m[2]!) * fact(+m[3]!));
    m = s.match(/^(\d+)! \/ \((\d+) · (\d+)!\)$/); if (m) return fact(+m[1]!) / (+m[2]! * fact(+m[3]!));
    m = s.match(/^(\d+)! \/ (\d+)!$/); if (m) return fact(+m[1]!) / fact(+m[2]!);
    m = s.match(/^(\d+)!$/); if (m) return fact(+m[1]!);
    m = s.match(/^(\d+)\^(\d+)$/); if (m) return pow(+m[1]!, +m[2]!);
    m = s.match(/^(\d+)! = /); if (m) return fact(+m[1]!);
    m = s.match(/^([\d × ]+?)(?: ÷ (\d)!)?$/); if (m) { const p = m[1]!.split('×').map(x => Number(x.trim())).reduce((a, b) => a * b, 1); return m[2] ? p / fact(+m[2]) : p; }
    return null;
  };
  it('methodPick, factorialMeaning, permCancel, combPick: one choice has the right value', () => {
    for (const f of ['methodPick', 'factorialMeaning', 'permCancel', 'combPick']) for (let s = 1; s <= 400; s++) {
      const it = GEN[f]!(rng(s * 3 + 1), s);
      const vals = it.choices!.map(evalChoice);
      expect(vals.every(v => v !== null), `${f}: ${it.choices!.join(' | ')}`).toBe(true);
      const right = vals[(it.answer as { i: number }).i];
      expect(vals.filter(v => v === right).length, `${f}: ${it.choices!.join(' | ')}`).toBe(1);
    }
  });
  it('choice items whose choices are outcomes: exactly one forbidden / missing / double-counted', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GEN.sameCup!(rng(s * 23 + 1), s);
      const given = it.prompt.match(/same cup<\/b> as (.*)\?$/)![1]!.split(', ').sort().join();
      expect(it.choices!.filter(c => c.split(', ').sort().join() === given).length, it.prompt).toBe(1);
      const d = GEN.doubleCount!(rng(s * 23 + 2), s);
      const sen = d.prompt.match(/Seniors: (.*?)\. Juniors/)![1]!.split(/, | and /);
      expect(d.choices!.filter(c => c.split(/, | and /).filter(x => sen.includes(x)).length >= 2).length, d.prompt).toBe(1);
    }
  });
});

describe('counting: every practice picture lays out', () => {
  it('CountPic builds for every item (estimated text widths)', () => {
    const g = globalThis as { document?: unknown };
    const had = g.document;
    g.document = { createElement: () => ({ getContext: () => null }) };
    try {
      for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
        const it = GEN[f]!(rng(s * 29 + 3), s, p.id);
        const pics = ((it.picture as { pics?: CPic[] } | undefined)?.pics ?? []);
        const h = (940 - 30 * (pics.length - 1)) / Math.max(1, pics.length);
        pics.forEach((pc, i) => { expect(() => CountPic(pc, frame(50, 70 + i * (h + 30), 1140, h), dusk), `${f}: ${JSON.stringify(pc).slice(0, 160)}`).not.toThrow(); });
      }
    } finally { g.document = had; }
  });
});
