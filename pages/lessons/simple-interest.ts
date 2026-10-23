// simple-interest.ts: "Calculate simple interest" (grade 7, 7.RP.A.3) on the shared lesson runtime.
//   1 The question   $2,000 at 5% simple interest, 3 years: cards $2,100 (one year only), $2,300, $2,315.25 (compounded)
//   2 Worked example four subgoal steps on the interest tapes: name the principal (100%, 10% cells), one year of
//                    interest (half a cell = $100), year by year (the ring stays on the principal: equal stubs), the
//                    formula I = P × r × t; a year-by-year table writes beside it; one "why?" with 3 reasons
//   3 Your turn      a loan: $1,500 at 4% for 3 years, faded from the end (total interest, then the amount owed)
//   4 Prove it       Alex compounds "simple" interest ($1,000 at 10%: $1,331): a because-chain from reason chips,
//                    the stubs straighten to equal widths, the growing gap shows as red ghosts
//   5 Practice       all 15 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/simple-interest/script.ts -> pages/lessons/simple-interest/voice/lines.json.
// Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { leader } from '../../src/lesson/annotate';
import { bump, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { InterestTape, type TapeBlock, type TapeFocus, type TapeParams, type TapeStep } from '../../src/lesson/topics/simple-interest/InterestTape';
import { type BoardTable, type SIItem, type SIPicture, FAMILY_NAMES, GENERATORS, MC } from '../../src/lesson/topics/simple-interest/items';
import { explain } from '../../src/lesson/topics/simple-interest/explain';
import { PLAN } from '../../src/lesson/topics/simple-interest/plan';
import { LINES } from '../../src/lesson/topics/simple-interest/script';
import { toCents } from '../../src/lesson/topics/simple-interest/interestMaths';

const SLUG = 'simple-interest';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** the narrator: one line at a time */
let sayTok = 0;
const say = (id: string): void => { if (!(id in LINES)) console.warn('no voice line', id); sayTok++; void ctx.say(id); };
/** two lines in a row; the second only plays if nothing newer was said in between */
function sayThen(a: string, b: string): void { const t = ++sayTok; void ctx.say(a).then(() => { if (t === sayTok) say(b); }); }
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function vline(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { say(id); return html(tag, cls, LINES[id]?.html ?? id); }
const fbv = (ok: boolean, id: string, extra: Kid[] = []) => { say(id); return feedback(ok, LINES[id]?.html ?? id, extra); };
function log(part: 'question' | 'example' | 'turn' | 'prove', item: string, prompt: string, response: unknown, expected: unknown, correct: boolean | null, mc?: string, sure?: number): void {
  ctx.store.log({ part, item, prompt, response, expected, correct, mc, sure });
}

// ===================== this page's layout: the tapes on the left, a wider board on the right =====================
const MFD = frame(60, 70, 900, 940);
const BD = box(1020, 70, 1860, 1010), BLX = BD.x0 + 56, BW = BD.w - 112;
const TG = { a: { col: 'first' }, b: { col: 'second' }, s: { col: 'link' }, p: { col: 'pick' } } as const;
/** a board line (shrinks to fit, never below 60 px; warns when it still does not fit) */
function bline(key: string, src: string, y: number, size = 70, tags?: Line['tags'], col?: Paint, x0 = BLX, w = BW): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > w) s -= 2;
  if (texWidth(F, s) > w + 1) console.warn('simple-interest: board line too wide', src);
  return { key, F, x: x0, y, size: s, tags, col };
}
/** a short formula placed with its right edge / centre at x */
function cell(key: string, src: string, x: number, y: number, size: number, align: 'right' | 'center', col?: Paint): Line {
  const F = tex(src) as Formula, w = texWidth(F, size);
  return { key, F, x: align === 'right' ? x - w : x - w / 2, y, size, col };
}
interface TableOut { lines: Line[]; box(i: number, j: number): Box; rowY: number[] }
/** a year-by-year table as board lines: header words, one key per row (`${pre}r${i}`), hidden cells '?' with their
 *  own keys (`${pre}q${i}.${j}`) and solved values (`${pre}v${i}.${j}`) */
