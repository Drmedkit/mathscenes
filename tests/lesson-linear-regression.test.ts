// lesson-linear-regression: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/linear-regression/items';
import { PLAN } from '../src/lesson/topics/linear-regression/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-16-linear-regression-and-correlation"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('linear-regression: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('linear-regression: families', () => {
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
        seen.add(item.prompt + '|' + item.board + '|' + JSON.stringify(item.picture ?? null));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- topic checks ----------
import { lsrl, residuals, rd, sumSq, tieFree } from '../src/lesson/topics/linear-regression/regMaths';
import { CARS, CAR_LINES, STOP, STUDY } from '../src/lesson/topics/linear-regression/lessonData';
import { MC, type RItem } from '../src/lesson/topics/linear-regression/items';
import type { RG } from '../src/lesson/topics/linear-regression/kit';
import { explain } from '../src/lesson/topics/linear-regression/explain';
import { LINES } from '../src/lesson/topics/linear-regression/script';
import { PLACEMENT } from '../src/lesson/topics/linear-regression/placement';
import { plain } from '../src/lesson/runtime/item';

const make = (f: string, s: number) => GEN[f]!(rng(s * 97 + 3), s) as RItem;
const many = (f: string, n = 200) => Array.from({ length: n }, (_, s) => make(f, s + 1));
/** the data points a plane shows (dots and highlighted dots, not line points), in data order */
const ptsOf = (g: RG) => g.items.filter(i => i.kind === 'point' && /^(pts|hot)#/.test(i.key)).map(i => i as { x: number; y: number; key: string }).sort((a, b) => Number(a.key.split('#')[1]) - Number(b.key.split('#')[1]));
const pickT = (it: RItem) => plain(it.choices![(it.answer as { i: number }).i]!);
const num = (s: string) => Number(s.replace('−', '-'));

describe('linear-regression: the lesson data', () => {
  it('cars: line C is the rounded least-squares line, and the three sums of squares are as stated', () => {
    const f = lsrl(CARS.xs, CARS.ys);
    expect(rd(f.a, 1)).toBe(CAR_LINES.C.a); expect(rd(f.b, 2)).toBe(CAR_LINES.C.b); expect(rd(f.r, 2)).toBe(-0.96);
    expect(tieFree(f.a, 1)).toBe(true); expect(tieFree(f.b, 2)).toBe(true); expect(tieFree(f.r, 2)).toBe(true);
    const sse = (l: { a: number; b: number }) => sumSq(residuals(CARS.xs, CARS.ys, l.a, l.b));
    expect(rd(sse(CAR_LINES.A), 1)).toBe(19.8); expect(rd(sse(CAR_LINES.B), 1)).toBe(62); expect(rd(sse(CAR_LINES.C), 1)).toBe(8.6);
    const eA = residuals(CARS.xs, CARS.ys, CAR_LINES.A.a, CAR_LINES.A.b);
    expect(Math.abs(eA[0]!)).toBeLessThan(1e-9); expect(Math.abs(eA[7]!)).toBeLessThan(1e-9); expect(eA.slice(1, 7).every(e => e > 0)).toBe(true);
    expect(residuals(CARS.xs, CARS.ys, 28, -0.2).filter(e => Math.abs(e) < 1e-9).length).toBe(3);
    expect(residuals(CARS.xs, CARS.ys, 23.9, -0.12).every(e => Math.abs(e) > 0.2)).toBe(true);
    expect(rd(14 - (23.9 - 0.12 * 95), 2)).toBe(1.5);
    const eC = residuals(CARS.xs, CARS.ys, 23.9, -0.12);
    expect(eC.slice(1).filter((e, i) => Math.sign(e) !== Math.sign(eC[i]!)).length).toBeGreaterThanOrEqual(4);
  });
  it('study: the LinReg output on the board, the prediction and the residual', () => {
    const f = lsrl(STUDY.xs, STUDY.ys);
    expect(rd(f.a, 4)).toBe(53.1792); expect(rd(f.b, 4)).toBe(4.6918); expect(rd(f.r, 4)).toBe(0.9407); expect(rd(f.r2, 4)).toBe(0.8849);
    expect(rd(53.18 + 4.69 * 8, 2)).toBe(90.7); expect(rd(81 - 90.7, 2)).toBe(-9.7);
    expect(STUDY.ys[STUDY.xs.indexOf(8)]).toBe(81);
  });
  it('stopping distance: r = 0.99, the rounded line, and a U of residual signs', () => {
    const f = lsrl(STOP.xs, STOP.ys);
    expect(rd(f.r, 2)).toBe(0.99); expect(rd(f.a, 1)).toBe(-91); expect(rd(f.b, 2)).toBe(5.52);
    expect(residuals(STOP.xs, STOP.ys, STOP.a, STOP.b).map(e => (e > 0 ? '+' : '-')).join('')).toBe('+++------++');
    expect(Math.round(STOP.a + STOP.b * 70)).toBe(295);
  });
});

describe('linear-regression: answers recomputed from what the student sees', () => {
  it('rSign / steepTight / strengthResid: r from the plotted points', () => {
    for (const it of many('rSign')) { const p = ptsOf(it.picture!.g!); const r = rd(lsrl(p.map(q => q.x), p.map(q => q.y)).r, 2); expect(num(pickT(it).replace('r = ', '')), it.prompt).toBeCloseTo(r, 9); }
    const rOf = (g: RG) => lsrl(ptsOf(g).map(q => q.x), ptsOf(g).map(q => q.y)).r;
    for (const it of many('steepTight')) {
      const r1 = rd(rOf(it.picture!.g!), 2), r2 = rd(rOf(it.picture!.g2!), 2);
      expect(pickT(it)).toBe(`A: r = ${r1.toFixed(2).replace('-', '−')}; B: r = ${r2.toFixed(2).replace('-', '−')}`);
      expect(Math.abs(Math.abs(r1) - Math.abs(r2))).toBeGreaterThanOrEqual(0.15);
    }
    for (const it of many('strengthResid')) {
      const a = Math.abs(rOf(it.picture!.g!)), b = Math.abs(rOf(it.picture!.g2!));
      expect(pickT(it).startsWith(`Plot ${a > b ? 'A' : 'B'}`)).toBe(true);
      expect(Math.abs(a - b)).toBeGreaterThanOrEqual(0.15);
    }
  });
  it('readOutput / lsrlData / rData / readR: technology answers from the shown data, never near a rounding tie', () => {
    for (const it of [...many('lsrlData'), ...many('readOutput')]) {
      const p = ptsOf(it.picture!.g!), f = lsrl(p.map(q => q.x), p.map(q => q.y));
      expect(it.answer).toEqual({ kind: 'pair', x: rd(f.a, 2), y: rd(f.b, 2) });
      expect(tieFree(f.a, 2, 0.04) && tieFree(f.b, 2, 0.04)).toBe(true);
    }
    for (const it of [...many('rData'), ...many('readR')]) {
      const p = ptsOf(it.picture!.g!), f = lsrl(p.map(q => q.x), p.map(q => q.y));
      expect((it.answer as { v: number }).v).toBe(rd(f.r, 2));
      expect(tieFree(f.r, 2, 0.04)).toBe(true);
    }
  });
  it('the least-squares models stated in prompts are the rounded least-squares lines of the plotted data', () => {
    for (const f of ['slopeSentence', 'interceptMeaning', 'interExtra', 'scope', 'scopeWhich', 'residMeaning', 'residCompare', 'slopeChange', 'extraNonsense', 'residual', 'predict']) for (const it of many(f, 80)) {
      const t = plain(it.prompt), m = t.match(/ŷ = (−?[\d.,]+) ([+−]) ([\d.]+)x/);
      if (!m || !it.picture?.g || /calculator\) (The line is|The fitted line)/.test(t)) continue;
      if (/no calculator/.test(t)) continue;   // integer teaching models, not least-squares output
      const p = ptsOf(it.picture.g), L = lsrl(p.map(q => q.x), p.map(q => q.y));
      const A0 = num(m[1]!.replace(/,/g, '')), B0 = (m[2] === '−' ? -1 : 1) * Number(m[3]);
      const da = (m[1]!.split('.')[1] ?? '').length;
      expect(Math.abs(A0 - L.a), `${f}: ${t} a=${L.a}`).toBeLessThanOrEqual(0.5 * 10 ** -da + 1e-9);
      expect(Math.abs(B0 - L.b), `${f}: ${t} b=${L.b}`).toBeLessThanOrEqual(0.005 + 1e-9);
    }
  });
  it('interExtra: the classification follows the observed x-interval of the plotted data', () => {
    for (const it of many('interExtra')) {
      const xs = ptsOf(it.picture!.g!).map(q => q.x), x0 = num(it.board.replace('x = ', '').replace(/\{,\}/g, ''));
      const inside = x0 >= Math.min(...xs) && x0 <= Math.max(...xs);
      expect(pickT(it).startsWith(inside ? 'Interpolation' : 'Extrapolation'), plain(it.prompt)).toBe(true);
    }
  });
  it('rStrongest: the right value has the largest (smallest) size, with a clear gap', () => {
    for (const it of many('rStrongest')) {
      const vs = it.choices!.map(c => num(plain(c).replace('r = ', ''))), strongest = /strongest/.test(it.prompt);
      const sizes = vs.map(Math.abs).sort((a, b) => b - a), target = num(pickT(it).replace('r = ', ''));
      expect(Math.abs(target)).toBe(strongest ? sizes[0] : sizes[sizes.length - 1]);
      expect(strongest ? sizes[0]! - sizes[1]! : sizes[sizes.length - 2]! - sizes[sizes.length - 1]!).toBeGreaterThanOrEqual(0.1 - 1e-9);
    }
  });
  it('pattern: the residual plot shows what the right choice names', () => {
    for (const it of many('pattern')) {
      const e = it.picture!.g2!.items.filter(i => i.kind === 'point').map(i => (i as { y: number }).y), r = pickT(it);
      if (r.startsWith('A curved')) expect(e[0]! > 0 && e[e.length - 1]! > 0).toBe(true);
      if (r.startsWith('One large')) { const s = e.map(Math.abs).sort((a, b) => b - a); expect(s[0]! > 2 * s[1]!).toBe(true); }
    }
  });
});

describe('linear-regression: misconceptions are diagnosed', () => {
  it('typical slips map to their catalogue ids', () => {
    const seen = new Set<string>();
    for (const f of Object.keys(GEN)) for (const it of many(f, 60)) {
      if (it.choices) it.choices.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
      if (it.input === 'num') { const v = (it.answer as { v: number }).v; for (const w of [-v, Math.abs(v)]) { const mc = it.check({ kind: 'num', v: w }).mc; if (mc) seen.add(mc); } }
      if (it.input === 'pair') { const a = it.answer as { x: number; y: number }; const mc = it.check({ kind: 'pair', x: a.y, y: a.x }).mc; if (mc) seen.add(mc); }
    }
    for (const m of seen) expect(CATALOG.has(m), m).toBe(true);
    for (const id of [MC.residSign, MC.swapAB, MC.signedTotal, MC.steepness, MC.signedOrder, MC.causation, MC.highR, MC.rAny, MC.firstLast, MC.mostPoints, MC.equalCounts, MC.levels, MC.interpSafe, MC.noLimit, MC.r2Share, MC.r2Across, MC.alwaysDelete, MC.equalInfluence])
      expect(seen.has(id), id).toBe(true);
  });
  it('residual: ŷ − y is a residual-sign error', () => {
    for (const it of many('residual', 80)) { const v = (it.answer as { v: number }).v; if (Math.abs(v) > 1e-9) expect(it.check({ kind: 'num', v: -v }).mc).toBe(MC.residSign); }
  });
});

describe('linear-regression: texts, voice, check-in', () => {
  it('texts are clean (no undefined, NaN, "+ −3", double spaces, "a apple")', () => {
    const BAD = /\(undefined|undefined[,)]|NaN|\[object|Infinity|\+\s*[-−]\s*\d|\s{2,}\S|−\s*−/i, ART = /\ba (?!is\b)[aeiou]\w/;
    for (const f of Object.keys(GEN)) for (const it of many(f, 60)) for (const t of [it.prompt, ...(it.choices ?? []), ...it.solution]) { expect(plain(t), `${f}: ${t}`).not.toMatch(BAD); expect(plain(t), `${f}: ${t}`).not.toMatch(ART); }
  });
  it('every item has worked steps that arrive at its answer', () => {
    for (const f of Object.keys(GEN)) for (const it of many(f, 60)) {
      const ex = explain(it);
      expect(ex, `${f}: ${it.solution.join(' | ')}`).not.toBeNull();
      expect(it.check(ex!.result).ok, `${f}: ${it.solution.join(' | ')} -> ${JSON.stringify(ex!.result)}`).toBe(true);
    }
  });
  it('lines.json matches script.ts, and spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-regression/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) { expect(lines[k]!.text, k).toBe(v.say); expect(v.say, k).not.toMatch(/[0-9=+÷×−<>/√%$ŷ²]/); }
  });
  it('the check-in picks exist in the plan', () => {
    for (const p of PLACEMENT.picks) expect(PLAN.find(s => s.id === p.subgoal)?.families, p.family).toContain(p.family);
  });
});

describe('linear-regression: pictures fit their windows', () => {
  it('every point, segment and text of a practice plane lies inside its window; windows have 2-20 cells', () => {
    const inside = (g: RG, x: number, y: number) => x >= g.x.min - 1e-9 && x <= g.x.max + 1e-9 && y >= g.y.min - 1e-9 && y <= g.y.max + 1e-9;
    for (const f of Object.keys(GEN)) for (const it of many(f, 120)) for (const g of [it.picture?.g, it.picture?.g2]) {
      if (!g) continue;
      const nx = Math.round((g.x.max - g.x.min) / g.x.step), ny = Math.round((g.y.max - g.y.min) / g.y.step);
      expect(nx >= 2 && nx <= 20 && ny >= 2 && ny <= 20, `${f}: ${JSON.stringify([g.x, g.y])}`).toBe(true);
      for (const i of [...g.items, ...(g.solveItems ?? [])]) {
        if (i.kind === 'point' || i.kind === 'text') expect(inside(g, i.x, i.y), `${f} ${i.key} (${i.x}, ${i.y}) ${JSON.stringify([g.x, g.y])}`).toBe(true);
        if (i.kind === 'seg') expect(inside(g, i.a[0], i.a[1]) && inside(g, i.b[0], i.b[1]), `${f} ${i.key}`).toBe(true);
      }
    }
  });
  it('quantities that cannot be negative stay on non-negative windows', () => {
    for (const f of Object.keys(GEN)) for (const it of many(f, 120)) {
      const g = it.picture?.g;
      if (g && !g.resid && ptsOf(g).every(p => p.x >= 0)) expect(g.x.min, `${f}`).toBeGreaterThanOrEqual(0);
      if (g && !g.resid && ptsOf(g).every(p => p.y >= 0)) expect(g.y.min, `${f}`).toBeGreaterThanOrEqual(0);
    }
  });
});
