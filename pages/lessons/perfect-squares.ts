// perfect-squares.ts: square roots of perfect squares (grade 8, 8.EE.A.2 / 8.NS.A.2), on the shared lesson runtime.
//   1 The question   a square patio of 64 sq ft: how long is a side? 3 cards (8 ft, 32 ft = half, 16 ft = area as
//                    perimeter) + how sure
//   2 Worked example Tile it -> Count a side -> Check by squaring -> Write it as a root, on the tile-square model; each
//                    symbol is written beside, and linked by colour, a leader or a label pulse to, what it names;
//                    one "why is the side 8 feet?" with 3 reasons
//   3 Your turn      144 sq ft, faded from the end: the tiles are laid, the kid counts the side, checks by squaring and
//                    writes the root from chips; the mind-change callback to part 1
//   4 Prove it       Sam: "a square root is the same as dividing by 2" (true at 4); a because-chain from reason chips,
//                    with 16 as the counterexample (a side of 8 would need 64 tiles)
//   5 Practice       all 13 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/perfect-squares/script.ts = pages/lessons/perfect-squares/voice/lines.json.
// Every answer is logged with its misconception id (runtime/store.ts).
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Canvas } from '../../src/core/draw';
import { BOARD, MF, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { TileSquare, type TileBlock, type TileFocus } from '../../src/lesson/topics/perfect-squares/TileSquare';
import { RootLine } from '../../src/lesson/topics/perfect-squares/RootLine';
import { FAMILY_NAMES, GENS, MC, rad, type SqItem } from '../../src/lesson/topics/perfect-squares/items';
import { PLAN } from '../../src/lesson/topics/perfect-squares/plan';
import { LINES } from '../../src/lesson/topics/perfect-squares/script';

const SLUG = 'perfect-squares';
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

// ---------- the tile-square scene: model(s) on the left, the board on the right ----------
interface Model { pre: string; m: TileBlock; alpha?: () => number; focus?: () => TileFocus }
interface TileScene { models: Model[]; lines: Line[]; leads: Lead[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
const pulses = (pre: string): TileFocus => ({ area: tr.k(pre + 'pA'), side: tr.k(pre + 'pS'), rows: tr.k(pre + 'pR'), ghost: tr.k(pre + 'pG') });
function setTiles(S: TileScene): void {
  setScene({
    table: 1080,
    model: c => {
      for (const x of S.models) {
        const a = x.alpha ? x.alpha() : 1;
        if (a <= 0.001) continue;
        c.g.save(); c.g.globalAlpha *= a;
        x.m.draw(c, progressOf(s => tr.k(x.pre + s)), { ...pulses(x.pre), ...x.focus?.() });
        c.g.restore();
      }
    },
    lines: S.lines, leads: S.leads, extra: S.extra, boardBox: S.boardBox,
  });
}
/** board heights tied to the picture: the side line beside the side label, the area line beside the area label */
const yTop = (m: TileBlock) => Math.max(BOARD.y0 + 80, m.where.sideLabel.cy);
const yArea = (m: TileBlock) => Math.min(BOARD.y1 - 64, m.where.areaLabel.cy);
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
/** colour tags: k = the side (lime), n = the area (amber) */
const TAGS = { k: { col: 'link' as const }, k2: { col: 'link' as const }, n: { col: 'first' as const } };

const PATIO = { n: 64, words: { area: '64 sq ft', side: '8 ft', ask: 'side = ?', rows: '8 rows' } };
const CARDS = [
  { t: '32', id: MC.halving, cb: 't.cb-half' },
  { t: '8', id: '', cb: 't.cb-right' },
  { t: '16', id: MC.perimeter, cb: 't.cb-perim' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = TileSquare(PATIO, MF, th);
  const Q = line('q.Q', '\\text{side} = \\,?', yTop(m), 84);
  const L0 = line('q.L0', '\\text{area} = \\cssId{n}{64}\\ \\text{ft}^2', yArea(m), 76, TAGS);
  setTiles({ models: [{ pre: 'q.', m }], lines: [Q, L0], leads: [] });
  tr.set('q.slab', 1, 1.0); tr.set('q.area', 1, 0.7, 0.7); tr.set('q.side', 1, 0.7, 1.2); tr.set('q.L0', 1, 0.9, 1.5); tr.set('q.Q', 1, 0.8, 2.1);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A square patio has an area of 64 sq ft: how long is one side?', response: `${p.t} ft`, expected: '8 ft', correct: p.t === '8', mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>feet</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A square patio'), P('q.intro'), P('q.ask'), cards, html('div', 'label', LINES['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
  sayAll('q.intro', 'q.ask', 'q.sure');
}

// ===== 2. Worked example: 64 sq ft =====
function partExample(): void {
  tr.reset('e.');
  const m = TileSquare(PATIO, MF, th);
  const Q = line('e.Q', '\\text{side} = \\,?', yTop(m), 84);
  const L1 = line('e.L1', '\\text{side} = \\cssId{k}{8}\\ \\text{ft}', yTop(m), 84, TAGS);
  const L2 = line('e.L2', '\\cssId{k}{8} \\times \\cssId{k2}{8} = \\cssId{n}{64}', 420, 84, TAGS);
  const H = line('e.hero', '\\sqrt{\\cssId{n}{64}} = \\cssId{k}{8}', 650, 120, TAGS);
  const L0 = line('e.L0', '\\text{area} = \\cssId{n}{64}\\ \\text{ft}^2', yArea(m), 76, TAGS);
  const leads: Lead[] = [{ key: 'e.ld1', from: () => partOf(L1, 'k'), to: () => m.where.sideLabel, col: 'link' }];
  setTiles({ models: [{ pre: 'e.', m }], lines: [Q, L1, L2, H, L0], leads });
  // the board starts where part 1 left it
  jump('e.', ['slab', 'area', 'side', 'Q', 'L0']);

  let step = 0;
  const STEPS = [
    { t: 'Tile the square', why: 'Each tile is 1 ft by 1 ft: one square foot.', act: 'Tile it' },
    { t: 'Count along one side', why: 'The tiles on one edge give the side length.', act: 'Count' },
    { t: 'Check by squaring', why: 'Side × side must give the area back.', act: 'Check' },
    { t: 'Write it as a square root', why: 'The root of the area is the side.', act: 'Write it' },
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
        tr.set('e.tiles', 1, 2.2); await wait(2.4);
      } else if (i === 1) {
        tr.set('e.count', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.reveal', 1, 0.6); tr.set('e.Q', 0, 0.5); tr.set('e.L1', 1, 0.9, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('e.ld1', 1, 0.8); await wait(0.8);
      } else if (i === 2) {
        tr.set('e.ld1', 0, 0.4); tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.rows', 1, 2.6); await wait(2.5); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(0.5); if (!alive()) return;
        void bump('e.pR', alive); await wait(0.6); if (!alive()) return;
        void bump('e.pA', alive); await wait(1.0);
      } else {
        tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.hero', 1, 1.4); await wait(0.5); if (!alive()) return;
        void bump('e.pA', alive); await wait(0.7); if (!alive()) return;
        void bump('e.pS', alive); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(P(`e.s${i + 1}`));
      if (i === 3) selfExplain(); else sayAll(`e.s${i + 1}`);
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Because 8 rows of 8 tiles make 64: 8 × 8 = 64.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Because a square root means halving: 64 → 32 → 16 → 8.', ok: false, mc: MC.halving, id: 'e.w-half' },
      { t: 'Because the 4 sides add up to 64.', ok: false, mc: MC.perimeter, id: 'e.w-perim' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbv(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the side of a 64 sq ft square patio 8 feet?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', LINES['e.why']!.html), bx, fbHost);
    sayAll('e.s4', 'e.why');
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), P('e.intro', 'dim'), plan, sayBox, after);
  sayAll('e.intro');
}

// ===== 3. Your turn: 144 sq ft (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = TileSquare({ n: 144, words: { area: '144 sq ft', side: '12 ft', ask: 'side = ?', rows: '12 rows' } }, MF, th);
  const Q = line('t.Q', '\\text{side} = \\,?', yTop(m), 84);
  const L1 = line('t.L1', '\\text{side} = \\cssId{k}{12}\\ \\text{ft}', yTop(m), 84, TAGS);
  const L2 = line('t.L2', '\\cssId{k}{12} \\times \\cssId{k2}{12} = \\cssId{n}{144}', 420, 84, TAGS);
  const H = line('t.hero', '\\sqrt{\\cssId{n}{144}} = \\cssId{k}{12}', 650, 120, TAGS);
  const L0 = line('t.L0', '\\text{area} = \\cssId{n}{144}\\ \\text{ft}^2', yArea(m), 76, TAGS);
  const leads: Lead[] = [{ key: 't.ld1', from: () => partOf(L1, 'k'), to: () => m.where.sideLabel, col: 'link' }];
  setTiles({ models: [{ pre: 't.', m }], lines: [Q, L1, L2, H, L0], leads });
  tr.set('t.slab', 1, 1.0); tr.set('t.area', 1, 0.7, 0.6); tr.set('t.side', 1, 0.7, 1.0); tr.set('t.L0', 1, 0.9, 1.2); tr.set('t.Q', 1, 0.8, 1.6);

  let step = 0;
  const STEPS = [
    { t: 'Tile the square', why: 'Done for you.' },
    { t: 'Count along one side', why: 'Your step.' },
    { t: 'Check by squaring', why: 'Your step.' },
    { t: 'Write it as a square root', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A bigger patio'), P('t.intro'), plan, work);
  sayAll('t.intro');
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.tiles', 1, 2.4); await wait(2.6); if (!alive()) return;
    step = 1; drawPlan(); askCount();
  });

  function askCount(): void {
    const fbHost = h('div');
    const inp = numInput('ft', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbv(false, 't.fill')); return; }
      const v = r.v, right = v === 12;
      const id = right ? 't.c-ok' : v === 72 ? 't.c-half' : v === 36 ? 't.c-perim' : 't.c-other';
      ctx.store.log({ part: 'turn', subgoal: 'side-from-area', item: 'turn.count', prompt: 'A square patio of 144 sq ft, tiled: how long is one side?', response: v, expected: 12, correct: right, mc: v === 72 ? MC.halving : v === 36 ? MC.perimeter : undefined });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.count', 1, 2.0); await wait(2.0); if (!alive()) return;
        tr.set('t.reveal', 1, 0.6); tr.set('t.Q', 0, 0.5); tr.set('t.L1', 1, 0.9, 0.3); tr.set('t.ld1', 1, 0.8, 1.2); await wait(2.4); if (!alive()) return;
        step = 2; drawPlan(); askCheck();
      });
    }
    work.replaceChildren(P('t.count'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayNext('t.count');
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div');
    const inp = numInput('tiles', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbv(false, 't.fill')); return; }
      const v = r.v, right = v === 144;
      ctx.store.log({ part: 'turn', subgoal: 'evaluate-roots-to-225', item: 'turn.check', prompt: '12 rows of 12 tiles: how many tiles?', response: v, expected: 144, correct: right, mc: v === 24 ? MC.baseTimesExp : undefined });
      fbHost.replaceChildren(fbv(right, right ? 't.k-ok' : v === 24 ? 't.k-double' : 't.k-other'));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ld1', 0, 0.4); tr.set('t.L1:dim', 1, 0.6);
        tr.set('t.rows', 1, 2.8); await wait(2.7); if (!alive()) return;
        tr.set('t.L2', 1, 1.0); await wait(0.5); if (!alive()) return;
        void bump('t.pR', alive); await wait(0.6); if (!alive()) return;
        void bump('t.pA', alive); await wait(1.2); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(P('t.check'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayAll('t.check');
    inp.focus();
  }
  function askWrite(): void {
    const chips = ['144', '12', '72'];
    const slots: (number | null)[] = [null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips' });
    const fbHost = h('div');
    let done = false;
    const draw = () => {
      const slot = (i: number) => {
        const v = slots[i]; const t = v === null || v === undefined ? null : chips[v]!;
        const s = h('button', { class: 'slot' + (i === 0 ? ' rad-slot' : '') + (t ? ' filled ' + (t === '144' ? 'n' : t === '12' ? 'k' : '') : ''), 'aria-label': i === 0 ? 'under the root sign' : 'the value' }, t ?? '?');
        s.addEventListener('click', () => { if (done) return; slots[i] = null; draw(); });
        return s;
      };
      eq.replaceChildren(h('span', { class: 'sign' }, '√'), slot(0), h('span', {}, '='), slot(1));
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch, () => { if (done) return; const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, y] = slots.map(i => (i === null ? '' : chips[i]!));
      const right = x === '144' && y === '12';
      const swap = x === '12' && y === '144';
      const id = right ? 't.w-ok' : swap ? 't.w-swap' : 't.w-half';
      ctx.store.log({ part: 'turn', subgoal: 'radical-notation', item: 'turn.write', prompt: '√[?] = [?] for a square of 144 sq ft with sides of 12 ft', response: [x, y], expected: ['144', '12'], correct: right, mc: right ? undefined : swap ? MC.swap : MC.halving });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) { setTimeout(() => { if (!done) { slots[0] = slots[1] = null; draw(); } }, 1200); return; }
      done = true;
      seq(async alive => {
        tr.set('t.L2:dim', 1, 0.6);
        tr.set('t.hero', 1, 1.4); await wait(0.5); if (!alive()) return;
        void bump('t.pA', alive); await wait(0.7); if (!alive()) return;
        void bump('t.pS', alive); await wait(1.4); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    }
    draw();
    work.replaceChildren(P('t.write'), eq, chipBox, fbHost);
    sayAll('t.write');
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

// ===== 4. Prove it: Sam's "a square root is dividing by 2" =====
function partProve(): void {
  tr.reset('p.');
  const mA = TileSquare({ n: 4, words: { side: '2', area: '4 tiles', rows: '2 rows' } }, MF, th);
  const mB = TileSquare({ n: 16, ghost: 8, words: { side: '4', area: '16 tiles', ghost: '64 tiles' } }, MF, th);
  const y0 = BOARD.y0;
  const J = line('p.J', '\\text{Sam: }\\ \\cssId{r}{\\sqrt{N} = N \\div 2}', y0 + 100, 80);
  const C1 = line('p.C1', '\\sqrt{4} = \\cssId{k}{2} = 4 \\div 2', y0 + 290, 80, { k: { col: 'link' } });
  const C2 = line('p.C2', '\\sqrt{16} = \\cssId{k}{4}', y0 + 450, 80, { k: { col: 'link' } });
  const C2b = line('p.C2b', '16 \\div 2 = \\cssId{w}{8}', y0 + 570, 80, { w: { col: 'wrong' } });
  const C3 = line('p.C3', '\\sqrt{16} \\ne 16 \\div 2', y0 + 770, 88, undefined, 'link');
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 'k'), to: () => mA.where.sideLabel, col: 'link' },
    { key: 'p.ld2', from: () => partOf(C2b, 'w'), to: () => mB.where.ghost!, col: 'wrong' },
  ];
  setTiles({
    models: [{ pre: 'p.a.', m: mA, alpha: () => 1 - tr.k('p.swap') }, { pre: 'p.b.', m: mB, alpha: () => tr.k('p.swap') }],
    lines: [J, C1, C2, C2b, C3], leads,
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(J, 'r'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); } },
  });
  tr.set('p.a.tiles', 1, 1.0); tr.set('p.a.area', 1, 0.7, 0.6); tr.set('p.a.side', 1, 0.7, 1.0); tr.set('p.J', 1, 1.0, 1.4);

  const CHIPS = [
    { t: '2 × 2 = 4, so a square of 4 tiles has sides of 2.', fits: 0 },
    { t: '4 × 4 = 16, while a side of 8 would need 8 × 8 = 64 tiles.', fits: 1 },
    { t: 'One counterexample is enough to break an “always” rule.', fits: 2 },
    { t: 'Two different rules can never give the same answer.', fits: -1, mc: MC.differEverywhere, id: 'p.x-differ' },
    { t: 'It works for 0 and for 4, so it always works.', fits: -1, mc: MC.examplesProof, id: 'p.x-examples' },
  ];
  const CLAIMS = [
    `For 4 the two rules agree: ${rad(4)} = 2 and 4 ÷ 2 = 2,`,
    `For 16 they don’t: ${rad(16)} = 4, but 16 ÷ 2 = 8,`,
    'So Sam’s rule is not always true,',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
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
    ctx.store.log({ part: 'prove', subgoal: 'coincidence-counterexample', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbv(false, ch.id ?? 'p.x-slot')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    if (n < 3) fbHost.replaceChildren(fbv(true, `p.c${n}`));
    else { fbHost.replaceChildren(feedback(true, LINES['p.c3']!.html)); sayAll('p.c3', 'p.done'); }
    seq(async alive => {
      if (n === 1) {
        tr.set('p.a.rows', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('p.C1', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('p.ld1', 1, 0.8);
      } else if (n === 2) {
        tr.set('p.ld1', 0, 0.4); tr.set('p.C1:dim', 1, 0.6);
        tr.set('p.swap', 1, 0.8); tr.set('p.b.tiles', 1, 1.4, 0.4); tr.set('p.b.area', 1, 0.6, 1.0); tr.set('p.b.side', 1, 0.6, 1.4); await wait(2.0); if (!alive()) return;
        tr.set('p.C2', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('p.C2b', 1, 0.9); await wait(0.8); if (!alive()) return;
        tr.set('p.b.ghost', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('p.ld2', 1, 0.8); void bump('p.b.pG', alive);
      } else {
        tr.set('p.ld2', 0, 0.4); tr.set('p.C2:dim', 1, 0.6); tr.set('p.C2b:dim', 1, 0.6);
        tr.set('p.C3', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.append(feedback(true, LINES['p.done']!.html, [h('div', { class: 'row' }, btn('Practice', () => go(4), 'go'))]));
      }
    });
  }
  const proofHost = h('div');
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', subgoal: 'sqrt-vs-halving', item: 'prove.judge', prompt: 'Sam: √4 = 2 = 4 ÷ 2, so taking the square root is dividing by 2. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.examplesProof : undefined });
    const id = right ? 'p.build-right' : 'p.build-wrong';
    proofHost.replaceChildren(P(id), chain, chipBox, fbHost);
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
    show: it => showItem(it as SqItem),
  });
}
/** a line centred on x (for the wide slate under the number line) */
function cLine(key: string, src: string, cx: number, y: number, size: number, maxW: number, tags?: Line['tags'], col?: Line['col']): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x: cx - texWidth(F, s) / 2, y, size: s, tags, col };
}
type Solve = (alive: () => boolean) => Promise<void>;
/** the item's picture with its board; `ready` jumps the shown steps (a bare item turning into its picture) */
function picScene(item: SqItem, ready: boolean): { solve: Solve } | null {
  const pic = item.pic!;
  if (pic.kind === 'tiles') {
    const mk = tryBlock(() => TileSquare(pic.p, MF, th));
    if (!mk.ok) { console.warn(mk.error); return null; }
    const m = mk.value;
    const T = line('x.T', item.board, BOARD.y0 + 90, 84);
    const Ls = item.solveTex.map((s, i) => line(`x.L${i}`, s, BOARD.y0 + 270 + i * 150, 76));
    setTiles({ models: [{ pre: 'x.', m }], lines: [T, ...Ls], leads: [] });
    if (ready) { jump('x.', [...pic.show, 'T']); }
    else { tr.set('x.T', 1, 0.8, 0.4); pic.show.forEach((s, i) => tr.set('x.' + s, 1, s === 'tiles' ? 1.4 : 0.8, i * 0.5)); }
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        const n = Math.max(pic.solve.length, Ls.length);
        for (let i = 0; i < n; i++) {
          const s = pic.solve[i];
          if (s) { const d = s === 'tiles' || s === 'rows' || s === 'morph' ? 1.8 : s === 'count' ? 1.6 : 0.9; tr.set('x.' + s, 1, d); await wait(d); if (!alive()) return; }
          if (Ls[i]) { tr.set(`x.L${i}`, 1, 0.9); if (i > 0) tr.set(`x.L${i - 1}:dim`, 1, 0.5); await wait(0.9); if (!alive()) return; }
        }
        void bump('x.pA', alive); await wait(0.5); if (!alive()) return;
        void bump('x.pS', alive);
      },
    };
  }
  const mk = tryBlock(() => RootLine(pic.n, frame(100, 40, 1720, 430), th));
  if (!mk.ok) { console.warn(mk.error); return null; }
  const L = mk.value;
  const slateB = box(240, 560, 1680, 1020);
  const T = cLine('x.T', item.board, slateB.cx, slateB.y0 + 100, 84, slateB.w - 120);
  const Ls = item.solveTex.map((s, i) => cLine(`x.L${i}`, s, slateB.cx, slateB.y0 + 240 + i * 130, 76, slateB.w - 120));
  setScene({ table: 1080, model: c => L.draw(c, progressOf(s => tr.k('x.' + s))), lines: [T, ...Ls], leads: [], boardBox: slateB });
  if (ready) jump('x.', [...pic.show, 'T']);
  else { tr.set('x.T', 1, 0.8, 0.4); pic.show.forEach((s, i) => tr.set('x.' + s, 1, 1.0, i * 0.6)); }
  return {
    solve: async alive => {
      tr.set('x.T:dim', 1, 0.5);
      const n = Math.max(pic.solve.length, Ls.length);
      for (let i = 0; i < n; i++) {
        const s = pic.solve[i];
        if (s) { tr.set('x.' + s, 1, 1.0); await wait(1.0); if (!alive()) return; }
        if (Ls[i]) { tr.set(`x.L${i}`, 1, 0.9); await wait(0.9); if (!alive()) return; }
      }
    },
  };
}
function showItem(item: SqItem): { solve?: Solve } {
  tr.reset('x.');
  if (item.pic && !item.bareFirst) {
    const sc = picScene(item, false);
    if (sc) return sc;
  }
  const big = box(300, 260, 1620, 760);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  if (!item.pic) {
    // a bare item without a picture: its worked lines replace the question on the slate
    return {
      solve: async alive => {
        if (!item.solveTex.length) return;
        const Ls = item.solveTex.map((s, i) => cLine(`x.L${i}`, s, big.cx, big.y0 + 110 + i * 150, 84, big.w - 140));
        setScene({ table: 1080, lines: Ls, leads: [], boardBox: big });
        for (let i = 0; i < Ls.length; i++) { tr.set(`x.L${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; }
      },
    };
  }
  return {
    solve: async alive => {
      // the picture arrives with the worked solution
      const sc = picScene(item, false);
      if (!sc) return;
      await wait(1.6); if (!alive()) return;
      await sc.solve(alive);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{side} = \\sqrt{64}', '\\text{Sam: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
