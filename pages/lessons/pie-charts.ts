// pie-charts.ts: "Make a circle graph (pie chart) with percents" (grade 7, 7.RP.A.3 / 7.SP), on the lesson runtime.
//   1 The question   40 students, 10 picked pizza: how big is the pizza angle? 90° / 25° (x% as x°) / 45° (180° circle)
//   2 Worked example Name the whole -> Find the share -> Percent and degrees -> Go around; the board writes beside the
//                    circle, the angle is linked to its slice by a leader; one "why 90°, not 25°?"
//   3 Your turn      60 students' favorite sport, faded from the end: the whole and the share are given, the kid finds
//                    the percent and the angle, says where the next slice starts and picks the label
//   4 Prove it       Riley: "my totals are 100% and 360°, so my graph is right" (two labels swapped); a because-chain
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel lines: src/lesson/topics/pie-charts/script.ts; spoken text: pie-charts/voice/lines.json. Every answer is logged.
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { texBox } from '../../src/core/tex';
import { BOARD, MF, bigLine, line, markDirty, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { CircleGraph, BarGraph, type CircleBlock, type CircleFocus, type CircleParams } from '../../src/lesson/topics/pie-charts/CircleGraph';
import { drawWords } from '../../src/lesson/words';
import { FAMILY_NAMES, GENERATORS, MC, type PieItem } from '../../src/lesson/topics/pie-charts/items';
import { PLAN } from '../../src/lesson/topics/pie-charts/plan';
import { explain } from '../../src/lesson/topics/pie-charts/explain';
import { SCRIPT } from '../../src/lesson/topics/pie-charts/script';
import type { Cat } from '../../src/lesson/topics/pie-charts/pieMaths';

const SLUG = 'pie-charts';
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

const LUNCH: Cat[] = [{ name: 'Pizza', count: 10 }, { name: 'Tacos', count: 14 }, { name: 'Salad', count: 6 }, { name: 'Pasta', count: 10 }];
const SPORT: Cat[] = [{ name: 'Soccer', count: 21 }, { name: 'Basketball', count: 15 }, { name: 'Football', count: 12 }, { name: 'Hockey', count: 12 }];
const TAGS = { n: { col: 'first' as const }, f: { col: 'second' as const }, fc: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const } };
const fr = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;

/** the data table in the panel (row `hl` lit in the part colour) */
function dataTable(cats: readonly Cat[], hl = -1, total = 'Total'): HTMLElement {
  const n = cats.reduce((s, c) => s + c.count, 0);
  const t = h('table', { class: 'data' });
  cats.forEach((c, i) => t.append(h('tr', i === hl ? { class: 'hl' } : {}, h('td', {}, c.name), h('td', {}, String(c.count)))));
  t.append(h('tr', { class: 'tot' }, h('td', {}, total), h('td', {}, String(n))));
  return t;
}

