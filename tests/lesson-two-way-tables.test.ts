// lesson-two-way-tables: the generic checks (every family x every sub-goal it serves x 300 seeds), then the topic
// checks: no control characters anywhere (a "\t" written instead of "\\t" turns \text into a TAB + "ext"), boards and
// solve lines typeset, the maths of the anchor data (topic JSON), the misconception classifier, the layouts (inside the
// frame, numbers >= 60 px, labels >= 44 px, tree labels clear of the branches), and the voice lines.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng, type Item } from '../src/lesson/runtime/item';
import { tex, texReady, texWidth } from '../src/core/tex';

/** the board is 512 px wide; a line may shrink to 60 px and no further */
const BOARD_W = 512, fits = (src: string, w = BOARD_W) => texWidth(tex(src), 60) <= w;
import { boxesOverlap } from '../src/core/math';
import { hitsLines } from '../src/blocks/block';
import { FAMILIES, FAMILY_NAMES, GENERATORS, MC, PRACTICE_BOARD_W, type TwItem } from '../src/lesson/topics/two-way-tables/items';
import { PLAN } from '../src/lesson/topics/two-way-tables/plan';
import { ANCHOR, PROVE, TURN, completeRF, cond, joint, pct, round, roundedJointSum, screen, totals } from '../src/lesson/topics/two-way-tables/twoWayMaths';
import { LABEL, SOLO, countSpec, numW, tableLayout, valText } from '../src/lesson/topics/two-way-tables/TwoWayTable';
import { barsAlone, barsUnder, segBox } from '../src/lesson/topics/two-way-tables/SegBars';
import { treeLayout } from '../src/lesson/topics/two-way-tables/Tree';
import { CHIPS, CLAIMS, SCRIPT, TEX } from '../src/lesson/topics/two-way-tables/script';
import { box } from '../src/core/math';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/us.statistics.two-way-tables-relative-frequencies-and-segmented-bar-graphs.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => TwItem>;
const CTRL = /[\u0000-\u001f\u007f]/;
const FRAME = box(60, 70, 1000, 1010);

beforeAll(async () => { await texReady(); });

describe('two-way-tables: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
  it('uses every family, 25-35 of them, each with a name; every misconception id is in the catalog', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    expect(used).toEqual(new Set(FAMILIES.map(f => f.id)));
    expect(used.size).toBeGreaterThanOrEqual(25); expect(used.size).toBeLessThanOrEqual(35);
    for (const f of used) expect(FAMILY_NAMES[f], f).toBeTruthy();
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
    for (const c of CHIPS) if (c.mc) expect(CATALOG.has(c.mc), c.mc).toBe(true);
  });
});

/** every string an item shows: prompt, board, choices, solution, board steps and the picture's labels */
function strings(it: TwItem): string[] {
  const p = it.picture.pic, out = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution, ...it.picture.steps, it.unit ?? ''];
  if (p.kind === 'table' || p.kind === 'graphs') out.push(...p.table.rows, ...p.table.cols);
  if (p.kind === 'table' && p.bars) out.push(...p.bars.spec.groups, ...p.bars.spec.cats);
  if (p.kind === 'bars') out.push(...p.bars.groups, ...p.bars.cats);
  if (p.kind === 'tree') out.push(...p.tree.first.map(q => q.label), ...p.tree.second.flat().map(q => q.label));
  if (p.kind === 'graphs') out.push(...p.names);
  return out;
}

