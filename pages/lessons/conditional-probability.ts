// conditional-probability.ts: "Conditional probability and independence" (HS Statistics 6, HSS-CP.A.1-5, B.6-8) on the
// shared lesson runtime.
//   1 The question   200 juniors, job x license (a two-way table). Pick a junior with a job: P(license)? Cards 48/200
//                    (the condition not made the new whole), 48/80 (right), 48/110 (the inverse) + how sure
//   2 Worked example on the table: read the cells and margins; the condition shrinks the whole to the Job row (amber
//                    ring, the rest dims); count inside: 48/80 = 3/5; the formula P(L and J) / P(J), the 200s cancel;
//                    one "why?" with 3 reasons
//   3 Your turn      160 students, left-handed x instrument: P(I | L) = 6/16 (typed), P(I) = 60/160 (typed), independent?
//                    (choice), faded from the end; callback to the card
//   4 Prove it       Sam: "mutually exclusive events are independent". One die, A = {1, 2}, B = {6}: a because-chain
//                    (P(A and B) = 0, P(A)P(B) = 1/18 > 0, so dependent); decoys = catalogue misconceptions
//   5 Practice       all 31 sub-goals in topic order, then mixed (runtime/practice.ts); CondPic pictures, the
//                    highlights / hidden values come in on the replay after a miss
// Voiced lines: src/lesson/topics/conditional-probability/script.ts -> voice/lines.json. Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { CondPic, type CondPicBlock, type CPic } from '../../src/lesson/topics/conditional-probability/CondPic';
import type { TableFocus } from '../../src/lesson/topics/two-way-tables/TwoWayTable';
import { FAMILY_NAMES, GENERATORS, MC, type CItem } from '../../src/lesson/topics/conditional-probability/items';
import { PLAN } from '../../src/lesson/topics/conditional-probability/plan';
import { explain } from '../../src/lesson/topics/conditional-probability/explain';
import { SCRIPT } from '../../src/lesson/topics/conditional-probability/script';
import { HAND, JOB } from '../../src/lesson/topics/conditional-probability/cp';
import LINES from './conditional-probability/voice/lines.json';

const SLUG = 'conditional-probability';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const line = (id: string): string => { const s = SCRIPT[id]; if (!s) throw new Error(`no script line ${id}`); return s.html; };
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, line(id));
}
function voicedFb(id: string, ok: boolean): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, line(id)); }

// ===================== the stage: picture card on the left, the board on the right =====================
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
interface Card { B: CondPicBlock; pre: string; table?: () => TableFocus; alpha?: () => number }
function cardsScene(cards: Card[], lines: Line[], extra?: Painter, boardBox?: Box): void {
  setScene({
    table: 1080, lines, leads: [], extra, boardBox,
    model: c => {
      for (const cd of cards) {
        const a = cd.alpha ? cd.alpha() : 1;
        if (a <= 0) continue;
        c.g.save(); c.g.globalAlpha *= a;
        cd.B.draw(c, progressOf(s => tr.k(cd.pre + s)), cd.table ? { table: cd.table() } : {});
        c.g.restore();
      }
    },
  });
}
interface Rows { key: string; src: string; y: number; tags?: Record<string, { col: Paint }>; col?: Paint; size?: number }
const boardOf = (rows: Rows[]) => rows.map(r => centred(r.key, r.src, r.y, r.size ?? 70, r.tags, r.col));
function showAll(B: CondPicBlock, pre: string, skip: readonly string[] = [], d = 0.9, delay = 0): void {
  B.steps.forEach((s, i) => { if (!skip.includes(s)) tr.set(pre + s, 1, d, delay + i * 0.25); });
}
const jobPic = (title = '200 juniors'): CPic => ({ kind: 'table', rows: ['Job', 'No job'], cols: ['License', 'No license'], cells: JOB, title });

