// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// The (m, b) families end on the equation they build ("C = 6g + 20.", "y = −0.75x + 0.75"): for the card a last
// line "So m = … and b = …" reads both numbers off that equation (what the line says, never item.answer). A point
// answer marked whole ("(1, 4)") is marked coordinate by coordinate; a typed number with no mark gets the value after
// the last "=" of its last line with one marked.
import type { Explain, Item } from '../../runtime/item';
import { plain } from '../../runtime/item';
import { marked, stepsFrom } from '../../runtime/explain';
import { markLastPoint, markTail, normalizeMarks } from '../dilations-and-similarity/explain';

const NUM = String.raw`\d+(?:\.\d+)?(?:\/\d+)?`;
const EQ = new RegExp(String.raw`\b[A-Za-z] = ([−-]?(?:${NUM})?)\s?([A-Za-z])\b(?:\s*([+−-])\s*(${NUM}))?(?![\w(])`, 'g');
/** m and b read off the last equation "Y = mX + b" in the steps */
function slopeIntercept(steps: readonly string[]): [string, string] | null {
  for (let i = steps.length - 1; i >= 0; i--) {
    const m = [...plain(steps[i]!).matchAll(EQ)].at(-1);
    if (!m) continue;
    const c = m[1]!.replace('-', '−'), mm = c === '' ? '1' : c === '−' ? '−1' : c;
    const bb = m[4] ? `${m[3] === '+' ? '' : '−'}${m[4]}` : '0';
    return [mm, bb];
  }
  return null;
}
function stepsOf(it: Item): string[] {
  if (it.input === 'choice') return it.solution.slice();
  const st = normalizeMarks(it.solution, it.input);
  if (it.input !== 'pair') return marked(st).length ? st : markTail(st, it.input) ?? st;
  if (marked(st).length >= 2) return st;
  // the boxes "y = [ ] x + [ ]": slope and intercept
  const op = plain(String((it as Item & { pairOp?: string }).pairOp ?? ''));
  if (/\+\s*$/.test(op)) {
    const mb = slopeIntercept(st);
    if (mb) return [...st, `So <i>m</i> = <b class="s">${mb[0]}</b> and <i>b</i> = <b class="s">${mb[1]}</b>.`];
  }
  return markLastPoint(st) ?? st;
}
export const explain: Explain = it => stepsFrom(it, stepsOf(it));
