// famB.ts: stage-2 families of "Counting" (sub-goals 6-19): the product and sum principles, n^r, falling products,
// factorials, P(n,r) and C(n,r) with cancelling, combinations as ordered count ÷ r!, the symmetry C(n,r) = C(n,n-r),
// separate groups, restricted positions first, complements, choosing the method, and probabilities from matching
// counts. Pure: no DOM.
import { type Gen, type Opt, CALC, MC, ans, andList, choice, fracItem, int, numItem, people, pick, until } from './common';
import type { CItem } from './common';
import { C, P, fact, falling, fmtN, lowest, pow, prodH, texN, word } from './count';
import type { CPic, Slot } from './CountPic';

const slotsPic = (rows: { slots: Slot[]; caption?: string }[], o: { div?: Slot[]; op?: '+' | '−' | ''; title?: string } = {}): CPic => ({ kind: 'slots', rows, ...o });
const fr = (n: number, d: number) => { const [a, b] = lowest(n, d); return `${fmtN(a)}/${fmtN(b)}`; };

// ===================== product-principle =====================
interface Stage { many: string; role: string; /** a realistic most */ max?: number }
const MENUS: { what: string; intro: string; stages: Stage[] }[] = [
  { what: 'lunch specials', intro: 'A diner\'s lunch special is one item from each course.', stages: [{ many: 'starters', role: 'starter' }, { many: 'entrees', role: 'entree' }, { many: 'desserts', role: 'dessert' }, { many: 'drinks', role: 'drink' }] },
  { what: 'cars', intro: 'A car maker builds each car with one choice from each option list.', stages: [{ many: 'paint colors', role: 'color' }, { many: 'trim levels', role: 'trim', max: 5 }, { many: 'wheel styles', role: 'wheels' }, { many: 'seat fabrics', role: 'seats' }] },
  { what: 'outfits', intro: 'An outfit is one item from each pile.', stages: [{ many: 'shirts', role: 'shirt' }, { many: 'pairs of pants', role: 'pants' }, { many: 'pairs of shoes', role: 'shoes' }, { many: 'hats', role: 'hat' }] },
  { what: 'phones', intro: 'A phone is ordered with one choice from each list.', stages: [{ many: 'colors', role: 'color' }, { many: 'storage sizes', role: 'storage', max: 4 }, { many: 'case styles', role: 'case' }] },
];
export const menu: Gen = (R, n0) => {
  const m = pick(R, MENUS), k = int(R, 2, Math.min(4, m.stages.length)), calc = R() < 0.25;
  const sizes = until(() => m.stages.slice(0, k).map(st => Math.min(st.max ?? 99, calc ? int(R, 6, 15) : int(R, 2, 9))), s => (!calc || s.some(x => x > 10)) && s.reduce((a, b) => a + b, 0) !== s.reduce((a, b) => a * b, 1));
  const st = m.stages.slice(0, k), v = sizes.reduce((a, b) => a * b, 1), sum = sizes.reduce((a, b) => a + b, 0), some = sizes.slice(0, -1).reduce((a, b) => a * b, 1);
  return numItem({
    id: `menu-${n0}`, family: 'menu',
    prompt: `${m.intro} There are ${andList(st.map((s, i) => `${sizes[i]} ${s.many}`))}. How many different ${m.what} are possible?${calc ? CALC : ''}`,
    board: `\\text{${m.what}} = \\,?`, unit: m.what,
    picture: { pics: [slotsPic([{ slots: st.map((s, i) => ({ role: s.role, n: sizes[i] })) }])] },
    solution: [`One slot per choice; every ${st[0]!.role} goes with every ${st[1]!.role}${k > 2 ? ', and so on' : ''}: the tree has the same number of branches at each stage.`, `${prodH(sizes)} = ${ans(fmtN(v))} ${m.what}.`],
  }, v, `Yes: ${prodH(sizes)} = ${fmtN(v)}.`,
  [[sum, MC.addStages, `${sum} adds the options. But each ${st[0]!.role} combines with every ${st[1]!.role}: multiply.`], ...(k > 2 ? [[some, MC.someStages, `${fmtN(some)} leaves out the last list (${st[k - 1]!.many}). Every stage is a factor.`] as [number, string, string]] : [])],
  `Multiply the number of options at each stage.`);
};
export const productMissing: Gen = (R, n0) => {
  const a = int(R, 2, 6), b = int(R, 3, 8), c = int(R, 2, 9), total = a * b * c;
  return numItem({
    id: `productMissing-${n0}`, family: 'productMissing',
    prompt: `A sandwich shop advertises <b>${total}</b> different sandwiches, each made with one bread, one meat and one cheese. It has ${a} breads and ${b} meats. How many cheeses does it have?`,
    board: `${a} \\times ${b} \\times \\,? = ${texN(total)}`, unit: 'cheeses',
    picture: { pics: [slotsPic([{ slots: [{ role: 'bread', n: a }, { role: 'meat', n: b }, { role: 'cheese', reveal: c }] }])] },
    solution: [`The count is a product: breads × meats × cheeses = ${total}.`, `${a} × ${b} = ${a * b}, so cheeses = ${total} ÷ ${a * b} = ${ans(c)}.`],
  }, c, `Yes: ${a} × ${b} × ${c} = ${total}.`,
  [[total - a - b, MC.addStages, `Subtracting treats the stages as if they add up. The ${total} sandwiches are a product: ${a} × ${b} × ? = ${total}.`]],
  `${a} × ${b} × (cheeses) = ${total}. Divide.`);
};

// ===================== sum-principle =====================
const HOT = ['chili', 'soup', 'pasta', 'curry', 'tacos'], COLD = ['salad', 'wrap', 'sushi', 'poke'];
export const orAnd: Gen = (R, n0) => {
  const [h, c] = until(() => [int(R, 2, 5), int(R, 2, 4)] as const, ([h, c]) => h + c !== h * c);
  const or = R() < 0.55, v = or ? h + c : h * c;
  return numItem({
    id: `orAnd-${n0}`, family: 'orAnd',
    prompt: or
      ? `The cafeteria line has ${h} hot dishes and ${c} cold dishes (shown). Today you may take <b>exactly one</b> dish: a hot one <b>or</b> a cold one. How many different choices do you have?`
      : `The cafeteria line has ${h} hot dishes and ${c} cold dishes (shown). The combo is one hot dish <b>and</b> one cold dish. How many different combos are there?`,
    board: or ? `\\text{hot OR cold}` : `\\text{hot AND cold}`, unit: or ? 'choices' : 'combos',
    picture: { pics: [{ kind: 'grid', rows: [{ label: 'hot', chips: HOT.slice(0, h) }, { label: 'cold', chips: COLD.slice(0, c) }] }] },
    solution: or ? [`You take one dish, from one of two lists that do not overlap: the cases add.`, `${h} + ${c} = ${ans(v)} choices.`]
      : [`You take a hot dish AND a cold dish: two stages, every hot one goes with every cold one.`, `${h} × ${c} = ${ans(v)} combos.`],
  }, v, or ? `Yes: ${h} + ${c} = ${v}. One dish from one list or the other: add.` : `Yes: ${h} × ${c} = ${v}. Two stages: multiply.`,
  [[or ? h * c : h + c, or ? MC.multAlt : MC.addStages, or ? `${h * c} would be pairs of dishes. You take only one dish, so the two lists add.` : `${h + c} counts single dishes. A combo has one of each: every hot dish goes with every cold one.`]],
  or ? 'One dish from either list: add the lists.' : 'One from each list: multiply.');
};
export const codeLengths: Gen = (R, n0) => {
  const v = int(R, 0, 2), [l1, l2] = pick(R, [[2, 3], [1, 2], [2, 3], [3, 4]] as const);
  const SYM = ['▲', '■', '●', '★', '◆', '♥'];
  const k = v === 0 ? int(R, 3, 6) : v === 1 ? 10 : 26;
  const story = v === 0 ? `A game's cheat codes use the ${k} symbols ${SYM.slice(0, k).join(' ')} and are ${l1} or ${l2} symbols long (symbols may repeat).`
    : v === 1 ? `A door code is ${l1} or ${l2} digits long (0 to 9, digits may repeat, and a code may start with 0).`
      : `A gamer tag is ${l1} or ${l2} capital letters long (A to Z, letters may repeat).`;
  const a = pow(k, l1), b = pow(k, l2), sum = a + b;
  const unit = v === 0 ? 'symbols' : v === 1 ? 'digits' : 'letters';
  return numItem({
    id: `codeLengths-${n0}`, family: 'codeLengths',
    prompt: `${story} How many codes are possible?${v === 2 ? CALC : ''}`,
    board: `\\text{length ${l1} or ${l2}}`, unit: 'codes',
    picture: { pics: [slotsPic([1, 2].map(i => { const L = i === 1 ? l1 : l2; return { caption: `${L} ${L === 1 ? unit.slice(0, -1) : unit} long`, slots: Array.from({ length: L }, (_, j) => ({ role: `${j + 1}${['st', 'nd', 'rd', 'th'][j]}`, n: k })) }; }), { op: '+' })] },
    solution: [`Split into cases by length; a code has one length, so the cases do not overlap and add.`, `${l1} long: ${k}${l1 > 1 ? `<sup>${l1}</sup>` : ''} = ${fmtN(a)}. ${l2} long: ${k}<sup>${l2}</sup> = ${fmtN(b)}.`, `${fmtN(a)} + ${fmtN(b)} = ${ans(fmtN(sum))} codes.`],
  }, sum, `Yes: ${fmtN(a)} + ${fmtN(b)} = ${fmtN(sum)}.`,
  [[a * b, MC.multAlt, `Multiplying the cases counts pairs of codes. Each code is ${l1} long OR ${l2} long: add the cases.`],
   [b, MC.incomplete, `${fmtN(b)} counts only the ${l2}-long codes. The ${l1}-long ones count too.`]],
  `Count each length separately, then add.`);
};

