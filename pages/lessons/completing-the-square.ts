// completing-the-square.ts: "Solving quadratics: square roots, completing the square, the formula" (Algebra 1, lesson 18).
//   1 The question   x² + 6x = 16 on the area picture (an x-by-x square and a 6-by-x strip): cards "2 and −8" /
//                    "1 and −7" (the 9 added on one side only) / "2 only" (only the positive root)
//   2 Worked example halve the strip (one half turns under the square), fill the missing 3-by-3 corner on BOTH sides,
//                    read the big square (x + 3)² = 25, take both square roots: x = 2 or x = −8; why two solutions?
//   3 Your turn      x² + 8x = 9, faded from the end: the split is given, the kid types the corner (16), the right side
//                    (25) and both solutions (1, −9)
//   4 Prove it       Lee: "the formula has nothing to do with completing the square". A because-chain completes the
//                    square on ax² + bx + c = 0 with letters (the letter square fills in beside it) and ends on the formula
//   5 Practice       all 16 sub-goals in order, then mixed (runtime/practice.ts): the area picture, the kit Plane, a slate
// Voiced lines: pages/lessons/completing-the-square/voice/lines.json. Every answer is logged (runtime/store.ts).
// Step keys: picture steps are '<part>.p.<step>', board lines '<part>.E<n>' / '<part>.L<n>', never the same names.
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PItem } from '../../src/lesson/kit/Plane';
import { CompleteSquare, type SqBlock, type SqFocus, type SqParams, type SqStep } from '../../src/lesson/topics/completing-the-square/CompleteSquare';
import { FAMILY_NAMES, GENERATORS, MC, type QItem, type SqPic, type PlanePic } from '../../src/lesson/topics/completing-the-square/items';
import { PLAN } from '../../src/lesson/topics/completing-the-square/plan';
import { explain } from '../../src/lesson/topics/completing-the-square/explain';
import LINES from './completing-the-square/voice/lines.json';

const SLUG = 'completing-the-square';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const X = '<i>x</i>';
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== the board: equations aligned on their = sign =====================
// The equations of this lesson are wider than the standard board: the picture keeps the left 780 px (FR) and the
// board is a wider slate (BB) beside it.
const FR = frame(40, 70, 780, 940);
const BB = box(860, 70, 1860, 1010), BX0 = BB.x0 + 50, BW = BB.w - 100;
interface Row { key: string; src: string; y: number; tags?: Record<string, { col: Paint }> }
/** rows with one \cssId{eq}{=} each: every = in one column, centred in [x0, x0 + w], shrinking to `min`; when even that
 *  does not fit, each row is centred on its own and shrinks on its own (nothing ever leaves the board) */
function alignRows(rows: Row[], size: number, x0 = BX0, w = BW, min = 64): Line[] {
  const Fs = rows.map(r => tex(r.src) as Formula);
  for (let s = size; s >= min; s -= 2) {
    let mL = 0, mR = 0;
    for (const F of Fs) { const all = texBox(F, 0, 0, { size: s }), e = texBox(F, 0, 0, { size: s }, 'eq'); mL = Math.max(mL, e.cx - all.x0); mR = Math.max(mR, all.x1 - e.cx); }
    if (mL + mR <= w) {
      const eqx = x0 + mL + (w - mL - mR) / 2;
      return rows.map((r, i) => { const F = Fs[i]!, e = texBox(F, 0, r.y, { size: s }, 'eq'); return { key: r.key, F, x: eqx - e.cx, y: r.y, size: s, tags: r.tags }; });
    }
  }
  return rows.map((r, i) => {
    const F = Fs[i]!; let s = size;
    while (s > 52 && texWidth(F, s) > w) s -= 2;
    const b = texBox(F, 0, r.y, { size: s });
    return { key: r.key, F, x: x0 + w / 2 - b.cx, y: r.y, size: s, tags: r.tags };
  });
}
const EQ = '\\cssId{eq}{=}';
const lime = { col: 'link' as Paint }, amber = { col: 'first' as Paint }, teal = { col: 'second' as Paint };

