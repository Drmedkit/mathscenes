// famA.ts: stage-1 families of "Counting" (sub-goals 1-5): organized lists and trees, the swap test (does order
// matter?), the reuse test (can an option come back?), unordered selections with repeated types (by type counts),
// and the 2 x 2 classification. Pure: no DOM.
import { type Gen, type Opt, MC, ans, andList, choice, int, numItem, people, pick, shuffle, until, who } from './common';
import { C, P, fmtN, multi, multisets, pow, word } from './count';
import type { CPic } from './CountPic';

// ===================== enumerate-compound-outcomes =====================
interface TreeCtx { levels: { name: string; opts: string[] }[]; story: string; what: string }
const COLORS = ['red', 'blue', 'green', 'yellow'];
function treeCtx(R: () => number): TreeCtx {
  const v = int(R, 0, 3);
  if (v === 3) {
    const [b, f] = until(() => [int(R, 2, 3), int(R, 2, 4)] as const, ([b, f]) => !(b === 2 && f === 2));
    const breads = ['rye', 'wheat', 'sub'].slice(0, b), fills = ['ham', 'tuna', 'egg', 'brie'].slice(0, f);
    return { levels: [{ name: 'bread', opts: breads }, { name: 'filling', opts: fills }],
      story: `${who(R)}'s deli makes a sandwich from one bread (${andList(breads)}) and one filling (${andList(fills)}).`, what: 'sandwiches' };
  }
  if (v === 0) {
    const k = int(R, 3, 4), cols = shuffle(R, COLORS.slice()).slice(0, k);
    return { levels: [{ name: 'coin', opts: ['H', 'T'] }, { name: 'spinner', opts: cols.map(c => c[0]!.toUpperCase()) }],
      story: `You toss a coin (H or T), then spin a spinner with ${word(k)} equal sections: ${andList(cols)} (${cols.map(c => c[0]!.toUpperCase()).join(', ')}).`, what: 'outcomes' };
  }
  if (v === 1) {
    const [s, p] = until(() => [int(R, 2, 3), int(R, 2, 4)] as const, ([s, p]) => !(s === 2 && p === 2));
    const shirts = ['red', 'blue', 'gray'].slice(0, s), pants = ['jeans', 'khaki', 'black', 'tan'].slice(0, p);
    return { levels: [{ name: 'shirt', opts: shirts }, { name: 'pants', opts: pants }],
      story: `${who(R)} packs ${word(s)} shirts (${andList(shirts)}) and ${word(p)} pairs of pants (${andList(pants)}). An outfit is one shirt with one pair of pants.`, what: 'outfits' };
  }
  const k = int(R, 2, 3);
  const third = k === 2 ? { name: 'coin 3', opts: ['H', 'T'] } : { name: 'spinner', opts: ['R', 'B', 'G'] };
  return { levels: [{ name: 'coin 1', opts: ['H', 'T'] }, { name: 'coin 2', opts: ['H', 'T'] }, third],
    story: k === 2 ? `${who(R)} tosses three coins, one after another, and records H or T for each.` : `${who(R)} tosses two coins, one after another, then spins a spinner with three equal sections: red, blue and green (R, B, G).`,
    what: 'outcomes' };
}
export const listCount: Gen = (R, n) => {
  const t = treeCtx(R);
  const sizes = t.levels.map(l => l.opts.length), total = sizes.reduce((p, x) => p * x, 1), sum = sizes.reduce((s, x) => s + x, 0);
  const first = t.levels[0]!.opts[0]!, sub = total / sizes[0]!;
  return numItem({
    id: `listCount-${n}`, family: 'listCount',
    prompt: `${t.story} The tree shows every one of the ${t.what} that start with <b>${first}</b>. How many ${t.what} are there in all?`,
    board: `\\text{${t.what}} = \\,?`, unit: t.what,
    picture: { pics: [{ kind: 'tree', levels: t.levels, grow: 1 } as CPic] },
    solution: [`The branch for ${first} ends in ${sub} ${t.what}. Every first choice grows the same subtree, so each of the ${sizes[0]} first branches ends in ${sub}.`,
      `${sizes.join(' × ')} = ${ans(total)} ${t.what}.`],
  }, total, `Yes: ${sizes.join(' × ')} = ${total}. Every complete path through the tree is one outcome.`,
  [[sum, MC.branchLabels, `${sum} adds up the branch labels (${sizes.join(' + ')}). An outcome is a whole path, from the root to the end: count the ends.`]],
  `Count the ends of the paths that start with ${first}, then remember every first branch has the same number.`);
};

