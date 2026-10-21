// square-and-cube-roots.ts: square roots and cube roots (grade 8, 8.EE.A.2, 8.NS.A.1-2), on the shared lesson runtime.
//   1 The question   a cube-shaped box holds 64 one-inch cubes: how long is an edge? 8 in (ignores the index), 4 in,
//                    21 1/3 in (divides by 3) + how sure
//   2 Worked example Lay flat (8 × 8: √64 = 8) -> Stack (4 layers of 4 × 4) -> Count the edge (4) -> Check and write
//                    (4 × 4 × 4 = 64, ∛64 = 4); every symbol is written beside, and linked by colour and a leader line
//                    to, the part of the picture it names; one "why 4 and not 8?"
//   3 Your turn      216 cubes, faded from the end: stacked for you; the kid counts the edge, checks by cubing, writes
//                    ∛216 = 6 from chips, then bounds the edge of a 200 in³ box between 5 and 6 (ghost cubes)
//   4 Prove it       Jordan: "√49 = ±7, because (−7)² = 49 too"; a because-chain from reason chips; the number line
//                    shows the two solutions of x² = 49, the square shows the one side √49 names
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/square-and-cube-roots/script.ts (panel HTML) = voice/lines.json (spoken text).
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf, type Progress } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, MF, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { IsoBox, type BoxBlock, type BoxFocus, type BoxStep } from '../../src/lesson/topics/square-and-cube-roots/IsoBox';
import { SquareTiles, type SquareBlock, type SquareFocus, type SquareStep } from '../../src/lesson/topics/square-and-cube-roots/SquareTiles';
import { RootRuler, type RulerBlock, type RulerStep } from '../../src/lesson/topics/square-and-cube-roots/RootRuler';
import { FAMILY_NAMES, GENS, MC, type Pic } from '../../src/lesson/topics/square-and-cube-roots/items';
import { PLAN } from '../../src/lesson/topics/square-and-cube-roots/plan';
import { SCRIPT } from '../../src/lesson/topics/square-and-cube-roots/script';

const SLUG = 'square-and-cube-roots';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function line_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

/** tr.set plus one more frame when the move ends (a slow machine can stop the loop on the last busy frame) */
function ts(name: string, to: number, d = 0.9, delay = 0): void {
  tr.set(name, to, d, delay);
  setTimeout(markDirty, (d + delay) * 1000 + 120);
}
async function bump(key: string, alive: () => boolean): Promise<void> {
  ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6);
}
const jump = (keys: string[]) => { for (const k of keys) tr.jump(k, 1); };
const prog = <S extends string>(pre: string): Progress<S> => progressOf<S>(s => tr.k(pre + s));
const YT = BOARD.y0 + 90;
/** colour roles of the notation: amber = the volume / area (radicand), lime = the root asked for, teal = the flat side */
const T = { v: { col: 'first' as const }, s: { col: 'link' as const }, e: { col: 'link' as const }, e2: { col: 'link' as const }, e3: { col: 'link' as const }, t: { col: 'second' as const }, i: { col: 'link' as const } };

// ---------- pictures ----------
const cubeFocus = (pre: string): BoxFocus => ({ vol: tr.k(pre + 'pV'), edge: tr.k(pre + 'pE'), ringEdge: tr.k(pre + 'rE') });
const sqFocus = (pre: string): SquareFocus => ({ area: tr.k(pre + 'pA'), side: tr.k(pre + 'pS'), ringSide: tr.k(pre + 'rS') });
function drawBox(c: Parameters<NonNullable<Parameters<typeof setScene>[0]['model']>>[0], m: BoxBlock, pre: string): void { m.draw(c, prog<BoxStep>(pre), cubeFocus(pre)); }
/** the worked example's pair: 64 cubes laid flat (8 × 8 × 1) and stacked (4 × 4 × 4), at one shared scale */
const U = 44, PY = 850;
const slab64 = () => IsoBox({ nx: 8, ny: 8, nz: 1, volTex: '64\\text{ in}^3', edgeTex: '8\\text{ in}', edgeSide: 'left', edgeCol: 'second', place: { u: U, x: 75 + 8 * Math.cos(Math.PI / 6) * U, y: PY } }, MF);
const cube64 = (edgeTex = '4\\text{ in}') => IsoBox({ nx: 4, ny: 4, nz: 4, volTex: '64\\text{ in}^3', edgeTex, place: { u: U, x: 715 + 4 * Math.cos(Math.PI / 6) * U, y: PY } }, MF);

