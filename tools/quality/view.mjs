// view.mjs: what the student SEES of a practice item, as plain data. This is the only thing an oracle gets
// (tests/oracle/<slug>.mjs solve(q) / sane(q)): never the item's answer, check(), worked solution, or the
// solution-side picture data. See docs/lessons/QUALITY_LAYER.md.

/** HTML of a prompt / choice → plain text: fractions as a/b, x<sup>2</sup> as x^2, entities decoded, one space */
export function plainText(h) {
  return String(h ?? '')
    .replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2')
    .replace(/<sup>([^<]*)<\/sup>/g, '^$1').replace(/<sub>([^<]*)<\/sub>/g, '_$1')
    .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')
    .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×').replace(/&divide;/g, '÷')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&le;/g, '≤').replace(/&ge;/g, '≥').replace(/&pi;/g, 'π').replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

/** fields of an Item that belong to the answer side; never shown to an oracle (at any depth of the picture data) */
export const HIDDEN = /^(answer|check|solution|solve\w*|\w*OnSolve|work|steps|hero|reveal|explain|ex)$/i;
const STD = new Set(['id', 'family', 'subgoal', 'prompt', 'board', 'input', 'unit', 'choices', 'pairLead', 'pairOp', 'pairTail']);

function scrub(v, depth = 0) {
  if (Array.isArray(v)) return v.map(x => scrub(x, depth + 1));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (!HIDDEN.test(k) && typeof x !== 'function') o[k] = scrub(x, depth + 1);
    return o;
  }
  return v;
}

/**
 * the student's view of an item:
 *   subgoal, family, prompt (plain), promptHtml, board (TeX), input ('num' | 'frac' | 'pair' | 'choice'), unit,
 *   pair { lead, op, tail } (plain), choices (plain), choicesHtml, data { picture / pict / pic / givens / ... }
 */
export function viewOf(it, subgoal) {
  const data = {};
  for (const [k, v] of Object.entries(it)) if (!STD.has(k) && !HIDDEN.test(k) && typeof v !== 'function') data[k] = scrub(v);
  return {
    subgoal: subgoal ?? it.subgoal, family: it.family, id: it.id,
    prompt: plainText(it.prompt), promptHtml: it.prompt, board: it.board ?? '', input: it.input, unit: plainText(it.unit ?? ''),
    ...(it.input === 'pair' ? { pair: { lead: plainText(it.pairLead ?? ''), op: plainText(it.pairOp ?? '÷'), tail: plainText(it.pairTail ?? '') } } : {}),
    ...(it.choices ? { choices: it.choices.map(plainText), choicesHtml: it.choices.slice() } : {}),
    data,
  };
}
