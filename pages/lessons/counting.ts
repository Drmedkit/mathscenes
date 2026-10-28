// counting.ts: "Counting: permutations and combinations" (HS Statistics 4, HSS-CP.B.9) on the shared lesson runtime.
//   1 The question   Five friends need a 3-person committee (no roles). How many committees? Cards: 60 (5 × 4 × 3, the
//                    orders counted: counts-orders-as-different), 10, 20 (5 × 4 × 3 ÷ 3: divides by r, not r!) + how sure
//   2 Worked example on CountPic: give them roles first (slots 5 × 4 × 3 = 60 ordered slates), list the 60 slates as
//                    10 rows of 6 (one row per committee), the swap test: each committee is 3! = 6 slates, divide:
//                    60 / 6 = 10 = C(5, 3); one "why?" with 3 reasons
//   3 Your turn      7 runners: podium 7 × 6 × 5 = 210 (typed), orders of one trio 3! = 6 (typed), trios that advance
//                    to state 210 / 6 = 35 (typed), faded from the end; callback to the card
//   4 Prove it       Jo: "more ways to pick the 5 starters than the 2 on the bench". Tokens + a matching list; a
//                    because-chain (one-to-one: each starting five leaves one bench pair and back), decoys = catalogue
//                    misconceptions; C(7, 5) = C(7, 2) = 21
//   5 Practice       all 25 sub-goals in topic order, then mixed (runtime/practice.ts); CountPic pictures, the hidden
//                    counts / the rest of a tree / the "only" regions come in on the replay after a miss
// Voiced lines: pages/lessons/counting/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { CountPic, type CountPicBlock, type CFocus, type CPic } from '../../src/lesson/topics/counting/CountPic';
import { FAMILY_NAMES, GENERATORS, MC, type CItem } from '../../src/lesson/topics/counting/items';
import { PLAN } from '../../src/lesson/topics/counting/plan';
import { explain } from '../../src/lesson/topics/counting/explain';
import { combs, perms } from '../../src/lesson/topics/counting/count';
import LINES from './counting/voice/lines.json';

const SLUG = 'counting';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== the stage: picture cards on the left, the board on the right =====================
const PF = frame(50, 70, 1140, 940);
type Painter = (c: Canvas) => void;
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, tags, col };
}
const lime = { col: 'link' as Paint }, amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint };
interface Card { B: CountPicBlock; pre: string; focus?: () => CFocus; alpha?: () => number }
function cardsScene(cards: Card[], lines: Line[], extra?: Painter): void {
  setScene({
    table: 1080, lines, leads: [], extra,
    model: c => {
      for (const cd of cards) {
        const a = cd.alpha ? cd.alpha() : 1;
        if (a <= 0) continue;
        c.g.save(); c.g.globalAlpha *= a;
        cd.B.draw(c, progressOf(s => tr.k(cd.pre + s)), cd.focus?.());
        c.g.restore();
      }
    },
  });
}
interface Rows { key: string; src: string; y: number; tags?: Record<string, { col: Paint }>; col?: Paint; size?: number }
const boardOf = (rows: Rows[]) => rows.map(r => centred(r.key, r.src, r.y, r.size ?? 70, r.tags, r.col));
/** turn on every step of a card (except the ones a solve or a beat brings in) */
function showAll(B: CountPicBlock, pre: string, skip: readonly string[] = [], d = 0.9, delay = 0): void {
  B.steps.forEach((s, i) => { if (!skip.includes(s)) tr.set(pre + s, 1, d, delay + i * 0.18); });
}

// ===================== the lesson's data =====================
const FRIENDS = ['Ana', 'Ben', 'Cy', 'Dev', 'Eli'];
const INIT = FRIENDS.map(f => f[0]!);
/** the 60 ordered slates (president, VP, secretary) as 10 rows, one per committee, its 6 orders in a row */
const GROUPS = combs(INIT, 3);
const SLATE_ROWS = GROUPS.map(g => ({ label: `{${g.join(',')}}`, chips: perms(g, 3).map(p => p.join('')) }));
if (SLATE_ROWS.length !== 10 || SLATE_ROWS.some(r => r.chips.length !== 6)) throw new Error('counting: the slate grid must be 10 x 6');
const RUNNERS = 7, TRIO = 3;

