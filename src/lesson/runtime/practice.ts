// practice.ts: practice that walks through EVERY sub-goal of a topic, then mixes them.
//   1 Walk-through  sub-goal by sub-goal (topic JSON order): items from that sub-goal's families until 2 are right
//                   (at most 5; a sub-goal that is not reached is flagged and comes back more often later).
//   2 Mixed         interleaved over all sub-goals, never the same family twice in a row, the weakest sub-goal first.
//   Mastery         5 of the last 6 right, from at least 4 families, and every sub-goal right at least twice.
// After a miss: the worked solution (panel + the topic's own canvas replay), then a twin (same sub-goal and family).
// Every answer goes to the diagnosis log (store.ts) with its sub-goal, family, item, response and misconception.
import { type Gen, type Item, plain, rng } from './item';
import { type LessonStore } from './store';
import { btn, feedback, fracInput, h, html, type Input, numInput, pairInput, choiceInput, solutionList, type Kid } from './panel';
import { newEpoch, seq } from './stage';

export interface SubgoalPlan { id: string; title: string; families: string[] }
export interface PracticeOpts {
  topic: string;
  store: LessonStore;
  host: HTMLElement;
  plan: readonly SubgoalPlan[];
  gens: Readonly<Record<string, Gen>>;
  familyNames: Readonly<Record<string, string>>;
  /** draw the item on the canvas; `solve` replays the worked solution there after a miss */
  show(item: Item): { solve?: (alive: () => boolean) => Promise<void> };
  seed?: number;
}
export const MASTERY = { window: 6, need: 5, families: 4, perSubgoal: 2 } as const;
const WALK_NEED = 2, WALK_MAX = 5;

interface Rec { subgoal: string; family: string; ok: boolean }