describe('two-way-tables: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.family).toBe(f);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        expect(item.solution.length).toBeGreaterThan(0);
        for (const t of strings(item)) {
          expect(CTRL.test(t), `control character in ${JSON.stringify(t)}`).toBe(false);
          expect(t, t).not.toMatch(/undefined|NaN|Infinity|\[object/);
        }
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        }
        if (item.answer.kind === 'num') {
          expect(item.check({ kind: 'num', v: item.answer.v + 1000 }).ok).toBe(false);
          expect(String(item.answer.v).length, String(item.answer.v)).toBeLessThanOrEqual(6);
        }
        for (const src of [item.board, ...item.picture.steps]) { expect(tex(src).missing.filter(Boolean), src).toEqual([]); expect(fits(src, PRACTICE_BOARD_W), `too wide for the board: ${src}`).toBe(true); }
        seen.add(item.prompt + '|' + item.board + '|' + (item.choices ?? []).join() + JSON.stringify(item.picture.pic));
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

describe('two-way-tables: the maths (topic JSON anchor set)', () => {
  it('200 eighth graders, curfew x chores: totals, both conditional tables, joint, marginal', () => {
    const t = totals(ANCHOR);
    expect(t).toEqual({ row: [120, 80], col: [116, 84], all: 200 });
    expect(cond(ANCHOR, 'row').map(r => r.map(v => round(v, 1)))).toEqual([[70, 30], [40, 60]]);
    expect(cond(ANCHOR, 'col').map(r => r.map(v => round(v, 1)))).toEqual([[72.4, 42.9], [27.6, 57.1]]);
    expect(joint(ANCHOR).flat().reduce((s, v) => s + v, 0)).toBeCloseTo(100, 9);
    expect(pct(t.col[0]!, t.all)).toBe(58);
    expect((70 + 40) / 2).toBe(55);   // the unweighted average the marginal family diagnoses
  });
  it('your turn and prove it data', () => {
    expect(totals(TURN)).toEqual({ row: [120, 130], col: [90, 160], all: 250 });
    expect(pct(72, 90)).toBe(80); expect(pct(48, 160)).toBe(30);
    const c = cond(PROVE, 'row');
    expect(c[0]![0]).toBeCloseTo(c[1]![0]!, 9);                       // same split: no association
    expect(PROVE[0]![0]).toBe(Math.max(...PROVE.flat()));             // although the yes-yes cell is the biggest
  });
  it('rounded joint tables can add to 99.9 or 100.1', () => {
    let off = 0;
    for (let a = 20; a < 60; a++) if (roundedJointSum([[a, 37], [41, 53]]) !== 100) off++;
    expect(off).toBeGreaterThan(0);
  });
  it('screening: 2% base rate, 90% caught, 95% negative for the others -> about 27% of positives are right', () => {
    const s = screen(1000, 2, 90, 95);
    expect([s.tp, s.fn, s.fp, s.tn]).toEqual([18, 2, 49, 931]);
    expect(round(pct(s.tp, s.tp + s.fp), 0)).toBe(27);
  });
  it('complete a table: 45% dog, 30% dog and cat, 20% cat but no dog', () => {
    const v = completeRF({ r0: 45, c00: 30, c10: 20 });
    expect(v).toMatchObject({ c00: 30, c01: 15, c10: 20, c11: 35, k0: 50, k1: 50, r1: 55 });
    expect(completeRF({ c00: 30 })).toBeNull();
  });
});

describe('two-way-tables: the classifier names the whole that was used', () => {
  const find = (f: string, pred: (it: TwItem) => boolean) => { for (let s = 1; s < 400; s++) { const it = GEN[f]!(rng(s), s); if (pred(it)) return it; } throw new Error('none'); };
  it('rowPct: the column whole is the inverse, the grand total keeps the old whole, a count is not a percent', () => {
    const it = find('rowPct', x => x.picture.pic.kind === 'table');
    const pic = it.picture.pic as Extract<TwItem['picture']['pic'], { kind: 'table' }>;
    const { r, c } = it.picture.focus.part!, nC = pic.table.cols.length, nR = pic.table.rows.length;
    const v = pic.table.vals[r]![c]!, colT = pic.table.vals[nR]![c]!, all = pic.table.vals[nR]![nC]!;
    expect(it.check({ kind: 'num', v: round(pct(v, colT), 1) }).mc).toBe(MC.inverse);
    expect(it.check({ kind: 'num', v: round(pct(v, all), 1) }).mc).toBe(MC.notNewWhole);
    expect(it.check({ kind: 'num', v }).mc).toBe(MC.fixed);
  });
  it('jointPct: a group as the whole is the subgroup-denominator slip', () => {
    const it = find('jointPct', () => true);
    const pic = it.picture.pic as Extract<TwItem['picture']['pic'], { kind: 'table' }>;
    const { r, c } = it.picture.focus.part!, nC = pic.table.cols.length;
    expect(it.check({ kind: 'num', v: round(pct(pic.table.vals[r]![c]!, pic.table.vals[r]![nC]!), 1) }).mc).toBe(MC.subgroupJoint);
  });
  it('weightedTrap and combineGroups: the plain average is diagnosed', () => {
    for (const f of ['weightedTrap', 'combineGroups']) {
      const it = GEN[f]!(rng(5), 1);
      const m = it.prompt.match(/(\d+(?:\.\d+)?)%/g)!.map(s => parseFloat(s));
      if (f === 'weightedTrap') expect(it.check({ kind: 'num', v: (m[0]! + m[1]!) / 2 }).mc).toBe(MC.unweighted);
    }
  });
  it('treeLeaf: adding the branches is diagnosed', () => {
    const it = find('treeLeaf', () => true);
    const tr = (it.picture.pic as Extract<TwItem['picture']['pic'], { kind: 'tree' }>).tree, { i, j } = it.picture.focus.path!;
    expect(it.check({ kind: 'num', v: tr.first[i]!.p! + tr.second[i]![j]!.p! }).mc).toBe(MC.addsStages);
  });
  it('readSeg: reading the top boundary as the length is diagnosed', () => {
    const it = find('readSeg', () => true);
    const b = (it.picture.pic as Extract<TwItem['picture']['pic'], { kind: 'bars' }>).bars, { g } = it.picture.focus.seg!;
    expect(it.check({ kind: 'num', v: b.pcts[g]![0]! + b.pcts[g]![1]! }).mc).toBe(MC.endReading);
  });
  it('a percent typed as a decimal counts', () => {
    const it = find('rowPct', x => x.answer.kind === 'num' && x.answer.v === Math.round(x.answer.v) && x.answer.v > 1);
    expect(it.check({ kind: 'num', v: (it.answer as { v: number }).v / 100 }).ok).toBe(true);
  });
});

describe('two-way-tables: layouts', () => {
  const inside = (b: { x0: number; x1: number; y0: number; y1: number }, F = FRAME) => b.x0 >= F.x0 - 0.5 && b.x1 <= F.x1 + 0.5 && b.y0 >= F.y0 - 0.5 && b.y1 <= F.y1 + 0.5;
  it('every practice picture fits the frame; table numbers fit their cells at >= 60 px', () => {
    for (const f of Object.keys(GEN)) for (let s = 1; s <= 60; s++) {
      const it = GEN[f]!(rng(s * 13 + 1), s), p = it.picture.pic;
      if (p.kind === 'table' || p.kind === 'graphs') {
        const area = p.kind === 'graphs' ? box(90, 64, 990, 456) : p.bars ? box(90, 92, 990, 560) : SOLO.area;
        const L = tableLayout(p.table, area, p.kind === 'graphs' ? { maxRowH: 84 } : p.bars ? { maxRowH: 112 } : SOLO.o);
        expect(inside(L.all, area), `${f} table ${JSON.stringify(L.all)}`).toBe(true);
        expect(L.num).toBeGreaterThanOrEqual(60);
        for (const row of p.table.vals) for (const v of row) expect(numW(valText(v, p.table.fmt, p.table.d), L.num) + 20, `${f} ${v}`).toBeLessThanOrEqual(L.colW);
        if (p.kind === 'table' && p.bars) {
          const G = barsUnder(p.bars.spec, L, box(90, 588, 990, 1012), p.bars.orient);
          for (const b of G.bars) expect(inside(b), `${f} bar`).toBe(true);
        }
      }
      if (p.kind === 'bars') {
        const G = barsAlone(p.bars, box(80, 96, 1000, 1004), p.orient);
        for (const b of G.bars) expect(inside(b), `${f} bar ${JSON.stringify(b)}`).toBe(true);
        for (let g = 0; g < G.bars.length; g++) for (let k = 0; k < p.bars.cats.length; k++) expect(inside(segBox(G, p.bars, g, k))).toBe(true);
        expect(G.bars.every(b => (G.orient === 'h' ? b.w : b.h) >= 400), f).toBe(true);
      }
      if (p.kind === 'tree') {
        const G = treeLayout(p.tree, box(80, 96, 1000, 1004));
        const labels = [...G.b1.map(q => q.box), ...G.b2.flat().map(q => q.box), ...G.midLabel.map(q => q.box), ...G.leafLabel.flat().map(q => q.box), ...G.leafVal.flat().map(q => q.box)];
        for (const b of labels) { expect(inside(b), `${f} tree label ${JSON.stringify(b)}`).toBe(true); expect(hitsLines(b, G.lines, 2), `${f} label on a branch ${JSON.stringify(b)}`).toBe(false); }
        for (let a = 0; a < labels.length; a++) for (let b = a + 1; b < labels.length; b++) expect(boxesOverlap(labels[a]!, labels[b]!), `${f} labels ${a}/${b}`).toBe(false);
      }
    }
  });
  it('the lesson tables and their bars fit; labels are 44 px', () => {
    expect(LABEL).toBeGreaterThanOrEqual(44);
    for (const [cells, rows, cols, o] of [[ANCHOR, ['Curfew', 'No curfew'], ['Chores', 'No chores'], 'h'], [TURN, ['Bus', 'No bus'], ['Breakfast', 'No breakfast'], 'v'], [PROVE, ['Music', 'No music'], ['Sport', 'No sport'], 'h']] as const) {
      const spec = countSpec(rows, cols, cells), area = box(90, 92, 990, 560), L = tableLayout(spec, area);
      expect(inside(L.all, area)).toBe(true);
      const t = totals(cells as number[][]);
      const bars = o === 'h' ? { groups: rows, cats: cols, pcts: cells.map((r, i) => r.map(v => pct(v, t.row[i]!))) } : { groups: cols, cats: rows, pcts: cells[0]!.map((_, j) => cells.map(r => pct(r[j]!, t.col[j]!))) };
      const G = barsUnder(bars, L, box(90, 588, 990, 1012), o);
      for (const b of G.bars) expect(inside(b)).toBe(true);
    }
  });
});

describe('two-way-tables: parts 1-4 text and voice', () => {
  it('no control characters in any board line, panel line, claim or chip; every board line typesets', () => {
    for (const [k, s] of Object.entries(TEX)) { expect(CTRL.test(s), k).toBe(false); expect(tex(s).missing.filter(Boolean), k).toEqual([]); expect(fits(s), k).toBe(true); }
    for (const [k, s] of Object.entries(SCRIPT)) expect(CTRL.test(s), k).toBe(false);
    for (const s of [...CLAIMS, ...CHIPS.map(c => c.t)]) expect(CTRL.test(s), s).toBe(false);
    const page = fs.readFileSync('pages/lessons/two-way-tables.ts', 'utf8');
    // a TeX command in a page string must be written with a double backslash
    expect(page).not.toMatch(/'[^'\n]*(?<!\\)\\(?:text|frac|times|cssId|approx|circ|Rightarrow)\b/);
  });
  it('every panel line has a spoken line (same ids), spoken text has no digits or symbols', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/two-way-tables/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) { expect(l.text, id).not.toMatch(/[0-9%÷×=<>/]/); expect(CTRL.test(l.text), id).toBe(false); }
    const page = fs.readFileSync('pages/lessons/two-way-tables.ts', 'utf8');
    for (const m of page.matchAll(/(?:say|fbk)\((?:[a-z]+, )?'([a-z]\.[a-z0-9.]+)'/g)) expect(lines[m[1]!], m[1]).toBeDefined();
  });
});

