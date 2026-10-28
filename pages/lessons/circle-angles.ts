// circle-angles.ts: "Arcs and angles in circles" (Geometry, lesson 12) on the shared runtime.
//   1 The question   a round plaza with a gate (arc AB); three friends on the far wall: who sees the gate widest?
//                    the nearest / the one straight across / all three the same
//   2 Worked example one circle, arc AB = 100°: the central angle (100°), an inscribed angle that slides along the arc
//                    and keeps reading 50° (measured live), then the vertex pushed across the chord (130°, half of
//                    260°). Why half? (the isosceles triangle of two radii)
//   3 Your turn      arc AB = 128°: m∠ACB worked (64°), m∠ADB (same arc) and m∠AEB (across the chord) typed
//   4 Prove it       the base case of the Inscribed Angle Theorem (Parsons with two decoys, then reasons); back to the
//                    plaza: the three angles read 35° each. Callback to part 1.
//   5 Practice       all 33 sub-goals one after another, then mixed (runtime/practice.ts)
// The circle figure is this topic's block (src/lesson/topics/circle-angles/cfig.ts + CircleFig.ts). Reused read-only:
// geometry-foundations geo.ts, GeoFig.ts, ProofFrame.ts, proofPanel.ts, Card.ts.
import type { Canvas } from '../../src/core/draw';
import { box } from '../../src/core/math';
import { progressOf } from '../../src/core/clock';
import type { Paint } from '../../src/core/theme';
import { th, setScene, seq, tr, wait } from '../../src/lesson/runtime/stage';
import { btn, feedback, h, html, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { tryBlock } from '../../src/blocks/block';
import { type Frame, FR_LESSON, FR_RIGHT, FR_WIDE, measure } from '../../src/lesson/topics/geometry-foundations/geo';
import { sheet } from '../../src/lesson/topics/geometry-foundations/GeoFig';
import { ProofFrame, type ProofStep } from '../../src/lesson/topics/geometry-foundations/ProofFrame';
import { proofPanel } from '../../src/lesson/topics/geometry-foundations/proofPanel';
import { cardPainter } from '../../src/lesson/topics/geometry-foundations/Card';
import { type CFig, type CSpec, cfig, cfLayout, onC } from '../../src/lesson/topics/circle-angles/cfig';
import { drawCF } from '../../src/lesson/topics/circle-angles/CircleFig';
import { MC, PROOF_FR, picFrame } from '../../src/lesson/topics/circle-angles/ckit';
import { RS, makeProof, texHtml } from '../../src/lesson/topics/circle-angles/cProofs';
import { FAMILY_NAMES, GENERATORS, type CItem } from '../../src/lesson/topics/circle-angles/items';
import { PLAN } from '../../src/lesson/topics/circle-angles/plan';
import { explain } from '../../src/lesson/topics/circle-angles/explain';
import { SCRIPT } from '../../src/lesson/topics/circle-angles/script';
import { rng } from '../../src/lesson/runtime/item';
import LINES from './circle-angles/voice/lines.json';

const SLUG = 'circle-angles';
let ctx!: LessonCtx;
const go = (i: number) => ctx.go(i);
const setPanel = (...kids: (Node | string)[]) => ctx.panel.replaceChildren(...kids);
const commit = () => ctx.progress.commit;
function voiced(id: string, tag: keyof HTMLElementTagNameMap = 'p', cls = '', extra = ''): HTMLElement {
  const s = SCRIPT[id];
  if (!s) throw new Error(`no script line ${id}`);
  if (!(id in LINES)) console.warn('no voice line', id);
  void ctx.say(id);
  return html(tag, cls, s.html + extra);
}
function voicedFb(id: string, ok: boolean): HTMLElement { void ctx.say(id); return feedback(ok, SCRIPT[id]!.html); }
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
const K = (key: string) => tr.k(key);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** a one-shot choice question in the panel: logs, gives feedback, runs `after` on the right one */
function ask(part: 'turn' | 'prove' | 'example', item: string, prompt: string, opts: { t: string; ok: boolean; id: string; mc?: string }[], after: () => void): HTMLElement {
  const bx = h('div', { class: 'opts' }), fbHost = h('div');
  let done = false;
  opts.forEach((o, k) => bx.append(btn(o.t, () => {
    if (done) return;
    bx.querySelectorAll('button').forEach((b, j) => { b.classList.remove('right', 'nope'); if (j === k) b.classList.add(o.ok ? 'right' : 'nope'); });
    ctx.store.log({ part, item, prompt, response: plainOf(o.t), expected: plainOf(opts.find(x => x.ok)!.t), correct: o.ok, mc: o.mc });
    fbHost.replaceChildren(voicedFb(o.id, o.ok));
    if (o.ok) { done = true; after(); }
  })));
  return h('div', {}, bx, fbHost);
}

// ===================== the plaza (parts 1 and 4) =====================
const PLAZA: CSpec = {
  center: null, on: { A: 235, B: 305, P: 345, Q: 90, R: 180 },
  segs: [{ id: 'PA', col: 'second' }, { id: 'PB', col: 'second' }, { id: 'QA', col: 'pick' }, { id: 'QB', col: 'pick' }, { id: 'RA', col: 'link' }, { id: 'RB', col: 'link' }],
  angles: [{ id: 'APB', col: 'second', text: '35°', r: 70 }, { id: 'AQB', col: 'pick', text: '35°', r: 84 }, { id: 'ARB', col: 'link', text: '35°', r: 84 }],
  arcs: [{ from: 'A', to: 'B', col: 'first', text: '70°' }],
};
const PLAZA_FIG = cfig(PLAZA);
function plazaScene(p: string): (c: Canvas) => void {
  const L = cfLayout(PLAZA_FIG, FR_WIDE);
  return c => {
    sheet(c, FR_WIDE, K(p + 'sheet'));
    const kl = K(p + 'lab');
    drawCF(c, PLAZA_FIG, FR_WIDE, { k: K(p + 'fig'), labels: { APB: kl, AQB: kl, ARB: kl }, arcLabels: { AB: kl } }, L);
  };
}

// ===================== 1. The question =====================
const CARDS = [
  { name: 'P', t: 'nearest the gate: it looks biggest up close', mc: MC.trusts as string | undefined, cb: 'q.cb.near', right: false },
  { name: 'All the same', t: 'P, Q and R see the gate at the same angle', mc: undefined as string | undefined, cb: 'q.cb.same', right: true },
  { name: 'Q', t: 'straight across from the gate', mc: MC.trusts as string | undefined, cb: 'q.cb.across', right: false },
];
function partQuestion(): void {
  tr.reset('q.');
  setScene({ boardBox: null, lines: [], leads: [], model: plazaScene('q.') });
  tr.set('q.sheet', 1, 0.6); tr.set('q.fig', 1, 0.9, 0.3);
  const cards = h('div', { class: 'cards', role: 'group', 'aria-label': 'answers' });
  const sure = h('div', { class: 'sure', role: 'group', 'aria-label': 'how sure' });
  const goBtn = btn('Find out', () => {
    const c = CARDS[commit().pick ?? 0]!;
    ctx.store.log({ part: 'question', item: 'question.commit', prompt: 'Three friends on the far wall of a round plaza look at a gate AB. Who sees it at the widest angle?', response: `${c.name}: ${c.t}`, expected: 'All the same', correct: c.right, mc: c.mc, sure: commit().sure ?? undefined });
    go(1);
  }, 'go');
  const sync = () => {
    cards.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().pick === i));
    sure.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', commit().sure === i));
    goBtn.disabled = commit().pick === null || commit().sure === null;
    ctx.store.saveProgress(ctx.progress);
  };
  CARDS.forEach((cd, i) => { const b = h('button'); b.innerHTML = `${cd.name}<small>${cd.t}</small>`; b.addEventListener('click', () => { commit().pick = i; sync(); }); cards.append(b); });
  SURE.forEach((s, i) => sure.append(btn(s, () => { commit().sure = i; sync(); })));
  sync();
  setPanel(h('h2', {}, 'Who sees the widest gate?'), voiced('q.intro'), cards, h('div', { class: 'label' }, 'How sure are you?'), sure, h('div', { class: 'row' }, goBtn));
}