/** an organized list (one row per first choice) with one outcome taken out */
export const missingOutcome: Gen = (R, n) => {
  const v = int(R, 0, 2), nm = who(R);
  let rows: { label: string; chips: string[] }[], story: string;
  const run = (from: string, k: number) => { const i = int(R, 0, from.length - k); return from.slice(i, i + k).split(''); };
  if (v === 0) {
    const L = run('ABCDEFGHKMPRST', 4);
    rows = L.map(a => ({ label: a, chips: L.filter(b => b !== a).map(b => a + b) }));
    story = `${nm} lists every 2-letter code made from ${andList(L)} with no letter used twice, one row for each first letter.`;
  } else if (v === 1) {
    const L = run('ABCDEFGHKMPRST', 3);
    rows = L.map(a => ({ label: a, chips: L.map(b => a + b) }));
    story = `${nm} lists every 2-letter code made from ${andList(L)} (a letter may be used twice, like ${L[0]}${L[0]}), one row for each first letter.`;
  } else {
    const D = run('123456789', 4);
    rows = D.map(a => ({ label: a, chips: D.filter(b => b !== a).map(b => a + b) }));
    story = `${nm} lists every 2-digit code made from the digits ${andList(D)} with no digit used twice, one row for each first digit.`;
  }
  const all = rows.flatMap(r => r.chips);
  const gone = pick(R, all);
  const shown = rows.map(r => ({ label: r.label, chips: r.chips.filter(c => c !== gone) }));
  const others = shuffle(R, all.filter(c => c !== gone)).slice(0, 3);
  const row = rows.find(r => r.chips.includes(gone))!;
  const opts: Opt[] = [
    { t: gone, ok: true, say: `Yes: row ${row.label} should hold ${row.chips.join(', ')}, and ${gone} is not there.`, key: gone },
    ...others.map(o => ({ t: o, say: `${o} is already in the list (row ${o[0]}). Run through each row: fix the first symbol and try every second one.` })),
  ];
  return choice(R, {
    id: `missingOutcome-${n}`, family: 'missingOutcome',
    prompt: `${story} One code is missing from ${nm}'s list. Which one?`,
    board: `\\text{missing} = \\,?`,
    picture: { pics: [{ kind: 'grid', rows: shown } as CPic] },
    solution: [`Fix the first symbol and run through every second one. Row ${row.label} should be ${row.chips.join(', ')}.`, `The one not in the list: ${ans(gone)}.`],
  }, opts);
};

// ===================== swap-test-order =====================
interface Swap { story: string; one: string; two: string; ordered: boolean; trap?: boolean }
const SWAPS: ((a: string, b: string) => Swap)[] = [
  (a, b) => ({ story: 'A club elects a president and a vice president.', one: `${a} is president and ${b} is vice president`, two: `${b} is president and ${a} is vice president`, ordered: true }),
  (a, b) => ({ story: 'Eight runners race; the results list who came 1st and who came 2nd.', one: `${a} is 1st and ${b} is 2nd`, two: `${b} is 1st and ${a} is 2nd`, ordered: true }),
  (a, b) => ({ story: 'Two friends take a two-person kayak: one sits in the front seat, one in the back seat.', one: `${a} sits in front and ${b} in back`, two: `${b} sits in front and ${a} in back`, ordered: true }),
  (a, b) => ({ story: 'A coach picks the first and the second batter of the lineup.', one: `${a} bats first and ${b} bats second`, two: `${b} bats first and ${a} bats second`, ordered: true }),
  (a, b) => ({ story: 'A class picks a 2-person committee to plan the dance (no titles: both just serve on it).', one: `the committee is ${a} and ${b}`, two: `the committee is ${b} and ${a}`, ordered: false }),
  (a, b) => ({ story: 'A soccer team names two co-captains, with the same title and the same job.', one: `the co-captains are ${a} and ${b}`, two: `the co-captains are ${b} and ${a}`, ordered: false }),
  (a, b) => ({ story: 'A teacher draws two names, one after another, to carry a box of books to the library together. Only the pair matters.', one: `${a} is drawn first and ${b} second`, two: `${b} is drawn first and ${a} second`, ordered: false, trap: true }),
  (a, b) => ({ story: 'Lena invites two friends to the movies.', one: `she invites ${a} and ${b}`, two: `she invites ${b} and ${a}`, ordered: false }),
];
export const swapTest: Gen = (R, n) => {
  const [a, b] = people(R, 2) as [string, string];
  const s = pick(R, SWAPS)(a, b);
  const yes = 'Yes: a different outcome, so order matters', no = 'No: the same outcome, so order does not matter';
  const why = s.ordered ? `The two places mean different things, so ${s.two} is not the same as ${s.one}.` : `Both ways name the same two people with the same job: it is one outcome${s.trap ? '; drawing them one after another does not give them different roles' : ''}.`;
  return choice(R, {
    id: `swapTest-${n}`, family: 'swapTest',
    prompt: `${s.story} Suppose ${s.one}. Now swap the two: ${s.two}. Is that a different outcome?`,
    board: `\\text{swap test}`,
    picture: { pics: [{ kind: 'tokens', names: [a, b], on: [0, 1] } as CPic] },
    solution: [`Swap test: swap two of the chosen and ask whether the outcome changed.`, why, `So: ${ans(s.ordered ? yes : no)}`],
  }, [
    { t: yes, ok: s.ordered, say: s.ordered ? `Right: ${why}` : `${why}`, mc: s.ordered ? undefined : s.trap ? MC.keyWords : MC.ordersDiff },
    { t: no, ok: !s.ordered, say: s.ordered ? `Look at what each place means: ${why}` : `Right: ${why}`, mc: s.ordered ? MC.merged : undefined },
  ], true);
};

