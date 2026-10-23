// Oracle for the lesson "fractions-as-division" (a ÷ b = a/b, sharing stories, remainders). Written from what the
// student sees only: the prompt (who shares what), the board, the choices. Every share is the amount shared over the
// number of sharers, worked out exactly; remainder questions are whole-number division; choices are judged by testing
// each claim against the true share. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
/** the sharing story: a = amount shared, b = number of sharers (or pieces) */
function story(p) {
  let m = p.match(/^(\d+) ([a-z][a-z ]*?) share (\d+) (.+?) equally/);
  if (m) return { a: +m[3], b: +m[1], what: m[4], who: m[2] };
  m = p.match(/^(\d+) (.+?) (?:is|are) shared equally by (\d+) ([a-z]+)/);
  if (m) return { a: +m[1], b: +m[3], what: m[2], who: m[4] };
  m = p.match(/^(\d+) (.+?) (?:is|are) split equally into (\d+) ([a-z]+)/);
  if (m) return { a: +m[1], b: +m[3], what: m[2], who: m[4] };
  m = p.match(/^(\d+) (.+?) (?:is|are) cut into (\d+) equal pieces/);
  if (m) return { a: +m[1], b: +m[3], what: m[2], who: 'pieces' };
  m = p.match(/^(\d+) ([a-z ]+?) for (\d+) ([a-z]+)\./);
  if (m) return { a: +m[1], b: +m[3], what: m[2], who: m[4] };
  return null;
}
/** a ÷ b on the board (first one) */
const boardDiv = b => { const m = String(b ?? '').match(/(\d+)(?:\\ \\text\{[^}]*\})?\s*\\div\s*(\d+)/); return m ? { a: +m[1], b: +m[2] } : null; };
/** a TeX value: 5, \frac{5}{4}, 1\tfrac{2}{6} → Q */
function texVal(t) {
  t = String(t).trim();
  let m = t.match(/^(\d+)\s*\\[td]?frac\{(\d+)\}\{(\d+)\}$/);
  if (m) return Q(+m[2], +m[3]).add(+m[1]);
  m = t.match(/^\\[td]?frac\{(\d+)\}\{(\d+)\}$/);
  if (m) return Q(+m[1], +m[2]);
  m = t.match(/^(\d+)$/);
  return m ? Q(+m[1]) : null;
}
/** a plain value: '1 2/4', '4/6', '3' → Q */
function val(s) { try { return Q(String(s).trim()); } catch { return null; } }
const fracBoard = b => { const m = String(b ?? '').match(/\\frac\{(\d+)\}\{(\d+)\}/); return m ? { n: +m[1], d: +m[2] } : null; };