// ===================== 1. The question =====================
const CARDS = [
  { v: '60', sub: '5 × 4 × 3: fill three spots', id: MC.ordersDiff, why: 'q.cb.orders', val: 60 },
  { v: '10', sub: 'each group counted once', id: '', why: 'q.cb.right', val: 10 },
  { v: '20', sub: '5 × 4 × 3 ÷ 3 people', id: MC.divByR, why: 'q.cb.byr', val: 20 },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = CountPic({ kind: 'tokens', names: FRIENDS, title: 'the club' }, PF, th);
  const lines = boardOf([
    { key: 'q.L1', src: '5 \\text{ friends}', y: 220 },
    { key: 'q.L2', src: '\\text{committee of } 3', y: 340 },
    { key: 'q.L3', src: '\\text{how many?}', y: 480, col: 'pick' },
  ]);
  cardsScene([{ B, pre: 'q.', focus: () => ({ on: { idx: [0, 2, 3], col: 'link', k: tr.k('q.hot') } }) }], lines);
  showAll(B, 'q.', [], 0.9, 0.2);
  tr.set('q.L1', 1, 0.8, 1.2); tr.set('q.L2', 1, 0.8, 1.6); tr.set('q.L3', 1, 0.8, 2.0); tr.set('q.hot', 1, 0.7, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Five friends choose a 3-person committee (no roles). How many committees?', response: c.val, expected: 10, correct: c.val === 10, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>${cd.sub}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'A committee of three'),
    voiced('q.intro', `Five friends, Ana, Ben, Cy, Dev and Eli, run a club. They need a <b>3-person committee</b> to plan the spring trip. No titles: the three just serve on it. How many different committees are possible? Pick one, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const F = CountPic({ kind: 'tokens', names: FRIENDS }, frame(50, 70, 1140, 360), th);
  const S = CountPic({ kind: 'slots', title: 'give them roles first', rows: [{ slots: [{ role: 'president', n: 5, fill: 'Ben' }, { role: 'vice pres.', n: 4, fill: 'Dev' }, { role: 'secretary', n: 3, fill: 'Ana' }] }] }, frame(50, 460, 1140, 550), th);
  const G = CountPic({ kind: 'grid', title: 'all 60 ordered slates', rows: SLATE_ROWS }, PF, th);
  const D = CountPic({ kind: 'slots', title: 'ordered count ÷ orders of one group', rows: [{ slots: [{ role: 'president', n: 5 }, { role: 'vice pres.', n: 4 }, { role: 'secretary', n: 3 }] }], div: [{ role: '1st', n: 3 }, { role: '2nd', n: 2 }, { role: '3rd', n: 1 }] }, PF, th);
  const lines = boardOf([
    { key: 'e.L1', src: '5 \\times 4 \\times 3 = \\cssId{v}{60}', y: 150, tags: { v: amber } },
    { key: 'e.L1b', src: '\\text{ordered slates}', y: 235, col: 'dim', size: 60 },
    { key: 'e.L2', src: '\\text{10 rows} \\times \\text{6 orders}', y: 360, size: 64 },
    { key: 'e.L3', src: '3! = 3 \\times 2 \\times 1 = \\cssId{v}{6}', y: 480, tags: { v: teal } },
    { key: 'e.L4', src: '\\dfrac{60}{3!} = \\dfrac{60}{6} = \\cssId{v}{10}', y: 640, tags: { v: lime } },
    { key: 'e.L5', src: '\\binom{5}{3} = \\dfrac{5 \\times 4 \\times 3}{3!} = \\cssId{v}{10}', y: 830, tags: { v: lime } },
  ]);
  const ringRow = () => ({ rows: [{ i: [0], col: 'link' as Paint, k: tr.k('e.row0') }, { i: GROUPS.map((_, i) => i), col: 'second' as Paint, k: tr.k('e.allrows') }], ring: [{ key: 'row.0', col: 'link' as Paint, k: tr.k('e.ring0') }] });
  cardsScene([
    { B: F, pre: 'e.F.', alpha: () => 1 - tr.k('e.toGrid'), focus: () => ({ on: { idx: [1, 3, 0], col: 'pick', k: tr.k('e.S.fill') } }) },
    { B: S, pre: 'e.S.', alpha: () => 1 - tr.k('e.toGrid') },
    { B: G, pre: 'e.G.', alpha: () => tr.k('e.toGrid') * (1 - tr.k('e.toDiv')), focus: ringRow },
    { B: D, pre: 'e.D.', alpha: () => tr.k('e.toDiv') },
  ], lines);
  showAll(F, 'e.F.', [], 0.8, 0.2); showAll(S, 'e.S.', ['fill'], 0.8, 0.8);
  let step = 0;
  const STEPS = [
    { t: 'Give them roles first', why: 'Roles make every order count.', act: 'Slots' },
    { t: 'List every ordered slate', why: 'One row per group of three.', act: 'List' },
    { t: 'Swap test: one group, many slates', why: 'How often is each committee counted?', act: 'Swap' },
    { t: 'Divide out the orders', why: 'Each committee once.', act: 'Divide' },
  ];
  const SAY = [
    `Pretend the three get roles: president, vice president, secretary. 5 choices for president, then 4 left, then 3: <b class="a">5 × 4 × 3 = 60</b> ordered slates, like Ben, Dev, Ana.`,
    `Here are all 60 slates, sorted: each row holds the 6 slates made from the same three friends. 10 rows of 6.`,
    `Swap test: ABC and BCA are different slates but the <b>same committee</b>. Three people can be ordered in <b class="b">3! = 3 × 2 × 1 = 6</b> ways, so every committee is counted exactly 6 times.`,
    `So divide by 3!, not by 3: <b class="s">60 ÷ 6 = 10 committees</b>. That is C(5, 3): the ordered count over the r! orders of each group.`,
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
      if (i === 0) {
        tr.set('e.S.fill', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); tr.set('e.L1b', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.toGrid', 1, 0.8); tr.set('e.G.card', 1, 0.6);
        await wait(0.6); if (!alive()) return;
        for (let r = 0; r < SLATE_ROWS.length; r++) { tr.set(`e.G.r${r}`, 1, 0.6); await wait(0.22); if (!alive()) return; }
        tr.set('e.L2', 1, 0.8); await wait(1.0); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.row0', 1, 0.7); tr.set('e.ring0', 1, 0.7); await wait(1.0); if (!alive()) return;
        tr.set('e.G.lab', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L3', 1, 0.9); await wait(1.2); if (!alive()) return;
      } else {
        tr.set('e.ring0', 0, 0.5); tr.set('e.allrows', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.L4', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('e.toDiv', 1, 0.9); showAll(D, 'e.D.', [], 0.7, 0.3); await wait(2.0); if (!alive()) return;
        tr.set('e.L5', 1, 0.9); await wait(1.2); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Every committee shows up exactly 3! = 6 times among the ordered slates.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. Each group of three appears once for each of its six orders, so dividing by six counts it once.' },
      { t: 'There are 3 people on the committee, so divide by 3.', ok: false, id: 'e.why.byr', mc: MC.divByR, say: 'Three people make six orders, not three: ABC, ACB, BAC, BCA, CAB, CBA. Divide by 3! = 6.' },
      { t: 'The names are drawn one after another, so the order counts.', ok: false, id: 'e.why.order', mc: MC.keyWords, say: 'How they are picked does not matter. The committee has no roles, so ABC and CBA are the same committee.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why divide the 60 ordered slates by 6?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why divide the sixty by six?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps on the same five friends. Press each one: the picture moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: podium and trios =====================
function partTurn(): void {
  tr.reset('t.');
  const B = CountPic({ kind: 'slots', title: '400 m final, 7 runners', rows: [{ slots: [{ role: 'gold', reveal: 7 }, { role: 'silver', reveal: 6 }, { role: 'bronze', reveal: 5 }] }], div: [{ role: '1st', reveal: 3 }, { role: '2nd', reveal: 2 }, { role: '3rd', reveal: 1 }] }, PF, th);
  const lines = boardOf([
    { key: 't.L0', src: '7 \\times 6 \\times 5', y: 170 },
    { key: 't.L1', src: '= \\cssId{v}{210}', y: 270, tags: { v: amber } },
    { key: 't.L2', src: '3! = \\cssId{v}{6}', y: 430, tags: { v: teal } },
    { key: 't.L3', src: '\\dfrac{210}{6} = \\cssId{v}{35}', y: 610, tags: { v: lime } },
    { key: 't.L4', src: '\\binom{7}{3} = 35', y: 800, col: 'link' },
  ]);
  cardsScene([{ B, pre: 't.' }], lines);
  tr.set('t.card', 1, 0.8); tr.set('t.r0', 1, 1.0, 0.4); tr.set('t.x', 1, 0.6, 1.0);
  let step = 0;
  const STEPS = [
    { t: 'Slots for the podium', why: 'Done for you.' }, { t: 'Count the podiums', why: 'Your step.' },
    { t: 'Orders of one trio', why: 'Your step.' }, { t: 'Trios that go to state', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the 400 m final'), voiced('t.intro', `Seven runners race in the 400 m final. The top three get <b>gold, silver and bronze</b>, and the same top three go on to the state meet. The first step is done for you.`), plan, work);
  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    tr.set('t.n0', 1, 0.8); tr.set('t.rev', 1, 1.2); tr.set('t.L0', 1, 0.8, 0.6); await wait(2.0); if (!alive()) return;
    step = 1; drawPlan(); ask(0);
  });
  interface Ask { id: string; q: string; unit: string; right: number; wrong: [number, string, string | undefined, string][]; hint: string; okSay: string; logPrompt: string; after: (alive: () => boolean) => Promise<void> }
  const ASKS: Ask[] = [
    { id: 't.pod', q: 'How many different podiums (gold, silver, bronze) are possible?', unit: 'podiums', right: 210, logPrompt: '7 runners: how many gold-silver-bronze podiums?',
      wrong: [[343, 't.pod.keep', MC.keepAll, '343 is 7 × 7 × 7: a runner cannot win two medals. One fewer runner for each next medal.'], [21, 't.pod.nr', MC.nTimesR, '21 is 7 × 3. Multiply the choices for each medal: 7, then 6, then 5.']],
      hint: 'Multiply the three slots: 7 × 6 × 5.', okSay: 'Yes: 7 × 6 × 5 = <b class="a">210</b> podiums.',
      after: async alive => { tr.set('t.L1', 1, 0.8); await wait(1.0); if (!alive()) return; } },
    { id: 't.ord', q: 'Take one trio, say Ana, Ben and Cy. In how many orders can they fill the podium?', unit: 'orders', right: 6, logPrompt: 'One trio: in how many orders can they fill gold, silver, bronze?',
      wrong: [[3, 't.ord.three', MC.divByR, 'Three people, but more orders: 3 choices for gold, then 2 for silver, then 1: 3 × 2 × 1.']],
      hint: '3 choices for gold, 2 for silver, 1 for bronze.', okSay: 'Yes: 3! = 3 × 2 × 1 = <b class="b">6</b> orders of the same trio.',
      after: async alive => { tr.set('t.div', 1, 1.0); await wait(1.2); if (!alive()) return; tr.set('t.L2', 1, 0.8); await wait(0.9); } },
    { id: 't.trio', q: 'How many different trios can go on to the state meet (no order)?', unit: 'trios', right: 35, logPrompt: '210 podiums, 6 orders per trio: how many trios advance?',
      wrong: [[210, 't.trio.orders', MC.ordersDiff, '210 counts every trio six times, once per podium order. Going to state has no order.'], [70, 't.trio.three', MC.divByR, '70 divides by 3. Each trio appears in 3! = 6 podiums: divide by 6.']],
      hint: 'Each trio appears in 6 podiums: divide 210 by 6.', okSay: 'Yes: 210 ÷ 6 = <b class="s">35</b> trios. That is C(7, 3).',
      after: async alive => { tr.set('t.L3', 1, 0.8); await wait(0.9); if (!alive()) return; tr.set('t.L4', 1, 0.8); await wait(1.0); } },
  ];
  function ask(i: number): void {
    const A = ASKS[i]!;
    const fbHost = h('div'), inp = numInput(A.unit, () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const w = A.wrong.find(x => x[0] === r.v), right = r.v === A.right;
      ctx.store.log({ part: 'turn', item: `turn.${A.id.slice(2)}`, prompt: A.logPrompt, response: r.v, expected: A.right, correct: right, mc: right ? undefined : w?.[2] });
      if (!right) { fbHost.replaceChildren(w ? voicedFb(w[1], false, w[3]) : voicedFb(`${A.id}.no`, false, A.hint)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${A.id}.ok`, true, A.okSay));
      seq(async alive => {
        await A.after(alive); if (!alive()) return;
        step = i + 2; drawPlan();
        if (i < ASKS.length - 1) ask(i + 1); else fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced(A.id, A.q), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked 10 committees, and you were right: 60 ordered slates, each committee 6 times.',
      'q.cb.orders': 'At the start you picked 60. That counts every committee six times, once per order. Without roles: 60 ÷ 6 = 10.',
      'q.cb.byr': 'At the start you picked 20: 60 ÷ 3. Three people have six orders, not three, so it is 60 ÷ 6 = 10.',
      'q.cb.none': 'Unordered groups: count the ordered ways, then divide by the r! orders of each group.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: C(7, 5) = C(7, 2) =====================
const TEAM = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const BENCHES: [number, number][] = [[5, 6], [0, 3], [1, 4]];
function partProve(): void {
  tr.reset('p.');
  const T = CountPic({ kind: 'tokens', names: TEAM, title: '7 players: 5 start, 2 sit' }, frame(50, 70, 1140, 400), th);
  const M = CountPic({ kind: 'grid', title: 'bench pair → starting five', rows: [...BENCHES.map(([a, b]) => ({ label: `${TEAM[a]}${TEAM[b]}`, chips: TEAM.filter((_, i) => i !== a && i !== b) })), { label: '…', chips: ['…'] }] }, frame(50, 500, 1140, 510), th);
  const lines = boardOf([
    { key: 'p.S1', src: '\\text{Jo: } \\binom{7}{5} > \\binom{7}{2}', y: 150, col: 'dim' },
    { key: 'p.L1', src: '\\text{starters} \\leftrightarrow \\text{bench}', y: 330, col: 'pick', size: 64 },
    { key: 'p.L2', src: '\\binom{7}{2} = \\dfrac{7 \\times 6}{2} = \\cssId{v}{21}', y: 500, tags: { v: lime } },
    { key: 'p.L3', src: '\\binom{7}{5} = \\binom{7}{2} = \\cssId{v}{21}', y: 700, tags: { v: lime } },
  ]);
  const starters = (bi: number) => TEAM.map((_, i) => i).filter(i => !BENCHES[bi]!.includes(i));
  let cur = 0;
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); }
  };
  cardsScene([
    { B: T, pre: 'p.T.', focus: () => ({ on: { idx: starters(cur), col: 'link', k: tr.k('p.on') } }) },
    { B: M, pre: 'p.M.', focus: () => ({ rows: [{ i: [Math.min(cur, 2)], col: 'link', k: tr.k('p.rowhot') }] }) },
  ], lines, extra);
  showAll(T, 'p.T.', [], 0.8, 0.3); tr.set('p.S1', 1, 0.8, 1.4);
  const CHIPS = [
    { t: 'The 7 players split into the starters and everyone else.', fits: 0 },
    { t: 'The starters are simply the 5 who are not on the bench.', fits: 1 },
    { t: 'Two lists that match one to one have the same length.', fits: 2 },
    { t: '5 is more than 2, so choosing 5 has more ways.', fits: -1, mc: MC.compLarger, id: 'p.no.larger', say: 'Choosing 5 starters also chooses the 2 who sit. Every choice of one side is a choice of the other.' },
    { t: 'The two numbers just happen to come out the same here.', fits: -1, mc: MC.coincidence, id: 'p.no.luck', say: 'It is no accident: the match between starters and bench works for any team size.' },
    { t: 'We checked three line-ups and they matched.', fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.no.examples', say: 'Three examples do not prove it for all 21. The reason has to cover every line-up.' },
  ];
  const CLAIMS = [
    'Every starting five leaves exactly one pair on the bench,',
    'Every bench pair gives back exactly one starting five,',
    'So C(7, 5) = C(7, 2) = <b class="s">21</b>, and Jo is wrong,',
  ];
  const SAYC = [
    'Right. Watch three starting fives: each one leaves its own pair on the bench.',
    'Right. Read the list from the left: the bench pair decides the five.',
    'Right. Twenty-one bench pairs, so twenty-one starting fives.',
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
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) {
        for (let b = 0; b < BENCHES.length; b++) {
          cur = b; tr.jump('p.on', 0); tr.set('p.on', 1, 0.7); await wait(1.3); if (!alive()) return;
        }
        tr.set('p.L1', 1, 0.8);
      }
      if (n === 2) {
        cur = 0; tr.set('p.M.card', 1, 0.6);
        for (let r = 0; r < 4; r++) { tr.set(`p.M.r${r}`, 1, 0.6, r * 0.25); }
        tr.set('p.M.lab', 1, 0.8, 0.4); await wait(1.6); if (!alive()) return;
        for (let b = 0; b < BENCHES.length; b++) { cur = b; tr.jump('p.rowhot', 0); tr.set('p.rowhot', 1, 0.5); tr.jump('p.on', 0); tr.set('p.on', 1, 0.6); await wait(1.2); if (!alive()) return; }
        tr.set('p.L2', 1, 0.8);
      }
      if (n === 3) {
        tr.set('p.L3', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: choosing the r to take is the same as choosing the n − r to leave. C(n, r) = C(n, n − r), for every n and r.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jo is right', () => judge(true)), no = btn('Jo is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jo: more ways to choose the 5 starters than the 2 on the bench. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.compLarger : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `A basketball team has 7 players: 5 start the game and 2 sit on the bench. Jo says: “There are more ways to choose the 5 starters than the 2 on the bench, because 5 is more than 2.” Is Jo right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CItem),
  });
}
/** the item's board TeX as lines (split at \qquad), centred in `area` */
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = src.split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  if (!parts.length) return [];
  let sz = size;
  while (sz > 60 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 90)) sz -= 2;
  const hs = parts.map(p0 => { const F = tex(p0) as Formula; return Math.max(1, (F.bottom - F.top) / 1000) * sz; });
  const gap = Math.min(sz * 1.5, (area.h - 60) / parts.length);
  const total = hs.reduce((s, x) => s + Math.max(x, gap), 0);
  let y = area.cy - total / 2;
  return parts.map((p0, i) => { const hh = Math.max(hs[i]!, gap); const L = centred(`x.B${i}`, p0, y + hh / 2, sz, undefined, undefined, area.cx, area.w - 90); y += hh; return L; });
}
/** the steps a replay brings in (hidden counts, the rest of a tree, the "only" regions) */
const SOLVE_STEPS = ['rev', 'rest'];
function showItem(item: CItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pics = (item.picture?.pics ?? []) as CPic[];
  const blocks: { B: CountPicBlock; pre: string }[] = [];
  if (pics.length) {
    const w = item.picture?.weights ?? pics.map(() => 1), tot = w.reduce((a, b) => a + b, 0), gap = 30;
    let y = PF.y;
    const ok = pics.every((p, i) => {
      const hh = ((PF.h - gap * (pics.length - 1)) * w[i]!) / tot;
      const fr: Frame = frame(PF.x, y, PF.w, hh); y += hh + gap;
      const m = tryBlock(() => CountPic(p, fr, th));
      if (!m.ok) { console.warn(m.error); return false; }
      blocks.push({ B: m.value, pre: `x.${i}.` });
      return true;
    });
    if (!ok) blocks.length = 0;
  }
  if (!blocks.length) {
    const big = box(200, 160, 1720, 920);
    const lines = boardLines(item.board || '\\text{?}', big, 110);
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.2));
    return {};
  }
  const lines = boardLines(item.board, box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 620), 76);
  cardsScene(blocks.map(b => ({ B: b.B, pre: b.pre })), lines);
  blocks.forEach((b, i) => showAll(b.B, b.pre, SOLVE_STEPS, 0.8, 0.1 + i * 0.4));
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + i * 0.2));
  const solveKeys = blocks.flatMap(b => b.B.steps.filter(s => SOLVE_STEPS.includes(s)).map(s => b.pre + s));
  return {
    solve: solveKeys.length ? async alive => {
      for (const k of solveKeys) { tr.set(k, 1, 1.2); await wait(0.6); if (!alive()) return; }
      await wait(1.0);
    } : undefined,
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\binom{7}{5} = \\dfrac{5 \\times 4 \\times 3}{3!} \\quad \\text{starters} \\leftrightarrow \\text{bench} \\quad {}_{9}C_{4} \\quad 10{,}000'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
