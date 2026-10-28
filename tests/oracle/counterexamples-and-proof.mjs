// Oracle for the lesson "counterexamples-and-proof" (Geometry: counterexamples, inference and proof). Written from
// what the student sees only: the prompt, the choices, the proof frame, the value tables, the Euler line-ups and the
// drawn figures. Every claim is decided over its stated domain (a counterexample must lie in the domain, make the
// hypothesis true and the conclusion false); argument forms are judged by logic (detachment and modus tollens valid,
// affirming the conclusion and denying the hypothesis invalid, chains by reachability); every proof line is checked on
// its own: its statement must hold for every integer value of the letters (the earlier definitions substituted) and
// its reason must be the one that actually justifies it (a reason that restates the claim being proved = circular).
// Reason-carrying choices count only when the verdict AND the reason are right. See docs/lessons/QUALITY_LAYER.md.
import { texPlain as kitPlain } from '../../tools/quality/oracle-kit.mjs';

/** TeX → plain, keeping the geometry symbols the kit would drop */
const texPlain = s => kitPlain(String(s).replace(/\\angle\s*/g, '∠').replace(/\\cong\b/g, '≅').replace(/\\parallel\b/g, '∥').replace(/\\ell\b/g, 'ℓ'));

// ================================================================ small helpers
const clean = s => String(s).replace(/−/g, '-').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const lc = s => clean(s).toLowerCase().replace(/[.”“"]+$/g, '').replace(/^[“"]+/, '').trim();
const isInt = v => Number.isInteger(v);
const isPrime = v => { if (!isInt(v) || v < 2) return false; for (let d = 2; d * d <= v; d++) if (v % d === 0) return false; return true; };
const even = v => isInt(v) && v % 2 === 0;
const odd = v => isInt(v) && Math.abs(v % 2) === 1;
const mult = (v, k) => isInt(v) && v % k === 0;
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
/** "−2", "1/4", "7.5", "1,140" → number */
function numOf(s) {
  const t = clean(s).replace(/,(\d{3})/g, '$1');
  let m = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+)$/); if (m) return Number(m[1]) / Number(m[2]);
  m = t.match(/^-?\d+(?:\.\d+)?$/); if (m) return Number(t);
  return NaN;
}
/** the index of the one choice passing pred, -1 otherwise */
const only = (q, pred) => { const h = q.choices.map((c, i) => (pred(clean(c), i) ? i : -1)).filter(i => i >= 0); return h.length === 1 ? h[0] : -1; };

// ================================================================ expressions in letters
/** plain math text → a function of an env {letter: value} (implicit products: 2m, 3jk, 2(m + n), mb, n²) */
function compile(src) {
  let s = clean(src).replace(/·|×|\\cdot/g, '*').replace(/²/g, '^2').replace(/³/g, '^3');
  if (!/^[\w\s+\-*/()^.]+$/.test(s)) return null;
  const toks = s.match(/\d+(?:\.\d+)?|[a-z]|[A-Z]|\^|[+\-*/()]/g);
  if (!toks || toks.join('') !== s.replace(/\s+/g, '')) return null;
  const out = []; const operand = t => /^[\d.]+$|^[a-zA-Z]$|^\)$/.test(t); const opener = t => /^[\d.]+$|^[a-zA-Z]$|^\($/.test(t);
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (i > 0 && operand(toks[i - 1]) && opener(t) && toks[i - 1] !== '^') out.push('*');
    out.push(/^[a-zA-Z]$/.test(t) ? `E.${t}` : t === '^' ? '**' : t);
  }
  let code = out.join(' ').replace(/(^|[(+\-*/]\s*)-\s*(E\.\w)\s*\*\*/g, '$1-1*$2**');
  try { const f = new Function('E', `return (${code});`); return env => f(env); } catch { return null; }
}
const lettersOf = s => [...new Set((clean(s).match(/[a-z]/g) ?? []))];

// ================================================================ number predicates
/** a clause about numbers (n, x, a, b, n², n + 2, ...) → env => boolean, or null */
function numPred(text, V = 'n') {
  let s = lc(text).replace(/\s+\(.*\)$/, '');
  let m;
  if ((m = s.match(/^(.+?) (?:is|are) not (.+)$/))) { const f = numPred(`${m[1]} is ${m[2]}`, V); return f && (e => !f(e)); }
  if ((m = s.match(/^([a-z]) and ([a-z]) are both (even|odd)$/))) { const g = m[3] === 'even' ? even : odd; return e => g(e[m[1]]) && g(e[m[2]]); }
  if ((m = s.match(/^the last digit of ([a-z]) is (\d)$/))) { const d = Number(m[2]); return e => isInt(e[m[1]]) && Math.abs(e[m[1]]) % 10 === d; }
  if ((m = s.match(/^(.+?) is (?:a )?multiple of (\d+) and of (\d+)$/))) { const f = compile(m[1]); return f && (e => mult(f(e), +m[2]) && mult(f(e), +m[3])); }
  if ((m = s.match(/^(.+?) is (?:a )?(multiple|factor) of (\d+)$/))) {
    const f = compile(m[1]); const k = +m[3];
    return f && (m[2] === 'multiple' ? e => mult(f(e), k) : e => { const v = f(e); return isInt(v) && v > 0 && k % v === 0; });
  }
  if ((m = s.match(/^(.+?) is (even|odd|prime|positive|negative)$/))) {
    const f = compile(m[1]); const g = { even, odd, prime: isPrime, positive: v => v > 0, negative: v => v < 0 }[m[2]];
    return f && (e => g(f(e)));
  }
  if ((m = s.match(/^(.+?) is a whole number$/))) { const f = compile(m[1]); return f && (e => isInt(f(e)) && f(e) >= 0); }
  if ((m = s.match(/^(.+?) is (greater|less) than (or equal to )?(.+)$/))) {
    const f = compile(m[1]), g = compile(m[4]); if (!f || !g) return null;
    const op = m[2] === 'greater' ? (m[3] ? '≥' : '>') : (m[3] ? '≤' : '<');
    return e => CMP[op](f(e), g(e));
  }
  if ((m = s.match(/^(.+?) (<|>|≤|≥|=|≠) (.+)$/))) { const f = compile(m[1]), g = compile(m[3]); return f && g && (e => CMP[m[2]](f(e), g(e))); }
  // a bare Euler label: "even", "multiple of 4", "multiple of 2 and of 3"
  if (/^(even|odd|prime|positive|negative|(?:a )?multiple of .+|(?:a )?factor of .+)$/.test(s)) return numPred(`${V} is ${s}`, V);
  return null;
}
const CMP = { '<': (a, b) => a < b, '>': (a, b) => a > b, '≤': (a, b) => a <= b, '≥': (a, b) => a >= b, '=': (a, b) => near(a, b), '≠': (a, b) => !near(a, b) };

