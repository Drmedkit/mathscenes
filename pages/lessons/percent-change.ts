// percent-change.ts: percent increase and decrease (grade 7, 7.RP.A.3), on the shared lesson runtime.
//   1 The question   $40 -> $50 sneakers: 25%, 20% (the new price as base) or 10% (the dollars as percent)? + how sure
//   2 Worked example the ChangeTape model: mark the base (cut into 4, a percent scale), find the change, compare it
//                    with the base (the change slides onto one section), name it; one "why?" with 3 reasons
//   3 Your turn      $250 -> $200, faded from the end: base and change given, the kid finds the percent and names it
//   4 Prove it       Sam: "$50 back to $40 is a 25% decrease"; a because-chain from reason chips (distractors = the
//                    catalogue misconceptions); the picture backs each line, then Sam's 25% is struck
//   5 Practice       all 19 sub-goals one after another, then mixed (runtime/practice.ts)
// Every panel line of parts 1-4 is voiced (V below, texts in percent-change/voice/lines.json). Every answer is logged.
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { frame, tryBlock } from '../../src/blocks/block';
import { BOARD, MF, bigLine, bump, line, type Lead, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput, type Kid } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { fr } from '../../src/lesson/runtime/item';
import { ChangeTape, type ChangeTapeBlock, type ChangeTapeFocus, type ChangeTapeParams } from '../../src/lesson/topics/percent-change/ChangeTape';
import { FAMILY_NAMES, GENERATORS, MC, type ChangeItem, type TapePic } from '../../src/lesson/topics/percent-change/items';
import { roundTo, texNum } from '../../src/lesson/topics/percent-change/changeMaths';
import { explain } from '../../src/lesson/topics/percent-change/explain';
import { PLAN } from '../../src/lesson/topics/percent-change/plan';

const SLUG = 'percent-change';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
const MONEY = { money: true };

