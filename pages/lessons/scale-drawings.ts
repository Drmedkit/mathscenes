// scale-drawings.ts: "Scale drawings" (grade 7, 7.G.A.1), on the lesson runtime.
//   1 The question   a bedroom plan at 1 in : 4 ft, the long wall is 3 1/2 in: how long is the real wall?
//                    14 ft / 6 1/2 ft (the scale read as "add 3") / 7/8 ft (divided by the scale) + how sure
//   2 Worked example Read the scale -> Measure on the plan -> Multiply by the scale -> Every length, same scale; the
//                    ruler under the plan carries a second row of real feet (the legend made visible); one "why?"
//   3 Your turn      a school garden at 1 cm : 3 m, faded from the end: the kid scales the long and the short side
//                    and draws a 6 m shed (real -> plan: divide); the callback to part 1
//   4 Prove it       Sam: "6 sq in at scale 4 is 24 sq ft" (area scaled by the length factor); a because-chain, the
//                    proof picture blows one square inch up into 4 x 4 square feet
//   5 Practice       all 13 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel lines: src/lesson/topics/scale-drawings/script.ts; spoken text: scale-drawings/voice/lines.json. Every answer
// is logged with its misconception id.
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { texBox } from '../../src/core/tex';
import { BOARD, MF, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { PlanSheet, PLAN_STEPS, type PlanBlock, type PlanFocus, type PlanParams } from '../../src/lesson/topics/scale-drawings/PlanSheet';
import { EXAMPLE, PROVE, QUESTION, TURN } from '../../src/lesson/topics/scale-drawings/lessonPics';
import { FAMILY_NAMES, GENERATORS, MC, type ScaleItem } from '../../src/lesson/topics/scale-drawings/items';
import { PLAN } from '../../src/lesson/topics/scale-drawings/plan';
import { SCRIPT } from '../../src/lesson/topics/scale-drawings/script';

const SLUG = 'scale-drawings';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line */
const say = (id: string, cls = ''): HTMLElement => { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); };
const fbk = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
/** tr.set plus one more frame after the move ends (a slow machine can stop the stage loop on a frame with k < 1) */
function ts(name: string, to: number, d = 0.9, delay = 0): void { tr.set(name, to, d, delay); setTimeout(markDirty, (d + delay) * 1000 + 120); }
const TAGS = { d: { col: 'first' as const }, a: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const } };
const Y = (k: number) => BOARD.y0 + k;
const fr = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;

