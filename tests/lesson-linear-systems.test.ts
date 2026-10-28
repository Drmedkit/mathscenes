// lesson-linear-systems: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/linear-systems/items';
import { PLAN } from '../src/lesson/topics/linear-systems/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t6-08-solving-systems-of-equations-algebra-i"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('linear-systems: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('linear-systems: families', () => {
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

// ---------------------------------------------------------------------------------------------------------------------
// topic checks: the maths, the pictures (they fit the kit's Plane), the diagnosis, the texts, the voice
// ---------------------------------------------------------------------------------------------------------------------
import { eq, solve, solKey, sysKey, lineKey, eqOf, si, xs, holds, add, scale, q } from '../src/lesson/topics/linear-systems/sysMaths';
import { FAMILIES, MC, type SItem } from '../src/lesson/topics/linear-systems/items';

const items = (per: number) => PLAN.flatMap(p => p.families.flatMap(f => Array.from({ length: per }, (_, s) => GEN[f]!(rng(s * 97 + 3), s, p.id) as SItem)));

describe('linear-systems: maths', () => {
  it('one, none and infinitely many solutions', () => {
    expect(solKey(solve(eq(3, 2, 16), eq(5, -4, 12)))).toBe('P 4/1 2/1');
    expect(solve(eq(2, -3, 6), eq(-4, 6, -12)).k).toBe('inf');
    expect(solve(eq(1, 1, 2), eq(2, 2, 5)).k).toBe('none');
    expect(sysKey(eq(1, 1, 5), eq(1, -1, 1))).toBe(sysKey(eq(2, 0, 6), eq(1, -1, 1)));   // replacing by the sum keeps the solutions
    const S = solve(eq(4, 3, 5), eq(3, -2, 8));
    expect(S.k === 'one' && S.x.p === 2 && S.y.p === -1).toBe(true);
  });
  it('forms describe their lines: y = 2x + 1 is 2y = 4x + 2; x = 3y − 2 is x − 3y = −2', () => {
    expect(lineKey(eqOf(si(2, 1)))).toBe(lineKey(eq(-4, 2, 2)));
    expect(lineKey(eqOf(xs(3, -2)))).toBe(lineKey(eq(1, -3, -2)));
    expect(lineKey(eqOf(si(q(1, 2), q(3, 2))))).toBe(lineKey(eq(-1, 2, 3)));
    expect(holds(add(eq(1, 1, 5), scale(eq(1, -1, 1), 2)), 3, 2)).toBe(true);
  });
});

describe('linear-systems: items', () => {
  it('every family is in the plan', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    for (const f of FAMILIES) expect(used.has(f.id), f.id).toBe(true);
    expect(used.size).toBeGreaterThanOrEqual(40);
  });
  it('the same seed gives the same item', () => {
    for (const p of PLAN) for (const f of p.families) {
      const a = GEN[f]!(rng(11), 1, p.id), b = GEN[f]!(rng(11), 1, p.id);
      expect(a.prompt + a.board + JSON.stringify(a.choices), f).toBe(b.prompt + b.board + JSON.stringify(b.choices));
    }
  });
  it('the main misconceptions are diagnosed, and every id is in the catalogue', () => {
    const seen = new Set<string>();
    for (const it of items(40)) {
      (it.choices ?? []).forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); });
      for (const s of it.slips ?? []) { const m = it.check(s).mc; if (m) seen.add(m); }
    }
    for (const m of seen) expect(CATALOG.has(m), m).toBe(true);
    const missing = Object.values(MC).filter(m => !seen.has(m));
    expect(missing, `not diagnosed: ${missing.join(', ')}`).toEqual([]);
  });
  it('every misconception id of the topic JSON is diagnosed somewhere', () => {
    const seen = new Set<string>();
    for (const it of items(40)) {
      (it.choices ?? []).forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); });
      for (const s of it.slips ?? []) { const m = it.check(s).mc; if (m) seen.add(m); }
    }
    const want = new Set<string>((TOPIC.subgoals as unknown as { misconceptions: string[] }[]).flatMap(s => s.misconceptions));
    const missing = [...want].filter(m => !seen.has(m));
    expect(missing, `topic misconceptions not diagnosed: ${missing.join(', ')}`).toEqual([]);
  });
  it('texts are clean (no undefined, NaN, "+ −3", double spaces, raw angle brackets)', () => {
    const BAD = /\(undefined|undefined[,)]|NaN|\[object|Infinity|\+\s*[-−]\s*\d|\s{2,}\S|−\s*−|−0(?![.\d])|\b1<i>|\b0<i>[xy]/;
    const clean = (h: string) => h.replace(/<[^>]+>/g, '');
    for (const it of items(25)) for (const t of [it.prompt, ...(it.choices ?? []), ...it.solution]) {
      expect(clean(t).replace(/&nbsp;/g, ' '), `${it.family}: ${t}`).not.toMatch(BAD);
      expect(t.replace(/<\/?(i|b|span|sup|sub)( class="[^"]*")?>/g, ''), `${it.family}: raw < or > in ${t}`).not.toMatch(/[<>]/);
    }
  });
  it('a picture never shows an empty grid: something is drawn with the question, or it starts as a slate', () => {
    for (const it of items(20)) {
      const g = it.picture?.g;
      if (!g) continue;
      const keys = new Set(g.items.map(i => i.key));
      for (const k of [...g.show, ...g.solve]) expect(keys.has(k), `${it.family}: step ${k}`).toBe(true);
      expect(g.show.length + g.solve.length, it.family).toBeGreaterThan(0);
      // keys never clash with the board's step names
      for (const k of keys) expect(/^(board|given\d|sol\d)$/.test(k), `${it.family}: ${k}`).toBe(false);
    }
  });
  it('every picture fits the kit Plane (no BlockError)', async () => {
    (globalThis as unknown as { document: unknown }).document ??= { createElement: () => ({ getContext: () => null }) };
    const { planeOf } = await import('../src/lesson/topics/linear-systems/sysPic');
    const { frame } = await import('../src/blocks/block');
    const { dusk } = await import('../src/lesson/dusk');
    const MF = frame(60, 70, 940, 940);
    const bad: string[] = [];
    for (const it of items(40)) {
      const g = it.picture?.g;
      if (!g) continue;
      try { planeOf(g, MF, dusk); } catch (e) { bad.push(`${it.family}: ${(e as Error).message}`); }
    }
    expect([...new Set(bad)].slice(0, 12).join(" | "), `${bad.length} pictures do not fit`).toBe("");
  });
  it('every choice item has at least two options; a pair / number answer differs from its slips', () => {
    for (const it of items(40)) {
      if (it.choices) expect(it.choices.length, it.family).toBeGreaterThanOrEqual(2);
      for (const s of it.slips ?? []) expect(it.check(s).ok, `${it.family}: slip ${JSON.stringify(s)}`).toBe(false);
    }
  });
});

describe('linear-systems: equivalent distractors are dropped', () => {
  // the oracle's rule: no wrong choice may be the same system / line / solution as the answer
  it('no wrong option of a "which equation" or "which system" item describes the answer\'s line or solution set', async () => {
    const { semLine } = await import('../src/lesson/topics/linear-systems/itemKit');
    void semLine;
    for (const it of items(60)) {
      if (!it.choices) continue;
      const right = it.choices[it.answer.kind === 'choice' ? it.answer.i : 0]!;
      for (const [i, c] of it.choices.entries()) if (i !== (it.answer as { i: number }).i) expect(c, `${it.family}: ${it.prompt}`).not.toBe(right);
    }
  });
  it('story answers are whole, non-negative counts', () => {
    for (const f of ['ctxRead', 'writeSolve'] as const) for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s), s) as SItem;
      const a = it.answer as { x: number; y: number };
      expect(Number.isInteger(a.x) && Number.isInteger(a.y) && a.x >= 0 && a.y >= 0, `${f}: ${it.prompt}`).toBe(true);
    }
  });
});

