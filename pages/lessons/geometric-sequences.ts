// geometric-sequences.ts: "Geometric sequences" (Algebra 1, secondary-t6-14) on the shared lesson runtime, the partner
// of arithmetic-sequences (same five beats, + d becomes × r). The model is a sequence picture
// (src/lesson/topics/geometric-sequences/pictures.ts): the GeoStrip (term number n above, value a_n below, an arc with
// the FACTOR between neighbours, optionally a dim second row with the differences) over a kit Plane of the discrete
// graph (n, a_n) with a dashed guide curve and, for contrast, the open dots of the arithmetic guess.
//   1 The question   phone tree: round 1 has 3 people, each round twice as many; round 8? cards 384 / 768 (n
//                    doublings) / 24 (adds 3 each round)
//   2 Worked example check every hop (r = 2; the differences are not equal) → count the hops to round 6 (five, they
//                    light up) → any round n: a_n = 3 · 2^(n − 1), check n = 1, round 8 → plot (n, a_n): a curve, not
//                    the arithmetic line; only whole rounds; one "why 2^7?"
//   3 Your turn      a_1 = 96, a_n = ½ a_(n−1): terms and r done for you; the kid picks the explicit form, types which
//                    term is 3 (n = 6), and decides whether 0 is a term (no: halving never reaches 0)
//   4 Prove it       Kai checks G(n) = 12 · 2^(n − 1) against the recursion at n = 1, 2, 3 and calls it proved. Judge,
//                    then a because-chain: same seed / same factor for every n / so every term (distractors =
//                    catalogue: examples as proof, f(n + 1) = f(n) + 1, the rewrite 6 · 2^n read as a new first term)
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts); the strip and / or graph
//                    of each item, answers hidden until the replay after a miss
// Voiced lines: src/lesson/topics/geometric-sequences/script.ts (→ voice/lines.json). Every answer is logged.
import { type Canvas, withAlpha } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PItem } from '../../src/lesson/kit/Plane';
import { type GeoPic, type GeoView, geoView } from '../../src/lesson/topics/geometric-sequences/pictures';
import { FAMILY_NAMES, GENERATORS, MC, type QItem } from '../../src/lesson/topics/geometric-sequences/items';
import { PLAN } from '../../src/lesson/topics/geometric-sequences/plan';
import { explain } from '../../src/lesson/topics/geometric-sequences/explain';
import { SCRIPT } from '../../src/lesson/topics/geometric-sequences/script';
import { q, qi, terms, val } from '../../src/lesson/topics/geometric-sequences/geo';
import { gstripH } from '../../src/lesson/topics/geometric-sequences/GeoStrip';

const SLUG = 'geometric-sequences';
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
const teal = { col: 'second' as Paint };
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

