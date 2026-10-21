// store.ts: a lesson's progress and its DIAGNOSIS LOG, kept in the browser (localStorage, per topic).
// Every answer a kid gives (practice items, commit cards, reason chips, inputs in the explain parts) is one Attempt:
// what was asked, what the kid answered, the expected answer, right or wrong, and the misconception id the
// classifier recognised. The log is the input for a later AI helper ("you keep flipping the division: ...").
// window.mathscenesLessons.log(topic) / .export() give it as JSON; ?log on a lesson page shows it.

export interface Attempt {
  at: string;                    // ISO time
  topic: string;                 // lesson slug
  part: 'question' | 'example' | 'turn' | 'prove' | 'practice';
  subgoal?: string;              // topic JSON subgoal id
  family?: string;
  item?: string;                 // item id or a fixed step id ("turn.count")
  prompt: string;                // plain text of what was asked
  board?: string;                // TeX on the board
  response: unknown;             // what the kid entered / picked
  expected?: unknown;
  correct: boolean | null;       // null for an opinion (how sure)
  mc?: string;                   // misconception id (math-curriculum-essentials/misconceptions.json)
  ms?: number;                   // time from showing the question to the answer
  sure?: number;                 // 0 guessing, 1 pretty sure, 2 certain (commit questions)
}
export interface Progress { part: number; reached: number; commit: { pick: number | null; sure: number | null }; practice?: unknown }

const KEY = (t: string) => `mathscenes.lesson.${t}`;
const MAX = 3000;

function read<T>(k: string, fallback: T): T {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
}
function write(k: string, v: unknown): void { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: fine */ } }

export class LessonStore {
  private memLog: Attempt[];
  constructor(readonly topic: string) { this.memLog = read<Attempt[]>(KEY(topic) + '.log', []); }
  progress(): Progress { return read<Progress | null>(KEY(this.topic) + '.progress', null) ?? { part: 0, reached: 0, commit: { pick: null, sure: null } }; }
  saveProgress(p: Progress): void { write(KEY(this.topic) + '.progress', p); }
  log(a: Omit<Attempt, 'at' | 'topic'>): Attempt {
    const full: Attempt = { at: new Date().toISOString(), topic: this.topic, ...a };
    this.memLog.push(full);
    if (this.memLog.length > MAX) this.memLog.splice(0, this.memLog.length - MAX);
    write(KEY(this.topic) + '.log', this.memLog);
    return full;
  }
  attempts(): readonly Attempt[] { return this.memLog; }
  /** misconceptions seen, most frequent first (what an AI helper would start from) */
  summary(): { mc: string; n: number; last: string }[] {
    const m = new Map<string, { n: number; last: string }>();
    for (const a of this.memLog) if (a.mc) { const e = m.get(a.mc) ?? { n: 0, last: a.at }; e.n++; e.last = a.at; m.set(a.mc, e); }
    return [...m].map(([mc, e]) => ({ mc, ...e })).sort((x, y) => y.n - x.n);
  }
  clear(): void { this.memLog = []; write(KEY(this.topic) + '.log', []); write(KEY(this.topic) + '.progress', null); }
}

declare global { interface Window { mathscenesLessons?: { log(topic: string): Attempt[]; export(): Record<string, Attempt[]> } } }
if (typeof window !== 'undefined') {
  window.mathscenesLessons = {
    log: t => read<Attempt[]>(KEY(t) + '.log', []),
    export: () => {
      const out: Record<string, Attempt[]> = {};
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; const m = /^mathscenes\.lesson\.(.+)\.log$/.exec(k); if (m) out[m[1]!] = read<Attempt[]>(k, []); } } catch { /* none */ }
      return out;
    },
  };
}
