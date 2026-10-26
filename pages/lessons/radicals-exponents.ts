// radicals-exponents.ts: "Radicals and rational exponents" (Algebra 1, lesson 12) on the shared lesson runtime.
//   1 The question   8^(2/3) = ? on the exponent ladder (1 at 0, 8 at 1): 4 / 16/3 (base × exponent) / 17/3 (equal
//                    sums) + how sure
//   2 Worked example whole steps multiply by 8 → split a step into three equal hops r·r·r = 8, r = 2 = ∛8 → two hops
//                    give 4 = (∛8)² → power first ∛64 = 4; why 8^(1/3) = 2 (3 reasons)
//   3 Your turn      16^(−3/4) on a quarter ladder: 16^(1/4) = 2 is given; the kid types 16^(3/4) = 8, then goes left
//                    of 0 (each hop divides): 1/8; callback to the card
//   4 Prove it       Jay's chain −2 = (−8)^(1/3) = (−8)^(2/6) = ((−8)²)^(1/6) = 64^(1/6) = 2: judge, find the step,
//                    then a because-chain from reason chips (distractors = catalogue misconceptions)
//   5 Practice       all 28 sub-goals one after another, then mixed (runtime/practice.ts); ladder, tiles, a graph of
//                    the domain or the chain slate as the picture, replayed after a miss
// Voiced lines: src/lesson/topics/radicals-exponents/script.ts (pages/lessons/radicals-exponents/voice/lines.json).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { slate } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { Plane, type PItem } from '../../src/lesson/kit/Plane';
import { ExpLadder, type LadderBlock, type LadderFocus, type LadderParams, type LadderStep } from '../../src/lesson/topics/radicals-exponents/ExpLadder';
import { RootTiles, type TilesStep } from '../../src/lesson/topics/radicals-exponents/RootTiles';
import { FAMILY_NAMES, GENERATORS, MC, type RXItem, type DomPic, type LadderPic } from '../../src/lesson/topics/radicals-exponents/items';
import { PLAN } from '../../src/lesson/topics/radicals-exponents/plan';
import { explain } from '../../src/lesson/topics/radicals-exponents/explain';
import { SCRIPT } from '../../src/lesson/topics/radicals-exponents/script';
import { chainLines } from '../../src/lesson/topics/radicals-exponents/fam3';

const SLUG = 'radicals-exponents';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: shows SCRIPT[id].html, the narrator says SCRIPT[id].say (voice/lines.json) */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  const L = SCRIPT[id];
  if (!L) console.warn('no script line', id);
  void ctx.say(id);
  return html(tag, cls, L?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }
const fr = (n: string | number, d: string | number) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;

// ===================== board helpers =====================
function centred(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  if (texWidth(F, s) > BOARD_W + 40) console.warn('board line too wide:', src);
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, col };
}
function strikeLine(c: Canvas, L: Line, k: number): void {
  if (k <= 0) return;
  const b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
  strike(c, b.x0 - 12, b.cy + 6, b.x1 + 12, b.cy - 6, k, { col: 'wrong' });
}

