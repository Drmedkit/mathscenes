// famC.ts: stage-3 families of "Counting" (sub-goals 20-25): auditing a count for impossible outcomes and repairing
// it, double counting (one outcome from two paths), overlapping cases (subtract the overlap), whether ÷ r! removes a
// uniform overcount, completeness (nothing left out), and verifying a count versus mere plausibility. Pure: no DOM.
import { type Gen, type Opt, MC, ans, andList, choice, int, numItem, pairItem, people, pick, shuffle, until, who } from './common';
import { C, P, combs, fact, fmtN, lcm, pow, prodH, falling, word, words } from './count';
import type { CPic } from './CountPic';

// ===================== audit-impossible-choices =====================
interface Flaw { story: string; claim: string; bad: string; goods: string[]; fixed: number; flawed: number; why: string; fix: string }
function flaw(R: () => number): Flaw {
  const v = int(R, 0, 3);
  if (v === 0) {
    const L = pick(R, [3, 3, 4]), d = () => int(R, 1, 9);
    const bad = '0' + Array.from({ length: L - 1 }, () => int(R, 0, 9)).join('');
    const goods = until(() => Array.from({ length: 3 }, () => String(d()) + Array.from({ length: L - 1 }, () => int(R, 0, 9)).join('')), g => new Set(g).size === 3);
    return { story: `Ravi counts the ${L}-digit numbers (digits 0 to 9, repeats allowed) as ${Array(L).fill(10).join(' × ')} = ${fmtN(pow(10, L))}.`, claim: `${L}-digit numbers`, bad, goods, fixed: 9 * pow(10, L - 1), flawed: pow(10, L), why: `${bad} starts with 0, so it is not a ${L}-digit number`, fix: `The first digit has 9 choices: 9 × ${Array(L - 1).fill(10).join(' × ')} = ${fmtN(9 * pow(10, L - 1))}` };
  }
  if (v === 1) {
    const n = int(R, 5, 12), [a, b, c] = people(R, 3) as [string, string, string];
    return { story: `Ravi counts the ways a club of ${n} can elect a president and a vice president as ${n} × ${n} = ${n * n}.`, claim: 'ways', bad: `${a} as president and ${a} as vice president`, goods: [`${a} as president and ${b} as vice president`, `${b} as president and ${a} as vice president`, `${c} as president and ${b} as vice president`], fixed: n * (n - 1), flawed: n * n, why: `one person cannot hold both offices`, fix: `The vice president is someone else: ${n} × ${n - 1} = ${n * (n - 1)}` };
  }
  if (v === 2) {
    const n = int(R, 4, 6), names = people(R, n), who = names[0]!;
    const rest = names.slice(1);
    const bad = until(() => shuffle(R, names.slice()), o => o[0] !== who).join(', ');
    const goods = until(() => Array.from({ length: 3 }, () => [who, ...shuffle(R, rest.slice())].join(', ')), g => new Set(g).size === 3);
    return { story: `${andList(names)} line up for a photo with ${who} at the left end. Ravi counts the orders as ${n}! = ${fact(n)}.`, claim: 'orders', bad, goods, fixed: fact(n - 1), flawed: fact(n), why: `${who} is not at the left end`, fix: `${who} is fixed at the left; the other ${n - 1} fill the rest: ${n - 1}! = ${fact(n - 1)}` };
  }
  const n = int(R, 5, 8), r = int(R, 3, 4), L = 'ABCDEFGH'.slice(0, n).split('');
  const bad = until(() => Array.from({ length: r }, () => pick(R, L)).join(''), w => new Set(w).size < r);
  const goods = until(() => Array.from({ length: 3 }, () => shuffle(R, L.slice()).slice(0, r).join('')), g => new Set(g).size === 3);
  return { story: `Ravi counts the ${r}-letter codes from the letters A to ${L[n - 1]} with <b>no letter repeated</b> as ${n}<sup>${r}</sup> = ${fmtN(pow(n, r))}.`, claim: 'codes', bad, goods, fixed: P(n, r), flawed: pow(n, r), why: `${bad} repeats a letter`, fix: `One letter fewer each time: ${prodH(falling(n, r))} = ${fmtN(P(n, r))}` };
}
export const auditImpossible: Gen = (R, n0) => {
  const f = flaw(R);
  const opts: Opt[] = [
    { t: f.bad, ok: true, say: `Yes: Ravi's count includes it, but ${f.why}.` },
    ...f.goods.map(g => ({ t: g, mc: MC.noAudit, say: `That one is allowed. Look for a counted outcome the story forbids.` })),
  ];
  return choice(R, {
    id: `auditImpossible-${n0}`, family: 'auditImpossible',
    prompt: `${f.story} His count includes an outcome that is not allowed. Which one?`,
    board: `\\text{find a forbidden outcome}`,
    solution: [`Each of Ravi's slots allows every option, so it also counts outcomes the story forbids.`, `${f.bad}: ${f.why}.`, `So: ${ans(f.bad)}`],
  }, opts);
};
export const repairCount: Gen = (R, n0) => {
  const f = flaw(R);
  return numItem({
    id: `repairCount-${n0}`, family: 'repairCount',
    prompt: `${f.story} But his count includes ${f.bad}, and ${f.why}. What is the correct number of ${f.claim}?`,
    board: `\\text{repair the count}`, unit: f.claim,
    solution: [`Fill the restricted slot correctly.`, `${f.fix.replace(/= ([\d,]+)$/, (_, x) => `= ${ans(x)}`)}.`],
  }, f.fixed, `Yes: ${fmtN(f.fixed)}.`,
  [[f.flawed, MC.noAudit, `${fmtN(f.flawed)} is Ravi's count, and it includes outcomes like ${f.bad}. Fix the slot that allowed it.`]],
  `Find the slot that let ${f.bad} in, and give it the right number of choices.`);
};

