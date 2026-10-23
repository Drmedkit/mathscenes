// linear-equations.ts: "Solving linear equations in one variable" (grade 8, 8.EE.C.7) on the shared lesson runtime.
//   1 The question   5 bags + 3 marbles balance 1 bag + 15 marbles: how many in a bag? (3; 2 = the bag moved across
//                    without changing sign; "can't tell" = only numbers may come off both sides) + how sure
//   2 Worked example four subgoal steps on the two-pan balance: a bag off both pans (− x | − x), 3 marbles off both,
//                    split into 4 rows (x = 3), check both sides with the bags open (18 | 18); one "why?" with 3 reasons
//   3 Your turn      3x + 11 = 5x + 3, faded from the end: the bags come off for you; the kid picks the next move,
//                    finds one bag (4 = x) and checks both sides of the original; the callback to part 1
//   4 Prove it       Jordan: 2x + 5 = 2x + 9 -> 5 = 9 "so x = 0". A because-chain from reason chips (distractors =
//                    zero-vs-no-solution, no-solution-means-error); the balance stays tipped for every value in the bags
//   5 Practice       all 22 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: src/lesson/topics/linear-equations/script.ts (panel HTML) = voice/lines.json (spoken text).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { leader } from '../../src/lesson/annotate';
import { drawWords } from '../../src/lesson/words';
import { bigLine, bump, type Line, partOf, seq, setScene, th, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, type Kid, numInput, pairInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { SIDES_BOARD, SIDES_FRAME, STRIP_FROM, STRIP_TO } from '../../src/lesson/topics/linear-equations/sidesMaths';
import { SidesBalance, type SidesBlock, type SidesFocus, type SidesStep, type LabelPart } from '../../src/lesson/topics/linear-equations/SidesBalance';
import { FAMILY_NAMES, GENERATORS, MC, type LEItem, type BalancePic } from '../../src/lesson/topics/linear-equations/items';
import { PLAN } from '../../src/lesson/topics/linear-equations/plan';
import { explain } from '../../src/lesson/topics/linear-equations/explain';
import { SCRIPT } from '../../src/lesson/topics/linear-equations/script';
import { N, X, sideTex, type Side } from '../../src/lesson/topics/linear-equations/lin';

const SLUG = 'linear-equations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: Kid[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
/** a voiced panel line: the HTML from the script, spoken by the narrator */
let speaking: Promise<void> = Promise.resolve();
function said(id: string, cls = '', tag: keyof HTMLElementTagNameMap = 'p'): HTMLElement { speaking = ctx.say(id); return html(tag, cls, SCRIPT[id]?.html ?? id); }
/** queue a line after the one being spoken (dropped when the kid leaves the part) */
function sayNext(id: string): void {
  const prev = speaking;
  speaking = new Promise<void>(res => seq(async alive => { await prev; if (alive()) await ctx.say(id); res(); }));
}
const fbk = (ok: boolean, id: string, extra: Kid[] = []) => { speaking = ctx.say(id); return feedback(ok, SCRIPT[id]?.html ?? id, extra); };

// ===================== the board: equations aligned on their = sign =====================
const BRD = SIDES_BOARD, LX = BRD.x0 + 50, BW = BRD.w - 100;
const TAGS = { tx: { col: 'second' as Paint }, tn: { col: 'first' as Paint }, v: { col: 'link' as Paint }, xx: { col: 'link' as Paint }, ok: { col: 'link' as Paint } };
interface Row { key: string; src: string; y: number; tags?: Line['tags']; col?: Paint }
const withEq = (src: string) => src.replace(' = ', ' \\cssId{eq}{=} ');
function alignRows(rows: Row[], size: number): { lines: Line[]; eqx: number; size: number } {
  const Fs = rows.map(r => tex(withEq(r.src)) as Formula);
  let s = size, eqx = 0;
  for (;;) {
    let mL = 0, mR = 0;
    for (const F of Fs) { const all = texBox(F, 0, 0, { size: s }), e = texBox(F, 0, 0, { size: s }, 'eq'); mL = Math.max(mL, e.cx - all.x0); mR = Math.max(mR, all.x1 - e.cx); }
    if (mL + mR <= BW || s <= 60) { eqx = LX + mL + (BW - mL - mR) / 2; break; }
    s -= 2;
  }
  return { size: s, eqx, lines: rows.map((r, i) => { const F = Fs[i]!, e = texBox(F, 0, r.y, { size: s }, 'eq'); return { key: r.key, F, x: eqx - e.cx, y: r.y, size: s, tags: r.tags, col: r.col }; }) };
}
/** the box of one side of an aligned line */
function sideBox(L: Line, which: 'L' | 'R'): Box {
  const all = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }), e = partOf(L, 'eq');
  return which === 'L' ? box(all.x0, all.y0, e.x0 - L.size * 0.2, all.y1) : box(e.x1 + L.size * 0.2, all.y0, all.x1, all.y1);
}
/** a short formula centred under a point (the "− x" under each side) */
function under(key: string, src: string, cx: number, y: number, size: number, col: Paint = 'pick'): Line {
  const F = tex(src) as Formula, b = texBox(F, 0, y, { size });
  return { key, F, x: cx - b.cx, y, size, col };
}
function centred(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Paint): Line {
  const F = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(F, s) > BW) s -= 2;
  const b = texBox(F, 0, y, { size: s });
  return { key, F, x: BRD.cx - b.cx, y, size: s, tags, col };
}
const counts = (bags: number, mar: number): Side => { const s: Side = []; if (bags) s.push(X(bags)); if (mar || !bags) s.push(N(mar)); return s; };
const sideT = (bags: number, mar: number) => sideTex(counts(bags, mar), 'frac', true);

