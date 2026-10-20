// items.ts: exercise families for "fractions as division", generated from templates, checked exactly, and every
// wrong answer classified against the misconception catalogue (math-curriculum-essentials/misconceptions.json ids).
//
// A FAMILY is one deep structure (e.g. "a sharing story -> a/b with its unit"); its items vary the numbers, the
// context, the order of the story and the wording. Families are what interleaving mixes and what mastery counts.
// Pure: no DOM, no canvas. A seeded rng makes any session reproducible (?seed=).
import { equalShareFits } from './shareLayout';

export type FamilyId = 'story' | 'toFrac' | 'toDiv' | 'between' | 'remainder' | 'checkBack' | 'slip';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'story', name: 'Sharing story' },
  { id: 'toFrac', name: 'Division to fraction' },
  { id: 'toDiv', name: 'Fraction to division' },
  { id: 'between', name: 'Between which wholes' },
  { id: 'remainder', name: 'Share the leftover' },
  { id: 'checkBack', name: 'Check it adds back' },
  { id: 'slip', name: 'Spot the slip' },
];

export type Response =
  | { kind: 'frac'; w: number; n: number; d: number }
  | { kind: 'pair'; x: number; y: number }
  | { kind: 'choice'; i: number }
  | { kind: 'num'; v: number };

export interface Verdict { ok: boolean; mc?: string; say: string }
export interface Model { a: number; b: number; words: [string, string]; one: [string, string]; look: Look }
export type Look = 'granola' | 'brownie' | 'ribbon';

export interface Item {
  id: string;
  family: FamilyId;
  /** the question, HTML; amounts wrapped in <b class="a">, sharers in <b class="b"> */
  prompt: string;
  /** TeX shown big on the board (the notation of the question) */
  board: string;
  input: 'frac' | 'pair' | 'choice' | 'num';
  /** unit word after the answer box ("of a bar", "ft") */
  unit?: string;
  choices?: string[];
  /** for 'pair': the TeX around the two boxes, e.g. ['\\frac{8}{3} =', '\\div', ''] */
  pairTex?: [string, string, string];
  /** the picture of the situation (when the model can draw it) */
  model?: Model;
  /** a measured amount drawn as a strip (rope, rice, trail mix) */
  strip?: { a: number; b: number; unit: string; sharers: string };
  /** the worked solution, shown after a miss: HTML lines */
  solution: string[];
  /** one right response (tests, and "show me" in a review build) */
  answer: Response;
  check(r: Response): Verdict;
}

// ---------- rng ----------
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const int = (R: () => number, lo: number, hi: number) => lo + Math.floor(R() * (hi - lo + 1));
const pick = <T>(R: () => number, xs: readonly T[]): T => xs[Math.floor(R() * xs.length)]!;
function shuffle<T>(R: () => number, xs: T[]): T[] { for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; } return xs; }

// ---------- exact values ----------
const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
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
const A = (s: string | number) => `<b class="a">${s}</b>`;
const B = (s: string | number) => `<b class="b">${s}</b>`;
const S = (s: string) => `<b class="s">${s}</b>`;

// ---------- contexts (no money; US units) ----------
interface Ctx { thing: string; things: string; sharer: string; sharers: string; look: Look; measure?: string }
const OBJECTS: Ctx[] = [
  { thing: 'granola bar', things: 'granola bars', sharer: 'friend', sharers: 'friends', look: 'granola' },
  { thing: 'pan of brownies', things: 'pans of brownies', sharer: 'table', sharers: 'tables', look: 'brownie' },
  { thing: 'granola bar', things: 'granola bars', sharer: 'hiker', sharers: 'hikers', look: 'granola' },
  { thing: 'pan of brownies', things: 'pans of brownies', sharer: 'team', sharers: 'teams', look: 'brownie' },
];
const MEASURES: { unit: string; what: string; sharer: string; sharers: string; verb: string; ask: string }[] = [
  { unit: 'ft', what: 'of ribbon', sharer: 'piece', sharers: 'equal pieces', verb: 'is cut into', ask: 'How long is each piece?' },
  { unit: 'lb', what: 'of rice', sharer: 'family', sharers: 'families', verb: 'is shared equally by', ask: 'How many pounds does each family get?' },
  { unit: 'cups', what: 'of trail mix', sharer: 'bag', sharers: 'bags', verb: 'is split equally into', ask: 'How many cups go in each bag?' },
  { unit: 'yd', what: 'of rope', sharer: 'piece', sharers: 'equal pieces', verb: 'is cut into', ask: 'How long is each piece?' },
];
const ONE: Record<string, string> = { ft: 'foot', lb: 'pound', cups: 'cup', yd: 'yard' };

