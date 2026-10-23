// scale-basics.ts: "Understand scale: drawings and actual lengths" (grade 7, 7.G.A.1), on the lesson runtime.
// The gentle way in before scale-drawings: a scale is HOW MANY TIMES AS LONG, drawing first, in one unit.
//   1 The question   a skateboard drawn 4 in long, the actual board 32 in: which scale? 1 : 8 / 1 : 28 (the
//                    difference) / 8 : 1 (actual first) + how sure
//   2 Worked example Match the lengths -> Count the copies (8 copies of the drawing's length fill the board) ->
//                    Check the width (8 again: to scale) -> Write the scale 4 : 32 = 1 : 8; one "why?"
//   3 Your turn      a laptop 6 cm by 4 cm, actual 30 cm by 20 cm, faded from the end: the kid finds the width
//                    factor (5) and writes 1 : 5; the callback to part 1
//   4 Prove it       Sam: "1 : 100, so the hallway is 100 cm long" (factor read as a length); a because-chain, the
//                    plan's centimeters map onto blocks of 100 cm, Sam's 100 cm covers one of them
//   5 Practice       all 15 sub-goals one after another, then mixed (runtime/practice.ts)
// Panel lines: src/lesson/topics/scale-basics/script.ts; spoken text: scale-basics/voice/lines.json. Every answer is
// logged with its misconception id.
import { strike } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { tryBlock } from '../../src/blocks/block';
import { BOARD, bigLine, line, markDirty, type Line, partOf, seq, setScene, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { ScalePair, PAIR_STEPS, type PairBlock, type PairFocus } from '../../src/lesson/topics/scale-basics/ScalePair';
import { HALLWAY, LAPTOP, PF, SKATE } from '../../src/lesson/topics/scale-basics/lessonPics';
import { FAMILY_NAMES, GENERATORS, MC, type SBItem } from '../../src/lesson/topics/scale-basics/items';
import { explain } from '../../src/lesson/topics/scale-basics/explain';
import { PLAN } from '../../src/lesson/topics/scale-basics/plan';
import { SCRIPT } from '../../src/lesson/topics/scale-basics/script';

const SLUG = 'scale-basics';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line */
const say = (id: string, cls = ''): HTMLElement => { void ctx.say(id); return html('p', cls, SCRIPT[id] ?? id); };
const fbk = (ok: boolean, id: string, extra: Kid[] = []): HTMLElement => { void ctx.say(id); return feedback(ok, SCRIPT[id] ?? id, extra); };
/** tr.set plus one more frame after the move ends */
function ts(name: string, to: number, d = 0.9, delay = 0): void { tr.set(name, to, d, delay); setTimeout(markDirty, (d + delay) * 1000 + 120); }
const TAGS = { d: { col: 'first' as const }, a: { col: 'second' as const }, s: { col: 'link' as const }, w: { col: 'wrong' as const } };
const Y = (k: number) => BOARD.y0 + k;
const plain = (s: string) => s.replace(/<[^>]+>/g, '');

/** the drawing + actual picture on the left, the board on the right; the picture's steps are tr keys `${pre}${step}` */
function pairScene(pre: string, P: PairBlock | null, lines: Line[], focus?: () => PairFocus, extra?: Parameters<typeof setScene>[0]['extra']): void {
  setScene({
    table: 1080,
    model: c => { if (P) P.draw(c, progressOf(s => tr.k(pre + s)), focus?.()); },
    lines, leads: [], extra,
  });
}
/** fade the picture in: card, drawing, its labels, the actual object and its labels */
function showPair(pre: string, skip: string[] = [], t0 = 0): void {
  const order = ['card', 'fig', 'labD', 'real', 'labA', 'labAw'].filter(s => !skip.includes(s));
  order.forEach((s, i) => ts(pre + s, 1, 0.8, t0 + i * 0.3));
}
/** a glowing pair of sides (len / wid / cross), driven by tr keys `${pre}gl.len` ... */
const glow = (pre: string): PairFocus['pair'] => {
  for (const w of ['len', 'wid'] as const) { const k = tr.k(`${pre}gl.${w}`); if (k > 0) return { which: w, col: 'pick', k }; }
  return undefined;
};

/** a number step in parts 1-4: logs every try with its misconception, voices the feedback */
function numStep(host: HTMLElement, o: {
  prompt: string; unit: string; ans: number; item: string;
  wrongs: { v: number; id: string; mc?: string }[]; miss: string; ok: string; done: () => void;
}): void {
  const fbHost = h('div');
  const inp = numInput(o.unit, () => check());
  const okBtn = btn('Check', () => check(), 'go');
  const t0 = performance.now();
  function check(): void {
    const r = inp.read();
    const v = r && r.kind === 'num' ? r.v : NaN;
    if (!Number.isFinite(v)) { fbHost.replaceChildren(fbk(false, 't.empty')); return; }
    const right = Math.abs(v - o.ans) < 1e-6;
    const w = o.wrongs.find(x => Math.abs(x.v - v) < 1e-6);
    ctx.store.log({ part: 'turn', item: o.item, prompt: plain(SCRIPT[o.prompt] ?? o.prompt), response: r, expected: o.ans, correct: right, mc: right ? undefined : w?.mc, ms: Math.round(performance.now() - t0) });
    if (!right) { fbHost.replaceChildren(fbk(false, w ? w.id : o.miss)); return; }
    okBtn.disabled = true;
    fbHost.replaceChildren(fbk(true, o.ok));
    o.done();
  }
  host.replaceChildren(say(o.prompt), inp.node, h('div', { class: 'row' }, okBtn), fbHost);
  setTimeout(() => inp.focus(), 50);
}

// ===== 1. The question =====
const CARDS = [
  { t: '1 : 8', ok: true, mc: '', cb: 'q.cb.right' },
  { t: '1 : 28', ok: false, mc: MC.diff, cb: 'q.cb.diff' },
  { t: '8 : 1', ok: false, mc: MC.reverse, cb: 'q.cb.rev' },
];
const CARD_ORDER = [1, 0, 2];
function partQuestion(): void {
  tr.reset('q.');
  const P = ScalePair(SKATE, PF);
  const Q1 = line('q.Q1', '\\text{drawing: } \\cssId{d}{4\\text{ in}}', Y(150), 76, TAGS);
  const Q2 = line('q.Q2', '\\text{actual: } \\cssId{a}{32\\text{ in}}', Y(300), 76, TAGS);
  const Q3 = line('q.Q3', '\\text{scale} = \\cssId{d}{1} : \\ ?', Y(470), 80, TAGS);
  pairScene('q.', P, [Q1, Q2, Q3]);
  showPair('q.');
  ts('q.Q1', 1, 0.8, 1.2); ts('q.Q2', 1, 0.8, 1.8); ts('q.Q3', 1, 0.8, 2.4);

  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const p = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'A skateboard drawn 4 in long, the actual board 32 in long: which scale (drawing : actual)?', response: p.t, expected: '1 : 8', correct: p.ok, mc: p.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach(b => b.classList.toggle('on', commit().pick === Number(b.dataset.i)));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  for (const i of CARD_ORDER) {
    const cd = CARDS[i]!, b = h('button', { 'data-i': String(i) });
    b.innerHTML = `<span>${cd.t}</span><small>scale</small>`;
    b.addEventListener('click', () => { commit().pick = i; sync(); });
    cards.append(b);
  }
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'A skateboard, drawn small'), say('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===== 2. Worked example: the skateboard =====
function partExample(): void {
  tr.reset('e.');
  const P = ScalePair(SKATE, PF);
  const E1 = line('e.E1', '\\cssId{d}{4\\text{ in}} \\leftrightarrow \\cssId{a}{32\\text{ in}}', Y(100), 76, TAGS);
  const E2 = line('e.E2', '\\cssId{d}{1\\text{ in}} \\leftrightarrow \\cssId{a}{8\\text{ in}}', Y(210), 76, TAGS);
  const E3 = line('e.E3', '\\cssId{a}{32} \\div \\cssId{d}{4} = \\cssId{s}{8}', Y(370), 80, TAGS);
  const E4 = line('e.E4', '\\cssId{a}{32} = \\cssId{s}{8} \\times \\cssId{d}{4}', Y(480), 76, TAGS);
  const E5 = line('e.E5', '\\cssId{a}{8} \\div \\cssId{d}{1} = \\cssId{s}{8}\\ \\checkmark', Y(610), 80, TAGS);
  const E6 = line('e.E6', '\\cssId{d}{4} : \\cssId{a}{32} = \\cssId{d}{1} : \\cssId{a}{8}', Y(750), 80, TAGS);
  const E7 = line('e.E7', '\\text{drawing} : \\text{actual}', Y(855), 62, undefined, 'dim');
  pairScene('e.', P, [E1, E2, E3, E4, E5, E6, E7], () => ({ pair: glow('e.') }));
  for (const s of ['card', 'fig', 'labD', 'real', 'labA', 'labAw']) tr.jump('e.' + s, 1);

  let step = 0;
  const STEPS = [
    { t: 'Match the lengths', why: 'Length with length, width with width.', act: 'Match' },
    { t: 'Count the copies', why: 'How many drawing lengths fit?', act: 'Lay them out' },
    { t: 'Check the width', why: 'One factor for every length?', act: 'Check' },
    { t: 'Write the scale', why: 'Drawing first, actual second.', act: 'Write it' },
  ];
  const steps_ = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawSteps = () => steps_.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawSteps();
    sayBox.replaceChildren(say(`e.step${i}`));
    seq(async alive => {
      if (i === 0) {
        ts('e.gl.len', 1, 0.6); ts('e.E1', 1, 1.0, 0.5); await wait(2.2); if (!alive()) return;
        ts('e.gl.len', 0, 0.5); ts('e.gl.wid', 1, 0.6, 0.4); ts('e.E2', 1, 1.0, 0.9); await wait(2.4); if (!alive()) return;
        ts('e.gl.wid', 0, 0.6);
      } else if (i === 1) {
        ts('e.E1:dim', 1, 0.5); ts('e.E2:dim', 1, 0.5);
        ts('e.copyL', 1, 3.6); await wait(3.8); if (!alive()) return;
        ts('e.E3', 1, 1.0); await wait(1.1); if (!alive()) return;
        ts('e.E4', 1, 1.0);
      } else if (i === 2) {
        ts('e.E3:dim', 1, 0.5); ts('e.E4:dim', 1, 0.5);
        ts('e.copyW', 1, 3.0); await wait(3.2); if (!alive()) return;
        ts('e.E5', 1, 1.0);
      } else {
        ts('e.E5:dim', 1, 0.5);
        ts('e.tag', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('e.E6', 1, 1.2); ts('e.E7', 1, 0.8, 1.0); await wait(2.2); if (!alive()) return;
        selfExplain();
      }
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'The actual board is 8 copies of the drawing’s length, and the width fits 8 copies too.', ok: true, id: 'e.why.ok' },
      { t: '32 − 4 = 28: the actual board is 28 inches longer, so the scale is 1 : 28.', ok: false, mc: MC.diff, id: 'e.why.diff' },
      { t: 'Only the length counts; the width can be anything.', ok: false, mc: MC.fewChecks, id: 'e.why.few' },
    ];
    const box_ = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach(o => {
      const b = btn(o.t, () => {
        box_.querySelectorAll('button').forEach(x => x.classList.remove('right', 'nope'));
        b.classList.add(o.ok ? 'right' : 'nope');
        fbHost.replaceChildren(fbk(o.ok, o.id));
        ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why is the scale 1 : 8, and not 1 : 28?', response: o.t, correct: o.ok, mc: o.mc });
        if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
      });
      box_.append(b);
    });
    void ctx.say('e.why');
    after.replaceChildren(h('div', { class: 'label' }, SCRIPT['e.why']!), box_, fbHost);
  }
  drawSteps();
  setPanel(h('h2', {}, 'Watch it worked out'), say('e.intro', 'dim'), steps_, sayBox, after);
}

// ===== 3. Your turn: the laptop (faded from the end) =====
function partTurn(): void {
  tr.reset('t.');
  const P = ScalePair(LAPTOP, PF);
  const T1 = line('t.T1', '\\cssId{d}{6\\text{ cm}} \\leftrightarrow \\cssId{a}{30\\text{ cm}}', Y(100), 76, TAGS);
  const T2 = line('t.T2', '\\cssId{d}{4\\text{ cm}} \\leftrightarrow \\cssId{a}{20\\text{ cm}}', Y(210), 76, TAGS);
  const T3 = line('t.T3', '\\cssId{a}{30} \\div \\cssId{d}{6} = \\cssId{s}{5}', Y(370), 80, TAGS);
  const T4 = line('t.T4', '\\cssId{a}{20} \\div \\cssId{d}{4} = \\cssId{s}{5}\\ \\checkmark', Y(520), 80, TAGS);
  const T5 = line('t.T5', '\\cssId{d}{6} : \\cssId{a}{30} = \\cssId{d}{1} : \\cssId{a}{5}', Y(690), 80, TAGS);
  pairScene('t.', P, [T1, T2, T3, T4, T5], () => ({ pair: glow('t.') }));
  showPair('t.');

  let step = 0;
  const STEPS = [
    { t: 'Match the lengths', why: 'Done for you.' },
    { t: 'Count the copies', why: 'Done for you.' },
    { t: 'Check the width', why: 'Your step.' },
    { t: 'Write the scale', why: 'Your step.' },
  ];
  const steps_ = h('ol', { class: 'plan' }), work = h('div'), given = h('div');
  const drawSteps = () => steps_.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawSteps();
  setPanel(h('h2', {}, 'Your turn: a laptop'), say('t.intro'), steps_, given, work);

  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    ts('t.gl.len', 1, 0.6); ts('t.T1', 1, 1.0, 0.4); await wait(1.8); if (!alive()) return;
    ts('t.gl.len', 0, 0.5); ts('t.gl.wid', 1, 0.6, 0.3); ts('t.T2', 1, 1.0, 0.7); await wait(2.0); if (!alive()) return;
    ts('t.gl.wid', 0, 0.5);
    step = 1; drawSteps();
    ts('t.T1:dim', 1, 0.5); ts('t.T2:dim', 1, 0.5);
    ts('t.copyL', 1, 2.6); await wait(2.8); if (!alive()) return;
    ts('t.T3', 1, 1.0); await wait(1.2); if (!alive()) return;
    given.replaceChildren(say('t.given'));
    step = 2; drawSteps();
    askWidth();
  });
  function askWidth(): void {
    numStep(work, {
      prompt: 't.wid', unit: 'times as long', ans: 5, item: 'turn.width', miss: 't.wid.miss', ok: 't.wid.ok',
      wrongs: [{ v: 16, id: 't.wid.diff', mc: MC.diff }, { v: 0.2, id: 't.wid.rev', mc: MC.reverse }, { v: 20, id: 't.wid.len' }],
      done: () => seq(async alive => {
        ts('t.T3:dim', 1, 0.5);
        ts('t.copyW', 1, 2.4); await wait(2.6); if (!alive()) return;
        ts('t.T4', 1, 1.0); await wait(1.4); if (!alive()) return;
        step = 3; drawSteps(); askScale();
      }),
    });
  }
  function askScale(): void {
    const fbHost = h('div');
    const inp = pairInput('scale', ':', () => check());
    const okBtn = btn('Check', () => check(), 'go');
    const t0 = performance.now();
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fbk(false, 't.empty')); return; }
      const { x, y } = r, eq = (a: number, b: number) => Math.abs(a - b) < 1e-9;
      const right = eq(x, 1) && eq(y, 5);
      const hit = right ? null
        : eq(x, 5) && eq(y, 1) ? { id: 't.scale.rev', mc: MC.reverse as string | undefined }
          : eq(y - x, 24) || (eq(x, 1) && eq(y, 24)) ? { id: 't.scale.diff', mc: MC.diff as string | undefined }
            : eq(x, 1) && eq(y, 30) ? { id: 't.scale.one', mc: MC.oneTerm as string | undefined }
              : x > 0 && eq(y / x, 5) ? { id: 't.scale.equiv', mc: undefined }
                : { id: 't.scale.miss', mc: undefined };
      ctx.store.log({ part: 'turn', item: 'turn.scale', prompt: plain(SCRIPT['t.scale']!), response: r, expected: '1 : 5', correct: right, mc: hit?.mc, ms: Math.round(performance.now() - t0) });
      if (hit) { fbHost.replaceChildren(fbk(false, hit.id)); return; }
      okBtn.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.scale.ok'));
      seq(async alive => {
        ts('t.T4:dim', 1, 0.5); ts('t.tag', 1, 1.0); await wait(1.0); if (!alive()) return;
        ts('t.T5', 1, 1.2); await wait(1.6); if (!alive()) return;
        step = 4; drawSteps();
        const cb = callback(); work.append(cb); cb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    }
    given.replaceChildren();
    work.replaceChildren(say('t.scale'), inp.node, h('div', { class: 'row' }, okBtn), fbHost);
    setTimeout(() => inp.focus(), 50);
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const id = cd ? cd.cb : 'q.cb.none';
    void ctx.say(id);
    c.innerHTML = SCRIPT[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '');
    c.append(h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===== 4. Prove it: Sam's 100 cm hallway =====
function partProve(): void {
  tr.reset('p.');
  const P = ScalePair(HALLWAY, PF);
  const J1 = line('p.J1', '\\text{Sam: } \\cssId{w}{100\\text{ cm}}', Y(100), 70, TAGS, 'dim');
  const C1 = line('p.C1', '\\cssId{d}{1\\text{ cm}} \\to \\cssId{a}{100\\text{ cm}}', Y(290), 76, TAGS);
  const C2 = line('p.C2', '\\cssId{d}{5} \\times 100 = \\cssId{s}{500\\text{ cm}}', Y(470), 76, TAGS);
  const C3 = line('p.C3', '\\cssId{d}{2} \\times 100 = \\cssId{s}{200\\text{ cm}}', Y(640), 76, TAGS);
  pairScene('p.', P, [J1, C1, C2, C3], () => ({ pair: glow('p.'), sam: tr.k('p.sam') }), c => {
    const ks = tr.k('p.strike');
    if (ks > 0) { const b = partOf(J1, 'w'); strike(c, b.x0 - 8, b.y1 + 6, b.x1 + 8, b.y0 - 6, ks, { col: 'wrong' }); }
  });
  showPair('p.', ['labA', 'labAw']); ts('p.tag', 1, 0.8, 1.4);
  ts('p.J1', 1, 0.9, 2.0);

  const CHIPS = [
    { t: 'Each centimeter on the plan stands for 100 cm of hallway.', fits: 0 },
    { t: 'The hallway is 5 cm on the plan, and each of those centimeters stands for 100 cm.', fits: 1 },
    { t: 'One factor works for every pair of matching lengths.', fits: 2 },
    { t: 'The biggest number in the scale is the longest wall.', fits: -1, mc: MC.nAsLength, id: 'p.chip.len' },
    { t: 'A different length on the plan needs a different scale.', fits: -1, mc: MC.segments, id: 'p.chip.seg' },
    { t: 'Measured in inches, the scale would change.', fits: -1, mc: MC.unitChange, id: 'p.chip.unit' },
  ];
  const CLAIMS = [
    'The 100 in 1 : 100 is a factor, not a length,',
    'so the hallway is <b class="s">500 cm</b> long, not 100 cm,',
    'and its width is <b class="s">200 cm</b>, with the same 1 : 100,',
  ];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div');
  const used = new Set<number>();
  const order = [3, 0, 4, 1, 5, 2];
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((t, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${t}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...order.filter(i => !used.has(i)).map(i => btn(CHIPS[i]!.t, () => place(i))));
  };
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: plain(CLAIMS[filled]!), response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbk(false, ch.id ?? 'p.chip.other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbk(true, `p.c${n}`));
    seq(async alive => {
      if (n === 1) {
        ts('p.units', 1, 3.2); await wait(3.3); if (!alive()) return;
        ts('p.C1', 1, 1.0);
      }
      if (n === 2) {
        ts('p.C1:dim', 1, 0.5); ts('p.sam', 1, 0.8); await wait(2.4); if (!alive()) return;
        ts('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        ts('p.labA', 1, 0.9); ts('p.C2', 1, 1.0, 0.4);
      }
      if (n === 3) {
        ts('p.C2:dim', 1, 0.5); ts('p.sam', 0, 0.6);
        ts('p.gl.wid', 1, 0.6); ts('p.labAw', 1, 0.9, 0.4); ts('p.C3', 1, 1.0, 0.8); await wait(2.4); if (!alive()) return;
        ts('p.gl.wid', 0, 0.6);
        chipBox.remove();
        fbHost.replaceChildren(fbk(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const verdict = h('div', { class: 'row' }), proofHost = h('div');
  const yes = btn('Sam is right', () => judge(true)), no = btn('Sam is wrong', () => judge(false));
  verdict.append(yes, no);
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Sam: the plan is 1 : 100, so the hallway (5 cm on the plan) is 100 cm long. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.nAsLength : undefined });
    proofHost.replaceChildren(say(right ? 'p.build.yes' : 'p.build.no'), chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), say('p.intro'), verdict, proofHost);
}

// ===== 5. Practice: every sub-goal, then mixed =====
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as SBItem),
  });
}
function showItem(item: SBItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  const made = pic ? tryBlock(() => ScalePair(pic.pair, PF)) : null;
  if (pic && made && made.ok) {
    const P = made.value;
    const T = line('x.T', item.board, Y(130), 76, TAGS);
    const parts = item.work ? item.work.split(/,\s/) : [];
    const Ws = parts.map((src, i) => line('x.W', src, Y(320 + i * 140), 72, TAGS));
    const later = new Set<string>(pic.solve ?? []);
    pairScene('x.', P, [T, ...Ws], () => ({ pair: pic.focus ? { which: pic.focus, col: 'link', k: tr.k('x.gl') } : undefined }));
    let d = 0;
    for (const s of ['card', 'fig', 'labD', 'real', 'labA', 'labAw']) if (!later.has(s)) { ts('x.' + s, 1, 0.6, d); d += 0.12; }
    ts('x.T', 1, 0.8, 0.3);
    return {
      solve: async alive => {
        ts('x.T:dim', 1, 0.5);
        if (pic.focus) ts('x.gl', 1, 0.6);
        for (const s of PAIR_STEPS) if (later.has(s)) {
          const long = s === 'copyL' || s === 'copyW' || s === 'units';
          ts('x.' + s, 1, long ? 2.4 : 0.8); await wait(long ? 2.5 : 0.6); if (!alive()) return;
        }
        if (Ws.length) ts('x.W', 1, 1.0);
      },
    };
  }
  if (pic && made && !made.ok) console.warn('scale-basics: picture skipped:', made.error);
  // bare notation: the board line big on a wide slate, the worked line under it after a miss
  const big = box(300, 220, 1620, 600);
  const BL = bigLine('x.T', item.board, big, 120);
  BL.tags = TAGS;
  const BW = item.work ? bigLine('x.W', item.work.replace(/,\s/g, ',\\quad '), box(300, 640, 1620, 900), 96) : null;
  if (BW) BW.tags = TAGS;
  setScene({ table: 1080, lines: BW ? [BL, BW] : [BL], leads: [], boardBox: box(300, 180, 1620, 940) });
  ts('x.T', 1, 0.8, 0.1);
  return { solve: async () => { if (BW) ts('x.W', 1, 1.0); } };
}

void runLesson({
  slug: SLUG,
  warm: ['\\cssId{d}{4\\text{ in}} \\leftrightarrow \\cssId{a}{32\\text{ in}}', '\\text{scale } \\cssId{d}{1} : \\cssId{a}{8}', '\\times 8', '\\checkmark', '\\text{Sam: } 100\\text{ cm}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
