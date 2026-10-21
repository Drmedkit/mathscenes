// composite-area-volume.ts: a topic of the lesson line (grade 7, 7.G.B.6 + TEKS / B.E.S.T.), on the shared runtime.
//   1 The question   a foam gym step of two glued blocks (38 ft² + 22 ft² on their own), covered in vinyl:
//                    3 cards (add them / take the glued region off once / twice) + how sure
//   2 Worked example Split -> Volume -> Each skin -> Glue it back on the glass step: volumes add, the 6 ft² contact
//                    region was counted once in each block, so it comes off twice; one "why?"
//   3 Your turn      a trophy stand (a 6 x 6 x 4 in block centred on a 10 x 10 x 4 in base), faded from the end: the
//                    kid finds the contact region (the footprint, not the base's whole top) and the surface area
//   4 Prove it       Riley: "cut a block of clay in two, the total surface area stays the same"; a because-chain
//                    from reason chips while the pieces come apart and the two new faces light up
//   5 Practice       all 21 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/composite-area-volume/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, strike } from '../../src/core/draw';
import { progressOf } from '../../src/core/clock';
import { frame } from '../../src/blocks/block';
import { BOARD, bump, newEpoch, line, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { drawWords } from '../../src/lesson/words';
import { type Body, type Glow, type Label, type SolidsBlock, Solids, SolidsSafe } from '../../src/lesson/topics/composite-area-volume/Solids';
import { FloorPlan, type PlanBlock } from '../../src/lesson/topics/composite-area-volume/FloorPlan';
import { type BoxSpec, type V3, box3 } from '../../src/lesson/topics/composite-area-volume/measure';
import { FAMILY_NAMES, GENS, MC, type CavPicture } from '../../src/lesson/topics/composite-area-volume/items';
import { PLAN } from '../../src/lesson/topics/composite-area-volume/plan';
import { SCRIPT } from '../../src/lesson/topics/composite-area-volume/script';

const SLUG = 'composite-area-volume';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function say_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

const YT = BOARD.y0 + 90;
const T = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, f: { col: 'pick' as const }, w: { col: 'wrong' as const } };
/** the model's frame: wider than the shared one, the solids need the room */
const MF = frame(40, 80, 1110, 920);

// ---------- two glued boxes: bodies, labels at rest and pulled apart, the contact region on each ----------
function pairModel(A: BoxSpec, B: BoxSpec, off: V3, u: string, roles: ['first' | 'second', 'first' | 'second'] = ['first', 'second']): { bodies: Body[]; labels: Label[]; glows: Glow[] } {
  const bodies: Body[] = [{ kind: 'boxes', add: [A], role: roles[0] }, { kind: 'boxes', add: [B], role: roles[1], off }];
  const [x, y, z] = B.at, [l, w] = B.size;
  const side = Math.abs(B.at[0] - (A.at[0] + A.size[0])) < 1e-9 && Math.abs(B.at[2] - A.at[2]) < 1e-9;
  const q: V3[] = side ? [[x, 0, 0], [x, A.size[1], 0], [x, A.size[1], A.size[2]], [x, 0, A.size[2]]] : [[x, y, z], [x + l, y, z], [x + l, y + w, z], [x, y + w, z]];
  const glows: Glow[] = [{ pts: q, body: 0, key: 'gc', col: side ? 'link' : 'pick' }, { pts: q, body: 1, key: 'gc', col: side ? 'link' : 'pick' }];
  const W = (b: BoxSpec, i: number, st: 'rest' | 'open'): Label[] => {
    const [bx, by, bz] = b.at, [bl, bw, bh] = b.size;
    const raised = bz > 1e-9;
    return [
      { text: `${bl} ${u}`, a: raised ? [bx, by + bw, bz + bh] : [bx, by, bz], b: raised ? [bx + bl, by + bw, bz + bh] : [bx + bl, by, bz], body: i, state: st, col: roles[i], optional: true },
      { text: `${bh} ${u}`, a: bx <= 1e-9 ? [bx, by, bz] : [bx + bl, by + bw, bz], b: bx <= 1e-9 ? [bx, by, bz + bh] : [bx + bl, by + bw, bz + bh], body: i, state: st, col: roles[i], optional: true },
      ...(i === 0 || bw !== A.size[1] ? [{ text: `${bw} ${u}`, a: [bx + bl, by, bz] as V3, b: [bx + bl, by + bw, bz] as V3, body: i, state: st, col: roles[i], optional: true }] : []),
    ];
  };
  return { bodies, labels: [...W(A, 0, 'rest'), ...W(B, 1, 'rest'), ...W(A, 0, 'open'), ...W(B, 1, 'open')], glows };
}
interface SolScene { pre: string; model: SolidsBlock; lines: Line[]; leads: []; extra?: (c: Canvas) => void }
function setSolids(S: SolScene): void {
  const P = progressOf(s => tr.k(S.pre + s));
  setScene({ table: 1080, model: c => S.model.draw(c, P), lines: S.lines, leads: S.leads, extra: S.extra });
}

