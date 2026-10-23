// cross-sections.ts: a topic of the lesson line (grade 7, 7.G.A.3), on the shared lesson runtime.
//   1 The question   a block of cheese cut straight down, parallel to its end: 3 cards (the face it copies, the
//                    right rectangle, the piece cut off) + how sure
//   2 Worked example Place -> Trace -> Lift -> Name on the glass block: the plane, the face-by-face trace (one side per
//                    face crossed), the cut-off piece slides away and the section flies flat onto the board; one "why?"
//   3 Your turn      a pyramid paperweight, faded from the end: place, trace and lift are given; the kid names the
//                    halfway slice (it shrinks), then stands the plane up: triangle through the apex, trapezoid off it,
//                    and its bottom side
//   4 Prove it       Jordan: "a cube can be cut into an octagon"; a because-chain from reason chips (one side per face
//                    crossed, 6 faces), the picture traces the hexagon face by face
//   5 Practice       all 6 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/cross-sections/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, BX, bump, newEpoch, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { Slicer, type SlicerBlock, type SlicerFocus, type SlicerParams, type Dim } from '../../src/lesson/topics/cross-sections/Slicer';
import { planeAxis, planeThrough, type SolidSpec } from '../../src/lesson/topics/cross-sections/sliceMaths';
import { FAMILY_NAMES, GENS, MC, type SlicePicture } from '../../src/lesson/topics/cross-sections/items';
import { PLAN } from '../../src/lesson/topics/cross-sections/plan';
import { SCRIPT } from '../../src/lesson/topics/cross-sections/script';
import { explain } from '../../src/lesson/topics/cross-sections/explain';

const SLUG = 'cross-sections';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

const YT = BOARD.y0 + 90;
const T = { s: { col: 'link' as const }, p: { col: 'second' as const }, f: { col: 'pick' as const }, n: { col: 'pick' as const }, a: { col: 'first' as const } };
/** the true-shape sketch sits in the middle of the board */
const FLAT = box(BX + 30, YT + 330, BOARD.x1 - 30, BOARD.y1 - 150);

