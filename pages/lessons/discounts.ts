// discounts.ts: "Calculate a discount" (grade 7, 7.RP.A.3) on the shared lesson runtime.
//   1 The question   $80 headphones, 15% off: what do you pay? 3 cards ($68; $65 = the percent taken as dollars;
//                    $12 = the discount reported as the price) + how sure
//   2 Worked example the price tag, then the same price as a 100% bar (concreteness fading); four subgoal steps:
//                    Name the whole, Find the discount (10% + 5%), Subtract it, Check with the percent you pay;
//                    one "why do both ways agree?"
//   3 Your turn      a $45.00 hoodie, 35% off, faded from the end: the whole and the discount are given, the kid
//                    subtracts across the zeros, picks the one-step check, and judges "more or less than half price?"
//   4 Prove it       Riley: 70% off $50 is $35. A because-chain: you pay 30%, that is under half ($25), so it is $15
//                    and Riley's $35 is the discount (distractors = catalogue misconceptions)
//   5 Practice       all 13 sub-goals one after another, then mixed (runtime/practice.ts)
// Board: money equations ($45.00 - $15.75 = $29.25) do not fit the runtime board at >= 60 px, so this page lays out
// its own: the model in an 860 px frame, a wider slate from x = 1000, its own board lines and leader lines (local
// helpers below; the runtime is unchanged).
// Voiced lines: src/lesson/topics/discounts/script.ts (panel HTML) = pages/lessons/discounts/voice/lines.json.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { leader } from '../../src/lesson/annotate';
import { bigLine, bump, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { PriceBar, type PriceBarBlock, type PriceBarFocus, type PriceBarParams, type PriceBarStep } from '../../src/lesson/topics/discounts/PriceBar';
import { type DiscPicture, FAMILY_NAMES, GENS } from '../../src/lesson/topics/discounts/items';
import { PLAN } from '../../src/lesson/topics/discounts/plan';
import { SCRIPT } from '../../src/lesson/topics/discounts/script';

const SLUG = 'discounts';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** the narrator: one line at a time; a chained line only plays if nothing newer was said in between */
let sayTok = 0;
const say = (id: string): Promise<void> => { sayTok++; return ctx.say(id); };
function sayThen(a: string, b: string): void { const t = ++sayTok; void ctx.say(a).then(() => { if (t === sayTok) void say(b); }); }
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function vline(id: string, cls = '', speak = true): HTMLElement { if (speak) void say(id); return html('p', cls, SCRIPT[id] ?? id); }
const fbv = (ok: boolean, id: string, extra: Kid[] = []) => { void say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
function log(part: 'question' | 'example' | 'turn' | 'prove', item: string, prompt: string, response: unknown, expected: unknown, correct: boolean | null, mc?: string, sure?: number): void {
  ctx.store.log({ part, item, prompt, response, expected, correct, mc, sure });
}

// ---------- this page's layout: model frame, a wider board, board lines and leaders ----------
const MFD = frame(60, 70, 860, 940);
const BD = box(1000, 70, 1860, 1010), BLX = BD.x0 + 50, BW = BD.w - 100;
const TG = { o: { col: 'first' }, d: { col: 'second' }, s: { col: 'link' }, p: { col: 'pick' }, w: { col: 'ink' } } as const;
/** a board line on this page's slate (shrinks to fit, never below 60 px) */
function bline(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  return { key, F, x: BLX, y, size: s, tags, col };
}
interface Lead2 { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
interface Model { pre: string; m: PriceBarBlock | (() => PriceBarBlock); focus?: () => PriceBarFocus }
interface BarScene { models: Model[]; lines: Line[]; leads: Lead2[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setBars(S: BarScene): void {
  setScene({
    table: 1040,
    model: c => {
      for (const M of S.models) {
        const m = typeof M.m === 'function' ? M.m() : M.m;
        m.draw(c, progressOf(s => tr.k(M.pre + s)), { ...(M.focus?.() ?? {}), pOrig: tr.k(M.pre + 'pO'), pDisc: tr.k(M.pre + 'pD'), pSale: tr.k(M.pre + 'pS'), pTag: tr.k(M.pre + 'pT') });
      }
    },
    lines: S.lines, leads: [], boardBox: S.boardBox === undefined ? BD : S.boardBox,
    extra: c => {
      for (const d of S.leads) {
        const k = tr.k(d.key);
        if (k > 0) leader(c, d.from(), d.to(), { col: d.col, k, boardX: BD.x0, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') });
      }
      S.extra?.(c);
    },
  });
}
const jump = (pre: string, steps: readonly string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
/** a money answer box ($ before it), lenient: "$12.50", "12.5", "1,234" */
function moneyInput(onEnter: () => void): { node: HTMLElement; read(): number | null; focus(): void } {
  const i = h('input', { inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'amount in dollars' });
  i.addEventListener('keydown', e => { if (e.key === 'Enter') onEnter(); });
  return {
    node: h('div', { class: 'ans' }, h('span', { class: 'money' }, '$'), i),
    read() { const t = i.value.replace(/[$,\s]/g, ''); if (t === '') return null; const v = Number(t); return Number.isFinite(v) ? v : NaN; },
    focus: () => i.focus(),
  };
}
function plan(steps: { t: string; why: string }[]): { node: HTMLOListElement; draw(step: number, act?: { label: string; on: () => void }): void } {
  const node = h('ol', { class: 'plan' });
  return {
    node,
    draw(step, act) {
      node.replaceChildren(...steps.map((s, i) => {
        const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
        if (i === step && act) (li.lastChild as HTMLElement).append(btn(act.label, act.on, 'go'));
        return li;
      }));
    },
  };
}
function optionList(opts: { t: string; ok: boolean; id: string; mc?: string }[], onPick: (o: typeof opts[number], box: HTMLElement) => void): HTMLElement {
  const box2 = h('div', { class: 'opts' });
  opts.forEach(o => box2.append(btn(o.t, () => {
    box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
    [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
    onPick(o, box2);
  })));
  return box2;
}

const HEADPHONES: PriceBarParams = { price: 8000, pct: 15, item: 'Headphones', ticks: 10 };
const CARDS = [
  { v: 65, id: 'mc.percent.adds-or-subtracts-percent-numeral', cb: 't.cb-65' },
  { v: 68, id: '', cb: 't.cb-right' },
  { v: 12, id: 'mc.percent.change-reported-as-final-amount', cb: 't.cb-12' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = PriceBar(HEADPHONES, MFD, th);
  const top = BD.y0 + 130;
  const T = bline('q.T', '\\cssId{d}{15\\%\\ \\text{off}}\\ \\ \\cssId{o}{\\$80}', top, 92, TG);
  const Q = bline('q.Q', '\\text{you pay}\\ \\ \\$\\,?', top + 170, 92);
  setBars({ models: [{ pre: 'q.', m }], lines: [T, Q], leads: [], boardBox: box(BD.x0, BD.y0, BD.x1, top + 290) });
  tr.set('q.tag', 1, 0.8); tr.set('q.bar', 1, 1.2, 0.7); tr.set('q.whole', 1, 0.8, 1.7);
  tr.set('q.T', 1, 0.9, 1.0); tr.set('q.Q', 1, 0.9, 1.7);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    log('question', 'question.commit', 'Headphones cost $80, 15% off: what do you pay?', p.v, 68, p.v === 68, p.id || undefined, commit().sure ?? undefined);
    go(1);
  }, 'go');
  let asked = false;
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => {
    const b = h('button'); b.innerHTML = `<b>$${cd.v}</b><small>you pay</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); if (!asked) { asked = true; void say('q.sure'); } });
    cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Fifteen percent off'),
    vline('q.intro', '', false), vline('q.ask', '', false),
    cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn),
  );
  sayThen('q.intro', 'q.ask');
}

// ===== 2. Worked example: $80, 15% off =====
function partExample(): void {
  tr.reset('e.');
  const m = PriceBar(HEADPHONES, MFD, th), W = m.where;
  const yT = BD.y0 + 110;
  const y1 = W.origLabel.cy, y2 = Math.max(y1 + 124, W.whole.cy), y3 = Math.max(y2 + 124, W.discPct.cy), y4 = Math.max(y3 + 124, W.discAmt.cy), y5 = y4 + 124;
  const T = bline('e.T', '\\cssId{d}{15\\%\\ \\text{off}}\\ \\ \\cssId{o}{\\$80} \\;\\to\\; \\$\\,?', yT, 84, TG);
  const H = bline('e.H', '\\cssId{d}{15\\%\\ \\text{off}}\\ \\ \\cssId{o}{\\$80} \\;\\to\\; \\cssId{s}{\\$68}', yT, 84, TG);
  const L1 = bline('e.L1', '\\cssId{o}{\\$80} = 100\\%', y1, 76, TG);
  const L2a = bline('e.L2a', '10\\% \\to \\$8, \\quad 5\\% \\to \\$4', y2, 72, TG);
  const L2 = bline('e.L2', '15\\% \\to \\cssId{d}{\\$12}', y3, 76, TG);
  const L3 = bline('e.L3', '\\cssId{o}{\\$80} - \\cssId{d}{\\$12} = \\cssId{s}{\\$68}', y4, 76, TG);
  const L5 = bline('e.L5', '\\cssId{p}{0.85} \\times \\cssId{o}{\\$80} = \\cssId{s}{\\$68}', y5, 76, TG);
  const leads: Lead2[] = [{ key: 'e.ld2', from: () => partOf(L2, 'd'), to: () => W.discAmt, col: 'second' }];
  setBars({
    models: [{ pre: 'e.', m, focus: () => { const k = tr.k('e.f2'); return k > 0 ? { parts: ['disc'], k, col: 'pick' } : {}; } }],
    lines: [T, H, L1, L2a, L2, L3, L5], leads,
  });
  jump('e.', ['tag', 'bar', 'whole', 'T']);   // where part 1 left the picture

  const STEPS = [
    { t: 'Name the whole', why: 'The original price is 100%.', act: 'Show the whole' },
    { t: 'Find the discount', why: '15% = 10% + 5%.', act: 'Find it' },
    { t: 'Subtract it', why: 'Original − discount = sale price.', act: 'Subtract' },
    { t: 'Check with the percent you pay', why: '100% − 15% = 85% of the same bar.', act: 'Check it' },
  ];
  const P = plan(STEPS), sayBox = h('div'), after = h('div');
  let step = 0;
  const draw = () => P.draw(step, step < 4 ? { label: STEPS[step]!.act, on: () => run(step) } : undefined);
  function run(i: number): void {
    step = i + 1; draw(); sayBox.replaceChildren();
    void say(`e.s${i + 1}`);
    seq(async alive => {
      if (i === 0) {
        tr.jump('e.whole', 0);
        tr.set('e.whole', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); void bump('e.pO', alive); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.ticks', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.L2a', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.cut', 1, 0.8); tr.set('e.disc', 1, 1.0, 0.6); await wait(1.7); if (!alive()) return;
        tr.set('e.f2', 1, 0.5); tr.set('e.L2a:dim', 1, 0.5); tr.set('e.L2', 1, 0.9); tr.set('e.ld2', 1, 0.9, 0.7); await wait(1.7);
      } else if (i === 2) {
        tr.set('e.f2', 0, 0.4); tr.set('e.ld2', 0, 0.4); tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.sale', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); void bump('e.pS', alive); await wait(1.2); if (!alive()) return;
        tr.set('e.tagSale', 1, 1.2); await wait(1.3);
      } else {
        tr.set('e.L3:dim', 1, 0.5);
        tr.set('e.paid', 1, 0.8); void bump('e.pS', alive); await wait(0.9); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.T', 0, 0.5); tr.set('e.H', 1, 1.0, 0.3); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(vline(`e.s${i + 1}`, '', false));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The $12 off and the $68 you pay are two parts of the same $80 bar.', ok: true, id: 'e.w-ok' },
      { t: 'It is luck: with other prices the two ways can disagree.', ok: false, id: 'e.w-luck', mc: 'mc.reasoning-language.methods-can-disagree' },
      { t: 'Taking 15% off is the same as taking $15 off.', ok: false, id: 'e.w-15', mc: 'mc.percent.adds-or-subtracts-percent-numeral' },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, o => {
      fbHost.replaceChildren(fbv(o.ok, o.id));
      log('example', 'example.why', 'Why do both ways give $68?', o.t, opts[0]!.t, o.ok, o.mc);
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box2, fbHost);
    sayThen('e.s4', 'e.why');
  }
  draw();
  setPanel(h('h2', {}, 'Watch it worked out'), vline('e.intro', 'dim'), P.node, sayBox, after);
}

// ===== 3. Your turn: a $45.00 hoodie, 35% off =====
function partTurn(): void {
  tr.reset('t.');
  const m = PriceBar({ price: 4500, pct: 35, item: 'Hoodie', cents: true, ticks: 10 }, MFD, th), W = m.where;
  const yT = BD.y0 + 110;
  const y1 = W.origLabel.cy, y2 = Math.max(y1 + 124, W.whole.cy), y3 = Math.max(y2 + 124, W.discPct.cy), y4 = Math.max(y3 + 124, W.discAmt.cy), y5 = y4 + 124;
  const T = bline('t.T', '\\cssId{d}{35\\%\\ \\text{off}}\\ \\ \\cssId{o}{\\$45.00} \\;\\to\\; \\$\\,?', yT, 84, TG);
  const H = bline('t.H', '\\cssId{d}{35\\%\\ \\text{off}}\\ \\ \\cssId{o}{\\$45.00} \\;\\to\\; \\cssId{s}{\\$29.25}', yT, 84, TG);
  const L1 = bline('t.L1', '\\cssId{o}{\\$45.00} = 100\\%', y1, 76, TG);
  const L6 = bline('t.L6', '\\text{half} = \\cssId{p}{\\$22.50}', y2, 72, TG);
  const L2 = bline('t.L2', '0.35 \\times \\$45.00 = \\cssId{d}{\\$15.75}', y3, 76, TG);
  const L3 = bline('t.L3', '\\cssId{o}{\\$45.00} - \\cssId{d}{\\$15.75} = \\cssId{s}{\\$29.25}', y4, 76, TG);
  const L4 = bline('t.L4', '\\cssId{p}{0.65} \\times \\cssId{o}{\\$45.00} = \\cssId{s}{\\$29.25}', y5, 76, TG);
  const leads: Lead2[] = [{ key: 't.ld2', from: () => partOf(L2, 'd'), to: () => W.discAmt, col: 'second' }];
  setBars({
    models: [{ pre: 't.', m, focus: () => { const k = tr.k('t.fs'); return k > 0 ? { parts: ['sale'], k, col: 'pick' } : {}; } }],
    lines: [T, H, L1, L6, L2, L3, L4], leads,
  });

  const STEPS = [
    { t: 'Name the whole', why: 'Done for you.' },
    { t: 'Find the discount', why: 'Done for you.' },
    { t: 'Subtract it', why: 'Your step.' },
    { t: 'Check with the percent you pay', why: 'Your step.' },
  ];
  const P = plan(STEPS), work = h('div');
  let step = 0;
  P.draw(step);
  setPanel(h('h2', {}, 'Thirty-five percent off'), vline('t.intro'), P.node, work);

  seq(async alive => {
    tr.set('t.tag', 1, 0.8); tr.set('t.T', 1, 0.9, 0.4); await wait(1.4); if (!alive()) return;
    tr.set('t.bar', 1, 1.1); tr.set('t.whole', 1, 0.9, 1.0); await wait(2.0); if (!alive()) return;
    tr.set('t.L1', 1, 0.9); void bump('t.pO', alive); await wait(1.2); if (!alive()) return;
    step = 1; P.draw(step); tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.ticks', 1, 0.9); tr.set('t.cut', 1, 0.8, 0.6); tr.set('t.disc', 1, 1.0, 1.1); await wait(2.2); if (!alive()) return;
    tr.set('t.L2', 1, 1.0); tr.set('t.ld2', 1, 0.9, 0.8); await wait(1.9); if (!alive()) return;
    step = 2; P.draw(step);
    askSub();
  });

  function askSub(): void {
    const fbHost = h('div');
    const inp = moneyInput(() => submit());
    const ok = btn('Check', () => submit(), 'go');
    let wrongs = 0;
    function submit(): void {
      const v = inp.read();
      if (v === null || Number.isNaN(v)) { fbHost.replaceChildren(feedback(false, 'Type an amount, like 12.50.')); return; }
      const c = Math.round(v * 100);
      const right = c === 2925;
      const id = right ? 't.s-ok' : c === 1575 ? 't.s-disc' : c === 1000 ? 't.s-pct' : c === 6075 ? 't.s-add' : [3025, 2935, 3035, 2975, 3075, 2825].includes(c) ? 't.s-zero' : 't.s-other';
      const mc = { 't.s-disc': 'mc.percent.change-reported-as-final-amount', 't.s-pct': 'mc.percent.adds-or-subtracts-percent-numeral', 't.s-add': 'mc.percent.wrong-direction-of-change' }[id as 't.s-disc'];
      log('turn', 'turn.subtract', '$45.00, 35% off, discount $15.75: what is the sale price?', v, 29.25, right, mc);
      fbHost.replaceChildren(fbv(right, id));
      if (!right) { if (++wrongs >= 2) fbHost.append(html('p', 'dim', 'Line up the decimal points: 45.00 − 15.75.')); return; }
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ld2', 0, 0.4); tr.set('t.L2:dim', 1, 0.5);
        tr.set('t.sale', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.L3', 1, 1.0); void bump('t.pS', alive); await wait(1.2); if (!alive()) return;
        tr.set('t.tagSale', 1, 1.2); await wait(1.4); if (!alive()) return;
        step = 3; P.draw(step); askCheck();
      });
    }
    work.replaceChildren(vline('t.disc', '', false), vline('t.sub'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const opts = [
      { t: '0.65 × $45.00', ok: true, id: 't.c-ok' },
      { t: '0.35 × $45.00', ok: false, id: 't.c-disc', mc: 'mc.percent.change-reported-as-final-amount' },
      { t: '0.65 × $15.75', ok: false, id: 't.c-base', mc: 'mc.fraction-ops.uses-nonreference-quantity-as-whole' },
      { t: '0.65 × $45.00 − $15.75', ok: false, id: 't.c-twice', mc: 'mc.percent.double-subtracts-discount' },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, (o, bx) => {
      log('turn', 'turn.check', 'Which one calculation gives the sale price of $45.00 at 35% off?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.L3:dim', 1, 0.5);
        tr.set('t.paid', 1, 0.8); tr.set('t.fs', 1, 0.5); await wait(0.9); if (!alive()) return;
        tr.set('t.L4', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.fs', 0, 0.5); tr.set('t.T', 0, 0.5); tr.set('t.H', 1, 1.0, 0.3); await wait(1.5); if (!alive()) return;
        step = 4; P.draw(step); askHalf();
      });
    });
    work.replaceChildren(vline('t.check'), box2, fbHost);
  }
  function askHalf(): void {
    const fbHost = h('div');
    const more = btn('More than half', () => answer(true)), less = btn('Less than half', () => answer(false));
    function answer(isMore: boolean): void {
      more.disabled = less.disabled = true;
      log('turn', 'turn.half', 'Is $29.25 (35% off $45.00) more or less than half of $45.00?', isMore ? 'more' : 'less', 'more', isMore);
      fbHost.replaceChildren(fbv(isMore, isMore ? 't.h-ok' : 't.h-no'));
      seq(async alive => {
        tr.set('t.L4:dim', 1, 0.5);
        tr.set('t.half', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.L6', 1, 0.9); await wait(2.4); if (!alive()) return;
        fbHost.append(callback());
      });
    }
    work.replaceChildren(vline('t.half'), h('div', { class: 'row' }, more, less), fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const id = commit().pick === null ? 't.cb-none' : CARDS[commit().pick!]!.cb;
    c.append(vline(id));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley says 70% off a $50 jacket is $35 =====
function partProve(): void {
  tr.reset('p.');
  const base: PriceBarParams = { price: 5000, pct: 70, item: 'Jacket', ticks: 10 };
  const m0 = PriceBar({ ...base, hide: { disc: true, sale: true }, tagHide: true }, MFD, th);
  const m1 = PriceBar(base, MFD, th), W = m1.where;
  let solved = false;
  const yJ = BD.y0 + 110;
  const y1 = Math.max(yJ + 200, m0.where.origLabel.cy), y2 = Math.max(y1 + 124, W.whole.cy), y3 = Math.max(y2 + 124, W.discPct.cy), y4 = Math.max(y3 + 124, W.discAmt.cy);
  const J = bline('p.J', '\\text{Riley:}\\ \\ 70\\%\\ \\text{off}\\ \\cssId{o}{\\$50} \\;\\to\\; \\cssId{w}{\\$35}', yJ, 80, TG);
  const C1 = bline('p.C1', '100\\% - 70\\% = \\cssId{s}{30\\%}', y1, 76, TG);
  const C2 = bline('p.C2', '30\\% < 50\\% \\;\\to\\; \\text{under}\\ \\cssId{p}{\\$25}', y2, 72, TG);
  const C3 = bline('p.C3', '0.3 \\times \\cssId{o}{\\$50} = \\cssId{s}{\\$15}', y3, 76, TG);
  const HH = bline('p.H', '\\cssId{d}{\\$35} + \\cssId{s}{\\$15} = \\cssId{o}{\\$50}', y4, 76, TG);
  const leads: Lead2[] = [{ key: 'p.ldD', from: () => partOf(HH, 'd'), to: () => W.discAmt, col: 'second' }];
  setBars({
    models: [{ pre: 'p.', m: () => (solved ? m1 : m0), focus: () => { const k = tr.k('p.fs'); return k > 0 ? { parts: ['sale'], k, col: 'pick' } : {}; } }],
    lines: [J, C1, C2, C3, HH], leads,
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.tag', 1, 0.8); tr.set('p.bar', 1, 1.1, 0.5); tr.set('p.whole', 1, 0.8, 1.4); tr.set('p.ticks', 1, 0.8, 1.8);
  tr.set('p.cut', 1, 0.7, 2.3); tr.set('p.disc', 1, 0.8, 2.8); tr.set('p.sale', 1, 0.8, 3.2); tr.set('p.J', 1, 1.0, 1.0);

  const CHIPS = [
    { t: '70% off leaves 100% − 70% = 30% of the bar.', fits: 0 },
    { t: '30% is less than half of the bar, and half of $50 is $25.', fits: 1 },
    { t: '$35 + $15 = $50: the two parts make the whole price.', fits: 2 },
    { t: '$35 is less than $50, so it is a fair sale price.', fits: -1, id: 'p.x-bound', mc: 'mc.estimation.one-sided-bound-check' },
    { t: 'The smaller amount is always the discount.', fits: -1, id: 'p.x-small', mc: 'mc.percent.smaller-amount-always-discount' },
    { t: 'Two ways can give two different right answers.', fits: -1, id: 'p.x-disagree', mc: 'mc.reasoning-language.methods-can-disagree' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${CHIPS.find(c => c.fits === i)!.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3 || used.has(i)) return;
    const claimText = (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, '');
    log('prove', `prove.claim${filled + 1}`, claimText, ch.t, CHIPS.find(c => c.fits === filled)!.t, ch.fits === filled, ch.mc);
    if (ch.fits !== filled) { fbHost.replaceChildren(fbv(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    void say(`p.c${n}`);
    seq(async alive => {
      if (n === 1) {
        tr.set('p.paid', 1, 0.8); void bump('p.pS', alive); await wait(0.6); if (!alive()) return;
        tr.set('p.C1', 1, 1.0);
      } else if (n === 2) {
        tr.set('p.C1:dim', 1, 0.5);
        tr.set('p.half', 1, 1.0); tr.set('p.fs', 1, 0.6, 0.6); await wait(1.2); if (!alive()) return;
        tr.set('p.C2', 1, 1.0); await wait(1.6); if (!alive()) return; tr.set('p.fs', 0, 0.6);
      } else {
        tr.set('p.C2:dim', 1, 0.5);
        solved = true;
        void bump('p.pS', alive); tr.set('p.C3', 1, 1.0, 0.2); await wait(1.4); if (!alive()) return;
        void bump('p.pD', alive); tr.set('p.H', 1, 1.0); tr.set('p.ldD', 1, 0.9, 0.9); await wait(2.0); if (!alive()) return;
        tr.set('p.tagSale', 1, 1.2); tr.set('p.strike', 1, 0.6, 0.4); await wait(1.6); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    log('prove', 'prove.judge', 'Riley: 70% off a $50 jacket is $35. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? 'mc.estimation.one-sided-bound-check' : undefined);
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(vline(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), vline('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed), show: showItem,
  });
}
const PULSE_KEY = { orig: 'pO', disc: 'pD', sale: 'pS', tag: 'pT' } as const;
function unhide(p: PriceBarParams): PriceBarParams { const { hide: _h, tagHide: _t, ...rest } = p; return rest; }
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  // money needs a decimal point on phone keyboards (the runtime's boxes are numeric)
  setTimeout(() => ctx.panel.querySelectorAll<HTMLInputElement>('.ans input').forEach(i => { i.inputMode = 'decimal'; }), 0);
  const P = item.picture as DiscPicture | undefined;
  const big = box(240, 280, 1680, 760);
  const bare = () => { setBars({ models: [], lines: [bigLine('x.B', item.board, big)], leads: [], boardBox: big }); tr.set('x.B', 1, 0.8, 0.1); };
  if (!P) { bare(); return {}; }
  const mb = tryBlock(() => PriceBar(P.bar, MFD, th)), ms = tryBlock(() => PriceBar(P.solved ?? unhide(P.bar), MFD, th));
  if (!mb.ok || !ms.ok) { console.warn('discounts: model not drawn', item.id, mb.ok ? '' : mb.error, ms.ok ? '' : ms.error); bare(); return {}; }
  const T = bline('x.T', item.board, BD.y0 + 110, 80, TG);
  const Wl = P.work.map((s, i) => bline(`x.w${i}`, s, BD.y0 + 290 + i * 130, 76, TG));
  let solved = false;
  const scene = () => setBars({ models: [{ pre: 'x.', m: () => (solved ? ms.value : mb.value) }], lines: [T, ...Wl], leads: [] });
  if (P.pre.length) {
    scene();
    P.pre.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.1 + i * 0.22));
    tr.set('x.T', 1, 0.8, 0.3);
  } else bare();
  return {
    solve: async alive => {
      solved = true; scene();
      if (!P.pre.length) tr.jump('x.T', 1);
      for (const s of P.pre) tr.jump('x.' + s, 1);
      tr.set('x.T:dim', 1, 0.5);
      for (const s of P.post as PriceBarStep[]) { tr.set('x.' + s, 1, 0.8); await wait(0.35); if (!alive()) return; }
      for (const p of P.pulse) void bump('x.' + PULSE_KEY[p], alive);
      for (let i = 0; i < Wl.length; i++) {
        if (i > 0) tr.set(`x.w${i - 1}:dim`, 1, 0.5);
        tr.set(`x.w${i}`, 1, 0.9); await wait(1.0); if (!alive()) return;
      }
    },
  };
}

void runLesson({
  slug: SLUG,
  // every glyph the board can use must be loaded before a line is built (a line keeps the formula it was built from)
  warm: ['\\$80 = 100\\%', '15\\%\\ \\text{off} \\;\\to\\; \\$\\,?', '\\text{you pay}', '\\text{Riley:}\\ \\text{under}\\ \\text{half}',
    '30\\% < 50\\% \\;\\to\\; \\text{under}\\ \\$25 > 1{,}000', '0.65 \\times \\$45.00 - \\$15.75 + 7 \\approx \\square \\quad \\div \\overset{?}{=} \\tfrac{1}{4}\\ \\text{of the bar}',
    'P - 0.15P = (1 - 0.15)P \\quad \\text{or} \\quad \\text{the discount} = \\ ? \\quad \\text{half?}: \\text{Sam:}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
