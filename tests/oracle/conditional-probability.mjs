// Oracle for the lesson "conditional-probability" (HS Statistics: conditional probability and independence).
// Written from what the student sees only: the story in the prompt, the board, the choices and the drawn picture
// (the dice grid, the number chips, the two-way table with its labels and counts, Venn region values, tree branch
// probabilities, the spinner legend, the dot plot). Events are rebuilt from their words and counted by enumerating
// the sample space (one die, two dice, 1..N, a 52-card deck, a bag of counters); table questions are read off the
// row / column labels the board names (or the story's words mapped onto the drawn labels); every probability is an
// exact fraction; independence is P(A | B) = P(A) exactly (or the stated tolerance for sample data).
// The highlight marks in the picture data (A, B, cond, parts, whole, paths, leaf values) are never used as answers.
// See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere, nums, fracs, texPlain, round } from '../../tools/quality/oracle-kit.mjs';

// ================================================================ small maths
const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
const isPrime = n => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const isSquare = n => n > 0 && Number.isInteger(Math.sqrt(n));
const q = v => Q(String(v).replace(/%$/, '')); // a decimal text → exact fraction
const pct = s => (/%/.test(s) ? Q(String(s).replace('%', '')).div(100) : Q(String(s)));
const sameSet = (a, b) => a.length === b.length && [...a].sort((x, y) => x - y).every((v, i) => v === [...b].sort((x, y) => x - y)[i]);
const terminates = f => { let d = f.d; for (const p of [2, 5]) while (d % p === 0) d /= p; return d === 1; };
/** the value of a decimal/percent/fraction answer text "0.25", "1/6", "25%" */
const valOf = s => { const t = String(s).trim(); if (/^\d+\/\d+$/.test(t)) return Q(t); if (/^\d+(\.\d+)?$/.test(t)) return Q(t); return null; };
const texFrac = s => { const m = String(s).match(/\\[td]?frac\{(\d+)\}\{(\d+)\}/); if (m) return Q(+m[1], +m[2]); return Q(String(s)); };

// ================================================================ events on numbers (1..N, one die)
/** "even", "a multiple of 3", "greater than 4", "prime (2, 3 or 5)", "a 6", "1 or 2", "7", "both even and odd" → predicate */
function numPred(text) {
  const t = String(text).trim().replace(/\.$/, '').replace(/^(the (number|roll|card) is|is|shows)\s+/, '').trim();
  let m;
  if (t === 'even') return n => n % 2 === 0;
  if (t === 'odd') return n => n % 2 === 1;
  if (/^both even and odd$/.test(t)) return () => false;
  if (/^(a )?prime\b/.test(t)) return isPrime;
  if (/^a perfect square$/.test(t)) return isSquare;
  if ((m = t.match(/^a multiple of (\d+)$/))) return n => n % +m[1] === 0;
  if ((m = t.match(/^a factor of (\d+)$/))) return n => +m[1] % n === 0;
  if ((m = t.match(/^(?:greater than|more than|over) (\d+)$/))) return n => n > +m[1];
  if ((m = t.match(/^less than (\d+)$/))) return n => n < +m[1];
  if ((m = t.match(/^at least (\d+)$/))) return n => n >= +m[1];
  if ((m = t.match(/^at most (\d+)$/))) return n => n <= +m[1];
  if ((m = t.match(/^(?:a |an )?(\d+)$/))) return n => n === +m[1];
  if ((m = t.match(/^(\d+) or (\d+)$/))) return n => n === +m[1] || n === +m[2];
  if ((m = t.match(/^between (\d+) and (\d+)$/))) return n => n >= +m[1] && n <= +m[2];
  return null;
}
/** the sample space of a one-number story: "from 1 to N", "numbered 1 to N", "one fair die" */
function numberSpace(p) {
  let m;
  if ((m = p.match(/(?:from|numbered) 1 to (\d+)/))) return range(1, +m[1]);
  if (/one fair die|a fair die|one die|standard die|number cube/.test(p)) return range(1, 6);
  return null;
}
/** the events "A: ... . B: ... ." (or "Event A: ...") */
function eventsAB(p) {
  const m = p.match(/(?:Event )?A: (.*?)\.\s+(?:Event )?B: (.*?)\.(?:\s|$)/);
  return m ? { A: m[1].replace(/\s*\(P = [\d.]+\)$/, ''), B: m[2].replace(/\s*\(P = [\d.]+\)$/, '') } : null;
}

// ================================================================ events on two dice (red, blue)
const DICE = []; for (let r = 1; r <= 6; r++) for (let b = 1; b <= 6; b++) DICE.push([r, b]);
function dicePred(text) {
  const t = String(text).trim().replace(/\.$/, '');
  let m;
  if (/^(the roll is a double|the roll is doubles|both dice (are |show )?the same|a double)/.test(t)) return ([r, b]) => r === b;
  if ((m = t.match(/^the two dice differ by (\d+)$/))) return ([r, b]) => Math.abs(r - b) === +m[1];
  if ((m = t.match(/^at least one die shows (\d+)$/))) return ([r, b]) => r === +m[1] || b === +m[1];
  if ((m = t.match(/^(?:the )?sum is (.+)$/))) { const f = numPred(m[1]); return f && (([r, b]) => f(r + b)); }
  if ((m = t.match(/^the (red|blue) die (?:is |shows )(.+)$/))) {
    const f = numPred(m[2]), k = m[1] === 'red' ? 0 : 1;
    return f && (rb => f(rb[k]));
  }
  if ((m = t.match(/^the (red|blue) die shows (\d+)$/))) { const k = m[1] === 'red' ? 0 : 1; return rb => rb[k] === +m[2]; }
  return null;
}
const nDice = f => DICE.filter(f).length;

// ================================================================ a standard deck
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['H', 'D', 'C', 'S'];
const DECK = SUITS.flatMap(s => RANKS.map(r => ({ r, s })));
function cardPred(text) {
  const t = String(text).trim().replace(/^the (?:first |second )?card is /, '').replace(/\.$/, '');
  const R = { 'an ace': 'A', 'a king': 'K', 'a queen': 'Q', 'a jack': 'J' };
  const S = { 'a heart': 'H', 'a diamond': 'D', 'a club': 'C', 'a spade': 'S' };
  if (t in R) return c => c.r === R[t];
  if (t in S) return c => c.s === S[t];
  if (t === 'red') return c => c.s === 'H' || c.s === 'D';
  if (t === 'black') return c => c.s === 'C' || c.s === 'S';
  if (t === 'a face card') return c => ['J', 'Q', 'K'].includes(c.r);
  return null;
}

