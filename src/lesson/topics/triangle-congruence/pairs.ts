// pairs.ts: the two-triangle items' shared machinery (pure): a marked pair for a criterion pattern (a congruent copy,
// turned or flipped; for AAA a scaled copy; for SSA the other triangle the same data allow), the criterion choice
// list (a second criterion that also works is never offered as wrong), and small text helpers.
import { type Opt, choiceItem, numItem } from '../geometry-foundations/kit';
import { type Pt, add, dist, mul, sub, unit } from '../geometry-foundations/geo';
import { type Crit, type PMark, type Part, type Tri, CRITS, CRIT_WORD, NAME_SETS, PERMS, names2, mapFig, tw, angle, beside, centroid, copyBeside, critOf, critsOf, moveT, pairFig, permName, randTri, side } from './tri';
import { MC, partsFor } from './triProofs';
import type { Fig } from '../geometry-foundations/geo';

export type Pattern = 'SSS' | 'SAS' | 'ASA' | 'AAS' | 'HL' | 'AAA' | 'SSA';
export const critOfPattern = (p: Pattern): Crit => (p === 'AAA' || p === 'SSA' ? 'none' : p);

/** the other triangle with the same SSA data: vertex k keeps its angle, side a = V_k V_b and the opposite side k */
export function ssaAlt(T: Tri, k: number): Tri | null {
  const a = (k + 1) % 3, b = (k + 2) % 3;
  const Vk = T[k]!, Vb = T[b]!, u = unit(sub(T[a]!, Vk)), w = sub(Vb, Vk);
  const t = dist(Vk, T[a]!), t2 = 2 * (u[0] * w[0] + u[1] * w[1]) - t;
  if (t2 <= 0 || Math.abs(t2 - t) < 0.28 * t) return null;
  const out = T.slice() as Tri; out[a] = add(Vk, mul(u, t2));
  for (let i = 0; i < 3; i++) if (angle(out, i) < 22) return null;
  return out;
}
export const scaleT = (T: Tri, s: number): Tri => { const c = centroid(T); return T.map(p => add(c, mul(sub(p, c), s))) as Tri; };

export interface PairItem { T1: Tri; T2: Tri; n1: string; n2: string; parts: Part[]; marks: PMark[]; fig: Fig; flip: boolean; congruentDrawn: boolean }
/** a marked pair for a pattern; layout row (alone on the stage) or col (beside a card or proof) */
export function makePair(R: () => number, pat: Pattern, layout: 'row' | 'col', o: { names?: [string, string]; scramble?: boolean; copy?: boolean } = {}): PairItem {
  for (let t = 0; t < 300; t++) {
    const [L1, L2] = o.names ?? names2(R);
    const perm = o.scramble === false ? PERMS[0]! : PERMS[Math.floor(R() * PERMS.length)]!;
    const n1 = L1, n2 = permName(L2, perm);
    const crit = critOfPattern(pat);
    const parts = pat === 'SSA' ? ssaParts(R) : pat === 'AAA' ? partsFor('none', () => 0.1) : partsFor(crit, R);
    const right = parts.find(p => p.right);
    const T1 = randTri(R, { base: 300, right: !!right, minA: pat === 'SSA' ? 30 : 38 });
    // a right triangle from randTri has its right angle at V0: renumber so it sits at the right part's index
    const T1r = right ? rot3(T1, right.i) : T1;
    let T2src: Tri = T1r, congruentDrawn = true;
    if (pat === 'AAA' && !o.copy && R() < 0.7) { T2src = scaleT(T1r, R() < 0.5 ? 0.66 : 1.4); congruentDrawn = false; }
    if (pat === 'SSA') {
      const k = parts.find(p => p.k === 'a')!.i;
      if (angle(T1r, k) >= 84) continue;
      const alt = ssaAlt(T1r, k);
      if (!alt) continue;
      if (!o.copy && R() < 0.7) { T2src = alt; congruentDrawn = false; }
    }
    const flip = R() < 0.5;
    const T2 = beside(T1r, moveT(T2src, { rot: Math.floor(R() * 360), flip, off: [0, 0] }), layout);
    let nS = 0, nA = 0;
    const marks: PMark[] = parts.map(p => (p.k === 's' ? { k: 's', i: p.i, n: ++nS } : p.right ? { k: 'a', i: p.i, box: true } : { k: 'a', i: p.i, n: ++nA }));
    try {
      const fig = pairFig(T1r, T2, n1, n2, marks);
      return { T1: T1r, T2, n1, n2, parts, marks, fig, flip, congruentDrawn };
    } catch { continue; }
  }
  throw new Error(`makePair ${pat}: no figure`);
}
/** vertices renumbered so that old vertex 0 becomes vertex i (a right angle moves to index i) */
export function rot3(T: Tri, i: number): Tri { const o = T.slice() as Tri; for (let j = 0; j < 3; j++) o[(j + i) % 3] = T[j]!; return o; }
function ssaParts(R: () => number): Part[] {
  const k = Math.floor(R() * 3), a = (k + 1) % 3;
  return [{ k: 'a', i: k }, { k: 's', i: k }, { k: 's', i: a }];
}
/** the pattern name of three parts (SSA and AAA included) */
export function patternOf(parts: readonly Part[]): Pattern {
  const c = critOf(parts);
  if (c !== 'none') return c;
  return parts.every(p => p.k === 'a') ? 'AAA' : 'SSA';
}

