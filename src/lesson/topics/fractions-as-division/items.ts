// items.ts: exercise families for "fractions as division", generated from templates, checked exactly, and every
// wrong answer classified against the misconception catalogue (math-curriculum-essentials/misconceptions.json ids).
//
// A FAMILY is one deep structure (e.g. "a sharing story -> a/b with its unit"); its items vary the numbers, the
// context, the order of the story and the wording. A generator gets the SUB-GOAL it practises (plan.ts) and uses
// that sub-goal's number ranges from the topic JSON. Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { equalShareFits } from '../../shareLayout';
import { type Item, type Response, type Verdict, A, B, S, fr, fracValue, gcd, int, mixed, pick, rng, same, shuffle } from '../../runtime/item';
export { fr, mixed, rng, fracValue, same };
export type { Response, Verdict };

export type FamilyId = 'story' | 'storyToDiv' | 'toFrac' | 'toDiv' | 'toMixed' | 'between' | 'remainder' | 'checkBack' | 'twoWays' | 'cutOrKeep' | 'groups' | 'slip';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'story', name: 'Sharing story' },
  { id: 'storyToDiv', name: 'Story to division' },
  { id: 'toFrac', name: 'Division to fraction' },
  { id: 'toDiv', name: 'Fraction to division' },
  { id: 'toMixed', name: 'As a mixed number' },
  { id: 'between', name: 'Between which wholes' },
  { id: 'remainder', name: 'Share the leftover' },
  { id: 'checkBack', name: 'Check it adds back' },
  { id: 'twoWays', name: 'Two ways to share' },
  { id: 'cutOrKeep', name: 'Cut it or keep it whole' },
  { id: 'groups', name: 'What does the question ask?' },
  { id: 'slip', name: 'Spot the slip' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

export interface Model { a: number; b: number; words: [string, string]; one: [string, string]; look: Look }
export type Look = 'granola' | 'brownie' | 'ribbon';
/** an item of this topic: a runtime Item plus the pictures this page can draw */
export interface ShareItem extends Item {
  family: FamilyId;
  /** the picture of the situation (when the EqualShare model can draw it) */
  model?: Model;
  /** a measured amount drawn as a strip (rope, rice, trail mix) */
  strip?: { a: number; b: number; unit: string; sharers: string };
}

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
type Gen = (R: () => number, n: number, sg?: string) => ShareItem;

const story: Gen = (R, n, sg) => {
  // sub-goal ranges (topic JSON 'cases'): one whole; several wholes, share < 1; share >= 1 incl. exact; else mixed
  const objectsOnly = sg === 'share-one-whole' || sg === 'share-several-wholes-less-than-one' || sg === 'share-one-or-more-wholes';
  const measure = !objectsOnly && R() < 0.4;
  let a: number, b: number;
  if (sg === 'share-one-whole') { a = 1; b = pick(R, [2, 3, 4, 6]); }
  else if (sg === 'share-several-wholes-less-than-one') do { b = pick(R, [3, 4, 6]); a = int(R, 2, Math.min(5, b - 1)); } while (!equalShareFits(a, b));
  else if (sg === 'share-one-or-more-wholes') do { b = pick(R, [2, 3, 4]); a = int(R, b, Math.min(8, 2 * b)); } while (!equalShareFits(a, b));
  else do { b = int(R, 2, measure ? 8 : 6); a = int(R, measure ? 2 : 1, measure ? 3 * b : 2 * b); } while (a === b || a % b === 0 || (!measure && !equalShareFits(a, b)));
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
    pairLead: `${fr(a, b)} =`, pairOp: '÷',
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


// ---------- families for the remaining sub-goals ----------

/** sharing-story-to-division: write the division for a story (people sometimes named first) */
const storyToDiv: Gen = (R, n) => {
  let a: number, b: number;
  const objects = R() < 0.5;
  // objects are drawn with the EqualShare model, measures with the strip: both show the situation, not the answer
  if (objects) do { b = int(R, 2, 6); a = int(R, 2, 8); } while (a === b || !equalShareFits(a, b));
  else do { b = int(R, 2, 10); a = int(R, 2, 30); } while (a === b);
  const peopleFirst = objects && R() < 0.6;
  const c = pick(R, OBJECTS), x = pick(R, MEASURES);
  const m = objects ? { amt: `${a} ${c.things}`, who: `${b} ${c.sharers}` } : { amt: `${a} ${x.unit} ${x.what}`, who: `${b} ${x.sharers}` };
  const prompt = peopleFirst
    ? `${B(m.who)} share ${A(m.amt)} equally. Which division gives one share?`
    : objects ? `${A(m.amt)} are shared equally by ${B(m.who)}. Which division gives one share?`
      : `${A(m.amt)} ${x.verb} ${B(m.who)}. Which division gives one ${x.sharer}?`;
  return {
    id: `storyToDiv-${n}`, family: 'storyToDiv', prompt, board: `\\,?\\, \\div \\,?`, input: 'pair', pairLead: `one ${objects ? 'share' : x.sharer} =`, pairOp: '÷',
    ...(objects ? { model: { a, b, words: [c.things, c.sharers] as [string, string], one: [c.thing, c.sharer] as [string, string], look: c.look } } : { strip: { a, b, unit: x.unit, sharers: x.sharers } }),
    solution: [`The amount that is shared comes first: ${A(a)}. The number of shares comes second: ${B(b)}.`, `One share = ${A(a)} ÷ ${B(b)} = ${S(fr(a, b))}.`],
    answer: { kind: 'pair', x: a, y: b },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (r.x === a && r.y === b) return { ok: true, say: `Yes: ${a} ÷ ${b}, and that is ${fr(a, b)} each.` };
      if (r.x === b && r.y === a) return {
        ok: false, mc: peopleFirst ? 'mc.reasoning-language.numbers-in-reading-order' : 'mc.fraction-ops.larger-number-always-dividend',
        say: peopleFirst ? `The story names the ${B(m.who.split(' ').slice(1).join(' '))} first, but they are the shares, not what is shared. The amount goes first: ${a} ÷ ${b}.`
          : `${b} ÷ ${a} would share ${b} among ${a}. Here ${A(m.amt)} are shared: ${a} ÷ ${b}.`,
      };
      return { ok: false, say: `What is shared ÷ how many share it: ${a} ÷ ${b}.` };
    },
  };
};

/** quotient-as-mixed-number: write a/b > 1 as a whole number or a mixed number */
const toMixed: Gen = (R, n) => {
  let a: number, b: number;
  do { b = pick(R, [2, 3, 4, 5, 6, 8, 9]); a = int(R, b + 1, Math.min(60, 10 * b - 1)); } while (a > 30 && R() < 0.5);
  const q = Math.floor(a / b), rem = a % b;
  return {
    id: `toMixed-${n}`, family: 'toMixed', prompt: rem ? 'Write the share as a mixed number.' : 'Write the share as a whole number.',
    board: `${a} \\div ${b} = \\frac{${a}}{${b}} = \\,?`, input: 'frac',
    solution: [`${b} × ${q} = ${b * q}, so ${q} whole${q === 1 ? '' : 's'} use ${b * q} of the ${a} ${fr(1, b)}-pieces.`, rem ? `${rem} piece${rem === 1 ? '' : 's'} are left: ${fr(rem, b)}. So ${fr(a, b)} = ${S(mixed(a, b))}.` : `Nothing is left: ${fr(a, b)} = ${S(String(q))}.`],
    answer: { kind: 'frac', w: q, n: rem, d: rem ? b : 1 },
    check: r => {
      if (r.kind !== 'frac') return { ok: false, say: 'Type a mixed number.' };
      const v = fracValue(r);
      if (!v) return { ok: false, say: 'Fill in whole numbers; the bottom box cannot be 0.' };
      if (same(v, a, b)) {
        if (r.w === 0 && r.n > r.d) return { ok: false, mc: 'mc.fractions-concept.mixed-number-form-unfinished', say: `Same value, but still an improper fraction. Group ${b} pieces into each whole: ${mixed(a, b)}.` };
        if (r.n >= r.d && r.n > 0) return { ok: false, mc: 'mc.fractions-concept.mixed-number-form-unfinished', say: `Same value, but the fraction part is a whole or more. Move whole ones out: ${mixed(a, b)}.` };
        return { ok: true, say: `Yes: ${fr(a, b)} = ${mixed(a, b)}.` };
      }
      if (rem && r.w === q && r.n === rem && r.d === a) return { ok: false, mc: 'mc.fractions-concept.remainder-misplaced-in-fraction-part', say: `The leftover pieces are ${fr(1, b)}s, so ${rem} of them is ${fr(rem, b)}, not ${fr(rem, a)}: ${mixed(a, b)}.` };
      if (rem && r.w === q && r.n === 0) return { ok: false, mc: 'mc.mul-div.drops-remainder', say: `${q} wholes, and ${rem} pieces are still left: ${mixed(a, b)}.` };
      return { ok: false, say: `How many wholes fit? ${b} × ${q} = ${b * q}. ${fr(a, b)} = ${mixed(a, b)}.` };
    },
  };
};

/** two-sharing-methods-agree: "cut everything" a/b and "wholes first" q r/b are the same share */
const twoWays: Gen = (R, n) => {
  let a: number, b: number;
  do { b = int(R, 2, 5); a = int(R, b + 1, 20); } while (a % b === 0);
  const q = Math.floor(a / b), rem = a % b, c = pick(R, OBJECTS);
  const opts = shuffle(R, [
    { t: `The same: ${a} pieces of ${fr(1, b)} make ${q} whole and ${fr(rem, b)}.`, ok: true },
    { t: `Cutting everything gives more, because there are more pieces.`, ok: false, mc: 'mc.fractions-concept.numerator-counted-as-whole-units' },
    { t: `Wholes first gives more, because whole ${c.things} are bigger.`, ok: false, mc: 'mc.fractions-concept.different-forms-different-numbers' },
    { t: `They can't be compared: one is a fraction and one is a mixed number.`, ok: false, mc: 'mc.fractions-concept.different-forms-different-numbers' },
  ]);
  return {
    id: `twoWays-${n}`, family: 'twoWays',
    prompt: `${A(`${a} ${c.things}`)} for ${B(`${b} ${c.sharers}`)}. Kai cuts every one into ${b} and deals the pieces: ${fr(a, b)} each. Lee gives out whole ones first, then cuts the rest: ${mixed(a, b)} each. Who gives more?`,
    board: `\\frac{${a}}{${b}} \\ \\text{or}\\ ${q}\\tfrac{${rem}}{${b}}\\,?`, input: 'choice', choices: opts.map(o => o.t),
    solution: [`Kai's ${a} pieces of ${fr(1, b)}: every ${b} of them make one whole, so ${q} wholes and ${rem} pieces.`, `That is exactly Lee's ${mixed(a, b)}. Two ways, ${S('the same share')}.`],
    answer: { kind: 'choice', i: opts.findIndex(o => o.ok) },
    check: r => {
      const o = r.kind === 'choice' ? opts[r.i] : undefined;
      if (!o) return { ok: false, say: 'Pick one.' };
      return o.ok ? { ok: true, say: `Right: ${fr(a, b)} = ${mixed(a, b)}. The same amount, written two ways.` } : { ok: false, mc: o.mc, say: `Count it: ${a} pieces of ${fr(1, b)} = ${q} whole and ${rem} more pieces = ${mixed(a, b)}. The same share.` };
    },
  };
};

/** remainder-subdivide-or-keep: objects that must stay whole -> q each and r left over */
const KEEP = [{ things: 'trading cards', who: 'kids' }, { things: 'marbles', who: 'friends' }, { things: 'stickers', who: 'kids' }, { things: 'balloons', who: 'tables' }];
const cutOrKeep: Gen = (R, n) => {
  let a: number, b: number;
  do { b = int(R, 2, 8); a = int(R, b + 1, 40); } while (a % b === 0);
  const q = Math.floor(a / b), rem = a % b, k = pick(R, KEEP);
  return {
    id: `cutOrKeep-${n}`, family: 'cutOrKeep',
    prompt: `${A(`${a} ${k.things}`)} are shared equally by ${B(`${b} ${k.who}`)}. They can't be cut. How many does each get, and how many are left over?`,
    board: `${a} = ${b} \\times \\,?\\, + \\,?`, input: 'pair', pairLead: 'each gets', pairOp: 'left over',
    solution: [`${b} × ${q} = ${b * q}: each gets ${S(String(q))}.`, `${a} − ${b * q} = ${rem} ${k.things} are left over; they stay whole. Check: ${b} × ${q} + ${rem} = ${a}.`],
    answer: { kind: 'pair', x: q, y: rem },
    check: r => {
      if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (r.x === q && r.y === rem) return { ok: true, say: `Yes: ${b} × ${q} + ${rem} = ${a}. Nothing lost.` };
      if (r.x === q && r.y === 0) return { ok: false, mc: 'mc.mul-div.excludes-leftovers-from-total-check', say: `${b} × ${q} = ${b * q}, not ${a}: ${rem} are left over and must be counted.` };
      if (r.x === q + rem) return { ok: false, mc: 'mc.fractions-concept.allocates-entire-remainder-to-each-sharer', say: `If each got ${q + rem}, that would need ${b * (q + rem)}. Each gets ${q}; ${rem} stay over.` };
      if (r.x * b + r.y === a && r.y >= b) return { ok: false, say: `${r.y} left over is enough to give everyone one more. Each gets ${q}, ${rem} left over.` };
      return { ok: false, say: `How many times does ${b} fit in ${a}? ${b} × ${q} = ${b * q}, so ${q} each and ${rem} left over.` };
    },
  };
};

/** remainder-sharing-vs-grouping: the same division, the answer form the question asks for */
const groups: Gen = (R, n) => {
  let a: number, b: number;
  do { b = int(R, 3, 9); a = int(R, b + 1, 9 * b); } while (a % b === 0);
  const q = Math.floor(a / b), rem = a % b;
  const ctx = pick(R, [
    { what: 'eggs', box: 'cartons', ask: 'full', q: `How many cartons can be filled completely?`, ans: q },
    { what: 'eggs', box: 'cartons', ask: 'need', q: `How many cartons are needed to hold all the eggs?`, ans: q + 1 },
    { what: 'eggs', box: 'cartons', ask: 'left', q: `How many eggs are in the carton that is not full?`, ans: rem },
    { what: 'students', box: 'vans', ask: 'need', q: `How many vans are needed to take every student?`, ans: q + 1 },
    { what: 'cookies', box: 'boxes', ask: 'full', q: `How many boxes can be filled completely?`, ans: q },
  ]);
  const hold = ctx.box === 'vans' ? `Each van holds ${b} students.` : `Each ${ctx.box.slice(0, -1).replace('boxe', 'box')} holds ${b}.`;
  return {
    id: `groups-${n}`, family: 'groups',
    prompt: `${A(`${a} ${ctx.what}`)}. ${hold} ${ctx.q}`, board: `${a} \\div ${b} = ${q}\\ \\text{R}\\ ${rem}`, input: 'num', unit: ctx.ask === 'left' ? ctx.what : ctx.box,
    solution: [`${a} = ${b} × ${q} + ${rem}: ${q} full, ${rem} left.`, ctx.ask === 'full' ? `Full ones: ${S(String(q))}.` : ctx.ask === 'need' ? `The ${rem} left still need a place: ${q} + 1 = ${S(String(q + 1))}.` : `The not-full one holds the ${S(String(rem))} left over.`],
    answer: { kind: 'num', v: ctx.ans },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a whole number.' };
      if (r.v === ctx.ans) return { ok: true, say: `Yes: ${a} = ${b} × ${q} + ${rem}, and the question asks for ${ctx.ask === 'full' ? 'the full ones' : ctx.ask === 'need' ? 'enough for everything' : 'the leftover'}.` };
      if (ctx.ask === 'need' && r.v === q) return { ok: false, mc: 'mc.mul-div.drops-remainder', say: `With ${q} there are still ${rem} ${ctx.what} with no place. You need one more: ${q + 1}.` };
      if (ctx.ask === 'full' && r.v === q + 1) return { ok: false, mc: 'mc.mul-div.answer-form-from-fixed-context-category', say: `The last one only gets ${rem}, so it is not full. Full: ${q}.` };
      return { ok: false, say: `${a} = ${b} × ${q} + ${rem}. Read what the question asks: ${ctx.ans}.` };
    },
  };
};

export const GENERATORS: Record<FamilyId, Gen> = { story, storyToDiv, toFrac, toDiv, toMixed, between, remainder, checkBack, twoWays, cutOrKeep, groups, slip };
void gcd; void rng;
