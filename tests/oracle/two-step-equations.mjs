// two-step-equations oracle (role O, docs/lessons/QUALITY_LAYER.md). Works every practice item out from what the
// student sees: the board TeX, the prompt (and its HTML, where the plain text drops a fraction bar), the choices and
// the balance picture. Equations are parsed into linear forms a·x + b with exact fractions and solved here; every
// choice is judged by the maths of its claim (solve the candidate, apply the move to both sides, run the chain).
import { Q } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- text → maths
const decode = s => String(s ?? '')
  .replace(/&#8202;|&#8201;|&thinsp;|&nbsp;|&#160;/g, ' ').replace(/&minus;/g, '−').replace(/&times;/g, '×')
  .replace(/&divide;/g, '÷').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');
/** HTML (prompt / choice) → maths text, fraction spans as ((a)/(b)) so nothing is lost */
function htmlMath(h) {
  let s = String(h ?? '');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/<span class="fr"><span>((?:(?!<span|<\/span>).|<i>|<\/i>)*)<\/span><span>((?:(?!<span|<\/span>).)*)<\/span><\/span>/g,
      (_, a, b) => `((${a.replace(/<[^>]+>/g, '')})/(${b.replace(/<[^>]+>/g, '')}))`);
  }
  return decode(s.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+/g, ' ').trim();
}
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
    .replace(/\\[,;:! ]|\\quad|\\qquad|~/g, ' ').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
}
const num = t => { const s = String(t).replace(/[−–]/g, '-').replace(/[$,\s]/g, '').replace(/\.$/, ''); /* a sentence's full stop */ const m = s.match(/^(-?)(\d+)\/(\d+)$/); return m ? Q(Number(m[2]), Number(m[3])).mul(m[1] ? -1 : 1) : decQ(s); };
function decQ(s) {
  const m = String(s).match(/^(-?)(\d*)(?:\.(\d+))?$/);
  if (!m || (m[2] === '' && !m[3])) throw new Error(`not a number: ${s}`);
  const d = m[3] ? 10 ** m[3].length : 1, n = Number((m[2] || '0') + (m[3] || ''));
  return Q(m[1] ? -n : n, d);
}

// ---- linear forms {a, b} = a·x + b, exact ----
function toQ(v) { return typeof v === 'object' && v && 'n' in v ? v : Q(v); }
const lin = (a, b) => ({ a: toQ(a), b: toQ(b) });
const add = (u, v) => lin(u.a.add(v.a), u.b.add(v.b));
const neg = u => lin(u.a.neg(), u.b.neg());
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

/** parse an expression in one letter variable (any single letter) into a linear form */
function parseExpr(text) {
  const s = String(text).replace(/[−–]/g, '-').replace(/×|·/g, '*').replace(/÷/g, '/').replace(/\$/g, '').replace(/,(?=\d{3})/g, '');
  const toks = [];
  const re = /\s*(\d+\.?\d*|\.\d+|[A-Za-z]|[-+*/()])/y;
  let m, i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    re.lastIndex = i; m = re.exec(s);
    if (!m) throw new Error(`bad char in ${s}`);
    toks.push(m[1]); i = re.lastIndex;
  }
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = next(); const w = term(); v = op === '+' ? add(v, w) : add(v, neg(w)); }
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
/** "lhs = rhs" → { L, R } (exactly one '=') */
function parseEq(text) {
  const parts = String(text).split('=');
  if (parts.length !== 2) throw new Error(`not one equation: ${text}`);
  return { L: parseExpr(parts[0]), R: parseExpr(parts[1]) };
}
/** the one solution of a linear equation, or null (none / every number) */
function solveEq(e) {
  const a = e.L.a.sub(e.R.a), c = e.R.b.sub(e.L.b);
  return a.n === 0 ? null : c.div(a);
}
const eqSides = (e, f) => (same(e.L, f.L) && same(e.R, f.R)) || (same(e.L, f.R) && same(e.R, f.L));
const val = q => q.value;

