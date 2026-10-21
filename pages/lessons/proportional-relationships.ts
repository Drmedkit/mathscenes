// proportional-relationships.ts: a grade-7 topic of the lesson line (7.RP.A.2), on the shared lesson runtime.
//   1 The question   three shops' price lists for trail mix; which one is proportional? (A: the first rows agree, the
//                    last breaks; B: goes up by the same amount; C: one rate, rows out of order) + how sure
//   2 Worked example shop C: Plot -> Divide -> Name k -> Write the rule, on a graph (left) and the table (board); one
//                    "why divide in every row?"
//   3 Your turn      gas at a pump, faded from the end: the plot and two quotients are given; the kid divides the last
//                    row, finds the point (1, k), picks the equation and checks the zero row by multiplying
//   4 Prove it       Riley: "shop A is proportional, double the pounds, double the price"; a because-chain from
//                    reason chips (distractors = the doubling check and "most rows match")
//   5 Practice       all 17 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/proportional-relationships/script.ts (panel HTML) = voice/lines.json (spoken).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { texWidth, tex, type Formula } from '../../src/core/tex';
import { rectPts } from '../../src/core/pts';
import { BOARD, BOARD_W, LX, MF, bigLine, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item } from '../../src/lesson/runtime/item';
import { slate } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { wash, inkLine } from '../../src/lesson/wash';
import { DUSK } from '../../src/lesson/dusk';
import { RateGraph, type GraphFocus, type RateGraphBlock, type RateGraphParams } from '../../src/lesson/topics/proportional-relationships/RateGraph';
import { RateTable, type RateTableBlock, type RateTableParams, type TableFocus } from '../../src/lesson/topics/proportional-relationships/RateTable';
import { type Row, tableTest } from '../../src/lesson/topics/proportional-relationships/rateMaths';
import { FAMILY_NAMES, GENS, type RatePicture } from '../../src/lesson/topics/proportional-relationships/items';
import { PLAN } from '../../src/lesson/topics/proportional-relationships/plan';
import { SCRIPT } from '../../src/lesson/topics/proportional-relationships/script';

const SLUG = 'proportional-relationships';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a panel line from the script (shown; spoken with talk) */
const P = (id: string, cls = '') => html('p', cls, SCRIPT[id] ?? id);
/** speak voiced lines one after another (stops when the kid leaves the part) */
const talk = (...ids: string[]) => seq(async alive => { for (const id of ids) { if (!alive()) return; await ctx.say(id); } });
/** a feedback box with a voiced line */
const fbLine = (ok: boolean, id: string, extra: Kid[] = []) => { talk(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- the lesson's numbers (asserted, so a wrong edit cannot render) ----------
const SHOPS: { name: string; rows: Row[]; mc: string; cb: string }[] = [
  { name: 'Shop A', rows: [{ x: 1, y: 3 }, { x: 2, y: 6 }, { x: 4, y: 10 }], mc: 'mc.ratio-rate.too-few-checks-for-proportionality', cb: 't.cb-a' },
  { name: 'Shop B', rows: [{ x: 2, y: 7 }, { x: 4, y: 9 }, { x: 6, y: 11 }], mc: 'mc.ratio-rate.scales-non-proportional', cb: 't.cb-b' },
  { name: 'Shop C', rows: [{ x: 6, y: 15 }, { x: 2, y: 5 }, { x: 3, y: 7.5 }], mc: '', cb: 't.cb-right' },
];
const GAS: Row[] = [{ x: 4, y: 14 }, { x: 10, y: 35 }, { x: 6, y: 21 }];
{
  const [a, b, c] = SHOPS.map(s => tableTest(s.rows));
  const g = tableTest(GAS);
  if (a!.proportional || a!.breaks.join() !== '2' || b!.proportional || !c!.proportional || c!.k!.p !== 5 || c!.k!.q !== 2 || !g.proportional || g.k!.p !== 7 || g.k!.q !== 2) throw new Error('proportional-relationships: the lesson numbers are wrong');
}

// ---------- board geometry ----------
const TX = BOARD.x0 + 30, TW = BOARD.w - 60;
/** a TeX line on the board that shrinks to fit (numbers stay >= 60 px; word lines may go to 48 px) */
function fit(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Line['col'], min = 60): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > min && texWidth(F, s) > BOARD_W) s -= 2;
  if (!F.pending && texWidth(F, s) > BOARD_W + 4) console.warn(`board line too wide: ${src}`);
  return { key, F, x: LX, y, size: s, tags, col };
}
/** a leader leaves a little lower than usual, so its start dot never reads as a decimal point */
const below = (b: Box): Box => box(b.x0, b.y0, b.x1, b.y1 + 14);
const T = { c: { col: 'second' as const }, k: { col: 'link' as const }, x: { col: 'first' as const }, w: { col: 'wrong' as const } };

