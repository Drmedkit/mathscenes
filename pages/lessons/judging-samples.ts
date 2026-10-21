// judging-samples.ts: "Judge sample representativeness and limit conclusions" (grade 7, 7.SP.A.1) on the lesson runtime.
//   1 The question   60 kids at the gym answer for 240 seventh graders: 3 statements (overreach / scoped / nothing) + how sure
//   2 Worked example four subgoal steps on the map: name the population, find the sample, ask who is left out, state only
//                    what the data support; the board writes the audit beside the map; one "why?" with 3 reasons
//   3 Your turn      200 forms, 60 not returned: the first two steps given, the kid judges the missing and states a
//                    claim that holds however the missing would have answered (the completion bounds on the map)
//   4 Prove it       Maya's lunch-line claim: judge it, then a because-chain from reason chips (distractors = misconceptions)
//   5 Practice       all 6 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/judging-samples/voice/lines.json. Every answer is logged (runtime/store.ts).
import type { Canvas } from '../../src/core/draw';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, bump, type Lead, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { SampleMap, type SampleMapBlock, type SampleMapFocus, type SampleMapParams } from '../../src/lesson/topics/judging-samples/SampleMap';
import { RecordTable, type RecordTableBlock } from '../../src/lesson/topics/judging-samples/RecordTable';
import { type BoardRow, boardRow, drawRow, type Run } from '../../src/lesson/topics/judging-samples/board';
import { computeStudy, guaranteed } from '../../src/lesson/topics/judging-samples/sampling';
import { type BoardLine, FAMILY_NAMES, GENERATORS, type JudgeItem, runsOf } from '../../src/lesson/topics/judging-samples/items';
import { PLAN } from '../../src/lesson/topics/judging-samples/plan';

const SLUG = 'judging-samples';
const MAPF = frame(60, 70, 1110, 940);
const BX = BOARD.x0 + 54, BW = BOARD.w - 108;
/** the board's row slots (value-line middles); each row's label sits 60 px above */
const ROW_Y = [200, 350, 500, 650, 800, 950];
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;

// ---------- the scene: a map (or a sheet) on the left, the audit board on the right ----------
interface Row { R: BoardRow; key: string }
function row(pre: string, i: number, label: string, runs: Run[], slot = i): Row {
  return { R: boardRow(`${pre}r${i}`, ROW_Y[slot]!, label, runs, BX, BW), key: `${pre}r${i}` };
}
/** the first alternative of a board line that fits */
function rowOf(pre: string, i: number, L: BoardLine, slot = i): Row {
  for (const runs of L.alts) { try { return row(pre, i, L.label, runs, slot); } catch { /* try the shorter one */ } }
  return row(pre, i, L.label, [{ t: '…', col: 'dim' }], slot);
}
interface MapScene { pre: string; map?: SampleMapBlock | null; table?: RecordTableBlock | null; rows: Row[]; leads?: Lead[]; focus?: () => SampleMapFocus; extra?: (c: Canvas) => void }
function setMap(S: MapScene): void {
  setScene({
    table: 1080,
    model: c => {
      S.map?.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.());
      S.table?.draw(c, progressOf(s => tr.k(S.pre + s)));
    },
    lines: [], leads: S.leads ?? [], boardBox: BOARD,
    extra: c => {
      for (const r of S.rows) drawRow(c, r.R, tr.k(r.key), tr.k(r.key + ':dim'), tr.k(r.key + ':strike'));
      S.extra?.(c);
    },
  });
}
const runs = (t: string, col: Parameters<typeof runsOf>[1]) => runsOf(t, col);
/** pulse a group label on the map while its board row writes on */
async function writeRow(pre: string, i: number, pulse: string | null, alive: () => boolean): Promise<void> {
  tr.set(`${pre}r${i}`, 1, 0.9);
  if (pulse) void bump(pre + pulse, alive);
  await wait(0.9);
}
const pulses = (pre: string): SampleMapFocus => ({ popLabel: tr.k(pre + 'pPop'), sampleLabel: tr.k(pre + 'pSample'), leftLabel: tr.k(pre + 'pLeft') });