// ---------- the shared classifier for "a ÷ b as a fraction / share" ----------
export function classifyShare(r: Response, a: number, b: number, what: string): Verdict {
  if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction or a mixed number.' };
  const v = fracValue(r);
  if (!v) return { ok: false, say: 'Fill in the boxes with whole numbers (the bottom box cannot be 0).' };
  if (same(v, a, b)) {
    const form = r.w === 0 && r.n > r.d && a % b !== 0 ? ` As a mixed number that is ${mixed(a, b)}.` : '';
    return { ok: true, say: `Yes: ${a} ÷ ${b} = ${fr(a, b)}${what ? ' ' + what : ''}.${form}` };
  }
  const q = Math.floor(a / b), rem = a % b;
  if (a !== b && same(v, b, a)) return {
    ok: false, mc: 'mc.fractions-concept.fraction-division-order-reversed',
    say: `That is ${b} ÷ ${a}, flipped. The amount being shared (${A(a)}) goes on top, the number of shares (${B(b)}) goes underneath: ${fr(a, b)}.`,
  };
  if (a > 1 && same(v, 1, b)) return {
    ok: false, mc: 'mc.fractions-concept.all-shown-taken-as-one-whole',
    say: `${fr(1, b)} is ONE piece. Each share gets one piece from each of the ${A(a)}, so ${a} pieces of ${fr(1, b)}: ${fr(a, b)}.`,
  };
  if (rem !== 0 && q > 0 && r.w === q && r.n === rem && r.d === a) return {
    ok: false, mc: 'mc.fractions-concept.remainder-misplaced-in-fraction-part',
    say: `The ${rem} left over are shared by ${B(b)}, so each gets ${fr(rem, b)} more, not ${fr(rem, a)}. Each gets ${mixed(a, b)}.`,
  };
  if (rem !== 0 && q > 0 && same(v, q, 1)) return {
    ok: false, mc: 'mc.fractions-concept.leftover-not-shared-as-fraction',
    say: `${q} is only the whole part. The ${rem} left over get cut and shared too: ${fr(rem, b)} more each, so ${mixed(a, b)}.`,
  };
  if (rem !== 0 && q > 0 && same(v, q + rem, 1)) return {
    ok: false, mc: 'mc.fractions-concept.allocates-entire-remainder-to-each-sharer',
    say: `Each share can't get all ${rem} left over: those ${rem} are split ${b} ways, ${fr(rem, b)} each. So ${mixed(a, b)}.`,
  };
  if (rem !== 0 && q > 0 && same(v, rem, b)) return {
    ok: false, mc: 'mc.fractions-concept.leftover-not-shared-as-fraction',
    say: `${fr(rem, b)} is just the cut-up leftover. Each share also gets ${q} whole: ${mixed(a, b)}.`,
  };
  if (same(v, a, a * b)) return {
    ok: false, mc: 'mc.fractions-concept.all-shown-taken-as-one-whole',
    say: `There are ${a * b} pieces in all, but the share is measured against ONE whole, not all of them: ${fr(a, b)}.`,
  };
  return { ok: false, say: `Not quite. Sharing ${A(a)} among ${B(b)} gives each ${a} ÷ ${b} = ${fr(a, b)}.` };
}
function shareSolution(a: number, b: number, unit: string): string[] {
  const lines = [`Cut every one of the ${A(a)} into ${B(b)} equal pieces: each piece is ${fr(1, b)}.`,
    `Each share takes one piece from each, so ${a} pieces of ${fr(1, b)}: ${a} × ${fr(1, b)} = ${fr(a, b)}.`,
    `So ${A(a)} ÷ ${B(b)} = ${S(fr(a, b))}${unit ? ' ' + unit : ''}${a % b && a > b ? ` = ${mixed(a, b)}` : ''}.`];
  return lines;
}

// ---------- families ----------
type Gen = (R: () => number, n: number) => Item;

