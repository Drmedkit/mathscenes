// probability.ts: Probability concepts (grade 7, 7.SP.C.5-8) on the shared lesson runtime.
//   1 The question   3 blue + 1 white marble: how likely is blue? Cards 1/2 (two colors), 3/4, "3 to 1" + how sure
//   2 Worked example List -> Check -> Count -> Write: every marble its own outcome, each 1/4, the event {B1,B2,B3},
//                    P(blue) = 3/4 pinned on the 0-1 scale; one "why isn't it 1/2?" with three reasons
//   3 Your turn      2 blue, 3 white, 1 pink; P(not white). List and Check are given; the kid taps the event's
//                    marbles, writes the fraction, places it on the scale; callback to the card of part 1
//   4 Prove it       Sam's 4 draws (B W B W) "prove" P(blue) = 1/2. A because-chain from reason chips, backed by a
//                    seeded experiment the kid starts: 10 batches of 4, then 400 draws settling near 3/4
//   5 Practice       all 20 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/probability/script.ts (panel HTML) = voice/lines.json (spoken text).
import { strike } from '../../src/core/draw';
import { type Box, box, padBox } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { texWidth } from '../../src/core/tex';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, bigLine, line, type Lead, type Line, partOf, seq, setScene, tr, wait, bump } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { fr, fracValue, rng, same } from '../../src/lesson/runtime/item';
import { Bag, type BagWhere, Bars, type ChanceBlock, Cube, Digits, Dots, ring, Run, Scale, Spinner, Streak, Strip, Table, Tree } from '../../src/lesson/topics/probability/Chance';
import { type Frac, type Group, WORDS, batches, running, simulate } from '../../src/lesson/topics/probability/chanceMaths';
import { FAMILY_NAMES, GENS, type Pic, type ProbItem } from '../../src/lesson/topics/probability/items';
import { PLAN } from '../../src/lesson/topics/probability/plan';
import { SCRIPT } from '../../src/lesson/topics/probability/script';

const SLUG = 'probability';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function voiced(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const fbv = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

const TABLE_Y = 990;
/** a scene with a chance model on the left and the board on the right */
interface ChanceScene { pre: string; blocks: ChanceBlock<unknown>[]; lines: Line[]; leads: Lead[]; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setChance(S: ChanceScene): void {
  const P = progressOf(s => tr.k(S.pre + s));
  setScene({ table: TABLE_Y, model: c => { for (const b of S.blocks) b.draw(c, P); }, lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra });
}
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
const T = { o: { col: 'first' as const }, e: { col: 'link' as const }, f: { col: 'link' as const }, t: { col: 'first' as const }, p: { col: 'pick' as const }, n: { col: 'second' as const } };

const EX: Group[] = [{ col: 'blue', n: 3 }, { col: 'white', n: 1 }];
const TURN: Group[] = [{ col: 'blue', n: 2 }, { col: 'white', n: 3 }, { col: 'pink', n: 1 }];
const CARDS = [
  { html: fr(1, 2), small: 'two colors', resp: '1/2', mc: 'mc.probability.equiprobability-bias', cb: 't.cb-eq' },
  { html: fr(3, 4), small: '', resp: '3/4', mc: '', cb: 't.cb-right' },
  { html: '3 to 1', small: '', resp: '3 to 1', mc: 'mc.ratio-rate.confuses-whole-with-other-part', cb: 't.cb-part' },
];
const pin34 = [{ v: [3, 4] as Frac, tex: '\\tfrac{3}{4}', col: 'link' as const }];
const bagEx = () => Bag({ groups: EX, event: ['B1', 'B2', 'B3'], pick: 3, scale: pin34, title: '4 marbles' }, MF);
/** the zone word of the scale lights up (index into the five words) */
function wordRing(w: BagWhere, i: number, key: string): (c: Parameters<NonNullable<ChanceScene['extra']>>[0]) => void {
  return c => { const k = tr.k(key); if (k > 0 && w.scale) ring(c, padBox(w.scale.word(i), 12, 8), 'link', k, 12, 4); };
}

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const bag = Bag({ groups: EX, scale: pin34, title: '4 marbles' }, MF);
  const Q = line('q.Q', 'P(\\text{blue}) = \\,?', BOARD.y0 + 110, 92);
  setChance({ pre: 'q.', blocks: [bag], lines: [Q], leads: [] });
  tr.set('q.bag', 1, 0.8); tr.set('q.marbles', 1, 1.2, 0.4); tr.set('q.title', 1, 0.6, 1.1);
  tr.set('q.scale', 1, 1.0, 1.6); tr.set('q.words', 1, 0.8, 2.1); tr.set('q.Q', 1, 0.9, 2.5);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A bag of 3 blue marbles and 1 white: how likely is it that you pull a blue one?', board: 'P(\\text{blue}) = ?', response: p.resp, expected: '3/4', correct: p.resp === '3/4', mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.html}</span><small>chance of blue</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Three blue, one white'), html('p', '', SCRIPT['q.intro']!), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
  // the intro line is spoken first, then the question
  void ctx.say('q.intro').then(() => ctx.say('q.ask'));
}

