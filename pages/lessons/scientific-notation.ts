// scientific-notation.ts: scientific notation and order of magnitude (grade 8, 8.EE.A.3 / 8.EE.A.4), on the shared
// lesson runtime. The model is the powers-of-ten LADDER (PowerLadder): each rung is 10 times the one below, the
// exponent says which rung a quantity is past, the number in front says how far up the gap it sits.
//   1 The question   Earth 1.5 x 10^8 km and Neptune 4.5 x 10^9 km from the Sun: how many times as far? 3 cards
//                    (3 = numbers in front only, 10 = exponents only, 30) + how sure
//   2 Worked example Place them on the ladder -> Divide the powers (a ghost of Earth climbs one rung, x10) -> Divide
//                    the numbers in front (x3 inside the gap) -> Put it together (3 x 10^1 = 30); one "why?" with 3
//                    reasons (the wrong two = exponents only, powers compared by subtraction)
//   3 Your turn      a grain of sand 2 x 10^-4 m vs a red blood cell 8 x 10^-6 m, faded from the end: the ladder is
//                    set up, the kid divides the powers (-4 - (-6) = 2), the numbers in front (2 / 8 = 0.25) and
//                    renormalises 0.25 x 10^2 = 2.5 x 10^1 = 25; the mind-change callback to part 1
//   4 Prove it       Mia: "the city (1 x 10^5) is one power of 10 bigger than the town (9 x 10^4), so 10 times as
//                    many people"; a because-chain from reason chips, the ladder shows the two side by side and the
//                    dashed "10 x the town" far up
//   5 Practice       all 15 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/scientific-notation/script.ts = pages/lessons/scientific-notation/voice/lines.json.
// Every answer is logged with its misconception id (runtime/store.ts).
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Canvas } from '../../src/core/draw';
import { BOARD, MF, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, num, numInput, type Input, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { PowerLadder, type LadderBlock, type LadderParams, type LadderStep } from '../../src/lesson/topics/scientific-notation/PowerLadder';
import { PointHop } from '../../src/lesson/topics/scientific-notation/PointHop';
import { CalcScreen } from '../../src/lesson/topics/scientific-notation/CalcScreen';
import { FAMILY_NAMES, GENS, MC, type SnItem } from '../../src/lesson/topics/scientific-notation/items';
import { PLAN } from '../../src/lesson/topics/scientific-notation/plan';
import { LINES } from '../../src/lesson/topics/scientific-notation/script';
import { D } from '../../src/lesson/topics/scientific-notation/sci';

const SLUG = 'scientific-notation';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;

// ---------- voice: a line in the panel is its spoken line ----------
let sayTok = 0, chain: Promise<void> = Promise.resolve();
/** say lines one after another; a newer call cuts the chain (the kid acted) */
function sayAll(...ids: string[]): void {
  const t = ++sayTok;
  chain = (async () => { for (const id of ids) { if (t !== sayTok) return; await ctx.say(id); } })();
}
/** say lines after the current chain ends (the lesson moved on by itself, nothing to cut) */
function sayNext(...ids: string[]): void {
  const t = sayTok, prev = chain;
  chain = (async () => { await prev; for (const id of ids) { if (t !== sayTok) return; await ctx.say(id); } })();
}
const P = (id: string, cls = '') => html('p', cls, LINES[id]?.html ?? id);
/** feedback that is also spoken */
const fbv = (ok: boolean, id: string, extra: Kid[] = []) => { sayAll(id); return feedback(ok, LINES[id]?.html ?? id, extra); };
const sup = (n: number) => `10<sup>${String(n).replace('-', '−')}</sup>`;

// ---------- the ladder scene: the ladder on the left, the board on the right ----------
interface Model { pre: string; m: LadderBlock; alpha?: () => number }
function setLadder(models: Model[], lines: Line[], leads: Lead[], extra?: (c: Canvas) => void): void {
  setScene({
    table: 1080,
    model: c => {
      for (const x of models) {
        const a = x.alpha ? x.alpha() : 1;
        if (a <= 0.001) continue;
        c.g.save(); c.g.globalAlpha *= a;
        x.m.draw(c, progressOf((s: LadderStep) => tr.k(x.pre + s)), { pulse: [tr.k(x.pre + 'p0'), tr.k(x.pre + 'p1'), tr.k(x.pre + 'p2')], climb: tr.k(x.pre + 'pC'), within: tr.k(x.pre + 'pW') });
        c.g.restore();
      }
    },
    lines, leads, extra,
  });
}
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
/** colour tags: a = the quantity we compare with (amber), b = the other one (teal), the answer and its parts lime */
const TAGS = { a: { col: 'first' as const }, b: { col: 'second' as const }, k: { col: 'link' as const }, q: { col: 'link' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const }, r: { col: 'ink' as const } };

const EN: LadderParams = {
  lo: 7, hi: 10, unit: 'km from the Sun',
  marks: [{ v: D('1.5e8'), name: 'Earth', col: 'first', icon: 'planet' }, { v: D('4.5e9'), name: 'Neptune', col: 'second', icon: 'planet' }],
  climb: { from: 0, rungs: 1 }, within: { to: 1, label: '\\times 3' },
};
const CARDS = [
  { t: '3', id: MC.leadOnly, cb: 't.cb-three' },
  { t: '10', id: MC.expOnly, cb: 't.cb-ten' },
  { t: '30', id: '', cb: 't.cb-right' },
];
const enLines = (pre: string) => ({
  Q: line(pre + 'Q', '\\dfrac{\\cssId{b}{4.5 \\times 10^{9}}}{\\cssId{a}{1.5 \\times 10^{8}}} = \\,?', BOARD.y0 + 112, 64, TAGS),
});

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = PowerLadder(EN, MF, th);
  const { Q } = enLines('q.');
  setLadder([{ pre: 'q.', m }], [Q], []);
  tr.set('q.rungs', 1, 1.4); tr.set('q.m0', 1, 0.8, 1.0); tr.set('q.m1', 1, 0.8, 1.6); tr.set('q.Q', 1, 0.9, 2.2);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 2]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Earth is 1.5 × 10^8 km from the Sun, Neptune 4.5 × 10^9 km: about how many times as far is Neptune?', response: `${p.t} times`, expected: '30 times', correct: p.t === '30', mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>times as far</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Out to Neptune'), P('q.intro'), P('q.ask'), cards, html('div', 'label', LINES['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
  sayAll('q.intro', 'q.ask', 'q.sure');
}

// ===== 2. Worked example: Earth and Neptune =====
function partExample(): void {
  tr.reset('e.');
  const m = PowerLadder(EN, MF, th);
  const { Q } = enLines('e.');
  // each line sits level with the part of the ladder it describes: the numbers line with the x3 arc, the powers
  // line with the x10 arc, so their leaders run flat between the marks' labels
  // (the leader's rail runs at the bottom edge of its label: clear of the marks' names and values)
  // (L2 stays clear of the question: a lower line still reaches its label with a short rise under Neptune's value)
  const yW = Math.max(m.where.within!.y1 - 52, BOARD.y0 + 300), yC = Math.max(m.where.climbLabel(0)!.y1 - 52, yW + 120);
  const L2 = line('e.L2', '4.5 \\div 1.5 = \\cssId{q}{3}', yW, 68, TAGS);
  const L1 = line('e.L1', '10^{9} \\div 10^{8} = \\cssId{k}{10^{1}}', yC, 68, TAGS);
  const H = line('e.hero', '\\cssId{q}{3} \\times \\cssId{k}{10^{1}} = \\cssId{s}{30}', Math.max(yC + 160, BOARD.y0 + 700), 100, TAGS);
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'k'), to: () => m.where.climbLabel(0)!, col: 'link' },
    { key: 'e.ld2', from: () => partOf(L2, 'q'), to: () => m.where.within!, col: 'link' },
  ];
  setLadder([{ pre: 'e.', m }], [Q, L1, L2, H], leads);
  jump('e.', ['rungs', 'Q']);

  let step = 0;
  const STEPS = [
    { t: 'Place them on the ladder', why: 'Each rung is 10 times the rung below.', act: 'Place' },
    { t: 'Divide the powers of 10', why: 'Each rung climbed is one more ×10.', act: 'Climb' },
    { t: 'Divide the numbers in front', why: 'They say how far up the gap each one is.', act: 'Divide' },
    { t: 'Put it together', why: 'Multiply the two parts back together.', act: 'Put together' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.m0', 1, 0.9); await wait(0.7); if (!alive()) return;
        void bump('e.p0', alive); await wait(0.6); if (!alive()) return;
        tr.set('e.m1', 1, 0.9); await wait(0.7); if (!alive()) return;
        void bump('e.p1', alive); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.Q:dim', 1, 0.6);
        tr.set('e.climb', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('e.L1', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.ld1', 1, 0.8); void bump('e.pC', alive); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.ld1', 0, 0.4); tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.within', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.L2', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.ld2', 1, 0.8); void bump('e.pW', alive); await wait(1.0);
      } else {
        tr.set('e.ld2', 0, 0.4); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.hero', 1, 1.4); await wait(0.6); if (!alive()) return;
        void bump('e.pC', alive); void bump('e.pW', alive); await wait(0.8); if (!alive()) return;
        void bump('e.p1', alive); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(P(`e.s${i + 1}`));
      if (i === 3) selfExplain(); else sayAll(`e.s${i + 1}`);
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `The exponents only find the rung. Inside it, 4.5 is 3 times 1.5, so it’s 10 × 3 = 30.`, ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'It is 10 times: one power of 10 apart always means exactly 10 times.', ok: false, mc: MC.expOnly, id: 'e.w-ten' },
      { t: `It isn’t even 10 times: ${sup(9)} is just 1 more than ${sup(8)}.`, ok: false, mc: MC.additive, id: 'e.w-add' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbv(o.ok, o.id));
      ctx.store.log({ part: 'example', subgoal: 'compare-times-as-much', item: 'example.why', prompt: 'Why is Neptune 30 times as far from the Sun as Earth, not just 10 times?', response: o.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', LINES['e.why']!.html), bx, fbHost);
    sayAll('e.s4', 'e.why');
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), P('e.intro', 'dim'), plan, sayBox, after);
  sayAll('e.intro');
}

// ===== 3. Your turn: a grain of sand and a red blood cell (faded from the end) =====
const TC: LadderParams = {
  lo: -6, hi: -3, unit: 'meters across',
  marks: [{ v: D('8e-6'), name: 'Red blood cell', col: 'first', icon: 'cell' }, { v: D('2e-4'), name: 'Grain of sand', col: 'second', icon: 'grain' }],
  climb: { from: 0, rungs: 2 }, within: { to: 1, label: '\\times 0.25' },
};
/** a scientific-notation answer box: [a] x 10^[n] */
function sciInput(onEnter: () => void): Input {
  const mk = (cls: string, label: string) => { const i = h('input', { class: cls, inputmode: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-label': label }); i.addEventListener('keydown', e => { if (e.key === 'Enter') onEnter(); }); return i; };
  const x = mk('coef', 'number in front'), y = mk('pow', 'power of 10');
  const op = h('span', { class: 'op' }); op.innerHTML = '× 10<span class="sci-op"></span>';
  return {
    node: h('div', { class: 'ans' }, x, op, y),
    read: () => (x.value.trim() === '' || y.value.trim() === '' ? null : { kind: 'pair', x: num(x), y: num(y) }),
    focus: () => x.focus(),
  };
}
function partTurn(): void {
  tr.reset('t.');
  const m = PowerLadder(TC, MF, th);
  const Q = line('t.Q', '\\dfrac{\\cssId{b}{2 \\times 10^{-4}}}{\\cssId{a}{8 \\times 10^{-6}}} = \\,?', BOARD.y0 + 112, 64, TAGS);
  const L1 = line('t.L1', '10^{-4} \\div 10^{-6} = \\cssId{k}{10^{2}}', BOARD.y0 + 300, 68, TAGS);
  const L2 = line('t.L2', '2 \\div 8 = \\cssId{q}{0.25}', BOARD.y0 + 420, 68, TAGS);
  const L3a = line('t.L3a', '\\cssId{q}{0.25} \\times \\cssId{k}{10^{2}}', BOARD.y0 + 545, 68, TAGS);
  const L3 = line('t.L3', '= \\cssId{s}{2.5 \\times 10^{1}}', BOARD.y0 + 650, 68, TAGS);
  const H = line('t.hero', '= \\cssId{s}{25}', BOARD.y0 + 800, 110, TAGS);
  setLadder([{ pre: 't.', m }], [Q, L1, L2, L3a, L3, H], []);
  tr.set('t.rungs', 1, 1.2); tr.set('t.m0', 1, 0.8, 0.9); tr.set('t.m1', 1, 0.8, 1.4); tr.set('t.Q', 1, 0.9, 1.8);

  let step = 0;
  const STEPS = [
    { t: 'Place them on the ladder', why: 'Done for you.' },
    { t: 'Divide the powers of 10', why: 'Your step.' },
    { t: 'Divide the numbers in front', why: 'Your step.' },
    { t: 'Put it together', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A grain of sand'), P('t.intro'), plan, work);
  sayAll('t.intro');
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    step = 1; drawPlan(); askPow();
  });

  function askPow(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check());
    const lead = h('span', { class: 'op' }); lead.innerHTML = `${sup(-4)} ÷ ${sup(-6)} = 10<sup>?</sup>&nbsp;&nbsp;exponent:`;
    inp.node.prepend(lead);
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbv(false, 't.fill')); return; }
      const v = r.v, right = v === 2;
      const div = Math.abs(v - 4 / 6) < 0.01;
      const id = right ? 't.p-ok' : v === -10 ? 't.p-subneg' : v === -2 ? 't.p-rev' : div ? 't.p-div' : 't.p-other';
      ctx.store.log({ part: 'turn', subgoal: 'divide-sci', item: 'turn.powers', prompt: '10^-4 ÷ 10^-6 = 10^?', response: v, expected: 2, correct: right, mc: v === -10 ? MC.subNeg : div ? MC.quotDiv : v === -2 ? MC.largerBySmaller : undefined });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.Q:dim', 1, 0.6);
        tr.set('t.climb', 1, 2.4); await wait(2.4); if (!alive()) return;
        tr.set('t.L1', 1, 0.9); await wait(0.7); if (!alive()) return;
        void bump('t.pC', alive); await wait(1.4); if (!alive()) return;
        step = 2; drawPlan(); askCoef();
      });
    }
    work.replaceChildren(P('t.pow'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayNext('t.pow');
    inp.focus();
  }
  function askCoef(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check());
    const lead = h('span', { class: 'op' }); lead.innerHTML = '2 ÷ 8 =';
    inp.node.prepend(lead);
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbv(false, 't.fill')); return; }
      const v = r.v, right = Math.abs(v - 0.25) < 1e-12;
      const id = right ? 't.c-ok' : v === 4 ? 't.c-flip' : v === 6 || v === -6 ? 't.c-sub' : 't.c-other';
      ctx.store.log({ part: 'turn', subgoal: 'divide-sci', item: 'turn.coefficients', prompt: '2 ÷ 8 = ?', response: v, expected: 0.25, correct: right, mc: v === 4 ? MC.largerBySmaller : v === 6 || v === -6 ? MC.divSubCoef : undefined });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.L1:dim', 1, 0.6);
        tr.set('t.within', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('t.L2', 1, 0.9); await wait(0.7); if (!alive()) return;
        void bump('t.pW', alive); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(P('t.coef'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayAll('t.coef');
    inp.focus();
  }
  function askWrite(): void {
    const fbHost = h('div');
    const inp = sciInput(() => check());
    const lead = h('span', { class: 'op' }); lead.innerHTML = `0.25 × ${sup(2)} =`;
    inp.node.prepend(lead);
    const ok = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fbv(false, 't.fill')); return; }
      const val = r.x * 10 ** r.y, right = Math.abs(r.x - 2.5) < 1e-12 && r.y === 1;
      const sameVal = Math.abs(val - 25) < 1e-9;
      const same = Math.abs(r.x - 2.5) < 1e-12 && r.y === 3;
      const id = right ? 't.w-ok' : same ? 't.w-same' : sameVal ? 't.w-out' : 't.w-other';
      ctx.store.log({ part: 'turn', subgoal: 'renormalize', item: 'turn.write', prompt: '0.25 × 10^2 in scientific notation', response: [r.x, r.y], expected: [2.5, 1], correct: right, mc: right ? undefined : same ? MC.sameDir : sameVal ? MC.coefOut : undefined });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      done = true; ok.disabled = true;
      seq(async alive => {
        tr.set('t.L2:dim', 1, 0.6);
        tr.set('t.L3a', 1, 0.8); await wait(0.8); if (!alive()) return;
        tr.set('t.L3', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.hero', 1, 1.0); await wait(0.6); if (!alive()) return;
        void bump('t.p1', alive); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    }
    work.replaceChildren(P('t.write'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayAll('t.write');
    inp.focus();
  }
  function callback(): HTMLElement {
    const pick = commit().pick;
    const id = pick === null ? 't.cb-none' : CARDS[pick]!.cb;
    const c = h('div', { class: 'callback' });
    c.innerHTML = LINES[id]!.html;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    sayNext(id);
    return c;
  }
}

// ===== 4. Prove it: Mia's "one power of 10 bigger means 10 times as many" =====
const PR: LadderParams = {
  lo: 4, hi: 6, unit: 'people',
  marks: [
    { v: D('9e4'), name: 'Town', col: 'first', icon: 'town' },
    { v: D('1e5'), name: 'City', col: 'second', icon: 'town' },
    { v: D('9e5'), name: '10 × the town', col: 'wrong', icon: 'town', dashed: true },
  ],
};
function partProve(): void {
  tr.reset('p.');
  const m = PowerLadder(PR, MF, th);
  const y0 = BOARD.y0;
  const J = line('p.J', '\\cssId{r}{\\text{city} = 10 \\times \\text{town}}\\;?', y0 + 100, 72, TAGS);
  const C1 = line('p.C1', '9 \\times 10^{4} = \\cssId{a}{90{,}000}', y0 + 260, 68, TAGS);
  const C1b = line('p.C1b', '1 \\times 10^{5} = \\cssId{b}{100{,}000}', y0 + 370, 68, TAGS);
  const C2 = line('p.C2', '\\dfrac{100{,}000}{90{,}000} = \\dfrac{10}{9} \\approx \\cssId{s}{1.1}', y0 + 560, 68, TAGS);
  const C3 = line('p.C3', '\\text{city} \\approx 1.1 \\times \\text{town}', y0 + 780, 72, undefined, 'link');
  setLadder([{ pre: 'p.', m }], [J, C1, C1b, C2, C3], [], c => {
    const ks = tr.k('p.strike');
    if (ks > 0) { const b = partOf(J, 'r'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
  });
  tr.set('p.rungs', 1, 1.2); tr.set('p.m0', 1, 0.8, 0.9); tr.set('p.m1', 1, 0.8, 1.4); tr.set('p.J', 1, 1.0, 1.8);

  const CHIPS = [
    { t: '9 × 10,000 = 90,000 and 1 × 100,000 = 100,000.', fits: 0 },
    { t: '100,000 ÷ 90,000 = 10/9, about 1.1.', fits: 1 },
    { t: 'The exponents only give the band; the numbers in front decide the exact ratio.', fits: 2 },
    { t: 'One power of 10 apart always means exactly 10 times.', fits: -1, mc: MC.expOnly, id: 'p.x-ten' },
    { t: `${sup(5)} is just 1 more than ${sup(4)}.`, fits: -1, mc: MC.additive, id: 'p.x-add' },
  ];
  const CLAIMS = [
    'The town has 90,000 people and the city 100,000,',
    'So the city has only about 1.1 times as many people, not 10 times,',
    'So Mia is wrong: one power of 10 apart does not always mean 10 times,',
  ];
  let filled = 0;
  const chainBox = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chainBox.replaceChildren(...CLAIMS.map((t, i) => {
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
    ctx.store.log({ part: 'prove', subgoal: 'order-of-magnitude-convention', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!, response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbv(false, ch.id ?? 'p.x-slot')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    if (n < 3) fbHost.replaceChildren(fbv(true, `p.c${n}`));
    else { fbHost.replaceChildren(feedback(true, LINES['p.c3']!.html)); sayAll('p.c3', 'p.done'); }
    seq(async alive => {
      if (n === 1) {
        tr.set('p.C1', 1, 0.9); await wait(0.5); if (!alive()) return;
        void bump('p.p0', alive); await wait(0.6); if (!alive()) return;
        tr.set('p.C1b', 1, 0.9); await wait(0.5); if (!alive()) return;
        void bump('p.p1', alive);
      } else if (n === 2) {
        tr.set('p.C1:dim', 1, 0.6); tr.set('p.C1b:dim', 1, 0.6);
        tr.set('p.C2', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('p.m2', 1, 1.0); await wait(1.0); if (!alive()) return;
        void bump('p.p2', alive);
      } else {
        tr.set('p.C2:dim', 1, 0.6);
        tr.set('p.C3', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.append(feedback(true, LINES['p.done']!.html, [h('div', { class: 'row' }, btn('Practice', () => go(4), 'go'))]));
      }
    });
  }
  const proofHost = h('div');
  const yes = btn('Mia is right', () => judge(true)), no = btn('Mia is wrong', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', subgoal: 'order-of-magnitude-convention', item: 'prove.judge', prompt: 'Mia: the city (1 × 10^5) is one power of 10 bigger than the town (9 × 10^4), so it has 10 times as many people. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.expOnly : undefined });
    const id = right ? 'p.build-right' : 'p.build-wrong';
    proofHost.replaceChildren(P(id), chainBox, chipBox, fbHost);
    sayAll(id);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), P('p.intro'), P('p.ask'), h('div', { class: 'row' }, yes, no), proofHost);
  sayAll('p.intro', 'p.ask');
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as SnItem),
  });
}
/** a line centred on x (for the wide slate under a strip) */
function cLine(key: string, src: string, cx: number, y: number, size: number, maxW: number, tags?: Line['tags'], col?: Line['col']): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 56 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x: cx - texWidth(F, s) / 2, y, size: s, tags, col };
}
type Solve = (alive: () => boolean) => Promise<void>;
/** place lines top-down by their real heights (fractions are tall), `gap` px apart, starting at `top` */
function stack(Ls: Line[], top: number, gap = 44): Line[] {
  let cur = top;
  for (const L of Ls) {
    const b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
    const above = L.y - b.y0, below = b.y1 - L.y;
    L.y = cur + above;
    cur = L.y + below + gap;
  }
  return Ls;
}
/** board lines under the question, one after another */
async function writeLines(n: number, alive: () => boolean): Promise<void> {
  for (let i = 0; i < n; i++) { tr.set(`x.L${i}`, 1, 0.9); if (i > 0) tr.set(`x.L${i - 1}:dim`, 1, 0.5); await wait(1.0); if (!alive()) return; }
}
/** the item's picture with its board; `ready` jumps the shown steps (a bare item turning into its picture) */
function picScene(item: SnItem): { solve: Solve } | null {
  const pic = item.pic!;
  if (pic.kind === 'hop') {
    const mk = tryBlock(() => PointHop(pic.p, frame(100, 40, 1720, 400), th));
    if (!mk.ok) { console.warn(mk.error); return null; }
    const m = mk.value;
    const slateB = box(240, 520, 1680, 1030);
    const T = cLine('x.T', item.board, slateB.cx, 0, 76, slateB.w - 120);
    const Ls = item.solveTex.map((s, i) => cLine(`x.L${i}`, s, slateB.cx, 0, 72, slateB.w - 120));
    stack([T, ...Ls], slateB.y0 + 50, 40);
    setScene({ table: 1080, model: c => m.draw(c, progressOf(s => tr.k('x.' + s))), lines: [T, ...Ls], leads: [], boardBox: slateB });
    tr.set('x.T', 1, 0.8, 0.3); pic.show.forEach((s, i) => tr.set('x.' + s, 1, 0.8, i * 0.4));
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        const hops = Math.abs(m.maths.hops);
        if (pic.solve.includes('hop')) { tr.set('x.hop', 1, Math.max(0.6, hops * 0.42)); await wait(Math.max(0.6, hops * 0.42) + 0.2); if (!alive()) return; }
        if (pic.solve.includes('read')) { tr.set('x.read', 1, 0.6); await wait(0.6); if (!alive()) return; }
        await writeLines(Ls.length, alive);
      },
    };
  }
  if (pic.kind === 'ladder') {
    const mk = tryBlock(() => PowerLadder(pic.p, MF, th));
    if (!mk.ok) { console.warn(mk.error); return null; }
    const m = mk.value;
    const T = line('x.T', item.board, 0, 72);
    const Ls = item.solveTex.map((s, i) => line(`x.L${i}`, s, 0, 68));
    stack([T, ...Ls], BOARD.y0 + 60, 56);
    setLadder([{ pre: 'x.', m }], [T, ...Ls], []);
    tr.set('x.T', 1, 0.8, 0.4); pic.show.forEach((s, i) => tr.set('x.' + s, 1, s === 'rungs' ? 1.0 : 0.7, i * 0.45));
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        for (const s of pic.solve) { const d = s === 'climb' ? Math.max(1, (pic.p.climb?.rungs ?? 1) * 0.8) : 1.0; tr.set('x.' + s, 1, d); await wait(d + 0.1); if (!alive()) return; }
        await writeLines(Ls.length, alive);
        void bump('x.pC', alive); void bump('x.pW', alive);
      },
    };
  }
  const mk = tryBlock(() => CalcScreen(pic.text, pic.device, MF, th));
  if (!mk.ok) { console.warn(mk.error); return null; }
  const sc = mk.value;
  const T = line('x.T', item.board, 0, 76);
  const Ls = item.solveTex.map((s, i) => line(`x.L${i}`, s, 0, 68));
  stack([T, ...Ls], BOARD.y0 + 60, 56);
  setScene({ table: 1080, model: c => sc.draw(c, { body: tr.k('x.body'), text: tr.k('x.text') }), lines: [T, ...Ls], leads: [] });
  tr.set('x.body', 1, 0.8); tr.set('x.text', 1, 0.9, 0.6); tr.set('x.T', 1, 0.8, 1.0);
  return { solve: async alive => { tr.set('x.T:dim', 1, 0.5); await writeLines(Ls.length, alive); } };
}
function showItem(item: SnItem): { solve?: Solve } {
  tr.reset('x.');
  if (item.pic && !item.bareFirst) {
    const sc = picScene(item);
    if (sc) return sc;
  }
  const big = box(260, 240, 1660, 800);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  if (!item.pic) {
    // a bare item: its worked lines replace the question on the slate
    return {
      solve: async alive => {
        if (!item.solveTex.length) return;
        const Ls = stack(item.solveTex.map((s, i) => cLine(`x.L${i}`, s, big.cx, 0, 80, big.w - 140)), big.y0 + 60, 40);
        setScene({ table: 1080, lines: Ls, leads: [], boardBox: big });
        await writeLines(Ls.length, alive);
      },
    };
  }
  return {
    solve: async alive => {
      // the picture arrives with the worked solution
      const sc = picScene(item);
      if (!sc) return;
      await wait(1.4); if (!alive()) return;
      await sc.solve(alive);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\dfrac{4.5 \\times 10^{9}}{1.5 \\times 10^{8}}', '10^{-4} \\div 10^{-6}', '\\text{Mia: city town}', '\\texttt{4.7E-8}', '\\approx \\le \\mu'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
