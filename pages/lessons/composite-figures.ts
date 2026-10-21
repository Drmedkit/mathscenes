// composite-figures.ts: a topic of the lesson line (grade 7, 7.G.B.4 / 7.G.B.6), on the shared lesson runtime.
//   1 The question   a patio (12 ft x 8 ft rectangle + a half circle on an 8 ft end) gets edging all around: 3 cards
//                    (the seam walked too, the right 32 + 4π, the curve left out) + how sure
//   2 Worked example Split -> Area -> Walk the edge -> Exact, then round, on the painted patio: parts and the dashed
//                    seam, the parts ring as their area terms write on, the edge is walked piece by piece (the seam
//                    never), 32 + 4π ≈ 44.6 ft; one "why?" (the seam)
//   3 Your turn      a track-shaped flower bed, faded from the end: split and area are given; the kid picks the edge
//                    pieces, writes the perimeter exactly (28 + 8π) and rounds it (53.1); callback to the commit
//   4 Prove it       Riley: "cutting a piece out always makes the perimeter smaller"; a because-chain on a table top
//                    with a half-circle notch: 4 ft of edge gone, 2π ft of curve added, the perimeter goes UP
//   5 Practice       all 19 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/composite-figures/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BX, bigLine, bump, newEpoch, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { PlanFigure, type FigBlock, type FigFocus, type FigParams } from '../../src/lesson/topics/composite-figures/PlanFigure';
import { LESSON_FIGS, MF } from '../../src/lesson/topics/composite-figures/lessonFigs';
import { FAMILY_NAMES, GENS, MC, type FigPicture } from '../../src/lesson/topics/composite-figures/items';
import { PLAN } from '../../src/lesson/topics/composite-figures/plan';
import { SCRIPT } from '../../src/lesson/topics/composite-figures/script';

const SLUG = 'composite-figures';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
/** mark the picked option button right / wrong */
const markPick = (bx: HTMLElement, k: number, ok: boolean) => bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(ok ? 'right' : 'nope'); });

const YT = BOARD.y0 + 90;
/** colour tags on the board: a = the surface / area, b = the edge / perimeter, s = the answer, w = wrong */
const T = { a: { col: 'first' as const }, c: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const }, p: { col: 'pick' as const } };

