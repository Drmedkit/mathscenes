// two-step-equations.ts: "Two-step equations" (grade 7, 7.EE.B.4.a) on the shared lesson runtime.
//   1 The question   3 bags + 6 marbles balance 27: how many in a bag? 3 cards (7; 3 = divides first; 11 = adds the 6)
//   2 Worked example four subgoal steps on the balance: read the chain, undo the last step first (6 off both pans),
//                    undo the × 3 (split both pans into 3 shares), check (open the bags); the backward arithmetic chain
//                    and the vertical chain of equations write beside it; one "why?" with 3 reasons
//   3 Your turn      4x + 9 = 33, faded from the end: read + undo the + 9 are given, the kid undoes the × 4 and checks
//   4 Prove it       Sam divides only some terms (2x + 8 = 20 -> x + 8 = 10): the beam tips; a because-chain from
//                    reason chips (distractors = catalogue misconceptions), the balance backs each line
//   5 Practice       all 10 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/two-step-equations/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, LX, BOARD_W, bigLine, bump, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { BALANCE_FRAME } from '../../src/lesson/topics/two-step-equations/balanceMaths';
import { Balance, type BalanceBlock, type BalanceFocus, type BalanceStep, type LabelPart } from '../../src/lesson/topics/two-step-equations/Balance';
import { FAMILY_NAMES, GENERATORS, MC, type EqItem } from '../../src/lesson/topics/two-step-equations/items';
import { PLAN } from '../../src/lesson/topics/two-step-equations/plan';
import { explain } from '../../src/lesson/topics/two-step-equations/explain';
import LINES from './two-step-equations/voice/lines.json';

const SLUG = 'two-step-equations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const X = '<i>x</i>';
/** a voiced panel line: the HTML shown is the line's text with colour marks; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { say(id); return feedback(ok, htmlText); }

// ===================== the board: equations aligned on their = sign =====================
interface Row { key: string; lhs: string; rhs: string; y: number; tags?: Record<string, { col: Paint }>; col?: Paint }
function eqF(r: Row): Formula { return tex(`${r.lhs} \\cssId{eq}{=} ${r.rhs}`) as Formula; }
/** the box of one side of an equation line (left or right of its = sign) */
function side(L: Line, which: 'L' | 'R') {
  const all = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }), e = partOf(L, 'eq');
  return which === 'L' ? box(all.x0, all.y0, e.x0 - L.size * 0.2, all.y1) : box(e.x1 + L.size * 0.2, all.y0, all.x1, all.y1);
}
/** lay rows out so every = sign is in one column, the widest row centred on the board (shrinks to fit) */
function alignRows(rows: Row[], size: number): { lines: Line[]; eqx: number; size: number } {
  const Fs = rows.map(eqF);
  let s = size, eqx = 0;
  for (;;) {
    let mL = 0, mR = 0;
    for (const F of Fs) { const all = texBox(F, 0, 0, { size: s }), e = texBox(F, 0, 0, { size: s }, 'eq'); mL = Math.max(mL, e.cx - all.x0); mR = Math.max(mR, all.x1 - e.cx); }
    if (mL + mR <= BOARD_W || s <= 60) { eqx = LX + mL + (BOARD_W - mL - mR) / 2; break; }
    s -= 2;
  }
  return { size: s, eqx, lines: rows.map((r, i) => { const F = Fs[i]!, e = texBox(F, 0, r.y, { size: s }, 'eq'); return { key: r.key, F, x: eqx - e.cx, y: r.y, size: s, tags: r.tags, col: r.col }; }) };
}
function rowAt(r: Row, eqx: number, size: number): Line { const F = eqF(r), e = texBox(F, 0, r.y, { size }, 'eq'); return { key: r.key, F, x: eqx - e.cx, y: r.y, size, tags: r.tags, col: r.col }; }
/** a short formula centred under a point (the "− 6" under each side) */
function under(key: string, src: string, cx: number, y: number, size: number, col: Paint = 'pick'): Line {
  const F = tex(src) as Formula, b = texBox(F, 0, y, { size });
  return { key, F, x: cx - b.cx, y, size, col };
}
function centred(key: string, src: string, y: number, size: number, tags?: Record<string, { col: Paint }>): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BOARD_W) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BOARD.cx - b.cx, y, size: s, tags };
}

