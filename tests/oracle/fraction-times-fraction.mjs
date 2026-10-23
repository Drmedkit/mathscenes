// Oracle for the lesson "fraction-times-fraction" (a/b × c/d, area model, scaling). Written from what the student sees
// only: the prompt (the fractions, mixed numbers, decimals and what they stand for), the board and the choices. Every
// product is worked out exactly; choices are judged by testing each claim (evaluate each expression or story, check
// each reason's numbers and whether it really explains). See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, fracs, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
/** a plain value: '2 1/2', '4/5', '3.5', '8' → Q (null when it is not a number) */
const val = s => { const t = String(s).trim(); if (!/^-?\d+(?:\.\d+)?(?:\s+\d+\/\d+)?$|^-?\d+\/\d+$/.test(t)) return null; try { return Q(t); } catch { return null; } };
/** "x × y" (plain) → [Q, Q] */
const product2 = s => { const p = String(s).split(' × ').map(val); return p.length === 2 && p.every(Boolean) ? p : null; };
/** the first two fractions (or mixed numbers) of a text */
const two = t => { const f = fracs(t); return f.length >= 2 ? [f[0], f[1]] : null; };
const ofTwo = t => { const f = two(t); return f ? f[0].mul(f[1]) : null; };
const UNIT = '(ft|yd|m|in|cm)';
/** the rectangle of a prompt: { L, W, u } */
function rect(p) {
  const m = p.match(new RegExp(`is (\\S+(?: \\d+/\\d+)?) ${UNIT} (?:long and|by) (\\S+(?: \\d+/\\d+)?) ${UNIT}`));
  if (!m || m[2] !== m[4]) return null;
  const L = val(m[1]), W = val(m[3]);
  return L && W ? { L, W, u: m[2] } : null;
}
const COUNT_ONLY = /\b(marbles|crayons|stickers|pages)\b/;

