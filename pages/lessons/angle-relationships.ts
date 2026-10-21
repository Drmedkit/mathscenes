// angle-relationships.ts: "Angle relationships" (grade 7, 7.G.B.5) on the shared lesson runtime.
//   1 The question   two straight streets cross; one corner is 65°: what is the corner across? (115° / 65° / can't
//                    tell, it has no number) + how sure
//   2 Worked example the streets become lines AC and BD: Read the givens -> Name the pair (linear pair, the straight
//                    angle lights up) -> Write and solve (65 + x = 180) -> Go across (a second linear pair: 65° again);
//                    one "why?" (why do the two angles add to 180°?)
//   3 Your turn      lines PR and QS, 38° opening to the LEFT; read + name are given; the kid types m∠QOR and picks
//                    m∠ROS (vertical angles that open sideways); the callback to part 1
//   4 Prove it       Jordan "proved" it by measuring five crossings; a two-column proof (statements | reasons) from
//                    reason chips (distractors = misconceptions); the picture backs every row, then line BD swings to
//                    show the argument covers every crossing
//   5 Practice       all 25 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/angle-relationships/script.ts (panel HTML) = voice/lines.json (spoken text).
// The board here is wider than the runtime's (the angle names are long): its lines and leaders are drawn by local
// helpers (`bl`, `lead`), the runtime is unchanged.
import type { Canvas } from '../../src/core/draw';
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { tex, texWidth } from '../../src/core/tex';
import { type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import type { Item } from '../../src/lesson/runtime/item';
import { leader } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { drawPic, type Look, markBox, sheet } from '../../src/lesson/topics/angle-relationships/AngleFig';
import { type Pic, FIG } from '../../src/lesson/topics/angle-relationships/angleMaths';
import { EXAMPLE, PROOF, QUESTION, TURN, proofAt } from '../../src/lesson/topics/angle-relationships/figures';
import { type AngleItem, FAMILY_NAMES, GENS, MC } from '../../src/lesson/topics/angle-relationships/items';
import { PLAN } from '../../src/lesson/topics/angle-relationships/plan';
import { LINES } from '../../src/lesson/topics/angle-relationships/script';
import type { Paint } from '../../src/core/theme';

const SLUG = 'angle-relationships';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const T = (id: string) => LINES[id]?.html ?? id;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
function say_(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { void ctx.say(id); return html(tag, cls, T(id)); }
const fb = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, T(id), extra); };
const NOTABLE = 1080;

// ---------- the wide board (the figure keeps the left 60 %) ----------
const BD = box(1050, 70, 1860, 1010), BLX = BD.x0 + 52, BW = BD.w - 100;
type Tags = Record<string, { col: Paint }>;
/** a board line that shrinks to fit the wide board (never below 56 px) */
function bl(key: string, src: string, y: number, size: number, tags?: Tags, col?: Paint): Line {
  const F = tex(src);
  let s = size;
  while (s > 56 && texWidth(F, s) > BW) s -= 2;
  return { key, F, x: BLX, y, size: s, tags, col };
}
interface Lead { key: string; from: () => Box; to: () => Box; col: Paint; drop?: number }
/** leaders drawn against the wide board's left edge */
function drawLeads(c: Canvas, leads: Lead[]): void {
  for (const d of leads) {
    const k = tr.k(d.key);
    if (k > 0) leader(c, d.from(), d.to(), { col: d.col, k, boardX: BD.x0, drop: d.drop ?? 0, alpha: 1 - 0.6 * tr.k(d.key + ':dim') });
  }
}
const toLabel = (p: Pic, id: string) => () => { const b = markBox(p, id)!; return box(b.x0 - 4, b.y0, b.x1 + 4, b.y1); };
/** the look of a figure from track keys: `${pre}m.<id>` visibility, `s.<id>` solved, `g.<id>` glow */
function lookOf(pre: string, p: Pic, extra: Partial<Look> = {}, base: Record<string, number> = {}): Look {
  const ids = p.fans.flatMap(f => f.marks.map(m => m.id));
  const o = (k: string, d: Record<string, number> = {}) => Object.fromEntries(ids.map(id => [id, d[id] ?? tr.k(`${pre}${k}.${id}`)]));
  return { marks: o('m', base), solved: o('s'), glow: o('g'), ...extra };
}

