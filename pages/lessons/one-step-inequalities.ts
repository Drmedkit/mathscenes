// one-step-inequalities.ts: "One-step inequalities and signed one-step equations" (grade 7, 7.EE.B.4, 7.NS.A.3) on
// the shared lesson runtime. The model is a pair of number lines (SignLine): doing the same to both sides moves every
// number; + and − slide them (the arrows run parallel, the order stays), × or ÷ by a negative mirrors them through 0
// (the arrows cross, the order reverses).
//   1 The question   the temperature falls 2 °F an hour; Ava writes −2h < −6: which h? cards h < 3, h > 3, h = 3
//   2 Worked example Read it -> Divide by −2 (arrows cross) -> Graph h > 3 -> Check (one value each side); why "<" turned
//   3 Your turn      x ÷ (−3) ≥ 2, faded from the end: the reading is given; the kid picks × (−3), lands 2 on −6,
//                    picks x ≤ −6 and tests x = 0; callback to the card from part 1
//   4 Prove it       Jordan flips −3 + x ≤ 5 to x ≥ 8 "because there is a negative"; a because-chain from reason chips
//   5 Practice       all 11 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/one-step-inequalities/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, drawOn, strike } from '../../src/core/draw';
import { texBox, texWidth } from '../../src/core/tex';
import { type Box, box, clamp, unionBox } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BX, MF, bigLine, line, markDirty, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { SignLine, type SignLineBlock, type SignLineParams } from '../../src/lesson/topics/one-step-inequalities/SignLine';
import { drawVLead, type VLead } from '../../src/lesson/topics/one-step-inequalities/vlead';
import { FAMILY_NAMES, GENS, type LinePicture } from '../../src/lesson/topics/one-step-inequalities/items';
import { PLAN } from '../../src/lesson/topics/one-step-inequalities/plan';
import { SCRIPT } from '../../src/lesson/topics/one-step-inequalities/script';

const SLUG = 'one-step-inequalities';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function line_(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

/** tr.set plus one more frame when the move ends (a slow machine can stop the loop on the last busy frame) */
function ts(name: string, to: number, d = 0.9, delay = 0): void {
  tr.set(name, to, d, delay);
  setTimeout(markDirty, (d + delay) * 1000 + 120);
}
/** a 0 -> 1 -> 0 pulse */
async function bump(key: string, alive: () => boolean): Promise<void> {
  ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6);
}
const jump = (pre: string, keys: string[]) => { for (const k of keys) tr.jump(pre + k, 1); markDirty(); };
const YT = BOARD.y0 + 90;
const TOP = 330, BOT = 720;

/** a scene: the number lines on the left, the board on the right, vertical leaders, extras */
interface LineScene { pre: string; blk: SignLineBlock | null; lines: Line[]; vleads?: VLead[]; checks?: { L: Line; ok: boolean }[]; pulses?: string[]; extra?: (c: Parameters<NonNullable<Parameters<typeof setScene>[0]['extra']>>[0]) => void; boardBox?: Box | null }
function setLines(S: LineScene): void {
  setScene({
    table: 1080,
    model: c => {
      if (!S.blk) return;
      const pulse: Record<string, number> = {};
      for (const k of S.pulses ?? []) pulse[k] = tr.k(S.pre + 'pulse.' + k);
      S.blk.draw(c, progressOf(s => tr.k(S.pre + s)), { pulse });
    },
    lines: S.lines, leads: [], boardBox: S.boardBox,
    extra: c => {
      for (const d of S.vleads ?? []) drawVLead(c, d, tr.k(d.key), 1 - 0.6 * tr.k(d.key + ':dim'), BX);
      for (const q of S.checks ?? []) verdictMark(c, q.L, q.ok);
      S.extra?.(c);
    },
  });
}
const lineBlock = (p: SignLineParams) => SignLine(p, MF, th);
/** a check or a cross after a line of the board (true / false of a substitution), drawn on with the line */
function verdictMark(c: Canvas, L: Line, ok: boolean): void {
  const k = clamp((tr.k(L.key) - 0.5) / 0.5);
  if (k <= 0) return;
  const b = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }), x = b.x1 + 48, y = b.cy;
  if (ok) drawOn(c, [[x - 20, y + 2], [x - 6, y + 17], [x + 22, y - 18]], k, { col: 'link', lw: 7 });
  else { drawOn(c, [[x - 16, y - 16], [x + 16, y + 16]], clamp(k * 2), { col: 'wrong', lw: 7 }); drawOn(c, [[x + 16, y - 16], [x - 16, y + 16]], clamp(k * 2 - 1), { col: 'wrong', lw: 7 }); }
}

