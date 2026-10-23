// coordinate-transformations.ts: "Transformations in the coordinate plane: reflect and translate" (grade 8, 8.G.A.1,
// 8.G.A.3) on the shared lesson runtime. The concept: ONE rule moves every point, and the direction of the move decides
// which coordinate changes (left / right changes x, up / down changes y; a fold across the y-axis is a sideways move).
//   1 The question   a sprite's tip A(−2, 3) slides 5 right and 4 down: where is A′? 3 cards (two misconceptions) + how sure
//   2 Worked example the whole sprite: Move it -> Follow one point -> Every vertex -> Write the rule (x + 5, y − 4);
//                    one "why?" with 3 reasons
//   3 Your turn      a logo mirrored across the y-axis, faded from the end: the fold and D are given, the kid finds F′
//                    (pair input) and builds the rule (−x, y) from chips; the mind-change callback to part 1
//   4 Prove it       Jordan: K(4, −3) across the x-axis is K′(−4, −3); a because-chain from reason chips
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts), 33 families
// The model is CoordGrid (src/lesson/topics/coordinate-transformations/CoordGrid.ts). Voiced lines: script.ts (panel
// HTML) = voice/lines.json (spoken text).
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { CoordGrid, type CGBlock, type CGFocus, type CGParams } from '../../src/lesson/topics/coordinate-transformations/CoordGrid';
import { FAMILY_NAMES, GENS, MC, type CTItem, type CTPic } from '../../src/lesson/topics/coordinate-transformations/items';
import { explain } from '../../src/lesson/topics/coordinate-transformations/explain';
import { PLAN } from '../../src/lesson/topics/coordinate-transformations/plan';
import { SCRIPT } from '../../src/lesson/topics/coordinate-transformations/script';
import { apply, type V } from '../../src/lesson/topics/coordinate-transformations/coordMaths';

