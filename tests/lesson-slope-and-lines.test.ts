// lesson-slope-and-lines: the generic checks (every family x every sub-goal it serves x 300 seeds), then the topic's
// own: exact slope maths, misconception probes, pictures that fit, no control characters in any text (the "\t" bug),
// and the voice script in step with voice/lines.json.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, MC, picFits, type SlItem } from '../src/lesson/topics/slope-and-lines/items';
import { PLAN } from '../src/lesson/topics/slope-and-lines/plan';
import * as S from '../src/lesson/topics/slope-and-lines/slopeMaths';
import { LINES } from '../src/lesson/topics/slope-and-lines/script';
import { SCENES } from '../src/lesson/topics/slope-and-lines/scenes';
import { SlopeGrid } from '../src/lesson/topics/slope-and-lines/SlopeGrid';
import { frame } from '../src/blocks/block';
import type { Theme } from '../src/core/theme';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-29-proportional-relationships-lines-and-linear-equations.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => SlItem>;

describe('slope-and-lines: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
  it('every generator is used and every sub-goal has at least two families', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    for (const f of Object.keys(GEN)) expect(used.has(f), f).toBe(true);
    for (const p of PLAN) expect(p.families.length, p.id).toBeGreaterThanOrEqual(2);
  });
});

describe('slope-and-lines: families', () => {
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
/** every string an item shows: prompt, board, choices, solution, unit, picture labels and solve lines */
function texts(it: SlItem): string[] {
  const g = it.picture?.graph, t = it.picture?.table;
  return [it.prompt, it.board, it.unit ?? '', it.pairLead ?? '', it.pairOp ?? '', it.pairTail ?? '', ...(it.choices ?? []), ...it.solution,
    ...(it.picture?.solveTex ?? []), g?.xName ?? '', g?.yName ?? '',
    ...(g?.points ?? []).map(p => (typeof p.label === 'string' ? p.label : '')), ...(g?.tris ?? []).flatMap(x => [x.run ?? '', x.rise ?? '']),
    ...(g?.lines ?? []).map(l => l.name ?? ''), ...(t?.heads ?? []), ...(t?.rows ?? []).flat(), ...(t?.gaps ?? []).flatMap(x => [x.dx ?? '', x.dy ?? ''])];
}
const CTRL = /[\u0000-\u0008\u000b-\u001f\u007f]/;
describe('slope-and-lines: text hygiene', () => {
  it('no control characters (a "\\t" eaten by a template string) in any item text, board or label', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) {
      const it = GEN[f]!(rng(s * 13 + 5), s, p.id);
      for (const x of texts(it)) expect(CTRL.test(x), `${f}: ${JSON.stringify(x)}`).toBe(false);
      // TeX boards: no stray "ext{" (a lost backslash) and balanced braces
      for (const x of [it.board, ...(it.picture?.solveTex ?? [])]) {
        expect(/(^|[^\\])(ext|frac|tfrac|quad)\{/.test(x.replace(/\\(text|frac|tfrac|quad)/g, '')), `${f}: ${x}`).toBe(false);
        expect(x.split('{').length, `${f}: ${x}`).toBe(x.split('}').length);
      }
      // no answer in plain sight: a numeric answer is not printed in the board as "= answer"
      if (it.answer.kind === 'num' && Number.isFinite(it.answer.v)) expect(new RegExp(`= ${S.tnum(it.answer.v).replace('.', '\\.')}(?![\\d.a-z\\\\])`).test(it.board) && !it.board.includes('?'), `${f}: ${it.board}`).toBe(false);
    }
  });
  it('no control characters in the voice script, the scene boards, or lines.json', () => {
    for (const [id, l] of Object.entries(LINES)) { expect(CTRL.test(l.html), id).toBe(false); expect(CTRL.test(l.say), id).toBe(false); }
    for (const [id, tex] of Object.entries(SCENES.tex)) expect(CTRL.test(tex), id).toBe(false);
    const raw = fs.readFileSync('pages/lessons/slope-and-lines/voice/lines.json', 'utf8');
    expect(CTRL.test(raw.replace(/[\r\n]/g, ''))).toBe(false);
  });
  it('spoken lines have no digits or maths symbols', () => {
    for (const [id, l] of Object.entries(LINES)) expect(/[0-9=+÷×/<>−]/.test(l.say), `${id}: ${l.say}`).toBe(false);
  });
  it('every scripted panel line has a spoken text and vice versa', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/slope-and-lines/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) expect(lines[id]!.text, id).toBe(l.say);
  });
  it('the page only uses scripted voice ids', () => {
    const src = fs.readFileSync('pages/lessons/slope-and-lines.ts', 'utf8');
    const ids = [...src.matchAll(/(?:para|sayOnly|sayOnlyLabel)\('([a-z0-9.-]+)'|fb\([^,]+, '([a-z0-9.-]+)'|\bid: '([qetp]\.[a-z0-9.-]+)'|\bcb: '([qetp]\.[a-z0-9.-]+)'/g)].map(m => m[1] ?? m[2] ?? m[3] ?? m[4]!);
    expect(ids.length).toBeGreaterThan(20);
    for (const id of ids) expect(LINES[id], id).toBeDefined();
    // and every scripted line is used by the page (literally, or as e.s0..e.s3 / p.c1..p.c3)
    for (const id of Object.keys(LINES)) expect(src.includes(`'${id}'`) || /^e\.s\d$/.test(id) || /^p\.c\d$/.test(id), id).toBe(true);
  });
});

describe('slope-and-lines: pictures', () => {
  const SLATE = new Set(['classify3']);
  it('most items carry a picture that lays out (graph or table), the rest a slate', () => {
    let pics = 0, all = 0;
    for (const p of PLAN) for (const f of p.families) {
      let ok = 0;
      for (let s = 1; s <= 60; s++) { const it = GEN[f]!(rng(s * 7 + 3), s, p.id); all++; if (it.picture && picFits(it.picture)) { ok++; pics++; } }
      if (!SLATE.has(f)) expect(ok, `${p.id}/${f}: pictures that fit`).toBeGreaterThanOrEqual(54);
    }
    expect(pics / all).toBeGreaterThan(0.85);
  });
  it('a hidden step is a real step of the picture', () => {
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 30; s++) {
      const it = GEN[f]!(rng(s * 11 + 1), s, p.id), pic = it.picture;
      if (!pic?.graph || !picFits(pic)) continue;
      const B = SlopeGrid(pic.graph, frame(60, 70, 940, 940), {} as Theme);
      for (const h of pic.hide ?? []) if (!h.startsWith('ang:')) expect(B.steps.includes(h), `${f}: ${h}`).toBe(true);
    }
  });
  it('the lesson scenes lay out', () => {
    for (const [id, g] of Object.entries(SCENES.graphs)) expect(() => SlopeGrid(g, frame(60, 70, 940, 940), {} as Theme), id).not.toThrow();
  });
});

