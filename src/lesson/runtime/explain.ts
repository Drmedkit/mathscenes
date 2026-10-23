// explain.ts: helpers for a topic's worked steps (src/lesson/topics/<slug>/explain.ts, docs/lessons/QUALITY_LAYER.md).
// The steps card shows `steps`; `result` is the answer the steps ARRIVE AT, read from the steps themselves (the value
// marked <b class="s">…</b>, or the choice the steps name), never copied from item.answer. The practice sweep then
// checks that answer against the independent oracle, so a worked solution that ends on the wrong number is caught.
// Pure: no DOM.
import { type Explained, type Item, type Response, plain } from './item';

/** every thousands comma in a number (7,400,000 → 7400000); a single pass with (\d),(\d{3}) only removes every other one */
const THOUSANDS = /(?<=\d),(?=\d{3}(?!\d))/g;

/** the value a marked answer starts with: −3, 2.5, 1,450, $4.50, 45%, 54°, 3/4, 2 1/2 (fractions in <span class="fr">),
 *  and any words after it ("3 weeks", "64π sq cm", "11/2π cm"); `frac` keeps a written fraction as [whole, n, d] */
export function leadValue(html: string): { v: number; frac?: [number, number, number] } | null {
  const t = plain(html).replace(/&#8202;/g, ' ').replace(/[−–]/g, '-').replace(THOUSANDS, '').trim();
  const m = t.match(/^(-?)\s*\$?\s*(\d+(?:\.\d+)?|\.\d+)(?:\s+(\d+)\/(\d+)|\/(\d+))?(?![\d.\/])/);
  if (!m) return /^-?π/.test(t) ? { v: t.startsWith('-') ? -1 : 1 } : null;   // "π cm": one π
  const sg = m[1] ? -1 : 1, a = Number(m[2]);
  if (m[3] !== undefined) { const n = Number(m[3]), d = Number(m[4]); return { v: sg * (a + n / d), frac: [a, n, d] }; }
  if (m[5] !== undefined) { const d = Number(m[5]); return { v: sg * a / d, frac: [0, a, d] }; }
  return { v: sg * a };
}
export const readNumber = (html: string): number | null => leadValue(html)?.v ?? null;
/** the values marked as the answer (<b class="s">…</b> or <b class="a ans">…</b>) in the steps, in order */
export function marked(steps: readonly string[]): string[] {
  // class "s" (the answer colour), or "ans" next to a colour class the lesson keeps (<b class="b ans">)
  return steps.flatMap(s => [...s.matchAll(/<b class="(?:s|(?:[\w-]+ )*ans(?: [\w-]+)*)">((?:(?!<\/b>).)*)<\/b>/g)].map(m => m[1]!));
}
/** the last number in a step's plain text (a trailing ✓ or full stop is fine) */
export function lastNumber(html: string): number | null {
  const t = plain(html).replace(/[−–]/g, '-').replace(THOUSANDS, '');
  const all = [...t.matchAll(/(-?)\$?(\d+(?:\.\d+)?)/g)];
  const m = all[all.length - 1];
  return m ? (m[1] ? -1 : 1) * Number(m[2]) : null;
}
const norm = (s: string) => plain(s).replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
/** the one choice the steps name (its full text appears in a step, or it is the marked value); -1 if none or several */
export function namedChoice(it: Item, steps: readonly string[]): number {
  const cs = (it.choices ?? []).map(norm);
  const mk = marked(steps).map(norm);
  const byMark = cs.map((c, i) => (mk.some(m => m === c) ? i : -1)).filter(i => i >= 0);
  if (byMark.length === 1) return byMark[0]!;
  const text = norm(steps.join(' \n '));
  const hits = cs.map((c, i) => (c && text.includes(c) ? i : -1)).filter(i => i >= 0);
  // a choice that is part of a longer named choice does not count twice
  const own = hits.filter(i => !hits.some(j => j !== i && cs[j]!.includes(cs[i]!)));
  return own.length === 1 ? own[0]! : -1;
}
/** the answer the steps arrive at, as a Response of the item's input kind; null when the steps do not say */
export function resultOf(it: Item, steps: readonly string[]): Response | null {
  const mk = marked(steps);
  switch (it.input) {
    case 'choice': { const i = namedChoice(it, steps); return i >= 0 ? { kind: 'choice', i } : null; }
    case 'num': {
      // the marked value, else the last number of the last step ("... = 54°.")
      const v = mk.length ? readNumber(mk[mk.length - 1]!) : lastNumber(steps[steps.length - 1] ?? '');
      return v === null ? null : { kind: 'num', v };
    }
    case 'pair': {
      if (mk.length < 2) return null;
      const x = readNumber(mk[mk.length - 2]!), y = readNumber(mk[mk.length - 1]!);
      return x === null || y === null ? null : { kind: 'pair', x, y };
    }
    case 'frac': {
      if (!mk.length) return null;
      const L = leadValue(mk[mk.length - 1]!);
      if (!L) return null;
      return L.frac && L.v >= 0 ? { kind: 'frac', w: L.frac[0], n: L.frac[1], d: L.frac[2] } : { kind: 'frac', w: L.v, n: 0, d: 1 };
    }
  }
}
/** steps (default: the item's own solution lines) plus the answer they arrive at; null when they do not arrive at one */
export function stepsFrom(it: Item, steps: readonly string[] = it.solution): Explained | null {
  const result = resultOf(it, steps);
  return result ? { steps: steps.slice(), result } : null;
}
/** mark a value as the answer in a step */
export const ans = (v: string | number) => `<b class="s">${v}</b>`;
/** a choice item's solution lines that end on the right choice: adds "So: <right choice>" when no step marks it yet */
export function endOnChoice(solution: readonly string[], right: string): string[] {
  return marked(solution).some(m => norm(m) === norm(right)) ? solution.slice() : [...solution, `So: ${ans(right)}`];
}
