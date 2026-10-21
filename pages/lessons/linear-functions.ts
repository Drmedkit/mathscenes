// linear-functions.ts: "Linear functions and slope-intercept form" (grade 8, 8.F.B.4) on the shared lesson runtime.
//   1 The question   a bike rental: 2, 4, 6 hours cost $34, $50, $66. How big is the fee? 3 cards ($18; $34 = first
//                    output as intercept; $0 = linear means proportional) + how sure
//   2 Worked example four subgoal steps on the table + graph (LineModel): the rate per ONE hour (a 2-hour step split
//                    by 2), walk back to 0 hours (b = 18), write C = 8h + 18, check the unused row; one "why?"
//   3 Your turn      a phone battery 85, 65, 45 % at 5, 15, 25 min, faded from the end: the rate is given, the kid
//                    finds b (95), picks the equation, checks it at 25 minutes
//   4 Prove it       Jordan doubles: "2 h cost $34, so 4 h cost $68". A because-chain from reason chips (distractors
//                    = catalogue misconceptions); the graph backs each line (Jordan's ray from (0, 0), the fee at 18)
//   5 Practice       all 24 sub-goals one after another, then mixed (runtime/practice.ts), LineModel pictures
// Voiced lines: src/lesson/topics/linear-functions/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { texBox } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { MF, bigLine, type Line, line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { LineModel, type LMFocus, type LMParams, type LMStep } from '../../src/lesson/topics/linear-functions/LineModel';
import { FAMILY_NAMES, GENERATORS, MC, type LFItem } from '../../src/lesson/topics/linear-functions/items';
import { PLAN } from '../../src/lesson/topics/linear-functions/plan';
import { LINES } from '../../src/lesson/topics/linear-functions/script';

const SLUG = 'linear-functions';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the panel shows LINES[id].html, the narrator says lines.json[id] */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  const L = LINES[id];
  if (!L) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, L?.html ?? '');
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, LINES[id]?.html ?? ''); }
/** a voiced line whose speech the next beat waits for (say() stops the line before it) */
function voicedWait(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): [HTMLElement, Promise<void>] {
  return [html(tag, cls, LINES[id]?.html ?? ''), ctx.say(id)];
}
function fbWait(id: string, ok: boolean): [HTMLElement, Promise<void>] { return [feedback(ok, LINES[id]?.html ?? ''), ctx.say(id)]; }

// ===================== the board: lines stacked by their real ink height =====================
interface Spec { key: string; tex: string; size?: number; tags?: Record<string, { col: Paint }>; col?: Paint }
function stack(specs: Spec[], y0: number, gap = 36): Line[] {
  let cur = y0;
  return specs.map(sp => {
    const L = line(sp.key, sp.tex, 0, sp.size ?? 76, sp.tags, sp.col);
    const b = texBox(L.F, L.x, 0, { size: L.size, align: 'left' });
    L.y = cur - b.y0; cur = L.y + b.y1 + gap;
    return L;
  });
}
const teal = { col: 'second' as Paint }, amber = { col: 'first' as Paint }, lime = { col: 'link' as Paint };
/** a LineModel driven by named tracks pre + step */
function lineModel(pre: string, p: LMParams, focus?: () => LMFocus) {
  const M = LineModel(p, MF, th);
  const P = progressOf<LMStep>(s => tr.k(pre + s));
  return { M, draw: (c: Canvas) => M.draw(c, P, focus?.()) };
}

// ===================== the bike rental =====================
const RENT: LMParams = {
  x: { min: 0, max: 6, step: 1, name: 'time (h)' }, y: { min: 0, max: 70, step: 10, name: 'cost ($)' },
  table: { xs: [2, 4, 6], ys: [34, 50, 66], xHead: ['time', '(h)'], yHead: ['cost', '($)'] },
  lines: [{ m: 8, b: 18 }], pts: [{ x: 2, y: 34 }, { x: 4, y: 50 }, { x: 6, y: 66 }],
  step: { x: 2, y: 34, run: 2, rise: 16 }, backFrom: 2, read: 6,
};