describe('slope-and-lines: maths', () => {
  it('slope is rise over run, in any point order, undefined only for vertical pairs', () => {
    expect(S.slopeQ([0, 1], [3, 3])).toEqual(S.rat(2, 3));
    expect(S.slopeQ([3, 3], [0, 1])).toEqual(S.rat(2, 3));
    expect(S.slopeQ([2, 5], [8, 2])).toEqual(S.rat(-1, 2));
    expect(S.slopeQ([1, 4], [6, 4])).toEqual(S.rat(0));
    expect(S.slopeQ([2, 1], [2, 7])).toBeNull();
    expect(() => S.slopeQ([2, 1], [2, 1])).toThrow();
  });
  it('every slope triangle on one line gives the same slope (similar triangles), a broken path does not', () => {
    const m = S.rat(2, 3), b = S.rat(1);
    for (let x1 = -6; x1 <= 6; x1 += 3) for (let x2 = x1 + 3; x2 <= 12; x2 += 3) {
      const A: S.P2 = [x1, S.qNum(S.yAt(m, b, x1))], B: S.P2 = [x2, S.qNum(S.yAt(m, b, x2))];
      expect(S.qEq(S.slopeQ(A, B)!, m)).toBe(true);
      expect(S.legsSimilar(3, 2, x2 - x1, B[1] - A[1])).toBe(true);
    }
    expect(S.collinear([[0, 1], [3, 3], [9, 7]])).toBe(true);
    expect(S.collinear([[0, 1], [3, 3], [6, 6]])).toBe(false);
    expect(S.legsSimilar(1, 2, 1, 3)).toBe(false);
  });
  it('y = mx + b from two points, b = y - mx, and the lesson numbers', () => {
    expect(S.lineThrough([2, 5], [8, 2])).toEqual({ m: S.rat(-1, 2), b: S.rat(6) });
    expect(S.lineThrough([3, 3], [9, 7])).toEqual({ m: S.rat(2, 3), b: S.rat(1) });
    expect(S.eqTex(S.rat(2, 3), S.rat(1))).toBe('y = \\tfrac{2}{3}x + 1');
    expect(S.eqTex(S.rat(-1, 2), S.rat(6))).toBe('y = -\\tfrac{1}{2}x + 6');
    expect(S.eqTex(S.rat(-1), S.rat(-3))).toBe('y = -x - 3');
    expect(S.eqTex(S.rat(0), S.rat(4))).toBe('y = 4');
    // Riley: y = 2x + 3 has slope 2 everywhere, but y/x is 5 at x = 1 and 3 at x = 3
    expect(S.ratioQ(1, 5)).toEqual(S.rat(5)); expect(S.ratioQ(3, 9)).toEqual(S.rat(3)); expect(S.ratioQ(0, 3)).toBeNull();
    expect(S.constantRate([[0, 3], [1, 5], [3, 9]])).toEqual(S.rat(2));
    expect(S.constantRate([[0, 0], [1, 1], [3, 9]])).toBeNull();
  });
});

