// two-step-inequalities.ts: "Two-step inequalities" (grade 7, 7.EE.B.4.b) on the shared lesson runtime.
//   1 The question   a freezer at 50 °F cools 6 °F an hour: for which hours is it colder than 8 °F? 50 - 6h < 8.
//                    3 cards (h > 7; h < 7 = no reversal; h = 7 = only the boundary) + how sure
//   2 Worked example four subgoal steps on three stacked number lines (temperature, change, hours): read the set,
//                    undo the + 50 (the arrows slide side by side: the order stays), undo the × (-6) (the arrows
//                    CROSS: the order turns), test both sides; the chain of inequalities writes beside each line
//   3 Your turn      -3x + 4 ≤ 19, faded from the end: read + undo the + 4 are given; the kid finds where 15 lands,
//                    picks the set after the arrows cross, and tests x = -7; the callback to the part-1 card
//   4 Prove it       Jordan turns the symbol in 2x - 5 > -11 "because the numbers are negative"; a because-chain from
//                    reason chips (distractors = catalogue misconceptions), the lines back each claim
//   5 Practice       all 14 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/two-step-inequalities/script.ts (panel HTML) = voice/lines.json.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box, clamp, toQ } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { bigLine, markDirty, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { LINES_FRAME, StepLines, type StepBlock, type StepFocus, type StepParams, type SetSpec } from '../../src/lesson/topics/two-step-inequalities/StepLines';
import { type Ineq, type Op, OP_TEX, chainPicture, exprTex, flip, q, qNum, solve, tq, dirOf } from '../../src/lesson/topics/two-step-inequalities/ineqMaths';
import { FAMILY_NAMES, GENERATORS, MC, type IqItem, moveTex } from '../../src/lesson/topics/two-step-inequalities/items';
import { orderPicture, setPicture } from '../../src/lesson/topics/two-step-inequalities/pictures';
import { PLAN } from '../../src/lesson/topics/two-step-inequalities/plan';
import { SCRIPT } from '../../src/lesson/topics/two-step-inequalities/script';
import { drawFreezer, type FreezerOpts } from '../../src/lesson/topics/two-step-inequalities/Freezer';

const SLUG = 'two-step-inequalities';
const M = '&minus;';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const S_ = (id: string) => SCRIPT[id]?.html ?? id;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { void ctx.say(id); return html(tag, cls, S_(id)); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, S_(id), extra); };
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&minus;/g, '-').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

/** tr.set plus one more frame when the move ends (the stage loop can stop on the last busy frame; local helper) */
function ts(name: string, to: number, d = 0.9, delay = 0): void {
  tr.set(name, to, d, delay);
  setTimeout(markDirty, (d + delay) * 1000 + 120);
}
async function bump(key: string, alive: () => boolean): Promise<void> {
  ts(key, 1, 0.35); await wait(0.9); if (!alive()) return; ts(key, 0, 0.6);
}