// ---- moves "Subtract 6 from both sides", "Multiply both sides by 4/3", "both sides ÷ 3" ----
function parseMove(t) {
  const s = String(t).replace(/[−–]/g, '-').trim();
  const N = '(-?\\d+(?:\\.\\d+)?(?:/\\d+)?|\\(\\(-?[\\d.]+\\)/\\([\\d.]+\\)\\))';
  const n = x => num(x.replace(/[()]/g, ''));
  let m;
  if ((m = s.match(new RegExp(`^Subtract ${N} from both sides`, 'i')))) return { op: '-', k: n(m[1]), both: true };
  if ((m = s.match(new RegExp(`^Add ${N} to both sides`, 'i')))) return { op: '+', k: n(m[1]), both: true };
  if ((m = s.match(new RegExp(`^Multiply both sides by ${N}`, 'i')))) return { op: '*', k: n(m[1]), both: true };
  if ((m = s.match(new RegExp(`^Divide both sides by ${N}`, 'i')))) return { op: '/', k: n(m[1]), both: true };
  if ((m = s.match(new RegExp(`^Add ${N} to the left side only`, 'i')))) return { op: '+', k: n(m[1]), left: true };
  if ((m = s.match(new RegExp(`^Subtract ${N} from the left side only`, 'i')))) return { op: '-', k: n(m[1]), left: true };
  if ((m = s.match(new RegExp(`both sides\\s*([-+×÷*/])\\s*${N}`, 'i')))) {
    const op = { '-': '-', '+': '+', '×': '*', '*': '*', '÷': '/', '/': '/' }[m[1]];
    return { op, k: n(m[2]), both: true };
  }
  return null;
}
function applyOp(u, op, k) {
  const c = lin(0, k);
  if (op === '+') return add(u, c);
  if (op === '-') return add(u, neg(c));
  if (op === '*') return mul(u, c);
  if (k.n === 0) return null;
  return div(u, c);
}
function applyMove(e, mv) {
  const Lx = applyOp(e.L, mv.op, mv.k);
  const Rx = mv.left ? e.R : applyOp(e.R, mv.op, mv.k);
  return Lx && Rx ? { L: Lx, R: Rx } : null;
}

// ---- the structure of a side: the LAST operation done to x ----
/** split the board's x-side into (inner, op, k) for its last step, reading the TeX/HTML text itself */
function lastStep(sideText) {
  const s = sideText.replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();
  // top-level + / − of a constant (constant first or last)
  const top = splitTop(s);
  if (top.length > 1) {
    const xs = top.filter(t => /[A-Za-z]/.test(t.text)), cs = top.filter(t => !/[A-Za-z]/.test(t.text));
    if (xs.length === 1 && cs.length === 1) {
      const c = num(cs[0].text.replace(/[()]/g, '')).mul(cs[0].sign);
      const inner = parseExpr(xs[0].text);
      return { inner: xs[0].sign < 0 ? neg(inner) : inner, op: '+', k: c };
    }
  }
  // k(…) or ((a)/(b))(…): a product whose last factor is the bracket
  let m = s.match(/^(-?\d+(?:\.\d+)?|\(\((-?[\d.]+)\)\/\(([\d.]+)\)\))\s*\((.*)\)$/);
  if (m) return { inner: parseExpr(m[4]), op: '*', k: m[2] ? num(m[2]).div(num(m[3])) : num(m[1]) };
  return null;
}
/** top-level terms of "a + b - c" (outside brackets) with their signs */
function splitTop(s) {
  const out = []; let depth = 0, cur = '', sign = 1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && (ch === '+' || ch === '-') && cur.trim() !== '') { out.push({ text: cur.trim(), sign }); sign = ch === '-' ? -1 : 1; cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push({ text: cur.trim(), sign });
  // a leading "-" glued to the first term
  return out.map(t => (t.text.startsWith('-') && !/^-\s*\d/.test(t.text) ? t : t));
}

