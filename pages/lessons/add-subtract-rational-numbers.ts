// add-subtract-rational-numbers.ts: grade 7 (7.NS.A.1), on the shared lesson runtime. The model is a number line with
// directed moves; subtracting a number FLIPS its move (p - q = p + (-q)). The board sits on top, the line below it.
//   1 The question   a quiz score: 4 points, a -3 penalty is taken away: 4 - (-3) = ?  cards 1 / 7 / -7 + how sure
//   2 Worked example Draw -3 -> Flip it -> Land -> Check; picture first, notation beside; one "why?" with 3 reasons
//   3 Your turn      -2 - (-6), faded from the end: "Draw" is given, the kid flips, lands and picks the check
//   4 Prove it       Sam: "subtracting always makes a number smaller" -> always / sometimes / never, then a
//                    because-chain from reason chips (distractors = catalogue misconceptions)
//   5 Practice       all 19 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/add-subtract-rational-numbers/script.ts = voice/lines.json. Every answer is logged.
import { type Canvas, drawOn, dot, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { type Formula, tex, texBox, texDraw, texWidth } from '../../src/core/tex';
import { paint } from '../../src/core/theme';
import { type Line, bigLine, bump, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { type Item } from '../../src/lesson/runtime/item';
import { NumberLine, type NumberLineBlock, type NLFocus, type NLJump, type NLPoint, numTex } from '../../src/lesson/topics/add-subtract-rational-numbers/NumberLine';
import { CounterMat, type CounterMatBlock, type MatStep } from '../../src/lesson/topics/add-subtract-rational-numbers/CounterMat';
import { FAMILY_NAMES, GENS, type Pic } from '../../src/lesson/topics/add-subtract-rational-numbers/items';
import { PLAN } from '../../src/lesson/topics/add-subtract-rational-numbers/plan';
import { SCRIPT } from '../../src/lesson/topics/add-subtract-rational-numbers/script';
import { frame } from '../../src/blocks/block';

const SLUG = 'add-subtract-rational-numbers';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };

// ---------- layout: the board on top, the number line (or the counter mat) underneath ----------
const TOPB = box(60, 34, 1860, 404), LX = 118;
const LF = frame(60, 420, 1800, 640);
const TAGS = { a: { col: 'first' as const }, b: { col: 'second' as const }, s: { col: 'link' as const }, k: { col: 'pick' as const } };
/** a board line at (x, y), shrunk (never below 60 px) to fit maxW */
function bl(key: string, src: string, x: number, y: number, size: number, tags?: Line['tags'], col?: Line['col'], maxW = TOPB.x1 - 60 - x): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x, y, size: s, tags, col };
}
interface StageDef { pre: string; nl?: NumberLineBlock | null; mat?: CounterMatBlock | null; lines: Line[]; focus?: () => NLFocus; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setStage(S: StageDef): void {
  setScene({
    table: 1080,
    model: c => {
      S.nl?.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.());
      S.mat?.draw(c, progressOf<MatStep>(s => tr.k(S.pre + s)));
    },
    lines: S.lines, leads: [], boardBox: S.boardBox === undefined ? TOPB : S.boardBox, extra: S.extra,
  });
}
const pulses = (pre: string, keys: string[]): (() => NLFocus) => () => ({ pulse: Object.fromEntries(keys.map(k => [k, tr.k(pre + 'p.' + k)])) });
/** a dotted tie from a board symbol down to the part of the line it names (only from the board's bottom row) */
function tie(c: Canvas, from: Box, to: Box, col: 'first' | 'second' | 'link' | 'pick', k: number): void {
  if (k <= 0) return;
  const y0 = from.y1 + 10, yMid = TOPB.y1 + 18, y1 = to.y0 - 14;
  const P: [number, number][] = [[from.cx, y0], [from.cx, yMid], [to.cx, yMid], [to.cx, y1]];
  dot(c, from.cx, y0, 5, col, Math.min(1, k * 5));
  drawOn(c, P, k, { col, lw: 3.5, dash: [2, 9], cap: 'round' });
  if (k > 0.97) dot(c, to.cx, y1, 7, col);
}

