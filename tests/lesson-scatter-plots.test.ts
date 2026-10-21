// lesson-scatter-plots: the generic checks (every family x every sub-goal it serves x 300 seeds), then the topic's own:
// the lesson's data set and its numbers, picture specs that the blocks can draw, the strength / best-line / association
// facts the answers claim, misconception probes, no control characters anywhere (TeX \t bugs), and spoken text.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { type Item, rng } from '../src/lesson/runtime/item';
import { FAMILIES, GENERATORS, MC, type Pic, type SPItem } from '../src/lesson/topics/scatter-plots/items';
import { PLAN } from '../src/lesson/topics/scatter-plots/plan';
import { CONTEXTS, CURVED, NONE, SM_AT, SM_FAR, SM_LINE, SM_P1, SM_P2, SM_PLOT, SM_TURN, SM_WIDE, SMOOTHIE, above, below, corr, fitLine, lineY, meanGap, niceAxis, texWords, type PlotSpec } from '../src/lesson/topics/scatter-plots/bivariate';
import { BOARD_TEX, PANEL } from '../src/lesson/topics/scatter-plots/script';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-40-scatter-plots-and-bivariate-data.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => Item>;
const LINES = JSON.parse(fs.readFileSync('pages/lessons/scatter-plots/voice/lines.json', 'utf8')) as Record<string, { text: string }>;

describe('scatter-plots: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
  it('has about 35 families, every one used by the plan', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    expect(FAMILIES.length).toBeGreaterThanOrEqual(30);
    for (const f of FAMILIES) expect(used.has(f.id), f.id).toBe(true);
  });
});

