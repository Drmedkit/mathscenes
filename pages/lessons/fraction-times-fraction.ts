// fraction-times-fraction.ts: topic 3 of the lesson line (grade 5, 5.NF.B.4-6), on the shared lesson runtime.
//   1 The question   3/4 of a pan is frosted, Maya eats 2/3 of the frosted part: 3 cards (one per misconception) + how sure
//   2 Worked example Cut -> Take -> Count -> Write on the pan; each symbol is written beside, and linked by colour and a
//                    leader line to, the part of the pan it names; one "why is 12 the bottom number?"
//   3 Your turn      3/4 of 2/5, faded from the end: the cut and the take are given, the kid counts, writes the
//                    equation from chips and predicts the size (less than the leftover)
//   4 Prove it       Riley: "multiplying makes bigger, so 2/3 x 3/4 > 3/4"; a because-chain from reason chips
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/fraction-times-fraction/script.ts (panel HTML) = voice/lines.json (spoken text).
import { strike } from '../../src/core/draw';
import { type Box, box, unionBox } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, MF, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item, fr, fracValue, same } from '../../src/lesson/runtime/item';
import { AreaModel, type AreaBlock, type AreaFocus, type AreaParams } from '../../src/lesson/topics/fraction-times-fraction/AreaModel';
import { FAMILY_NAMES, GENS, type AreaPicture } from '../../src/lesson/topics/fraction-times-fraction/items';
import { PLAN } from '../../src/lesson/topics/fraction-times-fraction/plan';
import { SCRIPT } from '../../src/lesson/topics/fraction-times-fraction/script';
import { explain } from '../../src/lesson/topics/fraction-times-fraction/explain';

const SLUG = 'fraction-times-fraction';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function line_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

/** tr.set plus one more frame when the move ends: on a slow machine the stage loop can stop on the last busy frame
 *  (k < 1), which leaves a line half written (local helper; see the report) */
function ts(name: string, to: number, d = 0.9, delay = 0): void {
  tr.set(name, to, d, delay);
  setTimeout(markDirty, (d + delay) * 1000 + 120);
}
/** a 0 -> 1 -> 0 pulse on a label (runtime bump, with the closing frame) */
async function bump(key: string, alive: () => boolean): Promise<void> {
  ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6);
}
const T = { t: { col: 'second' as const }, f: { col: 'first' as const }, s: { col: 'link' as const }, r: { col: 'second' as const }, n: { col: 'link' as const } };

