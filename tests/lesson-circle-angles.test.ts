// lesson-circle-angles: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/circle-angles/items';
import { PLAN } from '../src/lesson/topics/circle-angles/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-26-circle-theorems"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('circle-angles: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('circle-angles: families', () => {
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
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join('/'));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { SCRIPT } from '../src/lesson/topics/circle-angles/script';
import { explain } from '../src/lesson/topics/circle-angles/explain';
import { resultOf } from '../src/lesson/runtime/explain';
import { measure } from '../src/lesson/topics/geometry-foundations/geo';
import { ProofFrame } from '../src/lesson/topics/geometry-foundations/ProofFrame';
import { dusk } from '../src/lesson/dusk';
import { cfProblems, span } from '../src/lesson/topics/circle-angles/cfig';
import { PROOF_FR, picFrame, twC } from '../src/lesson/topics/circle-angles/ckit';
import { type CProofId, makeProof, validOrder } from '../src/lesson/topics/circle-angles/cProofs';
import { relabel } from '../src/lesson/topics/quadrilaterals/qkit';
import type { CItem } from '../src/lesson/topics/circle-angles/items';

const ALL = PLAN.flatMap(p => p.families.map(f => ({ sg: p.id, f })));
const each = (seeds: number, fn: (it: CItem, f: string, s: number, sg: string) => void) => { for (const { sg, f } of ALL) for (let s = 1; s <= seeds; s++) fn(GEN[f]!(rng(s * 7 + 3), s, sg) as CItem, f, s, sg); };

describe('circle-angles: voice', () => {
  it('every script line is voiced, and the spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/circle-angles/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(/[0-9=≅∠△°+−<>/:½⌢]/.test(v.say.replace(/: /g, ', ')), `${k}: ${v.say}`).toBe(false);
    }
  });
});

describe('circle-angles: proofs', () => {
  it('the canonical order is valid, wrong reasons differ from the reason, decoys are not rows, the frame builds', () => {
    const ids: CProofId[] = ['base', 'sum', 'sumObtuse', 'diff', 'cyclic', 'chordIn', 'chordOut', 'tanChord', 'chainTan', 'chainConv', 'chainCyc'];
    for (const id of ids) for (let s = 1; s <= 15; s++) {
      const p = makeProof(id, rng(s));
      expect(validOrder(p, p.rows.map((_, i) => i + 1)), id).toBe(true);
      for (const r of p.rows) for (const w of r.wrong) expect(w.t, `${id}: ${r.st}`).not.toBe(r.rs);
      for (const d of p.decoys) expect(p.rows.map(r => r.st), id).not.toContain(d.st);
      expect(() => ProofFrame({ given: p.given, prove: p.prove, rows: p.rows.map(r => ({ st: r.st, rs: r.rs })) }, PROOF_FR({ cfig: p.fig }), dusk), id).not.toThrow();
    }
  });
});

