// draw-triangles.ts: "Draw triangles from given conditions" (grade 7, 7.G.A.2) on the shared lesson runtime.
//   1 The question   three sticks, 3 in, 4 in and 7 in: how many triangles? (one / none / a flat one) + how sure
//   2 Worked example sides 5, 4 and 3 in with ruler and compass: List the givens, Draw the base, Swing two arcs,
//                    Join at the crossing; the givens become a checklist on the board, ticked as the picture meets
//                    them; one "why?" (why is C where the arcs cross?)
//   3 Your turn      sides 6, 3½ and 4 in, faded from the end: the kid sets the compass and picks the crossing; then
//                    the sticks from part 1 on paper: the arcs only touch on the base (3 + 4 = 7), the callback
//   4 Prove it       Jordan: "angles 40, 60, 80 make only one triangle"; a because-chain with reason chips over two
//                    nested triangles (same angles, bases 3 in and 5 in); distractors are catalogue misconceptions
//   5 Practice       all 11 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/draw-triangles/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike, drawOn } from '../../src/core/draw';
import type { Box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { texBox } from '../../src/core/tex';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, line, type Lead, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { drawWords } from '../../src/lesson/words';
import { Construction, type ConstructionBlock, type Look, sheet, Sticks, type SticksBlock } from '../../src/lesson/topics/draw-triangles/Construction';
import { type BuiltPic, CONSTRUCT_STEPS, type Pic, PROOF_F, SHEET, buildPic, constructDrawing, proofDrawing, triDrawing } from '../../src/lesson/topics/draw-triangles/pictures';
import { solveSSS } from '../../src/lesson/topics/draw-triangles/triangleMaths';
import { FAMILY_NAMES, GENS, type DTItem, splitBoard } from '../../src/lesson/topics/draw-triangles/items';
import { PLAN } from '../../src/lesson/topics/draw-triangles/plan';
import { explain } from '../../src/lesson/topics/draw-triangles/explain';

const SLUG = 'draw-triangles';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const A = (s: string) => `<b class="a">${s}</b>`, Bt = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;

// ---------- scenes: the drawing sheet on the left, the board on the right ----------
interface Part { b: ConstructionBlock; pre: string; look?: () => Look }
interface DScene { parts: Part[]; sticks?: { s: SticksBlock; pre: string; look?: () => { focus?: number[]; dim?: number } }; lines: Line[]; leads: Lead[]; extra?: (c: Canvas) => void; boardBox?: Box | null; caps?: { text: string; x: number; y: number }[] }
function setD(S: DScene): void {
  setScene({
    table: 1080,
    model: c => {
      sheet(c, SHEET);
      for (const p of S.parts) p.b.draw(c, progressOf(s => tr.k(p.pre + s)), p.look?.());
      if (S.sticks) S.sticks.s.draw(c, tr.k(S.sticks.pre + 'sticks'), S.sticks.look?.());
      for (const cp of S.caps ?? []) drawWords(c, cp.text, cp.x, cp.y, 'dim', 1, { size: 60, align: 'center', weight: 650 });
    },
    lines: S.lines, leads: S.leads, extra: S.extra, boardBox: S.boardBox,
  });
}
/** a lime tick drawn on beside a board line (a condition that the picture now meets) */
function tickAt(c: Canvas, L: Line, k: number): void {
  if (k <= 0) return;
  const b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
  const x = Math.min(b.x1 + 34, BOARD.x1 - 70), y = b.cy;
  drawOn(c, [[x, y + 2], [x + 16, y + 20], [x + 46, y - 22]], k, { col: 'link', lw: 7 });
}
/** run construction steps one after another */
async function steps(pre: string, list: readonly [string, number][], alive: () => boolean): Promise<boolean> {
  for (const [s, d] of list) { tr.set(pre + s, 1, d); await wait(d + 0.05); if (!alive()) return false; }
  return true;
}
const SKETCH_F = frame(100, 104, 420, 300), SKETCH_R = frame(720, 104, 420, 300);
const BIG_F = frame(100, 330, 1040, 650);
const tri543 = solveSSS(5, 4, 3);

const CARDS = [
  { t: 'One', small: 'exactly one shape', id: 'mc.shapes.any-measurements-make-a-triangle' },
  { t: 'None', small: 'no triangle at all', id: '' },
  { t: 'Flat', small: 'a flat one, lying along the 7 in stick', id: 'mc.shapes.accepts-degenerate-triangle' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const st = Sticks([3, 4, 7], 'in', frame(150, 200, 960, 700), i => `${[3, 4, 7][i]} in`);
  const L0 = line('q.l0', '\\text{three sticks}', BOARD.y0 + 130, 52, undefined, 'dim');
  const L1 = line('q.l1', '\\cssId{a}{3},\\ 4,\\ 7\\ \\text{in}', BOARD.y0 + 260, 92, { a: { col: 'first' } }, 'first');
  const L2 = line('q.l2', '\\text{triangles: } ?', BOARD.y0 + 420, 80);
  setD({ parts: [], sticks: { s: st, pre: 'q.' }, lines: [L0, L1, L2], leads: [] });
  tr.set('q.sticks', 1, 1.0, 0.2); tr.set('q.l0', 1, 0.7, 1.0); tr.set('q.l1', 1, 0.9, 1.3); tr.set('q.l2', 1, 0.8, 2.0);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Sticks of 3 in, 4 in and 7 in: how many triangles?', response: p.t, expected: 'None', correct: !p.id, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  say('q.intro');
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Three sticks'),
    html('p', '', `You have three wooden sticks, ${A('3 in')}, ${A('4 in')} and ${A('7 in')} long. You join them end to end to make a triangle.`),
    html('p', '', 'How many different triangles can you make?'),
    cards,
    h('div', { class: 'label' }, 'How sure are you?'),
    sure,
    h('div', { class: 'row' }, goBtn),
  );
}

// ===== 2. Worked example: sides 5, 4, 3 in =====
/** the condition checklist on the board: one line per given, ticked when the picture meets it */
function checklist(pre: string, rows: string[], y0: number): Line[] {
  return rows.map((r, i) => line(`${pre}G${i}`, r, y0 + i * 112, 80, undefined, 'first'));
}
function partExample(): void {
  tr.reset('e.');
  const skB = Construction(triDrawing({ unit: 'in', A: tri543.A, B: tri543.B, C: tri543.C, names: ['A', 'B', 'C'], freehand: true, size: 46, sides: { AB: { text: '5 in' }, AC: { text: '4 in' }, BC: { text: '3 in' } } }, 'sk'), SKETCH_F);
  const cB = Construction(constructDrawing({ kind: 'sss', unit: 'in', AB: 5, AC: 4, BC: 3, names: ['A', 'B', 'C'] }), BIG_F);
  const head = line('e.head', '\\text{the givens}', BOARD.y0 + 100, 52, undefined, 'dim');
  const G = checklist('e.', ['AB = 5\\ \\text{in}', 'AC = 4\\ \\text{in}', 'BC = 3\\ \\text{in}'], BOARD.y0 + 220);
  const H = line('e.hero', '\\cssId{a}{4} + \\cssId{b}{3} > 5', BOARD.y0 + 640, 92, { a: { col: 'first' }, b: { col: 'first' } }, 'link');
  const Cl = line('e.Cl', '\\cssId{c}{C}\\ \\text{is on both arcs}', BOARD.y0 + 790, 64, { c: { col: 'link' } });
  const focus = () => ({ focus: { AB: tr.k('e.fAB'), arcA: tr.k('e.fA'), arcB: tr.k('e.fB'), AC: tr.k('e.fA'), BC: tr.k('e.fB'), vC: tr.k('e.fC') } });
  setD({
    parts: [{ b: skB, pre: 'e.' }, { b: cB, pre: 'e.', look: focus }],
    lines: [head, ...G, H, Cl], leads: [],
    extra: c => G.forEach((L, i) => tickAt(c, L, tr.k(`e.tick${i}`))),
  });

  let step = 0;
  const STEPS = [
    { t: 'List the givens', why: 'Every condition on a quick sketch, nothing extra.', act: 'Sketch it' },
    { t: 'Draw the base', why: 'One given side, with a ruler.', act: 'Draw AB' },
    { t: 'Swing two arcs', why: 'One arc for each of the other two sides.', act: 'Swing the arcs' },
    { t: 'Join at the crossing', why: 'The third corner meets both conditions.', act: 'Join' },
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
    `The request has three conditions: ${A('AB = 5 in')}, ${A('AC = 4 in')} and ${A('BC = 3 in')}. The sketch shows each one on its side, and nothing else.`,
    `Put the ruler's 0 on A and mark B at 5. That meets the first condition.`,
    `Open the compass to ${A('4 in')} and swing an arc around A: every point on it is 4 in from A. Then ${A('3 in')} around B.`,
    `C is where the arcs cross: 4 in from A and 3 in from B at the same time. They cross because ${A('4 + 3')} is more than ${A('5')}.`,
  ];
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.innerHTML = '';
    if (i < 3) say(`e.step${i}`);
    seq(async alive => {
      if (i === 0) {
        tr.set('e.sk', 1, 1.6); await wait(1.0); if (!alive()) return;
        tr.set('e.head', 1, 0.6);
        for (let g = 0; g < 3; g++) { tr.set(`e.G${g}`, 1, 0.8); await wait(0.55); if (!alive()) return; }
      } else if (i === 1) {
        tr.set('e.ruler', 1, 0.7); await wait(0.8); if (!alive()) return;
        tr.set('e.base', 1, 1.2); tr.set('e.fAB', 1, 0.5); await wait(1.3); if (!alive()) return;
        tr.set('e.tick0', 1, 0.5); tr.set('e.G0:dim', 1, 0.6, 0.4); tr.set('e.fAB', 0, 0.6, 0.4);
        tr.set('e.rulerOff', 1, 0.7, 0.5); await wait(1.2); if (!alive()) return;
      } else if (i === 2) {
        tr.set('e.fA', 1, 0.4); tr.set('e.tool1', 1, 0.6); await wait(0.6); if (!alive()) return;
        if (!await steps('e.', [['one', 1.8], ['tool1Off', 0.5]], alive)) return;
        tr.set('e.fA', 0, 0.5); tr.set('e.fB', 1, 0.4); tr.set('e.tool2', 1, 0.6); await wait(0.6); if (!alive()) return;
        if (!await steps('e.', [['two', 1.8], ['tool2Off', 0.5]], alive)) return;
        tr.set('e.fB', 0, 0.5);
      } else {
        tr.set('e.C', 1, 0.6); tr.set('e.fC', 1, 0.5); await wait(0.7); if (!alive()) return;
        tr.set('e.sides', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.tick1', 1, 0.5); tr.set('e.tick2', 1, 0.5, 0.3); tr.set('e.G1:dim', 1, 0.6, 0.6); tr.set('e.G2:dim', 1, 0.6, 0.6); await wait(0.9); if (!alive()) return;
        tr.set('e.hero', 1, 1.2); await wait(1.3); if (!alive()) return;
        // C names a point of the picture: it glows while its symbol writes on
        tr.set('e.fC', 1, 0.3); tr.set('e.Cl', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.fC', 0, 0.8, 0.6);
      }
      sayBox.replaceChildren(html('p', '', SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Every point of one arc is 4 in from A, every point of the other is 3 in from B; only the crossing is both.', ok: true, mc: undefined as string | undefined, say: 'Yes. Each arc holds one condition. The corner has to meet both, so it sits where they cross.' },
      { t: 'It looks about right there, and a ruler can check it.', ok: false, mc: 'mc.geometric-proof.construction-by-eye-or-measure', say: 'Looking right is a guess. The arcs GUARANTEE both lengths: 4 in from A and 3 in from B.' },
      { t: 'The arcs can be any size, as long as they cross somewhere.', ok: false, mc: 'mc.geometric-proof.compass-width-changed', say: 'The compass opening IS the length. Open it to anything else and AC or BC comes out wrong.' },
    ];
    const box2 = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box2.append(btn(o.t, () => {
      box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      const b = [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!;
      b.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(feedback(o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does C have to be where the arcs cross?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, 'Quick check: why does C have to be where the arcs cross?'), box2, fbHost);
    void ctx.say('e.step3').then(() => say('e.why'));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), html('p', 'dim', `A triangle with sides ${A('5 in')}, ${A('4 in')} and ${A('3 in')}, drawn with a ruler and a compass. Press each step and watch the picture, then the board.`), plan, sayBox, after);
  say('e.intro');
}

// ===== 3. Your turn: sides 6, 3½, 4 in (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const tt = solveSSS(6, 3.5, 4);
  const skB = Construction(triDrawing({ unit: 'in', A: tt.A, B: tt.B, C: tt.C, names: ['A', 'B', 'C'], freehand: true, size: 46, sides: { AB: { text: '6 in' }, AC: { text: '3½ in' }, BC: { text: '4 in' } } }, 'sk'), SKETCH_R);
  const cB = Construction(constructDrawing({ kind: 'sss', unit: 'in', AB: 6, AC: 3.5, BC: 4, names: ['A', 'B', 'C'], cands: ['P', 'Q', 'R'] }), BIG_F);
  const head = line('t.head', '\\text{the givens}', BOARD.y0 + 100, 52, undefined, 'dim');
  const G = checklist('t.', ['AB = 6\\ \\text{in}', 'AC = 3\\tfrac{1}{2}\\ \\text{in}', 'BC = 4\\ \\text{in}'], BOARD.y0 + 220);
  const H = line('t.hero', '\\cssId{a}{3\\tfrac{1}{2}} + \\cssId{b}{4} > 6', BOARD.y0 + 640, 92, { a: { col: 'first' }, b: { col: 'first' } }, 'link');
  const focus = () => ({ focus: { arcA: tr.k('t.fA'), arcB: tr.k('t.fB'), candP: tr.k('t.fP'), AC: tr.k('t.fP'), BC: tr.k('t.fP') } });
  const scene1 = (): void => setD({
    parts: [{ b: skB, pre: 't.' }, { b: cB, pre: 't.', look: focus }],
    lines: [head, ...G, H], leads: [],
    extra: c => G.forEach((L, i) => tickAt(c, L, tr.k(`t.tick${i}`))),
  });
  scene1();

  let step = 0;
  const STEPS = [
    { t: 'List the givens', why: 'Done for you.' },
    { t: 'Draw the base', why: 'Done for you.' },
    { t: 'Swing two arcs', why: 'Your step.' },
    { t: 'Join at the crossing', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  say('t.intro');
  setPanel(h('h2', {}, 'Your turn'), html('p', '', `Draw triangle ABC with ${A('AB = 6 in')}, ${A('AC = 3½ in')} and ${A('BC = 4 in')}. The sketch and the base are done for you.`), plan, work);

  seq(async alive => {
    await wait(1.2); if (!alive()) return;
    tr.set('t.sk', 1, 1.4); tr.set('t.head', 1, 0.6, 0.6);
    for (let g = 0; g < 3; g++) tr.set(`t.G${g}`, 1, 0.8, 0.9 + 0.4 * g);
    await wait(2.4); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.ruler', 1, 0.6); await wait(0.6); if (!alive()) return;
    tr.set('t.base', 1, 1.1); await wait(1.2); if (!alive()) return;
    tr.set('t.tick0', 1, 0.5); tr.set('t.G0:dim', 1, 0.6, 0.3); tr.set('t.rulerOff', 1, 0.6, 0.4); await wait(1.0); if (!alive()) return;
    step = 2; drawPlan(); askArc();
  });

  function askArc(): void {
    const fbHost = h('div');
    const chips = [{ t: '3½ in', ok: true }, { t: '4 in', ok: false }, { t: '6 in', ok: false }];
    const box2 = h('div', { class: 'chips' });
    chips.forEach(ch => box2.append(btn(ch.t, () => {
      ctx.store.log({ part: 'turn', item: 'turn.arc', prompt: 'The arc around A: open the compass to?', response: ch.t, expected: '3½ in', correct: ch.ok, mc: undefined });
      if (!ch.ok) {
        fbHost.replaceChildren(feedback(false, ch.t === '4 in' ? `4 in is ${A('BC')}: it starts at B, so it is the arc around B. Which given side starts at A and goes to C?` : `6 in is ${A('AB')}, the base you already have. The arc around A carries the side from A to C.`));
        return;
      }
      box2.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      fbHost.replaceChildren(feedback(true, `Yes: ${A('AC = 3½ in')}, and A is one end of AC. Then ${A('4 in')} around B.`));
      say('t.arcB');
      seq(async alive => {
        tr.set('t.fA', 1, 0.4); tr.set('t.tool1', 1, 0.5); await wait(0.5); if (!alive()) return;
        if (!await steps('t.', [['one', 1.6], ['tool1Off', 0.4]], alive)) return;
        tr.set('t.fA', 0, 0.5); tr.set('t.fB', 1, 0.4); tr.set('t.tool2', 1, 0.5); await wait(0.5); if (!alive()) return;
        if (!await steps('t.', [['two', 1.6], ['tool2Off', 0.4]], alive)) return;
        tr.set('t.fB', 0, 0.5);
        step = 3; drawPlan(); askPoint();
      });
    })));
    work.replaceChildren(html('p', '', 'The first arc goes around A. How wide do you open the compass?'), box2, fbHost);
    say('t.arc');
  }
  function askPoint(): void {
    tr.set('t.C', 1, 0.6);
    const fbHost = h('div');
    const row = h('div', { class: 'row' });
    const opts = [
      { t: 'P', ok: true, say: `Yes: P is on both arcs, so it is ${A('3½ in')} from A and ${A('4 in')} from B.` },
      { t: 'Q', ok: false, say: `Q is on the arc around A only: 3½ in from A, but not 4 in from B. C has to meet both conditions.` },
      { t: 'R', ok: false, say: `R is on the arc around B only: 4 in from B, but not 3½ in from A. C has to meet both conditions.` },
    ];
    opts.forEach(o => row.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item: 'turn.point', prompt: 'Which point is C?', response: o.t, expected: 'P', correct: o.ok, mc: o.ok ? undefined : 'mc.geometric-proof.stops-after-some-conditions' });
      fbHost.replaceChildren(feedback(o.ok, o.say));
      if (!o.ok) return;
      row.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.fP', 1, 0.5); tr.set('t.sides', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('t.tick1', 1, 0.5); tr.set('t.tick2', 1, 0.5, 0.3); tr.set('t.G1:dim', 1, 0.6, 0.6); tr.set('t.G2:dim', 1, 0.6, 0.6); await wait(0.9); if (!alive()) return;
        tr.set('t.hero', 1, 1.2); await wait(1.4); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(h('div', { class: 'row' }, btn('Now the sticks', () => askFlat(), 'go')));
      });
    })));
    work.replaceChildren(html('p', '', 'Which point is C?'), row, fbHost);
    say('t.point');
  }
  function askFlat(): void {
    // the sticks from part 1, on paper: base 7 in, arcs of 3 in around A and 4 in around B
    tr.reset('f.');
    const fB = Construction(constructDrawing({ kind: 'sss', unit: 'in', AB: 7, AC: 3, BC: 4, names: ['A', 'B', 'C'] }), frame(100, 200, 1040, 700));
    const F1 = line('f.l1', '3 + 4 = 7', BOARD.y0 + 300, 96, undefined, 'first');
    const F2 = line('f.l2', '\\text{flat: no triangle}', BOARD.y0 + 470, 64, undefined, 'link');
    const touch = fB.px([3, 0]);
    setD({
      parts: [{ b: fB, pre: 'f.', look: () => ({ focus: { arcA: tr.k('f.fT'), arcB: tr.k('f.fT') } }) }], lines: [F1, F2], leads: [],
      extra: c => { const k = tr.k('f.ring'); if (k > 0) drawOn(c, Array.from({ length: 41 }, (_, i) => [touch[0] + 30 * Math.cos((i / 40) * Math.PI * 2), touch[1] + 30 * Math.sin((i / 40) * Math.PI * 2)] as [number, number]), k, { col: 'link', lw: 5 }); },
    });
    seq(async alive => {
      tr.set('f.ruler', 1, 0.5); tr.set('f.base', 1, 1.0); await wait(1.1); if (!alive()) return;
      tr.set('f.rulerOff', 1, 0.5); tr.set('f.tool1', 1, 0.5); await wait(0.5); if (!alive()) return;
      if (!await steps('f.', [['one', 1.4], ['tool1Off', 0.4], ['tool2', 0.4], ['two', 1.4], ['tool2Off', 0.4]], alive)) return;
      ask();
    });
    function ask(): void {
      const fbHost = h('div');
      const opts = [
        { t: 'Above the base: a triangle', ok: false, mc: 'mc.shapes.any-measurements-make-a-triangle', say: 'Look again: above the base the arcs stay apart. They only touch at one point, on AB itself.' },
        { t: 'Only on the base itself', ok: true, mc: undefined as string | undefined, say: `Right: ${A('3 + 4 = 7')}, so the arcs just touch on AB. The corner C would lie on the base: the sticks lie flat, no triangle.` },
        { t: 'Nowhere at all', ok: false, mc: undefined as string | undefined, say: 'They do touch, at one point: on the base, 3 in from A and 4 in from B. That is a flat line, not a triangle.' },
      ];
      const box2 = h('div', { class: 'opts' });
      opts.forEach(o => box2.append(btn(o.t, () => {
        ctx.store.log({ part: 'turn', item: 'turn.flat', prompt: 'Base 7 in, arcs 3 in and 4 in: where do the arcs meet?', response: o.t, expected: 'Only on the base itself', correct: o.ok, mc: o.mc });
        fbHost.replaceChildren(feedback(o.ok, o.say));
        if (!o.ok) return;
        box2.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
        seq(async alive => {
          tr.set('f.fT', 1, 0.5); tr.set('f.ring', 1, 0.8); await wait(0.8); if (!alive()) return;
          tr.set('f.l1', 1, 1.0); await wait(1.1); if (!alive()) return;
          tr.set('f.l2', 1, 1.0); await wait(1.0); if (!alive()) return;
          fbHost.append(callback());
        });
      })));
      work.replaceChildren(html('p', '', `Now the sticks from the start, on paper: base ${A('7 in')}, an arc of ${A('3 in')} around A and one of ${A('4 in')} around B. Where do the arcs meet?`), box2, fbHost);
      say('t.flat');
    }
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    if (commit().pick === null) c.innerHTML = `At the start: sticks of 3, 4 and 7 in make no triangle, because 3 + 4 is not more than 7.`;
    else {
      const p = CARDS[commit().pick ?? 1]!, right = !p.id;
      c.innerHTML = `At the start you picked <b>${p.t.toLowerCase()}</b> and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `
        + (right ? `You were right: 3 + 4 = 7, so the sticks lie flat. Now you can show why.` : `Now you know: 3 + 4 = 7, so the sticks lie flat, and a flat shape is ${S('no triangle')}. The two shorter sides must add up to MORE than the longest.`);
    }
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    say('t.done');
    return c;
  }
}

// ===== 4. Prove it: Jordan's "angles 40, 60, 80 make only one triangle" =====
function partProve(): void {
  tr.reset('p.');
  const nb = Construction(proofDrawing(), PROOF_F);
  const J0 = line('p.J0', '\\text{Jordan:}', BOARD.y0 + 90, 56, undefined, 'dim');
  const J = line('p.J', '40^\\circ,\\ 60^\\circ,\\ 80^\\circ', BOARD.y0 + 190, 80, undefined, 'second');
  const J2 = line('p.J2', '\\Rightarrow\\ \\cssId{w}{\\text{one triangle}}', BOARD.y0 + 300, 72);
  const C1 = line('p.C1', '40 + 60 + 80 = 180', BOARD.y0 + 460, 72, undefined, 'second');
  const C2 = line('p.C2', "AB' = 5\\ \\text{in}", BOARD.y0 + 590, 72, undefined, 'first');
  const H = line('p.hero', '\\text{same angles} \\Rightarrow \\cssId{s}{\\text{many}}', BOARD.y0 + 760, 80, { s: { col: 'link' } });
  const look = () => ({ focus: { AC: tr.k('p.f1'), BC: tr.k('p.f1'), AB: tr.k('p.f1'), angC: tr.k('p.f1'), B2C2: tr.k('p.f2'), AC2: tr.k('p.f2'), BB2: tr.k('p.f2'), angC2: tr.k('p.f2'), dim5: tr.k('p.f2') } });
  setD({
    parts: [{ b: nb, pre: 'p.', look }], lines: [J0, J, J2, C1, C2, H], leads: [],
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(J2, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); } },
  });
  tr.set('p.one', 1, 1.2, 0.3); tr.set('p.J0', 1, 0.6, 1.0); tr.set('p.J', 1, 1.0, 1.3); tr.set('p.J2', 1, 0.8, 2.0);

  const CHIPS = [
    { t: 'the three angles of every triangle add up to 180°.', fits: 0 },
    { t: 'the rays leave at the same angles, so on a longer base they meet farther out.', fits: 1 },
    { t: 'same angles but different side lengths: one is not a copy of the other.', fits: 2 },
    { t: 'triangles with the same angles are the same triangle.', fits: -1, mc: 'mc.transformations.equal-angles-prove-congruence', say: `That is Jordan's idea. The picture shows two triangles with the same angles and different sizes.` },
    { t: 'a bigger triangle has bigger angles.', fits: -1, mc: 'mc.angles.angle-sum-depends-on-size-or-shape', say: 'Look at the big triangle: its angles are still 40°, 60° and 80°. Size changes the sides, not the angles.' },
  ];
  const CLAIMS = [
    `On a ${A('3 in')} base, angles of ${Bt('40°')} and ${Bt('60°')} give a triangle with ${Bt('80°')} at the top,`,
    `On a ${A('5 in')} base, the same angles give a <b>bigger</b> triangle, again with 80° at the top,`,
    `So the three angles allow ${S('many')} triangles: Jordan is wrong,`,
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.f1', 1, 0.5); tr.set('p.c1', 1, 0.8); tr.set('p.C1', 1, 1.0, 0.4); await wait(2.0); if (!alive()) return; tr.set('p.f1', 0, 0.6); }
        if (n === 2) {
          tr.set('p.two', 1, 1.8); await wait(1.9); if (!alive()) return;
          tr.set('p.c2', 1, 0.8); tr.set('p.f2', 1, 0.5); tr.set('p.C2', 1, 1.0, 0.3); await wait(1.8); if (!alive()) return; tr.set('p.f2', 0, 0.6);
        }
        if (n === 3) {
          tr.set('p.C1:dim', 1, 0.5); tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.f1', 1, 0.5); tr.set('p.f2', 1, 0.5); await wait(0.6); if (!alive()) return;
          tr.set('p.strike', 1, 0.6); await wait(0.7); if (!alive()) return;
          tr.set('p.hero', 1, 1.2); await wait(1.3); if (!alive()) return;
          chipBox.remove();
          say('p.done');
          fbHost.replaceChildren(feedback(true, `That's a proof: three claims, each with its reason, and the picture backs every one. Three angles fix the <b>shape</b>, not the size. Three sides, two sides and the angle between them, or a side and its two end angles each fix ${S('exactly one')} triangle.`), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    const msg = ch.say ?? `True, but it is the reason for a different line. Which reason makes "${CLAIMS[filled]!.replace(/<[^>]+>/g, '').replace(/,$/, '')}" true?`;
    fbHost.replaceChildren(feedback(false, msg));
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: angles 40, 60, 80 make only one triangle. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.transformations.equal-angles-prove-congruence' : undefined });
    say('p.build');
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(html('p', '', right ? `Let's test it. Build the argument, and see where it leads.` : `Now prove it. Fill each “because” with the reason that makes the line true.`), chain, chipBox, fbHost);
    drawChain();
  }
  const proofHost = h('div');
  say('p.intro');
  setPanel(
    h('h2', {}, 'Prove it'),
    html('p', '', `Jordan says: “A triangle with angles ${Bt('40°')}, ${Bt('60°')} and ${Bt('80°')}? There is only one. Everybody's drawing will match mine.”`),
    verdict, proofHost,
  );
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as DTItem),
  });
}
/** the steps of a construct picture already drawn when the item opens (the rest is the worked solution) */
function upto(stepName: string): string[] {
  const i = CONSTRUCT_STEPS.indexOf(stepName as never);
  const done: string[] = [...CONSTRUCT_STEPS.slice(0, i + 1), 'rulerOff'];
  // instruments are put away in a still picture
  for (const [on, off] of [['ruler', 'rulerOff'], ['tool1', 'tool1Off'], ['tool2', 'tool2Off']] as const) if (done.includes(on) && !done.includes(off)) done.push(off);
  return done;
}
function boardLines(item: Item, pre: string): Line[] {
  const rows = splitBoard(item.board);
  const size = rows.length > 3 ? 64 : 76, gap = rows.length > 3 ? 100 : 118;
  return rows.map((r, i) => line(`${pre}T${i}`, r, BOARD.y0 + 110 + i * gap, size));
}
function showPic(pic: Pic, pre: string, lines: Line[], stepsDone: string[]): BuiltPic | null {
  const bt = tryBlock(() => buildPic(pic));
  if (!bt.ok) { console.warn('picture failed', bt.error); return null; }
  const built = bt.value;
  setD({
    parts: built.blocks.map(x => ({ b: x.b, pre })),
    sticks: built.sticks ? { s: built.sticks, pre } : undefined,
    caps: built.blocks.filter(x => x.cap).map(x => x.cap!),
    lines, leads: [],
  });
  for (const s of stepsDone) tr.jump(pre + s, 1);
  return built;
}
function showItem(item: DTItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const lines = boardLines(item, 'x.');
  lines.forEach((L, i) => tr.set(L.key, 1, 0.7, 0.3 + 0.25 * i));
  const pic = item.picture;
  const constructSolve = (pre: string, done: string[]) => async (alive: () => boolean) => {
    lines.forEach(L => tr.set(L.key + ':dim', 1, 0.5));
    const todo = CONSTRUCT_STEPS.filter(s => !done.includes(s));
    for (const s of todo) {
      if (s === 'ruler' || s === 'rulerOff') continue;
      tr.set(pre + s, 1, s === 'one' || s === 'two' ? 1.3 : s === 'sides' ? 1.0 : 0.45);
      await wait(s === 'one' || s === 'two' ? 1.35 : s === 'sides' ? 1.05 : 0.5); if (!alive()) return;
    }
  };
  if (pic) {
    if (pic.kind === 'construct') {
      const done = upto(pic.upto ?? 'sides');
      if (showPic(pic, 'x.', lines, ['all', ...done])) return { solve: constructSolve('x.', done) };
    } else if (showPic(pic, 'x.', lines, [])) {
      tr.set('x.all', 1, 0.9); tr.set('x.sticks', 1, 0.9);
      if (pic.kind === 'copy') return { solve: async () => { tr.set('x.solve', 1, 1.2); } };
      if (item.solvePic) return { solve: solveWith(item.solvePic, lines) };
      return {};
    }
  } else {
    // no picture yet (none / one / many): the givens on the board, a blank sheet to imagine the drawing on
    setD({ parts: [], lines, leads: [] });
    if (item.solvePic) return { solve: solveWith(item.solvePic, lines) };
  }
  return {};
}
/** after a miss: draw the worked picture (a construction plays step by step) */
function solveWith(p: Pic, lines: Line[]): (alive: () => boolean) => Promise<void> {
  return async alive => {
    tr.reset('y.');
    const L2 = lines.map(L => ({ ...L, key: L.key }));
    if (p.kind === 'construct') {
      const done = upto(p.upto ?? 'base');
      if (!showPic(p, 'y.', L2, ['all', ...done])) return;
      L2.forEach(L => tr.set(L.key + ':dim', 1, 0.5));
      for (const s of CONSTRUCT_STEPS) {
        if (done.includes(s) || s === 'ruler' || s === 'rulerOff') continue;
        tr.set('y.' + s, 1, s === 'one' || s === 'two' ? 1.3 : s === 'sides' ? 1.0 : 0.45);
        await wait(s === 'one' || s === 'two' ? 1.35 : s === 'sides' ? 1.05 : 0.5); if (!alive()) return;
      }
      return;
    }
    if (!showPic(p, 'y.', L2, [])) return;
    tr.set('y.all', 1, 1.0); tr.set('y.sticks', 1, 1.0);
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{the givens}', '\\text{Jordan: }', '\\angle A = 50^\\circ', '3\\tfrac{1}{2}\\ \\text{in}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
