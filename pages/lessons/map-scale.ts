// map-scale.ts: "Use a map scale (1 in = 1 mi, i.e. 1:63,360; 1:24,000)" (grade 7, 7.G.A.1) on the lesson runtime.
//   1 The question   an Alaska map at 1 : 63,360: the trailhead-to-lake line is 2.5 in; how far on the ground?
//                    3 cards (2.5 mi; 158,400 ft = inches called feet; 30 mi = the ÷ 12 skipped) + how sure
//   2 Worked example the map card over aligned number lines (map in / ground in / ground mi): read the scale (same
//                    unit), multiply (158,400 in), pick a sensible unit (÷ 12, ÷ 5,280 = 2.5 mi), see the shortcut
//                    (63,360 in = 1 mi, so 1 : 63,360 is 1 in = 1 mi); one "why?" with 3 reasons
//   3 Your turn      a 1 : 24,000 topo map, 3.5 in, faded: the kid multiplies, converts to feet, sizes it against a mile
//   4 Prove it       Jo divides FEET by 24,000 (0.25 in): a because-chain from reason chips; the lines back each claim
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/map-scale/voice/lines.json. Every answer is logged (runtime/store.ts).
import type { Canvas } from '../../src/core/draw';
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, bigLine, type Line, line, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Bar, MAPF, MapLines, type MapLinesBlock, Range, Ruler, Strips } from '../../src/lesson/topics/map-scale/MapSheet';
import { ALASKA, JO, TOPO } from '../../src/lesson/topics/map-scale/lessonPics';
import { FAMILY_NAMES, GENERATORS, MC, type MSItem } from '../../src/lesson/topics/map-scale/items';
import { PLAN } from '../../src/lesson/topics/map-scale/plan';
import type { LinesFocus } from '../../src/lesson/topics/scale-calculations/ScaleLines';
import LINES from './map-scale/voice/lines.json';

const SLUG = 'map-scale';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML shown is the line's text with colour marks; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }
const Y = (k: number) => BOARD.y0 + k;
const TAGS: Record<string, { col: Paint }> = { a: { col: 'first' }, b: { col: 'second' }, c: { col: 'link' }, w: { col: 'wrong' }, p: { col: 'pick' } };

// ===================== the board =====================
/** board lines stacked from y0 down by their real ink height; a line too wide even at 60 px is split before its last
 *  ' = ' (or another separator) */
function stack(key: string, srcs: string[], y0: number, size: number, gap = 30, col?: Paint): { lines: Line[]; y: number } {
  const SEPS = [' = ', ' \\approx ', '\\ \\text{at}\\ ', '\\ \\text{and}\\ ', '\\ \\text{vs}\\ ', ' \\to ', '\\ \\text{on }'];
  const fit = (s: string): string[] => {
    if (texWidth(tex(s) as Formula, 60) <= BOARD_W) return [s];
    for (const sep of SEPS) {
      const i = s.lastIndexOf(sep);
      if (i > 0) return [...fit(s.slice(0, i)), s.slice(i + (sep === ' = ' ? 1 : 0)).trim()];
    }
    return [s];
  };
  const lines: Line[] = [];
  let y = y0;
  for (const src of srcs.flatMap(fit)) {
    const L = line(key, src, 0, size, TAGS, col);
    const b = texBox(L.F, L.x, 0, { size: L.size, align: 'left' });
    L.y = y - b.y0;
    lines.push(L); y += b.h + gap;
  }
  return { lines, y };
}
function mapScene(pre: string, P: MapLinesBlock | null, lines: Line[], focus?: () => LinesFocus, extra?: (c: Canvas) => void): void {
  setScene({ table: 1080, model: c => { if (P) P.draw(c, progressOf<string>(s => tr.k(pre + s)), focus?.()); }, lines, leads: [], extra });
}
const ts = (k: string, v: number, d = 0.9, del = 0) => tr.set(k, v, d, del);
/** strike a stack of board lines (Jo's claim) */
function strikeLines(c: Canvas, Ls: Line[], k: number): void {
  if (k <= 0 || !Ls.length) return;
  const bs = Ls.map(L => texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }));
  const x0 = Math.min(...bs.map(b => b.x0)) - 10, x1 = Math.max(...bs.map(b => b.x1)) + 10;
  const y0 = bs[bs.length - 1]!.y1 - 4, y1 = bs[0]!.y0 + 4;
  strike(c, x0, y0, x1, y1, k, { col: 'wrong' });
}

