// reading-maps.ts: "Read a map: map key, scale, and estimating distance" (grade 7, 7.G.A.1) on the lesson runtime.
//   1 The question   Maya bikes Millbrook -> Lake Camp by road: 3 cards (14 mi; 10 mi = the straight line;
//                    7 mi = counts the bar intervals as miles) + how sure
//   2 Worked example four subgoal steps on one calm map: find the places with the key (measure from the centers),
//                    read the scale bar as a number line (1 in -> 2 mi), lay copies of an interval along the road
//                    (4 + 3 intervals = 14 mi), the straight line across the lake (5 intervals = 10 mi); one "why?"
//   3 Your turn      Lake Camp -> Pinecrest, faded from the end: places and bar given; the kid counts 3 1/2 intervals
//                    along the road (7 mi), then picks the straight-line distance (5 mi)
//   4 Prove it       Sam reads the bar's end (6) as one interval: the trail is 5 1/2 x 6 = 33 mi. Because-chain from
//                    reason chips (distractors = catalogue misconceptions); the map backs each line
//   5 Practice       all 18 sub-goals one after another, then mixed (runtime/practice.ts), a map picture on every item
// Panel lines: src/lesson/topics/reading-maps/script.ts; spoken text: reading-maps/voice/lines.json.
import { type Canvas, strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, BOARD_W, bigLine, type Line, line, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type MapBlock, type MapFocus, type MapStep, MAP_STEPS, MapSheet } from '../../src/lesson/topics/reading-maps/MapSheet';
import { drawEvidence, drawNumberLine } from '../../src/lesson/topics/reading-maps/Evidence';
import { lessonMap } from '../../src/lesson/topics/reading-maps/lessonMap';
import { FAMILY_NAMES, GENERATORS, MC, type RmItem } from '../../src/lesson/topics/reading-maps/items';
import { PLAN } from '../../src/lesson/topics/reading-maps/plan';
import { explain } from '../../src/lesson/topics/reading-maps/explain';
import { SCRIPT } from '../../src/lesson/topics/reading-maps/script';

const SLUG = 'reading-maps';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line */
const say = (id: string, cls = ''): HTMLElement => { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); };
const fbk = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
const plain = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&#8202;/g, ' ');
const TAGS = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, p: { col: 'pick' as const }, w: { col: 'wrong' as const } };
/** a board line; text-heavy lines get a little safety room (MathJax text metrics) */
const L = (key: string, src: string, y: number, size = 66): Line => {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) * 1.1 > BOARD_W) s -= 2;
  return line(key, src, y, s, TAGS);
};

// ===================== the map scene =====================
function mapScene(pre: string, M: MapBlock, lines: Line[], extra?: (c: Canvas) => void, focus?: () => MapFocus): void {
  const P = progressOf<MapStep>(s => tr.k(pre + 'm.' + s));
  setScene({ table: 1080, model: c => M.draw(c, P, id => tr.k(pre + 'o.' + id), focus?.()), lines, leads: [], extra });
}
/** paint the sheet in: paper, land, roads, places, key, bar */
function buildMap(pre: string, delay = 0, fast = false): void {
  MAP_STEPS.forEach((s, i) => (fast ? tr.jump(pre + 'm.' + s, 1) : tr.set(pre + 'm.' + s, 1, 0.7, delay + i * 0.32)));
}
const ov = (pre: string, id: string, v = 1, d = 0.9, del = 0) => tr.set(pre + 'o.' + id, v, d, del);
/** strike a board line through its ink box */
function strikeLine(c: Canvas, Ln: Line, k: number): void {
  if (k <= 0) return;
  const b = texBox(Ln.F, Ln.x, Ln.y, { size: Ln.size, align: 'left' });
  strike(c, b.x0 - 10, b.cy + 6, b.x1 + 10, b.cy - 6, k, { col: 'wrong' });
}