// ===================== the solving chain: board lines + balance moves, one builder for every part =====================
interface Spec { p: number; q: number; r: number; grouped?: boolean }
interface Y { F: number; B: number; E1: number; O1: number; E2: number; O2: number; E3: number; K: number }
const Y_LESSON: Y = { F: 165, B: 285, E1: 425, O1: 505, E2: 590, O2: 670, E3: 755, K: 910 };
const Y_PRACTICE: Y = { F: 0, B: 0, E1: 200, O1: 285, E2: 375, O2: 460, E3: 550, K: 720 };
interface Chain {
  m: BalanceBlock; lines: Line[]; leads: Lead[]; eqx: number; size: number;
  P: { k(s: BalanceStep): number };
  focus(extra?: Partial<BalanceFocus>): BalanceFocus;
  showModel(delay?: number): void;
  read(alive: () => boolean): Promise<void>;
  undo1(alive: () => boolean): Promise<void>;
  undo2move(alive: () => boolean): Promise<void>;
  undo2result(alive: () => boolean): Promise<void>;
  check(alive: () => boolean): Promise<void>;
  E: Line[];
}
function buildChain(pre: string, s: Spec, o: { chain?: boolean; y?: Y; size?: number; extraRows?: Row[]; question?: boolean; fast?: boolean } = {}): Chain {
  const T = o.fast ? 0.6 : 1;
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set(k, v, d * T, del * T), w = (sec: number) => wait(sec * T);
  const m = Balance(s, BALANCE_FRAME, th), { p, q, r, x } = m.maths, g = !!s.grouped, Yy = o.y ?? Y_LESSON;
  const amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint }, lime = { col: 'link' as Paint };
  const rows: Row[] = g ? [
    { key: pre + 'E1', lhs: `\\cssId{p}{${p}}(x + \\cssId{q}{${q}})`, rhs: `\\cssId{r}{${r}}`, y: Yy.E1, tags: { p: teal, q: amber, r: amber } },
    { key: pre + 'E2', lhs: `x + \\cssId{q}{${q}}`, rhs: `\\cssId{r}{${r / p}}`, y: Yy.E2, tags: { q: amber, r: amber } },
    { key: pre + 'E3', lhs: `\\cssId{x}{x}`, rhs: `\\cssId{v}{${x}}`, y: Yy.E3, tags: { x: lime, v: lime } },
  ] : [
    { key: pre + 'E1', lhs: `\\cssId{px}{${p === 1 ? '' : p}x} + \\cssId{q}{${q}}`, rhs: `\\cssId{r}{${r}}`, y: Yy.E1, tags: { px: teal, q: amber, r: amber } },
    { key: pre + 'E2', lhs: `\\cssId{px}{${p === 1 ? '' : p}x}`, rhs: `\\cssId{r}{${r - q}}`, y: Yy.E2, tags: { px: teal, r: amber } },
    { key: pre + 'E3', lhs: `\\cssId{x}{x}`, rhs: `\\cssId{v}{${x}}`, y: Yy.E3, tags: { x: lime, v: lime } },
  ];
  const qRow: Row = { key: pre + 'Eq', lhs: 'x', rhs: '\\,?', y: Yy.E3 };
  const al = alignRows([...rows, qRow, ...(o.extraRows ?? [])], o.size ?? 80);
  const [E1, E2, E3] = al.lines as [Line, Line, Line];
  const EQ = al.lines[3]!;
  const os = Math.max(60, Math.round(al.size * 0.78));
  const box1 = (L: Line, t: string) => partOf(L, t);
  const O1 = g
    ? [under(pre + 'O1', `\\div ${p}`, side(E1, 'L').cx, Yy.O1, os), under(pre + 'O1', `\\div ${p}`, side(E1, 'R').cx, Yy.O1, os)]
    : [under(pre + 'O1', `-\\,${q}`, box1(E1, 'q').cx, Yy.O1, os), under(pre + 'O1', `-\\,${q}`, side(E1, 'R').cx, Yy.O1, os)];
  const O2 = g
    ? [under(pre + 'O2', `-\\,${q}`, box1(E2, 'q').cx, Yy.O2, os), under(pre + 'O2', `-\\,${q}`, side(E2, 'R').cx, Yy.O2, os)]
    : [under(pre + 'O2', `\\div ${p}`, box1(E2, 'px').cx, Yy.O2, os), under(pre + 'O2', `\\div ${p}`, side(E2, 'R').cx, Yy.O2, os)];
  const K = centred(pre + 'K', g ? `${p}(\\cssId{v}{${x}} + ${q}) = ${r}\\ \\cssId{ok}{\\checkmark}` : `${p === 1 ? '' : p}(\\cssId{v}{${x}}) + ${q} = ${r}\\ \\cssId{ok}{\\checkmark}`, Yy.K, Math.round(al.size * 0.9), { v: lime, ok: lime });
  // the forward chain of operations and, under it, the backward (arithmetic) chain, part by part
  const chainLines: Line[] = [];
  if (o.chain) {
    const fw = g ? `\\cssId{f1}{x} \\xrightarrow{\\cssId{f2}{+${q}}} \\cssId{f3}{x + ${q}} \\xrightarrow{\\cssId{f4}{\\times ${p}}} \\cssId{f5}{${r}}`
      : `\\cssId{f1}{x} \\xrightarrow{\\cssId{f2}{\\times ${p}}} \\cssId{f3}{${p}x} \\xrightarrow{\\cssId{f4}{+${q}}} \\cssId{f5}{${r}}`;
    const Fl = centred(pre + 'fwd', fw, Yy.F, 66, g ? { f2: amber, f4: teal, f5: amber } : { f2: teal, f4: amber, f5: amber });
    chainLines.push(Fl);
    const at = (t: string) => partOf(Fl, t).cx, bs = Fl.size;
    const mid = g ? r / p : r - q;
    chainLines.push(
      under(pre + 'bk1', `${r}`, at('f5'), Yy.B, bs, 'first'),
      under(pre + 'bk1', `\\xleftarrow{${g ? `\\div ${p}` : `-${q}`}}`, at('f4'), Yy.B, bs, 'pick'),
      under(pre + 'bk1', `${mid}`, at('f3'), Yy.B, bs, 'first'),
      under(pre + 'bk2', `\\xleftarrow{${g ? `-${q}` : `\\div ${p}`}}`, at('f2'), Yy.B, bs, 'pick'),
      under(pre + 'bk2', `${x}`, at('f1'), Yy.B, bs, 'link'),
    );
  }
  const lines = [...chainLines, E1, ...O1, E2, ...O2, E3, ...(o.question ? [EQ] : []), K];
  const leads: Lead[] = [{ key: pre + 'ldX', from: () => partOf(E3, 'v'), to: () => m.where.share, col: 'link' }];
  const P = progressOf<BalanceStep>(st => tr.k(pre + 'b.' + st));
  const focus = (extra: Partial<BalanceFocus> = {}): BalanceFocus => ({
    rings: [
      { at: 'bags', col: 'second', k: tr.k(pre + 'rB') }, { at: 'left', col: 'first', k: tr.k(pre + 'rL') },
      { at: 'right', col: 'first', k: tr.k(pre + 'rR') },
      { at: 'takenL', col: 'pick', k: tr.k(pre + 'rT') }, { at: 'takenR', col: 'pick', k: tr.k(pre + 'rT') },
      { at: 'leftRow0', col: 'link', k: tr.k(pre + 'rX') },
    ],
    labelL: tr.k(pre + 'pL'), labelR: tr.k(pre + 'pR'),
    ...extra,
  });
  const take = async (alive: () => boolean, O: string, E: string, bk: string) => {
    set(O, 1, 0.8); set(pre + 'rT', 1, 0.5, 0.3); await w(1.3); if (!alive()) return;
    set(pre + 'b.take', 1, 1.4); set(pre + 'rT', 0, 0.4, 0.5); await w(1.5); if (!alive()) return;
    set(E, 1, 1.0); void bump(pre + 'pR', alive); if (o.chain) set(bk, 1, 1.0, 0.4); await w(1.3);
  };
  const split = async (alive: () => boolean, O: string) => {
    set(O, 1, 0.8); await w(0.9); if (!alive()) return;
    set(pre + 'b.split', 1, 1.8); await w(2.0); if (!alive()) return;
    set(pre + 'b.keep', 1, 0.9); await w(1.0);
  };
  return {
    m, lines, leads, eqx: al.eqx, size: al.size, P, focus, E: [E1, E2, E3],
    showModel(d = 0) {
      set(pre + 'b.stand', 1, 0.8, d); set(pre + 'b.left', 1, 1.2, d + 0.4); set(pre + 'b.right', 1, 1.6, d + 0.9);
    },
    async read(alive) {
      set(pre + 'fwd', 1, 1.8); await w(0.5); if (!alive()) return;
      if (g) { set(pre + 'rL', 1, 0.4); await w(0.6); if (!alive()) return; set(pre + 'rB', 1, 0.4); }
      else { set(pre + 'rB', 1, 0.4); await w(0.6); if (!alive()) return; set(pre + 'rL', 1, 0.4); }
      await w(0.6); if (!alive()) return;
      void bump(pre + 'pR', alive); await w(1.2); if (!alive()) return;
      set(pre + 'rB', 0, 0.5); set(pre + 'rL', 0, 0.5);
    },
    async undo1(alive) {
      set(pre + 'fwd:dim', 1, 0.5);
      if (g) { await split(alive, pre + 'O1'); if (!alive()) return; set(pre + 'E2', 1, 1.0); void bump(pre + 'pR', alive); if (o.chain) set(pre + 'bk1', 1, 1.0, 0.4); await w(1.3); }
      else await take(alive, pre + 'O1', pre + 'E2', pre + 'bk1');
      set(pre + 'E1:dim', 1, 0.5); set(pre + 'O1:dim', 1, 0.5);
    },
    async undo2move(alive) {
      if (g) { set(pre + 'O2', 1, 0.8); set(pre + 'rT', 1, 0.5, 0.3); await w(1.3); if (!alive()) return; set(pre + 'b.take', 1, 1.4); set(pre + 'rT', 0, 0.4, 0.5); await w(1.5); }
      else await split(alive, pre + 'O2');
    },
    async undo2result(alive) {
      set(pre + 'E2:dim', 1, 0.5); set(pre + 'O2:dim', 1, 0.5); set(pre + 'Eq', 0, 0.5);
      set(pre + 'E3', 1, 1.0, 0.2); set(pre + 'rX', 1, 0.5, 0.6); set(pre + 'ldX', 1, 0.9, 1.0);
      if (o.chain) set(pre + 'bk2', 1, 1.0, 0.6);
      await w(2.0);
    },
    async check(alive) {
      set(pre + 'rX', 0, 0.4); set(pre + 'ldX', 0, 0.5); set(pre + 'E3:dim', 1, 0.5);
      set(pre + 'b.keep', 0, 0.8); await w(0.8); if (!alive()) return;
      set(pre + 'b.split', 0, 1.4); set(pre + 'b.take', 0, 1.2, 0.6); await w(2.0); if (!alive()) return;
      set(pre + 'b.open', 1, 0.9); await w(0.8); if (!alive()) return;
      set(pre + 'K', 1, 1.2); void bump(pre + 'pL', alive); void bump(pre + 'pR', alive); await w(1.4);
    },
  };
}
function chainScene(C: Chain, extra?: (c: Canvas) => void, focusExtra?: () => Partial<BalanceFocus>): void {
  setScene({ table: C.m.layout.table, model: c => C.m.draw(c, C.P, C.focus(focusExtra?.())), lines: C.lines, leads: C.leads, extra });
}

