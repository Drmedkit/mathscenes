// lesson-simple-interest: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/simple-interest/items';
import { PLAN } from '../src/lesson/topics/simple-interest/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.ratios.calculate-simple-interest.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('simple-interest: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('simple-interest: families', () => {
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
import { frame } from '../src/blocks/block';
import { MC, type SIPicture } from '../src/lesson/topics/simple-interest/items';
import { LINES } from '../src/lesson/topics/simple-interest/script';
import { tapeLayout, tapeMaths, type TapeParams } from '../src/lesson/topics/simple-interest/InterestTape';
import { cents, exactCents, interestU, multDec, pct, rateDec, roundHalfUp, schedule, truncCents, unitsStr, usd, yearsDec } from '../src/lesson/topics/simple-interest/interestMaths';

const num = (v: number): Response => ({ kind: 'num', v });
const mk = (f: string, sg: string, s: number): Item => GEN[f]!(rng(s * 31 + 7), s, sg);
const MFD = frame(60, 70, 900, 940);
const plainOf = (it: Item) => it.prompt.replace(/<[^>]+>/g, '');
const ansV = (it: Item) => (it.answer as { v: number }).v;
const ansI = (it: Item) => (it.answer as { i: number }).i;

describe('simple-interest: maths', () => {
  it('gives the exact-cent pairs of the topic JSON', () => {
    const one: [number, number, number][] = [[125000, 350, 4375], [125000, 250, 3125], [84040, 250, 2101], [240000, 80, 1920], [125000, 80, 1000], [84050, 1200, 10086], [120000, 350, 4200]];
    for (const [P, bp, I] of one) expect(cents(P, bp), `${P} ${bp}`).toBe(I);
    expect(cents(150000, 400, 36)).toBe(18000); expect(cents(250000, 350, 48)).toBe(35000); expect(cents(80000, 250, 72)).toBe(12000);
    expect(cents(240000, 500, 6)).toBe(6000); expect(cents(120000, 300, 9)).toBe(2700); expect(cents(80000, 450, 18)).toBe(5400);
    expect(80000 + cents(80000, 600)).toBe(84800); expect(125000 + cents(125000, 400)).toBe(130000); expect(120000 + cents(120000, 250)).toBe(123000);
  });
  it('rounds to the cent halves up, and knows the exact value', () => {
    expect([roundHalfUp(interestU(12345, 300)), truncCents(interestU(12345, 300)), exactCents(12345, 300)]).toEqual([370, 370, null]);
    expect(roundHalfUp(interestU(84050, 225))).toBe(1891);
    expect([roundHalfUp(interestU(25050, 300)), truncCents(interestU(25050, 300))]).toEqual([752, 751]);
    expect([unitsStr(interestU(12345, 300)), unitsStr(interestU(84050, 225)), unitsStr(interestU(25050, 300))]).toEqual(['3.7035', '18.91125', '7.515']);
  });
  it('builds simple and compound schedules (the curated compound pairs stay whole cents)', () => {
    expect(schedule(100000, 1000, 3, 'compound').map(r => r.balance)).toEqual([100000, 110000, 121000, 133100]);
    expect(schedule(20000, 1000, 3, 'compound').map(r => r.balance)).toEqual([20000, 22000, 24200, 26620]);
    expect(schedule(40000, 500, 3, 'compound').map(r => r.balance)).toEqual([40000, 42000, 44100, 46305]);
    expect(schedule(80000, 500, 3, 'compound').map(r => r.balance)).toEqual([80000, 84000, 88200, 92610]);
    expect(schedule(200000, 500, 3, 'compound').map(r => r.balance)).toEqual([200000, 210000, 220500, 231525]);
    expect(schedule(200000, 500, 3, 'simple').map(r => r.balance)).toEqual([200000, 210000, 220000, 230000]);
    // the gap: 0 after year 1, then $5, then $15.25
    const s = schedule(200000, 500, 3, 'simple'), c = schedule(200000, 500, 3, 'compound');
    expect(s.map((r, i) => c[i]!.balance - r.balance)).toEqual([0, 0, 500, 1525]);
    expect(() => schedule(100000, 500, 3, 'compound')).toThrow();
  });
  it('formats rates, multipliers, years and money', () => {
    expect([pct(350), pct(80), pct(225), pct(1200)]).toEqual(['3.5', '0.8', '2.25', '12']);
    expect([rateDec(350), rateDec(80), rateDec(1200)]).toEqual(['0.035', '0.008', '0.12']);
    expect([multDec(600), multDec(250)]).toEqual(['1.06', '1.025']);
    expect([yearsDec(6), yearsDec(9), yearsDec(18), yearsDec(30), yearsDec(3)]).toEqual(['0.5', '0.75', '1.5', '2.5', '0.25']);
    expect([usd(129375), usd(200000), usd(231525)]).toEqual(['$1,293.75', '$2,000', '$2,315.25']);
  });
});

describe('simple-interest: pictures fit the frame', () => {
  it('the lesson tapes', () => {
    for (const p of [{ P: 200000, bp: 500, years: 3 }, { P: 150000, bp: 400, years: 3, loan: true }, { P: 100000, bp: 1000, years: 3 }] as TapeParams[]) {
      const L = tapeLayout(p, tapeMaths(p), MFD);
      // the question / example and Alex's proof need the compound rows (the cards and the morph)
      if (p.P !== 150000) expect(L.compound, 'compound rows exist for the lesson pairs').not.toBeNull();
    }
  });
  it('every practice picture (all families x 300 seeds)', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 300; s++) {
      const it = mk(f, p.id, s), pic = it.picture as SIPicture | undefined;
      if (pic?.table) for (const r of [...pic.table.rows, ...(pic.table.solved ?? [])]) expect(r.length === 0 || r.length === 3, f).toBe(true);
      if (!pic?.tape) continue;
      expect(() => tapeLayout(pic.tape!, tapeMaths(pic.tape!), MFD), `${f} ${s} ${JSON.stringify(pic.tape)}`).not.toThrow();
      const n = pic.tape.months !== undefined ? Math.ceil(pic.tape.months / 12) : pic.tape.years ?? 1;
      for (const st of [...pic.pre, ...pic.post]) if (/^y\d+$/.test(st)) expect(Number(st.slice(1)), `${f} ${st}`).toBeLessThanOrEqual(n);
    }
  });
});

