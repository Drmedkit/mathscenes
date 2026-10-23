// model.ts: the check-in's student model (pure, no DOM). The Kubo placement model
// (kubo-curriculum/interactive/_levelup/placement/model.js), for the lesson line.
//
// Each lesson has a belief "this student already masters it", kept as log-odds. An answer moves that belief by how
// telling the answer is (a right typed answer says more than a right pick out of three). It also moves the linked
// lessons, weighted by the graph (tools/quality/placement-graph.mjs): a right answer is evidence for what the lesson
// rests on, a wrong answer is evidence against what rests on it. The next question goes to the lesson whose answer is
// expected to remove the most uncertainty over all lessons. The result: the first lesson in the order that is not
// mastered (where to start), the lessons that can be skipped, and gaps.

export interface Unit { id: string; slug: string; title: string; grade: number; order: number }
export interface Edge { pre: string; post: string; w: number }
export interface Graph { units: Unit[]; edges: Edge[] }
export interface Answer { unit: string; right: boolean; guess?: number; mc?: string; family?: string }
export interface ModelOpts { prior?: number; priors?: Record<string, number>; guess?: Record<string, number>; max?: number; min?: number; spread?: number; askable?: string[] }
export interface State {
  graph: Graph; L: Record<string, number>; asked: Record<string, number>; guess: Record<string, number>;
  pres: Map<string, Edge[]>; posts: Map<string, Edge[]>; log: Answer[]; max: number; min: number; spread: number; askable: Set<string> | null;
}
export type Status = 'mastered' | 'not yet' | 'unsure';
export interface Result {
  asked: number;
  units: { id: string; slug: string; title: string; grade: number; p: number; status: Status; asked: number }[];
  /** the first lesson in the order that is not mastered (null: all mastered) */
  start: string | null;
  /** mastered lessons after the start (can be skipped) */
  skip: string[];
  /** not yet although a later lesson is mastered */
  gaps: string[];
  errors: { unit: string; mc: string }[];
}

export const SLIP = 0.1;            // a student who masters it still slips sometimes
const SPREAD = 0.6;                 // how much of an answer's weight reaches linked lessons (times the link weight)
const CAP = 6;                      // log-odds cap: never completely sure from indirect evidence
const MIN_W = 0.35;                 // weaker links are ignored
export const MASTERED = 0.8, NOT_YET = 0.3;
/** the start is the first lesson in the order that is more likely not known than known */
export const START_BELOW = 0.5;
const MAX_ASKS = 3;                 // per lesson
const lg = (p: number) => Math.log(p / (1 - p));
const pr = (l: number) => 1 / (1 + Math.exp(-l));
const H = (p: number) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)));
const clampL = (l: number) => Math.max(-CAP, Math.min(CAP, l));

export function create(graph: Graph, o: ModelOpts = {}): State {
  const ids = graph.units.map(u => u.id);
  const pres = new Map<string, Edge[]>(ids.map(i => [i, []])), posts = new Map<string, Edge[]>(ids.map(i => [i, []]));
  for (const e of graph.edges) if (e.w >= MIN_W && pres.has(e.post) && posts.has(e.pre)) { pres.get(e.post)!.push(e); posts.get(e.pre)!.push(e); }
  const prior = o.prior ?? 0.5;
  return {
    graph, pres, posts, log: [],
    L: Object.fromEntries(ids.map(i => [i, lg(o.priors?.[i] ?? prior)])),
    asked: Object.fromEntries(ids.map(i => [i, 0])),
    guess: Object.fromEntries(ids.map(i => [i, o.guess?.[i] ?? 0.05])),
    max: o.max ?? 22, min: o.min ?? 10, spread: o.spread ?? SPREAD,
    askable: o.askable ? new Set(o.askable) : null,
  };
}
/** a starting belief from the student's grade (6, 7 or 8): earlier-grade lessons probably known, later ones probably not */
export function gradePriors(graph: Graph, grade: number): Record<string, number> {
  return Object.fromEntries(graph.units.map(u => {
    const d = u.grade - grade;
    return [u.id, d < 0 ? 0.8 : d === 0 ? 0.4 : d === 1 ? 0.15 : 0.1];
  }));
}
function steps(guess: number) { return { right: Math.log((1 - SLIP) / guess), wrong: Math.log(SLIP / (1 - guess)) }; }
function applyTo(S: State, L: Record<string, number>, unit: string, right: boolean, guess: number): Record<string, number> {
  const st = steps(guess), d = right ? st.right : st.wrong;
  L[unit] = clampL(L[unit]! + d);
  const linked = right ? S.pres.get(unit)!.map(e => [e.pre, e.w] as const) : S.posts.get(unit)!.map(e => [e.post, e.w] as const);
  for (const [v, w] of linked) {
    // a right answer only pushes the lessons below up, a wrong one only pushes the lessons above down
    const nd = d * w * S.spread;
    L[v] = clampL(right ? Math.max(L[v]!, L[v]! + nd) : Math.min(L[v]!, L[v]! + nd));
  }
  return L;
}
export function record(S: State, a: Answer): void {
  applyTo(S, S.L, a.unit, a.right, a.guess ?? S.guess[a.unit]!);
  S.asked[a.unit]!++;
  S.log.push(a);
}
const totalH = (L: Record<string, number>) => Object.values(L).reduce((a, l) => a + H(pr(l)), 0);
export function pRight(S: State, unit: string, guess = S.guess[unit]!): number { const p = pr(S.L[unit]!); return p * (1 - SLIP) + (1 - p) * guess; }
/** the lesson whose answer is expected to remove the most uncertainty; null when done */
export function next(S: State): string | null {
  if (S.log.length >= S.max) return null;
  const h0 = totalH(S.L);
  let best: string | null = null, bestGain = 0;
  for (const u of Object.keys(S.L)) {
    if (S.asked[u]! >= MAX_ASKS || (S.askable && !S.askable.has(u))) continue;
    const g = S.guess[u]!, pc = pRight(S, u, g);
    const hr = totalH(applyTo(S, { ...S.L }, u, true, g)), hw = totalH(applyTo(S, { ...S.L }, u, false, g));
    const gain = h0 - (pc * hr + (1 - pc) * hw) - 0.05 * S.asked[u]!;     // a small cost for asking the same lesson again
    if (gain > bestGain) { bestGain = gain; best = u; }
  }
  if (S.log.length >= S.min && bestGain < 0.12) return null;             // little left to learn
  return best;
}
export const status = (p: number): Status => (p >= MASTERED ? 'mastered' : p <= NOT_YET ? 'not yet' : 'unsure');
export function result(S: State): Result {
  const units = [...S.graph.units].sort((a, b) => a.order - b.order).map(u => {
    const p = pr(S.L[u.id]!);
    return { id: u.id, slug: u.slug, title: u.title, grade: u.grade, p: Math.round(p * 100) / 100, status: status(p), asked: S.asked[u.id]! };
  });
  const si = units.findIndex(u => u.p < START_BELOW);
  const start = si < 0 ? null : units[si]!.slug;
  const skip = si < 0 ? [] : units.slice(si + 1).filter(u => u.status === 'mastered').map(u => u.slug);
  const gaps = units.filter((u, i) => i !== si && u.status === 'not yet' && units.slice(i + 1).some(v => v.status === 'mastered')).map(u => u.slug);
  const errors = S.log.filter(x => !x.right && x.mc).map(x => ({ unit: x.unit, mc: x.mc! }));
  return { asked: S.log.length, units, start, skip, gaps, errors };
}
