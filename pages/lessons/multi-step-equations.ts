// multi-step-equations.ts: "Multi-step linear equations with rational coefficients" (grade 8, 8.EE.C.7.b) on the
// shared lesson runtime. The model is the pan balance of two-step-equations / linear-equations with PIECES: half a
// bag, two thirds of a marble. Clearing fractions = k copies of each whole pan (still level); the pieces gather into
// whole bags and marbles, and the whole-number equation is solved on the balance as before.
//   1 The question   ½x + ⅔ = ⅓x + 1: multiply every term by 6, which equation? 3 cards (right; the 1 not
//                    multiplied; only the x-terms multiplied) + how sure
//   2 Worked example four subgoal steps: find the multiplier (halves and thirds -> 6), multiply every term (6 copies
//                    of each pan, the pieces gather: 3x + 4 = 2x + 6), solve the whole-number equation (2 bags and 4
//                    marbles off both pans: x = 2), check in the ORIGINAL; one "why?" with 3 reasons
//   3 Your turn      ¾x + ½ = ¼x + 3, faded from the end: the multiplier is given, the kid picks the cleared line
//                    (wrong picks copy only some terms and the beam tips), types x, checks one side of the original
//   4 Prove it       Maya clears (2/3)x + 4 = 6 by 3 but leaves the 4: a because-chain from reason chips
//                    (distractors = catalogue misconceptions), the balance backs each line
//   5 Practice       all 22 sub-goals one after another, then mixed (runtime/practice.ts)
// Voiced lines: pages/lessons/multi-step-equations/voice/lines.json. Every answer is logged (runtime/store.ts).
import { type Canvas, strike } from '../../src/core/draw';
import { type Box, box } from '../../src/core/math';
import { type Progress, progressOf } from '../../src/core/clock';
import { type Formula, tex, texBox, texWidth } from '../../src/core/tex';
import type { Paint } from '../../src/core/theme';
import { tryBlock } from '../../src/blocks/block';
import { bigLine, type Line, partOf, seq, setScene, th, tr, wait, bump } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { SIDES_BOARD, tiltAt } from '../../src/lesson/topics/linear-equations/sidesMaths';
import { ClearBalance, type ClearBlock, type ClearFocus, type ClearStep } from '../../src/lesson/topics/multi-step-equations/ClearBalance';
import { type ClearPic, type Eq, type Q, type Side, N, X, eq, lin, nT, sideT, valueAt } from '../../src/lesson/topics/multi-step-equations/msMaths';
import { pictureOf } from '../../src/lesson/topics/multi-step-equations/clearLayout';
import { FAMILY_NAMES, GENERATORS, MC, type MsItem, readQ } from '../../src/lesson/topics/multi-step-equations/items';
import { PLAN } from '../../src/lesson/topics/multi-step-equations/plan';
import { qEq, rat } from '../../src/core/math';
import LINES from './multi-step-equations/voice/lines.json';

const SLUG = 'multi-step-equations';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const say = (id: string) => { void ctx.say(id); };
const commit = () => ctx.progress.commit;
const XH = '<i>x</i>';
const F = (a: number | string, b: number | string) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
/** a voiced panel line: the HTML shown; the narrator says lines.json[id] */
function voiced(id: string, htmlText: string, tag: keyof HTMLElementTagNameMap = 'p', cls = ''): HTMLElement {
  if (!(id in LINES)) console.warn('no voice line', id);
  say(id);
  return html(tag, cls, htmlText);
}
function voicedFb(id: string, ok: boolean, htmlText: string): HTMLElement { if (!(id in LINES)) console.warn('no voice line', id); say(id); return feedback(ok, htmlText); }