const story: Gen = (R, n) => {
  const measure = R() < 0.4;
  let a: number, b: number;
  do { b = int(R, 2, measure ? 8 : 6); a = int(R, measure ? 2 : 1, measure ? 3 * b : 2 * b); } while (a === b || a % b === 0 || (!measure && !equalShareFits(a, b)));
  if (!measure) {
    const c = pick(R, OBJECTS), peopleFirst = R() < 0.45;
    const things = a === 1 ? c.thing : c.things;
    const prompt = peopleFirst
      ? `${B(`${b} ${c.sharers}`)} share ${A(`${a} ${things}`)} equally. How much of a ${c.thing} does each ${c.sharer} get?`
      : `${A(`${a} ${things}`)} ${a === 1 ? 'is' : 'are'} shared equally by ${B(`${b} ${c.sharers}`)}. How much of a ${c.thing} does each ${c.sharer} get?`;
    const unit = `of a ${c.thing}`;
    return {
      id: `story-${n}`, family: 'story', prompt, board: `${a} \\div ${b} = \\,?`, input: 'frac', unit,
      model: { a, b, words: [c.things, c.sharers], one: [c.thing, c.sharer], look: c.look },
      solution: shareSolution(a, b, unit), answer: { kind: 'frac', w: 0, n: a, d: b }, check: r => classifyShare(r, a, b, unit),
    };
  }
  const m = pick(R, MEASURES);
  const prompt = `${A(`${a} ${m.unit} ${m.what}`)} ${m.verb} ${B(`${b} ${m.sharers}`)}. ${m.ask}`;
  return {
    id: `story-${n}`, family: 'story', prompt, board: `${a}\\ \\text{${m.unit}} \\div ${b} = \\,?`, input: 'frac', unit: m.unit,
    strip: { a, b, unit: m.unit, sharers: m.sharers },
    solution: shareSolution(a, b, m.unit), answer: { kind: 'frac', w: 0, n: a, d: b }, check: r => classifyShare(r, a, b, m.unit),
  };
};

const toFrac: Gen = (R, n) => {
  const kind = pick(R, ['less', 'less', 'more', 'more', 'equal', 'one', 'zero'] as const);
  let a: number, b: number;
  if (kind === 'equal') { b = int(R, 2, 9); a = b; }
  else if (kind === 'one') { b = 1; a = int(R, 2, 15); }
  else if (kind === 'zero') { b = int(R, 2, 9); a = 0; }
  else do { b = int(R, 2, 10); a = int(R, 1, 30); } while (kind === 'less' ? a >= b : a <= b);
  return {
    id: `toFrac-${n}`, family: 'toFrac', prompt: 'Write the division as a fraction.', board: `${a} \\div ${b} = \\,?`, input: 'frac',
    solution: [`The fraction bar means "divided by", in the same order: the first number goes on top.`, `${a} ÷ ${b} = ${S(fr(a, b))}${a === b ? ' = 1' : b === 1 ? ` = ${a}` : a === 0 ? ' = 0' : ''}.`],
    answer: { kind: 'frac', w: 0, n: a, d: b },
    check: r => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Fill in whole numbers; the bottom cannot be 0.' };
      if (same(v, a, b)) return { ok: true, say: `Yes: ${a} ÷ ${b} = ${fr(a, b)}.` };
      if (a !== 0 && a !== b && same(v, b, a)) return { ok: false, mc: 'mc.fractions-concept.fraction-division-order-reversed', say: `Flipped: ${fr(b, a)} means ${b} ÷ ${a}. Keep the order: the number before ÷ goes on top, ${fr(a, b)}.` };
      return { ok: false, say: `The fraction bar is the ÷ sign: ${a} ÷ ${b} = ${fr(a, b)}.` };
    },
  };
};

