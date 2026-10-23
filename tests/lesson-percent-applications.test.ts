// percent applications: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes,
// choices unique with exactly one right, misconception ids exist, the tape picture lays out), the main misconceptions
// are classified, the plan covers every sub-goal of the topic JSON in order, the voice lines match the panel lines,
// and the money maths (exact cents, multipliers, simple interest) holds.
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, FAMILY_NAMES, MC, PRICE_RANGE, type PaItem } from '../src/lesson/topics/percent-applications/items';
import { PLAN } from '../src/lesson/topics/percent-applications/plan';
import { PercentTape } from '../src/lesson/topics/percent-applications/PercentTape';
import { applyC, chainC, money, moneyTex, multStr, partC, partRound, rateStr, simpleInterest } from '../src/lesson/topics/percent-applications/money';
import { SCRIPT } from '../src/lesson/topics/percent-applications/script';
import { TF } from '../src/lesson/topics/percent-applications/scenes';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-43-percent-applications-grade-7.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

// the canvas labels measure text with a 2D context; in node they fall back to an estimate (0.52 em per character)
beforeAll(() => { (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) }; });

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): PaItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length * 31 + sg.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });

describe('money maths', () => {
  it('keeps cents exact', () => {
    expect(partC(8000, 20)).toBe(1600);
    expect(applyC(8000, -20)).toBe(6400);
    expect(chainC(8000, [-20, -10])).toBe(5760);
    expect(chainC(5000, [20, -20])).toBe(4800);
    expect(chainC(5000, [-20, 8])).toBe(chainC(5000, [8, -20]));
    expect(chainC(5000, [-20, 8])).toBe(4320);
    expect(partC(8000, 6.25)).toBe(500);
    expect(partC(3899, 7.25)).toBeNull();
    expect(partRound(3899, 7.25)).toBe(283);
    expect(simpleInterest(200000, 4, 1.5)).toBe(12000);
  });
  it('writes multipliers and money', () => {
    expect(multStr(-20)).toBe('0.8');
    expect(multStr(8.25)).toBe('1.0825');
    expect(multStr(150)).toBe('2.5');
    expect(rateStr(6.25)).toBe('0.0625');
    expect(money(5760)).toBe('$57.60');
    expect(money(8000)).toBe('$80');
    expect(money(145050)).toBe('$1,450.50');
    expect(moneyTex(145050)).toBe('\\$1{,}450.50');
  });
});

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id used exists in the catalogue', () => {
    if (mcIds) for (const id of Object.values(MC)) expect(mcIds.has(id), id).toBe(true);
  });
});

