// sampling-and-inference.ts: "Sampling and comparative inferences" (grade 7, 7.SP.A.1-2, 7.SP.B.3-4) on the lesson
// runtime. One study carries parts 1-4: Ridgeview Middle, 200 seventh graders, minutes of homework last night
// (story.ts: seeded draws, every stated number asserted).
//   1 The question   Maya's 10 names: mean 46; Leo's 10: mean 34. Conclude? (one made a mistake = mirror;
//                    both fair estimates = right; exactly 40, halfway = exact parameter) + how sure
//   2 Worked example roster -> sample -> its mean -> 20 samples -> the population mean: Name the population and the
//                    sample, Find the sample mean, Draw again and again, Check against the population; one "why?"
//   3 Your turn      samples of 40, faded from the end: step 1 given; the kid finds the mean (1,720 / 40), predicts
//                    how the means of 40 spread, reads "most within 3"; the callback to part 1
//   4 Prove it       the online poll (60 volunteers, mean 55) vs the random 40: Jordan says bigger wins. A
//                    because-chain (distractors: large sample cures bias, bias = dishonesty, samples must mirror)
//   5 Practice       all 17 sub-goals one after another, then mixed (runtime/practice.ts)
// Board: lines of words + numbers in TeX on a wider slate (the model in an 880 px frame, the slate from x = 1000),
// with local helpers for board lines and leaders (the runtime is unchanged), as in discounts.ts.
// Voiced lines: src/lesson/topics/sampling-and-inference/script.ts = pages/lessons/sampling-and-inference/voice/lines.json.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { leader } from '../../src/lesson/annotate';
import { bigLine, bump, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { Sampler, type SamplerBlock, type SamplerFocus, type SamplerParams } from '../../src/lesson/topics/sampling-and-inference/Sampler';
import { ScaleBars, type ScaleBarsBlock } from '../../src/lesson/topics/sampling-and-inference/ScaleBars';
import { Nested, type NestedBlock } from '../../src/lesson/topics/sampling-and-inference/Nested';
import { FAMILY_NAMES, GENS, picOf } from '../../src/lesson/topics/sampling-and-inference/items';
import { explain } from '../../src/lesson/topics/sampling-and-inference/explain';
import { PLAN } from '../../src/lesson/topics/sampling-and-inference/plan';
import { SCRIPT } from '../../src/lesson/topics/sampling-and-inference/script';
import {
  HALFWAY, LEO, LEO_MEAN, MAYA, MAYA_MEAN, MAYA_SUM, MEANS10, MEANS10_HI, MEANS10_LO, MEANS40, MOST10, MOST40, MU, N, POLL_CENTER,
  POLL_MEAN, POLLS, S40, S40_MEAN, S40_SUM, vals,
} from '../../src/lesson/topics/sampling-and-inference/story';
import { mad } from '../../src/lesson/topics/sampling-and-inference/samplingMaths';
import { POP } from '../../src/lesson/topics/sampling-and-inference/story';

const SLUG = 'sampling-and-inference';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** the narrator: one line at a time; a chained line only plays if nothing newer was said in between */
let sayTok = 0;
const say = (id: string): Promise<void> => { sayTok++; return ctx.say(id); };
function sayThen(a: string, b: string): void { const t = ++sayTok; void ctx.say(a).then(() => { if (t === sayTok) void say(b); }); }
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function vline(id: string, cls = '', speak = true): HTMLElement { if (speak) void say(id); return html('p', cls, SCRIPT[id] ?? id); }
const fbv = (ok: boolean, id: string, extra: Kid[] = []) => { void say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
function log(part: 'question' | 'example' | 'turn' | 'prove', subgoal: string, item: string, prompt: string, response: unknown, expected: unknown, correct: boolean | null, mc?: string, sure?: number): void {
  ctx.store.log({ part, subgoal, item, prompt, response, expected, correct, mc, sure });
}

// ---------- this page's layout: the model frame, a wider board, board lines and leaders ----------
const MFD = frame(60, 70, 880, 940);
const BD = box(1000, 70, 1860, 1010), BLX = BD.x0 + 50, BW = BD.w - 100;
const TG = { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' }, p: { col: 'pick' }, w: { col: 'ink' } } as const;
/** a board line on this page's slate (shrinks to fit, never below 60 px) */
function bline(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  if (!F.pending && texWidth(F, s) > BW + 1) console.warn(`sampling: the board line "${src}" is ${Math.round(texWidth(F, s))} px, the board has ${BW}`);
  return { key, F, x: BLX, y, size: s, tags, col };
}
interface Lead2 { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
type Block = SamplerBlock | ScaleBarsBlock | NestedBlock;
interface Model { pre: string; m: Block; focus?: () => SamplerFocus | Record<string, number> }
interface Scene2 { models: Model[]; lines: Line[]; leads: Lead2[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setModels(S: Scene2): void {
  setScene({
    table: 1040,
    model: c => {
      for (const M of S.models) {
        const prog = progressOf(s => tr.k(M.pre + s));
        if (M.m.kind === 'Sampler') M.m.draw(c, prog as never, (M.focus?.() ?? {}) as SamplerFocus);
        else M.m.draw(c, prog as never, (M.focus?.() ?? {}) as never);
      }
    },
    lines: S.lines, leads: [], boardBox: S.boardBox === undefined ? BD : S.boardBox,
    extra: c => {
      for (const d of S.leads) {
        const k = tr.k(d.key);
        if (k > 0) leader(c, d.from(), d.to(), { col: d.col, k, boardX: BD.x0, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') });
      }
      S.extra?.(c);
    },
  });
}
const jump = (pre: string, steps: readonly string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
const pulses = (pre: string, nRows: number): SamplerFocus => ({
  pRoster: tr.k(pre + 'pR'), pPop: tr.k(pre + 'pP'),
  pRows: Array.from({ length: nRows }, (_, i) => tr.k(`${pre}pr${i}`)),
  dim: Array.from({ length: nRows }, (_, i) => tr.k(`${pre}d${i}`)),
});
function plan(steps: { t: string; why: string }[]): { node: HTMLOListElement; draw(step: number, act?: { label: string; on: () => void }): void } {
  const node = h('ol', { class: 'plan' });
  return {
    node,
    draw(step, act) {
      node.replaceChildren(...steps.map((s, i) => {
        const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
        if (i === step && act) (li.lastChild as HTMLElement).append(btn(act.label, act.on, 'go'));
        return li;
      }));
    },
  };
}
function optionList(opts: { t: string; ok: boolean; id: string; mc?: string }[], onPick: (o: typeof opts[number], box: HTMLElement) => void): HTMLElement {
  const box2 = h('div', { class: 'opts' });
  opts.forEach(o => box2.append(btn(o.t, () => {
    box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
    [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
    onPick(o, box2);
  })));
  return box2;
}

// ---------- the Ridgeview pictures ----------
const AXIS = { lo: 0, hi: 100, major: 20, minor: 5, unit: 'minutes of homework' } as const;
const ROSTER = { N, label: `${N} seventh graders`, picks: MAYA };
if (MAYA_SUM / 10 !== MAYA_MEAN || HALFWAY === MU) throw new Error('the Ridgeview story does not add up');
const fmt = (x: number) => String(+x.toFixed(2));

const CARDS = [
  { t: 'One of them made a mistake. Random samples from the same school should give the same mean.', mc: 'mc.statistics.sample-should-mirror-population', cb: 't.cb-mirror' },
  { t: 'Both are fair estimates. Random samples vary; the mean of all 200 is probably not far from either.', mc: '', cb: 't.cb-right' },
  { t: `The mean of all 200 is exactly ${HALFWAY} minutes, halfway between.`, mc: 'mc.statistics.sample-statistic-as-exact-parameter', cb: 't.cb-exact' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = Sampler({
    roster: ROSTER, axis: AXIS,
    rows: [
      { label: 'Maya’s 10 names', values: vals(MAYA), col: 'second', fly: true, mark: { at: MAYA_MEAN, col: 'link' } },
      { label: 'Leo’s 10 names', values: vals(LEO), col: 'second', mark: { at: LEO_MEAN, col: 'link' } },
    ],
  }, MFD, th);
  const W = m.where;
  const L0 = bline('q.L0', `\\cssId{a}{\\text{all ${N}: mean}} = \\ ?`, W.roster!.cy, 80, TG);
  const L1 = bline('q.L1', `\\text{Maya's mean} = \\cssId{s}{${MAYA_MEAN}}`, W.marks[0]!.cy - 40, 80, TG);
  const L2 = bline('q.L2', `\\text{Leo's mean} = \\cssId{s}{${LEO_MEAN}}`, W.marks[1]!.cy - 40, 80, TG);
  setModels({ models: [{ pre: 'q.', m, focus: () => pulses('q.', 2) }], lines: [L0, L1, L2], leads: [] });
  tr.set('q.roster', 1, 0.8); tr.set('q.L0', 1, 0.9, 0.6); tr.set('q.pick', 1, 1.0, 1.0);
  tr.set('q.row0', 1, 1.8, 2.0); tr.set('q.mark0', 1, 0.6, 3.8); tr.set('q.L1', 1, 0.9, 3.9);
  tr.set('q.row1', 1, 1.0, 4.6); tr.set('q.mark1', 1, 0.6, 5.6); tr.set('q.L2', 1, 0.9, 5.7);

  const cards = h('div', { class: 'cards words', role: 'group', 'aria-label': 'conclusions' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    log('question', 'sampling-variability-concept', 'question.commit', 'Maya: 10 names, mean 46. Leo: 10 other names, mean 34. What should the council conclude about all 200?', p.t, CARDS[1]!.t, !p.mc, p.mc || undefined, commit().sure ?? undefined);
    go(1);
  }, 'go');
  let asked = false;
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => {
    const b = h('button'); b.textContent = cd.t;
    b.addEventListener('click', () => { commit().pick = i; sync(); if (!asked) { asked = true; void say('q.sure'); } });
    cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Two samples, two answers'),
    vline('q.intro', '', false), vline('q.draw', '', false), vline('q.ask', '', false),
    cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn),
  );
  const t = ++sayTok;
  void ctx.say('q.intro').then(() => { if (t === sayTok) void ctx.say('q.draw').then(() => { if (t === sayTok) void say('q.ask'); }); });
}

// ===== 2. Worked example: one sample, then many =====
function exampleSampler(): SamplerBlock {
  return Sampler({
    roster: ROSTER, axis: AXIS, pop: { at: MU, label: `mean of all ${N}` }, bands: [{ row: 1, at: MU, d: MOST10 }],
    rows: [
      { label: 'Maya’s sample of 10', values: vals(MAYA), col: 'second', fly: true, mark: { at: MAYA_MEAN, col: 'link' } },
      { label: 'means of 20 samples of 10', values: MEANS10, col: 'link', bin: 0, r: 12 },
    ],
  }, MFD, th);
}
function partExample(): void {
  tr.reset('e.');
  const m = exampleSampler(), W = m.where;
  const r1 = W.rows[1]!;
  const L1 = bline('e.L1', `\\cssId{a}{\\text{population: ${N}}}`, W.rosterLabel!.cy + 40, 80, TG);
  const L2 = bline('e.L2', `\\cssId{b}{\\text{sample: 10 at random}}`, W.rosterLabel!.cy + 170, 80, TG);
  // L3 sits on the row's line, so its leader's rail runs under the mark (below the ticks), not along them
  const L3 = bline('e.L3', `${MAYA_SUM} \\div 10 = \\cssId{s}{${MAYA_MEAN}}`, W.marks[0]!.y0 - 6, 80, TG);
  const L4 = bline('e.L4', `\\text{20 means: } ${MEANS10_LO} \\text{ to } ${fmt(MEANS10_HI)}`, r1.y0 + 40, 76, TG);
  const L5 = bline('e.L5', `\\cssId{a}{\\text{all ${N}: } ${MU}}`, r1.y0 + 40, 80, TG);
  const L6 = bline('e.L6', `\\cssId{s}{\\text{most within } ${MOST10}}`, r1.y0 + 150, 80, TG);
  const leads: Lead2[] = [{ key: 'e.ld3', from: () => partOf(L3, 's'), to: () => W.marks[0]!, col: 'link' }];
  setModels({ models: [{ pre: 'e.', m, focus: () => pulses('e.', 2) }], lines: [L1, L2, L3, L4, L5, L6], leads });
  jump('e.', ['roster']);   // where part 1 began

  const STEPS = [
    { t: 'Name the population and the sample', why: 'Who the question is about; who was drawn.', act: 'Show them' },
    { t: 'Find the sample mean', why: 'It estimates the population mean.', act: 'Average it' },
    { t: 'Draw again and again', why: 'Each new random sample gives a new mean.', act: 'Draw 19 more' },
    { t: 'Check against the population', why: 'How far do the means land?', act: 'Reveal it' },
  ];
  const P = plan(STEPS), sayBox = h('div'), after = h('div');
  let step = 0;
  const draw = () => P.draw(step, step < 4 ? { label: STEPS[step]!.act, on: () => run(step) } : undefined);
  function run(i: number): void {
    step = i + 1; draw(); sayBox.replaceChildren();
    if (i < 3) void say(`e.s${i + 1}`);
    seq(async alive => {
      if (i === 0) {
        void bump('e.pR', alive); tr.set('e.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.pick', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.L1:dim', 1, 0.5); tr.set('e.L2', 1, 0.9); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.row0', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('e.mark0', 1, 0.6); await wait(0.5); if (!alive()) return;
        tr.set('e.L3', 1, 1.0); tr.set('e.ld3', 1, 0.9, 0.8); await wait(1.8);
      } else if (i === 2) {
        tr.set('e.ld3', 0, 0.4); tr.set('e.L3:dim', 1, 0.5); tr.set('e.d0', 1, 0.6);
        void bump('e.pr1', alive);
        tr.set('e.row1', 1, 3.2); await wait(3.3); if (!alive()) return;
        tr.set('e.L4', 1, 0.9); await wait(1.0);
      } else {
        tr.set('e.L4', 0, 0.5);   // L5 takes its place on the board
        tr.set('e.pop', 1, 1.0); void bump('e.pP', alive); await wait(0.8); if (!alive()) return;
        tr.set('e.L5', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.band0', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('e.L5:dim', 1, 0.5); tr.set('e.L6', 1, 0.9); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(vline(`e.s${i + 1}`, '', false));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Chance picks a different 10 students each time, so each mean comes out a little different.', ok: true, id: 'e.w-ok' },
      { t: 'Some samples were drawn wrong: a fair random sample matches the population.', ok: false, id: 'e.w-mirror', mc: 'mc.statistics.sample-should-mirror-population' },
      { t: 'Each dot is one student, and students differ.', ok: false, id: 'e.w-dot', mc: 'mc.statistics.sampling-dot-as-individual' },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, o => {
      fbHost.replaceChildren(fbv(o.ok, o.id));
      log('example', 'sampling-variability-concept', 'example.why', 'Why don’t the 20 sample means all equal 42?', o.t, opts[0]!.t, o.ok, o.mc);
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box2, fbHost);
    sayThen('e.s4', 'e.why');
  }
  draw();
  setPanel(h('h2', {}, 'Watch it worked out'), vline('e.intro', 'dim'), P.node, sayBox, after);
}

// ===== 3. Your turn: samples of 40 =====
const POP_MAD = Math.round(mad(POP));
if (POP_MAD !== 14 || S40_SUM / 40 !== S40_MEAN || MOST40 !== 3) throw new Error('the part 3 numbers do not add up');
function partTurn(): void {
  tr.reset('t.');
  const m = Sampler({
    axis: AXIS, pop: { at: MU, label: `mean of all ${N}` }, bands: [{ row: 1, at: MU, d: MOST10 }, { row: 2, at: MU, d: MOST40 }],
    rows: [
      { label: 'one sample of 40', values: vals(S40), col: 'second', mark: { at: S40_MEAN, col: 'link' }, r: 13 },
      { label: 'means of 20 samples of 10', values: MEANS10, col: 'link', bin: 0, r: 11 },
      { label: 'means of 20 samples of 40', values: MEANS40, col: 'link', bin: 0, r: 11 },
    ],
  }, MFD, th), W = m.where;
  const L1 = bline('t.L1', `\\cssId{a}{\\text{all ${N}}},\\ \\cssId{b}{\\text{random 40}}`, BD.y0 + 100, 80, TG);
  const L3 = bline('t.L3', `1{,}720 \\div 40 = \\cssId{s}{${S40_MEAN}}`, W.marks[0]!.y0 - 6, 80, TG);
  const L4 = bline('t.L4', `\\text{means of 10: within } ${MOST10}`, W.rows[1]!.cy, 72, TG);
  const L5 = bline('t.L5', `\\text{means of 40: within } \\cssId{s}{${MOST40}}`, W.rows[2]!.cy, 72, TG);
  const leads: Lead2[] = [{ key: 't.ld3', from: () => partOf(L3, 's'), to: () => W.marks[0]!, col: 'link' }];
  setModels({ models: [{ pre: 't.', m, focus: () => pulses('t.', 3) }], lines: [L1, L3, L4, L5], leads });
  const STEPS = [
    { t: 'Name the population and the sample', why: 'Done for you.' },
    { t: 'Find the sample mean', why: 'Your step.' },
    { t: 'Draw again and again', why: 'Your step: predict, then watch.' },
    { t: 'Check against the population', why: 'Your step.' },
  ];
  const P = plan(STEPS), work = h('div');
  let step = 0;
  P.draw(step);
  setPanel(h('h2', {}, 'Bigger samples'), vline('t.intro'), P.node, work);
  seq(async alive => {
    tr.set('t.L1', 1, 0.9); await wait(0.6); if (!alive()) return;
    tr.set('t.row0', 1, 1.6); await wait(2.0); if (!alive()) return;
    tr.set('t.row1', 1, 0.8); tr.set('t.d1', 1, 0.6, 0.6); await wait(1.2); if (!alive()) return;
    tr.set('t.L1:dim', 1, 0.5);
    step = 1; P.draw(step); askMean();
  });

  function askMean(): void {
    const fbHost = h('div');
    const inp = numInput('minutes', () => submit());
    const ok = btn('Check', () => submit(), 'go');
    function submit(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number.')); return; }
      const right = Math.abs(r.v - S40_MEAN) < 1e-9;
      const id = right ? 't.m-ok' : Math.abs(r.v - S40_SUM / 10) < 1e-9 ? 't.m-ten' : 't.m-other';
      log('turn', 'estimate-from-sample', 'turn.mean', 'A sample of 40: the times add up to 1,720 minutes. What is the sample mean?', r.v, S40_MEAN, right);
      fbHost.replaceChildren(fbv(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.mark0', 1, 0.6); tr.set('t.L3', 1, 1.0, 0.3); tr.set('t.ld3', 1, 0.9, 1.1); await wait(2.3); if (!alive()) return;
        step = 2; P.draw(step); askPredict();
      });
    }
    work.replaceChildren(vline('t.mean'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askPredict(): void {
    const opts = [
      { t: 'Closer together', ok: true, id: 't.p-ok' },
      { t: 'Just as spread out: same students, same spread', ok: false, id: 't.p-same', mc: 'mc.statistics.individual-vs-statistic-spread' },
      { t: 'More spread out: more students, more variety', ok: false, id: 't.p-more', mc: 'mc.statistics.smaller-sample-guarantees-smaller-spread' },
    ];
    const fbHost = h('div');
    let played = false;
    const box2 = optionList(opts, (o, bx) => {
      log('turn', 'sample-size-effect', 'turn.predict', 'Means of 20 samples of 40 vs means of samples of 10: closer, the same, or more spread?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (played) return;
      played = true;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      // right or wrong, the picture settles it: the means of 40 fall in
      seq(async alive => {
        tr.set('t.ld3', 0, 0.4); tr.set('t.L3:dim', 1, 0.5); tr.set('t.d0', 1, 0.6);
        void bump('t.pr2', alive);
        tr.set('t.row2', 1, 2.6); await wait(2.8); if (!alive()) return;
        step = 3; P.draw(step); askFar();
      });
    });
    work.replaceChildren(vline('t.predict'), box2, fbHost);
  }
  function askFar(): void {
    const opts = [
      { t: `About ${MOST40} minutes`, ok: true, id: 't.f-ok' },
      { t: `About ${MOST10} minutes`, ok: false, id: 't.f-six' },
      { t: `About ${POP_MAD} minutes`, ok: false, id: 't.f-14', mc: 'mc.statistics.individual-vs-statistic-spread' },
    ];
    const fbHost = h('div');
    const box2 = optionList(opts, (o, bx) => {
      log('turn', 'simulate-repeated-samples', 'turn.far', 'Most of the 20 means of 40 land within about how far of 42?', o.t, opts[0]!.t, o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.pop', 1, 1.0); void bump('t.pP', alive); await wait(1.0); if (!alive()) return;
        tr.set('t.d1', 0, 0.5); tr.set('t.band0', 1, 0.9); tr.set('t.L4', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('t.d1', 1, 0.5); tr.set('t.L4:dim', 1, 0.5); tr.set('t.band1', 1, 0.9); tr.set('t.L5', 1, 0.9); await wait(1.6); if (!alive()) return;
        step = 4; P.draw(step);
        const cb = callback(); fbHost.append(cb);
        cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });
    work.replaceChildren(vline('t.far'), box2, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const id = commit().pick === null ? 't.cb-none' : CARDS[commit().pick!]!.cb;
    c.append(vline(id));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: the online poll vs the random sample =====
function partProve(): void {
  tr.reset('p.');
  const m = Sampler({
    axis: AXIS, pop: { at: MU, label: `mean of all ${N}` }, gap: { rowA: 0, rowB: 1, unit: POLL_CENTER - MU },
    rows: [
      { label: 'means of 20 random samples of 40', values: MEANS40, col: 'link', bin: 0, r: 10, mark: { at: MU, col: 'first' } },
      { label: 'means of 20 online polls of 60', values: POLLS, col: 'pick', bin: 0, r: 10, mark: { at: POLL_CENTER, col: 'pick' } },
    ],
  }, MFD, th), W = m.where;
  const yJ = BD.y0 + 110;
  const J = bline('p.J', `\\text{Jordan: } 60 > 40,\\ \\text{so } \\cssId{w}{${POLL_MEAN}} \\text{ wins}`, yJ, 80, TG);
  const C1 = bline('p.C1', `\\text{random: near } \\cssId{a}{${MU}}`, W.rows[0]!.cy, 80, TG);
  const C2 = bline('p.C2', `\\text{polls: near } \\cssId{p}{${POLL_CENTER}}`, W.rows[1]!.cy - 30, 80, TG);
  const C3 = bline('p.C3', `${POLL_CENTER} - ${MU} = \\cssId{p}{${POLL_CENTER - MU}}\\ \\text{every time}`, W.rows[1]!.cy + 110, 76, TG);
  if (POLL_MEAN !== POLL_CENTER) throw new Error('the poll story needs its first poll at the center');
  setModels({
    models: [{ pre: 'p.', m, focus: () => pulses('p.', 2) }], lines: [J, C1, C2, C3], leads: [],
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 120, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.J', 1, 1.0, 0.4);

  const CHIPS = [
    { t: 'Every student had the same chance to be picked.', fits: 0 },
    { t: 'Students with a lot of homework are the most likely to answer a poll about it.', fits: 1 },
    { t: 'More answers shrink chance error, not the error from how the sample was chosen.', fits: 2 },
    { t: '60 is more than 40, so the poll stands for everyone.', fits: -1, id: 'p.x-big', mc: 'mc.statistics.large-sample-cures-bias' },
    { t: 'The poll is fine as long as nobody lied.', fits: -1, id: 'p.x-honest', mc: 'mc.statistics.bias-means-dishonesty' },
    { t: 'A random sample should match the population exactly.', fits: -1, id: 'p.x-mirror', mc: 'mc.statistics.sample-should-mirror-population' },
  ];
  const SUB = ['random-representative', 'selection-bias-mechanism', 'bias-vs-variability'];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${CHIPS.find(c => c.fits === i)!.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3 || used.has(i)) return;
    const claimText = (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, '');
    log('prove', SUB[filled]!, `prove.claim${filled + 1}`, claimText, ch.t, CHIPS.find(c => c.fits === filled)!.t, ch.fits === filled, ch.mc);
    if (ch.fits !== filled) { fbHost.replaceChildren(fbv(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    void say(`p.c${n}`);
    seq(async alive => {
      if (n === 1) {
        tr.set('p.J:dim', 1, 0.5);
        tr.set('p.row0', 1, 1.6); tr.set('p.pop', 1, 1.0, 1.0); void bump('p.pP', alive); await wait(1.8); if (!alive()) return;
        tr.set('p.mark0', 1, 0.6); tr.set('p.C1', 1, 0.9);
      } else if (n === 2) {
        tr.set('p.C1:dim', 1, 0.5);
        tr.set('p.row1', 1, 1.8); void bump('p.pr1', alive); await wait(2.0); if (!alive()) return;
        tr.set('p.mark1', 1, 0.6); tr.set('p.C2', 1, 0.9);
      } else {
        tr.set('p.C2:dim', 1, 0.5);
        tr.set('p.gap', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('p.C3', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('p.J:dim', 0, 0.4); tr.set('p.strike', 1, 0.6, 0.3); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    log('prove', 'bias-vs-variability', 'prove.judge', 'Online poll: 60 volunteers, mean 55. Random sample: 40, mean 43. Jordan: 60 beats 40, so 55 is better. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? 'mc.statistics.large-sample-cures-bias' : undefined);
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(vline(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), vline('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed), show: showItem,
  });
}
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const P = picOf(item);
  const big = box(240, 280, 1680, 760);
  const bare = () => { setModels({ models: [], lines: [bigLine('x.B', item.board, big)], leads: [], boardBox: big }); tr.set('x.B', 1, 0.8, 0.1); };
  if (!P) { bare(); return {}; }
  const made = tryBlock<Block>(() => (P.kind === 'plots' ? Sampler(P.p as SamplerParams, MFD, th) : P.kind === 'bars' ? ScaleBars(P.p, MFD, th) : Nested(P.p, MFD, th)));
  if (!made.ok) { console.warn('sampling: model not drawn', item.id, made.error); bare(); return {}; }
  const mb = made.value;
  const T = bline('x.T', item.board, BD.y0 + 110, 80, TG);
  const Wl = P.work.map((s, i) => bline(`x.w${i}`, s, BD.y0 + 300 + i * 140, 76, TG));
  const nRows = P.kind === 'plots' ? P.p.rows.length : 0;
  const scene = () => setModels({ models: [{ pre: 'x.', m: mb, focus: () => (P.kind === 'plots' ? pulses('x.', nRows) : {}) }], lines: [T, ...Wl], leads: [] });
  if (P.pre.length) {
    scene();
    P.pre.forEach((s, i) => tr.set('x.' + s, 1, s.startsWith('row') ? 1.2 : 0.8, 0.1 + i * 0.3));
    tr.set('x.T', 1, 0.8, 0.3);
  } else bare();
  return {
    solve: async alive => {
      if (!P.pre.length) { scene(); tr.jump('x.T', 1); }
      tr.set('x.T:dim', 1, 0.5);
      for (const s of P.post) { tr.set('x.' + s, 1, s === 'pick' || s.startsWith('row') ? 1.2 : 0.9); await wait(s === 'roster' ? 0.6 : 0.9); if (!alive()) return; }
      for (let i = 0; i < Wl.length; i++) {
        if (i > 0) tr.set(`x.w${i - 1}:dim`, 1, 0.5);
        tr.set(`x.w${i}`, 1, 0.9); await wait(1.0); if (!alive()) return;
      }
    },
  };
}

void runLesson({
  slug: SLUG,
  // every glyph the board can use must be loaded before a line is built (a line keeps the formula it was built from)
  warm: [
    '\\text{all 200: mean} = \\ ? \\quad \\text{Maya\'s mean} = 46 \\quad \\text{Leo\'s mean} = 34',
    '\\text{population: 200} \\quad \\text{sample: 10 at random} \\quad 460 \\div 10 = 46',
    '\\text{20 means: } 34 \\text{ to } 50.5 \\quad \\text{most within } 6 \\quad 1{,}720 \\div 40 = 43',
    '\\text{Jordan: } 60 > 40,\\ \\text{so } 55 \\text{ wins} \\quad 55 - 42 = 13\\ \\text{every time}',
    '\\text{polls: near } \\text{random: near } \\text{means of 10: within } 3',
    '\\tfrac{45}{250} \\times 3{,}800 \\approx 684 \\quad 100\\% - 35\\% = 65\\% \\quad 0.65 \\times 2{,}400 = 840',
    '\\text{population?}\\quad \\text{sample?} \\quad \\text{MAD of the sample} = 22.5 \\quad 2.5\\ \\text{MADs apart}',
    '17,\\ 42,\\ 08 \\quad 12 \\times 20 = 240 \\quad \\text{about } \\to ?\\ \\text{of}\\ (3 + 5) \\div 2 \\quad 3\\ \\text{vs}\\ 5\\%',
    '\\text{in order: } \\text{middle value: } \\text{sum} \\text{estimate: about } \\text{one dot = the mean of } \\text{volunteers} \\text{who was easy to reach?}',
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz \\text{ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 :;,.!?\'-}',
  ],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
