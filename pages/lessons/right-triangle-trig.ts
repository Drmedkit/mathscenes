// right-triangle-trig.ts: "Right triangle trigonometry" (Geometry, lesson 10) on the shared runtime.
//   1 The question   a kite: 100 ft of string at 40° to the horizontal. How high is it? (44 ft = height in step with the
//                    angle, "cannot be known" = size needed, 64 ft = right) + how sure
//   2 Worked example name the sides from 40° -> a 30 ft string at 40° rises 19.28 ft; the small triangle dilates from
//                    the hand onto the kite's (AA), the ratio 0.643 stays: sin 40° -> sin 40° = h/100 -> h ≈ 64.3 ft;
//                    why may we use the small triangle's ratio?
//   3 Your turn      a ladder at 75°, foot 4 ft out: which ratio (cos), L = 4 ÷ cos 75° ≈ 15.5 ft, then the 4-to-1
//                    rule: a 16 ft ladder 4 ft out stands at cos⁻¹(0.25) ≈ 76°
//   4 Prove it       sin A = cos(90° − A): always / only some angles, then a because-chain (angle sum, sides named from
//                    the angle, same leg over the same hypotenuse) while the picture lights the parts; decoys
//                    "equal at every angle" and "the bottom side is adjacent". Then sin 40° = cos 50°, callback to 1.
//   5 Practice       all 29 sub-goals one after another, then mixed (runtime/practice.ts)
// Reused read-only from geometry-foundations: geo.ts + GeoFig.ts (exact figures), Card.ts; similarity's figOf.
// Figures and maths: src/lesson/topics/right-triangle-trig/ (trig.ts). Voiced lines: script.ts.
import type { Canvas } from '../../src/core/draw';
import { box, type Box, clamp } from '../../src/core/math';
import { BOARD, line, setScene, seq, tr, wait, type Line } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { drawWords } from '../../src/lesson/words';
import { wash } from '../../src/lesson/wash';
import { type Fig, type Fit, type Frame, type Pt, FR_LEFT, FR_WIDE, fitFig, galleryFrames, mul, toScreen } from '../../src/lesson/topics/geometry-foundations/geo';
import { drawFig, sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { cardPainter, cardsPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { cosD, rtFig, sinD, standFig, tanD } from '../../src/lesson/topics/right-triangle-trig/trig';
import { MC } from '../../src/lesson/topics/right-triangle-trig/common';
import { FAMILY_NAMES, GENERATORS, type GFItem } from '../../src/lesson/topics/right-triangle-trig/items';
import { PLAN } from '../../src/lesson/topics/right-triangle-trig/plan';
import { explain } from '../../src/lesson/topics/right-triangle-trig/explain';
import { SCRIPT } from '../../src/lesson/topics/right-triangle-trig/script';
import LINES from './right-triangle-trig/voice/lines.json';

const SLUG = 'right-triangle-trig';
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
const ease = (u: number) => { const x = clamp(u); return x * x * (3 - 2 * x); };
/** parts 1-4: the figure on the left, the notation board (or a card) on the right */
const FR_T: Frame = { x: 40, y: 70, w: 1150, h: 940 };
const RIGHT_BOX: Box = box(BOARD.x0, 230, BOARD.x1, 850);

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
/** a typed number in the panel: logs every try; `cases` map a typed value (within tol) to a voiced reply */
function askNum(part: 'turn', item: string, prompt: string, unit: string, right: number, cases: { v: number; id: string; mc?: string }[], other: string, okId: string, after: () => void): HTMLElement {
  const fb = h('div'), inp = numInput(unit, () => check()), chk = btn('Check', () => check(), 'go');
  let done = false;
  function check(): void {
    if (done) return;
    const r = inp.read();
    if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) return;
    const ok = Math.abs(r.v - right) < 1e-9, hit = ok ? null : cases.find(c => Math.abs(c.v - r.v) < 1e-9);
    ctx.store.log({ part, item, prompt, response: String(r.v), expected: String(right), correct: ok, mc: hit?.mc });
    fb.replaceChildren(voicedFb(ok ? okId : hit ? hit.id : other, ok));
    if (ok) { done = true; chk.disabled = true; after(); }
  }
  return h('div', {}, inp.node, h('div', { class: 'row' }, chk), fb);
}
/** a copy of a triangle as a wash with an outline */
const copyFig = (T: Pt[], col: 'pick' | 'link'): Fig => ({ segs: [0, 1, 2].map(i => ({ id: 'c' + i, a: T[i]!, b: T[(i + 1) % 3]!, col })), angles: [], points: [], fills: [{ pts: T.slice(), col, alpha: 0.3 }] });
/** the kite at the top of the string (a small painted diamond with a tail) */
function drawKite(c: Canvas, at: Pt, k: number): void {
  if (k <= 0) return;
  const [x, y] = at, s = 34;
  wash(c, [[x, y - s * 1.3], [x + s, y], [x, y + s * 1.6], [x - s, y]], 'first', { alpha: k * 0.85, seed: 4, rough: 1 });
  c.g.save(); c.g.globalAlpha *= k; c.g.strokeStyle = 'rgba(240,226,200,0.7)'; c.g.lineWidth = 3;
  c.g.beginPath(); c.g.moveTo(x, y + s * 1.6); c.g.bezierCurveTo(x + 30, y + 90, x - 20, y + 120, x + 18, y + 170); c.g.stroke(); c.g.restore();
}
const lineOn = (key: string, d = 0.9, delay = 0) => tr.set(key, 1, d, delay);

// ===================== the kite of parts 1 and 2: 100 ft of string at 40° =====================
const KRUN = 100 * cosD(40), KRISE = 100 * sinD(40);
const kiteFig = (alt: boolean) => standFig(KRUN, KRISE, { riseDash: true, labs: { hyp: '100 ft', rise: 'h', riseAlt: alt ? '64.3 ft' : undefined }, angF: { text: '40°' }, words: { hyp: 'string' } });
const KQ = kiteFig(false), KE = kiteFig(true);
const KQ_FIT: Fit = fitFig(KQ.fig, FR_T), KE_FIT: Fit = fitFig(KE.fig, FR_T);
const kiteTop = (fit: Fit, f: Fig): Pt => toScreen(fit, f.segs.find(s => s.id === 'GT')!.b);

// ===================== 1. The question =====================
const CARDS = [
  { name: 'about 44 ft', t: '40° is 40/90 of a right angle, so 40/90 of the 100 ft', mc: undefined as string | undefined, cb: 'q.cb.lin', right: false },
  { name: 'cannot be known', t: 'without measuring another side', mc: MC.size as string | undefined, cb: 'q.cb.size', right: false },
  { name: 'about 64 ft', t: 'every 40° right triangle has the same shape', mc: undefined as string | undefined, cb: 'q.cb.ok', right: true },
];
function partQuestion(): void {
  tr.reset('q.');
  const card = cardPainter(['A kite on <b class="a">100 ft</b> of string, pulled straight.', 'The string makes <b class="a">40°</b> with the horizontal at your hand.', 'How high is the kite above your hand?'], RIGHT_BOX, { size: 52 });
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => { sheet(c, FR_T, K('q.sheet')); drawFig(c, KQ.fig, FR_T, { k: K('q.fig') }, KQ_FIT); drawKite(c, kiteTop(KQ_FIT, KQ.fig), K('q.fig')); card.draw(c, K('q.card')); },
  });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3); tr.set('q.card', 1, 0.8, 1.2);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A kite on 100 ft of string at 40° to the horizontal. How high is it above your hand?', response: `${c.name}: ${c.t}`, expected: 'about 64 ft', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'How high is the kite?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
