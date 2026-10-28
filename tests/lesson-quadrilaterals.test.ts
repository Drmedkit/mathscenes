// lesson-quadrilaterals: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/quadrilaterals/items';
import { PLAN } from '../src/lesson/topics/quadrilaterals/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-21-parallelogram-and-quadrilateral-properties"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('quadrilaterals: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('quadrilaterals: families', () => {
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
        seen.add([item.prompt, item.board, (item.choices ?? []).slice().sort().join('/'), JSON.stringify(item.answer), ((item as { picture?: { card?: { lines: string[] } } }).picture?.card?.lines ?? []).join('/')].join('|'));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { SCRIPT } from '../src/lesson/topics/quadrilaterals/script';
import { explain } from '../src/lesson/topics/quadrilaterals/explain';
import { resultOf } from '../src/lesson/runtime/explain';
import { FR_LEFT, FR_RIGHT, FR_WIDE, dist, figProblems, galleryFrames, measure } from '../src/lesson/topics/geometry-foundations/geo';
import { ProofFrame } from '../src/lesson/topics/geometry-foundations/ProofFrame';
import { dusk } from '../src/lesson/dusk';
import { eulerFits } from '../src/lesson/topics/conditional-statements/eulerLayout';
import { type QK, QK_ALL, factsOf, makeQ, parProblems, polyAngles, polyWithAngles } from '../src/lesson/topics/quadrilaterals/quad';
import { treeProblems } from '../src/lesson/topics/quadrilaterals/Tree';
import { LABELS, catalogue, necCounter, suffCounter } from '../src/lesson/topics/quadrilaterals/conds';
import { PROPERTY_PROOFS, TEST_PROOFS, TRAP_PROOFS, makeQProof, validOrder } from '../src/lesson/topics/quadrilaterals/qProofs';
import type { QItem } from '../src/lesson/topics/quadrilaterals/items';

const ALL = PLAN.flatMap(p => p.families.map(f => ({ sg: p.id, f })));
const each = (seeds: number, fn: (it: QItem, f: string, s: number) => void) => { for (const { sg, f } of ALL) for (let s = 1; s <= seeds; s++) fn(GEN[f]!(rng(s * 7 + 3), s, sg) as QItem, f, s); };

describe('quadrilaterals: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/quadrilaterals/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/:]/.test(v.say.replace(/: /g, ', ')), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('quadrilaterals: shapes and facts', () => {
  it('every kind is built exactly and classifies as itself', () => {
    for (const k of QK_ALL) for (let s = 1; s <= 80; s++) expect(factsOf(makeQ(rng(s), k, { turn: s * 37 })).kind, `${k} ${s}`).toBe(k);
  });
  it('polygons with prescribed angles close exactly', () => {
    const want = [100, 110, 120, 95, 115];
    for (let s = 1; s <= 60; s++) {
      const P = polyWithAngles(rng(s), want);
      if (P) polyAngles(P).forEach((a, i) => expect(Math.abs(a - want[i]!)).toBeLessThan(1e-6));
    }
  });
});

describe('quadrilaterals: necessary / sufficient labels', () => {
  it('every label agrees with the catalogue of exact shapes (a counterexample for each "no", none for each "yes")', () => {
    for (const l of LABELS) {
      expect(suffCounter(l) === null, `${l.cond} -> ${l.target} (${l.universe}) sufficient`).toBe(l.suff);
      expect(necCounter(l) === null, `${l.cond} -> ${l.target} (${l.universe}) necessary`).toBe(l.nec);
    }
  });
  it('the catalogue holds every class', () => {
    const kinds = catalogue().map(s => factsOf(s.Q).kind);
    for (const k of ['square', 'rect', 'rhombus', 'para', 'kite', 'isoTrap', 'trap', 'quad'] as QK[]) expect(kinds, k).toContain(k);
  });
});

describe('quadrilaterals: proofs', () => {
  it('the canonical order is valid, every row reason differs from its wrong reasons, decoys are not rows, the frame builds', () => {
    for (const id of [...PROPERTY_PROOFS, ...TEST_PROOFS, ...TRAP_PROOFS]) for (let s = 1; s <= 20; s++) {
      const p = makeQProof(id, rng(s));
      expect(validOrder(p, p.rows.map((_, i) => i + 1)), id).toBe(true);
      for (const r of p.rows) for (const w of r.wrong) expect(w.t, `${id}: ${r.st}`).not.toBe(r.rs);
      for (const d of p.decoys) expect(p.rows.map(r => r.st), id).not.toContain(d.st);
      expect(() => ProofFrame({ given: p.given, prove: p.prove, rows: p.rows.map(r => ({ st: r.st, rs: r.rs })) }, { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 }, dusk), id).not.toThrow();
    }
  });
});

describe('quadrilaterals: pictures', () => {
  it('every practice picture lays out readably in the frame the page uses', () => {
    each(25, (it, f, s) => {
      const pic = it.picture;
      if (!pic) return;
      const fr = pic.proof || pic.card ? FR_LEFT : FR_WIDE;
      if (pic.fig) { expect(figProblems(pic.fig, fr), `${f} ${s}`).toEqual([]); expect(parProblems(pic.fig), `${f} ${s}`).toEqual([]); }
      if (pic.gallery) pic.gallery.figs.forEach((g, i) => expect(figProblems(g, galleryFrames(pic.gallery!.figs.length)[i]!), `${f} ${s}`).toEqual([]));
      if (pic.tree) expect(treeProblems(FR_WIDE)).toEqual([]);
      if (pic.euler) expect(eulerFits(pic.euler), `${f} ${s}`).toBe(true);
      if (pic.proof) {
        const pr = pic.proof, fill = new Map((pic.reveal?.fill ?? []).map(x => [x.i, x]));
        const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
        for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 }, dusk), `${f} ${s}`).not.toThrow();
      }
    });
  });
  it('labelled angles are drawn at their measure; tick groups equal; boxes right; the prompt uses the figure letters', () => {
    each(20, (it, f) => {
      const fig = it.picture?.fig;
      if (!fig) return;
      for (const a of fig.angles) {
        const m = /^(\d+(?:\.5)?)°$/.exec(a.text ?? '');
        if (m) expect(Math.abs(measure(a.v, a.p, a.q) - Number(m[1])), `${f} ${a.id}`).toBeLessThan(1e-6);
        if (a.box) expect(Math.abs(measure(a.v, a.p, a.q) - 90), `${f} box`).toBeLessThan(1e-6);
      }
      for (const g of fig.segs.filter(x => x.ticks)) for (const g2 of fig.segs.filter(x => x.ticks === g.ticks)) expect(Math.abs(dist(g.a, g.b) - dist(g2.a, g2.b)), `${f} ticks`).toBeLessThan(1e-6);
      if (!fig.points.length) return;
      const names = new Set(fig.points.map(p => p.name));
      for (const m of it.prompt.replace(/<[^>]+>/g, '').matchAll(/quadrilateral ([A-Z]{4})|([A-Z]{4}) is an? /g)) for (const ch of (m[1] ?? m[2])!) expect(names.has(ch), `${f}: ${it.prompt}`).toBe(true);
    });
  });
  it('labelled lengths are drawn at one scale', () => {
    each(20, (it, f) => {
      const fig = it.picture?.fig;
      if (!fig) return;
      const lens = fig.segs.map(s => ({ v: Number(/^(\d+(?:\.\d)?) (?:in\.|ft|cm)$/.exec(s.alt ?? s.text ?? '')?.[1]), d: dist(s.a, s.b) })).filter(x => Number.isFinite(x.v));
      for (const x of lens) for (const y of lens) expect(Math.abs(x.v / y.v - x.d / y.d), `${f}`).toBeLessThan(1e-6);
    });
  });
});

