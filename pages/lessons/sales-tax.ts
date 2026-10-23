// sales-tax.ts: "Calculate sales tax, totals, and pre-tax prices" (grade 7, 7.RP.A.3) on the shared lesson runtime.
//   1 The question   $60 sneakers, 8% sales tax: what do you pay? 3 cards ($64.80; $68 = the percent taken as dollars;
//                    $4.80 = the tax reported as the total) + how sure
//   2 Worked example the receipt, then the same price as a 100% tape (concreteness fading); four subgoal steps:
//                    Name the whole, Find the tax (1% route; the tax sticks out), Add it (the total), One step (1.08);
//                    one "why does 1.08 x $60 give the total?"
//   3 Your turn      a $40 board game at 7.5%, faded from the end: the whole and the tax are given, the kid adds,
//                    picks the one-step multiplier, and checks the tax between the 5% and 10% benchmarks
//   4 Prove it       Ana takes 8% of an $81 total off to find the price. A because-chain: the total is 108% / so
//                    $81 / 1.08 = $75 / Ana's 8% is of a bigger whole (the rebase tape's cells drift); distractors
//                    are catalogue misconceptions
//   5 Practice       all 19 sub-goals one after another, then mixed (runtime/practice.ts)
// Board: money lines do not fit the runtime board at >= 60 px, so this page lays out its own (as discounts does): the
// model in an 860 px frame, a wider slate from x = 1000, its own board lines and leaders (runtime unchanged).
// Voiced lines: src/lesson/topics/sales-tax/script.ts (panel HTML) = pages/lessons/sales-tax/voice/lines.json.
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
import { TaxTape, type TaxTapeBlock, type TaxTapeFocus, type TaxTapeParams, type TaxTapeStep } from '../../src/lesson/topics/sales-tax/TaxTape';
import { type TaxPicture, FAMILY_NAMES, GENERATORS, MC } from '../../src/lesson/topics/sales-tax/items';
import { explain } from '../../src/lesson/topics/sales-tax/explain';
import { PLAN } from '../../src/lesson/topics/sales-tax/plan';
import { SCRIPT } from '../../src/lesson/topics/sales-tax/script';