export function startPractice(o: PracticeOpts): void {
  const R = rng(o.seed ?? Math.floor(Math.random() * 1e9));
  const recs: Rec[] = [];
  let walk = 0, n = 0, lastFamily = '', twin: { subgoal: string; family: string } | null = null;
  const flagged = new Set<string>();
  let mapOpen = false;
  const okBy = (sg: string) => recs.filter(r => r.subgoal === sg && r.ok).length;
  const triedBy = (sg: string) => recs.filter(r => r.subgoal === sg).length;
  const allFamilies = [...new Set(o.plan.flatMap(p => p.families))];

  const head = h('div'), body = h('div'), map = h('div', { class: 'sgmap' }), meter = h('div', { class: 'meter' });
  o.host.replaceChildren(h('h2', {}, 'Practice'), html('p', 'dim', 'Every part of the topic, one after another, then all mixed. After a slip you see why, then get one like it.'), head, body, meter, map);

  function mastery(): { done: boolean; lastOk: number; famOk: number; win: Rec[] } {
    const win = recs.filter((_, i) => i >= recs.length - MASTERY.window);
    const lastOk = win.filter(r => r.ok).length, famOk = new Set(win.filter(r => r.ok).map(r => r.family)).size;
    const allSub = o.plan.every(p => okBy(p.id) >= MASTERY.perSubgoal);
    return { done: win.length >= MASTERY.window && lastOk >= MASTERY.need && famOk >= Math.min(MASTERY.families, allFamilies.length) && allSub, lastOk, famOk, win };
  }
  function pickNext(): { subgoal: SubgoalPlan; family: string } {
    if (twin) { const t = twin; twin = null; return { subgoal: o.plan.find(p => p.id === t.subgoal)!, family: t.family }; }
    let sg: SubgoalPlan;
    if (walk < o.plan.length) sg = o.plan[walk]!;
    else {
      // mixed: the weakest sub-goal (fewest right, flagged first), never the same family twice in a row
      const score = (p: SubgoalPlan) => okBy(p.id) - (flagged.has(p.id) ? 1.5 : 0) + R() * 0.9;
      const cands = o.plan.filter(p => p.families.some(f => f !== lastFamily));
      sg = cands.sort((a, b) => score(a) - score(b))[0] ?? o.plan[0]!;
    }
    const fams = sg.families.filter(f => f !== lastFamily);
    const family = (fams.length ? fams : sg.families)[Math.floor(R() * (fams.length || sg.families.length))]!;
    return { subgoal: sg, family };
  }
  function make(sg: SubgoalPlan, family: string): Item {
    const g = o.gens[family];
    if (!g) throw new Error(`practice: no generator for family ${family}`);
    const it = g(R, ++n, sg.id);
    it.subgoal = sg.id;
    return it;
  }
  function drawMap(current: string): void {
    // a compact strip (one square per part) that always fits, and the full list behind a disclosure
    const st = (p: SubgoalPlan) => okBy(p.id) >= MASTERY.perSubgoal ? 'ok' : flagged.has(p.id) ? 'flag' : p.id === current ? 'now' : triedBy(p.id) ? 'some' : '';
    const strip = h('div', { class: 'sgstrip', role: 'img', 'aria-label': `${o.plan.filter(p => st(p) === 'ok').length} of ${o.plan.length} parts done` },
      ...o.plan.map((p, i) => h('i', { class: st(p), title: `${i + 1}. ${p.title}` })));
    const list = h('ol', {}, ...o.plan.map((p, i) => h('li', { class: st(p), title: p.id }, h('i'), `${i + 1}. ${p.title}`)));
    const det = h('details', mapOpen ? { open: '' } : {}, h('summary', {}, 'Parts of this topic'), list);
    det.addEventListener('toggle', () => { mapOpen = det.open; });
    map.replaceChildren(strip, det);
  }
  function drawMeter(): void {
    const ms = mastery(), inWalk = walk < o.plan.length;
    const marks = h('span', { class: 'marks' }, ...Array.from({ length: MASTERY.window }, (_, i) => { const a = ms.win[i]; return h('i', { class: a ? (a.ok ? 'ok' : 'no') : '' }); }));
    const covered = o.plan.filter(p => okBy(p.id) >= MASTERY.perSubgoal).length;
    meter.replaceChildren(marks, h('span', {}, ms.done
      ? `Mastered for today: all ${o.plan.length} parts. They come back in 2 days, then a week, then a month.`
      : inWalk ? `${covered} of ${o.plan.length} parts done · ${recs.length} problems so far`
        : `Mixed practice · ${ms.lastOk} of the last ${Math.min(MASTERY.window, recs.length)} right · ${covered} of ${o.plan.length} parts done`));
  }
  function next(): void {
    newEpoch();
    const { subgoal, family } = pickNext();
    const item = make(subgoal, family);
    lastFamily = family;
    const view = o.show(item);
    (window as unknown as { __practiceItem: Item }).__practiceItem = item;   // for headless click-throughs
    drawMap(subgoal.id); drawMeter();
    const inWalk = walk < o.plan.length;
    head.replaceChildren(h('div', { class: 'label' }, inWalk ? `Part ${walk + 1} of ${o.plan.length}: ${subgoal.title}` : `Mixed · ${subgoal.title}`));
    const fb = h('div');
    const check = btn('Check', () => submit(), 'go');
    let input: Input;
    if (item.input === 'frac') input = fracInput(item.unit ?? '', () => submit());
    else if (item.input === 'num') input = numInput(item.unit ?? '', () => submit());
    else if (item.input === 'pair') input = pairInput(item.pairLead ?? '', item.pairOp ?? '÷', () => submit(), item.pairTail ?? '');
    else input = choiceInput(item.choices ?? []);
    const t0 = performance.now();
    let done = false;
    function submit(): void {
      if (done) return;
      const r = input.read();
      if (!r) { fb.replaceChildren(feedback(false, 'Fill in your answer first.')); return; }
      done = true; check.disabled = true;
      const v = item.check(r);
      recs.push({ subgoal: subgoal.id, family, ok: v.ok });
      o.store.log({ part: 'practice', subgoal: subgoal.id, family, item: item.id, prompt: plain(item.prompt), board: item.board, response: r, expected: item.answer, correct: v.ok, mc: v.mc, ms: Math.round(performance.now() - t0) });
      if (inWalk) {
        if (okBy(subgoal.id) >= WALK_NEED) walk++;
        else if (triedBy(subgoal.id) >= WALK_MAX) { flagged.add(subgoal.id); walk++; }
      }
      if (!v.ok) twin = { subgoal: subgoal.id, family };
      const extra: Kid[] = v.ok ? [] : [solutionList(item.solution)];
      fb.replaceChildren(feedback(v.ok, v.say, extra), h('div', { class: 'row' }, btn(v.ok ? 'Next' : 'Try one like it', () => next(), 'go')));
      if (!v.ok && view.solve) seq(view.solve);
      drawMap(subgoal.id); drawMeter();
    }
    body.replaceChildren(h('div', { class: 'label' }, `Problem ${n} · ${o.familyNames[family] ?? family}`), html('p', '', item.prompt), input.node, h('div', { class: 'row' }, check), fb);
    setTimeout(() => input.focus(), 50);
  }
  next();
}
