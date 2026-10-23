// expand-and-factor.ts: "Expand, combine, and factor linear expressions" (grade 7, 7.EE.A.1-2), on the lesson runtime.
//   1 The question   a garden bed 4 ft wide, x ft of tomatoes + 3 ft of herbs: 4(x + 3) = ? (4x + 3, 4x + 12, 16x) + how sure
//   2 Worked example Build -> Split -> Count -> Both ways on algebra tiles; every line of the chain is written beside the
//                    picture in the colours of its parts (x amber, constants teal); one "why + 12, not + 3?"
//   3 Your turn      3(2x + 5), faded from the end: build and split are given; the kid finds the areas, names the
//                    property and reads it backwards (factoring); the callback to part 1
//   4 Prove it       Riley: "2(x + 3) and 3x + 4 are equivalent, I tried x = 2"; a because-chain from reason chips
//                    (distractors = PEMDAS-as-property, examples-as-proof, counterexample-as-exception), backed by the
//                    box and a value table
//   5 Practice       all 22 sub-goals one after another, then mixed (runtime/practice.ts), with tiles, boxes, term
//                    tiles and value tables as pictures
// Voiced lines: src/lesson/topics/expand-and-factor/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, bump, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item } from '../../src/lesson/runtime/item';
import { drawWords } from '../../src/lesson/words';
import { AreaTiles, AreaGrid, type TilesBlock, type TilesFocus, type GridBlock, type GridFocus } from '../../src/lesson/topics/expand-and-factor/AreaModel';
import { TermTiles } from '../../src/lesson/topics/expand-and-factor/TermTiles';
import { ValueTable, type TableFocus } from '../../src/lesson/topics/expand-and-factor/ValueTable';
import { FAMILY_NAMES, GENS, type EFItem } from '../../src/lesson/topics/expand-and-factor/items';
import { explain } from '../../src/lesson/topics/expand-and-factor/explain';
import { PLAN } from '../../src/lesson/topics/expand-and-factor/plan';
import { SCRIPT } from '../../src/lesson/topics/expand-and-factor/script';
import { t, expand } from '../../src/lesson/topics/expand-and-factor/expr';

const SLUG = 'expand-and-factor';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator (`speaking` resolves when it ends) */
let speaking: Promise<void> = Promise.resolve();
function said(id: string, cls = ''): HTMLElement { speaking = ctx.say(id); return html('p', cls, SCRIPT[id]?.html ?? id); }
/** queue a line after the one being spoken (dropped when the kid leaves the part) */
function sayNext(id: string): void {
  const prev = speaking;
  speaking = new Promise<void>(res => seq(async alive => { await prev; if (alive()) await ctx.say(id); res(); }));
}
const fbk = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id, extra); };

