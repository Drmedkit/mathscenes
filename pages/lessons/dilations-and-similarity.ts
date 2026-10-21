// dilations-and-similarity.ts: "Dilations and similarity" (grade 8, 8.G.A.3-5) on the shared lesson runtime.
//   1 The question   △ABC, center O, k = 2: where does C (1, 4) land? Three candidate points on the plane: grown from
//                    the triangle's middle (−1, 5), on ray OC twice as far (2, 8), 2 added to each coordinate (3, 6)
//   2 Worked example Rays from O -> twice as far along each ray (distance bars: one amber OC, two of them make OC′)
//                    -> join the image, (x, y) → (2x, 2y) -> check what stays (right angle, order, every side × 2);
//                    one "why is point 1 not the image?" with 3 reasons
//   3 Your turn      △PQR, k = ½, faded from the end: rays and P′ given; the kid finds Q′, then P′R′, then picks what
//                    is true of the image; the callback to part 1
//   4 Prove it       Riley: "R (6 by 4) and S (9 by 5) both have four right angles, so they are similar"; a
//                    because-chain from reason chips; R dilated by 3/2 overhangs S by a strip
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/dilations-and-similarity/script.ts (panel HTML) = voice/lines.json (spoken text).
// Review aid: dilations-and-similarity.html?open&part=4&item=<family>:<subgoal>:<seed>[&solve] shows one practice item.
import type { Canvas } from '../../src/core/draw';
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput, pairInput, solutionList } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { rng } from '../../src/lesson/runtime/item';
import { FAMILY_NAMES, GENERATORS, MC, type DItem } from '../../src/lesson/topics/dilations-and-similarity/items';
import { PLAN } from '../../src/lesson/topics/dilations-and-similarity/plan';
import { LINES, THREE_HALVES } from '../../src/lesson/topics/dilations-and-similarity/script';
import { type DFig, type DilPic, type V, dilateAll, kk } from '../../src/lesson/topics/dilations-and-similarity/dilMaths';
import { type DState, drawDilPic, viewOf } from '../../src/lesson/topics/dilations-and-similarity/DilBoard';

const SLUG = 'dilations-and-similarity';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const T = (id: string) => LINES[id]?.html ?? id;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { if (!LINES[id]) console.warn('no voice line', id); void ctx.say(id); return html(tag, cls, T(id)); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, T(id), extra); };
const NOTABLE = 1080;

// ---------- the layout: the picture on the left, a wide notation board on the right ----------
const PLANE = box(30, 60, 1030, 1020);
const WB = box(1070, 70, 1860, 1010), WX = WB.x0 + 50, WW = WB.w - 100;
/** a line of TeX on the wide board (shrinks to fit, never below 56 px) */
function wline(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src);
  let s = size;
  while (s > 56 && texWidth(F, s) > WW) s -= 2;
  return { key, F, x: WX, y, size: s, tags, col };
}
const TG = { a: { col: 'first' as Paint }, b: { col: 'second' as Paint }, s: { col: 'link' as Paint }, p: { col: 'pick' as Paint } };

