// percent change: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes, choices
// unique with exactly one right, misconception ids exist, pictures are computable), the main misconceptions are
// classified, the plan covers every sub-goal of the topic JSON in order, the model's maths is exact, and every voiced
// line the page uses has a text in voice/lines.json (and no text is orphaned).
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, FAMILY_NAMES, MC, article, type ChangeItem, type FamilyId } from '../src/lesson/topics/percent-change/items';
import { PLAN } from '../src/lesson/topics/percent-change/plan';
import { apply, change, fmtMoney, fmtNum, multiplier, near, r9, roundTo, texMoney } from '../src/lesson/topics/percent-change/changeMaths';
import { computeChangeTape } from '../src/lesson/topics/percent-change/ChangeTape';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/primary.ratios.calculate-percentage-change.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;

const pairs = PLAN.flatMap(p => p.families.map(f => [f as FamilyId, p.id] as const));
const make = (f: FamilyId, sg: string, s: number): ChangeItem => GENERATORS[f](rng(s * 7919 + f.length * 31), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const pair = (x: number, y: number): Response => ({ kind: 'pair', x, y });
const sgOf = (f: FamilyId) => PLAN.find(p => p.families.includes(f))!.id;

/** a rough width of a TeX line in em (MathJax NewCM, measured on the page: "\$40 = 100\%" is about 5.1 em) */
function texEm(src: string): number {
  let s = src, em = 0;
  // innermost-first: \frac{a}{b} is as wide as its wider part
  for (let guard = 0; guard < 20 && /\\frac\{/.test(s); guard++) {
    s = s.replace(/\\frac\{([^{}]*(?:\{,\}[^{}]*)*)\}\{([^{}]*(?:\{,\}[^{}]*)*)\}/, (_m, a: string, b: string) => `§${Math.max(texEm(a), texEm(b)) + 0.3}§`);
  }
  s = s.replace(/§([\d.]+)§/g, (_m, w: string) => { em += Number(w); return ''; });
  s = s.replace(/\\text\{([^}]*)\}/g, (_m, t: string) => { em += t.length * 0.45; return ''; });
  const TOK: [RegExp, number][] = [[/\\to/g, 1.5], [/\\times|\\div|\\approx/g, 1.2], [/\\quad/g, 1.0], [/\\ldots/g, 1.2], [/\\pm/g, 1.0],
    [/\\%/g, 0.83], [/\\\$/g, 0.5], [/\{,\}/g, 0.28], [/\\,/g, 0.17], [/\\ /g, 0.25], [/[=+-]/g, 1.1], [/[0-9a-zA-Z?:$]/g, 0.5], [/[.,|]/g, 0.28], [/[()]/g, 0.39]];
  for (const [re, w] of TOK) s = s.replace(re, () => { em += w; return ''; });
  return em;
}

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as FamilyId], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id the topic names is used by some family', () => {
    if (!existsSync(TOPIC)) return;
    const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { misconceptions: string[] }[] };
    const named = new Set(t.subgoals.flatMap(s => s.misconceptions));
    const used = new Set(Object.values(MC));
    for (const m of named) expect(used.has(m as never), m).toBe(true);
    if (mcIds) for (const m of used) expect(mcIds.has(m), m).toBe(true);
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, pictures computable`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        const v = it.check(it.answer);
        expect(v.ok, `${it.prompt} ${JSON.stringify(it.answer)} -> ${v.say}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, ...it.solution, ...(it.choices ?? [])]) expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object/);
        if (it.input === 'num') expect(it.answer.kind).toBe('num');
        if (it.answer.kind === 'num') expect(Number.isFinite(it.answer.v)).toBe(true);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          expect(it.choices.length).toBeGreaterThanOrEqual(3);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(x => x.ok).length, it.choices.join(' | ')).toBe(1);
          if (mcIds) for (const x of verdicts) if (x.mc) expect(mcIds.has(x.mc), x.mc).toBe(true);
          for (const x of verdicts) expect(x.say.length).toBeGreaterThan(10);
        }
        // a wrong numeric answer gets a verdict with readable words and a known mc (if any)
        if (it.answer.kind === 'num') {
          const w = it.check(num(it.answer.v + 1));
          expect(w.ok).toBe(false);
          if (w.mc && mcIds) expect(mcIds.has(w.mc), w.mc).toBe(true);
          expect(it.check(num(NaN)).ok).toBe(false);
        }
        if (it.answer.kind === 'pair') {
          const w = it.check(pair(it.answer.y, it.answer.x));
          if (!near(it.answer.x, it.answer.y)) expect(w.ok).toBe(false);
        }
        for (const t of [it.tape, ...(it.pair ?? [])]) if (t) {
          const m = computeChangeTape(t.amounts);
          expect(t.names.length).toBe(t.amounts.length);
          for (const nm of t.names) expect(nm).not.toMatch(/[\\{}$%#&_^~]/);
          for (const ch of m.changes.slice(1)) expect(ch!.pct).toBeGreaterThanOrEqual(0);
        }
        // the board line fits: beside a picture the slate is 512 px (>= 60 px type), bare it is 1180 px (>= 70 px)
        if (!it.pair) expect(texEm(it.board), it.board).toBeLessThanOrEqual(it.tape ? 512 / 60 : 1180 / 70);
        seen.add(it.prompt + it.board + (it.choices ?? []).join());
      }
      expect(seen.size, `${f}: distinct items`).toBeGreaterThan(f === 'over100Why' || f === 'order' || f === 'noCancelWhy' || f === 'compose' ? 12 : 30);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  const each = (f: FamilyId, fn: (it: ChangeItem) => void) => { for (let s = 1; s <= 300; s++) fn(make(f, sgOf(f), s)); };
  it('the base: the new amount picked is named by why it was picked', () => {
    each('base', it => {
      const [a, b] = it.tape!.amounts as [number, number];
      const i = it.choices!.findIndex(c => c === fmtMoney(b) || c.startsWith(fmtNum(b) + ' '));
      const v = it.check({ kind: 'choice', i });
      expect(v.ok).toBe(false);
      expect([MC.firstMentioned, MC.bySize, MC.newBase]).toContain(v.mc);
      if (/^(This year|Now|In 2025|This season|In August|In the spring|In May|A pair of sneakers costs)/.test(it.prompt)) expect(v.mc).toBe(MC.firstMentioned);
      void a;
    });
  });
  it('percent of the original: the raw difference, the new amount as base, the percent OF', () => {
    let nb = 0;
    each('benchPct', it => {
      const [a, b] = it.tape!.amounts as [number, number];
      const c = change(a, b);
      if (!near(c.size, c.pct)) expect(it.check(num(c.size)).mc).toBe(MC.diffAsPct);
      const byNew = r9((c.size / b) * 100);
      if (b > 0 && !near(byNew, c.pct) && !near(byNew, c.size)) { expect(it.check(num(byNew)).mc).toBe(MC.newBase); nb++; }
      if (!near(c.pctOf, c.pct) && !near(c.pctOf, c.size)) expect(it.check(num(c.pctOf)).mc).toBe(MC.pctOfAsChange);
    });
    expect(nb).toBeGreaterThan(100);
  });
  it('compute percent change: the unscaled decimal', () => {
    each('pctChange', it => {
      const p = (it.answer as { v: number }).v;
      const [a, b] = it.tape!.amounts as [number, number];
      if (p > 0 && !near(p / 100, change(a, b).size)) expect(it.check(num(p / 100)).mc).toBe(MC.unscaled);
    });
  });
  it('apply a percent: the change reported as the final amount, the percent numeral added', () => {
    for (const f of ['twoStepUp', 'twoStepDown'] as const) each(f, it => {
      const ans = it.answer as { x: number; y: number };
      const a = it.tape!.amounts[0]!, p = r9((ans.x / a) * 100);
      if (!near(ans.x, ans.y)) expect(it.check(pair(ans.x, ans.x)).mc).toBe(MC.changeAsFinal);
      const byNumeral = f === 'twoStepUp' ? a + p : a - p;
      if (!near(p, ans.x) && !near(byNumeral, ans.x)) expect(it.check(pair(p, byNumeral)).mc).toBe(MC.numeral);
    });
  });
  it('the multiplier: the rate alone is the change, not the new amount', () => {
    each('multNum', it => {
      const m = (it.answer as { v: number }).v;
      expect(it.check(num(r9(Math.abs(m - 1)))).mc).toBe(MC.changeAsFinal);
    });
  });
  it('by vs to: the new amount given as the change', () => {
    let hit = 0;
    each('byTo', it => {
      if (!it.tape?.hideChange) return;
      const [, b] = it.tape.amounts as [number, number];
      expect(it.check(num(b)).mc).toBe(MC.byTo); hit++;
    });
    expect(hit).toBeGreaterThan(60);
  });
  it('successive changes: both percents taken of the first amount', () => {
    let hit = 0;
    each('successive', it => {
      const [a, mid, fin] = it.tape!.amounts as [number, number, number];
      const m1 = mid / a, m2 = fin / mid, added = r9(a * (m1 + m2 - 1));
      if (!near(added, fin)) { expect(it.check(num(added)).mc).toBe(MC.addsSucc); hit++; }
    });
    expect(hit).toBeGreaterThan(200);
  });
  it('undo a change: the same percent back', () => {
    each('undo', it => {
      const [a, mid] = it.tape!.amounts as [number, number];
      expect(it.check(num(change(a, mid).pct)).mc).toBe(MC.addsSucc);
    });
  });
  it('percent error: the estimate as base, a negative error', () => {
    let nb = 0;
    each('pctError', it => {
      const [acc, est] = it.tape!.amounts as [number, number];
      const ans = (it.answer as { v: number }).v, rounded = /nearest tenth/.test(it.prompt);
      const diff = Math.abs(est - acc), byEst = rounded ? roundTo((diff / est) * 100, 1) : r9((diff / est) * 100);
      if (!near(byEst, ans)) { expect(it.check(num(byEst)).mc).toBe(MC.newBase); nb++; }
      expect(it.check(num(-ans)).mc).toBe(MC.negError);
    });
    expect(nb).toBeGreaterThan(200);
  });
  it('over 100%: the percent OF read as the increase', () => {
    let hit = 0;
    each('over100', it => {
      if (!/By what percent/.test(it.prompt)) return;
      const [a, b] = it.tape!.amounts as [number, number];
      expect(it.check(num(r9((b / a) * 100))).mc).toBe(MC.pctOfAsChange); hit++;
    });
    expect(hit).toBeGreaterThan(60);
  });
});

