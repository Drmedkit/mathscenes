// multiply-divide-rational-numbers.ts: grade 7 (7.NS.A.2-3, 7.EE.B.3), on the shared lesson runtime.
//   1 The question   a diver changes height by -4 ft every minute: where was she 3 minutes ago? 3 cards + how sure
//   2 Worked example Rate -> Later -> Earlier -> Divide on the TimeJumps scale: 3 × (-4) = -12, (-3) × (-4) = 12,
//                    12 ÷ (-3) = -4; each symbol is written beside, and linked to, the part of the scale it names;
//                    one "why is (-3) × (-4) positive?"
//   3 Your turn      a cold front, -1.5 °F per hour, 4 hours ago; faded from the end: rate and later are given, the kid
//                    finds the change, writes (-4) × (-1.5) = 6 from chips, then divides 6 ÷ (-4)
//   4 Prove it       Jordan: "(-3)(-4) = -12, a negative times anything stays negative"; a 4-line distributive proof
//                    from reason chips, backed by arrows on the scale
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/multiply-divide-rational-numbers/script.ts (panel HTML) = voice/lines.json.
import { strike, withAlpha } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, MF, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { TimeJumps, type JumpBlock, type JumpFocus, type JumpParams, scaleArrow } from '../../src/lesson/topics/multiply-divide-rational-numbers/TimeJumps';
import { Counters, type MatBlock } from '../../src/lesson/topics/multiply-divide-rational-numbers/Counters';
import { FAMILY_NAMES, GENS, type Picture } from '../../src/lesson/topics/multiply-divide-rational-numbers/items';
import { explain } from '../../src/lesson/topics/multiply-divide-rational-numbers/explain';
import { PLAN } from '../../src/lesson/topics/multiply-divide-rational-numbers/plan';
import { SCRIPT } from '../../src/lesson/topics/multiply-divide-rational-numbers/script';
import { q, dq, qMul, readQ, tq, tp, withUnit } from '../../src/lesson/topics/multiply-divide-rational-numbers/rq';

const SLUG = 'multiply-divide-rational-numbers';
const M = '&minus;';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function line_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

/** tr.set plus one more frame when the move ends (the stage loop can stop on the last busy frame; local helper) */
function ts(name: string, to: number, d = 0.9, delay = 0): void {
  tr.set(name, to, d, delay);
  setTimeout(markDirty, (d + delay) * 1000 + 120);
}
async function bump(key: string, alive: () => boolean): Promise<void> {
  ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6);
}
/** colour roles on the board: t = the time / multiplier (teal), f = the rate / amount (amber), s = the answer (lime) */
const T = { t: { col: 'second' as const }, f: { col: 'first' as const }, s: { col: 'link' as const } };
const YT = BOARD.y0 + 90;

