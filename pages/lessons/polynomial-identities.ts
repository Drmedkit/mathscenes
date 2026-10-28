// polynomial-identities.ts: "Polynomial operations and identities" (Algebra 2, lesson 3; secondary-t7-02) on the
// shared lesson runtime.
//   1 The question   a 23 ft square deck cut into 20 ft + 3 ft: (20 + 3)² = ? on the area square. 3 cards (529;
//                    409 = squaring each part; 452 = the middle part as 2·20 + 3) + how sure
//   2 Worked example the area square: cut it (400 + 60 + 60 + 9 = 529), the numbers become letters a and b
//                    ((a + b)(a + b): a², ab, ba, b²), the two strips are one rectangle turned (ab = ba, 2ab), and
//                    a = −5, b = 2 shows the identity holds where no picture exists (a² + b² fails). One "why?"
//   3 Your turn      (a − b)² on the product box, faded from the end: row 2 (−ab, +b²), the ab coefficient (−2),
//                    and a counterexample to (a − b)² = a² − b² (a = 5, b = 2: 21 ≠ 9). Callback to the card
//   4 Prove it       Dana's single check of (x² + y²)² = (x² − y²)² + (2xy)²; judge it, then a because-chain that
//                    rewrites each side on its own; the payoff: Pythagorean triples morphing on a right triangle
//   5 Practice       all 14 sub-goals one after another, then mixed (runtime/practice.ts); pictures: the product box,
//                    the area square, a numbered chain of lines on a slate, else a big slate with the board
// Voiced lines: src/lesson/topics/polynomial-identities/script.ts -> pages/lessons/polynomial-identities/voice/lines.json.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { slate } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { ProductBox, type BoxBlock, type BoxFocus, type BoxStep } from '../../src/lesson/topics/polynomials/ProductBox';
import { AreaSquare, type SqFocus, type SqStep } from '../../src/lesson/topics/polynomial-identities/AreaSquare';
import { TripleTriangle, type TriStep } from '../../src/lesson/topics/polynomial-identities/TripleTriangle';
import { type Mono, type P, collect, monoTex, mulP, polyTex } from '../../src/lesson/topics/polynomial-identities/idm';
import { FAMILY_NAMES, GENERATORS, MC, type IdItem } from '../../src/lesson/topics/polynomial-identities/items';
import { PLAN } from '../../src/lesson/topics/polynomial-identities/plan';
import { explain } from '../../src/lesson/topics/polynomial-identities/explain';
import { SCRIPT } from '../../src/lesson/topics/polynomial-identities/script';
import LINES from './polynomial-identities/voice/lines.json';

const SLUG = 'polynomial-identities';
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
const MF = frame(60, 90, 970, 900);
const PB = box(1070, 70, 1860, 1010), PX = PB.x0 + 44, PW = PB.w - 88;
/** split TeX at its top-level " + " / " - " (never inside braces or parentheses) */
function chunks(src: string): string[] {
  const out: string[] = []; let d = 0, last = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '{' || ch === '(') d++; else if (ch === '}' || ch === ')') d--;
    else if (d === 0 && i > last && (src.startsWith(' + ', i) || src.startsWith(' - ', i))) { out.push(src.slice(last, i)); last = i + 1; }
  }
  out.push(src.slice(last));
  return out;
}
interface Spec { key: string; src: string; size?: number; tags?: Record<string, { col: Paint }>; col?: Paint; gap?: number; y?: number }
/** board lines from the top down: a line that does not fit at 64 px wraps at a top-level + or − (same key, so the
 *  rows write on together); rows of a wrapped line are indented. `y` restarts the column (lines that replace others) */
