// ratio-tables-and-proportions.ts: "Ratio tables and proportional relationships" (grade 7, 6.RP.A.1-3, 7.RP.A.2) on
// the shared lesson runtime. The ratio table is THE tool: pairs travel together, every row comes from doing the same
// thing to both columns.
//   1 The question   lemonade 4 : 6, you have 10 cups of lemon juice: how much water? 3 cards (two catalogue
//                    misconceptions: keep the difference -> 12, "10 is not a multiple of 4" -> can't tell) + how sure
//   2 Worked example the same recipe: Pair them -> Divide both (2 : 3) -> Multiply both (10 : 15) -> Check every row
//                    (water ÷ lemon = 1.5); the cups regroup into batches above the table; one "why?" with 3 reasons
//   3 Your turn      3 cases hold 24 bottles: the pair is given; the kid finds the row for 1, scales to 7 cases, names
//                    the rate with its unit; the callback to part 1
//   4 Prove it       a bike rental ($5 fee + $3 an hour): Jordan adds two rows (8 + 11 = 19). A because-chain from
//                    reason chips (distractors = misconceptions); the table backs each line (quotients, the 0-hour row,
//                    the sum struck and fixed)
//   5 Practice       all 20 sub-goals one after another, then mixed (runtime/practice.ts), 27 families
// The model is RatioRows (src/lesson/topics/ratio-tables-and-proportions/RatioRows.ts).
// Voiced lines: src/lesson/topics/ratio-tables-and-proportions/script.ts (panel HTML) = voice/lines.json (spoken).
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, bigLine, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { strike } from '../../src/core/draw';
import { RatioRows, type RRBlock, type RRFocus, type RRParams, type TableSpec } from '../../src/lesson/topics/ratio-tables-and-proportions/RatioRows';
import { FAMILY_NAMES, GENS, type RTItem, type RRPic } from '../../src/lesson/topics/ratio-tables-and-proportions/items';
import { explain } from '../../src/lesson/topics/ratio-tables-and-proportions/explain';
import { PLAN } from '../../src/lesson/topics/ratio-tables-and-proportions/plan';
import { SCRIPT } from '../../src/lesson/topics/ratio-tables-and-proportions/script';