// ===================== the board: inequalities aligned on their symbol =====================
/** this topic's slate: a little wider than the runtime board (a test row such as 50 - 6(9) = -4 < 8 needs it) */
const SLATE = box(1196, 70, 1876, 1010), SX = SLATE.x0 + 40, SW = SLATE.w - 80;
interface Row { key: string; lhs: string; op: string; rhs: string; y: number; tags?: Record<string, { col: Paint }>; col?: Paint }
const rowF = (r: Row): Formula => tex(`${r.lhs} \\cssId{o}{${r.op}} ${r.rhs}`) as Formula;
/** the box of one side of a row (left or right of its symbol) */
function side(L: Line, which: 'L' | 'R'): Box {
  const all = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }), e = partOf(L, 'o');
  return which === 'L' ? box(all.x0, all.y0, e.x0 - L.size * 0.2, all.y1) : box(e.x1 + L.size * 0.2, all.y0, all.x1, all.y1);
}
/** lay rows out so every symbol is in one column, the widest row centred on the board (shrinks to fit) */
function alignRows(rows: Row[], size: number): { lines: Line[]; ox: number; size: number } {
  const Fs = rows.map(rowF);
  let s = size, ox = 0;
  for (;;) {
    let mL = 0, mR = 0;
    for (const F of Fs) { const all = texBox(F, 0, 0, { size: s }), e = texBox(F, 0, 0, { size: s }, 'o'); mL = Math.max(mL, e.cx - all.x0); mR = Math.max(mR, all.x1 - e.cx); }
    if (mL + mR <= SW || s <= 60) { ox = SX + mL + (SW - mL - mR) / 2; break; }
    s -= 2;
  }
  return { size: s, ox, lines: rows.map((r, i) => { const F = Fs[i]!, e = texBox(F, 0, r.y, { size: s }, 'o'); return { key: r.key, F, x: ox - e.cx, y: r.y, size: s, tags: r.tags, col: r.col }; }) };
}
/** a short formula centred under a point (the move under each side) */
function under(key: string, src: string, cx: number, y: number, size: number, col: Paint = 'pick'): Line {
  const F = tex(src) as Formula, b = texBox(F, 0, y, { size });
  return { key, F, x: cx - b.cx, y, size, col };
}
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>, col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > SW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: SLATE.cx - b.cx, y, size: s, tags, col };
}
const NOT: Record<Op, string> = { '<': '\\nless', '>': '\\ngtr', '<=': '\\nleq', '>=': '\\ngeq' };
const teal = { col: 'second' as Paint }, amber = { col: 'first' as Paint }, lime = { col: 'link' as Paint }, lav = { col: 'pick' as Paint }, red = { col: 'wrong' as Paint };