// ---------------------------------------------------------------- stories
/** a story (plain prompt) → its equation text and what the unknown is; null when the story is not one we know */
function storyModel(t) {
  const s = String(t).replace(/[−–]/g, '-').replace(/’/g, "'");
  let m;
  if ((m = s.match(/is ([\d.]+) in\. tall and grows ([\d.]+) in\. each week\. After some weeks it is ([\d.]+) in\. tall/)))
    return { eq: `${m[2]}x + ${m[1]} = ${m[3]}`, kind: 'plant', start: +m[1], rate: +m[2], end: +m[3], count: true };
  if ((m = s.match(/is ([\d.]+) in\. wide and has a perimeter of ([\d.]+) in\./)))
    return { eq: `2(x + ${m[1]}) = ${m[2]}`, kind: 'rect', width: +m[1], per: +m[2] };
  if ((m = s.match(/packs (\d+) bags\. Each bag holds the same number of balls and (\d+) cones\. There are (\d+) items in all/)))
    return { eq: `${m[1]}(x + ${m[2]}) = ${m[3]}`, kind: 'coach', count: true };
  if ((m = s.match(/(^|\. )(-?[\d.]+) less than ([\d.]+) times (.+?) is (-?[\d.]+)\./)))
    return { eq: `${m[3]}x - ${m[2]} = ${m[5]}`, kind: 'less', what: m[4], count: /laps|age/.test(m[4]), positive: /age|laps/.test(m[4]) };
  if ((m = s.match(/charges \$([\d.]+) to get in plus \$([\d.]+) per climb\. \w+ spends \$([\d.]+) in all/)))
    return { eq: `${m[2]}x + ${m[1]} = ${m[3]}`, kind: 'climb', count: true };
  // equation-to-context stories
  if ((m = s.match(/(\d+) friends split the cost of a pizza equally\.(?: Each also pays \$([\d.]+) for a drink\.)? Each friend pays \$([\d.]+)\. What did the pizza cost\?/)))
    return { eq: `x/${m[1]} + ${m[2] ?? 0} = ${m[3]}`, kind: 'pizza', friends: +m[1], drink: m[2] == null ? null : +m[2], each: +m[3] };
  if ((m = s.match(/(\d+) bags each hold some apples and (\d+) pears\. There are (\d+) pieces of fruit in all\. How many apples are in each bag\?/)))
    return { eq: `${m[1]}(x + ${m[2]}) = ${m[3]}`, kind: 'applesPears', bags: +m[1], pears: +m[2], total: +m[3], count: true };
  if ((m = s.match(/(\d+) bags each hold the same number of apples\. There are (\d+) apples in all\. How many are in each bag\?/)))
    return { eq: `${m[1]}x = ${m[2]}`, kind: 'apples', bags: +m[1], total: +m[2], count: true };
  if ((m = s.match(/(\d+) bags each hold some apples, and (\d+) more pears sit on the table\. There are (\d+) pieces of fruit in all\. How many apples are in each bag\?/)))
    return { eq: `${m[1]}x + ${m[2]} = ${m[3]}`, kind: 'applesTable', bags: +m[1], pears: +m[2], total: +m[3], count: true };
  if ((m = s.match(/A gym charges a \$([\d.]+) sign-up fee and \$([\d.]+) per class\. (\w+) paid \$([\d.]+)\. How many classes did \3 take\?/)))
    return { eq: `${m[2]}x + ${m[1]} = ${m[4]}`, kind: 'gym', fee: +m[1], rate: +m[2], who: m[3], paid: +m[4], count: true };
  if ((m = s.match(/A gym charges a \$([\d.]+) sign-up fee and \$([\d.]+) per class\. (\w+) took (\d+) classes\. How much did \3 pay\?/)))
    return { eq: `x = ${m[2]}*${m[4]} + ${m[1]}`, kind: 'gymPay' };
  return null;
}

// ---------------------------------------------------------------- per family
const boardEq = q => parseEq(texMath(q.board));
const boardSol = q => solveEq(boardEq(q));