describe('simple-interest: diagnosis', () => {
  it('every misconception id is in the catalog', () => { for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true); });
  const probe = (f: string, sg: string, wrong: (it: Item) => Response | null, mc: string) => {
    let hits = 0;
    for (let s = 1; s <= 120; s++) {
      const it = mk(f, sg, s), r = wrong(it);
      if (!r) continue;
      const v = it.check(r);
      expect(v.ok, `${f} ${it.prompt}`).toBe(false);
      if (v.mc === mc) hits++;
    }
    expect(hits, `${f} -> ${mc}`).toBeGreaterThan(20);
  };
  /** the first wrong choice the classifier tags with this id */
  const choiceTagged = (mc: string) => (it: Item): Response | null => { const i = it.choices!.findIndex((_, k) => k !== ansI(it) && it.check({ kind: 'choice', i: k }).mc === mc); return i >= 0 ? { kind: 'choice', i } : null; };
  const rateOf = (it: Item) => /(\d+(?:\.\d+)?)%/.exec(plainOf(it))![1]!;
  it('the main slips are classified', () => {
    probe('oneYear', 'interest-friendly', it => num(Number(rateOf(it))), MC.fixed);
    probe('decInterest', 'interest-decimal-rates', it => num(ansV(it) * 10), MC.point);
    probe('endBalance', 'new-balance', it => num(Number(/interest(?: for the year)? is \$([\d,]+(?:\.\d\d)?)/.exec(plainOf(it))![1]!.replace(/,/g, ''))), MC.changeFinal);
    probe('multValue', 'balance-multiplier', it => (/multiplier/.test(it.prompt) ? num(Number('1.' + rateOf(it).replace('.', ''))) : null), MC.appends);
    probe('formulaI', 'simple-interest-formula', it => { const m = /for (\d+) years|(\d+)-year/.exec(plainOf(it))!; return num(ansV(it) / Number(m[1] ?? m[2])); }, MC.omitsTime);
    probe('formulaTotal', 'simple-interest-formula', it => num(ansV(it) - Number(/\$([\d,]+)/.exec(plainOf(it))![1]!.replace(/,/g, ''))), MC.changeFinal);
    probe('monthsI', 'fractional-years', it => num(ansV(it) * 12), MC.units);
    probe('gapGrows', 'compare-simple-compound', it => num(Number(/the gap was \$([\d,.]+)/.exec(plainOf(it))![1]!.replace(/,/g, ''))), MC.gapSmall);
    probe('whoIsP', 'identify-principal', choiceTagged(MC.principal), MC.principal);
    probe('earnOrOwe', 'savings-and-loan-contexts', choiceTagged(MC.borrower), MC.borrower);
    probe('multExpr', 'balance-multiplier', choiceTagged(MC.numeral), MC.numeral);
    probe('pctToDec', 'interest-decimal-rates', choiceTagged(MC.noDiv100), MC.noDiv100);
    probe('roundRule', 'round-to-cent', choiceTagged(MC.inconsistent), MC.inconsistent);
    probe('sameEach', 'simple-multi-year', choiceTagged(MC.compounds), MC.compounds);
    probe('compoundBase', 'compound-year-by-year', choiceTagged(MC.successive), MC.successive);
    probe('saverBorrower', 'compare-simple-compound', choiceTagged(MC.compoundBetter), MC.compoundBetter);
    probe('periodTrap', 'match-rate-period', choiceTagged(MC.units), MC.units);
  });
  it('a table cell worked with the other rule is named (simple <-> compound)', () => {
    const tagged = (it: Item, rule: 'simple' | 'compound', mc: string) => {
      const tp = (it.picture as SIPicture).tape!;
      const rows = schedule(tp.P, tp.bp, tp.years!, rule);
      return rows.some(r => [r.balance, r.interest].some(c => it.check(num(c / 100)).mc === mc));
    };
    let a = 0, b = 0;
    for (let s = 1; s <= 120; s++) {
      if (tagged(mk('tableCell', 'simple-multi-year', s), 'compound', MC.compounds)) a++;
      if (tagged(mk('compoundCell', 'compound-year-by-year', s), 'simple', MC.successive)) b++;
    }
    expect(a).toBeGreaterThan(100); expect(b).toBeGreaterThan(100);
  });
});

