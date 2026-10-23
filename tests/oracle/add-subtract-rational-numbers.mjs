// Oracle for the lesson "add-subtract-rational-numbers" (signed integers, fractions, mixed numbers and decimals; the
// counter mat and the number line; meaning in context). Written from what the student sees only: the expression on the
// board or in the prompt, the drawn mat (light and dark counters) and number line (start and jump), the choices.
// Every value is worked out exactly by a small expression reader (fractions a/b, mixed numbers w a/b, decimals,
// parentheses, a real minus sign); choices are judged by testing each claim: the right structure (a − b checked by
// c + b = a, a − b rewritten as a + (−b)), the right reason, the right meaning. See docs/lessons/QUALITY_LAYER.md.
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
/** TeX of this lesson → plain text: -4\tfrac{1}{2} → −4 1/2, \tfrac{5}{8} → 5/8, \cssId{m}{-} → − */
function tex(t) {
  let s = String(t ?? '');
  for (let i = 0; i < 4; i++) s = s.replace(/\\cssId\{[^{}]*\}\{([^{}]*)\}/g, '$1').replace(/\\mathbin\{([^{}]*)\}/g, '$1');
  return s.replace(/\\overset\{\?\}\{=\}/g, '=?').replace(/(\d)\s*\\[td]?frac\{(\d+)\}\{(\d+)\}/g, '$1 $2/$3').replace(/\\[td]?frac\{(\d+)\}\{(\d+)\}/g, '$1/$2')
    .replace(/\\times/g, '×').replace(/\\text\{[^{}]*\}/g, ' ').replace(/\\[,;: ]|\\quad|\\qquad/g, ' ').replace(/\\\$/g, '$').replace(/-/g, '−').replace(/\s+/g, ' ').trim();
}
/** tokens of a plain expression */
function tokens(s) {
  const out = [], re = /\s*(?:(\d+) (\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(?:\.\d+)?)|([−+()×=?]))/y;
  let m, i = 0;
  s = String(s).replace(/-/g, '−').replace(/,(?=\d{3})/g, '');
  while (i < s.length) {
    re.lastIndex = i;
    m = re.exec(s);
    if (!m) { if (/\s/.test(s[i])) { i++; continue; } return null; }
    i = re.lastIndex;
    if (m[1] !== undefined) out.push({ t: 'n', v: Q(+m[2], +m[3]).add(+m[1]), raw: `${m[1]} ${m[2]}/${m[3]}` });
    else if (m[4] !== undefined) out.push({ t: 'n', v: Q(+m[4], +m[5]), raw: `${m[4]}/${m[5]}` });
    else if (m[6] !== undefined) out.push({ t: 'n', v: Q(m[6]), raw: m[6] });
    else out.push({ t: m[7] });
  }
  return out;
}
/** value of a plain expression (exact), or null */
function ev(s) {
  const T = tokens(s);
  if (!T || !T.length) return null;
  let k = 0;
  const peek = () => T[k]?.t, next = () => T[k++];
  function atom() {
    const x = next();
    if (!x) throw 0;
    if (x.t === '−') return atom().neg();
    if (x.t === '+') return atom();
    if (x.t === '(') { const v = sum(); if (next()?.t !== ')') throw 0; return v; }
    if (x.t === 'n') return x.v;
    throw 0;
  }
  function prod() { let v = atom(); while (peek() === '×') { next(); v = v.mul(atom()); } return v; }
  function sum() { let v = prod(); while (peek() === '+' || peek() === '−') { const o = next().t; const w = prod(); v = o === '+' ? v.add(w) : v.sub(w); } return v; }
  try { const v = sum(); return k === T.length ? v : null; } catch { return null; }
}
/** the top-level split of "a op b" (op + or −, b may be in parentheses) → { a, op, b } as plain texts */
function split2(s) {
  s = String(s).trim();
  let depth = 0;
  for (let i = s.length - 1; i > 0; i--) {
    const c = s[i];
    if (c === ')') depth++;
    else if (c === '(') depth--;
    else if (depth === 0 && (c === '+' || c === '−') && s[i - 1] === ' ' && s[i + 1] === ' ') return { a: s.slice(0, i).trim(), op: c, b: s.slice(i + 1).trim() };
  }
  return null;
}
const lhs = b => tex(b).split(/=/)[0].trim();
const V = s => ev(s);
const eqQ = (a, b) => a != null && b != null && a.eq(b);
const frac = v => (v.d === 1 ? v.value : v.pair);
const out = (q, v) => (v == null ? undefined : q.input === 'frac' ? v.pair : v.value);