// ===================== the solving chain: board lines + balance moves =====================
interface Chain {
  m: SidesBlock; lines: Line[]; size: number;
  P: { k(s: SidesStep): number };
  focus(extra?: Partial<SidesFocus>): SidesFocus;
  showModel(delay?: number): void;
  takeX(alive: () => boolean): Promise<void>;
  takeN(alive: () => boolean): Promise<void>;
  split(alive: () => boolean): Promise<void>;
  check(alive: () => boolean): Promise<void>;
  sweep(alive: () => boolean, marks: Record<number, 'ok' | 'no'>): Promise<void>;
  extra(c: Canvas): void;
  /** the rows this chain writes (E1 … E4, Q), for steps that need them */
  row(key: string): Line | undefined;
  fast: boolean;
}
interface ChainOpts { y0?: number; size?: number; question?: boolean; fast?: boolean; e1?: string; strip?: boolean; checkRows?: boolean }
function buildChain(pre: string, p: BalancePic, o: ChainOpts = {}): Chain {
  const T = o.fast ? 0.6 : 1;
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set(pre + k, v, d * T, del * T), w = (sec: number) => wait(sec * T);
  const m = SidesBalance(p, SIDES_FRAME, th), M = m.maths;
  const rows: Row[] = [], ops: { key: string; L: string; R: string; y: number }[] = [];
  let y = o.y0 ?? 170;
  rows.push({ key: 'E1', src: o.e1 ?? `${sideT(M.a, M.b)} = ${sideT(M.c, M.d)}`, y, tags: TAGS });
  if (o.question) rows.push({ key: 'Q', src: '\\cssId{xx}{x} = \\;?', y: y + 96, tags: TAGS });
  if (M.tx) { y += 78; ops.push({ key: 'O1', L: `-\\,${M.tx === 1 ? '' : M.tx}x`, R: `-\\,${M.tx === 1 ? '' : M.tx}x`, y }); y += 82; rows.push({ key: 'E2', src: `${sideT(M.a - M.tx, M.b)} = ${sideT(M.c - M.tx, M.d)}`, y, tags: TAGS }); }
  if (M.tn && M.canSplit) { y += 78; ops.push({ key: 'O2', L: `-\\,${M.tn}`, R: `-\\,${M.tn}`, y }); y += 82; rows.push({ key: 'E3', src: `${sideT(M.aL, M.bL)} = ${sideT(M.aR, M.bR)}`, y, tags: TAGS }); }
  // the last line: x = v (or v = x when the bags ended on the right); with one bag left it is the line already there
  let finalKey = 'E4';
  if (M.canSplit) {
    const fin = M.bagSide === 'L' ? `\\cssId{xx}{x} = \\cssId{v}{${M.x}}` : `\\cssId{v}{${M.x}} = \\cssId{xx}{x}`;
    const last = M.p === 1 ? rows.filter(r => r.key === 'E3' || r.key === 'E2').pop() : undefined;
    if (last) { last.src = fin; finalKey = last.key; }
    else {
      if (M.p > 1) { y += 78; ops.push({ key: 'O3', L: `\\div ${M.p}`, R: `\\div ${M.p}`, y }); }
      y += 82;
      rows.push({ key: 'E4', src: fin, y, tags: TAGS });
    }
  }
  const al = alignRows(rows, o.size ?? 74);
  const L = new Map(al.lines.map(l => [l.key, l]));
  const byKey = (k: string) => L.get(k);
  const os = Math.max(60, Math.round(al.size * 0.8));
  const lines: Line[] = [...al.lines.map(l => ({ ...l, key: pre + l.key }))];
  const prevRow = (opY: number) => [...al.lines].filter(l => l.y < opY && l.key !== 'Q').sort((a, b) => b.y - a.y)[0]!;
  for (const op of ops) {
    const R0 = prevRow(op.y);
    lines.push(under(pre + op.key, op.L, sideBox(R0, 'L').cx, op.y, os), under(pre + op.key, op.R, sideBox(R0, 'R').cx, op.y, os));
  }
  // the check in the original: both sides worked out with the bags open
  const ky = Math.max(y + 140, 790);
  const vx = `\\cssId{v}{${M.x}}`;
  const sub = (bags: number, mar: number) => (bags ? `${bags === 1 ? '' : bags}(${vx})` : '') + (bags && mar ? ' + ' : '') + (mar || !bags ? String(mar) : '');
  if (o.checkRows !== false && M.canSplit) {
    lines.push(centred(pre + 'K1', `\\text{left: } ${sub(M.a, M.b)} = \\cssId{tn}{${M.a * M.x + M.b}}`, ky, Math.round(al.size * 0.86), TAGS));
    lines.push(centred(pre + 'K2', `\\text{right: } ${sub(M.c, M.d)} = \\cssId{tn}{${M.c * M.x + M.d}}\\ \\cssId{ok}{\\checkmark}`, ky + 92, Math.round(al.size * 0.86), TAGS));
  }
  const P = progressOf<SidesStep>(st => tr.k(pre + 'b.' + st));
  let sweepV: number | null = null;
  const marks: Record<number, 'ok' | 'no'> = {};
  const focus = (extra: Partial<SidesFocus> = {}): SidesFocus => ({
    rings: [
      { at: 'bagsL', col: 'second', k: tr.k(pre + 'rBL') }, { at: 'bagsR', col: 'second', k: tr.k(pre + 'rBR') },
      { at: 'takenX', col: 'pick', k: tr.k(pre + 'rTX') }, { at: 'takenN', col: 'pick', k: tr.k(pre + 'rTN') },
      { at: 'row0', col: 'link', k: tr.k(pre + 'rX') },
    ],
    labelL: tr.k(pre + 'pL'), labelR: tr.k(pre + 'pR'),
    v: sweepV ?? M.x,
    ...(sweepV !== null ? { tilt: tr.k(pre + 'tilt') } : {}),
    ...(o.strip ? { strip: { marks, cur: sweepV, k: tr.k(pre + 'strip') } } : {}),
    ...extra,
  });
  const dimRow = (k: string) => set(k + ':dim', 1, 0.5);
  const E4 = byKey(finalKey);
  const extra = (c: Canvas) => {
    const k = tr.k(pre + 'ld');
    if (k > 0 && E4 && M.bagSide === 'L') leader(c, partOf(E4, 'v'), m.where.share, { col: 'link', k, boardX: BRD.x0, alpha: 1 - 0.6 * tr.k(pre + 'ld:dim') });
  };
  return {
    m, lines, size: al.size, P, focus, row: k => byKey(k), fast: !!o.fast, extra,
    showModel(d = 0) { set('b.stand', 1, 0.8, d); set('b.left', 1, 1.2, d + 0.4); set('b.right', 1, 1.4, d + 0.8); },
    async takeX(alive) {
      if (!M.tx) return;
      set('Q', 0, 0.4);
      set('O1', 1, 0.8); set('rTX', 1, 0.5, 0.3); await w(1.4); if (!alive()) return;
      set('b.takeX', 1, 1.4); set('rTX', 0, 0.4, 0.5); await w(1.5); if (!alive()) return;
      set('E2', 1, 1.0); void bump(pre + 'pL', alive); void bump(pre + 'pR', alive); await w(1.2);
      dimRow('E1'); dimRow('O1');
    },
    async takeN(alive) {
      if (!M.tn || !M.canSplit) return;
      set('Q', 0, 0.4);
      set('O2', 1, 0.8); set('rTN', 1, 0.5, 0.3); await w(1.3); if (!alive()) return;
      set('b.takeN', 1, 1.4); set('rTN', 0, 0.4, 0.5); await w(1.5); if (!alive()) return;
      set('E3', 1, 1.0); void bump(pre + (M.bagSide === 'L' ? 'pR' : 'pL'), alive); await w(1.2);
      dimRow('E1'); dimRow('E2'); dimRow('O2');
    },
    async split(alive) {
      if (!M.canSplit) return;
      set('Q', 0, 0.4);
      if (M.p > 1) { set('O3', 1, 0.8); await w(0.9); if (!alive()) return; set('b.split', 1, 1.8); await w(2.0); if (!alive()) return; set('b.keep', 1, 0.9); await w(1.0); if (!alive()) return; }
      else { set('b.split', 1, 1.2); await w(1.3); if (!alive()) return; }
      if (finalKey === 'E4') { dimRow('E3'); dimRow('O3'); dimRow('E2'); set('E4', 1, 1.0, 0.2); }
      set('rX', 1, 0.5, 0.6); set('ld', 1, 0.9, 1.0); await w(2.0);
    },
    async check(alive) {
      set('rX', 0, 0.4); set('ld', 0, 0.5); dimRow(finalKey);
      set('b.keep', 0, 0.8); await w(0.8); if (!alive()) return;
      set('b.split', 0, 1.4); set('b.takeN', 0, 1.2, 0.6); set('b.takeX', 0, 1.2, 0.9); await w(2.2); if (!alive()) return;
      set('b.open', 1, 0.9); await w(1.0); if (!alive()) return;
      set('K1', 1, 1.1); void bump(pre + 'pL', alive); await w(1.2); if (!alive()) return;
      set('K2', 1, 1.1); void bump(pre + 'pR', alive); await w(1.4);
    },
    async sweep(alive, mk) {
      set('strip', 1, 0.6); set('b.open', 1, 0.6); sweepV = STRIP_FROM;
      tr.jump(pre + 'tilt', m.tiltAt(STRIP_FROM)); await w(0.7); if (!alive()) return;
      for (let v = STRIP_FROM; v <= STRIP_TO; v++) {
        sweepV = v; set('tilt', m.tiltAt(v), 0.35);
        await w(0.55); if (!alive()) return;
        marks[v] = m.tiltAt(v) === 0 ? 'ok' : 'no'; mk[v] = marks[v]!;
        await w(0.25); if (!alive()) return;
      }
      sweepV = null;
    },
  };
}
function chainScene(C: Chain, extra?: (c: Canvas) => void, focusExtra?: () => Partial<SidesFocus>): void {
  setScene({ table: C.m.layout.table, model: c => C.m.draw(c, C.P, C.focus(focusExtra?.())), lines: C.lines, leads: [], boardBox: BRD, extra: c => { C.extra(c); extra?.(c); } });
}

