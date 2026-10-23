// pythagorean-theorem.ts: "Pythagorean theorem" (grade 8, 8.G.B.6-8) on the shared lesson runtime. The intro topic
// (pythagoras-intro) built the theorem from squares; this one USES it and turns it around.
//   1 The question   a drone flies straight from A(3, 4) to B(9, 12): how far? 3 cards (10 mi; 14 = adds the run and
//                    the rise; 15 = uses B's coordinates as the legs) + how sure
//   2 Worked example four subgoal steps on the coordinate plane: draw the right triangle (the corner C(9, 4) is square
//                    because grid lines are), read the legs (subtract the coordinates), square and add, take the root and
//                    check the size; one "why?" with 3 reasons (catalogue misconceptions)
//   3 Your turn      the same move in 3-D, faded from the end: a 3 x 4 x 12 in box, the floor triangle is given (AC = 5);
//                    the kid picks the standing triangle ACG, finds AG² and AG = 13
//   4 Prove it       Lena: "every rule works backward". The converse proved instead: build a right triangle with legs 5
//                    and 12, its hypotenuse is 13, same three sides -> it lands on Lena's triangle, right angle and all
//   5 Practice       all 22 sub-goals one after another, then mixed (runtime/practice.ts), a picture on every item
// Voiced lines: src/lesson/topics/pythagorean-theorem/script.ts (html + say) -> voice/lines.json. Every answer is logged.
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { SideStep } from '../../src/lesson/topics/pythagoras-intro/SideSquares';
import type { ProofStep } from '../../src/lesson/topics/pythagoras-intro/ProofSquare';
import { PlaneDist, type PlaneStep } from '../../src/lesson/topics/pythagorean-theorem/PlaneDist';
import { Sketch } from '../../src/lesson/topics/pythagorean-theorem/Sketch';
import { boxSketch, converseSketch } from '../../src/lesson/topics/pythagorean-theorem/sketches';
import { FAMILY_NAMES, GENERATORS, MC, type PtItem } from '../../src/lesson/topics/pythagorean-theorem/items';
import { explain } from '../../src/lesson/topics/pythagorean-theorem/explain';
import { PLAN } from '../../src/lesson/topics/pythagorean-theorem/plan';
import { LINES } from '../../src/lesson/topics/pythagorean-theorem/script';
import { PIC_FRAME as MF, WIDE_SLATE, buildPic } from '../../src/lesson/topics/pythagorean-theorem/pictures';

const SLUG = 'pythagorean-theorem';
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

const TAGS: Record<string, { col: Paint }> = { a: { col: 'first' }, b: { col: 'second' }, c: { col: 'link' } };
/** the notation slate: wider than the runtime board (the model frame is narrower), lines left-aligned on it */
const SLATE = box(WIDE_SLATE.x0, WIDE_SLATE.y0, WIDE_SLATE.x1, WIDE_SLATE.y1), SX = SLATE.x0 + 54, SW = SLATE.w - 108;
function L(key: string, src: string, y: number, size = 76, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > SW) s -= 2;
  return { key, F, x: SX, y, size: s, tags: TAGS, col };
}
function centred(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > SW) s -= 2;
  return { key, F, x: SLATE.cx - texWidth(F, s) / 2, y, size: s, tags: TAGS, col };
}
const pulse = async (key: string, alive: () => boolean, hold = 0.9) => { tr.set(key, 1, 0.35); await wait(hold); if (!alive()) return; tr.set(key, 0, 0.6); };
const set = (k: string, v: number, d = 0.9, del = 0) => tr.set(k, v, d, del);

// ===================== the plane example: A(3, 4) to B(9, 12) =====================
const QA: [number, number] = [3, 4], QB: [number, number] = [9, 12];
function planeScene(pre: string, lines: Line[]) {
  const m = PlaneDist({ A: QA, B: QB, run: '6', rise: '8', hyp: '?', hyp2: '10' }, MF, th);
  const P = progressOf<PlaneStep>(s => tr.k(pre + s));
  setScene({ table: 1080, model: c => m.draw(c, P, { run: tr.k(pre + 'gRun'), rise: tr.k(pre + 'gRise'), hyp: tr.k(pre + 'gHyp'), mark: tr.k(pre + 'gMark') }), lines, leads: [], boardBox: SLATE });
  return m;
}