/** chain of operations "x → × 3 → + 16" (plain) → function on Q */
function chainFn(text) {
  const ops = String(text).replace(/[−–]/g, '-').split('→').map(t => t.trim()).slice(1);
  return x => ops.reduce((v, o) => {
    const m = o.match(/^([+\-×÷*/])\s*(-?[\d./]+)$/);
    if (!m) throw new Error(`bad op ${o}`);
    return applyOp(v, { '+': '+', '-': '-', '×': '*', '*': '*', '÷': '/', '/': '/' }[m[1]], num(m[2]));
  }, x);
}
/** board arrows of a think-of-a-number chain: [{op, k}] */
function arrowOps(board) {
  return [...String(board).matchAll(/\\xrightarrow\{([^{}]*)\}/g)].map(m => {
    const t = m[1].replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\s+/g, '');
    const mm = t.match(/^([+\-×÷])(-?[\d.]+)$/);
    return { op: { '+': '+', '-': '-', '×': '*', '÷': '/' }[mm[1]], k: num(mm[2]) };
  });
}
const inv = { '+': '-', '-': '+', '*': '/', '/': '*' };
function backward(q) {
  const ops = arrowOps(q.board);
  const end = num(String(q.board).match(/\}\s*(-?[\d.]+)\s*$/)[1]);
  let v = lin(0, end); const vals = [end];
  for (const o of [...ops].reverse()) { v = applyOp(v, inv[o.op], o.k); vals.unshift(v.b); }
  return vals; // [x, box, end]
}