// ===================== the solving chain: number lines + board rows, one builder for every part =====================
interface Y { E1: number; O1: number; E2: number; O2: number; E3: number; K1: number; K2: number }
const Y_LESSON: Y = { E1: 200, O1: 335, E2: 470, O2: 605, E3: 740, K1: 868, K2: 955 };
interface ChainOpts { y?: Y; size?: number; fast?: boolean; captions?: [string, string, string]; wrong?: SetSpec | null; extraRows?: Row[]; question?: string; testsUp?: boolean }
interface Chain {
  m: StepBlock; I: Ineq; lines: Line[]; leads: Lead[]; ox: number; size: number; E: [Line, Line, Line]; extra: Line[];
  show(d?: number): void;
  read(alive: () => boolean): Promise<void>;
  undo1(alive: () => boolean): Promise<void>;
  undo2move(alive: () => boolean): Promise<void>;
  undo2result(alive: () => boolean): Promise<void>;
  test(alive: () => boolean): Promise<void>;
  focus(): StepFocus;
}
function buildChain(pre: string, I: Ineq, o: ChainOpts = {}): Chain {
  const T = o.fast ? 0.6 : 1, Yy = o.y ?? Y_LESSON;
  const set = (k: string, v: number, d = 0.9, del = 0) => ts(pre + k, v, d * T, del * T), w = (s: number) => wait(s * T);
  const S = solve(I), f = I.form, v = I.v;
  const P = chainPicture(I, o.captions);
  const params: StepParams = { ...P, wrong: o.wrong ?? null };
  const m = StepLines(params, LINES_FRAME, th);
  const R = (lhs: string, op: string, rhs: string): { lhs: string; op: string; rhs: string } => ({ lhs, op, rhs });
  const r1 = I.side === 'L' ? R(`\\cssId{t}{${exprTex(I)}}`, OP_TEX[I.op], `\\cssId{r}{${tq(I.r, f)}}`) : R(`\\cssId{r}{${tq(I.r, f)}}`, OP_TEX[flip(I.op)], `\\cssId{t}{${exprTex(I)}}`);
  const mid = I.kind === 'lin' ? exprTex({ ...I, q: q(0) }) : exprTex({ ...I, kind: 'lin', p: q(1) });
  const r2 = I.side === 'L' ? R(`\\cssId{t}{${mid}}`, OP_TEX[S.midOp], `\\cssId{r}{${tq(S.mid, f)}}`) : R(`\\cssId{r}{${tq(S.mid, f)}}`, OP_TEX[flip(S.midOp)], `\\cssId{t}{${mid}}`);
  const r3 = I.side === 'L' ? R(`\\cssId{x}{${v}}`, OP_TEX[S.op], `\\cssId{b}{${tq(S.b, f)}}`) : R(`\\cssId{b}{${tq(S.b, f)}}`, OP_TEX[flip(S.op)], `\\cssId{x}{${v}}`);
  const opCol = S.reversed ? 'pick' : 'ink';
  const rows: Row[] = [
    { key: pre + 'E1', ...r1, y: Yy.E1, tags: { t: teal, r: amber } },
    { key: pre + 'E2', ...r2, y: Yy.E2, tags: { t: teal, r: amber } },
    { key: pre + 'E3', ...r3, y: Yy.E3, tags: { x: lime, b: lime, o: { col: opCol as Paint } } },
    ...(o.question ? [{ key: pre + 'Eq', lhs: v, op: '\\;?', rhs: '', y: Yy.E3 }] : []),
    ...(o.extraRows ?? []),
  ];
  const al = alignRows(rows, o.size ?? 84);
  const [E1, E2, E3] = al.lines as [Line, Line, Line];
  const extra = al.lines.slice(3);
  const os = Math.max(60, Math.round(al.size * 0.78));
  const O1 = [under(pre + 'O1', P.moves[0], side(E1, 'L').cx, Yy.O1, os), under(pre + 'O1', P.moves[0], side(E1, 'R').cx, Yy.O1, os)];
  const O2 = [under(pre + 'O2', P.moves[1], side(E2, 'L').cx, Yy.O2, os), under(pre + 'O2', P.moves[1], side(E2, 'R').cx, Yy.O2, os)];
  // the test rows: substitute each test value into the expression as written
  const sub = (t: number) => {
    const Qt = q(Math.round(t * 1000), 1000), val = I.kind === 'lin' ? qNum(I.p) * t + qNum(I.q) : qNum(I.p) * (t + qNum(I.q));
    const vs = I.kind === 'grp' && t >= 0 ? tq(Qt, f) : `(${tq(Qt, f)})`;
    const ok = P.tests.find(x => Math.abs(x.v - t) < 1e-9)!.ok;
    const valT = tq(q(Math.round(val * 1000), 1000), f);
    return `${exprTex({ ...I, v: `\\cssId{v}{${vs}}` })} = ${valT} \\cssId{s}{${ok ? OP_TEX[I.op] : NOT[I.op]}} ${tq(I.r, f)}${ok ? '\\, \\cssId{k}{\\checkmark}' : ''}`;
  };
  const K = I.side === 'R'
    ? [centred(pre + 'K1', `\\text{so }\\ \\cssId{x}{${v} ${OP_TEX[S.op]} ${tq(S.b, f)}}`, Yy.K1, Math.round(al.size * 0.9), { x: lime })]
    : (o.testsUp ? P.tests.slice() : P.tests.slice().reverse()).map((t, i) => centred(pre + (i ? 'K2' : 'K1'), sub(t.v), i ? Yy.K2 : Yy.K1, Math.round(al.size * 0.82), { v: lav, s: t.ok ? lime : red, k: lime }));
  const lines = [E1, ...O1, E2, ...O2, E3, ...extra, ...K];
  const leads: Lead[] = dirOf(S.op) > 0 ? [{ key: pre + 'ldS', from: () => partOf(E3, 'b'), to: () => m.where.tip(2), col: 'link' }] : [];
  const focus = (): StepFocus => ({
    dot: [0, 1, 2].map(i => tr.k(pre + 'pd' + i)), ray: [0, 1, 2].map(i => tr.k(pre + 'pr' + i)),
    dim: [0, 1, 2].map(i => tr.k(pre + 'dm' + i)), mapDim: [0, 1].map(i => tr.k(pre + 'md' + i)), wrongCross: tr.k(pre + 'wx'),
  });
  return {
    m, I, lines, leads, ox: al.ox, size: al.size, E: [E1, E2, E3], extra, focus,
    show(d = 0) { set('line0', 1, 1.0, d); set('E1', 1, 1.0, d + 0.5); set('set0', 1, 1.1, d + 0.9); },
    async read(alive) {
      set('line1', 1, 0.9); set('line2', 1, 0.9, 0.35); set('lab0', 1, 0.8, 0.6); await w(1.2); if (!alive()) return;
      void bump(pre + 'pd0', alive); void bump(pre + 'pr0', alive); await w(1.4);
    },
    async undo1(alive) {
      set('O1', 1, 0.8); await w(0.9); if (!alive()) return;
      set('map0', 1, 1.6); await w(1.6); if (!alive()) return;
      set('lab1', 1, 0.7); set('set1', 1, 1.1, 0.2); await w(1.1); if (!alive()) return;
      set('E2', 1, 1.0); void bump(pre + 'pd1', alive); await w(1.3); if (!alive()) return;
      set('E1:dim', 1, 0.5); set('O1:dim', 1, 0.5); set('md0', 1, 0.6); set('dm0', 1, 0.6);
    },
    async undo2move(alive) {
      set('O2', 1, 0.8); await w(0.9); if (!alive()) return;
      set('map1', 1, 1.9); await w(2.0); if (!alive()) return;
      set('lab2', 1, 0.7); await w(0.7);
    },
    async undo2result(alive) {
      set('Eq', 0, 0.4);
      set('set2', 1, 1.2); await w(1.1); if (!alive()) return;
      set('E3', 1, 1.0); await w(0.8); if (!alive()) return;
      if (S.reversed) void bump(pre + 'po', alive);
      if (leads.length) set('ldS', 1, 0.9, 0.3); else void bump(pre + 'pr2', alive);
      await w(1.4); if (!alive()) return;
      set('E2:dim', 1, 0.5); set('O2:dim', 1, 0.5); set('md1', 1, 0.6); set('dm1', 1, 0.6);
    },
    async test(alive) {
      set('ldS', 0, 0.4); set('E3:dim', 1, 0.5);
      set('test', 1, 1.8); await w(1.0); if (!alive()) return;
      set('K1', 1, 1.1); await w(1.2); if (!alive()) return;
      set('K2', 1, 1.1); await w(1.3);
    },
  };
}
/** the scene of a chain: the lines on the left, the board on the right, a ring on a turned symbol */
function chainScene(pre: string, C: Chain, extra?: (c: Canvas) => void, under?: (c: Canvas) => void): void {
  setScene({
    table: 1080,
    model: c => { under?.(c); C.m.draw(c, progressOf(s => tr.k(pre + s)), C.focus()); },
    lines: C.lines, leads: C.leads, boardBox: SLATE,
    extra: c => {
      const k = tr.k(pre + 'po');
      if (k > 0) {
        const b = partOf(C.E[2], 'o'), { g } = c;
        g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = th.roles.pick.fill; g.lineWidth = 4.5;
        g.beginPath(); g.roundRect(b.x0 - 14, b.y0 - 12, b.w + 28, b.h + 24, 14); g.stroke(); g.restore();
      }
      extra?.(c);
    },
  });
}
const jumpAll = (pre: string, keys: string[]) => { for (const k of keys) tr.jump(pre + k, 1); };

