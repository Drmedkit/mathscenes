// fractions-decimals-percents.ts: "Convert fractions, decimals, and percents: extended" (grade 7, 7.NS.A.2.d,
// 7.EE.B.3) on the shared lesson runtime.
//   1 The question   a 1-mile relay, 6 runners: the calculator shows 0.1666666667. Which is EXACTLY 1/6? 3 cards
//                    (the display = truncation taken as the full decimal; 0.(16) = the bar over the prefix too;
//                    0.1(6) right) + how sure
//   2 Worked example 1/6 on the division ladder: Divide -> Track the remainder -> Spot the repeat -> Make it a
//                    percent (the point slides two cells, the block is read again: 16.(6)%); one "why only the 6?"
//   3 Your turn      5/12, faded from the end: the first three lines are given, the kid does 80 / 12 = 6 r 8 (pair),
//                    picks the bar form (0.41(6)) and the exact percent (41.(6)%); the callback to part 1
//   4 Prove it       Ava: 1/3 = 0.333. A because-chain on the ladder of 1 / 3: the remainder is still 1, so
//                    3 x 0.333 = 0.999, so 0.333 is only close: 1/3 = 0.(3) (distractors = catalogue misconceptions)
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/fractions-decimals-percents/script.ts = pages/lessons/fractions-decimals-percents/
// voice/lines.json. Every answer is logged with its misconception id (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import { BOARD, MF, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { DivisionLadder, type LadderBlock, type LadderFocus, type LadderStep } from '../../src/lesson/topics/fractions-decimals-percents/DivisionLadder';
import { Calculator, type CalcBlock } from '../../src/lesson/topics/fractions-decimals-percents/Calculator';
import { FAMILY_NAMES, GENS, MC, type FdpPicture } from '../../src/lesson/topics/fractions-decimals-percents/items';
import { PLAN } from '../../src/lesson/topics/fractions-decimals-percents/plan';
import { LINES, SIXTH, SIXTH_ALL, TWELFTH } from '../../src/lesson/topics/fractions-decimals-percents/script';

const SLUG = 'fractions-decimals-percents';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;

// ---------- voice: a line in the panel is its spoken line ----------
let sayTok = 0, chain: Promise<void> = Promise.resolve();
/** say lines one after another; a newer call cuts the chain (the kid acted) */
function sayAll(...ids: string[]): void {
  const t = ++sayTok;
  chain = (async () => { for (const id of ids) { if (t !== sayTok) return; await ctx.say(id); } })();
}
/** say lines after the current chain ends (the lesson moved on by itself) */
function sayNext(...ids: string[]): void {
  const t = sayTok, prev = chain;
  chain = (async () => { await prev; for (const id of ids) { if (t !== sayTok) return; await ctx.say(id); } })();
}
const P = (id: string, cls = '') => html('p', cls, LINES[id]?.html ?? id);
const fbv = (ok: boolean, id: string, extra: Kid[] = []) => { sayAll(id); return feedback(ok, LINES[id]?.html ?? id, extra); };
function log(part: 'question' | 'example' | 'turn' | 'prove', item: string, subgoal: string, prompt: string, response: unknown, expected: unknown, correct: boolean | null, mc?: string, sure?: number): void {
  ctx.store.log({ part, item, subgoal, prompt, response, expected, correct, mc, sure });
}

// ---------- the ladder scene: the model on the left, the board on the right ----------
interface LadderScene { m: LadderBlock | CalcBlock; pre: string; lines: Line[]; leads: Lead[]; focus?: () => LadderFocus; extra?: (c: Canvas) => void; boardBox?: Box | null }
const pulses = (pre: string): LadderFocus => ({ pStrip: tr.k(pre + 'pS'), pGroups: tr.k(pre + 'pG'), pRem: tr.k(pre + 'pR'), pPct: tr.k(pre + 'pP') });
function setLadder(S: LadderScene): void {
  setScene({
    table: 1080,
    model: c => {
      const m = S.m;
      if (m.kind === 'DivisionLadder') m.draw(c, progressOf(s => tr.k(S.pre + s)), { ...pulses(S.pre), ...S.focus?.() });
      else m.draw(c, progressOf(s => tr.k(S.pre + s)));
    },
    lines: S.lines, leads: S.leads, extra: S.extra, boardBox: S.boardBox,
  });
}
const TAGS = { a: { col: 'first' as const }, x: { col: 'first' as const }, d: { col: 'second' as const }, b: { col: 'pick' as const }, q: { col: 'link' as const }, r: { col: 'first' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const } };
/** a board line at a picture height (clamped onto the slate) */
const at = (key: string, src: string, y: number, size = 76) => line(key, src, Math.max(BOARD.y0 + 70, Math.min(BOARD.y1 - 60, y)), size, TAGS);
/** the extra drop a leader's rail needs to pass BELOW the whole line (a fraction's denominator hangs lower than
 *  the symbol), so the rail never runs through notation */
