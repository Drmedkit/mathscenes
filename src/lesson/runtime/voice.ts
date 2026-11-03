// voice.ts: the narrator of the explain parts. One voice, no characters. Every voiced line has an id; its text lives
// in pages/lessons/<slug>/voice/lines.json ({id: {text}}) and tools/lesson-voice.py turns it into <id>.mp3.
// say(id) QUEUES the line and resolves when it has been spoken (or dropped); a missing file or the mute switch
// resolves at once, so the lesson never waits on audio. Lines asked for together (a screen that shows three voiced
// paragraphs, "Yes, ..." followed by the next step) play one after another instead of cutting each other off.
// The kid moving on cuts the narrator: any pointer press or Enter stops the line and drops the queue, and so does
// changing part (shell.ts calls stop()). Audio can only start after the kid's first click (browsers).

export class Voice {
  private el: HTMLAudioElement | null = null;
  private done: (() => void) | null = null;
  private queue: { id: string; res: () => void }[] = [];
  muted: boolean;
  constructor(readonly base: string) {
    let m = false;
    try { m = localStorage.getItem('mathscenes.voice.muted') === '1'; } catch { /* default on */ }
    this.muted = m || new URLSearchParams(location.search).has('mute');
    // capture phase: the narrator stops before the click handler asks for the next lines, which then queue fresh
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', () => this.stop(), true);
      document.addEventListener('keydown', e => { if (e.key === 'Enter') this.stop(); }, true);
    }
  }
  setMuted(m: boolean): void {
    this.muted = m;
    try { localStorage.setItem('mathscenes.voice.muted', m ? '1' : '0'); } catch { /* fine */ }
    if (m) this.stop();
  }
  stop(): void {
    const waiting = this.queue; this.queue = [];
    if (this.el) { this.el.pause(); this.el = null; }
    const d = this.done; this.done = null; d?.();
    for (const q of waiting) q.res();
  }
  say(id: string): Promise<void> {
    if (this.muted) return Promise.resolve();
    return new Promise<void>(res => {
      this.queue.push({ id, res });
      if (!this.el) this.next();
    });
  }
  private next(): void {
    const q = this.queue.shift();
    if (!q) return;
    const a = new Audio(`${this.base}/${q.id}.mp3`);
    this.el = a; this.done = q.res;
    const end = () => {
      if (this.el !== a) return;   // stopped meanwhile: stop() already resolved it
      this.el = null; this.done = null; q.res();
      this.next();
    };
    a.addEventListener('ended', end); a.addEventListener('error', end);
    a.play().catch(end);
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
