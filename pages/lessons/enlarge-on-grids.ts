// enlarge-on-grids.ts: "Enlarge and reduce shapes informally on grid paper", grade 7 (7.G.A.1), on the lesson runtime.
//   1 The question   a house icon 2 wide, walls 3; a copy 4 wide: how tall are its walls? cards 6 / 5 (+2) / 3 + how sure
//   2 Worked example Factor -> Walk the original -> Multiply every move -> Check, on grid paper (WalkGrid): two amber
//                    2-pieces fit along the copy's base; the pen walks the house side by side (the roof as left 1 +
//                    up 1); the copy is walked leg by leg, every move x2, and the board fills a move table beside it;
//                    the walk closes on the dot; the "+2" house (walls 5) appears dashed red. Why 6 and not 5?
//   3 Your turn      a sail, x3, faded from the end: the base is walked for you; the kid types the slanted side's two
//                    steps, then the last side back to the dot, then compares the corners; callback to part 1
//   4 Prove it       Jordan: "add the same number to every side: always a scaled copy". Always / sometimes / never,
//                    then a 3-line because-chain (the 2 by 2 square works, the 1 by 3 strip fails, the reason);
//                    distractor chips are catalogue misconceptions; the picture backs every line
//   5 Practice       all 14 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/enlarge-on-grids/script.ts (panel HTML) = pages/lessons/enlarge-on-grids/voice/lines.json.
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { tex, texWidth, type Formula } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { BOARD, LX, bigLine, bump, line, type Line, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { seq } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ScaleGrid, type GridFocus, type ScaleGridBlock, picSteps } from '../../src/lesson/topics/scale-factor/ScaleGrid';
import { WalkGrid, type WalkGridBlock } from '../../src/lesson/topics/enlarge-on-grids/WalkGrid';
import { HOUSE, LESSON_FRAME, SAIL, SQUARES } from '../../src/lesson/topics/enlarge-on-grids/lessonPics';
import { moveTex } from '../../src/lesson/topics/enlarge-on-grids/walkMaths';
import { FAMILY_NAMES, GENERATORS, MC, PF, type GridItem } from '../../src/lesson/topics/enlarge-on-grids/items';
import { PLAN } from '../../src/lesson/topics/enlarge-on-grids/plan';
import { SCRIPT } from '../../src/lesson/topics/enlarge-on-grids/script';

const SLUG = 'enlarge-on-grids';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const T = (id: string) => SCRIPT[id]?.h ?? id;
/** a voiced panel line: the narrator says it, the panel shows it */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, T(id)); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fbSaid = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, T(id), extra); };

const C = { o: { col: 'first' as const }, c: { col: 'second' as const }, k: { col: 'link' as const }, w: { col: 'wrong' as const } };
/** a board cell at any x (the move table) */
function cell(key: string, src: string, x: number, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  return { key, F, x, y, size, col };
}
const COL2 = LX + 290;

/** a scene with a walk-grid (or a plain ScaleGrid) model */
interface WScene { pre: string; m: WalkGridBlock | ScaleGridBlock; lines: Line[]; focus?: () => GridFocus; boardBox?: ReturnType<typeof box> | null }
function setWalk(S: WScene): void {
  setScene({
    table: Math.min(1050, S.m.box.y1 + 46),
    model: c => S.m.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()),
    lines: S.lines, leads: [], boardBox: S.boardBox,
  });
}
const walk = () => WalkGrid(HOUSE, LESSON_FRAME, th);
/** label pulses (a ring on a side label while its symbol writes on) */
const ring = (pre: string, f: number, i: number, col?: Paint) => ({ f, i, k: tr.k(`${pre}p${f}.${i}`), col });
async function pulse(pre: string, list: [number, number][], alive: () => boolean): Promise<void> {
  for (const [f, i] of list) void bump(`${pre}p${f}.${i}`, alive);
  await wait(1.0);
}