describe('slope-and-lines: misconception probes', () => {
  const find = (f: string, sg: string, pred: (it: SlItem) => boolean): SlItem => {
    for (let s = 1; s < 3000; s++) { const it = GEN[f]!(rng(s), s, sg); if (pred(it)) return it; }
    throw new Error(`no item for ${f}`);
  };
  const mcOf = (it: Item, r: Response) => it.check(r).mc;
  it('slope from two points: inverted, rise only, dropped sign', () => {
    const it = find('slopePts', 'change-quotient', x => x.answer.kind === 'frac' && x.answer.d > 1 && x.answer.d !== 1);
    const a = it.answer as { n: number; d: number };
    expect(mcOf(it, { kind: 'frac', w: 0, n: a.d, d: a.n })).toBe(MC.inverted);
    const neg = find('slopePts', 'negative-slope', x => x.answer.kind === 'num' && x.answer.v < 0);
    expect(mcOf(neg, { kind: 'num', v: -(neg.answer as { v: number }).v })).toBe(MC.sign);
  });
  it('scaled axes: counting squares is caught', () => {
    const it = find('squaresToScale', 'scaled-axes-slope', () => true);
    const m = /(\d+) squares? across.*?(\d+) squares? up/.exec(it.prompt.replace(/<[^>]+>/g, ''))!;
    expect(mcOf(it, { kind: 'num', v: Number(m[2]) / Number(m[1]) })).toBe(MC.steep);
  });
  it('paired changes: one sign flipped is inconsistent order', () => {
    const it = find('changes', 'paired-changes', () => true);
    const a = it.answer as { x: number; y: number };
    expect(mcOf(it, { kind: 'pair', x: a.x, y: -a.y })).toBe(MC.order);
  });
  it('recover b: the given output as b, and adding mx', () => {
    const it = find('bFromPoint', 'recover-b', () => true);
    const y1 = Number(/\(([^,]+), ([^)]+)\)/.exec(it.prompt)![2]!.replace('−', '-'));
    expect(mcOf(it, { kind: 'num', v: y1 })).toBe(MC.firstOut);
  });
  it('doubling a plan with a fee is caught', () => {
    const it = find('doubling', 'choose-model-in-context', x => /fee/.test(x.prompt));
    const c1 = Number(/cost \$(\d+)\./.exec(it.prompt)![1]);
    expect(mcOf(it, { kind: 'num', v: 2 * c1 })).toBe(MC.scalesNP);
  });
  it('words to y = mx + b: swapping m and b', () => {
    const it = find('wordsToMB', 'write-y-mx-plus-b', () => true);
    const a = it.answer as { x: number; y: number };
    expect(mcOf(it, { kind: 'pair', x: a.y, y: a.x })).toBe(MC.swapMB);
  });
});

describe('slope-and-lines: quality layer regressions', () => {
  it('pair answers read from the amber and teal values (a "+8" change too); a marked point splits into two', async () => {
    const { explain } = await import('../src/lesson/topics/slope-and-lines/explain');
    const cases: [string, string][] = [['changes', 'paired-changes'], ['tableChanges', 'paired-changes'], ['tableChanges', 'uneven-table-rate'], ['graphStep', 'graph-y-equals-kx'], ['graphStep', 'graph-y-mx-plus-b'], ['wordsToMB', 'write-y-mx-plus-b'], ['lineFromTwo', 'recover-b'], ['yOverX', 'ratio-vs-slope']];
    for (const [f, sg] of cases) for (let s = 1; s <= 80; s++) {
      const item = GEN[f]!(rng(s * 23 + 9), s, sg);
      expect(explain(item)?.result, `${f}: ${item.prompt}`).toEqual(item.answer);
    }
  });
  it('no "− −" in b = y − m·x, no "1 squares"', () => {
    for (let s = 1; s <= 300; s++) {
      for (const l of GEN.lineFromTwo!(rng(s), s, 'recover-b').solution) expect(l).not.toMatch(/[−-]\s*[−-]\s*\d/);
      const it2 = GEN.squaresToScale!(rng(s), s, 'scaled-axes-slope');
      expect(it2.prompt).not.toMatch(/\b1 squares\b/);
    }
  });
});

describe('slope-and-lines: sweep regressions (oracle findings)', () => {
  it('meaningMB with the slope equal to the start, varyingRate with a proportional table: one right choice (oracle agrees)', async () => {
    // @ts-expect-error: the oracle is an untyped .mjs module
    const O = (await import('./oracle/slope-and-lines.mjs')).default;
    // @ts-expect-error: an untyped .mjs module
    const { viewOf } = await import('../tools/quality/view.mjs');
    for (const [f, sg] of [['meaningMB', 'interpret-m-b-in-context'], ['varyingRate', 'nonlinear-varying-rate']] as const) for (let s = 1; s <= 400; s++) {
      const it = GEN[f]!(rng(s * 29 + 1), s, sg), q = viewOf(it, sg);
      expect(O.solve(q), `${f}: ${it.prompt} | ${(it.choices ?? []).join(' | ')}`).toBe((it.answer as { i: number }).i);
    }
  });
});