/** choose r of n named people with or without roles: count the outcomes (12 ordered pairs vs 6 groups) */
export const swapList: Gen = (R, n0) => {
  const n = int(R, 3, 5), r = n === 3 ? 2 : int(R, 2, 3), ordered = R() < 0.5;
  const names = people(R, n);
  const roles2 = ['they elect a president and a vice president', 'a spelling bee among them awards 1st and 2nd place'];
  const roles3 = ['they elect a president, a vice president and a secretary', 'a race among them awards gold, silver and bronze'];
  const story = ordered ? pick(R, r === 2 ? roles2 : roles3) : r === 2 ? pick(R, ['they choose a 2-person committee (no roles)', 'two of them are picked to go on a field trip']) : pick(R, ['they choose a 3-person committee (no roles)', 'three of them are picked to go on a field trip']);
  const v = ordered ? P(n, r) : C(n, r), other = ordered ? C(n, r) : P(n, r);
  return numItem({
    id: `swapList-${n0}`, family: 'swapList',
    prompt: `${andList(names)} are in a club: ${story}. List the outcomes in your head or on paper. How many different outcomes are there?`,
    board: `\\text{outcomes} = \\,?`, unit: 'outcomes',
    picture: { pics: [{ kind: 'tokens', names } as CPic] },
    solution: ordered
      ? [`Swap test: swapping two people changes who has which role, so order matters.`, `Fix the first place (${n} ways), then the next (${n - 1}${r === 3 ? `), then the last (${n - 2}` : ''}): ${n} × ${n - 1}${r === 3 ? ` × ${n - 2}` : ''} = ${ans(v)}.`]
      : [`Swap test: swapping two chosen people gives the same group, so order does not matter.`, `List each group once (in alphabetical order): there are ${ans(v)} groups.`],
  }, v, ordered ? `Yes: ${v} ordered outcomes. Swapping two people gives a new one.` : `Yes: ${v} groups. Each group is listed once, whatever the order.`,
  [[other, ordered ? MC.merged : MC.ordersDiff, ordered ? `${other} counts groups. Here the roles differ, so ${names[0]} first and ${names[1]} second is not the same as the other way round.` : `${other} counts every order of a group separately. ${names[0]} and ${names[1]} is the same group as ${names[1]} and ${names[0]}.`]],
  `Do the swap test first, then list in an organized way: fix the first choice and run through the rest.`);
};

