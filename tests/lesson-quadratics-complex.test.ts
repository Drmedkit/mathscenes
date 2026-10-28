// lesson-quadratics-complex: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/quadratics-complex/items';
import { PLAN } from '../src/lesson/topics/quadratics-complex/plan';

const TOPIC = { subgoals: [...new Map(["secondary-t7-09-solving-quadratic-equations-with-complex-solutions"].flatMap(i => JSON.parse(fs.readFileSync(`../math-curriculum-essentials/topics/${i}.json`, 'utf8')).subgoals).map((s: { id: string }) => [s.id, s] as const)).values()] };
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('quadratics-complex: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('quadratics-complex: families', () => {
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

// ---------------- topic checks ----------------
import { beforeAll } from 'vitest';
import type { Item } from '../src/lesson/runtime/item';
import * as Qm from '../src/lesson/topics/quadratics-complex/qc';
import { keyed, MC as M, type QItem } from '../src/lesson/topics/quadratics-complex/common';
import { graphParams, rootsParams } from '../src/lesson/topics/quadratics-complex/pic';
import { SCRIPT } from '../src/lesson/topics/quadratics-complex/script';
import { PLACEMENT } from '../src/lesson/topics/quadratics-complex/placement';
import { explain } from '../src/lesson/topics/quadratics-complex/explain';

const plainT = (h: string) => h.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '($1)/($2)').replace(/<s class="pp">([()])<\/s>/g, '$1').replace(/<[^>]+>/g, '').replace(/[−–]/g, '-').trim();
/** a real-number expression of the choice texts: 2√6, (√39)/(8), (3)/(8), -5, '' (= 1) */
function num(s: string): number {
  const t = s.replace(/\s+/g, '').replace(/√\((\d+)\)/g, '√$1').replace(/(\d*)√(\d+)/g,(_, k: string, m: string) => `(${k || 1}*Math.sqrt(${m}))`);
  if (t === '' || t === '+') return 1;
  if (t === '-') return -1;
  try { return Function(`return (${t.replace(/\)\(/g, ')*(')});`)() as number; } catch { throw new Error(`num: ${s} -> ${t}`); }
}
/** the numeric root set of a choice "x = P ± Qi" / "x = ±Qi" / "x = P ± Q" (real) / "x = P or x = Q" */
function rootSet(text: string): [number, number][] | null {
  const t = plainT(text);
  if (/√\([^)]*i\)/.test(t)) return null;   // i under the root: a different number, not parsed here
  let m = /^x = \((.*) ± (.*)\)\/(\d+)$/.exec(t);
  if (m) { const d = Number(m[3]), P = num(m[1]!) / d, Q = num(m[2]!) / d; return [[P + Q, 0], [P - Q, 0]]; }
  m = /^x = (.*?)\s*±\s*(.*)$/.exec(t);
  if (m) {
    const P = m[1] ? num(m[1]) : 0, r = m[2]!;
    if (/i/.test(r)) { const Q = num(r.replace('i', '')); return [[P, Q], [P, -Q]]; }
    const Q = num(r); return [[P + Q, 0], [P - Q, 0]];
  }
  m = /^x = (.*) or x = (.*)$/.exec(t);
  if (m) return [[num(m[1]!), 0], [num(m[2]!), 0]];
  return null;
}
const sameSet = (a: [number, number][], b: [number, number][]) => {
  const k = (s: [number, number][]) => s.map(([x, y]) => `${x.toFixed(6)},${Math.abs(y) < 1e-9 ? 0 : y.toFixed(6)}`).sort().join('|');
  return k(a) === k(b);
};