describe('scatter-plots: families', () => {
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

// ---------- helpers ----------
const items: { sg: string; f: string; it: SPItem }[] = [];
for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= 120; s++) items.push({ sg: p.id, f, it: GEN[f]!(rng(s * 131 + 3), s, p.id) as SPItem });
const onStep = (v: number, s: number) => Math.abs(v / s - Math.round(v / s)) < 1e-6;
function specOk(s: PlotSpec, where: string): void {
  expect(s.x1 > s.x0 && s.y1 > s.y0, where).toBe(true);
  expect(onStep(s.x0, s.xStep) && onStep(s.x1, s.xStep) && onStep(s.y0, s.yStep) && onStep(s.y1, s.yStep), `${where}: ends on the grid ${JSON.stringify([s.x0, s.x1, s.xStep, s.y0, s.y1, s.yStep])}`).toBe(true);
  expect((s.x1 - s.x0) / s.xStep, `${where}: x lines`).toBeLessThanOrEqual(16);
  expect((s.y1 - s.y0) / s.yStep, `${where}: y lines`).toBeLessThanOrEqual(16);
  expect(s.xName.length + s.yName.length, where).toBeGreaterThan(4);
  expect(s.xName.length, `${where}: x name length`).toBeLessThanOrEqual(30);
  expect(s.yName.length, `${where}: y name length`).toBeLessThanOrEqual(30);
  const inW = (x: number, y: number) => x >= s.x0 - 1e-9 && x <= s.x1 + 1e-9 && y >= s.y0 - 1e-9 && y <= s.y1 + 1e-9;
  for (const p of s.pts) expect(inW(p.x, p.y), `${where}: point (${p.x}, ${p.y}) in ${JSON.stringify([s.x0, s.x1, s.y0, s.y1])}`).toBe(true);
  for (const m of s.marks ?? []) expect(inW(m.x, m.y), `${where}: spot ${m.tag}`).toBe(true);
  for (const L of s.lines ?? []) expect(Number.isFinite(L.m) && Number.isFinite(L.b), where).toBe(true);
  for (const G of s.groups ?? []) for (const i of G) expect(s.pts[i], where).toBeDefined();
  for (const i of s.ring ?? []) expect(s.pts[i], where).toBeDefined();
  // no two dots drawn on top of each other (a hidden dot changes the count) unless one carries a count
  const px = (p: { x: number; y: number }): [number, number] => [(p.x - s.x0) / (s.x1 - s.x0) * 760, (p.y - s.y0) / (s.y1 - s.y0) * 700];
  for (let i = 0; i < s.pts.length; i++) for (let j = 0; j < i; j++) {
    const [a, b] = px(s.pts[i]!), [c, d] = px(s.pts[j]!);
    expect(Math.hypot(a - c, b - d) > 3, `${where}: dots ${i} and ${j} overlap exactly`).toBe(true);
  }
}
function picOk(pic: Pic, where: string): void {
  if (pic.kind === 'plot') {
    specOk(pic.plot, where);
    const nL = pic.plot.lines?.length ?? 0;
    for (const i of pic.show?.lines ?? []) expect(i < nL, where).toBe(true);
    if (pic.show?.guide) expect(pic.show.guide.line < nL, where).toBe(true);
    for (const a of pic.solve) {
      if (a.a === 'line' || a.a === 'best') expect(a.i < nL, `${where}: ${a.a}`).toBe(true);
      if (a.a === 'guide') { expect(a.line < nL, where).toBe(true); expect(a.x >= pic.plot.x0 && a.x <= pic.plot.x1, where).toBe(true); }
      if (a.a === 'sticks') expect(a.line < nL, where).toBe(true);
      if (a.a === 'ring') for (const i of a.i) expect(pic.plot.pts[i], `${where}: ring ${i}`).toBeDefined();
      if (a.a === 'groups') expect(pic.plot.groups?.length, where).toBeGreaterThan(0);
      if (a.a === 'band') expect(pic.plot.band, where).toBeDefined();
      if (a.a === 'ruler') expect(pic.plot.ruler, where).toBeDefined();
      if (a.a === 'mark') expect(pic.plot.marks?.some(m => m.tag === a.tag), where).toBe(true);
      if (a.a === 'row' && pic.table) expect(pic.table.rows[a.r], where).toBeDefined();
    }
    if (pic.table) for (const r of pic.table.rows) expect(r.length, where).toBe(pic.table.head.length);
  } else if (pic.kind === 'two') {
    specOk(pic.a, where + ' A'); specOk(pic.b, where + ' B');
    expect([pic.a.x0, pic.a.x1, pic.a.xStep]).toEqual([pic.b.x0, pic.b.x1, pic.b.xStep]);
  } else if (pic.kind === 'table') {
    for (const r of pic.table.rows) expect(r.length, where).toBe(pic.table.head.length);
    expect(pic.table.rows.length, where).toBeLessThanOrEqual(9);
    for (const a of pic.solve) {
      if (a.a === 'row' || a.a === 'cell' || a.a === 'reveal') expect(pic.table.rows[a.r], `${where}: ${JSON.stringify(a)}`).toBeDefined();
      if (a.a === 'cell' || a.a === 'reveal' || a.a === 'col') expect(a.c < pic.table.head.length, where).toBe(true);
    }
  }
}
/** every string inside a value */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => strings(x, out));
  return out;
}
// eslint-disable-next-line no-control-regex
const CTRL = /[\u0000-\u001f\u007f]/;

