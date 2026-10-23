// placement.ts: the check-in page of the lesson line (docs/lessons/QUALITY_LAYER.md). About 20 questions from the
// lessons' own practice families (each lesson's placement.ts adapter), chosen by the student model
// (src/lesson/placement/model.ts) on the lesson graph (placement/graph.json) and the strands (placement/strands.json);
// the result is a start lesson per strand, and for the teacher the whole path (what can be skipped, gaps, the
// misconceptions seen). A lesson's code loads only when it is asked.
// ?seed=N makes the questions repeatable, ?grade=7 skips the grade question (headless tests).
import { type Item, type Response, rng } from '../../src/lesson/runtime/item';
import { btn, choiceInput, fracInput, h, html, type Input, numInput, pairInput } from '../../src/lesson/runtime/panel';
import type { SubgoalPlan } from '../../src/lesson/runtime/practice';
import type { Placement } from '../../src/lesson/placement/types';
import { type Graph, type State, type StrandDef, create, gradePriors, next, record, result } from '../../src/lesson/placement/model';
import { texAsync, texReady, texDraw, texWidth } from '../../src/core/tex';
import { canvasFor } from '../../src/core/draw';
import { ink } from '../../src/core/theme';
import GRAPH from './placement/graph.json';
import STRANDS from './placement/strands.json';

interface Lesson { gens: Record<string, (R: () => number, n: number, sg?: string) => Item>; plan: readonly SubgoalPlan[]; P: Placement }
const ITEMS = import.meta.glob('../../src/lesson/topics/*/items.ts');
const PLANS = import.meta.glob('../../src/lesson/topics/*/plan.ts');
const ADAPTERS = import.meta.glob('../../src/lesson/topics/*/placement.ts');
const slugOf = (k: string) => k.split('/').at(-2)!;
const graph = GRAPH as Graph;
const strands = (STRANDS as { strands: StrandDef[] }).strands;
const strandOf = new Map(strands.flatMap(t => t.slugs.map(s => [s, t] as const)));
const askable = Object.keys(ADAPTERS).map(slugOf).filter(s => graph.units.some(u => u.id === s));
const panel = document.getElementById('panel')!;
const qs = new URLSearchParams(location.search);
const R = rng(qs.has('seed') ? Number(qs.get('seed')) : Math.floor(Math.random() * 1e9));
const KEY = 'mathscenes.placement';
const cache = new Map<string, Lesson>();

async function lesson(slug: string): Promise<Lesson> {
  const hit = cache.get(slug);
  if (hit) return hit;
  const base = `../../src/lesson/topics/${slug}/`;
  const [items, plan, ad] = await Promise.all([ITEMS[base + 'items.ts']!(), PLANS[base + 'plan.ts']!(), ADAPTERS[base + 'placement.ts']!()]) as [Record<string, unknown>, { PLAN: SubgoalPlan[] }, { PLACEMENT: Placement }];
  const gens = (items.GENERATORS ?? items.GENS) as Lesson['gens'];
  const L = { gens, plan: plan.PLAN, P: ad.PLACEMENT };
  cache.set(slug, L);
  return L;
}
/** a question from the lesson's picks (they take turns), kept by the adapter's use() filter */
const turn = new Map<string, number>();
function makeItem(slug: string, L: Lesson): { it: Item; family: string } {
  const t = turn.get(slug) ?? Math.floor(R() * L.P.picks.length);
  turn.set(slug, t + 1);
  const pk = L.P.picks[t % L.P.picks.length]!;
  for (let n = 1; ; n++) {
    const it = L.gens[pk.family]!(R, n, pk.subgoal);
    it.subgoal = pk.subgoal;
    if (!L.P.use || L.P.use(it) || n > 200) return { it, family: pk.family };
  }
}

// ---------- the board: the item's TeX, drawn the way the lessons draw it ----------
async function board(src: string): Promise<HTMLCanvasElement | null> {
  if (!src.trim()) return null;
  const el = h('canvas', { class: 'q-board', 'aria-label': src });
  try {
    const F = await texAsync(src);
    const size = 54, s = size / 1000, pad = 16;
    const w = Math.max(60, texWidth(F, size) + 2 * pad), hh = (F.bottom - F.top) * s + 2 * pad;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = canvasFor(el, ink, w, hh, Math.round(w * dpr));
    c.g.setTransform(el.width / w, 0, 0, el.width / w, 0, 0);
    texDraw(c, F, pad, pad, { size, valign: 'top', col: 'ink' });
    el.style.width = `${Math.round(w)}px`;
    return el;
  } catch { return null; }
}
function inputFor(it: Item, go: () => void): Input {
  if (it.input === 'frac') return fracInput(it.unit ?? '', go);
  if (it.input === 'num') return numInput(it.unit ?? '', go);
  if (it.input === 'pair') return pairInput(it.pairLead ?? '', it.pairOp ?? '÷', go, it.pairTail ?? '');
  return choiceInput(it.choices ?? []);
}