/** a scene with a circle graph on the left and the board on the right */
interface GraphScene { pre: string; g: CircleBlock | null; lines: Line[]; leads: Lead[]; focus?: () => CircleFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null; model?: (c: Parameters<NonNullable<Parameters<typeof setScene>[0]['model']>>[0]) => void }
function setGraph(S: GraphScene): void {
  setScene({
    table: 1080,
    model: c => { if (S.g) S.g.draw(c, progressOf(s => tr.k(S.pre + s)), { rim: tr.k(S.pre + 'pW'), ...S.focus?.() }); S.model?.(c); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const graph = (p: CircleParams) => CircleGraph(p, MF, th);
const Y = (k: number) => BOARD.y0 + k;

// ===== 1. The question =====
const CARDS = [
  { t: '25°', ok: false, mc: MC.pctDeg, why: 'the percent used as degrees' },
  { t: '90°', ok: true, mc: '', why: '' },
  { t: '45°', ok: false, mc: MC.half, why: 'half a circle used as the whole' },
];
function partQuestion(): void {
  tr.reset('q.');
  const g = graph({ cats: LUNCH, labels: 'none', dots: true });
  const L0 = line('q.l0', '\\text{pizza}', Y(150), 60, undefined, 'dim');
  const L1 = line('q.l1', '\\cssId{f}{10}\\ \\text{of}\\ \\cssId{n}{40}', Y(270), 96, TAGS);
  const L2 = line('q.l2', '\\text{angle} = \\ ?^\\circ', Y(440), 88);
  setGraph({ pre: 'q.', g, lines: [L0, L1, L2], leads: [] });
  ts('q.circle', 1, 0.9); ts('q.dots', 1, 1.6, 0.5);
  ts('q.l0', 1, 0.6, 1.4); ts('q.l1', 1, 0.9, 1.6); ts('q.l2', 1, 0.9, 2.2);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '40 students, 10 picked pizza: the angle of the pizza slice?', response: p.t, expected: '90°', correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>pizza angle</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Forty lunches, one circle'), say('q.intro'), dataTable(LUNCH, 0), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the lunch survey =====
function partExample(): void {
  tr.reset('e.');
  const g = graph({ cats: LUNCH, dots: true, ring: 'quarters', title: 'Lunch choice, 40 students' });
  const L1 = line('e.L1', '\\cssId{n}{40} \\to 100\\% \\to 360^\\circ', Y(150), 72, undefined, 'first');
  const L2 = line('e.L2', '\\frac{\\cssId{f}{10}}{\\cssId{n}{40}} = \\frac{1}{4}', Y(330), 84, TAGS);
  const L3 = line('e.L3', '\\tfrac{1}{4} \\times 100\\% = \\cssId{s}{25\\%}', Y(500), 76, TAGS);
  const L4 = line('e.L4', '\\tfrac{1}{4} \\times 360^\\circ = \\cssId{s}{90^\\circ}', Y(620), 76, TAGS);
  const L5 = line('e.L5', '90 + 126 + 54 + 90', Y(790), 66);
  const L6 = line('e.L6', '= \\cssId{n}{360^\\circ}', Y(890), 76, TAGS);
  const leads: Lead[] = [{ key: 'e.ld4', from: () => partOf(L4, 's'), to: () => g.where.sector(0), col: 'link', drop: 30 }];
  setGraph({
    pre: 'e.', g, lines: [L1, L2, L3, L4, L5, L6], leads,
    focus: () => ({
      dotsOf: 0, dotsK: tr.k('e.fdots'),
      sector: 0, col: 'link', k: tr.k('e.fsec'), dim: 0.6,
      right: { sector: 0, k: tr.k('e.right'), col: '#1B1F3F' },
      arc: { a0: 90, a1: 360, k: tr.k('e.arc'), col: 'pick' },
    }),
  });
  for (const s of ['circle', 'dots']) tr.jump('e.' + s, 1);

  let step = 0;
  const STEPS = [
    { t: 'Name the whole', why: 'The circle is all 40 students: 100% and 360°.', act: 'Show the whole' },
    { t: 'Find the share', why: 'The pizza count over the total.', act: 'Find the share' },
    { t: 'Turn it into percent and degrees', why: 'The same share of 100% and of 360°.', act: 'Convert' },
    { t: 'Go around the circle', why: 'Each slice starts where the last one ended.', act: 'Draw the rest' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
  const table = dataTable(LUNCH);
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
        ts('e.ring', 1, 1.0); void bump('e.pW', alive); await wait(0.9); if (!alive()) return;
        ts('e.L1', 1, 1.1);
      } else if (i === 1) {
        table.querySelectorAll('tr')[0]!.classList.add('hl');
        ts('e.L1:dim', 1, 0.5); ts('e.fdots', 1, 0.6); await wait(0.8); if (!alive()) return;
        ts('e.L2', 1, 1.0);
      } else if (i === 2) {
        ts('e.L2:dim', 1, 0.5); ts('e.fsec', 1, 0.5); ts('e.sweep', 0.25, 1.4); await wait(1.4); if (!alive()) return;
        ts('e.right', 1, 0.5); ts('e.fdots', 0, 0.5);
        ts('e.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
        ts('e.L4', 1, 0.9); await wait(0.9); if (!alive()) return;
        ts('e.ring', 0, 0.5); ts('e.ld4', 1, 0.9, 0.3);
      } else {
        table.querySelectorAll('tr')[0]!.classList.remove('hl');
        ts('e.ld4', 0, 0.4); ts('e.L3:dim', 1, 0.5); ts('e.L4:dim', 1, 0.5); ts('e.right', 0, 0.4); ts('e.fsec', 0, 0.6);
        ts('e.dots', 0, 0.6); ts('e.ring', 0, 0.6);
        ts('e.arc', 1, 2.6, 0.3); ts('e.sweep', 1, 2.6, 0.3); await wait(2.9); if (!alive()) return;
        ts('e.arc', 0, 0.5); ts('e.L5', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.L6', 1, 0.7); ts('e.labels', 1, 0.9, 0.3); ts('e.title', 1, 0.9, 0.8); await wait(1.4); if (!alive()) return;
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Pizza is ¼ of the students, and ¼ of 360° is 90°.', ok: true, id: 'e.why.ok' },
      { t: '25% means 25 parts of the circle, so 25°.', ok: false, mc: MC.pctDeg, id: 'e.why.pctdeg' },
      { t: 'A circle is 180°, so ¼ of it is 45°.', ok: false, mc: MC.half, id: 'e.why.half' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbk(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the pizza angle 90°, not 25°?', response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    void ctx.say('e.why');
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), table, plan, sayBox, after);
}

// ===== 3. Your turn: favorite sport of 60 students (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const g = graph({ cats: SPORT, dots: true, ring: 'quarters', title: 'Favorite sport, 60 students' });
  const T1 = line('t.T1', '\\cssId{n}{60} \\to 100\\% \\to 360^\\circ', Y(150), 72, undefined, 'first');
  const T2 = line('t.T2', '\\frac{\\cssId{f}{21}}{\\cssId{n}{60}}', Y(320), 84, TAGS);
  const T3 = line('t.T3', '\\tfrac{21}{60} \\times 100\\% = \\cssId{s}{35\\%}', Y(490), 72, TAGS);
  const T4 = line('t.T4', '\\tfrac{21}{60} \\times 360^\\circ = \\cssId{s}{126^\\circ}', Y(610), 72, TAGS);
  const T5 = line('t.T5', '126 + 90 + 72 + 72', Y(790), 66);
  const T6 = line('t.T6', '= \\cssId{n}{360^\\circ}', Y(890), 76, TAGS);
  const leads: Lead[] = [{ key: 't.ld4', from: () => partOf(T4, 's'), to: () => g.where.sector(0), col: 'link', drop: 30 }];
  setGraph({
    pre: 't.', g, lines: [T1, T2, T3, T4, T5, T6], leads,
    focus: () => ({
      dotsOf: 0, dotsK: tr.k('t.fdots'), sector: 0, col: 'link', k: tr.k('t.fsec'), dim: 0.6,
      ray: { deg: 126, text: '126°', k: tr.k('t.ray'), col: 'pick' },
      arc: { a0: 126, a1: 360, k: tr.k('t.arc'), col: 'pick' },
    }),
  });
  ts('t.circle', 1, 0.9); ts('t.dots', 1, 1.4, 0.4);

  let step = 0;
  const STEPS = [
    { t: 'Name the whole', why: 'Done for you.' },
    { t: 'Find the share', why: 'Done for you.' },
    { t: 'Turn it into percent and degrees', why: 'Your step.' },
    { t: 'Go around the circle', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div'), given = h('div');
  const table = dataTable(SPORT);
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Sixty students, four sports'), say('t.intro'), table, plan, given, work);

  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    ts('t.ring', 1, 0.9); void bump('t.pW', alive); ts('t.T1', 1, 1.0, 0.4); await wait(1.8); if (!alive()) return;
    step = 1; drawPlan();
    table.querySelectorAll('tr')[0]!.classList.add('hl');
    ts('t.T1:dim', 1, 0.5); ts('t.fdots', 1, 0.6); ts('t.T2', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
    given.replaceChildren(say('t.given'));
    step = 2; drawPlan();
    askPct();
  });

  function numStep(promptId: string, unit: string, ans: number, wrongs: { v: number; id: string; mc: string }[], missId: string, okId: string, item: string, done: () => void): void {
    const fbHost = h('div');
    const inp = numInput(unit, () => check());
    const ok = btn('Check', () => check(), 'go');
    const t0 = performance.now();
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number first.')); return; }
      const w = wrongs.find(x => Math.abs(x.v - r.v) < 1e-6);
      const right = Math.abs(r.v - ans) < 1e-6;
      ctx.store.log({ part: 'turn', item, prompt: SCRIPT[promptId]!, response: r, expected: ans, correct: right, mc: right ? undefined : w?.mc, ms: Math.round(performance.now() - t0) });
      if (!right) { fbHost.replaceChildren(fbk(false, w ? w.id : missId)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, okId));
      done();
    }
    work.replaceChildren(say(promptId), inp.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askPct(): void {
    numStep('t.pct', '%', 35, [{ v: 21, id: 't.pct.fixed', mc: MC.fixed }, { v: 0.35, id: 't.pct.noscale', mc: MC.noScale }], 't.pct.miss', 't.pct.ok', 'turn.percent', () => {
      seq(async alive => { ts('t.T2:dim', 1, 0.5); ts('t.T3', 1, 1.0); await wait(1.6); if (!alive()) return; askDeg(); });
    });
  }
  function askDeg(): void {
    const prev = work.querySelector('.fb');
    numStep('t.deg', '°', 126, [{ v: 35, id: 't.deg.pctdeg', mc: MC.pctDeg }, { v: 63, id: 't.deg.half', mc: MC.half }, { v: 7560, id: 't.deg.times', mc: MC.times360 }], 't.deg.miss', 't.deg.ok', 'turn.angle', () => {
      seq(async alive => {
        ts('t.T3:dim', 1, 0.5); ts('t.fdots', 0, 0.5); ts('t.fsec', 1, 0.5); ts('t.sweep', 0.25, 1.6); await wait(1.6); if (!alive()) return;
        ts('t.T4', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.ring', 0, 0.5); ts('t.ld4', 1, 0.9, 0.3); await wait(1.4); if (!alive()) return;
        step = 3; drawPlan(); askNext();
      });
    });
    void prev;
  }
  function askNext(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'At 126°, where soccer ends', ok: true, id: 't.next.ok' },
      { t: 'At 0°, the top of the circle again', ok: false, id: 't.next.no', mc: MC.sameRadius },
    ];
    const row = h('div', { class: 'opts' });
    opts.forEach(o => row.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item: 'turn.next', prompt: SCRIPT['t.next']!, response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      row.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        ts('t.ld4', 0, 0.4); ts('t.T4:dim', 1, 0.5); ts('t.fsec', 0, 0.6); ts('t.dots', 0, 0.6);
        ts('t.ray', 1, 0.6); await wait(1.2); if (!alive()) return;
        ts('t.ray', 0, 0.5); ts('t.ring', 0, 0.6); ts('t.arc', 1, 2.4); ts('t.sweep', 1, 2.4); await wait(2.6); if (!alive()) return;
        ts('t.arc', 0, 0.5); ts('t.T5', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.T6', 1, 0.7); await wait(0.9); if (!alive()) return;
        askLabel();
      });
    })));
    work.replaceChildren(say('t.next'), row, fbHost);
  }
  function askLabel(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'Soccer 126°', ok: false, id: 't.label.deg', mc: MC.rawLabel },
      { t: 'Soccer 35%', ok: true, id: 't.label.ok' },
      { t: 'Soccer 21', ok: false, id: 't.label.count', mc: MC.rawLabel },
    ];
    const row = h('div', { class: 'opts' });
    opts.forEach(o => row.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item: 'turn.label', prompt: SCRIPT['t.label']!, response: o.t, expected: 'Soccer 35%', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      row.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      table.querySelectorAll('tr')[0]!.classList.remove('hl');
      row.remove(); given.replaceChildren();
      seq(async alive => {
        ts('t.labels', 1, 0.9); ts('t.title', 1, 0.9, 0.4); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan();
        const cb = callback(); fbHost.append(cb); cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    })));
    work.replaceChildren(say('t.label'), row, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick === null ? null : CARDS[commit().pick ?? 1]!;
    const lead = p ? `At the start you picked ${p.t} and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>${p.ok ? ': you were right. ' : `: ${p.t} was ${p.why}. `}` : '';
    c.innerHTML = lead + (SCRIPT['t.done'] ?? '');
    void ctx.say('t.done');
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley's graph (pizza and tacos labels swapped) =====
function partProve(): void {
  tr.reset('p.');
  const g = graph({ cats: LUNCH, labelAt: [1, 0, 2, 3], title: 'Lunch choice, 40 students' });
  const J1 = line('p.J1', '\\text{Riley: total } 100\\%', Y(110), 64, undefined, 'dim');
  const J2 = line('p.J2', '\\text{total } 360^\\circ', Y(200), 64, undefined, 'dim');
  const J3 = line('p.J3', '\\text{so it is } \\cssId{w}{\\text{right}}', Y(290), 64, undefined, 'dim');
  const C1 = line('p.C1', '\\tfrac{\\cssId{f}{14}}{\\cssId{n}{40}} \\times 360^\\circ = \\cssId{s}{126^\\circ}', Y(470), 76, TAGS);
  const C2 = line('p.C2', '\\text{Tacos label: } \\cssId{w}{90^\\circ}', Y(640), 72, TAGS);
  const C3 = line('p.C3', '\\text{labels swapped}', Y(810), 72, undefined, 'link');
  const leads: Lead[] = [{ key: 'p.ld1', from: () => partOf(C1, 's'), to: () => g.where.sector(1), col: 'link', drop: 34 }];
  setGraph({
    pre: 'p.', g, lines: [J1, J2, J3, C1, C2, C3], leads,
    focus: () => ({
      ghost: { a0: 90, a1: 216, col: 'link', k: tr.k('p.ghost') },
      sector: 0, col: 'wrong', k: tr.k('p.f2'), dim: 0.5,
      right: { sector: 0, k: tr.k('p.right'), col: '#1B1F3F' },
      unswap: tr.k('p.unswap'),
    }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J3, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  ts('p.circle', 1, 0.9); ts('p.sweep', 1, 2.0, 0.4); ts('p.labels', 1, 0.8, 2.2); ts('p.title', 1, 0.8, 2.4);
  ts('p.J1', 1, 0.9, 2.6); ts('p.J2', 1, 0.8, 3.2); ts('p.J3', 1, 0.8, 3.8);

  const CHIPS = [
    { t: '14 of 40 is 35%, and 35% of 360° is 126°.', fits: 0 },
    { t: 'Its two edges make a right angle: a quarter of the circle.', fits: 1 },
    { t: 'Swapping two labels changes no total, so the totals can’t catch it.', fits: 2 },
    { t: 'The angles add up to 360°, so every slice must be right.', fits: -1, mc: MC.byAnswer, id: 'p.chip.total' },
    { t: '25% of the circle is a 25° angle.', fits: -1, mc: MC.pctDeg, id: 'p.chip.pctdeg' },
    { t: 'A bigger circle would make the Tacos slice a bigger share.', fits: -1, mc: MC.radius, id: 'p.chip.radius' },
  ];
  const CLAIMS = [
    `Tacos is 14 of the 40 students, so its slice must be <b class="s">126°</b>,`,
    `but the slice with Riley’s Tacos label is only <b class="w">90°</b>,`,
    `so the totals are right, but the graph is <b>wrong</b>,`,
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
        if (n === 1) { ts('p.C1', 1, 1.0); ts('p.ghost', 1, 1.2, 0.6); await wait(1.4); if (!alive()) return; ts('p.ld1', 1, 0.9); }
        if (n === 2) {
          ts('p.ld1', 0, 0.4); ts('p.C1:dim', 1, 0.5); ts('p.f2', 1, 0.5); ts('p.right', 1, 0.6, 0.3); ts('p.C2', 1, 1.0, 0.5);
        }
        if (n === 3) {
          ts('p.C2:dim', 1, 0.5); ts('p.f2', 0, 0.5); ts('p.right', 0, 0.4); ts('p.ghost', 0, 0.6);
          ts('p.unswap', 1, 1.6, 0.3); await wait(1.9); if (!alive()) return;
          ts('p.C3', 1, 1.0); await wait(1.0); if (!alive()) return;
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
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: totals 100% and 360°, so my graph is right. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.byAnswer : undefined });
    proofHost.replaceChildren(say(right ? 'p.build.yes' : 'p.build.no'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), html('p', 'dim', `The data: ${LUNCH.map(c => `${c.name} ${c.count}`).join(' · ')} · total 40`), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as PieItem),
  });
}
/** the item's board: its TeX at the top of the board (a table keeps its top edge), the worked line under it */
function boardLines(item: PieItem): { T: Line; W: Line | null } {
  const T = line('x.T', item.board, Y(120), item.board.includes('array') ? 60 : 84, TAGS);
  const tb = texBox(T.F, T.x, T.y, { size: T.size, align: 'left' });
  if (item.board.includes('array')) T.y += Y(50) - tb.y0;
  const top = item.board.includes('array') ? tb.y1 + (Y(50) - tb.y0) : tb.y1;
  const W = item.work ? line('x.W', item.work, Math.min(BOARD.y1 - 90, top + 130), 72, TAGS) : null;
  return { T, W };
}
function showItem(item: PieItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const P = item.picture;
  const { T, W } = boardLines(item);
  const lines = W ? [T, W] : [T];
  if (P?.kind === 'graph') {
    const base: CircleParams = { cats: P.cats, n: P.n, angles: P.angles, start: P.start, labels: P.labels, labelAt: P.labelAt, title: P.title, ring: P.ring, gap: P.gap, plain: P.plain };
    const r1 = tryBlock(() => graph(base));
    const r2 = r1.ok ? r1 : tryBlock(() => graph({ ...base, labels: 'none', title: undefined }));
    const g = r2.ok ? r2.value : null;
    if (g) {
      const live = g.angles.filter(a => a > 0).length;
      const f = P.focus;
      // the leader ends at the slice, or at its label when the label sits on the board side (never through a label)
      const toLabel = f !== undefined && P.labels !== 'none' && g.where.label(f).cx > g.where.circle.cx + 40;
      const reach = f !== undefined && !P.ring && (toLabel || g.where.sector(f).cx > g.where.circle.cx + 20);
      const leads: Lead[] = W && f !== undefined && reach && W.F.tags.includes('s') ? [{ key: 'x.ld', from: () => partOf(W, 's'), to: () => (toLabel ? g.where.label(f) : g.where.sector(f)), col: 'link', drop: 34 }] : [];
      setGraph({
        pre: 'x.', g, lines, leads,
        focus: () => ({
          sector: f, col: 'link', k: tr.k('x.fsec'), dim: 0.5,
          reveal: P.reveal ? { text: P.reveal, k: tr.k('x.reveal') } : undefined,
          ray: P.ray ? { deg: P.ray.deg, text: P.ray.text, k: tr.k('x.ray'), col: 'pick' } : undefined,
        }),
      });
      const shown = P.show === undefined ? 1 : P.show / Math.max(1, live);
      ts('x.circle', 1, 0.6); ts('x.ring', 1, 0.6, 0.2); ts('x.sweep', shown, 1.0, 0.2); ts('x.labels', 1, 0.6, 0.9); ts('x.title', 1, 0.6, 0.9);
      if (P.ray) ts('x.ray', 1, 0.6, 1.0);
      if (P.show === undefined && f !== undefined && item.family !== 'audit') ts('x.fsec', 0.55, 0.6, 1.0);
      ts('x.T', 1, 0.8, 0.3);
      return {
        solve: async alive => {
          if (P.show !== undefined && f !== undefined) { ts('x.sweep', (f + 1) / Math.max(1, live), 1.2); await wait(1.2); if (!alive()) return; }
          ts('x.fsec', 1, 0.5);
          if (W) { ts('x.T:dim', 1, 0.5); ts('x.W', 1, 1.0); await wait(1.0); if (!alive()) return; }
          if (P.reveal) ts('x.reveal', 1, 0.6);
          if (leads.length) ts('x.ld', 1, 0.9);
        },
      };
    }
  }
  if (P?.kind === 'two') {
    const cats = [{ name: 'slice', count: P.deg }, { name: 'rest', count: 360 - P.deg }];
    const a = tryBlock(() => CircleGraph({ cats, angles: [P.deg, 360 - P.deg], labels: 'none', plain: true, start: P.startA, cx: 290, cy: 600, r: P.rA }, MF, th));
    const b = tryBlock(() => CircleGraph({ cats, angles: [P.deg, 360 - P.deg], labels: 'none', plain: true, start: P.startB, cx: 770, cy: 600, r: P.rB }, MF, th));
    if (a.ok && b.ok) {
      const A = a.value, B = b.value;
      setScene({
        table: 1080, lines, leads: [],
        model: c => {
          const pg = progressOf(s => tr.k('x.' + s)), fo: CircleFocus = { sector: 0, col: 'link', k: tr.k('x.fsec'), dim: 0 };
          A.draw(c, pg, fo); B.draw(c, pg, fo);
          drawWords(c, 'A', 290, 600 + P.rA + 70, 'ink', tr.k('x.circle'), { size: 52, align: 'center', weight: 700 });
          drawWords(c, 'B', 770, 600 + P.rB + 70, 'ink', tr.k('x.circle'), { size: 52, align: 'center', weight: 700 });
        },
      });
      ts('x.circle', 1, 0.6); ts('x.sweep', 1, 1.0, 0.2); ts('x.fsec', 1, 0.5, 1.0); ts('x.T', 1, 0.8, 0.3);
      return { solve: async () => { ts('x.T:dim', 1, 0.5); if (W) ts('x.W', 1, 1.0); } };
    }
  }
  if (P?.kind === 'bars') {
    const bg = tryBlock(() => BarGraph(P, frame(60, 120, 1060, 880)));
    if (bg.ok) {
      setScene({ table: 1080, lines, leads: [], model: c => bg.value.draw(c, tr.k('x.bars')) });
      ts('x.bars', 1, 1.2); ts('x.T', 1, 0.8, 0.3);
      return {};
    }
  }
  // bare notation: the board line big on a wide slate
  const big = box(300, 260, 1620, 760);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{pizza}', '360^\\circ', '\\text{Riley: total } 100\\%'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