// ===================== 2. Worked example: one arc, three angles =====================
const EA = 220, EB = 320;
const exSpec = (cDeg: number, cross: number): CSpec => {
  const m = Math.round(measure(onC({ O: [0, 0], R: 300 }, cDeg), onC({ O: [0, 0], R: 300 }, EA), onC({ O: [0, 0], R: 300 }, EB)));
  return {
    center: 'O', on: { A: EA, B: EB, C: cDeg }, segs: [{ id: 'OA', col: 'first' }, { id: 'OB', col: 'first' }, { id: 'CA', col: 'second' }, { id: 'CB', col: 'second' }],
    angles: [{ id: 'AOB', col: 'first', text: '100°', r: 52 }, { id: 'ACB', col: cross > 0.5 ? 'link' : 'second', text: `${m}°`, r: 66 }],
    arcs: [{ from: 'A', to: 'B', col: 'first', text: '100°' }, { from: 'B', to: 'A', col: 'link', text: '260°' }],
  };
};
const EX_FIT = cfLayout(cfig(exSpec(90, 0)), FR_WIDE).fit;
function exC(): number {
  const ks = K('e.slide'), kc = K('e.cross');
  if (kc > 0) return 90 + 175 * kc;   // the long way round, through A, onto arc AB
  return 90 + 58 * Math.sin(2 * Math.PI * ks);
}
function partExample(): void {
  tr.reset('e.');
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_WIDE, K('e.sheet'));
      const cd = exC(), kc = K('e.cross');
      const cf = cfig(exSpec(cd, kc));
      const L = cfLayout(cf, FR_WIDE, EX_FIT);
      const near = clamp01((Math.min(Math.abs(cd - EA), Math.abs(cd - EB)) - 6) / 14);
      const kIns = K('e.ins') * near;
      drawCF(c, cf, FR_WIDE, {
        k: K('e.fig'),
        segs: { OA: K('e.cen'), OB: K('e.cen'), CA: kIns, CB: kIns },
        marks: { AOB: K('e.cen'), ACB: kIns }, labels: { AOB: K('e.cen'), ACB: kIns },
        letters: 1, arcs: { AB: K('e.cen'), BA: K('e.major') }, glow: { ACB: K('e.glow') * near },
      }, L);
    },
  });
  tr.set('e.sheet', 1, 0.5); tr.set('e.fig', 1, 0.8, 0.2);
  let step = 0;
  const STEPS = [
    { t: 'The central angle', why: 'Where is its vertex?', act: 'Measure' },
    { t: 'An inscribed angle', why: 'What happens as C slides?', act: 'Slide C' },
    { t: 'Across the chord', why: 'And on the other arc?', act: 'Push C across' },
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
      if (i === 0) { tr.set('e.cen', 1, 1.0); await wait(1.2); }
      else if (i === 1) { tr.set('e.ins', 1, 0.7); tr.set('e.glow', 1, 0.5, 0.5); await wait(0.9); if (!alive()) return; tr.set('e.slide', 1, 3.6); await wait(3.8); }
      else { tr.set('e.cross', 1, 2.8); await wait(1.2); if (!alive()) return; tr.set('e.major', 1, 0.8); await wait(1.9); }
      if (!alive()) return;
      sayBox.replaceChildren(voiced(`e.step${i}`));
      if (i === 2) selfExplain();
    });
  }
  function selfExplain(): void {
    after.replaceChildren(voiced('e.why', 'div', 'label'), ask('example', 'example.why', 'Why is the inscribed angle exactly half the central angle?', [
      { t: 'C is twice as far from the arc as O is', ok: false, id: 'e.why.far', mc: MC.trusts },
      { t: 'two radii make an isosceles triangle, and the central angle is its exterior angle', ok: true, id: 'e.why.ok' },
      { t: 'it looks half as wide', ok: false, id: 'e.why.look', mc: MC.appearance },
    ], () => after.append(h('div', { class: 'row' }, btn('Your turn', () => go(2), 'go')))));
  }
  drawPlan();
  setPanel(h('h2', {}, 'One arc, three angles'), voiced('e.intro', 'p', 'dim'), plan, sayBox, after);
}

