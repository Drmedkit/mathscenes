// reflections.ts: "Reflect shapes and points across a line" (grade 8, 8.G.A.1), on the shared lesson runtime.
//   1 The question   wet paint at P, the sheet folds along a slanted crease m: where does it print? 3 spots (one right,
//                    one straight across the page, one as far but moved along m) + how sure
//   2 Worked example four subgoal steps on the same sheet: to m at a right angle, count the steps, the same count
//                    beyond, fold to check; each symbol on the board is linked to its part of the picture; one "why?"
//   3 Your turn      triangle ABC across a 45° line, faded from the end: A is done, the kid counts B's steps, picks B',
//                    finds that C (on m) stays put, and reads the reversed vertex order; the callback to part 1
//   4 Prove it       Riley's claim (same distance, other side = image), judged, then a because-chain from reason chips
//                    whose distractors are catalogue misconceptions; the picture backs every line
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/reflections/voice/lines.json (text in src/lesson/topics/reflections/script.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, bigLine, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Mirror, type MirrorBlock, type MirrorFocus } from '../../src/lesson/topics/reflections/Mirror';
import { FAMILY_NAMES, GENERATORS, type RefItem } from '../../src/lesson/topics/reflections/items';
import { explain } from '../../src/lesson/topics/reflections/explain';
import { PLAN } from '../../src/lesson/topics/reflections/plan';
import { SCRIPT } from '../../src/lesson/topics/reflections/script';
import { aLine, dLine, type MirrorPic, type Pt } from '../../src/lesson/topics/reflections/mirrorMaths';
import { rng } from '../../src/lesson/runtime/item';

const SLUG = 'reflections';
/** the model's frame: the sheet is pinned left of the board */
const MF = frame(40, 60, 1150, 960);
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const MC = {
  notPerp: 'mc.transformations.reflects-not-perpendicular-to-line',
  oneCond: 'mc.transformations.reflection-one-condition-only',
  oppSides: 'mc.transformations.opposite-sides-suffice-for-reflection',
  points: 'mc.count.counts-points-not-intervals',
  jumps: 'mc.transformations.reflection-jumps-whole-figure',
  slide: 'mc.transformations.reflection-as-slide',
};