// ---------- the temperature lines (parts 1 and 2) ----------
const TEMP: SignLineParams = {
  axes: [
    { id: 'c', lo: -10, hi: 10, tick: 1, every: 5, y: TOP, side: 'above', name: '-2h', nameRole: 'second' },
    { id: 'h', lo: -10, hi: 10, tick: 1, every: 5, y: BOT, side: 'below', name: 'h', nameRole: 'link' },
  ],
  marks: [
    { key: 'm6', axis: 'c', v: -6, tex: '-6', role: 'first', dot: 'open' },
    { key: 'm3', axis: 'h', v: 3, tex: '3', role: 'link', dot: 'open' },
  ],
  sets: [{ key: 'sC', axis: 'c', from: -6, dir: -1, role: 'second' }, { key: 'sH', axis: 'h', from: 3, dir: 1, role: 'link' }],
  maps: [{ key: 'map', from: 'c', to: 'h', vs: [-6, -8, -10], op: { kind: 'mul', by: -0.5 }, role: 'pick', tex: '\\div(-2)' }],
  tests: [{ key: 't5', axis: 'h', v: 5, tex: '5', ok: true }, { key: 't1', axis: 'h', v: 1, tex: '1', ok: false }],
};
const T = { c: { col: 'second' as const }, q: { col: 'first' as const }, s: { col: 'link' as const }, r: { col: 'link' as const }, n: { col: 'link' as const }, y: { col: 'link' as const }, w: { col: 'wrong' as const }, u: { col: 'second' as const }, e: { col: 'second' as const }, p: { col: 'pick' as const }, p2: { col: 'pick' as const } };
const qLine = (pre: string) => line(pre + 'Q', '\\cssId{c}{-2h} < \\cssId{q}{-6}', YT, 100, T);

