// triangle-congruence.ts: "Triangle congruence" (Geometry, lesson 4) on the shared runtime.
//   1 The question   Nia copies AB = 7 in, BC = 5 in and m∠A = 40° (an angle NOT between the sides): must her triangle
//                    be congruent? (yes, three parts = SSA accepted; yes unless flipped = flipped copy; not necessarily)
//   2 Worked example SAS from the marks to the proof: read the marks (three Given rows) -> the angle is included ->
//                    the rigid motion (slide B onto E, turn, reflect, C lands on F) -> △ABC ≅ △DEF by SAS in order;
//                    why must the angle be between the sides?
//   3 Your turn      the bowtie (E the midpoint of AC and BD): build the proof with the course's proof frame (Parsons
//                    ordering with two decoys, then a reason menu: vertical angles, SAS, not SSA / ASA), then CPCTC
//   4 Prove it       back to Nia: a because-chain while the 5-in side swings about B and crosses the 40° ray twice:
//                    two triangles with the same SSA parts; then the right-angle case (HL): one point on the ray.
//                    Callback to part 1.
//   5 Practice       all 31 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only from geometry-foundations: geo.ts + GeoFig.ts (exact figures), ProofFrame.ts + proofPanel.ts (the
// proof frame), Card.ts (statement cards). Voiced lines: src/lesson/topics/triangle-congruence/script.ts.
import type { Canvas } from '../../src/core/draw';
import { dot, strokePts } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { wash } from '../../src/lesson/wash';
import { drawWords } from '../../src/lesson/words';
import { type Fig, type Fit, type Frame, type Pt, FR_LEFT, FR_LESSON, FR_RIGHT, FR_WIDE, add, angOf, at, fitFig, galleryFrames, mul, rotP, sub, toScreen } from '../../src/lesson/topics/geometry-foundations/geo';
import { type Look, drawFig, label, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { type Tri, beside, buildFig, moveT, pairFig } from '../../src/lesson/topics/triangle-congruence/tri';
import { MC, RS } from '../../src/lesson/topics/triangle-congruence/triProofs';
import { FAMILY_NAMES, GENERATORS, type GFItem } from '../../src/lesson/topics/triangle-congruence/items';
import { PLAN } from '../../src/lesson/topics/triangle-congruence/plan';
import { explain } from '../../src/lesson/topics/triangle-congruence/explain';
import { SCRIPT } from '../../src/lesson/topics/triangle-congruence/script';
import LINES from './triangle-congruence/voice/lines.json';

const SLUG = 'triangle-congruence';
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
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');

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

// ===================== the SSA data of parts 1 and 4: AB = 7, BC = 5, ∠A = 40° =====================
const IN = 62;   // model units per inch
const SSA_T = [7 * Math.cos((40 * Math.PI) / 180) - Math.sqrt(25 - 49 * Math.sin((40 * Math.PI) / 180) ** 2), 7 * Math.cos((40 * Math.PI) / 180) + Math.sqrt(25 - 49 * Math.sin((40 * Math.PI) / 180) ** 2)];
const S_A: Pt = [0, 0], S_B: Pt = [7 * IN, 0];
const S_C1 = at(S_A, 40, SSA_T[0]! * IN), S_C2 = at(S_A, 40, SSA_T[1]! * IN);

// ===================== 1. The question =====================
const CARDS = [
  { name: 'Yes, always', t: 'three pairs of parts match, so the triangle is fixed', mc: MC.ssa as string | undefined, cb: 'q.cb.yes', right: false },
  { name: 'Yes, unless she flips it', t: 'a flipped copy would not be congruent', mc: MC.flipped as string | undefined, cb: 'q.cb.flip', right: false },
  { name: 'Not necessarily', t: 'these three parts might fit more than one triangle', mc: undefined as string | undefined, cb: 'q.cb.not', right: true },
];
const Q_FIG: Fig = buildFig({
  pts: { A: S_A, B: S_B, C: S_C2 }, segs: ['AB', 'BC', 'AC'],
  marks: [{ seg: 'AB', text: '7 in', col: 'first', lone: true }, { seg: 'BC', text: '5 in', col: 'first', lone: true }, { ang: 'BAC', text: '40°', col: 'first', lone: true, r: 110 }],
  fills: [{ pts: 'ABC' }],
});
function partQuestion(): void {
  tr.reset('q.');
  const card = cardPainter([`Nia builds a triangle with ${'<b class="a">AB = 7 in</b>'}, ${'<b class="a">BC = 5 in</b>'} and ${'<b class="a">m∠A = 40°</b>'}.`, 'Must it be congruent to △ABC?'], box(RIGHT_FR.x + 40, 300, RIGHT_FR.x + RIGHT_FR.w - 20, 760), { size: 54 });
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => { sheet(c, FR_LESSON, K('q.sheet')); drawFig(c, Q_FIG, FR_LESSON, { k: K('q.fig') }); card.draw(c, K('q.card')); },
  });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); tr.set('q.card', 1, 0.8, 1.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Nia builds a triangle with AB = 7 in, BC = 5 in and m∠A = 40°. Must it be congruent to △ABC?', response: `${c.name}: ${c.t}`, expected: 'Not necessarily', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'Is it the same triangle?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: SAS =====================
const E_T1: Tri = [at([0, 0], 62, 250), [0, 0], [340, 0]];   // A, B, C: ∠B = 62°, AB = 250, BC = 340
const E_T2: Tri = beside(E_T1, moveT(E_T1, { rot: -18, flip: true, off: [0, 0] }), 'col', 200);
const E_FIG: Fig = pairFig(E_T1, E_T2, 'ABC', 'DEF', [{ k: 's', i: 2, n: 1 }, { k: 'a', i: 1, n: 1 }, { k: 's', i: 0, n: 2 }]);
const E_FIT: Fit = fitFig(E_FIG, FR_LESSON);
/** the copy of △ABC on its way: fold it over the horizontal line through B (0-1), slide B onto E (1-2), turn about E
 *  until ray BA lies along ray ED (2-3); A lands on D and C on F */
function motion(u: number): Tri {
  const [, B] = E_T1, [D, E] = E_T2;
  const fold = (p: Pt, k: number): Pt => [p[0], p[1] + (2 * B[1] - 2 * p[1]) * k];
  if (u <= 1) return E_T1.map(p => fold(p, ease(u))) as Tri;
  const F1 = E_T1.map(p => fold(p, 1)) as Tri, d = sub(E, B);
  if (u <= 2) return F1.map(p => add(p, mul(d, ease(u - 1)))) as Tri;
  const S1 = F1.map(p => add(p, d)) as Tri;
  let th0 = angOf(sub(D, E)) - angOf(sub(S1[0], E));
  th0 = ((th0 + 540) % 360) - 180;
  return S1.map(p => rotP(p, th0 * ease(u - 2), E)) as Tri;
}
const copyFig = (T: Tri, col: 'pick' | 'link'): Fig => ({ segs: [0, 1, 2].map(i => ({ id: 'c' + i, a: T[i]!, b: T[(i + 1) % 3]!, col })), angles: [], points: [], fills: [{ pts: T.slice(), col, alpha: 0.32 }] });
const E_ROWS = [
  { st: '\\overline{AB} \\cong \\overline{DE}', rs: RS.given },
  { st: '\\angle B \\cong \\angle E', rs: RS.given },
  { st: '\\overline{BC} \\cong \\overline{EF}', rs: RS.given },
  { st: '\\triangle ABC \\cong \\triangle DEF', rs: RS.SAS },
];
function partExample(): void {
  tr.reset('e.');
  const P = ProofFrame({ given: ['\\text{the marks in the figure}'], prove: '\\triangle ABC \\cong \\triangle DEF', rows: E_ROWS }, RIGHT_FR, th);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('e.sheet'));
      const g1 = K('e.g1') * (1 - K('e.g1off')), g2 = K('e.g2') * (1 - K('e.g2off')), g3 = K('e.g3') * (1 - K('e.g3off')), inc = K('e.inc') * (1 - K('e.incoff'));
      const look: Look = {
        k: K('e.fig'),
        glow: { AB: g1, DE: g1, ABC: g2 + inc, DEF: g2, BC: g3, EF: g3 },
        col: { ...(inc > 0.5 ? { AB: 'first' as const, BC: 'first' as const, ABC: 'link' as const } : {}), ...(K('e.done') > 0.5 ? { DE: 'link' as const, EF: 'link' as const, DF: 'link' as const } : {}) },
      };
      drawFig(c, E_FIG, FR_LESSON, look, E_FIT);
      const mv = K('e.move');
      if (mv > 0 && K('e.copy') > 0) drawFig(c, copyFig(motion(mv), K('e.done') > 0.5 ? 'link' : 'pick'), FR_LESSON, { k: K('e.copy') }, E_FIT);
      P.draw(c, steps('e.'), { rings: [0, 1, 2, 3].map(i => ({ i, col: (i === 3 ? 'link' : 'pick') as Paint, k: K(`e.ring${i}`) })) });
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2); pf('e.', 'frame', 1, 0.8, 0.5);
  let step = 0;
  const STEPS = [
    { t: 'Read the marks', why: 'Only marks and givens count.', act: 'Read' },
    { t: 'Where is the angle?', why: 'Between the two sides, or not?', act: 'Look' },
    { t: 'Carry one onto the other', why: 'Why these three pairs are enough.', act: 'Move' },
    { t: 'Write it in order', why: 'Matching vertices in matching places.', act: 'Write' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const ringOnly = (...on: number[]) => { for (let i = 0; i < 4; i++) tr.set(`e.ring${i}`, on.includes(i) ? 1 : 0, 0.5); };
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), html('span', 'why', s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.g1', 1, 0.6); await wait(0.7); if (!alive()) return; pf('e.', 's0', 1, 0.7); pf('e.', 'r0', 1, 0.6, 0.4); ringOnly(0); await wait(1.0); if (!alive()) return;
        tr.set('e.g1off', 1, 0.4); tr.set('e.g2', 1, 0.6); await wait(0.7); if (!alive()) return; pf('e.', 's1', 1, 0.7); pf('e.', 'r1', 1, 0.6, 0.4); ringOnly(1); await wait(1.0); if (!alive()) return;
        tr.set('e.g2off', 1, 0.4); tr.set('e.g3', 1, 0.6); await wait(0.7); if (!alive()) return; pf('e.', 's2', 1, 0.7); pf('e.', 'r2', 1, 0.6, 0.4); ringOnly(2); await wait(1.0); if (!alive()) return;
        tr.set('e.g3off', 1, 0.4);
      } else if (i === 1) {
        ringOnly(0, 1, 2); tr.set('e.inc', 1, 0.8); await wait(2.2);
      } else if (i === 2) {
        ringOnly(); tr.set('e.incoff', 1, 0.5); tr.set('e.copy', 1, 0.5); tr.set('e.move', 1, 1.6, 0.3); await wait(2.2); if (!alive()) return;
        tr.set('e.move', 2, 1.8); await wait(2.4); if (!alive()) return;
        tr.set('e.move', 3, 1.6); await wait(2.0); if (!alive()) return;
        tr.set('e.done', 1, 0.5); await wait(0.6);
      } else {
        pf('e.', 's3', 1, 0.9); pf('e.', 'r3', 1, 0.7, 0.6); ringOnly(3); await wait(1.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why must the angle sit between the two sides?', [
      { t: 'The angle between the sides points the second side along the right ray; an angle elsewhere does not', ok: true, id: 'e.why.ok' },
      { t: 'It does not matter: SAS is just a name, any order of the letters would do', ok: false, id: 'e.why.order', mc: MC.order },
      { t: 'Any angle works, as long as three pairs of parts match', ok: false, id: 'e.why.any', mc: MC.ssa },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'Why SAS is enough'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the bowtie, with the proof frame =====================
const T_FIG: Fig = (() => {
  const E: Pt = [0, 0], A = at(E, 150, 270), B = at(E, 214, 215);
  return buildFig({
    pts: { A, B, C: mul(A, -1), D: mul(B, -1), E }, segs: ['AE', 'EC', 'BE', 'ED', 'AB', 'DC'],
    marks: [{ seg: 'AE', n: 1 }, { seg: 'EC', n: 1 }, { seg: 'BE', n: 2 }, { seg: 'ED', n: 2 }, { ang: 'AEB', n: 1, r: 64 }, { ang: 'CED', n: 1, r: 64 }],
    fills: [{ pts: 'AEB' }, { pts: 'CED' }],
  });
})();
// a given is cited straight from the Given header (the lesson's one rule for proofs)
const T_LINES = [
  { st: `${ov('AE')} ≅ ${ov('CE')}`, tex: '\\overline{AE} \\cong \\overline{CE}', rs: RS.defMid, uses: [] as number[] },
  { st: `${ov('BE')} ≅ ${ov('DE')}`, tex: '\\overline{BE} \\cong \\overline{DE}', rs: RS.defMid, uses: [] as number[] },
  { st: '∠AEB ≅ ∠CED', tex: '\\angle AEB \\cong \\angle CED', rs: RS.vert, uses: [] as number[] },
  { st: '△AEB ≅ △CED', tex: '\\triangle AEB \\cong \\triangle CED', rs: RS.SAS, uses: [1, 2, 3] },
];
const T_DECOYS = [
  { st: '△AEB ≅ △DEC', why: 'the vertices are not in matching order: A matches C (both ends of the first ticks), not D.', mc: MC.vertexOrder },
  { st: '∠A ≅ ∠C', why: 'nothing marks or gives that yet; it only follows once the triangles are proved congruent.', mc: MC.beforeEst },
];
const T_MENU = [
  { t: RS.given }, { t: RS.defMid }, { t: RS.vert }, { t: RS.SAS },
  { t: RS.altInt, mc: MC.wrongPair, why: 'These angles share the vertex E and sit opposite each other: they are vertical angles, and no parallel lines are given.' },
  { t: 'SSA', mc: MC.ssa, why: 'SSA is not a criterion, and here the angle is between the two sides.' },
  { t: RS.ASA, mc: MC.order, why: 'The lines above give two sides and the angle between them.' },
  { t: RS.refl, why: 'Nothing in this line is shared by the two triangles.' },
];
function partTurn(): void {
  tr.reset('t.');
  const placed: number[] = [], reasons: string[] = [];
  const RESERVE = T_LINES.map(l => l.tex);
  const make = () => ProofFrame({ given: ['E\\text{ is the midpoint of }\\overline{AC}\\text{ and }\\overline{BD}'], prove: '\\triangle AEB \\cong \\triangle CED', rows: T_LINES.map((_, k) => ({ st: placed[k] ? T_LINES[placed[k]! - 1]!.tex : '', rs: reasons[k] ?? '' })), reserve: RESERVE, reserveRs: T_MENU.map(m => m.t) }, RIGHT_FR, th);
  let P = make();
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_LESSON, K('t.sheet'));
      const gl = (k: string) => K(`t.${k}`) * (1 - K(`t.${k}off`));
      drawFig(c, T_FIG, FR_LESSON, {
        k: K('t.fig'), marks: { AEB: K('t.vert'), CED: K('t.vert') },
        glow: { AE: gl('g2'), EC: gl('g2'), BE: gl('g3'), ED: gl('g3'), AEB: gl('g4'), CED: gl('g4'), AB: K('t.cp'), DC: K('t.cp') },
        col: K('t.cp') > 0.5 ? { AB: 'link', DC: 'link' } : {},
      });
      P.draw(c, steps('t.'), {});
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2); pf('t.', 'frame', 1, 0.8, 0.5);
  const host = h('div'), fbHost = h('div'), nextHost = h('div');
  const panel = proofPanel({
    lines: T_LINES.map(l => ({ st: l.st, rs: l.rs, uses: l.uses })),
    decoys: T_DECOYS, menu: T_MENU, order: [3, 5, 0, 2, 4, 1],
    say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
    onPlace(line, pos) {
      placed[pos] = line; P = make(); pf('t.', `s${pos}`, 1, 0.8);
      for (const k of ['g2', 'g3', 'g4']) if (K(`t.${k}`) > 0) tr.set(`t.${k}off`, 1, 0.4);
      if (line === 1) tr.set('t.g2', 1, 0.5); else if (line === 2) tr.set('t.g3', 1, 0.5); else if (line === 3) { tr.set('t.vert', 1, 0.6); tr.set('t.g4', 1, 0.5); }
      ctx.store.log({ part: 'turn', item: `turn.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: T_LINES[line - 1]!.st, correct: true });
      if (placed.length === T_LINES.length) fbHost.replaceChildren(voicedFb('t.order-done', true));
    },
    onReason(pos, _line, reason) {
      reasons[pos] = reason; P = make(); pf('t.', `r${pos}`, 1, 0.7);
      ctx.store.log({ part: 'turn', item: `turn.reason${pos + 1}`, prompt: `Reason for line ${pos + 1}`, response: reason, correct: true });
      fbHost.replaceChildren();
    },
    onWrong(e) {
      ctx.store.log({ part: 'turn', item: `turn.${e.phase}`, prompt: e.prompt, response: e.response, correct: false, mc: e.mc });
      void ctx.say('t.wrong');
    },
    onDone() {
      seq(async alive => {
        await wait(0.8); if (!alive()) return;
        nextHost.replaceChildren(voiced('t.next', 'div', 'label'), ask('turn', 'turn.cpctc', 'The triangles are congruent. What else do you now know?', [
          { t: `${ov('AB')} ≅ ${ov('CD')}`, ok: true, id: 't.next.ok' },
          { t: `${ov('AB')} ≅ ${ov('DE')}`, ok: false, id: 't.next.corr', mc: MC.ignoreCorr },
          { t: 'Nothing more: only the marked parts are congruent', ok: false, id: 't.next.none', mc: MC.onlyMarked },
        ], () => { tr.set('t.cp', 1, 0.7); nextHost.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); }));
      });
    },
  });
  host.replaceChildren(panel.node, fbHost, nextHost);
  setPanel(h('h2', {}, 'Your turn: the bowtie'), voiced('t.intro'), host);
}

// ===================== 4. Prove it: SSA swings, HL does not =====================
const P_RAY = at(S_A, 40, 11 * IN);
const P_FIG: Fig = buildFig({
  pts: { A: S_A, B: S_B, x: P_RAY }, segs: ['AB', 'Ax'], bare: ['x'],
  marks: [{ seg: 'AB', text: '7 in', col: 'first', lone: true }, { ang: 'BAx', text: '40°', col: 'first', lone: true, r: 120 }],
  segStyle: { Ax: { kind: 'ray' } }, dirs: { A: 200, B: 300 },
});
const P_FIT = fitFig({ ...P_FIG, segs: [...P_FIG.segs, { a: [S_B[0] - 5 * IN, -5 * IN], b: [S_B[0] + 5 * IN, 5 * IN] }] }, FR_WIDE);
const H_A: Pt = [0, 0], H_B: Pt = [4 * IN * 1.4, 0], H_C: Pt = [0, 3 * IN * 1.4], H_C2: Pt = [0, -3 * IN * 1.4];
const H_FIG: Fig = buildFig({
  pts: { A: H_A, B: H_B, x: [0, 4.6 * IN * 1.4], y: [0, -4.6 * IN * 1.4] }, segs: ['AB', 'Ax', 'Ay'], bare: ['x', 'y'],
  marks: [{ seg: 'AB', text: '4 in', col: 'first', lone: true }, { ang: 'BAx', box: true, col: 'first' }],
  segStyle: { Ax: { kind: 'ray' }, Ay: { dash: true, col: 'faint' } }, dirs: { A: 225, B: 330 },
});
const H_FIT = fitFig({ ...H_FIG, segs: [...H_FIG.segs, { a: [H_B[0] - 5 * IN * 1.4, -5 * IN * 1.4], b: [H_B[0] + 5 * IN * 1.4, 5 * IN * 1.4] }] }, FR_WIDE);
/** the swing: a circle about B drawn up to angle sweep k (0..1), from the radius pointing down */
function swingArc(c: Canvas, F: Fit, Bc: Pt, r: number, k: number, col: Paint): void {
  if (k <= 0) return;
  const n = 120, P: Pt[] = [];
  for (let i = 0; i <= n * clamp(k); i++) P.push(toScreen(F, at(Bc, -90 + (360 * i) / n, r)));
  if (P.length > 1) strokePts(c, P, { col, lw: 5 });
}
function triWash(c: Canvas, F: Fit, T: Pt[], col: Paint, a: number, seed: number): void { if (a > 0) wash(c, T.map(p => toScreen(F, p)), col, { alpha: a, ink: null, rough: 1.1, seed, shade: 0.06 }); }
function seg(c: Canvas, F: Fit, a: Pt, b: Pt, col: Paint, k: number, dash = false): void { if (k > 0) strokePts(c, [toScreen(F, a), toScreen(F, b)], { col, lw: 5, alpha: k, dash: dash ? [16, 14] : undefined, cap: dash ? 'butt' : undefined }); }
function pointL(c: Canvas, F: Fit, p: Pt, name: string, dir: number, k: number, col: Paint = 'ink'): void {
  if (k <= 0) return;
  const P = toScreen(F, p); dot(c, P[0], P[1], 9, col, k);
  label(c, name, [P[0] + 52 * Math.cos((dir * Math.PI) / 180), P[1] - 52 * Math.sin((dir * Math.PI) / 180)], 50, col === 'ink' ? 'ink' : col, k);
}
function partProve(): void {
  tr.reset('p.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      const hl = K('p.hl');
      sheet(c, FR_WIDE, K('p.sheet'));
      if (hl < 1) {
        const a = 1 - hl;
        const F = P_FIT;
        triWash(c, F, [S_A, S_B, S_C1], 'first', 0.34 * K('p.tri') * a, 4);
        triWash(c, F, [S_A, S_B, S_C2], 'second', 0.26 * K('p.tri') * a, 5);
        drawFig(c, P_FIG, FR_WIDE, { k: K('p.fig') * a }, F);
        // the 5-in side: a radius, then the swing
        const rr = at(S_B, -90, 5 * IN);
        seg(c, F, S_B, rr, 'second', K('p.rad') * (1 - K('p.radoff')) * a, true);
        if (K('p.rad') > 0) label(c, '5 in', add(toScreen(F, add(S_B, [0, -2.5 * IN])), [78, 0]), 60, 'second', K('p.rad') * (1 - K('p.radoff')) * a);
        swingArc(c, F, S_B, 5 * IN, K('p.arc') * a, 'second');
        seg(c, F, S_B, S_C1, 'first', K('p.tri') * a); seg(c, F, S_B, S_C2, 'second', K('p.tri') * a);
        pointL(c, F, S_C1, 'C₁', 130, K('p.pts') * a, 'link'); pointL(c, F, S_C2, 'C₂', 110, K('p.pts') * a, 'link');
        if (K('p.ac') > 0) {
          const m1 = toScreen(F, at(S_A, 40, (SSA_T[0]! * IN) / 2)), m2 = toScreen(F, at(S_A, 40, ((SSA_T[0]! + SSA_T[1]!) * IN) / 2));
          drawWords(c, 'AC₁ ≈ 3.2 in', m1[0] - 300, m1[1] - 40, 'first', K('p.ac') * a, { size: 46 });
          drawWords(c, 'AC₂ ≈ 7.5 in', m2[0] - 320, m2[1] - 40, 'second', K('p.ac') * a, { size: 46 });
        }
      }
      if (hl > 0) {
        const F = H_FIT;
        triWash(c, F, [H_A, H_B, H_C], 'link', 0.34 * K('p.htri') * hl, 6);
        drawFig(c, H_FIG, FR_WIDE, { k: hl }, F);
        swingArc(c, F, H_B, 5 * IN * 1.4, K('p.harc') * hl, 'second');
        seg(c, F, H_B, H_C, 'link', K('p.hpts') * hl);
        seg(c, F, H_B, H_C2, 'faint', K('p.hpts') * hl, true);
        if (K('p.hpts') > 0) label(c, '5 in', add(toScreen(F, [H_B[0] / 2, H_C[1] / 2]), [40, -36]), 60, 'second', K('p.hpts') * hl);
        pointL(c, F, H_C, 'C', 150, K('p.hpts') * hl, 'link'); pointL(c, F, H_C2, 'C′', 200, K('p.hpts') * hl, 'wrong');
        if (K('p.hpts') > 0) drawWords(c, 'off the ray', toScreen(F, H_C2)[0] - 330, toScreen(F, H_C2)[1] + 70, 'wrong', K('p.hpts') * hl, { size: 46 });
      }
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2);
  const CHIPS = [
    { t: 'The two triangles face different ways, so they cannot be congruent.', fits: -1, mc: MC.flipped as string | undefined, id: 'p.x-flip' },
    { t: 'The angle at A fixes the ray, and BC = 5 in fixes how far C is from B.', fits: 0 },
    { t: '△ABC₁ and △ABC₂ have the same three parts, but AC₁ ≠ AC₂: no rigid motion carries one onto the other.', fits: 2 },
    { t: 'Nia’s own drawing matched △ABC, so SSA works.', fits: -1, mc: MC.examples as string | undefined, id: 'p.x-ex' },
    { t: 'The circle crosses the ray twice: the ray passes closer than 5 in to B, and A is 7 in from B.', fits: 1 },
  ];
  const CLAIMS = ['p.claim1', 'p.claim2', 'p.claim3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), hlHost = h('div');
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
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(SCRIPT[CLAIMS[filled]!]!.html), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.rad', 1, 0.7); await wait(1.0); }
        if (n === 2) { tr.set('p.radoff', 1, 0.4); tr.set('p.arc', 1, 2.6); await wait(2.6); if (!alive()) return; tr.set('p.pts', 1, 0.6); await wait(0.8); }
        if (n === 3) {
          tr.set('p.tri', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('p.ac', 1, 0.7); await wait(1.6); if (!alive()) return;
          chipBox.remove(); fbHost.replaceChildren();
          // the chain is the proof: keep it, drop the question above it so the HL step and the callback fit
          setPanel(h('h2', {}, 'Prove it'), chain, hlHost); askHL();
        }
      });
      return;
    }
    fbHost.replaceChildren(voicedFb(ch.id ?? 'p.x-other', false));
  }
  function askHL(): void {
    hlHost.replaceChildren(voiced('p.hl', 'div', 'label'), ask('prove', 'prove.hl', 'AB = 4 in, BC = 5 in, ∠A = 90°: how many triangles?', [
      { t: 'Two: the circle meets the line twice', ok: false, id: 'p.hl.two', mc: MC.ssa },
      { t: 'One: the second point is off the ray', ok: true, id: 'p.hl.ok' },
      { t: 'None: SSA never fixes a triangle', ok: false, id: 'p.hl.none', mc: MC.validSSA },
    ], () => seq(async alive => {
      tr.set('p.hl', 1, 0.9); tr.set('p.harc', 1, 2.4, 0.9); await wait(3.4); if (!alive()) return;
      tr.set('p.hpts', 1, 0.6); tr.set('p.htri', 1, 0.8, 0.4); await wait(1.4); if (!alive()) return;
      hlHost.append(voicedFb('p.done', true)); await wait(5.5); if (!alive()) return;
      hlHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.not', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  const yes = btn('Always', () => judge(true)), no = btn('Not always', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Two sides and a non-included angle (SSA): does it always fix the triangle?', response: right ? 'always' : 'not always', expected: 'not always', correct: !right, mc: right ? MC.ssa : undefined });
    proofHost.replaceChildren(voiced(right ? 'p.build-test' : 'p.build'), chain, chipBox, fbHost, hlHost);
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
      drawFig(c, f, fr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? rv.col : undefined });
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
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, {
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
    tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4);
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
  warm: ['\\overline{AB} \\cong \\overline{DE} \\ \\angle B \\cong \\angle E \\ \\triangle ABC \\cong \\triangle DEF \\ \\triangle AEB \\cong \\triangle CED \\ \\overline{AE} \\cong \\overline{CE} \\ \\angle AEB \\ \\text{Given Prove the marks in the figure is the midpoint of and}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
