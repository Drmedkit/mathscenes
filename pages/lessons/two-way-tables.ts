// two-way-tables.ts: "Two-way tables, relative frequencies and segmented bar graphs" (grade 8, 8.SP.A.4, HSS-ID.B.5)
// on the shared lesson runtime. The heart: a percent from a two-way table is a part over a WHOLE, and the question's
// "of the ..." phrase picks the whole (a row, a column, or everybody). A row (or column) of the table drops into one
// 100% bar; bars that split in different places show an association.
//   1 The question   200 eighth graders, curfew x chores: of the curfew students, what percent do chores?
//                    3 cards: 42% (all 200), 70%, about 72% (the chores column) + how sure
//   2 Worked example read the table (totals both ways), name the whole (amber ring on the row), part over whole (the row
//                    becomes a 70 | 30 bar), the other row (40 | 60): association; one "why?" with 3 reasons
//   3 Your turn      250 students, bus x breakfast, a COLUMN question, faded from the end: the totals are given; the kid
//                    names the whole, types 80%, judges the association (columns drop into vertical bars)
//   4 Prove it       Jordan: "120 is the biggest cell, so music students are more likely to play a sport" (no association:
//                    two thirds of both groups); a because-chain from reason chips, the bars line up
//   5 Practice       all 15 sub-goals one after another, then mixed (runtime/practice.ts); 35 families with pictures
// Voiced lines: pages/lessons/two-way-tables/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box, clamp } from '../../src/core/math';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Line, line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { SOLO, type TableLayout, type TableSpec, countSpec, drawTable, tableLayout } from '../../src/lesson/topics/two-way-tables/TwoWayTable';
import { type BarsGeom, type BarsSpec, barsAlone, barsUnder, drawBars } from '../../src/lesson/topics/two-way-tables/SegBars';
import { drawTree, treeLayout } from '../../src/lesson/topics/two-way-tables/Tree';
import { ANCHOR, BUS, CURFEW, type Ctx, type Grid, MUSIC, PROVE, TURN, pct, totals } from '../../src/lesson/topics/two-way-tables/twoWayMaths';
import { FAMILY_NAMES, GENERATORS, MC, PRACTICE_BOARD_W, type TwItem } from '../../src/lesson/topics/two-way-tables/items';
import { explain } from '../../src/lesson/topics/two-way-tables/explain';
import { PLAN } from '../../src/lesson/topics/two-way-tables/plan';
import { CHIPS, CLAIMS, SCRIPT, TEX } from '../../src/lesson/topics/two-way-tables/script';
import LINES from './two-way-tables/voice/lines.json';

const SLUG = 'two-way-tables';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the panel shows SCRIPT[id], the narrator says lines.json[id] */
function say(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, SCRIPT[id] ?? id);
}
function fbk(ok: boolean, id: string, extra: Kid[] = []): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); }