// ===== 1. The question =====
const Q_CARDS = [
  { label: '115°', mc: MC.equalAsSupp, cb: 't.cb-supp' },
  { label: '65°', mc: '', cb: 't.cb-right' },
  { label: 'can’t tell', small: 'it has no number', mc: MC.unknowable, cb: 't.cb-unknown' },
];
function streetNames(c: Canvas, k: number): void {
  drawWords(c, 'Main St', 846, 372, 'dim', k, { size: 46, align: 'center', weight: 650 });
  drawWords(c, 'Oak Ave', 260, 168, 'dim', k, { size: 46, align: 'center', weight: 650 });
}
function partQuestion(): void {
  tr.reset('q.');
  const L0 = bl('q.L0', '\\text{both streets straight}', BD.y0 + 110, 62, undefined, 'dim');
  const L1 = bl('q.L1', '\\text{one corner: }\\ \\cssId{g}{65^\\circ}', BD.y0 + 240, 72, { g: { col: 'second' } });
  const L2 = bl('q.L2', '\\text{across: }\\ \\cssId{q}{?}', BD.y0 + 370, 72, { q: { col: 'link' } });
  setScene({
    table: NOTABLE, lines: [L0, L1, L2], leads: [], boardBox: BD,
    model: c => { sheet(c); drawPic(c, QUESTION, FIG, { k: tr.k('q.fig'), road: 1, marks: { g: tr.k('q.g'), y: tr.k('q.y') } }); streetNames(c, tr.k('q.fig')); },
  });
  tr.set('q.fig', 1, 1.0); tr.set('q.g', 1, 0.7, 0.9); tr.set('q.y', 1, 0.7, 1.4);
  tr.set('q.L0', 1, 0.9, 0.4); tr.set('q.L1', 1, 0.9, 1.0); tr.set('q.L2', 1, 0.9, 1.6);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = Q_CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Two straight streets cross. One corner is 65 degrees. What is the angle at the corner across the intersection?', response: p.label, expected: '65°', correct: p.label === '65°', mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  Q_CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = cd.small ? `${cd.label}<small>${cd.small}</small>` : cd.label; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Two streets cross'), say_('q.intro'), html('p', '', T('q.ask')), cards, html('div', 'label', T('q.sure')), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: lines AC and BD, 65° given =====
