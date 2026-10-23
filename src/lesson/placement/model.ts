// model.ts: the check-in's student model (pure, no DOM). The Kubo placement model
// (kubo-curriculum/interactive/_levelup/placement/model.js), for the lesson line.
//
// Each lesson has a belief "this student already masters it", kept as log-odds. An answer moves that belief by how
// telling the answer is (a right typed answer says more than a right pick out of three). It also moves the linked
// lessons, weighted by the graph (tools/quality/placement-graph.mjs): a right answer is evidence for what the lesson
// rests on, a wrong answer is evidence against what rests on it. The order adds links of its own: within a strand an
// earlier lesson counts as a foundation of a later one, and so do the few lessons just before it on the path. The next question goes to the lesson whose answer is
// expected to remove the most uncertainty. With strands (pages/lessons/placement/strands.json) that uncertainty is
// WHERE each strand starts: the start of a strand is its first lesson that is not known, so the model scores a question
// by how much it narrows the spread of possible start lessons, summed over the strands (plus a little of the overall
// uncertainty, for the teacher's picture). That spreads the ~20 questions over the strands by themselves, where the
// boundary is unclear. The result: a start lesson per strand, and the overall picture (the first lesson on the whole
// path that is not mastered, the lessons that can be skipped, gaps).

export interface Unit { id: string; slug: string; title: string; grade: number; order: number }
export interface Edge { pre: string; post: string; w: number }
export interface Graph { units: Unit[]; edges: Edge[] }
/** a strand: its lessons (slugs) in topics.json order */
export interface StrandDef { id: string; title: string; slugs: string[] }
export interface Answer { unit: string; right: boolean; guess?: number; mc?: string; family?: string }
export interface ModelOpts { prior?: number; priors?: Record<string, number>; guess?: Record<string, number>; max?: number; min?: number; spread?: number; askable?: string[];
  /** the strands; without them the model scores questions on the overall uncertainty only (the old single-start model) */
  strands?: StrandDef[];
  /** how much the overall uncertainty counts next to the strand starts when picking a question (default TOTAL_W) */
  totalWeight?: number;
  /** a strand starts at its first lesson with p below this (default START_BELOW) */
  startBelow?: number;
  /** after `min` questions, stop when no question is expected to remove this much uncertainty (default STOP_GAIN) */
  stopGain?: number;
  /** a strand is an ordered list: lesson i of a strand also counts as resting on each earlier lesson j of it, with
   *  weight strandLink x STRAND_DECAY^(i-j-1) where the graph has no stronger edge (0: off; default STRAND_LINK) */
  strandLink?: number;
  /** the same along the whole path (any strand), weight pathLink x PATH_DECAY^(i-j-1) (0: off; default PATH_LINK) */
  pathLink?: number }
export interface State {
  graph: Graph; L: Record<string, number>; asked: Record<string, number>; guess: Record<string, number>;
  pres: Map<string, Edge[]>; posts: Map<string, Edge[]>; log: Answer[]; max: number; min: number; spread: number; askable: Set<string> | null;
  strands: { id: string; title: string; units: string[] }[]; totalWeight: number; startBelow: number; stopGain: number;
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
  /** per strand: where to start (null: the whole strand is known), how many of its lessons are mastered, gaps */
  strands: StrandResult[];
}
export interface StrandResult { id: string; title: string; start: string | null; done: boolean; size: number; mastered: number; asked: number; skip: string[]; gaps: string[] }

export const SLIP = 0.1;            // a student who masters it still slips sometimes
const SPREAD = 0.6;                 // how much of an answer's weight reaches linked lessons (times the link weight)
const CAP = 6;                      // log-odds cap: never completely sure from indirect evidence
const MIN_W = 0.35;                 // weaker links are ignored
export const MASTERED = 0.8, NOT_YET = 0.3;
/** a start (of a strand, or of the whole path) is the first lesson whose belief is below this. Below 0.5 because the
 *  grade prior is cautious: a same-grade lesson nobody asked starts at 0.4 (tuned with placement-sim.mjs) */