// ===================== the scene: a table with bars under it =====================
const TABLE_AREA = box(90, 92, 990, 560), BARS_AREA = box(90, 588, 990, 1012);
const AMB = { col: 'first' as Paint }, LIME = { col: 'link' as Paint };
const TAGS = { a: AMB, b: AMB, n: AMB, w: AMB, p: LIME, s: LIME };
type Kind = 'row' | 'col' | 'all';
interface TS {
  spec: TableSpec; TL: TableLayout; bars: BarsSpec; BG: BarsGeom;
  st: { whole: { kind: Kind; i: number } | null; alt: { kind: Kind; i: number } | null; part: { r: number; c: number } | null; align: number | null };
  draw(c: Canvas): void;
}
function tableScene(pre: string, cells: Grid, x: Ctx, orient: 'h' | 'v', d = 1): TS {
  const rows = x.rows.cats.map(q => q.label), cols = x.cols.cats.map(q => q.label);
  const spec = countSpec(rows, cols, cells, { tint: orient === 'h' ? 'col' : 'row' });
  const TL = tableLayout(spec, TABLE_AREA);
  const t = totals(cells);
  const bars: BarsSpec = orient === 'h'
    ? { groups: rows, cats: cols, pcts: cells.map((r, i) => r.map(v => pct(v, t.row[i]!))), labels: true, d }
    : { groups: cols, cats: rows, pcts: cells[0]!.map((_, j) => cells.map(r => pct(r[j]!, t.col[j]!))), labels: true, d };
  const BG = barsUnder(bars, TL, BARS_AREA, orient);
  const st: TS['st'] = { whole: null, alt: null, part: null, align: null };
  const K = (s: string) => tr.k(pre + s);
  const nG = bars.groups.length;
  return {
    spec, TL, bars, BG, st,
    draw(c) {
      const lifted = Array.from({ length: nG }, (_, g) => bars.cats.map((_, s) => (orient === 'h' ? { r: g, c: s, k: K('m' + g) } : { r: s, c: g, k: K('m' + g) }))).flat();
      drawTable(c, spec, TL, { grid: K('grid'), heads: K('heads'), cells: K('cells'), totals: K('totals') }, {
        whole: st.whole ? { ...st.whole, k: K('ring') } : null, alt: st.alt ? { ...st.alt, k: K('alt') } : null,
        part: st.part ? { ...st.part, k: K('part') } : null, dim: K('dim'), lifted,
      });
      drawBars(c, bars, BG, { axis: K('axis'), bars: Array.from({ length: nG }, (_, g) => K('m' + g)), labels: 1 }, {
        from: (g, s) => (orient === 'h' ? TL.cell(g, s) : TL.cell(s, g)), morph: Array.from({ length: nG }, (_, g) => K('m' + g)),
        align: st.align !== null ? { s: st.align, k: K('align') } : null,
      });
    },
  };
}
const showTable = (pre: string, d0 = 0) => {
  tr.set(pre + 'grid', 1, 1.0, d0); tr.set(pre + 'heads', 1, 1.0, d0 + 0.5); tr.set(pre + 'cells', 1, 1.4, d0 + 1.0);
};
/** a TeX line placed right after another one (same baseline) */
function after(L: Line, key: string, src: string, tags?: Line['tags']): Line {
  const F = tex(src) as Formula, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
  return { key, F, x: b.x1 + L.size * 0.25, y: L.y, size: L.size, tags };
}
const ln = (key: string, src: string, y: number, size: number) => line(key, src, y, size, TAGS);