const under = (L: Line, tag: string): number => Math.max(0, texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }).y1 - partOf(L, tag).y1 + 6);
/** short answers (a decimal with a bar) get a bigger font, so the bar is easy to see */
function markShort(root: ParentNode): void { root.querySelectorAll<HTMLButtonElement>('.opts button').forEach(b => { if ((b.textContent ?? '').length <= 16) b.classList.add('num'); }); }
/** run steps one after another */
async function steps(pre: string, ss: readonly LadderStep[], alive: () => boolean, d = 0.7, gap = 0.35): Promise<boolean> {
  for (const s of ss) { tr.set(pre + s, 1, d); await wait(gap); if (!alive()) return false; }
  return true;
}
function planList(stepsDef: { t: string; why: string }[]): { node: HTMLOListElement; draw(step: number, act?: { label: string; on: () => void }): void } {
  const node = h('ol', { class: 'plan' });
  return {
    node,
    draw(step, act) {
      node.replaceChildren(...stepsDef.map((s, i) => {
        const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
        if (i === step && act) (li.lastChild as HTMLElement).append(btn(act.label, act.on, 'go'));
        return li;
      }));
    },
  };
}
function optionList(opts: { t: string; ok: boolean; id: string; mc?: string }[], onPick: (o: { t: string; ok: boolean; id: string; mc?: string }, bx: HTMLElement) => void): HTMLElement {
  const bx = h('div', { class: 'opts' });
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    onPick(o, bx);
  })));
  markShort(bx);
  return bx;
}