// ===================== 3. Your turn =====================
const T_FIG: CFig = cfig({
  center: null, on: { A: 206, B: 334, C: 40, D: 135, E: 300 },
  segs: ['CA', 'CB', 'DA', 'DB', 'EA', 'EB'].map(id => ({ id, col: 'ink' as const })),
  angles: [{ id: 'ACB', col: 'second', text: '?', alt: '64°', r: 66 }, { id: 'ADB', col: 'pick', text: '?', alt: '64°', r: 66 }, { id: 'AEB', col: 'link', text: '?', alt: '116°', r: 44 }],
  arcs: [{ from: 'A', to: 'B', col: 'first', text: '128°' }],
});
function partTurn(): void {
  tr.reset('t.');
  const L = cfLayout(T_FIG, FR_WIDE);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      sheet(c, FR_WIDE, K('t.sheet'));
      drawCF(c, T_FIG, FR_WIDE, {
        k: K('t.fig'),
        segs: { CA: K('t.cl'), CB: K('t.cl'), DA: K('t.dl'), DB: K('t.dl'), EA: K('t.el'), EB: K('t.el') },
        marks: { ACB: K('t.cl'), ADB: K('t.dl'), AEB: K('t.el') },
        solved: { ACB: K('t.c'), ADB: K('t.d'), AEB: K('t.e') },
        glow: { ACB: K('t.cg') * (1 - K('t.c')), ADB: K('t.dg') * (1 - K('t.d')), AEB: K('t.eg') * (1 - K('t.e')) },
      }, L);
    },
  });
  tr.set('t.sheet', 1, 0.5); tr.set('t.fig', 1, 0.8, 0.2);
  const work = h('div');
  seq(async alive => {
    await wait(1.2); if (!alive()) return;
    tr.set('t.cl', 1, 0.6); tr.set('t.cg', 1, 0.6); await wait(0.9); if (!alive()) return;
    tr.set('t.c', 1, 0.9);
    work.replaceChildren(voiced('t.c'));
    await wait(1.6); if (!alive()) return;
    askD();
  });
  function numAsk(id: string, item: string, prompt: string, right: number, wrongs: { v: number; id: string; mc?: string }[], other: string, onRight: () => void): HTMLElement {
    const fbHost = h('div'), inp = numInput('°', () => check()), ok = btn('Check', () => check(), 'go');
    function check(): void {
      const r = inp.read();
      if (!r || r.kind !== 'num' || !Number.isFinite(r.v)) return;
      const w = wrongs.find(x => Math.abs(x.v - r.v) < 1e-9);
      const good = Math.abs(r.v - right) < 1e-9;
      ctx.store.log({ part: 'turn', item, prompt, response: r.v, expected: right, correct: good, mc: good ? undefined : w?.mc });
      if (!good) { fbHost.replaceChildren(voicedFb(w?.id ?? other, false)); return; }
      ok.disabled = true;
      fbHost.replaceChildren(voicedFb(`${id}.ok`, true));
      onRight();
    }
    const d = h('div', {}, voiced(`${id}.ask`), inp.node, h('div', { class: 'row' }, ok), fbHost);
    setTimeout(() => inp.focus(), 50);
    return d;
  }
  function askD(): void {
    tr.set('t.dl', 1, 0.6); tr.set('t.dg', 1, 0.6);
    work.append(numAsk('t.d', 'turn.adb', 'Arc AB = 128°; D is on the same arc as C. What is m∠ADB?', 64, [
      { v: 128, id: 't.d.full', mc: MC.fullArc }, { v: 116, id: 't.d.supp', mc: MC.congSupp }, { v: 256, id: 't.d.full', mc: MC.doubled },
    ], 't.d.other', () => { tr.set('t.d', 1, 0.9); seq(async alive => { await wait(1.8); if (alive()) askE(); }); }));
  }
  function askE(): void {
    tr.set('t.el', 1, 0.6); tr.set('t.eg', 1, 0.6);
    work.append(numAsk('t.e', 'turn.aeb', 'Arc AB = 128°; E is on arc AB. What is m∠AEB?', 116, [
      { v: 64, id: 't.e.same', mc: MC.eitherSide }, { v: 232, id: 't.e.full', mc: MC.fullArc }, { v: 128, id: 't.e.same', mc: MC.minorDefault },
    ], 't.e.other', () => {
      tr.set('t.e', 1, 0.9);
      seq(async alive => { await wait(1.8); if (!alive()) return; work.append(voiced('t.done'), h('div', { class: 'row' }, btn('Prove it', () => go(3), 'go'))); ctx.panel.scrollTop = ctx.panel.scrollHeight; });
    }));
    ctx.panel.scrollTop = ctx.panel.scrollHeight;
  }
  setPanel(h('h2', {}, 'Your turn: one arc, three angles'), voiced('t.intro'), work);
}