function stack(specs: Spec[], y0 = 160): { lines: Line[]; at: Record<string, Line[]>; y: number } {
  const lines: Line[] = [], at: Record<string, Line[]> = {};
  let y = y0;
  for (const sp of specs) {
    if (sp.y !== undefined) y = sp.y;
    const size = sp.size ?? 80;
    const one = tex(sp.src) as Formula;
    let s = size;
    while (s > 64 && texWidth(one, s) > PW) s -= 2;
    let rows: string[];
    if (texWidth(one, s) <= PW) rows = [sp.src];
    else {
      s = Math.min(size, 72);
      rows = [];
      let cur = '';
      for (const c of chunks(sp.src)) {
        const tryS = cur ? `${cur} ${c}` : c;
        const pre = rows.length ? '\\quad ' : '';
        if (cur && texWidth(tex(pre + tryS) as Formula, s) > PW) { rows.push(pre + cur); cur = c; } else cur = tryS;
      }
      rows.push((rows.length ? '\\quad ' : '') + cur);
      while (s > 60 && rows.some(r => texWidth(tex(r) as Formula, s) > PW)) s -= 2;
    }
    at[sp.key] = rows.map((r, i) => {
      const L: Line = { key: sp.key, F: tex(r) as Formula, x: PX, y: y + i * s * 1.3, size: s, tags: sp.tags, col: sp.col };
      lines.push(L); return L;
    });
    y += rows.length * s * 1.3 + (sp.gap ?? s * 0.12);
  }
  return { lines, at, y };
}
const W = (s: string) => ({ col: s as Paint });
const lineBox = (L: Line): Box => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' });
function strikeLine(c: Canvas, L: Line, k: number): void {
  if (k <= 0) return;
  const b = lineBox(L);
  strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, k, { col: 'wrong' });
}
const sqP = (pre: string) => progressOf<SqStep>(s => tr.k(pre + 'q.' + s));
const boxP = (pre: string) => progressOf<BoxStep>(s => tr.k(pre + 'b.' + s));
const triP = (pre: string) => progressOf<TriStep>(s => tr.k(pre + 't.' + s));
const blue = W('water'), amber = W('first'), teal = W('second'), lime = W('link');

// ===================== the deck square (parts 1 and 2) =====================
const DECK = () => AreaSquare({
  L: { a: '20', b: '3', cells: ['400', '60', '60', '9'] },
  L2: { a: 'a', b: 'b', cells: ['a^{2}', 'ab', 'ba', 'b^{2}'] },
  share: 0.3, note: 'not to scale',
}, MF, th);

