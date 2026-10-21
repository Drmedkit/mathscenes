// original-amount.ts: "Find the original amount after a percent change" (grade 7, 7.RP.A.3, 7.EE.A.2) on the shared
// lesson runtime.
//   1 The question   a jacket, 20% off, sale price $48: what was the original price? 3 cards ($60; $57.60 = 20% of
//                    $48 added back, the wrong base; $68 = the percent taken as dollars) + how sure
//   2 Worked example the tag, then the original as a 100% tape cut in five 20% sections and the sale price as four of
//                    them (concreteness fading); four subgoal steps: Name the whole, Find one section ($48 ÷ 4),
//                    Build the whole (5 × $12), Divide by the multiplier ($48 ÷ 0.8); one "why?"
//   3 Your turn      a concert ticket, $54 with 8% sales tax, faded from the end: the whole is named for the kid, the
//                    kid writes the multiplier (1.08), divides ($50) and picks a real check (forward, not repeat)
//   4 Prove it       Theo: a 25% markup $60 -> $75 is undone by 25% off. Three tapes; a because-chain: the markup was
//                    25% of $60 = $15, but 25% of $75 is $18.75, so it leaves $56.25; the way back is ÷ 1.25
//   5 Practice       all 7 sub-goals one after another, then mixed (runtime/practice.ts), 18 families
// Board: money equations do not fit the runtime board at >= 60 px, so this page lays out its own (as the discounts
// page does): the model in an 860 px frame, a wider slate from x = 1000, its own board lines and leader lines (local
// helpers below; the runtime is unchanged).
// Voiced lines: src/lesson/topics/original-amount/script.ts (panel HTML) = pages/lessons/original-amount/voice/lines.json.
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
import { BaseTape, type BaseTapeBlock, type BaseTapeFocus, type BaseTapeParams } from '../../src/lesson/topics/original-amount/BaseTape';
import { type OrigPicture, FAMILY_NAMES, GENS } from '../../src/lesson/topics/original-amount/items';
import { PLAN } from '../../src/lesson/topics/original-amount/plan';
import { SCRIPT } from '../../src/lesson/topics/original-amount/script';
import { reverse } from '../../src/lesson/topics/original-amount/reverseMaths';

const SLUG = 'original-amount';
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
/** the topic JSON sub-goal each explain-part step belongs to (logged with the attempt) */
const SUBGOAL: Record<string, string> = {
  'question.commit': 'reverse-percent-change', 'example.why': 'explain-base-change', 'turn.multiplier': 'change-multiplier-expression',
  'turn.divide': 'reverse-percent-change', 'turn.check': 'rounding-check', 'prove.judge': 'explain-base-change',
  'prove.claim1': 'explain-base-change', 'prove.claim2': 'explain-base-change', 'prove.claim3': 'explain-base-change',
};
function log(part: 'question' | 'example' | 'turn' | 'prove', item: string, prompt: string, response: unknown, expected: unknown, correct: boolean | null, mc?: string, sure?: number): void {
  ctx.store.log({ part, subgoal: SUBGOAL[item], item, prompt, response, expected, correct, mc, sure });
}