// ---------- layout: the model on the left, a wider board on the right (the chains of equalities need room) ----------
const MF = frame(60, 70, 980, 940);
const BRD = box(1100, 70, 1860, 1010), LX = BRD.x0 + 50, BW = BRD.w - 100;
const T = { a: { col: 'first' as const }, b: { col: 'second' as const }, a2: { col: 'first' as const }, b2: { col: 'second' as const }, s: { col: 'link' as const }, ne: { col: 'pick' as const } };
/** a line of TeX on the board (shrinks to fit the board, never below 56 px) */
function ln(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Line['col']): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 56 && texWidth(F, s) > BW) s -= 2;
  return { key, F, x: LX, y, size: s, tags, col };
}
interface Scene { model?: (c: Canvas) => void; lines: Line[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
function scene(S: Scene): void { setScene({ table: 1022, model: S.model, lines: S.lines, leads: [], boardBox: S.boardBox === undefined ? BRD : S.boardBox, extra: S.extra }); }
const P = (pre: string) => progressOf((s: string) => tr.k(pre + s));
/** words on the board (labels such as "distributive property"), fading in with their key */
function boardWords(c: Canvas, key: string, text: string, y: number, col: 'dim' | 'link' | 'pick' | 'ink' = 'dim', x = LX, align: 'left' | 'right' = 'left'): void {
  drawWords(c, text, x, y, col, tr.k(key), { size: 44, align, weight: 600 });
}
const tilesFocus = (pre: string): TilesFocus => ({
  ring: tr.k(pre + 'rRow') > 0 ? 'row' : tr.k(pre + 'rX') > 0 ? 'x' : tr.k(pre + 'rU') > 0 ? 'u' : null,
  ringK: Math.max(tr.k(pre + 'rRow'), tr.k(pre + 'rX'), tr.k(pre + 'rU')),
  dim: 0.6 * Math.max(tr.k(pre + 'rX'), tr.k(pre + 'rU')),
  pA: tr.k(pre + 'pA'), pTop: tr.k(pre + 'pTop'), count: tr.k(pre + 'count'),
});
const build = (pre: string, d = 0) => { tr.set(pre + 'frame', 1, 0.7, d); tr.set(pre + 'row', 1, 0.8, d + 0.4); tr.set(pre + 'rows', 1, 1.6, d + 1.1); };
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };

// ===== 1. The question =====
const EX = { a: 4, p: 1, q: 3, unit: ' ft' };
const CARDS = [
  { t: '4<i>x</i> + 3', log: '4x + 3', mc: 'mc.properties.partial-distribution', cb: 't.cb-part' },
  { t: '4<i>x</i> + 12', log: '4x + 12', mc: '', cb: 't.cb-right' },
  { t: '16<i>x</i>', log: '16x', mc: 'mc.expressions.combines-unlike-terms', cb: 't.cb-unlike' },
];
function partQuestion(): void {
  tr.reset('q.');
  const m = AreaTiles(EX, MF, th);
  const L0 = ln('q.l0', '\\text{area}', 200, 52, undefined, 'dim');
  const L1 = ln('q.l1', '4(\\cssId{a}{x} + \\cssId{b}{3})', 310, 96, T);
  const L2 = ln('q.l2', '= \\;?', 450, 96);
  scene({ model: c => m.draw(c, P('q.'), tilesFocus('q.')), lines: [L0, L1, L2] });
  build('q.');
  tr.set('q.l0', 1, 0.6, 2.4); tr.set('q.l1', 1, 1.0, 2.6); tr.set('q.l2', 1, 0.6, 3.4);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A garden bed 4 ft wide: x ft of tomatoes, 3 ft of herbs. Which expression equals 4(x + 3) for every x?', board: '4(x + 3)', response: p.log, expected: '4x + 12', correct: !p.mc, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.t}</span><small>square feet</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = html('p', '', SCRIPT['q.intro']!.html), ask = html('p', '', SCRIPT['q.ask']!.html);
  setPanel(h('h2', {}, 'A garden bed'), intro, ask, cards, h('div', { class: 'label' }, SCRIPT['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
  speaking = ctx.say('q.intro'); sayNext('q.ask'); sayNext('q.sure');
}

// ===== 2. Worked example: 4(x + 3) =====
function partExample(): void {
  tr.reset('e.');
  const m = AreaTiles(EX, MF, th);
  const L0 = ln('e.L0', '4(\\cssId{a}{x} + \\cssId{b}{3})', 200, 92, T);
  const Q = ln('e.q', '= \\;?', 330, 92);
  const L1 = ln('e.L1', '= \\cssId{a}{4 \\cdot x} + \\cssId{b}{4 \\cdot 3}', 330, 84, T);
  const L2 = ln('e.L2', '= \\cssId{a}{4x} + \\cssId{b}{12}', 470, 84, T);
  const H = ln('e.H', '\\cssId{s}{4(x + 3) = 4x + 12}', 680, 80, T);
  scene({
    model: c => m.draw(c, P('e.'), tilesFocus('e.')), lines: [L0, Q, L1, L2, H],
    extra: c => {
      boardWords(c, 'e.w1', 'the distributive property', 770, 'dim');
      boardWords(c, 'e.w2', 'expand  →', 870, 'link');
      boardWords(c, 'e.w3', '←  factor', 870, 'pick', LX + BW, 'right');
    },
  });
  jump('e.', ['frame', 'row', 'rows', 'L0', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Build it', why: 'Rows of x + 3, as many rows as the factor.', act: 'Build' },
    { t: 'Split it at the seam', why: 'Every part keeps all the rows.', act: 'Split' },
    { t: 'Find each part’s area', why: 'Count the strips and the squares.', act: 'Count' },
    { t: 'Read it both ways', why: 'Expand one way, factor the other.', act: 'Both ways' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren(said(`e.s${i + 1}`));
    seq(async alive => {
      if (i === 0) {
        tr.set('e.rRow', 1, 0.5); void bump('e.pTop', alive); await wait(1.3); if (!alive()) return;
        tr.set('e.rRow', 0, 0.4); tr.jump('e.rows', 0); tr.set('e.rows', 1, 1.8, 0.2);
        void bump('e.pA', alive); await wait(2.2);
      } else if (i === 1) {
        tr.set('e.q', 0, 0.4); tr.set('e.split', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.L1', 1, 1.2); tr.set('e.rX', 1, 0.5, 0.1); await wait(1.2); if (!alive()) return;
        tr.set('e.rX', 0, 0.4); tr.set('e.rU', 1, 0.5, 0.2); await wait(1.4); if (!alive()) return;
        tr.set('e.rU', 0, 0.5);
      } else if (i === 2) {
        tr.set('e.L1:dim', 1, 0.5); tr.set('e.rU', 1, 0.4); tr.set('e.count', 1, 2.4, 0.3); await wait(2.9); if (!alive()) return;
        tr.set('e.rU', 0, 0.4); tr.set('e.area', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.L2', 1, 1.1); await wait(1.2);
      } else {
        tr.set('e.count', 0, 0.5); tr.set('e.L0:dim', 1, 0.5); tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.H', 1, 1.4); await wait(1.5); if (!alive()) return;
        tr.set('e.w1', 1, 0.6); tr.set('e.w2', 1, 0.6, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('e.area', 0, 0.5); tr.set('e.join', 1, 1.3, 0.2); tr.set('e.w3', 1, 0.6, 0.9); await wait(1.6); if (!alive()) return;
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Each of the 4 rows has 3 squares: 4 × 3 = 12.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'The 4 only multiplies the x, the term right next to it.', ok: false, mc: 'mc.properties.partial-distribution', id: 'e.w-part' },
      { t: 'Because of the order of operations (PEMDAS).', ok: false, mc: 'mc.properties.names-non-property', id: 'e.w-pemdas' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => box_.append(btn(o.t, () => {
      box_.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is 4(x + 3) = 4x + 12, and not 4x + 3?', response: o.t, correct: o.ok, mc: o.mc });
      if (!o.ok) seq(async alive => { tr.set('e.rU', 1, 0.4); tr.jump('e.count', 0); tr.set('e.count', 1, 2.0, 0.2); await wait(2.4); if (alive()) tr.set('e.rU', 0, 0.5); });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!.html), box_, fbHost);
    sayNext('e.why');
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: 3(2x + 5), faded from the end =====
function partTurn(): void {
  tr.reset('t.');
  const m = AreaTiles({ a: 3, p: 2, q: 5 }, MF, th);
  const L0 = ln('t.L0', '3(\\cssId{a}{2x} + \\cssId{b}{5})', 200, 92, T);
  const L1 = ln('t.L1', '= \\cssId{a}{3 \\cdot 2x} + \\cssId{b}{3 \\cdot 5}', 330, 84, T);
  const L2 = ln('t.L2', '= \\cssId{a}{6x} + \\cssId{b}{15}', 470, 84, T);
  const H = ln('t.H', '3(2x + 5) = 6x + 15', 640, 76, undefined, 'link');
  const F = ln('t.F', '6x + 15 = \\cssId{ne}{3}(2x + 5)', 840, 76, T);
  scene({
    model: c => m.draw(c, P('t.'), tilesFocus('t.')), lines: [L0, L1, L2, H, F],
    extra: c => { boardWords(c, 't.w1', 'the distributive property', 730, 'dim'); boardWords(c, 't.w2', '←  factor', 930, 'pick'); },
  });
  let step = 0;
  const STEPS = [
    { t: 'Build it', why: 'Done for you.' },
    { t: 'Split it at the seam', why: 'Done for you.' },
    { t: 'Find each part’s area', why: 'Your step.' },
    { t: 'Read it both ways', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Three rows of 2x + 5'), said('t.intro'), plan, work);
  seq(async alive => {
    build('t.', 0.3); tr.set('t.L0', 1, 1.0, 1.6); void bump('t.pA', alive); await wait(3.4); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.split', 1, 1.2); await wait(1.3); if (!alive()) return;
    tr.set('t.L1', 1, 1.2); tr.set('t.rX', 1, 0.5); await wait(1.2); if (!alive()) return;
    tr.set('t.rX', 0, 0.4); tr.set('t.rU', 1, 0.5, 0.2); await wait(1.3); if (!alive()) return;
    tr.set('t.rU', 0, 0.5);
    step = 2; drawPlan(); askArea();
  });

  function askArea(): void {
    const fbHost = h('div');
    const inp = pairInput('', 'x +', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fbk(false, 't.fill')); return; }
      let id = 't.a-other', mc: string | undefined;
      const right = r.x === 6 && r.y === 15;
      if (right) id = 't.a-ok';
      else if (r.x === 6 && r.y === 5) { id = 't.a-part'; mc = 'mc.properties.partial-distribution'; }
      else if (r.x === 32) { id = 't.a-concat'; mc = 'mc.expressions.reads-coefficient-as-concatenation'; }
      else if ((r.x === 21 && r.y === 0) || (r.x === 0 && r.y === 21)) { id = 't.a-unlike'; mc = 'mc.expressions.combines-unlike-terms'; }
      else if (r.x === 2 && r.y === 15) { id = 't.a-part'; mc = 'mc.properties.partial-distribution'; }
      ctx.store.log({ part: 'turn', item: 'turn.area', prompt: 'Write 3(2x + 5) as a sum: □x + □', board: '3(2x + 5)', response: r, expected: { x: 6, y: 15 }, correct: right, mc });
      fbHost.replaceChildren(fbk(right, id));
      if (!right) {
        if (mc === 'mc.properties.partial-distribution') seq(async alive => { tr.set('t.rU', 1, 0.4); tr.jump('t.count', 0); tr.set('t.count', 1, 2.0, 0.2); await wait(2.4); if (alive()) { tr.set('t.rU', 0, 0.4); tr.set('t.count', 0, 0.6); } });
        return;
      }
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.L1:dim', 1, 0.5); tr.set('t.count', 1, 2.0); await wait(2.2); if (!alive()) return;
        tr.set('t.area', 1, 0.9); tr.set('t.L2', 1, 1.1, 0.4); await wait(1.7); if (!alive()) return;
        tr.set('t.count', 0, 0.5);
        step = 3; drawPlan(); askName();
      });
    }
    work.replaceChildren(said('t.area'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askName(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'Distributive property', ok: true, id: 't.n-ok', mc: undefined as string | undefined },
      { t: 'Commutative property', ok: false, id: 't.n-comm', mc: undefined },
      { t: 'Associative property', ok: false, id: 't.n-assoc', mc: undefined },
    ];
    const box_ = h('div', { class: 'opts' });
    let done = false;
    opts.forEach((o, k) => box_.append(btn(o.t, () => {
      if (done) return;
      box_.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.name', prompt: 'Which property turns 3(2x + 5) into 6x + 15?', response: o.t, expected: 'Distributive property', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.L0:dim', 1, 0.5); tr.set('t.L2:dim', 1, 0.5);
        tr.set('t.H', 1, 1.3); await wait(1.3); if (!alive()) return;
        tr.set('t.w1', 1, 0.6); await wait(0.8); if (!alive()) return;
        askBack();
      });
    })));
    work.replaceChildren(said('t.name'), box_, fbHost);
  }
  function askBack(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check());
    const lead = h('div', { class: 'ans' }, html('span', 'op', '6<i>x</i> + 15 ='), inp.node);
    inp.node.append(html('span', 'op', '(2<i>x</i> + 5)'));
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbk(false, 't.num')); return; }
      const right = r.v === 3;
      const id = right ? 't.b-ok' : r.v === 6 || r.v === 15 ? 't.b-one' : 't.b-other';
      const mc = right ? undefined : r.v === 6 || r.v === 15 ? 'mc.expressions.factors-out-of-one-term-only' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.factor', prompt: '6x + 15 = □(2x + 5)', board: '6x + 15 = ?(2x + 5)', response: r, expected: 3, correct: right, mc });
      fbHost.replaceChildren(fbk(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.area', 0, 0.5); tr.set('t.join', 1, 1.3, 0.2); tr.set('t.F', 1, 1.2, 0.6); tr.set('t.w2', 1, 0.6, 1.4); void bump('t.pA', alive); await wait(2.4); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    }
    work.replaceChildren(said('t.back'), lead, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 1]!;
    c.append(said(p.cb), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley's 2(x + 3) and 3x + 4 =====
function partProve(): void {
  tr.reset('p.');
  const g = AreaGrid({ factor: t(2), terms: [t(1, 'x'), t(3)], ask: { cells: true } }, frame(60, 70, 980, 400), th);
  const A = expand(t(2), [t(1, 'x'), t(3)]);
  const tb = ValueTable({ A, B: [t(3, 'x'), t(4)], aTex: '2(x + 3)', bTex: '3x + 4', xs: [0, 1, 2, 3] }, frame(60, 480, 980, 530), th);
  const R0 = ln('p.r0', '\\text{Riley says}', 160, 52, undefined, 'dim');
  const J = ln('p.J', '2(x + 3) \\cssId{eq}{=} 3x + 4', 260, 84);
  const C1 = ln('p.C1', '2(x + 3) = \\cssId{a}{2x} + \\cssId{b}{6}', 450, 76, T);
  const C2 = ln('p.C2', '\\text{at } x = 0\\text{:}\\quad 6 \\cssId{ne}{\\neq} 4', 600, 76, T);
  const C3 = ln('p.C3', '\\text{not equivalent}', 760, 76, undefined, 'link');
  const marks = (): TableFocus => {
    const k2 = tr.k('p.m2'), k0 = tr.k('p.m0');
    const mk: number[] = [];
    if (k2 > 0) mk.push(2);
    if (k0 > 0) mk.push(0);
    return { mark: mk, markK: Math.max(k2, k0), rowDim: 0 };
  };
  scene({
    model: c => { g.draw(c, P('p.g'), {} as GridFocus); tb.draw(c, P('p.t'), marks()); },
    lines: [R0, J, C1, C2, C3],
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(J, 'eq'); strike(c, b.x0 - 12, b.y1 + 10, b.x1 + 12, b.y0 - 10, ks, { col: 'wrong' }); } },
  });
  tr.set('p.gframe', 1, 0.7); tr.set('p.gfactor', 1, 0.6, 0.3); tr.set('p.gterms', 1, 0.8, 0.5);
  tr.set('p.tframe', 1, 0.7, 0.6); tr.set('p.tr2', 1, 0.8, 1.4); tr.set('p.m2', 1, 0.5, 2.0);
  tr.set('p.r0', 1, 0.6, 0.8); tr.set('p.J', 1, 1.0, 1.0);

  const CHIPS = [
    { t: 'The 2 multiplies the x and the 3 (distributive property).', fits: 0 },
    { t: 'Put in 0: 2(0 + 3) = 6, but 3 · 0 + 4 = 4.', fits: 1 },
    { t: 'Equivalent means equal for EVERY x: one miss is enough.', fits: 2 },
    { t: 'PEMDAS lets you multiply into the parentheses.', fits: -1, mc: 'mc.properties.names-non-property', id: 'p.w-pemdas' },
    { t: 'They match at x = 2, so they always match.', fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.w-examples' },
    { t: 'x = 0 is just an exception.', fits: -1, mc: 'mc.reasoning-language.counterexample-as-exception', id: 'p.w-exception' },
  ];
  const CLAIMS = [
    `2(<i>x</i> + 3) = <b class="a">2<i>x</i></b> + <b class="b">6</b> for every <i>x</i>,`,
    `at <i>x</i> = 0, 2(<i>x</i> + 3) is 6 but 3<i>x</i> + 4 is 4,`,
    `so the two are <b class="s">not equivalent</b>, even though both give 10 at <i>x</i> = 2,`,
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((c, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(x => x.fits === i)!;
      d.innerHTML = `${c}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbk(false, ch.id ?? 'p.w-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    fbHost.append(said(`p.c${n}`));
    seq(async alive => {
      if (n === 1) { tr.set('p.gcells', 1, 1.2); await wait(1.0); if (!alive()) return; tr.set('p.C1', 1, 1.1); }
      if (n === 2) { tr.set('p.m2', 0, 0.4); tr.set('p.tr0', 1, 0.9); tr.set('p.m0', 1, 0.5, 0.8); await wait(1.2); if (!alive()) return; tr.set('p.C2', 1, 1.1); }
      if (n === 3) {
        tr.set('p.C1:dim', 1, 0.5); tr.set('p.C2:dim', 1, 0.5);
        tr.set('p.tr1', 1, 0.8); tr.set('p.tr3', 1, 0.8, 0.5); tr.set('p.m2', 1, 0.5, 1.0); await wait(1.8); if (!alive()) return;
        tr.set('p.C3', 1, 1.0); await wait(0.9); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        chipBox.remove();
        fbHost.append(feedback(true, SCRIPT['p.done']!.html), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        sayNext('p.done');
      }
    });
  }
  const verdict = h('div', { class: 'row' });
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: 2(x + 3) and 3x + 4 are equivalent, because both give 10 at x = 2. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.reasoning-language.examples-as-proof' : undefined });
    proofHost.replaceChildren(said(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), said('p.intro'), html('p', '', SCRIPT['p.judge']!.html), verdict, proofHost);
  sayNext('p.judge');
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as EFItem),
  });
}
/** the item's board as a short chain of lines that fits the board ("A = B" splits after the =, pairs split at \quad) */
function boardLines(src: string, y0 = 200): Line[] {
  const parts = src.split(' \\quad ');
  const out: string[] = [];
  for (const p of parts) {
    const F = tex(p) as Formula;
    const i = p.indexOf(' = ');
    if (texWidth(F, 72) > BW && i > 0 && !p.includes('aligned')) { out.push(p.slice(0, i)); out.push('= ' + p.slice(i + 3)); }
    else out.push(p);
  }
  return out.map((s, i) => ln(`x.T${i}`, s, y0 + i * 130, 80));
}
function showItem(item: EFItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.pic;
  const L = boardLines(item.board);
  const writeBoard = (d = 0.6) => L.forEach((l, i) => tr.set(l.key, 1, 0.8, d + i * 0.35));
  const dimBoard = () => L.forEach(l => tr.set(l.key + ':dim', 1, 0.5));
  if (pic?.kind === 'tiles') {
    const r = tryBlock(() => AreaTiles({ a: pic.a, p: pic.p, q: pic.q, unit: pic.unit, letter: pic.letter }, MF, th));
    if (r.ok) {
      const m: TilesBlock = r.value;
      scene({ model: c => m.draw(c, P('x.'), tilesFocus('x.')), lines: L });
      build('x.', 0); writeBoard();
      return { solve: async alive => {
        dimBoard(); tr.set('x.split', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('x.rU', 1, 0.4); tr.set('x.count', 1, 1.8); await wait(2.0); if (!alive()) return;
        tr.set('x.rU', 0, 0.4); tr.set('x.area', 1, 0.8);
      } };
    }
  }
  if (pic?.kind === 'grid') {
    const r = tryBlock(() => AreaGrid({ factor: pic.factor, terms: pic.terms, fmt: pic.fmt, ask: pic.ask, signed: pic.signed, letter: pic.letter }, MF, th));
    if (r.ok) {
      const m: GridBlock = r.value;
      scene({ model: c => m.draw(c, P('x.'), {}), lines: L });
      tr.set('x.frame', 1, 0.7);
      if (!pic.ask?.factor) tr.set('x.factor', 1, 0.6, 0.3);
      if (!pic.ask?.terms) tr.set('x.terms', 1, 0.8, 0.5);
      if (!pic.ask?.cells) tr.set('x.cells', 1, 1.0, 0.8);
      writeBoard();
      return { solve: async alive => {
        dimBoard();
        if (pic.ask?.factor) { tr.set('x.factor', 1, 0.8); await wait(0.8); if (!alive()) return; }
        if (pic.ask?.terms) { tr.set('x.terms', 1, 1.2); await wait(1.2); if (!alive()) return; }
        if (pic.ask?.cells) tr.set('x.cells', 1, 1.4);
      } };
    }
  }
  if (pic?.kind === 'row') {
    const r = tryBlock(() => TermTiles({ terms: pic.terms, letter: pic.letter }, MF, th));
    if (r.ok) {
      const m = r.value;
      scene({ model: c => m.draw(c, P('x.')), lines: L });
      tr.set('x.show', 1, 1.4); writeBoard();
      return { solve: async alive => {
        dimBoard(); tr.set('x.sort', 1, 1.6); await wait(1.8); if (!alive()) return;
        if (m.maths.pairsX + m.maths.pairsU > 0) { tr.set('x.cancel', 1, 1.6); await wait(1.7); if (!alive()) return; }
        tr.set('x.count', 1, 0.8);
      } };
    }
  }
  if (pic?.kind === 'table') {
    const r = tryBlock(() => ValueTable({ A: pic.A, B: pic.B, aTex: pic.aTex, bTex: pic.bTex, xs: pic.xs, fmt: pic.fmt }, MF, th));
    if (r.ok) {
      const m = r.value;
      const diff = m.maths.rows.map((row, i) => (row.eq ? -1 : i)).filter(i => i >= 0);
      scene({ model: c => m.draw(c, P('x.'), { mark: tr.k('x.mark') > 0 ? diff : [], markK: tr.k('x.mark') }), lines: L });
      tr.set('x.frame', 1, 0.7);
      pic.xs.forEach((x, i) => { if (pic.show.includes(x)) tr.set(`x.r${i}`, 1, 0.7, 0.5 + i * 0.2); });
      writeBoard();
      return { solve: async alive => {
        dimBoard();
        for (let i = 0; i < pic.xs.length; i++) { tr.set(`x.r${i}`, 1, 0.6); await wait(0.35); if (!alive()) return; }
        tr.set('x.mark', 1, 0.6);
      } };
    }
  }
  const big = box(300, 230, 1620, 790);
  // two expressions side by side read as one: put "and" between them
  scene({ lines: [bigLine('x.T', item.board.split(' \\quad ').join(' \\qquad \\text{and} \\qquad '), big, 120)], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{area Riley says not equivalent at subtract from step}', 'x^2 y \\square \\neq \\cdot', '\\left(x\\right)\\tfrac{1}{2}', '\\begin{aligned} a &= b \\\\ ={}& c && \\text{step 1}\\end{aligned}', 'x\\text{ ft}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
void (null as unknown as Item);
