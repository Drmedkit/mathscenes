// congruence.ts: "Congruence via transformations" (grade 8, 8.G.A.2) on the shared lesson runtime.
//   1 The question   floor tiles cut from a template triangle: which tile can a tracing cover exactly? Tile 1 looks
//                    alike but one side is a unit longer, tile 2 is the template flipped and slid; Tile 1 / Tile 2 /
//                    Both + how sure
//   2 Worked example Match the corners -> Flip -> Slide -> Check every corner; the tracing paper carries the template
//                    onto tile 2, the board writes each step beside it with leaders; one "why is this a proof?"
//   3 Your turn      a new pair: corners matched and the turn are given, the kid types the slide (counted from A′, not
//                    from A) and picks the check that proves it; the callback to part 1
//   4 Prove it       Jordan: "6 by 2 and 4 by 3 both cover 12 squares, so they are congruent"; a because-chain from
//                    reason chips (side lengths are invariant), the tracing backs each line
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/congruence/script.ts (panel HTML) = voice/lines.json (spoken text).
// Review aid: congruence.html?open&part=4&item=<family>:<subgoal>:<seed>[&solve] shows one practice item.
import type { Canvas } from '../../src/core/draw';
import { strike } from '../../src/core/draw';
import { type Box, box, clamp } from '../../src/core/math';
import { E } from '../../src/core/easing';
import { tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, pairInput, solutionList } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { rng } from '../../src/lesson/runtime/item';
import { leader } from '../../src/lesson/annotate';
import { FAMILY_NAMES, GENS, MC, type CongItem, type FamilyId } from '../../src/lesson/topics/congruence/items';
import { PLAN } from '../../src/lesson/topics/congruence/plan';
import { LINES } from '../../src/lesson/topics/congruence/script';
import { type CongPic, type Move, type V, type Win, flipY, mapPts, mv, seqAt, slide, turn } from '../../src/lesson/topics/congruence/congMaths';
import {
  type PView, type PanelState, addPoly, drawCongPic, drawCorners, drawLens, drawLetters, drawMirror, drawOrder, drawPanels, drawPin,
  drawPlane, drawRight, drawShape, drawTracing, drawTurnArc, letter, newClear, planeView, px, pxs, vertexBox,
} from '../../src/lesson/topics/congruence/TraceBoard';
import { arrow } from '../../src/core/draw';

const SLUG = 'congruence';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const T = (id: string) => LINES[id]?.html ?? id;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { void ctx.say(id); return html(tag, cls, T(id)); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, T(id), extra); };
const NOTABLE = 1080;