// ===== 2. Worked example: P(blue) = 3/4 =====
function partExample(): void {
  tr.reset('e.');
  const bag = bagEx(), w = bag.where;
  const yH = Math.min(BOARD.y1 - 110, (w.scale?.pinLabel(0).cy ?? 700) - 10);
  const Q = line('e.Q', 'P(\\text{blue}) = \\,?', BOARD.y0 + 110, 92);
  const L1 = line('e.L1', 'S = \\{\\cssId{o}{B_1, B_2, B_3, W}\\}', w.marble(0).cy + 10, 72, T);
  const L2 = line('e.L2', '\\text{each marble: } \\cssId{p}{\\tfrac{1}{4}}', w.label(0).cy + 24, 72, T);
  const L3 = line('e.L3', '\\text{blue} = \\{\\cssId{e}{B_1, B_2, B_3}\\}', w.label(0).cy + 144, 72, T);
  const H = line('e.H', 'P(\\text{blue}) = \\cssId{s}{\\frac{\\cssId{f}{3}}{\\cssId{t}{4}}}', yH, 96, T);
  const leads: Lead[] = [
    { key: 'e.ld2', from: () => partOf(L2, 'p'), to: () => box(w.marble(3).x0, w.marble(3).y0, w.set.x1, w.marble(3).y1), col: 'pick' },
    { key: 'e.ldH', from: () => partOf(H, 's'), to: () => w.scale!.pinLabel(0), col: 'link' },
  ];
  setChance({ pre: 'e.', blocks: [bag], lines: [Q, L1, L2, L3, H], leads, extra: wordRing(w, 3, 'e.likely') });
  jump('e.', ['bag', 'marbles', 'title', 'scale', 'words', 'Q']);

  let step = 0;
  const STEPS = [
    { t: 'List every outcome', why: 'Give each marble its own name.', act: 'List' },
    { t: 'Check: equally likely?', why: 'Look at how the marble is chosen.', act: 'Check' },
    { t: 'Count the outcomes in the event', why: 'Which outcomes are blue?', act: 'Count' },
    { t: 'Write P and place it on the scale', why: 'Event outcomes over all outcomes.', act: 'Write it' },
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
  const IDS = ['e.s1', 'e.s2', 'e.s3', 'e.s4'];
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    if (i < 3) void ctx.say(IDS[i]!);
    seq(async alive => {
      if (i === 0) {
        tr.set('e.labels', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.space', 1, 0.9); tr.set('e.L1', 1, 1.1, 0.2); await wait(1.3);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.each', 1, 0.8); await wait(0.7); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.ld2', 1, 0.9); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.ld2', 0, 0.4); tr.set('e.each', 0, 0.4); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.event', 1, 1.3, 0.2); tr.set('e.dim', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); await wait(1.2);
      } else {
        tr.set('e.L3:dim', 1, 0.6); tr.set('e.Q', 0, 0.6);
        tr.set('e.H', 1, 1.3, 0.2); await wait(1.4); if (!alive()) return;
        tr.set('e.pin0', 1, 0.8); await wait(0.6); if (!alive()) return;
        tr.set('e.ldH', 1, 0.9); await wait(0.8); if (!alive()) return;
        tr.set('e.likely', 1, 0.5); await wait(0.6);
      }
      sayBox.replaceChildren(html('p', '', SCRIPT[IDS[i]!]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 4 marbles are equally likely, and 3 of the 4 are blue.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Blue or white: two outcomes, so each is 1/2.', ok: false, mc: 'mc.probability.equiprobability-bias', id: 'e.w-eq' },
      { t: 'It is 3 to 1: three blue for every white.', ok: false, mc: 'mc.ratio-rate.confuses-whole-with-other-part', id: 'e.w-part' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbv(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Only two colors: why isn’t P(blue) 1/2?', response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
    void ctx.say('e.s4').then(() => ctx.say('e.why'));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: P(not white) in a bag of 2 blue, 3 white, 1 pink =====
function partTurn(): void {
  tr.reset('t.');
  const ev = ['B1', 'B2', 'P'], other = ['W1', 'W2', 'W3'];
  const bag = Bag({ groups: TURN, event: ev, other, pick: 5, scale: [{ v: [3, 6], tex: '\\tfrac{3}{6}', col: 'link' }], title: '6 marbles' }, MF), w = bag.where;
  const yH = Math.min(BOARD.y1 - 110, (w.scale?.pinLabel(0).cy ?? 700) - 10);
  const Q = line('t.Q', 'P(\\text{not white}) = \\,?', BOARD.y0 + 110, 88);
  const L1 = line('t.L1', '\\cssId{o}{6\\ \\text{outcomes}}', w.marble(0).cy + 10, 72, T);
  const L2 = line('t.L2', '\\text{each marble: } \\cssId{p}{\\tfrac{1}{6}}', w.label(0).cy + 24, 72, T);
  const L3 = line('t.L3', '\\text{event} = \\{\\cssId{e}{B_1, B_2, P}\\}', w.label(0).cy + 144, 72, T);
  const H = line('t.H', 'P(\\text{not white}) = \\cssId{s}{\\frac{\\cssId{f}{3}}{\\cssId{t}{6}}}', yH, 92, T);
  const leads: Lead[] = [
    { key: 't.ld2', from: () => partOf(L2, 'p'), to: () => box(w.marble(5).x0, w.marble(5).y0, w.set.x1, w.marble(5).y1), col: 'pick' },
    { key: 't.ldH', from: () => partOf(H, 's'), to: () => w.scale!.pinLabel(0), col: 'link' },
  ];
  setChance({ pre: 't.', blocks: [bag], lines: [Q, L1, L2, L3, H], leads, extra: wordRing(w, 2, 't.word') });
  tr.set('t.bag', 1, 0.8); tr.set('t.marbles', 1, 1.2, 0.3); tr.set('t.title', 1, 0.6, 0.9);
  tr.set('t.scale', 1, 1.0, 1.2); tr.set('t.words', 1, 0.8, 1.6); tr.set('t.Q', 1, 0.9, 1.8);

  let step = 0;
  const STEPS = [
    { t: 'List every outcome', why: 'Done for you.' },
    { t: 'Check: equally likely?', why: 'Done for you.' },
    { t: 'Count the outcomes in the event', why: 'Your step.' },
    { t: 'Write P and place it on the scale', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Not white'), voiced('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.labels', 1, 1.3); await wait(1.3); if (!alive()) return;
    tr.set('t.space', 1, 0.8); tr.set('t.L1', 1, 1.0, 0.2); await wait(1.6); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.L1:dim', 1, 0.5); tr.set('t.each', 1, 0.7); tr.set('t.L2', 1, 0.9, 0.4); tr.set('t.ld2', 1, 0.8, 1.2); await wait(2.4); if (!alive()) return;
    tr.set('t.ld2', 0, 0.4); tr.set('t.each', 0, 0.4); tr.set('t.L2:dim', 1, 0.5);
    step = 2; drawPlan();
    askCount();
  });

  function askCount(): void {
    const names = w.outcomes;
    const on = new Set<string>();
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'marbles' });
    const fbHost = h('div');
    const draw = () => chips.replaceChildren(...names.map(o => {
      const b = btn(o.id.replace(/^([A-Z])(\d)$/, '$1<sub>$2</sub>'), () => { if (on.has(o.id)) on.delete(o.id); else on.add(o.id); draw(); }, 'tog' + (on.has(o.id) ? ' on' : ''));
      b.setAttribute('aria-pressed', String(on.has(o.id)));
      b.dataset.id = o.id;
      return b;
    }));
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const pickd = [...on].sort();
      if (!pickd.length) { fbHost.replaceChildren(feedback(false, 'Tap the marbles first.')); return; }
      const right = pickd.length === 3 && ev.every(x => on.has(x));
      const hasWhite = pickd.some(x => x.startsWith('W'));
      const id = right ? 't.c-ok' : hasWhite ? 't.c-white' : pickd.length === 1 ? 't.c-one' : 't.c-miss';
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: 'Which marbles make up the event “not white”?', response: pickd, expected: ev, correct: right, mc: right ? undefined : id === 't.c-one' ? 'mc.probability.event-must-be-single-outcome' : undefined });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true; chips.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.event', 1, 1.2); tr.set('t.other', 1, 0.8, 0.5); tr.set('t.L3', 1, 1.0, 0.8); await wait(2.2); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    draw();
    work.replaceChildren(voiced('t.count'), chips, h('div', { class: 'row' }, ok), fbHost);
  }
  function askWrite(): void {
    const fbHost = h('div');
    const inp = fracInput('', () => check(), false);
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'frac') { fbHost.replaceChildren(feedback(false, 'Fill in the top and the bottom box.')); return; }
      const v = fracValue(r);
      if (!v) { fbHost.replaceChildren(feedback(false, 'Whole numbers in both boxes, please (the bottom one can’t be 0).')); return; }
      let id = 't.w-other', mc: string | undefined;
      if (same(v, 3, 6)) id = 't.w-ok';
      else if (same(v, 2, 3)) { id = 't.w-colors'; mc = 'mc.probability.equiprobability-bias'; }
      else if (same(v, 3, 3) && r.d === 3) { id = 't.w-part'; mc = 'mc.ratio-rate.confuses-whole-with-other-part'; }
      else if (same(v, 3, 1)) { id = 't.w-count'; mc = 'mc.probability.count-reported-as-probability'; }
      const right = id === 't.w-ok';
      ctx.store.log({ part: 'turn', item: 'turn.write', prompt: 'P(not white) as a fraction', board: 'P(\\text{not white}) = ?', response: r, expected: '3/6', correct: right, mc });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.L3:dim', 1, 0.5); tr.set('t.Q', 0, 0.6); tr.set('t.H', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
        askPlace();
      });
    }
    work.replaceChildren(voiced('t.write'), h('div', { class: 'ans' }, html('span', 'op', 'P(not white) ='), inp.node), h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askPlace(): void {
    const fbHost = h('div');
    const box_ = h('div', { class: 'words5', role: 'group', 'aria-label': 'scale words' });
    let done = false;
    WORDS.forEach(wd => {
      const b = btn(wd[0]!.toUpperCase() + wd.slice(1), () => {
        if (done) return;
        const right = wd === 'as likely as not';
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(right ? 'right' : 'nope');
        ctx.store.log({ part: 'turn', item: 'turn.place', prompt: 'Where does P(not white) = 3/6 go on the scale?', response: wd, expected: 'as likely as not', correct: right });
        fbHost.replaceChildren(fbv(right, right ? 't.p-ok' : 't.p-no'));
        if (!right) return;
        done = true;
        seq(async alive => {
          tr.set('t.pin0', 1, 0.8); await wait(0.6); if (!alive()) return;
          tr.set('t.ldH', 1, 0.9); await wait(0.9); if (!alive()) return;
          tr.set('t.word', 1, 0.5); await wait(0.6); if (!alive()) return;
          step = 4; drawPlan();
          fbHost.append(callback());
        });
      });
      box_.append(b);
    });
    work.replaceChildren(voiced('t.place'), box_, fbHost);
  }
  function callback(): HTMLElement {
    const p = commit().pick;
    const id = p === null ? 't.cb-none' : CARDS[p]!.cb;
    const c = h('div', { class: 'callback' });
    c.append(html('p', '', SCRIPT[id]!), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    void ctx.say(id);
    return c;
  }
}

// ===== 4. Prove it: Sam's four draws =====
/** the seeded experiments of part 4, chosen once so the lesson always tells the same story (asserted) */
const EXPERIMENT = (() => {
  let bs: number[] | null = null, seedB = 0;
  for (let s = 1; s < 2000 && !bs; s++) {
    const b = batches(rng(s), [3, 4], 4, 10);
    if (b.filter(x => x === 2).length >= 2 && b.includes(4) && b.includes(3) && Math.max(...b.filter(x => x !== 4)) === 3 && !b.includes(0)) { bs = b; seedB = s; }
  }
  let hits: boolean[] | null = null, seedR = 0;
  for (let s = 1; s < 4000 && !hits; s++) {
    const hh = simulate(rng(s * 31 + 7), [[3, 4], [1, 4]], 400).map(x => x === 0);
    const run = running(hh), at = (i: number) => run[i - 1]![0] / i;
    const end = at(400);
    // wanders early, drifts away for a while in the middle, ends near 3/4 (but not exactly on it)
    const away = [...Array(200).keys()].some(i => Math.abs(at(100 + i) - 0.75) > 0.045);
    if (Math.abs(at(12) - 0.75) >= 0.15 && away && Math.abs(end - 0.75) <= 0.012 && run[399]![0] !== 300) { hits = hh; seedR = s; }
  }
  if (!bs || !hits) throw new Error('probability: no seed gives the part 4 story');
  return { bs, hits, seedB, seedR, end: running(hits)[399]! };
})();

function partProve(): void {
  tr.reset('p.');
  const bag = Bag({ groups: EX, title: '4 marbles', compact: true }, MF);
  const EF = frame(60, 480, 940, 520);
  const dots = Dots(EXPERIMENT.bs, null, EF, { title: '10 batches of 4 draws: how many blue?', lo: 0, hi: 4 });
  const run = Run(EXPERIMENT.hits, [3, 4], EF, { refTex: '\\tfrac{3}{4}', yTitle: 'share of blue', xTitle: 'draws' });
  const lo = Math.min(...EXPERIMENT.bs), hi = Math.max(...EXPERIMENT.bs);
  const J1 = line('p.J1', '\\text{Sam: 2 of 4 blue}', BOARD.y0 + 100, 64, undefined, 'dim');
  const J2 = line('p.J2', 'P(\\text{blue}) = \\cssId{w}{\\tfrac{1}{2}}\\,?', BOARD.y0 + 200, 80);
  const C1 = line('p.C1', `\\text{4 draws: } \\cssId{e}{${lo}} \\text{ to } \\cssId{f}{${hi}}\\ \\text{blue}`, BOARD.y0 + 380, 64, T);
  const C2 = line('p.C2', `\\cssId{s}{\\tfrac{${EXPERIMENT.end[0]}}{400}} \\approx \\tfrac{3}{4}`, BOARD.y0 + 560, 76, { s: { col: 'first' } });
  const H = line('p.H', 'P(\\text{blue}) = \\cssId{s}{\\tfrac{3}{4}}', BOARD.y0 + 760, 96, { s: { col: 'link' } });
  const leads: Lead[] = [
    { key: 'p.ldC2', from: () => partOf(C2, 's'), to: () => run.where.end, col: 'first' },
    { key: 'p.ldH', from: () => partOf(H, 's'), to: () => run.where.refLabel, col: 'link' },
  ];
  const fade = (k: string, b: ChanceBlock<unknown>): ChanceBlock<unknown> => ({ box: b.box, where: b.where, draw: (c, P) => { const a = 1 - tr.k(k); if (a > 0) { c.g.save(); c.g.globalAlpha *= a; b.draw(c, P); c.g.restore(); } } });
  // Sam's four draws, shown until the evidence replaces them (its own step: 'p.sam')
  const samB = Streak(['blue', 'white', 'blue', 'white'], frame(60, 300, 940, 500), { coin: false, title: 'Sam’s 4 draws', next: false });
  const sam: ChanceBlock<unknown> = { box: samB.box, where: samB.where, draw: c => samB.draw(c, progressOf(s => (s === 'show' ? tr.k('p.sam') : 0))) };
  setChance({
    pre: 'p.', blocks: [bag, fade('p.samOut', sam), fade('p.dotsOut', dots), run], lines: [J1, J2, C1, C2, H], leads,
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(J2, 'w'); strike(c, b.x0 - 12, b.y1 + 8, b.x1 + 12, b.y0 - 8, ks, { col: 'wrong' }); } },
  });
  tr.set('p.bag', 1, 0.8); tr.set('p.marbles', 1, 1.0, 0.3); tr.set('p.title', 1, 0.6, 0.8); tr.set('p.labels', 1, 1.0, 1.0);
  tr.set('p.sam', 1, 1.2, 1.0); tr.set('p.J1', 1, 0.9, 1.8); tr.set('p.J2', 1, 0.9, 2.4);

  const CHIPS = [
    { t: 'In 10 batches of 4 draws, the number of blues jumps around.', fits: 0 },
    { t: 'After 400 draws, the share of blue is close to 3/4.', fits: 1 },
    { t: 'A probability says what happens in the long run, not in a few draws.', fits: 2 },
    { t: 'Four draws should give exactly 3 blue.', fits: -1, mc: 'mc.statistics.sample-should-mirror-population', id: 'p.x-mirror' },
    { t: 'Every draw brings the share closer to 3/4.', fits: -1, mc: 'mc.probability.long-run-convergence-misread', id: 'p.x-closer' },
    { t: 'After two whites, blue is due.', fits: -1, mc: 'mc.probability.gamblers-fallacy', id: 'p.x-due' },
  ];
  const CLAIMS = [
    'Four draws can easily give only 2 blue',
    `Over many draws the share of blue settles near ${fr(3, 4)}`,
    `So Sam’s 4 draws can’t show that the chance of blue is ${fr(1, 2)}`,
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [2, 4, 0, 5, 1, 3];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t.replace('3/4', fr(3, 4))}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t.replace('3/4', fr(3, 4)), () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      fbHost.replaceChildren(html('p', 'dim', SCRIPT[`p.c${n}`]!));
      seq(async alive => {
        if (n === 1) {
          tr.set('p.samOut', 1, 0.6); await wait(0.5); if (!alive()) return;
          tr.set('p.show', 1, 0.8); await wait(0.6); if (!alive()) return;
          tr.set('p.dots', 1, 2.4); await wait(2.4); if (!alive()) return;
          tr.set('p.C1', 1, 1.0);
        } else if (n === 2) {
          tr.set('p.C1:dim', 1, 0.5); tr.set('p.dotsOut', 1, 0.6); await wait(0.6); if (!alive()) return;
          tr.set('p.axes', 1, 0.9); tr.set('p.ref', 1, 0.9, 0.5); await wait(1.4); if (!alive()) return;
          tr.set('p.run', 1, 4.5); await wait(4.6); if (!alive()) return;
          tr.set('p.C2', 1, 1.0); await wait(1.0); if (!alive()) return;
          tr.set('p.ldC2', 1, 0.8);
        } else {
          tr.set('p.ldC2', 0, 0.4); tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.H', 1, 1.2); await wait(1.2); if (!alive()) return;
          tr.set('p.ldH', 1, 0.9); await wait(1.0); if (!alive()) return;
          tr.set('p.strike', 1, 0.7); await wait(0.9); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    const id = 'id' in ch && ch.id ? ch.id : 'p.x-other';
    fbHost.replaceChildren(fbv(false, id));
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: 2 blue in 4 draws, so P(blue) = 1/2. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.statistics.sample-statistic-as-exact-parameter' : undefined });
    proofHost.replaceChildren(voiced(right ? 'p.yes' : 'p.no'), chain, fbHost, chipBox);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as ProbItem),
  });
}