export const START_BELOW = 0.35;
const MAX_ASKS = 3;                 // per lesson
/** the weight of the overall uncertainty next to the strand starts in the question score */
export const TOTAL_W = 0.15;
/** the order as evidence (tuned with placement-sim.mjs): within a strand every earlier lesson counts as a foundation
 *  (0.8, fading 0.85 per lesson between them); along the whole path only the 4 lessons just before (0.4, fading .97) */
export const STRAND_LINK = 0.8, STRAND_DECAY = 0.85, PATH_LINK = 0.4, PATH_DECAY = 0.97;
export const STOP_GAIN = 0.12;            // after `min` questions: stop when no question is expected to tell this much
const lg = (p: number) => Math.log(p / (1 - p));
const pr = (l: number) => 1 / (1 + Math.exp(-l));
const H = (p: number) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)));
const clampL = (l: number) => Math.max(-CAP, Math.min(CAP, l));

export function create(graph: Graph, o: ModelOpts = {}): State {
  const ids = graph.units.map(u => u.id);
  const pres = new Map<string, Edge[]>(ids.map(i => [i, []])), posts = new Map<string, Edge[]>(ids.map(i => [i, []]));
  const best = new Map<string, Edge>();
  for (const e of graph.edges) best.set(`${e.pre}>${e.post}`, e);
  // the strand order as links (an earlier lesson of the strand is a foundation of a later one)
  const sl = o.strands ? (o.strandLink ?? STRAND_LINK) : 0, idOf = new Map(graph.units.map(u => [u.slug, u.id]));
  if (sl > 0) for (const t of o.strands!) {
    const sids = t.slugs.map(x => idOf.get(x)).filter((x): x is string => !!x);
    for (let i = 1; i < sids.length; i++) for (let j = 0; j < i; j++) {
      const w = sl * STRAND_DECAY ** (i - j - 1), k = `${sids[j]}>${sids[i]}`;
      if (w > (best.get(k)?.w ?? 0)) best.set(k, { pre: sids[j]!, post: sids[i]!, w });
    }
  }
  const pl = o.pathLink ?? PATH_LINK;
  if (pl > 0) {
    const ord = [...graph.units].sort((a, b) => a.order - b.order).map(u => u.id);
    for (let i = 1; i < ord.length; i++) for (let j = 0; j < i; j++) {
      const w = pl * PATH_DECAY ** (i - j - 1), k = `${ord[j]}>${ord[i]}`;
      if (w >= MIN_W && w > (best.get(k)?.w ?? 0)) best.set(k, { pre: ord[j]!, post: ord[i]!, w });
    }
  }
  for (const e of best.values()) if (e.w >= MIN_W && pres.has(e.post) && posts.has(e.pre)) { pres.get(e.post)!.push(e); posts.get(e.pre)!.push(e); }
  const prior = o.prior ?? 0.5;
  return {
    graph, pres, posts, log: [],
    L: Object.fromEntries(ids.map(i => [i, lg(o.priors?.[i] ?? prior)])),
    asked: Object.fromEntries(ids.map(i => [i, 0])),
    guess: Object.fromEntries(ids.map(i => [i, o.guess?.[i] ?? 0.05])),
    max: o.max ?? 22, min: o.min ?? 10, spread: o.spread ?? SPREAD,
    askable: o.askable ? new Set(o.askable) : null,
    strands: (o.strands ?? []).map(t => ({ id: t.id, title: t.title, units: t.slugs.map(sl => graph.units.find(u => u.slug === sl)?.id).filter((x): x is string => !!x) })),
    totalWeight: o.totalWeight ?? TOTAL_W, startBelow: o.startBelow ?? START_BELOW, stopGain: o.stopGain ?? STOP_GAIN,
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
/** the entropy (bits) of where a strand starts: start = k with probability p1..p(k-1) known and pk not (lessons taken
 *  as independent given the beliefs), or "all known" */
function startH(L: Record<string, number>, units: string[]): number {
  let reach = 1, h = 0;
  for (const u of units) {
    const p = pr(L[u]!), q = reach * (1 - p);
    if (q > 1e-12) h -= q * Math.log2(q);
    reach *= p;
    if (reach < 1e-9) return h;
  }
  return reach > 1e-12 ? h - reach * Math.log2(reach) : h;
}
/** what a question tries to shrink: the uncertainty of the strand starts (+ a little overall uncertainty) */
function uncertainty(S: State, L: Record<string, number>): number {
  if (!S.strands.length) return totalH(L);
  return S.strands.reduce((a, t) => a + startH(L, t.units), 0) + S.totalWeight * totalH(L);
}
export function pRight(S: State, unit: string, guess = S.guess[unit]!): number { const p = pr(S.L[unit]!); return p * (1 - SLIP) + (1 - p) * guess; }
/** the lesson whose answer is expected to remove the most uncertainty; null when done */
export function next(S: State): string | null {
  if (S.log.length >= S.max) return null;
  const h0 = uncertainty(S, S.L);
  let best: string | null = null, bestGain = 0;
  for (const u of Object.keys(S.L)) {
    if (S.asked[u]! >= MAX_ASKS || (S.askable && !S.askable.has(u))) continue;
    const g = S.guess[u]!, pc = pRight(S, u, g);
    const hr = uncertainty(S, applyTo(S, { ...S.L }, u, true, g)), hw = uncertainty(S, applyTo(S, { ...S.L }, u, false, g));
    const gain = h0 - (pc * hr + (1 - pc) * hw) - 0.05 * S.asked[u]!;     // a small cost for asking the same lesson again
    if (gain > bestGain) { bestGain = gain; best = u; }
  }
  if (S.log.length >= S.min && bestGain < S.stopGain) return null;        // little left to learn
  return best;
}
export const status = (p: number): Status => (p >= MASTERED ? 'mastered' : p <= NOT_YET ? 'not yet' : 'unsure');
export function result(S: State): Result {
  const units = [...S.graph.units].sort((a, b) => a.order - b.order).map(u => {
    const p = pr(S.L[u.id]!);
    return { id: u.id, slug: u.slug, title: u.title, grade: u.grade, p: Math.round(p * 100) / 100, status: status(p), asked: S.asked[u.id]! };
  });
  const si = units.findIndex(u => u.p < S.startBelow);
  const start = si < 0 ? null : units[si]!.slug;
  const skip = si < 0 ? [] : units.slice(si + 1).filter(u => u.status === 'mastered').map(u => u.slug);
  const gaps = units.filter((u, i) => i !== si && u.status === 'not yet' && units.slice(i + 1).some(v => v.status === 'mastered')).map(u => u.slug);
  const errors = S.log.filter(x => !x.right && x.mc).map(x => ({ unit: x.unit, mc: x.mc! }));
  const byId = new Map(units.map(u => [u.id, u]));
  const strands = S.strands.map(t => {
    const list = t.units.map(i => byId.get(i)!);
    const k = list.findIndex(u => u.p < S.startBelow), st = k < 0 ? null : list[k]!;
    return {
      id: t.id, title: t.title, start: st ? st.slug : null, done: !st, size: list.length,
      mastered: list.filter(u => u.status === 'mastered').length, asked: list.reduce((a, u) => a + u.asked, 0),
      skip: k < 0 ? [] : list.slice(k + 1).filter(u => u.status === 'mastered').map(u => u.slug),
      gaps: list.filter((u, i) => i !== k && u.status === 'not yet' && list.slice(i + 1).some(v => v.status === 'mastered')).map(u => u.slug),
    };
  });
  return { asked: S.log.length, units, start, skip, gaps, errors, strands };
}
