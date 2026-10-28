// Oracle for the lesson "counting" (HS Statistics: counting, permutations and combinations, probability from counts).
// Written from what the student sees only: the story in the prompt (what it says about order, repetition, roles and
// restrictions), the board, the choices and the drawn picture (trees, organized lists, tokens, slots, Venn totals).
// Every count is worked out from the story, by brute-force enumeration where the outcome set is small and by the
// product / falling-product / binomial structure the story pins down otherwise; probabilities as exact fractions.
// Conceptual choices are judged by testing each claim. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere, nums } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- maths
const fact = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
const P = (n, r) => { if (r < 0 || r > n) return 0; let p = 1; for (let i = 0; i < r; i++) p *= n - i; return p; };
const C = (n, r) => (r < 0 || r > n ? 0 : P(n, r) / fact(r));
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
/** every length-k sequence over the symbols (with or without reuse) */
function seqs(sym, k, reuse) {
  const out = [];
  if (reuse) {
    const rec = pre => { if (pre.length === k) { out.push(pre.slice()); return; } for (const s of sym) { pre.push(s); rec(pre); pre.pop(); } };
    rec([]);
    return out;
  }
  const rec = (pre, used) => { if (pre.length === k) { out.push(pre.slice()); return; } sym.forEach((s, i) => { if (used[i]) return; used[i] = true; pre.push(s); rec(pre, used); pre.pop(); used[i] = false; }); };
  rec([], []);
  return out;
}
/** every r-subset of the items (in the given order) */
function subsets(items, r) {
  const out = [];
  const rec = (start, pre) => { if (pre.length === r) { out.push(pre.slice()); return; } for (let i = start; i < items.length; i++) { pre.push(items[i]); rec(i + 1, pre); pre.pop(); } };
  rec(0, []);
  return out;
}
/** multisets of size r from t kinds, by enumeration (non-decreasing kind index) */
function multisets(t, r) {
  let n = 0;
  const rec = (start, left) => { if (left === 0) { n++; return; } for (let i = start; i < t; i++) rec(i, left - 1); };
  rec(0, r);
  return n;
}