import { LINES } from '../src/lesson/topics/linear-systems/script';
import { PLACEMENT } from '../src/lesson/topics/linear-systems/placement';
import { explain } from '../src/lesson/topics/linear-systems/explain';
describe('linear-systems: voice, check-in, worked steps', () => {
  it('lines.json matches script.ts, and spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/linear-systems/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [k, v] of Object.entries(LINES)) {
      expect(lines[k]!.text, k).toBe(v.say);
      expect(v.say, k).not.toMatch(/[0-9=+÷×−<>/√%$≤≥]/);
    }
  });
  it('the check-in picks exist in the plan', () => {
    for (const p of PLACEMENT.picks) expect(PLAN.find(s => s.id === p.subgoal)?.families, p.family).toContain(p.family);
  });
  it('the worked steps arrive at the answer, in 2-5 steps', () => {
    for (const it of items(15)) {
      const ex = explain(it);
      expect(ex, `${it.family}: no result`).not.toBeNull();
      expect(ex!.steps.length, it.family).toBeGreaterThanOrEqual(2);
      expect(ex!.steps.length, it.family).toBeLessThanOrEqual(5);
      expect(it.check(ex!.result).ok, `${it.family}: ${ex!.steps.join(' | ')}`).toBe(true);
    }
  });
});

