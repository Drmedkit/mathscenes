// linear-equations oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the student
// sees: the board TeX, the prompt, the choices. Equations are parsed into linear forms a·x + b with exact fractions and
// solved here (one solution / none / every number); every choice is judged by the maths of its claim: the step is
// applied to both sides, the sides are evaluated, the solution sets are compared. Reasons that do not prove the claim
// (trying a few numbers, "they look different", "the x's cancel", "it checks in the rewritten line") count as wrong.
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text → maths
/** TeX (board) → maths text, \frac{a}{b} as ((a)/(b)) */
function texMath(tex) {
  let s = String(tex ?? '');
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(/\\cssId\{[^{}]*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g, '$1')
      .replace(/\\(?:text|mathrm|textbf|mathbf)\{([^{}]*)\}/g, '$1')
      .replace(/\\[td]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    if (s === before) break;
  }
  return s.replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\left|\\right/g, '')
    .replace(/\\square/g, '□').replace(/\\;\\to\\;|\\to/g, ' → ').replace(/\\qquad/g, ' ⫽ ')
    .replace(/\\[,;:! ]|\\quad|~/g, ' ⫽ ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
function decQ(s) {
  const m = String(s).match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}
/** '−7/2' '2.4' '$35.00' → exact Q */
const num = t => {
  const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '').replace(/\.$/, '');
  const m = s.match(/^(-?)(\d+)\/(\d+)$/);
  return m ? Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1) : decQ(s);
};
const NUM = '([−-]?\\d+(?:\\.\\d+)?(?:\\/\\d+)?)';

// ---- linear forms {a, b} = a·x + b, exact ----
const toQ = v => (typeof v === 'object' && v && 'n' in v ? v : Q(v));
const lin = (a, b) => ({ a: toQ(a), b: toQ(b) });
const add = (u, v) => lin(u.a.add(v.a), u.b.add(v.b));
const neg = u => lin(u.a.neg(), u.b.neg());
const sub = (u, v) => add(u, neg(v));
const isConst = u => u.a.n === 0;
function mul(u, v) {
  if (!isConst(u) && !isConst(v)) throw new Error('not linear');
  return isConst(u) ? lin(v.a.mul(u.b), v.b.mul(u.b)) : lin(u.a.mul(v.b), u.b.mul(v.b));
}
function div(u, v) {
  if (!isConst(v) || v.b.n === 0) throw new Error('bad divisor');
  return lin(u.a.div(v.b), u.b.div(v.b));
}
const same = (u, v) => u.a.eq(v.a) && u.b.eq(v.b);
const at = (u, x) => u.a.mul(x).add(u.b);