// ---------- the voiced panel lines (spoken text: voice/lines.json, same ids) ----------
const V: Record<string, string> = {
  'q.intro': `A pair of sneakers cost <b class="a">$40</b>. Now the same pair costs <b>$50</b>. By what percent did the price go up?`,
  'e.intro': 'Four steps. Press each one, and watch the picture first.',
  'e.step0': `The price before the change, <b class="a">$40</b>, is the base: it is 100%. Cut it into 4 equal parts: each part is $10, or 25%.`,
  'e.step1': `The price went up by <b class="b">$10</b>. That is the change. It is not the new price.`,
  'e.step2': `The <b class="b">$10</b> is exactly one of the 4 parts of the base. 10 out of 40 is ${fr(1, 4)}, and ${fr(1, 4)} is <b class="s">25%</b>.`,
  'e.step3': `So the price went up 25%: a <b class="s">25% increase</b>. $50 is 125% <i>of</i> $40, but the change is 25%.`,
  'e.why': 'Quick check: why divide by 40, and not by 50?',
  'e.why.ok': `Yes. The base is the amount before the change. Here, that’s <b class="a">$40</b>.`,
  'e.why.big': `No: here the base, <b class="a">$40</b>, is the <i>smaller</i> number. The base is the amount before the change, whether it is bigger or smaller.`,
  'e.why.diff': `<b class="b">$10</b> is the change in dollars. A percent compares it with the base: 10 out of 40 is 25%.`,
  't.intro': `Now a phone’s price drops from <b class="a">$250</b> to <b>$200</b>. The first two steps are done for you. Then it’s your turn.`,
  't.pct': `What percent of the base is the <b class="b">$50</b> change?`,
  't.pct.ok': `Yes. $50 is one of the 5 equal parts of $250: ${fr(1, 5)}, which is <b class="s">20%</b>.`,
  't.pct.base': `That compares $50 with $200, the new price. The base is the price before the change: <b class="a">$250</b>.`,
  't.pct.diff': `50 is the change in dollars. Compare it with the base: 50 out of 250.`,
  't.pct.left': `80% is what’s left: $200 is 80% of $250. The change is the part that came off.`,
  't.pct.other': `Not quite. Count the parts: the base is cut into 5 equal parts, and the change is one of them.`,
  't.name': 'Now name the change.',
  't.name.ok': `Yes: a <b class="s">20% decrease</b>. The price went down by one fifth of what it was.`,
  't.name.dir': `The size is right, but the price went down. That’s a decrease.`,
  't.name.left': `$200 is 80% of the old price. The price went down by the other part: 20%.`,
  't.name.base': `25% compares $50 with the new price. Use the price before the change: 20%.`,
  't.back.right': `At the start you picked 25%. You were right, and now you can show why: the $10 change is ${fr(1, 4)} of the $40 base.`,
  't.back.new': `At the start you picked 20%. That divides 10 by 50, the new price. The base is the price before: $40. So it’s <b class="s">25%</b>.`,
  't.back.diff': `At the start you picked 10%. $10 is the change in dollars. Compared with the $40 base, it’s <b class="s">25%</b>.`,
  't.back.none': `At the start: $40 to $50 is a <b class="s">25% increase</b>.`,
  't.sure0': 'You said you were guessing.',
  't.sure1': 'You said you were pretty sure.',
  't.sure2': 'You said you were certain.',
  't.done': 'Same rule both times: the change is compared with the amount <b>before</b> the change.',
  'p.intro': `The sneakers went from <b class="a">$40</b> to <b>$50</b>: a 25% increase. Then they go on sale, back to $40. Sam says: “That’s a 25% decrease.” Is Sam right?`,
  'p.build.wrong': 'Then prove it. Fill each “because” with the reason that makes the line true.',
  'p.build.right': 'Let’s test it. Build the argument, and see where it leads.',
  'p.c1': `Right. 50 − 40 = 10: the sale takes <b class="b">$10</b> off.`,
  'p.c2': `This time the base is <b class="a">$50</b>, the price before the sale. Cut it into 5 equal parts of $10.`,
  'p.c3': `$10 is one of those 5 parts: ${fr(1, 5)}, or <b class="s">20%</b>. So it’s a 20% decrease, not 25%.`,
  'p.done': `That’s a proof. The same $10, but a different base: up 25%, then down only 20%.`,
  'p.no.cancel': `That’s Sam’s idea, the one we’re testing. Going up and coming down don’t use the same base.`,
  'p.no.big': `Here $50 is the base, but not because it is bigger: it’s the price before the sale. In the rise from $40 to $50, the base was the smaller $40.`,
  'p.no.diff': `$10 is the change in dollars, not a percent. A percent compares it with the base.`,
  'p.no.other': `True, but it’s the reason for a different line. Which reason makes this line true?`,
};
/** a voiced paragraph: shows the line and says it */
function said(id: string, cls = ''): HTMLElement { void ctx.say(id); return html('p', cls, V[id]!); }
function saidFb(ok: boolean, id: string, extra: Kid[] = []): HTMLElement { void ctx.say(id); return feedback(ok, V[id]!, extra); }

// ---------- the model on the stage ----------
interface TapeScene { pre: string; model: ChangeTapeBlock | null; second?: ChangeTapeBlock | null; lines: Line[]; leads: Lead[]; focus?: () => ChangeTapeFocus; extra?: (c: Canvas) => void; boardBox?: Box | null }
function setTape(S: TapeScene): void {
  setScene({
    table: 1080,
    model: c => {
      S.model?.draw(c, progressOf(s => tr.k(S.pre + s)), S.focus?.());
      S.second?.draw(c, progressOf(s => tr.k(S.pre + 'B.' + s)));
    },
    lines: S.lines, leads: S.leads, boardBox: S.boardBox, extra: S.extra,
  });
}
function showRows(pre: string, n: number, delay = 0, o: { change?: boolean; cut0?: boolean; scale0?: boolean } = {}): void {
  for (let i = 0; i < n; i++) {
    const d = delay + i * 0.5;
    tr.set(pre + `row${i}`, 1, 0.9, d); tr.set(pre + `val${i}`, 1, 0.7, d + 0.5);
    if (o.change && i > 0) { tr.set(pre + `chg${i}`, 1, 0.7, d + 0.7); tr.set(pre + `clab${i}`, 1, 0.6, d + 1.1); }
  }
  if (o.cut0) tr.set(pre + 'cut0', 1, 0.9, delay + 0.6);
  if (o.scale0) tr.set(pre + 'scale0', 1, 1.0, delay + 0.9);
}
/** the model's frame; change labels may hang into the empty gutter before the board */
const OVER = 200;
const tape = (p: ChangeTapeParams) => ChangeTape({ overhang: OVER, ...p }, MF, th);
const pulseOf = (pre: string, n: number) => Array.from({ length: n }, (_, i) => tr.k(pre + `pl${i}`));

