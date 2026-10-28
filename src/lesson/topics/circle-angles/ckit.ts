// ckit.ts: what every family of "Arcs and angles in circles" shares: the misconception ids, the picture type (the
// circle figure of cfig.ts, the course's proof frame and card), ONE choice helper (exactly one right choice; a wrong
// choice with the same text or the same value as the right one is dropped, never shown; repeated wrong texts are
// dropped), the number helper (a wrong value equal to the answer is dropped), relabelled point letters (POINT NAMES
// only: quadrilaterals/qkit.ts twQ, with ⟦protected prose⟧ for sentences), and `fitted`, which retries a maker until
// its picture lays out readably in the frame the page uses. Pure: no DOM.
import type { Item, Response, Verdict } from '../../runtime/item';
import { pick, shuffle } from '../../runtime/item';
import { ans, endOnChoice } from '../../runtime/explain';
import { type Frame, type MarkCol, FR_LEFT, FR_WIDE } from '../geometry-foundations/geo';
import { ProofFrame } from '../geometry-foundations/ProofFrame';
import type { ProofPic } from '../geometry-foundations/kit';
import { dusk } from '../../dusk';
import { P0, P1, prose, relabel } from '../quadrilaterals/qkit';
import { type CFig, mapCF, repairCF } from './cfig';

export const MC = {
  simIncomplete: 'mc.transformations.circle-similarity-proof-incomplete',
  scaleRev: 'mc.transformations.scale-factor-direction-reversed',
  curvedNot: 'mc.transformations.curved-figures-not-similar',
  segLook: 'mc.circles.segment-name-by-look',
  diamNotChord: 'mc.circles.diameter-not-a-chord',
  insideRadius: 'mc.circles.any-inside-segment-is-radius',
  everyDiam: 'mc.circles.every-chord-is-diameter',
  trusts: 'mc.angles.trusts-diagram-appearance',
  tanRatio: 'mc.circles.tangent-line-vs-tangent-ratio',
  insideCentral: 'mc.circles.any-inside-angle-is-central',
  measLen: 'mc.circles.arc-measure-vs-arc-length',
  minorDefault: 'mc.circles.minor-arc-default',
  majorTwo: 'mc.circles.major-arc-two-letter-name',
  insideInscribed: 'mc.circles.any-inside-angle-is-inscribed',
  wrongArc: 'mc.circles.wrong-intercepted-arc',
  anyExterior: 'mc.circles.any-exterior-angle-is-circumscribed',
  remainder: 'mc.fractions-concept.remainder-written-as-r-or-decimal',
  dropsRem: 'mc.mul-div.drops-remainder',
  doubled: 'mc.circles.inscribed-angle-doubled',
  fullArc: 'mc.circles.full-arc-for-angle-on-circle',
  eitherSide: 'mc.circles.same-chord-angles-equal-either-side',
  rightWrongV: 'mc.circles.right-angle-at-wrong-vertex',
  appearance: 'mc.geometric-proof.diagram-appearance-as-given',
  cyclicEqual: 'mc.circles.cyclic-quad-opposite-angles-equal',
  noHyp: 'mc.geometric-proof.cites-theorem-without-checking-hypotheses',
  rightAtP: 'mc.circles.tangent-right-angle-at-exterior-point',
  perpAny: 'mc.circles.tangent-perpendicular-to-any-radius',
  inscribedOff: 'mc.circles.inscribed-rule-off-the-circle',
  notHalved: 'mc.circles.interior-arcs-sum-not-halved',
  firstArc: 'mc.circles.interior-angle-first-arc-only',
  wrongAngle: 'mc.angles.wrong-angle-in-figure',
  interiorRule: 'mc.circles.interior-rule-for-exterior-angle',
  nearFar: 'mc.circles.exterior-near-minus-far',
  onlyMarked: 'mc.geometric-proof.only-marked-parts-count',
  reportsX: 'mc.linear-equations.reports-x-not-asked-quantity',
  lastMethod: 'mc.reasoning-language.last-practiced-method-for-everything',
  failedDisproof: 'mc.geometric-proof.failed-argument-as-disproof',
  converse: 'mc.geometric-proof.converse-assumed-true',
  contraConv: 'mc.geometric-proof.contrapositive-as-converse',
  inverse: 'mc.geometric-proof.inverse-error',
  anyRight: 'mc.circles.any-right-angle-subtends-diameter',
  noReason: 'mc.geometric-proof.step-without-reason',
  caseSplit: 'mc.geometric-proof.case-split-incomplete',
  circular: 'mc.geometric-proof.circular-reasoning',
  majorSeparate: 'mc.circles.major-arc-case-separate-theorem',
  diffAdded: 'mc.circles.inscribed-angle-difference-added',
  examples: 'mc.reasoning-language.examples-as-proof',
  auxChord: 'mc.reasoning-language.auxiliary-chord-without-proof-connection',
  suppEqual: 'mc.angles.supplementary-pair-set-equal',
  congSupp: 'mc.angles.congruent-pair-treated-as-supplementary',
  compSupp: 'mc.angles.complementary-supplementary-swapped',
  beforeEst: 'mc.geometric-proof.uses-fact-before-established',
  chordArc: 'mc.circles.chord-called-arc',
  onCenter: 'mc.circles.on-circle-point-used-as-center',
} as const;