// ===================== the phone-tree example =====================
const EX = { a1: 3, r: 2 };
const EX_VS = terms(qi(EX.a1), qi(EX.r), 6);
const exStrip = (adds: boolean): GeoPic['strip'] => ({ ns: [1, 2, 3, 4, 5, 6], vals: EX_VS, ell: true, idx: 'round n', name: 'calls aₙ', adds });
const exGraph = (cmp: boolean): GeoPic['graph'] => ({
  pts: EX_VS.map((v, i) => [i + 1, val(v)]), guide: { a: EX.a1, r: EX.r, k: 1 }, xName: 'round n', yName: 'calls aₙ', y: { min: 0, max: 100, step: 10 },
  cmp: cmp ? [1, 2, 3, 4, 5, 6].map(k => [k, 3 * k]) : undefined,
});
function scene(views: { V: GeoView; pre: string; alpha?: () => number; focus?: () => Parameters<GeoView['draw']>[2] }[], lines: Line[], extra?: (c: Canvas) => void): void {
  setScene({ table: 1080, lines, leads: [], extra, model: c => { for (const v of views) { const a = v.alpha ? v.alpha() : 1; if (a > 0.001) withAlpha(c, a, () => v.V.draw(c, P(v.pre), v.focus?.())); } } });
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '384', id: '', why: 'q.cb.right', ok: true },
  { t: '768', id: MC.nSteps, why: 'q.cb.n', ok: false },
  { t: '24', id: MC.addFactor, why: 'q.cb.add', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const V = geoView({ strip: exStrip(false), graph: exGraph(false) }, MF, th);
  const L1 = centred('q.L1', 'a_1 = 3', 170, 84, {}, 'first');
  const L2 = centred('q.L2', 'a_{8} = \\,?', 300, 84);
  scene([{ V, pre: 'q.' }], [L1, L2]);
  tr.set('q.s.card', 1, 1.0, 0.2); tr.set('q.s.vals', 1, 1.6, 0.8); tr.set('q.s.hops', 1, 1.8, 2.4); tr.set('q.g.axes', 1, 1.0, 1.4); tr.set('q.g.pts', 1, 1.6, 2.2); tr.set('q.L1', 1, 0.9, 1.0); tr.set('q.L2', 1, 0.9, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Phone tree: round 1 has 3 people, each round twice as many. People in round 8?', board: 'a_8 = ?', response: c.t, expected: '384', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', {}); b.innerHTML = `<span>${cd.t}</span><small>people</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Round 8'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  // two views of the same strip: with the differences row (steps 1-3), then over the graph (step 4)
  const V1 = geoView({ strip: exStrip(true) }, MF, th);
  const V2 = geoView({ strip: exStrip(false), graph: exGraph(true) }, MF, th);
  const s = 78;
  const L1 = centred('e.L1', 'a_1 = 3', 140, s, undefined, 'first');
  const L2 = centred('e.L2', '\\cssId{r}{r} = 6 \\div 3 = \\cssId{v}{2}', 250, s, { r: teal, v: teal });
  const L3 = centred('e.L3', 'a_6 = 3 \\cdot 2^{\\cssId{j}{5}} = 96', 370, s, { j: teal });
  const L4 = centred('e.L4', 'a_n = 3 \\cdot 2^{\\cssId{j}{n - 1}}', 500, s, { j: teal }, 'link');
  const L5 = centred('e.L5', 'a_1 = 3 \\cdot 2^{0} = 3\\ \\checkmark', 610, 64, {}, 'dim');
  const L6 = centred('e.L6', 'a_{8} = 3 \\cdot 2^{7} = 384', 720, s, undefined, 'link');
  const L7 = centred('e.L7', '\\times 2\\ \\text{each step, not}\\ +3', 860, 64, {}, 'second');
  const lit = () => ({ strip: { lit: tr.k('e.lit'), ring: tr.k('e.ring') > 0 ? [5] : [], ringCol: 'first' as Paint, ringK: tr.k('e.ring') } });
  scene([
    { V: V1, pre: 'e.', alpha: () => 1 - tr.k('e.swap'), focus: () => ({ strip: { ...lit().strip, dimA: tr.k('e.dimA') } }) },
    { V: V2, pre: 'e.', alpha: () => tr.k('e.swap'), focus: lit },
  ], [L1, L2, L3, L4, L5, L6, L7]);
  tr.jump('e.s.card', 1); tr.jump('e.s.vals', 1); tr.jump('e.L1', 1);
  let step = 0;
  const STEPS = [
    { t: 'Check every hop', why: 'Divide, do not subtract.', act: 'Check' },
    { t: 'Count the hops to round 6', why: 'Round 1 is the start.', act: 'Count' },
    { t: 'Any round n', why: 'Then round 8.', act: 'Generalize' },
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
        tr.set('e.s.hops', 1, 2.6); await wait(2.7); if (!alive()) return;
        tr.set('e.s.adds', 1, 2.2); await wait(2.3); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); tr.set('e.dimA', 1, 0.8, 0.4); await wait(1.2);
      } else if (i === 1) {
        tr.set('e.lit', 5, 3.0); await wait(3.1); if (!alive()) return;
        tr.set('e.ring', 1, 0.6); tr.set('e.L3', 1, 1.0); tr.set('e.L2:dim', 1, 0.5); await wait(1.2);
      } else if (i === 2) {
        tr.set('e.L4', 1, 1.0); tr.set('e.L3:dim', 1, 0.5); tr.set('e.ring', 0, 0.5); await wait(1.2); if (!alive()) return;
        tr.set('e.L5', 1, 0.9); await wait(1.1); if (!alive()) return;
        tr.set('e.L6', 1, 1.0); await wait(1.2);
      } else {
        tr.set('e.lit', 0, 0.6); tr.set('e.swap', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.g.axes', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.g.pts', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.g.cmp', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.g.guide', 1, 1.4); tr.set('e.L7', 1, 1.0); await wait(1.5);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Round 1 already has its 3 people with no doubling; each later round is one more doubling, so round 8 is 7 doublings past round 1.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'There are 8 rounds, so there are 8 doublings: 3 · 2⁸.', ok: false, id: 'e.why.n', mc: MC.nSteps as string | undefined },
      { t: 'Round 0 has the 3 people, and round 8 is 8 doublings after round 0.', ok: false, id: 'e.why.zero', mc: MC.shift1 as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is round 8 equal to 3 · 2^7, not 3 · 2^8?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: a_1 = 96, a_n = ½ a_(n−1) =====================
const TU = { a1: 96, r: q(1, 2) };
function turnPlane(top: number): ReturnType<typeof Plane> {
  const vs = terms(qi(TU.a1), TU.r, 10);
  const items: PItem[] = [
    { kind: 'curve', key: 'guide', f: x => 96 * 0.5 ** (x - 1), lo: 1, hi: 11, dash: true, w: 3, col: 'dim' },
    { kind: 'hline', key: 'v3', y: 3, col: 'link', dash: false },
    ...vs.map((v, i) => ({ kind: 'point' as const, key: `p${i + 1}`, x: i + 1, y: val(v), col: 'first' as Paint })),
  ];
  return Plane({ x: { min: 0, max: 11, step: 1, name: 'n' }, y: { min: 0, max: 100, step: 10, name: 'aₙ' }, items }, frame(MF.x, MF.y + top + 18, MF.w, MF.h - top - 18), th);
}
function partTurn(): void {
  tr.reset('t.');
  const vs = terms(qi(TU.a1), TU.r, 6);
  const V = geoView({ strip: { ns: [1, 2, 3, 4, 5, 6], vals: [vs[0]!, null, null, null, null, null], reveal: [null, ...vs.slice(1)], r: TU.r, ell: true } }, MF, th);
  const PL = turnPlane(gstripH());
  const s = 76;
  const L1 = centred('t.L1', 'a_1 = 96,\\ \\ a_n = \\tfrac{1}{2}\\, a_{n-1}', 140, s, undefined, 'ink');
  const L2 = centred('t.L2', '\\cssId{r}{r = \\tfrac{1}{2}}', 250, s, { r: teal });
  const L3 = centred('t.L3', 'a_n = 96 \\left(\\tfrac{1}{2}\\right)^{n-1}', 370, s, undefined, 'link');
  const L4 = centred('t.L4', '96 \\left(\\tfrac{1}{2}\\right)^{n-1} = 3', 490, 70);
  const L5 = centred('t.L5', 'n - 1 = 5,\\ \\ n = 6', 590, 70, undefined, 'link');
  const L6 = centred('t.L6', '3,\\ 1.5,\\ 0.75,\\ \\dots > 0', 710, 70);
  const L7 = centred('t.L7', '0\\ \\cssId{no}{\\text{is never a term}}', 810, 70, { no: { col: 'wrong' } });
  setScene({
    table: 1080, leads: [], lines: [L1, L2, L3, L4, L5, L6, L7],
    model: c => {
      V.draw(c, P('t.'));
      PL.draw(c, progressOf(k => (k === 'axes' ? tr.k('t.g.axes') : /^p\d+$/.test(k) ? (Number(k.slice(1)) <= 6 ? tr.k('t.g.pts') : tr.k('t.g.rest')) : tr.k('t.g.' + k))),
        { ring: [{ key: 'p6', col: 'link', k: tr.k('t.g.ring') }] });
    },
  });
  tr.set('t.s.card', 1, 1.0, 0.2); tr.set('t.s.vals', 1, 1.2, 0.6); tr.set('t.L1', 1, 1.0, 0.8);
  let step = 0;
  const STEPS = [
    { t: 'List the terms', why: 'Done for you: 96, 48, 24, …' },
    { t: 'Find the ratio', why: 'Done for you: r = ½.' },
    { t: 'Write it explicitly', why: 'Your step.' },
    { t: 'Which term is 3?', why: 'Your step.' },
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
    tr.set('t.s.hops', 1, 2.0); await wait(2.1); if (!alive()) return;
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
  const half = '<span class="fr"><span>1</span><span>2</span></span>';
  function askForm(): void {
    work.replaceChildren(opts('t.form', [
      { t: `a<sub>n</sub> = 96 · (${half})<sup>n−1</sup>`, ok: true, id: 't.form.ok' },
      { t: `a<sub>n</sub> = 96 · (${half})<sup>n</sup>`, ok: false, id: 't.form.n', mc: MC.nSteps },
      { t: `a<sub>n</sub> = ${half} · 96<sup>n−1</sup>`, ok: false, id: 't.form.swap', mc: MC.coefAsFactor },
    ], { item: 'turn.form', prompt: 'a_1 = 96, a_n = (1/2)·a_(n−1): the explicit formula?', expected: 'a_n = 96 · (1/2)^(n−1)' }, () => seq(async alive => {
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
      const ok = r.v === 6, id = ok ? 't.pos.ok' : r.v === 5 ? 't.pos.hops' : 't.pos.other';
      ctx.store.log({ part: 'turn', item: 'turn.position', prompt: 'a_n = 96 · (1/2)^(n−1): which n gives 3?', response: r, expected: 6, correct: ok, mc: r.v === 5 ? MC.nSteps : undefined });
      fbHost.replaceChildren(voicedFb(id, ok));
      if (!ok) return;
      done = true; chk.disabled = true;
      seq(async alive => {
        tr.set('t.L4', 1, 1.0); tr.set('t.L3:dim', 1, 0.5); await wait(1.0); if (!alive()) return;
        tr.set('t.L5', 1, 1.0); tr.set('t.g.v3', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.g.ring', 1, 0.6, 0.4); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); askZero();
      });
    }
    work.replaceChildren(voiced('t.pos'), inp.node, h('div', { class: 'row' }, chk), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askZero(): void {
    work.replaceChildren(opts('t.zero', [
      { t: 'No: halving a positive number never gives 0', ok: true, id: 't.zero.ok' },
      { t: 'Yes: it drops by 48 each time, so a<sub>3</sub> = 0', ok: false, id: 't.zero.no', mc: MC.addFactor },
    ], { item: 'turn.zero', prompt: 'a_n = 96 · (1/2)^(n−1): is 0 a term?', expected: 'No (halving never reaches 0)' }, () => seq(async alive => {
      tr.set('t.g.ring', 0, 0.4); tr.set('t.g.v3', 0, 0.6); tr.set('t.L6', 1, 1.0); tr.set('t.L4:dim', 1, 0.5); tr.set('t.L5:dim', 1, 0.5); await wait(1.0); if (!alive()) return;
      tr.set('t.g.rest', 1, 1.2); tr.set('t.g.guide', 1, 1.4); await wait(1.4); if (!alive()) return;
      tr.set('t.L7', 1, 1.0); await wait(1.2); if (!alive()) return;
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
  const vs = terms(qi(12), qi(2), 6);
  const V = geoView({
    strip: { ns: [1, 2, 3, 4, 5, 6], vals: [vs[0]!, vs[1]!, vs[2]!, null, null, null], reveal: [null, null, null, ...vs.slice(3)], r: qi(2), ell: true },
    graph: { pts: vs.slice(0, 4).map((v, i) => [i + 1, val(v)]), guide: { a: 6, r: 2, k: 0 }, zero: 6, y: { min: 0, max: 100, step: 10 } },
  }, MF, th);
  const s = 72;
  const B1 = centred('p.B1', 'G(n) = 12 \\cdot 2^{n-1}', 140, s, undefined, 'first');
  const B2 = centred('p.B2', 'a_1 = 12,\\ \\ a_{n+1} = 2a_n', 240, s, undefined, 'second');
  const K = centred('p.K', '\\text{Kai: } n = 1, 2, 3\\ \\checkmark', 340, 64, undefined, 'pick');
  const C1 = centred('p.C1', 'G(1) = 12 \\cdot 2^{0} = 12', 470, s);
  const C2 = centred('p.C2', 'G(n+1) = 2 \\cdot G(n)', 590, s);
  const C3 = centred('p.C3', 'G(n) = a_n,\\ \\text{all } n \\ge 1', 720, s, undefined, 'link');
  scene([{ V, pre: 'p.', focus: () => ({ strip: { ring: tr.k('p.kai') > 0 ? [0, 1, 2] : tr.k('p.r0') > 0 ? [0] : [], ringCol: 'pick', ringK: Math.max(tr.k('p.kai'), tr.k('p.r0')), lit: tr.k('p.lit') } }) }], [B1, B2, K, C1, C2, C3]);
  tr.set('p.s.card', 1, 1.0, 0.2); tr.set('p.s.vals', 1, 1.2, 0.6); tr.set('p.s.hops', 1, 1.4, 1.4);
  tr.set('p.B1', 1, 0.9, 1.0); tr.set('p.B2', 1, 0.9, 1.8); tr.set('p.K', 1, 0.9, 2.8); tr.set('p.kai', 1, 0.6, 3.0);
  tr.set('p.g.axes', 1, 1.0, 2.0); tr.set('p.g.pts', 0.75, 1.2, 2.6);
  const CHIPS = [
    { t: 'G(1) = 12 · 2⁰ = 12, the seed of the recursion.', fits: 0 },
    { t: 'G(n + 1) = 12 · 2ⁿ = 2 · 12 · 2ⁿ⁻¹ = 2 · G(n), for every n ≥ 1.', fits: 1 },
    { t: 'If term n agrees, term n + 1 agrees too (both double), starting from term 1.', fits: 2 },
    { t: 'They agree at n = 1, 2 and 3.', fits: -1, mc: MC.examples, id: 'p.no.examples' },
    { t: 'G(n + 1) = G(n) + 1, so the step is 1.', fits: -1, mc: MC.shiftAdd, id: 'p.no.step1' },
    { t: '12 · 2ⁿ⁻¹ = 6 · 2ⁿ, so the first term is 6.', fits: -1, mc: MC.rewriteReset, id: 'p.no.first' },
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
        tr.set('p.s.reveal', 1, 1.4); tr.set('p.g.pts', 1, 1.6); await wait(1.8); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Kai: G(n) = 12 · 2^(n−1) and the recursion agree at n = 1, 2, 3, so they are the same sequence. A proof?', response: right ? 'yes' : 'no', expected: 'no', correct: !right, mc: right ? MC.examples : undefined });
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
const HOLD = ['guide', 'cmp', 'zero', 'line'];
function showItem(item: QItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic && (pic.strip || pic.graph)) {
    const area = pic.strip && !pic.graph ? frame(MF.x, MF.y + 260, MF.w, MF.h - 260) : MF;
    const made = tryBlock(() => geoView(pic, area, th));
    if (made.ok) {
      const V = made.value, hold = new Set(pic.hold ?? []);
      const lines = boardLines(item.board, box(BOARD.x0, BOARD.y0, BOARD.x1, BOARD.y0 + 520), 80);
      scene([{ V, pre: 'x.', focus: () => ({ strip: { lit: tr.k('x.lit'), hot: tr.k('x.hot') > 0.5 ? pic.hot : undefined } }) }], lines);
      tr.set('x.s.card', 1, 0.8, 0.1); tr.set('x.s.vals', 1, 1.0, 0.4);
      if (!hold.has('hops')) tr.set('x.s.hops', 1, 1.2, 1.0);
      if (pic.strip?.adds && !hold.has('adds')) tr.set('x.s.adds', 1, 1.2, 1.4);
      tr.set('x.g.axes', 1, 0.8, 0.1); tr.set('x.g.pts', 1, 1.0, 0.6);
      for (const k of HOLD) if (!hold.has(k)) tr.set('x.g.' + k, 1, 1.0, 1.2);
      lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.2 + i * 0.25));
      return {
        solve: async alive => {
          if (hold.has('hops')) { tr.set('x.s.hops', 1, 1.6); await wait(1.7); if (!alive()) return; }
          if (hold.has('adds')) { tr.set('x.s.adds', 1, 1.4); await wait(1.5); if (!alive()) return; }
          if (pic.hot) tr.set('x.hot', 1, 0.4);
          if (pic.count) { tr.set('x.lit', typeof pic.count === 'number' ? pic.count : 12, 3.0); await wait(1.6); if (!alive()) return; }
          if (pic.strip?.reveal) { tr.set('x.s.reveal', 1, 1.0); await wait(1.0); if (!alive()) return; }
          for (const k of HOLD) if (hold.has(k)) { tr.set('x.g.' + k, 1, 1.2); await wait(1.0); if (!alive()) return; }
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
  warm: ['a_{8} = 3 \\cdot 2^{n - 1} \\cdot \\checkmark \\dots \\ge \\le \\div', '\\left(\\tfrac{1}{2}\\right)^{n-1} \\times \\frac{2}{3}', 'G(n+1) \\text{is never a term}', '\\square'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
