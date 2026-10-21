// fractions-as-division.ts: topic 1 of the lesson line (grade 5, 5.NF.B.3), on the shared lesson runtime.
//   1 The question   a real situation, 3 answer cards (one per misconception) + how sure
//   2 Worked example 3 bars / 4 friends, four subgoal steps; each symbol is written next to, and linked by colour and
//                    a leader line to, the part of the picture it names; one self-explanation question (pick a reason)
//   3 Your turn      5 bars / 3 friends, faded from the end: the first two steps are given, the kid does the rest
//   4 Prove it       error analysis + a because-chain built from reason chips (distractors = catalogue misconceptions)
//   5 Practice       all 12 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/fractions-as-division/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { EqualShare, type EqualShareBlock, type EqualShareFocus } from '../../src/lesson/EqualShare';
import { MeasureStrip, type MeasureStripBlock } from '../../src/lesson/MeasureStrip';
import { BOARD, MF, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { fr } from '../../src/lesson/runtime/item';
import { classifyShare, FAMILY_NAMES, GENERATORS, type ShareItem } from '../../src/lesson/topics/fractions-as-division/items';
import { PLAN } from '../../src/lesson/topics/fractions-as-division/plan';

const SLUG = 'fractions-as-division';
const I = { fr, classifyShare };
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;

/** a scene with the EqualShare model (or a strip, or none) on the left and the board on the right */
interface ShareScene { pre: string; model: EqualShareBlock | null; lines: Line[]; leads: Lead[]; focus?: () => EqualShareFocus; extra?: (c: Canvas) => void; boardBox?: Box | null; strip?: MeasureStripBlock }
function setShare(S: ShareScene): void {
  setScene({
    table: S.model ? S.model.where.labelB.y1 + 16 : 840,
    model: c => {
      if (S.model) S.model.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.());
      if (S.strip) S.strip.draw(c, progressOf(s => tr.k(S.pre + s)));
    },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
/** model geometry helpers for board placement */
function rightBar(m: EqualShareBlock): number { const a = m.maths.a; return a > 3 ? (a % 2 === 0 ? a - 1 : a - 2) : a - 1; }
const heroY = (m: EqualShareBlock) => Math.max(BOARD.y0 + 120, m.where.labelA.cy);
/** the group labels light up while their symbol writes on (a group is linked by a pulse, a part by a leader line) */
function withPulse(pre: string, f: EqualShareFocus): EqualShareFocus {
  return { ...f, labelA: tr.k(pre + 'pA'), labelB: tr.k(pre + 'pB') };
}
/** write the hero line a ÷ b = a/b: the dividend with its group, the divisor with its group, then the share's leader */
async function writeHero(pre: string, alive: () => boolean): Promise<void> {
  tr.set(pre + 'hero', 1, 1.4, 0.2);
  await wait(0.3); if (!alive()) return;
  void bump(pre + 'pA', alive); await wait(0.5); if (!alive()) return;
  void bump(pre + 'pB', alive); await wait(1.0); if (!alive()) return;
  tr.set(pre + 'ldS', 1, 0.9); await wait(1.0);
}
function showModel(pre: string, delay = 0): void {
  tr.set(pre + 'labelA', 1, 0.6, delay); tr.set(pre + 'bars', 1, 1.2, delay + 0.15);
  tr.set(pre + 'labelB', 1, 0.6, delay + 0.8); tr.set(pre + 'trays', 1, 1.1, delay + 0.95);
}

const CARDS = [
  { n: 4, d: 3, mc: 'the bigger number on top', id: 'mc.fraction-ops.larger-number-always-dividend' },
  { n: 3, d: 4, mc: '', id: '' },
  { n: 1, d: 4, mc: 'one piece only', id: 'mc.fractions-concept.all-shown-taken-as-one-whole' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = EqualShare({ a: 3, b: 4 }, MF, th);
  const y = heroY(m);
  const L0 = line('q.l0', '\\text{each friend gets}', y - 92, 52, undefined, 'dim');
  const L1 = line('q.l1', '?\\ \\text{of a bar}', y, 92);
  setShare({ pre: 'q.', model: m, lines: [L0, L1], leads: [] });
  showModel('q.');
  tr.set('q.l0', 1, 0.8, 1.6); tr.set('q.l1', 1, 0.9, 1.9);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '3 granola bars shared equally by 4 friends: how much of a bar each?', response: `${p.n}/${p.d}`, expected: '3/4', correct: p.n === 3, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  say('q.intro');
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${I.fr(cd.n, cd.d)}<small>of a bar</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Three bars, four friends'),
    html('p', '', `<b class="a">3 granola bars</b> are shared equally by <b class="b">4 friends</b>. Everyone gets the same amount and nothing is left over.`),
    html('p', '', 'How much of a bar does each friend get?'),
    cards,
    h('div', { class: 'label' }, 'How sure are you?'),
    sure,
    h('div', { class: 'row' }, goBtn),
  );
}

// ===== 2. Worked example: 3 bars, 4 friends =====
function partExample(): void {
  tr.reset('e.');
  const m = EqualShare({ a: 3, b: 4 }, MF, th), ft = m.focusTray, ib = rightBar(m);
  const yH = heroY(m), y1 = m.where.bar(ib).cy, y2 = m.where.tray(ft).cy;
  const Q = line('e.q', '?\\ \\text{of a bar}', yH, 92);
  const H = line('e.hero', '\\cssId{a}{3} \\div \\cssId{b}{4} = \\cssId{s}{\\frac{3}{4}}\\ \\text{bar}', yH, 96, { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' } });
  const L1 = line('e.L1', '\\cssId{one}{1} \\div \\cssId{b}{4} = \\cssId{p}{\\tfrac{1}{4}}\\ \\text{bar}', y1, 76, { one: { col: 'first' }, b: { col: 'second' }, p: { col: 'pick' } });
  const L2 = line('e.L2', '\\cssId{n}{3} \\times \\tfrac{1}{4} = \\cssId{s}{\\tfrac{3}{4}}\\ \\text{bar}', y2, 76, { n: { col: 'first' }, s: { col: 'link' } });
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'p'), to: () => m.where.piece(ib, m.maths.b - 1), col: 'pick' },
    { key: 'e.ld2b', from: () => partOf(L2, 's'), to: () => m.where.slots(ft), col: 'link' },
    { key: 'e.ldS', from: () => partOf(H, 's'), to: () => m.where.slots(ft), col: 'link' },
  ];
  setShare({
    pre: 'e.', model: m, lines: [Q, H, L1, L2], leads,
    focus: () => withPulse('e.', (() => {
      const kc = tr.k('e.fcut'), kn = tr.k('e.fcount');
      if (kc > 0) return { pieces: [[ib, m.maths.b - 1]], k: kc, col: 'pick', dim: 0.5 };
      if (kn > 0) return { trays: [ft], k: kn, col: 'second', dim: 0.55, ring: false };
      return {};
    })()),
  });
  // the board starts where part 1 left it: the model in place, the question on the board
  for (const s of ['labelA', 'bars', 'labelB', 'trays']) tr.jump('e.' + s, 1);
  tr.jump('e.q', 1);

  let step = 0;
  const STEPS = [
    { t: 'Cut every bar into 4 equal pieces', why: 'One piece of each bar for each friend.', act: 'Cut the bars' },
    { t: 'Each friend takes one piece from every bar', why: 'Deal the pieces like cards.', act: 'Deal' },
    { t: 'Count one friend’s share', why: 'Measure it against ONE whole bar.', act: 'Count' },
    { t: 'Write it as one division', why: 'What is shared ÷ how many share.', act: 'Write it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) { const b = btn(s.act, () => run(i), 'go'); (li.lastChild as HTMLElement).append(b); }
      return li;
    }));
  };
  const SAY = [
    `Each piece is <b class="s">${I.fr(1, 4)}</b> of a bar: <b class="a">1</b> bar shared by <b class="b">4</b>.`,
    'Every friend now has one piece from each of the <b class="a">3 bars</b>.',
    `One friend has <b class="a">3</b> pieces of ${I.fr(1, 4)}. The dashed outline is one whole bar: the pieces fill <b class="s">${I.fr(3, 4)}</b> of it.`,
    `<b class="a">3</b> ÷ <b class="b">4</b> = <b class="s">${I.fr(3, 4)}</b>. The amount shared is on top; the number of friends is underneath.`,
  ];
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.innerHTML = '';
    if (i < 3) say(`e.step${i}`);
    seq(async alive => {
      if (i === 0) {
        tr.set('e.cut', 1, 1.6); await wait(1.5); if (!alive()) return;
        tr.set('e.L1', 1, 1.0); await wait(0.8); if (!alive()) return;
        tr.set('e.fcut', 1, 0.5); tr.set('e.ld1', 1, 0.9, 0.2);
      } else if (i === 1) {
        tr.set('e.ld1', 0, 0.4); tr.set('e.fcut', 0, 0.4); tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.deal', 1, 3.4, 0.3); await wait(3.6); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.fcount', 1, 0.5); tr.set('e.count', 1, 0.8, 0.2); await wait(0.9); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.ld2b', 1, 0.9);
      } else {
        tr.set('e.fcount', 0, 0.5); tr.set('e.ld2b', 0, 0.4); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.q', 0, 0.6);
        await writeHero('e.', alive);
      }
      sayBox.innerHTML = '';
      sayBox.append(html('p', '', SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Every bar is cut into 4 pieces, one for each friend.', ok: true, mc: undefined as string | undefined, say: `Yes. 4 friends, so every piece is ${I.fr(1, 4)} of a bar, and that's what the 4 underneath counts.` },
      { t: 'The bigger number always goes on the bottom.', ok: false, mc: 'mc.fraction-ops.larger-number-always-dividend', say: 'Not always. With 5 bars and 3 friends the 5 goes on top. The bottom is how many share.' },
      { t: 'There are 12 pieces, and 12 ÷ 3 = 4.', ok: false, mc: 'mc.fractions-concept.all-shown-taken-as-one-whole', say: `There are 12 pieces, but the share is measured against ONE bar, which is cut into 4. That's why it is fourths.` },
    ];
    const box = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box.append(btn(o.t, () => {
      box.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      const b = [...box.querySelectorAll('button')].find(x => x.textContent === o.t)!;
      b.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(feedback(o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is 4 the bottom number?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, 'Quick check: why is 4 the bottom number?'), box, fbHost);
    void ctx.say('e.step3').then(() => say('e.why'));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), html('p', 'dim', 'Four steps. Press each one and watch the picture, then the notation.'), plan, sayBox, after);
  say('e.intro');
}

// ===== 3. Your turn: 5 bars, 3 friends (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = EqualShare({ a: 5, b: 3 }, MF, th), ft = m.focusTray, ib = rightBar(m);
  const yH = heroY(m), y1 = Math.max(m.where.bar(ib).cy, yH + 200), y2 = m.where.tray(ft).cy, y4 = Math.min(BOARD.y1 - 90, y2 + 170);
  const Q = line('t.q', '?\\ \\text{of a bar}', yH, 92);
  const H = line('t.hero', '\\cssId{a}{5} \\div \\cssId{b}{3} = \\cssId{s}{\\frac{5}{3}}\\ \\text{bars}', yH, 96, { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' } });
  const L1 = line('t.L1', '\\cssId{one}{1} \\div \\cssId{b}{3} = \\cssId{p}{\\tfrac{1}{3}}\\ \\text{bar}', y1, 76, { one: { col: 'first' }, b: { col: 'second' }, p: { col: 'pick' } });
  const L2 = line('t.L2', '\\cssId{n}{5} \\times \\tfrac{1}{3} = \\cssId{s}{\\tfrac{5}{3}}\\ \\text{bars}', y2, 76, { n: { col: 'first' }, s: { col: 'link' } });
  const L4 = line('t.L4', '\\tfrac{5}{3} = \\cssId{w}{1}\\,\\cssId{f}{\\tfrac{2}{3}}\\ \\text{bars}', y4, 80, { w: { col: 'link' }, f: { col: 'link' } });
  const leads: Lead[] = [
    { key: 't.ld1', from: () => partOf(L1, 'p'), to: () => m.where.piece(ib, m.maths.b - 1), col: 'pick' },
    { key: 't.ld2', from: () => partOf(L2, 's'), to: () => m.where.slots(ft), col: 'link' },
    { key: 't.ldS', from: () => partOf(H, 's'), to: () => m.where.slots(ft), col: 'link' },
    { key: 't.ldW', from: () => partOf(L4, 'w'), to: () => m.where.row(ft, 0), col: 'link' },
    { key: 't.ldF', from: () => partOf(L4, 'f'), to: () => m.where.row(ft, 1), col: 'link', drop: 16 },
  ];
  setShare({
    pre: 't.', model: m, lines: [Q, H, L1, L2, L4], leads,
    focus: () => withPulse('t.', (() => {
      const kc = tr.k('t.fcut'), kn = tr.k('t.fcount');
      if (kc > 0) return { pieces: [[ib, m.maths.b - 1]], k: kc, col: 'pick', dim: 0.5 };
      if (kn > 0) return { trays: [ft], k: kn, col: 'second', dim: 0.55, ring: false };
      return {};
    })()),
  });
  showModel('t.'); tr.set('t.q', 1, 0.8, 1.4);

  let step = 0;
  const STEPS = [
    { t: 'Cut every bar into 3 equal pieces', why: 'Done for you.', given: true },
    { t: 'Each friend takes one piece from every bar', why: 'Done for you.', given: true },
    { t: 'Count one friend’s share', why: 'Your step.', given: false },
    { t: 'Write it as one division', why: 'Your step.', given: false },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  say('t.intro');
  setPanel(h('h2', {}, 'Five bars, three friends'), html('p', '', `Now <b class="a">5 granola bars</b> are shared equally by <b class="b">3 friends</b>. The first two steps are done for you.`), plan, work);

  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    tr.set('t.cut', 1, 1.4); await wait(1.3); if (!alive()) return;
    tr.set('t.L1', 1, 0.9); tr.set('t.fcut', 1, 0.5, 0.5); tr.set('t.ld1', 1, 0.8, 0.7); await wait(2.2); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.ld1', 0, 0.4); tr.set('t.fcut', 0, 0.4); tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.deal', 1, 3.6, 0.3); await wait(3.9); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.fcount', 1, 0.5);
    askCount();
  });

  function askCount(): void {
    const fbHost = h('div');
    const inp = fracInput('of a bar', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r) { fbHost.replaceChildren(feedback(false, 'Fill in the top and the bottom box (the whole-number box is optional).')); return; }
      const v = I.classifyShare(r, 5, 3, 'of a bar');
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: 'One friend of 3 sharing 5 bars: how much of a bar?', response: r, expected: '5/3', correct: v.ok, mc: v.mc });
      fbHost.replaceChildren(feedback(v.ok, v.say));
      if (!v.ok) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.count', 1, 0.8); tr.set('t.L2', 1, 1.0, 0.4); tr.set('t.ld2', 1, 0.9, 1.3); await wait(2.4); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(html('p', '', `Look at one friend's tray. How much of a bar is that?`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    say('t.count');
    inp.focus();
  }
  function askWrite(): void {
    const chips = [{ t: '5 bars', r: 'a' }, { t: '3 friends', r: 'b' }, { t: '15 pieces', r: 'x' }];
    const slots: (number | null)[] = [null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips' });
    const fbHost = h('div');
    const draw = () => {
      eq.replaceChildren(
        ...[0, 1].flatMap(i => {
          const v = slots[i]; const ch = v === null || v === undefined ? null : chips[v]!;
          const s = h('button', { class: 'slot' + (ch ? ' filled ' + (ch.r === 'x' ? '' : ch.r) : ''), 'aria-label': i === 0 ? 'first box' : 'second box' }, ch ? ch.t : '?');
          s.addEventListener('click', () => { slots[i] = null; draw(); });
          return i === 0 ? [s, h('span', {}, '÷')] : [s];
        }),
        html('span', '', `= ${I.fr(5, 3)} bars`),
      );
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch.t, () => { const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, y] = slots.map(i => (i === null ? '' : chips[i]!.r));
      if (x === 'a' && y === 'b') {
        fbHost.replaceChildren(feedback(true, `Yes: <b class="a">5</b> ÷ <b class="b">3</b> = <b class="s">${I.fr(5, 3)}</b>. The bars that are shared, divided by the friends who share.`));
        ctx.store.log({ part: 'turn', item: 'turn.write', prompt: '? ÷ ? = 5/3 bars', response: [x, y], expected: ['a', 'b'], correct: true });
        seq(async alive => {
          tr.set('t.fcount', 0, 0.5); tr.set('t.ld2', 0, 0.4); tr.set('t.L2:dim', 1, 0.6);
          tr.set('t.q', 0, 0.6);
          await writeHero('t.', alive); if (!alive()) return;
          step = 4; drawPlan(); askWhole();
        });
        return;
      }
      let say = 'Not quite. Which number is being shared, and how many share it?';
      if (x === 'b' && y === 'a') say = `That's 3 ÷ 5: 3 bars for 5 friends. Here the <b class="a">5 bars</b> are shared, so they go first.`;
      else if (x === 'x' || y === 'x') say = `15 is the number of pieces, not wholes. The division is about the <b class="a">bars</b> and the <b class="b">friends</b>.`;
      fbHost.replaceChildren(feedback(false, say));
      ctx.store.log({ part: 'turn', item: 'turn.write', prompt: '? ÷ ? = 5/3 bars', response: [x, y], expected: ['a', 'b'], correct: false, mc: x === 'b' ? 'mc.reasoning-language.numbers-in-reading-order' : 'mc.fractions-concept.all-shown-taken-as-one-whole' });
      setTimeout(() => { slots[0] = slots[1] = null; draw(); }, 900);
    }
    draw();
    work.replaceChildren(html('p', '', 'Tap the chips to fill the division.'), eq, chipBox, fbHost);
    say('t.write');
  }
  function askWhole(): void {
    const fbHost = h('div');
    const more = btn('More than 1 bar', () => answer(true)), less = btn('Less than 1 bar', () => answer(false));
    function answer(isMore: boolean): void {
      ctx.store.log({ part: 'turn', item: 'turn.whole', prompt: 'Is 5/3 of a bar more or less than one whole bar?', response: isMore ? 'more' : 'less', expected: 'more', correct: isMore, mc: isMore ? undefined : 'mc.fractions-concept.fraction-must-be-less-than-one' });
      fbHost.replaceChildren(feedback(isMore, isMore ? `Right. Look at the tray: one row is a whole bar.` : `Look at the tray: the top row is already a whole bar, and there is more.`));
      seq(async alive => {
        tr.set('t.count', 0, 0.5); tr.set('t.ldS:dim', 1, 0.5); tr.set('t.hero:dim', 1, 0.6);
        tr.set('t.regroup', 1, 0.8, 0.2); tr.set('t.L4', 1, 1.0, 0.6); await wait(1.6); if (!alive()) return;
        tr.set('t.ldW', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('t.ldF', 1, 0.8); await wait(1.0); if (!alive()) return;
        fbHost.append(html('p', '', `${I.fr(5, 3)} = <b class="s">1&#8202;${I.fr(2, 3)}</b> bars: one whole bar and ${I.fr(2, 3)} of another. A share can be more than 1.`), callback());
      });
    }
    work.replaceChildren(html('p', '', `Is ${I.fr(5, 3)} of a bar more or less than one whole bar?`), h('div', { class: 'row' }, more, less), fbHost);
    say('t.whole');
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    if (commit().pick === null) c.innerHTML = `At the start: 3 bars for 4 friends is ${I.fr(3, 4)} of a bar each.`;
    else {
      const p = CARDS[commit().pick ?? 1]!, right = commit().pick === 1;
      c.innerHTML = `At the start you picked ${I.fr(p.n, p.d)} and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `
        + (right ? `You were right: 3 ÷ 4 = ${I.fr(3, 4)}. Now you can show why.` : `Now you know it is 3 ÷ 4 = <b class="s">${I.fr(3, 4)}</b>${p.mc ? `: ${I.fr(p.n, p.d)} was ${p.mc}` : ''}.`);
    }
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    say('t.done');
    return c;
  }
}