// ===================== reuse-test-repetition =====================
const REUSE: { s: string; yes: boolean; people?: boolean; why: string }[] = [
  { s: 'Choosing the 4 digits of a phone PIN, one digit at a time', yes: true, why: 'a PIN like 1123 or 7777 is allowed: a digit you used is still on the keypad' },
  { s: 'Rolling a number cube 3 times and writing down each result', yes: true, why: 'the cube still has all six faces after a roll' },
  { s: 'Writing an answer key for 6 true/false questions', yes: true, why: 'T can be the answer to more than one question' },
  { s: 'Drawing a marble from a bag, putting it back, then drawing again', yes: true, why: 'the marble goes back, so it can be drawn again' },
  { s: 'Giving out gold, silver and bronze medals to the runners in a race', yes: false, people: true, why: 'a runner finishes in one place, so one runner cannot win two medals' },
  { s: 'Seating 3 friends in 3 seats at the movies', yes: false, people: true, why: 'a person sits in one seat only' },
  { s: 'Dealing 2 cards from a deck into one hand', yes: false, why: 'the first card is in the hand, not in the deck' },
  { s: 'Drawing 2 marbles from a bag at the same time', yes: false, why: 'the two marbles are different marbles; one marble cannot be drawn twice' },
  { s: 'Spinning a spinner 4 times and writing down the color each time', yes: true, why: 'the spinner can land on the same color again' },
  { s: 'Choosing the 3 letters of a word game code, like ZZQ or ABA', yes: true, why: 'the example ZZQ already uses a letter twice' },
  { s: 'Picking the starting pitcher for each of the next 3 games from a team of 5 pitchers, where a pitcher may start more than one game', yes: true, why: 'the same pitcher may start again' },
  { s: 'Handing out 3 different prizes to 3 of the 10 students in a raffle, one prize per student', yes: false, people: true, why: 'each student gets at most one prize' },
  { s: 'Choosing a captain and a goalkeeper from a soccer team, two different players', yes: false, people: true, why: 'the two jobs go to two different players' },
  { s: 'Picking 3 books to take on a trip from a shelf of 12 different books', yes: false, why: 'a book is either packed or not; you cannot pack the same book twice' },
];
export const reuseTest: Gen = (R, n) => {
  const c = pick(R, REUSE);
  const yes = 'Yes: an option can be chosen again', no = 'No: an option cannot be chosen again';
  return choice(R, {
    id: `reuseTest-${n}`, family: 'reuseTest',
    prompt: `${c.s}. Reuse test: can the same option be chosen more than once?`,
    board: `\\text{reuse test}`,
    solution: [`Reuse test: after an option is chosen, is it still available?`, `Here ${c.why}.`, `So: ${ans(c.yes ? yes : no)}`],
  }, [
    { t: yes, ok: c.yes, say: c.yes ? `Right: ${c.why}.` : `Look again: ${c.why}.`, mc: c.yes ? undefined : c.people ? MC.reusePerson : undefined },
    { t: no, ok: !c.yes, say: c.yes ? `Repeats are allowed here: ${c.why}.` : `Right: ${c.why}.`, mc: c.yes ? MC.repetition : undefined },
  ], true);
};
/** ordered draws of length r from n numbered tokens, with or without putting each token back */
export const reuseCount: Gen = (R, n0) => {
  const n = int(R, 3, 6), r = int(R, 2, 3), back = R() < 0.5;
  const v = back ? pow(n, r) : P(n, r), other = back ? P(n, r) : pow(n, r);
  const slots = Array.from({ length: r }, (_, i) => ({ role: `draw ${i + 1}`, reveal: back ? n : n - i }));
  return numItem({
    id: `reuseCount-${n0}`, family: 'reuseCount',
    prompt: `A bag holds ${word(n)} tokens numbered 1 to ${n}. You draw a token ${word(r)} times, ${back ? '<b>putting it back</b> after each draw' : '<b>keeping it out</b> after each draw'}, and write the numbers down in order. How many different lists of numbers are possible?`,
    board: `\\text{lists} = \\,?`, unit: 'lists',
    picture: { pics: [{ kind: 'slots', rows: [{ slots }] } as CPic] },
    solution: [back ? `The token goes back, so every draw has all ${n} numbers: ${Array(r).fill(n).join(' × ')}.` : `A drawn token stays out, so each draw has one number fewer: ${slots.map(s => s.reveal).join(' × ')}.`, `${ans(fmtN(v))} lists.`],
  }, v, `Yes: ${slots.map(s => s.reveal).join(' × ')} = ${v}.`,
  [[other, back ? MC.repetition : MC.keepAll, back ? `${other} takes one number away each time. Here the token goes back, so every draw has all ${n}.` : `${other} keeps ${n} choices for every draw, but a token you keep out cannot come again.`]],
  `Fill one slot per draw: how many numbers can come up at that draw?`);
};

