// proofPanel.ts: the panel half of the proof frame (the canvas half is ProofFrame.ts). A two-column proof the
// student builds by tapping, in two passes:
//   1 order (Parsons)  the lines of the proof and one or more decoys sit in a pool; tap them in an order that works.
//                      A line may come next when every line it uses is already placed (any valid order is fine);
//                      a decoy or a line that uses something not yet written is refused with its reason.
//   2 reasons          for each placed line (top to bottom), pick its reason from a menu; distractors carry their
//                      misconception id and their own explanation.
// The block knows nothing about the canvas: the page listens (onPlace / onReason / onWrong / onDone) and moves the
// picture. Every tap is reported for the diagnosis log. Could move to the kit with ProofFrame.
import { btn, h, html } from '../../runtime/panel';

export interface PLine { st: string; rs: string; /** rows (1-based, in the proof's own numbering) this line uses */ uses: number[]; /** other reasons that are also right */ also?: string[] }
export interface PDecoy { st: string; why: string; mc?: string }
export interface PReason { t: string; mc?: string; why?: string }
export interface ProofPanelOpts {
  lines: PLine[];
  decoys: PDecoy[];
  /** the reason menu (must contain every line's reason) */
  menu: PReason[];
  /** shuffle for the pool (seeded by the page) */
  order: number[];
  onPlace(line: number, pos: number): void;
  onReason(pos: number, line: number, reason: string): void;
  onWrong(e: { phase: 'order' | 'reason'; prompt: string; response: string; mc?: string; say: string }): void;
  onDone(): void;
  say?: { order: string; reasons: string };
}
export interface ProofPanel { node: HTMLElement; placed: () => number[] }

export function proofPanel(o: ProofPanelOpts): ProofPanel {
  const N = o.lines.length;
  const placed: number[] = [];   // proof row numbers (1-based) in the order placed
  let reasoned = 0;
  const chosen: string[] = [];
  let phase: 'order' | 'reason' | 'done' = 'order';
  const table = h('table', { class: 'proof' });
  const pool = h('div', { class: 'chips pool' });
  const head = h('div', { class: 'label' });
  const fb = h('div');
  const node = h('div', { class: 'proofpanel' }, head, table, pool, fb);
  // the pool: real lines (index 0..N-1) and decoys (N..), in the page's order
  const items = o.order.map(i => (i < N ? { kind: 'line' as const, i, st: o.lines[i]!.st } : { kind: 'decoy' as const, i, st: o.decoys[i - N]!.st }));
  const usedPool = new Set<number>();

  function draw(): void {
    head.textContent = phase === 'order' ? (o.say?.order ?? 'Tap the lines in an order that works. One is a decoy.') : phase === 'reason' ? (o.say?.reasons ?? 'Now pick the reason for each line.') : 'Proof complete.';
    table.replaceChildren(h('tr', {}, h('th', {}, '#'), h('th', {}, 'Statement'), h('th', {}, 'Reason')), ...Array.from({ length: N }, (_, k) => {
      const row = placed[k];
      const st = h('td', { class: 'st' }); st.innerHTML = row ? o.lines[row - 1]!.st : '<span class="empty"></span>';
      const rs = h('td', { class: 'rs' }); rs.innerHTML = row && k < reasoned ? `<i>${chosen[k]}</i>` : '<span class="empty"></span>';
      const cls = phase === 'order' ? (k < placed.length ? 'ok' : k === placed.length ? 'now' : '') : k < reasoned ? 'ok' : k === reasoned ? 'now' : 'ok-st';
      return h('tr', { class: cls }, h('td', { class: 'n' }, `${k + 1}`), st, rs);
    }));
    if (phase === 'order') {
      pool.replaceChildren(...items.map((it, j) => { const b = btn(it.st, () => tapLine(j)); if (usedPool.has(j)) b.classList.add('used'); return b; }));
    } else if (phase === 'reason') {
      pool.replaceChildren(...o.menu.map(m => btn(m.t, () => tapReason(m))));
    } else pool.replaceChildren();
  }
  function tapLine(j: number): void {
    if (phase !== 'order' || usedPool.has(j)) return;
    const it = items[j]!;
    const prompt = `Line ${placed.length + 1} of the proof`;
    if (it.kind === 'decoy') {
      const d = o.decoys[it.i - N]!;
      fb.replaceChildren(html('div', 'fb no', `That line is the decoy: ${d.why}`));
      o.onWrong({ phase: 'order', prompt, response: plainOf(it.st), mc: d.mc, say: d.why });
      return;
    }
    const row = it.i + 1, L = o.lines[it.i]!;
    const missing = L.uses.filter(u => !placed.includes(u));
    const lastTooEarly = row === N && placed.length < N - 1;
    if (missing.length || lastTooEarly) {
      const say = lastTooEarly ? 'That is the statement to prove: it comes last, once everything it needs is written.' : 'That line uses a statement you have not written yet. Write what it needs first.';
      fb.replaceChildren(html('div', 'fb no', say));
      o.onWrong({ phase: 'order', prompt, response: plainOf(L.st), mc: lastTooEarly ? 'mc.geometric-proof.circular-reasoning' : 'mc.geometric-proof.uses-fact-before-established', say });
      return;
    }
    usedPool.add(j); placed.push(row); fb.replaceChildren();
    o.onPlace(row, placed.length - 1);
    if (placed.length === N) { phase = 'reason'; }
    draw();
  }
  function tapReason(m: PReason): void {
    if (phase !== 'reason') return;
    const row = placed[reasoned]!, L = o.lines[row - 1]!;
    if (m.t !== L.rs && !(L.also ?? []).includes(m.t)) {
      const say = m.why ?? 'That reason does not give this line. What does the line use, and which accepted statement turns it into this?';
      fb.replaceChildren(html('div', 'fb no', say));
      o.onWrong({ phase: 'reason', prompt: `Reason for: ${plainOf(L.st)}`, response: m.t, mc: m.mc, say });
      return;
    }
    fb.replaceChildren();
    chosen.push(m.t);
    reasoned++;
    o.onReason(reasoned - 1, row, m.t);
    if (reasoned === N) { phase = 'done'; draw(); o.onDone(); return; }
    draw();
  }
  draw();
  return { node, placed: () => placed.slice() };
}
const plainOf = (s: string) => s.replace(/<[^>]+>/g, '');