// ===================== 1. The question =====================
const EX: BalancePic = { a: 5, b: 3, c: 1, d: 15 };
const CARDS = [
  { t: '3', small: 'marbles', log: '3', mc: '', cb: 't.cb-right' },
  { t: '2', small: 'marbles', log: '2', mc: MC.noSign, cb: 't.cb-sign' },
  { t: 'Can’t tell', small: 'bags on both pans', log: "can't tell", mc: MC.onlyConst, cb: 't.cb-cant' },
];
function partQuestion(): void {
  tr.reset('q.');
  const C = buildChain('q.', EX, { question: true, checkRows: false });
  chainScene(C);
  C.showModel(); tr.set('q.E1', 1, 1.0, 2.2); tr.set('q.Q', 1, 0.8, 2.8);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: '5 bags + 3 marbles balance 1 bag + 15 marbles: how many marbles in one bag?', board: '5x + 3 = x + 15', response: c.log, expected: '3', correct: !c.mc, mc: c.mc || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span>${cd.t}</span><small>${cd.small}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  const intro = said('q.intro'), ask = html('p', '', SCRIPT['q.ask']!.html);
  setPanel(h('h2', {}, 'Bags on both pans'), intro, ask, cards, h('div', { class: 'label' }, SCRIPT['q.sure']!.html), sure, h('div', { class: 'row' }, goBtn));
  sayNext('q.ask'); sayNext('q.sure');
}

