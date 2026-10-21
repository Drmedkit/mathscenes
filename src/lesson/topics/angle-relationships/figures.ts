// figures.ts: the fixed figures of parts 1-4 (pure data, checked by the tests).
//   QUESTION  two straight streets cross; one corner is 65°, the corner across is asked (letters hidden)
//   EXAMPLE   the same crossing as lines AC and BD: 65° given, the other three found; the two straight angles
//   TURN      lines PR and QS, 38° opening to the left (vertical angles that open sideways)
//   PROOF     lines AC and BD with angles 1, 2, 3 and the two straight angles; proofAt(t) swings line BD
import { type AMark, type Fan, type Pic, crossing } from './angleMaths';

const mk = (id: string, a: string, b: string, o: Partial<AMark> = {}): AMark => ({ id, a, b, ...o });

/** C at 15°, B at 130°, A at 195°, D at 310°: angle BOA = 65 (upper left), COB = 115 (top), DOC = 65 (right), AOD = 115 */
function exampleFan(): Fan {
  const f = crossing(['C', 'B', 'A', 'D'], 15, 115, 'O');
  f.lines = [['A', 'C'], ['B', 'D']];
  f.marks = [
    mk('sAC', 'C', 'A', { lvl: 1, col: 'first', text: '180°' }),
    mk('sBD', 'D', 'B', { lvl: 1, col: 'first', text: '180°' }),
    mk('g', 'B', 'A', { text: '65°', col: 'second', ticks: 1 }),
    mk('x', 'C', 'B', { text: 'x', alt: '115°', col: 'link', ticks: 2 }),
    mk('y', 'D', 'C', { text: '?', alt: '65°', col: 'link', ticks: 1 }),
    mk('z', 'A', 'D', { text: '?', alt: '115°', col: 'link', ticks: 2 }),
  ];
  return f;
}
export const EXAMPLE: Pic = { fans: [exampleFan()] };
/** part 1: the same crossing as two streets, no letters; the corner across from the 65° corner is asked */
export const QUESTION: Pic = (() => {
  const f = exampleFan();
  f.rays = f.rays.map(r => ({ ...r, noLetter: true }));
  f.showO = false;
  f.marks = [mk('g', 'B', 'A', { text: '65°', col: 'second' }), mk('y', 'D', 'C', { text: '?', col: 'link' })];
  return { fans: [f] };
})();

/** R at 19°, Q at 161°, P at 199°, S at 341°: angle QOP = 38 opens LEFT, ROQ = 142 (top), SOR = 38 opens RIGHT */
export const TURN: Pic = (() => {
  const f = crossing(['R', 'Q', 'P', 'S'], 19, 142, 'O');
  f.lines = [['P', 'R'], ['Q', 'S']];
  f.marks = [
    mk('sPR', 'R', 'P', { lvl: 1, col: 'first', text: '180°' }),
    mk('sQS', 'S', 'Q', { lvl: 1, col: 'first', text: '180°' }),
    mk('g', 'Q', 'P', { text: '38°', col: 'second' }),
    mk('x', 'R', 'Q', { text: 'x', alt: '142°', col: 'link' }),
    mk('y', 'S', 'R', { text: '?', alt: '38°', col: 'link' }),
    mk('z', 'P', 'S', { text: '?', alt: '142°', col: 'link' }),
  ];
  return { fans: [f] };
})();

/** the proof figure: angle 1 = BOA, angle 2 = COB, angle 3 = DOC; `t` = the size of angle 1 (drawing only) */
export function proofAt(t: number, measures = false): Pic {
  // C at 20°, A at 200°; B at 200 - t, D at 380 - t
  const f = crossing(['C', 'B', 'A', 'D'], 20, 180 - t, 'O');
  f.lines = [['A', 'C'], ['B', 'D']];
  const r = Math.round(t);
  f.marks = [
    mk('sAC', 'C', 'A', { lvl: 1, col: 'first' }),
    mk('sBD', 'D', 'B', { lvl: 1, col: 'first' }),
    mk('a1', 'B', 'A', { text: measures ? `${r}°` : '1', col: 'second', ticks: 1 }),
    mk('a2', 'C', 'B', { text: measures ? `${180 - r}°` : '2', col: 'plain' }),
    mk('a3', 'D', 'C', { text: measures ? `${r}°` : '3', col: 'link', ticks: 1 }),
  ];
  return { fans: [f] };
}
export const PROOF: Pic = proofAt(55);