// ===================== 1. The question =====================
const CARDS = [
  { v: 34, id: MC.firstOut as string | undefined, why: 'q.cb.first' },
  { v: 18, id: undefined as string | undefined, why: 'q.cb.right' },
  { v: 0, id: MC.propo as string | undefined, why: 'q.cb.zero' },
];
function partQuestion(): void {
  tr.reset('q.');
  const R = lineModel('q.', RENT);
  setScene({ model: R.draw, lines: stack([{ key: 'q.B', tex: `C = \\,?\\quad \\text{at}\\ h = 0`, size: 84 }], 200), leads: [] });
  tr.set('q.table', 1, 1.6); tr.set('q.axes', 1, 1.0, 0.8); tr.set('q.points', 1, 1.4, 1.6); tr.set('q.B', 1, 1.0, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '2, 4, 6 hours cost $34, $50, $66: how big is the fee (the cost at 0 hours)?', board: 'C at h = 0', response: c.v, expected: 18, correct: c.v === 18, mc: c.id, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `$${cd.v}<small>fee</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'The rental fee'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: C = 8h + 18 =====================
function partExample(): void {
  tr.reset('e.');
  const R = lineModel('e.', RENT, () => ({ row: tr.k('e.rowK') > 0 ? 1 : undefined, rowCol: 'second', rowK: tr.k('e.rowK') }));
  const L = stack([
    { key: 'e.E0', tex: `m = \\dfrac{50 - 34}{4 - 2} = \\cssId{m}{8}`, size: 70, tags: { m: teal } },
    { key: 'e.E1', tex: `b = 34 - 8 \\cdot 2 = \\cssId{b}{18}`, size: 70, tags: { b: amber } },
    { key: 'e.E2', tex: `C = \\cssId{m}{8}h + \\cssId{b}{18}`, size: 96, tags: { m: teal, b: amber } },
    { key: 'e.E3', tex: `8 \\cdot 6 + 18 = 66\\ \\cssId{ok}{\\checkmark}`, size: 70, tags: { ok: lime } },
  ], 140, 46);
  setScene({ model: R.draw, lines: L, leads: [] });
  for (const s of ['axes', 'table', 'points']) tr.jump('e.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'The rate per ONE hour', why: 'Change in cost ÷ change in hours.', act: 'Find the rate' },
    { t: 'Walk back to 0 hours', why: 'The cost at 0 hours is the fee, b.', act: 'Walk back' },
    { t: 'Write the equation', why: 'C = m·h + b, with the letters defined.', act: 'Write it' },
    { t: 'Check every row', why: 'Use a row you did not use.', act: 'Check' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) { tr.set('e.rowK', 1, 0.5); tr.set('e.step', 1, 1.8); await wait(2.0); if (!alive()) return; tr.set('e.E0', 1, 1.2); await wait(1.3); tr.set('e.rowK', 0, 0.5); }
      else if (i === 1) { tr.set('e.E0:dim', 1, 0.5); tr.set('e.back', 1, 1.6); await wait(1.6); if (!alive()) return; tr.set('e.start', 1, 0.8); await wait(0.8); if (!alive()) return; tr.set('e.E1', 1, 1.2); await wait(1.3); }
      else if (i === 2) { tr.set('e.E1:dim', 1, 0.5); tr.set('e.line', 1, 1.8); await wait(1.8); if (!alive()) return; tr.set('e.E2', 1, 1.2); await wait(1.3); }
      else { tr.set('e.read', 1, 1.6); await wait(1.7); if (!alive()) return; tr.set('e.E3', 1, 1.2); await wait(1.3); }
      if (!alive()) return;
      const [el, spoken] = voicedWait(`e.step${i}`);
      sayBox.replaceChildren(el);
      if (i === 3) { await Promise.all([spoken, wait(1.2)]); if (!alive()) return; selfExplain(); }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '$34 is the cost after 2 hours of riding; the fee is the cost at 0 hours.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The fee is always the first number in the table.', ok: false, id: 'e.why.first', mc: MC.firstOut as string | undefined },
      { t: 'The fee is what you pay for each hour.', ok: false, id: 'e.why.swap', mc: MC.swap as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the fee $18, and not $34?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the phone battery (faded from the end) =====================
const BATT: LMParams = {
  x: { min: 0, max: 30, step: 5, name: 'time (min)' }, y: { min: 0, max: 100, step: 10, name: 'battery (%)' },
  table: { xs: [5, 15, 25], ys: [85, 65, 45], xHead: ['time', '(min)'], yHead: ['battery', '(%)'] },
  lines: [{ m: -2, b: 95 }], pts: [{ x: 5, y: 85 }, { x: 15, y: 65 }, { x: 25, y: 45 }],
  step: { x: 5, y: 85, run: 10, rise: -20 }, backFrom: 5, read: 25,
};
function partTurn(): void {
  tr.reset('t.');
  const R = lineModel('t.', BATT);
  const L = stack([
    { key: 't.E0', tex: `m = \\dfrac{65 - 85}{15 - 5} = \\cssId{m}{-2}`, size: 66, tags: { m: teal } },
    { key: 't.E1', tex: `b = 85 - (-2) \\cdot 5 = \\cssId{b}{95}`, size: 66, tags: { b: amber } },
    { key: 't.E2', tex: `B = \\cssId{m}{-2}t + \\cssId{b}{95}`, size: 92, tags: { m: teal, b: amber } },
    { key: 't.E3', tex: `-2 \\cdot 25 + 95 = 45\\ \\cssId{ok}{\\checkmark}`, size: 66, tags: { ok: lime } },
  ], 140, 46);
  setScene({ model: R.draw, lines: L, leads: [] });
  let stepN = 0;
  const STEPS = [
    { t: 'The rate per ONE minute', why: 'Done for you.' },
    { t: 'Walk back to 0 minutes', why: 'Your step.' },
    { t: 'Write the equation', why: 'Your step.' },
    { t: 'Check a row', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < stepN ? 'done' : i === stepN ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  const [intro, introSaid] = voicedWait('t.intro');
  setPanel(h('h2', {}, 'Your turn: a phone battery'), intro, plan, work);
  tr.set('t.table', 1, 1.6); tr.set('t.axes', 1, 1.0, 0.6); tr.set('t.points', 1, 1.4, 1.4);
  seq(async alive => {
    await Promise.all([introSaid, wait(4.0)]); if (!alive()) return;
    tr.set('t.step', 1, 1.8); await wait(1.9); if (!alive()) return;
    tr.set('t.E0', 1, 1.2); await wait(1.2); if (!alive()) return;
    const [rate, rateSaid] = voicedWait('t.rate');
    work.replaceChildren(rate);
    await Promise.all([rateSaid, wait(2.0)]); if (!alive()) return;
    stepN = 1; drawPlan(); askB();
  });
  function askB(): void {
    const fbHost = h('div'), inp = numInput('%', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.b.empty', false)); return; }
      const v = r.v, right = v === 95;
      const mc = v === 85 ? MC.firstOut : v === 75 ? MC.backSign : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.b', prompt: 'Battery 85% at 5 min, down 2 per minute: the reading at 0 minutes?', board: 'b = ?', response: v, expected: 95, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 85 ? 't.b.first' : v === 75 ? 't.b.sign' : 't.b.no', false)); return; }
      ok.disabled = true;
      const [fbEl, said] = fbWait('t.b.ok', true);
      fbHost.replaceChildren(fbEl);
      seq(async alive => {
        tr.set('t.E0:dim', 1, 0.5); tr.set('t.back', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('t.start', 1, 0.8); tr.set('t.E1', 1, 1.1); await Promise.all([said, wait(2.4)]); if (!alive()) return;
        stepN = 2; drawPlan(); askEq();
      });
    }
    work.replaceChildren(voiced('t.b'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askEq(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '<i>B</i> = 95<i>t</i> − 2', ok: false, id: 't.eq.swap', mc: MC.swap as string | undefined },
      { t: '<i>B</i> = −2<i>t</i> + 95', ok: true, id: 't.eq.ok', mc: undefined as string | undefined },
      { t: '<i>B</i> = 2<i>t</i> + 95', ok: false, id: 't.eq.sign', mc: MC.sign as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.eq', prompt: 'Battery: m = -2, b = 95. Which equation?', board: 'B = mt + b', response: o.t.replace(/<[^>]+>/g, ''), expected: 'B = −2t + 95', correct: o.ok, mc: o.mc });
      const [fbEl, said] = fbWait(o.id, o.ok);
      fbHost.replaceChildren(fbEl);
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.E1:dim', 1, 0.5); tr.set('t.line', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('t.E2', 1, 1.2); await Promise.all([said, wait(2.2)]); if (!alive()) return;
        stepN = 3; drawPlan(); askCheck();
      });
    })));
    work.replaceChildren(voiced('t.eq'), bx, fbHost);
  }
  function askCheck(): void {
    const fbHost = h('div'), inp = numInput('%', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.b.empty', false)); return; }
      const right = r.v === 45;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'B = -2t + 95 at t = 25?', board: 'B = -2t + 95', response: r.v, expected: 45, correct: right, mc: r.v === 145 ? MC.sign : undefined });
      if (!right) { fbHost.replaceChildren(voicedFb(r.v === 145 ? 't.check.sign' : 't.check.no', false)); return; }
      ok.disabled = true;
      const [fbEl, said] = fbWait('t.check.ok', true);
      fbHost.replaceChildren(fbEl);
      seq(async alive => {
        tr.set('t.read', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('t.E3', 1, 1.2); await Promise.all([said, wait(1.4)]); if (!alive()) return;
        stepN = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.check'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    const el = voiced(id);
    if (cd) el.innerHTML += ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`;
    c.append(el, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jordan doubles =====================
function partProve(): void {
  tr.reset('p.');
  const R = lineModel('p.', RENT, () => ({
    ghost: { x: 4, y: 68, k: tr.k('p.ghost') }, ray: { x: 2, y: 34, k: tr.k('p.ray') },
    ring: [{ i: 1, col: 'link', k: tr.k('p.ring') }],
    row: tr.k('p.rowK') > 0 ? 1 : undefined, rowCol: 'link', rowK: tr.k('p.rowK'),
  }));
  const L = stack([
    { key: 'p.J', tex: `34 \\times 2 = 68`, size: 76, col: 'dim' },
    { key: 'p.E1', tex: `8 \\cdot 4 + 18 = \\cssId{v}{50}`, size: 76, tags: { v: lime } },
    { key: 'p.E2', tex: `C = \\cssId{m}{8h} + \\cssId{b}{18}`, size: 84, tags: { m: teal, b: amber } },
    { key: 'p.E3', tex: `(0,\\ \\cssId{b}{18}) \\ne (0,\\ 0)`, size: 76, tags: { b: amber } },
  ], 150, 56);
  const J = L[0]!;
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k <= 0) return;
    const b = texBox(J.F, J.x, J.y, { size: J.size, align: 'left' });
    strike(c, b.x0 - 12, b.cy + 6, b.x1 + 12, b.cy - 6, k, { col: 'wrong' });
  };
  setScene({ model: R.draw, lines: L, leads: [], extra });
  tr.set('p.table', 1, 1.4); tr.set('p.axes', 1, 1.0, 0.5); tr.set('p.points', 1, 1.2, 1.2); tr.set('p.line', 1, 1.4, 2.0); tr.set('p.J', 1, 1.0, 2.8);
  const CHIPS = [
    { t: 'The table says 4 hours cost $50, not $68.', fits: 0 },
    { t: 'The $18 fee is paid once: only the 8h part doubles.', fits: 1 },
    { t: 'Its line meets the cost axis at 18, not at (0, 0).', fits: 2 },
    { t: 'Every straight line is proportional.', fits: -1, mc: MC.propo, id: 'p.no.prop' },
    { t: 'The cost goes up every hour, so twice the hours means twice the cost.', fits: -1, mc: MC.scaleProp, id: 'p.no.scale' },
  ];
  const CLAIMS = [
    `Jordan’s <b>$68</b> for 4 hours is wrong,`,
    `Doubling the hours does not double the cost,`,
    `So <b class="s"><i>C</i> = 8<i>h</i> + 18</b> is linear, but not proportional,`,
  ];
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
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.ray', 1, 1.4); tr.set('p.ghost', 1, 0.8, 1.0); await wait(2.2); if (!alive()) return;
        tr.set('p.rowK', 1, 0.5); tr.set('p.ring', 1, 0.6); tr.set('p.E1', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('p.J:dim', 1, 0.5); tr.set('p.rowK', 0, 0.5); tr.set('p.ring', 0, 0.5);
      }
      if (n === 2) { tr.set('p.E1:dim', 1, 0.5); tr.set('p.back', 1, 1.4); await wait(1.4); if (!alive()) return; tr.set('p.start', 1, 0.8); tr.set('p.E2', 1, 1.1); await wait(1.3); }
      if (n === 3) {
        tr.set('p.E2:dim', 1, 0.5); tr.set('p.ghost', 0, 0.6); tr.set('p.E3', 1, 1.1); await wait(1.3); if (!alive()) return;
        tr.set('p.ray', 0.35, 0.8);
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: 2 hours cost $34, so 4 hours cost $68. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.scaleProp : undefined });
    proofHost.replaceChildren(right ? voiced('p.test') : voiced('p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as LFItem),
  });
}
function showItem(item: LFItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.lf;
  const made = pic ? tryBlock(() => LineModel(pic.lm, MF, th)) : null;
  if (pic && made && made.ok) {
    const M = made.value;
    const P = progressOf<LMStep>(s => tr.k('x.' + s));
    const focus = (): LMFocus => ({
      ray: pic.ray ? { ...pic.ray, k: tr.k('x.ray') } : undefined,
      ghost: pic.ghost ? { ...pic.ghost, k: tr.k('x.ghost') } : undefined,
      row: pic.row !== undefined && tr.k('x.rowK') > 0 ? pic.row : undefined, rowCol: 'link', rowK: tr.k('x.rowK'),
    });
    const specs: Spec[] = [{ key: 'x.B', tex: item.board, size: 80 }, ...(pic.pre ?? []).map(t => ({ key: 'x.B', tex: t, size: 70 })),
      ...(pic.tex ?? []).map((t, i) => ({ key: `x.T${i}`, tex: t, size: 66, col: 'link' as Paint }))];
    const lines = stack(specs, 130, 40).filter(L => L.y < 1000);
    setScene({ model: c => M.draw(c, P, focus()), lines, leads: [] });
    pic.show.forEach((s, i) => tr.set('x.' + s, 1, 0.9, 0.15 * i));
    tr.set('x.B', 1, 0.8, 0.3);
    return {
      solve: async alive => {
        for (const s of pic.hide ?? []) tr.set('x.' + s, 0, 0.6);
        if (pic.row !== undefined) tr.set('x.rowK', 1, 0.5);
        for (const s of pic.solve) { tr.set('x.' + s, 1, 1.3); await wait(1.1); if (!alive()) return; }
        if (pic.ray) { tr.set('x.ray', 1, 1.0); await wait(0.8); if (!alive()) return; }
        if (pic.ghost) { tr.set('x.ghost', 1, 0.8); await wait(0.6); if (!alive()) return; }
        for (let i = 0; i < (pic.tex ?? []).length; i++) { tr.set(`x.T${i}`, 1, 1.0); await wait(0.9); if (!alive()) return; }
      },
    };
  }
  // no picture (or it would not fit): the board notation big on a wide slate, the solution under it
  const big = box(200, 180, 1720, 900);
  const top = bigLine('x.B', item.board, box(big.x0, big.y0, big.x1, big.y0 + 300), 130);
  const sol = (item.slateTex ?? []).filter(Boolean).map((t, i) => bigLine(`x.T${i}`, t, box(big.x0, big.y0 + 300 + i * 180, big.x1, big.y0 + 480 + i * 180), 100));
  for (const L of sol) L.col = 'link';
  setScene({ lines: [top, ...sol], leads: [], boardBox: big });
  tr.set('x.B', 1, 0.8, 0.1);
  return { solve: sol.length ? async alive => { for (let i = 0; i < sol.length; i++) { tr.set(`x.T${i}`, 1, 1.0); await wait(0.9); if (!alive()) return; } } : undefined };
}

void runLesson({
  slug: SLUG,
  warm: ['m = \\dfrac{50 - 34}{4 - 2} = 8', '\\checkmark', '\\text{at}\\ h = 0', 'C = 8h + 18', '\\ne \\to \\Rightarrow \\le \\dots \\quad \\cdot \\times'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