// ===================== audit-double-counting =====================
export const doubleCount: Gen = (R, n0) => {
  const s = 3, j = int(R, 3, 4), names = people(R, s + j), sen = names.slice(0, s), jun = names.slice(s);
  const groups = names.map((_, i) => (i < s ? 0 : 1));
  const two = [sen[0]!, sen[1]!, pick(R, jun)];
  const ones = until(() => Array.from({ length: 3 }, () => [pick(R, sen), ...shuffle(R, jun.slice()).slice(0, 2)]), g => new Set(g.map(x => [...x].sort().join())).size === 3);
  const t = (g: string[]) => andList(shuffle(R, g.slice()));
  const opts: Opt[] = [
    { t: t(two), ok: true, say: `Yes: Mo makes it once with ${two[0]} as the first senior and again with ${two[1]}.` },
    ...ones.map(g => ({ t: t(g), mc: MC.noAudit, say: `That committee has one senior, so Mo makes it in exactly one way (that senior first). Look for one with two seniors.` })),
  ];
  return choice(R, {
    id: `doubleCount-${n0}`, family: 'doubleCount',
    prompt: `Seniors: ${andList(sen)}. Juniors: ${andList(jun)}. Mo counts the 3-person committees with at least one senior: pick a senior first (3 ways), then any 2 of the other ${s + j - 1} people (C(${s + j - 1}, 2) = ${C(s + j - 1, 2)} ways), so 3 × ${C(s + j - 1, 2)} = ${3 * C(s + j - 1, 2)}. Which committee does Mo count more than once?`,
    board: `3 \\times ${C(s + j - 1, 2)} = ${3 * C(s + j - 1, 2)} \\,?`,
    picture: { pics: [{ kind: 'tokens', names, groups, legend: ['seniors', 'juniors'] }] },
    solution: [`A committee is made once for each senior in it that Mo could have picked first.`, `${andList(two)} has two seniors, so Mo makes it twice.`, `So: ${ans(opts[0]!.t)}`],
  }, opts);
};
export const teamsHalve: Gen = (R, n0) => {
  const k = int(R, 2, 5), names = people(R, 2 * k), half = C(2 * k, k), v = half / 2;
  return numItem({
    id: `teamsHalve-${n0}`, family: 'teamsHalve',
    prompt: `${andList(names)} split into two teams of ${k} for ${pick(R, ['a pickup game', 'a trivia night', 'a relay practice', 'a tug of war'])}. The teams have no names or colors: only who is with whom matters. ${who(R)} says there are C(${2 * k}, ${k}) = ${half} splits. How many different splits are there really?`,
    board: `C(${2 * k},${k}) = ${half} \\,?`, unit: 'splits',
    picture: { pics: [{ kind: 'tokens', names }] },
    solution: [`Choosing team 1 = {${names.slice(0, k).join(', ')}} gives the same split as choosing team 1 = {${names.slice(k).join(', ')}}: every split is made by two paths.`, `${half} ÷ 2 = ${ans(v)} splits.`],
  }, v, `Yes: ${half} ÷ 2 = ${v}. Each split was counted from both teams.`,
  [[half, MC.noAudit, `${half} counts each split twice: picking one team picks the other one too.`]],
  `Is any split made by two different choices of the first team?`);
};