describe('two-way-tables: quality layer regressions', () => {
  it('every choice family ends its steps on the right choice; countUnknown has 2+ steps', async () => {
    const { explain } = await import('../src/lesson/topics/two-way-tables/explain');
    for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 30; s++) {
      const item = GEN[f]!(rng(s * 59 + 3), s, p.id);
      const ex = explain(item);
      expect(ex?.result, `${p.id}/${f}: ${item.prompt}`).toEqual(item.answer);
      expect(ex!.steps.length, `${p.id}/${f}`).toBeGreaterThanOrEqual(2);
    }
  });
  it('screenWord never asks about "the 1 bags"', () => {
    for (let s = 1; s <= 400; s++) expect(GEN.screenWord!(rng(s), s, 'screening-test-frequencies').prompt).not.toMatch(/the (<[^>]+>)?1(<\/b>)? \w+s that/);
  });
  it('the check-in figure is a small self-contained SVG of the table', async () => {
    const { PLACEMENT } = await import('../src/lesson/topics/two-way-tables/placement');
    for (let s = 1; s <= 40; s++) {
      const svg = PLACEMENT.figure!(GEN.rowPct!(rng(s), s, 'conditional-both-directions'))!;
      expect(svg).toMatch(/^<svg[\s>].*viewBox=/);
      expect(svg.length).toBeLessThanOrEqual(6144);
      expect(svg).not.toMatch(/href=|<script|NaN|undefined/);
    }
  });
});
describe('two-way-tables: one full stop after "p.m."', () => {
  it('assocTable and fromConditional never print "p.m.."', () => {
    let seen = 0;
    for (let s = 1; s <= 600; s++) for (const [f, sg] of [['assocTable', 'association-compare-distributions'], ['fromConditional', 'complete-rf-table']] as const) {
      const it = GEN[f]!(rng(s), s, sg), all = [it.prompt, ...(it.choices ?? []), ...it.solution].join(' ');
      if (/p\.m\./.test(all)) seen++;
      expect(all).not.toMatch(/p\.m\.\./);
    }
    expect(seen).toBeGreaterThan(0);
  });
});