describe('quadratics-complex: exact maths', () => {
  it('non-real roots, simplest radical form, keys', () => {
    expect(Qm.nrT(Qm.nonReal(1, -4, 13))).toBe('2 \\pm 3i');
    expect(Qm.nrT(Qm.nonReal(1, 2, 7))).toBe('-1 \\pm i\\sqrt{6}');
    expect(Qm.nrT(Qm.nonReal(1, 4, 12))).toBe('-2 \\pm 2i\\sqrt{2}');
    expect(Qm.nrT(Qm.nonReal(2, -2, 5))).toBe('\\frac{1}{2} \\pm \\frac{3}{2}i');
    expect(Qm.nrT(Qm.nonReal(3, -4, 4))).toBe('\\frac{2}{3} \\pm \\frac{2\\sqrt{2}}{3}i');
    expect(Qm.nrT(Qm.nonReal(-3, 2, -1))).toBe('\\frac{1}{3} \\pm \\frac{\\sqrt{2}}{3}i');
    expect(Qm.nrEq(Qm.nr(Qm.q(1), Qm.q(1), 24), Qm.nr(Qm.q(1), Qm.q(2), 6))).toBe(true);
    expect(Qm.nrKey(Qm.nr(Qm.q(-1), Qm.q(1), 24))).toBe(Qm.nrKey(Qm.nonReal(1, 2, 25)));
    expect(() => Qm.nonReal(1, 2, 1)).toThrow();
  });
  it('substitution: the roots give 0, the i² = +1 slip does not', () => {
    for (const [a, b, c] of [[1, -4, 13], [2, -2, 5], [1, 6, 25], [4, 4, 5]] as const) {
      const x = Qm.nonReal(a, b, c);
      if (x.m !== 1) continue;
      for (const z of Qm.nrPair(x)) {
        expect(Qm.isZ(Qm.evalQ(Qm.RE(a), Qm.RE(b), Qm.RE(c), z).val)).toBe(true);
        expect(Qm.isZ(Qm.evalPlus(Qm.RE(a), Qm.RE(b), Qm.RE(c), z))).toBe(false);
      }
    }
    // x² − 3ix − 2 = 0 has the roots i and 2i, and −i is not a root
    expect(Qm.isZ(Qm.evalQ(Qm.RE(1), Qm.C(0, -3), Qm.RE(-2), Qm.C(0, 1)).val)).toBe(true);
    expect(Qm.isZ(Qm.evalQ(Qm.RE(1), Qm.C(0, -3), Qm.RE(-2), Qm.C(0, 2)).val)).toBe(true);
    expect(Qm.isZ(Qm.evalQ(Qm.RE(1), Qm.C(0, -3), Qm.RE(-2), Qm.C(0, -1)).val)).toBe(false);
  });
});

describe('quadratics-complex: no secretly right distractor', () => {
  it('keyed drops a wrong choice with the same value key as the right one', () => {
    const x = Qm.nonReal(1, 2, 25);
    const it = keyed(rng(3), { id: 't', family: 't', prompt: 'p', board: 'b', solution: [] }, [
      { t: 'right', ok: true, key: Qm.nrKey(x), say: '' },
      { t: 'same roots written another way', key: Qm.nrKey(Qm.nr(Qm.q(-1), Qm.q(1), 24)), say: '' },
      { t: 'a', key: 'a', say: '' }, { t: 'b', key: 'b', say: '' }, { t: 'c', key: 'c', say: '' },
    ]);
    expect(it.choices!.includes('same roots written another way')).toBe(false);
  });
  it('root-set choices: no wrong choice names the same roots as the right one, and the right one solves the equation', () => {
    const fams: [string, string][] = [['formulaRad', 'formula-nonsquare-radical'], ['formulaA', 'formula-nonunit-a'], ['splitPick', 'formula-perfect-square'], ['sqrtSolvePick', 'sqrt-method-negative'], ['contrastSolve', 'method-choice-mixed']];
    let parsed = 0, solved = 0;
    for (const [f, sg] of fams) for (let s = 1; s <= 300; s++) {
      const it = GEN[f]!(rng(s * 17 + 5), s, sg) as QItem;
      const sets = it.choices!.map(c => { try { return rootSet(c); } catch (e) { throw new Error(`${(e as Error).message} in ${plainT(c)} | ${c}`); } }), ri = (it.answer as { i: number }).i, right = sets[ri];
      expect(right, `${f}: ${plainT(it.choices![ri]!)}`).not.toBeNull();
      sets.forEach((st, i) => { if (i !== ri && st) { parsed++; expect(sameSet(st, right!), `${f} ${it.prompt}: ${it.choices!.map(plainT).join(' | ')}`).toBe(false); } });
      const m = /^(-?\d*)x\^\{2\}(?: ([+-]) (\d*)x)?(?: ([+-]) (\d+))? = 0$/.exec(it.board);
      if (m) {
        const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]), b = m[2] ? (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3])) : 0, c = m[4] ? (m[4] === '-' ? -1 : 1) * Number(m[5]) : 0;
        for (const [x, y] of right!) { const re = a * (x * x - y * y) + b * x + c, im = a * 2 * x * y + b * y; expect(Math.hypot(re, im), `${f} ${it.board} at ${x} ${y}`).toBeLessThan(1e-6); }
        solved++;
      }
    }
    expect(parsed).toBeGreaterThan(1000);
    expect(solved).toBeGreaterThan(600);
  });
  it('which equation / which quadratic: exactly one offered quadratic has the given root', () => {
    for (const f of ['whichEquation', 'buildPick']) for (let s = 1; s <= 300; s++) {
      const it = GEN[f]!(rng(s * 7 + 1), s, f === 'whichEquation' ? 'conjugacy-not-sufficient' : 'build-from-conjugate-root');
      const zt = plainT(it.prompt).match(/(-?\d+ [+-] \d*i|-?\d*i)(?= and| as)/)![1]!;
      const zm = /^(-?\d+) ([+-]) (\d*)i$/.exec(zt), zp = /^(-?\d*)i$/.exec(zt);
      const [zx, zy] = zm ? [Number(zm[1]), (zm[2] === '-' ? -1 : 1) * Number(zm[3] || 1)] : [0, zp![1] === '' ? 1 : zp![1] === '-' ? -1 : Number(zp![1])];
      const hits = it.choices!.map(c => {
        const m = /^x2(?: ([+-]) (\d*)x)?(?: ([+-]) (\d+))?(?: = 0)?$/.exec(plainT(c).replace(/\s+/g, ' '));
        if (!m) return false;
        const b = m[1] ? (m[1] === '-' ? -1 : 1) * Number(m[2] || 1) : 0, c0 = m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0;
        return Math.hypot(zx * zx - zy * zy + b * zx + c0, 2 * zx * zy + b * zy) < 1e-9;
      });
      expect(hits.filter(Boolean).length, `${f}: ${it.prompt} ${it.choices!.map(plainT).join(' | ')}`).toBe(1);
      expect(hits[(it.answer as { i: number }).i]).toBe(true);
    }
  });
  it('pair answers: x = a ± bi accepts b typed with either sign, and every pair answer can be typed', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 150; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s, p.id);
      if (it.answer.kind !== 'pair') continue;
      for (const v of [it.answer.x, it.answer.y]) expect(Math.abs(v * 1e4 - Math.round(v * 1e4)), `${f} ${it.prompt}`).toBeLessThan(1e-6);
      if (it.pairOp === '±') expect(it.check({ kind: 'pair', x: it.answer.x, y: -it.answer.y }).ok).toBe(true);
    }
  });
});