// the step of parts 1-2: a 4 x 3 x 1 ft block with a 2 x 3 x 1 ft block on its left half
const STEP_A = box3(0, 0, 0, 4, 3, 1), STEP_B = box3(0, 0, 1, 2, 3, 1);
const stepModel = () => { const m = pairModel(STEP_A, STEP_B, [0, 0, 1.5], 'ft'); return Solids({ ...m }, MF, th); };

const CARDS = [
  { big: '60 ft²', small: '38 + 22', mc: MC.hiddenContact as string, cb: 't.cb-add' },
  { big: '54 ft²', small: '38 + 22 − 6', mc: MC.removesOnce as string, cb: 't.cb-once' },
  { big: '48 ft²', small: '38 + 22 − 12', mc: '', cb: 't.cb-right' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = stepModel();
  setSolids({ pre: 'q.', model: m, lines: [line('q.l1', 'S = \\,?', YT, 88)], leads: [] });
  tr.set('q.solid', 1, 1.0); tr.set('q.dims', 1, 0.8, 0.8); tr.set('q.l1', 1, 0.9, 1.8);
  const cards = h('div', { class: 'cards cs', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 2]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Two glued foam blocks, 38 ft² and 22 ft² on their own, touching on 2 ft x 3 ft: how much vinyl covers the step?', response: p.big, expected: '48 ft²', correct: !p.mc, mc: p.mc || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'A gym step'), intro, html('p', '', SCRIPT['q.skins']!), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: Split -> Volume -> Each skin -> Glue it back =====
function partExample(): void {
  tr.reset('e.');
  const m = stepModel();
  const L1 = line('e.L1', '\\text{step} = \\cssId{a}{A} + \\cssId{b}{B}', YT, 76, T);
  const L2 = line('e.L2', 'V = \\cssId{a}{12} + \\cssId{b}{6} = \\cssId{s}{18}\\text{ ft}^3', YT + 140, 72, T);
  const L3 = line('e.L3', '\\cssId{a}{38} + \\cssId{b}{22} = 60', YT + 280, 76, T);
  const L4 = line('e.L4', 'S = 60 - 2 \\cdot \\cssId{f}{6}', YT + 440, 76, T);
  const L5 = line('e.L5', '= \\cssId{s}{48}\\text{ ft}^2', YT + 570, 84, T);
  // no leader across the step: the contact regions pulse while the 6 writes on
  setSolids({ pre: 'e.', model: m, lines: [L1, L2, L3, L4, L5], leads: [] });
  for (const k of ['solid', 'dims']) tr.jump('e.' + k, 1);

  let step = 0;
  const STEPS = [
    { t: 'Split', why: 'Pieces that touch, never overlap.', act: 'Split' },
    { t: 'Add the volumes', why: 'Space adds up.', act: 'Volume' },
    { t: "Each block's surface", why: 'Mark where they touch.', act: 'Surface' },
    { t: 'Glue it back', why: 'What is outside now?', act: 'Glue' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.explode', 1, 1.4); await wait(1.4); if (!alive()) return;
        tr.set('e.gc', 1, 0.6); await wait(0.6); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.5); tr.set('e.gc', 0, 0.5);
        tr.set('e.L2', 1, 1.2); await wait(1.4);
      } else if (i === 2) {
        tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.gc', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('e.L3', 1, 1.1); await wait(1.3);
      } else {
        tr.set('e.L3:dim', 1, 0.5);
        tr.set('e.L4', 1, 0.9); tr.set('e.gc', 0.35, 0.4, 0.5); tr.set('e.gc', 1, 0.5, 1.0); await wait(2.0); if (!alive()) return;
        tr.set('e.explode', 0, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.gc', 0, 0.8); await wait(0.6); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Each block had its own 6 ft² face there, and both are now inside.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Only the top block\'s face is covered; the bottom block\'s still shows.', ok: false, mc: MC.removesOnce, id: 'e.w-once' },
      { t: 'You don\'t take anything away: nothing was cut off.', ok: false, mc: MC.hiddenContact, id: 'e.w-none' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why take the 6 ft² contact region away twice?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 6500);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: the trophy stand (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const A = box3(0, 0, 0, 10, 10, 4), B = box3(2, 2, 4, 6, 6, 4);
  const m = Solids(pairModel(A, B, [0, 0, 5.5], 'in'), MF, th);
  const L1 = line('t.L1', 'V = \\cssId{a}{400} + \\cssId{b}{144} = \\cssId{s}{544}', YT, 72, T);
  const L2 = line('t.L2', '\\cssId{a}{360} + \\cssId{b}{168} = 528', YT + 140, 72, T);
  const L3 = line('t.L3', '\\cssId{f}{A} = 6 \\cdot 6 = \\cssId{f}{36}', YT + 290, 72, T);
  const L4 = line('t.L4', 'S = 528 - 2 \\cdot \\cssId{f}{36}', YT + 440, 76, T);
  const L5 = line('t.L5', '= \\cssId{s}{456}\\text{ in}^2', YT + 570, 84, T);
  setSolids({ pre: 't.', model: m, lines: [L1, L2, L3, L4, L5], leads: [] });
  tr.set('t.solid', 1, 0.9); tr.set('t.dims', 1, 0.7, 0.6);
  let step = 0;
  const STEPS = [
    { t: 'Split', why: 'Done for you.' }, { t: 'Add the volumes', why: 'Done for you.' }, { t: "Each block's surface", why: 'Done for you.' },
    { t: 'Where do they touch?', why: 'Your step.' }, { t: 'Glue it back', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), said = h('div'), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A trophy stand'), say_('t.intro'), plan, said, work);
  seq(async alive => {
    await wait(7.0); if (!alive()) return;
    tr.set('t.explode', 1, 1.4); said.replaceChildren(say_('t.s1')); await wait(2.4); if (!alive()) return;
    step = 1; drawPlan(); tr.set('t.L1', 1, 1.1); said.replaceChildren(say_('t.s2')); await wait(5.5); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.L1:dim', 1, 0.5); tr.set('t.L2', 1, 1.1); said.replaceChildren(say_('t.s3')); await wait(6.0); if (!alive()) return;
    step = 3; drawPlan(); tr.set('t.L2:dim', 1, 0.5); askContact();
  });
  function numStep(promptId: string, unit: string, onCheck: (v: number) => { ok: boolean; id: string; mc?: string }, item: string, prompt: string, expected: number, next: () => void): void {
    const fbHost = h('div');
    const inp = numInput(unit, () => check());
    const ok = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const v = onCheck(r.v);
      ctx.store.log({ part: 'turn', item, prompt, response: r, expected, correct: v.ok, mc: v.mc });
      fbHost.replaceChildren(fb(v.ok, v.id));
      if (!v.ok) return;
      done = true; ok.disabled = true; next();
    }
    work.replaceChildren(html('p', '', SCRIPT[promptId]!), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayOnly(promptId); inp.focus();
  }
  function askContact(): void {
    tr.set('t.gc', 1, 0.6);
    numStep('t.contact', 'in²', v => v === 36 ? { ok: true, id: 't.c-ok' } : v === 100 ? { ok: false, id: 't.c-whole', mc: MC.wholeFace } : { ok: false, id: 't.c-no' },
      'turn.contact', 'Trophy stand: a 6 x 6 x 4 in block on a 10 x 10 x 4 in base: how big is the region where they touch?', 36, () => {
        seq(async alive => {
          tr.set('t.L3', 1, 1.0); void bump('t.pb', alive); await wait(3.6); if (!alive()) return;
          step = 4; drawPlan(); tr.set('t.L3:dim', 1, 0.5); askTotal();
        });
      });
  }
  function askTotal(): void {
    numStep('t.total', 'in²', v => v === 456 ? { ok: true, id: 't.t-ok' } : v === 528 ? { ok: false, id: 't.t-none', mc: MC.hiddenContact } : v === 492 ? { ok: false, id: 't.t-once', mc: MC.removesOnce } : v === 392 || v === 428 ? { ok: false, id: 't.t-whole', mc: MC.wholeFace } : { ok: false, id: 't.t-no' },
      'turn.total', 'Trophy stand: S_A + S_B = 528 in², contact 36 in²: surface area of the stand?', 456, () => {
        seq(async alive => {
          tr.set('t.explode', 0, 1.5); await wait(1.6); if (!alive()) return;
          tr.set('t.gc', 0, 0.6); tr.set('t.L4', 1, 0.9); await wait(1.1); if (!alive()) return;
          tr.set('t.L5', 1, 1.0); await wait(3.6); if (!alive()) return;
          work.append(callback());
        });
      });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const id = commit().pick === null ? 't.cb-right' : CARDS[commit().pick!]!.cb;
    setTimeout(() => sayOnly(id), 4600);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Riley's cut =====
function partProve(): void {
  tr.reset('p.');
  const a = box3(0, 0, 0, 2, 4, 3), b = box3(2, 0, 0, 4, 4, 3);
  const face: V3[] = [[2, 0, 0], [2, 4, 0], [2, 4, 3], [2, 0, 3]];
  const bodies: Body[] = [{ kind: 'boxes', add: [a], role: 'first' }, { kind: 'boxes', add: [b], role: 'first', off: [2.4, 0, 0] }];
  const labels: Label[] = [
    { text: '6 in', a: [0, 0, 0], b: [6, 0, 0] }, { text: '4 in', a: [6, 0, 0], b: [6, 4, 0] }, { text: '3 in', a: [0, 0, 0], b: [0, 0, 3] },
    { text: '2 in', a: [0, 0, 0], b: [2, 0, 0], body: 0, state: 'open', optional: true }, { text: '4 in', a: [2, 0, 0], b: [6, 0, 0], body: 1, state: 'open', optional: true },
    { text: '3 in', a: [0, 0, 0], b: [0, 0, 3], body: 0, state: 'open', optional: true },
  ];
  const glows: Glow[] = [{ pts: face, body: 0, key: 'gc', col: 'link' }, { pts: face, body: 1, key: 'gc', col: 'link' }];
  const m = Solids({ bodies, labels, glows }, MF, th);
  const J = line('p.J', '\\text{Riley: } S = \\cssId{w}{108}', YT, 80);
  const C1 = line('p.C1', 'V = 24 + 48 = 72', YT + 160, 72);
  const C2 = line('p.C2', '\\text{new: } 2 \\cdot \\cssId{s}{12}\\text{ in}^2', YT + 300, 72, T);
  const C3 = line('p.C3', 'S = 108 + 24 = \\cssId{s}{132}', YT + 440, 76, T);
  setSolids({
    pre: 'p.', model: m, lines: [J, C1, C2, C3], leads: [],
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const bb = partOf(J, 'w'); strike(c, bb.x0 - 8, bb.y1 + 6, bb.x1 + 8, bb.y0 - 6, ks, { col: 'wrong' }); } },
  });
  tr.set('p.solid', 1, 0.9); tr.set('p.dims', 1, 0.7, 0.6); tr.set('p.J', 1, 1.0, 1.6);
  const CHIPS = [
    { t: 'They fill the block exactly once: no gap and no overlap.', fits: 0 },
    { t: 'The cut surface was inside the block; now it is on the outside of both pieces.', fits: 1 },
    { t: 'The cut made two 4 in × 3 in faces, one on each piece, and no clay was added.', fits: 2 },
    { t: 'Nothing is lost, so nothing about the block changes.', fits: -1, mc: MC.cutPreserves, id: 'p.x-same' },
    { t: 'If the volume stays the same, so does the surface area.', fits: -1, mc: MC.changeTogether, id: 'p.x-together' },
    { t: 'The cut makes only one new face, shared by the two pieces.', fits: -1, mc: MC.removesOnce, id: 'p.x-one' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>(), order = [3, 0, 4, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const bt = btn(ch.t, () => place(i)); if (used.has(i)) bt.classList.add('used'); return bt; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    if (n < 3) sayOnly(CLAIMS[n]!);
    seq(async alive => {
      if (n === 1) { tr.set('p.explode', 1, 1.4); await wait(1.5); if (!alive()) return; tr.set('p.C1', 1, 1.0); }
      if (n === 2) { tr.set('p.C1:dim', 1, 0.5); tr.set('p.gc', 1, 0.8); await wait(0.9); if (!alive()) return; tr.set('p.C2', 1, 1.0); }
      if (n === 3) {
        tr.set('p.C2:dim', 1, 0.5); tr.set('p.C3', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: cut a block in two, the total surface area stays the same. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.cutPreserves : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(say_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 4200);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed), show: it => showItem(it),
  });
}
/** draw a practice item; after a miss its worked solution plays: the pieces come apart / light up, the board solves */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as CavPicture;
  let model: { draw(c: Canvas, p: ReturnType<typeof progressOf>): void; box: { y1: number; cx: number } } | null = null;
  try {
    model = pic.kind === 'solids' ? SolidsSafe(pic.solids!, MF, th) : FloorPlan(pic.plan!, MF, th) as PlanBlock;
  } catch (e) { console.warn('composite-area-volume: picture failed', (e as Error).message); }
  const P = progressOf(s => tr.k('x.' + s));
  const TL = line('x.T', item.board, YT, 84);
  const heroes = pic.hero.map((src, i) => line(`x.H${i}`, src, YT + 170 + i * 130, 72));
  setScene({
    table: 1080, model: c => model?.draw(c, P), lines: [TL, ...heroes], leads: [],
    extra: c => { if (pic.note && model) drawWords(c, pic.note, MF.x + MF.w / 2, Math.min(1040, model.box.y1 + 50), 'dim', 1, { size: 44, align: 'center' }); },
  });
  pic.show.forEach((k, i) => tr.set('x.' + k, 1, 0.8, 0.2 + 0.25 * i));
  tr.set('x.T', 1, 0.8, 0.4);
  return {
    solve: async alive => {
      tr.set('x.T:dim', 1, 0.5);
      for (const k of pic.hide ?? []) tr.set('x.' + k, 0, 0.8);
      for (const grp of pic.solve) {
        if (!grp.length) continue;
        for (const k of grp) tr.set('x.' + k, 1, 1.1);
        await wait(1.3); if (!alive()) return;
      }
      for (let i = 0; i < heroes.length; i++) { tr.set(`x.H${i}`, 1, 0.9); await wait(0.9); if (!alive()) return; }
    },
  };
}
/** for headless checks: draw any item, optionally with its worked solution */
(window as unknown as { __cavShow: (it: Item, solve: boolean) => void }).__cavShow = (it, solve) => {
  newEpoch();
  const v = showItem(it);
  if (solve && v.solve) seq(v.solve);
};

void runLesson({
  slug: SLUG,
  warm: ['S = \\,?', 'V = 12 + 6', '\\text{step} = A + B', 'S_A + S_B', '\\text{Riley: }', '\\text{ ft}^2 \\text{ in}^3 \\cdot \\pi \\tfrac13 \\approx \\div'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