// ===== 1. The question: 4 - (-3) =====
const EX = { lo: -2, hi: 8 };
const CARDS = [
  { v: '1', small: 'point', id: 'mc.integers.subtract-negative-as-positive', cb: 't.cb-one' },
  { v: '7', small: 'points', id: '', cb: 't.cb-right' },
  { v: '−7', small: 'points', id: 'mc.integers.add-magnitudes-mixed-signs', cb: 't.cb-m7' },
];
function partQuestion(): void {
  tr.reset('q.');
  const nl = NumberLine({ ...EX, points: [{ key: 'p4', v: 4, col: 'first' }] }, LF, th);
  const Q = bl('q.Q', '\\cssId{a}{4} - \\cssId{b}{(-3)} = \\,?', LX, 150, 120, TAGS);
  const sub = bl('q.sub', '\\text{your new score}', LX, 300, 62, undefined, 'dim');
  setStage({ pre: 'q.', nl, lines: [Q, sub], focus: pulses('q.', ['p4']) });
  tr.set('q.line', 1, 0.9); tr.set('q.p4', 1, 0.6, 0.7); tr.set('q.Q', 1, 1.1, 1.1); tr.set('q.sub', 1, 0.7, 1.9);
  seq(async alive => { await wait(1.0); if (!alive()) return; await bump('q.p.p4', alive); });

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Quiz score: 4 points, a -3 penalty is taken away. 4 - (-3) = ?', board: '4 - (-3)', response: p.v.replace('−', '-'), expected: '7', correct: p.v === '7', mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.v}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A penalty taken back'), html('p', '', SCRIPT['q.intro']!), html('p', '', SCRIPT['q.ask']!), cards, h('div', { class: 'label' }, SCRIPT['q.sure']!), sure, h('div', { class: 'row' }, goBtn));
  // the three lines play one after another
  seq(async alive => { await ctx.say('q.intro'); if (!alive()) return; await ctx.say('q.ask'); if (!alive()) return; void ctx.say('q.sure'); });
}

