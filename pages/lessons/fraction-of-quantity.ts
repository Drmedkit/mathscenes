// fraction-of-quantity.ts: topic 2 of the lesson line (grade 5, 5.NF.B.4a), "3/4 of 12 cookies", on the runtime.
//   1 The question   12 cookies, Maya eats 3/4 of them: 3 cards (9, 4 = divides by the top, 3 = stops at one share)
//   2 Worked example the cookies go into 4 equal trays, the same 12 as a tape under them (concreteness fading);
//                    four subgoal steps: Name the whole, Make equal groups, Take the groups, Write it; one "why?"
//   3 Your turn      2/3 of a 15 ft ribbon on the tape alone, faded from the end, then 4/3 of it (more than the whole)
//   4 Prove it       Riley: 3/4 of 28 ft = 18 ft. A because-chain: work backward, rebuild the whole (24, not 28)
//   5 Practice       all 15 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/fraction-of-quantity/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, MF, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item, fr } from '../../src/lesson/runtime/item';
import { FractionOf, type FractionOfBlock, type FractionOfFocus, type FractionOfParams } from '../../src/lesson/topics/fraction-of-quantity/FractionOf';
import { FAMILY_NAMES, GENS } from '../../src/lesson/topics/fraction-of-quantity/items';
import { PLAN } from '../../src/lesson/topics/fraction-of-quantity/plan';

const SLUG = 'fraction-of-quantity';
/** tr.set plus a redraw once the animation has ended. Workaround: stage.ts stops drawing when tr.busy() turns false,
 *  so with slow frames (> 50 ms) the last frame of an animation could be skipped (a leader without its tail). */
function ts(key: string, to: number, d = 0.9, delay = 0): void {
  tr.set(key, to, d, delay);
  setTimeout(markDirty, (d + delay) * 1000 + 60);
}
/** a label pulse 0 -> 1 -> 0 (stage.bump, with the end frame guaranteed) */
async function pulse(key: string, alive: () => boolean): Promise<void> {
  ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6);
}

let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const A = (s: string | number) => `<b class="a">${s}</b>`, B = (s: string | number) => `<b class="b">${s}</b>`, S = (s: string | number) => `<b class="s">${s}</b>`;
const SET_TAGS = { q: { col: 'first' }, b: { col: 'second' }, p: { col: 'pick' }, r: { col: 'link' }, a: { col: 'link' } } as const;