// ===================== the area picture =====================
const sqParams = (h: number): SqParams => ({ hT: String(h), stripT: `${2 * h}x`, halfT: `${h}x`, cornerT: String(h * h), sideT: `x + ${h}` });
function sqScene(pre: string, B: SqBlock, lines: Line[], focus?: () => SqFocus, extra?: Parameters<typeof setScene>[0]['extra']): void {
  const P = progressOf<SqStep>(s => tr.k(pre + 'p.' + s));
  setScene({ model: c => B.draw(c, P, focus?.() ?? {}), lines, leads: [], extra, boardBox: BB });
}
const rings = (pre: string): SqFocus['rings'] => [
  { at: 'strips', col: 'pick', k: tr.k(pre + 'rS') }, { at: 'corner', col: 'pick', k: tr.k(pre + 'rC') }, { at: 'all', col: 'link', k: tr.k(pre + 'rA') },
];

// ===================== 1. The question =====================
const CARDS = [
  { t: '2 and −8', id: '', why: 'q.cb.right' },
  { t: '1 and −7', id: MC.oneSide, why: 'q.cb.one' },
  { t: '2 only', id: MC.onlyPos, why: 'q.cb.pos' },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = CompleteSquare(sqParams(3), FR, th);
  const L = alignRows([{ key: 'q.E1', src: `x^2 + 6x ${EQ} 16`, y: 260 }, { key: 'q.E2', src: `x ${EQ} \\,?`, y: 420 }], 84);
  sqScene('q.', B, L);
  tr.set('q.p.sq', 1, 1.0, 0.2); tr.set('q.p.strip', 1, 1.0, 1.0); tr.set('q.E1', 1, 1.2, 1.8); tr.set('q.E2', 1, 0.8, 2.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'x^2 + 6x = 16: which numbers solve it?', board: 'x^2 + 6x = 16', response: c.t, expected: '2 and −8', correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>${i === 2 ? 'one solution' : 'two solutions'}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'A square with a strip'),
    voiced('q.intro', `An ${X}-by-${X} square and a strip 6 wide and ${X} long: together <b>${X}² + 6${X} = 16</b>. Which numbers make that true? Pick an answer, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== the solving rig: picture + board for x² + 2hx = k =====================
interface Rig { B: SqBlock; lines: Line[] }
function rig(pre: string, hh: number, k: number, ask = false): Rig {
  const B = CompleteSquare(sqParams(hh), FR, th), q = hh * hh, r = k + q, s = Math.sqrt(r);
  const lines = alignRows([
    { key: pre + 'E1', src: `x^2 + ${2 * hh}x ${EQ} ${k}`, y: 170 },
    { key: pre + 'E2', src: `x^2 + ${2 * hh}x \\cssId{c1}{+\\,${q}} ${EQ} ${k} \\cssId{c2}{+\\,${q}}`, y: 330, tags: { c1: lime, c2: lime } },
    { key: pre + 'E3', src: `\\cssId{sq}{(x + ${hh})^2} ${EQ} \\cssId{r}{${r}}`, y: 490, tags: { sq: lime, r: amber } },
    { key: pre + 'E4', src: `x + ${hh} ${EQ} \\cssId{pm}{\\pm ${s}}`, y: 650, tags: { pm: amber } },
    { key: pre + 'E5', src: `x ${EQ} \\cssId{a}{${s - hh}} \\text{ or } x = \\cssId{b}{${-s - hh}}`, y: 810, tags: { a: lime, b: lime } },
    ...(ask ? [{ key: pre + 'Eq', src: `x ${EQ} \\,?`, y: 810 }] : []),
  ], 80);
  return { B, lines };
}

// ===================== 2. Worked example: x² + 6x = 16 =====================
function partExample(): void {
  tr.reset('e.');
  const { B, lines } = rig('e.', 3, 16);
  sqScene('e.', B, lines, () => ({ rings: rings('e.') }));
  tr.jump('e.p.sq', 1); tr.jump('e.p.strip', 1); tr.jump('e.E1', 1);
  let step = 0;
  const STEPS = [
    { t: 'Split the strip', why: 'Half of 6 is 3: one half turns under the square.', act: 'Split it' },
    { t: 'Fill the corner', why: 'Add 3 × 3 = 9 to both sides.', act: 'Fill it' },
    { t: 'Read the big square', why: 'Its side is x + 3.', act: 'Read it' },
    { t: 'Take both square roots', why: 'Which numbers square to 25?', act: 'Solve' },
  ];
  const SAY = [
    `The strip of 6${X} splits into two strips of 3${X}. One turns under the square. Same area, but now it is a square with one corner missing.`,
    `The missing corner is 3 by 3: <b class="s">9</b>. Fill it in, and add 9 to the other side too, or the two sides stop being equal.`,
    `The whole is now one square with side ${X} + 3: <b>(${X} + 3)² = 25</b>.`,
    `Both 5 and −5 square to 25. So ${X} + 3 = 5 or ${X} + 3 = −5: <b class="s">${X} = 2 or ${X} = −8</b>. Check: 2² + 6 · 2 = 16, and (−8)² + 6 · (−8) = 64 − 48 = 16.`,
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
        tr.set('e.rS', 1, 0.4); tr.set('e.p.halve', 1, 2.2, 0.3); await wait(2.8); if (!alive()) return; tr.set('e.rS', 0, 0.6);
      } else if (i === 1) {
        tr.set('e.p.corner', 1, 0.8); tr.set('e.rC', 1, 0.4, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.p.fill', 1, 1.0); tr.set('e.rC', 0, 0.6, 0.6); await wait(1.0); if (!alive()) return;
        tr.set('e.E2', 1, 1.4); await wait(1.5);
      } else if (i === 2) {
        tr.set('e.E1:dim', 1, 0.5); tr.set('e.p.side', 1, 1.2); tr.set('e.rA', 1, 0.5, 0.6); await wait(1.6); if (!alive()) return;
        tr.set('e.E3', 1, 1.2); tr.set('e.rA', 0, 0.6, 1.2); await wait(1.4);
      } else {
        tr.set('e.E2:dim', 1, 0.5); tr.set('e.E4', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.E5', 1, 1.2); await wait(1.3);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: `Both 5² and (−5)² are 25, so ${X} + 3 can be 5 or −5.`, ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. A positive number has two square roots, and each one gives a solution.' },
      { t: `−8 is extra: a square can't have a negative side, so only ${X} = 2 counts.`, ok: false, id: 'e.why.pos', mc: MC.onlyPos, say: 'The picture is a helper; the equation is about numbers. Put −8 in: 64 − 48 = 16. It works.' },
      { t: 'Every equation with a square in it has two answers.', ok: false, id: 'e.why.always', mc: MC.repeatTwo, say: 'Not always. If the right side were 0 there would be one, and if it were negative, none.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does x^2 + 6x = 16 have two solutions?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why are there two solutions?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Complete the square'), voiced('e.intro', 'Four steps. Press each one: the picture moves first, then the equation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: x² + 8x = 9 (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const { B, lines } = rig('t.', 4, 9, true);
  sqScene('t.', B, lines, () => ({ rings: rings('t.') }));
  tr.set('t.p.sq', 1, 1.0, 0.2); tr.set('t.p.strip', 1, 1.0, 0.8); tr.set('t.E1', 1, 1.0, 1.4); tr.set('t.Eq', 1, 0.7, 2.0);
  let step = 0;
  const STEPS = [
    { t: 'Split the strip', why: 'Done for you: two strips of 4x.' },
    { t: 'Fill the corner', why: 'Your step.' },
    { t: 'Read the big square', why: 'Your step.' },
    { t: 'Take both square roots', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: x² + 8x = 9'), voiced('t.intro', `Now <b>${X}² + 8${X} = 9</b>. The strip is split for you.`), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    tr.set('t.p.halve', 1, 2.0); await wait(2.4); if (!alive()) return;
    tr.set('t.p.corner', 1, 0.8); tr.set('t.rC', 1, 0.5, 0.3);
    step = 1; drawPlan(); askCorner();
  });
  function askNum(id: string, prompt: string, unit: string, right: number, wrong: (v: number) => { id: string; say: string; mc?: string } | null, item: string, onOk: () => void, okSay: string, noSay: string): void {
    const fbHost = h('div'), inp = numInput(unit, () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const v = r.v, isRight = v === right, w = isRight ? null : wrong(v);
      ctx.store.log({ part: 'turn', item, prompt: prompt.replace(/<[^>]+>/g, ''), board: 'x^2 + 8x = 9', response: v, expected: right, correct: isRight, mc: w?.mc });
      if (!isRight) { fbHost.replaceChildren(w ? voicedFb(w.id, false, w.say) : voicedFb(`${id}.no`, false, noSay)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${id}.ok`, true, okSay));
      onOk();
    }
    work.replaceChildren(voiced(id, prompt), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCorner(): void {
    askNum('t.corner', 'The missing corner is 4 by 4. What number do you add to both sides?', '', 16, v =>
      v === 4 ? { id: 't.corner.side', mc: MC.wrongTerm, say: '4 is the side of the corner. You add its area, 4 × 4.' }
        : v === 8 || v === 64 ? { id: 't.corner.b', mc: MC.incomplete, say: 'Halve the 8 first, then square: 4 × 4.' } : null,
    'turn.corner', () => seq(async alive => {
      tr.set('t.rC', 0, 0.5); tr.set('t.p.fill', 1, 1.0); await wait(1.0); if (!alive()) return;
      tr.set('t.E2', 1, 1.3); await wait(1.5); if (!alive()) return;
      step = 2; drawPlan(); askRight();
    }), 'Yes: 16. Add it on the left to fill the corner, and on the right to keep the balance.', 'Half of 8 is 4, the side of the corner. Its area is 4 × 4.');
  }
  function askRight(): void {
    askNum('t.right', `So (${X} + 4)² = ? What is the right side?`, '', 25, v =>
      v === 9 ? { id: 't.right.one', mc: MC.unbalanced, say: '16 went into the left side, so it goes into the right side too: 9 + 16.' }
        : v === 16 ? { id: 't.right.drop', say: 'Keep the 9 that was there: 9 + 16.' } : null,
    'turn.right', () => seq(async alive => {
      tr.set('t.E1:dim', 1, 0.5); tr.set('t.p.side', 1, 1.2); tr.set('t.rA', 1, 0.5, 0.5); await wait(1.4); if (!alive()) return;
      tr.set('t.E3', 1, 1.2); tr.set('t.rA', 0, 0.6, 1.0); await wait(1.4); if (!alive()) return;
      step = 3; drawPlan(); askRoots();
    }), `Yes: (${X} + 4)² = 25.`, 'The right side was 9. Add the 16 to it.');
  }
  function askRoots(): void {
    const fbHost = h('div'), inp = pairInput(`${X} =`, ` or ${X} =`, () => check()), ok = btn('Check', () => check(), 'go');
    const is = (a: number, b: number, p: number, q: number) => (a === p && b === q) || (a === q && b === p);
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair') { fbHost.replaceChildren(voicedFb('t.roots.empty', false, 'Fill in both boxes.')); return; }
      const right = is(r.x, r.y, 1, -9);
      const mc = is(r.x, r.y, 5, -5) ? MC.forgetsH : r.x === r.y ? MC.onlyPos : is(r.x, r.y, 9, -1) ? MC.detached : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.roots', prompt: '(x + 4)^2 = 25: x = ? or x = ?', board: '(x + 4)^2 = 25', response: `${r.x}, ${r.y}`, expected: '1, −9', correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(mc === MC.forgetsH ? voicedFb('t.roots.h', false, `5 and −5 are the values of ${X} + 4. Take 4 off each.`)
          : mc === MC.onlyPos ? voicedFb('t.roots.one', false, 'There are two square roots of 25: 5 and −5. Each gives a solution.')
            : mc === MC.detached ? voicedFb('t.roots.sign', false, `${X} + 4 = 5 means ${X} = 5 − 4. Subtract the 4.`)
              : voicedFb('t.roots.no', false, `${X} + 4 = 5 or ${X} + 4 = −5. Solve each.`));
        return;
      }
      ok.disabled = true;
      tr.set('t.Eq', 0, 0.4);
      fbHost.replaceChildren(voicedFb('t.roots.ok', true, `Yes: ${X} = 1 or ${X} = −9. Check: 1 + 8 = 9, and 81 − 72 = 9.`));
      seq(async alive => {
        tr.set('t.E2:dim', 1, 0.5); tr.set('t.E4', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('t.E5', 1, 1.1); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.roots', `${X} + 4 = 5 or ${X} + 4 = −5. Type both solutions.`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked 2 and −8, and you were right. Now you can show why: fill the corner on both sides, then take both roots.',
      'q.cb.one': 'At the start you picked 1 and −7. That adds the 9 to the left side only. Both sides get the 9.',
      'q.cb.pos': 'At the start you picked 2 only. But −5 squares to 25 too, so −8 is a solution as well.',
      'q.cb.none': 'Fill the corner on both sides, read the square, take both roots. That is completing the square.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: the formula is completing the square, with letters =====================
const PFR = frame(40, 70, 780, 940);
const PB = box(840, 70, 1860, 1010);
function partProve(): void {
  tr.reset('p.');
  const B = CompleteSquare({ hT: '\\frac{b}{2a}', stripT: '\\frac{b}{a}x', halfT: '\\frac{b}{2a}x', cornerT: '\\left(\\frac{b}{2a}\\right)^2', sideT: 'x + \\frac{b}{2a}', rel: 0.45 }, PFR, th);
  const rows: Row[] = [
    { key: 'p.L0', src: `ax^2 + bx + c ${EQ} 0`, y: 150 },
    { key: 'p.L1', src: `x^2 + \\frac{b}{a}x ${EQ} -\\frac{c}{a}`, y: 330 },
    { key: 'p.L2', src: `x^2 + \\frac{b}{a}x \\cssId{c1}{+ \\left(\\frac{b}{2a}\\right)^2} ${EQ} \\cssId{c2}{\\left(\\frac{b}{2a}\\right)^2} - \\frac{c}{a}`, y: 510, tags: { c1: lime, c2: lime } },
    { key: 'p.L3', src: `\\cssId{sq}{\\left(x + \\frac{b}{2a}\\right)^2} ${EQ} \\frac{b^2 - 4ac}{4a^2}`, y: 690, tags: { sq: lime } },
    { key: 'p.L4', src: `x ${EQ} \\cssId{f}{\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}`, y: 880, tags: { f: lime } },
  ];
  const lines = alignRows(rows, 64, PB.x0 + 40, PB.w - 80, 52);
  const P = progressOf<SqStep>(s => tr.k('p.p.' + s));
  setScene({ model: c => B.draw(c, P, { rings: rings('p.') }), lines, leads: [], boardBox: PB });
  tr.set('p.p.sq', 1, 1.0, 0.3); tr.set('p.p.strip', 1, 1.0, 0.9); tr.set('p.L0', 1, 1.0, 1.5);
  const CHIPS = [
    { t: `Divide every term by <i>a</i> (allowed: <i>a</i> ≠ 0), then subtract <i>c</i>/<i>a</i> from both sides.`, fits: 0 },
    { t: `Half of <i>b</i>/<i>a</i> is <i>b</i>/(2<i>a</i>); its square fills the corner, added to BOTH sides.`, fits: 1 },
    { t: `The left side is a perfect square; on the right, <i>c</i>/<i>a</i> = 4<i>ac</i>/(4<i>a</i>²).`, fits: 2 },
    { t: `Take both square roots (√(4<i>a</i>²) = 2|<i>a</i>|, and ± covers its sign), then subtract <i>b</i>/(2<i>a</i>).`, fits: 3 },
    { t: `Divide only the ${X}² term by <i>a</i>; the other terms stay.`, fits: -1, mc: MC.notDivA, id: 'p.no.some', say: 'Every term is divided by a, or the equation changes. That is the slip that leaves b instead of b over a.' },
    { t: `Add (<i>b</i>/2)² to both sides, the same as when <i>a</i> = 1.`, fits: -1, mc: MC.notDivA, id: 'p.no.half', say: 'After dividing by a, the x coefficient is b over a. Half of that is b over two a.' },
    { t: `√(<i>b</i>² − 4<i>ac</i>) = <i>b</i> − 2√(<i>ac</i>), so the root can be split up.`, fits: -1, mc: MC.rootSum, id: 'p.no.split', say: 'A square root does not split over a minus sign. The root stays whole.' },
  ];
  const CLAIMS = [
    `<b><i>a</i>${X}² + <i>b</i>${X} + <i>c</i> = 0</b> becomes <b>${X}² + (<i>b</i>/<i>a</i>)${X} = −<i>c</i>/<i>a</i></b>,`,
    `Then <b>${X}² + (<i>b</i>/<i>a</i>)${X} + (<i>b</i>/(2<i>a</i>))² = (<i>b</i>/(2<i>a</i>))² − <i>c</i>/<i>a</i></b>,`,
    `So <b>(${X} + <i>b</i>/(2<i>a</i>))² = (<i>b</i>² − 4<i>ac</i>)/(4<i>a</i>²)</b>,`,
    `And <b class="s">${X} = (−<i>b</i> ± √(<i>b</i>² − 4<i>ac</i>))/(2<i>a</i>)</b>, the quadratic formula,`,
  ];
  const SAYC = [
    'Right. Dividing by a makes the square an x by x square again, and the constant moves across.',
    'Right. The strip of b over a x splits in two, and the corner is b over two a, squared. Both sides get it.',
    'Right. The left side is the big square. The right side over four a squared is b squared minus four a c.',
    'Right. Both roots, then subtract b over two a. That is the quadratic formula.',
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
    if (filled >= 4) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t.replace(/<[^>]+>/g, ''), correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(ch.id ? voicedFb(ch.id, false, ch.say!) : voicedFb('p.no.other', false, 'True, but it is the reason for a different line. Which reason makes this line true?')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true, SAYC[n - 1]!));
    seq(async alive => {
      if (n === 1) { tr.set('p.p.halve', 1, 2.0); await wait(1.2); if (!alive()) return; tr.set('p.L1', 1, 1.2); }
      if (n === 2) { tr.set('p.p.corner', 1, 0.7); tr.set('p.rC', 1, 0.4, 0.2); await wait(1.0); if (!alive()) return; tr.set('p.p.fill', 1, 0.9); tr.set('p.rC', 0, 0.5, 0.6); tr.set('p.L2', 1, 1.4, 0.4); }
      if (n === 3) { tr.set('p.p.side', 1, 1.1); tr.set('p.rA', 1, 0.5, 0.4); await wait(1.2); if (!alive()) return; tr.set('p.L3', 1, 1.3); tr.set('p.rA', 0, 0.6, 1.0); }
      if (n === 4) {
        tr.set('p.L1:dim', 1, 0.5); tr.set('p.L2:dim', 1, 0.5); tr.set('p.L4', 1, 1.4); await wait(1.6); if (!alive()) return;
        tr.set('p.rA', 1, 0.6); await wait(0.8); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That is a proof: the quadratic formula is completing the square, done once with letters. Lee is wrong.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Lee is right', () => judge(true)), no = btn('Lee is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Lee: the quadratic formula has nothing to do with completing the square. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.unrelated : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Complete the square on the general equation, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Lee says: “The quadratic formula is a separate rule to memorize. It has nothing to do with completing the square.” Complete the square on <b><i>a</i>${X}² + <i>b</i>${X} + <i>c</i> = 0</b> and see. Is Lee right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as QItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
/** the item's board on the right: centred, as big as fits (>= 60 px) */
function boardLine(src: string, y = 300): Line[] {
  const F = tex(src) as Formula;
  let s = 84;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return [{ key: 'x.B', F, x: BB.cx - b.cx, y, size: s }];
}
function picParams(p: SqPic, reveal: boolean): SqParams {
  return { hT: p.hT, stripT: reveal && p.reveal.stripT ? p.reveal.stripT : p.stripT, halfT: reveal && p.reveal.halfT ? p.reveal.halfT : p.halfT, cornerT: p.cornerT, sideT: p.sideT };
}
function planeOf(p: PlanePic, withCurve: boolean) {
  const f = (x: number) => p.a * x * x + p.b * x + p.c;
  const items: PItem[] = [];
  for (const [j, bd] of (p.reveal.band ?? []).entries()) items.push({ kind: 'seg', key: `band${j}`, a: [bd.lo, 0], b: [bd.hi, 0], col: 'link', w: 12 });
  if (withCurve) items.push({ kind: 'curve', key: 'curve', f, col: 'second' });
  p.reveal.marks.forEach((m, j) => {
    const bd = (p.reveal.band ?? []).find(b => Math.abs(b.lo - m) < 1e-9 || Math.abs(b.hi - m) < 1e-9);
    const closed = !bd || (Math.abs(bd.lo - m) < 1e-9 ? bd.loClosed : bd.hiClosed);
    items.push({ kind: 'point', key: `m${j}`, x: m, y: 0, col: 'link', open: !closed });
  });
  return Plane({ x: { min: p.x[0], max: p.x[1], step: p.x[2], name: 'x' }, y: { min: p.y[0], max: p.y[1], step: p.y[2], name: 'y' }, items }, FR, th);
}
function showItem(item: QItem): Solve {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.sq) {
    const p = pic.sq;
    const made = tryBlock(() => CompleteSquare(picParams(p, false), FR, th));
    if (made.ok) {
      let B = made.value;
      const P = progressOf<SqStep>(s => tr.k('x.p.' + s));
      const lines = boardLine(item.board);
      setScene({ model: c => B.draw(c, P, { hideCorner: !tr.k('x.show'), rings: rings('x.') }), lines, leads: [], boardBox: BB });
      p.steps.forEach((s, i) => tr.set('x.p.' + s, 1, 0.7, 0.1 + i * 0.25));
      tr.set('x.B', 1, 0.8, 0.5);
      return {
        solve: async alive => {
          if (p.reveal.halfT) { const r = tryBlock(() => CompleteSquare(picParams(p, true), FR, th)); if (r.ok) B = r.value; }
          tr.set('x.show', 1, 0.01);
          for (const s of p.reveal.steps) {
            if (tr.k('x.p.' + s) >= 1) continue;
            if (s === 'fill') { tr.set('x.rC', 1, 0.4); }
            tr.set('x.p.' + s, 1, s === 'halve' ? 1.6 : 0.9); await wait(s === 'halve' ? 1.8 : 1.0); if (!alive()) return;
            if (s === 'fill') tr.set('x.rC', 0, 0.5);
          }
          tr.set('x.rA', 1, 0.5); await wait(1.0);
        },
      };
    }
  }
  if (pic?.plane) {
    const p = pic.plane;
    const made = tryBlock(() => planeOf(p, true));
    if (made.ok) {
      const Pl = made.value, P = progressOf<string>(s => tr.k('x.g.' + s));
      const show = () => {
        setScene({ model: c => Pl.draw(c, P), lines: boardLine(item.board), leads: [], boardBox: BB });
        tr.set('x.g.axes', 1, 0.8, 0.1); tr.set('x.g.curve', 1, 1.4, 0.5); tr.set('x.B', 1, 0.8, 0.4);
      };
      if (p.shown) show();
      else { const big = box(260, 230, 1660, 790); setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big }); tr.set('x.T', 1, 0.8, 0.1); }
      return {
        solve: async alive => {
          if (!p.shown) { show(); await wait(1.9); if (!alive()) return; }
          p.reveal.marks.forEach((_, j) => tr.set(`x.g.m${j}`, 1, 0.5, 0.2 * j));
          (p.reveal.band ?? []).forEach((_, j) => tr.set(`x.g.band${j}`, 1, 0.9, 0.5));
          await wait(1.4);
        },
      };
    }
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['x^2 + 6x + 9 = (x + 3)^2 \\pm \\sqrt{25} \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\left(\\frac{b}{2a}\\right)^2 \\square \\le \\ge \\text{or}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