// ===================== 1. The question =====================
const EX: Ineq = { kind: 'lin', p: q(-6), q: q(50), r: q(8), op: '<', side: 'L', qFirst: true, form: 'int', v: 'h' };
const EX_CAPS: [string, string, string] = ['temperature, °F', 'change, °F', 'hours'];
/** the painted freezer under the temperature line while the other lines are not up yet */
const FZ: FreezerOpts = { x: 190, y: 380, w: 330, h: 520, reading: '50 °F', rate: '−6 °F' };
const CARDS = [
  { big: 'h &lt; 7', small: 'the first 7 hours', id: MC.noRev, cb: 't.cb-keep', right: false },
  { big: 'h &gt; 7', small: 'after 7 hours', id: '', cb: 't.cb-right', right: true },
  { big: 'h = 7', small: 'at exactly 7 hours', id: MC.boundaryOnly, cb: 't.cb-only', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const C = buildChain('q.', EX, { captions: EX_CAPS, question: 'h' });
  chainScene('q.', C, undefined, c => drawFreezer(c, FZ, tr.k('q.fz')));
  ts('q.fz', 1, 1.0); C.show(0.6); ts('q.Eq', 1, 0.8, 2.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A freezer at 50 °F cools 6 °F every hour. For which hours h is it colder than 8 °F? 50 - 6h < 8', board: '50 - 6h < 8', response: plainOf(c.big), expected: 'h > 7', correct: c.right, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span><i>${cd.big.slice(0, 1)}</i>${cd.big.slice(1)}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A freezer cools down'), say_('q.intro'), html('p', '', S_('q.ask')), cards, h('div', { class: 'label' }, S_('q.sure')), sure, h('div', { class: 'row' }, goBtn));
  setTimeout(() => sayOnly('q.ask'), 4800);
}