const E_LINES: Line[] = [
  line('e.L0', '\\text{hyp} = 100,\\ \\text{opp} = h', 190, 70),
  line('e.L1', '\\frac{19.28}{30} \\approx 0.643', 360, 76),
  line('e.L2', '\\sin 40^\\circ = \\frac{\\text{opp}}{\\text{hyp}} \\approx 0.643', 530, 70),
  line('e.L3', '\\sin 40^\\circ = \\frac{h}{100}', 700, 76),
  line('e.L4', 'h = 100 \\sin 40^\\circ \\approx 64.3', 870, 72),
];
/** the 40° triangle dilated from the hand F (the origin of the figure) by s */
const grownKite = (s: number): Pt[] => [[0, 0], mul(KE.fig.segs.find(x => x.id === 'GT')!.a, s), mul(KE.fig.segs.find(x => x.id === 'GT')!.b, s)];
function partExample(): void {
  tr.reset('e.');
  setScene({
    boardBox: undefined, lines: E_LINES, leads: [],
    model: c => {
      sheet(c, FR_T, K('e.sheet'));
      const nm = K('e.name') * (1 - K('e.nameoff')), sv = K('e.solved');
      drawFig(c, KE.fig, FR_T, {
        k: K('e.fig'), solved: { GT: sv },
        col: sv > 0.5 ? { GT: 'link', FT: 'pick', FG: 'second' } : nm > 0.3 || K('e.keep') > 0.5 ? { GT: 'first', FT: 'pick', FG: 'second' } : {},
        glow: { GT: nm * 0.8 + K('e.gEq') * (1 - sv), FT: nm * 0.8 + K('e.gEq') * (1 - sv), FG: nm * 0.6 },
      }, KE_FIT);
      drawKite(c, kiteTop(KE_FIT, KE.fig), K('e.fig'));
      const g = K('e.grow');
      if (K('e.copy') > 0) drawFig(c, copyFig(grownKite(0.3 + 0.7 * ease(g)), g >= 0.999 ? 'link' : 'pick'), FR_T, { k: K('e.copy') * (1 - 0.75 * K('e.copyoff')) }, KE_FIT);
      if (K('e.small') > 0) drawWords(c, '30 ft string at 40°: rises 19.28 ft', FR_T.x + 50, FR_T.y + 60, 'pick', K('e.small') * (1 - K('e.smalloff')), { size: 46 });
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'Name the sides from 40°', why: 'Opposite and adjacent depend on the angle.', act: 'Name' },
    { t: 'Same angle, same shape', why: 'Why one ratio belongs to 40°.', act: 'Compare' },
    { t: 'Write the equation', why: 'Opposite over hypotenuse: sine.', act: 'Write' },
    { t: 'Solve, round once', why: 'Degree mode; round at the end.', act: 'Solve' },
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
        tr.set('e.name', 1, 0.7); await wait(1.0); if (!alive()) return; lineOn('e.L0'); await wait(1.2); if (!alive()) return;
        tr.set('e.keep', 1, 0.1); tr.set('e.nameoff', 1, 0.6);
      } else if (i === 1) {
        tr.set('e.copy', 1, 0.5); tr.set('e.small', 1, 0.5, 0.2); await wait(0.9); if (!alive()) return;
        lineOn('e.L1'); await wait(1.2); if (!alive()) return;
        tr.set('e.grow', 1, 2.6); await wait(2.9); if (!alive()) return;
        lineOn('e.L2'); tr.set('e.copyoff', 1, 0.6); tr.set('e.smalloff', 1, 0.6); await wait(0.9);
      } else if (i === 2) {
        tr.set('e.gEq', 1, 0.5); lineOn('e.L3'); await wait(1.4);
      } else {
        lineOn('e.L4'); tr.set('e.solved', 1, 0.9, 0.6); await wait(1.7);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why may we use the 30 ft triangle’s ratio for the kite?', [
      { t: 'The kite’s triangle is bigger, so its ratio is bigger too', ok: false, id: 'e.why.size', mc: MC.size },
      { t: 'Both have a right angle and a 40° angle: similar (AA), so the ratio is the same', ok: true, id: 'e.why.ok' },
      { t: 'Any two right triangles have the same ratios', ok: false, id: 'e.why.any', mc: MC.size },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'From the angle to the height'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the ladder =====================
const LAD = standFig(4, 4 * tanD(75), { wall: true, labs: { run: '4 ft', hyp: 'L', hypAlt: '15.5 ft' }, angF: { text: '75°' }, words: { hyp: 'ladder' } });
const LAD2 = standFig(4, Math.sqrt(16 * 16 - 16), { wall: true, labs: { run: '4 ft', hyp: '16 ft' }, angF: { text: 'x°', alt: '≈ 76°' }, words: { hyp: 'ladder' } });
const LAD_FR: Frame = { x: 40, y: 70, w: 560, h: 940 }, LAD2_FR: Frame = { x: 620, y: 70, w: 560, h: 940 };
const T_LINES: Line[] = [
  line('t.L0', '\\cos 75^\\circ = \\frac{4}{L}', 200, 76),
  line('t.L1', 'L = \\frac{4}{\\cos 75^\\circ} \\approx 15.5', 400, 72),
  line('t.L2', '\\cos x = \\frac{4}{16}', 640, 76),
  line('t.L3', 'x = \\cos^{-1}(0.25) \\approx 76^\\circ', 840, 70),
];
function partTurn(): void {
  tr.reset('t.');
  setScene({
    boardBox: undefined, lines: T_LINES, leads: [],
    model: c => {
      sheet(c, LAD_FR, K('t.sheet'));
      drawFig(c, LAD.fig, LAD_FR, { k: K('t.fig'), solved: { FT: K('t.solved') }, col: K('t.cols') > 0.5 ? { FG: 'second', FT: K('t.solved') > 0.5 ? 'link' : 'pick' } : {}, glow: { FG: K('t.g') * (1 - K('t.solved')), FT: K('t.g') * (1 - K('t.solved')) } });
      sheet(c, LAD2_FR, K('t.sheet2'), 31);
      drawFig(c, LAD2.fig, LAD2_FR, { k: K('t.fig2'), solved: { TFG: K('t.solved2') }, col: K('t.fig2') > 0.5 ? { FG: 'second', FT: 'pick' } : {} });
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2);
  const host = h('div'), bHost = h('div'), cHost = h('div'), nextHost = h('div');
  host.append(ask('turn', 'turn.ratio', 'Which ratio links the 75°, the 4 ft and the ladder L?', [
    { t: 'sin 75° = 4 / L', ok: false, id: 'tt.a.sin', mc: MC.byPos },
    { t: 'cos 75° = 4 / L', ok: true, id: 'tt.a.ok' },
    { t: 'tan 75° = 4 / L', ok: false, id: 'tt.a.tan', mc: MC.second },
  ], () => { tr.set('t.cols', 1, 0.4); tr.set('t.g', 1, 0.5); lineOn('t.L0', 0.9, 0.3); askL(); }));
  function askL(): void {
    bHost.replaceChildren(voiced('tt.b', 'div', 'label'), askNum('turn', 'turn.L', 'L = 4 ÷ cos 75°, nearest tenth', 'ft', 15.5, [
      { v: 1.0, id: 'tt.b.mul', mc: MC.wrongWay }, { v: 1, id: 'tt.b.mul', mc: MC.wrongWay }, { v: 4.3, id: 'tt.b.rad', mc: MC.mode },
    ], 'tt.b.other', 'tt.b.ok', () => { lineOn('t.L1'); tr.set('t.solved', 1, 0.9, 0.3); askAngle(); }));
  }
  function askAngle(): void {
    tr.set('t.sheet2', 1, 0.5, 0.6); tr.set('t.fig2', 1, 0.8, 0.8); lineOn('t.L2', 0.9, 1.0);
    cHost.replaceChildren(voiced('tt.c', 'div', 'label'), askNum('turn', 'turn.angle', '16 ft ladder, foot 4 ft out: angle with the ground, nearest degree', '°', 76, [
      { v: 14, id: 'tt.c.sin', mc: MC.byPos }, { v: 0.25, id: 'tt.c.ratio', mc: MC.ratioAsAngle }, { v: 75.5, id: 'tt.c.other' },
    ], 'tt.c.other', 'tt.c.ok', () => {
      lineOn('t.L3'); tr.set('t.solved2', 1, 0.9, 0.3);
      seq(async alive => { await wait(1.4); if (!alive()) return; nextHost.replaceChildren(voiced('tt.done', 'div', 'label'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); ctx.panel.scrollTop = ctx.panel.scrollHeight; });
    }));
  }
  setPanel(h('h2', {}, 'Your turn: the ladder'), voiced('tt.intro'), host, bHost, cHost, nextHost);
}

// ===================== 4. Prove it: sin A = cos(90° − A) =====================
const PA = 35;
const P_FIG = rtFig({ names: 'ABC', a: sinD(PA), b: cosD(PA), rot: 0, lab: { a: { text: 'a' }, b: { text: 'b' }, c: { text: 'c' } }, angA: {}, angB: {} });
const P_FIT: Fit = fitFig(P_FIG, FR_T);
const P_LINES: Line[] = [
  line('p.L0', 'A + B = 90^\\circ', 190, 76),
  line('p.L1', '\\sin A = \\frac{a}{c}', 380, 76),
  line('p.L2', '\\cos B = \\frac{a}{c}', 560, 76),
  line('p.L3', '\\sin A = \\cos(90^\\circ - A)', 790, 72),
];
function partProve(): void {
  tr.reset('p.');
  setScene({
    boardBox: undefined, lines: P_LINES, leads: [],
    model: c => {
      sheet(c, FR_T, K('p.sheet'));
      const g1 = K('p.g1') * (1 - K('p.g1off')), g2 = K('p.g2') * (1 - K('p.g2off')), g3 = K('p.g3');
      drawFig(c, P_FIG, FR_T, {
        k: K('p.fig'), marks: { BAC: K('p.arcs'), ABC: K('p.arcs') },
        glow: { BAC: g1, ABC: g1, BC: g2 + g3, AB: g3 },
        col: { ...(K('p.arcs') > 0.5 ? { BAC: 'first' as const, ABC: 'second' as const } : {}), ...(K('p.g2') > 0.5 ? { BC: 'first' as const } : {}), ...(g3 > 0.5 ? { AB: 'pick' as const } : {}) },
      }, P_FIT);
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2); tr.set('p.arcs', 1, 0.6, 0.6);
  const CHIPS = [
    { t: 'Sine and cosine are equal at every angle.', fits: -1, mc: MC.cofMisuse as string | undefined, id: 'p.x-all' },
    { t: 'The angles of a triangle add to 180°, and ∠C = 90°.', fits: 0 },
    { t: 'The bottom side is always the adjacent leg.', fits: -1, mc: MC.byPos as string | undefined, id: 'p.x-pos' },
    { t: 'Opposite and adjacent are named from the angle you stand at.', fits: 1 },
    { t: 'Both ratios divide the same leg a by the same hypotenuse c.', fits: 2 },
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
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(SCRIPT[CLAIMS[filled]!]!.html), response: ch.t, correct: ch.fits === filled, mc: ch.fits === filled ? undefined : ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.g1', 1, 0.6); lineOn('p.L0', 0.9, 0.3); await wait(1.4); if (!alive()) return; tr.set('p.g1off', 1, 0.5); }
        if (n === 2) { tr.set('p.g2', 1, 0.6); lineOn('p.L1', 0.9, 0.3); lineOn('p.L2', 0.9, 1.2); await wait(2.2); if (!alive()) return; tr.set('p.g2off', 1, 0.5); }
        if (n === 3) {
          tr.set('p.g3', 1, 0.6); lineOn('p.L3', 0.9, 0.4); await wait(1.6); if (!alive()) return;
          chipBox.remove(); fbHost.replaceChildren(voicedFb('p.c3', true));
          setPanel(h('h2', {}, 'Prove it'), chain, fbHost, lastHost); askLast();
        }
      });
      return;
    }
    fbHost.replaceChildren(voicedFb(ch.id ?? 'p.x-other', false));
  }
  function askLast(): void {
    lastHost.replaceChildren(voiced('p.last', 'div', 'label'), ask('prove', 'prove.last', 'Which equals sin 40°?', [
      { t: 'cos 40°', ok: false, id: 'p.last.same', mc: MC.cofMisuse },
      { t: 'cos 50°', ok: true, id: 'p.last.ok' },
      { t: 'sin 50°', ok: false, id: 'p.last.sin', mc: MC.cofNoComp },
    ], () => seq(async alive => {
      await wait(4.0); if (!alive()) return;
      lastHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
    })));
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.ok', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  const yes = btn('Always', () => judge(true)), no = btn('Only for some angles', () => judge(false));
  const proofHost = h('div');
  function judge(always: boolean): void {
    yes.disabled = no.disabled = true;
    (always ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'In right triangle ABC (right angle at C): sin A = cos B always, or only for some angles?', response: always ? 'always' : 'only some angles', expected: 'always', correct: always, mc: always ? undefined : MC.cofNoComp });
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
const RIGHT_FR: Frame = { x: 690, y: 70, w: 1190, h: 940 };
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
  const besideFig = !!p.fig && !!(p.card || p.cards);
  if (p.fig) {
    const fr = besideFig ? FR_LEFT : FR_WIDE, f = p.fig;
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawFig(c, f, fr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? { ...rv.col, ...Object.fromEntries((rv.solved ?? []).map(id => [id, 'link' as const])) } : undefined });
    });
    keysOn.push('x.fig');
  }
  if (p.card) {
    const b = p.fig ? box(RIGHT_FR.x, 160, RIGHT_FR.x + RIGHT_FR.w, 920) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.fig ? 50 : 60, align: p.fig ? 'left' : 'center' });
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
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940), { size: 56 });
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  return finish(draws, keysOn, async alive => {
    tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4, 0.6);
    tr.set('x.lines', 1, 0.9, 0.3);
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
  warm: ['\\sin 40^\\circ = \\frac{h}{100} \\ \\cos 75^\\circ = \\frac{4}{L} \\ x = \\cos^{-1}(0.25) \\approx 76^\\circ \\ \\text{hyp} = 100,\\ \\text{opp} = h \\ \\frac{19.28}{30} \\approx 0.643 \\ A + B = 90^\\circ \\ \\cos(90^\\circ - A)'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