describe('the maths of percent change', () => {
  it('change, apply and the multiplier agree for every base and percent in range', () => {
    for (const a of [1, 7.5, 40, 64.5, 250, 999.99, 10000]) for (let tenths = 0; tenths <= 3000; tenths += 25) {
      const p = tenths / 10;
      const up = apply(a, p, 'up');
      expect(near(change(a, up).pct, p)).toBe(true);
      expect(near(up, a * multiplier(p, 'up'))).toBe(true);
      if (p <= 100) {
        const dn = apply(a, p, 'down');
        expect(near(change(a, dn).pct, p)).toBe(true);
        expect(change(a, dn).dir).toBe(p === 0 ? 'none' : 'down');
        expect(dn).toBeGreaterThanOrEqual(0);
      }
    }
    expect(() => apply(50, 120, 'down')).toThrow(/negative/);
    expect(() => change(0, 5)).toThrow(/base must be positive/);
  });
  it('equal percents up and down never cancel; the order of two multipliers does not matter', () => {
    for (const p of [5, 10, 20, 25, 50, 75]) {
      const a = 100, f1 = apply(apply(a, p, 'up'), p, 'down'), f2 = apply(apply(a, p, 'down'), p, 'up');
      expect(near(f1, f2)).toBe(true);
      expect(f1).toBeLessThan(a);
      expect(near(f1, a * (1 - (p / 100) ** 2))).toBe(true);
    }
    expect(near(change(40, 50).pct, 25)).toBe(true);
    expect(near(change(50, 40).pct, 20)).toBe(true);
  });
  it('the ChangeTape model computes each change against the row before it, and the overall against the first', () => {
    const m = computeChangeTape([40, 50, 40]);
    expect(m.changes[1]!.pct).toBe(25); expect(m.changes[1]!.dir).toBe('up');
    expect(m.changes[2]!.pct).toBe(20); expect(m.changes[2]!.dir).toBe('down');
    expect(m.overall.dir).toBe('none');
    expect(computeChangeTape([100, 120, 96]).overall.pct).toBe(4);
    expect(() => computeChangeTape([0, 5])).toThrow(/base/);
    expect(() => computeChangeTape([10, 0, 5])).toThrow(/cannot be 0/);
    expect(() => computeChangeTape([10])).toThrow(/two or three/);
  });
  it('formats money, numbers and articles the way a kid reads them', () => {
    expect(fmtMoney(40)).toBe('$40'); expect(fmtMoney(44.8)).toBe('$44.80'); expect(fmtMoney(12500)).toBe('$12,500');
    expect(fmtNum(12.5)).toBe('12.5'); expect(fmtNum(1234567)).toBe('1,234,567'); expect(roundTo(16.6666, 1)).toBe(16.7);
    expect(roundTo(86.05875, 2)).toBe(86.06); expect(texMoney(1250.5)).toBe('\\$1{,}250.50');
    expect(article('8')).toBe('an'); expect(article('80')).toBe('an'); expect(article('18')).toBe('an'); expect(article('11.5')).toBe('an');
    expect(article('180')).toBe('a'); expect(article('25')).toBe('a'); expect(article('12.5')).toBe('a');
  });
});

