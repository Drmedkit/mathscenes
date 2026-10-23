// integer-exponents.ts: grade 8 (8.EE.A.1), on the shared lesson runtime. The model is a FACTOR MAT: a power is a row
// of factor tiles that start from a 1 tile; a negative exponent puts its tiles BELOW the bar (they divide), and a tile
// on top cancels a tile below (base / base = 1). The board sits on top, the mat (and the colony dish) underneath.
//   1 The question   a bacteria colony doubles every hour; at noon 1 mm^2. At 9 am: 2^-3 = ?  cards -8 / 1/8 / -6
//   2 Worked example Write 2^3 -> back to noon (divide by 2, pairs cancel: 2^0 = 1) -> back to 9 am (2s stay below the
//                    bar) -> read it 2^-3 = 1/8; the descending table fills in on the board; one "why?" with 3 reasons
//   3 Your turn      3^2 / 3^5, faded from the end: write + cancel given; the kid writes 3^-3 and its value 1/27
//   4 Prove it       Sam: "5^0 = 0, there are no 5s" -> right / wrong, then a because-chain from reason chips (the
//                    product rule forces 5^0 = 1); distractors = catalogue misconceptions
//   5 Practice       all 17 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/integer-exponents/script.ts = voice/lines.json. Every answer is logged.
import { type Canvas, arrow, strike } from '../../src/core/draw';
import { type Box, box, lerp, rat } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texDraw, texWidth } from '../../src/core/tex';
import { paint } from '../../src/core/theme';
import { type Line, bigLine, bump, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item, fr } from '../../src/lesson/runtime/item';
import { FactorMat, type MatBlock, type MatFocus, type MatParams, type Tile } from '../../src/lesson/topics/integer-exponents/FactorMat';
import { dish } from '../../src/lesson/topics/integer-exponents/Colony';
import { readQ } from '../../src/lesson/topics/integer-exponents/expo';
import { FAMILY_NAMES, GENS, type Pic } from '../../src/lesson/topics/integer-exponents/items';
import { explain } from '../../src/lesson/topics/integer-exponents/explain';
import { PLAN } from '../../src/lesson/topics/integer-exponents/plan';
import { SCRIPT } from '../../src/lesson/topics/integer-exponents/script';