// ===================== 4. Prove it: the base case =====================
const P_PROOF = (() => { const p = makeProof('base', rng(11)); return p; })();
const P_FIG: CFig = cfig({ center: 'O', on: { C: 150, B: 330, A: 70 }, segs: ['CB', 'CA', 'OA'], angles: [{ id: 'ACB', col: 'second', text: 'x', r: 70 }, { id: 'AOB', col: 'first', r: 46 }], arcs: [{ from: 'B', to: 'A', col: 'link', thin: true }] });
const P_HTML = P_PROOF.rows.map(r => texHtml(r.st));
const P_DECOYS = P_PROOF.decoys.map(d => ({ st: texHtml(d.st), why: d.why[0]!.toUpperCase() + d.why.slice(1), mc: d.mc }));
const P_MENU = [
  { t: RS.radii }, { t: RS.isoBase }, { t: RS.extAngle }, { t: RS.arcDef }, { t: RS.divProp },
  { t: RS.inscribed, mc: MC.circular, why: 'That is the theorem being proved: it cannot be a reason in its own proof.' },
  { t: RS.triSum, mc: MC.noReason, why: '∠AOB is outside △OAC: the Exterior Angle Theorem gives it as the sum of the two remote angles.' },
];
function partProve(): void {
  tr.reset('p.');
  const placed: number[] = [], reasons: string[] = [];
  const RIGHT: Frame = { x: FR_RIGHT.x, y: FR_RIGHT.y, w: FR_RIGHT.w, h: FR_RIGHT.h };
  const make = () => ProofFrame({ given: P_PROOF.given, prove: P_PROOF.prove, rows: P_PROOF.rows.map((_, k) => ({ st: placed[k] ? P_PROOF.rows[placed[k]! - 1]!.st : '', rs: reasons[k] ?? '' })), reserve: P_PROOF.rows.map(l => l.st), reserveRs: P_MENU.map(m => m.t) }, RIGHT, th);
  let P = make();
  const plaza = plazaScene('p.z');
  const LP = cfLayout(P_FIG, FR_LESSON);
  setScene({
    boardBox: null, lines: [], leads: [],
    model: c => {
      const fw = K('p.plaza');
      if (fw < 1) {
        const a = 1 - fw;
        c.g.save(); c.g.globalAlpha *= a;
        sheet(c, FR_LESSON, K('p.sheet'));
        const gl = (k: string) => K(`p.${k}`) * (1 - K(`p.${k}off`));
        drawCF(c, P_FIG, FR_LESSON, { k: K('p.fig'), glow: { OA: gl('g1'), ACB: gl('g2'), AOB: gl('g3'), BA: gl('g4') } }, LP);
        P.draw(c, progressOf<ProofStep>(s => tr.k(`p.pf.${s}`)), {});
        c.g.restore();
      }
      if (fw > 0) { c.g.save(); c.g.globalAlpha *= fw; plaza(c); c.g.restore(); }
    },
  });
  tr.set('p.sheet', 1, 0.5); tr.set('p.fig', 1, 0.8, 0.2); tr.set('p.pf.frame', 1, 0.8, 0.5);
  const host = h('div'), fbHost = h('div'), nextHost = h('div');
  const panel = proofPanel({
    lines: P_PROOF.rows.map((l, i) => ({ st: P_HTML[i]!, rs: l.rs, uses: l.uses })),
    decoys: P_DECOYS, menu: P_MENU, order: [5, 2, 0, 6, 4, 1, 3],
    say: { order: 'Tap the lines in an order that works (two are decoys).', reasons: 'Now pick the reason for each line, top to bottom.' },
    onPlace(line, pos) {
      placed[pos] = line; P = make(); tr.set(`p.pf.s${pos}`, 1, 0.8);
      for (const k of ['g1', 'g2', 'g3', 'g4']) if (K(`p.${k}`) > 0) tr.set(`p.${k}off`, 1, 0.4);
      if (line <= 4) tr.set(`p.g${line}`, 1, 0.5);
      ctx.store.log({ part: 'prove', item: `prove.order${pos + 1}`, prompt: `Line ${pos + 1} of the proof`, response: plainOf(P_HTML[line - 1]!), correct: true });
    },
    onReason(pos, _line, reason) {
      reasons[pos] = reason; P = make(); tr.set(`p.pf.r${pos}`, 1, 0.7);
      ctx.store.log({ part: 'prove', item: `prove.reason${pos + 1}`, prompt: `Reason for line ${pos + 1}`, response: reason, correct: true });
      fbHost.replaceChildren();
    },
    onWrong(e) {
      ctx.store.log({ part: 'prove', item: `prove.${e.phase}`, prompt: e.prompt, response: e.response, correct: false, mc: e.mc });
      void ctx.say('p.wrong');
    },
    onDone() {
      seq(async alive => {
        fbHost.replaceChildren(voicedFb('p.proved', true));
        await wait(2.2); if (!alive()) return;
        tr.set('p.plaza', 1, 1.0); tr.set('p.zsheet', 1, 0.1); tr.set('p.zfig', 1, 0.8, 0.3);
        host.replaceChildren(nextHost);
        nextHost.replaceChildren(voiced('p.plaza'));
        await wait(2.0); if (!alive()) return;
        nextHost.append(voiced('p.next', 'div', 'label'), ask('prove', 'prove.plaza', 'Arc AB = 70°. How wide does the gate look to P, Q and R?', [
          { t: 'P sees it widest: P is nearest', ok: false, id: 'p.next.near', mc: MC.trusts },
          { t: '35° for each of them', ok: true, id: 'p.next.ok' },
          { t: '70° for each of them', ok: false, id: 'p.next.full', mc: MC.fullArc },
        ], () => seq(async alive2 => {
          tr.set('p.zlab', 1, 0.9); await wait(2.4); if (!alive2()) return;
          nextHost.append(callback()); ctx.panel.scrollTop = ctx.panel.scrollHeight;
        })));
        ctx.panel.scrollTop = ctx.panel.scrollHeight;
      });
    },
  });
  function callback(): HTMLElement {
    const c = h('div', { class: 'callback' });
    const pick = commit().pick, cd = pick === null ? null : CARDS[pick]!;
    c.append(voiced(cd ? cd.cb : 'q.cb.same', 'p', '', (cd ? ` <span class="dim">(You were ${SURE[commit().sure ?? 0]!.toLowerCase()}.)</span>` : '')), h('div', { class: 'row' }, btn('Practice', () => go(4), 'go')));
    return c;
  }
  host.replaceChildren(panel.node, fbHost);
  setPanel(h('h2', {}, 'Prove it'), voiced('p.intro'), host);
}