// ===================== overlap-repair =====================
export const vennCount: Gen = (R, n0) => {
  const a = int(R, 8, 20), b = int(R, 8, 20), both = int(R, 2, Math.min(a, b) - 2);
  const [na, nb] = pick(R, [['chess', 'soccer'], ['band', 'choir'], ['robotics', 'drama']] as const);
  const v = a + b - both;
  return numItem({
    id: `vennCount-${n0}`, family: 'vennCount',
    prompt: `Every member of a student club is in ${na}, in ${nb}, or in both: ${a} are in ${na}, ${b} are in ${nb}, and ${both} are in both. How many members does the club have?`,
    board: `${a} + ${b} - \\,?`, unit: 'members',
    picture: { pics: [{ kind: 'venn', a: { name: na, total: a }, b: { name: nb, total: b }, both, reveal: { onlyA: a - both, onlyB: b - both } }] },
    solution: [`${a} + ${b} counts the ${both} who do both twice, once in each circle.`, `Subtract them once: ${a} + ${b} − ${both} = ${ans(v)}.`],
  }, v, `Yes: ${a} + ${b} − ${both} = ${v}.`,
  [[a + b, MC.overlap, `${a + b} counts the ${both} students in both activities twice. Subtract the overlap once.`], [a + b - 2 * both, undefined, `${a + b - 2 * both} leaves out the ${both} who do both. They are members too: subtract the overlap only once.`]],
  `Add the two groups, then take away the overlap once.`);
};
const PAIRS: [number, number][] = [[2, 3], [2, 5], [3, 5], [3, 4], [4, 6], [2, 7], [6, 9]];
export const divisibleOr: Gen = (R, n0) => {
  const [p, q] = pick(R, PAIRS), N = pick(R, [20, 24, 30, 36, 40, 48, 50, 60]);
  const a = Math.floor(N / p), b = Math.floor(N / q), L = lcm(p, q), both = Math.floor(N / L);
  const v = Array.from({ length: N }, (_, i) => i + 1).filter(x => x % p === 0 || x % q === 0).length;
  const wrongBoth = Math.floor(N / (p * q));
  return numItem({
    id: `divisibleOr-${n0}`, family: 'divisibleOr',
    prompt: `How many of the whole numbers 1 to ${N} are divisible by ${p} or by ${q} (or by both)?`,
    board: `\\text{divisible by } ${p} \\text{ or } ${q}`, unit: 'numbers',
    picture: { pics: [{ kind: 'venn', a: { name: `÷ ${p}`, total: a }, b: { name: `÷ ${q}`, total: b }, both }] },
    solution: [`Divisible by ${p}: ${a}. By ${q}: ${b}. By both, which means by ${L}: ${both}.`, `The ${both} in both are counted twice in ${a} + ${b}: ${a} + ${b} − ${both} = ${ans(v)}.`],
  }, v, `Yes: ${a} + ${b} − ${both} = ${v}.`,
  [[a + b, MC.overlap, `${a + b} counts the multiples of ${L} twice (they are divisible by both). Subtract them once.`], ...(L !== p * q ? [[a + b - wrongBoth, undefined, `Divisible by both ${p} and ${q} means divisible by ${L} (the least common multiple), not by ${p * q}.`] as [number, undefined, string]] : [])],
  `Count each, then subtract the numbers divisible by both.`);
};

