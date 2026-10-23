// pythagoras-intro.ts: "Pythagorean theorem: introduction and use" (grade 8, 8.G.B.6-7) on the shared lesson runtime.
//   1 The question   a 3 by 4 right triangle on grid paper: how long is the slanted side? 3 cards (5; 7 = adds the
//                    legs; 6 = counts the grid squares the side crosses) + how sure
//   2 Worked example four subgoal steps on the squares-on-sides model: name the sides, build squares on the legs
//                    (9, 16), measure the tilted square by surround-and-subtract (49 - 4 x 6 = 25), compare (9 + 16 =
//                    25, c = 5); the rule a² + b² = c² is named last; one "why?" with 3 reasons
//   3 Your turn      legs 6 and 8, faded from the end: the sides and the leg squares are given, the kid finds c² and c
//   4 Prove it       Sam's two examples are not a proof; a because-chain on the rearrangement proof square (reason
//                    chips, distractors = catalogue misconceptions), the picture backs each line
//   5 Practice       all 16 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/pythagoras-intro/script.ts (html + say) -> voice/lines.json. Every answer is logged.
import { type Canvas, drawOn } from '../../src/core/draw';
import { texDraw } from '../../src/core/tex';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, MF, bump, line, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { SideSquares, type SideFocus, type SideId, type SideSquaresBlock, type SideSquaresParams, type SideStep } from '../../src/lesson/topics/pythagoras-intro/SideSquares';
import { ProofSquare, type ProofSquareBlock, type ProofStep } from '../../src/lesson/topics/pythagoras-intro/ProofSquare';
import { rightPts, tilted } from '../../src/lesson/topics/pythagoras-intro/pythag';
import { inkLine, wash } from '../../src/lesson/wash';
import { drawWords } from '../../src/lesson/words';
import { FAMILY_NAMES, GENERATORS, MC, type PyItem, type Pic, fmt } from '../../src/lesson/topics/pythagoras-intro/items';
import { PLAN } from '../../src/lesson/topics/pythagoras-intro/plan';
import { explain } from '../../src/lesson/topics/pythagoras-intro/explain';
import { LINES } from '../../src/lesson/topics/pythagoras-intro/script';

const SLUG = 'pythagoras-intro';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the panel shows LINES[id].html, the narrator says LINES[id].say */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  const L = LINES[id];
  if (!L) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, L?.html ?? '');
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, LINES[id]?.html ?? ''); }

const TAGS: Record<string, { col: Paint }> = { a: { col: 'first' }, b: { col: 'second' }, c: { col: 'link' }, v: { col: 'link' } };
const TU = (v: number | string) => `${v}\\text{ in}`;
/** a board line, centred on the slate (shrinks to fit) */
function centred(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  return { key, F, x: BOARD.cx - texWidth(F, s) / 2, y, size: s, tags: TAGS, col };
}
const L = (key: string, src: string, y: number, size = 76, col?: Paint): Line => line(key, src, y, size, TAGS, col);

// ===================== the squares-on-sides model, driven by tr keys under a prefix =====================
function sideProgress(pre: string) { return progressOf<SideStep>(s => tr.k(pre + s)); }
function sideFocus(pre: string): SideFocus {
  const g = (k: string) => tr.k(pre + 'g' + k);
  return { glow: { a: g('a'), b: g('b'), c: g('c'), R: g('R'), sqa: g('sqa'), sqb: g('sqb'), sqc: g('sqc'), corners: g('cor') }, hide: { c: tr.k(pre + 'hidec') } };
}
function sideScene(m: SideSquaresBlock, pre: string, lines: Line[], extra?: (c: Canvas) => void): void {
  const P = sideProgress(pre);
  setScene({ table: 1080, model: c => m.draw(c, P, sideFocus(pre)), lines, leads: [], extra });
}
const show = (pre: string, steps: SideStep[], d = 0) => { for (const s of steps) tr.set(pre + s, 1, 0.8, d); };
const jump = (pre: string, steps: SideStep[]) => { for (const s of steps) tr.jump(pre + s, 1); };
const pulse = async (key: string, alive: () => boolean, hold = 0.9) => { tr.set(key, 1, 0.35); await wait(hold); if (!alive()) return; tr.set(key, 0, 0.6); };

