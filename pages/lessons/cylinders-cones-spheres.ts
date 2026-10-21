// cylinders-cones-spheres.ts: "Volume of cylinders, cones, and spheres" (grade 8, 8.G.C.9 + TEKS 8.7A/B) on the
// shared lesson runtime. The model is pour-to-compare with glass vessels (Vessels.ts):
//   1 The question   a cone-shaped cup and a can, same radius and height: how many cupfuls fill the can?
//                    3 cards (2 = "a cone is half", 3, 4) + how sure
//   2 Worked example Stack the layers (V = Bh = 45 pi) -> Pour the cone (three cups fill the can: 15 pi) -> Pour the
//                    ball (its can is 6 in tall, the ball fills two thirds: 36 pi) -> Name the formulas; one "why?"
//   3 Your turn      a snow-cone cup (r 2, h 6), faded from the end: layers and the cone are given, the kid finds the
//                    gumball's can height (4) and the gumball's volume (32/3 pi), then the pour checks it
//   4 Prove it       Jordan takes a third of a can that is not the cone's match; a because-chain from reason chips,
//                    the vase's own cylinder appears and the pour backs the last claim
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts), 37 families
// Voiced lines: src/lesson/topics/cylinders-cones-spheres/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame } from '../../src/blocks/block';
import { BOARD, bigLine, line, type Line, newEpoch, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, type Input, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { rng } from '../../src/lesson/runtime/item';
import { Vessels, VesselsSafe, type VesselsBlock, type VesselsParams } from '../../src/lesson/topics/cylinders-cones-spheres/Vessels';
import { Net } from '../../src/lesson/topics/cylinders-cones-spheres/Net';
import { FAMILY_NAMES, GENERATORS, MC, type CcsPicture } from '../../src/lesson/topics/cylinders-cones-spheres/items';
import { PLAN } from '../../src/lesson/topics/cylinders-cones-spheres/plan';
import { SCRIPT } from '../../src/lesson/topics/cylinders-cones-spheres/script';

const SLUG = 'cylinders-cones-spheres';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
let lastSay: Promise<void> = Promise.resolve();
function say_(id: string, cls = ''): HTMLElement { lastSay = ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
/** say `id` once the line now playing has ended, if the kid is still in part `part` and `still()` holds */
const sayAfter = (id: string, part: number, still: () => boolean = () => true) => { const at = lastSay; void at.then(() => { if (ctx.progress.part === part && still()) lastSay = ctx.say(id); }); };
const sayOnly = (id: string) => { lastSay = ctx.say(id); return lastSay; };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { lastSay = ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

const YT = BOARD.y0 + 90;
const T = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const } };
/** the model's frame: wider than the shared one, two vessels side by side need the room */
const MF = frame(40, 80, 1120, 920);

// ---------- several Vessels blocks in one scene, each under its own key prefix (they cross-fade) ----------
interface Mod { pre: string; m: VesselsBlock }
function setModels(mods: Mod[], lines: Line[], extra?: (c: Canvas) => void): void {
  const Ps = mods.map(M => progressOf(s => tr.k(M.pre + s)));
  setScene({ table: 1080, model: c => mods.forEach((M, i) => M.m.draw(c, Ps[i]!)), lines, leads: [], extra });
}
const showMod = (pre: string, d = 0.9, delay = 0) => { for (const k of ['solid', 'dims', 'caption']) tr.set(pre + k, 1, d, delay); };
const hideMod = (pre: string, d = 0.7) => { for (const k of ['solid', 'dims', 'caption']) tr.set(pre + k, 0, d); };
/** one pour: the source drains, the target rises to `to` */
async function pour(pre: string, to: number, alive: () => boolean, src = 'w0', dst = 'w1', d = 1.6): Promise<void> {
  tr.set(pre + 'pour', 1, 0.35); await wait(0.35); if (!alive()) return;
  tr.set(pre + src, 0, d); tr.set(pre + dst, to, d); await wait(d); if (!alive()) return;
  tr.set(pre + 'pour', 0, 0.3); await wait(0.35);
}

// pictures of parts 1-4
const pairCupCan = (r: number, h: number, o: { layers?: number; dimsCup?: boolean; u?: string } = {}): VesselsParams => {
  const u = o.u ?? 'in';
  return {
    vessels: [{ kind: 'cup', r, h, role: 'first', water: 'w0', caption: 'cone' }, { kind: 'cyl', r, h, role: 'second', water: 'w1', caption: 'can', ...(o.layers ? { layers: { n: o.layers, key: 'layers' } } : {}) }],
    dims: [{ v: 1, what: 'r', text: `${r} ${u}`, col: 'second' }, { v: 1, what: 'h', text: `${h} ${u}`, col: 'second' },
      ...(o.dimsCup ? [{ v: 0, what: 'r' as const, text: `${r} ${u}`, optional: true }, { v: 0, what: 'h' as const, text: `${h} ${u}`, optional: true }] : [])],
    pours: [{ from: 0, to: 1, key: 'pour' }], maxScale: 120,
  };
};
const pairBallCan = (r: number, hText: string, caption = 'ball'): VesselsParams => ({
  vessels: [{ kind: 'sphere', r, role: 'first', water: 'w0', caption }, { kind: 'cyl', r, h: 2 * r, role: 'second', water: 'w1', caption: 'can' }],
  dims: [{ v: 0, what: 'r', text: `${r} in` }, { v: 1, what: 'h', text: hText, col: hText.includes('?') ? 'pick' : 'second' }],
  pours: [{ from: 0, to: 1, key: 'pour' }], maxScale: 120,
});

// ===================== 1. The question =====================
const CARDS = [
  { v: 2, mc: MC.coneHalf as string, cb: 't.cb-half' },
  { v: 3, mc: '', cb: 't.cb-right' },
  { v: 4, mc: '', cb: 't.cb-four' },
];
function partQuestion(): void {
  tr.reset('q.');
  // the can carries the numbers; the cup has the same radius and height (the prompt says so), and its own labels
  // would crowd its narrow rim
  const m = Vessels(pairCupCan(4, 6), MF, th);
  setModels([{ pre: 'q.', m }], [line('q.l1', '\\text{cups to fill the can} = \\,?', YT, 72)]);
  tr.jump('q.w0', 1);
  showMod('q.', 1.0); tr.set('q.l1', 1, 0.9, 1.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A cone cup and a can, same radius 4 in and height 6 in: how many full cups fill the can?', response: c.v, expected: 3, correct: c.v === 3, mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>cups</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = say_('q.intro');
  sayAfter('q.ask', 0);
  setPanel(h('h2', {}, 'A cup and a can'), intro, html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const A = Vessels(pairCupCan(3, 5, { layers: 5 }), MF, th);
  const B = Vessels(pairBallCan(3, '6 in'), MF, th);
  const C = Vessels({
    vessels: [{ kind: 'cyl', r: 1, h: 1.7, role: 'second', caption: 'cylinder' }, { kind: 'cone', r: 1, h: 1.9, role: 'first', caption: 'cone' }, { kind: 'sphere', r: 1, role: 'first', caption: 'sphere' }],
    dims: [{ v: 0, what: 'r', text: 'r', col: 'second' }, { v: 0, what: 'h', text: 'h', col: 'second' }, { v: 1, what: 'r', text: 'r' }, { v: 1, what: 'h', text: 'h' }, { v: 2, what: 'r', text: 'r' }],
    maxScale: 150, gap: 110,
  }, MF, th);
  const L1 = line('e.L1', 'B = \\pi \\cdot 3^2 = 9\\pi\\text{ in}^2', YT, 72, T);
  const L2 = line('e.L2', 'V = 9\\pi \\cdot 5 = \\cssId{b}{45\\pi}\\text{ in}^3', YT + 130, 72, T);
  // long lines break after the operation: the result sits on its own line under it
  const L3 = line('e.L3', 'V_{cone} = \\tfrac13 \\cdot 45\\pi', YT + 270, 72, T), L3b = line('e.L3', '= \\cssId{a}{15\\pi}\\text{ in}^3', YT + 390, 72, T);
  const L4 = line('e.L4', 'V_{can} = 9\\pi \\cdot 6 = \\cssId{b}{54\\pi}', YT, 72, T);
  const L5 = line('e.L5', 'V_{ball} = \\tfrac23 \\cdot 54\\pi', YT + 140, 72, T), L5b = line('e.L5', '= \\cssId{a}{36\\pi}\\text{ in}^3', YT + 260, 72, T);
  const F1 = line('e.F1', 'V_{cyl} = \\cssId{s}{\\pi r^2 h}', YT, 76, T);
  const F2 = line('e.F2', 'V_{cone} = \\cssId{s}{\\tfrac13 \\pi r^2 h}', YT + 150, 76, T);
  const F3 = line('e.F3', 'V_{sph} = \\tfrac23 \\cdot \\pi r^2 \\cdot 2r', YT + 300, 76, T);
  const F4 = line('e.F4', '= \\cssId{s}{\\tfrac43 \\pi r^3}', YT + 430, 80, T);
  setModels([{ pre: 'e.A.', m: A }, { pre: 'e.B.', m: B }, { pre: 'e.C.', m: C }], [L1, L2, L3, L3b, L4, L5, L5b, F1, F2, F3, F4]);
  for (const k of ['solid', 'dims', 'caption']) tr.jump('e.A.' + k, 1);
  let step = 0;
  const STEPS = [
    { t: 'Stack the layers', why: 'One layer is the base circle.', act: 'Stack' },
    { t: 'Pour the cone', why: 'Same radius, same height.', act: 'Pour' },
    { t: 'Pour the ball', why: 'Into the can that just holds it.', act: 'Pour' },
    { t: 'Name the formulas', why: 'Any radius, any height.', act: 'Name them' },
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
        tr.set('e.A.base', 1, 0.7); await wait(1.0); if (!alive()) return;
        tr.set('e.A.layers', 1, 2.6); await wait(2.8); if (!alive()) return;
        tr.set('e.A.base', 0, 0.6); tr.set('e.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.5); tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.A.layers', 0, 0.8); tr.set('e.A.w0', 1, 0.8); await wait(1.0); if (!alive()) return;
        for (let k = 1; k <= 3; k++) {
          if (k > 1) { tr.set('e.A.w0', 1, 0.6); await wait(0.7); if (!alive()) return; }
          await pour('e.A.', k / 3, alive); if (!alive()) return;
          await wait(0.3); if (!alive()) return;
        }
        tr.set('e.L3', 1, 1.0); await wait(1.1);
      } else if (i === 2) {
        for (const k of ['L1', 'L2', 'L3']) tr.set('e.' + k, 0, 0.6);
        hideMod('e.A.'); tr.jump('e.B.w0', 1); showMod('e.B.', 0.9, 0.4); await wait(1.5); if (!alive()) return;
        tr.set('e.L4', 1, 1.0); await wait(1.2); if (!alive()) return;
        await pour('e.B.', 2 / 3, alive, 'w0', 'w1', 2.0); if (!alive()) return;
        tr.set('e.L4:dim', 1, 0.5); tr.set('e.L5', 1, 1.0); await wait(1.1);
      } else {
        for (const k of ['L4', 'L5']) tr.set('e.' + k, 0, 0.6);
        hideMod('e.B.'); showMod('e.C.', 0.9, 0.5); await wait(1.5); if (!alive()) return;
        for (const k of ['F1', 'F2', 'F3', 'F4']) { tr.set('e.' + k, 1, 0.9); await wait(1.0); if (!alive()) return; }
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The ball is 6 in tall: a ball’s height is its diameter.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Any can works, as long as the radius matches.', ok: false, mc: MC.sphereHeight, id: 'e.w-any' },
      { t: 'A ball fills half its can, so the can has to be bigger.', ok: false, mc: MC.sphereHalf, id: 'e.w-half' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why was the ball’s can 6 in tall, not 5 in?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    sayAfter('e.why', 1, () => !fbHost.firstChild);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: a snow-cone cup and a gumball (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const A = Vessels(pairCupCan(2, 6, { layers: 6 }), MF, th);
  const Bq = Vessels(pairBallCan(2, 'h = ?', 'gumball'), MF, th), Bok = Vessels(pairBallCan(2, '4 in', 'gumball'), MF, th);
  let Bnow = Bq;
  const Bmod: VesselsBlock = { kind: 'Vessels', box: Bq.box, scale: Bq.scale, where: Bq.where, draw: (c, p) => Bnow.draw(c, p) };
  const L1 = line('t.L1', 'V_{can} = 4\\pi \\cdot 6 = \\cssId{b}{24\\pi}', YT, 72, T);
  const L2 = line('t.L2', 'V_{cone} = \\tfrac13 \\cdot 24\\pi = \\cssId{a}{8\\pi}', YT + 130, 72, T);
  const L3 = line('t.L3', 'h = 2 \\cdot 2 = 4\\text{ in}', YT + 270, 72, T);
  const L4 = line('t.L4', 'V_{can} = 4\\pi \\cdot 4 = \\cssId{b}{16\\pi}', YT + 400, 72, T);
  const L5 = line('t.L5', 'V_{ball} = \\tfrac23 \\cdot 16\\pi', YT + 530, 72, T), L5b = line('t.L5', '= \\cssId{s}{\\tfrac{32}{3}\\pi}\\text{ in}^3', YT + 660, 72, T);
  setModels([{ pre: 't.A.', m: A }, { pre: 't.B.', m: Bmod }], [L1, L2, L3, L4, L5, L5b]);
  showMod('t.A.', 0.9);
  let step = 0;
  const STEPS = [
    { t: 'Stack the layers', why: 'Done for you.' }, { t: 'Pour the cone', why: 'Done for you.' },
    { t: 'The gumball’s can', why: 'Your step.' }, { t: 'Pour the gumball', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), said = h('div'), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a snow-cone cup'), say_('t.intro'), plan, said, work);
  // the done-for-you steps move on as soon as their line has been said (short minimum holds when muted)
  const heard = (min: number) => Promise.all([wait(min), lastSay]);
  seq(async alive => {
    await heard(2.0); if (!alive()) return;
    tr.set('t.A.base', 1, 0.5); tr.set('t.A.layers', 1, 1.8); await wait(1.9); if (!alive()) return;
    tr.set('t.A.base', 0, 0.5); tr.set('t.L1', 1, 0.9); said.replaceChildren(say_('t.s1')); await heard(2.2); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.L1:dim', 1, 0.5); tr.set('t.A.layers', 0, 0.6); tr.set('t.A.w0', 1, 0.6); await wait(0.7); if (!alive()) return;
    await pour('t.A.', 1 / 3, alive, 'w0', 'w1', 1.3); if (!alive()) return;
    tr.set('t.L2', 1, 0.9); said.replaceChildren(say_('t.s2')); await heard(1.8); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.L2:dim', 1, 0.5);
    hideMod('t.A.'); tr.jump('t.B.w0', 1); showMod('t.B.', 0.8, 0.3); await wait(1.1); if (!alive()) return;
    said.replaceChildren(); askH();
  });
  function numStep(promptId: string, mk: (onEnter: () => void) => Input, onCheck: (v: number) => { ok: boolean; id: string; mc?: string }, item: string, prompt: string, expected: number | string, next: () => void): void {
    const fbHost = h('div'), ok = btn('Check', () => check(), 'go'), inp = mk(() => check());
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      const v = r && r.kind === 'num' ? r.v : r && r.kind === 'frac' ? r.w + r.n / (r.d || NaN) : NaN;
      if (!r || !Number.isFinite(v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const res = onCheck(v);
      ctx.store.log({ part: 'turn', item, prompt, response: r, expected, correct: res.ok, mc: res.mc });
      fbHost.replaceChildren(fb(res.ok, res.id));
      if (!res.ok) return;
      done = true; ok.disabled = true; next();
    }
    work.replaceChildren(html('p', '', SCRIPT[promptId]!), inp.node, h('div', { class: 'row' }, ok), fbHost);
    void sayOnly(promptId); inp.focus();
  }
  const near = (x: number, y: number) => Math.abs(x - y) < 1e-6;
  function askH(): void {
    numStep('t.h', e => numInput('in', e), v => near(v, 4) ? { ok: true, id: 't.h-ok' } : near(v, 6) ? { ok: false, id: 't.h-six', mc: MC.sphereHeight } : near(v, 2) ? { ok: false, id: 't.h-r', mc: MC.sphereHeight } : { ok: false, id: 't.h-no' },
      'turn.height', 'A gumball with radius 2 in: how tall is the can that just holds it?', 4, () => {
        Bnow = Bok;
        seq(async alive => {
          tr.set('t.L3', 1, 1.0); await wait(3.0); if (!alive()) return;
          step = 3; drawPlan(); tr.set('t.L3:dim', 1, 0.5); tr.set('t.L4', 1, 1.0); await wait(1.0); if (!alive()) return;
          askV();
        });
      });
  }
  function askV(): void {
    numStep('t.v', e => fracInput('π in³', e), v => near(v, 32 / 3) ? { ok: true, id: 't.v-ok' } : near(v, 8) ? { ok: false, id: 't.v-half', mc: MC.sphereHalf } : near(v, 16) ? { ok: false, id: 't.v-can' } : near(v, 16 / 3) ? { ok: false, id: 't.v-third', mc: MC.swapsCoef } : { ok: false, id: 't.v-no' },
      'turn.volume', 'The gumball’s can holds 16π in³: how much does the gumball hold, exactly?', '32/3 π', () => {
        seq(async alive => {
          tr.set('t.L4:dim', 1, 0.5);
          await pour('t.B.', 2 / 3, alive, 'w0', 'w1', 2.0); if (!alive()) return;
          tr.set('t.L5', 1, 1.0); await wait(4.5); if (!alive()) return;
          step = 4; drawPlan(); work.append(callback());
        });
      });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const id = commit().pick === null ? 't.cb-right' : CARDS[commit().pick!]!.cb;
    sayAfter(id, 2);
    c.innerHTML = (commit().pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jordan's third of the wrong can =====================
function partProve(): void {
  tr.reset('p.');
  const m = Vessels({
    vessels: [{ kind: 'cup', r: 3, h: 10, role: 'first', water: 'w0', caption: 'vase' }, { kind: 'cyl', r: 3, h: 5, role: 'second', caption: 'Jordan’s can' }, { kind: 'cyl', r: 3, h: 10, role: 'link', water: 'w1', caption: 'its match', show: 'm' }],
    dims: [{ v: 0, what: 'r', text: '3 in' }, { v: 0, what: 'h', text: '10 in' }, { v: 1, what: 'h', text: '5 in', col: 'second' }, { v: 2, what: 'h', text: '10 in', col: 'link' }],
    pours: [{ from: 0, to: 2, key: 'pour' }], maxScale: 110, gap: 70, margin: [70, 90],
  }, MF, th);
  const J = line('p.J', '\\text{Jordan: } \\tfrac13 \\cdot 45\\pi', YT, 72, T), Jb = line('p.J', '= \\cssId{w}{15\\pi}', YT + 115, 72, T);
  const C1 = line('p.C1', 'V_{match} = 9\\pi \\cdot 10', YT + 280, 72, T), C1b = line('p.C1', '= 90\\pi', YT + 395, 72, T);
  const C2 = line('p.C2', 'V_{vase} = \\tfrac13 \\cdot 90\\pi', YT + 560, 72, T), C2b = line('p.C2', '= \\cssId{s}{30\\pi}\\text{ in}^3', YT + 675, 72, T);
  setModels([{ pre: 'p.', m }], [J, Jb, C1, C1b, C2, C2b], c => {
    const ks = tr.k('p.strike');
    if (ks > 0) { const bb = partOf(Jb, 'w'); strike(c, bb.x0 - 8, bb.y1 + 6, bb.x1 + 8, bb.y0 - 6, ks, { col: 'wrong' }); }
  });
  tr.jump('p.w0', 1);
  tr.set('p.solid', 1, 0.9); tr.set('p.dims', 1, 0.7, 0.6); tr.set('p.caption', 1, 0.7, 0.6); tr.set('p.J', 1, 1.0, 1.6);
  const CHIPS = [
    { t: 'The one-third rule needs the same base and the same height, and the vase is twice as tall as the can.', fits: 0 },
    { t: 'Same base, 9π in², stacked 10 in high.', fits: 1 },
    { t: 'A cone is one third of its own cylinder: 90π ÷ 3 = 30π.', fits: 2 },
    { t: 'Any cone is one third of any can with the same radius.', fits: -1, mc: MC.thirdAny, id: 'p.x-any' },
    { t: 'A cone is half of its cylinder.', fits: -1, mc: MC.coneHalf, id: 'p.x-half' },
    { t: 'Divide by 3 for the cone, then by 3 again for the taller height.', fits: -1, mc: MC.thirdTwice, id: 'p.x-twice' },
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
    used.add(i); filled++; drawChain();
    const n = filled;
    if (n < 3) { fbHost.replaceChildren(fb(true, `p.ok${n}`)); sayAfter(CLAIMS[n]!, 3, () => filled === n); }
    else fbHost.replaceChildren();
    seq(async alive => {
      if (n === 1) { tr.set('p.m', 1, 1.0); await wait(1.2); }
      if (n === 2) { tr.set('p.C1', 1, 1.0); await wait(1.1); }
      if (n === 3) {
        tr.set('p.C1:dim', 1, 0.5);
        await pour('p.', 1 / 3, alive, 'w0', 'w1', 2.0); if (!alive()) return;
        tr.set('p.C2', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: a cone r 3 in, h 10 in is one third of a can r 3 in, h 5 in (45π), so 15π. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.thirdAny : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(say_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    sayAfter('p.c1', 3, () => filled === 0 && !fbHost.firstChild);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice: every sub-goal, then mixed =====================
const PMF = frame(40, 80, 1120, 920);
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed), show: it => showItem(it),
  });
}
type Drawable = { draw(c: Canvas, p: ReturnType<typeof progressOf>): void };
function buildPicture(pic: CcsPicture, strict = false): Drawable & { strict: boolean } {
  if (pic.scene.kind === 'vessels') return strict ? { ...Vessels(pic.scene.p, PMF, th), strict: true } : VesselsSafe(pic.scene.p, PMF, th);
  return { ...Net(pic.scene.spec, pic.scene.labels, PMF, th), strict: true };
}
/** draw a practice item; after a miss its worked solution plays: the pour / layers / net glow, the board solves */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as CcsPicture;
  let model: Drawable | null = null;
  try { model = buildPicture(pic); } catch (e) { console.warn('cylinders-cones-spheres: picture failed', item.family, (e as Error).message); }
  const P = progressOf(s => tr.k('x.' + s));
  if (!model) {
    const big = box(260, 230, 1660, 790);
    setScene({ lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
    tr.set('x.T', 1, 0.8, 0.1);
    return {};
  }
  const TL = line('x.T', item.board, YT, 80);
  const pre = (pic.pre ?? []).map((src, i) => line(`x.P${i}`, src, YT + 120 + i * 110, 66));
  const y0 = YT + (pic.pre?.length ? 140 + pic.pre.length * 110 : 160);
  const heroes = pic.hero.map((src, i) => line(`x.H${i}`, src, y0 + i * 118, 68));
  setScene({ table: 1080, model: c => model!.draw(c, P), lines: [TL, ...pre, ...heroes], leads: [] });
  for (const [k, v] of pic.set ?? []) tr.jump('x.' + k, v);
  pic.show.forEach((k, i) => tr.set('x.' + k, 1, 0.8, 0.2 + 0.25 * i));
  tr.set('x.T', 1, 0.8, 0.4);
  pre.forEach((_, i) => tr.set(`x.P${i}`, 1, 0.8, 0.9 + 0.4 * i));
  return {
    solve: async alive => {
      tr.set('x.T:dim', 1, 0.5);
      for (const grp of pic.solve) {
        if (!grp.length) continue;
        for (const [k, v] of grp) tr.set('x.' + k, v, 1.4);
        await wait(1.6); if (!alive()) return;
      }
      for (let i = 0; i < heroes.length; i++) { tr.set(`x.H${i}`, 1, 0.9); await wait(0.9); if (!alive()) return; }
    },
  };
}
// for headless checks: draw any item (optionally solved), and lay out every family's picture strictly
const W = window as unknown as Record<string, unknown>;
W.__ccsShow = (it: Item, solve: boolean) => { newEpoch(); const v = showItem(it); if (solve && v.solve) seq(v.solve); };
W.__ccsAudit = (seeds = 12) => {
  const bad: string[] = [];
  let n = 0;
  for (const p of PLAN) for (const f of p.families) for (let s = 1; s <= seeds; s++) {
    const it = GENERATORS[f]!(rng(s * 7919 + 3), s, p.id);
    n++;
    try { buildPicture(it.picture as unknown as CcsPicture, true); } catch (e) { bad.push(`${p.id}/${f}#${s}: ${(e as Error).message}`); }
  }
  return { n, bad };
};

void runLesson({
  slug: SLUG,
  warm: ['V = \\pi r^2 h', '\\tfrac13 \\tfrac23 \\tfrac43 \\cdot 9\\pi', '\\text{cups to fill the can} = \\,?', 'V_{cone} V_{can} V_{ball} \\text{ in}^3 \\text{ in}^2', '\\text{Jordan: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
