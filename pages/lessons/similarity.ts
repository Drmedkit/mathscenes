// similarity.ts: "Similar triangles" (Geometry, lesson 9) on the shared runtime.
//   1 The question   a roof frame: the brace DE ∥ the beam BC, AD = 4 ft, DB = 6 ft, DE = 5 ft. How long is BC?
//                    (7.5 = part for whole, 11 = adding the extra 6, 12.5 = right) + how sure
//   2 Worked example AA from the figure to the length: two angle pairs (shared ∠A, corresponding angles) -> △ADE ~ △ABC
//                    in order -> the dilation from A by k = 10/4 carries △ADE onto △ABC (why AA works) -> AD/AB = DE/BC,
//                    BC = 12.5; why AB and not DB?
//   3 Your turn      the hourglass (AB ∥ CD, AE = 6, EC = 9, AB = 8): the statement (A ↔ C by alternate interior angles;
//                    a half-turn about E, then a dilation), the scale factor 3/2, then CD = 12
//   4 Prove it       the side-splitter theorem on the roof frame, by the common scale factor: a because-chain (AA, one k,
//                    whole minus part) while the small triangle grows onto the big one and the cut parts light up; then
//                    "does AD/DB = DE/BC?" (no: DE and BC pair with whole sides). Callback to part 1.
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only from geometry-foundations: geo.ts + GeoFig.ts (exact figures), ProofFrame.ts (the two-column board),
// Card.ts. Figures and maths: src/lesson/topics/similarity/ (sim.ts, figs.ts). Voiced lines: script.ts.
import type { Canvas } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { drawWords } from '../../src/lesson/words';
import { type Fig, type Fit, type Frame, type Pt, FR_LEFT, FR_LESSON, FR_RIGHT, FR_WIDE, add, fitFig, galleryFrames, mul, rotP, sub } from '../../src/lesson/topics/geometry-foundations/geo';
import { drawFig, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { figOf, hourglass, nested } from '../../src/lesson/topics/similarity/sim';
import { MC } from '../../src/lesson/topics/similarity/common';
import { FAMILY_NAMES, GENERATORS, type GFItem } from '../../src/lesson/topics/similarity/items';
import { PLAN } from '../../src/lesson/topics/similarity/plan';
import { explain } from '../../src/lesson/topics/similarity/explain';
import { SCRIPT } from '../../src/lesson/topics/similarity/script';
import LINES from './similarity/voice/lines.json';

const SLUG = 'similarity';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const s = SCRIPT[id];
  if (!s) throw new Error(`no script line ${id}`);
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, s.html + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]!.html); }
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
const K = (key: string) => tr.k(key);
const steps = (pre: string) => progressOf<ProofStep>(s => tr.k(`${pre}pf.${s}`));
const pf = (pre: string, s: string, to = 1, d = 0.8, delay = 0) => tr.set(`${pre}pf.${s}`, to, d, delay);
const RIGHT_FR: Frame = { x: FR_RIGHT.x, y: FR_RIGHT.y, w: FR_RIGHT.w, h: FR_RIGHT.h };
const ease = (u: number) => { const x = clamp(u); return x * x * (3 - 2 * x); };

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: 'turn' | 'prove' | 'example', item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
  const bx = h('div', { class: 'opts' }), fbHost = h('div');
  let done = false;
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part, item, prompt, response: plainOf(o.t), expected: plainOf(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; after(); }
  })));
  return h('div', {}, bx, fbHost);
}
/** a copy of a triangle as a lavender (or lime) wash with an outline */
const copyFig = (T: Pt[], col: 'pick' | 'link'): Fig => ({ segs: [0, 1, 2].map(i => ({ id: 'c' + i, a: T[i]!, b: T[(i + 1) % 3]!, col })), angles: [], points: [], fills: [{ pts: T.slice(), col, alpha: 0.3 }] });