// ===================== the ladder rig: ExpLadder + named animated focus =====================
interface Rig { L: LadderBlock; draw(c: Canvas): void; nodes(d?: number, dur?: number): void }
function ladRig(pre: string, p: LadderParams, alpha?: () => number): Rig {
  const L = ExpLadder(p, MF, th);
  const P = progressOf<LadderStep>(s => tr.k(`${pre}${s}`));
  const focus = (): LadderFocus => ({
    rings: Array.from({ length: L.count }, (_, i) => ({ i, col: 'pick' as Paint, k: tr.k(`${pre}ring${i}`) })),
    lit: Array.from({ length: L.count }, (_, i) => ({ i, k: tr.k(`${pre}lit${i}`) })),
  });
  return {
    L,
    draw: c => { const a = alpha ? alpha() : 1; if (a <= 0) return; c.g.save(); c.g.globalAlpha *= a; L.draw(c, P, focus()); c.g.restore(); },
    nodes(d = 0, dur = 0.6) { tr.set(`${pre}axis`, 1, 0.9, d); for (let i = 0; i < L.count; i++) tr.set(`${pre}n${i}`, 1, dur, d + 0.5 + i * 0.12); },
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '4', h: '4', mc: undefined as string | undefined, why: 'q.cb.right' },
  { t: '16/3', h: fr(16, 3), mc: MC.baseTimesExp as string | undefined, why: 'q.cb.mult' },
  { t: '17/3', h: fr(17, 3), mc: 'mc.exponents-roots.root-by-linear-interpolation' as string | undefined, why: 'q.cb.slide' },
];
const Q8: LadderParams = { base: '8', n: 3, lo: 0, hi: 3, values: ['1', null, null, '8'], given: [true, false, false, true], ask: 2 };
function partQuestion(): void {
  tr.reset('q.');
  const rig = ladRig('q.', Q8);
  const L1 = centred('q.L1', '8^{0} = 1', 200, 76), L2 = centred('q.L2', '8^{1} = 8', 310, 76), L3 = centred('q.L3', '8^{\\frac{2}{3}} = \\,?', 470, 96, 'first');
  setScene({ model: rig.draw, lines: [L1, L2, L3], leads: [] });
  rig.nodes(0.2);
  tr.set('q.L1', 1, 0.9, 1.8); tr.set('q.L2', 1, 0.9, 2.3); tr.set('q.L3', 1, 1.0, 3.0); tr.set('q.ring2', 1, 0.6, 3.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '8^(2/3) = ?', board: '8^{\\frac{2}{3}}', response: c.t, expected: '4', correct: c.t === '4', mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = cd.h; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A fraction as an exponent'), voiced('q.intro'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
const W1: LadderParams = { base: '8', n: 1, lo: 0, hi: 2, values: ['1', '8', '64'], given: [true, true, true], factor: '\\times 8' };
const W2a: LadderParams = { base: '8', n: 3, lo: 0, hi: 3, values: ['1', '2', '4', '8'], given: [true, false, false, true], factor: '\\times r' };
const W2b: LadderParams = { ...W2a, factor: '\\times 2' };
function partExample(): void {
  tr.reset('e.');
  const sw = () => tr.k('e.swap'), fac = () => tr.k('e.fac');
  const r1 = ladRig('e.a.', W1, () => 1 - sw()), r2a = ladRig('e.b.', W2a, () => sw() * (1 - fac())), r2b = ladRig('e.b.', W2b, () => sw() * fac());
  const L = {
    w1: centred('e.w1', '8^{1} \\cdot 8^{1} = 8^{2} = 64', 150, 70),
    h1: centred('e.h1', 'r \\cdot r \\cdot r = 8', 290, 72),
    h2: centred('e.h2', '8^{\\frac{1}{3}} = \\sqrt[3]{8} = 2', 400, 72, 'second'),
    t1: centred('e.t1', '8^{\\frac{2}{3}} = \\left(\\sqrt[3]{8}\\right)^{2} = 4', 560, 72, 'link'),
    p1: centred('e.p1', '\\sqrt[3]{8^{2}} = \\sqrt[3]{64} = 4', 690, 72),
  };
  setScene({ model: c => { r1.draw(c); r2a.draw(c); r2b.draw(c); }, lines: Object.values(L), leads: [] });
  tr.jump('e.swap', 0); tr.jump('e.fac', 0);
  let step = 0;
  const STEPS = [
    { t: 'Whole steps', why: 'What does each step do?', act: 'Show' },
    { t: 'Split a step into three', why: 'Three equal hops make × 8.', act: 'Split' },
    { t: 'Two of the hops', why: 'The numerator counts hops.', act: 'Hop' },
    { t: 'Power first, same answer', why: 'Root first keeps it small.', act: 'Compare' },
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
        r1.nodes(0, 0.6); await wait(1.6); if (!alive()) return;
        tr.set('e.a.h0', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.a.h1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.w1', 1, 1.0); await wait(1.2);
      } else if (i === 1) {
        tr.set('e.w1:dim', 1, 0.5);
        tr.set('e.swap', 1, 0.8); r2a.nodes(0.2, 0.6); await wait(1.8); if (!alive()) return;
        for (const k of [0, 1, 2]) { tr.set(`e.b.h${k}`, 1, 0.8); await wait(0.75); if (!alive()) return; }
        tr.set('e.h1', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.fac', 1, 0.6); tr.set('e.b.v1', 1, 0.7, 0.3); tr.set('e.b.ring1', 1, 0.5, 0.4); tr.set('e.h2', 1, 1.0, 0.4); await wait(1.6);
      } else if (i === 2) {
        tr.set('e.h1:dim', 1, 0.5); tr.set('e.b.ring1', 0, 0.4);
        tr.set('e.b.lit1', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.b.v2', 1, 0.7); tr.set('e.b.lit2', 1, 0.5, 0.3); tr.set('e.b.ring2', 1, 0.5, 0.3); tr.set('e.t1', 1, 1.1, 0.4); await wait(1.6);
      } else {
        tr.set('e.b.lit1', 0, 0.4); tr.set('e.p1', 1, 1.2); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Three equal hops make one × 8 step, and 2 · 2 · 2 = 8.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: `8 × ${fr(1, 3)} is about 2.7, and that rounds to 2.`, ok: false, id: 'e.why.mult', mc: MC.baseTimesExp as string | undefined },
      { t: 'A calculator says so.', ok: false, id: 'e.why.calc', mc: MC.examplesProof as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is 8^(1/3) equal to 2?', response: o.t.replace(/<[^>]+>/g, ''), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 16^(−3/4) =====================
// ticks k = −3..4 (index i = k + 3): 1/8, 1/4, 1/2, 1, 2, 4, 8, 16
const Y16: LadderParams = { base: '16', n: 4, lo: -3, hi: 4, values: ['\\frac{1}{8}', '\\frac{1}{4}', '\\frac{1}{2}', '1', '2', '4', '8', '16'], given: [false, false, false, true, false, false, false, true], factor: '\\times 2', ask: -3 };
function partTurn(): void {
  tr.reset('t.');
  const rig = ladRig('t.', Y16);
  const L = {
    g1: centred('t.B.g1', '2 \\cdot 2 \\cdot 2 \\cdot 2 = 16', 150, 70),
    g2: centred('t.B.g2', '16^{\\frac{1}{4}} = \\sqrt[4]{16} = 2', 260, 72, 'second'),
    v1: centred('t.B.v1', '16^{\\frac{3}{4}} = \\,?', 410, 76),
    v2: centred('t.B.v2', '16^{\\frac{3}{4}} = 2^{3} = 8', 410, 76, 'link'),
    n1: centred('t.B.n1', '16^{-\\frac{3}{4}} = \\,?', 560, 80, 'first'),
    n2: centred('t.B.n2', '16^{-\\frac{3}{4}} = \\frac{1}{16^{\\frac{3}{4}}} = \\frac{1}{8}', 590, 76, 'link'),
  };
  setScene({ model: rig.draw, lines: Object.values(L), leads: [] });
  rig.nodes(0.2, 0.5); tr.set('t.B.n1', 1, 1.0, 2.0); tr.set('t.ring0', 1, 0.5, 2.4);
  let step = 0;
  const STEPS = [
    { t: 'One hop', why: 'Done for you: 16<sup>1/4</sup> = 2.' },
    { t: 'Three hops right', why: 'Your step.' },
    { t: 'Three hops left', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a negative exponent'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.2); if (!alive()) return;
    for (const k of [3, 4, 5, 6]) { tr.set(`t.h${k}`, 1, 0.7); await wait(0.6); if (!alive()) return; }
    tr.set('t.B.g1', 1, 1.0); await wait(1.1); if (!alive()) return;
    tr.set('t.v4', 1, 0.6); tr.set('t.B.g2', 1, 1.0, 0.2); await wait(1.3); if (!alive()) return;
    work.replaceChildren(voiced('t.given'));
    await wait(1.0); if (!alive()) return;
    step = 1; drawPlan(); askPos();
  });
  function askPos(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    tr.set('t.B.v1', 1, 0.9); tr.set('t.ring6', 1, 0.5);
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.v.empty', false)); return; }
      const v = r.v, right = v === 8;
      const mc = v === 12 ? MC.baseTimesExp : v === 64 ? MC.swapped : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.pos', prompt: '16^(3/4) = ?', board: '16^{\\frac{3}{4}}', response: v, expected: 8, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 12 ? 't.v.mult' : v === 64 ? 't.v.swap' : 't.v.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.v.ok', true));
      seq(async alive => {
        tr.set('t.lit4', 1, 0.4); tr.set('t.v5', 1, 0.5, 0.3); tr.set('t.lit5', 1, 0.4, 0.4); tr.set('t.v6', 1, 0.5, 0.8); tr.set('t.lit6', 1, 0.4, 0.9);
        tr.set('t.B.v1', 0, 0.4); tr.set('t.B.v2', 1, 0.9, 0.3); await wait(2.2); if (!alive()) return;
        for (const k of [4, 5, 6]) tr.set(`t.lit${k}`, 0, 0.5); tr.set('t.ring6', 0, 0.5);
        step = 2; drawPlan(); askNeg();
      });
    }
    work.replaceChildren(voiced('t.v'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askNeg(): void {
    const fbHost = h('div'), inp = fracInput('', () => check(), false), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'frac' || !Number.isFinite(r.n) || !Number.isFinite(r.d) || r.d === 0) { fbHost.replaceChildren(voicedFb('t.n.empty', false)); return; }
      const val = (r.w * r.d + r.n) / r.d, neg = r.w < 0 || r.n < 0 || r.d < 0;
      const right = Math.abs(val - 1 / 8) < 1e-9 && !neg;
      const mc = neg ? MC.negMakesNeg : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.neg', prompt: '16^(−3/4) = ?', board: '16^{-\\frac{3}{4}}', response: `${r.n}/${r.d}`, expected: '1/8', correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(neg ? 't.n.neg' : Math.abs(Math.abs(val) - 8) < 1e-9 ? 't.n.recip' : 't.n.no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.n.ok', true));
      seq(async alive => {
        for (const k of [2, 1, 0]) { tr.set(`t.h${k}`, 1, 0.7); tr.set(`t.v${k}`, 1, 0.5, 0.5); await wait(0.8); if (!alive()) return; }
        tr.set('t.ring0', 0, 0.4); tr.set('t.lit0', 1, 0.5); tr.set('t.B.n1', 0, 0.4); tr.set('t.B.n2', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.n'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick];
    const id = cd ? cd.why : 'q.cb.none';
    const el = voiced(id);
    if (cd) el.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(el, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== the chain slate (part 4 and practice) =====================
interface ChainRig { draw(c: Canvas): void; row(i: number): Box }
function chainRig(pre: string, lines: string[], fr0 = MF): ChainRig {
  const b = box(fr0.x, fr0.y + 40, fr0.x + fr0.w, fr0.y + fr0.h - 40);
  const Fs = lines.map(s => tex(s) as Formula);
  const x0 = b.x0 + 210, maxW = b.x1 - 120 - x0;
  const size = Math.max(56, Math.min(72, Math.floor(Math.min(...Fs.map(F => maxW / (texWidth(F, 1) || 1))))));
  const gap = Math.min(150, (b.h - 120) / lines.length), y = (i: number) => b.y0 + 110 + i * gap;
  const CHECK = tex('\\checkmark') as Formula, CROSS = tex('\\times') as Formula;
  const row = (i: number) => box(b.x0 + 20, y(i) - gap / 2 + 8, b.x1 - 20, y(i) + gap / 2 - 8);
  return {
    row,
    draw(c) {
      slate(c, b, tr.k(`${pre}slate`));
      lines.forEach((_, i) => {
        const k = tr.k(`${pre}l${i}`);
        if (k <= 0) return;
        const bad = tr.k(`${pre}x${i}`), good = tr.k(`${pre}m${i}`), ring = tr.k(`${pre}r${i}`);
        drawWords(c, `step ${i + 1}`, b.x0 + 40, y(i), ring > 0.5 ? 'pick' : 'faint', k, { size: 44 });
        texDraw(c, Fs[i]!, x0, y(i), { size, align: 'left', k, col: bad > 0.5 ? 'wrong' : 'ink' });
        if (good > 0) texDraw(c, CHECK, b.x1 - 70, y(i), { size: 64, align: 'center', k: good, col: 'link' });
        if (bad > 0) texDraw(c, CROSS, b.x1 - 70, y(i), { size: 70, align: 'center', k: bad, col: 'wrong' });
        if (ring > 0) { const R = row(i), { g } = c; g.save(); g.globalAlpha *= Math.min(1, ring); g.strokeStyle = th.roles.pick.fill; g.lineWidth = 5; g.beginPath(); g.roundRect(R.x0, R.y0, R.w, R.h, 16); g.stroke(); g.restore(); }
      });
    },
  };
}

// ===================== 4. Prove it: the flawed chain =====================
function partProve(): void {
  tr.reset('p.');
  const lines = chainLines({ a: -8, r: 2, k: 3 });
  const rig = chainRig('p.', lines);
  const B = {
    b1: centred('p.b1', '(-2)^{3} = -8', 170, 72),
    b2: centred('p.b2', '\\frac{2}{6} = \\frac{1}{3}', 300, 72),
    b3: centred('p.b3', '(-8)^{2} = 64 = 8^{2}', 430, 70),
    b4: centred('p.b4', '\\left(a^{m}\\right)^{\\frac{1}{n}} = a^{\\frac{m}{n}}', 590, 72, 'pick'),
    b5: centred('p.b5', '\\text{only for } a > 0', 700, 66, 'pick'),
    eq: centred('p.eq', '-2 = 2', 860, 80, 'wrong'),
  };
  setScene({ model: rig.draw, lines: Object.values(B), leads: [], extra: c => strikeLine(c, B.eq, tr.k('p.strike')) });
  tr.set('p.slate', 1, 0.5); lines.forEach((_, i) => tr.set(`p.l${i}`, 1, 0.8, 0.4 + i * 0.5)); tr.set('p.eq', 1, 0.8, 3.2);
  const CLAIMS = [
    `Step 1: (${'−'}8)<sup>1/3</sup> = ${'−'}2`,
    `Step 2: (−8)<sup>2/6</sup> is the same number, −2`,
    'Steps 4 and 5: (−8)<sup>2</sup> = 64 and 64<sup>1/6</sup> = 2',
    'So step 3 breaks: (−8)<sup>2/6</sup> ≠ ((−8)<sup>2</sup>)<sup>1/6</sup>',
  ];
  const CHIPS = [
    { t: '(−2)<sup>3</sup> = −8: an odd root of a negative number is real.', fits: 0 },
    { t: 'An exponent is read in lowest terms: 2/6 = 1/3.', fits: 1 },
    { t: 'Squaring throws the sign away, and the principal root is positive.', fits: 2 },
    { t: 'The power-of-a-power law was proved for positive bases only; one counterexample shows it fails here.', fits: 3 },
    { t: '(−8)<sup>1/3</sup> is not a real number.', fits: -1, mc: MC.oddNegUndef, id: 'p.no.odd' },
    { t: '64<sup>1/6</sup> is ±2, so it could be −2.', fits: -1, mc: MC.everyPM, id: 'p.no.pm' },
    { t: 'Exponent laws hold for every base.', fits: -1, mc: MC.lawsAlways, id: 'p.no.always' },
    { t: 'No exponent law works when the base is negative.', fits: -1, mc: MC.rejectsAll, id: 'p.no.reject' },
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.b1', 1, 0.9); tr.set('p.m0', 1, 0.6, 0.6); }
      if (n === 2) { tr.set('p.b2', 1, 0.9); tr.set('p.m1', 1, 0.6, 0.6); }
      if (n === 3) { tr.set('p.b3', 1, 0.9); tr.set('p.m3', 1, 0.6, 0.6); tr.set('p.m4', 1, 0.6, 0.9); }
      if (n === 4) {
        tr.set('p.r2', 1, 0.5); tr.set('p.x2', 1, 0.7, 0.4); tr.set('p.b4', 1, 1.0, 0.6); tr.set('p.b5', 1, 0.9, 1.4); await wait(2.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const proofHost = h('div');
  function pickStep(): void {
    const bx = h('div', { class: 'opts' }), host = h('div');
    let done = false;
    [1, 2, 3, 4, 5].forEach(k => bx.append(btn(`Step ${k}`, () => {
      if (done) return;
      const ok = k === 3;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k - 1) b.classList.add(ok ? 'right' : 'nope'); });
      const mc = k === 1 ? MC.oddNegUndef : k === 2 ? MC.wrongFeature : k === 5 ? MC.everyPM : undefined;
      ctx.store.log({ part: 'prove', item: 'prove.step', prompt: 'Which step of the chain is wrong?', response: `Step ${k}`, expected: 'Step 3', correct: ok, mc });
      host.replaceChildren(voicedFb(`p.s${k}`, ok));
      tr.set(`p.r${k - 1}`, 1, 0.4);
      if (!ok) { seq(async alive => { tr.set(`p.m${k - 1}`, 1, 0.5); await wait(2.0); if (!alive()) return; tr.set(`p.r${k - 1}`, 0, 0.5); tr.set(`p.m${k - 1}`, 0, 0.5); }); return; }
      done = true;
      proofHost.replaceChildren(voiced('p.build'), chain, chipBox, fbHost);
      drawChain();
    })));
    proofHost.replaceChildren(voiced('p.step'), bx, host);
  }
  const yes = btn('Jay is right: −2 = 2', () => judge(true)), no = btn('A step must be wrong', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jay: this chain proves −2 = 2. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.lawsAlways : undefined });
    const first = voiced(right ? 'p.judge.yes' : 'p.judge.no');
    seq(async alive => { await wait(0.1); if (!alive()) return; pickStep(); proofHost.prepend(first); });
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
    show: it => showItem(it as RXItem),
  });
}
/** board rows for the item's TeX: a long list breaks at its commas */
function boardLines(src: string, y0: number): Line[] {
  const parts = src.split(',\\ \\ ');
  const rows: string[] = [];
  let cur = '';
  for (const p of parts) {
    const t = cur ? `${cur},\\ \\ ${p}` : p;
    if (cur && texWidth(tex(t) as Formula, 66) > BOARD_W) { rows.push(cur + ','); cur = p; } else cur = t;
  }
  rows.push(cur);
  return rows.map((r, i) => centred('x.B', r, y0 + i * 120, 76));
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
function ladderParams(pic: LadderPic): LadderParams {
  const T = pic.hi - pic.lo + 1;
  const vals: (string | null)[] = Array.from({ length: T }, () => null), given = Array.from({ length: T }, () => false);
  for (const v of pic.reveal.values) vals[v.k - pic.lo] = v.tex;
  for (const v of pic.known) { vals[v.k - pic.lo] = v.tex; given[v.k - pic.lo] = true; }
  return { base: pic.base, n: pic.n, lo: pic.lo, hi: pic.hi, values: vals, given, ask: pic.ask, factor: pic.reveal.factor, spans: pic.spans };
}
function domPlane(d: DomPic) {
  const c = -d.b / d.a;
  const rad = (x: number) => d.a * x + d.b;
  const root = (x: number) => { const r = rad(x); if (d.pow) return r >= 0 ? Math.pow(r, d.pow[0] / d.pow[1]) : NaN; if (d.n % 2 === 0) return r >= 0 ? Math.pow(r, 1 / d.n) : NaN; return Math.sign(r) * Math.pow(Math.abs(r), 1 / d.n); };
  const f = (x: number) => { const v = root(x); return d.den ? (v === 0 || Number.isNaN(v) ? NaN : 1 / v) : v; };
  const xmin = Math.floor(c) - 6, xmax = Math.floor(c) + 6;
  const even = !d.pow ? d.n % 2 === 0 : true;
  const lo = even ? (d.a > 0 ? c : xmin) : xmin, hi = even ? (d.a > 0 ? xmax : c) : xmax;
  const items: PItem[] = [
    { kind: 'curve', key: 'lin', f: rad, dash: true, col: 'second' },
    ...(even ? [{ kind: 'shade', key: 'band', lo, hi, top: 'top', bottom: 'bottom', col: 'link', alpha: 0.13 } as PItem] : []),
    { kind: 'curve', key: 'f', f, lo: even ? lo : xmin, hi: even ? hi : xmax, ends: ['none', 'none'] },
    ...(even || d.den ? [{ kind: 'point', key: 'end', x: c, y: 0, open: !!d.den } as PItem] : []),
  ];
  return Plane({ x: { min: xmin, max: xmax, step: 1, name: 'x' }, y: { min: -3, max: 5, step: 1, name: 'y' }, items }, MF, th);
}
function showItem(item: RXItem): Solve {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.ladder) {
    const lp = ladderParams(pic.ladder);
    const made = tryBlock(() => ladRig('x.', lp));
    if (made.ok) {
      const rig = made.value, T = rig.L.count;
      setScene({ model: rig.draw, lines: boardLines(item.board, 220), leads: [] });
      rig.nodes(0, 0.4); tr.set('x.B', 1, 0.8, 0.4);
      (lp.spans ?? []).forEach((_, j) => tr.set(`x.s${j}`, 1, 0.7, 1.2 + j * 0.4));
      if (lp.ask !== undefined) tr.set(`x.ring${lp.ask - lp.lo}`, 1, 0.5, 1.4);
      return {
        solve: async alive => {
          if (lp.factor) for (let i = 0; i < T - 1; i++) { tr.set(`x.h${i}`, 1, 0.5); await wait(0.3); if (!alive()) return; }
          for (let i = 0; i < T; i++) if (!lp.given?.[i] && lp.values[i]) tr.set(`x.v${i}`, 1, 0.5, 0.1 * i);
          await wait(0.8); if (!alive()) return;
          if (lp.ask !== undefined) tr.set(`x.lit${lp.ask - lp.lo}`, 1, 0.5);
        },
      };
    }
  }
  if (pic?.tiles) {
    const tp = pic.tiles;
    const made = tryBlock(() => RootTiles({ n: tp.n, tiles: tp.tiles, groups: tp.reveal.groups, result: `${tp.reveal.out === '1' ? '' : tp.reveal.out}${tp.n === 2 ? '\\sqrt' : `\\sqrt[${tp.n}]`}{${tp.reveal.inside}}` }, MF, th));
    if (made.ok) {
      const T = made.value, P = progressOf<TilesStep>(s => tr.k('x.t.' + s));
      setScene({ model: c => T.draw(c, P), lines: boardLines(item.board, 220), leads: [] });
      tr.set('x.t.rad', 1, 1.0, 0.1); tr.set('x.B', 1, 0.8, 0.4);
      return {
        solve: async alive => {
          for (let j = 0; j < tp.reveal.groups.length; j++) { tr.set(`x.t.g${j}`, 1, 0.5); await wait(0.6); if (!alive()) return; }
          tr.set('x.t.out', 1, 1.1); await wait(1.2); if (!alive()) return;
          tr.set('x.t.rest', 1, 1.0);
        },
      };
    }
  }
  if (pic?.dom) {
    const made = tryBlock(() => domPlane(pic.dom!));
    if (made.ok) {
      const Pl = made.value, P = progressOf<string>(s => tr.k('x.p.' + s));
      setScene({ model: c => Pl.draw(c, P), lines: boardLines(item.board, 220), leads: [] });
      tr.set('x.p.axes', 1, 0.8, 0.1); tr.set('x.B', 1, 0.8, 0.4);
      return {
        solve: async alive => {
          tr.set('x.p.lin', 1, 0.9); await wait(1.0); if (!alive()) return;
          tr.set('x.p.band', 1, 0.7); await wait(0.8); if (!alive()) return;
          tr.set('x.p.f', 1, 1.0); tr.set('x.p.end', 1, 0.5, 0.6);
        },
      };
    }
  }
  if (pic?.chain) {
    const rig = chainRig('x.', pic.chain.lines, { x: 260, y: 70, w: 1400, h: 940 });
    setScene({ model: rig.draw, lines: [], leads: [], boardBox: null });
    tr.set('x.slate', 1, 0.5); pic.chain.lines.forEach((_, i) => tr.set(`x.l${i}`, 1, 0.6, 0.3 + i * 0.25));
    return { solve: async alive => { tr.set('x.r2', 1, 0.5); tr.set('x.x2', 1, 0.6, 0.3); for (const i of [0, 1, 3, 4]) tr.set(`x.m${i}`, 1, 0.5, 0.6); await wait(1.0); void alive; } };
  }
  // no picture: the expression big on a wide slate (a list of statements stacks)
  const big = box(260, 200, 1660, 820);
  const parts = item.board.split(',\\ \\ ');
  if (parts.length > 1) {
    const lines = parts.map((p, i) => bigLine(`x.T`, p, box(big.x0, big.y0 + 40 + i * ((big.h - 80) / parts.length), big.x1, big.y0 + 40 + (i + 1) * ((big.h - 80) / parts.length)), 100));
    setScene({ lines, leads: [], boardBox: big });
  } else setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['8^{\\frac{2}{3}} = \\sqrt[3]{8} \\cdot \\left(-8\\right)^{\\frac{2}{6}} \\times r \\checkmark \\frac{1}{16} \\sqrt[4]{16}', '\\text{only for } a > 0'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