// ===================== ordered-with-repetition =====================
export const pinCount: Gen = (R, n0) => {
  const v = int(R, 0, 3);
  let n: number, r: number, story: string, unit: string, calc = false, role = 'digit';
  if (v === 0) { n = 10; r = pick(R, [3, 4]); story = `A phone PIN is ${r} digits (0 to 9). Digits may repeat.`; unit = 'PINs'; }
  else if (v === 1) { n = 2; r = int(R, 5, 6); story = `A teacher writes the answer key for a ${r}-question true/false quiz.`; unit = 'answer keys'; role = 'Q'; }
  else if (v === 2) { n = int(R, 3, 9); r = until(() => int(R, 2, 4), rr => rr !== n && !(n === 2 && rr === 4)); story = `A code is ${r} letters long, made from the ${n} letters A to ${'ABCDEFGHI'[n - 1]}. Letters may repeat.`; unit = 'codes'; role = 'letter'; }
  else { n = 26; r = 3; story = 'A license plate starts with 3 capital letters (A to Z). Letters may repeat.'; unit = 'letter parts'; calc = true; role = 'letter'; }
  const val = pow(n, r);
  return numItem({
    id: `pinCount-${n0}`, family: 'pinCount',
    prompt: `${story} How many different ${unit} are possible?${calc ? CALC : ''}`,
    board: `\\text{${unit}} = \\,?`, unit,
    picture: { pics: [slotsPic([{ slots: Array.from({ length: r }, (_, i) => ({ role: role === 'Q' ? `Q${i + 1}` : `${role} ${i + 1}`, reveal: n })) }])] },
    solution: [`Order matters and repeats are allowed: every slot has all ${n} options.`, `${Array(r).fill(n).join(' × ')} = ${n}<sup>${r}</sup> = ${ans(fmtN(val))}.`],
  }, val, `Yes: ${n}<sup>${r}</sup> = ${fmtN(val)}.`,
  [[n * r, MC.nTimesR, `${n} × ${r} adds up ${n} options ${r} times. Each slot multiplies: ${n}<sup>${r}</sup>.`],
   [pow(r, n), MC.swapNR, `${r}<sup>${n}</sup> swaps base and exponent. The base is the options per slot (${n}), the exponent the number of slots (${r}).`],
   [P(n, r), MC.repetition, `${fmtN(P(n, r))} takes an option away after each slot, but repeats are allowed here.`]],
  `One slot per position; how many options does each slot have?`);
};
export const codeVsNumeral: Gen = (R, n0) => {
  const m = int(R, 4, 9), L = m === 9 && R() < 0.4 ? 4 : 3, numeral = R() < 0.6;
  const codes = pow(m + 1, L), nums = m * pow(m + 1, L - 1);
  const v = numeral ? nums : codes;
  const ds = m === 9 ? '0 to 9' : `0 to ${m}`;
  return numItem({
    id: `codeVsNumeral-${n0}`, family: 'codeVsNumeral',
    prompt: numeral ? `How many ${L}-digit <b>numbers</b> can be written with the digits ${ds} (digits may repeat)? A ${L}-digit number cannot start with 0.`
      : `How many ${L}-digit <b>codes</b> can be made with the digits ${ds} (digits may repeat)? A code may start with 0, like ${'0'.repeat(L - 1)}${Math.min(m, 7)}.`,
    board: numeral ? `\\text{${L}-digit numbers}` : `\\text{${L}-digit codes}`, unit: numeral ? 'numbers' : 'codes',
    picture: { pics: [slotsPic([{ slots: Array.from({ length: L }, (_, i) => ({ role: `digit ${i + 1}`, reveal: numeral && i === 0 ? m : m + 1 })) }])] },
    solution: numeral ? [`The first digit cannot be 0: ${m} options. Every other digit: ${m + 1} options.`, `${m} × ${Array(L - 1).fill(m + 1).join(' × ')} = ${ans(fmtN(v))}.`]
      : [`A code may start with 0, so every digit has ${m + 1} options.`, `${Array(L).fill(m + 1).join(' × ')} = ${ans(fmtN(v))}.`],
  }, v, `Yes: ${fmtN(v)}.`,
  [[numeral ? codes : nums, numeral ? MC.restrict : undefined, numeral ? `${fmtN(codes)} counts codes like ${'0'.repeat(L - 1)}1 too. A number cannot start with 0: the first slot has ${m} options.` : `${fmtN(nums)} drops the codes that start with 0, but a code may start with 0.`]],
  numeral ? 'Fill the first digit first: it cannot be 0.' : 'Every digit has the same number of options.');
};

