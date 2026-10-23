// scale-calculations.ts: "Scale calculations: drawing lengths and actual lengths" (grade 7, 7.G.A.1), on the lesson
// runtime. One scale links every drawing length to its actual length with ONE factor, in both directions.
//   1 The question   plan at 1 in : 8 ft, a 20 ft wall: how long on the plan? 2.5 in / 160 in (multiplies on the
//                    way back) / 13 in (adds the difference) + how sure
//   2 Worked example on aligned number lines (ScaleLines): Read the scale (1 in <-> 8 ft, x 8) -> Turn back (the
//                    same factor undoes it: / 8) -> Divide (20 / 8 = 2.5 in, straight above 20 ft) -> Check and draw
//                    (2.5 x 8 = 20, 2.5 in = 2 1/2 in on the plan); one "why?"
//   3 Your turn      the bedroom wall 2.25 in, faded from the end: pick the step (x 8), compute 18 ft (part-by-part,
//                    divide, add diagnosed), check by going back (18 / 8 = 2.25); the callback to part 1
//   4 Prove it       Sam: model shed at 1 : 48, 12 ft -> 12 / 48 = 0.25 "in" (relabels feet as inches); a
//                    because-chain over three lines (model in, real in, real ft); Sam's mark is struck
//   5 Practice       all 16 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel lines: src/lesson/topics/scale-calculations/script.ts; spoken text: scale-calculations/voice/lines.json.
// Every answer is logged with its misconception id.
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, bigLine, line, markDirty, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ScaleLines, type LinesBlock, type LinesFocus, LINE_STEPS } from '../../src/lesson/topics/scale-calculations/ScaleLines';
import { BEDROOM, LF, SHED, WALL } from '../../src/lesson/topics/scale-calculations/lessonPics';
import { FAMILY_NAMES, GENERATORS, MC, type SCItem } from '../../src/lesson/topics/scale-calculations/items';
import { explain } from '../../src/lesson/topics/scale-calculations/explain';
import { PLAN } from '../../src/lesson/topics/scale-calculations/plan';
import { SCRIPT } from '../../src/lesson/topics/scale-calculations/script';

const SLUG = 'scale-calculations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line */
const say = (id: string, cls = ''): HTMLElement => { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); };
const fbk = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
/** tr.set plus one more frame after the move ends */
function ts(name: string, to: number, d = 0.9, delay = 0): void { tr.set(name, to, d, delay); setTimeout(markDirty, (d + delay) * 1000 + 120); }
const TAGS = { d: { col: 'first' as const }, a: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const }, p: { col: 'pick' as const } };
const Y = (k: number) => BOARD.y0 + k;
const plain = (s: string) => s.replace(/<[^>]+>/g, '');

function linesScene(pre: string, P: LinesBlock | null, lines: Line[], focus?: () => LinesFocus, extra?: Parameters<typeof setScene>[0]['extra']): void {
  setScene({ table: 1080, model: c => { if (P) P.draw(c, progressOf(s => tr.k(pre + s)), focus?.()); }, lines, leads: [], extra });
}
/** board lines stacked from y0 down, each under the previous one by its real ink height (arrays are tall); a line
 *  too wide for the board even at 60 px is split before its last ' = ' */
function stack(key: string, srcs: string[], y0: number, size: number, gap = 36): { lines: Line[]; y: number } {
  const fit = (s: string): string[] => {
    if (texWidth(tex(s) as Formula, 60) <= BOARD_W) return [s];
    const i = s.lastIndexOf(' = ');
    return i > 0 ? [...fit(s.slice(0, i)), s.slice(i + 1)] : [s];
  };
  const lines: Line[] = [];
  let y = y0;
  for (const src of srcs.flatMap(fit)) {
    const L = line(key, src, 0, size, TAGS);
    const b = texBox(L.F, L.x, 0, { size: L.size, align: 'left' });
    L.y = y - b.y0;
    lines.push(L); y += b.h + gap;
  }
  return { lines, y };
}
function showSteps(pre: string, steps: string[], t0 = 0, dt = 0.3): void { steps.forEach((s, i) => ts(pre + s, 1, 0.8, t0 + i * dt)); }

