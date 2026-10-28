// polynomial-division.ts: "Polynomial division" (Algebra 2, lesson 4; secondary-t7-05) on the shared lesson runtime.
//   1 The question   47 = 6 · 7 + 5, then (x² + 5x + 7) ÷ (x + 2) on the bracket layout. 3 cards (x + 3 + 1/(x + 2);
//                    x + 4 = the remainder added to the quotient; x + 7/2 = term by term) + how sure
//   2 Worked example the long-division layout, row by row: divide the leading terms (x), multiply the whole divisor
//                    and subtract (3x + 7), repeat (3, then 1), stop at degree 0 < 1 and write P = DQ + R and
//                    Q + R/D with x ≠ −2. One "why stop?" (degree / whole-number size / must reach 0)
//   3 Your turn      synthetic division of x³ − 7x + 9 by x − 2, faded from the end: the setup and first column are
//                    done; the kid types −3, then 3, then reads Q and R. Callback to the card
//   4 Prove it       Kai: "it is the rule". A because-chain: P = D·0 + P; each step keeps P = D(Q + t) + (S − tD);
//                    the leading terms cancel; the degree drops until it is below D's. Rings on the residual rows
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts); pictures: the long-division
//                    layout, the synthetic tableau, the reverse area box, both layouts side by side, else a big slate
// Voiced lines: src/lesson/topics/polynomial-division/script.ts -> pages/lessons/polynomial-division/voice/lines.json.
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ProductBox, type BoxStep } from '../../src/lesson/topics/polynomials/ProductBox';
import { LongDiv, type LdBlock, type LdFocus, ldSteps } from '../../src/lesson/topics/polynomial-division/LongDiv';
import { SynthTab, type SdBlock, type SdFocus, sdSteps } from '../../src/lesson/topics/polynomial-division/SynthTab';
import { type Co, co, divide, identT, pT, synth, xMinus, qT } from '../../src/lesson/topics/polynomial-division/pd';
import { FAMILY_NAMES, GENERATORS, MC, type PdItem } from '../../src/lesson/topics/polynomial-division/items';
import { PLAN } from '../../src/lesson/topics/polynomial-division/plan';
import { explain } from '../../src/lesson/topics/polynomial-division/explain';
import { SCRIPT } from '../../src/lesson/topics/polynomial-division/script';
import LINES from './polynomial-division/voice/lines.json';

const SLUG = 'polynomial-division';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line from the script (html shown, lines.json spoken) */
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, SCRIPT[id]?.html ?? id);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id); }

// ===================== layout: the model on the left, a wider board on the right =====================
const MF = frame(60, 90, 1000, 900);
const PB = box(1110, 70, 1860, 1010), PX = PB.x0 + 44, PW = PB.w - 88;
interface Spec { key: string; src: string; size?: number; col?: Paint; gap?: number; y?: number }
/** split TeX at its first top-level " = " (never inside braces or parentheses); null when there is none */
function splitEq(src: string): [string, string] | null {
  let d = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '{' || ch === '(') d++; else if (ch === '}' || ch === ')') d--;
    else if (d === 0 && src.startsWith(' = ', i)) return [src.slice(0, i), '= ' + src.slice(i + 3)];
    else if (d === 0 && src.startsWith(' \\div ', i)) return [src.slice(0, i), src.slice(i + 1)];
  }
  return null;
}
/** board lines from the top down; a line shrinks to fit (never below 60 px), and wraps at its " = " when it still
 *  does not fit (both rows share the key, so they write on together) */
