// scale-and-area.ts: "Scale factor and area: the area is multiplied by k²" (grade 7, 7.G.A.1) on the lesson runtime.
//   1 The question   a 3 ft by 2 ft rug (6 sq ft); a copy with every length x 3: how much fabric? cards 18 (x k),
//                    54, 36 (adds the factors) + how sure
//   2 Worked example on grid paper: scale every length (the 9 by 6 copy draws) -> stretch the length (one row of 3
//                    rugs flies in: 18) -> stretch the width (the row is copied up: 3 rows, 54) -> name it (3 x 3 = 3²,
//                    check 9 x 6); the board writes each line as the rugs land; one "why?" with 3 reasons
//   3 Your turn      a 4 in by 3 in photo printed x 2, faded from the end: the lengths and the first row are given,
//                    the kid counts the photos (4) and finds the print's area (48); callback to the part-1 card
//   4 Prove it       Riley: "my triangle scaled by 2 just doubles its area". Judge, then a because-chain from reason
//                    chips (distractors = catalogue misconceptions); four triangles fly in (the middle one turns)
//   5 Practice       all 16 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/scale-and-area/script.ts (panel HTML) = pages/lessons/scale-and-area/voice/lines.json.
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { tex, texBox, texWidth, type Formula } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { bigLine, bump, line, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { AreaGrid, type AreaFocus, type AreaGridBlock } from '../../src/lesson/topics/scale-and-area/AreaGrid';
import type { AreaPic } from '../../src/lesson/topics/scale-and-area/areaMaths';
import { LESSON_FRAME, PHOTO, RUG, TRI } from '../../src/lesson/topics/scale-and-area/lessonPics';
import { type AreaItem, FAMILY_NAMES, GENERATORS, MC, PF } from '../../src/lesson/topics/scale-and-area/items';
import { PLAN } from '../../src/lesson/topics/scale-and-area/plan';
import { explain } from '../../src/lesson/topics/scale-and-area/explain';
import { SCRIPT } from '../../src/lesson/topics/scale-and-area/script';

const SLUG = 'scale-and-area';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the narrator says it, the panel shows it */
function said(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement {
  if (!SCRIPT[id]) console.warn('no voice line', id);
  void ctx.say(id); return html(tag, cls, SCRIPT[id]?.h ?? id);
}
const fbSaid = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id]?.h ?? id, extra); };

const C: Record<string, { col: Paint }> = { a: { col: 'first' }, b: { col: 'second' }, k: { col: 'link' }, r: { col: 'link' }, w: { col: 'wrong' } };

// ===================== the picture: one block per part, driven by named tracks =====================
interface Pic { m: AreaGridBlock; pre: string }
function picture(pre: string, pic: AreaPic, focus: () => AreaFocus, lines: Line[], extra?: (c: import('../../src/core/draw').Canvas) => void): Pic {
  const m = AreaGrid(pic, LESSON_FRAME, th);
  setScene({ table: Math.min(1050, m.box.y1 + 46), model: c => m.draw(c, progressOf(s => tr.k(pre + s)), focus()), lines, leads: [], extra });
  return { m, pre };
}
/** stagger steps in */
function showIn(pre: string, keys: string[], delay = 0, gap = 0.35): void { keys.forEach((k, i) => tr.set(pre + k, 1, k === 'grid' ? 0.7 : 1.0, delay + i * gap)); }
const B = (src: string, y: number, key: string, size = 72) => line(key, src, y, size, C);