const CARDS = [
  { html: '0.1666666667', id: MC.truncFull, cb: 't.cb-calc', t: '0.1666666667' },
  { html: SIXTH, id: '', cb: 't.cb-right', t: '0.1(6)' },
  { html: SIXTH_ALL, id: MC.barAll, cb: 't.cb-all', t: '0.(16)' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = Calculator({ expr: '1 ÷ 6 =', shows: '0.1666666667' }, MF, th);
  const L0 = line('q.L0', '\\frac{\\cssId{a}{1}}{\\cssId{d}{6}}\\ \\text{of a mile}', 300, 96, TAGS);
  const Q = line('q.Q', '=\\ ?\\ \\ \\text{exactly}', 470, 84);
  setLadder({ m, pre: 'q.', lines: [L0, Q], leads: [] });
  tr.set('q.body', 1, 1.0); tr.set('q.display', 1, 1.2, 0.8); tr.set('q.L0', 1, 0.9, 1.4); tr.set('q.Q', 1, 0.8, 2.2);

  const cards = h('div', { class: 'cards long', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    log('question', 'question.commit', 'bar-notation', 'A 1-mile relay, 6 runners; the calculator shows 0.1666666667. Which is exactly 1/6?', p.t, '0.1(6)', p.id === '', p.id || undefined, commit().sure ?? undefined);
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => {
    const b = h('button'); b.innerHTML = `<span>${cd.html}</span><small>mile</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); });
    cards.append(b);
  });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'One sixth of a mile'), P('q.intro'), P('q.calc'), P('q.ask'), cards, html('div', 'label', LINES['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
  sayAll('q.intro', 'q.calc', 'q.ask', 'q.sure');
}

// ===== 2. Worked example: 1/6 =====
function partExample(): void {
  tr.reset('e.');
  const m = DivisionLadder({ n: 1, d: 6 }, MF, th), W = m.where;
  const yS = W.strip.cy;
  const T = at('e.T', '\\frac{1}{6} = \\ ?', yS, 84);
  const H = at('e.H', '\\frac{1}{6} = 0.1\\cssId{b}{\\overline{6}}', yS, 84);
  const L4 = at('e.L4', '\\times 100\\!:\\ \\ 16.\\overline{6}\\,\\cssId{s}{\\%}', W.strip.y1 + 110);
  const L1 = at('e.L1', '\\cssId{x}{1} \\div \\cssId{d}{6} = 0.1\\ldots', W.row(1).cy);
  const L2 = at('e.L2', '\\text{remainders: }\\ 1,\\ 4,\\ \\cssId{r}{4}', W.row(2).cy, 72);
  const leads: Lead[] = [
    { key: 'e.ld2', from: () => partOf(L2, 'r'), to: () => W.rem(2), col: 'first' },
    { key: 'e.ld3', from: () => partOf(H, 'b'), to: () => W.groups, col: 'pick', drop: under(H, 'b') },
    { key: 'e.ld4', from: () => partOf(L4, 's'), to: () => W.pct, col: 'link' },
  ];
  setLadder({ m, pre: 'e.', lines: [T, H, L4, L1, L2], leads, focus: () => ({ rems: [1, 2], k: tr.k('e.f2'), col: 'first' }) });
  tr.set('e.T', 1, 0.8, 0.2); tr.set('e.cells', 1, 0.8, 0.4);

  const STEPS = [
    { t: 'Divide', why: 'The top ÷ the bottom; bring down a zero each step.', act: 'Divide' },
    { t: 'Track the remainder', why: 'Each remainder × 10 is the next amount.', act: 'Next line' },
    { t: 'Spot the repeat', why: 'A remainder came back: the digits repeat from there.', act: 'Show the repeat' },
    { t: 'Make it a percent', why: '× 100: the point moves two places.', act: 'Make it a percent' },
  ];
  const plan = planList(STEPS), sayBox = h('div'), after = h('div');
  let step = 0;
  const draw = () => plan.draw(step, step < 4 ? { label: STEPS[step]!.act, on: () => run(step) } : undefined);
  function run(i: number): void {
    step = i + 1; draw(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.cells', 1, 0.5);
        tr.set('e.row0', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.row1', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); void bump('e.pS', alive); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.row2', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.f2', 1, 0.5); tr.set('e.L2', 1, 0.9); tr.set('e.ld2', 1, 0.8, 0.8); await wait(1.8);
      } else if (i === 2) {
        tr.set('e.f2', 0, 0.4); tr.set('e.ld2', 0, 0.4); tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.loop', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.more', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.groups', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.T', 0, 0.4); tr.set('e.H', 1, 1.0, 0.3); tr.set('e.ld3', 1, 0.8, 1.2); void bump('e.pG', alive); await wait(2.0);
      } else {
        tr.set('e.ld3', 0, 0.4); tr.set('e.H:dim', 1, 0.5);
        tr.set('e.shift', 1, 1.8); await wait(2.0); if (!alive()) return;
        tr.set('e.L4', 1, 1.0); tr.set('e.ld4', 1, 0.8, 0.9); await wait(1.0); if (!alive()) return;
        void bump('e.pP', alive); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(P(`e.s${i + 1}`));
      if (i === 3) selfExplain(); else sayAll(`e.s${i + 1}`);
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The 1 comes from remainder 1, which never comes back. Remainder 4 keeps coming back, and it always gives a 6.', ok: true, id: 'e.w-ok' },
      { t: 'A bar goes over every digit after the point.', ok: false, id: 'e.w-all', mc: MC.barAll },
      { t: 'The bar always goes on the last digit you wrote.', ok: false, id: 'e.w-last', mc: MC.barLast },
    ];
    const fbHost = h('div');
    const bx = optionList(opts, o => {
      fbHost.replaceChildren(fbv(o.ok, o.id));
      log('example', 'example.why', 'prefix-and-block', 'Why does the bar of 1/6 = 0.1(6) go over the 6 only?', o.t, opts[0]!.t, o.ok, o.mc);
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    });
    after.replaceChildren(html('div', 'label', LINES['e.why']!.html), bx, fbHost);
    sayAll('e.s4', 'e.why');
  }
  draw();
  setPanel(h('h2', {}, 'Watch it worked out'), P('e.intro', 'dim'), plan.node, sayBox, after);
  sayAll('e.intro');
}

// ===== 3. Your turn: 5/12 (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = DivisionLadder({ n: 5, d: 12 }, MF, th), W = m.where;
  const yS = W.strip.cy;
  const T = at('t.T', '\\frac{5}{12} = \\ ?', yS, 84);
  const H = at('t.H', '\\frac{5}{12} = 0.41\\cssId{b}{\\overline{6}}', yS, 84);
  const L4 = at('t.L4', '\\times 100\\!:\\ \\ 41.\\overline{6}\\,\\cssId{s}{\\%}', W.strip.y1 + 110);
  const L1 = at('t.L1', '\\cssId{x}{80} \\div \\cssId{d}{12} = \\cssId{q}{6}\\ \\ \\text{r}\\ \\cssId{r}{8}', W.row(3).cy);
  const leads: Lead[] = [
    { key: 't.ld1', from: () => partOf(L1, 'r'), to: () => W.rem(3), col: 'first' },
    { key: 't.ld3', from: () => partOf(H, 'b'), to: () => W.groups, col: 'pick', drop: under(H, 'b') },
    { key: 't.ld4', from: () => partOf(L4, 's'), to: () => W.pct, col: 'link' },
  ];
  setLadder({ m, pre: 't.', lines: [T, H, L4, L1], leads });

  const STEPS = [
    { t: 'Divide', why: 'Done for you: three lines.' },
    { t: 'Track the remainder', why: 'Your step: the next line.' },
    { t: 'Spot the repeat', why: 'Your step: write it with a bar.' },
    { t: 'Make it a percent', why: 'Your step.' },
  ];
  const plan = planList(STEPS), work = h('div');
  let step = 0;
  plan.draw(step);
  setPanel(h('h2', {}, 'Five twelfths of a mile'), P('t.intro'), plan.node, work);
  sayAll('t.intro');
  seq(async alive => {
    tr.set('t.T', 1, 0.8); tr.set('t.cells', 1, 0.8); await wait(1.0); if (!alive()) return;
    if (!(await steps('t.', ['row0', 'row1', 'row2'], alive, 1.0, 1.1))) return;
    work.replaceChildren(P('t.given'));
    sayNext('t.given');
    await wait(0.6); if (!alive()) return;
    step = 1; plan.draw(step); askStep();
  });

  function askStep(): void {
    const fbHost = h('div');
    const inp = pairInput('80 ÷ 12 =', 'r', () => check());
    const ok = btn('Check', () => check(), 'go');
    let wrongs = 0;
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Type the digit and the remainder.')); return; }
      const right = r.x === 6 && r.y === 8;
      const id = right ? 't.s-ok' : r.x * 12 > 80 ? 't.s-big' : (r.y >= 12 || 80 - r.x * 12 >= 12) ? 't.s-rem' : 't.s-other';
      log('turn', 'turn.step', 'fraction-to-repeating-by-remainders', '5/12 by long division: 80 ÷ 12 = ? r ?', [r.x, r.y], [6, 8], right);
      fbHost.replaceChildren(fbv(right, id));
      if (!right) { if (++wrongs >= 2) fbHost.append(html('p', 'dim', '6 × 12 = 72. How much is left of 80?')); return; }
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.row3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.L1', 1, 0.9); tr.set('t.ld1', 1, 0.8, 0.8); await wait(1.4); if (!alive()) return;
        tr.set('t.loop', 1, 1.2); await wait(1.6); if (!alive()) return;
        step = 2; plan.draw(step); askWrite();
      });
    }
    work.replaceChildren(P('t.given'), P('t.step'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    sayNext('t.step');
    inp.focus();
  }
  function askWrite(): void {
    const opts = [
      { t: TWELFTH, ok: true, id: 't.w-ok' },
      { t: '0.<span class="rep">416</span>', ok: false, id: 't.w-all', mc: MC.barAll },
      { t: '0.4<span class="rep">16</span>', ok: false, id: 't.w-two', mc: MC.barAll },
      { t: '0.416', ok: false, id: 't.w-stop', mc: MC.truncFull },
    ];
    const fbHost = h('div');
    const bx = optionList(opts, (o, b) => {
      log('turn', 'turn.write', 'prefix-and-block', '5/12 = 0.41666... in bar notation?', o.t.replace(/<[^>]+>/g, '|'), '0.41|6|', o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (!o.ok) return;
      b.querySelectorAll('button').forEach(x => { (x as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.ld1', 0, 0.4); tr.set('t.L1:dim', 1, 0.5);
        tr.set('t.more', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('t.groups', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.T', 0, 0.4); tr.set('t.H', 1, 1.0, 0.3); tr.set('t.ld3', 1, 0.8, 1.2); void bump('t.pG', alive); await wait(2.4); if (!alive()) return;
        step = 3; plan.draw(step); askPct();
      });
    });
    work.replaceChildren(P('t.write'), bx, fbHost);
    sayAll('t.write');
  }
  function askPct(): void {
    const opts = [
      { t: '41.<span class="rep">6</span>%', ok: true, id: 't.p-ok' },
      { t: '4.1<span class="rep">6</span>%', ok: false, id: 't.p-one', mc: MC.pointOne },
      { t: `${TWELFTH}%`, ok: false, id: 't.p-unscaled', mc: MC.appendPct },
      { t: '41.6%', ok: false, id: 't.p-drop', mc: MC.barAfterShift },
    ];
    const fbHost = h('div');
    const bx = optionList(opts, (o, b) => {
      log('turn', 'turn.percent', 'repeating-decimal-percent', '5/12 = 0.41(6) as an exact percent?', o.t.replace(/<[^>]+>/g, '|'), '41.|6|%', o.ok, o.mc);
      fbHost.replaceChildren(fbv(o.ok, o.id));
      if (!o.ok) return;
      b.querySelectorAll('button').forEach(x => { (x as HTMLButtonElement).disabled = true; });
      seq(async alive => {
        tr.set('t.ld3', 0, 0.4); tr.set('t.H:dim', 1, 0.5);
        tr.set('t.shift', 1, 1.8); await wait(2.0); if (!alive()) return;
        tr.set('t.L4', 1, 1.0); tr.set('t.ld4', 1, 0.8, 0.9); await wait(1.4); if (!alive()) return;
        void bump('t.pP', alive); await wait(1.2); if (!alive()) return;
        step = 4; plan.draw(step);
        fbHost.append(callback());
      });
    });
    work.replaceChildren(P('t.pct'), bx, fbHost);
    sayAll('t.pct');
  }
  function callback(): HTMLElement {
    const pick = commit().pick;
    const id = pick === null ? 't.cb-none' : CARDS[pick]!.cb;
    const c = h('div', { class: 'callback' });
    c.innerHTML = LINES[id]!.html;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    sayNext(id);
    return c;
  }
}

// ===== 4. Prove it: Ava says 1/3 = 0.333 =====
function partProve(): void {
  tr.reset('p.');
  const m = DivisionLadder({ n: 1, d: 3, extra: 2 }, MF, th), W = m.where;
  const yS = W.strip.cy;
  const J = at('p.J', '\\text{Ava: }\\ \\tfrac{1}{3}\\ \\cssId{w}{=}\\ 0.333', yS, 80);
  const C3 = at('p.C3', '\\tfrac{1}{3} = 0.\\cssId{b}{\\overline{3}}', W.strip.y1 + 100, 80);
  const C3b = at('p.C3b', '0.333 \\approx \\tfrac{1}{3}', W.strip.y1 + 230, 80);
  const C2 = at('p.C2', '3 \\times 0.333 = 0.999', W.row(2).cy - 10, 76);
  const C1 = at('p.C1', '\\text{remainder}\\ \\cssId{r}{1} \\ne 0', W.row(3).cy, 76);
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 'r'), to: () => W.rem(3), col: 'first' },
    { key: 'p.ld3', from: () => partOf(C3, 'b'), to: () => W.groups, col: 'pick', drop: under(C3, 'b') },
  ];
  setLadder({
    m, pre: 'p.', lines: [J, C3, C3b, C2, C1], leads,
    focus: () => { const k1 = tr.k('p.f1'), k2 = tr.k('p.f2'); return k2 > 0 ? { cells: [1, 2, 3], k: k2, col: 'pick' } : { rems: [3], k: k1, col: 'first' }; },
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 8, b.x1 + 10, b.y0 - 8, ks, { col: 'wrong' }); } },
  });
  tr.set('p.cells', 1, 0.8); tr.set('p.row0', 1, 1.0, 0.5); tr.set('p.row1', 1, 1.0, 1.5); tr.set('p.J', 1, 1.0, 1.0);

  const CHIPS = [
    { t: '10 ÷ 3 = 3 r 1 at every step: the remainder 1 keeps coming back.', fits: 0 },
    { t: 'That leftover remainder is 1 thousandth that was never shared out: 1 − 0.999 = 0.001.', fits: 1 },
    { t: 'Cutting a repeating decimal off gives a different, smaller number.', fits: 2 },
    { t: '0.333 has three 3s, so it already repeats.', fits: -1, id: 'p.x-length', mc: MC.lengthRepeat },
    { t: 'Keep dividing: the remainder reaches 0 in the end.', fits: -1, id: 'p.x-ends', mc: MC.alwaysEnds },
    { t: 'Every decimal is an approximation, so = and ≈ mean the same.', fits: -1, id: 'p.x-inexact', mc: MC.allInexact },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chainBox = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chainBox.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      d.innerHTML = `${LINES[id]!.html}<span class="because">because ${i < filled ? `<i>${CHIPS.find(c => c.fits === i)!.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3 || used.has(i)) return;
    const claimText = (LINES[CLAIMS[filled]!]?.html ?? '').replace(/<[^>]+>/g, '');
    log('prove', `prove.claim${filled + 1}`, filled === 2 ? 'truncation-not-equal' : 'fraction-to-repeating-by-remainders', claimText, ch.t, CHIPS.find(c => c.fits === filled)!.t, ch.fits === filled, ch.mc);
    if (ch.fits !== filled) { fbHost.replaceChildren(fbv(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    sayAll(`p.c${n}`);
    seq(async alive => {
      if (n === 1) {
        tr.set('p.row2', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('p.row3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.loop', 1, 1.0); tr.set('p.f1', 1, 0.5, 0.4); await wait(1.0); if (!alive()) return;
        tr.set('p.C1', 1, 0.9); tr.set('p.ld1', 1, 0.8, 0.8);
      } else if (n === 2) {
        tr.set('p.ld1', 0, 0.4); tr.set('p.f1', 0, 0.4); tr.set('p.C1:dim', 1, 0.5);
        tr.set('p.f2', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('p.C2', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('p.f2', 0, 0.6);
      } else {
        tr.set('p.C2:dim', 1, 0.5);
        tr.set('p.more', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('p.groups', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('p.C3', 1, 1.0); tr.set('p.ld3', 1, 0.8, 0.9); await wait(1.4); if (!alive()) return;
        tr.set('p.C3b', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbv(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const proofHost = h('div');
  const yes = btn('Ava is right', () => judge(true)), no = btn('Ava is wrong', () => judge(false));
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    log('prove', 'prove.judge', 'truncation-not-equal', 'Ava: 1/3 = 0.333 exactly. Right or wrong?', right ? 'right' : 'wrong', 'wrong', !right, right ? MC.truncFull : undefined);
    const id = right ? 'p.test' : 'p.prove';
    proofHost.replaceChildren(P(id), chainBox, chipBox, fbHost);
    sayAll(id);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), P('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
  sayAll('p.intro');
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed), show: showItem,
  });
}
/** a line centred on x (the wide slate of bare items) */
function cLine(key: string, src: string, cx: number, y: number, size: number, maxW: number): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x: cx - texWidth(F, s) / 2, y, size: s };
}
type Solve = (alive: () => boolean) => Promise<void>;
function showItem(item: Item): { solve?: Solve } {
  tr.reset('x.');
  // decimals and minus signs on phone keyboards
  setTimeout(() => { ctx.panel.querySelectorAll<HTMLInputElement>('.ans input').forEach(i => { i.inputMode = 'text'; }); markShort(ctx.panel); }, 0);
  const Pc = item.picture as FdpPicture | undefined;
  const big = box(240, 260, 1680, 780);
  const bare = (work: string[]): { solve?: Solve } => {
    setScene({ table: 1080, lines: [bigLine('x.B', item.board, big)], leads: [], boardBox: big });
    tr.set('x.B', 1, 0.8, 0.1);
    if (!work.length) return {};
    return {
      solve: async alive => {
        const Ls = work.map((s, i) => cLine(`x.w${i}`, s, big.cx, big.y0 + 110 + i * 150 + (work.length === 1 ? 120 : work.length === 2 ? 60 : 0), 84, big.w - 140));
        setScene({ table: 1080, lines: Ls, leads: [], boardBox: big });
        for (let i = 0; i < Ls.length; i++) { tr.set(`x.w${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; }
      },
    };
  };
  if (!Pc || Pc.kind === 'bare') return bare(Pc?.work ?? []);
  const T = line('x.T', item.board, BOARD.y0 + 90, 80);
  const Wl = Pc.work.map((s, i) => line(`x.w${i}`, s, BOARD.y0 + 270 + i * 140, 76));
  const workOn = async (alive: () => boolean) => {
    tr.set('x.T:dim', 1, 0.5);
    for (let i = 0; i < Wl.length; i++) { if (i > 0) tr.set(`x.w${i - 1}:dim`, 1, 0.5); tr.set(`x.w${i}`, 1, 0.9); await wait(1.0); if (!alive()) return; }
  };
  if (Pc.kind === 'calc') {
    const mk = tryBlock(() => Calculator(Pc.p, MF, th));
    if (!mk.ok) { console.warn('fractions-decimals-percents: calculator not drawn', item.id, mk.error); return bare(Pc.work); }
    setLadder({ m: mk.value, pre: 'x.', lines: [T, ...Wl], leads: [] });
    tr.set('x.body', 1, 0.8); tr.set('x.display', 1, 1.0, 0.5); tr.set('x.T', 1, 0.8, 0.4);
    return { solve: async alive => { tr.set('x.mark', 1, 0.6); await wait(0.6); if (!alive()) return; await workOn(alive); } };
  }
  const mk = tryBlock(() => DivisionLadder(Pc.p, MF, th));
  if (!mk.ok) { console.warn('fractions-decimals-percents: ladder not drawn', item.id, mk.error); return bare(Pc.work); }
  const m = mk.value;
  setLadder({ m, pre: 'x.', lines: [T, ...Wl], leads: [], focus: () => ({ rems: Pc.rems, k: tr.k('x.focus'), col: 'pick' }) });
  tr.set('x.T', 1, 0.8, 0.3);
  Pc.pre.forEach((s, i) => tr.set('x.' + s, 1, 0.6, 0.1 + i * 0.3));
  return {
    solve: async alive => {
      for (const s of Pc.pre) tr.jump('x.' + s, 1);
      for (const s of Pc.post) { tr.set('x.' + s, 1, s === 'shift' ? 1.6 : 0.7); await wait(s === 'shift' ? 1.6 : s.startsWith('row') ? 0.45 : 0.6); if (!alive()) return; }
      if (Pc.unshift) { tr.set('x.shift', 0, 1.6); await wait(1.7); if (!alive()) return; }
      if (Pc.rems) { tr.set('x.focus', 1, 0.6); await wait(0.6); if (!alive()) return; }
      await workOn(alive);
    },
  };
}

void runLesson({
  slug: SLUG,
  // every glyph the board can use must be loaded before a line is built (a line keeps the formula it was built from)
  warm: ['\\frac{1}{6} = 0.1\\overline{6} \\ldots \\ne \\approx \\tfrac{1}{3}', '\\text{remainders: exactly of a mile Ava: remainder}',
    '\\times 100\\!:\\ \\ 16.\\overline{6}\\,\\% \\left(16\\tfrac{2}{3}\\right)\\% < > \\quad\\text{or}\\quad \\text{vs} -1.6',
    '\\$100 \\div 3 \\ \\text{cm} \\text{at most } \\ \\text{digits}\\ \\text{r}\\ \\text{ten-thousandths thousandths}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