/** parse an expression in one letter variable into a linear form; terms are read left to right (1/4x = (1/4)·x) */
function parseExpr(text) {
  const s = String(text).replace(/[−–]/g, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '').replace(/,(?=\d{3})/g, '');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; const m = re.exec(s);
    if (!m) throw new Error(`bad char in ${s}`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = op === '+' ? add(v, w) : sub(v, w); }
    return v;
  }
  function term() {
    let v = factor();
    for (;;) {
      const t = peek();
      if (t === '*') { next(); v = mul(v, factor()); } else if (t === '/') { next(); v = div(v, factor()); } else if (t !== undefined && (t === '(' || /^[\d.A-Za-z]/.test(t))) v = mul(v, factor());
      else break;
    }
    return v;
  }
  function factor() {
    const t = peek();
    if (t === '-') { next(); return neg(factor()); }
    if (t === '+') { next(); return factor(); }
    return primary();
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return v; }
    if (t === undefined) throw new Error('unexpected end');
    if (/^[A-Za-z]$/.test(t)) return lin(1, 0);
    if (/^[\d.]/.test(t)) return lin(0, decQ(t));
    throw new Error(`unexpected ${t}`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing tokens in ${s}`);
  return v;
}
function parseEq(text) {
  const parts = String(text).split('=');
  if (parts.length !== 2) throw new Error(`not one equation: ${text}`);
  return { L: parseExpr(parts[0]), R: parseExpr(parts[1]) };
}
const tryEq = t => { try { return parseEq(t); } catch { return null; } };
const tryExpr = t => { try { return parseExpr(t); } catch { return null; } };
/** the solution set: { kind: 'one', x } | { kind: 'none' } | { kind: 'all' } */
function sol(e) {
  const a = e.L.a.sub(e.R.a), c = e.R.b.sub(e.L.b);
  if (a.n !== 0) return { kind: 'one', x: c.div(a) };
  return c.n === 0 ? { kind: 'all' } : { kind: 'none' };
}
const sameSol = (s, t) => s.kind === t.kind && (s.kind !== 'one' || s.x.eq(t.x));
const holds = (e, x) => at(e.L, x).eq(at(e.R, x));
const sidesSame = (e, f) => same(e.L, f.L) && same(e.R, f.R);
/** the board's equations (split on \quad, \qquad, \to) */
const boardEqs = q => texMath(q.board).split(/⫽|→/).map(s => s.trim()).filter(s => s.includes('=')).map(parseEq);
const boardEq = q => boardEqs(q)[0];
/** "x = v" in a choice → Q */
const xIs = c => { const m = String(c).match(new RegExp(`^x = ${NUM}`)); return m ? num(m[1]) : null; };

// ---------------------------------------------------------------- families: each returns per-choice truth or a value
const F = {
  checkBoth(q) {
    const v = num(q.prompt.match(new RegExp(`Is x = ${NUM} a solution`))[1]);
    const e = boardEq(q), L = at(e.L, v), R = at(e.R, v);
    return q.choices.map(c => {
      let m;
      if ((m = c.match(new RegExp(`^Yes: both sides are ${NUM}$`)))) return L.eq(R) && L.eq(num(m[1]));
      if ((m = c.match(new RegExp(`^No: the left side is ${NUM}, the right side is ${NUM}$`)))) return !L.eq(R) && L.eq(num(m[1])) && R.eq(num(m[2]));
      // "the right side shows B": reading a number off the right side instead of working it out
      if ((m = c.match(new RegExp(`^(Yes|No): the left side is ${NUM}, and the right side shows ${NUM}$`)))) return (m[1] === 'Yes') === L.eq(R) && L.eq(num(m[2])) && R.eq(num(m[3])) && false;
      return false;
    });
  },
  evalSides(q) {
    const v = num(q.prompt.match(new RegExp(`Put x = ${NUM} into`))[1]);
    const e = boardEq(q);
    return [at(e.L, v), at(e.R, v)];
  },
  sameSet(q) {
    const dom = q.prompt.match(/Use only x = ([^.]+)\./)[1].split(',').map(s => num(s.trim()));
    const eqs = boardEqs(q);
    const S = eqs.map(e => dom.filter(x => holds(e, x)));
    const key = s => s.map(String).sort().join(',');
    const eqSet = key(S[0]) === key(S[1]);
    const inS = (i, v) => S[i].some(x => x.eq(v));
    const whole = i => S[i].length === dom.length;
    const named = t => { // "E1 ..." → which equation index the text starts with
      for (let i = 0; i < 2; i++) { const e = tryEq(t); if (e && sidesSame(e, eqs[i])) return i; }
      return -1;
    };
    return q.choices.map(c => {
      let m;
      if ((m = c.match(/^Yes: exactly the same values work in both \((.+)\)$/))) {
        if (!eqSet) return false;
        if (m[1] === 'no value') return S[0].length === 0;
        const mm = m[1].match(/^x = (.+)$/);
        if (!mm) return false;
        const vs = mm[1].split(/,\s*|\s+and\s+/).map(num);
        return vs.length === S[0].length && vs.every(v => inS(0, v));
      }
      if ((m = c.match(new RegExp(`^No: (.+?) (?:works|is true) for x = ${NUM}, (?:the other|(.+?)) for x = ${NUM}$`)))) {
        const i = named(m[1]); if (i < 0) return false;
        const j = 1 - i;
        if (m[3] && named(m[3]) !== j) return false;
        return !eqSet && S[i].length === 1 && inS(i, num(m[2])) && S[j].length === 1 && inS(j, num(m[4]));
      }
      if ((m = c.match(new RegExp(`^No: (.+?) is true for x = ${NUM}, (.+?) for every value in the set$`)))) {
        const i = named(m[1]), j = named(m[3]);
        return i >= 0 && j === 1 - i && !eqSet && S[i].length === 1 && inS(i, num(m[2])) && whole(j);
      }
      // "x = a makes both true", "each has exactly one solution", "they look different": not a reason for the claim
      return false;
    });
  },
  keepStep(q) {
    const s0 = sol(boardEq(q));
    return q.choices.map(c => { const e = tryEq(c); return !!e && sameSol(sol(e), s0); });
  },
  noResolve(q) {
    const e2 = boardEqs(q)[1], s2 = sol(e2);
    return q.choices.map(c => {
      if (/^You have to solve it again/.test(c)) return false;
      const v = xIs(c);
      return v !== null && s2.kind === 'one' && s2.x.eq(v);
    });
  },
  varStep(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/^(.+?) becomes (.+?)\. Why does this keep the solutions\?/))) {
      const e1 = parseEq(m[1]), e2 = parseEq(m[2]);
      const dl = sub(e1.L, e2.L), dr = sub(e1.R, e2.R); // what each side lost
      return q.choices.map(c => {
        const mm = c.match(/^(.+?) was (subtracted from|added to) both sides: both (?:lose|gain) the same amount, whatever x is$/);
        if (!mm) return false;
        const t = tryExpr(mm[1]); if (!t) return false;
        const lost = mm[2].startsWith('sub') ? t : neg(t);
        return same(dl, lost) && same(dr, lost);
      });
    }
    return stepLine(q);
  },
  rewrite(q) {
    const [e1, e2] = boardEqs(q);
    const keeps = sameSol(sol(e1), sol(e2));
    return q.choices.map(c => {
      let m;
      if ((m = c.match(/^Yes: (.+?) has the same value as (.+?) for every x$/))) {
        const a = tryExpr(m[1]), b = tryExpr(m[2]);
        return keeps && !!a && !!b && same(a, b) && (same(a, e2.L) || same(a, e2.R));
      }
      if ((m = c.match(/^No: (.+?) is (.+?), so the left side changed value$/))) {
        const a = tryExpr(m[1]), b = tryExpr(m[2]);
        return !keeps && !!a && !!b && same(a, b) && same(b, e1.L) && !same(e1.L, e2.L) && same(e1.R, e2.R);
      }
      if ((m = c.match(new RegExp(`^No: the left side kept its value, but the right side changed by ${NUM}$`)))) {
        return !keeps && same(e1.L, e2.L) && same(sub(e2.R, e1.R), lin(0, num(m[1])));
      }
      // conditional answers ("Yes, if …", "Only if …"), "the equation changed", "expanding never changes": not the answer
      return false;
    });
  },
  zeroStep(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(new RegExp(`^(.+?) has the solution x = ${NUM}\\. Multiply both sides by ${NUM}\\.`)))) {
      const e = parseEq(m[1]), k = num(m[3]);
      const e2 = { L: mul(e.L, lin(0, k)), R: mul(e.R, lin(0, k)) };
      const keeps = sameSol(sol(e), sol(e2));
      return q.choices.map(c => {
        const mm = c.match(/^No: it becomes (.+?), so every number works$/);
        if (mm) { const f = tryEq(mm[1]); return !keeps && !!f && sidesSame(f, e2) && sol(e2).kind === 'all'; }
        if (/^Yes: the same operation on both sides keeps the solutions$/.test(c)) return keeps;
        return false; // "x = s still works" answers a smaller question
      });
    }
    if (/^Which step can CHANGE the solutions of/.test(p)) {
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^Multiplying both sides by ${NUM}$`)))) return num(mm[1]).n === 0;
        if ((mm = c.match(new RegExp(`^Dividing both sides by ${NUM}$`)))) return false; // by a nonzero number: kept
        if ((mm = c.match(new RegExp(`^(?:Adding|Subtracting) ${NUM}`)))) return false;
        return false;
      });
    }
    if ((m = p.match(/divides both sides of (.+?) by x, gets (.+?), and says “no solution”/))) {
      const e = parseEq(m[1]), s = sol(e);
      const right = s.kind !== 'none'; // the claim "no solution" is wrong when anything works
      return q.choices.map(c => {
        const mm = c.match(new RegExp(`^No: dividing by x is not allowed when x = 0, and x = ${NUM} is a solution$`));
        if (mm) return right && holds(e, num(mm[1])) && num(mm[1]).n === 0;
        return false;
      });
    }
    return null;
  },
  howMany(q) {
    const e = boardEq(q), s = sol(e);
    const L = e.L, R = e.R;
    return q.choices.map(c => {
      let m;
      if ((m = c.match(/^Every number: both sides are the same expression, (.+)$/))) { const t = tryExpr(m[1]); return s.kind === 'all' && !!t && same(t, L) && same(t, R); }
      if ((m = c.match(new RegExp(`^One number: x = ${NUM}(?: works)?$`)))) return s.kind === 'one' && s.x.eq(num(m[1]));
      if ((m = c.match(new RegExp(`^x = ${NUM}$`)))) return s.kind === 'one' && s.x.eq(num(m[1]));
      if ((m = c.match(new RegExp(`^No number: the right side is always ${NUM} (more|less) than the left$`)))) {
        const d = sub(R, L); return s.kind === 'none' && isConst(d) && d.b.eq(m[2] === 'more' ? num(m[1]) : num(m[1]).neg());
      }
      if (/^Every number makes it true$/.test(c)) return s.kind === 'all';
      if (/^No number makes it true$/.test(c)) return s.kind === 'none';
      // "x = 0, 1 and 2 all work", "I tried x = 0 to 8", "the x's cancel": examples or half a reason
      return false;
    });
  },
  solve(q) {
    const s = sol(boardEq(q));
    return s.kind === 'one' ? s.x : null;
  },
  nextLine(q) {
    const p = q.prompt;
    let m;
    if (/^(Subtract|Add) .+ (from|to) both sides of/.test(p)) return stepLine(q);
    if (/What is x\?$/.test(p)) {
      const s = sol(boardEq(q));
      return q.choices.map(c => { const v = xIs(c); return v !== null && s.kind === 'one' && s.x.eq(v); });
    }
    if ((m = p.match(new RegExp(`ends with ${NUM} = x\\. Is that finished\\?`)))) {
      const v = num(m[1]);
      return q.choices.map(c => { const mm = c.match(new RegExp(`^Yes: ${NUM} = x means x = ${NUM}$`)); return !!mm && num(mm[1]).eq(v) && num(mm[2]).eq(v); });
    }
    if (/^Expand the parentheses in/.test(p)) {
      const e = boardEq(q);
      return q.choices.map(c => { const f = tryEq(c); return !!f && !/\(/.test(c) && sidesSame(e, f); });
    }
    if ((m = p.match(/multiplies every term by (\d+) instead of (\d+)\. Is that allowed\?/))) {
      const k = Number(m[1]), lcd = lcdOf(q.board);
      return q.choices.map(c => {
        const mm = c.match(/^Yes: any common multiple clears the fractions; (\d+) just keeps the numbers smaller$/);
        return !!mm && k % lcd === 0 && Number(mm[1]) === lcd;
      });
    }
    if ((m = p.match(/^Multiply both sides of .+? by (\d+) to clear the fractions/))) {
      const k = lin(0, Number(m[1])), e = boardEq(q);
      const want = { L: mul(e.L, k), R: mul(e.R, k) };
      return q.choices.map(c => { const f = tryEq(c); return !!f && sidesSame(f, want) && !/\//.test(c); });
    }
    return null;
  },
  checkOrig(q) {
    const v = num(q.prompt.match(new RegExp(`That gives x = ${NUM}`))[1]);
    const e = boardEq(q), L = at(e.L, v), R = at(e.R, v);
    return q.choices.map(c => {
      let m;
      if ((m = c.match(new RegExp(`^No: in the original the sides are ${NUM} and ${NUM}$`)))) return !L.eq(R) && L.eq(num(m[1])) && R.eq(num(m[2]));
      if ((m = c.match(new RegExp(`^Yes: in the original, both sides are ${NUM}$`)))) return L.eq(R) && L.eq(num(m[1]));
      // "it checks in the rewritten line", "multiplying by 10 never/always changes it": not a check of x
      return false;
    });
  },
  classify(q) {
    const s = sol(boardEq(q));
    return q.choices.map(c => {
      if (/^Infinitely many solutions/.test(c)) return s.kind === 'all';
      if (/^No solution$/.test(c)) return s.kind === 'none';
      const m = c.match(new RegExp(`^One solution: x = ${NUM}$`));
      return !!m && s.kind === 'one' && s.x.eq(num(m[1]));
    });
  },
  predict(q) {
    const e = boardEq(q), s = sol(e);
    return q.choices.map(c => {
      let m;
      if ((m = c.match(new RegExp(`^No solution: same x-coefficient, different numbers \\(${NUM} and ${NUM}\\)$`)))) {
        const a = num(m[1]), b = num(m[2]);
        return s.kind === 'none' && ((a.eq(e.L.b) && b.eq(e.R.b)) || (a.eq(e.R.b) && b.eq(e.L.b)));
      }
      if ((m = c.match(new RegExp(`^One solution: the x-coefficients differ \\(${NUM} and ${NUM}\\)$`)))) {
        const a = num(m[1]), b = num(m[2]);
        return s.kind === 'one' && !a.eq(b) && ((a.eq(e.L.a) && b.eq(e.R.a)) || (a.eq(e.R.a) && b.eq(e.L.a)));
      }
      if ((m = c.match(/^Infinitely many: both sides simplify to (.+)$/))) { const t = tryExpr(m[1]); return s.kind === 'all' && !!t && same(t, e.L) && same(t, e.R); }
      return false; // "both sides have −2x", "the two sides look different"
    });
  },
  construct(q) {
    const p = q.prompt;
    let m;
    if (q.input === 'pair') {
      const lead = parseExpr(q.pair.lead.replace(/=\s*$/, ''));
      if (/infinitely many solutions/.test(p)) return [lead.a, lead.b];
      // "no solution" / "exactly one solution": many right pairs (any other number / any other coefficient); the
      // lesson's own pick cannot be predicted from the question, so this oracle does not answer these.
      return null;
    }
    if (q.input === 'num') {
      const [lt, rt] = texMath(q.board).split('=');
      const L = parseExpr(lt), R = parseExpr(rt.replace(/\+\s*□/, '').replace(/□/, '0'));
      if (/infinitely many solutions/.test(p)) return L.a.eq(R.a) ? L.b.sub(R.b) : null;
      return null; // "no solution": every number but one works
    }
    if ((m = p.match(/^Which number in the box gives .+ (infinitely many solutions|no solution)\?/))) {
      const [lt, rt] = texMath(q.board).split('=');
      const L = parseExpr(lt), R = parseExpr(rt.replace(/\+\s*□/, '').replace(/□/, '0'));
      const want = m[1] === 'no solution' ? 'none' : 'all';
      return q.choices.map(c => {
        if (/^No number works/.test(c)) return !L.a.eq(R.a);
        let v; try { v = num(c); } catch { return false; }
        return sol({ L, R: add(R, lin(0, v)) }).kind === want;
      });
    }
    if (/How many solutions now\?/.test(p)) {
      const s = sol(boardEq(q));
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^Still exactly one: x = ${NUM}$`)))) return s.kind === 'one' && s.x.eq(num(mm[1]));
        if (/^Infinitely many solutions$/.test(c)) return s.kind === 'all';
        if (/^No solution/.test(c)) return s.kind === 'none' && !/numbers no longer match/.test(c);
        return false;
      });
    }
    return null;
  },
  nameProp(q) {
    const [e1, e2] = boardEqs(q);
    const prop = propOf(e1, e2);
    return q.choices.map(c => c === prop);
  },
  argue(q) {
    const e = boardEq(q), s = sol(e);
    const eqText = q.prompt.match(/^The steps for (.+?): /)[1];
    return q.choices.map(c => {
      let m;
      if ((m = c.match(/^Every step kept the solutions, and (.+?) is never true, so there is no solution$/))) {
        const f = tryEq(m[1]); return s.kind === 'none' && !!f && isConst(f.L) && isConst(f.R) && !f.L.b.eq(f.R.b);
      }
      if ((m = c.match(/^Every step kept the solutions, and (.+?) is always true, so every number is a solution$/))) {
        const f = tryEq(m[1]); return s.kind === 'all' && !!f && sidesSame(f, f) && same(f.L, f.R);
      }
      if ((m = c.match(new RegExp(`^Every step kept the solutions, so (.+?) has exactly one: x = ${NUM}$`)))) {
        const f = tryEq(m[1]); return s.kind === 'one' && !!f && sidesSame(f, e) && m[1] === eqText && s.x.eq(num(m[2]));
      }
      return false; // tried examples, "the x's are gone", "something went wrong", "it checks so it is the only one"
    });
  },
  context(q) {
    const p = q.prompt;
    const e = boardEq(q), s = sol(e);
    const ok = x => x.n >= 0; // the stories' variable is ≥ 0
    let m;
    if (/When is that\?$/.test(p)) {
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^(?:At|Only at) ${NUM} hours$`)))) return s.kind === 'one' && ok(s.x) && s.x.eq(num(mm[1]));
        if (/^For every number of hours: both prices are the same expression$/.test(c)) return s.kind === 'all';
        if (/^Never/.test(c)) return s.kind === 'none' && !/cancel/.test(c);
        return false;
      });
    }
    if ((m = p.match(new RegExp(`gives m = ${NUM}\\. What does that mean\\?`)))) {
      const v = num(m[1]);
      return q.choices.map(c => {
        const mm = c.match(new RegExp(`^At ${NUM} minutes both plans cost \\$${NUM}$`));
        return !!mm && s.kind === 'one' && s.x.eq(v) && num(mm[1]).eq(v) && at(e.L, v).eq(num(mm[2])) && at(e.R, v).eq(num(mm[2]));
      });
    }
    if ((m = p.match(new RegExp(`gives m = ${NUM}\\. When do the plans cost the same\\?`)))) {
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^Never: ${NUM} minutes is not possible, so they never cost the same$`)))) return s.kind === 'one' && !ok(s.x) && s.x.eq(num(mm[1]));
        if ((mm = c.match(new RegExp(`^At ${NUM} minutes$`)))) return s.kind === 'one' && ok(s.x) && s.x.eq(num(mm[1]));
        return false;
      });
    }
    if (/When do they cost the same\?/.test(p)) {
      return q.choices.map(c => {
        let mm;
        if ((mm = c.match(new RegExp(`^Never: Gym B always costs \\$${NUM} more$`)))) { const d = sub(e.R, e.L); return s.kind === 'none' && isConst(d) && d.b.eq(num(mm[1])); }
        if ((mm = c.match(new RegExp(`^(?:They cost the same at|After) ${NUM} months$`)))) return s.kind === 'one' && s.x.eq(num(mm[1]));
        return false;
      });
    }
    return null;
  },
};

/** "Subtract 2x from both sides of E" / "Add 1x to both sides of E" → the choice whose two sides are exactly the result */
function stepLine(q) {
  const m = q.prompt.match(/^(Subtract|Add) (.+?) (?:from|to) both sides of (.+?)\. Which line do you get\?/);
  const t = parseExpr(m[2]), e = parseEq(m[3]);
  const f = m[1] === 'Subtract' ? u => sub(u, t) : u => add(u, t);
  const want = { L: f(e.L), R: f(e.R) };
  return q.choices.map(c => { const g = tryEq(c); return !!g && sidesSame(g, want); });
}
/** least common denominator of the fractions on the board */
function lcdOf(tex) {
  const ds = [...String(tex).matchAll(/\\[td]?frac\{[^{}]*\}\{(\d+)\}/g)].map(m => Number(m[1]));
  const g = (a, b) => (b ? g(b, a % b) : a);
  return ds.reduce((l, d) => (l * d) / g(l, d), 1);
}
/** the property of equality (or rewrite) that turns e1 into e2 */
function propOf(e1, e2) {
  const dl = sub(e2.L, e1.L), dr = sub(e2.R, e1.R);
  if (same(e1.L, e2.L) && same(e1.R, e2.R)) return null; // a rewrite of a side: decided below from the text
  if (isConst(dl) && same(dl, dr) && dl.b.n !== 0) return dl.b.n < 0 ? 'Subtraction property of equality' : 'Addition property of equality';
  if (same(dl, dr) && !isConst(dl)) return dl.a.n < 0 ? 'Subtraction property of equality' : 'Addition property of equality';
  // multiplied / divided by k
  const zero = u => u.a.n === 0 && u.b.n === 0;
  let k = ratio(e2.L, e1.L), k2 = ratio(e2.R, e1.R);
  if (!k && zero(e1.L) && zero(e2.L)) k = k2;
  if (!k2 && zero(e1.R) && zero(e2.R)) k2 = k;
  if (k && k2 && k.eq(k2) && !k.eq(1)) return k.n === 1 && k.d > 1 ? 'Division property of equality' : (k.d === 1 ? 'Multiplication property of equality' : null);
  return null;
}
function ratio(u, v) {
  const r = !v.a.eq(0) ? u.a.div(v.a) : !v.b.eq(0) ? u.b.div(v.b) : null;
  return r && same(u, mul(v, lin(0, r))) ? r : null;
}
/** nameProp when both sides keep their value: which rewrite was it (order swapped / parentheses expanded / terms combined) */
function rewriteName(t1, t2) {
  const s1 = t1.replace(/\s+/g, ''), s2 = t2.replace(/\s+/g, '');
  if (/\(/.test(s1) && !/\(/.test(s2)) return 'Distributive property';
  const terms = s => s.replace(/^([^-−])/, '+$1').match(/[+\-−][^+\-−]+/g)?.map(x => x.replace('−', '-')).sort().join('') ?? '';
  const sides1 = s1.split('='), sides2 = s2.split('=');
  if (sides1.every((x, i) => terms(x) === terms(sides2[i]))) return 'Commutative property of addition';
  return null;
}

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : -1; // -1: no choice is right (sane says so)
};
const out = v => (v && typeof v === 'object' && 'n' in v ? (v.d === 1 ? v.n : v.pair) : v);
function run(q) {
  if (q.family === 'nameProp') {
    const [t1, t2] = texMath(q.board).split('→').map(s => s.trim());
    const e1 = parseEq(t1), e2 = parseEq(t2);
    const name = sidesSame(e1, e2) ? rewriteName(t1, t2) : propOf(e1, e2);
    return q.choices.map(c => c === name);
  }
  const f = F[q.family];
  return f ? f(q) : undefined;
}

export default {
  solve(q) {
    let r;
    try { r = run(q); } catch { return undefined; }
    if (r == null) return undefined;
    if (q.input === 'choice') return pick(r);
    if (q.input === 'pair') return Array.isArray(r) ? r.map(v => (v && 'n' in v ? v.value : v)) : undefined;
    if (q.input === 'num') return r && typeof r === 'object' && 'n' in r ? r.value : r;
    return out(r);
  },
  sane(q) {
    let r;
    try { r = run(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    if (q.input === 'choice' && Array.isArray(r)) {
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right: ${q.choices.filter((_, i) => r[i]).join(' | ')}`);
    }
    if (q.input === 'num' && r && typeof r === 'object' && 'n' in r) {
      let d = r.d; for (const p of [2, 5]) while (d % p === 0) d /= p;
      if (d !== 1) probs.push(`the answer ${r} has no exact decimal to type`);
    }
    // stories: the money and the minutes must be possible
    if (q.family === 'solve' && /Solve for m \(minutes\)/.test(q.prompt) && r && 'n' in r && r.n < 0) probs.push(`the plans cost the same at ${r} minutes`);
    return probs.join('; ');
  },
};