// the maths the explain parts state, asserted at build time (a wrong script cannot render)
for (const [n, r, d, o] of [[4800, 20, 'down', 6000], [5400, 8, 'up', 5000], [7500, 25, 'up', 6000]] as const) {
  const v = reverse(n, r, d);
  if (!v.exact || v.origC !== o) throw new Error(`original-amount: ${n} after ${r}% ${d} should come from ${o}`);
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
interface Model { pre: string; m: BaseTapeBlock | (() => BaseTapeBlock); focus?: () => BaseTapeFocus }
interface TapeScene { models: Model[]; lines: Line[]; leads: Lead2[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
/** pulses: `${pre}pv0`, `${pre}pv1`, `${pre}pv2` light a row's value; `${pre}pO` / `${pre}pN` the object's amounts */
function setTapes(S: TapeScene): void {
  setScene({
    table: 1040,
    model: c => {
      for (const M of S.models) {
        const m = typeof M.m === 'function' ? M.m() : M.m;
        const f = M.focus?.() ?? {};
        m.draw(c, progressOf(s => tr.k(M.pre + s)), {
          ...f, pulse: [tr.k(M.pre + 'pv0'), tr.k(M.pre + 'pv1'), tr.k(M.pre + 'pv2')], pObjOld: tr.k(M.pre + 'pO'), pObjNew: tr.k(M.pre + 'pN'),
          secPulse: f.secPulse ?? [[0, tr.k(M.pre + 'ps0')], [1, tr.k(M.pre + 'ps1')], [2, tr.k(M.pre + 'ps2')]],
        });
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
/** a typed number (money or a multiplier), lenient: "$12.50", "12.5", "1,234" */
function numBox(onEnter: () => void, money: boolean): { node: HTMLElement; read(): number | null; focus(): void } {
  const i = h('input', { inputmode: 'decimal', autocomplete: 'off', 'aria-label': money ? 'amount in dollars' : 'a number' });
  i.addEventListener('keydown', e => { if (e.key === 'Enter') onEnter(); });
  return {
    node: h('div', { class: 'ans' }, ...(money ? [h('span', { class: 'money' }, '$')] : []), i),
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

// ---------- the jacket: $48 after 20% off ----------
const JACKET: BaseTapeParams = {
  rows: [
    { cents: 6000, word: 'original price', hide: true, sections: 5, secVals: true },
    { cents: 4800, word: 'sale price', sections: 5, secVals: true, pct: '80\\%', change: '20\\%\\ \\text{off}' },
  ],
  scale: true,
  obj: { kind: 'tag', title: 'Jacket', old: 'was', now: 'now' },
};
const JACKET_Q: BaseTapeParams = {
  rows: [{ cents: 6000, word: 'original price', hide: true }, { cents: 4800, word: 'sale price', change: '20\\%\\ \\text{off}' }],
  obj: { kind: 'tag', title: 'Jacket', old: 'was', now: 'now' },
};
const CARDS = [
  { v: '57.60', c: 5760, id: 'mc.percent.opposite-percent-to-undo-change', cb: 't.cb-576' },
  { v: '60', c: 6000, id: '', cb: 't.cb-right' },
  { v: '68', c: 6800, id: 'mc.percent.adds-or-subtracts-percent-numeral', cb: 't.cb-68' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = BaseTape(JACKET_Q, MFD, th);
  const top = BD.y0 + 130;
  const T = bline('q.T', '\\cssId{d}{20\\%\\ \\text{off}}\\colon\\ \\ \\cssId{o}{\\$\\,?} \\;\\to\\; \\cssId{s}{\\$48}', top, 92, TG);
  const Q = bline('q.Q', '\\text{original price} = \\cssId{o}{\\$\\,?}', top + 170, 84, TG);
  setTapes({ models: [{ pre: 'q.', m }], lines: [T, Q], leads: [], boardBox: box(BD.x0, BD.y0, BD.x1, top + 290) });
  tr.set('q.obj', 1, 0.8); tr.set('q.row0', 1, 1.1, 0.6); tr.set('q.val0', 1, 0.6, 1.2); tr.set('q.pct0', 1, 0.7, 1.4);
  tr.set('q.row1', 1, 1.0, 1.8); tr.set('q.val1', 1, 0.6, 2.4); tr.set('q.chg1', 1, 0.8, 2.6);
  tr.set('q.T', 1, 0.9, 1.0); tr.set('q.Q', 1, 0.9, 1.8);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    log('question', 'question.commit', 'A jacket is 20% off; the sale price is $48. What was the original price?', p.c / 100, 60, p.c === 6000, p.id || undefined, commit().sure ?? undefined);
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
    const b = h('button'); b.innerHTML = `<b>$${cd.v}</b><small>original price</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); if (!asked) { asked = true; void say('q.sure'); } });
    cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Back to the original price'),
    vline('q.intro', '', false), vline('q.ask', '', false),
    cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn),
  );
  sayThen('q.intro', 'q.ask');
}

// ===== 2. Worked example: $48 after 20% off =====
function partExample(): void {
  tr.reset('e.');
  const m = BaseTape(JACKET, MFD, th), W = m.where;
  const yT = BD.y0 + 110;
  const y1 = BD.y0 + 270, y2 = y1 + 132, y3 = y2 + 132, y4 = y3 + 132, y5 = y4 + 132;
  const T = bline('e.T', '\\cssId{d}{20\\%\\ \\text{off}}\\colon\\ \\ \\cssId{o}{\\$\\,?} \\;\\to\\; \\cssId{s}{\\$48}', yT, 84, TG);
  const H = bline('e.H', '\\cssId{d}{20\\%\\ \\text{off}}\\colon\\ \\ \\cssId{o}{\\$60} \\;\\to\\; \\cssId{s}{\\$48}', yT, 84, TG);
  const L1 = bline('e.L1', '\\cssId{s}{\\$48} = \\cssId{s}{80\\%}\\ \\text{of}\\ \\cssId{o}{\\$\\,?}', y1, 76, TG);
  const L2 = bline('e.L2', '\\cssId{s}{\\$48} \\div 4 = \\cssId{p}{\\$12}', y2, 76, TG);
  const L3 = bline('e.L3', '5 \\times \\cssId{p}{\\$12} = \\cssId{o}{\\$60}', y3, 76, TG);
  const L4 = bline('e.L4', '0.8 \\times \\cssId{o}{x} = \\cssId{s}{\\$48}', y4, 76, TG);
  const L5 = bline('e.L5', '\\cssId{o}{x} = \\$48 \\div 0.8 = \\cssId{o}{\\$60}', y5, 76, TG);
  const leads: Lead2[] = [{ key: 'e.ld1', from: () => partOf(L1, 'o'), to: () => W.value(0), col: 'first' }];
  setTapes({
    models: [{ pre: 'e.', m, focus: () => { const k = tr.k('e.f1'); return k > 0 ? { rows: [1], k, col: 'pick' } : {}; } }],
    lines: [T, H, L1, L2, L3, L4, L5], leads,
  });
  jump('e.', ['obj', 'row0', 'val0', 'row1', 'val1', 'chg1', 'T']);   // where part 1 left the picture

  const STEPS = [
    { t: 'Name the whole', why: 'The original is 100%; the sale price is 100% − 20% = 80% of it.', act: 'Show the whole' },
    { t: 'Find one section', why: '80% is 4 sections of 20%.', act: 'Split it' },
    { t: 'Build the whole', why: '100% is 5 sections.', act: 'Build it' },
    { t: 'Divide by the multiplier', why: 'Sale price = 0.8 × original.', act: 'One step' },
  ];
  const P = plan(STEPS), sayBox = h('div'), after = h('div');
  let step = 0;
  const draw = () => P.draw(step, step < 4 ? { label: STEPS[step]!.act, on: () => run(step) } : undefined);
  function run(i: number): void {
    step = i + 1; draw(); sayBox.replaceChildren();
    void say(`e.s${i + 1}`);
    seq(async alive => {
      if (i === 0) {
        tr.set('e.cut0', 1, 1.0); tr.set('e.pct0', 1, 1.2, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('e.cut1', 1, 1.0); tr.set('e.pct1', 1, 0.9, 0.6); tr.set('e.f1', 1, 0.5, 0.6); await wait(1.6); if (!alive()) return;
        tr.set('e.L1', 1, 1.0); void bump('e.pv1', alive); tr.set('e.ld1', 1, 0.9, 0.8); await wait(1.8);
      } else if (i === 1) {
        tr.set('e.f1', 0, 0.4); tr.set('e.ld1', 0, 0.4); tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.sv1', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); void bump('e.ps1', alive); await wait(1.3);
      } else if (i === 2) {
        tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.copy', 1, 1.6); tr.set('e.sv0', 1, 1.2, 1.2); await wait(2.5); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); tr.set('e.reveal', 1, 1.0, 0.4); void bump('e.ps0', alive); await wait(1.0); if (!alive()) return;
        void bump('e.pv0', alive); void bump('e.pO', alive); await wait(1.0);
      } else {
        tr.set('e.L3:dim', 1, 0.5);
        tr.set('e.L4', 1, 1.0); void bump('e.pv1', alive); await wait(1.3); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); void bump('e.pv0', alive); await wait(1.2); if (!alive()) return;
        tr.set('e.T', 0, 0.5); tr.set('e.H', 1, 1.0, 0.3); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(vline(`e.s${i + 1}`, '', false));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 20% was 20% of the original. $48 is only 80% of it, so ÷ 0.8 gets back to 100%.', ok: true, id: 'e.w-ok' },
      { t: 'Adding 20% of $48 back undoes 20% off, so both ways work.', ok: false, id: 'e.w-back', mc: 'mc.percent.opposite-percent-to-undo-change' },
      { t: 'Dividing by 0.2 also works, because 20% came off.', ok: false, id: 'e.w-rate', mc: 'mc.percent.divides-by-rate-to-undo-change' },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, o => {
      fbHost.replaceChildren(fbv(o.ok, o.id));
      log('example', 'example.why', 'Why divide $48 by 0.8, and not add 20% of $48 back?', o.t, opts[0]!.t, o.ok, o.mc);
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box2, fbHost);
    sayThen('e.s4', 'e.why');
  }
  draw();
  setPanel(h('h2', {}, 'Watch it worked out'), vline('e.intro', 'dim'), P.node, sayBox, after);
}

// ===== 3. Your turn: a concert ticket, $54 with 8% sales tax =====
function partTurn(): void {
  tr.reset('t.');
  const TICKET: BaseTapeParams = {
    rows: [{ cents: 5000, word: 'price before tax', hide: true }, { cents: 5400, word: 'total', pct: '108\\%', change: '+8\\%\\ \\text{tax}' }],
    obj: { kind: 'receipt', title: 'Concert ticket', old: 'price', now: 'total' },
  };
  const m = BaseTape(TICKET, MFD, th), W = m.where;
  const yT = BD.y0 + 110;
  const y1 = BD.y0 + 290, y2 = y1 + 140, y3 = y2 + 140, y4 = y3 + 140;
  const T = bline('t.T', '\\cssId{d}{+8\\%\\ \\text{tax}}\\colon\\ \\ \\cssId{o}{\\$\\,?} \\;\\to\\; \\cssId{s}{\\$54}', yT, 84, TG);
  const H = bline('t.H', '\\cssId{d}{+8\\%\\ \\text{tax}}\\colon\\ \\ \\cssId{o}{\\$50} \\;\\to\\; \\cssId{s}{\\$54}', yT, 84, TG);
  const L1 = bline('t.L1', '\\cssId{s}{\\$54} = \\cssId{s}{108\\%}\\ \\text{of}\\ \\cssId{o}{\\$\\,?}', y1, 76, TG);
  const L2 = bline('t.L2', '\\cssId{p}{1.08} \\times \\cssId{o}{x} = \\cssId{s}{\\$54}', y2, 76, TG);
  const L3 = bline('t.L3', '\\cssId{o}{x} = \\$54 \\div 1.08 = \\cssId{o}{\\$50}', y3, 76, TG);
  const L4 = bline('t.L4', '\\$50 + \\cssId{d}{\\$4} = \\cssId{s}{\\$54}\\ \\checkmark', y4, 76, TG);
  const leads: Lead2[] = [{ key: 't.ld1', from: () => partOf(L1, 'o'), to: () => W.value(0), col: 'first' }];
  setTapes({
    models: [{ pre: 't.', m, focus: () => { const k = tr.k('t.fc'); return k > 0 ? { change: [1], k, col: 'pick' } : {}; } }],
    lines: [T, H, L1, L2, L3, L4], leads,
  });

  const STEPS = [
    { t: 'Name the whole', why: 'Done for you.' },
    { t: 'Write the multiplier', why: 'Your step.' },
    { t: 'Divide by it', why: 'Your step.' },
    { t: 'Check it forward', why: 'Your step.' },
  ];
  const P = plan(STEPS), work = h('div');
  let step = 0;
  P.draw(step);
  setPanel(h('h2', {}, 'Eight percent sales tax'), vline('t.intro'), P.node, work);

  seq(async alive => {
    tr.set('t.obj', 1, 0.8); tr.set('t.T', 1, 0.9, 0.4); await wait(1.2); if (!alive()) return;
    tr.set('t.row0', 1, 1.0); tr.set('t.val0', 1, 0.6, 0.6); tr.set('t.pct0', 1, 0.7, 0.8); await wait(1.5); if (!alive()) return;
    tr.set('t.row1', 1, 1.0); tr.set('t.val1', 1, 0.6, 0.6); tr.set('t.chg1', 1, 0.8, 0.9); await wait(1.9); if (!alive()) return;
    tr.set('t.pct1', 1, 0.9); tr.set('t.L1', 1, 1.0, 0.3); tr.set('t.ld1', 1, 0.9, 1.0); void bump('t.pv1', alive); await wait(2.0); if (!alive()) return;
    work.replaceChildren(vline('t.whole', '', false));
    step = 1; P.draw(step);
    askMult();
  });

  function askMult(): void {
    const fbHost = h('div');
    const inp = numBox(() => submit(), false);
    const ok = btn('Check', () => submit(), 'go');
    function submit(): void {
      const v = inp.read();
      if (v === null || Number.isNaN(v)) { fbHost.replaceChildren(feedback(false, 'Type a number, like 1.5.')); return; }
      const right = Math.abs(v - 1.08) < 1e-9;
      const id = right ? 't.m-ok' : Math.abs(v - 0.08) < 1e-9 ? 't.m-rate' : Math.abs(v - 0.92) < 1e-9 ? 't.m-dir' : Math.abs(v - 108) < 1e-9 ? 't.m-pct' : 't.m-other';
      const mc = { 't.m-rate': 'mc.percent.change-reported-as-final-amount', 't.m-dir': 'mc.percent.wrong-direction-of-change' }[id as 't.m-rate'];
      log('turn', 'turn.multiplier', 'A $54 total includes 8% sales tax. The total is what number times the price before tax?', v, 1.08, right, mc);
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ld1', 0, 0.4); tr.set('t.L1:dim', 1, 0.5);
        tr.set('t.fc', 1, 0.5); tr.set('t.L2', 1, 1.0); void bump('t.pv1', alive); await wait(1.6); if (!alive()) return;
        tr.set('t.fc', 0, 0.5);
        step = 2; P.draw(step); askDiv();
      });
    }
    work.append(vline('t.mult'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askDiv(): void {
    const fbHost = h('div');
    const inp = numBox(() => submit(), true);
    const ok = btn('Check', () => submit(), 'go');
    let wrongs = 0;
    function submit(): void {
      const v = inp.read();
      if (v === null || Number.isNaN(v)) { fbHost.replaceChildren(feedback(false, 'Type an amount, like 12.50.')); return; }
      const c = Math.round(v * 100);
      const right = c === 5000;
      const id = right ? 't.d-ok' : c === 4968 ? 't.d-opp' : c === 67500 ? 't.d-rate' : c === 5832 ? 't.d-fwd' : c === 4600 || c === 6200 ? 't.d-num' : 't.d-other';
      const mc = { 't.d-opp': 'mc.percent.opposite-percent-to-undo-change', 't.d-rate': 'mc.percent.divides-by-rate-to-undo-change', 't.d-num': 'mc.percent.adds-or-subtracts-percent-numeral' }[id as 't.d-opp'];
      log('turn', 'turn.divide', '$54 total with 8% sales tax: what was the price before tax?', v, 50, right, mc);
      fbHost.replaceChildren(fbv(right, id));
      if (!right) { if (++wrongs >= 2) fbHost.append(html('p', 'dim', 'Use the line on the board: 1.08 × x = $54, so x = $54 ÷ 1.08.')); return; }
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.L2:dim', 1, 0.5);
        tr.set('t.L3', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.reveal', 1, 1.0); void bump('t.pv0', alive); void bump('t.pO', alive); await wait(1.5); if (!alive()) return;
        step = 3; P.draw(step); askCheck();
      });
    }
    work.replaceChildren(vline('t.div'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const opts = [
      { t: 'Add 8% tax to $50 and compare with $54', ok: true, id: 't.c-ok' },
      { t: 'Divide $54 by 1.08 again', ok: false, id: 't.c-repeat', mc: 'mc.reasoning-language.check-by-repeating-same-steps' },
      { t: 'Take 8% of $54 off $54 and compare with $50', ok: false, id: 't.c-opp', mc: 'mc.percent.opposite-percent-to-undo-change' },
      { t: 'See that $50 is less than $54', ok: false, id: 't.c-less', mc: 'mc.estimation.one-sided-bound-check' },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, (o, bx) => {
      log('turn', 'turn.check', 'Which is a real check that $50 is the price before 8% tax of a $54 total?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.L3:dim', 1, 0.5);
        tr.set('t.fc', 1, 0.5); tr.set('t.L4', 1, 1.0); void bump('t.pN', alive); await wait(1.5); if (!alive()) return;
        tr.set('t.fc', 0, 0.5); tr.set('t.T', 0, 0.5); tr.set('t.H', 1, 1.0, 0.3); await wait(1.5); if (!alive()) return;
        step = 4; P.draw(step);
        fbHost.append(callback());
      });
    });
    work.replaceChildren(vline('t.check'), box2, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const id = commit().pick === null ? 't.cb-none' : CARDS[commit().pick!]!.cb;
    c.append(vline(id));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Theo says 25% off undoes a 25% markup =====
function partProve(): void {
  tr.reset('p.');
  const SK: BaseTapeParams = {
    rows: [
      { cents: 6000, word: 'first price', sections: 4, secVals: true },
      { cents: 7500, word: 'after the markup', sections: 5, secVals: true, change: '+25\\%' },
      { cents: 5625, word: 'then 25% off', hide: true, sections: 4, secVals: true, change: '-25\\%' },
    ],
    mark: 6000,
  };
  const m = BaseTape(SK, MFD, th), W = m.where;
  const yJ = BD.y0 + 110;
  const y1 = BD.y0 + 290, y2 = y1 + 140, y3 = y2 + 140, y4 = y3 + 140;
  const J = bline('p.J', '\\text{Theo:}\\ \\ \\$75 - 25\\% \\;\\to\\; \\cssId{w}{\\$60}', yJ, 80, TG);
  const C1 = bline('p.C1', '25\\%\\ \\text{of}\\ \\cssId{o}{\\$60} = \\cssId{d}{\\$15}', y1, 76, TG);
  const C2 = bline('p.C2', '25\\%\\ \\text{of}\\ \\cssId{s}{\\$75} = \\cssId{d}{\\$18.75}', y2, 76, TG);
  const C3 = bline('p.C3', '\\$75 - \\$18.75 = \\cssId{s}{\\$56.25}', y3, 76, TG);
  const HH = bline('p.H', '\\$75 \\div 1.25 = \\cssId{o}{\\$60}', y4, 76, TG);
  const leads: Lead2[] = [{ key: 'p.ld3', from: () => partOf(C3, 's'), to: () => W.value(2), col: 'link' }];
  setTapes({
    models: [{ pre: 'p.', m, focus: () => { const k = tr.k('p.fc1'), k2 = tr.k('p.fc2'); return k > 0 ? { change: [1], k, col: 'pick' } : k2 > 0 ? { change: [2], k: k2, col: 'pick' } : {}; } }],
    lines: [J, C1, C2, C3, HH], leads,
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.row0', 1, 1.0); tr.set('p.val0', 1, 0.6, 0.6); tr.set('p.cut0', 1, 0.8, 0.8); tr.set('p.sv0', 1, 1.0, 1.2);
  tr.set('p.row1', 1, 1.0, 1.8); tr.set('p.val1', 1, 0.6, 2.4); tr.set('p.chg1', 1, 0.8, 2.6); tr.set('p.cut1', 1, 0.8, 2.8); tr.set('p.sv1', 1, 1.0, 3.2);
  tr.set('p.J', 1, 1.0, 1.0);

  const CHIPS = [
    { t: 'A percent change is a percent of the amount before the change.', fits: 0 },
    { t: 'After the markup the base is $75, and 25% of a bigger base is more.', fits: 1 },
    { t: '$75 is 125% of the original, so the original is $75 ÷ 1.25.', fits: 2 },
    { t: 'Up 25% and down 25% cancel out.', fits: -1, id: 'p.x-cancel', mc: 'mc.percent.adds-successive-percent-changes' },
    { t: '$56.25 is close to $60, so the gap is just rounding.', fits: -1, id: 'p.x-near', mc: 'mc.estimation.near-miss-accepted-as-match' },
    { t: 'To undo a 25% change, divide by 0.25.', fits: -1, id: 'p.x-rate', mc: 'mc.percent.divides-by-rate-to-undo-change' },
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
        tr.set('p.fc1', 1, 0.5); tr.set('p.pct0', 1, 0.8); void bump('p.pv0', alive); await wait(0.6); if (!alive()) return;
        tr.set('p.C1', 1, 1.0); await wait(1.4); if (!alive()) return; tr.set('p.fc1', 0, 0.5);
      } else if (n === 2) {
        tr.set('p.C1:dim', 1, 0.5);
        tr.set('p.row2', 1, 1.0); tr.set('p.val2', 1, 0.6, 0.5); tr.set('p.chg2', 1, 0.8, 0.8); tr.set('p.cut2', 1, 0.8, 1.0); await wait(1.8); if (!alive()) return;
        tr.set('p.fc2', 1, 0.5); tr.set('p.C2', 1, 1.0); void bump('p.pv1', alive); await wait(1.6); if (!alive()) return; tr.set('p.fc2', 0, 0.5);
      } else {
        tr.set('p.C2:dim', 1, 0.5);
        tr.set('p.sv2', 1, 1.0); tr.set('p.reveal', 1, 1.0, 0.4); await wait(1.2); if (!alive()) return;
        tr.set('p.C3', 1, 1.0); tr.set('p.ld3', 1, 0.9, 0.7); void bump('p.pv2', alive); await wait(1.6); if (!alive()) return;
        tr.set('p.mark', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('p.ld3', 0, 0.5); tr.set('p.C3:dim', 1, 0.5); tr.set('p.H', 1, 1.0); void bump('p.pv0', alive); await wait(1.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.6, 0.2); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Theo is right', () => judge(true)), no = btn('Theo is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    log('prove', 'prove.judge', 'Theo: a 25% markup took $60 to $75; 25% off $75 brings it back to $60. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? 'mc.percent.adds-successive-percent-changes' : undefined);
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
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  // money needs a decimal point on phone keyboards (the runtime's boxes are text)
  setTimeout(() => ctx.panel.querySelectorAll<HTMLInputElement>('.ans input').forEach(i => { i.inputMode = 'decimal'; }), 0);
  const P = item.picture as OrigPicture | undefined;
  const big = box(240, 280, 1680, 760);
  const bare = () => { setTapes({ models: [], lines: [bigLine('x.B', item.board, big)], leads: [], boardBox: big }); tr.set('x.B', 1, 0.8, 0.1); };
  if (!P) {
    bare();
    // the worked solution of a bare item: its lines under the problem
    return {};
  }
  const mb = tryBlock(() => BaseTape(P.tape, MFD, th));
  if (!mb.ok) { console.warn('original-amount: model not drawn', item.id, mb.error); bare(); return {}; }
  const T = bline('x.T', item.board, BD.y0 + 110, 80, TG);
  const Wl = P.work.map((s, i) => bline(`x.w${i}`, s, BD.y0 + 290 + i * 130, 76, TG));
  setTapes({ models: [{ pre: 'x.', m: mb.value }], lines: [T, ...Wl], leads: [] });
  P.pre.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.1 + i * 0.12));
  tr.set('x.T', 1, 0.8, 0.3);
  return {
    solve: async alive => {
      for (const s of P.pre) tr.jump('x.' + s, 1);
      tr.set('x.T:dim', 1, 0.5);
      for (const s of P.post) { tr.set('x.' + s, 1, s === 'copy' ? 1.4 : 0.8); await wait(s === 'copy' ? 1.2 : 0.4); if (!alive()) return; }
      for (const r of P.pulse) void bump(`x.pv${r}`, alive);
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
  warm: ['\\$48 = 80\\%\\ \\text{of}\\ \\$\\,? \\;\\to\\; \\$60', '\\text{Theo:}\\ \\text{original price}\\ \\checkmark \\ne \\le > \\ldots \\approx',
    '0.8 \\times x = \\$48 \\div 0.8 \\quad 5 \\times \\$12 \\quad 1{,}234.50 \\quad \\square\\, x',
    '\\overset{?}{=} \\quad \\xrightarrow{-20\\%} \\xrightarrow{\\ ?\\%} \\quad +8\\%\\ \\text{tax, rounded} \\to \\text{miss}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
