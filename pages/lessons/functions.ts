// functions.ts: "Function concept and identifying functions" (grade 8, 8.F.A.1) on the lesson runtime. The model is a
// relation drawn three ways: a mapping diagram, a table and a graph with a vertical SLICE (one input, all its outputs).
//   1 The question   five students and their birthday months: student → month, month → student, or both? + how sure
//   2 Worked example Start at the inputs → Follow every arrow → Shared outputs are fine → Flip it; the table writes on
//                    the board row by row as each arrow is followed; one "why?" with 3 reasons
//   3 Your turn      five points on a graph, faded from the end: the pairs are given, the kid finds the slice with two
//                    points, judges the shared output and picks the counterexample; callback to the part-1 pick
//   4 Prove it       Jordan: "y = x² is not a function: 2 and −2 both give 4" → judge, then a because-chain from
//                    reason chips (distractors = catalogue misconceptions); the graph backs each line
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/functions/script.ts = voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, withAlpha } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import { type Line, bump, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { drawWords, wordsBox } from '../../src/lesson/words';
import { btn, feedback, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item } from '../../src/lesson/runtime/item';
import { MapDiagram, type MapBlock, type MapFocus } from '../../src/lesson/topics/functions/MapDiagram';
import { PairTable, type TableBlock, type TableFocus } from '../../src/lesson/topics/functions/PairTable';
import { FnGraph, type GraphBlock, type GraphFocus } from '../../src/lesson/topics/functions/FnGraph';
import { type BoardRow, boardRow, drawRow, type Run } from '../../src/lesson/topics/functions/board';
import { MODEL, BOARD_BOX, BX, BW, BOARD_TABLE, BOARD_TABLE_LOW } from '../../src/lesson/topics/functions/layout';
import { FAMILY_NAMES, GENS, type Pic, type Hi } from '../../src/lesson/topics/functions/items';
import { PLAN } from '../../src/lesson/topics/functions/plan';
import { SCRIPT, EXAMPLE, TURN, PROVE } from '../../src/lesson/topics/functions/script';
import { checkFunction, flip } from '../../src/lesson/topics/functions/relation';

const SLUG = 'functions';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
const P = (pre: string) => progressOf(s => tr.k(pre + s));
const on = (key: string) => tr.k(key) > 0.5;

// facts the explain parts state, checked when the page loads (a wrong script cannot render)
{
  const ex = checkFunction(EXAMPLE.pairs), back = checkFunction(flip(EXAMPLE.pairs)), turn = checkFunction(TURN.pairs);
  if (!ex.fn || back.fn || back.witness?.kind !== 'two' || back.witness.x !== 'Mar' || turn.fn || turn.witness?.kind !== 'two' || turn.witness.x !== TURN.witness) throw new Error('functions: the explain-part relations do not say what the script says');
}

// ---------- the scene: the model on the left, the board (table + rows of words) on the right ----------
interface Row { R: BoardRow; key: string; strikeRun?: number }
const row = (key: string, y: number, label: string | undefined, runs: Run[], big = false, strikeRun?: number): Row => ({ R: boardRow(key, y, label, runs, BX, BW, big), key, strikeRun });
interface BTable { T: TableBlock; pre: string; alpha?: string; focus?: () => TableFocus }
interface FnScene {
  pre: string;
  map?: MapBlock | null; mapFocus?: () => MapFocus;
  graph?: GraphBlock | null; graphFocus?: () => GraphFocus;
  table?: TableBlock | null; tableFocus?: () => TableFocus;
  btables?: BTable[];
  rows?: Row[];
  lines?: Line[];
  boardBox?: Box | null;
  extra?: (c: Canvas) => void;
}
function setFn(S: FnScene): void {
  setScene({
    table: 1080,
    model: c => {
      S.map?.draw(c, P(S.pre), S.mapFocus?.());
      S.graph?.draw(c, P(S.pre), S.graphFocus?.());
      S.table?.draw(c, P(S.pre), S.tableFocus?.());
    },
    lines: S.lines ?? [], leads: [], boardBox: S.boardBox === undefined ? BOARD_BOX : S.boardBox,
    extra: c => {
      for (const b of S.btables ?? []) withAlpha(c, b.alpha ? tr.k(b.alpha) : 1, () => b.T.draw(c, P(b.pre), b.focus?.()));
      for (const r of S.rows ?? []) drawRow(c, r.R, tr.k(r.key), tr.k(r.key + ':dim'), tr.k(r.key + ':strike'), r.strikeRun);
      S.extra?.(c);
    },
  });
}
/** a TeX line on the board, shrunk (never below 60 px) to fit */
function bl(key: string, src: string, x: number, y: number, size: number, maxW = BW): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x, y, size: s };
}
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// ===== 1. The question: which way is a function? =====
const CARDS = [
  { t: 'Only student → month', mc: '', cb: 't.cb-right', short: 'student-to-month' },
  { t: 'Only month → student', mc: 'mc.functions-concept.output-uniqueness-replaces-function-test', cb: 't.cb-month', short: 'month-to-student' },
  { t: 'Both ways', mc: 'mc.functions-concept.reverse-relation-assumed-function', cb: 't.cb-both', short: 'both' },
];
function exampleMap(): MapBlock { return MapDiagram(EXAMPLE.map, MODEL, th); }
function partQuestion(): void {
  tr.reset('q.');
  const map = exampleMap();
  const rows = [
    row('q.rA', 300, 'read one way', [{ t: 'student', col: 'first' }, { t: '  →  ', col: 'dim' }, { t: 'month', col: 'second' }], true),
    row('q.rB', 520, 'or the other way', [{ t: 'month', col: 'second' }, { t: '  →  ', col: 'dim' }, { t: 'student', col: 'first' }], true),
    row('q.rQ', 760, undefined, [{ t: 'Which is a function?', col: 'ink' }]),
  ];
  setFn({ pre: 'q.', map, rows });
  tr.set('q.ovals', 1, 0.8); tr.set('q.ins', 1, 0.7, 0.5); tr.set('q.outs', 1, 0.7, 0.8);
  EXAMPLE.map.arrows.forEach((_, i) => tr.set('q.a' + i, 1, 0.7, 1.1 + i * 0.25));
  tr.set('q.rA', 1, 0.8, 2.4); tr.set('q.rB', 1, 0.8, 2.8); tr.set('q.rQ', 1, 0.8, 3.2);

  const cards = h('div', { class: 'cards words', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Students and birthday months: is student -> month, month -> student, or both a function?', response: p.short, expected: 'student-to-month', correct: !p.mc, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => cards.append(btn(cd.t, () => { commit().pick = i; sync(); })));
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two ways to read one record'), html('p', '', SCRIPT['q.intro']!), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
  seq(async alive => { await ctx.say('q.intro'); if (!alive()) return; await ctx.say('q.ask'); if (!alive()) return; void ctx.say('q.sure'); });
}

// ===== 2. Worked example: student → month is a function, month → student is not =====
const tableA = () => PairTable({ xs: EXAMPLE.pairs.map(p => p[0]), ys: EXAMPLE.pairs.map(p => p[1]), xName: 'student', yName: 'month' }, BOARD_TABLE, th);
const tableB = () => PairTable({ xs: EXAMPLE.back.map(p => p[0]), ys: EXAMPLE.back.map(p => p[1]), xName: 'month', yName: 'student', xCol: 'second', yCol: 'first' }, BOARD_TABLE, th);
/** the map's colours for parts 1-2: following (pick), the shared March (lime), the flipped March (red) */
function exampleFocus(pre: string): () => MapFocus {
  return () => {
    const f: MapFocus = { inPulse: {}, outPulse: {}, arrowCol: {}, outCol: {}, lit: [], dim: 0 };
    const flipped = tr.k(pre + 'flip') > 0.5, shared = on(pre + 'share');
    for (let i = 0; i < 5; i++) f.inPulse![i] = Math.max(tr.k(pre + 'pIn'), tr.k(pre + 'pi' + i));
    for (let j = 0; j < 4; j++) f.outPulse![j] = tr.k(pre + 'po' + j);
    for (let i = 0; i < 5; i++) if (on(pre + 'f' + i)) { f.arrowCol![i] = 'pick'; (f.lit as number[]).push(i); f.dim = 1; }
    if (shared && !flipped) { f.arrowCol![0] = 'link'; f.arrowCol![2] = 'link'; f.outCol![0] = 'link'; }
    if (flipped) { f.arrowCol![0] = 'wrong'; f.arrowCol![2] = 'wrong'; f.outCol![0] = 'wrong'; }
    if (!f.lit!.length) delete f.lit;
    return f;
  };
}
function partExample(): void {
  tr.reset('e.');
  const map = exampleMap(), A = tableA(), B = tableB();
  const R1 = row('e.R1', 712, 'student → month', [{ t: 'a function', col: 'link' }], true);
  const R2 = row('e.R2', 892, 'month → student', [{ t: 'not a function', col: 'wrong' }], true);
  setFn({
    pre: 'e.', map, mapFocus: exampleFocus('e.'),
    btables: [
      { T: A, pre: 'e.A.', alpha: 'e.tA', focus: () => ({ xName: tr.k('e.Ax'), rowPulse: Object.fromEntries(range(5).map(i => [i, tr.k('e.pr' + i)])), rowCol: (on('e.share') ? { 0: 'link', 2: 'link' } : {}) as TableFocus['rowCol'] }) },
      { T: B, pre: 'e.B.', alpha: 'e.tB', focus: () => ({ rowCol: { 0: 'wrong', 1: 'wrong' }, xName: tr.k('e.Bx') }) },
    ],
    rows: [R1, R2],
  });
  for (const s of ['ovals', 'ins', 'outs', ...EXAMPLE.map.arrows.map((_, i) => 'a' + i)]) tr.jump('e.' + s, 1);
  tr.jump('e.tA', 1);

  let step = 0;
  const STEPS = [
    { t: 'Start at the inputs', why: 'The arrows leave the inputs: here, the students.', act: 'Show the inputs', say: 'e.s1' },
    { t: 'Follow every arrow', why: 'Count the arrows that leave each input.', act: 'Follow them', say: 'e.s2' },
    { t: 'Shared outputs are fine', why: 'Two inputs may point to the same output.', act: 'Check March', say: 'e.s3' },
    { t: 'Flip it and check again', why: 'Read month → student: now the months are the inputs.', act: 'Flip it', say: 'e.s4' },
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
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        void bump('e.pIn', alive); tr.set('e.A.grid', 1, 0.8, 0.3); await wait(1.0); if (!alive()) return;
        await bump('e.Ax', alive);
      } else if (i === 1) {
        for (let j = 0; j < 5; j++) {
          const out = EXAMPLE.map.arrows[j]![1];
          tr.set('e.f' + j, 1, 0.25); void bump('e.pi' + j, alive);
          await wait(0.45); if (!alive()) return;
          void bump('e.po' + out, alive); tr.set('e.A.r' + j, 1, 0.6); void bump('e.pr' + j, alive);
          await wait(0.75); if (!alive()) return;
          tr.set('e.f' + j, 0, 0.25);
        }
      } else if (i === 2) {
        tr.set('e.share', 1, 0.5); void bump('e.po0', alive); await wait(1.0); if (!alive()) return;
        tr.set('e.R1', 1, 0.9); await wait(0.9);
      } else {
        tr.set('e.R1:dim', 1, 0.6);
        tr.set('e.flip', 1, 1.2); await wait(1.3); if (!alive()) return;
        void bump('e.po0', alive);
        tr.set('e.tA', 0, 0.6); tr.set('e.tB', 1, 0.6, 0.3); tr.set('e.B.grid', 1, 0.5, 0.3);
        for (let j = 0; j < 5; j++) tr.set('e.B.r' + j, 1, 0.5, 0.6 + j * 0.18);
        await wait(1.8); if (!alive()) return;
        tr.set('e.R2', 1, 0.9); await wait(0.9);
      }
      if (!alive()) return;
      if (i === 3) { sayBox.replaceChildren(html('p', '', SCRIPT['e.s4']!)); selfExplain(); }
      else sayBox.replaceChildren(said(STEPS[i]!.say));
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Each student has exactly one month; two students sharing a month is allowed.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'It isn’t one: in a function, no two inputs may share an output.', ok: false, mc: 'mc.functions-concept.function-means-one-to-one', id: 'e.w-oto' },
      { t: 'Only the first arrow from each student counts.', ok: false, mc: 'mc.functions-concept.mapping-first-arrow-only', id: 'e.w-first' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is student -> month a function, even though March is used twice?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), bx, fbHost);
    seq(async alive => { await wait(0.2); await ctx.say('e.s4'); if (alive()) void ctx.say('e.why'); });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: points on a graph, faded from the end =====
function sliceHits(pts: readonly { x: number; y: number }[], x: number): { y: number; col: 'link' | 'wrong' }[] {
  const at = pts.filter(p => Math.abs(p.x - x) < 0.08);
  return at.map(p => ({ y: p.y, col: at.length >= 2 ? 'wrong' : 'link' }));
}
function partTurn(): void {
  tr.reset('t.');
  const G = FnGraph(TURN.graph, MODEL, th);
  const pts = TURN.graph.points!;
  const T = PairTable({ xs: TURN.pairs.map(p => p[0]), ys: TURN.pairs.map(p => p[1]), xName: 'x', yName: 'y' }, BOARD_TABLE, th);
  const R1 = row('t.R1', 702, 'the input 1', [{ t: '(1, 3)', col: 'wrong', num: true }, { t: ' and ', col: 'dim' }, { t: '(1, −4)', col: 'wrong', num: true }]);
  const R2 = row('t.R2', 848, 'the output 2', [{ t: 'shared: ', col: 'dim' }, { t: 'allowed', col: 'link' }]);
  const R3 = row('t.R3', 962, undefined, [{ t: 'not a function', col: 'wrong' }], true);
  setFn({
    pre: 't.', graph: G,
    graphFocus: () => {
      const x = tr.k('t.sx'), ks = tr.k('t.slice');
      const ptCol: Record<string, 'wrong' | 'link'> = {};
      if (on('t.bad')) { ptCol.p2 = 'wrong'; ptCol.p4 = 'wrong'; }
      if (on('t.shared')) { ptCol.p0 = 'link'; ptCol.p3 = 'link'; }
      return { slice: { x, k: ks, hits: sliceHits(pts, x) }, hline: { y: 2, k: tr.k('t.hl'), col: 'link' }, ptCol, ptPulse: Object.fromEntries(range(5).map(i => ['p' + i, tr.k('t.pp' + i)])) };
    },
    btables: [{ T, pre: 't.T.', focus: () => ({ rowPulse: Object.fromEntries(range(5).map(i => [i, tr.k('t.pp' + i)])), rowCol: { ...(on('t.bad') ? { 2: 'wrong', 4: 'wrong' } : {}), ...(on('t.shared') ? { 0: 'link', 3: 'link' } : {}) } as TableFocus['rowCol'] }) }],
    rows: [R1, R2, R3],
  });
  tr.set('t.axes', 1, 0.8); tr.set('t.T.grid', 1, 0.6, 0.4);

  let step = 0;
  const STEPS = [
    { t: 'Read each point as (input, output)', why: 'Done for you.' },
    { t: 'Slice each input', why: 'Your step.' },
    { t: 'Shared outputs are fine', why: 'Your step.' },
    { t: 'Name the counterexample', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.0); if (!alive()) return;
    for (let i = 0; i < 5; i++) {
      tr.set('t.pt:p' + i, 1, 0.5); tr.set('t.T.r' + i, 1, 0.6); void bump('t.pp' + i, alive);
      await wait(0.75); if (!alive()) return;
    }
    work.replaceChildren(said('t.s1'));
    await wait(2.4); if (!alive()) return;
    step = 1; drawPlan(); askSlice();
  });

  function askSlice(): void {
    const fbHost = h('div'), xs = h('div', { class: 'xs', role: 'group', 'aria-label': 'inputs' });
    let done = false;
    [-3, -1, 1, 3].forEach(x => xs.append(btn(x < 0 ? '−' + -x : String(x), () => {
      if (done) return;
      const ok = x === TURN.witness, shared = x === 3 || x === -3;
      ctx.store.log({ part: 'turn', item: 'turn.slice', prompt: 'Which input has two points on its slice?', response: x, expected: TURN.witness, correct: ok, mc: shared ? 'mc.functions-concept.output-uniqueness-replaces-function-test' : undefined });
      xs.querySelectorAll('button').forEach(b => b.classList.toggle('nope', !ok && b.textContent === (x < 0 ? '−' + -x : String(x))));
      if (!ok) { fbHost.replaceChildren(fb(false, shared ? 't.sl-shared' : 't.sl-other')); return; }
      done = true;
      [...xs.querySelectorAll('button')].find(b => b.textContent === '1')?.classList.add('right');
      fbHost.replaceChildren(fb(true, 't.sl-ok'));
      seq(async alive => {
        tr.jump('t.sx', -3); tr.set('t.slice', 1, 0.5); await wait(0.9); if (!alive()) return;
        tr.set('t.sx', -1, 0.8); await wait(1.2); if (!alive()) return;
        tr.set('t.sx', 1, 0.8); await wait(1.5); if (!alive()) return;
        tr.set('t.sx', 3, 0.8); await wait(1.2); if (!alive()) return;
        tr.set('t.sx', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('t.bad', 1, 0.3); tr.set('t.R1', 1, 0.9); await wait(1.4); if (!alive()) return;
        step = 2; drawPlan(); askShare();
      });
    })));
    work.replaceChildren(said('t.slice'), xs, fbHost);
  }
  function askShare(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    const opts = [{ t: 'Yes, that breaks it.', ok: false }, { t: 'No, that is allowed.', ok: true }];
    opts.forEach(o => bx.append(btn(o.t, () => {
      if (done) return;
      ctx.store.log({ part: 'turn', item: 'turn.share', prompt: '(-3, 2) and (3, 2) share the output 2. Does that break the function?', response: o.t, expected: 'No, that is allowed.', correct: o.ok, mc: o.ok ? undefined : 'mc.functions-concept.function-means-one-to-one' });
      bx.querySelectorAll('button').forEach(b => b.classList.toggle('nope', !o.ok && b.textContent === o.t));
      if (!o.ok) { fbHost.replaceChildren(fb(false, 't.sh-no')); return; }
      done = true;
      [...bx.querySelectorAll('button')].find(b => b.textContent === o.t)?.classList.add('right');
      fbHost.replaceChildren(fb(true, 't.sh-ok'));
      seq(async alive => {
        tr.set('t.slice', 0, 0.4); tr.set('t.R1:dim', 1, 0.6);
        tr.set('t.hl', 1, 1.0); await wait(0.8); if (!alive()) return;
        tr.set('t.shared', 1, 0.3); void bump('t.pp0', alive); void bump('t.pp3', alive);
        tr.set('t.R2', 1, 0.9); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); askWitness();
      });
    })));
    work.replaceChildren(said('t.share'), bx, fbHost);
  }
  function askWitness(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    let done = false;
    const opts = [
      { t: 'The input 1 has two outputs: (1, 3) and (1, −4).', ok: true, id: 't.w-ok', mc: undefined as string | undefined },
      { t: 'The output 2 has two inputs: (−3, 2) and (3, 2).', ok: false, id: 't.w-out', mc: 'mc.functions-concept.output-uniqueness-replaces-function-test' },
      { t: 'It fails the vertical line test somewhere.', ok: false, id: 't.w-vague', mc: 'mc.functions-concept.nonfunction-justification-missing-witness' },
    ];
    opts.forEach(o => bx.append(btn(o.t, () => {
      if (done) return;
      ctx.store.log({ part: 'turn', item: 'turn.witness', prompt: 'Which sentence proves that this is not a function?', response: o.t, correct: o.ok, mc: o.mc });
      bx.querySelectorAll('button').forEach(b => b.classList.toggle('nope', !o.ok && b.textContent === o.t));
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      [...bx.querySelectorAll('button')].find(b => b.textContent === o.t)?.classList.add('right');
      seq(async alive => {
        tr.set('t.hl', 0, 0.5); tr.set('t.R2:dim', 1, 0.6); tr.set('t.R1:dim', 0, 0.6);
        tr.set('t.sx', 1, 0.01); tr.set('t.slice', 1, 0.6); await wait(0.7); if (!alive()) return;
        tr.set('t.R3', 1, 0.9); await wait(1.4); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    })));
    work.replaceChildren(said('t.wit'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, card = CARDS[pick ?? 0]!;
    const ids = pick === null ? ['t.cb-right'] : [card.cb, ...(card.mc && (commit().sure ?? 0) >= 1 ? ['t.cb-sure'] : [])];
    c.innerHTML = ids.map(i => SCRIPT[i]).join(' ');
    seq(async alive => { await wait(1.4); for (const i of ids) { if (!alive()) return; await ctx.say(i); } });
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Jordan says y = x² is not a function =====
function partProve(): void {
  tr.reset('p.');
  const G = FnGraph(PROVE.graph, MODEL, th);
  const R0 = row('p.R0', 196, 'Jordan says', [{ t: 'y = x² is ' }, { t: 'not a function', col: 'wrong' }], true, 1);
  const R1 = row('p.R1', 400, 'each input', [{ t: 'x → x²', col: 'first' }, { t: ':  one value', col: 'link' }]);
  const R2 = row('p.R2', 600, 'the output 4', [{ t: '(−2, 4), (2, 4)', num: true }, { t: ':  allowed', col: 'link' }]);
  const R3 = row('p.R3', 820, undefined, [{ t: 'y = x² is ' }, { t: 'a function', col: 'link' }], true);
  setFn({
    pre: 'p.', graph: G,
    graphFocus: () => {
      const x = tr.k('p.sx');
      return {
        slice: { x, k: tr.k('p.slice'), hits: [{ y: x * x, col: 'link' }] },
        hline: { y: 4, k: tr.k('p.hl'), col: 'link' },
        ptCol: { m: 'link', n: 'link' }, ptPulse: { m: tr.k('p.pm'), n: tr.k('p.pm') },
      };
    },
    rows: [R0, R1, R2, R3],
  });
  tr.set('p.axes', 1, 0.8); tr.set('p.path:c', 1, 1.4, 0.5); tr.set('p.R0', 1, 1.0, 1.2);

  const CHIPS = [
    { t: 'Squaring a number is one calculation with one result.', fits: 0 },
    { t: 'Different inputs may share an output.', fits: 1 },
    { t: 'A function needs exactly one output for each input, nothing more.', fits: 2 },
    { t: 'A function’s graph must be a straight line.', fits: -1, mc: 'mc.functions-concept.requires-linearity', id: 'p.x-line' },
    { t: 'Checking x = 1, 2 and 3 is enough to prove it.', fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.x-examples' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    void ctx.say(CLAIMS[n - 1]!);
    seq(async alive => {
      if (n === 1) {
        tr.jump('p.sx', -2); tr.set('p.slice', 1, 0.5); await wait(0.6); if (!alive()) return;
        for (const x of [-1, 0, 1, 2]) { tr.set('p.sx', x, 0.6); await wait(0.85); if (!alive()) return; }
        tr.set('p.R1', 1, 0.9);
      }
      if (n === 2) {
        tr.set('p.slice', 0, 0.5); tr.set('p.R1:dim', 1, 0.6); tr.set('p.hl', 1, 1.0); await wait(0.8); if (!alive()) return;
        tr.set('p.pt:m', 1, 0.5); tr.set('p.pt:n', 1, 0.5); void bump('p.pm', alive); await wait(0.6); if (!alive()) return;
        tr.set('p.R2', 1, 0.9);
      }
      if (n === 3) {
        tr.set('p.R2:dim', 1, 0.6); tr.set('p.hl', 0, 0.5);
        tr.set('p.R0:strike', 1, 0.7); await wait(0.8); if (!alive()) return;
        tr.set('p.R3', 1, 1.0); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const proofHost = h('div'), judge = h('div', { class: 'opts' });
  let judged = false;
  const J = [
    { t: 'Jordan is right: a function can’t repeat an output.', mc: 'mc.functions-concept.function-means-one-to-one' },
    { t: 'Jordan is wrong: y = x² is a function.', mc: undefined },
    { t: 'Jordan is right: the graph is not a straight line.', mc: 'mc.functions-concept.requires-linearity' },
  ];
  J.forEach((j, i) => judge.append(btn(j.t, () => {
    if (judged) return;
    judged = true;
    judge.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('on', k === i); (b as HTMLButtonElement).disabled = k !== i; });
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: y = x^2 is not a function, because 2 and -2 both give 4. Is Jordan right?', response: j.t, expected: J[1]!.t, correct: i === 1, mc: j.mc });
    proofHost.replaceChildren(said(i === 1 ? 'p.j-ok' : 'p.j-test'), chain, chipBox, fbHost);
    drawChain();
  })));
  setPanel(h('h2', {}, 'Prove it'), html('p', '', SCRIPT['p.intro']!), html('p', '', SCRIPT['p.ask']!), judge, proofHost);
  seq(async alive => { await ctx.say('p.intro'); if (alive()) void ctx.say('p.ask'); });
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it),
  });
}
/** a board line that is only words, names, arrows and sets reads better in the page sans (TeX stays for maths) */
function asWords(src: string): string | null {
  // an equation or inequality in x and y stays TeX
  if (/\^|\\le|\\ge|\\Rightarrow|(?<![a-z\\])[xy]\s*[=<>+]|[=+]\s*-?\d*[xy](?![a-z])/.test(src)) return null;
  const t =src.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\to/g, ' → ').replace(/\\q?quad/g, '   ').replace(/\\[ ,;]/g, ' ')
    .replace(/\\\{/g, '\u0001').replace(/\\\}/g, '\u0002').replace(/[{}]/g, '').replace(/\u0001/g, '{').replace(/\u0002/g, '}').replace(/\\le\b/g, '≤').replace(/-(?=\d)/g, '−').replace(/\s+/g, ' ').trim();
  return /[\\^_]/.test(t) ? null : t;
}
/** the item's notation on the board: up to three lines, words in the sans, maths in TeX */
function boardOf(src: string, y0: number, hi?: Hi): { lines: Line[]; rows: Row[] } {
  const lines: Line[] = [], rows: Row[] = [];
  const srcs = src.split('\n');
  srcs.forEach((s, i) => {
    const w = asWords(s), y = y0 + i * 112;
    if (w !== null) { try { rows.push(row('x.L' + i, y, undefined, [{ t: w, col: 'ink' }])); return; } catch { /* too long: TeX */ } }
    lines.push(bl('x.L' + i, s, BX, y, 70));
  });
  // after a miss, the worked solution's key fact is written under the notation, in the colour of the picture's focus
  if (hi?.note) { try { rows.push(row('x.note', y0 + srcs.length * 112 + 60, undefined, [{ t: hi.note, col: hi.col, num: /^[\dx(−-]/.test(hi.note) }])); } catch { /* no room: the panel has it */ } }
  return { lines, rows };
}
function hiOn(): boolean { return tr.k('x.hi') > 0.3; }
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as Pic | undefined;
  const hi: Hi | undefined = pic?.hi;
  const solve = async (alive: () => boolean) => { if (!hi && !(pic?.kind === 'map' && pic.missing !== undefined)) return; tr.set('x.hi', 1, 0.9); tr.set('x.note', 1, 0.9, 0.5); await wait(1.0); if (!alive()) return; };
  const reveal = (keys: string[], at = 0.2) => keys.forEach((k, i) => tr.set('x.' + k, 1, 0.6, at + i * 0.12));
  if (pic?.kind === 'map') {
    const r = tryBlock(() => MapDiagram(pic, MODEL, th));
    if (r.ok) {
      const miss = pic.missing !== undefined ? pic.ins.indexOf(pic.missing) : -1;
      setFn({
        pre: 'x.', map: r.value, ...boardOf(item.board, 200, hi),
        mapFocus: () => {
          const f: MapFocus = { arrowCol: {}, inCol: {}, inPulse: {} };
          if (hiOn() && hi) for (const a of hi.arrows ?? []) f.arrowCol![a] = hi.col;
          if (hiOn() && miss >= 0) { f.inCol![miss] = 'wrong'; f.inPulse![miss] = tr.k('x.hi'); }
          return f;
        },
      });
      reveal(['ovals', 'ins', 'outs', ...pic.arrows.map((_, i) => 'a' + i)]);
      tr.set('x.L0', 1, 0.8, 0.3); tr.set('x.L1', 1, 0.8, 0.5);
      return { solve };
    }
  }
  if (pic?.kind === 'table') {
    const r = tryBlock(() => PairTable({ ...pic, align: 'center' }, MODEL, th));
    if (r.ok) {
      setFn({ pre: 'x.', table: r.value, ...boardOf(item.board, 200, hi), tableFocus: () => (hiOn() && hi?.rows ? { rowCol: Object.fromEntries(hi.rows.map(i => [i, hi.col])) } : {}) });
      reveal(['grid', ...pic.xs.map((_, i) => 'r' + i)]);
      tr.set('x.L0', 1, 0.8, 0.3); tr.set('x.L1', 1, 0.8, 0.5);
      return { solve };
    }
  }
  if (pic?.kind === 'graph') {
    const r = tryBlock(() => FnGraph(pic, MODEL, th));
    const side = pic.side ? tryBlock(() => PairTable(pic.side!, BOARD_TABLE_LOW, th)) : null;
    if (r.ok && (!side || side.ok)) {
      setFn({
        pre: 'x.', graph: r.value, ...boardOf(item.board, 180, hi),
        btables: side && side.ok ? [{ T: side.value, pre: 'x.s.' }] : [],
        graphFocus: () => {
          const k = tr.k('x.hi');
          const f: GraphFocus = { ptCol: {} };
          if (hi?.slice) f.slice = { x: hi.slice.x, k, hits: hi.slice.hits };
          if (hi?.hline !== undefined) f.hline = { y: hi.hline, k, col: hi.col };
          if (k > 0.3 && hi) for (const p of hi.pts ?? []) { f.ptCol![p] = hi.col; }
          if (k > 0.3 && hi?.pts) f.ptPulse = Object.fromEntries(hi.pts.map(p => [p, k]));
          return f;
        },
      });
      reveal(['axes', ...pic.paths.map(p => 'path:' + p.key), ...pic.points.map(p => 'pt:' + p.key)]);
      if (pic.side) { tr.set('x.s.grid', 1, 0.6, 0.4); pic.side.xs.forEach((_, i) => tr.set('x.s.r' + i, 1, 0.6, 0.5 + i * 0.1)); }
      tr.set('x.L0', 1, 0.8, 0.3); tr.set('x.L1', 1, 0.8, 0.5); tr.set('x.L2', 1, 0.8, 0.7);
      return { solve };
    }
  }
  // bare notation: big lines on a wide slate
  const big = box(200, 260, 1720, 820);
  const srcs = item.board.split('\n');
  const lines: Line[] = [], words: { key: string; t: string; y: number }[] = [];
  srcs.forEach((s, i) => {
    const y = big.cy + (i - (srcs.length - 1) / 2) * 150, w = asWords(s);
    // words (names, sets, short sentences) in the page sans, centred; maths in TeX
    if (w !== null && wordsBox(w, 0, 0, { size: 84 }).w < big.w - 140) { words.push({ key: 'x.L' + i, t: w, y }); return; }
    const F = tex(s) as Formula;
    let size = srcs.length > 1 ? 104 : 130;
    while (size > 64 && texWidth(F, size) > big.w - 140) size -= 4;
    lines.push({ key: 'x.L' + i, F, x: big.cx - texWidth(F, size) / 2, y, size });
  });
  setFn({ pre: 'x.', lines, boardBox: big, extra: c => { for (const w of words) drawWords(c, w.t, big.cx, w.y, 'ink', tr.k(w.key), { size: 84, align: 'center' }); } });
  srcs.forEach((_, i) => tr.set('x.L' + i, 1, 0.8, 0.1 + i * 0.25));
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{allowed inputs: } \\{1,\\ 2\\}', 'x^2 + y^2 = 25', '(4,\\ -2)', 'y = 2x - 3'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