const toDiv: Gen = (R, n) => {
  let a: number, b: number;
  do { b = int(R, 2, 9); a = int(R, 1, 30); } while (a === b);
  return {
    id: `toDiv-${n}`, family: 'toDiv', prompt: 'Which division does this fraction mean?', board: `\\frac{${a}}{${b}} = \\,?\\, \\div \\,?`, input: 'pair',
    pairTex: [`\\frac{${a}}{${b}} =`, '\\div', ''],
    solution: [`The top number is shared, the bottom number is how many shares: ${fr(a, b)} = ${S(`${a} ÷ ${b}`)}.`],
    answer: { kind: 'pair', x: a, y: b },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (r.x === a && r.y === b) return { ok: true, say: `Yes: ${fr(a, b)} = ${a} ÷ ${b}.` };
      if (r.x === b && r.y === a) return { ok: false, mc: 'mc.fractions-concept.fraction-division-order-reversed', say: `${b} ÷ ${a} would be ${fr(b, a)}. The top number comes first: ${a} ÷ ${b}.` };
      if (r.y > 0 && r.x * b === a * r.y) return { ok: true, say: `True, that has the same value. The direct reading is ${a} ÷ ${b}.` };
      return { ok: false, say: `Read the bar as ÷, top first: ${fr(a, b)} = ${a} ÷ ${b}.` };
    },
  };
};

const between: Gen = (R, n) => {
  const exact = R() < 0.3;
  const b = int(R, 2, 9), q = int(R, exact ? 1 : 0, 9), a = exact ? b * q : b * q + int(R, 1, b - 1);
  const opts: { t: string; ok: boolean; mc?: string; say: string }[] = [];
  const right = exact ? `exactly ${q}` : `between ${q} and ${q + 1}`;
  const why = exact ? `${b} × ${q} = ${a}, so ${fr(a, b)} is exactly ${q}.` : `${b} × ${q} = ${b * q} and ${b} × ${q + 1} = ${b * (q + 1)}; ${a} is in between, so ${fr(a, b)} is between ${q} and ${q + 1}.`;
  opts.push({ t: right, ok: true, say: `Yes. ${why}` });
  if (exact) opts.push({ t: `between ${q} and ${q + 1}`, ok: false, mc: 'mc.fractions-concept.exact-quotient-given-strict-bounds', say: `${b} × ${q} = ${a} exactly, nothing is left over, so the share IS ${q}.` });
  else opts.push({ t: `exactly ${q}`, ok: false, mc: 'mc.estimation.accepts-result-without-size-check', say: `${b} × ${q} = ${b * q}, not ${a}: there is a leftover, so it is more than ${q}. ${why}` });
  if (q >= 1) opts.push({ t: `between ${q - 1} and ${q}`, ok: false, say: `Check: ${b} × ${q} = ${b * q}, and ${a} is not less than that. ${why}` });
  opts.push({ t: `between ${q + 1} and ${q + 2}`, ok: false, say: `Check: ${b} × ${q + 1} = ${b * (q + 1)}, more than ${a}. ${why}` });
  if (a > 10 && a <= 40) opts.push({ t: `between ${a - 1} and ${a}`, ok: false, mc: 'mc.estimation.fraction-size-from-numerator', say: `That uses only the top number. ${fr(a, b)} is ${a} shared by ${b}: ${why}` });
  const chosen = [opts[0]!, ...shuffle(R, opts.slice(1)).slice(0, 3)];
  const order = shuffle(R, chosen.map((_, i) => i));
  const C = order.map(i => chosen[i]!);
  return {
    id: `between-${n}`, family: 'between', prompt: `Between which whole numbers is this share?`, board: `\\frac{${a}}{${b}}`, input: 'choice',
    choices: C.map(c => c.t), solution: [why], answer: { kind: 'choice', i: C.findIndex(c => c.ok) },
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const c = C[r.i];
      return c ? { ok: c.ok, mc: c.mc, say: c.say } : { ok: false, say: 'Pick one.' };
    },
  };
};

const remainder: Gen = (R, n) => {
  const b = int(R, 2, 9), q = int(R, 1, 9), rem = int(R, 1, b - 1), a = b * q + rem;
  const m = pick(R, MEASURES.filter(x => x.unit !== 'cups'));
  const prompt = `${A(`${a} ${m.unit} ${m.what}`)} ${m.verb} ${B(`${b} ${m.sharers}`)}. ${m.ask}`;
  return {
    id: `remainder-${n}`, strip: { a, b, unit: m.unit, sharers: m.sharers }, family: 'remainder', prompt, board: `${a} = ${b} \\times ${q} + ${rem}`, input: 'frac', unit: m.unit,
    solution: [`${a} = ${b} × ${q} + ${rem}: first ${q} whole ${m.unit} for each ${m.sharer}.`,
      `The ${rem} left over are each cut into ${b} parts and shared: ${fr(rem, b)} ${ONE[m.unit] ?? m.unit} more each.`,
      `Each gets ${S(mixed(a, b))} ${m.unit} (that is ${fr(a, b)}).`],
    answer: { kind: 'frac', w: Math.floor(a / b), n: a % b, d: b },
    check: r => classifyShare(r, a, b, m.unit),
  };
};