// ===================== 2. Worked example: 50 - 6h < 8 =====================
function partExample(): void {
  tr.reset('e.');
  const C = buildChain('e.', EX, { captions: EX_CAPS, question: 'h' });
  chainScene('e.', C, undefined, c => drawFreezer(c, FZ, tr.k('e.fz')));
  jumpAll('e.', ['line0', 'E1', 'set0', 'Eq', 'fz']);
  let step = 0;
  const STEPS = [
    { t: 'Read it', why: 'Which temperatures are below 8 °F?', act: 'Read it' },
    { t: 'Undo the + 50', why: 'Subtract 50 from both sides.', act: 'Subtract 50' },
    { t: 'Undo the × (−6)', why: 'Divide both sides by −6.', act: 'Divide' },
    { t: 'Test both sides', why: 'Put one number from each side back in.', act: 'Test' },
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
      if (i === 0) { ts('e.fz', 0, 0.5); await wait(0.4); if (!alive()) return; await C.read(alive); }
      else if (i === 1) await C.undo1(alive);
      else if (i === 2) { await C.undo2move(alive); if (!alive()) return; await C.undo2result(alive); }
      else await C.test(alive);
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `Dividing by ${M}6 mirrors every number through 0: what was smaller becomes bigger.`, ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'Because the problem has a minus sign in it.', ok: false, id: 'e.w-neg', mc: MC.anyNeg as string | undefined },
      { t: 'Because we subtracted 50, and subtracting turns it.', ok: false, id: 'e.w-sub', mc: MC.revAdd as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why did < turn into > ?', response: plainOf(o.t), correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', S_('e.why')), bx, fbHost);
    setTimeout(() => sayOnly('e.why'), 7500);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: -3x + 4 ≤ 19 (faded from the end) =====================