// ===================== the board: equations aligned on their = sign (the wide SidesBalance slate) =====================
const BRD = SIDES_BOARD, LX = BRD.x0 + 50, BW = BRD.w - 100;
const TAGS = { tx: { col: 'second' as Paint }, tn: { col: 'first' as Paint }, v: { col: 'link' as Paint }, ok: { col: 'link' as Paint } };
interface Row { key: string; src: string; y: number; tags?: Line['tags']; col?: Paint }
const withEq = (src: string) => src.replace(' = ', ' \\cssId{eq}{=} ');
function alignRows(rows: Row[], size: number): { lines: Line[]; size: number } {
  const Fs = rows.map(r => tex(withEq(r.src)) as Formula);
  let s = size, eqx = 0;
  for (;;) {
    let mL = 0, mR = 0;
    for (const Fm of Fs) { const all = texBox(Fm, 0, 0, { size: s }), e = texBox(Fm, 0, 0, { size: s }, 'eq'); mL = Math.max(mL, e.cx - all.x0); mR = Math.max(mR, all.x1 - e.cx); }
    if (mL + mR <= BW || s <= 60) { eqx = LX + mL + (BW - mL - mR) / 2; break; }
    s -= 2;
  }
  return { size: s, lines: rows.map((r, i) => { const Fm = Fs[i]!, e = texBox(Fm, 0, r.y, { size: s }, 'eq'); return { key: r.key, F: Fm, x: eqx - e.cx, y: r.y, size: s, tags: r.tags ?? TAGS, col: r.col }; }) };
}
function sideBox(L: Line, which: 'L' | 'R'): Box {
  const all = texBox(L.F, L.x, L.y, { size: L.size, align: 'left' }), e = partOf(L, 'eq');
  return which === 'L' ? box(all.x0, all.y0, e.x0 - L.size * 0.2, all.y1) : box(e.x1 + L.size * 0.2, all.y0, all.x1, all.y1);
}
function under(key: string, src: string, cx: number, y: number, size: number, col: Paint = 'pick'): Line {
  const Fm = tex(src) as Formula, b = texBox(Fm, 0, y, { size });
  return { key, F: Fm, x: cx - b.cx, y, size, col };
}
function centred(key: string, src: string, y: number, size: number, tags?: Line['tags'], col?: Paint): Line {
  const Fm = tex(src) as Formula;
  let s = size;
  while (s > 60 && texWidth(Fm, s) > BW) s -= 2;
  const b = texBox(Fm, 0, y, { size: s });
  return { key, F: Fm, x: BRD.cx - b.cx, y, size: s, tags, col };
}
const sub = (s: Side, v: Q) => sideT(s).replace(/x/g, `(\\cssId{v}{${nT(v)}})`);
const opT = (bags: number, mar: number) => [bags ? `-\\,${bags === 1 ? '' : bags}x` : '', mar ? `-\\,${mar}` : ''].filter(Boolean).join('\\ ');

