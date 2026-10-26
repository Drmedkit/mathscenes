// creating-equations.ts: "Writing equations and inequalities from constraints" (Algebra 1, secondary-t6-06) on the
// shared lesson runtime. The models: CheckTable (src/lesson/topics/creating-equations/CheckTable.ts), every rule in
// words and in symbols against every candidate plan with a check or a cross, and AllowedLine (number lines with the
// allowed values of one variable: bands for a range, dots for separated values).
//   1 The question   $60, $8 an adult, $5 a student, at least 2 adults, van for 10: which plan works? (1, 9) breaks
//                    one rule only (one-condition-enough), (4, 5.6) spends exactly $60 (fractional count)
//   2 Worked example name the unknowns → the money rule → the other stated rules → the unstated rule (whole, not
//                    negative): the table fills cell by cell, only plan 2 passes every rule; one "why?"
//   3 Your turn      food truck: time rule and unstated rule given; the kid writes "at least twice as many tacos as
//                    burritos" (t ≥ 2b; 2t ≥ b = reversed comparison, t = 2b = equation for a bound) and judges (12, 10)
//   4 Prove it       28 students, vans of 12, at most 2 vans. Kai rounds 2.33 to 2. Because-chain on number lines:
//                    2 vans too few / 3 break the van rule / the allowed sets do not overlap: no viable option
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts); tables and number lines
//                    whose verdicts appear in the replay after a miss, a big slate for translation items
// Voiced lines: src/lesson/topics/creating-equations/script.ts (→ voice/lines.json). Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { CheckTable, type CheckTableBlock, type CTFocus } from '../../src/lesson/topics/creating-equations/CheckTable';
import { AllowedLine, type AllowedLineBlock } from '../../src/lesson/topics/creating-equations/AllowedLine';
import { LINE_FRAME, TABLE_FRAME, lineBlock, tableBlock, lineWidth } from '../../src/lesson/topics/creating-equations/pictures';
import { candT, lin, num, rel, whole } from '../../src/lesson/topics/creating-equations/cons';
import { ray } from '../../src/lesson/topics/solving-linear-equations/sets';
import { axisFor, type SLFocus } from '../../src/lesson/topics/solving-linear-equations/SetLine';
import { FAMILY_NAMES, GENERATORS, MC, type CItem } from '../../src/lesson/topics/creating-equations/items';
import { PLAN } from '../../src/lesson/topics/creating-equations/plan';
import { explain } from '../../src/lesson/topics/creating-equations/explain';
import { SCRIPT } from '../../src/lesson/topics/creating-equations/script';

const SLUG = 'creating-equations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: shows SCRIPT[id].html, the narrator says SCRIPT[id].say (voice/lines.json) */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const L0 = SCRIPT[id];
  if (!L0) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, (L0?.html ?? id) + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }
const P = (pre: string) => progressOf<string>(s => tr.k(pre + s));

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, tags, col };
}
function tableScene(pre: string, B: CheckTableBlock, focus?: () => CTFocus): void {
  setScene({ table: 1080, boardBox: null, lines: [], leads: [], model: c => B.draw(c, P(pre), focus?.()) });
}
function lineScene(pre: string, B: AllowedLineBlock, lines: Line[], focus?: () => SLFocus, extra?: (c: Canvas) => void): void {
  setScene({ table: 1080, lines, leads: [], extra, model: c => B.draw(c, P(pre), focus?.()) });
}
/** a column of cells fills top to bottom */
async function fillRow(pre: string, row: string, cands: readonly string[], alive: () => boolean, gap = 0.45): Promise<boolean> {
  for (const c of cands) { tr.set(`${pre}${row}.${c}`, 1, 0.9); await wait(gap); if (!alive()) return false; }
  return true;
}