// ---------- flow ----------
function intro(): void {
  let grade: number | null = null;
  const gb = h('div', { class: 'grades', role: 'group', 'aria-label': 'Your grade' });
  const go = btn('Start', () => void run(grade), 'go');
  [6, 7, 8].forEach(g => gb.append(btn(`Grade ${g}`, () => { grade = g; gb.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === g - 6)); })));
  gb.append(btn('Not sure', () => { grade = null; gb.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === 3)); }));
  const old = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') as Saved | null; } catch { return null; } })();
  const lastLine = !old ? null : old.strands?.length
    ? `Last check-in (${old.at.slice(0, 10)}): ${old.strands.map(t => `${short(t.id)}: ${t.start ? `<a href="./${t.start}.html">${titleOf(t.start)}</a>` : 'all known'}`).join(' · ')}.`
    : old.start ? `Last check-in (${old.at.slice(0, 10)}): start at <a href="./${old.start}.html">${titleOf(old.start)}</a>.` : null;
  panel.replaceChildren(
    h('h2', {}, 'Where should you start?'),
    html('p', 'lead', `About 20 questions from the lessons of the path. Answer the ones you can; if you have not learned something yet, say so: that helps just as much. No calculator needed. It takes 10 to 15 minutes. At the end you get a start lesson for each part of the path: ${strands.map(t => t.title.toLowerCase()).join('; ')}.`),
    html('p', 'dim', 'What grade are you in?'), gb, h('div', { class: 'row' }, go),
    ...(lastLine ? [html('p', 'dim', lastLine)] : []),
  );
}
interface Saved { at: string; start: string | null; strands?: { id: string; start: string | null }[] }
const titleOf = (slug: string) => graph.units.find(u => u.id === slug)?.title ?? slug;
/** a strand's short name: its title up to the first comma or "and" */
const short = (id: string) => strands.find(t => t.id === id)?.title.split(/,| and /)[0] ?? id;