// ===================== 1. The question =====================
const CARDS = [
  { v: '48/200', sub: '48 of all the juniors', id: MC.newWhole, why: 'q.cb.all', val: '48/200' },
  { v: '48/80', sub: '48 of the juniors with a job', id: '', why: 'q.cb.right', val: '48/80' },
  { v: '48/110', sub: '48 of the license holders', id: MC.inverse, why: 'q.cb.inv', val: '48/110' },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = CondPic(jobPic(), PF, th);
  const lines = boardOf([
    { key: 'q.L1', src: '200 \\text{ juniors}', y: 220 },
    { key: 'q.L2', src: '\\text{one with a job}', y: 360, tags: {}, col: 'first' },
    { key: 'q.L3', src: 'P(\\text{license}) = \\,?', y: 500, col: 'pick' },
  ]);
  cardsScene([{ B, pre: 'q.' }], lines);
  showAll(B, 'q.', [], 0.9, 0.2);
  tr.set('q.L1', 1, 0.8, 1.4); tr.set('q.L2', 1, 0.8, 1.8); tr.set('q.L3', 1, 0.8, 2.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '200 juniors (job x license). Pick a junior with a job: P(license)?', response: c.val, expected: '48/80', correct: c.val === '48/80', mc: c.id || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'Pick a junior with a job'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = CondPic(jobPic(), PF, th);
  const lines = boardOf([
    { key: 'e.L1', src: 'n(J \\cap L) = \\cssId{v}{48}', y: 140, tags: { v: lime } },
    { key: 'e.L1b', src: 'n(J) = 80', y: 240, size: 64, col: 'dim' },
    { key: 'e.L2', src: '\\text{new whole: } \\cssId{v}{80}', y: 370, tags: { v: amber } },
    { key: 'e.L3', src: 'P(L \\mid J) = \\dfrac{48}{80} = \\cssId{v}{\\dfrac{3}{5}}', y: 530, tags: { v: lime } },
    { key: 'e.L4', src: 'P(L \\mid J) = \\dfrac{P(L \\cap J)}{P(J)}', y: 720, tags: {} },
    { key: 'e.L5', src: '= \\dfrac{48/200}{80/200} = \\dfrac{48}{80}', y: 880, tags: {} },
  ]);
  const focus = (): TableFocus => ({
    whole: { kind: 'row', i: 0, k: tr.k('e.whole') },
    dim: tr.k('e.whole') * 0.95,
    part: { r: 0, c: 0, k: tr.k('e.part') },
    glows: [{ r: 0, c: 2, k: tr.k('e.marg') * (1 - tr.k('e.whole')), col: 'first' }, { r: 2, c: 0, k: tr.k('e.marg') * (1 - tr.k('e.whole')), col: 'second' }, { r: 2, c: 2, k: tr.k('e.marg') * (1 - tr.k('e.whole')), col: 'pick' }],
    alt: { kind: 'all', i: 0, k: tr.k('e.alt'), col: 'pick' },
  });
  cardsScene([{ B, pre: 'e.', table: focus }], lines);
  showAll(B, 'e.', [], 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Read the cells and the margins', why: 'Cells are “and”, margins are one group.', act: 'Read' },
    { t: 'Shrink to the condition', why: 'Given a job: only the Job row is left.', act: 'Shrink' },
    { t: 'Count inside the new whole', why: 'The part over the new whole.', act: 'Count' },
    { t: 'The same move with probabilities', why: 'Dividing by P(J) makes J the whole.', act: 'Formula' },
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
        tr.set('e.part', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.marg', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.L1b', 1, 0.9); await wait(1.0); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.part', 0, 0.5); tr.set('e.whole', 1, 1.2); await wait(1.6); if (!alive()) return;
        tr.set('e.L2', 1, 0.9); await wait(1.0); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.part', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); await wait(1.2); if (!alive()) return;
      } else {
        tr.set('e.whole', 0, 0.8); tr.set('e.alt', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.L4', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.L5', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.alt', 0, 0.6); tr.set('e.whole', 1, 0.9); await wait(1.0); if (!alive()) return;
      }
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Only juniors with a job can be picked, so their 80 are the whole.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Divide by 200: everyone in the survey counts.', ok: false, id: 'e.why.all', mc: MC.newWhole },
      { t: 'Divide by 110: that is how many have a license.', ok: false, id: 'e.why.inv', mc: MC.inverse },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why divide by 80 and not by 200?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: left-handed and an instrument =====================
function partTurn(): void {
  tr.reset('t.');
  const B = CondPic({ kind: 'table', rows: ['Left-handed', 'Right-handed'], cols: ['Plays', 'Doesn’t play'], cells: HAND, title: '160 students' }, PF, th);
  const lines = boardOf([
    { key: 't.L0', src: '\\text{given } L\\text{: } 16', y: 160, tags: {}, col: 'first' },
    { key: 't.L1', src: 'P(I \\mid L) = \\dfrac{6}{16} = \\cssId{v}{\\dfrac{3}{8}}', y: 320, tags: { v: lime } },
    { key: 't.L2', src: 'P(I) = \\dfrac{60}{160} = \\cssId{v}{\\dfrac{3}{8}}', y: 520, tags: { v: teal } },
    { key: 't.L3', src: 'P(I \\mid L) = P(I)', y: 710, col: 'link' },
    { key: 't.L4', src: '\\text{independent}', y: 830, col: 'link' },
  ]);
  const focus = (): TableFocus => ({
    whole: tr.k('t.whole') > 0 ? { kind: 'row', i: 0, k: tr.k('t.whole') } : { kind: 'all', i: 0, k: tr.k('t.wall') },
    dim: tr.k('t.whole') * 0.95,
    part: { r: 0, c: 0, k: tr.k('t.part') },
    glows: [{ r: 2, c: 0, k: tr.k('t.col'), col: 'second' }],
  });
  cardsScene([{ B, pre: 't.', table: focus }], lines);
  showAll(B, 't.', [], 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Shrink to left-handed', why: 'Done for you.' }, { t: 'P(I | L)', why: 'Your step.' },
    { t: 'P(I), no condition', why: 'Your step.' }, { t: 'Independent?', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: handedness and music'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.whole', 1, 1.2); await wait(1.2); if (!alive()) return;
    tr.set('t.L0', 1, 0.8); await wait(1.2); if (!alive()) return;
    step = 1; drawPlan(); ask(0);
  });
  interface Ask { id: string; right: [number, number]; wrong: [number, number, string, string | undefined][]; logPrompt: string; after: (alive: () => boolean) => Promise<void>; before?: () => void }
  const ASKS: Ask[] = [
    { id: 't.cond', right: [6, 16], logPrompt: '160 students: of the 16 left-handers, 6 play an instrument. P(I | L)?',
      wrong: [[6, 160, 't.cond.all', MC.newWhole], [6, 60, 't.cond.inv', MC.inverse]],
      after: async alive => { tr.set('t.part', 1, 0.8); await wait(0.8); if (!alive()) return; tr.set('t.L1', 1, 0.9); await wait(1.1); } },
    { id: 't.all', right: [60, 160], logPrompt: '160 students, 60 play an instrument. P(I)?',
      before: () => { tr.set('t.whole', 0, 0.8); tr.set('t.part', 0, 0.6); tr.set('t.wall', 1, 0.8); },
      wrong: [[16, 160, 't.all.left', undefined], [6, 160, 't.all.joint', MC.newWhole]],
      after: async alive => { tr.set('t.col', 1, 0.8); await wait(0.8); if (!alive()) return; tr.set('t.L2', 1, 0.9); await wait(1.1); } },
  ];
  const same = (a: number, b: number, c: number, d: number) => a * d === b * c;
  function ask(i: number): void {
    const A = ASKS[i]!;
    A.before?.();
    const fbHost = h('div');
    const inp = fracInput('', () => check(), false), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'frac' || !(r.d > 0)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const n0 = r.w * r.d + r.n;
      const right = same(n0, r.d, A.right[0], A.right[1]);
      const w = A.wrong.find(x => same(n0, r.d, x[0], x[1]));
      ctx.store.log({ part: 'turn', item: `turn.${A.id.slice(2)}`, prompt: A.logPrompt, response: `${n0}/${r.d}`, expected: `${A.right[0]}/${A.right[1]}`, correct: right, mc: right ? undefined : w?.[3] });
      if (!right) { fbHost.replaceChildren(w ? voicedFb(w[2], false) : voicedFb(`${A.id}.no`, false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${A.id}.ok`, true));
      seq(async alive => {
        await A.after(alive); if (!alive()) return;
        step = i + 2; drawPlan();
        if (i < ASKS.length - 1) ask(i + 1); else judge();
      });
    }
    work.replaceChildren(voiced(A.id), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function judge(): void {
    const opts = [
      { t: 'Independent: P(I | L) = P(I) = 3/8', ok: true, id: 't.judge.ok', mc: undefined as string | undefined },
      { t: 'Dependent: only 6 left-handers play an instrument', ok: false, id: 't.judge.cell', mc: MC.oneCell },
      { t: 'Dependent: handedness and music must be connected', ok: false, id: 't.judge.story', mc: MC.noProps },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'turn', item: 'turn.judge', prompt: 'P(I | L) = 3/8 and P(I) = 3/8: independent?', response: o.t, expected: 'independent', correct: o.ok, mc: o.mc });
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true));
      seq(async alive => {
        tr.set('t.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.L4', 1, 0.8); await wait(0.9); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    })));
    work.replaceChildren(voiced('t.judge'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    if (!(id in LINES)) console.warn('no voice line', id);
    say(id);
    c.append(html('p', '', line(id) + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: disjoint events are dependent =====================
function partProve(): void {
  tr.reset('p.');
  const V = CondPic({ kind: 'venn', a: 'A: 1 or 2', b: 'B: 6', layout: 'apart', words: true, vals: { a: '1, 2', b: '6', out: '3, 4, 5' }, cond: 'B' }, PF, th);
  const lines = boardOf([
    { key: 'p.S1', src: '\\text{Sam: independent}', y: 140, col: 'dim' },
    { key: 'p.L1', src: 'P(A \\cap B) = \\cssId{v}{0}', y: 290, tags: { v: lime } },
    { key: 'p.L2', src: 'P(A)\\,P(B) = \\tfrac{1}{3} \\times \\tfrac{1}{6} = \\cssId{v}{\\tfrac{1}{18}}', y: 450, tags: { v: amber } },
    { key: 'p.L3', src: '0 \\ne \\tfrac{1}{18}', y: 600, col: 'link' },
    { key: 'p.L4', src: 'P(A \\mid B) = 0 \\ne P(A) = \\tfrac{1}{3}', y: 760, tags: {} },
    { key: 'p.L5', src: '\\text{dependent}', y: 890, col: 'link' },
  ]);
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const L = lines[0]!, b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }); strike(c, b.x0 - 10, b.cy + 4, b.x1 + 10, b.cy - 4, k, { col: 'wrong' }); }
  };
  cardsScene([{ B: V, pre: 'p.' }], lines, extra);
  showAll(V, 'p.', [], 0.8, 0.3); tr.set('p.S1', 1, 0.8, 1.6);
  const CHIPS = [
    { t: 'No roll is in both A and B.', fits: 0 },
    { t: 'Both probabilities are positive, and a product of positive numbers is positive.', fits: 1 },
    { t: 'Independence needs P(A and B) = P(A) × P(B) exactly.', fits: 2 },
    { t: 'Events with no outcomes in common can’t affect each other.', fits: -1, mc: MC.disjIndep, id: 'p.no.disj' },
    { t: 'This die example works, so it works for every pair.', fits: -1, mc: MC.examples, id: 'p.no.example' },
    { t: 'P(A) = 1/3 and P(B) = 1/6 are different numbers.', fits: -1, mc: MC.exclUnequal, id: 'p.no.unequal' },
  ];
  const CLAIMS = [
    'A and B can’t happen together, so P(A and B) = 0,',
    'But P(A) × P(B) = 1/3 × 1/6 = 1/18,',
    'So P(A and B) ≠ P(A) × P(B): A and B are <b class="s">dependent</b>, and Sam is wrong,',
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
      if (n === 1) { tr.set('p.L1', 1, 0.9); await wait(1.0); }
      if (n === 2) { tr.set('p.L2', 1, 0.9); await wait(1.1); }
      if (n === 3) {
        tr.set('p.L3', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('p.cond', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.L4', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('p.L5', 1, 0.8); await wait(0.8); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.9); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: mutually exclusive events are independent. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.disjIndep : undefined });
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
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CItem),
  });
}
/** the item's board TeX as lines (split at \qquad), centred in `area` */
/** split a too-wide line at its top-level "=" signs (outside braces): "a = b = c" -> "a", "= b", "= c" */
function splitEq(src: string, maxW: number): string[] {
  if (texWidth(tex(src) as Formula, 60) <= maxW) return [src];
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of src) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (ch === '=' && depth === 0 && cur.trim()) { out.push(cur.trim()); cur = ''; }
    cur += ch;
  }
  out.push(cur.trim());
  return out.length > 1 ? out : [src];
}
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = src.split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean).flatMap(p0 => splitEq(p0, area.w - 90));
  if (!parts.length) return [];
  let sz = size;
  while (sz > 60 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 90)) sz -= 2;
  const hs = parts.map(p0 => { const F = tex(p0) as Formula; return Math.max(1, (F.bottom - F.top) / 1000) * sz; });
  const gap = Math.min(sz * 1.5, (area.h - 60) / parts.length);
  const total = hs.reduce((s, x) => s + Math.max(x, gap), 0);
  let y = area.cy - total / 2;
  return parts.map((p0, i) => { const hh = Math.max(hs[i]!, gap); const L = centred(`x.B${i}`, p0, y + hh / 2, sz, undefined, undefined, area.cx, area.w - 90); y += hh; return L; });
}
/** steps a replay brings in (the rest of a CountPic tree) and the highlight mark of every CondPic card */
const SOLVE_STEPS = ['rest'];
function showItem(item: CItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pics = (item.picture?.pics ?? []) as CPic[];
  // a wide notation line gets a wider slate (the picture card gives up the room), never type below 60 px
  const parts = (item.board || '').split(/\\qquad\s*/).map(p0 => p0.trim()).filter(Boolean);
  const need = Math.max(0, ...parts.map(p0 => texWidth(tex(p0) as Formula, 64))) + 110;
  let bx0 = Math.min(BOARD.x0, Math.max(BOARD.x1 - need, 1010));
  const blocks: { B: CondPicBlock; pre: string }[] = [];
  const build = (wMax: number): boolean => {
    blocks.length = 0;
    const PFi = frame(PF.x, PF.y, Math.min(PF.w, wMax), PF.h);
    const w = item.picture?.weights ?? pics.map(() => 1), tot = w.reduce((a, b) => a + b, 0), gap = 30;
    let y = PFi.y;
    const ok = pics.every((p, i) => {
      const hh = ((PFi.h - gap * (pics.length - 1)) * w[i]!) / tot;
      const fr: Frame = frame(PFi.x, y, PFi.w, hh); y += hh + gap;
      const m = tryBlock(() => CondPic(p, fr, th));
      if (!m.ok) return false;
      blocks.push({ B: m.value, pre: `x.${i}.` });
      return true;
    });
    if (!ok) blocks.length = 0;
    return ok;
  };
  // the picture keeps its full width when it needs it; the notation then splits at "=" on the narrow board
  if (pics.length && !build(bx0 - 60 - PF.x)) { bx0 = BOARD.x0; if (!build(PF.w)) console.warn('CondPic does not fit', item.family); }
  if (!blocks.length) {
    const big = box(200, 160, 1720, 920);
    const lines = boardLines(item.board || '\\text{?}', big, 110);
    setScene({ lines, leads: [], boardBox: big, table: 1080 });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.2));
    return {};
  }
  const slateBox = bx0 < BOARD.x0 ? box(bx0, BOARD.y0, BOARD.x1, BOARD.y1) : undefined;
  const lines = boardLines(item.board, box(bx0, BOARD.y0, BOARD.x1, BOARD.y0 + 620), 76);
  cardsScene(blocks.map(b => ({ B: b.B, pre: b.pre })), lines, undefined, slateBox);
  blocks.forEach((b, i) => showAll(b.B, b.pre, SOLVE_STEPS, 0.8, 0.1 + i * 0.4));
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + i * 0.2));
  const solveKeys = blocks.flatMap(b => [...b.B.steps.filter(s => SOLVE_STEPS.includes(s)).map(s => b.pre + s), b.pre + 'rev']);
  return {
    solve: async alive => {
      for (const k of solveKeys) { tr.set(k, 1, 1.2); await wait(0.6); if (!alive()) return; }
      await wait(1.0);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['P(L \\mid J) = \\dfrac{P(L \\cap J)}{P(J)} = \\dfrac{48/200}{80/200} \\quad A^{c} \\cup \\varnothing \\ne \\tfrac{1}{18} \\quad \\text{new whole: } 80'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