// ===================== 1. The question =====================
const CARDS = [
  { t: '158,400 ft', v: '158,400 ft', id: MC.mixedUnits, why: 'q.cb.ft' },
  { t: '2.5 mi', v: '2.5 mi', id: '', why: 'q.cb.right' },
  { t: '30 mi', v: '30 mi', id: MC.omitMiddle, why: 'q.cb.thirty' },
];
function partQuestion(): void {
  tr.reset('q.');
  const P = MapLines(ALASKA, MAPF);
  const B = stack('q.T', ['1 : 63{,}360', '\\text{map: } \\cssId{a}{2.5\\text{ in}}', '\\text{ground: } \\,?'], Y(70), 80, 44);
  mapScene('q.', P, B.lines);
  ts('q.map', 1, 0.9); ts('q.seg', 1, 1.4, 0.8); ts('q.lines', 1, 1.2, 1.8); ts('q.ref', 1, 0.8, 2.6); ts('q.given', 1, 0.9, 3.0); ts('q.T', 1, 1.0, 1.4);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A 1 : 63,360 map: the line is 2.5 in. How far on the ground?', board: '1 : 63,360', response: c.v, expected: '2.5 mi', correct: c.id === '', mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t.split(' ')[0]}<small>${cd.t.split(' ')[1]}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'A map of Alaska'),
    voiced('q.intro', 'This USGS map of Alaska is marked <b>1&#8202;:&#8202;63,360</b>. The straight line from the trailhead to the lake is <b class="a">2.5 in</b> long on the map. How far is it on the ground? Pick an answer, and say how sure you are.'),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example: 1 : 63,360 =====================
function exampleBoard(pre: string): Record<string, Line[]> {
  const S = 70;
  let y = Y(50);
  const blk = (k: string, srcs: string[], gapAfter = 44) => { const r = stack(pre + k, srcs, y, S, 24); y = r.y + gapAfter - 24; return r.lines; };
  return {
    B0: blk('B0', ['1 : 63{,}360', '\\cssId{a}{1\\text{ in}} \\to \\cssId{b}{63{,}360\\text{ in}}']),
    B1: blk('B1', ['\\cssId{a}{2.5} \\times 63{,}360', '= \\cssId{b}{158{,}400\\text{ in}}']),
    B2: blk('B2', ['\\div 12:\\ 13{,}200\\text{ ft}', '\\div 5{,}280:\\ \\cssId{c}{2.5\\text{ mi}}']),
    B3: blk('B3', ['63{,}360\\text{ in} = 1\\text{ mi}', '\\cssId{a}{1\\text{ in}} \\to \\cssId{c}{1\\text{ mi}}']),
  };
}
function partExample(): void {
  tr.reset('e.');
  const P = MapLines(ALASKA, MAPF);
  const Bd = exampleBoard('e.');
  mapScene('e.', P, [...Bd.B0!, ...Bd.B1!, ...Bd.B2!, ...Bd.B3!], () => ({ ref: tr.k('e.glow') }));
  tr.jump('e.map', 1); tr.jump('e.seg', 1); tr.jump('e.lines', 1);
  let step = 0;
  const STEPS = [
    { t: 'Read the scale', why: 'No units: the same unit on both sides.', act: 'Read it' },
    { t: 'Multiply', why: 'Every map inch stands for 63,360 inches.', act: 'Multiply' },
    { t: 'Pick a sensible unit', why: 'Inches to feet to miles.', act: 'Convert' },
    { t: 'See the shortcut', why: 'What is 63,360 inches?', act: 'Show me' },
  ];
  const SAY = [
    '1&#8202;:&#8202;63,360 has no units, so both sides use the <b>same</b> unit. Measure in inches: <b class="a">1 in</b> on the map stands for <b class="b">63,360 in</b> on the ground.',
    'The line is <b class="a">2.5 in</b>, so the ground is 2.5 × 63,360 = <b class="b">158,400 in</b>. True, but who measures a trail in inches?',
    'Pick a unit that fits a trail. ÷ 12 gives 13,200 ft; ÷ 5,280 gives <b class="s">2.5 mi</b>.',
    'Look: 2.5 in on the map, 2.5 mi on the ground. No accident: 5,280 × 12 = 63,360, so 63,360 in is <b>exactly 1 mile</b>. 1&#8202;:&#8202;63,360 is the same as 1 in = 1 mi.',
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
        ts('e.ref', 1, 0.8); ts('e.glow', 1, 0.5, 0.3); await wait(1.2); if (!alive()) return;
        ts('e.B0', 1, 1.0); await wait(1.4); if (!alive()) return; ts('e.glow', 0, 0.6);
      } else if (i === 1) {
        ts('e.B0:dim', 1, 0.5);
        ts('e.given', 1, 0.9); await wait(1.0); if (!alive()) return;
        ts('e.drop', P.where.dropVia, 1.3); await wait(1.4); if (!alive()) return;
        ts('e.via', 1, 0.8); ts('e.nums', 1, 0.8, 0.4); await wait(1.0); if (!alive()) return;
        ts('e.B1', 1, 1.0); await wait(1.3);
      } else if (i === 2) {
        ts('e.B1:dim', 1, 0.5);
        ts('e.alt', 1, 1.2); await wait(1.3); if (!alive()) return;
        ts('e.drop', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.ask', 1, 0.5); ts('e.answer', 1, 0.9, 0.4); await wait(1.0); if (!alive()) return;
        ts('e.B2', 1, 1.2); await wait(1.5);
      } else {
        ts('e.B2:dim', 1, 0.5);
        ts('e.glow', 1, 0.5); await wait(0.8); if (!alive()) return;
        ts('e.B3', 1, 1.2); await wait(1.6); if (!alive()) return; ts('e.glow', 0, 0.8);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'A mile is 5,280 ft × 12 = 63,360 inches.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. A mile is 63,360 inches, and the scale pairs inches with inches.' },
      { t: 'A mile is 63,360 feet.', ok: false, id: 'e.why.ft', mc: MC.mixedUnits as string | undefined, say: 'A mile is 5,280 feet. The 63,360 are inches, the same unit as the map inch.' },
      { t: 'It works only because maps are measured in centimeters.', ok: false, id: 'e.why.cm', mc: MC.cmOnly as string | undefined, say: 'Ratio scales work in any unit. Here: inches on the map, inches on the ground.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is 1 : 63,360 the same as 1 in = 1 mi?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why is 1&#8202;:&#8202;63,360 the same as 1 in = 1 mi?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the map and the lines move first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 1 : 24,000, 3.5 in =====================
function partTurn(): void {
  tr.reset('t.');
  const P = MapLines(TOPO, MAPF);
  let y = Y(50);
  const blk = (k: string, srcs: string[]) => { const r = stack('t.' + k, srcs, y, 70, 24); y = r.y + 20; return r.lines; };
  const B0 = blk('B0', ['1 : 24{,}000', '\\cssId{a}{1\\text{ in}} \\to \\cssId{b}{24{,}000\\text{ in}}']);
  const B1 = blk('B1', ['\\cssId{a}{3.5} \\times 24{,}000', '= \\cssId{b}{84{,}000\\text{ in}}']);
  const B2 = blk('B2', ['\\div 12:\\ \\cssId{c}{7{,}000\\text{ ft}}']);
  const B3 = blk('B3', ['7{,}000\\text{ ft} > 5{,}280\\text{ ft}', '\\approx 1.3\\text{ mi}']);
  mapScene('t.', P, [...B0, ...B1, ...B2, ...B3], () => ({ quietRow: tr.k('t.answer') > 0.5 ? undefined : 2 }));
  ts('t.map', 1, 0.9); ts('t.seg', 1, 1.3, 0.7); ts('t.lines', 1, 1.2, 1.6); ts('t.ref', 1, 0.8, 2.4); ts('t.B0', 1, 1.0, 2.6); ts('t.given', 1, 0.9, 3.2);
  let step = 1;
  const STEPS = [
    { t: 'Read the scale', why: 'Done: 1 in → 24,000 in.' },
    { t: 'Multiply', why: 'Your step.' },
    { t: 'Pick a sensible unit', why: 'Your step.' },
    { t: 'Size it up', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: a topo map'), voiced('t.intro', 'Your turn. A USGS topo map is <b>1&#8202;:&#8202;24,000</b>. From the parking lot to the summit is <b class="a">3.5 in</b> on the map. Step one is done for you.'), plan, work);
  /** a number step: logs every try with its misconception, voices the feedback */
  function numStep(o: { id: string; prompt: string; unit: string; ans: number; item: string; logPrompt: string; wrongs: { hit: (v: number) => boolean; id: string; mc?: string; say: string }[]; miss: { id: string; say: string }; ok: { id: string; say: string }; done: () => void }): void {
    const fbHost = h('div'), inp = numInput(o.unit, () => check()), okBtn = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.empty', false, 'Type a number first.')); return; }
      const right = Math.abs(r.v - o.ans) < 1e-6;
      const w = right ? undefined : o.wrongs.find(x => x.hit(r.v));
      ctx.store.log({ part: 'turn', item: o.item, prompt: o.logPrompt, response: r.v, expected: o.ans, correct: right, mc: w?.mc });
      if (!right) { fbHost.replaceChildren(w ? voicedFb(w.id, false, w.say) : voicedFb(o.miss.id, false, o.miss.say)); return; }
      okBtn.disabled = true;
      fbHost.replaceChildren(voicedFb(o.ok.id, true, o.ok.say));
      o.done();
    }
    work.replaceChildren(voiced(o.id, o.prompt), inp.node, h('div', { class: 'row' }, okBtn), fbHost);
    inp.focus();
  }
  const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;
  seq(async alive => {
    await wait(3.6); if (!alive()) return;
    askMul();
  });
  function askMul(): void {
    numStep({
      id: 't.mul', prompt: '3.5 × 24,000 = how many inches? Tip: 3.5 × 24 first, then × 1,000.', unit: 'in', ans: 84000, item: 'turn.multiply', logPrompt: '3.5 in at 1 : 24,000: how many inches on the ground?',
      wrongs: [
        { hit: v => near(v, 72000), id: 't.mul.whole', mc: MC.wholePart, say: '72,000 is 3 × 24,000. The half inch counts too: half of 24,000 more.' },
        { hit: v => near(v, 8400) || near(v, 840000) || near(v, 840), id: 't.mul.pow', mc: 'mc.place-value.recombines-coefficient-with-wrong-scale', say: 'Check the size: 3 × 24,000 = 72,000 and 4 × 24,000 = 96,000. The answer is between.' },
      ],
      miss: { id: 't.mul.no', say: 'Split it: 3.5 × 24 = 84, then × 1,000.' },
      ok: { id: 't.mul.ok', say: 'Yes: 3.5 × 24 = 84, and 84 × 1,000 = <b class="b">84,000 in</b>.' },
      done: () => seq(async alive => {
        ts('t.B0:dim', 1, 0.5);
        ts('t.drop', P.where.dropVia, 1.3); await wait(1.4); if (!alive()) return;
        ts('t.via', 1, 0.8); ts('t.nums', 1, 0.8, 0.3); ts('t.B1', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        step = 2; drawPlan(); askFt();
      }),
    });
  }
  function askFt(): void {
    numStep({
      id: 't.ft', prompt: '84,000 inches is hard to picture. How many feet is that?', unit: 'ft', ans: 7000, item: 'turn.feet', logPrompt: '84,000 in = ? ft',
      wrongs: [
        { hit: v => near(v, 84000), id: 't.ft.same', mc: MC.relabel, say: 'That is still inches. 12 in make 1 ft: divide by 12.' },
        { hit: v => near(v, 1008000), id: 't.ft.times', mc: MC.reversed, say: 'Feet are bigger than inches, so there are fewer of them: divide.' },
        { hit: v => near(v, 84000 / 5280, 0.06), id: 't.ft.mi', mc: MC.omitMiddle, say: 'That divides by 5,280, as if the inches were feet. Inches → feet first: ÷ 12.' },
      ],
      miss: { id: 't.ft.no', say: '84,000 ÷ 12 = ?' },
      ok: { id: 't.ft.ok', say: 'Yes: 84,000 ÷ 12 = <b class="s">7,000 ft</b>. (Printed on every USGS topo map: 1 in = 2,000 ft.)' },
      done: () => seq(async alive => {
        ts('t.B1:dim', 1, 0.5);
        ts('t.alt', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.drop', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('t.ask', 1, 0.5); ts('t.answer', 1, 0.9, 0.3); ts('t.B2', 1, 1.0, 0.5); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); askSize();
      }),
    });
  }
  function askSize(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'A bit more than a mile, about 1.3 mi', ok: true, id: 't.size.ok', mc: undefined as string | undefined, say: 'Yes: 7,000 ÷ 5,280 ≈ 1.3 mi. Feet or miles both work; miles are easier to picture.' },
      { t: 'About 16 miles', ok: false, id: 't.size.sixteen', mc: MC.omitMiddle as string | undefined, say: '16 comes from 84,000 ÷ 5,280: inches treated as feet. 7,000 ft is just over a mile.' },
      { t: 'Less than half a mile', ok: false, id: 't.size.half', mc: undefined, say: 'Half a mile is 2,640 ft. 7,000 ft is more than a whole mile.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.size', prompt: '7,000 ft compared with a mile (5,280 ft)', response: o.t, expected: opts[0]!.t, correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) return;
      done = true;
      seq(async alive => { ts('t.B2:dim', 1, 0.5); ts('t.B3', 1, 1.0); await wait(1.3); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); });
    })));
    work.replaceChildren(voiced('t.size', 'Is 7,000 ft a short walk or a long hike? A mile is 5,280 ft.'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked 2.5 mi, and you were right. Now you can show why: 63,360 inches make a mile.',
      'q.cb.ft': 'At the start you picked 158,400 ft. Those were inches: 1&#8202;:&#8202;63,360 pairs inches with inches.',
      'q.cb.thirty': 'At the start you picked 30 mi. That skipped inches to feet: ÷ 12 first, then ÷ 5,280.',
      'q.cb.none': 'Same unit on both sides, multiply, then pick a unit that fits. That works for every 1&#8202;:&#8202;n map.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jo divides feet by 24,000 =====================
function partProve(): void {
  tr.reset('p.');
  const P = MapLines(JO, MAPF);
  const J = stack('p.J', ['\\text{Jo: } 6{,}000 \\div 24{,}000', '= \\cssId{w}{0.25\\text{ in}}'], Y(50), 70, 24, 'dim');
  let y = J.y + 40;
  const blk = (k: string, srcs: string[]) => { const r = stack('p.' + k, srcs, y, 70, 24); y = r.y + 20; return r.lines; };
  const B1 = blk('B1', ['\\cssId{b}{6{,}000\\text{ ft}} \\times 12', '= \\cssId{b}{72{,}000\\text{ in}}']);
  const B2 = blk('B2', ['72{,}000 \\div 24{,}000', '= \\cssId{c}{3\\text{ in}}']);
  mapScene('p.', P, [...J.lines, ...B1, ...B2], undefined, c => strikeLines(c, J.lines, tr.k('p.jstrike')));
  ts('p.map', 1, 0.9); ts('p.lines', 1, 1.2, 0.6); ts('p.alt', 1, 1.0, 1.2); ts('p.ref', 1, 0.8, 1.6); ts('p.nums', 1, 0.8, 1.9);
  ts('p.given', 1, 0.9, 2.3); ts('p.J', 1, 1.0, 2.8); ts('p.wrong', 1, 0.8, 3.4);
  const CHIPS = [
    { t: 'Jo divided feet by 24,000, but 1 : 24,000 pairs inches with inches.', fits: 0 },
    { t: '12 in make 1 ft, so 6,000 × 12.', fits: 1 },
    { t: 'Every 24,000 in of ground is 1 in of map.', fits: 2 },
    { t: 'To go from the ground to the map, you multiply by 24,000.', fits: -1, mc: MC.wrongOp, id: 'p.no.times', say: 'Multiplying makes it 24,000 times longer than the real trail. Ground to map shrinks: divide.' },
    { t: 'Units don’t matter in a ratio scale, so dividing feet is fine.', fits: -1, mc: MC.notConverted, id: 'p.no.units', say: 'They matter: 1&#8202;:&#8202;24,000 means inches with inches. The feet must become inches first.' },
  ];
  const CLAIMS = [
    'Jo’s <b>0.25 in</b> is too short,',
    'On the ground, <b>6,000 ft = 72,000 in</b>,',
    'So on the map the trail is <b class="s">3 in</b>,',
  ];
  const SAYC = [
    'Right. Jo mixed units: feet on the ground, inches on the map.',
    'Right. 6,000 × 12 = 72,000 in.',
    'Right. 72,000 ÷ 24,000 = 3 in. Jo’s line was 12 times too short.',
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
      if (n === 1) { ts('p.strike', 1, 0.6); ts('p.jstrike', 1, 0.6, 0.3); await wait(1.0); if (!alive()) return; ts('p.J:dim', 1, 0.5); }
      if (n === 2) { ts('p.drop', P.where.dropVia, 1.3); await wait(1.4); if (!alive()) return; ts('p.via', 1, 0.8); ts('p.B1', 1, 1.0, 0.3); }
      if (n === 3) {
        ts('p.B1:dim', 1, 0.5); ts('p.drop', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('p.ask', 1, 0.5); ts('p.answer', 1, 0.9, 0.3); ts('p.seg', 1, 1.4, 0.6); ts('p.B2', 1, 1.0, 0.8); await wait(2.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason, and the lines back every one. Change the ground to the map’s unit first, then divide.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jo is right', () => judge(true)), no = btn('Jo is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jo: a 6,000 ft trail at 1 : 24,000 is 6,000 ÷ 24,000 = 0.25 in on the map. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.notConverted : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', 'Jo puts a straight <b class="b">6,000 ft</b> trail on the <b>1&#8202;:&#8202;24,000</b> map: “6,000 ÷ 24,000 = 0.25, so it is <b class="a">0.25 in</b> long.” Is Jo right?'),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as MSItem),
  });
}
function showItem(item: MSItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture?.pic;
  type Drawable = { draw(c: Canvas, pr: { k(s: string): number }, f?: LinesFocus): void };
  const made = pic ? tryBlock((): Drawable => {
    if (pic.kind === 'lines') return MapLines(pic.p, MAPF);
    if (pic.kind === 'ruler') return Ruler(pic.p, MAPF) as unknown as Drawable;
    if (pic.kind === 'bar') return Bar(pic.p, MAPF) as unknown as Drawable;
    if (pic.kind === 'strips') return Strips(pic.p, MAPF) as unknown as Drawable;
    return Range(pic.p, MAPF) as unknown as Drawable;
  }) : null;
  if (pic && made && made.ok) {
    const M = made.value;
    const T = stack('x.T', [item.board], Y(60), 76);
    const W = stack('x.W', item.work ?? [], T.y + 40, 66);
    const quiet = pic.kind === 'lines' ? pic.quiet : undefined;
    setScene({ table: 1080, model: c => M.draw(c, progressOf<string>(s => tr.k('x.' + s)), { quietRow: tr.k('x.answer') > 0.5 ? undefined : quiet }), lines: [...T.lines, ...W.lines], leads: [] });
    pic.show.forEach((s, i) => ts('x.' + s, 1, s === 'seg' || s === 'lines' ? 1.0 : 0.7, 0.1 + i * 0.22));
    ts('x.T', 1, 0.8, 0.3);
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        for (const s of pic.solve) {
          const long = s === 'drop' || s === 'seg' || s === 'band';
          ts('x.' + s, 1, long ? 1.3 : 0.8); await wait(long ? 1.4 : 0.9); if (!alive()) return;
        }
        if (W.lines.length) ts('x.W', 1, 1.0);
      },
    };
  }
  if (pic && made && !made.ok) console.warn('map-scale: picture skipped:', made.error);
  // no picture: the board line big on a wide slate, the worked lines under it after a miss
  const big = box(300, 200, 1620, 600);
  const BL = bigLine('x.T', item.board, big, 110);
  BL.tags = TAGS;
  const BW = item.work?.length ? bigLine('x.W', item.work.join(',\\quad '), box(300, 640, 1620, 900), 90) : null;
  if (BW) BW.tags = TAGS;
  setScene({ table: 1080, lines: BW ? [BL, BW] : [BL], leads: [], boardBox: box(300, 160, 1620, 940) });
  ts('x.T', 1, 0.8, 0.1);
  return { solve: async () => { if (BW) ts('x.W', 1, 1.0); } };
}

void runLesson({
  slug: SLUG,
  warm: ['1 : 63{,}360', '\\cssId{a}{1\\text{ in}} \\to \\cssId{b}{63{,}360\\text{ in}}', '2\\tfrac{3}{4}\\text{ in}', '\\div 12:\\ 13{,}200\\text{ ft}', '\\xrightarrow{\\times 2}', '\\overset{?}{=}', '\\approx 1.3 \\pm 0.05', '\\begin{array}{c|c} 1 & 3 \\\\ \\hline 2 & 6 \\end{array}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