function stack(specs: Spec[], y0 = 150): { lines: Line[]; at: Record<string, Line> } {
  const lines: Line[] = [], at: Record<string, Line> = {};
  let y = y0;
  for (const sp of specs) {
    if (sp.y !== undefined) y = sp.y;
    const fit = (src: string) => { const F = tex(src) as Formula; let s = sp.size ?? 76; while (s > 60 && texWidth(F, s) > PW) s -= 2; return { F, s, ok: texWidth(F, s) <= PW }; };
    let rows = [fit(sp.src)];
    const sp2 = rows[0]!.ok ? null : splitEq(sp.src);
    if (sp2) rows = [fit(sp2[0]), fit('\\quad ' + sp2[1])];
    const s = Math.min(...rows.map(r => r.s));
    const lh = /\\dfrac/.test(sp.src) ? 1.75 : 1.25;      // tall fractions need taller rows
    rows.forEach((r, i) => {
      const L: Line = { key: sp.key, F: r.F, x: PX, y: y + i * s * lh, size: s, col: sp.col };
      lines.push(L); if (i === 0) at[sp.key] = L;
    });
    y += rows.length * s * lh + (sp.gap ?? s * 0.2);
  }
  return { lines, at };
}
const ldP = (pre: string) => progressOf<string>(s => tr.k(pre + 'd.' + s));
const sdP = (pre: string) => progressOf<string>(s => tr.k(pre + 's.' + s));
const boxP = (pre: string) => progressOf<BoxStep>(s => tr.k(pre + 'b.' + s));

// the worked example: (x² + 5x + 7) ÷ (x + 2)
const EP = co([1, 5, 7]), ED = co([1, 2]);
const EX = () => LongDiv({ P: EP, D: ED, max: 92 }, MF, th);
// your turn: (x³ − 7x + 9) ÷ (x − 2)
const TP = co([1, 0, -7, 9]), TC = { p: 2, q: 1 };

