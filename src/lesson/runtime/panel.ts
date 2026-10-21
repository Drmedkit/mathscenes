// panel.ts: the side panel's building blocks (plain DOM): elements, buttons, feedback, and the answer inputs every
// item type uses. Inputs return a Response (item.ts) or null when the kid has not filled them in.
import type { Response } from './item';

export type Kid = Node | string;
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: Kid[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const k of kids) e.append(k);
  return e;
}
export function html(tag: keyof HTMLElementTagNameMap, cls: string, s: string): HTMLElement { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = s; return e; }
export function btn(label: string, on: () => void, cls = ''): HTMLButtonElement { const b = h('button', cls ? { class: cls } : {}); b.innerHTML = label; b.addEventListener('click', on); return b; }
export function feedback(ok: boolean, say: string, extra: Kid[] = []): HTMLElement {
  const f = h('div', { class: 'fb ' + (ok ? 'ok' : 'no') });
  f.innerHTML = say;
  for (const e of extra) f.append(e);
  return f;
}
/** the worked solution after a miss */
export function solutionList(lines: readonly string[]): HTMLElement { const ol = h('ol', { class: 'solution' }); lines.forEach(s => ol.append(html('li', '', s))); return ol; }

export interface Input { node: HTMLElement; read(): Response | null; focus(): void }
const numBox = (cls: string, label: string, onEnter: () => void) => {
  // inputmode 'text': phone number pads hide the minus key, and grades 7-8 answers can be negative
  const i = h('input', { class: cls, inputmode: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': label });
  i.addEventListener('keydown', e => { if (e.key === 'Enter') onEnter(); });
  return i;
};
/** a typed number; the real minus sign (−) and a decimal comma count too */
export const num = (i: HTMLInputElement) => { const v = i.value.trim().replace(/[−–]/g, '-').replace(',', '.'); return v === '' ? NaN : Number(v); };

/** a fraction or mixed number: [whole] numerator / denominator */
export function fracInput(unit: string, onEnter: () => void, mixedBox = true): Input {
  const w = numBox('whole', 'whole number part (optional)', onEnter), n = numBox('', 'numerator', onEnter), d = numBox('', 'denominator', onEnter);
  const kids: Kid[] = [];
  if (mixedBox) kids.push(w);
  kids.push(h('span', { class: 'stack' }, n, h('hr'), d));
  if (unit) kids.push(h('span', { class: 'unit' }, unit));
  return {
    node: h('div', { class: 'ans' }, ...kids),
    read() {
      const W = mixedBox && w.value.trim() !== '' ? num(w) : 0, N = num(n), D = num(d);
      if (Number.isNaN(N) && !Number.isNaN(W) && W > 0 && d.value.trim() === '') return { kind: 'frac', w: W, n: 0, d: 1 };
      if (Number.isNaN(N) || Number.isNaN(D) || Number.isNaN(W)) return null;
      return { kind: 'frac', w: W, n: N, d: D };
    },
    focus() { n.focus(); },
  };
}
export function numInput(unit: string, onEnter: () => void): Input {
  const i = numBox('', 'answer', onEnter);
  return { node: h('div', { class: 'ans' }, i, h('span', { class: 'unit' }, unit)), read: () => (i.value.trim() === '' ? null : { kind: 'num', v: num(i) }), focus: () => i.focus() };
}
/** two number boxes: lead [x] op [y] tail (op and tail may hold HTML, e.g. "x +" and ")") */
export function pairInput(leadHtml: string, op: string, onEnter: () => void, tailHtml = ''): Input {
  const x = numBox('', 'first number', onEnter), y = numBox('', 'second number', onEnter);
  const lead = h('span', { class: 'op' }); lead.innerHTML = leadHtml;
  const mid = h('span', { class: 'op' }); mid.innerHTML = op;
  const tail = h('span', { class: 'op' }); tail.innerHTML = tailHtml;
  return {
    node: h('div', { class: 'ans' }, lead, x, mid, y, ...(tailHtml ? [tail] : [])),
    read: () => (x.value.trim() === '' || y.value.trim() === '' ? null : { kind: 'pair', x: num(x), y: num(y) }),
    focus: () => x.focus(),
  };
}
export function choiceInput(choices: readonly string[]): Input {
  let chosen: number | null = null;
  const box = h('div', { class: 'opts' });
  choices.forEach((t, i) => box.append(btn(t, () => { chosen = i; box.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); })));
  return { node: box, read: () => (chosen === null ? null : { kind: 'choice', i: chosen }), focus: () => (box.querySelector('button') as HTMLButtonElement | null)?.focus() };
}
