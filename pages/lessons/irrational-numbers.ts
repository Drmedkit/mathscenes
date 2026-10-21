// irrational-numbers.ts: rational and irrational numbers (grade 8, 8.NS.A.1-2), on the shared lesson runtime.
//   1 The question   a square tile of exactly 2 sq ft; a calculator shows its side sqrt2 = 1.414213562. Square the
//                    screen's number: exactly 2 (the display is the number), just under 2 (right), no exact answer
//                    (an endless decimal has no exact value) + how sure
//   2 Worked example the decimal address of sqrt2 on the zoom line: Bracket -> Zoom to tenths -> Zoom to hundredths ->
//                    Read the address (never ends, never repeats: irrational; the screen is a cut-off, so ≈);
//                    one "why is sqrt2 between 1.4 and 1.5?" with 3 reasons
//   3 Your turn      sqrt10, faded from the end: the whole-number bracket is given; the kid zooms to tenths and to
//                    hundredths from trial squares and writes sqrt10 ≈ 3.2 from chips; the callback to part 1
//   4 Prove it       Ava: "0.272727... never ends, so it is irrational"; a because-chain (shift and subtract) on the
//                    digit tiles: 100x slides two places, the tails cancel, 99x = 27, x = 3/11: rational
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/irrational-numbers/script.ts = pages/lessons/irrational-numbers/voice/lines.json.
// Every answer is logged with its misconception id (runtime/store.ts).
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Canvas } from '../../src/core/draw';
import { BOARD, BOARD_W, MF, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ZoomLine, type ZoomBlock, type ZoomStep } from '../../src/lesson/topics/irrational-numbers/ZoomLine';
import { DigitTape, type TapeBlock } from '../../src/lesson/topics/irrational-numbers/DigitTape';
import { RealSets } from '../../src/lesson/topics/irrational-numbers/RealSets';
import { Calc } from '../../src/lesson/topics/irrational-numbers/Calc';
import { FAMILY_NAMES, GENS, MC, type IrItem, type Pic } from '../../src/lesson/topics/irrational-numbers/items';
import { PLAN } from '../../src/lesson/topics/irrational-numbers/plan';
import { LINES } from '../../src/lesson/topics/irrational-numbers/script';
import { sqrt } from '../../src/lesson/topics/irrational-numbers/realMaths';
import { rad } from '../../src/lesson/topics/irrational-numbers/nums';

const SLUG = 'irrational-numbers';
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

/** a board line at a given height, never wider than the board (TeX shrinks to 60 px at most) */
const bl = (key: string, src: string, y: number, size = 80, tags?: Line['tags'], col?: Line['col']): Line => line(key, src, y, size, tags, col);
const TAGS = { r: { col: 'link' as const }, n: { col: 'first' as const }, w: { col: 'wrong' as const }, p: { col: 'pick' as const } };
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };

// ---------- 1. The question ----------
const CARDS = [
  { t: 'Exactly 2', id: MC.truncFull, cb: 't.cb-eq' },
  { t: 'Just under 2', id: '', cb: 't.cb-right' },
  { t: 'No exact answer', id: MC.noExact, cb: 't.cb-none' },
];
function partQuestion(): void {
  tr.reset('q.');
  const cl = Calc({ square: { area: '2', side: '\\sqrt{2}' }, keys: '\\sqrt{2}', display: '1.414213562', more: '37309' }, MF, th);
  const y0 = BOARD.y0;
  const L0 = bl('q.L0', '\\text{area} = \\cssId{n}{2}\\ \\text{ft}^2', y0 + 130, 76, TAGS);
  const L1 = bl('q.L1', '\\text{side} = \\cssId{r}{\\sqrt{2}}\\ \\text{ft}', y0 + 290, 80, TAGS);
  const L2 = bl('q.L2', '\\cssId{p}{1.414213562}^2 = \\,?', y0 + 520, 80, TAGS);
  setScene({ table: 1080, model: c => cl.draw(c, progressOf(s => tr.k('q.' + s))), lines: [L0, L1, L2], leads: [] });
  tr.set('q.square', 1, 1.0); tr.set('q.side', 1, 0.8, 0.6); tr.set('q.L0', 1, 0.9, 0.8); tr.set('q.L1', 1, 0.9, 1.3);
  tr.set('q.calc', 1, 1.0, 1.6); tr.set('q.display', 1, 1.2, 2.4); tr.set('q.L2', 1, 1.0, 3.2);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', subgoal: 'display-not-proof', item: 'question.commit', prompt: 'A calculator shows √2 = 1.414213562. What is 1.414213562 × 1.414213562?', response: p.t, expected: 'Just under 2', correct: p.id === '', mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', { class: 'wordy' }, cd.t); b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A tile of 2 square feet'), P('q.intro'), P('q.ask'), cards, html('div', 'label', LINES['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
  sayAll('q.intro', 'q.ask', 'q.sure');
}

