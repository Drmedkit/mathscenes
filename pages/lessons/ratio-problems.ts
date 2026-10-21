// ratio-problems.ts: "Solve ratio problems with fractions and decimals" (grade 7, 6.RP.A.3, 7.RP.A.1-3) on the shared
// lesson runtime. The model is a double number line (DoubleLine): pairs line up on one tick, so a multiplier on one
// quantity is the same multiplier on the other, whole or not.
//   1 The question   4 pounds of cherries cost $10: what do 6 pounds cost? 3 cards ($15; $12 = keep the difference;
//                    $2.40 = rate divided the wrong way) + how sure
//   2 Worked example the multiplier (6 ÷ 4 = 1.5), the same in whole steps (cut into 2 pieces, count 3), both
//                    quantities × 1.5, the check with the rate inside each pair ($2.50 per pound); one "why?"
//   3 Your turn      Maya hikes 12 miles in 4 hours: 9 miles? The multiplier is given; the kid predicts (less), finds
//                    3 hours, names the rate (3 miles per hour); the callback to part 1
//   4 Prove it       Alex rounds $20 ÷ 7 to $2.86 first: $34.32. A because-chain from reason chips (exact 240/7, one
//                    rounding $34.29, the early rounding grew); distractors = catalogue misconceptions
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts), 26 families
// Voiced lines: src/lesson/topics/ratio-problems/script.ts (panel HTML) = voice/lines.json (spoken). Every card, chip
// and input of parts 1-4 is logged with its misconception id.
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { strike } from '../../src/core/draw';
import { texBox } from '../../src/core/tex';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, bigLine, line, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { DoubleLine, DL_FRAME, type DLBlock, type DLFocus, type DLRing, type DLSpec } from '../../src/lesson/topics/ratio-problems/DoubleLine';
import { FAMILY_NAMES, GENERATORS, MC, type RPItem } from '../../src/lesson/topics/ratio-problems/items';
import { PLAN } from '../../src/lesson/topics/ratio-problems/plan';
import { SCRIPT } from '../../src/lesson/topics/ratio-problems/script';
import { CHERRY, HIKE, PEARS } from '../../src/lesson/topics/ratio-problems/specs';