// ===================== ordered-without-repetition =====================
const ROLES: { intro: (n: number) => string; roles: string[]; long: string[]; what: string }[] = [
  { intro: n => `A club of ${n} members elects`, roles: ['pres.', 'VP', 'sec.', 'treas.'], long: ['a president', 'a vice president', 'a secretary', 'a treasurer'], what: 'ways' },
  { intro: n => `${word(n)[0]!.toUpperCase() + word(n).slice(1)} runners race in a final. The officials record`, roles: ['gold', 'silver', 'bronze'], long: ['the gold medalist', 'the silver medalist', 'the bronze medalist'], what: 'results' },
  { intro: n => `Kim picks songs from a list of ${n} (no song twice) for`, roles: ['1st', '2nd', '3rd', '4th'], long: ['the 1st song', 'the 2nd song', 'the 3rd song', 'the 4th song'], what: 'playlists' },
];
export const officers: Gen = (R, n0) => {
  const ctx = pick(R, ROLES), zero = ctx.what === 'ways' && R() < 0.12, calc = !zero && R() < 0.2;
  const r = zero ? 4 : int(R, 2, ctx.roles.length);
  const n = zero ? 3 : calc ? int(R, 11, 16) : int(R, Math.max(r + 1, 5), ctx.what === 'results' ? 12 : 10);
  const v = P(n, r);
  const roles = ctx.long.slice(0, r);
  const intro = ctx.what === 'results' && n > 12 ? `${n} runners race. The officials record` : ctx.intro(n);
  return numItem({
    id: `officers-${n0}`, family: 'officers',
    prompt: `${intro} ${andList(roles)}${ctx.what === 'ways' ? ', a different member for each office' : ''}. How many different ${ctx.what} are possible?${calc ? CALC : ''}`,
    board: `\\text{${ctx.what}} = \\,?`, unit: ctx.what,
    picture: { pics: [slotsPic([{ slots: ctx.roles.slice(0, r).map((role, i) => ({ role, reveal: Math.max(0, n - i) })) }])] },
    solution: zero ? [`Fill the offices one by one: ${falling(n, r).map(x => Math.max(0, x)).join(', ')} choices.`, `With only ${n} members, nobody is left for the 4th office: ${falling(n, r).map(x => Math.max(0, x)).join(' × ')} = ${ans(0)} ways.`]
      : [`Order matters (each place is different), and nobody is used twice: one fewer choice at each slot.`, `${prodH(falling(n, r))} = ${ans(fmtN(v))}.`],
  }, v, zero ? `Yes: 0. Four different offices need four different people, and there are only ${n}.` : `Yes: ${prodH(falling(n, r))} = ${fmtN(v)}.`,
  [[n * r, MC.nTimesR, `${n * r} is ${n} × ${r}. Fill the slots one by one: ${n}, then ${n - 1}${r > 2 ? ', then ...' : ''}, and multiply.`],
   [fact(n), MC.nFact, `${fmtN(fact(n))} = ${n}! puts all ${n} in order, but only ${r} places are filled. Stop after ${r} factors.`],
   [pow(n, r), MC.keepAll, `${fmtN(pow(n, r))} keeps ${n} choices in every slot, but someone already placed cannot be placed again.`]],
  `Slots: ${n} choices for the first place, then one fewer for each next place.`);
};
export const lineUp: Gen = (R, n0) => {
  const n = R() < 0.15 ? int(R, 8, 9) : int(R, 3, 7), calc = n >= 8;
  const v = fact(n), books = R() < 0.4;
  const names = books ? undefined : people(R, n);
  return numItem({
    id: `lineUp-${n0}`, family: 'lineUp',
    prompt: books ? `In how many different orders can ${word(n)} different books stand in a row on a shelf?${calc ? CALC : ''}` : `${andList(names!)} line up in a row for a photo. How many different orders are possible?${calc ? CALC : ''}`,
    board: `\\text{orders} = \\,?`, unit: 'orders',
    picture: books ? (n <= 6 ? { pics: [slotsPic([{ slots: Array.from({ length: n }, (_, i) => ({ role: `${i + 1}`, reveal: n - i })) }])] } : undefined) : { pics: [{ kind: 'tokens', names: names! }] },
    solution: [`Fill the places from left to right: ${n} choices, then ${n - 1}, and so on down to 1.`, `${prodH(falling(n, n))} = ${n}! = ${ans(fmtN(v))}.`],
  }, v, `Yes: ${n}! = ${fmtN(v)}.`,
  [[n * n, MC.square, `${n * n} is ${n} × ${n}. ${n}! means ${n} × ${n - 1} × ... × 1.`], [pow(n, n), MC.keepAll, `${fmtN(pow(n, n))} keeps ${n} choices in every place, but each ${books ? 'book' : 'person'} is placed once.`]],
  `${n} choices for the first place, then one fewer each time.`);
};

// ===================== factorial-notation =====================
export const factorialEval: Gen = (R, n0) => {
  const n = R() < 0.18 ? pick(R, [0, 1]) : R() < 0.15 ? int(R, 8, 10) : int(R, 2, 7);
  const v = fact(n);
  return numItem({
    id: `factorialEval-${n0}`, family: 'factorialEval',
    prompt: n === 0 ? pick(R, [`What is 0! ? (Think: in how many ways can you arrange zero objects?)`, `What is the value of 0! (zero factorial)?`]) : pick(R, [`Evaluate ${n}!${n >= 8 ? CALC : ''}`, `What is ${n}! (${word(n)} factorial)?${n >= 8 ? CALC : ''}`, `Write ${n}! as a single number.${n >= 8 ? CALC : ''}`]),
    board: `${n}! = \\,?`, unit: '',
    solution: n === 0 ? [`n! counts the ways to arrange n objects. There is exactly one way to arrange nothing: leave the shelf empty.`, `So 0! = ${ans(1)}. (It also keeps n! = n × (n − 1)! true: 1! = 1 × 0!.)`]
      : n === 1 ? [`One object has one arrangement.`, `1! = ${ans(1)}.`] : [`${n}! = ${prodH(falling(n, n))}.`, `= ${ans(fmtN(v))}.`],
  }, v, `Yes: ${n}! = ${fmtN(v)}.`,
  [...(n === 0 ? [[0, MC.emptyZero, `0! is not 0: there is exactly one way to arrange nothing, so 0! = 1.`] as [number, string, string]] : []),
   ...(n >= 2 ? [[n * n, MC.square, `${n * n} is ${n} × ${n}. ${n}! multiplies ${n} × ${n - 1} × ... × 1.`] as [number, string, string]] : [])],
  `n! = n × (n − 1) × ... × 1, and 0! = 1.`);
};
export const factorialMeaning: Gen = (R, n0) => {
  const n = int(R, 4, 7), v = fact(n);
  const thing = pick(R, ['different books stand in a row on a shelf', 'runners can finish a race (no ties)', 'different songs can be played in a row', 'friends can line up at a ticket window', 'different trophies can stand in a row in a case', 'dogs can finish a race (no ties)']);
  return choice(R, {
    id: `factorialMeaning-${n0}`, family: 'factorialMeaning',
    prompt: `Which expression counts the ways ${word(n)} ${thing}?`,
    board: `\\text{arrangements of } ${n}`,
    solution: [`All ${n} places are filled, one fewer choice each time: ${prodH(falling(n, n))}.`, `That falling product is ${n}! = ${fmtN(v)}.`, `So: ${ans(`${n}!`)}`],
  }, [
    { t: `${n}!`, ok: true, key: v, say: `Yes: ${n}! = ${prodH(falling(n, n))} = ${fmtN(v)}.` },
    { t: `${n}<sup>2</sup>`, key: n * n, mc: MC.square, say: `${n}² = ${n * n} multiplies ${n} by itself. The choices go down by one each place.` },
    { t: `${n}<sup>${n}</sup>`, key: pow(n, n), mc: MC.keepAll, say: `${n}<sup>${n}</sup> keeps ${n} choices for every place, but each one is used once.` },
    { t: `${n} × ${n - 1}`, key: n * (n - 1), mc: MC.nFact, say: `${n} × ${n - 1} fills only two places. All ${n} places are filled.` },
  ]);
};