describe('quadratics-complex: misconceptions are classified', () => {
  it('formula: −b and dividing one term; conjugate: opposites', () => {
    let n = 0;
    for (let s = 1; s < 100; s++) {
      const fi = GEN.formulaInt!(rng(s), s, 'formula-perfect-square'), A = fi.answer as { x: number; y: number };
      expect(fi.check({ kind: 'pair', x: -A.x, y: A.y }).mc).toBe(M.useB);
      expect(fi.check({ kind: 'pair', x: 2 * A.x, y: A.y }).mc).toBe(M.selTerm);
      const sr = GEN.secondRoot!(rng(s), s, 'conjugate-pair-justify'), S = sr.answer as { x: number; y: number };
      if (S.x !== 0) { expect(sr.check({ kind: 'pair', x: -S.x, y: S.y }).mc).toBe(M.opposites); expect(sr.check({ kind: 'pair', x: -S.x, y: -S.y }).mc).toBe(M.conjReal); n++; }
    }
    expect(n).toBeGreaterThan(50);
  });
  it('choice lists log catalog misconceptions for the main slips', () => {
    const seen = new Set<string>();
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 3 + 2), s, p.id);
      if (it.choices) it.choices.forEach((_, i) => { const mc = it.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of [M.noSolution, M.oneComplex, M.dropsI, M.rootNegReal, M.iUnder, M.onlyPos, M.selTerm, M.useB, M.signSlip, M.imagOnly, M.lastMethod, M.realOnly, M.failedArg, M.opposites, M.conjBoth, M.conjReal, M.examples, M.anyConj, M.needReal, M.oneFactor, M.noSolError, M.domainAll, M.realsNot, M.dismiss, M.abcFirst]) expect(seen.has(id), id).toBe(true);
  });
});

describe('quadratics-complex: pictures, voice, steps, check-in', () => {
  let Plane: typeof import('../src/lesson/kit/Plane').Plane;
  let FR: import('../src/blocks/block').Frame, dusk: import('../src/core/theme').Theme;
  beforeAll(async () => {
    (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
    ({ Plane } = await import('../src/lesson/kit/Plane'));
    FR = (await import('../src/blocks/block')).frame(60, 90, 960, 900);
    dusk = (await import('../src/lesson/dusk')).dusk;
  });
  it('every graph and complex-plane picture builds on the kit Plane', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 80; s++) {
      const it = GEN[f]!(rng(s * 5 + 2), s, p.id) as QItem;
      const g = it.picture?.graph, r = it.picture?.roots;
      try { if (g) Plane(graphParams(g), FR, dusk); if (r) Plane(rootsParams(r), FR, dusk); } catch (e) { throw new Error(`${f} seed ${s}: ${(e as Error).message} | ${it.prompt}`); }
    }
  });
  it('lines.json speaks every script line, with no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/quadratics-complex/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [k, v] of Object.entries(SCRIPT)) { expect(lines[k]!.text, k).toBe(v.say); expect(/[0-9=+√²−]/.test(v.say), k).toBe(false); }
  });
  it('the steps card arrives at the answer for every family', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 7 + 3), s, p.id);
      const ex = explain(it);
      expect(ex, `${f}: ${it.prompt}`).not.toBeNull();
      expect(it.check(ex!.result).ok, `${f}: ${it.prompt} -> ${JSON.stringify(ex!.result)}`).toBe(true);
    }
  });
  it('the check-in picks are plan families', () => {
    for (const pk of PLACEMENT.picks) expect(PLAN.find(p => p.id === pk.subgoal)?.families).toContain(pk.family);
  });
});
void (null as unknown as Item);