/** a scene: the graph on the left, the table (and lines) on the board */
interface GScene { pre: string; G: RateGraphBlock | null; Tb: RateTableBlock | null; lines: Line[]; leads?: Lead[]; gFocus?: () => GraphFocus; tFocus?: () => TableFocus; extra?: (c: Canvas) => void; model?: (c: Canvas) => void; table?: number; boardBox?: Box | null }
function setG(S: GScene): void {
  setScene({
    table: S.table ?? 1080,
    model: c => { S.model?.(c); S.G?.draw(c, progressOf(s => tr.k(S.pre + s)), S.gFocus?.()); },
    lines: S.lines, leads: S.leads ?? [], boardBox: S.boardBox,
    extra: c => { S.Tb?.draw(c, progressOf(s => tr.k(S.pre + 't.' + s)), S.tFocus?.()); S.extra?.(c); },
  });
}
/** one row of the table and its point light up together (a row and a point are the same pair) */
function rowFocus(pre: string, row: () => number | null, col: 'pick' | 'wrong' = 'pick') {
  return {
    g: (): GraphFocus => { const r = row(); return r === null ? {} : { pts: ['r' + r], ptK: tr.k(pre + 'fr'), ptCol: col }; },
    t: (): TableFocus => ({ row: row(), rowK: tr.k(pre + 'fr'), rowCol: col, dimRows: 0 }),
  };
}