// ===================== the chain: board rows + balance moves, one builder for every part =====================
interface Ys { E0: number; rows: number[]; K1?: number; K2?: number }
interface Chain {
  m: ClearBlock; lines: Line[]; extra: Line[]; P: Progress<ClearStep>; v: Q | null; size: number;
  E: Record<string, Line>;
  focus(extra?: Partial<ClearFocus>): ClearFocus;
  showModel(d?: number): void;
  find(alive: () => boolean): Promise<void>;
  clear(alive: () => boolean): Promise<void>;
  takes(alive: () => boolean): Promise<void>;
  split(alive: () => boolean): Promise<void>;
  check(alive: () => boolean): Promise<void>;
  kindNote(alive: () => boolean): Promise<void>;
}
function buildChain(pre: string, e: Eq, pic: ClearPic, Y: Ys, o: { size?: number; fast?: boolean; extraRows?: Row[]; hideFinal?: boolean } = {}): Chain {
  const T = o.fast ? 0.6 : 1;
  const set = (k: string, v: number, d = 0.9, del = 0) => tr.set(k, v, d * T, del * T), w = (s: number) => wait(s * T);
  const m = ClearBalance(pic, th), sm = m.layout.sm, k = pic.k;
  const L1 = lin(rat(sm.a), rat(sm.b)), R1 = lin(rat(sm.c), rat(sm.d));
  const L2 = lin(rat(sm.aL), rat(sm.bL)), R2 = lin(rat(sm.aR), rat(sm.bR));
  const tag = (s: Side) => sideT(s, 'frac', { tag: true });
  const rows: Row[] = [{ key: pre + 'E0', src: `${tag(e.L)} = ${tag(e.R)}`, y: Y.E0 }];
  let ri = 0;
  const nextY = () => Y.rows[ri++] ?? Y.rows[Y.rows.length - 1]! + 80;
  const yO1 = nextY(), yE1 = nextY();
  rows.push({ key: pre + 'E1', src: `${tag(L1)} = ${tag(R1)}`, y: yE1 });
  const hasTake = sm.tx > 0 || sm.tn > 0;
  const yO2 = hasTake ? nextY() : 0, yE2 = hasTake ? nextY() : 0;
  if (hasTake) rows.push({ key: pre + 'E2', src: `${tag(L2)} = ${tag(R2)}`, y: yE2 });
  let v: Q | null = null, yO3 = 0;
  if (sm.kind === 'one') {
    v = rat(sm.bagSide === 'L' ? sm.bR - sm.bL : sm.bL - sm.bR, sm.p);
    if (sm.p > 1) {
      yO3 = nextY();
      const y3 = nextY();
      rows.push(sm.bagSide === 'L' ? { key: pre + 'E3', src: `\\cssId{v}{x} = \\cssId{v}{${nT(v)}}`, y: y3 } : { key: pre + 'E3', src: `\\cssId{v}{${nT(v)}} = \\cssId{v}{x}`, y: y3 });
    }
  }
  const al = alignRows([...rows, ...(o.extraRows ?? [])], o.size ?? 80);
  const E: Record<string, Line> = {};
  al.lines.forEach((L, i) => { if (i < rows.length) E[rows[i]!.key.slice(pre.length)] = L; });
  const os = Math.max(60, Math.round(al.size * 0.8));
  const lines: Line[] = [...al.lines.slice(0, rows.length)];
  // the moves, written under both sides
  lines.push(under(pre + 'O1', `\\times ${k}`, sideBox(E.E0!, 'L').cx, yO1, os), under(pre + 'O1', `\\times ${k}`, sideBox(E.E0!, 'R').cx, yO1, os));
  if (hasTake) { const t = opT(sm.tx, sm.tn); lines.push(under(pre + 'O2', t, sideBox(E.E1!, 'L').cx, yO2, os), under(pre + 'O2', t, sideBox(E.E1!, 'R').cx, yO2, os)); }
  if (E.E3) { const src = `\\div ${sm.p}`, base = E.E2 ?? E.E1!; lines.push(under(pre + 'O3', src, sideBox(base, 'L').cx, yO3, os), under(pre + 'O3', src, sideBox(base, 'R').cx, yO3, os)); }
  // the check in the original (lesson parts) and the kind of solution set
  const vv = v;
  if (vv && Y.K1 && Y.K2) {
    const l = valueAt(e.L, vv), r = valueAt(e.R, vv);
    lines.push(centred(pre + 'K1', `${sub(e.L, vv)} = ${nT(l)}`, Y.K1, Math.round(al.size * 0.85), TAGS), centred(pre + 'K2', `${sub(e.R, vv)} = ${nT(r)}\\ \\cssId{ok}{\\checkmark}`, Y.K2, Math.round(al.size * 0.85), TAGS));
  }
  if (sm.kind !== 'one') lines.push(centred(pre + 'KN', sm.kind === 'all' ? '\\text{always true: every number}' : '\\text{never true: no solution}', nextY() + 20, 62, undefined, 'link'));
  const P = progressOf<ClearStep>(st => tr.k(pre + 'b.' + st));
  const focus = (extra: Partial<ClearFocus> = {}): ClearFocus => ({
    rings: [
      { at: 'xL', col: 'second', k: tr.k(pre + 'rXL') }, { at: 'xR', col: 'second', k: tr.k(pre + 'rXR') },
      { at: 'nL', col: 'first', k: tr.k(pre + 'rNL') }, { at: 'nR', col: 'first', k: tr.k(pre + 'rNR') },
    ],
    mult: tr.k(pre + 'mult'),
    sides: { labelL: tr.k(pre + 'pL'), labelR: tr.k(pre + 'pR'), labelsHide: tr.k(pre + 'hide') },
    ...extra,
  });
  return {
    m, lines, extra: al.lines.slice(rows.length), P, v, size: al.size, E, focus,
    showModel(d = 0) { set(pre + 'b.stand', 1, 0.8, d); set(pre + 'b.pieces', 1, 1.2, d + 0.4); set(pre + 'E0', 1, 1.0, d + 1.4); },
    async find(alive) {
      // the denominators: ring each kind of piece in turn
      for (const r of ['rXL', 'rNL', 'rXR', 'rNR']) {
        const has = r === 'rXL' ? pic.L.x.q > 1 : r === 'rNL' ? pic.L.n.q > 1 : r === 'rXR' ? pic.R.x.q > 1 : pic.R.n.q > 1;
        if (!has) continue;
        set(pre + r, 1, 0.4); await w(0.8); if (!alive()) return;
      }
      await w(0.6); if (!alive()) return;
      for (const r of ['rXL', 'rNL', 'rXR', 'rNR']) set(pre + r, 0, 0.5);
    },
    async clear(alive) {
      set(pre + 'O1', 1, 0.8); set(pre + 'mult', 1, 0.6, 0.2); await w(1.0); if (!alive()) return;
      set(pre + 'b.copy', 1, 2.2); await w(2.6); if (!alive()) return;
      set(pre + 'b.merge', 1, 1.8); set(pre + 'mult', 0, 0.6, 0.6); await w(2.0); if (!alive()) return;
      set(pre + 'E1', 1, 1.0); void bump(pre + 'pL', alive); void bump(pre + 'pR', alive); await w(1.3);
      set(pre + 'E0:dim', 1, 0.5); set(pre + 'O1:dim', 1, 0.5);
    },
    async takes(alive) {
      if (!hasTake) return;
      set(pre + 'O2', 1, 0.8); await w(0.9); if (!alive()) return;
      if (sm.tx) { set(pre + 'b.takeX', 1, 1.4); await w(1.6); if (!alive()) return; }
      if (sm.tn) { set(pre + 'b.takeN', 1, 1.4); await w(1.6); if (!alive()) return; }
      set(pre + 'E2', 1, 1.0); void bump(pre + 'pL', alive); void bump(pre + 'pR', alive); await w(1.3);
      set(pre + 'E1:dim', 1, 0.5); set(pre + 'O2:dim', 1, 0.5);
    },
    async split(alive) {
      if (!E.E3) return;
      set(pre + 'O3', 1, 0.8); await w(0.9); if (!alive()) return;
      if (!m.loose) { set(pre + 'b.split', 1, 1.8); await w(2.0); if (!alive()) return; set(pre + 'b.keep', 1, 0.9); await w(1.0); if (!alive()) return; }
      if (!o.hideFinal) { set(pre + 'E3', 1, 1.0); await w(1.2); }
    },
    async check(alive) {
      set(pre + 'hide', 1, 0.5);
      set(pre + 'b.keep', 0, 0.8); await w(0.6); if (!alive()) return;
      set(pre + 'b.split', 0, 1.2); set(pre + 'b.takeN', 0, 1.2, 0.3); set(pre + 'b.takeX', 0, 1.2, 0.6); await w(2.0); if (!alive()) return;
      set(pre + 'b.open', 1, 0.9); await w(1.0); if (!alive()) return;
      set(pre + 'K1', 1, 1.2); await w(1.4); if (!alive()) return;
      set(pre + 'K2', 1, 1.2); await w(1.4);
    },
    async kindNote(alive) { set(pre + 'KN', 1, 1.0); await w(1.2); if (!alive()) return; },
  };
}
function chainScene(C: Chain, extra?: (c: Canvas) => void, focusExtra?: () => Partial<ClearFocus>): void {
  setScene({ table: C.m.layout.S.table, model: c => C.m.draw(c, C.P, C.focus(focusExtra?.())), lines: C.lines, leads: [], boardBox: BRD, extra });
}