// ===================== 2. Worked example: 5x + 3 = x + 15 =====================
function partExample(): void {
  tr.reset('e.');
  const C = buildChain('e.', EX, { question: true });
  chainScene(C);
  for (const s of ['stand', 'left', 'right']) tr.jump('e.b.' + s, 1);
  tr.jump('e.E1', 1); tr.jump('e.Q', 1);
  let step = 0;
  const STEPS = [
    { t: 'Take a bag off both pans', why: 'The same unknown amount off each side.', act: 'Take a bag off' },
    { t: 'Take the loose marbles off', why: 'Three off both pans.', act: 'Take 3 off' },
    { t: 'Split into equal rows', why: 'Four bags, so four rows on both pans.', act: 'Split' },
    { t: 'Check both sides', why: 'Open the bags: does each side give the same?', act: 'Check' },
  ];
  const plan = h('ol', { class: 'plan' }), sayBox = h('div'), after = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => {
    const li = h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)));
    if (i === step) (li.lastChild as HTMLElement).append(btn(s.act, () => run(i), 'go'));
    return li;
  }));
  function run(i: number): void {
    step = i + 1; drawPlan(); sayBox.replaceChildren();
    seq(async alive => {
      if (i === 0) await C.takeX(alive);
      else if (i === 1) await C.takeN(alive);
      else if (i === 2) await C.split(alive);
      else await C.check(alive);
      if (!alive()) return;
      sayBox.replaceChildren(said(`e.s${i + 1}`));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Both bags hold the same unknown amount, so both pans lose the same and stay level.', ok: true, id: 'e.w-ok', mc: undefined as string | undefined },
      { t: 'The x moves across the = sign and changes its sign.', ok: false, id: 'e.w-move', mc: MC.moveSign as string | undefined },
      { t: 'It only works here: in general only numbers may come off both sides.', ok: false, id: 'e.w-const', mc: MC.onlyConst as string | undefined },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why may a bag come off both pans, when nobody knows what is in it?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(html('div', 'label', SCRIPT['e.why']!.html), bx, fbHost);
    sayNext('e.why');
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), said('e.intro', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: 3x + 11 = 5x + 3 (faded from the end) =====================
const TURN: BalancePic = { a: 3, b: 11, c: 5, d: 3 };
function partTurn(): void {
  tr.reset('t.');
  const C = buildChain('t.', TURN, { question: true });
  const wrongRight: LabelPart[] = [{ t: '2 bags', col: 'second' }];
  chainScene(C, undefined, () => ({
    labelsHide: tr.k('t.hide'), tilt: tr.k('t.tilt'),
    gone: { marR: [0, 1, 2], k: tr.k('t.gone') },
    labelsAs: { L: [{ t: '11', col: 'first' }], R: wrongRight, k: tr.k('t.gone') },
  }));
  C.showModel(); tr.set('t.E1', 1, 1.0, 2.0); tr.set('t.Q', 1, 0.8, 2.4);
  let step = 0;
  const STEPS = [
    { t: 'Take bags off both pans', why: 'Done for you: 3 bags off each.' },
    { t: 'Take the loose marbles off', why: 'Your step.' },
    { t: 'Split into equal rows', why: 'Your step.' },
    { t: 'Check both sides', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: bags on both pans'), said('t.intro'), plan, work);
  seq(async alive => {
    await wait(3.6); if (!alive()) return;
    await C.takeX(alive); if (!alive()) return;
    step = 1; drawPlan();
    work.replaceChildren(said('t.s1'));
    await wait(0.6); if (!alive()) return;
    askMove();
  });
  function askMove(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: 'Take 3 marbles off both pans', ok: true, id: 't.m-ok', mc: undefined as string | undefined },
      { t: 'Take 3 marbles off the right pan', ok: false, id: 't.m-one', mc: MC.oneSideOnly as string | undefined },
      { t: 'Take 11 marbles off both pans', ok: false, id: 't.m-11', mc: undefined },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.move', prompt: '11 = 2x + 3: what comes off next?', board: '11 = 2x + 3', response: o.t, expected: 'Take 3 marbles off both pans', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(fbk(o.ok, o.id));
      if (o.id === 't.m-one') seq(async alive => {
        tr.set('t.gone', 1, 0.7); tr.set('t.tilt', 1, 1.0, 0.5); await wait(2.8); if (!alive()) return;
        tr.set('t.tilt', 0, 0.8); tr.set('t.gone', 0, 0.8, 0.3);
      });
      if (!o.ok) return;
      done = true;
      seq(async alive => { await C.takeN(alive); if (!alive()) return; step = 2; drawPlan(); askX(); });
    })));
    work.replaceChildren(said('t.s1'), html('p', '', SCRIPT['t.move']!.html), bx, fbHost);
    sayNext('t.move');
  }
  function askX(): void {
    const fbHost = h('div'), inp = numInput('marbles', () => check()), ok = btn('Check', () => check(), 'go');
    tr.set('t.hide', 1, 0.6);
    seq(async alive => {
      // split the pans into rows first, so the kid counts one row
      tr.set('t.O3', 1, 0.8); await wait(0.9); if (!alive()) return;
      tr.set('t.b.split', 1, 1.8); await wait(2.0);
    });
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(fbk(false, 't.empty')); return; }
      const v = r.v, right = v === 4;
      const mc = v === 16 ? 'mc.sequences-series.forward-op-when-backward' : v === 8 ? MC.intermediate : v === -4 ? MC.signDrop : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: '8 = 2x: one bag balances how many marbles?', board: '8 = 2x', response: v, expected: 4, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbk(false, v === 16 ? 't.x-16' : v === 8 ? 't.x-8' : 't.x-no')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.x-ok'));
      tr.set('t.hide', 0, 0.6);
      seq(async alive => {
        tr.set('t.b.keep', 1, 0.9); await wait(1.0); if (!alive()) return;
        tr.set('t.E3:dim', 1, 0.5); tr.set('t.O3:dim', 1, 0.5); tr.set('t.E4', 1, 1.0); tr.set('t.rX', 1, 0.5, 0.4); await wait(1.6); if (!alive()) return;
        step = 3; drawPlan(); askCheck();
      });
    }
    work.replaceChildren(said('t.x'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div'), inp = pairInput('left', 'right', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) { fbHost.replaceChildren(fbk(false, 't.empty')); return; }
      const right = r.x === 23 && r.y === 23;
      const mc = !right && r.x === 23 && (r.y === 5 || r.y === 3) ? MC.oneSide : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'Check 3x + 11 = 5x + 3 with x = 4: left side, right side', board: '3x + 11 = 5x + 3', response: r, expected: { x: 23, y: 23 }, correct: right, mc });
      if (!right) { fbHost.replaceChildren(fbk(false, r.x === 23 ? 't.c-one' : 't.c-no')); return; }
      ok.disabled = true;
      fbHost.replaceChildren(fbk(true, 't.c-ok'));
      seq(async alive => { await C.check(alive); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); });
    }
    work.replaceChildren(said('t.check'), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const cd = CARDS[commit().pick ?? 0]!;
    c.append(html('p', '', SCRIPT[cd.cb]!.html), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    sayNext(cd.cb);
    return c;
  }
}