// ---------------------------------------------------------------- the families
const evalBoard = q => out(q, V(lhs(q.board)));
const F = {
  signRole(q) {
    // the marked minus: binary after a number or ")" (it subtracts); unary before "(" (the opposite of); unary before
    // a number (part of a negative number)
    let s = String(q.board ?? '');
    const at = s.indexOf('\\cssId{m}{-}');
    if (at < 0) return undefined;
    let before = s.slice(0, at).replace(/\\mathbin\{$/, '');
    const after = s.slice(at + '\\cssId{m}{-}'.length).replace(/^\}/, '');
    before = tex(before).trim();
    const prev = before.slice(-1);
    const binary = /[\d)]/.test(prev);
    const nextCh = after.trim()[0];
    const role = binary ? 'sub' : nextCh === '(' ? 'opp' : 'neg';
    return choiceWhere(q, c => (role === 'sub' ? /^It subtracts/.test(c) : role === 'opp' ? /the opposite of/.test(c) : /part of a negative number/.test(c)));
  },
  opposite(q) {
    const m = q.prompt.match(/^x = (.+?)\. What is −x\?$/);
    if (m) { const x = V(m[1]); return out(q, x?.neg()); }
    return evalBoard(q);
  },
  mat(q) {
    const P = q.data?.picture;
    const m = q.prompt.match(/What is (.+?)\?$/);
    if (/What number does the mat show\?/.test(q.prompt) && P?.kind === 'mat') return P.pos - P.neg;
    if (m) return out(q, V(m[1]));
    return undefined;
  },
  inverse(q) {
    const m = q.prompt.match(/^What is (.+?)\?$/);
    const v = m && V(m[1]);
    return v ? choiceWhere(q, c => eqQ(V(c), v)) : undefined;
  },
  jumpAdd: evalBoard,
  flipJump: evalBoard,
  addSame: evalBoard,
  addOpp: evalBoard,
  subInt: evalBoard,
  fracSigned: evalBoard,
  mixedOps: evalBoard,
  decSigned: evalBoard,
  mixFormat: evalBoard,
  lineRead(q) {
    const P = q.data?.picture;
    if (!P || P.kind !== 'line') return undefined;
    const p = Q(String(P.p)), j = Q(String(P.q));
    return choiceWhere(q, c => { const s = split2(c); if (!s || s.op !== (P.op ?? '+')) return false; return eqQ(V(s.a), p) && eqQ(V(s.b), j); });
  },
  rewrite(q) {
    const m = q.prompt.match(/^Which addition has the same value as (.+?)\?$/);
    const s = m && split2(m[1]);
    if (!s || s.op !== '−') return undefined;
    const a = V(s.a), b = V(s.b);
    // a − b is a + (the opposite of b)
    return choiceWhere(q, c => { const x = split2(c); return !!x && x.op === '+' && eqQ(V(x.a), a) && eqQ(V(x.b), b.neg()); });
  },
  distChange(q) {
    const p = q.prompt;
    let m = p.match(/it was (−?\d+) °F\. At .+? it was (−?\d+) °F\./) ?? p.match(/went from (−?\$\d+(?:\.\d+)?) to (−?\$\d+(?:\.\d+)?)\./)
      ?? p.match(/read (−?\d+) ft, then (−?\d+) ft/) ?? p.match(/from .+? \((−?[\d,]+) ft\) to .+? \((−?[\d,]+) ft\)\./);
    if (!m) return undefined;
    const a = V(m[1].replace('$', '')), b = V(m[2].replace('$', ''));
    const ch = b.sub(a);
    return [ch.value, Math.abs(ch.value)];
  },
  mixedMeaning(q) {
    const p = q.prompt;
    let m = p.match(/^Which improper fraction equals (.+?)\?$/);
    if (m) { const v = V(m[1]); return choiceWhere(q, c => /^−?\d+\/\d+$/.test(c) && eqQ(V(c), v)); }
    m = p.match(/^Between which two integers is (.+?)\?$/);
    if (m) {
      const v = V(m[1]);
      return choiceWhere(q, c => { const x = c.match(/^(−?\d+) and (−?\d+)$/); if (!x) return false; const lo = V(x[1]), hi = V(x[2]); return hi.sub(lo).eq(1) && v.cmp(lo) > 0 && v.cmp(hi) < 0; });
    }
    m = p.match(/^What does (.+?) mean\?$/);
    if (m) { const v = V(m[1]); return choiceWhere(q, c => eqQ(V(c), v)); }
    return undefined;
  },
  whatMeans(q) {
    const m = q.prompt.match(/Which situation does (.+?) describe\?$/);
    const s = m && split2(m[1]);
    if (!s) return undefined;
    const a = V(s.a), b = V(s.b), eff = s.op === '+' ? b : b.neg();
    return choiceWhere(q, c => {
      let x = c.match(/^The change in temperature from (−?\d+) °F to (−?\d+) °F\.$/);
      if (x) return s.op === '−' && eqQ(a, V(x[2])) && eqQ(b, V(x[1]));
      let start = null, change = null, kind = null;
      if ((x = c.match(/^You (have|owe) \$(\d+), and (.+)\.$/))) {
        start = Q(+x[2]).mul(x[1] === 'owe' ? -1 : 1);
        const y = x[3].match(/(\d+)/), n = Q(+y[1]);
        if (/debt is canceled/.test(x[3])) { change = n; kind = 'cancel'; }
        else if (/are paid/.test(x[3])) { change = n; kind = 'paid'; }
        else if (/fee/.test(x[3])) { change = n.neg(); kind = 'fee'; }
        else if (/spend/.test(x[3])) { change = n.neg(); kind = 'spend'; }
      } else if ((x = c.match(/^A (diver|drone) is (\d+) ft (below|above) sea level and (rises|goes down) (\d+) ft\.$/))) {
        start = Q(+x[2]).mul(x[3] === 'below' ? -1 : 1); change = Q(+x[5]).mul(x[4] === 'rises' ? 1 : -1); kind = x[4];
      } else if ((x = c.match(/^It is (\d+) °F( below zero)?, and it (warms up|cools down) (\d+) °F\.$/))) {
        start = Q(+x[1]).mul(x[2] ? -1 : 1); change = Q(+x[4]).mul(x[3] === 'warms up' ? 1 : -1); kind = x[3];
      }
      if (!start) return false;
      if (!eqQ(start, a) || !eqQ(change, eff)) return false;
      // the operation must be the one the story does: a canceled debt takes away a negative (a − (−b)); spending takes
      // away (a − b); being paid adds (a + b); a fee adds a negative (a + (−b)); rising / warming add; going down /
      // cooling add a negative or take away
      if (kind === 'cancel') return s.op === '−' && b.cmp(0) < 0;
      if (kind === 'spend') return s.op === '−' && b.cmp(0) > 0;
      if (kind === 'paid') return s.op === '+' && b.cmp(0) > 0;
      if (kind === 'fee') return s.op === '+' && b.cmp(0) < 0;
      return true;
    });
  },
  matStep(q) {
    const p = q.prompt;
    let m = p.match(/^For (.+?), the mat shows (−?\d+) and has no (dark|light) counters, so Ava adds (\d+) zero pairs, then takes away (\d+) (dark|light) counters\. Which step of the rule is that\?$/);
    if (m) {
      const s = split2(m[1]), a = V(s.a), b = V(s.b);
      return choiceWhere(q, c => { const x = c.match(/^Rewrite the subtraction as adding the opposite: (.+)$/); if (!x) return false; const y = split2(x[1]); return !!y && y.op === '+' && eqQ(V(y.a), a) && eqQ(V(y.b), b.neg()); });
    }
    m = p.match(/^On the mat, (.+?) is (\d+) light and (\d+) dark counters\. Removing the (\d+) zero pairs matches which step of the rule\?$/);
    if (m) {
      const big = Math.max(+m[2], +m[3]), small = Math.min(+m[2], +m[3]);
      return choiceWhere(q, c => { const x = c.match(/^Subtract the sizes(?:: (\d+) − (\d+)(?: = (\d+))?)?$/); return !!x && (x[1] === undefined || (+x[1] === big && +x[2] === small && (x[3] === undefined || +x[3] === big - small))); });
    }
    m = p.match(/^For (.+?), the zero pairs are gone and (\d+) (dark|light) counters are left\. Which step of the rule does the COLOUR match\?$/);
    if (m) {
      const s = split2(m[1]), a = V(s.a), b = V(s.b);
      const bigger = Math.abs(a.value) > Math.abs(b.value) ? a : b;
      // the sign of the bigger size; "the sign of the first number" only matches when the first is the bigger size
      // the sign of the bigger size ("the sign of the first number" is not the rule, even when it happens to agree)
      return bigger ? choiceWhere(q, c => /^Give the answer the sign of the bigger size$/.test(c)) : undefined;
    }
    m = p.match(/^The mat showed (−?\d+)\. Ava added (\d+) zero pairs \(the new columns\)\. What does the mat show now\?$/);
    if (m) { const v = V(m[1]); return choiceWhere(q, c => eqQ(V(c), v)); }
    return undefined;
  },
  fracSign(q) {
    const v = V(lhs(q.board));
    if (!v) return undefined;
    const sg = v.cmp(0);
    return choiceWhere(q, c => (c === 'Positive' ? sg > 0 : c === 'Negative' ? sg < 0 : c === 'Zero' ? sg === 0 : false));
  },
  regroup(q) {
    const p = q.prompt;
    let m = p.match(/swaps (.+?) to (.+?)\. Is the value the same\?$/);
    if (m) {
      const a = V(m[1]), b = V(m[2]);
      return choiceWhere(q, c => {
        const x = c.match(/^No: (.+?) is the opposite, (.+)$/);
        if (x) return !a.eq(b) && eqQ(V(x[1]), b) && eqQ(V(x[2]), b) && b.eq(a.neg());
        if (/^Yes/.test(c)) return a.eq(b) && !/only when|always/.test(c);
        return false;
      });
    }
    m = p.match(/^Which has the same value as (.+?), and is easier to work out\?$/);
    if (m) { const v = V(m[1]); return choiceWhere(q, c => eqQ(V(c), v)); }
    return undefined;
  },
  property(q) {
    const [L, R] = tex(q.board).split('=').map(x => x.trim());
    if (L === R) return -1;   // nothing changes: no property names the step
    const kind = propKind(L, R);
    if (!kind) return undefined;
    return choiceWhere(q, c => (kind === 'comm' ? /^Commutative/.test(c) : kind === 'assoc' ? /^Associative/.test(c) : kind === 'inv' ? /^Additive inverse/.test(c) : false));
  },
  lineCheck(q) {
    const [L, R] = tex(q.board).split('=?').map(x => x.trim());
    const v = V(L), c0 = V(R);
    if (!v || !c0) return undefined;
    const right = v.eq(c0);
    return choiceWhere(q, c => {
      const x = c.match(/^The line shows it is wrong: it lands on (.+)\.$/);
      if (x) return !right && eqQ(V(x[1]), v);
      if (/^The line agrees: the claim is right/.test(c)) return right;
      return false;   // one picture cannot prove a rule for every pair
    });
  },
  checkPick(q) {
    const m = q.prompt.match(/^Which addition checks that (.+?) = (.+?)\?$/);
    const s = m && split2(m[1]);
    if (!s || s.op !== '−') return undefined;
    const a = V(s.a), b = V(s.b), c0 = V(m[2]);
    // a − b = c is checked by c + b = a
    return choiceWhere(q, ch => {
      const [lft, rgt] = ch.split(' = ');
      const x = split2(lft);
      if (!x || x.op !== '+' || rgt === undefined) return false;
      const u = V(x.a), w = V(x.b), z = V(rgt);
      if (!u || !w || !z || !u.add(w).eq(z)) return false;
      return z.eq(a) && ((u.eq(c0) && w.eq(b)) || (u.eq(b) && w.eq(c0)));
    });
  },
  checkJudge(q) {
    const m = q.prompt.match(/^Ana says (.+?) = (.+?)\. Check her answer by adding back\./);
    const s = m && split2(m[1]);
    if (!s || s.op !== '−') return undefined;
    const a = V(s.a), b = V(s.b), c0 = V(m[2]);
    const right = a.sub(b).eq(c0);
    const addBack = (u, w, z) => !!u && !!w && !!z && u.add(w).eq(z) && ((u.eq(c0) && w.eq(b)) || (u.eq(b) && w.eq(c0)));
    return choiceWhere(q, ch => {
      let x = ch.match(/^Right: (.+?) = (.+)$/);
      if (x && !/again/.test(ch)) { const y = split2(x[1]); return right && !!y && y.op === '+' && addBack(V(y.a), V(y.b), V(x[2])) && V(x[2]).eq(a); }
      x = ch.match(/^Wrong: (.+?) = (.+?)(?:, and that is not|, not) (.+)$/);
      if (x) { const y = split2(x[1]); return !right && !!y && y.op === '+' && addBack(V(y.a), V(y.b), V(x[2])) && eqQ(V(x[3]), a) && !V(x[2]).eq(a); }
      return false;   // doing the subtraction again checks nothing
    });
  },
  story(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/hangs (\S+) ft (above|below) the rim of a well\. You (lower|raise) it (\S+) ft\./))) return Q(m[1]).mul(m[2] === 'above' ? 1 : -1).add(Q(m[4]).mul(m[3] === 'raise' ? 1 : -1)).value;
    if ((m = p.match(/account has (−?)\$(\S+?)\. She pays a \$(\S+) bill/))) return Q(m[2]).mul(m[1] ? -1 : 1).sub(Q(m[3])).value;
    if ((m = p.match(/the temperature was (−?\d+(?:\.\d+)?) °F\. By midnight it had (risen|dropped) (\d+(?:\.\d+)?) °F\./))) return V(m[1]).add(Q(m[3]).mul(m[2] === 'risen' ? 1 : -1)).value;
    if ((m = p.match(/is at (−?\d+) ft \(below sea level is negative\)\. It (dives|rises) (\d+) ft/))) return V(m[1]).add(Q(+m[3]).mul(m[2] === 'rises' ? 1 : -1)).value;
    if ((m = p.match(/^At noon it was (−?\d+) °F; at .+? it was (−?\d+) °F\. What was the CHANGE/))) return V(m[2]).sub(V(m[1])).value;
    return undefined;
  },
  signMeaning(q) {
    const m = q.prompt.match(/^The change in (the balance|elevation|temperature) is (−?\d+(?:\.\d+)?) (dollars|ft|°F)\./);
    if (!m) return undefined;
    const v = V(m[2]), n = Math.abs(v.value), up = v.cmp(0) > 0;
    return choiceWhere(q, c => {
      let x;
      if ((x = c.match(/^There is \$(\S+) (more|less) than before\.$/))) return m[1] === 'the balance' && +x[1] === n && (x[2] === 'more') === up;
      if ((x = c.match(/^It is (\S+) ft (higher|lower) than before\.$/))) return m[1] === 'elevation' && +x[1] === n && (x[2] === 'higher') === up;
      if ((x = c.match(/^It got (\S+) °F (warmer|colder)\.$/))) return m[1] === 'temperature' && +x[1] === n && (x[2] === 'warmer') === up;
      return false;   // a change is not the new value
    });
  },
};

