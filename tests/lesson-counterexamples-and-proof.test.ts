// lesson-counterexamples-and-proof: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/counterexamples-and-proof/items';
import { PLAN } from '../src/lesson/topics/counterexamples-and-proof/plan';

const TOPIC = { subgoals: [...new Map(["v2.extension.counterexample-inference-and-proof"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('counterexamples-and-proof: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('counterexamples-and-proof: families', () => {
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

// ---------- topic checks ----------
import { CLAIMS, CONDS, RULES, SPOTS, VALID, relOn } from '../src/lesson/topics/counterexamples-and-proof/reason';
import { eulerLayout } from '../src/lesson/topics/conditional-statements/eulerLayout';
import { pairsWidth } from '../src/lesson/topics/counterexamples-and-proof/Pairs';
import { frameOf, type CPItem } from '../src/lesson/topics/counterexamples-and-proof/kit';
import { explain } from '../src/lesson/topics/counterexamples-and-proof/explain';
import { SCRIPT } from '../src/lesson/topics/counterexamples-and-proof/script';
import { PLACEMENT } from '../src/lesson/topics/counterexamples-and-proof/placement';

describe('counterexamples-and-proof: the content is exact', () => {
  it('every claim pool is what it says: counterexamples break it, the others do not', () => {
    for (const c of CLAIMS) {
      expect(c.cx.length, c.key).toBeGreaterThan(0);
      for (const v of c.cx) expect(c.P(v.v) && !c.Q(v.v), `${c.key} cx ${v.html}`).toBe(true);
      for (const v of c.holds) expect(c.P(v.v) && c.Q(v.v), `${c.key} holds ${v.html}`).toBe(true);
      for (const v of c.premise) expect(!c.P(v.v) && !c.Q(v.v), `${c.key} premise ${v.html}`).toBe(true);
      for (const v of c.other) expect(!c.P(v.v) && c.Q(v.v), `${c.key} other ${v.html}`).toBe(true);
      for (const v of [...c.cx, ...c.holds, ...c.premise, ...c.other]) if (c.factHead) expect(v.fact, `${c.key} ${v.html} needs its square`).toBeDefined();
    }
  });
  it('every condition pair has the relation it claims, and its witnesses witness it', () => {
    for (const c of CONDS) {
      expect(relOn(c), c.key).toBe(c.rel);
      if (c.noSuff !== undefined) expect(c.test.c(c.noSuff) && !c.test.p(c.noSuff), c.key).toBe(true);
      if (c.noNec !== undefined) expect(c.test.p(c.noNec) && !c.test.c(c.noNec), c.key).toBe(true);
    }
  });
  it('the four forms: detachment and modus tollens are valid, the spots of each form agree with P inside Q', () => {
    // P inside Q: zones pq (p, q), q (not p, q), o (neither). Valid = every spot allowed by premise 2 gives the conclusion.
    const inZone = { pq: [true, true], q: [false, true], o: [false, false] } as const;
    const prem = { detach: ([p]: readonly boolean[]) => p, tollens: ([, q]: readonly boolean[]) => !q, affirm: ([, q]: readonly boolean[]) => q, deny: ([p]: readonly boolean[]) => !p };
    const concl = { detach: ([, q]: readonly boolean[]) => q, tollens: ([p]: readonly boolean[]) => !p, affirm: ([p]: readonly boolean[]) => p, deny: ([, q]: readonly boolean[]) => !q };
    for (const f of ['detach', 'tollens', 'affirm', 'deny'] as const) {
      const spots = (['pq', 'q', 'o'] as const).filter(z => prem[f](inZone[z]));
      expect(spots, f).toEqual(SPOTS[f]);
      expect(spots.every(z => concl[f](inZone[z])), f).toBe(VALID[f]);
    }
    expect(RULES.length).toBeGreaterThan(6);
  });
});

describe('counterexamples-and-proof: pictures fit, steps end on the answer', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}`, () => {
      for (let s = 1; s <= 150; s++) {
        const item = GEN[f]!(rng(s * 13 + 5), s, p.id) as CPItem;
        const pic = item.picture;
        expect(pic, f).toBeDefined();
        if (pic!.euler) expect(() => eulerLayout(pic!.euler!, frameOf(pic!)), item.prompt).not.toThrow();
        if (pic!.pairs) expect(pairsWidth(pic!.pairs.params), f).toBeLessThanOrEqual(frameOf(pic!).w - 40);
        if (pic!.table) { expect(pic!.table.rows.length).toBeLessThanOrEqual(6); for (const r of pic!.table.rows) expect(r.length).toBe(pic!.table.head.length); }
        if (pic!.proof) expect(pic!.proof.rows.length).toBeLessThanOrEqual(7);
        const ex = explain(item);
        expect(ex, `${f}: ${item.solution.join(' | ')}`).not.toBeNull();
        expect(item.check(ex!.result).ok, `${f}: steps end on ${JSON.stringify(ex!.result)}`).toBe(true);
        for (const t of [item.prompt, ...(item.choices ?? []), ...item.solution]) expect(t, f).not.toMatch(/undefined|NaN|\+ −|\s\s|\bnull\b/);
      }
    });
  }
});

describe('counterexamples-and-proof: misconceptions are classified', () => {
  const probe = (f: string, sg: string, mc: string, min = 5) => {
    let hits = 0;
    for (let s = 1; s <= 300; s++) {
      const it = GEN[f]!(rng(s), s, sg);
      it.choices?.forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc === mc) { expect(v.ok).toBe(false); hits++; } });
    }
    expect(hits, `${f} ${mc}`).toBeGreaterThanOrEqual(min);
  };
  it('a value with a false hypothesis taken as a counterexample', () => probe('cxPick', 'counterexample', 'mc.reasoning-language.counterexample-violates-premise'));
  it('a counterexample dismissed as an exception', () => probe('cxJudge', 'counterexample', 'mc.reasoning-language.counterexample-as-exception'));
  it('examples taken as proof', () => probe('examplesProof', 'generality-of-proof', 'mc.reasoning-language.examples-as-proof'));
  it('exceptions expected after a proof', () => probe('afterProof', 'generality-of-proof', 'mc.reasoning-language.expects-exceptions-after-general-proof'));
  it('one letter for two numbers', () => probe('repPick', 'general-representation', 'mc.expressions.one-letter-for-two-quantities'));
  it('affirming the conclusion', () => probe('detach', 'detachment', 'mc.geometric-proof.necessary-property-as-sufficient-test'));
  it('a reversed chain and an unmatched middle', () => { probe('chain', 'chaining', 'mc.geometric-proof.reverses-conditional-chain'); probe('chain', 'chaining', 'mc.geometric-proof.syllogism-chain-errors'); });
  it('numbers inside a general proof', () => probe('proofFill', 'direct-proof', 'mc.geometric-proof.numbers-inside-general-proof'));
  it('validity judged by the truth of the conclusion', () => probe('validForm', 'invalid-inference', 'mc.geometric-proof.validity-judged-by-truth'));
  it('circular reasoning and a rejected theorem', () => { probe('auditFind', 'proof-audit', 'mc.geometric-proof.circular-reasoning'); probe('auditKind', 'proof-audit', 'mc.geometric-proof.established-theorems-rejected-as-reasons'); });
  it('the converse assumed true', () => probe('converseJudge', 'converse-truth', 'mc.geometric-proof.converse-assumed-true'));
  it('the inverse error and a missed modus tollens', () => { probe('tollens', 'modus-tollens', 'mc.geometric-proof.inverse-error'); probe('tollens', 'modus-tollens', 'mc.geometric-proof.misses-modus-tollens'); });
  it('necessary and sufficient swapped', () => { probe('suffRead', 'sufficient-condition', 'mc.geometric-proof.necessary-sufficient-confused'); probe('necTrue', 'necessary-condition', 'mc.geometric-proof.necessary-sufficient-confused'); });
  it('one direction for an if and only if', () => probe('iffParts', 'iff-proof', 'mc.geometric-proof.iff-one-direction-only'));
  it('"neither" ruled out, a usual condition taken as necessary', () => { probe('classify', 'classify-condition', 'mc.geometric-proof.condition-cannot-be-neither'); probe('classify', 'classify-condition', 'mc.geometric-proof.usual-condition-as-necessary', 2); });
});

describe('counterexamples-and-proof: voice and check-in', () => {
  it('every script line has its spoken text in voice/lines.json, without digits or symbols', () => {
    if (process.env.WRITE_LINES) fs.writeFileSync('pages/lessons/counterexamples-and-proof/voice/lines.json', JSON.stringify(Object.fromEntries(Object.entries(SCRIPT).map(([k, v]) => [k, { text: v.say }])), null, 1) + '\n');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/counterexamples-and-proof/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9=+×÷<>²√%$]/);
    }
  });
  it('the check-in picks are families of the plan', () => {
    for (const pk of PLACEMENT.picks) expect(PLAN.find(p => p.id === pk.subgoal)?.families, pk.family).toContain(pk.family);
  });
});
