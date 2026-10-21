// lesson-choose-the-form: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/choose-the-form/items';
import { PLAN } from '../src/lesson/topics/choose-the-form/plan';
import { type FormItem, MC } from '../src/lesson/topics/choose-the-form/items';
import { decRat, decStr, digitKey, money, pctOfCents, pctRat, pctStr, rat, rEq, roundRat, terminates } from '../src/lesson/topics/choose-the-form/formMaths';
import { LINES as SCRIPT } from '../src/lesson/topics/choose-the-form/script';
import { formLineLayout } from '../src/lesson/topics/choose-the-form/FormLine';
import { MF } from '../src/lesson/runtime/stage';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.fractions.choose-calculation-form-fractions.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('choose-the-form: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('choose-the-form: families', () => {
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

// ---------- topic checks: the exact maths, the misconception probes, the pictures, the voice lines ----------
type It = import('../src/lesson/runtime/item').Item;
type Resp = import('../src/lesson/runtime/item').Response;

describe('choose-the-form: formMaths', () => {
  it('names one number three ways, exactly', () => {
    expect(decStr(rat(3, 8))).toBe('0.375');
    expect(pctStr(rat(1, 8))).toBe('12.5%');
    expect(pctStr(rat(3, 2))).toBe('150%');
    expect(decStr(pctRat('7.5'))).toBe('0.075');
    expect(rEq(decRat('0.25'), rat(1, 4))).toBe(true);
    expect(terminates(rat(1, 3))).toBe(false);
    expect(() => decStr(rat(1, 3))).toThrow();
    expect(rEq(roundRat(rat(1, 3), 2), rat(33, 100))).toBe(true);
    expect(rEq(roundRat(rat(2, 3), 2), rat(67, 100))).toBe(true);
  });
  it('percent of an amount in exact cents', () => {
    expect(pctOfCents('25', 4800)).toBe(1200);
    expect(pctOfCents('18', 4500)).toBe(810);
    expect(pctOfCents('7.5', 6000)).toBe(450);
    expect(pctOfCents('6', 3550)).toBe(213);
    expect(pctOfCents('7.5', 3999)).toBeNull();
    expect(money(810, true)).toBe('$8.10');
    expect(money(1200)).toBe('$12');
  });
  it('the lesson numbers: both routes agree, Ava misses $9', () => {
    expect(rEq(rat(48, 4), rat(25 * 48, 100))).toBe(true);
    expect(pctOfCents('10', 4500)! + pctOfCents('8', 4500)!).toBe(pctOfCents('18', 4500));
    expect(90000 - 3 * pctOfCents('33', 90000)!).toBe(900);
  });
  it('digit keys of a kid comparing by visible digits', () => {
    expect(digitKey({ kind: 'frac', r: rat(3, 8) })).toBe(8);
    expect(digitKey({ kind: 'dec', s: '0.4' })).toBe(4);
    expect(digitKey({ kind: 'pct', p: '35' })).toBe(35);
  });
});

describe('choose-the-form: misconception probes', () => {
  const probe = (fam: string, sg: string, pickR: (it: It) => Resp | null, mc: string) => {
    let seen = 0;
    for (let s = 1; s <= 300; s++) {
      const it = GEN[fam]!(rng(s * 13 + 1), s, sg);
      const r = pickR(it);
      if (r && it.check(r).mc === mc) seen++;
    }
    return seen;
  };
  const num = (v: number): Resp => ({ kind: 'num', v });
  const pw = (it: It) => { const m = /^([\d.]+)\\%\\text\{ of \} (?:\\\$)?([\d.]+)/.exec(it.board); return m ? { p: Number(m[1]), w: Number(m[2]) } : null; };
  it('p% of W typed as W / p is one-pth, as p W is the bare numeral', () => {
    expect(probe('fractionRoute', 'fraction-form-benchmark', it => { const x = pw(it); return x && x.p !== 10 ? num(x.w / x.p) : null; }, MC.onePth)).toBeGreaterThan(30);
    expect(probe('fractionRoute', 'fraction-form-benchmark', it => { const x = pw(it); return x ? num(x.w * x.p) : null; }, MC.numeral)).toBeGreaterThan(30);
  });
  it('decimal to percent: three places, digits only', () => {
    const toPct = (f: (s: string) => number) => (it: It) => { const m = /^([\d.]+) = \\,\?\\,\\%$/.exec(it.board); return m ? num(f(m[1]!)) : null; };
    expect(probe('decPct', 'decimal-percent-zeros', toPct(s => Number(s) * 1000), MC.thousand)).toBeGreaterThan(20);
    expect(probe('decPct', 'decimal-percent-zeros', toPct(s => Number(s.replace('.', ''))), MC.digitsAcross)).toBeGreaterThan(10);
  });
  it('over 100%: dropping the whole is fraction-must-be-less-than-one', () => {
    expect(probe('over100', 'over-100-percent', it => { const m = /^([\d.]+)\\% = \\,\?$/.exec(it.board); return m && it.input === 'num' ? num((Number(m[1]) % 100) / 100) : null; }, MC.lessThanOne)).toBeGreaterThan(10);
  });
  it('rounding gaps typed as 0 are intermediate-rounding-cannot-change-result', () => {
    expect(probe('roundingGap', 'rounding-effect', () => num(0), MC.midRound)).toBe(300);
  });
  it('every id is in the catalogue, and the sub-goals’ misconceptions are diagnosed', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 7 + 3), s, p.id);
      if (it.choices) it.choices.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
    // typed-answer traps (num items) are probed above; the rest must show up as choice distractors
    const typed = new Set([MC.centsPoint, MC.numeral, MC.thousand, MC.roundPlace, MC.exactThenRound, MC.midRound, MC.calcForm] as string[]);
    for (const sg of TOPIC.subgoals as { id: string; misconceptions: string[] }[]) for (const mc of sg.misconceptions) {
      if (!typed.has(mc)) expect(seen.has(mc), `${sg.id}: ${mc}`).toBe(true);
    }
  });
});