const CARDS = [
  { t: '8 in', small: 'each edge', id: MC.ignoreIndex, cb: 't.cb-sq' },
  { t: '4 in', small: 'each edge', id: '', cb: 't.cb-right' },
  { t: '21⅓ in', small: 'each edge', id: MC.divIndex, cb: 't.cb-div' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = IsoBox({ nx: 4, ny: 4, nz: 4, volTex: '64\\text{ in}^3', edgeTex: '?' }, MF);
  const Q = line('q.l1', 'e \\times e \\times e = \\cssId{v}{64}', YT, 92, T);
  const L0 = line('q.l0', '\\text{edge } e = \\,?', YT + 140, 76, undefined, 'dim');
  setScene({ table: m.where.floor, model: c => drawBox(c, m, 'q.'), lines: [Q, L0], leads: [] });
  ts('q.box', 1, 1.0); ts('q.vol', 1, 0.7, 0.9); ts('q.edge', 1, 0.8, 1.4);
  ts('q.l1', 1, 0.9, 2.0); ts('q.l0', 1, 0.7, 2.7);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A cube-shaped box holds 64 one-inch cubes (64 cubic inches). How long is each edge?', response: p.t, expected: '4 in', correct: p.t === '4 in', mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.t}</span>${cd.small ? `<small>${cd.small}</small>` : '<small>&nbsp;</small>'}`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'The gift box'), line_('q.intro'), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: 64 cubes, flat and stacked =====
function partExample(): void {
  tr.reset('e.');
  const sl = slab64(), cu = cube64();
  const Q = line('e.q', 'e \\times e \\times e = \\cssId{v}{64}', YT, 92, T);
  const H = line('e.hero', '\\sqrt[\\cssId{i}{3}]{\\cssId{v}{64}} = \\cssId{s}{4}', YT, 104, T);
  const L1 = line('e.L1', '\\sqrt{\\cssId{v}{64}} = \\cssId{t}{8}', YT + 150, 80, T);
  const L2 = line('e.L2', '4 \\times 4 = 16', YT + 280, 76, T);
  const L2b = line('e.L2b', '16 \\times 4 = \\cssId{v}{64}', YT + 380, 76, T);
  const L3 = line('e.L3', '\\text{edge} = \\cssId{e}{4}\\text{ in}', YT + 520, 76, T);
  const L4 = line('e.L4', '\\cssId{e}{4} \\times \\cssId{e2}{4} \\times \\cssId{e3}{4} = \\cssId{v}{64}', YT + 660, 80, T);
  const leads: Lead[] = [
    { key: 'e.ld3', from: () => partOf(L3, 'e'), to: () => cu.where.edgeLabel, col: 'link' },
    { key: 'e.ldS', from: () => partOf(H, 's'), to: () => cu.where.edgeLabel, col: 'link' },
  ];
  setScene({
    table: Math.min(sl.where.floor, cu.where.floor),
    model: c => { drawBox(c, sl, 'e.f.'); drawBox(c, cu, 'e.c.'); },
    lines: [Q, H, L1, L2, L2b, L3, L4], leads,
  });
  // the board starts where part 1 left it: the closed box and the question
  jump(['e.c.box', 'e.c.vol', 'e.q']);

  let step = 0;
  const STEPS = [
    { t: 'Lay the 64 cubes flat', why: 'One square layer: its side is √64.', act: 'Lay flat' },
    { t: 'Stack them in the box', why: 'Layers of 4 × 4 = 16 cubes.', act: 'Stack' },
    { t: 'Count the edge', why: 'The edge is the cube root.', act: 'Count' },
    { t: 'Check by cubing, then write it', why: 'The edge used 3 times makes 64.', act: 'Write it' },
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
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        ts('e.f.layers', 1, 1.0); ts('e.f.vol', 1, 0.6, 0.6); await wait(1.2); if (!alive()) return;
        ts('e.f.count', 1, 1.6); await wait(1.6); if (!alive()) return;
        ts('e.f.edge', 1, 0.8); await wait(0.8); if (!alive()) return;
        ts('e.L1', 1, 1.0); await wait(0.5); if (!alive()) return;
        void bump('e.f.pE', alive); await wait(0.9);
      } else if (i === 1) {
        ts('e.L1:dim', 1, 0.6); ts('e.f.count', 0, 0.6);
        ts('e.c.open', 1, 0.9); await wait(0.9); if (!alive()) return;
        ts('e.c.layers', 1, 2.4); await wait(1.0); if (!alive()) return;
        ts('e.L2', 1, 0.9); await wait(1.6); if (!alive()) return;
        ts('e.L2b', 1, 0.9); await wait(0.5); if (!alive()) return;
        void bump('e.c.pV', alive); await wait(1.0);
      } else if (i === 2) {
        ts('e.L2:dim', 1, 0.6); ts('e.L2b:dim', 1, 0.6);
        ts('e.c.count', 1, 1.4); await wait(1.4); if (!alive()) return;
        ts('e.c.edge', 1, 0.8); await wait(0.6); if (!alive()) return;
        ts('e.L3', 1, 1.0); ts('e.ld3', 1, 0.8, 0.8); await wait(1.8);
      } else {
        ts('e.ld3', 0, 0.4); ts('e.L3:dim', 1, 0.6);
        ts('e.L4', 1, 1.2); await wait(1.0); if (!alive()) return;
        void bump('e.c.pV', alive); await wait(1.0); if (!alive()) return;
        ts('e.q', 0, 0.5);
        ts('e.hero', 1, 1.4, 0.3); await wait(1.0); if (!alive()) return;
        void bump('e.c.pV', alive); await wait(0.5); if (!alive()) return;
        ts('e.ldS', 1, 0.9); void bump('e.c.pE', alive); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(line_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A cube uses its edge 3 times: 4 × 4 × 4 = 64. 8 × 8 = 64 is the flat layer.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'It is 8 really: every root of 64 is 8, the little 3 only says “cube”.', ok: false, mc: MC.ignoreIndex, id: 'e.w-sq' },
      { t: 'A cube root divides 64 by 3, and 4 is the nearest whole number of cubes.', ok: false, mc: MC.divIndex, id: 'e.w-div' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the edge of the 64 in³ box 4 in, and not 8 in?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 5200);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), line_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: 216 cubes (faded from the end), then a 200 in³ box between 5 and 6 =====
function partTurn(): void {
  tr.reset('t.');
  const m = IsoBox({ nx: 6, ny: 6, nz: 6, volTex: '216\\text{ in}^3', edgeTex: '6\\text{ in}' }, MF);
  const g = IsoBox({ nx: Math.cbrt(200), ny: Math.cbrt(200), nz: Math.cbrt(200), ghosts: true, volTex: '200\\text{ in}^3', edgeTex: null }, MF);
  const Q = line('t.q', 'e \\times e \\times e = \\cssId{v}{216}', YT, 92, T);
  const H = line('t.hero', '\\sqrt[\\cssId{i}{3}]{\\cssId{v}{216}} = \\cssId{s}{6}', YT, 104, T);
  const L1 = line('t.L1', '\\text{edge} = \\cssId{e}{6}\\text{ in}', YT + 170, 76, T);
  const L2 = line('t.L2', '6 \\times 6 \\times 6 = \\cssId{v}{216}', YT + 300, 80, T);
  const B0 = line('t.B0', 'e \\times e \\times e = \\cssId{v}{200}', YT + 470, 80, T);
  const B1 = line('t.B1', '125 < \\cssId{v}{200} < 216', YT + 600, 80, T);
  const B2 = line('t.B2', '5 < \\cssId{s}{\\sqrt[3]{200}} < 6', YT + 740, 84, T);
  const leads: Lead[] = [
    { key: 't.ld1', from: () => partOf(L1, 'e'), to: () => m.where.edgeLabel, col: 'link' },
    { key: 't.ldS', from: () => partOf(H, 's'), to: () => m.where.edgeLabel, col: 'link' },
  ];
  setScene({
    table: m.where.floor,
    model: c => {
      const k = tr.k('t.swap');
      if (k < 1) { c.g.save(); c.g.globalAlpha *= 1 - k; drawBox(c, m, 't.'); c.g.restore(); }
      if (k > 0) { c.g.save(); c.g.globalAlpha *= k; drawBox(c, g, 't.g.'); c.g.restore(); }
    },
    lines: [Q, H, L1, L2, B0, B1, B2], leads,
  });
  ts('t.box', 1, 0.8); ts('t.vol', 1, 0.6, 0.5); ts('t.q', 1, 0.8, 1.0);

  let step = 0;
  const STEPS = [
    { t: 'Stack the cubes in the box', why: 'Done for you.' },
    { t: 'Count the edge', why: 'Your step.' },
    { t: 'Check by cubing', why: 'Your step.' },
    { t: 'Write the cube root', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A bigger box'), line_('t.intro'), plan, work);

  seq(async alive => {
    await wait(1.8); if (!alive()) return;
    ts('t.open', 1, 0.8); await wait(0.8); if (!alive()) return;
    ts('t.layers', 1, 2.6); await wait(2.8); if (!alive()) return;
    step = 1; drawPlan(); askCount();
  });

  function askCount(): void {
    const fbHost = h('div');
    const inp = numInput('in', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.v === 6, div = Math.abs(r.v - 72) < 1e-9;
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: 'A cube-shaped box holds 216 one-inch cubes. How long is one edge?', response: r, expected: 6, correct: right, mc: div ? MC.divIndex : undefined });
      fbHost.replaceChildren(fb(right, right ? 't.c-ok' : div ? 't.c-div' : 't.c-other'));
      if (!right) { if (!div) { ts('t.count', 1, 1.2); } return; }
      ok.disabled = true;
      seq(async alive => {
        ts('t.count', 1, 1.2); await wait(1.2); if (!alive()) return;
        ts('t.edge', 1, 0.8); ts('t.L1', 1, 1.0, 0.4); ts('t.ld1', 1, 0.8, 1.2); await wait(2.4); if (!alive()) return;
        step = 2; drawPlan(); askCheck();
      });
    }
    work.replaceChildren(line_('t.count'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.v === 216, mult = r.v === 18, sq36 = r.v === 36;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: '6 × 6 × 6 = ?', response: r, expected: 216, correct: right, mc: mult ? MC.baseTimesExp : undefined });
      fbHost.replaceChildren(fb(right, right ? 't.k-ok' : mult ? 't.k-mult' : sq36 ? 't.k-sq' : 't.k-other'));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        ts('t.ld1', 0, 0.4); ts('t.L1:dim', 1, 0.5);
        ts('t.L2', 1, 1.1); await wait(1.1); if (!alive()) return;
        void bump('t.pV', alive); await wait(1.2); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(line_('t.check'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askWrite(): void {
    const chips = [{ t: '∛', r: 'cb' }, { t: '√', r: 'sq' }, { t: '216', r: 'v' }, { t: '6', r: 'e' }, { t: '72', r: 'd' }];
    const slots: (number | null)[] = [null, null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips roots' });
    const fbHost = h('div');
    const draw = () => {
      eq.replaceChildren(...slots.map((v, i) => {
        const ch = v === null ? null : chips[v]!;
        const s = h('button', { class: 'slot' + (ch ? ' filled' + (ch.r === 'v' ? ' a' : '') : ''), 'aria-label': ['root sign', 'number under the root', 'value'][i]! });
        s.innerHTML = ch ? ch.t : '?';
        s.addEventListener('click', () => { slots[i] = null; draw(); });
        return s;
      }));
      eq.insertBefore(html('span', '', '='), eq.children[2]!);
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch.t, () => { const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, y, z] = slots.map(i => (i === null ? '' : chips[i]!.r));
      const right = x === 'cb' && y === 'v' && z === 'e';
      const usedSq = x === 'sq' || y === 'sq' || z === 'sq', usedDiv = x === 'd' || y === 'd' || z === 'd';
      const mc = right ? undefined : usedSq ? MC.ignoreIndex : usedDiv ? MC.divIndex : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.write', prompt: '? ? = ? (the edge of the 216 in³ box with a root sign)', response: [x, y, z], expected: ['cb', 'v', 'e'], correct: right, mc });
      if (right) {
        fbHost.replaceChildren(fb(true, 't.w-ok'));
        seq(async alive => {
          ts('t.L2:dim', 1, 0.5); ts('t.q', 0, 0.5);
          ts('t.hero', 1, 1.4, 0.3); await wait(1.2); if (!alive()) return;
          void bump('t.pV', alive); await wait(0.5); if (!alive()) return;
          ts('t.ldS', 1, 0.9); void bump('t.pE', alive); await wait(2.6); if (!alive()) return;
          step = 4; drawPlan(); askBound();
        });
        return;
      }
      fbHost.replaceChildren(fb(false, usedSq ? 't.w-sq' : usedDiv ? 't.w-div' : 't.w-other'));
      setTimeout(() => { slots[0] = slots[1] = slots[2] = null; draw(); }, 1200);
    }
    draw();
    work.replaceChildren(line_('t.write'), eq, chipBox, fbHost);
  }
  function askBound(): void {
    // the 6-inch cube becomes the outer ghost of a 200 in³ cube
    seq(async alive => {
      ts('t.ldS', 0, 0.4); ts('t.hero:dim', 1, 0.5);
      ts('t.swap', 1, 1.0); jump(['t.g.layers', 't.g.vol']); await wait(0.6); if (!alive()) return;
      ts('t.g.ghosts', 1, 1.0); ts('t.B0', 1, 0.9, 0.5);
    });
    const fbHost = h('div');
    const inp = pairInput('', '< ∛200 <', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.x === 5 && r.y === 6, sqB = r.x === 14 && r.y === 15, cubes = r.x === 125 && r.y === 216;
      ctx.store.log({ part: 'turn', item: 'turn.bound', prompt: 'A cube-shaped box holds 200 in³: ? < cbrt(200) < ?', response: r, expected: [5, 6], correct: right, mc: sqB ? MC.ignoreIndex : cubes ? MC.squaresBounds : undefined });
      fbHost.replaceChildren(fb(right, right ? 't.b-ok' : sqB ? 't.b-sq' : cubes ? 't.b-cubes' : 't.b-other'));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        ts('t.B1', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.B2', 1, 1.2); await wait(3.0); if (!alive()) return;
        fbHost.append(callback());
      });
    }
    work.replaceChildren(line_('t.bound'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 1]!;
    const id = commit().pick === null ? 't.cb-right' : p.cb;
    setTimeout(() => sayOnly(id), 4200);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Jordan's "√49 = ±7" =====
function partProve(): void {
  tr.reset('p.');
  const s = SquareTiles({ area: 49, tiles: true, areaTex: '49', sideTex: '7' }, frame(MF.x, MF.y - 10, MF.w, 660));
  const rl = RootRuler({ lo: -8, hi: 8, minor: 1, labels: [-8, 0, 8], marks: [{ v: -7, tex: '-7', col: 'link' }, { v: 7, tex: '7', col: 'link' }], arcs: true, at: 0.62 }, frame(MF.x, 690, MF.w, 300));
  const J = line('p.J', '\\text{Jordan: }\\ \\sqrt{49} = \\cssId{w}{\\pm 7}', YT, 84);
  const C1 = line('p.C1', '\\cssId{s}{7}^2 = 49', YT + 170, 76, { s: { col: 'link' } });
  const C1b = line('p.C1b', '(\\cssId{n}{-7})^2 = 49', YT + 270, 76, { n: { col: 'link' } });
  const C2 = line('p.C2', '\\sqrt{\\cssId{v}{49}} = \\cssId{s}{7}', YT + 400, 84, T);
  const C3 = line('p.C3', 'x = \\pm\\sqrt{49} = \\cssId{s}{\\pm 7}', YT + 600, 84, T);
  const leads: Lead[] = [
    { key: 'p.ld2', from: () => partOf(C2, 's'), to: () => s.where.sideLabel, col: 'link' },
    { key: 'p.ld3', from: () => partOf(C3, 's'), to: () => rl.where.mark(1), col: 'link' },
  ];
  setScene({
    table: 1000,
    model: c => {
      s.draw(c, prog<SquareStep>('p.s.'), sqFocus('p.s.'));
      rl.draw(c, prog<RulerStep>('p.r.'), { marks: [tr.k('p.r.m0'), tr.k('p.r.m1')] });
    },
    lines: [J, C1, C1b, C2, C3], leads,
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  ts('p.s.slab', 1, 0.9); ts('p.s.tiles', 1, 1.0, 0.5); ts('p.s.area', 1, 0.6, 1.0);
  ts('p.r.axis', 1, 1.0, 1.2); ts('p.J', 1, 1.0, 2.0);

  const CHIPS = [
    { t: '7 × 7 = 49 and (−7) × (−7) = 49.', fits: 0 },
    { t: '√ names the root that is 0 or more: the side of a square of area 49.', fits: 1 },
    { t: 'the ± comes from solving the equation, not from the √ sign.', fits: 2 },
    { t: 'A square root always has two values, a plus one and a minus one.', fits: -1, mc: MC.plusMinus, id: 'p.x-pm' },
    { t: 'A negative number squared is negative, so −7 is no solution.', fits: -1, mc: MC.onlyPos, id: 'p.x-pos' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 1, 4, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      if (n < 3) sayOnly(CLAIMS[n]!);
      seq(async alive => {
        if (n === 1) {
          ts('p.r.m1', 1, 0.6); ts('p.r.m0', 1, 0.6, 0.4); ts('p.r.arcs', 1, 1.2, 0.6); await wait(1.4); if (!alive()) return;
          ts('p.C1', 1, 1.0); ts('p.C1b', 1, 1.0, 0.6);
        }
        if (n === 2) {
          ts('p.C1:dim', 1, 0.5); ts('p.C1b:dim', 1, 0.5);
          ts('p.s.count', 1, 1.2); await wait(1.2); if (!alive()) return;
          ts('p.s.side', 1, 0.8); ts('p.C2', 1, 1.0, 0.4); await wait(1.4); if (!alive()) return;
          ts('p.ld2', 1, 0.8); void bump('p.s.pA', alive);
        }
        if (n === 3) {
          ts('p.ld2', 0, 0.4); ts('p.C2:dim', 1, 0.5);
          ts('p.C3', 1, 1.1); await wait(1.2); if (!alive()) return;
          ts('p.ld3', 1, 0.8); ts('p.r.arcs', 0, 0.3); ts('p.r.arcs', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
          ts('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: √49 = ±7, because (−7)² = 49 too. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.plusMinus : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(line_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 4200);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), line_('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it),
  });
}
const unitTex = (u: string) => (u ? `\\text{ ${u}}` : '');
const fmtN = (v: number) => String(Number(v.toFixed(6)));
/** a line that links to a label sits at the label's height, so its leader runs straight across (never over the model) */
const heroY = (target: { cy: number }) => Math.max(YT + 230, Math.min(BOARD.y1 - 70, target.cy));
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
/** draw a practice item: a square of tiles, a cube of unit cubes, a root ruler, or the bare notation */
function showItem(item: Item): Solve {
  tr.reset('x.');
  const pic = item.picture as Pic | undefined;
  const TL = line('x.T', item.board, YT, 84);
  const scene = (model: ((c: Parameters<NonNullable<Parameters<typeof setScene>[0]['model']>>[0]) => void) | undefined, table: number, lines: Line[], leads: Lead[] = []) => setScene({ table, model, lines, leads });
  if (pic?.kind === 'sq') {
    const whole = Math.round(Math.sqrt(pic.area)) ** 2 === pic.area && !pic.cut;
    const side = pic.cut ? `\\tfrac{${pic.cut.a}}{${pic.cut.b}}` : whole ? String(Math.sqrt(pic.area)) : `\\sqrt{${pic.area}}`;
    const mk = tryBlock(() => SquareTiles({
      area: pic.area, cut: pic.cut, tiles: pic.tiles !== 'none' && (whole || !!pic.cut),
      areaTex: pic.areaTex ?? `${fmtN(pic.area)}${pic.unit ? `${unitTex(pic.unit)}^2` : ''}`,
      sideTex: pic.side === 'ask' ? '?' : pic.sideTex ?? `${side}${unitTex(pic.unit)}`,
      unitTex: pic.cut ? `1${unitTex(pic.unit)}` : undefined,
    }, MF));
    if (!mk.ok) console.warn(`picture fell back to notation: ${mk.error}`);
    if (mk.ok) {
      const m = mk.value as SquareBlock;
      const radTex = pic.cut ? `\\tfrac{${pic.cut.a ** 2}}{${pic.cut.b ** 2}}` : fmtN(pic.area);
      const hero = whole || pic.cut ? line('x.hero', `\\sqrt{\\cssId{v}{${radTex}}} = \\cssId{s}{${side}}`, heroY(m.where.sideLabel), 84, T) : null;
      scene(c => m.draw(c, prog<SquareStep>('x.'), sqFocus('x.')), m.where.sq.y1 + 40, hero ? [TL, hero] : [TL], hero ? [{ key: 'x.ldS', from: () => partOf(hero, 's'), to: () => m.where.sideLabel, col: 'link' }] : []);
      ts('x.slab', 1, 0.8); ts('x.area', 1, 0.6, 0.4); ts('x.T', 1, 0.8, 0.5);
      if (pic.tiles === 'show') ts('x.tiles', 1, 1.0, 0.6);
      if (pic.side !== 'solve') ts('x.side', 1, 0.7, 1.0);
      return {
        solve: async alive => {
          ts('x.T:dim', 1, 0.5);
          if (pic.tiles === 'solve') { ts('x.tiles', 1, 1.0); await wait(1.0); if (!alive()) return; }
          if (whole || pic.cut) { ts('x.count', 1, 1.2); await wait(1.2); if (!alive()) return; }
          ts('x.side', 1, 0.7); await wait(0.6); if (!alive()) return;
          if (hero) { ts('x.hero', 1, 1.0); void bump('x.pA', alive); await wait(1.0); if (!alive()) return; ts('x.ldS', 1, 0.8); }
        },
      };
    }
  }
  if (pic?.kind === 'cube') {
    const k = Math.round(Math.cbrt(pic.vol)), perfect = k ** 3 === pic.vol;
    const e = perfect ? k : Math.cbrt(pic.vol);
    const mk = tryBlock(() => IsoBox({
      nx: e, ny: e, nz: e, ghosts: pic.ghosts,
      volTex: pic.volTex ?? `${fmtN(pic.vol)}${pic.unit ? `${unitTex(pic.unit)}^3` : ''}`,
      edgeTex: pic.ghosts ? null : pic.edge === 'ask' ? '?' : pic.edgeTex ?? (perfect ? `${k}${unitTex(pic.unit)}` : `\\sqrt[3]{${pic.vol}}`),
    }, MF));
    if (!mk.ok) console.warn(`picture fell back to notation: ${mk.error}`);
    if (mk.ok) {
      const m = mk.value as BoxBlock;
      const hero = perfect ? line('x.hero', `\\sqrt[3]{\\cssId{v}{${pic.vol}}} = \\cssId{s}{${k}}`, heroY(m.where.edgeLabel), 84, T)
        : pic.ghosts ? line('x.hero', `${m.maths.lo} < \\sqrt[3]{\\cssId{v}{${pic.vol}}} < ${m.maths.hi}`, YT + 230, 84, T) : null;
      scene(c => m.draw(c, prog<BoxStep>('x.'), cubeFocus('x.')), m.where.floor, hero ? [TL, hero] : [TL], hero && perfect ? [{ key: 'x.ldS', from: () => partOf(hero, 's'), to: () => m.where.edgeLabel, col: 'link' }] : []);
      ts('x.vol', 1, 0.6, 0.4); ts('x.T', 1, 0.8, 0.5);
      if (pic.closed) ts('x.box', 1, 0.8);
      else ts('x.layers', 1, 1.2);
      if (pic.edge !== 'solve' && !pic.ghosts) ts('x.edge', 1, 0.7, 1.2);
      return {
        solve: async alive => {
          ts('x.T:dim', 1, 0.5);
          if (pic.closed) { ts('x.open', 1, 0.7); await wait(0.6); if (!alive()) return; ts('x.layers', 1, 1.6); await wait(1.6); if (!alive()) return; }
          if (perfect) { ts('x.count', 1, 1.1); await wait(1.1); if (!alive()) return; }
          if (pic.ghosts) { ts('x.ghosts', 1, 1.0); await wait(1.0); if (!alive()) return; }
          else { ts('x.edge', 1, 0.7); await wait(0.6); if (!alive()) return; }
          if (hero) { ts('x.hero', 1, 1.0); void bump('x.pV', alive); await wait(1.0); if (!alive()) return; ts('x.ldS', 1, 0.8); }
        },
      };
    }
  }
  if (pic?.kind === 'both') {
    const sl = slab64(), cu = cube64();
    const H1 = line('x.h1', '\\sqrt{\\cssId{v}{64}} = \\cssId{t}{8}', YT + 230, 84, T);
    const H2 = line('x.h2', '\\sqrt[3]{\\cssId{v}{64}} = \\cssId{s}{4}', heroY(cu.where.edgeLabel), 84, T);
    scene(c => { drawBox(c, sl, 'x.f.'); drawBox(c, cu, 'x.c.'); }, Math.min(sl.where.floor, cu.where.floor), [TL, H1, H2],
      [{ key: 'x.ldS', from: () => partOf(H2, 's'), to: () => cu.where.edgeLabel, col: 'link' }]);
    jump(['x.f.layers', 'x.f.vol', 'x.c.layers', 'x.c.vol']); ts('x.T', 1, 0.8, 0.3);
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        ts('x.f.count', 1, 1.4); await wait(1.2); if (!alive()) return; ts('x.f.edge', 1, 0.7); await wait(0.6); if (!alive()) return;
        ts('x.h1', 1, 0.9); void bump('x.f.pE', alive); await wait(1.0); if (!alive()) return;
        ts('x.c.count', 1, 1.2); await wait(1.0); if (!alive()) return; ts('x.c.edge', 1, 0.7); await wait(0.6); if (!alive()) return;
        ts('x.h2', 1, 0.9); await wait(0.8); if (!alive()) return; ts('x.ldS', 1, 0.8);
      },
    };
  }
  if (pic?.kind === 'line') {
    const mk = tryBlock(() => RootRuler({ lo: pic.lo, hi: pic.hi, minor: pic.minor, labels: pic.labels, powers: pic.powers ?? null, marks: pic.marks, band: pic.band ?? null, mid: pic.mid ?? null, arcs: pic.arcs, at: 0.56 }, MF));
    if (!mk.ok) console.warn(`picture fell back to notation: ${mk.error}`);
    if (mk.ok) {
      const r = mk.value as RulerBlock;
      const nm = pic.marks.length;
      const SL = (pic.solveTex ?? []).map((t, i) => line(`x.s${i}`, t, YT + 250 + i * 140, 80));
      scene(c => r.draw(c, prog<RulerStep>('x.'), { marks: Array.from({ length: nm }, (_, i) => tr.k(`x.m${i}`)) }), 900, [TL, ...SL]);
      ts('x.axis', 1, 0.9); ts('x.T', 1, 0.8, 0.4);
      if (pic.powers) ts('x.powers', 1, 0.8, 0.6);
      if (pic.band && !pic.bandOnSolve) ts('x.band', 1, 0.8, 0.8);
      if (pic.mid != null && !pic.midOnSolve) ts('x.mid', 1, 0.7, 1.0);
      for (let i = 0; i < Math.min(pic.solveMarks, nm); i++) ts(`x.m${i}`, 1, 0.6, 1.0 + 0.2 * i);
      return {
        solve: async alive => {
          ts('x.T:dim', 1, 0.5);
          if (pic.band && pic.bandOnSolve) { ts('x.band', 1, 0.9); await wait(0.9); if (!alive()) return; }
          if (pic.mid != null && pic.midOnSolve) { ts('x.mid', 1, 0.7); await wait(0.7); if (!alive()) return; }
          for (let i = pic.solveMarks; i < nm; i++) { ts(`x.m${i}`, 1, 0.7); await wait(0.45); if (!alive()) return; }
          if (pic.arcs) ts('x.arcs', 1, 1.1);
          for (let i = 0; i < SL.length; i++) { ts(`x.s${i}`, 1, 1.0); await wait(1.0); if (!alive()) return; }
        },
      };
    }
  }
  const big = box(300, 260, 1620, 760);
  setScene({ model: undefined, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\sqrt{64}\\sqrt[3]{64}\\pm\\square', '\\text{in}^3\\text{ft}^2', '\\text{Jordan: }', '\\xrightarrow{\\ \\text{square}\\ }', '\\overset{?}{=}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