// ===================== 5. Practice =====================
function partPractice(): void {
  tr.reset('x.');
  const seed = ctx.qs.get('seed');
  startPractice({
    topic: SLUG, store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS, familyNames: FAMILY_NAMES, explain,
    seed: seed === null ? undefined : Number(seed),
    show: it => showItem(it as CItem),
  });
}
type Solve = { solve?: (alive: () => boolean) => Promise<void> };
function showItem(item: CItem): Solve {
  tr.reset('x.');
  (window as unknown as { __practiceItem: CItem }).__practiceItem = item;
  const p = item.picture ?? {};
  const rv = p.reveal ?? {};
  const draws: ((c: Canvas) => void)[] = [];
  const keysOn: string[] = [];
  const set = (ids: string[] | undefined, key: string): Record<string, number> => Object.fromEntries((ids ?? []).map(id => [id, K(key)]));
  if (p.cfig) {
    const fr = picFrame(p), f = p.cfig, L = cfLayout(f, fr);
    draws.push(c => {
      sheet(c, fr, K('x.fig'));
      drawCF(c, f, fr, { k: K('x.fig'), solve: K('x.solve'), solved: set(rv.solved, 'x.solved'), glow: set(rv.glow, 'x.glow'), col: K('x.col') > 0.5 ? rv.col : undefined }, L);
    });
    keysOn.push('x.fig');
  }
  if (p.proof) {
    const pr = p.proof;
    const askedRow = new Set((pr.ask ?? []).map(a => a.i));
    const fill = new Map((rv.fill ?? []).filter(x => askedRow.has(x.i)).map(x => [x.i, x]));
    const rows = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
    const made = tryBlock(() => ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, PROOF_FR(p), th));
    if (made.ok) {
      const B = made.value, asked = new Set((pr.ask ?? []).map(a => `${a.cell === 'st' ? 's' : 'r'}${a.i}`));
      const P = progressOf<ProofStep>(s => (s === 'frame' ? K('x.fig') : asked.has(s) ? K('x.fill') : K('x.fig')));
      draws.push(c => B.draw(c, P, {
        ask: pr.ask, rings: [...(pr.ask ?? []).map(a => ({ i: a.i, col: 'pick' as Paint, k: K('x.fig') })), ...(rv.rings ?? []).map(i => ({ i, col: 'link' as Paint, k: K('x.rings') }))],
        strike: (rv.strike ?? []).map(i => ({ i, k: K('x.strike') })),
      }));
    } else console.warn('proof frame failed', made.error);
  } else if (p.card) {
    const b = p.cfig ? box(FR_RIGHT.x, 160, FR_RIGHT.x + FR_RIGHT.w, 920) : box(190, 140, 1730, 940);
    const C = cardPainter([...p.card.lines, ...(rv.lines ?? [])], b, { nFirst: p.card.lines.length, size: p.cfig ? 46 : 52, align: 'left' });
    if (!C.fits) console.warn('card does not fit', item.family);
    draws.push(c => C.draw(c, K('x.card'), K('x.lines')));
    keysOn.push('x.card');
  }
  if (!draws.length) {
    const C = cardPainter([plainOf(item.prompt)], box(190, 140, 1730, 940));
    draws.push(c => C.draw(c, K('x.card')));
    keysOn.push('x.card');
  }
  setScene({ model: c => draws.forEach(d => d(c)), lines: [], leads: [], boardBox: null });
  keysOn.forEach((k, i) => tr.set(k, 1, 0.7, 0.1 + 0.2 * i));
  return {
    solve: async alive => {
      tr.set('x.solve', 1, 0.8); tr.set('x.solved', 1, 0.9, 0.2); tr.set('x.glow', 1, 0.6, 0.2); tr.set('x.col', 1, 0.4);
      tr.set('x.fill', 1, 0.9, 0.3); tr.set('x.rings', 1, 0.6, 0.5); tr.set('x.strike', 1, 0.6, 0.6); tr.set('x.lines', 1, 0.9, 0.3);
      void alive;
    },
  };
}

void runLesson({
  slug: SLUG,
  warm: ['OA = OC \\ m\\angle OAC = x \\ m\\angle AOB = 2x \\ m\\overparen{AB} = 2x \\ x = \\tfrac{1}{2}\\,m\\overparen{AB} \\ \\overline{CB} \\text{ is a diameter of circle } O \\ A \\text{ is on the circle};\\ x = m\\angle ACB \\ \\text{Given Prove}'],
  parts: [
    x => { ctx = x; partQuestion(); },
    x => { ctx = x; partExample(); },
    x => { ctx = x; partTurn(); },
    x => { ctx = x; partProve(); },
    x => { ctx = x; partPractice(); },
  ],
});