const SLUG = 'coordinate-transformations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
// the narrator: one line at a time; a queue that a newer line cancels
let vq = 0;
function sayAll(ids: string[]): void { const t = ++vq; void (async () => { for (const id of ids) { if (t !== vq) return; await ctx.say(id); } })(); }
const sayOnly = (id: string) => sayAll([id]);
/** a voiced panel line: the HTML from the script; the narrator says it */
function para(id: string, cls = '', speak = true): HTMLElement { if (speak) sayOnly(id); return html('p', cls, SCRIPT[id] ?? id); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { sayOnly(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- the model and the board ----------
// the board is wider than the runtime's default slate: a mapping like K(4, −3) → K′(−4, −3) must fit on one line at
// 60 px or more. The grid gives up the room (it is limited by its height anyway).
const WIDE = box(1100, 70, 1860, 1010), WLX = WIDE.x0 + 52, BOARD_FIT = WIDE.w - 104;
const FR = frame(50, 70, 1020, 940);
const mk = (p: CGParams): CGBlock => CoordGrid(p, FR, th);
interface CGScene { pre: string; model: CGBlock | null; lines: Line[]; leads: Lead[]; focus?: () => CGFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setCG(S: CGScene): void {
  setScene({
    table: 1080,
    model: c => { if (S.model) S.model.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox === undefined ? WIDE : S.boardBox, extra: S.extra,
  });
}
/** one board line on the wide slate: it shrinks to fit, but numbers stay >= 60 px and words >= 48 px */
function one(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Line['col']): Line {
  const floor = /\d/.test(src.replace(/\cssId\{\w+\}/g, '')) ? 60 : 48;
  const F = tex(src) as Formula;
  let s = size;
  while (s - 2 >= floor && texWidth(F, s) > BOARD_FIT) s -= 2;
  if (texWidth(F, s) > BOARD_FIT) console.warn(`board line too wide (${Math.round(texWidth(F, s))} px at ${s}): ${src}`);
  return { key, F, x: WLX, y, size: s, tags, col };
}
/** board lines: ' | ' in the source starts a new line under it (all parts share the key, so they write on together) */
function lines(key: string, src: string, y: number, size: number, col?: Line['col'], gap = 92): Line[] {
  return src.split(' | ').map((s, i) => one(key, s, y + i * gap, size, undefined, col));
}
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
const Y0 = WIDE.y0;

// the sprite of parts 1 and 2: A(−2, 3), B(1, 4), C(−1, 1), slid 5 right and 4 down
const SPRITE: V[] = [[-2, 3], [1, 4], [-1, 1]];
const SLIDE = { kind: 'slide', dx: 5, dy: -4 } as const;
const sprite = () => mk({ pre: { pts: SPRITE, names: ['A', 'B', 'C'] }, move: SLIDE });
const CARDS = [
  { t: '(3, −1)', mc: '', ok: true },
  { t: '(−6, 8)', mc: MC.wrongCoord, ok: false },
  { t: '(−7, −1)', mc: MC.addMag, ok: false },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = sprite();
  const L0 = one('q.l0', `\\cssId{a}{A(-2,\\,3)}`, Y0 + 130, 84, { a: { col: 'first' } });
  const L1 = one('q.l1', `\\text{5 right, 4 down}`, Y0 + 270, 60, undefined, 'second');
  const L2 = one('q.l2', `\\cssId{a}{A'}=(\\,?\\,,\\,?\\,)`, Y0 + 420, 84, { a: { col: 'link' } });
  setCG({ pre: 'q.', model: m, lines: [L0, L1, L2], leads: [], focus: () => ({ ring: [{ fig: 'pre', i: 0, col: 'first' }], ringK: tr.k('q.ring') }) });
  tr.set('q.grid', 1, 1.2, 0.1); tr.set('q.pre', 1, 1.0, 0.9);
  tr.set('q.l0', 1, 0.8, 1.6); tr.set('q.ring', 1, 0.6, 1.8); tr.set('q.l1', 1, 0.8, 2.4); tr.set('q.l2', 1, 0.8, 3.0);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A(−2, 3) slides 5 right and 4 down: where is A′?', board: "A(-2,\\,3)\\ \\text{5 right, 4 down}\\ A'=?", response: p.t, expected: CARDS[0]!.t, correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button', {}, cd.t, h('small', {}, 'A′')); b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  sayAll(['q.intro', 'q.move', 'q.ask']);
  setPanel(
    h('h2', {}, 'Where does it land?'),
    para('q.intro', '', false), para('q.move', '', false), para('q.ask', '', false),
    cards,
    h('div', { class: 'label' }, SCRIPT['q.sure']!),
    sure,
    h('div', { class: 'row' }, goBtn),
  );
}

// the subgoal steps, the same words in parts 2 and 3
const STEP_NAMES = ['Move it', 'Follow one point', 'Every vertex', 'Write the rule'];

// ===== 2. Worked example: the whole sprite slides 5 right and 4 down =====
function partExample(): void {
  tr.reset('e.');
  const m = sprite();
  const E1 = one('e.E1', `\\text{5 right, 4 down}`, Y0 + 95, 60, undefined, 'second');
  const E2 = one('e.E2', `\\cssId{a}{A(-2,3)}\\to\\cssId{ai}{A'(3,-1)}`, Y0 + 215, 64, { a: { col: 'first' }, ai: { col: 'link' } });
  const E2x = one('e.E2', `x:\\ -2\\cssId{d}{+5}=3`, Y0 + 310, 60, { d: { col: 'second' } }, 'dim');
  const E2y = one('e.E2', `y:\\ 3\\cssId{d}{-4}=-1`, Y0 + 395, 60, { d: { col: 'second' } }, 'dim');
  const E3a = one('e.E3', `B(1,4)\\to\\cssId{bi}{B'(6,0)}`, Y0 + 525, 64, { bi: { col: 'link' } });
  const E3b = one('e.E3', `C(-1,1)\\to\\cssId{ci}{C'(4,-3)}`, Y0 + 625, 64, { ci: { col: 'link' } });
  const E4 = one('e.E4', `(x,y)\\to(x\\cssId{dx}{+5},\\,y\\cssId{dy}{-4})`, Y0 + 780, 64, { dx: { col: 'second' }, dy: { col: 'second' } }, 'link');
  const E4b = one('e.E4', `\\text{for every point}`, Y0 + 870, 48, undefined, 'dim');
  // no leader lines here: across the grid they would cross the figures; the image point lights up as its line writes
  const leads: Lead[] = [];
  setCG({
    pre: 'e.', model: m, lines: [E1, E2, E2x, E2y, E3a, E3b, E4, E4b], leads,
    focus: () => ({
      legs: 0, legsK: tr.k('e.legs'),
      ring: tr.k('e.ringB') > 0 ? [{ fig: 'img', i: 1, col: 'link' }] : tr.k('e.ringA2') > 0 ? [{ fig: 'img', i: 0, col: 'link' }] : [{ fig: 'pre', i: 0, col: 'first' }],
      ringK: Math.max(tr.k('e.ringA'), tr.k('e.ringA2'), tr.k('e.ringB')),
    }),
  });
  jump('e.', ['grid', 'pre']);

  let step = 0;
  const STEPS = [
    { why: 'Slide the whole sprite: the same move for every point.', act: 'Slide it' },
    { why: 'Track A: across first, then down.', act: 'Follow A' },
    { why: 'The same move for B and C.', act: 'Do B and C' },
    { why: 'One rule for every point.', act: 'Write it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, STEP_NAMES[i]!), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.move', 1, 2.4, 0.2); await wait(2.6); if (!alive()) return;
        tr.set('e.E1', 1, 0.9); await wait(0.9);
      } else if (i === 1) {
        tr.set('e.E1:dim', 1, 0.5); tr.set('e.ringA', 1, 0.4);
        tr.set('e.a0', 1, 1.6); await wait(1.2); if (!alive()) return;
        tr.set('e.legs', 1, 0.6); tr.set('e.d0', 1, 0.6, 0.3); await wait(0.9); if (!alive()) return;
        tr.jump('e.ringA', 0); tr.set('e.ringA2', 1, 0.4); tr.set('e.E2', 1, 1.2); await wait(1.6);
      } else if (i === 2) {
        tr.set('e.ringA2', 0, 0.4); tr.set('e.E2:dim', 1, 0.5); tr.set('e.legs', 0, 0.5);
        tr.set('e.a1', 1, 1.3); tr.set('e.d1', 1, 0.6, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.a2', 1, 1.3); tr.set('e.d2', 1, 0.6, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.E3', 1, 1.2); tr.set('e.ringB', 1, 0.5, 0.4); await wait(1.4);
      } else {
        tr.set('e.E3:dim', 1, 0.5); tr.set('e.ringB', 0, 0.4);
        tr.set('e.img', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('e.E4', 1, 1.2); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(para(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Right is across, along the x-axis: the height, y, stays the same.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Every move changes both coordinates a little.', ok: false, mc: MC.shiftBoth, id: 'e.w-both' },
      { t: 'Moving right always makes x positive.', ok: false, mc: MC.leftNeg, id: 'e.w-pos' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fb(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does “5 right” change only x?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
    sayAll(['e.s4', 'e.why']);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), para('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: a logo mirrored across the y-axis (faded from the end) =====
const LOGO: V[] = [[-5, 1], [-1, 3], [-3, -2]];
function partTurn(): void {
  tr.reset('t.');
  const mv = { kind: 'reflect', axis: 'y' } as const;
  const m = mk({ pre: { pts: LOGO, names: ['D', 'E', 'F'] }, move: mv });
  const T1 = one('t.T1', `\\text{across the }y\\text{-axis}`, Y0 + 95, 60, undefined, 'second');
  const T2 = one('t.T2', `D(-5,1)\\to\\cssId{di}{D'(5,1)}`, Y0 + 215, 64, { di: { col: 'link' } });
  const T2b = one('t.T2', `x:\\ -5\\to\\cssId{x}{5}`, Y0 + 305, 60, { x: { col: 'second' } }, 'dim');
  const T3b = one('t.T3', `F(-3,-2)\\to\\cssId{fi}{F'(3,-2)}`, Y0 + 435, 64, { fi: { col: 'link' } });
  const T3a = one('t.T3a', `E(-1,3)\\to\\cssId{ei}{E'(1,3)}`, Y0 + 535, 64, { ei: { col: 'link' } });
  const T4 = one('t.T4', `(x,y)\\to(\\cssId{r}{-x},\\,y)`, Y0 + 700, 76, { r: { col: 'second' } }, 'link');
  const T4b = one('t.T4', `\\text{across the }y\\text{-axis}`, Y0 + 795, 48, undefined, 'dim');
  setCG({
    pre: 't.', model: m, lines: [T1, T2, T2b, T3b, T3a, T4, T4b], leads: [],
    focus: () => ({ legs: tr.k('t.legsF') > 0 ? 2 : 0, legsK: Math.max(tr.k('t.legs'), tr.k('t.legsF')), ring: [{ fig: 'pre', i: 2, col: 'first' }], ringK: tr.k('t.ringF') }),
  });
  tr.set('t.grid', 1, 1.0, 0.1); tr.set('t.pre', 1, 1.0, 0.7);

  let step = 0;
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const WHY = ['Done for you.', 'Done for you.', 'Your step.', 'Your step.'];
  const drawPlan = () => plan.replaceChildren(...STEP_NAMES.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s), h('span', { class: 'why' }, WHY[i]!)))));
  drawPlan();
  setPanel(h('h2', {}, 'A mirrored logo'), para('t.intro'), plan, work);

  seq(async alive => {
    await wait(3.4); if (!alive()) return;
    tr.set('t.mirror', 1, 0.8); await wait(0.6); if (!alive()) return;
    tr.set('t.move', 1, 2.4); tr.set('t.T1', 1, 0.9, 1.2); work.replaceChildren(para('t.s1')); await wait(3.6); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.T1:dim', 1, 0.5);
    tr.set('t.a0', 1, 1.4); await wait(1.2); if (!alive()) return;
    tr.set('t.legs', 1, 0.6); tr.set('t.d0', 1, 0.6, 0.2); tr.set('t.T2', 1, 1.2, 0.4); work.replaceChildren(para('t.s2')); await wait(7.6); if (!alive()) return;
    step = 2; drawPlan();
    tr.set('t.T2:dim', 1, 0.5); tr.set('t.legs', 0, 0.5); tr.set('t.ringF', 1, 0.5);
    askF();
  });

  function askF(): void {
    const fbHost = h('div');
    const inp = pairInput('F′ = (', ',', () => check(), ')');
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Type a number in each box.')); return; }
      const is = (x: number, y: number) => r.x === x && r.y === y;
      const right = is(3, -2);
      const [id, mc] = right ? ['t.f-ok', undefined] : is(-3, 2) ? ['t.f-named', MC.named] : is(3, 2) ? ['t.f-both', MC.both] : is(-3, -2) ? ['t.f-same', MC.minus] : r.y !== -2 ? ['t.f-other', MC.diag] : ['t.f-other', undefined];
      ctx.store.log({ part: 'turn', item: 'turn.image', prompt: 'Reflect F(−3, −2) across the y-axis: F′ = ?', board: "F(-3,\\,-2)\\to F'=?", response: r, expected: { kind: 'pair', x: 3, y: -2 }, correct: right, mc });
      fbHost.replaceChildren(fb(right, id!));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ringF', 0, 0.4);
        tr.set('t.a2', 1, 1.4); await wait(1.1); if (!alive()) return;
        tr.set('t.legsF', 1, 0.6); tr.set('t.d2', 1, 0.6, 0.2); tr.set('t.T3', 1, 1.1, 0.3); await wait(2.0); if (!alive()) return;
        tr.set('t.legsF', 0, 0.5);
        tr.set('t.a1', 1, 1.2); tr.set('t.d1', 1, 0.6, 0.9); tr.set('t.T3a', 1, 1.0, 1.0); await wait(2.4); if (!alive()) return;
        step = 3; drawPlan(); askRule();
      });
    }
    work.replaceChildren(para('t.ask'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askRule(): void {
    const chips = ['x', '−x', 'y', '−y'];
    const slots: (number | null)[] = [null, null];
    const eq = h('div', { class: 'eq' });
    const chipBox = h('div', { class: 'chips rule' });
    const fbHost = h('div');
    const draw = () => {
      const slot = (i: number) => {
        const v = slots[i]; const ch = v === null || v === undefined ? null : chips[v]!;
        const s = h('button', { class: 'slot' + (ch ? ' filled b' : ''), 'aria-label': i === 0 ? 'the new x' : 'the new y' }, ch ?? '?');
        s.addEventListener('click', () => { slots[i] = null; draw(); });
        return s;
      };
      eq.replaceChildren(h('span', {}, '(x, y) → ('), slot(0), h('span', {}, ','), slot(1), h('span', {}, ')'));
      chipBox.replaceChildren(...chips.map((ch, i) => {
        const b = btn(ch, () => { const j = slots.indexOf(null); if (j < 0) return; slots[j] = i; draw(); if (!slots.includes(null)) check(); });
        if (slots.includes(i)) b.classList.add('used');
        return b;
      }));
    };
    function check(): void {
      const [a, b] = slots.map(i => (i === null ? '' : chips[i]!));
      const right = a === '−x' && b === 'y';
      let id = 't.r-ok', mc: string | undefined;
      if (!right) {
        if (!/x/.test(a!) || !/y/.test(b!)) id = 't.r-slot';
        else if (a === 'x' && b === '−y') { id = 't.r-named'; mc = MC.named; }
        else if (a === '−x' && b === '−y') { id = 't.r-both'; mc = MC.both; }
        else { id = 't.r-same'; mc = MC.arrowEq; }
      }
      ctx.store.log({ part: 'turn', item: 'turn.rule', prompt: 'Across the y-axis: (x, y) → ( ?, ? )', response: [a, b], expected: ['−x', 'y'], correct: right, mc });
      fbHost.replaceChildren(fb(right, id));
      if (!right) { setTimeout(() => { slots[0] = slots[1] = null; draw(); }, 1100); return; }
      chipBox.remove();
      seq(async alive => {
        tr.set('t.T3:dim', 1, 0.5); tr.set('t.T3a:dim', 1, 0.5);
        tr.set('t.img', 1, 1.2); tr.set('t.T4', 1, 1.1, 0.3); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan();
        const pick = commit().pick, wrongCertain = pick !== null && pick !== 0 && commit().sure === 2;
        sayAll(['t.r-ok', `t.cb-${pick ?? 0}`, ...(wrongCertain ? ['t.cb-sure'] : [])]);
        const cb = h('div', { class: 'callback' });
        cb.append(html('p', '', SCRIPT[`t.cb-${pick ?? 0}`]!));
        if (wrongCertain) cb.append(html('p', '', SCRIPT['t.cb-sure']!));
        cb.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
        fbHost.append(cb);
      });
    }
    draw();
    work.replaceChildren(para('t.rule'), eq, chipBox, fbHost);
  }
}

// ===== 4. Prove it: Jordan reflects K(4, −3) across the x-axis and writes K′(−4, −3) =====
function partProve(): void {
  tr.reset('p.');
  const K: V = [4, -3];
  const m = mk({ pre: { pts: [K], names: ['K'] }, move: { kind: 'reflect', axis: 'x' }, wrong: { pts: [[-4, -3]], names: ['Jordan'] } });
  const R0 = one('p.R0', `\\text{Jordan:}`, Y0 + 85, 50, undefined, 'dim');
  const R1 = one('p.R1', `K(4,-3)\\to\\cssId{w}{K'(-4,-3)}`, Y0 + 180, 64, { w: { col: 'wrong' } });
  const C1 = one('p.C1', `\\text{straight up or down}`, Y0 + 330, 56, undefined, 'second');
  const C2 = one('p.C2', `x\\text{ stays }\\cssId{x}{4}`, Y0 + 450, 68, { x: { col: 'pick' } });
  const C3 = one('p.C3', `y:\\ -3\\to3`, Y0 + 560, 68);
  const C4 = one('p.C3', `\\cssId{k}{K'(4,3)}`, Y0 + 680, 84, { k: { col: 'link' } });
  const C5 = one('p.C5', `(x,y)\\to(x,\\,-y)`, Y0 + 820, 68, undefined, 'link');
  setCG({
    pre: 'p.', model: m, lines: [R0, R1, C1, C2, C3, C4, C5], leads: [],
    focus: () => ({ vline: tr.k('p.vline') > 0 ? 4 : undefined, lineK: tr.k('p.vline'), legs: 0, legsK: tr.k('p.legs'), strike: tr.k('p.strike') }),
    extra: c => {
      const ks = tr.k('p.strikeB');
      if (ks > 0) { const b = partOf(R1, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.grid', 1, 1.0); tr.set('p.pre', 1, 0.8, 0.6); tr.set('p.wrong', 1, 0.8, 1.2);
  tr.set('p.R0', 1, 0.6, 1.6); tr.set('p.R1', 1, 1.0, 2.0);

  const CHIPS = [
    { t: 'The x-axis is horizontal, and a fold moves a point at a right angle to its mirror.', fits: 0 },
    { t: 'Moving straight up or down never changes how far across a point is.', fits: 1 },
    { t: 'K is 3 below the x-axis, and a reflection keeps the same distance on the other side.', fits: 2 },
    { t: 'Across the x-axis, so the x-coordinate changes sign.', fits: -1, mc: MC.named, id: 'p.w-named' },
    { t: 'A reflection changes the sign of both coordinates.', fits: -1, mc: MC.both, id: 'p.w-both' },
  ];
  const CLAIMS = ['p.k1', 'p.k2', 'p.k3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 2];
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, ''), response: ch.t, expected: CHIPS.find(c => c.fits === filled)!.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      sayAll([CLAIMS[n - 1]!, `p.c${n}`]);
      fbHost.replaceChildren(html('p', 'dim', SCRIPT[`p.c${n}`]!));
      seq(async alive => {
        if (n === 1) { tr.set('p.R1:dim', 1, 0.5); tr.set('p.R0:dim', 1, 0.5); tr.set('p.mirror', 1, 0.8); tr.set('p.a0', 1, 1.4, 0.4); tr.set('p.C1', 1, 1.0, 0.8); await wait(2.0); }
        if (n === 2) { tr.set('p.C1:dim', 1, 0.5); tr.set('p.vline', 1, 1.0); tr.set('p.C2', 1, 1.0, 0.4); await wait(1.6); }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5); tr.set('p.vline', 0.35, 0.5);
          tr.set('p.legs', 1, 0.7); tr.set('p.d0', 1, 0.7, 0.4); tr.set('p.C3', 1, 1.2, 0.5); await wait(1.9); if (!alive()) return;
          tr.set('p.strike', 1, 0.7); tr.set('p.strikeB', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
          tr.set('p.C3:dim', 1, 0.5); tr.set('p.legs', 0, 0.5); tr.set('p.C5', 1, 1.0); await wait(1.0); if (!alive()) return;
          chipBox.remove();
          sayAll(['p.k3', 'p.c3', 'p.done']);
          fbHost.replaceChildren(html('p', 'dim', SCRIPT['p.c3']!), feedback(true, SCRIPT['p.done']!), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.w-other'));
  }
  const verdict = h('div', { class: 'row' });
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: K(4, −3) reflected across the x-axis is K′(−4, −3). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.named : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(para(right ? 'p.build-yes' : 'p.build-no'), chain, chipBox, fbHost);
    drawChain();
  }
  sayAll(['p.intro', 'p.ask']);
  setPanel(h('h2', {}, 'Prove it'), para('p.intro', '', false), para('p.ask', '', false), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CTItem),
  });
}
const BIG = box(260, 260, 1660, 820);
/** the board of a bare item, big and centred on a wide slate, one line per ' | ' */
function bigLines(key: string, src: string, b: Box): Line[] {
  const parts = src.split(' | ');
  const size = parts.length > 3 ? 96 : 120, gap = size * 1.25;
  const top = b.cy - ((parts.length - 1) * gap) / 2;
  return parts.map((s, i) => bigLine(key, s, box(b.x0, top + i * gap - gap / 2, b.x1, top + i * gap + gap / 2), size));
}
/** draw a practice item: its grid and figures, the question on the board; the solution replays the picture after a miss */
function showItem(item: CTItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const n = item.board.split(' | ').length;
  const size = n > 5 ? 60 : n > 3 ? 64 : 72, gap = n > 5 ? 76 : n > 3 ? 86 : 98;
  const T = lines('x.T', item.board, WIDE.y0 + 100, size, undefined, gap);
  const H = item.hero ? lines('x.hero', item.hero, WIDE.y1 - 110, 72, 'link') : [];
  const pic: CTPic | undefined = item.pic;
  const built = pic ? tryBlock(() => mk(pic.p)) : null;
  const bare = () => { setCG({ pre: 'x.', model: null, lines: bigLines('x.T', item.board, BIG), leads: [], boardBox: BIG }); tr.set('x.T', 1, 0.8, 0.1); };
  if (!pic || !built || !built.ok) {
    if (built && !built.ok) console.warn('practice picture failed', item.id, built.error);
    bare();
    return {};
  }
  let solving = false;
  const show = (jumpAt: boolean) => {
    setCG({ pre: 'x.', model: built.value, lines: [...T, ...H], leads: [], focus: () => (solving ? { ...(pic.focus ?? {}), ...(pic.solved ?? {}) } : (pic.focus ?? {})) });
    let d = 0.1;
    for (const s of pic.at) { if (jumpAt) tr.jump('x.' + s, 1); else { tr.set('x.' + s, 1, 0.9, d); d += 0.4; } }
  };
  if (pic.at.length === 0) bare();
  else { show(false); for (const L of T) tr.set(L.key, 1, 0.8, 0.5); }
  return {
    solve: async alive => {
      if (pic.at.length === 0) { tr.reset('x.'); show(true); for (const L of T) tr.jump(L.key, 1); }
      solving = true;
      for (const L of T) tr.set(L.key + ':dim', 1, 0.5);
      for (const s of pic.solve) {
        if (tr.k('x.' + s) >= 1) tr.jump('x.' + s, 0);
        tr.set('x.' + s, 1, s === 'move' ? 1.8 : 1.0); await wait(s === 'move' ? 1.7 : 0.85); if (!alive()) return;
      }
      for (const L of H) tr.set(L.key, 1, 1.0);
    },
  };
}
// keep the image maths of the explain parts honest: the board states these images
for (const [p, q] of [[SPRITE[0]!, [3, -1]], [SPRITE[1]!, [6, 0]], [SPRITE[2]!, [4, -3]]] as [V, V][]) if (String(apply(SLIDE, p)) !== String(q)) throw new Error('the sprite image is wrong');
for (const [p, q] of [[LOGO[0]!, [5, 1]], [LOGO[1]!, [1, 3]], [LOGO[2]!, [3, -2]]] as [V, V][]) if (String(apply({ kind: 'reflect', axis: 'y' }, p)) !== String(q)) throw new Error('the logo image is wrong');

void runLesson({
  slug: SLUG,
  warm: ["A'=(\\,?\\,,\\,?\\,)", '\\text{5 right, 4 down}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