// ===================== permutation-formula =====================
export const permFormula: Gen = (R, n0) => {
  const n = int(R, 4, 9), r = pick(R, [0, 1, 2, 3, 3, n]);
  const v = P(n, r);
  return numItem({
    id: `permFormula-${n0}`, family: 'permFormula',
    prompt: `Evaluate P(${n}, ${r}) = ${n}! / (${n} − ${r})!, the number of ordered selections of ${r} from ${n}.`,
    board: `P(${n},${r}) = \\dfrac{${n}!}{(${n}-${r})!}`, unit: '',
    solution: r === 0 ? [`(${n} − 0)! = ${n}!, so the quotient is ${n}!/${n}! = 1.`, `There is one way to choose nothing: P(${n}, 0) = ${ans(1)}.`]
      : r === n ? [`(${n} − ${n})! = 0! = 1, so P(${n}, ${n}) = ${n}! / 1.`, `${prodH(falling(n, n))} = ${ans(fmtN(v))}.`]
        : [`Cancel the common tail: ${n}! / ${n - r}! = ${prodH(falling(n, r))} (the factors ${n - r} × ... × 1 cancel).`, `${prodH(falling(n, r))} = ${ans(fmtN(v))}.`],
  }, v, `Yes: P(${n}, ${r}) = ${fmtN(v)}.`,
  [[C(n, r), MC.extraFact, `${fmtN(C(n, r))} also divides by ${r}!. That counts groups; P(n, r) counts ordered selections, so no extra ÷ ${r}!.`],
   [0, MC.emptyZero, r === 0 ? `Choosing nothing can be done in exactly one way, so P(${n}, 0) = 1.` : `0! = 1, not 0, so nothing in the formula is zero.`],
   [n * r, MC.nTimesR, `${n * r} is ${n} × ${r}. After cancelling, P(${n}, ${r}) is the falling product ${prodH(falling(n, r)) || '1'}.`]],
  `Cancel (n − r)! from n!: what is left is n × (n − 1) × ... with r factors.`);
};
export const permCancel: Gen = (R, n0) => {
  const n = int(R, 7, 12), k = int(R, 2, Math.min(4, n - 3)), m = n - k;
  const f = (xs: number[]) => xs.join(' × ');
  return choice(R, {
    id: `permCancel-${n0}`, family: 'permCancel',
    prompt: `After cancelling the common factors, which product equals ${n}! / ${m}! ?`,
    board: `\\dfrac{${n}!}{${m}!} = \\,?`,
    solution: [`${n}! = ${f(falling(n, k))} × ${m}!, so the ${m}! cancels.`, `What is left: ${ans(f(falling(n, k)))} (${k} factors).`],
  }, [
    { t: f(falling(n, k)), ok: true, key: P(n, k), say: `Yes: the ${m}! cancels and ${k} factors are left.` },
    { t: f(falling(n, k + 1)), key: P(n, k + 1), say: `That keeps ${m} as a factor too, but ${m} is part of ${m}! and cancels.` },
    { t: f(falling(n, k - 1)), key: P(n, k - 1), say: `That cancels one factor too many: ${n}! / ${m}! keeps ${n} down to ${m + 1}, which is ${k} factors.` },
    { t: `${k}! = ${f(falling(k, k))}`, key: fact(k), say: `Factorials do not subtract: ${n}!/${m}! is not (${n} − ${m})!. Write ${n}! out until ${m}! appears, then cancel.` },
  ]);
};

// ===================== combinations-as-division =====================
export const groupsDivide: Gen = (R, n0) => {
  const r = int(R, 2, 4), n = int(R, r + 2, r === 4 ? 10 : 9);
  const pr = P(n, r), v = C(n, r);
  const roles = ['a president', 'a vice president', 'a secretary', 'a treasurer'].slice(0, r), short = ['pres.', 'VP', 'sec.', 'treas.'];
  return numItem({
    id: `groupsDivide-${n0}`, family: 'groupsDivide',
    prompt: `There are ${fmtN(pr)} ways to elect ${andList(roles)} from the ${n} members of a club (one office each). How many ways are there to choose a ${r}-person committee (no roles) from the same ${n} members?`,
    board: `\\dfrac{${texN(pr)}}{${r}!} = \\,?`, unit: 'committees',
    picture: { pics: [slotsPic([{ slots: short.slice(0, r).map((role, i) => ({ role, n: n - i })) }], { div: Array.from({ length: r }, (_, i) => ({ role: `${i + 1}${['st', 'nd', 'rd', 'th'][i]}`, reveal: r - i })) })] },
    solution: [`Every committee of ${r} can fill the ${r} offices in ${r}! = ${prodH(falling(r, r))} = ${fact(r)} ways, so each committee appears ${fact(r)} times among the ${fmtN(pr)} slates.`,
      `${fmtN(pr)} ÷ ${fact(r)} = ${ans(fmtN(v))} committees.`],
  }, v, `Yes: ${fmtN(pr)} ÷ ${r}! = ${fmtN(v)}.`,
  [[pr / r, MC.divByR, `Dividing by ${r} is not enough: one committee fills the offices in ${r}! = ${fact(r)} different orders.`],
   [pr, MC.ordersDiff, `${fmtN(pr)} counts each committee once for every way to hand out the offices. Without roles, those are the same committee.`]],
  `How many times does each committee appear among the ordered slates? Divide by that.`);
};
export const handshakes: Gen = (R, n0) => {
  const n = int(R, 4, 12), games = R() < 0.4;
  const v = C(n, 2), names = 'ABCDEFGHIJKL'.slice(0, n).split('');
  return numItem({
    id: `handshakes-${n0}`, family: 'handshakes',
    prompt: games ? `In a league of ${n} teams (A to ${names[n - 1]}), every team plays every other team exactly once. How many games are played?`
      : `At a meeting, each of ${n} people shakes hands once with every other person. How many handshakes are there?`,
    board: games ? `\\text{games} = \\,?` : `\\text{handshakes} = \\,?`, unit: games ? 'games' : 'handshakes',
    picture: { pics: [{ kind: 'tokens', names: games ? names : people(R, n) }] },
    solution: [`Each of the ${n} meets the other ${n - 1}: ${n} × ${n - 1} = ${n * (n - 1)}, but that counts each ${games ? 'game' : 'handshake'} twice (once from each side).`, `${n * (n - 1)} ÷ 2 = ${ans(v)} = C(${n}, 2).`],
  }, v, `Yes: ${n} × ${n - 1} ÷ 2 = ${v}.`,
  [[n * (n - 1), MC.ordersDiff, `${n * (n - 1)} counts A-with-B and B-with-A as two. It is one ${games ? 'game' : 'handshake'}: divide by 2.`], [n * n, undefined, `${n * n} includes everyone meeting themselves, and counts each pair twice.`]],
  `Count from each person's side, then fix the double count.`);
};
export const overcountFactor: Gen = (R, n0) => {
  const r = int(R, 3, 4), n = int(R, r + 3, 10), names = people(R, r);
  const roles = ['president', 'vice president', 'secretary', 'treasurer'].slice(0, r);
  return numItem({
    id: `overcountFactor-${n0}`, family: 'overcountFactor',
    prompt: `A club of ${n} lists every way to fill its ${r} offices (${andList(roles)}), one member per office. In how many of those lists do exactly ${andList(names)} hold the ${r} offices?`,
    board: `\\text{orders} = \\,?`, unit: 'lists',
    picture: { pics: [{ kind: 'tokens', names }] },
    solution: [`The same ${r} people can share out the ${r} offices in any order: ${r} choices for president, then ${r - 1}, ...`, `${prodH(falling(r, r))} = ${r}! = ${ans(fact(r))} lists.`],
  }, fact(r), `Yes: ${r}! = ${fact(r)}. That is why the committee count divides by ${r}!.`,
  [[r, MC.divByR, `${r} counts the people, not their orders. ${r} people can hold ${r} offices in ${r}! = ${fact(r)} ways.`]],
  `How many ways can these ${r} people share out the ${r} offices?`);
};