function tableLines(pre: string, T: BoardTable, y0: number, o: { x0?: number; w?: number; pitch?: number; cols?: [Paint, Paint, Paint] } = {}): TableOut {
  const x0 = o.x0 ?? BLX, W = o.w ?? BW, pitch = o.pitch ?? 82, cols = o.cols ?? ['dim', 'second', 'link'];
  const all = [...T.rows, ...(T.solved ?? [])];
  let s = 66, xs: number[] = [], ws: number[] = [];
  for (;;) {
    const wOf = (j: number) => Math.max(j ? 150 : 60, ...all.map(r => (r[j] ? texWidth(tex(r[j]!) as Formula, s) : 0)));
    const w0 = wOf(0), w1 = wOf(1), w2 = wOf(2), gap = 56, total = w0 + w1 + w2 + 2 * gap;
    if (total <= W || s <= 60) {
      const left = x0 + (W - total) / 2;
      ws = [w0, w1, w2];
      xs = [left + w0 / 2, left + w0 + gap + w1, left + w0 + w1 + 2 * gap + w2];
      if (total > W + 1) console.warn('simple-interest: table too wide', T.rows);
      break;
    }
    s -= 2;
  }
  const lines: Line[] = [];
  const headX = [xs[0]!, xs[1]! - ws[1]! / 2, xs[2]! - ws[2]! / 2];
  T.head.forEach((t, j) => lines.push(cell(pre + 'th', t.startsWith('\\') ? t : `\\text{${t}}`, headX[j]!, y0, 46, 'center', 'dim')));
  const rowY = T.rows.map((_, i) => y0 + 74 + i * pitch);
  const boxes: Box[][] = [];
  T.rows.forEach((r, i) => {
    boxes.push([]);
    r.forEach((v, j) => {
      if (!v) { boxes[i]!.push(box(xs[j]!, rowY[i]!, xs[j]!, rowY[i]!)); return; }
      const al = j === 0 ? 'center' : 'right';
      const L = v === '?' ? cell(`${pre}q${i}.${j}`, '?', xs[j]!, rowY[i]!, s, al, 'dim') : cell(`${pre}r${i}`, v, xs[j]!, rowY[i]!, s, al, cols[j]);
      lines.push(L);
      boxes[i]!.push(texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }));
      const sv = T.solved?.[i]?.[j];
      if (v === '?' && sv) lines.push(cell(`${pre}v${i}.${j}`, sv, xs[j]!, rowY[i]!, s, al, cols[j]));
    });
  });
  return { lines, rowY, box: (i, j) => boxes[i]![j]! };
}
interface Lead2 { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
interface Model { pre: string; m: TapeBlock | (() => TapeBlock); focus?: () => TapeFocus }
interface TapeScene { models: Model[]; lines: Line[]; leads?: Lead2[]; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setTapes(S: TapeScene): void {
  setScene({
    table: 1040,
    model: c => {
      for (const M of S.models) {
        const m = typeof M.m === 'function' ? M.m() : M.m;
        m.draw(c, progressOf(s => tr.k(M.pre + s)), M.focus?.() ?? {});
      }
    },
    lines: S.lines, leads: [], boardBox: S.boardBox === undefined ? BD : S.boardBox,
    extra: c => {
      for (const d of S.leads ?? []) {
        const k = tr.k(d.key);
        if (k > 0) leader(c, d.from(), d.to(), { col: d.col, k, boardX: BD.x0, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') });
      }
      S.extra?.(c);
    },
  });
}
const tape = (p: TapeParams) => InterestTape(p, MFD, th);
const setRow = (pre: string, i: number, v = 1, d = 0.8, del = 0) => tr.set(`${pre}r${i}`, v, d, del);

// ===================== 1. The question =====================
const EX: TapeParams = { P: 200000, bp: 500, years: 3 };
const CARDS = [
  { v: '$2,100', c: 210000, mc: MC.omitsTime, why: 'q.cb.time' },
  { v: '$2,300', c: 230000, mc: '', why: 'q.cb.right' },
  { v: '$2,315.25', c: 231525, mc: MC.compounds, why: 'q.cb.comp' },
];
function partQuestion(): void {
  tr.reset('q.');
  const m = tape({ ...EX, hide: { rows: [1, 2, 3] } });
  const L = [
    bline('q.L1', `P = \\cssId{a}{\\$2{,}000}`, 190, 76, TG),
    bline('q.L2', `r = \\cssId{b}{5\\%}\\ \\text{per year}`, 310, 76, TG),
    bline('q.L3', `t = 3\\ \\text{years}`, 430, 76),
    bline('q.L4', `\\text{balance} = \\$\\,?`, 600, 76),
  ];
  setTapes({ models: [{ pre: 'q.', m }], lines: L });
  tr.set('q.tape', 1, 0.9); tr.set('q.whole', 1, 0.9, 0.6); tr.set('q.rows', 1, 1.2, 1.4);
  L.forEach((l, i) => tr.set(l.key, 1, 0.9, 0.8 + i * 0.6));
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    log('question', 'question.commit', '$2,000 at 5% simple interest per year: how much after 3 years?', c.v, '$2,300', c.c === 230000, c.mc || undefined, commit().sure ?? undefined);
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>after 3 years</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  sayThen('q.intro', 'q.ask');
  setPanel(h('h2', {}, 'Three years of savings'), html('p', '', LINES['q.intro']!.html), html('p', '', LINES['q.ask']!.html),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== the shared worked chain (example and your turn) =====================
interface Chain {
  m: TapeBlock; lines: Line[]; leads: Lead2[]; T: TableOut;
  name(alive: () => boolean): Promise<void>;
  year1(alive: () => boolean): Promise<void>;
  years(alive: () => boolean): Promise<void>;
  formula(alive: () => boolean): Promise<void>;
  focus(): TapeFocus;
}
function buildChain(pre: string, p: TapeParams, o: { r: string; I1: string; It: string; P: string; owed?: boolean }): Chain {
  const m = tape(p), S = m.maths.simple;
  const L1 = bline(pre + 'L1', `P = \\cssId{a}{${o.P}} = 100\\%`, 150, 72, TG);
  const L2 = bline(pre + 'L2', `${o.r} \\times ${o.P} = \\cssId{b}{${o.I1}}`, 250, 72, TG);
  const money = (c: number) => `\\$${(c / 100).toLocaleString('en-US').replace(/,/g, '{,}')}`;
  const T = tableLines(pre, { head: ['year', 'interest', p.loan ? 'owed' : 'balance'], rows: S.map(r => [String(r.year), r.year ? money(r.interest) : '', money(r.balance)]) }, 345, { pitch: 78 });
  const F1 = bline(pre + 'F1', `I = P \\times r \\times t`, 785, 70);
  const F2 = bline(pre + 'F2', `I = ${o.P.replace('\\$', '')} \\times ${o.r} \\times ${S.length - 1}`, 870, 70);
  const F3 = bline(pre + 'F3', `I = \\cssId{b}{${o.It}}`, 955, 70, TG);
  const lines = [L1, L2, ...T.lines, F1, F2, F3];
  const leads: Lead2[] = [
    { key: pre + 'ldP', from: () => partOf(L1, 'a'), to: () => m.where.P(0), col: 'first' },
    { key: pre + 'ldI', from: () => partOf(L2, 'b'), to: () => m.where.stub(1, 0), col: 'second' },
  ];
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set(pre + k, v, d, del);
  const n = S.length - 1;
  return {
    m, lines, leads, T,
    focus: () => ({
      rings: [0, 1, 2, 3].map(r => ({ row: r, at: 'P' as const, col: 'pick' as const, k: tr.k(`${pre}ring${r}`) })),
      pulseP: tr.k(pre + 'pP'), pulseGain: tr.k(pre + 'pG'),
    }),
    async name(alive) {
      void bump(pre + 'pP', alive); set('cells', 1, 1.0); await wait(1.2); if (!alive()) return;
      set('L1', 1, 1.0); set('ldP', 1, 0.9, 0.5); await wait(1.6); if (!alive()) return;
      set('th', 1, 0.6); setRow(pre, 0, 1, 0.8, 0.2); await wait(1.0);
    },
    async year1(alive) {
      set('ldP:dim', 1, 0.5); set('L1:dim', 1, 0.5);
      set('ring0', 1, 0.5); await wait(0.9); if (!alive()) return;
      set('y1', 1, 1.8); await wait(1.9); if (!alive()) return;
      set('ring0', 0, 0.5); set('L2', 1, 1.0); set('ldI', 1, 0.9, 0.5); await wait(1.5); if (!alive()) return;
      setRow(pre, 1, 1, 0.8); await wait(0.9);
    },
    async years(alive) {
      set('ldI:dim', 1, 0.5); set('L2:dim', 1, 0.5);
      for (let k = 2; k <= n; k++) {
        set(`ring${k - 1}`, 1, 0.5); await wait(0.9); if (!alive()) return;
        set(`y${k}`, 1, 1.6); await wait(1.7); if (!alive()) return;
        set(`ring${k - 1}`, 0, 0.5); setRow(pre, k, 1, 0.8); await wait(1.0); if (!alive()) return;
      }
    },
    async formula(alive) {
      set('ldP', 0, 0.4); set('ldI', 0, 0.4);
      set('gain', 1, 1.2); await wait(1.3); if (!alive()) return;
      set('F1', 1, 0.9); await wait(1.0); if (!alive()) return;
      set('F2', 1, 1.0); await wait(1.1); if (!alive()) return;
      set('F3', 1, 0.8); void bump(pre + 'pG', alive); await wait(1.0);
    },
  };
}
function chainScene(pre: string, C: Chain, extra?: (c: Canvas) => void): void {
  setTapes({ models: [{ pre, m: C.m, focus: () => C.focus() }], lines: C.lines, leads: C.leads, extra });
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const C = buildChain('e.', EX, { r: '0.05', I1: '\\$100', It: '\\$300', P: '\\$2{,}000' });
  // the last row of the table glows lime at the end (the balance after 3 years)
  const extra = (c: Canvas) => { const k = tr.k('e.pB'); if (k > 0) { const b = C.T.box(3, 2); c.g.save(); c.g.globalAlpha *= k; c.g.strokeStyle = th.roles.link.fill; c.g.lineWidth = 4; c.g.beginPath(); c.g.roundRect(b.x0 - 14, b.y0 - 10, b.w + 28, b.h + 20, 12); c.g.stroke(); c.g.restore(); } };
  chainScene('e.', C, extra);
  for (const s of ['tape', 'whole']) tr.jump('e.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'Name the principal', why: 'The money that earns the interest.', act: 'Show it' },
    { t: 'One year of interest', why: '5% of the principal.', act: 'Year 1' },
    { t: 'Year by year', why: 'Years 2 and 3.', act: 'Years 2 and 3' },
    { t: 'All three years at once', why: 'I = P × r × t', act: 'Use the formula' },
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
      if (i === 0) await C.name(alive);
      else if (i === 1) await C.year1(alive);
      else if (i === 2) await C.years(alive);
      else { await C.formula(alive); if (!alive()) return; tr.set('e.pB', 1, 0.6); }
      if (!alive()) return;
      sayBox.replaceChildren(vline(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Simple interest is always 5% of the original $2,000.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The balance grows, so each year should be 5% of the new balance.', ok: false, id: 'e.why.grow', mc: MC.compounds },
      { t: '5% means $5 a year, and the bank rounds it up.', ok: false, id: 'e.why.five', mc: MC.fixed },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbv(o.ok, o.id));
      log('example', 'example.why', 'Why does every year add $100, and not more?', o.t, 'Simple interest is always 5% of the original $2,000.', o.ok, o.mc);
      seq(async alive => { for (const r of [1, 2]) tr.set(`e.ring${r}`, 1, 0.4); await wait(1.6); if (!alive()) return; for (const r of [1, 2]) tr.set(`e.ring${r}`, 0, 0.6); });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(vline('e.why', 'label', 'div'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), vline('e.intro', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: Sam's loan, $1,500 at 4% for 3 years =====================
const TURN: TapeParams = { P: 150000, bp: 400, years: 3, loan: true };
function partTurn(): void {
  tr.reset('t.');
  const C = buildChain('t.', TURN, { r: '0.04', I1: '\\$60', It: '\\$180', P: '\\$1{,}500', owed: true });
  // the kid's lines: the total owed, written under the formula
  const OW = bline('t.OW', `\\$1{,}500 + \\$180 = \\cssId{s}{\\$1{,}680}`, 955, 70, TG);
  C.lines.push(OW);
  chainScene('t.', C);
  tr.set('t.tape', 1, 0.9); tr.set('t.whole', 1, 0.9, 0.5);
  let step = 0;
  const STEPS = [
    { t: 'Name the principal', why: 'Done for you: $1,500 borrowed.' },
    { t: 'One year of interest', why: 'Done for you: 4% of $1,500 = $60.' },
    { t: 'All three years', why: 'Your step.' },
    { t: 'What Sam owes', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a loan'), vline('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    await C.name(alive); if (!alive()) return;
    step = 1; drawPlan();
    await C.year1(alive); if (!alive()) return;
    step = 2; drawPlan(); askTotal();
  });
  function money(v: number): number | null { return toCents(v); }
  function askTotal(): void {
    const fbHost = h('div'), inp = numInput('dollars', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbv(false, 't.empty')); return; }
      const c = money(r.v), comp = Math.abs(r.v - 187.296) < 0.006;
      const id = c === 18000 ? 't.total.ok' : c === 6000 ? 't.total.one' : comp ? 't.total.comp' : c === 168000 ? 't.total.owe' : 't.total.no';
      const mc = id === 't.total.one' ? MC.omitsTime : id === 't.total.comp' ? MC.compounds : undefined;
      log('turn', 'turn.total', '$1,500 loan at 4% simple interest for 3 years: total interest?', r.v, 180, c === 18000, mc);
      if (c !== 18000) { fbHost.replaceChildren(fbv(false, id)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbv(true, id));
      seq(async alive => {
        await C.years(alive); if (!alive()) return;
        await C.formula(alive); if (!alive()) return;
        step = 3; drawPlan(); askOwe();
      });
    }
    work.replaceChildren(vline('t.total'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    widen(inp.node); inp.focus();
  }
  function askOwe(): void {
    const fbHost = h('div'), inp = numInput('dollars', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbv(false, 't.empty')); return; }
      const c = money(r.v);
      const id = c === 168000 ? 't.owe.ok' : c === 18000 ? 't.owe.int' : c === 156000 ? 't.owe.one' : c === 132000 ? 't.owe.less' : 't.owe.no';
      const mc = id === 't.owe.int' ? MC.changeFinal : id === 't.owe.one' ? MC.omitsTime : id === 't.owe.less' ? MC.borrower : undefined;
      log('turn', 'turn.owed', '$1,500 loan, $180 interest: total owed?', r.v, 1680, c === 168000, mc);
      if (c !== 168000) { fbHost.replaceChildren(fbv(false, id)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbv(true, id));
      seq(async alive => {
        tr.set('t.F2:dim', 1, 0.5); tr.set('t.F3', 0, 0.4); tr.set('t.OW', 1, 1.0, 0.3); await wait(1.4); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(vline('t.owe'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    widen(inp.node); inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    say(id);
    c.append(html('p', '', LINES[id]!.html + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}
/** money needs room and a decimal point on phone keyboards */
function widen(n: HTMLElement): void { n.querySelectorAll<HTMLInputElement>('input').forEach(i => { i.inputMode = 'decimal'; i.classList.add('money'); }); }

// ===================== 4. Prove it: Alex compounds "simple" interest =====================
const ALEX: TapeParams = { P: 100000, bp: 1000, years: 3 };
function partProve(): void {
  tr.reset('p.');
  const m = tape(ALEX);
  const T = tableLines('p.', {
    head: ['year', '\\text{Alex}', '\\text{simple}'],
    rows: [['0', '\\$1{,}000', '\\$1{,}000'], ['1', '\\$1{,}100', '?'], ['2', '\\$1{,}210', '?'], ['3', '\\$1{,}331', '?']],
    solved: [[], ['', '', '\\$1{,}100'], ['', '', '\\$1{,}200'], ['', '', '\\$1{,}300']],
  }, 170, { cols: ['dim', 'dim', 'link'], pitch: 96 });
  const GAP = bline('p.gap', `\\text{gap:}\\ \\ \\$0,\\ \\ \\$10,\\ \\ \\$31`, 720, 70);
  const lines = [...T.lines, GAP];
  const extra = (c: Canvas) => {
    for (const r of [2, 3]) {
      const k = tr.k(`p.strike${r}`);
      if (k > 0) { const b = T.box(r, 1); strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, k, { col: 'wrong' }); }
    }
  };
  setTapes({
    models: [{
      pre: 'p.', m, focus: () => ({
        compound: 1 - tr.k('p.fix'), gap: tr.k('p.gapk'), pulseRow: { row: 1, k: tr.k('p.pR1') },
        rings: [
          { row: 0, at: 'P', col: 'pick', k: tr.k('p.rp0') }, { row: 1, at: 'row', col: 'wrong', k: tr.k('p.rw1') }, { row: 1, at: 'P', col: 'pick', k: tr.k('p.rp1') },
          { row: 2, at: 'row', col: 'wrong', k: tr.k('p.rw2') },
        ],
      }),
    }], lines, extra,
  });
  tr.set('p.tape', 1, 0.8); tr.set('p.whole', 1, 0.8, 0.3);
  for (let k = 1; k <= 3; k++) tr.set(`p.y${k}`, 1, 1.0, 0.8 + k * 0.7);
  tr.set('p.th', 1, 0.6, 1.0); for (let i = 0; i < 4; i++) { tr.set(`p.r${i}`, 1, 0.6, 1.2 + i * 0.5); tr.set(`p.q${i}.2`, 1, 0.6, 1.2 + i * 0.5); }
  const CHIPS = [
    { t: 'In year 1 the base is the $1,000 principal under either rule.', fits: 0 },
    { t: 'Simple interest is 10% of the original $1,000 every year, not of the new balance.', fits: 1 },
    { t: 'Alex took interest on the interest, so each stub grows.', fits: 2 },
    { t: 'After year 1, simple and compound interest already differ.', fits: -1, mc: MC.differYear1, id: 'p.no.year1' },
    { t: 'The gap stays about $10 a year, so it hardly matters.', fits: -1, mc: MC.gapSmall, id: 'p.no.gap' },
    { t: 'Interest is always taken of what is in the account.', fits: -1, mc: MC.compounds, id: 'p.no.always' },
  ];
  const CLAIMS = [
    'Year 1 is right: <b class="b">$100</b>, so <b class="s">$1,100</b>,',
    'Year 2 should add <b class="b">$100</b>, not $110,',
    'After 3 years it is <b class="s">$1,300</b>, and Alex’s $1,331 is compound interest,',
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
    log('prove', `prove.claim${filled + 1}`, CLAIMS[filled]!.replace(/<[^>]+>/g, ''), ch.t, CHIPS.find(c => c.fits === filled)!.t, ch.fits === filled, ch.mc);
    if (ch.fits !== filled) { fbHost.replaceChildren(fbv(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbv(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.rp0', 1, 0.5); void bump('p.pR1', alive); await wait(1.4); if (!alive()) return;
        tr.set('p.v1.2', 1, 0.8); tr.set('p.q1.2', 0, 0.4); await wait(1.0); if (!alive()) return;
        tr.set('p.rp0', 0, 0.6);
      }
      if (n === 2) {
        tr.set('p.rw1', 1, 0.5); await wait(1.3); if (!alive()) return;
        tr.set('p.rw1', 0, 0.5); tr.set('p.rp1', 1, 0.5, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('p.fix', 1, 1.8); tr.set('p.gapk', 1, 0.8, 1.2); await wait(2.2); if (!alive()) return;
        tr.set('p.v2.2', 1, 0.8); tr.set('p.q2.2', 0, 0.4); tr.set('p.strike2', 1, 0.6, 0.6); await wait(1.4); if (!alive()) return;
        tr.set('p.rp1', 0, 0.6);
      }
      if (n === 3) {
        tr.set('p.v3.2', 1, 0.8); tr.set('p.q3.2', 0, 0.4); tr.set('p.strike3', 1, 0.6, 0.5); await wait(1.3); if (!alive()) return;
        tr.set('p.gain', 1, 1.0); tr.set('p.gap', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Alex is right', () => judge(true)), no = btn('Alex is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    log('prove', 'prove.judge', 'Alex: $1,000 at 10% simple interest for 3 years, year by year on the new balance: $1,331. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? MC.compounds : undefined);
    proofHost.replaceChildren(vline(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), vline('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as SIItem),
  });
}
/** work lines too wide for the slate at 60 px are split before their last "=" or "≈" (the next line starts with it) */
function fitWork(srcs: readonly string[], w: number): string[] {
  const out: string[] = [];
  for (const s of srcs) {
    if (texWidth(tex(s) as Formula, 60) <= w) { out.push(s); continue; }
    const i = Math.max(s.lastIndexOf(' \\approx '), s.lastIndexOf(' = '));
    if (i > 0) out.push(s.slice(0, i), s.slice(i).trim()); else out.push(s);
  }
  return out;
}
const unhide = (p: TapeParams): TapeParams => { const { hide: _h, ...rest } = p; return rest; };
function showItem(item: SIItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  setTimeout(() => widen(ctx.panel), 0);
  const P = item.picture as SIPicture | undefined;
  const pic = P?.tape ? tryBlock(() => [tape(P.tape!), tape(unhide(P.tape!))] as const) : null;
  if (pic && !pic.ok) console.error('simple-interest: model not drawn', item.id, pic.error);
  const hasTape = !!(pic && pic.ok);
  // the board: the item's line, a table, the worked lines (written after a miss)
  const x0 = hasTape ? BLX : 360, W = hasTape ? BW : 1200, slate = hasTape ? BD : box(300, 110, 1620, 990);
  const lines: Line[] = [];
  const top = bline('x.B', item.board, hasTape ? 160 : 220, 80, undefined, undefined, x0, W);
  if (!hasTape && !P?.table) { top.y = 420; top.size = Math.min(120, top.size + 30); while (top.size > 70 && texWidth(top.F, top.size) > W) top.size -= 4; top.x = x0 + (W - texWidth(top.F, top.size)) / 2; }
  lines.push(top);
  let y = top.y + 130;
  const T = P?.table ? tableLines('x.', P.table, y, { x0, w: W, cols: P.table.head[1] === '\\text{simple}' ? ['dim', 'link', 'pick'] : undefined }) : null;
  if (T) { lines.push(...T.lines); y = T.rowY[T.rowY.length - 1]! + 120; }
  const work = fitWork(P?.work ?? [], W).map((s, i) => bline(`x.w${i}`, s, (hasTape || T ? y : 640) + i * 96, 72, undefined, undefined, x0, W));
  lines.push(...work);
  let solved = false;
  const models: Model[] = hasTape && pic && pic.ok ? [{ pre: 'x.', m: () => (solved ? pic.value[1] : pic.value[0]), focus: () => ({ rings: (P!.rings ?? []).map((r, i) => ({ ...r, col: 'pick' as const, k: tr.k(`x.ring${i}`) })) }) }] : [];
  setTapes({ models, lines, boardBox: slate });
  if (hasTape) P!.pre.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.1 + i * 0.25));
  tr.set('x.B', 1, 0.8, 0.3);
  if (T) { tr.set('x.th', 1, 0.6, 0.5); T.rowY.forEach((_, i) => { tr.set(`x.r${i}`, 1, 0.6, 0.6 + i * 0.2); for (let j = 0; j < 3; j++) tr.set(`x.q${i}.${j}`, 1, 0.6, 0.6 + i * 0.2); }); }
  return {
    solve: async alive => {
      solved = true; setTapes({ models, lines, boardBox: slate });
      tr.set('x.B:dim', 1, 0.5);
      (P?.rings ?? []).forEach((_, i) => tr.set(`x.ring${i}`, 1, 0.5));
      for (const s of P?.post ?? []) { tr.set('x.' + s, 1, 0.9); await wait(0.45); if (!alive()) return; }
      if (T) T.rowY.forEach((_, i) => { for (let j = 0; j < 3; j++) { tr.set(`x.q${i}.${j}`, 0, 0.4); tr.set(`x.v${i}.${j}`, 1, 0.8, 0.3); } });
      await wait(0.6); if (!alive()) return;
      (P?.rings ?? []).forEach((_, i) => tr.set(`x.ring${i}`, 0, 0.6));
      for (let i = 0; i < work.length; i++) {
        if (i > 0) tr.set(`x.w${i - 1}:dim`, 1, 0.5);
        tr.set(`x.w${i}`, 1, 0.9); await wait(1.0); if (!alive()) return;
      }
    },
  };
}

void runLesson({
  slug: SLUG,
  // every glyph the board can use must be loaded before a line is built (a line keeps the formula it was built from)
  warm: [
    'I = P \\times r \\times t = \\$2{,}315.25 + 100\\% - 0.0475 \\approx \\,? \\tfrac{3}{4} < > ( ) : \\checkmark',
    '\\text{year interest balance owed simple compound Alex gap: principal per years months of at save or borrow vs loan repaid exact A B}',
    '\\text{1234567890}\\ \\div t\\ x',
  ],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