/** a scene with the area model on the left and the board on the right */
interface AreaScene { pre: string; model: AreaBlock | null; lines: Line[]; leads: Lead[]; focus?: () => AreaFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setArea(S: AreaScene): void {
  setScene({
    table: S.model ? S.model.where.pan.y1 + 30 : 840,
    model: c => { if (S.model) S.model.draw(c, progressOf(s => tr.k(S.pre + s)), { ...pulses(S.pre), ...S.focus?.() }); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const pulses = (pre: string): AreaFocus => ({ whole: tr.k(pre + 'pW'), first: tr.k(pre + 'pF'), take: tr.k(pre + 'pT') });
const model = (p: AreaParams) => AreaModel(p, MF, th);
/** one row of the amber part (the box a "1/b of" symbol points at) */
const rowOf = (m: AreaBlock, r: number): Box => { const k0 = m.maths.wholes * m.maths.d - m.maths.c, k1 = m.maths.wholes * m.maths.d - 1; return unionBox([m.where.cell(r, k0), m.where.cell(r, k1)]); };
function showPan(pre: string, upto: 'first' | 'grid', delay = 0): void {
  ts(pre + 'whole', 1, 0.9, delay); ts(pre + 'cols', 1, 1.0, delay + 0.6); ts(pre + 'first', 1, 0.8, delay + 1.4);
  if (upto === 'grid') { ts(pre + 'rows', 1, 0.8, delay + 1.9); ts(pre + 'take', 1, 0.7, delay + 2.5); ts(pre + 'grid', 1, 0.8, delay + 3.0); }
}
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
const YT = BOARD.y0 + 90;

const CARDS = [
  { n: 2, d: 3, w: 0, small: 'of the pan', id: 'mc.fractions-concept.part-taken-as-whole', cb: 't.cb-part' },
  { n: 6, d: 12, w: 0, small: 'of the pan', id: '', cb: 't.cb-right' },
  { n: 5, d: 12, w: 1, small: 'pans', id: 'mc.fraction-ops.reads-of-as-addition-or-subtraction', cb: 't.cb-add' },
];
const EX: AreaParams = { a: 2, b: 3, c: 3, d: 4, look: 'pan', words: { whole: '1 pan', first: 'frosted', take: 'eaten' } };

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = model(EX);
  const Q = line('q.l1', '\\cssId{t}{\\tfrac{2}{3}} \\text{ of } \\cssId{f}{\\tfrac{3}{4}} = \\,?', YT, 92, T);
  const L0 = line('q.l0', '\\text{of the whole pan}', YT + 120, 56, undefined, 'dim');
  setArea({ pre: 'q.', model: m, lines: [Q, L0], leads: [] });
  showPan('q.', 'first');
  ts('q.l1', 1, 0.9, 2.2); ts('q.l0', 1, 0.7, 2.8);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '3/4 of a pan is frosted; Maya eats 2/3 of the frosted part: how much of the whole pan?', response: p.w ? `${p.w} ${p.n}/${p.d}` : `${p.n}/${p.d}`, expected: '6/12', correct: p.n === 6, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.w ? cd.w + '&#8202;' : ''}${fr(cd.n, cd.d)}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = line_('q.intro');
  setPanel(h('h2', {}, 'Frosting on the brownies'), intro, html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: 2/3 of 3/4 =====
function partExample(): void {
  tr.reset('e.');
  const m = model(EX), w = m.where;
  const Q = line('e.q', '\\cssId{t}{\\tfrac{2}{3}} \\text{ of } \\cssId{f}{\\tfrac{3}{4}} = \\,?', YT, 92, T);
  const H = line('e.hero', '\\cssId{t}{\\frac{2}{3}} \\times \\cssId{f}{\\frac{3}{4}} = \\cssId{s}{\\frac{6}{12}}', YT, 96, T);
  const L1 = line('e.L1', '\\cssId{r}{\\tfrac{1}{3}} \\text{ of } \\cssId{f}{\\tfrac{3}{4}}', rowOf(m, 0).cy, 76, T);
  const L2 = line('e.L2', '\\cssId{t}{\\tfrac{2}{3}} \\text{ of } \\cssId{f}{\\tfrac{3}{4}}', Math.max(w.take.cy + 30, rowOf(m, 0).cy + 150), 76, T);
  const L3 = line('e.L3', '\\cssId{t}{2} \\times \\cssId{f}{3} = \\cssId{n}{6}\\ \\text{eaten}', rowOf(m, 2).cy - 60, 72, T);
  const L4 = line('e.L4', '3 \\times 4 = \\cssId{D}{12}\\ \\text{in all}', rowOf(m, 2).cy + 70, 72, { D: { col: 'ink' } });
  const L5 = line('e.L5', '= \\frac{\\cssId{t}{2} \\times \\cssId{f}{3}}{3 \\times 4}', YT + 200, 84, T);
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'r'), to: () => rowOf(m, 0), col: 'second' },
    { key: 'e.ld2', from: () => partOf(L2, 't'), to: () => w.take, col: 'second' },
    { key: 'e.ld3', from: () => partOf(L3, 'n'), to: () => w.take, col: 'link' },
    { key: 'e.ldS', from: () => partOf(H, 's'), to: () => w.take, col: 'link' },
  ];
  setArea({ pre: 'e.', model: m, lines: [Q, H, L1, L2, L3, L4, L5], leads });
  // the board starts where part 1 left it: the frosted pan, the question
  jump('e.', ['whole', 'cols', 'first', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Cut the frosted part into 3 equal rows', why: 'Two thirds needs thirds of the frosted part.', act: 'Cut' },
    { t: 'Take 2 of the 3 rows', why: 'That is two thirds OF the frosted part.', act: 'Take' },
    { t: 'Count against the whole pan', why: 'Run the cuts through the whole pan.', act: 'Count' },
    { t: 'Write it as one multiplication', why: '“Of” means times.', act: 'Write it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) { const b = btn(s.act, () => run(i), 'go'); (li.lastChild as HTMLElement).append(b); }
      return li;
    }));
  };
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        ts('e.rows', 1, 1.3); await wait(1.3); if (!alive()) return;
        ts('e.L1', 1, 1.0); await wait(0.9); if (!alive()) return;
        ts('e.ld1', 1, 0.8);
      } else if (i === 1) {
        ts('e.ld1', 0, 0.4); ts('e.L1:dim', 1, 0.6);
        ts('e.take', 1, 0.9, 0.2); await wait(1.0); if (!alive()) return;
        ts('e.L2', 1, 1.0); await wait(0.6); if (!alive()) return;
        void bump('e.pT', alive); ts('e.ld2', 1, 0.8, 0.3); await wait(1.0);
      } else if (i === 2) {
        ts('e.ld2', 0, 0.4); ts('e.L2:dim', 1, 0.6);
        ts('e.grid', 1, 1.2); await wait(1.3); if (!alive()) return;
        ts('e.name', 1, 0.8); await wait(0.6); if (!alive()) return;
        ts('e.L3', 1, 1.0); ts('e.ld3', 1, 0.8, 0.9); await wait(1.8); if (!alive()) return;
        ts('e.L4', 1, 1.0); void bump('e.pW', alive); await wait(1.2);
      } else {
        ts('e.ld3', 0, 0.4); ts('e.L3:dim', 1, 0.6); ts('e.L4:dim', 1, 0.6);
        ts('e.q', 0, 0.5); ts('e.L1', 0, 0.5); ts('e.L2', 0, 0.5);
        ts('e.hero', 1, 1.4, 0.3); await wait(0.6); if (!alive()) return;
        void bump('e.pT', alive); await wait(0.5); if (!alive()) return;
        void bump('e.pF', alive); await wait(0.9); if (!alive()) return;
        ts('e.ldS', 1, 0.9); await wait(0.6); if (!alive()) return;
        ts('e.L5', 1, 1.2); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(line_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The cuts run through the whole pan: 3 rows × 4 columns make 12 equal cells.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'You multiply the bottom numbers. That is the rule.', ok: false, mc: 'mc.fraction-ops.fraction-product-denominator-meaning-unexplained', id: 'e.w-rule' },
      { t: 'The frosted part has 12 cells.', ok: false, mc: 'mc.fractions-concept.part-taken-as-whole', id: 'e.w-part' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is 12 the bottom number of 2/3 × 3/4 = 6/12?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 4500);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), line_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: 3/4 of 2/5 (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = model({ a: 3, b: 4, c: 2, d: 5, look: 'pan', words: { whole: '1 pan', first: 'left', take: 'packed' } }), w = m.where;
  const Q = line('t.q', '\\cssId{t}{\\tfrac{3}{4}} \\text{ of } \\cssId{f}{\\tfrac{2}{5}} = \\,?', YT, 92, T);
  const H = line('t.hero', '\\cssId{t}{\\frac{3}{4}} \\times \\cssId{f}{\\frac{2}{5}} = \\cssId{s}{\\frac{6}{20}}', YT, 96, T);
  const L1 = line('t.L1', '\\cssId{r}{\\tfrac{1}{4}} \\text{ of } \\cssId{f}{\\tfrac{2}{5}}', Math.max(rowOf(m, 0).cy, YT + 150), 76, T);
  const L2 = line('t.L2', '\\cssId{t}{\\tfrac{3}{4}} \\text{ of } \\cssId{f}{\\tfrac{2}{5}}', rowOf(m, 1).cy + 40, 76, T);
  const L3 = line('t.L3', '\\cssId{t}{3} \\times \\cssId{f}{2} = \\cssId{n}{6}\\ \\text{packed}', rowOf(m, 2).cy + 30, 72, T);
  const L4 = line('t.L4', '4 \\times 5 = 20\\ \\text{in all}', rowOf(m, 3).cy + 30, 72);
  const L5 = line('t.L5', '\\cssId{s}{\\tfrac{6}{20}} < \\cssId{f}{\\tfrac{8}{20}} = \\cssId{f2}{\\tfrac{2}{5}}', BOARD.y1 - 80, 76, { ...T, f2: { col: 'first' } });
  const leads: Lead[] = [
    { key: 't.ld1', from: () => partOf(L1, 'r'), to: () => rowOf(m, 0), col: 'second' },
    { key: 't.ld2', from: () => partOf(L2, 't'), to: () => w.take, col: 'second' },
    { key: 't.ld3', from: () => partOf(L3, 'n'), to: () => w.take, col: 'link' },
    { key: 't.ldS', from: () => partOf(H, 's'), to: () => w.take, col: 'link' },
  ];
  setArea({ pre: 't.', model: m, lines: [Q, H, L1, L2, L3, L4, L5], leads, focus: () => ({ ring: tr.k('t.rF') > 0 ? 'first' : null, ringK: tr.k('t.rF') }) });
  showPan('t.', 'first'); ts('t.q', 1, 0.8, 2.0);

  let step = 0;
  const STEPS = [
    { t: 'Cut the leftover part into 4 equal rows', why: 'Done for you.' },
    { t: 'Take 3 of the 4 rows', why: 'Done for you.' },
    { t: 'Count against the whole pan', why: 'Your step.' },
    { t: 'Write it as one multiplication', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Lunch from the leftovers'), line_('t.intro'), plan, work);

  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    ts('t.rows', 1, 1.3); await wait(1.2); if (!alive()) return;
    ts('t.L1', 1, 0.9); ts('t.ld1', 1, 0.8, 0.7); await wait(2.0); if (!alive()) return;
    step = 1; drawPlan();
    ts('t.ld1', 0, 0.4); ts('t.L1:dim', 1, 0.5);
    ts('t.take', 1, 0.9, 0.2); await wait(1.0); if (!alive()) return;
    ts('t.L2', 1, 0.9); void bump('t.pT', alive); ts('t.ld2', 1, 0.8, 0.6); await wait(1.9); if (!alive()) return;
    step = 2; drawPlan();
    ts('t.ld2', 0, 0.4); ts('t.L2:dim', 1, 0.5);
    ts('t.grid', 1, 1.2); await wait(1.0); if (!alive()) return;
    askCount();
  });

  function askCount(): void {
    const fbHost = h('div');
    const inp = fracInput('of the pan', () => check(), false);
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const v = r.kind === 'frac' ? fracValue(r) : null;
      let id = 't.c-other', mc: string | undefined, right = false;
      if (v && same(v, 6, 20)) { id = 't.c-ok'; right = true; }
      else if (v && (same(v, 3, 4) || same(v, 6, 8))) { id = 't.c-part'; mc = 'mc.fractions-concept.part-taken-as-whole'; }
      else if (v && same(v, 23, 20)) { id = 't.c-add'; mc = 'mc.fraction-ops.adds-shaded-counts'; }
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: '3/4 of 2/5 of a pan: what fraction of the whole pan?', response: r, expected: '6/20', correct: right, mc });
      fbHost.replaceChildren(fb(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        ts('t.name', 1, 0.8); ts('t.L3', 1, 1.0, 0.5); ts('t.ld3', 1, 0.8, 1.4); await wait(2.4); if (!alive()) return;
        ts('t.L4', 1, 1.0); void bump('t.pW', alive); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(line_('t.count'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askWrite(): void {
    const chips = [{ t: fr(3, 4), r: 'm' }, { t: fr(2, 5), r: 'q' }, { t: '×', r: 'x' }, { t: '+', r: '+' }, { t: '−', r: '-' }];
    const slots: (number | null)[] = [null, null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips' });
    const fbHost = h('div');
    const draw = () => {
      eq.replaceChildren(...slots.map((v, i) => {
        const ch = v === null ? null : chips[v]!;
        const s = h('button', { class: 'slot' + (ch ? ' filled' + (ch.r === 'm' ? ' b' : ch.r === 'q' ? ' a' : '') : ''), 'aria-label': ['first box', 'sign', 'second box'][i]! });
        s.innerHTML = ch ? ch.t : '?';
        s.addEventListener('click', () => { slots[i] = null; draw(); });
        return s;
      }), html('span', '', `= ${fr(6, 20)} of the pan`));
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch.t, () => { const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, o, y] = slots.map(i => (i === null ? '' : chips[i]!.r));
      const right = o === 'x' && ((x === 'm' && y === 'q') || (x === 'q' && y === 'm'));
      const add = o === '+' || o === '-' || x === '+' || x === '-' || y === '+' || y === '-';
      const mc = right ? undefined : add ? 'mc.fraction-ops.reads-of-as-addition-or-subtraction' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.write', prompt: '? ? ? = 6/20 of the pan', response: [x, o, y], expected: ['m', 'x', 'q'], correct: right, mc });
      if (right) {
        fbHost.replaceChildren(fb(true, 't.w-ok'));
        seq(async alive => {
          ts('t.ld3', 0, 0.4); ts('t.L3:dim', 1, 0.6); ts('t.L4:dim', 1, 0.6); ts('t.q', 0, 0.5);
          ts('t.hero', 1, 1.4, 0.3); await wait(0.6); if (!alive()) return;
          void bump('t.pT', alive); await wait(0.5); if (!alive()) return;
          void bump('t.pF', alive); await wait(0.9); if (!alive()) return;
          ts('t.ldS', 1, 0.9); await wait(1.2); if (!alive()) return;
          step = 4; drawPlan(); askSize();
        });
        return;
      }
      fbHost.replaceChildren(fb(false, add ? 't.w-add' : 't.w-other'));
      setTimeout(() => { slots[0] = slots[1] = slots[2] = null; draw(); }, 1100);
    }
    draw();
    work.replaceChildren(line_('t.write'), eq, chipBox, fbHost);
  }
  function askSize(): void {
    const fbHost = h('div');
    const more = btn(`More than ${fr(2, 5)}`, () => answer(false)), less = btn(`Less than ${fr(2, 5)}`, () => answer(true));
    function answer(ok: boolean): void {
      more.disabled = less.disabled = true;
      ctx.store.log({ part: 'turn', item: 'turn.size', prompt: 'Is 3/4 × 2/5 more or less than 2/5?', response: ok ? 'less' : 'more', expected: 'less', correct: ok, mc: ok ? undefined : 'mc.mul-div.multiplication-makes-bigger' });
      fbHost.replaceChildren(fb(ok, ok ? 't.s-ok' : 't.s-no'));
      seq(async alive => {
        ts('t.ldS:dim', 1, 0.5); ts('t.rF', 1, 0.6); await wait(0.6); if (!alive()) return;
        ts('t.L5', 1, 1.1); await wait(2.4); if (!alive()) return;
        ts('t.rF', 0, 0.6);
        await wait(3.0); if (!alive()) return;
        fbHost.append(line_('t.simple'), callback());
      });
    }
    work.replaceChildren(line_('t.size'), h('div', { class: 'row' }, less, more), fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 1]!;
    const id = commit().pick === null ? 't.cb-right' : p.cb;
    setTimeout(() => sayOnly(id), 3600);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley's "multiplying makes bigger" =====
function partProve(): void {
  tr.reset('p.');
  const m = model(EX), w = m.where;
  const J = line('p.J', '\\text{Riley: }\\ \\tfrac{2}{3} \\times \\tfrac{3}{4} \\;\\cssId{w}{>}\\; \\cssId{g}{\\tfrac{3}{4}}', YT, 80);
  const C1 = line('p.C1', '\\tfrac{2}{3} \\times \\tfrac{3}{4} = \\cssId{t}{\\tfrac{2}{3}} \\text{ of } \\cssId{f}{\\tfrac{3}{4}}', YT + 190, 70, T);
  const C2 = line('p.C2', '\\cssId{t}{\\tfrac{2}{3}} < 1', YT + 360, 76, T);
  const C3 = line('p.C3', '\\cssId{s}{\\tfrac{6}{12}} < \\cssId{f}{\\tfrac{9}{12}} = \\tfrac{3}{4}', YT + 560, 84, T);
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 't'), to: () => w.take, col: 'second' },
    { key: 'p.ldS', from: () => partOf(C3, 's'), to: () => w.take, col: 'link' },
    { key: 'p.ldF', from: () => partOf(C3, 'f'), to: () => w.first, col: 'first', drop: 22 },
  ];
  setArea({
    pre: 'p.', model: m, lines: [J, C1, C2, C3], leads,
    focus: () => ({ ring: tr.k('p.rT') > 0 ? 'take' : tr.k('p.rF') > 0 ? 'first' : null, ringK: Math.max(tr.k('p.rT'), tr.k('p.rF')) }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = unionBox([partOf(J, 'w'), partOf(J, 'g')]); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showPan('p.', 'first'); ts('p.J', 1, 1.0, 2.0);

  const CHIPS = [
    { t: `× a fraction means take that fraction OF it.`, fits: 0 },
    { t: `${fr(2, 3)} is less than 1 whole.`, fits: 1 },
    { t: `Maya's 6 cells are fewer than the 9 frosted cells.`, fits: 2 },
    { t: 'Multiplying always makes a number bigger.', fits: -1, mc: 'mc.mul-div.multiplication-makes-bigger', id: 'p.x-bigger' },
    { t: `${fr(1, 2)} × ${fr(1, 2)} = ${fr(1, 4)} got smaller, so it always gets smaller.`, fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.x-examples' },
    { t: 'With fractions the answer is always smaller.', fits: -1, mc: 'mc.fraction-ops.fraction-factor-always-shrinks', id: 'p.x-shrink' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      if (n < 3) sayOnly(CLAIMS[n]!);
      seq(async alive => {
        if (n === 1) {
          ts('p.rows', 1, 1.0); await wait(1.0); if (!alive()) return;
          ts('p.take', 1, 0.8); ts('p.C1', 1, 1.0, 0.3); await wait(1.3); if (!alive()) return;
          void bump('p.pT', alive); ts('p.ld1', 1, 0.8);
        }
        if (n === 2) {
          ts('p.ld1', 0, 0.4); ts('p.C1:dim', 1, 0.5);
          ts('p.C2', 1, 0.9); ts('p.rT', 1, 0.6, 0.6); await wait(2.0); if (!alive()) return;
          ts('p.rT', 0, 0.5); ts('p.rF', 1, 0.6, 0.3); await wait(1.6); if (!alive()) return; ts('p.rF', 0, 0.5);
        }
        if (n === 3) {
          ts('p.C2:dim', 1, 0.5);
          ts('p.grid', 1, 1.1); await wait(1.1); if (!alive()) return;
          ts('p.name', 1, 0.7); ts('p.C3', 1, 1.1, 0.3); await wait(1.4); if (!alive()) return;
          ts('p.ldS', 1, 0.8); await wait(0.8); if (!alive()) return;
          ts('p.ldF', 1, 0.8); void bump('p.pF', alive); await wait(1.2); if (!alive()) return;
          ts('p.strike', 1, 0.6); await wait(0.7); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: 2/3 × 3/4 is more than 3/4. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.mul-div.multiplication-makes-bigger' : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(line_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 4200);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), line_('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it),
  });
}
/** draw a practice item: the area model (pan, garden bed or tiled square foot) or the bare notation, and its replay */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as AreaPicture | undefined;
  const mk = pic?.kind === 'area' ? tryBlock(() => model({ a: pic.a, b: pic.b, c: pic.c, d: pic.d, look: pic.look, words: pic.words })) : null;
  if (mk && mk.ok && pic) {
    const m = mk.value, { a, b, c, d } = pic;
    const TL = line('x.T', item.board, YT, 84);
    const H = line('x.hero', `\\cssId{t}{\\frac{${a}}{${b}}} \\times \\cssId{f}{\\frac{${c}}{${d}}} = \\frac{${a} \\times ${c}}{${b} \\times ${d}} = \\cssId{s}{\\frac{${a * c}}{${b * d}}}`, YT + 230, 76, T);
    setArea({ pre: 'x.', model: m, lines: [TL, H], leads: [{ key: 'x.ldS', from: () => partOf(H, 's'), to: () => m.where.take, col: 'link' }] });
    showPan('x.', 'grid', 0); ts('x.T', 1, 0.8, 0.6);
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        ts('x.name', 1, 0.6); await wait(0.5); if (!alive()) return;
        ts('x.hero', 1, 1.2); void bump('x.pT', alive); await wait(0.5); if (!alive()) return;
        void bump('x.pW', alive); ts('x.ldS', 1, 0.8, 0.4);
      },
    };
  }
  const big = box(300, 260, 1620, 760);
  setArea({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{of the whole pan}', '\\text{Riley: }', '\\square', '\\tfrac{1}{2}\\text{ ft}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