// ===================== 1. The question =====================
const CARDS = [
  { v: '42%', id: MC.notNewWhole, why: 'q.cb.all', val: 42 },
  { v: '70%', id: '', why: 'q.cb.right', val: 70 },
  { v: 'about 72%', id: MC.inverse, why: 'q.cb.col', val: 72.4 },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = tableScene('q.', ANCHOR, CURFEW, 'h');
  const L1 = ln('q.L1', TEX.qAsk, 330, 120);
  setScene({ table: 1080, model: c => S.draw(c), lines: [L1], leads: [] });
  showTable('q.'); tr.set('q.totals', 1, 0.8, 2.4); tr.set('q.L1', 1, 1.0, 2.8);
  S.st.part = { r: 0, c: 0 }; tr.set('q.part', 1, 0.6, 3.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Of the 200 eighth graders, 120 have a curfew and 84 of those do chores: what percent of the curfew students do chores?', board: '84 / ? = ?%', response: c.v, expected: '70%', correct: c.val === 70, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v.replace('about ', '')}<small>${cd.v.startsWith('about') ? 'about' : 'exactly'}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Curfews and chores'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const S = tableScene('e.', ANCHOR, CURFEW, 'h');
  const Lr = ln('e.rows', TEX.rows, 160, 76), Lc = ln('e.cols', TEX.cols, 255, 76);
  const Lf = ln('e.frac', TEX.eFrac, 440, 104), Lres = after(Lf, 'e.res', TEX.eRes, TAGS);
  const Lo = ln('e.other', TEX.eOther, 640, 104), Ld = ln('e.diff', TEX.eDiff, 830, 76);
  setScene({ table: 1080, model: c => S.draw(c), lines: [Lr, Lc, Lf, Lres, Lo, Ld], leads: [] });
  for (const k of ['grid', 'heads', 'cells']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Read the table', why: 'Find the totals, both ways.', act: 'Add them up' },
    { t: 'Name the whole', why: '“Of the students with a curfew”: which part of the table?', act: 'Ring it' },
    { t: 'Part ÷ whole', why: 'Divide, and turn the row into a 100% bar.', act: 'Divide' },
    { t: 'Compare the other group', why: 'Make the No curfew row a bar too.', act: 'Compare' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), afterBox = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.totals', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('e.rows', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('e.cols', 1, 1.1); await wait(1.3);
      } else if (i === 1) {
        S.st.whole = { kind: 'row', i: 0 }; tr.set('e.ring', 1, 0.7); tr.set('e.dim', 1, 0.8, 0.3); await wait(1.2); if (!alive()) return;
        S.st.part = { r: 0, c: 0 }; tr.set('e.part', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('e.rows:dim', 1, 0.5); tr.set('e.cols:dim', 1, 0.5); tr.set('e.frac', 1, 1.0); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.axis', 1, 0.8); tr.set('e.m0', 1, 1.8, 0.2); await wait(2.2); if (!alive()) return;
        tr.set('e.res', 1, 1.0); await wait(1.2);
      } else {
        tr.set('e.frac:dim', 1, 0.5); tr.set('e.res:dim', 1, 0.5);
        S.st.whole = { kind: 'row', i: 1 }; tr.jump('e.ring', 0); tr.set('e.ring', 1, 0.7); S.st.part = { r: 1, c: 0 }; tr.jump('e.part', 0); tr.set('e.part', 1, 0.6, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('e.other', 1, 1.0); tr.set('e.m1', 1, 1.8, 0.4); await wait(2.4); if (!alive()) return;
        tr.set('e.dim', 0, 0.6); tr.set('e.ring', 0, 0.6); tr.set('e.part', 0, 0.6); tr.set('e.diff', 1, 1.0); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '“Of the students with a curfew” narrows it to that row, so those 120 are the 100%.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, alt: null as { kind: Kind; i: number } | null },
      { t: 'Percents are always out of everybody, so the whole should be 200.', ok: false, id: 'e.why.all', mc: MC.notNewWhole as string | undefined, alt: { kind: 'all' as Kind, i: 0 } },
      { t: 'You always divide by the total at the end of the row.', ok: false, id: 'e.why.row', mc: MC.fixedRow as string | undefined, alt: { kind: 'col' as Kind, i: 0 } },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the whole 120, and not 200?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.alt) seq(async alive => { S.st.alt = o.alt; tr.jump('e.alt', 0); tr.set('e.alt', 1, 0.6); await wait(2.6); if (!alive()) return; tr.set('e.alt', 0, 0.6); });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    afterBox.replaceChildren(say('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'p', 'dim'), plan, sayBox, afterBox);
}

// ===================== 3. Your turn: a column question (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const S = tableScene('t.', TURN, BUS, 'v');
  const Lr = ln('t.rows', TEX.tRows, 160, 76), Lc = ln('t.cols', TEX.tCols, 255, 76);
  const La = ln('t.ask', TEX.tAsk, 440, 104), Lf = ln('t.frac', TEX.tFrac, 440, 104), Lres = after(Lf, 't.res', TEX.tRes, TAGS);
  const Lo = ln('t.other', TEX.tOther, 640, 104);
  setScene({ table: 1080, model: c => S.draw(c), lines: [Lr, Lc, La, Lf, Lres, Lo], leads: [] });
  showTable('t.');
  let step = 0;
  const STEPS = [
    { t: 'Read the table', why: 'Done for you: the totals.' },
    { t: 'Name the whole', why: 'Your step.' },
    { t: 'Part ÷ whole', why: 'Your step.' },
    { t: 'Compare the other group', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: buses and breakfast'), say('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    tr.set('t.totals', 1, 1.2); await wait(1.0); if (!alive()) return;
    tr.set('t.rows', 1, 1.0); await wait(0.9); if (!alive()) return;
    tr.set('t.cols', 1, 1.0); await wait(1.2); if (!alive()) return;
    work.replaceChildren(say('t.given', 'p', 'dim'));
    await wait(0.6); if (!alive()) return;
    step = 1; drawPlan(); askWhole();
  });
  function askWhole(): void {
    tr.set('t.ask', 1, 0.9);
    S.st.part = { r: 0, c: 0 }; tr.set('t.part', 1, 0.6);
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'The 90 breakfast eaters', ok: true, id: 't.whole.ok', mc: undefined as string | undefined, alt: null as { kind: Kind; i: number } | null },
      { t: 'The 120 bus riders', ok: false, id: 't.whole.row', mc: MC.fixedRow as string | undefined, alt: { kind: 'row' as Kind, i: 0 } },
      { t: 'All 250 students', ok: false, id: 't.whole.all', mc: MC.notNewWhole as string | undefined, alt: { kind: 'all' as Kind, i: 0 } },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.whole', prompt: 'Of the breakfast eaters, what percent ride the bus? Who is the whole?', response: o.t, expected: 'The 90 breakfast eaters', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (o.alt) { S.st.alt = o.alt; tr.jump('t.alt', 0); seq(async alive => { tr.set('t.alt', 1, 0.6); await wait(2.4); if (!alive()) return; tr.set('t.alt', 0, 0.6); }); return; }
      done = true;
      seq(async alive => {
        tr.set('t.alt', 0, 0.3); S.st.whole = { kind: 'col', i: 0 }; tr.set('t.ring', 1, 0.7); tr.set('t.dim', 1, 0.8, 0.3);
        tr.set('t.rows:dim', 1, 0.5); tr.set('t.cols:dim', 1, 0.5); tr.set('t.ask', 0, 0.5, 0.6); tr.set('t.frac', 1, 1.0, 0.8);
        await wait(2.0); if (!alive()) return;
        step = 2; drawPlan(); askPct();
      });
    })));
    work.replaceChildren(say('t.whole'), bx, fbHost);
  }
  function askPct(): void {
    const fbHost = h('div'), inp = numInput('%', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbk(false, 't.pct.empty')); return; }
      const v = r.v, right = Math.abs(v - 80) < 0.051 || Math.abs(v - 0.8) < 1e-9;
      const kind = Math.abs(v - 60) < 0.051 || Math.abs(v - 0.6) < 1e-9 ? 'row' : Math.abs(v - 28.8) < 0.051 || Math.abs(v - 0.288) < 1e-9 ? 'all' : v === 72 ? 'count' : '';
      const mc = kind === 'row' ? MC.fixedRow : kind === 'all' ? MC.notNewWhole : kind === 'count' ? MC.fixed : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.pct', prompt: '72 of the 90 breakfast eaters ride the bus: what percent?', board: '72 / 90', response: v, expected: 80, correct: right, mc: right ? undefined : mc });
      if (!right) { fbHost.replaceChildren(fbk(false, kind ? `t.pct.${kind}` : 't.pct.miss')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.pct.ok'));
      seq(async alive => {
        tr.set('t.res', 1, 1.0); tr.set('t.axis', 1, 0.8, 0.3); tr.set('t.m0', 1, 1.8, 0.4); await wait(2.6); if (!alive()) return;
        tr.set('t.frac:dim', 1, 0.5); tr.set('t.res:dim', 1, 0.5);
        S.st.whole = { kind: 'col', i: 1 }; tr.jump('t.ring', 0); tr.set('t.ring', 1, 0.7); S.st.part = { r: 0, c: 1 }; tr.jump('t.part', 0); tr.set('t.part', 1, 0.6, 0.3);
        tr.set('t.other', 1, 1.0, 0.6); tr.set('t.m1', 1, 1.8, 0.8); await wait(2.8); if (!alive()) return;
        tr.set('t.dim', 0, 0.6); tr.set('t.ring', 0, 0.6); tr.set('t.part', 0, 0.6);
        step = 3; drawPlan(); askAssoc();
      });
    }
    work.replaceChildren(say('t.pct'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askAssoc(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Yes: breakfast eaters are much more likely to ride the bus (80% against 30%).', ok: true, id: 't.assoc.ok', mc: undefined as string | undefined },
      { t: 'No: more students skip breakfast (160 against 90).', ok: false, id: 't.assoc.size', mc: undefined as string | undefined },
      { t: 'Yes: riding the bus makes students eat breakfast.', ok: false, id: 't.assoc.cause', mc: MC.causation as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.assoc', prompt: '80% of breakfast eaters and 30% of the others ride the bus: an association?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      done = true; step = 4; drawPlan();
      fbHost.append(callback());
    })));
    work.replaceChildren(say('t.assoc'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    const p = say(id);
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jordan's biggest cell =====================
function partProve(): void {
  tr.reset('p.');
  const S = tableScene('p.', PROVE, MUSIC, 'h', 0);
  const J1 = ln('p.J1', TEX.pJ1, 150, 70), J2 = ln('p.J2', TEX.pJ2, 240, 70);
  J1.col = 'dim'; J2.col = 'dim';
  const LA = ln('p.A', TEX.pA, 440, 96), LB = ln('p.B', TEX.pB, 630, 96), LC = ln('p.C', TEX.pC, 820, 64);
  const extra = (c: Canvas) => {
    for (const [L, k] of [[J1, 'p.strike1'], [J2, 'p.strike2']] as const) {
      const kk = tr.k(k);
      if (kk > 0) { const b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, kk, { col: 'wrong' }); }
    }
  };
  setScene({ table: 1080, model: c => S.draw(c), lines: [J1, J2, LA, LB, LC], leads: [], extra });
  showTable('p.'); tr.set('p.totals', 1, 0.8, 2.2); tr.set('p.J1', 1, 0.9, 2.6); tr.set('p.J2', 1, 0.9, 3.2);
  S.st.part = { r: 0, c: 0 }; tr.set('p.part', 1, 0.6, 3.0);
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbk(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbk(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.part', 0, 0.4); S.st.whole = { kind: 'row', i: 0 }; tr.set('p.ring', 1, 0.7); tr.set('p.dim', 1, 0.8, 0.2); await wait(1.4); if (!alive()) return;
        tr.set('p.strike1', 1, 0.6); tr.set('p.strike2', 1, 0.6, 0.4); await wait(1.2); if (!alive()) return;
        tr.set('p.J1:dim', 1, 0.5); tr.set('p.J2:dim', 1, 0.5);
      }
      if (n === 2) {
        S.st.part = { r: 0, c: 0 }; tr.jump('p.part', 0); tr.set('p.part', 1, 0.6);
        tr.set('p.A', 1, 1.0, 0.3); tr.set('p.axis', 1, 0.8, 0.6); tr.set('p.m0', 1, 1.8, 0.8); await wait(2.8);
      }
      if (n === 3) {
        tr.set('p.A:dim', 1, 0.5);
        S.st.whole = { kind: 'row', i: 1 }; tr.jump('p.ring', 0); tr.set('p.ring', 1, 0.7); S.st.part = { r: 1, c: 0 }; tr.jump('p.part', 0); tr.set('p.part', 1, 0.6, 0.2);
        tr.set('p.B', 1, 1.0, 0.4); tr.set('p.m1', 1, 1.8, 0.7); await wait(2.7); if (!alive()) return;
        tr.set('p.dim', 0, 0.6); tr.set('p.ring', 0, 0.6); tr.set('p.part', 0, 0.6);
        S.st.align = 0; tr.set('p.align', 1, 1.0); tr.set('p.C', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbk(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: 120 is the biggest cell, so music students are more likely to play a sport. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.oneCell : undefined });
    proofHost.replaceChildren(right ? say('p.test') : say('p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as TwItem),
  });
}
const PIC = box(80, 96, 1000, 1004);
/** practice uses a wider slate (the gap between the picture and the usual board): lines up to PRACTICE_BOARD_W */
const PBOARD = box(1050, 80, 1860, 1000);
function pl(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const Fm = tex(src) as Formula;
  let sz = size;
  while (sz > 60 && texWidth(Fm, sz) > PRACTICE_BOARD_W) sz -= 2;
  return { key, F: Fm, x: PBOARD.x0 + 50, y, size: sz, col };
}
const FCACHE = new Map<string, Formula>();
const F = (s: string) => { let f = FCACHE.get(s); if (!f) { f = tex(s) as Formula; FCACHE.set(s, f); } return f; };
function showItem(item: TwItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const { pic, focus: f, steps } = item.picture;
  const K = (s: string) => tr.k('x.' + s);
  let draw: (c: Canvas) => void = () => undefined;
  let grow = false;
  if (pic.kind === 'table') {
    const withBars = !!pic.bars;
    const TL = withBars ? tableLayout(pic.table, TABLE_AREA, { maxRowH: 112 }) : tableLayout(pic.table, SOLO.area, SOLO.o);
    const BG = pic.bars ? barsUnder(pic.bars.spec, TL, BARS_AREA, pic.bars.orient) : null;
    grow = !!(pic.bars && !pic.bars.atStart);
    const nG = pic.bars?.spec.groups.length ?? 0, orient = pic.bars?.orient ?? 'h';
    draw = c => {
      drawTable(c, pic.table, TL, { grid: K('grid'), heads: K('grid'), cells: K('grid'), totals: K('grid') }, {
        whole: f.whole ? { ...f.whole, k: K('ring') } : null, part: f.part ? { ...f.part, k: K('part') } : null,
        glows: (f.glows ?? []).map(q => ({ ...q, k: K('part') })), dim: K('dim'), reveal: K('reveal'),
      });
      if (pic.bars && BG) {
        const spec = pic.bars.spec;
        if (grow) drawBars(c, spec, BG, { axis: K('axis'), bars: Array.from({ length: nG }, (_, g) => K('m' + g)), labels: 1 }, {
          from: (g, s) => (orient === 'h' ? TL.cell(g, s) : TL.cell(s, g)), morph: Array.from({ length: nG }, (_, g) => K('m' + g)),
          align: f.align !== undefined ? { s: f.align, k: K('align') } : null,
        });
        else drawBars(c, spec, BG, { axis: K('grid'), bars: K('bars'), labels: 1 }, { seg: f.seg ? { ...f.seg, k: K('seg') } : null, reveal: K('reveal') });
      }
    };
  } else if (pic.kind === 'bars') {
    const BG = barsAlone(pic.bars, PIC, pic.orient);
    draw = c => drawBars(c, pic.bars, BG, { axis: K('grid'), bars: K('bars'), labels: K('bars') }, {
      seg: f.seg ? { ...f.seg, k: K('seg') } : null, bar: f.bar !== undefined ? { g: f.bar, k: K('ring') } : null,
      align: f.align !== undefined ? { s: f.align, k: K('align') } : null,
    });
  } else if (pic.kind === 'tree') {
    const G = treeLayout(pic.tree, PIC);
    draw = c => drawTree(c, pic.tree, G, { grow: K('grid'), leaves: K('grid') }, { path: f.path ? { ...f.path, k: K('part') } : null, reveal: K('reveal') });
  } else {
    const TL = tableLayout(pic.table, box(90, 64, 990, 456), { maxRowH: 84 });
    const x0 = TL.cell(0, 0).x0, x1 = TL.cell(0, TL.C).x1;
    const blocks = pic.graphs.map((_, k) => box(TL.all.x0, 488 + k * 172, x1, 488 + k * 172 + 150));
    const geoms: BarsGeom[] = blocks.map(B => ({ orient: 'h', topFirst: false, num: 60, group: [], size: [], sizeHead: null, axis: null, key: [], bars: [box(x0, B.y0 + 8, x1, B.y0 + 70), box(x0, B.y0 + 84, x1, B.y0 + 146)] }));
    draw = c => {
      drawTable(c, pic.table, TL, { grid: K('grid'), heads: K('grid'), cells: K('grid'), totals: K('grid') });
      pic.graphs.forEach((gs, k) => {
        const B = blocks[k]!;
        texDraw(c, F(`\\text{${pic.names[k]}}`), (TL.all.x0 + x0) / 2, B.y0 + 77, { size: 72, align: 'center', col: 'pick', alpha: K('bars') });
        drawBars(c, gs, geoms[k]!, { axis: 0, bars: K('bars'), labels: 0 }, { bar: null });
        const kr = f.bar === k ? K('ring') : 0;
        if (kr > 0) { const g = c.g; g.save(); g.globalAlpha *= clamp(kr); g.strokeStyle = th.roles.link.fill; g.lineWidth = 5; g.beginPath(); g.roundRect(B.x0 - 12, B.y0 - 8, B.w + 24, B.h + 16, 16); g.stroke(); g.restore(); }
      });
    };
  }
  const B = pl('x.B', item.board, 200, 88);
  const S = steps.slice(0, 6).map((s, i) => pl('x.S' + i, s, 360 + i * 118, 76, 'link'));
  setScene({ table: 1080, model: c => draw(c), lines: [B, ...S], leads: [], boardBox: PBOARD });
  tr.set('x.grid', 1, 0.9); tr.set('x.bars', 1, 1.2, 0.4); tr.set('x.B', 1, 0.8, 0.3);
  return {
    solve: async alive => {
      if (f.whole) { tr.set('x.ring', 1, 0.6); tr.set('x.dim', 1, 0.7, 0.2); await wait(0.9); if (!alive()) return; }
      if (f.bar !== undefined) { tr.set('x.ring', 1, 0.6); await wait(0.6); if (!alive()) return; }
      if (f.part || f.glows || f.path) { tr.set('x.part', 1, 0.6); await wait(0.6); if (!alive()) return; }
      tr.set('x.reveal', 1, 0.8);
      if (grow) {
        tr.set('x.axis', 1, 0.6);
        for (let g = 0; g < 3; g++) { tr.set('x.m' + g, 1, 1.4); await wait(1.0); if (!alive()) return; }
        if (f.align !== undefined) tr.set('x.align', 1, 0.9);
      } else if (f.align !== undefined) tr.set('x.align', 1, 0.9);
      if (f.seg) tr.set('x.seg', 1, 0.6);
      tr.set('x.B:dim', 1, 0.5);
      for (let i = 0; i < S.length; i++) { tr.set('x.S' + i, 1, 0.9); await wait(1.0); if (!alive()) return; }
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\frac{84}{120} = 70\\% \\approx \\Rightarrow \\cssId{p}{1}', '\\text{whole part points biggest cell same split}', '360^\\circ \\times \\neq'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});

