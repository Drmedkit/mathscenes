// percent-applications.ts: "Percent applications" (grade 7, 7.RP.A.3 / 7.EE.A.2 / 7.EE.B.3), on the lesson runtime.
//   1 The question   $80 jacket, 20% off, then another 10% off at the register: $57.60 / $56 (rates added) /
//                    $22.40 (the savings reported as the price)
//   2 Worked example Name the 100% -> Take 20% off -> The new 100% -> One multiplier; the tapes (one dollar scale)
//                    move first, the board writes beside them; one "why $57.60 and not $56?"
//   3 Your turn      $50 game up 20%, then down 20%, faded from the end: the kid names the new 100%, works out the
//                    price and the net change (-4%, not "no change")
//   4 Prove it       Ava: "20% off then 8% tax is cheaper than tax first"; a because-chain, the tapes end together
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel lines: src/lesson/topics/percent-applications/script.ts; spoken text: percent-applications/voice/lines.json.
// Every answer is logged with its misconception id.
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { tryBlock } from '../../src/blocks/block';
import { texBox, texWidth } from '../../src/core/tex';
import { BOARD, BOARD_W, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { PercentTape, type TapeBlock, type TapeFocus, type TapeRow } from '../../src/lesson/topics/percent-applications/PercentTape';
import { TF, drawSplit } from '../../src/lesson/topics/percent-applications/scenes';
import { FAMILY_NAMES, GENERATORS, MC, type PaItem } from '../../src/lesson/topics/percent-applications/items';
import { PLAN } from '../../src/lesson/topics/percent-applications/plan';
import { SCRIPT } from '../../src/lesson/topics/percent-applications/script';

const SLUG = 'percent-applications';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line */
const say = (id: string, cls = ''): HTMLElement => { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); };
const fbk = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
/** tr.set plus one more frame after the move ends (a slow machine can stop the stage loop on a frame with k < 1) */
function ts(name: string, to: number, d = 0.9, delay = 0): void { tr.set(name, to, d, delay); setTimeout(markDirty, (d + delay) * 1000 + 120); }
async function bump(key: string, alive: () => boolean): Promise<void> { ts(key, 1, 0.35); await wait(1.0); if (!alive()) return; ts(key, 0.0, 0.6); }

const TAGS = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const } };
const Y = (k: number) => BOARD.y0 + k;
const tape = (rows: TapeRow[], max?: number) => PercentTape({ rows, max }, TF);
type Col = 'first' | 'second' | 'link' | 'pick' | 'wrong';

/** a scene of tapes on the left (rows cross-fading from `before` to `after` by `<pre>s<r>`) and the board */
interface TapeScene { pre: string; after: TapeBlock; before?: TapeBlock | null; n: number; lines: Line[]; leads: Lead[]; focus?: () => TapeFocus; focusBefore?: () => TapeFocus; extra?: Parameters<typeof setScene>[0]['extra'] }
function setTapes(S: TapeScene): void {
  setScene({
    table: 1080,
    model: c => drawSplit(c, S.after, S.before ?? null, S.n, k => tr.k(S.pre + k), r => tr.k(`${S.pre}s${r}`), S.focus?.(), S.focusBefore?.()),
    lines: S.lines, leads: S.leads, extra: S.extra,
  });
}
const lit = (pre: string, key: string, r: number, i: number, col: Col) => ({ r, i, col, k: tr.k(pre + key) });