// ===================== 1. The question: ½x + ⅔ = ⅓x + 1 =====================
const EX: Eq = eq([X(rat(1, 2)), N(rat(2, 3))], [X(rat(1, 3)), N(1)]);
const EX_PIC = pictureOf(EX)!;
const Y_EX: Ys = { E0: 190, rows: [300, 375, 460, 540], K1: 680, K2: 830 };
const CARDS = [
  { t: `3${XH} + 4 = 2${XH} + 1`, id: MC.someTerms, why: 'q.cb.one' },
  { t: `3${XH} + 4 = 2${XH} + 6`, id: '', why: 'q.cb.right' },
  { t: `3${XH} + ${F(2, 3)} = 2${XH} + 1`, id: MC.someTerms, why: 'q.cb.xonly' },
];
function partQuestion(): void {
  tr.reset('q.');
  const C = buildChain('q.', EX, EX_PIC, Y_EX);
  chainScene(C);
  C.showModel();
  const cards = h('div', { class: 'cards eqs', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 1]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Multiply every term of 1/2 x + 2/3 = 1/3 x + 1 by 6: which equation?', board: '1/2 x + 2/3 = 1/3 x + 1', response: c.t.replace(/<[^>]+>/g, ''), expected: '3x + 4 = 2x + 6', correct: c.id === '' , mc: c.id || undefined, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `<span class="eqcard">${cd.t}</span>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(
    h('h2', {}, 'Pieces on a balance'),
    voiced('q.intro', `The left pan holds <b class="b">half a bag</b> and <b class="a">two thirds of a marble</b>. The right pan holds <b class="b">a third of a bag</b> and <b class="a">one marble</b>. They balance: ${F(1, 2)}${XH} + ${F(2, 3)} = ${F(1, 3)}${XH} + 1.`),
    voiced('q.ask', `Fractions are fiddly. Multiply every term by 6. Which equation do you get? Pick one, and say how sure you are.`),
    cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn),
  );
}

