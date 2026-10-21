// rigid-transformations.ts: "Translations, reflections, and rotations" (grade 8, 8.G.A.1-3), on the lesson runtime.
//   1 The question   a puzzle tile ABC lands on A′B′C′ (a half turn about O that looks upside down): turn / flip / slide
//   2 Worked example Match the points -> Compare the order -> Find what stays fixed -> Write the rule; the picture moves
//                    first (dashed point-to-image links, round order arrows, the tracing paper turning about O), the
//                    board writes beside it; one "why a turn, not a flip?"
//   3 Your turn      a quarter turn about O, faded from the end: match + order given; the kid names the motion, picks the
//                    rule, uses it on a new point D, and says how long A′B′ is
//   4 Prove it       Maya: "(x, y) -> (2x, -y) flips it, so it is rigid: the right angle is kept"; a because-chain
//   5 Practice       all 24 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel lines: src/lesson/topics/rigid-transformations/script.ts; spoken text: rigid-transformations/voice/lines.json.
// Every answer is logged with its misconception id.
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { leader } from '../../src/lesson/annotate';
import { BOARD, bigLine, markDirty, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { MotionGrid, type GridFocus, type GridPic, type MotionGridBlock } from '../../src/lesson/topics/rigid-transformations/MotionGrid';
import { type V, applyAll, rot } from '../../src/lesson/topics/rigid-transformations/motionMaths';
import { FAMILY_NAMES, GENERATORS, MC, type MotionItem } from '../../src/lesson/topics/rigid-transformations/items';
import { PLAN } from '../../src/lesson/topics/rigid-transformations/plan';
import { SCRIPT } from '../../src/lesson/topics/rigid-transformations/script';

const SLUG = 'rigid-transformations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line */
const say = (id: string, cls = ''): HTMLElement => { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); };
const fbk = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
/** tr.set plus one more frame after the move ends (a slow machine can stop the stage loop on a frame with k < 1) */
function ts(name: string, to: number, d = 0.9, delay = 0): void { tr.set(name, to, d, delay); setTimeout(markDirty, (d + delay) * 1000 + 120); }
async function bump(key: string, alive: () => boolean): Promise<void> { ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6); }

// colour roles on the board: a = the preimage, s = the image / answer, b = the motion, w = wrong
const TAGS = { a: { col: 'first' as const }, s: { col: 'link' as const }, b: { col: 'second' as const }, w: { col: 'wrong' as const } };
const Y = (k: number) => BOARD.y0 + k;
const ABC = ['A', 'B', 'C'], ABCp = ['A′', 'B′', 'C′'];
const O: V = [0, 0];

