// explain.ts: the worked steps of the "Step by step" card after a miss (docs/lessons/QUALITY_LAYER.md).
// Ruler lengths are written with ¼ ½ ¾ (3½ in); the answer reader wants 3 1/2, so the steps are read with those
// glyphs spelled out (the card itself keeps the glyphs).
import type { Explain } from '../../runtime/item';
import { resultOf } from '../../runtime/explain';

const GLYPH: Record<string, string> = { '¼': '1/4', '½': '1/2', '¾': '3/4' };
const spelled = (s: string) => s.replace(/(\d*)([¼½¾])/g, (_, w: string, g: string) => `${w || '0'} ${GLYPH[g]}`);

export const explain: Explain = it => {
  const steps = it.solution.slice();
  const result = resultOf(it, it.input === 'choice' ? steps : steps.map(spelled));
  return result ? { steps, result } : null;
};
