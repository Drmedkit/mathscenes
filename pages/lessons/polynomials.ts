// polynomials.ts: "Polynomial expressions" (Algebra 1, lesson 15; secondary-t6-04) on the shared lesson runtime.
//   1 The question   a square garden x ft on a side grows 3 ft each way: (x + 3)² = ? 3 cards (x² + 6x + 9;
//                    x² + 9 = the square distributed over the sum; 2x + 6 = squaring as doubling) + how sure
//   2 Worked example the product box: write the square as a product, every term times every term (4 cells),
//                    collect the like cells (the 3x diagonal) and name the result, check at x = 2 (x² + 9 fails);
//                    the board writes beside it; one "why?" with 3 reasons
//   3 Your turn      (x − 2)(x² + x + 3), faded from the end: row 1 is given, the kid picks row 2, collects the
//                    x² and x diagonals, and gives the degree. Callback to the card
//   4 Prove it       Riley's subtraction (only the first term negated) on the degree shelf: a because-chain from
//                    reason chips (counterexample at x = 1, the opposite of the whole polynomial, collect by power)
//   5 Practice       all 27 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/polynomials/script.ts -> pages/lessons/polynomials/voice/lines.json.
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
import { DegreeShelf, type ShelfBlock, type ShelfFocus, type ShelfStep } from '../../src/lesson/topics/polynomials/DegreeShelf';
import { type Poly, add, collect, deg, mul, neg, polyTex, table, termTex, coefOf, isZ } from '../../src/lesson/topics/polynomials/poly';
import { FAMILY_NAMES, GENERATORS, MC, type PolyItem } from '../../src/lesson/topics/polynomials/items';
import { PLAN } from '../../src/lesson/topics/polynomials/plan';
import { explain } from '../../src/lesson/topics/polynomials/explain';
import { SCRIPT } from '../../src/lesson/topics/polynomials/script';
import LINES from './polynomials/voice/lines.json';

const SLUG = 'polynomials';
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
/** a board line, shrunk to fit the board (never under 60 px), left-aligned */
function fit(key: string, src: string, y: number, size = 80, o: { tags?: Record<string, { col: Paint }>; col?: Paint; center?: boolean } = {}): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > PW) s -= 2;
  const x = o.center ? PB.cx - texWidth(F, s) / 2 : PX;
  return { key, F, x, y, size: s, tags: o.tags, col: o.col };
}
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
interface Spec { key: string; src: string; size?: number; tags?: Record<string, { col: Paint }>; col?: Paint; gap?: number }
/** board lines from the top down: a line that does not fit at 64 px wraps at a top-level + or − (same key, so the
 *  rows write on together); rows of a wrapped line are indented */