const SLUG = 'integer-exponents';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- layout: the board on top, the factor mat (and the dish) underneath ----------
const TOPB = box(60, 34, 1860, 404), LX = 118;
const LF = frame(60, 420, 1800, 640);
const TAGS = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, k: { col: 'pick' as const }, w: { col: 'wrong' as const } };
/** a board line at (x, y), shrunk (never below 60 px) to fit maxW */
function bl(key: string, src: string, x: number, y: number, size: number, tags?: Line['tags'], col?: Line['col'], maxW = TOPB.x1 - 60 - x): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x, y, size: s, tags, col };
}
/** a line centred on cx */
function cl(key: string, src: string, cx: number, y: number, size: number, col?: Line['col'], tags?: Line['tags']): Line {
  const F = tex(src) as Formula;
  return { key, F, x: cx - texWidth(F, size) / 2, y, size, tags, col };
}
const widthOf = (L: Line) => texWidth(L.F, L.size);
interface StageDef { pre: string; mat?: MatBlock | null; focus?: () => MatFocus; lines: Line[]; model?: (c: Canvas) => void; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setStage(S: StageDef): void {
  setScene({
    table: 1080,
    model: c => { S.model?.(c); S.mat?.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: [], boardBox: S.boardBox === undefined ? TOPB : S.boardBox, extra: S.extra,
  });
}
const tiles = (label: string, n: number, col: Tile['col']): Tile[] => Array.from({ length: n }, () => ({ label, col }));
/** a lavender ring round a box (the board column the picture shows right now) */
function ringBox(c: Canvas, b: Box, k: number, col: 'pick' | 'link' = 'pick'): void {
  if (k <= 0) return;
  const { g } = c;
  g.save(); g.globalAlpha *= Math.min(1, k); g.strokeStyle = paint(th, col, 'fill'); g.lineWidth = 4;
  g.shadowColor = paint(th, col, 'fill'); g.shadowBlur = 10;
  g.beginPath(); g.roundRect(b.x0, b.y0, b.w, b.h, 16); g.stroke(); g.restore();
}

// ===== 1. The question: the colony at 9 am is 2^-3 mm^2 =====
const DISHES = [{ cx: 360, label: '9 am', area: null as number | null }, { cx: 960, label: 'noon', area: 1 }, { cx: 1560, label: '3 pm', area: 8 }];
const CARDS = [
  { v: '−8', id: 'mc.exponents-roots.negative-exponent-makes-negative', cb: 't.cb-neg', val: -8 },
  { v: fr(1, 8), id: '', cb: 't.cb-right', val: 0.125 },
  { v: '−6', id: 'mc.exponents-roots.power-as-base-times-exponent', cb: 't.cb-six', val: -6 },
];
function partQuestion(): void {
  tr.reset('q.');
  const L1 = bl('q.L1', '\\text{area } t \\text{ hours after noon} = 2^{t}\\ \\text{mm}^2', LX, 118, 76);
  const L2 = bl('q.L2', '\\text{at 9 am: }\\ t = \\cssId{b}{-3},\\quad 2^{\\cssId{b}{-3}} = \\ ?', LX, 280, 104, TAGS);
  const areaTex = [null, tex('1\\ \\text{mm}^2') as Formula, tex('8\\ \\text{mm}^2') as Formula];
  setStage({
    pre: 'q.', lines: [L1, L2],
    model: c => DISHES.forEach((d, i) => {
      dish(c, { cx: d.cx, cy: 680, area: d.area, label: d.label, k: tr.k(`q.d${i}`), kCol: tr.k(`q.c${i}`), seed: 10 + i, ring: tr.k(`q.p.d${i}`) });
      const F = areaTex[i];
      if (F) texDraw(c, F, d.cx, 980, { size: 54, align: 'center', col: 'first', alpha: tr.k(`q.d${i}`) });
    }),
  });
  tr.set('q.d1', 1, 0.6, 0.2); tr.set('q.c1', 1, 0.8, 0.5); tr.set('q.d2', 1, 0.6, 0.8); tr.set('q.c2', 1, 1.0, 1.1);
  tr.set('q.d0', 1, 0.6, 1.6); tr.set('q.c0', 1, 0.6, 1.8); tr.set('q.L1', 1, 1.0, 0.6); tr.set('q.L2', 1, 1.1, 2.0);
  seq(async alive => { await wait(2.4); if (!alive()) return; await bump('q.p.d0', alive); });

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A colony doubles every hour; 1 mm^2 at noon. At 9 am its area is 2^-3 mm^2. What is 2^-3?', board: '2^{-3}', response: p.val, expected: 0.125, correct: p.id === '', mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span><small>mm²</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Back in time'), html('p', '', SCRIPT['q.intro']!), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
  seq(async alive => { await ctx.say('q.intro'); if (!alive()) return; await ctx.say('q.ask'); if (!alive()) return; void ctx.say('q.sure'); });
}

// ===== 2. Worked example: 2^3 down the table to 2^-3 =====
const COLS = 7, COL0 = 60 + 1800 / 14, COLW = 1800 / 7;
const colX = (i: number) => COL0 + i * COLW;
const HOURS = ['3 pm', '2 pm', '1 pm', 'noon', '11 am', '10 am', '9 am'];
const VALS = ['8', '4', '2', '1', '\\frac{1}{2}', '\\frac{1}{4}', '\\frac{1}{8}'];
const DISH = { cx: 1660, cy: 690 };
function partExample(): void {
  tr.reset('e.');
  const mat = FactorMat({
    top: tiles('2', 3, 'first'), bottom: tiles('2', 6, 'second'), cancel: 3, bar: true,
    brackets: [{ key: 'a', row: 'top', from: 0, to: 2, label: '2^{3}', col: 'first' }, { key: 'neg', row: 'bottom', from: 3, to: 5, label: '2^{-3}', col: 'second' }],
  }, LF, th);
  // the maths the picture states, asserted: 3 factors on top, 6 below = 2^-3 = 1/8
  if (mat.maths.exp !== -3 || !mat.maths.value || mat.maths.value.p !== 1 || mat.maths.value.q !== 8) throw new Error('example mat does not show 2^-3 = 1/8');
  const P = Array.from({ length: COLS }, (_, i) => cl(`e.p${i}`, `2^{${3 - i}}`, colX(i), 96, 76, 'ink'));
  const V = Array.from({ length: COLS }, (_, i) => cl(`e.v${i}`, VALS[i]!, colX(i), 226, 72, i === 3 ? 'link' : 'first'));
  const DIV = tex('\\div 2') as Formula;
  const R = mat.where.right;
  const RO = VALS.map((v, i) => ({ key: `e.r${i}`, F: tex(`= ${v}`) as Formula, x: R.x, y: R.y, size: 80, col: (i === 3 || i === 6 ? 'link' : 'ink') as Line['col'] }));
  setStage({
    pre: 'e.', mat, lines: [...P, ...V, ...RO],
    model: c => {
      const hh = tr.k('e.h');
      const idx = Math.max(0, Math.min(6, Math.round(hh)));
      dish(c, { cx: DISH.cx, cy: DISH.cy, area: Math.pow(2, 3 - hh), label: HOURS[idx]!, k: tr.k('e.dish'), kCol: 1, seed: 21 });
    },
    extra: c => {
      for (let i = 0; i < COLS - 1; i++) {
        const k = tr.k(`e.arc${i}`);
        if (k <= 0) continue;
        const x0 = colX(i) + 34, x1 = colX(i + 1) - 34, y = 306;
        const pts: [number, number][] = Array.from({ length: 24 }, (_, j) => { const t = j / 23; return [lerp(x0, x1, t), y + Math.sin(Math.PI * t) * 26]; });
        arrow(c, pts, k, { col: 'second', lw: 3.5, head: 14 });
        texDraw(c, DIV, (x0 + x1) / 2, y + 66, { size: 46, align: 'center', col: 'second', alpha: k });
      }
      const ck = tr.k('e.ring');
      if (ck > 0) { const x = colX(tr.k('e.col')); ringBox(c, box(x - 104, 40, x + 104, 300), ck, tr.k('e.done') > 0.5 ? 'link' : 'pick'); }
    },
  });

  let step = 0;
  const STEPS = [
    { t: 'Write the factors', why: '2³ is three factors of 2, starting from 1.', act: 'Write 2³', say: 'e.s1' },
    { t: 'Go back: divide by 2', why: 'Each hour back halves the colony.', act: 'Back to noon', say: 'e.s2' },
    { t: 'Keep dividing', why: 'With no 2 on top to cancel, the 2s stay below the bar.', act: 'Back to 9 am', say: 'e.s3' },
    { t: 'Read it', why: 'What is left: 1 over three 2s.', act: 'Read it', say: 'e.s4' },
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
  /** one hour back: a tile below the bar (and its cancel), the next table column, the dish halves */
  async function hourBack(i: number, alive: () => boolean): Promise<boolean> {
    tr.set(`e.b${i}`, 1, 0.6); await wait(0.6); if (!alive()) return false;
    if (i < 3) { tr.set(`e.c${i}`, 1, 0.9); await wait(0.8); if (!alive()) return false; }
    tr.set(`e.r${i}`, 0, 0.3); tr.set(`e.r${i + 1}`, 1, 0.6, 0.2);
    tr.set('e.h', i + 1, 0.7); tr.set('e.col', i + 1, 0.5);
    tr.set(`e.arc${i}`, 1, 0.6); tr.set(`e.p${i + 1}`, 1, 0.6, 0.2); tr.set(`e.v${i + 1}`, 1, 0.6, 0.4);
    await wait(1.0);
    return alive();
  }
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.mat', 1, 0.8); tr.set('e.dish', 1, 0.7); await wait(0.6); if (!alive()) return;
        for (let t = 0; t < 3; t++) tr.set(`e.t${t}`, 1, 0.6, t * 0.25);
        await wait(1.1); if (!alive()) return;
        tr.set('e.k.a', 1, 0.8); tr.set('e.p0', 1, 0.7); tr.set('e.v0', 1, 0.7, 0.3); tr.set('e.r0', 1, 0.6, 0.5);
        tr.jump('e.col', 0); tr.set('e.ring', 1, 0.5, 0.6); await wait(1.2);
      } else if (i === 1) {
        tr.set('e.k.a:dim', 1, 0.5);
        for (let t = 0; t < 3; t++) if (!(await hourBack(t, alive))) return;
        tr.set('e.one', 1, 0.8); await wait(0.9);
      } else if (i === 2) {
        tr.set('e.one', 0, 0.5);
        for (let t = 3; t < 6; t++) if (!(await hourBack(t, alive))) return;
        tr.set('e.k.neg', 1, 0.9); await wait(1.0);
      } else {
        tr.set('e.done', 1, 0.3);
        for (let k = 0; k < 6; k++) { tr.set(`e.p${k}:dim`, 1, 0.6); tr.set(`e.v${k}:dim`, 1, 0.6); }
        await wait(1.0);
      }
      if (!alive()) return;
      if (i === 3) { sayBox.replaceChildren(html('p', '', SCRIPT['e.s4']!)); selfExplain(); }
      else sayBox.replaceChildren(said(STEPS[i]!.say));
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Each step down the table divides by 2, and 1 ÷ 2 ÷ 2 ÷ 2 = 1/8. Dividing never makes it negative.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'The minus sign of the exponent belongs to the answer.', ok: false, mc: 'mc.exponents-roots.negative-exponent-makes-negative', id: 'e.w-neg' },
      { t: '2⁻³ means 2 × (−3), and that is small.', ok: false, mc: 'mc.exponents-roots.power-as-base-times-exponent', id: 'e.w-times' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      const b = [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!;
      b.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is 2^-3 not -8?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, html('span', '', SCRIPT['e.why']!)), bx, fbHost);
    seq(async alive => { await wait(0.2); await ctx.say('e.s4'); if (alive()) void ctx.say('e.why'); });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: 3^2 / 3^5, faded from the end =====
function partTurn(): void {
  tr.reset('t.');
  const mat = FactorMat({
    top: tiles('3', 2, 'first'), bottom: tiles('3', 5, 'second'), cancel: 2, bar: true,
    brackets: [
      { key: 'a', row: 'top', from: 0, to: 1, label: '3^{2}', col: 'first' },
      { key: 'b', row: 'bottom', from: 0, to: 4, label: '3^{5}', col: 'second' },
      { key: 'afterL', row: 'bottom', from: 2, to: 4, label: '3^{-3}', col: 'link' },
    ],
  }, LF, th);
  if (mat.maths.exp !== -3 || !mat.maths.value || mat.maths.value.q !== 27) throw new Error('turn mat does not show 3^-3 = 1/27');
  // the board: one row, written piece by piece
  const pieces = [
    { key: 't.L1', src: '\\frac{\\cssId{a}{3^{2}}}{\\cssId{b}{3^{5}}} = \\frac{3 \\times 3}{3 \\times 3 \\times 3 \\times 3 \\times 3}' },
    { key: 't.L2', src: '= \\frac{1}{3 \\times 3 \\times 3}' },
    { key: 't.L3', src: '= \\cssId{s}{3^{-3}}' },
    { key: 't.L4', src: '= \\cssId{s}{\\frac{1}{27}}' },
  ];
  let size = 74;
  const Fs = pieces.map(p => tex(p.src) as Formula);
  const total = (s: number) => Fs.reduce((w, F) => w + texWidth(F, s), 0) + 26 * (Fs.length - 1);
  while (size > 60 && total(size) > TOPB.w - 116) size -= 2;
  let x = LX;
  const lines: Line[] = pieces.map((p, i) => { const L: Line = { key: p.key, F: Fs[i]!, x, y: 200, size, tags: TAGS }; x += widthOf(L) + 26; return L; });
  const RO: Line = { key: 't.R', F: tex('= \\frac{1}{27}') as Formula, x: mat.where.right.x, y: mat.where.right.y, size: 80, col: 'link' };
  setStage({ pre: 't.', mat, lines: [...lines, RO] });
  tr.set('t.mat', 1, 0.7);
  tr.set('t.t0', 1, 0.5, 0.4); tr.set('t.t1', 1, 0.5, 0.6);
  for (let i = 0; i < 5; i++) tr.set(`t.b${i}`, 1, 0.5, 0.9 + i * 0.2);
  tr.set('t.k.a', 1, 0.7, 1.9); tr.set('t.k.b', 1, 0.7, 2.1); tr.set('t.L1', 1, 1.2, 2.2);

  let step = 0;
  const STEPS = [
    { t: 'Write the factors', why: 'Done for you.' },
    { t: 'Cancel pairs', why: 'Done for you.' },
    { t: 'Write one power', why: 'Your step.' },
    { t: 'Find the value', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(3.4); if (!alive()) return;
    work.replaceChildren(said('t.s1'));
    await wait(1.6); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.c0', 1, 0.9); await wait(0.9); if (!alive()) return;
    tr.set('t.c1', 1, 0.9); await wait(0.9); if (!alive()) return;
    tr.set('t.L2', 1, 1.0); work.replaceChildren(said('t.s2'));
    await wait(2.4); if (!alive()) return;
    step = 2; drawPlan(); askPower();
  });

  function askPower(): void {
    const fbHost = h('div');
    const inp = numInput('', () => check());
    const ok = btn('Check', () => check(), 'go');
    const lead = html('span', 'op', 'the exponent of 3:');
    inp.node.prepend(lead);
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a whole number, like 4 or −2.')); return; }
      const v = r.v;
      const id = v === -3 ? 't.p-ok' : v === 3 ? 't.p-sign' : Math.abs(v - 0.4) < 1e-9 ? 't.p-div' : v === 7 ? 't.p-add' : 't.p-other';
      const mc = v === 3 ? 'mc.integers.drops-sign-of-computed-result' : Math.abs(v - 0.4) < 1e-9 ? 'mc.exponents-roots.quotient-divides-exponents' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.power', prompt: '3^2 / 3^5 = 3^?', board: '\\frac{3^2}{3^5}', response: r, expected: -3, correct: v === -3, mc });
      fbHost.replaceChildren(fb(v === -3, id));
      if (v !== -3) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.k.b', 0, 0.5); tr.set('t.k.afterL', 1, 0.9, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('t.L3', 1, 0.9); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); askValue();
      });
    }
    work.replaceChildren(said('t.pow'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askValue(): void {
    const fbHost = h('div');
    const inp = fracInput('', () => check(), false);
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      const q = r ? readQ(r) : null;
      if (!q) { fbHost.replaceChildren(feedback(false, 'Type a fraction: the top box and the bottom box.')); return; }
      const eq = (p: number, d = 1) => { const t = rat(p, d); return q.p === t.p && q.q === t.q; };
      const right = eq(1, 27);
      const id = right ? 't.v-ok' : eq(-27) || eq(-1, 27) ? 't.v-neg' : eq(1, 9) || eq(-9) || eq(-1, 9) ? 't.v-times' : eq(27) ? 't.v-flip' : 't.v-other';
      const mc = eq(-27) || eq(-1, 27) ? 'mc.exponents-roots.negative-exponent-makes-negative' : eq(1, 9) || eq(-9) ? 'mc.exponents-roots.power-as-base-times-exponent' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.value', prompt: '3^-3 = ?', board: '3^{-3}', response: r, expected: '1/27', correct: right, mc });
      fbHost.replaceChildren(fb(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.L4', 1, 0.9); tr.set('t.R', 1, 0.8, 0.3); await wait(1.8); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    }
    work.replaceChildren(said('t.val'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, card = CARDS[pick ?? 1]!;
    const ids = pick === null ? ['t.cb-right'] : [card.cb, ...(card.id && (commit().sure ?? 0) >= 1 ? ['t.cb-sure'] : [])];
    c.innerHTML = ids.map(i => SCRIPT[i]).join(' ');
    seq(async alive => { await wait(1.4); for (const i of ids) { if (!alive()) return; await ctx.say(i); } });
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Sam says 5^0 = 0 =====
function partProve(): void {
  tr.reset('p.');
  const mat = FactorMat({
    top: [...tiles('5', 2, 'first'), { label: '0', col: 'wrong' }], bottom: [],
    brackets: [
      { key: 'a', row: 'top', from: 0, to: 1, label: '5^{2}', col: 'first' },
      { key: 'z', row: 'top', from: 2, to: 2, label: '5^{0}', col: 'second', empty: true },
      { key: 'all', row: 'top', from: 0, to: 2, label: '5^{2+0} = 5^{2}', col: 'link', side: 'in' },
    ],
  }, LF, th);
  const Sam = bl('p.S', '\\text{Sam: }\\ 5^{0} = \\cssId{w}{0}', LX, 118, 96);
  const right = cl('p.Sm', '1', 0, 118, 96, 'link');
  const C1 = bl('p.C1', '\\cssId{a}{5^{2}} \\times \\cssId{b}{5^{0}} = 5^{2+0} = \\cssId{a}{5^{2}}', LX, 290, 84, TAGS);
  const C2 = bl('p.C2', '\\Rightarrow\\ \\ \\cssId{s}{5^{0} = 1}', LX + widthOf(C1) + 70, 290, 84, TAGS);
  const R = mat.where.right;
  const R25: Line = { key: 'p.r25', F: tex('= 25') as Formula, x: R.x, y: R.y, size: 80, col: 'link' };
  const R0: Line = { key: 'p.r0', F: tex('= 0') as Formula, x: R.x, y: R.y + 110, size: 80, col: 'wrong' };
  setStage({
    pre: 'p.', mat, lines: [Sam, C1, C2, R25, R0], focus: () => ({ ring: 'z', ringK: tr.k('p.p.z') }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) {
        const b = partOf(Sam, 'w'); strike(c, b.x0 - 10, b.cy + 8, b.x1 + 10, b.cy - 8, ks, { col: 'wrong' });
        const kw = tr.k('p.Sm');
        if (kw > 0) texDraw(c, right.F, b.x1 + 34, Sam.y, { size: right.size, align: 'left', k: kw, col: 'link' });
      }
    },
  });
  tr.set('p.mat', 1, 0.7, 0.3); tr.set('p.S', 1, 1.2, 0.6);

  const CHIPS = [
    { t: 'The product rule: multiplying powers of the same base adds the exponents.', fits: 0 },
    { t: 'Multiplying by 1 leaves every number the same.', fits: 1 },
    { t: 'Any number times 0 is 0.', fits: 2 },
    { t: '5⁰ = 1 is just a rule you have to memorize.', fits: -1, mc: 'mc.exponents-roots.zero-exponent-definition-seen-as-arbitrary', id: 'p.x-arb' },
    { t: '2⁰, 3⁰ and 10⁰ all give 1 on a calculator, so 5⁰ does too.', fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.x-examples' },
    { t: 'With no 5s multiplied, the 5 stays as it is.', fits: -1, mc: 'mc.exponents-roots.zero-exponent-as-base', id: 'p.x-base' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(CLAIMS[n - 1]!);
      seq(async alive => {
        if (n === 1) {
          tr.set('p.t0', 1, 0.5); tr.set('p.t1', 1, 0.5, 0.2); tr.set('p.k.a', 1, 0.7, 0.5); await wait(1.1); if (!alive()) return;
          tr.set('p.k.z', 1, 0.8); void bump('p.p.z', alive); await wait(1.2); if (!alive()) return;
          tr.set('p.k.all', 1, 0.9); tr.set('p.C1', 1, 1.1); await wait(1.2);
        }
        if (n === 2) {
          tr.set('p.one', 1, 0.8); await wait(0.8); if (!alive()) return;
          tr.set('p.r25', 1, 0.7); tr.set('p.C2', 1, 1.0); await wait(1.0);
        }
        if (n === 3) {
          tr.set('p.t2', 1, 0.7); await wait(0.8); if (!alive()) return;
          tr.set('p.r25:dim', 1, 0.5); tr.set('p.r0', 1, 0.8); await wait(1.4); if (!alive()) return;
          tr.set('p.strike', 1, 0.7); await wait(0.8); if (!alive()) return;
          tr.set('p.Sm', 1, 1.0); await wait(1.0); if (!alive()) return;
          tr.set('p.t2', 0, 0.6); tr.set('p.r0', 0, 0.6); tr.set('p.r25:dim', 0, 0.6); await wait(0.8); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const proofHost = h('div');
  const judge = h('div', { class: 'jsure' });
  let judged = false;
  const J = [
    { t: 'Yes: 5⁰ = 0', mc: 'mc.exponents-roots.zero-exponent-as-zero-or-base' as string | undefined, ok: false },
    { t: 'No: 5⁰ = 1', mc: undefined, ok: true },
    { t: 'No: 5⁰ = 5', mc: 'mc.exponents-roots.zero-exponent-as-base', ok: false },
  ];
  J.forEach((j, i) => judge.append(btn(j.t, () => {
    if (judged) return;
    judged = true;
    judge.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('on', k === i); (b as HTMLButtonElement).disabled = k !== i; });
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: 5^0 = 0 because there are no 5s. Is Sam right?', response: j.t, expected: 'No: 5^0 = 1', correct: j.ok, mc: j.mc });
    proofHost.replaceChildren(said(j.ok ? 'p.j-ok' : 'p.j-test'), chain, chipBox, fbHost);
    drawChain();
  })));
  setPanel(h('h2', {}, 'Prove it'), html('p', '', SCRIPT['p.intro']!), html('p', '', SCRIPT['p.ask']!), judge, proofHost);
  seq(async alive => { await ctx.say('p.intro'); if (alive()) void ctx.say('p.ask'); });
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
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as Pic | undefined;
  if (pic && pic.kind === 'mat') {
    const r = tryBlock(() => FactorMat(pic as MatParams, LF, th));
    if (r.ok) {
      const mat = r.value;
      const T = bl('x.T', item.board, LX, 219, 112);
      const R = mat.where.right;
      const RO: Line = { key: 'x.R', F: tex(pic.result) as Formula, x: R.x, y: R.y, size: 76, col: 'link' };
      // the readout must fit right of the mat; otherwise it goes on the board's second line
      const roFits = R.x + texWidth(RO.F, RO.size) < 1880;
      const ro: Line = roFits ? RO : { ...RO, x: LX, y: 330, size: 70 };
      const T2 = roFits ? T : bl('x.T', item.board, LX, 140, 100);
      setStage({ pre: 'x.', mat, lines: [T2, ro] });
      const brackets = pic.brackets ?? [];
      tr.set('x.mat', 1, 0.6);
      pic.top.forEach((_, i) => tr.set(`x.t${i}`, 1, 0.5, 0.2 + i * 0.1));
      pic.bottom.forEach((_, i) => tr.set(`x.b${i}`, 1, 0.5, 0.3 + i * 0.1));
      brackets.filter(b => !b.key.startsWith('after') && b.side !== 'in').forEach((b, i) => tr.set(`x.k.${b.key}`, 1, 0.7, 0.6 + i * 0.2));
      tr.set('x.T', 1, 0.8, 0.3);
      return {
        solve: async alive => {
          await wait(0.3); if (!alive()) return;
          if (pic.sort) {
            brackets.filter(b => !b.key.startsWith('after')).forEach(b => tr.set(`x.k.${b.key}`, 0, 0.4));
            tr.set('x.sort', 1, 1.4); await wait(1.5); if (!alive()) return;
          }
          const cancel = pic.cancel ?? 0;
          for (let i = 0; i < cancel; i++) { tr.set(`x.c${i}`, 1, 0.8); await wait(0.55); if (!alive()) return; }
          if (cancel > 0) await wait(0.4);
          if (cancel === pic.top.length && cancel === pic.bottom.length) { tr.set('x.one', 1, 0.7); await wait(0.6); }
          if (pic.top.length === 0 && pic.bottom.length === 0) { tr.set('x.one', 1, 0.7); await wait(0.6); }
          if (!alive()) return;
          brackets.filter(b => b.key.startsWith('after') || b.side === 'in').forEach(b => tr.set(`x.k.${b.key}`, 1, 0.8));
          tr.set('x.R', 1, 0.9); await wait(0.9);
        },
      };
    }
  }
  const big = box(260, 300, 1660, 780);
  const BL: Line = { ...bigLine('x.T', item.board, big, 140), tags: TAGS };
  setStage({ pre: 'x.', lines: [BL], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{area } t \\text{ hours after noon} = 2^{t}\\ \\text{mm}^2', '\\Rightarrow\\neq\\div 2', '\\left(\\frac{2}{3}\\right)^{-2}', '\\text{Sam: }\\ 5^{0}', 'x^{-2}y\\cdot'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