// ===================== 1. The question =====================
const CARDS = [
  { v: 14, mc: MC.addLengths as string | undefined, why: 't.cb-add' },
  { v: 10, mc: undefined as string | undefined, why: 't.cb-right' },
  { v: 15, mc: MC.coordLen as string | undefined, why: 't.cb-coord' },
];
function partQuestion(): void {
  tr.reset('Q.');
  planeScene('Q.', [centred('Q.L1', '\\text{AB} = \\,?', 200, 84)]);
  set('Q.plane', 1, 0.8); set('Q.pts', 1, 0.7, 0.6); set('Q.hyp', 1, 1.2, 1.2); set('Q.L1', 1, 1.0, 2.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A drone flies in a straight line from A(3, 4) to B(9, 12), 1 grid unit = 1 mile: how far?', board: 'AB = ?', response: c.v, expected: 10, correct: c.v === 10, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>miles</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A straight flight'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: the distance AB =====================
function partExample(): void {
  tr.reset('E.');
  const lines = [
    L('E.L1', '\\text{C} = (9, 4)', 170),
    L('E.L2', '\\cssId{a}{\\text{run} = 9 - 3 = 6}', 290),
    L('E.L3', '\\cssId{b}{\\text{rise} = 12 - 4 = 8}', 390),
    L('E.L4', '\\text{AB}^2 = \\cssId{a}{6}^2 + \\cssId{b}{8}^2', 520),
    L('E.L5', '= 36 + 64 = 100', 620),
    L('E.L6', '\\text{AB} = \\sqrt{100} = \\cssId{c}{10}', 750),
    L('E.L7', '8 < \\cssId{c}{10} < 14\\ \\checkmark', 860),
  ];
  planeScene('E.', lines);
  for (const s of ['plane', 'pts', 'hyp']) tr.jump('E.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'Draw the right triangle', why: 'Go across from A, then up to B.', act: 'Draw it' },
    { t: 'Read the legs', why: 'How far do you move across, and up?', act: 'Read them' },
    { t: 'Square and add', why: 'The legs meet at a right angle.', act: 'Add the squares' },
    { t: 'Take the root, check the size', why: 'Is the answer a sensible length?', act: 'Finish' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  async function beat(i: number, alive: () => boolean): Promise<void> {
    if (i === 0) {
      set('E.run', 1, 1.1); await wait(1.1); if (!alive()) return;
      set('E.rise', 1, 1.1); await wait(1.2); if (!alive()) return;
      set('E.mark', 1, 0.6); void pulse('E.gMark', alive, 1.2); await wait(0.8); if (!alive()) return;
      set('E.L1', 1, 1.0); await wait(1.0);
    } else if (i === 1) {
      set('E.gRun', 1, 0.4); set('E.legs', 1, 0.8, 0.3); set('E.L2', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
      set('E.gRun', 0, 0.5); set('E.gRise', 1, 0.4); set('E.L3', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
      set('E.gRise', 0, 0.5);
    } else if (i === 2) {
      set('E.L1:dim', 1, 0.5); set('E.L2:dim', 1, 0.5); set('E.L3:dim', 1, 0.5);
      set('E.gHyp', 1, 0.5); set('E.hypl', 1, 0.6, 0.2); await wait(0.9); if (!alive()) return;
      set('E.L4', 1, 1.1); await wait(1.3); if (!alive()) return;
      set('E.L5', 1, 1.1); await wait(1.3); if (!alive()) return;
      set('E.gHyp', 0, 0.6);
    } else {
      set('E.L4:dim', 1, 0.5); set('E.L5:dim', 1, 0.5);
      set('E.L6', 1, 1.1); await wait(1.0); if (!alive()) return;
      set('E.swap', 1, 0.7); void pulse('E.gHyp', alive, 1.0); await wait(1.3); if (!alive()) return;
      void pulse('E.gRun', alive, 0.8); void pulse('E.gRise', alive, 0.8); set('E.L7', 1, 1.1); await wait(1.4);
    }
  }
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      await beat(i, alive);
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A leg is how far you move from A to B: 9 − 3 across and 12 − 4 up.', ok: true, id: 'e.why-ok', mc: undefined as string | undefined },
      { t: '9 and 12 are where B is, so they are the legs.', ok: false, id: 'e.why-coord', mc: MC.coordLen as string | undefined },
      { t: 'Add the coordinates: 3 + 9 across and 4 + 12 up.', ok: false, id: 'e.why-add', mc: MC.signFlip as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why are the legs 6 and 8, and not 9 and 12?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the space diagonal of a 3 x 4 x 12 in box =====================
function partTurn(): void {
  tr.reset('T.');
  const pic = boxSketch(3, 4, 12, { l: '3\\text{ in}', w: '4\\text{ in}', h: '12\\text{ in}', solve: ['ABC', 'ACG', 'ABF', 'AC', 'CG', 'AG'], verts: ['A', 'B', 'C', 'F', 'G'], mark: 'solve' });
  const m = Sketch(pic.spec, MF, th);
  const P = progressOf<string>(s => tr.k('T.' + s));
  const lines = [
    L('T.L1', '\\cssId{a}{\\text{AC}}^2 = 3^2 + 4^2 = 25', 170),
    L('T.L2', '\\cssId{a}{\\text{AC} = 5}', 270),
    L('T.L3', '\\cssId{c}{\\text{AG}}^2 = \\cssId{a}{\\text{AC}}^2 + \\cssId{b}{\\text{CG}}^2', 420),
    L('T.L4', '\\cssId{c}{\\text{AG}}^2 = \\cssId{a}{25} + \\cssId{b}{144} = 169', 520),
    L('T.L5', '\\text{AG} = \\sqrt{169} = \\cssId{c}{13}', 640),
  ];
  setScene({ table: 1080, model: c => m.draw(c, P, k => tr.k('T.' + k)), lines, leads: [], boardBox: SLATE });
  let step = 0;
  const STEPS = [
    { t: 'The floor triangle', why: 'Done for you: AC = 5.' },
    { t: 'Find the standing triangle', why: 'Your step.' },
    { t: 'Square and add', why: 'Your step.' },
    { t: 'Take the root', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a box'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    set('T.ABC', 1, 0.8); await wait(0.6); if (!alive()) return;
    set('T.AC', 1, 1.0); await wait(1.0); if (!alive()) return;
    set('T.L1', 1, 1.1); await wait(1.2); if (!alive()) return;
    set('T.L2', 1, 0.9); await wait(1.2); if (!alive()) return;
    set('T.ABC', 0, 0.8); set('T.L1:dim', 1, 0.5);
    step = 1; drawPlan(); askTri();
  });
  function askTri(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Triangle ACG', ok: true, id: 't.tri-ok', key: 'ACG', mc: undefined as string | undefined },
      { t: 'Triangle ABC', ok: false, id: 't.tri-floor', key: 'ABC', mc: MC.faceDiag as string | undefined },
      { t: 'Triangle ABF', ok: false, id: 't.tri-front', key: 'ABF', mc: MC.faceDiag as string | undefined },
    ];
    set('T.AG', 1, 1.0); void pulse('T.gAG', () => true, 1.2);
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.triangle', prompt: 'Which right triangle has the space diagonal AG as its hypotenuse?', response: o.t, expected: 'Triangle ACG', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) { seq(async alive => { set('T.' + o.key, 1, 0.6); await wait(2.2); if (!alive()) return; set('T.' + o.key, 0, 0.8); }); return; }
      done = true;
      seq(async alive => {
        set('T.ACG', 1, 0.8); set('T.CG', 1, 0.9, 0.3); await wait(1.3); if (!alive()) return;
        set('T.mark', 1, 0.7); void pulse('T.gmark', alive, 1.2); await wait(1.0); if (!alive()) return;
        set('T.L3', 1, 1.1); await wait(1.3); if (!alive()) return;
        step = 2; drawPlan(); askSq();
      });
    })));
    work.replaceChildren(voiced('t.tri'), bx, fbHost);
  }
  function numAsk(id: string, unit: string, onCheck: (v: number, fbHost: HTMLElement, ok: HTMLButtonElement) => void): void {
    const fbHost = h('div'), inp = numInput(unit, () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false)); return; }
      onCheck(r.v, fbHost, ok);
    }
    work.replaceChildren(voiced(id), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSq(): void {
    numAsk('t.sq', 'sq in', (v, fbHost, ok) => {
      const right = v === 169, mc = v === 25 ? MC.faceDiag : v === 17 ? MC.addLengths : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.square', prompt: 'AC = 5, CG = 12: AG² = ?', board: 'AG² = AC² + CG²', response: v, expected: 169, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(v === 25 ? 't.sq-face' : v === 17 ? 't.sq-add' : 't.sq-no', false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.sq-ok', true));
      seq(async alive => { set('T.L3:dim', 1, 0.5); set('T.L4', 1, 1.1); await wait(1.4); if (!alive()) return; step = 3; drawPlan(); askLen(); });
    });
  }
  function askLen(): void {
    numAsk('t.len', 'in', (v, fbHost, ok) => {
      const right = v === 13;
      const id = v === 169 ? 't.len-root' : v === 84.5 ? 't.len-half' : v === 5 ? 't.len-face' : v === 17 || v === 19 ? 't.len-add' : 't.len-no';
      const mc = v === 169 ? MC.rSquared : v === 84.5 ? MC.halfRoot : v === 5 ? MC.faceDiag : v === 17 || v === 19 ? MC.addLengths : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.length', prompt: 'AG² = 169: how long is AG?', board: 'AG² = 169', response: v, expected: 13, correct: right, mc });
      if (!right) { fbHost.replaceChildren(voicedFb(id, false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.len-ok', true));
      seq(async alive => {
        set('T.L4:dim', 1, 0.5); set('T.L5', 1, 1.1); void pulse('T.gAG', alive, 1.4); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 't.cb-none';
    const el = voiced(id);
    if (cd) el.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(el, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the converse, for Lena's 5-12-13 triangle =====================
function partProve(): void {
  tr.reset('P.');
  const pic = converseSketch(5, 12, '13', '5', '12');
  const m = Sketch(pic.spec, MF, th);
  const P = progressOf<string>(s => tr.k('P.' + s));
  const lines = [
    L('P.L1', '5^2 + 12^2 = 13^2', 170),
    L('P.L2', '\\text{right} \\Rightarrow a^2 + b^2 = c^2', 290, 72, 'dim'),
    L('P.L3', 'a^2 + b^2 = c^2 \\Rightarrow \\text{right?}', 390, 72),
    L('P.L4', '\\cssId{c}{\\sqrt{5^2 + 12^2} = 13}', 560),
    L('P.L5', '\\text{same 3 sides} \\Rightarrow \\cssId{c}{90^{\\circ}}', 690),
  ];
  setScene({ table: 1080, model: c => m.draw(c, P, k => tr.k('P.' + k)), lines, leads: [], boardBox: SLATE });
  set('P.ask', 1, 0.8, 0.6); set('P.L1', 1, 1.0, 1.0); set('P.L2', 1, 1.0, 1.8); set('P.L3', 1, 1.0, 2.6);
  // five short chips (two distractors) in two columns and a compact chain, so the whole proof fits the 1080 screen
  const CHIPS = [
    { t: 'Perpendicular sides can have any lengths', fits: 0 },
    { t: 'The theorem applies: 25 + 144 = 13²', fits: 1 },
    { t: 'Same three sides: same triangle, same angles', fits: 2 },
    { t: 'Every rule works backward', fits: -1, mc: MC.converse, id: 'p.no-flip' },
    { t: 'Lena’s corner looks square', fits: -1, mc: MC.looks, id: 'p.no-looks' },
  ];
  const CLAIMS = ['Build a right triangle with legs <b>5</b> and <b>12</b>', 'Its hypotenuse is <b class="s">13</b>', 'So Lena’s triangle has a <b class="s">right angle</b> across from 13'];
  let filled = 0;
  const chain = h('div', { class: 'chain', style: 'gap:6px;margin:8px 0' });
  const chipBox = h('div', { class: 'chips', style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      // a filled claim shows its reason; only the current one shows the empty slot; later ones are just the claim
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : ''), style: 'padding:6px 10px' });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = i < filled ? `${t} <span class="because" style="display:inline;margin:0">because <i>${chip.t}</i></span>`
        : i === filled ? `${t} <span class="because" style="display:inline;margin:0">because <span class="empty"></span></span>` : t;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); b.style.padding = '7px 10px'; if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3 || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no-other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { set('P.built', 1, 1.2); await wait(1.0); if (!alive()) return; void pulse('P.gZ', alive, 1.2); }
      if (n === 2) { set('P.hyp', 1, 0.8); await wait(0.8); if (!alive()) return; set('P.L4', 1, 1.1); }
      if (n === 3) {
        set('P.lay', 1, 2.4); await wait(2.6); if (!alive()) return;
        set('P.ask', 0, 0.5); set('P.mark', 1, 0.7); void pulse('P.gR', alive, 1.4); set('P.L5', 1, 1.1, 0.3); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Her reason is good', () => judge(true)), no = btn('Her reason is not good', () => judge(false));
  const judgeRow = h('div', { class: 'row' }, yes, no);
  const proofHost = h('div');
  function judge(good: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Lena: right triangle -> a² + b² = c², so a² + b² = c² -> right triangle, because rules work backward. Is her reason good?', response: good ? 'good' : 'not good', expected: 'not good', correct: !good, mc: good ? MC.converse : undefined });
    judgeRow.remove();
    proofHost.replaceChildren(voiced(good ? 'p.flip' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it: the converse'), voiced('p.intro'), judgeRow, proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('X.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as PtItem),
  });
}
/** the slate of an item without a picture: the whole stage, where the picture would be */
const BIG = box(90, 110, 1830, 990);
function boardLines(item: PtItem, wide: boolean): { lines: Line[]; n: number } {
  const steps = item.steps ?? [];
  if (!wide) return { lines: [L('X.B', item.board, 170, 80), ...steps.map((s, i) => L(`X.s${i}`, s, 320 + i * 125, 72))], n: steps.length };
  const fit = (key: string, src: string, y: number, size: number): Line => {
    const F = tex(src) as Formula;
    let s = size;
    while (s > 64 && texWidth(F, s) > BIG.w - 160) s -= 4;
    return { key, F, x: BIG.cx - texWidth(F, s) / 2, y, size: s, tags: TAGS };
  };
  const top = steps.length ? BIG.y0 + 120 : BIG.cy;
  return { lines: [fit('X.B', item.board, top, 120), ...steps.map((s, i) => fit(`X.s${i}`, s, top + 150 + i * 115, 84))], n: steps.length };
}
function showItem(item: PtItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('X.');
  const pic = item.picture?.pic;
  const built = buildPic(pic);
  const sx = (k: string, v = 1, d = 0.7, del = 0) => tr.set('X.' + k, v, d, del);
  const writeSteps = async (n: number, alive: () => boolean) => { for (let i = 0; i < n; i++) { sx(`s${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; } };
  if (!built || !pic) {
    const { lines, n } = boardLines(item, true);
    setScene({ table: 1080, lines, leads: [], boardBox: BIG });
    sx('B', 1, 0.8, 0.1);
    return { solve: n ? async alive => writeSteps(n, alive) : undefined };
  }
  const { lines, n } = boardLines(item, false);
  const P = <S extends string>() => progressOf<S>(s => tr.k('X.' + s));
  sx('B', 1, 0.8, 0.3);
  if (built.kind === 'tri' && pic.kind === 'tri') {
    const m = built.block, PP = P<SideStep>();
    setScene({ table: 1080, model: c => m.draw(c, PP), lines, leads: [], boardBox: SLATE });
    sx('tri', 1, 0.8); sx('mark', 1, 0.6, 0.4); sx('labels', 1, 0.7, 0.5); sx('verts', 1, 0.7, 0.5);
    const sqs = built.squares ? (pic.squares ?? []) : [];
    if (pic.now) for (const s of sqs) { sx(`sq${s}`, 1, 0.9, 0.6); sx(`area${s}`, 1, 0.7, 1.2); }
    return {
      solve: async alive => {
        if (!pic.now) for (const s of sqs) { sx(`sq${s}`, 1, 0.9); await wait(0.7); if (!alive()) return; sx(`area${s}`, 1, 0.6); }
        if (!pic.now && sqs.length) { await wait(0.6); if (!alive()) return; }
        await writeSteps(n, alive);
      },
    };
  }
  if (built.kind === 'tilt' && pic.kind === 'tilt') {
    const m = built.block, PP = P<SideStep>();
    setScene({ table: 1080, model: c => m.draw(c, PP), lines, leads: [], boardBox: SLATE });
    sx('grid', 1, 0.6); sx('sqc', 1, 0.9, 0.3);
    if (pic.corners) { sx('surround', 1, 0.9, 0.8); sx('corners', 1, 1.0, 1.3); }
    return {
      solve: async alive => {
        if (!pic.corners) { sx('surround', 1, 0.9); await wait(1.0); if (!alive()) return; sx('corners', 1, 1.0); await wait(1.2); if (!alive()) return; }
        await writeSteps(Math.max(0, n - 1), alive); if (!alive()) return;
        sx('lift', 1, 0.8); sx('areac', 1, 0.7, 0.4); await wait(1.0); if (!alive()) return;
        if (n) sx(`s${n - 1}`, 1, 0.9);
      },
    };
  }
  if (built.kind === 'plane' && pic.kind === 'plane') {
    const m = built.block, PP = P<PlaneStep>();
    setScene({ table: 1080, model: c => m.draw(c, PP, { hyp: tr.k('X.gHyp') }), lines, leads: [], boardBox: SLATE });
    sx('plane', 1, 0.6); sx('pts', 1, 0.6, 0.4);
    if (pic.now) { sx('run', 1, 0.8, 0.8); sx('rise', 1, 0.8, 1.3); sx('mark', 1, 0.5, 1.8); }
    return {
      solve: async alive => {
        sx('run', 1, 0.9); await wait(0.9); if (!alive()) return;
        sx('rise', 1, 0.9); await wait(0.9); if (!alive()) return;
        sx('mark', 1, 0.5); sx('legs', 1, 0.7); await wait(0.8); if (!alive()) return;
        sx('hyp', 1, 0.9); await wait(0.9); if (!alive()) return;
        await writeSteps(n, alive); if (!alive()) return;
        sx('hypl', 1, 0.7);
      },
    };
  }
  if (built.kind === 'sketch' && pic.kind === 'sketch') {
    const m = built.block, PP = P<string>();
    setScene({ table: 1080, model: c => m.draw(c, PP, k => tr.k('X.' + k)), lines, leads: [], boardBox: SLATE });
    for (const s of pic.now) sx(s, 1, 0.8, 0.3);
    return {
      solve: async alive => {
        for (const s of pic.solve) {
          if (s === 'mark' && pic.now.includes('ask')) sx('ask', 0, 0.5);
          sx(s, 1, s === 'lay' ? 2.0 : 0.9); await wait(s === 'lay' ? 2.1 : 0.9); if (!alive()) return;
        }
        await writeSteps(n, alive);
      },
    };
  }
  if (built.kind === 'proof' && pic.kind === 'proof') {
    const m = built.block, PP = P<ProofStep>();
    setScene({ table: 1080, model: c => m.draw(c, PP), lines, leads: [], boardBox: SLATE });
    sx('outer', 1, 0.8); sx('edges', 1, 0.6, 0.4); sx('tris', 1, 0.9, 0.3); sx('mid', 1, 0.8, 0.9);
    if (pic.stage === 'left') { sx('move', 1, 1.6, 1.4); sx('left', 1, 0.8, 3.0); }
    return {
      solve: async alive => {
        if (pic.stage === 'mid') { sx('angles', 1, 0.8); await wait(1.0); if (!alive()) return; sx('move', 1, 2.0); await wait(2.1); if (!alive()) return; sx('left', 1, 0.8); await wait(0.9); if (!alive()) return; }
        await writeSteps(n, alive);
      },
    };
  }
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['0123456789 a^2 + b^2 = c^2 \\sqrt{169} \\times - ? x h \\approx \\ldots \\overset{?}{=} \\neq \\Rightarrow < \\checkmark', '\\text{AB C run rise in ft yd mi cm m same 3 sides right triangle hypotenuse third side area surround corners}', '90^{\\circ} \\angle \\perp \\, |'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
