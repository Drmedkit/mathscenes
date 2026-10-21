// parallel-lines-and-triangles.ts: "Angle relationships with parallel lines and triangles" (grade 8, 8.G.A.5) on the
// shared lesson runtime.
//   1 The question   Elm St ∥ Oak St, a rail line crosses both: 65° at Oak St, x at Elm St (same-side interior).
//                    3 cards (115; 65 = sets a supplementary pair equal; can't tell = refuses the parallel facts)
//   2 Worked example four subgoal steps on the figure: read it (two crossings, the band between the lines), slide the
//                    lower crossing up the rail line (translation: y = 65), the straight line at P (x = 180 − 65),
//                    check (same-side interior angles add to 180); one "why?" with 3 reasons
//   3 Your turn      ℓ ∥ m standing up, 108° given, faded from the end: read is given, the kid picks the alternate
//                    interior partner (a half turn about M shows it), gives its measure, then the same-side angle b
//   4 Prove it       Riley measured five triangles: a proof? Then the general argument from reason chips (line ℓ
//                    drawn through A parallel to BC, alternate interior twice, the straight angle; distractors =
//                    examples-as-proof, looks-parallel, circular); A slides along ℓ: the argument never used sizes
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/parallel-lines-and-triangles/voice/lines.json. Every answer is logged (runtime/store.ts).
import type { Canvas } from '../../src/core/draw';
import { type Pt, box } from '../../src/core/math';
import { tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Line, bump, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { drawFig, type Look, sheet } from '../../src/lesson/topics/parallel-lines-and-triangles/GeoFig';
import { type Fig, type Fit, FIG, add, fitFig, mapFig, mul, rotP, sub } from '../../src/lesson/topics/parallel-lines-and-triangles/figMaths';
import { QUESTION, TURN, proofFig } from '../../src/lesson/topics/parallel-lines-and-triangles/figures';
import { FAMILY_NAMES, GENERATORS, MC, type GeoItem } from '../../src/lesson/topics/parallel-lines-and-triangles/items';
import { PLAN } from '../../src/lesson/topics/parallel-lines-and-triangles/plan';
import LINES from './parallel-lines-and-triangles/voice/lines.json';

const SLUG = 'parallel-lines-and-triangles';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML shown is the line's text with colour marks; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ---------- the wide board (the figure keeps the left half) ----------
const BD = box(1050, 70, 1860, 1010), BLX = BD.x0 + 52, BW = BD.w - 100;
const MIDFIG = { x: 490, y: 70, w: 940, h: 940 };
const WIDE = box(260, 140, 1660, 940);
type Tags = Record<string, { col: Paint }>;
/** a board line that shrinks to fit the wide board (never below 60 px) */
function bl(key: string, src: string, y: number, size = 70, tags?: Tags, col?: Paint): Line {
  const F = tex(src);
  let s = size;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  return { key, F, x: BLX, y, size: s, tags, col };
}
const TG = (o: Record<string, Paint>): Tags => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { col: v }]));
/** the look of a lesson figure from track keys: `${pre}m.<id>` visibility, `s.<id>` solved, `g.<id>` glow */
function lookOf(pre: string, f: Fig, extra: Partial<Look> = {}): Look {
  const ids = f.angles.map(a => a.id);
  const o = (k: string) => Object.fromEntries(ids.map(id => [id, tr.k(`${pre}${k}.${id}`)]));
  return { marks: o('m'), solved: o('s'), glow: o('g'), ...extra };
}
/** a figure scene: the sheet, the figure, ghosts on top; the board on the right */
function figScene(fig: () => Fig, fit: Fit, look: () => Look, lines: Line[], ghosts?: (c: Canvas) => void): void {
  setScene({ table: 1080, boardBox: BD, lines, leads: [], model: c => { sheet(c, FIG); drawFig(c, fig(), fit, look()); ghosts?.(c); } });
}
const recolor = (f: Fig, col: 'pick' | 'link' | 'second'): Fig => ({ ...f, segs: f.segs.map(s => ({ ...s, col, name: undefined, par: 0 })), angles: f.angles.map(a => ({ ...a, col })) });