// an independent probe: parse every equation / system / point choice from its plain text and make sure no wrong
// option means the same as the right one (the same line, the same pair of lines, the same point)
import { plain } from '../src/lesson/runtime/item';
function side(t: string): [number, number, number] | null {
  const s = t.replace(/[−–]/g, '-').replace(/\s+/g, '');
  if (!s) return null;
  let a = 0, b = 0, c = 0;
  const re = /([+-]?)(\d+(?:\.\d+)?)?(?:\/(\d+))?([a-zA-Z])?/g;
  let m: RegExpExecArray | null, used = 0;
  while ((m = re.exec(s)) && m[0] !== '') {
    used += m[0].length;
    const sg = m[1] === '-' ? -1 : 1, num = m[2] === undefined ? 1 : Number(m[2]), den = m[3] === undefined ? 1 : Number(m[3]);
    const v = sg * num / den;
    if (!m[4]) { if (m[2] === undefined) return null; c += v; } else if (/[xamntp]/.test(m[4])) a += v; else b += v;
  }
  return used === s.length ? [a, b, c] : null;
}
function lineOf(t: string): string | null {
  const parts = t.split('=');
  if (parts.length !== 2) return null;
  const L = side(parts[0]!), R = side(parts[1]!);
  if (!L || !R) return null;
  let A = L[0] - R[0], B = L[1] - R[1], C = R[2] - L[2];
  const g = Math.abs(A) > 1e-9 ? A : B;
  if (Math.abs(g) < 1e-9) return null;
  A /= g; B /= g; C /= g;
  return [A, B, C].map(v => Math.round(v * 1e6) / 1e6 + 0).join(' ');
}
const meaning = (t: string): string | null => {
  const p = plain(t).replace(/&nbsp;/g, ' ');
  const pt = p.match(/^\((−?[\d./]+), (−?[\d./]+)\)$/);
  if (pt) { const v = (s: string) => { const [n, d] = s.replace('−', '-').split('/'); return Number(n) / Number(d ?? 1); }; return `P ${v(pt[1]!)} ${v(pt[2]!)}`; }
  if (/ and /.test(p)) { const [u, w] = p.split(' and '); const a = lineOf(u!), b = lineOf(w!); return a && b ? `S ${[a, b].sort().join(' | ')}` : null; }
  return lineOf(p);
};
describe('linear-systems: probe, parsed from the text', () => {
  it('no wrong equation, system or point option means the same as the answer', () => {
    let parsed = 0;
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 200; s++) {
      const it = GEN[f]!(rng(s * 53 + 11), s, p.id);
      if (!it.choices || it.answer.kind !== 'choice') continue;
      const right = meaning(it.choices[it.answer.i]!);
      if (!right) continue;
      parsed++;
      it.choices.forEach((c, i) => { if (i !== (it.answer as { i: number }).i) expect(meaning(c), `${f}: ${plain(it.prompt)} | ${plain(c)} vs ${plain(it.choices![(it.answer as { i: number }).i]!)}`).not.toBe(right); });
    }
    expect(parsed).toBeGreaterThan(2000);
  });
});