// ===================== combination-formula =====================
const HAND: [number, number][] = [[5, 2], [6, 2], [6, 3], [7, 2], [7, 3], [8, 2], [8, 3], [8, 4], [9, 2], [9, 3], [9, 4], [10, 2], [10, 3], [10, 4], [6, 4], [7, 4]];
const BIG: [number, number][] = [[15, 4], [15, 5], [20, 3], [20, 4], [20, 6], [25, 3], [25, 5], [30, 4], [52, 5], [40, 5]];
export const combEval: Gen = (R, n0) => {
  const u = R(), calc = u < 0.2, edge = !calc && u < 0.3;
  const [n, r] = calc ? pick(R, BIG) : edge ? ((): [number, number] => { const nn = int(R, 4, 9); return [nn, pick(R, [0, nn])]; })() : pick(R, HAND);
  const v = C(n, r), pr = P(n, r);
  const form = pick(R, ['C', 'nCr', 'binom'] as const);
  const name = form === 'C' ? `C(${n}, ${r})` : form === 'nCr' ? `${n}C${r}` : `the binomial coefficient (${n} choose ${r})`;
  const tex = form === 'binom' ? `\\binom{${n}}{${r}}` : form === 'nCr' ? `{}_{${n}}C_{${r}}` : `C(${n},${r})`;
  return numItem({
    id: `combEval-${n0}`, family: 'combEval',
    prompt: `Evaluate ${name} = ${n}! / (${r}! · (${n} − ${r})!).${calc ? CALC : ''}`,
    board: `${tex} = \\,?`, unit: '',
    solution: r === 0 || r === n ? [`${n}! / (${r}! · ${n - r}!) = ${n}! / ${n}! because 0! = 1.`, `There is one way to choose ${r === 0 ? 'nobody' : 'everybody'}: ${ans(1)}.`]
      : [`Cancel (${n} − ${r})! = ${n - r}!: ${n}! / ${n - r}! = ${prodH(falling(n, r))} = ${fmtN(pr)}.`, `Divide by ${r}! = ${fact(r)}: ${fmtN(pr)} ÷ ${fact(r)} = ${ans(fmtN(v))}.`],
  }, v, `Yes: ${fmtN(v)}.`,
  [[pr, MC.missFact, `${fmtN(pr)} is ${n}!/${n - r}!: the ${r}! in the denominator is missing.`], [pr / r, MC.divByR, `Dividing by ${r} is not enough: divide by ${r}! = ${fact(r)}.`], [0, MC.emptyZero, `0! = 1, so the formula gives 1 here: there is one way.`]],
  `Cancel (n − r)! first, then divide what is left by r!.`);
};
export const combPick: Gen = (R, n0) => {
  const n = int(R, 7, 12), r = int(R, 3, n - 3), m = n - r;
  const v = C(n, r);
  return choice(R, {
    id: `combPick-${n0}`, family: 'combPick',
    prompt: `Which expression gives C(${n}, ${r}), the number of ${r}-person teams from ${n} people?`,
    board: `C(${n},${r}) = \\,?`,
    solution: [`Ordered selections: ${n}! / ${m}!. Each team of ${r} appears in ${r}! orders, so divide by ${r}! too.`, `C(${n}, ${r}) = ${n}! / (${r}! · ${m}!).`, `So: ${ans(`${n}! / (${r}! · ${m}!)`)}`],
  }, [
    { t: `${n}! / (${r}! · ${m}!)`, ok: true, key: v, say: `Yes: the ordered count ${n}!/${m}! divided by the ${r}! orders of each team.` },
    { t: `${n}! / ${m}!`, key: P(n, r), mc: MC.missFact, say: `That is P(${n}, ${r}): it counts each team ${r}! times. Divide by ${r}! as well.` },
    { t: `${n}! / ${r}!`, key: fact(n) / fact(r), mc: MC.missFact, say: `The (${n} − ${r})! = ${m}! is missing from the denominator.` },
    { t: `${n}! / (${r} · ${m}!)`, key: P(n, r) / r, mc: MC.divByR, say: `A team of ${r} has ${r}! orders, not ${r}.` },
  ]);
};

// ===================== combination-symmetry =====================
export const symShortcut: Gen = (R, n0) => {
  const n = int(R, 8, 25), k = int(R, 1, n <= 12 ? 3 : 2), keep = n - k;
  const v = C(n, k);
  const story = pick(R, [`A coach picks ${keep} of the ${n} players for the travel roster (no roles).`, `A teacher picks ${keep} of ${n} posters to hang in the hallway.`, `${keep} of the ${n} club members are chosen to go to a conference.`]);
  return numItem({
    id: `symShortcut-${n0}`, family: 'symShortcut',
    prompt: `${story} How many different choices are there? (No calculator: use a shortcut.)`,
    board: `C(${n},${keep}) = \\,?`, unit: 'choices',
    solution: [`Choosing the ${keep} who go is the same as choosing the ${k} who stay behind: C(${n}, ${keep}) = C(${n}, ${k}).`, k === 1 ? `C(${n}, 1) = ${ans(n)}.` : `C(${n}, ${k}) = ${prodH(falling(n, k))} ÷ ${k}! = ${ans(fmtN(v))}.`],
  }, v, `Yes: C(${n}, ${keep}) = C(${n}, ${k}) = ${fmtN(v)}.`,
  [[P(n, k), MC.ordersDiff, `${fmtN(P(n, k))} counts the ${k} left out in order. Divide by ${k}!.`]],
  `Count the ones left out instead: C(${n}, ${keep}) = C(${n}, ${k}).`);
};
export const symCompare: Gen = (R, n0) => {
  const n = int(R, 7, 12), r = int(R, 2, Math.floor((n - 1) / 2)), m = n - r;
  return choice(R, {
    id: `symCompare-${n0}`, family: 'symCompare',
    prompt: `A team of ${n} players: compare the number of ways to choose ${r} to sit on the bench, C(${n}, ${r}), with the number of ways to choose ${m} to start, C(${n}, ${m}).`,
    board: `C(${n},${r}) \\ \\text{vs.} \\ C(${n},${m})`,
    solution: [`Every choice of ${m} starters leaves exactly ${r} on the bench, and every bench of ${r} leaves exactly one group of ${m} starters.`, `They match one to one, so the counts are equal (both ${fmtN(C(n, r))}).`, `So: ${ans('They are equal')}`],
  }, [
    { t: 'They are equal', ok: true, say: `Yes: each choice of ${m} starters is the same as a choice of ${r} on the bench.` },
    { t: `C(${n}, ${m}) is larger, because ${m} is more than ${r}`, mc: MC.compLarger, say: `Choosing ${m} to start decides exactly who sits: the ${r} others. The two counts match one to one.` },
    { t: `C(${n}, ${r}) is larger, because there are fewer to choose`, say: `Both describe the same split of the team into starters and bench. Neither is larger.` },
    { t: `They are equal only for some numbers of players`, mc: MC.coincidence, say: `It holds for every n and r: picking the ${m} always picks the ${r} left out.` },
  ]);
};

