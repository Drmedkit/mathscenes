// conditional-statements.ts: "If-then statements and logical language" (Geometry, lesson 1) on the shared runtime.
//   1 The question   Ms. Reyes's promise "if you score 90 or more, then you get an A": which student can say she broke
//                    it? (Jo 95 / B = right; Max 85 / A = inverse error; Lee 80 / B = false hypothesis) + how sure
//   2 Worked example the Euler picture of "if n is a multiple of 4, then n is even" over 1..12: name the parts (amber
//                    hypothesis region, teal conclusion region), sort the domain (amber lands inside teal: true), the
//                    four cases (a truth table row per zone; only P-outside-Q breaks it, and it is empty), swap: the
//                    converse (6 breaks it); one "why?" with 3 reasons
//   3 Your turn      "if x > 6, then x > 3" over 0..9, faded: named and sorted for you; the student negates x > 6
//                    (boundary), forms the contrapositive (same picture from the outside), breaks the inverse (5)
//   4 Prove it       Sam: "every quadrilateral here with four right angles has four equal sides; I checked two
//                    squares". A because-chain disproof by counterexample (the rectangle B) from reason chips
//   5 Practice       all 13 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/conditional-statements/script.ts -> voice/lines.json. Every answer is logged.
import type { Canvas } from '../../src/core/draw';
import { box, type Box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Frame, frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { slate } from '../../src/lesson/annotate';
import { drawWords, wordsBox } from '../../src/lesson/words';
import { Euler, type EulerParams, type EulerStep, type ZoneSel } from '../../src/lesson/topics/conditional-statements/Euler';
import { CaseTable, type CaseStep } from '../../src/lesson/topics/conditional-statements/CaseTable';
import { PRACTICE_FRAME } from '../../src/lesson/topics/conditional-statements/eulerLayout';
import { E_PIC, E_XS, LESSON_FRAME, P_PIC, Q_PIC, T_PIC, T_XS } from '../../src/lesson/topics/conditional-statements/lessonPics';
import { FAMILY_NAMES, GENERATORS, MC, type CSItem } from '../../src/lesson/topics/conditional-statements/items';
import { PLAN } from '../../src/lesson/topics/conditional-statements/plan';
import { explain } from '../../src/lesson/topics/conditional-statements/explain';
import { SCRIPT } from '../../src/lesson/topics/conditional-statements/script';
import LINES from './conditional-statements/voice/lines.json';

const SLUG = 'conditional-statements';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line from the script: the panel shows its HTML, the narrator says lines.json[id] */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const s = SCRIPT[id];
  if (!s) throw new Error(`no script line ${id}`);
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, s.html + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]!.html); }
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  if (texWidth(F, s) > BOARD_W + 40) console.warn('board line too wide:', src);
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, col };
}

// ===================== the Euler rig: block + named animated focus =====================
interface RigOpts { zones?: [ZoneSel, Paint][]; glow?: [number, Paint][]; cross?: number[] }
function eulerRig(pre: string, p: EulerParams, fr: Frame, o: RigOpts = {}) {
  const E = Euler(p, fr, th);
  const P = progressOf<EulerStep>(s => tr.k(`${pre}eu.${s}`));
  const focus = () => ({
    zones: (o.zones ?? []).map(([at, col], j) => ({ at, col, k: tr.k(`${pre}z${j}`) })),
    glow: (o.glow ?? []).map(([i, col], j) => ({ i, col, k: tr.k(`${pre}g${j}`) })),
    cross: (o.cross ?? []).map((i, j) => ({ i, k: tr.k(`${pre}x${j}`) })),
    pulseP: tr.k(`${pre}pulseP`), pulseQ: tr.k(`${pre}pulseQ`),
  });
  return { E, draw: (c: Canvas) => E.draw(c, P, focus()) };
}
const eu = (pre: string, s: EulerStep, to = 1, d = 0.9, delay = 0) => tr.set(`${pre}eu.${s}`, to, d, delay);
async function pulse(key: string, alive: () => boolean): Promise<void> { tr.set(key, 1, 0.35); await wait(1.1); if (!alive()) return; tr.set(key, 0, 0.6); }

