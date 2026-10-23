// lesson-functions: every family × every sub-goal it serves × 300 seeds (the answer passes, choices are unique with
// exactly one right, the main misconceptions are classified, every picture lays out in the frame the page uses); the
// relation maths; the plan covers the topic JSON; the voice lines match the panel script.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { dusk } from '../src/lesson/dusk';
import { GENS, PROBES, FAMILY_NAMES, type FamilyId, type Pic } from '../src/lesson/topics/functions/items';
import { PLAN } from '../src/lesson/topics/functions/plan';
import { LINES } from '../src/lesson/topics/functions/script';
import { MODEL, BOARD_TABLE_LOW as BOARD_TABLE } from '../src/lesson/topics/functions/layout';
import { MapDiagram } from '../src/lesson/topics/functions/MapDiagram';
import { PairTable } from '../src/lesson/topics/functions/PairTable';
import { FnGraph } from '../src/lesson/topics/functions/FnGraph';
import { checkFunction, oneToOne, sharedOutput, duplicateRow, flip, inputsOf, outputsOf, sortVals, evalRule, EQS, segDomain, segRange, ineqHtml, setHtml, sayNum, type Pair } from '../src/lesson/topics/functions/relation';
import { EXAMPLE, TURN, PROVE } from '../src/lesson/topics/functions/script';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-32-functions-concept-and-representations.json';
const MISC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const SEEDS = 300;

describe('plan covers the topic', () => {
  it('every sub-goal of the topic JSON, in order, each with families that exist', () => {
    if (fs.existsSync(TOPIC)) {
      const t = JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] };
      expect(PLAN.map(p => p.id)).toEqual(t.subgoals.map(s => s.id));
    }
    expect(PLAN.length).toBe(18);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENS[f as FamilyId], f).toBeTypeOf('function'); }
    for (const f of Object.keys(GENS)) { expect(FAMILY_NAMES[f as FamilyId]).toBeTruthy(); expect(PLAN.some(p => p.families.includes(f)), `${f} is in no sub-goal`).toBe(true); }
  });
});

function layOut(pic: Pic): void {
  if (pic.kind === 'map') MapDiagram(pic, MODEL, dusk);
  else if (pic.kind === 'table') PairTable(pic, MODEL, dusk);
  else {
    FnGraph(pic, MODEL, dusk);
    if (pic.side) PairTable(pic.side, BOARD_TABLE, dusk);
  }
}