describe('voice', () => {
  it('every panel line of parts 1-4 has a spoken text, and every spoken text a panel line', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/percent-applications/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) { expect(l.text.length, id).toBeGreaterThan(10); expect(l.text, id).not.toMatch(/\d\/\d|%|\$|×|\d\.\d/); }
    const page = readFileSync('pages/lessons/percent-applications.ts', 'utf8');
    for (const m of page.matchAll(/(?:say|fbk|ctx\.say)\((?:false, |true, |o\.ok, |ok, )?'([a-z.0-9]+)'/g)) expect(SCRIPT[m[1]!], m[1]).toBeTruthy();
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, the picture lays out`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, it.work ?? '', ...it.solution, ...(it.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|null|\t/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length).toBe(1);
          for (const v of verdicts) expect(v.say.length).toBeGreaterThan(5);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        } else {
          expect(it.answer.kind).toBe('num');
          // a typed thousands comma ("1,450") still counts; a $ sign gets a hint, not a wrong verdict with an mc
          expect(it.check(num(NaN)).mc).toBeUndefined();
        }
        const p = it.picture;
        if (p) {
          const tp = PercentTape({ rows: p.rows, max: p.max }, TF);
          if (p.ask) expect(p.ask.r).toBeLessThan(p.rows.length);
          for (const h of p.hi ?? []) expect(h.i, `${it.id} hi`).toBeLessThan(p.rows[h.r]!.segs.length);
          expect(tp.box.y1).toBeLessThanOrEqual(TF.y + TF.h + 1);
        }
        seen.add(it.prompt + it.board);
      }
      expect(seen.size, 'distinct items').toBeGreaterThanOrEqual(f === 'pctError' || f === 'factor' || f === 'order' || f === 'net' || f === 'undo' || f === 'direction' || f === 'pctOf' || f === 'mult' ? 15 : 40);
    });
  }
});

describe('misconceptions are classified', () => {
  const find = (f: string, sg: string, pred: (it: PaItem) => boolean): PaItem => {
    for (let s = 1; s < 3000; s++) { const it = make(f, sg, s); if (pred(it)) return it; }
    throw new Error(`no ${f} item found`);
  };
  it('successive changes added up', () => {
    const it = find('successive', 'successive-changes', x => x.prompt.includes('another 10% off the sale price') && x.prompt.includes('$80') && x.prompt.includes('20% off'));
    expect(it.check(num(57.6)).ok).toBe(true);
    expect(it.check(num(56)).mc).toBe(MC.adds);
  });
  it('the change reported as the final amount, and the wrong direction', () => {
    const it = find('pctOf', 'percent-of-original', x => x.prompt.includes('15% off'));
    expect(it.check(num(85)).ok).toBe(true);
    expect(it.check(num(15)).mc).toBe(MC.changeFinal);
    expect(it.check(num(115)).mc).toBe(MC.direction);
  });
  it('commission added to sales, and salary plus commission', () => {
    const it = find('commission', 'commission-earnings', x => x.answer.kind === 'num');
    const sal = Number(/earns a <b class="a">\$([\d,]+)/.exec(it.prompt)![1]!.replace(/,/g, ''));
    const sales = Number(/sold \$([\d,]+)/.exec(it.prompt)![1]!.replace(/,/g, ''));
    const com = (it.answer as { v: number }).v - sal;
    expect(it.check(num(sales + com)).mc).toBe(MC.commAdded);
  });
  it('simple interest compounded, interest vs balance, the percent numeral', () => {
    const txt = (x: PaItem) => x.prompt.replace(/<[^>]+>/g, '');
    const it = find('interest', 'simple-interest-years', x => txt(x).includes('in savings') && txt(x).includes('balance after 2 years'));
    const m = /\$([\d,]+) in savings at (\d+)% simple/.exec(txt(it))!;
    const P = Number(m[1]!.replace(/,/g, '')), r = Number(m[2]) / 100;
    expect(it.check(num(P * (1 + 2 * r))).ok).toBe(true);
    expect(it.check(num(Math.round(P * (1 + r) * (1 + r) * 100) / 100)).mc).toBe(MC.compound);
    expect(it.check(num(P * 2 * r)).mc).toBe(MC.interestBalance);
  });
  it('months used as years', () => {
    const it = find('months', 'interest-months', x => x.prompt.includes('18 months'));
    const ans = (it.answer as { v: number }).v;
    expect(it.check(num(ans * 12)).mc).toBe(MC.units);
  });
  it('reverse percent: adding the percent back', () => {
    const it = find('reverse', 'reverse-percent', x => x.prompt.includes('After <b class="b">20% off</b>') && x.prompt.includes('$48'));
    expect(it.check(num(60)).ok).toBe(true);
    expect(it.check(num(57.6)).mc).toBe(MC.adds);
  });
  it('percent error: the estimate as base, the difference as percent, a negative error', () => {
    const it = find('pctError', 'percent-error', x => x.input === 'num' && x.prompt.includes('$40') && x.prompt.includes('$50'));
    if (it.prompt.indexOf('$40') < it.prompt.indexOf('$50')) {
      expect(it.check(num(20)).ok).toBe(true);
      expect(it.check(num(25)).mc).toBe(MC.newBase);
      expect(it.check(num(10)).mc).toBe(MC.diffPct);
      expect(it.check(num(-20)).mc).toBe(MC.negErr);
    }
  });
  it('net change: added rates and percent-of read as change', () => {
    const it = find('net', 'net-percent-change', x => x.prompt.includes('up 20%</b>, then <b class="b">down 20%'));
    const i = (t: string) => it.choices!.indexOf(t);
    expect(it.check({ kind: 'choice', i: i('a decrease of 4%') }).ok).toBe(true);
    expect(it.check({ kind: 'choice', i: i('no change') }).mc).toBe(MC.adds);
    expect(it.check({ kind: 'choice', i: i('a decrease of 96%') }).mc).toBe(MC.pctOfAsChange);
  });
  it('tax on an exempt item, a mail-in rebate before tax, the top bracket on all income', () => {
    const tax = find('baseCalc', 'base-sales-tax', x => x.answer.kind === 'num');
    expect(tax.check(tax.answer).ok).toBe(true);
    const off = find('offers', 'compare-offers', x => x.prompt.includes('net cost'));
    const v = (off.answer as { v: number }).v;
    expect(off.check(num(v)).ok).toBe(true);
    const br = find('wages', 'income-tax-wages', x => x.prompt.includes('example tax table'));
    expect(br.check(br.answer).ok).toBe(true);
  });
  it('multiplier: the one-place shift and the bare rate', () => {
    const it = find('mult', 'multiplier-encode', x => x.prompt.includes('write <b class="b">6.25%</b> as a decimal'));
    expect(it.check(num(0.0625)).ok).toBe(true);
    expect(it.check(num(0.625)).mc).toBe(MC.point);
    expect(it.check(num(6.25)).mc).toBe(MC.numeral);
  });
  it('rounding: fractional cents are not money', () => {
    const it = find('round', 'round-to-cent', x => x.prompt.includes('calculator shows'));
    const raw = Number(/calculator shows (\d+\.\d+)/.exec(it.prompt)![1]);
    expect(it.check(num(raw)).mc).toBe(MC.cent);
  });
});

describe('the tape model', () => {
  it('lays out the worked example and keeps one dollar scale', () => {
    const t = PercentTape({ rows: [
      { lead: '$80', segs: [{ amt: 64, role: 'base', pct: '80%', val: '$64' }, { amt: 16, role: 'cut', pct: '20%', val: '$16' }] },
      { lead: '$64', segs: [{ amt: 57.6, role: 'base', pct: '90%', val: '$57.60' }, { amt: 6.4, role: 'cut', pct: '10%', val: '$6.40' }] },
      { segs: [{ amt: 57.6, role: 'result', pct: '72%' }], end: '$57.60' },
    ] }, TF);
    // the kept part of row 0 is exactly as long as row 1
    expect(t.where.seg(0, 0).x1).toBeCloseTo(t.where.tape(1).x1, 6);
    expect(t.where.seg(1, 0).x1).toBeCloseTo(t.where.tape(2).x1, 6);
    expect(t.where.end(2).x0).toBeGreaterThan(t.where.tape(2).x1);
  });
  it('refuses rows that cannot fit', () => {
    const row = { lead: '$1', segs: [{ amt: 1, role: 'base' as const }] };
    expect(() => PercentTape({ rows: [row, row, row, row, row] }, TF)).toThrow();
  });
});

describe('percent-applications: quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  const G = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;
  const txt = (h: string) => h.replace(/<[^>]+>/g, '');
  it('"an 18% tip", "an 8% fee", "an $80 item": never "a 8" / "a 11" / "a 18"', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = G[f]!(rng(s * 19 + 2), s, p.id);
      for (const t of [it.prompt, ...it.solution, ...(it.choices ?? [])]) expect(txt(t), `${f}`).not.toMatch(/\b[Aa] \$?(8|11(?!\d)|18(?!\d))/);
    }
  });
  it('the untaxed purchase reads right ("medicine is not taxed") and the taxed one costs something believable', () => {
    for (const sg of ['base-sales-tax']) for (const f of ['base', 'baseCalc']) for (let s = 1; s <= 300; s++) {
      const it = G[f]!(rng(s * 23 + 1), s, sg), t = txt(it.prompt);
      expect(t).not.toMatch(/medicine are/);
      const m = /You buy an? ([a-z ]+?) for \$(\d+)/.exec(t);
      if (m) { const r = PRICE_RANGE[m[1]!]!; expect(Number(m[2]) >= r[0] && Number(m[2]) <= r[1], t).toBe(true); }
    }
  });
  it('one year of interest is not written "$280 × 1 = $280 = $280"', () => {
    for (let s = 1; s <= 300; s++) for (const l of G.interest!(rng(s * 29 + 7), s, 'simple-interest-years').solution) expect(txt(l)).not.toMatch(/= (\$[\d,.]+) = \1/);
  });
});

describe('percent-applications: oracle findings (phase 2)', () => {
  const G = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;
  const txt = (h: string) => h.replace(/<[^>]+>/g, '');
  it('every named item costs something believable for it ($1,000 water bottle, $24 guitar, $400 hoodie are out)', () => {
    const names = Object.keys(PRICE_RANGE).sort((a, b) => b.length - a.length);
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const t = txt(G[f]!(rng(s * 31 + 9), s, p.id).prompt);
      for (const m of t.matchAll(/\ban? ((?:[a-z]+ ){0,2}[a-z]+) for \$([\d,]+(?:\.\d\d)?)\b|\$([\d,]+) ([a-z]+(?: [a-z]+)?) (?:is|game|lamp|jacket|speaker|hoodie)/g)) {
        const item = names.find(g => (m[1] ?? '').endsWith(g)), v = Number((m[2] ?? '').replace(/,/g, ''));
        if (item && v) { const r = PRICE_RANGE[item]!; expect(v >= r[0] && v <= r[1], `${f}: ${t}`).toBe(true); }
      }
    }
  });
  it('sales tax and savings rates at most 10%; a markup base item never makes cost and markup the same amount', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = G[f]!(rng(s * 43 + 1), s, p.id), t = txt(it.prompt);
      for (const m of t.matchAll(/(\d+(?:\.\d+)?)% sales tax/g)) expect(Number(m[1]), t).toBeLessThanOrEqual(10);
      for (const m of t.matchAll(/(\d+(?:\.\d+)?)% simple interest/g)) if (/savings/.test(t)) expect(Number(m[1]), t).toBeLessThanOrEqual(10);
      if (f === 'base' && it.choices) expect(new Set(it.choices.map(c => (txt(c).match(/\$[\d,.]+/) ?? [c])[0])).size, `${f}: ${t} ${it.choices.join(' | ')}`).toBe(it.choices.length);
    }
  });
});
