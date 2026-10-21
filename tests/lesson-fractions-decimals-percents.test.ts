// fractions-decimals-percents: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer
// passes, choices unique with exactly one right, mc ids exist), the main misconceptions are classified, the plan
// covers every sub-goal of the topic JSON in order, the long-division maths is exact (the expansion IS the fraction,
// it terminates exactly for 2-and-5 denominators, the percent re-reads the block), and the script matches lines.json.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { gcd, rng, type Item, type Response } from '../src/lesson/runtime/item';
import { FAMILY_NAMES, GENS, MC, REP, TERM, TRAPS, type FdpPicture } from '../src/lesson/topics/fractions-decimals-percents/items';
import { PLAN } from '../src/lesson/topics/fractions-decimals-percents/plan';
import { LINES, SCRIPT } from '../src/lesson/topics/fractions-decimals-percents/script';
import { cmpFinFrac, decTex, expand, fracFin, longDivide, otherFactors, pctOf, roundFrac } from '../src/lesson/topics/fractions-decimals-percents/fdpMaths';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.fractions.fraction-decimal-percentage-extend.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = fs.existsSync(MCF) ? new Set((JSON.parse(fs.readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): Item => GENS[f]!(rng(s * 7919 + f.length * 31 + sg.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const pic = (it: Item) => it.picture as unknown as FdpPicture | undefined;
const choose = (it: Item, pred: (t: string) => boolean) => it.choices!.findIndex(pred);

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
  it('the number pools are drawable and match their sub-goals', () => {
    expect(TERM.length).toBeGreaterThan(30);
    for (const [n, d] of TERM) { const L = longDivide(n, d); expect(L.stop).toBe('zero'); expect(L.at).toBeLessThanOrEqual(4); }
    expect(REP.length).toBeGreaterThan(30);
    for (const [n, d] of REP) { const L = longDivide(n, d); expect(L.stop).toBe('repeat'); expect(L.rows.length).toBeLessThanOrEqual(6); expect(d).toBeLessThanOrEqual(30); }
    expect(TRAPS.length).toBeGreaterThan(5);
    for (const t of TRAPS) { const L = longDivide(t.p, t.q); expect(L.rows[t.i]!.q).toBe(L.rows[t.j]!.q); expect(L.rows[t.i]!.r).not.toBe(L.rows[t.j]!.r); }
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, mc ids exist`, () => {
      const seen = new Set<string>();
      let withMc = 0, nChoice = 0;
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t, it.prompt).not.toMatch(/undefined|NaN|Infinity|\[object/);
        if (it.choices) {
          expect(it.choices.length, it.prompt).toBeGreaterThanOrEqual(3);
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length, it.prompt).toBe(1);
          nChoice++; if (verdicts.some(v => v.mc)) withMc++;
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        } else if (mcIds) {
          const a = it.answer;
          const probes: Response[] = a.kind === 'num' ? [num(a.v + 1), num(a.v / 10), num(a.v * 10), num(a.v / 100), num(a.v * 100), num(-a.v), num(0)]
            : a.kind === 'pair' ? [{ kind: 'pair', x: a.y, y: a.x }] : a.kind === 'frac' ? [{ kind: 'frac', w: 0, n: a.n, d: a.d * 10 }, { kind: 'frac', w: 0, n: 1, d: 3 }] : [];
          for (const r of probes) { const v = it.check(r); if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true); expect(v.say.length).toBeGreaterThan(3); }
        }
        const P = pic(it);
        expect(P, it.id).toBeTruthy();
        for (const w of P!.work) expect(w).not.toMatch(/undefined|NaN/);
        if (P && P.kind === 'ladder') { expect(P.p.d).toBeGreaterThan(0); expect(longDivide(P.p.n, P.p.d).whole).toBeLessThanOrEqual(9); }
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      const small = new Set(['remainders', 'twoFive', 'terminates', 'calcDisplay', 'roundEnd', 'approx', 'recall', 'mixedPct', 'repPct', 'classify', 'digitTrap']);
      expect(seen.size, f).toBeGreaterThan(small.has(f) ? 15 : 30);
      // most choice items carry at least one catalogued misconception among their distractors
      if (nChoice) expect(withMc / nChoice, f).toBeGreaterThan(0.6);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  it('fraction to decimal: order reversed, a quotient zero left out, numerator and denominator around a point', () => {
    let zero = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('divide', 'fraction-to-terminating-by-division', s);
      const m = /<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span>/.exec(it.prompt)!;
      const p = Number(m[1]), q = Number(m[2]);
      expect(it.check(num(Number((q / p).toFixed(3)))).mc).toBe(MC.reversed);
      expect(it.check(num(Number(`${p}.${q}`))).mc).toBe(MC.shiftDigits);
      const dec = String(fracFin(p, q)!.N).padStart(fracFin(p, q)!.k, '0');
      const zi = dec.indexOf('0');
      if (zi >= 0 && zi < dec.length - 1) { zero++; expect(it.check(num(Number('0.' + dec.slice(0, zi) + dec.slice(zi + 1)))).mc).toBe(MC.zeroOmitted); }
    }
    expect(zero).toBeGreaterThan(10);
  });
  it('a skipped quotient zero in the next division step', () => {
    let n = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('ladderStep', 'fraction-to-terminating-by-division', s);
      const m = /<b>(\d+) ÷ (\d+)<\/b>/.exec(it.prompt)!;
      const x = Number(m[1]), d = Number(m[2]);
      if (Math.floor(x / d) === 0) { n++; expect(it.check({ kind: 'pair', x: Math.floor(10 * x / d), y: (10 * x) % d }).mc).toBe(MC.zeroOmitted); }
    }
    expect(n).toBeGreaterThan(10);
  });
  it('decimal <-> percent: no x 100, a % stuck on, the point moved one place', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('decPct', 'decimal-percent-small-and-decimal', s);
      if (it.input !== 'num') continue;
      const v = it.answer.kind === 'num' ? it.answer.v : 0;
      if (it.unit === '%') { expect(it.check(num(v / 100)).mc).toBe(MC.appendPct); expect(it.check(num(v / 10)).mc).toBe(MC.pointOne); }
      else { expect(it.check(num(v * 100)).mc).toBe(MC.noDiv100); expect(it.check(num(v * 10)).mc).toBe(MC.pointOne); }
    }
  });
  it('mixed numbers above 1: read as a decimal, the whole forgotten; negatives: the sign dropped, the mixed number split', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('beyondOne', 'beyond-one-whole', s);
      const m = /<b>(\d+)&#8202;<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span>/.exec(it.prompt);
      if (it.input === 'num' && m) {
        const [w, a, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
        expect(it.check(num(Number(`${w}.${a}${b}`) * 100)).mc).toBe(MC.misreadMixed);
        expect(it.check(num(100 * a / b)).mc).toBe(MC.lessThanOne);
      }
      const sg = make('signed', 'signed-forms', s), v = sg.answer.kind === 'num' ? sg.answer.v : 0;
      expect(sg.check(num(-v)).mc).toBe(MC.ignoresMinus);
      const mm = /<b>−(\d+)&#8202;<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span>/.exec(sg.prompt);
      if (mm) {
        const [w, a, b] = [Number(mm[1]), Number(mm[2]), Number(mm[3])];
        const split = -w + a / b;
        expect(sg.check(num(sg.unit === '%' ? Math.round(split * 100 * 1e6) / 1e6 : Math.round(split * 1e6) / 1e6)).mc).toBe(MC.splitMixed);
      }
    }
  });
  it('mixed-number percents: 100 x a/b multiplies only the top', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('mixedPct', 'mixed-number-percent', s);
      if (it.unit !== '%') continue;
      const m = /<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span>/.exec(it.prompt)!;
      const p = Number(m[1]), q = Number(m[2]);
      expect(it.check({ kind: 'frac', w: 0, n: 100 * p, d: 100 * q }).mc).toBe(MC.bothTerms);
      expect(it.check({ kind: 'frac', w: 0, n: p, d: 100 * q }).mc).toBe(MC.denOnly);
      expect(it.check({ kind: 'frac', w: 0, n: 100 * p, d: q }).ok).toBe(true);
    }
  });
  it('rounding: cutting off instead of rounding', () => {
    let n = 0;
    for (let s = 1; s <= 300; s++) {
      const it = make('roundFinal', 'round-to-reporting-precision', s);
      const w = it.check(num((it.answer as { v: number }).v - (it.unit === '%' && /tenth of a percent/.test(it.prompt) ? 0.1 : /hundredth/.test(it.prompt) ? 0.01 : /thousandth/.test(it.prompt) ? 0.001 : 0.1)));
      if (w.mc) { n++; expect([MC.truncates, MC.intermediate]).toContain(w.mc); }
    }
    expect(n).toBeGreaterThan(20);
  });
  it('the bar: over the whole block, never over the digits that come once', () => {
    for (let s = 1; s <= 300; s++) {
      const it = make('barForm', 'prefix-and-block', s);
      const all = choose(it, t => /^0\.<span class="rep">\d+<\/span>$/.test(t));
      if (all >= 0) expect(it.check({ kind: 'choice', i: all }).mc).toBe(MC.barAll);
      const rp = make('repPct', 'repeating-decimal-percent', s);
      for (let i = 0; i < rp.choices!.length; i++) { const v = rp.check({ kind: 'choice', i }); if (!v.ok) expect(v.mc).toBeTruthy(); }
    }
  });
});

describe('the maths of long division', () => {
  it('the expansion is exactly the fraction, and it terminates exactly when the simplest denominator is 2s and 5s', () => {
    for (let d = 1; d <= 60; d++) for (let n = 0; n <= 3 * d; n++) {
      const e = expand(n, d), L = longDivide(n, d);
      // value of whole + 0.pre(rep) as a fraction: (pre rep - pre) / (10^|pre| (10^|rep| - 1)), or pre / 10^|pre|
      const P = e.pre.length, Q = e.rep.length;
      const B = BigInt, ten = (k: number) => B(10) ** B(k);
      const [num2, den] = Q ? [B(e.pre + e.rep) - (P ? B(e.pre) : B(0)), ten(P) * (ten(Q) - B(1))] : [P ? B(e.pre) : B(0), ten(P)];
      expect((B(e.whole) * den + num2) * B(d), `${n}/${d}`).toBe(B(n) * den);
      const g = gcd(n, d) || d;
      expect(L.stop === 'zero', `${n}/${d}`).toBe(n === 0 || otherFactors(d / g).length === 0);
      if (Q) { expect(Q).toBeLessThanOrEqual(d - 1); expect(e.pre.slice(-1)).not.toBe(e.rep.slice(-1)); }
      // every row: x = q d + r, r < d, x = 10 x the previous remainder
      L.rows.forEach((w, i) => { expect(w.x).toBe(w.q * d + w.r); expect(w.r).toBeLessThan(d); if (i) expect(w.x).toBe(10 * L.rows[i - 1]!.r); });
    }
  });
  it('the cases of the topic: bar forms and percents', () => {
    expect(decTex(expand(1, 6))).toBe('0.1\\overline{6}');
    expect(decTex(expand(7, 22))).toBe('0.3\\overline{18}');
    expect(decTex(pctOf(7, 22))).toBe('31.\\overline{81}');
    expect(decTex(pctOf(1, 3))).toBe('33.\\overline{3}');
    expect(decTex(expand(5, 11))).toBe('0.\\overline{45}');
    expect(decTex(pctOf(5, 11))).toBe('45.\\overline{45}');
    expect(decTex(expand(3, 80))).toBe('0.0375');
    expect(decTex(expand(-8, 5))).toBe('-1.6');
    expect(decTex(pctOf(19, 8))).toBe('237.5');
    expect(cmpFinFrac({ N: 333, k: 3 }, 1, 3)).toBe(-1);
    expect(cmpFinFrac({ N: 67, k: 2 }, 2, 3)).toBe(1);
    expect(roundFrac(200, 3, 2)).toEqual({ N: 6667, k: 2 });
    expect(roundFrac(200, 3, 2, 'trunc')).toEqual({ N: 6666, k: 2 });
    const L = longDivide(1, 3, 2);
    expect(L.rows.map(w => w.r)).toEqual([1, 1, 1, 1]);
    expect([L.stop, L.from, L.at]).toEqual(['repeat', 0, 1]);
  });
});

describe('voice', () => {
  it('every scripted panel line has a spoken text, and lines.json is the script', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/fractions-decimals-percents/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(l.text.length, id).toBeGreaterThan(3);
      expect(l.text, id).not.toMatch(/\d|[<>×÷$%≈=…]/);
    }
  });
});