// ===================== uniform-overcount-check =====================
const FL = ['mint', 'kiwi', 'plum', 'lime', 'fig', 'yuzu', 'pear', 'date'];
export const uniformCheck: Gen = (R, n0) => {
  const rep = R() < 0.5, nm = who(R);
  if (rep) {
    const k = pick(R, [4, 6, 8]), fake = (k * k) / 2, real = C(k + 1, 2);
    return choice(R, {
      id: `uniformCheck-${n0}`, family: 'uniformCheck',
      prompt: `${nm} counts the cups of 2 sorbet scoops from ${k} flavors (a cup may have the same flavor twice; the order does not matter) as ${k}² ÷ 2! = ${fake}. Is dividing by 2! right here?`,
      board: `${k}<sup>2</sup> \\div 2! = ${fake} \\,?`,
      solution: [`Among the ${k * k} ordered lists, a cup with two different flavors shows up twice (A then B, B then A), but a cup with the same flavor twice shows up once.`, `The overcount is not the same for every cup, so ÷ 2! does not work (the true count is ${real}).`, `So: ${ans('No: a cup with one flavor twice appears once in the ordered lists, a cup with two flavors twice')}`],
    }, [
      { t: 'No: a cup with one flavor twice appears once in the ordered lists, a cup with two flavors twice', ok: true, say: `Right: the cups with a repeat are not overcounted, so dividing everything by 2 undercounts them. The true count is ${real}.` },
      { t: 'Yes: every cup appears exactly 2! = 2 times in the ordered lists', mc: MC.repeatsDiv, say: `Check a cup with the same flavor twice: there is only one ordered list for it. The overcount is not uniform.` },
      { t: `Yes: ${fake} is a whole number, so the division is fine`, mc: MC.noAudit, say: `A whole number does not prove the count. Check how often each cup appears in the ordered lists.` },
    ]);
  }
  const n = int(R, 5, 8), r = int(R, 2, 3), pr = P(n, r), v = C(n, r);
  return choice(R, {
    id: `uniformCheck-${n0}`, family: 'uniformCheck',
    prompt: `${nm} counts the ${r}-person committees from ${n} people as ${prodH(falling(n, r))} ÷ ${r}! = ${v}. Is dividing by ${r}! right here?`,
    board: `${prodH(falling(n, r)).replace(/×/g, '\\times')} \\div ${r}! = ${v} \\,?`,
    solution: [`The ${pr} ordered lists contain each committee once for each of its ${r}! orders, and every committee has ${r} different people.`, `So every committee is counted exactly ${fact(r)} times, and ÷ ${r}! is right.`, `So: ${ans(`Yes: every committee appears exactly ${r}! = ${fact(r)} times in the ordered list`)}`],
  }, [
    { t: `Yes: every committee appears exactly ${r}! = ${fact(r)} times in the ordered list`, ok: true, say: `Right: the people are all different, so every committee has the same ${fact(r)} orders.` },
    { t: `No: some committees appear fewer times in the ordered list`, say: `With ${r} different people, every committee has exactly ${r}! orders: the overcount is the same for all.` },
    ...(r === 3 ? [{ t: `No: divide by ${r}, the number of people on the committee`, mc: MC.divByR, say: `A committee of ${r} has ${r}! = ${fact(r)} orders, not ${r}.` }] : []),
  ]);
};
export const timesCounted: Gen = (R, n0) => {
  const k = 3, r = int(R, 2, 3), F = shuffle(R, FL.slice()).slice(0, k);
  const kinds = r === 2 ? [[F[0]!, F[0]!], [F[0]!, F[1]!]] : pick(R, [[[F[0]!, F[0]!, F[0]!], [F[0]!, F[0]!, F[1]!]], [[F[0]!, F[0]!, F[1]!], [F[0]!, F[1]!, F[2]!]], [[F[1]!, F[1]!, F[1]!], [F[0]!, F[1]!, F[2]!]]]);
  const count = (m: string[]) => words(F, r).filter(w => [...w].sort().join() === [...m].sort().join()).length;
  const [x, y] = [count(kinds[0]!), count(kinds[1]!)];
  const total = pow(k, r);
  return pairItem({
    id: `timesCounted-${n0}`, family: 'timesCounted',
    prompt: `List all ${total} ordered ways to put ${word(r)} scoops of ${andList(F)} into a cup, one scoop after another (${k}<sup>${r}</sup> = ${total}). How many of those ordered lists give the cup {${kinds[0]!.join(', ')}}, and how many give the cup {${kinds[1]!.join(', ')}}?`,
    board: `${k}^{${r}} = ${total} \\ \\text{ordered lists}`,
    picture: { pics: [{ kind: 'tokens', names: F }] },
    solution: [`{${kinds[0]!.join(', ')}}: the different orders of these scoops. Equal scoops swapped give the same list: ${x}.`, `{${kinds[1]!.join(', ')}}: ${y} different orders.`, `So ${ans(x)} and ${ans(y)}: not the same number, so ÷ ${r}! cannot fix the overcount.`],
  }, x, y, { lead: `{${kinds[0]!.join(', ')}}:`, op: `times; {${kinds[1]!.join(', ')}}:`, tail: 'times' },
  `Yes: ${x} and ${y}. A cup with repeats has fewer orders.`,
  [[fact(r), fact(r), MC.repeatsDiv, `Not every cup has ${r}! orders: swapping two equal scoops gives the same list.`]],
  `Write out the orders of each cup; swapping two equal scoops does not make a new list.`);
};

