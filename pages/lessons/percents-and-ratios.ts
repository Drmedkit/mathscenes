// percents-and-ratios.ts: "Combine percents and ratios in one problem" (grade 7, 7.RP.A.3) on the shared lesson runtime.
//   1 The question   $240 budget, art : music = 3 : 5, art spends 20% of its share on paint: 3 cards ($18 right,
//                    $48 = 20% of the whole budget, $28.80 = reads 3 : 5 as three fifths) + how sure
//   2 Worked example four subgoal steps on the chain tape: label and plan (each step's whole), share the budget, zoom
//                    into art's share (the new 100%) and take 20%, check against the relationships; one "why?"
//   3 Your turn      trail mix 36 oz, nuts : raisins = 7 : 2, 25% of the nuts are almonds, faded from the end: the kid
//                    names the whole of the percent step, finds the almonds, checks the percent
//   4 Prove it       Maya adds the percents (25% off, 8% tax on the sale price -> "17% off"): judge, then a
//                    because-chain from reason chips (distractors = catalogue misconceptions); the tapes back each claim
//   5 Practice       all 14 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/percents-and-ratios/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { box, type Box } from '../../src/core/math';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ChainTape, type ChainBlock, type ChainFocus, type ChainParams } from '../../src/lesson/topics/percents-and-ratios/ChainTape';
import { CHAIN_FRAME, EX, EX_CARDS, EX_CHAIN, PBOARD, PROVE_CHAIN, PROVE_MAYA, TURN, TURN_CHAIN } from '../../src/lesson/topics/percents-and-ratios/scenes';
import { FAMILY_NAMES, GENERATORS, MC, type PRItem } from '../../src/lesson/topics/percents-and-ratios/items';
import { PLAN } from '../../src/lesson/topics/percents-and-ratios/plan';
import LINES from './percents-and-ratios/voice/lines.json';

const SLUG = 'percents-and-ratios';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML shown is the line's text with colour marks; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.info('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { say(id); return feedback(ok, htmlText); }

// ===================== the board (wider than the default: x 1070..1860) =====================
const PLX = PBOARD.x0 + 52, PBW = PBOARD.w - 104;
type Tags = Record<string, { col: Paint }>;
/** a line of TeX on the wide board, left-aligned, shrunk to fit (never under 60 px) */
function bl(key: string, src: string, y: number, size = 64, tags?: Tags, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > PBW) s -= 2;
  return { key, F, x: PLX, y, size: s, tags, col };
}
const amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lime = { col: 'link' as Paint }, lav = { col: 'pick' as Paint };
const lineBox = (L: Line): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
/** a chain scene: the tape block + board lines; keys of the block are `<pre><key>` on the track */
function chainScene(pre: string, chain: ChainParams, lines: Line[], focus: () => ChainFocus = () => ({}), extra?: (c: Canvas) => void): ChainBlock {
  const m = ChainTape(chain, CHAIN_FRAME);
  setScene({ model: c => m.draw(c, k => tr.k(pre + k), focus()), lines, leads: [], boardBox: PBOARD, extra, table: 880 });
  return m;
}
const on = (pre: string, keys: readonly string[], d = 0.8, delay = 0, stagger = 0) => keys.forEach((k, i) => tr.set(pre + k, 1, d, delay + i * stagger));
const ROW0 = ['r0', 't0', 'L0'], SPLIT0 = ['s0', 'u0', 'n0.0', 'n0.1'];

