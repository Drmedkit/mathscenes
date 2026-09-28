// cues.ts: typed narration timing. A words.json (from the audio pipeline: lines -> words with start/end, plus named
// cues) becomes a Narration whose cue names are a TypeScript union, so `n.cue('tabel')` is a compile error:
//   import DATA from './data/words.json';
//   export type MyCue = keyof typeof DATA.cues;
//   export const N = new Narration<MyCue>(DATA as WordsFile<MyCue>);
// The words.json format is documented in docs/WORDS_FORMAT.md.

export interface Word { readonly w: string; readonly start: number; readonly end: number }
export interface Line {
  readonly i: number; readonly section: string; readonly speaker: string; readonly text: string;
  readonly start: number; readonly end: number; readonly words: readonly Word[];
}
export interface WordsFile<C extends string> { readonly lines: readonly Line[]; readonly cues: Readonly<Record<C, number>>; readonly duration: number }

const norm = (x: string) => x.replace(/[^\w']/g, '').toLowerCase();

export class Narration<C extends string> {
  constructor(readonly data: WordsFile<C>) {}
  /** time of a named cue */
  cue(name: C): number {
    const t = this.data.cues[name];
    if (typeof t !== 'number') throw new Error(`cue '${name}' not found`);
    return t;
  }
  /** start of the first word `w` (punctuation / case ignored) in `section` at or after time `after` */
  word(section: string, w: string, after = 0): number {
    for (const l of this.data.lines) {
      if (l.section !== section) continue;
      for (const x of l.words) if (x.start >= after - 1e-3 && norm(x.w) === norm(w)) return x.start;
    }
    throw new Error(`word '${w}' not found in section '${section}' after ${after}`);
  }
  /** end time of that word */
  wordEnd(section: string, w: string, after = 0): number {
    const s = this.word(section, w, after);
    for (const l of this.data.lines) for (const x of l.words) if (x.start === s) return x.end;
    return s;
  }
  /** the line spoken at time t (for captions / debugging) */
  lineAt(t: number): Line | undefined { return this.data.lines.find(l => t >= l.start && t <= l.end); }
  get duration(): number { return this.data.duration; }
}