// ===================== 1. The question =====================
const CARDS = [
  { v: 10, mc: MC.straight as string | undefined, why: 'q.cb.straight' },
  { v: 14, mc: undefined as string | undefined, why: 'q.cb.right' },
  { v: 7, mc: MC.subdiv as string | undefined, why: 'q.cb.count' },
];
function partQuestion(): void {
  tr.reset('q.');
  const M = MapSheet(lessonMap('q'), th);
  mapScene('q.', M, [L('q.L0', '\\text{to Lake Camp}', 200), L('q.L1', '\\text{by road} = \\,?\\text{ mi}', 330, 72)]);
  buildMap('q.');
  ov('q.', 'route', 1, 1.8, 2.3); tr.set('q.L0', 1, 1.0, 2.6); tr.set('q.L1', 1, 0.8, 3.3);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: plain(SCRIPT['q.intro']!), board: 'by road = ? mi', response: c.v, expected: 14, correct: c.v === 14, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}<small>miles</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A bike ride to camp'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const M = MapSheet(lessonMap('e'), th);
  const lines = [
    L('e.L0', '\\text{to Lake Camp}', 170),
    L('e.L1', '\\text{center} \\to \\text{center}', 285),
    L('e.L2', '\\cssId{a}{1\\text{ in}} \\to \\cssId{b}{2\\text{ mi}}', 400, 72),
    L('e.L3', '4 \\times 2 = \\cssId{b}{8\\text{ mi}}', 515, 72),
    L('e.L4', '3 \\times 2 = \\cssId{b}{6\\text{ mi}}', 615, 72),
    L('e.L5', '8 + 6 = \\cssId{s}{14\\text{ mi}}', 725, 72),
    L('e.L6', '\\text{line: } 5 \\times 2 = \\cssId{p}{10\\text{ mi}}', 865, 66),
  ];
  mapScene('e.', M, lines, undefined, () => ({ point: { MB: tr.k('e.pt'), LC: tr.k('e.pt') } }));
  buildMap('e.', 0, true); ov('e.', 'route', 0); tr.jump('e.L0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Find the places', why: 'Use the map key: which symbols, and where to measure from.', act: 'Find them' },
    { t: 'Read the scale bar', why: 'What does one interval represent?', act: 'Read the bar' },
    { t: 'Lay the bar along the road', why: 'Copies of one interval, part by part.', act: 'Lay it along' },
    { t: 'Road or straight line?', why: 'Compare with "as the crow flies".', act: 'Compare' },
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
        ov('e.', 'kTown', 1, 0.5); await wait(0.7); if (!alive()) return;
        ov('e.', 'rMB', 1, 0.5); tr.set('e.pt', 1, 0.5, 0.3); await wait(1.0); if (!alive()) return;
        ov('e.', 'kCamp', 1, 0.5); await wait(0.7); if (!alive()) return;
        ov('e.', 'rLC', 1, 0.5); await wait(0.9); if (!alive()) return;
        tr.set('e.L1', 1, 1.0); await wait(1.2); if (!alive()) return;
        for (const k of ['kTown', 'kCamp', 'rMB', 'rLC']) ov('e.', k, 0, 0.6);
      } else if (i === 1) {
        tr.set('e.pt', 0, 0.5);
        for (const k of ['i0', 'i1', 'i2']) { ov('e.', k, 1, 0.4); await wait(0.75); if (!alive()) return; ov('e.', k, 0.25, 0.4); }
        tr.set('e.L2', 1, 1.0); await wait(1.2); if (!alive()) return;
        for (const k of ['i0', 'i1', 'i2']) ov('e.', k, 0, 0.5);
      } else if (i === 2) {
        tr.set('e.L1:dim', 1, 0.5);
        ov('e.', 'route', 1, 1.4); await wait(1.5); if (!alive()) return;
        ov('e.', 'cp1', 1, 2.0); await wait(2.1); if (!alive()) return;
        tr.set('e.L3', 1, 0.9); ov('e.', 'leg1', 1, 0.6, 0.3); await wait(1.1); if (!alive()) return;
        ov('e.', 'cp2', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.L4', 1, 0.9); ov('e.', 'leg2', 1, 0.6, 0.3); await wait(1.1); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); await wait(1.1);
      } else {
        for (const k of ['L2', 'L3', 'L4']) tr.set('e.' + k + ':dim', 1, 0.5);
        ov('e.', 'str', 1, 1.3); await wait(1.4); if (!alive()) return;
        ov('e.', 'cpS', 1, 2.2); await wait(2.3); if (!alive()) return;
        tr.set('e.L6', 1, 1.0); ov('e.', 'legS', 1, 0.6, 0.3); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say(`e.step${i}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The road bends around the lake. A straight line is the shortest way between two places.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined },
      { t: 'The highway is drawn wider, so its inches count for more miles.', ok: false, id: 'e.why.wide', mc: MC.symbol as string | undefined },
      { t: 'Roads use a different scale than the straight line across the lake.', ok: false, id: 'e.why.scale', mc: MC.diffScale as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: plain(SCRIPT['e.why']!), response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!), bx, fbHost);
    void ctx.say('e.why');
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn (faded from the end) =====================
function partTurn(): void {
  tr.reset('t.');
  const M = MapSheet(lessonMap('t'), th);
  const lines = [
    L('t.L0', '\\text{to Pinecrest}', 170),
    L('t.L1', '\\cssId{a}{1\\text{ in}} \\to \\cssId{b}{2\\text{ mi}}', 290, 72),
    L('t.Q2', '\\text{by road} = \\,?\\text{ mi}', 420, 72),
    L('t.A2', '3\\tfrac{1}{2} \\times 2 = \\cssId{s}{7\\text{ mi}}', 420, 72),
    L('t.Q3', '\\text{line} = \\,?\\text{ mi}', 560, 72),
    L('t.A3', '2\\tfrac{1}{2} \\times 2 = \\cssId{p}{5\\text{ mi}}', 560, 72),
  ];
  mapScene('t.', M, lines, undefined, () => ({ point: { LC: tr.k('t.pt'), PC: tr.k('t.pt') } }));
  buildMap('t.', 0, true); tr.jump('t.L0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Find the places', why: 'Done for you.' },
    { t: 'Read the scale bar', why: 'Done for you: 1 in represents 2 mi.' },
    { t: 'Lay the bar along the road', why: 'Your step.' },
    { t: 'Road or straight line?', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: to Pinecrest'), say('t.intro'), plan, work);
  seq(async alive => {
    await wait(2.6); if (!alive()) return;
    ov('t.', 'kCamp', 1, 0.5); ov('t.', 'rLC', 1, 0.5, 0.3); ov('t.', 'kTown', 1, 0.5, 0.8); ov('t.', 'rPC', 1, 0.5, 1.1); tr.set('t.pt', 1, 0.5, 1.2);
    await wait(2.2); if (!alive()) return;
    for (const k of ['kCamp', 'rLC', 'kTown', 'rPC']) ov('t.', k, 0, 0.6);
    step = 1; drawPlan();
    for (const k of ['i0', 'i1', 'i2']) { ov('t.', k, 1, 0.35); await wait(0.55); if (!alive()) return; ov('t.', k, 0, 0.4); }
    tr.set('t.L1', 1, 0.9); await wait(1.0); if (!alive()) return;
    step = 2; drawPlan();
    tr.set('t.pt', 0, 0.5); ov('t.', 'route', 1, 1.3); await wait(1.4); if (!alive()) return;
    ov('t.', 'cp', 1, 2.0); tr.set('t.Q2', 1, 0.8, 0.6); await wait(2.1); if (!alive()) return;
    askRoad();
  });
  function askRoad(): void {
    const fbHost = h('div'), inp = numInput('miles', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbk(false, 't.empty')); return; }
      const v = r.v, right = v === 7;
      const mc = v === 8 || v === 6 ? MC.partial : v === 3.5 ? MC.subdiv : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.road', prompt: plain(SCRIPT['t.road']!), board: 'by road = ? mi', response: v, expected: 7, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbk(false, v === 8 ? 't.road.whole' : v === 6 ? 't.road.drop' : v === 3.5 ? 't.road.count' : 't.road.miss')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.road.ok'));
      seq(async alive => {
        tr.set('t.Q2', 0, 0.4); tr.set('t.A2', 1, 1.0, 0.3); ov('t.', 'leg', 1, 0.6, 0.6); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan();
        tr.set('t.L1:dim', 1, 0.5); ov('t.', 'str', 1, 1.2); await wait(1.3); if (!alive()) return;
        ov('t.', 'cpS', 1, 1.6); tr.set('t.Q3', 1, 0.8, 0.5); await wait(1.7); if (!alive()) return;
        askLine();
      });
    }
    work.replaceChildren(say('t.road'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askLine(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: '5 miles', ok: true, id: 't.line.ok', mc: undefined as string | undefined },
      { t: '7 miles', ok: false, id: 't.line.road', mc: undefined as string | undefined },
      { t: '2&#8202;½ miles', ok: false, id: 't.line.inch', mc: MC.subdiv as string | undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.line', prompt: plain(SCRIPT['t.line']!), board: 'line = ? mi', response: plain(o.t), expected: '5 miles', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.Q3', 0, 0.4); tr.set('t.A3', 1, 1.0, 0.3); ov('t.', 'legS', 1, 0.6, 0.6); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    })));
    work.replaceChildren(say('t.line'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.why : 'q.cb.none';
    void ctx.say(id);
    c.append(html('p', '', SCRIPT[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Sam reads the end of the bar as one interval =====================
function partProve(): void {
  tr.reset('p.');
  const M = MapSheet(lessonMap('p'), th);
  const S1 = L('p.S1', '1\\text{ interval} = 6\\text{ mi}', 160), S2 = L('p.S2', '5\\tfrac{1}{2} \\times 6 = 33\\text{ mi}', 265);
  S1.col = 'dim'; S2.col = 'dim';
  const lines = [S1, S2,
    L('p.P1', '1\\text{ interval} = \\cssId{b}{2\\text{ mi}}', 430, 72),
    L('p.P2', '\\text{trail} = 5\\tfrac{1}{2}\\text{ intervals}', 545, 72),
    L('p.P3', '5\\tfrac{1}{2} \\times 2 = \\cssId{s}{11\\text{ mi}}', 660, 72)];
  mapScene('p.', M, lines, c => { strikeLine(c, S1, tr.k('p.k1')); strikeLine(c, S2, tr.k('p.k2')); });
  buildMap('p.', 0, true);
  ov('p.', 'route', 1, 1.6, 0.6); tr.set('p.S1', 1, 0.9, 1.2); tr.set('p.S2', 1, 0.9, 1.9);
  const CHIPS = [
    { t: 'The bar is a number line: 0 to 2 is one interval, 2 to 4 the next.', fits: 0 },
    { t: 'Copies of one interval fit along the trail end to end, with half of one left over.', fits: 1 },
    { t: 'Every interval on one map represents the same distance.', fits: 2 },
    { t: 'The last number on the bar tells you what each interval is.', fits: -1, mc: MC.barTotal, id: 'p.no.total' },
    { t: 'Count the marks: 0, 2, 4 and 6 make 4 steps.', fits: -1, mc: MC.points, id: 'p.no.marks' },
  ];
  const CLAIMS = [
    'Each interval of the bar is <b class="b">2 miles</b>,',
    'The trail is <b>5&#8202;½ intervals</b> long,',
    'So the trail is 5&#8202;½ × 2 = <b class="s">11 miles</b>, not 33,',
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plain(CLAIMS[filled]!), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbk(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbk(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        for (const k of ['i0', 'i1', 'i2']) { ov('p.', k, 1, 0.4); await wait(0.7); if (!alive()) return; }
        tr.set('p.P1', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('p.k1', 1, 0.6); await wait(0.8); if (!alive()) return;
        for (const k of ['i0', 'i1', 'i2']) ov('p.', k, 0, 0.6);
        tr.set('p.S1:dim', 1, 0.5);
      }
      if (n === 2) { ov('p.', 'cp', 1, 2.6); await wait(2.7); if (!alive()) return; tr.set('p.P2', 1, 0.9); }
      if (n === 3) {
        tr.set('p.P3', 1, 1.0); ov('p.', 'tag', 1, 0.7, 0.4); await wait(1.3); if (!alive()) return;
        tr.set('p.k2', 1, 0.6); tr.set('p.S2:dim', 1, 0.5); await wait(0.9); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbk(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: plain(SCRIPT['p.intro']!), response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.barTotal : undefined });
    proofHost.replaceChildren(right ? say('p.test') : say('p.build'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as RmItem),
  });
}
/** board lines: a line too wide for the board even at 60 px is split before its last ' = ' */
function fitLines(key: string, src: string, y: number, size = 70, dy = 100): Line[] {
  const parts = (s: string): string[] => {
    if (texWidth(tex(s) as Formula, 60) <= BOARD_W) return [s];
    const i = s.lastIndexOf(' = ');
    return i > 0 ? [...parts(s.slice(0, i)), s.slice(i + 1)] : [s];
  };
  return parts(src).map((s, i) => L(key, s, y + i * dy, size));
}
function showItem(item: RmItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const lines: Line[] = [];
  let y = pic.ev ? 450 : 190;
  for (const [i, src] of [item.board, ...(pic.work ?? [])].entries()) { const ls = fitLines('x.b' + i, src, y); lines.push(...ls); y += 100 * ls.length + 10; }
  const ans = fitLines('x.ans', pic.answer, Math.max(y + 40, pic.ev ? 760 : 700));
  lines.push(...ans);
  let model: ((c: Canvas) => void) | null = null;
  if (pic.map) {
    const made = tryBlock(() => MapSheet(pic.map!, th));
    if (made.ok) {
      const M = made.value, P = progressOf<MapStep>(() => tr.k('x.m'));
      model = c => M.draw(c, P, id => tr.k('x.' + id), { zoom: tr.k('x.zoom') });
    }
  } else if (pic.line) {
    const LP = pic.line;
    model = c => drawNumberLine(c, LP, th, id => (id === 'card' || id.startsWith('pin') ? tr.k('x.a') : id === 'gap' ? tr.k('x.s0') : id === 'tol' ? tr.k('x.s1') : 0));
  }
  const ev = pic.ev;
  const extra = ev ? (c: Canvas) => { drawEvidence(c, ev, BOARD.cx, BOARD.y0 + 34, tr.k('x.ev')); } : undefined;
  if (!model) {
    const big = box(260, 230, 1660, 790);
    setScene({ table: 1080, lines: [bigLine('x.b0', item.board, big, 130)], leads: [], boardBox: big });
    tr.set('x.b0', 1, 0.8, 0.1);
    return {};
  }
  setScene({ table: 1080, model, lines, leads: [], extra });
  tr.set('x.m', 1, 0.9); tr.set('x.a', 1, 0.9, 0.6); tr.set('x.ev', 1, 0.6, 0.3);
  if (pic.map?.zoom) tr.set('x.zoom', 1, 1.8, 1.4);
  lines.filter(l => !l.key.startsWith('x.ans')).forEach((l, i) => tr.set(l.key, 1, 0.8, 0.4 + 0.3 * i));
  return {
    solve: async alive => {
      for (let i = 0; i < pic.steps; i++) { tr.set('x.s' + i, 1, 1.4); await wait(1.7); if (!alive()) return; }
      tr.set('x.ans', 1, 1.0);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 :,.?}', '\\tfrac{1}{2} \\times 2 = 14 \\to \\approx \\,? |x| < > \\Rightarrow \\div \\cdot'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