async function run(grade: number | null): Promise<void> {
  await texReady();
  const S = create(graph, { askable, strands, max: 20, min: 10, ...(grade ? { priors: gradePriors(graph, grade) } : {}) });
  for (let k = 1; ; k++) {
    const u = next(S);
    if (!u) break;
    const L = await lesson(u);
    const { it, family } = makeItem(u, L);
    const guess = it.input === 'choice' ? 1 / Math.max(2, it.choices?.length ?? 2) : 0.05;
    (window as unknown as { __placementLesson: number }).__placementLesson = graph.units.find(x => x.id === u)!.order;   // headless walks
    const a = await ask(it, L, k, S.max);
    const v = a === 'skip' ? { ok: false, mc: undefined } : it.check(a);
    record(S, { unit: u, right: v.ok, guess, family, ...(v.mc ? { mc: v.mc } : {}) });
  }
  await show(S);
}
function ask(it: Item, L: Lesson, k: number, max: number): Promise<Response | 'skip'> {
  return new Promise(resolve => {
    let done = false;
    const finish = (r: Response | 'skip') => { if (!done) { done = true; resolve(r); } };
    const fb = h('div');
    const input = inputFor(it, () => submit());
    function submit(): void {
      const r = input.read();
      if (!r) { fb.replaceChildren(html('div', 'fb', 'Fill in your answer first, or choose "Not learned yet".')); return; }
      finish(r);
    }
    const bar = h('div', { class: 'progress' }, h('i'));
    (bar.firstChild as HTMLElement).style.width = `${Math.round((100 * (k - 1)) / max)}%`;
    const fig = L.P.figure?.(it);
    const figEl = fig ? html('div', 'q-fig', fig) : null;
    const boardSlot = h('div');
    panel.replaceChildren(
      h('div', { class: 'label' }, `Question ${k}`), bar,
      html('p', '', it.prompt), boardSlot, ...(figEl ? [figEl] : []), input.node,
      h('div', { class: 'row' }, btn('Next', () => submit(), 'go'), btn('Not learned yet', () => finish('skip'), 'quiet')), fb,
    );
    Object.assign(window, { __placementItem: it, __placementQ: k });           // for headless click-throughs
    void board(it.board).then(cv => { if (cv) boardSlot.replaceChildren(cv); });
    setTimeout(() => input.focus(), 50);
  });
}
async function show(S: State): Promise<void> {
  const res = result(S);
  const names: Record<string, string> = (await import('./placement/mc-names.json')).default as Record<string, string>;
  const labels: Record<string, string> = {};
  for (const slug of new Set(res.errors.map(e => e.unit))) { const L = cache.get(slug); Object.assign(labels, L?.P.errorLabel ?? {}); }
  try { localStorage.setItem(KEY, JSON.stringify({ at: new Date().toISOString(), start: res.start, strands: res.strands.map(t => ({ id: t.id, start: t.start, skip: t.skip, gaps: t.gaps })), skip: res.skip, gaps: res.gaps, units: res.units.map(u => ({ slug: u.slug, p: u.p, status: u.status })) })); } catch { /* private mode */ }
  (window as unknown as { __placementResult: unknown }).__placementResult = res;
  const unit = new Map(res.units.map(u => [u.slug, u]));
  const link = (slug: string) => `<a href="./${slug}.html">${titleOf(slug)}</a>`;

  // per strand: where to start, and the strand's lessons as a strip: before the start known (bright when the check-in
  // is sure, paler when it only looks likely), the start, after it what can be skipped and what is still to learn
  const cards = res.strands.map(t => {
    const def = strands.find(x => x.id === t.id)!;
    const k = t.start ? def.slugs.indexOf(t.start) : def.slugs.length;
    const strip = h('ol', { class: 'strip', 'aria-label': t.start ? `${t.title}: start at lesson ${k + 1} of ${t.size}` : `${t.title}: all ${t.size} lessons known` },
      ...def.slugs.map((sl, i) => {
        const u = unit.get(sl)!, cls = i === k ? 'here' : u.status === 'mastered' ? 'got' : i < k ? 'likely' : 'todo';
        return h('li', { class: cls, title: `${titleOf(sl)}: ${cls === 'here' ? 'start here' : cls === 'got' ? 'known' : cls === 'likely' ? 'probably known' : 'to learn'}` });
      }));
    const card = h('article', { class: 'strand' }, h('h3', {}, t.title), strip,
      t.start ? html('p', 'go', `Start: ${link(t.start)}`) : html('p', 'go done', 'You know this whole strand.'));
    const notes = [t.start ? `Lesson ${k + 1} of ${t.size}` : `${t.size} lessons`, ...(t.skip.length ? [`after it you can skip ${t.skip.length} you already know`] : [])];
    card.append(html('p', 'dim', `${notes.join('; ')}.`));
    return card;
  });

  // the teacher's view: the whole path in topics.json order, each lesson's strand and how sure the check-in is
  const st = (s: string) => (s === 'mastered' ? 'can skip' : s === 'not yet' ? 'to learn' : 'not sure');
  const starts = new Set(res.strands.map(t => t.start).filter(Boolean));
  const list = h('ol', { class: 'res' }, ...res.units.map((u, i) => {
    const li = h('li', { class: `${u.status === 'not yet' ? 'notyet' : u.status}${starts.has(u.slug) ? ' here' : ''}` });
    li.append(h('span', { class: 'n' }, String(i + 1)), html('a', '', u.title), h('span', { class: 'sd' }, short(strandOf.get(u.slug)?.id ?? '')),
      h('span', { class: 'st' }, `${st(u.status)} · ${Math.round(u.p * 100)}%${u.asked ? ` · asked ${u.asked}` : ''}`));
    (li.children[1] as HTMLAnchorElement).href = `./${u.slug}.html`;
    return li;
  }));
  const right = S.log.filter(x => x.right).length;
  const mcs = [...new Set(res.errors.map(e => e.mc))];
  const teacher = h('details', { class: 'teacher' }, h('summary', {}, 'For your teacher: the whole path'),
    html('p', 'dim', `${res.asked} questions, ${right} right. Questions per strand: ${res.strands.map(t => `${short(t.id)} ${t.asked}`).join(', ')}. `
      + (res.start ? `Read as one line, the first lesson on the path not yet known is ${link(res.start)}${res.skip.length ? `; ${res.skip.length} later lesson${res.skip.length === 1 ? '' : 's'} look known` : ''}.` : 'Every lesson on the path looks known.')
      + ' The percentage is how likely the check-in thinks a lesson is already mastered; a lesson it did not ask gets its estimate from the lessons it builds on or leads to. Highlighted: the strand starts.'),
    ...(res.gaps.length ? [html('p', 'dim', `Not yet known although later lessons look fine: ${res.gaps.map(link).join(', ')}.`)] : []),
    list);
  panel.replaceChildren(
    h('h2', {}, 'Your start'),
    html('p', 'dim', `${res.asked} questions. Each part of the path has its own start; work on them in any order.`),
    h('div', { class: 'strands' }, ...cards),
    ...(mcs.length ? [html('p', 'dim', 'Slips we saw (the lessons work on these):'), h('ul', { class: 'mc' }, ...mcs.map(id => h('li', {}, labels[id] ?? names[id] ?? id)))] : []),
    teacher,
    h('div', { class: 'row' }, btn('Do it again', () => intro())),
  );
}

if (qs.has('grade')) void run(Number(qs.get('grade')) || null); else intro();
