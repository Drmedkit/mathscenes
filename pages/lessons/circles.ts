// circles.ts: "Area and circumference of circles", grade 7 (7.G.B.4), on the lesson runtime.
//   1 The question   a 12-inch pizza: how much cheese (area)? cards 36 (r x r) / about 38 (pi x 12, the crust) /
//                    about 113 + how sure
//   2 Worked example Find the radius -> Cut and rearrange (16 wedges into a near-rectangle: half the crust on top)
//                    -> Multiply the sides (6 pi x 6 = 36 pi) -> Round and check (about 3 squares of r x r); each symbol
//                    is written beside, and linked by colour, pulses and leader lines to, the part it names
//   3 Your turn      a round rug 10 ft across, faded from the end: radius and wedges are given, the kid finds the
//                    sides, the area and the rounded value; the mind-change callback to part 1
//   4 Prove it       Sam: "two 8-inch pizzas = one 16-inch pizza": judge, then a 4-line because-chain from reason chips
//                    (distractors = catalogue misconceptions); the picture backs every line (4 small pizzas in the box)
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/circles/script.ts (panel HTML) = pages/lessons/circles/voice/lines.json.
import { strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame } from '../../src/blocks/block';
import { tex, texWidth, type Formula } from '../../src/core/tex';
import { BOARD, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, pairInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Disc, type DiscBlock, type DiscFocus, restSteps } from '../../src/lesson/topics/circles/Disc';
import { LF, PIZZA, PIZZAS, RUG } from '../../src/lesson/topics/circles/lessonPics';
import { FAMILY_NAMES, GENS, MC, PF, type CircleItem } from '../../src/lesson/topics/circles/items';
import { PLAN } from '../../src/lesson/topics/circles/plan';
import { SCRIPT } from '../../src/lesson/topics/circles/script';
import type { Pic } from '../../src/lesson/topics/circles/circleMaths';

const SLUG = 'circles';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the narrator says it, the panel shows it */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, SCRIPT[id]?.h ?? id); }
const sayOnly = (id: string) => { void ctx.say(id); };
const fbSaid = (ok: boolean, id: string, extra: Kid[] = []) => { void ctx.say(id); return feedback(ok, SCRIPT[id]?.h ?? id, extra); };

/** TeX colour tags: a = area (amber), c = circumference (teal), k = the answer (lime) */
const C = { a: { col: 'first' as const }, c: { col: 'second' as const }, k: { col: 'link' as const } };