// ---------- the zoom-line scene ----------
interface ZoomScene { pre: string; z: ZoomBlock; lines: Line[]; leads: Lead[]; extra?: (c: Canvas) => void }
function setZoom(S: ZoomScene): void {
  const pre = S.pre;
  setScene({
    table: 1080,
    model: c => S.z.draw(c, progressOf(s => tr.k(pre + s)), { band: i => tr.k(`${pre}pB${i}`), sq: i => tr.k(`${pre}pS${i}`), name: tr.k(`${pre}pN`) }),
    lines: S.lines, leads: S.leads, extra: S.extra,
  });
}
/** the board line of zoom level i sits at the height of that level (where.axis(i).cy) */
const levelY = (z: ZoomBlock, i: number) => Math.max(BOARD.y0 + 70, Math.min(BOARD.y1 - 60, z.where.axis(i).cy));

// ---------- 2. Worked example: the decimal address of sqrt 2 ----------
function partExample(): void {
  tr.reset('e.');
  const z = ZoomLine({ x: sqrt(2), name: '\\sqrt{2}', levels: 3, squares: true }, MF, th);
  const L = [
    bl('e.L0', '1 < \\cssId{r}{\\sqrt{2}} < 2', levelY(z, 0), 80, TAGS),
    bl('e.L1', '1.4 < \\cssId{r}{\\sqrt{2}} < 1.5', levelY(z, 1), 80, TAGS),
    bl('e.L2', '1.41 < \\cssId{r}{\\sqrt{2}} < 1.42', levelY(z, 2), 80, TAGS),
  ];
  // the reading of the address: the digits on top, the screen's value (≈) at the bottom
  const H = bl('e.hero', '\\cssId{r}{\\sqrt{2}} = 1.41421356{\\ldots}', BOARD.y0 + 62, 72, TAGS);
  const A2 = bl('e.calc', '\\sqrt{2} \\approx \\cssId{p}{1.414213562}', BOARD.y1 - 62, 72, TAGS);
  // no leaders here: each line sits at the height of its zoom level, and its band lights up as it is written
  setZoom({ pre: 'e.', z, lines: [...L, H, A2], leads: [] });
  tr.set('e.axis', 1, 1.2);

  let step = 0;
  const STEPS = [
    { t: 'Bracket it', why: 'Square whole numbers until you pass 2.', act: 'Bracket' },
    { t: 'Zoom to tenths', why: 'Cut that piece into ten; square the tenths.', act: 'Zoom' },
    { t: 'Zoom to hundredths', why: 'Cut again; square the hundredths.', act: 'Zoom again' },
    { t: 'Read the address', why: 'What the zooming tells you.', act: 'Read it' },
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
        tr.set('e.sq0', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.band0', 1, 0.9); tr.set('e.name', 1, 0.9, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('e.L0', 1, 1.0); await wait(0.9); if (!alive()) return;
        void bump('e.pN', alive); void bump('e.pB0', alive); await wait(0.9);
      } else if (i < 3) {
        tr.set(`e.L${i - 1}:dim`, 1, 0.6);
        tr.set(`e.zoom${i}`, 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set(`e.sq${i}`, 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set(`e.band${i}`, 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set(`e.L${i}`, 1, 1.0); void bump(`e.pB${i}`, alive); await wait(1.0);
      } else {
        tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.dot', 1, 1.0); await wait(0.8); if (!alive()) return;
        tr.set('e.hero', 1, 1.4); for (const k of [0, 1, 2]) void bump(`e.pB${k}`, alive); await wait(1.6); if (!alive()) return;
        tr.set('e.calc', 1, 1.2); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(P(`e.s${i + 1}`), ...(i === 3 ? [P('e.calc')] : []));
      if (i === 3) selfExplain(); else sayAll(`e.s${i + 1}`);
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '1.4² = 1.96 is under 2, and 1.5² = 2.25 is over 2.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: '2 is a third of the way from 1 to 4, so √2 is a third of the way from 1 to 2.', ok: false, mc: MC.interp, id: 'e.w-interp' },
      { t: '1.96 rounds to 2, so √2 is 1.4.', ok: false, mc: MC.roundedExact, id: 'e.w-round' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbv(o.ok, o.id));
      ctx.store.log({ part: 'example', subgoal: 'refine-bounds', item: 'example.why', prompt: 'Why is √2 between 1.4 and 1.5?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', LINES['e.why']!.html), bx, fbHost);
    sayAll('e.s4', 'e.calc', 'e.why');
  }
  drawPlan();
  setPanel(html('h2', '', `Zoom in on ${rad(2)}`), P('e.intro', 'dim'), plan, sayBox, after);
  sayAll('e.intro');
}

// ---------- 3. Your turn: sqrt 10 (faded from the end) ----------
function partTurn(): void {
  tr.reset('t.');
  const z = ZoomLine({ x: sqrt(10), name: '\\sqrt{10}', levels: 3, squares: true }, MF, th);
  const L = [
    bl('t.L0', '3 < \\cssId{r}{\\sqrt{10}} < 4', levelY(z, 0), 80, TAGS),
    bl('t.L1', '3.1 < \\cssId{r}{\\sqrt{10}} < 3.2', levelY(z, 1), 80, TAGS),
    bl('t.L2', '3.16 < \\cssId{r}{\\sqrt{10}} < 3.17', levelY(z, 2), 80, TAGS),
  ];
  const H = bl('t.hero', '\\cssId{r}{\\sqrt{10}} \\approx 3.2', BOARD.y1 - 66, 88, TAGS);
  setZoom({ pre: 't.', z, lines: [...L, H], leads: [] });
  tr.set('t.axis', 1, 1.0); tr.set('t.sq0', 1, 0.9, 0.8); tr.set('t.band0', 1, 0.9, 1.4); tr.set('t.name', 1, 0.9, 1.6); tr.set('t.L0', 1, 1.0, 2.0);

  let step = 1;
  const STEPS = [
    { t: 'Bracket it', why: 'Done for you: 9 < 10 < 16.' },
    { t: 'Zoom to tenths', why: 'Your step.' },
    { t: 'Zoom to hundredths', why: 'Your step.' },
    { t: 'Round and write it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(html('h2', '', `Now ${rad(10)}`), P('t.intro'), plan, work);
  sayAll('t.intro');
  seq(async alive => { await wait(2.8); if (!alive()) return; askBounds(1); });

  /** the kid zooms one place further: tenths (lvl 1) or hundredths (lvl 2) */
  function askBounds(lvl: 1 | 2): void {
    const fbHost = h('div');
    const right: [number, number] = lvl === 1 ? [3.1, 3.2] : [3.16, 3.17];
    const inp = pairInput('', `&lt; ${rad(10)} &lt;`, () => check());
    const ok = btn('Check', () => check(), 'go');
    const eq = (a: number, b: number) => Math.abs(a - b) < 1e-9;
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fbv(false, 't.fill')); return; }
      const good = eq(r.x, right[0]) && eq(r.y, right[1]);
      let id: string, mc: string | undefined;
      if (lvl === 1) {
        if (good) id = 't.a-ok';
        else if (eq(r.x, 3.2) && eq(r.y, 3.3)) { id = 't.a-close'; mc = MC.closeTrial; }
        else if (eq(r.x, 9.61) || eq(r.y, 10.24)) { id = 't.a-squares'; mc = MC.squaresAsBounds; }
        else id = 't.a-other';
      } else {
        if (good) id = 't.b-ok';
        else if (eq(r.x, 9.9856) || eq(r.y, 10.0489)) { id = 't.a-squares'; mc = MC.squaresAsBounds; }
        else id = 't.b-other';
      }
      ctx.store.log({ part: 'turn', subgoal: 'refine-bounds', item: `turn.${lvl === 1 ? 'tenths' : 'hundredths'}`, prompt: lvl === 1 ? 'Between which tenths is √10? (3.1² = 9.61, 3.2² = 10.24, 3.3² = 10.89)' : 'Between which hundredths is √10? (3.15² = 9.9225, 3.16² = 9.9856, 3.17² = 10.0489)', response: [r.x, r.y], expected: right, correct: good, mc });
      fbHost.replaceChildren(fbv(good, id));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set(`t.L${lvl - 1}:dim`, 1, 0.6);
        tr.set(`t.zoom${lvl}`, 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set(`t.sq${lvl}`, 1, 0.9); tr.set(`t.band${lvl}`, 1, 0.9, 0.5); await wait(1.4); if (!alive()) return;
        tr.set(`t.L${lvl}`, 1, 1.0); void bump(`t.pB${lvl}`, alive); await wait(1.6); if (!alive()) return;
        step = lvl + 1; drawPlan();
        if (lvl === 1) askBounds(2); else askRound();
      });
    }
    work.replaceChildren(P(lvl === 1 ? 't.tenths' : 't.hund'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayNext(lvl === 1 ? 't.tenths' : 't.hund');
    inp.focus();
  }
  function askRound(): void {
    const chips = ['=', '≈', '3.1', '3.2'];
    const slots: (number | null)[] = [null, null];
    const eqBox = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips' });
    const fbHost = h('div');
    let done = false;
    const draw = () => {
      const slot = (i: number) => {
        const v = slots[i]; const t = v === null || v === undefined ? null : chips[v]!;
        const s = h('button', { class: 'slot' + (t ? ' filled' + (t === '3.2' ? ' k' : '') : ''), 'aria-label': i === 0 ? 'the sign' : 'the value' }, t ?? '?');
        s.addEventListener('click', () => { if (done) return; slots[i] = null; draw(); });
        return s;
      };
      const lead = h('span'); lead.innerHTML = rad(10);
      eqBox.replaceChildren(lead, slot(0), slot(1));
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch, () => { if (done) return; const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [x, y] = slots.map(i => (i === null ? '' : chips[i]!));
      const right = x === '≈' && y === '3.2';
      const id = right ? 't.r-ok' : x === '=' && /^3\./.test(y!) ? 't.r-eq' : x === '≈' && y === '3.1' ? 't.r-trunc' : 't.r-other';
      const mc = id === 't.r-eq' ? MC.roundedExact : id === 't.r-trunc' ? MC.truncates : undefined;
      ctx.store.log({ part: 'turn', subgoal: 'round-from-bounds', item: 'turn.round', prompt: '√10 [sign] [value], rounded to the nearest tenth (3.16 < √10 < 3.17)', response: [x, y], expected: ['≈', '3.2'], correct: right, mc });
      fbHost.replaceChildren(fbv(right, id));
      if (!right) { setTimeout(() => { if (!done) { slots[0] = slots[1] = null; draw(); } }, 1400); return; }
      done = true;
      chipBox.remove();
      seq(async alive => {
        tr.set('t.L2:dim', 1, 0.6);
        tr.set('t.mid', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.dot', 1, 0.9); tr.set('t.hero', 1, 1.3); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    }
    draw();
    work.replaceChildren(P('t.round'), eqBox, chipBox, fbHost);
    sayNext('t.round');
  }
  function callback(): HTMLElement {
    const pick = commit().pick;
    const id = pick === null ? 't.cb-skip' : CARDS[pick]!.cb;
    const c = h('div', { class: 'callback' });
    c.innerHTML = LINES[id]!.html;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    sayNext(id);
    return c;
  }
}

// ---------- 4. Prove it: Ava's "0.272727... never ends, so it is irrational" ----------
function partProve(): void {
  tr.reset('p.');
  const R = { int: 0, pre: '', rep: '27' };
  const tA = DigitTape({ r: R, s1: 2, s2: 0 }, MF, th);
  const tW = DigitTape({ r: R, s1: 1, s2: 0 }, MF, th);
  const y0 = BOARD.y0;
  const J0 = bl('p.J0', '\\text{Ava:}', y0 + 64, 60, undefined, 'dim');
  const J = bl('p.J', '\\cssId{w}{0.2727{\\ldots} \\text{ irrational}}', y0 + 150, 68);
  const yT = tA.where.top.cy, yB = tA.where.bottom.cy, yD = tA.where.diff.cy;
  const L0 = bl('p.L0', 'x = 0.272727{\\ldots}', yB, 72);
  const C1 = bl('p.C1', '\\cssId{n}{100x} = 27.2727{\\ldots}', yT, 72, TAGS);
  const C2 = bl('p.C2', '\\cssId{r}{99x = 27}', yD, 80, TAGS);
  const C3 = bl('p.C3', 'x = \\tfrac{27}{99} = \\tfrac{3}{11}', yD + 150, 80);
  const C4 = bl('p.C4', '0.\\overline{27} = \\tfrac{3}{11}', yD + 300, 84, undefined, 'link');
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 'n'), to: () => tA.where.top, col: 'first' },
    { key: 'p.ld2', from: () => partOf(C2, 'r'), to: () => tA.where.diff, col: 'link' },
  ];
  setScene({
    table: 1080,
    model: c => {
      const w = tr.k('p.wrong');
      if (w < 0.999) { c.g.save(); c.g.globalAlpha *= 1 - w; tA.draw(c, progressOf(s => tr.k('p.a.' + s)), { top: tr.k('p.pT'), diff: tr.k('p.pD') }); c.g.restore(); }
      if (w > 0.001) { c.g.save(); c.g.globalAlpha *= w; tW.draw(c, progressOf(s => (s === 'bottom' || s === 'top' || s === 'align' ? 1 : 0)), { top: 1 }); c.g.restore(); }
    },
    lines: [J0, J, L0, C1, C2, C3, C4], leads,
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); } },
  });
  tr.set('p.J0', 1, 0.6, 0.2); tr.set('p.J', 1, 1.0, 0.5); tr.set('p.a.bottom', 1, 1.2, 0.8); tr.set('p.L0', 1, 0.9, 1.6);

  const CHIPS = [
    { t: 'Multiplying by 100 moves every digit two places to the left.', fits: 0 },
    { t: 'The repeating tails sit in the same columns, so they cancel.', fits: 1 },
    { t: 'A rational number is a quotient of integers (with a nonzero denominator).', fits: 2 },
    { t: 'A decimal that never ends is irrational.', fits: -1, mc: MC.repIrr, id: 'p.x-forever' },
    { t: '10x − x works too: the tails cancel.', fits: -1, mc: MC.unaligned, id: 'p.x-ten' },
    { t: 'This only works for 0.272727…; other decimals need their own proof.', fits: -1, mc: MC.oneExample, id: 'p.x-one' },
  ];
  const CLAIMS = [
    'Let x = 0.272727… Then 100x = 27.272727…,',
    'Subtract x from 100x: 99x = 27,',
    'So x = 27/99 = 3/11, and 0.272727… is rational,',
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
    ctx.store.log({ part: 'prove', subgoal: filled === 2 ? 'define-rational' : 'convert-repeating-pure', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!, response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) {
      fbHost.replaceChildren(fbv(false, ch.id ?? 'p.x-slot'));
      if (ch.id === 'p.x-ten') seq(async alive => { tr.set('p.wrong', 1, 0.7); await wait(4.5); if (!alive()) return; tr.set('p.wrong', 0, 0.7); });
      return;
    }
    tr.set('p.wrong', 0, 0.4);
    used.add(i); filled++; drawChain();
    const n = filled;
    if (n < 3) fbHost.replaceChildren(fbv(true, `p.c${n}`));
    else { fbHost.replaceChildren(feedback(true, LINES['p.c3']!.html)); sayAll('p.c3', 'p.done'); }
    seq(async alive => {
      if (n === 1) {
        tr.set('p.a.top', 1, 2.4); await wait(2.4); if (!alive()) return;
        tr.set('p.C1', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('p.ld1', 1, 0.8); void bump('p.pT', alive);
      } else if (n === 2) {
        tr.set('p.ld1', 0, 0.4); tr.set('p.C1:dim', 1, 0.6); tr.set('p.L0:dim', 1, 0.6);
        tr.set('p.a.align', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('p.a.subtract', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('p.C2', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('p.ld2', 1, 0.8); void bump('p.pD', alive);
      } else {
        tr.set('p.ld2', 0, 0.4); tr.set('p.C2:dim', 1, 0.6);
        tr.set('p.a.cancel', 1, 1.0); tr.set('p.C3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.C4', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        fbHost.append(feedback(true, LINES['p.done']!.html, [h('div', { class: 'row' }, btn('Practice', () => go(4), 'go'))]));
      }
    });
  }
  const proofHost = h('div');
  const yes = btn('Ava is right', () => judge(true)), no = btn('Ava is wrong', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', subgoal: 'define-irrational', item: 'prove.judge', prompt: 'Ava: 0.272727… never ends, so it is irrational. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.repIrr : undefined });
    const id = right ? 'p.build-right' : 'p.build-wrong';
    proofHost.replaceChildren(P(id), chainBox, chipBox, fbHost);
    sayAll(id);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), P('p.intro'), P('p.ask'), h('div', { class: 'row' }, yes, no), proofHost);
  sayAll('p.intro', 'p.ask');
}

// ---------- 5. Practice: every sub-goal, then mixed ----------
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as IrItem),
  });
}
/** split a TeX line at a relation (<, =, >, ≈) when it is too wide for the board at 60 px */
function fitLines(src: string, maxW: number): string[] {
  const fits = (s: string) => { try { return texWidth(tex(s) as Formula, 60) <= maxW; } catch { return true; } };
  if (fits(src)) return [src];
  const rel = [...src.matchAll(/ (<|>|=|\\approx) /g)].map(m => m.index!);
  let best: [string, string] | null = null, bestD = Infinity;
  for (const i of rel) {
    const a = src.slice(0, i), b = src.slice(i + 1);
    if (fits(a) && fits(b) && Math.abs(a.length - b.length) < bestD) { best = [a, b]; bestD = Math.abs(a.length - b.length); }
  }
  if (!best) console.warn(`board line too wide: ${src}`);
  return best ?? [src];
}
type Solve = (alive: () => boolean) => Promise<void>;
interface Drawn { draw: (c: Canvas) => void; solveStep: (s: string) => number }
function picModel(pic: Pic): Drawn | null {
  const pk = (s: string) => tr.k('x.' + s);
  if (pic.kind === 'zoom') {
    const mk = tryBlock(() => ZoomLine(pic.p, MF, th));
    if (!mk.ok) { console.warn(mk.error); return null; }
    const z = mk.value;
    return { draw: c => z.draw(c, progressOf(pk), { band: i => tr.k(`x.pB${i}`) }), solveStep: s => (s.startsWith('zoom') ? 1.5 : 0.9) };
  }
  if (pic.kind === 'tape') {
    const mk = tryBlock(() => DigitTape(pic.p, MF, th));
    if (!mk.ok) { console.warn(mk.error); return null; }
    const t: TapeBlock = mk.value;
    return { draw: c => t.draw(c, progressOf(pk)), solveStep: s => (s === 'top' ? 2.2 : s === 'subtract' ? 1.4 : 1.0) };
  }
  if (pic.kind === 'sets') {
    const mk = tryBlock(() => RealSets(pic.p, MF, th));
    if (!mk.ok) { console.warn(mk.error); return null; }
    const S = mk.value;
    return { draw: c => S.draw(c, progressOf(pk)), solveStep: () => 1.0 };
  }
  const mk = tryBlock(() => Calc(pic.p, MF, th));
  if (!mk.ok) { console.warn(mk.error); return null; }
  const C = mk.value;
  return { draw: c => C.draw(c, progressOf(pk)), solveStep: () => 1.1 };
}
/** the item's picture with its board; `ready` jumps the shown steps (a bare item turning into its picture) */
function picScene(item: IrItem): { solve: Solve } | null {
  const pic = item.pic!;
  const m = picModel(pic);
  if (!m) return null;
  const T = fitLines(item.board, BOARD_W).map((s, i) => bl(`x.T${i}`, s, BOARD.y0 + 90 + i * 110, 76));
  let y = BOARD.y0 + 90 + T.length * 110 + 90;
  const Ls: Line[][] = item.solveTex.map((s, i) => fitLines(s, BOARD_W).map((u, j) => { const L = bl(`x.L${i}.${j}`, u, y, 72); y += j === 0 && fitLines(s, BOARD_W).length > 1 ? 100 : 130; return L; }));
  setScene({ table: 1080, model: m.draw, lines: [...T, ...Ls.flat()], leads: [] });
  T.forEach((_, i) => tr.set(`x.T${i}`, 1, 0.8, 0.3 + i * 0.3));
  pic.show.forEach((s, i) => tr.set('x.' + s, 1, 1.0, i * 0.35));
  return {
    solve: async alive => {
      T.forEach((_, i) => tr.set(`x.T${i}:dim`, 1, 0.5));
      const n = Math.max(pic.solve.length, Ls.length);
      for (let i = 0; i < n; i++) {
        const s = pic.solve[i];
        if (s) { const d = m.solveStep(s); tr.set('x.' + s, 1, d); if (s.startsWith('band')) void bump(`x.pB${s.slice(4)}`, alive); await wait(d); if (!alive()) return; }
        const L = Ls[i];
        if (L) { L.forEach((l, j) => tr.set(l.key, 1, 0.9, j * 0.5)); await wait(0.9 + (L.length - 1) * 0.5); if (!alive()) return; }
      }
    },
  };
}
function showItem(item: IrItem): { solve?: Solve } {
  tr.reset('x.');
  if (item.pic && !item.bareFirst) {
    const sc = picScene(item);
    if (sc) return sc;
  }
  const big = box(300, 260, 1620, 760);
  const BL = bigLine('x.T', item.board, big);
  if (texWidth(BL.F, BL.size) > big.w - 100) console.warn(`board too wide: ${item.board}`);
  setScene({ table: 1080, lines: [BL], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  if (!item.pic) {
    // a bare item: its worked lines replace the question on the slate
    return {
      solve: async alive => {
        if (!item.solveTex.length) return;
        const srcs = item.solveTex.flatMap(s => fitLines(s, big.w - 140));
        const Ls = srcs.map((s, i) => cLine(`x.S${i}`, s, big.cx, big.y0 + 110 + i * (srcs.length > 3 ? 100 : 140), 80, big.w - 140));
        setScene({ table: 1080, lines: Ls, leads: [], boardBox: box(big.x0, big.y0, big.x1, Math.max(big.y1, big.y0 + 170 + srcs.length * 120)) });
        for (let i = 0; i < Ls.length; i++) { tr.set(`x.S${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; }
      },
    };
  }
  return {
    solve: async alive => {
      // the picture arrives with the worked solution
      const sc = picScene(item);
      if (!sc) return;
      await wait(1.6); if (!alive()) return;
      await sc.solve(alive);
    },
  };
}
/** a line centred on x (bare items on the wide slate) */
function cLine(key: string, src: string, cx: number, y: number, size: number, maxW: number): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x: cx - texWidth(F, s) / 2, y, size: s };
}

void runLesson({
  slug: SLUG,
  warm: ['\\sqrt{2} \\approx 1.414213562{\\ldots} \\overline{27} \\tfrac{3}{11} \\pi \\square \\overset{?}{<} \\mathbb{N}\\subset\\mathbb{Q}', '\\text{Ava: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
void frame;