/** the plan on the left, the board on the right; the plan's steps are tr keys `${pre}${step}` */
interface PlanScene { pre: string; plan: PlanBlock | null; lines: Line[]; leads: Lead[]; focus?: () => PlanFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Parameters<typeof setScene>[0]['boardBox'] }
function setPlan(S: PlanScene): void {
  setScene({
    table: 1080,
    model: c => { if (S.plan) S.plan.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const plan = (p: PlanParams) => PlanSheet(p, MF);

/** a number step in the explain parts: logs every try with its misconception, voices the feedback */
function numStep(host: HTMLElement, o: {
  prompt: string; unit: string; ans: number; frac?: boolean; item: string; part: 'turn';
  wrongs: { v: number; id: string; mc?: string }[]; miss: string; ok: string; done: () => void;
}): void {
  const fbHost = h('div');
  const inp = o.frac ? fracInput(o.unit, () => check()) : numInput(o.unit, () => check());
  const okBtn = btn('Check', () => check(), 'go');
  const t0 = performance.now();
  function check(): void {
    const r = inp.read();
    const v = !r ? NaN : r.kind === 'num' ? r.v : r.kind === 'frac' ? r.w + r.n / r.d : NaN;
    if (!Number.isFinite(v)) { fbHost.replaceChildren(feedback(false, 'Type a number first.')); return; }
    const right = Math.abs(v - o.ans) < 1e-6;
    const w = o.wrongs.find(x => Math.abs(x.v - v) < 1e-6);
    ctx.store.log({ part: o.part, item: o.item, prompt: (SCRIPT[o.prompt] ?? o.prompt).replace(/<[^>]+>/g, ''), response: r, expected: o.ans, correct: right, mc: right ? undefined : w?.mc, ms: Math.round(performance.now() - t0) });
    if (!right) { fbHost.replaceChildren(fbk(false, w ? w.id : o.miss)); return; }
    okBtn.disabled = true;
    fbHost.replaceChildren(fbk(true, o.ok));
    o.done();
  }
  host.replaceChildren(say(o.prompt), inp.node, h('div', { class: 'row' }, okBtn), fbHost);
  setTimeout(() => inp.focus(), 50);
}

// ===== 1. The question =====
const CARDS = [
  { t: '14 ft', html: '14 ft', ok: true, mc: '', why: '' },
  { t: '6 1/2 ft', html: `6&#8202;${fr(1, 2)} ft`, ok: false, mc: MC.additive, why: 'the scale read as “add 3”' },
  { t: '7/8 ft', html: `${fr(7, 8)} ft`, ok: false, mc: MC.divRate, why: 'divided by the scale instead of multiplied' },
];
const CARD_ORDER = [1, 0, 2];
function partQuestion(): void {
  tr.reset('q.');
  const P = plan(QUESTION);
  const L0 = line('q.l0', '\\text{plan: } \\cssId{d}{3\\tfrac{1}{2}\\text{ in}}', Y(150), 76, TAGS);
  const L1 = line('q.l1', '\\cssId{d}{1\\text{ in}} \\to \\cssId{a}{4\\text{ ft}}', Y(300), 76, TAGS);
  const L2 = line('q.l2', '\\text{real wall} = \\ ?\\text{ ft}', Y(450), 76);
  setPlan({ pre: 'q.', plan: P, lines: [L0, L1, L2], leads: [] });
  ts('q.sheet', 1, 0.8); ts('q.legend', 1, 0.8, 0.3); ts('q.figs', 1, 1.0, 0.5); ts('q.marks', 1, 0.6, 1.2); ts('q.labels', 1, 0.7, 1.4);
  ts('q.l0', 1, 0.8, 1.6); ts('q.l1', 1, 0.8, 2.1); ts('q.l2', 1, 0.8, 2.6);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Plan at 1 in : 4 ft, wall 3 1/2 in on the plan: the real wall?', response: p.t, expected: '14 ft', correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach(b => b.classList.toggle('on', commit().pick === Number(b.dataset.i)));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  for (const i of CARD_ORDER) {
    const cd = CARDS[i]!, b = h('button', { 'data-i': String(i) });
    b.innerHTML = `<span>${cd.html}</span><small>real wall</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); });
    cards.append(b);
  }
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A wall on a floor plan'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the bedroom =====
function partExample(): void {
  tr.reset('e.');
  const P = plan(EXAMPLE);
  const E1 = line('e.E1', '\\cssId{d}{1\\text{ in}} \\to \\cssId{a}{4\\text{ ft}}', Y(130), 80, TAGS);
  const E2 = line('e.E2', '\\text{plan: } \\cssId{d}{3\\tfrac{1}{2}\\text{ in}}', Y(290), 76, TAGS);
  const E3 = line('e.E3', '3\\tfrac{1}{2} \\times 4 = \\cssId{s}{14\\text{ ft}}', Y(450), 76, TAGS);
  const E4 = line('e.E4', '2\\tfrac{1}{2} \\times 4 = \\cssId{s}{10\\text{ ft}}', Y(620), 76, TAGS);
  const E5 = line('e.E5', '\\text{angles: } 90^\\circ \\to 90^\\circ', Y(790), 66);
  const leads: Lead[] = [
    { key: 'e.ld3', from: () => partOf(E3, 's'), to: () => P.where.label2(0, 2), col: 'link', drop: 30 },
    { key: 'e.ld4', from: () => partOf(E4, 's'), to: () => P.where.label2(0, 1), col: 'link', drop: 30 },
  ];
  setPlan({
    pre: 'e.', plan: P, lines: [E1, E2, E3, E4, E5], leads,
    focus: () => ({ side: { fig: 0, side: 2, col: 'first', k: tr.k('e.wall') }, proj: tr.k('e.proj') }),
  });
  for (const s of ['sheet', 'legend', 'figs', 'labels']) tr.jump('e.' + s, 1);

  let step = 0;
  const STEPS = [
    { t: 'Read the scale', why: 'What does 1 inch on the plan stand for?', act: 'Read it' },
    { t: 'Measure on the plan', why: 'How long is the wall on paper?', act: 'Measure' },
    { t: 'Multiply by the scale', why: 'Each inch is 4 feet.', act: 'Multiply' },
    { t: 'Every length, same scale', why: 'The other wall, and the corners.', act: 'Do the rest' },
  ];
  const plan_ = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
  const drawSteps = () => {
    plan_.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
      return li;
    }));
  };
  function run(i: number): void {
    step = i + 1; drawSteps();
    sayBox.replaceChildren(say(`e.step${i}`));
    seq(async alive => {
      if (i === 0) {
        ts('e.ruler', 1, 0.8); await wait(0.6); if (!alive()) return;
        ts('e.actual', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.E1', 1, 1.0);
      } else if (i === 1) {
        ts('e.E1:dim', 1, 0.5); ts('e.wall', 1, 0.8); ts('e.proj', 1, 0.9, 0.3); await wait(1.2); if (!alive()) return;
        ts('e.seg', 1, 1.4); await wait(1.5); if (!alive()) return;
        ts('e.E2', 1, 1.0);
      } else if (i === 2) {
        ts('e.E2:dim', 1, 0.5); ts('e.proj', 0, 0.5); ts('e.E3', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.labels2', 1, 1.0); ts('e.ld3', 1, 0.9, 0.4);
      } else {
        ts('e.ld3', 0, 0.4); ts('e.E3:dim', 1, 0.5); ts('e.wall', 0, 0.5);
        ts('e.E4', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.labels2b', 1, 1.0); ts('e.ld4', 1, 0.9, 0.4); await wait(2.0); if (!alive()) return;
        ts('e.ld4', 0, 0.4); ts('e.E4:dim', 1, 0.5); ts('e.marks', 1, 0.8); ts('e.E5', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Every inch on the plan is 4 feet, so 3½ inches are 3½ × 4 feet.', ok: true, id: 'e.why.ok' },
      { t: '1 inch becomes 4 feet, that is 3 more, so add 3 to 3½.', ok: false, mc: MC.additive, id: 'e.why.add' },
      { t: 'The scale is 1 to 4, so divide 3½ by 4.', ok: false, mc: MC.divRate, id: 'e.why.div' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbk(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the real wall 14 ft, and not 6 1/2 ft?', response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    void ctx.say('e.why');
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
  }
  drawSteps();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), plan_, sayBox, after);
}

// ===== 3. Your turn: the school garden (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const P = plan(TURN);
  const T1 = line('t.T1', '\\cssId{d}{1\\text{ cm}} \\to \\cssId{a}{3\\text{ m}}', Y(130), 80, TAGS);
  const T2 = line('t.T2', '\\text{plan: } \\cssId{d}{6\\text{ cm}}', Y(280), 76, TAGS);
  const T3 = line('t.T3', '6 \\times 3 = \\cssId{s}{18\\text{ m}}', Y(430), 76, TAGS);
  const T4 = line('t.T4', '4.5 \\times 3 = \\cssId{s}{13.5\\text{ m}}', Y(590), 76, TAGS);
  const T5 = line('t.T5', '\\cssId{a}{6\\text{ m}} \\div 3 = \\cssId{s}{2\\text{ cm}}', Y(760), 76, TAGS);
  const leads: Lead[] = [
    { key: 't.ld3', from: () => partOf(T3, 's'), to: () => P.where.label2(0, 2), col: 'link', drop: 30 },
    { key: 't.ld4', from: () => partOf(T4, 's'), to: () => P.where.label2(0, 1), col: 'link', drop: 30 },
  ];
  setPlan({
    pre: 't.', plan: P, lines: [T1, T2, T3, T4, T5], leads,
    focus: () => ({ side: { fig: 0, side: tr.k('t.side1') > 0 ? 1 : 2, col: 'first', k: Math.max(tr.k('t.wall'), tr.k('t.side1')) }, proj: tr.k('t.proj') }),
  });
  ts('t.sheet', 1, 0.8); ts('t.legend', 1, 0.8, 0.3); ts('t.figs', 1, 1.0, 0.5); ts('t.labels', 1, 0.7, 1.2);

  let step = 0;
  const STEPS = [
    { t: 'Read the scale', why: 'Done for you.' },
    { t: 'Measure on the plan', why: 'Done for you.' },
    { t: 'Multiply by the scale', why: 'Your step.' },
    { t: 'Every length, same scale', why: 'Your step.' },
  ];
  const steps_ = h('ol', { class: 'plan' }), work = h('div'), given = h('div');
  const drawSteps = () => steps_.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawSteps();
  setPanel(h('h2', {}, 'A plan of the school garden'), say('t.intro'), steps_, given, work);

  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    ts('t.ruler', 1, 0.8); ts('t.actual', 1, 1.0, 0.4); ts('t.T1', 1, 1.0, 0.6); await wait(2.0); if (!alive()) return;
    step = 1; drawSteps();
    ts('t.T1:dim', 1, 0.5); ts('t.wall', 1, 0.7); ts('t.proj', 1, 0.8, 0.2); ts('t.seg', 1, 1.2, 0.8); ts('t.T2', 1, 1.0, 1.6); await wait(2.6); if (!alive()) return;
    given.replaceChildren(say('t.given'));
    step = 2; drawSteps();
    askLong();
  });
  function askLong(): void {
    numStep(work, {
      prompt: 't.long', unit: 'm', ans: 18, item: 'turn.long', part: 'turn', miss: 't.long.miss', ok: 't.long.ok',
      wrongs: [{ v: 8, id: 't.long.add', mc: MC.additive }, { v: 9, id: 't.long.add', mc: MC.additive }, { v: 2, id: 't.long.div', mc: MC.divRate }, { v: 6, id: 't.long.same', mc: MC.drawAsActual }],
      done: () => seq(async alive => {
        ts('t.T2:dim', 1, 0.5); ts('t.proj', 0, 0.5); ts('t.T3', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.labels2', 1, 1.0); ts('t.ld3', 1, 0.9, 0.3); await wait(1.8); if (!alive()) return;
        step = 3; drawSteps(); askShort();
      }),
    });
  }
  function askShort(): void {
    ts('t.ld3', 0, 0.4); ts('t.T3:dim', 1, 0.5); ts('t.wall', 0, 0.4); ts('t.side1', 1, 0.6);
    numStep(work, {
      prompt: 't.short', unit: 'm', ans: 13.5, item: 'turn.short', part: 'turn', miss: 't.short.miss', ok: 't.short.ok',
      wrongs: [{ v: 6.5, id: 't.short.add', mc: MC.additive }, { v: 7.5, id: 't.short.add', mc: MC.additive }, { v: 1.5, id: 't.short.div', mc: MC.divRate }, { v: 4.5, id: 't.long.same', mc: MC.drawAsActual }],
      done: () => seq(async alive => {
        ts('t.T4', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.labels2b', 1, 1.0); ts('t.ld4', 1, 0.9, 0.3); await wait(1.8); if (!alive()) return;
        askShed();
      }),
    });
  }
  function askShed(): void {
    ts('t.ld4', 0, 0.4); ts('t.T4:dim', 1, 0.5); ts('t.side1', 0, 0.4);
    numStep(work, {
      prompt: 't.shed', unit: 'cm', ans: 2, item: 'turn.shed', part: 'turn', miss: 't.shed.miss', ok: 't.shed.ok',
      wrongs: [{ v: 18, id: 't.shed.times', mc: MC.wrongOp }, { v: 6, id: 't.long.same', mc: MC.drawAsActual }, { v: 0.5, id: 't.shed.miss', mc: MC.reverse }],
      done: () => seq(async alive => {
        given.replaceChildren();
        ts('t.T5', 1, 1.0); ts('t.shed', 1, 1.0, 0.5); await wait(2.0); if (!alive()) return;
        step = 4; drawSteps();
        const cb = callback(); work.append(cb); cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }),
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick === null ? null : CARDS[commit().pick ?? 0]!;
    const lead = p ? `At the start you picked ${p.html} and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>${p.ok ? ': you were right. ' : `: that was ${p.why}. `}` : '';
    c.innerHTML = lead + (SCRIPT['t.done'] ?? '');
    void ctx.say('t.done');
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Sam's area =====
function partProve(): void {
  tr.reset('p.');
  const P = plan(PROVE);
  const J1 = line('p.J1', '\\text{Sam: } 6\\text{ sq in} \\times 4', Y(100), 64, undefined, 'dim');
  const J2 = line('p.J2', '= \\cssId{w}{24\\text{ sq ft}}', Y(200), 64, TAGS, 'dim');
  const C1 = line('p.C1', '\\text{real: } \\cssId{a}{12\\text{ ft}} \\times \\cssId{a}{8\\text{ ft}}', Y(370), 72, TAGS);
  const C2 = line('p.C2', '12 \\times 8 = \\cssId{s}{96\\text{ sq ft}}', Y(520), 72, TAGS);
  const C3 = line('p.C3', '1\\text{ sq in} \\to \\cssId{s}{16\\text{ sq ft}}', Y(680), 72, TAGS);
  const C4 = line('p.C4', '6 \\times 16 = \\cssId{s}{96}', Y(830), 72, TAGS);
  const leads: Lead[] = [{ key: 'p.ld3', from: () => partOf(C3, 's'), to: () => P.where.zoom, col: 'link', drop: 30 }];
  setPlan({
    pre: 'p.', plan: P, lines: [J1, J2, C1, C2, C3, C4], leads,
    focus: () => ({ fig: { fig: 0, col: 'link', k: tr.k('p.lit') } }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J2, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  ts('p.sheet', 1, 0.8); ts('p.legend', 1, 0.8, 0.3); ts('p.figs', 1, 1.0, 0.5); ts('p.marks', 1, 0.6, 1.2); ts('p.labels', 1, 0.7, 1.4);
  ts('p.J1', 1, 0.9, 1.8); ts('p.J2', 1, 0.8, 2.4);

  const CHIPS = [
    { t: 'Each inch on the plan stands for 4 ft, for every length.', fits: 0 },
    { t: 'Area is length times width.', fits: 1 },
    { t: 'One square inch stands for a 4 ft by 4 ft square: 16 sq ft.', fits: 2 },
    { t: 'Areas grow by the scale, just like lengths: × 4.', fits: -1, mc: MC.areaK, id: 'p.chip.area' },
    { t: 'The plan says 3 by 2, so the room is 3 ft by 2 ft.', fits: -1, mc: MC.drawAsActual, id: 'p.chip.plan' },
    { t: 'It works for this room, so it works for every plan.', fits: -1, mc: MC.examples, id: 'p.chip.example' },
  ];
  const CLAIMS = [
    `The real room is <b class="b">12 ft</b> by <b class="b">8 ft</b>,`,
    `so its real area is <b class="s">96 sq ft</b>, not 24,`,
    `so the area grows <b class="s">16 times</b>, not 4 times,`,
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
        if (n === 1) { ts('p.C1', 1, 1.0); ts('p.labels2', 1, 1.0, 0.6); }
        if (n === 2) { ts('p.C1:dim', 1, 0.5); ts('p.lit', 1, 0.6); ts('p.C2', 1, 1.0, 0.3); }
        if (n === 3) {
          ts('p.C2:dim', 1, 0.5); ts('p.lit', 0, 0.5); ts('p.zoom', 1, 1.6); await wait(1.4); if (!alive()) return;
          ts('p.C3', 1, 1.0); ts('p.ld3', 1, 0.9, 0.6); await wait(2.0); if (!alive()) return;
          ts('p.ld3', 0, 0.4); ts('p.C3:dim', 1, 0.5); ts('p.C4', 1, 1.0); await wait(1.2); if (!alive()) return;
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
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: 6 sq in on a 1 in : 4 ft plan is 6 x 4 = 24 sq ft. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.areaK : undefined });
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
    show: it => showItem(it as ScaleItem),
  });
}
function showItem(item: ScaleItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const T = line('x.T', item.board, Y(120), 80, TAGS);
  const tb = texBox(T.F, T.x, T.y, { size: T.size, align: 'left' });
  // the worked line; a two-part one ("a, b") is written as two lines so it never runs off the board
  const parts = item.work ? item.work.split(/,\\ /) : [];
  const Ws = parts.map((src, i) => line('x.W', src, Math.min(BOARD.y1 - 90, tb.y1 + 150 + i * 130), 72, TAGS));
  const W = Ws[0] ?? null;
  const lines = [T, ...Ws];
  const pic = item.picture;
  if (pic?.kind === 'plan') {
    const r1 = tryBlock(() => plan(pic.plan));
    const r2 = r1.ok ? r1 : tryBlock(() => plan({ ...pic.plan, figs: pic.plan.figs.map(g => ({ ...g, labels: undefined, labels2: undefined, name: undefined })) }));
    if (!r1.ok) console.warn('scale-drawings: picture without labels:', r1.error);
    const P = r2.ok ? r2.value : null;
    if (P) {
      const later = new Set(pic.solve ?? []);
      const side = pic.side;
      setPlan({
        pre: 'x.', plan: P, lines, leads: [],
        focus: () => ({ side: side ? { ...side, col: 'link', k: tr.k('x.side') } : undefined }),
      });
      let d = 0;
      for (const s of PLAN_STEPS) if (!later.has(s)) { ts('x.' + s, 1, 0.6, d); d += 0.08; }
      for (const f of pic.plan.figs) if (f.key && !later.has(f.key)) ts('x.' + f.key, 1, 0.6, 0.3);
      ts('x.T', 1, 0.8, 0.3);
      return {
        solve: async alive => {
          ts('x.T:dim', 1, 0.5);
          if (side) ts('x.side', 1, 0.6);
          if (later.has('ruler')) { ts('x.ruler', 1, 0.6); await wait(0.6); if (!alive()) return; }
          if (later.has('seg')) { ts('x.seg', 1, 1.0); await wait(1.0); if (!alive()) return; }
          if (later.has('actual')) { ts('x.actual', 1, 0.8); await wait(0.8); if (!alive()) return; }
          if (later.has('zoom')) { ts('x.zoom', 1, 1.4); await wait(1.4); if (!alive()) return; }
          for (const f of pic.plan.figs) if (f.key && later.has(f.key)) ts('x.' + f.key, 1, 0.9);
          if (later.has('labels2')) ts('x.labels2', 1, 0.9);
          if (W) ts('x.W', 1, 1.0, 0.3);
        },
      };
    }
  }
  // bare notation: the board line big on a wide slate, the worked line under it after a miss
  const big = box(300, 220, 1620, 600);
  const BL = bigLine('x.T', item.board, big, 120);
  const BW = item.work ? bigLine('x.W', item.work, box(300, 640, 1620, 900), 96) : null;
  setScene({ table: 1080, lines: BW ? [BL, BW] : [BL], leads: [], boardBox: box(300, 180, 1620, 940) });
  ts('x.T', 1, 0.8, 0.1);
  return { solve: async () => { if (BW) ts('x.W', 1, 1.0); } };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{plan: } 3\\tfrac{1}{2}\\text{ in}', '\\cssId{d}{1\\text{ in}} \\to \\cssId{a}{4\\text{ ft}}', '90^\\circ', '\\text{Scale } 1 : 48'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
