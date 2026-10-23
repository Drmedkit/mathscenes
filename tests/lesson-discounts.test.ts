// discounts: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes, choices
// unique with exactly one right, mc ids exist), the main misconceptions are classified, the plan covers every sub-goal
// of the topic JSON in order, the sale maths is exact (discount + sale price = original, rounding policy), and the
// voiced script matches lines.json.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item, type Response } from '../src/lesson/runtime/item';
import { GENS, FAMILY_NAMES, type DiscPicture } from '../src/lesson/topics/discounts/items';
import { PLAN } from '../src/lesson/topics/discounts/plan';
import { LINES, SCRIPT } from '../src/lesson/topics/discounts/script';
import { TICK, digits, dollarSale, mult, percentSale, roundCent, saleRoundingDiscountFirst, toTicks, truncCent, usd } from '../src/lesson/topics/discounts/discountMaths';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.ratios.discounts.json';
const MC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = fs.existsSync(MC) ? new Set((JSON.parse(fs.readFileSync(MC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): Item => GENS[f]!(rng(s * 7919 + f.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const pic = (it: Item) => it.picture as unknown as DiscPicture | undefined;

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENS[f], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENS)));
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, mc ids exist`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t, it.prompt).not.toMatch(/undefined|NaN|Infinity|\$-/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, it.prompt).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        } else if (mcIds) {
          // probe some wrong numbers: every mc the classifier gives must exist
          const a = it.answer;
          const probes: Response[] = a.kind === 'num' ? [num(a.v + 1), num(a.v / 10), num(a.v * 10), num(0)] : a.kind === 'pair' ? [{ kind: 'pair', x: a.y, y: a.x }] : [];
          for (const r of probes) { const v = it.check(r); if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true); }
        }
        const P = pic(it);
        if (P) {
          expect(P.bar.price).toBeGreaterThan(0);
          if (P.bar.pct !== undefined && P.bar.pct !== null) percentSale(P.bar.price, P.bar.pct); else dollarSale(P.bar.price, P.bar.off ?? 0);
          for (const w of P.work) expect(w).not.toMatch(/undefined|NaN/);
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, f).toBeGreaterThan(f === 'bounds' || f === 'whyAgree' || f === 'readSplit' || f === 'judgeSplit' || f === 'pctOrDollars' ? 25 : 40);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  const nums = (s: string) => [...s.matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map(m => Number(m[1]!.replace(/,/g, '')));
  it('discount amount: the sale price, $p, the decimal point', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('discAmt', 'discount-amount', s);
      const p = Number(/(\d+)% off/.exec(it.prompt)![1]), P = nums(it.prompt)[0]!;
      const sale = percentSale(Math.round(P * 100), p), d = sale.discT / TICK;
      if (sale.saleT !== sale.discT) expect(it.check(num(sale.saleT / TICK)).mc).toBe('mc.percent.change-reported-as-final-amount');
      if (p !== d && p !== sale.saleT / TICK) expect(it.check(num(p)).mc).toBe('mc.percent.percent-as-fixed-amount');
      if (d > 0 && d * 10 !== sale.saleT / TICK && d * 10 !== p) expect(it.check(num(d * 10)).mc).toBe('mc.decimals.dollars-cents-point-misplaced');
    }
  });
  it('sale price: the discount, the percent as dollars, adding', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('salePrice', 'subtract-discount', s);
      const p = Number(/(\d+)% off/.exec(it.prompt)![1]), P = nums(it.prompt)[0]!;
      const sale = percentSale(Math.round(P * 100), p);
      if (sale.discT !== sale.saleT) expect(it.check(num(sale.discT / TICK)).mc).toBe('mc.percent.change-reported-as-final-amount');
      expect(it.check(num((sale.origT + sale.discT) / TICK)).mc).toBe('mc.percent.wrong-direction-of-change');
      if (p < P && p * TICK !== sale.discT && (P - p) * TICK !== sale.discT) expect(it.check(num(P - p)).mc).toBe('mc.percent.adds-or-subtracts-percent-numeral');
    }
  });
  it('missing original price: subtracting the two visible numbers', () => {
    let n = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('missing', 'find-missing-amount', s);
      if (!/original price\?/.test(it.prompt)) continue;
      n++;
      const [D, Sp] = nums(it.prompt) as [number, number];
      expect(it.check(num(Math.abs(Sp - D))).mc).toBe('mc.equal-sign.always-subtracts-visible-numbers-for-unknown');
    }
    expect(n).toBeGreaterThan(50);
  });
  it('rounding: unrounded, cut off, discount rounded first', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('roundFinal', 'round-to-cent', s);
      const p = Number(/(\d+)% off/.exec(it.prompt)![1]), P = nums(it.prompt)[0]!;
      const sale = percentSale(Math.round(P * 100), p), right = sale.saleRT;
      expect(it.check(num(right / TICK)).ok).toBe(true);
      expect(it.check(num(sale.saleT / TICK)).mc).toBe('mc.estimation.more-digits-more-accurate');
      const tr = truncCent(sale.saleT), first = saleRoundingDiscountFirst(sale);
      if (tr !== right) expect(['mc.decimals.truncates-instead-of-rounding', 'mc.decimals.intermediate-precision-always-invalid']).toContain(it.check(num(tr / TICK)).mc);
      if (first !== right && first !== tr) expect(it.check(num(first / TICK)).mc).toBe('mc.decimals.intermediate-precision-always-invalid');
    }
  });
  it('percent paid: the discount percent, a slip of ten', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('pctPaid', 'percent-paid', s);
      const p = Number(/(\d+)% off/.exec(it.prompt)![1]);
      if (p !== 50) expect(it.check(num(p)).mc).toBe('mc.percent.change-reported-as-final-amount');
      if (100 - p + 10 <= 100 && 100 - p + 10 !== p) expect(it.check(num(110 - p)).mc).toBe('mc.percent.complement-miscomputed');
    }
  });
  it('one step: the discount, subtracting twice, the wrong whole', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('oneStep', 'one-step-remaining', s);
      const p = Number(/(\d+)% off/.exec(it.prompt)![1]), P = nums(it.prompt)[0]!;
      const sale = percentSale(Math.round(P * 100), p);
      const dbl = roundCent(Math.max(0, sale.saleT - sale.discT));
      if (dbl !== sale.saleRT && dbl !== roundCent(sale.discT)) expect(it.check(num(dbl / TICK)).mc).toBe('mc.percent.double-subtracts-discount');
    }
  });
  it('the multiplier for 5% is 0.05, and amounts keep their cents', () => {
    expect(mult(5)).toBe('0.05'); expect(mult(15)).toBe('0.15'); expect(mult(40)).toBe('0.4'); expect(mult(100)).toBe('1'); expect(mult(0)).toBe('0');
    expect(digits(23985)).toBe('2.3985'); expect(digits(179550)).toBe('17.955'); expect(digits(800000, true)).toBe('80.00'); expect(usd(12345600)).toBe('$1,234.56');
    expect(toTicks(2.3985)).toBe(23985); expect(toTicks(17.96)).toBe(179600); expect(toTicks(Number('68.00'))).toBe(680000); expect(toTicks(1.23456)).toBeNull();
  });
});

describe('the sale maths', () => {
  it('discount + sale price = original, exactly, for every whole percent and many prices', () => {
    for (let c = 1; c <= 20000; c += 37) for (let p = 0; p <= 100; p++) {
      const s = percentSale(c, p);
      expect(s.discT + s.saleT).toBe(s.origT);
      expect(s.discT * 100).toBe(s.origT * p);
      expect(s.saleRT % 100).toBe(0);
      expect(Math.abs(s.saleRT - s.saleT)).toBeLessThanOrEqual(50);
    }
  });
  it('the course policy: round only the final price, halves up', () => {
    const s = percentSale(1995, 10);          // $19.95, 10% off: $1.995 off, $17.955 -> $17.96
    expect(s.discT).toBe(19950); expect(s.saleT).toBe(179550); expect(s.saleRT).toBe(179600);
    expect(saleRoundingDiscountFirst(s)).toBe(179500);
    const t = percentSale(1599, 15);          // 0.15 x $15.99 = $2.3985; $13.5915 -> $13.59
    expect(t.discT).toBe(23985); expect(t.saleT).toBe(135915); expect(t.saleRT).toBe(135900);
    expect(percentSale(501, 50).saleRT).toBe(25100);   // 50% off $5.01 is $2.505 -> $2.51
  });
  it('refuses what is not a sale', () => {
    expect(() => percentSale(1000, 101)).toThrow();
    expect(() => percentSale(1000, 12.5)).toThrow();
    expect(() => dollarSale(1000, 1200)).toThrow();
    expect(() => percentSale(0, 10)).toThrow();
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text, and lines.json is the script', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/discounts/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d\s*\/\s*\d|[<>×÷$%]|\d\.\d/);
    }
  });
});

describe('quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  it('regression: checkClaim never claims or offers a sale price of $0.00 or less ("$80 off" a $73 item)', () => {
    for (let s = 1; s <= 2000; s++) {
      const it = GENS.checkClaim!(rng(s), s, 'check-and-correct');
      expect(it.prompt, it.prompt).not.toMatch(/\$0(\.00)?(?![.\d])|−\$/);
      for (const c of it.choices ?? []) expect(c, it.prompt).not.toMatch(/\$0(\.00)?(?![.\d])|−\$/);
    }
  });
  it('the sale-price colour is not read as the answer; saveAndPay marks both boxes', () => {
    const it = GENS.missing!(rng(4), 1, 'find-missing-amount');
    expect(it.solution.join(' ')).not.toMatch(/<b class="s">/);
    const sp = GENS.saveAndPay!(rng(5), 1, 'subtract-discount');
    expect([...sp.solution.at(-1)!.matchAll(/<b class="s">/g)].length).toBe(2);
  });
});
describe('quality layer: grammar', () => {
  it('regression: "A pair of sneakers costs $x and is ...", never "A pair of ... cost ... and are"', () => {
    for (let s = 1; s <= 600; s++) for (const [f, sg] of [['salePrice', 'subtract-discount'], ['oneStep', 'one-step-remaining'], ['partWhole', 'name-sale-amounts']] as const) {
      const it = GENS[f]!(rng(s), s, sg);
      expect(it.prompt, it.prompt).not.toMatch(/^A (pair|set) of \w+ cost\b|^A (pair|set) of .* and are\b/);
    }
  });
});