// ===================== 2. Worked example =====================
function partExample(): void {
  tr.reset('e.');
  const C = buildChain('e.', EX, EX_PIC, Y_EX);
  chainScene(C);
  for (const s of ['stand', 'pieces']) tr.jump('e.b.' + s, 1);
  tr.jump('e.E0', 1);
  let step = 0;
  const STEPS = [
    { t: 'Find the multiplier', why: 'Halves and thirds: what clears both?', act: 'Find it' },
    { t: 'Multiply every term by 6', why: 'Six copies of each whole pan.', act: 'Multiply' },
    { t: 'Solve the whole-number equation', why: 'Take the same off both pans.', act: 'Solve' },
    { t: 'Check in the original', why: `Put 2 in for ${XH} in the first line.`, act: 'Check' },
  ];
  const SAY = [
    `The pieces are <b class="b">halves</b> and <b class="a">thirds</b>. 6 is the least number that both 2 and 3 go into, so × 6 clears every fraction.`,
    `Six copies of each pan: still level, because both pans grew six times. The pieces make whole things: <b class="b">3</b> bags + <b class="a">4</b> = <b class="b">2</b> bags + <b class="a">6</b>. <b>3${XH} + 4 = 2${XH} + 6</b>.`,
    `Take 2 bags and 4 marbles off both pans: one bag balances 2 marbles. <b class="s">${XH} = 2</b>.`,
    `Put 2 into the ORIGINAL equation: both sides are ${F(5, 3)}. So <b class="s">${XH} = 2</b> is right.`,
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
      if (i === 0) await C.find(alive);
      else if (i === 1) await C.clear(alive);
      else if (i === 2) { await C.takes(alive); if (!alive()) return; await C.split(alive); }
      else await C.check(alive);
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`, SAY[i]!));
      if (i === 3) selfExplain();
    });
  }
  function selfExplain(): void {
    const opts = [
      { t: 'Six copies of BOTH whole pans still balance: every term gets × 6, so the solution stays the same.', ok: true, id: 'e.why.ok', mc: undefined as string | undefined, say: 'Yes. Multiplying every term on both sides by the same number, not zero, keeps the balance and the solution.' },
      { t: '6 is the only number that clears these fractions.', ok: false, id: 'e.why.only', mc: MC.onlyOne, say: '12 or 18 would clear them too. 6 is just the least, so the numbers stay small.' },
      { t: 'Only the fractions need × 6; the 1 is already whole.', ok: false, id: 'e.why.some', mc: MC.someTerms, say: 'Then the right pan would get only its pieces copied and the balance tips. The 1 is a term too: it becomes 6.' },
    ];
    const bx = h('div', { class: 'opts' }), fbHost = h('div');
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      ctx.store.log({ part: 'example', item: 'example.why', prompt: 'Why may we multiply every term by 6?', response: o.t, correct: o.ok, mc: o.mc });
      if (o.ok) fbHost.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')));
    })));
    after.replaceChildren(voiced('e.why', 'Quick check: why may we multiply every term by 6?', 'div', 'label'), bx, fbHost);
  }
  drawPlan();
  setPanel(h('h2', {}, 'Watch it worked out'), voiced('e.intro', 'Four steps. Press each one: the balance moves first, then the notation.', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn: ¾x + ½ = ¼x + 3 (faded from the end) =====================
const TURN: Eq = eq([X(rat(3, 4)), N(rat(1, 2))], [X(rat(1, 4)), N(3)]);
const TURN_PIC = pictureOf(TURN)!;
function partTurn(): void {
  tr.reset('t.');
  const C = buildChain('t.', TURN, TURN_PIC, { E0: 190, rows: [300, 375, 455, 530, 610, 685], K1: 790, K2: 925 }, { hideFinal: true });
  let only: ClearFocus['only'] = undefined;
  chainScene(C, undefined, () => ({ only, tilt: tr.k('t.tilt') }));
  C.showModel();
  let step = 0;
  const STEPS = [
    { t: 'Find the multiplier', why: 'Done for you: quarters and halves clear with 4.' },
    { t: 'Multiply every term by 4', why: 'Your step.' },
    { t: 'Solve the whole-number equation', why: 'Your step.' },
    { t: 'Check in the original', why: 'Your step.' },
  ];
  const plan = h('ol', { class: 'plan' }), work = h('div');
  const drawPlan = () => plan.replaceChildren(...STEPS.map((s, i) => h('li', { class: i < step ? 'done' : i === step ? 'now' : '' }, h('span', { class: 'mk' }), h('div', {}, h('strong', {}, s.t), h('span', { class: 'why' }, s.why)))));
  drawPlan();
  setPanel(h('h2', {}, 'Your turn: quarters'), voiced('t.intro', `Now ${F(3, 4)}${XH} + ${F(1, 2)} = ${F(1, 4)}${XH} + 3. The multiplier is found for you: the pieces are quarters and halves, so × 4.`), plan, work);
  seq(async alive => {
    await wait(3.0); if (!alive()) return;
    await C.find(alive); if (!alive()) return;
    tr.set('t.O1', 1, 0.8); tr.set('t.mult', 1, 0.6);
    step = 1; drawPlan(); askLine();
  });
  function askLine(): void {
    const fbHost = h('div'), bx = h('div', { class: 'opts' });
    const opts = [
      { t: `3${XH} + 2 = ${XH} + 12`, ok: true, id: 't.line.ok', mc: undefined as string | undefined, say: 'Yes: × 4 on every term, both pans. Watch the four copies gather into whole things.' },
      { t: `3${XH} + 2 = ${XH} + 3`, ok: false, id: 't.line.some', mc: MC.someTerms as string | undefined, say: 'Watch: the 3 marbles were not copied, so the balance tips. The 3 is a term too: 4 × 3 = 12.' },
      { t: `3${XH} + 2 = ${F(1, 4)}${XH} + 3`, ok: false, id: 't.line.left', mc: MC.leftOnly as string | undefined, say: 'Only the left pan was copied, so the balance tips. Both sides get × 4.' },
    ];
    let done = false;
    opts.forEach((o, k) => bx.append(btn(o.t, () => {
      if (done) return;
      bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
      ctx.store.log({ part: 'turn', item: 'turn.line', prompt: '3/4 x + 1/2 = 1/4 x + 3: multiply every term by 4', board: '3/4 x + 1/2 = 1/4 x + 3', response: o.t.replace(/<[^>]+>/g, ''), expected: '3x + 2 = x + 12', correct: o.ok, mc: o.mc });
      fbHost.replaceChildren(voicedFb(o.id, o.ok, o.say));
      if (!o.ok) {
        only = o.id === 't.line.some' ? { R: ['x'] } : { R: [] };
        seq(async alive => {
          tr.set('t.b.copy', 1, 1.8); tr.set('t.tilt', 1, 1.0, 1.4); await wait(4.0); if (!alive()) return;
          tr.set('t.tilt', 0, 0.8); tr.set('t.b.copy', 0, 1.2, 0.4); await wait(1.8); only = undefined;
        });
        return;
      }
      done = true;
      seq(async alive => { tr.set('t.tilt', 0, 0.4); only = undefined; tr.set('t.mult', 0, 0.1); await C.clear(alive); if (!alive()) return; step = 2; drawPlan(); await C.takes(alive); if (!alive()) return; tr.set('t.hide', 1, 0.6); await C.split(alive); if (!alive()) return; askX(); });
    })));
    work.replaceChildren(voiced('t.line', 'Multiply every term by 4. Which line do you get?'), bx, fbHost);
  }
  function askX(): void {
    const fbHost = h('div'), inp = numInput('marbles', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) { fbHost.replaceChildren(voicedFb('t.x.empty', false, 'Type a number first.')); return; }
      const v = r.v, right = v === 5;
      const mc = v === 10 ? MC.intermediate : v === 20 ? undefined : undefined;
      ctx.store.log({ part: 'turn', item: 'turn.x', prompt: '2x = 10: one bag balances how many marbles?', board: '2x = 10', response: v, expected: 5, correct: right, mc });
      if (!right) {
        fbHost.replaceChildren(v === 10 ? voicedFb('t.x.all', false, '10 balances BOTH bags. One bag balances one share: split 10 into 2.') : voicedFb('t.x.no', false, 'Count one share: 10 marbles split into 2 equal rows.'));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.x.ok', true, `Yes: 10 ÷ 2 = 5. <b class="s">${XH} = 5</b>.`));
      seq(async alive => { tr.set('t.E3', 1, 1.0); await wait(1.2); if (!alive()) return; step = 3; drawPlan(); askCheck(); });
    }
    work.replaceChildren(voiced('t.x', `One bag balances how many marbles? ${XH} = ?`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function askCheck(): void {
    const fbHost = h('div'), inp = fracInput('', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read(), v = r ? readQ(r) : null;
      if (!v) { fbHost.replaceChildren(voicedFb('t.x.empty', false, 'Type a number first.')); return; }
      const right = qEq(v, rat(17, 4)), derived = qEq(v, rat(17));
      ctx.store.log({ part: 'turn', item: 'turn.check', prompt: 'Check x = 5: the left side 3/4(5) + 1/2 = ?', response: `${v.p}/${v.q}`, expected: '17/4', correct: right, mc: derived ? MC.derived : undefined });
      if (!right) {
        fbHost.replaceChildren(derived ? voicedFb('t.check.derived', false, `17 is the left side of 3${XH} + 2 = ${XH} + 12, the line after × 4. Check in the ORIGINAL: ${F(3, 4)} × 5 + ${F(1, 2)}.`)
          : voicedFb('t.check.no', false, `${F(3, 4)} × 5 = ${F(15, 4)}, and ${F(15, 4)} + ${F(2, 4)} = ?`));
        return;
      }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb('t.check.ok', true, `${F(17, 4)}, and the right side is ${F(1, 4)} × 5 + 3 = ${F(17, 4)} too. <b class="s">${XH} = 5</b> is right.`));
      seq(async alive => { await C.check(alive); if (!alive()) return; step = 4; drawPlan(); fbHost.append(callback()); });
    }
    work.replaceChildren(voiced('t.check', `Check in the original: what is the left side, ${F(3, 4)} × 5 + ${F(1, 2)}?`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    inp.focus();
  }
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    const text: Record<string, string> = {
      'q.cb.right': `At the start you picked 3${XH} + 4 = 2${XH} + 6, and you were right: every term, both sides, the whole number too.`,
      'q.cb.one': `At the start you picked 3${XH} + 4 = 2${XH} + 1. The 1 was left out. A whole number is a term too: it gets × 6 as well.`,
      'q.cb.xonly': `At the start you picked 3${XH} + ${F(2, 3)} = 2${XH} + 1. Only the ${XH}-terms were multiplied. Every term gets × 6.`,
      'q.cb.none': 'Multiply every term on both sides by the same number: then the balance, and the solution, stay the same.',
    };
    const id = cd ? cd.why : 'q.cb.none';
    c.append(voiced(id, text[id]! + (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go')));
    return c;
  }
}

// ===================== 4. Prove it: Maya's (2/3)x + 4 = 6 -> 2x + 4 = 18 =====================
const MAYA: Eq = eq([X(rat(2, 3)), N(4)], [N(6)]);
const MAYA_PIC = pictureOf(MAYA)!;
function partProve(): void {
  tr.reset('p.');
  // Maya's lines 2 and 3 under the first line (the original), aligned with the right chain below them
  const mayaRows: Row[] = [
    { key: 'p.S2', src: '2x + 4 = 18', y: 320, col: 'dim', tags: {} },
    { key: 'p.S3', src: 'x = 7', y: 400, col: 'dim', tags: {} },
  ];
  const C = buildChain('p.', MAYA, MAYA_PIC, { E0: 185, rows: [480, 545, 610, 675, 740, 805] }, { size: 74, extraRows: mayaRows });
  const S2 = C.extra[0]!, S3 = C.extra[1]!;
  C.lines.push(S2, S3);
  // the check: one line under the solution
  const K = centred('p.K', `\\dfrac{2}{3}(\\cssId{v}{3}) + 4 = 6\\ \\cssId{ok}{\\checkmark}`, 920, Math.round(C.size * 0.9), TAGS);
  C.lines.push(K);
  const extra = (c: Canvas) => {
    for (const [key, L] of [['p.strike2', S2], ['p.strike3', S3]] as const) {
      const ks = tr.k(key);
      if (ks > 0) { const a = sideBox(L, 'L'), b = sideBox(L, 'R'); strike(c, a.x0 - 10, a.cy + 4, b.x1 + 10, b.cy - 4, ks, { col: 'wrong' }); }
    }
  };
  let only: ClearFocus['only'] = undefined;
  chainScene(C, extra, () => ({ only, tilt: tr.k('p.tilt') }));
  C.showModel(); tr.set('p.S2', 1, 0.9, 2.2); tr.set('p.S3', 1, 0.7, 2.9);
  const CHIPS = [
    { t: 'She tripled the ⅔x and the 6, but not the 4.', fits: 0 },
    { t: 'Three copies of each whole pan stay level: every term is tripled.', fits: 1 },
    { t: '12 off both pans, then 2 equal shares; and ⅔ × 3 + 4 = 6.', fits: 2 },
    { t: 'Whole numbers have no fraction to clear, so they stay as they are.', fits: -1, mc: MC.someTerms, id: 'p.no.whole', say: 'That is exactly Maya’s slip. Clearing multiplies EVERY term, so the 4 must become 12.' },
    { t: 'x = 7 makes 2x + 4 = 18 true, so it is right.', fits: -1, mc: MC.derived, id: 'p.no.derived', say: 'It solves her line, but her line is not equivalent to the original. Check in the original: ⅔ × 7 + 4 is not 6.' },
  ];
  const CLAIMS = [
    `Maya’s line <b>2${XH} + 4 = 18</b> does not keep the balance,`,
    `× 3 on every term gives <b>2${XH} + 12 = 18</b>,`,
    `So <b class="s">${XH} = 3</b>, and it checks in the original,`,
  ];
  const SAYC = [
    'Right. Only the pieces of the bag were copied, not the 4 marbles, so the balance tips.',
    'Right. Three copies of each whole pan: still level, and the pieces make 2 bags and 12 marbles.',
    'Right. 12 off both pans leaves 2 bags and 6 marbles: one bag balances 3. And two thirds of 3, plus 4, is 6.',
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
        only = { L: ['x'] };
        tr.set('p.mult', 1, 0.5); tr.set('p.b.copy', 1, 1.8); tr.set('p.tilt', -1, 1.0, 1.4); await wait(3.4); if (!alive()) return;
        tr.set('p.strike2', 1, 0.6); tr.set('p.strike3', 1, 0.6, 0.4); await wait(1.4); if (!alive()) return;
        tr.set('p.tilt', 0, 0.8); tr.set('p.b.copy', 0, 1.2, 0.4); tr.set('p.mult', 0, 0.5); tr.set('p.S2:dim', 1, 0.5); tr.set('p.S3:dim', 1, 0.5); await wait(1.7);
        only = undefined;
      }
      if (n === 2) await C.clear(alive);
      if (n === 3) {
        await C.takes(alive); if (!alive()) return;
        await C.split(alive); if (!alive()) return;
        tr.set('p.K', 1, 1.2); await wait(1.4); if (!alive()) return;
        chipBox.remove();
        fbHost.replaceChildren(voicedFb('p.done', true, 'That’s a proof: three claims, each with its reason, and the balance backs every one. Maya multiplied only some of the terms.'), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
      }
    });
  }
  const yes = btn('Maya is right', () => judge(true)), no = btn('Maya is wrong', () => judge(false));
  const proofHost = h('div');
  function judge(right: boolean): void {
    yes.disabled = no.disabled = true;
    (right ? yes : no).classList.add('on');
    ctx.store.log({ part: 'prove', item: 'prove.judge', prompt: 'Maya: (2/3)x + 4 = 6, times 3: 2x + 4 = 18, so x = 7. Right or wrong?', response: right ? 'right' : 'wrong', expected: 'wrong', correct: !right, mc: right ? MC.someTerms : undefined });
    proofHost.replaceChildren(
      right ? voiced('p.test', 'Let’s test it. Build the argument, and see where it leads.') : voiced('p.build', 'Now prove it. Fill each “because” with the reason that makes the line true.'),
      chain, chipBox, fbHost);
    drawChain();
  }
  setPanel(h('h2', {}, 'Prove it'),
    voiced('p.intro', `Maya clears the fraction in <b>${F(2, 3)}${XH} + 4 = 6</b> by multiplying by 3. She writes <b>2${XH} + 4 = 18</b>, so <b>${XH} = 7</b>. Is Maya right?`),
    h('div', { class: 'row' }, yes, no), proofHost);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as MsItem),
  });
}
function practiceRows(n: number): number[] { const top = 315, bot = 900, gap = Math.min(92, (bot - top) / Math.max(1, n - 1)); return Array.from({ length: n }, (_, i) => top + i * gap); }
function showItem(item: MsItem): { solve?: (alive: () => boolean) => Promise<void> } {
  tr.reset('x.');
  const cp = item.picture?.clear;
  if (cp) {
    const made = tryBlock(() => buildChain('x.', cp.e, cp.pic, { E0: 200, rows: practiceRows(7) }, { size: 78, fast: true }));
    if (made.ok) {
      const C = made.value;
      const late = cp.replay === 'kind';
      const tiltFree = () => tr.k('x.free');
      const free = () => {
        const sm = C.m.layout.sm, t0 = sm.kind === 'none' ? tiltAt(sm, sm.x) : 0;
        return { tilt: t0 * tiltFree(), sides: { ...C.focus().sides, tilt: t0 * tiltFree() } };
      };
      const run = async (alive: () => boolean) => {
        if (cp.replay === 'none') return;
        if (late) { chainScene(C, undefined, free); C.showModel(); await wait(1.6); if (!alive()) return; }
        await C.clear(alive); if (!alive()) return;
        if (cp.replay === 'clear') return;
        await C.takes(alive); if (!alive()) return;
        if (late) { tr.set('x.free', 1, 1.0); await wait(1.0); if (!alive()) return; await C.kindNote(alive); return; }
        await C.split(alive);
      };
      if (!late) { chainScene(C); C.showModel(); return { solve: cp.replay === 'none' ? undefined : run }; }
      const big = box(260, 230, 1660, 790);
      setScene({ lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
      tr.set('x.T', 1, 0.8, 0.1);
      return { solve: run };
    }
  }
  const ls = item.picture?.lines;
  if (ls?.length) {
    const big = box(200, 190, 1720, 900);
    const n = ls.length, gap = Math.min(200, (big.h - 120) / n);
    const lines = ls.map((src, i) => bigLine(`x.L${i}`, src, box(big.x0, big.cy - (gap * (n - 1)) / 2 + i * gap - 80, big.x1, big.cy - (gap * (n - 1)) / 2 + i * gap + 80), n > 3 ? 96 : 120));
    setScene({ lines, leads: [], boardBox: big });
    lines.forEach((L, i) => tr.set(L.key, 1, 0.8, 0.1 + 0.4 * i));
    return {};
  }
  const big = box(260, 230, 1660, 790);
  setScene({ lines: [bigLine('x.T', item.board, big, 130)], leads: [], boardBox: big });
  tr.set('x.T', 1, 0.8, 0.1);
  return {};
}

void runLesson({
  slug: SLUG,
  warm: ['\\cssId{tx}{\\dfrac{1}{2}x} + \\cssId{tn}{\\dfrac{2}{3}} \\cssId{eq}{=} x', '\\times 6 \\div 2 \\checkmark \\square', '\\text{never true: no solution} \\overset{?}{=} \\Rightarrow'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