const CARDS = [
  { v: 6, id: '', cb: 't.cb.right' },
  { v: 5, id: MC.additive, cb: 't.cb.add' },
  { v: 3, id: MC.someSides, cb: 't.cb.some' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = walk();
  const Q1 = line('q.Q1', '\\text{width: }\\ \\cssId{o}{2} \\to \\cssId{c}{4}', BOARD.y0 + 140, 84, C);
  const Q2 = line('q.Q2', '\\text{walls: }\\ \\cssId{o}{3} \\to\\ ?', BOARD.y0 + 360, 84, C);
  setWalk({ pre: 'q.', m, lines: [Q1, Q2] });
  tr.set('q.grid', 1, 0.7); tr.set('q.f0', 1, 1.0, 0.35); tr.set('q.f0L', 1, 0.6, 0.9);
  tr.set('q.' + m.keys.leg(0), 1, 0.8, 1.3); tr.set('q.' + m.keys.lab1(0), 1, 0.6, 1.8); tr.set('q.k0', 1, 0.6, 2.1);
  tr.set('q.Q1', 1, 0.9, 2.0); tr.set('q.Q2', 1, 0.9, 2.6);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'House icon 2 wide, walls 3; a same-shape copy 4 wide: how tall are its walls?', response: p.v, expected: 6, correct: p.v === 6, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  // the cards in a fixed mixed order (the right one is not first); commit().pick is the CARDS index
  const SHOW = [1, 0, 2];
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', commit().pick === SHOW[j]));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  SHOW.forEach(i => {
    const cd = CARDS[i]!;
    const b = h('button'); b.innerHTML = `${cd.v}<small>squares tall</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); });
    cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Make the house bigger'), html('p', '', T('q.intro')), html('p', '', T('q.ask')), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
  void ctx.say('q.intro').then(() => { if (ctx.progress.part === 0) sayOnly('q.ask'); });
}

// ===== 2. Worked example =====
function partExample(): void {
  tr.reset('e.');
  const m = walk(), K = m.keys, w = m.w;
  const y0 = BOARD.y0;
  const KL = line('e.K', '\\cssId{c}{4} = \\cssId{k}{2} \\times \\cssId{o}{2}', y0 + 100, 84, C);
  const H0 = cell('e.H0', '\\text{house}', LX, y0 + 215, 56, 'first');
  const H1 = cell('e.H1', '\\text{copy} \\times 2', COL2, y0 + 215, 56, 'second');
  const rows0 = w.moves0.map((mv, j) => cell(`e.r0.${j}`, moveTex(mv), LX, y0 + 310 + j * 92, 62, 'first'));
  const rows1 = w.moves1.map((mv, j) => cell(`e.r1.${j}`, moveTex(mv), COL2, y0 + 310 + j * 92, 62, 'second'));
  const CK = line('e.CK', '\\text{walls: } 3 + 2 = 5 \\neq 6', y0 + 800, 66, undefined, 'wrong');
  setWalk({
    pre: 'e.', m, lines: [KL, H0, H1, ...rows0, ...rows1, CK],
    focus: () => ({
      pulse: [ring('e.', 0, 0, 'pick'), ring('e.', 1, 0, 'pick'), ring('e.', 1, 1, 'link'), ring('e.', w.extra[0]!, 4, 'wrong')],
      sides: [...w.moves0.map((_, j) => m.glow0(j, tr.k(`e.g0.${j}`))), ...w.moves1.map((_, j) => m.glow1(j, tr.k(`e.g1.${j}`)))],
    }),
  });
  for (const s of ['grid', 'f0', 'f0L', K.leg(0), K.lab1(0)]) tr.jump('e.' + s, 1);

  let step = 0;
  const STEPS = [
    { t: 'Find the scale factor', why: 'How many times as long is the copy?', act: 'Factor' },
    { t: 'Walk the original', why: 'From the dot, one side at a time.', act: 'Walk' },
    { t: 'Multiply every move', why: 'Same order, every step × the factor.', act: 'Multiply' },
    { t: 'Check', why: 'Back on the dot? Every length × 2?', act: 'Check' },
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
    sayBox.replaceChildren(said(`e.step${i}`));
    seq(async alive => {
      if (i === 0) {
        tr.set('e.' + K.extra(1), 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('e.' + K.extra(2), 1, 0.8); await wait(0.9); if (!alive()) return;
        await pulse('e.', [[0, 0], [1, 0]], alive); if (!alive()) return;
        tr.set('e.K', 1, 1.0);
      } else if (i === 1) {
        tr.set('e.' + K.extra(1), 0, 0.5); tr.set('e.' + K.extra(2), 0, 0.5); tr.set('e.K:dim', 1, 0.6);
        tr.set('e.d0', 1, 0.5); tr.set('e.H0', 1, 0.6); await wait(0.8); if (!alive()) return;
        for (let j = 0; j < w.moves0.length; j++) {
          tr.set(`e.g0.${j}`, 1, 0.4);
          if (K.rr0(j) !== 'none') tr.set('e.' + K.rr0(j), 1, 0.9);
          tr.set(`e.r0.${j}`, 1, 0.7, 0.2);
          await wait(1.1); if (!alive()) return;
          tr.set(`e.g0.${j}`, 0, 0.4);
        }
      } else if (i === 2) {
        tr.set('e.d1', 1, 0.5); tr.set('e.H1', 1, 0.6); await wait(0.6); if (!alive()) return;
        for (let j = 0; j < w.moves1.length; j++) {
          tr.set(`e.g0.${j}`, 1, 0.4);
          if (K.rr1(j) !== 'none') { tr.set('e.' + K.rr1(j), 1, 0.9); await wait(0.9); if (!alive()) return; }
          tr.set('e.' + K.leg(j), 1, 0.9); if (j === 1) tr.set('e.' + K.lab1(1), 1, 0.6, 0.7);
          tr.set(`e.r1.${j}`, 1, 0.7, 0.3);
          await wait(1.2); if (!alive()) return;
          tr.set(`e.g0.${j}`, 0, 0.4);
        }
        await pulse('e.', [[1, 1]], alive);
      } else {
        tr.set('e.f1', 1, 1.4); await wait(1.0); if (!alive()) return;
        tr.set('e.d1', 0.3, 0.3); await wait(0.35); tr.set('e.d1', 1, 0.4); await wait(0.6); if (!alive()) return;
        tr.set('e.' + K.extra(0), 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set(`e.f${w.extra[0]}L`, 1, 0.6); await pulse('e.', [[w.extra[0]!, 4], [1, 1]], alive); if (!alive()) return;
        tr.set('e.CK', 1, 1.0); await wait(1.2);
      }
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Adding 2 to every side keeps the shape.', ok: false, mc: MC.additive as string | undefined, id: 'e.why.add' },
      { t: 'Every length gets the same factor: 3 × 2 = 6.', ok: true, mc: undefined, id: 'e.why.ok' },
      { t: 'Only the width had to change; the walls stay 3.', ok: false, mc: MC.someSides, id: 'e.why.some' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box_.append(btn(o.t, () => {
      box_.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box_.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fbSaid(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why are the walls 6 squares tall, not 5?', response: o.t, expected: 'Every length gets the same factor', correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', T('e.why')), box_, fbHost);
    void ctx.say('e.step3').then(() => { if (ctx.progress.part === 1 && !fbHost.childElementCount) sayOnly('e.why'); });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: the sail, x3 =====
function partTurn(): void {
  tr.reset('t.');
  const m = WalkGrid(SAIL, LESSON_FRAME, th), K = m.keys, w = m.w;
  const y0 = BOARD.y0;
  const H0 = cell('t.H0', '\\text{sail}', LX, y0 + 110, 56, 'first');
  const H1 = cell('t.H1', '\\text{copy} \\times 3', COL2, y0 + 110, 56, 'second');
  const rows0 = w.moves0.map((mv, j) => cell(`t.r0.${j}`, moveTex(mv), LX, y0 + 230 + j * 120, 62, 'first'));
  const rows1 = w.moves1.map((mv, j) => cell(`t.r1.${j}`, moveTex(mv), COL2, y0 + 230 + j * 120, 62, 'second'));
  const AN = line('t.AN', '\\text{corners: the same}', y0 + 720, 66, undefined, 'link');
  setWalk({
    pre: 't.', m, lines: [H0, H1, ...rows0, ...rows1, AN],
    focus: () => ({ sides: w.moves0.map((_, j) => m.glow0(j, tr.k(`t.g0.${j}`))) }),
  });
  for (const s of ['grid', 'f0', 'f0L', 'd0', 'd1']) tr.set('t.' + s, 1, 0.8, 0.2);
  tr.set('t.H0', 1, 0.6, 0.8); tr.set('t.H1', 1, 0.6, 1.0);

  let step = 1;
  const STEPS = [
    { t: 'Walk the base', why: 'Done for you.' },
    { t: 'The slanted side', why: 'Your step.' },
    { t: 'Back to the dot', why: 'Your step.' },
    { t: 'Check the corners', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  step = 0; drawPlan();
  setPanel(h('h2', {}, 'A sail, 3 times as big'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(1.6); if (!alive()) return;
    tr.set('t.g0.0', 1, 0.4); tr.set('t.r0.0', 1, 0.7); await wait(0.9); if (!alive()) return;
    tr.set('t.' + K.leg(0), 1, 1.0); tr.set('t.' + K.lab1(0), 1, 0.6, 0.8); tr.set('t.r1.0', 1, 0.7, 0.5); await wait(1.6); if (!alive()) return;
    tr.set('t.g0.0', 0, 0.4);
    step = 1; drawPlan(); askSide(1);
  });

  /** the kid types both steps of side j of the copy */
  function askSide(j: number): void {
    const mv = w.moves0[j]!, cp = w.moves1[j]!;
    const hw = mv.dx < 0 ? 'left' : 'right', vw = mv.dy < 0 ? 'down' : 'up';
    tr.set(`t.g0.${j}`, 1, 0.4); tr.set('t.' + K.rr0(j), 1, 0.9); tr.set(`t.r0.${j}`, 1, 0.7, 0.3);
    const fbHost = h('div');
    const inp = pairInput(hw, `squares, ${vw}`, () => check(), 'squares');
    const ok = btn('Check', () => check(), 'go');
    const want: [number, number] = [Math.abs(cp.dx), Math.abs(cp.dy)];
    const a0 = Math.abs(mv.dx), b0 = Math.abs(mv.dy);
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Fill in both boxes.')); return; }
      const right = r.x === want[0] && r.y === want[1];
      const one = (r.x === 3 * a0 && r.y === b0) || (r.x === a0 && r.y === 3 * b0);
      const same = r.x === a0 && r.y === b0;
      const mc = right ? undefined : one ? MC.oneStep : same ? MC.someSides : undefined;
      ctx.store.log({ part: 'turn', item: `turn.side${j}`, prompt: `Sail side ${j === 1 ? 'left 1, up 3' : 'left 2, down 3'}, copy x3: ${hw} ?, ${vw} ?`, response: r, expected: { x: want[0], y: want[1] }, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbSaid(false, one ? 't.slant.one' : same && j === 1 ? 't.slant.same' : j === 1 ? 't.slant.other' : 't.back.other')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbSaid(true, j === 1 ? 't.slant.ok' : 't.back.ok'));
      seq(async alive => {
        tr.set('t.' + K.rr1(j), 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('t.' + K.leg(j), 1, 1.0); tr.set(`t.r1.${j}`, 1, 0.7, 0.4); await wait(1.4); if (!alive()) return;
        tr.set(`t.g0.${j}`, 0, 0.4);
        if (j === 1) { step = 2; drawPlan(); askSide(2); return; }
        tr.set('t.f1', 1, 1.2); tr.set('t.d1', 0.3, 0.3); await wait(0.4); tr.set('t.d1', 1, 0.4); await wait(1.0); if (!alive()) return;
        step = 3; drawPlan(); askAngle();
      });
    }
    work.replaceChildren(said(j === 1 ? 't.slant' : 't.back'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askAngle(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'Their angles are bigger, because their sides are longer', ok: false, mc: MC.armLength as string | undefined, id: 't.angle.arm' },
      { t: 'The angles are the same: the copy only got bigger', ok: true, mc: undefined, id: 't.done' },
      { t: 'Their angles are 3 times as big', ok: false, mc: MC.scalesAngles, id: 't.angle.times' },
    ];
    const box_ = h('div', { class: 'opts' });
    let done = false;
    opts.forEach(o => box_.append(btn(o.t, () => {
      if (done) return;
      box_.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box_.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'turn', item: 'turn.angle', prompt: 'Compare the corners of the copy with the sail', response: o.t, expected: 'the same', correct: o.ok, mc: o.mc });
      if (!o.ok) { fbHost.replaceChildren(fbSaid(false, o.id)); return; }
      fbHost.replaceChildren();
      done = true;
      seq(async alive => {
        tr.set('t.f0A', 1, 0.8); tr.set('t.f1A', 1, 0.8, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('t.AN', 1, 1.0); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(feedback(true, T('t.done')), callback());
      });
    })));
    work.replaceChildren(said('t.angle'), box_, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick, sure = commit().sure;
    const id = p === null ? 't.cb.none' : CARDS[p]!.cb;
    const ids = [id, ...(p !== null && sure !== null ? [`t.sure.${sure}`] : [])];
    c.innerHTML = ids.map(i => T(i)).join(' ');
    void ids.reduce((pr, i) => pr.then(() => (ctx.progress.part === 2 ? ctx.say(i) : undefined)), ctx.say('t.done'));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: always, sometimes or never? =====
function partProve(): void {
  tr.reset('p.');
  const made = ScaleGrid(SQUARES, LESSON_FRAME, th);
  const y0 = BOARD.y0;
  const B1 = line('p.B1', '\\text{2 by 2} \\xrightarrow{+2} \\text{4 by 4}', y0 + 110, 76);
  const B2 = line('p.B2', '2 \\times \\cssId{k}{2} = 4 \\text{ both ways}', y0 + 240, 72, C);
  const B3 = line('p.B3', '\\text{1 by 3} \\xrightarrow{+1} \\text{2 by 4}', y0 + 410, 76);
  const B4 = line('p.B4', '3 \\times \\cssId{k}{2} = 6 \\neq \\cssId{w}{4}', y0 + 540, 72, { ...C });
  const B5 = line('p.B5', '\\text{sometimes}', y0 + 710, 84, undefined, 'link');
  setWalk({
    pre: 'p.', m: made, lines: [B1, B2, B3, B4, B5],
    focus: () => ({
      pulse: [ring('p.', 0, 0, 'pick'), ring('p.', 1, 0, 'pick'), ring('p.', 0, 3, 'pick'), ring('p.', 1, 1, 'pick'), ring('p.', 2, 3, 'pick'), ring('p.', 3, 3, 'wrong'), ring('p.', 4, 1, 'link')],
      ring: [{ f: 1, k: tr.k('p.ring1'), col: 'link' }, { f: 3, k: tr.k('p.ring3'), col: 'wrong' }],
    }),
  });
  for (const s of ['grid', 'f0', 'f0L', 'f2', 'f2L']) tr.set('p.' + s, 1, 0.8, 0.2);

  const CHIPS = [
    { t: '2 + 2 = 4 is also 2 × 2, across and up.', fits: 0 },
    { t: '1 → 2 is × 2, so the height should be 3 × 2 = 6, not 4.', fits: 1 },
    { t: 'It works only when every side happens to be multiplied by the same factor.', fits: 2 },
    { t: 'Adding the same amount keeps the shape.', fits: -1, mc: MC.additive, say: 'p.no.add' },
    { t: 'Both copies have four right angles.', fits: -1, mc: MC.equalAngles, say: 'p.no.angles' },
    { t: 'The width doubled, so the copy is twice as big.', fits: -1, mc: MC.oneRatio, say: 'p.no.one' },
    { t: 'The 2 by 4 strip looks like a rectangle too.', fits: -1, mc: MC.looks, say: 'p.no.looks' },
  ];
  const CLAIMS = [
    'Add 2 to a 2 by 2 square: 4 by 4. That <b>is</b> a scaled copy,',
    'Add 1 to a 1 by 3 strip: 2 by 4. That is <b>not</b> a scaled copy,',
    'so Jordan’s rule works only <b class="s">sometimes</b>:',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 1, 5, 0, 4, 2, 6];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= CLAIMS.length || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.fits === filled ? undefined : ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      sayOnly(`p.c${n}`);
      seq(async alive => {
        if (n === 1) {
          tr.set('p.f1', 1, 1.4); tr.set('p.f1L', 1, 0.6, 1.0); tr.set('p.B1', 1, 0.9, 0.6); await wait(1.7); if (!alive()) return;
          await pulse('p.', [[0, 0], [1, 0], [0, 3], [1, 1]], alive); if (!alive()) return;
          tr.set('p.B2', 1, 0.9); tr.set('p.ring1', 1, 0.6);
        }
        if (n === 2) {
          tr.set('p.ring1', 0, 0.5); tr.set('p.B1:dim', 1, 0.5); tr.set('p.B2:dim', 1, 0.5);
          tr.set('p.f3', 1, 1.4); tr.set('p.f3L', 1, 0.6, 1.0); tr.set('p.B3', 1, 0.9, 0.6); await wait(1.7); if (!alive()) return;
          tr.set('p.f4', 1, 1.4); tr.set('p.f4L', 1, 0.6, 1.0); await wait(1.5); if (!alive()) return;
          await pulse('p.', [[2, 3], [3, 3], [4, 1]], alive); if (!alive()) return;
          tr.set('p.B4', 1, 0.9); tr.set('p.ring3', 1, 0.6);
        }
        if (n === 3) {
          tr.set('p.B3:dim', 1, 0.5); tr.set('p.B4:dim', 1, 0.5); tr.set('p.B1:dim', 0, 0.5);
          tr.set('p.ring1', 1, 0.6); await wait(0.6); if (!alive()) return;
          tr.set('p.B5', 1, 1.0); await wait(1.6); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fbSaid(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fbSaid(false, ch.say ?? 'p.no.other'));
  }
  const verdict = h('div', { class: 'row' });
  const VB = [
    { t: 'Always true', v: 'always', mc: MC.additive as string | undefined },
    { t: 'Sometimes true', v: 'sometimes', mc: undefined },
    { t: 'Never true', v: 'never', mc: MC.addNever },
  ];
  const vbs = VB.map(o => btn(o.t, () => judge(o)));
  verdict.append(...vbs);
  const proofHost = h('div');
  function judge(o: typeof VB[number]): void {
    vbs.forEach(b => { b.disabled = true; });
    vbs[VB.indexOf(o)]!.classList.add('on');
    const right = o.v === 'sometimes';
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: adding the same number to every side always gives a scaled copy. Always, sometimes or never?', response: o.v, expected: 'sometimes', correct: right, mc: o.mc });
    const lead = right ? said('p.build') : html('p', '', T('p.test'));
    if (!right) void ctx.say('p.test').then(() => { if (ctx.progress.part === 3) sayOnly('p.build'); });
    proofHost.replaceChildren(lead, ...(right ? [] : [html('p', 'dim', T('p.build'))]), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), said('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
const PB = box(1300, 70, 1860, 1010);
/** a board line that fits the narrower practice board */
function pline(key: string, src: string, y: number, size: number, col?: 'link' | 'ink'): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 48 && texWidth(F, s) > PB.w - 90) s -= 2;
  return { key, F, x: PB.x0 + 45, y, size: s, col };
}
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as GridItem),
  });
}
function showItem(item: GridItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const made = item.pict ? tryBlock(() => ScaleGrid(item.pict!.pic, PF, th)) : null;
  if (made && made.ok && item.pict) {
    const m = made.value, P = item.pict;
    const Tl = pline('x.T', item.board, PB.y0 + 110, 80);
    const Hs = pline('x.S', P.solve.tex || '\\,', PB.y0 + 330, 84, 'link');
    setScene({
      table: Math.min(1050, m.box.y1 + 46),
      model: c => m.draw(c, progressOf(s => tr.k('x.' + s)), { ring: P.solve.ring !== undefined ? [{ f: P.solve.ring, k: tr.k('x.ring'), col: 'link' }] : [] }),
      lines: [Tl, Hs], leads: [], boardBox: PB,
    });
    const hide = new Set(P.hide ?? []);
    picSteps(P.pic).filter(k => !hide.has(k)).forEach((k, i) => tr.set('x.' + k, 1, k === 'grid' ? 0.6 : 0.9, k === 'grid' ? 0 : 0.2 + Math.min(i, 8) * 0.12));
    tr.set('x.T', 1, 0.8, 0.4);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        for (const k of P.solve.hide ?? []) tr.set('x.' + k, 0, 0.5);
        for (const k of P.solve.show ?? []) { tr.set('x.' + k, 1, 0.9); await wait(0.45); if (!alive()) return; }
        if (P.solve.ring !== undefined) tr.set('x.ring', 1, 0.6);
        await wait(0.5); if (!alive()) return;
        if (P.solve.tex) tr.set('x.S', 1, 1.0);
      },
    };
  }
  if (made && !made.ok) console.error('enlarge-on-grids picture:', made.error);
  const big = box(300, 260, 1620, 760);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{width: walls: house copy sail corners: the same sometimes both ways by}', '\\rightarrow\\leftarrow\\uparrow\\downarrow \\xrightarrow{+2} \\neq \\times \\tfrac{1}{2}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