describe('circle-angles: pictures', () => {
  it('every practice picture lays out readably in the frame the page uses; proof frames build', () => {
    each(20, (it, f, s) => {
      const pic = it.picture;
      if (!pic) return;
      if (pic.cfig) expect(cfProblems(pic.cfig, picFrame(pic)), `${f} ${s}`).toEqual([]);
      if (pic.proof) {
        const pr = pic.proof, fill = new Map((pic.reveal?.fill ?? []).map(x => [x.i, x]));
        const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
        for (const rows of [pr.rows, solved]) expect(() => ProofFrame({ given: pr.given, prove: pr.prove, rows }, PROOF_FR(pic), dusk), `${f} ${s}`).not.toThrow();
      }
    });
  });
  it('arcs and angles are drawn at their labels; boxes are right angles; arcs are realistic (0° < arc < 360°)', () => {
    each(25, (it, f) => {
      const cf = it.picture?.cfig;
      if (!cf) return;
      for (const a of cf.fig.angles) {
        for (const t of [a.text, a.alt]) { const m = /^(\d+(?:\.5)?)°$/.exec(t ?? ''); if (m) expect(Math.abs(measure(a.v, a.p, a.q) - Number(m[1])), `${f} ${a.id}`).toBeLessThan(1e-6); }
        if (a.box) expect(Math.abs(measure(a.v, a.p, a.q) - 90), `${f} box ${a.id}`).toBeLessThan(1e-6);
      }
      for (const a of cf.arcs) {
        const sp = span(a.a, a.b);
        expect(sp > 0.4 && sp < 359.6, `${f} arc ${a.id} ${sp}`).toBe(true);
        for (const t of [a.text, a.alt]) { const m = /^(\d+(?:\.5)?)°$/.exec(t ?? ''); if (m) expect(Math.abs(sp - Number(m[1])), `${f} arc ${a.id}`).toBeLessThan(1e-6); }
      }
      const P = cf.fig.points;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) expect(Math.hypot(P[i]!.at[0] - P[j]!.at[0], P[i]!.at[1] - P[j]!.at[1]), `${f}: ${P[i]!.name}${P[j]!.name}`).toBeGreaterThan(20);
    });
  });
  it('no answer is visible before the student answers (no label already shows it unless the prompt gives it)', () => {
    each(25, (it, f) => {
      const cf = it.picture?.cfig;
      if (!cf || it.answer.kind !== 'num') return;
      const v = it.answer.v;
      const shown = [...cf.fig.angles.map(a => a.text), ...cf.arcs.map(a => a.text), ...cf.fig.segs.map(s => s.text)].filter(Boolean) as string[];
      for (const t of shown) if (t === `${v}°`) expect(it.prompt, `${f}: label ${t} shows the answer`).toContain(`${v}°`);
    });
  });
});

describe('circle-angles: answers and words', () => {
  it('typed answers are whole or .5; the worked steps end on the answer (at most 5); no undefined / NaN', () => {
    each(40, (it, f) => {
      if (it.answer.kind === 'num') expect(Math.abs(it.answer.v * 100 - Math.round(it.answer.v * 100)) < 1e-9, `${f}: ${it.answer.v}`).toBe(true);
      const ex = explain(it);
      expect(ex, `${f}: no steps`).not.toBeNull();
      expect(ex!.steps.length, `${f}`).toBeLessThanOrEqual(5);
      const r = resultOf(it, ex!.steps);
      expect(!!r && it.check(r).ok, `${f}: steps end on ${JSON.stringify(r)} (${ex!.steps.join(' / ')})`).toBe(true);
      expect(/undefined|NaN/.test(it.prompt + (it.choices ?? []).join('') + ex!.steps.join('')), `${f}`).toBe(false);
    });
  });
  it('clean words: no "in..", no raw TeX in panel text, no "1 <plural>", a two-letter arc is never a major arc', () => {
    each(60, (it, f) => {
      const plain = [it.prompt, ...(it.choices ?? []), ...it.solution, it.unit ?? ''].map(x => x.replace(/<[^>]+>/g, ''));
      for (const tx of plain) {
        expect(tx, `${f}: double period`).not.toMatch(/\bin\.\./);
        expect(tx, `${f}: raw TeX`).not.toMatch(/\\(tfrac|frac|overparen|angle|text|overline)/);
        expect(tx, `${f}: 1 + plural`).not.toMatch(/(^|[^\d.,])1 (chords|points|arcs|lines|angles|radii|degrees|segments|tangents|secants)\b/);
        expect(tx, `${f}: rounded factor`).not.toMatch(/\d\.(33|67|\d{3,})/);
      }
      if (it.answer.kind === 'num' && it.answer.v === 1) expect(it.unit ?? '', f).not.toMatch(/s$/);
      // a two-letter arc given a measure must be the minor arc (< 180°)
      for (const m of plain.join(' ').matchAll(/arc ([A-Z]{2})\)? = (\d+(?:\.5)?)°(?!\s*[−+-])/g)) expect(Number(m[2]), `${f}: arc ${m[1]} = ${m[2]}°`).toBeLessThan(180);
    });
  });
  it('the board never names a choice that is the right answer, and an asked-about line is the line on the board', () => {
    each(80, (it, f) => {
      if (f !== 'tangentPoint') return;
      const line = /overleftrightarrow\{([A-Z]{2})\}/.exec(it.board)?.[1];
      if (!line) return;
      expect(it.prompt, f).toMatch(new RegExp(`line ${line}`));
      expect(it.choices![it.answer.kind === 'choice' ? it.answer.i : 0], f).not.toBe(`line ${line}`);
    });
  });
  it('a typed answer near the right one is never accepted, and every misconception id exists', () => {
    each(30, (it, f) => {
      if (it.answer.kind !== 'num') return;
      for (const d of [-180, -90, -1, 0.5, 1, 2, 90, 180]) {
        const v = it.check({ kind: 'num', v: it.answer.v + d });
        expect(v.ok, `${f}`).toBe(false);
        if (v.mc) expect(CATALOG.has(v.mc), v.mc).toBe(true);
      }
    });
  });
  it('same-arc / opposite-arc items never use a right angle (congruent and supplementary would both be right)', () => {
    each(80, (it, f) => {
      if (f !== 'sameOrOpposite' && f !== 'sameArc') return;
      for (const a of it.picture!.cfig!.fig.angles) expect(Math.abs(measure(a.v, a.p, a.q) - 90) > 0.4, f).toBe(true);
    });
  });
  it('exterior-angle items always have a near arc of at least 20°, so half-sum and half-difference differ', () => {
    each(80, (it, f) => {
      if (f !== 'exteriorAngle') return;
      for (const a of it.picture!.cfig!.arcs) if (a.text || a.alt) expect(span(a.a, a.b), f).toBeGreaterThanOrEqual(20);
    });
  });
});

