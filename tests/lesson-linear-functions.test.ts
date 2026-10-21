// lesson-linear-functions: the generic checks (every family x every sub-goal it serves x 300 seeds), then the topic's
// own checks: the exact maths, misconception probes, control characters in every string (TeX tab bugs), every practice
// picture lays out in the LineModel block, and the voice lines match the panel script.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS, MC, type LFItem } from '../src/lesson/topics/linear-functions/items';
import { PLAN } from '../src/lesson/topics/linear-functions/plan';
import { eqHtml, eqTex, evalLine, interceptOf, linearity, qNum, slopeOf, windowFor } from '../src/lesson/topics/linear-functions/lfMaths';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-33-linear-functions-and-slope-intercept-form.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('linear-functions: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
  it('has about 35 families, every one used, every sub-goal with at least two', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    expect(used.size).toBeGreaterThanOrEqual(30);
    expect([...used].sort()).toEqual(Object.keys(GENERATORS).sort());
    for (const p of PLAN) expect(p.families.length, p.id).toBeGreaterThanOrEqual(2);
  });
});

describe('linear-functions: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.length, item.prompt).toBeGreaterThanOrEqual(2);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        }
        // the variety often lives in the picture (the table, the graph), so it counts too
        seen.add(item.prompt + '|' + item.board + '|' + JSON.stringify((item as LFItem).picture?.lf.lm ?? ''));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ---------- every string an item shows: no control characters (a "\t" in a TS template string is a TAB, not \t) ----------
const CTRL = /[\u0000-\u001f\u007f]/;
function strings(it: LFItem): string[] {
  const out = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution, it.unit ?? '', it.pairLead ?? '', it.pairOp ?? '', it.pairTail ?? '', ...(it.slateTex ?? [])];
  const pic = it.picture?.lf;
  if (pic) {
    out.push(...(pic.tex ?? []), ...(pic.pre ?? []), pic.lm.x.name, pic.lm.y.name);
    if (pic.lm.table) out.push(...pic.lm.table.xHead, ...pic.lm.table.yHead);
    for (const L of pic.lm.lines ?? []) if (L.name) out.push(L.name);
    for (const P of pic.lm.pts ?? []) if (P.name) out.push(P.name);
  }
  if (it.choices) it.choices.forEach((_, i) => out.push(it.check({ kind: 'choice', i }).say));
  out.push(it.check(it.answer).say);
  return out;
}
describe('linear-functions: strings', () => {
  it('no control characters (tabs, newlines) in any board, label, choice, solution or feedback', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 80; s++) {
      const it = GEN[f]!(rng(s * 13 + 5), s, p.id) as LFItem;
      for (const str of strings(it)) expect(CTRL.test(str), `${f}: ${JSON.stringify(str)}`).toBe(false);
    }
  });
  it('TeX never holds an ASCII "-" where HTML is meant, and HTML never holds TeX commands', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 40; s++) {
      const it = GEN[f]!(rng(s * 17 + 3), s, p.id) as LFItem;
      for (const h of [it.prompt, ...(it.choices ?? []), ...it.solution]) expect(/\\(frac|tfrac|dfrac|cdot|text)\b/.test(h), `${f}: ${h}`).toBe(false);
      for (const h of [it.prompt, ...(it.choices ?? [])]) expect(/[\s(]-\d/.test(h.replace(/<[^>]+>/g, '')), `${f} ASCII minus: ${h}`).toBe(false);
    }
  });
  it('every misconception id in the MC table is in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

// ---------- the maths ----------
describe('linear-functions: lfMaths', () => {
  it('slope, intercept, evaluation are exact', () => {
    expect(qNum(slopeOf(2, 34, 4, 50)!)).toBe(8);
    expect(qNum(slopeOf(4, 50, 2, 34)!)).toBe(8);           // order does not matter when it is consistent
    expect(slopeOf(3, 1, 3, 7)).toBeNull();                  // vertical: no finite slope
    expect(qNum(slopeOf(-1.5, 2, 0.5, 3)!)).toBe(0.5);
    expect(qNum(interceptOf(8, 2, 34))).toBe(18);
    expect(qNum(interceptOf(-2, 5, 85))).toBe(95);
    expect(qNum(evalLine(0.4, 25, 3))).toBe(26.2);           // no float drift
    expect(qNum(evalLine(2 / 3, 1, 3))).toBe(3);
  });
  it('linearity: equal rates per unit, also with unequal input steps; squares are not linear', () => {
    expect(linearity([1, 2, 4, 7], [5, 8, 14, 23]).linear).toBe(true);
    expect(linearity([1, 2, 3, 4], [1, 4, 9, 16]).linear).toBe(false);
    expect(linearity([3, 1, 2], [9, 5, 7]).linear).toBe(true);   // rows out of order
    expect(linearity([0, 1, 2, 3], [5, 8, 11, 15]).firstBreak).toBe(2);
  });
  it('writes equations in every form', () => {
    expect(eqTex(8, 18, { x: 'h', y: 'C' })).toBe('C = 8h + 18');
    expect(eqTex(-2, 95, { x: 't', y: 'B', form: 'b+mx' })).toBe('B = 95 - 2t');
    expect(eqTex(1, -3)).toBe('y = x - 3');
    expect(eqTex(-1, 4)).toBe('y = -x + 4');
    expect(eqTex(0, 7)).toBe('y = 7');
    expect(eqTex(3, 0)).toBe('y = 3x');
    expect(eqTex(2 / 3, 1, { frac: true })).toBe('y = \\tfrac{2}{3}x + 1');
    expect(eqHtml(-0.5, -2)).toBe('<i>y</i> = −0.5<i>x</i> − 2');
  });
  it('windows end on grid lines and hold the values', () => {
    const w = windowFor([34, 66, 18]);
    expect(w.min).toBe(0); expect(w.max % w.step).toBe(0); expect(w.max).toBeGreaterThanOrEqual(66);
  });
});

// ---------- misconception probes: the main slips are classified ----------
function find(f: string, sg: string, pred: (it: LFItem) => boolean): LFItem {
  for (let s = 1; s < 4000; s++) { const it = GEN[f]!(rng(s), s, sg) as LFItem; if (pred(it)) return it; }
  throw new Error(`no ${f} item found`);
}
const num = (it: LFItem, v: number) => it.check({ kind: 'num', v });
describe('linear-functions: misconception probes', () => {
  it('tableRate: the change per row with steps of 2 is ignores-input-step', () => {
    const it = find('tableRate', 'rate-uneven-steps', x => x.picture!.lf.lm.step!.run === 2);
    const S = it.picture!.lf.lm.step!;
    expect(num(it, S.rise).mc).toBe(MC.inputStep);
  });
  it('startTable: the first shown output is first-output-as-intercept; y + mx is the back-solve sign error', () => {
    const it = find('startTable', 'extrapolate-initial-value', x => !!x.picture!.lf.lm.table && x.picture!.lf.lm.lines![0]!.m > 0);
    const T = it.picture!.lf.lm.table!, L = it.picture!.lf.lm.lines![0]!;
    expect(num(it, T.ys[0]!).mc).toBe(MC.firstOut);
    expect(num(it, T.ys[0]! + L.m * T.xs[0]!).mc).toBe(MC.backSign);
    expect(num(it, L.b).ok).toBe(true);
  });
  it('startGraph: reading the window edge is window-edge-as-axis', () => {
    const it = find('startGraph', 'extrapolate-initial-value', () => true);
    const lm = it.picture!.lf.lm, L = lm.lines![0]!;
    expect(lm.x.min).toBeGreaterThan(0);
    expect(num(it, L.m * lm.x.min + L.b).mc).toBe(MC.window);
  });
  it('twoPointRate: opposite subtraction orders give the opposite sign', () => {
    const it = find('twoPointRate', 'slope-two-points', () => true);
    expect(num(it, -(it.answer as { v: number }).v).mc).toBe(MC.order);
  });
  it('eqTwoPoints: right slope with a shown output as b is first-output-as-intercept', () => {
    const it = find('eqTwoPoints', 'equation-from-two-points', x => { const p = x.picture!.lf.lm.pts!; return p[0]!.y !== (x.answer as { y: number }).y; });
    const a = it.answer as { x: number; y: number }, P = it.picture!.lf.lm.pts![0]!;
    expect(it.check({ kind: 'pair', x: a.x, y: P.y }).mc).toBe(MC.firstOut);
    expect(it.check({ kind: 'pair', x: a.y, y: a.x }).mc === MC.swap || a.x === a.y).toBe(true);
  });
  it('storyPair: the amount for 10 miles as the slope is ignores-input-step', () => {
    const it = find('storyPair', 'write-from-description', x => x.picture!.lf.lm.step!.run > 1);
    const S = it.picture!.lf.lm.step!, a = it.answer as { x: number; y: number };
    expect(it.check({ kind: 'pair', x: S.rise, y: a.y }).mc).toBe(MC.inputStep);
    expect(it.check({ kind: 'pair', x: a.x, y: 0 }).mc).toBe(MC.dropStart);
  });
  it('doubleInput: doubling the total is scales-non-proportional', () => {
    const it = find('doubleInput', 'proportional-contrast', () => true);
    const P = it.picture!.lf.lm.pts![0]!;
    expect(num(it, 2 * P.y).mc).toBe(MC.scaleProp);
  });
  it('scaledRate: counting squares is misjudges-interval-value', () => {
    const it = find('scaledRate', 'non-unit-scales', () => true);
    const lm = it.picture!.lf.lm, [A, B] = lm.pts as [{ x: number; y: number }, { x: number; y: number }];
    const squares = ((B.y - A.y) / lm.y.step) / ((B.x - A.x) / lm.x.step);
    expect(num(it, squares).mc).toBe(MC.interval);
  });
  it('pickMB: dropping the minus sign is term-sign-dropped', () => {
    const it = find('pickMB', 'identify-m-b-in-equation', x => (x.answer as { v: number }).v < 0);
    expect(num(it, -(it.answer as { v: number }).v).mc).toBe(MC.termSign);
  });
});

// ---------- every practice picture lays out (the page falls back to a slate, but it should not need to) ----------
describe('linear-functions: pictures lay out in the LineModel block', () => {
  it('builds for every family and sub-goal', async () => {
    // words.ts measures text with a canvas; without a DOM it estimates (a little wider than real text)
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    const { LineModel } = await import('../src/lesson/topics/linear-functions/LineModel');
    const { MF } = await import('../src/lesson/runtime/stage');
    const { dusk } = await import('../src/lesson/dusk');
    const fails: string[] = [];
    let total = 0, pics = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 7 + 1), s, p.id) as LFItem;
      total++;
      if (!it.picture) continue;
      pics++;
      try { LineModel(it.picture.lf.lm, MF, dusk); } catch (e) { fails.push(`${p.id}/${f}#${s}: ${(e as Error).message}`); }
    }
    expect(pics / total, 'most items have a picture').toBeGreaterThan(0.8);
    if (fails.length) console.log(fails.join('\n'));
    expect(fails.slice(0, 12), `${fails.length} of ${pics} pictures fail`).toEqual([]);
  });
});

// ---------- voice ----------
describe('linear-functions: voice lines', () => {
  it('lines.json matches script.ts, and spoken text has no digits or symbols', async () => {
    const { LINES } = await import('../src/lesson/topics/linear-functions/script');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-functions/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).toBe(LINES[id]!.say);
      expect(/[0-9$%=+×÷<>/]/.test(l.text), `${id}: ${l.text}`).toBe(false);
      expect(CTRL.test(l.text) || CTRL.test(LINES[id]!.html), id).toBe(false);
    }
  });
});