// ===================== the roof frame of parts 1, 2 and 4: AB = 10, AC = 12, BC = 12.5, AD = 4 (k = 10/4) =====================
const ROOF = nested(10, 12, 12.5, 0.4, 40);
const RA = ROOF.A!, RB = ROOF.B!, RC = ROOF.C!, RD = ROOF.D!, RE = ROOF.E!;
const roofFig = (labs: { seg: string; text: string; alt?: string }[], marks: { ang: string; n?: number }[] = []): Fig =>
  figOf({ A: RA, B: RB, C: RC, D: RD, E: RE }, ['AD', 'DB', 'AE', 'EC', 'DE', 'BC'], { labs, marks: [{ seg: 'DE', par: 1 }, { seg: 'BC', par: 1 }, ...marks], fills: ['ABC'] });
const Q_FIG = roofFig([{ seg: 'AD', text: '4 ft' }, { seg: 'DB', text: '6 ft' }, { seg: 'DE', text: '5 ft' }, { seg: 'BC', text: '?', alt: '12.5 ft' }]);
const E_FIG = roofFig([{ seg: 'AD', text: '4 ft' }, { seg: 'DB', text: '6 ft' }, { seg: 'DE', text: '5 ft' }, { seg: 'BC', text: '?', alt: '12.5 ft' }], [{ ang: 'DAE', n: 1 }, { ang: 'ADE', n: 2 }, { ang: 'ABC', n: 2 }]);
const E_FIT: Fit = fitFig(E_FIG, FR_LESSON);

// ===================== 1. The question =====================
const CARDS = [
  { name: '7.5 ft', t: '4 is to 6 as 5 is to BC', mc: MC.partWhole as string | undefined, cb: 'q.cb.part', right: false },
  { name: '11 ft', t: 'BC is DE plus the extra 6 ft', mc: MC.additive as string | undefined, cb: 'q.cb.add', right: false },
  { name: '12.5 ft', t: '4 is to 10 as 5 is to BC', mc: undefined as string | undefined, cb: 'q.cb.ok', right: true },
];
function partQuestion(): void {
  tr.reset('q.');
  const card = cardPainter(['A roof frame. The brace <b class="a">DE</b> is parallel to the beam <b class="a">BC</b>.', 'AD = 4 ft, DB = 6 ft, DE = 5 ft.', 'How long is the beam BC?'], box(RIGHT_FR.x + 40, 260, RIGHT_FR.x + RIGHT_FR.w - 20, 800), { size: 54 });
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => { sheet(c, FR_LESSON, K('q.sheet')); drawFig(c, Q_FIG, FR_LESSON, { k: K('q.fig') }); card.draw(c, K('q.card')); },
  });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); tr.set('q.card', 1, 0.8, 1.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'DE ∥ BC, AD = 4 ft, DB = 6 ft, DE = 5 ft. How long is BC?', response: `${c.name}: ${c.t}`, expected: '12.5 ft', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.name}<small>${cd.t}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'How long is the beam?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: AA, the dilation, the length =====================