const CARDS = [
  { v: 20, mc: MC.newBase, back: 't.back.new' },
  { v: 25, mc: '', back: 't.back.right' },
  { v: 10, mc: MC.diffAsPct, back: 't.back.diff' },
];

// ===== 1. The question =====
function partQuestion(): void {
  tr.reset('q.');
  const m = tape({ amounts: [40, 50], names: ['before', 'now'], unit: MONEY });
  const L0 = line('q.l0', '\\$40 \\to \\$50', m.where.tape(1).cy - 150, 88);
  const L1 = line('q.l1', '?\\%\\ \\text{increase}', m.where.tape(1).cy + 40, 92);
  setTape({ pre: 'q.', model: m, lines: [L0, L1], leads: [] });
  showRows('q.', 2, 0.2, { change: true });
  tr.set('q.l0', 1, 0.9, 1.6); tr.set('q.l1', 1, 0.9, 2.2);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Sneakers $40 -> $50: by what percent did the price go up?', board: '\\$40 \\to \\$50', response: `${p.v}%`, expected: '25%', correct: p.v === 25, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.v}%<small>increase</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Forty dollars to fifty'), said('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: $40 -> $50 =====
function partExample(): void {
  tr.reset('e.');
  const m = tape({ amounts: [40, 50], names: ['before', 'now'], unit: MONEY, cuts: [4] });
  const W = m.where, y0 = W.tape(0).cy, y1 = W.tape(1).cy;
  const Q = line('e.q', '?\\%\\ \\text{increase}', BOARD.y0 + 110, 88);
  const H = line('e.hero', '\\text{a}\\ \\cssId{p}{25\\%}\\ \\text{increase}', BOARD.y0 + 110, 92, { p: { col: 'link' } });
  const L1 = line('e.L1', '\\cssId{b}{\\$40} = \\cssId{h}{100\\%}', y0, 80, { b: { col: 'first' }, h: { col: 'first' } });
  const L3 = line('e.L3', '\\frac{\\cssId{c}{10}}{\\cssId{b}{40}} = \\frac{1}{4} = \\cssId{p}{25\\%}', (y0 + y1) / 2 + 14, 76, { c: { col: 'second' }, b: { col: 'first' }, p: { col: 'link' } });
  const L2 = line('e.L2', '\\$50 - \\$40 = \\cssId{c}{\\$10}', y1 + 40, 76, { c: { col: 'second' } });
  const L4 = line('e.L4', '\\$50\\ \\text{is}\\ 125\\%\\ \\text{of}\\ \\$40', Math.min(BOARD.y1 - 70, y1 + 200), 64, undefined, 'dim');
  const leads: Lead[] = [
    { key: 'e.ld1', from: () => partOf(L1, 'h'), to: () => W.tick(0, 4)!, col: 'first' },
    { key: 'e.ld2', from: () => partOf(L2, 'c'), to: () => W.under(1), col: 'second' },
  ];
  setTape({
    pre: 'e.', model: m, lines: [Q, H, L1, L3, L2, L4], leads,
    focus: () => {
      const ks = tr.k('e.fsec'), kt = tr.k('e.ftick'), k25 = tr.k('e.t25');
      const f: ChangeTapeFocus = { pulse: pulseOf('e.', 2) };
      if (ks > 0) return { ...f, sections: [[0, 0]], change: [1], ticks: [[0, 1]], k: ks, col: 'pick' };
      if (kt > 0 || k25 > 0) return { ...f, ticks: [[0, 1]], k: Math.max(kt, k25), col: 'link' };
      return f;
    },
  });
  // the board starts where part 1 left it
  for (const s of ['row0', 'row1', 'val0', 'val1']) tr.jump('e.' + s, 1);
  tr.jump('e.q', 1);

  let step = 0;
  const STEPS = [
    { t: 'Find the base', why: 'The amount before the change is 100%.', act: 'Mark the base' },
    { t: 'Find the change', why: 'Larger minus smaller: the size of the change.', act: 'Find the change' },
    { t: 'Compare it with the base', why: 'Change ÷ base, as a percent.', act: 'Compare' },
    { t: 'Name the change', why: 'The percent, and up or down.', act: 'Name it' },
  ];
  const plan = h('ol', { class: 'plan' });
  const sayBox = h('div');
  const after = h('div');
  const drawPlan = () => {
    plan.replaceChildren(...STEPS.map((s, i) => {
      const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
      if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
      return li;
    }));
  };
  function run(i: number): void {
    step = i + 1; drawPlan();
    sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) {
        void bump('e.pl0', alive);
        tr.set('e.cut0', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('e.scale0', 1, 1.4); await wait(1.2); if (!alive()) return;
        tr.set('e.L1', 1, 0.9); await wait(0.9); if (!alive()) return;
        tr.set('e.ld1', 1, 0.9);
      } else if (i === 1) {
        tr.set('e.ld1', 0, 0.4); tr.set('e.L1:dim', 1, 0.6);
        tr.set('e.chg1', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('e.clab1', 1, 0.7); tr.set('e.L2', 1, 0.9, 0.3); await wait(1.3); if (!alive()) return;
        tr.set('e.ld2', 1, 0.9);
      } else if (i === 2) {
        tr.set('e.ld2', 0, 0.4); tr.set('e.L2:dim', 1, 0.6);
        tr.set('e.slide1', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('e.fsec', 1, 0.5); tr.set('e.L3', 1, 1.1, 0.2); await wait(1.4);
      } else {
        tr.set('e.fsec', 0, 0.5); tr.set('e.L3:dim', 1, 0.6); tr.set('e.slide1', 0, 0.4);
        tr.set('e.q', 0, 0.6); tr.set('e.hero', 1, 1.2, 0.5); await wait(1.6); if (!alive()) return;
        tr.set('e.ftick', 1, 0.6); tr.set('e.L4', 1, 0.9, 0.3); await wait(1.2);
      }
      if (!alive()) return;
      sayBox.replaceChildren(html('p', '', V[`e.step${i}`]!));
      const spoken = ctx.say(`e.step${i}`);
      if (i === 3) { await spoken; if (alive()) selfExplain(); }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The change is compared with the price before the change: $40 is the base.', ok: true, mc: undefined as string | undefined, id: 'e.why.ok' },
      { t: 'You always divide by the bigger number.', ok: false, mc: MC.bySize, id: 'e.why.big' },
      { t: 'The price went up $10, so that’s 10%.', ok: false, mc: MC.diffAsPct, id: 'e.why.diff' },
    ];
    const box2 = h('div', { class: 'opts' });
    const fbHost = h('div');
    opts.forEach(o => box2.append(btn(o.t, () => {
      box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      fbHost.replaceChildren(saidFb(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why divide by 40, and not by 50?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(said('e.why'), box2, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===== 3. Your turn: $250 -> $200 (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const m = tape({ amounts: [250, 200], names: ['last month', 'now'], unit: MONEY, cuts: [5] });
  const W = m.where, y0 = W.tape(0).cy, y1 = W.tape(1).cy;
  const Q = line('t.q', '?\\%\\ \\text{decrease}', BOARD.y0 + 110, 88);
  const H = line('t.hero', '\\text{a}\\ \\cssId{p}{20\\%}\\ \\text{decrease}', BOARD.y0 + 110, 92, { p: { col: 'link' } });
  const L1 = line('t.L1', '\\cssId{b}{\\$250} = \\cssId{h}{100\\%}', y0, 80, { b: { col: 'first' }, h: { col: 'first' } });
  const L3 = line('t.L3', '\\frac{\\cssId{c}{50}}{\\cssId{b}{250}} = \\frac{1}{5} = \\cssId{p}{20\\%}', (y0 + y1) / 2 + 14, 76, { c: { col: 'second' }, b: { col: 'first' }, p: { col: 'link' } });
  const L2 = line('t.L2', '\\$250 - \\$200 = \\cssId{c}{\\$50}', y1 + 40, 76, { c: { col: 'second' } });
  const leads: Lead[] = [
    { key: 't.ld2', from: () => partOf(L2, 'c'), to: () => W.under(1), col: 'second' },
  ];
  setTape({
    pre: 't.', model: m, lines: [Q, H, L1, L3, L2], leads,
    focus: () => {
      const ks = tr.k('t.fsec'), kt = tr.k('t.ftick');
      const f: ChangeTapeFocus = { pulse: pulseOf('t.', 2) };
      if (ks > 0) return { ...f, sections: [[0, 0]], change: [1], ticks: [[0, 1]], k: ks, col: 'pick' };
      if (kt > 0) return { ...f, ticks: [[0, 1]], k: kt, col: 'link' };
      return f;
    },
  });
  showRows('t.', 2, 0.1); tr.set('t.q', 1, 0.8, 1.2);

  let step = 0;
  const STEPS = [
    { t: 'Find the base', why: 'Done for you.' },
    { t: 'Find the change', why: 'Done for you.' },
    { t: 'Compare it with the base', why: 'Your step.' },
    { t: 'Name the change', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' });
  const work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'A phone on sale'), said('t.intro'), plan, work);

  seq(async alive => {
    await wait(2.2); if (!alive()) return;
    void bump('t.pl0', alive);
    tr.set('t.cut0', 1, 1.3); tr.set('t.scale0', 1, 1.3, 0.8); tr.set('t.L1', 1, 0.9, 1.6); await wait(3.0); if (!alive()) return;
    step = 1; drawPlan(); tr.set('t.L1:dim', 1, 0.5);
    tr.set('t.chg1', 1, 1.0); tr.set('t.clab1', 1, 0.7, 0.8); tr.set('t.L2', 1, 0.9, 1.0); tr.set('t.ld2', 1, 0.8, 1.9); await wait(3.2); if (!alive()) return;
    step = 2; drawPlan(); tr.set('t.ld2', 0, 0.4); tr.set('t.L2:dim', 1, 0.5);
    askPct();
  });

  function askPct(): void {
    const fbHost = h('div');
    const inp = numInput('%', () => check());
    const ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(feedback(false, 'Type a number of percent, like 15.')); return; }
      const v = roundTo(r.v, 4);
      const hit = v === 20 ? { id: 't.pct.ok', mc: undefined } : v === 25 ? { id: 't.pct.base', mc: MC.newBase } : v === 50 ? { id: 't.pct.diff', mc: MC.diffAsPct } : v === 80 ? { id: 't.pct.left', mc: MC.pctOfAsChange } : v === 0.2 ? { id: 't.pct.other', mc: MC.unscaled } : { id: 't.pct.other', mc: undefined };
      ctx.store.log({ part: 'turn', item: 'turn.percent', prompt: '$250 -> $200: what percent of the base is the $50 change?', board: '\\$250 \\to \\$200', response: r, expected: 20, correct: v === 20, mc: hit.mc });
      if (v !== 20) { fbHost.replaceChildren(saidFb(false, hit.id)); return; }
      fbHost.replaceChildren(feedback(true, V[hit.id]!));
      const spoken = ctx.say(hit.id);
      ok.disabled = true;
      seq(async alive => {
        tr.set('t.slide1', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('t.fsec', 1, 0.5); tr.set('t.L3', 1, 1.1, 0.2); await wait(2.0); if (!alive()) return;
        await spoken; if (!alive()) return;
        step = 3; drawPlan(); askName();
      });
    }
    work.replaceChildren(said('t.pct'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askName(): void {
    const fbHost = h('div');
    const opts = [
      { t: 'a 20% decrease', ok: true, id: 't.name.ok', mc: undefined as string | undefined },
      { t: 'a 20% increase', ok: false, id: 't.name.dir', mc: undefined },
      { t: 'an 80% decrease', ok: false, id: 't.name.left', mc: MC.pctOfAsChange },
      { t: 'a 25% decrease', ok: false, id: 't.name.base', mc: MC.newBase },
    ];
    const box2 = h('div', { class: 'opts' });
    let done = false;
    opts.forEach(o => box2.append(btn(o.t, () => {
      if (done) return;
      box2.querySelectorAll('button').forEach(b => b.classList.remove('right', 'nope'));
      [...box2.querySelectorAll('button')].find(x => x.textContent === o.t)!.classList.add(o.ok ? 'right' : 'nope');
      ctx.store.log({ part: 'turn', item: 'turn.name', prompt: '$250 -> $200: name the change', response: o.t, expected: 'a 20% decrease', correct: o.ok, mc: o.mc });
      if (!o.ok) { fbHost.replaceChildren(saidFb(false, o.id)); return; }
      done = true;
      box2.replaceChildren(h('div', { class: 'claim ok' }, o.t));
      fbHost.replaceChildren(feedback(true, V[o.id]!));
      seq(async alive => {
        await ctx.voice.say(o.id); if (!alive()) return;
        tr.set('t.fsec', 0, 0.5); tr.set('t.L3:dim', 1, 0.6); tr.set('t.slide1', 0, 0.4);
        tr.set('t.q', 0, 0.6); tr.set('t.hero', 1, 1.2, 0.5); tr.set('t.ftick', 1, 0.6, 1.2); await wait(1.8); if (!alive()) return;
        fbHost.append(await callback(alive));
      });
    })));
    work.replaceChildren(said('t.name'), box2, fbHost);
  }
  async function callback(alive: () => boolean): Promise<HTMLElement> {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, sure = commit().sure;
    const backId = pick === null ? 't.back.none' : CARDS[pick]!.back;
    c.append(html('p', '', V[backId]!));
    if (pick !== null && sure !== null) c.append(html('p', 'dim', V[`t.sure${sure}`]!));
    c.append(html('p', '', V['t.done']!), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    seq(async al => {
      await ctx.voice.say(backId); if (!al()) return;
      if (pick !== null && sure !== null) { await ctx.voice.say(`t.sure${sure}`); if (!al()) return; }
      await ctx.voice.say('t.done');
    });
    void alive;
    return c;
  }
}

// ===== 4. Prove it: Sam's "$50 back to $40 is a 25% decrease" =====
function partProve(): void {
  tr.reset('p.');
  const m = tape({ amounts: [40, 50, 40], names: ['first', 'after the rise', 'on sale'], unit: MONEY, cuts: [4, 5] });
  const W = m.where;
  const J1 = line('p.J1', '\\text{Sam: }\\ \\$50 \\to \\$40', BOARD.y0 + 95, 76);
  const J2 = line('p.J2', '\\text{is}\\ \\cssId{w}{25\\%}\\ \\text{off}', BOARD.y0 + 195, 76);
  const C3 = line('p.C3', '\\frac{\\cssId{c}{10}}{\\cssId{b}{50}} = \\frac{1}{5} = \\cssId{p}{20\\%}', Math.max(BOARD.y0 + 360, W.tape(0).y1 + 40), 76, { c: { col: 'second' }, b: { col: 'first' }, p: { col: 'link' } });
  const C2 = line('p.C2', '\\text{base} = \\cssId{b}{\\$50}', Math.max(BOARD.y0 + 540, W.tape(1).cy), 76, { b: { col: 'first' } });
  const C1 = line('p.C1', '\\$50 - \\$40 = \\cssId{c}{\\$10}', W.tape(2).cy, 76, { c: { col: 'second' } });
  const leads: Lead[] = [
    { key: 'p.ld1', from: () => partOf(C1, 'c'), to: () => W.under(2), col: 'second' },
  ];
  setTape({
    pre: 'p.', model: m, lines: [J1, J2, C3, C2, C1], leads,
    focus: () => {
      const k1 = tr.k('p.f1'), k3 = tr.k('p.f3');
      const f: ChangeTapeFocus = { pulse: pulseOf('p.', 3) };
      if (k3 > 0) return { ...f, sections: [[0, 0], [1, 0]], change: [2], ticks: [[1, 1]], k: k3, col: 'pick' };
      if (k1 > 0) return { ...f, change: [2], k: k1, col: 'second' };
      return f;
    },
    extra: c => {
      const ks = tr.k('p.strike');
      if (ks > 0) { const b = partOf(J2, 'w'); strike(c, b.x0 - 10, b.y1 + 6, b.x1 + 10, b.y0 - 6, ks, { col: 'wrong' }); }
    },
  });
  showRows('p.', 3, 0.1);
  tr.set('p.chg1', 1, 0.8, 1.0); tr.set('p.clab1', 1, 0.6, 1.4); tr.set('p.cut0', 1, 0.9, 1.6); tr.set('p.scale0', 1, 1.0, 1.9);
  tr.set('p.chg2', 1, 0.8, 2.0);
  tr.set('p.J1', 1, 1.0, 1.4); tr.set('p.J2', 1, 0.9, 2.2);

  const CHIPS = [
    { t: '$50 − $40 = $10.', fits: 0 },
    { t: 'A percent change is compared with the amount before the change.', fits: 1 },
    { t: '$10 is one of 5 equal parts of $50, and one fifth is 20%.', fits: 2 },
    { t: 'Going up 25% and coming down 25% always cancel.', fits: -1, mc: MC.addsSucc, id: 'p.no.cancel' },
    { t: 'The bigger number is always the base.', fits: -1, mc: MC.bySize, id: 'p.no.big' },
    { t: 'The price changed by $10, so it changed by 10%.', fits: -1, mc: MC.diffAsPct, id: 'p.no.diff' },
  ];
  const CLAIMS = [
    `The sale takes <b class="b">$10</b> off,`,
    `and this time the base is <b class="a">$50</b>, not $40,`,
    `so it is a <b class="s">20%</b> decrease, not 25%,`,
  ];
  let filled = 0;
  const verdict = h('div', { class: 'row' });
  const chain = h('div', { class: 'chain' });
  const chipBox = h('div', { class: 'chips' });
  const fbHost = h('div');
  const used = new Set<number>();
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
    if (ch.fits !== filled) { fbHost.replaceChildren(saidFb(false, ch.id ?? 'p.no.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(said(`p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        tr.set('p.f1', 1, 0.5); tr.set('p.clab2', 1, 0.7, 0.2); tr.set('p.C1', 1, 1.0, 0.5); await wait(1.6); if (!alive()) return;
        tr.set('p.ld1', 1, 0.9); await wait(1.2); if (!alive()) return; tr.set('p.f1', 0, 0.5);
      }
      if (n === 2) {
        tr.set('p.ld1', 0, 0.4); tr.set('p.C1:dim', 1, 0.5);
        void bump('p.pl1', alive);
        tr.set('p.cut1', 1, 1.3); tr.set('p.scale1', 1, 1.3, 0.8); tr.set('p.C2', 1, 0.9, 1.4); await wait(2.4);
      }
      if (n === 3) {
        tr.set('p.C2:dim', 1, 0.5);
        tr.set('p.slide2', 1, 1.6); await wait(1.6); if (!alive()) return;
        tr.set('p.f3', 1, 0.5); tr.set('p.C3', 1, 1.1, 0.2); await wait(2.0); if (!alive()) return;
        tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        chipBox.remove();
        await ctx.voice.say('p.c3'); if (!alive()) return;
        fbHost.append(said('p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: $50 back to $40 is a 25% decrease. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.addsSucc : undefined });
    (right ? yes : no).classList.add('on');
    proofHost.replaceChildren(said(right ? 'p.build.right' : 'p.build.wrong'), chain, chipBox, fbHost);
    drawChain();
  }
  const proofHost = h('div');
  setPanel(h('h2', {}, 'Prove it'), said('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed (runtime/practice.ts) =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as ChangeItem),
  });
}
const tapeParams = (t: TapePic, extra: Partial<ChangeTapeParams> = {}): ChangeTapeParams => ({ amounts: t.amounts, names: t.names, unit: t.unit, cuts: t.cuts, hide: t.hide, hideChange: t.hideChange, changeTex: t.changeTex, ...extra });
/** the worked line for change i of a tape: change / base = percent (≈ when it does not end) */
function changeLine(key: string, m: ChangeTapeBlock, i: number, y: number): Line {
  const c = m.maths.changes[i]!;
  const p = roundTo(c.pct, 1), exact = Math.abs(p - c.pct) < 1e-9;
  return line(key, `\\cssId{f}{\\frac{\\cssId{c}{${texNum(c.size)}}}{\\cssId{b}{${texNum(c.from)}}}} ${exact ? '=' : '\\approx'} \\cssId{p}{${texNum(p)}\\%}`, y, 72, { c: { col: 'second' }, b: { col: 'first' }, p: { col: 'link' } });
}
/** draw a practice item: one chain of tapes, two tapes side by side on one scale, or the bare notation; and its replay */
function showItem(item: ChangeItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const T = (y: number) => line('x.T', item.board, y, 84);
  if (item.pair) {
    const [p1, p2] = item.pair;
    const maxA = Math.max(...p1.amounts, ...p2.amounts), reserve = 40, scale = (MF.w - reserve) / maxA;
    const r1 = tryBlock(() => ChangeTape(tapeParams(p1, { scale, reserve, overhang: OVER }), frame(MF.x, MF.y, MF.w, 450), th));
    const r2 = tryBlock(() => ChangeTape(tapeParams(p2, { scale, reserve, overhang: OVER }), frame(MF.x, MF.y + 490, MF.w, 450), th));
    if (r1.ok && r2.ok) {
      const a = r1.value, b = r2.value;
      // no title line: both situations are on the tapes, and the panel has the words
      const L1 = changeLine('x.S1', a, 1, a.where.tape(1).cy), L2 = changeLine('x.S2', b, 1, b.where.tape(1).cy);
      setTape({ pre: 'x.', model: a, second: b, lines: [L1, L2], leads: [
        { key: 'x.ld1', from: () => partOf(L1, 'f'), to: () => a.where.under(1), col: 'second' },
        { key: 'x.ld2', from: () => partOf(L2, 'f'), to: () => b.where.under(1), col: 'second' }] });
      showRows('x.', 2, 0, { change: true }); showRows('x.B.', 2, 0.3, { change: true });
      return {
        solve: async alive => {
          tr.set('x.S1', 1, 0.9); tr.set('x.ld1', 1, 0.8, 0.6); await wait(1.4); if (!alive()) return;
          tr.set('x.S2', 1, 0.9); tr.set('x.ld2', 1, 0.8, 0.6);
        },
      };
    }
  }
  const r = item.tape ? tryBlock(() => ChangeTape(tapeParams(item.tape!, { overhang: OVER }), MF, th)) : null;
  if (r && r.ok && item.tape) {
    const m = r.value, n = item.tape.amounts.length;
    const top = T(BOARD.y0 + 110);
    const S: Line[] = [], leads: Lead[] = [];
    for (let i = 1; i < n; i++) {
      const c = m.maths.changes[i]!;
      if (c.dir === 'none' || c.size * m.scale < 14) continue;
      const y = Math.max(BOARD.y0 + 260 + (i - 1) * 170, Math.min(BOARD.y1 - 90, m.where.tape(i).cy));
      const L = changeLine(`x.S${i}`, m, i, y);
      S.push(L);
      if (!item.tape.cuts?.[i]) leads.push({ key: `x.ld${i}`, from: () => partOf(L, 'f'), to: () => m.where.under(i), col: 'second' });
    }
    setTape({ pre: 'x.', model: m, lines: [top, ...S], leads, focus: () => ({ pulse: [tr.k('x.pl0')] }) });
    const showCut = item.family === 'benchPct';
    showRows('x.', n, 0, { change: true, cut0: showCut });
    tr.set('x.T', 1, 0.8, 0.5);
    return {
      solve: async alive => {
        tr.set('x.T:dim', 1, 0.5);
        void bump('x.pl0', alive);
        tr.set('x.reveal', 1, 0.8);
        for (let i = 0; i < n; i++) if (item.tape!.cuts?.[i]) { tr.set(`x.cut${i}`, 1, 0.9); tr.set(`x.scale${i}`, 1, 1.0, 0.5); }
        await wait(1.2); if (!alive()) return;
        for (const L of S) {
          const i = Number(L.key.slice(3));
          tr.set(L.key, 1, 0.9); tr.set(`x.ld${i}`, 1, 0.8, 0.6); await wait(1.5); if (!alive()) return;
          if (L !== S[S.length - 1]) tr.set(`x.ld${i}`, 0, 0.4);
        }
      },
    };
  }
  const big = box(300, 260, 1620, 760);
  setTape({ pre: 'x.', model: null, lines: [bigLine('x.T', item.board, big)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\text{increase}', '\\text{Sam: }'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