// ---------- pictures ----------
export interface CReveal {
  /** labels (angle / arc / seg ids) that crossfade to their alt; marks that glow; colour changes */
  solved?: string[]; glow?: string[]; col?: Record<string, MarkCol>;
  /** proof cells filled by the solve; rows ringed / struck */
  fill?: { i: number; st?: string; rs?: string }[]; rings?: number[]; strike?: number[];
  /** card lines added by the solve */
  lines?: string[];
}
export type CPicture = { cfig?: CFig; proof?: ProofPic; card?: { lines: string[] }; reveal?: CReveal };
export interface CItem extends Item { picture?: CPicture }
export type Gen = (R: () => number, n: number, sg?: string) => CItem;
export type Base = Omit<CItem, 'input' | 'choices' | 'answer' | 'check'>;

/** the frame the page draws the circle in: alone, or left of a proof frame or a card */
/** a proof item: a narrow figure on the left, a wide proof frame (its statements need the room) */
export const FR_PFIG: Frame = { x: 30, y: 90, w: 520, h: 900 };
export const FR_PROOF: Frame = { x: 570, y: 60, w: 1320, h: 960 };
export const picFrame = (p: CPicture): Frame => (p.proof ? FR_PFIG : p.card ? FR_LEFT : FR_WIDE);
export const PROOF_FR = (p: CPicture): Frame => (p.cfig ? FR_PROOF : { x: 260, y: 60, w: 1400, h: 960 });

function proofProblems(p: CPicture): string[] {
  const pr = p.proof!, fill = new Map((p.reveal?.fill ?? []).map(x => [x.i, x]));
  const solved = pr.rows.map((r, i) => ({ st: fill.get(i)?.st ?? r.st, rs: fill.get(i)?.rs ?? r.rs }));
  for (const rows of [pr.rows, solved]) {
    try { ProofFrame({ given: pr.given, prove: pr.prove, rows, pool: pr.pool, first: pr.first }, PROOF_FR(p), dusk); } catch (e) { return [`proof frame: ${(e as Error).message}`]; }
  }
  return [];
}
/** a maker retried until its picture lays out readably in the frame the page uses */
export function fitted<T extends { picture?: CPicture }>(fam: string, make: () => T, tries = 200): T {
  let last = '';
  for (let t = 0; t < tries; t++) {
    let it: T;
    try { it = make(); } catch (e) { last = (e as Error).message; continue; }
    const p = it.picture;
    if (!p) return it;
    const probs: string[] = [];
    if (p.cfig) probs.push(...repairCF(p.cfig, picFrame(p)));
    if (p.proof && !probs.length) probs.push(...proofProblems(p));
    if (!probs.length) return it;
    last = probs.join('; ');
  }
  throw new Error(`${fam}: no readable picture (${last})`);
}

