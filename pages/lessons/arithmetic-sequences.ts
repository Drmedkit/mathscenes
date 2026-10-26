// arithmetic-sequences.ts: "Arithmetic sequences" (Algebra 1, secondary-t6-10) on the shared lesson runtime. The model
// is a sequence picture (src/lesson/topics/arithmetic-sequences/pictures.ts): the SeqStrip (term number n above, value
// a_n below, an arc with the jump d between neighbours) over a kit Plane of the discrete graph (n, a_n) with stairs
// (run 1, rise d) and a dashed linear extension.
//   1 The question   stadium: row 1 has 14 seats, each row 3 more; row 40? cards 131 / 134 (n jumps) / 120 (no start)
//   2 Worked example check every jump (d = 3) → count the jumps to row 6 (five, they light up) → any row n:
//                    a_n = 14 + 3(n − 1), check n = 1, row 40 → plot (n, a_n): stairs, slope d, only whole rows;
//                    one "why 39 jumps?"
//   3 Your turn      a_1 = 50, a_n = a_(n−1) − 4: terms and d done for you; the kid picks the explicit form, types
//                    which term is 2 (n = 13), and decides whether 0 is a term (n = 13.5: no)
//   4 Prove it       Kai checks A(n) = 6 + 4(n − 1) against the recursion at n = 1, 2, 3 and calls it proved. Judge,
//                    then a because-chain: same seed / same step for every n / so every term (distractors = catalogue)
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts); the strip and / or graph
//                    of each item, answers hidden until the replay after a miss
// Voiced lines: src/lesson/topics/arithmetic-sequences/script.ts (→ voice/lines.json). Every answer is logged.
import { type Canvas } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { slate } from '../../src/lesson/annotate';
import { Plane, type PItem } from '../../src/lesson/kit/Plane';
import { type SeqPic, type SeqView, seqView } from '../../src/lesson/topics/arithmetic-sequences/pictures';
import { FAMILY_NAMES, GENERATORS, MC, type QItem } from '../../src/lesson/topics/arithmetic-sequences/items';
import { PLAN } from '../../src/lesson/topics/arithmetic-sequences/plan';
import { explain } from '../../src/lesson/topics/arithmetic-sequences/explain';
import { SCRIPT } from '../../src/lesson/topics/arithmetic-sequences/script';
import { terms } from '../../src/lesson/topics/arithmetic-sequences/seq';