/** the painter of an item's picture: the block, the steps shown with the question, the steps of the solution */
interface PicView { b: ChanceBlock<unknown>; show: string[]; solve: string[] }
function picView(p: Pic, fr_: Frame): PicView {
  switch (p.kind) {
    case 'bag': return { b: Bag({ groups: p.groups, event: p.event, other: p.other, title: p.title }, fr_), show: ['bag', 'marbles', 'title', ...(p.labels ? ['labels'] : [])], solve: ['labels', 'space', 'event', 'other'] };
    case 'cube': return { b: Cube(fr_, { event: p.event, title: p.title }), show: ['show'], solve: p.event?.length ? ['event'] : [] };
    case 'spinner': return { b: Spinner(p.sectors, fr_, { event: p.event, angles: p.angles, title: p.title }), show: ['show'], solve: p.event?.length ? ['event'] : [] };
    case 'bars': return { b: Bars(p.rows, fr_, { title: p.title, event: p.event, ref: p.ref, max: p.max }), show: ['show', 'ref'], solve: p.event?.length ? ['event'] : [] };
    case 'scale': return { b: Scale(fr_.x + 110, fr_.x + fr_.w - 110, fr_.y + fr_.h / 2 + 60, p.pins, { ticks: 4 }), show: ['scale', 'words', ...p.pins.slice(0, p.given).map((_, i) => `pin${i}`)], solve: p.pins.slice(p.given).map((_, i) => `pin${i + p.given}`) };
    case 'strip': return { b: Strip(p.n, p.d, p.k, fr_, { title: p.title, answer: p.answer }), show: ['show', 'cut'], solve: ['take', 'answer'] };
    case 'run': return { b: Run(p.hits, p.p, fr_, { log: p.log, marks: p.marks, refTex: p.refTex, yTitle: 'share of heads', xTitle: 'tosses' }), show: ['axes', 'ref', 'run', 'marks'], solve: [] };
    case 'dots': return { b: Dots(p.ref, p.obs, fr_, { title: p.title, obsLabel: p.obsLabel }), show: ['show', 'dots', 'obs'], solve: [] };
    case 'digits': return { b: Digits(p.digits, p.size, fr_, { wins: p.wins, legend: p.legend }), show: ['show'], solve: ['blocks', 'event'] };
    case 'table': return { b: Table(p.rows, p.cols, p.cells, fr_, { event: p.event, rowTitle: p.rowTitle, colTitle: p.colTitle }), show: ['show'], solve: p.event?.length ? ['event'] : [] };
    case 'tree': return { b: Tree(p.n, fr_, { event: p.event }), show: ['show'], solve: p.event?.length ? ['event'] : [] };
    case 'streak': return { b: Streak(p.past, fr_, { coin: p.coin, dice: p.dice, title: p.title }), show: ['show'], solve: [] };
  }
}
function makePic(p: Pic | undefined): PicView | null {
  if (!p) return null;
  const r = tryBlock(() => picView(p, MF));
  if (!r.ok) { console.error(`probability: picture ${p.kind} not drawable: ${r.error}`); return null; }
  return r.value;
}
const BIG_Q = box(260, 170, 1660, 560), BIG_H = box(260, 600, 1660, 900);
/** a board line that always fits the slate: line() stops at 60 px; words may go down to 46 px (labels >= 44) */
function fitLine(key: string, src: string, y: number, size: number, col?: 'link'): Line {
  const L = line(key, src, y, size, undefined, col);
  let s = L.size;
  while (s > 46 && texWidth(L.F, s) > BOARD_W) s -= 2;
  return { ...L, size: s };
}
function showItem(item: ProbItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const v = makePic(item.pic);
  const heroSrc = item.hero ?? '';
  if (v && !item.picOnSolve) {
    const Tl = fitLine('x.T', item.board, BOARD.y0 + 110, 80);
    const Hl = fitLine('x.H', heroSrc, BOARD.y0 + 330, 80, 'link');
    setChance({ pre: 'x.', blocks: [v.b], lines: heroSrc ? [Tl, Hl] : [Tl], leads: [] });
    v.show.forEach((s, i) => tr.set('x.' + s, 1, s === 'run' ? 2.6 : 0.9, 0.15 * i));
    tr.set('x.T', 1, 0.8, 0.5);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        for (const s of v.solve) { tr.set('x.' + s, 1, 0.9); await wait(0.5); if (!alive()) return; }
        if (heroSrc) tr.set('x.H', 1, 1.1);
      },
    };
  }
  // bare (or the picture comes with the solution): the question big, the solution below it
  const Tb = bigLine('x.T', item.board, BIG_Q, 120);
  const Hb = heroSrc ? bigLine('x.H', heroSrc, BIG_H, 100) : null;
  if (Hb) Hb.col = 'link';
  setChance({ pre: 'x.', blocks: [], lines: Hb ? [Tb, Hb] : [Tb], leads: [], boardBox: box(200, 120, 1720, 940) });
  tr.set('x.T', 1, 0.8, 0.1);
  return {
    solve: async alive => {
      if (v) {
        const Tl = fitLine('x.T2', item.board, BOARD.y0 + 110, 80);
        const Hl = fitLine('x.H2', heroSrc, BOARD.y0 + 330, 80, 'link');
        setChance({ pre: 'x.', blocks: [v.b], lines: [Tl, Hl], leads: [] });
        tr.jump('x.T2', 1); tr.set('x.T2:dim', 1, 0.5);
        v.show.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.1 * i));
        await wait(0.9); if (!alive()) return;
        for (const s of v.solve) { tr.set('x.' + s, 1, 0.9); await wait(0.5); if (!alive()) return; }
        tr.set('x.H2', 1, 1.1);
        return;
      }
      if (Hb) { tr.set('x.T:dim', 1, 0.5); tr.set('x.H', 1, 1.1); }
    },
  };
}