const E_ROWS = [
  { st: '\\angle A \\cong \\angle A', rs: 'Reflexive Property of Congruence' },
  { st: '\\angle ADE \\cong \\angle ABC', rs: 'Corresponding Angles Theorem' },
  { st: '\\triangle ADE \\sim \\triangle ABC', rs: 'AA' },
  { st: '\\frac{AD}{AB} = \\frac{DE}{BC}', rs: 'Corresponding sides are proportional' },
  { st: '\\frac{4}{10} = \\frac{5}{BC},\\ BC = 12.5', rs: 'Solve the proportion' },
];
/** the small triangle ADE dilated from A by s (1 -> 2.5) */
const grown = (s: number): Pt[] => [RA, add(RA, mul(sub(RD, RA), s)), add(RA, mul(sub(RE, RA), s))];
function partExample(): void {
  tr.reset('e.');
  const P = ProofFrame({ given: ['\\overline{DE} \\parallel \\overline{BC},\\ AD = 4,\\ DB = 6,\\ DE = 5'], prove: 'BC = \\,?', rows: E_ROWS }, RIGHT_FR, th);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('e.sheet'));
      const gA = K('e.gA') * (1 - K('e.gAoff')), gD = K('e.gD') * (1 - K('e.gDoff')), gS = K('e.gS');
      drawFig(c, E_FIG, FR_LESSON, {
        k: K('e.fig'), marks: { DAE: K('e.mA'), ADE: K('e.mD'), ABC: K('e.mD') }, solved: { BC: K('e.solved') },
        glow: { DAE: gA, ADE: gD, ABC: gD, AD: gS, AB: gS, DB: 0, DE: gS, BC: gS },
        col: K('e.solved') > 0.5 ? { BC: 'link' } : K('e.mD') > 0.5 ? { ADE: 'second', ABC: 'second', DAE: 'first' } : {},
      }, E_FIT);
      const g = K('e.grow');
      if (K('e.copy') > 0) drawFig(c, copyFig(grown(1 + 1.5 * ease(g)), g >= 0.999 ? 'link' : 'pick'), FR_LESSON, { k: K('e.copy') * (1 - K('e.copyoff') * 0.7) }, E_FIT);
      if (K('e.kw') > 0) drawWords(c, 'k = 10/4', FR_LESSON.x + 40, FR_LESSON.y + FR_LESSON.h - 40, 'first', K('e.kw'), { size: 52 });
      P.draw(c, steps('e.'), { rings: [0, 1, 2, 3, 4].map(i => ({ i, col: (i === 4 ? 'link' : 'pick') as Paint, k: K(`e.ring${i}`) })) });
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2); pf('e.', 'frame', 1, 0.8, 0.5);
  let step = 0;
  const STEPS = [
    { t: 'Find two angle pairs', why: 'Only what is given or proved counts.', act: 'Find' },
    { t: 'Name the similarity', why: 'Matching vertices in matching places.', act: 'Name' },
    { t: 'Dilate the small triangle', why: 'Why two angles are enough.', act: 'Dilate' },
    { t: 'Pair whole with whole', why: 'One ratio for every side.', act: 'Solve' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const ringOnly = (...on: number[]) => { for (let i = 0; i < 5; i++) tr.set(`e.ring${i}`, on.includes(i) ? 1 : 0, 0.5); };
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.mA', 1, 0.6); tr.set('e.gA', 1, 0.6); await wait(0.7); if (!alive()) return; pf('e.', 's0', 1, 0.7); pf('e.', 'r0', 1, 0.6, 0.4); ringOnly(0); await wait(1.2); if (!alive()) return;
        tr.set('e.gAoff', 1, 0.4); tr.set('e.mD', 1, 0.6); tr.set('e.gD', 1, 0.6); await wait(0.7); if (!alive()) return; pf('e.', 's1', 1, 0.7); pf('e.', 'r1', 1, 0.6, 0.4); ringOnly(1); await wait(1.2); if (!alive()) return;
        tr.set('e.gDoff', 1, 0.4);
      } else if (i === 1) {
        pf('e.', 's2', 1, 0.8); pf('e.', 'r2', 1, 0.6, 0.5); ringOnly(2); await wait(1.6);
      } else if (i === 2) {
        ringOnly(); tr.set('e.copy', 1, 0.5); tr.set('e.kw', 1, 0.5, 0.3); await wait(0.8); if (!alive()) return;
        tr.set('e.grow', 1, 2.6); await wait(2.9); if (!alive()) return;
        tr.set('e.copyoff', 1, 0.6); await wait(0.4);
      } else {
        tr.set('e.gS', 1, 0.6); pf('e.', 's3', 1, 0.8); pf('e.', 'r3', 1, 0.6, 0.4); ringOnly(3); await wait(1.4); if (!alive()) return;
        pf('e.', 's4', 1, 0.9); pf('e.', 'r4', 1, 0.6, 0.5); ringOnly(4); tr.set('e.solved', 1, 0.9, 0.6); tr.set('e.gS', 0, 0.6, 0.8); await wait(1.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why does AD pair with AB = 10, and not with DB = 6?', [
      { t: 'AB is the side of the big triangle that matches AD; DB is only part of it', ok: true, id: 'e.why.ok' },
      { t: 'Either works: AD and DB are on the same line', ok: false, id: 'e.why.either', mc: MC.partWhole },
      { t: 'DB would be better: it is the part next to the beam', ok: false, id: 'e.why.next', mc: MC.partWhole },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Why the shapes match'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the hourglass =====================
const HG = hourglass(8, 6, 7, 1.5, 34, 0);
const HA = HG.A!, HB = HG.B!, HC = HG.C!, HD = HG.D!, HE = HG.E!;
const T_FIG: Fig = figOf({ A: HA, B: HB, C: HC, D: HD, E: HE }, ['AE', 'EC', 'BE', 'ED', 'AB', 'DC'], {
  labs: [{ seg: 'AE', text: '6' }, { seg: 'EC', text: '9' }, { seg: 'AB', text: '8' }, { seg: 'DC', text: '?', alt: '12' }],
  marks: [{ seg: 'AB', par: 1 }, { seg: 'DC', par: 1 }, { ang: 'AEB', n: 1 }, { ang: 'CED', n: 1 }, { ang: 'BAE', n: 2 }, { ang: 'DCE', n: 2 }],
  fills: ['ABE', 'CDE'],
});
const T_FIT: Fit = fitFig(T_FIG, FR_LESSON);
const T_ROWS = [
  { st: '\\triangle ABE \\sim \\triangle CDE', rs: 'AA: vertical angles at E, alternate interior angles' },
  { st: 'k = \\frac{EC}{AE} = \\frac{9}{6} = \\frac{3}{2}', rs: 'New over old' },
  { st: 'CD = \\tfrac{3}{2} \\cdot 8 = 12', rs: 'Multiply by k' },
];
/** the copy of △ABE: a half-turn about E (0-1), then a dilation from E by 1.5 (1-2) */
function hgMotion(u: number): Pt[] {
  const T0 = [HA, HB, HE];
  if (u <= 1) return T0.map(p => rotP(p, 180 * ease(u), HE));
  const s = 1 + 0.5 * ease(u - 1);
  return T0.map(p => mul(rotP(p, 180, HE), s));
}
function partTurn(): void {
  tr.reset('t.');
  const shown = [false, false, false];
  const make = () => ProofFrame({ given: ['\\overline{AB} \\parallel \\overline{CD},\\ AE = 6,\\ EC = 9,\\ AB = 8'], prove: 'CD = \\,?', rows: T_ROWS.map((r, i) => (shown[i] ? r : { st: '', rs: '' })), reserve: T_ROWS.map(r => r.st), reserveRs: T_ROWS.map(r => r.rs) }, RIGHT_FR, th);
  let P = make();
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('t.sheet'));
      drawFig(c, T_FIG, FR_LESSON, {
        k: K('t.fig'), marks: { AEB: K('t.arcs'), CED: K('t.arcs'), BAE: K('t.arcs'), DCE: K('t.arcs') }, solved: { DC: K('t.solved') },
        col: K('t.solved') > 0.5 ? { DC: 'link' } : {}, glow: { AE: K('t.gk') * (1 - K('t.gkoff')), EC: K('t.gk') * (1 - K('t.gkoff')) },
      }, T_FIT);
      const m = K('t.move');
      if (K('t.copy') > 0) drawFig(c, copyFig(hgMotion(m), m >= 1.999 ? 'link' : 'pick'), FR_LESSON, { k: K('t.copy') * (1 - 0.7 * K('t.copyoff')) }, T_FIT);
      P.draw(c, steps('t.'), {});
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2); pf('t.', 'frame', 1, 0.8, 0.5);
  const host = h('div'), bHost = h('div'), cHost = h('div'), nextHost = h('div');
  const show = (i: number) => { shown[i] = true; P = make(); pf('t.', `s${i}`, 1, 0.8); pf('t.', `r${i}`, 1, 0.6, 0.4); };
  host.append(ask('turn', 'turn.statement', 'AB ∥ CD; AC and BD cross at E. Which statement is justified?', [
    { t: '△ABE ~ △DCE, by AA', ok: false, id: 't.a.pos', mc: MC.byPosition },
    { t: '△ABE ~ △CDE, by AA', ok: true, id: 't.a.ok' },
    { t: 'Not justified: only the vertical angles are known', ok: false, id: 't.a.none', mc: MC.noCritNot },
  ], () => seq(async alive => {
    tr.set('t.arcs', 1, 0.7); show(0); await wait(0.9); if (!alive()) return;
    tr.set('t.copy', 1, 0.4); tr.set('t.move', 1, 1.6); await wait(1.8); if (!alive()) return;
    tr.set('t.move', 2, 1.6); await wait(1.8); if (!alive()) return;
    tr.set('t.copyoff', 1, 0.6); askK();
  })));
  function askK(): void {
    const fb = h('div');
    const inp = fracInput('', () => check());
    const chk = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'frac') return;
      const v = r.w + (r.d ? r.n / r.d : 0);
      const ok = Math.abs(v - 1.5) < 1e-9, flip = Math.abs(v - 2 / 3) < 1e-9, add3 = Math.abs(v - 3) < 1e-9;
      ctx.store.log({ part: 'turn', item: 'turn.k', prompt: 'Scale factor from △ABE to △CDE', response: `${r.w ? r.w + ' ' : ''}${r.n}/${r.d}`, expected: '3/2', correct: ok, mc: ok ? undefined : flip ? MC.inconsistent : add3 ? MC.additive : undefined });
      fb.replaceChildren(voicedFb(ok ? 't.b.ok' : flip ? 't.b.flip' : add3 ? 't.b.add' : 't.b.other', ok));
      if (ok) { done = true; chk.disabled = true; tr.set('t.gk', 1, 0.5); show(1); askCD(); }
    }
    bHost.replaceChildren(voiced('t.b', 'div', 'label'), inp.node, h('div', { class: 'row' }, chk), fb);
  }
  function askCD(): void {
    const fb = h('div');
    const inp = numInput('', () => check());
    const chk = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) return;
      const ok = Math.abs(r.v - 12) < 1e-9, flip = Math.abs(r.v - 16 / 3) < 0.01, add3 = Math.abs(r.v - 11) < 1e-9;
      ctx.store.log({ part: 'turn', item: 'turn.cd', prompt: 'CD = ?', response: String(r.v), expected: '12', correct: ok, mc: ok ? undefined : flip ? MC.inconsistent : add3 ? MC.additive : undefined });
      fb.replaceChildren(voicedFb(ok ? 't.c.ok' : flip ? 't.c.flip' : add3 ? 't.c.add' : 't.c.other', ok));
      if (ok) {
        done = true; chk.disabled = true; tr.set('t.gkoff', 1, 0.4); show(2); tr.set('t.solved', 1, 0.9, 0.4);
        seq(async alive => { await wait(1.4); if (!alive()) return; nextHost.replaceChildren(voiced('t.done', 'div', 'label'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); ctx.panel.scrollTop = ctx.panel.scrollHeight; });
      }
    }
    cHost.replaceChildren(voiced('t.c', 'div', 'label'), inp.node, h('div', { class: 'row' }, chk), fb);
  }
  setPanel(h('h2', {}, 'Your turn: the hourglass'), voiced('t.intro'), host, bHost, cHost, nextHost);
}