// ================================================================ two-way tables
const pics = q0 => q0.data?.picture?.pics ?? [];
const picOf = (q0, kind) => pics(q0).find(p => p.kind === kind);
function tableOf(q0) {
  const t = picOf(q0, 'table');
  if (!t) return null;
  const cells = t.cells.map(r => r.map(Number));
  const rowSum = cells.map(r => r.reduce((a, b) => a + b, 0));
  const colSum = cells[0].map((_, j) => cells.reduce((a, r) => a + r[j], 0));
  const total = rowSum.reduce((a, b) => a + b, 0);
  const shown = nums(String(t.title ?? '').replace(/,/g, ''))[0];
  return { t, rows: t.rows, cols: t.cols, cells, rowSum, colSum, total, shown };
}
const norm = s => String(s).toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
/** a board / story label → { dim: 'row'|'col', i } */
function labelAt(T, label) {
  const l = norm(label);
  let i = T.rows.findIndex(r => norm(r) === l);
  if (i >= 0) return { dim: 'row', i };
  i = T.cols.findIndex(c => norm(c) === l);
  if (i >= 0) return { dim: 'col', i };
  return null;
}
const countOf = (T, a, b) => {
  if (a && !b) return a.dim === 'row' ? T.rowSum[a.i] : T.colSum[a.i];
  const r = a.dim === 'row' ? a : b, c = a.dim === 'col' ? a : b;
  if (r.dim !== 'row' || c.dim !== 'col') return NaN;
  return T.cells[r.i][c.i];
};
/** the \text{...} labels on the board, in order */
const boardLabels = b => [...String(b ?? '').matchAll(/\\text\{([^{}]*)\}/g)].map(m => m[1].trim());

