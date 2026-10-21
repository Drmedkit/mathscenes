// item.ts: what every exercise item of the lesson line shares (types, seeded rng, exact fraction values, HTML bits).
// Pure: no DOM, no canvas. Topic families live in src/lesson/topics/<slug>/items.ts and return these Items.

export type Response =
  | { kind: 'frac'; w: number; n: number; d: number }
  | { kind: 'pair'; x: number; y: number }
  | { kind: 'choice'; i: number }
  | { kind: 'num'; v: number };

/** mc = a misconception id from math-curriculum-essentials/misconceptions.json (logged for the AI helper) */
export interface Verdict { ok: boolean; mc?: string; say: string }

export interface Item {
  id: string;
  /** the family (one deep structure); interleaving and mastery count families */
  family: string;
  /** the sub-goal of the topic this item practises (topic JSON `subgoals[].id`) */
  subgoal?: string;
  /** the question, HTML; amounts wrapped in <b class="a">, sharers / groups in <b class="b"> */
  prompt: string;
  /** TeX shown big on the board */
  board: string;
  input: 'frac' | 'pair' | 'choice' | 'num';
  /** unit word after the answer box */
  unit?: string;
  choices?: string[];
  /** for 'pair': the HTML before the boxes and the operator between them */
  pairLead?: string; pairOp?: string;
  /** a picture the topic page knows how to draw (free-form per topic) */
  picture?: Record<string, unknown>;
  /** the worked solution shown after a miss, HTML lines */
  solution: string[];
  /** one right response (tests) */
  answer: Response;
  check(r: Response): Verdict;
}
/** a family generator; `subgoal` lets one family make the number ranges of a specific sub-goal */
export type Gen = (R: () => number, n: number, subgoal?: string) => Item;

// ---------- rng ----------
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const int = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
export const pick = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
export function shuffle<T>(R: () => number, xs: T[]): T[] { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; } return xs; }

// ---------- exact values ----------
export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** value of a fraction response as an exact pair [num, den] (den > 0), or null if not a number */
export function fracValue(r: { w: number; n: number; d: number }): [number, number] | null {
  if (!Number.isInteger(r.w) || !Number.isInteger(r.n) || !Number.isInteger(r.d) || r.d <= 0 || r.n < 0 || r.w < 0) return null;
  return [r.w * r.d + r.n, r.d];
}
export const same = (p: [number, number], a: number, b: number): boolean => p[0] * b === a * p[1];

// ---------- HTML helpers ----------
export const fr = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
export function mixed(a: number, b: number): string {
  const w = Math.floor(a / b), r = a % b;
  if (r === 0) return String(w);
  return `${w ? w + '&#8202;' : ''}${fr(r, b)}`;
}
export const A = (s: string | number) => `<b class="a">${s}</b>`;
export const B = (s: string | number) => `<b class="b">${s}</b>`;
export const S = (s: string) => `<b class="s">${s}</b>`;
/** plain text of an HTML prompt (for the diagnosis log) */
export const plain = (h: string) => h.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '').replace(/&#8202;/g, ' ');
