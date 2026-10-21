// linear-patterns.ts: "Recognize a linear relationship" (grade 8, 8.F.A.3 / 8.F.B.4-5) on the shared lesson runtime.
//   1 The question   Maya's savings 5, 8, 11, 15, 19: could it be linear? 3 cards (two catalogue misconceptions) + how sure
//   2 Worked example the same table: Find the changes -> Check every step -> Plot the points (a ruler misses) ->
//                    Compare a linear plan (Leo: +3 every week, one straight line); one "why?" with 3 reasons
//   3 Your turn      a draining tank (inputs step 2), faded from the end: changes and the check are given, the kid finds the
//                    change per 1 minute, the start and change from chips, and decides "linear although it goes down"
//   4 Prove it       Riley: "straight pieces, so linear"; a because-chain from reason chips (distractors = misconceptions)
//   5 Practice       all 19 sub-goals one after another, then mixed (runtime/practice.ts), 20 families
// The model is TableGraph (src/lesson/topics/linear-patterns/TableGraph.ts): a table and a graph of the same pairs.
// Voiced lines: src/lesson/topics/linear-patterns/script.ts (panel HTML) = voice/lines.json (spoken text).
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, bigLine, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { underline } from '../../src/lesson/annotate';
import { TableGraph, type TGBlock, type TGFocus, type TGParams } from '../../src/lesson/topics/linear-patterns/TableGraph';
import { FAMILY_NAMES, GENS, type LinItem, type LinPic } from '../../src/lesson/topics/linear-patterns/items';
import { PLAN } from '../../src/lesson/topics/linear-patterns/plan';
import { SCRIPT } from '../../src/lesson/topics/linear-patterns/script';

