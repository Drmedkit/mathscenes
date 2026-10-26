// units-and-quantities.ts: "Reasoning with units" (Algebra 1, lesson 2; HSN-Q.A.1, A.3) on the shared lesson runtime.
//   1 The question   a greyhound at 44 ft/s against a car at 40 mi/h: which is faster? 3 cards (greyhound = compares the
//                    numerals; can't compare = thinks different labels are different dimensions; the car = right)
//   2 Worked example four steps on a unit-factor chain: read the quantity, seconds -> hours (a factor equal to 1, turned
//                    so s cancels), feet -> miles (ft cancels), compare in one unit; then the two lanes race for ONE second
//                    (the fair test: the car covers 58.7 ft, the dog 44 ft); one "why?" (why 3600 s over 1 h)
//   3 Your turn      60 mi/h in ft/s, faded from the start: miles -> feet is given, the kid turns the hour factor and
//                    finds 88 ft/s, then checks it another way (a mile a minute) while the car races one second
//   4 Prove it       Jo: 120 ft² × 12 = 1,440 in². A 12 x 10 ft floor, one square foot zoomed into 12 x 12 square inches;
//                    a because-chain from reason chips (distractors = linear factor for area, units as decoration)
//   5 Practice       all 23 sub-goals one after another, then mixed (runtime/practice.ts); pictures: unit chains, a ruler
//                    with the rounding band, square-unit grids and cubes, a two-scale thermometer, kit Planes
// Voiced lines: pages/lessons/units-and-quantities/voice/lines.json. Every answer is logged (runtime/store.ts).
import type { Canvas } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texDraw, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { frame, tryBlock } from '../../src/blocks/block';
import { slate } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { setScene, seq, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { Plane, type PItem } from '../../src/lesson/kit/Plane';
import { Race, type RaceStep, type Lane } from '../../src/lesson/topics/units-and-quantities/Race';
import { Chain, type ChainBlock } from '../../src/lesson/topics/units-and-quantities/Chain';
import { Ruler, type RulerStep } from '../../src/lesson/topics/units-and-quantities/Ruler';
import { Grid, type GridStep } from '../../src/lesson/topics/units-and-quantities/Grid';
import { Thermo, type ThermoStep } from '../../src/lesson/topics/units-and-quantities/Thermo';
import { FAMILY_NAMES, GENERATORS, MC, type ChainPic, type PlanePic, type UItem } from '../../src/lesson/topics/units-and-quantities/items';
import { PLAN } from '../../src/lesson/topics/units-and-quantities/plan';
import { explain } from '../../src/lesson/topics/units-and-quantities/explain';
import { fmt, fmtT, mixedT, qn } from '../../src/lesson/topics/units-and-quantities/units';
import LINES from './units-and-quantities/voice/lines.json';

const SLUG = 'units-and-quantities';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== shared drawing =====================
const RACE_FR = frame(60, 40, 1800, 450);
const SLATE = box(60, 520, 1860, 1030);
/** a TeX line centred at (cx, y), shrunk to fit maxW; drawn with write-on k = tr.k(key), dimmed by key:dim */
interface TLine { key: string; F: Formula; x: number; y: number; size: number; tags?: Record<string, { col: Paint }> }
function tline(key: string, src: string, cx: number, y: number, size: number, maxW = 1660, tags?: Record<string, { col: Paint }>): TLine {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > maxW) s -= 2;
  return { key, F, x: cx - texWidth(F, s) / 2, y, size: s, tags };
}
function drawT(c: Canvas, L: TLine): void {
  const k = tr.k(L.key);
  if (k <= 0) return;
  texDraw(c, L.F, L.x, L.y, { size: L.size, align: 'left', k, alpha: 1 - 0.55 * tr.k(L.key + ':dim'), tags: L.tags as never });
}
function strikeT(c: Canvas, L: TLine, k: number): void {
  if (k <= 0) return;
  const w = texWidth(L.F, L.size), g = c.g;
  g.save(); g.strokeStyle = th.roles.wrong.fill; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(L.x - 12, L.y + 8); g.lineTo(L.x - 12 + (w + 24) * k, L.y + 8 - 22 * k); g.stroke(); g.restore();
}
const P = <S extends string>(pre: string) => progressOf<S>(s => tr.k(pre + s));
const chainK = (pre: string) => (g: number | 'r') => tr.k(`${pre}${g}`);
const DOG: Lane = { who: 'dog', name: 'greyhound', rate: '44 ft/s', ftps: 44 };
const CAR40: Lane = { who: 'car', name: 'car', rate: '40 mi/h', ftps: 40 * 5280 / 3600 };
const CAR60: Lane = { who: 'car', name: 'car', rate: '60 mi/h', ftps: 88 };