// ===================== 1. The question =====================
const CARDS = [
  { v: EX_CARDS.whole, t: '$48', id: MC.wrongWhole, why: 'q.cb.whole' },
  { v: EX_CARDS.right, t: '$18', id: '', why: 'q.cb.right' },
  { v: EX_CARDS.other, t: '$28.80', id: MC.otherPart, why: 'q.cb.other' },
];
function storyLines(pre: string): Line[] {
  return [
    bl(pre + 'S1', `\\cssId{a}{\\$${EX.T}}\\ \\text{budget}`, 170, 64, { a: amber }),
    bl(pre + 'S2', `\\text{art} : \\text{music} = \\cssId{r}{${EX.a} : ${EX.b}}`, 290, 64, { r: teal }),
    bl(pre + 'S3', `\\text{paint} = ${EX.p}\\%\\ \\text{of art's share}`, 410, 64),
    bl(pre + 'S4', '\\text{paint} = \\,?', 530, 64),
  ];
}
function partQuestion(): void {
  tr.reset('q.');
  chainScene('q.', EX_CHAIN, storyLines('q.'));
  on('q.', ROW0, 0.9, 0.2, 0.3); on('q.', SPLIT0, 0.8, 1.4, 0.2);
  ['S1', 'S2', 'S3', 'S4'].forEach((k, i) => tr.set('q.' + k, 1, 0.9, 0.6 + i * 0.7));
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A $240 budget is split art : music = 3 : 5. Art spends 20% of its share on paint. How much is that?', board: 'paint = 20% of art’s share', response: c.v, expected: EX_CARDS.right, correct: c.v === EX_CARDS.right, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>for paint</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Paint money'),
    voiced('q.intro', `A club splits its <b class="a">$240</b> budget between art and music in the ratio <b class="b">3 : 5</b>. Art spends <b>20%</b> of its share on paint. How much does art spend on paint? Pick an answer, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
function exampleLines(pre: string): Line[] {
  return [
    bl(pre + 'P', `\\cssId{t}{\\$${EX.T}} \\xrightarrow{\\cssId{r}{${EX.a}:${EX.b}}} \\cssId{a}{\\text{art}} \\xrightarrow{\\cssId{p}{${EX.p}\\%}} \\cssId{q}{\\text{paint}}`, 160, 64, { t: amber, r: teal, a: teal, p: lav, q: lime }),
    bl(pre + 'W', `\\cssId{h}{100\\%} = \\cssId{a}{\\text{art's share}}`, 262, 62, { h: lav, a: teal }),
    bl(pre + 'E1', `${EX.T} \\div ${EX.a + EX.b} = ${EX.T / (EX.a + EX.b)}`, 390, 64),
    bl(pre + 'E2', `\\text{art} = ${EX.a} \\times ${EX.T / (EX.a + EX.b)} = \\cssId{v}{90}`, 485, 64, { v: amber }),
    bl(pre + 'E3', `\\text{paint} = 0.2 \\times 90 = \\cssId{v}{18}`, 610, 64, { v: lime }),
    bl(pre + 'K1', `18 \\div 90 = 0.2 = 20\\%\\ \\cssId{ok}{\\checkmark}`, 740, 62, { ok: lime }),
    bl(pre + 'K2', `90 + 150 = 240\\ \\cssId{ok}{\\checkmark}`, 830, 62, { ok: lime }),
    bl(pre + 'K3', `90 : 150 = 3 : 5\\ \\cssId{ok}{\\checkmark}`, 920, 62, { ok: lime }),
  ];
}
function partExample(): void {
  tr.reset('e.');
  const L = exampleLines('e.');
  chainScene('e.', EX_CHAIN, L, () => ({
    hi: [{ r: 0, j: 0, col: 'second', k: tr.k('e.hiA') }, { r: 1, j: 0, col: 'link', k: tr.k('e.hiP') }, { r: 0, j: 1, col: 'dim', k: tr.k('e.hiM') }],
    ghosts: [{ r: 0, a: 0, b: EX_CARDS.whole, text: '$48', col: 'wrong', k: tr.k('e.gW') }],
  }));
  for (const k of ROW0) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Label the steps and plan', why: 'Which steps, which wholes, which order?', act: 'Plan it' },
    { t: 'Share the budget', why: 'The ratio step: 3 : 5.', act: 'Share it' },
    { t: 'Take 20% of the new whole', why: 'Art’s share is now 100%.', act: 'Zoom in' },
    { t: 'Check it', why: 'Test the answer against the story.', act: 'Check' },
  ];
  const SAY = [
    `<b class="b">3 : 5</b> is a ratio step: it shares the budget. <b>20%</b> is a percent step, and its whole is <b class="b">art’s share</b>, not the $240. The percent step needs art’s share, so the ratio step goes first.`,
    `3 + 5 = 8 equal parts, and $240 ÷ 8 = $30 a part. Art gets 3 parts: <b class="a">$90</b>. Music gets the other 5: $150.`,
    `Art’s <b class="a">$90</b> is the new whole: it fills the whole tape, 100%. 20% of it is 0.2 × 90 = <b class="s">$18</b> for paint.`,
    `Check against the story, not by redoing the arithmetic: $18 is 20% of $90. And $90 and $150 add to $240, in the ratio 3 : 5.`,
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  const set = (k: string, v = 1, d = 0.9, del = 0) => tr.set('e.' + k, v, d, del);
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        set('s0', 1, 1.0); set('u0', 1, 0.8, 0.5); set('n0.0', 1, 0.6, 1.0); set('n0.1', 1, 0.6, 1.2); await wait(1.6); if (!alive()) return;
        set('P', 1, 1.6); await wait(1.7); if (!alive()) return;
        set('hiA', 1, 0.5); set('W', 1, 1.0); await wait(1.8); if (!alive()) return;
        set('hiA', 0, 0.6);
      } else if (i === 1) {
        set('P:dim', 1, 0.5); set('W:dim', 1, 0.5);
        set('E1', 1, 1.0); await wait(1.3); if (!alive()) return;
        set('v0.0', 1, 0.7); set('hiA', 1, 0.5); set('E2', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        set('v0.1', 1, 0.7); set('hiA', 0, 0.6, 0.6); await wait(1.0);
      } else if (i === 2) {
        set('E1:dim', 1, 0.5); set('E2:dim', 1, 0.5);
        set('z1', 1, 1.4); set('r1', 1, 1.2, 0.8); set('t1', 1, 0.6, 1.6); set('L1', 1, 0.6, 1.8); await wait(2.4); if (!alive()) return;
        set('h1', 1, 0.6); set('k1', 1, 0.8, 0.2); await wait(1.2); if (!alive()) return;
        set('s1', 1, 1.0); set('n1.0', 1, 0.6, 0.6); set('n1.1', 1, 0.6, 0.8); await wait(1.4); if (!alive()) return;
        set('hiP', 1, 0.5); set('v1.0', 1, 0.7, 0.2); set('E3', 1, 1.0, 0.3); await wait(1.8); if (!alive()) return;
        set('hiP', 0, 0.6);
      } else {
        set('E3:dim', 1, 0.5);
        set('hiP', 1, 0.5); set('K1', 1, 1.0, 0.2); await wait(1.6); if (!alive()) return;
        set('hiP', 0, 0.5); set('hiA', 1, 0.5); set('hiM', 1, 0.5); set('K2', 1, 1.0, 0.2); await wait(1.4); if (!alive()) return;
        set('K3', 1, 1.0); await wait(1.4); if (!alive()) return;
        set('hiA', 0, 0.6); set('hiM', 0, 0.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 20% is of art’s share, so art’s $90 is the whole (100%) for that step.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. Every percent step has its own whole. This one is art’s share.' },
      { t: 'The $240 is the whole of the problem, so every percent is of $240.', ok: false, id: 'e.why.whole', mc: MC.wrongWhole, say: 'Look at the top tape: 20% of $240 is $48, more than half of art’s $90. The story says 20% of art’s share.' },
      { t: 'The ratio came first in the story, so its answer is used next.', ok: false, id: 'e.why.order', mc: MC.mentionOrder, say: 'Story order isn’t the reason. The percent step says “of its share”, so it needs art’s share. That sets the order.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the paint 20% of $90, not 20% of $240?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.id === 'e.why.whole') { set('h0', 1, 0.6); set('k0', 1, 0.6); set('gW', 1, 0.8, 0.4); } else { set('gW', 0, 0.5); set('h0', 0, 0.5); set('k0', 0, 0.5); }
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why is the paint 20% of $90, and not 20% of $240?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the tapes move first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: trail mix (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const u = TURN.T / (TURN.a + TURN.b), nuts = TURN.a * u;
  const L = [
    bl('t.P', `\\cssId{t}{${TURN.T}} \\xrightarrow{\\cssId{r}{${TURN.a}:${TURN.b}}} \\cssId{a}{\\text{nuts}} \\xrightarrow{\\cssId{p}{${TURN.p}\\%}} \\cssId{q}{\\text{almonds}}`, 160, 64, { t: amber, r: teal, a: teal, p: lav, q: lime }),
    bl('t.E1', `${TURN.T} \\div ${TURN.a + TURN.b} = ${u}`, 290, 64),
    bl('t.E2', `\\text{nuts} = ${TURN.a} \\times ${u} = \\cssId{v}{${nuts}}`, 385, 64, { v: amber }),
    bl('t.W', `\\cssId{h}{100\\%} = \\cssId{a}{\\text{nuts}}`, 505, 64, { h: lav, a: teal }),
    bl('t.E3', `\\text{almonds} = 0.25 \\times ${nuts} = \\cssId{v}{7}`, 625, 64, { v: lime }),
    bl('t.K1', `7 \\div ${nuts} = 0.25 = 25\\%\\ \\cssId{ok}{\\checkmark}`, 755, 62, { ok: lime }),
  ];
  chainScene('t.', TURN_CHAIN, L, () => ({
    hi: [{ r: 0, j: 0, col: 'second', k: tr.k('t.hiN') }, { r: 1, j: 0, col: 'link', k: tr.k('t.hiA') }],
    ghosts: [{ r: 0, a: 0, b: TURN.T * TURN.p / 100, text: '9 oz', col: 'wrong', k: tr.k('t.gW') }],
    ask: [{ r: 1, j: 0, k: 1 - tr.k('t.rev') }],
  }));
  on('t.', ROW0, 0.9, 0.2, 0.3);
  let step = 0;
  const STEPS = [
    { t: 'Label the steps and plan', why: 'Done for you.' },
    { t: 'Share the trail mix', why: 'Done for you: 7 : 2.' },
    { t: 'Take 25% of the right whole', why: 'Your step.' },
    { t: 'Check it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: trail mix'), voiced('t.intro', `A bag holds <b class="a">36 oz</b> of trail mix, nuts to raisins <b class="b">7 : 2</b>. <b>25%</b> of the nuts are almonds. How many ounces of almonds? The first two steps are done for you.`), plan, work);
  const set = (k: string, v = 1, d = 0.9, del = 0) => tr.set('t.' + k, v, d, del);
  seq(async alive => {
    await wait(4.0); if (!alive()) return;
    set('s0', 1, 1.0); set('u0', 1, 0.8, 0.5); set('n0.0', 1, 0.6, 1.0); set('n0.1', 1, 0.6, 1.2); set('P', 1, 1.6, 0.6); await wait(2.6); if (!alive()) return;
    step = 1; drawPlan();
    set('P:dim', 1, 0.5); set('E1', 1, 1.0); await wait(1.2); if (!alive()) return;
    set('v0.0', 1, 0.7); set('v0.1', 1, 0.7, 0.3); set('E2', 1, 1.0, 0.2); await wait(1.6); if (!alive()) return;
    step = 2; drawPlan(); askWhole();
  });
  function askWhole(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'The 28 oz of nuts', ok: true, id: 't.whole.ok', mc: undefined as string | undefined, say: 'Yes: “25% of the nuts”. The 28 oz of nuts is 100% for this step.' },
      { t: 'The 36 oz of trail mix', ok: false, id: 't.whole.mix', mc: MC.wrongWhole as string | undefined, say: 'Watch: 25% of 36 oz is 9 oz, a quarter of the whole bag, raisins too. The almonds are 25% of the nuts.' },
      { t: 'The 8 oz of raisins', ok: false, id: 't.whole.raisins', mc: MC.otherPart as string | undefined, say: 'The raisins are the other part. Almonds are nuts.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.whole', prompt: 'Which amount is 100% for the almonds step?', response: o.t, expected: 'The 28 oz of nuts', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (o.id === 't.whole.mix') seq(async alive => { set('gW', 1, 0.8); await wait(3.2); if (!alive()) return; set('gW', 0, 0.8); });
      if (o.id === 't.whole.raisins') seq(async alive => { set('hiN', 1, 0.5); await wait(2.2); if (!alive()) return; set('hiN', 0, 0.6); });
      if (!o.ok) return;
      done = true; set('gW', 0, 0.4);
      seq(async alive => {
        set('E1:dim', 1, 0.5); set('E2:dim', 1, 0.5); set('W', 1, 1.0);
        set('z1', 1, 1.4, 0.4); set('r1', 1, 1.2, 1.2); set('t1', 1, 0.6, 2.0); set('L1', 1, 0.6, 2.2); await wait(2.8); if (!alive()) return;
        set('h1', 1, 0.6); set('k1', 1, 0.8, 0.2); set('s1', 1, 1.0, 0.6); set('n1.0', 1, 0.6, 1.2); set('n1.1', 1, 0.6, 1.4); set('v1.0', 1, 0.6, 1.4); await wait(2.2); if (!alive()) return;
        askAlmonds();
      });
    })));
    work.replaceChildren(voiced('t.whole', 'The almonds are 25% of which amount? Pick the whole for this step.'), bx, fbHost);
  }
  function askAlmonds(): void {
    const fbHost = h('div'), inp = numInput('oz', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = v === 7;
      const mc = v === 9 ? MC.wrongWhole : v === 2 ? MC.otherPart : v === 28 ? MC.lostIntermediate : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.almonds', prompt: '25% of 28 oz of nuts = ? oz of almonds', board: 'almonds = 0.25 × 28', response: v, expected: 7, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(v === 9 ? voicedFb('t.alm.mix', false, '9 oz is 25% of the whole bag. Use the nuts: 25% of 28 oz.')
          : v === 2 ? voicedFb('t.alm.raisins', false, '2 oz is 25% of the raisins. The almonds are 25% of the nuts.')
            : v === 21 ? voicedFb('t.alm.rest', false, '21 oz is the other 75% of the nuts. The almonds are the 25%.')
              : v === 28 ? voicedFb('t.alm.nuts', false, '28 oz is all the nuts: the whole. The almonds are 25% of it.')
                : voicedFb('t.alm.no', false, '25% is one quarter. One quarter of 28 oz is?'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.alm.ok', true, 'Yes: 0.25 × 28 = 7. <b class="s">7 oz</b> of almonds.'));
      seq(async alive => { set('rev', 1, 0.6); set('hiA', 1, 0.5); set('E3', 1, 1.0, 0.2); await wait(1.6); if (!alive()) return; set('hiA', 0, 0.6); step = 3; drawPlan(); askCheck(); });
    }
    work.replaceChildren(voiced('t.alm', 'How many ounces of almonds? Use the new whole.'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div'), inp = numInput('%', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num.empty', false, 'Type a number first.')); return; }
      const right = r.v === 25 || r.v === 0.25;
      const mc = r.v === 400 || r.v === 4 ? MC.wholeByPart : Math.abs(r.v - 19.44) < 0.1 ? MC.wrongWhole : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: '7 oz is what percent of 28 oz?', response: r.v, expected: 25, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(r.v === 400 || r.v === 4 ? voicedFb('t.check.flip', false, 'That is 28 ÷ 7. The percent is part ÷ whole: 7 ÷ 28.')
          : Math.abs(r.v - 19.44) < 0.1 ? voicedFb('t.check.mix', false, 'That compares with the whole bag. Check against the nuts: 7 ÷ 28.')
            : voicedFb('t.check.no', false, 'Divide the part by its whole: 7 ÷ 28, then write it as a percent.'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.check.ok', true, '7 ÷ 28 = 0.25 = 25%. It matches the story, so <b class="s">7 oz</b> is right.'));
      seq(async alive => { set('E3:dim', 1, 0.5); set('K1', 1, 1.0); set('hiA', 1, 0.5); await wait(1.6); if (!alive()) return; set('hiA', 0, 0.6); step = 4; drawPlan(); fbHost.append(callback()); });
    }
    work.replaceChildren(voiced('t.check', 'Check it against the story: 7 oz is what percent of 28 oz?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked $18, and you were right. Now you can say why: the percent step’s whole was art’s share.',
      'q.cb.whole': 'At the start you picked $48. That is 20% of the whole budget. The paint comes out of art’s share, so its whole was $90.',
      'q.cb.other': 'At the start you picked $28.80. That reads 3 : 5 as three fifths of the budget. Art gets 3 of every 8 parts.',
      'q.cb.none': 'Name the whole of every percent step. It can be the result of the step before.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Maya adds the percents =====================
function partProve(): void {
  tr.reset('p.');
  const L = [
    bl('p.M1', '-25\\% + 8\\% = -17\\%', 160, 62, undefined, 'dim'),
    bl('p.M2', '0.83 \\times 80 = 66.40', 250, 62, undefined, 'dim'),
    bl('p.E1', `0.75 \\times 80 = \\cssId{v}{60}`, 420, 64, { v: amber }),
    bl('p.E2', `0.08 \\times 60 = \\cssId{v}{4.80}`, 520, 64, { v: teal }),
    bl('p.E3', `60 + 4.80 = \\cssId{v}{64.80}`, 620, 64, { v: lime }),
  ];
  const extra = (c: Canvas) => {
    for (const [i, key] of [[0, 'p.strike1'], [1, 'p.strike2']] as const) {
      const ks = tr.k(key); if (ks <= 0) continue;
      const b = lineBox(L[i]!); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, ks, { col: 'wrong' });
    }
  };
  chainScene('p.', PROVE_CHAIN, L, () => ({
    marks: [{ r: 2, at: PROVE_MAYA, text: '$66.40', col: 'wrong', k: tr.k('p.mk') }],
    hi: [{ r: 0, j: 1, col: 'second', k: tr.k('p.hiCut') }, { r: 1, j: 1, col: 'second', k: tr.k('p.hiTax') }],
  }), extra);
  on('p.', ROW0, 0.9, 0.2, 0.3); tr.set('p.M1', 1, 0.9, 1.4); tr.set('p.M2', 1, 0.9, 2.1);
  const set = (k: string, v = 1, d = 0.9, del = 0) => tr.set('p.' + k, v, d, del);
  const CHIPS = [
    { t: 'The 8% tax is 8% of the sale price, not of $80.', fits: 0 },
    { t: '25% off leaves 75% of $80, and 0.75 × 80 = 60.', fits: 1 },
    { t: 'The tax adds 8% of $60, which is $4.80.', fits: 2 },
    { t: 'Percent changes always add: −25% + 8% = −17%.', fits: -1, mc: MC.addsPercents, id: 'p.no.adds', say: 'They only add when both are percents of the same whole. Here the tax is a percent of the smaller sale price.' },
    { t: 'Each line of Maya’s arithmetic is right, so her answer is right.', fits: -1, mc: MC.arithmeticOk, id: 'p.no.arith', say: 'Her arithmetic is right, but her setup uses the wrong whole for the tax. Right arithmetic can’t fix a wrong setup.' },
    { t: 'Tax is always a percent of the price on the tag.', fits: -1, mc: MC.wrongWhole, id: 'p.no.tag', say: 'The story says the tax is added to the sale price. The whole is whatever the step says.' },
  ];
  const CLAIMS = [
    'Maya’s 83% uses <b>$80</b> as the whole for the tax too,',
    'The sale price is <b>$60</b>,',
    'So the total is <b class="s">$64.80</b>, not $66.40,',
  ];
  const SAYC = [
    'Right. After the discount, the whole changes. The tax’s whole is the sale price, so Maya’s lines fall apart.',
    'Right. 75% of $80 is $60. That is the new whole, 100% for the tax.',
    'Right. 8% of $60 is $4.80, so the total is $64.80. Maya’s $66.40 is too much.',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) {
        set('s0', 1, 1.0); set('k0', 1, 0.7, 0.3); set('n0.0', 1, 0.6, 0.8); set('n0.1', 1, 0.6, 1.0); set('hiCut', 1, 0.5, 1.0); await wait(2.0); if (!alive()) return;
        set('z1', 1, 1.3); set('r1', 1, 1.1, 0.7); set('t1', 1, 0.6, 1.4); set('n1.0', 1, 0.6, 1.6); await wait(2.4); if (!alive()) return;
        set('hiCut', 0, 0.6); set('strike1', 1, 0.6); set('strike2', 1, 0.6, 0.4); await wait(1.2); if (!alive()) return;
        set('M1:dim', 1, 0.5); set('M2:dim', 1, 0.5);
      }
      if (n === 2) { set('E1', 1, 1.0); set('v0.0', 1, 0.7, 0.4); set('v0.1', 1, 0.7, 0.6); set('L1', 1, 0.7, 1.0); await wait(1.8); }
      if (n === 3) {
        set('s1', 1, 1.0); set('n1.1', 1, 0.6, 0.6); set('hiTax', 1, 0.5, 0.6); set('v1.1', 1, 0.7, 0.8); set('E2', 1, 1.0, 0.6); await wait(2.2); if (!alive()) return;
        set('hiTax', 0, 0.6); set('r2', 1, 1.2); set('t2', 1, 0.6, 0.6); set('s2', 1, 0.1); set('n2.0', 1, 0.6, 1.0); set('L2', 1, 0.7, 1.2); set('E3', 1, 1.0, 1.0); await wait(2.2); if (!alive()) return;
        set('mk', 1, 0.8); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason, and the tapes back every one. Percents of different wholes can’t simply be added.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Maya is right', () => judge(true)), no = btn('Maya is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Maya: $80, 25% off, then 8% tax on the sale price: −25% + 8% = −17%, so 0.83 × 80 = $66.40. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.addsPercents : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', 'Maya buys an <b class="a">$80</b> jacket that is <b>25% off</b>. Then <b>8% sales tax</b> is added to the sale price. Maya says: “−25% and +8% make −17%, so I pay 83% of $80, which is $66.40.” Is Maya right?'),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as PRItem),
  });
}
/** every draw key of a chain */
function allKeys(chain: ChainParams): string[] {
  return chain.rows.flatMap((row, r) => [`r${r}`, `t${r}`, `L${r}`, `s${r}`, `u${r}`, `k${r}`, `h${r}`, `z${r}`, ...row.pieces.flatMap((_, j) => [`n${r}.${j}`, `v${r}.${j}`])]);
}
function showItem(item: PRItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.chain;
  const made = pic ? tryBlock(() => ChainTape(pic.chain, CHAIN_FRAME)) : null;
  if (pic && made && made.ok) {
    const m = made.value;
    const top = bl('x.B', item.board, 170, 64);
    const steps = pic.steps.map((s, i) => bl(`x.S${i}`, s, 330 + i * 110, 64));
    setScene({ model: c => m.draw(c, k => tr.k('x.' + k), { ask: pic.ask.map(q => ({ ...q, k: 1 - tr.k('x.rev') })) }), lines: [top, ...steps], leads: [], boardBox: PBOARD, table: 880 });
    tr.set('x.B', 1, 0.8, 0.1);
    pic.given.forEach(k => { const r = Number(/\d+/.exec(k)?.[0] ?? 0); tr.set('x.' + k, 1, 0.7, 0.2 + r * 0.6); });
    return {
      solve: async alive => {
        for (const k of allKeys(pic.chain)) tr.set('x.' + k, 1, 0.7, 0.2);
        tr.set('x.rev', 1, 0.6, 0.4);
        await wait(0.8);
        for (let i = 0; i < steps.length; i++) { if (!alive()) return; tr.set(`x.S${i}`, 1, 0.9); await wait(1.0); }
      },
    };
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 110)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{budget} \\xrightarrow{\\;3:5\\;} \\text{art} \\xrightarrow{\\;20\\%\\;} \\$240 \\div \\times \\checkmark', '\\overset{?}{=} \\square'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