// ---------- scenes ----------
interface SliceScene { pre: string; model: SlicerBlock | null; lines: Line[]; leads: Lead[]; focus?: () => SlicerFocus; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setSlice(S: SliceScene): void {
  const P = progressOf(s => tr.k(S.pre + s));
  setScene({
    table: 1080,
    model: c => { S.model?.draw(c, P as never, S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox,
    extra: c => { S.model?.drawFlat(c, P as never, S.focus?.()); S.extra?.(c); },
  });
}
/** the model's frame: wider than the shared one, the solid needs the room (leaders still reach the board) */
const MF = frame(40, 80, 1110, 920);
const slicer = (p: SlicerParams) => Slicer(p, MF, th);
const jump = (pre: string, steps: string[]) => { for (const s of steps) tr.jump(pre + s, 1); };
function showSolid(pre: string, delay = 0, plane = true): void {
  tr.set(pre + 'solid', 1, 1.0, delay); tr.set(pre + 'dims', 1, 0.7, delay + 0.7);
  if (plane) tr.set(pre + 'plane', 1, 1.2, delay + 1.4);
}
/** a dimension label pulses while its symbol writes on */
const dimPulse = (pre: string): Pick<SlicerFocus, 'dim' | 'dimK'> => {
  for (const d of ['l', 'w', 'h'] as Dim[]) { const k = tr.k(pre + 'p' + d); if (k > 0) return { dim: d, dimK: k }; }
  return {};
};

const CHEESE: SolidSpec = { kind: 'box', l: 6, w: 4, h: 3 };
const CHEESE_P: SlicerParams = { solid: CHEESE, unit: 'in', planes: [planeAxis(0, 4)], dims: ['l', 'w', 'h'], open: true, flat: FLAT };
const PYR: SolidSpec = { kind: 'pyramid', l: 6, w: 4, h: 4 };
const CUBE: SolidSpec = { kind: 'box', l: 4, w: 4, h: 4 };

const CARDS = [
  { big: '6 in × 4 in', small: 'a rectangle', id: MC.copiesBase, cb: 't.cb-base' },
  { big: '4 in × 3 in', small: 'a rectangle', id: '', cb: 't.cb-right' },
  { big: '2 in × 4 in × 3 in', small: 'the piece cut off', id: MC.piece, cb: 't.cb-piece' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = slicer(CHEESE_P);
  const Q = line('q.l1', `${'\\text{section}'} = \\,?`, YT, 88);
  setSlice({ pre: 'q.', model: m, lines: [Q], leads: [] });
  showSolid('q.');
  tr.set('q.l1', 1, 0.9, 2.4);

  const cards = h('div', { class: 'cards cs', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A 6 in x 4 in x 3 in block of cheese is cut straight down, parallel to its end: what is the cross-section?', response: `${p.big} (${p.small})`, expected: '4 in × 3 in', correct: !p.id, mc: p.id || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'A slice of cheese'), intro, html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the cheese, Place -> Trace -> Lift -> Name =====
function partExample(): void {
  tr.reset('e.');
  const m = slicer(CHEESE_P);
  const Q = line('e.q', '\\text{section} = \\,?', YT, 88);
  const H = line('e.hero', '\\cssId{s}{\\text{rectangle}}', YT, 92, T);
  const L1 = line('e.L1', '\\cssId{p}{\\text{plane}} \\parallel \\cssId{f}{\\text{end face}}', YT + 150, 72, T);
  const L2 = line('e.L2', '\\cssId{n}{4\\ \\text{faces}} \\to \\cssId{s}{4\\ \\text{sides}}', YT + 270, 72, T);
  const L4 = line('e.L4', '\\cssId{s}{4\\text{ in} \\times 3\\text{ in}}', BOARD.y1 - 70, 80, T);
  const leads: Lead[] = [{ key: 'e.ldS', from: () => partOf(H, 's'), to: () => m.where.sectionTip(0), col: 'link' }];
  setSlice({ pre: 'e.', model: m, lines: [Q, H, L1, L2, L4], leads, focus: () => ({ face: 'right', faceK: tr.k('e.fk'), ...dimPulse('e.') }) });
  // the board starts where part 1 left it
  jump('e.', ['solid', 'dims', 'plane', 'q']);

  let step = 0;
  const STEPS = [
    { t: 'Place the plane', why: 'Which face is it parallel to?', act: 'Place' },
    { t: 'Trace it face by face', why: 'One side for every face it crosses.', act: 'Trace' },
    { t: 'Lift it out', why: 'A flat region: no thickness.', act: 'Lift' },
    { t: 'Name it and measure', why: 'Each side runs along an edge.', act: 'Name' },
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
        tr.jump('e.plane', 0); tr.set('e.plane', 1, 1.3); await wait(1.2); if (!alive()) return;
        tr.set('e.fk', 1, 0.6); await wait(0.5); if (!alive()) return;
        tr.set('e.L1', 1, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('e.fk', 0, 0.8);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.trace', 1, 3.6); await wait(3.7); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(1.0);
      } else if (i === 2) {
        tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.fill', 1, 0.8); await wait(0.7); if (!alive()) return;
        tr.set('e.open', 1, 1.6); await wait(1.9); if (!alive()) return;
        tr.set('e.flat', 1, 1.6); await wait(1.7);
      } else {
        tr.set('e.q', 0, 0.5);
        tr.set('e.hero', 1, 1.0, 0.3); tr.set('e.ldS', 1, 0.9, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('e.sides', 1, 0.7); await wait(0.5); if (!alive()) return;
        tr.set('e.L4', 1, 1.0); void bump('e.pw', alive); await wait(1.0); if (!alive()) return;
        void bump('e.ph', alive); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The cut is parallel to the 4 in × 3 in end, so its sides run along those edges.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Every cross-section is the same as the bottom face.', ok: false, mc: MC.copiesBase, id: 'e.w-base' },
      { t: 'It is the 2 in piece the knife cut off.', ok: false, mc: MC.piece, id: 'e.w-piece' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the section 4 in x 3 in and not 6 in x 4 in?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 5200);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: the pyramid paperweight (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const level = planeAxis(2, 2), stand = planeAxis(0, 3);
  const mA = slicer({ solid: PYR, unit: 'in', planes: [level], dims: ['l', 'w'], open: true, flat: FLAT, fitExtra: [stand] });
  const mB = slicer({ solid: PYR, unit: 'in', planes: [stand], dims: ['l', 'w'], flat: FLAT, view: mA.view });
  const Q = line('t.q', '\\text{section} = \\,?', YT, 88);
  const H = line('t.hero', '\\cssId{s}{\\text{rectangle}}', YT, 92, T);
  const L1 = line('t.L1', '\\cssId{p}{\\text{plane}} \\parallel \\cssId{f}{\\text{base}}', YT + 150, 72, T);
  const L2 = line('t.L2', '\\cssId{n}{4\\ \\text{faces}} \\to \\cssId{s}{4\\ \\text{sides}}', YT + 270, 72, T);
  const L4 = line('t.L4', '\\cssId{s}{3\\text{ in} \\times 2\\text{ in}}', BOARD.y1 - 70, 80, T);
  // phase B: the plane stands up
  const B1 = line('u.B1', '\\cssId{p}{\\text{plane}} \\perp \\cssId{f}{\\text{base}}', YT + 150, 72, T);
  const B2 = line('u.B2', '\\text{through the apex}', YT + 270, 66);
  const B2b = line('u.B2b', '\\text{misses the apex}', YT + 270, 66);
  const HB = line('u.heroB', '\\cssId{s}{\\text{triangle}}', YT, 92, T);
  const HC = line('u.heroC', '\\cssId{s}{\\text{trapezoid}}', YT, 92, T);
  const B4 = line('u.B4', '\\text{bottom } \\cssId{s}{4\\text{ in}}', BOARD.y1 - 70, 80, T);
  let phase: 'A' | 'B' = 'A';
  const sceneA = () => setSlice({
    pre: 't.', model: mA, lines: [Q, H, L1, L2, L4], leads: [{ key: 't.ldS', from: () => partOf(H, 's'), to: () => mA.where.sectionTip(0, tr.k('t.shift')), col: 'link' }],
    focus: () => ({ face: 'base', faceK: tr.k('t.fk'), shift: tr.k('t.shift'), ...dimPulse('t.') }),
  });
  const sceneB = () => setSlice({
    pre: 'u.', model: mB, lines: [B1, B2, B2b, HB, HC, B4], leads: [{ key: 'u.ldS', from: () => partOf(tr.k('u.heroC') > 0.5 ? HC : HB, 's'), to: () => mB.where.sectionTip(0, tr.k('u.shift')), col: 'link' }],
    focus: () => ({ face: 'base', faceK: tr.k('u.fk'), shift: tr.k('u.shift'), ...dimPulse('u.') }),
  });
  tr.reset('u.');
  sceneA();
  showSolid('t.', 0, false); tr.set('t.q', 1, 0.8, 1.4);

  let step = 0;
  const STEPS = [
    { t: 'Place the plane', why: 'Done for you.' },
    { t: 'Trace it face by face', why: 'Done for you.' },
    { t: 'Lift it out', why: 'Done for you.' },
    { t: 'Name it and measure', why: 'Your step.' },
    { t: 'Stand the plane up', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const said = h('div');
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A pyramid paperweight'), say_('t.intro'), plan, said, work);

  seq(async alive => {
    await wait(6.0); if (!alive()) return;
    tr.set('t.plane', 1, 1.3); await wait(1.1); if (!alive()) return;
    tr.set('t.fk', 1, 0.5); tr.set('t.L1', 1, 1.0); await wait(1.4); if (!alive()) return;
    said.replaceChildren(say_('t.s1')); await wait(3.0); if (!alive()) return;
    tr.set('t.fk', 0, 0.6);
    step = 1; drawPlan(); tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.trace', 1, 3.2); await wait(3.3); if (!alive()) return;
    tr.set('t.L2', 1, 0.9); said.replaceChildren(say_('t.s2')); await wait(3.4); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.L2:dim', 1, 0.5);
    tr.set('t.fill', 1, 0.7); tr.set('t.open', 1, 1.6, 0.4); await wait(2.0); if (!alive()) return;
    tr.set('t.flat', 1, 1.5); said.replaceChildren(say_('t.s3')); await wait(2.6); if (!alive()) return;
    step = 3; drawPlan(); askName();
  });

  function askName(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'a 6 in × 4 in rectangle, the same as the base', ok: false, mc: MC.copiesBase as string | undefined, id: 't.n-base' },
      { t: 'a 3 in × 2 in rectangle', ok: true, mc: undefined, id: 't.n-ok' },
      { t: 'a triangle, like the slanted faces', ok: false, mc: MC.allTriangle, id: 't.n-tri' },
    ];
    const bx = h('div', { class: 'opts' });
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.name', prompt: 'A 6 in x 4 in based pyramid cut parallel to the base, halfway up: what is the cross-section?', response: o.t, expected: '3 in × 2 in rectangle', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.q', 0, 0.5); tr.set('t.hero', 1, 1.0, 0.2); tr.set('t.ldS', 1, 0.9, 0.9); await wait(1.4); if (!alive()) return;
        tr.set('t.sides', 1, 0.7); tr.set('t.L4', 1, 1.0, 0.3); await wait(4.5); if (!alive()) return;
        // the plane rises: the rectangle shrinks to a point at the apex, then comes back
        sayOnly('t.rise'); fbHost.append(html('p', 'dim', SCRIPT['t.rise']!));
        tr.set('t.sides', 0, 0.4); tr.set('t.ldS', 0, 0.4); tr.set('t.open', 0, 0.8); tr.set('t.hero:dim', 1, 0.5); tr.set('t.L4:dim', 1, 0.5);
        await wait(0.9); if (!alive()) return;
        tr.set('t.shift', 2, 2.6); await wait(3.2); if (!alive()) return;
        tr.set('t.shift', 0, 1.8); await wait(2.0); if (!alive()) return;
        tr.set('t.sides', 1, 0.5); tr.set('t.hero:dim', 0, 0.5); tr.set('t.L4:dim', 0, 0.5);
        await wait(1.2); if (!alive()) return;
        step = 4; drawPlan(); standUp();
      });
    })));
    work.replaceChildren(html('p', '', SCRIPT['t.name']!), bx, fbHost);
    sayOnly('t.name');
  }
  function standUp(): void {
    phase = 'B';
    said.replaceChildren();
    sceneB();
    jump('u.', ['solid', 'dims']);
    const next = btn('Slide it off the apex', () => { next.disabled = true; slideOff(); }, 'go');
    work.replaceChildren(say_('t.stand'));
    seq(async alive => {
      tr.set('u.plane', 1, 1.3); await wait(1.2); if (!alive()) return;
      tr.set('u.fk', 1, 0.5); tr.set('u.B1', 1, 0.9); tr.set('u.B2', 1, 0.9, 0.6); await wait(1.6); if (!alive()) return;
      tr.set('u.fk', 0, 0.6);
      tr.set('u.trace', 1, 2.4); await wait(2.5); if (!alive()) return;
      tr.set('u.fill', 1, 0.6); tr.set('u.flat', 1, 1.4, 0.3); await wait(1.8); if (!alive()) return;
      tr.set('u.heroB', 1, 1.0); tr.set('u.ldS', 1, 0.8, 0.8); await wait(3.0); if (!alive()) return;
      work.append(h('div', { class: 'row' }, next));
    });
  }
  function slideOff(): void {
    seq(async alive => {
      tr.set('u.ldS', 0, 0.4); tr.set('u.heroB', 0, 0.5); tr.set('u.B2', 0, 0.5);
      tr.set('u.shift', -1.5, 2.2); await wait(1.0); if (!alive()) return;
      tr.set('u.B2b', 1, 0.9); await wait(1.4); if (!alive()) return;
      askSlide();
    });
  }
  function askSlide(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'a triangle', ok: false, mc: MC.allTriangle as string | undefined, id: 't.s-tri' },
      { t: 'a trapezoid', ok: true, mc: undefined, id: 't.s-ok' },
      { t: 'a rectangle', ok: false, mc: MC.offApexRect, id: 't.s-rect' },
    ];
    const bx = h('div', { class: 'opts' });
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.slide', prompt: 'A plane perpendicular to the base of the pyramid, parallel to the 4 in edges, missing the apex: what shape?', response: o.t, expected: 'trapezoid', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('u.heroC', 1, 1.0); tr.set('u.ldS', 1, 0.8, 0.8); await wait(1.8); if (!alive()) return;
        askBottom();
      });
    })));
    work.replaceChildren(say_('t.slide'), bx, fbHost);
  }
  function askBottom(): void {
    const fbHost = h('div');
    const inp = numInput('in', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.v === 4;
      ctx.store.log({ part: 'turn', item: 'turn.bottom', prompt: 'The trapezoid section: how long is its bottom side?', response: r, expected: 4, correct: right });
      fbHost.replaceChildren(fb(right, right ? 't.b-ok' : 't.b-no'));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('u.sides', 1, 0.6); tr.set('u.B4', 1, 1.0, 0.2); void bump('u.pw', alive); await wait(3.4); if (!alive()) return;
        fbHost.append(callback());
      });
    }
    work.replaceChildren(html('p', '', SCRIPT['t.bottom']!), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayOnly('t.bottom');
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = CARDS[commit().pick ?? 1]!;
    const id = commit().pick === null ? 't.cb-right' : p.cb;
    setTimeout(() => sayOnly(id), 4200);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
  void phase;
}

