// Oracle for the lesson "fraction-of-quantity" (a/b of a whole number or a measured amount). Written from what the
// student sees only: the prompt (the fraction, the whole, which thing is the whole), the board and the choices. Every
// answer is a/b × whole worked out exactly (or the whole back from a part); choices are judged by testing each claim
// (evaluate each expression, each grouping, each "right/wrong because" line). See docs/lessons/QUALITY_LAYER.md.
import { Q, nums, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- reading
/** the first fraction a/b in the prompt */
const frac = p => { const m = String(p).match(/(\d+)\/(\d+)/); return m ? { a: +m[1], b: +m[2], f: Q(+m[1], +m[2]) } : null; };
/** the numbers of the prompt with its fractions taken out */
const plainNums = p => nums(String(p).replace(/\d+\/\d+/g, ' '));
/** the whole: the first number of the prompt that is not part of a fraction */
const whole = p => plainNums(p)[0];
const UNITS = ['ft', 'in', 'yd', 'min', 'miles', 'cm', 'm', 'lb', 'oz', 'cups'];
/** the unit right after the whole in the prompt ("a 30 ft rope" → ft) */
function unitOf(p) {
  const m = String(p).replace(/\d+\/\d+/g, ' ').match(/(\d+)\s+([a-z]+)/);
  return m && UNITS.includes(m[2]) ? m[2] : null;
}
/** a ÷ / × expression: '(48 ÷ 8) × 7', '48 ÷ 8' → Q */
function evalExpr(s) {
  let m = s.match(/^\((\d+) ÷ (\d+)\) × (\d+)$/);
  if (m) return Q(+m[1], +m[2]).mul(+m[3]);
  m = s.match(/^(\d+) ÷ (\d+)$/);
  if (m) return Q(+m[1], +m[2]);
  m = s.match(/^(\d+) × (\d+)$/);
  if (m) return Q(+m[1] * +m[2]);
  return null;
}
const amount = q => { const fr = frac(q.prompt), w = whole(q.prompt); return fr && w !== undefined ? fr.f.mul(w) : null; };

// ---------------------------------------------------------------- the families
const numAmount = q => { const v = amount(q); return v ? v.value : undefined; };
const F = {
  setShare: numAmount,
  tapeUnit: numAmount,
  iterate: numAmount,
  bareUnit: numAmount,
  bareDTM: numAmount,
  overOne: numAmount,
  fracShare(q) { const v = amount(q); return v ? v.pair : undefined; },
  fracNonUnit(q) { const v = amount(q); return v ? v.pair : undefined; },
  recover(q) {
    // a/b of the whole is c: one share 1/b is c ÷ a
    const m = q.prompt.match(/^(\d+)\/(\d+) of .+? is (\d+(?:\.\d+)?) [a-z]+\. How much is 1\/(\d+) of it\?/);
    return m && +m[4] === +m[2] ? Q(+m[3]).div(+m[1]).value : undefined;
  },
  unknownWhole(q) {
    const m = q.prompt.match(/^(\d+)\/(\d+) of .+? is (\d+(?:\.\d+)?) [a-z]+\. How long is the whole/);
    return m ? Q(+m[3]).div(+m[1]).mul(+m[2]).value : undefined;
  },
  whichWhole(q) {
    const p = q.prompt, fr = frac(p);
    if (!fr) return undefined;
    const noun = p.match(/\d+\/\d+ of (?:the|this) ([a-z]+)/)?.[1];
    let W;
    const m = noun && p.match(new RegExp(`(\\d+) ${noun}\\b`));
    W = m ? +m[1] : whole(p);
    return fr.f.mul(W).value;
  },
  groupChoice(q) {
    const p = q.prompt, fr = frac(p), W = whole(p);
    if (!fr || W === undefined) return undefined;
    const v = fr.f.mul(W);
    if (/^What is/.test(p)) {
      return choiceWhere(q, c => { const m = c.match(/^(\d+) [a-z]+$/); return !!m && v.eq(+m[1]); });
    }
    return choiceWhere(q, c => {
      let m = c.match(/^(\d+) equal groups of (\d+), then take (\d+) groups?$/);
      if (m) return +m[1] * +m[2] === W && Q(+m[3], +m[1]).eq(fr.f);
      m = c.match(/^Groups of (\d+), then take (\d+) groups?$/);
      if (m) return W % +m[1] === 0 && Q(+m[2], W / +m[1]).eq(fr.f);
      m = c.match(/^Take (\d+) [a-z]+$/);
      if (m) return v.eq(+m[1]);
      return false;
    });
  },
  equalParts(q) {
    const p = q.prompt;
    const m = p.match(/cuts a (\d+) ([a-z]+) .+? into (\d+) pieces: (.+?)\. Is each piece (\d+)\/(\d+) of/);
    if (!m) return undefined;
    const W = +m[1], k = +m[3], pieces = nums(m[4]);
    const equal = pieces.every(x => x === pieces[0]), sum = pieces.reduce((s, x) => s + x, 0);
    const yes = equal && sum === W && pieces.length === k && +m[5] === 1 && +m[6] === k;
    return choiceWhere(q, c => (/^Yes\./.test(c) ? yes : /^No\. The pieces are not equal\.$/.test(c) ? !equal : false));
  },
  expr(q) {
    const p = q.prompt;
    let v;
    const t = p.match(/^A (\d+) [a-z]+ tape is cut into (\d+) equal parts, and (\d+) parts? (?:are|is) taken/);
    if (t) v = Q(+t[3], +t[2]).mul(+t[1]);
    else { const fr = frac(p), W = whole(p); if (fr && W !== undefined) v = fr.f.mul(W); }
    if (!v) return undefined;
    return choiceWhere(q, c => { const e = evalExpr(c); return !!e && e.eq(v); });
  },
  unitCheck(q) {
    const v = amount(q), u = unitOf(q.prompt);
    if (!v || !u) return undefined;
    return choiceWhere(q, c => { const m = c.match(/^(\d+(?:\.\d+)?) ([a-z]+)$/); return !!m && v.eq(+m[1]) && m[2] === u; });
  },
  predict(q) {
    const p = q.prompt, fr = frac(p);
    if (!fr) return undefined;
    let m = p.match(/^Without working it out: is \d+\/\d+ of (\d+) less than, equal to, or more than (\d+)\?/);
    if (m) {
      const W = +m[1], v = fr.f.mul(W), cmp = v.cmp(+m[2]);
      return choiceWhere(q, c => {
        const x = c.match(/^(Less than|Equal to|More than) (\d+)$/);
        return !!x && +x[2] === +m[2] && ({ 'Less than': -1, 'Equal to': 0, 'More than': 1 })[x[1]] === cmp;
      });
    }
    m = p.match(/says \d+\/\d+ of (\d+) is (\d+)\. Without working it out, can that be right\?/);
    if (m) {
      const W = +m[1], claim = +m[2], c1 = fr.f.cmp(1);
      // ruled out by size alone: a fraction below 1 gives less than the whole, above 1 more than the whole
      const impossible = (c1 < 0 && claim >= W) || (c1 > 0 && claim <= W) || (c1 === 0 && claim !== W);
      return choiceWhere(q, c => {
        let x = c.match(/^No\. (\d+)\/(\d+) is less than 1, so the answer is less than (\d+)\.$/);
        if (x) return Q(+x[1], +x[2]).eq(fr.f) && c1 < 0 && +x[3] === W && claim >= W;
        x = c.match(/^No\. (\d+)\/(\d+) is more than 1, so the answer is more than (\d+)\.$/);
        if (x) return Q(+x[1], +x[2]).eq(fr.f) && c1 > 0 && +x[3] === W && claim <= W;
        if (/^Yes\./.test(c)) return false;   // "multiplying always makes it bigger" / "a fraction always makes it smaller" are false rules
        if (/^You can't tell without working it out\.$/.test(c)) return !impossible;
        return false;
      });
    }
    return undefined;
  },
  verify(q) {
    const m = q.prompt.match(/says (\d+)\/(\d+) of (\d+) is (\d+)\. Check it/);
    if (!m) return undefined;
    const a = +m[1], b = +m[2], W = +m[3], c = +m[4];
    const right = Q(a, b).mul(W).eq(c);
    return choiceWhere(q, s => {
      let x = s.match(/^Right: (\d+) ÷ (\d+) = (\d+), and (\d+) × (\d+) = (\d+), the whole\.$/);
      if (x) return right && +x[1] === c && +x[2] === a && Q(c, a).eq(+x[3]) && +x[4] === +x[3] && +x[5] === b && +x[3] * b === +x[6] && +x[6] === W;
      x = s.match(/^Wrong: (\d+) ÷ (\d+) = (\d+), and (\d+) × (\d+) = (\d+), not (\d+)\.$/);
      if (x) return !right && +x[1] === c && +x[2] === a && Q(c, a).eq(+x[3]) && +x[4] === +x[3] && +x[5] === b && +x[3] * b === +x[6] && +x[6] !== W && +x[7] === W;
      x = s.match(/^Wrong: (\d+)\/(\d+) of (\d+) must be more than (\d+)\.$/);
      if (x) return !right && a > b;
      // "Right: c ÷ a = u, and u × a = c" only undoes the step it checks; "Right: c is less than W" proves nothing:
      // neither reaches the whole, so neither checks the claim
      return false;
    });
  },
};

// ---------------------------------------------------------------- sane
function sane(q) {
  const out = [], p = q.prompt, fr = frac(p);
  const fam = q.family;
  if (fr && fr.b === 0) out.push('denominator 0');
  const typedWhole = ['setShare', 'tapeUnit', 'iterate', 'bareUnit', 'bareDTM', 'overOne', 'whichWhole', 'unitCheck'];
  if (typedWhole.includes(fam) || (fam === 'groupChoice' && /^What is/.test(p))) {
    const v = fam === 'whichWhole' ? F.whichWhole(q) : amount(q)?.value;
    if (v !== undefined && !Number.isInteger(v) && !['min', 'ft', 'in', 'yd'].includes(unitOf(p) ?? '')) out.push(`${v} of a set of things is not a whole count`);
  }
  if (fam === 'setShare') {
    const m = p.match(/of (\d+) [a-z]+: (\d+) [a-z]+ and (\d+) [a-z]+\./);
    if (m && +m[2] + +m[3] !== +m[1]) out.push('the two kinds do not add up to the set');
  }
  if (fam === 'whichWhole') {
    const m = p.match(/A class has (\d+) students\. (\d+) of them walk/);
    if (m && +m[2] > +m[1]) out.push('more walkers than students');
  }
  if (fam === 'recover' || fam === 'unknownWhole') {
    const m = p.match(/^(\d+)\/(\d+) of .+? is (\d+(?:\.\d+)?) [a-z]+\./);
    if (m && !Number.isInteger(+m[3] / +m[1])) out.push('one share is not a whole number');
    if (m && +m[1] >= +m[2]) out.push('the part is not less than the whole');
  }
  if (fam === 'fracShare' || fam === 'fracNonUnit') {
    const W = whole(p);
    if (/ has an? .+? and needs \d+\/\d+ of it/.test(p) && fr && fr.a > fr.b) out.push(`needs ${fr.a}/${fr.b} of the thing in hand: more than all of it`);
    if (/sandwich/.test(p) && W < 3) out.push(`a ${W} in sandwich is not a real sandwich`);
    if (fr && W !== undefined && fr.f.mul(W).n % fr.f.mul(W).d === 0 && fam === 'fracShare') out.push('the share is a whole number, not a fraction');
  }
  if (fam === 'overOne' && fr && fr.a < fr.b) out.push('the fraction is less than one whole');
  if (fam === 'expr' || fam === 'groupChoice' || fam === 'unitCheck') {
    const W = whole(p);
    if (fr && W !== undefined && !Number.isInteger(fr.f.mul(W).value)) out.push('the amount is not a whole number');
  }
  if (fam === 'equalParts') {
    const m = p.match(/cuts a (\d+) ([a-z]+) .+? into (\d+) pieces: (.+?)\. Is each piece/);
    if (m) {
      const pieces = nums(m[4]);
      if (pieces.length !== +m[3]) out.push('the number of pieces listed is not the stated one');
      if (pieces.reduce((s, x) => s + x, 0) !== +m[1]) out.push('the pieces do not add up to the whole');
      if (pieces.some(x => x <= 0)) out.push('a piece of length 0');
    }
  }
  if (q.input === 'choice') {
    let r; try { r = F[fam]?.(q); } catch { r = undefined; }
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