interface DScene { pre: string; m: DiscBlock | null; lines: Line[]; leads: Lead[]; focus?: () => DiscFocus; extra?: Parameters<typeof setScene>[0]['extra']; boardBox?: Box | null }
function setDisc(S: DScene): void {
  setScene({
    table: 1080,
    model: c => { if (S.m) S.m.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.()); },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
const LFR = frame(LF.x, LF.y, LF.w, LF.h);
const disc = (p: Pic) => Disc(p, LFR, th);
const jump = (pre: string, keys: string[]) => { for (const k of keys) tr.jump(pre + k, 1); };
const pulseOf = (pre: string, keys: string[], col?: 'pick' | 'link' | 'first' | 'second'): NonNullable<DiscFocus['pulse']> => keys.map(key => ({ key, k: tr.k(`${pre}p.${key}`), col }));
async function pulse(pre: string, keys: string[], alive: () => boolean): Promise<void> {
  for (const k of keys) void bump(`${pre}p.${k}`, alive);
  await wait(1.0);
}

const CARDS = [
  { v: 38, t: '<small>about </small>38', id: MC.areaPerim, cb: 't.cb.c' },
  { v: 113, t: '<small>about </small>113', id: '', cb: 't.cb.right' },
  { v: 36, t: '<small>exactly </small>36', id: MC.rRect, cb: 't.cb.rr' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = disc(PIZZA);
  const Q1 = line('q.Q1', 'd = 12\\text{ in}', BOARD.y0 + 110, 84);
  const Q2 = line('q.Q2', '\\cssId{a}{A} = \\ ?', BOARD.y0 + 250, 84, C);
  setDisc({ pre: 'q.', m, lines: [Q1, Q2], leads: [] });
  tr.set('q.in', 1, 0.9); tr.set('q.d', 1, 0.8, 0.8); tr.set('q.dL', 1, 0.6, 1.3);
  tr.set('q.Q1', 1, 0.9, 1.6); tr.set('q.A', 1, 0.9, 2.4); tr.set('q.Q2', 1, 0.9, 2.6);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A 12-inch pizza: how many square inches of cheese cover the top?', response: p.v, expected: 113, correct: p.v === 113, mc: p.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}<small>square inches</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = html('p', '', SCRIPT['q.intro']!.h), ask = html('p', '', SCRIPT['q.ask']!.h);
  setPanel(h('h2', {}, 'How much cheese?'), intro, ask, cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
  void ctx.say('q.intro').then(() => { if (ctx.progress.part === 0) sayOnly('q.ask'); });
}

// ===== the shared board of parts 2 and 3: radius, circumference, half of it, the area, about =====
function wedgeBoard(pre: string, d: number): Line[] {
  const r = d / 2, y0 = BOARD.y0;
  return [
    line(`${pre}E1`, `d = ${d}\\text{ ${d === 12 ? 'in' : 'ft'}}`, y0 + 110, 80),
    line(`${pre}E2`, `r = ${d} \\div 2 = \\cssId{r}{${r}}`, y0 + 240, 80),
    line(`${pre}E3`, `\\cssId{c}{C} = \\pi \\times ${d} = \\cssId{c}{${d}\\pi}`, y0 + 380, 80, C),
    line(`${pre}E4`, `\\text{top} = ${d}\\pi \\div 2 = \\cssId{t}{${r}\\pi}`, y0 + 530, 80, { t: { col: 'second' } }),
    line(`${pre}E5`, `\\cssId{a}{A} = ${r}\\pi \\times \\cssId{h}{${r}} = \\cssId{a}{${r * r}\\pi}`, y0 + 690, 80, C),
    line(`${pre}E6`, `${r * r}\\pi \\approx \\cssId{k}{${d === 12 ? '113' : '78.5'}}\\text{ sq ${d === 12 ? 'in' : 'ft'}}`, y0 + 850, 80, C),
  ];
}

// ===== 2. Worked example =====
function partExample(): void {
  tr.reset('e.');
  const m = disc(PIZZA);
  const [E1, E2, E3, E4, E5, E6] = wedgeBoard('e.', 12) as [Line, Line, Line, Line, Line, Line];
  const leads: Lead[] = [
    { key: 'e.ldR', from: () => partOf(E2, 'r'), to: () => m.where.label('rtag'), col: 'ink' },
    { key: 'e.ldT', from: () => partOf(E4, 't'), to: () => m.where.label('toptag'), col: 'second' },
    { key: 'e.ldH', from: () => partOf(E5, 'h'), to: () => m.where.label('httag'), col: 'ink', drop: 10 },
  ];
  setDisc({ pre: 'e.', m, lines: [E1, E2, E3, E4, E5, E6], leads, focus: () => ({ pulse: [...pulseOf('e.', ['dtag', 'rtag', 'httag'], 'pick'), ...pulseOf('e.', ['toptag'], 'second')] }) });
  jump('e.', ['in', 'd', 'dL', 'E1']);

  let step = 0;
  const STEPS = [
    { t: 'Find the radius', why: 'From the center to the edge: half the diameter.', act: 'Find r' },
    { t: 'Cut and rearrange', why: 'Wedges in a row, one up, one down.', act: 'Cut' },
    { t: 'Multiply the sides', why: 'Half the circumference × the radius.', act: 'Multiply' },
    { t: 'Round and check', why: 'π ≈ 3.14; about 3 squares of r × r.', act: 'Round' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren(said(`e.step${i}`));
    seq(async alive => {
      if (i === 0) {
        await pulse('e.', ['dtag'], alive); if (!alive()) return;
        tr.set('e.r', 1, 0.9); tr.set('e.rL', 1, 0.6, 0.6); await wait(1.2); if (!alive()) return;
        tr.set('e.E2', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.ldR', 1, 0.9); await pulse('e.', ['rtag'], alive);
      } else if (i === 1) {
        tr.set('e.ldR', 0, 0.5); tr.set('e.E1:dim', 1, 0.6); tr.set('e.E2:dim', 1, 0.6);
        tr.set('e.C', 1, 1.6); await wait(1.2); if (!alive()) return;
        tr.set('e.E3', 1, 1.0); await wait(1.4); if (!alive()) return;
        tr.set('e.cut', 1, 1.4); await wait(1.6); if (!alive()) return;
        tr.set('e.move', 1, 2.6); await wait(2.8); if (!alive()) return;
        tr.set('e.top', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('e.topL', 1, 0.6); tr.set('e.E4', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.ldT', 1, 0.9); await pulse('e.', ['toptag'], alive);
      } else if (i === 2) {
        tr.set('e.ldT:dim', 1, 0.5); tr.set('e.E3:dim', 1, 0.6); tr.set('e.E4:dim', 1, 0.6);
        tr.set('e.ht', 1, 0.9); tr.set('e.htL', 1, 0.6, 0.6); await wait(1.2); if (!alive()) return;
        tr.set('e.A', 1, 1.0); tr.set('e.E5', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('e.ldH', 1, 0.9); await pulse('e.', ['httag'], alive);
      } else {
        tr.set('e.ldH:dim', 1, 0.5); tr.set('e.E5:dim', 1, 0.6); tr.set('e.A', 0.35, 0.8);
        tr.set('e.sq', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('e.E6', 1, 1.0); await wait(1.2);
      }
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Half the crust is on top; the other half runs along the bottom.', ok: true, mc: undefined as string | undefined, id: 'e.why.ok' },
      { t: 'The whole crust, 12π, runs along the top.', ok: false, mc: MC.dropHalf, id: 'e.why.all' },
      { t: 'The long side is the diameter, 12 inches.', ok: false, mc: MC.aroundAcross, id: 'e.why.d' },
    ];
    const box_ = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box_.append(btn(o.t, () => {
      box_.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box_.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(fbSaid(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the long side 6π, not 12π?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!.h), box_, fbHost);
    void ctx.say('e.step3').then(() => { if (ctx.progress.part === 1 && !fbHost.childElementCount) sayOnly('e.why'); });
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: a round rug 10 ft across =====
function partTurn(): void {
  tr.reset('t.');
  const m = disc(RUG);
  const [E1, E2, E3, E4, E5, E6] = wedgeBoard('t.', 10) as [Line, Line, Line, Line, Line, Line];
  const leads: Lead[] = [
    { key: 't.ldT', from: () => partOf(E4, 't'), to: () => m.where.label('toptag'), col: 'second' },
    { key: 't.ldH', from: () => partOf(E5, 'h'), to: () => m.where.label('httag'), col: 'ink', drop: 10 },
  ];
  setDisc({ pre: 't.', m, lines: [E1, E2, E3, E4, E5, E6], leads, focus: () => ({ pulse: [...pulseOf('t.', ['httag'], 'pick'), ...pulseOf('t.', ['toptag'], 'second')] }) });
  tr.set('t.in', 1, 0.9); tr.set('t.d', 1, 0.8, 0.6); tr.set('t.dL', 1, 0.6, 1.0); tr.set('t.E1', 1, 0.9, 1.2);

  let step = 0;
  const STEPS = [
    { t: 'Find the radius', why: 'Done for you.' },
    { t: 'Cut and rearrange', why: 'Done for you.' },
    { t: 'Multiply the sides', why: 'Your step.' },
    { t: 'Round and check', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A round rug'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.2); if (!alive()) return;
    work.replaceChildren(html('p', '', SCRIPT['t.given']!.h));
    void ctx.say('t.given');
    tr.set('t.r', 1, 0.8); tr.set('t.rL', 1, 0.6, 0.5); tr.set('t.E2', 1, 1.0, 0.6); await wait(1.8); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.E1:dim', 1, 0.6); tr.set('t.E2:dim', 1, 0.6);
    tr.set('t.C', 1, 1.4); tr.set('t.E3', 1, 1.0, 0.8); await wait(2.0); if (!alive()) return;
    tr.set('t.cut', 1, 1.2); await wait(1.4); if (!alive()) return;
    tr.set('t.move', 1, 2.4); await wait(2.6); if (!alive()) return;
    step = 2; drawPlan(); askSides();
  });

  function askSides(): void {
    const fbHost = h('div');
    const inp = pairInput('top =', 'π ft, &nbsp;height =', () => check(), 'ft');
    const ok = btn('Check', () => check(), 'go');
    tr.set('t.E3:dim', 1, 0.6);
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(feedback(false, 'Type two numbers: the top (the number in front of π) and the height.')); return; }
      const right = r.x === 5 && r.y === 5;
      const mc = right ? undefined : r.x === 10 ? MC.dropHalf : r.y === 10 ? MC.dForR : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.sides', prompt: 'Rug d = 10 ft cut into wedges: the near-rectangle is how long (in π ft) and how tall?', response: r, expected: { x: 5, y: 5 }, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbSaid(false, r.x === 10 ? 't.sides.half' : r.y === 10 ? 't.sides.d' : 't.sides.other')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbSaid(true, 't.sides.ok'));
      seq(async alive => {
        tr.set('t.top', 1, 1.2); tr.set('t.topL', 1, 0.6, 0.8); tr.set('t.E4', 1, 1.0, 0.8); await wait(1.6); if (!alive()) return;
        tr.set('t.ldT', 1, 0.8); await pulse('t.', ['toptag'], alive); if (!alive()) return;
        tr.set('t.ht', 1, 0.8); tr.set('t.htL', 1, 0.6, 0.5); await wait(1.0); if (!alive()) return;
        await pulse('t.', ['httag'], alive); if (!alive()) return;
        tr.set('t.ldT:dim', 1, 0.5); tr.set('t.E4:dim', 1, 0.6);
        askArea();
      });
    }
    work.replaceChildren(said('t.sides'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askArea(): void {
    const fbHost = h('div');
    const inp = numInput('π sq ft', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      const v = r && r.kind === 'num' ? r.v : NaN;
      if (!Number.isFinite(v)) { fbHost.replaceChildren(feedback(false, 'Type the number in front of π.')); return; }
      const right = v === 25;
      const id = right ? 't.area.ok' : v === 10 ? 't.area.pow' : v === 100 ? 't.area.d' : v === 50 ? 't.area.half' : 't.area.other';
      const mc = right ? undefined : v === 10 ? MC.powTimes : v === 100 ? MC.dForR : v === 50 ? MC.dropHalf : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.area', prompt: 'Near-rectangle 5π ft by 5 ft: the area in π sq ft?', response: r, expected: 25, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbSaid(false, id)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbSaid(true, id));
      seq(async alive => {
        tr.set('t.A', 1, 1.0); tr.set('t.E5', 1, 1.0); await wait(1.2); if (!alive()) return;
        tr.set('t.ldH', 1, 0.8); await pulse('t.', ['httag'], alive); if (!alive()) return;
        await wait(0.8); if (!alive()) return;
        tr.set('t.ldH:dim', 1, 0.5); tr.set('t.E5:dim', 1, 0.6);
        step = 3; drawPlan(); askRound();
      });
    }
    work.replaceChildren(said('t.area'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askRound(): void {
    const fbHost = h('div');
    const inp = numInput('sq ft', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      const v = r && r.kind === 'num' ? r.v : NaN;
      if (!Number.isFinite(v)) { fbHost.replaceChildren(feedback(false, 'Type a number of square feet.')); return; }
      const right = Math.abs(v - 78.5) <= 0.051;
      const near = (a: number) => Math.abs(v - a) <= 0.06;
      const id = right ? 't.done' : near(31.4) ? 't.round.c' : near(246.49) || near(246.74) || near(246.5) ? 't.round.sq' : near(75) ? 't.round.three' : 't.round.other';
      const mc = id === 't.round.c' ? MC.areaPerim : id === 't.round.sq' ? MC.piSquared : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.round', prompt: '25π sq ft with π ≈ 3.14?', response: r, expected: 78.5, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbSaid(false, id)); return; }
      ok.disabled = true;
      fbHost.replaceChildren();
      seq(async alive => {
        tr.set('t.A', 0.35, 0.8); tr.set('t.sq', 1, 1.6); await wait(1.4); if (!alive()) return;
        tr.set('t.E6', 1, 1.0); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan();
        fbHost.append(feedback(true, SCRIPT['t.done']!.h), callback());
      });
    }
    work.replaceChildren(said('t.round'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const p = commit().pick, sure = commit().sure;
    const id = p === null ? 't.cb.none' : CARDS[p]!.cb;
    const ids = [id, ...(p !== null && sure !== null ? [`t.sure.${sure}`] : [])];
    c.innerHTML = ids.map(i => SCRIPT[i]!.h).join(' ');
    void ids.reduce((pr, i) => pr.then(() => (ctx.progress.part === 2 ? ctx.say(i) : undefined)), ctx.say('t.done'));
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Sam's pizzas =====
function partProve(): void {
  tr.reset('p.');
  const m = disc(PIZZAS);
  const y0 = BOARD.y0;
  const J0 = line('p.J0', '\\text{Sam:}', y0 + 80, 56, undefined, 'dim');
  const J = line('p.J', '\\cssId{w}{2 \\times \\text{8-in} = \\text{16-in}}', y0 + 180, 76);
  const C1 = line('p.C1', 'r{:}\\ \\ 4 \\to 8\\ \\ (\\cssId{k}{\\times 2})', y0 + 330, 76, C);
  const C2 = line('p.C2', '\\cssId{c}{C}{:}\\ \\ 8\\pi \\to 16\\pi\\ \\ (\\cssId{k}{\\times 2})', y0 + 480, 76, C);
  const C3 = line('p.C3', '\\cssId{a}{A}{:}\\ \\ 16\\pi \\to 64\\pi\\ \\ (\\cssId{k}{\\times 4})', y0 + 630, 76, C);
  const C4 = line('p.C4', '2 \\times 16\\pi = 32\\pi \\neq 64\\pi', y0 + 790, 76, undefined, 'wrong');
  setDisc({
    pre: 'p.', m, lines: [J0, J, C1, C2, C3, C4], leads: [],
    focus: () => ({ pulse: pulseOf('p.', ['tag0', 'tag1.0', 'tag1.1'], 'pick') }),
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  tr.set('p.a', 1, 0.9); tr.set('p.b', 1, 0.9, 0.4); tr.set('p.segs', 1, 0.8, 1.0); tr.set('p.tags', 1, 0.6, 1.4);
  tr.set('p.J0', 1, 0.6, 1.6); tr.set('p.J', 1, 1.0, 1.9);

  const CHIPS = [
    { t: '16 ÷ 8 = 2, and the radius is half the diameter.', fits: 0 },
    { t: 'C = 2πr: double r, double C.', fits: 1 },
    { t: 'A = πr² uses r twice: 2 × 2 = 4.', fits: 2 },
    { t: '2 × 16π = 32π, only half of 64π.', fits: 3 },
    { t: 'Area grows by the same factor as the width.', fits: -1, mc: MC.areaByK, say: 'p.no.k' },
    { t: 'A bigger pizza has a bigger π.', fits: -1, mc: MC.piGrows, say: 'p.no.pi' },
    { t: 'The big one is 8 inches wider, so add 8 to everything.', fits: -1, mc: MC.additive, say: 'p.no.add' },
  ];
  const CLAIMS = [
    'The radius is multiplied by <b class="s">2</b> (4 in → 8 in),',
    'so the crust is multiplied by <b class="s">2</b> too (<b class="b">8π → 16π</b>),',
    'but the area is multiplied by <b class="s">4</b> (<b class="a">16π → 64π</b>),',
    'so it takes <b>four</b> 8-inch pizzas, not two: Sam is wrong.',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [4, 1, 6, 2, 0, 5, 3];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.map(i => { const ch = CHIPS[i]!; const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= CLAIMS.length) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: CLAIMS[filled]!.replace(/<[^>]+>/g, ''), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits === filled) {
      used.add(i); filled++; drawChain(); fbHost.replaceChildren();
      const n = filled;
      sayOnly(`p.c${n}`);
      seq(async alive => {
        if (n === 1) { tr.set('p.C1', 1, 1.0); await pulse('p.', ['tag0', 'tag1.0', 'tag1.1'], alive); }
        if (n === 2) { tr.set('p.C', 1, 1.6); tr.set('p.C2', 1, 1.0, 0.6); }
        if (n === 3) {
          tr.set('p.C1:dim', 1, 0.5); tr.set('p.C2:dim', 1, 0.5);
          tr.set('p.quad', 1, 2.0); await wait(1.4); if (!alive()) return;
          tr.set('p.C3', 1, 1.0);
        }
        if (n === 4) {
          tr.set('p.C3:dim', 1, 0.5);
          tr.set('p.C4', 1, 1.0); await wait(1.2); if (!alive()) return;
          tr.set('p.strike', 1, 0.6); await wait(1.2); if (!alive()) return;
          chipBox.remove();
          fbHost.replaceChildren(fbSaid(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
        }
      });
      return;
    }
    fbHost.replaceChildren(fbSaid(false, ch.say ?? 'p.no.other'));
  }
  const verdict = h('div', { class: 'row' });
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  verdict.append(yes, no);
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: two 8-inch pizzas are as much as one 16-inch pizza. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.areaByK : undefined });
    const lead = right ? html('p', '', SCRIPT['p.test']!.h) : said('p.build');
    if (right) void ctx.say('p.test').then(() => { if (ctx.progress.part === 3) sayOnly('p.build'); });
    proofHost.replaceChildren(lead, ...(right ? [html('p', 'dim', SCRIPT['p.build']!.h)] : []), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), said('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
const PB = box(1300, 70, 1860, 1010);
const PFR = frame(PF.x, PF.y, PF.w, PF.h);
/** a board line that fits the narrower practice board */
function pline(key: string, src: string, y: number, size: number, col?: 'link' | 'ink'): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 44 && texWidth(F, s) > PB.w - 90) s -= 2;
  return { key, F, x: PB.x0 + 45, y, size: s, col };
}
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CircleItem),
  });
}
function showItem(item: CircleItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  let m: DiscBlock | null = null;
  if (item.pict) { try { m = Disc(item.pict.pic, PFR, th); } catch (e) { console.error('circles picture:', e); } }
  if (m && item.pict) {
    const P = item.pict, mm = m;
    const T = pline('x.T', item.board, PB.y0 + 110, 76);
    const Hs = pline('x.S', P.solve.tex || '\\,', PB.y0 + 330, 80, 'link');
    setScene({
      table: 1080,
      model: c => mm.draw(c, progressOf(s => tr.k('x.' + s)), { hl: P.solve.hl !== undefined ? [{ seg: P.solve.hl, k: tr.k('x.hl') }] : [] }),
      lines: [T, Hs], leads: [], boardBox: PB,
    });
    const rest = P.rest ?? restSteps(P.pic);
    rest.forEach((k, i) => tr.set('x.' + k, 1, k === 'move' ? 1.4 : 0.7, 0.1 + i * 0.35));
    tr.set('x.T', 1, 0.8, 0.4);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        for (const k of P.solve.hide ?? []) tr.set('x.' + k, 0, 0.5);
        if (P.solve.hl !== undefined) tr.set('x.hl', 1, 0.6);
        for (const k of P.solve.show ?? []) { tr.set('x.' + k, 1, k === 'roll' ? 2.2 : k === 'quad' ? 1.6 : 0.9); await wait(k === 'roll' ? 2.3 : 0.5); if (!alive()) return; }
        await wait(0.4); if (!alive()) return;
        if (P.solve.tex) tr.set('x.S', 1, 1.0);
      },
    };
  }
  const big = box(300, 260, 1620, 760);
  setScene({ table: 1080, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{top Sam: in ft sq 8-in 16-in}', '\\pi \\approx \\tfrac{1}{2} \\times \\div \\neq \\to r^2'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