const SLUG = 'ratio-problems';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
// the narrator: one line at a time; a newer line cancels the queue
let vq = 0;
function sayAll(ids: string[]): void { const t = ++vq; void (async () => { for (const id of ids) { if (t !== vq) return; await ctx.say(id); } })(); }
const sayOnly = (id: string) => sayAll([id]);
/** a voiced panel line: the HTML from the script; the narrator says it */
function para(id: string, cls = '', speak = true): HTMLElement {
  if (!(id in SCRIPT)) console.warn('no voice line', id);
  if (speak) sayOnly(id);
  return html('p', cls, SCRIPT[id] ?? id);
}
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { sayOnly(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- the model and the board ----------
const mk = (S: DLSpec): DLBlock => DoubleLine(S, DL_FRAME, th);
function setDL(pre: string, m: DLBlock | null, lines: Line[], focus?: () => DLFocus, extra?: Parameters<typeof setScene>[0]['extra']): void {
  setScene({ table: 1080, model: c => { if (m) m.draw(c, progressOf(s => tr.k(pre + s)), focus?.()); }, lines, leads: [], extra });
}
const AB = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, x: { col: 'wrong' as const }, d: { col: 'dim' as const } };
const BOARD_FIT = BOARD.w - 100;
/** one board line that fits the slate: it shrinks, but numbers stay >= 60 px */
function one(key: string, src: string, y: number, size: number, col?: Line['col']): Line {
  let L = line(key, src, y, size, AB, col);
  for (let s = size; s >= 60 && L.F.w * L.size / 1000 > BOARD_FIT; s -= 4) L = line(key, src, y, s, AB, col);
  if (L.F.w * L.size / 1000 > BOARD_FIT) console.warn(`board line too wide: ${src}`);
  return L;
}
/** a ring on a label of the double line, keyed `<pre>r.<name>` */
const ring = (pre: string, name: string, at: DLRing['at'], line: 'top' | 'bot', col: 'pick' | 'link' | 'wrong' = 'pick'): DLRing => ({ at, line, col, k: tr.k(pre + 'r.' + name) });
async function pulse(key: string, alive: () => boolean, hold = 1.1): Promise<void> { tr.set(key, 1, 0.35); await wait(hold); if (!alive()) return; tr.set(key, 0, 0.6); }


// ===== 1. The question =====
const CARDS = [
  { t: '$12', mc: MC.additive, ok: false, why: 'q.cb.add' },
  { t: '$15', mc: '', ok: true, why: 'q.cb.right' },
  { t: '$2.40', mc: MC.reversed, ok: false, why: 'q.cb.rev' },
];
function partQuestion(): void {
  tr.reset('q.');
  const m = mk(CHERRY);
  const Q0 = one('q.l0', `\\cssId{a}{4}\\text{ lb} : \\cssId{b}{\\$10}`, BOARD.y0 + 220, 100);
  const Q1 = one('q.l1', `\\cssId{a}{6}\\text{ lb} : \\;?`, BOARD.y0 + 400, 100);
  setDL('q.', m, [Q0, Q1]);
  tr.set('q.rails', 1, 1.2, 0.1); tr.set('q.given', 1, 1.4, 0.9); tr.set('q.l0', 1, 0.9, 1.8);
  tr.set('q.target', 1, 0.9, 2.8); tr.set('q.l1', 1, 0.9, 3.3);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '4 pounds of cherries cost $10. How much do 6 pounds cost?', board: '4 lb : $10 = 6 lb : ?', response: c.t, expected: '$15', correct: c.ok, mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>for 6 pounds</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  sayAll(['q.intro', 'q.ask']);
  setPanel(h('h2', {}, 'Cherries by the pound'), para('q.intro', '', false), para('q.ask', '', false), cards,
    h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example =====
function partExample(): void {
  tr.reset('e.');
  const m = mk(CHERRY);
  const y = BOARD.y0;
  const E0 = one('e.E0', `\\cssId{a}{4}\\text{ lb} : \\cssId{b}{\\$10}`, y + 90, 76);
  const E1 = one('e.E1', `\\cssId{a}{6}\\text{ lb} : \\;?`, y + 190, 76);
  const S1 = one('e.S1', `\\cssId{a}{6} \\div \\cssId{a}{4} = \\cssId{s}{1.5}`, y + 320, 76);
  const S2a = one('e.S2a', `\\div 2:\\;\\; \\cssId{a}{2}\\text{ lb} : \\cssId{b}{\\$5}`, y + 440, 70);
  const S2b = one('e.S2b', `\\times 3:\\;\\; \\cssId{a}{6}\\text{ lb} : \\cssId{s}{\\$15}`, y + 540, 70);
  const S3 = one('e.S3', `\\cssId{b}{\\$10} \\times 1.5 = \\cssId{s}{\\$15}`, y + 660, 76);
  const S4a = one('e.S4a', `10 \\div 4 = \\cssId{s}{2.5}`, y + 760, 66);
  const S4c = one('e.S4a', `15 \\div 6 = \\cssId{s}{2.5}`, y + 845, 66);
  const S4b = one('e.S4b', `\\cssId{s}{\\$2.50}\\text{ per lb}`, y + 935, 66);
  let arcLines: DLFocus['arcLines'] = 'top';
  const focus = (): DLFocus => ({
    arcLines, splitArcs: true,
    rings: [ring('e.', 'g', 'given', 'top'), ring('e.', 't', 'target', 'top'), ring('e.', 'p', 'piece', 'top'), ring('e.', 'pb', 'piece', 'bot'),
      { at: 'fill', line: 'bot', col: 'link', k: tr.k('e.r.f') }, ring('e.', 'u', 'unit', 'bot', 'link'), { at: 'claim', line: 'bot', col: 'wrong', k: tr.k('e.r.c') }],
  });
  setDL('e.', m, [E0, E1, S1, S2a, S2b, S3, S4a, S4c, S4b], focus);
  for (const k of ['rails', 'given', 'target', 'E0', 'E1']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Find the multiplier', why: 'New ÷ old, on the pounds.', act: 'Find it' },
    { t: 'Do it in whole steps', why: 'Cut into equal pieces, then count them.', act: 'Cut and count' },
    { t: 'Same multiplier on both', why: 'The dollars get × 1.5 too.', act: 'Multiply' },
    { t: 'Check with the rate', why: 'Inside each pair: dollars ÷ pounds.', act: 'Check' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        void pulse('e.r.g', alive, 0.9); await wait(0.6); if (!alive()) return;
        void pulse('e.r.t', alive, 0.9); await wait(0.5); if (!alive()) return;
        tr.set('e.arc0', 1, 1.3); await wait(1.4); if (!alive()) return;
        tr.set('e.S1', 1, 0.9); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.S1:dim', 1, 0.5);
        tr.set('e.cut', 1, 1.4); await wait(1.5); if (!alive()) return;
        void pulse('e.r.p', alive); void pulse('e.r.pb', alive); tr.set('e.S2a', 1, 0.9); await wait(1.4); if (!alive()) return;
        tr.set('e.count', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.fill', 1, 0.8); await wait(0.6); if (!alive()) return;
        tr.set('e.S2b', 1, 0.9); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.S2a:dim', 1, 0.5); tr.set('e.S2b:dim', 1, 0.5);
        arcLines = 'both'; tr.set('e.arcB0', 1, 1.3); await wait(1.4); if (!alive()) return;
        void pulse('e.r.f', alive, 1.3); tr.set('e.S3', 1, 0.9); await wait(1.2);
      } else {
        tr.set('e.S3:dim', 1, 0.5); tr.set('e.arc0', 0, 0.6); tr.set('e.arcB0', 0, 0.6);
        tr.set('e.unit', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.within0', 1, 1.0); await wait(0.8); if (!alive()) return;
        tr.set('e.within1', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.S4a', 1, 0.9); await wait(0.9); if (!alive()) return;
        void pulse('e.r.u', alive, 1.3); tr.set('e.S4b', 1, 0.9); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(para(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '6 pounds is 1.5 times 4 pounds, so it costs 1.5 times as much.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: '6 is 2 more than 4, so add $2 to the price: $12.', ok: false, id: 'e.why.add', mc: MC.additive as string | undefined },
      { t: 'The price per pound is 1.5, so multiply by 1.5.', ok: false, id: 'e.why.rate', mc: MC.betweenWithin as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why do the dollars get × 1.5 too?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.id === 'e.why.add') seq(async alive => {
        tr.set('e.within0', 0, 0.5); tr.set('e.within1', 0, 0.5);
        tr.set('e.claim', 1, 0.9); await wait(1.0); if (!alive()) return;
        void pulse('e.r.c', alive, 2.4); await wait(3.4); if (!alive()) return;
        tr.set('e.claim', 0, 0.8); tr.set('e.within0', 1, 0.6); tr.set('e.within1', 1, 0.6);
      });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    sayAll(['e.why']);
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), para('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: Maya's hike, 12 miles in 4 hours -> 9 miles =====
function partTurn(): void {
  tr.reset('t.');
  const m = mk(HIKE);
  const y = BOARD.y0;
  const T0 = one('t.T0', `\\cssId{a}{4}\\text{ h} : \\cssId{b}{12}\\text{ mi}`, y + 100, 76);
  const T1 = one('t.T1', `\\;?\\; : \\cssId{b}{9}\\text{ mi}`, y + 200, 76);
  const T2 = one('t.T2', `\\cssId{b}{9} \\div \\cssId{b}{12} = \\cssId{s}{0.75}`, y + 340, 76);
  const T3 = one('t.T3', `\\cssId{a}{4} \\times 0.75 = \\cssId{s}{3}\\text{ h}`, y + 480, 76);
  const T4 = one('t.T4', `12 \\div 4 = 9 \\div 3 = \\cssId{s}{3}`, y + 620, 70);
  const T5 = one('t.T5', `\\cssId{s}{3}\\text{ mi per h}`, y + 730, 70);
  let arcLines: DLFocus['arcLines'] = 'bot';
  setDL('t.', m, [T0, T1, T2, T3, T4, T5], () => ({ arcLines, splitArcs: true, rings: [{ at: 'target', line: 'bot', col: 'pick', k: tr.k('t.r.t') }, { at: 'given', line: 'bot', col: 'pick', k: tr.k('t.r.g') }] }));
  tr.set('t.rails', 1, 1.0); tr.set('t.given', 1, 1.2, 0.6); tr.set('t.T0', 1, 0.9, 1.4); tr.set('t.target', 1, 0.9, 2.2); tr.set('t.T1', 1, 0.9, 2.6);
  let step = 0;
  const STEPS = [
    { t: 'Find the multiplier', why: 'Done for you: 9 ÷ 12 on the miles.' },
    { t: 'Predict the size', why: 'Your step.' },
    { t: 'Multiply both', why: 'Your step.' },
    { t: 'Check with the rate', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a steady hike'), para('t.intro'), plan, work);
  seq(async alive => {
    await wait(6.0); if (!alive()) return;
    void pulse('t.r.g', alive, 0.9); await wait(0.5); if (!alive()) return;
    void pulse('t.r.t', alive, 0.9); await wait(0.5); if (!alive()) return;
    tr.set('t.arcB0', 1, 1.3); await wait(1.4); if (!alive()) return;
    tr.set('t.T2', 1, 0.9); await wait(1.0); if (!alive()) return;
    work.replaceChildren(para('t.s1'));
    await wait(4.5); if (!alive()) return;
    step = 1; drawPlan(); askPredict();
  });
  function choiceStep(promptId: string, item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], expected: string, then: () => void): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item, prompt, board: '4 h : 12 mi = ? : 9 mi', response: o.t, expected, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (o.ok) { done = true; then(); }
    })));
    work.replaceChildren(para(promptId), bx, fbHost);
  }
  function askPredict(): void {
    choiceStep('t.pred', 'turn.predict', 'Before working it out: more or less than 4 hours?', [
      { t: 'Less than 4 hours: × 0.75 makes it smaller.', ok: true, id: 't.p-ok' },
      { t: 'More than 4 hours: multiplying makes it bigger.', ok: false, id: 't.p-big', mc: MC.bigger },
      { t: 'More than 4 hours: 12 ÷ 9 is more than 1.', ok: false, id: 't.p-inv', mc: MC.inverted },
    ], 'Less than 4 hours', () => seq(async alive => { await wait(2.6); if (!alive()) return; step = 2; drawPlan(); askHours(); }));
  }
  function askHours(): void {
    const fbHost = h('div'), inp = numInput('hours', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.h-empty')); return; }
      const v = r.v, right = Math.abs(v - 3) < 1e-9;
      const near = (x: number) => Math.abs(v - x) < 0.02;
      const kind = right ? 'ok' : near(1) ? 'add' : near(16 / 3) ? 'inv' : near(6.75) ? 'miles' : near(0.75) ? 'mult' : 'no';
      const mc = kind === 'add' ? MC.additive : kind === 'inv' ? MC.inverted : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.hours', prompt: '12 miles in 4 hours: how many hours for 9 miles?', board: '4 h : 12 mi = ? : 9 mi', response: v, expected: 3, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fb(false, `t.h-${kind}`)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fb(true, 't.h-ok'));
      seq(async alive => {
        arcLines = 'both'; tr.set('t.arc0', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('t.cut', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('t.count', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('t.fill', 1, 0.8); tr.set('t.T3', 1, 0.9, 0.3); await wait(2.4); if (!alive()) return;
        step = 3; drawPlan(); askRate();
      });
    }
    work.replaceChildren(para('t.hours'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askRate(): void {
    choiceStep('t.rate', 'turn.rate', 'What is Maya’s speed (the rate inside one pair)?', [
      { t: '0.75, with no unit', ok: false, id: 't.r-mult', mc: MC.betweenWithin },
      { t: '3 miles per hour', ok: true, id: 't.r-ok' },
      { t: '⅓ mile per hour', ok: false, id: 't.r-rev', mc: MC.reversed },
    ], '3 miles per hour', () => seq(async alive => {
      tr.set('t.arc0', 0, 0.6); tr.set('t.arcB0', 0, 0.6);
      tr.set('t.within0', 1, 1.0, 0.3); await wait(1.0); if (!alive()) return;
      tr.set('t.within1', 1, 1.0); await wait(1.1); if (!alive()) return;
      tr.set('t.T4', 1, 0.9); tr.set('t.T5', 1, 0.9, 0.6); await wait(2.6); if (!alive()) return;
      step = 4; drawPlan(); work.append(callback());
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    sayOnly(id);
    const p = html('p', '', (SCRIPT[id] ?? '') + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''));
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Alex rounds too early =====
function partProve(): void {
  tr.reset('p.');
  const m = mk(PEARS);
  const y = BOARD.y0;
  const A0 = one('p.A0', `\\text{Alex: } 20 \\div 7 \\approx 2.86`, y + 90, 66, 'dim');
  const A1 = one('p.A1', `2.86 \\times 12 = \\cssId{x}{34.32}`, y + 180, 66, 'dim');
  const P1 = one('p.P1', `\\cssId{b}{20} \\times 12 \\div 7`, y + 330, 70);
  const P2 = one('p.P2', `240 \\div 7 = 34.28\\cssId{a}{5}\\ldots`, y + 450, 70);
  const P3 = one('p.P3', `\\approx \\cssId{s}{\\$34.29}`, y + 560, 76);
  const P4 = one('p.P4', `2.86 - 2.857\\ldots`, y + 700, 64);
  const P5 = one('p.P5', `0.003 \\times 12 \\approx \\cssId{x}{0.03}`, y + 800, 64);
  const extra = (c: Parameters<NonNullable<Parameters<typeof setScene>[0]['extra']>>[0]) => {
    const k = tr.k('p.strike');
    if (k <= 0) return;
    const b = texBox(A1.F, A1.x, A1.y, { size: A1.size, align: 'left' });
    strike(c, b.x0 - 8, b.cy + 6, b.x1 + 8, b.cy - 6, k, { col: 'wrong' });
  };
  setDL('p.', m, [A0, A1, P1, P2, P3, P4, P5], () => ({ rings: [{ at: 'fill', line: 'bot', col: 'link', k: tr.k('p.r.f') }, { at: 'piece', line: 'bot', col: 'pick', k: tr.k('p.r.p') }] }), extra);
  tr.set('p.rails', 1, 1.0); tr.set('p.given', 1, 1.2, 0.6); tr.set('p.target', 1, 0.9, 1.6);
  tr.set('p.A0', 1, 0.9, 2.2); tr.set('p.A1', 1, 0.9, 3.0);
  const CHIPS = [
    { t: 'From 7 pounds to 12 pounds is × 12/7. Keep that multiplier as a fraction.', fits: 0 },
    { t: 'The digit after the cents is 5, so round up, once, at the end.', fits: 1 },
    { t: 'He rounded 2.857… up to 2.86 first, and × 12 made that small extra 12 times bigger.', fits: 2 },
    { t: 'Money only has cents, so round to cents at every step.', fits: -1, mc: MC.early, id: 'p.no.early' },
    { t: 'Cut off the digits after the cents: $34.28.', fits: -1, mc: MC.truncates, id: 'p.no.trunc' },
  ];
  const CLAIMS = [
    'Exactly, 12 pounds cost <b>$20 × 12/7 = 240/7 dollars</b>,',
    '240 ÷ 7 = 34.285…, so the cost is <b class="s">$34.29</b>,',
    'Alex’s <b class="w">$34.32</b> is 3 cents too much,',
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
    if (ch.fits !== filled) { fbHost.replaceChildren(fb(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fb(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.cut', 1, 2.0); await wait(2.1); if (!alive()) return;
        void pulse('p.r.p', alive, 1.2); tr.set('p.count', 1, 2.6); await wait(2.7); if (!alive()) return;
        tr.set('p.arc0', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('p.P1', 1, 0.9);
      }
      if (n === 2) {
        tr.set('p.P2', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('p.fill', 1, 0.9); void pulse('p.r.f', alive, 1.4); tr.set('p.P3', 1, 0.9, 0.3);
      }
      if (n === 3) {
        tr.set('p.P4', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('p.P5', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Alex is right', () => judge(true)), no = btn('Alex is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: '7 lb cost $20. Alex: 20 ÷ 7 ≈ 2.86, 12 × 2.86 = $34.32. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.early : undefined });
    proofHost.replaceChildren(para(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), para('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as RPItem),
  });
}
/** the board text of an item, split where it is wide: "a : b = c : ?" becomes two lines */
function boardRows(src: string): string[] {
  const parts = src.split(/\s*\\quad\s*|\s*\\qquad\s*/);
  return parts.flatMap(p => { const i = p.indexOf(' = '); return i > 0 && p.length > 34 ? [p.slice(0, i), '= ' + p.slice(i + 3)] : [p]; });
}
function showItem(item: RPItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const S = item.picture?.dl;
  const made = S ? tryBlock(() => mk(S)) : null;
  if (S && made && made.ok) {
    const m = made.value;
    const rows = boardRows(item.board).map((r, i) => one('x.B', r, BOARD.y0 + 140 + i * 120, 72));
    setDL('x.', m, rows, () => ({ arcLines: 'both' }));
    tr.set('x.rails', 1, 0.8); tr.set('x.given', 1, 1.0, 0.3); tr.set('x.target', 1, 0.8, 1.0); tr.set('x.B', 1, 0.9, 0.5);
    return {
      solve: async alive => {
        for (let i = 0; i < (S.arcs?.length ?? 0); i++) { tr.set(`x.arc${i}`, 1, 1.0); await wait(1.1); if (!alive()) return; }
        if (S.pieces) { tr.set('x.cut', 1, 1.3); await wait(1.4); if (!alive()) return; tr.set('x.count', 1, 1.6); await wait(1.7); if (!alive()) return; }
        if (S.unit) { tr.set('x.unit', 1, 0.9); await wait(1.0); if (!alive()) return; }
        for (let i = 0; i < (S.within?.length ?? 0); i++) { tr.set(`x.within${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; }
        tr.set('x.fill', 1, 0.9);
      },
    };
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['4\\text{ lb} : \\$10 \\div \\times \\approx \\ldots', '\\dfrac{3}{4}', '\\xrightarrow{\\times 2}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
