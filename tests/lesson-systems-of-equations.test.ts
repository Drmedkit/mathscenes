// lesson-systems-of-equations: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer
// passes, choices unique with exactly one right, misconception ids exist in the catalogue, every board / work line
// typesets, NO control characters anywhere: a "\t" from a bad TeX escape fails here), every picture fits the plane
// (lines visible, points inside, grid squares readable), the main misconceptions are classified, the plan covers the
// topic JSON in order, the system maths (solve, clip, text) holds, and every voiced line has a spoken text.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { FAMILIES, FAMILY_NAMES, GENERATORS, MC, elimSys, elimWork, texToHtml, type SysItem } from '../src/lesson/topics/systems-of-equations/items';
import { PLAN } from '../src/lesson/topics/systems-of-equations/plan';
import { clip, htmlLin, lin, on, solve, texLin, ySlope, nT, pairH, through } from '../src/lesson/topics/systems-of-equations/sysMaths';
import { PLANE_AREA, sysView } from '../src/lesson/topics/systems-of-equations/SysPlane';
import { tex, texReady } from '../src/core/tex';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-31-systems-of-linear-equations.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => SysItem>;
// eslint-disable-next-line no-control-regex
const CTRL = /[\u0000-\u0008\u000b-\u001f\u007f]|\t|\n/;
const BAD = /(?<!is )undefined|NaN|Infinity|\[object|\+ -|- -|\+ −|− −|−−|\+ \+|(?<![0-9.])1<i>[xy]<\/i>|(?<![0-9.])1[xy]\b/;

beforeAll(async () => { await texReady(); });

describe('systems-of-equations: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with families that exist; every family is used', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) { expect(GEN[f], f).toBeDefined(); expect(FAMILY_NAMES[f], f).toBeTruthy(); } }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
    expect(FAMILIES.length).toBeGreaterThanOrEqual(30);
  });
  it('every misconception id the families use is in the catalogue', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

/** every string an item shows or speaks (the verdicts too) */
function strings(it: SysItem): string[] {
  const p = it.picture?.sys;
  const out = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution, it.pairLead ?? '', it.pairTail ?? '', it.unit ?? ''];
  if (p) out.push(...p.eqs, ...p.work, ...(p.names ?? []), ...(p.pts ?? []).map(q => q.label ?? ''), p.crossLabel ?? '');
  if (it.choices) it.choices.forEach((_, i) => out.push(it.check({ kind: 'choice', i }).say));
  out.push(it.check(it.answer).say);
  return out;
}

describe('systems-of-equations: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.family).toBe(f);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        expect(item.solution.length).toBeGreaterThan(0);
        for (const str of strings(item)) {
          expect(str, `control character in ${f}: ${JSON.stringify(str)}`).not.toMatch(CTRL);
          expect(str, `${f}: ${str}`).not.toMatch(BAD);
        }
        if (item.choices) {
          expect(new Set(item.choices).size, item.choices.join(' | ')).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        }
        if (item.input === 'pair' && item.answer.kind === 'pair') {
          const a = item.answer;
          for (const r of [{ x: a.y, y: a.x }, { x: a.x + 1, y: a.y }, { x: a.x + 100, y: a.y - 7 }]) {
            const v = item.check({ kind: 'pair', ...r });
            if (!(r.x === a.x && r.y === a.y)) expect(v.ok, JSON.stringify(r)).toBe(false);
            if (v.mc) expect(CATALOG.has(v.mc), v.mc).toBe(true);
          }
          if (a.x !== a.y) expect(item.check({ kind: 'pair', x: a.y, y: a.x }).mc, item.prompt).toBeTruthy();
        }
        if (item.input === 'num' && item.answer.kind === 'num') {
          expect(item.check({ kind: 'num', v: item.answer.v + 1000 }).ok).toBe(false);
          expect(String(item.answer.v).length).toBeLessThanOrEqual(6);
        }
        // every board / work line typesets
        const texs = [item.board, ...(item.picture?.sys.eqs ?? []), ...(item.picture?.sys.work ?? [])];
        for (const t of texs) expect(tex(t).missing, t).toEqual([]);
        // the picture fits the plane
        const pic = item.picture?.sys;
        if (pic) {
          const v = sysView(pic.win, PLANE_AREA, pic.gx ?? 1, pic.gy ?? 1, pic.names);
          expect(v.cell).toBeGreaterThanOrEqual(30);
          for (const l of pic.lines) expect(clip(l.L, pic.win), `${f}: line ${JSON.stringify(l.L)} misses ${JSON.stringify(pic.win)}`).not.toBeNull();
          for (const q of [...(pic.pts ?? []).map(x => x.p), ...(pic.cross ? [pic.cross] : [])]) {
            expect(q[0] >= pic.win.x0 && q[0] <= pic.win.x1 && q[1] >= pic.win.y0 && q[1] <= pic.win.y1, `${f}: ${q} outside ${JSON.stringify(pic.win)}`).toBe(true);
          }
          if (pic.cross) for (const l of pic.lines) expect(on(l.L, pic.cross), `${f}: the cross is on every line`).toBe(true);
          expect(pic.eqs.length).toBeGreaterThan(0);
          expect(pic.work.length).toBeLessThanOrEqual(7);
        }
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join());
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
  it('most items carry a picture', () => {
    let n = 0, withPic = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 20; s++) { n++; if (GEN[f]!(rng(s), s, p.id).picture) withPic++; }
    expect(withPic / n).toBeGreaterThan(0.85);
  });
});