describe('voice', () => {
  it('every line the page says has a text, and every text is said', () => {
    const page = readFileSync('pages/lessons/percent-change.ts', 'utf8');
    const lines = JSON.parse(readFileSync('pages/lessons/percent-change/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    // the panel lines of parts 1-4: the keys of the page's V map
    const start = page.indexOf('const V: Record<string, string> = {');
    const block = page.slice(start, page.indexOf('\n};', start));
    const used = new Set([...block.matchAll(/^\s+'([eqtp]\.[a-zA-Z0-9.]+)':/gm)].map(m => m[1]!));
    expect(used.size).toBeGreaterThan(30);
    // ids said literally are panel lines too
    for (const m of page.matchAll(/(?:said|voice\.say)\(\s*'([^']+)'|saidFb\([^,]+,\s*'([^']+)'/g)) expect(used.has((m[1] ?? m[2])!), m[0]).toBe(true);
    for (const id of used) expect(lines[id], `missing voice line ${id}`).toBeTruthy();
    for (const id of Object.keys(lines)) {
      expect(used.has(id), `voice line ${id} is never used`).toBe(true);
      const t = lines[id]!.text;
      expect(t.length).toBeGreaterThan(3);
      expect(t, `${id} should be written to be read aloud`).not.toMatch(/[%$<>]|\d\/\d/);
    }
  });
});

describe('quality layer (docs/lessons/QUALITY_LAYER.md)', () => {
  it('regression: compare shows percents a student can read ("about 5.6%"), never 5.5556%', () => {
    for (let s = 1; s <= 400; s++) {
      const it = GENERATORS.compare(rng(s), s, 'absolute-vs-relative');
      for (const t of [...it.solution, ...[0, 1, 2].map(i => it.check({ kind: 'choice', i }).say)]) expect(t).not.toMatch(/\d\.\d{2,}%/);
    }
  });
  it('no-change items get two steps; the two-box items mark both boxes', () => {
    for (let s = 1; s <= 300; s++) {
      const it = GENERATORS.pctChange(rng(s), s, 'compute-percent-change');
      expect(it.solution.length, it.prompt).toBeGreaterThanOrEqual(2);
    }
    const up = GENERATORS.twoStepUp(rng(2), 1, 'apply-increase');
    expect([...up.solution.at(-1)!.matchAll(/<b class="s">/g)].length).toBe(2);
  });
});
describe('quality layer: oracle sweep fixes', () => {
  it('exactOrNot only asks about percents that never end (37.5% = 18/48 is exact, not rounded)', () => {
    for (let s = 1; s <= 600; s++) {
      const it = GENERATORS.exactOrNot(rng(s), s, 'round-results');
      const m = it.board.match(/\\frac\{(\d+)\}\{(\d+)\}/)!;
      let d = Number(m[2]) / gcdN(Number(m[1]), Number(m[2]));
      while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5;
      expect(d, it.prompt).toBeGreaterThan(1);
    }
  });
  it('round: no half-cent ties ($26 at 7.25% = $27.885); pctError: "960 jelly beans", not "960 beans jelly beans"', () => {
    for (let s = 1; s <= 600; s++) {
      const it = GENERATORS.round(rng(s), s, 'round-results');
      const m = it.board.match(/^([\d.]+) \\times ([\d.]+)$/);
      if (!/\\frac/.test(it.board)) expect(m, it.board).not.toBeNull();
      if (m) { const t = Math.round(Number(m[1]) * Number(m[2]) * 1e6) / 1e6; expect(Math.abs(t * 100 - Math.floor(t * 100) - 0.5) > 1e-6, it.prompt).toBe(true); }
      expect(GENERATORS.pctError(rng(s), s, 'percent-error').prompt).not.toMatch(/beans(<\/b>)? jelly/);
    }
  });
});
function gcdN(a: number, b: number): number { while (b) [a, b] = [b, a % b]; return a; }