// ---------- voice: one line at a time; a newer line cancels the rest of a chain ----------
let sayTok = 0;
async function sayChain(...ids: string[]): Promise<void> {
  const t = ++sayTok;
  for (const id of ids) { await ctx.say(id); if (t !== sayTok) return; }
}
const say = (...ids: string[]) => { void sayChain(...ids); };
/** a voiced panel line */
const lineP = (id: string, cls = ''): HTMLElement => html('p', cls, SCRIPT[id] ?? id);
const fbLine = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- the scene: the Mirror model on the left, the board on the right ----------
interface MScene { pre: string; model: MirrorBlock | null; lines: Line[]; leads: Lead[]; focus?: () => MirrorFocus; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setMirror(S: MScene): void {
  setScene({
    table: 1052,
    model: c => { if (S.model) S.model.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
function showSheet(pre: string, delay = 0, keys = ['figure']): void {
  tr.set(pre + 'sheet', 1, 0.7, delay); tr.set(pre + 'line', 1, 0.9, delay + 0.4);
  keys.forEach((k, i) => tr.set(pre + k, 1, 0.7, delay + 0.9 + i * 0.35));
}
const Y = (k: number) => BOARD.y0 + k;
const T = { P: { col: 'first' as const }, m: { col: 'second' as const }, s: { col: 'link' as const }, k: { col: 'pick' as const } };

// ---------- the sheets of parts 1-4 (exact; checked by the Mirror block) ----------
const P_AT: Pt = [1, 2];
/** part 1 + 2: a slanted crease y = -x + 7; P is 2 diagonal steps from it; the image (5, 6) is on the board's side,
 *  so every leader reaches its part without crossing m. Spot 1 is straight across the page, spot 3 as far but moved
 *  along m. */
const Q_PIC = (): MirrorPic => ({
  cols: 10, rows: 9, grid: true, line: aLine(7),
  pins: [{ at: P_AT, label: 'P', role: 'first', style: 'blob' }],
  spots: [{ at: [9, 2], n: 1 }, { at: [5, 6], n: 2 }, { at: [3, 8], n: 3 }],
  solve: { pts: [{ from: P_AT, label: "P'" }], hops: 'diag', spot: 2 },
});
const CARDS = [
  { n: 1, mc: MC.notPerp, cb: 't.cb-across' },
  { n: 2, mc: undefined, cb: 't.cb-right' },
  { n: 3, mc: MC.oneCond, cb: 't.cb-far' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = Mirror(Q_PIC(), MF, th);
  const L0 = line('q.l0', '\\text{the paint prints at}', Y(130), 56, undefined, 'dim');
  const L1 = line('q.l1', '\\cssId{P}{P} \\to\\ ?', Y(250), 96, T);
  setMirror({ pre: 'q.', model: m, lines: [L0, L1], leads: [] });
  showSheet('q.', 0, ['figure', 'spots']);
  tr.set('q.l0', 1, 0.8, 1.8); tr.set('q.l1', 1, 0.9, 2.1);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Wet paint at P; fold along the slanted crease m: where does it print? (spot 1 straight across, spot 2 right, spot 3 moved along m)', response: `spot ${p.n}`, expected: 'spot 2', correct: p.n === 2, mc: p.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.n}<small>spot</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Fold and print'), lineP('q.intro'), lineP('q.ask'), cards, html('div', 'label', SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
  say('q.intro', 'q.ask', 'q.sure');
}

// ===== 2. Worked example: the same sheet, four steps =====
function partExample(): void {
  tr.reset('e.');
  const m = Mirror(Q_PIC(), MF, th);
  const Q = line('e.q', '\\cssId{P}{P} \\to\\ ?', Y(130), 96, T);
  const H = line('e.hero', "\\cssId{P}{P} \\to \\cssId{s}{P'}", Y(130), 96, T);
  const L1 = line('e.L1', '\\cssId{k}{PM} \\perp \\cssId{m}{m}', Y(330), 84, T);
  const L2 = line('e.L2', 'PM = \\cssId{k}{2}\\ \\text{steps}', Y(470), 80, T);
  const L3 = line('e.L3', "MP' = \\cssId{s}{2}\\ \\text{steps}", Y(610), 80, T);
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'k'), to: () => m.where.perp(0), col: 'pick' },
    { key: 'e.ld2', from: () => partOf(L2, 'k'), to: () => m.where.hops(0), col: 'pick' },
    { key: 'e.ld3', from: () => partOf(L3, 's'), to: () => m.where.beyond(0), col: 'link' },
    { key: 'e.ldS', from: () => partOf(H, 's'), to: () => m.where.image(0), col: 'link' },
  ];
  setMirror({ pre: 'e.', model: m, lines: [Q, H, L1, L2, L3], leads, focus: () => ({ line: tr.k('e.glow'), points: ['P'], k: tr.k('e.fP') }) });
  for (const s of ['sheet', 'line', 'figure', 'spots']) tr.jump('e.' + s, 1);
  tr.jump('e.q', 1);

  let step = 0;
  const STEPS = [
    { t: 'Go to m at a right angle', why: 'The shortest way to the crease.', act: 'Go to m' },
    { t: 'Count the steps to m', why: 'Corner to corner, along the other diagonal.', act: 'Count' },
    { t: 'Count the same steps beyond m', why: 'As far behind m as in front.', act: 'Go beyond' },
    { t: 'Fold to check', why: 'P lands on P′.', act: 'Fold' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
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
        tr.set('e.fP', 1, 0.4); tr.set('e.glow', 1, 0.5);
        tr.set('e.perp', 1, 1.4, 0.3); await wait(1.7); if (!alive()) return;
        tr.set('e.fP', 0, 0.4); tr.set('e.glow', 0, 0.6);
        tr.set('e.L1', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.ld1', 1, 0.8);
      } else if (i === 1) {
        tr.set('e.ld1', 0, 0.4); tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.hops', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.ld2', 1, 0.8);
      } else if (i === 2) {
        tr.set('e.ld2', 0, 0.4); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.beyond', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.answer', 1, 0.6); await wait(0.5); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.ld3', 1, 0.8);
      } else {
        tr.set('e.ld3', 0, 0.4); tr.set('e.L3:dim', 1, 0.6);
        tr.set('e.fold', 1, 1.8); await wait(2.4); if (!alive()) return;
        tr.set('e.fold', 0, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.q', 0, 0.5); tr.set('e.hero', 1, 1.2, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.ldS', 1, 0.8);
      }
      const id = `e.s${i}`;
      sayBox.replaceChildren(lineP(id));
      if (i === 3) { void sayChain(id, 'e.why'); selfExplain(); } else say(id);
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The fold moves every point at a right angle to the crease, not to the page.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'A reflection always goes straight across the page.', ok: false, id: 'e.w-across', mc: MC.notPerp },
      { t: 'Any spot as far from m as P will do.', ok: false, id: 'e.w-far', mc: MC.oneCond },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does the paint print at spot 2 and not straight across at spot 1?', response: o.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbLine(o.ok, o.id));
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), lineP('e.intro', 'dim'), plan, sayBox, after);
  say('e.intro');
}