const F = {
  chainOrder(q) {
    const f = parseExpr(texMath(q.board));
    const ok = c => { try { const g = chainFn(c)(lin(1, 0)); return same(f, g); } catch { return false; } };
    return q.choices.map(ok);
  },
  chainRun(q) {
    const [ex, xs] = String(q.board).split(/\\quad/).map(texMath);
    const x = num(xs.split('=')[1].trim());
    const f = parseExpr(ex);
    return f.a.mul(x).add(f.b);
  },
  thinkNumber(q) { return backward(q)[0]; },
  flowBack(q) { const [x, box] = backward(q); return [box, x]; },
  sameSolution(q) {
    const s = boardSol(q);
    return q.choices.map(c => { try { const t = solveEq(parseEq(c)); return !!t && t.eq(s); } catch { return false; } });
  },
  safeMove(q) {
    const p = q.prompt.replace(/[−–]/g, '-');
    const e = boardEq(q), s = solveEq(e);
    let m;
    if (/always keeps the same solution/.test(p)) {
      return q.choices.map(c => {
        const mv = parseMove(c); if (!mv) return false;
        if (mv.left) return mv.k.n === 0;
        if ((mv.op === '*' || mv.op === '/') && mv.k.n === 0) return false;
        const f = applyMove(e, mv); const t = f && solveEq(f);
        return !!t && t.eq(s);
      });
    }
    if ((m = p.match(/do (.+?) and (.+?) have the same solution\?/))) {
      const e1 = parseEq(m[1]), e2 = parseEq(m[2]);
      const s1 = solveEq(e1), s2 = solveEq(e2), sameSol = !!s1 && !!s2 && s1.eq(s2);
      return q.choices.map(c => {
        const cc = c.replace(/[−–]/g, '-');
        if (/^Yes/.test(cc)) {
          if (!sameSol) return false;
          const mm = cc.match(/(subtracting|adding|multiplying|dividing)\D*?(-?[\d.]+)/i);
          if (!mm) return false;
          const op = { subtracting: '-', adding: '+', multiplying: '*', dividing: '/' }[mm[1].toLowerCase()];
          const f = applyMove(e1, { op, k: num(mm[2]), both: true });
          return !!f && eqSides(f, e2);
        }
        if (/^No/.test(cc)) return !sameSol;
        return false; // "you can only tell by solving": the move shows it without solving
      });
    }
    if (/divide both sides of .* by 0\?/.test(p)) return q.choices.map(c => /^No: dividing by 0 is undefined/.test(c));
    if ((m = p.match(/multiplies both sides of .* by 0 and gets 0 = 0\. Does 0 = 0 have the same solution\?/))) {
      return q.choices.map(c => {
        const cc = c.replace(/[−–]/g, '-');
        if (!/^No/.test(cc)) return false;
        const mm = cc.match(/solution x = (-?[\d.]+)/);
        return !mm || num(mm[1]).eq(s);
      });
    }
    return null;
  },
  writtenChain(q) {
    const e0 = boardEq(q), s = solveEq(e0);
    return (q.choicesHtml ?? q.choices).map(h => {
      const lines = htmlMath(h).split('\n').map(t => t.trim()).filter(Boolean);
      try {
        const eqs = lines.map(parseEq); // a run-on line has more than one '=' and throws
        if (!eqSides(eqs[0], e0)) return false;
        if (!eqs.every(e => { const t = solveEq(e); return !!t && t.eq(s); })) return false;
        const last = eqs[eqs.length - 1];
        return /^\s*[A-Za-z]\s*=/.test(lines[lines.length - 1]) && same(last.L, lin(1, 0)) && isConst(last.R);
      } catch { return false; }
    });
  },
  matchSteps(q) {
    const p = q.prompt.replace(/[−–]/g, '-');
    const m = p.match(/does (-?[\d.]+) ([-+×÷]) (-?[\d.]+) = (-?[\d.]+) match\?/);
    const op = { '-': '-', '+': '+', '×': '*', '÷': '/' }[m[2]], k = num(m[3]), res = num(m[4]);
    const a = num(m[1]);
    const arithOk = applyOp(lin(0, a), op, k).b.eq(res);
    return q.choices.map(c => {
      const cc = c.replace(/[−–]/g, '-');
      const mm = cc.match(/^From (.+?) to (.+?): (both sides .*)$/);
      if (!mm) return false; // "Neither": the arithmetic is the same move
      const e1 = parseEq(mm[1]), e2 = parseEq(mm[2]), mv = parseMove(mm[3]);
      if (!mv) return false;
      const f = applyMove(e1, mv);
      if (!f || !eqSides(f, e2)) return false;
      // the arithmetic step is this equation step: same operation, same number, the constant side goes a → res
      const cside = isConst(e1.R) ? [e1.R, e2.R] : [e1.L, e2.L];
      return arithOk && mv.op === op && mv.k.eq(k) && cside[0].b.eq(a) && cside[1].b.eq(res);
    });
  },
  solve(q) { return boardSol(q); },
  balance(q) {
    const p = q.prompt;
    let m;
    if ((m = p.match(/(\d+) bags? \(each holding the same number of marbles\) and (\d+) loose marbles? balance (\d+) marbles/)))
      return Q(Number(m[3]) - Number(m[2]), Number(m[1]));
    if ((m = p.match(/On the left pan are (\d+) groups?, each one bag and (\d+) marbles?\. They balance (\d+) marbles/)))
      return Q(Number(m[3]), Number(m[1])).sub(Number(m[2]));
    return undefined;
  },
  negCheck(q) {
    const p = q.prompt.replace(/[−–]/g, '-');
    const e = boardEq(q), s = solveEq(e);
    let m;
    if ((m = p.match(/^(\w+) solves .* and gets x = (-?[\d.]+)\. A friend says/))) {
      const who = m[1], claimed = num(m[2]);
      return q.choices.map(c => {
        const cc = c.replace(/[−–]/g, '-');
        if (/^The friend/.test(cc)) return false; // a solution can be negative
        if ((m = cc.match(/^Neither: the solution is x = (-?[\d.]+)/))) return !claimed.eq(s) && num(m[1]).eq(s);
        if (cc.startsWith(who + ':')) {
          const sub = cc.match(/:\s*(.+?) = (-?[\d.]+), so x = (-?[\d.]+) works/);
          if (!sub) return false;
          const lhs = parseExpr(sub[1]);
          return claimed.eq(s) && num(sub[3]).eq(s) && isConst(lhs) && lhs.b.eq(num(sub[2])) && lhs.b.eq(e.R.b);
        }
        return false;
      });
    }
    if ((m = p.match(/^To solve .*, (\w+) subtracts (-?[\d.]+) from both sides, then divides by (-?[\d.]+) and gets x = (-?[\d.]+)\. Check the answer/))) {
      const got = num(m[4]), right = got.eq(s), coef = e.L.a;
      return q.choices.map(c => {
        const cc = c.replace(/[−–]/g, '-');
        let mm;
        if ((mm = cc.match(/^Wrong: (.+?) = (-?[\d.]+)\. Divide by (-?[\d.]+) to get x = (-?[\d.]+)/))) {
          const lhs = parseExpr(mm[1]);
          return !right && isConst(lhs) && lhs.b.eq(num(mm[2])) && !lhs.b.eq(e.R.b) && num(mm[3]).eq(coef) && num(mm[4]).eq(s);
        }
        if ((mm = cc.match(/^Right: dividing by (-?[\d.]+) undoes the × (-?[\d.]+)/))) return right && num(mm[1]).eq(num(mm[2]));
        return false; // "a negative coefficient gives a negative answer" is not a reason
      });
    }
    return null;
  },
  firstMove(q) {
    const p = q.prompt;
    const [lt, rt] = texMath(q.board).split('=');
    const step = lastStep(lt);
    if (!step) return null;
    const e = parseEq(texMath(q.board));
    const rhs = parseExpr(rt);
    if (/^After undoing/.test(p)) {
      // the equation now: inner = rhs undone; check the shown equation and find the move that leaves x alone
      const now = { L: step.inner, R: applyOp(rhs, step.op === '+' ? '-' : '/', step.k) };
      return q.choices.map(c => {
        const mv = parseMove(htmlMath(c)); if (!mv || !mv.both) return false;
        const f = applyMove(now, mv);
        return !!f && same(f.L, lin(1, 0)) && isConst(f.R);
      });
    }
    if (/undoes the LAST step/.test(p)) {
      return q.choices.map(c => {
        const mv = parseMove(htmlMath(c)); if (!mv || !mv.both) return false; // "Rewrite it as …" is no undo
        const f = applyOp(e.L, mv.op, mv.k);
        return !!f && same(f, step.inner);
      });
    }
    return null;
  },
  writeEq(q) {
    const st = storyModel(q.prompt); if (!st) return null;
    const model = parseEq(st.eq);
    return q.choices.map(c => { try { return eqSides(parseEq(c), model); } catch { return false; } });
  },
  storySolve(q) {
    const st = storyModel(q.prompt); if (!st) return undefined;
    return solveEq(parseEq(st.eq));
  },
  storyFor(q) {
    const e = boardEq(q);
    return q.choices.map(c => { const st = storyModel(c); if (!st) return false; try { return eqSides(parseEq(st.eq), e); } catch { return false; } });
  },
  meaning(q) {
    const p = q.prompt.replace(/[−–]/g, '-');
    const st = storyModel(p); if (!st) return null;
    const e = boardEq(q), sol = solveEq(e);
    let m;
    if ((m = p.match(/gives x = (-?[\d.]+)\. What does that tell you\?/))) {
      const v = num(m[1]);
      return q.choices.map(c => {
        const cc = c.replace(/[−–]/g, '-');
        let mm;
        if (/^The answer is/.test(cc)) return false; // not an interpretation
        if ((mm = cc.match(/^Each bag holds (-?[\d.]+) apples/))) return /apples/.test(st.kind) && num(mm[1]).eq(sol);
        if ((mm = cc.match(/^There are (-?[\d.]+) apples in all/))) return false; // x is the apples in ONE bag, not in all
        if ((mm = cc.match(/^The pizza cost \$(-?[\d.]+)/))) return st.kind === 'pizza' && num(mm[1]).eq(sol);
        if ((mm = cc.match(/^Each friend paid \$(-?[\d.]+)/))) return false; // x is the pizza's cost, not what each friend pays
        if ((mm = cc.match(/^(\w+) took (-?[\d.]+) classes/))) return st.kind === 'gym' && mm[1] === st.who && num(mm[2]).eq(sol);
        if ((mm = cc.match(/^(\w+) paid \$(-?[\d.]+)/))) return false; // x is the number of classes, not the money
        return false;
      }).map((ok, i, all) => ok && v.eq(sol));
    }
    if ((m = p.match(/What does the (-?[\d.]+) stand for\?/))) {
      const k = Number(m[1]);
      return q.choices.map(c => {
        const cc = c.replace(/[−–]/g, '-');
        let mm;
        if (/^Nothing/.test(cc)) return false;
        if ((mm = cc.match(/^The (\d+) pears? in EACH bag/))) return st.kind === 'applesPears' && st.pears === k && +mm[1] === k;
        if ((mm = cc.match(/^(\d+) pears? in all/))) return st.kind === 'applesPears' && st.pears * st.bags === k && +mm[1] === k;
        if ((mm = cc.match(/^The \$([\d.]+) drink each friend buys/))) return st.kind === 'pizza' && st.drink === k && +mm[1] === k;
        if (/^The number of friends/.test(cc)) return st.kind === 'pizza' && st.friends === k;
        if ((mm = cc.match(/^The \$([\d.]+) sign-up fee, paid once/))) return st.kind === 'gym' && st.fee === k && +mm[1] === k;
        if (/^(\d+) classes/.test(cc)) return false; // the number of classes is x, not a number in the equation
        return false;
      });
    }
    return null;
  },
};