// ---------- scenes ----------
interface FigScene { pre: string; model: FigBlock | null; lines: Line[]; leads: Lead[]; focus?: () => FigFocus; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setFig(S: FigScene): void {
  const P = progressOf(s => tr.k(S.pre + s));
  setScene({
    table: 1080,
    model: c => { S.model?.draw(c, P as never, S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox,
    extra: c => { S.extra?.(c); },
  });
}
const figure = (p: FigParams) => PlanFigure(p, MF, th);
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
/** the figure arrives: the surface, then its labels */
function showFig(pre: string, delay = 0): void { tr.set(pre + 'region', 1, 1.0, delay); tr.set(pre + 'dims', 1, 0.7, delay + 0.8); }

const CARDS = [
  { big: '40 + 4π ft', small: '≈ 52.6 ft', id: MC.seam, cb: 't.cb-seam' },
  { big: '32 + 4π ft', small: '≈ 44.6 ft', id: '', cb: 't.cb-right' },
  { big: '32 ft', small: 'exactly', id: MC.omitsCurve, cb: 't.cb-curve' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = figure(LESSON_FIGS.patio);
  const Q = line('q.l1', '\\text{edging} = \\,?', YT, 88);
  setFig({ pre: 'q.', model: m, lines: [Q], leads: [], focus: () => ({ dimAlpha: { r: 0 } }) });
  showFig('q.');
  tr.set('q.l1', 1, 0.9, 2.0);

  const cards = h('div', { class: 'cards cf', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A patio is a 12 ft by 8 ft rectangle with a half circle on one 8 ft end. How much edging goes around it?', response: p.big, expected: '32 + 4π ft', correct: !p.id, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.big}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = say_('q.intro');
  setPanel(h('h2', {}, 'Edging for a patio'), intro, html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the patio, Split -> Area -> Walk the edge -> Exact, then round =====
function partExample(): void {
  tr.reset('e.');
  const m = figure(LESSON_FIGS.patio);
  const Q = line('e.q', '\\text{edging} = \\,?', YT, 88);
  const L0 = line('e.L0', '\\cssId{p}{r} = 8 \\div 2 = 4', YT, 80, T);
  const L1 = line('e.L1', 'A = \\cssId{a}{12 \\cdot 8} + \\cssId{c}{\\tfrac12 \\pi \\cdot 4^2}', YT + 140, 76, T);
  const L1b = line('e.L1b', '= \\cssId{a}{96 + 8\\pi}\\ \\text{ft}^2', YT + 250, 72, T);
  const L2 = line('e.L2', 'P = 12 + \\cssId{b}{4\\pi} + 12 + 8', YT + 400, 76, T);
  const L3 = line('e.L3', '= 32 + 4\\pi\\ \\text{ft}', YT + 510, 72, T);
  const L4 = line('e.L4', '\\approx \\cssId{s}{44.6\\ \\text{ft}}', YT + 640, 88, T);
  const leads: Lead[] = [
    { key: 'e.ldC', from: () => partOf(L1, 'c'), to: () => m.where.part('semi'), col: 'first' },
    { key: 'e.ldB', from: () => partOf(L2, 'b'), to: () => m.where.piece('arc'), col: 'second' },
  ];
  let ring: string | null = null;
  setFig({ pre: 'e.', model: m, lines: [Q, L0, L1, L1b, L2, L3, L4], leads, focus: () => ({ part: ring, partK: tr.k('e.ring'), dimAlpha: { r: tr.k('e.dr') }, shade: tr.k('e.shade'), dim: 'r', dimK: tr.k('e.pr') }) });
  // the board starts where part 1 left it
  jump('e.', ['region', 'dims', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Split it into parts', why: 'Where do the parts meet?', act: 'Split' },
    { t: 'Add the areas', why: 'Each part once.', act: 'Area' },
    { t: 'Walk the edge once', why: 'Never along a seam.', act: 'Walk' },
    { t: 'Exact, then round', why: 'Round once, at the end.', act: 'Finish' },
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
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.q', 0, 0.5);
        tr.set('e.parts', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.dr', 1, 0.6); await wait(0.5); if (!alive()) return;
        tr.set('e.L0', 1, 1.0); void bump('e.pr', alive); await wait(2.0);
      } else if (i === 1) {
        tr.set('e.L0:dim', 1, 0.6);
        ring = 'rect'; tr.set('e.ring', 1, 0.4);
        tr.set('e.L1', 1, 1.6); await wait(0.9); if (!alive()) return;
        tr.set('e.ring', 0, 0.3); await wait(0.35); if (!alive()) return;
        ring = 'semi'; tr.set('e.ring', 1, 0.4); tr.set('e.ldC', 1, 0.9, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.ring', 0, 0.5);
        tr.set('e.shade', 1, 0.5); tr.set('e.L1b', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.shade', 0, 0.8);
      } else if (i === 2) {
        tr.set('e.L1:dim', 1, 0.6); tr.set('e.L1b:dim', 1, 0.6); tr.set('e.ldC', 0, 0.5);
        tr.set('e.trace', 1, 4.0); tr.set('e.L2', 1, 3.0, 0.6); await wait(2.6); if (!alive()) return;
        tr.set('e.ldB', 1, 0.9); await wait(1.8);
      } else {
        tr.set('e.ldB', 0, 0.5); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.L3', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.L4', 1, 1.0); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'It is inside the patio: walking around the edge, you never step on it.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'It should count: every line in the drawing is part of the perimeter.', ok: false, mc: MC.seam, id: 'e.w-seam' },
      { t: 'The curved edge is already 8 ft long, so the 8 ft is counted there.', ok: false, mc: MC.aroundAsAcross, id: 'e.w-across' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      markPick(bx, k, o.ok);
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the 8 ft seam not part of the edging?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 6500);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: the flower bed (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = figure(LESSON_FIGS.bed);
  const L0 = line('t.L0', '\\cssId{p}{r} = 8 \\div 2 = 4', YT, 80, T);
  const L1 = line('t.L1', 'A = \\cssId{a}{14 \\cdot 8} + \\cssId{c}{\\pi \\cdot 4^2}', YT + 140, 76, T);
  const L1b = line('t.L1b', '= \\cssId{a}{112 + 16\\pi}\\ \\text{ft}^2', YT + 250, 72, T);
  const L2 = line('t.L2', 'P = 14 + \\cssId{b}{4\\pi} + 14 + 4\\pi', YT + 400, 76, T);
  const L3 = line('t.L3', '= 28 + 8\\pi\\ \\text{ft}', YT + 510, 72, T);
  const L4 = line('t.L4', '\\approx \\cssId{s}{53.1\\ \\text{ft}}', YT + 640, 88, T);
  const leads: Lead[] = [{ key: 't.ldB', from: () => partOf(L2, 'b'), to: () => m.where.piece('arcR'), col: 'second' }];
  let piece: string | null = null;
  setFig({
    pre: 't.', model: m, lines: [L0, L1, L1b, L2, L3, L4], leads,
    focus: () => ({ dimAlpha: { r: tr.k('t.dr') }, shade: tr.k('t.shade'), seamWrong: tr.k('t.seamW'), piece, pieceK: tr.k('t.pk') }),
  });
  showFig('t.');

  let step = 0;
  const STEPS = [
    { t: 'Split it into parts', why: 'Done for you.' },
    { t: 'Add the areas', why: 'Done for you.' },
    { t: 'Walk the edge once', why: 'Your step.' },
    { t: 'Exact, then round', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const said = h('div');
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A flower bed'), say_('t.intro'), plan, said, work);

  seq(async alive => {
    await wait(6.5); if (!alive()) return;
    tr.set('t.parts', 1, 1.2); await wait(1.2); if (!alive()) return;
    tr.set('t.dr', 1, 0.6); tr.set('t.L0', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
    said.replaceChildren(say_('t.s1')); await wait(4.6); if (!alive()) return;
    step = 1; drawPlan(); tr.set('t.L0:dim', 1, 0.5);
    tr.set('t.L1', 1, 1.4); await wait(1.5); if (!alive()) return;
    tr.set('t.shade', 1, 0.5); tr.set('t.L1b', 1, 1.0); said.replaceChildren(say_('t.s2')); await wait(1.4); if (!alive()) return;
    tr.set('t.shade', 0, 0.8); await wait(6.5); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.L1:dim', 1, 0.5); tr.set('t.L1b:dim', 1, 0.5);
    askWalk();
  });

  function askWalk(): void {
    const fbHost = h('div');
    const opts = [
      { t: '14 + 8 + 14 + 8 + the two curves', ok: false, mc: MC.seam as string | undefined, id: 't.w-seam' },
      { t: '14 + 14 + the two curves', ok: true, mc: undefined, id: 't.w-ok' },
      { t: '14 + 14', ok: false, mc: MC.omitsCurve, id: 't.w-curve' },
    ];
    const bx = h('div', { class: 'opts sums' });
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      markPick(bx, k, o.ok);
      ctx.store.log({ part: 'turn', item: 'turn.walk', prompt: 'Which pieces does the edging of the 14 ft by 8 ft track-shaped bed run along?', response: o.t, expected: '14 + 14 + the two curves', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) {
        // the picture shows the slip: the seams flash red, or the curves light up
        seq(async alive => {
          if (o.mc === MC.seam) { tr.set('t.seamW', 1, 0.3); await wait(1.6); if (!alive()) return; tr.set('t.seamW', 0, 0.6); }
          else { piece = 'arcR'; tr.set('t.pk', 1, 0.3); await wait(0.9); if (!alive()) return; tr.set('t.pk', 0, 0.3); await wait(0.35); piece = 'arcL'; tr.set('t.pk', 1, 0.3); await wait(0.9); tr.set('t.pk', 0, 0.4); }
        });
        return;
      }
      done = true;
      seq(async alive => {
        tr.set('t.trace', 1, 4.2); tr.set('t.L2', 1, 3.0, 0.6); await wait(2.8); if (!alive()) return;
        tr.set('t.ldB', 1, 0.9); await wait(2.6); if (!alive()) return;
        step = 3; drawPlan(); askExact();
      });
    })));
    work.replaceChildren(say_('t.walk'), bx, fbHost);
  }
  function askExact(): void {
    const fbHost = h('div');
    const inp = pairInput('P =', '+', () => check(), 'π ft');
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.x === 28 && r.y === 8;
      const why = right ? 't.e-ok' : r.x === 28 && r.y === 4 ? 't.e-half' : r.x === 28 && r.y === 16 ? 't.e-area' : r.x === 0 && r.y === 36 ? 't.e-unlike' : r.x === 44 && r.y === 8 ? 't.e-seam' : 't.e-no';
      const mc = { 't.e-half': MC.fullCircle, 't.e-area': MC.areaPerim, 't.e-unlike': MC.unlike, 't.e-seam': MC.seam }[why as 't.e-half'];
      ctx.store.log({ part: 'turn', item: 'turn.exact', prompt: 'The perimeter of the 14 ft by 8 ft track-shaped bed, exactly: ? + ?π ft', response: r, expected: { x: 28, y: 8 }, correct: right, mc: why === 't.e-half' ? undefined : mc });
      fbHost.replaceChildren(fb(right, why));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.ldB', 0, 0.5); tr.set('t.L2:dim', 1, 0.5);
        tr.set('t.L3', 1, 1.0); await wait(3.6); if (!alive()) return;
        askRound();
      });
    }
    work.replaceChildren(say_('t.exact'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askRound(): void {
    const fbHost = h('div');
    const inp = numInput('ft', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = Math.abs(r.v - 53.1) < 1e-6;
      const why = right ? 't.r-ok' : Math.abs(r.v - 113) < 0.06 ? 't.r-unlike' : Math.abs(r.v - 52.8) < 0.06 || Math.abs(r.v - 52) < 0.06 ? 't.r-early' : 't.r-no';
      const mc = why === 't.r-unlike' ? MC.unlike : why === 't.r-early' ? MC.earlyRound : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.round', prompt: '28 + 8π ft to the nearest tenth', response: r, expected: 53.1, correct: right, mc });
      fbHost.replaceChildren(fb(right, why));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.L4', 1, 1.0); await wait(3.4); if (!alive()) return;
        fbHost.append(callback());
      });
    }
    work.replaceChildren(say_('t.round'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 1]!;
    const id = commit().pick === null ? 't.cb-right' : p.cb;
    setTimeout(() => sayOnly(id), 3000);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley's "a cut always shrinks the perimeter" =====
function partProve(): void {
  tr.reset('p.');
  const m = figure(LESSON_FIGS.table);
  const J = line('p.J', '\\text{Riley: }\\ \\cssId{w}{\\text{cut} \\Rightarrow P \\downarrow}', YT, 80);
  const C1 = line('p.C1', 'P = 32 \\cssId{p}{\\, - \\, 4}', YT + 150, 72, T);
  const C2 = line('p.C2', 'P = 32 - 4 + \\cssId{b}{2\\pi}', YT + 270, 72, T);
  const C3 = line('p.C3', '= \\cssId{s}{28 + 2\\pi \\approx 34.3 > 32}', YT + 390, 72, T);
  const C4 = line('p.C4', 'A = \\cssId{a}{60 - 2\\pi < 60}', YT + 520, 72, T);
  const leads: Lead[] = [];
  setFig({
    pre: 'p.', model: m, lines: [J, C1, C2, C3, C4], leads,
    focus: () => ({ removedK: tr.k('p.rm'), part: 'semi', partK: tr.k('p.ring'), piece: 'arc', pieceK: tr.k('p.pk') }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showFig('p.'); tr.set('p.J', 1, 1.0, 1.8); tr.set('p.ring', 1, 0.6, 2.4);

  const CHIPS = [
    { t: 'The notch’s diameter, 2 + 2 = 4 ft, is no longer on the edge.', fits: 0 },
    { t: 'The new edge is half a circle of diameter 4: half of 4π.', fits: 1 },
    { t: 'One shape where the rule fails is enough to break “always”.', fits: 2 },
    { t: 'Cutting something out can only take edge away.', fits: -1, mc: MC.cutShrinks, id: 'p.x-shrink' },
    { t: 'Less area always means less perimeter.', fits: -1, mc: MC.together, id: 'p.x-together' },
    { t: 'The curve is 4 ft, as long as the gap it covers.', fits: -1, mc: MC.aroundAsAcross, id: 'p.x-across' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [4, 0, 3, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3 || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      if (n < 3) sayOnly(CLAIMS[n]!);
      seq(async alive => {
        if (n === 1) {
          tr.set('p.ring', 0, 0.4);
          tr.set('p.rm', 1, 0.5); await wait(0.6); if (!alive()) return;
          tr.set('p.C1', 1, 1.0); await wait(1.2); if (!alive()) return;
          tr.set('p.cut', 1, 1.6); tr.set('p.rm', 0, 1.2, 0.6); await wait(1.8);
        }
        if (n === 2) {
          tr.set('p.C1:dim', 1, 0.5);
          tr.set('p.pk', 1, 0.5); tr.set('p.C2', 1, 1.0, 0.3); await wait(1.3); if (!alive()) return;
          await wait(1.6); if (!alive()) return;
          tr.set('p.pk', 0, 0.6);
        }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.trace', 1, 3.2); tr.set('p.C3', 1, 1.0, 0.4); await wait(3.4); if (!alive()) return;
          tr.set('p.C4', 1, 1.0); await wait(1.4); if (!alive()) return;
          tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: cutting a piece out of a shape always makes its perimeter smaller. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.cutShrinks : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(say_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 3600);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), verdict, proofHost);
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
/** a bare-notation item: the expression big on a wide slate */
const BARE = box(150, 250, 1770, 830);
/** draw a practice item on its figure; after a miss, the worked solution plays on the figure and the board */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as FigPicture | undefined;
  const mk = pic?.kind === 'fig' ? tryBlock(() => figure({ fig: pic.fig, unit: pic.unit, dims: pic.dims, seam: pic.seam })) : null;
  if (!mk || !mk.ok || !pic) {
    if (mk && !mk.ok) console.error('composite-figures: picture failed', mk.error);
    setFig({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board, BARE, 130)], leads: [], boardBox: BARE });
    tr.set('x.T', 1, 0.8, 0.1);
    return {};
  }
  const m = mk.value;
  const TL = line('x.T', item.board, YT, 84);
  const heroes = pic.hero.map((src, i) => line(`x.H${i}`, src, YT + 150 + i * 115, 72, T));
  let cand: string[] | null | undefined = pic.cand;
  const removed = pic.fig.parts.find(p => p.sign < 0)?.id ?? null;
  setFig({
    pre: 'x.', model: m, lines: [TL, ...heroes], leads: [],
    focus: () => ({ candidate: cand, shade: pic.shade ? 1 - tr.k('x.unshade') : tr.k('x.shade'), part: removed, partK: pic.before ? 1 - tr.k('x.cut') : 0 }),
  });
  tr.set('x.region', 1, 0.8); tr.set('x.dims', 1, 0.6, 0.5);
  if (!pic.before) tr.jump('x.cut', 1);
  tr.set('x.T', 1, 0.8, 0.4);
  return {
    solve: async alive => {
      tr.set('x.T:dim', 1, 0.5);
      if (cand) { cand = null; }
      if (pic.shade) tr.set('x.unshade', 1, 0.4);
      for (const st of pic.solve) {
        if (!alive()) return;
        if (st === 'parts' || st === 'seam') { tr.set('x.parts', 1, 0.9); await wait(1.0); }
        else if (st === 'cut') { tr.set('x.cut', 1, 1.2); await wait(1.3); }
        else if (st === 'trace') { tr.set('x.trace', 1, 2.4); await wait(2.5); }
        else if (st === 'holes') { tr.set('x.holes', 1, 1.2); await wait(1.3); }
        else if (st === 'shade') { tr.set('x.shade', 1, 0.5); await wait(0.9); tr.set('x.shade', 0.45, 0.6); }
      }
      if (!alive()) return;
      heroes.forEach((_, i) => tr.set(`x.H${i}`, 1, 0.9, 0.2 + i * 0.7));
    },
  };
}

/** for headless checks (tools/walk-composite-figures.mjs --gallery): draw any item, optionally with its worked solution */
(window as unknown as { __cfShow: (it: Item, solve: boolean) => void }).__cfShow = (it, solve) => {
  newEpoch();
  const v = showItem(it);
  if (solve && v.solve) seq(v.solve);
};

void runLesson({
  slug: SLUG,
  warm: ['\\text{edging} = \\,?', 'A = 12 \\cdot 8 + \\tfrac12 \\pi \\cdot 4^2 \\approx \\div', '\\text{Riley: }\\ \\Rightarrow \\downarrow'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