// ===================== 1. The question =====================
const CARDS = [
  { t: 'The greyhound', sub: '44 is more than 40', id: MC.numerals, why: 'q.cb.numerals' },
  { t: 'The car', sub: '', id: '', why: 'q.cb.right' },
  { t: "Can't tell", sub: 'the units are different', id: MC.labelsDim, why: 'q.cb.dims' },
];
function partQuestion(): void {
  tr.reset('q.');
  const race = Race({ lanes: [DOG, CAR40], max: 70, step: 10 }, RACE_FR, th);
  const L = tline('q.vs', '\\cssId{d}{44\\,\\text{ft/s}} \\quad\\text{or}\\quad \\cssId{c}{40\\,\\text{mi/h}}\\ ?', 960, 775, 120, 1600, { d: { col: 'second' }, c: { col: 'first' } });
  setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => { slate(c, SLATE); race.draw(c, P<RaceStep>('q.r.')); drawT(c, L); } });
  tr.set('q.r.track', 1, 0.8); tr.set('q.r.lane0', 1, 0.9, 0.5); tr.set('q.r.lane1', 1, 0.9, 1.0); tr.set('q.vs', 1, 1.2, 1.6);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const cd = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A greyhound runs 44 ft/s, a car drives 40 mi/h: which is faster?', board: '44 ft/s vs 40 mi/h', response: cd.t, expected: 'The car', correct: !cd.id, mc: cd.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.t}${cd.sub ? `<small>${cd.sub}</small>` : ''}`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Which is faster?'),
    voiced('q.intro', `A greyhound runs <b class="b">44 ft/s</b>. A car drives <b class="a">40 mi/h</b>. Which one is faster? Pick an answer, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example: 44 ft/s in mi/h =====================
const ROW_A: ChainPic = { start: { n: 44, u: 'ft', bn: 1, bu: 's' }, factors: [{ n: 3600, u: 's', bn: 1, bu: 'h' }], result: { n: 158400, u: 'ft', bn: 1, bu: 'h' } };
const ROW_B: ChainPic = { start: { n: 158400, u: 'ft', bn: 1, bu: 'h' }, factors: [{ n: 1, u: 'mi', bn: 5280, bu: 'ft' }], result: { n: 30, u: 'mi', bn: 1, bu: 'h' } };
function partExample(): void {
  tr.reset('e.');
  const race = Race({ lanes: [DOG, CAR40], max: 70, step: 10 }, RACE_FR, th);
  const A = Chain(ROW_A, 960, 618, 1700, 64, th, 'ea'), Bc = Chain(ROW_B, 960, 790, 1700, 64, th, 'eb');
  const C = tline('e.C', '\\cssId{d}{30\\,\\text{mi/h}} \\;<\\; \\cssId{c}{40\\,\\text{mi/h}}', 960, 955, 72, 1600, { d: { col: 'second' }, c: { col: 'first' } });
  setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => {
    slate(c, SLATE);
    race.draw(c, P<RaceStep>('e.r.'), { ring: [{ lane: 0, col: 'second', k: tr.k('e.ring0') }, { lane: 1, col: 'first', k: tr.k('e.ring1') }] });
    A.draw(c, { k: chainK('e.A.'), strike: tr.k('e.A.x'), alpha: 1 - 0.5 * tr.k('e.A:dim'), glowLeft: tr.k('e.A.glow') });
    Bc.draw(c, { k: chainK('e.B.'), strike: tr.k('e.B.x'), alpha: 1 - 0.5 * tr.k('e.B:dim'), glowLeft: tr.k('e.B.glow') });
    drawT(c, C);
  } });
  for (const s of ['track', 'lane0', 'lane1']) tr.jump('e.r.' + s, 1);
  let step = 0;
  const STEPS = [
    { t: 'Read the quantity', why: 'A number, a unit, and what it measures.', act: 'Read it' },
    { t: 'Seconds to hours', why: 'Multiply by a factor that equals 1.', act: 'Convert' },
    { t: 'Feet to miles', why: 'One more factor, turned so feet cancel.', act: 'Convert' },
    { t: 'Compare in one unit', why: 'Then race them for one second.', act: 'Race' },
  ];
  const SAY = [
    `<b class="b">44 ft/s</b> means 44 feet in every 1 second: a speed. The car’s <b class="a">40 mi/h</b> is a speed too, in other units. Write the dog’s as a fraction: 44 ft over 1 s.`,
    `1 h = 3,600 s, so 3,600 s over 1 h is just 1. Seconds go on top, so they cancel the seconds below: <b class="s">158,400 ft/h</b>.`,
    `1 mi = 5,280 ft. Feet go on the bottom, so they cancel the feet on top: 158,400 ÷ 5,280 = <b class="s">30 mi/h</b>.`,
    `30 mi/h is less than 40 mi/h: <b class="s">the car is faster</b>. In one second the car covers about 58.7 ft, the greyhound 44 ft.`,
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
        tr.set('e.ring0', 1, 0.5); await wait(0.8); if (!alive()) return;
        tr.set('e.A.0', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.ring1', 1, 0.5); await wait(1.0); if (!alive()) return;
        tr.set('e.ring0', 0, 0.5); tr.set('e.ring1', 0, 0.5);
      } else if (i === 1) {
        tr.set('e.A.1', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.A.x', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('e.A.r', 1, 1.2); tr.set('e.A.glow', 1, 0.6, 0.6); await wait(1.6);
      } else if (i === 2) {
        tr.set('e.A.glow', 0, 0.4); tr.set('e.A:dim', 1, 0.6);
        tr.set('e.B.0', 1, 1.0); await wait(1.1); if (!alive()) return;
        tr.set('e.B.1', 1, 1.2); await wait(1.4); if (!alive()) return;
        tr.set('e.B.x', 1, 0.9); await wait(1.2); if (!alive()) return;
        tr.set('e.B.r', 1, 1.2); tr.set('e.B.glow', 1, 0.6, 0.6); await wait(1.6);
      } else {
        tr.set('e.B.glow', 0, 0.4); tr.set('e.B:dim', 1, 0.6);
        tr.set('e.C', 1, 1.2); await wait(1.5); if (!alive()) return;
        tr.set('e.r.run', 1, 1.0); await wait(1.3); if (!alive()) return;
        tr.set('e.r.marks', 1, 0.8); await wait(1.0);
      }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The seconds on top cancel the seconds on the bottom of ft/s, leaving ft/h.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. The unit you want to get rid of goes on the opposite side of the factor, so it cancels.' },
      { t: 'Either way works: both fractions equal 1.', ok: false, id: 'e.why.flip', mc: MC.flip, say: 'Both equal 1, but the other way leaves ft·h/s², a unit that means nothing. Only one way cancels the seconds.' },
      { t: 'The bigger number always goes on top.', ok: false, id: 'e.why.big', mc: MC.wrongOp, say: 'Numbers don’t decide it, units do. The seconds must cancel, so seconds go on top, whatever the numbers.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the factor 3,600 s over 1 h, not 1 h over 3,600 s?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why is the factor 3,600 s over 1 h, and not 1 h over 3,600 s?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the picture moves first, then the units.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 60 mi/h in ft/s =====================
const TURN_A: ChainPic = { start: { n: 60, u: 'mi', bn: 1, bu: 'h' }, factors: [{ n: 5280, u: 'ft', bn: 1, bu: 'mi' }], result: { n: 316800, u: 'ft', bn: 1, bu: 'h' } };
const TURN_B = (hideFactor: boolean): ChainPic => ({ start: { n: 316800, u: 'ft', bn: 1, bu: 'h' }, factors: [{ n: 1, u: 'h', bn: 3600, bu: 's', hide: hideFactor }], result: { n: 88, u: 'ft', bn: 1, bu: 's', hide: true } });
function partTurn(): void {
  tr.reset('t.');
  const race = Race({ lanes: [CAR60], max: 100, step: 10 }, frame(60, 90, 1800, 400), th);
  const A = Chain(TURN_A, 960, 640, 1700, 64, th, 'ta');
  const Bq = Chain(TURN_B(true), 960, 830, 1700, 64, th, 'tq'), Bf = Chain(TURN_B(false), 960, 830, 1700, 64, th, 'tf');
  const K = tline('t.K', '\\tfrac{5{,}280\\,\\text{ft}}{60\\,\\text{s}} = 88\\,\\text{ft/s}\\ \\checkmark', 960, 975, 64, 1600);
  setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => {
    slate(c, SLATE);
    race.draw(c, P<RaceStep>('t.r.'));
    A.draw(c, { k: chainK('t.A.'), strike: tr.k('t.A.x'), alpha: 1 - 0.5 * tr.k('t.A:dim') });
    const kf = tr.k('t.Bf');
    Bq.draw(c, { k: chainK('t.B.'), strike: 0, reveal: 0, alpha: 1 - kf });
    Bf.draw(c, { k: g => (g === 1 ? 1 : tr.k('t.B.' + g)), strike: tr.k('t.B.x'), reveal: tr.k('t.Bres'), alpha: kf, glowLeft: tr.k('t.B.glow') });
    drawT(c, K);
  } });
  tr.set('t.r.track', 1, 0.8); tr.set('t.r.lane0', 1, 0.9, 0.5);
  let step = 0;
  const STEPS = [
    { t: 'Read the quantity', why: 'Done for you: 60 mi in each 1 h.' },
    { t: 'Miles to feet', why: 'Done for you: × 5,280 ft over 1 mi.' },
    { t: 'Hours to seconds', why: 'Your step.' },
    { t: 'Check it', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: feet per second'), voiced('t.intro', `A car drives <b class="a">60 mi/h</b>. How many feet does it cover each second? The first two steps are done for you.`), plan, work);
  seq(async alive => {
    await wait(2.4); if (!alive()) return;
    tr.set('t.A.0', 1, 1.0); await wait(1.2); if (!alive()) return;
    step = 1; drawPlan();
    tr.set('t.A.1', 1, 1.0); await wait(1.1); if (!alive()) return;
    tr.set('t.A.x', 1, 0.8); await wait(1.0); if (!alive()) return;
    tr.set('t.A.r', 1, 1.0); await wait(1.3); if (!alive()) return;
    tr.set('t.A:dim', 1, 0.5); tr.set('t.B.0', 1, 1.0); tr.set('t.B.1', 1, 0.8, 0.5); tr.set('t.B.r', 1, 0.8, 0.9); await wait(1.8); if (!alive()) return;
    step = 2; drawPlan(); askFactor();
  });
  function askFactor(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const fr = (a: string, b: string) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
    const opts = [
      { t: fr('1 h', '3,600 s'), ok: true, id: 't.pick.ok', mc: undefined as string | undefined, say: 'Yes: hours on top cancel the hours below, and seconds are left on the bottom.' },
      { t: fr('3,600 s', '1 h'), ok: false, id: 't.pick.flip', mc: MC.flip as string | undefined, say: 'That puts seconds on top and leaves ft·s/h². The hours must cancel, so hours go on top.' },
      { t: fr('1 h', '60 min'), ok: false, id: 't.pick.min', mc: undefined as string | undefined, say: 'That would give feet per minute. You want seconds: 1 h is 3,600 s.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.factor', prompt: '316,800 ft/h to ft/s: which factor?', response: o.t.replace(/<[^>]+>/g, ' '), expected: '1 h / 3,600 s', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) return;
      done = true;
      seq(async alive => { tr.set('t.Bf', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('t.B.x', 1, 0.9); await wait(1.1); if (!alive()) return; askX(); });
    })));
    work.replaceChildren(voiced('t.pick', 'Now turn hours into seconds. Which factor do you multiply by?'), bx, fbHost);
  }
  function askX(): void {
    const fbHost = h('div'), inp = numInput('ft/s', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.x.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = Math.abs(v - 88) < 1e-9;
      const mc = v === 316800 ? MC.oneUnit : v === 316800 * 3600 ? MC.flip : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: '316,800 ft/h × 1 h/3,600 s = ? ft/s', response: v, expected: 88, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(v === 316800 ? voicedFb('t.x.top', false, '316,800 is still per HOUR: only the top was converted. Divide by 3,600 to cancel the hours.')
          : v === 316800 * 3600 ? voicedFb('t.x.flip', false, 'That multiplies by 3,600. The hours cancel only when 3,600 s is on the bottom: divide.')
            : v === 5280 ? voicedFb('t.x.min', false, '5,280 is feet per MINUTE. A minute is 60 seconds.')
              : voicedFb('t.x.no', false, 'Divide 316,800 by 3,600. Tip: cancel two zeros first, 3,168 ÷ 36.'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.x.ok', true, 'Yes: 316,800 ÷ 3,600 = <b class="s">88 ft/s</b>.'));
      seq(async alive => { tr.set('t.Bres', 1, 0.9); tr.set('t.B.glow', 1, 0.6, 0.5); await wait(1.4); if (!alive()) return; step = 3; drawPlan(); askCheck(); });
    }
    work.replaceChildren(voiced('t.x', 'Cancel the hours. How many feet per second is that?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div'), inp = numInput('ft/s', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.x.empty', false, 'Type a number first.')); return; }
      const right = r.v === 88;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'A mile a minute: 5,280 ft ÷ 60 s = ?', response: r.v, expected: 88, correct: right, mc: undefined });
      if (!right) { fbHost.replaceChildren(voicedFb('t.check.no', false, '5,280 ÷ 60: think 528 ÷ 6.')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.check.ok', true, '88 again, by another route. Watch the car cover 88 feet in one second.'));
      seq(async alive => {
        tr.set('t.B.glow', 0, 0.4); tr.set('t.K', 1, 1.1); await wait(1.2); if (!alive()) return;
        tr.set('t.r.run', 1, 1.0); await wait(1.2); if (!alive()) return; tr.set('t.r.marks', 1, 0.8); await wait(1.2); if (!alive()) return;
        step = 4; drawPlan(); fbHost.append(callback());
      });
    }
    work.replaceChildren(voiced('t.check', 'Check it another way. Sixty miles an hour is a mile a minute: 5,280 ft in 60 s. How many ft/s?'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': 'At the start you picked the car, and you were right. Now you can show why: one unit first, then compare.',
      'q.cb.numerals': 'At the start you picked the greyhound, because 44 is more than 40. But those numbers were in different units: 44 ft/s is only 30 mi/h.',
      'q.cb.dims': 'At the start you said you can’t tell. You can: both are speeds, so unit factors turn one into the other’s unit.',
      'q.cb.none': 'Same kind of quantity? Then convert to one unit, and compare.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Jo's square inches =====================
function partProve(): void {
  tr.reset('p.');
  const grid = Grid({ n: 12, big: 'ft', small: 'in', room: [12, 10] }, frame(60, 30, 1800, 660), th);
  const SL = box(60, 700, 1860, 1030);
  const J = tline('p.J', '\\text{Jo:}\\ \\ 120\\,\\text{ft}^2 \\times 12 = 1{,}440\\,\\text{in}^2', 960, 770, 66, 1600);
  const L1 = tline('p.L1', '1\\,\\text{ft}^2 = 12\\,\\text{in} \\times 12\\,\\text{in} = \\cssId{v}{144\\,\\text{in}^2}', 960, 870, 66, 1600, { v: { col: 'link' } });
  const L2 = tline('p.L2', '120 \\times 144 = \\cssId{v}{17{,}280\\,\\text{in}^2}', 960, 968, 66, 1600, { v: { col: 'link' } });
  setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => {
    slate(c, SL);
    grid.draw(c, P<GridStep>('p.g.'), { wrongRow: tr.k('p.wrongRow') });
    drawT(c, J); strikeT(c, J, tr.k('p.strike')); drawT(c, L1); drawT(c, L2);
  } });
  tr.set('p.g.room', 1, 1.0); tr.set('p.J', 1, 1.2, 1.0); tr.set('p.g.pick', 1, 0.8, 2.0); tr.set('p.g.square', 1, 0.9, 2.6);
  const CHIPS = [
    { t: '× 12 fills only one row of 12 square inches in each square foot.', fits: 0 },
    { t: 'It is 12 in by 12 in: 12 rows of 12 square inches.', fits: 1 },
    { t: 'Each of the 120 square feet holds 144 square inches.', fits: 2 },
    { t: 'Changing feet to inches always multiplies by 12.', fits: -1, mc: MC.linear, id: 'p.no.twelve', say: 'That holds for lengths. A square foot is 12 in long in TWO directions, so its factor is 12 × 12.' },
    { t: 'ft² is just a label, so convert the number like a length.', fits: -1, mc: MC.decor, id: 'p.no.label', say: 'The ² is part of the unit: two lengths multiplied. Squaring the unit squares the factor.' },
  ];
  const CLAIMS = [
    'Jo’s <b>1,440 in²</b> is far too small,',
    'One square foot holds <b>144 in²</b>,',
    'The floor is <b class="s">120 × 144 = 17,280 in²</b>,',
  ];
  const SAYC = [
    'Right. Twelve square inches make one row. A square foot has twelve rows.',
    'Right. Twelve rows of twelve: 144 square inches in each square foot.',
    'Right. 120 square feet, 144 square inches each: 17,280 square inches.',
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
      if (n === 1) {
        tr.set('p.g.side', 1, 0.8); await wait(0.9); if (!alive()) return;
        tr.set('p.wrongRow', 1, 0.3); tr.set('p.g.row', 1, 1.0); await wait(1.6); if (!alive()) return;
        tr.set('p.strike', 1, 0.7); await wait(0.9); if (!alive()) return; tr.set('p.J:dim', 1, 0.5);
      }
      if (n === 2) { tr.set('p.wrongRow', 0, 0.4); tr.set('p.g.fill', 1, 2.6); await wait(2.7); if (!alive()) return; tr.set('p.L1', 1, 1.2); await wait(1.3); }
      if (n === 3) {
        tr.set('p.L2', 1, 1.2); await wait(1.5); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason, and the grid backs every one. An area unit squares the factor: 12 × 12, not 12.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jo is right', () => judge(true)), no = btn('Jo is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jo: 120 ft² × 12 = 1,440 in². Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.linear : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Jo converts a <b class="a">12 ft by 10 ft</b> floor into square inches: 120 ft² × 12 = 1,440 in². Is Jo right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as UItem),
  });
}
const PIC_FR = frame(60, 60, 1800, 640), BOARD_SL = box(60, 730, 1860, 1030);
/** the board line under a picture (never the answer: it is the item's own setup) */
function boardLine(src: string): TLine { return tline('x.B', src, 960, 880, 84, 1640); }
function planeOf(p: PlanePic, fr: ReturnType<typeof frame>, solved: () => number) {
  const items: PItem[] = [];
  p.bars?.forEach((b, i) => items.push({ kind: 'shade', key: `bar${i}`, lo: b.x - 0.3, hi: b.x + 0.3, top: () => b.v, bottom: 'bottom', col: i ? 'second' : 'first', alpha: 0.7 }));
  if (p.line) items.push({ kind: 'curve', key: 'line', f: x => p.line![0]![1] + ((p.line![1]![1] - p.line![0]![1]) * (x - p.line![0]![0])) / (p.line![1]![0] - p.line![0]![0]), lo: p.line[0]![0], hi: p.line[1]![0], ends: ['closed', 'closed'] });
  p.dots?.forEach((d, i) => items.push({ kind: 'point', key: `dot${i}`, x: d[0], y: d[1], col: 'first' }));
  const lab = (A: typeof p.x) => (A.labels ? (v: number) => A.labels![Math.round((v - A.min) / A.step)] ?? '' : undefined);
  void solved;
  return Plane({ x: { min: p.x.min, max: p.x.max, step: p.x.step, name: p.x.name, fmt: lab(p.x) }, y: { min: p.y.min, max: p.y.max, step: p.y.step, name: p.y.name, fmt: lab(p.y) }, items }, fr, th);
}
function showItem(item: UItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture ?? {};
  // a unit chain: the chain IS the board (a wide slate)
  if (pic.chain) {
    const made = tryBlock(() => Chain(pic.chain!, 960, 520, 1640, 96, th, 'x'));
    if (made.ok) {
      const Ch = made.value, nF = pic.chain.factors.length;
      const BOX = box(60, 140, 1860, 900);
      setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => { slate(c, BOX); Ch.draw(c, { k: chainK('x.c.'), strike: tr.k('x.strike') * 3, reveal: tr.k('x.rev'), glowLeft: tr.k('x.glow') }); } });
      tr.set('x.c.0', 1, 0.9, 0.1); for (let i = 1; i <= nF; i++) tr.set(`x.c.${i}`, 1, 0.9, 0.3 + 0.4 * i); tr.set('x.c.r', 1, 0.8, 0.5 + 0.4 * nF);
      return { solve: async alive => { tr.set('x.rev', 1, 0.9); await wait(1.0); if (!alive()) return; tr.set('x.strike', 1, 1.8); await wait(1.9); if (!alive()) return; tr.set('x.glow', 1, 0.6); } };
    }
    console.warn(made.error);
  }
  const B = boardLine(item.board);
  const withBoard = (draw: (c: Canvas) => void) => setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => { draw(c); slate(c, BOARD_SL); drawT(c, B); } });
  if (pic.ruler) {
    const r = pic.ruler;
    const label = (v: number) => (r.den ? mixedT(qn(Math.round(v * r.den), r.den)) : fmtT(Math.round(v * 1e6) / 1e6));
    const made = tryBlock(() => Ruler({ lo: r.lo, hi: r.hi, minor: r.minor, major: r.major, v: r.v, res: r.res, unit: r.unit, label, probe: r.probe,
      scaled: r.scaled ? { lo: fmtT(Math.round(r.scaled.lo * 1e5) / 1e5), hi: fmtT(Math.round(r.scaled.hi * 1e5) / 1e5), unit: r.scaled.unit, by: r.scaled.by } : undefined }, PIC_FR, th));
    if (made.ok) {
      const Ru = made.value;
      withBoard(c => Ru.draw(c, P<RulerStep>('x.r.')));
      tr.set('x.r.line', 1, 0.6); tr.set('x.r.ticks', 1, 0.9, 0.3); tr.set('x.r.value', 1, 0.7, 0.9); tr.set('x.B', 1, 0.8, 0.4);
      if (r.probe !== undefined) tr.set('x.r.probe', 0, 0.1);
      return { solve: async alive => { tr.set('x.r.band', 1, 1.2); await wait(1.3); if (!alive()) return; tr.set('x.r.ends', 1, 0.8); await wait(0.9); if (!alive()) return; if (r.probe !== undefined) tr.set('x.r.probe', 1, 0.6); if (r.scaled) tr.set('x.r.scaled', 1, 1.0); } };
    }
    console.warn(made.error);
  }
  if (pic.grid) {
    const made = tryBlock(() => Grid(pic.grid!, PIC_FR, th));
    if (made.ok) {
      const G = made.value;
      withBoard(c => G.draw(c, P<GridStep>('x.g.')));
      tr.set('x.g.square', 1, 0.8); tr.set('x.g.side', 1, 0.8, 0.6); tr.set('x.B', 1, 0.8, 0.4);
      return { solve: async alive => { tr.set('x.g.row', 1, 0.8); await wait(1.0); if (!alive()) return; tr.set('x.g.fill', 1, 2.0); await wait(2.1); if (!alive()) return; if (pic.grid!.cube) tr.set('x.g.layers', 1, 1.0); } };
    }
    console.warn(made.error);
  }
  if (pic.thermo) {
    const t = pic.thermo;
    const made = tryBlock(() => Thermo({ cLo: t.cLo, cHi: t.cHi, cStep: t.cStep, fStep: t.fStep, mark: t.mark, rise: t.rise, hide: t.hide }, PIC_FR, th));
    if (made.ok) {
      const T = made.value;
      withBoard(c => T.draw(c, P<ThermoStep>('x.t.'), { reveal: tr.k('x.t.rev') }));
      tr.set('x.t.scales', 1, 0.8); tr.set('x.t.mark', 1, 1.4, 0.6); tr.set('x.t.rise', 1, 1.4, 0.6); tr.set('x.B', 1, 0.8, 0.4);
      return { solve: async alive => { tr.set('x.t.zero', 1, 0.8); await wait(1.0); if (!alive()) return; tr.set('x.t.rev', 1, 0.8); } };
    }
    console.warn(made.error);
  }
  if (pic.planes?.length) {
    const two = pic.planes.length === 2;
    const frames = two ? [frame(90, 120, 840, 590), frame(1020, 120, 840, 590)] : [frame(460, 70, 1000, 640)];
    const made = tryBlock(() => pic.planes!.map((p, i) => planeOf(p, frames[i]!, () => tr.k('x.p.solve'))));
    if (made.ok) {
      const PL = made.value;
      withBoard(c => PL.forEach((pl, i) => {
        pl.draw(c, P<string>('x.p.'));
        const ttl = pic.planes![i]!.title;
        if (ttl) drawWords(c, ttl, frames[i]!.x + frames[i]!.w / 2, 90, 'ink', tr.k('x.p.axes'), { size: 50, align: 'center' });
      }));
      tr.set('x.p.axes', 1, 0.8);
      for (const k of ['line', 'dot0', 'bar0', 'bar1']) tr.set('x.p.' + k, 1, 1.0, 0.6);
      tr.set('x.B', 1, 0.8, 0.4);
      return {};
    }
    console.warn(made.error);
  }
  // no picture: the board line big on a wide slate
  const big = box(160, 260, 1760, 820);
  const L = tline('x.T', item.board, 960, 540, 120, 1440);
  setScene({ boardBox: null, table: 1100, lines: [], leads: [], model: c => { slate(c, big); drawT(c, L); } });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}
void fmt;

void runLesson({
  slug: SLUG,
  warm: ['\\dfrac{44\\,\\text{ft}}{1\\,\\text{s}} \\times \\dfrac{3600\\,\\text{s}}{1\\,\\text{h}}', '\\text{ft}^2\\ \\text{in}^3\\ ^\\circ\\mathrm{F}', '\\checkmark', '\\tfrac{3}{16}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