/** a number step in parts 1-4: logs every try with its misconception, voices the feedback */
function numStep(host: HTMLElement, o: {
  prompt: string; unit: string; ans: number; item: string;
  wrongs: { v: number; id: string; mc?: string }[]; miss: string; ok: string; done: () => void;
}): void {
  const fbHost = h('div');
  const inp = numInput(o.unit, () => check());
  const okBtn = btn('Check', () => check(), 'go');
  const t0 = performance.now();
  function check(): void {
    const r = inp.read();
    const v = r && r.kind === 'num' ? r.v : NaN;
    if (!Number.isFinite(v)) { fbHost.replaceChildren(fbk(false, 't.empty')); return; }
    const right = Math.abs(v - o.ans) < 1e-6;
    const w = o.wrongs.find(x => Math.abs(x.v - v) < 1e-6);
    ctx.store.log({ part: 'turn', item: o.item, prompt: plain(SCRIPT[o.prompt] ?? o.prompt), response: r, expected: o.ans, correct: right, mc: right ? undefined : w?.mc, ms: Math.round(performance.now() - t0) });
    if (!right) { fbHost.replaceChildren(fbk(false, w ? w.id : o.miss)); return; }
    okBtn.disabled = true;
    fbHost.replaceChildren(fbk(true, o.ok));
    o.done();
  }
  host.replaceChildren(say(o.prompt), inp.node, h('div', { class: 'row' }, okBtn), fbHost);
  setTimeout(() => inp.focus(), 50);
}
/** a one-of-three choice in parts 1-4 (logged, voiced) */
function choiceStep(host: HTMLElement, o: { prompt: string; item: string; opts: { t: string; ok?: boolean; mc?: string; id: string }[]; onPick?: (i: number) => void; done: () => void }): void {
  const fbHost = h('div'), bx = h('div', { class: 'opts' });
  let done = false;
  o.opts.forEach((op, k) => bx.append(btn(op.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(op.ok ? 'right' : 'nope'); });
    ctx.store.log({ part: 'turn', item: o.item, prompt: plain(SCRIPT[o.prompt] ?? o.prompt), response: op.t, expected: o.opts.find(x => x.ok)!.t, correct: !!op.ok, mc: op.mc });
    fbHost.replaceChildren(fbk(!!op.ok, op.id));
    o.onPick?.(k);
    if (!op.ok) return;
    done = true; o.done();
  })));
  host.replaceChildren(say(o.prompt), bx, fbHost);
}