describe('scatter-plots: the lesson data (12 summer days at a smoothie stand)', () => {
  it('has 12 days, two of them at 80°F, all inside the plot', () => {
    expect(SMOOTHIE.length).toBe(12);
    expect(SMOOTHIE.filter(p => p.x === 80).map(p => p.y).sort()).toEqual([58, 72]);
    specOk(SM_PLOT, 'SM_PLOT'); specOk(SM_WIDE, 'SM_WIDE');
  });
  it('the line by eye goes through (70, 40) and (90, 90): slope 2.5, intercept -135', () => {
    expect(lineY(SM_LINE, SM_P1.x)).toBe(SM_P1.y);
    expect(lineY(SM_LINE, SM_P2.x)).toBe(SM_P2.y);
    expect((SM_P2.y - SM_P1.y) / (SM_P2.x - SM_P1.x)).toBe(SM_LINE.m);
    expect(lineY(SM_LINE, SM_AT)).toBe(65);
    expect(lineY(SM_LINE, SM_TURN)).toBe(80);
    expect(lineY(SM_LINE, SM_FAR)).toBe(165);
    expect(lineY(SM_LINE, 0)).toBe(-135);
  });
  it('is a fair fit: close to least squares, dots on both sides all along, small mean gap', () => {
    const ls = fitLine(SMOOTHIE);
    expect(Math.abs(ls.m - SM_LINE.m)).toBeLessThan(0.3);
    expect(Math.abs(lineY(ls, 80) - lineY(SM_LINE, 80))).toBeLessThan(2);
    expect(above(SMOOTHIE, SM_LINE)).toBe(5);
    expect(below(SMOOTHIE, SM_LINE)).toBe(7);
    expect(meanGap(SMOOTHIE, SM_LINE)).toBeLessThan(5);
    expect(corr(SMOOTHIE)).toBeGreaterThan(0.95);
    // the two 80°F days sit on either side of the prediction
    expect(58 < 65 && 72 > 65).toBe(true);
    // the observed range
    expect(Math.min(...SMOOTHIE.map(p => p.x))).toBe(68);
    expect(Math.max(...SMOOTHIE.map(p => p.x))).toBe(94);
    // nearest observed days to 86°F are 85 (82 sold) and 87 (79 sold): neither is the line's 80
    expect(SMOOTHIE.find(p => p.x === 85)!.y).toBe(82);
    expect(SMOOTHIE.find(p => p.x === 87)!.y).toBe(79);
  });
  it('niceAxis gives equal steps that cover the range', () => {
    for (const [a, b] of [[31, 97], [142, 187], [2.5, 9], [0, 15], [1.6, 4.9]] as const) {
      const X = niceAxis(a, b);
      expect(X.a).toBeLessThanOrEqual(a); expect(X.b).toBeGreaterThanOrEqual(b);
      expect((X.b - X.a) / X.step).toBeLessThanOrEqual(8);
    }
  });
  it('contexts are realistic: the trend stays in a sensible range over the observed x', () => {
    for (const c of CONTEXTS) for (const x of [c.lo, c.hi]) { const y = (c.m ?? 0) * x + (c.b ?? 0); expect(y, c.id).toBeGreaterThan(0); }
    for (const c of [...CURVED, ...NONE]) for (const x of [c.lo, c.hi]) expect(c.f!(x), c.id).toBeGreaterThan(0);
  });
});