describe('the classifiers', () => {
  const find = (f: string, sg: string, pred: (it: SysItem) => boolean): SysItem => {
    for (let s = 1; s < 2000; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; }
    throw new Error(`no ${f} item`);
  };
  const mcOf = (it: Item, mc: string) => it.choices!.findIndex((_, i) => it.check({ kind: 'choice', i }).mc === mc);
  it('a pair: swapped order, one equation only and an axis intercept are diagnosed', () => {
    const it = find('readCross', 'intersection-as-solution', x => x.answer.kind === 'pair' && x.answer.x !== x.answer.y);
    const a = it.answer as { x: number; y: number };
    expect(it.check({ kind: 'pair', x: a.y, y: a.x }).mc).toBe(MC.reversed);
    const e = find('elimSolve', 'eliminate-by-adding', () => true);
    const sys = (e.picture!.sys.lines.map(l => l.L));
    const s = solve(sys[0]!, sys[1]!) as { x: number; y: number };
    // a point on line 1 only
    const L = sys[0]!;
    const q = Math.abs(L.b) > 0 ? { x: s.x + L.b, y: s.y - L.a } : { x: s.x, y: s.y + 1 };
    expect(on(L, [q.x, q.y])).toBe(true);
    expect(e.check({ kind: 'pair', ...q }).mc).toBe(MC.oneCond);
  });
  it('substitution: dropped parentheses and the first term only are diagnosed', () => {
    const it = find('subChoice', 'substitute-expression', () => true);
    expect(mcOf(it, MC.grouping)).toBeGreaterThanOrEqual(0);
    expect(mcOf(it, MC.firstTerm)).toBeGreaterThanOrEqual(0);
  });
  it('elimination: deleting terms, subtracting signs, adding equal terms and mismatched multipliers are diagnosed', () => {
    expect(mcOf(find('addEq', 'eliminate-by-adding', () => true), MC.deletes)).toBeGreaterThanOrEqual(0);
    const s = find('subEq', 'eliminate-by-subtracting', () => true);
    expect(mcOf(s, MC.addsEqual)).toBeGreaterThanOrEqual(0);
    expect(mcOf(s, MC.negFirst)).toBeGreaterThanOrEqual(0);
    expect(mcOf(find('pickMult', 'scale-both-equations', () => true), MC.multMismatch)).toBeGreaterThanOrEqual(0);
    const one = find('pickMult', 'scale-one-equation', x => x.input === 'num');
    const k = (one.answer as { v: number }).v;
    expect(one.check({ kind: 'num', v: -k }).mc).toBe(MC.addsEqual);
    expect(mcOf(find('scaleOne', 'scale-one-equation', () => true), MC.someTerms)).toBeGreaterThanOrEqual(0);
  });
  it('0 = c and 0 = 0: "x = 0", "no solution" for an identity and every point of the plane are diagnosed', () => {
    const c = find('zeroEq', 'contradiction-no-solution', () => true);
    expect(mcOf(c, MC.zeroVsNone)).toBeGreaterThanOrEqual(0);
    expect(mcOf(c, MC.divZero)).toBeGreaterThanOrEqual(0);
    const i = find('zeroEq', 'identity-infinite', () => true);
    expect(mcOf(i, MC.cancelMisread)).toBeGreaterThanOrEqual(0);
    expect(mcOf(i, MC.everyPoint)).toBeGreaterThanOrEqual(0);
  });
  it('contexts: count-and-value, swapped rates, one letter, times as many', () => {
    const w = find('writeSystem', 'model-two-constraints', () => true);
    for (const m of [MC.countValue, MC.swapRates, MC.oneLetter]) expect(mcOf(w, m)).toBeGreaterThanOrEqual(0);
    expect(mcOf(find('timesAsMany', 'model-two-constraints', () => true), MC.reverseTimes)).toBeGreaterThanOrEqual(0);
    expect(mcOf(find('viable', 'interpret-viability', x => /half|not a whole/.test(x.choices!.join())), MC.rounds)).toBeGreaterThanOrEqual(0);
  });
});