// ===================== multi-group-selections =====================
export const twoGroups: Gen = (R, n0) => {
  const [n1, n2] = [int(R, 3, 6), int(R, 3, 6)], r1 = int(R, 1, Math.min(3, n1 - 1)), r2 = int(R, 1, Math.min(3, n2 - 1));
  const a = C(n1, r1), b = C(n2, r2), v = a * b;
  const names = people(R, n1 + n2), groups = names.map((_, i) => (i < n1 ? 0 : 1));
  const [g1, g2] = pick(R, [['seniors', 'juniors'], ['sopranos', 'altos'], ['guards', 'forwards']] as const);
  const what = g1 === 'sopranos' ? 'a small ensemble' : g1 === 'guards' ? 'a practice squad' : 'a planning committee';
  return numItem({
    id: `twoGroups-${n0}`, family: 'twoGroups',
    prompt: `${what[0]!.toUpperCase() + what.slice(1)} needs ${r1} of the ${n1} ${g1} and ${r2} of the ${n2} ${g2} (no roles). How many different ways can it be formed?`,
    board: `C(${n1},${r1}) \\times C(${n2},${r2})`, unit: 'ways',
    picture: { pics: [{ kind: 'tokens', names, groups, legend: [g1, g2] }] },
    solution: [`Two stages: choose the ${g1} (C(${n1}, ${r1}) = ${a}), then the ${g2} (C(${n2}, ${r2}) = ${b}). Every first choice goes with every second.`, `${a} × ${b} = ${ans(fmtN(v))}.`],
  }, v, `Yes: ${a} × ${b} = ${fmtN(v)}.`,
  [[a + b, MC.addStages, `${a + b} adds the two choices. Each choice of ${g1} goes with every choice of ${g2}: multiply.`],
   [C(n1 + n2, r1 + r2), MC.pools, `C(${n1 + n2}, ${r1 + r2}) = ${fmtN(C(n1 + n2, r1 + r2))} pools everyone, so it also counts groups with the wrong mix of ${g1} and ${g2}.`]],
  `Choose from each group separately, then multiply.`);
};
export const chooseOrder: Gen = (R, n0) => {
  const relay = R() < 0.5, r = int(R, 3, 4), n = int(R, r + 2, 9), names = people(R, n);
  const c = C(n, r), v = relay ? c * fact(r) : c * r;
  return numItem({
    id: `chooseOrder-${n0}`, family: 'chooseOrder',
    prompt: relay ? `A coach chooses ${r} of ${n} swimmers for a relay and then decides the order they swim in. How many different relay line-ups (team and order) are possible?`
      : `A club of ${n} chooses a ${r}-person committee, and then the committee picks one of its ${r} members as chair. How many different committees with a chair are possible?`,
    board: relay ? `C(${n},${r}) \\times ${r}!` : `C(${n},${r}) \\times ${r}`, unit: relay ? 'line-ups' : 'ways',
    picture: { pics: [{ kind: 'tokens', names }] },
    solution: relay ? [`Stage 1, the team: C(${n}, ${r}) = ${c}. Stage 2, their order: ${r}! = ${fact(r)}.`, `${c} × ${fact(r)} = ${ans(fmtN(v))} (the same as P(${n}, ${r})).`]
      : [`Stage 1, the committee: C(${n}, ${r}) = ${c}. Stage 2, its chair: ${r} choices.`, `${c} × ${r} = ${ans(fmtN(v))}.`],
  }, v, `Yes: ${fmtN(v)}.`,
  relay ? [[c, MC.merged, `${c} counts the teams only. Here the swimming order matters too: × ${r}!.`], [c + fact(r), MC.addStages, `The two stages multiply: every team can swim in every order.`]]
    : [[c + r, MC.addStages, `The two stages multiply: every committee can pick any of its ${r} members.`], [P(n, r), MC.ordersDiff, `${fmtN(P(n, r))} orders all ${r} members. Only the chair has a role; the other ${r - 1} are not ordered.`], [c, MC.merged, `${c} counts committees without a chair. Each has ${r} ways to pick one.`]],
  `Two stages: first choose the group, then what happens inside it. Multiply.`);
};

// ===================== restricted-positions-first =====================
export const restrictFirst: Gen = (R, n0) => {
  const v = int(R, 0, 3);
  if (v <= 1) {
    const n = int(R, 4, 6), names = people(R, n), who = names[0]!, ends = v === 1;
    const val = ends ? 2 * fact(n - 1) : fact(n - 1);
    return numItem({
      id: `restrictFirst-${n0}`, family: 'restrictFirst',
      prompt: ends ? `${andList(names)} line up in a row for a photo. ${who} must stand at one of the two ends. How many orders are possible?` : `${andList(names)} line up in a row for a photo. ${who} must stand at the left end. How many orders are possible?`,
      board: `\\text{orders} = \\,?`, unit: 'orders',
      picture: { pics: [slotsPic([{ slots: Array.from({ length: n }, (_, i) => ({ role: i === 0 ? 'left' : i === n - 1 ? 'right' : `${i + 1}`, reveal: ends ? (i === 0 ? 2 : n - i) : (i === 0 ? 1 : n - i) })) }])] },
      solution: ends ? [`Fill the restricted place first: ${who} goes to one of the 2 ends.`, `The other ${n - 1} fill the remaining places: ${n - 1}! = ${fact(n - 1)}.`, `2 × ${fact(n - 1)} = ${ans(val)}.`]
        : [`Fill the restricted place first: the left end is ${who} (1 way).`, `The other ${n - 1} fill the rest: ${prodH(falling(n - 1, n - 1))} = ${ans(val)}.`],
    }, val, `Yes: ${val}.`,
    [[fact(n), MC.restrict, `${fact(n)} = ${n}! ignores the rule: it counts orders where ${who} is in the middle too.`], ...(ends ? [[fact(n - 1), undefined, `${fact(n - 1)} puts ${who} at one end only. There are two ends.`] as [number, undefined, string]] : [])],
    `Place ${who} first, then fill the other places.`);
  }
  const m = v === 2 ? int(R, 5, 9) : 9, L = v === 2 ? 3 : 4;
  const val = m * P(m, L - 1), naive = P(m + 1, L);
  return numItem({
    id: `restrictFirst-${n0}`, family: 'restrictFirst',
    prompt: `How many ${L}-digit numbers have all different digits, using only the digits 0 to ${m}? (A ${L}-digit number cannot start with 0.)`,
    board: `\\text{${L}-digit numbers} = \\,?`, unit: 'numbers',
    picture: { pics: [slotsPic([{ slots: Array.from({ length: L }, (_, i) => ({ role: `digit ${i + 1}`, reveal: i === 0 ? m : m + 1 - i })) }])] },
    solution: [`The first digit is the restricted one: it cannot be 0, so ${m} choices. Fill it first.`, `Then the others: ${m} (0 is back, the first digit is used), ${m - 1}${L === 4 ? `, ${m - 2}` : ''}.`, `${m} × ${prodH(falling(m, L - 1))} = ${ans(fmtN(val))}.`],
  }, val, `Yes: ${fmtN(val)}.`,
  [[naive, MC.restrict, `${fmtN(naive)} lets 0 be the first digit. Fill the first digit first: ${m} choices.`], [m * P(m - 1, L - 1), undefined, `After the first digit, 0 is allowed again: the second digit has ${m} choices, not ${m - 1}.`]],
  `Fill the most restricted position first.`);
};
export const evenDistinct: Gen = (R, n0) => {
  if (R() < 0.3) return noZeroParity(R, n0);
  const m = int(R, 5, 9), even = R() < 0.6;
  const e1 = Math.floor(m / 2), o = Math.ceil(m / 2);
  const zeroCase = m * (m - 1), other = e1 * (m - 1) * (m - 1);
  const val = even ? zeroCase + other : o * (m - 1) * (m - 1);
  const evens = Array.from({ length: e1 }, (_, i) => 2 * (i + 1)), odds = Array.from({ length: o }, (_, i) => 2 * i + 1);
  return numItem({
    id: `evenDistinct-${n0}`, family: 'evenDistinct',
    prompt: `How many 3-digit <b>${even ? 'even' : 'odd'}</b> numbers have all different digits, using only the digits 0 to ${m}?`,
    board: `\\text{${even ? 'even' : 'odd'}, all different}`, unit: 'numbers',
    picture: { pics: [even
      ? slotsPic([{ caption: 'last digit 0', slots: [{ role: 'hundreds', reveal: m }, { role: 'tens', reveal: m - 1 }, { role: 'ones', reveal: 1 }] }, { caption: `last digit ${evens.join(', ')}`, slots: [{ role: 'hundreds', reveal: m - 1 }, { role: 'tens', reveal: m - 1 }, { role: 'ones', reveal: e1 }] }], { op: '+' })
      : slotsPic([{ slots: [{ role: 'hundreds', reveal: m - 1 }, { role: 'tens', reveal: m - 1 }, { role: 'ones', reveal: o }] }])] },
    solution: even ? [`The last digit is restricted (even), and the first cannot be 0. Split on the last digit.`, `Last digit 0: first ${m} choices, middle ${m - 1}: ${m} × ${m - 1} = ${zeroCase}.`, `Last digit ${evens.join(', ')} (${e1} ways): first ${m - 1} (not 0, not the last), middle ${m - 1}: ${e1} × ${m - 1} × ${m - 1} = ${other}.`, `${zeroCase} + ${other} = ${ans(val)}.`]
      : [`Fill the last digit first: odd, ${o} choices (${odds.join(', ')}).`, `First digit: not 0 and not the last digit, ${m - 1} choices. Middle: ${m - 1} left.`, `${o} × ${m - 1} × ${m - 1} = ${ans(val)}.`],
  }, val, `Yes: ${val}.`,
  even ? [[(e1 + 1) * (m - 1) * (m - 1), MC.restrict, `That treats a last digit of 0 like 2, 4, ...; but when the last digit is 0, the first digit has ${m} choices, not ${m - 1}. Split into the two cases.`]]
    : [[o * m * (m - 1), MC.restrict, `That lets the first digit be 0. After the last digit, the first digit has ${m - 1} choices (not 0, not the last digit).`]],
  even ? `Split on the last digit: 0, or another even digit.` : `Fill the last digit first, then the first digit (not 0).`);
};

