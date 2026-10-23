// lesson-sales-tax: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/sales-tax/items';
import { PLAN } from '../src/lesson/topics/sales-tax/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.calculate-sales-tax.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('sales-tax: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('sales-tax: families', () => {
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

// ---------- topic checks: the exact maths, the pictures, the diagnosis, the voice ----------
import { type Item, type Response } from '../src/lesson/runtime/item';
import { MC, type TaxPicture } from '../src/lesson/topics/sales-tax/items';
import { LINES } from '../src/lesson/topics/sales-tax/script';
import {
  U_CENT, budgetMax, multDec, pct, priceFromTax, priceFromTotal, pricesForTax, pricesForTotal, rateDec, rateFrom, roundU,
  salesTax, totalOf, truncU, usd,
} from '../src/lesson/topics/sales-tax/taxMaths';

const num = (v: number): Response => ({ kind: 'num', v });
const mk = (f: string, sg: string, s: number): Item => GEN[f]!(rng(s * 31 + 7), s, sg);
const picOf = (it: Item) => it.picture as unknown as TaxPicture | undefined;

describe('sales-tax: exact maths', () => {
  it('tax, total and the half-up rule', () => {
    expect(salesTax(6000, 8000)).toMatchObject({ tax: 480, total: 6480, exact: true });
    expect(salesTax(4000, 7500)).toMatchObject({ tax: 300, total: 4300 });
    expect(salesTax(1050, 7000)).toMatchObject({ taxU: 7350000, tax: 74, exact: false });     // $0.735 -> $0.74
    expect(salesTax(2400, 7500).tax).toBe(180);
    expect(salesTax(8000, 8250).tax).toBe(660);
    expect(salesTax(6000, 8250).tax).toBe(495);
    expect(salesTax(4000, 6250).tax).toBe(250);
    expect(truncU(7350000)).toBe(73);
  });
  it('working backward from exact receipts', () => {
    expect(rateFrom(5680, 355)).toBe(6250);
    expect(priceFromTax(355, 6250)).toBe(5680);
    expect(priceFromTax(360, 6000)).toBe(6000);
    expect(priceFromTotal(5400, 8000)).toBe(5000);
    expect(priceFromTotal(6035, 6250)).toBe(5680);
    expect(rateFrom(3725, 298)).toBe(8000);
  });
  it('rounded receipts: candidates, ranges and the budget', () => {
    expect(pricesForTotal(2164, 8250)).toEqual([1999]);
    expect(totalOf(1998, 8250)).toBe(2163);
    expect(totalOf(2000, 8250)).toBe(2165);
    expect(pricesForTax(360, 6000)).toEqual([5992, 6008]);
    expect(budgetMax(3000, 6000)).toBe(2830);
    expect(totalOf(2831, 6000)).toBe(3001);
    expect(budgetMax(5000, 8250)).toBe(4619);
    // the total never goes down as the price rises, so a rounded total has at most one price
    for (const r of [4000, 6000, 7250, 8250, 8875, 10000]) for (let p = 1; p < 3000; p++) expect(totalOf(p + 1, r)).toBeGreaterThan(totalOf(p, r));
  });
  it('formats rates, multipliers and money', () => {
    expect(pct(8875)).toBe('8.875'); expect(pct(8000)).toBe('8'); expect(pct(500)).toBe('0.5');
    expect(rateDec(8250)).toBe('0.0825'); expect(rateDec(500)).toBe('0.005'); expect(rateDec(10000)).toBe('0.1');
    expect(multDec(7500)).toBe('1.075'); expect(multDec(8000)).toBe('1.08');
    expect(usd(6480)).toBe('$64.80'); expect(usd(6000, false)).toBe('$60'); expect(usd(123456)).toBe('$1,234.56');
    expect(roundU(50000)).toBe(1);
  });
});

describe('sales-tax: pictures and texts', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: the picture fits the numbers, no broken text`, () => {
      for (let s = 1; s <= 300; s++) {
        const it = mk(f, p.id, s);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t, it.prompt).not.toMatch(/undefined|NaN|Infinity|\$-|null/);
        expect(it.solution.length).toBeGreaterThan(0);
        const P = picOf(it);
        if (!P) continue;
        const t = salesTax(P.tape.price, P.tape.rate);
        expect(t.total).toBeGreaterThanOrEqual(P.tape.price);
        if (P.tape.items) expect(P.tape.items.filter(i => !i.exempt).reduce((a, i) => a + i.cents, 0)).toBe(P.tape.price);
        for (const w of P.work) expect(w).not.toMatch(/undefined|NaN/);
      }
    });
  }
});

describe('sales-tax: misconceptions are diagnosed', () => {
  it('the tax at a whole rate: $p, no ÷ 100, p% as 1/p', () => {
    for (let s = 1; s <= 300; s++) {
      const it = mk('taxAmt', 'tax-whole-rate', s), P = picOf(it)!, t = salesTax(P.tape.price, P.tape.rate), r = P.tape.rate / 1000;
      if (r * 100 !== t.tax) expect(it.check(num(r)).mc).toBe(MC.fixed);
      expect(it.check(num((P.tape.price / 100) * r)).mc).toBe(MC.noDiv100);
      const inv = Math.round(P.tape.price / r);
      if (r !== 10 && inv !== r * 100 && inv !== t.tax && inv !== t.total) expect(it.check(num(inv / 100)).mc).toBe(MC.oneOverP);
    }
  });
  it('the total: the tax alone, the percent as dollars, subtracting, the shelf price', () => {
    for (let s = 1; s <= 300; s++) {
      const it = mk('totalPay', 'total-two-step', s), P = picOf(it)!, t = salesTax(P.tape.price, P.tape.rate);
      if (!t.tax) continue;
      expect(it.check(num(t.tax / 100)).mc).toBe(MC.changeFinal);
      expect(it.check(num((P.tape.price - t.tax) / 100)).mc).toBe(MC.direction);
      expect(it.check(num(P.tape.price / 100)).mc).toBe(MC.shelf);
      if (P.tape.rate / 10 !== t.tax) expect(it.check(num(P.tape.price / 100 + P.tape.rate / 1000)).mc).toBe(MC.numeral);
    }
  });
  it('rounding: cut off, all the digits, the rate rounded first', () => {
    for (let s = 1; s <= 300; s++) {
      const it = mk('roundTax', 'round-to-cent', s), P = picOf(it)!, t = salesTax(P.tape.price, P.tape.rate);
      expect(it.check(num(truncU(t.taxU) / 100)).mc).toBe(MC.trunc);
      expect(it.check(num(t.taxU / (100 * U_CENT))).mc).toBe(MC.digits);
      const early = salesTax(P.tape.price, Math.round(P.tape.rate / 1000) * 1000).tax;
      if (P.tape.rate % 1000 && early !== t.tax && early !== truncU(t.taxU)) expect(it.check(num(early / 100)).mc).toBe(MC.early);
    }
  });
  it('working backward: multiplying by the rate, dividing by the rate, the opposite percent', () => {
    for (let s = 1; s <= 300; s++) {
      const a = mk('priceFromTax', 'price-from-tax', s), A = picOf(a)!, ta = salesTax(A.tape.price, A.tape.rate);
      expect(a.check(num(ta.tax * A.tape.rate / 1e7)).mc).toBe(MC.multNotDiv);
      const b = mk('priceFromTotal', 'price-from-total', s), B = picOf(b)!, tb = salesTax(B.tape.price, B.tape.rate);
      expect(b.check(num(tb.total / 100 / (B.tape.rate / 100000))).mc).toBe(MC.divRate);
      const opp = Math.round(tb.total * (1 - B.tape.rate / 100000));
      if (Math.abs(opp - (tb.total - B.tape.rate / 10)) > 1) expect(b.check(num(opp / 100)).mc).toBe(MC.opposite);
    }
  });
  it('the rate: dividing by the total (the wrong base)', () => {
    for (let s = 1; s <= 300; s++) {
      const it = mk('findRate', 'rate-from-receipt', s), P = picOf(it)!, t = salesTax(P.tape.price, P.tape.rate);
      expect(it.check(num(Math.round((t.tax / t.total) * 10000) / 100)).mc).toBe(MC.newBase);
    }
  });
  it('the multiplier: the rate alone, appended digits, under 1', () => {
    for (let s = 1; s <= 300; s++) {
      const it = mk('multiplier', 'total-multiplier', s), r = picOf(it)!.tape.rate, d = r / 100000;
      expect(it.check(num(d)).mc).toBe(MC.changeFinal);
      const ap = Number('1.' + pct(r).replace('.', ''));
      if (Math.abs(ap - 1 - d) > 1e-9) expect(it.check(num(ap)).mc).toBe(MC.append);
      expect(it.check(num((1 + d) / 10)).mc).toBe(MC.lessThanOne);
    }
  });
  it('the budget: always rounding up or always cutting off', () => {
    let up = 0, cut = 0;
    for (let s = 1; s <= 300; s++) {
      const it = mk('budgetMax', 'budget-max-price', s);
      const m = /have <b class="s(?: tot)?">\$([\d,.]+)<\/b> to spend, and the sales tax is <b class="b">([\d.]+)%/.exec(it.prompt)!;
      const budget = Math.round(Number(m[1]!.replace(/,/g, '')) * 100), rate = Math.round(Number(m[2]) * 1000);
      const best = budgetMax(budget, rate), q = Math.floor((budget * 100000) / (100000 + rate));
      expect(it.check(num(best / 100)).ok).toBe(true);
      if (q === best) { up++; expect(it.check(num((q + 1) / 100)).mc).toBe(MC.fixedRound); } else { cut++; expect(it.check(num(q / 100)).mc).toBe(MC.fixedRound); }
    }
    expect(up).toBeGreaterThan(50); expect(cut).toBeGreaterThan(50);
  });
  it('every misconception the topic JSON names is produced by some family', () => {
    const produced = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = mk(f, p.id, s);
      if (it.choices) it.choices.forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) produced.add(v.mc); });
      else {
        const P = picOf(it);
        const probes: number[] = [];
        if (P) {
          const t = salesTax(P.tape.price, P.tape.rate), r = P.tape.rate / 1000;
          probes.push(r, (P.tape.price / 100) * r, Math.round(P.tape.price / r) / 100, truncU(t.taxU) / 100, t.taxU / (100 * U_CENT), t.tax * P.tape.rate / 1e7, (1 + r / 100) / 10, salesTax(P.tape.price, Math.round(P.tape.rate / 1000) * 1000).tax / 100);
        }
        const m = /have <b class="s(?: tot)?">\$([\d,.]+)<\/b> to spend, and the sales tax is <b class="b">([\d.]+)%/.exec(it.prompt);
        if (m) { const b = Math.round(Number(m[1]!.replace(/,/g, '')) * 100), r = Math.round(Number(m[2]) * 1000), q = Math.floor((b * 100000) / (100000 + r)); probes.push(q / 100, (q + 1) / 100); }
        for (const v of probes) { const c = it.check(num(v)); if (c.mc) produced.add(c.mc); }
      }
    }
    const want = new Set<string>(TOPIC.subgoals.flatMap((s: { misconceptions: string[] }) => s.misconceptions));
    for (const id of produced) expect(CATALOG.has(id), id).toBe(true);
    for (const id of want) expect(produced.has(id), id).toBe(true);
  });
});

describe('sales-tax: voice', () => {
  it('lines.json is the script, spoken without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/sales-tax/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text, id).not.toMatch(/[0-9$%×÷=<>]/);
    }
  });
  it('every voice id the page says or shows has a line', () => {
    const page = fs.readFileSync('pages/lessons/sales-tax.ts', 'utf8');
    const ids = new Set([...page.matchAll(/(?:vline|fbv\((?:true|false|o\.ok|right), |say|sayThen)\(?'([qetp]\.[a-z0-9-]+)'/g)].map(m => m[1]!));
    for (const m of page.matchAll(/id: '([qetp]\.[a-z0-9-]+)'/g)) ids.add(m[1]!);
    for (const m of page.matchAll(/cb: '([qetp]\.[a-z0-9-]+)'/g)) ids.add(m[1]!);
    expect(ids.size).toBeGreaterThan(20);
    for (const id of ids) expect(LINES[id], id).toBeDefined();
  });
});

describe('sales-tax: quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  it('the total colour is not read as the answer: a pre-tax price item ends on the price, not the total', async () => {
    const { explain } = await import('../src/lesson/topics/sales-tax/explain');
    for (let s = 1; s <= 80; s++) for (const f of ['missingAmt', 'priceFromTotal', 'priceFromTax', 'budgetMax']) {
      const item = GEN[f]!(rng(s * 13 + 5), s);
      expect(explain(item)?.result, `${f}: ${item.prompt}`).toEqual(item.answer);
    }
  });
  it('"an 8%" and "an 11%", never "a 8%"', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const item = GEN[f]!(rng(s * 17 + 3), s, p.id);
      expect(item.prompt.replace(/<[^>]+>/g, ''), `${f}`).not.toMatch(/\ba (8|11|18)(\.\d+)?%/);
    }
  });
});

describe('sales-tax: oracle findings (phase 2)', () => {
  const txt = (h: string) => h.replace(/<[^>]+>/g, '');
  it('no $100 pre-tax price in the plan / division / subtract-fails items ("add $r", "total − $r", "take $r off" would be right too)', () => {
    for (const f of ['planTotal', 'whichDivision', 'subtractFails']) for (let s = 1; s <= 600; s++) {
      const p = txt(GEN[f]!(rng(s * 37 + 11), s).prompt);
      const m = /marked \$([\d,.]+), with an? ([\d.]+)%/.exec(p) ?? /total (?:of|was) \$([\d,.]+) (?:includes an? |with )([\d.]+)%/.exec(p);
      expect(m, p).not.toBeNull();
      const v = Number(m![1]!.replace(/,/g, '')), r = Number(m![2]);
      const price = f === 'planTotal' ? v : v / (1 + r / 100);
      expect(Math.abs(price - 100), p).toBeGreaterThan(0.001);
    }
  });
  it('a rate read as dollars shows cents ("$6.50", never "$6.5"), and "an 8%"', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 80; s++) {
      const it = GEN[f]!(rng(s * 41 + 5), s, p.id);
      for (const t of [it.prompt, ...it.solution, ...(it.choices ?? [])].map(txt)) {
        expect(t, f).not.toMatch(/\$\d+\.\d(?!\d)/);
        expect(t, f).not.toMatch(/\b[Aa] (8|11|18)(\.\d+)?%/);
      }
    }
  });
});
