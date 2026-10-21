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