// ===== 2. Worked example: 4 - (-3) = 4 + 3 = 7 =====
function exampleLine(p: number, q: number, rng: { lo: number; hi: number }) {
  const land = p - q, ghost = p + q;
  const points: NLPoint[] = [{ key: 'pP', v: p, col: 'first' }, { key: 'pG', v: ghost, col: 'second', ghost: true }, { key: 'pL', v: land, col: 'link' }];
  const jumps: NLJump[] = [
    { key: 'j1', from: p, by: q, col: 'second', row: 0, label: numTex(q), flip: { key: 'f1', col: 'pick', label: `+${numTex(-q)}` } },
    { key: 'j2', from: land, by: q, col: 'second', row: 1, label: numTex(q) },
  ];
  return NumberLine({ ...rng, points, jumps }, LF, th);
}
function partExample(): void {
  tr.reset('e.');
  const nl = exampleLine(4, -3, EX);
  const Q = bl('e.Q', '\\cssId{a}{4} - \\cssId{b}{(-3)} = \\,?', LX, 118, 104, TAGS);
  const Hh = bl('e.H', '\\cssId{a}{4} - \\cssId{b}{(-3)} = \\cssId{s}{7}', LX, 118, 104, TAGS);
  const L1 = bl('e.L1', '\\text{adding } {-3}\\text{:}\\quad \\cssId{a}{4} + \\cssId{b}{(-3)} = 1', LX, 236, 70, TAGS);
  const L2 = bl('e.L2', '\\text{taking } {-3} \\text{ away:}\\quad \\cssId{a}{4} - \\cssId{b}{(-3)} = \\cssId{a}{4} + \\cssId{k}{3}', LX, 334, 70, TAGS);
  const C = bl('e.C', '\\text{check: }\\ \\cssId{s}{7} + \\cssId{b}{(-3)} = \\cssId{a}{4}', 1180, 118, 72, TAGS);
  setStage({
    pre: 'e.', nl, lines: [Q, Hh, L1, L2, C], focus: pulses('e.', ['j1', 'pL', 'pP', 'j2']),
    extra: c => { tie(c, partOf(L2, 'k'), nl.where.jumpLabel('j1', true), 'pick', tr.k('e.tie')); },
  });
  for (const s of ['line', 'pP', 'Q']) tr.jump('e.' + s, 1);

  let step = 0;
  const STEPS = [
    { t: 'Draw the number as an arrow', why: 'Adding −3 is a move of 3 to the left.', act: 'Draw −3', say: 'e.s1' },
    { t: 'Flip it', why: 'Taking a number away undoes its move.', act: 'Flip it', say: 'e.s2' },
    { t: 'Land', why: 'Read where the flipped arrow ends.', act: 'Land', say: 'e.s3' },
    { t: 'Check by adding back', why: 'Add the number you took away; you should be back at the start.', act: 'Check', say: 'e.s4' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) { const b = btn(s.act, () => run(i), 'go'); (li.lastChild as HTMLElement).append(b); }
      return li;
    }));
  };
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.j1', 1, 1.3); await wait(1.3); if (!alive()) return;
        tr.set('e.pG', 1, 0.5); tr.set('e.L1', 1, 1.0); void bump('e.p.j1', alive); await wait(1.0);
      } else if (i === 1) {
        tr.set('e.L1:dim', 1, 0.6); tr.set('e.pG', 0, 0.6);
        tr.set('e.f1', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('e.L2', 1, 1.1); await wait(1.0); if (!alive()) return;
        tr.set('e.tie', 1, 0.9); void bump('e.p.j1', alive); await wait(0.9);
      } else if (i === 2) {
        tr.set('e.tie', 0, 0.4); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.pL', 1, 0.7); void bump('e.p.pL', alive); await wait(0.8); if (!alive()) return;
        tr.set('e.Q', 0, 0.5); tr.set('e.H', 1, 1.2, 0.3); await wait(1.4);
      } else {
        tr.set('e.j2', 1, 1.3); await wait(1.3); if (!alive()) return;
        void bump('e.p.pP', alive); tr.set('e.C', 1, 1.1); await wait(1.1);
      }
      if (!alive()) return;
      if (i === 3) { sayBox.replaceChildren(html('p', '', SCRIPT['e.s4']!)); selfExplain(); }
      else sayBox.replaceChildren(said(STEPS[i]!.say));
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Taking away undoes adding: adding −3 moves left, so taking it away moves right.', ok: true, mc: undefined as string | undefined, id: 'e.w-ok' },
      { t: 'Two negatives make a positive.', ok: false, mc: 'mc.integers.two-negatives-positive-in-addition', id: 'e.w-two' },
      { t: 'Subtracting always moves to the left.', ok: false, mc: 'mc.integers.jump-direction-single-cue', id: 'e.w-left' },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      const b = [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!;
      b.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why does taking away -3 move to the right?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), bx, fbHost);
    seq(async alive => { await wait(0.2); await ctx.say('e.s4'); if (alive()) void ctx.say('e.why'); });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: -2 - (-6), faded from the end =====