function partExample(): void {
  tr.reset('e.');
  const y0 = BD.y0;
  const tg: Tags = { g: { col: 'second' }, x: { col: 'link' }, w: { col: 'first' }, l: { col: 'first' } };
  const L = [
    bl('e.L0', '\\text{lines }\\ \\cssId{l}{AC},\\ \\cssId{w}{BD}', y0 + 70, 64, tg),
    bl('e.L1', 'm\\angle AOB = \\cssId{g}{65^\\circ}', y0 + 160, 66, tg),
    bl('e.L2', '\\text{linear pair: }\\ \\cssId{w}{180^\\circ}', y0 + 290, 64, tg),
    bl('e.L3', '\\cssId{g}{65} + \\cssId{x}{x} = \\cssId{w}{180}', y0 + 380, 72, tg),
    bl('e.L4', '\\cssId{x}{x = 115}', y0 + 470, 72, tg),
    bl('e.L5', '115 + m\\angle COD = \\cssId{w}{180}', y0 + 600, 66, tg),
    bl('e.L6', 'm\\angle COD = \\cssId{x}{65^\\circ}', y0 + 690, 66, tg),
    bl('e.L7', 'm\\angle AOD = \\cssId{x}{115^\\circ}', y0 + 780, 66, tg),
    bl('e.L8', '\\text{across: equal}', y0 + 880, 64, undefined, 'link'),
  ];
  const leads: Lead[] = [{ key: 'e.ldY', from: () => partOf(L[6]!, 'x'), to: toLabel(EXAMPLE, 'y'), col: 'link' }];
  setScene({
    table: NOTABLE, lines: L, leads: [], boardBox: BD,
    model: c => {
      sheet(c);
      const tk = tr.k('e.ticks');
      drawPic(c, EXAMPLE, FIG, lookOf('e.', EXAMPLE, { road: tr.k('e.road'), letters: tr.k('e.letters'), ticks: { g: tk, x: tk, y: tk, z: tk } }));
      streetNames(c, tr.k('e.road'));
    },
    extra: c => drawLeads(c, leads),
  });
  tr.jump('e.road', 1); tr.jump('e.m.g', 1);

  let step = 0;
  const STEPS = [
    { t: 'Read the givens', why: 'Only what is drawn, marked or written counts.', act: 'Read them' },
    { t: 'Name the pair', why: 'Which relationship links the angles?', act: 'Name it' },
    { t: 'Write and solve', why: 'The relationship becomes an equation.', act: 'Solve it' },
    { t: 'Go across', why: 'Use the other line the same way.', act: 'Go across' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  const pulse = async (key: string, alive: () => boolean, hold = 1.0) => { tr.set(key, 1, 0.4); await wait(hold); if (alive()) tr.set(key, 0, 0.7); };
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        tr.set('e.road', 0, 1.4); tr.set('e.letters', 1, 1.0, 0.6); tr.set('e.L0', 1, 1.0, 0.8); await wait(1.9); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); void pulse('e.g.g', alive, 1.4); await wait(1.6);
      } else if (i === 1) {
        tr.set('e.L0:dim', 1, 0.5); tr.set('e.L1:dim', 1, 0.5);
        tr.set('e.m.sAC', 1, 1.0); tr.set('e.m.x', 1, 0.8, 0.4); await wait(1.3); if (!alive()) return;
        tr.set('e.L2', 1, 1.0); void pulse('e.g.sAC', alive, 1.2); await wait(1.6);
      } else if (i === 2) {
        tr.set('e.L2:dim', 1, 0.5);
        tr.set('e.L3', 1, 1.0); void pulse('e.g.g', alive, 0.8); await wait(1.4); if (!alive()) return;
        tr.set('e.L4', 1, 0.8); tr.set('e.s.x', 1, 0.8, 0.5); void pulse('e.g.x', alive, 1.4); await wait(1.8);
      } else {
        tr.set('e.L3:dim', 1, 0.5); tr.set('e.L4:dim', 1, 0.5);
        tr.set('e.m.sAC', 0.25, 0.8); tr.set('e.m.sBD', 1, 1.0, 0.3); tr.set('e.m.y', 1, 0.8, 0.6); await wait(1.5); if (!alive()) return;
        tr.set('e.L5', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.L6', 1, 0.9); tr.set('e.s.y', 1, 0.8, 0.4); tr.set('e.ldY', 1, 0.9, 0.9); await wait(2.0); if (!alive()) return;
        tr.set('e.ldY', 0, 0.5); tr.set('e.L5:dim', 1, 0.5); tr.set('e.m.sBD', 0.25, 0.8);
        tr.set('e.m.z', 1, 0.6); tr.set('e.s.z', 1, 0.6, 0.3); tr.set('e.L7', 1, 0.9, 0.3); await wait(1.4); if (!alive()) return;
        tr.set('e.ticks', 1, 0.5); tr.set('e.m.sAC', 0, 0.6); tr.set('e.m.sBD', 0, 0.6);
        tr.set('e.L8', 1, 1.0); void pulse('e.g.g', alive, 1.4); void pulse('e.g.y', alive, 1.4); await wait(1.6);
      }
      if (!alive()) return;
      sayBox.replaceChildren(say_(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { id: 'e.w-ok', t: 'OA and OC are opposite rays of line AC, so the two angles fill a straight angle.', ok: true, mc: undefined as string | undefined },
      { id: 'e.w-adj', t: 'They are next to each other, and angles next to each other add up to 180°.', ok: false, mc: MC.adjSpecial },
      { id: 'e.w-look', t: 'Together they look like half a circle.', ok: false, mc: MC.looks },
    ];
    const bx = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why do angle AOB and angle BOC add up to 180 degrees?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) { tr.set('e.g.sAC', 1, 0.4); tr.set('e.m.sAC', 1, 0.6); fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go'))); }
    })));
    void ctx.say('e.s4').then(() => ctx.say('e.why'));
    after.replaceChildren(html('div', 'label', T('e.why')), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), say_('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: lines PR and QS, 38° opening left =====
function partTurn(): void {
  tr.reset('t.');
  const y0 = BD.y0;
  const tg: Tags = { g: { col: 'second' }, x: { col: 'link' }, w: { col: 'first' } };
  const L = [
    bl('t.L0', '\\text{lines }\\ \\cssId{w}{PR},\\ \\cssId{w}{QS}', y0 + 70, 64, tg),
    bl('t.L1', 'm\\angle POQ = \\cssId{g}{38^\\circ}', y0 + 160, 66, tg),
    bl('t.L2', '\\text{linear pair: }\\ \\cssId{w}{180^\\circ}', y0 + 290, 64, tg),
    bl('t.L3', '\\cssId{g}{38} + \\cssId{x}{x} = \\cssId{w}{180}', y0 + 380, 72, tg),
    bl('t.L4', '\\cssId{x}{x = 142}', y0 + 470, 72, tg),
    bl('t.L5', '142 + m\\angle ROS = \\cssId{w}{180}', y0 + 600, 66, tg),
    bl('t.L6', 'm\\angle ROS = \\cssId{x}{38^\\circ}', y0 + 690, 66, tg),
    bl('t.L7', 'm\\angle SOP = \\cssId{x}{142^\\circ}', y0 + 780, 66, tg),
    bl('t.L8', '\\text{across: equal}', y0 + 880, 64, undefined, 'link'),
  ];
  setScene({
    table: NOTABLE, lines: L, leads: [], boardBox: BD,
    model: c => { sheet(c); drawPic(c, TURN, FIG, lookOf('t.', TURN, { k: tr.k('t.fig') })); },
  });
  tr.set('t.fig', 1, 0.8); tr.set('t.m.g', 1, 0.6, 0.6);

  let step = 0;
  const STEPS = [
    { t: 'Read the givens', why: 'Done for you.' },
    { t: 'Name the pair', why: 'Done for you.' },
    { t: 'Write and solve', why: 'Your step.' },
    { t: 'Go across', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn'), say_('t.intro'), plan, work);

  seq(async alive => {
    await wait(1.2); if (!alive()) return;
    tr.set('t.L0', 1, 0.9); tr.set('t.L1', 1, 0.9, 0.6); tr.set('t.g.g', 1, 0.4, 0.8); await wait(2.0); if (!alive()) return;
    tr.set('t.g.g', 0, 0.6); step = 1; drawPlan();
    tr.set('t.L0:dim', 1, 0.5); tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.m.sPR', 1, 1.0); tr.set('t.m.x', 1, 0.8, 0.4); tr.set('t.L2', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
    work.replaceChildren(say_('t.pair'));
    tr.set('t.L3', 1, 1.0); await wait(1.4); if (!alive()) return;
    step = 2; drawPlan(); askX();
  });

  function askX(): void {
    const fbHost = h('div');
    let done = false;
    const inp = numInput('°', () => check());
    const checkBtn = btn('Check', () => check(), 'go');
    function check(): void {
      if (done) return;
      const r = inp.read();
      if (!r || r.kind !== 'num' || Number.isNaN(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number first.')); return; }
      const v = r.v;
      const res = v === 142 ? { ok: true, id: 't.x-ok' } : v === 52 ? { ok: false, id: 't.x-swap', mc: MC.swapped } : v === 38 ? { ok: false, id: 't.x-equal', mc: MC.suppEqual } : v === 180 ? { ok: false, id: 't.x-whole', mc: MC.reportsWhole } : { ok: false, id: 't.x-other' };
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: 'Lines PR and QS cross at O; m∠POQ = 38°. Find m∠QOR.', response: r, expected: 142, correct: res.ok, mc: (res as { mc?: string }).mc });
      fbHost.replaceChildren(fb(res.ok, res.id));
      if (!res.ok) return;
      done = true; checkBtn.disabled = true;
      seq(async alive => {
        tr.set('t.L4', 1, 0.8); tr.set('t.s.x', 1, 0.8, 0.3); tr.set('t.g.x', 1, 0.4, 0.3); await wait(1.6); if (!alive()) return;
        tr.set('t.g.x', 0, 0.6); step = 3; drawPlan(); askY();
      });
    }
    work.append(say_('t.x-ask'), inp.node, h('div', { class: 'row' }, checkBtn), fbHost);
    setTimeout(() => inp.focus(), 60);
  }
  function askY(): void {
    tr.set('t.L2:dim', 1, 0.5); tr.set('t.L3:dim', 1, 0.5); tr.set('t.L4:dim', 1, 0.5);
    tr.set('t.m.sPR', 0, 0.6); tr.set('t.m.y', 1, 0.7, 0.2); tr.set('t.g.y', 1, 0.4, 0.4);
    const fbHost = h('div');
    const opts = [
      { t: '38°', ok: true, id: 't.y-ok' },
      { t: '142°', ok: false, id: 't.y-supp', mc: MC.equalAsSupp },
      { t: '52°', ok: false, id: 't.y-swap', mc: MC.swapped },
    ];
    const bx = h('div', { class: 'opts three' });
    let done = false;
    opts.forEach(o => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...bx.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'turn', item: 'turn.y', prompt: 'Go across the crossing: what is m∠ROS?', response: o.t, expected: '38°', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fb(o.ok, o.id));
      if (!o.ok) return;
      done = true;
      seq(async alive => {
        tr.set('t.g.y', 0, 0.5); tr.set('t.m.sQS', 1, 1.0); tr.set('t.L5', 1, 1.0, 0.4); await wait(1.6); if (!alive()) return;
        tr.set('t.L6', 1, 0.9); tr.set('t.s.y', 1, 0.8, 0.3); tr.set('t.g.y', 1, 0.4, 0.3); tr.set('t.g.g', 1, 0.4, 0.3); await wait(2.2); if (!alive()) return;
        tr.set('t.g.y', 0, 0.6); tr.set('t.g.g', 0, 0.6); tr.set('t.m.sQS', 0, 0.8); tr.set('t.L5:dim', 1, 0.5);
        tr.set('t.m.z', 1, 0.6); tr.set('t.s.z', 1, 0.6, 0.3); tr.set('t.L7', 1, 0.9, 0.3); tr.set('t.L8', 1, 0.9, 1.1); await wait(2.2); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(say_('t.done'), callback());
      });
    })));
    work.replaceChildren(say_('t.y-ask'), bx, fbHost);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick;
    const id = pick === null ? 't.cb-none' : Q_CARDS[pick]!.cb;
    c.innerHTML = (pick === null ? '' : `At the start you picked <b>${Q_CARDS[pick]!.label}</b> and you were <b>${SURE[commit().sure ?? 0]!.toLowerCase()}</b>. `) + T(id);
    // the voice says the card line after "t.done" has finished
    setTimeout(() => void ctx.say(id), 50);
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: vertical angles are always equal (a two-column proof) =====
const ROWS = [
  { id: 'p.r1', tex: 'm\\angle 1 + m\\angle 2 = 180^\\circ', short: 'linear pair, line AC' },
  { id: 'p.r2', tex: 'm\\angle 2 + m\\angle 3 = 180^\\circ', short: 'linear pair, line BD' },
  { id: 'p.r3', tex: 'm\\angle 1 + m\\angle 2 = m\\angle 2 + m\\angle 3', short: 'both equal 180°' },
  { id: 'p.r4', tex: 'm\\angle 1 = m\\angle 3', short: 'subtract m∠2 from both sides' },
];
function partProve(): void {
  tr.reset('p.');
  const y0 = BD.y0;
  const G0 = bl('p.G0', '\\text{Given: lines }\\ AC,\\ BD', y0 + 70, 60, undefined, 'dim');
  const G1 = bl('p.G1', '\\text{Prove: }\\ \\cssId{a}{m\\angle 1} = \\cssId{b}{m\\angle 3}', y0 + 160, 64, { a: { col: 'second' }, b: { col: 'link' } });
  const ry = (i: number) => y0 + 300 + i * 150;
  const R = ROWS.map((r, i) => bl(`p.R${i}`, r.tex, ry(i), 64, undefined, i === 3 ? 'link' : 'ink'));
  const J = bl('p.J', '\\text{Jordan: 5 crossings} \\Rightarrow \\cssId{w}{\\text{all}}', y0 + 300, 60, undefined, 'dim');
  setScene({
    table: NOTABLE, lines: [J, G0, G1, ...R], leads: [], boardBox: BD,
    model: c => {
      sheet(c);
      const sw = tr.k('p.swing');
      if (sw > 0) {
        // after the proof: line BD swings; angle 1 and angle 3 stay equal whatever the crossing
        const t = 55 + 70 * (1 - Math.cos(sw * Math.PI * 2)) / 2;
        drawPic(c, proofAt(Math.round(t), true), FIG, { glow: { a1: 0.6, a3: 0.6 }, marks: { sAC: 0, sBD: 0 } });
        return;
      }
      const tk = tr.k('p.ticks');
      drawPic(c, PROOF, FIG, lookOf('p.', PROOF, { ticks: { a1: tk, a3: tk } }, { a1: 1, a2: 1 - 0.75 * tr.k('p.take2'), a3: 1 }));
    },
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong', alpha: tr.k('p.J') }); }
      ROWS.forEach((r, i) => drawWords(c, r.short, BLX + 6, ry(i) + 62, 'link', tr.k(`p.why${i}`) * (1 - 0.45 * tr.k(`p.R${i}:dim`)), { size: 44, weight: 600 }));
    },
  });
  tr.set('p.J', 1, 1.0, 0.6);

  const CHIPS = [
    { t: 'Subtract m∠2 from both sides', fits: 3 },
    { t: 'I measured them: both are 55°', fits: -1, mc: MC.examples, id: 'p.x-measure' },
    { t: 'Linear pair: OA and OC are opposite rays (line AC)', fits: 0 },
    { t: '∠1 and ∠2 are adjacent, so they add to 180°', fits: -1, mc: MC.adjSpecial, id: 'p.x-adj' },
    { t: 'Both sums equal 180°', fits: 2 },
    { t: 'Linear pair: OB and OD are opposite rays (line BD)', fits: 1 },
  ];
  let filled = 0;
  const table = h('table', { class: 'proof' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
  const drawTable = () => {
    const head = h('tr', {}, h('th', {}, 'Statement'), h('th', {}, 'Reason'));
    table.replaceChildren(head, ...ROWS.map((r, i) => {
      const chip = CHIPS.find(c => c.fits === i)!;
      const st = h('td', { class: 'st' }); st.innerHTML = T(r.id);
      const rs = h('td', { class: 'rs' }); rs.innerHTML = i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>';
      return h('tr', { class: i < filled ? 'ok' : i === filled ? 'now' : '' }, st, rs);
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= ROWS.length) return;
    ctx.store.log({ part: 'prove', item: `prove.row${filled + 1}`, prompt: `Reason for: ${LINES[ROWS[filled]!.id]?.say ?? ''}`, response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawTable(); fbHost.replaceChildren();
      const n = filled;
      void ctx.say(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.m.sAC', 1, 0.8); tr.set('p.g.sAC', 1, 0.4, 0.3); tr.set('p.R0', 1, 1.0, 0.3); tr.set('p.why0', 1, 0.6, 1.1); await wait(2.0); if (!alive()) return; tr.set('p.g.sAC', 0, 0.6); }
        if (n === 2) { tr.set('p.m.sAC', 0.2, 0.6); tr.set('p.R0:dim', 1, 0.5); tr.set('p.m.sBD', 1, 0.8); tr.set('p.g.sBD', 1, 0.4, 0.3); tr.set('p.R1', 1, 1.0, 0.3); tr.set('p.why1', 1, 0.6, 1.1); await wait(2.0); if (!alive()) return; tr.set('p.g.sBD', 0, 0.6); }
        if (n === 3) { tr.set('p.m.sAC', 1, 0.6); tr.set('p.R1:dim', 1, 0.5); tr.set('p.R2', 1, 1.1); tr.set('p.why2', 1, 0.6, 1.0); tr.set('p.g.a2', 1, 0.4, 0.4); await wait(2.0); if (!alive()) return; tr.set('p.g.a2', 0, 0.6); }
        if (n === 4) {
          tr.set('p.R2:dim', 1, 0.5); tr.set('p.m.sAC', 0, 0.6); tr.set('p.m.sBD', 0, 0.6);
          tr.set('p.take2', 1, 0.8); await wait(0.8); if (!alive()) return;
          tr.set('p.R3', 1, 1.0); tr.set('p.why3', 1, 0.6, 0.9); tr.set('p.ticks', 1, 0.5, 0.6); tr.set('p.g.a1', 1, 0.4, 0.6); tr.set('p.g.a3', 1, 0.4, 0.6); await wait(2.2); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fb(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
          // every crossing: line BD swings, angle 1 and angle 3 stay equal
          await wait(1.2); if (!alive()) return;
          tr.set('p.swing', 1, 6.0); await wait(6.1); if (!alive()) return;
          tr.jump('p.swing', 0);
        }
      });
      return;
    }
    fbHost.replaceChildren(fb(false, ch.id ?? 'p.x-other'));
  }
  const yes = btn('Jordan has proved it', () => judge(true)), no = btn('Not proved yet', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan measured five crossings: the angles across were equal every time. Does that prove it for every crossing?', response: right ? 'proved' : 'not proved', expected: 'not proved', correct: !right, mc: right ? MC.examples : undefined });
    seq(async alive => {
      tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
      tr.set('p.J', 0, 0.6); tr.set('p.G0', 1, 0.8, 0.4); tr.set('p.G1', 1, 0.9, 0.9);
    });
    proofHost.replaceChildren(say_(right ? 'p.build-test' : 'p.build'), html('p', 'given', T('p.given')), table, chipBox, fbHost);
    drawTable();
  }
  setPanel(h('h2', {}, 'Prove it'), say_('p.intro'), h('div', { class: 'row' }, yes, no), proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as AngleItem),
  });
}
const WIDE = box(260, 140, 1660, 940);
const MIDFIG = { x: 490, y: 70, w: 940, h: 940 };
function showItem(item: AngleItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const hasFig = pic.fans.length > 0;
  const y0 = BD.y0;
  const lines: Line[] = [];
  if (hasFig) {
    item.givens.forEach((g, i) => lines.push(bl(`x.G${i}`, g, y0 + 80 + i * 100, 66)));
    const top = y0 + 80 + item.givens.length * 100 + (item.givens.length ? 50 : 0);
    const gap = Math.min(100, (BD.y1 - 60 - top) / Math.max(1, item.work.length));
    item.work.forEach((w, i) => lines.push(bl(`x.W${i}`, w, top + i * gap, 64, undefined, i === item.work.length - 1 ? 'link' : 'ink')));
  } else {
    // no figure: the givens big on a wide slate, the work under them
    const all = [...item.givens, ...item.work];
    all.forEach((g, i) => {
      const F = tex(g); let s = 96; while (s > 60 && texWidth(F, s) > WIDE.w - 160) s -= 4;
      const isW = i >= item.givens.length;
      lines.push({ key: isW ? `x.W${i - item.givens.length}` : `x.G${i}`, F, x: WIDE.cx - texWidth(F, s) / 2, y: WIDE.y0 + 120 + i * 140, size: s, col: isW && i === all.length - 1 ? 'link' : 'ink' });
    });
  }
  const reveal = pic.solve?.reveal ?? [], focus = pic.solve?.focus ?? [];
  // nothing to write on the board: the figure moves to the middle and the slate goes
  const noBoard = hasFig && !item.givens.length && !item.work.length;
  const fr = noBoard ? MIDFIG : FIG;
  setScene({
    table: NOTABLE, lines, leads: [], boardBox: noBoard ? null : hasFig ? BD : WIDE,
    model: c => {
      if (!hasFig) return;
      sheet(c, fr);
      const ks = tr.k('x.solve');
      // after a miss: the unknown shows its value, the angles that matter light up (neutral ones turn lime)
      const neutral = new Set(pic.fans.flatMap(f => f.marks).filter(m => !m.col || m.col === 'plain' || m.col === 'pick').map(m => m.id));
      drawPic(c, pic, fr, { k: tr.k('x.in'), road: item.road ? 1 : 0, solved: Object.fromEntries(reveal.map(id => [id, ks])), glow: Object.fromEntries(focus.map(id => [id, ks])),
        col: ks > 0.5 ? Object.fromEntries(focus.filter(id => neutral.has(id)).map(id => [id, 'link' as const])) : undefined });
    },
  });
  tr.set('x.in', 1, 0.6);
  item.givens.forEach((_, i) => tr.set(`x.G${i}`, 1, 0.8, 0.3 + 0.3 * i));
  return {
    solve: async alive => {
      tr.set('x.solve', 1, 0.8);
      for (let i = 0; i < item.work.length; i++) { tr.set(`x.W${i}`, 1, 0.8); await wait(0.8); if (!alive()) return; }
    },
  };
}
export type { Item };

void runLesson({
  slug: SLUG,
  warm: ['m\\angle AOB = 65^\\circ', '\\text{linear pair: }\\ 180^\\circ', '\\Rightarrow', 'x = 115'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