function stack(specs: Spec[], y0 = 160): { lines: Line[]; at: Record<string, Line[]>; y: number } {
  const lines: Line[] = [], at: Record<string, Line[]> = {};
  let y = y0;
  for (const sp of specs) {
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
/** draw TeX lines with their tr keys (write-on, :dim), like the stage does for scene lines */
const boxP = (pre: string) => progressOf<BoxStep>(s => tr.k(pre + 'b.' + s));
const shelfP = (pre: string) => progressOf<ShelfStep>(s => tr.k(pre + 's.' + s));

// ===================== the garden box (parts 1 and 2) =====================
const GARDEN = () => ProductBox({
  left: [{ tex: 'x', deg: 1 }, { tex: '3', deg: 0 }], top: [{ tex: 'x', deg: 1 }, { tex: '3', deg: 0 }],
  cells: [['x^{2}', '3x'], ['3x', '9']], deg: [[2, 1], [1, 0]], noteL: 'feet', noteT: 'feet',
}, MF, th);

// ===================== 1. The question =====================
const CARDS = [
  { v: '<i>x</i><sup>2</sup> + 9', id: MC.fnSum, why: 't.cb-fn', ok: false },
  { v: '<i>x</i><sup>2</sup> + 6<i>x</i> + 9', id: '', why: 't.cb-right', ok: true },
  { v: '2<i>x</i> + 6', id: MC.baseTimesExp, why: 't.cb-double', ok: false },
];
function partQuestion(): void {
  tr.reset('q.');
  const B = GARDEN();
  const L = [fit('q.L0', '(x + 3)^{2} = \\,?', 300, 110, { center: true })];
  setScene({ model: c => B.draw(c, boxP('q.')), lines: L, leads: [], boardBox: PB });
  tr.set('q.b.frame', 1, 1.0); tr.set('q.b.sides', 1, 1.2, 0.8); tr.set('q.L0', 1, 1.0, 1.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A square garden x ft on a side grows 3 ft each way: (x + 3)^2 = ?', board: '(x + 3)^2', response: c.v.replace(/<[^>]+>/g, ''), expected: 'x^2 + 6x + 9', correct: c.ok, mc: c.id || undefined, sure: commit().sure ?? undefined });
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
  setPanel(h('h2', {}, 'A bigger garden'), voiced('q.intro'), voiced('q.ask'), cards, voiced('q.sure', 'div', 'label'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: (x + 3)² on the box =====================
function partExample(): void {
  tr.reset('e.');
  const B = GARDEN();
  const blue = W('water'), amber = W('first'), teal = W('second'), lime = W('link');
  const st = stack([
    { key: 'e.l0', src: '(x + 3)^{2}', size: 92 },
    { key: 'e.l1', src: '= (x + 3)(x + 3)', size: 84 },
    { key: 'e.l2', src: '= \\cssId{a}{x^{2}} + \\cssId{b}{3x} + \\cssId{c}{3x} + \\cssId{d}{9}', size: 84, tags: { a: blue, b: amber, c: amber, d: teal } },
    { key: 'e.l3', src: '= \\cssId{a}{x^{2}} + \\cssId{b}{6x} + \\cssId{d}{9}', size: 84, tags: { a: blue, b: amber, d: teal } },
    { key: 'e.nm', src: '\\text{quadratic trinomial}', size: 60, col: 'dim', gap: 60 },
    { key: 'e.k1', src: 'x = 2:\\ \\ (2 + 3)^{2} = 25', size: 76 },
    { key: 'e.k2', src: '4 + 12 + 9 = 25\\ \\cssId{ok}{\\checkmark}', size: 76, tags: { ok: lime } },
    { key: 'e.k3', src: 'x^{2} + 9 = 13 \\neq 25', size: 76, col: 'wrong' },
  ]);
  const focus = (): BoxFocus => ({
    groups: [{ cells: [[0, 1], [1, 0]], col: 'link', k: tr.k('e.g') }],
    missed: [{ r: 0, c: 1, k: tr.k('e.miss') }, { r: 1, c: 0, k: tr.k('e.miss') }],
  });
  setScene({ model: c => B.draw(c, boxP('e.'), focus()), lines: st.lines, leads: [], boardBox: PB, extra: c => strikeLine(c, st.at['e.k3']![0]!, tr.k('e.k3s')) });
  tr.jump('e.b.frame', 1); tr.jump('e.b.sides', 1); tr.jump('e.l0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Write the square as a product', why: 'A square is a quantity times itself.', act: 'Write it' },
    { t: 'Every term times every term', why: 'Fill the four cells of the box.', act: 'Fill the box' },
    { t: 'Collect like terms', why: 'Same power of x, same colour.', act: 'Collect' },
    { t: 'Check with a number', why: 'Try x = 2 on both forms.', act: 'Check' },
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
        // both sides pulse: the same factor twice
        tr.set('e.b.sides', 0.35, 0.4); await wait(0.5); if (!alive()) return; tr.set('e.b.sides', 1, 0.6);
        await wait(0.6); if (!alive()) return;
        tr.set('e.l1', 1, 1.2); await wait(1.4);
      } else if (i === 1) {
        tr.set('e.l0:dim', 1, 0.5); tr.set('e.b.cells', 1, 3.2); await wait(3.0); if (!alive()) return;
        tr.set('e.l2', 1, 1.4); await wait(1.6);
      } else if (i === 2) {
        tr.set('e.l1:dim', 1, 0.5); tr.set('e.g', 1, 0.8); await wait(1.2); if (!alive()) return;
        tr.set('e.l3', 1, 1.2); await wait(1.3); if (!alive()) return;
        tr.set('e.nm', 1, 0.9); await wait(1.0);
      } else {
        tr.set('e.g', 0, 0.5); tr.set('e.l2:dim', 1, 0.5);
        tr.set('e.k1', 1, 1.1); await wait(1.3); if (!alive()) return;
        tr.set('e.k2', 1, 1.1); await wait(1.4); if (!alive()) return;
        tr.set('e.k3', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.miss', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('e.k3s', 1, 0.7); await wait(1.4); if (!alive()) return;
        tr.set('e.miss', 0, 0.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.s${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Two of the four partial products are 3x, and like terms add.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'Squaring a sum squares each term, so the 6x is extra.', ok: false, id: 'e.w-fn', mc: MC.fnSum as string | undefined },
      { t: 'The x and the 3 combine into 3x, and then it doubles.', ok: false, id: 'e.w-unlike', mc: MC.unlike as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Where does the 6x in (x + 3)^2 = x^2 + 6x + 9 come from?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.id === 'e.w-fn') seq(async alive => { tr.set('e.miss', 1, 0.6); await wait(2.2); if (!alive()) return; tr.set('e.miss', 0, 0.6); });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: (x − 2)(x² + x + 3) =====================
function partTurn(): void {
  tr.reset('t.');
  const B = ProductBox({
    left: [{ tex: 'x', deg: 1 }, { tex: '-2', deg: 0 }], top: [{ tex: 'x^{2}', deg: 2 }, { tex: 'x', deg: 1 }, { tex: '3', deg: 0 }],
    cells: [['x^{3}', 'x^{2}', '3x'], ['-2x^{2}', '-2x', '-6']], deg: [[3, 2, 1], [2, 1, 0]],
  }, MF, th);
  const amber = W('first'), blue = W('water');
  const st = stack([
    { key: 't.l0', src: '(x - 2)(x^{2} + x + 3)', size: 88, gap: 30 },
    { key: 't.l1', src: '= x^{3} + \\cssId{a}{x^{2}} + \\cssId{b}{3x}', size: 76, tags: { a: blue, b: amber } },
    { key: 't.l1b', src: '\\phantom{=} \\cssId{c}{- 2x^{2}} \\cssId{d}{- 2x} - 6', size: 76, tags: { c: blue, d: amber }, gap: 30 },
    { key: 't.l2', src: '= x^{3} \\cssId{a}{- x^{2}} \\cssId{b}{+ x} - 6', size: 84, tags: { a: blue, b: amber }, gap: 30 },
    { key: 't.l3', src: '\\text{degree } 3:\\ \\text{cubic}', size: 68, col: 'dim' },
  ]);
  const focus = (): BoxFocus => ({
    rowK: [tr.k('t.r0'), tr.k('t.r1')],
    ask: [0, 1, 2].map(c => ({ r: 1, c, reveal: tr.k('t.r1show') })),
    groups: [{ cells: [[0, 1], [1, 0]], col: 'link', k: tr.k('t.g2') }, { cells: [[0, 2], [1, 1]], col: 'link', k: tr.k('t.g1') }],
    row: { i: 1, k: tr.k('t.ringR') },
  });
  setScene({ model: c => B.draw(c, boxP('t.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.set('t.b.frame', 1, 1.0); tr.set('t.b.sides', 1, 1.2, 0.6); tr.set('t.l0', 1, 1.0, 1.0); tr.set('t.r0', 1, 1.6, 2.0);
  let step = 0;
  const STEPS = [
    { t: 'Write the box', why: 'Done for you.' },
    { t: 'First row: x times each term', why: 'Done for you.' },
    { t: 'Second row: −2 times each term', why: 'Your step.' },
    { t: 'Collect and name it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: six cells'), voiced('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    step = 2; drawPlan(); askRow();
  });
  function askRow(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '−2<i>x</i><sup>2</sup>, &nbsp;−2<i>x</i>, &nbsp;−6', ok: true, id: 't.r-ok', mc: undefined as string | undefined },
      { t: '−2<i>x</i><sup>2</sup>, &nbsp;<i>x</i>, &nbsp;3', ok: false, id: 't.r-part', mc: MC.partial as string | undefined },
      { t: '2<i>x</i><sup>2</sup>, &nbsp;2<i>x</i>, &nbsp;6', ok: false, id: 't.r-sign', mc: MC.unlikePos as string | undefined },
    ];
    let done = false;
    tr.set('t.ringR', 1, 0.5); tr.set('t.r1', 1, 1.2, 0.3);
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.row', prompt: '-2 times each term of x^2 + x + 3', board: '(x - 2)(x^2 + x + 3)', response: o.t.replace(/<[^>]+>|&nbsp;/g, ''), expected: '-2x^2, -2x, -6', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.ringR', 0, 0.4); tr.set('t.r1show', 1, 1.2, 0.2); await wait(1.6); if (!alive()) return;
        tr.set('t.l1', 1, 1.2); tr.set('t.l1b', 1, 1.2, 0.6); await wait(1.9); if (!alive()) return;
        step = 3; drawPlan(); askNum('x2');
      });
    })));
    work.replaceChildren(voiced('t.row'), bx, fbHost);
  }
  function askNum(which: 'x2' | 'x1' | 'deg'): void {
    const fbHost = h('div'), inp = numInput(which === 'deg' ? '' : '', () => check()), ok = btn('Check', () => check(), 'go');
    if (which === 'x2') tr.set('t.g2', 1, 0.6);
    if (which === 'x1') { tr.set('t.g2', 0, 0.4); tr.set('t.g1', 1, 0.6); }
    const right = which === 'x2' ? -1 : which === 'x1' ? 1 : 3;
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.num', false)); return; }
      const v = r.v, good = v === right;
      let id = '', mc: string | undefined;
      if (which === 'x2') id = good ? 't.x2-ok' : v === -2 ? 't.x2-one' : v === 1 ? 't.x2-sign' : 't.x2-no';
      else if (which === 'x1') id = good ? 't.x1-ok' : 't.x1-no';
      else { id = good ? 't.d-ok' : v === 4 ? 't.d-count' : v === 6 ? 't.d-sum' : 't.d-no'; mc = v === 4 ? MC.degCount : v === 6 ? MC.degSum : undefined; }
      if (which === 'x2' && v === -2) mc = MC.mismatch;
      ctx.store.log({ part: 'turn', item: `turn.${which}`, prompt: which === 'deg' ? 'degree of x^3 - x^2 + x - 6' : `coefficient of ${which === 'x2' ? 'x^2' : 'x'} in (x - 2)(x^2 + x + 3)`, response: v, expected: right, correct: good, mc });
      fbHost.replaceChildren(voicedFb(id, good));
      if (!good) return;
      ok.disabled = true;
      seq(async alive => {
        if (which === 'x2') { await wait(1.2); if (!alive()) return; askNum('x1'); }
        else if (which === 'x1') { tr.set('t.g1', 0, 0.5); tr.set('t.l1:dim', 1, 0.5); tr.set('t.l1b:dim', 1, 0.5); tr.set('t.l2', 1, 1.2); await wait(2.6); if (!alive()) return; askNum('deg'); }
        else { tr.set('t.l3', 1, 1.0); await wait(1.4); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); }
      });
    }
    work.replaceChildren(voiced(which === 'x2' ? 't.x2' : which === 'x1' ? 't.x1' : 't.deg'), inp.node, h('div', { class: 'row' }, ok), fbHost);
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

// ===================== 4. Prove it: Riley's subtraction on the degree shelf =====================
function partProve(): void {
  tr.reset('p.');
  const S = DegreeShelf({
    maxDeg: 2,
    rows: [
      { cards: [{ tex: '5x^{2}', deg: 2 }, { tex: '3x', deg: 1 }, { tex: '-2', deg: 0 }], label: 'A' },
      { cards: [{ tex: '2x^{2}', deg: 2, flipTex: '-2x^{2}' }, { tex: '-4x', deg: 1, flipTex: '4x' }, { tex: '1', deg: 0, flipTex: '-1' }], label: 'B' },
    ],
    flipRow: 1, sum: ['3x^{2}', '7x', '-3'],
  }, MF, th);
  const st = stack([
    { key: 'p.l0', src: '(5x^{2} + 3x - 2) - (2x^{2} - 4x + 1)', size: 76 },
    { key: 'p.ri', src: '\\text{Riley: } 3x^{2} - x - 1', size: 72, col: 'dim', gap: 40 },
    { key: 'p.k1', src: 'x = 1:\\ \\ 7 \\neq 1', size: 76, gap: 40 },
    { key: 'p.l1', src: '= (5x^{2} + 3x - 2) + (-2x^{2} + 4x - 1)', size: 72 },
    { key: 'p.l2', src: '= \\cssId{a}{3x^{2}} + \\cssId{b}{7x} \\cssId{c}{- 3}', size: 88, tags: { a: W('water'), b: W('first'), c: W('second') } },
  ]);
  const focus = (): ShelfFocus => ({
    flipK: [tr.k('p.f0'), tr.k('p.f12'), tr.k('p.f12')],
    cardRing: [{ r: 1, i: 1, col: 'wrong', k: tr.k('p.kept') }, { r: 1, i: 2, col: 'wrong', k: tr.k('p.kept') }],
  });
  setScene({ model: c => S.draw(c, shelfP('p.'), focus()), lines: st.lines, leads: [], boardBox: PB, extra: c => strikeLine(c, st.at['p.ri']![0]!, tr.k('p.ris')) });
  tr.set('p.s.shelf', 1, 1.0); tr.set('p.s.rows', 1, 1.4, 0.6); tr.set('p.l0', 1, 1.0, 1.0); tr.set('p.ri', 1, 0.9, 1.8);
  const CHIPS = [
    { t: 'At x = 1 the two sides are 7 and 1: one value where they differ is enough.', fits: 0 },
    { t: 'The minus sign multiplies every term of the subtracted polynomial.', fits: 1 },
    { t: 'Like terms have the same power: add their coefficients, keep the exponent.', fits: 2 },
    { t: 'x = 1 is only one value; it could be an exception.', fits: -1, mc: MC.exception, id: 'p.no.exc' },
    { t: 'The minus only reaches the term right next to it.', fits: -1, mc: MC.negFirst, id: 'p.no.first' },
    { t: 'Checking that two values agree would prove Riley right.', fits: -1, mc: MC.examples, id: 'p.no.ex' },
  ];
  const CLAIMS = [
    'Riley’s answer is not equal to the left side,',
    'The opposite of 2<i>x</i><sup>2</sup> − 4<i>x</i> + 1 is −2<i>x</i><sup>2</sup> + 4<i>x</i> − 1,',
    'So the difference is <b class="s">3<i>x</i><sup>2</sup> + 7<i>x</i> − 3</b>,',
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
    if (ch.fits !== filled) { fbHost.replaceChildren(voicedFb(ch.id ?? 'p.no.other', false)); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(voicedFb(`p.c${n}`, true));
    seq(async alive => {
      if (n === 1) { tr.set('p.k1', 1, 1.2); await wait(1.4); if (!alive()) return; tr.set('p.ris', 1, 0.7); }
      if (n === 2) {
        tr.set('p.f0', 1, 0.8); await wait(1.0); if (!alive()) return;           // Riley's flip: the first card only
        tr.set('p.kept', 1, 0.5); await wait(1.6); if (!alive()) return;
        tr.set('p.kept', 0, 0.4); tr.set('p.f12', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('p.l1', 1, 1.2);
      }
      if (n === 3) {
        tr.set('p.l1:dim', 1, 0.5); tr.set('p.s.sum', 1, 1.6); await wait(1.8); if (!alive()) return;
        tr.set('p.l2', 1, 1.2); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: '(5x^2 + 3x - 2) - (2x^2 - 4x + 1) = 3x^2 - x - 1: right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.negFirst : undefined });
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
    show: it => showItem(it as PolyItem),
  });
}
const sideOf = (t: Poly[number]) => ({ tex: termTex(t), deg: deg(t) });
/** the practice box: a × b, cells filled at the solve, like cells ringed, cancelling cells struck */
function boxScene(it: PolyItem): { solve?: (alive: () => boolean) => Promise<void> } | null {
  const p = it.picture!.box!;
  const T = table(p.a, p.b);
  const made = tryBlock(() => ProductBox({
    left: p.a.map(sideOf), top: p.b.map(sideOf), cells: T.map(r => r.map(termTex)), deg: T.map(r => r.map(deg)), noteL: p.noteL, noteT: p.noteT,
  }, MF, th));
  if (!made.ok) { console.info('box fallback', it.family, made.error); return null; }
  const B: BoxBlock = made.value;
  // like cells: same power, two or more of them
  const byDeg = new Map<number, [number, number][]>();
  T.forEach((r, i) => r.forEach((t, j) => byDeg.set(deg(t), [...(byDeg.get(deg(t)) ?? []), [i, j]])));
  const groups = [...byDeg.entries()].filter(([, cs]) => cs.length > 1);
  const all = mul(p.a, p.b), res = collect(all);
  const zero = groups.filter(([d]) => isZ(coefOf(all, d)));
  const st = stack([
    { key: 'x.L0', src: it.board, size: 84, gap: 30 },
    { key: 'x.L1', src: `= ${polyTex(all)}`, size: 72, gap: 30 },
    { key: 'x.L2', src: `= ${polyTex(res)}`, size: 80, col: 'link' },
  ]);
  const focus = (): BoxFocus => ({
    groups: groups.map(([, cs], gi) => ({ cells: cs, col: 'link' as Paint, k: tr.k('x.g' + gi) })),
    strike: zero.flatMap(([, cs]) => cs.map(([r, c]) => ({ r, c, k: tr.k('x.z') }))),
  });
  setScene({ model: c => B.draw(c, boxP('x.'), focus()), lines: st.lines, leads: [], boardBox: PB });
  tr.set('x.b.frame', 1, 0.7); tr.set('x.b.sides', 1, 0.9, 0.3); tr.set('x.L0', 1, 0.9, 0.5);
  if (p.cells === 'all') tr.set('x.b.cells', 1, 1.6, 1.0);
  return {
    solve: async alive => {
      if (p.cells !== 'all') { tr.set('x.b.cells', 1, 0.5 + 0.35 * T.flat().length); await wait(0.6 + 0.35 * T.flat().length); if (!alive()) return; }
      tr.set('x.L1', 1, 1.0); await wait(1.1); if (!alive()) return;
      for (let gi = 0; gi < groups.length; gi++) { tr.set('x.g' + gi, 1, 0.5); await wait(0.8); if (!alive()) return; }
      if (zero.length) { tr.set('x.z', 1, 0.6); await wait(0.8); if (!alive()) return; }
      tr.set('x.L1:dim', 1, 0.4); tr.set('x.L2', 1, 1.0);
    },
  };
}
/** the practice shelf: rows by power; loose rows sort, a flip row flips, the sum row adds up at the solve */
function shelfScene(it: PolyItem): { solve?: (alive: () => boolean) => Promise<void> } | null {
  const p = it.picture!.shelf!;
  const rows = p.rows;
  const maxDeg = Math.max(1, ...rows.flat().map(deg));
  const eff = rows.map((r, i) => (i === p.flipRow ? neg(r) : r));
  const total = eff.reduce((s, r) => add(s, r), [] as Poly);
  const sum = p.sum ? Array.from({ length: maxDeg + 1 }, (_, j) => { const d = maxDeg - j, c = coefOf(total, d); return isZ(c) ? null : termTex({ c, x: d, y: 0, f: rows.flat().find(t => t.f)?.f }); }) : undefined;
  const mk = (loose: boolean | undefined) => tryBlock(() => DegreeShelf({
    maxDeg, loose, flipRow: p.flipRow, sum,
    rows: rows.map(r => ({ cards: r.map(t => ({ tex: termTex(t), deg: deg(t), flipTex: termTex(neg([t])[0]!) })) })),
  }, MF, th));
  // a written polynomial too long for the strip: the cards start in their columns instead
  let made = mk(p.loose), looseOn = !!p.loose;
  if (!made.ok && looseOn) { made = mk(false); looseOn = false; }
  if (!made.ok) { console.info('shelf fallback', it.family, made.error); return null; }
  const S: ShelfBlock = made.value;
  const lines = stack([
    { key: 'x.L0', src: it.board, size: 84, gap: 40 },
    ...(p.sum || p.flipRow !== undefined ? [{ key: 'x.L2', src: `= ${polyTex(p.sum ? collect(total) : eff[0]!)}`, size: 80, col: 'link' as Paint }] : []),
  ]).lines;
  const askD = p.askD ?? [];
  const focus = (): ShelfFocus => ({ colRing: askD.map(d => ({ d, col: 'link' as Paint, k: tr.k('x.ring') })) });
  setScene({ model: c => S.draw(c, shelfP('x.'), focus()), lines, leads: [], boardBox: PB });
  tr.set('x.s.shelf', 1, 0.8); tr.set('x.L0', 1, 0.9, 0.4);
  if (looseOn) tr.set('x.s.loose', 1, 0.9, 0.3); else tr.set('x.s.rows', 1, 1.0, 0.4);
  if (askD.length) tr.set('x.ring', 1, 0.6, 1.0);
  return {
    solve: async alive => {
      if (looseOn) { tr.set('x.s.sort', 1, 1.6); await wait(1.8); if (!alive()) return; }
      if (p.flipRow !== undefined) { tr.set('x.s.flip', 1, 1.0); await wait(1.2); if (!alive()) return; }
      if (p.sum) { tr.set('x.s.sum', 1, 1.4); await wait(1.5); if (!alive()) return; }
      tr.set('x.L2', 1, 1.0);
    },
  };
}
/** the practice chain: numbered rewrite lines on a wide slate (values at a test x on the right) */
function chainScene(it: PolyItem): { solve?: (alive: () => boolean) => Promise<void> } {
  const ch = it.picture!.chain!;
  const bad = it.picture!.reveal?.bad ?? -1;
  const sl = box(110, 90, 1810, 990);
  const n = ch.lines.length, gap = Math.min(190, (sl.h - 180) / n);
  const valW = ch.vals ? 260 : 0;
  const Ls: Line[] = ch.lines.map((src, i) => {
    const F = tex(src) as Formula;
    let s = 76;
    while (s > 60 && texWidth(F, s) > sl.w - 300 - valW) s -= 2;
    return { key: 'x.c' + i, F, x: sl.x0 + 230, y: sl.y0 + 150 + i * gap, size: s };
  });
  const vals = (ch.vals ?? []).map((v, i) => ({ key: 'x.v' + i, F: tex(`= ${v.replace('−', '-')}`) as Formula, x: sl.x1 - valW + 30, y: Ls[i]!.y, size: 66, col: 'pick' as Paint }));
  const extra = (c: Canvas) => {
    ch.lines.forEach((_, i) => drawWords(c, i === 0 ? 'start' : `Step ${i}`, sl.x0 + 50, Ls[i]!.y, i === bad && tr.k('x.bad') > 0.5 ? 'wrong' : 'dim', tr.k('x.c' + i), { size: 44 }));
    if (bad > 0) {
      const k = tr.k('x.bad'), b = lineBox(Ls[bad]!);
      if (k > 0) { c.g.save(); c.g.globalAlpha *= k; c.g.strokeStyle = th.roles.wrong.fill; c.g.lineWidth = 5; c.g.beginPath(); c.g.roundRect(sl.x0 + 30, b.y0 - 18, sl.w - 60, b.h + 36, 14); c.g.stroke(); c.g.restore(); }
    }
    if (ch.vals) drawWords(c, `at x = ${(ch.at ?? 0) < 0 ? '−' + Math.abs(ch.at!) : ch.at}`, sl.x1 - valW + 30, sl.y0 + 40, 'pick', tr.k('x.v0'), { size: 44 });
  };
  setScene({ model: c => slate(c, sl), lines: [...Ls, ...vals], leads: [], boardBox: null, extra });
  Ls.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.2 + i * 0.5));
  vals.forEach((L, i) => tr.set(L.key, 1, 0.6, 0.6 + i * 0.5));
  return { solve: bad > 0 ? async () => { tr.set('x.bad', 1, 0.6); } : undefined };
}
function showItem(item: PolyItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.box) { const r = boxScene(item); if (r) return r; }
  if (pic?.shelf) { const r = shelfScene(item); if (r) return r; }
  if (pic?.chain) return chainScene(item);
  const big = box(240, 220, 1680, 800);
  setScene({ lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['(x + 3)^{2} = x^{2} + 6x + 9 \\checkmark \\neq \\text{Riley: } \\tfrac{1}{2}', '\\overset{?}{=} \\sqrt{x} \\frac{x}{4}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
