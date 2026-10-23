// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The lesson colours the two parts of a pair answer as it draws them (run/change in x in amber <b class="a">, rise/
// change in y in teal <b class="b">) and marks a finished point or equation in the answer colour (<b class="s">).
// For the card: a marked point "(3, 6)" is marked coordinate by coordinate; otherwise the last amber and the last teal
// value become the answer (<b class="a ans">, the colour stays), with a name ("m = 3") kept outside the mark, and a
// marked equation ("y = 3x + 4") keeps its colour without counting as the answer. What is read is what the line says.
import type { Explain, Item } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';
import { normalizeMarks } from '../dilations-and-similarity/explain';

export const TEXT_OK = [/ ?\b(?:an|say) undefined\b ?/, /^undefined$/];   // "an undefined slope": the lesson's own word

const COLOR = (c: string) => new RegExp(`<b class="${c}">((?:(?!<\/b>).)*)<\/b>`, 'g');
/** a pair answer read from the amber and teal values of the lines */
function pairSteps(steps: string[]): string[] {
  const st = normalizeMarks(steps, 'pair');
  if (marked(st).length >= 2) return st;
  const unS: string[] = st.map(s => s.replace(/<b class="s">/g, '<b class="s eq">'));   // an equation is not a value
  let out = unS;
  const last = (c: string): [number, number] | null => {
    for (let i = out.length - 1; i >= 0; i--) { const m = [...out[i]!.matchAll(COLOR(c))].at(-1); if (m && m.index !== undefined) return [i, m.index]; }
    return null;
  };
  for (const c of ['a', 'b']) {
    const at = last(c);
    if (!at) return st;
    const [i, k] = at, s = out[i]!, m = COLOR(c).exec(s.slice(k))!;
    const named = /^([^=<]{1,24}?=\s*)(.+)$/.exec(m[1]!);
    const head = named ? named[1]! : '', body = named ? named[2]! : m[1]!;
    const plus = body.startsWith('+') ? '+' : '';   // "+8": the sign stays outside, the value is marked
    const rep = `${head}${plus}<b class="${c} ans">${body.slice(plus.length)}</b>`;
    out = out.map((l, j) => (j === i ? l.slice(0, k) + rep + l.slice(k + m[0].length) : l));
  }
  return out;
}
const stepsOf = (it: Item): string[] => (it.input === 'pair' ? pairSteps(it.solution.slice()) : it.input === 'choice' ? it.solution.slice() : normalizeMarks(it.solution, it.input));
export const explain: Explain = it => stepsFrom(it, stepsOf(it));