// ---------------------------------------------------------------- reading
const WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const num = s => { const t = String(s).trim().toLowerCase().replace(/,/g, ''); return t in WORDS ? WORDS[t] : /^\d+$/.test(t) ? +t : NaN; };
const NUM = '(\\d[\\d,]*|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)';
const rx = (src, flags = 'i') => new RegExp(src.replace(/#/g, NUM), flags);
/** "a, b and c" / "a and b" / "a, b, c" → [a, b, c] */
const list = s => String(s).split(/,\s*(?:and\s+)?|\s+and\s+/).map(x => x.trim()).filter(Boolean);
/** the names before a verb: "Ben, Lu and Ana line up" → 3 */
const namesBefore = (p, verb) => { const m = p.match(new RegExp(`^(.*?) ${verb}`)); return m ? list(m[1]) : null; };
/** letters "A to G" → 7 letters */
const letterRange = (a, b) => { const out = []; for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) out.push(String.fromCharCode(c)); return out; };
const digitRange = (a, b) => { const out = []; for (let d = +a; d <= +b; d++) out.push(String(d)); return out; };
const pics = q => q.data?.picture?.pics ?? [];
const pic = (q, kind) => pics(q).find(p => p.kind === kind);
const chipsOf = q => (pic(q, 'grid')?.rows ?? []).flatMap(r => r.chips ?? []);
const sortStr = s => [...s].sort().join('');

/** evaluate a choice expression: 8 × 7 ÷ 2!, 6^6, 11! / (5! · 6!), 2! = 2 × 1 (left side) */
function evalExpr(s) {
  let t = String(s).split(' = ')[0].replace(/−/g, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
  t = t.replace(/(\d+)!/g, 'fact($1)');
  if (!/^[\d\s*/+\-().a-z]*$/.test(t.replace(/fact/g, ''))) return NaN;
  try { return Function('fact', `return (${t});`)(fact); } catch { return NaN; }
}
const pickValue = (q, v) => choiceWhere(q, c => Math.abs(evalExpr(c) - v) < 1e-9);

// ---------------------------------------------------------------- story tables
/** does the swap test change the outcome, and can an option be reused? (classify, classifyTests) */
function structureOf(p) {
  const S = [
    [/card hand dealt/, false, false],
    [/Rolling a number cube .* in order/, true, true],
    [/license plate/, true, true],
    [/answer key for .* true\/false/, true, true],
    [/handful of .* coins/, false, true],
    [/handshakes/, false, false],
    [/numbered front-row seats/, true, false],
    [/pizza with .* different toppings/, false, false],
    [/cup of .* sorbet scoops/, false, true],
    [/Gold, silver and bronze/, true, false],
    [/combination lock/, true, true],
    [/order of .* songs on a playlist .*no song twice/, true, false],
    [/box of .* donuts .*any number of each kind/, false, true],
    [/president, a vice president and a treasurer .*at most one job/, true, false],
    [/committee from .* students, picked one at a time/, false, false],
  ];
  for (const [re, order, rep] of S) if (re.test(p)) return { order, rep };
  return null;
}

// ---------------------------------------------------------------- the families
const F = {
  listCount(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/packs \w+ shirts \(([^)]*)\) and \w+ pairs of pants \(([^)]*)\)/))) return list(m[1]).length * list(m[2]).length;
    if ((m = p.match(/makes a sandwich from \w+ bread \(([^)]*)\) and \w+ filling \(([^)]*)\)/))) return list(m[1]).length * list(m[2]).length;
    if ((m = p.match(rx('^You toss a coin \\(H or T\\), then spin a spinner with # equal sections')))) return 2 * num(m[1]);
    if ((m = p.match(rx('tosses # coins, one after another, then spins a spinner with # equal sections')))) return 2 ** num(m[1]) * num(m[2]);
    if ((m = p.match(rx('tosses # coins, one after another, and records H or T')))) return 2 ** num(m[1]);
    return undefined;
  },
  missingOutcome(q) {
    const p = q.prompt;
    const m = p.match(/every (\d+)-(letter|digit) code made from (?:the digits )?(.+?)(?: with no (?:letter|digit) used twice| \(a (?:letter|digit) may be used twice)/);
    if (!m) return undefined;
    const k = +m[1], sym = list(m[3]), reuse = /may be used twice/.test(p);
    const all = seqs(sym, k, reuse).map(s => s.join(''));
    const listed = new Set(chipsOf(q));
    const miss = all.filter(s => !listed.has(s));
    if (miss.length !== 1) return undefined;
    return choiceWhere(q, c => c.trim() === miss[0]);
  },
  swapTest(q) {
    const p = q.prompt;
    let order = null;
    if (/front seat|president and a vice president|bats first|first and the second batter|who came \d+st/.test(p)) order = true;
    if (/committee .*no titles|Only the pair matters|co-captains, with the same title|invites \w+ friends/.test(p)) order = false;
    if (order === null) return undefined;
    return choiceWhere(q, c => (order ? /^Yes/ : /^No/).test(c));
  },
  swapList(q) {
    const p = q.prompt;
    const names = namesBefore(p, 'are in a club');
    if (!names) return undefined;
    const n = names.length;
    let m;
    if (/elect a president, a vice president and a secretary/.test(p)) return P(n, 3);
    if (/elect a president and a vice president/.test(p)) return P(n, 2);
    if (/awards 1st and 2nd place/.test(p)) return P(n, 2);
    if (/awards gold, silver and bronze/.test(p)) return P(n, 3);
    if ((m = p.match(rx('# of them are picked to go on a field trip')))) return C(n, num(m[1]));
    if ((m = p.match(/choose a (\d+)-person committee \(no roles\)/))) return C(n, +m[1]);
    return undefined;
  },
  reuseTest(q) {
    const p = q.prompt;
    const T = [
      [/marbles from a bag at the same time/, false], [/answer key for .* true\/false/, true], [/putting it back/, true],
      [/different prizes .* one prize per student/, false], [/Seating .* friends in .* seats/, false], [/Picking .* books .* shelf/, false],
      [/letters of a word game code, like ZZQ/, true], [/gold, silver and bronze medals/, false], [/Rolling a number cube/, true],
      [/Spinning a spinner .* color each time/, true], [/pitcher may start more than one game/, true], [/digits of a phone PIN/, true],
      [/Dealing .* cards from a deck/, false], [/captain and a goalkeeper .* two different players/, false],
    ];
    const hit = T.find(([re]) => re.test(p));
    if (!hit) return undefined;
    return choiceWhere(q, c => (hit[1] ? /^Yes/ : /^No/).test(c));
  },
  reuseCount(q) {
    const m = q.prompt.match(rx('holds # tokens numbered 1 to (\\d+)\\. You draw a token # times, (keeping it out|putting it back)'));
    if (!m) return undefined;
    const n = num(m[1]), k = num(m[3]);
    if (+m[2] !== n) return undefined;
    return m[4] === 'putting it back' ? n ** k : P(n, k);
  },
  scoopList(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(rx('A jar holds lots of (.+?)\\. You grab # coins')))) return multisets(list(m[1]).length, num(m[2]));
    if ((m = p.match(rx('A cup holds # scoops of sorbet\\. The shop has (.+?), and a cup may have the same flavor more than once')))) return multisets(list(m[2]).length, num(m[1]));
    return undefined;
  },
  sameCup(q) {
    const m = q.prompt.match(/same cup as (.+?)\?$/);
    if (!m) return undefined;
    const key = list(m[1]).sort().join('|');
    return choiceWhere(q, c => list(c).sort().join('|') === key);
  },
  classify(q) {
    const s = structureOf(q.prompt);
    if (!s) return undefined;
    return choiceWhere(q, c => /^Order matters/.test(c) === s.order && /repeats allowed/.test(c) === s.rep);
  },
  classifyTests(q) {
    const s = structureOf(q.prompt);
    if (!s) return undefined;
    return choiceWhere(q, c => /^Swap changes/.test(c) === s.order && /can be reused/.test(c) === s.rep);
  },
  menu(q) {
    const m = q.prompt.match(/There are (.+?)\. How many/);
    if (!m) return undefined;
    return nums(m[1]).reduce((a, b) => a * b, 1);
  },
  productMissing(q) {
    const m = q.prompt.match(/advertises ([\d,]+) different sandwiches.*It has (\d+) breads and (\d+) meats/);
    if (!m) return undefined;
    return num(m[1]) / (+m[2] * +m[3]);
  },
  orAnd(q) {
    const p = q.prompt;
    const m = p.match(/has (\d+) hot dishes and (\d+) cold dishes/);
    if (!m) return undefined;
    const h = +m[1], c = +m[2];
    if (/exactly one dish: a hot one or a cold one/.test(p)) return h + c;
    if (/The combo is one hot dish and one cold dish/.test(p)) return h * c;
    return undefined;
  },
  codeLengths(q) {
    const p = q.prompt;
    let m, n;
    if ((m = p.match(/use the (\d+) symbols/))) n = +m[1];
    else if (/digits long \(0 to 9/.test(p)) n = 10;
    else if (/capital letters long \(A to Z/.test(p)) n = 26;
    if (!n) return undefined;
    if (!/may repeat/.test(p)) return undefined;
    m = p.match(/are (\d+) or (\d+) (?:symbols|digits|capital letters) long|is (\d+) or (\d+) (?:symbols|digits|capital letters) long/);
    if (!m) return undefined;
    const a = +(m[1] ?? m[3]), b = +(m[2] ?? m[4]);
    return n ** a + n ** b;
  },
  pinCount(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/answer key for a (\d+)-question true\/false quiz/))) return 2 ** +m[1];
    if ((m = p.match(/code is (\d+) letters long, made from the (\d+) letters ([A-Z]) to ([A-Z])\. Letters may repeat/))) return letterRange(m[3], m[4]).length ** +m[1];
    if ((m = p.match(/license plate starts with (\d+) capital letters \(A to Z\)\. Letters may repeat/))) return 26 ** +m[1];
    if ((m = p.match(/phone PIN is (\d+) digits \(0 to 9\)\. Digits may repeat/))) return 10 ** +m[1];
    return undefined;
  },
  codeVsNumeral(q) {
    const p = q.prompt;
    const m = p.match(/How many (\d+)-digit (codes|numbers) can be (?:made|written) with the digits (\d) to (\d) \(digits may repeat\)/);
    if (!m) return undefined;
    const k = +m[1];
    const digits = digitRange(m[3], m[4]);
    const all = seqs(digits, k, true);
    if (m[2] === 'codes') { if (!/may start with 0/.test(p)) return undefined; return all.length; }
    if (!/cannot start with 0/.test(p)) return undefined;
    return all.filter(s => s[0] !== '0').length;
  },
  officers(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/A club of (\d+) members elects (.+?), a different member for each office/))) return P(+m[1], list(m[2].replace(/\ba /g, '')).length);
    if ((m = p.match(/picks songs from a list of (\d+) \(no song twice\) for (.+?)\. How many/))) return P(+m[1], (m[2].match(/\d+(?:st|nd|rd|th) song/g) ?? []).length);
    if ((m = p.match(rx('^# runners race(?: in a final)?\\. The officials record (.+?)\\. How many')))) return P(num(m[1]), (m[2].match(/medalist/g) ?? []).length);
    return undefined;
  },
  lineUp(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(rx('can # different books stand in a row')))) return fact(num(m[1]));
    const names = namesBefore(p, 'line up in a row for a photo');
    return names ? fact(names.length) : undefined;
  },
  factorialEval(q) {
    const m = String(q.board).match(/^(\d+)!/) ?? q.prompt.match(/(\d+)!/);
    return m ? fact(+m[1]) : undefined;
  },
  factorialMeaning(q) {
    const p = q.prompt;
    const m = p.match(rx('the ways # (?:friends can line up at a ticket window|different books stand in a row on a shelf|runners can finish a race \\(no ties\\)|dogs can finish a race \\(no ties\\)|different songs can be played in a row|different trophies can stand in a row in a case)'));
    if (!m) return undefined;
    return pickValue(q, fact(num(m[1])));
  },
  permFormula(q) {
    const m = q.prompt.match(/P\((\d+), (\d+)\)/);
    return m ? P(+m[1], +m[2]) : undefined;
  },
  permCancel(q) {
    const m = q.prompt.match(/equals (\d+)! \/ (\d+)!/);
    if (!m) return undefined;
    return pickValue(q, fact(+m[1]) / fact(+m[2]));
  },
  groupsDivide(q) {
    const m = q.prompt.match(/There are ([\d,]+) ways to elect (.+?) from the (\d+) members of a club \(one office each\)\. How many ways are there to choose a (\d+)-person committee \(no roles\) from the same (\d+) members/);
    if (!m) return undefined;
    return C(+m[3], +m[4]);
  },
  handshakes(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/each of (\d+) people shakes hands once with every other person/))) return C(+m[1], 2);
    if ((m = p.match(/league of (\d+) teams .*every team plays every other team exactly once/))) return C(+m[1], 2);
    return undefined;
  },
  overcountFactor(q) {
    const m = q.prompt.match(/A club of (\d+) lists every way to fill its (\d+) offices \((.+?)\), one member per office\. In how many of those lists do exactly (.+?) hold the (\d+) offices/);
    if (!m) return undefined;
    // the lists where exactly these r people hold the r offices: every assignment of them to the offices
    return fact(list(m[4]).length);
  },
  combEval(q) {
    const b = String(q.board);
    let m = b.match(/\\binom\{(\d+)\}\{(\d+)\}/) ?? b.match(/\{\}_\{(\d+)\}C_\{(\d+)\}/) ?? b.match(/C\((\d+),\s*(\d+)\)/);
    return m ? C(+m[1], +m[2]) : undefined;
  },
  combPick(q) {
    const m = q.prompt.match(/gives C\((\d+), (\d+)\), the number of (\d+)-person teams from (\d+) people/);
    if (!m) return undefined;
    return pickValue(q, C(+m[4], +m[3]));
  },
  symShortcut(q) {
    const m = q.prompt.match(/(\d+) of (?:the )?(\d+) (?:posters|players|club members)/);
    return m ? C(+m[2], +m[1]) : undefined;
  },
  symCompare(q) {
    const m = q.prompt.match(/A team of (\d+) players: compare the number of ways to choose (\d+) to sit on the bench, C\(\d+, \d+\), with the number of ways to choose (\d+) to start/);
    if (!m) return undefined;
    const n = +m[1], a = +m[2], b = +m[3];
    const ca = C(n, a), cb = C(n, b);
    if (ca === cb) return choiceWhere(q, c => c.trim() === 'They are equal');
    return choiceWhere(q, c => c.startsWith(`C(${n}, ${ca > cb ? a : b}) is larger`));
  },
  twoGroups(q) {
    const m = q.prompt.match(/needs (\d+) of the (\d+) \w+ and (\d+) of the (\d+) \w+ \(no roles\)/);
    return m ? C(+m[2], +m[1]) * C(+m[4], +m[3]) : undefined;
  },
  chooseOrder(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/chooses (\d+) of (\d+) swimmers for a relay and then decides the order/))) return C(+m[2], +m[1]) * fact(+m[1]);
    if ((m = p.match(rx('A club of (\\d+) chooses a (\\d+)-person committee, and then the committee picks # of its (\\d+) members as chair')))) return C(+m[1], +m[2]) * C(+m[4], num(m[3]));
    return undefined;
  },
  restrictFirst(q) {
    const p = q.prompt;
    let m;
    const names = namesBefore(p, 'line up in a row for a photo');
    if (names && (m = p.match(/\. (\w+) must stand at (the left end|one of the two ends)/))) {
      const who = m[1], n = names.length;
      if (!names.includes(who)) return undefined;
      // brute force for small rows
      const ok = s => (m[2] === 'the left end' ? s[0] === who : s[0] === who || s[n - 1] === who);
      return n <= 8 ? seqs(names, n, false).filter(ok).length : (m[2] === 'the left end' ? 1 : 2) * fact(n - 1);
    }
    if ((m = p.match(/How many (\d+)-digit numbers have all different digits, using only the digits (\d) to (\d)\? \(A \d+-digit number cannot start with 0\.\)/)))
      return seqs(digitRange(m[2], m[3]), +m[1], false).filter(s => s[0] !== '0').length;
    return undefined;
  },
  evenDistinct(q) {
    const m = q.prompt.match(/How many (\d+)-digit (even|odd) numbers have all different digits, using only the digits (\d) to (\d)\?/);
    if (!m) return undefined;
    return seqs(digitRange(m[3], m[4]), +m[1], false).filter(s => s[0] !== '0' && (+s[s.length - 1] % 2 === 0) === (m[2] === 'even')).length;
  },
  atLeastOne(q) {
    const m = q.prompt.match(/A (\d+)-person committee \(no roles\) is chosen from (\d+) seniors and (\d+) juniors\. How many committees have (at least one senior|not all juniors)\?/);
    if (!m) return undefined;
    const r = +m[1], s = +m[2], j = +m[3];
    const people = [...Array(s).fill('S'), ...Array(j).fill('J')].map((x, i) => x + i);
    return subsets(people, r).filter(c => c.some(x => x[0] === 'S')).length;
  },
  repeatDigit(q) {
    const p = q.prompt;
    const m = p.match(/Of all (\d+)-(?:letter|digit) (?:lock codes|passwords|codes) from (?:the (\d+) letters ([A-Z]) to ([A-Z])|the digits (\d) to (\d)) \((?:letters|digits) may repeat/);
    if (!m) return undefined;
    const k = +m[1];
    const n = m[3] ? letterRange(m[3], m[4]).length : digitRange(m[5], m[6]).length;
    return n ** k - P(n, k);
  },
  mixedCount(q) {
    const v = mixedValue(q.prompt);
    return v ?? undefined;
  },
  methodPick(q) {
    const v = mixedValue(q.prompt);
    return v == null ? undefined : pickValue(q, v);
  },
  probComm(q) {
    const m = q.prompt.match(/A (\d+)-person committee is chosen at random from (\d+) seniors and (\d+) juniors \(every committee is equally likely\)\. What is the probability that (?:both|all \w+) members are seniors\?/);
    if (!m) return undefined;
    const r = +m[1], s = +m[2], j = +m[3];
    return Q(C(s, r), C(s + j, r)).pair;
  },
  probBag(q) {
    const p = q.prompt;
    const m = p.match(/A bag holds (\d+) yellow and (\d+) green tokens\. You pull out (\d+) tokens at the same time/);
    if (!m) return undefined;
    const y = +m[1], g = +m[2], k = +m[3];
    const bag = [...Array(y).fill('Y'), ...Array(g).fill('G')].map((c, i) => c + i);
    const all = subsets(bag, k);
    let fav;
    if (/probability of one of each color/.test(p) && k === 2) fav = all.filter(s => s.some(x => x[0] === 'Y') && s.some(x => x[0] === 'G')).length;
    else if (/probability of two yellow tokens/.test(p) && k === 2) fav = all.filter(s => s.every(x => x[0] === 'Y')).length;
    else return undefined;
    return Q(fav, all.length).pair;
  },
  probCode(q) {
    const m = q.prompt.match(/random (\d+)-symbol code from (?:the (\d+) letters ([A-Z]) to ([A-Z])|the digits (\d) to (\d)); symbols may repeat, and every code is equally likely\. What is the probability that all \d+ symbols are different/);
    if (!m) return undefined;
    const k = +m[1], n = m[3] ? letterRange(m[3], m[4]).length : digitRange(m[5], m[6]).length;
    return Q(P(n, k), n ** k).pair;
  },
  auditImpossible(q) {
    const p = q.prompt;
    let m;
    if (/elect a president and a vice president/.test(p))
      return choiceWhere(q, c => { const x = c.match(/^(\w+) as president and (\w+) as vice president$/); return !!x && x[1] === x[2]; });
    if ((m = p.match(/counts the (\d+)-digit numbers/))) return choiceWhere(q, c => /^\d+$/.test(c.trim()) && (c.trim()[0] === '0' || c.trim().length !== +m[1]));
    if ((m = p.match(/counts the (\d+)-letter codes from the letters ([A-Z]) to ([A-Z]) with no letter repeated/))) {
      const L = new Set(letterRange(m[2], m[3])), k = +m[1];
      return choiceWhere(q, c => { const s = c.trim(); return s.length !== k || [...s].some(x => !L.has(x)) || new Set(s).size !== s.length; });
    }
    if ((m = p.match(/^(.+?) line up for a photo with (\w+) at the left end/))) {
      const names = list(m[1]), who = m[2];
      return choiceWhere(q, c => { const s = list(c); return s[0] !== who || s.length !== names.length || sortStr(s.join('\u0000')) !== sortStr(names.join('\u0000')); });
    }
    return undefined;
  },
  repairCount(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/counts the (\d+)-digit numbers \(digits 0 to 9, repeats allowed\)/))) return 9 * 10 ** (+m[1] - 1);
    if ((m = p.match(/a club of (\d+) can elect a president and a vice president/))) return P(+m[1], 2);
    if ((m = p.match(/counts the (\d+)-letter codes from the letters ([A-Z]) to ([A-Z]) with no letter repeated/))) return P(letterRange(m[2], m[3]).length, +m[1]);
    if ((m = p.match(/^(.+?) line up for a photo with (\w+) at the left end/))) { const n = list(m[1]).length; return fact(n - 1); }
    return undefined;
  },
  doubleCount(q) {
    const p = q.prompt;
    const m = p.match(/^Seniors: (.+?)\. Juniors: (.+?)\. \w+ counts the (\d+)-person committees with at least one senior: pick a senior first/);
    if (!m) return undefined;
    const S = new Set(list(m[1])), J = new Set(list(m[2])), r = +m[3];
    // Mo's method reaches a committee once for each senior in it (that senior picked first)
    return choiceWhere(q, c => { const x = list(c); return x.length === r && new Set(x).size === r && x.every(y => S.has(y) || J.has(y)) && x.filter(y => S.has(y)).length > 1; });
  },
  teamsHalve(q) {
    const p = q.prompt;
    const m = p.match(rx('^(.+?) split into two teams of (\\d+) for'));
    if (!m) return undefined;
    const names = list(m[1]), t = +m[2];
    if (names.length !== 2 * t) return undefined;
    // unnamed teams: each split is fixed by the team of the first person
    return subsets(names.slice(1), t - 1).length;
  },
  vennCount(q) {
    const m = q.prompt.match(/in both: (\d+) are in \w+, (\d+) are in \w+, and (\d+) are in both/);
    return m ? +m[1] + +m[2] - +m[3] : undefined;
  },
  divisibleOr(q) {
    const m = q.prompt.match(/whole numbers (\d+) to (\d+) are divisible by (\d+) or by (\d+)/);
    if (!m) return undefined;
    let n = 0;
    for (let x = +m[1]; x <= +m[2]; x++) if (x % +m[3] === 0 || x % +m[4] === 0) n++;
    return n;
  },
  uniformCheck(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/counts the (\d+)-person committees from (\d+) people as/))) {
      // distinct people: each committee of r appears r! times among the ordered selections
      return choiceWhere(q, c => /^Yes: every committee appears exactly/.test(c));
    }
    if ((m = p.match(/counts the cups of (\d+) sorbet scoops from (\d+) flavors \(a cup may have the same flavor twice; the order does not matter\)/))) {
      // repeats allowed: a one-flavor cup appears once in the ordered list, a two-flavor cup twice, so ÷ 2! does not work
      return choiceWhere(q, c => /^No:/.test(c) && /one flavor twice appears once/.test(c) && /two flavors twice/.test(c));
    }
    return undefined;
  },
  timesCounted(q) {
    const p = q.prompt;
    const m = p.match(/give the cup \{(.+?)\}, and how many give the cup \{(.+?)\}\?/);
    const k = p.match(rx('put # scoops of'));
    if (!m || !k) return undefined;
    const r = num(k[1]);
    const times = cup => { const s = list(cup); if (s.length !== r) return NaN; const cnt = {}; s.forEach(x => (cnt[x] = (cnt[x] ?? 0) + 1)); return Object.values(cnt).reduce((a, c) => a / fact(c), fact(r)); };
    return [times(m[1]), times(m[2])];
  },
  listComplete(q) {
    const p = q.prompt;
    let m, all, norm = s => s;
    if ((m = p.match(/every (\d+)-letter code from (.+?) \(letters may repeat\)/))) all = seqs(list(m[2]), +m[1], true).map(s => s.join(''));
    else if ((m = p.match(rx('every result of tossing a coin # times, in order')))) all = seqs(['H', 'T'], num(m[1]), true).map(s => s.join(''));
    else if ((m = p.match(/every (\d+)-person team from the \w+ players (.+?) \(no roles/))) { all = subsets(list(m[2]), +m[1]).map(s => s.join('')); norm = sortStr; all = all.map(norm); }
    else return undefined;
    const listed = chipsOf(q).map(norm);
    const full = new Set(all);
    const valid = listed.every(s => full.has(s)) && new Set(listed).size === listed.length;
    const missing = all.filter(s => !listed.includes(s));
    if (valid && missing.length === 0) return choiceWhere(q, c => /^Yes/.test(c));
    return choiceWhere(q, c => { const x = c.match(/^No: (\w+) is missing$/); return !!x && missing.includes(norm(x[1])); });
  },
  skippedCase(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^Codes are ([\d, or]+) letters long, from the (\d+) letters ([A-Z]) to ([A-Z]) \(letters may repeat\)/))) {
      const n = letterRange(m[3], m[4]).length;
      return nums(m[1]).reduce((s, L) => s + n ** L, 0);
    }
    if ((m = p.match(/A (\d+)-digit door code \(digits 0 to 9, repeats allowed\) must start with (\d) or (\d)\./))) {
      const k = +m[1];
      return (m[2] !== m[3] ? 2 : 1) * 10 ** (k - 1);
    }
    return undefined;
  },
  verifyMethod(q) {
    const m = q.prompt.match(/says (.+?) can form C\((\d+), (\d+)\) = ([\d,]+) committees of (\d+) \(no roles\)/);
    if (!m) return undefined;
    const names = list(m[1]), n = names.length, r = +m[5], truth = C(n, r);
    if (+m[2] !== n || +m[3] !== r || num(m[4]) !== truth) return undefined;
    const proves = c => {
      let x;
      if ((x = c.match(/^Check that the ([\d,]+) ordered slates contain each committee exactly (\d+)! = (\d+) times, so ([\d,]+) ÷ (\d+) = ([\d,]+)$/)))
        return num(x[1]) === P(n, r) && +x[2] === r && +x[3] === fact(r) && num(x[4]) === P(n, r) && +x[5] === fact(r) && num(x[6]) === truth;
      if ((x = c.match(/^Count the committees a second way, by the (\d+) people left out: C\((\d+), (\d+)\) = ([\d,]+) too, and each committee leaves out exactly one group$/)))
        return +x[1] === n - r && +x[2] === n && +x[3] === n - r && num(x[4]) === truth;
      if ((x = c.match(/^Write out every committee of (\d+) from the (\d+) names in an organized list, and find exactly ([\d,]+)$/)))
        return +x[1] === r && +x[2] === n && num(x[3]) === truth;
      return false; // a formula label, a bound or a smaller case does not prove a count
    };
    return choiceWhere(q, proves);
  },
  listVerify(q) {
    const m = q.prompt.match(/the \w+ students (.+?) can form [\d,]+ different (\d+)-person [\w ]+ \(no roles\)/);
    if (!m) return undefined;
    return C(list(m[1]).length, +m[2]);
  },
};