// ===================== the climbing trip =====================
const EXV = [{ a: 1, s: 9 }, { a: 3, s: 6 }, { a: 4, s: 5.6 }];
const EXC = ['p0', 'p1', 'p2'] as const;
function exampleTable(): CheckTableBlock {
  return CheckTable({
    head: '(a,\\,s)', headWords: 'the rule',
    cands: EXV.map((v, i) => ({ key: EXC[i]!, label: candT(v, ['a', 's']), name: `plan ${i + 1}`, v })),
    rows: [
      { key: 'm', words: 'spend at most $60: $8 an adult, $5 a student', tex: '8a + 5s \\le 60', con: rel(lin({ a: 8, s: 5 }), '<=', num(60)) },
      { key: 'ad', words: 'at least 2 adults', tex: 'a \\ge 2', con: rel(lin({ a: 1 }), '>=', num(2)) },
      { key: 'van', words: 'the van seats at most 10', tex: 'a + s \\le 10', con: rel(lin({ a: 1, s: 1 }), '<=', num(10)) },
      { key: 'w', words: 'whole passes, none negative', tex: 'a,\\,s\\ \\text{whole}', con: whole('a', 's') },
    ],
    all: true,
  }, TABLE_FRAME, th);
}
function showFrame(pre: string, cands: readonly string[], rows: readonly string[], d = 0.3): void {
  tr.set(pre + 'grid', 1, 1.0, d);
  cands.forEach((c, i) => tr.set(`${pre}c.${c}`, 1, 0.8, d + 0.6 + i * 0.25));
  rows.forEach((r, i) => tr.set(`${pre}w.${r}`, 1, 0.8, d + 1.0 + i * 0.3));
}