// ===================== 4. Prove it: the side-splitter theorem =====================
const P_FIG: Fig = figOf({ A: RA, B: RB, C: RC, D: RD, E: RE }, ['AD', 'DB', 'AE', 'EC', 'DE', 'BC'], {
  labs: [{ seg: 'AD', text: '4' }, { seg: 'DB', text: '6' }, { seg: 'AE', text: '4.8' }, { seg: 'EC', text: '7.2' }],
  marks: [{ seg: 'DE', par: 1 }, { seg: 'BC', par: 1 }, { ang: 'DAE', n: 1 }, { ang: 'ADE', n: 2 }, { ang: 'ABC', n: 2 }], fills: ['ABC'],
});
const P_FIT: Fit = fitFig(P_FIG, FR_LESSON);
const P_ROWS = [
  { st: '\\triangle ADE \\sim \\triangle ABC', rs: 'AA' },
  { st: 'AB = k \\cdot AD,\\ AC = k \\cdot AE', rs: 'One scale factor k' },
  { st: 'DB = (k - 1) \\cdot AD', rs: 'Whole minus part' },
  { st: 'EC = (k - 1) \\cdot AE', rs: 'Whole minus part' },
  { st: '\\frac{AD}{DB} = \\frac{AE}{EC}', rs: 'Divide: each is 1/(k − 1)' },
];
function partProve(): void {
  tr.reset('p.');
  const shown = [false, false, false, false, false];
  const make = () => ProofFrame({ given: ['\\overline{DE} \\parallel \\overline{BC}'], prove: '\\frac{AD}{DB} = \\frac{AE}{EC}', rows: P_ROWS.map((r, i) => (shown[i] ? r : { st: '', rs: '' })), reserve: P_ROWS.map(r => r.st), reserveRs: P_ROWS.map(r => r.rs) }, RIGHT_FR, th);
  let P = make();
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('p.sheet'));
      const cut = K('p.cut');
      drawFig(c, P_FIG, FR_LESSON, {
        k: K('p.fig'), marks: { DAE: K('p.arcs'), ADE: K('p.arcs'), ABC: K('p.arcs') },
        col: cut > 0.5 ? { DB: 'second', EC: 'second', AD: 'first', AE: 'first' } : {}, glow: { DB: cut, EC: cut },
      }, P_FIT);
      const g = K('p.grow');
      if (K('p.copy') > 0) drawFig(c, copyFig(grown(1 + 1.5 * ease(g)), g >= 0.999 ? 'link' : 'pick'), FR_LESSON, { k: K('p.copy') * (1 - 0.75 * K('p.copyoff')) }, P_FIT);
      if (K('p.check') > 0) drawWords(c, '4/6 = 4.8/7.2 = 2/3', FR_LESSON.x + 40, FR_LESSON.y + FR_LESSON.h - 40, 'link', K('p.check'), { size: 50 });
      P.draw(c, steps('p.'), {});
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2); pf('p.', 'frame', 1, 0.8, 0.5);
  const CHIPS = [
    { t: 'DB and EC are corresponding sides of the two triangles.', fits: -1, mc: MC.partWhole as string | undefined, id: 'p.x-part' },
    { t: 'Corresponding sides of similar triangles are all in one ratio k.', fits: 1 },
    { t: 'AA: ∠A is shared, and ∠ADE ≅ ∠ABC because DE ∥ BC.', fits: 0 },
    { t: 'D and E look like they cut the sides at the same place.', fits: -1, mc: MC.appearance as string | undefined, id: 'p.x-look' },
    { t: 'DB = AB − AD and EC = AC − AE: whole minus part.', fits: 2 },
  ];
  const CLAIMS = ['p.claim1', 'p.claim2', 'p.claim3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), lastHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]!.html}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  const showRow = (i: number) => { shown[i] = true; P = make(); pf('p.', `s${i}`, 1, 0.8); pf('p.', `r${i}`, 1, 0.6, 0.4); };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(SCRIPT[CLAIMS[filled]!]!.html), response: ch.t, correct: ch.fits === filled, mc: ch.fits === filled ? undefined : ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.arcs', 1, 0.7); showRow(0); await wait(1.0); }
        if (n === 2) { showRow(1); tr.set('p.copy', 1, 0.4); tr.set('p.grow', 1, 2.4, 0.3); await wait(2.9); if (!alive()) return; tr.set('p.copyoff', 1, 0.5); }
        if (n === 3) {
          tr.set('p.cut', 1, 0.8); showRow(2); showRow(3); await wait(1.4); if (!alive()) return; showRow(4); await wait(1.0); if (!alive()) return;
          tr.set('p.check', 1, 0.7);
          chipBox.remove(); fbHost.replaceChildren(voicedFb('p.c3', true));
          setPanel(h('h2', {}, 'Prove it'), chain, fbHost, lastHost); askLast();
        }
      });
      return;
    }
    fbHost.replaceChildren(voicedFb(ch.id ?? 'p.x-other', false));
  }
  function askLast(): void {
    lastHost.replaceChildren(voiced('p.last', 'div', 'label'), ask('prove', 'prove.last', 'Does the side-splitter also give AD/DB = DE/BC?', [
      { t: 'Yes: a parallel cuts every side in the same ratio', ok: false, id: 'p.last.no', mc: MC.partWhole },
      { t: 'No: DE and BC are not cut; they pair with whole sides, DE/BC = AD/AB', ok: true, id: 'p.last.ok' },
    ], () => seq(async alive => {
      await wait(4.5); if (!alive()) return;
      lastHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.ok', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  const yes = btn('Always', () => judge(true)), no = btn('Only for these numbers', () => judge(false));
  const proofHost = h('div');
  function judge(always: boolean): void {
    yes.disabled = no.disabled = true;
    (always ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'A segment parallel to one side cuts the other two in the same ratio: always, or only for these numbers?', response: always ? 'always' : 'only these numbers', expected: 'always', correct: always });
    proofHost.replaceChildren(voiced(always ? 'p.build' : 'p.build-test'), chain, chipBox, fbHost, lastHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as GFItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
const fr2box = (f: Frame): Box => box(f.x, f.y, f.x + f.w, f.y + f.h);
function showItem(item: GFItem): Solve {
  tr.reset('x.');
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const set = (ids: string[] | undefined, key: string): Record<string, number> => Object.fromEntries((ids ?? []).map(id => [id, K(key)]));
  if (p.gallery) {
    const g = p.gallery, frs = galleryFrames(g.figs.length);
    draws.push(c => g.figs.forEach((f, i) => {
      const fr = frs[i]!;
      sheet(c, fr, K('x.fig'), 30 + i);
      if (rv.cell === i) { const b = fr2box(fr), k = K('x.cell'); if (k > 0) { c.g.save(); c.g.globalAlpha *= clamp(k); c.g.strokeStyle = '#C3AEF6'; c.g.lineWidth = 6; c.g.beginPath(); c.g.roundRect(b.x0 - 14, b.y0 - 14, b.w + 28, b.h + 100, 22); c.g.stroke(); c.g.restore(); } }
      drawFig(c, f, fr, { k: K('x.fig') });
      drawWords(c, g.caps[i] ?? '', fr.x + fr.w / 2, fr.y + fr.h + 52, rv.cell === i && K('x.cell') > 0.5 ? 'pick' : 'dim', K('x.fig'), { size: 44, align: 'center' });
    }));
    keysOn.push('x.fig');
    return finish(draws, keysOn, async () => { tr.set('x.cell', 1, 0.6); });
  }
  const besideFig = !!p.fig && !!(p.proof || p.card || p.cards);
  if (p.fig) {
    const fr = besideFig ? FR_LEFT : FR_WIDE, f = p.fig;
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawFig(c, f, fr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? { ...rv.col, ...Object.fromEntries((rv.solved ?? []).map(id => [id, 'link' as const])) } : undefined });
    });
    keysOn.push('x.fig');
  }
  if (p.proof) {
    const pr = p.proof;
    // a solve fills only cells that wait as '?' (an answer is never drawn before the student answers)
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const fr: Frame = p.fig ? { x: RIGHT_FR.x, y: 60, w: RIGHT_FR.w, h: 960 } : { x: 260, y: 60, w: 1400, h: 960 };
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, fr, th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const PP = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, PP, {
        ask: pr.ask, rings: [...(pr.ring !== undefined ? [{ i: pr.ring, col: 'pick' as Paint, k: K('x.fig') }] : []), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: [...(pr.strike ?? []).map(i => ({ i, k: K('x.fig') })), ...(rv.strike ?? []).map(i => ({ i, k: K('x.strike') }))],
      }));
    } else console.warn('proof frame failed', made.error);
  }
  if (p.card) {
    const b = p.fig ? box(RIGHT_FR.x, 160, RIGHT_FR.x + RIGHT_FR.w, 920) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.fig ? 46 : 54, align: p.fig ? 'left' : 'center' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
    keysOn.push('x.card');
  }
  if (p.cards) {
    const area = p.fig ? box(RIGHT_FR.x, 80, RIGHT_FR.x + RIGHT_FR.w, 1000) : p.cards.length === 1 ? box(260, 200, 1660, 880) : box(80, 160, 1840, 920);
    const C = cardsPainter(p.cards, area);
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  return finish(draws, keysOn, async alive => {
    tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4, 0.6);
    tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.5); tr.set('x.strike', 1, 0.6, 0.6); tr.set('x.lines', 1, 0.9, 0.3);
    void alive;
  });
}
function finish(draws: ((c: Canvas) => void)[], keys: string[], solve: (alive: () => boolean) => Promise<void>): Solve {
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keys.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return { solve };
}

void runLesson({
  slug: SLUG,
  warm: ['\\angle A \\cong \\angle A \\ \\triangle ADE \\sim \\triangle ABC \\ \\frac{AD}{AB} = \\frac{DE}{BC} \\ \\overline{DE} \\parallel \\overline{BC} \\ k = \\tfrac{3}{2} \\cdot 8 = 12 \\ BC = \\,? \\ (k - 1) \\ \\text{the lengths in the figure, Given, Prove}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