const TURN: Ineq = { kind: 'lin', p: q(-3), q: q(4), r: q(19), op: '<=', side: 'L', form: 'int', v: 'x' };
function partTurn(): void {
  tr.reset('t.');
  const C = buildChain('t.', TURN, { captions: ['−3x + 4', '−3x', 'x'], question: 'x', testsUp: true });
  chainScene('t.', C);
  C.show(0.2); ts('t.Eq', 1, 0.8, 1.4);
  let step = 0;
  const STEPS = [
    { t: 'Read it', why: 'Done for you.' },
    { t: 'Undo the + 4', why: 'Done for you: subtract 4 from both sides.' },
    { t: 'Undo the × (−3)', why: 'Your step.' },
    { t: 'Test both sides', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), say_('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.6); if (!alive()) return;
    await C.read(alive); if (!alive()) return;
    step = 1; drawPlan();
    await C.undo1(alive); if (!alive()) return;
    step = 2; drawPlan(); askLand();
  });
  function askLand(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.v === -5, mc = r.v === 5 ? MC.signDrop : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.land', prompt: '-3x ≤ 15: divide both sides by -3. Where does 15 land?', board: '-3x \\le 15', response: r.v, expected: -5, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fb(false, r.v === 5 ? 't.l-sign' : 't.l-no')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fb(true, 't.l-ok'));
      seq(async alive => { await C.undo2move(alive); if (!alive()) return; askSet(); });
    }
    work.replaceChildren(say_('t.land'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askSet(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: `<i>x</i> ≥ ${M}5`, ok: true, id: 't.s-ok', mc: undefined as string | undefined },
      { t: `<i>x</i> ≤ ${M}5`, ok: false, id: 't.s-keep', mc: MC.noRev as string | undefined },
      { t: `<i>x</i> &gt; ${M}5`, ok: false, id: 't.s-incl', mc: MC.flipIncl as string | undefined },
      { t: `<i>x</i> = ${M}5`, ok: false, id: 't.s-only', mc: MC.boundaryOnly as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.set', prompt: '-3x ≤ 15, divided by -3: which is the solution set?', board: '-3x \\le 15', response: plainOf(o.t), expected: 'x ≥ -5', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      seq(async alive => { await C.undo2result(alive); if (!alive()) return; step = 3; drawPlan(); askTest(); });
    })));
    work.replaceChildren(say_('t.sym'), bx, fbHost);
  }
  function askTest(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fb(false, 't.fill')); return; }
      const right = r.v === 25;
      ctx.store.log({ part: 'turn', item: 'turn.test', prompt: 'Test x = -7: -3(-7) + 4 = ?', response: r.v, expected: 25, correct: right, mc: r.v === -17 ? 'mc.integers.any-negative-makes-negative' : undefined });
      if (!right) { fbHost.replaceChildren(fb(false, r.v === -17 || r.v === -25 ? 't.t-sign' : 't.t-no')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fb(true, 't.t-ok'));
      seq(async alive => { await C.test(alive); if (!alive()) return; step = 4; drawPlan(); await wait(4.5); if (!alive()) return; fbHost.append(callback()); });
    }
    work.replaceChildren(say_('t.test'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.cb : 't.cb-none';
    sayOnly(id);
    c.innerHTML = (cd ? `You were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. ` : '') + S_(id);
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jordan turns the symbol in 2x - 5 > -11 =====================
const JORDAN: Ineq = { kind: 'lin', p: q(2), q: q(-5), r: q(-11), op: '>', side: 'L', form: 'int', v: 'x' };
function partProve(): void {
  tr.reset('p.');
  const Yp: Y = { E1: 200, O1: 335, E2: 470, O2: 605, E3: 862, K1: 2000, K2: 2000 };
  const jRow: Row = { key: 'p.J3', lhs: 'x', op: '<', rhs: '-3', y: 740 };
  const C = buildChain('p.', JORDAN, { captions: ['2x − 5', '2x', 'x'], y: Yp, wrong: { b: -3, dir: -1, closed: false, col: 'pick' }, extraRows: [jRow] });
  const J3 = C.extra[0]!;
  // Jordan's first two lines are right; his last line is struck only after the lines show why (never before the evidence)
  chainScene('p.', C, c => {
    const k = tr.k('p.strike');
    if (k > 0) { const a = side(J3, 'L'), b = side(J3, 'R'); strike(c, a.x0 - 12, a.cy + 6, b.x1 + 12, b.cy - 6, k, { col: 'wrong' }); }
  });
  C.show(0.2); ts('p.E2', 1, 0.9, 1.4); ts('p.J3', 1, 0.8, 2.0); ts('p.line1', 1, 0.8, 1.0); ts('p.line2', 1, 0.8, 1.3); ts('p.wrong', 1, 1.1, 2.4); ts('p.lab0', 1, 0.6, 1.6);
  const CHIPS = [
    { t: 'Adding slides every number the same way: nothing passes anything.', fits: 0 },
    { t: '2 is positive: dividing by it never swaps two numbers.', fits: 1 },
    { t: `${M}5 is in Jordan’s set, but 2(${M}5) ${M} 5 = ${M}15 is not greater than ${M}11.`, fits: 2 },
    { t: `${M}6 and ${M}11 are negative, so the symbol must turn.`, fits: -1, mc: MC.anyNeg, id: 'p.x-neg' },
    { t: 'Adding or subtracting can turn the symbol too.', fits: -1, mc: MC.revAdd, id: 'p.x-add' },
    { t: `<i>x</i> = ${M}3 makes 2<i>x</i> ${M} 5 = ${M}11, so ${M}3 is the answer.`, fits: -1, mc: MC.boundaryOnly, id: 'p.x-only' },
    { t: `<i>x</i> = ${M}1 works in <i>x</i> &gt; ${M}3, and one test is enough.`, fits: -1, mc: MC.oneTest, id: 'p.x-one' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  const order = [3, 0, 5, 1, 6, 4, 2];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${S_(id)}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plainOf(S_(CLAIMS[filled]!)), response: plainOf(ch.t), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    if (n < 3) sayOnly(CLAIMS[n]!);
    seq(async alive => {
      if (n === 1) await C.undo1(alive);
      if (n === 2) { await C.undo2move(alive); if (!alive()) return; await C.undo2result(alive); }
      if (n === 3) {
        ts('p.ldS', 0, 0.4);
        ts('p.test', 1, 1.8); await wait(2.0); if (!alive()) return;
        ts('p.wx', 1, 0.7); await wait(0.9); if (!alive()) return;
        ts('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: 2x - 5 > -11, add 5: 2x > -6, divide by 2: x < -3, "I turned the symbol because the numbers are negative." Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.anyNeg : undefined });
    proofHost.replaceChildren(say_(right ? 'p.test' : 'p.prove'), chain, chipBox, fbHost);
    setTimeout(() => sayOnly('p.c1'), 3600);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
const Y_PRACTICE: Y = { E1: 200, O1: 335, E2: 470, O2: 605, E3: 740, K1: 872, K2: 958 };
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as IqItem),
  });
}
function showItem(item: IqItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.kind === 'chain') {
    const made = tryBlock(() => buildChain('x.', pic.I, { y: Y_PRACTICE, size: 80, fast: true }));
    if (made.ok) {
      const C = made.value;
      chainScene('x.', C);
      C.show(0); ts('x.line1', 1, 0.8, 0.5); ts('x.line2', 1, 0.8, 0.7); ts('x.lab0', 1, 0.6, 1.0);
      return {
        solve: async alive => {
          await C.undo1(alive); if (!alive()) return;
          await C.undo2move(alive); if (!alive()) return;
          await C.undo2result(alive); if (!alive()) return;
          await C.test(alive);
        },
      };
    }
  }
  if (pic?.kind === 'order') {
    const made = tryBlock(() => {
      const P = orderPicture(pic), m = StepLines(P, LINES_FRAME, th), [y0, y1] = m.ys as [number, number];
      const A = Math.round(m.params.maps[0]!.a * pic.a * 1e6 + m.params.maps[0]!.c * 1e6) / 1e6, B = Math.round(m.params.maps[0]!.a * pic.b * 1e6 + m.params.maps[0]!.c * 1e6) / 1e6;
      const f = pic.move.form, o = pic.a < pic.b ? '<' : '>', o2 = A < B ? '<' : '>';
      const T = (v: number) => tq(q(Math.round(v * 1e6), 1e6), f);
      const L1 = centred('x.L1', `${T(pic.a)} ${o} ${T(pic.b)}`, y0, 88);
      const Om = centred('x.Om', moveTex(pic.move), (y0 + y1) / 2, 76, undefined, 'pick');
      const Lq = centred('x.Lq', `${T(A)} \\;?\\; ${T(B)}`, y1, 88);
      const L2 = centred('x.L2', `${T(A)} \\cssId{o}{${o2}} ${T(B)}`, y1, 88, { o: o2 === o ? lime : lav });
      return { m, L1, Om, Lq, L2 };
    });
    if (made.ok) {
      const { m, L1, Om, Lq, L2 } = made.value;
      setScene({ table: 1080, model: c => m.draw(c, progressOf(s => tr.k('x.' + s))), lines: [L1, Om, Lq, L2], leads: [], boardBox: SLATE });
      ts('x.line0', 1, 0.8); ts('x.lab0', 1, 0.6, 0.5); ts('x.line1', 1, 0.8, 0.4); ts('x.L1', 1, 0.8, 0.5); ts('x.Om', 1, 0.7, 1.0); ts('x.Lq', 1, 0.7, 1.3);
      return {
        solve: async alive => {
          ts('x.map0', 1, 1.6); await wait(1.6); if (!alive()) return;
          ts('x.lab1', 1, 0.7); await wait(0.8); if (!alive()) return;
          ts('x.Lq', 0, 0.4); ts('x.L2', 1, 1.0, 0.3);
        },
      };
    }
  }
  if (pic?.kind === 'set') {
    const made = tryBlock(() => {
      const m = StepLines(setPicture(pic), LINES_FRAME, th), y = m.ys[0]!;
      // the item's board, one centred row per part (an inequality, then the value to test)
      const T = item.board.split('\qquad').map((src, i) => centred('x.T', src.trim(), 220 + i * 120, 80));
      const bq = toQ(pic.b, 12) ?? q(Math.round(pic.b * 1000), 1000);
      const Sx = centred('x.S', `\\cssId{x}{${pic.v} ${OP_TEX[pic.op]} ${tq(bq, pic.form)}}`, y, 84, { x: lime });
      return { m, T, Sx };
    });
    if (made.ok) {
      const { m, T, Sx } = made.value;
      const leads: Lead[] = dirOf(pic.op) > 0 ? [{ key: 'x.ldS', from: () => partOf(Sx, 'x'), to: () => m.where.tip(0), col: 'link' }] : [];
      setScene({ table: 1080, model: c => m.draw(c, progressOf(s => tr.k('x.' + s)), { wrongCross: tr.k('x.wx'), ray: [tr.k('x.pr0')] }), lines: [...T, Sx], leads, boardBox: SLATE });
      ts('x.line0', 1, 0.8); ts('x.T', 1, 0.8, 0.3); if (pic.proposed) ts('x.wrong', 1, 1.0, 0.8);
      return {
        solve: async alive => {
          ts('x.set0', 1, 1.2); await wait(1.2); if (!alive()) return;
          ts('x.test', 1, 1.6); await wait(1.4); if (!alive()) return;
          const wrongSet = pic.proposed && !(pic.proposed.op === pic.op && pic.proposed.b === pic.b);
          if (wrongSet) { ts('x.wx', 1, 0.7); await wait(0.8); if (!alive()) return; }
          ts('x.S', 1, 1.0); await wait(0.9); if (!alive()) return;
          if (leads.length) ts('x.ldS', 1, 0.9); else void bump('x.pr0', alive);
        },
      };
    }
  }
  const big = box(260, 230, 1660, 790);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
  ts('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  // board formulas of parts 1-4 (glyphs load up front, so line widths are measured on the real font)
  warm: ['50 - 6h < 8', '-6h < -42', 'h > 7', '-\\,50 \\div (-6)', '50 - 6(9) = -4\\ <\\ 8\\ \\checkmark', '20 \\nless 8', '-3x + 4 \\le 19', 'x \\ge -5', '25 \\nleq 19', '2x - 5 > -11', 'h\\;?', '\\tfrac{1}{2}', '0.5', '\\xrightarrow{\\times (-1)}', '\\text{so }', '\\ngtr \\ngeq'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