// story words → drawn labels (the words a student reads for each label); a negative label is tried before its positive
const LEX = {
  'mornings': /morning/i, 'evenings': /evening/i,
  'class': /class/i, 'no class': /no (?:fitness )?class|not take a (?:fitness )?class|don.t take a/i,
  'grade 9': /ninth|grade 9\b/i, 'grade 12': /twelfth|grade 12\b/i, 'grade 10': /tenth|grade 10\b/i, 'grade 11': /eleventh|grade 11\b/i,
  'buys': /\bbuys?\b|\bbuying\b/i, 'brings': /\bbrings?\b|\bbringing\b/i, 'skips': /\bskips?\b|\bskipping\b/i,
  'breakfast': /breakfast/i, 'no breakfast': /skip(?:s|ping)? breakfast|no breakfast|(?:not|n.t) eat breakfast/i,
  'on time': /on.time/i, 'late': /\blate\b/i,
  'job': /\bjob\b/i, 'no job': /no (?:part-time )?job|without a (?:part-time )?job|(?:not|n.t) have a (?:part-time )?job/i,
  'license': /license/i, 'no license': /no (?:driver.s )?license|without a (?:driver.s )?license|(?:not|n.t) have a (?:driver.s )?license/i,
  'band': /\bband\b/i, 'no band': /not in the band|no band|non-band/i,
  'sport': /sport|athlete/i, 'no sport': /no sport|(?:not|n.t) play a sport/i,
  'flu shot': /flu shot|\bshot\b/i, 'no shot': /no (?:flu )?shot|(?:not|n.t) get a (?:flu )?shot|without a (?:flu )?shot/i,
  'got flu': /got the flu|get the flu|had the flu/i, 'no flu': /(?:not|n.t) get the flu|no flu(?! shot)|stayed well/i,
  'yes': /voted yes|yes voters|\byes\b/i, 'no': /voted no|no voters/i,
  '18-29': /18 to 29|18-29/i, '30-49': /30 to 49|30-49/i, '50+': /50 or over|50 and over|50\+/i,
  'varsity': /varsity/i, 'not varsity': /not (?:on a )?varsity|(?:not|n.t) play a varsity|non-varsity/i,
  'honor roll': /honor/i, 'not on it': /not on the honor roll|not on it/i,
  'coffee': /coffee/i, 'no coffee': /no coffee|skip coffee|(?:not|n.t) drink coffee/i,
  '7+ hours': /7\+|at least 7|7 or more/i, 'under 7': /under 7|less than 7|fewer than 7/i,
  'ap class': /\bAP\b/, 'no ap': /no AP\b|(?:not|n.t) take an AP|without an AP/,
  'bus': /\bbus\b/i, 'car': /\bcar\b/i, 'walk': /\bwalk/i,
  'condition': /condition/i, 'no condition': /no condition|without the condition|(?:not|n.t) have the condition/i,
  'positive': /positive/i, 'negative': /negative/i,
};
const isNeg = l => /^(no|not|under)\b/i.test(l);
/** the labels a phrase names, at most one per dimension, with where they appear in the phrase */
function labelsIn(T, phrase) {
  const out = [];
  for (const [dim, list] of [['row', T.rows], ['col', T.cols]]) {
    const order = list.map((l, i) => ({ l, i })).sort((a, b) => isNeg(b.l) - isNeg(a.l));
    for (const { l, i } of order) {
      const re = LEX[norm(l)];
      if (!re) continue;
      const m = re.exec(phrase);
      if (m) { out.push({ dim, i, at: m.index, label: l }); break; }
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

// ================================================================ words overlap (which event is the condition?)
const STOP = new Set(['the', 'who', 'are', 'was', 'were', 'has', 'have', 'and', 'that', 'fraction', 'probability', 'one', 'picked', 'random', 'also', 'among', 'with', 'all', 'is', 'of', 'a', 'an', 'in', 'on', 'it', 'its', 'their']);
const stems = s => new Set(String(s).toLowerCase().replace(/athletes?/g, 'sport').split(/[^a-z0-9+]+/).filter(w => (w.length >= 3 || w === 'ap') && !STOP.has(w)).map(w => w.slice(0, 4)));
const overlap = (a, b) => { const B = stems(b); return [...stems(a)].filter(w => B.has(w)).length; };

// ================================================================ bags of counters and two draws
/** "A bag holds 2 green and 4 white counters" / "A box has 2 gold and 4 silver balls" → [{color, n}] */
function bagOf(p) {
  const m = p.match(/(?:holds|has) (\d+) (\w+) and (\d+) (\w+) (?:counters|balls|marbles|chips)/);
  return m ? [{ c: m[2], n: +m[1] }, { c: m[4], n: +m[3] }] : null;
}
/** every ordered pair of draws (equally likely) as [colorFirst, colorSecond] */
function drawPairs(bag, replace) {
  const items = bag.flatMap(g => Array(g.n).fill(g.c));
  const out = [];
  items.forEach((x, i) => items.forEach((y, j) => { if (replace || i !== j) out.push([x, y]); }));
  return out;
}
const withRepl = p => (/without replacement|keep it out|not put back|doesn.t put|no replacement/.test(p) ? false : /with replacement|put it back|goes back|replaced/.test(p) ? true : null);

// ================================================================ choice helpers
const choiceIs = (q0, text) => choiceWhere(q0, c => norm(c) === norm(text));
const choiceStarts = (q0, re) => choiceWhere(q0, c => re.test(c));
/** a set choice "{1, 2, 3}" or "no outcomes (the empty set)" → array of numbers */
const setOf = c => (/empty set|no outcomes/.test(c) ? [] : (String(c).match(/\{([^}]*)\}/)?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean).map(Number));
/** the value an answer choice states at its start: "1/6, the same as P(A)" → 1/6, "0" → 0, "undefined..." → 'undef' */
const leadVal = c => { const t = String(c).trim(); if (/^undefined/.test(t)) return 'undef'; const m = t.match(/^(\d+\/\d+|\d+(?:\.\d+)?)/); return m ? Q(m[1]) : null; };
/** evaluate "0.2 × 0.3 = 0.06" (left side) */
function evalLeft(c) {
  const t = String(c).split('=')[0].replace(/×/g, '*').replace(/−/g, '-').trim();
  if (!/^[\d.\s*+\-/()]+$/.test(t)) return NaN;
  try { return Function(`return (${t});`)(); } catch { return NaN; }
}

// ================================================================ the families
const F = {
  // ---------------- sample spaces and events
  diceCount(q0) {
    const m = q0.prompt.match(/How many outcomes (?:have|are there where|are there in which|have where) (.*)\?/);
    const f = m && dicePred(m[1]);
    return f ? nDice(f) : undefined;
  },
  treeCount(q0) {
    const p = q0.prompt;
    let n = 1, k = 0;
    for (const m of p.matchAll(/\(([^()]*,[^()]*)\)/g)) { n *= m[1].split(/,\s*/).length; k++; }
    for (const m of p.matchAll(/numbered 1 to (\d+)/g)) { n *= +m[1]; k++; }
    for (const _ of p.matchAll(/toss(?:es)? a coin/g)) { n *= 2; k++; }
    return k >= 2 ? n : undefined;
  },
  andDice(q0) { const e = eventsAB(q0.prompt), a = dicePred(e?.A), b = dicePred(e?.B); return a && b ? nDice(x => a(x) && b(x)) : undefined; },
  orDice(q0) { const e = eventsAB(q0.prompt), a = dicePred(e?.A), b = dicePred(e?.B); return a && b ? nDice(x => a(x) || b(x)) : undefined; },
  notDice(q0) {
    const m = q0.prompt.match(/Event A: (.*?)\. How many/);
    const a = m && dicePred(m[1]);
    return a ? 36 - nDice(a) : undefined;
  },
  restrictDice(q0) {
    let m;
    if ((m = q0.prompt.match(/^You roll one die and a friend tells you (.*?)\. Given that/))) { const f = numPred(m[1]); return f ? range(1, 6).filter(f).length : undefined; }
    m = q0.prompt.match(/told that (.*?)\. Given that/);
    const f = m && dicePred(m[1]);
    return f ? nDice(f) : undefined;
  },
  andList(q0) { return listChoice(q0, (a, b) => a && b); },
  orList(q0) { return listChoice(q0, (a, b) => a || b); },
  notVenn(q0) {
    const v = picOf(q0, 'venn')?.vals, N = +q0.prompt.match(/class of (\d+)/)?.[1];
    if (!v || !N) return undefined;
    return N - +v.a - +(v.ab ?? 0);
  },

  // ---------------- tables: structure
  tableRead(q0) {
    const T = tableOf(q0), B = boardLabels(q0.board);
    if (!T || !B.length) return undefined;
    const not = B.length === 1 && /^not /.test(B[0]); // n(not X): everyone outside the X row / column
    const L = B.map(l => labelAt(T, l.replace(/^not /, '')));
    if (L.some(x => !x)) return undefined;
    return not ? T.total - countOf(T, L[0]) : countOf(T, L[0], L[1]);
  },
  tableFill(q0) {
    const T = tableOf(q0), h = T?.t.hide?.[0];
    if (!T || !h) return undefined;
    const [r, c] = h.split(',').map(Number);
    // the hidden cell: the grand total in the title minus every count that is drawn
    return T.shown - T.cells.flat().reduce((a, b) => a + b, 0) + T.cells[r][c];
  },
  restrictTable(q0) {
    const T = tableOf(q0), m = q0.prompt.match(/picked at random, (.*?)\. Which part/);
    if (!T || !m) return undefined;
    const L = labelsIn(T, m[1]);
    if (L.length !== 1) return undefined;
    const [x] = L, word = x.dim === 'row' ? 'row' : 'column', n = countOf(T, x);
    return choiceWhere(q0, c => norm(c).startsWith(norm(`the ${x.label} ${word}`)) && nums(c).at(-1) === n);
  },

  // ---------------- notation
  notationRead(q0) {
    const e = eventsAB(q0.prompt), m = q0.prompt.match(/What does P\((\w) \| (\w)\) mean/);
    if (!e || !m) return undefined;
    const tgt = e[m[1]], cnd = e[m[2]];
    return choiceWhere(q0, c => {
      const k = c.match(/^Of the (.*?), the fraction who (.*)$/);
      if (!k) return false;
      return overlap(k[1], cnd) + overlap(k[2], tgt) > overlap(k[1], tgt) + overlap(k[2], cnd);
    });
  },
  notationWrite(q0) {
    const e = eventsAB(q0.prompt), p = q0.prompt;
    if (!e) return undefined;
    let m, cnd, tgt;
    if ((m = p.match(/means among the (.*?), the probability that one picked at random (.*)\?$/))) [cnd, tgt] = [m[1], m[2]];
    else if ((m = p.match(/means the probability that an? \w+ who (.*?) also (.*)\?$/))) [cnd, tgt] = [m[1], m[2]];
    else if ((m = p.match(/means the probability that (.*?), given that (.*)\?$/))) [tgt, cnd] = [m[1], m[2]];
    else return undefined;
    const core = s => norm(s).replace(/^(?:the|an?) \w+ (?:who )?|^\w+ who /, '');
    const which = s => {
      if (core(s) === core(e.A)) return 'A';
      if (core(s) === core(e.B)) return 'B';
      const a = overlap(s, e.A), b = overlap(s, e.B);
      return a > b ? 'A' : b > a ? 'B' : null;
    };
    const C = which(cnd), T = which(tgt);
    if (!C || !T || C === T) return undefined;
    return choiceIs(q0, `P(${T} | ${C})`);
  },

  // ---------------- the new whole
  spinnerCond(q0) {
    const s = picOf(q0, 'spinner'), m = q0.prompt.match(/did not land on (\w+)\. What is the probability it landed on (\w+)\?/);
    if (!s || !m) return undefined;
    const p = l => texFrac(s.sectors.find(x => x.label === l).p);
    return p(m[2]).div(Q(1).sub(p(m[1]))).pair;
  },
  jarCond(q0) {
    const p = q0.prompt, m = p.match(/holds ((?:\d+ \w+,? ?)+) marbles/), k = p.match(/"It's not (\w+)\." What is the probability it is (\w+)\?/);
    if (!m || !k) return undefined;
    const jar = Object.fromEntries([...m[1].matchAll(/(\d+) (\w+)/g)].map(x => [x[2], +x[1]]));
    const tot = Object.values(jar).reduce((a, b) => a + b, 0);
    return Q(jar[k[2]], tot - jar[k[1]]).pair;
  },
  zeroOrUndef(q0) {
    const e = eventsAB(q0.prompt), S = numberSpace(q0.prompt), a = numPred(e?.A), b = numPred(e?.B);
    if (!S || !a || !b) return undefined;
    const nB = S.filter(b).length, nAB = S.filter(x => a(x) && b(x)).length;
    if (nB === 0) return choiceStarts(q0, /^undefined/);
    const v = Q(nAB, nB);
    return choiceWhere(q0, c => { const l = leadVal(c); return l && l !== 'undef' && l.eq(v); });
  },
  zeroFormula(q0) {
    const p = q0.prompt, b = p.match(/P\(B\) = (\d*\.?\d+)/), ab = p.match(/P\(A and B\) = (\d*\.?\d+)/);
    if (!b || !ab) return undefined;
    if (Q(b[1]).eq(0)) return choiceStarts(q0, /^undefined/);
    const v = Q(ab[1]).div(Q(b[1]));
    return choiceWhere(q0, c => { const l = leadVal(c); return l && l !== 'undef' && l.eq(v); });
  },

  // ---------------- conditional by counting
  condDice(q0) {
    const e = eventsAB(q0.prompt), a = dicePred(e?.A), b = dicePred(e?.B);
    if (!a || !b) return undefined;
    return Q(nDice(x => a(x) && b(x)), nDice(b)).pair;
  },
  condNumbers(q0) {
    const e = eventsAB(q0.prompt), S = numberSpace(q0.prompt), a = numPred(e?.A), b = numPred(e?.B);
    if (!S || !a || !b) return undefined;
    return Q(S.filter(x => a(x) && b(x)).length, S.filter(b).length).pair;
  },
  tableCond(q0) { return boardCond(q0); },
  tableSwitch(q0) { return boardCond(q0); },
  reverseTable(q0) { return boardCond(q0); },
  screenTable(q0) { return boardCond(q0); },

  // ---------------- building a table from records
  buildCell(q0) {
    const code = q0.board.match(/cell\s*\}?\s*([YN]{2})/)?.[1] ?? texPlain(q0.board).match(/cell ([YN]{2})/)?.[1];
    const items = picOf(q0, 'chips')?.items;
    if (!code || !items) return undefined;
    return items.filter(x => x === code).length;
  },
  buildCond(q0) {
    const ch = picOf(q0, 'chips'), L = boardLabels(q0.board);
    if (!ch || L.length !== 2) return undefined;
    const vars = String(ch.title).split('?').map(s => s.trim().toLowerCase()).filter(Boolean);
    // a label → which letter of the card, Y or N ("No shot" is N of "Flu shot?", "Late" is N of "On time?")
    const code = label => {
      const OTHER = { late: 'on time', evenings: 'mornings', 'not on it': 'honor roll' };
      if (OTHER[norm(label)]) { const k = vars.indexOf(OTHER[norm(label)]); return k < 0 ? null : { k, ch: 'N' }; }
      const neg = /^(no|not|under)\b/i.test(label);
      const base = label.replace(/^(no|not|under)\s+/i, '').toLowerCase();
      let k = vars.indexOf(base);
      if (k < 0) k = vars.findIndex(v => v.endsWith(base));
      if (k < 0) k = vars.findIndex(v => v.startsWith(base.split(' ')[0]) || base.startsWith(v.split(' ')[0]));
      return k < 0 ? null : { k, ch: neg ? 'N' : 'Y' };
    };
    const t = code(L[0]), c = code(L[1]);
    if (!t || !c || t.k === c.k) return undefined;
    const inC = ch.items.filter(x => x[c.k] === c.ch);
    return Q(inC.filter(x => x[t.k] === t.ch).length, inC.length).pair;
  },

  // ---------------- relative frequencies
  relKind(q0) {
    const T = tableOf(q0), f = fracs(texPlain(q0.board))[0], m = q0.board.match(/\\dfrac\{(\d+)\}\{(\d+)\}/);
    if (!T || !m) return undefined;
    const n = +m[1], d = +m[2];
    const reads = [];
    if (d === T.total) {
      T.cells.forEach((r, i) => r.forEach((v, j) => { if (v === n) reads.push({ kind: 'joint' }); }));
      T.rowSum.forEach(v => { if (v === n) reads.push({ kind: 'marginal' }); });
      T.colSum.forEach(v => { if (v === n) reads.push({ kind: 'marginal' }); });
    }
    T.rowSum.forEach((v, i) => { if (v === d) T.cells[i].forEach(x => { if (x === n) reads.push({ kind: 'conditional', dim: 'row', i }); }); });
    T.colSum.forEach((v, j) => { if (v === d) T.cells.forEach(r => { if (r[j] === n) reads.push({ kind: 'conditional', dim: 'col', i: j }); }); });
    if (reads.length !== 1) return undefined;
    const [r] = reads;
    if (r.kind !== 'conditional') return choiceStarts(q0, new RegExp(`^${r.kind}:`));
    return choiceWhere(q0, c => {
      if (!/^conditional:/.test(c)) return false;
      const L = labelsIn(T, c.replace(/^conditional: the share of the /, ''));
      return L.length === 2 && L[0].dim === r.dim && L[0].i === r.i;
    });
  },
  relCompute(q0) {
    const T = tableOf(q0), m = q0.prompt.match(/what percent of (all )?the (.*?)\? Round/);
    if (!T || !m) return undefined;
    const L = labelsIn(T, m[2]);
    let num, den;
    if (m[1]) { // of all: a joint or a marginal share
      if (L.length === 2) num = countOf(T, L[0], L[1]);
      else if (L.length === 1) num = countOf(T, L[0]);
      else return undefined;
      den = T.total;
    } else {
      if (L.length !== 2) return undefined;
      num = countOf(T, L[0], L[1]); den = countOf(T, L[0]);
    }
    return round((100 * num) / den, 0);
  },
  assocClaim(q0) {
    const T = tableOf(q0);
    if (!T) return undefined;
    // which column the claims are about: the one whose rounded row shares the choices quote
    for (let j = 0; j < T.cols.length; j++) {
      const s = T.cells.map((r, i) => round((100 * r[j]) / T.rowSum[i], 0));
      const hit = choiceWhere(q0, c => {
        const k = c.match(/^A larger share of the (.*?) \(about (\d+)%\) than of the (.*?) \(about (\d+)%\)/);
        if (!k) return false;
        const p1 = +k[2], p2 = +k[4];
        if (!(p1 > p2)) return false;
        const g1 = labelsIn(T, k[1]).find(x => x.dim === 'row'), g2 = labelsIn(T, k[3]).find(x => x.dim === 'row');
        return g1 && g2 && g1.i !== g2.i && s[g1.i] === p1 && s[g2.i] === p2;
      });
      if (hit >= 0) return hit;
    }
    return undefined;
  },
  approxIndep(q0) {
    const T = tableOf(q0), m = q0.prompt.match(/the share who (.*?) differs by less than (\d+(?:\.\d+)?) percentage points between the rows/);
    if (!T || !m) return undefined;
    const L = labelsIn(T, m[1]).filter(x => x.dim === 'col');
    if (L.length !== 1) return undefined;
    const j = L[0].i, s = T.cells.map((r, i) => Q(100 * r[j], T.rowSum[i]));
    const gap = s[0].sub(s[1]).value, tol = +m[2];
    if (Math.abs(gap) < tol) return choiceStarts(q0, /^Approximately independent in this sample/);
    return choiceWhere(q0, c => { const k = c.match(/^Not approximately independent: the gap is about (\d*\.?\d+) points/); return !!k && Math.abs(+k[1] - Math.abs(gap)) <= 0.051; });
  },

  // ---------------- reverse
  reverseClaim(q0) {
    const m = q0.prompt.match(/, (\d*\.?\d+)% fit (A|B)\. Here A: .*?, and B: /);
    if (!m) return undefined;
    const prop = m[2], cond = prop === 'A' ? 'B' : 'A', v = Q(m[1]).div(100);
    return choiceWhere(q0, c => { const k = c.match(/^P\((\w) \| (\w)\) = (\d*\.?\d+)$/); return !!k && k[1] === prop && k[2] === cond && Q(k[3]).eq(v); });
  },

  // ---------------- the formula
  formulaDec(q0) {
    const p = q0.prompt, b = p.match(/P\(B\) = (\d*\.?\d+%?)/), ab = p.match(/P\(A and B\) = (\d*\.?\d+%?)/);
    if (!b || !ab) return undefined;
    return pct(ab[1]).div(pct(b[1])).value;
  },
  formulaVenn(q0) {
    const m = q0.prompt.match(/A only (\d*\.?\d+), both (\d*\.?\d+), B only (\d*\.?\d+), neither (\d*\.?\d+)\. Find P\((\w) \| (\w)\)/);
    if (!m) return undefined;
    const a = Q(m[1]), ab = Q(m[2]), b = Q(m[3]);
    return (m[6] === 'B' ? ab.div(ab.add(b)) : ab.div(ab.add(a))).pair;
  },

  // ---------------- independence
  indepTable(q0) {
    const T = tableOf(q0), L = boardLabels(q0.board);
    if (!T || L.length < 2) return undefined;
    const a = labelAt(T, L[0]), b = labelAt(T, L[1]);
    if (!a || !b || a.dim === b.dim) return undefined;
    const ind = Q(countOf(T, a, b), countOf(T, b)).eq(Q(countOf(T, a), T.total));
    return ind ? choiceStarts(q0, /^Independent: P\(.*\) equals P\(/) : choiceStarts(q0, /^Dependent: P\(.*\) is different from P\(/);
  },
  indepModel(q0) {
    const e = eventsAB(q0.prompt);
    if (!e) return undefined;
    let ind;
    if (/52-card deck/.test(q0.prompt)) {
      const a = cardPred(e.A), b = cardPred(e.B);
      if (!a || !b) return undefined;
      ind = Q(DECK.filter(c => a(c) && b(c)).length, DECK.filter(b).length || 1).eq(Q(DECK.filter(a).length, 52)) && DECK.some(b);
    } else {
      const S = numberSpace(q0.prompt), a = numPred(e.A), b = numPred(e.B);
      if (!S || !a || !b) return undefined;
      const nB = S.filter(b).length;
      if (!nB) return undefined;
      ind = Q(S.filter(x => a(x) && b(x)).length, nB).eq(Q(S.filter(a).length, S.length));
    }
    return ind ? choiceStarts(q0, /^Independent: P\(A \| B\) equals P\(A\)/) : choiceStarts(q0, /^Dependent: P\(A \| B\) is different from P\(A\)/);
  },
  productTest(q0) {
    const p = q0.prompt, a = p.match(/P\(A\) = (\d*\.?\d+)/), b = p.match(/P\(B\) = (\d*\.?\d+)/), ab = p.match(/P\(A and B\) = (\d*\.?\d+)/);
    if (!a || !b || !ab) return undefined;
    const prod = Q(a[1]).mul(Q(b[1])), given = Q(ab[1]);
    if (prod.eq(given)) return choiceWhere(q0, c => { const k = c.match(/^Independent: P\(A\) × P\(B\) = (\d*\.?\d+) = P\(A and B\)$/); return !!k && Q(k[1]).eq(prod); });
    return choiceWhere(q0, c => { const k = c.match(/^Dependent: P\(A\) × P\(B\) = (\d*\.?\d+), but P\(A and B\) = (\d*\.?\d+)$/); return !!k && Q(k[1]).eq(prod) && Q(k[2]).eq(given); });
  },
  productForward(q0) {
    const p = q0.prompt;
    const ps = [...p.matchAll(/probability (\d*\.\d+|\d+)/g)].map(m => Q(m[1]));
    const pc = [...p.matchAll(/(\d+(?:\.\d+)?)%/g)].map(m => Q(m[1]).div(100));
    const all = [...ps, ...pc];
    if (all.length === 2) return all[0].mul(all[1]).value;
    if (all.length === 1 && /both/.test(p)) return all[0].mul(all[0]).value;
    return undefined;
  },

  // ---------------- draws
  replaceCond(q0) {
    const bag = bagOf(q0.prompt), r = withRepl(q0.prompt), m = q0.prompt.match(/P\(second is (\w+) \| first was (\w+)\)/);
    if (!bag || r === null || !m) return undefined;
    const P = drawPairs(bag, r), first = P.filter(x => x[0] === m[2]);
    return Q(first.filter(x => x[1] === m[1]).length, first.length).pair;
  },
  replaceDecide(q0) {
    const p = q0.prompt, r = withRepl(p), e = eventsAB(p);
    if (r === null || !e) return undefined;
    let pBA, pB;
    if (/standard deck/.test(p)) {
      const a = cardPred(e.A), b = cardPred(e.B);
      if (!a || !b) return undefined;
      let nA = 0, nAB = 0, nB = 0, n = 0;
      DECK.forEach((x, i) => DECK.forEach((y, j) => { if (!r && i === j) return; n++; if (a(x)) { nA++; if (b(y)) nAB++; } if (b(y)) nB++; }));
      pBA = Q(nAB, nA); pB = Q(nB, n);
    } else {
      const bag = bagOf(p), ca = e.A.match(/first is (\w+)/)?.[1], cb = e.B.match(/second is (\w+)/)?.[1];
      if (!bag || !ca || !cb) return undefined;
      const P = drawPairs(bag, r), A = P.filter(x => x[0] === ca);
      pBA = Q(A.filter(x => x[1] === cb).length, A.length); pB = Q(P.filter(x => x[1] === cb).length, P.length);
    }
    const fr = c => fracs(c);
    if (pBA.eq(pB)) return choiceWhere(q0, c => /^Independent: P\(B \| A\) = P\(B\) =/.test(c) && fr(c).length === 1 && fr(c)[0].eq(pB));
    return choiceWhere(q0, c => /^Dependent: P\(B \| A\) =/.test(c) && fr(c)[0]?.eq(pBA) && (fr(c).length < 2 || fr(c)[1].eq(pB)));
  },
  twoDraws(q0) {
    const bag = bagOf(q0.prompt), r = withRepl(q0.prompt), m = q0.prompt.match(/probability both are (\w+)\?/);
    if (!bag || r === null || !m) return undefined;
    const P = drawPairs(bag, r);
    return Q(P.filter(x => x[0] === m[1] && x[1] === m[1]).length, P.length).pair;
  },
  treePath(q0) {
    const bag = bagOf(q0.prompt), r = withRepl(q0.prompt), m = q0.prompt.match(/the first is (\w+) and the second is (\w+)\?/);
    if (!bag || r === null || !m) return undefined;
    const P = drawPairs(bag, r);
    return Q(P.filter(x => x[0] === m[1] && x[1] === m[2]).length, P.length).pair;
  },
  laterEvent(q0) {
    const bag = bagOf(q0.prompt), r = withRepl(q0.prompt), m = q0.prompt.match(/second ball: it is (\w+)\. What is the probability the first ball was (\w+)\?/);
    if (!bag || r === null || !m) return undefined;
    const S = drawPairs(bag, r).filter(x => x[1] === m[1]);
    return Q(S.filter(x => x[0] === m[2]).length, S.length).pair;
  },

  // ---------------- multiplication rule
  multCount(q0) {
    const p = q0.prompt;
    let m;
    if ((m = p.match(/affects (\d*\.?\d+)% of people\. A screening test catches it in (\d*\.?\d+)% of people who have it\. Out of ([\d,]+) people/))) {
      return Q(m[3].replace(/,/g, '')).mul(Q(m[1]).div(100)).mul(Q(m[2]).div(100)).value;
    }
    const v = [...p.matchAll(/(?:\) = |is )(\d*\.\d+|\d+)(?=[.\s])/g)].map(x => Q(x[1]));
    if (v.length < 2) return undefined;
    return v.reduce((a, b) => a.mul(b)).value;
  },
  multChoose(q0) {
    const p = q0.prompt;
    let want, m;
    if ((m = p.match(/^P\((.*?)\) = (\d*\.?\d+)\. Overall, P\((.*?)\) = (\d*\.?\d+), but P\((.*?) \| (.*?)\) = (\d*\.?\d+)\./))) want = Q(m[2]).mul(Q(m[7]));
    else if (/independent/.test(p) && /both/.test(p)) {
      const x = (m = p.match(/(\d+(?:\.\d+)?)%/)) ? Q(m[1]).div(100) : (m = p.match(/probability (\d*\.\d+)/)) ? Q(m[1]) : null;
      if (!x) return undefined;
      want = x.mul(x);
    } else return undefined;
    return choiceWhere(q0, c => /×/.test(c) && Math.abs(evalLeft(c) - want.value) < 1e-9);
  },

  // ---------------- mutually exclusive, addition rule
  exclWhich(q0) {
    return choiceWhere(q0, c => {
      const ev = [...c.matchAll(/"([^"]*)"/g)].map(m => numPred(m[1]));
      if (ev.length !== 2 || ev.some(f => !f)) return false;
      return range(1, 6).every(n => !(ev[0](n) && ev[1](n)));
    });
  },
  exclYesNo(q0) {
    const e = eventsAB(q0.prompt), S = numberSpace(q0.prompt), a = numPred(e?.A), b = numPred(e?.B);
    if (!S || !a || !b) return undefined;
    const both = S.filter(x => a(x) && b(x));
    if (!both.length) return choiceStarts(q0, /^Yes: no outcome is in both/);
    return choiceWhere(q0, c => {
      if (/^No: some number is in both/.test(c)) return true;
      const k = c.match(/^No: ([\d, ]+) (?:is|are) in both/);
      return !!k && sameSet(nums(k[1]), both);
    });
  },
  addTable(q0) {
    const T = tableOf(q0), m = q0.prompt.match(/What is the probability the \w+ (.*?) \(or both\)\?/);
    if (!T || !m) return undefined;
    const L = labelsIn(T, m[1]);
    if (L.length !== 2 || L[0].dim === L[1].dim) return undefined;
    return Q(countOf(T, L[0]) + countOf(T, L[1]) - countOf(T, L[0], L[1]), T.total).pair;
  },
  addGiven(q0) {
    const p = q0.prompt, a = p.match(/P\(A\) = (\d*\.?\d+)/), b = p.match(/P\(B\) = (\d*\.?\d+)/);
    if (!a || !b) return undefined;
    const A = Q(a[1]), B = Q(b[1]);
    let m;
    if (/What is P\(A or B\)/.test(p)) {
      if (/mutually exclusive/.test(p)) return A.add(B).value;
      if ((m = p.match(/P\(A and B\) = (\d*\.?\d+)/))) return A.add(B).sub(Q(m[1])).value;
    }
    if (/What is P\(A and B\)/.test(p) && (m = p.match(/P\(A or B\) = (\d*\.?\d+)/))) return A.add(B).sub(Q(m[1])).value;
    return undefined;
  },
  addDice(q0) {
    const m = q0.prompt.match(/probability that (.*)\?$/);
    if (!m) return undefined;
    const parts = m[1].split(' or ');
    for (let k = 1; k < parts.length; k++) {
      const a = dicePred(parts.slice(0, k).join(' or ')), b = dicePred(parts.slice(k).join(' or '));
      if (a && b) return Q(nDice(x => a(x) || b(x)), 36).pair;
    }
    return undefined;
  },

  // ---------------- disjoint vs independent
  exclDep(q0) {
    const p = q0.prompt;
    let prod;
    const pa = p.match(/^A: .*?\(P = (\d*\.?\d+)\)/), pb = p.match(/B: .*?\(P = (\d*\.?\d+)\)/);
    if (pa && pb) prod = Q(pa[1]).mul(Q(pb[1]));
    else {
      const e = eventsAB(p), a = numPred(e?.A), b = numPred(e?.B);
      if (!a || !b) return undefined;
      const S = range(1, 6);
      if (S.some(x => a(x) && b(x))) return undefined; // not disjoint after all: no right answer to find
      prod = Q(S.filter(a).length, 6).mul(Q(S.filter(b).length, 6));
    }
    if (prod.eq(0)) return choiceStarts(q0, /^Independent: P\(A and B\) = 0 = P\(A\) × P\(B\)/);
    return choiceWhere(q0, c => { const k = c.match(/^Dependent: P\(A and B\) = 0, but P\(A\) × P\(B\) = (\S+)$/); return !!k && Q(k[1]).eq(prod); });
  },
  exclDepWhy(q0) {
    // the general argument: P(X | Y) = 0 because they cannot happen together, while P(X) > 0
    return choiceWhere(q0, c => { const k = c.match(/^P\((\w) \| (\w)\) = 0, but P\((\w)\) > 0, so knowing (\w) changes the chance of (\w)$/); return !!k && k[1] === k[3] && k[2] === k[4] && k[1] === k[5] && k[1] !== k[2]; });
  },
  classifyVenn(q0) {
    const v = picOf(q0, 'venn')?.vals;
    if (!v) return undefined;
    const ab = Q(v.ab ?? '0'), A = Q(v.a ?? '0').add(ab), B = Q(v.b ?? '0').add(ab);
    return classify(q0, ab.eq(0), A.mul(B).eq(ab));
  },
  classifyList(q0) {
    const e = eventsAB(q0.prompt), S = numberSpace(q0.prompt), a = numPred(e?.A), b = numPred(e?.B);
    if (!S || !a || !b) return undefined;
    const nA = S.filter(a).length, nB = S.filter(b).length, nAB = S.filter(x => a(x) && b(x)).length;
    return classify(q0, nAB === 0, Q(nAB, S.length).eq(Q(nA * nB, S.length * S.length)));
  },
  emptyEvent(q0) {
    const e = eventsAB(q0.prompt), S = numberSpace(q0.prompt), a = numPred(e?.A), b = numPred(e?.B);
    if (!S || !a || !b) return undefined;
    const nA = S.filter(a).length, nB = S.filter(b).length, nAB = S.filter(x => a(x) && b(x)).length;
    const me = nAB === 0, ind = Q(nAB, S.length).eq(Q(nA * nB, S.length * S.length));
    if (me && ind) return choiceIs(q0, 'Mutually exclusive and independent');
    if (me) return choiceIs(q0, 'Mutually exclusive, so dependent');
    if (ind) return choiceIs(q0, 'Independent, but not mutually exclusive');
    return choiceIs(q0, 'Neither');
  },
  emptyWhich(q0) {
    return choiceWhere(q0, c => {
      const ev = [...c.matchAll(/"([^"]*)"/g)].map(m => numPred(m[1]));
      if (ev.length !== 2 || ev.some(f => !f)) return false;
      const S = range(1, 6), nA = S.filter(ev[0]).length, nB = S.filter(ev[1]).length, nAB = S.filter(x => ev[0](x) && ev[1](x)).length;
      return nAB === 0 && nA * nB === 0;
    });
  },

  // ---------------- sample variation
  dotsUnusual(q0) {
    const d = picOf(q0, 'dots'), m = q0.prompt.match(/(\d+)% of students .*? gave (\d*\.?\d+)\. Is that unusual/);
    if (!d || !m) return undefined;
    const p = +m[1] / 100, far = Math.abs(+m[2] - p);
    const k = d.vals.filter(v => Math.abs(v - p) >= far - 1e-9).length;
    if (k === 0) return choiceStarts(q0, /^Unusual: none of the/);
    return choiceWhere(q0, c => { const x = c.match(/^Not unusual: (\d+) of the (\d+) simulated samples/); return !!x && +x[1] === k && +x[2] === d.vals.length; });
  },
  dotsTwoGroups(q0) {
    const d = picOf(q0, 'dots'), m = q0.prompt.match(/gave a proportion of (\d*\.?\d+);.*? gave (\d*\.?\d+)\..*?population with proportion (\d*\.?\d+)/);
    if (!d || !m) return undefined;
    const p = +m[3], spread = Math.max(...d.vals.map(v => Math.abs(v - p)));
    const inside = [+m[1], +m[2]].every(x => Math.abs(x - p) <= spread + 1e-9);
    return inside ? choiceStarts(q0, /^No: both values are well within/) : undefined;
  },

  // ---------------- context
  freeThrow(q0) {
    return choiceWhere(q0, c => {
      const k = c.match(/^P\((.+?) \| (.+?)\) vs\. P\((.+?) \| (.+?)\)$/);
      return !!k && k[1] === k[3] && k[2] !== k[4] && /first/.test(k[2]) && /first/.test(k[4]) && !/first/.test(k[1]);
    });
  },

  // ---------------- total probability, Bayes, base rates
  totalTwo(q0) {
    const m = q0.prompt.match(/^P\((.*?)\) = (\d*\.?\d+)\. If .*?, P\((.*?)\) = (\d*\.?\d+); otherwise P\((.*?)\) = (\d*\.?\d+)\./);
    if (!m) return undefined;
    const a = Q(m[2]);
    return a.mul(Q(m[4])).add(Q(1).sub(a).mul(Q(m[6]))).value;
  },
  totalThree(q0) {
    const m = q0.prompt.match(/A makes (\d*\.?\d+)% .*?B makes (\d*\.?\d+)%, C makes (\d*\.?\d+)%\. Their defect rates are (\d*\.?\d+)%, (\d*\.?\d+)% and (\d*\.?\d+)%/);
    if (!m) return undefined;
    const v = m.slice(1).map(x => Q(x).div(100));
    return v[0].mul(v[3]).add(v[1].mul(v[4])).add(v[2].mul(v[5])).value;
  },
  bayesScreen(q0) {
    const b = bayesNums(q0.prompt);
    if (!b) return undefined;
    return round(b.post.value, 3);
  },
  bayesMachine(q0) {
    const m = q0.prompt.match(/make (\d*\.?\d+)%, (\d*\.?\d+)% and (\d*\.?\d+)% .*?defect rates (\d*\.?\d+)%, (\d*\.?\d+)% and (\d*\.?\d+)%\..*?came from machine (\w)\?/);
    if (!m) return undefined;
    const v = m.slice(1, 7).map(x => Q(x).div(100)), k = 'ABC'.indexOf(m[7]);
    const parts = [0, 1, 2].map(i => v[i].mul(v[i + 3]));
    return parts[k].div(parts[0].add(parts[1]).add(parts[2])).pair;
  },
  baseRateCompare(q0) {
    const m = q0.prompt.match(/positive for (\d*\.?\d+)% of people with a condition and for (\d*\.?\d+)% of people without it\. In a group where (\d*\.?\d+)% have/);
    if (!m) return undefined;
    const s = Q(m[1]).div(100), f = Q(m[2]).div(100), p = Q(m[3]).div(100);
    const v = p.mul(s).div(p.mul(s).add(Q(1).sub(p).mul(f))).value;
    return choiceWhere(q0, c => { const k = c.match(/^about (\d*\.?\d+)$/); return !!k && Math.abs(+k[1] - v) < 0.0051; });
  },
  secondTest(q0) {
    const m = q0.prompt.match(/positive for (\d*\.?\d+)% of people with a condition and (\d*\.?\d+)% of people without it\. After one positive result, a person's probability of having the condition is (\d*\.?\d+)\. .*?comes back (positive|negative)/);
    if (!m) return undefined;
    const s = Q(m[1]).div(100), f = Q(m[2]).div(100), p = Q(m[3]);
    const [l1, l0] = m[4] === 'positive' ? [s, f] : [Q(1).sub(s), Q(1).sub(f)];
    return round(p.mul(l1).div(p.mul(l1).add(Q(1).sub(p).mul(l0))).value, 3);
  },
};

// ---------------------------------------------------------------- shared readers
/** A ∩ B / A ∪ B on numbers 1..N as a set choice (listed once) */
function listChoice(q0, op) {
  const e = eventsAB(q0.prompt), S = numberSpace(q0.prompt), a = numPred(e?.A), b = numPred(e?.B);
  if (!S || !a || !b) return undefined;
  const want = S.filter(x => op(a(x), b(x)));
  return choiceWhere(q0, c => sameSet(setOf(c), want));
}
/** P(X | Y) with X, Y the two \text labels of the board, counted in the drawn table */
function boardCond(q0) {
  const T = tableOf(q0), L = boardLabels(q0.board);
  if (!T || L.length !== 2) return undefined;
  const x = labelAt(T, L[0]), y = labelAt(T, L[1]);
  if (!x || !y || x.dim === y.dim) return undefined;
  return Q(countOf(T, x, y), countOf(T, y)).pair;
}
function classify(q0, me, ind) {
  return choiceIs(q0, `${ind ? 'Independent' : 'Dependent'} and ${me ? 'mutually exclusive' : 'overlapping'}`);
}
/** prior, hit rate and false-positive rate of a screening story → the posterior */
function bayesNums(p) {
  const m = p.match(/^(\d*\.?\d+)% of .*? (\d+(?:\.\d+)?)% of .*?by mistake, (?:for )?(\d*\.?\d+)% of/);
  if (!m) return null;
  const pr = Q(m[1]).div(100), s = Q(m[2]).div(100), f = Q(m[3]).div(100);
  return { pr, s, f, post: pr.mul(s).div(pr.mul(s).add(Q(1).sub(pr).mul(f))) };
}

// ================================================================ sane: what is impossible or unfair in the story
function sane(q0) {
  const out = [], p = q0.prompt;
  let m;
  // a two-way table: its title total is the sum of the drawn counts; a quoted "k out of m" or P(X | Y) = a/b is the table's
  const T = tableOf(q0);
  if (T) {
    if (T.shown && !T.t.hide && T.shown !== T.total) out.push(`the table title says ${T.shown} but the counts add to ${T.total}`);
    if (T.cells.flat().some(v => v < 0 || !Number.isInteger(v))) out.push('a negative or fractional count');
    if ((m = p.match(/Of the (.*?), (\d+) out of (\d+) (.*?)\. Now/))) {
      const L = labelsIn(T, m[1]);
      if (L.length === 1 && countOf(T, L[0]) !== +m[3]) out.push(`"${m[2]} out of ${m[3]}" does not match the ${L[0].label} total ${countOf(T, L[0])}`);
    }
    if ((m = p.match(/P\((.*?) \| (.*?)\) = (\d+)\/(\d+)/))) {
      const x = labelAt(T, m[1]), y = labelAt(T, m[2]);
      if (x && y && !(countOf(T, x, y) === +m[3] && countOf(T, y) === +m[4])) out.push(`the quoted P(${m[1]} | ${m[2]}) = ${m[3]}/${m[4]} does not match the table`);
    }
    if ((m = p.match(/\((\d+) in all\)|: (\d+) people in this sample/)) && +(m[1] ?? m[2]) !== T.total) out.push('the stated total does not match the table');
  }
  switch (q0.family) {
    case 'zeroFormula': {
      const b = Q(p.match(/P\(B\) = (\d*\.?\d+)/)?.[1] ?? '0');
      const known = [[/roll a 7 on a standard die|roll a sum of 13 with two dice|ticket number 0 \(tickets start at 1\)/, Q(0)], [/you roll doubles/, Q(1, 6)]];
      for (const [re, v] of known) if (re.test(p) && !b.eq(v)) out.push(`P(B) = ${b} but that event has probability ${v}`);
      if (/hold an even ticket/.test(p) && (b.value > 0.5 || b.value < 0.45)) out.push(`P(an even ticket) = ${b}: about half the tickets are even`);
      break;
    }
    case 'exclDep':
      if (/the roll is/.test(p) && !/die/.test(p)) out.push('"the roll" with no die named: the sample space is not stated');
      break;
    case 'multCount':
      if (/a third step goes well/.test(p)) out.push('"a third step" that the story never describes');
      break;
    case 'notVenn': {
      const v = picOf(q0, 'venn')?.vals, N = +p.match(/class of (\d+)/)?.[1];
      if (v && N && ['a', 'ab', 'b', 'out'].reduce((s, k) => s + +(v[k] ?? 0), 0) !== N) out.push('the Venn counts do not add to the class size');
      break;
    }
    case 'spinnerCond': {
      const s = picOf(q0, 'spinner');
      if (s) {
        const ps = s.sectors.map(x => texFrac(x.p)), tw = s.sectors.reduce((a, x) => a + x.w, 0);
        if (!ps.reduce((a, b) => a.add(b), Q(0)).eq(1)) out.push('the legend probabilities do not add to 1');
        if (s.sectors.some((x, i) => !Q(x.w, tw).eq(ps[i]))) out.push('a sector size does not match its legend probability');
      }
      break;
    }
    case 'formulaDec': case 'productTest': case 'addGiven': case 'zeroOrUndef': {
      const g = k => { const x = p.match(new RegExp(`P\\(${k}\\) = (\\d*\\.?\\d+%?)`)); return x ? pct(x[1]) : null; };
      const A = g('A'), B = g('B'), AB = g('A and B'), U = g('A or B');
      if (A && B && AB && (AB.cmp(A) > 0 || AB.cmp(B) > 0 || A.add(B).sub(AB).cmp(1) > 0)) out.push('P(A and B) is not possible with these P(A), P(B)');
      if (A && B && U && (U.cmp(A) < 0 || U.cmp(B) < 0 || U.cmp(1) > 0 || A.add(B).sub(U).cmp(0) < 0)) out.push('P(A or B) is not possible with these P(A), P(B)');
      if (q0.family === 'formulaDec' && B && AB && !terminates(AB.div(B))) out.push('"give a decimal" but the answer does not terminate and no rounding is asked');
      break;
    }
    case 'formulaVenn': {
      if ((m = p.match(/A only (\d*\.?\d+), both (\d*\.?\d+), B only (\d*\.?\d+), neither (\d*\.?\d+)/)) && !m.slice(1).reduce((a, x) => a.add(Q(x)), Q(0)).eq(1)) out.push('the region probabilities do not add to 1');
      break;
    }
    case 'classifyVenn': {
      const v = picOf(q0, 'venn')?.vals;
      if ((m = p.match(/P\(A\) = (\d*\.?\d+), P\(B\) = (\d*\.?\d+), P\(A and B\) = (\d*\.?\d+)/)) && v) {
        const ab = Q(v.ab ?? '0');
        if (!Q(v.a ?? '0').add(ab).eq(Q(m[1])) || !Q(v.b ?? '0').add(ab).eq(Q(m[2])) || !ab.eq(Q(m[3]))) out.push('the prompt and the Venn diagram disagree');
      }
      break;
    }
    case 'approxIndep': {
      const T2 = tableOf(q0), mm = p.match(/the share who (.*?) differs by less than (\d+(?:\.\d+)?) percentage/);
      if (T2 && mm) {
        const L = labelsIn(T2, mm[1]).filter(x => x.dim === 'col');
        if (L.length === 1) {
          const s = T2.cells.map((r, i) => (100 * r[L[0].i]) / T2.rowSum[i]);
          if (Math.abs(Math.abs(s[0] - s[1]) - +mm[2]) < 0.15) out.push('the gap is too close to the tolerance to call');
        }
      }
      break;
    }
    case 'dotsUnusual': {
      const d = picOf(q0, 'dots'), mm = p.match(/(\d+)% of students .*? gave (\d*\.?\d+)\./);
      if (d && mm) {
        const pp = +mm[1] / 100, far = Math.abs(+mm[2] - pp), k = d.vals.filter(v => Math.abs(v - pp) >= far - 1e-9).length;
        if (k > 0 && k / d.vals.length < 0.1) out.push(`only ${k} of ${d.vals.length} simulated samples are that far: "not unusual" is not clear-cut`);
      }
      break;
    }
  }
  // rounding ties (exact value on a .5 at the rounding place)
  if (q0.family === 'bayesScreen') { const b = bayesNums(p); if (b && tie(b.post, 3)) out.push('the exact answer is a tie at the third decimal'); }
  if (q0.family === 'relCompute') {
    const T2 = tableOf(q0);
    if (T2) { const r = F.relCompute(q0); if (r !== undefined) { /* tie check on the exact share */ const mm = p.match(/what percent of (all )?the (.*?)\? Round/); const L = labelsIn(T2, mm?.[2] ?? ''); if (L.length) { const num = L.length === 2 ? countOf(T2, L[0], L[1]) : countOf(T2, L[0]); const den = mm[1] ? T2.total : countOf(T2, L[0]); if (tie(Q(100 * num, den), 0)) out.push('the exact percent is a tie at .5'); } } }
  }
  return out.join('; ');
}
/** is f exactly halfway at `places` decimals? */
function tie(f, places) { const x = f.mul(10 ** places).mul(2); return x.d === 1 && x.n % 2 !== 0; }

export default {
  solve(q0) {
    const f = F[q0.family];
    return f ? f(q0) : undefined;
  },
  sane,
};