// ===================== represent-unordered-repetition =====================
const FLAVORS = ['mint', 'kiwi', 'plum'], MORE = ['mint', 'kiwi', 'plum', 'lime', 'fig', 'pear'], COINS = ['1¢', '5¢', '10¢'];
export const scoopList: Gen = (R, n0) => {
  const k = int(R, 2, 3), r = int(R, 2, 3), coins = R() < 0.4;
  const types = coins ? COINS.slice(0, k) : shuffle(R, MORE.slice()).slice(0, k);
  const v = multi(k, r), ord = pow(k, r), noRep = C(k, r), div = ord / [1, 1, 2, 6][r]!;
  const all = multisets(types, r).map(m => m.join(', '));
  const story = coins
    ? `A jar holds lots of pennies (1¢)${k === 3 ? ', nickels (5¢) and dimes (10¢)' : ' and nickels (5¢)'}. You grab ${word(r)} coins. A handful is recorded by how many of each kind it has, so the order you grabbed them in does not matter.`
    : `A cup holds ${word(r)} scoops of sorbet. The shop has ${andList(types)}, and a cup may have the same flavor more than once. The order of the scoops in the cup does not matter.`;
  const what = coins ? 'handfuls' : 'cups';
  return numItem({
    id: `scoopList-${n0}`, family: 'scoopList',
    prompt: `${story} How many different ${what} are possible?`,
    board: `\\text{${what}} = \\,?`, unit: what,
    picture: { pics: [{ kind: 'tokens', names: types } as CPic] },
    solution: [`Record each one by its type counts, in a fixed order (${types.join(' before ')}), so each appears once.`, `The list: ${all.join(' | ')}.`, `That is ${ans(v)} ${what}.`],
  }, v, `Yes: ${v}. List them by type counts: ${all.join(' | ')}.`,
  [[ord, MC.ordersDiff, `${ord} = ${k}<sup>${r}</sup> counts ordered lists: ${types[0]}, ${types[1]} and ${types[1]}, ${types[0]} are counted twice, but they are the same ${coins ? 'handful' : 'cup'}.`],
   [noRep, MC.repetition, `${noRep} leaves out the ${what} with a repeated ${coins ? 'coin' : 'flavor'}, like ${Array(r).fill(types[0]).join(', ')}. Repeats are allowed here.`],
   [div, MC.repeatsDiv, `Dividing ${ord} by ${r}! does not work here: a ${coins ? 'handful' : 'cup'} with a repeat appears fewer than ${r}! times among the ordered lists.`]],
  `Write each ${coins ? 'handful' : 'cup'} with its types in a fixed order (all ${types[0]} first, then ...), so each one shows up once.`);
};
export const sameCup: Gen = (R, n0) => {
  const r = int(R, 2, 3), types = FLAVORS.slice();
  const ms = multisets(types, r);
  const given = pick(R, ms.filter(m => new Set(m).size > 1));
  const key = (m: readonly string[]) => [...m].sort().join('|');
  const shown = until(() => shuffle(R, given.slice()), m => m.join() !== given.join());
  const asked = until(() => shuffle(R, given.slice()), m => m.join() !== shown.join());
  const wrong = shuffle(R, ms.filter(m => key(m) !== key(given))).slice(0, 3).map(m => shuffle(R, m.slice()));
  const opts: Opt[] = [
    { t: asked.join(', '), ok: true, key: key(asked), say: `Yes: the same flavors with the same counts, just in another order.` },
    ...wrong.map(m => ({ t: m.join(', '), key: key(m), say: `Count each flavor: ${m.join(', ')} has different counts than ${shown.join(', ')}.` })),
  ];
  const counts = types.map(t => `${given.filter(x => x === t).length} ${t}`).join(', ');
  return choice(R, {
    id: `sameCup-${n0}`, family: 'sameCup',
    prompt: `Cups of ${word(r)} sorbet scoops from mint, kiwi and plum (flavors may repeat; the order in the cup does not matter). Which cup is the <b>same cup</b> as ${shown.join(', ')}?`,
    board: `\\text{same cup?}`,
    picture: { pics: [{ kind: 'tokens', names: shown } as CPic] },
    solution: [`An unordered cup is recorded by how many scoops of each flavor it has.`, `${shown.join(', ')} is ${counts}.`, `The choice with the same counts: ${ans(asked.join(', '))}.`],
  }, opts);
};