// ---------- letters ----------
export type T = ((s: string) => string) & { roles?: string };
const ID: T = Object.assign((s: string) => s, { roles: '' });
const unq = (s: string) => s.split(P0).join('').split(P1).join('');
const RESERVED = /^(SSS|SAS|ASA|AAS|HL|AAA|SSA)$/;
/** relabel POINT NAMES only: outside ⟦protected prose⟧, a standalone token of 1-4 capitals made of the item's role
 *  letters (never part of a hyphenated word, never a criterion name). The article "A" opening a sentence before a
 *  lowercase word (other than is / and / lies ...) is masked first, as triangle-centers' tw does; a test probe checks
 *  that no article ever comes out as a point letter. */
const ART = /(^|[.:;!?]\s+|[“"(]\s*)A (?!(?:is|and|lies|lie|on|to|of|or|sits|has|with|from|equals|was|are|sees|stays|moves|becomes)\b)(?=[a-z]{2,})/g;
const MASK = '\u0001';
export function twC(s: string, t: T): string {
  return twC0(s.replace(ART, `$1${MASK} `), t).split(MASK).join('A');
}
function twC0(s: string, t: T): string {
  const roles = t.roles ?? '';
  return s.split(P0).map((chunk, i) => {
    const cut = i === 0 ? -1 : chunk.indexOf(P1);
    const keep = cut < 0 ? '' : chunk.slice(0, cut + 1), rest = cut < 0 ? chunk : chunk.slice(cut + 1);
    const done = rest.replace(/(?<![A-Za-z\-])[A-Z]{1,4}(?![A-Za-z\-])/g, m => (RESERVED.test(m) || ![...m].every(ch => roles.includes(ch)) ? m : t(m)));
    return (i === 0 ? '' : P0) + keep + done;
  }).join('');
}
/** text clean-up: an abbreviation's period never doubles ("9 in..") */
const tidy = (s: string) => s.replace(/\bin\.\./g, 'in.');
const tx = (s: string, t: T) => tidy(unq(t === ID ? s : twC(s, t)));
function mapPic(p: CPicture | undefined, t: T): CPicture | undefined {
  if (!p) return p;
  const out: CPicture = { ...p };
  if (p.cfig) out.cfig = t === ID ? p.cfig : mapCF(p.cfig, t);
  if (p.proof) out.proof = { ...p.proof, given: p.proof.given?.map(x => tx(x, t)), prove: p.proof.prove ? tx(p.proof.prove, t) : p.proof.prove, rows: p.proof.rows.map(x => ({ st: tx(x.st, t), rs: tx(x.rs, t) })) };
  if (p.reveal) out.reveal = { ...p.reveal, fill: p.reveal.fill?.map(f => ({ ...f, st: f.st ? tx(f.st, t) : f.st, rs: f.rs ? tx(f.rs, t) : f.rs })), lines: p.reveal.lines?.map(x => tx(x, t)), solved: p.reveal.solved?.map(x => (t === ID ? x : t(x))), glow: p.reveal.glow?.map(x => (t === ID ? x : t(x))), col: p.reveal.col ? Object.fromEntries(Object.entries(p.reveal.col).map(([k, v]) => [t === ID ? k : t(k), v])) : undefined };
  if (p.card) out.card = { lines: p.card.lines.map(x => tx(x, t)) };
  return out;
}
export { prose, relabel };

// ---------- choice and number items ----------
export interface Opt { t: string; ok?: boolean; mc?: string; say: string; /** the value the option stands for: a wrong option with the right one's value is dropped */ v?: number | string }
/** THE choice helper of this lesson: one right option; wrong options equal to it (text or value) are dropped, repeated
 *  wrong texts are dropped, then shuffled (or kept in order when `fixed`) */
export function choose(R: () => number, t: T | null, b: Base, opts: Opt[], fixed = false): CItem {
  const tt = t ?? ID;
  const all = opts.map(o => ({ ...o, t: tx(o.t, tt), say: tx(o.say, tt) }));
  const right = all.filter(o => o.ok);
  if (right.length !== 1) throw new Error(`${b.family}: exactly one right choice (${right.length})`);
  const rt = right[0]!;
  const norm = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const seen = new Set<string>([norm(rt.t)]);
  const kept = [rt];
  for (const o of all) {
    if (o.ok) continue;
    if (seen.has(norm(o.t))) continue;
    if (o.v !== undefined && rt.v !== undefined && (typeof o.v === 'number' && typeof rt.v === 'number' ? Math.abs(o.v - rt.v) < 1e-9 : o.v === rt.v)) continue;
    seen.add(norm(o.t)); kept.push(o);
  }
  if (kept.length < 2) throw new Error(`${b.family}: no wrong choice left`);
  const order = fixed ? all.filter(o => kept.includes(o)) : shuffle(R, kept.slice());
  const i = order.indexOf(rt);
  const solution = endOnChoice(b.solution.map(x => tx(x, tt)), rt.t);
  return {
    ...b, prompt: tx(b.prompt, tt), board: tx(b.board, tt), solution, picture: mapPic(b.picture, tt),
    input: 'choice', choices: order.map(o => o.t), answer: { kind: 'choice', i },
    check: (r: Response): Verdict => {
      if (r.kind !== 'choice' || !order[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = order[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
export interface NumWrong { v: number; mc?: string; say: string }
/** the number item: a wrong value equal to the answer is dropped; the solution ends on the marked answer */
export function numQ(t: T | null, b: Omit<CItem, 'input' | 'answer' | 'check'>, a: number, wrong: NumWrong[], right: string, general: string): CItem {
  const tt = t ?? ID;
  const ws = wrong.filter(w => Number.isFinite(w.v) && Math.abs(w.v - a) > 1e-9).map(w => ({ ...w, say: tx(w.say, tt) }));
  const sol = b.solution.map(x => tx(x, tt));
  return {
    ...b, prompt: tx(b.prompt, tt), board: tx(b.board, tt), picture: mapPic(b.picture, tt), input: 'num', answer: { kind: 'num', v: a },
    solution: sol.some(s => s.includes('class="s"')) ? sol : [...sol, `So the answer is ${ans(fmt(a))}.`],
    check: (r: Response): Verdict => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (Math.abs(r.v - a) < 1e-9) return { ok: true, say: tx(right, tt) };
      const w = ws.find(x => Math.abs(x.v - r.v) < 1e-9);
      return w ? { ok: false, mc: w.mc, say: w.say } : { ok: false, say: tx(general, tt) };
    },
  };
}

// ---------- text ----------
export const r = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
export { pick, shuffle, ans };
/** a measure for the panel: 42.5, 9 (never 9.0) */
export const fmt = (x: number): string => { const v = Math.round(x * 100) / 100; return (v < 0 ? '−' : '') + String(Math.abs(v)); };
export const dg = (x: number) => `${fmt(x)}°`;
export const S = (s: string | number) => `<b class="s">${s}</b>`;
export const Aa = (s: string | number) => `<b class="a">${s}</b>`;
export const Bb = (s: string | number) => `<b class="b">${s}</b>`;
export const ang = (s: string) => `∠${s}`;
export const mA = (s: string) => `m∠${s}`;
/** an arc in prose: "arc AB" */
export const arcN = (s: string) => `arc ${s}`;
export const mArc = (s: string) => `m(arc ${s})`;
export const segN = (s: string) => [...s].map(ch => ch + '̅').join('');
/** TeX */
export const arcT = (s: string) => `\\overparen{${s}}`;
export const angT = (s: string) => `m\\angle ${s}`;
/** a linear expression ax + b, the textbook way (real minus) and in TeX */
export function lin(a: number, b: number, v = 'x'): string {
  const ax = a === 1 ? v : `${a}${v}`;
  return b === 0 ? ax : `${ax} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
}
export const linT = (a: number, b: number, v = 'x') => lin(a, b, v).replace(/−/g, '-');
export const NAMES = ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia', 'Sam'];