const known = fs.existsSync(MISC) ? new Set((JSON.parse(fs.readFileSync(MISC, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
describe.each(pairs)('family %s for sub-goal %s', (fam, sg) => {
  const items: Item[] = [];
  for (let s = 1; s <= SEEDS; s++) items.push(GENS[fam as FamilyId](rng(s * 7919 + fam.length * 31 + sg.length), s, sg));
  it('the answer passes, the item is well formed', () => {
    for (const it of items) {
      expect(it.family).toBe(fam);
      const v = it.check(it.answer);
      if (!v.ok) throw new Error(`${it.id} ${it.prompt}: own answer rejected: ${v.say}`);
      expect(it.solution.length).toBeGreaterThan(0);
      for (const s of [it.prompt, it.board, it.solution.join(' '), v.say, ...(it.choices ?? [])]) expect(s, `${it.id} ${it.prompt}`).not.toMatch(/undefined|NaN|Infinity|\[object/);
      expect(it.board.split('\n').length, it.board).toBeLessThanOrEqual(3);
    }
  });
  it('choices are unique with exactly one right', () => {
    for (const it of items) {
      if (it.input !== 'choice') continue;
      const ch = it.choices ?? [];
      expect(ch.length, it.prompt).toBeGreaterThanOrEqual(3);
      expect(new Set(ch).size, it.prompt + ' ' + ch.join(' | ')).toBe(ch.length);
      const right = ch.map((_, i) => it.check({ kind: 'choice', i }).ok).filter(Boolean).length;
      expect(right, it.prompt + ' ' + ch.join(' | ')).toBe(1);
    }
  });
  it('the main misconceptions are classified (with catalogue ids)', () => {
    let n = 0;
    for (const it of items) for (const p of PROBES.get(it) ?? []) {
      const v = it.check(p.r);
      expect(v.ok, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(false);
      expect(v.mc, `${it.id} ${it.prompt} ${JSON.stringify(p.r)}`).toBe(p.mc);
      if (known) expect(known.has(p.mc), p.mc).toBe(true);
      n++;
    }
    expect(n, `${fam}: no misconception probes`).toBeGreaterThan(0);
  });
  it('pictures lay out in the page frame', () => {
    for (const it of items) {
      const pic = it.picture as Pic | undefined;
      if (!pic) continue;
      try { layOut(pic); } catch (e) { throw new Error(`${it.id} ${it.prompt}: ${(e as Error).message}`); }
    }
  });
  it('makes many different problems', () => {
    const distinctN = new Set(items.map(i => i.prompt + i.board + JSON.stringify(i.picture ?? null) + (i.choices ?? []).join())).size;
    expect(distinctN).toBeGreaterThan(fam === 'contextInputs' ? 11 : fam === 'sketchStory' ? 20 : fam === 'readStory' || fam === 'implicitShows' ? 30 : 60);
  });
});

describe('the relation maths', () => {
  const months: Pair[] = [['Ava', 'Mar'], ['Ben', 'Jul'], ['Cara', 'Mar'], ['Dev', 'Oct'], ['Eli', 'Jul']];
  it('exactly one output per input; outputs may repeat', () => {
    expect(checkFunction(months).fn).toBe(true);
    expect(oneToOne(months)).toBe(false);
    expect(sharedOutput(months)).toEqual({ y: 'Mar', x1: 'Ava', x2: 'Cara' });
    const back = checkFunction(flip(months));
    expect(back.fn).toBe(false);
    expect(back.witness).toEqual({ kind: 'two', x: 'Mar', y1: 'Ava', y2: 'Cara' });
  });
  it('identical duplicate rows are one output; a stated input with no output is a witness', () => {
    const P: Pair[] = [[1, 4], [2, 5], [1, 4]];
    expect(duplicateRow(P)).toEqual([1, 4]);
    expect(checkFunction(P).fn).toBe(true);
    expect(checkFunction([[1, 2], [3, 4]], [1, 2, 3])).toEqual({ fn: false, witness: { kind: 'none', x: 2 } });
    expect(() => checkFunction([[7, 1]], [1, 2])).toThrow();
  });
  it('domain and range as distinct values', () => {
    const P: Pair[] = [[3, 1], [-2, 1], [3, 5], [0, 1]];
    expect(sortVals(inputsOf(P))).toEqual([-2, 0, 3]);
    expect(sortVals(outputsOf(P))).toEqual([1, 5]);
    expect(setHtml([-2, 0, 3])).toBe('{−2, 0, 3}');
  });
  it('rules, equations, segments', () => {
    expect(evalRule({ kind: 'sq', a: 1, b: 0 }, -3)).toBe(9);
    expect(evalRule({ kind: 'abs', a: 1, b: -2 }, -5)).toBe(3);
    expect(EQS.sideways.sat(4, -2)).toBe(true);
    expect(EQS.sideways.sat(-2, 4)).toBe(false);
    expect(EQS.circle25.sat(3, -4)).toBe(true);
    expect(EQS.lin236.sat(2, 0)).toBe(false);
    const s = { x0: 4, y0: -1, c0: false, x1: -2, y1: 5, c1: true };
    const d = segDomain(s), r = segRange(s);
    expect(ineqHtml('x', d.lo, d.loIn, d.hi, d.hiIn)).toBe('−2 ≤ x < 4');
    expect(ineqHtml('y', r.lo, r.loIn, r.hi, r.hiIn)).toBe('−1 < y ≤ 5');
    expect(ineqHtml('y', 3, true, 3, true)).toBe('y = 3');
    expect(sayNum(-14)).toBe('negative fourteen');
  });
  it('the explain parts use relations whose facts the script states', () => {
    expect(checkFunction(EXAMPLE.pairs).fn).toBe(true);
    expect(checkFunction(flip(EXAMPLE.pairs)).witness).toMatchObject({ x: 'Mar' });
    const t = checkFunction(TURN.pairs);
    expect(t.witness).toMatchObject({ kind: 'two', x: TURN.witness });
    expect(sharedOutput(TURN.pairs)).toMatchObject({ y: TURN.shared });
    for (const x of PROVE.slices) expect(evalRule({ kind: 'sq', a: 1, b: 0 }, x)).toBe(x * x);
  });
  it('the explain-part pictures lay out', () => {
    MapDiagram({ ...EXAMPLE.map }, MODEL, dusk);
    FnGraph(TURN.graph, MODEL, dusk);
    FnGraph(PROVE.graph, MODEL, dusk);
  });
});

describe('voice', () => {
  it('every panel line has a spoken text, and lines.json matches the script', () => {
    const file = 'pages/lessons/functions/voice/lines.json';
    const json = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(json).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(json[id]!.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[<>²→≤]|\d\/\d|−\d/);
    }
  });
});

describe('quality-layer fixes (practice sweep, 2026-10-23)', () => {
  const gen = (f: FamilyId, sg: string, s: number) => GENS[f](rng(s * 29 + 3), s, sg);
  it('pickWitness: the pairs the right choice quotes are in the table or on the graph (shuffle no longer moves them)', () => {
    for (let s = 1; s <= 400; s++) {
      const it = gen('pickWitness', 'counterexample-witness', s), pic = it.picture as Pic;
      const right = it.choices![(it.answer as { i: number }).i]!.replace(/<[^>]+>/g, '');
      const quoted = [...right.matchAll(/\((−?\d+), (−?\d+)\)/g)].map(m => [Number(m[1]!.replace('−', '-')), Number(m[2]!.replace('−', '-'))]);
      if (!quoted.length) continue;
      const pts: number[][] = pic.kind === 'table' ? pic.xs.map((x, i) => [Number(x), Number(pic.ys[i])]) : pic.kind === 'graph' ? pic.points.map(p => [p.x, p.y]) : [];
      for (const q of quoted) expect(pts.some(p => p[0] === q[0] && p[1] === q[1]), `${right} not in ${JSON.stringify(pts)}`).toBe(true);
    }
  });
  it('readStory: no tab character in the board TeX; contextInputs: no laps (2.5 laps is a real distance)', () => {
    for (let s = 1; s <= 300; s++) {
      expect(gen('readStory', 'qualitative-graphs', s).board).not.toMatch(/\t/);
      expect(gen('contextInputs', 'allowed-inputs', s).prompt).not.toMatch(/laps/);
    }
  });
});
