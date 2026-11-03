// voice.ts: the narrator of the explain parts. One voice, no characters. Every voiced line has an id; its text lives
// in pages/lessons/<slug>/voice/lines.json ({id: {text}}) and tools/lesson-voice.py turns it into <id>.mp3.
// say(id) QUEUES the line and resolves when it has been spoken (or dropped); a missing file or the mute switch
// resolves at once, so the lesson never waits on audio. Lines asked for together (a screen that shows three voiced
// paragraphs, "Yes, ..." followed by the next step) play one after another instead of cutting each other off.
// The kid moving on cuts the narrator: any pointer press or Enter stops the line and drops the queue, and so does
// changing part (shell.ts calls stop()).
// Browsers refuse sound until the kid's first click or key, and a lesson starts talking as soon as it opens. A refused
// line is therefore KEPT (its promise resolves, so the lesson never waits): the voice button reads "Tap to hear the
// voice", and the first press anywhere plays the kept lines instead of stopping the narrator.
// ONE audio element plays every line (Safari on iPhone/iPad lets an element play again only once a tap has started it;
// a fresh element per line would stay silent after the first).

interface Line { id: string; res: () => void }

export class Voice {
  private a: HTMLAudioElement | null = null;
  private cur: Line | null = null;
  private queue: Line[] = [];
  private held: string[] = [];          // lines the browser refused before the first click
  private unblockedAt = -1e9;
  private sync: (() => void) | null = null;
  blocked = false;
  muted: boolean;
  constructor(readonly base: string) {
    let m = false;
    try { m = localStorage.getItem('mathscenes.voice.muted') === '1'; } catch { /* default on */ }
    this.muted = m || new URLSearchParams(location.search).has('mute');
    // capture phase: the narrator stops before the click handler asks for the next lines, which then queue fresh
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', () => this.press(), true);
      document.addEventListener('keydown', e => { if (e.key === 'Enter' || this.blocked) this.press(); }, true);
    }
  }
  private player(): HTMLAudioElement {
    if (this.a) return this.a;
    const a = new Audio();
    a.preload = 'auto';
    const end = () => { const c = this.cur; if (!c) return; this.cur = null; c.res(); this.next(); };
    a.addEventListener('ended', end);
    a.addEventListener('error', () => { if (a.getAttribute('src')) end(); });
    return (this.a = a);
  }
  /** the kid pressed something: the first press lets the held lines speak, every later one stops the narrator */
  private press(): void {
    if (!this.blocked) { this.stop(); return; }
    this.blocked = false; this.unblockedAt = performance.now(); this.sync?.();
    const ids = this.held; this.held = [];
    if (this.muted) return;
    for (const id of ids) this.queue.push({ id, res: () => undefined });
    if (!this.cur) this.next();   // still inside the press: this play() is what unlocks the element
  }
  setMuted(m: boolean): void {
    this.muted = m;
    try { localStorage.setItem('mathscenes.voice.muted', m ? '1' : '0'); } catch { /* fine */ }
    if (m) this.stop();
  }
  stop(): void {
    this.held = [];
    const waiting = this.queue; this.queue = [];
    const c = this.cur; this.cur = null;
    if (this.a && !this.a.paused) this.a.pause();
    c?.res();
    for (const q of waiting) q.res();
  }
  say(id: string): Promise<void> {
    if (this.muted) return Promise.resolve();
    return new Promise<void>(res => {
      if (this.blocked) { this.held.push(id); res(); return; }
      this.queue.push({ id, res });
      if (!this.cur) this.next();
    });
  }
  private next(): void {
    const q = this.queue.shift();
    if (!q) return;
    const a = this.player();
    this.cur = q;
    a.src = `${this.base}/${q.id}.mp3`;
    a.play().catch((e: unknown) => {
      if (this.cur !== q) return;   // stopped or moved on meanwhile
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        // no click yet: keep this line and every queued one for the first press, and let the lesson go on
        this.cur = null; q.res();
        this.held.push(q.id, ...this.queue.map(x => x.id));
        for (const x of this.queue) x.res();
        this.queue = []; this.blocked = true; this.sync?.();
        return;
      }
      if (e instanceof DOMException && e.name === 'AbortError') return;   // a new src replaced it: not an end
      this.cur = null; q.res(); this.next();
    });
  }
  /** a header toggle */
  button(): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = 'voice';
    const sync = () => {
      b.textContent = this.muted ? 'Voice off' : this.blocked ? 'Tap to hear the voice' : 'Voice on';
      b.setAttribute('aria-pressed', String(!this.muted));
      b.classList.toggle('blocked', this.blocked && !this.muted);
    };
    this.sync = sync;
    // the press that unblocked the sound must not also switch it off
    b.addEventListener('click', () => { if (performance.now() - this.unblockedAt < 800) return; this.setMuted(!this.muted); sync(); });
    sync();
    return b;
  }
}