// ===================== 1. The question =====================
const CARDS = [
  { v: 11, id: MC.forward, why: 'q.cb.fwd' },
  { v: 7, id: '', why: 'q.cb.right' },
  { v: 3, id: MC.wrongOrder, why: 'q.cb.order' },
];
const EX: Spec = { p: 3, q: 6, r: 27 };
function partQuestion(): void {
  tr.reset('q.');
  const C = buildChain('q.', EX, { question: true });
  chainScene(C);
  C.showModel(); tr.set('q.E1', 1, 1.0, 2.2); tr.set('q.Eq', 1, 0.8, 2.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '3 bags + 6 marbles balance 27 marbles: how many marbles in one bag?', board: '3x + 6 = 27', response: c.v, expected: 7, correct: c.v === 7, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>marbles</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Bags on a balance'),
    voiced('q.intro', `<b class="b">3 bags</b> hold the same number of marbles each. Together with <b class="a">6 loose marbles</b>, they balance <b class="a">27 marbles</b> on the other pan. How many marbles are in one bag? Pick an answer, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example: 3x + 6 = 27 =====================
function partExample(): void {
  tr.reset('e.');
  const C = buildChain('e.', EX, { chain: true, question: true });
  chainScene(C);
  for (const s of ['stand', 'left', 'right']) tr.jump('e.b.' + s, 1);
  tr.jump('e.E1', 1); tr.jump('e.Eq', 1);
  let step = 0;
  const STEPS = [
    { t: 'Read the chain', why: `What was done to ${X}, in order?`, act: 'Read it' },
    { t: 'Undo the last step first', why: 'Take 6 off both pans.', act: 'Take 6 off' },
    { t: 'Undo the × 3', why: 'Split both pans into 3 equal shares.', act: 'Split' },
    { t: 'Check it', why: `Put 7 back in for ${X}.`, act: 'Check' },
  ];
  const SAY = [
    `Start with ${X}, the marbles in one bag. <b class="b">× 3</b> gives the 3 bags. <b class="a">+ 6</b> adds the loose marbles. That makes <b class="a">27</b>.`,
    `The <b class="a">+ 6</b> was done last, so it comes off first. Take 6 off both pans: still level. <b class="b">3${X}</b> = <b class="a">21</b>.`,
    `Now undo the <b class="b">× 3</b>. Split both pans into 3 equal shares: one bag balances 7 marbles. <b class="s">${X} = 7</b>.`,
    `Put the marbles back and open the bags: 3 × 7 + 6 = 27. Both pans match, so <b class="s">${X} = 7</b> is right.`,
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
      if (i === 0) await C.read(alive);
      else if (i === 1) await C.undo1(alive);
      else if (i === 2) { await C.undo2move(alive); if (!alive()) return; await C.undo2result(alive); }
      else await C.check(alive);
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `The + 6 was the last thing done to ${X}, so it is the first thing undone.`, ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. Undo a chain from the end, like taking off your shoes before your socks.' },
      { t: 'Either order works: dividing first gives the same answer.', ok: false, id: 'e.why.order', mc: MC.wrongOrder, say: 'Try it: 27 ÷ 3 = 9, then 9 − 6 = 3. But 3 × 3 + 6 = 15, not 27. Dividing first would have to split the 6 too.' },
      { t: 'The 6 is on the left, so it moves to the right.', ok: false, id: 'e.why.move', mc: MC.transfer, say: 'Nothing moved across. 6 came off both pans, and that is what kept them level.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why did the 6 come off before dividing by 3?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why did the 6 come off before dividing by 3?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the balance moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 4x + 9 = 33 (faded from the end) =====================
const TURN: Spec = { p: 4, q: 9, r: 33 };
function partTurn(): void {
  tr.reset('t.');
  const C = buildChain('t.', TURN, { chain: true, question: true });
  chainScene(C, undefined, () => ({ labelsHide: tr.k('t.hide'), tilt: tr.k('t.tilt') * -1, gone: { bags: [1, 2, 3], k: tr.k('t.gone') }, labelsAs: { L: [{ t: '1 bag', col: 'second' }], R: [{ t: '24', col: 'first' }], k: tr.k('t.gone') } }));
  C.showModel(); tr.set('t.E1', 1, 1.0, 2.0); tr.set('t.Eq', 1, 0.8, 2.4);
  let step = 0;
  const STEPS = [
    { t: 'Read the chain', why: 'Done for you.' },
    { t: 'Undo the last step first', why: 'Done for you: 9 off both pans.' },
    { t: 'Undo the × 4', why: 'Your step.' },
    { t: 'Check it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: four bags'), voiced('t.intro', `Now <b class="b">4 bags</b> and <b class="a">9 loose marbles</b> balance <b class="a">33 marbles</b>. The first two steps are done for you.`), plan, work);
  seq(async alive => {
    await wait(3.4); if (!alive()) return;
    await C.read(alive); if (!alive()) return;
    step = 1; drawPlan();
    await C.undo1(alive); if (!alive()) return;
    step = 2; drawPlan(); askMove();
  });
  function askMove(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Divide both sides by 4', ok: true, id: 't.move.ok', mc: undefined as string | undefined, say: 'Yes: ÷ 4 on both pans. Split each pan into 4 equal shares.' },
      { t: 'Divide the left side by 4', ok: false, id: 't.move.left', mc: MC.diffOps as string | undefined, say: 'Watch: only the left pan changed, so the balance tips. Whatever you do, do it to both sides.' },
      { t: 'Multiply both sides by 4', ok: false, id: 't.move.times', mc: MC.forward as string | undefined, say: '× 4 again would make 16 bags. To undo a multiply, divide.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.move', prompt: '4x = 24: what undoes the × 4?', board: '4x = 24', response: o.t, expected: 'Divide both sides by 4', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (o.id === 't.move.left') seq(async alive => {
        tr.set('t.gone', 1, 0.7); tr.set('t.tilt', 1, 1.0, 0.5); await wait(2.6); if (!alive()) return;
        tr.set('t.tilt', 0, 0.8); tr.set('t.gone', 0, 0.8, 0.3);
      });
      if (!o.ok) return;
      done = true;
      seq(async alive => { tr.set('t.hide', 1, 0.6); await C.undo2move(alive); if (!alive()) return; askX(); });
    })));
    work.replaceChildren(voiced('t.move', 'What undoes the × 4? Pick the move.'), bx, fbHost);
  }
  function askX(): void {
    const fbHost = h('div'), inp = numInput('marbles', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.x.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = v === 6;
      const mc = v === 96 ? MC.forward : v === 24 ? MC.intermediate : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: '4x = 24: one bag balances how many marbles?', board: '4x = 24', response: v, expected: 6, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(v === 96 ? voicedFb('t.x.times', false, '96 is 24 × 4. Undo a multiply with a divide: split 24 into 4 equal shares.')
          : v === 24 ? voicedFb('t.x.all', false, '24 balances all 4 bags. One bag balances one share.')
            : voicedFb('t.x.no', false, 'Count one share: 24 marbles split into 4 equal rows.'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.x.ok', true, `Yes: 24 ÷ 4 = 6. <b class="s">${X} = 6</b>.`));
      tr.set('t.hide', 0, 0.6);
      seq(async alive => { await C.undo2result(alive); if (!alive()) return; step = 3; drawPlan(); askCheck(); });
    }
    work.replaceChildren(voiced('t.x', `One bag balances how many marbles? ${X} = ?`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.x.empty', false, 'Type a number first.')); return; }
      const right = r.v === 33;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'Check: 4 × 6 + 9 = ?', response: r.v, expected: 33, correct: right, mc: undefined });
      if (!right) { fbHost.replaceChildren(r.v === 60 ? voicedFb('t.check.order', false, 'Multiply first: 4 × 6 = 24, then add 9.') : voicedFb('t.check.no', false, '4 × 6 = 24, and 24 + 9 = ?')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.check.ok', true, `33, the same as the right pan. <b class="s">${X} = 6</b> is right.`));
      seq(async alive => { await C.check(alive); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); });
    }
    work.replaceChildren(voiced('t.check', 'Check it: what is 4 × 6 + 9?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked 7, and you were right. Now you can show why: undo the last step first.',
      'q.cb.order': 'At the start you picked 3. That divides first, while the 6 is still on the pan. The 6 comes off first.',
      'q.cb.fwd': 'At the start you picked 11. That adds the 6 again instead of taking it away.',
      'q.cb.none': 'Undo the last step first, then the first step. That is how every two-step equation comes apart.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Sam's 2x + 8 = 20 -> x + 8 = 10 =====================
const SAM: Spec = { p: 2, q: 8, r: 20 };
function partProve(): void {
  tr.reset('p.');
  const Ys: Y = { F: 0, B: 0, E1: 480, O1: 556, E2: 634, O2: 710, E3: 788, K: 922 };
  const samRows: Row[] = [
    { key: 'p.S1', lhs: '2x + 8', rhs: '20', y: 150, col: 'dim' },
    { key: 'p.S2', lhs: '\\cssId{w}{x + 8}', rhs: '\\cssId{w2}{10}', y: 240, col: 'dim' },
    { key: 'p.S3', lhs: 'x', rhs: '2', y: 330, col: 'dim' },
  ];
  const C = buildChain('p.', SAM, { y: Ys, size: 72, extraRows: samRows });
  const S = samRows.map(r => rowAt(r, C.eqx, C.size));
  C.lines.unshift(...S);
  const extra = (c: Canvas) => {
    const ks = tr.k('p.strike');
    if (ks > 0) { const a = side(S[1]!, 'L'), b = side(S[1]!, 'R'); strike(c, a.x0 - 10, a.cy + 4, b.x1 + 10, b.cy - 4, ks, { col: 'wrong' }); }
    const k3 = tr.k('p.strike3');
    if (k3 > 0) { const a = side(S[2]!, 'L'), b = side(S[2]!, 'R'); strike(c, a.x0 - 10, a.cy + 4, b.x1 + 10, b.cy - 4, k3, { col: 'wrong' }); }
  };
  chainScene(C, extra, () => ({
    tilt: tr.k('p.tilt'), gone: { bags: [1], right: Array.from({ length: 10 }, (_, j) => 10 + j), k: tr.k('p.gone') },
    labelsAs: { L: [{ t: '1 bag', col: 'second' }, { t: ' + 8', col: 'first' }] as LabelPart[], R: [{ t: '10', col: 'first' }] as LabelPart[], k: tr.k('p.gone') },
  }));
  C.showModel(); tr.set('p.S1', 1, 0.9, 1.6); tr.set('p.S2', 1, 0.9, 2.3); tr.set('p.S3', 1, 0.7, 3.0);
  const CHIPS = [
    { t: 'He halved the 2x and the 20, but not the 8.', fits: 0 },
    { t: '8 comes off both pans, so they stay level.', fits: 1 },
    { t: 'Both pans split into 2 equal shares: one bag balances 6.', fits: 2 },
    { t: 'Moving the 8 across the = sign is always allowed.', fits: -1, mc: MC.transfer, id: 'p.no.move', say: 'Moving is a shortcut name, not a reason. The reason is that 8 comes off both pans, so they stay level.' },
    { t: 'You may divide just the first term, as long as the other side is divided too.', fits: -1, mc: MC.someTerms, id: 'p.no.some', say: 'That is exactly Sam’s slip. Dividing a side by 2 means dividing every term on it.' },
  ];
  const CLAIMS = [
    `Sam’s line <b>${X} + 8 = 10</b> does not keep the balance,`,
    `First, 2${X} + 8 = 20 becomes <b>2${X} = 12</b>,`,
    `Then <b class="s">${X} = 6</b>, and 2 × 6 + 8 = 20 checks,`,
  ];
  const SAYC = [
    'Right. Sam halved the bags and the right pan, but not the 8 loose marbles, so the balance tips.',
    'Right. Eight off both pans keeps them level: 2x = 12.',
    'Right. Split both pans into 2 equal shares: one bag balances 6. And 2 × 6 + 8 = 20.',
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.gone', 1, 0.9); tr.set('p.tilt', 1, 1.1, 0.6); await wait(2.0); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); tr.set('p.strike3', 1, 0.6, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('p.tilt', 0, 0.9); tr.set('p.gone', 0, 0.9, 0.3); tr.set('p.S1:dim', 1, 0.5); tr.set('p.S2:dim', 1, 0.5); tr.set('p.S3:dim', 1, 0.5);
      }
      if (n === 2) { tr.set('p.E1', 1, 0.9); await wait(1.0); if (!alive()) return; await C.undo1(alive); }
      if (n === 3) {
        await C.undo2move(alive); if (!alive()) return;
        await C.undo2result(alive); if (!alive()) return;
        await C.check(alive); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason, and the balance backs every one. Sam divided only some of the terms.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: 2x + 8 = 20, divide by 2: x + 8 = 10, so x = 2. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.someTerms : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Sam solves <b>2${X} + 8 = 20</b> like this: divide by 2 to get <b>${X} + 8 = 10</b>, so <b>${X} = 2</b>. Is Sam right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as EqItem),
  });
}
function showItem(item: EqItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.balance;
  const made = pic ? tryBlock(() => buildChain('x.', pic, { y: Y_PRACTICE, size: 84, fast: true })) : null;
  if (made && made.ok) {
    const C = made.value;
    chainScene(C);
    C.showModel(); tr.set('x.E1', 1, 0.9, 0.8);
    const solveOnBoard = item.family === 'solve' || item.family === 'balance';
    return {
      solve: solveOnBoard ? async alive => {
        await C.undo1(alive); if (!alive()) return;
        await C.undo2move(alive); if (!alive()) return;
        await C.undo2result(alive); if (!alive()) return;
        await C.check(alive);
      } : undefined,
    };
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['x \\xrightarrow{\\times 3} 3x \\xleftarrow{\\div 3}', '\\checkmark', '\\text{Sam}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
