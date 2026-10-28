// tkit.ts: what every family of "Midsegments and points of concurrency" shares: the misconception ids, the picture
// type (the course's GFPicture plus a construction from the constructions lesson), the choice and number helpers
// (exactly one right choice; a wrong choice equal to the answer is dropped), relabelled point letters, and small
// figure helpers on top of triangle-congruence/tri.ts buildFig. Pure: no DOM.
import { type Base, type GFItem, type NumWrong, type Opt, choiceItem, numItem, pick, r, shuffle } from '../geometry-foundations/kit';
import { type Fig, type Frame, type MarkCol, type Pt, FR_LEFT, FR_RIGHT, FR_WIDE, figProblems } from '../geometry-foundations/geo';
import { ProofFrame } from '../geometry-foundations/ProofFrame';
import { dusk } from '../../dusk';
import { type FMark, type FigSpec, buildFig, mapFig, relabeler, tw as tw0 } from '../triangle-congruence/tri';
/** relabelling for prose: point letters change, the article "A" (a capital A before a lowercase noun) never does */
const ART = /(^|[.:;!?]\s+|[“\"(]\s*)A (?!(?:and|or|is|are|was|lies|to|on|in|of|the|has|with|from|lands|equals|sits)\b)(?=[a-z]{3,})/g;
export function tw(s: string, t: (s: string) => string): string {
  return tw0(s.replace(ART, '$1\u0001 '), t).replace(/\u0001/g, 'A');
}
import type { ConsPic } from '../constructions/ckit';
import { consProblems } from '../constructions/Construct';

export const MC = {
  midNoTwo: 'mc.shapes.midsegment-without-two-midpoints',
  medMidseg: 'mc.shapes.median-confused-with-midsegment',
  medAlt: 'mc.shapes.median-confused-with-altitude',
  extAlt: 'mc.area-perimeter.rejects-exterior-altitudes',
  vertical: 'mc.shapes.parallel-perpendicular-tied-to-horizontal-vertical',
  bisMid: 'mc.shapes.angle-bisector-hits-midpoint',
  altPerp: 'mc.shapes.altitude-confused-with-perpendicular-bisector',
  allCentroid: 'mc.shapes.all-special-lines-meet-at-centroid',
  thirdMiss: 'mc.shapes.third-median-may-miss',
  swap: 'mc.shapes.incenter-circumcenter-swap',
  inside: 'mc.shapes.centers-always-inside',
  slanted: 'mc.shapes.distance-along-slanted-segment',
  radiusWrong: 'mc.shapes.radius-to-wrong-point',
  parWrong: 'mc.shapes.midsegment-parallel-to-wrong-side',
  halvesTouched: 'mc.shapes.midsegment-halves-a-touched-side',
  halfMis: 'mc.shapes.midsegment-half-relation-misapplied',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  midEqPar: 'mc.shapes.midsegment-equals-parallel-side',
  medHalf: 'mc.shapes.median-half-the-side',
  bisRight: 'mc.angles.bisection-always-makes-right-angles',
  ratioWrong: 'mc.shapes.centroid-ratio-wrong',
  bisects: 'mc.shapes.centroid-bisects-median',
  threeOne: 'mc.shapes.centroid-long-segment-three-times-short',
  wholeNotHalf: 'mc.angles.uses-whole-not-half-after-bisecting',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  circToMid: 'mc.shapes.circumradius-to-side-midpoint',
  circFromBis: 'mc.shapes.circumcenter-from-bisectors-or-medians',
  trusts: 'mc.angles.trusts-diagram-appearance',
  circular: 'mc.geometric-proof.circular-reasoning',
  converse: 'mc.geometric-proof.converse-assumed-true',
  someConds: 'mc.geometric-proof.stops-after-some-conditions',
  twoMeet: 'mc.geometric-proof.two-meet-so-three-concurrent',
  ssa: 'mc.transformations.ssa-accepted-as-criterion',
  noHyp: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  oneBis: 'mc.shapes.equidistant-lines-on-one-bisector',
  noReason: 'mc.geometric-proof.step-without-reason',
  examples: 'mc.reasoning-language.examples-as-proof',
  oneMethod: 'mc.add-sub.believes-one-method-is-right',
  byAnswer: 'mc.reasoning-language.judges-work-by-final-answer',
  central: 'mc.shapes.visually-central-point-equidistant',
} as const;

// ---------- pictures and items ----------
export type TCPicture = GFItem['picture'] & { cons?: ConsPic };
export type TCItem = Omit<GFItem, 'picture'> & { picture?: TCPicture };
export type Gen = (R: () => number, n: number, sg?: string) => TCItem;
export type TBase = Omit<TCItem, 'input' | 'choices' | 'answer' | 'check'>;
/** the frame the page draws an item's figure or construction in */
export const picFrame = (p: TCPicture): Frame => (p.proof || p.card || p.cards ? FR_LEFT : FR_WIDE);
/** move point letters that touch a line, an arc or another label to a free direction (in the frame the page uses) */
export function repairLetters(f: Fig, fr: Frame): string[] {
  let probs = figProblems(f, fr);
  for (let pass = 0; pass < 2 && probs.length; pass++) {
    const bad = [...new Set(probs.flatMap(p => [...p.matchAll(/point (\S+)/g)].map(m => m[1]!)))];
    if (!bad.length) break;
    for (const name of bad) {
      const pt = f.points.find(p => p.name === name);
      if (!pt) continue;
      const o = { dir: pt.dir, dist: pt.dist };
      let found = false;
      search: for (const [dd, step, n] of [[48, 30, 12], [64, 30, 12], [56, 15, 24], [78, 15, 24]] as const) for (let k = 0; k < n; k++) {
        pt.dir = o.dir + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step; pt.dist = dd;
        const pr = figProblems(f, fr);
        if (!pr.some(x => x.includes('point ' + name))) { found = true; break search; }
      }
      if (!found) { pt.dir = o.dir; pt.dist = o.dist; }
      probs = figProblems(f, fr);
    }
  }
  // length labels: try the other side of their segment
  for (const x of [...new Set(probs.flatMap(p => [...p.matchAll(/length (.+?) (?:touches|overlaps|leaves)/g)].map(m => m[1]!)))]) {
    const sg = f.segs.find(s => s.text === x);
    if (!sg) continue;
    const before = probs.length;
    sg.side = (sg.side === -1 ? 1 : -1);
    const pr = figProblems(f, fr);
    if (pr.length < before) probs = pr; else sg.side = (sg.side === -1 ? 1 : -1);
  }
  return probs;
}
/** the proof frame builds where the page draws it, before and after the solve fills its cells */
function proofProblems(p: TCPicture): string[] {
  const pr = p.proof!, fill = new Map((p.reveal?.fill ?? []).map(x => [x.i, x]));
  const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
  const fr = p.fig || p.cons ? { x: FR_RIGHT.x, y: 60, w: FR_RIGHT.w, h: 960 } : { x: 260, y: 60, w: 1400, h: 960 };
  for (const rows of [pr.rows, solved]) {
    try { ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, fr, dusk); } catch (e) { return [`proof frame: ${(e as Error).message}`]; }
  }
  return [];
}
/** a maker retried until its picture lays out readably (figure, construction) in the frame the page uses */
export function fitted<T extends { picture?: TCPicture }>(fam: string, make: () => T, tries = 150): T {
  let last = '';
  for (let t = 0; t < tries; t++) {
    let it: T;
    try { it = make(); } catch (e) { last = (e as Error).message; continue; }
    const p = it.picture;
    if (!p) return it;
    const fr = picFrame(p), probs: string[] = [];
    if (p.cons) probs.push(...consProblems(p.cons.c, fr, p.cons.over));
    if (p.fig) probs.push(...repairLetters(p.fig, fr));
    if (p.proof && !probs.length) probs.push(...proofProblems(p));
    if (!probs.length) return it;
    last = probs.join('; ');
  }
  throw new Error(`${fam}: no readable picture (${last})`);
}
/** the course's choice item (drops a "So:" line the helper adds itself) */
export function choice(R: () => number, b: TBase, opts: Opt[], fixed = false): TCItem {
  return choiceItem(R, { ...(b as Base), solution: b.solution.filter(l => !/^So: /.test(l)) }, opts, fixed) as TCItem;
}
export function num(b: Omit<TCItem, 'input' | 'answer' | 'check'>, a: number, wrong: NumWrong[], right: string, general: string): TCItem {
  return numItem(b as Parameters<typeof numItem>[0], a, wrong.filter(w => Number.isFinite(w.v) && Math.abs(w.v - a) > 1e-9), right, general) as TCItem;
}

// ---------- letters ----------
/** a relabelling of role letters to random point letters (never I, L, O); `keep` roles stay */
export const relabel = (R: () => number, roles: string, keep = '') => relabeler(R, roles, keep);
type T = (s: string) => string;
const mapPic = (p: TCPicture | undefined, t: T): TCPicture | undefined => {
  if (!p) return p;
  const out: TCPicture = { ...p };
  if (p.fig) out.fig = mapFig(p.fig, t);
  if (p.proof) out.proof = { ...p.proof, given: p.proof.given?.map(t), prove: p.proof.prove ? t(p.proof.prove) : p.proof.prove, rows: p.proof.rows.map(x => ({ st: t(x.st), rs: tw(x.rs, t) })) };
  if (p.reveal?.fill) out.reveal = { ...p.reveal, fill: p.reveal.fill.map(f => ({ ...f, st: f.st ? t(f.st) : f.st, rs: f.rs ? tw(f.rs, t) : f.rs })) };
  if (p.card) out.card = { lines: p.card.lines.map(x => tw(x, t)) };
  return out;
};
/** a choice item written with role letters, shown with random letters (prose through tw, TeX through tw, the figure) */
export function choiceT(R: () => number, t: T, b: TBase, opts: Opt[], fixed = false): TCItem {
  return choice(R, { ...b, prompt: tw(b.prompt, t), board: tw(b.board, t), solution: b.solution.map(x => tw(x, t)), picture: mapPic(b.picture, t) }, opts.map(o => ({ ...o, t: tw(o.t, t), say: tw(o.say, t) })), fixed);
}
export function numT(t: T, b: Omit<TCItem, 'input' | 'answer' | 'check'>, a: number, wrong: NumWrong[], right: string, general: string): TCItem {
  return num({ ...b, prompt: tw(b.prompt, t), board: tw(b.board, t), solution: b.solution.map(x => tw(x, t)), picture: mapPic(b.picture, t) }, a, wrong.map(w => ({ ...w, say: tw(w.say, t) })), tw(right, t), tw(general, t));
}

// ---------- figures ----------
/** buildFig with the triangle's body washed */
export function fig(s: FigSpec & { body?: string }): Fig {
  return { ...buildFig({ ...s, fills: s.fills ?? (s.body ? [{ pts: s.body }] : undefined) }), maxS: 2.2 };
}
export const tick = (seg: string, n: number, col?: MarkCol): FMark => ({ seg, n, col });
export const arc = (ang: string, n: number, col?: MarkCol): FMark => ({ ang, n, col });
export const box = (ang: string, col?: MarkCol): FMark => ({ ang, box: true, col });
export const lbl = (seg: string, text: string, col?: MarkCol): FMark => ({ seg, text, col, lone: true });
export const albl = (ang: string, text: string, col?: MarkCol, r?: number): FMark => ({ ang, text, col, lone: true, r });
/** a line through p in direction u, from -a to +b along u (a GeoFig line with two heads) */
export const lineEnds = (p: Pt, u: Pt, a: number, b: number): [Pt, Pt] => [[p[0] - u[0] * a, p[1] - u[1] * a], [p[0] + u[0] * b, p[1] + u[1] * b]];

// ---------- text ----------
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
export const ov = (s: string) => `\\overline{${s}}`;
export const A = (s: string) => `<b class="a">${s}</b>`, Bq = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
/** a linear expression ax + b, written the textbook way */
export function lin(a: number, b: number, v = 'x'): string {
  const ax = a === 1 ? v : a === -1 ? `−${v}` : `${a}${v}`;
  return b === 0 ? ax : `${ax} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
}
export const linT = (a: number, b: number, v = 'x') => lin(a, b, v).replace(/−/g, '-');
export const round1 = (x: number) => Math.round(x * 10) / 10;
export { pick, r, shuffle };
export type { Opt, NumWrong };