// ===================== 1. The question =====================
const CARDS = [
  { v: '409', id: MC.fnSum, why: 't.cb-fn', ok: false },
  { v: '529', id: '', why: 't.cb-right', ok: true },
  { v: '452', id: MC.mid2aPlusB, why: 't.cb-mid', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const S = DECK();
  const st = stack([{ key: 'q.L0', src: '23^{2} = (20 + 3)^{2} = \\,?', size: 96 }], 300);
  setScene({ model: c => S.draw(c, sqP('q.')), lines: st.lines, leads: [], boardBox: PB });
  tr.set('q.q.frame', 1, 1.0); tr.set('q.q.sides', 1, 1.2, 0.8); tr.set('q.L0', 1, 1.0, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A 23 ft square deck cut into 20 ft + 3 ft: (20 + 3)^2 = ?', board: '(20 + 3)^2', response: c.v, expected: '529', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span><small>square feet</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Squaring in your head'), voiced('q.intro'), voiced('q.ask'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: (20 + 3)², then (a + b)² =====================
function partExample(): void {
  tr.reset('e.');
  const S = DECK();
  const st = stack([
    { key: 'e.n0', src: '23^{2} = (20 + 3)^{2}', size: 88 },
    { key: 'e.n1', src: '= \\cssId{a}{400} + \\cssId{b}{60} + \\cssId{c}{60} + \\cssId{d}{9}', size: 84, tags: { a: blue, b: amber, c: amber, d: teal } },
    { key: 'e.n2', src: '= 529', size: 84, col: 'link' },
    { key: 'e.l0', src: '(a + b)^{2} = (a + b)(a + b)', size: 80, y: 160 },
    { key: 'e.l1', src: '= \\cssId{a}{a^{2}} + \\cssId{b}{ab} + \\cssId{c}{ba} + \\cssId{d}{b^{2}}', size: 80, tags: { a: blue, b: amber, c: amber, d: teal } },
    { key: 'e.l2', src: '= \\cssId{a}{a^{2}} + \\cssId{b}{2ab} + \\cssId{d}{b^{2}}', size: 84, tags: { a: blue, b: amber, d: teal }, gap: 50 },
    { key: 'e.k1', src: 'a = -5,\\ b = 2:\\ \\ (-3)^{2} = 9', size: 72 },
    { key: 'e.k2', src: '25 - 20 + 4 = 9\\ \\cssId{ok}{\\checkmark}', size: 72, tags: { ok: lime } },
    { key: 'e.k3', src: 'a^{2} + b^{2} = 29 \\neq 9', size: 72, col: 'wrong' },
  ]);
  const focus = (): SqFocus => ({
    swap: tr.k('e.swap'),
    ring: [{ cells: [1, 2], col: 'link', k: tr.k('e.g') }, { cells: [1, 2], col: 'wrong', k: tr.k('e.miss') }],
    turn: tr.k('e.turn'), fade: tr.k('e.fade'),
  });
  setScene({ model: c => S.draw(c, sqP('e.'), focus()), lines: st.lines, leads: [], boardBox: PB, extra: c => strikeLine(c, st.at['e.k3']![0]!, tr.k('e.k3s')) });
  tr.jump('e.q.frame', 1); tr.jump('e.q.sides', 1); tr.jump('e.n0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Cut the square', why: 'Both sides at 20: four pieces.', act: 'Cut it' },
    { t: 'Any lengths a and b', why: 'The same four pieces, in letters.', act: 'Use letters' },
    { t: 'Collect: ab = ba', why: 'The two strips are one rectangle.', act: 'Collect' },
    { t: 'Every real value', why: 'Even where no picture exists.', act: 'Test it' },
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
        tr.set('e.q.cut', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.q.cells', 1, 2.0); await wait(2.0); if (!alive()) return;
        tr.set('e.n1', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.n2', 1, 0.9); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.n0', 0, 0.6); tr.set('e.n1', 0, 0.6); tr.set('e.n2', 0, 0.6);
        tr.set('e.swap', 1, 1.6); await wait(1.8); if (!alive()) return;
        tr.set('e.l0', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.l1', 1, 1.2); await wait(1.3);
      } else if (i === 2) {
        tr.set('e.turn', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.g', 1, 0.7); await wait(0.9); if (!alive()) return;
        tr.set('e.l1:dim', 1, 0.5); tr.set('e.l2', 1, 1.2); await wait(1.3);
      } else {
        tr.set('e.g', 0, 0.5); tr.set('e.fade', 1, 1.0); await wait(0.8); if (!alive()) return;
        tr.set('e.k1', 1, 1.1); await wait(1.3); if (!alive()) return;
        tr.set('e.k2', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('e.k3', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.k3s', 1, 0.7); await wait(0.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Two cross products, a·b and b·a, which are like terms.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'Squaring a sum squares each part, so 2ab is extra.', ok: false, id: 'e.w-fn', mc: MC.fnSum as string | undefined },
      { t: 'It is 2 times a, plus b.', ok: false, id: 'e.w-mid', mc: MC.mid2aPlusB as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Where does the 2ab in (a + b)^2 = a^2 + 2ab + b^2 come from?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.id === 'e.w-fn') seq(async alive => { tr.set('e.fade', 0, 0.5); tr.set('e.miss', 1, 0.6); await wait(2.2); if (!alive()) return; tr.set('e.miss', 0, 0.6); });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: (a − b)² =====================
function partTurn(): void {
  tr.reset('t.');
  const B = ProductBox({
    left: [{ tex: 'a', deg: 2 }, { tex: '-b', deg: 0 }], top: [{ tex: 'a', deg: 2 }, { tex: '-b', deg: 0 }],
    cells: [['a^{2}', '-ab'], ['-ba', 'b^{2}']], deg: [[2, 1], [1, 0]],
  }, MF, th);
  const st = stack([
    { key: 't.l0', src: '(a - b)^{2} = (a - b)(a - b)', size: 80, gap: 30 },
    { key: 't.l1', src: '= a^{2} \\cssId{a}{- ab}', size: 78, tags: { a: amber } },
    { key: 't.l1b', src: '\\phantom{=} \\cssId{a}{- ba} + b^{2}', size: 78, tags: { a: amber }, gap: 30 },
    { key: 't.l2', src: '= a^{2} \\cssId{a}{- 2ab} + b^{2}', size: 86, tags: { a: amber }, gap: 50 },
    { key: 't.k1', src: 'a = 5,\\ b = 2:\\ \\ (5 - 2)^{2} = 9', size: 72 },
    { key: 't.k2', src: 'a^{2} - b^{2} = 21 \\neq 9', size: 72, col: 'wrong' },
  ]);
  const focus = (): BoxFocus => ({
    rowK: [tr.k('t.r0'), tr.k('t.r1')],
    ask: [0, 1].map(c => ({ r: 1, c, reveal: tr.k('t.r1show') })),
    groups: [{ cells: [[0, 1], [1, 0]], col: 'link', k: tr.k('t.g') }],
    row: { i: 1, k: tr.k('t.ringR') },
  });
  setScene({ model: c => B.draw(c, boxP('t.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.set('t.b.frame', 1, 1.0); tr.set('t.b.sides', 1, 1.2, 0.6); tr.set('t.l0', 1, 1.0, 1.0); tr.set('t.r0', 1, 1.4, 2.0);
  let step = 0;
  const STEPS = [
    { t: 'Write the box', why: 'Done for you.' },
    { t: 'First row: a times a and −b', why: 'Done for you.' },
    { t: 'Second row: −b times a and −b', why: 'Your step.' },
    { t: 'Collect the ab cells', why: 'Your step.' },
    { t: 'Is it a² − b²?', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: (a − b)²'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    step = 2; drawPlan(); askRow();
  });
  function askRow(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '−<i>ab</i>, &nbsp;+<i>b</i><sup>2</sup>', ok: true, id: 't.r-ok', mc: undefined as string | undefined },
      { t: '−<i>ab</i>, &nbsp;−<i>b</i><sup>2</sup>', ok: false, id: 't.r-spread', mc: MC.minusSpreads as string | undefined },
      { t: '+<i>ab</i>, &nbsp;+<i>b</i><sup>2</sup>', ok: false, id: 't.r-sign', mc: MC.unlikePos as string | undefined },
    ];
    let done = false;
    tr.set('t.ringR', 1, 0.5); tr.set('t.r1', 1, 1.0, 0.3);
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.row', prompt: '-b times a, and -b times -b', board: '(a - b)^2', response: o.t.replace(/<[^>]+>|&nbsp;/g, ''), expected: '-ab, +b^2', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.ringR', 0, 0.4); tr.set('t.r1show', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
        tr.set('t.l1', 1, 1.0); tr.set('t.l1b', 1, 1.0, 0.5); await wait(1.7); if (!alive()) return;
        step = 3; drawPlan(); askNum('ab');
      });
    })));
    work.replaceChildren(voiced('t.row'), bx, fbHost);
  }
  function askNum(which: 'ab' | 'cmp'): void {
    const fbHost = h('div'), inp = numInput('', () => check()), ok = btn('Check', () => check(), 'go');
    if (which === 'ab') tr.set('t.g', 1, 0.6);
    else { tr.set('t.k1', 1, 1.0); }
    const right = which === 'ab' ? -2 : 21;
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num', false)); return; }
      const v = r.v, good = v === right;
      let id: string, mc: string | undefined;
      if (which === 'ab') { id = good ? 't.ab-ok' : v === -1 ? 't.ab-one' : v === 2 || v === 0 ? 't.ab-sign' : 't.ab-no'; mc = v === 2 ? MC.unlikePos : v === 0 ? MC.conjCross : undefined; }
      else { id = good ? 't.cmp-ok' : v === 9 ? 't.cmp-sq' : 't.cmp-no'; mc = v === 9 ? MC.fnSum : undefined; }
      ctx.store.log({ part: 'turn', item: `turn.${which}`, prompt: which === 'ab' ? 'coefficient of ab in (a - b)^2' : 'a^2 - b^2 at a = 5, b = 2 (versus (a - b)^2 = 9)', response: v, expected: right, correct: good, mc });
      fbHost.replaceChildren(voicedFb(id, good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        if (which === 'ab') {
          tr.set('t.g', 0, 0.5); tr.set('t.l1:dim', 1, 0.5); tr.set('t.l1b:dim', 1, 0.5); tr.set('t.l2', 1, 1.2); await wait(2.6); if (!alive()) return;
          step = 4; drawPlan(); askNum('cmp');
        } else {
          tr.set('t.k2', 1, 1.0); await wait(1.4); if (!alive()) return;
          step = 5; drawPlan(); fbHost.append(callback());
        }
      });
    }
    work.replaceChildren(voiced(which === 'ab' ? 't.ab' : 't.cmp'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 't.cb-none';
    const p = voiced(id);
    if (cd) p.insertAdjacentHTML('beforeend', ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>`);
    c.append(p, h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: (x² + y²)² = (x² − y²)² + (2xy)² =====================
const TRIPLES = [
  { u: 3, v: 4, w: 5, head: 'x = 2,\\ y = 1' },
  { u: 5, v: 12, w: 13, head: 'x = 3,\\ y = 2' },
  { u: 15, v: 8, w: 17, head: 'x = 4,\\ y = 1' },
];
function partProve(): void {
  tr.reset('p.');
  const T = TripleTriangle(TRIPLES, MF, th);
  const st = stack([
    { key: 'p.l0', src: '(x^{2} + y^{2})^{2} \\overset{?}{=} (x^{2} - y^{2})^{2} + (2xy)^{2}', size: 72, gap: 20 },
    { key: 'p.d', src: '\\text{Dana: } 25 = 9 + 16', size: 64, col: 'dim', gap: 40 },
    { key: 'p.L', src: '\\text{Left} = x^{4} + \\cssId{m}{2x^{2}y^{2}} + y^{4}', size: 68, tags: { m: amber } },
    { key: 'p.R1', src: '\\text{Right} = x^{4} \\cssId{m}{- 2x^{2}y^{2}} + y^{4} \\cssId{n}{+ 4x^{2}y^{2}}', size: 68, tags: { m: amber, n: amber } },
    { key: 'p.R2', src: '= x^{4} + \\cssId{m}{2x^{2}y^{2}} + y^{4}', size: 68, tags: { m: amber }, gap: 30 },
    { key: 'p.c', src: '\\text{equal for every real } x, y\\ \\cssId{ok}{\\checkmark}', size: 64, tags: { ok: lime } },
  ]);
  const triIdx = () => { const k1 = tr.k('p.m1'), k2 = tr.k('p.m2'); return k2 > 0 ? { from: 1, to: 2, k: k2 } : { from: 0, to: 1, k: k1 }; };
  setScene({ model: c => T.draw(c, triP('p.'), { ...triIdx(), ringW: tr.k('p.ringW') }), lines: st.lines, leads: [], boardBox: PB });
  tr.set('p.t.tri', 1, 1.0); tr.set('p.t.labels', 1, 1.0, 0.6); tr.set('p.t.head', 1, 0.8, 0.6); tr.set('p.l0', 1, 1.2, 1.0); tr.set('p.d', 1, 0.9, 2.0);
  const CHIPS = [
    { t: 'The square of a sum, with a = x² and b = y².', fits: 0 },
    { t: 'The square of a difference gives −2ab and +b², and (2xy)² squares every factor.', fits: 1 },
    { t: '−2x²y² and 4x²y² are like terms.', fits: 2 },
    { t: 'Each side was rewritten on its own, with steps true for every value, to the same form.', fits: 3 },
    { t: '(x² + y²)² is x⁴ + y⁴: square each term.', fits: -1, mc: MC.fnSum, id: 'p.no.fn' },
    { t: '(2xy)² is 2x²y²: only the letters are squared.', fits: -1, mc: MC.powOne, id: 'p.no.pow' },
    { t: 'Dana’s check at x = 2, y = 1 already shows it.', fits: -1, mc: MC.examples, id: 'p.no.ex' },
    { t: 'Set the two sides equal and simplify until 0 = 0.', fits: -1, mc: MC.bothSides, id: 'p.no.both' },
  ];
  const X = '<i>x</i>', Y = '<i>y</i>';
  const CLAIMS = [
    `The left side is ${X}<sup>4</sup> + 2${X}<sup>2</sup>&#8202;${Y}<sup>2</sup> + ${Y}<sup>4</sup>,`,
    `The right side is ${X}<sup>4</sup> − 2${X}<sup>2</sup>&#8202;${Y}<sup>2</sup> + ${Y}<sup>4</sup> + 4${X}<sup>2</sup>&#8202;${Y}<sup>2</sup>,`,
    `which collects to ${X}<sup>4</sup> + 2${X}<sup>2</sup>&#8202;${Y}<sup>2</sup> + ${Y}<sup>4</sup>,`,
    `So <b class="s">the equation is an identity</b>: true for every real ${X} and ${Y},`,
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>|&#8202;/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.d:dim', 1, 0.5); tr.set('p.L', 1, 1.2); }
      if (n === 2) { tr.set('p.R1', 1, 1.2); }
      if (n === 3) { tr.set('p.R2', 1, 1.2); }
      if (n === 4) {
        tr.set('p.c', 1, 1.0); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true));
        tr.set('p.ringW', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('p.ringW', 0, 0.6); tr.set('p.m1', 1, 1.8); await wait(3.0); if (!alive()) return;
        tr.set('p.m2', 1, 1.8); await wait(2.2); if (!alive()) return;
        fbHost.append(h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Her check proves it', () => judge(true)), no = btn('One check is not a proof', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Dana checks (x^2 + y^2)^2 = (x^2 - y^2)^2 + (2xy)^2 at x = 2, y = 1: is that a proof?', response: right ? 'proof' : 'not a proof', expected: 'not a proof', correct: !right, mc: right ? MC.examples : undefined });
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
    show: it => showItem(it as IdItem),
  });
}
const ROLE_DEG = [2, 1, 0, 3, 4];   // ProductBox colours by "degree": 2 blue, 1 amber, 0 teal, 3 lavender, 4 brown
const ekey = (m: Mono) => m.e.join(',');
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
/** the practice box: a × b; cells by like-term group (blue, amber, teal, ...), filled at the solve when not shown,
 *  like cells ringed, cancelling cells struck */
function boxScene(it: IdItem): Solve | null {
  const p = it.picture!.box!;
  const T = p.a.map(s => p.b.map(t => mulP([s], [t])[0]!));
  const all = T.flat(), res = collect(all);
  const keys = collect(all.map(m => ({ ...m, c: { p: 1, q: 1 } }))).map(ekey);
  const roleOf = (m: Mono) => ROLE_DEG[Math.max(0, keys.indexOf(ekey(m))) % ROLE_DEG.length]!;
  const sideOf = (f: P) => f.map((m, i) => ({ tex: monoTex(m), deg: ROLE_DEG[Math.min(i, 2)]! }));
  const made = tryBlock(() => ProductBox({ left: sideOf(p.a), top: sideOf(p.b), cells: T.map(r => r.map(monoTex)), deg: T.map(r => r.map(roleOf)) }, MF, th));
  if (!made.ok) { console.info('box fallback', it.family, made.error); return null; }
  const B: BoxBlock = made.value;
  const byKey = new Map<string, [number, number][]>();
  T.forEach((r, i) => r.forEach((t, j) => byKey.set(ekey(t), [...(byKey.get(ekey(t)) ?? []), [i, j]])));
  const groups = [...byKey.entries()].filter(([, cs]) => cs.length > 1);
  const zero = groups.filter(([k]) => !res.some(m => ekey(m) === k));
  const st = stack([
    ...(p.pre ?? []).map((src, i) => ({ key: 'x.P' + i, src, size: 64, col: 'dim' as Paint, gap: 24 })),
    { key: 'x.L0', src: it.board, size: 80, gap: 30 },
    { key: 'x.L1', src: `= ${polyTex(all)}`, size: 68, gap: 30 },
    { key: 'x.L2', src: `= ${polyTex(res)}`, size: 76, col: 'link' },
  ]);
  const asked = p.ask ?? [];
  const focus = (): BoxFocus => ({
    groups: groups.map(([, cs], gi) => ({ cells: cs, col: 'link' as Paint, k: tr.k('x.g' + gi) })),
    strike: zero.flatMap(([, cs]) => cs.map(([r, c]) => ({ r, c, k: tr.k('x.z') }))),
    ask: asked.map(([r, c]) => ({ r, c, reveal: tr.k('x.ask') })),
  });
  setScene({ model: c => B.draw(c, boxP('x.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.set('x.b.frame', 1, 0.7); tr.set('x.b.sides', 1, 0.9, 0.3);
  (p.pre ?? []).forEach((_, i) => tr.set('x.P' + i, 1, 0.8, 0.4));
  tr.set('x.L0', 1, 0.9, 0.5);
  if (p.cells === 'all') tr.set('x.b.cells', 1, 1.6, 1.0);
  return {
    solve: async alive => {
      if (p.cells !== 'all') { tr.set('x.b.cells', 1, 0.5 + 0.35 * all.length); await wait(0.6 + 0.35 * all.length); if (!alive()) return; }
      if (asked.length) { tr.set('x.ask', 1, 0.8); await wait(0.9); if (!alive()) return; }
      tr.set('x.L1', 1, 1.0); await wait(1.1); if (!alive()) return;
      for (let gi = 0; gi < groups.length; gi++) { tr.set('x.g' + gi, 1, 0.5); await wait(0.7); if (!alive()) return; }
      if (zero.length) { tr.set('x.z', 1, 0.6); await wait(0.8); if (!alive()) return; }
      tr.set('x.L1:dim', 1, 0.4); tr.set('x.L2', 1, 1.0);
    },
  };
}
/** the practice area square: side parts and pieces; asked pieces show '?' until the solve; the sum writes on */
function areaScene(it: IdItem): Solve | null {
  const p = it.picture!.area!;
  const made = tryBlock(() => AreaSquare({ L: { a: p.a, b: p.b, cells: p.cells }, share: p.share }, MF, th));
  if (!made.ok) { console.info('area fallback', it.family, made.error); return null; }
  const S = made.value;
  const nums = p.cells.every(c => /^\d+$/.test(c));
  const sum = nums ? `= ${p.cells.join(' + ')} = ${p.cells.reduce((s, c) => s + Number(c), 0)}` : `= ${p.cells.join(' + ')} = ${p.a}^{2} + 2${p.a}${p.b} + ${p.b}^{2}`;
  const st = stack([
    { key: 'x.L0', src: it.board, size: 88, gap: 40 },
    { key: 'x.L2', src: sum, size: 76, col: 'link' },
  ]);
  const asked = p.ask ?? [];
  const focus = (): SqFocus => ({ ask: asked.map(i => ({ i, reveal: tr.k('x.ask') })), ring: [{ cells: [1, 2], col: 'link', k: tr.k('x.g') }] });
  setScene({ model: c => S.draw(c, sqP('x.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.set('x.q.frame', 1, 0.7); tr.set('x.q.cut', 1, 1.0, 0.3); tr.set('x.q.sides', 1, 0.9, 0.6); tr.set('x.q.cells', 1, 1.2, 1.0); tr.set('x.L0', 1, 0.9, 0.5);
  return {
    solve: async alive => {
      tr.set('x.ask', 1, 1.0); await wait(1.1); if (!alive()) return;
      tr.set('x.g', 1, 0.6); await wait(0.8); if (!alive()) return;
      tr.set('x.L2', 1, 1.0);
    },
  };
}
/** the practice chain: numbered lines on a wide slate (step names on the left); a planted wrong step is ringed at the
 *  solve; a line held back as '?' is written in at the solve (reveal.lines) */
function chainScene(it: IdItem): Solve {
  const ch = it.picture!.chain!;
  const bad = it.picture!.reveal?.bad ?? -1;
  const fill = it.picture!.reveal?.lines;
  const sl = box(110, 90, 1810, 990);
  const n = ch.lines.length, gap = Math.min(170, (sl.h - 160) / n);
  const labW = ch.labels ? 220 : 40;
  const mk = (src: string, i: number, key: string, col?: Paint): Line => {
    const F = tex(src) as Formula;
    let s = 74;
    while (s > 60 && texWidth(F, s) > sl.w - labW - 80) s -= 2;
    return { key, F, x: sl.x0 + labW, y: sl.y0 + 120 + i * gap, size: s, col };
  };
  const Ls: Line[] = ch.lines.map((src, i) => mk(src, i, 'x.c' + i));
  const Fs: Line[] = (fill ?? []).map((src, i) => (src === ch.lines[i] ? null : mk(src, i, 'x.f' + i, 'link'))).filter((x): x is Line => !!x);
  const extra = (c: Canvas) => {
    if (ch.labels) ch.lines.forEach((_, i) => drawWords(c, ch.labels![i] ?? '', sl.x0 + 50, Ls[i]!.y, i === bad && tr.k('x.bad') > 0.5 ? 'wrong' : 'dim', tr.k('x.c' + i), { size: 44 }));
    if (bad > 0) {
      const k = tr.k('x.bad'), b = lineBox(Ls[bad]!);
      if (k > 0) { c.g.save(); c.g.globalAlpha *= k; c.g.strokeStyle = th.roles.wrong.fill; c.g.lineWidth = 5; c.g.beginPath(); c.g.roundRect(sl.x0 + 30, b.y0 - 16, sl.w - 60, b.h + 32, 14); c.g.stroke(); c.g.restore(); }
    }
  };
  setScene({ model: c => slate(c, sl), lines: [...Ls, ...Fs], leads: [], boardBox: null, extra });
  Ls.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.2 + i * 0.45));
  const hasSolve = bad > 0 || Fs.length > 0;
  return {
    solve: hasSolve ? async () => {
      if (bad > 0) tr.set('x.bad', 1, 0.6);
      for (const F of Fs) { tr.set(F.key.replace('x.f', 'x.c'), 0, 0.5); tr.set(F.key, 1, 0.9, 0.4); }
    } : undefined,
  };
}
function showItem(item: IdItem): Solve {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.box) { const r = boxScene(item); if (r) return r; }
  if (pic?.area) { const r = areaScene(item); if (r) return r; }
  if (pic?.chain) return chainScene(item);
  const big = box(240, 220, 1680, 800);
  setScene({ lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['(a + b)^{2} = a^{2} + 2ab + b^{2} \\checkmark \\neq \\overset{?}{=} \\tfrac{1}{2}', '\\text{Left} = x^{4} + 2x^{2}y^{2} + y^{4}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