describe('system maths', () => {
  it('solves one, none and infinitely many', () => {
    expect(solve(lin(1, 1, 7), lin(1, -1, 1))).toEqual({ kind: 'one', x: 4, y: 3 });
    expect(solve(ySlope(2, 3), ySlope(2, -1)).kind).toBe('none');
    expect(solve(lin(1, 1, 4), lin(2, 2, 8)).kind).toBe('inf');
    expect(solve(lin(1, 2, 3), lin(-2, -4, -6)).kind).toBe('inf');
    expect(solve(lin(2, 1, 5), lin(4, 2, 1)).kind).toBe('none');
  });
  it('writes lines the way kids write them', () => {
    expect(texLin(lin(1, 1, 7))).toBe('x + y = 7');
    expect(texLin(lin(1, -1, 1))).toBe('x - y = 1');
    expect(texLin(lin(-2, 3, -6))).toBe('-2x + 3y = -6');
    expect(texLin(ySlope(2, -1), 'y')).toBe('y = 2x - 1');
    expect(texLin(ySlope(-1, 0), 'y')).toBe('y = -x');
    expect(texLin(lin(0, 1, 4), 'y')).toBe('y = 4');
    expect(texLin(lin(1, -3, 2), 'x')).toBe('x = 3y + 2');
    expect(texLin(ySlope(0.5, 1), 'y')).toBe('y = \\tfrac{1}{2}x + 1');
    expect(htmlLin(lin(2, -1, -3))).toBe('2<i>x</i> − <i>y</i> = −3');
    expect(nT(-2.5)).toBe('-\\tfrac{5}{2}');
    expect(pairH([-1, 4])).toBe('(−1, 4)');
  });
  it('clips a line to the window and finds the line through two points', () => {
    const e = clip(lin(1, 1, 7), { x0: -1, y0: -1, x1: 8, y1: 8 })!;
    expect(e[0]).toEqual([-1, 8]); expect(e[1]).toEqual([8, -1]);
    expect(clip(lin(1, 1, 100), { x0: 0, y0: 0, x1: 5, y1: 5 })).toBeNull();
    const L = through([0, 1], [2, 5]);
    expect(on(L, [1, 3])).toBe(true);
  });
  it('elimination work ends on the right pair, for every kind', () => {
    for (const kind of ['add', 'sub', 'one', 'both'] as const) for (let s = 1; s <= 100; s++) {
      const { sol, L1, L2 } = elimSys(rng(s), kind, s % 2 ? 'x' : 'y');
      const w = elimWork(L1, L2, s % 2 ? 'x' : 'y');
      expect(w.at(-1)).toContain(`= ${nT(s % 2 ? sol[0] : sol[1])}`);
      for (const t of w) expect(t).not.toMatch(CTRL);
    }
  });
  it('texToHtml: letters in italics, fractions stacked, a real minus, no control characters left', () => {
    expect(texToHtml('\\text{add:}\\ 2x = 8')).toBe('add: 2<i>x</i> = 8');
    expect(texToHtml('y = 2(3) - 1 = 5')).toBe('<i>y</i> = 2(3) − 1 = 5');
    expect(texToHtml('\\tfrac{x}{2} + y = -3')).toContain('<span class="fr"><span><i>x</i></span><span>2</span></span>');
    expect(texToHtml('\\tfrac{x}{2} + y = -3')).toMatch(/= −3$/);
    expect(texToHtml('\\times 3:\\ 6x + 3y = 21')).not.toMatch(CTRL);
  });
});

describe('the page', () => {
  const page = () => fs.readFileSync('pages/lessons/systems-of-equations.ts', 'utf8');
  const voice = () => JSON.parse(fs.readFileSync('pages/lessons/systems-of-equations/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
  it('every voiced id has a spoken text without digits or symbols, and every spoken text is used', () => {
    const src = page(), lines = voice();
    const used = new Set<string>();
    for (const m of src.matchAll(/(?:voiced|voicedFb)\('([a-z]\.[a-z0-9.]+)'/g)) used.add(m[1]!);
    for (const m of src.matchAll(/\b(?:id|why|vid): '([a-z]\.[a-z0-9.]+)'/g)) used.add(m[1]!);
    for (const m of src.matchAll(/'(q\.cb\.[a-z]+)'/g)) used.add(m[1]!);
    for (const m of src.matchAll(/`(e\.step|p\.c)\$\{/g)) for (let i = 0; i < 5; i++) if (lines[`${m[1]}${i}`]) used.add(`${m[1]}${i}`);
    expect(used.size).toBeGreaterThan(20);
    for (const id of used) expect(lines[id]?.text, id).toBeTruthy();
    for (const id of Object.keys(lines)) expect(used.has(id), `unused line ${id}`).toBe(true);
    for (const [id, l] of Object.entries(lines)) {
      expect(l.text, id).not.toMatch(/[0-9<>=+×÷−/$%()]/);
      expect(l.text, id).not.toMatch(CTRL);
    }
  });
  it('the page source has no control characters in its strings (TeX escapes written right)', () => {
    // a "\t" or "\f" in a template string becomes a tab / form feed: "\\times" must be written, never "\times"
    const src = page();
    for (const m of src.matchAll(/`[^`]*`|'[^'\n]*'/g)) {
      expect(m[0], m[0]).not.toMatch(/(?<!\\)\\(?:times|tfrac|text|frac|quad|qquad|neq|Rightarrow|checkmark|cssId|cdot|left|right|begin|end|hline|to)\b/);
    }
  });
});
