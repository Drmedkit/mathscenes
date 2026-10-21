// voice.ts: the narrator of the explain parts. One voice, no characters. Every voiced line has an id; its text lives
// in pages/lessons/<slug>/voice/lines.json ({id: {text}}) and tools/lesson-voice.py turns it into <id>.mp3.
// say(id) plays the line (stopping the previous one) and resolves when it ends; a missing file or the mute switch
// resolves at once, so the lesson never waits on audio. Audio can only start after the kid's first click (browsers).

export class Voice {
  private el: HTMLAudioElement | null = null;
  private done: (() => void) | null = null;
  muted: boolean;
  constructor(readonly base: string) {
    let m = false;
    try { m = localStorage.getItem('mathscenes.voice.muted') === '1'; } catch { /* default on */ }
    this.muted = m || new URLSearchParams(location.search).has('mute');
  }
  setMuted(m: boolean): void {
    this.muted = m;
    try { localStorage.setItem('mathscenes.voice.muted', m ? '1' : '0'); } catch { /* fine */ }
    if (m) this.stop();
  }
  stop(): void {
    if (this.el) { this.el.pause(); this.el = null; }
    const d = this.done; this.done = null; d?.();
  }
  say(id: string): Promise<void> {
    this.stop();
    if (this.muted) return Promise.resolve();
    return new Promise<void>(res => {
      const a = new Audio(`${this.base}/${id}.mp3`);
      this.el = a; this.done = res;
      const end = () => { if (this.el === a) { this.el = null; this.done = null; } res(); };
      a.addEventListener('ended', end); a.addEventListener('error', end);
      a.play().catch(end);
    });
  }
  /** a header toggle */
  button(): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'voice';
    const sync = () => { b.textContent = this.muted ? 'Voice off' : 'Voice on'; b.setAttribute('aria-pressed', String(!this.muted)); };
    b.addEventListener('click', () => { this.setMuted(!this.muted); sync(); });
    sync();
    return b;
  }
}