const SLUG = 'linear-patterns';
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
const mk = (p: TGParams): TGBlock => TableGraph(p, FR, th);
interface TGScene { pre: string; model: TGBlock | null; lines: Line[]; leads: Lead[]; focus?: () => TGFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setTG(S: TGScene): void {
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
function lines(key: string, src: string, y: number, size: number, col?: Line['col'], gap = 92): Line[] {
  return src.split(' | ').map((s, i) => one(key, s, y + i * gap, size, undefined, col));
}
const Y = (i: number) => BOARD.y0 + 110 + i * 125;
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };

// Maya's savings (not linear: +3, +3, +4, +4) and Leo's plan (+3 every week)
const WEEKS = [0, 1, 2, 3, 4], MAYA = [5, 8, 11, 15, 19], LEO = [5, 8, 11, 14, 17];
const savings = (): TGBlock => mk({ xs: WEEKS, ys: MAYA, ys2: LEO, xHead: ['week', ''], yHead: ['saved', '($)'], xName: 'weeks', yName: 'saved ($)', yGrid: 5, yMax: 20, names: ['Maya', 'Leo'] });

const CARDS = [
  { t: 'Yes: her savings go up every week', mc: 'mc.linear-functions.illusion-of-linearity', ok: false },
  { t: 'Yes: they go up $3 each week', mc: 'mc.reasoning-language.checks-only-some-given-cases', ok: false },
  { t: 'No: the change is not the same every week', mc: '', ok: true },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = savings();
  const L0 = one('q.l0', `\\text{Maya's savings}`, Y(0) - 20, 60, undefined, 'dim');
  const L1 = one('q.l1', `\\text{linear?}`, Y(1), 96);
  setTG({ pre: 'q.', model: m, lines: [L0, L1], leads: [] });
  tr.set('q.table', 1, 1.8, 0.1);
  tr.set('q.l0', 1, 0.8, 1.6); tr.set('q.l1', 1, 0.9, 2.0);

  const cards = h('div', { class: 'cards words', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 2]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Maya saved 5, 8, 11, 15, 19 in weeks 0-4: could it be linear?', board: '\\text{linear?}', response: p.t, expected: CARDS[2]!.t, correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.textContent = cd.t; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  sayAll(['q.intro', 'q.ask']);
  setPanel(
    h('h2', {}, "Maya's savings"),
    para('q.intro', '', false), para('q.ask', '', false),
    cards,
    h('div', { class: 'label' }, SCRIPT['q.sure']!),
    sure,
    h('div', { class: 'row' }, goBtn),
  );
}

// ===== 2. Worked example: the same table =====
function partExample(): void {
  tr.reset('e.');
  const m = savings();
  const y0 = BOARD.y0;
  const Q = one('e.q', `\\text{linear?}`, Y(1), 96);
  const E1 = one('e.E1', `\\cssId{c}{{+}3,\\,{+}3,}\\,\\cssId{x}{{+}4,\\,{+}4}`, y0 + 130, 84, { c: { col: 'second' }, x: { col: 'second' } });
  const E2 = lines('e.E2', `\\text{not the same} | \\text{every week}`, y0 + 260, 56);
  const E3a = one('e.E3', `\\text{not on one line:}`, y0 + 450, 56);
  const E3 = one('e.E3', `\\cssId{n}{\\text{not linear}}`, y0 + 540, 72, { n: { col: 'link' } });
  const E4 = one('e.E4', `\\text{Leo: }\\cssId{c}{{+}3}\\text{ every week}`, y0 + 720, 64, { c: { col: 'second' } });
  const E5 = one('e.E5', `\\cssId{l}{\\text{one straight line}}`, y0 + 820, 60, { l: { col: 'link' } });
  const leads: Lead[] = [
    { key: 'e.ld3', from: () => partOf(E3, 'n'), to: () => m.where.point(4), col: 'wrong' },
    { key: 'e.ld5', from: () => partOf(E5, 'l'), to: () => m.where.line2End, col: 'water' },
  ];
  setTG({
    pre: 'e.', model: m, lines: [Q, E1, ...E2, E3a, E3, E4, E5], leads,
    focus: () => ({ hot: tr.k('e.hot') > 0.5 ? [2, 3] : [], hotCol: 'wrong', dimOthers: false, missK: tr.k('e.miss') }),
    extra: c => { const k = tr.k('e.hot'); if (k > 0) underline(c, partOf(E1, 'x'), 'wrong', k); },
  });
  jump('e.', ['table', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Find the changes', why: 'Each output minus the one above it.', act: 'Find the changes' },
    { t: 'Check every step', why: 'One different change is enough.', act: 'Check' },
    { t: 'Plot the points', why: 'Input across, output up.', act: 'Plot' },
    { t: 'Compare a linear plan', why: 'Same change every step: one straight line.', act: 'Compare' },
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
        tr.set('e.q', 0, 0.5);
        tr.set('e.changes', 1, 2.6, 0.2); await wait(2.6); if (!alive()) return;
        tr.set('e.E1', 1, 1.0); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.hot', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('e.E2', 1, 1.0); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.E1:dim', 1, 0.5); tr.set('e.E2:dim', 1, 0.5);
        tr.set('e.axes', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.points', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.ruler', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.miss', 1, 0.5); tr.set('e.E3', 1, 1.0, 0.2); await wait(1.2); if (!alive()) return;
        tr.set('e.ld3', 1, 0.9); await wait(0.9);
      } else {
        tr.set('e.ld3:dim', 1, 0.5); tr.set('e.E3:dim', 1, 0.5); tr.set('e.miss', 0.35, 0.5);
        tr.set('e.points2', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.line2', 1, 1.0); tr.set('e.E4', 1, 1.0, 0.2); await wait(1.3); if (!alive()) return;
        tr.set('e.E5', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.ld5', 1, 0.9); await wait(0.9);
      }
      if (!alive()) return;
      sayBox.replaceChildren(para(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Each step right (1 week) goes up the same $3.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'His savings go up every week.', ok: false, mc: 'mc.linear-functions.illusion-of-linearity', id: 'e.w-up' },
      { t: 'His first two changes are both +3.', ok: false, mc: 'mc.reasoning-language.checks-only-some-given-cases', id: 'e.w-two' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fb(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: "Why are Leo's points on one straight line?", response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
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

// ===== 3. Your turn: a draining tank, a row every 2 minutes (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = mk({ xs: [0, 2, 4, 6, 8], ys: [40, 34, 28, 22, 16], xHead: ['min', ''], yHead: ['water', '(gal)'], xName: 'minutes', yName: 'water (gal)', yGrid: 5, yMax: 40 });
  const y0 = BOARD.y0;
  const T1 = one('t.T1', `\\cssId{c}{{-}6,\\,{-}6,\\,{-}6,\\,{-}6}`, y0 + 110, 80, { c: { col: 'second' } });
  const T2 = lines('t.T2', `\\text{same change} | \\text{every row}`, y0 + 230, 56, undefined, 76);
  const T3 = one('t.T3', `\\cssId{a}{6} \\div \\cssId{b}{2} = \\cssId{s}{3}`, y0 + 430, 84, { a: { col: 'second' }, s: { col: 'link' } });
  const T3b = one('t.T3', `\\text{gallons per minute}`, y0 + 525, 48, undefined, 'dim');
  const T4 = one('t.T4', `\\text{start }\\cssId{a}{40}`, y0 + 640, 72, { a: { col: 'first' } });
  const T5 = one('t.T5', `\\cssId{c}{{-}3}\\text{ each minute}`, y0 + 740, 64, { c: { col: 'second' } });
  const T6 = one('t.T6', `\\cssId{l}{\\text{linear}}`, y0 + 860, 80, { l: { col: 'link' } });
  const leads: Lead[] = [
    { key: 't.ld3', from: () => partOf(T3, 's'), to: () => m.where.stair(3), col: 'link' },
  ];
  setTG({ pre: 't.', model: m, lines: [T1, ...T2, T3, T3b, T4, T5, T6], leads });
  tr.set('t.table', 1, 1.8, 0.2);

  let step = 0;
  const STEPS = [
    { t: 'Find the changes', why: 'Done for you.' },
    { t: 'Check every step', why: 'Done for you.' },
    { t: 'Change per 1 minute', why: 'Your step.' },
    { t: 'Start and change', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A draining tank'), para('t.intro'), plan, work);

  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    tr.set('t.changes', 1, 2.4); await wait(2.4); if (!alive()) return;
    tr.set('t.T1', 1, 1.0); work.replaceChildren(para('t.s1')); await wait(2.4); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.T2', 1, 1.0); work.replaceChildren(para('t.s2')); await wait(4.2); if (!alive()) return;
    step = 2; drawPlan();
    askUnit();
  });

  function askUnit(): void {
    const fbHost = h('div');
    const inp = numInput('gallons per minute', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number.')); return; }
      const v = Math.abs(r.v);
      const right = v === 3, mc = v === 6 ? 'mc.linear-functions.ignores-input-step' : [40, 34, 28, 22, 16].includes(v) ? 'mc.linear-functions.output-value-as-change' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.perUnit', prompt: 'The tank loses 6 gallons every 2 minutes: how many per 1 minute?', response: r, expected: 3, correct: right, mc });
      fbHost.replaceChildren(fb(right, right ? 't.u-ok' : v === 6 ? 't.u-six' : mc ? 't.u-out' : 't.u-other'));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.T1:dim', 1, 0.5); tr.set('t.T2:dim', 1, 0.5);
        tr.set('t.axes', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('t.points', 1, 1.3); await wait(1.3); if (!alive()) return;
        tr.set('t.stairs', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('t.units', 1, 1.6); tr.set('t.T3', 1, 1.0, 0.4); await wait(1.8); if (!alive()) return;
        tr.set('t.ld3', 1, 0.9); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askRule();
      });
    }
    work.replaceChildren(para('t.unit'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askRule(): void {
    const chips = [
      { t: '40 gallons', r: 'start', kind: 's' }, { t: '16 gallons', r: 's16', kind: 's' }, { t: '0 gallons', r: 's0', kind: 's' },
      { t: 'down 3', r: 'change', kind: 'c' }, { t: 'down 6', r: 'c6', kind: 'c' }, { t: 'up 3', r: 'cup', kind: 'c' },
    ];
    const slots: (number | null)[] = [null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips' });
    const fbHost = h('div');
    const draw = () => {
      const slot = (i: number) => {
        const v = slots[i]; const ch = v === null || v === undefined ? null : chips[v]!;
        const s = h('button', { class: 'slot' + (ch ? ' filled ' + (i === 0 ? 'a' : 'b') : ''), 'aria-label': i === 0 ? 'the start' : 'the change' }, ch ? ch.t : '?');
        s.addEventListener('click', () => { slots[i] = null; draw(); });
        return s;
      };
      eq.replaceChildren(h('span', {}, 'starts at'), slot(0), h('span', {}, ', goes'), slot(1), h('span', {}, 'each minute'));
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch.t, () => { const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, y] = slots.map(i => (i === null ? null : chips[i]!));
      if (!x || !y) return;
      const right = x.r === 'start' && y.r === 'change';
      let id = 't.r-ok', mc: string | undefined;
      if (!right) {
        if (x.kind !== 's' || y.kind !== 'c') id = 't.r-slot';
        else if (x.r === 's16') { id = 't.r-16'; mc = 'mc.linear-functions.first-output-as-intercept'; }
        else if (x.r === 's0') { id = 't.r-0'; mc = 'mc.linear-functions.linear-means-proportional'; }
        else if (y.r === 'c6') { id = 't.r-6'; mc = 'mc.linear-functions.ignores-input-step'; }
        else { id = 't.r-up'; mc = 'mc.linear-functions.constant-change-must-increase'; }
      }
      ctx.store.log({ part: 'turn', item: 'turn.rule', prompt: 'The tank: starts at ?, goes ? each minute', response: [x.t, y.t], expected: ['40 gallons', 'down 3'], correct: right, mc });
      fbHost.replaceChildren(fb(right, id));
      if (!right) { setTimeout(() => { slots[0] = slots[1] = null; draw(); }, 1100); return; }
      chipBox.remove();
      seq(async alive => {
        tr.set('t.ld3:dim', 1, 0.5); tr.set('t.T3:dim', 1, 0.5);
        tr.set('t.start', 1, 0.8); tr.set('t.T4', 1, 0.9, 0.2); await wait(1.2); if (!alive()) return;
        tr.set('t.line', 1, 1.2); tr.set('t.T5', 1, 0.9, 0.3); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); askLinear();
      });
    }
    draw();
    work.replaceChildren(para('t.rule'), eq, chipBox, fbHost);
  }
  function askLinear(): void {
    const fbHost = h('div');
    const yes = btn('Yes, it could be linear', () => answer(true)), no = btn('No, it goes down', () => answer(false));
    function answer(isYes: boolean): void {
      yes.disabled = no.disabled = true;
      ctx.store.log({ part: 'turn', item: 'turn.linear', prompt: 'Could the tank table be linear, even though the water goes down?', response: isYes ? 'yes' : 'no', expected: 'yes', correct: isYes, mc: isYes ? undefined : 'mc.linear-functions.constant-change-must-increase' });
      fbHost.replaceChildren(feedback(isYes, SCRIPT[isYes ? 't.l-yes' : 't.l-no']!));
      const pick = commit().pick, wrongCertain = pick !== null && pick !== 2 && commit().sure === 2;
      sayAll([isYes ? 't.l-yes' : 't.l-no', `t.cb-${pick ?? 2}`, ...(wrongCertain ? ['t.cb-sure'] : [])]);
      seq(async alive => {
        tr.set('t.T4:dim', 1, 0.5); tr.set('t.T5:dim', 1, 0.5);
        tr.set('t.T6', 1, 1.0); await wait(1.2); if (!alive()) return;
        const cb = h('div', { class: 'callback' });
        cb.append(html('p', '', SCRIPT[`t.cb-${pick ?? 2}`]!));
        if (wrongCertain) cb.append(html('p', '', SCRIPT['t.cb-sure']!));
        cb.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
        fbHost.append(cb);
      });
    }
    work.replaceChildren(para('t.lin'), h('div', { class: 'row' }, yes, no), fbHost);
  }
}

// ===== 4. Prove it: Riley's seedling 1, 3, 5, 8, 11 =====
function partProve(): void {
  tr.reset('p.');
  const m = mk({ xs: [0, 1, 2, 3, 4], ys: [1, 3, 5, 8, 11], xHead: ['day', ''], yHead: ['height', '(in.)'], xName: 'days', yName: 'height (in.)', yGrid: 2, yMax: 12 });
  const y0 = BOARD.y0;
  const R1 = lines('p.R1', `\\text{Riley: straight} | \\text{pieces, so}`, y0 + 100, 56, 'dim', 72);
  const R2 = one('p.R2', `\\cssId{w}{\\text{linear}}`, y0 + 255, 80);
  const C1a = one('p.C1', `\\text{days}`, y0 + 400, 48, undefined, 'dim');
  const C1 = one('p.C1', `\\cssId{c}{{+}1,\\,{+}1,\\,{+}1,\\,{+}1}`, y0 + 470, 72, { c: { col: 'pick' } });
  const C2a = one('p.C2', `\\text{height}`, y0 + 580, 48, undefined, 'dim');
  const C2 = one('p.C2', `\\cssId{c}{{+}2,\\,{+}2,}\\,\\cssId{x}{{+}3,\\,{+}3}`, y0 + 650, 72, { c: { col: 'second' }, x: { col: 'wrong' } });
  const C3 = one('p.C3', `\\cssId{l}{\\text{not linear}}`, y0 + 830, 76, { l: { col: 'link' } });
  const leads: Lead[] = [{ key: 'p.ld3', from: () => partOf(C3, 'l'), to: () => m.where.point(4), col: 'wrong' }];
  setTG({
    pre: 'p.', model: m, lines: [...R1, R2, C1a, C1, C2a, C2, C3], leads,
    focus: () => ({ runs: tr.k('p.runs'), hot: tr.k('p.hot') > 0.5 ? [2, 3] : [], hotCol: 'wrong', missK: tr.k('p.miss') }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(R2, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.table', 1, 1.6); tr.set('p.axes', 1, 1.0, 0.8); tr.set('p.points', 1, 1.2, 1.5); tr.set('p.segments', 1, 1.4, 2.6);
  tr.set('p.R1', 1, 0.9, 3.4); tr.set('p.R2', 1, 0.8, 4.0);

  const CHIPS = [
    { t: 'The days are 0, 1, 2, 3, 4: one day each time.', fits: 0 },
    { t: '3 − 1 = 2 and 5 − 3 = 2, but 8 − 5 = 3.', fits: 1 },
    { t: 'One step with a different change is enough to break a straight line.', fits: 2 },
    { t: 'It is made of straight pieces.', fits: -1, mc: 'mc.linear-functions.nonlinear-requires-smooth-curve', id: 'p.w-pieces' },
    { t: 'The height goes up every day.', fits: -1, mc: 'mc.linear-functions.illusion-of-linearity', id: 'p.w-up' },
  ];
  const CLAIMS = ['p.k1', 'p.k2', 'p.k3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 2];
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
        if (n === 1) { tr.set('p.R1:dim', 1, 0.5); tr.set('p.stairs', 1, 1.6); tr.set('p.runs', 1, 0.6, 0.4); tr.set('p.C1', 1, 1.0, 0.6); await wait(2.2); }
        if (n === 2) { tr.set('p.runs', 0, 0.5); tr.set('p.C1:dim', 1, 0.5); tr.set('p.changes', 1, 2.0); await wait(1.8); if (!alive()) return; tr.set('p.hot', 1, 0.5); tr.set('p.C2', 1, 1.0); await wait(1.0); }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5); tr.set('p.stairs', 0, 0.6);
          tr.set('p.ruler', 1, 1.3); await wait(1.3); if (!alive()) return;
          tr.set('p.miss', 1, 0.5); tr.set('p.C3', 1, 1.0, 0.2); await wait(1.2); if (!alive()) return;
          tr.set('p.ld3', 1, 0.9); await wait(0.6); if (!alive()) return;
          tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
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
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: "Riley: the seedling graph is made of straight pieces, so it is linear. Right or wrong?", response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.linear-functions.nonlinear-requires-smooth-curve' : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(para(right ? 'p.build-yes' : 'p.build-no'), chain, chipBox, fbHost);
    drawChain();
  }
  sayAll(['p.intro', 'p.ask']);
  setPanel(h('h2', {}, 'Prove it'), para('p.intro', '', false), para('p.ask', '', false), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as LinItem),
  });
}
const BIG = box(260, 300, 1660, 780);
/** draw a practice item: its table / graph, the question on the board; the solution replays the picture after a miss */
function showItem(item: LinItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const T = lines('x.T', item.board, BOARD.y0 + 120, 84);
  const H = item.hero ? lines('x.hero', item.hero, BOARD.y0 + 440, 80, 'link') : [];
  const pic = item.pic;
  const built = pic ? tryBlock(() => mk(pic.tg)) : null;
  if (!pic || !built || !built.ok) {
    if (built && !built.ok) console.warn('practice picture failed', item.id, built.error);
    setTG({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board.replace(/ \| /g, '\\ '), BIG)], leads: [], boardBox: BIG });
    tr.set('x.T', 1, 0.8, 0.1);
    return {};
  }
  let solving = false;
  const show = (p: LinPic, m: TGBlock, delay: number, jumpAt: boolean) => {
    setTG({
      pre: 'x.', model: m, lines: [...T, ...H], leads: [],
      focus: () => (solving ? { ...(p.solved ?? {}), missK: (p.solved?.missK ?? 0) * tr.k('x.miss') } : (p.focus ?? {})),
    });
    let d = delay;
    for (const s of p.at) { if (jumpAt) tr.jump('x.' + s, 1); else { tr.set('x.' + s, 1, 1.0, d); d += 0.45; } }
  };
  if (pic.at.length === 0) {
    // words only: the question big on a wide slate; the picture is built by the solution
    setTG({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board.replace(/ \| /g, '\\ '), BIG)], leads: [], boardBox: BIG });
    tr.set('x.T', 1, 0.8, 0.1);
  } else {
    show(pic, built.value, 0.1, false);
    for (const L of T) tr.set(L.key, 1, 0.8, 0.5);
  }
  return {
    solve: async alive => {
      let p = pic, m = built.value;
      if (pic.at.length === 0 || pic.then) {
        const q = pic.then ?? pic;
        const b = tryBlock(() => mk(q.tg));
        if (b.ok) { p = q; m = b.value; }
        tr.reset('x.');
        show(p, m, 0, true);
        for (const L of T) tr.jump(L.key, 1);
      }
      solving = true;
      for (const L of T) tr.set(L.key + ':dim', 1, 0.5);
      for (const s of p.solve) {
        if (tr.k('x.' + s) >= 1) tr.jump('x.' + s, 0);
        tr.set('x.' + s, 1, 1.0); await wait(0.85); if (!alive()) return;
      }
      tr.set('x.miss', 1, 0.5);
      for (const L of H) tr.set(L.key, 1, 1.0);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{linear?}', '\\text{Riley: straight pieces,}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