// a self-check for headless runs: every family x sub-goal x n seeds builds its picture (or has none)
(window as unknown as { __probSelftest: (n: number) => string[] }).__probSelftest = (n: number) => {
  const errs: string[] = [];
  for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= n; s++) {
    const it = GENS[f as keyof typeof GENS](rng(s * 977 + f.length), s, p.id) as ProbItem;
    if (it.pic) { const r = tryBlock(() => picView(it.pic!, MF)); if (!r.ok) errs.push(`${it.id} ${it.pic.kind}: ${r.error}`); }
    // board lines sit on the slate when the item has a picture, otherwise they are drawn big across the wall
    for (const src of [it.board, it.hero ?? '']) if (src) {
      try {
        if (it.pic) { const L = fitLine('selftest', src, 300, 80); if (texWidth(L.F, L.size) > BOARD_W + 2) errs.push(`${it.id} board too wide: ${src}`); }
        else { const L = bigLine('selftest', src, BIG_Q, 120); if (texWidth(L.F, L.size) > BIG_Q.w - 60) errs.push(`${it.id} big line too wide: ${src}`); }
      } catch (e) { errs.push(`${it.id} tex ${src}: ${(e as Error).message}`); }
    }
  }
  return errs;
};

void runLesson({
  slug: SLUG,
  warm: ['P(\\text{blue}) = \\,?', '\\text{Sam: 2 of 4 blue}', 'B_1', '\\tfrac{3}{4}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