// ===== 1. The question =====
const CARDS = [
  { t: '$56.00', ok: false, mc: MC.adds, why: '20% and 10% added up to 30% off' },
  { t: '$57.60', ok: true, mc: '', why: '' },
  { t: '$22.40', ok: false, mc: MC.changeFinal, why: 'what you save, not what you pay' },
];
function partQuestion(): void {
  tr.reset('q.');
  const T = tape([{ lead: '$80', segs: [{ amt: 80, role: 'base', pct: '100%' }] }]);
  const Q1 = line('q.Q1', '\\cssId{a}{\\$80}\\ \\text{jacket}', Y(150), 84, TAGS);
  const Q2 = line('q.Q2', '\\cssId{b}{20\\%}\\ \\text{off}', Y(300), 80, TAGS);
  const Q3 = line('q.Q3', '\\text{then } \\cssId{b}{10\\%}\\ \\text{off}', Y(420), 80, TAGS);
  const Q4 = line('q.Q4', '\\text{you pay } ?', Y(620), 84);
  setTapes({ pre: 'q.', after: T, n: 1, lines: [Q1, Q2, Q3, Q4], leads: [] });
  ts('q.r0', 1, 1.0); ts('q.l0', 1, 0.6, 0.9);
  ts('q.Q1', 1, 0.8, 1.2); ts('q.Q2', 1, 0.8, 1.8); ts('q.Q3', 1, 0.8, 2.4); ts('q.Q4', 1, 0.8, 3.0);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '$80 jacket, 20% off, then another 10% off the sale price: what do you pay?', response: p.t, expected: '$57.60', correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>you pay</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two discounts on one jacket'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the jacket =====
function partExample(): void {
  tr.reset('e.');
  const R2: TapeRow = { segs: [{ amt: 57.6, role: 'result', pct: '72%' }], end: '$57.60' };
  const E0 = tape([
    { lead: '$80', segs: [{ amt: 80, role: 'base', pct: '100%' }] },
    { lead: '$64', segs: [{ amt: 64, role: 'base', pct: '100%' }] },
    R2,
  ], 80);
  const E = tape([
    { lead: '$80', segs: [{ amt: 64, role: 'base', pct: '80%', val: '$64' }, { amt: 16, role: 'cut', pct: '20%', val: '$16' }] },
    { lead: '$64', segs: [{ amt: 57.6, role: 'base', pct: '90%' }, { amt: 6.4, role: 'cut', pct: '10%', val: '$6.40' }] },
    R2,
  ], 80);
  const L1 = line('e.L1', '\\cssId{a}{\\$80} = 100\\%', Y(110), 80, TAGS);
  const L2 = line('e.L2', '100\\% - \\cssId{b}{20\\%} = 80\\%', Y(240), 72, TAGS);
  const L3 = line('e.L3', '80 \\times 0.8 = \\cssId{s}{64}', Y(350), 76, TAGS);
  const L4 = line('e.L4', '\\cssId{a}{\\$64} = \\text{new } 100\\%', Y(470), 72, TAGS);
  const L5 = line('e.L5', '64 \\times 0.9 = \\cssId{s}{57.60}', Y(580), 76, TAGS);
  const L6 = line('e.L6', '0.8 \\times 0.9 = \\cssId{s}{0.72}', Y(740), 76, TAGS);
  const L7 = line('e.L7', '\\text{pay } 72\\%\\text{, so } 28\\%\\ \\text{off}', Y(850), 64);
  const leads: Lead[] = [{ key: 'e.ld5', from: () => partOf(L5, 's'), to: () => E.where.end(2), col: 'link', drop: 26 }];
  setTapes({
    pre: 'e.', after: E, before: E0, n: 3, lines: [L1, L2, L3, L4, L5, L6, L7], leads,
    focusBefore: () => ({ hi: [lit('e.', 'h0', 0, 0, 'first'), lit('e.', 'h2', 1, 0, 'first')] }),
    focus: () => ({
      hi: [lit('e.', 'h1', 0, 0, 'link')],
      guides: [{ at: 64, r0: 0, r1: 1, col: 'first', k: tr.k('e.g0') }, { at: 57.6, r0: 1, r1: 2, col: 'link', k: tr.k('e.g1') }],
      marks: [{ r: 2, at: 56, text: '$56', col: 'wrong', k: tr.k('e.m56') }],
    }),
  });
  tr.jump('e.s2', 1);

  let step = 0;
  const STEPS = [
    { t: 'Name the 100%', why: 'The original price is the whole tape.', act: 'Show the 100%' },
    { t: 'Take 20% off', why: 'Pay what is left: 80% of $80.', act: 'Take it off' },
    { t: 'The new 100%', why: 'The sale price is the base of the next change.', act: 'Next change' },
    { t: 'One multiplier', why: 'Two changes in a row multiply.', act: 'Combine' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
      return li;
    }));
  };
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren(say(`e.step${i}`));
    seq(async alive => {
      if (i === 0) {
        ts('e.r0', 1, 1.1); ts('e.l0', 1, 0.5, 0.9); await wait(1.2); if (!alive()) return;
        void bump('e.h0', alive); ts('e.L1', 1, 1.0);
      } else if (i === 1) {
        ts('e.L1:dim', 1, 0.5); ts('e.s0', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.L2', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.h1', 1, 0.5); ts('e.L3', 1, 1.0); await wait(1.4); if (!alive()) return;
        ts('e.h1', 0, 0.6);
      } else if (i === 2) {
        ts('e.L2:dim', 1, 0.5); ts('e.L3:dim', 1, 0.5);
        ts('e.g0', 1, 0.7); ts('e.r1', 1, 1.0, 0.5); ts('e.l1', 1, 0.5, 1.4); await wait(1.6); if (!alive()) return;
        void bump('e.h2', alive); ts('e.L4', 1, 1.0); await wait(1.6); if (!alive()) return;
        ts('e.L4:dim', 1, 0.5); ts('e.s1', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.L5', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.g1', 1, 0.6); ts('e.r2', 1, 1.0, 0.4); ts('e.e2', 1, 0.6, 1.3); await wait(1.9); if (!alive()) return;
        ts('e.ld5', 1, 0.9);
      } else {
        ts('e.ld5', 0, 0.4); ts('e.L5:dim', 1, 0.5); ts('e.L1:dim', 1, 0.5);
        ts('e.L6', 1, 1.0); ts('e.l2', 1, 0.6, 0.8); await wait(1.4); if (!alive()) return;
        ts('e.L7', 1, 1.0); await wait(1.2); if (!alive()) return;
        ts('e.m56', 1, 0.6); await wait(0.8); if (!alive()) return;
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The second 10% is of $64, not of $80, so it takes off only $6.40.', ok: true, id: 'e.why.ok' },
      { t: '20% + 10% = 30% off, so it should be $56.', ok: false, mc: MC.adds, id: 'e.why.adds' },
      { t: 'Taking the 10% off first would give $56.', ok: false, mc: MC.order, id: 'e.why.order' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbk(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: SCRIPT['e.why']!, response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    void ctx.say('e.why');
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
    after.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: up 20%, then down 20% (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const R2: TapeRow = { segs: [{ amt: 48, role: 'result', pct: '96%', val: '$48' }, { amt: 2, role: 'ghost', pct: '−4%' }] };
  const E0 = tape([
    { lead: '$50', segs: [{ amt: 50, role: 'base', pct: '100%' }] },
    { lead: '$60', segs: [{ amt: 60, role: 'base', pct: '100%' }] },
    R2,
  ], 60);
  const E = tape([
    { lead: '$50', segs: [{ amt: 50, role: 'base', pct: '100%' }, { amt: 10, role: 'change', pct: '20%', val: '$10' }] },
    { lead: '$60', segs: [{ amt: 48, role: 'base', pct: '80%' }, { amt: 12, role: 'cut', pct: '20%', val: '$12' }] },
    R2,
  ], 60);
  const T1 = line('t.T1', '\\cssId{a}{\\$50} = 100\\%', Y(110), 80, TAGS);
  const T2 = line('t.T2', '50 \\times 1.2 = \\cssId{a}{60}', Y(230), 76, TAGS);
  const T3 = line('t.T3', '\\cssId{a}{\\$60} = \\text{new } 100\\%', Y(380), 72, TAGS);
  const T4 = line('t.T4', '60 \\times 0.8 = \\cssId{s}{48}', Y(500), 76, TAGS);
  const T5 = line('t.T5', '1.2 \\times 0.8 = \\cssId{s}{0.96}', Y(690), 76, TAGS);
  const T6 = line('t.T6', '96\\%\\text{: down } \\cssId{s}{4\\%}', Y(810), 72, TAGS);
  const leads: Lead[] = [{ key: 't.ld4', from: () => partOf(T4, 's'), to: () => E.where.val(2, 0), col: 'link', drop: 26 }];
  setTapes({
    pre: 't.', after: E, before: E0, n: 3, lines: [T1, T2, T3, T4, T5, T6], leads,
    focusBefore: () => ({ hi: [lit('t.', 'h1', 1, 0, 'first')] }),
    focus: () => ({
      guides: [{ at: 60, r0: 0, r1: 1, col: 'first', k: tr.k('t.g0') }, { at: 48, r0: 1, r1: 2, col: 'link', k: tr.k('t.g1') }],
      marks: [{ r: 2, at: 50, text: 'start', col: 'pick', k: tr.k('t.m50') }],
    }),
  });
  tr.jump('t.s2', 1);

  let step = 0;
  const STEPS = [
    { t: 'Name the 100%', why: 'Done for you.' },
    { t: 'Go up 20%', why: 'Done for you.' },
    { t: 'The new 100%', why: 'Your step.' },
    { t: 'One multiplier', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div'), given = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Up 20%, then down 20%'), say('t.intro'), plan, given, work);

  seq(async alive => {
    await wait(1.8); if (!alive()) return;
    ts('t.r0', 1, 1.0); ts('t.l0', 1, 0.5, 0.8); ts('t.T1', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
    step = 1; drawPlan();
    ts('t.T1:dim', 1, 0.5); ts('t.s0', 1, 1.0); await wait(1.1); if (!alive()) return;
    ts('t.T2', 1, 1.0); await wait(1.2); if (!alive()) return;
    given.replaceChildren(say('t.given'));
    step = 2; drawPlan();
    askBase();
  });

  function choiceStep(promptId: string, item: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], done: () => void): void {
    const fbHost = h('div'), row = h('div', { class: 'opts' });
    const t0 = performance.now();
    opts.forEach(o => row.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item, prompt: SCRIPT[promptId]!, response: o.t, expected: opts.find(x => x.ok)!.t, correct: o.ok, mc: o.mc, ms: Math.round(performance.now() - t0) });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      row.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      done();
    })));
    work.replaceChildren(say(promptId), row, fbHost);
  }
  function askBase(): void {
    choiceStep('t.base', 'turn.base', [
      { t: '$50, the price at the start', ok: false, id: 't.base.no', mc: MC.adds },
      { t: '$60, the price after the increase', ok: true, id: 't.base.ok' },
    ], () => seq(async alive => {
      ts('t.T2:dim', 1, 0.5); ts('t.g0', 1, 0.7); ts('t.r1', 1, 1.0, 0.5); ts('t.l1', 1, 0.5, 1.3); await wait(1.5); if (!alive()) return;
      void bump('t.h1', alive); ts('t.T3', 1, 1.0); await wait(1.6); if (!alive()) return;
      askPrice();
    }));
  }
  function askPrice(): void {
    const fbHost = h('div');
    const inp = numInput('dollars', () => check());
    const ok = btn('Check', () => check(), 'go');
    const t0 = performance.now();
    const wrongs = [{ v: 50, id: 't.price.adds', mc: MC.adds }, { v: 12, id: 't.price.change', mc: MC.changeFinal }];
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type just the number of dollars, without the $ sign.')); return; }
      const w = wrongs.find(x => Math.abs(x.v - r.v) < 1e-6);
      const right = Math.abs(r.v - 48) < 1e-6;
      ctx.store.log({ part: 'turn', item: 'turn.price', prompt: SCRIPT['t.price']!, response: r, expected: 48, correct: right, mc: right ? undefined : w?.mc, ms: Math.round(performance.now() - t0) });
      if (!right) { fbHost.replaceChildren(fbk(false, w ? w.id : 't.price.miss')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.price.ok'));
      seq(async alive => {
        ts('t.T3:dim', 1, 0.5); ts('t.s1', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('t.T4', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.g1', 1, 0.6); ts('t.r2', 1, 1.0, 0.4); ts('t.v2', 1, 0.6, 1.3); await wait(1.9); if (!alive()) return;
        ts('t.ld4', 1, 0.9); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askNet();
      });
    }
    work.replaceChildren(say('t.price'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askNet(): void {
    ts('t.ld4', 0, 0.4); ts('t.T4:dim', 1, 0.5); ts('t.m50', 1, 0.6, 0.4);
    choiceStep('t.net', 'turn.net', [
      { t: 'No change: it is back to $50', ok: false, id: 't.net.adds', mc: MC.adds },
      { t: 'A 4% decrease', ok: true, id: 't.net.ok' },
      { t: 'A 96% decrease', ok: false, id: 't.net.pctof', mc: MC.pctOfAsChange },
    ], () => seq(async alive => {
      ts('t.ld4', 0, 0.4); ts('t.T4:dim', 1, 0.5); ts('t.T5', 1, 1.0); ts('t.l2', 1, 0.6, 0.6); await wait(1.2); if (!alive()) return;
      ts('t.T6', 1, 1.0); await wait(1.4); if (!alive()) return;
      step = 4; drawPlan(); given.replaceChildren();
      const cb = callback(); work.append(cb); cb.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick === null ? null : CARDS[commit().pick ?? 1]!;
    const lead = p ? `At the start you picked ${p.t} and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>${p.ok ? ': you were right. ' : `: ${p.t} was ${p.why}. `}` : '';
    c.innerHTML = lead + (SCRIPT['t.done'] ?? '');
    void ctx.say('t.done');
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Ava's claim about the order of a discount and a tax =====
function partProve(): void {
  tr.reset('p.');
  const A2: TapeRow = { lead: '$40', segs: [{ amt: 40, role: 'base', pct: '100%' }, { amt: 3.2, role: 'change', pct: '8%' }] };
  const B2: TapeRow = { lead: '$54', segs: [{ amt: 43.2, role: 'base', pct: '80%' }, { amt: 10.8, role: 'cut', pct: '20%' }] };
  const P = tape([
    { lead: 'A: $50', segs: [{ amt: 40, role: 'base', pct: '80%' }, { amt: 10, role: 'cut', pct: '20%' }] }, A2,
    { lead: 'B: $50', segs: [{ amt: 50, role: 'base', pct: '100%' }, { amt: 4, role: 'change', pct: '8%' }] }, B2,
  ], 54);
  // the opening state: both stores start from the whole $50 tape (same layout, so the rows change in place)
  const P0 = tape([
    { lead: 'A: $50', segs: [{ amt: 50, role: 'base', pct: '100%' }] }, A2,
    { lead: 'B: $50', segs: [{ amt: 50, role: 'base', pct: '100%' }] }, B2,
  ], 54);
  const J1 = line('p.J1', '\\text{Ava: A is } \\cssId{w}{\\text{cheaper}}', Y(70), 64, undefined, 'dim');
  const C1a = line('p.C1a', '\\text{A: } 50 \\times 0.8 \\times 1.08', Y(250), 72, TAGS);
  const C1b = line('p.C1b', '= \\cssId{s}{\\$43.20}', Y(350), 76, TAGS);
  const C2a = line('p.C2a', '\\text{B: } 50 \\times 1.08 \\times 0.8', Y(510), 72, TAGS);
  const C2b = line('p.C2b', '= \\cssId{s}{\\$43.20}', Y(610), 76, TAGS);
  const C3 = line('p.C3', '\\text{same total}', Y(800), 76, undefined, 'link');
  setTapes({
    pre: 'p.', after: P, before: P0, n: 4, lines: [J1, C1a, C1b, C2a, C2b, C3], leads: [],
    focus: () => ({
      guides: [{ at: 40, r0: 0, r1: 1, col: 'first', k: tr.k('p.g0') }, { at: 54, r0: 2, r1: 3, col: 'first', k: tr.k('p.g1') }],
      marks: [{ r: 1, at: 43.2, text: '$43.20', col: 'pick', k: tr.k('p.m1') }, { r: 3, at: 43.2, text: '$43.20', col: 'pick', k: tr.k('p.m3') }],
      hi: [lit('p.', 'h3', 1, 0, 'link'), lit('p.', 'h3', 1, 1, 'link'), lit('p.', 'h3', 3, 0, 'link')],
    }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J1, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.jump('p.s1', 1); tr.jump('p.s3', 1);
  ts('p.r0', 1, 1.0, 0.2); ts('p.l0', 1, 0.5, 1.0); ts('p.r2', 1, 1.0, 0.6); ts('p.l2', 1, 0.5, 1.4);
  ts('p.J1', 1, 0.9, 1.2);

  const CHIPS = [
    { t: '20% off leaves 80% of $50, and the 8% tax is 8% of that amount.', fits: 0 },
    { t: 'The tax makes it 108% of $50, and 20% off leaves 80% of that.', fits: 1 },
    { t: 'Multiplying by 0.8 and by 1.08 gives the same in either order.', fits: 2 },
    { t: '20% off and 8% tax make 12% off, in any order.', fits: -1, mc: MC.adds, id: 'p.chip.adds' },
    { t: 'Changing the order of two changes always changes the total.', fits: -1, mc: MC.order, id: 'p.chip.order' },
    { t: 'A $10 coupon and 20% off also give the same total in either order.', fits: -1, mc: MC.commutes, id: 'p.chip.coupon' },
  ];
  const CLAIMS = [
    `Store A charges $50 × 0.8 × 1.08 = <b class="s">$43.20</b>,`,
    `Store B charges $50 × 1.08 × 0.8 = <b class="s">$43.20</b>,`,
    `so both stores charge the same, and Ava is <b>wrong</b>,`,
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.filter(i => !used.has(i)).map(i => btn(CHIPS[i]!.t, () => place(i))));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain();
      const n = filled;
      fbHost.replaceChildren(say(`p.c${n}`));
      seq(async alive => {
        if (n === 1) {
          ts('p.s0', 1, 0.9); ts('p.g0', 1, 0.6, 1.1); ts('p.r1', 1, 1.0, 1.5); ts('p.l1', 1, 0.5, 2.3);
          ts('p.C1a', 1, 1.0, 0.6); await wait(2.6); if (!alive()) return;
          ts('p.m1', 1, 0.6); ts('p.C1b', 1, 0.8);
        }
        if (n === 2) {
          ts('p.C1a:dim', 1, 0.5); ts('p.C1b:dim', 1, 0.5);
          ts('p.s2', 1, 0.9); ts('p.g1', 1, 0.6, 1.1); ts('p.r3', 1, 1.0, 1.5); ts('p.l3', 1, 0.5, 2.3);
          ts('p.C2a', 1, 1.0, 0.6); await wait(2.6); if (!alive()) return;
          ts('p.m3', 1, 0.6); ts('p.C2b', 1, 0.8);
        }
        if (n === 3) {
          ts('p.C2a:dim', 1, 0.5); ts('p.C2b:dim', 1, 0.5); ts('p.C1b:dim', 0, 0.5);
          ts('p.h3', 1, 0.6); ts('p.C3', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
          ts('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          void ctx.say('p.done');
          fbHost.replaceChildren(feedback(true, SCRIPT['p.done']!), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fbk(false, ch.id ?? 'p.chip.other'));
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Ava is right', () => judge(true)), no = btn('Ava is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Ava: 20% off then 8% tax is cheaper than 8% tax then 20% off. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.order : undefined });
    proofHost.replaceChildren(say(right ? 'p.build.yes' : 'p.build.no'), chain, fbHost, chipBox);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as PaItem),
  });
}
/** a board line that fits the board: shrinks below the usual 60 px only as a last resort (and says so) */
function fitLine(key: string, src: string, y: number, size: number): Line {
  const L = line(key, src, y, size, TAGS);
  if (texWidth(L.F, L.size) > BOARD_W) {
    let s = L.size;
    while (s > 44 && texWidth(L.F, s) > BOARD_W) s -= 2;
    if (texWidth(L.F, s) > BOARD_W) console.warn(`percent-applications: board line too wide: ${src}`);
    L.size = s;
  }
  return L;
}
function showItem(item: PaItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const P = item.picture;
  const T = fitLine('x.T', item.board, Y(120), item.board.includes('array') ? 60 : 80);
  const tb = texBox(T.F, T.x, T.y, { size: T.size, align: 'left' });
  if (item.board.includes('array')) T.y += Y(40) - tb.y0;
  const top = item.board.includes('array') ? tb.y1 + (Y(40) - tb.y0) : tb.y1;
  if (P) {
    const r = tryBlock(() => PercentTape({ rows: P.rows, max: P.max }, TF));
    if (r.ok) {
      const b = r.value, n = P.rows.length;
      const W = item.work ? fitLine('x.W', item.work, Math.min(BOARD.y1 - 90, top + 140), 72) : null;
      const lines = W ? [T, W] : [T];
      const leads: Lead[] = W && P.ask?.slot === 'end' && W.F.tags.includes('s') ? [{ key: 'x.ld', from: () => partOf(W, 's'), to: () => b.where.end(P.ask!.r), col: 'link', drop: 26 }] : [];
      setScene({
        table: 1080, lines, leads,
        model: c => b.draw(c, k => tr.k('x.' + k), {
          ask: P.ask ? { ...P.ask, k: tr.k('x.ask') } : undefined,
          hi: (P.hi ?? []).map(x => ({ ...x, k: tr.k('x.hi') })),
          guides: (P.guides ?? []).map(g => ({ ...g, col: 'first', k: tr.k('x.g') })),
          marks: (P.marks ?? []).map(m => ({ ...m, k: tr.k('x.m') })),
        }),
      });
      for (let i = 0; i < n; i++) { ts(`x.r${i}`, 1, 0.7, 0.15 + 0.45 * i); ts(`x.l${i}`, 1, 0.4, 0.6 + 0.45 * i); ts(`x.e${i}`, 1, 0.4, 0.7 + 0.45 * i); }
      ts('x.g', 1, 0.5, 0.45 * n); ts('x.T', 1, 0.8, 0.3);
      return {
        solve: async alive => {
          ts('x.hi', 1, 0.5);
          if (W) { ts('x.T:dim', 1, 0.5); ts('x.W', 1, 1.0); await wait(1.0); if (!alive()) return; }
          ts('x.ask', 1, 0.6); ts('x.m', 1, 0.6);
          if (leads.length) ts('x.ld', 1, 0.9, 0.3);
        },
      };
    }
    console.warn(`percent-applications: no picture for ${item.id}: ${r.error}`);
  }
  // bare notation: the board line big on a wide slate, the worked line under it after a miss
  const big = box(300, 230, 1620, 700);
  const lines = [bigLine('x.T', item.board, big, 120)];
  if (item.work) lines.push(bigLine('x.W', item.work, box(300, 760, 1620, 960), 96));
  for (const L of lines) for (const t of Object.keys(TAGS)) if (L.F.tags.includes(t as never)) L.tags = TAGS;
  setScene({ table: 1080, lines, leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return { solve: async () => { if (item.work) ts('x.W', 1, 1.0); } };
}

void runLesson({
  slug: SLUG,
  warm: ['\\$80\\ \\text{jacket}', '64 \\times 0.9 = 57.60', '\\text{Ava: A is cheaper}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