describe('circle-angles: relabelling touches point names only', () => {
  const WORDS = new Set(['FOUR', 'ADD', 'TWO', 'ALL', 'EVERY', 'SAME', 'OTHER', 'NOT', 'HALF', 'EACH', 'BOTH', 'AND', 'ONE', 'OUTSIDE', 'ON', 'SSS', 'SAS', 'ASA', 'AAS', 'HL', 'IS', 'ARE', 'OR']);
  it('twC leaves words, hyphenated words and other capitals alone', () => {
    const t = relabel(rng(5), 'ABCDO', 'O');
    expect(twC('ONE PART, A-frame, SAS, AB and O', t)).toMatch(/^ONE PART, A-frame, SAS, [A-Z]{2} and O$/);
  });
  it('every capital token is made of figure points (or is a word); no article turned into a point letter (250 seeds)', () => {
    for (const { sg, f } of ALL) for (let s = 1; s <= 250; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, sg) as CItem;
      if (!it.picture?.cfig) continue;
      const pts = new Set<string>([...it.picture.cfig.fig.points.map(p => p.name), 'O']);
      const texts = [it.prompt, ...(it.choices ?? []), ...it.solution].map(x => x.replace(/<[^>]+>/g, ''));
      for (const tx of texts) {
        expect(tx, `${f}: protected-prose marks left`).not.toMatch(/[⟦⟧]/);
        expect(tx, `${f}: an article relabelled`).not.toMatch(/\b[B-Z] (diameter|translation|dilation|line|tangent|circle|secant|point|step|proof|right|student|camera|satellite|coach|quadrilateral|figure|chord|radius|look|central|inscribed|semicircle)\b/);
        for (const m of tx.matchAll(/(?<![A-Za-z\-])[A-Z]{1,4}(?![A-Za-z\-])/g)) {
          const w = m[0];
          if (WORDS.has(w)) continue;
          if (w === 'A' && /^ (?!(?:is|and|lies|lie|on|to|of|or))[a-z]{2,}/.test(tx.slice(m.index! + 1)) && /(^|[.:;!?]\s+|[“"(]\s*)$/.test(tx.slice(0, m.index))) continue;   // the article
          expect([...w].every(ch => pts.has(ch)), `${f}: "${w}" in "${tx}"`).toBe(true);
        }
      }
    }
  }, 300000);
});