const SLUG = 'ratio-tables-and-proportions';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
// the narrator: one line at a time; a queue that a newer line cancels
let vq = 0;
function sayAll(ids: string[]): void { const t = ++vq; void (async () => { for (const id of ids) { if (t !== vq) return; await ctx.say(id); } })(); }
const sayOnly = (id: string) => sayAll([id]);
/** a voiced panel line: the HTML from the script; the narrator says it */
function para(id: string, cls = '', speak = true): HTMLElement { if (speak) sayOnly(id); return html('p', cls, SCRIPT[id] ?? id); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { sayOnly(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- the model and the board ----------
const FR = frame(60, 70, 1120, 940);
const mk = (p: RRParams): RRBlock => RatioRows(p, FR, th);
interface RScene { pre: string; model: RRBlock | null; lines: Line[]; leads: Lead[]; focus?: () => RRFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setRR(S: RScene): void {
  setScene({
    table: 1080,
    model: c => { if (S.model) S.model.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const BOARD_FIT = BOARD.w - 100;
/** one board line that fits the slate: it shrinks, but numbers stay >= 60 px and words >= 48 px */
function one(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Line['col']): Line {
  const floor = /\d/.test(src.replace(/\\cssId\{\w+\}/g, '')) ? 60 : 48;
  let L = line(key, src, y, size, tags, col);
  for (let s = size; s >= floor && L.F.w * L.size / 1000 > BOARD_FIT; s -= 4) L = line(key, src, y, s, tags, col);
  if (L.F.w * L.size / 1000 > BOARD_FIT) console.warn(`board line too wide: ${src}`);
  return L;
}
/** board lines: ' | ' in the source starts a new line under it (all parts share the key, so they write on together) */
function lines(key: string, src: string, y: number, size: number, col?: Line['col'], gap = 96): Line[] {
  return src.split(' | ').map((s, i) => one(key, s, y + i * gap, size, undefined, col));
}
const AB = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, x: { col: 'wrong' as const }, w: { col: 'ink' as const } };
/** a board line at the height of a table row: its leader rail (under the symbol `tag`) runs along the row's middle */
function atRow(key: string, src: string, rowY: number, size: number, tag = 'a'): Line {
  const L = one(key, src, rowY, size, AB);
  const b = partOf(L, tag);
  return b.y1 > b.y0 ? one(key, src, rowY + (rowY - 18 - b.y1), size, AB) : L;
}
/** a box around two parts of a line (a leader from the whole pair) */
const span = (L: Line, t0: string, t1: string): Box => { const a = partOf(L, t0), b = partOf(L, t1); return box(Math.min(a.x0, b.x0), Math.min(a.y0, b.y0), Math.max(a.x1, b.x1), Math.max(a.y1, b.y1)); };

// the lemonade recipe: 4 : 6 -> ÷2 -> 2 : 3 -> ×5 -> 10 : 15
const LEMON: TableSpec = {
  heads: [['lemon', '(cups)'], ['water', '(cups)']],
  rows: [[4, 6], [2, 3], [10, 15]],
  ops: [{ kind: 'div', from: 0, to: 1, f: 2 }, { kind: 'mul', from: 1, to: 2, f: 5 }],
  quot: ['water ÷', 'lemon'],
  rowH: 120, top: true,
};
const five = Array.from({ length: 5 }, () => [2, 3] as const);

const CARDS = [
  { t: '15 cups of water', mc: '', ok: true },
  { t: '12 cups of water', mc: 'mc.ratio-rate.additive-keep-difference', ok: false },
  { t: "Can't tell: 10 is not a multiple of 4", mc: 'mc.ratio-rate.whole-number-row-scaling-only', ok: false },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = mk({ tables: [LEMON], shelf: { style: 'cups', middle: true, configs: [[[4, 6], [10, 0]]], tags: [['the recipe', 'you have']] } });
  const y0 = BOARD.y0;
  const L0 = one('q.l0', `\\text{lemon} : \\text{water}`, y0 + 150, 56, undefined, 'dim');
  const L1 = one('q.l1', `\\cssId{a}{4} : \\cssId{b}{6}`, y0 + 330, 110, AB);
  const L2 = one('q.l2', `\\cssId{a}{10} : \\;?`, y0 + 560, 110, AB);
  setRR({ pre: 'q.', model: m, lines: [L0, L1, L2], leads: [] });
  tr.set('q.shelf0', 1, 1.6, 0.1);
  tr.set('q.l0', 1, 0.8, 1.4); tr.set('q.l1', 1, 0.9, 1.8); tr.set('q.l2', 1, 0.9, 2.6);

  const cards = h('div', { class: 'cards words', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Lemonade: 4 cups of lemon juice for every 6 cups of water. With 10 cups of lemon juice, how much water?', board: '10 : ?', response: p.t, expected: CARDS[0]!.t, correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach(b => b.classList.toggle('on', commit().pick === Number((b as HTMLElement).dataset.i)));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  // shown in a fixed mixed order (the right card is not first); data-i is the card's index in CARDS
  [1, 0, 2].forEach(i => { const b = h('button', { 'data-i': String(i) }); b.textContent = CARDS[i]!.t; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  sayAll(['q.intro', 'q.ask']);
  setPanel(
    h('h2', {}, 'Lemonade for the fair'),
    para('q.intro', '', false), para('q.ask', '', false),
    cards,
    h('div', { class: 'label' }, SCRIPT['q.sure']!),
    sure,
    h('div', { class: 'row' }, goBtn),
  );
}

// ===== 2. Worked example: the same recipe =====
function partExample(): void {
  tr.reset('e.');
  const m = mk({ tables: [LEMON], shelf: { style: 'cups', configs: [[[4, 6]], [[2, 3], [2, 3]], five] } });
  // the working lines sit at the height of the row they write: each leader runs straight along its row
  const ry = m.lay.tables[0]!.rowY;
  const E0 = one('e.E0', `\\text{lemon} : \\text{water}`, BOARD.y0 + 150, 56, undefined, 'dim');
  const E1 = atRow('e.E1', `\\cssId{a}{4} : \\cssId{b}{6}`, ry[0]!, 88);
  const E2 = atRow('e.E2', `\\xrightarrow{\\;\\div 2\\;}\\ \\cssId{a}{2} : \\cssId{b}{3}`, ry[1]!, 80);
  const E3 = atRow('e.E3', `\\xrightarrow{\\;\\times 5\\;}\\ \\cssId{a}{10} : \\cssId{s}{15}`, ry[2]!, 80);
  const E4 = one('e.E4', `\\cssId{b}{15} \\div \\cssId{a}{10} = \\cssId{s}{1.5}`, ry[2]! + 150, 76, AB);
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => span(E1, 'a', 'b'), to: () => m.where.rowMid(0), col: 'pick' },
    { key: 'e.ld2', from: () => span(E2, 'a', 'b'), to: () => m.where.rowMid(1), col: 'pick' },
    { key: 'e.ld3', from: () => partOf(E3, 's'), to: () => m.where.rowMid(2), col: 'link' },
    { key: 'e.ld5', from: () => partOf(E4, 's'), to: () => m.where.quot(2), col: 'link' },
  ];
  let lit: number[] = [];
  setRR({ pre: 'e.', model: m, lines: [E0, E1, E2, E3, E4], leads, focus: () => ({ t: [{ lit }] }) });
  tr.set('e.shelf0', 1, 1.0, 0.1);

  let step = 0;
  const STEPS = [
    { t: 'Pair them', why: 'One row holds one pair: both amounts together.', act: 'Pair them' },
    { t: 'Divide both', why: 'The same divisor on both sides.', act: 'Divide' },
    { t: 'Multiply both', why: 'The same multiplier on both sides.', act: 'Multiply' },
    { t: 'Check every row', why: 'Water ÷ lemon is the same in every row.', act: 'Check' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.table', 1, 1.6); tr.set('e.E0', 1, 0.8, 0.6); await wait(1.5); if (!alive()) return;
        tr.set('e.E1', 1, 0.9); lit = [0]; await wait(0.9); if (!alive()) return;
        tr.set('e.ld1', 1, 0.8); await wait(0.8);
      } else if (i === 1) {
        tr.set('e.E1:dim', 1, 0.5); tr.set('e.ld1', 0, 0.4);
        tr.set('e.shelf1', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('e.op0', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.E2', 1, 0.9); lit = [1]; await wait(0.9); if (!alive()) return;
        tr.set('e.ld2', 1, 0.8); await wait(0.8);
      } else if (i === 2) {
        tr.set('e.E2:dim', 1, 0.5); tr.set('e.ld2', 0, 0.4);
        tr.set('e.shelf2', 1, 1.8); await wait(1.8); if (!alive()) return;
        tr.set('e.op1', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.E3', 1, 0.9); lit = [2]; await wait(0.9); if (!alive()) return;
        tr.set('e.ld3', 1, 0.8); await wait(0.8);
      } else {
        tr.set('e.E3:dim', 1, 0.5); tr.set('e.ld3', 0, 0.4); lit = [];
        tr.set('e.quot', 1, 1.8); await wait(1.8); if (!alive()) return;
        tr.set('e.E4', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.ld5', 1, 0.8); await wait(0.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(para(`e.s${i + 1}`, '', i < 3));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Half a recipe has half of each, so the taste stays the same.', ok: true, mc: undefined as string | undefined, id: 'e.why.ok' },
      { t: 'Taking 2 cups off both would work just as well.', ok: false, mc: 'mc.ratio-rate.additive-keep-difference', id: 'e.why.diff' },
      { t: 'Only the lemon juice has to change.', ok: false, mc: 'mc.ratio-rate.scale-only-one-term', id: 'e.why.one' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    [1, 0, 2].forEach(j => {
      const o = opts[j]!;
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fb(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why may we divide both columns by 2?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
    sayAll(['e.s4', 'e.why']);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), para('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: 3 cases hold 24 bottles (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const cases = (n: number) => Array.from({ length: n }, () => [1, 8] as const);
  const T: TableSpec = { heads: [['cases', ''], ['bottles', '']], rows: [[3, 24], [1, 8], [7, 56]], ops: [{ kind: 'div', from: 0, to: 1, f: 3 }, { kind: 'mul', from: 1, to: 2, f: 7 }], hide: [[1, 1], [2, 1]], rowH: 120, top: true };
  const m = mk({ tables: [T], shelf: { style: 'case', configs: [cases(3), cases(1), cases(7)] } });
  const ry = m.lay.tables[0]!.rowY;
  const T0 = one('t.T0', `\\text{cases} : \\text{bottles}`, BOARD.y0 + 150, 56, undefined, 'dim');
  const T1 = atRow('t.T1', `\\cssId{a}{3} : \\cssId{b}{24}`, ry[0]!, 88);
  const T2 = atRow('t.T2', `\\xrightarrow{\\;\\div 3\\;}\\ \\cssId{a}{1} : \\cssId{s}{8}`, ry[1]!, 80);
  const T3 = atRow('t.T3', `\\xrightarrow{\\;\\times 7\\;}\\ \\cssId{a}{7} : \\cssId{s}{56}`, ry[2]!, 80);
  const T4 = one('t.T4', `\\cssId{s}{8}\\ \\text{bottles per case}`, ry[2]! + 150, 68, AB);
  const leads: Lead[] = [
    { key: 't.ld2', from: () => partOf(T2, 's'), to: () => m.where.rowMid(1), col: 'link' },
    { key: 't.ld3', from: () => partOf(T3, 's'), to: () => m.where.rowMid(2), col: 'link' },
  ];
  setRR({ pre: 't.', model: m, lines: [T0, T1, T2, T3, T4], leads });
  tr.set('t.shelf0', 1, 1.2, 0.2);

  let step = 0;
  const STEPS = [
    { t: 'Pair them', why: 'Done for you.' },
    { t: 'Find the row for 1', why: 'Your step.' },
    { t: 'Multiply both', why: 'Your step.' },
    { t: 'Name the rate', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Cases of sparkling water'), para('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    tr.set('t.table', 1, 1.4); tr.set('t.T0', 1, 0.8, 0.6); await wait(1.3); if (!alive()) return;
    tr.set('t.T1', 1, 0.9); work.replaceChildren(para('t.s1', '', false)); await wait(2.6); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.T1:dim', 1, 0.5);
    tr.set('t.op0', 1, 1.4); await wait(1.4); if (!alive()) return;
    askUnit();
  });

  function ask(promptId: string, unit: string, right: number, classify: (v: number) => { id: string; mc?: string }, item: string, prompt: string, then: () => void): void {
    const fbHost = h('div');
    const inp = numInput(unit, () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number.')); return; }
      const isRight = Math.abs(r.v - right) < 1e-9;
      const c = isRight ? { id: '', mc: undefined } : classify(r.v);
      ctx.store.log({ part: 'turn', item, prompt, response: r, expected: right, correct: isRight, mc: c.mc });
      if (!isRight) { fbHost.replaceChildren(fb(false, c.id)); return; }
      ok.disabled = true;
      fbHost.replaceChildren();
      then();
    }
    work.replaceChildren(para(promptId), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askUnit(): void {
    ask('t.unit', 'bottles in 1 case', 8, v => (Math.abs(v - 0.125) < 1e-9 ? { id: 't.u-rev', mc: 'mc.ratio-rate.unit-rate-division-reversed' } : v === 21 ? { id: 't.u-diff', mc: 'mc.ratio-rate.additive-keep-difference' } : { id: 't.u-other' }),
      'turn.unitRow', '3 cases hold 24 bottles: how many bottles in 1 case?', () => {
        work.replaceChildren(para('t.u-ok'));
        seq(async alive => {
          tr.set('t.shelf1', 1, 1.4); await wait(1.2); if (!alive()) return;
          tr.set('t.fill1', 1, 0.8); tr.set('t.T2', 1, 0.9, 0.3); await wait(1.3); if (!alive()) return;
          tr.set('t.ld2', 1, 0.8); await wait(2.2); if (!alive()) return;
          step = 2; drawPlan();
          tr.set('t.ld2', 0, 0.4); tr.set('t.T2:dim', 1, 0.5);
          tr.set('t.op1', 1, 1.4); await wait(1.4); if (!alive()) return;
          askScale();
        });
      });
  }
  function askScale(): void {
    ask('t.scale', 'bottles in 7 cases', 56, v => (v === 28 ? { id: 't.s-diff', mc: 'mc.ratio-rate.additive-keep-difference' } : v === 168 ? { id: 't.s-big' } : { id: 't.s-other' }),
      'turn.scale', 'One case holds 8 bottles: how many bottles in 7 cases?', () => {
        work.replaceChildren(para('t.s-ok'));
        seq(async alive => {
          tr.set('t.shelf2', 1, 1.8); await wait(1.6); if (!alive()) return;
          tr.set('t.fill2', 1, 0.8); tr.set('t.T3', 1, 0.9, 0.3); await wait(1.3); if (!alive()) return;
          tr.set('t.ld3', 1, 0.8); await wait(2.0); if (!alive()) return;
          step = 3; drawPlan();
          tr.set('t.ld3', 0, 0.4); tr.set('t.T3:dim', 1, 0.5);
          askRate();
        });
      });
  }
  function askRate(): void {
    const opts = [
      { t: '8 bottles per case', ok: true, id: 't.r-ok', mc: undefined as string | undefined },
      { t: '8 cases per bottle', ok: false, id: 't.r-rev', mc: 'mc.ratio-rate.unit-rate-division-reversed' },
      { t: '8', ok: false, id: 't.r-bare', mc: 'mc.measurement-units.omits-unit' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    [2, 1, 0].forEach(j => {
      const o = opts[j]!;
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        ctx.store.log({ part: 'turn', item: 'turn.rate', prompt: 'Name the rate with its unit: 3 cases hold 24 bottles.', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
        if (!o.ok) { fbHost.replaceChildren(fb(false, o.id)); return; }
        box_.querySelectorAll('button').forEach(x => { (x as HTMLButtonElement).disabled = true; });
        fbHost.replaceChildren(feedback(true, SCRIPT['t.r-ok']!));
        const pick = commit().pick, wrongCertain = pick !== null && pick !== 0 && commit().sure === 2;
        sayAll(['t.r-ok', `t.cb-${pick ?? 0}`, ...(wrongCertain ? ['t.cb-sure'] : [])]);
        seq(async alive => {
          tr.set('t.T4', 1, 1.0); await wait(1.2); if (!alive()) return;
          step = 4; drawPlan();
          const cb = h('div', { class: 'callback' });
          cb.append(html('p', '', SCRIPT[`t.cb-${pick ?? 0}`]!));
          if (wrongCertain) cb.append(html('p', '', SCRIPT['t.cb-sure']!));
          cb.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
          fbHost.append(cb);
        });
      });
      box_.append(b);
    });
    work.replaceChildren(para('t.rate'), box_, fbHost);
  }
}

// ===== 4. Prove it: a bike rental with a $5 fee; Jordan adds two rows =====
function partProve(): void {
  tr.reset('p.');
  const BIKE: TableSpec = { heads: [['hours', ''], ['cost', '($)']], rows: [[0, 5], [1, 8], [2, 11], [3, 19]], zero: 0, ops: [{ kind: 'add', a: 1, b: 2, to: 3 }], quot: ['dollars', 'per hour'] };
  const m = mk({ tables: [BIKE] });
  const y0 = BOARD.y0;
  const R1 = one('p.R1', `\\text{Jordan:}`, y0 + 90, 56, undefined, 'dim');
  const R2 = one('p.R2', `8 + 11 = \\cssId{w}{19}`, y0 + 190, 84, AB);
  const C1 = one('p.C1', `8 \\div 1 = \\cssId{s}{8}`, y0 + 350, 72, AB);
  const C1b = one('p.C1', `11 \\div 2 = \\cssId{x}{5.5}`, y0 + 450, 72, AB);
  const C2 = one('p.C2', `\\text{0 hours: }\\cssId{a}{5}`, y0 + 610, 72, AB);
  const C3 = one('p.C3', `5 + 3 \\times 3 = \\cssId{s}{14}`, y0 + 790, 80, AB);
  const leads: Lead[] = [{ key: 'p.ld3', from: () => partOf(C3, 's'), to: () => m.where.rowMid(3), col: 'link' }];
  let lit: number[] = [3], litCol: 'pick' | 'first' | 'link' = 'pick';
  setRR({
    pre: 'p.', model: m, lines: [R1, R2, C1, C1b, C2, C3], leads,
    focus: () => ({ t: [{ lit, litCol, hotQ: [2], hideQ: [3], strike: [3, 1], fixText: '14' }] }),
    extra: c => {
      const ks = tr.k('p.strikeR');
      if (ks > 0) { const b = partOf(R2, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.table', 1, 1.4, 0.1); tr.set('p.op0', 1, 1.2, 1.8);
  tr.set('p.R1', 1, 0.8, 2.6); tr.set('p.R2', 1, 0.9, 3.0);

  const CHIPS = [
    { t: '8 ÷ 1 = 8, but 11 ÷ 2 = 5.5 dollars per hour.', fits: 0 },
    { t: 'At 0 hours the rental already costs $5.', fits: 1 },
    { t: '$19 is $14 plus one extra $5 fee.', fits: 2 },
    { t: 'Adding two rows always gives another row.', fits: -1, mc: 'mc.ratio-rate.combines-rows-of-different-tables', id: 'p.w-rows' },
    { t: 'More hours cost more dollars, so it is proportional.', fits: -1, mc: 'mc.ratio-rate.scales-non-proportional', id: 'p.w-more' },
  ];
  const CLAIMS = ['p.k1', 'p.k2', 'p.k3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 1, 4, 0, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, ''), response: ch.t, expected: CHIPS.find(c => c.fits === filled)!.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      sayAll([CLAIMS[n - 1]!, `p.c${n}`]);
      fbHost.replaceChildren(html('p', 'dim', SCRIPT[`p.c${n}`]!));
      seq(async alive => {
        if (n === 1) { lit = []; tr.set('p.R1:dim', 1, 0.5); tr.set('p.R2:dim', 1, 0.5); tr.set('p.quot', 1, 1.6); await wait(1.4); if (!alive()) return; tr.set('p.C1', 1, 1.0); await wait(1.0); }
        if (n === 2) { tr.set('p.C1:dim', 1, 0.5); tr.set('p.zero', 1, 1.0); lit = [0]; litCol = 'first'; await wait(1.1); if (!alive()) return; tr.set('p.C2', 1, 1.0); await wait(1.0); }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5); lit = [3]; litCol = 'link';
          tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
          tr.set('p.fix', 1, 1.0); tr.set('p.C3', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
          tr.set('p.ld3', 1, 0.9); await wait(0.6); if (!alive()) return;
          tr.set('p.R2:dim', 0, 0.4); tr.set('p.strikeR', 1, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          sayAll(['p.k3', 'p.c3', 'p.done']);
          fbHost.replaceChildren(feedback(true, SCRIPT['p.done']!), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    const id = ch.id ?? 'p.w-other';
    fbHost.replaceChildren(fb(false, id));
  }
  const verdict = h('div', { class: 'row' });
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Bike rental, $5 fee + $3 an hour: 1 h $8, 2 h $11. Jordan: 3 h = $8 + $11 = $19. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.ratio-rate.combines-rows-of-different-tables' : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(para(right ? 'p.build-yes' : 'p.build-no'), chain, chipBox, fbHost);
    drawChain();
  }
  sayAll(['p.intro', 'p.claim', 'p.ask']);
  setPanel(h('h2', {}, 'Prove it'), para('p.intro', '', false), para('p.claim', '', false), para('p.ask', '', false), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as RTItem),
  });
}
const BIG = box(260, 300, 1660, 780);
/** draw a practice item: its table(s) / graph, the question on the board; the solution replays the picture after a miss */
function showItem(item: RTItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const T = lines('x.T', item.board, BOARD.y0 + 120, 84);
  const H = item.hero ? lines('x.hero', item.hero, BOARD.y0 + 120 + T.length * 96 + 140, 80, 'link') : [];
  const pic = item.pic;
  const words = () => {
    setRR({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board.replace(/ \| /g, '\\quad '), BIG)], leads: [], boardBox: BIG });
    tr.set('x.T', 1, 0.8, 0.1);
  };
  const built = pic && pic.at.length ? tryBlock(() => mk(pic.p)) : null;
  if (built && !built.ok) console.warn('practice picture failed', item.id, built.error);
  let solving = false;
  const show = (p: RRPic, m: RRBlock, delay: number, jumpAt: boolean) => {
    setRR({ pre: 'x.', model: m, lines: [...T, ...H], leads: [], focus: () => (solving ? (p.solved ?? p.focus ?? {}) : (p.focus ?? {})) });
    let d = delay;
    for (const s of p.at) { if (jumpAt) tr.jump('x.' + s, 1); else { tr.set('x.' + s, 1, 1.0, d); d += 0.4; } }
  };
  if (!pic || !built || !built.ok) words();
  else { show(pic, built.value, 0.1, false); for (const L of T) tr.set(L.key, 1, 0.8, 0.5); }
  if (!pic) return {};
  return {
    solve: async alive => {
      let p = pic, m = built && built.ok ? built.value : null;
      if (!m || pic.then) {
        const q = pic.then ?? pic;
        const b = tryBlock(() => mk(q.p));
        if (!b.ok) { console.warn('solution picture failed', item.id, b.error); return; }
        p = q; m = b.value;
        tr.reset('x.');
        show(p, m, 0, true);
        for (const L of T) tr.jump(L.key, 1);
      }
      solving = true;
      for (const L of T) tr.set(L.key + ':dim', 1, 0.5);
      for (const s of p.solve) {
        if (tr.k('x.' + s) >= 1) tr.jump('x.' + s, 0);
        tr.set('x.' + s, 1, 1.1); await wait(0.9); if (!alive()) return;
      }
      for (const L of H) tr.set(L.key, 1, 1.0);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{lemon} : \\text{water}', '\\xrightarrow{\\;\\div 2\\;}\\ 2 : 3', '6 \\div 4 = 1.5'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
