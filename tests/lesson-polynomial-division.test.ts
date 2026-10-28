// lesson-polynomial-division: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/polynomial-division/items';
import { PLAN } from '../src/lesson/topics/polynomial-division/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-05-polynomial-division-long-and-synthetic"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('polynomial-division: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('polynomial-division: families', () => {
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

// ---------- topic checks: the maths, the "secretly right" probe, the worked steps, the voice script ----------
import { co, divide, synth, eqC, addC, mulC, degOf, q, pH, qrH, keyC } from '../src/lesson/topics/polynomial-division/pd';
import { SCRIPT } from '../src/lesson/topics/polynomial-division/script';
import { explain } from '../src/lesson/topics/polynomial-division/explain';
import { plain } from '../src/lesson/runtime/item';

describe('polynomial-division: maths', () => {
  it('long division: the worked example and the turn', () => {
    const d = divide(co([1, 5, 7]), co([1, 2]));
    expect(keyC(d.Q)).toBe(keyC(co([1, 3]))); expect(keyC(d.R)).toBe(keyC(co([1])));
    expect(d.cycles.length).toBe(2);
    const t = divide(co([1, 0, -7, 9]), co([1, -2]));
    expect(keyC(t.Q)).toBe(keyC(co([1, 2, -3]))); expect(keyC(t.R)).toBe(keyC(co([3])));
  });
  it('synthetic division agrees with long division by x - c (many cases)', () => {
    for (let c = -5; c <= 5; c++) for (let s = 1; s <= 40; s++) {
      const R = rng(s * 13 + c + 100);
      const P = co(Array.from({ length: 2 + (s % 4) }, (_, i) => (i === 0 ? 1 + (s % 3) : Math.floor(R() * 19) - 9)));
      const sd = synth(P, q(c)), ld = divide(P, co([1, -c]));
      expect(eqC(sd.Q, ld.Q)).toBe(true);
      expect(eqC([sd.R], ld.R)).toBe(true);
    }
  });
  it('every division satisfies P = DQ + R with deg R < deg D (nonmonic and quadratic divisors)', () => {
    for (let s = 1; s <= 300; s++) {
      const R = rng(s * 7 + 1);
      const r = (lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
      const P = co(Array.from({ length: r(2, 5) }, (_, i) => (i === 0 ? r(1, 5) : r(-9, 9))));
      const D = co(Array.from({ length: r(2, 3) }, (_, i) => (i === 0 ? r(1, 3) : r(-5, 5))));
      const d = divide(P, D);
      expect(eqC(addC(mulC(D, d.Q), d.R), P)).toBe(true);
      const dr = degOf(d.R); if (dr !== null) expect(dr).toBeLessThan(degOf(D)!);
    }
  });
  it('writes Q + R/D unambiguously in plain text', () => {
    expect(plain(qrH(co([1, 3]), co([1]), co([1, 2])))).toBe('x + 3 + 1/(x + 2)');
    expect(plain(qrH(co([1, -1]), co([-4]), co([1, 2])))).toBe('x − 1 − 4/(x + 2)');
    expect(plain(qrH(co([1]), co([2, -1]), co([1, 0, 1])))).toBe('1 + (2x − 1)/(x2 + 1)');
    expect(plain(pH(co([1, 0, -3, 0, 5]), true))).toBe('x4 + 0x3 − 3x2 + 0x + 5');
  });
});

describe('polynomial-division: no wrong choice is secretly right (2000 seeds per family)', () => {
  it('choice items: exactly one right, no repeated choices, every seed', () => {
    for (const p of PLAN) for (const f of p.families) {
      for (let s = 1; s <= 2000; s++) {
        const item = GEN[f]!(rng(s * 97 + 3), s, p.id);
        expect(item.check(item.answer).ok, `${f} ${s}`).toBe(true);
        if (item.choices) {
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, `${f} ${s}`).toBe(1);
          expect(new Set(item.choices).size, `${f} ${s}`).toBe(item.choices.length);
        }
      }
    }
  });
  it('pair items whose order is free accept both orders', () => {
    for (const f of ['factorFull', 'boxDims']) for (let s = 1; s <= 300; s++) {
      const item = GEN[f]!(rng(s * 11 + 3), s, 'apply-known-factor');
      const a = item.answer as { kind: 'pair'; x: number; y: number };
      expect(item.check({ kind: 'pair', x: a.y, y: a.x }).ok, `${f} ${s}`).toBe(true);
    }
  });
  it('plain text never shows "+ −", "1x" or a double period', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 300; s++) {
      const item = GEN[f]!(rng(s * 17 + 9), s, p.id);
      for (const t of [item.prompt, ...(item.choices ?? []), ...item.solution].map(plain)) {
        expect(/\+ [−-]/.test(t), `${f}: ${t}`).toBe(false);
        expect(/(^|[^\d.])1x/.test(t), `${f}: ${t}`).toBe(false);
        expect(/\.\./.test(t), `${f}: ${t}`).toBe(false);
      }
      expect(item.solution.length, f).toBeLessThanOrEqual(5);
    }
  });
  it('the worked steps arrive at the answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const item = GEN[f]!(rng(s * 13 + 5), s, p.id);
      const ex = explain(item);
      expect(ex, `${f} ${s}`).not.toBeNull();
      expect(item.check(ex!.result).ok, `${f} ${s}: ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
  it('typical slips are classified', () => {
    const it1 = GEN.sdLast!(rng(5), 1, 'sd-recurrence');
    const v = (it1.answer as { v: number }).v;
    expect(it1.check({ kind: 'num', v }).ok).toBe(true);
    const qf = GEN.qrFill!(rng(77), 1, 'q-plus-r-over-d');
    const a = qf.answer as { x: number; y: number };
    expect(qf.check({ kind: 'pair', x: a.x + a.y, y: 0 }).mc).toBe('mc.quadratic-polynomial.adds-remainder-to-quotient');
  });
});

describe('polynomial-division: voice script', () => {
  const LINES = JSON.parse(fs.readFileSync('pages/lessons/polynomial-division/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
  it('every panel line has its spoken text, without digits or symbols', () => {
    for (const [id, v] of Object.entries(SCRIPT)) {
      expect(LINES[id]?.text, id).toBe(v.say);
      expect(/[0-9=+×÷<>^²³·−]/.test(v.say), `${id}: ${v.say}`).toBe(false);
    }
  });
});

// ---------- regression (oracle 2026-10-28): every identity on a board holds; signed remainders; linkWhyAdd powers ----------
import { identT, identH, mulC as mulC2 } from '../src/lesson/topics/polynomial-division/pd';
/** a board's TeX as a function of x (null when it is not a plain polynomial expression) */
function texFn(src: string): ((x: number) => number) | null {
  let s = src.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/x\^\{(\d+)\}/g, '(x**$1)').replace(/\\cdot/g, '*').replace(/\\,|\\ /g, ' ');
  if (/[\\a-wyzA-Z?^{}]/.test(s)) return null;
  s = s.replace(/(\d|x|\))\s*(?=[x(])/g, '$1*');
  try { const f = new Function('x', `return ${s};`) as (x: number) => number; f(1); return f; } catch { return null; }
}
describe('polynomial-division: identities on the board hold', () => {
  it('identT / identH keep the sign of every remainder term', () => {
    for (let s = 1; s <= 400; s++) {
      const R = rng(s * 5 + 3), r = (lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
      const D = co([1, r(-4, 4), r(-5, 5)]), Q = co([r(-3, 3) || 1, r(-5, 5)]), Rr = co([r(-5, 5) || -1, r(-9, 9)]);
      const P = addC(mulC2(D, Q), Rr);
      const [L, Rt] = identT(P, D, Q, Rr).split(' = ');
      const fl = texFn(L!)!, fr = texFn(Rt!)!;
      for (const x of [-2, -1, 0, 1, 2, 3]) expect(fr(x), identT(P, D, Q, Rr)).toBeCloseTo(fl(x), 9);
      const h = plain(identH(P, D, Q, Rr));
      expect(/\+ [−-]|− [−-]/.test(h), h).toBe(false);
    }
  });
  it('every practice board that is an identity holds at several x (claims to check are excluded)', () => {
    const skip = new Set(['spotValue', 'spotVerdict', 'verifyClaim', 'firstMismatch']);
    let n = 0;
    for (const p of PLAN) for (const f of p.families) if (!skip.has(f)) for (let s = 1; s <= 300; s++) {
      const item = GEN[f]!(rng(s * 19 + 1), s, p.id);
      const parts = item.board.split(' = ');
      if (parts.length !== 2) continue;
      const fl = texFn(parts[0]!), fr = texFn(parts[1]!);
      if (!fl || !fr) continue;
      n++;
      for (const x of [-2, -1, 0, 2, 3]) expect(fr(x), `${f}: ${item.board}`).toBeCloseTo(fl(x), 9);
    }
    expect(n).toBeGreaterThan(500);
  });
  it('linkWhyAdd: the quotient term times x − c is the product that is written', () => {
    for (let s = 1; s <= 300; s++) {
      const item = GEN.linkWhyAdd!(rng(s * 3 + 2), s, 'sd-link-long-division');
      const m = plain(item.prompt).match(/the quotient term (.+?) times x − (−?\d+|\(−\d+\))|the quotient term (.+?) times x \+ (\d+)/);
      expect(m, item.prompt).not.toBeNull();
      const pr = plain(item.prompt).match(/the quotient term (.+?) times (x [−+] \d+) is (.+?)\. The tableau/)!;
      const tx = (t: string) => texFn(t.replace(/−/g, '-').replace(/x(\d)/g, 'x^{$1}'));   // runtime plain() drops the ^ of x<sup>2</sup>
      const tf = tx(pr[1]!), df = tx(pr[2]!), pf = tx(pr[3]!);
      for (const x of [-2, 1, 2, 3]) expect(tf!(x) * df!(x), item.prompt).toBeCloseTo(pf!(x), 9);
    }
  });
});

describe('polynomial-division: a negative factor after a product sign is bracketed', () => {
  it('no text has "· −" or "× −"', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 300; s++) {
      const item = GEN[f]!(rng(s * 23 + 11), s, p.id);
      const texts = [item.prompt, ...(item.choices ?? []), ...item.solution, ...(item.choices ?? []).map((_, i) => item.check({ kind: 'choice', i }).say)].map(plain);
      for (const t of texts) expect(/[·×] [−-]/.test(t), `${f}: ${t}`).toBe(false);
    }
    for (const v of Object.values(SCRIPT)) expect(/[·×] [−-]/.test(plain(v.html)), v.html).toBe(false);
  });
});