// ===================== 1. The question =====================
const CARDS = [
  { name: 'Jo', t: '95 points, got a B', mc: undefined as string | undefined, why: 'q.cb.jo', right: true },
  { name: 'Max', t: '85 points, got an A', mc: MC.inverseError as string | undefined, why: 'q.cb.max', right: false },
  { name: 'Lee', t: '80 points, got a B', mc: MC.falseHyp as string | undefined, why: 'q.cb.lee', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const rig = eulerRig('q.', Q_PIC, LESSON_FRAME);
  const L = [
    centred('q.L1', '\\text{If } p, \\text{ then } q.', 170, 72),
    centred('q.L2', 'p:\\ \\text{score} \\ge 90', 290, 68, 'first'),
    centred('q.L3', 'q:\\ \\text{an A}', 390, 68, 'second'),
  ];
  setScene({ model: rig.draw, lines: L, leads: [] });
  eu('q.', 'domain', 1, 0.8, 0.2); eu('q.', 'P', 1, 0.9, 1.2); eu('q.', 'Q', 1, 0.9, 2.0);
  tr.set('q.L1', 1, 1.0, 0.8); tr.set('q.L2', 1, 0.9, 1.5); tr.set('q.L3', 1, 0.9, 2.3);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Promise: if you score 90 or more, then you get an A. Who can say it was broken?', response: `${c.name}: ${c.t}`, expected: 'Jo: 95 points, got a B', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.name}<small>${cd.t}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A broken promise?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== the case table on the board (parts 2) =====================
const TABLE_FRAME = frame(1252, 352, 596, 560);

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const i8 = E_XS.indexOf(8), i6 = E_XS.indexOf(6), i7 = E_XS.indexOf(7);
  const rig = eulerRig('e.', E_PIC, LESSON_FRAME, {
    zones: [['pq', 'link'], ['p', 'wrong'], ['q', 'pick'], ['o', 'pick'], ['q', 'wrong']],
    glow: [[i8, 'link'], [i6, 'pick'], [i7, 'pick'], [i6, 'wrong']],
    cross: [i6],
  });
  const T = CaseTable({ head: ['n', 'p', 'q', 'p \\to q'], headCol: ['dim', 'first', 'second', 'ink'], rows: [['8', 'T', 'T', 'T'], ['\\text{none}', 'T', 'F', 'F'], ['6', 'F', 'T', 'T'], ['7', 'F', 'F', 'T']], keys: 3 }, TABLE_FRAME, th);
  const TP = progressOf<CaseStep>(s => tr.k(`e.tb.${s}`));
  const L = {
    p: centred('e.p', 'p:\\ \\text{multiple of } 4', 126, 66, 'first'),
    q: centred('e.q', 'q:\\ \\text{even}', 206, 66, 'second'),
    pq: centred('e.pq', 'p \\to q', 290, 72),
    conv: centred('e.conv', 'q \\to p:\\ \\text{false at } 6', 962, 64, 'wrong'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [], extra: c => T.draw(c, TP, { rings: [0, 1, 2, 3].map(i => ({ i, col: (i === 1 ? 'wrong' : i === 0 ? 'link' : 'pick') as Paint, k: tr.k(`e.ring${i}`) })) }) });
  eu('e.', 'domain', 1, 0.6); eu('e.', 'tokens', 1, 1.2, 0.4);
  let step = 0;
  const STEPS = [
    { t: 'Name the parts', why: 'Hypothesis and conclusion.', act: 'Name them' },
    { t: 'Sort the domain', why: 'Where does every number go?', act: 'Sort' },
    { t: 'The four cases', why: 'Which case can break it?', act: 'Show cases' },
    { t: 'Swap: the converse', why: 'Is it the same statement?', act: 'Swap' },
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
        eu('e.', 'P', 1, 0.9); void pulse('e.pulseP', alive); tr.set('e.p', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        eu('e.', 'Q', 1, 0.9); void pulse('e.pulseQ', alive); tr.set('e.q', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('e.pq', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        eu('e.', 'sort', 1, 2.2); await wait(2.6);
      } else if (i === 2) {
        tr.set('e.tb.head', 1, 0.7); await wait(0.6); if (!alive()) return;
        const rows: [number, number, number | null][] = [[0, 0, 0], [1, 1, null], [2, 2, 1], [3, 3, 2]];
        for (const [r, z, g] of rows) {
          for (const k of ['e.z0', 'e.z1', 'e.z2', 'e.z3', 'e.g0', 'e.g1', 'e.g2', 'e.ring0', 'e.ring1', 'e.ring2', 'e.ring3']) tr.set(k, 0, 0.4);
          tr.set(`e.z${z}`, 1, 0.5); if (g !== null) tr.set(`e.g${g}`, 1, 0.5);
          tr.set(`e.tb.r${r}`, 1, 0.6, 0.2); tr.set(`e.ring${r}`, 1, 0.5, 0.2); tr.set(`e.tb.v${r}_3`, 1, 0.6, 0.8);
          await wait(1.7); if (!alive()) return;
        }
        for (const k of ['e.z0', 'e.z2', 'e.z3', 'e.g0', 'e.g1', 'e.g2', 'e.ring0', 'e.ring2', 'e.ring3']) tr.set(k, 0, 0.5);
        tr.set('e.ring1', 1, 0.5);
      } else {
        tr.set('e.ring1', 0, 0.5); tr.set('e.z1', 0, 0.5);
        tr.set('e.z4', 1, 0.7); void pulse('e.pulseQ', alive); await wait(1.0); if (!alive()) return;
        tr.set('e.g3', 1, 0.5); tr.set('e.x0', 1, 0.6, 0.5); tr.set('e.conv', 1, 1.0, 0.6); await wait(1.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '7 is not a multiple of 4: the statement promises nothing about it.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'It does break it: 7 is not even.', ok: false, id: 'e.why.hyp', mc: MC.falseHyp as string | undefined },
      { t: 'The converse is true, so 7 is fine.', ok: false, id: 'e.why.conv', mc: MC.converseTrue as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does 7 not break "if n is a multiple of 4, then n is even"?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn =====================
function partTurn(): void {
  tr.reset('t.');
  const i5 = T_XS.indexOf(5);
  const rig = eulerRig('t.', T_PIC, LESSON_FRAME, { zones: [['notP', 'pick'], ['notQ', 'link'], ['q', 'wrong']], glow: [[i5, 'wrong']], cross: [i5] });
  const L = {
    p: centred('t.p', 'p:\\ x > 6', 126, 70, 'first'),
    q: centred('t.q', 'q:\\ x > 3', 208, 70, 'second'),
    np: centred('t.np', '{\\sim}p:\\ x \\le 6', 330, 70, 'first'),
    nq: centred('t.nq', '{\\sim}q:\\ x \\le 3', 412, 70, 'second'),
    con: centred('t.con', '{\\sim}q \\to {\\sim}p\\ \\ \\text{true}', 560, 66, 'link'),
    inv: centred('t.inv', '{\\sim}p \\to {\\sim}q\\ \\ \\text{false at } 5', 680, 64, 'wrong'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [] });
  eu('t.', 'domain', 1, 0.6); eu('t.', 'tokens', 1, 1.0, 0.3);
  eu('t.', 'P', 1, 0.8, 1.4); tr.set('t.p', 1, 0.9, 1.5); eu('t.', 'Q', 1, 0.8, 2.0); tr.set('t.q', 1, 0.9, 2.1);
  eu('t.', 'sort', 1, 1.8, 3.0);
  let step = 0;
  const STEPS = [
    { t: 'Name and sort', why: 'Done for you.' },
    { t: 'Negate the parts', why: 'Your step.' },
    { t: 'Form the contrapositive', why: 'Your step.' },
    { t: 'Test the inverse', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: negate and rearrange'), voiced('t.intro'), plan, work);
  seq(async alive => { await wait(5.0); if (!alive()) return; step = 1; drawPlan(); askNeg(); });

  /** a one-shot choice question: logs, gives feedback, runs `after` on the right one */
  function ask(item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item, prompt, response: plainOf(o.t), expected: plainOf(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.ok) { done = true; after(); }
    })));
    return h('div', {}, bx, fbHost);
  }
  const x = '<i>x</i>';
  function askNeg(): void {
    tr.set('t.z0', 0, 0.1);
    work.replaceChildren(voiced('t.neg'), ask('turn.negate', 'Negation of x > 6 (domain 0 to 9)', [
      { t: `${x} &lt; 6`, ok: false, id: 't.neg.opp', mc: MC.negOpp },
      { t: `${x} ≤ 6`, ok: true, id: 't.neg.ok' },
      { t: `${x} ≥ 6`, ok: false, id: 't.neg.ge' },
    ], () => seq(async alive => {
      tr.set('t.z0', 1, 0.8); void pulse('t.pulseP', alive); tr.set('t.np', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
      tr.set('t.nq', 1, 1.0); await wait(1.6); if (!alive()) return;
      step = 2; drawPlan(); askContra();
    })));
  }
  function askContra(): void {
    const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`;
    work.replaceChildren(voiced('t.contra'), ask('turn.contrapositive', 'Contrapositive of: if x > 6, then x > 3', [
      { t: `If ${A(`${x} ≤ 6`)}, then ${B(`${x} ≤ 3`)}.`, ok: false, id: 't.contra.inv', mc: MC.formsMixed },
      { t: `If ${B(`${x} ≤ 3`)}, then ${A(`${x} ≤ 6`)}.`, ok: true, id: 't.contra.ok' },
      { t: `If ${B(`${x} &gt; 3`)}, then ${A(`${x} &gt; 6`)}.`, ok: false, id: 't.contra.conv', mc: MC.contraAsConv },
      { t: `If ${B(`${x} &lt; 3`)}, then ${A(`${x} &lt; 6`)}.`, ok: false, id: 't.contra.opp', mc: MC.negOpp },
    ], () => seq(async alive => {
      tr.set('t.z0', 0.45, 0.6); tr.set('t.z1', 1, 0.8, 0.2); tr.set('t.con', 1, 1.0, 0.6); await wait(4.5); if (!alive()) return;
      step = 3; drawPlan(); askInv();
    })));
  }
  function askInv(): void {
    work.replaceChildren(voiced('t.inv'), ask('turn.inverse', 'Which x shows "if x ≤ 6, then x ≤ 3" is false?', [
      { t: `${x} = 2`, ok: false, id: 't.inv.two' },
      { t: `${x} = 5`, ok: true, id: 't.inv.ok' },
      { t: `${x} = 8`, ok: false, id: 't.inv.eight', mc: MC.falseHyp },
      { t: 'None: the inverse of a true statement is true', ok: false, id: 't.inv.none', mc: MC.inverseError },
    ], () => seq(async alive => {
      tr.set('t.z1', 0, 0.5); tr.set('t.z0', 1, 0.5); tr.set('t.z2', 1, 0.7, 0.3); tr.set('t.g0', 1, 0.5, 0.6); tr.set('t.x0', 1, 0.6, 1.0); tr.set('t.inv', 1, 1.0, 1.0);
      await wait(2.4); if (!alive()) return;
      step = 4; drawPlan(); work.append(callback());
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it =====================
function partProve(): void {
  tr.reset('p.');
  const iB = 1, iC = 2;
  const rig = eulerRig('p.', P_PIC, LESSON_FRAME, { zones: [['p', 'wrong'], ['pq', 'link']], glow: [[iB, 'pick'], [iB, 'wrong'], [0, 'link'], [3, 'link']], cross: [iB] });
  void iC;
  const L = {
    p: centred('p.p', 'p:\\ \\text{4 right angles}', 126, 64, 'first'),
    q: centred('p.q', 'q:\\ \\text{4 equal sides}', 206, 64, 'second'),
    pq: centred('p.pq', 'p \\to q\\ \\ ?', 300, 72),
    b: centred('p.b', 'B:\\ p\\ \\text{true},\\ q\\ \\text{false}', 430, 64),
    f: centred('p.f', 'p \\to q\\ \\ \\text{false}', 550, 70, 'wrong'),
    neg: centred('p.neg', '\\text{some } p \\text{ is not } q', 670, 66, 'link'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [] });
  eu('p.', 'domain', 1, 0.6); eu('p.', 'tokens', 1, 1.2, 0.3);
  const CHIPS = [
    { t: '“Every A is B” means: if a member is an A, then it is a B.', fits: 0 },
    { t: 'A small square marks each of its four corners.', fits: 1 },
    { t: 'Its sides carry two different tick marks.', fits: 2 },
    { t: 'One member with the hypothesis true and the conclusion false breaks an “every” claim.', fits: 3 },
    { t: 'A and D both worked.', fits: -1, mc: MC.allChecked, id: 'p.no.checked' },
    { t: 'C has four equal sides but no right angles.', fits: -1, mc: MC.falseHyp, id: 'p.no.c' },
    { t: 'If it is not true for all of them, it is true for none of them.', fits: -1, mc: MC.notAllNone, id: 'p.no.none' },
  ];
  const CLAIMS = [
    'Sam’s claim says: if a quadrilateral here has <b class="a">four right angles</b>, then it has <b class="b">four equal sides</b>,',
    'B has <b class="a">four right angles</b>,',
    'but B does <b>not</b> have <b class="b">four equal sides</b>,',
    'so B breaks the claim: Sam is <b class="w">wrong</b>. Its negation is true: <b class="s">some quadrilateral here has four right angles but not four equal sides</b>.',
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
    if (filled >= 4) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(CLAIMS[filled]!), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { eu('p.', 'P', 1, 0.8); tr.set('p.p', 1, 0.9, 0.2); eu('p.', 'Q', 1, 0.8, 0.6); tr.set('p.q', 1, 0.9, 0.8); tr.set('p.pq', 1, 0.9, 1.4); eu('p.', 'sort', 1, 2.0, 1.4); }
      if (n === 2) { tr.set('p.g0', 1, 0.5); void pulse('p.pulseP', alive); tr.set('p.b', 1, 1.0, 0.4); }
      if (n === 3) { tr.set('p.g0', 0, 0.4); tr.set('p.g1', 1, 0.5); tr.set('p.z0', 1, 0.7, 0.2); void pulse('p.pulseQ', alive); }
      if (n === 4) {
        tr.set('p.x0', 1, 0.6); tr.set('p.f', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        for (const k of [2, 3]) tr.set(`p.g${k}`, 1, 0.5, 0.1 * k);
        tr.set('p.z1', 1, 0.6); tr.set('p.neg', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: every quadrilateral here with four right angles has four equal sides (checked A and D). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.allChecked : undefined });
    proofHost.replaceChildren(voiced(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
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
    show: it => showItem(it as CSItem),
  });
}
/** a statement card: HTML with amber / teal / lime / red marks, wrapped as words on a wide slate */
interface Seg { t: string; col: Paint }
function segsOf(src: string): Seg[] {
  const out: Seg[] = [];
  const re = /<b class="(a|b|s|w)">(.*?)<\/b>|([^<]+)|<[^>]+>/g;
  const COL: Record<string, Paint> = { a: 'first', b: 'second', s: 'link', w: 'wrong' };
  const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  for (const m of src.matchAll(re)) {
    if (m[1]) out.push({ t: clean(m[2]!), col: COL[m[1]]! });
    else if (m[3]) out.push({ t: clean(m[3]), col: 'ink' });
  }
  return out;
}
const CARD_SIZE = 54, CARD_BOX = box(190, 120, 1730, 960);
function layoutCard(paras: string[], maxW: number): { words: { t: string; col: Paint; x: number; row: number }[]; rows: number; gaps: number[] } {
  const words: { t: string; col: Paint; x: number; row: number }[] = [];
  const gaps: number[] = [];
  let row = 0;
  const sp = wordsBox(' ', 0, 0, { size: CARD_SIZE }).w || CARD_SIZE * 0.28;
  paras.forEach((p, pi) => {
    if (pi > 0) { row++; gaps.push(row); }
    // words keep their own spacing: "60°F" + "," stays "60°F," across a colour change
    let x = 0, space = false;
    for (const s of segsOf(p)) for (const w of s.t.split(/(\s+)/)) {
      if (!w) continue;
      if (/^\s+$/.test(w)) { space = true; continue; }
      const ww = wordsBox(w, 0, 0, { size: CARD_SIZE }).w;
      if (x > 0 && space) x += sp;
      if (x > 0 && space && x + ww > maxW) { row++; x = 0; }
      words.push({ t: w, col: s.col, x, row });
      x += ww; space = false;
    }
  });
  return { words, rows: row + 1, gaps };
}
function cardPainter(lines: string[], reveal: string[]): { draw(c: Canvas): void } {
  const all = layoutCard([...lines, ...reveal], CARD_BOX.w - 200);
  const nFirst = layoutCard(lines, CARD_BOX.w - 200).words.length;
  const LH = 80, top = CARD_BOX.cy - ((all.rows - 1) * LH + all.gaps.length * 20) / 2;
  const ys = (row: number) => top + row * LH + all.gaps.filter(g => g <= row).length * 20;
  // centre each row
  const rowW = new Map<number, number>();
  for (const w of all.words) rowW.set(w.row, Math.max(rowW.get(w.row) ?? 0, w.x + wordsBox(w.t, 0, 0, { size: CARD_SIZE }).w));
  return {
    draw(c: Canvas) {
      slate(c, CARD_BOX, tr.k('x.slate'));
      all.words.forEach((w, i) => {
        const k = i < nFirst ? tr.k('x.c0') : tr.k('x.c1');
        if (k <= 0) return;
        drawWords(c, w.t, CARD_BOX.cx - (rowW.get(w.row) ?? 0) / 2 + w.x, ys(w.row), w.col, k, { size: CARD_SIZE });
      });
    },
  };
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
function showItem(item: CSItem): Solve {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.euler) {
    const e = pic.euler, rv = e.reveal;
    const made = tryBlock(() => eulerRig('x.', e, PRACTICE_FRAME, { zones: rv.zones, glow: rv.glow, cross: rv.cross }));
    if (made.ok) {
      setScene({ model: made.value.draw, lines: [], leads: [], boardBox: null });
      eu('x.', 'domain', 1, 0.6); eu('x.', 'tokens', 1, 1.0, 0.3);
      if (e.regions) { eu('x.', 'P', 1, 0.7, 0.6); eu('x.', 'Q', 1, 0.7, 0.8); }
      return {
        solve: async alive => {
          eu('x.', 'P', 1, 0.7); if (e.Q) eu('x.', 'Q', 1, 0.7, 0.3); await wait(1.0); if (!alive()) return;
          eu('x.', 'sort', 1, 1.6); await wait(1.9); if (!alive()) return;
          (rv.zones ?? []).forEach((_, j) => tr.set(`x.z${j}`, 1, 0.6, 0.2 * j));
          (rv.glow ?? []).forEach((_, j) => tr.set(`x.g${j}`, 1, 0.5, 0.3 + 0.08 * j));
          (rv.cross ?? []).forEach((_, j) => tr.set(`x.x${j}`, 1, 0.6, 0.7));
        },
      };
    }
    console.warn('euler picture failed', made.error);
  }
  if (pic?.table) {
    const t = pic.table;
    const w = Math.min(1100, 230 * t.head.length + 60), hh = 130 + t.rows.length * 112 + 20;
    const made = tryBlock(() => CaseTable({ head: t.head, headCol: t.headCol, rows: t.rows, keys: t.keys }, frame(960 - w / 2, Math.max(70, 540 - hh / 2), w, hh), th));
    if (made.ok) {
      const T = made.value, P = progressOf<CaseStep>(s => tr.k('x.t.' + s));
      const rings = () => [...(t.ring !== undefined ? [{ i: t.ring, col: 'pick' as Paint, k: tr.k('x.ring') }] : []), ...(t.reveal.rings ?? []).map(([i, col], j) => ({ i, col, k: tr.k(`x.rr${j}`) }))];
      setScene({ model: c => T.draw(c, P, { rings: rings(), ask: t.ask }), lines: [], leads: [], boardBox: null });
      tr.set('x.t.head', 1, 0.7, 0.1);
      t.rows.forEach((_, i) => tr.set(`x.t.r${i}`, 1, 0.5, 0.5 + 0.15 * i));
      t.start.forEach(j => tr.set(`x.t.c${j}`, 1, 0.9, 1.2));
      if (t.ring !== undefined) tr.set('x.ring', 1, 0.5, 1.4);
      return {
        solve: async alive => {
          t.reveal.cols.forEach((j, n) => tr.set(`x.t.c${j}`, 1, 1.2, 0.5 * n)); await wait(1.4); if (!alive()) return;
          if (t.ring !== undefined) tr.set('x.ring', 0, 0.4);
          (t.reveal.rings ?? []).forEach((_, j) => tr.set(`x.rr${j}`, 1, 0.5, 0.15 * j));
        },
      };
    }
    console.warn('table picture failed', made.error);
  }
  if (pic?.card) {
    const cd = pic.card;
    const P = cardPainter(cd.lines, cd.reveal ?? []);
    setScene({ model: P.draw, lines: [], leads: [], boardBox: null });
    tr.set('x.slate', 1, 0.5); tr.set('x.c0', 1, 0.8, 0.3);
    return { solve: cd.reveal?.length ? async () => { tr.set('x.c1', 1, 0.9); } : undefined };
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}
void ({} as Box);

void runLesson({
  slug: SLUG,
  warm: ['p \\to q \\ q \\to p \\ {\\sim} p \\ p \\leftrightarrow q \\ x \\le 6 \\ x \\ge 6 \\ \\text{T F none true false at multiple of even score an A some is not right angles equal sides}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