const SLUG = 'arithmetic-sequences';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const L0 = SCRIPT[id];
  if (!L0) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, (L0?.html ?? id) + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint, cx = BOARD.cx, maxW = BOARD_W): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: cx - b.cx, y, size: s, tags, col };
}
const amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lime = { col: 'link' as Paint };
/** a long TeX line packed into several lines that fit `maxW` at `size` (breaks after ", " and before "for", at ";") */
function pack(src: string, maxW: number, size: number): string[] {
  const parts: string[] = [];
  for (const chunk of src.split(/;\\ \\ /)) {
    const segs = chunk.split(/(?<=,\\ )|(?=\\ \\text\{for)/);
    let cur = '';
    for (const sg of segs) {
      const next = cur + sg;
      if (cur && texWidth(tex(next.replace(/,\\ $/, ',')) as Formula, size) > maxW) { parts.push(cur); cur = sg.replace(/^\\ /, ''); } else cur = next;
    }
    if (cur) parts.push(cur);
  }
  return parts.map(p => p.replace(/,\\ $/, ','));
}
const P = (pre: string) => (s: string) => tr.k(pre + s);

// ===================== the stadium example =====================
const EX = { a1: 14, d: 3 };
const EX_VS = terms(EX.a1, EX.d, 6);
const exPic = (graph: boolean): SeqPic => ({
  strip: { ns: [1, 2, 3, 4, 5, 6], vals: EX_VS, ell: true, idx: 'row n', name: 'seats aₙ' },
  graph: graph ? { pts: EX_VS.map((y, i) => [i + 1, y]), stairs: true, guide: [EX.d, EX.a1 - EX.d], xName: 'row n', yName: 'seats aₙ', y: { min: 10, max: 32, step: 2 } } : undefined,
});
function scene(views: { V: SeqView; pre: string; focus?: () => Parameters<SeqView['draw']>[2] }[], lines: Line[], extra?: (c: Canvas) => void): void {
  setScene({ table: 1080, lines, leads: [], extra, model: c => { for (const v of views) v.V.draw(c, P(v.pre), v.focus?.()); } });
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '131', id: '', why: 'q.cb.right', ok: true },
  { t: '134', id: MC.nSteps, why: 'q.cb.n', ok: false },
  { t: '120', id: MC.dropStart, why: 'q.cb.drop', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const V = seqView(exPic(true), MF, th);
  const L1 = centred('q.L1', 'a_1 = 14', 170, 84, { }, 'first');
  const L2 = centred('q.L2', 'a_{40} = \\,?', 300, 84);
  scene([{ V, pre: 'q.' }], [L1, L2]);
  tr.set('q.s.card', 1, 1.0, 0.2); tr.set('q.s.vals', 1, 1.6, 0.8); tr.set('q.s.jumps', 1, 1.8, 2.4); tr.set('q.g.axes', 1, 1.0, 1.4); tr.set('q.g.pts', 1, 1.6, 2.2); tr.set('q.L1', 1, 0.9, 1.0); tr.set('q.L2', 1, 0.9, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Row 1 has 14 seats, each row 3 more. Seats in row 40?', board: 'a_{40} = ?', response: c.t, expected: '131', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', {}); b.innerHTML = `<span>${cd.t}</span><small>seats</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Row 40'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const V = seqView(exPic(true), MF, th);
  const s = 78;
  const L1 = centred('e.L1', 'a_1 = 14', 140, s, undefined, 'first');
  const L2 = centred('e.L2', '\\cssId{d}{d} = 17 - 14 = \\cssId{v}{3}', 250, s, { d: teal, v: teal });
  const L3 = centred('e.L3', 'a_6 = 14 + \\cssId{j}{5} \\cdot 3 = 29', 370, s, { j: teal });
  const L4 = centred('e.L4', 'a_n = 14 + 3(\\cssId{j}{n - 1})', 500, s, { j: teal }, 'link');
  const L5 = centred('e.L5', 'a_1 = 14 + 3(0)\\ \\checkmark', 610, 64, { }, 'dim');
  const L6 = centred('e.L6', 'a_{40} = 14 + 3 \\cdot 39 = 131', 720, s, undefined, 'link');
  const L7 = centred('e.L7', '\\text{slope} = 3 = d', 860, 68, { }, 'second');
  scene([{ V, pre: 'e.', focus: () => ({ strip: { lit: tr.k('e.lit'), ring: tr.k('e.ring') > 0 ? [5] : [], ringCol: 'first', ringK: tr.k('e.ring') } }) }], [L1, L2, L3, L4, L5, L6, L7]);
  tr.jump('e.s.card', 1); tr.jump('e.s.vals', 1); tr.jump('e.L1', 1); tr.jump('e.g.axes', 1); tr.jump('e.g.pts', 1);
  let step = 0;
  const STEPS = [
    { t: 'Check every jump', why: 'Not just the first one.', act: 'Check' },
    { t: 'Count the jumps to row 6', why: 'Row 1 is the start.', act: 'Count' },
    { t: 'Any row n', why: 'Then row 40.', act: 'Generalize' },
    { t: 'Read the graph of (n, aₙ)', why: 'What shape? Which points?', act: 'Read' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), html('span', 'why', s0.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s0.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.s.jumps', 1, 2.6); await wait(2.7); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.lit', 5, 3.0); await wait(3.1); if (!alive()) return;
        tr.set('e.ring', 1, 0.6); tr.set('e.L3', 1, 1.0); tr.set('e.L2:dim', 1, 0.5); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.L4', 1, 1.0); tr.set('e.L3:dim', 1, 0.5); tr.set('e.ring', 0, 0.5); await wait(1.2); if (!alive()) return;
        tr.set('e.L5', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.L6', 1, 1.0); await wait(1.2);
      } else {
        tr.set('e.lit', 0, 0.6);
        tr.set('e.g.stairs', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.g.guide', 1, 1.4); tr.set('e.L7', 1, 1.0); await wait(1.5);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Row 1 already has its 14 seats with no jump; each later row is one jump past the row before, so row 40 is 39 jumps past row 1.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'Each row adds 3, so row 40 has 40 × 3 seats; the 14 is already inside that.', ok: false, id: 'e.why.drop', mc: MC.dropStart as string | undefined },
      { t: 'Row 0 has the 14 seats, and row 40 is 40 jumps after row 0.', ok: false, id: 'e.why.zero', mc: MC.firstAs0 as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does row 40 take 39 jumps, not 40?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: a_1 = 50, a_n = a_(n−1) − 4 =====================
const TU = { a1: 50, d: -4 };
function turnPlane(): ReturnType<typeof Plane> {
  const items: PItem[] = [
    { kind: 'hline', key: 'v2', y: 2, col: 'link', dash: false },
    ...Array.from({ length: 14 }, (_, i) => ({ kind: 'point' as const, key: `p${i + 1}`, x: i + 1, y: TU.a1 + TU.d * i, col: 'first' as Paint })),
    { kind: 'point', key: 'half', x: 13.5, y: 0, open: true, col: 'wrong' },
  ];
  const sh = 332;
  return Plane({ x: { min: 0, max: 15, step: 1, name: 'n' }, y: { min: -5, max: 55, step: 5, name: 'aₙ' }, items }, frame(MF.x, MF.y + sh + 18, MF.w, MF.h - sh - 18), th);
}
function partTurn(): void {
  tr.reset('t.');
  const vs = terms(TU.a1, TU.d, 6);
  const V = seqView({ strip: { ns: [1, 2, 3, 4, 5, 6], vals: [TU.a1, null, null, null, null, null], reveal: [null, ...vs.slice(1)], d: TU.d, ell: true } }, MF, th);
  const PL = turnPlane();
  const s = 76;
  const L1 = centred('t.L1', 'a_1 = 50,\\ \\ a_n = a_{n-1} - 4', 140, s, undefined, 'ink');
  const L2 = centred('t.L2', '\\cssId{d}{d = -4}', 250, s, { d: teal });
  const L3 = centred('t.L3', 'a_n = 50 - 4(n - 1)', 370, s, undefined, 'link');
  const L4 = centred('t.L4', '50 - 4(n - 1) = 2', 490, 70);
  const L5 = centred('t.L5', 'n - 1 = 12,\\ \\ n = 13', 590, 70, undefined, 'link');
  const L6 = centred('t.L6', '50 - 4(n - 1) = 0', 710, 70);
  const L7 = centred('t.L7', 'n = 13.5\\ \\ \\cssId{no}{\\text{not a term}}', 810, 70, { no: { col: 'wrong' } });
  setScene({
    table: 1080, leads: [], lines: [L1, L2, L3, L4, L5, L6, L7],
    model: c => {
      V.draw(c, P('t.'));
      PL.draw(c, progressOf(k => (k === 'axes' ? tr.k('t.g.axes') : /^p\d+$/.test(k) ? (Number(k.slice(1)) <= 6 ? tr.k('t.g.pts') : Number(k.slice(1)) === 13 ? Math.max(tr.k('t.g.hit'), tr.k('t.g.rest')) : tr.k('t.g.rest')) : tr.k('t.g.' + k))),
        { ring: [{ key: 'p13', col: 'link', k: tr.k('t.g.ring') }] });
    },
  });
  tr.set('t.s.card', 1, 1.0, 0.2); tr.set('t.s.vals', 1, 1.2, 0.6); tr.set('t.L1', 1, 1.0, 0.8);
  let step = 0;
  const STEPS = [
    { t: 'List the terms', why: 'Done for you: 50, 46, 42, …' },
    { t: 'Find the jump', why: 'Done for you: d = −4.' },
    { t: 'Write it explicitly', why: 'Your step.' },
    { t: 'Which term is 2?', why: 'Your step.' },
    { t: 'Is 0 a term?', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s0, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s0.t), h('span', { class: 'why' }, s0.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    tr.set('t.s.reveal', 1, 1.6); await wait(1.7); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.s.jumps', 1, 2.0); await wait(2.1); if (!alive()) return;
    tr.set('t.L2', 1, 0.9); tr.set('t.g.axes', 1, 1.0); await wait(1.0); if (!alive()) return;
    tr.set('t.g.pts', 1, 1.4); await wait(1.5); if (!alive()) return;
    step = 2; drawPlan(); askForm();
  });
  function opts(id: string, list: { t: string; ok: boolean; id: string; mc?: string }[], log: { item: string; prompt: string; expected: string }, onOk: () => void): HTMLElement {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    list.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: log.item, prompt: log.prompt, response: o.t.replace(/<[^>]+>/g, ''), expected: log.expected, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (o.ok) { done = true; onOk(); }
    })));
    return h('div', {}, voiced(id), bx, fbHost);
  }
  function askForm(): void {
    work.replaceChildren(opts('t.form', [
      { t: 'a<sub>n</sub> = 50 − 4(<i>n</i> − 1)', ok: true, id: 't.form.ok' },
      { t: 'a<sub>n</sub> = 50 − 4<i>n</i>', ok: false, id: 't.form.n', mc: MC.nSteps },
      { t: 'a<sub>n</sub> = a<sub>n−1</sub> − 4', ok: false, id: 't.form.rec', mc: MC.ruleAsPos },
    ], { item: 'turn.form', prompt: 'a_1 = 50, a_n = a_(n−1) − 4: the explicit formula?', expected: 'a_n = 50 − 4(n − 1)' }, () => seq(async alive => {
      tr.set('t.L3', 1, 1.0); tr.set('t.L2:dim', 1, 0.5); await wait(1.4); if (!alive()) return;
      step = 3; drawPlan(); askPos();
    })));
  }
  function askPos(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), chk = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a whole number.')); return; }
      const ok = r.v === 13, id = ok ? 't.pos.ok' : r.v === 12 ? 't.pos.jumps' : 't.pos.other';
      ctx.store.log({ part: 'turn', item: 'turn.position', prompt: 'a_n = 50 − 4(n − 1): which n gives 2?', response: r, expected: 13, correct: ok, mc: r.v === 12 ? MC.nSteps : undefined });
      fbHost.replaceChildren(voicedFb(id, ok));
      if (!ok) return;
      done = true; chk.disabled = true;
      seq(async alive => {
        tr.set('t.L4', 1, 1.0); tr.set('t.L3:dim', 1, 0.5); await wait(1.0); if (!alive()) return;
        tr.set('t.L5', 1, 1.0); tr.set('t.g.v2', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.g.hit', 1, 0.8); tr.set('t.g.ring', 1, 0.6, 0.4); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); askZero();
      });
    }
    work.replaceChildren(voiced('t.pos'), inp.node, h('div', { class: 'row' }, chk), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askZero(): void {
    work.replaceChildren(opts('t.zero', [
      { t: 'No: <i>n</i> would be 13.5, not a whole number', ok: true, id: 't.zero.ok' },
      { t: 'Yes: it is term number 13.5', ok: false, id: 't.zero.no', mc: MC.fracIdx },
    ], { item: 'turn.zero', prompt: 'a_n = 50 − 4(n − 1): is 0 a term?', expected: 'No (n = 13.5)' }, () => seq(async alive => {
      tr.set('t.g.ring', 0, 0.4); tr.set('t.L6', 1, 1.0); tr.set('t.L4:dim', 1, 0.5); tr.set('t.L5:dim', 1, 0.5); await wait(1.0); if (!alive()) return;
      tr.set('t.g.rest', 1, 1.2); await wait(1.2); if (!alive()) return;
      tr.set('t.L7', 1, 1.0); tr.set('t.g.half', 1, 0.8); await wait(1.2); if (!alive()) return;
      step = 5; drawPlan();
      work.append(callback());
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.why : 'q.cb.none', 'p', '', cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : ''), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Kai's three checks =====================
function partProve(): void {
  tr.reset('p.');
  const vs = terms(6, 4, 6);
  const V = seqView({
    strip: { ns: [1, 2, 3, 4, 5, 6], vals: [6, 10, 14, null, null, null], reveal: [null, null, null, ...vs.slice(3)], d: 4, ell: true },
    graph: { pts: vs.map((y, i) => [i + 1, y]), stairs: true, guide: [4, 2], zero: true, y: { min: 0, max: 28, step: 2 } },
  }, MF, th);
  const s = 72;
  const B1 = centred('p.B1', 'A(n) = 6 + 4(n - 1)', 140, s, undefined, 'first');
  const B2 = centred('p.B2', 'a_1 = 6,\\ \\ a_{n+1} = a_n + 4', 240, s, undefined, 'second');
  const K = centred('p.K', '\\text{Kai: } n = 1, 2, 3\\ \\checkmark', 340, 64, undefined, 'pick');
  const C1 = centred('p.C1', 'A(1) = 6 + 4 \\cdot 0 = 6', 470, s);
  const C2 = centred('p.C2', 'A(n+1) - A(n) = 4', 590, s);
  const C3 = centred('p.C3', 'A(n) = a_n,\\ \\text{all } n \\ge 1', 720, s, undefined, 'link');
  scene([{ V, pre: 'p.', focus: () => ({ strip: { ring: tr.k('p.kai') > 0 ? [0, 1, 2] : tr.k('p.r0') > 0 ? [0] : [], ringCol: 'pick', ringK: Math.max(tr.k('p.kai'), tr.k('p.r0')), lit: tr.k('p.lit') } }) }], [B1, B2, K, C1, C2, C3]);
  tr.set('p.s.card', 1, 1.0, 0.2); tr.set('p.s.vals', 1, 1.2, 0.6); tr.set('p.s.jumps', 1, 1.4, 1.4);
  tr.set('p.B1', 1, 0.9, 1.0); tr.set('p.B2', 1, 0.9, 1.8); tr.set('p.K', 1, 0.9, 2.8); tr.set('p.kai', 1, 0.6, 3.0);
  tr.set('p.g.axes', 1, 1.0, 2.0); tr.set('p.g.pts', 0.55, 1.2, 2.6);
  const CHIPS = [
    { t: 'A(1) = 6 + 4 · 0 = 6, the seed of the recursion.', fits: 0 },
    { t: 'A(n + 1) − A(n) = 4n − 4(n − 1) = 4, for every n ≥ 1.', fits: 1 },
    { t: 'If term n agrees, term n + 1 agrees too (both add 4), starting from term 1.', fits: 2 },
    { t: 'They agree at n = 1, 2 and 3.', fits: -1, mc: MC.examples, id: 'p.no.examples' },
    { t: 'A(n + 1) = A(n) + 1, so the step is 1.', fits: -1, mc: MC.shiftAdd, id: 'p.no.step1' },
    { t: '6 + 4(n − 1) = 4n + 2, so the first term is 2.', fits: -1, mc: MC.firstAs0, id: 'p.no.first' },
  ];
  const CLAIMS = ['Both start with the same term,', 'Both take the same step at every n,', 'So every term agrees, not just three,'];
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
    if (ch.fits !== filled) {
      fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false));
      if (ch.id === 'p.no.first') seq(async alive => { tr.set('p.g.guide', 1, 1.0); tr.set('p.g.zero', 1, 0.8, 0.6); await wait(3.4); if (!alive()) return; tr.set('p.g.zero', 0, 0.6); tr.set('p.g.guide', 0, 0.6); });
      return;
    }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.kai', 0, 0.4); tr.set('p.K:dim', 1, 0.5); tr.set('p.r0', 1, 0.6); tr.set('p.C1', 1, 1.0); await wait(1.2); }
      if (n === 2) { tr.set('p.r0', 0, 0.4); tr.set('p.lit', 5, 2.4); tr.set('p.C2', 1, 1.0, 0.6); await wait(2.6); }
      if (n === 3) {
        tr.set('p.s.reveal', 1, 1.4); tr.set('p.g.pts', 1, 1.6); tr.set('p.g.stairs', 1, 2.4, 0.3); await wait(2.4); if (!alive()) return;
        tr.set('p.C3', 1, 1.0); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Yes, that proves it', () => judge(true)), no = btn('No, not a proof yet', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Kai: A(n) = 6 + 4(n − 1) and the recursion agree at n = 1, 2, 3, so they are the same sequence. A proof?', response: right ? 'yes' : 'no', expected: 'no', correct: !right, mc: right ? MC.examples : undefined });
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
    show: it => showItem(it as QItem),
  });
}
/** the board lines of an item, packed into the board column (or a wide slate) */
function boardLines(src: string, area: Box, size: number): Line[] {
  const parts = pack(src, area.w - 100, size);
  let sz = size;
  while (sz > 62 && parts.some(p0 => texWidth(tex(p0) as Formula, sz) > area.w - 100)) sz -= 2;
  const gap = Math.min(sz * 1.55, (area.h - 80) / Math.max(1, parts.length));
  const y0 = area.y0 + 70 + sz * 0.5;
  return parts.map((p0, i) => centred(`x.B${i}`, p0, y0 + i * gap, sz, undefined, undefined, area.cx, area.w - 100));
}
function showItem(item: QItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic && (pic.strip || pic.graph)) {
    const made = tryBlock(() => seqView(pic, pic.strip && !pic.graph ? frame(MF.x, MF.y + 300, MF.w, MF.h - 300) : MF, th));
    if (made.ok) {
      const V = made.value, hold = new Set(pic.hold ?? []);
      const lines = boardLines(item.board, box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 520), 80);
      scene([{ V, pre: 'x.', focus: () => ({ strip: { lit: tr.k('x.lit'), hot: tr.k('x.hot') > 0.5 ? pic.hot : undefined } }) }], lines);
      tr.set('x.s.card', 1, 0.8, 0.1); tr.set('x.s.vals', 1, 1.0, 0.4); if (!hold.has('jumps')) tr.set('x.s.jumps', 1, 1.2, 1.0);
      tr.set('x.g.axes', 1, 0.8, 0.1); tr.set('x.g.pts', 1, 1.0, 0.6);
      for (const k of ['stairs', 'guide', 'zero']) if (!hold.has(k)) tr.set('x.g.' + k, 1, 1.0, 1.2);
      lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.2 + i * 0.25));
      return {
        solve: async alive => {
          if (hold.has('jumps')) { tr.set('x.s.jumps', 1, 1.6); await wait(1.7); if (!alive()) return; }
          if (pic.hot) tr.set('x.hot', 1, 0.4);
          if (pic.count) { tr.set('x.lit', 12, 3.0); await wait(1.6); if (!alive()) return; }
          if (pic.strip?.reveal) { tr.set('x.s.reveal', 1, 1.0); await wait(1.0); if (!alive()) return; }
          for (const k of ['stairs', 'guide', 'zero']) if (hold.has(k)) { tr.set('x.g.' + k, 1, 1.2); await wait(1.0); if (!alive()) return; }
          if (pic.graph?.solvePts) tr.set('x.g.hide', 1, 1.0);
        },
      };
    }
    console.warn(made.error);
  }
  const big = box(200, 200, 1720, 880);
  const lines = boardLines(item.board, big, 104);
  const dy = (big.h - (lines.length - 1) * (lines[1] ? lines[1].y - lines[0]!.y : 0)) / 2 + big.y0 - lines[0]!.y;
  for (const L of lines) L.y += dy;
  setScene({ lines, leads: [], boardBox: big, table: 1080 });
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.1 + i * 0.25));
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['a_{40} = 14 + 3(n - 1) \\cdot \\checkmark \\dots \\ge \\le', '\\text{slope } A(n+1) - A(n)', '\\dfrac{1}{2} \\square'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
void slate;