describe('scatter-plots: pictures and facts', () => {
  it('every picture can be drawn (windows, dots, lines, spots, tables)', () => {
    for (const { sg, f, it: item } of items) picOk(item.picture.pic, `${sg}/${f} ${item.id}`);
  });
  it('whichStronger: the plot called stronger really has the larger |r|', () => {
    for (const { it: item } of items.filter(x => x.f === 'whichStronger')) {
      const pic = item.picture.pic;
      if (pic.kind !== 'two') continue;
      const w = pic.solve.find(a => a.a === 'pickPlot');
      if (!w || w.a !== 'pickPlot' || w.which === 2) continue;
      const rs = [Math.abs(corr(pic.a.pts)), Math.abs(corr(pic.b.pts))];
      expect(rs[w.which]! - rs[1 - w.which]!, item.prompt).toBeGreaterThan(0.1);
    }
  });
  it('bestLine: the line called best is the closest to the dots', () => {
    for (const { it: item } of items.filter(x => x.f === 'bestLine')) {
      const pic = item.picture.pic;
      if (pic.kind !== 'plot') continue;
      const gaps = pic.plot.lines!.map(L => meanGap(pic.plot.pts, L));
      expect(gaps[0]!, item.prompt).toBeLessThan(Math.min(gaps[1]!, gaps[2]!) / 1.3);
    }
  });
  it('associated: "clearly different" shares differ by 20+ points, "nearly the same" by 5 or less', () => {
    for (const { it: item } of items.filter(x => x.f === 'associated')) {
      const pic = item.picture.pic;
      if (pic.kind !== 'table') continue;
      const r0 = pic.table.rows[0]!, r1 = pic.table.rows[1]!;
      const p0 = (100 * Number(r0[1])) / Number(r0[3]), p1 = (100 * Number(r1[1])) / Number(r1[3]);
      const right = item.choices![(item.answer as { i: number }).i]!;
      if (/clearly different|larger share/.test(right)) expect(Math.abs(p0 - p1), right).toBeGreaterThanOrEqual(20);
      else expect(Math.abs(p0 - p1), right).toBeLessThanOrEqual(5);
    }
  });
  it('nameDirection: positive / negative clouds are clear, "none" clouds are shapeless', () => {
    for (const { it: item } of items.filter(x => x.f === 'nameDirection')) {
      const pic = item.picture.pic;
      if (pic.kind !== 'plot') continue;
      const r = corr(pic.plot.pts), right = item.choices![(item.answer as { i: number }).i]!;
      if (right.startsWith('Positive') || right.startsWith('Still positive')) expect(r).toBeGreaterThan(0.7);
      else if (right.startsWith('Negative') || right.startsWith('Still negative')) expect(r).toBeLessThan(-0.7);
      else expect(Math.abs(r)).toBeLessThan(0.3);
    }
  });
});

describe('scatter-plots: misconception probes', () => {
  const probe = (f: string, sg: string, test: (it: SPItem) => void) => { for (let s = 1; s <= 150; s++) test(GEN[f]!(rng(s * 17 + 5), s, sg) as SPItem); };
  it('a doubled dot counted once is dot-case-identity; one dot per x is drops-same-x', () => {
    probe('countCases', 'point-as-case', it => {
      const pic = it.picture.pic;
      if (pic.kind !== 'plot') return;
      const v = (it.answer as { v: number }).v;
      if (pic.plot.pts.some(p => (p.n ?? 1) > 1)) expect(it.check({ kind: 'num', v: v - 1 }).mc).toBe(MC.dotIdentity);
      else expect(it.check({ kind: 'num', v: 1 }).mc).toBe(MC.dropsSameX);
    });
  });
  it('the row total for a joint cell is total-cell-as-joint-cell', () => {
    probe('readCell', 'two-way-table', it => {
      const pic = it.picture.pic;
      if (pic.kind !== 'table' || !/row AND/.test(it.prompt)) return;
      const r = pic.table.rows.findIndex(row => it.prompt.includes(`<b>${row[0]}</b>`));
      expect(it.check({ kind: 'num', v: Number(pic.table.rows[r]![3]) }).mc).toBe(MC.totalCell);
    });
  });
  it('dividing by everyone is condition-not-made-new-whole', () => {
    probe('relFreq', 'relative-frequencies', it => {
      const pic = it.picture.pic;
      if (pic.kind !== 'table' || it.input !== 'num') return;
      const r = pic.table.rows.findIndex(row => it.prompt.includes(`<b>${row[0]}</b>`)), cell = Number(pic.table.rows[r]![1]), G = Number(pic.table.rows[2]![3]);
      const v = (100 * cell) / G;
      if (Math.abs(v - (it.answer as { v: number }).v) > 0.5) expect(it.check({ kind: 'num', v }).mc).toBe(MC.wholeKept);
    });
  });
  it('the axis ends as the observed range is misidentifies-observed-range', () => {
    probe('observedRange', 'interp-vs-extrap', it => {
      const pic = it.picture.pic;
      if (pic.kind !== 'plot') return;
      expect(it.check({ kind: 'pair', x: pic.plot.x0, y: pic.plot.x1 }).mc).toBe(MC.axisRange);
    });
  });
  it('reading the nearest dot instead of the line is reads-nearest-point-not-line', () => {
    probe('readPrediction', 'prediction-from-line', it => {
      const pic = it.picture.pic;
      if (pic.kind !== 'plot') return;
      const g = pic.solve.find(a => a.a === 'guide') as { x: number };
      const nearest = pic.plot.pts.reduce((a, p) => (Math.abs(p.x - g.x) < Math.abs(a.x - g.x) ? p : a), pic.plot.pts[0]!);
      expect(it.check({ kind: 'num', v: nearest.y }).mc).toBe(MC.nearest);
    });
  });
  it('the topic JSON misconceptions are all diagnosed somewhere', () => {
    const seen = new Set<string>();
    for (const { it: item } of items) {
      if (item.choices) item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) seen.add(mc); });
    }
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
    const want: string[] = TOPIC.subgoals.flatMap((s: { misconceptions: string[] }) => s.misconceptions);
    const byNum = new Set<string>([MC.sortsPairs, MC.dotIdentity, MC.dropsSameX, MC.sameScale, MC.nearest, MC.offLine, MC.axisRange, MC.totalCell, MC.twoCells, MC.wholeKept]);
    const missing = [...new Set(want)].filter(id => !seen.has(id) && !byNum.has(id));
    expect(missing).toEqual([]);
  });
});