// ---------------------------------------------------------------- the families
const F = {
  story(q) { const s = story(q.prompt); return s ? Q(s.a, s.b).pair : undefined; },
  remainder(q) { const s = story(q.prompt); return s ? Q(s.a, s.b).pair : undefined; },
  storyToDiv(q) { const s = story(q.prompt); return s ? [s.a, s.b] : undefined; },
  toFrac(q) { const d = boardDiv(q.board); return d ? Q(d.a, d.b).pair : undefined; },
  toDiv(q) { const f = fracBoard(q.board); return f ? [f.n, f.d] : undefined; },
  toMixed(q) { const d = boardDiv(q.board); return d ? Q(d.a, d.b).pair : undefined; },
  between(q) {
    const f = fracBoard(q.board);
    if (!f) return undefined;
    const v = Q(f.n, f.d);
    return choiceWhere(q, c => {
      let m = c.match(/^between (\d+) and (\d+)$/);
      if (m) return +m[2] === +m[1] + 1 && v.cmp(+m[1]) > 0 && v.cmp(+m[2]) < 0;
      m = c.match(/^exactly (\d+)$/);
      return m ? v.eq(+m[1]) : false;
    });
  },
  checkBack(q) {
    const m = q.prompt.match(/^(\d+) [a-z]+ each got (\d+)\/(\d+) of/);
    return m ? Q(+m[2], +m[3]).mul(+m[1]).value : undefined;
  },
  cutOrKeep(q) {
    const m = q.prompt.match(/^(\d+) [a-z ]+? (?:is|are) shared equally by (\d+) /);
    return m ? [Math.floor(+m[1] / +m[2]), +m[1] % +m[2]] : undefined;
  },
  groups(q) {
    const p = q.prompt;
    const m = p.match(/^(\d+) [a-z]+\. Each [a-z]+ holds (\d+)/);
    if (!m) return undefined;
    const n = +m[1], k = +m[2];
    if (/can be filled completely\?/.test(p)) return Math.floor(n / k);
    if (/that is not full\?/.test(p)) return n % k;
    if (/are needed to/.test(p)) return Math.ceil(n / k);
    return undefined;
  },
  twoWays(q) {
    const s = story(q.prompt);
    const k = q.prompt.match(/: (\d+)\/(\d+) each\./), l = q.prompt.match(/: (\d+) (\d+)\/(\d+) each\./);
    if (!s || !k || !l) return undefined;
    const kai = Q(+k[1], +k[2]), lee = Q(+l[2], +l[3]).add(+l[1]);
    return choiceWhere(q, c => {
      let m = c.match(/^The same: (\d+) pieces of 1\/(\d+) make (\d+) whole and (\d+)\/(\d+)\.$/);
      if (m) return kai.eq(lee) && Q(+m[1], +m[2]).eq(kai) && Q(+m[4], +m[5]).add(+m[3]).eq(lee);
      if (/^Cutting everything gives more/.test(c)) return kai.cmp(lee) > 0;
      if (/^Wholes first gives more/.test(c)) return lee.cmp(kai) > 0;
      if (/can't be compared/.test(c)) return false;
      return false;
    });
  },
  slip(q) {
    const s = story(q.prompt);
    const jm = String(q.board ?? '').match(/=\s*(.+)$/);
    if (!s || !jm) return undefined;
    const J = texVal(jm[1]);
    if (!J) return undefined;
    const S = Q(s.a, s.b), w = Math.floor(s.a / s.b), r = s.a % s.b;
    // what Jordan wrote: a whole only, a mixed number w n/d, or a fraction n/d
    const jt = jm[1].trim();
    const jMixed = jt.match(/^(\d+)\s*\\[td]?frac\{(\d+)\}\{(\d+)\}$/), jFrac = jt.match(/^\\[td]?frac\{(\d+)\}\{(\d+)\}$/), jWhole = /^\d+$/.test(jt);
    return choiceWhere(q, c => {
      let m;
      if (/^Nothing/.test(c) || /^Leftovers are never shared/.test(c)) return J.eq(S);
      if ((m = c.match(/^The amount shared goes on top: it should be (\d+)\/(\d+)\.$/)))
        return !!jFrac && +jFrac[1] === s.b && +jFrac[2] === s.a && +m[1] === s.a && +m[2] === s.b;
      if ((m = c.match(/should be cut into (\d+) pieces, not (\d+)\.$/))) return +m[1] === s.b && +m[2] !== s.b && !J.eq(S);
      if ((m = c.match(/^The bottom should be (\d+), the number of pieces\.$/))) return +m[1] === s.b && !J.eq(S);
      if ((m = c.match(/^The (\d+) left over were not shared\. Each gets (\d+)\/(\d+) more: (.+)\.$/)))
        return jWhole && J.eq(w) && r > 0 && +m[1] === r && +m[3] === s.b && +m[2] === r && val(m[4])?.eq(S);
      if ((m = c.match(/^The leftover is shared by (\d+), so it is (\d+)\/(\d+) more, not (\d+)\/(\d+): (.+)\.$/)))
        return !!jMixed && +jMixed[1] === w && +jMixed[2] === +m[4] && +jMixed[3] === +m[5] && +m[1] === s.b && Q(+m[2], +m[3]).eq(Q(r, s.b)) && !Q(+m[4], +m[5]).eq(Q(r, s.b)) && val(m[6])?.eq(S);
      return false;
    });
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, s = story(p), bd = boardDiv(q.board);
  if (['story', 'remainder', 'storyToDiv', 'twoWays', 'slip'].includes(q.family)) {
    if (!s) out.push('cannot tell who shares what');
    else {
      if (s.b === 0) out.push('nobody to share with');
      if (s.a === 0) out.push('nothing to share');
      if (bd && (bd.a !== s.a || bd.b !== s.b) && q.family !== 'twoWays') out.push(`the board divides ${bd.a} ÷ ${bd.b}, the story ${s.a} ÷ ${s.b}`);
      if (q.subgoal === 'share-one-whole' && s.a !== 1) out.push('"one whole" sub-goal shares more than one whole');
      if (q.subgoal === 'share-several-wholes-less-than-one' && !(s.a > 1 && s.a < s.b)) out.push('not several wholes for more sharers');
      if (q.subgoal === 'share-one-or-more-wholes' && s.a < s.b) out.push('fewer wholes than sharers');
      if (q.family === 'remainder' && s.a % s.b === 0) out.push('no remainder to share');
      if (q.family === 'remainder') {
        const m = String(q.board ?? '').match(/^(\d+) = (\d+) \\times (\d+) \+ (\d+)$/);
        if (m && (+m[1] !== s.a || +m[2] !== s.b || +m[2] * +m[3] + +m[4] !== +m[1] || +m[4] >= +m[2])) out.push('the board split is not the division');
      }
    }
  }
  if (q.family === 'groups') {
    const m = p.match(/^(\d+) [a-z]+\. Each [a-z]+ holds (\d+)/);
    if (m) {
      const n = +m[1], k = +m[2];
      if (/that is not full\?/.test(p) && n % k === 0) out.push('every carton is full: no carton that is not full');
      const b = String(q.board ?? '').match(/(\d+) \\div (\d+) = (\d+)\\ \\text\{R\}\\ (\d+)/);
      if (b && (+b[1] !== n || +b[2] !== k || +b[3] !== Math.floor(n / k) || +b[4] !== n % k)) out.push('the board division is wrong');
    }
  }
  if (q.family === 'checkBack') {
    const m = p.match(/^(\d+) [a-z]+ each got (\d+)\/(\d+) of/);
    if (m && +m[1] !== +m[3]) out.push('the sharers are not the denominator');
  }
  if (q.family === 'cutOrKeep') {
    const m = p.match(/^(\d+) [a-z ]+? (?:is|are) shared equally by (\d+) /);
    if (m && +m[1] < +m[2]) out.push('fewer things than people');
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return out.join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
