// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The solution lines mark what they reach in the answer colour, sometimes with its name or as a whole point
// (<b class="s">k = 2/3</b>, <b class="s">(3, 6)</b>). For the card the name moves out of the mark and a point is
// marked coordinate by coordinate, so the runtime can read the value the line SAYS (never item.answer). A typed
// answer whose lines mark nothing gets the value after the last "=" of its last line with one marked.
import type { Explain, Item } from '../../runtime/item';
import { ans, marked, stepsFrom } from '../../runtime/explain';

const NUM = String.raw`[−-]?\d+(?:\.\d+)?(?:\/\d+)?`;
const FR = String.raw`[−-]?<span class="fr"><span>\d+<\/span><span>\d+<\/span><\/span>`;
export const VAL = `(?:${FR}|${NUM})`;
const MARK = /<b class="s">((?:(?!<\/b>).)*)<\/b>/g;
/** "<b class="s">k = 2/3</b>" → "k = <b class="s">2/3</b>"; for a pair, "<b class="s">(3, 6)</b>" → "(<b>3</b>, <b>6</b>)" */
export function normalizeMarks(steps: readonly string[], input: Item['input']): string[] {
  const pt = new RegExp(String.raw`^\(\s*(${VAL}),\s*(${VAL})\s*\)$`);
  return steps.map(s => s.replace(MARK, (all, inner: string) => {
    const named = /^([^=<]{1,24}?=\s*)(.+)$/.exec(inner);
    const head = named ? named[1]! : '', body = named ? named[2]! : inner;
    const p = input === 'pair' ? pt.exec(body.trim()) : null;
    if (p) return `${head}(${ans(p[1]!)}, ${ans(p[2]!)})`;
    return named ? `${head}${ans(body)}` : all;
  }));
}
/** the steps with the value after the last "=" marked (a point "(a, b)" for a pair item); null when no line has one */
export function markTail(steps: readonly string[], input: Item['input']): string[] | null {
  const re = input === 'pair' ? new RegExp(String.raw`=\s*\(\s*(${VAL}),\s*(${VAL})\s*\)`, 'g') : new RegExp(String.raw`=\s*(${VAL})`, 'g');
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]!, m = [...s.matchAll(re)].at(-1);
    if (!m || m.index === undefined) continue;
    const rep = input === 'pair' ? `= (${ans(m[1]!)}, ${ans(m[2]!)})` : `= ${ans(m[1]!)}`;
    return steps.map((l, j) => (j === i ? s.slice(0, m.index) + rep + s.slice(m.index! + m[0].length) : l));
  }
  return null;
}
/** the lesson's own lines, ready for the card */
export function tailSteps(it: Item): string[] {
  if (it.input === 'choice') return it.solution.slice();
  const st = normalizeMarks(it.solution, it.input);
  return marked(st).length ? st : markTail(st, it.input) ?? st;
}
export const explain: Explain = it => stepsFrom(it, tailSteps(it));
/** the steps with the last point "(a, b)" of the last line that has one marked coordinate by coordinate; null if none */
export function markLastPoint(steps: readonly string[]): string[] | null {
  const re = new RegExp(String.raw`\(\s*(${VAL}),\s*(${VAL})\s*\)`, 'g');
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i]!, m = [...s.matchAll(re)].at(-1);
    if (!m || m.index === undefined) continue;
    return steps.map((l, j) => (j === i ? s.slice(0, m.index) + `(${ans(m[1]!)}, ${ans(m[2]!)})` + s.slice(m.index! + m[0].length) : l));
  }
  return null;
}