// ===== 4. Prove it: Jordan's 2 ÷ 5 = 5/2 =====
function partProve(): void {
  tr.reset('p.');
  const m = EqualShare({ a: 2, b: 5 }, MF, th), ft = m.focusTray;
  const J = line('p.J', '\\text{Jordan: }\\ 2 \\div 5 = \\cssId{w}{\\frac{5}{2}}', BOARD.y0 + 120, 80);
  const C1 = line('p.C1', '\\text{each share} < 1\\ \\text{bar}', BOARD.y0 + 290, 64, undefined, 'link');
  const C2 = line('p.C2', '\\tfrac{5}{2}\\ \\text{bars} > \\cssId{all}{2\\ \\text{bars}}', BOARD.y0 + 430, 76, { all: { col: 'first' } });
  const yH = Math.max(BOARD.y0 + 600, m.where.tray(ft).cy);
  const H = line('p.hero', '\\cssId{a}{2} \\div \\cssId{b}{5} = \\cssId{s}{\\frac{2}{5}}\\ \\text{bar}', yH, 96, { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' } });
  const leads: Lead[] = [
    { key: 'p.ldS', from: () => partOf(H, 's'), to: () => m.where.slots(ft), col: 'link' },
  ];
  setShare({
    pre: 'p.', model: m, lines: [J, C1, C2, H], leads,
    focus: () => withPulse('p.', (() => {
      const k1 = tr.k('p.f1');
      if (k1 > 0) return { trays: Array.from({ length: 5 }, (_, j) => j), k: k1, col: 'link', dim: 0 };
      return {};
    })()),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showModel('p.'); tr.set('p.J', 1, 1.0, 1.4);

  const CHIPS = [
    { t: 'There are fewer bars than friends.', fits: 0 },
    { t: '2 halves make 1 bar, so 5 halves make 2 bars and a half.', fits: 1 },
    { t: 'Each bar is cut into 5 pieces, and each friend takes one piece from each of the 2 bars.', fits: 2 },
    { t: 'The bigger number always goes on top.', fits: -1, mc: 'mc.fraction-ops.larger-number-always-dividend', say: 'That is the slip Jordan made. The amount shared goes on top, bigger or not.' },
    { t: 'A fraction can never be more than 1.', fits: -1, mc: 'mc.fractions-concept.fraction-must-be-less-than-one', say: `Careful: fractions can be more than 1 (5 bars for 3 friends gave ${I.fr(5, 3)}). The trouble with ${I.fr(5, 2)} is that it is more than all the bars there are.` },
  ];
  const CLAIMS = [
    `Each friend should get <b>less than 1 bar</b>,`,
    `But ${I.fr(5, 2)} is <b>more than the 2 bars there are in all</b>,`,
    `So each friend gets <b class="s">${I.fr(2, 5)}</b> of a bar: <b class="a">2</b> ÷ <b class="b">5</b> = ${I.fr(2, 5)},`,
  ];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
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
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.f1', 1, 0.6); tr.set('p.C1', 1, 1.0, 0.3); await wait(2.2); if (!alive()) return; tr.set('p.f1', 0, 0.6); }
        if (n === 2) { tr.set('p.C2', 1, 1.0); await wait(0.9); if (!alive()) return; await bump('p.pA', alive); await wait(0.5); if (!alive()) return; tr.set('p.strike', 1, 0.6); }
        if (n === 3) {
          tr.set('p.C1:dim', 1, 0.5); tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.cut', 1, 1.2); await wait(1.2); if (!alive()) return;
          tr.set('p.deal', 1, 2.6); await wait(2.7); if (!alive()) return;
          tr.set('p.count', 1, 0.7);
          await writeHero('p.', alive); if (!alive()) return;
          chipBox.remove();
          say('p.done');
          fbHost.replaceChildren(feedback(true, `That's a proof: three claims, each with its reason, and the picture backs every one. Jordan flipped the division.`), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    const msg = ch.say ?? `True, but it is the reason for a different line. Which reason makes "${CLAIMS[filled]!.replace(/<[^>]+>/g, '').replace(/,$/, '')}" true?`;
    fbHost.replaceChildren(feedback(false, msg));
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: 2 ÷ 5 = 5/2. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.fractions-concept.fraction-division-order-reversed' : undefined });
    say('p.build');
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(
      html('p', '', right ? `Let's test it. Build the argument, and see where it leads.` : `Now prove it. Fill each “because” with the reason that makes the line true.`),
      chain, chipBox, fbHost);
    drawChain();
  }
  const proofHost = h('div');
  say('p.intro');
  setPanel(
    h('h2', {}, 'Prove it'),
    html('p', '', `Jordan shares <b class="a">2 granola bars</b> equally among <b class="b">5 friends</b> and writes 2 ÷ 5 = ${I.fr(5, 2)}.`),
    verdict, proofHost,
  );
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as ShareItem),
  });
}
/** draw a practice item: the sharing model, a measure strip, or the bare notation; and its worked solution replay */
function showItem(item: ShareItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const mdl = item.model ? tryBlock(() => EqualShare({ a: item.model!.a, b: item.model!.b, words: item.model!.words, one: item.model!.one, look: item.model!.look === 'brownie' ? 'brownie' : 'granola' }, MF, th)) : null;
  const m = mdl && mdl.ok ? mdl.value : null;
  if (m) {
    const T = line('x.T', item.board, BOARD.y0 + 120, 88);
    const ft = m.focusTray, a = m.maths.a, b = m.maths.b;
    const H = line('x.hero', `\\cssId{a}{${a}} \\div \\cssId{b}{${b}} = \\cssId{s}{\\frac{${a}}{${b}}}`, Math.max(BOARD.y0 + 330, m.where.tray(ft).cy), 96, { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' } });
    setShare({ pre: 'x.', model: m, lines: [T, H], leads: [{ key: 'x.ldS', from: () => partOf(H, 's'), to: () => m.where.slots(ft), col: 'link' }], focus: () => withPulse('x.', {}) });
    showModel('x.', 0); tr.set('x.T', 1, 0.8, 0.6);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        tr.set('x.cut', 1, 0.8); await wait(0.8); if (!alive()) return;
        tr.set('x.deal', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('x.count', 1, 0.6);
        await writeHero('x.', alive);
      },
    };
  }
  const st = item.strip ? tryBlock(() => MeasureStrip(item.strip!, frame(60, 70, 1120, 940), th)) : null;
  if (st && st.ok && item.strip) {
    const S = st.value, { a, b } = item.strip, q = Math.floor(a / b), r = a % b;
    const T = line('x.T', item.board, BOARD.y0 + 120, 88);
    const H = line('x.hero', `\\cssId{a}{${a}} \\div \\cssId{b}{${b}} = \\cssId{s}{\\frac{${a}}{${b}}}${q && r ? ` = ${q}\\tfrac{${r}}{${b}}` : ''}`, BOARD.y0 + 360, 92, { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' } });
    setShare({ pre: 'x.', model: null, strip: S, lines: [T, H], leads: [{ key: 'x.ldS', from: () => partOf(H, 's'), to: () => S.where.pieceLabel, col: 'link' }] });
    tr.set('x.labelA', 1, 0.6); tr.set('x.strip', 1, 1.2, 0.1); tr.set('x.ticks', 1, 1.2, 0.6); tr.set('x.labelB', 1, 0.6, 0.9); tr.set('x.T', 1, 0.8, 0.6);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        tr.set('x.cuts', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('x.piece', 1, 0.8); await wait(0.8); if (!alive()) return;
        await writeHero('x.', alive);
      },
    };
  }
  const big = box(300, 260, 1620, 760);
  setShare({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{each friend gets}', '\\text{Jordan: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