const TURN = { lo: -9, hi: 5 };
function partTurn(): void {
  tr.reset('t.');
  const nl = exampleLine(-2, -6, TURN);
  const Q = bl('t.Q', '\\cssId{a}{{-2}} - \\cssId{b}{(-6)} = \\,?', LX, 118, 104, TAGS);
  const Hh = bl('t.H', '\\cssId{a}{{-2}} - \\cssId{b}{(-6)} = \\cssId{s}{4}', LX, 118, 104, TAGS);
  const L1 = bl('t.L1', '\\text{adding } {-6}\\text{:}\\quad \\cssId{a}{{-2}} + \\cssId{b}{(-6)} = -8', LX, 236, 70, TAGS);
  const L2 = bl('t.L2', '\\text{taking } {-6} \\text{ away:}\\quad \\cssId{a}{{-2}} - \\cssId{b}{(-6)} = \\cssId{a}{{-2}} + \\cssId{k}{6}', LX, 334, 70, TAGS);
  const C = bl('t.C', '\\text{check: }\\ \\cssId{s}{4} + \\cssId{b}{(-6)} = \\cssId{a}{{-2}}', 1180, 118, 72, TAGS);
  setStage({
    pre: 't.', nl, lines: [Q, Hh, L1, L2, C], focus: pulses('t.', ['j1', 'pL', 'pP']),
    extra: c => { tie(c, partOf(L2, 'k'), nl.where.jumpLabel('j1', true), 'pick', tr.k('t.tie')); },
  });
  tr.set('t.line', 1, 0.8); tr.set('t.pP', 1, 0.6, 0.5); tr.set('t.Q', 1, 1.0, 0.8);

  let step = 0;
  const STEPS = [
    { t: 'Draw the number as an arrow', why: 'Done for you.' },
    { t: 'Flip it', why: 'Your step.' },
    { t: 'Land', why: 'Your step.' },
    { t: 'Check by adding back', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.2); if (!alive()) return;
    tr.set('t.j1', 1, 1.3); await wait(1.3); if (!alive()) return;
    tr.set('t.pG', 1, 0.5); tr.set('t.L1', 1, 1.0); void bump('t.p.j1', alive);
    work.replaceChildren(said('t.s1'));
    await wait(2.0); if (!alive()) return;
    step = 1; drawPlan(); askFlip();
  });

  function askFlip(): void {
    const fbHost = h('div');
    const dir = h('div', { class: 'dir' });
    let done = false;
    const pickDir = (right: boolean) => {
      if (done) return;
      ctx.store.log({ part: 'turn', item: 'turn.flip', prompt: '-2 - (-6): which way does the flipped arrow point?', response: right ? 'right' : 'left', expected: 'right', correct: right, mc: right ? undefined : 'mc.integers.jump-direction-single-cue' });
      dir.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', (i === 1) === right));
      if (!right) { fbHost.replaceChildren(fb(false, 't.f-left')); return; }
      done = true;
      fbHost.replaceChildren(fb(true, 't.f-ok'));
      seq(async alive => {
        tr.set('t.L1:dim', 1, 0.6); tr.set('t.pG', 0, 0.6);
        tr.set('t.f1', 1, 1.6); await wait(1.7); if (!alive()) return;
        tr.set('t.L2', 1, 1.1); await wait(1.0); if (!alive()) return;
        tr.set('t.tie', 1, 0.9); await wait(1.2); if (!alive()) return;
        step = 2; drawPlan(); askLand();
      });
    };
    dir.append(btn('← Points left', () => pickDir(false)), btn('Points right →', () => pickDir(true)));
    work.replaceChildren(said('t.flip'), dir, fbHost);
  }
  function askLand(): void {
    const fbHost = h('div');
    const inp = numInput('points', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number, like -5 or 3.')); return; }
      const v = r.v;
      const id = v === 4 ? 't.l-ok' : v === -8 ? 't.l-before' : v === -4 ? 't.l-both' : 't.l-other';
      const mc = v === -8 ? 'mc.integers.subtract-negative-as-positive' : v === -4 ? 'mc.integers.subtract-changes-both-signs' : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.land', prompt: '-2 - (-6) = ?', board: '-2 - (-6)', response: r, expected: 4, correct: v === 4, mc });
      fbHost.replaceChildren(fb(v === 4, id));
      if (v !== 4) return;
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.tie', 0, 0.4); tr.set('t.L2:dim', 1, 0.6);
        tr.set('t.pL', 1, 0.7); void bump('t.p.pL', alive); await wait(0.8); if (!alive()) return;
        tr.set('t.Q', 0, 0.5); tr.set('t.H', 1, 1.2, 0.3); await wait(1.8); if (!alive()) return;
        step = 3; drawPlan(); askCheck();
      });
    }
    work.replaceChildren(said('t.land'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div');
    const opts = [
      { t: '4 + (−6) = −2', ok: true, id: 't.c-ok', mc: undefined as string | undefined },
      { t: '−2 + 4 = 2', ok: false, id: 't.c-pair', mc: 'mc.add-sub.checks-subtraction-with-wrong-pair' },
      { t: '−2 − (−6) = 4, done again', ok: false, id: 't.c-again', mc: 'mc.reasoning-language.check-by-repeating-same-steps' },
    ];
    const bx = h('div', { class: 'opts' });
    let done = false;
    opts.forEach(o => bx.append(btn(o.t, () => {
      if (done) return;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'Which addition checks -2 - (-6) = 4?', response: o.t, correct: o.ok, mc: o.mc });
      bx.querySelectorAll('button').forEach(b => b.classList.toggle('nope', !o.ok && b.textContent === o.t));
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      [...bx.querySelectorAll('button')].find(b => b.textContent === o.t)?.classList.add('right');
      seq(async alive => {
        tr.set('t.j2', 1, 1.3); await wait(1.3); if (!alive()) return;
        void bump('t.p.pP', alive); tr.set('t.C', 1, 1.1); await wait(1.6); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(callback());
      });
    })));
    work.replaceChildren(said('t.check'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, card = CARDS[pick ?? 1]!;
    const ids = pick === null ? ['t.cb-right'] : [card.cb, ...(card.id && (commit().sure ?? 0) >= 1 ? ['t.cb-sure'] : [])];
    c.innerHTML = ids.map(i => SCRIPT[i]).join(' ');
    seq(async alive => { await wait(1.4); for (const i of ids) { if (!alive()) return; await ctx.say(i); } });
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: "subtracting always makes a number smaller" =====
const PROVE = { lo: -1, hi: 8 };
function partProve(): void {
  tr.reset('p.');
  const nl = NumberLine({
    ...PROVE,
    points: [{ key: 'pP', v: 5, col: 'first' }, { key: 'pA', v: 3, col: 'link' }, { key: 'pB', v: 7, col: 'link' }],
    jumps: [
      { key: 'jA', from: 5, by: 2, col: 'second', row: 0, label: '2', flip: { key: 'fA', col: 'pick', label: '-2' } },
      { key: 'jB', from: 5, by: -2, col: 'second', row: 1, label: '-2', flip: { key: 'fB', col: 'pick', label: '+2' } },
    ],
  }, LF, th);
  const Sam = bl('p.S', '\\text{Sam: subtracting \\cssId{w}{always} makes a number smaller}', LX, 110, 72);
  const Sm = bl('p.Sm', '\\text{sometimes}', LX, 110, 72, undefined, 'link');
  const C1 = bl('p.C1', '\\cssId{a}{5} - \\cssId{b}{2} = \\cssId{s}{3} < 5', LX, 300, 80, TAGS);
  const C2 = bl('p.C2', '\\cssId{a}{5} - \\cssId{b}{(-2)} = \\cssId{s}{7} > 5', 1000, 300, 80, TAGS);
  setStage({
    pre: 'p.', nl, lines: [Sam, C1, C2], focus: pulses('p.', ['pA', 'pB', 'pP']),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) {
        const b = partOf(Sam, 'w'); strike(c, b.x0 - 8, b.cy + 4, b.x1 + 8, b.cy - 4, ks, { col: 'wrong' });
        const kw = tr.k('p.Sm');
        if (kw > 0) { const L = { ...Sm, x: b.cx - texWidth(Sm.F, Sm.size) / 2, y: b.y1 + 62 }; texDrawLine(c, L, kw); }
      }
    },
  });
  tr.set('p.line', 1, 0.8); tr.set('p.pP', 1, 0.6, 0.5); tr.set('p.S', 1, 1.2, 0.9);

  const CHIPS = [
    { t: 'Subtracting a positive number moves left on the line.', fits: 0 },
    { t: 'Taking away −2 flips its move: 2 to the right.', fits: 1 },
    { t: 'One counterexample is enough to show a claim is not always true.', fits: 2 },
    { t: 'A minus sign always means move left.', fits: -1, mc: 'mc.integers.jump-direction-single-cue', id: 'p.x-left' },
    { t: '5 − 2 is smaller, so it works for every number.', fits: -1, mc: 'mc.reasoning-language.examples-as-proof', id: 'p.x-examples' },
  ];
  const CLAIMS = ['p.c1', 'p.c2', 'p.c3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
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
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: (SCRIPT[CLAIMS[filled]!] ?? '').replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(CLAIMS[n - 1]!);
      seq(async alive => {
        if (n === 1) {
          tr.set('p.jA', 1, 1.0); await wait(1.0); if (!alive()) return;
          tr.set('p.fA', 1, 1.4); await wait(1.5); if (!alive()) return;
          tr.set('p.pA', 1, 0.6); void bump('p.p.pA', alive); tr.set('p.C1', 1, 1.0);
        }
        if (n === 2) {
          tr.set('p.jB', 1, 1.0); await wait(1.0); if (!alive()) return;
          tr.set('p.fB', 1, 1.4); await wait(1.5); if (!alive()) return;
          tr.set('p.pB', 1, 0.6); void bump('p.p.pB', alive); tr.set('p.C2', 1, 1.0);
        }
        if (n === 3) {
          tr.set('p.strike', 1, 0.7); await wait(0.8); if (!alive()) return;
          tr.set('p.Sm', 1, 1.0); await wait(1.4); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const proofHost = h('div');
  const judge = h('div', { class: 'jsure' });
  let judged = false;
  const J = [{ t: 'Always', mc: 'mc.integers.minus-sign-only-subtract' }, { t: 'Sometimes', mc: undefined }, { t: 'Never', mc: undefined }];
  J.forEach((j, i) => judge.append(btn(j.t, () => {
    if (judged) return;
    judged = true;
    judge.querySelectorAll('button').forEach((b, k) => { b.classList.toggle('on', k === i); (b as HTMLButtonElement).disabled = k !== i; });
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: subtracting always makes a number smaller. Always, sometimes or never?', response: j.t, expected: 'Sometimes', correct: i === 1, mc: j.mc });
    proofHost.replaceChildren(said(i === 1 ? 'p.j-ok' : 'p.j-test'), chain, chipBox, fbHost);
    drawChain();
  })));
  setPanel(h('h2', {}, 'Prove it'), html('p', '', SCRIPT['p.intro']!), html('p', '', SCRIPT['p.ask']!), judge, proofHost);
  seq(async alive => { await ctx.say('p.intro'); if (alive()) void ctx.say('p.ask'); });
}
/** draw a board line at a given progress outside the scene's own line list (the word that replaces "always") */
function texDrawLine(c: Canvas, L: Line, k: number): void { texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'left', k, col: L.col ?? 'ink' }); }

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it),
  });
  signedInputs(ctx.panel);
}
/** the shared number boxes use inputmode=numeric, which hides the minus key on phones: this topic needs it */
function signedInputs(host: HTMLElement): void {
  const fix = () => host.querySelectorAll<HTMLInputElement>('.ans input[inputmode="numeric"]').forEach(i => i.setAttribute('inputmode', 'text'));
  fix();
  new MutationObserver(fix).observe(host, { childList: true, subtree: true });
}
function showItem(item: Item): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture as Pic | undefined;
  // a marked minus sign (\cssId{m}) is lavender and underlined, like the marked sign in the panel text
  const MARK = { m: { col: 'pick' as const } }, marked = item.board.includes('cssId{m}');
  const T = bl('x.T', item.board, LX, 130, 100, MARK);
  // a small caret under the whole line, pointing up at the marked sign (an underline right under a minus reads as "=")
  const mark = (L: Line) => (c: Canvas) => {
    if (!marked || tr.k('x.T') < 1) return;
    const b = partOf(L, 'm'), all = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }), y = all.y1 + 26, w = 22;
    c.g.save(); c.g.fillStyle = paint(th, 'pick', 'fill');
    c.g.beginPath(); c.g.moveTo(b.cx, y); c.g.lineTo(b.cx + w, y + w * 1.3); c.g.lineTo(b.cx - w, y + w * 1.3); c.g.closePath(); c.g.fill(); c.g.restore();
  };
  if (pic && pic.kind === 'mat') {
    const m = tryBlock(() => CounterMat(pic, LF, th));
    if (m.ok) {
      setStage({ pre: 'x.', mat: m.value, lines: [T], extra: mark(T) });
      const done: MatStep[] = pic.at === 'start' ? ['mat', 'counters'] : pic.at === 'added' ? ['mat', 'counters', 'add'] : ['mat', 'counters', 'add', 'take', 'pair', 'remove'];
      done.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.2 + i * 0.5));
      tr.set('x.T', 1, 0.8, 0.4);
      return {
        solve: async alive => {
          for (const s of ['take', 'pair', 'remove'] as MatStep[]) { if (done.includes(s)) continue; tr.set('x.' + s, 1, 0.9); await wait(1.1); if (!alive()) return; }
        },
      };
    }
  }
  if (pic && pic.kind !== 'mat') {
    const r = tryBlock(() => practiceLine(pic));
    if (r.ok) {
      const { nl, show, solve } = r.value;
      setStage({ pre: 'x.', nl, lines: [T], focus: pulses('x.', ['pL', 'pP', 'j']), extra: mark(T) });
      tr.set('x.line', 1, 0.8); show.forEach((s, i) => tr.set('x.' + s, 1, 0.8, 0.4 + i * 0.3)); tr.set('x.T', 1, 0.8, 0.3);
      return { solve };
    }
  }
  const big = box(260, 300, 1660, 780);
  const BL: Line = { ...bigLine('x.T', item.board, big, 140), tags: MARK };
  setStage({ pre: 'x.', lines: [BL], boardBox: big, extra: mark(BL) });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}