// ---------------------------------------------------------------- contract
const pick = arr => {
  if (!Array.isArray(arr)) return undefined;
  const hits = arr.map((ok, i) => (ok ? i : -1)).filter(i => i >= 0);
  return hits.length >= 1 ? hits[0] : undefined;
};
const out = v => (v && typeof v === 'object' && 'n' in v ? val(v) : v);

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    let r;
    try { r = f(q); } catch { return undefined; }
    if (q.input === 'choice') return pick(r);
    if (q.input === 'pair') return Array.isArray(r) ? r.map(out) : undefined;
    return r == null ? undefined : out(r);
  },
  sane(q) {
    const f = F[q.family];
    if (!f) return '';
    let r;
    try { r = f(q); } catch (e) { return `could not read the item (${e.message})`; }
    const probs = [];
    const isWhole = v => v && v.d === 1;
    const fin = v => { let d = v.d; for (const p of [2, 5]) while (d % p === 0) d /= p; return d === 1; };
    if (q.input === 'choice') {
      if (!Array.isArray(r)) return '';
      const n = r.filter(Boolean).length;
      if (n === 0) probs.push('no choice is right');
      if (n > 1) probs.push(`${n} choices are right`);
    }
    if (q.input === 'num' && r && typeof r === 'object' && 'n' in r && !fin(r)) probs.push(`the answer ${r} has no exact decimal to type`);
    // whole-number worlds
    if (q.family === 'thinkNumber' || q.family === 'flowBack') {
      const vals = backward(q);
      if (!vals.every(isWhole)) probs.push('a step of the chain is not a whole number');
    }
    const pic = q.data?.picture?.balance;
    if (q.family === 'balance' || pic) {
      const v = q.family === 'balance' ? r : (pic ? boardSol(q) : null);
      if (v && (!isWhole(v) || v.n < 0)) probs.push(`a bag would hold ${v} marbles`);
      if (pic) {
        let e; try { e = boardEq(q); } catch { e = null; }
        const want = pic.grouped ? `${pic.p}(x + ${pic.q}) = ${pic.r}` : `${pic.p}x + ${pic.q} = ${pic.r}`;
        if (e && !(solveEq(e)?.eq(solveEq(parseEq(want))) ?? false)) probs.push('the balance picture does not show the board equation');
        if ([pic.p, pic.q, pic.r].some(x => !Number.isInteger(x) || x < 0) || pic.p < 1) probs.push('the balance has fractional or negative bags/marbles');
      }
    }
    if (q.family === 'storySolve' || q.family === 'writeEq') {
      const st = storyModel(q.prompt);
      if (st) {
        const v = solveEq(parseEq(st.eq));
        if (!v) probs.push('the story has no single answer');
        else {
          if (v.n <= 0 && st.kind !== 'less') probs.push(`the unknown would be ${v}`);
          if (st.count && !isWhole(v)) probs.push(`a count of ${v}`);
          if (st.kind === 'less' && st.positive && (v.n <= 0 || !isWhole(v))) probs.push(`${st.what} would be ${v}`);
        }
        if (q.family === 'storySolve') {
          // the board equation should be the story's equation
          try { if (!eqSides(boardEq(q), parseEq(st.eq))) { const b = boardSol(q); if (!b || !b.eq(v)) probs.push('the board equation does not fit the story'); } } catch { /* board not an equation */ }
        }
      }
    }
    if (q.family === 'storyFor' || q.family === 'meaning') {
      const sol = boardSol(q);
      if (sol && (!isWhole(sol) || sol.n <= 0)) probs.push(`the story's unknown would be ${sol}`);
      if (q.family === 'meaning') {
        const st = storyModel(q.prompt);
        if (st) {
          if (!eqSides(parseEq(st.eq), boardEq(q))) probs.push('the equation does not fit the story');
          const m = q.prompt.replace(/[−–]/g, '-').match(/gives x = (-?[\d.]+)\./);
          if (m && !num(m[1]).eq(sol)) probs.push(`x = ${m[1]} is not the solution`);
          if (m) { // a wrong reading of x that is ALSO a true fact of this story makes two true statements
            const v = num(m[1]);
            for (const c of q.choices) {
              let mm;
              if ((mm = c.match(/^Each friend paid \$(\d+(?:\.\d+)?)/)) && st.kind === 'pizza' && +mm[1] === st.each) probs.push(`"${c}" (meant as wrong) is also true here`);
              if ((mm = c.match(/^\w+ paid \$(\d+(?:\.\d+)?)/)) && st.kind === 'gym' && +mm[1] === st.paid) probs.push(`"${c}" (meant as wrong) is also true here`);
              if ((mm = c.match(/^There are (\d+) apples in all/)) && /apples/.test(st.kind) && v.mul(st.bags).eq(+mm[1])) probs.push(`"${c}" (meant as wrong) is also true here`);
            }
          }
          const k = q.prompt.match(/What does the (-?[\d.]+) stand for\?/);
          if (k && st.kind === 'pizza' && st.friends === +k[1] && st.drink === +k[1]) probs.push('the number asked about is both the friends and the drink');
          if (k && st.kind === 'applesPears' && st.bags === +k[1] && st.pears === +k[1]) probs.push('the number asked about is both the bags and the pears');
          if (k && st.kind === 'gym' && st.rate === +k[1] && st.fee === +k[1]) probs.push('the number asked about is both the fee and the rate');
        }
      }
    }
    if (q.family === 'firstMove' && /^After undoing/.test(q.prompt)) {
      // the equation the prompt shows after the first undo must be right
      try {
        const [lt, rt] = texMath(q.board).split('=');
        const step = lastStep(lt);
        const now = { L: step.inner, R: applyOp(parseExpr(rt), step.op === '+' ? '-' : '/', step.k) };
        const shown = htmlMath(q.promptHtml).match(/:\s*(.+?)\. What gets/);
        if (shown && !eqSides(parseEq(shown[1]), now)) probs.push(`the shown equation ${shown[1]} is not what undoing gives`);
      } catch { /* fine */ }
    }
    return probs.join('; ');
  },
};