describe('simple-interest: voice', () => {
  it('lines.json is the script, spoken without digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/simple-interest/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(/[0-9$%×=+÷<>]/.test(l.text), `${id}: ${l.text}`).toBe(false);
    }
  });
  it('every voice id the page uses is in the script', () => {
    const src = fs.readFileSync('pages/lessons/simple-interest.ts', 'utf8');
    const ids = new Set<string>();
    for (const m of src.matchAll(/'([qetp]\.[a-z0-9]+(?:\.[a-z0-9]+)?)'/g)) if (!/^[qetpx]\.(L\d|F\d|OW|tape|whole|cells|rows|gain|th|gap|fix|gapk|pP|pG|pB|pR1|ring\d|r\d|rp\d|rw\d|[vq]\d\.\d|strike\d|y\d|ldP|ldI|B)$/.test(m[1]!)) ids.add(m[1]!);
    for (const id of ids) expect(LINES[id], id).toBeDefined();
    expect(ids.size).toBeGreaterThan(25);
  });
});

describe('simple-interest: quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  const plainOf = (h: string) => h.replace(/<[^>]+>/g, '');
  it('a loan story never adds a helmet to college books (the extra fact fits any loan)', () => {
    for (let s = 1; s <= 300; s++) expect(GEN.loanRoles!(rng(s * 7 + 1), s).prompt).not.toMatch(/helmet/);
  });
  it('the rounding step names the third digit in words (no "< 5" that reads as a tag)', () => {
    for (let s = 1; s <= 100; s++) {
      const item = GEN.roundI!(rng(s * 11 + 2), s);
      const last = item.solution.at(-1)!;
      expect(plainOf(last), last).toMatch(/^The 3rd digit is \d: /);
      expect(last).not.toMatch(/[<>] ?\d/);
    }
  });
  it('the balance colour is not read as the answer: a principal or interest item ends on its own amount', async () => {
    const { explain } = await import('../src/lesson/topics/simple-interest/explain');
    for (let s = 1; s <= 80; s++) for (const f of ['findP', 'tableCell', 'compoundCell', 'labelBoth', 'formulaI']) {
      const item = GEN[f]!(rng(s * 13 + 5), s);
      expect(explain(item)?.result, `${f}: ${item.prompt}`).toEqual(item.answer);
    }
  });
});

describe('simple-interest: oracle findings (phase 2)', () => {
  it('the one-step expression is never on $100 (there "100 + r" is the balance too: two right choices)', () => {
    for (let s = 1; s <= 600; s++) {
      const it = GEN.multExpr!(rng(s * 13 + 7), s);
      expect(it.prompt.replace(/<[^>]+>/g, ''), it.prompt).not.toMatch(/saves \$100 at/);
    }
  });
});