// ================================================================ domains
/** the stated domain → { vars, has(env), sample: env[] } */
function domainOf(text) {
  const t = clean(text);
  let m = t.match(/\(?([a-z]) and ([a-z]) are any integers/);
  if (m) {
    const sample = []; for (let a = -16; a <= 16; a++) for (let b = -16; b <= 16; b++) sample.push({ [m[1]]: a, [m[2]]: b });
    return { vars: [m[1], m[2]], has: e => isInt(e[m[1]]) && isInt(e[m[2]]), sample };
  }
  m = t.match(/\b([a-z]) is any (positive integer|whole number|integer|real number)/);
  if (!m) return null;
  const V = m[1], kind = m[2];
  const has = { 'positive integer': v => isInt(v) && v > 0, 'whole number': v => isInt(v) && v >= 0, integer: isInt, 'real number': v => Number.isFinite(v) }[kind];
  const vals = [];
  if (kind === 'real number') { for (let i = -480; i <= 480; i++) vals.push(i / 8); for (const d of [3, 5, 7]) for (let i = -20; i <= 20; i++) vals.push(i / d); }
  else for (let v = -150; v <= 150; v++) if (has(v)) vals.push(v);
  return { vars: [V], V, kind, has: e => has(e[V]), sample: vals.map(v => ({ [V]: v })) };
}
/** "x = −2", "a = 2, b = 3", "n = −2 ((−2)² = 4)" → env */
function envOf(s) {
  const t = clean(s).replace(/\s*\(\(.*$/, '').replace(/\.$/, '');
  const env = {};
  for (const part of t.split(/,\s*/)) { const m = part.match(/^([a-z]) = (-?[\d./,]+)$/); if (!m) return null; env[m[1]] = numOf(m[2]); }
  return Object.keys(env).length ? env : null;
}
const implies = (P, Q, sample) => sample.every(e => !P(e) || Q(e));

// ================================================================ word clauses → literals
/** a clause with its subject ("Ana's number is not greater than 5", "they are congruent") → { pred, neg } */
function lit(text) {
  let s = ' ' + lc(text).replace(/’/g, "'") + ' ';
  const m = s.match(/\s(is|are|has|have|scores|score|goes|go|forms|form|does|do)\s(.*)$/);
  if (!m) return null;
  let verb = m[1], rest = m[2].trim(), neg = false;
  if (verb === 'does' || verb === 'do') { if (!rest.startsWith('not ')) return null; neg = true; rest = rest.slice(4); const w = rest.split(' '); verb = w.shift(); rest = w.join(' '); }
  else if ((verb === 'is' || verb === 'are') && rest.startsWith('not ')) { neg = true; rest = rest.slice(4); }
  const base = { is: 'be', are: 'be', has: 'have', have: 'have', scores: 'score', score: 'score', goes: 'go', go: 'go', forms: 'form', form: 'form' }[verb] ?? verb;
  let pred = `${base} ${rest}`.replace(/\b(a|an|the)\b\s*/g, '').replace(/\s+/g, ' ').trim();
  if (pred === 'be odd') { pred = 'be even'; neg = !neg; }
  if (pred === 'have at least 8 characters') { pred = 'have fewer than 8 characters'; neg = !neg; }
  return { pred, neg };
}
const same = (a, b) => !!a && !!b && a.pred === b.pred && a.neg === b.neg;
const not = a => a && { pred: a.pred, neg: !a.neg };
/** “If X, then Y.” anywhere in a text → [X, Y] (the first one) */
function ifThen(text) { const m = clean(text).match(/[Ii]f (.+?), then (.+?)\.?”/); return m ? [m[1], m[2]] : null; }
const ruleOf = text => { const r = ifThen(text); return r && { P: lit(r[0]), Q: lit(r[1]) }; };
/** the form of "fact, so concl" against the rule P → Q */
function formOf(rule, fact, concl) {
  if (same(fact, rule.P) && same(concl, rule.Q)) return 'detachment';
  if (same(fact, not(rule.Q)) && same(concl, not(rule.P))) return 'tollens';
  if (same(fact, rule.Q) && same(concl, rule.P)) return 'converse';
  if (same(fact, not(rule.P)) && same(concl, not(rule.Q))) return 'inverse';
  return 'other';
}
const isNothing = c => /^Nothing/.test(c);

// ================================================================ families: counterexamples
function claimParts(q) {
  const m = clean(q.prompt).match(/Claim: “If (.+?), then (.+?)\.” \((.+?)\)/);
  if (!m) return null;
  const d = domainOf(m[3]); const V = d?.V ?? 'n';
  return { P: numPred(m[1], V), Q: numPred(m[2], V), d };
}
const isCx = (c, e) => e && c.d.vars.every(v => v in e) && c.d.has(e) && c.P(e) && !c.Q(e);

function cxPick(q) { const c = claimParts(q); return only(q, ch => isCx(c, envOf(ch))); }
function cxJudge(q) {
  const c = claimParts(q); const e = envOf(clean(q.prompt).match(/says (.+?) is a counterexample/)[1]);
  const p = c.P(e), qq = c.Q(e);
  if (p && !qq && c.d.has(e)) return only(q, ch => /^Yes: the hypothesis is true and the conclusion is false/.test(ch));
  if (!p) return only(q, ch => /^No: the hypothesis is false/.test(ch));
  return only(q, ch => /^No: the hypothesis and the conclusion are both true/.test(ch));
}
// shapes: decided by their marks (right-angle squares, matching ticks) and their number of corners
function shapeHas(sh, prop) {
  const n = sh.pts.length, ticks = sh.ticks ?? [], right = sh.right ?? [];
  const groups = {}; ticks.forEach(t => { if (t) groups[t] = (groups[t] ?? 0) + 1; });
  const maxEq = Math.max(0, ...Object.values(groups));
  switch (prop) {
    case 'quadrilateral': return n === 4;
    case 'triangle': return n === 3;
    case 'have four equal sides': return n === 4 && maxEq === 4;
    case 'have two equal sides': return maxEq >= 2;
    case 'have right angle': return right.length >= 1;
    case 'have four right angles': return n === 4 && right.length === 4;
    case 'be square': return n === 4 && right.length === 4 && maxEq === 4;
    default: return undefined;
  }
}
function cxShape(q) {
  const m = clean(q.prompt).match(/“If (a quadrilateral|a triangle) (.+?), then it (.+?)\.”/);
  const kind = m[1].replace(/^a /, ''), P = lit('it ' + m[2]).pred, Q = lit('it ' + m[3]).pred;
  const toks = q.data.picture.euler.tokens;
  return only(q, ch => { const t = toks.find(t => `Shape ${t.letter}` === ch); return t && shapeHas(t.shape, kind) && shapeHas(t.shape, P) && shapeHas(t.shape, P) !== undefined && shapeHas(t.shape, Q) === false; });
}

// ================================================================ families: generality of proof
function examplesProof(q) {
  const p = clean(q.prompt);
  const m = p.match(/For every n in the set \{([^}]*)\}.*?works out all (\d+) values/);
  if (m && m[1].split(',').length === +m[2]) return only(q, ch => /^Proved: the domain has only/.test(ch));
  return only(q, ch => /^Not proved/.test(ch));
}
function argCovers(q) {
  const covered = v => isInt(v) && v >= 0 && even(v);
  if (/does the argument not cover/.test(q.prompt)) {
    // every even integer outside the stated domain (the negatives) is not covered
    return only(q, ch => { const v = numOf(ch); return !Number.isNaN(v) && even(v) && !covered(v); });
  }
  return only(q, ch => { const m = ch.match(/^(-?[\d.]+) \+ \(?(-?[\d.]+)\)?$/); return m && covered(numOf(m[1])) && covered(numOf(m[2])); });
}
const afterProof = q => only(q, ch => /^No: the proof covers every case/.test(ch));

// ================================================================ families: general representation
/** the target set of a repPick question and a checker for a choice */
function repPick(q) {
  const p = clean(q.prompt);
  let target, arity = 1;
  let m;
  if ((m = p.match(/any multiple of (\d+)/))) { const k = +m[1]; target = v => mult(v, k); }
  else if (/any odd integer/.test(p)) target = odd;
  else if (/any two even integers/.test(p)) { arity = 2; target = (u, v) => even(u) && even(v); }
  else if (/any two consecutive integers/.test(p)) { arity = 2; target = (u, v) => isInt(u) && v === u + 1; }
  else return -1;
  return only(q, ch => {
    const mm = ch.match(/^(.+?), where (.+)$/); if (!mm) return false;
    const exprs = mm[1].split(' and ').map(s => s.trim()); if (exprs.length !== arity) return false;
    const fs = exprs.map(compile); if (fs.some(f => !f)) return false;
    const dom = /any number/.test(mm[2]) ? 'real' : /whole number/.test(mm[2]) ? 'whole' : /integer/.test(mm[2]) ? 'int' : null; if (!dom) return false;
    const declared = (mm[2].match(/\b[a-z]\b(?= (?:and|is|are)\b)|\b[a-z]\b(?=,)/g) ?? []);
    const letters = [...new Set(exprs.flatMap(lettersOf))]; if (!letters.every(l => declared.includes(l))) return false;
    const vals = dom === 'real' ? [-3, -2.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 3] : dom === 'whole' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] : Array.from({ length: 61 }, (_, i) => i - 30);
    // every value the letters make is of the kind (sound) ...
    const envs = letters.length === 1 ? vals.map(v => ({ [letters[0]]: v })) : vals.flatMap(a => vals.map(b => ({ [letters[0]]: a, [letters[1]]: b })));
    const made = envs.map(e => fs.map(f => f(e)));
    if (!made.every(t => target(...t))) return false;
    // ... and every member of the kind (in a window) is made (complete)
    const key = t => t.join('|'); const got = new Set(made.map(key));
    const W = Array.from({ length: 21 }, (_, i) => i - 10);
    const members = arity === 1 ? W.filter(v => target(v)).map(v => [v]) : W.flatMap(u => W.map(v => [u, v])).filter(t => target(...t));
    return members.every(t => got.has(key(t)));
  });
}
function repWhyInt(q) {
  const p = clean(q.prompt);
  const m = p.match(/is (2m(?: \+ 1)?)” .*?m = (-?\d+(?:\.\d+)?)/); if (!m) return -1;
  const v = compile(m[1])({ m: numOf(m[2]) }); const par = even(v) ? 'even' : odd(v) ? 'odd' : 'neither';
  return only(q, ch => { const mm = ch.match(/^(-?[\d.]+), which is (even|odd): “m is an integer” has to be written/); return mm && near(numOf(mm[1]), v) && mm[2] === par; });
}
function repRead(q) {
  const m = clean(q.prompt).match(/What kind of integer is (.+)\?$/); const f = compile(m[1]); if (!f) return -1;
  const ps = new Set(); for (let a = -6; a <= 6; a++) for (let b = -6; b <= 6; b++) ps.add(even(f({ m: a, n: b })) ? 'e' : 'o');
  const want = ps.size === 2 ? /can be even or odd/ : ps.has('e') ? /^Always even/ : /^Always odd/;
  return only(q, ch => want.test(ch));
}

// ================================================================ families: inference
/** detachment / modus tollens: what follows from the rule and one fact */
function whatFollows(q) {
  const p = clean(q.prompt); const rule = ruleOf(p);
  const fact = lit(p.match(/You also know: (.+?)\. What can you conclude/)[1]);
  const concl = same(fact, rule.P) ? rule.Q : same(fact, not(rule.Q)) ? not(rule.P) : null;
  if (concl) return only(q, ch => !isNothing(ch) && same(lit(ch), concl));
  return only(q, ch => isNothing(ch) && /may or may not|Nothing follows about whether/.test(ch));
}
function detachWhich(q) {
  const rule = ruleOf(q.prompt);
  return only(q, ch => { const [a, b] = ch.split(/, so /); return b && formOf(rule, lit(a), lit(b)) === 'detachment'; });
}
function formName(q) {
  const p = clean(q.prompt); const rule = ruleOf(p);
  const arg = p.match(/Argument: “(.+?)”/)[1]; const [a, b] = arg.split(/, so /);
  const f = formOf(rule, lit(a), lit(b));
  if (f === 'detachment') return only(q, ch => /law of detachment/i.test(ch));
  if (f === 'tollens') return only(q, ch => /^Modus tollens/.test(ch));
  return only(q, ch => /^None: the argument is invalid/.test(ch));
}
function validForm(q) {
  const p = clean(q.prompt); const rule = ruleOf(p);
  const fact = lit(p.match(/Premise 2: (.+?)\. Conclusion:/)[1]); const concl = lit(p.match(/Conclusion: (.+?)\. Is the argument valid/)[1]);
  const f = formOf(rule, fact, concl);
  if (f === 'detachment' || f === 'tollens') return only(q, ch => /^Valid: whenever both premises are true/.test(ch));
  return only(q, ch => /^Invalid: both premises can be true while the conclusion is false/.test(ch));
}
function countermodel(q) {
  const p = clean(q.prompt);
  const r = ifThen(p); const V = (r[0].match(/^([a-z]) /) ?? [])[1] ?? 'n';
  const P = numPred(r[0], V), Q = numPred(r[1], V);
  const [a, b] = p.match(/Argument: “(.+?)\.?”/)[1].split(/, so /);
  const A = numPred(a, V), B = numPred(b, V);
  const isCm = e => (!P(e) || Q(e)) && A(e) && !B(e);
  const hit = only(q, ch => { const e = envOf(ch); return e && isCm(e); });
  if (hit >= 0) return hit;
  if (q.choices.some(ch => { const e = envOf(ch); return e && isCm(e); })) return -1;
  // no listed value breaks it: the form must really be valid for "None" to be right
  const d = domainOf(`${V} is any integer`).sample;
  return d.some(isCm) ? -1 : only(q, ch => /^None/.test(ch));
}
/** chains: implications between literals, closed under contrapositive */
function derivable(prem, from, to) {
  const edges = []; for (const [x, y] of prem) { edges.push([x, y], [not(y), not(x)]); }
  const seen = [from]; const stack = [from];
  while (stack.length) { const c = stack.pop(); if (same(c, to)) return true; for (const [x, y] of edges) if (same(x, c) && !seen.some(s => same(s, y))) { seen.push(y); stack.push(y); } }
  return false;
}
const premisesOf = text => [...clean(text).matchAll(/“If (.+?), then (.+?)\.”/g)].map(m => [lit(m[1]), lit(m[2])]);
function chain(q) {
  const prem = premisesOf(q.prompt);
  const ok = ch => { const m = ch.match(/^If (.+?), then (.+?)\.$/); if (!m) return false; const x = lit(m[1]), y = lit(m[2]); return !prem.some(([a, b]) => same(a, x) && same(b, y)) && derivable(prem, x, y); };
  if (q.choices.some(ch => ok(clean(ch)))) return only(q, ok);
  return only(q, ch => isNothing(ch));
}
function chainValid(q) {
  const p = clean(q.prompt);
  const prem = premisesOf(p.split('Proposed conclusion:')[0]);
  const [x, y] = premisesOf(p.split('Proposed conclusion:')[1])[0];
  return only(q, ch => (derivable(prem, x, y) ? /^Yes/ : /^No/).test(ch));
}
function mustBeTrue(q) {
  const rule = ruleOf(q.prompt);
  return only(q, ch => { const m = ch.match(/^If (.+?), then (.+?)\.$/); return m && same(lit(m[1]), not(rule.Q)) && same(lit(m[2]), not(rule.P)); });
}
function fourCases(q) {
  const imp = (a, b) => !a || b;
  const FORMS = { 'p → q': (p, r) => imp(p, r), 'q → p': (p, r) => imp(r, p), '~p → ~q': (p, r) => imp(!p, !r), '~q → ~p': (p, r) => imp(!r, !p) };
  const t = clean(q.prompt).match(/as the (?:statement|converse|inverse|contrapositive) (\S+ → \S+) in all four cases/)[1];
  const cases = [[true, true], [true, false], [false, true], [false, false]];
  return only(q, ch => { const f = ch.match(/(\S+ → \S+)$/)?.[1]; return f && f !== t && FORMS[f] && cases.every(([a, b]) => FORMS[f](a, b) === FORMS[t](a, b)); });
}

// ================================================================ the world of the non-number conditions
// angle pairs, quadrilaterals and Quarry tiles, as a careful teacher knows them (only facts a 14-18 student has)
const ANGLE_PAIRS = [
  { lp: true, sum: 180, vert: false, cong: false },  // a 70/110 linear pair
  { lp: true, sum: 180, vert: false, cong: true },   // a 90/90 linear pair
  { lp: false, sum: 180, vert: false, cong: false }, // 70° and 110° in different triangles
  { lp: false, sum: 180, vert: false, cong: true },  // two separate right angles
  { lp: false, sum: 80, vert: true, cong: true },    // 40/40 vertical angles
  { lp: false, sum: 80, vert: false, cong: true },   // base angles of an isosceles triangle
  { lp: false, sum: 50, vert: false, cong: false },  // 20° and 30°
];
const QUADS = [
  { name: 'square', right4: true, sq: true }, { name: 'rectangle', right4: true, sq: false }, { name: 'rhombus', right4: false, sq: false },
  { name: 'parallelogram', right4: false, sq: false }, { name: 'kite', right4: false, sq: false },
];
/** a condition in words → { world, f } */
function worldPred(text, q) {
  const s = lc(text);
  if (/form a linear pair$/.test(s)) return { w: 'ang', f: o => o.lp };
  if (/m∠1 \+ m∠2 = 180°$/.test(s) || /are supplementary$/.test(s)) return { w: 'ang', f: o => o.sum === 180 };
  if (/are vertical angles$/.test(s)) return { w: 'ang', f: o => o.vert };
  if (/∠1 ≅ ∠2$/.test(s) || /are congruent$/.test(s)) return { w: 'ang', f: o => o.cong };
  if (/has four right angles$/.test(s)) return { w: 'quad', f: o => o.right4 };
  if (/is a square$/.test(s)) return { w: 'quad', f: o => o.sq };
  const p = clean(q.prompt);
  if (/Quarry/.test(p) && /tile|^it /.test(s)) {
    let tiles = null;
    if (/some red tiles score 2 points and some score 5 points; every blue tile scores 5 points/.test(p)) tiles = [{ c: 'red', pts: 2 }, { c: 'red', pts: 5 }, { c: 'blue', pts: 5 }];
    if (/a tile scores 5 points if it is gold, and only gold tiles score 5 points/.test(p)) tiles = [{ c: 'gold', pts: 5 }, { c: 'grey', pts: 0 }];
    if (!tiles) return null;
    if (/^(?:a tile|it) is (\w+)$/.test(s)) { const c = s.match(/is (\w+)$/)[1]; return { w: 'tile', f: o => o.c === c, all: tiles }; }
    if (/scores (\d+) points$/.test(s)) { const k = +s.match(/(\d+) points$/)[1]; return { w: 'tile', f: o => o.pts === k, all: tiles }; }
  }
  return null;
}
/** a pair of conditions → { suff, nec } (suff: every member with A has B) */
function relation(A, B, q, dom) {
  const pa = numPred(A, dom?.V ?? 'n'), pb = numPred(B, dom?.V ?? 'n');
  if (pa && pb && dom) return { suff: implies(pa, pb, dom.sample), nec: implies(pb, pa, dom.sample), num: true, pa, pb };
  const wa = worldPred(A, q), wb = worldPred(B, q);
  if (!wa || !wb || wa.w !== wb.w) return null;
  const all = wa.w === 'ang' ? ANGLE_PAIRS : wa.w === 'quad' ? QUADS : wa.all;
  return { suff: all.every(o => !wa.f(o) || wb.f(o)), nec: all.every(o => !wb.f(o) || wa.f(o)) };
}

// ================================================================ families: sufficient / necessary / iff / classify
function readSameAs(q) {
  const [P, Q] = ifThen(q.prompt).map(lc);
  return only(q, ch => {
    let m, a, b;
    if ((m = ch.match(/^“(.+)” is sufficient for “(.+)”\.$/))) [a, b] = [m[1], m[2]];
    else if ((m = ch.match(/^“(.+)” is necessary for “(.+)”\.$/))) [a, b] = [m[2], m[1]];
    else if ((m = ch.match(/^(.+) only if (.+)\.$/))) [a, b] = [m[1], m[2]];
    else return false;
    return lc(a) === P && lc(b) === Q;
  });
}
function suffNecTrue(q, kind) {
  const p = clean(q.prompt); const dom = domainOf(p);
  const m = p.match(/Is “(.+?)” (?:sufficient|necessary) for “(.+?)”\?/); const [A, B] = [m[1], m[2]];
  const rel = relation(A, B, q, dom); if (!rel) return -1;
  // sufficient: A → B; necessary: B → A
  const [X, Y] = kind === 'suff' ? [A, B] : [B, A]; const truth = kind === 'suff' ? rel.suff : rel.nec;
  const PX = numPred(X, dom.V), PY = numPred(Y, dom.V);
  return only(q, ch => {
    let mm;
    if ((mm = ch.match(/^Yes: every value with “(.+?)” has “(.+?)”\.$/))) return truth && lc(mm[1]) === lc(X) && lc(mm[2]) === lc(Y);
    if ((mm = ch.match(/^No: (.+?) has “(.+?)” but not “(.+?)”\.$/))) {
      const e = envOf(mm[1]); return !truth && e && dom.has(e) && lc(mm[2]) === lc(X) && lc(mm[3]) === lc(Y) && PX(e) && !PY(e);
    }
    return false; // "has both", "has neither", "usually"
  });
}
function classify(q) {
  const p = clean(q.prompt); const dom = domainOf(p);
  const m = p.match(/Is “(.+?)” a necessary condition, a sufficient condition, both or neither for “(.+?)”\?/);
  const rel = relation(m[1], m[2], q, dom); if (!rel) return -1;
  const want = rel.suff && rel.nec ? /^Both/ : rel.suff ? /^Sufficient, not necessary/ : rel.nec ? /^Necessary, not sufficient/ : /^Neither/;
  return only(q, ch => want.test(ch));
}
function classifyWhy(q) {
  const p = clean(q.prompt); const dom = domainOf(p);
  const m = p.match(/“(.+?)” is not (sufficient|necessary) for “(.+?)”\./);
  const A = numPred(m[1], dom.V), B = numPred(m[3], dom.V);
  const shows = m[2] === 'sufficient' ? e => A(e) && !B(e) : e => B(e) && !A(e);
  return only(q, ch => { const e = envOf(ch); return e && dom.has(e) && shows(e); });
}
function converseCx(q) {
  const p = clean(q.prompt);
  const m = p.match(/its converse, “If (.+?), then (.+?)\.”/); const d = p.match(/integers (\d+) to (\d+)/);
  const A = numPred(m[1], 'n'), B = numPred(m[2], 'n');
  const inD = e => isInt(e.n) && e.n >= +d[1] && e.n <= +d[2];
  const hit = only(q, ch => { const e = envOf(ch); return e && inD(e) && A(e) && !B(e); });
  if (hit >= 0) return hit;
  let any = false; for (let n = +d[1]; n <= +d[2]; n++) if (A({ n }) && !B({ n })) any = true;
  return any ? -1 : only(q, ch => /^None/.test(ch));
}
/** angle counterexamples written in words: does the text describe a pair with A and without B? */
function angleCxText(ch, A, B) {
  const s = lc(ch);
  const W = { cong: /congruent/, vert: /vertical/, lp: /linear pair/, sup: /supplementary/ };
  const has = (o, w) => (w === 'cong' ? o.cong : w === 'vert' ? o.vert : w === 'lp' ? o.lp : o.sum === 180);
  const key = t => Object.keys(W).find(k => W[k].test(lc(t)));
  const ka = key(A), kb = key(B); if (!ka || !kb) return false;
  let o = null, m;
  if (/two base angles of an isosceles triangle/.test(s)) o = { cong: true, vert: false, lp: false, sum: 0 };
  else if ((m = s.match(/(?:a )?(\d+)° angle (?:in one triangle )?and a (\d+)° angle (?:in another|in different triangles)/))) o = { cong: m[1] === m[2], vert: false, lp: false, sum: +m[1] + +m[2] };
  else if ((m = s.match(/a (\d+)° angle and a (\d+)° angle breaks it/))) return false; // only a measure: the drawing of the pair is not fixed
  else if ((m = s.match(/two (\d+)° angles breaks it/))) o = { cong: true, vert: null, lp: null, sum: 2 * m[1] };
  if (!o) return false;
  const hasA = has(o, ka), hasB = has(o, kb);
  return hasA === true && hasB === false;
}
function converseJudge(q) {
  const p = clean(q.prompt); const dom = domainOf(p);
  const m = p.match(/Its converse: “If (.+?), then (.+?)\.”/); const [A, B] = [m[1], m[2]];
  const rel = relation(A, B, q, dom); if (!rel) return -1;
  if (rel.suff) {
    // true: a choice that proves it (not "because the statement it comes from is true"); its algebra must hold
    return only(q, ch => /^True: /.test(ch) && algebraHolds(ch));
  }
  return only(q, ch => {
    if (!/^False: /.test(ch)) return false;
    if (rel.num) {
      const mm = ch.match(/^False: ([a-z] = -?[\d./]+) (?:breaks it|is .+ but not .+)\.$/); if (!mm) return false;
      const e = envOf(mm[1]); return e && dom.has(e) && rel.pa(e) && !rel.pb(e);
    }
    return angleCxText(ch, A, B);
  });
}
/** every "u = v" link in a written step that uses only one letter must be an identity */
function algebraHolds(text) {
  const t = clean(text).replace(/^True: /, '').replace(/,? which is.*$/, '');
  for (const seg of t.split(/ gives |: /)) {
    const parts = seg.split(/ = /).map(s => s.replace(/[.,]$/, '').trim());
    if (parts.length < 2 || !parts.every(s => compile(s))) continue;
    const fs = parts.map(compile); const ls = [...new Set(parts.flatMap(lettersOf))];
    if (ls.length !== 1) continue;
    for (let k = -5; k <= 5; k++) for (let i = 2; i < fs.length; i++) if (!near(fs[i]({ [ls[0]]: k }), fs[i - 1]({ [ls[0]]: k }))) return false;
  }
  return true;
}
function iffParts(q) {
  const m = clean(q.prompt).match(/prove “(.+?) if and only if (.+?)”/); const [A, B] = [lc(m[1]), lc(m[2])];
  return only(q, ch => {
    if (!/^Both /.test(ch)) return false;
    const ds = [...ch.matchAll(/“if (.+?), then (.+?)”/gi)].map(x => [lc(x[1]), lc(x[2])]);
    return ds.length === 2 && ds.some(([x, y]) => x === A && y === B) && ds.some(([x, y]) => x === B && y === A);
  });
}
function iffJudge(q) {
  const p = clean(q.prompt); const dom = domainOf(p) ?? (/\bx\b/.test(p) ? domainOf('x is any real number') : domainOf('n is any integer'));
  const m = p.match(/Claim: (.+?) if and only if (.+?)\. /); const [A, B] = [m[1], m[2]];
  const rel = relation(A, B, q, dom); if (!rel) return -1;
  if (!(rel.suff && rel.nec)) {
    return only(q, ch => {
      const mm = ch.match(/^No: the claim is false, since (.+)\.$/); if (!mm) return false;
      if (rel.num) { const v = mm[1].match(/^([a-z] = -?\d+) is /); const e = v && envOf(v[1]); return !!e && dom.has(e) && ((rel.pa(e) && !rel.pb(e)) || (rel.pb(e) && !rel.pa(e))); }
      return angleCxText(mm[1].replace(/ form no linear pair/, ' but not a linear pair'), 'supplementary', 'linear pair') || angleCxText(mm[1], B, A);
    });
  }
  const proved = [...p.matchAll(/proof of “if (.+?), then (.+?)”/g)].map(x => [lc(x[1]), lc(x[2])]);
  const has = (x, y) => proved.some(([a, b]) => a === lc(x) && b === lc(y));
  if (has(A, B) && has(B, A)) return only(q, ch => /^Yes: both directions are proved/.test(ch));
  const [x, y] = has(A, B) ? [B, A] : [A, B];
  return only(q, ch => { const mm = ch.match(/^Not yet: “if (.+?), then (.+?)” still needs its own proof/); return mm && lc(mm[1]) === lc(x) && lc(mm[2]) === lc(y); });
}

// ================================================================ proofs: checking one line
const JUNK = /^(Obvious|It always works|Checked with|No reason needed|Measured with|It looks that way)/;
const plainRow = r => ({ st: texPlain(r.st ?? '').replace(/\s+/g, ' ').trim(), rs: clean(r.rs ?? '') });
/** "a = 2m + 1, b = 2n + 1" → { a: f, b: f } (null if not a definition row) */
function defsOf(st) {
  const s = clean(st).replace(/\s*\(.*\)$/, '');
  const parts = s.split(/,\s*/); const defs = {};
  for (const pt of parts) { const m = pt.match(/^([ab]) = (.+)$/); if (!m) return null; const f = compile(m[2]); if (!f) return null; defs[m[1]] = { f, src: m[2] }; }
  return defs;
}
/** the kind of the given numbers: 'even' | 'odd' | 'mult3' | 'evenTimes' | 'consec' | 'angles' | 'parallel' */
function givenKind(given) {
  const g = texPlain(given.join(' ; '));
  if (/consecutive integers/.test(g)) return 'consec';
  if (/a even, b an integer/.test(g)) return 'evenTimes';
  if (/odd integers/.test(g)) return 'odd';
  if (/even integers/.test(g)) return 'even';
  if (/multiples of 3/.test(g)) return 'mult3';
  if (/∥/.test(g)) return 'parallel';
  if (/∠/.test(g)) return 'angles';
  return null;
}
const KIND_DEF = { even: 'Definition of even integer', odd: 'Definition of odd integer', mult3: 'Definition of multiple of 3', evenTimes: 'Definition of even integer' };
/** random integer environments for the free letters, with a and b replaced by their definitions */
function envsFor(defs) {
  const out = []; let seed = 7;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return (seed % 41) - 20; };
  for (let i = 0; i < 40; i++) {
    const e = {}; for (const l of 'bjkmn') e[l] = rnd();
    if (defs) for (const [k, d] of Object.entries(defs)) if (k !== 'b' || defs.b) e[k] = d.f(e);
    if (defs && !defs.b && defs.a) e.a = defs.a.f(e);
    out.push(e);
  }
  return out;
}
/** an equation chain "L = R1 = R2" holds for every integer value of the letters */
function eqHolds(st, defs) {
  const parts = st.replace(/, which is .*$/, '').split(/ = /); if (parts.length < 2) return false;
  const fs = parts.map(compile); if (fs.some(f => !f)) return false;
  return envsFor(defs).every(e => fs.every(f => near(f(e), fs[0](e))));
}
/** "X is even / odd / an integer / a multiple of 3" holds for every integer value of the letters */
function propHolds(st, defs) {
  const m = st.match(/^(.+?) is (even|odd|an integer|a multiple of (\d+))$/); if (!m) return false;
  const f = compile(m[1]); if (!f) return false;
  const g = m[2] === 'even' ? even : m[2] === 'odd' ? odd : m[2] === 'an integer' ? isInt : v => mult(v, +m[3]);
  return envsFor(defs).every(e => g(f(e)));
}
const isSum = s => /\+/.test(s.replace(/\([^()]*\)/g, ''));
const factored = s => /^\d*\(.+\)$/.test(s.trim()) || /^\d+[a-z]+$/.test(s.trim());
/** the reasons that justify row i (a set), or 'bad' when its statement is not true / not allowed */
function rightReasons(rows, i, given, fig) {
  const kind = givenKind(given); const st = rows[i].st;
  const defRowIdx = rows.findIndex(r => defsOf(r.st));
  const defs = defRowIdx >= 0 && defRowIdx < i ? defsOf(rows[defRowIdx].st) : null;
  // ---- angle proofs
  if (/∠|∥/.test(st)) return angleReasons(rows, i, given, fig);
  // ---- definitions of the given numbers
  const d = defsOf(st);
  if (d) {
    if (!KIND_DEF[kind]) return 'bad';
    const need = kind === 'evenTimes' ? ['a'] : ['a', 'b'];
    if (!need.every(k => d[k]) || Object.keys(d).length !== need.length) return 'bad';
    const letters = need.map(k => lettersOf(d[k].src)); if (letters.some(l => l.length !== 1)) return 'bad';
    if (need.length === 2 && letters[0][0] === letters[1][0]) return 'bad'; // one letter makes the two numbers equal
    const form = { even: [2, 0], evenTimes: [2, 0], odd: [2, 1], mult3: [3, 0] }[kind];
    for (const k of need) { const f = d[k].f, L = lettersOf(d[k].src)[0]; for (let v = -4; v <= 4; v++) if (f({ [L]: v }) !== form[0] * v + form[1]) return 'bad'; }
    return new Set([KIND_DEF[kind]]);
  }
  // ---- a given fact
  if (kind === 'consec' && /^n is an integer$/.test(st)) return new Set(['Given']);
  // ---- "E is an integer": closure
  let m;
  if ((m = st.match(/^(.+?) is an integer$/))) {
    const f = compile(m[1]); if (!f || lettersOf(m[1]).some(l => defs && l in defs)) return 'bad';
    // E must be the factor the previous line showed: X = k(E)
    const prev = rows[i - 1]?.st ?? ''; if (!prev.replace(/\s/g, '').includes(`(${m[1].replace(/\s/g, '')})`)) return 'bad';
    return new Set([isSum(m[1]) ? 'Integers are closed under addition' : 'Integers are closed under multiplication']);
  }
  // ---- the conclusion "X is even / odd / a multiple of 3" by definition, after the form was shown
  if ((m = st.match(/^(.+?) is (even|odd|a multiple of 3)$/))) {
    if (!propHolds(st, defs)) return 'bad';
    if (i !== rows.length - 1) return 'bad';
    const prevInt = rows.slice(0, i).some(r => / is an integer$/.test(r.st));
    if (!prevInt && kind !== 'consec') return 'bad';
    return new Set([{ even: 'Definition of even integer', odd: 'Definition of odd integer', 'a multiple of 3': 'Definition of multiple of 3' }[m[2]]]);
  }
  // ---- equations
  if (/ = /.test(st)) {
    if (/\d+ \+ \d+|= \d+(?:,|$)/.test(st) && !/[a-z]/.test(st.split(' = ').slice(1).join(''))) return 'bad'; // a numeric instance
    if (!eqHolds(st, defs)) return 'bad';
    const [L, ...R] = st.split(/ = /); const right = R[R.length - 1];
    const prev = rows[i - 1]?.st ?? '';
    const pd = defsOf(prev); const defd = l => !!pd && l in pd;
    if (pd && lettersOf(L).some(defd) && !lettersOf(right).some(defd)) return new Set(['Substitution Property of Equality']);
    const pm = prev.split(/ = /);
    if (pm.length >= 2 && pm[0].trim() === L.trim()) {
      const pr = pm[pm.length - 1];
      if (/·/.test(pr) && factored(right)) return new Set(['Associative Property of Multiplication']);
      // the statement holds (checked above); a wrong line before it is that line's defect, not this one's
      if (factored(right)) return new Set(['Distributive Property']);
      void isSum(pr);
      return 'bad';
    }
    if (kind === 'consec' && !/[ab]/.test(L) && /^n is an integer$/.test(prev)) return new Set(['Combine like terms']);
    return 'bad';
  }
  return 'bad';
}
// angle proofs: linear pairs, supplements, substitution, subtraction, congruence; corresponding / vertical by the figure
function angleOf(fig, k) { const a = fig?.angles?.find(a => a.text === String(k)); return a; }
const unit = (v, p) => { const dx = p[0] - v[0], dy = p[1] - v[1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
const sameDir = (u, w) => Math.abs(u[0] - w[0]) < 1e-6 && Math.abs(u[1] - w[1]) < 1e-6;
const opp = (u, w) => sameDir(u, [-w[0], -w[1]]);
function raysOf(a) { return [unit(a.v, a.p), unit(a.v, a.q)]; }
function corresponding(fig, x, y) {
  const A = angleOf(fig, x), B = angleOf(fig, y); if (!A || !B) return false;
  if (Math.hypot(A.v[0] - B.v[0], A.v[1] - B.v[1]) < 1e-6) return false;
  const [a1, a2] = raysOf(A), [b1, b2] = raysOf(B);
  return (sameDir(a1, b1) && sameDir(a2, b2)) || (sameDir(a1, b2) && sameDir(a2, b1));
}
function vertical(fig, x, y) {
  const A = angleOf(fig, x), B = angleOf(fig, y); if (!A || !B) return false;
  if (Math.hypot(A.v[0] - B.v[0], A.v[1] - B.v[1]) > 1e-6) return false;
  const [a1, a2] = raysOf(A), [b1, b2] = raysOf(B);
  return (opp(a1, b1) && opp(a2, b2)) || (opp(a1, b2) && opp(a2, b1));
}
function angleReasons(rows, i, given, fig) {
  const st = rows[i].st.replace(/\s+/g, ' ');
  const g = given.map(x => texPlain(x).replace(/\s+/g, ' '));
  let m;
  if (/^ℓ ∥ m$/.test(st)) return g.some(x => /ℓ ∥ m/.test(x)) ? new Set(['Given']) : 'bad';
  if ((m = st.match(/^m∠ ?(\d) \+ m∠ ?(\d) = 180°$/))) {
    const pair = x => new RegExp(`∠ ?${m[1]}, ∠ ?${m[2]}|∠ ?${m[2]}, ∠ ?${m[1]}`).test(x);
    const gl = g.find(pair); if (!gl) return 'bad';
    if (/linear pair/.test(gl)) return new Set(['Linear Pair Postulate']);
    if (/supplementary/.test(gl)) return new Set(['Definition of supplementary angles']);
    return 'bad';
  }
  if ((m = st.match(/^m∠ ?(\d) \+ m∠ ?(\d) = m∠ ?(\d) \+ m∠ ?(\d)$/))) {
    const sums = rows.slice(0, i).map(r => r.st.replace(/\s+/g, ' ').match(/^m∠ ?(\d) \+ m∠ ?(\d) = 180°$/)).filter(Boolean).map(x => [x[1], x[2]].sort().join());
    return sums.includes([m[1], m[2]].sort().join()) && sums.includes([m[3], m[4]].sort().join()) ? new Set(['Substitution Property of Equality', 'Transitive Property of Equality']) : 'bad';
  }
  if ((m = st.match(/^m∠ ?(\d) = m∠ ?(\d)$/))) {
    const [x, y] = [m[1], m[2]];
    const prev = rows[i - 1]?.st.replace(/\s+/g, ' ') ?? '';
    const pm = prev.match(/^m∠ ?(\d) \+ m∠ ?(\d) = m∠ ?(\d) \+ m∠ ?(\d)$/);
    if (pm) { const L = [pm[1], pm[2]], R = [pm[3], pm[4]]; const common = L.find(t => R.includes(t)); const l = L.find(t => t !== common), r = R.find(t => t !== common); return common && ((l === x && r === y) || (l === y && r === x)) ? new Set(['Subtraction Property of Equality']) : 'bad'; }
    if (fig && corresponding(fig, x, y) && g.some(t => /∥/.test(t))) return new Set(['Corresponding Angles Postulate']);
    if (fig && vertical(fig, x, y)) return new Set(['Vertical Angles Theorem']);
    // two earlier equalities that share an angle
    const eqs = rows.slice(0, i).map(r => r.st.replace(/\s+/g, ' ').match(/^m∠ ?(\d) = m∠ ?(\d)$/)).filter(Boolean).map(e => [e[1], e[2]]);
    for (const e1 of eqs) for (const e2 of eqs) if (e1 !== e2) { const c = e1.find(t => e2.includes(t)); if (c) { const ends = [e1.find(t => t !== c), e2.find(t => t !== c)]; if (ends.includes(x) && ends.includes(y)) return new Set(['Transitive Property of Equality', 'Substitution Property of Equality']); } }
    return 'bad';
  }
  if ((m = st.match(/^∠ ?(\d) ≅ ∠ ?(\d)$/))) {
    const ok = rows.slice(0, i).some(r => new RegExp(`^m∠ ?${m[1]} = m∠ ?${m[2]}$`).test(r.st.replace(/\s+/g, ' ')));
    return ok ? new Set(['Definition of congruent angles']) : 'bad';
  }
  return 'bad';
}
/** 'ok' | 'circular' | 'unjustified' for row i */
function checkRow(proofIn, i, theorem, fig) {
  const rows = proofIn.rows.map(plainRow); const r = rows[i];
  const rs = r.rs;
  if (!rs) return 'unjustified';
  if (/^Because /.test(rs)) return lc(rs.replace(/^Because /, '')) === lc(theorem) ? 'circular' : 'unjustified';
  if (/Vertical Angles Theorem/.test(rs) && /vertical angles have equal measures|vertical angles are congruent/.test(theorem)) return 'circular';
  if (/Congruent Supplements Theorem/.test(rs) && /supplements of the same angle are congruent/.test(theorem)) return 'circular';
  if (JUNK.test(rs)) return 'unjustified';
  const want = rightReasons(rows, i, proofIn.given, fig);
  if (want === 'bad') return 'unjustified';
  return want.has(rs) ? 'ok' : 'unjustified';
}
const theoremOf = q => clean(q.prompt).match(/(?:proof that|proves that) (.+?)(?: \(ℓ ∥ m\))?\. /)?.[1] ?? '';

function proofFill(q) {
  const pf = q.data.picture.proof; const { i, cell } = pf.ask[0]; const th = theoremOf(q); const fig = q.data.picture.fig;
  return only(q, ch => {
    const rows = pf.rows.map(r => ({ ...r }));
    if (cell === 'rs') rows[i].rs = ch;
    else {
      // a declaration in brackets must make the letters integers ("(m any number)" lets 2m be 15)
      const decl = ch.match(/\s*\(([a-z](?:, [a-z])* (?:[a-z]+ ?)+)\)$/);
      if (decl && !/ (?:integers|an integer)$/.test(decl[1])) return false;
      rows[i].st = decl ? ch.slice(0, decl.index) : ch;
    }
    const P = { ...pf, rows };
    if (checkRow(P, i, th, fig) !== 'ok') return false;
    // a filled statement must also carry the next line
    if (cell === 'st' && i + 1 < rows.length && checkRow(P, i + 1, th, fig) !== 'ok') return false;
    return true;
  });
}
function auditFind(q) {
  const pf = q.data.picture.proof; const th = theoremOf(q); const fig = q.data.picture.fig;
  const bad = pf.rows.map((_, i) => checkRow(pf, i, th, fig)).map((v, i) => (v === 'ok' ? -1 : i)).filter(i => i >= 0);
  if (bad.length > 1) return -1;
  if (!bad.length) return only(q, ch => /^None/.test(ch));
  return only(q, ch => ch === `Line ${bad[0] + 1}`);
}
function auditKind(q) {
  const pf = q.data.picture.proof; const th = clean(q.prompt).match(/A proof that (.+?)(?: \(ℓ ∥ m\))?\. /)[1]; const fig = q.data.picture.fig;
  const v = checkRow(pf, pf.ring, th, fig);
  const want = v === 'circular' ? /^It uses the statement being proved/ : v === 'unjustified' ? /^Its reason does not justify it/ : /^Nothing: the line is justified/;
  return only(q, ch => want.test(ch));
}

// ================================================================ the map
const F = {
  cxPick, cxJudge, cxShape,
  examplesProof, argCovers, afterProof,
  repPick, repWhyInt, repRead,
  detach: whatFollows, detachWhich,
  chain, chainValid,
  proofFill, proofAngle: proofFill,
  validForm, countermodel,
  auditFind, auditKind,
  converseJudge, converseCx,
  fourCases, mustBeTrue,
  tollens: whatFollows, formName,
  suffRead: readSameAs, suffTrue: q => suffNecTrue(q, 'suff'),
  necRead: readSameAs, necTrue: q => suffNecTrue(q, 'nec'),
  iffParts, iffJudge,
  classify, classifyWhy,
};

// ================================================================ sane: the pictures and stated facts must be right
function shapeIssues(sh) {
  const out = []; const P = sh.pts, n = P.length;
  const len = k => Math.hypot(P[(k + 1) % n][0] - P[k][0], P[(k + 1) % n][1] - P[k][1]);
  const ang = k => { const a = P[(k + n - 1) % n], v = P[k], b = P[(k + 1) % n]; const u = [a[0] - v[0], a[1] - v[1]], w = [b[0] - v[0], b[1] - v[1]]; return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(...u) / Math.hypot(...w)) * 180 / Math.PI; };
  for (const k of sh.right ?? []) if (Math.abs(ang(k) - 90) > 0.5) out.push(`corner ${k} is marked right but measures ${ang(k).toFixed(1)}°`);
  const t = sh.ticks ?? [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (t[a] && t[a] === t[b] && Math.abs(len(a) - len(b)) > 0.5) out.push(`sides ${a} and ${b} have the same tick but lengths ${len(a).toFixed(1)} and ${len(b).toFixed(1)}`);
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (t[a] && t[b] && t[a] !== t[b] && Math.abs(len(a) - len(b)) < 0.5) out.push(`sides ${a} and ${b} are equal but carry different ticks`);
  for (let k = 0; k < n; k++) if (!(sh.right ?? []).includes(k) && Math.abs(ang(k) - 90) < 0.5) out.push(`corner ${k} is a right angle without a mark`);
  return out;
}
/** Euler tokens with numbers: the zone must match the two labels */
function eulerIssues(eu, dom) {
  const out = []; if (!eu?.tokens) return out;
  const V = dom?.V ?? (/\bx\b/.test(`${eu.P} ${eu.Q}`) ? 'x' : 'n');
  const P = numPred(eu.P, V), Q = numPred(eu.Q, V); if (!P || !Q) return out;
  for (const t of eu.tokens) {
    if (t.tex === undefined) continue; const v = numOf(texPlain(t.tex)); if (Number.isNaN(v)) continue;
    const e = { [V]: v }; const z = (P(e) ? 'p' : '') + (Q(e) ? 'q' : '') || 'o';
    if (z !== t.zone) out.push(`${v} stands in zone ${t.zone} but is ${z}`);
    if (eu.layout === 'nested' && t.zone === 'p') out.push(`${v} in P outside Q in a nested picture`);
  }
  return out;
}
function tableIssues(q) {
  const out = []; const tb = q.data?.picture?.table; if (!tb) return out;
  const c = /Claim: “If/.test(q.prompt) ? claimParts(q) : null;
  const head = tb.head.map(h => texPlain(h)); const V = c?.d?.V ?? 'n';
  for (const row of tb.rows) {
    const cells = row.map(x => texPlain(x));
    const e = c ? envOf(c.d.vars.length === 2 ? `${c.d.vars[0]} = ${cells[0].split(/,\s*/)[0]}, ${c.d.vars[1]} = ${cells[0].split(/,\s*/)[1]}` : `${V} = ${cells[0]}`) : { n: numOf(cells[0]) };
    if (!e) continue;
    head.forEach((h, j) => {
      if (j === 0) return;
      const col = tb.headCol[j]; const cell = cells[j];
      if (col === 'dim') { const f = compile(h.replace(/\s/g, '')); if (f) { const want = f(e); const got = numOf(cell); if (!Number.isNaN(got) && !near(want, got)) out.push(`table: ${h} at ${cells[0]} is ${want}, not ${cell}`); } return; }
      if (cell !== 'T' && cell !== 'F') return;
      let truth;
      if (c && col === 'first') truth = c.P(e); else if (c && col === 'second') truth = c.Q(e);
      else if (/prime\?/.test(h)) truth = isPrime(numOf(cells[1]));
      else if (/mult\. of (\d+)\?/.test(h)) truth = mult(numOf(cells[1]), +h.match(/mult\. of (\d+)/)[1]) !== /\bnot\b/.test(h);
      if (truth !== undefined && truth !== (cell === 'T')) out.push(`table: "${h}" at ${cells[0]} should be ${truth ? 'T' : 'F'}`);
    });
  }
  return out;
}
function figIssues(q) {
  const out = []; const fig = q.data?.picture?.fig; const pf = q.data?.picture?.proof; if (!fig || !pf) return out;
  const meas = k => { const a = angleOf(fig, k); if (!a) return NaN; const [u, w] = raysOf(a); return Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1]))) * 180 / Math.PI; };
  for (const gv of pf.given.map(texPlain)) {
    let m;
    if ((m = gv.match(/∠ ?(\d), ∠ ?(\d) (form a linear pair|are supplementary)/))) {
      if (Math.abs(meas(m[1]) + meas(m[2]) - 180) > 0.5) out.push(`figure: ∠${m[1]} + ∠${m[2]} = ${(meas(m[1]) + meas(m[2])).toFixed(1)}°, not 180°`);
      if (m[3] === 'form a linear pair') {
        const A = angleOf(fig, m[1]), B = angleOf(fig, m[2]);
        const [a1, a2] = raysOf(A), [b1, b2] = raysOf(B);
        const shared = [[a1, b1], [a1, b2], [a2, b1], [a2, b2]].some(([u, w]) => sameDir(u, w));
        const opposite = [[a1, b1], [a1, b2], [a2, b1], [a2, b2]].some(([u, w]) => opp(u, w));
        if (!(shared && opposite) || Math.hypot(A.v[0] - B.v[0], A.v[1] - B.v[1]) > 1e-6) out.push(`figure: ∠${m[1]} and ∠${m[2]} are not drawn as a linear pair`);
      }
    }
    if (/ℓ ∥ m/.test(gv)) {
      const l = fig.segs.find(s => s.id === 'l'), mm = fig.segs.find(s => s.id === 'm');
      if (l && mm) { const u = unit(l.a, l.b), w = unit(mm.a, mm.b); if (!sameDir(u, w) && !opp(u, w)) out.push('figure: ℓ and m are not parallel'); }
    }
  }
  return out;
}
function sane(q) {
  const out = [];
  const p = clean(q.prompt);
  // stated squares must be right: "(−2)² = 4", "(1/4)² = 1/16"
  for (const m of p.matchAll(/\(?(-?[\d/]+)\)?² = ([\d/]+)/g)) { const a = numOf(m[1]), b = numOf(m[2]); if (!Number.isNaN(a) && !Number.isNaN(b) && !near(a * a, b)) out.push(`${m[0]} is wrong`); }
  out.push(...tableIssues(q));
  const eu = q.data?.picture?.euler; const dom = domainOf(p);
  if (eu?.tokens?.some(t => t.shape)) for (const t of eu.tokens) { const iss = t.shape ? shapeIssues(t.shape) : []; if (iss.length) out.push(`shape ${t.letter} (${t.shape.name}): ${iss[0]}`); }
  else out.push(...eulerIssues(eu, dom));
  out.push(...figIssues(q));
  // a claim said to be true must be true over its domain
  let m;
  if ((m = p.match(/(?:True statement|a statement that is true for every value) \((.+?)\): “If (.+?), then (.+?)\.”/))) {
    const d = domainOf(m[1]); const A = numPred(m[2], d?.V), B = numPred(m[3], d?.V);
    if (d && A && B && !implies(A, B, d.sample)) out.push('the statement said to be true is false');
  }
  if ((m = p.match(/notes: “If (.+?), then (.+?)\.” is true for the integers (\d+) to (\d+)/))) {
    const A = numPred(m[1], 'n'), B = numPred(m[2], 'n'); for (let n = +m[3]; n <= +m[4]; n++) if (A({ n }) && !B({ n })) { out.push(`the noted statement fails at n = ${n}`); break; }
  }
  if ((m = p.match(/reasons from a true rule: “If (.+?), then (.+?)\.”/))) {
    const A = numPred(m[1], 'n') ?? numPred(m[1], 'x'), B = numPred(m[2], 'n') ?? numPred(m[2], 'x');
    if (A && B && !implies(A, B, domainOf('n is any integer').sample)) out.push('the "true rule" is false');
  }
  // a finite set "fully checked" must really pass
  if ((m = p.match(/For every n in the set \{([^}]*)\}, (.+?)\.”/))) {
    const f = numPred(m[2], 'n'); if (f) for (const v of m[1].split(',').map(numOf)) if (!f({ n: v })) out.push(`the checked claim fails at n = ${v}`);
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch (e) { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { const r = f(q); return r; } catch { return undefined; }
  },
  sane,
};