// ---------- the Lincoln study (parts 1 and 2) ----------
const LINCOLN: SampleMapParams = { popLabel: '240 seventh graders', N: 240, match: 'part', sampleLabel: '60 at the gym', n: 60, yes: 51, leftLabel: '180 not asked' };
const lincolnStudy = computeStudy({ N: 240, n: 60, match: 'part', yes: 51 });
if (lincolnStudy.notAsked !== 180 || lincolnStudy.no !== 9) throw new Error('the Lincoln numbers do not add up');

const CARDS = [
  { t: 'Most of Lincoln’s 240 seventh graders get an hour of exercise most days.', mc: 'mc.statistics.generalizes-beyond-sampled-group', short: '“most of the 240”', why: 'that stretches 60 gym kids to all 240' },
  { t: '51 of the 60 kids at the gym get an hour most days. It may not hold for the rest.', mc: '', short: '“51 of the 60 at the gym”', why: '' },
  { t: 'Nothing at all. A survey in one place proves nothing.', mc: 'mc.statistics.one-flaw-rejects-all-data', short: '“nothing at all”', why: 'the 60 answers still tell us about those 60' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = SampleMap(LINCOLN, MAPF, th);
  const rows = [
    row('q.', 0, 'the question is about', runs('240 seventh graders', 'first')),
    row('q.', 1, 'the data came from', runs('60 at the gym', 'second')),
    row('q.', 2, 'the answers', runs('51 of 60 said yes', 'ink')),
  ];
  setMap({ pre: 'q.', map: m, rows });
  tr.set('q.pop', 1, 1.0); tr.set('q.dots', 1, 1.6, 0.3); tr.set('q.sample', 1, 0.9, 1.6); tr.set('q.answers', 1, 1.2, 2.3);
  tr.set('q.r0', 1, 0.8, 0.6); tr.set('q.r1', 1, 0.8, 1.8); tr.set('q.r2', 1, 0.8, 2.6);

  const cards = h('div', { class: 'cards words', role: 'group', 'aria-label': 'statements' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '60 kids at the gym, 51 said yes: what can the council say about 240 seventh graders?', response: p.t, expected: CARDS[1]!.t, correct: !p.mc, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  void ctx.say('q.intro').then(() => say('q.ask'));
  CARDS.forEach((cd, i) => { const b = h('button'); b.textContent = cd.t; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Sixty kids at the gym'),
    html('p', '', 'The Lincoln student council wants to know: do the <b class="a">240 seventh graders</b> at Lincoln Middle get an hour of exercise most days? They asked <b class="b">60 kids at the gym after school</b>, and 51 said yes.'),
    html('p', '', 'What can the council say?'),
    cards,
    h('div', { class: 'label' }, 'How sure are you?'),
    sure,
    h('div', { class: 'row' }, goBtn),
  );
}

// ===== 2. Worked example: the Lincoln study, four steps =====
function partExample(): void {
  tr.reset('e.');
  const m = SampleMap(LINCOLN, MAPF, th);
  const rows = [
    row('e.', 0, 'the question is about', runs('240 seventh graders', 'first')),
    row('e.', 1, 'the data came from', runs('60 at the gym', 'second')),
    row('e.', 2, 'the answers', [{ t: '51', num: true, col: 'ink' }, { t: ' of 60 said yes', col: 'ink' }]),
    row('e.', 3, 'left out', runs('180 not at the gym', 'pick')),
    row('e.', 4, 'not', runs('most of all 240', 'wrong')),
    row('e.', 5, 'the data support', runs('51 of 60 at the gym', 'link')),
  ];
  const leads: Lead[] = [{ key: 'e.ldY', from: () => rows[2]!.R.boxes[0]!, to: () => m.where.yes!, col: 'ink' }];
  setMap({ pre: 'e.', map: m, rows, leads, focus: () => pulses('e.') });
  tr.jump('e.dots', 1);

  let step = 0;
  const STEPS = [
    { t: 'Name the population', why: 'The whole group the question is about.', act: 'Outline it' },
    { t: 'Find the sample', why: 'The group that actually gave the data.', act: 'Ring it' },
    { t: 'Ask who is left out', why: 'Does the way they chose favor some answers?', act: 'Shade them' },
    { t: 'State only what the data support', why: 'Say it for the group the data came from.', act: 'Write it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) { const b = btn(s.act, () => run(i), 'go'); (li.lastChild as HTMLElement).append(b); }
      return li;
    }));
  };
  const SAY = [
    'The population is all <b class="a">240 seventh graders at Lincoln Middle</b>: everyone the question is about.',
    'The sample is the <b class="b">60 kids at the gym</b>. They are part of the population, and 51 of them said yes.',
    'Kids who go straight home after school were never asked. Kids at the gym are more likely to exercise, so 51 of 60 is likely <b class="w">too high</b> for the whole grade.',
    'Not “most of the 240”: the data don’t reach that far. The council can say <b class="s">51 of the 60 kids at the gym</b> get an hour most days.',
  ];
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.innerHTML = '';
    if (i < 3) say(`e.step${i}`);
    seq(async alive => {
      if (i === 0) {
        tr.set('e.pop', 1, 1.4); await wait(0.9); if (!alive()) return;
        await writeRow('e.', 0, 'pPop', alive);
      } else if (i === 1) {
        tr.set('e.r0:dim', 1, 0.6);
        tr.set('e.sample', 1, 1.0); await wait(0.9); if (!alive()) return;
        await writeRow('e.', 1, 'pSample', alive); if (!alive()) return;
        tr.set('e.answers', 1, 1.4); await wait(1.3); if (!alive()) return;
        await writeRow('e.', 2, null, alive); if (!alive()) return;
        tr.set('e.ldY', 1, 0.9);
      } else if (i === 2) {
        tr.set('e.ldY', 0, 0.4); tr.set('e.r1:dim', 1, 0.6); tr.set('e.r2:dim', 1, 0.6);
        tr.set('e.leftOut', 1, 1.2); await wait(1.0); if (!alive()) return;
        await writeRow('e.', 3, 'pLeft', alive);
      } else {
        tr.set('e.r3:dim', 1, 0.6);
        tr.set('e.over', 1, 1.2); await writeRow('e.', 4, null, alive); await wait(0.5); if (!alive()) return;
        tr.set('e.r4:strike', 1, 0.6); await wait(0.7); if (!alive()) return;
        tr.set('e.over', 0, 0.8); tr.set('e.r4:dim', 1, 0.6);
        tr.set('e.scope', 1, 1.2); await wait(0.6); if (!alive()) return;
        await writeRow('e.', 5, null, alive);
      }
      if (!alive()) return;
      sayBox.replaceChildren(html('p', '', SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 60 were all at the gym, so active kids are over-included, and the other 180 were never asked.', ok: true, mc: undefined as string | undefined, say: 'Yes. The data came from one corner of the grade, and that corner leans toward “yes”.' },
      { t: '60 is too few. Asking 200 kids at the gym would fix it.', ok: false, mc: 'mc.statistics.large-sample-cures-bias', say: 'More kids at the gym are still gym kids. A bigger sample chosen the same way leaves out the same kids.' },
      { t: 'They can: the question was about all seventh graders, so the answers are about them too.', ok: false, mc: 'mc.statistics.target-population-assumed-measured', say: 'The question was about all 240, but only the 60 at the gym answered.' },
    ];
    const box = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box.append(btn(o.t, () => {
      box.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      const b = [...box.querySelectorAll('button')].find(x => x.textContent === o.t)!;
      b.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(feedback(o.ok, o.say));
      ctx.store.log({ part: 'example', subgoal: 'selection-bias', item: 'example.why', prompt: 'Why can’t the council say “most of Lincoln’s seventh graders”?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, 'Quick check: why can’t the council say “most of Lincoln’s seventh graders”?'), box, fbHost);
    void ctx.say('e.step3').then(() => say('e.why'));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), html('p', 'dim', 'Four steps. Press each one and watch the map, then the board.'), plan, sayBox, after);
  say('e.intro');
}

// ===== 3. Your turn: 200 forms, 60 not returned (faded from the end) =====
const OAK: SampleMapParams = { popLabel: '200 students', N: 200, match: 'census', sampleLabel: 'all 200 got a form', n: 200, answered: 140, yes: 110 };
const oak = computeStudy({ N: 200, n: 200, match: 'census', answered: 140, yes: 110 });
if (!guaranteed(oak, { kind: 'most' }) || !guaranteed(oak, { kind: 'atLeast', k: 110 }) || oak.missing !== 60) throw new Error('the Oak Hill claim must hold under every completion');

function partTurn(): void {
  tr.reset('t.');
  const m = SampleMap(OAK, MAPF, th);
  const rows = [
    row('t.', 0, 'the question is about', runs('200 students', 'first')),
    row('t.', 1, 'the data came from', runs('140 who answered', 'second')),
    row('t.', 2, 'the answers', runs('110 of 140 said yes', 'ink')),
    row('t.', 3, 'the 60 missing', runs('likely read less', 'pick')),
    row('t.', 4, 'yes could be', runs('110 to 170 of 200', 'link')),
    row('t.', 5, 'the data support', runs('at least 110 of 200', 'link')),
  ];
  setMap({
    pre: 't.', map: m, rows, focus: () => ({ ...pulses('t.'), fillYes: tr.k('t.fy'), fillNo: tr.k('t.fn'), missGlow: tr.k('t.mg'), scopeAll: true }),
  });

  let step = 0;
  const STEPS = [
    { t: 'Name the population', why: 'Done for you: all 200 students at Oak Hill.' },
    { t: 'Find the sample', why: 'Done for you: everyone got a form, 140 answered.' },
    { t: 'Ask who is missing', why: 'Your step.' },
    { t: 'State only what the data support', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  say('t.intro');
  setPanel(h('h2', {}, 'Two hundred forms'),
    html('p', '', 'The Oak Hill librarian handed a reading survey to all <b class="a">200 students</b> at Oak Hill Middle: “Do you read for fun every week?” <b class="b">140</b> forms came back, and 110 said yes. 60 were never returned.'),
    plan, work);

  seq(async alive => {
    tr.set('t.dots', 1, 1.4); await wait(1.6); if (!alive()) return;
    tr.set('t.pop', 1, 1.2); await writeRow('t.', 0, 'pPop', alive); await wait(0.6); if (!alive()) return;
    step = 1; drawPlan(); tr.set('t.r0:dim', 1, 0.5);
    tr.set('t.sample', 1, 1.0); await wait(0.8); if (!alive()) return;
    tr.set('t.answers', 1, 1.6); await wait(1.4); if (!alive()) return;
    await writeRow('t.', 1, 'pSample', alive); if (!alive()) return;
    await writeRow('t.', 2, null, alive); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.mg', 1, 0.6);
    askMissing();
  });

  function askMissing(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'Likely too high', ok: true, mc: undefined as string | undefined, say: 'Yes. The students who skipped it probably read less, so the yes share among the 140 is likely too high.' },
      { t: 'Likely too low', ok: false, mc: undefined, say: 'Think about who kept the form in their backpack: students who don’t like reading. Leaving them out pushes the yes share up, not down.' },
      { t: 'About right: the 60 would answer like the others', ok: false, mc: 'mc.statistics.nonrespondents-answer-like-respondents', say: 'Not here: the reason they are missing is linked to the answer. The 60 are likely to read less.' },
      { t: 'Can’t tell which way', ok: false, mc: undefined, say: 'Here we do know something: the teachers saw who kept the forms. That tells us which way.' },
    ];
    const box = h('div', { class: 'opts' });
    opts.forEach(o => box.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', subgoal: 'nonresponse-bias', item: 'turn.missing', prompt: 'Non-readers kept the form: is 110 of 140 too high, too low, about right, or can’t tell?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      box.querySelectorAll('button').forEach(b => b.classList.toggle('nope', !o.ok && b.textContent === o.t));
      fbHost.replaceChildren(feedback(o.ok, o.say));
      if (!o.ok) return;
      box.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; if (b.textContent === o.t) b.classList.add('right'); });
      seq(async alive => {
        await writeRow('t.', 3, null, alive); if (!alive()) return;
        step = 3; drawPlan(); askState();
      });
    })));
    work.replaceChildren(html('p', '', 'A clue: teachers noticed that students who don’t like reading often left the form in their backpacks.'),
      html('p', '', 'For all 200 students, is “110 of 140 said yes” likely too high, too low, or about right?'), box, fbHost);
    void ctx.say('t.clue').then(() => say('t.miss'));
  }
  function askState(): void {
    const fbHost = h('div');
    const host = h('div');
    work.replaceChildren(html('p', '', 'Every way the 60 could have answered: if all 60 said yes, that is 170 of 200. If all said no, 110 of 200.'), host, fbHost);
    say('t.fill');
    seq(async alive => {
      tr.set('t.r2:dim', 1, 0.5); tr.set('t.r3:dim', 1, 0.5);
      tr.set('t.fy', 1, 0.8); await wait(1.6); if (!alive()) return;
      tr.set('t.fy', 0, 0.5); tr.set('t.fn', 1, 0.8, 0.3); await wait(1.7); if (!alive()) return;
      tr.set('t.fn', 0, 0.6);
      await writeRow('t.', 4, null, alive); if (!alive()) return;
      const opts = [
        { t: 'More than half of the 200 read for fun every week: at least 110 do, however the 60 would have answered.', ok: true, mc: undefined as string | undefined, say: 'Yes. Even if all 60 said no, 110 of 200 is more than half. That claim holds in every case.' },
        { t: '110 of 140 is 11 of every 14, so 11 of every 14 Oak Hill students read every week.', ok: false, mc: 'mc.statistics.nonrespondents-answer-like-respondents', say: 'That treats the 60 as if they answered like the 140, and we just saw they likely read less.' },
        { t: 'Nothing: 60 forms are missing, so the survey tells us nothing.', ok: false, mc: 'mc.statistics.one-flaw-rejects-all-data', say: 'The missing forms limit the claim, but some claims hold however the 60 answered. Look at the range on the board.' },
      ];
      const box = h('div', { class: 'opts' });
      opts.forEach(o => box.append(btn(o.t, () => {
        ctx.store.log({ part: 'turn', subgoal: 'generalize-scope', item: 'turn.state', prompt: 'Which statement can the librarian make about all 200 students?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
        box.querySelectorAll('button').forEach(b => b.classList.toggle('nope', !o.ok && b.textContent === o.t));
        fbHost.replaceChildren(feedback(o.ok, o.say));
        if (!o.ok) return;
        box.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; if (b.textContent === o.t) b.classList.add('right'); });
        seq(async alive2 => {
          tr.set('t.mg', 0, 0.5); tr.set('t.r4:dim', 1, 0.5);
          tr.set('t.scope', 1, 1.2); await wait(0.6); if (!alive2()) return;
          await writeRow('t.', 5, null, alive2); if (!alive2()) return;
          step = 4; drawPlan();
          const cb = callback(); fbHost.append(cb);
          cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      })));
      host.replaceChildren(html('p', '', 'Which statement can the librarian make about all 200 students?'), box);
      say('t.state');
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick === null ? null : CARDS[commit().pick!]!;
    if (!p) c.innerHTML = 'At the start: 60 kids at the gym support only “51 of the 60 at the gym”, not “most of the 240”.';
    else {
      const right = !p.mc;
      c.innerHTML = `At the start you picked ${p.short} and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `
        + (right ? 'You were right: the claim stays with the 60 at the gym. Now you can also say when a claim CAN reach the whole group.' : `Now you know why it is “51 of the 60 at the gym”: ${p.why}.`);
    }
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    say('t.done');
    return c;
  }
}

// ===== 4. Prove it: Maya's lunch-line claim =====
function partProve(): void {
  tr.reset('p.');
  const m = SampleMap({ popLabel: '600 students', N: 600, match: 'part', sampleLabel: '200 in the lunch line', n: 200, leftLabel: '400 not in line', unit: 'students' }, MAPF, th);
  const rows = [
    row('p.', 0, 'Maya’s claim', runs('most of all 600', 'ink')),
    row('p.', 1, 'the question is about', runs('600 students', 'first')),
    row('p.', 2, 'the data came from', runs('200 in the lunch line', 'second')),
    row('p.', 3, 'left out', runs('lunch from home', 'pick')),
    row('p.', 4, 'the data support', runs('160 of the 200 in line', 'link')),
  ];
  setMap({ pre: 'p.', map: m, rows, focus: () => pulses('p.') });
  tr.set('p.dots', 1, 1.6); tr.set('p.sample', 1, 1.0, 1.0); tr.set('p.r0', 1, 0.9, 1.6);

  const CHIPS = [
    { t: 'The population is the whole group the question is about.', fits: 0 },
    { t: 'Students who bring lunch from home were never asked, and they may like the menu less.', fits: 1 },
    { t: 'A conclusion may only cover the group the data came from.', fits: 2 },
    { t: '200 is a big sample, so it stands for everyone.', fits: -1, mc: 'mc.statistics.large-sample-cures-bias', say: 'Size doesn’t fix who was asked: 200 or 2,000 from the lunch line still leave out the lunch-from-home students.' },
    { t: 'One flaw means the whole survey is worthless.', fits: -1, mc: 'mc.statistics.one-flaw-rejects-all-data', say: 'Too far the other way: the 200 answers still tell us about the 200 in line. The claim needs a limit, not the bin.' },
  ];
  const CLAIMS = [
    'The question is about all <b class="a">600 Eastside students</b>,',
    'but all 200 answers came from the <b class="b">cafeteria line</b>,',
    'so the claim can only be stated for <b class="s">the 200 in line: 160 of them like the menu</b>,',
  ];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
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
    ctx.store.log({ part: 'prove', subgoal: ['name-population', 'selection-bias', 'generalize-scope'][filled], item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.r0:dim', 1, 0.5); tr.set('p.pop', 1, 1.2); await writeRow('p.', 1, 'pPop', alive); }
        if (n === 2) {
          tr.set('p.r1:dim', 1, 0.5);
          await writeRow('p.', 2, 'pSample', alive); if (!alive()) return;
          tr.set('p.leftOut', 1, 1.2); await wait(0.8); if (!alive()) return;
          await writeRow('p.', 3, 'pLeft', alive);
        }
        if (n === 3) {
          tr.set('p.r2:dim', 1, 0.5); tr.set('p.r3:dim', 1, 0.5); tr.set('p.r0:dim', 0, 0.4);
          tr.set('p.over', 1, 1.0); await wait(1.1); if (!alive()) return;
          tr.set('p.r0:strike', 1, 0.6); await wait(0.7); if (!alive()) return;
          tr.set('p.over', 0, 0.8); tr.set('p.r0:dim', 1, 0.6);
          tr.set('p.scope', 1, 1.2); await wait(0.6); if (!alive()) return;
          await writeRow('p.', 4, null, alive); if (!alive()) return;
          chipBox.remove();
          say('p.done');
          fbHost.replaceChildren(feedback(true, 'That’s the argument: who the question is about, who actually answered, and so how far the claim may reach. Maya should write “160 of the 200 students in the lunch line like the new menu.”'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    const msg = ch.say ?? `True, but it is the reason for a different line. Which reason makes “${CLAIMS[filled]!.replace(/<[^>]+>/g, '').replace(/,$/, '')}” true?`;
    fbHost.replaceChildren(feedback(false, msg));
  }
  const yes = btn('Maya is right', () => judge(true)), no = btn('Maya’s claim goes too far', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', subgoal: 'generalize-scope', item: 'prove.judge', prompt: 'Maya: 160 of 200 in the lunch line like the menu, so most of the 600 do. Right or too far?', response: right ? 'right' : 'too far', expected: 'too far', correct: !right, mc: right ? 'mc.statistics.generalizes-beyond-sampled-group' : undefined });
    say('p.build');
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(
      html('p', '', right ? 'Let’s test it. Build the argument, and see where it leads.' : 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  say('p.intro');
  setPanel(
    h('h2', {}, 'Prove it'),
    html('p', '', 'Maya writes in the Eastside paper: “We asked <b class="b">200 students in the cafeteria line</b>, and 160 like the new lunch menu. So most of the <b class="a">600 Eastside students</b> like the new menu.”'),
    verdict, proofHost,
  );
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as JudgeItem),
  });
}
function showItem(item: JudgeItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const lines = [...item.rows, ...item.solveRows];
  const rows = lines.map((L, i) => rowOf('x.', i, L));
  const nShow = item.rows.length;
  const pic = item.pic;
  let mp: SampleMapBlock | null = null, tb: RecordTableBlock | null = null;
  if (pic.kind === 'map') { const r = tryBlock(() => SampleMap(pic.map, MAPF, th)); mp = r.ok ? r.value : null; }
  else { const r = tryBlock(() => RecordTable(pic.table, MAPF, th)); tb = r.ok ? r.value : null; }
  const scopeAll = pic.kind === 'map' && !!pic.scopeAll;
  setMap({ pre: 'x.', map: mp, table: tb, rows, focus: () => ({ ...pulses('x.'), fillYes: tr.k('x.fy'), fillNo: tr.k('x.fn'), missGlow: tr.k('x.mg'), scopeAll }) });
  // the item's starting picture
  pic.show.forEach((s, i) => tr.set('x.' + s, 1, s === 'dots' || s === 'rows' ? 1.2 : 0.9, 0.1 + i * 0.35));
  rows.slice(0, nShow).forEach((r, i) => tr.set(r.key, 1, 0.8, 0.5 + i * 0.4));
  return {
    solve: async alive => {
      for (const r of rows.slice(0, nShow)) tr.set(r.key + ':dim', 1, 0.5);
      if (pic.kind === 'map' && pic.complete) {
        tr.set('x.mg', 1, 0.5);
        tr.set('x.fy', 1, 0.7); await wait(1.2); if (!alive()) return;
        tr.set('x.fy', 0, 0.4); tr.set('x.fn', 1, 0.7, 0.2); await wait(1.3); if (!alive()) return;
        tr.set('x.fn', 0, 0.5); tr.set('x.mg', 0, 0.5);
      }
      for (const s of pic.solve) {
        const pulse = s === 'pop' ? 'pPop' : s === 'sample' ? 'pSample' : s === 'leftOut' ? 'pLeft' : null;
        tr.set('x.' + s, 1, 1.0);
        if (pulse) void bump('x.' + pulse, alive);
        await wait(0.9); if (!alive()) return;
      }
      for (const r of rows.slice(nShow)) { tr.set(r.key, 1, 0.8); await wait(0.7); if (!alive()) return; }
    },
  };
}

void runLesson({
  slug: SLUG,
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