// ===== 3. Your turn: triangle ABC across y = -x + 10 (faded from the end) =====
// A is 2 diagonal steps from m, B is 3, C is on m; A -> B -> C turns clockwise. The image is on the board's side.
const TRI: Pt[] = [[5, 1], [1, 3], [6, 4]];
const IMG: Pt[] = [[9, 5], [7, 9], [6, 4]];
const T_PIC = (): MirrorPic => ({
  cols: 11, rows: 11, grid: true, line: aLine(10),
  figure: [{ pts: TRI, labels: ['A', 'B', 'C'], role: 'first' }],
  spots: [{ at: [8, 10], n: 1 }, { at: [6, 8], n: 2 }, { at: [7, 9], n: 3 }],
  solve: { pts: [{ from: TRI[0]!, label: "A'" }, { from: TRI[1]!, label: "B'" }, { from: TRI[2]! }], hops: 'diag', poly: { pts: IMG, role: 'link' }, orient: [TRI, IMG] },
});
function partTurn(): void {
  tr.reset('t.');
  const m = Mirror(T_PIC(), MF, th);
  const Hq = line('t.q', '\\cssId{P}{\\triangle ABC} \\to\\ ?', Y(120), 92, T);
  const H = line('t.hero', "\\cssId{P}{\\triangle ABC} \\to \\cssId{s}{\\triangle A'B'C'}", Y(120), 92, T);
  const LA = line('t.LA', "A \\to \\cssId{s}{A'}:\\ 2 + 2", Y(300), 72, T);
  const LB = line('t.LB', "B \\to \\cssId{s}{B'}:\\ 3 + 3", Y(440), 72, T);
  const LC = line('t.LC', "C \\to \\cssId{s}{C'} = C", Y(580), 72, T);
  const leads: Lead[] = [
    { key: 't.ldA', from: () => partOf(LA, 's'), to: () => m.where.image(0), col: 'link' },
    { key: 't.ldB', from: () => partOf(LB, 's'), to: () => m.where.image(1), col: 'link' },
    { key: 't.ldC', from: () => partOf(LC, 's'), to: () => m.where.image(2), col: 'link' },
  ];
  setMirror({ pre: 't.', model: m, lines: [Hq, H, LA, LB, LC], leads, focus: () => ({ points: tr.k('t.fB') > 0 ? ['B'] : ['C'], k: Math.max(tr.k('t.fB'), tr.k('t.fC')), spots: [], col: 'pick' }) });
  showSheet('t.'); tr.set('t.q', 1, 0.8, 1.6);

  let step = 0;
  const STEPS = [
    { t: 'Reflect A', why: 'Done for you.' },
    { t: 'Reflect B', why: 'Your step: count, then the same count beyond.' },
    { t: 'Reflect C', why: 'Your step.' },
    { t: 'Join A′B′C′ and check the order', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a triangle'), lineP('t.intro'), plan, work);
  say('t.intro');

  seq(async alive => {
    await wait(2.2); if (!alive()) return;
    tr.set('t.perp0', 1, 1.0); await wait(1.1); if (!alive()) return;
    tr.set('t.hops0', 1, 0.9); await wait(1.0); if (!alive()) return;
    tr.set('t.beyond0', 1, 0.9); await wait(0.9); if (!alive()) return;
    tr.set('t.answer0', 1, 0.5); tr.set('t.LA', 1, 1.0, 0.2); tr.set('t.ldA', 1, 0.8, 1.1); await wait(2.0); if (!alive()) return;
    work.replaceChildren(lineP('t.a'));
    await sayChain('t.a'); if (!alive()) return;
    tr.set('t.ldA', 0, 0.4); tr.set('t.LA:dim', 1, 0.5);
    step = 1; drawPlan(); askCount();
  });

  function askCount(): void {
    tr.set('t.fB', 1, 0.5);
    const fbHost = h('div');
    const inp = numInput('steps', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num') { fbHost.replaceChildren(feedback(false, 'Type a number of steps.')); return; }
      const v = r.v, right = v === 3;
      const id = right ? 't.c-ok' : v === 6 ? 't.c-across' : v === 4 ? 't.c-points' : 't.c-other';
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: 'Diagonal steps from B to m (at a right angle)', response: v, expected: 3, correct: right, mc: right ? undefined : v === 6 ? MC.notPerp : v === 4 ? MC.points : undefined });
      fbHost.replaceChildren(fbLine(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.fB', 0, 0.4); tr.set('t.perp1', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.hops1', 1, 1.1); await wait(1.4); if (!alive()) return;
        askSpot();
      });
    }
    work.replaceChildren(lineP('t.count'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    say('t.count');
    inp.focus();
  }
  function askSpot(): void {
    tr.set('t.spots', 1, 0.6);
    const fbHost = h('div'), box_ = h('div', { class: 'row' });
    const SPOTS = [{ n: 1, ok: false, id: 't.s-long' }, { n: 2, ok: false, id: 't.s-short' }, { n: 3, ok: true, id: 't.s-ok' }];
    SPOTS.forEach(s => box_.append(btn(`Spot ${s.n}`, () => {
      ctx.store.log({ part: 'turn', item: 'turn.spot', prompt: "Count 3 steps beyond m: which spot is B'?", response: `spot ${s.n}`, expected: 'spot 3', correct: s.ok, mc: s.ok ? undefined : MC.points });
      fbHost.replaceChildren(fbLine(s.ok, s.id));
      if (!s.ok) return;
      box_.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.beyond1', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('t.spots', 0, 0.5); tr.set('t.answer1', 1, 0.5);
        tr.set('t.LB', 1, 1.0, 0.2); tr.set('t.ldB', 1, 0.8, 1.1); await wait(2.3); if (!alive()) return;
        tr.set('t.ldB', 0, 0.4); tr.set('t.LB:dim', 1, 0.5);
        step = 2; drawPlan(); askC();
      });
    })));
    work.replaceChildren(lineP('t.spot'), box_, fbHost);
    say('t.spot');
  }
  function askC(): void {
    tr.set('t.fC', 1, 0.5);
    const fbHost = h('div');
    const stay = btn('C′ is C itself', () => answer(true)), move = btn('C′ is across m from C', () => answer(false));
    function answer(ok: boolean): void {
      ctx.store.log({ part: 'turn', item: 'turn.fixed', prompt: "C is on m: where is C'?", response: ok ? 'C itself' : 'across m', expected: 'C itself', correct: ok, mc: ok ? undefined : MC.jumps });
      fbHost.replaceChildren(fbLine(ok, ok ? 't.cc-ok' : 't.cc-no'));
      if (!ok) return;
      stay.disabled = move.disabled = true;
      seq(async alive => {
        tr.set('t.fC', 0, 0.4); tr.set('t.answer2', 1, 0.6);
        tr.set('t.LC', 1, 1.0, 0.2); tr.set('t.ldC', 1, 0.8, 1.1); await wait(2.4); if (!alive()) return;
        tr.set('t.ldC', 0, 0.4); tr.set('t.LC:dim', 1, 0.5);
        step = 3; drawPlan(); askOrder();
      });
    }
    work.replaceChildren(lineP('t.c'), h('div', { class: 'row' }, stay, move), fbHost);
    say('t.c');
  }
  function askOrder(): void {
    tr.set('t.join', 1, 1.2);
    const fbHost = h('div');
    const ccw = btn('Counterclockwise', () => answer(true)), cw = btn('Clockwise', () => answer(false));
    function answer(ok: boolean): void {
      ctx.store.log({ part: 'turn', item: 'turn.order', prompt: "A→B→C turns clockwise; which way does A'→B'→C' turn?", response: ok ? 'counterclockwise' : 'clockwise', expected: 'counterclockwise', correct: ok, mc: ok ? undefined : MC.slide });
      tr.set('t.orient', 1, 1.2);
      fbHost.replaceChildren(fbLine(ok, ok ? 't.o-ok' : 't.o-no'));
      if (!ok) return;
      ccw.disabled = cw.disabled = true;
      step = 4; drawPlan();
      seq(async alive => {
        tr.set('t.q', 0, 0.5); tr.set('t.hero', 1, 1.2, 0.3); await wait(1.8); if (!alive()) return;
        const c = h('div', { class: 'callback' });
        const pick = commit().pick;
        const id = CARDS[pick ?? 1]!.cb;
        c.innerHTML = (pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
        c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
        fbHost.append(c);
        await sayChain(ok ? 't.o-ok' : 't.o-no', id);
      });
    }
    work.replaceChildren(lineP('t.join'), h('div', { class: 'row' }, ccw, cw), fbHost);
    say('t.join');
  }
}