// ===== 1. The question =====
const CARDS = [
  { t: '160 in', ok: false, mc: MC.wrongOp, cb: 'q.cb.times' },
  { t: '2.5 in', ok: true, mc: '', cb: 'q.cb.right' },
  { t: '13 in', ok: false, mc: MC.additive, cb: 'q.cb.add' },
];
function partQuestion(): void {
  tr.reset('q.');
  const P = ScaleLines(WALL, LF);
  const Q1 = line('q.Q1', `\\cssId{d}{1\\text{ in}} : \\cssId{a}{8\\text{ ft}}`, Y(150), 80, TAGS);
  const Q2 = line('q.Q2', `\\text{wall: } \\cssId{a}{20\\text{ ft}}`, Y(300), 76, TAGS);
  const Q3 = line('q.Q3', `\\text{on the plan: } \\cssId{d}{?\\text{ in}}`, Y(450), 76, TAGS);
  linesScene('q.', P, [Q1, Q2, Q3], () => ({ quietRow: 0 }));
  showSteps('q.', ['card', 'lines', 'ref', 'given']);
  ts('q.Q1', 1, 0.8, 1.2); ts('q.Q2', 1, 0.8, 1.8); ts('q.Q3', 1, 0.8, 2.4);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Plan at 1 in : 8 ft. A 20 ft wall: how long on the plan?', response: p.t, expected: '2.5 in', correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => {
    const b = h('button');
    b.innerHTML = `<span>${cd.t}</span><small>on the plan</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); });
    cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A wall, drawn small'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: 20 ft at 1 in : 8 ft =====
function partExample(): void {
  tr.reset('e.');
  const P = ScaleLines(WALL, LF);
  const E1 = line('e.E1', `\\cssId{d}{1\\text{ in}} : \\cssId{a}{8\\text{ ft}}`, Y(110), 76, TAGS);
  const E2 = line('e.E2', `\\text{plan} \\xrightarrow{\\cssId{p}{\\times 8}} \\text{actual}`, Y(225), 72, TAGS);
  const E3 = line('e.E3', `\\text{actual} \\xrightarrow{\\cssId{p}{\\div 8}} \\text{plan}`, Y(340), 72, TAGS);
  const E4 = line('e.E4', `\\cssId{a}{20} \\div 8 = \\cssId{s}{2.5\\text{ in}}`, Y(490), 80, TAGS);
  const E5 = line('e.E5', `\\cssId{s}{2.5} \\times 8 = \\cssId{a}{20\\text{ ft}}\\ \\checkmark`, Y(640), 76, TAGS);
  const E6 = line('e.E6', `\\cssId{s}{2.5\\text{ in}} = 2\\tfrac{1}{2}\\text{ in}`, Y(770), 76, TAGS);
  linesScene('e.', P, [E1, E2, E3, E4, E5, E6], () => ({ ref: tr.k('e.gl'), down: tr.k('e.gd'), up: tr.k('e.gu') }));
  for (const s of ['card', 'lines', 'ref', 'given']) tr.jump('e.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'Read the scale', why: 'Drawing first, then actual.', act: 'Read it' },
    { t: 'Turn back', why: 'Feet to plan inches: which step?', act: 'Turn back' },
    { t: 'Divide', why: '20 ft ÷ 8.', act: 'Divide' },
    { t: 'Check and draw', why: 'Go back the other way.', act: 'Check' },
  ];
  const planEl = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => planEl.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        ts('e.gl', 1, 0.5); ts('e.nums', 1, 0.9, 0.3); await wait(1.4); if (!alive()) return;
        ts('e.E1', 1, 1.0); ts('e.gl', 0, 0.6, 0.6); ts('e.down', 1, 1.0, 0.4); await wait(1.5); if (!alive()) return;
        ts('e.E2', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        ts('e.E1:dim', 1, 0.5); ts('e.E2:dim', 1, 0.5);
        ts('e.up', 1, 1.0); ts('e.gu', 1, 0.5, 0.6); await wait(1.4); if (!alive()) return;
        ts('e.E3', 1, 1.0); ts('e.gu', 0, 0.6, 0.8); await wait(1.2);
      } else if (i === 2) {
        ts('e.E3:dim', 1, 0.5);
        ts('e.drop', 1, 1.4); await wait(1.4); if (!alive()) return;
        ts('e.ask', 1, 0.6); await wait(0.8); if (!alive()) return;
        ts('e.answer', 1, 0.9); ts('e.E4', 1, 1.0, 0.3); await wait(1.5);
      } else {
        ts('e.E4:dim', 1, 0.5);
        ts('e.gd', 1, 0.5); ts('e.E5', 1, 1.0, 0.3); await wait(1.5); if (!alive()) return;
        ts('e.gd', 0, 0.5); ts('e.obj', 1, 1.4); await wait(1.5); if (!alive()) return;
        ts('e.E6', 1, 1.0); await wait(1.1);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '× 8 goes from the plan to the real wall. Coming back from feet to inches undoes it.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'You always multiply by the scale number.', ok: false, id: 'e.why.times', mc: MC.wrongOp as string | undefined },
      { t: '8 ft to 20 ft is 12 more, so the plan is 1 + 12 = 13 in.', ok: false, id: 'e.why.add', mc: MC.additive as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why divide by 8 here, and not multiply?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    void ctx.say('e.why');
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), planEl, sayBox, after);
}

// ===== 3. Your turn: the bedroom wall, 2.25 in =====
function partTurn(): void {
  tr.reset('t.');
  const P = ScaleLines(BEDROOM, LF);
  const T1 = line('t.T1', `\\cssId{d}{1\\text{ in}} : \\cssId{a}{8\\text{ ft}}`, Y(120), 76, TAGS);
  const T2 = line('t.T2', `\\text{plan} \\xrightarrow{\\cssId{p}{\\times 8}} \\text{actual}`, Y(235), 72, TAGS);
  const T3 = line('t.T3', `\\cssId{d}{2.25\\text{ in}} \\to \\ ?\\text{ ft}`, Y(390), 76, TAGS);
  const T4 = line('t.T4', `\\cssId{d}{2.25} \\times 8 = \\cssId{s}{18\\text{ ft}}`, Y(530), 76, TAGS);
  const T5 = line('t.T5', `\\cssId{s}{18} \\div 8 = \\cssId{d}{2.25\\text{ in}}\\ \\checkmark`, Y(680), 76, TAGS);
  linesScene('t.', P, [T1, T2, T3, T4, T5], () => ({ quietRow: tr.k('t.answer') > 0.5 ? undefined : 1, down: tr.k('t.gd'), up: tr.k('t.gu') }));
  showSteps('t.', ['card', 'lines', 'ref', 'nums']);
  ts('t.down', 1, 1.0, 1.6); ts('t.T1', 1, 0.8, 1.0); ts('t.T2', 1, 0.8, 2.0); ts('t.T3', 1, 0.8, 2.8);
  let step = 1;
  const STEPS = [
    { t: 'Read the scale', why: 'Done for you: plan → actual is × 8.' },
    { t: 'Pick the step', why: 'Your step.' },
    { t: 'Find the real length', why: 'Your step.' },
    { t: 'Check by going back', why: 'Your step.' },
  ];
  const planEl = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => planEl.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the bedroom wall'), say('t.intro'), planEl, work);
  seq(async alive => { await wait(3.2); if (!alive()) return; askWay(); });

  function askWay(): void {
    choiceStep(work, {
      prompt: 't.way', item: 'turn.way',
      opts: [
        { t: 'Multiply by 8', ok: true, id: 't.way.ok' },
        { t: 'Divide by 8', mc: MC.divides, id: 't.way.div' },
        { t: 'Add 7', mc: MC.additive, id: 't.way.add' },
      ],
      onPick: k => {
        if (k === 1) seq(async alive => { ts('t.up', 1, 0.8); ts('t.gu', 1, 0.4, 0.4); await wait(2.2); if (!alive()) return; ts('t.gu', 0, 0.5); ts('t.up', 0, 0.6, 0.3); });
      },
      done: () => seq(async alive => {
        ts('t.gd', 1, 0.5); ts('t.given', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        ts('t.ask', 1, 0.6); ts('t.gd', 0, 0.5, 0.4); await wait(0.8); if (!alive()) return;
        step = 2; drawPlan(); askCalc();
      }),
    });
  }
  function askCalc(): void {
    numStep(work, {
      prompt: 't.calc', unit: 'ft', ans: 18, item: 'turn.calc',
      wrongs: [{ v: 16.25, id: 't.calc.part', mc: MC.partByPart }, { v: 0.28125, id: 't.calc.div', mc: MC.divides }, { v: 9.25, id: 't.calc.add', mc: MC.additive }],
      miss: 't.calc.miss', ok: 't.calc.ok',
      done: () => seq(async alive => {
        ts('t.T3:dim', 1, 0.5);
        ts('t.drop', 1, 1.3); await wait(1.3); if (!alive()) return;
        ts('t.answer', 1, 0.9); ts('t.T4', 1, 1.0, 0.3); await wait(1.5); if (!alive()) return;
        step = 3; drawPlan(); askBack();
      }),
    });
  }
  function askBack(): void {
    numStep(work, {
      prompt: 't.back', unit: 'in', ans: 2.25, item: 'turn.back',
      wrongs: [{ v: 144, id: 't.back.times', mc: MC.wrongOp }, { v: 2, id: 't.back.whole', mc: MC.wholeQuot }, { v: 2.2, id: 't.back.whole', mc: MC.wholeQuot }],
      miss: 't.back.miss', ok: 't.back.ok',
      done: () => seq(async alive => {
        ts('t.T4:dim', 1, 0.5);
        ts('t.up', 1, 0.9); ts('t.gu', 1, 0.5, 0.3); ts('t.T5', 1, 1.0, 0.5); await wait(1.5); if (!alive()) return;
        ts('t.gu', 0, 0.5); ts('t.obj', 1, 1.4); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); work.append(callback());
      }),
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.cb : 'q.cb.none';
    const p = say(id);
    if (cd) p.append(html('span', 'dim', ` (You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)`));
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Sam's model shed =====
function partProve(): void {
  tr.reset('p.');
  const P = ScaleLines(SHED, LF);
  const S1 = line('p.S1', `12 \\div 48 = 0.25`, Y(120), 76, TAGS, 'dim');
  const S2 = line('p.S2', `\\text{model: } \\cssId{w}{0.25\\text{ in}}`, Y(230), 76, TAGS, 'dim');
  const P2 = line('p.P2', `12\\text{ ft} = \\cssId{a}{144\\text{ in}}`, Y(410), 76, TAGS);
  const P3 = line('p.P3', `\\cssId{a}{144} \\div 48 = \\cssId{s}{3\\text{ in}}`, Y(540), 76, TAGS);
  const P4 = line('p.P4', `0.25\\text{ ft} = \\cssId{s}{3\\text{ in}}\\ \\checkmark`, Y(670), 76, TAGS);
  const extra: Parameters<typeof setScene>[0]['extra'] = c => {
    const k = tr.k('p.strikeB');
    if (k > 0) { const b = partOf(S2, 'w'); strike(c, b.x0 - 10, b.y1, b.x1 + 10, b.y0, k, { col: 'wrong' }); }
  };
  linesScene('p.', P, [S1, S2, P2, P3, P4], () => ({ down: tr.k('p.gd') }), extra);
  showSteps('p.', ['card', 'lines', 'ref', 'nums', 'alt']);
  ts('p.wrong', 1, 0.8, 1.8); ts('p.S1', 1, 0.9, 1.4); ts('p.S2', 1, 0.9, 2.1);
  const CHIPS = [
    { t: 'Straight above 12 ft, the model line is at 3, not 0.25: his 0.25 is in feet.', fits: 0 },
    { t: '1 ft = 12 in, and 1 : 48 needs one unit on both sides.', fits: 1 },
    { t: 'Every 48 real inches are 1 model inch: 144 ÷ 48 = 3.', fits: 2 },
    { t: 'You must always convert before you divide.', fits: -1, mc: MC.oneOrder, id: 'p.no.order' },
    { t: 'A foot is 10 inches, so 0.25 ft is 2.5 in.', fits: -1, mc: MC.base10, id: 'p.no.ten' },
  ];
  const CLAIMS = [
    'Sam’s <b>0.25 in</b> is far too small,',
    'The real shed is <b class="b">144 in</b> long,',
    'The model is <b class="s">3 in</b> long,',
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
    if (filled >= 3 || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plain(CLAIMS[filled]!), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbk(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbk(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        ts('p.given', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('p.drop', 1, 1.8); await wait(1.9); if (!alive()) return;
        ts('p.ask', 1, 0.6); await wait(0.9); if (!alive()) return;
        ts('p.strike', 1, 0.6); ts('p.strikeB', 1, 0.6, 0.3); await wait(1.0);
      }
      if (n === 2) { ts('p.conv', 1, 1.0); await wait(1.0); if (!alive()) return; ts('p.via', 1, 0.9); ts('p.P2', 1, 1.0, 0.3); await wait(1.4); }
      if (n === 3) {
        ts('p.down', 1, 0.9); ts('p.up', 1, 0.9, 0.2); await wait(1.1); if (!alive()) return;
        ts('p.answer', 1, 0.9); ts('p.P3', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        ts('p.P4', 1, 1.0); await wait(1.3); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbk(true, 'p.done', [h('div', { class: 'row' }, btn('Practice', () => go(4), 'go'))]));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: 1 : 48, a 12 ft shed, 12 ÷ 48 = 0.25, so the model is 0.25 in. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.relabel : undefined });
    proofHost.replaceChildren(say(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as SCItem),
  });
}
function showItem(item: SCItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.lines;
  const made = pic ? tryBlock(() => ScaleLines(pic.p, LF)) : null;
  if (pic && made && made.ok) {
    const P = made.value;
    const T = stack('x.T', item.board.split(/,\s*\\quad\s*/), Y(60), 76);
    const Ts = T.lines, Ws = stack('x.W', item.work ?? [], T.y + 50, 72).lines;
    linesScene('x.', P, [...Ts, ...Ws], () => ({ quietRow: tr.k('x.answer') > 0.5 ? undefined : pic.quiet }));
    showSteps('x.', pic.show, 0, 0.15);
    ts('x.T', 1, 0.8, 0.3);
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        for (const s of LINE_STEPS) if (pic.solve.includes(s)) {
          const long = s === 'drop' || s === 'obj';
          ts('x.' + s, 1, long ? 1.4 : 0.8); await wait(long ? 1.5 : 0.8); if (!alive()) return;
        }
        if (Ws.length) ts('x.W', 1, 1.0);
      },
    };
  }
  if (pic && made && !made.ok) console.warn('scale-calculations: picture skipped:', made.error);
  // bare notation: the board line big on a wide slate, the worked lines under it after a miss
  const big = box(300, 200, 1620, 600);
  const BL = bigLine('x.T', item.board, big, 110);
  BL.tags = TAGS;
  const BW = item.work?.length ? bigLine('x.W', item.work.join(',\\quad '), box(300, 640, 1620, 900), 90) : null;
  if (BW) BW.tags = TAGS;
  setScene({ table: 1080, lines: BW ? [BL, BW] : [BL], leads: [], boardBox: box(300, 160, 1620, 940) });
  ts('x.T', 1, 0.8, 0.1);
  return { solve: async () => { if (BW) ts('x.W', 1, 1.0); } };
}

void runLesson({
  slug: SLUG,
  warm: [`\\cssId{d}{1\\text{ in}} : \\cssId{a}{8\\text{ ft}}`, '\\text{plan} \\xrightarrow{\\times 8} \\text{actual}', '2\\tfrac{1}{2}\\text{ in}\\ \\checkmark', '\\text{model: } 0.25', '\\begin{array}{c|c} 1 & 8 \\\\ \\hline 2 & 16 \\end{array}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
