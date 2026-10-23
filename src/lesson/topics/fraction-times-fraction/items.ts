// items.ts: practice families for "multiply a fraction by a fraction" (grade 5, 5.NF.B.4-6). Each family is one deep
// structure; a generator receives the sub-goal id and uses that sub-goal's number ranges (topic JSON `cases`).
// Every wrong answer the classifier recognises carries its misconception id (math-curriculum-essentials).
// Pure: no DOM, no canvas. PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, fr, fracValue, gcd, int, mixed, pick, same, shuffle } from '../../runtime/item';
import { areaFits } from './AreaModel';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId = 'ofWhole' | 'areaRead' | 'equation' | 'rule' | 'tiles' | 'compute' | 'simplify' | 'cancel' | 'predict' | 'explain' | 'story' | 'rect';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  ofWhole: 'A fraction of a number',
  areaRead: 'Read the pan',
  equation: 'Which equation, which story',
  rule: 'Cells and the rule',
  tiles: 'Tile the rectangle',
  compute: 'Multiply',
  simplify: 'Simplest form',
  cancel: 'Simplify first',
  predict: 'Bigger or smaller?',
  explain: 'Why it shrinks or grows',
  story: 'Word problem',
  rect: 'Perimeter and area',
};

/** the picture the page draws for an item: the area model (pan or garden) at a given build stage */
export interface AreaPicture { kind: 'area'; a: number; b: number; c: number; d: number; look: 'pan' | 'plot'; words: { whole?: string; first?: string; take?: string }; upto: 'take' | 'grid' }

/** wrong responses with the misconception they must be classified as (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };
const F = (n: number, d: number): Response => ({ kind: 'frac', w: 0, n, d });

const tf = (n: number | string, d: number | string) => `\\tfrac{${n}}{${d}}`;
const dfrac = (n: number | string, d: number | string) => `\\frac{${n}}{${d}}`;
const mixTex = (w: number, n: number, d: number) => `${w}${tf(n, d)}`;
const simp = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
/** the plural name of a denominator: thirds, fourths (never "3ths") */
const ths = (d: number) => ({ 2: 'halves', 3: 'thirds', 4: 'fourths', 5: 'fifths', 6: 'sixths', 7: 'sevenths', 8: 'eighths', 9: 'ninths', 10: 'tenths', 12: 'twelfths' } as Record<number, string>)[d] ?? `${d}ths`;
const fracOrMixed = (n: number, d: number) => { const [p, q] = simp(n, d); return q === 1 ? String(p) : mixed(p, q); };

interface FracWrong { v: [number, number]; mc?: string; say: string; when?: boolean }
/** a fraction answer: any equivalent form is right unless `simplest` is asked */
function fracCheck(r: Response, n: number, d: number, okSay: string, wrongs: FracWrong[], fallback: string, simplest = false): Verdict {
  if (r.kind !== 'frac') return { ok: false, say: 'Type a fraction or a mixed number.' };
  const v = fracValue(r);
  if (!v) return { ok: false, say: 'Fill in the boxes with whole numbers (the bottom box cannot be 0).' };
  if (same(v, n, d)) {
    if (simplest) {
      if (r.d !== 1 && r.n > 0 && gcd(r.n, r.d) > 1) {
        const [p, q] = simp(n, d);
        return { ok: false, mc: 'mc.fractions-concept.stops-simplifying-early', say: `Same amount, but not simplest yet: ${r.n} and ${r.d} still share a factor of ${gcd(r.n, r.d)}. Keep going to ${fracOrMixed(p, q)}.` };
      }
    }
    return { ok: true, say: okSay };
  }
  for (const w of wrongs) if (w.when !== false && same(v, w.v[0], w.v[1]) && !same([n, d], w.v[0], w.v[1])) return { ok: false, mc: w.mc, say: w.say };
  return { ok: false, say: fallback };
}
function choiceCheck(r: Response, right: number, says: { say: string; mc?: string }[]): Verdict {
  if (r.kind !== 'choice') return { ok: false, say: 'Pick one answer.' };
  const s = says[r.i];
  if (!s) return { ok: false, say: 'Pick one answer.' };
  return { ok: r.i === right, mc: r.i === right ? undefined : s.mc, say: s.say };
}
/** shuffle options (text + verdict), return the item fields */
function options(R: () => number, opts: { t: string; ok?: boolean; say: string; mc?: string }[]): { choices: string[]; right: number; says: { say: string; mc?: string }[] } {
  const o = shuffle(R, opts.slice());
  const right = o.findIndex(x => x.ok);
  return { choices: o.map(x => x.t), right, says: o.map(x => ({ say: x.say, mc: x.mc })) };
}

// ---------- contexts (US, no money) ----------
const PAN_SKINS = [
  { whole: 'pan of brownies', first: 'frosted', take: 'eaten', firstVerb: 'is frosted', takeVerb: (who: string) => `${who} eats`, ask: 'of the whole pan', look: 'pan' as const },
  { whole: 'pan of cornbread', first: 'buttered', take: 'served', firstVerb: 'is buttered', takeVerb: (who: string) => `${who} serves`, ask: 'of the whole pan', look: 'pan' as const },
  { whole: 'garden bed', first: 'planted', take: 'carrots', firstVerb: 'is planted', takeVerb: (who: string) => `${who} puts carrots in`, ask: 'of the whole bed', look: 'plot' as const },
];
const WHO = ['Maya', 'Leo', 'Ana', 'Sam', 'Kim', 'Ravi', 'Jo', 'Eli'];
const COUNT_THINGS = ['muffins', 'crayons', 'marbles', 'stickers', 'apples', 'laps around the track', 'pages'];