// ===== 4. Prove it: Jordan's octagon =====
function partProve(): void {
  tr.reset('p.');
  const hex = planeThrough([4, 2, 0], [2, 0, 0], [0, 0, 2]);
  const m = slicer({ solid: CUBE, unit: 'in', planes: [hex], dims: [], sideLabels: 'none', flat: box(BX + 30, YT + 500, BOARD.x1 - 30, BOARD.y1 - 20) });
  const J = line('p.J', '\\text{Jordan: }\\ \\cssId{w}{8\\ \\text{sides}}', YT, 80);
  const C1 = line('p.C1', '\\text{each side} \\to \\cssId{f}{\\text{one face}}', YT + 160, 66, T);
  const C2 = line('p.C2', '\\cssId{f}{\\text{one face}} \\to \\text{one side}', YT + 290, 66, T);
  const C3 = line('p.C3', '\\cssId{a}{6\\ \\text{faces}} \\to\\ \\cssId{s}{\\le 6\\ \\text{sides}}', YT + 420, 72, T);
  const leads: Lead[] = [{ key: 'p.ldS', from: () => partOf(C3, 's'), to: () => m.where.sectionTip(0), col: 'link' }];
  setSlice({
    pre: 'p.', model: m, lines: [J, C1, C2, C3], leads,
    focus: () => ({ face: 'top', faceK: tr.k('p.fk'), ring: tr.k('p.ring') }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showSolid('p.', 0, false); tr.set('p.J', 1, 1.0, 2.0);

  const CHIPS = [
    { t: 'The edge of a section is where the cut crosses the surface, and the surface is made of faces.', fits: 0 },
    { t: 'A flat cut meets a flat face in one straight segment.', fits: 1 },
    { t: 'A cube has only 6 faces, one side each.', fits: 2 },
    { t: 'Cube cross-sections are only squares and rectangles.', fits: -1, mc: MC.cubeOnlyRect, id: 'p.x-rect' },
    { t: 'Tilt the cut enough and any shape is possible.', fits: -1, mc: MC.noExample, id: 'p.x-tilt' },
    { t: 'Two sides of a section can lie on the same face.', fits: -1, mc: MC.moreSides, id: 'p.x-two' },
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
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      if (n < 3) sayOnly(CLAIMS[n]!);
      seq(async alive => {
        if (n === 1) {
          tr.set('p.plane', 1, 1.2); await wait(1.1); if (!alive()) return;
          tr.set('p.trace', 1, 4.2); tr.set('p.C1', 1, 1.0, 0.6); await wait(4.3);
        }
        if (n === 2) {
          tr.set('p.C1:dim', 1, 0.5);
          tr.set('p.fk', 1, 0.6); tr.set('p.C2', 1, 1.0, 0.3); await wait(2.6); if (!alive()) return;
          tr.set('p.fk', 0, 0.6);
        }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.fill', 1, 0.8); tr.set('p.C3', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
          tr.set('p.ldS', 1, 0.8); await wait(0.9); if (!alive()) return;
          tr.set('p.flat', 1, 1.5); await wait(1.7); if (!alive()) return;
          tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: a cube can be cut so the cross-section is an octagon. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.noExample : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(say_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 4200);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it),
  });
}
const PFLAT = box(BX + 30, YT + 250, BOARD.x1 - 30, BOARD.y1 - 30);
/** draw a practice item on the glass solid; after a miss, the solution traces, lifts and names the cross-section */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as SlicePicture | undefined;
  const mk = pic?.kind === 'slice' ? tryBlock(() => slicer({ solid: pic.solid, pose: pic.pose, unit: pic.unit, planes: pic.planes, planeNames: pic.planeNames, dims: pic.dims, points: pic.points, sideLabels: pic.sideLabels, flat: pic.noFlat ? undefined : PFLAT })) : null;
  if (!mk || !mk.ok || !pic) {
    if (mk && !mk.ok) console.error('cross-sections: picture failed', mk.error);
    setSlice({ pre: 'x.', model: null, lines: [line('x.T', item.board, YT, 88)], leads: [] });
    tr.set('x.T', 1, 0.8, 0.1);
    return {};
  }
  const m = mk.value;
  const TL = line('x.T', item.board, YT, 84);
  // the solution's name takes the question's place at the top of the board (its leader comes in from above)
  const H0 = line('x.H0', `\\cssId{s}{${pic.hero[0] ?? ''}}`, YT, 80, T);
  const lines = [TL, H0];
  if (pic.hero[1]) lines.push(line('x.H1', pic.hero[1], YT + 125, 68, T));
  const hasSection = pic.planes.length > 0;
  setSlice({
    pre: 'x.', model: m, lines, leads: hasSection ? [{ key: 'x.ldS', from: () => partOf(H0, 's'), to: () => m.where.sectionTip(0), col: 'link' }] : [],
    focus: () => ({ face: pic.glow ?? null, faceK: tr.k('x.fk') }),
  });
  tr.set('x.solid', 1, 0.8); tr.set('x.dims', 1, 0.6, 0.5); tr.set('x.points', 1, 0.6, 0.6);
  if (!pic.hidePlanes) tr.set('x.plane', 1, 1.0, 0.8);
  tr.set('x.T', 1, 0.8, 0.4);
  return {
    solve: async alive => {
      tr.set('x.T:dim', 1, 0.5);
      if (pic.glow) { tr.set('x.fk', 1, 0.6); await wait(0.8); if (!alive()) return; }
      if (hasSection) {
        if (pic.hidePlanes) { tr.set('x.plane', 1, 1.0); await wait(1.0); if (!alive()) return; }
        tr.set('x.trace', 1, 2.2); await wait(2.3); if (!alive()) return;
        tr.set('x.fill', 1, 0.6); await wait(0.5); if (!alive()) return;
        if (!pic.noFlat) { tr.set('x.flat', 1, 1.3); await wait(1.4); if (!alive()) return; tr.set('x.sides', 1, 0.6); }
      }
      tr.set('x.T', 0, 0.4); tr.set('x.H0', 1, 0.9, 0.3); if (hasSection) tr.set('x.ldS', 1, 0.8, 0.7);
      tr.set('x.H1', 1, 0.9, 0.6);
    },
  };
}

/** for headless checks (tools/walk-cross-sections.mjs --gallery): draw any item, optionally with its worked solution */
(window as unknown as { __csShow: (it: Item, solve: boolean) => void }).__csShow = (it, solve) => {
  newEpoch();
  const v = showItem(it);
  if (solve && v.solve) seq(v.solve);
};

void runLesson({
  slug: SLUG,
  warm: ['\\text{section} = \\,?', '\\text{Jordan: }', '\\parallel \\perp \\to \\le'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