// ===================== classify-2x2 =====================
type Cls = 0 | 1 | 2 | 3;   // 0 ordered + repeats, 1 ordered no repeats, 2 unordered no repeats, 3 unordered + repeats
interface Ctx2 { s: string; c: Cls; trap?: boolean; people?: boolean; why: string }
const CLASSIFY: Ctx2[] = [
  { s: 'The 4-digit code of a combination lock on a gym locker (digits 0 to 9; a digit may appear more than once)', c: 0, trap: true, why: '1234 and 4321 open different locks, and 7 7 0 1 is a fine code: order matters and digits can repeat. The word "combination" is just the lock\'s name' },
  { s: 'The 3-letter part of a license plate (A to Z; a letter may appear more than once)', c: 0, why: 'ABC and CBA are different plates, and AAB is allowed' },
  { s: 'The answer key for 6 true/false questions', c: 0, why: 'which question gets T matters, and T can be used again' },
  { s: 'Rolling a number cube 3 times and recording the results in order', c: 0, why: 'the results are recorded in order, and a face can come up again' },
  { s: 'Gold, silver and bronze among the 8 runners in a final', c: 1, people: true, why: 'swapping gold and silver changes the result, and one runner cannot win two medals' },
  { s: 'A president, a vice president and a treasurer from 12 club members (each member holds at most one job)', c: 1, people: true, why: 'swapping two officers changes who does what, and nobody holds two jobs' },
  { s: 'The order of 4 songs on a playlist picked from 10 songs (no song twice)', c: 1, why: 'a different order is a different playlist, and no song comes twice' },
  { s: 'Seating 3 of 7 guests in the 3 numbered front-row seats', c: 1, people: true, why: 'swapping two guests changes who sits where, and a guest takes one seat' },
  { s: 'A 3-person committee from 9 students, picked one at a time by drawing names', c: 2, trap: true, people: true, why: 'the committee has no roles, so the drawing order is forgotten, and a student cannot be on it twice' },
  { s: 'The handshakes when 6 people each shake hands once with every other person', c: 2, people: true, why: 'Ana with Ben is the same handshake as Ben with Ana, and nobody shakes their own hand' },
  { s: 'A 5-card hand dealt from a 52-card deck', c: 2, why: 'a hand is the same whatever order the cards came in, and each card is dealt once' },
  { s: 'A pizza with 3 different toppings chosen from a list of 10', c: 2, why: 'the toppings land on the same pizza in any order, and they are different toppings' },
  { s: 'A cup of 3 sorbet scoops from 5 flavors (a flavor may be used more than once, the order in the cup does not matter)', c: 3, why: 'the cup is the same in any order, and a flavor can repeat' },
  { s: 'A handful of 4 coins grabbed from a jar full of pennies, nickels, dimes and quarters (a handful is described by how many of each kind it has)', c: 3, why: 'the handful is the same in any order, and there are many coins of each kind' },
  { s: 'A box of 6 donuts chosen from 4 kinds (any number of each kind)', c: 3, why: 'the box is the same whatever order the donuts went in, and a kind can repeat' },
];
const ordered = (c: Cls) => c <= 1, repeats = (c: Cls) => c === 0 || c === 3;
function mcFor(right: Ctx2, pickC: Cls): string | undefined {
  if (right.trap) return MC.keyWords;
  if (ordered(right.c) !== ordered(pickC)) return ordered(right.c) ? MC.merged : MC.ordersDiff;
  if (repeats(right.c) !== repeats(pickC)) return repeats(right.c) ? MC.repetition : right.people ? MC.reusePerson : undefined;
  return undefined;
}
function classifyGen(fam: 'classify' | 'classifyTests'): Gen {
  return (R, n) => {
    const c = pick(R, CLASSIFY);
    const T = fam === 'classify'
      ? ['Order matters, repeats allowed: n^r', 'Order matters, no repeats: a permutation', 'Order does not matter, no repeats: a combination', 'Order does not matter, repeats allowed: list the cases']
      : ['Swap changes the outcome; an option can be reused', 'Swap changes the outcome; an option cannot be reused', 'Swap keeps the same outcome; an option cannot be reused', 'Swap keeps the same outcome; an option can be reused'];
    const opts: Opt[] = T.map((t, i) => ({ t, ok: i === c.c, mc: i === c.c ? undefined : mcFor(c, i as Cls), say: i === c.c ? `Right: ${c.why}.` : `Run both tests: ${c.why}.` }));
    return choice(R, {
      id: `${fam}-${n}`, family: fam,
      prompt: fam === 'classify' ? `${c.s}. What kind of count is it?` : `${c.s}. What do the swap test and the reuse test say?`,
      board: `\\text{order?} \\qquad \\text{repeats?}`,
      solution: [`Swap test: does swapping two choices change the outcome? Reuse test: can a choice come again?`, `Here ${c.why}.`, `So: ${ans(T[c.c]!)}`],
    }, opts, true);
  };
}
export const classify = classifyGen('classify');
export const classifyTests = classifyGen('classifyTests');