describe('scatter-plots: text hygiene', () => {
  it('no control characters (TeX \\t, \\n, \\b slips) in any board, prompt, choice, solution or picture string', () => {
    for (const { it: item } of items) {
      const all = [item.prompt, item.board, ...(item.choices ?? []), ...item.solution, item.pairLead ?? '', item.pairOp ?? '', item.pairTail ?? '', item.unit ?? '', ...strings(item.picture)];
      for (const s of all) expect(CTRL.test(s), `${item.id}: ${JSON.stringify(s)}`).toBe(false);
    }
    for (const [k, s] of Object.entries(BOARD_TEX)) expect(CTRL.test(s), `board ${k}: ${JSON.stringify(s)}`).toBe(false);
    for (const [k, s] of Object.entries(PANEL)) expect(CTRL.test(s), `panel ${k}: ${JSON.stringify(s)}`).toBe(false);
    for (const s of strings([SM_PLOT, SM_WIDE])) expect(CTRL.test(s)).toBe(false);
    expect(texWords('high temperature (°F)')).toBe('\\text{high temperature (}{}^{\\circ}\\mathrm{F}\\text{)}');
  });
  it('TeX on the boards has balanced braces and no stray backslash-letters from tabs', () => {
    const tex = [...Object.values(BOARD_TEX), ...items.map(x => x.it.board)];
    for (const s of tex) {
      let d = 0;
      for (const ch of s) { if (ch === '{') d++; if (ch === '}') d--; expect(d, s).toBeGreaterThanOrEqual(0); }
      expect(d, s).toBe(0);
      expect(/(^|[^\\])\\(?![a-zA-Z,;:! %$#&_{}\\]|$)/.test(s), s).toBe(false);
    }
  });
  it('every panel line of parts 1-4 has a spoken line, and spoken text has no digits or symbols', () => {
    for (const id of Object.keys(PANEL)) expect(LINES[id], `voice line ${id}`).toBeDefined();
    for (const [id, l] of Object.entries(LINES)) {
      expect(/[0-9=+×÷%$°<>/]/.test(l.text), `${id}: ${l.text}`).toBe(false);
      expect(l.text.length, id).toBeGreaterThan(3);
    }
  });
  it('US spelling in the kid-facing text', () => {
    const all = [...Object.values(PANEL), ...items.flatMap(x => [x.it.prompt, ...(x.it.choices ?? []), ...x.it.solution])].join(' ');
    expect(/colour|centre|metre|litre|favourite|behaviour|analyse/i.test(all)).toBe(false);
  });
});