// ===================== 1. The question =====================
const CARDS = [
  { v: '<i>x</i> + 4', plain: 'x + 4', id: MC.addsRem, why: 't.cb-adds', ok: false },
  { v: '<i>x</i> + 3 + 1/(<i>x</i> + 2)', plain: 'x + 3 + 1/(x + 2)', id: '', why: 't.cb-right', ok: true },
  { v: '<i>x</i> + 7/2', plain: 'x + 7/2', id: MC.termwise, why: 't.cb-term', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const L = EX();
  const st = stack([
    { key: 'q.L0', src: '47 = 6 \\cdot 7 + 5', size: 88, gap: 60 },
    { key: 'q.L1', src: '\\dfrac{x^{2} + 5x + 7}{x + 2} = \\,?', size: 88 },
  ], 260);
  setScene({ model: c => L.draw(c, ldP('q.')), lines: st.lines, leads: [], boardBox: PB });
  tr.set('q.L0', 1, 1.0, 0.3); tr.set('q.d.frame', 1, 1.4, 1.2); tr.set('q.L1', 1, 1.0, 2.0);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '47 = 6 * 7 + 5. What is (x^2 + 5x + 7) / (x + 2)?', board: '(x^2 + 5x + 7) / (x + 2)', response: c.plain, expected: 'x + 3 + 1/(x + 2)', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Dividing polynomials'), voiced('q.intro'), voiced('q.ask'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: long division =====================
function partExample(): void {
  tr.reset('e.');
  const L = EX();
  const st = stack([
    { key: 'e.La', src: 'x^{2} \\div x = x', size: 64 },
    { key: 'e.Lb', src: 'x(x + 2) = x^{2} + 2x', size: 64 },
    { key: 'e.Lc', src: '3x \\div x = 3', size: 64 },
    { key: 'e.Ld', src: '3(x + 2) = 3x + 6', size: 64, gap: 40 },
    { key: 'e.Le', src: 'x^{2} + 5x + 7 = (x + 2)(x + 3) + 1', size: 70, col: 'link', gap: 30 },
    { key: 'e.Lf', src: '\\dfrac{P}{D} = x + 3 + \\dfrac{1}{x + 2}', size: 70, col: 'link' },
    { key: 'e.Lg', src: 'x \\neq -2', size: 64, col: 'dim' },
  ], 140);
  const focus = (): LdFocus => ({
    cancel: [{ i: 0, k: tr.k('e.x0') }, { i: 1, k: tr.k('e.x1') }],
    rem: tr.k('e.rem'),
    rings: [{ row: 'q', col: 'link', k: tr.k('e.rq') }],
  });
  setScene({ model: c => L.draw(c, ldP('e.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.jump('e.d.frame', 1);
  let step = 0;
  const STEPS = [
    { t: 'Divide the leading terms', why: 'x² ÷ x', act: 'Divide' },
    { t: 'Multiply and subtract', why: 'The whole divisor, every term.', act: 'Subtract' },
    { t: 'Repeat', why: 'Same moves on what is left.', act: 'Repeat' },
    { t: 'Stop and write it', why: 'Degree below the divisor’s.', act: 'Write it' },
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
        tr.set('e.d.q0', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.La', 1, 1.0); await wait(1.1);
      } else if (i === 1) {
        tr.set('e.d.m0', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.x0', 1, 0.7); await wait(0.9); if (!alive()) return;
        tr.set('e.d.s0', 1, 1.2); await wait(1.2); if (!alive()) return;
        tr.set('e.Lb', 1, 1.2); await wait(1.3);
      } else if (i === 2) {
        tr.set('e.d.q1', 1, 0.9); tr.set('e.Lc', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('e.d.m1', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.x1', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('e.d.s1', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.Ld', 1, 1.0); await wait(1.1);
      } else {
        tr.set('e.rem', 1, 0.8); tr.set('e.rq', 1, 0.8); await wait(1.0); if (!alive()) return;
        for (const k of ['e.La', 'e.Lb', 'e.Lc', 'e.Ld']) tr.set(k + ':dim', 1, 0.5);
        tr.set('e.Le', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.Lf', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.Lg', 1, 0.8); await wait(0.9);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: '1 has degree 0, lower than the degree of x + 2.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: '1 is smaller than 2, like 5 is smaller than 6.', ok: false, id: 'e.w-int', mc: MC.intRem as string | undefined },
      { t: 'It should not stop: a division ends at remainder 0.', ok: false, id: 'e.w-zero', mc: MC.needZero as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does (x^2 + 5x + 7) / (x + 2) stop at the remainder 1?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: synthetic division =====================
function partTurn(): void {
  tr.reset('t.');
  const S = SynthTab({ P: TP, c: TC, max: 96 }, MF, th);
  const st = stack([
    { key: 't.l0', src: '(x^{3} - 7x + 9) \\div (x - 2)', size: 76, gap: 40 },
    { key: 't.l1', src: 'Q = x^{2} + 2x - 3,\\ \\ R = 3', size: 72, col: 'link' },
    { key: 't.l2', src: 'x^{3} - 7x + 9 = (x - 2)(x^{2} + 2x - 3) + 3', size: 72, col: 'link' },
  ], 200);
  const focus = (): SdFocus => ({ ask: tr.k('t.r2') < 1 ? { j: 2, reveal: tr.k('t.r2') } : { j: 3, reveal: tr.k('t.r3') }, ring: { j: tr.k('t.r2') >= 1 ? 3 : 2, k: tr.k('t.ring') }, rem: tr.k('t.rem') });
  setScene({ model: c => S.draw(c, sdP('t.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.set('t.s.frame', 1, 1.0); tr.set('t.l0', 1, 1.0, 0.6); tr.set('t.s.b0', 1, 0.8, 1.6); tr.set('t.s.m1', 1, 0.8, 2.4); tr.set('t.s.b1', 1, 0.8, 3.2);
  let step = 0;
  const STEPS = [
    { t: 'c and the coefficient row', why: 'Done for you.' },
    { t: 'Bring down, multiply, add', why: 'Done for you.' },
    { t: 'The next column', why: 'Your step.' },
    { t: 'The last column', why: 'Your step.' },
    { t: 'Read the bottom row', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: the shortcut'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(1.2); if (!alive()) return;
    step = 1; drawPlan(); work.replaceChildren(voiced('t.setup'));
    await wait(3.4); if (!alive()) return;
    step = 2; drawPlan(); askNum(2);
  });
  function askNum(j: 2 | 3): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    tr.set(`t.s.b${j}`, 1, 0.6); tr.set('t.ring', 1, 0.5);
    const right = j === 2 ? -3 : 3, sub = j === 2 ? -11 : 15, rec = j === 2 ? -7 : -5;
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num', false)); return; }
      const v = r.v, good = v === right;
      const pre = j === 2 ? 't.n' : 't.l';
      const id = good ? `${pre}-ok` : v === sub ? `${pre}-sub` : v === rec ? `${pre}-rec` : `${pre}-no`;
      const mc = v === sub ? MC.subtracts : v === rec ? MC.recSlip : undefined;
      ctx.store.log({ part: 'turn', item: `turn.col${j}`, prompt: j === 2 ? 'synthetic (x^3 - 7x + 9)/(x - 2): -7 + 2*2' : 'synthetic (x^3 - 7x + 9)/(x - 2): 9 + 2*(-3)', response: v, expected: right, correct: good, mc: good ? undefined : mc });
      fbHost.replaceChildren(voicedFb(id, good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set(`t.s.m${j}`, 1, 0.7); await wait(0.9); if (!alive()) return;
        tr.set(`t.r${j}`, 1, 0.7); await wait(0.9); if (!alive()) return;
        tr.set('t.ring', 0, 0.4);
        if (j === 2) { await wait(0.6); if (!alive()) return; step = 3; drawPlan(); askNum(3); }
        else { tr.set('t.rem', 1, 0.6); await wait(1.2); if (!alive()) return; step = 4; drawPlan(); askRead(); }
      });
    }
    work.replaceChildren(voiced(j === 2 ? 't.next' : 't.last'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askRead(): void {
    const X = '<i>x</i>';
    const opts = [
      { t: `<i>Q</i> = ${X}<sup>3</sup> + 2${X}<sup>2</sup> − 3${X}, <i>R</i> = 3`, ok: false, id: 't.r-deg', mc: MC.qDegree as string | undefined },
      { t: `<i>Q</i> = ${X}<sup>2</sup> + 2${X} − 3, <i>R</i> = 3`, ok: true, id: 't.r-ok', mc: undefined as string | undefined },
      { t: `<i>Q</i> = ${X}<sup>3</sup> + 2${X}<sup>2</sup> − 3${X} + 3, <i>R</i> = 0`, ok: false, id: 't.r-rem', mc: MC.remAsCoef as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, i) => { b.classList.remove('right', 'nope'); if (i === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.read', prompt: 'bottom row 1, 2, -3 | 3: Q and R?', response: o.t.replace(/<[^>]+>/g, ''), expected: 'Q = x^2 + 2x - 3, R = 3', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.l1', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.l2', 1, 1.2); await wait(1.4); if (!alive()) return;
        step = 5; drawPlan(); fbHost.append(callback());
      });
    })));
    work.replaceChildren(voiced('t.read'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const p = voiced(cd ? cd.why : 't.cb-none');
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: why long division always works =====================
function partProve(): void {
  tr.reset('p.');
  const L = EX();
  const st = stack([
    { key: 'p.l0', src: 'P = D \\cdot 0 + P', size: 72 },
    { key: 'p.l1', src: 'P = D\\,Q + S', size: 72, gap: 30 },
    { key: 'p.l2', src: 'D(Q + t) + (S - tD)', size: 72 },
    { key: 'p.l3', src: '= DQ + tD + S - tD', size: 72 },
    { key: 'p.l4', src: '= DQ + S = P', size: 72, gap: 30 },
    { key: 'p.l5', src: '\\deg(S - tD) < \\deg S', size: 72, gap: 30 },
    { key: 'p.l6', src: 'x^{2} + 5x + 7 = (x + 2)(x + 3) + 1', size: 68, col: 'link' },
  ], 140);
  const focus = (): LdFocus => ({
    rings: [{ row: 'P', col: 'first', k: tr.k('p.r0') }, { row: 's0', col: 'link', k: tr.k('p.r1') }, { row: 's1', col: 'pick', k: tr.k('p.r2') }],
    cancel: [{ i: 0, k: tr.k('p.x0') }, { i: 1, k: tr.k('p.x1') }],
  });
  setScene({ model: c => L.draw(c, ldP('p.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  ldSteps(L.cycles).forEach((s, i) => tr.set('p.d.' + s, 1, 0.6, 0.2 + i * 0.25));
  const CHIPS = [
    { t: 'Nothing has been divided yet: D times 0 is 0.', fits: 0 },
    { t: 'D(Q + t) adds tD, and S − tD takes the same tD away.', fits: 1 },
    { t: 't is chosen so that tD and S have the same leading term.', fits: 2 },
    { t: 'The degree drops at every step, and it cannot drop forever.', fits: 3 },
    { t: 'It worked for x² + 5x + 7, so it always works.', fits: -1, mc: MC.examples, id: 'p.no.ex' },
    { t: 'That is the rule for long division.', fits: -1, mc: MC.memorized, id: 'p.no.rule' },
    { t: 'Adding t to Q changes nothing else.', fits: -1, mc: MC.notCompensated, id: 'p.no.comp' },
    { t: 'The residual always reaches 0.', fits: -1, mc: MC.needZero, id: 'p.no.zero' },
  ];
  const P_ = '<i>P</i>', D_ = '<i>D</i>', Q_ = '<i>Q</i>', S_ = '<i>S</i>', t_ = '<i>t</i>', R_ = '<i>R</i>';
  const CLAIMS = [
    `At the start, ${P_} = ${D_} · 0 + ${P_} is true,`,
    `After a step, ${P_} = ${D_}(${Q_} + ${t_}) + (${S_} − ${t_}${D_}) is still true,`,
    `and ${S_} − ${t_}${D_} has lower degree than ${S_},`,
    `So the steps end with <b class="s">${P_} = ${D_}${Q_} + ${R_} and deg ${R_} &lt; deg ${D_}</b>,`,
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
    if (filled >= CLAIMS.length) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.l0', 1, 1.0); tr.set('p.r0', 1, 0.6); }
      if (n === 2) { tr.set('p.r0', 0, 0.4); tr.set('p.l1', 1, 0.9); tr.set('p.l2', 1, 0.9, 0.5); tr.set('p.l3', 1, 0.9, 1.2); tr.set('p.l4', 1, 0.9, 1.9); tr.set('p.r1', 1, 0.6, 1.0); }
      if (n === 3) { tr.set('p.r1', 0, 0.4); tr.set('p.l5', 1, 1.0); tr.set('p.x0', 1, 0.6, 0.4); tr.set('p.x1', 1, 0.6, 1.0); }
      if (n === 4) {
        tr.set('p.r2', 1, 0.6); tr.set('p.l6', 1, 1.2); await wait(1.6); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true));
        await wait(1.0); if (!alive()) return;
        fbHost.append(h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('That is a reason', () => judge(true)), no = btn('That only names the steps', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Kai: long division is right because that is the rule. A reason?', response: right ? 'a reason' : 'names the steps', expected: 'names the steps', correct: !right, mc: right ? MC.memorized : undefined });
    proofHost.replaceChildren(right ? voiced('p.test') : voiced('p.build'), chain, chipBox, fbHost);
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
    show: it => showItem(it as PdItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
/** run the named steps one after another (a solve animating row by row) */
async function runSteps(pre: string, steps: string[], alive: () => boolean, d = 0.55): Promise<void> {
  for (const s of steps) { if (tr.k(pre + s) >= 1) continue; tr.set(pre + s, 1, d); await wait(d + 0.12); if (!alive()) return; }
}
/** the result line on the board: P = (D)(Q) + R */
const resultTex = (P: Co, D: Co) => { const dv = divide(P, D); return identT(P, D, dv.Q, dv.R); };
const qrLine = (P: Co, D: Co) => { const dv = divide(P, D); return `Q = ${pT(dv.Q)},\\ \\ R = ${pT(dv.R)}`; };
/** the long-division layout: on the left with the board, or wide under the board line when it is too wide */
function ldScene(it: PdItem, slateFirst: boolean): Solve | null {
  const p = it.picture!.ld!;
  let made = tryBlock(() => LongDiv({ P: p.P, D: p.D }, MF, th));
  let wide = false;
  if (!made.ok) { made = tryBlock(() => LongDiv({ P: p.P, D: p.D }, frame(100, 250, 1720, 800), th)); wide = true; }
  if (!made.ok) { console.info('ld fallback', it.family, made.error); return null; }
  const L: LdBlock = made.value;
  const steps = ldSteps(L.cycles);
  const top = box(110, 60, 1810, 230);
  const st = wide ? { lines: [bigLine('x.T', it.board, top, 90), { ...bigLine('x.R', qrLine(p.P, p.D), top, 80), col: 'link' as Paint }] }
    : stack([{ key: 'x.T', src: it.board, size: 76, gap: 50 }, { key: 'x.R', src: resultTex(p.P, p.D), size: 70, col: 'link' }], 160);
  const show = () => setScene({ model: c => L.draw(c, ldP('x.'), { rem: tr.k('x.rem') }), lines: st.lines, leads: [], boardBox: wide ? top : PB });
  // what is shown before the answer
  const pre: string[] = p.upto === 'none' ? [] : p.upto === 'frame' ? ['frame'] : steps.slice(0, 1 + 3 * p.upto + (p.tNext ? 1 : 0));
  if (slateFirst || p.upto === 'none') {
    const big = box(240, 220, 1680, 800);
    setScene({ lines: [bigLine('x.B', it.board, big, 120)], leads: [], boardBox: big });
    tr.set('x.B', 1, 0.8, 0.1);
  } else {
    show();
    tr.set('x.T', 1, 0.8, 0.2);
    pre.forEach((s, i) => tr.set('x.d.' + s, 1, 0.7, 0.3 + i * 0.3));
  }
  return {
    solve: async alive => {
      if (slateFirst || p.upto === 'none') { show(); tr.jump('x.T', 1); await wait(0.2); }
      await runSteps('x.d.', steps, alive);
      if (!alive()) return;
      if (wide) tr.set('x.T', 0, 0.4); else tr.set('x.T:dim', 1, 0.4);
      tr.set('x.rem', 1, 0.6); tr.set('x.R', 1, 1.0, wide ? 0.4 : 0);
    },
  };
}
/** the synthetic tableau with the board */
function sdScene(it: PdItem): Solve | null {
  const p = it.picture!.sd!;
  const c = p.c ?? it.picture!.reveal?.c;
  if (!c) return null;
  const made = tryBlock(() => SynthTab({ P: p.P, c }, MF, th));
  if (!made.ok) { console.info('sd fallback', it.family, made.error); return null; }
  const S: SdBlock = made.value;
  const steps = sdSteps(S.n);
  const sd = synth(p.P, c);
  const st = stack([
    { key: 'x.T', src: it.board, size: 76, gap: 50 },
    { key: 'x.R', src: `Q = ${pT(sd.Q)}`, size: 70, col: 'link' },
    { key: 'x.R', src: `R = ${qT(sd.R)}`, size: 70, col: 'link' },
  ], 160);
  const k = typeof p.upto === 'number' ? p.upto : 0;
  const focus = (): SdFocus => ({ ask: p.ask ? { j: k, reveal: tr.k('x.ask') } : undefined, cAsk: p.cAsk ? tr.k('x.cask') : undefined, rem: tr.k('x.rem') });
  const show = () => setScene({ model: g => S.draw(g, sdP('x.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  if (p.upto === 'none') {
    const big = box(240, 220, 1680, 800);
    setScene({ lines: [bigLine('x.B', it.board, big, 120)], leads: [], boardBox: big });
    tr.set('x.B', 1, 0.8, 0.1);
  } else {
    show();
    tr.set('x.T', 1, 0.8, 0.2);
    const pre = p.upto === 'frame' ? ['frame'] : steps.slice(0, 2 * k);       // frame, b0, m1, b1, ... up to b(k-1)
    if (p.ask) pre.push(`b${k}`);                                             // the asked cell shows '?'
    pre.forEach((s, i) => tr.set('x.s.' + s, 1, 0.6, 0.3 + i * 0.25));
  }
  return {
    solve: async alive => {
      if (p.upto === 'none') { show(); tr.jump('x.T', 1); await wait(0.2); }
      if (p.cAsk) { tr.set('x.cask', 1, 0.6); await wait(0.7); if (!alive()) return; }
      if (p.ask) { tr.set(`x.s.m${k}`, 1, 0.6); await wait(0.7); if (!alive()) return; tr.set('x.ask', 1, 0.6); await wait(0.7); if (!alive()) return; }
      await runSteps('x.s.', steps, alive, 0.5);
      if (!alive()) return;
      tr.set('x.rem', 1, 0.6); tr.set('x.T:dim', 1, 0.4); tr.set('x.R', 1, 1.0);
    },
  };
}
const powOf = (s: string) => { const m = s.match(/x\^\{(\d)\}/); return m ? Number(m[1]) : /x/.test(s) ? 1 : 0; };
const ROLE_DEG = [0, 1, 2, 3, 4];
/** the reverse area box: the divisor down the left, the cells given, the top side asked ('?') until the solve */
function boxScene(it: PdItem): Solve | null {
  const p = it.picture!.box!, top = it.picture!.reveal?.top ?? [];
  const mk = (tops: string[]) => tryBlock(() => ProductBox({
    left: p.left.map(s => ({ tex: s, deg: ROLE_DEG[powOf(s)]! })), top: tops.map(s => ({ tex: s, deg: powOf(s) })),
    cells: p.cells, deg: p.cells.map(r => r.map(powOf)),
  }, MF, th));
  const m0 = mk(p.cells[0]!.map(() => '?')), m1 = mk(top.length ? top : p.cells[0]!.map(() => '?'));
  if (!m0.ok || !m1.ok) { console.info('box fallback', it.family); return null; }
  const st = stack([{ key: 'x.T', src: it.board, size: 76 }], 300);
  const scene = (B: typeof m0.value) => setScene({ model: c => B.draw(c, boxP('x.')), lines: st.lines, leads: [], boardBox: PB });
  scene(m0.value);
  tr.set('x.b.frame', 1, 0.7); tr.set('x.b.sides', 1, 0.9, 0.3); tr.set('x.b.cells', 1, 1.4, 0.8); tr.set('x.T', 1, 0.9, 0.5);
  return {
    solve: async alive => {
      tr.set('x.b.sides', 0, 0.4); await wait(0.5); if (!alive()) return;
      scene(m1.value); tr.set('x.b.sides', 1, 0.9);
    },
  };
}
/** long division and the synthetic tableau of the same division, side by side */
function linkScene(it: PdItem): Solve | null {
  const p = it.picture!.link!;
  const D = xMinus(p.c);
  const a = tryBlock(() => LongDiv({ P: p.P, D, max: 70 }, frame(50, 120, 1080, 880), th));
  const b = tryBlock(() => SynthTab({ P: p.P, c: p.c, max: 80 }, frame(1170, 300, 700, 520), th));
  if (!a.ok || !b.ok) { console.info('link fallback', it.family); return null; }
  const L = a.value, S = b.value;
  setScene({ model: c => { L.draw(c, ldP('x.')); S.draw(c, sdP('x.')); }, lines: [], leads: [], boardBox: null });
  ldSteps(L.cycles).forEach((s, i) => tr.set('x.d.' + s, 1, 0.5, 0.2 + i * 0.12));
  sdSteps(S.n).forEach((s, i) => tr.set('x.s.' + s, 1, 0.5, 0.4 + i * 0.12));
  return {};
}
function showItem(item: PdItem): Solve {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.ld) { const r = ldScene(item, false); if (r) return r; }
  if (pic?.sd) { const r = sdScene(item); if (r) return r; }
  if (pic?.box) { const r = boxScene(item); if (r) return r; }
  if (pic?.link) { const r = linkScene(item); if (r) return r; }
  const big = box(240, 220, 1680, 800);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['(x^{3} - 7x + 9) \\div (x - 2) = \\frac{1}{x + 2} \\neq \\square \\cdot ? 0123456789 \\tfrac{3}{4} Q R P D S t \\deg', '\\text{divisor residual top row}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