// ===================== 1. The question =====================
const CARDS = [
  { t: 'Plan 1 (1, 9): 1 adult, 9 students', id: MC.oneCond, why: 'q.cb.one', ok: false },
  { t: 'Plan 2 (3, 6): 3 adults, 6 students', id: '', why: 'q.cb.right', ok: true },
  { t: 'Plan 3 (4, 5.6): 4 adults, 5.6 students, exactly $60', id: MC.fracCount, why: 'q.cb.frac', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = exampleTable();
  tableScene('q.', B);
  showFrame('q.', EXC, ['m', 'ad', 'van']);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Which plan meets every rule? $60, $8 adult, $5 student, at least 2 adults, van for 10', response: c.t, expected: CARDS[1]!.t, correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', { class: 'set words' }); b.innerHTML = `<span>${cd.t}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Which plan works?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const B = exampleTable();
  tableScene('e.', B, () => ({
    pulse: Object.fromEntries(EXC.map(c => [c, tr.k('e.pC')])),
    ring: { p1: tr.k('e.ring') }, dim: { p0: tr.k('e.dim'), p2: tr.k('e.dim') },
    rowRing: { m: tr.k('e.rm'), ad: tr.k('e.rad'), van: tr.k('e.rvan'), w: tr.k('e.rw') },
  }));
  for (const k of ['grid', ...EXC.map(c => 'c.' + c), 'w.m', 'w.ad', 'w.van']) tr.jump('e.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Name the unknowns', why: 'Numbers, with a unit.', act: 'Name them' },
    { t: 'Write the money rule', why: '“At most” is a ceiling.', act: 'Write it' },
    { t: 'The other stated rules', why: 'One line per rule.', act: 'Write them' },
    { t: 'The rule nobody said', why: 'What the situation itself allows.', act: 'Add it' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  const pulseRow = (k: string) => { tr.set('e.' + k, 1, 0.4); setTimeout(() => tr.set('e.' + k, 0, 0.6), 1500); };
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.pC', 1, 0.5); await wait(1.2); if (!alive()) return;
        tr.set('e.head', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.pC', 0, 0.6); await wait(0.4);
      } else if (i === 1) {
        tr.set('e.t.m', 1, 1.3); await wait(1.4); if (!alive()) return;
        pulseRow('rm'); if (!(await fillRow('e.', 'm', EXC, alive, 0.6))) return; await wait(0.6);
      } else if (i === 2) {
        tr.set('e.t.ad', 1, 1.0); await wait(1.1); if (!alive()) return;
        if (!(await fillRow('e.', 'ad', EXC, alive, 0.6))) return; await wait(0.4); if (!alive()) return;
        tr.set('e.t.van', 1, 1.1); await wait(1.2); if (!alive()) return;
        if (!(await fillRow('e.', 'van', EXC, alive, 0.6))) return; await wait(0.4);
      } else {
        tr.set('e.w.w', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.t.w', 1, 1.2); await wait(1.3); if (!alive()) return;
        if (!(await fillRow('e.', 'w', EXC, alive, 0.6))) return; await wait(0.4); if (!alive()) return;
        tr.set('e.w.all', 1, 0.8); await wait(0.6); if (!alive()) return;
        if (!(await fillRow('e.', 'all', EXC, alive, 0.5))) return; await wait(0.6); if (!alive()) return;
        tr.set('e.ring', 1, 0.8); tr.set('e.dim', 1, 0.8); await wait(0.9);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A plan must pass every rule at once. It breaks “at least 2 adults”.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'It passes most of the rules, so it should count.', ok: false, id: 'e.why.most', mc: MC.oneCond as string | undefined },
      { t: 'It spends $53, and a budget of $60 has to be used exactly.', ok: false, id: 'e.why.exact', mc: MC.eqBound as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Plan 1 fits the money and the van. Why is it out?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the food truck =====================
const TV = [{ t: 12, b: 10 }, { t: 20, b: 6 }];
const TC = ['k0', 'k1'] as const;
function turnTable(): CheckTableBlock {
  return CheckTable({
    head: '(t,\\,b)', headWords: 'the rule',
    cands: TV.map((v, i) => ({ key: TC[i]!, label: candT(v, ['t', 'b']), v })),
    rows: [
      { key: 'time', words: 'at most 60 minutes: 2 per taco, 3 per burrito', tex: '2t + 3b \\le 60', con: rel(lin({ t: 2, b: 3 }), '<=', num(60)) },
      { key: 'cmp', words: 'at least twice as many tacos as burritos', tex: 't \\ge 2b', con: rel(lin({ t: 1 }), '>=', lin({ b: 2 })) },
      { key: 'w', words: 'whole numbers, none negative', tex: 't,\\,b\\ \\text{whole}', con: whole('t', 'b') },
    ],
    all: true,
  }, TABLE_FRAME, th);
}
function partTurn(): void {
  tr.reset('t.');
  const B = turnTable();
  tableScene('t.', B, () => ({ ring: { k1: tr.k('t.ring') }, dim: { k0: tr.k('t.dim') }, rowRing: { cmp: tr.k('t.rc') } }));
  showFrame('t.', TC, ['time', 'cmp', 'w']);
  tr.set('t.head', 1, 0.8, 1.2);
  let step = 0;
  const STEPS = [
    { t: 'The time rule', why: 'Done for you.' },
    { t: 'The unstated rule', why: 'Done for you.' },
    { t: 'The comparison', why: 'Your step.' },
    { t: 'Judge a plan', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), h('span', { class: 'why' }, s0.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(4.0); if (!alive()) return;
    tr.set('t.t.time', 1, 1.2); await wait(1.4); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.t.w', 1, 1.2); await wait(1.4); if (!alive()) return;
    step = 2; drawPlan();
    tr.set('t.rc', 1, 0.5);
    askCmp();
  });
  function askCmp(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '<i>t</i> ≥ 2<i>b</i>', ok: true, id: 't.cmp.ok', mc: undefined as string | undefined },
      { t: '2<i>t</i> ≥ <i>b</i>', ok: false, id: 't.cmp.rev', mc: MC.revComp as string | undefined },
      { t: '<i>t</i> = 2<i>b</i>', ok: false, id: 't.cmp.eq', mc: MC.eqBound as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.cmp', prompt: 'At least twice as many tacos as burritos: which rule?', response: o.t.replace(/<[^>]+>/g, ''), expected: 't ≥ 2b', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.rc', 0, 0.5); tr.set('t.t.cmp', 1, 1.1); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askJudge();
      });
    })));
    work.replaceChildren(voiced('t.cmp'), bx, fbHost);
  }
  function askJudge(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Not viable: 12 is not at least 2(10) = 20', ok: true, id: 't.judge.ok', mc: undefined as string | undefined },
      { t: 'Viable: 2(12) + 3(10) = 54 fits in 60 minutes', ok: false, id: 't.judge.one', mc: MC.oneCond as string | undefined },
      { t: 'Not viable: 54 minutes is not exactly 60', ok: false, id: 't.judge.exact', mc: MC.eqBound as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.judge', prompt: 'Is (12, 10) a viable plan?', response: o.t, expected: 'Not viable: 12 is not at least 20', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        for (const r of ['time', 'cmp', 'w']) { tr.set(`t.${r}.k0`, 1, 0.9); await wait(0.7); if (!alive()) return; }
        tr.set('t.w.all', 1, 0.8); tr.set('t.all.k0', 1, 0.9); await wait(1.4); if (!alive()) return;
        for (const r of ['time', 'cmp', 'w']) { tr.set(`t.${r}.k1`, 1, 0.9); await wait(0.7); if (!alive()) return; }
        tr.set('t.all.k1', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('t.ring', 1, 0.8); tr.set('t.dim', 1, 0.8);
        step = 4; drawPlan();
        fbHost.append(voiced('t.other'), callback());
      });
    })));
    work.replaceChildren(voiced('t.judge'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Kai's 2 vans =====================
function partProve(): void {
  tr.reset('p.');
  const names = ['12n \\ge 28', 'n \\le 2', '\\text{both}'];
  const B = AllowedLine({
    ...axisFor([0, 7 / 3, 2, 3, 5], lineWidth(names)),
    rows: [
      { key: 'a', name: names[0], nameRole: 'first', set: ray('>=', 7 / 3), role: 'dim' },
      { key: 'b', name: names[1], nameRole: 'second', set: ray('<=', 2), role: 'dim' },
      { key: 'c', name: names[2], nameRole: 'ink' },
    ],
    dots: [{ key: 'da', row: 'a', vs: [3, 4, 5], role: 'first' }, { key: 'db', row: 'b', vs: [0, 1, 2], role: 'second' }],
    tests: [{ key: 'a2', row: 'a', v: 2, ok: false }, { key: 'b3', row: 'b', v: 3, ok: false }],
  }, LINE_FRAME, th);
  const s = 74;
  const amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, red = { col: 'wrong' as Paint };
  const S1 = centred('p.S1', '\\cssId{a}{12n \\ge 28}\\quad \\cssId{b}{n \\le 2}', 150, s, { a: amber, b: teal });
  const S2 = centred('p.S2', '\\text{Kai: } n = 2', 260, s, undefined, 'pick');
  const C1 = centred('p.C1', '12(2) = 24 < 28\\ \\ \\cssId{no}{\\times}', 420, 68, { no: red });
  const C2 = centred('p.C2', 'n = 3:\\ \\ 3 \\le 2\\ \\ \\cssId{no}{\\times}', 540, 68, { no: red });
  const C3 = centred('p.C3', '\\text{no whole } n \\text{ works}', 690, s, undefined, 'link');
  const extra = (c: Canvas) => {
    const k = tr.k('p.strike');
    if (k > 0) { const b0 = texBox(S2.F, S2.x, S2.y, { size: S2.size, align: 'left' }); strike(c, b0.x0 - 12, b0.cy + 6, b0.x1 + 12, b0.cy - 6, k, { col: 'wrong' }); }
  };
  lineScene('p.', B, [S1, S2, C1, C2, C3], () => ({ pulse: { 'name.c': tr.k('p.pC') } }), extra);
  tr.set('p.ax', 1, 1.2, 0.3); tr.set('p.S1', 1, 0.9, 1.0); tr.set('p.a.set', 1, 1.0, 1.6); tr.set('p.da', 1, 1.0, 2.2);
  tr.set('p.b.set', 1, 1.0, 2.4); tr.set('p.db', 1, 1.0, 3.0); tr.set('p.S2', 1, 0.9, 3.6);
  const CHIPS = [
    { t: '12 × 2 = 24 seats, fewer than 28 students.', fits: 0 },
    { t: 'The school can rent at most 2 vans.', fits: 1 },
    { t: 'A viable answer must pass every rule at once, and no whole number does.', fits: 2 },
    { t: '2.33 rounds to 2, the nearest whole number.', fits: -1, mc: MC.roundNear, id: 'p.no.round' },
    { t: 'Every problem has exactly one answer.', fits: -1, mc: MC.oneAnswer, id: 'p.no.one' },
  ];
  const CLAIMS = ['Two vans are not enough,', 'three or more vans break the other rule,', 'so no number of vans works,'];
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!, response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.a2', 1, 1.0); tr.set('p.C1', 1, 1.0, 0.4); await wait(1.5); }
      if (n === 2) { tr.set('p.b3', 1, 1.0); tr.set('p.C2', 1, 1.0, 0.4); await wait(1.5); }
      if (n === 3) {
        tr.set('p.pC', 1, 0.5); await wait(1.2); if (!alive()) return;
        tr.set('p.C3', 1, 1.0); tr.set('p.pC', 0, 0.8, 0.8); await wait(1.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Kai is right', () => judge(true)), no = btn('Kai is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Kai: 28 students, vans of 12, at most 2 vans: round 2.33 to 2 vans. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.roundNear : undefined });
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
function showItem(item: CItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.table) {
    const made = tryBlock(() => tableBlock(pic.table!, th));
    if (made.ok) {
      const B = made.value, T0 = pic.table, cands = T0.cands.map(c => c.key);
      tableScene('x.', B, () => ({ ring: Object.fromEntries(cands.map(c => [c, tr.k('x.ring.' + c)])) }));
      tr.set('x.grid', 1, 0.8, 0.1); tr.set('x.head', 1, 0.8, 0.3);
      cands.forEach((c, i) => tr.set(`x.c.${c}`, 1, 0.7, 0.4 + i * 0.15));
      T0.rows.forEach((r, i) => { tr.set(`x.w.${r.key}`, 1, 0.7, 0.6 + i * 0.2); if (T0.texShown !== false) tr.set(`x.t.${r.key}`, 1, 0.9, 0.8 + i * 0.25); });
      return {
        solve: async alive => {
          for (const r of T0.rows) {
            if (T0.texShown === false) { tr.set(`x.t.${r.key}`, 1, 0.8); await wait(0.6); if (!alive()) return; }
            if (!(await fillRow('x.', r.key, cands, alive, 0.35))) return;
          }
          if (T0.all) {
            tr.set('x.w.all', 1, 0.6); await wait(0.4); if (!alive()) return;
            if (!(await fillRow('x.', 'all', cands, alive, 0.35))) return;
            for (const c of cands) if (B.all[c]) tr.set('x.ring.' + c, 1, 0.8);
          }
        },
      };
    }
  }
  if (pic?.line) {
    const made = tryBlock(() => lineBlock(pic.line!, th));
    if (made.ok) {
      const B = made.value, L0 = pic.line;
      const T = centred('x.T', item.board, 230, 84);
      const Rz = centred('x.R', L0.result ?? '', 420, 80, undefined, 'link');
      lineScene('x.', B, L0.result ? [T, Rz] : [T]);
      tr.set('x.ax', 1, 1.0, 0.1); tr.set('x.T', 1, 0.9, 0.3);
      for (const r of L0.rows) if (r.show) tr.set(`x.${r.key}.set`, 1, 1.0, 0.8);
      return {
        solve: async alive => {
          for (const r of L0.rows) if (r.set && !r.show) { tr.set(`x.${r.key}.set`, 1, 1.0); await wait(0.7); if (!alive()) return; }
          for (const d of L0.dots ?? []) { tr.set('x.' + d.key, 1, 1.0); await wait(0.8); if (!alive()) return; }
          for (const t of L0.tests ?? []) { tr.set('x.' + t.key, 1, 0.9); await wait(0.6); if (!alive()) return; }
          tr.set('x.R', 1, 1.0);
        },
      };
    }
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big, table: 1080 });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['8a + 5s \\le 60 \\ge (1,\\,9) a,\\,s \\ge 0,\\ \\text{whole} \\times', '\\text{Kai: } n = 2', '\\tfrac{7}{3}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