// ===================== completeness-check =====================
export const listComplete: Gen = (R, n0) => {
  const v = int(R, 0, 2);
  let all: string[], story: string, formula: string;
  const nm = who(R), i0 = int(R, 0, 7), Ls = 'ABCDEFGHKMPR'.slice(i0, i0 + 5).split('');
  if (v === 0) { const L = Ls.slice(0, 3); all = words(L, 2).map(w => w.join('')); story = `${nm} lists every 2-letter code from ${andList(L)} (letters may repeat).`; formula = '3 × 3'; }
  else if (v === 1) { const n = int(R, 4, 5), L = Ls.slice(0, n); all = combs(L, 2).map(c => c.join('')); story = `${nm} lists every 2-person team from the ${word(n)} players ${L.join(', ')} (no roles; ${L[0]}${L[1]} is the same team as ${L[1]}${L[0]}).`; formula = `C(${n}, 2)`; }
  else { all = words(['H', 'T'], 3).map(w => w.join('')); story = `${nm} lists every result of tossing a coin three times, in order (like HTH).`; formula = '2 × 2 × 2'; }
  const gone = pick(R, all), shown = shuffle(R, all.filter(x => x !== gone));
  const rows: { chips: string[] }[] = [];
  for (let i = 0; i < shown.length; i += 5) rows.push({ chips: shown.slice(i, i + 5) });
  const other = pick(R, shown);
  return choice(R, {
    id: `listComplete-${n0}`, family: 'listComplete',
    prompt: `${story} The list has ${shown.length} entries, each one valid and none repeated. Is it complete?`,
    board: `${shown.length} \\text{ entries} \\,?`,
    picture: { pics: [{ kind: 'grid', rows } as CPic] },
    solution: [`The count should be ${formula} = ${all.length}, but the list has ${shown.length}.`, `Running through them in order shows the missing one: ${gone}.`, `So: ${ans(`No: ${gone} is missing`)}`],
  }, [
    { t: `No: ${gone} is missing`, ok: true, say: `Yes: there should be ${all.length}, and ${gone} is the one left out.` },
    { t: 'Yes: every entry is valid and none is repeated', mc: MC.completeList, say: `Valid and not repeated is not enough: there should be ${all.length} entries. Something is missing.` },
    { t: `No: ${other} is missing`, say: `${other} is on the list. Go through the outcomes in an organized order to find the one not there.` },
  ]);
};
export const skippedCase: Gen = (R, n0) => {
  const v = R() < 0.6;
  if (v) {
    const k = int(R, 3, 6), [lo, hi] = pick(R, [[2, 3], [1, 3], [1, 2]] as const);
    const parts = Array.from({ length: hi - lo + 1 }, (_, i) => pow(k, lo + i)), sum = parts.reduce((s, x) => s + x, 0);
    const L = 'ABCDEF'.slice(0, k).split('');
    return numItem({
      id: `skippedCase-${n0}`, family: 'skippedCase',
      prompt: `Codes are ${lo === 1 && hi === 3 ? '1, 2 or 3' : `${lo} or ${hi}`} letters long, from the ${k} letters ${L[0]} to ${L[k - 1]} (letters may repeat). Jay says there are ${k}<sup>${hi}</sup> = ${pow(k, hi)} codes. What is the correct count?`,
      board: `${k}^{${hi}} = ${pow(k, hi)} \\,?`, unit: 'codes',
      picture: { pics: [{ kind: 'slots', rows: [{ caption: "Jay's count", slots: Array.from({ length: hi }, (_, i) => ({ role: `${i + 1}`, n: k })) }] }] },
      solution: [`Jay counts only the ${hi}-letter codes; a code like ${L[0]}${lo === 1 ? '' : L[1]} is valid and is not counted.`, `Add every length: ${parts.map(fmtN).join(' + ')} = ${ans(fmtN(sum))}.`],
    }, sum, `Yes: ${parts.join(' + ')} = ${sum}.`,
    [[pow(k, hi), MC.incomplete, `${pow(k, hi)} counts only the ${hi}-letter codes. The shorter codes are valid too.`]],
    `Which valid codes did Jay never count?`);
  }
  const a = pick(R, [[1, 2], [1, 3], [7, 8], [3, 4]] as const), L = pick(R, [3, 4]);
  const v2 = 2 * pow(10, L - 1);
  return numItem({
    id: `skippedCase-${n0}`, family: 'skippedCase',
    prompt: `A ${L}-digit door code (digits 0 to 9, repeats allowed) must start with ${a[0]} or ${a[1]}. Jay says there are 1 × ${Array(L - 1).fill(10).join(' × ')} = ${fmtN(pow(10, L - 1))} codes. What is the correct count?`,
    board: `1 \\times ${Array(L - 1).fill(10).join(' \\times ')} \\,?`, unit: 'codes',
    picture: { pics: [{ kind: 'slots', rows: [{ caption: "Jay's count", slots: [{ role: 'first', n: 1 }, ...Array.from({ length: L - 1 }, (_, i) => ({ role: `${i + 2}`, n: 10 }))] }] }] },
    solution: [`Jay's first slot has 1 choice, so he counts only the codes starting with ${a[0]}. Codes starting with ${a[1]} are left out.`, `The first digit has 2 choices: 2 × ${Array(L - 1).fill(10).join(' × ')} = ${ans(fmtN(v2))}.`],
  }, v2, `Yes: ${fmtN(v2)}.`,
  [[pow(10, L - 1), MC.incomplete, `${fmtN(pow(10, L - 1))} counts only the codes that start with ${a[0]}. Those starting with ${a[1]} are valid too.`]],
  `Did Jay count the codes starting with ${a[1]}?`);
};