// ===================== 1. The question =====================
const CARDS = [
  { v: 18, id: MC.byK, why: 'q.cb.k' },
  { v: 54, id: '', why: 'q.cb.right' },
  { v: 36, id: MC.additive, why: 'q.cb.add' },
];
function partQuestion(): void {
  tr.reset('q.');
  const Ls = [
    B('3 \\times 2 = \\cssId{a}{6}\\text{ sq ft}', 210, 'q.L1', 76),
    B('\\text{every length} \\times \\cssId{k}{3}', 340, 'q.L2', 72),
    B('\\text{copy: } \\,?\\text{ sq ft}', 470, 'q.L3', 72),
  ];
  picture('q.', RUG, () => ({}), Ls);
  showIn('q.', ['grid', 'o', 'oL', 'oA'], 0, 0.45);
  tr.set('q.L1', 1, 1.0, 2.0); tr.set('q.L2', 1, 1.0, 2.8); tr.set('q.L3', 1, 0.9, 3.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A 3 ft by 2 ft rug takes 6 sq ft of fabric. A scaled copy has every length 3 times as long: how much fabric?', board: '3 x 2 = 6 sq ft, every length x 3', response: c.v, expected: 54, correct: c.v === 54, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>sq ft</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A bigger rug'), said('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== the four-step build (worked example, your turn) =====================
interface Build {
  /** board lines: the original's area, the two length lines, one row, all rows, k², the check */
  lines: Line[];
  scale(alive: () => boolean): Promise<void>;
  row(alive: () => boolean): Promise<void>;
  rows(alive: () => boolean): Promise<void>;
  name(alive: () => boolean): Promise<void>;
}
function build(pre: string, pic: AreaPic, n: { w: number; h: number; k: number; u: string }, fast = false): Build {
  const T = fast ? 0.5 : 1, set = (k: string, v: number, d = 0.9, del = 0) => tr.set(pre + k, v, d * T, del * T), w8 = (s: number) => wait(s * T);
  const A0 = n.w * n.h, k = n.k, rowA = k * A0, all = k * k * A0;
  const lines = [
    B(`${n.w} \\times ${n.h} = \\cssId{a}{${A0}}`, 150, pre + 'A'),
    B(`\\text{length: } \\cssId{a}{${n.w}} \\xrightarrow{\\cssId{k}{\\times ${k}}} \\cssId{b}{${k * n.w}}`, 262, pre + 'Lw', 66),
    B(`\\text{width: } \\cssId{a}{${n.h}} \\xrightarrow{\\cssId{k}{\\times ${k}}} \\cssId{b}{${k * n.h}}`, 352, pre + 'Lh', 66),
    B(`\\cssId{a}{${A0}} \\times \\cssId{k}{${k}} = \\cssId{b}{${rowA}}`, 480, pre + 'R1'),
    B(`\\cssId{b}{${rowA}} \\times \\cssId{k}{${k}} = \\cssId{b}{${all}}`, 590, pre + 'R2'),
    B(`\\cssId{a}{${A0}} \\times \\cssId{k}{${k}^2} = \\cssId{r}{${all}}\\text{ ${n.u}}`, 730, pre + 'K', 76),
    B(`${k * n.w} \\times ${k * n.h} = ${all}\\ \\cssId{r}{\\checkmark}`, 850, pre + 'Ck'),
  ];
  return {
    lines,
    async scale(alive) {
      set('c', 1, 1.6); await w8(1.4); if (!alive()) return;
      set('cL', 1, 0.8); set('pw', 1, 0.4); set('Lw', 1, 1.0, 0.2); await w8(1.3); if (!alive()) return;
      set('pw', 0, 0.5); set('ph', 1, 0.4); set('Lh', 1, 1.0, 0.2); await w8(1.3); if (!alive()) return;
      set('ph', 0, 0.5);
    },
    async row(alive) {
      set('n', 1, 0.1); set('row', 1, 2.2); await w8(2.4); if (!alive()) return;
      set('r0', 1, 0.5); set('R1', 1, 1.0, 0.3); await w8(1.6); if (!alive()) return;
      set('r0', 0, 0.6);
    },
    async rows(alive) {
      set('rows', 1, 2.4); await w8(2.6); if (!alive()) return;
      set('rc', 1, 0.5); set('R2', 1, 1.0, 0.3); await w8(1.6); if (!alive()) return;
      set('rc', 0, 0.6);
    },
    async name(alive) {
      set('dim', 1, 0.8); set('cA', 1, 0.9, 0.4); await w8(1.2); if (!alive()) return;
      set('K', 1, 1.2); void bump(pre + 'pA', alive); await w8(1.5); if (!alive()) return;
      set('Ck', 1, 1.1); await w8(1.3);
    },
  };
}
const buildFocus = (pre: string) => (): AreaFocus => ({
  pulse: [{ at: 'cw', k: tr.k(pre + 'pw'), col: 'link' }, { at: 'ch', k: tr.k(pre + 'ph'), col: 'link' }, { at: 'cA', k: tr.k(pre + 'pA'), col: 'link' }],
  rowRing: [{ j: 0, k: tr.k(pre + 'r0'), col: 'pick' }],
  ring: [{ at: 'c', k: tr.k(pre + 'rc'), col: 'pick' }],
  dimTiles: tr.k(pre + 'dim'),
});

// ===================== 2. Worked example: the rug =====================
function partExample(): void {
  tr.reset('e.');
  const Bd = build('e.', RUG, { w: 3, h: 2, k: 3, u: 'sq ft' });
  picture('e.', RUG, buildFocus('e.'), Bd.lines);
  for (const s of ['grid', 'o', 'oL', 'oA', 'A']) tr.jump('e.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'Scale every length', why: 'Length and width, both × 3.', act: 'Scale it' },
    { t: 'Stretch the length', why: 'How many rugs fit in one row?', act: 'Fill one row' },
    { t: 'Stretch the width', why: 'How many rows fit?', act: 'Fill the rows' },
    { t: 'Name the area factor', why: 'One factor of 3 for each length.', act: 'Name it' },
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
      if (i === 0) await Bd.scale(alive);
      else if (i === 1) await Bd.row(alive);
      else if (i === 2) await Bd.rows(alive);
      else await Bd.name(alive);
      if (!alive()) return;
      sayBox.replaceChildren(said(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The length multiplies the area by 3, and the width multiplies it by 3 again.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The copy is 3 times as big, so it takes 3 times the fabric.', ok: false, id: 'e.why.k', mc: MC.byK as string | undefined },
      { t: 'Add the factors: 3 + 3, so 6 times the fabric.', ok: false, id: 'e.why.add', mc: MC.additive as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbSaid(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does the copy take 9 times the fabric, not 3 times?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(said('e.why', 'label', 'div'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: the photo (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const Bd = build('t.', PHOTO, { w: 4, h: 3, k: 2, u: 'sq in' });
  // the kid's two lines replace R2 and K: the count of photos, then the area
  const L5 = B('\\cssId{k}{2} \\times \\cssId{k}{2} = \\cssId{r}{4}\\text{ photos}', 590, 't.N');
  const lines = Bd.lines.map(l => (l.key === 't.R2' ? L5 : l));
  picture('t.', PHOTO, buildFocus('t.'), lines);
  showIn('t.', ['grid', 'o', 'oL', 'oA'], 0, 0.4); tr.set('t.A', 1, 1.0, 1.6);
  let step = 0;
  const STEPS = [
    { t: 'Scale every length', why: 'Done for you.' },
    { t: 'Stretch the length', why: 'Done for you: one row of 2 photos.' },
    { t: 'Stretch the width', why: 'Your step.' },
    { t: 'Find the area', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a bigger print'), said('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    await Bd.scale(alive); if (!alive()) return;
    step = 1; drawPlan();
    await Bd.row(alive); if (!alive()) return;
    step = 2; drawPlan(); askCount();
  });
  /** one typed step: onCheck gets the number and the feedback host, and says whether it was right */
  function numStep(id: string, unit: string, onCheck: (v: number, fb: HTMLElement) => boolean): void {
    const fbHost = h('div'), inp = numInput(unit, () => check()), ok = btn('Check', () => check(), 'go');
    let done = false;
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbSaid(false, 't.empty')); return; }
      if (onCheck(r.v, fbHost)) { done = true; ok.disabled = true; }
    }
    work.replaceChildren(said(id), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCount(): void {
    numStep('t.count', 'photos', (v, fb) => {
      const right = v === 4, mc = v === 2 ? MC.byK : v === 3 ? MC.additive : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.count', prompt: 'A 4 by 3 photo, every length x 2: how many photos fill the print?', board: '4 x 3 -> 8 x 6', response: v, expected: 4, correct: right, mc });
      if (!right) { fb.replaceChildren(fbSaid(false, v === 2 ? 't.count.k' : 't.count.no')); return false; }
      fb.replaceChildren(fbSaid(true, 't.count.ok'));
      seq(async alive => {
        tr.set('t.rows', 1, 2.0); await wait(2.2); if (!alive()) return;
        tr.set('t.rc', 1, 0.5); tr.set('t.N', 1, 1.0, 0.3); await wait(1.5); if (!alive()) return;
        tr.set('t.rc', 0, 0.6); step = 3; drawPlan(); askArea();
      });
      return true;
    });
  }
  function askArea(): void {
    numStep('t.area', 'sq in', (v, fb) => {
      const right = v === 48, mc = v === 24 ? MC.byK : v === 4 ? MC.factorAsArea : v === 144 ? MC.squareArea : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.area', prompt: 'A 4 in by 3 in photo (12 sq in), every length x 2: the area of the print?', board: '12 sq in, k = 2', response: v, expected: 48, correct: right, mc });
      if (!right) { fb.replaceChildren(fbSaid(false, v === 24 ? 't.area.k' : v === 4 ? 't.area.factor' : v === 144 ? 't.area.sq' : 't.area.no')); return false; }
      fb.replaceChildren(fbSaid(true, 't.area.ok'));
      seq(async alive => { await Bd.name(alive); if (!alive()) return; step = 4; drawPlan(); fb.append(callback()); });
      return true;
    });
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    const p = said(id);
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Riley's triangle =====================
function partProve(): void {
  tr.reset('p.');
  const R1 = B('\\text{Riley: } 6 \\times 2 = 12', 160, 'p.R1');
  R1.col = 'dim';
  const Ls = [
    R1,
    B('\\cssId{k}{2} \\times \\cssId{k}{2} = \\cssId{r}{4}\\text{ copies}', 330, 'p.P1'),
    B('\\cssId{r}{4} \\times \\cssId{a}{6} = \\cssId{r}{24}', 460, 'p.P2'),
    B('\\tfrac12 \\times \\cssId{b}{8} \\times \\cssId{b}{6} = \\cssId{r}{24}\\ \\cssId{r}{\\checkmark}', 600, 'p.P3'),
  ];
  const extra = (c: import('../../src/core/draw').Canvas) => {
    const ks = tr.k('p.strike');
    if (ks > 0) { const b = partOfAll(R1); strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, ks, { col: 'wrong' }); }
  };
  picture('p.', TRI, () => ({ dimTiles: tr.k('p.dim'), pulse: [{ at: 'oA', k: tr.k('p.pA'), col: 'link' }], ring: [{ at: 'c', k: tr.k('p.rc'), col: 'pick' }] }), Ls, extra);
  showIn('p.', ['grid', 'o', 'oL', 'oA', 'c', 'cL'], 0, 0.4); tr.set('p.R1', 1, 1.0, 2.4);
  const CHIPS = [
    { t: 'Four small triangles fill it exactly; the middle one is turned around.', fits: 0 },
    { t: 'Every small copy has the same area as the original: 6 square units.', fits: 1 },
    { t: 'The base doubles and the height doubles: 2 × 2 = 4.', fits: 2 },
    { t: 'Doubling every side doubles the area.', fits: -1, mc: MC.byK, id: 'p.no.k' },
    { t: 'The k × k rule only works for rectangles.', fits: -1, mc: MC.onlyRects, id: 'p.no.rect' },
    { t: 'It worked for this triangle, so it works for every figure.', fits: -1, mc: MC.examples, id: 'p.no.ex' },
  ];
  const CLAIMS = [
    'Riley’s big triangle holds <b>4</b> copies of the small one, not 2,',
    'So its area is <b>4 × 6 = 24</b> square units, not 12,',
    'Any figure scaled by 2 gets <b class="s">4 times</b> the area,',
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
    if (filled >= 3 || used.has(i)) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbSaid(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbSaid(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.n', 1, 0.1); tr.set('p.tiles', 1, 3.2); await wait(3.4); if (!alive()) return;
        tr.set('p.P1', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); tr.set('p.R1:dim', 1, 0.5, 0.6);
      }
      if (n === 2) { void bump('p.pA', alive); tr.set('p.P2', 1, 1.0, 0.3); await wait(1.4); }
      if (n === 3) {
        tr.set('p.rc', 1, 0.5); tr.set('p.P3', 1, 1.1, 0.3); await wait(1.8); if (!alive()) return;
        tr.set('p.rc', 0, 0.6);
        chipBox.remove();
        fbHost.replaceChildren(fbSaid(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Riley: a triangle scaled by 2 just doubles its area (6 -> 12). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.onlyRects : undefined });
    proofHost.replaceChildren(right ? said('p.test') : said('p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), said('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}
const partOfAll = (L: Line) => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });

// ===================== 5. Practice =====================
const PB = box(1300, 70, 1860, 1010);
/** a board line that fits the narrower practice board */
function pline(key: string, src: string, y: number, size: number, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 48 && texWidth(F, s) > PB.w - 90) s -= 2;
  return { key, F, x: PB.x0 + 45, y, size: s, col };
}
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as AreaItem),
  });
}
function showItem(item: AreaItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const P = item.pict;
  const made = P ? tryBlock(() => AreaGrid(P.pic, PF, th)) : null;
  if (made && made.ok && P) {
    const m = made.value;
    const T = pline('x.T', item.board, PB.y0 + 110, 80);
    const Hs = pline('x.S', P.solve.tex || '\\,', PB.y0 + 300, 84, 'link');
    setScene({
      table: Math.min(1050, m.box.y1 + 46),
      model: c => m.draw(c, progressOf(s => tr.k('x.' + s)), { swap: Object.fromEntries((P.solve.swap ?? []).map(s => [s.at, { t: s.t, k: tr.k('x.swap') }])) }),
      lines: [T, Hs], leads: [], boardBox: PB,
    });
    showIn('x.', P.show, 0, 0.3);
    tr.set('x.T', 1, 0.8, 0.4);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        for (const k of P.solve.show) {
          if (k === 'n') { tr.set('x.n', 1, 0.1); continue; }
          tr.set('x.' + k, 1, k === 'tiles' || k === 'groups' ? 2.6 : 0.9); await wait(k === 'tiles' || k === 'groups' ? 2.0 : 0.5); if (!alive()) return;
        }
        if (P.solve.swap) tr.set('x.swap', 1, 0.7);
        await wait(0.6); if (!alive()) return;
        tr.set('x.S', 1, 1.0);
      },
    };
  }
  if (made && !made.ok) console.error('scale-and-area picture:', made.error);
  // no picture (it would give the answer away): a big slate where the picture would be
  const big = box(PF.x + 40, PF.y + 90, PF.x + PF.w - 20, PF.y + PF.h - 90);
  setScene({ table: 1050, lines: [bigLine('x.T', item.board, big, 170)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{length: width: every length copy: sq ft in Riley photos copies}', '3 \\xrightarrow{\\times 3} 9 \\tfrac12 \\checkmark k^2'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