// ===================== 1. The question =====================
const QT = QUESTION, QFIT = fitFig(QT.fig);
const CARDS = [
  { v: '65°', id: MC.suppEqual, why: 'q.cb.equal' },
  { v: '115°', id: '', why: 'q.cb.right' },
  { v: 'Can’t tell', id: MC.rejectNoPar, why: 'q.cb.cant' },
];
function partQuestion(): void {
  tr.reset('q.');
  for (const id of ['g', 'x']) tr.set(`q.m.${id}`, 1, 0.8, id === 'g' ? 1.2 : 1.8);
  tr.set('q.in', 1, 0.8);
  const lines = [
    bl('q.L0', '\\text{Elm St} \\parallel \\text{Oak St}', 200, 70),
    bl('q.L1', '\\text{one corner: }\\ \\cssId{g}{65^\\circ}', 330, 70, TG({ g: 'second' })),
    bl('q.L2', '\\cssId{x}{x} = \\,?', 460, 76, TG({ x: 'link' })),
  ];
  figScene(() => QT.fig, QFIT, () => lookOf('q.', QT.fig, { k: tr.k('q.in'), road: 1, letters: 0, fills: { band: 0 } }), lines);
  tr.set('q.L0', 1, 0.9, 1.0); tr.set('q.L1', 1, 0.9, 1.6); tr.set('q.L2', 1, 0.9, 2.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Elm St and Oak St are parallel; a rail line crosses both. One corner at Oak St is 65°. What is corner x at Elm St?', board: 'x = ?', response: c.v, expected: '115°', correct: c.v === '115°', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>${i === 2 ? 'not enough' : 'corner x'}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Two parallel streets'),
    voiced('q.intro', 'Elm Street and Oak Street are parallel. A rail line crosses both. Where it meets Oak Street, one corner is <b class="b">65°</b>. What is corner <b class="s">x</b>, where it meets Elm Street? Pick an answer, and say how sure you are.'),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  for (const id of ['g', 'x']) tr.jump(`e.m.${id}`, 1);
  tr.jump('e.road', 1); tr.jump('e.L0', 1); tr.jump('e.L1', 1); tr.jump('e.Lq', 1);
  const lines = [
    bl('e.L0', '\\text{Elm St} \\parallel \\text{Oak St}', 170, 66),
    bl('e.L1', '\\text{given: }\\ \\cssId{g}{65^\\circ}', 270, 66, TG({ g: 'second' })),
    bl('e.L2', '\\text{interior: between the streets}', 370, 60, undefined, 'dim'),
    bl('e.L3', '\\cssId{y}{y} = 65^\\circ \\quad \\text{(slide)}', 490, 70, TG({ y: 'pick' })),
    bl('e.L4', '\\cssId{x}{x} = 180^\\circ - 65^\\circ', 610, 70, TG({ x: 'link' })),
    bl('e.L5', 'x = \\cssId{v}{115^\\circ}', 720, 74, TG({ v: 'link' })),
    bl('e.L6', '115^\\circ + 65^\\circ = 180^\\circ\\ \\cssId{ok}{\\checkmark}', 860, 66, TG({ ok: 'link' })),
  ];
  const Lq = bl('e.Lq', '\\cssId{x}{x} = \\,?', 610, 70, TG({ x: 'link' }));
  // the ghost: the Oak St crossing (line and the 65° corner) slides up the rail line onto Elm St
  const sub0: Fig = { segs: QT.fig.segs.filter(s => s.id === 'm'), angles: QT.fig.angles.filter(a => a.id === 'g'), points: [], fills: [] };
  const ghosts = (c: Canvas) => {
    const k = tr.k('e.slide'), a = tr.k('e.ghost');
    if (a <= 0) return;
    const G = mapFig(recolor(sub0, 'pick'), p => add(p, mul(sub(QT.P, QT.Q), k)));
    G.angles = G.angles.map(x => ({ ...x, text: '65°' }));
    drawFig(c, G, QFIT, { k: a * 0.9 });
  };
  figScene(() => QT.fig, QFIT, () => lookOf('e.', QT.fig, { road: tr.k('e.road'), letters: tr.k('e.letters'), fills: { band: tr.k('e.band') } }), [...lines, Lq], ghosts);
  let step = 0;
  const STEPS = [
    { t: 'Read the figure', why: 'Two crossings. Which corners are between the streets?', act: 'Read it' },
    { t: 'Slide the crossing', why: 'The streets are parallel: slide Oak St’s crossing up the rail line.', act: 'Slide it' },
    { t: 'Use the straight line', why: 'x and y sit side by side on the rail line.', act: 'Use it' },
    { t: 'Check it', why: 'Do x and 65° fit together?', act: 'Check' },
  ];
  const SAY = [
    'Two crossings, <b>P</b> and <b>Q</b>. The band between the parallel streets is the <b>interior</b>. The 65° corner and <b class="s">x</b> are both inside it, on the same side of the rail line.',
    'Slide Oak Street’s crossing up the rail line until Q lands on P. The streets are parallel, so it lands exactly on Elm Street. The 65° corner lands on corner <b class="b">y</b>: <b class="b">y = 65°</b>. They are <b>corresponding angles</b>.',
    'x and y together fill a straight line: the rail line, 180°. So <b class="s">x = 180° − 65° = 115°</b>.',
    '115° + 65° = 180°. Same-side interior angles at parallel lines <b>add to 180°</b>. They are not equal.',
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.road', 0, 1.0); tr.set('e.band', 1, 1.2, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('e.letters', 1, 0.8); tr.set('e.g.g', 1, 0.4); tr.set('e.g.x', 1, 0.4); await wait(0.8); if (!alive()) return;
        tr.set('e.L2', 1, 0.9); await wait(1.4); if (!alive()) return;
        tr.set('e.g.g', 0, 0.5); tr.set('e.g.x', 0, 0.5);
      } else if (i === 1) {
        tr.set('e.ghost', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.slide', 1, 2.4); await wait(2.6); if (!alive()) return;
        tr.set('e.m.y', 1, 0.6); tr.set('e.ghost', 0, 0.8, 0.3); await wait(0.9); if (!alive()) return;
        tr.set('e.s.y', 1, 0.8); tr.set('e.L3', 1, 1.0); await wait(1.3);
      } else if (i === 2) {
        tr.set('e.m.w', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.Lq', 0, 0.4); tr.set('e.L4', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.s.x', 1, 0.8); tr.set('e.L5', 1, 1.0); await wait(1.3);
      } else {
        tr.set('e.m.w', 0, 0.6); tr.set('e.s.y', 0, 0.5); tr.set('e.m.y', 0, 0.6, 0.2); await wait(0.8); if (!alive()) return;
        tr.set('e.g.g', 1, 0.5); tr.set('e.g.x', 1, 0.5); await wait(0.7); if (!alive()) return;
        tr.set('e.L6', 1, 1.1); await wait(1.4);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The streets are parallel, so sliding the lower crossing up the rail line lands it exactly on the upper one.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. Parallel is what makes the slide land exactly. Without it, the corners would not match.' },
      { t: 'x looks bigger than 65°, so it must be 180° − 65°.', ok: false, id: 'e.why.look', mc: MC.appearance, say: 'Looks can fool you, and a drawing may not be to scale. The reason is the slide, which needs parallel streets.' },
      { t: 'Corners between the two streets on the same side are always equal.', ok: false, id: 'e.why.equal', mc: MC.suppEqual, say: 'They are not equal: 115° and 65°. Same-side interior corners add to 180°.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why could the 65° corner move up to Elm Street?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why could the 65° corner move up to Elm Street?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the figure moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn =====================
const TT = TURN, TFIT = fitFig(TT.fig);
function partTurn(): void {
  tr.reset('t.');
  tr.set('t.in', 1, 0.8);
  for (const id of ['g', 'a', 'b', 'c']) tr.set(`t.m.${id}`, 1, 0.7, 0.8);
  const lines = [
    bl('t.L0', '\\ell \\parallel m', 170, 70),
    bl('t.L1', '\\text{given: }\\ \\cssId{g}{108^\\circ}', 280, 70, TG({ g: 'second' })),
    bl('t.L2', '\\cssId{a}{a} = 108^\\circ \\quad \\text{(half turn)}', 440, 70, TG({ a: 'pick' })),
    bl('t.L3', '\\cssId{b}{b} = 180^\\circ - 108^\\circ', 570, 70, TG({ b: 'pick' })),
    bl('t.L4', 'b = \\cssId{v}{72^\\circ}', 680, 74, TG({ v: 'link' })),
  ];
  tr.set('t.L0', 1, 0.8, 1.2); tr.set('t.L1', 1, 0.8, 1.6);
  const subP: Fig = { segs: TT.fig.segs.filter(s => s.id === 'l'), angles: TT.fig.angles.filter(a => a.id === 'g'), points: [], fills: [] };
  const ghosts = (c: Canvas) => {
    const k = tr.k('t.turn'), a = tr.k('t.ghost');
    if (a <= 0) return;
    drawFig(c, mapFig(recolor(subP, 'pick'), p => rotP(p, 180 * k, TT.M)), TFIT, { k: a * 0.9 });
  };
  figScene(() => TT.fig, TFIT, () => lookOf('t.', TT.fig, { k: tr.k('t.in'), fills: { band: tr.k('t.band') } }), lines, ghosts);
  let step = 0;
  const STEPS = [
    { t: 'Read the figure', why: 'Done for you.' },
    { t: 'Find the partner', why: 'Your step.' },
    { t: 'Its measure', why: 'Your step.' },
    { t: 'The same-side angle', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the lines stand up'), voiced('t.intro', 'Now the parallel lines <b>ℓ</b> and <b>m</b> stand up, and the given angle is <b class="b">108°</b>. The first step is done for you.'), plan, work);
  seq(async alive => {
    await wait(2.2); if (!alive()) return;
    tr.set('t.band', 1, 1.0); tr.set('t.g.g', 1, 0.5, 0.4); await wait(1.6); if (!alive()) return;
    tr.set('t.g.g', 0, 0.5);
    step = 1; drawPlan(); askPartner();
  });
  function askPartner(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Angle a', ok: true, id: 't.p.ok', mc: undefined as string | undefined, say: 'Yes: a is between the lines, on the other side of t. Watch the half turn about M carry the 108° angle onto a.' },
      { t: 'Angle b', ok: false, id: 't.p.b', mc: MC.misPos as string | undefined, say: 'b is between the lines too, but on the SAME side of t: same-side interior. Alternate means opposite sides.' },
      { t: 'Angle c', ok: false, id: 't.p.c', mc: MC.misPos as string | undefined, say: 'c is outside the lines: it corresponds to the 108° angle. Alternate interior angles are both between the lines.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.partner', prompt: 'Which angle is the alternate interior partner of the 108° angle?', response: o.t, expected: 'Angle a', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) { const id = o.t.endsWith('b') ? 'b' : 'c'; seq(async alive => { tr.set(`t.g.${id}`, 1, 0.4); await wait(1.6); if (!alive()) return; tr.set(`t.g.${id}`, 0, 0.5); }); return; }
      done = true;
      seq(async alive => {
        tr.set('t.ghost', 1, 0.4); await wait(0.5); if (!alive()) return;
        tr.set('t.turn', 1, 2.6); await wait(2.8); if (!alive()) return;
        tr.set('t.ghost', 0, 0.8); tr.set('t.g.a', 1, 0.5); await wait(0.9); if (!alive()) return;
        step = 2; drawPlan(); askA();
      });
    })));
    work.replaceChildren(voiced('t.partner', 'Which marked angle is the <b>alternate interior</b> partner of the 108° angle?'), bx, fbHost);
  }
  function askA(): void {
    const fbHost = h('div'), inp = numInput('degrees', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const right = r.v === 108, mc = r.v === 72 ? MC.congSupp : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.a', prompt: 'ℓ ∥ m; a is alternate interior to the 108° angle. a = ?', response: r.v, expected: 108, correct: right, mc });
      if (!right) { fbHost.replaceChildren(r.v === 72 ? voicedFb('t.a.72', false, 'The half turn put the 108° angle right on top of a. Alternate interior angles are equal, not supplementary.') : voicedFb('t.a.no', false, 'The half turn carried the 108° angle exactly onto a. So a is…?')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.a.ok', true, 'Yes: <b class="b">a = 108°</b>. Alternate interior angles at parallel lines are equal.'));
      seq(async alive => { tr.set('t.g.a', 0, 0.4); tr.set('t.s.a', 1, 0.8); tr.set('t.L2', 1, 1.0); await wait(1.4); if (!alive()) return; step = 3; drawPlan(); askB(); });
    }
    work.replaceChildren(voiced('t.a', 'What is the measure of angle <b>a</b>?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askB(): void {
    const fbHost = h('div'), inp = numInput('degrees', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const right = r.v === 72, mc = r.v === 108 ? MC.suppEqual : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.b', prompt: 'ℓ ∥ m; b is same-side interior with the 108° angle. b = ?', response: r.v, expected: 72, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(r.v === 108 ? voicedFb('t.b.108', false, 'b and a sit side by side on line m: together they make a straight line. They add to 180°, so b is not 108°.') : voicedFb('t.b.no', false, 'a and b fill a straight line together: a + b = 180°.'));
        if (r.v === 108) seq(async alive => { tr.set('t.g.a', 1, 0.5); tr.set('t.g.b', 1, 0.5); await wait(2.2); if (!alive()) return; tr.set('t.g.a', 0, 0.6); tr.set('t.g.b', 0, 0.6); });
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.b.ok', true, 'Yes: <b class="s">b = 180° − 108° = 72°</b>. b and the 108° angle are same-side interior angles: they add to 180°.'));
      seq(async alive => {
        tr.set('t.g.a', 1, 0.5); tr.set('t.g.b', 1, 0.5); tr.set('t.L3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.s.b', 1, 0.8); tr.set('t.L4', 1, 1.0); await wait(1.4); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.b', 'Angle <b>b</b> is on the same side of t as the 108° angle, between the lines. What is its measure?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked 115°, and you were right. Now you can show why: slide, then use the straight line.',
      'q.cb.equal': 'At the start you picked 65°. Corners between the lines on the same side are not equal: they add to 180°.',
      'q.cb.cant': 'At the start you picked “can’t tell”. With the streets given as parallel, you can: the slide lands exactly.',
      'q.cb.none': 'Parallel lines let you move an angle from one crossing to the other. Then a straight line does the rest.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the triangle angle sum =====================
const PFIT = fitFig(proofFig(0).fig);
function partProve(): void {
  tr.reset('p.');
  tr.set('p.in', 1, 0.8);
  for (const id of ['A', 'B', 'C', 'one', 'three']) tr.set(`p.m.${id}`, 1, 0.7, 0.6);
  const lines = [
    bl('p.L0', '\\ell \\parallel BC \\ \\ \\text{(drawn)}', 170, 68, undefined, 'dim'),
    bl('p.Lq', '\\angle A + \\angle B + \\angle C = \\,?', 290, 68),
    bl('p.L1', '\\angle 1 = \\angle B', 290, 72),
    bl('p.L2', '\\angle 3 = \\angle C', 400, 72),
    bl('p.L3', '\\angle 1 + \\cssId{a}{\\angle A} + \\angle 3 = 180^\\circ', 530, 68, TG({ a: 'first' })),
    bl('p.L4', '\\cssId{a}{\\angle A} + \\angle B + \\angle C = \\cssId{s}{180^\\circ}', 680, 68, TG({ a: 'first', s: 'link' })),
  ];
  tr.set('p.L0', 1, 0.9, 1.0); tr.set('p.Lq', 1, 0.9, 1.5);
  const fig = () => proofFig(tr.k('p.ax')).fig;
  const ghosts = (c: Canvas) => {
    for (const [key, vid, sid] of [['p.r1', 'B', 'BC'], ['p.r3', 'C', 'BC']] as const) {
      const a = tr.k(key + 'a');
      if (a <= 0) continue;
      const F = proofFig(tr.k('p.ax')), V = vid === 'B' ? F.B : F.C;
      const M: Pt = mul(add(F.A, V), 0.5);
      const part: Fig = { segs: [{ a: V, b: add(V, mul(sub(vid === 'B' ? F.C : F.B, V), 0.45)) }], angles: F.fig.angles.filter(x => x.id === vid), points: [], fills: [] };
      void sid;
      drawFig(c, mapFig(recolor(part, 'pick'), p => rotP(p, 180 * tr.k(key), M)), PFIT, { k: a * 0.9 });
    }
  };
  // once a half turn lands, angle 1 (3) takes the colour of angle B (C): matching arcs, matching colour
  const colOf = () => ({ ...(tr.k('p.c1') > 0.5 ? { one: 'second' as const } : {}), ...(tr.k('p.c3') > 0.5 ? { three: 'second' as const } : {}) });
  figScene(fig, PFIT, () => lookOf('p.', proofFig(0).fig, { k: tr.k('p.in'), col: colOf() }), lines, ghosts);
  // six short chips (two distractors) in two columns, so the whole proof fits the 1080 screen without scrolling
  const CHIPS = [
    { t: 'Alt. interior: AB crosses ℓ and BC', fits: 0 },
    { t: 'Alt. interior: AC crosses ℓ and BC', fits: 1 },
    { t: 'They fill the straight line ℓ at A', fits: 2 },
    { t: 'Swap in ∠1 = ∠B and ∠3 = ∠C', fits: 3 },
    { t: 'ℓ looks parallel to BC', fits: -1, mc: MC.appearance, id: 'p.no.look', say: 'Looking parallel is not enough. ℓ was DRAWN parallel to BC: that is the reason.' },
    { t: 'A triangle’s angles add to 180°', fits: -1, mc: MC.circular, id: 'p.no.circ', say: 'That is exactly what we are trying to prove. It can’t be a reason in its own proof.' },
  ];
  const CLAIMS = ['<b>∠1 = ∠B</b>', '<b>∠3 = ∠C</b>', '<b>∠1 + ∠A + ∠3 = 180°</b>', 'So <b class="s">∠A + ∠B + ∠C = 180°</b> in every triangle'];
  const SAYC = [
    'Right. A half turn about the middle of AB carries ∠B onto ∠1.',
    'Right. A half turn about the middle of AC carries ∠C onto ∠3.',
    'Right. ∠1, ∠A and ∠3 fill line ℓ: 180°.',
    'Right. Watch A slide: the argument never used a size.',
  ];
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
    if (filled >= 4) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1 || n === 2) {
        const key = n === 1 ? 'p.r1' : 'p.r3', target = n === 1 ? 'one' : 'three';
        if (n === 1) tr.set('p.Lq', 0, 0.4);
        tr.set(key + 'a', 1, 0.4); await wait(0.5); if (!alive()) return;
        tr.set(key, 1, 2.4); await wait(2.6); if (!alive()) return;
        tr.set(key + 'a', 0, 0.7); tr.set(n === 1 ? 'p.c1' : 'p.c3', 1, 0.3); void bump(`p.g.${target}`, alive); tr.set(n === 1 ? 'p.L1' : 'p.L2', 1, 1.0, 0.3);
      }
      if (n === 3) {
        tr.set('p.m.w', 1, 1.0); tr.set('p.g.one', 1, 0.5); tr.set('p.g.A', 1, 0.5); tr.set('p.g.three', 1, 0.5); await wait(1.2); if (!alive()) return;
        tr.set('p.L3', 1, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('p.g.one', 0, 0.5); tr.set('p.g.A', 0, 0.5); tr.set('p.g.three', 0, 0.5);
      }
      if (n === 4) {
        tr.set('p.L4', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('p.ax', -150, 2.0); await wait(2.2); if (!alive()) return;
        tr.set('p.ax', 100, 2.4); await wait(2.6); if (!alive()) return;
        tr.set('p.ax', 0, 1.6); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: every claim has a known reason, and it works for every triangle. Riley’s triangles were only examples.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Yes, that proves it', () => judge(true)), no = btn('No, that is not a proof', () => judge(false));
  const proofHost = h('div');
  function judge(proof: boolean): void {
    yes.disabled = no.disabled = true;
    (proof ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley measured five triangles: 180°, 179°, 181°, 180°, 180°. Does that prove every triangle’s angles add to 180°?', response: proof ? 'proof' : 'not a proof', expected: 'not a proof', correct: !proof, mc: proof ? MC.examples : undefined });
    judgeRow.remove();
    proofHost.replaceChildren(
      proof ? voiced('p.test', 'Five examples are not a proof: it must work for every triangle. ℓ is drawn through A, parallel to BC. Pick each reason.') : voiced('p.build', 'Right: examples are not a proof. ℓ is drawn through A, parallel to BC. Pick each reason.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  const judgeRow = h('div', { class: 'row' }, yes, no);
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', 'Riley added the angles of five triangles: 180°, 179°, 181°, 180°, 180°. “So every triangle makes 180°.” Is that a proof?'),
    judgeRow, proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as GeoItem),
  });
}
function showItem(item: GeoItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const lines: Line[] = [];
  if (pic) {
    item.givens.forEach((g, i) => lines.push(bl(`x.G${i}`, g, BD.y0 + 100 + i * 100, 66)));
    const top = BD.y0 + 100 + item.givens.length * 100 + (item.givens.length ? 40 : 0);
    const gap = Math.min(100, (BD.y1 - 60 - top) / Math.max(1, item.work.length));
    item.work.forEach((w, i) => lines.push(bl(`x.W${i}`, w, top + i * gap, 64, undefined, i === item.work.length - 1 ? 'link' : 'ink')));
  } else {
    const all = [...item.givens, ...item.work];
    const step = Math.min(130, (WIDE.h - 120) / Math.max(1, all.length)), y0 = WIDE.cy - ((all.length - 1) * step) / 2;
    all.forEach((g, i) => {
      const F = tex(g); let s = 92; while (s > 60 && texWidth(F, s) > WIDE.w - 160) s -= 4;
      const isW = i >= item.givens.length;
      lines.push({ key: isW ? `x.W${i - item.givens.length}` : `x.G${i}`, F, x: WIDE.cx - texWidth(F, s) / 2, y: y0 + i * step, size: s, col: isW && i === all.length - 1 ? 'link' : 'ink' });
    });
  }
  const noBoard = !!pic && !item.givens.length && !item.work.length;
  const fr = noBoard ? MIDFIG : FIG;
  if (pic) {
    const fig = pic.fig, fit = fitFig(fig, fr);
    const reveal = pic.reveal ?? [], focus = pic.focus ?? [];
    const solveSegs = fig.segs.filter(s => s.solve).map(s => s.id!).filter(Boolean);
    const only = fig.angles.filter(a => a.solve === 'only').map(a => a.id), hide = fig.angles.filter(a => a.solve === 'hide').map(a => a.id);
    setScene({
      table: 1080, lines, leads: [], boardBox: noBoard ? null : BD,
      model: c => {
        sheet(c, fr);
        const ks = tr.k('x.solve');
        drawFig(c, fig, fit, {
          k: tr.k('x.in'),
          solved: Object.fromEntries(reveal.map(id => [id, ks])),
          glow: Object.fromEntries(focus.map(id => [id, ks])),
          marks: Object.fromEntries(only.map(id => [id, ks])),
          labels: Object.fromEntries(hide.map(id => [id, 1 - ks])),
          segs: Object.fromEntries(solveSegs.map(id => [id, tr.k('x.draw')])),
          fills: Object.fromEntries((pic.fills ?? []).map(id => [id, tr.k('x.fills')])),
        });
      },
    });
  } else setScene({ table: 1080, lines, leads: [], boardBox: WIDE });
  tr.set('x.in', 1, 0.6);
  item.givens.forEach((_, i) => tr.set(`x.G${i}`, 1, 0.8, 0.3 + 0.3 * i));
  return {
    solve: async alive => {
      tr.set('x.draw', 1, 1.6); await wait(pic?.fig.segs.some(s => s.solve) ? 1.4 : 0); if (!alive()) return;
      tr.set('x.fills', 1, 1.0); tr.set('x.solve', 1, 0.8);
      for (let i = 0; i < item.work.length; i++) { tr.set(`x.W${i}`, 1, 0.8); await wait(0.8); if (!alive()) return; }
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{Elm St} \\parallel \\text{Oak St}', 'x = 180^\\circ - 65^\\circ', '\\angle 1 + \\angle A + \\angle 3 = 180^\\circ', '\\checkmark', '\\ell \\parallel m'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