// ---------- the layout: the plane on the left, a wide notation board on the right ----------
const PLANE = box(30, 60, 1030, 1020);
const WB = box(1070, 70, 1860, 1010), WX = WB.x0 + 50, WW = WB.w - 100;
const WIDE = box(180, 50, 1740, 1030);
/** a line of TeX on the wide board (shrinks to fit, never below 56 px) */
function wline(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src);
  let s = size;
  while (s > 56 && texWidth(F, s) > WW) s -= 2;
  return { key, F, x: WX, y, size: s, tags, col };
}
interface WLead { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
/** leaders from the wide board: under the symbol, along a rail, out of the board's left edge, into the picture */
function drawLeads(c: Canvas, L: readonly WLead[]): void {
  for (const d of L) {
    const k = tr.k(d.key);
    if (k > 0) leader(c, d.from(), d.to(), { col: d.col, k, boardX: WB.x0, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') });
  }
}
const TAGS = { a: { col: 'first' as Paint }, b: { col: 'first' as Paint }, c: { col: 'first' as Paint }, d: { col: 'pick' as Paint }, e: { col: 'pick' as Paint }, f: { col: 'pick' as Paint }, m: { col: 'second' as Paint }, s: { col: 'link' as Paint }, w: { col: 'ink' as Paint } };

// ======================================================================================================
// Parts 1 and 2: the template ABC, tile 1 (a near miss: the long side is 5, not 4), tile 2 (= flip over the y-axis,
// then slide 6 down). Corners A -> B -> C counterclockwise; D -> E -> F clockwise.
const TPL: V[] = [[-6, 2], [-2, 2], [-6, 5]];
const TILE1: V[] = [[1, 2], [6, 2], [1, 5]];
const SEQ2: Move[] = [flipY, slide(0, -6)];
const TILE2: V[] = mapPts(SEQ2, TPL);
const WIN12: Win = { x0: -7, y0: -6, x1: 7, y1: 6 };
const Q_CARDS = [
  { label: 'Tile 1', mc: MC.flipNot, cb: 't.cb-one' },
  { label: 'Tile 2', mc: '', cb: 't.cb-right' },
  { label: 'Both', mc: MC.looks, cb: 't.cb-both' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const v = planeView(WIN12, WIDE, true);
  const p: CongPic = { kind: 'plane', win: WIN12, axes: true, figs: [
    { pts: TPL, role: 'first', labels: ['A', 'B', 'C'] },
    { pts: TILE1, role: 'pick', tag: '1' },
    { pts: TILE2, role: 'pick', tag: '2' },
  ] };
  setScene({ table: NOTABLE, lines: [], leads: [], boardBox: null, model: c => drawCongPic(c, v, p, { k: tr.k('q.fig') }) });
  tr.set('q.fig', 1, 1.0);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const q = Q_CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Floor tiles from a template triangle ABC: which tile can a tracing (slide, turn, flip) cover exactly?', response: q.label, expected: 'Tile 2', correct: q.label === 'Tile 2', mc: q.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  Q_CARDS.forEach((cd, i) => {
    const b = h('button'); b.innerHTML = i < 2 ? `${i + 1}<small>tile</small>` : `1 and 2<small>both tiles</small>`;
    b.setAttribute('aria-label', cd.label);
    b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Exact copies'), say_('q.intro'), html('p', '', T('q.ask')), cards, html('div', 'label', T('q.sure')), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: template ABC onto tile 2 =====
function partExample(): void {
  tr.reset('e.');
  const v = planeView(WIN12, PLANE, true);
  const k = (s: string) => tr.k('e.' + s);
  const y0 = WB.y0;
  const L1 = wline('e.L1', '\\cssId{a}{A} \\to \\cssId{d}{D},\\ \\ \\cssId{b}{B} \\to \\cssId{e}{E},\\ \\ \\cssId{c}{C} \\to \\cssId{f}{F}', y0 + 105, 74, TAGS);
  const L2 = wline('e.L2', '\\cssId{m}{\\text{flip over the}\\ y\\text{-axis}}', y0 + 255, 68, TAGS);
  const L3 = wline('e.L3', '\\cssId{s}{A\'}\\,(6,\\ 2)', y0 + 360, 68, { s: { col: 'first' } });
  const L4 = wline('e.L4', '\\cssId{m}{\\text{slide 6 down}}', y0 + 510, 68, TAGS);
  const L5 = wline('e.L5', '\\cssId{s}{A\'\'}\\,(6,\\ {-4}) = \\cssId{d}{D}', y0 + 615, 68, { s: { col: 'first' }, d: { col: 'pick' } });
  const L6 = wline('e.L6', '\\triangle ABC \\cong \\triangle DEF', y0 + 800, 88, undefined, 'link');
  const leads: WLead[] = [
    { key: 'e.ldA', from: () => partOf(L3, 's'), to: () => vertexBox(v, [6, 2]), col: 'first' },
    { key: 'e.ldD', from: () => partOf(L5, 'd'), to: () => vertexBox(v, TILE2[0]!), col: 'pick' },
  ];
  setScene({
    table: NOTABLE, lines: [L1, L2, L3, L4, L5, L6], leads: [], boardBox: WB,
    model: c => {
      drawPlane(c, v);
      const cl = newClear();
      const [OX, OY] = px(v, [0, 0]);
      cl.segs.push([[v.box.x0, OY], [v.box.x1, OY]], [[OX, v.box.y0], [OX, v.box.y1]]);
      for (const P of [TPL, TILE1, TILE2]) addPoly(cl, pxs(v, P));
      // the leaders from the board end on the right of A′ (6, 2) and of D: their letters go elsewhere
      for (const q of [[6, 2], TILE2[0]!] as V[]) { const [x, y] = px(v, q); cl.boxes.push(box(x + 4, y - 26, x + 74, y + 26)); }
      if (k('axis') > 0) drawMirror(c, v, { kind: 'v', x: 0 }, undefined, k('axis') * (1 - 0.6 * k('axisDim')), cl, 1 - k('axisDim'));
      const s = E.smooth(k('flip')) + E.smooth(k('slide'));
      const moving = s > 0;
      drawShape(c, v, TPL, 'first', { alpha: moving ? 0.5 : 1, seed: 4 }); drawCorners(c, v, TPL, 'first', moving ? 0.5 : 1);
      drawLetters(c, v, TPL, ['A', 'B', 'C'], 'first', moving ? 0.6 : 1, cl);
      const t1 = 1 - k('t1');
      if (t1 > 0) { drawShape(c, v, TILE1, 'pick', { alpha: t1, seed: 6 }); const m = pxs(v, TILE1); letter(c, '1', (m[0]![0] + m[1]![0] + m[2]![0]) / 3, (m[0]![1] + m[1]![1] + m[2]![1]) / 3, 'ink', t1, 56, 750); }
      const landed = k('land');
      drawShape(c, v, TILE2, 'pick', { seed: 6 }); drawCorners(c, v, TILE2, 'pick');
      if (k('def') <= 0) { const m = pxs(v, TILE2); letter(c, '2', (m[0]![0] + m[1]![0] + m[2]![0]) / 3, (m[0]![1] + m[1]![1] + m[2]![1]) / 3, 'ink', 1, 56, 750); }
      drawLetters(c, v, TILE2, ['D', 'E', 'F'], 'pick', k('def'), cl);
      if (k('lens') > 0) {
        drawRight(c, v, TPL, 0, 'first', k('lens')); drawRight(c, v, TILE2, 0, 'pick', k('lens'));
        drawLens(c, v, TPL, ['4', null, '3'], 'first', k('lens'), cl); drawLens(c, v, TILE2, ['4', null, '3'], 'pick', k('lens'), cl);
      }
      if (k('ord') > 0) { drawOrder(c, v, TPL, 'first', k('ord'), 1 - 0.7 * k('ordDim')); drawOrder(c, v, TILE2, 'pick', k('ord'), 1 - 0.7 * k('ordDim')); }
      // the tracing
      if (k('trace') > 0) {
        if (s >= 1) drawShape(c, v, mapPts([flipY], TPL), 'first', { dashed: true, alpha: 0.5 * (1 - landed) });
        drawTracing(c, v, TPL, SEQ2, s, k('trace'));
        const Q = TPL.map(p => seqAt(SEQ2, p, s));
        const col: Paint = landed > 0 ? 'link' : 'first';
        drawShape(c, v, Q, col, { alpha: 0.95 * k('trace'), seed: 8 }); drawCorners(c, v, Q, col, k('trace'));
        if (s >= 1 && s < 1.02 + 0.98 * (1 - k('slide'))) drawLetters(c, v, Q, ['A′', 'B′', 'C′'], 'first', clamp((s - 0.98) * 50) * (1 - k('slide')), cl);
      }
      if (k('arrow') > 0) arrow(c, [px(v, [6, 2]), px(v, TILE2[0]!)], E.inOut(k('arrow')), { col: 'second', lw: 5, head: 22, alpha: 1 - k('arrowDim') });
      // the check: rings on D, E, F
      TILE2.forEach((q, i) => {
        const kk = clamp(k('ring') * 3 - i);
        if (kk <= 0) return;
        const [x, y] = px(v, q);
        const { g } = c; g.save(); g.globalAlpha *= kk; g.lineWidth = 5; g.strokeStyle = '#D8F5B0'; g.beginPath(); g.arc(x, y, 20, 0, Math.PI * 2); g.stroke(); g.restore();
      });
    },
    extra: c => drawLeads(c, leads),
  });

  let step = 0;
  const STEPS = [
    { t: 'Match the corners', why: 'Partners have the same sides and angles.', act: 'Match them' },
    { t: 'Flip', why: 'Only a flip reverses the way round.', act: 'Flip it' },
    { t: 'Slide', why: 'From A′ straight to D.', act: 'Slide it' },
    { t: 'Check every corner', why: 'Every corner on its partner?', act: 'Check it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.t1', 1, 0.8); await wait(0.6); if (!alive()) return;
        tr.set('e.lens', 1, 0.8); tr.set('e.def', 1, 0.8, 0.3); await wait(1.2); if (!alive()) return;
        tr.set('e.L1', 1, 1.4); await wait(1.5);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.6); tr.set('e.lens', 0.35, 0.6);
        tr.set('e.ord', 1, 1.2); await wait(1.6); if (!alive()) return;
        tr.set('e.ordDim', 1, 0.6); tr.set('e.axis', 1, 0.6); tr.set('e.trace', 1, 0.5); await wait(0.6); if (!alive()) return;
        tr.set('e.flip', 1, 2.2); await wait(2.4); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); tr.set('e.L3', 1, 0.9, 0.7); tr.set('e.ldA', 1, 0.9, 1.6); await wait(2.6);
      } else if (i === 2) {
        tr.set('e.ldA', 0, 0.4); tr.set('e.L2:dim', 1, 0.6); tr.set('e.L3:dim', 1, 0.6); tr.set('e.axisDim', 1, 0.6);
        tr.set('e.arrow', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.slide', 1, 1.8); await wait(2.0); if (!alive()) return;
        tr.set('e.arrowDim', 1, 0.6); tr.set('e.L4', 1, 0.9); tr.set('e.L5', 1, 0.9, 0.7); tr.set('e.ldD', 1, 0.9, 1.6); await wait(2.6);
      } else {
        tr.set('e.ldD', 0, 0.4); tr.set('e.L4:dim', 1, 0.6); tr.set('e.L5:dim', 1, 0.6);
        tr.set('e.ring', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.land', 1, 0.8); tr.set('e.L6', 1, 1.2, 0.3); await wait(1.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { id: 'e.w-ok', t: 'The tracing only moved, it never stretched, and every corner landed on its partner.', ok: true, mc: undefined as string | undefined },
      { id: 'e.w-look', t: 'Tile 2 looks just like the template.', ok: false, mc: MC.looks },
      { id: 'e.w-one', t: 'Corner A landed on D.', ok: false, mc: MC.partial },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does the flip and slide prove the tiles are congruent?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    void ctx.say('e.s4').then(() => ctx.say('e.why'));
    after.replaceChildren(html('div', 'label', T('e.why')), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: a turn about the origin, then a slide (faded from the end) =====
const T3: V[] = [[1, 1], [4, 1], [2, 4]];
const SEQ3: Move[] = [turn(1), slide(2, -5)];
const D3: V[] = mapPts(SEQ3, T3);
const MID3: V[] = mapPts([SEQ3[0]!], T3);
const WIN3: Win = { x0: -5, y0: -5, x1: 5, y1: 5 };
function partTurn(): void {
  tr.reset('t.');
  if (!(D3[0]![0] === 1 && D3[0]![1] === -4 && MID3[0]![0] === -1 && MID3[0]![1] === 1)) throw new Error('your turn: D must be (1, -4) and A′ (-1, 1)');
  const v = planeView(WIN3, PLANE, true);
  const k = (s: string) => tr.k('t.' + s);
  const y0 = WB.y0;
  const L1 = wline('t.L1', '\\cssId{a}{A} \\to \\cssId{d}{D},\\ \\ \\cssId{b}{B} \\to \\cssId{e}{E},\\ \\ \\cssId{c}{C} \\to \\cssId{f}{F}', y0 + 105, 74, TAGS);
  const L2 = wline('t.L2', '\\cssId{m}{\\text{turn}\\ 90^\\circ \\circlearrowleft\\ \\text{about}\\ O}', y0 + 255, 68, TAGS);
  const L3 = wline('t.L3', '\\cssId{s}{A\'}\\,({-1},\\ 1)', y0 + 360, 68, { s: { col: 'first' } });
  const L4 = wline('t.L4', '\\cssId{m}{(x,\\ y) \\to (x + 2,\\ y - 5)}', y0 + 510, 68, TAGS);
  const L5 = wline('t.L5', '\\triangle ABC \\cong \\triangle DEF', y0 + 760, 88, undefined, 'link');
  setScene({
    table: NOTABLE, lines: [L1, L2, L3, L4, L5], leads: [], boardBox: WB,
    model: c => {
      drawPlane(c, v);
      const cl = newClear();
      const [OX, OY] = px(v, [0, 0]);
      cl.segs.push([[v.box.x0, OY], [v.box.x1, OY]], [[OX, v.box.y0], [OX, v.box.y1]]);
      for (const P of [T3, D3]) addPoly(cl, pxs(v, P));
      const s = E.smooth(k('turn')) + E.smooth(k('slide'));
      drawShape(c, v, T3, 'first', { alpha: s > 0 ? 0.5 : 1, seed: 4 }); drawCorners(c, v, T3, 'first', s > 0 ? 0.5 : 1);
      drawLetters(c, v, T3, ['A', 'B', 'C'], 'first', s > 0 ? 0.6 : 1, cl);
      drawShape(c, v, D3, 'pick', { seed: 6 }); drawCorners(c, v, D3, 'pick');
      drawLetters(c, v, D3, ['D', 'E', 'F'], 'pick', 1, cl);
      if (k('ord') > 0) { drawOrder(c, v, T3, 'first', k('ord'), 1 - 0.7 * k('ordDim')); drawOrder(c, v, D3, 'pick', k('ord'), 1 - 0.7 * k('ordDim')); }
      if (k('pin') > 0) { drawPin(c, v, [0, 0], undefined, k('pin') * (1 - 0.5 * k('pinDim')), cl, 1 - k('pinDim')); }
      if (k('arc') > 0) drawTurnArc(c, v, [0, 0], T3[1]!, 1, k('arc'), 1 - k('pinDim'));
      if (k('trace') > 0) {
        if (s >= 1) drawShape(c, v, MID3, 'first', { dashed: true, alpha: 0.5 * (1 - k('land')) });
        drawTracing(c, v, T3, SEQ3, s, k('trace'));
        const Q = T3.map(p => seqAt(SEQ3, p, s));
        const col: Paint = k('land') > 0 ? 'link' : 'first';
        drawShape(c, v, Q, col, { alpha: 0.95 * k('trace'), seed: 8 }); drawCorners(c, v, Q, col, k('trace'));
        if (s >= 1 && k('slide') <= 0) drawLetters(c, v, Q, ['A′', 'B′', 'C′'], 'first', clamp((s - 0.98) * 50), cl);
      }
      if (k('arrow') > 0) arrow(c, [px(v, MID3[0]!), px(v, D3[0]!)], E.inOut(k('arrow')), { col: 'second', lw: 5, head: 22, alpha: 1 - k('arrowDim') });
      if (k('wrongArrow') > 0) arrow(c, [px(v, T3[0]!), px(v, D3[0]!)], E.inOut(k('wrongArrow')), { col: 'wrong', lw: 5, head: 22, alpha: 1 - k('wrongDim') });
      if (k('ringA') > 0) { const [x, y] = px(v, MID3[0]!); const { g } = c; g.save(); g.globalAlpha *= k('ringA'); g.lineWidth = 5; g.strokeStyle = '#FFD79A'; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.stroke(); g.restore(); }
      D3.forEach((q, i) => {
        const kk = clamp(k('ring') * 3 - i);
        if (kk <= 0) return;
        const [x, y] = px(v, q);
        const { g } = c; g.save(); g.globalAlpha *= kk; g.lineWidth = 5; g.strokeStyle = '#D8F5B0'; g.beginPath(); g.arc(x, y, 20, 0, Math.PI * 2); g.stroke(); g.restore();
      });
    },
  });

  let step = 0;
  const STEPS = [
    { t: 'Match the corners', why: 'Done for you.' },
    { t: 'Turn', why: 'Done for you.' },
    { t: 'Slide', why: 'Your step.' },
    { t: 'Check every corner', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Turn, then slide'), say_('t.intro'), plan, work);

  seq(async alive => {
    await wait(1.0); if (!alive()) return;
    tr.set('t.ord', 1, 1.1); tr.set('t.L1', 1, 1.2, 0.3); await wait(1.8); if (!alive()) return;
    work.replaceChildren(html('p', 'dim', T('t.match'))); void ctx.say('t.match');
    tr.set('t.ordDim', 1, 0.6); tr.set('t.L1:dim', 1, 0.6); step = 1; drawPlan();
    await wait(1.0); if (!alive()) return;
    tr.set('t.pin', 1, 0.5); tr.set('t.arc', 1, 1.0, 0.3); tr.set('t.trace', 1, 0.5); await wait(1.3); if (!alive()) return;
    tr.set('t.turn', 1, 2.2); await wait(2.4); if (!alive()) return;
    tr.set('t.L2', 1, 1.0); tr.set('t.L3', 1, 0.9, 0.7); tr.set('t.ringA', 1, 0.5, 0.8); await wait(2.6); if (!alive()) return;
    work.append(say_('t.turn'));
    step = 2; drawPlan(); askSlide();
  });

  function askSlide(): void {
    const fbHost = h('div');
    let done = false;
    const check = btn('Check', () => submit(), 'go');
    const inp = pairInput('(x, y) → (x +', ', y +', () => submit(), ')');
    function submit(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Fill in both numbers first.')); return; }
      const ok = r.x === 2 && r.y === -5, orig = r.x === 0 && r.y === -5, back = r.x === -2 && r.y === 5;
      const id = ok ? 't.slide-ok' : orig ? 't.slide-orig' : back ? 't.slide-back' : 't.slide-other';
      ctx.store.log({ part: 'turn', item: 'turn.slide', prompt: 'After the turn, A′ is at (-1, 1). The slide takes A′ to D (1, -4): (x, y) -> (x + ?, y + ?)', response: { x: r.x, y: r.y }, expected: { x: 2, y: -5 }, correct: ok, mc: orig ? MC.toOriginal : undefined });
      fbHost.replaceChildren(fb(ok, id));
      if (orig) { tr.jump('t.wrongDim', 0); tr.set('t.wrongArrow', 1, 0.9); }
      if (!ok) return;
      done = true; check.disabled = true;
      seq(async alive => {
        tr.set('t.wrongDim', 1, 0.4); tr.set('t.ringA', 0, 0.4); tr.set('t.L2:dim', 1, 0.5); tr.set('t.L3:dim', 1, 0.5); tr.set('t.pinDim', 1, 0.5);
        tr.set('t.arrow', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.slide', 1, 1.8); await wait(2.0); if (!alive()) return;
        tr.set('t.arrowDim', 1, 0.6); tr.set('t.L4', 1, 1.0); await wait(1.2); if (!alive()) return;
        step = 3; drawPlan(); askCheck();
      });
    }
    work.replaceChildren(say_('t.slide-ask'), inp.node, h('div', { class: 'row' }, check), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function askCheck(): void {
    const fbHost = h('div');
    const opts = [
      { id: 't.k-two', t: 'A″ is on D and B″ is on E, so C″ must be on F.', ok: false, mc: MC.twoVertices as string | undefined },
      { id: 't.k-ok', t: 'A″ is on D, B″ on E and C″ on F: every corner on its partner.', ok: true, mc: undefined },
      { id: 't.k-one', t: 'A″ is on D, so the rest follows.', ok: false, mc: MC.partial },
    ];
    const bx = h('div', { class: 'opts' });
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'The tracing has landed. Which check proves triangle ABC is congruent to triangle DEF?', response: o.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      step = 4; drawPlan();
      seq(async alive => {
        tr.set('t.L4:dim', 1, 0.5); tr.set('t.ring', 1, 1.8); await wait(1.9); if (!alive()) return;
        tr.set('t.land', 1, 0.6); tr.set('t.L5', 1, 1.1, 0.2); await wait(1.6); if (!alive()) return;
        fbHost.append(callback());
      });
    })));
    work.replaceChildren(say_('t.check-ask'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick;
    const id = pick === null ? 't.cb-none' : Q_CARDS[pick]!.cb;
    c.innerHTML = (pick === null ? '' : `At the start you picked <b>${Q_CARDS[pick]!.label.toLowerCase()}</b> and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + T(id);
    void ctx.say(id);
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Jordan's rectangles (same area, not congruent) =====
const RP: V[] = [[0, 1], [6, 1], [6, 3], [0, 3]];
const RQ: V[] = [[8, 1], [12, 1], [12, 4], [8, 4]];
const WIN4: Win = { x0: -1, y0: -2, x1: 15, y1: 8 };
const TRY0: Move[] = [turn(1, [3, 2])];                 // the tracing turns: its sides stay 6 and 2
const TRY1: Move[] = [slide(8, 0)];                     // onto Q along the bottom: 2 units stick out to the right
const TRY2: Move[] = [turn(1, [3, 2]), slide(6, 2)];    // standing up on Q: 3 units stick out at the top
function partProve(): void {
  tr.reset('p.');
  const v = planeView(WIN4, PLANE, false);
  const y0 = WB.y0;
  const J = wline('p.J', '\\text{Jordan:}\\ P \\cssId{w}{\\cong} Q', y0 + 110, 84, TAGS);
  const C1 = wline('p.C1', '\\text{moves keep every length}', y0 + 280, 66, undefined, 'link');
  const C2 = wline('p.C2', '\\cssId{a}{P\\colon 6,\\,2,\\,6,\\,2}\\qquad \\cssId{d}{Q\\colon 4,\\,3,\\,4,\\,3}', y0 + 420, 66, TAGS);
  const H = wline('p.hero', '\\text{area } 12 \\text{, but}\\ P \\not\\cong Q', y0 + 640, 80, undefined, 'link');
  /** the part of the rectangle R that sticks out of Q (axis-aligned rectangles) */
  const outside = (P: V[]): V[][] => {
    const xs = P.map(p => p[0]), ys = P.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), yy0 = Math.min(...ys), y1 = Math.max(...ys);
    const out: V[][] = [];
    if (x1 > 12) out.push([[Math.max(12, x0), yy0], [x1, yy0], [x1, y1], [Math.max(12, x0), y1]]);
    if (y1 > 4) out.push([[x0, Math.max(4, yy0)], [Math.min(x1, 12), Math.max(4, yy0)], [Math.min(x1, 12), y1], [x0, y1]]);
    return out;
  };
  const tracing = (moves: Move[], kk: number, a: number, labels: boolean, over = true) => (c: Canvas) => {
    if (a <= 0 || kk <= 0) return;
    const s = E.smooth(kk) * moves.length;
    drawTracing(c, v, RP, moves, s, a);
    const Q = RP.map(p => seqAt(moves, p, s));
    drawShape(c, v, Q, 'first', { alpha: 0.85 * a, seed: 8 });
    if (labels) { const cl = newClear(); addPoly(cl, pxs(v, Q)); drawLens(c, v, Q, ['6', null, null, '2'], 'first', a, cl); }
    if (over && kk >= 1) for (const o of outside(Q)) drawShape(c, v, o, 'wrong', { alpha: a, seed: 13 });
  };
  setScene({
    table: NOTABLE, lines: [J, C1, C2, H], leads: [], boardBox: WB,
    model: c => {
      drawPlane(c, v);
      const cl = newClear();
      addPoly(cl, pxs(v, RP)); addPoly(cl, pxs(v, RQ));
      const pa = 1 - 0.45 * clamp(tr.k('p.t0') + tr.k('p.t1') + tr.k('p.t2'));
      drawShape(c, v, RP, 'first', { seed: 4, alpha: pa }); drawCorners(c, v, RP, 'first', pa);
      drawShape(c, v, RQ, 'pick', { seed: 6 }); drawCorners(c, v, RQ, 'pick');
      const mp = pxs(v, RP), mq = pxs(v, RQ);
      letter(c, 'P', (mp[0]![0] + mp[2]![0]) / 2, (mp[0]![1] + mp[2]![1]) / 2, 'ink', pa, 56, 750);
      letter(c, 'Q', (mq[0]![0] + mq[2]![0]) / 2, (mq[0]![1] + mq[2]![1]) / 2, 'ink', 1, 56, 750);
      const kl = tr.k('p.lens');
      if (kl > 0) {
        drawLens(c, v, RP, ['6', null, null, '2'], 'first', kl, cl); drawLens(c, v, RQ, ['4', '3', null, null], 'pick', kl, cl);
        const g6 = tr.k('p.glow6');
        if (g6 > 0) for (const [a, b] of [[RP[0]!, RP[1]!], [RP[2]!, RP[3]!]] as [V, V][]) { const A = px(v, a), B = px(v, b); c.g.save(); c.g.globalAlpha *= 0.35 * g6; c.g.lineWidth = 16; c.g.lineCap = 'round'; c.g.strokeStyle = '#FFBE5C'; c.g.beginPath(); c.g.moveTo(A[0], A[1]); c.g.lineTo(B[0], B[1]); c.g.stroke(); c.g.restore(); }
      }
      tracing(TRY0, tr.k('p.t0'), 1 - tr.k('p.t0off'), true, false)(c);
      tracing(TRY1, tr.k('p.t1'), 1 - tr.k('p.t1off'), false)(c);
      tracing(TRY2, tr.k('p.t2'), 1, false)(c);
    },
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.J', 1, 1.0, 0.6);

  // shown in this order: the reasons mixed with the two distractors
  const CHIPS = [
    { t: 'Every sequence would have to put P’s 6-unit side on a 6-unit side of Q.', fits: 2 },
    { t: 'Both cover 12 squares, so they are the same size.', fits: -1, mc: MC.areaPerim, id: 'p.x-area' },
    { t: 'Sliding, turning or flipping the tracing paper never stretches it.', fits: 0 },
    { t: 'A quarter turn of P does not fit on Q.', fits: -1, mc: MC.failedSearch, id: 'p.x-try' },
    { t: 'Count the squares: P’s sides are 6, 2, 6, 2 and Q’s are 4, 3, 4, 3.', fits: 1 },
  ];
  const CLAIMS = ['p.claim1', 'p.claim2', 'p.claim3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${T(id)}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: LINES[CLAIMS[filled]!]?.say ?? '', response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.C1', 1, 1.0); tr.set('p.t0', 1, 2.0, 0.6); await wait(3.4); if (!alive()) return; tr.set('p.t0off', 1, 0.8); }
        if (n === 2) {
          tr.set('p.t0off', 1, 0.4); tr.set('p.C1:dim', 1, 0.5); tr.set('p.lens', 1, 0.9); tr.set('p.C2', 1, 1.1, 0.5); await wait(1.7); if (!alive()) return;
          tr.set('p.glow6', 1, 0.6);
        }
        if (n === 3) {
          tr.set('p.C2:dim', 1, 0.5); tr.set('p.glow6', 0, 0.5);
          tr.set('p.t1', 1, 1.6); await wait(2.6); if (!alive()) return;
          tr.set('p.t1off', 1, 0.6); tr.set('p.t2', 1, 2.4, 0.4); await wait(3.4); if (!alive()) return;
          tr.set('p.strike', 1, 0.6); tr.set('p.hero', 1, 1.1, 0.4); await wait(1.7); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    if (ch.id) { fbHost.replaceChildren(fb(false, ch.id)); return; }
    fbHost.replaceChildren(fb(false, 'p.x-other'));
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: a 6-by-2 and a 4-by-3 rectangle both cover 12 squares, so they are congruent. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.areaPerim : undefined });
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
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CongItem),
  });
}
/** review aid: one item of one family (family:subgoal:seed), its prompt, choices and worked solution */
function reviewItem(spec: string): void {
  const [fam, sg, sd] = spec.split(':');
  const it = GENS[fam as FamilyId](rng(Number(sd ?? 1)), 1, sg) as CongItem;
  it.subgoal = sg;
  const view = showItem(it);
  (window as unknown as { __practiceItem: unknown }).__practiceItem = it;
  setPanel(h('h2', {}, FAMILY_NAMES[fam as FamilyId] ?? fam!), html('p', '', it.prompt),
    ...(it.choices ? [h('div', { class: 'opts' }, ...it.choices.map((c, i) => { const b = h('button', i === (it.answer as { i: number }).i ? { class: 'right' } : {}); b.innerHTML = c; return b; }))] : [html('p', 'dim', `answer: ${JSON.stringify(it.answer)}`)]),
    solutionList(it.solution));
  if (ctx.qs.has('solve') && view.solve) seq(view.solve);
}
const CAND_PLANE = box(30, 90, 860, 1000), CAND_BOARD = box(900, 70, 1860, 1010);
function showItem(item: CongItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const cands = !!pic.cands?.length;
  const boardSrc = [item.board, ...(pic.more ?? [])].filter(s => s !== '');
  const hasBoard = boardSrc.length > 0;
  const mainPic: CongPic = cands ? { ...pic, cands: undefined } : pic;
  const v: PView = planeView(pic.win, cands ? CAND_PLANE : hasBoard ? PLANE : WIDE, pic.axes);
  const lines: Line[] = cands
    ? (hasBoard ? [{ ...wline('x.T0', boardSrc[0]!, CAND_BOARD.y0 + 92, 66), x: CAND_BOARD.x0 + 50 }] : [])
    : boardSrc.map((s, i) => wline(`x.T${i}`, s, WB.y0 + 120 + i * 120, 70));
  const panelSt: Record<string, PanelState> = {};
  const n = pic.solve?.seq.length ?? 1;
  setScene({
    table: NOTABLE, lines, leads: [], boardBox: cands ? CAND_BOARD : hasBoard ? WB : null,
    model: c => drawCongPic(c, v, mainPic, { k: tr.k('x.in'), solveK: tr.k('x.solve'), alsoK: tr.k('x.also'), ringK: tr.k('x.ring') }),
    extra: c => { if (cands) drawPanels(c, pic, box(CAND_BOARD.x0 + 24, CAND_BOARD.y0 + (hasBoard ? 150 : 30), CAND_BOARD.x1 - 24, CAND_BOARD.y1 - 16), panelSt, tr.k('x.in'), pic.figs[0]); },
  });
  tr.set('x.in', 1, 0.7);
  lines.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.3 + i * 0.4));
  return {
    solve: async alive => {
      if (cands) {
        const right = (item.choices ?? [])[(item.answer as { i?: number }).i ?? -1]?.replace('Tile ', '');
        const bs = [...document.querySelectorAll('.panel .opts button')];
        const picked = bs.findIndex(b => b.classList.contains('on'));
        const pl = picked >= 0 ? (item.choices ?? [])[picked]?.replace('Tile ', '') : undefined;
        if (right) panelSt[right] = 'right';
        if (pl && pl !== right && pic.cands!.some(c => c.label === pl)) panelSt[pl] = 'wrong';
        tr.set('x.tick', 1, 0.01);
        return;
      }
      if (!pic.solve) return;
      for (const L of lines) tr.set(L.key + ':dim', 1, 0.4);
      tr.set('x.solve', 1, 1.6 * n); await wait(1.6 * n + 0.2); if (!alive()) return;
      if (pic.solve.also) { tr.set('x.also', 1, 1.6 * pic.solve.also.length); await wait(1.6 * pic.solve.also.length + 0.2); if (!alive()) return; }
      if (pic.solve.to !== undefined && !pic.solve.miss) tr.set('x.ring', 1, 1.2);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\circlearrowright', '\\circlearrowleft', '\\triangle ABC \\cong \\triangle DEF', '\\text{Jordan:}\\ P \\not\\cong Q'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});

// keep tree-shaken helpers referenced for the review aid
void mv; void drawMirror;