const checkBack: Gen = (R, n) => {
  const c = pick(R, OBJECTS);
  let a: number, b: number;
  do { b = int(R, 2, 8); a = int(R, 1, 3 * b); } while (a % b === 0);
  return {
    id: `checkBack-${n}`, family: 'checkBack',
    prompt: `${B(`${b} ${c.sharers}`)} each got ${fr(a, b)} of a ${c.thing}. Nothing was left over. How many ${c.things} were shared?`,
    board: `${b} \\times \\frac{${a}}{${b}} = \\,?`, input: 'num', unit: c.things,
    solution: [`Each share is ${a} pieces of ${fr(1, b)}. ${b} shares make ${a * b} pieces of ${fr(1, b)}.`,
      `Every ${b} pieces of ${fr(1, b)} make one whole ${c.thing}: ${a * b} ÷ ${b} = ${S(String(a))}. The shares add back to the whole amount.`],
    answer: { kind: 'num', v: a },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a whole number.' };
      if (r.v === a) return { ok: true, say: `Yes: ${b} × ${fr(a, b)} = ${fr(a * b, b)} = ${a}. Nothing lost, nothing extra.` };
      if (r.v === a * b) return { ok: false, mc: 'mc.fractions-concept.numerator-counted-as-whole-units', say: `${a * b} is the number of PIECES. Each piece is ${fr(1, b)} of a ${c.thing}, so ${b} pieces make one: ${a * b} ÷ ${b} = ${a}.` };
      if (r.v === b) return { ok: false, mc: 'mc.reasoning-language.numbers-in-reading-order', say: `${b} is the number of ${c.sharers}. Put the shares back together: ${b} × ${fr(a, b)} = ${a}.` };
      return { ok: false, say: `Put all ${b} shares back together: ${b} × ${fr(a, b)} = ${fr(a * b, b)} = ${a}.` };
    },
  };
};