/** the five structures of choose-the-method items, from the story */
function mixedValue(p) {
  let m;
  if ((m = p.match(/From (\d+) runners in a final, the officials record who wins gold and who wins silver/))) return P(+m[1], 2);
  if ((m = p.match(/From (\d+) runners in a final, the officials record who wins gold, silver and bronze/))) return P(+m[1], 3);
  if ((m = p.match(/A pizza gets (\d+) different toppings from a list of (\d+)/))) return C(+m[2], +m[1]);
  if ((m = p.match(/A (\d+)-person committee is chosen from (\d+) students by drawing names one at a time/))) return C(+m[2], +m[1]);
  if ((m = p.match(/(\d+) of (\d+) guests are seated in (\d+) numbered chairs, one guest per chair/))) return +m[1] === +m[3] ? P(+m[2], +m[1]) : null;
  if ((m = p.match(/A code is (\d+) letters long, from the (\d+) letters ([A-Z]) to ([A-Z]) \(letters may repeat\)/))) return letterRange(m[3], m[4]).length ** +m[1];
  if ((m = p.match(/A (\d+)-digit code for a combination lock uses the digits (\d) to (\d) \(digits may repeat\)/))) return digitRange(m[2], m[3]).length ** +m[1];
  return null;
}

// ---------------------------------------------------------------- sanity (fairness for a 14- to 18-year-old)
function sane(q) {
  const p = q.prompt, out = [];
  const blob = [p, q.board, ...(q.choices ?? []), JSON.stringify(q.data ?? {}), JSON.stringify(q.pair ?? {})].join(' ');
  if (/undefined|NaN|null\b/.test(blob.replace(/"null"/g, ''))) out.push('text or picture shows undefined/NaN/null');
  if (q.choices && new Set(q.choices.map(c => c.trim())).size !== q.choices.length) out.push('two identical choices');
  let m;
  switch (q.family) {
    case 'listCount': {
      const t = pic(q, 'tree');
      const v = F.listCount(q);
      if (t && v !== undefined) { const prod = t.levels.reduce((a, l) => a * l.opts.length, 1); if (prod !== v) out.push(`tree has ${prod} leaves, story gives ${v}`); }
      // the number words must match the lists they name
      for (const x of p.matchAll(/(\w+) (?:shirts|pairs of pants) \(([^)]*)\)/g)) if (num(x[1]) !== list(x[2]).length) out.push(`"${x[1]}" but ${list(x[2]).length} listed`);
      if ((m = p.match(rx('spinner with # equal sections: (.+?) \\(')))) if (num(m[1]) !== list(m[2]).length) out.push('spinner section count does not match the colors');
      break;
    }
    case 'missingOutcome': {
      const mm = p.match(/every (\d+)-(letter|digit) code made from (?:the digits )?(.+?)(?: with no| \(a)/);
      if (mm) {
        const all = new Set(seqs(list(mm[3]), +mm[1], /may be used twice/.test(p)).map(s => s.join('')));
        const ch = chipsOf(q);
        if (ch.some(c => !all.has(c))) out.push('the list holds a code that is not allowed');
        if (new Set(ch).size !== ch.length) out.push('the list repeats a code');
        if (all.size - new Set(ch).size !== 1) out.push(`${all.size - new Set(ch).size} codes missing, not one`);
      }
      break;
    }
    case 'menu': {
      const s = pic(q, 'slots');
      const mm = p.match(/There are (.+?)\. How many/);
      if (s && mm) { const a = nums(mm[1]), b = s.rows[0].slots.map(x => x.n); if (a.join() !== b.join()) out.push('slot counts differ from the story'); }
      break;
    }
    case 'productMissing': { const v = F.productMissing(q); if (v !== undefined && !Number.isInteger(v)) out.push('the missing count is not a whole number'); break; }
    case 'orAnd': {
      const g = pic(q, 'grid'), mm = p.match(/has (\d+) hot dishes and (\d+) cold dishes/);
      if (g && mm && (g.rows[0].chips.length !== +mm[1] || g.rows[1].chips.length !== +mm[2])) out.push('picture dish counts differ from the story');
      break;
    }
    case 'groupsDivide': {
      const mm = p.match(/There are ([\d,]+) ways to elect (.+?) from the (\d+) members .* choose a (\d+)-person committee/);
      if (mm) {
        const roles = list(mm[2].replace(/\ba /g, '')).length;
        if (roles !== +mm[4]) out.push('committee size differs from the number of offices');
        if (num(mm[1]) !== P(+mm[3], roles)) out.push(`the given ordered count ${mm[1]} is not P(${mm[3]}, ${roles})`);
      }
      break;
    }
    case 'overcountFactor': {
      const mm = p.match(/A club of (\d+) lists every way to fill its (\d+) offices \((.+?)\), one member per office\. In how many of those lists do exactly (.+?) hold the (\d+) offices/);
      if (mm && (list(mm[3]).length !== +mm[2] || list(mm[4]).length !== +mm[2] || +mm[1] < +mm[2])) out.push('offices / people do not match');
      break;
    }
    case 'symShortcut': {
      const mm = p.match(/(\d+) of (?:the )?(\d+) /), b = String(q.board).match(/C\((\d+),(\d+)\)/);
      if (mm && b && (+b[1] !== +mm[2] || +b[2] !== +mm[1])) out.push('board C(n, r) differs from the story');
      break;
    }
    case 'twoGroups': case 'atLeastOne': case 'probComm': case 'probBag': case 'doubleCount': {
      const t = pic(q, 'tokens');
      const nn = p.match(/(\d+) (?:sopranos|seniors|guards|yellow)\b.*?(\d+) (?:altos|juniors|forwards|green)\b/);
      if (t?.groups && nn) {
        const a = t.groups.filter(g => g === 0).length, b = t.groups.filter(g => g === 1).length;
        if (q.family !== 'twoGroups' && (a !== +nn[1] || b !== +nn[2])) out.push('token groups differ from the story');
      }
      if (q.family === 'probBag' && /two yellow/.test(p) && (m = p.match(/holds (\d+) yellow/)) && +m[1] < 2) out.push('two yellow asked from fewer than 2 yellow');
      if (q.family === 'probComm' && (m = p.match(/A (\d+)-person committee is chosen at random from (\d+) seniors/)) && +m[2] < +m[1]) out.push('probability 0: fewer seniors than seats');
      if (q.family === 'atLeastOne' && (m = p.match(/A (\d+)-person committee \(no roles\) is chosen from (\d+) seniors and (\d+) juniors/)) && +m[2] + +m[3] < +m[1]) out.push('committee larger than the group');
      if (q.family === 'twoGroups' && (m = p.match(/needs (\d+) of the (\d+) \w+ and (\d+) of the (\d+)/)) && (+m[1] > +m[2] || +m[3] > +m[4])) out.push('more picked than in the group');
      break;
    }
    case 'handshakes': {
      const t = pic(q, 'tokens'), mm = p.match(/each of (\d+) people/);
      if (t && mm && t.names.length !== +mm[1]) out.push('token count differs from the story');
      break;
    }
    case 'evenDistinct': {
      const mm = p.match(/(even|odd) numbers .* digits (\d) to (\d)/);
      for (const r of pic(q, 'slots')?.rows ?? []) {
        const cap = r.caption?.match(/^last digit (.+)$/);
        if (cap && mm && cap[1] !== '0') {
          const want = digitRange(mm[2], mm[3]).filter(d => d !== '0' && (+d % 2 === 0) === (mm[1] === 'even'));
          if (list(cap[1]).join() !== want.join()) out.push(`caption "${r.caption}" differs from the allowed digits`);
        }
      }
      break;
    }
    case 'vennCount': {
      const v = pic(q, 'venn'), mm = p.match(/in both: (\d+) are in \w+, (\d+) are in \w+, and (\d+) are in both/);
      if (mm && +mm[3] > Math.min(+mm[1], +mm[2])) out.push('overlap larger than a set');
      if (v && mm && (v.a.total !== +mm[1] || v.b.total !== +mm[2] || v.both !== +mm[3])) out.push('Venn totals differ from the story');
      break;
    }
    case 'divisibleOr': {
      const v = pic(q, 'venn'), mm = p.match(/whole numbers (\d+) to (\d+) are divisible by (\d+) or by (\d+)/);
      if (v && mm) {
        const N = +mm[2], a = +mm[3], b = +mm[4], l = a * b / gcd(a, b);
        if (v.a.total !== Math.floor(N / a) || v.b.total !== Math.floor(N / b) || v.both !== Math.floor(N / l)) out.push('Venn totals are not the true multiples');
      }
      break;
    }
    case 'uniformCheck': {
      const mm = p.match(/as (.+?) = ([\d,]+)\. Is dividing/);
      if (mm) { const v = evalExpr(mm[1].replace(/²/g, '^2')); if (v !== num(mm[2])) out.push('the claimed arithmetic is wrong'); }
      break;
    }
    case 'listComplete': {
      const mm = p.match(/The list has (\d+) entries/);
      if (mm && chipsOf(q).length !== +mm[1]) out.push('entry count differs from the picture');
      break;
    }
    case 'listVerify': {
      const mm = p.match(/the \w+ students (.+?) can form [\d,]+ different (\d+)-person/);
      if (mm) {
        const all = new Set(subsets(list(mm[1]), +mm[2]).map(s => s.join('')));
        const ch = chipsOf(q).map(sortStr);
        if (ch.length !== all.size || ch.some(c => !all.has(c)) || new Set(ch).size !== ch.length) out.push('the "complete organized list" is not complete');
      }
      break;
    }
    case 'teamsHalve': {
      const mm = p.match(/says there are C\((\d+), (\d+)\) = ([\d,]+) splits/);
      if (mm && C(+mm[1], +mm[2]) !== num(mm[3])) out.push('the quoted C value is wrong');
      break;
    }
    case 'skippedCase': {
      if ((m = p.match(/must start with (\d) or (\d)/)) && m[1] === m[2]) out.push('the two allowed first digits are the same');
      break;
    }
  }
  return out.join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    return f ? f(q) : undefined;
  },
  sane,
};