// ===== 1. The question: three shops =====
const SLATES = [0, 1, 2].map(i => box(150 + i * 560, 140, 650 + i * 560, 700));
function bin(c: Canvas, cx: number, y: number, seed: number, k: number): void {
  if (k <= 0) return;
  c.g.save(); c.g.globalAlpha *= Math.min(1, k);
  // a kraft scoop bin with trail mix heaped in it: washes + one ink line
  wash(c, [[cx - 150, y], [cx + 150, y], [cx + 128, y + 120], [cx - 128, y + 120]], '#B98763', { seed, ink: DUSK.ink, inkW: 3, shade: 0.35 });
  const nuts = ['#7A4E35', '#E3C27A', '#5E3E33', '#C98B4E', '#F0E2C0', '#8C2F39'];
  for (let i = 0; i < 26; i++) {
    const u = ((i * 37 + seed * 11) % 100) / 100, v = ((i * 53 + seed * 7) % 100) / 100;
    const x = cx - 132 + u * 264, yy = y + 6 - v * 26 - Math.sin(u * Math.PI) * 18;
    wash(c, rectPts(x - 11, yy - 7, 22, 14, 7), nuts[i % nuts.length] as `#${string}`, { seed: seed * 100 + i, rough: 1.2, ink: null, shade: 0.2 });
  }
  inkLine(c, [[cx - 150, y], [cx + 150, y]], { col: DUSK.ink, w: 3, seed: seed + 3 });
  c.g.restore();
}
function partQuestion(): void {
  tr.reset('q.');
  const tables = SHOPS.map((s, i) => RateTable({ cols: ['pounds', 'dollars'], rows: s.rows, money: [false, true], size: 70 }, SLATES[i]!.x0 + 40, 250, SLATES[i]!.w - 80, th));
  setScene({
    table: 840, lines: [], leads: [], boardBox: null,
    model: c => {
      SHOPS.forEach((s, i) => {
        const k = tr.k('q.sl' + i), B = SLATES[i]!;
        if (k <= 0) return;
        c.g.save(); c.g.globalAlpha *= Math.min(1, k); slate(c, B); c.g.restore();
        const pk = tr.k('q.pick' + i);
        if (pk > 0) { c.g.save(); c.g.globalAlpha *= pk; c.g.strokeStyle = '#C3AEF6'; c.g.lineWidth = 6; c.g.beginPath(); c.g.roundRect(B.x0 - 8, B.y0 - 8, B.w + 16, B.h + 16, 26); c.g.stroke(); c.g.restore(); }
        drawWords(c, s.name, B.cx, B.y0 + 62, pk > 0.5 ? 'pick' : 'ink', k, { size: 56, align: 'center' });
        tables[i]!.draw(c, progressOf(() => k));
        bin(c, B.cx, 880, 3 + i, k);
      });
    },
  });
  SHOPS.forEach((_, i) => tr.set('q.sl' + i, 1, 0.9, 0.2 + i * 0.45));
  const syncPick = () => SHOPS.forEach((_, i) => tr.set('q.pick' + i, commit().pick === i ? 1 : 0, 0.35));

  const cards = h('div', { class: 'cards shops', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = commit().pick ?? 2, sh = SHOPS[p]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Which shop charges a price proportional to the weight? A: 1→3, 2→6, 4→10; B: 2→7, 4→9, 6→11; C: 6→15, 2→5, 3→7.50', response: sh.name, expected: 'Shop C', correct: p === 2, mc: sh.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
    syncPick();
  };
  SHOPS.forEach((s, i) => { const b = h('button'); b.innerHTML = `${s.name.replace('Shop ', '')}<small>Shop</small>`; b.setAttribute('aria-label', s.name); b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  talk('q.intro', 'q.ask', 'q.sure');
  setPanel(h('h2', {}, 'Three shops, one price per pound?'), P('q.intro'), P('q.ask'), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: shop C =====
const C = SHOPS[2]!.rows;
const EXG: RateGraphParams = { xMax: 8, yMax: 20, xStep: 1, yStep: 2.5, xName: 'pounds', yName: 'dollars', points: C.map((r, i) => ({ ...r, id: 'r' + i, label: true })), lines: [{ id: 'L', k: 2.5, ends: 'ray' }], unit: 'L', unitWords: ['1 lb', '$2.50'] };
function partExample(): void {
  tr.reset('e.');
  const G = RateGraph(EXG, MF, th);
  const Tb = RateTable({ cols: ['pounds', 'dollars', '$ per lb'], rows: C, money: [false, true] }, TX, BOARD.y0 + 34, TW, th);
  const y0 = Tb.where.bottom;
  const Lk = fit('e.Lk', '\\cssId{k}{k = 2.5}\\ \\tfrac{\\text{dollars}}{\\text{pound}}', y0 + 110, 76, { k: T.k });
  const Leq = fit('e.Leq', '\\cssId{c}{c} = \\cssId{k}{2.5}\\,\\cssId{x}{p}', y0 + 250, 110, T);
  const Lleg = fit('e.Lleg', '\\cssId{c}{c}\\text{: cost},\\ \\cssId{x}{p}\\text{: pounds}', y0 + 350, 50, T, 'dim', 46);
  const Lz = fit('e.Lz', '2.5 \\times 0 = 0', y0 + 450, 66, undefined, 'dim');
  let fRow: number | null = null;
  const F = rowFocus('e.', () => fRow);
  setG({
    pre: 'e.', G, Tb, lines: [Lk, Leq, Lleg, Lz],
    leads: [{ key: 'e.ldEq', from: () => below(partOf(Leq, 'c')), to: () => G.where.lineEnd('L'), col: 'link' }],
    gFocus: F.g, tFocus: F.t,
  });
  tr.jump('e.axes', 1); tr.jump('e.t.head', 1); C.forEach((_, i) => tr.jump(`e.t.row:${i}`, 1));

  let step = 0;
  const STEPS = [
    { t: 'Plot every row as a point', why: '(pounds, dollars): the input first.', act: 'Plot the rows' },
    { t: 'Divide in every row: dollars ÷ pounds', why: 'The same order in every row.', act: 'Divide' },
    { t: 'Name k: the amount for ONE pound', why: 'k is the one multiplier.', act: 'Find k' },
    { t: 'Write the rule: c = k × p', why: 'It must fit every row, and 0 too.', act: 'Write the rule' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        for (let r = 0; r < 3; r++) {
          fRow = r; tr.set('e.fr', 1, 0.3); tr.set(`e.pt:r${r}`, 1, 0.8); await wait(1.1); if (!alive()) return;
        }
        tr.set('e.fr', 0, 0.4);
      } else if (i === 1) {
        for (let r = 0; r < 3; r++) {
          fRow = r; tr.set('e.fr', 1, 0.3); tr.set(`e.ray:r${r}`, 1, 0.9); await wait(0.8); if (!alive()) return;
          tr.set(`e.t.q:${r}`, 1, 0.7); await wait(0.8); if (!alive()) return;
        }
        tr.set('e.fr', 0, 0.4);
      } else if (i === 2) {
        tr.set('e.unit', 1, 1.6); await wait(1.5); if (!alive()) return;
        tr.set('e.Lk', 1, 1.0); await wait(1.0); if (!alive()) return;
      } else {
        tr.set('e.Lk:dim', 1, 0.5);
        tr.set('e.line:L', 1, 1.4); await wait(1.0); if (!alive()) return;
        tr.set('e.origin', 1, 0.6);
        tr.set('e.Leq', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.ldEq', 1, 0.9); tr.set('e.Lleg', 1, 0.8, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('e.Lz', 1, 0.8); await wait(0.9); if (!alive()) return;
      }
      sayBox.replaceChildren(P(`e.s${i}`));
      if (i < 3) talk(`e.s${i}`);
      else { talk('e.s3', 'e.why'); selfExplain(); }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'If two rows agree, the others always do too.', ok: false, mc: 'mc.ratio-rate.too-few-checks-for-proportionality', id: 'e.w-two' },
      { t: 'One row with a different rate would mean no single multiplier fits.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Dividing pounds by dollars in some rows is fine too.', ok: false, mc: 'mc.ratio-rate.mixed-rate-orientation', id: 'e.w-order' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbLine(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why divide in every row, not just the first two?', response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), P('e.intro'), plan, sayBox, after);
  talk('e.intro');
}

// ===== 3. Your turn: gas (faded from the end) =====
const GASG: RateGraphParams = { xMax: 12, yMax: 40, xStep: 1, yStep: 5, xName: 'gallons', yName: 'dollars', points: GAS.map((r, i) => ({ ...r, id: 'r' + i, label: true })), lines: [{ id: 'L', k: 3.5, ends: 'ray' }], unit: 'L', unitWords: ['1 gal', '$3.50'] };
function partTurn(): void {
  tr.reset('t.');
  const G = RateGraph(GASG, MF, th);
  const rows = [...GAS, { x: 0, y: 0 }];
  const Tb = RateTable({ cols: ['gallons', 'dollars', '$ per gal'], rows, money: [false, true], qAlt: { 2: '?' }, qTex: { 3: '\\text{none}' } }, TX, BOARD.y0 + 30, TW, th);
  const y0 = Tb.where.bottom;
  const Lk = fit('t.Lk', '\\cssId{k}{k = 3.5}\\ \\tfrac{\\text{dollars}}{\\text{gallon}}', y0 + 95, 72, { k: T.k });
  const Leq = fit('t.Leq', '\\cssId{c}{c} = \\cssId{k}{3.5}\\,\\cssId{x}{g}', y0 + 215, 100, T);
  const Lz = fit('t.Lz', '3.5 \\times 0 = 0', y0 + 330, 66, undefined, 'link');
  let fRow: number | null = null, alt = true;
  const F = rowFocus('t.', () => fRow);
  setG({
    pre: 't.', G, Tb, lines: [Lk, Leq, Lz],
    leads: [{ key: 't.ldEq', from: () => below(partOf(Leq, 'c')), to: () => G.where.lineEnd('L'), col: 'link' }],
    gFocus: F.g, tFocus: () => ({ ...F.t(), alt: alt ? [2] : [] }),
  });
  tr.set('t.axes', 1, 0.8); tr.set('t.t.head', 1, 0.6, 0.3); GAS.forEach((_, i) => tr.set(`t.t.row:${i}`, 1, 0.7, 0.6 + i * 0.3));

  let step = 0;
  const STEPS = [
    { t: 'Plot every row as a point', why: 'Done for you.' },
    { t: 'Divide in every row: dollars ÷ gallons', why: 'Two rows done for you, the last one is yours.' },
    { t: 'Name k: the amount for ONE gallon', why: 'Your step.' },
    { t: 'Write the rule: c = k × g', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  talk('t.intro');
  setPanel(h('h2', {}, 'Gas by the gallon'), P('t.intro'), plan, work);

  seq(async alive => {
    await wait(1.8); if (!alive()) return;
    for (let r = 0; r < 3; r++) { fRow = r; tr.set('t.fr', 1, 0.3); tr.set(`t.pt:r${r}`, 1, 0.7); await wait(0.9); if (!alive()) return; }
    step = 1; drawPlan();
    for (let r = 0; r < 2; r++) {
      fRow = r; tr.set(`t.ray:r${r}`, 1, 0.8); await wait(0.7); if (!alive()) return;
      tr.set(`t.t.q:${r}`, 1, 0.6); await wait(0.8); if (!alive()) return;
    }
    fRow = 2; tr.set('t.t.q:2', 1, 0.5);
    askDiv();
  });

  function askDiv(): void {
    const fbHost = h('div');
    const inp = numInput('dollars per gallon', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number, like 2.5.')); return; }
      const v = r.v;
      const right = Math.abs(v - 3.5) < 1e-6, flip = Math.abs(v - 6 / 21) < 0.01, total = Math.abs(v - 21) < 1e-6;
      const id = right ? 't.d-ok' : flip ? 't.d-flip' : total ? 't.d-total' : 't.d-other';
      const mc = flip ? 'mc.ratio-rate.mixed-rate-orientation' : total ? 'mc.ratio-rate.confuses-rate-with-total' : undefined;
      ctx.store.log({ part: 'turn', subgoal: 'table-test', item: 'turn.divide', prompt: '6 gallons cost $21: dollars per gallon?', response: r, expected: 3.5, correct: right, mc });
      fbHost.replaceChildren(fbLine(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        alt = false; tr.jump('t.t.q:2', 0); tr.set('t.t.q:2', 1, 0.7);
        tr.set('t.ray:r2', 1, 0.9, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('t.fr', 0, 0.4); fRow = null;
        step = 2; drawPlan(); askUnit();
      });
    }
    work.replaceChildren(P('t.div'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    talk('t.div');
    inp.focus();
  }
  function askUnit(): void {
    const fbHost = h('div');
    const inp = pairInput('(', ',', () => check());
    inp.node.append(h('span', { class: 'op' }, ')'));
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair') { fbHost.replaceChildren(feedback(false, 'Fill in both numbers.')); return; }
      const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6;
      const right = eq(r.x, 1) && eq(r.y, 3.5), swap = eq(r.x, 3.5) && eq(r.y, 1), isRow = GAS.some(g => eq(r.x, g.x) && eq(r.y, g.y));
      const id = right ? 't.u-ok' : swap ? 't.u-swap' : isRow ? 't.u-row' : 't.u-other';
      const mc = swap ? 'mc.coordinate-geometry.ordered-pair-as-unordered' : isRow ? 'mc.ratio-rate.confuses-rate-with-total' : undefined;
      ctx.store.log({ part: 'turn', subgoal: 'k-from-graph', item: 'turn.unit', prompt: 'Which point of the graph shows k?', response: r, expected: { x: 1, y: 3.5 }, correct: right, mc });
      fbHost.replaceChildren(fbLine(right, id));
      if (!right) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.unit', 1, 1.6); await wait(1.5); if (!alive()) return;
        tr.set('t.Lk', 1, 1.0); await wait(1.2); if (!alive()) return;
        step = 3; drawPlan(); askWrite();
      });
    }
    work.replaceChildren(P('t.unit'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    talk('t.unit');
    inp.focus();
  }
  function askWrite(): void {
    const fbHost = h('div');
    const opts = [
      { t: '<i>g</i> = 3.5<i>c</i>', ok: false, id: 't.w-flip', mc: 'mc.ratio-rate.scale-factor-inverted' },
      { t: '<i>c</i> = 3.5<i>g</i>', ok: true, id: 't.w-ok', mc: undefined as string | undefined },
      { t: '<i>c</i> = <i>g</i> + 3.5', ok: false, id: 't.w-add', mc: 'mc.ratio-rate.wrong-form-proportional-equation' },
    ];
    const box_ = h('div', { class: 'opts eqs' });
    let done = false;
    opts.forEach(o => {
      const b = btn(o.t, () => {
        if (done) return;
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbLine(o.ok, o.id));
        ctx.store.log({ part: 'turn', subgoal: 'write-equation', item: 'turn.write', prompt: 'Which equation fits every row? (g gallons, c cost)', response: b.textContent, expected: 'c = 3.5g', correct: o.ok, mc: o.mc });
        if (!o.ok) return;
        done = true;
        seq(async alive => {
          tr.set('t.Lk:dim', 1, 0.5);
          tr.set('t.line:L', 1, 1.4); await wait(1.0); if (!alive()) return;
          tr.set('t.Leq', 1, 1.0); await wait(1.0); if (!alive()) return;
          tr.set('t.ldEq', 1, 0.9); await wait(1.4); if (!alive()) return;
          step = 4; drawPlan(); askZero();
        });
      });
      box_.append(b);
    });
    work.replaceChildren(P('t.write'), box_, fbHost);
    talk('t.write');
  }
  function askZero(): void {
    const fbHost = h('div');
    tr.set('t.ldEq', 0, 0.4); tr.set('t.Leq:dim', 1, 0.5);
    fRow = 3; tr.set('t.fr', 1, 0.4); tr.set('t.t.row:3', 1, 0.8); tr.set('t.t.q:3', 1, 0.6, 0.5);
    const opts = [
      { t: 'Divide: 0 ÷ 0 = 0, so that row’s rate is 0', ok: false, id: 't.z-zero', mc: 'mc.ratio-rate.zero-over-zero-as-rate' },
      { t: 'Multiply: 3.5 × 0 = 0, so the row fits', ok: true, id: 't.z-ok', mc: undefined as string | undefined },
      { t: '0 ÷ 0 can’t be done, so the table is not proportional', ok: false, id: 't.z-reject', mc: 'mc.ratio-rate.rejects-proportional-over-zero-point' },
    ];
    const box_ = h('div', { class: 'opts' });
    let done = false;
    opts.forEach(o => {
      const b = btn(o.t, () => {
        if (done) return;
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        ctx.store.log({ part: 'turn', subgoal: 'zero-input', item: 'turn.zero', prompt: 'Row 0 gallons, $0: how do you check it?', response: o.t, expected: 'multiply', correct: o.ok, mc: o.mc });
        if (!o.ok) { fbHost.replaceChildren(fbLine(false, o.id)); return; }
        done = true;
        fbHost.replaceChildren(feedback(true, SCRIPT['t.z-ok']!));
        const cb = callback();
        talk('t.z-ok', cb.id);
        seq(async alive => {
          tr.set('t.Lz', 1, 0.9); tr.set('t.origin', 1, 0.7, 0.4); await wait(1.4); if (!alive()) return;
          tr.set('t.fr', 0, 0.5); fRow = null;
          fbHost.append(cb.node);
        });
      });
      box_.append(b);
    });
    work.replaceChildren(P('t.zero'), box_, fbHost);
    talk('t.zero');
  }
  function callback(): { node: HTMLElement; id: string } {
    const pick = commit().pick;
    const id = pick === null || pick === undefined ? 't.cb-none' : SHOPS[pick]!.cb;
    const c = h('div', { class: 'callback' });
    c.innerHTML = SCRIPT[id]!;
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return { node: c, id };
  }
}

// ===== 4. Prove it: Riley and shop A =====
const A_ROWS = SHOPS[0]!.rows;
const AG = (wrong: boolean): RateGraphParams => ({ xMax: 5, yMax: 15, xStep: 1, yStep: 3, xName: 'pounds', yName: 'dollars', points: A_ROWS.map((r, i) => ({ ...r, id: 'r' + i, label: true, role: wrong && i === 2 ? 'wrong' : undefined })) });
function partProve(): void {
  tr.reset('p.');
  const G0 = RateGraph(AG(false), MF, th), G1 = RateGraph(AG(true), MF, th);
  let red = false;
  const Tb = RateTable({ cols: ['pounds', 'dollars', '$ per lb'], rows: A_ROWS, money: [false, true] }, TX, BOARD.y0 + 200, TW, th);
  const L1 = fit('p.L1', '\\text{Riley says}', BOARD.y0 + 70, 52, undefined, 'dim', 46);
  const L2 = fit('p.L2', '\\cssId{w}{\\text{proportional}}', BOARD.y0 + 148, 76);
  const L3 = fit('p.L3', '\\cssId{k}{3} \\ne \\cssId{w}{2.5}', Tb.where.bottom + 130, 92, T);
  let rowsF: number[] = [];
  const graph = { draw: (c: Canvas, p: Parameters<RateGraphBlock['draw']>[1], f?: GraphFocus) => (red ? G1 : G0).draw(c, p, f) } as unknown as RateGraphBlock;
  setG({
    pre: 'p.', G: graph, Tb, lines: [L1, L2, L3],
    gFocus: () => ({ pts: rowsF.map(r => 'r' + r), ptK: tr.k('p.fr'), ptCol: red ? 'wrong' : 'link' }),
    tFocus: () => ({ row: rowsF.length === 1 ? rowsF[0]! : null, rowK: tr.k('p.fr'), rowCol: 'wrong', wrongQ: red ? [2] : [] }),
    extra: c => { const ks = tr.k('p.strike'); if (ks > 0) { const b = partOf(L2, 'w'); strike(c, b.x0 - 10, b.y1 + 4, b.x1 + 10, b.y0 - 4, ks, { col: 'wrong' }); } },
  });
  tr.set('p.axes', 1, 0.8); A_ROWS.forEach((_, i) => tr.set(`p.pt:r${i}`, 1, 0.7, 0.5 + i * 0.3));
  tr.set('p.t.head', 1, 0.6, 0.3); A_ROWS.forEach((_, i) => tr.set(`p.t.row:${i}`, 1, 0.7, 0.5 + i * 0.3));
  tr.set('p.L1', 1, 0.6, 1.2); tr.set('p.L2', 1, 0.8, 1.5);

  const CHIPS = [
    { t: '3 ÷ 1 = 3 and 6 ÷ 2 = 3.', fits: 0 },
    { t: 'Doubling 1 pound to 2 pounds doubled the price.', fits: -1, mc: 'mc.ratio-rate.zero-and-doubling-prove-proportionality', id: 'p.x-double' },
    { t: '10 ÷ 4 = 2.5.', fits: 1 },
    { t: 'Two of the three rows match, so it is mostly proportional.', fits: -1, mc: 'mc.ratio-rate.majority-matching-ratios-establishes-proportionality', id: 'p.x-most' },
    { t: 'One row that breaks the rule is enough to sink it.', fits: 2 },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
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
    const claimText = (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, '');
    ctx.store.log({ part: 'prove', subgoal: 'ratio-counterexample', item: `prove.claim${filled + 1}`, prompt: claimText, response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbLine(false, ch.id ?? 'p.x-other')); return; }
    used.add(i); filled++; drawChain(); fbHost.replaceChildren();
    const n = filled;
    talk(`p.c${n}`);
    seq(async alive => {
      if (n === 1) {
        rowsF = [0, 1]; tr.set('p.fr', 1, 0.4);
        tr.set('p.ray:r0', 1, 0.9); tr.set('p.t.q:0', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return;
        tr.set('p.ray:r1', 1, 0.9); tr.set('p.t.q:1', 1, 0.6, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('p.fr', 0, 0.5);
      }
      if (n === 2) {
        red = true; rowsF = [2]; tr.set('p.fr', 1, 0.4);
        tr.set('p.ray:r2', 1, 1.0); tr.set('p.t.q:2', 1, 0.6, 0.5); await wait(1.8); if (!alive()) return;
        tr.set('p.L3', 1, 0.9); await wait(1.0); if (!alive()) return;
      }
      if (n === 3) {
        tr.set('p.fr', 0, 0.4);
        tr.set('p.strike', 1, 0.7); await wait(1.0); if (!alive()) return;
        chipBox.remove();
        talk('p.done');
        fbHost.replaceChildren(feedback(true, SCRIPT['p.done']!), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const proofHost = h('div'), verdict = h('div', { class: 'row' });
  const yes = btn('Riley is right', () => judge(true)), no = btn('Riley is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', subgoal: 'ratio-counterexample', item: 'prove.judge', prompt: 'Riley: shop A is proportional (1 lb $3, 2 lb $6: double the pounds, double the price). Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? 'mc.ratio-rate.zero-and-doubling-prove-proportionality' : undefined });
    const id = right ? 'p.test' : 'p.prove';
    talk(id);
    proofHost.replaceChildren(P(id), chain, chipBox, fbHost);
    drawChain();
  }
  talk('p.intro');
  setPanel(h('h2', {}, 'Prove it'), P('p.intro'), verdict, proofHost);
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
/** draw a practice item: the graph (left) with its table on the board, a table alone, or the bare notation */
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as unknown as RatePicture | undefined;
  const gb = pic?.graph ? tryBlock(() => RateGraph(pic.graph!, MF, th)) : null;
  const G = gb && gb.ok ? gb.value : null;
  const tblParams = (t: NonNullable<RatePicture['table']>): RateTableParams => ({ cols: t.cols, rows: t.rows, money: t.money });
  const top = () => fit('x.T', item.board, BOARD.y0 + 80, 80, undefined, undefined, 48);
  const reveal = (Tb: RateTableBlock | null, n: number) => { if (!Tb) return; tr.set('x.t.head', 1, 0.5); for (let i = 0; i < n; i++) tr.set(`x.t.row:${i}`, 1, 0.6, 0.15 * i); };
  const solLines = (y: number) => (pic?.lines ?? []).map((src, i) => fit('x.S' + i, src, y + i * 115, 76, undefined, 'link'));
  // rows / points that break the pattern turn red only in the worked solution, after the kid has answered
  let solving = false;
  const breaks = pic?.breaks ?? [];
  const gFocus = (): GraphFocus => (solving ? { wrong: breaks } : {});
  const tFocus = (): TableFocus => (solving ? { wrongQ: breaks.map(b => Number(b.slice(1))) } : {});
  const solveSteps = (Tb: RateTableBlock | null, lines: Line[]) => async (alive: () => boolean) => {
    solving = true;
    tr.set('x.T:dim', 1, 0.5);
    const rows = pic?.table?.rows.length ?? 0;
    for (const s of pic?.solve ?? []) { tr.set('x.' + s, 1, 0.8); await wait(0.45); if (!alive()) return; }
    if (Tb && !pic?.table?.showQ) for (let i = 0; i < rows; i++) { tr.set(`x.t.q:${i}`, 1, 0.6); await wait(0.45); if (!alive()) return; }
    for (const L of lines) { tr.set(L.key, 1, 0.9); await wait(0.8); if (!alive()) return; }
  };
  if (G) {
    const tb = pic?.table ? tryBlock(() => RateTable(tblParams(pic.table!), TX, BOARD.y0 + 160, TW, th)) : null;
    const Tb = tb && tb.ok ? tb.value : null;
    const lines = solLines((Tb ? Tb.where.bottom : BOARD.y0 + 160) + 110);
    setG({ pre: 'x.', G, Tb, lines: [top(), ...lines], gFocus, tFocus });
    for (const s of pic!.show) tr.set('x.' + s, 1, 0.8, 0.1);
    reveal(Tb, pic?.table?.rows.length ?? 0);
    if (Tb && pic?.table?.showQ) pic.table.rows.forEach((_, i) => tr.set(`x.t.q:${i}`, 1, 0.6));
    tr.set('x.T', 1, 0.8, 0.4);
    return { solve: solveSteps(Tb, lines) };
  }
  if (pic?.table) {
    // a table alone: big on a slate in the model area; the board keeps the notation
    const X0 = 110, X1 = 990, Y0 = 200;
    const tb = tryBlock(() => RateTable({ ...tblParams(pic.table!), size: 80 }, X0 + 50, Y0 + 50, X1 - X0 - 100, th));
    const Tb = tb.ok ? tb.value : null;
    const S = box(X0, Y0, X1, Math.max(Y0 + 360, (Tb ? Tb.where.bottom : Y0 + 300) + 60));
    const lines = solLines(BOARD.y0 + 250);
    setG({ pre: 'x.', G: null, Tb, lines: [top(), ...lines], model: c => slate(c, S), tFocus });
    reveal(Tb, pic.table.rows.length);
    tr.set('x.T', 1, 0.8, 0.3);
    return { solve: solveSteps(Tb, lines) };
  }
  const big = box(300, 260, 1620, 760);
  setG({ pre: 'x.', G: null, Tb: null, lines: [bigLine('x.T', item.board, big, 110)], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{dollars per pound gallon proportional Riley says none}', '\\tfrac{\\text{dollars}}{\\text{pound}}', '\\ne'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