// ===================== 4. Prove it: Jordan's 2x + 5 = 2x + 9 -> "x = 0" =====================
const JORDAN: BalancePic = { a: 2, b: 5, c: 2, d: 9 };
function partProve(): void {
  tr.reset('p.');
  const C = buildChain('p.', JORDAN, { strip: true, y0: 200, checkRows: false });
  const eqx = partOf(C.row('E1')!, 'eq').cx, yJ2 = C.row('E2')!.y;
  const rowAt = (key: string, src: string, yy: number, col?: Paint): Line => { const F = tex(withEq(src)) as Formula, e = texBox(F, 0, yy, { size: C.size }, 'eq'); return { key, F, x: eqx - e.cx, y: yy, size: C.size, col, tags: col ? undefined : TAGS }; };
  const J2 = rowAt('p.J2', '\\cssId{tn}{5} = \\cssId{tn}{9}', yJ2), J3 = rowAt('p.J3', 'x = 0', yJ2 + 96, 'dim');
  const NS = centred('p.NS', '\\text{no solution}', 610, 80, undefined, 'link');
  const K0 = centred('p.K0', '\\text{at } x = 0\\text{:}\\quad 5 \\neq 9', 720, 68, undefined, 'dim');
  // Jordan's lines are the chain's E1 and E2 (5 = 9); x = 0 is his conclusion
  const lines = [...C.lines.filter(l => !/K\d|E2/.test(l.key)), J2, J3, NS, K0];
  setScene({
    table: C.m.layout.table, model: c => C.m.draw(c, C.P, C.focus()), lines, leads: [], boardBox: BRD,
    extra: c => {
      drawWords(c, 'Jordan', LX, 118, 'dim', tr.k('p.E1'), { size: 44 });
      drawWords(c, 'never true', sideBox(J2, 'R').x1 + 40, yJ2 - 20, 'pick', tr.k('p.nt'), { size: 44 });
      const ks = tr.k('p.strike');
      if (ks > 0) { const a = sideBox(J3, 'L'), b = sideBox(J3, 'R'); strike(c, a.x0 - 12, a.cy + 4, b.x1 + 12, b.cy - 4, ks, { col: 'wrong' }); }
    },
  });
  C.showModel(); tr.set('p.E1', 1, 0.9, 1.6); tr.set('p.J2', 1, 0.8, 2.4); tr.set('p.J3', 1, 0.7, 3.1); tr.set('p.strip', 1, 0.6, 2.0);
  const CHIPS = [
    { t: 'Both pans lose the same 2 bags, so the solutions don’t change.', fits: 0 },
    { t: 'There is no x left in it, and 5 never equals 9.', fits: 1 },
    { t: 'Every step kept the solutions, and at x = 0 the sides are 5 and 9.', fits: 2 },
    { t: 'When the x’s cancel, the answer is x = 0.', fits: -1, mc: MC.zeroVsNone, id: 'p.w-zero' },
    { t: 'No solution means a mistake was made somewhere.', fits: -1, mc: MC.noSolErr, id: 'p.w-err' },
  ];
  const CLAIMS = ['p.k1', 'p.k2', 'p.k3'];
  let filled = 0;
  const chain = h('div', { class: 'chain' }), chipBox = h('div', { class: 'chips' }), fbHost = h('div'), used = new Set<number>();
  const drawChain = () => {
    chain.replaceChildren(...CLAIMS.map((id, i) => {
      const d = h('div', { class: 'claim' + (i < filled ? ' ok' : i === filled ? ' now' : '') });
      const chip = CHIPS.find(c => c.fits === i)!;
      d.innerHTML = `${SCRIPT[id]!.html}<span class="because">because ${i < filled ? `<i>${chip.t}</i>` : '<span class="empty"></span>'}</span>`;
      return d;
    }));
    chipBox.replaceChildren(...CHIPS.map((ch, i) => { const b = btn(ch.t, () => place(i)); if (used.has(i)) b.classList.add('used'); return b; }));
  };
  const marks: Record<number, 'ok' | 'no'> = {};
  function place(i: number): void {
    const ch = CHIPS[i]!;
    if (filled >= 3) return;
    ctx.store.log({ part: 'prove', item: `prove.claim${filled + 1}`, prompt: SCRIPT[CLAIMS[filled]!]!.say, response: ch.t, correct: ch.fits === filled, mc: ch.mc });
    if (ch.fits !== filled) { fbHost.replaceChildren(fbk(false, ch.id ?? 'p.w-other')); return; }
    used.add(i); filled++; drawChain();
    const n = filled;
    fbHost.replaceChildren(fbk(true, `p.c${n}`));
    if (n < 3) sayNext(CLAIMS[n]!);
    seq(async alive => {
      if (n === 1) { await C.takeX(alive); if (!alive()) return; await wait(0.6); if (!alive()) return; tr.set('p.b.takeX', 0, 1.2); }
      if (n === 2) { tr.set('p.nt', 1, 0.6); await C.sweep(alive, marks); }
      if (n === 3) {
        tr.set('p.strike', 1, 0.6); await wait(0.8); if (!alive()) return;
        tr.set('p.NS', 1, 1.0); await wait(1.0); if (!alive()) return;
        tr.set('p.K0', 1, 1.0); await wait(1.2); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(fbk(true, 'p.done'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Jordan is right', () => judge(true)), no = btn('Jordan is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Jordan: 2x + 5 = 2x + 9, subtract 2x: 5 = 9, so x = 0. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.zeroVsNone : undefined });
    proofHost.replaceChildren(said(right ? 'p.test' : 'p.build'), chain, chipBox, fbHost);
    sayNext(CLAIMS[0]!);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'), said('p.intro'), html('p', '', SCRIPT['p.ask']!.html), h('div', { class: 'row' }, yes, no), proofHost);
  sayNext('p.ask');
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  // ?sg=<sub-goal id>: practise one part of the topic only (a teacher's jump, and the walk's way to reach later parts)
  const sg = ctx.qs.get('sg'), plan = sg && PLAN.some(p => p.id === sg) ? PLAN.filter(p => p.id === sg) : PLAN;
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as LEItem),
  });
}
function showItem(item: LEItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const pic = item.picture;
  if (pic?.balance) {
    const mode = pic.mode ?? 'solve';
    const made = tryBlock(() => buildChain('x.', pic.balance!, { y0: 200, size: 78, fast: true, e1: pic.balance!.tex ?? item.board, strip: mode === 'sweep' || mode === 'try', checkRows: mode === 'solve' }));
    if (made.ok) {
      const C = made.value;
      const tries: Record<number, 'ok' | 'no'> = {};
      let tryOpen = false;
      chainScene(C, undefined, () => (mode === 'try' && tryOpen ? { v: pic.v, tilt: tr.k('x.tilt'), strip: { marks: tries, cur: pic.v, k: tr.k('x.strip') } } : {}));
      C.showModel(); tr.set('x.E1', 1, 0.9, 0.8);
      if (mode === 'sweep' && /howMany/.test(item.id)) seq(async alive => { await wait(2.6); if (alive()) await C.sweep(alive, {}); });
      return {
        solve: async alive => {
          if (mode === 'solve') { await C.takeX(alive); if (!alive()) return; await C.takeN(alive); if (!alive()) return; await C.split(alive); if (!alive()) return; await C.check(alive); }
          else if (mode === 'takeX') await C.takeX(alive);
          else if (mode === 'sweep') { if (!/howMany/.test(item.id)) await C.sweep(alive, {}); }
          else if (mode === 'try' && pic.v !== undefined) {
            tryOpen = true; tries[pic.v] = C.m.tiltAt(pic.v) === 0 ? 'ok' : 'no';
            tr.set('x.strip', 1, 0.6); tr.set('x.tilt', C.m.tiltAt(pic.v), 0.9, 0.4); tr.set('x.b.open', 1, 0.9);
            await wait(1.2); void bump('x.pL', alive); void bump('x.pR', alive);
          }
        },
      };
    }
  }
  if (pic?.lines?.length) {
    const big = box(200, 200, 1720, 880);
    const n = pic.lines.length, gap = Math.min(220, (big.h - 80) / n);
    const ls = pic.lines.map((src, i) => {
      const L = bigLine(`x.L${i}`, src, box(big.x0, big.cy - (gap * (n - 1)) / 2 + i * gap - 80, big.x1, big.cy - (gap * (n - 1)) / 2 + i * gap + 80), 110);
      return L;
    });
    setScene({ lines: ls, leads: [], boardBox: big });
    ls.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.1 + 0.5 * i));
    return {};
  }
  const big = box(200, 230, 1720, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 120)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\cssId{tx}{5x} + \\cssId{tn}{3} \\cssId{eq}{=} x + 15', '\\div 4 \\checkmark \\text{left: no solution}', '\\tfrac{1}{2}x \\square'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
