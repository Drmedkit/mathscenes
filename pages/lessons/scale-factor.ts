// scale-factor.ts: "Enlarge and reduce with a scale factor (scaled copies)", grade 7 (7.G.A.1), on the lesson runtime.
//   1 The question   a 3 x 2 sticker, a copy 6 wide: how tall? cards 4 / 5 (+3) / 2 (only the width) + how sure
//   2 Worked example Match -> Find k -> Multiply -> Check on grid paper; each symbol is written beside, and linked by
//                    colour, pulses and leader lines to, the part of the picture it names; the check slides the
//                    sticker onto the copy's corner: one ray through both corners, the "+3" copy misses it
//   3 Your turn      an L-shaped logo reduced to 3 wide (k = 1/2), faded from the end: Match is given, the kid finds
//                    k, scales a side and checks the corners; the mind-change callback to part 1
//   4 Prove it       Riley's 6 x 4 photo printed 10 x 8 ("+4 to both sides"): judge, then a 4-line because-chain from
//                    reason chips (distractors = catalogue misconceptions); the picture backs every line
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/scale-factor/script.ts (panel HTML) = pages/lessons/scale-factor/voice/lines.json.
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { tex, texWidth, type Formula } from '../../src/core/tex';
import { BOARD, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ScaleGrid, type GridFocus, type ScaleGridBlock, picSteps } from '../../src/lesson/topics/scale-factor/ScaleGrid';
import { LESSON_FRAME, LOGO, PHOTO, STICKER } from '../../src/lesson/topics/scale-factor/lessonPics';
import { FAMILY_NAMES, GENS, MC, PF, type ScaleItem, valueOf } from '../../src/lesson/topics/scale-factor/items';
import { PLAN } from '../../src/lesson/topics/scale-factor/plan';
import { SCRIPT } from '../../src/lesson/topics/scale-factor/script';
import type { Pic } from '../../src/lesson/topics/scale-factor/scaleMaths';
import { explain } from '../../src/lesson/topics/scale-factor/explain';

const SLUG = 'scale-factor';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const fr = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
/** a voiced panel line: the narrator says it, the panel shows it */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id]?.h ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fbSaid = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id]?.h ?? id, extra); };

const C = { o: { col: 'first' as const }, c: { col: 'second' as const }, k: { col: 'link' as const }, a: { col: 'link' as const }, s: { col: 'link' as const } };