// ===================== verify-count =====================
export const verifyMethod: Gen = (R, n0) => {
  const n = int(R, 4, 6), r = int(R, 2, Math.min(3, n - 2)), v = C(n, r), names = people(R, n);
  const real = pick(R, [
    `Write out every committee of ${r} from the ${n} names in an organized list, and find exactly ${v}`,
    `Count the committees a second way, by the ${n - r} people left out: C(${n}, ${n - r}) = ${v} too, and each committee leaves out exactly one group`,
    `Check that the ${fmtN(P(n, r))} ordered slates contain each committee exactly ${r}! = ${fact(r)} times, so ${fmtN(P(n, r))} ÷ ${fact(r)} = ${v}`,
  ]);
  return choice(R, {
    id: `verifyMethod-${n0}`, family: 'verifyMethod',
    prompt: `Ty says ${andList(names)} can form C(${n}, ${r}) = ${v} committees of ${r} (no roles). Which check actually <b>proves</b> his count (not just makes it look reasonable)?`,
    board: `C(${n},${r}) = ${v} \\,?`,
    picture: { pics: [{ kind: 'tokens', names }] },
    solution: [`A proof must show that every committee is counted, and counted exactly once: an exhaustive list, an independent second method, or a structural argument.`, `Bounds and smaller cases can only catch mistakes.`, `So: ${ans(real)}`],
  }, [
    { t: real, ok: true, say: `Yes: that checks the actual problem completely.` },
    { t: `${v} lies between 1 and ${n}<sup>${r}</sup> = ${pow(n, r)}, so it must be right`, mc: MC.bounds, say: `Lots of wrong answers lie between the bounds too. Bounds can only expose an answer that falls outside them.` },
    { t: `The same method gave the right answer for ${n - 1} people`, mc: MC.examples, say: `A smaller case working is a good sign, but it does not prove this count.` },
    { t: `Every step used a correct formula, so the count is right`, mc: MC.noAudit, say: `A correct formula can be used on the wrong situation. Check the actual outcomes.` },
  ]);
};
export const listVerify: Gen = (R, n0) => {
  const [n, r] = pick(R, [[4, 2], [5, 2], [5, 3], [4, 3], [6, 2]] as const);
  const i0 = int(R, 0, 6), L = 'ABCDEFGHKMPR'.slice(i0, i0 + n).split(''), all = combs(L, r).map(c => c.join(''));
  const nm = who(R), grp = pick(R, ['study groups', 'lab teams', 'committees', 'carpools']);
  const v = all.length, claim = pick(R, [P(n, r), pow(n, r)].filter(x => x !== v));
  const rows = L.map(a => ({ label: a, chips: all.filter(c => c[0] === a) })).filter(x => x.chips.length);
  return numItem({
    id: `listVerify-${n0}`, family: 'listVerify',
    prompt: `${nm} says the ${word(n)} students ${L.join(', ')} can form ${claim} different ${r}-person ${grp} (no roles). Here is a complete organized list of them, one row for each first letter. How many are there really?`,
    board: `${claim} \\,?`, unit: 'groups',
    picture: { pics: [{ kind: 'grid', rows } as CPic] },
    solution: [`Each row fixes the first letter and runs through later letters only, so every group appears exactly once.`, `Count the list: ${rows.map(x => x.chips.length).join(' + ')} = ${ans(v)}.`],
  }, v, `Yes: ${v}. The list proves it: complete, and each group once.`,
  [[claim, MC.noAudit, `${claim} is ${nm}'s number, but the complete list has only ${v}. ${claim === P(n, r) ? 'That counts each group once per order.' : 'That lets a student appear twice and counts orders.'}`]],
  `Count the chips in the list.`);
};