describe('quadrilaterals: answers and words', () => {
  it('typed answers are whole or one decimal; the worked steps end on the answer; no undefined / NaN', () => {
    each(40, (it, f) => {
      if (it.answer.kind === 'num') expect(Math.abs(it.answer.v * 10 - Math.round(it.answer.v * 10)) < 1e-9, `${f}: ${it.answer.v}`).toBe(true);
      const ex = explain(it);
      expect(ex, `${f}: no steps`).not.toBeNull();
      const r = resultOf(it, ex!.steps);
      expect(!!r && it.check(r).ok, `${f}: steps end on ${JSON.stringify(r)} (${ex!.steps.join(' / ')})`).toBe(true);
      expect(/undefined|NaN/.test(it.prompt + (it.choices ?? []).join('') + ex!.steps.join('')), `${f}`).toBe(false);
      for (const st of ex!.steps) expect(st.replace(/<[^>]+>/g, '').length, `${f}: ${st}`).toBeLessThanOrEqual(200);
    });
  });
  it('every classification item that names trapezoids or kites states the inclusive definitions', () => {
    const CLASSIFY = new Set(['defPick', 'defGallery', 'inclWhy', 'inheritWhich', 'inheritChain', 'treeName', 'allNames', 'mostSpecific', 'guaranteed', 'couldBe', 'allSomeNo', 'suffMean', 'converseForm', 'counterEx', 'necMean', 'fourWay']);
    each(40, (it, f) => {
      if (!CLASSIFY.has(f)) return;
      const all = it.prompt + ' ' + (it.choices ?? []).join(' ');
      if (/trapezoid|kite/.test(all.replace(/isosceles trapezoid/g, ''))) expect(it.prompt, `${f}: ${it.prompt}`).toMatch(/at least one pair of parallel sides/);
      if (/isosceles trapezoid/.test(all)) expect(it.prompt, `${f}: ${it.prompt}`).toMatch(/not a parallelogram/);
    });
  });
  it('"most specific" items offer only class names, exactly one of them right', () => {
    each(60, (it, f) => {
      if (f !== 'mostSpecific') return;
      expect(it.choices!.every(c => ['square', 'rectangle', 'rhombus', 'parallelogram', 'kite', 'trapezoid', 'quadrilateral'].includes(c)), f).toBe(true);
    });
  });
});

