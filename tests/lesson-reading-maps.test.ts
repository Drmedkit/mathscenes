// lesson-reading-maps: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/reading-maps/items';
import { PLAN } from '../src/lesson/topics/reading-maps/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/primary.geometry.read-map-scale-legend-distance.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as unknown as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('reading-maps: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('reading-maps: families', () => {
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
import { MC, type RmItem } from '../src/lesson/topics/reading-maps/items';
import { along, fh, fp, ft, fx, lineProblems, mapProblems, polyLen, slice } from '../src/lesson/topics/reading-maps/mapMaths';
import { lessonMap } from '../src/lesson/topics/reading-maps/lessonMap';
import { SCRIPT } from '../src/lesson/topics/reading-maps/script';
const LINES = JSON.parse(fs.readFileSync('pages/lessons/reading-maps/voice/lines.json', 'utf8')) as Record<string, { text: string }>;

describe('reading-maps: maths', () => {
  it('writes quarter numbers exactly', () => {
    expect(fx(2.75)).toBe('2¾'); expect(fx(0.5)).toBe('½'); expect(fx(3)).toBe('3');
    expect(ft(5.5)).toBe('5\\tfrac{1}{2}'); expect(fp(1.25)).toBe('1 1/4'); expect(fh(0.25)).toContain('class="fr"');
  });
  it('measures along a polyline', () => {
    const P: [number, number][] = [[0, 0], [4, 0], [4, 3]];
    expect(polyLen(P)).toBe(7);
    expect(along(P, 5).p).toEqual([4, 1]);
    expect(polyLen(slice(P, 3, 6))).toBeCloseTo(3, 9);
  });
  it('the lesson map: 7 in by road (14 mi), 5 in straight (10 mi); 3 1/2 in and 2 1/2 in to Pinecrest; trail 5 1/2 in', () => {
    const m = lessonMap('e'), route = m.ov.find(o => o.id === 'route')!;
    expect(route.k === 'route' && polyLen(route.pts)).toBe(7);
    const st = m.ov.find(o => o.id === 'str')!;
    expect(st.k === 'straight' && Math.hypot(st.b[0] - st.a[0], st.b[1] - st.a[1])).toBeCloseTo(5, 9);
    const t = lessonMap('t'), r2 = t.ov.find(o => o.id === 'route')!, s2 = t.ov.find(o => o.id === 'str')!;
    expect(r2.k === 'route' && polyLen(r2.pts)).toBeCloseTo(3.5, 9);
    expect(s2.k === 'straight' && Math.hypot(s2.b[0] - s2.a[0], s2.b[1] - s2.a[1])).toBeCloseTo(2.5, 9);
    const p = lessonMap('p'), tr = p.ov.find(o => o.id === 'route')!;
    expect(tr.k === 'route' && polyLen(tr.pts)).toBeCloseTo(5.5, 9);
  });
  it('the lesson map lays out cleanly in every part', () => {
    for (const part of ['q', 'e', 't', 'p'] as const) expect(mapProblems(lessonMap(part)).join('; '), part).toBe('');
  });
});

describe('reading-maps: pictures and diagnosis', () => {
  it('every misconception id is in the catalog', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
  it('every item has a clean picture (map or number line) and a solve answer', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 97 + 3), s, p.id) as RmItem;
      expect(!!(it.picture.map || it.picture.line), f).toBe(true);
      if (it.picture.map) expect(mapProblems(it.picture.map), `${f} ${s}`).toEqual([]);
      if (it.picture.line) expect(lineProblems(it.picture.line), `${f} ${s}`).toEqual([]);
      expect(it.picture.answer.length).toBeGreaterThan(0);
      for (const o of it.picture.map?.ov ?? []) expect(/^(a|s\d)$/.test(o.id), `${f}: overlay id ${o.id}`).toBe(true);
      for (const o of it.picture.map?.ov ?? []) if (/^s\d$/.test(o.id)) expect(Number(o.id.slice(1)) < it.picture.steps, `${f}: ${o.id} beyond steps`).toBe(true);
    }
  });
  it('typical slips are classified', () => {
    const probe = (fam: string, wrong: (it: RmItem) => number, mc: string) => {
      let hit = 0;
      for (let s = 1; s <= 120; s++) {
        const it = GEN[fam]!(rng(s * 13 + 1), s) as RmItem, v = wrong(it);
        if (!Number.isFinite(v)) continue;
        const r = it.input === 'num' ? { kind: 'num' as const, v } : { kind: 'frac' as const, w: v, n: 0, d: 1 };
        const verdict = it.check(r);
        if (verdict.mc === mc) hit++;
      }
      expect(hit, `${fam} -> ${mc}`).toBeGreaterThan(10);
    };
    const ansOf = (it: RmItem) => (it.answer.kind === 'num' ? it.answer.v : it.answer.kind === 'frac' ? it.answer.w + it.answer.n / it.answer.d : NaN);
    probe('unitScale', it => { const m = /(\d+) × (\d+)/.exec(it.solution[1]!); return m ? Number(m[1]) + Number(m[2]) : NaN; }, MC.wrongForm);
    probe('errorSize', () => 0.25, MC.errNotScaled);
    probe('shiftedRuler', it => { const s = /start at \} (\d)/.exec(it.board); return s ? ansOf(it) + Number(s[1]) : NaN; }, MC.endReading);
    probe('barInterval', it => ansOf(it) * Number(/has (\d) equal/.exec(it.prompt)?.[1] ?? NaN), MC.barTotal);
    probe('sameEverywhere', it => Number(/\\to (\d+)/.exec(it.board)?.[1] ?? NaN), MC.diffScale);
  });
});

describe('reading-maps: voice', () => {
  it('every panel line of parts 1-4 has a spoken line, with no digits or symbols', () => {
    expect(Object.keys(LINES).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(LINES)) expect(/[0-9×÷=+%$½¼¾]/.test(l.text), `${id}: ${l.text}`).toBe(false);
  });
});