/** the same restriction without a zero digit: fill the last digit first, then the others (one case only) */
function noZeroParity(R: () => number, n0: number): CItem {
  const m = int(R, 5, 9), even = R() < 0.5, L = int(R, 3, 4);
  const ok = Array.from({ length: m }, (_, i) => i + 1).filter(d => (d % 2 === 0) === even);
  const val = ok.length * P(m - 1, L - 1);
  return numItem({
    id: `evenDistinct-${n0}`, family: 'evenDistinct',
    prompt: `How many ${L}-digit <b>${even ? 'even' : 'odd'}</b> numbers have all different digits, using only the digits 1 to ${m}?`,
    board: `\\text{${even ? 'even' : 'odd'}, digits 1 to ${m}}`, unit: 'numbers',
    picture: { pics: [slotsPic([{ slots: [...Array.from({ length: L - 1 }, (_, i) => ({ role: ['1st', '2nd', '3rd'][i]!, reveal: m - 1 - i })), { role: 'last', reveal: ok.length }] }])] },
    solution: [`Fill the restricted place first: the last digit is ${even ? 'even' : 'odd'}, ${ok.length} choices (${ok.join(', ')}).`, `The other ${L - 1} places take the remaining digits: ${prodH(falling(m - 1, L - 1))}.`, `${ok.length} × ${prodH(falling(m - 1, L - 1))} = ${ans(fmtN(val))}.`],
  }, val, `Yes: ${fmtN(val)}.`,
  [[ok.length * P(m, L - 1), MC.restrict, `After the last digit is used, only ${m - 1} digits are left for the other places.`]],
  `Fill the last digit first, then the others.`);
}

// ===================== complement-counting =====================
export const atLeastOne: Gen = (R, n0) => {
  const r = int(R, 2, 4), j = int(R, r, 6), s = int(R, 2, 5);
  const total = C(s + j, r), none = C(j, r), v = total - none, over = s * C(s + j - 1, r - 1);
  const names = people(R, s + j), groups = names.map((_, i) => (i < s ? 0 : 1));
  const notAll = R() < 0.35;
  return numItem({
    id: `atLeastOne-${n0}`, family: 'atLeastOne',
    prompt: `A ${r}-person committee (no roles) is chosen from ${s} seniors and ${j} juniors. How many committees have ${notAll ? '<b>not all</b> juniors' : '<b>at least one</b> senior'}?`,
    board: `\\text{total} - \\text{all juniors}`, unit: 'committees',
    picture: { pics: [{ kind: 'tokens', names, groups, legend: ['seniors', 'juniors'] }] },
    solution: [`All committees: C(${s + j}, ${r}) = ${total}.`, `The opposite case, all juniors: C(${j}, ${r}) = ${none}.`, `${total} − ${none} = ${ans(v)}.`],
  }, v, `Yes: ${total} − ${none} = ${v}.`,
  [[over, MC.atLeastOver, `${over} picks a senior first and then any ${r - 1} others, so a committee with two seniors is counted twice. Count the opposite instead.`], [total, undefined, `${total} counts every committee, including the ${none} with juniors only.`], [none, undefined, `${none} is the number of all-junior committees: take them away from the total.`]],
  `Total minus the committees with no senior at all.`);
};
export const repeatDigit: Gen = (R, n0) => {
  const n = pick(R, [4, 5, 6, 7, 8, 10, 10]), r = int(R, 3, 4);
  const all = pow(n, r), no = P(n, r), v = all - no;
  const what = pick(R, ['codes', 'passwords', 'lock codes']);
  const story = n === 10 ? `${r}-digit ${what} from the digits 0 to 9 (digits may repeat, and a code may start with 0)` : `${r}-letter ${what} from the ${n} letters A to ${'ABCDEFGH'[n - 1]} (letters may repeat)`;
  return numItem({
    id: `repeatDigit-${n0}`, family: 'repeatDigit',
    prompt: `Of all ${story}, how many have <b>at least one</b> ${n === 10 ? 'digit' : 'letter'} that appears more than once?`,
    board: `${n}^{${r}} - P(${n},${r})`, unit: 'codes',
    picture: { pics: [slotsPic([{ caption: 'all codes', slots: Array.from({ length: r }, () => ({ role: '', n })) }, { caption: 'no repeats', slots: Array.from({ length: r }, (_, i) => ({ role: '', reveal: n - i })) }], { op: '−' })] },
    solution: [`All codes: ${n}<sup>${r}</sup> = ${fmtN(all)}.`, `The opposite, no repeats at all: ${prodH(falling(n, r))} = ${fmtN(no)}.`, `${fmtN(all)} − ${fmtN(no)} = ${ans(fmtN(v))}.`],
  }, v, `Yes: ${fmtN(all)} − ${fmtN(no)} = ${fmtN(v)}.`,
  [[no, undefined, `${fmtN(no)} counts the codes with NO repeat. Take them away from all ${fmtN(all)}.`], [all, undefined, `${fmtN(all)} is every code. Subtract the ones without a repeat.`]],
  `Count the opposite (no repeats), and take it from the total.`);
};