const CARDS = [
  { t: '<i>h</i> &lt; 3', small: 'fewer than 3 hours', id: 'mc.linear-equations.no-reversal-for-negative', cb: 't.cb-keep', right: false },
  { t: '<i>h</i> &gt; 3', small: 'more than 3 hours', id: '', cb: 't.cb-right', right: true },
  { t: '<i>h</i> = 3', small: 'exactly 3 hours', id: 'mc.linear-equations.boundary-only-solution', cb: 't.cb-eq', right: false },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const blk = lineBlock(TEMP);
  const W = line('q.W', '\\text{the change after } h \\text{ hours}', YT + 130, 50, undefined, 'dim');
  setLines({ pre: 'q.', blk, lines: [qLine('q.'), W], pulses: ['name.c', 'm6'] });
  ts('q.ax.c', 1, 1.0, 0.2); ts('q.m6', 1, 0.7, 1.2); ts('q.ax.h', 1, 1.0, 1.6);
  ts('q.Q', 1, 1.0, 2.2); ts('q.W', 1, 0.7, 2.9);
  seq(async alive => { await wait(2.4); if (!alive()) return; void bump('q.pulse.name.c', alive); await wait(0.6); if (!alive()) return; void bump('q.pulse.m6', alive); });

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'The temperature falls 2 °F an hour; −2h < −6: which h?', board: '-2h < -6', response: p.t.replace(/<[^>]+>/g, '').replace('&lt;', '<').replace('&gt;', '>'), expected: 'h > 3', correct: p.right, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.t}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = line_('q.intro');
  setTimeout(() => sayOnly('q.ava'), 5200);
  setPanel(h('h2', {}, 'A cold front'), intro, html('p', '', SCRIPT['q.ava']!), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: −2h < −6 =====
function partExample(): void {
  tr.reset('e.');
  const blk = lineBlock(TEMP), w = blk.where;
  const Q = qLine('e.');
  const L1 = line('e.L1', '\\frac{\\cssId{c}{-2h}}{-2} \\;\\cssId{r}{>}\\; \\frac{\\cssId{q}{-6}}{-2}', YT + 300, 84, T);
  const H = line('e.H', '\\cssId{s}{h > \\cssId{n}{3}}', YT + 480, 104, T);
  const C1 = line('e.C1', 'h = 5\\!:\\; -10 < -6', YT + 640, 60, T);
  const C2 = line('e.C2', 'h = 1\\!:\\; -2 < -6', YT + 750, 60, T);
  const vleads: VLead[] = [
    { key: 'e.ld1', from: () => partOf(Q, 'q'), to: () => w.mark('m6'), col: 'first', side: 'above', drop: 14 },
    { key: 'e.ld3', from: () => partOf(H, 'n'), to: () => w.mark('m3'), col: 'link', side: 'below' },
  ];
  setLines({ pre: 'e.', blk, lines: [Q, L1, H, C1, C2], vleads, checks: [{ L: C1, ok: true }, { L: C2, ok: false }], pulses: ['name.c', 'name.h', 'm6', 'm3', 'op.map'] });
  jump('e.', ['ax.c', 'ax.h', 'm6', 'Q']);

  let step = 0;
  const STEPS = [
    { t: 'Read it', why: 'Which changes are less than −6?', act: 'Read it' },
    { t: 'Divide both sides by −2', why: 'Undo the × (−2) and watch the order.', act: 'Divide' },
    { t: 'Graph it', why: 'Every answer, on the h line.', act: 'Graph' },
    { t: 'Check it', why: 'One value on each side of the boundary.', act: 'Check' },
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
        void bump('e.pulse.name.c', alive);
        ts('e.sC', 1, 1.3, 0.3); await wait(1.5); if (!alive()) return;
        ts('e.ld1', 1, 0.9); void bump('e.pulse.m6', alive); await wait(1.0);
      } else if (i === 1) {
        ts('e.ld1', 0, 0.4); ts('e.Q:dim', 1, 0.6);
        ts('e.map', 1, 2.0); void bump('e.pulse.op.map', alive); await wait(2.2); if (!alive()) return;
        ts('e.m3', 1, 0.7); await wait(0.6); if (!alive()) return;
        ts('e.L1', 1, 1.2); await wait(1.2);
      } else if (i === 2) {
        ts('e.L1:dim', 1, 0.6);
        ts('e.sH', 1, 1.3); await wait(1.3); if (!alive()) return;
        ts('e.H', 1, 1.0); await wait(0.8); if (!alive()) return;
        ts('e.ld3', 1, 0.9); void bump('e.pulse.m3', alive); await wait(1.0);
      } else {
        ts('e.ld3', 0, 0.4); ts('e.map', 0, 0.6); ts('e.L1', 0, 0.5);
        ts('e.t5', 1, 1.0, 0.4); ts('e.C1', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
        ts('e.t1', 1, 1.0); ts('e.C2', 1, 1.0, 0.2); await wait(1.5);
      }
      if (!alive()) return;
      sayBox.replaceChildren(line_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Dividing by a negative number mirrors the line through 0, so the order of any two numbers reverses.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'There are negative numbers in it, so you always flip.', ok: false, mc: 'mc.linear-equations.reverses-for-any-negative-sign', id: 'e.w-any' },
      { t: 'Dividing makes the numbers smaller, so the symbol turns.', ok: false, mc: 'mc.linear-equations.proper-fraction-scaling-reverses-order', id: 'e.w-small' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why did < turn into > when both sides of −2h < −6 were divided by −2?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 6500);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), line_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: x ÷ (−3) ≥ 2 (faded from the end) =====
const TURN: SignLineParams = {
  axes: [
    { id: 'u', lo: -14, hi: 6, tick: 1, every: 5, y: TOP, side: 'above', name: '\\frac{x}{-3}', nameRole: 'second' },
    { id: 'x', lo: -14, hi: 6, tick: 1, every: 5, y: BOT, side: 'below', name: 'x', nameRole: 'link' },
  ],
  marks: [{ key: 'm2', axis: 'u', v: 2, tex: '2', role: 'first', dot: 'closed' }, { key: 'm6', axis: 'x', v: -6, tex: '-6', role: 'link', dot: 'closed' }],
  sets: [{ key: 'sU', axis: 'u', from: 2, dir: 1, role: 'second' }, { key: 'sX', axis: 'x', from: -6, dir: -1, role: 'link' }],
  maps: [{ key: 'map', from: 'u', to: 'x', vs: [2, 3, 4], op: { kind: 'mul', by: -3 }, role: 'pick', tex: '\\times(-3)' }],
  tests: [{ key: 't9', axis: 'x', v: -9, tex: '-9', ok: true }, { key: 't0', axis: 'x', v: 0, tex: '0', ok: false }],
};
function partTurn(): void {
  tr.reset('t.');
  const blk = lineBlock(TURN), w = blk.where;
  const Q = line('t.Q', '\\cssId{u}{\\frac{x}{-3}} \\ge \\cssId{q}{2}', YT + 10, 96, T);
  const LA = line('t.LA', '2 \\times (-3) = \\cssId{n}{-6}', YT + 290, 76, T);
  const H = line('t.H', '\\cssId{s}{x \\le \\cssId{n}{-6}}', YT + 470, 104, T);
  const C1 = line('t.C1', 'x = -9\\!:\\; 3 \\ge 2', YT + 640, 60, T);
  const C2 = line('t.C2', 'x = 0\\!:\\; 0 \\ge 2', YT + 750, 60, T);
  const vleads: VLead[] = [
    { key: 't.ld1', from: () => partOf(Q, 'q'), to: () => w.mark('m2'), col: 'first', side: 'above', drop: 10 },
    { key: 't.ldH', from: () => partOf(H, 'n'), to: () => w.mark('m6'), col: 'link', side: 'below' },
  ];
  setLines({ pre: 't.', blk, lines: [Q, LA, H, C1, C2], vleads, checks: [{ L: C1, ok: true }, { L: C2, ok: false }], pulses: ['name.u', 'm2', 'm6', 'op.map'] });
  ts('t.ax.u', 1, 1.0, 0.2); ts('t.ax.x', 1, 1.0, 0.8); ts('t.Q', 1, 1.0, 1.4);

  let step = 0;
  const STEPS = [
    { t: 'Read it', why: 'Done for you.' },
    { t: 'Undo the ÷ (−3)', why: 'Your step.' },
    { t: 'Graph it: which way?', why: 'Your step.' },
    { t: 'Check it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), line_('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    void bump('t.pulse.name.u', alive);
    ts('t.m2', 1, 0.7); ts('t.sU', 1, 1.2, 0.4); await wait(1.4); if (!alive()) return;
    ts('t.ld1', 1, 0.9); void bump('t.pulse.m2', alive); await wait(1.2); if (!alive()) return;
    work.replaceChildren(line_('t.read'));
    await wait(5.5); if (!alive()) return;
    step = 1; drawPlan(); ts('t.ld1', 0, 0.4); ts('t.Q:dim', 1, 0.5);
    askUndo();
  });

  function askUndo(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'Multiply both sides by −3', ok: true, id: 't.u-ok', mc: undefined as string | undefined },
      { t: 'Multiply both sides by 3', ok: false, id: 't.u-nosign', mc: 'mc.integers.divide-by-coefficient-without-sign' },
      { t: 'Divide both sides by −3', ok: false, id: 't.u-div', mc: 'mc.equal-sign.operates-on-visible-numbers' },
    ];
    const bx = h('div', { class: 'opts' });
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item: 'turn.undo', prompt: 'x ÷ (−3) ≥ 2: what do you do to both sides?', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        ts('t.map', 1, 2.0); void bump('t.pulse.op.map', alive); await wait(2.4); if (!alive()) return;
        askLand();
      });
    })));
    work.replaceChildren(line_('t.undo'), bx, fbHost);
  }
  function askLand(): void {
    const fbHost = h('div');
    let done = false;
    const inp = numInput('', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.v === -6, nosign = r.v === 6;
      ctx.store.log({ part: 'turn', item: 'turn.land', prompt: 'x ÷ (−3) ≥ 2, times (−3): where does 2 land?', response: r, expected: -6, correct: right, mc: nosign ? 'mc.integers.divide-by-coefficient-without-sign' : undefined });
      fbHost.replaceChildren(fb(right, right ? 't.l-ok' : nosign ? 't.l-nosign' : 't.l-other'));
      if (!right) return;
      done = true; ok.disabled = true;
      seq(async alive => {
        ts('t.m6', 1, 0.7); ts('t.LA', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
        step = 2; drawPlan(); askSym();
      });
    }
    work.replaceChildren(line_('t.land'), h('div', { class: 'row' }, html('span', 'op', '2 → '), inp.node, ok), fbHost);
    inp.focus();
  }
  function askSym(): void {
    const fbHost = h('div');
    const opts = [
      { t: '<i>x</i> ≤ −6', ok: true, id: 't.s-ok', mc: undefined as string | undefined },
      { t: '<i>x</i> ≥ −6', ok: false, id: 't.s-keep', mc: 'mc.linear-equations.no-reversal-for-negative' },
      { t: '<i>x</i> = −6', ok: false, id: 't.s-eq', mc: 'mc.linear-equations.boundary-only-solution' },
      { t: '<i>x</i> &lt; −6', ok: false, id: 't.s-strict', mc: undefined },
    ];
    const bx = h('div', { class: 'opts two' });
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      ctx.store.log({ part: 'turn', item: 'turn.symbol', prompt: 'x ÷ (−3) ≥ 2: which numbers are the solutions?', response: o.t.replace(/<[^>]+>/g, '').replace('&lt;', '<'), expected: 'x ≤ −6', correct: o.ok, mc: o.mc });
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      bx.querySelectorAll('button').forEach(b => { (b as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        ts('t.LA:dim', 1, 0.5);
        ts('t.sX', 1, 1.3); await wait(1.3); if (!alive()) return;
        ts('t.H', 1, 1.0); await wait(0.8); if (!alive()) return;
        ts('t.ldH', 1, 0.9); void bump('t.pulse.m6', alive); await wait(2.6); if (!alive()) return;
        step = 3; drawPlan(); askTest();
      });
    })));
    work.replaceChildren(line_('t.sym'), bx, fbHost);
  }
  function askTest(): void {
    const fbHost = h('div');
    const yes = btn('Yes, it is a solution', () => answer(false)), no = btn('No, it is not', () => answer(true));
    function answer(right: boolean): void {
      yes.disabled = no.disabled = true;
      ctx.store.log({ part: 'turn', item: 'turn.test', prompt: 'x ÷ (−3) ≥ 2: is x = 0 a solution?', response: right ? 'no' : 'yes', expected: 'no', correct: right, mc: right ? undefined : 'mc.linear-equations.no-reversal-for-negative' });
      fbHost.replaceChildren(fb(right, right ? 't.t-ok' : 't.t-no'));
      seq(async alive => {
        ts('t.ldH', 0, 0.4); ts('t.map', 0, 0.6);
        ts('t.t0', 1, 1.0, 0.4); ts('t.C2', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
        ts('t.t9', 1, 1.0); ts('t.C1', 1, 1.0, 0.2); await wait(6.5); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    }
    work.replaceChildren(line_('t.test'), h('div', { class: 'row' }, yes, no), fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick;
    const p = CARDS[pick ?? 1]!;
    const id = pick === null ? 't.cb-right' : p.cb;
    sayOnly(id);
    c.innerHTML = (pick === null ? '' : `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Jordan flips −3 + x ≤ 5 =====
const PROVE: SignLineParams = {
  axes: [
    { id: 'e', lo: -4, hi: 12, tick: 1, every: 4, y: TOP, side: 'above', name: '-3 + x', nameRole: 'second' },
    { id: 'x', lo: -4, hi: 12, tick: 1, every: 4, y: BOT, side: 'below', name: 'x', nameRole: 'link' },
  ],
  marks: [{ key: 'm5', axis: 'e', v: 5, tex: '5', role: 'first', dot: 'closed' }, { key: 'm8', axis: 'x', v: 8, tex: '8', role: 'link', dot: 'closed' }],
  sets: [{ key: 'sE', axis: 'e', from: 5, dir: -1, role: 'second' }, { key: 'sX', axis: 'x', from: 8, dir: -1, role: 'link' }, { key: 'sJ', axis: 'x', from: 8, dir: 1, role: 'wrong', dashed: true }],
  maps: [{ key: 'map', from: 'e', to: 'x', vs: [5, 2, -1], op: { kind: 'add', by: 3 }, role: 'pick', tex: '+3' }],
  tests: [{ key: 't10', axis: 'x', v: 10, tex: '10', ok: false }],
};
function partProve(): void {
  tr.reset('p.');
  const blk = lineBlock(PROVE), w = blk.where;
  const J1 = line('p.J1', '\\text{Jordan: }\\; \\cssId{e}{-3 + x} \\le \\cssId{q}{5}', YT, 80, T);
  const J2 = line('p.J2', '\\cssId{j}{x \\ge 8}', YT + 120, 80);
  const C1 = line('p.C1', '-3 + x \\cssId{p}{\\,+\\,3} \\le 5 \\cssId{p2}{\\,+\\,3}', YT + 300, 72, T);
  const C2 = line('p.C2', '\\cssId{s}{x \\le \\cssId{n}{8}}', YT + 450, 96, T);
  const C3 = line('p.C3', 'x = 10\\!:\\; 7 \\le 5', YT + 640, 60, T);
  const vleads: VLead[] = [{ key: 'p.ldS', from: () => partOf(C2, 'n'), to: () => w.mark('m8'), col: 'link', side: 'below' }];
  setLines({
    pre: 'p.', blk, lines: [J1, J2, C1, C2, C3], vleads, checks: [{ L: C3, ok: false }], pulses: ['name.e', 'm5', 'm8', 'op.map', 't10'],
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J2, 'j'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  ts('p.ax.e', 1, 1.0, 0.2); ts('p.ax.x', 1, 1.0, 0.8); ts('p.m5', 1, 0.7, 1.4); ts('p.sE', 1, 1.0, 1.8);
  ts('p.J1', 1, 1.0, 2.0); ts('p.J2', 1, 0.9, 3.0);

  const CHIPS = [
    { t: 'Adding the same number to both sides keeps an inequality true.', fits: 0 },
    { t: 'Only multiplying or dividing by a negative number reverses the order.', fits: 1 },
    { t: '<i>x</i> = 10 fits <i>x</i> ≥ 8, but −3 + 10 = 7, and 7 ≤ 5 is false.', fits: 2 },
    { t: 'There is a negative number, so the symbol must flip.', fits: -1, mc: 'mc.linear-equations.reverses-for-any-negative-sign', id: 'p.x-any' },
    { t: 'Adding or subtracting turns the symbol around.', fits: -1, mc: 'mc.linear-equations.reverses-after-addition-or-subtraction', id: 'p.x-add' },
    { t: '<i>x</i> = 8 makes it true, so that checks the whole answer.', fits: -1, mc: 'mc.linear-equations.boundary-only-solution', id: 'p.x-boundary' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      if (n < 3) sayOnly(CLAIMS[n]!);
      seq(async alive => {
        if (n === 1) {
          ts('p.map', 1, 1.8); void bump('p.pulse.op.map', alive); await wait(1.4); if (!alive()) return;
          ts('p.C1', 1, 1.0); await wait(0.6); if (!alive()) return;
          void bump('p.pulse.op.map', alive);
        }
        if (n === 2) {
          ts('p.C1:dim', 1, 0.5); ts('p.J1:dim', 1, 0.5);
          ts('p.m8', 1, 0.7); ts('p.sX', 1, 1.2, 0.3); await wait(1.5); if (!alive()) return;
          ts('p.C2', 1, 1.0); await wait(0.8); if (!alive()) return;
          ts('p.ldS', 1, 0.9); void bump('p.pulse.m8', alive);
        }
        if (n === 3) {
          ts('p.ldS', 0, 0.4); ts('p.map', 0, 0.6); ts('p.C2:dim', 1, 0.5);
          ts('p.sJ', 1, 1.1, 0.3); await wait(1.4); if (!alive()) return;
          ts('p.t10', 1, 1.1); ts('p.C3', 1, 1.0, 0.3); await wait(1.6); if (!alive()) return;
          void bump('p.pulse.t10', alive); ts('p.strike', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
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
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: −3 + x ≤ 5 has a negative, so flip: x ≥ 8. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.linear-equations.reverses-for-any-negative-sign' : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(line_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 4200);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), line_('p.intro'), verdict, proofHost);
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
/** draw a practice item: its number line(s) with the item on the board, or the bare notation big */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as LinePicture | undefined;
  const mk = pic?.kind === 'line' ? tryBlock(() => lineBlock(pic.params)) : null;
  if (mk && mk.ok && pic) {
    const blk = mk.value;
    const two = pic.params.axes.length > 1;
    const TL = line('x.T', item.board, YT, 84);
    const fitsBoard = (src: string) => { const L = line('x.tmp', src, 0, 60); return texWidth(L.F, L.size) <= BOARD.w - 108; };
    const srcs = pic.board.filter(fitsBoard), last = srcs.length - 1;
    const sol = srcs.map((src, i) => line(`x.S${i}`, src, (two ? YT + 330 : YT + 190) + i * 140, i === last ? 92 : 76, undefined, i === last ? 'link' : undefined));
    setLines({ pre: 'x.', blk, lines: [TL, ...sol] });
    pic.show.forEach((k, i) => ts('x.' + k, 1, 0.8, 0.1 + i * 0.25));
    for (const k of pic.half ?? []) ts('x.' + k, 0.5, 0.6, 0.6);
    ts('x.T', 1, 0.8, 0.4);
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        for (const k of pic.solve) { ts('x.' + k, 1, 0.9); await wait(0.7); if (!alive()) return; }
        for (let i = 0; i < sol.length; i++) { ts(`x.S${i}`, 1, 1.0); await wait(0.8); if (!alive()) return; }
      },
    };
  }
  const big = box(300, 260, 1620, 760);
  setLines({ pre: 'x.', blk: null, lines: [bigLine('x.T', item.board, big)], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}
void unionBox;

void runLesson({
  slug: SLUG,
  warm: ['\\text{Jordan: }', '\\frac{x}{-3}', '\\le \\ge', '\\text{true false}', '\\div(-2) \\times(-3)'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