/** the number line for a practice picture: what shows at once, and the worked solution replayed after a miss */
function practiceLine(pic: Exclude<Pic, { kind: 'mat' }>): { nl: NumberLineBlock; show: string[]; solve: (alive: () => boolean) => Promise<void> } {
  const base = { lo: pic.lo, hi: pic.hi, den: pic.den, dec: 'dec' in pic ? pic.dec : false };
  if (pic.kind === 'point') {
    const nl = NumberLine({ ...base, points: [{ key: 'pL', v: pic.v, col: 'link' }] }, LF, th);
    return { nl, show: [], solve: async alive => { tr.set('x.pL', 1, 0.7); await bump('x.p.pL', alive); } };
  }
  if (pic.kind === 'gap') {
    const d = pic.b - pic.a;
    const nl = NumberLine({ ...base, points: [{ key: 'pP', v: pic.a, col: 'first' }, { key: 'pB', v: pic.b, col: 'second' }], jumps: [{ key: 'j', from: pic.a, by: d, col: 'link', row: 0, label: (d > 0 ? '+' : '') + numTex(d) }] }, LF, th);
    return { nl, show: ['pP', 'pB'], solve: async alive => { tr.set('x.j', 1, 1.2); await wait(1.2); if (!alive()) return; await bump('x.p.j', alive); } };
  }
  const { p, q, op } = pic, land = op === '+' ? p + q : p - q;
  // arrow values in the same form as the board (5/4, not 1 1/4); the tick labels stay mixed numbers
  const lab = (v: number) => numTex(v, pic.den, base.dec, true);
  const sgnLab = (v: number) => (v > 0 ? '+' : '') + lab(v);
  if (op === '+') {
    const jumps: NLJump[] = q !== 0 ? [{ key: 'j1', from: p, by: q, col: 'second', row: 0, label: lab(q) }] : [];
    const nl = NumberLine({ ...base, points: [{ key: 'pP', v: p, col: 'first' }, { key: 'pL', v: land, col: 'link' }], jumps }, LF, th);
    const all = ['pP', 'j1', 'pL'];
    return {
      nl, show: pic.mode === 'jump' ? all : pic.mode === 'start' ? ['pP'] : [],
      solve: async alive => { tr.set('x.pP', 1, 0.5); tr.set('x.j1', 1, 1.2); await wait(1.2); if (!alive()) return; tr.set('x.pL', 1, 0.6); await bump('x.p.pL', alive); },
    };
  }
  const jumps: NLJump[] = q !== 0 ? [{ key: 'j1', from: p, by: q, col: 'second', row: 0, label: lab(q), flip: { key: 'f1', col: 'pick', label: sgnLab(-q) } }] : [];
  const points: NLPoint[] = [{ key: 'pP', v: p, col: 'first' }, { key: 'pL', v: land, col: 'link' }];
  const nl = NumberLine({ ...base, points, jumps }, LF, th);
  return {
    nl, show: pic.mode === 'jump' ? ['pP', 'j1', 'f1', 'pL'] : pic.mode === 'start' ? ['pP'] : [],
    solve: async alive => {
      tr.set('x.pP', 1, 0.5);
      if (q !== 0) { tr.set('x.j1', 1, 1.1); await wait(1.4); if (!alive()) return; tr.set('x.f1', 1, 1.4); await wait(1.5); if (!alive()) return; }
      tr.set('x.pL', 1, 0.6); await bump('x.p.pL', alive);
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{your new score}', '\\text{adding } {-3}\\text{:}', '\\text{Sam: subtracting}', '\\text{check: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