// ---------- scenes ----------
interface Model { pre: string; m: FractionOfBlock; focus?: () => FractionOfFocus }
interface OfScene { models: Model[]; lines: Line[]; leads: Lead[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setOf(S: OfScene): void {
  setScene({
    table: 1040,
    model: c => { for (const M of S.models) M.m.draw(c, progressOf(s => tr.k(M.pre + s)), { ...(M.focus?.() ?? {}), labelQ: tr.k(M.pre + 'pQ'), labelB: tr.k(M.pre + 'pB') }); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
function jump(pre: string, steps: string[]): void { for (const s of steps) tr.jump(pre + s, 1); }
function log(part: 'question' | 'example' | 'turn' | 'prove', item: string, prompt: string, response: unknown, expected: unknown, correct: boolean | null, mc?: string, sure?: number): void {
  ctx.store.log({ part, item, prompt, response, expected, correct, mc, sure });
}

const COOKIES: FractionOfParams = { q: 12, a: 3, b: 4, set: true, whole: '12 cookies', groups: '4 equal groups', look: 'cookie', answerTex: '\\cssId{r}{9}\\ \\text{cookies}' };
const CARDS = [
  { v: 9, mc: '', id: '' },
  { v: 4, mc: '12 ÷ 3: dividing by the top number', id: 'mc.fraction-ops.divides-by-numerator-for-fraction-of-quantity' },
  { v: 3, mc: 'one share only', id: 'mc.ratio-rate.stops-at-unit-rate' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = FractionOf(COOKIES, MF, th);
  const L0 = line('q.l0', '\\text{Maya eats}', BOARD.y0 + 110, 52, undefined, 'dim');
  const L1 = line('q.l1', '\\tfrac{3}{4} \\text{ of } \\cssId{q}{12} = \\ ?', BOARD.y0 + 220, 96, SET_TAGS);
  setOf({ models: [{ pre: 'q.', m }], lines: [L0, L1], leads: [] });
  ts('q.labelQ', 1, 0.6); ts('q.objects', 1, 1.4, 0.2);
  ts('q.l0', 1, 0.8, 1.4); ts('q.l1', 1, 0.9, 1.7);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    log('question', 'question.commit', 'A tray of 12 cookies, Maya eats 3/4 of them: how many cookies?', p.v, 9, p.v === 9, p.id || undefined, commit().sure ?? undefined);
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  say('q.intro');
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>cookies</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Three fourths of the cookies'),
    html('p', '', `A tray holds ${A('12 cookies')}. Maya eats ${fr(3, 4)} of them.`),
    html('p', '', 'How many cookies does Maya eat?'),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===== 2. Worked example: 3/4 of 12 cookies =====
function partExample(): void {
  tr.reset('e.');
  const m = FractionOf(COOKIES, MF, th), W = m.where;
  const yTop = BOARD.y0 + 120;
  const Q = line('e.q', '\\tfrac{3}{4} \\text{ of } \\cssId{q}{12} = \\ ?', yTop, 96, SET_TAGS);
  const H = line('e.hero', '\\tfrac{\\cssId{a}{3}}{\\cssId{b}{4}} \\text{ of } \\cssId{q}{12} = \\cssId{r}{9}', yTop, 96, SET_TAGS);
  const L1 = line('e.L1', '\\cssId{q}{12} \\div \\cssId{b}{4} = \\cssId{p}{3}', W.group(3).cy, 80, SET_TAGS);
  const L2 = line('e.L2', '\\cssId{p}{3} \\times 3 = \\cssId{r}{9}', W.answer.cy, 80, SET_TAGS);
  const L3 = line('e.L3', '(\\cssId{q}{12} \\div \\cssId{b}{4}) \\times 3 = \\cssId{r}{9}', W.tape.cy, 72, SET_TAGS);
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'p'), to: () => W.group(3), col: 'pick' },
    { key: 'e.ld2', from: () => partOf(L2, 'r'), to: () => W.answer, col: 'link' },
  ];
  setOf({
    models: [{ pre: 'e.', m, focus: () => { const k = tr.k('e.f1'); return k > 0 ? { groups: [3], k, col: 'pick' } : {}; } }],
    lines: [Q, H, L1, L2, L3], leads,
  });
  jump('e.', ['labelQ', 'objects', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Name the whole', why: 'All 12 cookies. The same 12 as one tape.', act: 'Name it' },
    { t: 'Make 4 equal groups', why: 'The bottom number says how many.', act: 'Group them' },
    { t: 'Take 3 of the groups', why: 'The top number says how many to take.', act: 'Take 3' },
    { t: 'Write it', why: 'Divide by the bottom, times the top.', act: 'Write it' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  const SAY = [
    `The whole is all ${A('12 cookies')}. The tape under them is the same 12.`,
    `${B('4 equal groups')}: 12 ÷ 4 = ${S('3')} in each group. Each part of the tape is 3 too.`,
    `${fr(3, 4)} means 3 of the 4 groups. 3 groups of 3 is ${S('9 cookies')}.`,
    `${fr(3, 4)} of ${A(12)} = (12 ÷ ${B(4)}) × 3 = ${S(9)}. Divide by the bottom number, then multiply by the top.`,
  ];
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.innerHTML = '';
    say(`e.step${i}`);
    seq(async alive => {
      if (i === 0) {
        void pulse('e.pQ', alive);
        ts('e.tape', 1, 1.2, 0.3); ts('e.total', 1, 0.8, 1.2); await wait(2.0);
      } else if (i === 1) {
        ts('e.group', 1, 2.4); ts('e.labelB', 1, 0.6, 0.4); await wait(2.4); if (!alive()) return;
        ts('e.cut', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.share', 1, 0.8); ts('e.L1', 1, 1.0); void pulse('e.pB', alive); await wait(1.0); if (!alive()) return;
        ts('e.f1', 1, 0.5); ts('e.ld1', 1, 0.9);
      } else if (i === 2) {
        ts('e.ld1', 0, 0.4); ts('e.f1', 0, 0.4); ts('e.L1:dim', 1, 0.6);
        ts('e.take', 1, 1.8); await wait(1.9); if (!alive()) return;
        ts('e.count', 1, 0.8); ts('e.L2', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
        ts('e.ld2', 1, 0.9);
      } else {
        ts('e.ld2', 0, 0.4); ts('e.L2:dim', 1, 0.6); ts('e.q', 0, 0.6);
        ts('e.hero', 1, 1.4, 0.3); await wait(0.5); if (!alive()) return;
        void pulse('e.pQ', alive); await wait(0.5); void pulse('e.pB', alive); await wait(1.0); if (!alive()) return;
        ts('e.L3', 1, 1.2); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(html('p', '', SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 4 says the whole is cut into 4 equal groups.', ok: true, mc: undefined as string | undefined, say: `Yes. Fourths are 4 equal groups of the whole, so one fourth is 12 ÷ 4.` },
      { t: 'You make groups of 4, because the bottom number is 4.', ok: false, mc: 'mc.fractions-concept.fraction-of-set-misgrouped', say: `Groups of 4 give 3 groups, and one of those is a third. The 4 counts the groups, not the cookies in a group.` },
      { t: 'Three fourths means 3 cookies.', ok: false, mc: 'mc.fractions-concept.numerator-as-object-count', say: `The 3 counts groups, not cookies. Each group has 3 cookies, so 3 groups are 9.` },
    ];
    const box2 = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => box2.append(btn(o.t, () => {
      box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(feedback(o.ok, o.say));
      log('example', 'example.why', 'Why do we divide by 4, not by 3?', o.t, opts[0]!.t, o.ok, o.mc);
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, 'Quick check: why do we divide by 4, not by 3?'), box2, fbHost);
    void ctx.say('e.step3').then(() => say('e.why'));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), html('p', 'dim', 'Four steps. Press each one and watch the picture, then the notation.'), plan, sayBox, after);
  say('e.intro');
}

// ===== 3. Your turn: 2/3 of a 15 ft ribbon, then 4/3 of it =====
function partTurn(): void {
  tr.reset('t.'); tr.reset('u.');
  const scale = 705 / 15;
  const base: FractionOfParams = { q: 15, a: 2, b: 3, whole: 'a 15 ft ribbon', groups: '3 equal parts', unit: 'ft', scale };
  const m = FractionOf(base, MF, th), m4 = FractionOf({ ...base, a: 4 }, MF, th), W = m.where;
  const yTop = BOARD.y0 + 120;
  const Q = line('t.q', '\\tfrac{2}{3} \\text{ of } \\cssId{q}{15}\\ \\text{ft} = \\ ?', yTop, 92, SET_TAGS);
  const L1 = line('t.L1', '\\cssId{q}{15} \\div \\cssId{b}{3} = \\cssId{p}{5}', W.tape.cy, 80, SET_TAGS);
  const L2 = line('t.L2', '\\cssId{p}{5} \\times 2 = \\cssId{r}{10}\\ \\text{ft}', W.answer.cy, 80, SET_TAGS);
  const H = line('t.hero', '(\\cssId{q}{15} \\div \\cssId{b}{3}) \\times 2 = \\cssId{r}{10}', yTop, 88, SET_TAGS);
  const H4 = line('t.h4', '\\tfrac{4}{3} \\text{ of } \\cssId{q}{15} = \\cssId{r}{20}\\ \\text{ft}', m4.where.answer.cy, 80, SET_TAGS);
  const leads: Lead[] = [
    { key: 't.ld1', from: () => partOf(L1, 'p'), to: () => W.sectionLabel(2), col: 'pick' },
    { key: 't.ld2', from: () => partOf(L2, 'r'), to: () => W.answer, col: 'link' },
    { key: 't.ld4', from: () => partOf(H4, 'r'), to: () => m4.where.answer, col: 'link' },
  ];
  let use4 = false;
  const scene = () => setOf({
    models: [use4 ? { pre: 'u.', m: m4 } : { pre: 't.', m, focus: () => { const k = tr.k('t.f1'); return k > 0 ? { sections: [2], k, col: 'pick' } : {}; } }],
    lines: [Q, L1, L2, H, H4], leads,
  });
  scene();
  ts('t.labelQ', 1, 0.6); ts('t.tape', 1, 1.2, 0.2); ts('t.total', 1, 0.8, 1.0); ts('t.q', 1, 0.8, 1.2);

  let step = 0;
  const STEPS = [
    { t: 'Name the whole', why: 'Done for you: the 15 ft ribbon.' },
    { t: 'Make 3 equal parts', why: 'Done for you.' },
    { t: 'Take 2 of the parts', why: 'Your step.' },
    { t: 'Write it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  say('t.intro');
  setPanel(h('h2', {}, 'Two thirds of a ribbon'), html('p', '', `Leo has ${A('a 15 ft ribbon')}. He cuts off ${fr(2, 3)} of it. The first two steps are done for you.`), plan, work);

  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    step = 1; drawPlan();
    ts('t.labelB', 1, 0.6); ts('t.cut', 1, 1.2, 0.2); await wait(1.8); if (!alive()) return;
    step = 2; drawPlan(); ts('t.f1', 1, 0.5);
    askShare();
  });

  function numAsk(prompt: string, unit: string, id: string, check: (v: number) => { ok: boolean; mc?: string; say: string }, expected: number, then: () => void): void {
    const fbHost = h('div');
    const inp = numInput(unit, () => submit());
    const ok = btn('Check', () => submit(), 'go');
    function submit(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number first.')); return; }
      const v = check(r.v);
      log('turn', id, prompt.replace(/<[^>]+>/g, ''), r.v, expected, v.ok, v.mc);
      fbHost.replaceChildren(feedback(v.ok, v.say));
      if (v.ok) { ok.disabled = true; then(); }
    }
    work.replaceChildren(html('p', '', prompt), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askShare(): void {
    say('t.share');
    numAsk('How long is ONE of the 3 equal parts?', 'ft', 'turn.share', v =>
      v === 5 ? { ok: true, say: 'Yes: 15 ÷ 3 = 5. Each part is 5 ft.' }
        : v === 15 ? { ok: false, mc: 'mc.fraction-ops.total-written-on-one-section', say: '15 ft is the whole ribbon. One of 3 equal parts is shorter.' }
          : v === 3 ? { ok: false, mc: 'mc.fraction-ops.fraction-of-quantity-report-denominator', say: '3 is how many parts. How long is each? 15 ÷ 3.' }
            : { ok: false, say: 'Share 15 ft into 3 equal parts.' }, 5, () => seq(async alive => {
      ts('t.share', 1, 0.8); ts('t.L1', 1, 1.0, 0.3); ts('t.ld1', 1, 0.9, 1.2); await wait(2.4); if (!alive()) return;
      askTake();
    }));
  }
  function askTake(): void {
    say('t.take');
    numAsk(`Leo cuts off ${fr(2, 3)}: 2 of those parts. How long is that?`, 'ft', 'turn.take', v =>
      v === 10 ? { ok: true, say: 'Yes: 2 parts of 5 ft are 10 ft.' }
        : v === 5 ? { ok: false, mc: 'mc.ratio-rate.stops-at-unit-rate', say: '5 ft is ONE part. Two thirds is 2 parts.' }
          : v === 7.5 ? { ok: false, mc: 'mc.fraction-ops.divides-by-numerator-for-fraction-of-quantity', say: 'That divides by 2. Divide by the bottom number 3, then take 2 parts.' }
            : v === 2 ? { ok: false, mc: 'mc.fractions-concept.numerator-as-object-count', say: '2 counts parts, not feet. Each part is 5 ft.' }
              : { ok: false, say: 'One part is 5 ft. How long are 2 parts?' }, 10, () => seq(async alive => {
      ts('t.ld1', 0, 0.4); ts('t.f1', 0, 0.4); ts('t.L1:dim', 1, 0.5);
      ts('t.take', 1, 1.2); await wait(1.2); if (!alive()) return;
      ts('t.count', 1, 0.8); ts('t.L2', 1, 1.0, 0.3); ts('t.ld2', 1, 0.9, 1.2); await wait(2.3); if (!alive()) return;
      step = 3; drawPlan(); askWrite();
    }));
  }
  function askWrite(): void {
    say('t.write');
    const opts = [
      { t: '(15 ÷ 3) × 2', ok: true, mc: undefined as string | undefined, say: 'Yes: 15 ÷ 3 is one part, × 2 takes two parts.' },
      { t: '(15 ÷ 2) × 3', ok: false, mc: 'mc.fraction-ops.numerator-denominator-roles-swapped', say: 'That cuts into 2 parts and takes 3. The bottom number 3 cuts, the top number 2 takes.' },
      { t: '15 ÷ 3', ok: false, mc: 'mc.ratio-rate.stops-at-unit-rate', say: '15 ÷ 3 is only one part. Two thirds is two of them.' },
    ];
    const box2 = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => box2.append(btn(o.t, () => {
      box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      log('turn', 'turn.write', 'Which expression finds 2/3 of 15 ft?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(feedback(o.ok, o.say));
      if (!o.ok) return;
      box2.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        ts('t.ld2', 0, 0.4); ts('t.L2:dim', 1, 0.5); ts('t.q', 0, 0.6);
        ts('t.hero', 1, 1.3, 0.3); await wait(0.5); if (!alive()) return; void pulse('t.pQ', alive); await wait(0.5); void pulse('t.pB', alive); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan(); askMore();
      });
    })));
    work.replaceChildren(html('p', '', 'Which expression is what you just did?'), box2, fbHost);
  }
  function askMore(): void {
    say('t.more');
    const fbHost = h('div');
    const more = btn('More than 15 ft', () => answer(true)), less = btn('Less than 15 ft', () => answer(false));
    function answer(isMore: boolean): void {
      more.disabled = less.disabled = true;
      log('turn', 'turn.more', 'Is 4/3 of the 15 ft ribbon more or less than 15 ft?', isMore ? 'more' : 'less', 'more', isMore, isMore ? undefined : 'mc.fraction-ops.fraction-factor-always-shrinks');
      fbHost.replaceChildren(feedback(isMore, isMore ? 'Right: 3 parts are the whole ribbon, and 4 parts are one part more.' : 'Look: 3 parts already make the whole 15 ft. 4 parts are one more.'));
      seq(async alive => {
        ts('t.hero:dim', 1, 0.5); ts('t.L1', 0, 0.4); ts('t.L2', 0, 0.4);
        use4 = true; scene();
        jump('u.', ['labelQ', 'labelB', 'tape', 'total', 'cut', 'share']);
        ts('u.take', 1, 1.8); await wait(1.9); if (!alive()) return;
        ts('u.count', 1, 0.8); ts('t.h4', 1, 1.0, 0.3); ts('t.ld4', 1, 0.9, 1.3); await wait(2.4); if (!alive()) return;
        fbHost.append(html('p', '', `${fr(4, 3)} of 15 ft = 4 × 5 = ${S('20 ft')}: more than the whole. A fraction of something can be more than all of it.`), callback());
      });
    }
    work.replaceChildren(html('p', '', `What about ${fr(4, 3)} of the ribbon? Is it more or less than the whole 15 ft?`), h('div', { class: 'row' }, more, less), fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 0]!, right = (commit().pick ?? 0) === 0;
    c.innerHTML = commit().pick === null ? `At the start: ${fr(3, 4)} of 12 cookies is 9.`
      : `At the start you picked ${p.v} cookies and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `
        + (right ? 'You were right: 12 ÷ 4 = 3, and 3 groups are 9. Now you can show why.' : `Now you know: 12 ÷ 4 = 3, and 3 groups are ${S(9)}. ${p.v} was ${p.mc}.`);
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    say('t.done');
    return c;
  }
}

// ===== 4. Prove it: Riley says 3/4 of 28 ft is 18 ft =====
function partProve(): void {
  tr.reset('p.'); tr.reset('r.');
  const scale = 880 / 28;
  const top = FractionOf({ q: 28, a: 3, b: 4, whole: 'a 28 ft rope', groups: '4 equal parts', unit: 'ft', scale, compact: true }, frame(MF.x, MF.y, MF.w, 494), th);
  const low = FractionOf({ q: 24, a: 3, b: 4, whole: 'rebuilt', groups: 'parts', unit: 'ft', scale, compact: true, noLabels: true, answerTex: '\\cssId{r}{18}\\ \\text{ft}' }, frame(MF.x, MF.y + 504, MF.w, 436), th);
  const J = line('p.J', '\\text{Riley: }\\ \\tfrac{3}{4} \\text{ of } 28 = \\cssId{w}{18}', BOARD.y0 + 100, 76);
  const H = line('p.hero', '\\tfrac{3}{4} \\text{ of } \\cssId{q}{28} = \\cssId{r}{21}\\ \\text{ft}', top.where.answer.cy, 80, SET_TAGS);
  const C1 = line('p.C1', '18 \\div 3 = \\cssId{p}{6}', low.where.tape.cy - 30, 76, SET_TAGS);
  const C2 = line('p.C2', '\\cssId{p}{6} \\times 4 = \\cssId{x}{24} \\ne \\cssId{q}{28}', low.where.tape.cy + 110, 76, { ...SET_TAGS, x: { col: 'wrong' } });
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 'p'), to: () => low.where.sectionLabel(2), col: 'pick' },
    { key: 'p.ldH', from: () => partOf(H, 'r'), to: () => top.where.answer, col: 'link' },
  ];
  setOf({
    models: [{ pre: 'p.', m: top }, { pre: 'r.', m: low }], lines: [J, C1, C2, H], leads,
    extra: c => {
      const kg = tr.k('p.gap');
      if (kg > 0) {   // the 4 ft the rebuilt whole is short of the real whole
        const T = low.where.tape, x0 = T.x0 + 24 * scale, x1 = T.x0 + 28 * scale, g = c.g;
        g.save(); g.globalAlpha *= kg; g.setLineDash([10, 8]); g.strokeStyle = '#FF6B67'; g.lineWidth = 4;
        g.beginPath(); g.roundRect(x0 + 4, T.y0, x1 - x0 - 4, T.h, 10); g.stroke(); g.restore();
      }
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  ts('p.labelQ', 1, 0.6); ts('p.labelB', 1, 0.6, 0.3); ts('p.tape', 1, 1.2, 0.2); ts('p.total', 1, 0.8, 1.0); ts('p.J', 1, 1.0, 1.3);

  const CHIPS = [
    { t: '18 is 3 equal shares, so one share is 18 ÷ 3.', fits: 0 },
    { t: 'The whole is 4 shares: 6 × 4.', fits: 1 },
    { t: '28 ÷ 4 = 7 in each share, and 3 shares are 21.', fits: 2 },
    { t: 'One share is 18 ÷ 4.', fits: -1, mc: 'mc.ratio-rate.known-part-divided-by-denominator-for-unit-share', say: '18 ft is 3 shares, not 4. To find one share, divide by 3.' },
    { t: '6 × 3 = 18, so the whole checks out.', fits: -1, mc: 'mc.fraction-ops.rebuilds-whole-with-numerator', say: '6 × 3 only gets back to the 18. The WHOLE is 4 shares.' },
    { t: "Riley's sums are right, so the answer is right.", fits: -1, mc: 'mc.reasoning-language.correct-arithmetic-validates-setup', say: 'Right sums can still answer the wrong question. Check against the whole 28 ft.' },
  ];
  const CLAIMS = [
    `If Riley is right, one share would be ${S('6 ft')},`,
    `Then the whole rope would be <b>24 ft, not 28 ft</b>,`,
    `So ${fr(3, 4)} of ${A('28 ft')} is ${S('21 ft')}, not 18 ft,`,
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${CHIPS.find(c => c.fits === i)!.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3 || used.has(i)) return;
    log('prove', `prove.claim${filled + 1}`, CLAIMS[filled]!.replace(/<[^>]+>/g, ''), ch.t, CHIPS.find(c => c.fits === filled)!.t, ch.fits === filled, ch.mc);
    if (ch.fits !== filled) {
      fbHost.replaceChildren(feedback(false, ch.say ?? `True, but it is the reason for a different line. Which reason makes "${CLAIMS[filled]!.replace(/<[^>]+>/g, '').replace(/,$/, '')}" true?`));
      return;
    }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    say(`p.c${n}`);
    seq(async alive => {
      if (n === 1) {
        ts('r.tape', 0.75, 1.0); ts('r.cut', 1, 0.8, 0.8); await wait(1.6); if (!alive()) return;
        ts('r.take', 1, 1.0); ts('r.count', 1, 0.8, 0.8); await wait(1.8); if (!alive()) return;
        ts('r.share', 1, 0.8); ts('p.C1', 1, 1.0, 0.2); ts('p.ld1', 1, 0.9, 1.1);
      } else if (n === 2) {
        ts('p.ld1', 0, 0.4); ts('p.C1:dim', 1, 0.5);
        ts('r.tape', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('r.total', 1, 0.8); ts('p.C2', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
        ts('p.gap', 1, 0.6); void pulse('p.pQ', alive);
      } else {
        ts('p.C2:dim', 1, 0.5);
        ts('p.cut', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('p.share', 1, 0.8); ts('p.take', 1, 1.2, 0.6); await wait(2.0); if (!alive()) return;
        ts('p.count', 1, 0.8); ts('p.hero', 1, 1.0, 0.3); ts('p.ldH', 1, 0.9, 1.2); await wait(2.2); if (!alive()) return;
        ts('p.strike', 1, 0.6);
        chipBox.remove();
        say('p.done');
        fbHost.replaceChildren(feedback(true, `That's a proof: three claims, each with its reason, and the picture backs every one. Working backward has to rebuild the whole.`), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    log('prove', 'prove.judge', 'Riley: 3/4 of 28 ft is 18 ft. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? 'mc.reasoning-language.correct-arithmetic-validates-setup' : undefined);
    say('p.build');
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(html('p', '', right ? `Let's test it: work backward from 18 ft and see if it rebuilds the whole.` : `Now prove it. Fill each “because” with the reason that makes the line true.`), chain, chipBox, fbHost);
    drawChain();
  }
  say('p.intro');
  setPanel(h('h2', {}, 'Prove it'), html('p', '', `Riley has ${A('a 28 ft rope')} and says ${fr(3, 4)} of it is 18 ft.`), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
interface Pic extends FractionOfParams { show?: 'take' }
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed), show: showItem,
  });
}
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as Pic | undefined;
  const mb = pic ? tryBlock(() => FractionOf(pic, MF, th)) : null;
  const m = mb && mb.ok ? mb.value : null;
  if (m && pic) {
    const { q, a, b } = pic, W = m.where, s = q % b === 0 ? String(q / b) : `\\tfrac{${q}}{${b}}`;
    const r = (a * q) % b === 0 ? String((a * q) / b) : `\\tfrac{${a * q}}{${b}}`;
    const T = line('x.T', item.board, BOARD.y0 + 110, 84);
    const L1 = line('x.L1', pic.hideTotal ? `\\text{one share} = \\cssId{p}{${s}}` : `\\cssId{q}{${q}} \\div \\cssId{b}{${b}} = \\cssId{p}{${s}}`, W.tape.cy, 76, SET_TAGS);
    const L2 = line('x.L2', pic.hideTotal ? `\\cssId{p}{${s}} \\times \\cssId{b}{${b}} = \\cssId{q}{${q}}` : a === 1 ? `\\tfrac{1}{\\cssId{b}{${b}}} \\text{ of } \\cssId{q}{${q}} = \\cssId{r}{${s}}` : `\\cssId{p}{${s}} \\times ${a} = \\cssId{r}{${r}}`, W.answer.cy, 80, SET_TAGS);
    const leads: Lead[] = [
      { key: 'x.ld1', from: () => partOf(L1, 'p'), to: () => W.sectionLabel(Math.min(b, Math.max(a, b)) - 1), col: 'pick' },
      ...(pic.hideTotal ? [] : [{ key: 'x.ld2', from: () => partOf(L2, 'r'), to: () => W.answer, col: 'link' as const }]),
    ];
    setOf({ models: [{ pre: 'x.', m }], lines: [T, L1, L2], leads });
    ts('x.labelQ', 1, 0.6); ts('x.T', 1, 0.8, 0.4);
    if (pic.set) ts('x.objects', 1, 1.2, 0.1);
    else { ts('x.tape', 1, 1.0, 0.1); ts('x.total', 1, 0.7, 0.8); }
    if (pic.show === 'take') { ts('x.labelB', 1, 0.6, 0.6); ts('x.cut', 1, 0.8, 0.8); ts('x.take', 1, 0.9, 1.3); ts('x.count', 1, 0.7, 1.9); }
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        if (pic.set) { ts('x.group', 1, 1.4); ts('x.labelB', 1, 0.6); await wait(1.4); if (!alive()) return; ts('x.tape', 1, 0.8); ts('x.total', 1, 0.6, 0.5); await wait(1.1); if (!alive()) return; }
        ts('x.labelB', 1, 0.6); ts('x.cut', 1, 0.7); await wait(0.7); if (!alive()) return;
        ts('x.share', 1, 0.7); ts('x.L1', 1, 0.8, 0.2); ts('x.ld1', 1, 0.8, 0.8); await wait(1.6); if (!alive()) return;
        ts('x.ld1:dim', 1, 0.4); ts('x.L1:dim', 1, 0.4);
        ts('x.take', 1, 1.0); ts('x.count', 1, 0.6, 0.8); ts('x.L2', 1, 0.8, 1.0); ts('x.ld2', 1, 0.8, 1.6);
      },
    };
  }
  const big = box(300, 260, 1620, 760);
  setOf({ models: [], lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{Maya eats}', '\\text{Riley: }', '\\text{one share}', '\\text{ft in yd min cookies marbles crackers beads}', '\\tfrac{3}{4} \\times 12 \\div 4 = ? \\ne'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