// =====================================================================================================
// 1. a fraction of a whole number:  (a/b) x q   [fraction-times-whole]
const ofWhole: Gen = (R, n) => {
  const mode = R() < 0.25 ? 'commute' : R() < 0.6 ? 'multiple' : 'small';
  if (mode === 'commute') {
    const b = int(R, 3, 5), a = int(R, 2, b - 1), k = int(R, 2, 3), q = b * k, v = a * k;
    const o = options(R, [
      { t: `Both are ${v}: ${fr(a, b)} of ${q} is ${v}, and ${q} copies of ${fr(a, b)} are ${fr(a * q, b)} = ${v}.`, ok: true, say: `Yes. ${q} × ${fr(a, b)} and ${fr(a, b)} × ${q} are the same amount, ${v}. The order of the factors does not change the product.` },
      { t: `${fr(a, b)} of ${q} is ${fr(a * q, b * q)}, but ${q} × ${fr(a, b)} is ${v}.`, say: `${fr(a * q, b * q)} multiplies the top AND the bottom by ${q}: that is still just ${fr(a, b)}. ${fr(a, b)} of ${q} means cut ${q} into ${b} equal parts and take ${a}: ${v}.`, mc: 'mc.fraction-ops.multiplies-both-terms-by-whole-number' },
      { t: `Only ${q} × ${fr(a, b)} makes sense: you can't multiply by a fraction.`, say: `You can: × ${fr(a, b)} means take ${fr(a, b)} of it. ${fr(a, b)} of ${q} is ${v}, and so is ${q} × ${fr(a, b)}.`, mc: 'mc.fraction-ops.multiplication-only-as-copies' },
    ]);
    return { id: `ow-c-${n}`, family: 'ofWhole', prompt: `Compare ${A(`${fr(a, b)} of ${q}`)} with ${B(`${q} × ${fr(a, b)}`)}. Which is true?`, board: `${dfrac(a, b)} \\times ${q} \\quad ${q} \\times ${dfrac(a, b)}`, input: 'choice', choices: o.choices,
      solution: [`${fr(a, b)} of ${q}: cut ${q} into ${b} equal parts of ${k}, take ${a} of them: ${a} × ${k} = ${v}.`, `${q} × ${fr(a, b)}: ${q} copies of ${fr(a, b)} = ${fr(a * q, b)} = ${v}.`, `Same product: the order of the factors does not matter.`],
      answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  const b = int(R, 2, 6), a = int(R, 1, b - 1);
  const q = mode === 'multiple' ? b * int(R, 2, 4) : int(R, 2, Math.max(2, Math.floor((b - 1) / a)));
  const valid = mode === 'multiple' || a * q < b;
  const qq = valid ? q : 2, aa = valid ? a : 1, bb = valid ? b : Math.max(b, 3);
  const thing = mode === 'multiple' ? pick(R, COUNT_THINGS) : pick(R, ['pans of brownies', 'pizzas', 'yards of ribbon']);
  const [nn, dd] = simp(aa * qq, bb);
  const it: Item = {
    id: `ow-${n}`, family: 'ofWhole',
    prompt: mode === 'multiple' ? `What is ${S(fr(aa, bb))} of ${A(`${qq} ${thing}`)}?` : `There are ${A(`${qq} ${thing}`)}. How much is ${S(fr(aa, bb))} of them?`,
    board: `${dfrac(aa, bb)} \\times ${qq} = \\,?`, input: 'frac', unit: mode === 'multiple' ? thing : thing.split(' ')[0]!,
    solution: [`${fr(aa, bb)} × ${qq} means ${fr(aa, bb)} of ${qq}: cut ${qq} into ${bb} equal parts and take ${aa}.`, mode === 'multiple' ? `One part is ${qq} ÷ ${bb} = ${qq / bb}; ${aa} part${aa === 1 ? ' is' : 's are'} ${aa * qq / bb}.` : `One part is ${fr(qq, bb)}; ${aa} part${aa === 1 ? ' is' : 's are'} ${fr(aa * qq, bb)}.`, `So ${fr(aa, bb)} × ${qq} = ${S(fracOrMixed(aa * qq, bb))}.`],
    answer: dd === 1 ? { kind: 'frac', w: nn, n: 0, d: 1 } : F(aa * qq, bb),
    check: r => fracCheck(r, aa * qq, bb, `Yes: ${fr(aa, bb)} of ${qq} is ${fracOrMixed(aa * qq, bb)}.`, [
      { v: [aa, bb], mc: 'mc.fraction-ops.multiplies-both-terms-by-whole-number', say: `That multiplies the top and the bottom by ${qq}, which leaves ${fr(aa, bb)} unchanged. Take ${aa} of ${bb} equal parts of ${qq}: ${fracOrMixed(aa * qq, bb)}.` },
      { v: [aa * qq * bb, bb], say: `Too big: ${fr(aa, bb)} of ${qq} is less than ${qq}. Cut ${qq} into ${bb} parts, take ${aa}.` },
    ], `Not quite. Cut ${qq} into ${bb} equal parts and take ${aa}: ${fracOrMixed(aa * qq, bb)}.`),
  };
  probe(it, F(aa * qq, bb * qq), 'mc.fraction-ops.multiplies-both-terms-by-whole-number');
  return it;
};

// =====================================================================================================
// 2. read the area model [unit-of-unit, unit-of-nonunit, nonunit-of-nonunit, improper-factors]
function areaNumbers(R: () => number, sg?: string): [number, number, number, number] {
  for (let t = 0; t < 200; t++) {
    let a: number, b: number, c: number, d: number;
    if (sg === 'unit-of-unit') { a = 1; c = 1; b = int(R, 2, 4); d = int(R, 2, 4); }
    else if (sg === 'unit-of-nonunit') { a = 1; b = int(R, 2, 3); d = int(R, 3, 6); c = int(R, 2, d - 1); }
    else if (sg === 'improper-factors') { b = int(R, 2, 4); a = int(R, 1, b - 1); d = int(R, 2, 4); c = int(R, d + 1, 2 * d - 1); }
    else { b = int(R, 3, 6); a = int(R, 2, b - 1); d = int(R, 2, 6); c = int(R, 1, d - 1); if (c === 1 && R() < 0.6) c = Math.min(d - 1, 2); }
    if (areaFits(a, b, c, d)) return [a, b, c, d];
  }
  return [2, 3, 3, 4];
}
const areaRead: Gen = (R, n, sg) => {
  const [a, b, c, d] = areaNumbers(R, sg);
  const improper = c > d;
  // more than one whole: only pans of brownies (3/2 of ONE garden bed cannot be planted)
  const sk0 = pick(R, PAN_SKINS), who = pick(R, WHO);
  const sk = improper ? PAN_SKINS[0]! : sk0;
  const amount = improper ? `${fr(c, d)} pans` : `${fr(c, d)} of the ${sk.whole}`;
  const prompt = sk.look === 'plot'
    ? `${A(`${fr(c, d)} of the garden bed`)} is planted. ${who} puts carrots in ${B(`${fr(a, b)} of the planted part`)}. What fraction of the whole bed gets carrots?`
    : improper
      ? `${A(`${fr(c, d)} pans of brownies`)} are frosted (the dashed lines cut each pan into equal cells). ${who}'s class eats ${B(`${fr(a, b)} of the frosted brownies`)}. How many pans is that?`
      : `${A(amount)} ${sk.firstVerb}. ${sk.takeVerb(who)} ${B(`${fr(a, b)} of the ${sk.first} part`)}. What fraction of the whole pan is that?`;
  const unit = improper ? 'pans' : sk.ask;
  const N = a * c, D = b * d;
  const pic: AreaPicture = { kind: 'area', a, b, c, d, look: improper ? 'pan' : sk.look, words: improper ? { whole: '2 pans', first: 'frosted', take: 'eaten' } : { first: sk.first, take: sk.take }, upto: 'grid' };
  const it: Item = {
    id: `ar-${n}`, family: 'areaRead', prompt, board: `${dfrac(a, b)} \\text{ of } ${dfrac(c, d)} = \\,?`, input: 'frac', unit, picture: pic as unknown as Record<string, unknown>,
    solution: [
      `The dashed cuts make ${b} × ${d} = ${S(String(D))} equal cells in ONE whole ${improper ? 'pan' : sk.look === 'plot' ? 'bed' : 'pan'}.`,
      `${fr(a, b)} of the ${A(fr(c, d))}: ${a} of the ${b} rows of the ${sk.first} part, ${a} × ${c} = ${S(String(N))} cell${N === 1 ? '' : 's'}.`,
      `So ${fr(a, b)} × ${fr(c, d)} = ${gcd(N, D) > 1 ? `${fr(N, D)} = ${S(fracOrMixed(N, D))}` : S(fr(N, D))}${improper ? (N === D ? ' pan' : ' pans') : ''}.`,
    ],
    answer: F(N, D),
    check: r => fracCheck(r, N, D, `Yes: ${N} of the ${D} cells of one whole, ${fr(N, D)}${gcd(N, D) > 1 ? ` = ${fracOrMixed(N, D)}` : ''}.`, [
      { v: [a, b], mc: 'mc.fractions-concept.part-taken-as-whole', say: `${fr(a, b)} is the part of the ${sk.first} part. The question asks about the WHOLE ${improper ? 'pan' : sk.look === 'plot' ? 'bed' : 'pan'}: it has ${D} cells, and ${N} are taken.` },
      { v: [a * d + b * c, D], mc: 'mc.fraction-ops.adds-shaded-counts', say: `That adds the cells of both fractions. Only the cells that are in BOTH count: ${a} rows × ${c} columns = ${N} of ${D}.` },
      { v: [a, d], mc: 'mc.fraction-ops.selects-original-piece-without-subdivision', when: c > 1, say: `${a === 1 ? 'That is one of the original columns' : `That is ${a} of the original columns`}. ${fr(a, b)} of the ${A(fr(c, d))} means cutting the whole ${sk.first} part into ${b} rows: ${N} small cells of ${D}.` },
      { v: [a, D], mc: 'mc.fraction-ops.uses-one-piece-of-non-unit-fraction', when: c > 1, say: `That is ${fr(a, b)} of just ONE column. Take ${fr(a, b)} of all ${c} columns: ${a} × ${c} = ${N} cells of ${D}.` },
      { v: [N, d], mc: 'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient', when: b === d, say: `Count the cells of the whole: ${b} × ${d} = ${D}, not ${d}. So ${fr(N, D)}.` },
      { v: [N, c * b], mc: 'mc.fractions-concept.part-taken-as-whole', say: `${fr(N, b * c)} names the cells of the ${sk.first} part only. Against the whole there are ${D} cells: ${fr(N, D)}.` },
    ], `Count the small cells: ${N} are taken out of the ${D} in one whole, so ${fr(N, D)}.`),
  };
  if (!same([N, D], a, b)) probe(it, F(a, b), 'mc.fractions-concept.part-taken-as-whole');
  if (!same([N, D], a * d + b * c, D)) probe(it, F(a * d + b * c, D), 'mc.fraction-ops.adds-shaded-counts');
  if (c > 1 && !same([N, D], a, D) && !same([a, D], a, b) && !same([a, D], a * d + b * c, D)) probe(it, F(a, D), 'mc.fraction-ops.uses-one-piece-of-non-unit-fraction');
  return it;
};

// =====================================================================================================
// 3. which equation, which story [equation-and-story]
const equation: Gen = (R, n) => {
  let b = int(R, 2, 6), a = int(R, 1, b - 1), d = int(R, 2, 6), c = int(R, 1, d - 1);
  if (a * d === b * c) { c = 1; d = 6; b = 3; a = 2; }
  const who = pick(R, WHO);
  if (R() < 0.5) {
    const o = options(R, [
      { t: `${fr(a, b)} × ${fr(c, d)}`, ok: true, say: `Yes: “${fr(a, b)} of ${fr(c, d)}” is ${fr(a, b)} × ${fr(c, d)}.` },
      { t: `${fr(a, b)} + ${fr(c, d)}`, say: `“Of” is not “and”: nothing is added. ${fr(a, b)} of ${fr(c, d)} is a part of ${fr(c, d)}, so it is ${fr(a, b)} × ${fr(c, d)}.`, mc: 'mc.fraction-ops.reads-of-as-addition-or-subtraction' },
      { t: `${fr(c, d)} − ${fr(a, b)}`, say: `Nothing is taken away from ${fr(c, d)} by ${fr(a, b)}: we take ${fr(a, b)} OF it. That is ${fr(a, b)} × ${fr(c, d)}.`, mc: 'mc.fraction-ops.reads-of-as-addition-or-subtraction' },
      { t: `${fr(c, d)} ÷ ${fr(a, b)}`, say: `Dividing by ${fr(a, b)} would make it bigger. ${fr(a, b)} of ${fr(c, d)} is ${fr(a, b)} × ${fr(c, d)}.` },
    ]);
    return { id: `eq-m-${n}`, family: 'equation', prompt: `${A(`${fr(c, d)} of a yard of ribbon`)} is left. ${who} uses ${B(`${fr(a, b)} of it`)} for a bow. Which equation gives the ribbon in the bow?`, board: `${dfrac(a, b)} \\text{ of } ${dfrac(c, d)}`, input: 'choice', choices: o.choices,
      solution: [`“${fr(a, b)} of” a quantity means × ${fr(a, b)}.`, `So the bow uses ${fr(a, b)} × ${fr(c, d)} = ${fr(a * c, b * d)} yard.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  const o = options(R, [
    { t: `${who} has ${fr(c, d)} yd of ribbon and uses ${fr(a, b)} of it. How much ribbon does ${who} use?`, ok: true, say: `Yes: ${fr(a, b)} OF the ${fr(c, d)} yd is ${fr(a, b)} × ${fr(c, d)}.` },
    { t: `${who} has ${fr(c, d)} yd of ribbon and buys ${fr(a, b)} yd more. How much ribbon now?`, say: `That story adds: ${fr(c, d)} + ${fr(a, b)}. A product needs “${fr(a, b)} of” something.`, mc: 'mc.fraction-ops.reads-of-as-addition-or-subtraction' },
    { t: `${who} has ${fr(c, d)} yd of ribbon and cuts off ${fr(a, b)} yd. How much is left?`, say: `That story subtracts ${fr(a, b)} yd. A product needs “${fr(a, b)} of” the ribbon, not ${fr(a, b)} yd.`, mc: 'mc.fraction-ops.reads-of-as-addition-or-subtraction' },
  ]);
  return { id: `eq-s-${n}`, family: 'equation', prompt: `Which story fits ${S(`${fr(a, b)} × ${fr(c, d)}`)}?`, board: `${dfrac(a, b)} \\times ${dfrac(c, d)}`, input: 'choice', choices: o.choices,
    solution: [`${fr(a, b)} × ${fr(c, d)} means ${fr(a, b)} of ${fr(c, d)}.`, `The story must take ${fr(a, b)} OF the ${fr(c, d)} yd, not add or take away ${fr(a, b)} yd.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
};

// =====================================================================================================
// 4. cells and the rule [model-to-rule, nonunit-of-nonunit]
const rule: Gen = (R, n, sg) => {
  const [a, b, c, d] = areaNumbers(R, sg === 'nonunit-of-nonunit' ? sg : R() < 0.4 ? 'equal' : 'nonunit-of-nonunit');
  const dd = sg === 'model-to-rule' && R() < 0.35 ? b : d; // equal denominators sometimes
  const cc = Math.min(c, dd - 1) || 1;
  const N = a * cc, D = b * dd;
  if (R() < 0.6 || !areaFits(a, b, cc, dd)) {
    const AA = areaFits(a, b, cc, dd) ? [a, b, cc, dd] : [a, b, c, d];
    const [a1, b1, c1, d1] = AA as [number, number, number, number];
    const n1 = a1 * c1, D1 = b1 * d1;
    const pic: AreaPicture = { kind: 'area', a: a1, b: b1, c: c1, d: d1, look: 'pan', words: { first: 'frosted', take: 'eaten' }, upto: 'grid' };
    const it: Item = {
      id: `ru-${n}`, family: 'rule', prompt: `The picture shows ${S(`${fr(a1, b1)} of ${fr(c1, d1)}`)} of a pan. How many cells are eaten, and how many equal cells are in the whole pan?`,
      board: `${dfrac(a1, b1)} \\times ${dfrac(c1, d1)} = \\dfrac{\\square}{\\square}`, input: 'pair', pairLead: 'eaten cells', pairOp: 'of', picture: pic as unknown as Record<string, unknown>,
      solution: [`Rows × columns of the eaten part: ${a1} × ${c1} = ${S(String(n1))} cells (the top number).`, `Rows × columns of the whole pan: ${b1} × ${d1} = ${S(String(D1))} cells (the bottom number).`, `So ${fr(a1, b1)} × ${fr(c1, d1)} = ${fr(`${a1} × ${c1}`, `${b1} × ${d1}`)} = ${fr(n1, D1)}.`],
      answer: { kind: 'pair', x: n1, y: D1 },
      check: r => {
        if (r.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
        if (r.x === n1 && r.y === D1) return { ok: true, say: `Yes: ${a1} × ${c1} = ${n1} eaten, ${b1} × ${d1} = ${D1} in the whole pan. That is the rule: tops times tops over bottoms times bottoms.` };
        if (r.x === n1 && r.y === d1 && b1 === d1) return { ok: false, mc: 'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient', say: `The pan is not cut into ${d1} cells any more: the second cuts make ${b1} × ${d1} = ${D1}.` };
        if (r.x === n1 && r.y === b1 * c1) return { ok: false, mc: 'mc.fractions-concept.part-taken-as-whole', say: `${b1 * c1} counts the frosted part only. The whole pan has ${b1} × ${d1} = ${D1} cells.` };
        if (r.x === a1 + c1 || r.y === b1 + d1) return { ok: false, mc: 'mc.fraction-ops.adds-shaded-counts', say: `Count rows TIMES columns: ${a1} × ${c1} = ${n1} eaten, ${b1} × ${d1} = ${D1} in all.` };
        return { ok: false, say: `Count rows × columns: ${a1} × ${c1} = ${n1} eaten cells, ${b1} × ${d1} = ${D1} cells in the pan.` };
      },
    };
    if (b1 === d1) probe(it, { kind: 'pair', x: n1, y: d1 }, 'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient');
    else if (b1 * c1 !== D1) probe(it, { kind: 'pair', x: n1, y: b1 * c1 }, 'mc.fractions-concept.part-taken-as-whole');
    return it;
  }
  const o = options(R, [
    { t: `The second cuts run through the whole pan, so it has ${b} × ${dd} = ${D} equal cells.`, ok: true, say: `Yes. The bottom number counts the equal cells of ONE whole pan: ${b} rows × ${dd} columns.` },
    { t: `You always multiply the bottoms: that is just the rule.`, say: `The rule is right, but it has a reason: the cuts make ${b} × ${dd} = ${D} equal cells in the whole pan.`, mc: 'mc.fraction-ops.fraction-product-denominator-meaning-unexplained' },
    { t: `The frosted part has ${D} cells.`, say: `The frosted part has ${b} × ${cc} = ${b * cc} cells. ${D} is the whole pan: ${b} × ${dd}.`, mc: 'mc.fractions-concept.part-taken-as-whole' },
    ...(b === dd ? [{ t: `Both fractions are ${ths(dd)}, so the answer is ${ths(dd)} too.`, say: `Not for a product: cutting ${ths(dd)} into ${b} rows makes ${D} cells in the whole pan.`, mc: 'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient' }] : []),
  ]);
  const pic: AreaPicture | undefined = areaFits(a, b, cc, dd) ? { kind: 'area', a, b, c: cc, d: dd, look: 'pan', words: { first: 'frosted', take: 'eaten' }, upto: 'grid' } : undefined;
  return { id: `ru-w-${n}`, family: 'rule', prompt: `The pan shows ${fr(a, b)} of the frosted ${fr(cc, dd)}: ${fr(a, b)} × ${fr(cc, dd)} = ${fr(N, D)}. Why is the bottom number ${S(String(D))}?`, board: `${dfrac(a, b)} \\times ${dfrac(cc, dd)} = ${dfrac(N, D)}`, input: 'choice', choices: o.choices, picture: pic as unknown as Record<string, unknown> | undefined,
    solution: [`First cuts: ${dd} columns. Second cuts, through the whole pan: ${b} rows.`, `${b} × ${dd} = ${D} equal cells in one pan: that is the bottom number.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
};

// =====================================================================================================
// 5. tile a rectangle with fractional sides [fractional-side-area]
const tiles: Gen = (R, n) => {
  // same denominators, or one denominator a multiple of the other (renamed to the finer tiles)
  let a: number, b: number, c: number, d: number, note = '';
  void note;
  if (R() < 0.55) { d = int(R, 3, 6); b = d; c = int(R, 2, d - 1); a = int(R, 1, d - 1); }
  else { const pairs = [[2, 4], [2, 6], [3, 6]] as const; const [s, t] = pick(R, pairs); d = t; b = t; c = int(R, 1, t - 1); const a0 = int(R, 1, s - 1); a = a0 * (t / s); note = 'renamed'; }
  const N = a * c, D = b * d;
  const [wa, wb] = simp(a, b);
  const pic: AreaPicture = { kind: 'area', a, b, c, d, look: 'plot', words: { whole: '1 square foot', first: `\\tfrac{${c}}{${d}}\\text{ ft}`, take: `\\tfrac{${wa}}{${wb}}\\text{ ft}` }, upto: 'grid' };
  const it: Item = {
    id: `ti-${n}`, family: 'tiles',
    prompt: `A rectangle is ${A(`${fr(c, d)} ft`)} long and ${B(`${fr(wa, wb)} ft`)} wide, drawn inside a 1 ft by 1 ft square. Tiles of side ${fr(1, d)} ft cover it. What is its area?`,
    board: `${dfrac(c, d)}\\text{ ft} \\times ${dfrac(wa, wb)}\\text{ ft} = \\,?`, input: 'frac', unit: 'sq ft', picture: pic as unknown as Record<string, unknown>,
    solution: [
      ...(wb !== b ? [`${fr(wa, wb)} ft = ${fr(a, b)} ft, so the width is ${a} tiles.`] : []),
      `${D} tiles fill the square foot, so one tile is ${fr(1, D)} sq ft.`,
      `The rectangle is ${c} tile${c === 1 ? '' : 's'} by ${a} tile${a === 1 ? '' : 's'}: ${N} tiles = ${S(fr(N, D))} sq ft.`,
      `Check with the rule: ${fr(c, d)} × ${fr(wa, wb)} = ${fr(c * wa, d * wb)} = ${fr(N, D)}.`,
    ],
    answer: F(N, D),
    check: r => fracCheck(r, N, D, `Yes: ${N} tiles of ${fr(1, D)} sq ft, ${fr(N, D)} sq ft. Same as ${fr(c, d)} × ${fr(wa, wb)}.`, [
      { v: [N, 1], mc: 'mc.area-perimeter.counts-cells-without-their-unit-area', say: `${N} is the number of tiles, but each tile is only ${fr(1, D)} sq ft (${D} of them fill 1 square foot). So ${fr(N, D)} sq ft.` },
      { v: [N, d], mc: 'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient', say: `A tile is ${fr(1, d)} ft on a side, but its AREA is ${fr(1, D)} sq ft: ${D} tiles fill the square. ${fr(N, D)} sq ft.` },
      { v: [c * wb + wa * d, d * wb], say: `That adds the sides (that's half the perimeter). Area is length × width: ${fr(N, D)} sq ft.` },
    ], `Count the tiles: ${N}, each ${fr(1, D)} sq ft. Area = ${fr(N, D)} sq ft.`),
  };
  probe(it, { kind: 'frac', w: N, n: 0, d: 1 }, 'mc.area-perimeter.counts-cells-without-their-unit-area');
  return it;
};

// =====================================================================================================
// 6. multiply (bare) [compute-proper, improper-factors, identity-zero, mixed-number-factors]
const MIXED_T1: readonly [number, number, number][] = [[1, 1, 2], [2, 1, 2], [3, 1, 2], [4, 1, 2], [1, 2, 3], [2, 1, 3], [2, 2, 3], [3, 1, 3], [1, 3, 4], [2, 1, 4]];
const compute: Gen = (R, n, sg) => {
  let a: number, b: number, c: number, d: number;
  let lhs: string, lhsHtml: string;
  const wrongs: FracWrong[] = [];
  let extraProbe: { r: Response; mc: string } | null = null;
  if (sg === 'mixed-number-factors') {
    const [w1, n1, d1] = pick(R, MIXED_T1);
    a = w1 * d1 + n1; b = d1;
    if (R() < 0.5) { d = int(R, 2, 6); c = int(R, 1, d - 1); lhs = `${mixTex(w1, n1, d1)} \\times ${dfrac(c, d)}`; lhsHtml = `${w1}&#8202;${fr(n1, d1)} × ${fr(c, d)}`;
      wrongs.push({ v: [n1 * c, d1 * d], mc: 'mc.quadratic-polynomial.firsts-and-lasts-only', say: `Only ${fr(n1, d1)} × ${fr(c, d)} was multiplied: the ${w1} whole${w1 > 1 ? 's' : ''} times ${fr(c, d)} is missing. Turn ${w1}&#8202;${fr(n1, d1)} into ${fr(a, b)} first.` });
      if (n1 * c * b * d !== a * c * d1 * d) extraProbe = { r: F(n1 * c, d1 * d), mc: 'mc.quadratic-polynomial.firsts-and-lasts-only' };
    } else { const [w2, n2, d2] = pick(R, MIXED_T1); c = w2 * d2 + n2; d = d2; lhs = `${mixTex(w1, n1, d1)} \\times ${mixTex(w2, n2, d2)}`; lhsHtml = `${w1}&#8202;${fr(n1, d1)} × ${w2}&#8202;${fr(n2, d2)}`;
      wrongs.push({ v: [w1 * w2 * d1 * d2 + n1 * n2, d1 * d2], mc: 'mc.quadratic-polynomial.firsts-and-lasts-only', say: `${w1} × ${w2} plus ${fr(n1, d1)} × ${fr(n2, d2)} leaves out the cross parts (${w1} × ${fr(n2, d2)} and ${fr(n1, d1)} × ${w2}). Convert to ${fr(a, b)} × ${fr(c, d)} first.` });
      extraProbe = { r: F(w1 * w2 * d1 * d2 + n1 * n2, d1 * d2), mc: 'mc.quadratic-polynomial.firsts-and-lasts-only' };
    }
  } else if (sg === 'identity-zero') {
    d = int(R, 2, 9); c = int(R, 1, 2 * d - 1); if (c === d) c++;
    if (R() < 0.5) { b = int(R, 2, 9); a = b; lhs = `${dfrac(a, b)} \\times ${dfrac(c, d)}`; lhsHtml = `${fr(a, b)} × ${fr(c, d)}`;
      wrongs.push({ v: [c, d * b], mc: 'mc.fraction-ops.fraction-factor-always-shrinks', say: `${fr(a, b)} is 1 whole, so the product is ${fr(c, d)} itself: nothing shrinks.` });
    } else { b = int(R, 2, 9); a = 0; lhs = `${dfrac(0, b)} \\times ${dfrac(c, d)}`; lhsHtml = `${fr(0, b)} × ${fr(c, d)}`;
      wrongs.push({ v: [c, d], mc: 'mc.mul-div.times-zero-unchanged', say: `${fr(0, b)} is zero: zero of anything is 0. (Adding 0 keeps a number; multiplying by 0 makes 0.)` });
      extraProbe = { r: F(c, d), mc: 'mc.mul-div.times-zero-unchanged' };
    }
  } else if (sg === 'improper-factors') {
    const t2 = R() < 0.25;
    if (R() < 0.2) { b = int(R, 2, 6); a = 1; c = int(R, b + 1, 9); d = 1; if (c % b === 0) c++; lhs = `${dfrac(a, b)} \\times ${c}`; lhsHtml = `${fr(a, b)} × ${c}`; }
    else if (t2) { const pr = pick(R, [[13, 4, 5, 6], [7, 12, 15, 8], [11, 3, 4, 5], [5, 16, 9, 4], [15, 7, 2, 3]] as const); [a, b, c, d] = pr; lhs = `${dfrac(a, b)} \\times ${dfrac(c, d)}`; lhsHtml = `${fr(a, b)} × ${fr(c, d)}`; }
    else { b = int(R, 2, 5); a = int(R, b + 1, 10); d = int(R, 2, 9); c = R() < 0.5 ? int(R, 1, d - 1) : int(R, d + 1, 10); lhs = `${dfrac(a, b)} \\times ${dfrac(c, d)}`; lhsHtml = `${fr(a, b)} × ${fr(c, d)}`; }
  } else {
    const t2 = R() < 0.25;
    if (t2) { b = int(R, 11, 20); a = int(R, 1, 9); if (a >= b) a = b - 1; d = int(R, 3, 9); c = int(R, 1, d - 1); }
    else { b = int(R, 2, 10); a = int(R, 1, b - 1); d = R() < 0.25 ? b : int(R, 2, 10); c = int(R, 1, d - 1); }
    if (R() < 0.5) [a, b, c, d] = [c, d, a, b];
    lhs = `${dfrac(a, b)} \\times ${dfrac(c, d)}`; lhsHtml = `${fr(a, b)} × ${fr(c, d)}`;
  }
  const N = a * c, D = b * d;
  if (d > 1 && b * c !== 0) wrongs.push({ v: [a * d, b * c], mc: 'mc.fraction-ops.cross-multiplies-to-multiply', say: `That multiplies across (${a} × ${d} and ${b} × ${c}), the trick for comparing. To multiply: tops × tops, bottoms × bottoms.` });
  if (b === d && b > 1) wrongs.push({ v: [N, d], mc: 'mc.fraction-ops.keeps-common-denominator-in-product-or-quotient', say: `Keeping the ${d} is the rule for ADDING. A product of ${ths(d)} is cut ${b} × ${d} = ${D} ways.` });
  if (N > 0 && (a > b || c > d)) wrongs.push({ v: [N, D * 2], say: `Check the size: one factor is more than 1, so the product is bigger than the other factor.` });
  const okSay = N === 0 ? `Yes: zero times anything is 0.` : `Yes: ${fr(`${a} × ${c}`, `${b} × ${d}`)} = ${fr(N, D)}${gcd(N, D) > 1 || N > D ? ` = ${fracOrMixed(N, D)}` : ''}.`;
  const it: Item = {
    id: `cp-${n}`, family: 'compute', prompt: `Multiply: ${S(lhsHtml)}. Any equal form is fine.`, board: `${lhs} = \\,?`, input: 'frac',
    solution: [
      ...(sg === 'mixed-number-factors' ? [`Write the mixed numbers as fractions: ${fr(a, b)} × ${fr(c, d)}.`] : []),
      `Tops × tops: ${a} × ${c} = ${N}. Bottoms × bottoms: ${b} × ${d} = ${D}.`,
      `${N > 0 && (gcd(N, D) > 1 || N > D) ? `${fr(N, D)} = ${S(fracOrMixed(N, D))}` : S(fr(N, D))}${sg === 'mixed-number-factors' ? `. Size check: it lies between the products of the whole parts below and above.` : '.'}`,
    ],
    answer: N === 0 ? { kind: 'frac', w: 0, n: 0, d: 1 } : F(N, D),
    check: r => {
      if (N === 0 && r.kind === 'frac') { const v = fracValue(r); if (v && v[0] === 0) return { ok: true, say: okSay }; }
      return fracCheck(r, N, D, okSay, wrongs, `Tops × tops, bottoms × bottoms: ${fr(N, D)}${N > 0 && (gcd(N, D) > 1 || N > D) ? ` = ${fracOrMixed(N, D)}` : ''}.`);
    },
  };
  if (d > 1 && a * d * D !== N * b * c && b * c !== 0 && !(b === d && a * d === N)) probe(it, F(a * d, b * c), 'mc.fraction-ops.cross-multiplies-to-multiply');
  if (extraProbe && !(extraProbe.r.kind === 'frac' && same([extraProbe.r.n, extraProbe.r.d], N, D))) probe(it, extraProbe.r, extraProbe.mc);
  return it;
};

// =====================================================================================================
// 7. simplest form [simplify-product]
const simplify: Gen = (R, n) => {
  let a = 0, b = 0, c = 0, d = 0;
  for (let t = 0; t < 200; t++) {
    b = int(R, 2, 10); a = int(R, 1, b - 1); d = int(R, 2, 10); c = int(R, 1, d - 1);
    const g = gcd(a * c, b * d);
    if (g > 1 && g <= 36 && R() < 0.92) break;
    if (g === 1 && R() < 0.08) break;
  }
  const N = a * c, D = b * d, [p, q] = simp(N, D);
  if (R() < 0.25) {
    const who1 = pick(R, WHO), who2 = pick(R, WHO.filter(w => w !== who1));
    const g = gcd(N, D);
    const shown = g > 1 ? [N, D] : [N * 2, D * 2];
    const o = options(R, [
      { t: `Both: ${fr(shown[0]!, shown[1]!)} and ${fr(p, q)} are the same amount.`, ok: true, say: `Yes. Equal fractions name the same amount; simplest form is just the neatest name.` },
      { t: `Only ${who2}: ${fr(shown[0]!, shown[1]!)} is wrong because it is not simplified.`, say: `${fr(shown[0]!, shown[1]!)} is not wrong, just not simplest. It is the same amount as ${fr(p, q)}.`, mc: 'mc.expressions.rejects-equivalent-non-final-forms' },
      { t: `Only ${who1}: simplifying changes the answer.`, say: `Dividing the top and the bottom by the same number keeps the amount: ${fr(shown[0]!, shown[1]!)} = ${fr(p, q)}.`, mc: 'mc.properties.rewriting-changes-value' },
    ]);
    return { id: `si-c-${n}`, family: 'simplify', prompt: `For ${fr(a, b)} × ${fr(c, d)}, ${who1} writes ${fr(shown[0]!, shown[1]!)} and ${who2} writes ${fr(p, q)}. Who is right?`, board: `${dfrac(shown[0]!, shown[1]!)} \\;\\text{or}\\; ${dfrac(p, q)}\\,?`, input: 'choice', choices: o.choices,
      solution: [`${fr(shown[0]!, shown[1]!)}: divide top and bottom by ${gcd(shown[0]!, shown[1]!)} to get ${fr(p, q)}.`, `Same amount, two names. Both are right.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  const g = gcd(N, D);
  const half = (() => { for (const k of [2, 3, 5, 7]) if (g % k === 0 && g !== k) return k; return 0; })();
  const it: Item = {
    id: `si-${n}`, family: 'simplify', prompt: `${fr(a, b)} × ${fr(c, d)} = ${S(fr(N, D))}. Write it in simplest form.`, board: `${dfrac(N, D)} = \\,?`, input: 'frac',
    solution: g > 1 ? [`The biggest number that divides ${N} and ${D} is ${g}.`, `${N} ÷ ${g} = ${p}, ${D} ÷ ${g} = ${q}: ${S(fr(p, q))}.`, `Check: ${p} and ${q} share no factor but 1.`] : [`Look for a number bigger than 1 that divides both ${N} and ${D}.`, `There is none: ${S(fr(N, D))} is already simplest.`],
    answer: F(p, q),
    check: r => {
      if (r.kind === 'frac') {
        const v = fracValue(r);
        if (v && !same(v, N, D)) {
          for (const k1 of [2, 3, 4, 5, 6, 7, 8, 9]) for (const k2 of [2, 3, 4, 5, 6, 7, 8, 9]) if (k1 !== k2 && N % k1 === 0 && D % k2 === 0 && r.w === 0 && r.n === N / k1 && r.d === D / k2)
            return { ok: false, mc: 'mc.ratio-rate.unequal-factors-on-both-terms', say: `The top was divided by ${k1} and the bottom by ${k2}: that changes the amount. Divide both by the SAME number: ${fr(p, q)}.` };
        }
      }
      return fracCheck(r, N, D, g > 1 ? `Yes: ${fr(N, D)} = ${fr(p, q)}, and ${p} and ${q} share no factor but 1.` : `Yes: it was already in simplest form.`, [], `Divide the top and the bottom by ${g}: ${fr(p, q)}.`, true);
    },
  };
  if (half) probe(it, F(N / half, D / half), 'mc.fractions-concept.stops-simplifying-early');
  return it;
};

// =====================================================================================================
// 8. simplify first (cancel across factors) [cancel-before]
const CANCEL: readonly [number, number, number, number][] = [[4, 9, 3, 8], [3, 16, 8, 9], [7, 12, 4, 3], [2, 9, 3, 4], [5, 6, 9, 10], [6, 7, 14, 15], [4, 15, 5, 8], [3, 10, 5, 9], [8, 9, 3, 4], [2, 5, 15, 16], [6, 25, 5, 9], [9, 14, 7, 12], [10, 21, 7, 15], [4, 5, 15, 16]];
const cancel: Gen = (R, n) => {
  const [a, b, c, d] = pick(R, CANCEL);
  const g1 = gcd(a, d), g2 = gcd(c, b);
  const a1 = a / g1, d1 = d / g1, c1 = c / g2, b1 = b / g2;
  const N = a * c, D = b * d, [p, q] = simp(N, D);
  if (R() < 0.6) {
    const gn = gcd(a, c), gd = gcd(b, d);
    const bad = gn > 1 ? `${fr(a / gn, b)} × ${fr(c / gn, d)} (both tops ÷ ${gn})` : gd > 1 ? `${fr(a, b / gd)} × ${fr(c, d / gd)} (both bottoms ÷ ${gd})` : `${fr(a, b)} × ${fr(c - 1, d - 1)} (take 1 off ${c} and ${d})`;
    const o = options(R, [
      { t: `${fr(a1, b1)} × ${fr(c1, d1)} (divide ${a} and ${d} by ${g1}${g2 > 1 ? `, ${c} and ${b} by ${g2}` : ''})`, ok: true, say: `Yes: a top and a bottom are divided by the same number, so the product ${fr(`${a} × ${c}`, `${b} × ${d}`)} keeps its value: ${fr(p, q)}.` },
      { t: bad, say: gn > 1 || gd > 1 ? `Dividing two tops (or two bottoms) changes the product. Only a top and a bottom may be divided by the same number.` : `Taking 1 off changes the amount. Divide a top and a bottom by the same number.`, mc: gn > 1 || gd > 1 ? 'mc.fraction-ops.cancels-where-not-allowed' : undefined },
      { t: `None: simplifying first gives a different answer than multiplying first.`, say: `Both ways give ${fr(p, q)}: ${fr(N, D)} simplifies to it, and so does ${fr(a1, b1)} × ${fr(c1, d1)}.`, mc: 'mc.properties.rewriting-changes-value' },
    ]);
    return { id: `ca-c-${n}`, family: 'cancel', prompt: `To find ${S(`${fr(a, b)} × ${fr(c, d)}`)}, which first step keeps the product the same?`, board: `${dfrac(a, b)} \\times ${dfrac(c, d)}`, input: 'choice', choices: o.choices,
      solution: [`Write it as one fraction: ${fr(`${a} × ${c}`, `${b} × ${d}`)}.`, `${a} (top) and ${d} (bottom) share ${g1}${g2 > 1 ? `; ${c} (top) and ${b} (bottom) share ${g2}` : ''}: divide them.`, `${fr(a1, b1)} × ${fr(c1, d1)} = ${fr(p, q)}.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  return { id: `ca-${n}`, family: 'cancel', prompt: `Simplify first, then multiply: ${S(`${fr(a, b)} × ${fr(c, d)}`)}. (Multiplying first and simplifying after is fine too.)`, board: `${dfrac(a, b)} \\times ${dfrac(c, d)} = \\,?`, input: 'frac',
    solution: [`${fr(`${a} × ${c}`, `${b} × ${d}`)}: divide ${a} and ${d} by ${g1}${g2 > 1 ? `, ${c} and ${b} by ${g2}` : ''}.`, `${fr(a1, b1)} × ${fr(c1, d1)} = ${S(fr(p, q))}.`], answer: F(p, q),
    check: r => fracCheck(r, N, D, `Yes: ${fr(p, q)}${p * D !== N * q ? '' : ''}.`, [
      { v: [a * d, b * c], mc: 'mc.fraction-ops.cross-multiplies-to-multiply', say: `That multiplies across. For a product: tops × tops, bottoms × bottoms, ${fr(p, q)}.` },
    ], `Simplify a top with a bottom, then multiply: ${fr(p, q)}.`) };
};

// =====================================================================================================
// 9. bigger or smaller? [predict-size, times-as-much, identity-zero]
const ODD_DEN = [7, 9, 11, 13, 17, 19];
const predict: Gen = (R, n, sg) => {
  if (sg === 'times-as-much' && R() < 0.75) {
    const q = int(R, 6, 15), dd = int(R, 3, 6), more = R() < 0.4, nn = more ? int(R, dd + 1, 2 * dd - 1) : int(R, 1, dd - 1);
    const o = options(R, [
      { t: more ? `Longer than ${q} ft: it is ${fr(nn, dd)} as long, and ${fr(nn, dd)} is more than 1.` : `Shorter than ${q} ft: it is ${fr(nn, dd)} as long, and ${fr(nn, dd)} is less than 1.`, ok: true, say: `Yes: the blue ribbon is ${fr(nn, dd)} × ${q} ft, the red ribbon resized by ${fr(nn, dd)}.` },
      { t: more ? `Shorter than ${q} ft: it is ${q} times ${fr(nn, dd)} ft.` : `Longer than ${q} ft: it is ${q} times ${fr(nn, dd)} ft.`, say: `The red ribbon (${q} ft) is the one being resized; ${fr(nn, dd)} is the scale. Blue = ${fr(nn, dd)} as long as red.`, mc: 'mc.fraction-ops.comparison-factors-have-interchangeable-roles' },
      { t: `Exactly ${q} ft: ${fr(nn, dd)} × ${q} is the same as ${q} × ${fr(nn, dd)}.`, say: `The two products are equal, but neither is ${q}: resizing ${q} ft by ${fr(nn, dd)} changes it.`, mc: 'mc.fraction-ops.comparison-factors-have-interchangeable-roles' },
    ]);
    return { id: `pr-t-${n}`, family: 'predict', prompt: `A red ribbon is ${A(`${q} ft`)} long. A blue ribbon is ${B(`${fr(nn, dd)} as long`)} as the red one. Without computing: how long is the blue ribbon?`, board: `${dfrac(nn, dd)} \\times ${q}\\text{ ft}`, input: 'choice', choices: o.choices,
      solution: [`“${fr(nn, dd)} as long as ${q} ft” = ${fr(nn, dd)} × ${q} ft.`, `${fr(nn, dd)} is ${more ? 'more' : 'less'} than 1, so the blue ribbon is ${more ? 'longer' : 'shorter'} than ${q} ft.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  // other factor m = mn/md, given factor g = gn/gd
  const md = pick(R, ODD_DEN);
  const kind = sg === 'identity-zero' ? 'one' : pick(R, ['less', 'less', 'more', 'one'] as const);
  const mn = kind === 'less' ? int(R, 2, md - 1) : kind === 'more' ? int(R, md + 1, 2 * md - 1) : md;
  const gd = pick(R, ODD_DEN.filter(x => x !== md)), gn = R() < 0.5 ? int(R, 1, gd - 1) : int(R, gd + 1, 2 * gd);
  const gIsWhole = R() < 0.25, gTex = gIsWhole ? String(gn) : dfrac(gn, gd), gHtml = gIsWhole ? String(gn) : fr(gn, gd);
  const right = kind === 'less' ? 1 : kind === 'more' ? 0 : 2;
  const mcLess = kind === 'more' && !gIsWhole && gn < gd ? 'mc.fraction-ops.subunit-factor-product-below-both' : 'mc.fraction-ops.fraction-factor-always-shrinks';
  const says = [
    { say: right === 0 ? `Yes: ${fr(mn, md)} is more than 1, so you get all of ${gHtml} and more.` : kind === 'less' ? `${fr(mn, md)} is less than 1: you get only part of ${gHtml}, so the product is smaller.` : `${fr(mn, md)} is exactly 1, so the product is ${gHtml} itself.`, mc: right === 0 ? undefined : 'mc.mul-div.multiplication-makes-bigger' },
    { say: right === 1 ? `Yes: ${fr(mn, md)} is less than 1, so you get only part of ${gHtml}.` : kind === 'more' ? `${fr(mn, md)} is more than 1: all of ${gHtml} and some more, so the product is bigger.` : `${fr(mn, md)} = 1, and 1 × ${gHtml} is ${gHtml}: it does not shrink.`, mc: right === 1 ? undefined : mcLess },
    { say: right === 2 ? `Yes: ${fr(mn, md)} is 1 whole, and 1 × ${gHtml} = ${gHtml}.` : `Only a factor of exactly 1 keeps ${gHtml} the same. ${fr(mn, md)} is ${kind === 'less' ? 'less' : 'more'} than 1.` },
  ];
  const it: Item = {
    id: `pr-${n}`, family: 'predict', prompt: `Without multiplying: is ${S(`${fr(mn, md)} × ${gHtml}`)} greater than, less than, or equal to ${A(gHtml)}?`,
    board: `${dfrac(mn, md)} \\times ${gTex} \\;\\;?\\;\\; ${gTex}`, input: 'choice', choices: [`greater than ${gHtml}`, `less than ${gHtml}`, `equal to ${gHtml}`],
    solution: [`Look only at the other factor, ${fr(mn, md)}: is it less than, equal to, or more than 1?`, `${fr(mn, md)} is ${kind === 'less' ? 'less than 1 → the product is less than' : kind === 'more' ? 'more than 1 → the product is greater than' : 'equal to 1 → the product equals'} ${gHtml}.`],
    answer: { kind: 'choice', i: right }, check: r => choiceCheck(r, right, says),
  };
  if (kind === 'less') probe(it, { kind: 'choice', i: 0 }, 'mc.mul-div.multiplication-makes-bigger');
  if (kind === 'more') probe(it, { kind: 'choice', i: 1 }, mcLess);
  if (kind === 'one') probe(it, { kind: 'choice', i: 1 }, 'mc.fraction-ops.fraction-factor-always-shrinks');
  return it;
};

// =====================================================================================================
// 10. why it shrinks or grows [explain-scaling]
const explain: Gen = (R, n) => {
  const d = int(R, 3, 9), c = int(R, 1, d - 1);
  const kind = pick(R, ['less', 'less', 'more', 'one'] as const);
  const md = int(R, 3, 8), mn = kind === 'less' ? int(R, 1, md - 1) : kind === 'more' ? int(R, md + 1, 2 * md - 1) : md;
  const m = fr(mn, md), g = fr(c, d);
  const head = kind === 'less' ? `less than ${g}` : kind === 'more' ? `more than ${g}` : `equal to ${g}`;
  const rightT = kind === 'less' ? `${m} means ${mn} of ${md} equal parts of ${g}: that is less than all ${md} parts.`
    : kind === 'more' ? `${m} is all of ${g} (${md} of ${md} parts) plus ${mn - md} more part${mn - md > 1 ? 's' : ''}.`
      : `${m} is 1 whole: one whole ${g} is ${g}.`;
  const o = options(R, [
    { t: rightT, ok: true, say: `Yes: that reason works for every positive number, not just this one.` },
    { t: `I tried ${fr(1, 2)} × ${fr(1, 2)} = ${fr(1, 4)} and ${fr(2, 3)} × 6 = 4, so it always works.`, say: `Two examples that work are not a reason: a reason must say why it is true for EVERY number.`, mc: 'mc.reasoning-language.examples-as-proof' },
    { t: kind === 'less' ? `Multiplying by a fraction always makes a number smaller.` : `It should be smaller: multiplying by a fraction always shrinks.`, say: kind === 'less' ? `Not always: ${fr(5, 4)} × ${g} is MORE than ${g}. It depends on whether ${m} is less than 1.` : `A fraction can be 1 or more: ${m} is ${kind === 'more' ? 'more than' : 'equal to'} 1.`, mc: 'mc.fraction-ops.fraction-factor-always-shrinks' },
    { t: `You can't really multiply by ${m}: multiplying means making copies.`, say: `Multiplying by ${m} means taking ${m} of it. Copies are only the whole-number case.`, mc: 'mc.fraction-ops.multiplication-only-as-copies' },
  ]);
  return { id: `ex-${n}`, family: 'explain', prompt: `Why is ${S(`${m} × ${g}`)} ${head}? Pick the best reason.`, board: `${dfrac(mn, md)} \\times ${dfrac(c, d)} ${kind === 'less' ? '<' : kind === 'more' ? '>' : '='} ${dfrac(c, d)}`, input: 'choice', choices: o.choices,
    solution: [`Compare the multiplier ${m} with 1.`, rightT], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
};

// =====================================================================================================
// 11. word problems with a size check [apply-context]
const story: Gen = (R, n) => {
  const who = pick(R, WHO);
  const kind = pick(R, ['recipe', 'left', 'ribbon', 'garden', 'bigRecipe', 'improper'] as const);
  let a: number, b: number, c: number, d: number, text: string, unit: string;
  if (kind === 'recipe') { d = pick(R, [2, 3, 4]); c = int(R, 1, d - 1); b = pick(R, [2, 3, 4]); a = int(R, 1, b - 1); text = `A recipe uses ${A(`${fr(c, d)} cup of flour`)}. ${who} makes ${B(`${fr(a, b)} of the recipe`)}. How much flour does ${who} use?`; unit = 'cup'; }
  else if (kind === 'left') { d = int(R, 3, 6); c = int(R, 1, d - 1); b = int(R, 2, 4); a = int(R, 1, b - 1); text = `${A(`${fr(c, d)} of a pan of brownies`)} is left. ${who} takes ${B(`${fr(a, b)} of what is left`)}. What part of the whole pan does ${who} take?`; unit = 'of the pan'; }
  else if (kind === 'ribbon') { d = int(R, 2, 6); c = int(R, 1, d - 1); b = int(R, 2, 5); a = int(R, 1, b - 1); text = `${who} has ${A(`${fr(c, d)} yd of ribbon`)} and uses ${B(`${fr(a, b)} of it`)}. How many yards does ${who} use?`; unit = 'yd'; }
  else if (kind === 'garden') { d = int(R, 2, 6); c = int(R, 1, d - 1); b = int(R, 2, 5); a = int(R, 1, b - 1); text = `A garden bed is ${A(`${fr(c, d)} yd`)} long and ${B(`${fr(a, b)} yd`)} wide. What is its area?`; unit = 'sq yd'; }
  else if (kind === 'bigRecipe') { d = pick(R, [3, 4]); c = int(R, 1, d - 1); b = 2; a = 3; text = `A recipe uses ${A(`${fr(c, d)} cup of milk`)}. ${who} makes ${B(`1&#8202;${fr(1, 2)} times the recipe`)}. How much milk is that?`; unit = 'cups'; }
  else { d = 4; c = pick(R, [5, 7]); b = 3; a = int(R, 1, 2); text = `${who} has ${A(`${fr(c, d)} yd of rope`)} and uses ${B(`${fr(a, b)} of it`)}. How many yards does ${who} use?`; unit = 'yd'; }
  const N = a * c, D = b * d, bigger = a > b;
  const it: Item = {
    id: `st-${n}`, family: 'story', prompt: `${text} Then check: should the answer be more or less than ${fr(c, d)}?`, board: `${dfrac(a, b)} \\times ${dfrac(c, d)} = \\,?`, input: 'frac', unit,
    solution: [kind === 'garden' ? `Area = length × width = ${fr(c, d)} × ${fr(a, b)}.` : `“${a > b ? '1 1/2 times' : fr(a, b) + ' of'}” the amount: ${fr(a, b)} × ${fr(c, d)}.`, `${fr(`${a} × ${c}`, `${b} × ${d}`)} = ${gcd(N, D) > 1 || N > D ? `${fr(N, D)} = ${S(fracOrMixed(N, D))}` : S(fr(N, D))} ${N === D && unit === 'cups' ? 'cup' : unit}.`, `Size check: ${fr(a, b)} is ${bigger ? 'more' : 'less'} than 1, so the answer is ${bigger ? 'more' : 'less'} than ${fr(c, d)}. ✓`],
    answer: F(N, D),
    check: r => fracCheck(r, N, D, `Yes: ${fr(a, b)} × ${fr(c, d)} = ${fracOrMixed(N, D)} ${unit}, and it is ${bigger ? 'more' : 'less'} than ${fr(c, d)}, as it should be.`, [
      { v: [a, b], mc: 'mc.fraction-ops.fraction-given-instead-of-quantity', say: `${fr(a, b)} is the part that is used, not the amount. The amount is ${fr(a, b)} of ${fr(c, d)}: ${fracOrMixed(N, D)} ${unit}.` },
      { v: [b * c, a * d], mc: 'mc.mul-div.multiplication-bigger-and-division-smaller', say: `That divides by ${fr(a, b)}. Taking ${fr(a, b)} of an amount is multiplying, even when it makes the amount ${bigger ? 'bigger' : 'smaller'}: ${fracOrMixed(N, D)}.` },
      { v: [a * d + b * c, D], mc: 'mc.fraction-ops.reads-of-as-addition-or-subtraction', say: `That adds the two fractions. “${fr(a, b)} of” means ×: ${fracOrMixed(N, D)}.` },
    ], `${fr(a, b)} × ${fr(c, d)} = ${fracOrMixed(N, D)} ${unit}.`),
  };
  if (!same([N, D], a, b)) probe(it, F(a, b), 'mc.fraction-ops.fraction-given-instead-of-quantity');
  return it;
};

// =====================================================================================================
// 12. perimeter and area of one rectangle [rectangle-perimeter-area-rational]
const SIDES_MIXED: readonly [number, number, number][] = [[1, 1, 2], [2, 1, 2], [3, 1, 2], [1, 2, 3], [2, 1, 3], [1, 3, 4], [2, 1, 4], [1, 1, 4]];
const SIDES_PROPER: readonly [number, number][] = [[3, 4], [2, 3], [1, 2], [4, 5], [5, 6], [3, 8]];
const rect: Gen = (R, n) => {
  const u = pick(R, ['ft', 'yd'] as const);
  const mode = pick(R, ['P', 'A', 'A', 'P', 'units', 'dec'] as const);
  if (mode === 'dec') {
    const L = pick(R, [4.5, 2.5, 3.5, 6.5, 1.5]), Wd = int(R, 2, 5), askP = R() < 0.5;
    const v = askP ? 2 * (L + Wd) : L * Wd;
    const it: Item = { id: `re-d-${n}`, family: 'rect', prompt: `A rectangle is ${A(`${L} m`)} by ${B(`${Wd} m`)}. What is its ${askP ? 'perimeter' : 'area'}?`, board: askP ? `P = 2 \\times (${L} + ${Wd})` : `A = ${L} \\times ${Wd}`, input: 'num', unit: askP ? 'm' : 'sq m',
      solution: askP ? [`Perimeter: all the way round, P = 2 × (length + width).`, `P = 2 × (${L} + ${Wd}) = 2 × ${L + Wd} = ${S(`${v} m`)}.`] : [`Area of a rectangle: A = length × width.`, `A = ${L} × ${Wd} = ${S(`${v} sq m`)}.`], answer: { kind: 'num', v },
      check: r => {
        if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number (a decimal point is fine).' };
        if (Math.abs(r.v - v) < 1e-9) return { ok: true, say: `Yes: ${v} ${askP ? 'm' : 'sq m'}.` };
        if (askP && Math.abs(r.v - (L + Wd)) < 1e-9) return { ok: false, mc: 'mc.area-perimeter.rectangle-perimeter-length-plus-width', say: `${L + Wd} m goes only halfway round. The perimeter has two lengths and two widths: ${v} m.` };
        if (askP && Math.abs(r.v - L * Wd) < 1e-9) return { ok: false, say: `That is the area. Perimeter is the distance around: 2 × (${L} + ${Wd}) = ${v} m.` };
        return { ok: false, say: askP ? `P = 2 × (${L} + ${Wd}) = ${v} m.` : `A = ${L} × ${Wd} = ${v} sq m.` };
      } };
    if (askP) probe(it, { kind: 'num', v: L + Wd }, 'mc.area-perimeter.rectangle-perimeter-length-plus-width');
    return it;
  }
  const [w1, n1, d1] = pick(R, SIDES_MIXED);
  const twoMixed = R() < 0.35;
  const [w2, n2, d2] = twoMixed ? pick(R, SIDES_MIXED.filter(s => s[2] !== d1 || s[0] !== w1)) : [0, ...pick(R, SIDES_PROPER)] as [number, number, number];
  const ln = w1 * d1 + n1, ld = d1, wn = w2 * d2 + n2, wd = d2;
  const L = `${w1}&#8202;${fr(n1, d1)} ${u}`, Wh = `${w2 ? `${w2}&#8202;` : ''}${fr(n2, d2)} ${u}`;
  const LT = mixTex(w1, n1, d1), WT = w2 ? mixTex(w2, n2, d2) : dfrac(n2, d2);
  const PN = 2 * (ln * wd + wn * ld), PD = ld * wd, AN = ln * wn, AD = ld * wd;
  if (mode === 'units') {
    const o = options(R, [
      { t: `P = ${fracOrMixed(PN, PD)} ${u}, A = ${fracOrMixed(AN, AD)} sq ${u}`, ok: true, say: `Yes: a perimeter is a length (${u}), an area is a count of squares (sq ${u}).` },
      { t: `P = ${fracOrMixed(PN, PD)} sq ${u}, A = ${fracOrMixed(AN, AD)} ${u}`, say: `Switched: the perimeter is a distance around, in ${u}; the area counts squares, in sq ${u}.`, mc: 'mc.measurement-units.wrong-unit-dimension' },
      { t: `P = ${fracOrMixed(PN / 2, PD)} ${u}, A = ${fracOrMixed(AN, AD)} sq ${u}`, say: `${fracOrMixed(PN / 2, PD)} ${u} is one length plus one width: only halfway round.`, mc: 'mc.area-perimeter.rectangle-perimeter-length-plus-width' },
    ]);
    return { id: `re-u-${n}`, family: 'rect', prompt: `A rectangle is ${A(L)} by ${B(Wh)}. Which is right?`, board: `${LT}\\text{ ${u}} \\times ${WT}\\text{ ${u}}`, input: 'choice', choices: o.choices,
      solution: [`P = 2 × (${L} + ${Wh}) = ${fracOrMixed(PN, PD)} ${u}.`, `A = ${fr(ln, ld)} × ${fr(wn, wd)} = ${fracOrMixed(AN, AD)} sq ${u}.`], answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
  }
  if (mode === 'P') {
    const it: Item = { id: `re-p-${n}`, family: 'rect', prompt: `A rectangle is ${A(L)} long and ${B(Wh)} wide. What is its perimeter?`, board: `P = 2 \\times (${LT} + ${WT})`, input: 'frac', unit: u,
      solution: [`P = 2 × (length + width).`, `${L} + ${Wh} = ${fracOrMixed(PN / 2, PD)} ${u}.`, `2 × ${fracOrMixed(PN / 2, PD)} = ${S(`${fracOrMixed(PN, PD)} ${u}`)}.`], answer: F(PN, PD),
      check: r => fracCheck(r, PN, PD, `Yes: ${fracOrMixed(PN, PD)} ${u} all the way round.`, [
        { v: [PN / 2, PD], mc: 'mc.area-perimeter.rectangle-perimeter-length-plus-width', say: `That is one length plus one width, halfway round. Double it: ${fracOrMixed(PN, PD)} ${u}.` },
        { v: [AN, AD], say: `That is the area. Perimeter is the distance around: ${fracOrMixed(PN, PD)} ${u}.` },
      ], `P = 2 × (${L} + ${Wh}) = ${fracOrMixed(PN, PD)} ${u}.`) };
    probe(it, F(PN / 2, PD), 'mc.area-perimeter.rectangle-perimeter-length-plus-width');
    return it;
  }
  const fl = w1 * w2 * d1 * d2 + n1 * n2; // firsts and lasts only: w1*w2 + (n1/d1)(n2/d2), over d1*d2
  const it: Item = { id: `re-a-${n}`, family: 'rect', prompt: `A rectangle is ${A(L)} long and ${B(Wh)} wide. What is its area?`, board: `A = ${LT} \\times ${WT}`, input: 'frac', unit: `sq ${u}`,
    solution: [`Write the sides as fractions: ${fr(ln, ld)} × ${fr(wn, wd)}.`, `${fr(`${ln} × ${wn}`, `${ld} × ${wd}`)} = ${gcd(AN, AD) > 1 || AN > AD ? `${fr(AN, AD)} = ${S(fracOrMixed(AN, AD))}` : S(fr(AN, AD))} sq ${u}.`, `Size check: between ${w1} × ${w2 || 0} and ${w1 + 1} × ${w2 + 1} sq ${u}.`], answer: F(AN, AD),
    check: r => fracCheck(r, AN, AD, `Yes: ${fracOrMixed(AN, AD)} sq ${u}.`, [
      { v: [fl, d1 * d2], mc: 'mc.quadratic-polynomial.firsts-and-lasts-only', say: `Wholes × wholes plus parts × parts misses the cross parts. Convert: ${fr(ln, ld)} × ${fr(wn, wd)} = ${fracOrMixed(AN, AD)} sq ${u}.` },
      { v: [PN, PD], say: `That is the perimeter. Area = length × width = ${fracOrMixed(AN, AD)} sq ${u}.` },
    ], `A = ${fr(ln, ld)} × ${fr(wn, wd)} = ${fracOrMixed(AN, AD)} sq ${u}.`) };
  if (!same([AN, AD], fl, d1 * d2)) probe(it, F(fl, d1 * d2), 'mc.quadratic-polynomial.firsts-and-lasts-only');
  return it;
};

/** a choice item's solution ends on the right choice ("So: …" when no step names it): the steps card reads it from there */
const endsOnChoice = (g: Gen): Gen => (R, n, sg) => {
  const it = g(R, n, sg);
  if (it.input === 'choice' && it.answer.kind === 'choice') it.solution = endOnChoice(it.solution, it.choices![it.answer.i]!);
  return it;
};
const GENS0: Record<FamilyId, Gen> = { ofWhole, areaRead, equation, rule, tiles, compute, simplify, cancel, predict, explain, story, rect };
export const GENS = Object.fromEntries(Object.entries(GENS0).map(([k, g]) => [k, endsOnChoice(g)])) as Record<FamilyId, Gen>;