/** criterion choices for a set of known pairs: the right one, every criterion that does NOT also work, and
 *  "Not enough information"; wrong picks carry the slip they show */
export function critOpts(known: readonly Part[], answer: Crit, o: { flip?: boolean; pat?: Pattern; drop?: Crit[] } = {}): Opt[] {
  const valid = critsOf(known);
  if (answer === 'none' && valid.size) throw new Error('critOpts: a criterion works');
  if (answer !== 'none' && !valid.has(answer)) throw new Error(`critOpts: ${answer} does not work`);
  const out: Opt[] = [];
  for (const c of [...CRITS, 'none' as Crit]) {
    if (c !== answer && valid.has(c)) continue;
    if (c !== answer && (o.drop ?? []).includes(c)) continue;
    if (c === answer) { out.push({ t: CRIT_WORD[c], ok: true, say: c === 'none' ? whyNone(o.pat) : `Right: the three pairs are ${c}.` }); continue; }
    if (c === 'none') {
      const mc = answer === 'AAS' ? MC.misAAS : answer === 'HL' ? MC.validSSA : o.flip ? MC.flipped : undefined;
      const say = answer === 'AAS' ? 'Two angles and a side that is not between them still fix the triangle: the third angles match too, so it is ASA in disguise (AAS).' : answer === 'HL' ? 'With a right angle in both, a hypotenuse pair and a leg pair do fix the triangle: that is HL.' : `Three pairs in the ${answer} pattern fix the triangle, whichever way the copy faces.`;
      out.push({ t: CRIT_WORD.none, mc, say });
      continue;
    }
    const mc = answer === 'none' ? (o.pat === 'AAA' ? MC.aaa : MC.ssa) : (c === 'SAS' || c === 'ASA' || c === 'AAS') ? MC.order : c === 'HL' ? MC.hlMis : undefined;
    const say = answer === 'none' ? whyNone(o.pat, c) : c === 'HL' ? 'HL needs a right angle in both triangles and a hypotenuse pair.' : `Read where the marks sit: the pattern is ${CRIT_WORD[answer]}, not ${c}.`;
    out.push({ t: CRIT_WORD[c], mc, say });
  }
  return out;
}
function whyNone(p?: Pattern, c?: Crit): string {
  if (p === 'AAA') return c ? 'Three angle pairs fix the shape, not the size: a scaled copy has the same angles. Not enough information.' : 'Right: three angle pairs fix the shape, not the size. Not enough information.';
  return c ? 'The angle is not between the two marked sides (SSA): the same data can make two different triangles. Not enough information.' : 'Right: the angle is not between the two marked sides (SSA), and the same data can make two different triangles.';
}

/** the sides of a pattern, read around the triangle */
export function listOf(n1: string, n2: string, parts: readonly Part[], pairHtml: (a: string, b: string, p: Part) => string): string {
  return parts.map(p => pairHtml(n1, n2, p)).join(', ');
}
/** the course's choice item, with the item's own closing "So: ..." line left to endOnChoice (it names the right choice
 *  exactly, marked as the answer, so the steps card never says it twice) */
export function choice(R: () => number, b: Parameters<typeof choiceItem>[1], opts: Opt[], fixed = false) {
  return choiceItem(R, { ...b, solution: b.solution.filter(l => !/^So: /.test(l)) }, opts, fixed);
}
/** a choice item whose point letters are relabelled (prose through tw, the figure through mapFig) */
type Base = Parameters<typeof choiceItem>[1];
export function choiceT(R: () => number, t: (s: string) => string, b: Base, opts: Opt[]) {
  const pic = b.picture?.fig ? { ...b.picture, fig: mapFig(b.picture.fig, t) } : b.picture;
  return choice(R, { ...b, prompt: tw(b.prompt, t), board: tw(b.board, t), solution: b.solution.map(x => tw(x, t)), picture: pic }, opts.map(o => ({ ...o, t: tw(o.t, t), say: tw(o.say, t) })));
}
export function numT(t: (s: string) => string, b: Parameters<typeof numItem>[0], a: number, wrong: Parameters<typeof numItem>[2], right: string, general: string) {
  const pic = b.picture?.fig ? { ...b.picture, fig: mapFig(b.picture.fig, t) } : b.picture;
  return numItem({ ...b, prompt: tw(b.prompt, t), board: tw(b.board, t), solution: b.solution.map(x => tw(x, t)), picture: pic }, a, wrong.map(w => ({ ...w, say: tw(w.say, t) })), tw(right, t), tw(general, t));
}

export { side, angle, copyBeside, NAME_SETS, PERMS, permName, randTri };
export type { Pt };
