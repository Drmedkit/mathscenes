// shell.ts: one lesson page = five parts behind a text rail (The question, Worked example, Your turn, Prove it,
// Practice), a voice switch, saved progress, and the diagnosis log (?log shows it; ?open unlocks every part;
// ?part=n jumps; ?mute starts silent). A topic gives its five part functions; the shell does the rest.
import { texReady, onTexLoad } from '../../core/tex';
import { LessonStore, type Progress } from './store';
import { Voice } from './voice';
import { h, btn } from './panel';
import { markDirty, newEpoch, startStage, tr } from './stage';

export const PART_NAMES = ['The question', 'Worked example', 'Your turn', 'Prove it', 'Practice'] as const;
export const PART_IDS = ['question', 'example', 'turn', 'prove', 'practice'] as const;
export const SURE = ['Guessing', 'Pretty sure', 'Certain'];

export interface LessonCtx {
  slug: string;
  panel: HTMLElement;
  store: LessonStore;
  voice: Voice;
  progress: Progress;
  go(i: number): void;
  /** say a voiced line and show nothing else (the panel text is the line's text) */
  say(id: string): Promise<void>;
  qs: URLSearchParams;
}
export interface LessonDef {
  slug: string;
  /** TeX the page needs before the first frame (font files load up front) */
  warm?: string[];
  parts: readonly [(x: LessonCtx) => void, (x: LessonCtx) => void, (x: LessonCtx) => void, (x: LessonCtx) => void, (x: LessonCtx) => void];
}

export async function runLesson(def: LessonDef): Promise<void> {
  const qs = new URLSearchParams(location.search);
  const cv = document.getElementById('cv') as HTMLCanvasElement;
  const panel = document.getElementById('panel')!;
  const rail = document.getElementById('rail')!;
  const tools = document.getElementById('tools');
  const store = new LessonStore(def.slug);
  const voice = new Voice(`./${def.slug}/voice`);
  followNew(panel);
  const progress = store.progress();
  if (qs.has('fresh')) { store.clear(); Object.assign(progress, { part: 0, reached: 0, commit: { pick: null, sure: null } }); }
  if (qs.has('open')) progress.reached = 4;
  if (tools) tools.replaceChildren(voice.button());

  await texReady(def.warm ?? []);
  onTexLoad(markDirty);
  const stage = startStage(cv);

  const ctx: LessonCtx = {
    slug: def.slug, panel, store, voice, progress, qs,
    go(i: number) {
      newEpoch(); voice.stop();
      progress.part = i; progress.reached = Math.max(progress.reached, i);
      store.saveProgress(progress);
      drawRail();
      def.parts[i]!(ctx);
      markDirty();
    },
    say: id => voice.say(id),
  };
  function drawRail(): void {
    rail.replaceChildren(...PART_NAMES.map((t, i) => {
      const b = h('button', { class: i === progress.part ? 'on' : i <= progress.reached ? 'done' : '' }, t);
      b.disabled = i > progress.reached;
      b.addEventListener('click', () => ctx.go(i));
      return b;
    }));
  }
  if (qs.has('log')) { showLog(panel, store); }
  const start = qs.has('part') ? Math.max(0, Math.min(4, Number(qs.get('part')))) : 0;
  if (!qs.has('log')) ctx.go(start);
  (window as unknown as { lessonReady: boolean }).lessonReady = true;
  (window as unknown as { __lesson: unknown }).__lesson = { tr, store, frames: stage.frames, ctx };
}

/** the diagnosis log, for the owner / a teacher / an AI helper (not part of the kid's flow) */
function showLog(panel: HTMLElement, store: LessonStore): void {
  const rows = store.attempts();
  const sum = store.summary();
  const pre = h('pre', { class: 'log' }, JSON.stringify(rows.slice(-40), null, 1));
  const copy = btn('Copy the whole log as JSON', () => { void navigator.clipboard?.writeText(JSON.stringify(rows)).catch(() => undefined); });
  panel.replaceChildren(h('h2', {}, 'Diagnosis log'),
    h('p', { class: 'dim' }, `${rows.length} answers saved in this browser. Misconceptions seen:`),
    h('ul', {}, ...sum.map(s => h('li', {}, `${s.mc} × ${s.n}`))),
    h('div', { class: 'row' }, copy, btn('Back to the lesson', () => { location.search = ''; })), pre);
}

/** Keep what the kid must see next in view. On a short screen (a 1366 × 768 laptop) feedback, the next input and the
 *  "Prove it" button land below the panel's fold and nothing says so. When the panel gains content, the lowest new
 *  element is scrolled into view (never past its own top); a whole new part starts at the top. TeX glyphs, SVG and
 *  updates that are already visible move nothing. */
function followNew(panel: HTMLElement): void {
  let pending: HTMLElement[] = [], top = false, raf = 0;
  const skip = (n: Node): boolean => !(n instanceof HTMLElement) || n.closest('mjx-container, svg') !== null || n.tagName.startsWith('MJX-');
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.target === panel && m.removedNodes.length && m.addedNodes.length) top = true;   // replaceChildren: a new part
      for (const n of m.addedNodes) if (!skip(n)) pending.push(n as HTMLElement);
    }
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const els = pending.filter(e => e.isConnected && e.offsetParent !== null); pending = [];
      if (top) { top = false; panel.scrollTop = 0; return; }
      if (!els.length) return;
      const shown = els.filter(e => e.getBoundingClientRect().height > 0);
      if (!shown.length) return;
      const bottom = (e: HTMLElement) => e.getBoundingClientRect().bottom, topOf = (e: HTMLElement) => e.getBoundingClientRect().top;
      const low = shown.reduce((a, b) => (bottom(b) > bottom(a) ? b : a)), high = shown.reduce((a, b) => (topOf(b) < topOf(a) ? b : a));
      const box = panel.getBoundingClientRect(), viewBottom = Math.min(box.bottom, innerHeight);
      if (bottom(low) <= viewBottom - 4) return;   // already in view
      // the panel and the page both scroll (the panel's own bottom can sit below a short screen): let the browser
      // scroll every container. Show the bottom of what is new, unless that pushes the top of what is new away.
      const room = viewBottom - Math.max(0, box.top);
      if (bottom(low) - topOf(high) < room - 24) low.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      else high.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }).observe(panel, { childList: true, subtree: true });
}