// ===== 4. Prove it: Riley's Q =====
const PR: Pt = [3, 5], QR: Pt = [9, 3];
const P_PIC = (): MirrorPic => ({
  cols: 11, rows: 9, grid: true, line: dLine(-2),
  pins: [{ at: PR, label: 'P', role: 'first' }, { at: QR, label: 'Q', role: 'pick' }],
  segs: [{ a: PR, b: QR, role: 'pick', dash: true }],
  solve: { pts: [{ from: PR, label: "P'" }], hops: 'diag' },
});
function partProve(): void {
  tr.reset('p.');
  const m = Mirror(P_PIC(), MF, th);
  const J = line('p.J', "\\text{Riley: }\\ \\cssId{w}{\\cssId{k}{Q} = P'}", Y(120), 80, T);
  const C1 = line('p.C1', "\\cssId{P}{P}\\cssId{s}{P'} \\perp \\cssId{m}{m}", Y(300), 76, T);
  const C2 = line('p.C2', '\\cssId{k}{\\overline{PQ}} \\not\\perp \\cssId{m}{m}', Y(440), 76, T);
  const C3 = line('p.C3', "PM = M\\cssId{s}{P'} = 2", Y(580), 76, T);
  const Hh = line('p.hero', "\\cssId{k}{Q} \\neq \\cssId{s}{P'}", Y(740), 96, T);
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 's'), to: () => m.where.perp(0), col: 'pick' },
    { key: 'p.ld3', from: () => partOf(C3, 's'), to: () => m.where.beyond(0), col: 'link' },
    { key: 'p.ldS', from: () => partOf(Hh, 's'), to: () => m.where.image(0), col: 'link', drop: 12 },
  ];
  setMirror({
    pre: 'p.', model: m, lines: [J, C1, C2, C3, Hh], leads,
    focus: () => ({ points: ['Q'], k: tr.k('p.fQ'), col: 'pick', line: tr.k('p.glow') }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showSheet('p.', 0, ['figure', 'segs']); tr.set('p.J', 1, 1.0, 1.6);

  const CHIPS = [
    { t: 'A fold moves every point at a right angle to the crease.', fits: 0 },
    { t: 'PQ crosses m on a slant: Q is moved along m.', fits: 1 },
    { t: 'P is 2 steps from m, so its image is 2 steps beyond M on the same perpendicular.', fits: 2 },
    { t: 'Q is just as far from m as P, and that is all a reflection needs.', fits: -1, mc: MC.oneCond, id: 'p.x-far' },
    { t: 'Q is on the other side of m, so it must be the image.', fits: -1, mc: MC.oppSides, id: 'p.x-side' },
  ];
  const CLAIMS = ['p.k1', 'p.k2', 'p.k3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbLine(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    if (n < 3) say(`p.c${n}`, CLAIMS[n]!); else say('p.c3');
    seq(async alive => {
      if (n === 1) { tr.set('p.glow', 1, 0.5); tr.set('p.perp', 1, 1.4, 0.2); tr.set('p.C1', 1, 1.0, 1.2); tr.set('p.ld1', 1, 0.8, 2.1); await wait(3.0); if (!alive()) return; tr.set('p.glow', 0, 0.6); tr.set('p.ld1', 0, 0.4); tr.set('p.C1:dim', 1, 0.5); }
      if (n === 2) { tr.set('p.fQ', 1, 0.5); tr.set('p.C2', 1, 1.0, 0.4); await wait(2.4); if (!alive()) return; tr.set('p.fQ', 0, 0.6); tr.set('p.C2:dim', 1, 0.5); }
      if (n === 3) {
        tr.set('p.hops', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('p.beyond', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('p.answer', 1, 0.6); tr.set('p.C3', 1, 1.0, 0.2); tr.set('p.ld3', 1, 0.8, 1.1); await wait(2.2); if (!alive()) return;
        tr.set('p.ld3', 0, 0.4); tr.set('p.C3:dim', 1, 0.5);
        tr.set('p.strike', 1, 0.6); tr.set('p.hero', 1, 1.2, 0.4); tr.set('p.ldS', 1, 0.8, 1.5); await wait(2.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(feedback(true, SCRIPT['p.done']!), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        await sayChain('p.c3', 'p.done');
      }
    });
  }
  const proofHost = h('div'), verdict = h('div', { class: 'row' });
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: Q is the image of P because Q is on the other side of m and just as far from it. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.oneCond : undefined });
    const id = right ? 'p.test' : 'p.build';
    proofHost.replaceChildren(lineP(id), chain, chipBox, fbHost);
    drawChain();
    say(id, 'p.k1');
  }
  setPanel(h('h2', {}, 'Prove it'), lineP('p.intro'), lineP('p.ask'), verdict, proofHost);
  say('p.intro', 'p.ask');
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  // review aid: ?item=family:subgoal:seed shows one generated item (with &solve, its worked solution)
  const one = ctx.qs.get('item');
  if (one) {
    const [fam, sg, sd] = one.split(':');
    const it = GENERATORS[fam!]!(rng(Number(sd ?? 1)), 1, sg) as RefItem;
    const view = showItem(it);
    setPanel(h('h2', {}, FAMILY_NAMES[fam!] ?? fam!), html('p', '', it.prompt), h('div', { class: 'opts' }, ...(it.choices ?? []).map(t => h('button', {}, t))), h('ol', { class: 'solution' }, ...it.solution.map(t => html('li', '', t))));
    if (ctx.qs.has('solve') && view.solve) seq(async alive => { await wait(1.2); if (alive()) await view.solve!(alive); });
    return;
  }
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as RefItem),
  });
}
function showItem(item: RefItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const mk = tryBlock(() => Mirror(item.pic, MF, th));
  if (!mk.ok) {
    console.warn('reflections: picture not drawn:', mk.error);
    const big = box(300, 260, 1620, 760);
    setMirror({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
    tr.set('x.T', 1, 0.8, 0.1);
    return {};
  }
  const m = mk.value, pic = item.pic, sol = pic.solve;
  const TL = line('x.T', item.board, Y(120), 84, T);
  const SL = (pic.solveTex ?? []).map((s, i) => line(`x.S${i}`, s, Y(300 + i * 140), 72));
  setMirror({ pre: 'x.', model: m, lines: [TL, ...SL], leads: [] });
  showSheet('x.', 0, ['figure', 'segs', 'image', 'cands', 'spots']);
  tr.set('x.T', 1, 0.8, 0.5);
  return {
    solve: async alive => {
      tr.set('x.T:dim', 1, 0.5);
      const n = sol?.pts.length ?? 0;
      if (n) {
        tr.set('x.perp', 1, 0.9); await wait(0.9); if (!alive()) return;
        if (SL[0]) tr.set('x.S0', 1, 0.8);
        tr.set('x.hops', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('x.beyond', 1, 1.0); await wait(1.0); if (!alive()) return;
        if (SL[1]) tr.set('x.S1', 1, 0.8);
      }
      tr.set('x.answer', 1, 0.6); await wait(0.5); if (!alive()) return;
      if (sol?.poly) { tr.set('x.join', 1, 1.0); await wait(0.9); if (!alive()) return; }
      if (sol?.orient) tr.set('x.orient', 1, 1.0);
      for (let i = 2; i < SL.length; i++) { tr.set(`x.S${i}`, 1, 0.8); await wait(0.7); if (!alive()) return; }
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{the paint prints at}', "P \\to P'", '\\perp\\not\\perp\\neq\\cong', '\\overline{PQ}', "\\triangle A'B'C'", '\\text{Riley: }', '\\text{which move?}', '\\text{steps small through}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