/** which property turns L into R: 'comm' (order of terms), 'assoc' (grouping), 'inv' (x + (−x) → 0), or null */
function propKind(L, R) {
  const terms = s => { const T = tokens(s); if (!T) return null; const out = []; let sign = 1, prevOp = true; for (const t of T) { if (t.t === 'n') { out.push((sign < 0 ? '−' : '') + t.raw); sign = 1; prevOp = false; } else if (t.t === '−' && prevOp) sign = -sign; else if (t.t === '+' || t.t === '−') prevOp = true; } return out; };
  const tl = terms(L), tr = terms(R);
  if (!tl || !tr) return null;
  const flat = s => s.replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
  if (L === R) return null;
  if (tl.join('|') === tr.join('|') && L !== R) return 'assoc';
  if ([...tl].sort().join('|') === [...tr].sort().join('|') && tl.join('|') !== tr.join('|')) return 'comm';
  if (tr.includes('0') && !tl.includes('0') && tl.length === tr.length + 1) return 'inv';
  return flat(L) === flat(R) ? 'assoc' : null;
}

// ---------------------------------------------------------------- sane
function sane(q) {
  const o = [], p = q.prompt;
  switch (q.family) {
    case 'property': {
      const [L, R] = tex(q.board).split('=').map(x => x.trim());
      if (L === R) o.push('both sides are the same: no step to name');
      break;
    }
    case 'mat': {
      const P = q.data?.picture, m = p.match(/^The mat shows (−?\d+)\. To take away (\d+) (light|dark) counters, (\d+) zero pairs? (?:was|were) added first\./);
      if (P?.kind === 'mat' && /What number does the mat show/.test(p)) { const b = V(lhs(q.board)); if (b && b.value !== P.pos - P.neg) o.push('the board sum is not the drawn mat'); }
      if (m) {
        const shown = V(m[1]).value, take = +m[2], light = m[3] === 'light', add = +m[4];
        const have = light ? Math.max(shown, 0) : Math.max(-shown, 0);
        if (have + add !== take) o.push(`${add} zero pairs do not make exactly ${take} ${m[3]} counters to take away`);
      }
      break;
    }
    case 'lineRead': {
      const P = q.data?.picture;
      if (P && (P.p < P.lo || P.p > P.hi || P.p + P.q < P.lo || P.p + P.q > P.hi)) o.push('the jump runs off the drawn line');
      break;
    }
    case 'distChange': {
      const H = { 'Badwater Basin in Death Valley': -282, 'Mount Whitney': 14505, 'Denali': 20310, 'Mount Washington': 6288 };
      for (const [k, h] of Object.entries(H)) {
        const m = p.match(new RegExp(`${k} \\((−?[\\d,]+) ft\\)`));
        if (m && V(m[1].replace(/,/g, ''))?.value !== h) o.push(`${k} is ${h} ft, not ${m[1]}`);
      }
      const m = p.match(/the top of (.+?) \(/);
      if (m && !Object.keys(H).some(k => m[1].includes(k))) o.push('an unknown height');
      break;
    }
    case 'story': {
      if (/temperature was/.test(p)) { const v = F.story(q); if (v !== undefined && (v < -60 || v > 120)) o.push(`${v} °F is not a real air temperature`); }
      const m = p.match(/is at (−?\d+) ft .*? It rises (\d+) ft/);
      if (m && V(m[1]).value + +m[2] > 0) o.push('a submarine rising above sea level');
      break;
    }
    case 'whatMeans': case 'checkPick': case 'checkJudge': case 'lineCheck': case 'regroup': break;
    default: break;
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) o.push('no single right choice');
  }
  return [...new Set(o)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { const r = f(q); return r ?? undefined; } catch { return undefined; }
  },
  sane,
};