// The grid is square and needs only the left ~1000 px, so this lesson's board is wider than the runtime's
// (coordinates such as A′(−1, −1) need the room): its own slate, line fitting and leaders that leave at its edge.
const GF = frame(36, 70, 960, 940);
const BOARD2 = box(1060, 70, 1860, 1010), BLX = BOARD2.x0 + 50, BW = BOARD2.w - 100;
/** a line of TeX on the wide board (shrinks to fit, not below 56 px) */
function bline(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 56 && texWidth(F, s) > BW) s -= 2;
  return { key, F, x: BLX, y, size: s, tags, col };
}
/** a leader from a symbol on the board to a part of the grid (drawn on as `key` goes 0 -> 1) */
interface Lead2 { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
/** a scene with the motion grid on the left and the wide board on the right */
function setGrid(pre: string, g: MotionGridBlock | null, lines: Line[], leads: Lead2[], focus?: () => GridFocus, extra?: Parameters<typeof setScene>[0]['extra']): void {
  setScene({
    table: 1080, boardBox: BOARD2, lines, leads: [],
    model: c => { if (g) g.draw(c, progressOf(s => tr.k(pre + s)), focus?.()); },
    extra: c => {
      for (const d of leads) { const k = tr.k(d.key); if (k > 0) leader(c, d.from(), d.to(), { col: d.col, k, boardX: BOARD2.x0, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') }); }
      extra?.(c);
    },
  });
}
const grid = (p: GridPic) => MotionGrid(p, GF);
/** show these steps of a picture at once (a part opened directly, or what was already on screen) */
const show = (pre: string, keys: string[]) => keys.forEach(k => tr.jump(pre + k, 1));

// the closing ")" after a coordinate answer box (the runtime's pair input has an opening lead only)
new MutationObserver(() => {
  document.querySelectorAll('.panel .ans').forEach(a => {
    const ops = a.querySelectorAll(':scope > .op');
    if (ops.length === 2 && ops[0]!.textContent?.trim().endsWith('(') && !a.querySelector('.close')) a.append(h('span', { class: 'op close' }, ')'));
  });
}).observe(document.body, { childList: true, subtree: true });

// ===== 1. The question: a half turn that looks like a flip =====
const QP: V[] = [[1, 1], [5, 1], [2, 3]];
const QQ: V[] = applyAll({ kind: 'R', c: O, deg: 180 }, QP);
const CARDS = [
  { t: 'Turn', sub: 'a rotation', ok: true, mc: '', why: '' },
  { t: 'Flip', sub: 'a reflection', ok: false, mc: MC.rotRefl, why: 'a flip reverses the order of the corners, and here it is kept' },
  { t: 'Slide', sub: 'a translation', ok: false, mc: MC.anyMove, why: 'in a slide every point moves the same way, and here they move in different directions' },
];
function partQuestion(): void {
  tr.reset('q.');
  const g = grid({ figs: [{ pts: QP, names: ABC, role: 'first' }, { pts: QQ, names: ABCp, role: 'link' }] });
  const L0 = bline('q.l0', '\\text{one single move}', Y(150), 60, undefined, 'dim');
  const L1 = bline('q.l1', '\\cssId{a}{ABC} \\to \\cssId{s}{A\'B\'C\'}', Y(270), 96, TAGS);
  const L2 = bline('q.l2', '\\text{turn, flip or slide?}', Y(430), 66);
  setGrid('q.', g, [L0, L1, L2], []);
  ts('q.grid', 1, 0.8); ts('q.f0', 1, 1.0, 0.4); ts('q.n0', 1, 0.6, 1.2); ts('q.f1', 1, 1.0, 1.4); ts('q.n1', 1, 0.6, 2.2);
  ts('q.l0', 1, 0.6, 1.6); ts('q.l1', 1, 0.9, 1.9); ts('q.l2', 1, 0.9, 2.6);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Tile ABC lands on A′B′C′ in one move: turn, flip or slide?', response: p.t, expected: 'Turn', correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>${cd.sub}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'One move, which kind?'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the same tile, worked out =====
function partExample(): void {
  tr.reset('e.');
  const g = grid({
    figs: [{ pts: QP, names: ABC, role: 'first' }, { pts: QQ, names: ABCp, role: 'link' }],
    links: QP.map((p, i) => ({ a: p, b: QQ[i]! })), center: { p: O, name: 'O' }, ghost: { fig: 0, m: { kind: 'R', c: O, deg: 180 } },
  });
  const L1 = bline('e.L1', String.raw`\cssId{a}{A, B, C} \to \cssId{s}{A', B', C'}`, Y(110), 76, TAGS);
  const L2 = bline('e.L2', String.raw`\cssId{a}{ABC} \circlearrowleft \quad \cssId{s}{A'B'C'} \circlearrowleft`, Y(240), 76, TAGS);
  const L2b = bline('e.L2b', String.raw`\text{order kept: not a flip}`, Y(335), 60, undefined, 'dim');
  const L3 = bline('e.L3', String.raw`\cssId{b}{O} \text{ halves } AA',\ BB',\ CC'`, Y(480), 68, TAGS);
  const L4 = bline('e.L4', String.raw`\text{half turn: } \cssId{b}{180^\circ \text{ about } O}`, Y(590), 70, TAGS);
  const L5 = bline('e.L5', String.raw`\cssId{a}{A(1, 1)} \to \cssId{s}{A'(-1, -1)}`, Y(750), 76, TAGS);
  const L6 = bline('e.L6', String.raw`(x, y) \to \cssId{s}{(-x, -y)}`, Y(880), 84, TAGS);
  const leads: Lead2[] = [{ key: 'e.ld5', from: () => partOf(L5, 's'), to: () => g.where.name(1, 0), col: 'link', drop: 6 }];
  setGrid('e.', g, [L1, L2, L2b, L3, L4, L5, L6], leads, () => ({
    order: [{ fig: 0, k: tr.k('e.o'), col: 'first' }, { fig: 1, k: tr.k('e.o'), col: 'link' }],
    verts: [{ fig: 0, i: 0, k: tr.k('e.vr'), col: 'pick' }, { fig: 1, i: 0, k: tr.k('e.vr'), col: 'pick' }],
    dim: [{ fig: 0, k: tr.k('e.dim') }], linkFade: tr.k('e.lf'),
  }));
  show('e.', ['grid', 'f0', 'n0', 'f1', 'n1']);

  let step = 0;
  const STEPS = [
    { t: 'Match the points', why: 'Each point and its image, by the letters.', act: 'Match them' },
    { t: 'Compare the order', why: 'Kept: a slide or a turn. Reversed: a flip.', act: 'Go round' },
    { t: 'Find what stays fixed', why: 'A center for a turn, a line for a flip.', act: 'Find it' },
    { t: 'Write the rule', why: 'One point, then every point.', act: 'Write it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
      return li;
    }));
  };
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren(say(`e.step${i}`));
    seq(async alive => {
      if (i === 0) {
        ts('e.l0', 1, 0.8); ts('e.l1', 1, 0.8, 0.3); ts('e.l2', 1, 0.8, 0.6); await wait(1.3); if (!alive()) return;
        ts('e.L1', 1, 1.1);
      } else if (i === 1) {
        ts('e.L1:dim', 1, 0.5); ts('e.o', 1, 1.4); await wait(1.4); if (!alive()) return;
        ts('e.L2', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.L2b', 1, 0.8);
      } else if (i === 2) {
        ts('e.L2:dim', 1, 0.5); ts('e.L2b:dim', 1, 0.5); ts('e.o', 0, 0.5);
        ts('e.center', 1, 0.6); await wait(0.8); if (!alive()) return;
        ts('e.L3', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.ghost', 1, 0.5); ts('e.dim', 1, 0.5); ts('e.move', 1, 2.4, 0.4); await wait(2.9); if (!alive()) return;
        ts('e.L4', 1, 1.0); await wait(0.6); if (!alive()) return;
        ts('e.ghost', 0, 0.8, 0.4); ts('e.dim', 0, 0.8, 0.4);
      } else {
        ts('e.L3:dim', 1, 0.5); ts('e.L4:dim', 1, 0.5);
        ts('e.lf', 1, 0.6);
        ts('e.vr', 1, 0.5); await wait(0.6); if (!alive()) return;
        ts('e.L5', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.ld5', 1, 0.9); await wait(2.4); if (!alive()) return;
        ts('e.ld5', 0, 0.4); ts('e.vr', 0, 0.4); ts('e.L5:dim', 1, 0.5); ts('e.L6', 1, 1.0); await wait(1.4); if (!alive()) return;
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A flip would reverse the order A → B → C. Here the order is kept.', ok: true, id: 'e.why.ok' },
      { t: 'Upside-down figures are always turns, never flips.', ok: false, mc: MC.rotRefl, id: 'e.why.flip' },
      { t: 'Every point moved the same way, like a slide.', ok: false, mc: MC.anyMove, id: 'e.why.slide' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbk(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is this a turn, and not a flip?', response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    void ctx.say('e.why');
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: a quarter turn about O (faded from the end) =====
const TP: V[] = [[2, 1], [5, 1], [2, 3]];
const TQ: V[] = applyAll({ kind: 'R', c: O, deg: 90 }, TP);
const TD: V = [4, -3], TDp: V = rot(TD, O, 90);
function partTurn(): void {
  tr.reset('t.');
  const g = grid({
    figs: [{ pts: TP, names: ABC, role: 'first' }, { pts: TQ, names: ABCp, role: 'link' }, { pts: [TD], names: ['D'], role: 'first' }, { pts: [TDp], names: ['D′'], role: 'link' }],
    links: TP.map((p, i) => ({ a: p, b: TQ[i]! })), center: { p: O, name: 'O' }, ghost: { fig: 0, m: { kind: 'R', c: O, deg: 90 } },
    turn: { c: O, from: TD, deg: 90, r: 1 }, avoid: [[O, TP[0]!], [O, TQ[0]!]],
  });
  const T1 = bline('t.T1', String.raw`\cssId{a}{A, B, C} \to \cssId{s}{A', B', C'}`, Y(100), 72, TAGS);
  const T2 = bline('t.T2', String.raw`\cssId{a}{ABC} \circlearrowleft \quad \cssId{s}{A'B'C'} \circlearrowleft \quad \text{kept}`, Y(220), 70, TAGS);
  const T3 = bline('t.T3', '\\cssId{b}{90^\\circ \\text{ ccw about } O}', Y(345), 72, TAGS);
  const T4 = bline('t.T4', '\\cssId{a}{A(2, 1)} \\to \\cssId{s}{A\'(-1, 2)}', Y(475), 68, TAGS);
  const T5 = bline('t.T5', '(x, y) \\to \\cssId{s}{(-y, x)}', Y(595), 76, TAGS);
  const T6 = bline('t.T6', '\\cssId{a}{D(4, -3)} \\to \\cssId{s}{D\'(3, 4)}', Y(735), 68, TAGS);
  const T7 = bline('t.T7', 'A\'B\' = AB = \\cssId{s}{3}', Y(875), 72, TAGS);
  const leads: Lead2[] = [{ key: 't.ld6', from: () => partOf(T6, 's'), to: () => g.where.name(3, 0), col: 'link', drop: 4 }];
  setGrid('t.', g, [T1, T2, T3, T4, T5, T6, T7], leads, () => ({
    order: [{ fig: 0, k: tr.k('t.o'), col: 'first' }, { fig: 1, k: tr.k('t.o'), col: 'link' }],
    rays: [{ from: O, to: TP[0]!, k: tr.k('t.ray'), col: 'pick' }, { from: O, to: TQ[0]!, k: tr.k('t.ray'), col: 'pick' }],
    right: [{ at: O, a: TP[0]!, b: TQ[0]!, k: tr.k('t.ray'), col: 'pick' }],
    sides: [{ fig: 0, i: 0, k: tr.k('t.side'), col: 'first' }, { fig: 1, i: 0, k: tr.k('t.side'), col: 'link' }],
    dim: [{ fig: 0, k: tr.k('t.dim') }], linkFade: tr.k('t.lf'),
  }));
  ts('t.grid', 1, 0.8); ts('t.f0', 1, 1.0, 0.4); ts('t.n0', 1, 0.6, 1.2); ts('t.f1', 1, 1.0, 1.4); ts('t.n1', 1, 0.6, 2.2);

  let step = 0;
  const STEPS = [
    { t: 'Match the points', why: 'Done for you.' },
    { t: 'Compare the order', why: 'Done for you.' },
    { t: 'Find what stays fixed', why: 'Your step.' },
    { t: 'Write the rule', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div'), given = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A quarter turn'), say('t.intro'), plan, given, work);

  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    ts('t.l0', 1, 0.7); ts('t.l1', 1, 0.7, 0.25); ts('t.l2', 1, 0.7, 0.5); ts('t.T1', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
    step = 1; drawPlan();
    given.replaceChildren(say('t.given'));
    ts('t.T1:dim', 1, 0.5); ts('t.o', 1, 1.3); ts('t.T2', 1, 1.0, 0.8); await wait(2.4); if (!alive()) return;
    step = 2; drawPlan();
    askTurn();
  });

  /** a choice step: wrong picks get their feedback and stay; the right one moves on */
  function choiceStep(promptId: string, item: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], done: () => void): void {
    const fbHost = h('div'), row = h('div', { class: 'opts' });
    const t0 = performance.now();
    opts.forEach(o => row.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item, prompt: (SCRIPT[promptId] ?? '').replace(/<[^>]+>/g, ''), response: o.t, expected: opts.find(x => x.ok)!.t, correct: o.ok, mc: o.mc, ms: Math.round(performance.now() - t0) });
      row.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      row.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; if (b.textContent === o.t) b.classList.add('right'); });
      done();
    })));
    work.replaceChildren(say(promptId), row, fbHost);
  }
  function askTurn(): void {
    ts('t.T2:dim', 1, 0.5); ts('t.o', 0, 0.6);
    choiceStep('t.turn', 'turn.motion', [
      { t: '90° clockwise about O', ok: false, id: 't.turn.reverse', mc: MC.reverse },
      { t: '90° counterclockwise about O', ok: true, id: 't.turn.ok' },
      { t: 'A reflection across the y-axis', ok: false, id: 't.turn.flip', mc: MC.rotRefl },
    ], () => seq(async alive => {
      ts('t.center', 1, 0.5); ts('t.ray', 1, 0.9, 0.3); await wait(1.3); if (!alive()) return;
      ts('t.T3', 1, 1.0); ts('t.ghost', 1, 0.5); ts('t.dim', 1, 0.5); ts('t.move', 1, 2.2, 0.4); await wait(2.8); if (!alive()) return;
      ts('t.ghost', 0, 0.7); ts('t.dim', 0, 0.7); ts('t.ray', 0, 0.6); await wait(0.6); if (!alive()) return;
      step = 3; drawPlan(); given.replaceChildren(); askRule();
    }));
  }
  function askRule(): void {
    ts('t.T3:dim', 1, 0.5); ts('t.T4', 1, 1.0);
    ts('t.lf', 1, 0.6);
    choiceStep('t.rule', 'turn.rule', [
      { t: '(x, y) → (y, x)', ok: false, id: 't.rule.swap', mc: MC.swap },
      { t: '(x, y) → (y, −x)', ok: false, id: 't.rule.reverse', mc: MC.reverse },
      { t: '(x, y) → (−y, x)', ok: true, id: 't.rule.ok' },
    ], () => seq(async alive => { ts('t.T4:dim', 1, 0.5); ts('t.T5', 1, 1.0); await wait(1.4); if (!alive()) return; askApply(); }));
  }
  function askApply(): void {
    const fbHost = h('div');
    const inp = pairInput('D′ = (', ',', () => check());
    const ok = btn('Check', () => check(), 'go');
    const t0 = performance.now();
    ts('t.f2', 1, 0.6); ts('t.n2', 1, 0.5, 0.3);
    const wrongs = [
      { v: [-3, 4], id: 't.apply.swap', mc: MC.swap },
      { v: [-3, -4], id: 't.apply.reverse', mc: MC.reverse },
      { v: [-4, -3], id: 't.apply.flip', mc: MC.rotRefl },
    ];
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Type both coordinates first.')); return; }
      const right = r.x === TDp[0] && r.y === TDp[1];
      const w = wrongs.find(x => x.v[0] === r.x && x.v[1] === r.y);
      ctx.store.log({ part: 'turn', item: 'turn.apply', prompt: 'Use (x, y) → (−y, x): where does D(4, −3) land?', response: r, expected: { kind: 'pair', x: TDp[0], y: TDp[1] }, correct: right, mc: right ? undefined : w?.mc, ms: Math.round(performance.now() - t0) });
      if (!right) { fbHost.replaceChildren(fbk(false, w ? w.id : 't.apply.miss')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.apply.ok'));
      seq(async alive => {
        ts('t.T5:dim', 1, 0.5); ts('t.turn', 1, 1.6); await wait(1.4); if (!alive()) return;
        ts('t.f3', 1, 0.6); ts('t.n3', 1, 0.5, 0.2); ts('t.T6', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        ts('t.ld6', 1, 0.9); await wait(1.6); if (!alive()) return;
        askLen();
      });
    }
    work.replaceChildren(say('t.apply'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askLen(): void {
    ts('t.ld6', 0, 0.4); ts('t.T6:dim', 1, 0.5); ts('t.side', 1, 0.6);
    choiceStep('t.len', 'turn.length', [
      { t: '3 units', ok: true, id: 't.len.ok' },
      { t: 'We have to measure it again', ok: false, id: 't.len.remeasure', mc: MC.remeasure },
      { t: 'It depends on how far it moved', ok: false, id: 't.len.moved', mc: MC.sameMove },
    ], () => seq(async alive => {
      ts('t.T7', 1, 1.0); await wait(1.4); if (!alive()) return;
      step = 4; drawPlan();
      const cb = callback(); work.append(cb); cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick === null ? null : CARDS[commit().pick ?? 0]!;
    const lead = p ? `At the start you picked <b>${p.t}</b> and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>${p.ok ? ': you were right. ' : `: but ${p.why}. `}` : '';
    c.innerHTML = lead + (SCRIPT['t.done'] ?? '');
    void ctx.say('t.done');
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Maya's stretch-and-flip (x, y) -> (2x, -y) =====
const MP: V[] = [[1, 1], [3, 1], [1, 3]];
const MQ: V[] = applyAll({ kind: 'S', c: O, sx: 2, sy: -1 }, MP);
function partProve(): void {
  tr.reset('p.');
  const g = grid({ figs: [{ pts: MP, names: ABC, role: 'first' }, { pts: MQ, names: ABCp, role: 'link' }] });
  const J1 = bline('p.J1', '\\text{Maya: } \\cssId{b}{(x, y) \\to (2x, -y)}', Y(110), 66, TAGS, 'dim');
  const J2 = bline('p.J2', '\\angle A = \\angle A\' = 90^\\circ', Y(215), 66, undefined, 'dim');
  const J3 = bline('p.J3', '\\text{so it is } \\cssId{w}{\\text{rigid}}', Y(320), 66, undefined, 'dim');
  const C1 = bline('p.C1', '\\cssId{a}{B(3, 1)} \\to \\cssId{s}{B\'(6, -1)}', Y(490), 74, TAGS);
  const C2 = bline('p.C2', '\\cssId{a}{AB = 2},\\ \\ \\cssId{w}{A\'B\' = 4}', Y(650), 76, TAGS);
  const C3 = bline('p.C3', '\\text{not a rigid motion}', Y(810), 70, undefined, 'link');
  const leads: Lead2[] = [{ key: 'p.ld1', from: () => partOf(C1, 's'), to: () => g.where.name(1, 1), col: 'link', drop: 6 }];
  setGrid('p.', g, [J1, J2, J3, C1, C2, C3], leads, () => ({
    right: [{ at: MP[0]!, a: MP[1]!, b: MP[2]!, k: tr.k('p.ra'), col: 'pick' }, { at: MQ[0]!, a: MQ[1]!, b: MQ[2]!, k: tr.k('p.ra'), col: 'pick' }],
    verts: [{ fig: 0, i: 1, k: tr.k('p.vb'), col: 'pick' }, { fig: 1, i: 1, k: tr.k('p.vb'), col: 'pick' }],
    sides: [{ fig: 0, i: 0, k: tr.k('p.sd'), col: 'first' }, { fig: 1, i: 0, k: tr.k('p.sd'), col: 'wrong' }],
  }), c => {
    const ks = tr.k('p.strike');
    if (ks > 0) { const b = partOf(J3, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
  });
  ts('p.grid', 1, 0.8); ts('p.f0', 1, 1.0, 0.4); ts('p.n0', 1, 0.6, 1.2); ts('p.f1', 1, 1.0, 1.6); ts('p.n1', 1, 0.6, 2.4);
  ts('p.J1', 1, 0.9, 2.6); ts('p.ra', 1, 0.8, 3.2); ts('p.J2', 1, 0.8, 3.4); ts('p.J3', 1, 0.8, 4.0);

  const CHIPS = [
    { t: 'The rule doubles every x and flips the sign of every y.', fits: 0 },
    { t: 'Both sides run along grid lines: count the squares.', fits: 1 },
    { t: 'A rigid motion keeps every length; one changed length rules it out.', fits: 2 },
    { t: 'The right angle is kept, so every measure is kept.', fits: -1, mc: MC.partial, id: 'p.chip.angle' },
    { t: 'It is the same shape, just wider.', fits: -1, mc: MC.sizeChange, id: 'p.chip.size' },
    { t: 'Every point moved the same way, so it is a slide.', fits: -1, mc: MC.anyMove, id: 'p.chip.slide' },
  ];
  const CLAIMS = [
    `B(3, 1) goes to <b class="s">B′(6, −1)</b>,`,
    `so side AB is 2 units long, but A′B′ is <b class="w">4</b> units,`,
    `so Maya’s rule is <b>not</b> a rigid motion, even with the right angle kept,`,
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.filter(i => !used.has(i)).map(i => btn(CHIPS[i]!.t, () => place(i))));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain();
      const n = filled;
      fbHost.replaceChildren(say(`p.c${n}`));
      seq(async alive => {
        if (n === 1) { ts('p.ra', 0, 0.5); ts('p.vb', 1, 0.6); ts('p.C1', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return; ts('p.ld1', 1, 0.9); }
        if (n === 2) { ts('p.ld1', 0, 0.4); ts('p.vb', 0, 0.4); ts('p.C1:dim', 1, 0.5); ts('p.sd', 1, 0.9); ts('p.C2', 1, 1.0, 0.6); }
        if (n === 3) {
          ts('p.C2:dim', 1, 0.5); ts('p.C3', 1, 1.0); await wait(1.2); if (!alive()) return;
          ts('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          void ctx.say('p.done');
          fbHost.replaceChildren(feedback(true, SCRIPT['p.done']!), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fbk(false, ch.id ?? 'p.chip.other'));
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Maya is right', () => judge(true)), no = btn('Maya is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Maya: (x, y) → (2x, −y) flips the triangle, so it is rigid: the right angle is kept. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.partial : undefined });
    proofHost.replaceChildren(say(right ? 'p.build.yes' : 'p.build.no'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as MotionItem),
  });
}
const STEP_KEYS = (p: GridPic): string[] => [
  'grid', ...p.figs.flatMap((_, i) => ['f' + i, 'n' + i]), ...(p.mirror ? ['mirror'] : []), ...(p.center ? ['center'] : []), ...(p.arrow ? ['arrow'] : []),
  ...(p.turn ? ['turn'] : []), ...(p.dots ?? []).map((_, i) => 'd' + i), ...(p.links ?? []).map((_, i) => 'l' + i),
];
function showItem(item: MotionItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const P = item.picture;
  const r = P ? tryBlock(() => grid(P.grid)) : null;
  if (P && r?.ok) {
    const g = r.value;
    const T = bline('x.T', item.board, Y(120), 76, TAGS);
    const tb = texBox(T.F, T.x, T.y, { size: T.size, align: 'left' });
    const W = item.work ? bline('x.W', item.work, tb.y1 + 140, 72, TAGS, 'link') : null;
    setGrid('x.', g, W ? [T, W] : [T], [], () => ({
      order: (P.order ?? []).map(f => ({ fig: f, k: tr.k('x.o'), col: f === 0 ? 'first' : 'link' })),
      rings: P.ring ? [{ p: P.ring, k: tr.k('x.ring'), col: 'link' }] : [],
      angles: (P.angles ?? []).map(a => ({ ...a, k: tr.k('x.ang'), col: 'pick' as const })),
    }));
    if (P.angles) ts('x.ang', 1, 0.8, 1.0);
    const hide = new Set(P.hide ?? []);
    const keys = STEP_KEYS(P.grid).filter(k => !hide.has(k));
    keys.forEach((k, i) => ts('x.' + k, 1, k === 'grid' ? 0.5 : 0.7, k === 'grid' ? 0 : 0.2 + Math.min(1.2, i * 0.12)));
    ts('x.T', 1, 0.8, 0.3);
    return {
      solve: async alive => {
        if (hide.has('ghost')) { ts('x.ghost', 1, 0.4); ts('x.move', 1, 1.8, 0.3); await wait(2.2); if (!alive()) return; }
        for (const k of hide) if (k !== 'ghost' && k !== 'move') ts('x.' + k, 1, 0.7);
        if (P.order?.length) ts('x.o', 1, 1.2);
        if (P.ring) ts('x.ring', 1, 0.6, 0.6);
        if (hide.has('ghost')) ts('x.ghost', 0, 0.8, 0.6);
        if (W) { ts('x.T:dim', 1, 0.5); ts('x.W', 1, 1.0, 0.3); }
      },
    };
  }
  // bare notation: the board big on a wide slate, one line per \\ row
  const rows = item.board.split('\\\\').map(r => r.trim()).filter(Boolean);
  const big = box(300, 240, 1620, 240 + Math.max(500, rows.length * 170 + 80));
  const lines = rows.length === 1 ? [bigLine('x.T', rows[0]!, big, 110)]
    : rows.map((r, i) => bigLine(i ? `x.T${i}` : 'x.T', r, box(big.x0, big.y0 + 40 + i * 170, big.x1, big.y0 + 40 + (i + 1) * 170), 100));
  setScene({ table: 1080, lines, leads: [], boardBox: big });
  lines.forEach((L, i) => ts(L.key, 1, 0.8, 0.1 + i * 0.3));
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\cssId{a}{ABC} \\to \\cssId{s}{A\'B\'C\'}', '\\circlearrowleft', '90^\\circ', '(x, y) \\to (-y, x)'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
void bump;