const SLUG = 'sales-tax';
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
/** work lines that do not fit the slate at 60 px are split before their last "≈" or "=" (the next line starts with it) */
function fitWork(srcs: readonly string[]): string[] {
  const out: string[] = [];
  for (const s of srcs) {
    if (texWidth(tex(s) as Formula, 60) <= BW) { out.push(s); continue; }
    const i = Math.max(s.lastIndexOf(' \\approx '), s.lastIndexOf(' = '));
    if (i > 0) out.push(s.slice(0, i), s.slice(i).trim()); else out.push(s);
  }
  return out;
}
interface Lead2 { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
interface Model { pre: string; m: TaxTapeBlock | (() => TaxTapeBlock); focus?: () => TaxTapeFocus }
interface TapeScene { models: Model[]; lines: Line[]; leads: Lead2[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setTapes(S: TapeScene): void {
  setScene({
    table: 1040,
    model: c => {
      for (const M of S.models) {
        const m = typeof M.m === 'function' ? M.m() : M.m;
        m.draw(c, progressOf(s => tr.k(M.pre + s)), { ...(M.focus?.() ?? {}), pPrice: tr.k(M.pre + 'pP'), pTax: tr.k(M.pre + 'pX'), pTotal: tr.k(M.pre + 'pT') });
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

const SNEAKERS: TaxTapeParams = { price: 6000, rate: 8000, item: 'Sneakers' };
const CARDS = [
  { v: '68.00', c: 6800, id: MC.numeral, cb: 't.cb-68' },
  { v: '64.80', c: 6480, id: '', cb: 't.cb-right' },
  { v: '4.80', c: 480, id: MC.changeFinal, cb: 't.cb-480' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = TaxTape({ ...SNEAKERS, hide: { tax: true, total: true } }, MFD, th);
  const top = BD.y0 + 130;
  const T = bline('q.T', '\\cssId{o}{\\$60} + \\cssId{d}{8\\%\\ \\text{tax}}', top, 92, TG);
  const Q = bline('q.Q', '\\text{you pay}\\ \\ \\$\\,?', top + 170, 92);
  setTapes({ models: [{ pre: 'q.', m }], lines: [T, Q], leads: [], boardBox: box(BD.x0, BD.y0, BD.x1, top + 290) });
  tr.set('q.receipt', 1, 0.8); tr.set('q.rPrice', 1, 0.8, 0.5); tr.set('q.tape', 1, 1.2, 1.0); tr.set('q.whole', 1, 0.8, 1.9);
  tr.set('q.T', 1, 0.9, 1.0); tr.set('q.Q', 1, 0.9, 1.7);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    log('question', 'question.commit', 'Sneakers are marked $60 with 8% sales tax: what do you pay?', p.c / 100, 64.8, p.c === 6480, p.id || undefined, commit().sure ?? undefined);
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
    h('h2', {}, 'Eight percent tax'),
    vline('q.intro', '', false), vline('q.ask', '', false),
    cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn),
  );
  sayThen('q.intro', 'q.ask');
}

// ===== 2. Worked example: $60, 8% tax =====
function partExample(): void {
  tr.reset('e.');
  const m = TaxTape(SNEAKERS, MFD, th), W = m.where;
  const yT = BD.y0 + 100, Y = (i: number) => BD.y0 + 250 + i * 118;
  const T = bline('e.T', '\\cssId{o}{\\$60} + \\cssId{d}{8\\%\\ \\text{tax}} \\;\\to\\; \\$\\,?', yT, 84, TG);
  const H = bline('e.H', '\\cssId{o}{\\$60} + \\cssId{d}{8\\%\\ \\text{tax}} \\;\\to\\; \\cssId{s}{\\$64.80}', yT, 84, TG);
  const L1 = bline('e.L1', '\\cssId{o}{\\$60} = 100\\%', Y(0), 76, TG);
  const L2a = bline('e.L2a', '1\\% \\to \\$0.60', Y(1), 72, TG);
  const L2 = bline('e.L2', '8\\% \\to 8 \\times \\$0.60 = \\cssId{d}{\\$4.80}', Y(2), 76, TG);
  const L3 = bline('e.L3', '\\cssId{o}{\\$60} + \\cssId{d}{\\$4.80} = \\cssId{s}{\\$64.80}', Y(3), 76, TG);
  const L4a = bline('e.L4a', '100\\% + \\cssId{d}{8\\%} = \\cssId{s}{108\\%}', Y(4), 72, TG);
  const L4 = bline('e.L4', '\\cssId{p}{1.08} \\times \\cssId{o}{\\$60} = \\cssId{s}{\\$64.80}', Y(5), 76, TG);
  const leads: Lead2[] = [{ key: 'e.ld2', from: () => partOf(L2, 'd'), to: () => W.taxAmt, col: 'second' }];
  setTapes({
    models: [{ pre: 'e.', m, focus: () => { const k = tr.k('e.f2'); return k > 0 ? { parts: ['tax'], k, col: 'pick' } : {}; } }],
    lines: [T, H, L1, L2a, L2, L3, L4a, L4], leads,
  });
  jump('e.', ['receipt', 'rPrice', 'tape', 'whole', 'T']);   // where part 1 left the picture

  const STEPS = [
    { t: 'Name the whole', why: 'The pre-tax price is 100%.', act: 'Show the whole' },
    { t: 'Find the tax', why: '8% of the pre-tax price.', act: 'Find it' },
    { t: 'Add it', why: 'Pre-tax price + tax = total.', act: 'Add' },
    { t: 'One step', why: '100% + 8% = 108% of the same price.', act: 'Show it' },
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
        tr.set('e.L1', 1, 0.9); void bump('e.pP', alive); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.L2a', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.tax', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.f2', 1, 0.5); tr.set('e.L2a:dim', 1, 0.5); tr.set('e.L2', 1, 0.9); tr.set('e.ld2', 1, 0.9, 0.7); await wait(1.5); if (!alive()) return;
        tr.set('e.rTax', 1, 0.9); void bump('e.pX', alive); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.f2', 0, 0.4); tr.set('e.ld2', 0, 0.4); tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.total', 1, 1.1); await wait(1.1); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.rTotal', 1, 0.9); void bump('e.pT', alive); await wait(1.3);
      } else {
        tr.set('e.L3:dim', 1, 0.5);
        tr.set('e.totalPct', 1, 0.9); void bump('e.pT', alive); await wait(1.0); if (!alive()) return;
        tr.set('e.L4a', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.L4', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.T', 0, 0.5); tr.set('e.H', 1, 1.0, 0.3); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(vline(`e.s${i + 1}`, '', false));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 1 keeps the whole price and the 0.08 adds the tax: 108% of the price.', ok: true, id: 'e.w-ok' },
      { t: 'It is only a shortcut: a percent of a price can never be more than the price.', ok: false, id: 'e.w-less', mc: MC.lessThanOne },
      { t: 'You write the 8 of 8% after the “1.”', ok: false, id: 'e.w-append', mc: MC.append },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, o => {
      fbHost.replaceChildren(fbv(o.ok, o.id));
      log('example', 'example.why', 'Why does 1.08 × $60 give the total?', o.t, opts[0]!.t, o.ok, o.mc);
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box2, fbHost);
    sayThen('e.s4', 'e.why');
  }
  draw();
  setPanel(h('h2', {}, 'Watch it worked out'), vline('e.intro', 'dim'), P.node, sayBox, after);
}

// ===== 3. Your turn: a $40 board game, 7.5% tax =====
function partTurn(): void {
  tr.reset('t.');
  const m = TaxTape({ price: 4000, rate: 7500, item: 'Board game', bench: [5, 10] }, MFD, th), W = m.where;
  const yT = BD.y0 + 100, Y = (i: number) => BD.y0 + 250 + i * 124;
  const T = bline('t.T', '\\cssId{o}{\\$40} + \\cssId{d}{7.5\\%\\ \\text{tax}} \\;\\to\\; \\$\\,?', yT, 84, TG);
  const H = bline('t.H', '\\cssId{o}{\\$40} + \\cssId{d}{7.5\\%\\ \\text{tax}} \\;\\to\\; \\cssId{s}{\\$43.00}', yT, 84, TG);
  const L1 = bline('t.L1', '\\cssId{o}{\\$40.00} = 100\\%', Y(0), 76, TG);
  const L2 = bline('t.L2', '0.075 \\times \\$40 = \\cssId{d}{\\$3.00}', Y(1), 76, TG);
  const L3 = bline('t.L3', '\\cssId{o}{\\$40.00} + \\cssId{d}{\\$3.00} = \\cssId{s}{\\$43.00}', Y(2), 76, TG);
  const L4 = bline('t.L4', '\\cssId{p}{1.075} \\times \\cssId{o}{\\$40} = \\cssId{s}{\\$43.00}', Y(3), 76, TG);
  const L5 = bline('t.L5', '5\\% \\to \\cssId{p}{\\$2},\\ \\ 10\\% \\to \\cssId{w}{\\$4}', Y(4), 72, { ...TG, w: { col: 'pick' } });
  const leads: Lead2[] = [{ key: 't.ld2', from: () => partOf(L2, 'd'), to: () => W.taxAmt, col: 'second' }];
  setTapes({
    models: [{ pre: 't.', m, focus: () => { const k = tr.k('t.fb'); return k > 0 ? { parts: ['bench'], k, col: 'pick' } : {}; } }],
    lines: [T, H, L1, L2, L3, L4, L5], leads,
  });

  const STEPS = [
    { t: 'Name the whole', why: 'Done for you.' },
    { t: 'Find the tax', why: 'Done for you.' },
    { t: 'Add it', why: 'Your step.' },
    { t: 'One step', why: 'Your step.' },
  ];
  const P = plan(STEPS), work = h('div');
  let step = 0;
  P.draw(step);
  setPanel(h('h2', {}, 'Seven and a half percent'), vline('t.intro'), P.node, work);

  seq(async alive => {
    tr.set('t.receipt', 1, 0.8); tr.set('t.rPrice', 1, 0.8, 0.5); tr.set('t.T', 1, 0.9, 0.4); await wait(1.4); if (!alive()) return;
    tr.set('t.tape', 1, 1.1); tr.set('t.whole', 1, 0.9, 1.0); await wait(2.0); if (!alive()) return;
    tr.set('t.L1', 1, 0.9); void bump('t.pP', alive); await wait(1.2); if (!alive()) return;
    step = 1; P.draw(step); tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.tax', 1, 1.3); await wait(1.5); if (!alive()) return;
    tr.set('t.L2', 1, 1.0); tr.set('t.ld2', 1, 0.9, 0.8); tr.set('t.rTax', 1, 0.8, 1.2); await wait(2.2); if (!alive()) return;
    step = 2; P.draw(step);
    askAdd();
  });

  function askAdd(): void {
    const fbHost = h('div');
    const inp = moneyInput(() => submit());
    const ok = btn('Check', () => submit(), 'go');
    let wrongs = 0;
    function submit(): void {
      const v = inp.read();
      if (v === null || Number.isNaN(v)) { fbHost.replaceChildren(fbv(false, 't.empty')); return; }
      const c = Math.round(v * 100);
      const right = c === 4300;
      const id = right ? 't.a-ok' : c === 4750 ? 't.a-pct' : c === 300 ? 't.a-tax' : c === 3700 ? 't.a-sub' : c === 4000 ? 't.a-shelf' : 't.a-other';
      const mc = ({ 't.a-pct': MC.numeral, 't.a-tax': MC.changeFinal, 't.a-sub': MC.direction, 't.a-shelf': MC.shelf } as Record<string, string>)[id];
      log('turn', 'turn.total', '$40 board game, 7.5% tax, tax $3.00: what do you pay in total?', v, 43, right, mc);
      fbHost.replaceChildren(fbv(right, id));
      if (!right) { if (++wrongs >= 2) fbHost.append(html('p', 'dim', 'Line up the decimal points: 40.00 + 3.00.')); return; }
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ld2', 0, 0.4); tr.set('t.L2:dim', 1, 0.5);
        tr.set('t.total', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.L3', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.rTotal', 1, 0.9); void bump('t.pT', alive); await wait(1.4); if (!alive()) return;
        step = 3; P.draw(step); askMult();
      });
    }
    work.replaceChildren(vline('t.tax', '', false), vline('t.add'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askMult(): void {
    const opts = [
      { t: '1.075 × $40', ok: true, id: 't.m-ok' },
      { t: '1.75 × $40', ok: false, id: 't.m-append', mc: MC.append },
      { t: '0.075 × $40', ok: false, id: 't.m-tax', mc: MC.changeFinal },
      { t: '0.925 × $40', ok: false, id: 't.m-down', mc: MC.direction },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, (o, bx) => {
      log('turn', 'turn.multiplier', 'Which one multiplication gives the total of $40 with 7.5% tax?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.L3:dim', 1, 0.5);
        tr.set('t.totalPct', 1, 0.9); void bump('t.pT', alive); await wait(1.0); if (!alive()) return;
        tr.set('t.L4', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.T', 0, 0.5); tr.set('t.H', 1, 1.0, 0.3); await wait(1.5); if (!alive()) return;
        step = 4; P.draw(step); askBench();
      });
    });
    work.replaceChildren(vline('t.mult'), box2, fbHost);
  }
  function askBench(): void {
    const opts = [
      { t: 'Yes: 5% is $2 and 10% is $4, and $3.00 is between them.', ok: true, id: 't.b-ok' },
      { t: 'Yes: $3.00 is less than $40.', ok: false, id: 't.b-one', mc: MC.oneSided },
      { t: 'No: 7.5% of $40 should be $30.', ok: false, id: 't.b-scale', mc: MC.scale },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, (o, bx) => {
      log('turn', 'turn.bench', 'Is $3.00 a sensible 7.5% tax on $40?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      seq(async alive => {
        tr.set('t.L4:dim', 1, 0.5);
        tr.set('t.bench', 1, 1.0); tr.set('t.fb', 1, 0.5, 0.6); await wait(1.2); if (!alive()) return;
        tr.set('t.L5', 1, 0.9); await wait(1.8); if (!alive()) return;
        tr.set('t.fb', 0, 0.5);
        if (!o.ok) return;
        bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
        fbHost.append(callback());
      });
    });
    work.replaceChildren(vline('t.bench'), box2, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const id = commit().pick === null ? 't.cb-none' : CARDS[commit().pick!]!.cb;
    c.append(vline(id));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Ana takes 8% of the $81 total off =====
function partProve(): void {
  tr.reset('p.');
  const base: TaxTapeParams = { price: 7500, rate: 8000, item: 'Running shoes', cells: 10, rebase: true };
  const m0 = TaxTape({ ...base, hide: { price: true, tax: true } }, MFD, th);
  const m1 = TaxTape(base, MFD, th), W = m1.where;
  let solved = false;
  const yJ = BD.y0 + 100, Y = (i: number) => BD.y0 + 260 + i * 122;
  const J = bline('p.J', '\\text{Ana:}\\ \\ \\cssId{s}{\\$81} - \\$6.48 = \\cssId{w}{\\$74.52}', yJ, 80, TG);
  const C1 = bline('p.C1', '\\cssId{s}{\\$81} = \\cssId{p}{108\\%}\\ \\text{of the price}', Y(0), 74, TG);
  const C2 = bline('p.C2', '\\$81 \\div \\cssId{p}{1.08} = \\cssId{o}{\\$75}', Y(1), 76, TG);
  const C2b = bline('p.C2b', '\\cssId{o}{\\$75} + \\cssId{d}{\\$6} = \\cssId{s}{\\$81}\\ \\checkmark', Y(2), 76, TG);
  const C3a = bline('p.C3a', '10\\%:\\ \\ \\cssId{o}{\\$7.50}\\ \\ \\text{vs}\\ \\ \\cssId{s}{\\$8.10}', Y(3), 72, TG);
  const C3 = bline('p.C3', '8\\%\\ \\text{of}\\ \\$81 = \\$6.48 > \\cssId{d}{\\$6}', Y(4), 76, TG);
  const leads: Lead2[] = [{ key: 'p.ldO', from: () => partOf(C2, 'o'), to: () => W.rPrice, col: 'first' }];
  setTapes({
    models: [{ pre: 'p.', m: () => (solved ? m1 : m0), focus: () => { const k = tr.k('p.fr'); return k > 0 ? { parts: ['rebase'], k, col: 'pick' } : {}; } }],
    lines: [J, C1, C2, C2b, C3a, C3], leads,
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.receipt', 1, 0.8); tr.set('p.rPrice', 1, 0.6, 0.4); tr.set('p.rTax', 1, 0.6, 0.6); tr.set('p.rTotal', 1, 0.8, 0.8);
  tr.set('p.tape', 1, 1.1, 1.2); tr.set('p.whole', 1, 0.8, 2.0); tr.set('p.cells', 1, 0.8, 2.3); tr.set('p.tax', 1, 1.0, 2.8);
  tr.set('p.total', 1, 0.8, 3.4); tr.set('p.totalPct', 1, 0.8, 3.8); tr.set('p.J', 1, 1.0, 1.0);

  const CHIPS = [
    { t: 'The price is the 100% whole, and the tax adds 8% of it on top.', fits: 0 },
    { t: 'Dividing by 1.08 undoes multiplying by 1.08, and $75 + $6 = $81 checks.', fits: 1 },
    { t: '$81 is a bigger whole than $75, so each 1% of it is bigger.', fits: 2 },
    { t: 'Adding 8% and then taking 8% off always cancel out.', fits: -1, id: 'p.x-cancel', mc: MC.successive },
    { t: 'To undo the tax, divide the total by 0.08.', fits: -1, id: 'p.x-div', mc: MC.divRate },
    { t: 'Taking $8 off undoes an 8% tax.', fits: -1, id: 'p.x-dollars', mc: MC.numeral },
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
        void bump('p.pT', alive); await wait(0.6); if (!alive()) return;
        void bump('p.pP', alive); tr.set('p.C1', 1, 1.0);
      } else if (n === 2) {
        tr.set('p.C1:dim', 1, 0.5);
        tr.set('p.C2', 1, 1.0); await wait(1.0); if (!alive()) return;
        solved = true; tr.jump('p.rPrice', 0); tr.jump('p.rTax', 0);
        tr.set('p.rPrice', 1, 0.9); tr.set('p.ldO', 1, 0.9, 0.3); void bump('p.pP', alive); await wait(1.4); if (!alive()) return;
        tr.set('p.rTax', 1, 0.9); void bump('p.pX', alive); tr.set('p.C2b', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('p.ldO', 0, 0.5);
      } else {
        tr.set('p.C2:dim', 1, 0.5); tr.set('p.C2b:dim', 1, 0.5);
        tr.set('p.rebase', 1, 1.6); await wait(1.8); if (!alive()) return;
        tr.set('p.fr', 1, 0.5); tr.set('p.C3a', 1, 1.0); await wait(1.8); if (!alive()) return;
        tr.set('p.fr', 0, 0.5); tr.set('p.C3', 1, 1.0); void bump('p.pX', alive); await wait(1.4); if (!alive()) return;
        tr.set('p.strike', 1, 0.6, 0.2); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Ana is right', () => judge(true)), no = btn('Ana is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    log('prove', 'prove.judge', 'Ana: the total is $81 with 8% tax; 8% of $81 is $6.48, so the price was $74.52. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? MC.opposite : undefined);
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
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed), show: showItem,
  });
}
const PULSE_KEY = { price: 'pP', tax: 'pX', total: 'pT' } as const;
function unhide(p: TaxTapeParams): TaxTapeParams { const { hide: _h, exactTax: _e, ...rest } = p; return rest; }
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  // money needs a decimal point on phone keyboards (the runtime's boxes are numeric)
  setTimeout(() => ctx.panel.querySelectorAll<HTMLInputElement>('.ans input').forEach(i => { i.inputMode = 'decimal'; }), 0);
  const P = item.picture as TaxPicture | undefined;
  const big = box(240, 280, 1680, 760);
  const bare = () => { setTapes({ models: [], lines: [bigLine('x.B', item.board, big)], leads: [], boardBox: big }); tr.set('x.B', 1, 0.8, 0.1); };
  if (!P) { bare(); return {}; }
  const mb = tryBlock(() => TaxTape(P.tape, MFD, th)), ms = tryBlock(() => TaxTape(P.solved ?? unhide(P.tape), MFD, th));
  if (!mb.ok || !ms.ok) { console.error('sales-tax: model not drawn', item.id, mb.ok ? '' : mb.error, ms.ok ? '' : ms.error); bare(); return {}; }
  const T = bline('x.T', item.board, BD.y0 + 110, 80, TG);
  const Wl = fitWork(P.work).map((s, i) => bline(`x.w${i}`, s, BD.y0 + 290 + i * 130, 76, TG));
  let solved = false;
  const scene = () => setTapes({ models: [{ pre: 'x.', m: () => (solved ? ms.value : mb.value) }], lines: [T, ...Wl], leads: [] });
  if (P.pre.length) {
    scene();
    P.pre.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.1 + i * 0.18));
    tr.set('x.T', 1, 0.8, 0.3);
  } else bare();
  return {
    solve: async alive => {
      solved = true; scene();
      if (!P.pre.length) tr.jump('x.T', 1);
      for (const s of P.pre) tr.jump('x.' + s, 1);
      tr.set('x.T:dim', 1, 0.5);
      for (const s of P.post as TaxTapeStep[]) { tr.set('x.' + s, 1, 0.8); await wait(0.35); if (!alive()) return; }
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
  warm: ['\\$60 + 8\\%\\ \\text{tax} \\;\\to\\; \\$\\,? = 100\\%', '\\text{you pay}\\ \\text{Ana:}\\ \\text{of the price}', '1.075 \\times \\$40 = \\$43.00 > \\checkmark',
    '\\text{Tax}\\ \\text{total}_A - \\text{total}_B| \\approx \\ldots \\overset{?}{=} \\div \\square \\quad \\text{vs} \\text{taxable} \\text{or}',
    '10\\%\\ \\text{of}\\ \\$75 = \\$7.50,\\ \\ 0.0825 < 1{,}000 \\to \\$6.48 \\ x B p P'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