const slip: Gen = (R, n) => {
  const kind = pick(R, ['flip', 'over', 'drop'] as const);
  const c = pick(R, OBJECTS);
  let a: number, b: number;
  if (kind === 'flip') do { b = int(R, 3, 6); a = int(R, 1, b - 1); } while (!equalShareFits(a, b));
  else do { b = int(R, 3, 6); a = b * int(R, 1, 2) + int(R, 1, b - 1); } while (!equalShareFits(a, b));
  const q = Math.floor(a / b), rem = a % b;
  const wrote = kind === 'flip' ? fr(b, a) : kind === 'over' ? `${q}&#8202;${fr(rem, a)}` : String(q);
  const right = kind === 'flip' ? fr(a, b) : mixed(a, b);
  const reasons = {
    flip: `The amount shared goes on top: it should be ${right}.`,
    over: `The leftover is shared by ${b}, so it is ${fr(rem, b)} more, not ${fr(rem, a)}: ${right}.`,
    drop: `The ${rem} left over were not shared. Each gets ${fr(rem, b)} more: ${right}.`,
  };
  const fake = [
    { t: 'Nothing: the bigger number always goes on top.', mc: 'mc.fraction-ops.larger-number-always-dividend' },
    { t: 'Nothing: a share can never be more than 1 whole.', mc: 'mc.fractions-concept.fraction-must-be-less-than-one' },
    { t: `The bottom should be ${a * b}, the number of pieces.`, mc: 'mc.fractions-concept.all-shown-taken-as-one-whole' },
    { t: 'Leftovers are never shared, so it is fine.', mc: 'mc.mul-div.drops-remainder' },
  ];
  const opts = [{ t: reasons[kind], ok: true as boolean, mc: undefined as string | undefined }, ...shuffle(R, fake).slice(0, 2).map(f => ({ t: f.t, ok: false, mc: f.mc }))];
  // the right reason for another slip, as a plausible-but-wrong diagnosis
  if (kind === 'flip') opts.push({ t: `Each ${c.thing} should be cut into ${a} pieces, not ${b}.`, ok: false, mc: 'mc.fractions-concept.fraction-division-order-reversed' });
  else opts.push({ t: reasons[kind === 'over' ? 'drop' : 'over'], ok: false, mc: undefined });
  const order = shuffle(R, opts.map((_, i) => i)), C = order.map(i => opts[i]!);
  return {
    id: `slip-${n}`, family: 'slip',
    prompt: `${A(`${a} ${c.things}`)} are shared equally by ${B(`${b} ${c.sharers}`)}. Jordan says each ${c.sharer} gets ${wrote} of a ${c.thing}. What went wrong?`,
    board: `\\text{Jordan: } ${a} \\div ${b} = ${kind === 'flip' ? `\\frac{${b}}{${a}}` : kind === 'over' ? `${q}\\tfrac{${rem}}{${a}}` : String(q)}`,
    input: 'choice', choices: C.map(o => o.t),
    model: { a, b, words: [c.things, c.sharers], one: [c.thing, c.sharer], look: c.look },
    solution: shareSolution(a, b, `of a ${c.thing}`),
    answer: { kind: 'choice', i: C.findIndex(o => o.ok) },
    check: r => {
      if (r.kind !== 'choice') return { ok: false, say: 'Pick one.' };
      const o = C[r.i];
      if (!o) return { ok: false, say: 'Pick one.' };
      if (o.ok) return { ok: true, say: `Right. ${reasons[kind]}` };
      if (o.mc === 'mc.fraction-ops.larger-number-always-dividend') return { ok: false, mc: o.mc, say: `Not always: ${a} ${c.things} for ${b} ${c.sharers} is ${a} ÷ ${b}, whatever is bigger. ${reasons[kind]}` };
      if (o.mc === 'mc.fractions-concept.fraction-must-be-less-than-one') return { ok: false, mc: o.mc, say: `A share can be more than 1 whole: 5 bars for 3 friends is 1 ${fr(2, 3)} bars each. ${reasons[kind]}` };
      if (o.mc === 'mc.fractions-concept.all-shown-taken-as-one-whole') return { ok: false, mc: o.mc, say: `The share is measured against ONE ${c.thing}, not all the pieces. ${reasons[kind]}` };
      if (o.mc === 'mc.fractions-concept.fraction-division-order-reversed') return { ok: false, mc: o.mc, say: `There are ${b} ${c.sharers}, so each ${c.thing} is cut into ${b} pieces. The slip is the order: ${reasons[kind]}` };
      if (o.mc === 'mc.mul-div.drops-remainder') return { ok: false, mc: o.mc, say: `These can be cut, so the leftover is shared too. ${reasons[kind]}` };
      return { ok: false, say: `That's a different slip. Look at what Jordan wrote: ${wrote}. ${reasons[kind]}` };
    },
  };
};

export const GENERATORS: Record<FamilyId, Gen> = { story, toFrac, toDiv, between, remainder, checkBack, slip };

// ---------- the session: blocked start, then interleaved; a twin after a miss; mastery from the last six ----------
export interface Attempt { family: FamilyId; ok: boolean; mc?: string }
export const MASTERY = { window: 6, need: 5, families: 4 } as const;

export function mastery(log: readonly Attempt[]): { done: boolean; lastOk: number; famOk: number; window: readonly Attempt[] } {
  const w = log.slice(-MASTERY.window);
  const lastOk = w.filter(x => x.ok).length;
  const famOk = new Set(w.filter(x => x.ok).map(x => x.family)).size;
  return { done: w.length >= MASTERY.window && lastOk >= MASTERY.need && famOk >= MASTERY.families, lastOk, famOk, window: w };
}

/** the next family: a twin after a miss, two blocked 'story' items first, then never the same family twice in a row,
 *  preferring the families with the fewest correct answers so far */
export function nextFamily(log: readonly Attempt[], R: () => number): FamilyId {
  const last = log[log.length - 1];
  if (last && !last.ok) return last.family;
  if (log.length < 2) return 'story';
  const okCount = (f: FamilyId) => log.filter(x => x.family === f && x.ok).length;
  const cands = FAMILIES.map(f => f.id).filter(f => f !== last?.family);
  const min = Math.min(...cands.map(okCount));
  const low = cands.filter(f => okCount(f) <= min + 0);
  return pick(R, low);
}
export function makeItem(f: FamilyId, R: () => number, n: number): Item { return GENERATORS[f](R, n); }