// ===================== choose-method-mixed =====================
interface MStory { t: (n: number, r: number) => string; c: 0 | 1 | 2; trap?: boolean; nFix?: number }
const MSTORIES: MStory[] = [
  { t: (n, r) => `A ${r}-digit code for a combination lock uses the digits 0 to 9 (digits may repeat).`, c: 0, trap: true, nFix: 10 },
  { t: (n, r) => `A code is ${r} letters long, from the ${n} letters A to ${'ABCDEFGHI'[n - 1]} (letters may repeat).`, c: 0 },
  { t: (n, r) => `From ${n} runners in a final, the officials record ${r === 2 ? 'who wins gold and who wins silver' : 'who wins gold, silver and bronze'}.`, c: 1 },
  { t: (n, r) => `${r} of ${n} guests are seated in ${r} numbered chairs, one guest per chair.`, c: 1 },
  { t: (n, r) => `A ${r}-person committee is chosen from ${n} students by drawing names one at a time.`, c: 2, trap: true },
  { t: (n, r) => `A pizza gets ${r} different toppings from a list of ${n}.`, c: 2 },
];
function mcMethod(s: MStory, chosen: 0 | 1 | 2 | 3): string | undefined {
  if (chosen === 3) return MC.nTimesR;
  if (s.trap) return MC.keyWords;
  if (s.c === 2) return MC.ordersDiff;
  if (s.c === 1) return chosen === 0 ? MC.keepAll : MC.merged;
  return chosen === 1 ? MC.repetition : MC.ordersDiff;
}
function mstory(R: () => number): { s: MStory; n: number; r: number } {
  const s = pick(R, MSTORIES), r = int(R, 2, 3), n = s.nFix ?? int(R, 5, 9);
  return { s, n, r };
}
const valOf = (c: number, n: number, r: number) => (c === 0 ? pow(n, r) : c === 1 ? P(n, r) : c === 2 ? C(n, r) : n * r);
export const mixedCount: Gen = (R, n0) => {
  const { s, n, r } = mstory(R);
  const v = valOf(s.c, n, r);
  const how = s.c === 0 ? `order matters and repeats are allowed: ${n}<sup>${r}</sup>` : s.c === 1 ? `order matters, no repeats: ${prodH(falling(n, r))}` : `order does not matter, no repeats: ${prodH(falling(n, r))} ÷ ${r}!`;
  return numItem({
    id: `mixedCount-${n0}`, family: 'mixedCount',
    prompt: `${s.t(n, r)} How many different outcomes are possible?`,
    board: `\\text{order?} \\quad \\text{repeats?}`, unit: 'outcomes',
    solution: [`Swap test and reuse test: ${how}.`, `= ${ans(fmtN(v))}.`],
  }, v, `Yes: ${fmtN(v)}.`,
  ([0, 1, 2, 3] as const).filter(c => c !== s.c).map(c => [valOf(c, n, r), mcMethod(s, c), c === 3 ? `${n} × ${r} is not a count of outcomes: fill ${r} slots and multiply the choices.` : `${fmtN(valOf(c, n, r))} is the count for a situation where ${c === 0 ? 'order matters and repeats are allowed' : c === 1 ? 'order matters and nothing repeats' : 'order does not matter'}. Run the swap and reuse tests on this story.`] as [number, string | undefined, string]),
  `Run the swap test (does order matter?) and the reuse test (can a choice come again?) first.`);
};
export const methodPick: Gen = (R, n0) => {
  const { s, n, r } = mstory(R);
  const texts = [`${n}<sup>${r}</sup>`, prodH(falling(n, r)), `${prodH(falling(n, r))} ÷ ${r}!`, `${n} × ${r}`];
  const opts: Opt[] = texts.map((t, c) => ({ t, ok: c === s.c, key: valOf(c, n, r), mc: c === s.c ? undefined : mcMethod(s, c as 0 | 1 | 2 | 3), say: c === s.c ? `Right: ${fmtN(valOf(c, n, r))}.` : `Run both tests on the story: ${s.c === 0 ? 'order matters and repeats are allowed' : s.c === 1 ? 'order matters, nothing repeats' : 'order does not matter, nothing repeats'}.` }));
  return choice(R, {
    id: `methodPick-${n0}`, family: 'methodPick',
    prompt: `${s.t(n, r)} Which expression counts the outcomes?`,
    board: `\\text{which count?}`,
    solution: [`Swap test: ${s.c === 2 ? 'the same outcome' : 'a different outcome'}${s.trap ? ' (whatever the wording suggests)' : ''}. Reuse test: ${s.c === 0 ? 'repeats allowed' : 'no repeats'}.`, `So: ${ans(texts[s.c]!)}`],
  }, opts);
};

// ===================== probability-from-counts =====================
export const probComm: Gen = (R, n0) => {
  const r = int(R, 2, 3), g = int(R, r, 5), j = int(R, 2, 5), n = g + j;
  const fav = C(g, r), tot = C(n, r);
  const names = people(R, n), groups = names.map((_, i) => (i < g ? 0 : 1));
  const [L, Ln] = lowest(fav, tot);
  return fracItem({
    id: `probComm-${n0}`, family: 'probComm',
    prompt: `A ${r}-person committee is chosen at random from ${g} seniors and ${j} juniors (every committee is equally likely). What is the probability that ${r === 2 ? 'both members are' : 'all three members are'} seniors? Give a fraction.`,
    board: `P = \\dfrac{C(${g},${r})}{C(${n},${r})}`, unit: '',
    picture: { pics: [{ kind: 'tokens', names, groups, legend: ['seniors', 'juniors'] }] },
    solution: [`Outcomes: committees (unordered), all equally likely: C(${n}, ${r}) = ${tot}.`, `Favorable: committees of seniors only, C(${g}, ${r}) = ${fav}.`, `P = ${fav}/${tot} = ${ans(`${L}/${Ln}`)}.`],
  }, fav, tot, `Yes: ${fav}/${tot} = ${fr(fav, tot)}.`,
  [[P(g, r), tot, MC.mixModel, `${P(g, r)} counts ordered picks of seniors, but ${tot} counts unordered committees. Use the same model on top and bottom.`],
   [1, r + 1, MC.equiprob, `"All seniors" is one of ${r + 1} kinds of committee, but the kinds are not equally likely. Count committees.`],
   [g, n, undefined, `${g}/${n} is the chance for one person. The committee has ${r} people: count committees.`]],
  `Count committees: favorable ÷ all, both unordered.`);
};
export const probBag: Gen = (R, n0) => {
  const a = int(R, 2, 5), b = int(R, 2, 5), n = a + b, mix = R() < 0.45;
  const tot = C(n, 2), fav = mix ? a * b : C(a, 2);
  const names = [...Array(a).fill('Y'), ...Array(b).fill('G')] as string[], groups = names.map((_, i) => (i < a ? 0 : 1));
  const [L, Ln] = lowest(fav, tot);
  return fracItem({
    id: `probBag-${n0}`, family: 'probBag',
    prompt: `A bag holds ${a} yellow and ${b} green tokens. You pull out 2 tokens at the same time, without looking. What is the probability of ${mix ? '<b>one of each</b> color' : '<b>two yellow</b> tokens'}? Give a fraction.`,
    board: mix ? `P(\\text{one of each})` : `P(\\text{two yellow})`, unit: '',
    picture: { pics: [{ kind: 'tokens', names, groups, legend: ['yellow', 'green'] }] },
    solution: [`Outcomes: pairs of tokens (each token is its own object), all equally likely: C(${n}, 2) = ${tot}.`, mix ? `Favorable: one yellow AND one green: ${a} × ${b} = ${fav}.` : `Favorable: pairs of yellow tokens, C(${a}, 2) = ${fav}.`, `P = ${fav}/${tot} = ${ans(`${L}/${Ln}`)}.`],
  }, fav, tot, `Yes: ${fav}/${tot} = ${fr(fav, tot)}.`,
  [[1, 3, MC.equiprob, `Two yellow, one of each, two green: three kinds, but not equally likely. Count pairs of tokens.`],
   mix ? [a * b, P(n, 2), MC.mixModel, `${a * b} counts unordered pairs, but ${P(n, 2)} counts ordered ones. Use the same model on top and bottom.`] : [P(a, 2), tot, MC.mixModel, `${P(a, 2)} counts ordered pairs of yellows, but ${tot} counts unordered pairs. Use the same model on top and bottom.`]],
  `Count pairs: favorable ÷ all, with the same model on top and bottom.`);
};
export const probCode: Gen = (R, n0) => {
  const n = int(R, 4, 10), r = int(R, 2, 3);
  const tot = pow(n, r), fav = P(n, r);
  const [L, Ln] = lowest(fav, tot);
  const sym = n === 10 ? 'digits 0 to 9' : `${n} letters A to ${'ABCDEFGHIJ'[n - 1]}`;
  return fracItem({
    id: `probCode-${n0}`, family: 'probCode',
    prompt: `A computer makes a random ${r}-symbol code from the ${sym}; symbols may repeat, and every code is equally likely. What is the probability that all ${r} symbols are <b>different</b>? Give a fraction.`,
    board: `P(\\text{all different})`, unit: '',
    picture: { pics: [slotsPic([{ caption: 'all codes', slots: Array.from({ length: r }, () => ({ role: '', n })) }, { caption: 'all different', slots: Array.from({ length: r }, (_, i) => ({ role: '', reveal: n - i })) }], { op: '' })] },
    solution: [`Outcomes: ordered codes, all equally likely: ${n}<sup>${r}</sup> = ${tot}.`, `Favorable: ordered codes with no repeat: ${prodH(falling(n, r))} = ${fav}.`, `P = ${fav}/${tot} = ${ans(`${L}/${Ln}`)}.`],
  }, fav, tot, `Yes: ${fav}/${tot} = ${fr(fav, tot)}.`,
  [[C(n, r), tot, MC.mixModel, `${C(n, r)} counts unordered sets of symbols, but the ${tot} codes are ordered. Count ordered codes on top as well.`]],
  `Ordered codes on top and bottom: no-repeat codes ÷ all codes.`);
};