// ======================================================================================================
// Parts 1 and 2: △ABC with a right angle at A, center O (the origin), k = 2.
const O: V = [0, 0];
const ABC: V[] = [[1, 2], [5, 2], [1, 4]];
const IMG: V[] = dilateAll(ABC, O, 2);                    // (2, 4), (10, 4), (2, 8)
const WIN12 = { x0: -2, y0: -1, x1: 11, y1: 9 };
const CANDS: { p: V; label: string; mc?: string; cb: string }[] = [
  { p: [-1, 5], label: '1', mc: MC.middle, cb: 't.cb-mid' },   // grown from the middle of the triangle (3, 3)
  { p: [2, 8], label: '2', cb: 't.cb-right' },                  // on ray OC, twice as far
  { p: [3, 6], label: '3', mc: MC.additive, cb: 't.cb-add' },  // 2 added to each coordinate
];
interface P12 { order?: boolean; lens?: boolean; image?: number; cands?: number; wrongC?: number; imgPts?: number }
function pic12(o: P12): DilPic {
  const f0: DFig = { pts: ABC, role: 'first', labels: ['A', 'B', 'C'], rights: [0], lens: ['4', null, '2'], order: o.order };
  const f1: DFig = { pts: IMG, role: 'link', labels: ['A′', 'B′', 'C′'], rights: [0], lens: ['8', null, '4'], order: o.order };
  const pts: DilPic['pts'] = [];
  if ((o.cands ?? 1) > 0) CANDS.forEach((cd, i) => { if (!(i === 1 && (o.imgPts ?? 0) > 0.5)) pts.push({ p: cd.p, label: cd.label, role: i !== 1 && (o.wrongC ?? 0) > 0.5 ? 'wrong' : 'pick' }); });
  if ((o.imgPts ?? 0) > 0 && (o.image ?? 0) < 1) IMG.forEach((q, i) => pts.push({ p: q, label: ['A′', 'B′', 'C′'][i]!, role: 'link', hidden: true }));
  return { kind: 'plane', win: WIN12, axes: true, figs: [f0, f1], center: { p: O, label: 'O' }, dil: { fig: 0, c: O, k: kk(2), bars: [2, 0, 1], labels: false }, pts };
}

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const v = viewOf(pic12({}), PLANE);
  const L1 = wline('q.L1', '\\cssId{b}{\\text{center}\\ O},\\ \\ \\cssId{a}{k = 2}', WB.y0 + 120, 76, TG);
  const L2 = wline('q.L2', 'C(1,\\ 4) \\to C\'\\,?', WB.y0 + 260, 76);
  setScene({
    table: NOTABLE, lines: [L1, L2], leads: [], boardBox: WB,
    model: c => drawDilPic(c, v, pic12({}), { k: tr.k('q.fig'), lab: { 0: 0 }, show: { 1: 0 } }),
  });
  tr.set('q.fig', 1, 1.0); tr.set('q.L1', 1, 0.9, 0.8); tr.set('q.L2', 1, 0.9, 1.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const cd = CANDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Dilate △ABC about O with k = 2: where does C (1, 4) land? Point 1 (−1, 5), point 2 (2, 8), point 3 (3, 6).', board: 'C(1, 4) → C′?', response: `point ${cd.label}`, expected: 'point 2', correct: cd.label === '2', mc: cd.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CANDS.forEach((cd, i) => {
    const b = h('button'); b.innerHTML = `${cd.label}<small>(${cd.p[0] < 0 ? '−' + -cd.p[0] : cd.p[0]}, ${cd.p[1]})</small>`;
    b.setAttribute('aria-label', `point ${cd.label}`);
    b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Twice as big, but from where?'), say_('q.intro'), html('p', '', T('q.ask')), cards, html('div', 'label', T('q.sure')), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example =====
function partExample(): void {
  tr.reset('e.');
  const k = (s: string) => tr.k('e.' + s);
  const v = viewOf(pic12({}), PLANE);
  const y0 = WB.y0;
  const L = [
    wline('e.L1', '\\cssId{b}{\\text{center}\\ O},\\ \\ \\cssId{a}{k = 2}', y0 + 100, 72, TG),
    wline('e.L2', 'C\' \\text{ is on ray } \\cssId{b}{OC}', y0 + 215, 68, TG),
    wline('e.L3', '\\cssId{s}{OC\'} = 2 \\cdot \\cssId{a}{OC}', y0 + 330, 68, TG),
    wline('e.L4', 'C(1,\\ 4) \\to \\cssId{s}{C\'(2,\\ 8)}', y0 + 445, 68, TG),
    wline('e.L5', '(x,\\ y) \\to \\cssId{s}{(2x,\\ 2y)}', y0 + 590, 72, TG),
    wline('e.L6', '\\dfrac{8}{4} = \\dfrac{4}{2} = \\cssId{s}{2}', y0 + 755, 72, TG),
    wline('e.L7', '\\text{every angle stays}', y0 + 890, 64),
  ];
  tr.jump('e.L1', 1);
  setScene({
    table: NOTABLE, lines: L, leads: [], boardBox: WB,
    model: c => {
      const g = k('grow');
      const p = pic12({ order: k('order') > 0.01, image: g >= 0.999 ? 1 : 0, wrongC: k('wrongC'), imgPts: k('pts') });
      const st: DState = { rays: k('rays'), bars: k('bars') * 3, grow: g < 0.999 ? g : 0, reveal: k('pts'), lab: { 0: k('lens'), 1: k('lens') }, show: { 1: g >= 0.999 ? 1 : 0 } };
      drawDilPic(c, v, p, st);
    },
  });
  let step = 0;
  const STEPS = [
    { t: 'Rays from the center', why: 'Each corner moves along its own ray from O.', act: 'Draw the rays' },
    { t: 'Twice as far along each ray', why: 'k = 2: double the distance from O.', act: 'Measure' },
    { t: 'Join the image', why: 'Connect A′, B′ and C′.', act: 'Join' },
    { t: 'Check what stays', why: 'Angles, order, and the ratio of every side.', act: 'Check' },
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
      if (i === 0) { tr.set('e.rays', 1, 1.6); await wait(1.4); if (!alive()) return; tr.set('e.L2', 1, 1.0); await wait(1.1); }
      else if (i === 1) {
        tr.set('e.bars', 1 / 3, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.L3', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.bars', 1, 2.2); await wait(2.3); if (!alive()) return;
        tr.set('e.pts', 1, 0.6); tr.set('e.wrongC', 1, 0.6, 0.3); tr.set('e.L4', 1, 1.0, 0.3); await wait(1.4);
      } else if (i === 2) {
        tr.set('e.bars', 0, 0.6); tr.set('e.grow', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); await wait(1.1);
      } else {
        tr.set('e.order', 1, 0.3); tr.set('e.lens', 1, 0.8); await wait(1.0); if (!alive()) return;
        tr.set('e.L6', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('e.L7', 1, 0.9); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The center is O, so C′ has to be on ray OC. Point 1 is not on that ray.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'Point 1 is too close to C; you should add 2 to each coordinate.', ok: false, id: 'e.w-add', mc: MC.additive as string | undefined },
      { t: 'The center of a dilation is always the middle of the figure.', ok: false, id: 'e.w-mid', mc: MC.middle as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, j) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, m) => { b.classList.remove('right', 'nope'); if (m === j) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is point 1, (−1, 5), not the image of C?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(say_('e.why', 'label', 'div'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: △PQR, k = ½ =====
const PQR: V[] = [[-6, 4], [-2, 4], [-6, -2]];
const PQR2: V[] = dilateAll(PQR, O, 0.5);                 // (−3, 2), (−1, 2), (−3, −1)
function partTurn(): void {
  tr.reset('t.');
  const k = (s: string) => tr.k('t.' + s);
  const base = (): DilPic => ({
    kind: 'plane', win: { x0: -8, y0: -3, x1: 2, y1: 6 }, axes: true,
    figs: [{ pts: PQR, role: 'first', labels: ['P', 'Q', 'R'], rights: [0], lens: [null, null, '6'] }, { pts: PQR2, role: 'link', labels: ['P′', 'Q′', 'R′'], rights: [0], lens: [null, null, '3'] }],
    center: { p: O, label: 'O' }, dil: { fig: 0, c: O, k: kk(1, 2), bars: [0, 1], labels: false },
    pts: [
      ...(k('pP') > 0 && k('grow') < 0.999 ? [{ p: PQR2[0]!, label: 'P′', role: 'link' as const }] : []),
      ...(k('pQ') > 0 && k('grow') < 0.999 ? [{ p: PQR2[1]!, label: 'Q′', role: 'link' as const }] : []),
    ],
  });
  const v = viewOf(base(), PLANE);
  const y0 = WB.y0;
  const L = [
    wline('t.L1', `\\cssId{b}{\\text{center}\\ O},\\ \\ \\cssId{a}{k = \\tfrac{1}{2}}`, y0 + 100, 72, TG),
    wline('t.L2', 'P(-6,\\ 4) \\to \\cssId{s}{P\'(-3,\\ 2)}', y0 + 230, 66, TG),
    wline('t.L3q', 'Q(-2,\\ 4) \\to Q\'\\,?', y0 + 350, 66, TG),
    wline('t.L3', 'Q(-2,\\ 4) \\to \\cssId{s}{Q\'(-1,\\ 2)}', y0 + 350, 66, TG),
    wline('t.L4', '(x,\\ y) \\to (\\tfrac{1}{2}x,\\ \\tfrac{1}{2}y)', y0 + 490, 68, TG),
    wline('t.L5', 'P\'R\' = \\tfrac{1}{2} \\cdot 6 = \\cssId{s}{3}', y0 + 630, 68, TG),
  ];
  setScene({
    table: NOTABLE, lines: L, leads: [], boardBox: WB,
    model: c => {
      const g = k('grow');
      drawDilPic(c, v, base(), { k: k('fig'), rays: k('rays'), bars: k('bars') * 2, grow: g < 0.999 ? g : 0, show: { 1: g >= 0.999 ? 1 : 0 }, lab: { 0: k('lens'), 1: k('lens') } });
    },
  });
  tr.set('t.fig', 1, 0.8); tr.set('t.L1', 1, 0.9, 0.6);
  let step = 0;
  const STEPS = [
    { t: 'Rays from the center', why: 'Done for you.' },
    { t: 'Half as far: P', why: 'Done for you.' },
    { t: 'Half as far: Q', why: 'Your step.' },
    { t: 'Check the image', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: half as far'), say_('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    tr.set('t.rays', 1, 1.4); await wait(1.6); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.bars', 0.5, 1.6); await wait(1.7); if (!alive()) return;
    tr.set('t.pP', 1, 0.5); tr.set('t.L2', 1, 1.0); work.replaceChildren(say_('t.p')); await wait(3.4); if (!alive()) return;
    step = 2; drawPlan(); askQ();
  });
  function askQ(): void {
    tr.set('t.L3q', 1, 0.8);
    const fbHost = h('div'), inp = pairInput('Q′ (', ',', () => check(), ')'), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fb(false, 't.q-no')); return; }
      const eq = (x: number, y: number) => Math.abs(r.x - x) < 1e-9 && Math.abs(r.y - y) < 1e-9;
      const right = eq(-1, 2);
      const mc = eq(-4, 8) ? MC.enlarge : eq(1, 2) ? MC.sign : eq(-1, 4) || eq(-2, 2) ? MC.oneStep : eq(-2, 4) ? MC.rigid : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.q', prompt: 'Dilate about O with k = 1/2: where does Q (−2, 4) land?', board: 'Q(−2, 4) → Q′?', response: [r.x, r.y], expected: [-1, 2], correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(fb(false, eq(-4, 8) ? 't.q-big' : eq(1, 2) ? 't.q-sign' : eq(-1, 4) || eq(-2, 2) ? 't.q-one' : eq(-2, 4) ? 't.q-same' : 't.q-no'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(fb(true, 't.q-ok'));
      seq(async alive => {
        tr.set('t.L3q', 0, 0.4); tr.set('t.bars', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('t.pQ', 1, 0.5); tr.set('t.L3', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('t.bars', 0, 0.5); tr.set('t.grow', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('t.L4', 1, 1.0); await wait(1.2); if (!alive()) return;
        step = 3; drawPlan(); askLen();
      });
    }
    work.replaceChildren(say_('t.q-ask'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askLen(): void {
    tr.set('t.lens', 0.5, 0.6);
    const fbHost = h('div'), inp = numInput('units', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.len-no')); return; }
      const right = Math.abs(r.v - 3) < 1e-9;
      const mc = r.v === 12 ? MC.enlarge : r.v === 6 ? MC.rigid : r.v === 5.5 || r.v === 4 ? MC.additive : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.len', prompt: 'PR = 6. How long is P′R′ (k = 1/2)?', board: 'P′R′ = ?', response: r.v, expected: 3, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fb(false, r.v === 12 ? 't.len-big' : r.v === 6 ? 't.len-same' : r.v === 5.5 || r.v === 4 ? 't.len-sub' : 't.len-no')); return; }
      ok.disabled = true;
      tr.set('t.lens', 1, 0.6); tr.set('t.L5', 1, 1.0);
      fbHost.replaceChildren(fb(true, 't.len-ok'));
      seq(async alive => { await wait(1.4); if (!alive()) return; askTrue(); });
    }
    work.replaceChildren(say_('t.len-ask'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askTrue(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Every side is half as long, and every angle is the same.', ok: true, id: 't.true-ok', mc: undefined as string | undefined },
      { t: 'Every side is 2 units shorter, and every angle is the same.', ok: false, id: 't.true-add', mc: MC.additive as string | undefined },
      { t: 'Every side and every angle is half as big.', ok: false, id: 't.true-ang', mc: MC.scalesAngles as string | undefined },
    ];
    let done = false;
    opts.forEach((o, j) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, m) => { b.classList.remove('right', 'nope'); if (m === j) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.true', prompt: 'Which is true for △P′Q′R′ (k = 1/2)?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true; step = 4; drawPlan();
      fbHost.append(callback());
    })));
    work.replaceChildren(say_('t.true-ask'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CANDS[pick]!;
    const id = cd ? cd.cb : 't.cb-none';
    c.append(html('p', '', T(id) + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    void ctx.say(id);
    return c;
  }
}

// ===== 4. Prove it: Riley's rectangles R (6 by 4) and S (9 by 5) =====
const R0: V[] = [[1, 1], [7, 1], [7, 5], [1, 5]];
const S0: V[] = [[1, 7], [10, 7], [10, 12], [1, 12]];
const R2: V[] = dilateAll(R0, [1, 1], 1.5);              // 9 by 6 at the same corner
const STRIP: V[] = [[1, 6], [10, 6], [10, 7], [1, 7]];
function partProve(): void {
  tr.reset('p.');
  const k = (s: string) => tr.k('p.' + s);
  const win = { x0: 0, y0: 0, x1: 11, y1: 13 };
  const pic = (): DilPic => {
    const dy = -6 * k('slide');
    const S = S0.map(q => [q[0], q[1] + dy] as V);
    const figs: DFig[] = [
      { pts: R0, role: 'first', tag: 'R', lens: ['6', '4', null, null], rights: [0, 1, 2, 3] },
      { pts: S, role: 'pick', tag: 'S', lens: k('slide') > 0.98 ? ['9', null, null, '5'] : ['9', '5', null, null], rights: [0, 1, 2, 3] },
      { pts: R2, role: 'link', dashed: true, lens: [null, '6', null, null] },
      { pts: STRIP, role: 'wrong' },
    ];
    return { kind: 'plane', win, axes: false, figs, dil: { fig: 0, c: [1, 1], k: kk(3, 2), labels: false } };
  };
  const v = viewOf(pic(), PLANE);
  const y0 = WB.y0;
  const L1 = wline('p.L1', '\\text{Riley:}\\ \\cssId{a}{R} \\sim \\cssId{p}{S}', y0 + 110, 80, TG);
  const L2 = wline('p.L2', '\\dfrac{9}{6} = \\dfrac{3}{2}', y0 + 330, 76);
  const L3 = wline('p.L3', '\\dfrac{5}{4} \\ne \\dfrac{3}{2}', y0 + 520, 76, undefined, 'wrong');
  const L4 = wline('p.L4', '\\cssId{a}{R} \\not\\sim \\cssId{p}{S}', y0 + 740, 88, TG);
  const extra = (c: Canvas) => {
    const ks = k('strike');
    if (ks > 0) { const b0 = partOf(L1, 'a'), b1 = partOf(L1, 'p'); strike(c, b0.x0 - 14, b0.cy + 6, b1.x1 + 14, b1.cy - 6, ks, { col: 'wrong' }); }
  };
  setScene({
    table: NOTABLE, lines: [L1, L2, L3, L4], leads: [], boardBox: WB, extra,
    model: c => {
      const g = k('grow');
      drawDilPic(c, v, pic(), { k: k('fig'), grow: g < 0.999 ? g : 0, show: { 0: 1 - k('slide'), 2: g >= 0.999 ? 1 : 0, 3: k('strip') }, rays: 0 });
    },
  });
  tr.set('p.fig', 1, 0.9); tr.set('p.L1', 1, 0.9, 0.8);
  const CHIPS = [
    { t: 'A dilation multiplies every length by the same k, and slides, turns and flips keep lengths.', fits: 0 },
    { t: `Dilating R by ${THREE_HALVES} makes it 9 by 6: it overhangs S by a strip 1 unit tall.`, fits: 1 },
    { t: 'Equal angles are not enough for four-sided shapes: the side ratios must match too.', fits: 2 },
    { t: 'Every rectangle has four right angles, so all rectangles are similar.', fits: -1, mc: MC.equalAngles, id: 'p.no-angles' },
    { t: '9 − 6 = 3 but 5 − 4 = 1: the sides grew by different amounts.', fits: -1, mc: MC.addKeep, id: 'p.no-diff' },
    { t: `The long sides match with k = ${THREE_HALVES}, and one pair of sides is enough.`, fits: -1, mc: MC.oneRatio, id: 'p.no-one' },
  ];
  const CLAIMS = [
    'If R and S were similar, one scale factor k would take every side of R to its partner,',
    `The long sides need k = 9/6 = ${THREE_HALVES}, but ${THREE_HALVES} of R’s short side is 6, not 5,`,
    'So R and S are <b>not similar</b>, even though every angle matches,',
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
    if (ch.fits !== filled) { fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fb(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) { tr.set('p.grow', 1, 2.0); await wait(2.1); }
      if (n === 2) {
        tr.set('p.L2', 1, 1.0); tr.set('p.slide', 1, 1.8, 0.3); await wait(2.2); if (!alive()) return;
        tr.set('p.strip', 1, 0.7); tr.set('p.L3', 1, 1.0, 0.3); await wait(1.4);
      }
      if (n === 3) {
        tr.set('p.strike', 1, 0.6); tr.set('p.L4', 1, 1.1, 0.5); await wait(1.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: R (6 by 4) and S (9 by 5) both have four right angles, so they are similar. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.equalAngles : undefined });
    proofHost.replaceChildren(say_(right ? 'p.build-test' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const one = ctx.qs.get('item');
  if (one) { reviewItem(one); return; }
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as DItem),
  });
}
/** review aid: one item of one family (family:subgoal:seed), its prompt, choices and worked solution */
function reviewItem(spec: string): void {
  const [fam, sg, sd] = spec.split(':');
  const it = GENERATORS[fam!]!(rng(Number(sd ?? 1)), 1, sg) as DItem;
  it.subgoal = sg;
  const view = showItem(it);
  (window as unknown as { __practiceItem: unknown }).__practiceItem = it;
  setPanel(h('h2', {}, FAMILY_NAMES[fam!] ?? fam!), html('p', '', it.prompt),
    ...(it.choices ? [h('div', { class: 'opts' }, ...it.choices.map((c, i) => { const b = h('button', i === (it.answer as { i: number }).i ? { class: 'right' } : {}); b.innerHTML = c; return b; }))] : [html('p', 'dim', `answer: ${JSON.stringify(it.answer)}`)]),
    solutionList(it.solution));
  if (ctx.qs.has('solve') && view.solve) seq(view.solve);
}
function showItem(item: DItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const v = viewOf(pic, PLANE);
  const lines: Line[] = item.board ? [wline('x.T0', item.board, WB.y0 + 120, 72)] : [];
  const k = (s: string) => tr.k('x.' + s);
  const growing = !!pic.dil && !pic.dil.given;
  const nb = pic.dil?.bars?.length ?? 0;
  setScene({
    table: NOTABLE, lines, leads: [], boardBox: WB,
    model: c => drawDilPic(c, v, pic, { k: k('in'), rays: k('rays'), bars: k('bars') * nb, grow: k('grow'), seqK: k('seq'), simK: k('sim'), reveal: k('reveal'), ring: k('ring'), hi: k('hi') }),
  });
  tr.set('x.in', 1, 0.7);
  lines.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.3 + i * 0.4));
  return {
    solve: async alive => {
      for (const L of lines) tr.set(L.key + ':dim', 1, 0.4);
      if (growing) {
        tr.set('x.rays', 1, 1.1); await wait(1.1); if (!alive()) return;
        if (nb) { tr.set('x.bars', 1, 1.6 * nb); await wait(1.6 * nb + 0.1); if (!alive()) return; }
        tr.set('x.grow', 1, 1.5); await wait(1.6); if (!alive()) return;
      } else if (pic.seq) {
        const n = pic.seq.moves.length;
        tr.set('x.seq', 1, 1.6 * n); await wait(1.6 * n + 0.2); if (!alive()) return;
        if (pic.seq.to !== undefined) { tr.set('x.ring', 1, 1.2); await wait(1.2); if (!alive()) return; }
      } else if (pic.sim) {
        tr.set('x.sim', 1, 2.6); await wait(2.7); if (!alive()) return;
        tr.set('x.ring', 1, 1.0); await wait(1.0); if (!alive()) return;
      }
      tr.set('x.hi', 1, 0.7); tr.set('x.reveal', 1, 0.9);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{center}\\ O,\\ \\ k = 2', '(x,\\ y) \\to (2x,\\ 2y)', '\\dfrac{8}{4} = \\dfrac{4}{2} = 2', '\\triangle ABC \\sim \\triangle DEF', 'R \\not\\sim S', '\\tfrac{1}{2}', '\\ne'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