describe('quadrilaterals: relabelling touches point names only', () => {
  // words written in capitals for emphasis, and the article: none may come out mangled
  const WORDS = new Set(['ONE', 'PART', 'EACH', 'NOT', 'ALL', 'SOME', 'BOTH', 'SAME', 'DOWN', 'HALF', 'TWICE', 'WHOLE', 'EVERY', 'GUARANTEE', 'NECESSARY', 'SUFFICIENT', 'OPPOSITE', 'CONSECUTIVE', 'AND', 'GIVE', 'CPCTC', 'SSS', 'SAS', 'ASA', 'AAS', 'HL', 'SSA', 'AAA']);
  it('no capitalised word, article or hyphenated word is relabelled (600 seeds per family)', () => {
    for (const { sg, f } of ALL) for (let s = 1; s <= 600; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, sg) as QItem;
      const pts = new Set<string>([...(it.picture?.fig?.points ?? []).map(p => p.name)]);
      const texts = [it.prompt, ...(it.choices ?? []), ...it.solution].map(x => x.replace(/<[^>]+>/g, ''));
      for (const tx of texts) {
        expect(tx, `${f}: protected-prose marks left`).not.toMatch(/[⟦⟧]/);
        expect(tx, `${f}: an article relabelled`).not.toMatch(/(^|[.:?!“”"]\s*|\bProof:\s*)[B-HJKM-NP-Z] [a-z]{3,}/);
        expect(tx, `${f}: a hyphenated word relabelled`).not.toMatch(/\b(?!A-)[A-Z]-[a-z]/);
        expect(tx, `${f}: An + letter`).not.toMatch(/\bAn [B-Z]\b/);
        for (const m of tx.matchAll(/(?<![A-Za-z])[A-Z]{2,}(?![A-Za-z])/g)) {
          const w = m[0];
          if (WORDS.has(w)) continue;
          expect([...w].every(ch => pts.has(ch)), `${f}: "${w}" in "${tx}"`).toBe(true);
        }
      }
    }
  }, 180000);
});