// ===================== 1. The question =====================
const EXP: SideSquaresParams = {
  pts: rightPts(3, 4), right: true, grid: true, squares: ['a', 'b', 'c'], surround: true,
  labels: { a: '3', b: '4', c: '?' }, labelsB: { c: '5' }, areas: { a: '9', b: '16', c: '25' }, corner: '6', maxUnit: 84,
};
const CARDS = [
  { v: 7, mc: MC.addLengths, why: 't.cb-add' },
  { v: 5, mc: undefined as string | undefined, why: 't.cb-right' },
  { v: 6, mc: MC.bundle, why: 't.cb-count' },
];
function partQuestion(): void {
  tr.reset('Q.');
  const m = SideSquares(EXP, MF, th);
  const Q = centred('Q.L1', '\\text{slanted side} = \\,?', 200, 76);
  sideScene(m, 'Q.', [Q]);
  show('Q.', ['grid'], 0); show('Q.', ['tri'], 0.4); show('Q.', ['mark'], 1.0); show('Q.', ['labels'], 1.4); tr.set('Q.L1', 1, 1.0, 2.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A right triangle with legs 3 in and 4 in on grid paper: how long is the slanted side?', board: 'slanted side = ?', response: c.v, expected: 5, correct: c.v === 5, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>inches</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'The slanted side'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: legs 3 and 4 =====================
function partExample(): void {
  tr.reset('E.');
  const m = SideSquares(EXP, MF, th);
  const lines = [
    L('E.L1', '\\cssId{a}{a} = 3,\\ \\ \\cssId{b}{b} = 4,\\ \\ \\cssId{c}{c} = \\,?', 160),
    L('E.L2', '\\cssId{a}{a^2} = 3^2 = 9', 285),
    L('E.L3', '\\cssId{b}{b^2} = 4^2 = 16', 385),
    L('E.L4', '\\cssId{c}{c^2} = 49 - 4 \\times 6 = 25', 510),
    L('E.L5', '\\cssId{a}{9} + \\cssId{b}{16} = \\cssId{c}{25}', 635),
    L('E.L6', 'c = \\sqrt{25} = \\cssId{v}{5}', 750),
    centred('E.L7', '\\cssId{a}{a^2} + \\cssId{b}{b^2} = \\cssId{c}{c^2}', 905, 92),
  ];
  sideScene(m, 'E.', lines);
  jump('E.', ['grid', 'tri', 'mark', 'labels']);
  let step = 0;
  const STEPS = [
    { t: 'Name the sides', why: 'Which side is across from the right angle?', act: 'Show me' },
    { t: 'Build squares on the legs', why: 'A square on each leg: its area is the leg squared.', act: 'Build' },
    { t: 'Measure the tilted square', why: 'Surround it, then take away the corners.', act: 'Surround it' },
    { t: 'Compare, then find c', why: 'Do the leg squares fill the big one?', act: 'Compare' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set('E.' + k, v, d, del);
  async function beat(i: number, alive: () => boolean): Promise<void> {
    if (i === 0) {
      await pulse('E.gR', alive, 1.0); if (!alive()) return;
      set('gc', 1, 0.5); await wait(0.9); if (!alive()) return;
      set('L1', 1, 1.3); await wait(0.6); if (!alive()) return;
      set('ga', 1, 0.5); set('gb', 1, 0.5); await wait(1.3); if (!alive()) return;
      set('ga', 0, 0.6); set('gb', 0, 0.6); set('gc', 0, 0.6);
    } else if (i === 1) {
      set('sqa', 1, 1.2); await wait(1.3); if (!alive()) return;
      set('areaa', 1, 0.8); set('L2', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
      set('sqb', 1, 1.2); await wait(1.3); if (!alive()) return;
      set('areab', 1, 0.8); set('L3', 1, 1.0, 0.3); await wait(1.4);
    } else if (i === 2) {
      set('outc', 1, 1.0); await wait(1.2); if (!alive()) return;
      set('surround', 1, 1.2); await wait(1.4); if (!alive()) return;
      set('corners', 1, 1.4); await wait(1.7); if (!alive()) return;
      set('L4', 1, 1.4); await wait(1.7); if (!alive()) return;
      set('lift', 1, 1.0); await wait(1.0); if (!alive()) return;
      set('sqc', 1, 1.2); set('surround', 0, 0.8, 0.4); await wait(1.3); if (!alive()) return;
      set('areac', 1, 0.8); set('outc', 0, 0.5); await wait(0.9);
    } else {
      set('gsqa', 1, 0.5); set('gsqb', 1, 0.5); await wait(0.6); if (!alive()) return;
      set('L5', 1, 1.2); await wait(1.0); if (!alive()) return;
      set('gsqa', 0, 0.5); set('gsqb', 0, 0.5); set('gsqc', 1, 0.5); await wait(1.2); if (!alive()) return;
      set('gsqc', 0, 0.6); set('swap', 1, 0.8); set('gc', 1, 0.5); await wait(0.9); if (!alive()) return;
      set('L6', 1, 1.2); set('gc', 0, 0.6, 0.6); await wait(1.4);
    }
  }
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      await beat(i, alive);
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) {
        await ctx.say('e.s3'); if (!alive()) return;
        set('L7', 1, 1.4);
        sayBox.append(voiced('e.rule'));
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Its square has an area of 25, and 5 × 5 = 25.', ok: true, id: 'e.why-ok', mc: undefined as string | undefined },
      { t: '3 + 4 = 7: the two legs just add up.', ok: false, id: 'e.why-add', mc: MC.addLengths as string | undefined },
      { t: 'It is 25 inches: the area of its square.', ok: false, id: 'e.why-area', mc: MC.noRoot as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the slanted side 5 inches, and not 7?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: legs 6 and 8 (faded from the end) =====================
const TURN: SideSquaresParams = {
  pts: rightPts(6, 8), right: true, grid: true, squares: ['a', 'b', 'c'],
  labels: { a: '6', b: '8', c: '?' }, labelsB: { c: '10' }, areas: { a: '36', b: '64', c: '100' }, maxUnit: 60,
};
function partTurn(): void {
  tr.reset('T.');
  const m = SideSquares(TURN, MF, th);
  const lines = [
    L('T.L1', '\\cssId{a}{a} = 6,\\ \\ \\cssId{b}{b} = 8,\\ \\ \\cssId{c}{c} = \\,?', 160),
    L('T.L2', '\\cssId{a}{a^2} = 6^2 = 36', 285),
    L('T.L3', '\\cssId{b}{b^2} = 8^2 = 64', 385),
    L('T.Q4', '\\cssId{c}{c^2} = \\,?', 530),
    L('T.L4', '\\cssId{c}{c^2} = 36 + 64 = 100', 530),
    L('T.Q5', 'c = \\,?', 660),
    L('T.L5', 'c = \\sqrt{100} = \\cssId{v}{10}', 660),
  ];
  sideScene(m, 'T.', lines);
  show('T.', ['grid'], 0); show('T.', ['tri'], 0.3); show('T.', ['mark'], 0.8); show('T.', ['labels'], 1.1);
  let step = 0;
  const STEPS = [
    { t: 'Name the sides', why: 'Done for you.' },
    { t: 'Build squares on the legs', why: 'Done for you: 36 and 64.' },
    { t: 'The square on c', why: 'Your step.' },
    { t: 'Find c', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: legs of 6 and 8'), voiced('t.intro'), plan, work);
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set('T.' + k, v, d, del);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    await pulse('T.gR', alive, 0.8); if (!alive()) return;
    set('gc', 1, 0.4); set('L1', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
    set('gc', 0, 0.5);
    step = 1; drawPlan();
    set('sqa', 1, 1.1); await wait(1.2); if (!alive()) return;
    set('areaa', 1, 0.7); set('L2', 1, 0.9, 0.2); await wait(1.1); if (!alive()) return;
    set('sqb', 1, 1.1); await wait(1.2); if (!alive()) return;
    set('areab', 1, 0.7); set('L3', 1, 0.9, 0.2); await wait(1.1); if (!alive()) return;
    step = 2; drawPlan(); set('outc', 1, 0.9); set('Q4', 1, 0.8);
    askArea();
  });
  function askArea(): void {
    const fbHost = h('div'), inp = numInput('square inches', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const v = r.v, right = v === 100;
      const id = right ? 't.area-ok' : v === 14 ? 't.area-add' : v === 28 ? 't.area-sub' : v === 10 ? 't.area-side' : 't.area-no';
      const mc = v === 14 ? MC.addLengths : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.area', prompt: 'Legs 6 in and 8 in: area of the square on the hypotenuse?', board: 'c^2 = ?', response: v, expected: 100, correct: right, mc });
      fbHost.replaceChildren(voicedFb(id, right));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        set('outc', 0, 0.4); set('sqc', 1, 1.2); await wait(1.3); if (!alive()) return;
        set('areac', 1, 0.8); set('Q4', 0, 0.4); set('L4', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); set('Q5', 1, 0.8); askC();
      });
    }
    work.replaceChildren(voiced('t.area'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askC(): void {
    const fbHost = h('div'), inp = numInput('inches', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      const v = r.v, right = v === 10;
      const id = right ? 't.c-ok' : v === 100 ? 't.c-area' : v === 50 ? 't.c-half' : v === 14 ? 't.c-add' : 't.c-no';
      const mc = v === 100 ? MC.noRoot : v === 50 ? MC.halfRoot : v === 14 ? MC.addLengths : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.c', prompt: 'c² = 100: how long is the hypotenuse?', board: 'c = ?', response: v, expected: 10, correct: right, mc });
      fbHost.replaceChildren(voicedFb(id, right));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        set('swap', 1, 0.8); set('gc', 1, 0.5); set('Q5', 0, 0.4); set('L5', 1, 1.2, 0.3); await wait(1.6); if (!alive()) return;
        set('gc', 0, 0.6); step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.c'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 't.cb-none';
    const p = voiced(id);
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: two examples are not a proof; the rearrangement square is =====================
function partProve(): void {
  tr.reset('P.');
  const pf = ProofSquare(2.7, 4.3, MF, th);
  const P = progressOf<ProofStep>(s => tr.k('P.' + s));
  const lines = [
    L('P.S1', '3^2 + 4^2 = 5^2\\ \\checkmark', 150, 70, 'dim'),
    L('P.S2', '6^2 + 8^2 = 10^2\\ \\checkmark', 240, 70, 'dim'),
    L('P.L1', '\\text{middle} = \\cssId{c}{c^2}', 420),
    L('P.L2', '\\text{uncovered} = \\cssId{a}{a^2} + \\cssId{b}{b^2}', 545),
    centred('P.L3', '\\cssId{a}{a^2} + \\cssId{b}{b^2} = \\cssId{c}{c^2}', 720, 92),
    centred('P.L4', '\\text{for every right triangle}', 840, 62, 'dim'),
  ];
  setScene({ table: 1080, model: c => pf.draw(c, P, { glow: { mid: tr.k('P.gmid'), left: tr.k('P.gleft'), outer: tr.k('P.gout'), tris: tr.k('P.gtris') } }), lines, leads: [] });
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set('P.' + k, v, d, del);
  set('S1', 1, 0.9, 0.6); set('S2', 1, 0.9, 1.3);
  // the big square and its four triangles are on the table from the start; the argument fills it in
  set('outer', 1, 1.2, 0.4); set('tris', 1, 1.4, 1.0); set('edges', 1, 0.8, 2.0);
  const CHIPS = [
    { t: 'its 4 sides are hypotenuses, and each corner is 180° − 90° = 90°.', fits: 0 },
    { t: 'the 4 triangles pair up into two rectangles, <i>a</i> by <i>b</i>.', fits: 1 },
    { t: 'the big square and the 4 triangles never changed, so the uncovered area is the same.', fits: 2 },
    { t: 'it looks like a square in the picture.', fits: -1, mc: MC.looksSquare, id: 'p.no-looks' },
    { t: 'it worked for 3, 4, 5 and for 6, 8, 10.', fits: -1, mc: MC.examples, id: 'p.no-ex' },
    { t: 'the triangle’s area is <i>a</i>² + <i>b</i>².', fits: -1, mc: MC.triArea, id: 'p.no-area' },
  ];
  const CLAIMS = [
    `The shape in the middle is a square with area <b class="s"><i>c</i>²</b>,`,
    `Slid into two corners, the triangles leave <b class="a"><i>a</i>²</b> + <b class="b"><i>b</i>²</b> uncovered,`,
    `So <b class="a"><i>a</i>²</b> + <b class="b"><i>b</i>²</b> = <b class="s"><i>c</i>²</b> for every right triangle,`,
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no-other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) {
        set('mid', 1, 1.0); await wait(0.8); if (!alive()) return;
        set('angles', 1, 0.8); await wait(1.0); if (!alive()) return;
        set('gmid', 1, 0.4); set('L1', 1, 1.0); await wait(1.2); if (!alive()) return;
        set('gmid', 0, 0.6);
      }
      if (n === 2) {
        set('move', 1, 2.6); await wait(2.7); if (!alive()) return;
        set('left', 1, 1.0); await wait(1.0); if (!alive()) return;
        set('gleft', 1, 0.4); set('L2', 1, 1.0); await wait(1.2); if (!alive()) return;
        set('gleft', 0, 0.6);
      }
      if (n === 3) {
        set('gout', 1, 0.4); set('gtris', 1, 0.4); await wait(1.2); if (!alive()) return;
        set('gout', 0, 0.6); set('gtris', 0, 0.6);
        set('L3', 1, 1.2); await wait(1.3); if (!alive()) return;
        set('L4', 1, 1.0); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Yes, two examples prove it', () => judge(true)), no = btn('No, examples are not a proof', () => judge(false));
  const proofHost = h('div');
  function judge(proof: boolean): void {
    yes.disabled = no.disabled = true;
    (proof ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam checked 3-4-5 and 6-8-10, so a² + b² = c² for every right triangle. Is that a proof?', response: proof ? 'proof' : 'not a proof', expected: 'not a proof', correct: !proof, mc: proof ? MC.examples : undefined });
    set('S1:dim', 1, 0.5); set('S2:dim', 1, 0.5);
    proofHost.replaceChildren(voiced(proof ? 'p.yes' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('X.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as PyItem),
  });
}
/** the slate of an item without a picture: the whole stage, where the picture would be */
const BIG = box(90, 110, 1830, 990);
/** the item's board and its worked steps: on the right slate next to a picture, or centred on a wide slate */
function boardLines(item: PyItem, wide: boolean): { lines: Line[]; steps: string[]; slate: Box | undefined } {
  const steps = item.steps ?? [];
  if (!wide) {
    const lines = [L('X.B', item.board, 170, 80)];
    steps.forEach((s, i) => lines.push(L(`X.s${i}`, s, 320 + i * 125, 72)));
    return { lines, steps, slate: undefined };
  }
  const fit = (key: string, src: string, y: number, size: number): Line => {
    const F = tex(src) as Formula;
    let s = size;
    while (s > 64 && texWidth(F, s) > BIG.w - 160) s -= 4;
    return { key, F, x: BIG.cx - texWidth(F, s) / 2, y, size: s, tags: TAGS };
  };
  const top = steps.length ? BIG.y0 + 120 : BIG.cy;
  const lines = [fit('X.B', item.board, top, 120)];
  steps.forEach((s, i) => lines.push(fit(`X.s${i}`, s, top + 150 + i * 115, 84)));
  return { lines, steps, slate: BIG };
}
/** a SideSquares picture for a triangle item; the squares (and then the labels) are dropped when they do not fit */
function triBlock(p: Extract<Pic, { kind: 'tri' }>): SideSquaresBlock | null {
  const base: SideSquaresParams = { pts: p.pts, right: p.right, grid: p.grid, labels: p.labels, verts: p.verts, maxUnit: p.grid ? 80 : 120 };
  // the units come off the side labels first (the prompt says them), then the area labels, then the squares
  const bare = p.labels ? Object.fromEntries(Object.entries(p.labels).map(([k, v]) => [k, v.replace(/\\text\{ (in|ft|yd)\}/g, '')])) : undefined;
  for (const extra of [{ squares: p.squares, areas: p.areas }, { squares: p.squares, areas: p.areas, labels: bare }, { squares: p.squares, labels: bare }, {}] as Partial<SideSquaresParams>[]) {
    const r = tryBlock(() => SideSquares({ ...base, ...extra }, MF, th));
    if (r.ok) return r.value;
  }
  return null;
}
function tiltBlock(pq: { p: number; q: number }, withCorners: boolean): SideSquaresBlock | null {
  const T = tilted(pq.p, pq.q);
  const base: SideSquaresParams = { pts: rightPts(pq.p, pq.q), right: false, grid: true, squares: ['c'], surround: true, areas: { c: String(T.area) }, maxUnit: 200 };
  for (const extra of withCorners ? [{ corner: fmt(T.corner) }, {}] : [{}]) {
    const r = tryBlock(() => SideSquares({ ...base, ...extra }, MF, th));
    if (r.ok) return r.value;
  }
  return null;
}
function showItem(item: PyItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('X.');
  const pic = item.picture?.pic;
  const set = (k: string, v: number, d = 0.7, del = 0) => tr.set('X.' + k, v, d, del);
  const writeSteps = async (n: number, alive: () => boolean) => { for (let i = 0; i < n; i++) { set(`s${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; } };
  // a plain board (no picture, or a picture that only comes with the worked solution)
  const plain = (after?: () => void) => {
    const { lines, steps, slate } = boardLines(item, true);
    setScene({ table: 1080, lines, leads: [], boardBox: slate });
    set('B', 1, 0.8, 0.1);
    return { solve: steps.length || after ? async (alive: () => boolean) => { if (after) { after(); await wait(1.6); if (!alive()) return; } await writeSteps(steps.length, alive); } : undefined };
  };
  if (pic?.kind === 'tri') {
    const m = triBlock(pic);
    if (!m) return plain();
    const drawIt = () => {
      const { lines, steps } = boardLines(item, false);
      sideScene(m, 'X.', lines);
      show('X.', ['grid', 'tri'], 0); show('X.', ['mark', 'labels', 'verts'], 0.4); set('B', 1, 0.8, 0.3);
      return steps.length;
    };
    if (pic.after) {
      // the kid sketches the situation first; the triangle comes with the worked solution
      return plain(() => { drawIt(); });
    }
    const nSteps = drawIt();
    const hasSq = (s: SideId) => (pic.squares ?? []).includes(s);
    if (pic.now) for (const s of ['a', 'b', 'c'] as SideId[]) if (hasSq(s)) { set(`sq${s}`, 1, 0.9, 0.6); set(`area${s}`, 1, 0.7, 1.2); }
    return {
      solve: async alive => {
        if (!pic.now) for (const s of ['a', 'b', 'c'] as SideId[]) if (hasSq(s)) { set(`sq${s}`, 1, 0.9); await wait(0.7); if (!alive()) return; set(`area${s}`, 1, 0.6); }
        if (!pic.now && pic.squares) { await wait(0.6); if (!alive()) return; }
        await writeSteps(nSteps, alive);
      },
    };
  }
  if (pic?.kind === 'tilt') {
    const m = tiltBlock(pic, !!pic.corners);
    if (!m) return plain();
    const { lines, steps } = boardLines(item, false);
    sideScene(m, 'X.', lines);
    show('X.', ['grid'], 0); show('X.', ['sqc'], 0.3); set('B', 1, 0.8, 0.3);
    if (pic.corners) { show('X.', ['surround'], 0.8); show('X.', ['corners'], 1.3); }
    return {
      solve: async alive => {
        if (!pic.corners) { set('surround', 1, 0.9); await wait(1.0); if (!alive()) return; set('corners', 1, 1.0); await wait(1.2); if (!alive()) return; }
        await writeSteps(Math.max(0, steps.length - 1), alive); if (!alive()) return;
        set('lift', 1, 0.8); set('areac', 1, 0.7, 0.4); await wait(1.0); if (!alive()) return;
        if (steps.length) set(`s${steps.length - 1}`, 1, 0.9);
      },
    };
  }
  if (pic?.kind === 'sq') {
    // a lone upright square of the given area (amber); its side, the root, is what is asked (lime)
    const S = 520, x0 = MF.x + (MF.w - S) / 2, y0 = MF.y + 120, A = tex(String(pic.area)) as Formula;
    const side = tex(pic.ask) as Formula, root = tex(pic.root) as Formula;
    const { lines, steps } = boardLines(item, false);
    setScene({ table: 1080, lines, leads: [], model: c => {
      const k = tr.k('X.sq'), r = tr.k('X.root');
      if (k <= 0) return;
      c.g.save(); c.g.globalAlpha *= k;
      wash(c, [[x0, y0], [x0 + S, y0], [x0 + S, y0 + S], [x0, y0 + S]], 'first', { seed: 5, inkW: 3, rough: 1.2, shade: 0.25 });
      texDraw(c, A, x0 + S / 2, y0 + S / 2 - 24, { size: 110, align: 'center', col: '#141633' });
      drawWords(c, pic.unit, x0 + S / 2, y0 + S / 2 + 70, '#141633', 1, { size: 46, align: 'center' });
      const by = y0 + S + 34;
      inkLine(c, [[x0, by - 12], [x0, by + 12]], { col: 'link', w: 4 }); inkLine(c, [[x0 + S, by - 12], [x0 + S, by + 12]], { col: 'link', w: 4 });
      drawOn(c, [[x0, by], [x0 + S, by]], 1, { col: 'link', lw: 4 });
      texDraw(c, side, x0 + S / 2, by + 74, { size: 72, align: 'center', col: 'link', alpha: 1 - r });
      if (r > 0) texDraw(c, root, x0 + S / 2, by + 74, { size: 72, align: 'center', col: 'link', alpha: r });
      c.g.restore();
    } });
    set('sq', 1, 0.8); set('B', 1, 0.8, 0.3);
    return { solve: async alive => { await writeSteps(steps.length, alive); if (!alive()) return; set('root', 1, 0.8); } };
  }
  if (pic?.kind === 'proof') {
    // the drawn proportions stay readable; the item's numbers are in the prompt
    const r = Math.min(0.42, Math.max(0.27, pic.a / (pic.a + pic.b)));
    const made = tryBlock(() => ProofSquare(7 * r, 7 * (1 - r), MF, th));
    if (!made.ok) return plain();
    const pf: ProofSquareBlock = made.value;
    const { lines, steps } = boardLines(item, false);
    const P = progressOf<ProofStep>(s => tr.k('X.' + s));
    setScene({ table: 1080, model: c => pf.draw(c, P), lines, leads: [] });
    set('outer', 1, 0.8); set('edges', 1, 0.6, 0.4); set('tris', 1, 0.9, 0.3); set('mid', 1, 0.8, 0.9); set('B', 1, 0.8, 0.3);
    if (pic.stage === 'left') { set('move', 1, 1.6, 1.4); set('left', 1, 0.8, 3.0); }
    return {
      solve: async alive => {
        if (pic.stage === 'mid') { set('angles', 1, 0.8); await wait(1.0); if (!alive()) return; set('move', 1, 2.0); await wait(2.1); if (!alive()) return; set('left', 1, 0.8); await wait(0.9); if (!alive()) return; }
        await writeSteps(steps.length, alive);
      },
    };
  }
  return plain();
}

void runLesson({
  slug: SLUG,
  warm: ['0123456789 a^2 + b^2 = c^2 \\sqrt{25} \\times - ? x h n d w', '\\text{slanted side in ft yd area middle uncovered for every right triangle hypotenuse vs}', '\\checkmark \\approx \\ldots \\overset{?}{=} \\angle 90^{\\circ} < ,'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