/** a scene: a model block on the left (time jumps or counters), the board on the right */
interface JScene { pre: string; model: JumpBlock | MatBlock | null; lines: Line[]; leads: Lead[]; focus?: () => JumpFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setJ(S: JScene): void {
  setScene({
    table: 1080,
    model: c => {
      if (!S.model) return;
      const P = progressOf(s => tr.k(S.pre + s));
      if (S.model.kind === 'TimeJumps') S.model.draw(c, P as never, { ...pulses(S.pre), ...S.focus?.() });
      else S.model.draw(c, P as never);
    },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const pulses = (pre: string): JumpFocus => ({ rate: tr.k(pre + 'pR'), time: tr.k(pre + 'pT'), earlier: tr.k(pre + 'pE'), later: tr.k(pre + 'pL'), answer: tr.k(pre + 'pS'), now: tr.k(pre + 'pN') });
const jumpsOf = (p: JumpParams) => TimeJumps(p, MF, th);
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
/** the lime "later" answer arrow the page draws itself (the block draws one answer: the asked one) */
function laterArrow(m: JumpBlock, t: number, key: string, unit: string) {
  const v = qMul(q(t), m.maths.rate), x = m.where.ansX, y0 = m.where.y(m.maths.start), y1 = m.where.y(m.maths.pos(t));
  const label = withUnit(v, unit, true), mid = (y0 + y1) / 2;
  return {
    /** the value label beside the arrow (where a leader ends) */
    box: box(x + 34, mid - 30, x + 34 + label.length * 31, mid + 30),
    draw: (c: Parameters<NonNullable<JScene['extra']>>[0]) => withAlpha(c, 1 - 0.55 * tr.k(key + ':dim'), () => scaleArrow(c, x, y0, y1, 'link', tr.k(key), label)),
  };
}

const EX: JumpParams = { rate: q(-4), t0: -3, t1: 3, ask: -3, look: 'sea', unit: 'ft', step: 'min', caption: 'height compared with now, ft', signed: true };
const CARDS = [
  { big: `${M}12 ft`, small: 'deeper than now', v: -12, id: 'mc.integers.any-negative-makes-negative', cb: 't.cb-neg' },
  { big: '+12 ft', small: 'higher than now', v: 12, id: '', cb: 't.cb-right' },
  { big: `${M}7 ft`, small: 'deeper than now', v: -7, id: 'mc.integers.addition-rules-in-multiplication', cb: 't.cb-add' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = jumpsOf(EX);
  const L1 = line('q.l1', '\\text{rate: }\\ \\cssId{f}{-4}\\ \\text{ft per min}', YT, 76, T);
  const L2 = line('q.l2', '\\text{3 min ago: }\\ \\cssId{t}{-3}\\ \\text{min}', YT + 130, 76, T);
  const Q = line('q.q', '\\cssId{t}{(-3)} \\times \\cssId{f}{(-4)} = \\,?', YT + 300, 96, T);
  setJ({ pre: 'q.', model: m, lines: [L1, L2, Q], leads: [] });
  ts('q.axis', 1, 1.2); ts('q.now', 1, 0.8, 1.0); ts('q.ask', 1, 0.8, 1.8);
  ts('q.l1', 1, 0.9, 2.2); ts('q.l2', 1, 0.9, 2.8); ts('q.q', 1, 1.0, 3.4);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A diver changes height by -4 ft every minute. Compared with now, where was she 3 minutes ago?', response: `${p.v} ft`, expected: '12 ft', correct: p.v === 12, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.big}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Where was the diver?'), line_('q.intro'), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
  setTimeout(() => sayOnly('q.ask'), 5200);
}

// ===== 2. Worked example: 3 × (-4), (-3) × (-4), 12 ÷ (-3) =====
function partExample(): void {
  tr.reset('e.');
  const m = jumpsOf(EX), w = m.where;
  const later = laterArrow(m, 3, 'e.lA', 'ft');
  const Q = line('e.q', '\\cssId{t}{(-3)} \\times \\cssId{f}{(-4)} = \\,?', YT, 92, T);
  const L3 = line('e.L3', '\\cssId{t}{(-3)} \\times \\cssId{f}{(-4)} = \\cssId{s}{12}', YT + 150, 84, T);
  const L4 = line('e.L4', '\\cssId{s}{12} \\div \\cssId{t}{(-3)} = \\cssId{f}{-4}', YT + 290, 84, T);
  const L1 = line('e.L1', '\\cssId{f}{-4}\\ \\text{ft per min}', w.y(0) + 70, 76, T);
  const L2 = line('e.L2', '\\cssId{t}{3} \\times \\cssId{f}{(-4)} = \\cssId{s}{-12}', w.y(-12) - 30, 84, T);
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'f'), to: () => w.jump(0), col: 'first' },
    { key: 'e.ld2', from: () => partOf(L2, 's'), to: () => later.box, col: 'link' },
    { key: 'e.ld3', from: () => partOf(L3, 's'), to: () => w.answerLabel, col: 'link' },
  ];
  setJ({ pre: 'e.', model: m, lines: [Q, L3, L4, L1, L2], leads, extra: c => later.draw(c) });
  // the board starts where part 1 left it: the scale, the diver, the question
  jump('e.', ['axis', 'now', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Rate: one jump per minute', why: 'The same change every minute.', act: 'Rate' },
    { t: 'Later: positive time', why: 'Jumps from now on.', act: 'Later' },
    { t: 'Earlier: negative time', why: 'The jumps that led to now.', act: 'Earlier' },
    { t: 'Divide: undo the product', why: 'Division asks for the missing factor.', act: 'Divide' },
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
        ts('e.later', 1 / 3, 0.9); await wait(1.0); if (!alive()) return;
        ts('e.L1', 1, 1.0); await wait(0.9); if (!alive()) return;
        void bump('e.pR', alive); ts('e.ld1', 1, 0.8);
      } else if (i === 1) {
        ts('e.ld1', 0, 0.4); ts('e.L1:dim', 1, 0.6);
        ts('e.later', 1, 1.6); await wait(1.7); if (!alive()) return;
        ts('e.lA', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.L2', 1, 1.0); await wait(0.8); if (!alive()) return;
        ts('e.ld2', 1, 0.8);
      } else if (i === 2) {
        ts('e.ld2', 0, 0.4); ts('e.L2:dim', 1, 0.6); ts('e.lA:dim', 1, 0.6);
        ts('e.ask', 1, 0.6); await wait(0.6); if (!alive()) return;
        ts('e.earlier', 1, 1.8); await wait(1.9); if (!alive()) return;
        void bump('e.pE', alive); await wait(0.6); if (!alive()) return;
        ts('e.answer', 1, 1.1); await wait(1.1); if (!alive()) return;
        ts('e.q', 0, 0.5); ts('e.L3', 1, 1.1, 0.2); await wait(1.3); if (!alive()) return;
        ts('e.ld3', 1, 0.8);
      } else {
        ts('e.ld3', 0, 0.4); ts('e.L3:dim', 1, 0.6);
        ts('e.L4', 1, 1.2); await wait(0.6); if (!alive()) return;
        void bump('e.pS', alive); await wait(0.5); if (!alive()) return;
        void bump('e.pE', alive); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(line_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '3 minutes ago she had not made the 3 drops of 4 ft yet, so she was 12 ft higher.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: `Two negatives make a positive, just like (${M}3) + (${M}4).`, ok: false, mc: 'mc.integers.two-negatives-positive-in-addition', id: 'e.w-add' },
      { t: 'It is a rule to memorize: negative times negative is positive.', ok: false, mc: 'mc.integers.neg-times-neg-arbitrary', id: 'e.w-rule' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is (-3) × (-4) positive?', response: o.t.replace(/&minus;/g, '-'), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 6500);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), line_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: a cold front, 4 hours ago (faded from the end) =====
const TURN: JumpParams = { rate: dq(-1.5), t0: -4, t1: 2, start: q(30), ask: -4, look: 'thermo', unit: '°F', step: 'h', caption: 'temperature, °F' };
function partTurn(): void {
  tr.reset('t.');
  const m = jumpsOf(TURN), w = m.where;
  const later = laterArrow(m, 2, 't.lA', '°F');
  const Q = line('t.q', '\\cssId{t}{(-4)} \\times \\cssId{f}{(-1.5)} = \\,?', YT, 88, T);
  const L3 = line('t.L3', '\\cssId{t}{(-4)} \\times \\cssId{f}{(-1.5)} = \\cssId{s}{6}', YT + 150, 84, T);
  const L4 = line('t.L4', '\\cssId{s}{6} \\div \\cssId{t}{(-4)} = \\cssId{f}{-1.5}', YT + 290, 84, T);
  const L1 = line('t.L1', '\\cssId{f}{-1.5}\\ {}^{\\circ}\\text{F per hour}', w.y(30) + 60, 72, T);
  const L2 = line('t.L2', '\\cssId{t}{2} \\times \\cssId{f}{(-1.5)} = \\cssId{s}{-3}', w.y(27) + 40, 80, T);
  const leads: Lead[] = [
    { key: 't.ld1', from: () => partOf(L1, 'f'), to: () => w.jump(0), col: 'first' },
    { key: 't.ld2', from: () => partOf(L2, 's'), to: () => later.box, col: 'link' },
    { key: 't.ld3', from: () => partOf(L3, 's'), to: () => w.answerLabel, col: 'link' },
  ];
  setJ({ pre: 't.', model: m, lines: [Q, L3, L4, L1, L2], leads, extra: c => later.draw(c) });
  ts('t.axis', 1, 1.2); ts('t.now', 1, 0.8, 1.0); ts('t.q', 1, 0.8, 1.8);

  let step = 0;
  const STEPS = [
    { t: 'Rate: one jump per hour', why: 'Done for you.' },
    { t: 'Later: positive time', why: 'Done for you.' },
    { t: 'Earlier: negative time', why: 'Your step.' },
    { t: 'Write it, then divide', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A cold front'), line_('t.intro'), plan, work);

  seq(async alive => {
    await wait(3.4); if (!alive()) return;
    ts('t.later', 1 / 2, 0.9); await wait(0.9); if (!alive()) return;
    ts('t.L1', 1, 0.9); ts('t.ld1', 1, 0.8, 0.7); void bump('t.pR', alive); await wait(2.0); if (!alive()) return;
    step = 1; drawPlan();
    ts('t.ld1', 0, 0.4); ts('t.L1:dim', 1, 0.5);
    ts('t.later', 1, 1.0); await wait(1.0); if (!alive()) return;
    ts('t.lA', 1, 0.9); ts('t.L2', 1, 0.9, 0.6); ts('t.ld2', 1, 0.8, 1.3); await wait(2.4); if (!alive()) return;
    step = 2; drawPlan();
    ts('t.ld2', 0, 0.4); ts('t.L2:dim', 1, 0.5); ts('t.lA:dim', 1, 0.5);
    ts('t.ask', 1, 0.6); ts('t.earlier', 1, 2.0, 0.3); await wait(2.3); if (!alive()) return;
    askCount();
  });

  function askCount(): void {
    const fbHost = h('div');
    const inp = numInput('°F', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const v = readQ(r);
      let id = 't.c-other', mc: string | undefined, right = false;
      if (v && v.p === 6 && v.q === 1) { id = 't.c-ok'; right = true; }
      else if (v && v.p === -6 && v.q === 1) { id = 't.c-neg'; mc = 'mc.integers.any-negative-makes-negative'; }
      else if (v && v.p === -11 && v.q === 2) { id = 't.c-add'; mc = 'mc.integers.addition-rules-in-multiplication'; }
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: 'Rate -1.5 °F per hour: compared with now, how much warmer or colder was it 4 hours ago?', response: r, expected: 6, correct: right, mc });
      fbHost.replaceChildren(fb(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        ts('t.answer', 1, 1.1); await wait(1.2); if (!alive()) return;
        void bump('t.pS', alive); await wait(1.0); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(line_('t.count'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askWrite(): void {
    const chips = [{ t: `(${M}4)`, r: 't' }, { t: '4', r: 't+' }, { t: `(${M}1.5)`, r: 'f' }, { t: '1.5', r: 'f+' }, { t: '×', r: 'x' }, { t: '+', r: '+' }];
    const slots: (number | null)[] = [null, null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips' });
    const fbHost = h('div');
    const draw = () => {
      eq.replaceChildren(...slots.map((v, i) => {
        const ch = v === null ? null : chips[v]!;
        const role = ch ? (ch.r.startsWith('t') ? ' b' : ch.r.startsWith('f') ? ' a' : '') : '';
        const s = h('button', { class: 'slot' + (ch ? ' filled' + role : ''), 'aria-label': ['first box', 'sign', 'second box'][i]! });
        s.innerHTML = ch ? ch.t : '?';
        s.addEventListener('click', () => { slots[i] = null; draw(); });
        return s;
      }), html('span', '', '= 6 °F warmer'));
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch.t, () => { const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, o, y] = slots.map(i => (i === null ? '' : chips[i]!.r));
      const pair = [x, y].sort().join(',');
      const right = o === 'x' && pair === 'f,t';
      const add = [x, o, y].includes('+');
      const laterW = o === 'x' && pair === 'f,t+';
      const id = right ? 't.w-ok' : add ? 't.w-add' : laterW ? 't.w-later' : 't.w-other';
      const mc = right ? undefined : add ? 'mc.integers.addition-rules-in-multiplication' : laterW ? 'mc.integers.sign-meaning-in-context' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.write', prompt: '? ? ? = 6 °F warmer (4 hours ago, -1.5 °F per hour)', response: [x, o, y], expected: ['t', 'x', 'f'], correct: right, mc });
      if (right) {
        fbHost.replaceChildren(fb(true, 't.w-ok'));
        seq(async alive => {
          ts('t.ld3', 0, 0.01); ts('t.q', 0, 0.5);
          ts('t.L3', 1, 1.2, 0.3); await wait(1.4); if (!alive()) return;
          ts('t.ld3', 1, 0.8); await wait(1.4); if (!alive()) return;
          askDivide();
        });
        return;
      }
      fbHost.replaceChildren(fb(false, id));
      setTimeout(() => { slots[0] = slots[1] = slots[2] = null; draw(); }, 1300);
    }
    draw();
    work.replaceChildren(line_('t.write'), eq, chipBox, fbHost);
  }
  function askDivide(): void {
    const fbHost = h('div');
    const neg = btn(`${M}1.5`, () => answer(true)), pos = btn('1.5', () => answer(false));
    function answer(ok: boolean): void {
      neg.disabled = pos.disabled = true;
      ctx.store.log({ part: 'turn', item: 'turn.divide', prompt: '6 ÷ (-4) = ?', response: ok ? -1.5 : 1.5, expected: -1.5, correct: ok, mc: ok ? undefined : 'mc.integers.drops-sign-of-computed-result' });
      fbHost.replaceChildren(fb(ok, ok ? 't.d-ok' : 't.d-no'));
      seq(async alive => {
        ts('t.ld3', 0, 0.4); ts('t.L3:dim', 1, 0.5);
        ts('t.L4', 1, 1.1); await wait(1.0); if (!alive()) return;
        void bump('t.pE', alive); await wait(5.0); if (!alive()) return;
        fbHost.append(callback());
      });
    }
    work.replaceChildren(line_('t.div'), h('div', { class: 'row' }, neg, pos), fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 1]!;
    const id = commit().pick === null ? 't.cb-right' : p.cb;
    sayOnly(id);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Jordan's "a negative times anything stays negative" =====
function partProve(): void {
  tr.reset('p.');
  const m = jumpsOf({ ...EX, ask: null }), w = m.where;
  const xA = w.colX, xB = w.axisX + 290, xC = w.ansX;
  const y0 = w.y(0), yM = w.y(-12), yP = w.y(12);
  // Jordan's claim stays plain ink: it is struck only after the scale has shown why (never judged before the evidence)
  const J = line('p.J', '(-3)(-4) = \\cssId{w}{-12}', YT, 88);
  const C1 = line('p.C1', '(-3)(4 + (-4)) = 0', YT + 170, 70);
  // the distributed line is too wide for the board in one piece: two lines, the second indented under the first
  const C2 = line('p.C2', '= (-3)(4)', YT + 290, 70);
  const C2b = line('p.C2b', '\\qquad {} + (-3)(-4)', YT + 385, 70);
  const C3 = line('p.C3', '= \\cssId{f}{-12} + (-3)(-4)', YT + 510, 70, T);
  const C4 = line('p.C4', '\\cssId{s}{(-3)(-4) = 12}', YT + 690, 84, T);
  // the value labels beside the arrows (where the leaders end)
  const boxA = box(xA + 34, (y0 + yM) / 2 - 30, xA + 150, (y0 + yM) / 2 + 30), boxC = box(xC + 34, (y0 + yP) / 2 - 30, xC + 150, (y0 + yP) / 2 + 30);
  const leads: Lead[] = [
    { key: 'p.ld3', from: () => partOf(C3, 'f'), to: () => boxA, col: 'first' },
    { key: 'p.ld4', from: () => partOf(C4, 's'), to: () => boxC, col: 'link' },
  ];
  setJ({
    pre: 'p.', model: m, lines: [J, C1, C2, C2b, C3, C4], leads,
    extra: c => {
      scaleArrow(c, xA, y0, yM, 'first', tr.k('p.aA'), `${'−'}12`);
      scaleArrow(c, xB, yM, y0, 'link', tr.k('p.aB'), '+12');
      scaleArrow(c, xC, y0, yP, 'link', tr.k('p.aC'), '+12');
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  ts('p.axis', 1, 1.0); ts('p.now', 1, 0.8, 0.8); ts('p.J', 1, 1.0, 1.6);

  const CHIPS = [
    { t: `4 + (${M}4) = 0, and any number times 0 is 0.`, fits: 0 },
    { t: 'The distributive property: multiply each part of the sum.', fits: 1 },
    { t: `One negative factor: 4 groups of ${M}3 make ${M}12.`, fits: 2 },
    { t: `Only 12 added to ${M}12 makes 0.`, fits: 3 },
    { t: 'A negative times anything stays negative.', fits: -1, mc: 'mc.integers.any-negative-makes-negative', id: 'p.x-any' },
    { t: `${M}3 and ${M}4 combine to ${M}7.`, fits: -1, mc: 'mc.integers.addition-rules-in-multiplication', id: 'p.x-add' },
    { t: `(${M}1)(${M}1) = 1, so it always works.`, fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.x-examples' },
    { t: 'Negative times negative is positive: that is the rule.', fits: -1, mc: 'mc.integers.neg-times-neg-arbitrary', id: 'p.x-rule' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3', 'p.c4'];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [4, 1, 6, 0, 5, 3, 7, 2];
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
    if (filled >= 4) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, '').replace(/&minus;/g, '-'), response: ch.t.replace(/&minus;/g, '-'), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      if (n < 4) sayOnly(CLAIMS[n]!);
      seq(async alive => {
        if (n === 1) { ts('p.C1', 1, 1.0); await wait(0.8); if (!alive()) return; void bump('p.pN', alive); }
        if (n === 2) { ts('p.C1:dim', 1, 0.5); ts('p.C2', 1, 0.8); ts('p.C2b', 1, 0.9, 0.6); }
        if (n === 3) {
          ts('p.C2:dim', 1, 0.5); ts('p.C2b:dim', 1, 0.5);
          ts('p.aA', 1, 1.1); await wait(1.0); if (!alive()) return;
          ts('p.C3', 1, 1.0); await wait(0.9); if (!alive()) return;
          ts('p.ld3', 1, 0.8);
        }
        if (n === 4) {
          ts('p.ld3', 0, 0.4); ts('p.C3:dim', 1, 0.5);
          ts('p.aB', 1, 1.1); await wait(1.2); if (!alive()) return;
          void bump('p.pN', alive); await wait(0.7); if (!alive()) return;
          ts('p.aC', 1, 1.1); await wait(1.0); if (!alive()) return;
          ts('p.C4', 1, 1.1); await wait(1.0); if (!alive()) return;
          ts('p.ld4', 1, 0.8); await wait(0.9); if (!alive()) return;
          ts('p.strike', 1, 0.6); await wait(0.7); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: (-3) × (-4) = -12, because a negative times anything stays negative. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.integers.any-negative-makes-negative' : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(line_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 4600);
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
/** draw a practice item: the time-jump scale, the counter mat, or the bare notation; and its replay after a miss */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as Picture | undefined;
  if (pic?.kind === 'jumps') {
    const rate = q(pic.rate[0], pic.rate[1]);
    const mk = tryBlock(() => jumpsOf({ rate, t0: pic.t0, t1: pic.t1, start: q(pic.start[0], pic.start[1]), ask: pic.ask, look: pic.look, unit: pic.unit, step: pic.step, caption: pic.caption, signed: pic.signed }));
    if (mk.ok) {
      const m = mk.value, ch = m.maths.change!;
      const TL = line('x.T', item.board, YT, 84);
      const H = line('x.hero', `\\cssId{t}{${pic.ask < 0 ? `(${pic.ask})` : pic.ask}} \\times \\cssId{f}{${tp(rate, 'dec')}} = \\cssId{s}{${tq(ch, 'dec')}}`, YT + 220, 84, T);
      setJ({ pre: 'x.', model: m, lines: [TL, H], leads: [{ key: 'x.ldS', from: () => partOf(H, 's'), to: () => m.where.answerLabel, col: 'link' }] });
      ts('x.axis', 1, 0.8); ts('x.now', 1, 0.6, 0.4); ts('x.later', 1, 0.9, 0.7); ts('x.earlier', 1, 0.9, 0.7); ts('x.ask', 1, 0.6, 1.4); ts('x.T', 1, 0.8, 0.6);
      return {
        solve: async alive => {
          ts('x.T:dim', 1, 0.5);
          ts('x.answer', 1, 1.0); await wait(1.0); if (!alive()) return;
          ts('x.hero', 1, 1.1); void bump('x.pT', alive); await wait(1.0); if (!alive()) return;
          ts('x.ldS', 1, 0.8);
        },
      };
    }
  }
  if (pic?.kind === 'counters') {
    const mk = tryBlock(() => Counters({ groups: pic.groups, caption: pic.caption }, MF, th));
    if (mk.ok) {
      const m = mk.value;
      const TL = line('x.T', item.board, YT, 84);
      const v = item.input === 'num' ? readQ(item.answer) : null;
      const H = v ? line('x.hero', `\\text{value: }\\ \\cssId{s}{${tq(v)}}`, YT + 220, 84, T) : null;
      setJ({ pre: 'x.', model: m, lines: H ? [TL, H] : [TL], leads: H ? [{ key: 'x.ldS', from: () => partOf(H, 's'), to: () => m.where.left, col: 'link' }] : [] });
      ts('x.mat', 1, 0.6); ts('x.counters', 1, 1.2, 0.3); ts('x.frames', 1, 0.6, 1.3); ts('x.remove', 1, 0.8, 1.9); ts('x.T', 1, 0.8, 0.6);
      return {
        solve: async alive => {
          if (!H) return;
          ts('x.T:dim', 1, 0.5); ts('x.hero', 1, 1.0); await wait(1.0); if (!alive()) return;
          ts('x.ldS', 1, 0.8);
        },
      };
    }
  }
  const big = box(240, 260, 1680, 760);
  setJ({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  // every board formula of parts 1-4 (glyphs load up front, so line widths are measured on the real font)
  warm: ['\\text{rate: }\\ -4\\ \\text{ft per min}', '\\text{3 min ago: }\\ -3\\ \\text{min}', '(-3) \\times (-4) = \\,?', '12 \\div (-3) = -4',
    '-1.5\\ {}^{\\circ}\\text{F per hour}', '(-3)(4 + (-4)) = 0', '= (-3)(4) + (-3)(-4)', '\\square', '0.\\overline{3}', '\\dfrac{1}{2}',
    '\\left(-\\tfrac{1}{2}\\right)^{3}', '\\overset{?}{=}', '\\text{value: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