describe('choose-the-form: pictures and voice', () => {
  // words.ts measures text with a canvas; in node it falls back to a width estimate
  (globalThis as unknown as { document?: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };
  it('every practice picture lays out inside the frame and hides the answer', () => {
    let n = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 5 + 2), s, p.id) as FormItem;
      const pic = it.picture?.form;
      if (!pic) continue;
      n++;
      const L = formLineLayout(pic.line, MF);
      for (const t of [...L.tops, ...L.bots]) { expect(t.b.x0, it.prompt).toBeGreaterThanOrEqual(MF.x); expect(t.b.x1, it.prompt).toBeLessThanOrEqual(MF.x + MF.w); }
      for (const st of pic.solve) expect(pic.pre.includes(st), `${it.id}: ${st} shown before the answer`).toBe(false);
      pic.line.top.forEach((t, i) => { if (t.col === 'link') expect(pic.pre.includes('top' + i), it.id).toBe(false); });
    }
    expect(n).toBeGreaterThan(200);
  });
  it('voice: every panel line has a spoken text with no digits or symbols, and lines.json matches', () => {
    const json = JSON.parse(fs.readFileSync('pages/lessons/choose-the-form/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(json).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(SCRIPT)) {
      expect(json[id]!.text, id).toBe(l.say);
      expect(/[0-9$%×÷=/<>]/.test(l.say), `${id}: ${l.say}`).toBe(false);
    }
    const page = fs.readFileSync('pages/lessons/choose-the-form.ts', 'utf8');
    for (const m of page.matchAll(/voiced(?:Fb)?\('([a-z.0-9]+)'/g)) expect(SCRIPT[m[1]!], m[1]).toBeDefined();
  });
});