// ---------------------------------------------------------------- the families
const F = {
  ofWhole(q) {
    const p = q.prompt;
    let m = p.match(/^Compare (\d+)\/(\d+) of (\d+) with (\d+) × (\d+)\/(\d+)\. Which is true\?/);
    if (m) {
      const f = Q(+m[1], +m[2]), n = +m[3], v = f.mul(n);
      const same = +m[4] === n && Q(+m[5], +m[6]).eq(f);
      return choiceWhere(q, c => {
        const x = c.match(/^Both are (\S+): (\d+)\/(\d+) of (\d+) is (\S+), and (\d+) copies of (\d+)\/(\d+) are (\d+)\/(\d+) = (\S+)\.$/);
        if (x) return same && val(x[1])?.eq(v) && val(x[5])?.eq(v) && Q(+x[9], +x[10]).eq(v) && val(x[11])?.eq(v) && +x[9] === n * +m[1] && +x[10] === +m[2];
        return false;   // "a/b of n is ..., but n × a/b is ..." (they are equal) and "you can't multiply by a fraction" are false
      });
    }
    m = p.match(/(\d+)\/(\d+) of (\d+)\b/) ?? null;
    if (m) return Q(+m[1], +m[2]).mul(+m[3]).pair;
    m = p.match(/^There are (\d+) [a-z ]+?\. How much is (\d+)\/(\d+) of them\?/);
    if (m) return Q(+m[2], +m[3]).mul(+m[1]).pair;
    return undefined;
  },
  areaRead(q) { const v = ofTwo(q.prompt); return v ? v.pair : undefined; },
  tiles(q) { const r = rect(q.prompt); return r ? r.L.mul(r.W).pair : undefined; },
  rule(q) {
    const p = q.prompt;
    let m = p.match(/shows (\d+)\/(\d+) of (\d+)\/(\d+) of a pan\. How many cells are eaten, and how many equal cells are in the whole pan\?/);
    if (m) return [+m[1] * +m[3], +m[2] * +m[4]];
    m = p.match(/shows (\d+)\/(\d+) of the [a-z]+ (\d+)\/(\d+): .+? Why is the bottom number (\d+)\?/);
    if (m) {
      const b = +m[2], d = +m[4], N = +m[5];
      return choiceWhere(q, c => {
        const x = c.match(/^The second cuts run through the whole pan, so it has (\d+) × (\d+) = (\d+) equal cells\.$/);
        return !!x && +x[1] * +x[2] === +x[3] && +x[3] === N && b * d === N && ((+x[1] === b && +x[2] === d) || (+x[1] === d && +x[2] === b));
      });
    }
    return undefined;
  },
  equation(q) {
    const p = q.prompt;
    let m = p.match(/^(\d+)\/(\d+) of a yard of ribbon is left\. [A-Z][a-z]+ uses (\d+)\/(\d+) of it/);
    if (m) {
      const A = Q(+m[1], +m[2]), f = Q(+m[3], +m[4]);
      return choiceWhere(q, c => { const x = product2(c); return !!x && ((x[0].eq(f) && x[1].eq(A)) || (x[0].eq(A) && x[1].eq(f))); });
    }
    m = p.match(/^Which story fits (.+?)\?$/);
    if (m) {
      const x = product2(m[1]);
      if (!x) return undefined;
      const v = x[0].mul(x[1]);
      // a story fits a product when it takes a fraction OF an amount ("uses 1/3 of it"), with the two factors as the
      // fraction and the amount; buying more is a sum and cutting off a length is a difference, even when the numbers
      // happen to give the same value (1/2 − 1/3 = 1/2 × 1/3)
      return choiceWhere(q, c => {
        const s = c.match(/has (\S+) yd of ribbon and uses (\S+) of it\./);
        if (!s) return false;
        const amt = val(s[1]), f = val(s[2]);
        return !!amt && !!f && ((f.eq(x[0]) && amt.eq(x[1])) || (f.eq(x[1]) && amt.eq(x[0])));
      });
    }
    return undefined;
  },
  compute(q) {
    const m = q.prompt.match(/^Multiply: (.+?)\. Any equal form is fine\./);
    if (!m) return undefined;
    const fs = m[1].split(' × ').map(val);
    if (fs.some(f => !f)) return undefined;
    return fs.reduce((a, b) => a.mul(b)).pair;
  },
  simplify(q) {
    const w = q.prompt.match(/^For (\d+)\/(\d+) × (\d+)\/(\d+), ([A-Z][a-z]+) writes (\d+)\/(\d+) and ([A-Z][a-z]+) writes (\d+)\/(\d+)\. Who is right\?/);
    if (w) {
      const v = Q(+w[1], +w[2]).mul(Q(+w[3], +w[4]));
      const okA = Q(+w[6], +w[7]).eq(v), okB = Q(+w[9], +w[10]).eq(v);
      return choiceWhere(q, c => {
        if (/^Both: /.test(c)) { const x = c.match(/^Both: (\d+)\/(\d+) and (\d+)\/(\d+) are the same amount\.$/); return okA && okB && !!x && Q(+x[1], +x[2]).eq(Q(+x[3], +x[4])); }
        const x = c.match(/^Only ([A-Z][a-z]+):/);
        if (!x) return false;
        // "only one is right" is true only when the other one's value is wrong (an unsimplified product is still right)
        return x[1] === w[5] ? okA && !okB : x[1] === w[8] ? okB && !okA : false;
      });
    }
    const m = q.prompt.match(/^(\d+)\/(\d+) × (\d+)\/(\d+) = (\d+)\/(\d+)\. Write it in simplest form\./);
    return m ? Q(+m[1], +m[2]).mul(Q(+m[3], +m[4])).pair : undefined;
  },
  cancel(q) {
    const p = q.prompt;
    let m = p.match(/^Simplify first, then multiply: (.+?)\. \(/);
    if (m) { const x = product2(m[1]); return x ? x[0].mul(x[1]).pair : undefined; }
    m = p.match(/^To find (.+?), which first step keeps the product the same\?/);
    if (!m) return undefined;
    const x = product2(m[1]);
    if (!x) return undefined;
    const v = x[0].mul(x[1]);
    const steps = (q.choices ?? []).map(c => { const y = c.match(/^(\S+ × \S+) \(/); const z = y && product2(y[1]); return z ? z[0].mul(z[1]) : null; });
    const anySame = steps.some(s => s && s.eq(v));
    return choiceWhere(q, (c, i) => (/^None:/.test(c) ? !anySame : !!steps[i] && steps[i].eq(v)));
  },
  predict(q) {
    const p = q.prompt;
    let m = p.match(/^Without multiplying: is (.+?) × (.+?) greater than, less than, or equal to (.+?)\?$/);
    if (m) {
      const f = val(m[1]), X = val(m[2]), Y = val(m[3]);
      if (!f || !X || !Y) return undefined;
      const cmp = f.mul(X).cmp(Y);
      return choiceWhere(q, c => {
        const x = c.match(/^(greater than|less than|equal to) (.+)$/);
        return !!x && val(x[2])?.eq(Y) && ({ 'greater than': 1, 'less than': -1, 'equal to': 0 })[x[1]] === cmp;
      });
    }
    m = p.match(/^A red ribbon is (\d+) ft long\. A blue ribbon is (\d+)\/(\d+) as long as the red one\./);
    if (m) {
      const R = +m[1], f = Q(+m[2], +m[3]), c1 = f.cmp(1);
      return choiceWhere(q, c => {
        let x = c.match(/^(Longer|Shorter) than (\d+) ft: it is (\d+)\/(\d+) as long, and (\d+)\/(\d+) is (more|less) than 1\.$/);
        if (x) return +x[2] === R && Q(+x[3], +x[4]).eq(f) && Q(+x[5], +x[6]).eq(f) && (x[1] === 'Longer' ? c1 > 0 : c1 < 0) && (x[7] === 'more' ? c1 > 0 : c1 < 0);
        x = c.match(/^(Longer|Shorter) than (\d+) ft: it is (\d+) times (\d+)\/(\d+) ft\.$/);
        if (x) return +x[2] === R && +x[3] === R && Q(+x[4], +x[5]).eq(f) && (x[1] === 'Longer' ? c1 > 0 : c1 < 0);
        x = c.match(/^Exactly (\d+) ft:/);
        if (x) return +x[1] === R && c1 === 0;
        return false;
      });
    }
    return undefined;
  },
  explain(q) {
    const m = q.prompt.match(/^Why is (\d+)\/(\d+) × (\d+)\/(\d+) (less than|more than|equal to) (\d+)\/(\d+)\? Pick the best reason\./);
    if (!m) return undefined;
    const a = +m[1], b = +m[2], X = Q(+m[3], +m[4]);
    return choiceWhere(q, c => {
      let x = c.match(/^(\d+)\/(\d+) means (\d+) of (\d+) equal parts of (\d+)\/(\d+): that is less than all (\d+) parts\.$/);
      if (x) return a < b && +x[1] === a && +x[2] === b && +x[3] === a && +x[4] === b && Q(+x[5], +x[6]).eq(X) && +x[7] === b;
      x = c.match(/^(\d+)\/(\d+) is all of (\d+)\/(\d+) \((\d+) of (\d+) parts\) plus (\d+) more parts?\.$/);
      if (x) return a > b && +x[1] === a && +x[2] === b && Q(+x[3], +x[4]).eq(X) && +x[5] === b && +x[6] === b && +x[7] === a - b;
      x = c.match(/^(\d+)\/(\d+) is 1 whole: one whole (\d+)\/(\d+) is (\d+)\/(\d+)\.$/);
      if (x) return a === b && +x[1] === a && +x[2] === b && Q(+x[3], +x[4]).eq(X) && Q(+x[5], +x[6]).eq(X);
      return false;   // "always shrinks", "can't multiply by a fraction", "I tried two examples" are not reasons
    });
  },
  story(q) {
    const v = ofTwo(q.prompt.split(' Then check:')[0]);
    return v ? v.pair : undefined;
  },
  rect(q) {
    const p = q.prompt, r = rect(p);
    if (!r) return undefined;
    const A = r.L.mul(r.W), P = r.L.add(r.W).mul(2);
    const out = v => (q.input === 'num' ? v.value : v.pair);
    if (/What is its area\?/.test(p)) return out(A);
    if (/What is its perimeter\?/.test(p)) return out(P);
    if (/Which is right\?/.test(p)) {
      return choiceWhere(q, c => {
        const x = c.match(/^P = (.+?) ([a-z ]+), A = (.+?) ([a-z ]+)$/);
        return !!x && val(x[1])?.eq(P) && x[2] === r.u && val(x[3])?.eq(A) && x[4] === `sq ${r.u}`;
      });
    }
    return undefined;
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, P = q.data?.picture;
  switch (q.family) {
    case 'ofWhole': {
      const m = p.match(/(\d+)\/(\d+) of (\d+) ([a-z]+)/) ?? p.match(/^There are (\d+) ([a-z]+)[a-z ]*?\. How much is (\d+)\/(\d+)/);
      if (m && COUNT_ONLY.test(p)) {
        const v = /^There/.test(p) ? Q(+m[3], +m[4]).mul(+m[1]) : Q(+m[1], +m[2]).mul(+m[3]);
        if (v.d !== 1) out.push(`${v} ${COUNT_ONLY.exec(p)[1]}: a part of a thing that is not cut`);
      }
      break;
    }
    case 'areaRead': {
      const f = two(p);
      if (f) {
        if (/of the (?:pan|garden bed) is/.test(p) && f[0].cmp(1) > 0) out.push(`${f[0]} of one ${/garden/.test(p) ? 'bed' : 'pan'}: more than the whole`);
        if (f[1].cmp(1) > 0 && /of the (?:frosted|buttered|planted)/.test(p)) out.push('more than all of the part is taken');
        if (P && P.c !== undefined && !(Q(P.c, P.d).eq(f[0]) && Q(P.a, P.b).eq(f[1]))) out.push('the picture draws other fractions than the story');
        if (/garden bed/.test(p) && /pans/.test(q.unit ?? '')) out.push('a garden bed answered in pans');
      }
      break;
    }
    case 'rule': {
      const m = p.match(/shows (\d+)\/(\d+) of (?:the [a-z]+ )?(\d+)\/(\d+)/);
      if (m && P && !(P.a === +m[1] && P.b === +m[2] && P.c === +m[3] && P.d === +m[4])) out.push('the picture draws other fractions than the question');
      const x = p.match(/: (\d+)\/(\d+) × (\d+)\/(\d+) = (\d+)\/(\d+)\. Why is the bottom number (\d+)\?/);
      if (x && (+x[1] * +x[3] !== +x[5] || +x[2] * +x[4] !== +x[6] || +x[6] !== +x[7])) out.push('the shown product is wrong');
      break;
    }
    case 'tiles': {
      const r = rect(p), t = p.match(/Tiles of side (\d+)\/(\d+) ft/);
      if (r && t) {
        const s = Q(+t[1], +t[2]);
        if (r.L.div(s).d !== 1 || r.W.div(s).d !== 1) out.push('the tiles do not fit the sides');
        if (r.L.cmp(1) > 0 || r.W.cmp(1) > 0) out.push('the rectangle does not fit in the 1 ft square');
      }
      break;
    }
    case 'simplify': {
      const m = p.match(/^(\d+)\/(\d+) × (\d+)\/(\d+) = (\d+)\/(\d+)\./);
      if (m && (+m[1] * +m[3] !== +m[5] || +m[2] * +m[4] !== +m[6])) out.push('the stated product is wrong');
      break;
    }
    case 'explain': {
      const m = p.match(/^Why is (\d+)\/(\d+) × (\d+)\/(\d+) (less than|more than|equal to) (\d+)\/(\d+)\?/);
      if (m) {
        const c = Q(+m[1], +m[2]).cmp(1), want = { 'less than': -1, 'more than': 1, 'equal to': 0 }[m[5]];
        if (c !== want) out.push('the question states a false comparison');
        if (!Q(+m[3], +m[4]).eq(Q(+m[6], +m[7]))) out.push('compared with a different number');
      }
      break;
    }
    case 'story': {
      const f = two(p.split(' Then check:')[0]);
      if (f && f[0].eq(1) && f[1].eq(1)) out.push('times 1: neither more nor less');
      if (f && /takes \S+ of what is left|uses \S+ of it/.test(p) && f[1].cmp(1) > 0) out.push('takes more than all of it');
      const m = p.match(/^(\d+)\/(\d+) of a pan of brownies is left/);
      if (m && +m[1] > +m[2]) out.push('more than a whole pan left');
      break;
    }
    case 'rect': {
      const r = rect(p);
      if (r && (r.L.cmp(0) <= 0 || r.W.cmp(0) <= 0)) out.push('a side of 0');
      break;
    }
    default: break;
  }
  if (q.input === 'choice') {
    let r; try { r = F[q.family]?.(q); } catch { r = undefined; }
    if (r === -1) out.push('no single right choice');
  }
  return [...new Set(out)].join('; ');
}

export default {
  solve(q) {
    const f = F[q.family];
    if (!f) return undefined;
    try { return f(q); } catch { return undefined; }
  },
  sane,
};