/** a scene: the grid model on the left, the board on the right */
interface GScene { pre: string; m: ScaleGridBlock | null; lines: Line[]; leads: Lead[]; focus?: () => GridFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setGrid(S: GScene): void {
  setScene({
    table: S.m ? Math.min(1050, S.m.box.y1 + 46) : 1080,
    model: c => { if (S.m) S.m.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const grid = (p: Pic) => ScaleGrid(p, LESSON_FRAME, th);
const jump = (pre: string, keys: string[]) => { for (const k of keys) tr.jump(pre + k, 1); };
/** the picture comes in: the paper, then the figures one after another */
function showIn(pre: string, keys: string[], delay = 0): void {
  tr.set(pre + 'grid', 1, 0.7, delay);
  keys.forEach((k, i) => tr.set(pre + k, 1, k.endsWith('L') ? 0.6 : 1.0, delay + 0.35 + i * 0.3));
}
/** a label ring that pulses while its symbol writes on */
const pulseOf = (pre: string, list: [number, number][], col?: 'pick' | 'link' | 'first' | 'second' | 'wrong'): NonNullable<GridFocus['pulse']> => list.map(([f, i]) => ({ f, i, k: tr.k(`${pre}p${f}.${i}`), col }));
async function pulse(pre: string, list: [number, number][], alive: () => boolean): Promise<void> {
  for (const [f, i] of list) void bump(`${pre}p${f}.${i}`, alive);
  await wait(1.0);
}

const CARDS = [
  { v: 5, id: MC.additive, cb: 't.cb.add' },
  { v: 4, id: '', cb: 't.cb.right' },
  { v: 2, id: MC.someSides, cb: 't.cb.some' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = grid(STICKER);
  const W = line('q.W', '\\text{width: }\\ \\cssId{o}{3} \\to \\cssId{c}{6}', BOARD.y0 + 120, 84, C);
  const Hq = line('q.Hq', '\\text{height: }\\ \\cssId{o}{2} \\to\\ ?', BOARD.y0 + 420, 84, C);
  setGrid({ pre: 'q.', m, lines: [W, Hq], leads: [] });
  showIn('q.', ['f0', 'f0L', 'f2', 'f2L', 'm0', 'k0']);
  tr.set('q.W', 1, 0.9, 1.9); tr.set('q.Hq', 1, 0.9, 2.5);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A 3 x 2 sticker, a copy 6 wide: how tall must the copy be?', response: p.v, expected: 4, correct: p.v === 4, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>squares tall</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = html('p', '', SCRIPT['q.intro']!.h), ask = html('p', '', SCRIPT['q.ask']!.h);
  setPanel(h('h2', {}, 'Make the sticker bigger'), intro, ask, cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
  void ctx.say('q.intro').then(() => { if (ctx.progress.part === 0) sayOnly('q.ask'); });
}

// ===== 2. Worked example =====
function partExample(): void {
  tr.reset('e.');
  const m = grid(STICKER);
  const y0 = BOARD.y0;
  const W = line('e.W', '\\text{width: }\\ \\cssId{o}{3} \\to \\cssId{c}{6}', y0 + 120, 84, C);
  const K = line('e.K', 'k = \\cssId{c}{6} \\div \\cssId{o}{3} = \\cssId{k}{2}', y0 + 270, 92, C);
  const Hq = line('e.Hq', '\\text{height: }\\ \\cssId{o}{2} \\to\\ ?', y0 + 420, 84, C);
  const H = line('e.H', '\\text{height: }\\ \\cssId{o}{2} \\times \\cssId{k}{2} = \\cssId{a}{4}', y0 + 420, 84, C);
  const C1 = line('e.C1', '\\tfrac{6}{3} = \\tfrac{4}{2} = 2', y0 + 590, 84, undefined, 'link');
  const C2 = line('e.C2', '\\text{6 by 5: }\\ \\tfrac{5}{2} \\neq 2', y0 + 760, 84, undefined, 'wrong');
  const leads: Lead[] = [
    { key: 'e.ldK', from: () => partOf(K, 'k'), to: () => m.L.hops[0]!.label.box, col: 'link' },
    { key: 'e.ldH', from: () => partOf(H, 'a'), to: () => m.where.label(1, 1), col: 'link' },
  ];
  setGrid({
    pre: 'e.', m, lines: [W, K, Hq, H, C1, C2], leads,
    focus: () => ({
      pulse: [...pulseOf('e.', [[0, 0], [2, 0]], 'pick'), ...pulseOf('e.', [[1, 1]], 'link'), ...pulseOf('e.', [[3, 3]], 'wrong')],
      sides: [{ f: 0, i: 0, k: tr.k('e.gm'), col: 'pick' }, { f: 2, i: 0, k: tr.k('e.gm'), col: 'pick' }, { f: 1, i: 1, k: tr.k('e.gh'), col: 'link' }],
    }),
  });
  jump('e.', ['grid', 'f0', 'f0L', 'f2', 'f2L', 'm0', 'k0', 'W', 'Hq']);

  let step = 0;
  const STEPS = [
    { t: 'Match the sides', why: 'Width goes with width, height with height.', act: 'Match' },
    { t: 'Find the scale factor', why: 'Copy ÷ original: how many times as long.', act: 'Find k' },
    { t: 'Multiply every length by k', why: 'Every length, not only the one you know.', act: 'Multiply' },
    { t: 'Check the shape', why: 'Same angles, and every length × k.', act: 'Check' },
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
        tr.set('e.gm', 1, 0.6); await pulse('e.', [[0, 0], [2, 0]], alive); if (!alive()) return;
      } else if (i === 1) {
        tr.set('e.gm', 0, 0.5);
        tr.set('e.h0', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('e.K', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.ldK', 1, 0.9);
      } else if (i === 2) {
        tr.set('e.ldK:dim', 1, 0.5); tr.set('e.K:dim', 1, 0.6); tr.set('e.W:dim', 1, 0.6);
        tr.set('e.k0', 0, 0.5); tr.set('e.m0', 0, 0.5);
        tr.set('e.f1', 1, 1.6); await wait(1.2); if (!alive()) return;
        tr.set('e.gh', 1, 0.5); tr.set('e.f1l1', 1, 0.6);
        tr.set('e.Hq', 0, 0.5); tr.set('e.H', 1, 1.0, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.ldH', 1, 0.9); await pulse('e.', [[1, 1]], alive);
      } else {
        tr.set('e.gh', 0, 0.5); tr.set('e.ldH:dim', 1, 0.5); tr.set('e.H:dim', 1, 0.6); tr.set('e.h0', 0, 0.8); tr.set('e.ldK', 0, 0.8);
        tr.set('e.f0S', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.f0A', 1, 0.6); tr.set('e.f1A', 1, 0.6, 0.2);
        tr.set('e.ray', 1, 1.4, 0.4); await wait(1.8); if (!alive()) return;
        tr.set('e.d0', 1, 0.5); tr.set('e.C1', 1, 1.0); await wait(1.8); if (!alive()) return;
        tr.set('e.f3', 1, 1.4); tr.set('e.f3L', 1, 0.6, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('e.d1', 1, 0.5); await pulse('e.', [[3, 3]], alive); if (!alive()) return;
        tr.set('e.C2', 1, 1.0); await wait(1.2);
      }
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A scaled copy multiplies every length by the same number: 2 × 2 = 4.', ok: true, mc: undefined as string | undefined, id: 'e.why.ok' },
      { t: 'Adding 3 to every side keeps the shape the same.', ok: false, mc: MC.additive, id: 'e.why.add' },
      { t: 'Only the width had to change, so the height stays 2.', ok: false, mc: MC.someSides, id: 'e.why.some' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box_.append(btn(o.t, () => {
      box_.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box_.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fbSaid(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the copy 4 squares tall, not 5?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!.h), box_, fbHost);
    void ctx.say('e.step3').then(() => { if (ctx.progress.part === 1 && !fbHost.childElementCount) sayOnly('e.why'); });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: the L-shaped logo, k = 1/2 =====
function partTurn(): void {
  tr.reset('t.');
  const m = grid(LOGO);
  const y0 = BOARD.y0;
  const W = line('t.W', '\\text{bottom: }\\ \\cssId{o}{6} \\to \\cssId{c}{3}', y0 + 120, 84, C);
  const K = line('t.K', 'k = \\cssId{c}{3} \\div \\cssId{o}{6} = \\cssId{k}{\\tfrac{1}{2}}', y0 + 280, 92, C);
  const H = line('t.H', '\\text{left: }\\ \\cssId{o}{4} \\times \\cssId{k}{\\tfrac{1}{2}} = \\cssId{a}{2}', y0 + 450, 84, C);
  const E = line('t.E', '\\text{every length} \\times \\tfrac{1}{2}', y0 + 610, 76, undefined, 'link');
  const AN = line('t.AN', '90^\\circ \\to 90^\\circ', y0 + 760, 84, undefined, 'ink');
  const leads: Lead[] = [{ key: 't.ldK', from: () => partOf(K, 'k'), to: () => m.L.hops[0]!.label.box, col: 'link' }];
  setGrid({
    pre: 't.', m, lines: [W, K, H, E, AN], leads,
    focus: () => ({
      pulse: [...pulseOf('t.', [[0, 0], [2, 0]], 'pick'), ...pulseOf('t.', [[0, 5], [1, 5]], 'link')],
      sides: [{ f: 0, i: 0, k: tr.k('t.gm'), col: 'pick' }, { f: 2, i: 0, k: tr.k('t.gm'), col: 'pick' }, { f: 0, i: 5, k: tr.k('t.gl'), col: 'pick' }],
    }),
  });
  showIn('t.', ['f0', 'f0L', 'f2', 'f2L']);

  let step = 0;
  const STEPS = [
    { t: 'Match the sides', why: 'Done for you.' },
    { t: 'Find the scale factor', why: 'Your step.' },
    { t: 'Multiply every length by k', why: 'Your step.' },
    { t: 'Check the shape', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A logo, made smaller'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.gm', 1, 0.6); await pulse('t.', [[0, 0], [2, 0]], alive); if (!alive()) return;
    tr.set('t.W', 1, 1.0); await wait(1.6); if (!alive()) return;
    tr.set('t.gm', 0, 0.5);
    step = 1; drawPlan(); askK();
  });

  function askK(): void {
    const fbHost = h('div');
    const inp = fracInput('', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      const v = r ? valueOf(r) : null;
      if (!r || !v) { fbHost.replaceChildren(feedback(false, 'Type the factor: a whole number in the first box, or a fraction in the stacked boxes.')); return; }
      const right = v.p * 2 === v.q;
      const mc = !right && v.p === 2 * v.q ? MC.inverted : !right && v.p === 3 * v.q ? MC.difference : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.k', prompt: 'Logo bottom 6, copy bottom 3: scale factor from the logo to the copy?', response: r, expected: '1/2', correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbSaid(false, mc === MC.inverted ? 't.k.inv' : mc === MC.difference ? 't.k.diff' : 't.k.other')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbSaid(true, 't.k.ok'));
      seq(async alive => {
        tr.set('t.h0', 1, 1.2); await wait(1.0); if (!alive()) return;
        tr.set('t.K', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.ldK', 1, 0.9); await wait(1.6); if (!alive()) return;
        step = 2; drawPlan(); askSide();
      });
    }
    work.replaceChildren(said('t.k'), h('div', { class: 'ans' }, h('span', { class: 'op' }, 'k ='), inp.node), h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSide(): void {
    const fbHost = h('div');
    const inp = numInput('squares', () => check());
    const ok = btn('Check', () => check(), 'go');
    tr.set('t.ldK:dim', 1, 0.5); tr.set('t.K:dim', 1, 0.6); tr.set('t.W:dim', 1, 0.6);
    tr.set('t.gl', 1, 0.6); tr.set('t.f1l5', 1, 0.6);
    function check(): void {
      const r = inp.read();
      const v = r ? valueOf(r) : null;
      if (!r || !v) { fbHost.replaceChildren(feedback(false, 'Type a number of squares.')); return; }
      const val = v.p / v.q, right = val === 2;
      const mc = right ? undefined : val === 1 ? MC.additive : val === 4 ? MC.someSides : val === 8 ? MC.reversed : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.side', prompt: 'Logo left side 4, k = 1/2: the copy side?', response: r, expected: 2, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbSaid(false, mc === MC.additive ? 't.side.add' : mc === MC.someSides ? 't.side.some' : mc === MC.reversed ? 't.side.rev' : 't.side.other')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbSaid(true, 't.side.ok'));
      seq(async alive => {
        tr.set('t.gl', 0, 0.5);
        tr.set('t.H', 1, 1.0); tr.set('t.f1a5', 1, 0.6); await pulse('t.', [[0, 5], [1, 5]], alive); if (!alive()) return;
        tr.set('t.f1', 1, 1.6); await wait(1.4); if (!alive()) return;
        for (const j of [1, 2]) { tr.set(`t.f1a${j}`, 1, 0.5); await wait(0.35); if (!alive()) return; }
        tr.set('t.E', 1, 1.0); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askAngle();
      });
    }
    work.replaceChildren(said('t.side'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askAngle(): void {
    const fbHost = h('div');
    const opts = shuffleFixed([
      { t: 'They are still right angles: angles do not change', ok: true, mc: undefined as string | undefined, id: 't.done' },
      { t: 'They are half as big, 45°, because k is ½', ok: false, mc: MC.scalesAngles, id: 't.angle.half' },
      { t: 'They are smaller, because the sides are shorter', ok: false, mc: MC.armLength, id: 't.angle.arm' },
    ]);
    const box_ = h('div', { class: 'opts' });
    let done = false;
    opts.forEach(o => box_.append(btn(o.t, () => {
      if (done) return;
      box_.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box_.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'turn', item: 'turn.angle', prompt: 'What happens to the corners of the copy?', response: o.t, correct: o.ok, mc: o.mc });
      if (!o.ok) { fbHost.replaceChildren(fbSaid(false, o.id)); return; }
      fbHost.replaceChildren();
      done = true;
      seq(async alive => {
        tr.set('t.f0A', 1, 0.8); tr.set('t.f1A', 1, 0.8, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('t.AN', 1, 1.0); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(feedback(true, SCRIPT['t.done']!.h), callback());
      });
    })));
    tr.set('t.f0A', 0.35, 0.6);
    work.replaceChildren(said('t.angle'), box_, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick, sure = commit().sure;
    const id = p === null ? 't.cb.none' : CARDS[p]!.cb;
    const ids = [id, ...(p !== null && sure !== null ? [`t.sure.${sure}`] : [])];
    c.innerHTML = ids.map(i => SCRIPT[i]!.h).join(' ');
    void ids.reduce((pr, i) => pr.then(() => (ctx.progress.part === 2 ? ctx.say(i) : undefined)), ctx.say('t.done'));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}
/** a fixed shuffle (the right option is not always first) */
function shuffleFixed<T>(xs: T[]): T[] { return [xs[1]!, xs[0]!, xs[2]!]; }

// ===== 4. Prove it: Riley's 10 x 8 print =====
function partProve(): void {
  tr.reset('p.');
  const m = grid(PHOTO);
  const y0 = BOARD.y0;
  const J0 = line('p.J0', '\\text{Riley:}', y0 + 80, 56, undefined, 'dim');
  const J = line('p.J', '6 \\times 4 \\to \\cssId{w}{10 \\times 8}', y0 + 175, 84);
  const C1 = line('p.C1', '\\text{height: }\\ \\cssId{c}{8} \\div \\cssId{o}{4} = \\cssId{k}{2}', y0 + 320, 80, C);
  const C2 = line('p.C2', '\\text{width: }\\ \\cssId{c}{10} \\div \\cssId{o}{6} = \\cssId{k}{\\tfrac{5}{3}}', y0 + 460, 80, C);
  const C3 = line('p.C3', '\\tfrac{5}{3} \\neq 2', y0 + 610, 84, undefined, 'wrong');
  const Hh = line('p.H', '\\text{scaled: }\\ \\cssId{o}{6} \\times \\cssId{k}{2} = \\cssId{s}{12}', y0 + 770, 84, C);
  setGrid({
    pre: 'p.', m, lines: [J0, J, C1, C2, C3, Hh], leads: [],
    focus: () => ({ pulse: [...pulseOf('p.', [[0, 3], [1, 3], [0, 0], [1, 0]], 'pick'), ...pulseOf('p.', [[2, 2]], 'link')] }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showIn('p.', ['f0', 'f0L', 'f1', 'f1L']);
  tr.set('p.J0', 1, 0.6, 1.6); tr.set('p.J', 1, 1.0, 1.9);

  const CHIPS = [
    { t: '8 ÷ 4 = 2: copy ÷ original.', fits: 0 },
    { t: `10 ÷ 6 = ${fr(5, 3)}, less than 2.`, fits: 1 },
    { t: 'Every length must get the same factor.', fits: 2 },
    { t: '6 × 2 = 12.', fits: 3 },
    { t: 'Adding the same amount keeps the shape.', fits: -1, mc: MC.additive, say: 'p.no.add' },
    { t: 'It looks like the same rectangle.', fits: -1, mc: MC.looks, say: 'p.no.looks' },
    { t: 'One pair of sides is enough to check.', fits: -1, mc: MC.oneRatio, say: 'p.no.one' },
  ];
  const CLAIMS = [
    'The height is multiplied by <b class="s">2</b>,',
    `but the width is multiplied by only <b class="s">${fr(5, 3)}</b>,`,
    'so the 10 × 8 print is <b>not</b> a scaled copy.',
    'A scaled print 8 in. tall would be <b class="s">12 in.</b> wide,',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [4, 1, 6, 2, 0, 5, 3];
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
    if (filled >= CLAIMS.length) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      sayOnly(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.C1', 1, 1.0); await pulse('p.', [[1, 3], [0, 3]], alive); }
        if (n === 2) { tr.set('p.C2', 1, 1.0); await pulse('p.', [[1, 0], [0, 0]], alive); }
        if (n === 3) {
          tr.set('p.C1:dim', 1, 0.5); tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.ray', 1, 1.6); await wait(1.7); if (!alive()) return;
          tr.set('p.d0', 1, 0.5); tr.set('p.C3', 1, 0.9); await wait(1.2); if (!alive()) return;
          tr.set('p.strike', 1, 0.6);
        }
        if (n === 4) {
          tr.set('p.C3:dim', 1, 0.5);
          tr.set('p.f2', 1, 1.6); await wait(1.4); if (!alive()) return;
          tr.set('p.f2L', 1, 0.6); tr.set('p.d1', 1, 0.5); tr.set('p.H', 1, 1.0); await pulse('p.', [[2, 2]], alive); if (!alive()) return;
          await wait(0.8); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fbSaid(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fbSaid(false, ch.say ?? 'p.no.other'));
  }
  const verdict = h('div', { class: 'row' });
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: 6 x 4 printed at 10 x 8 (+4 each way) is a scaled copy. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.additive : undefined });
    const lead = right ? html('p', '', SCRIPT['p.test']!.h) : said('p.build');
    if (right) void ctx.say('p.test').then(() => { if (ctx.progress.part === 3) sayOnly('p.build'); });
    proofHost.replaceChildren(lead, ...(right ? [html('p', 'dim', SCRIPT['p.build']!.h)] : []), chain, chipBox, fbHost);
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
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as ScaleItem),
  });
}
function showItem(item: ScaleItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const made = item.pict ? tryBlock(() => ScaleGrid(item.pict!.pic, PF, th)) : null;
  if (made && made.ok && item.pict) {
    const m = made.value, P = item.pict;
    const T = pline('x.T', item.board, PB.y0 + 110, 80);
    const Hs = pline('x.S', P.solve.tex || '\\,', PB.y0 + 330, 84, 'link');
    setScene({
      table: Math.min(1050, m.box.y1 + 46),
      model: c => m.draw(c, progressOf(s => tr.k('x.' + s)), { ring: P.solve.ring !== undefined ? [{ f: P.solve.ring, k: tr.k('x.ring'), col: 'link' }] : [] }),
      lines: [T, Hs], leads: [], boardBox: PB,
    });
    const hide = new Set(P.hide ?? []);
    showIn('x.', picSteps(P.pic).filter(k => k !== 'grid' && !hide.has(k) && !(k === 'm1' && hide.has('m1'))), 0);
    if (!P.pic.grid) tr.jump('x.grid', 0);
    tr.set('x.T', 1, 0.8, 0.4);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        for (const k of P.solve.hide ?? []) tr.set('x.' + k, 0, 0.5);
        for (const k of P.solve.show ?? []) { tr.set('x.' + k, 1, 0.9); await wait(0.35); if (!alive()) return; }
        if (P.solve.ring !== undefined) tr.set('x.ring', 1, 0.6);
        await wait(0.5); if (!alive()) return;
        if (P.solve.tex) tr.set('x.S', 1, 1.0);
      },
    };
  }
  if (made && !made.ok) console.error('scale-factor picture:', made.error);
  const big = box(300, 260, 1620, 760);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{width: height: bottom: left: Riley: scaled: every length}', '\\tfrac{5}{3}\\neq 90^\\circ \\to'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
