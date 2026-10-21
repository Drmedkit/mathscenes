// solving.ts: solving a linear equation step by step (the worked solution after a miss), the equations each "solve"
// sub-goal practises (number ranges from the topic JSON), and the classifier that names the misconception behind a
// wrong typed solution. Pure: no DOM, no canvas.
import { type Verdict, int, pick } from '../../runtime/item';
import { type Eq, type Fmt, type Grp, type Piece, type Q, type Side, G, N, X, Z, eqHtml, isGrp, isZ, nH, neg, num, q, qSub, sideHtml, sideLin, simp, solve, subHtml, valueAt } from './lin';
import { qAdd, qDiv, qEq, qMul, rat } from '../../../core/math';

export const MC = {
  oneSide: 'mc.equal-sign.evaluates-one-side-only',
  examples: 'mc.reasoning-language.examples-as-proof',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  reSolve: 'mc.linear-equations.re-solves-equivalent-equations',
  moveSign: 'mc.linear-equations.move-and-change-sign-justification',
  onlyConst: 'mc.linear-equations.only-constants-cross',
  rewriteOther: 'mc.linear-equations.rewrite-one-side-changes-other',
  anySame: 'mc.linear-equations.any-same-operation-preserves',
  computed: 'mc.linear-equations.solution-as-computed-output',
  exactlyOne: 'mc.linear-equations.exactly-one-solution',
  noSign: 'mc.linear-equations.moves-term-without-sign-change',
  emptyZero: 'mc.linear-equations.empty-solution-set-means-zero',
  negStop: 'mc.integers.stops-with-negated-variable',
  leftOnly: 'mc.linear-equations.variable-must-be-on-left',
  outside: 'mc.properties.combines-outside-term-with-coefficient',
  partial: 'mc.properties.partial-distribution',
  negFirst: 'mc.integers.distribute-negative-first-term-only',
  derivedCheck: 'mc.linear-equations.derived-equation-check-proves-original',
  chainBad: 'mc.equal-sign.chains-incompatible-values',
  noSolErr: 'mc.linear-equations.no-solution-means-error',
  zeroVsNone: 'mc.linear-equations.zero-vs-no-solution',
  cancelMisread: 'mc.linear-equations.cancellation-outcome-misread',
  sameLook: 'mc.equal-sign.equal-means-same-look',
  fracForms: 'mc.expressions.fractional-coefficient-forms-treated-as-different',
  constEdit: 'mc.linear-equations.constant-edit-implies-no-solution',
  incomplete: 'mc.linear-equations.incomplete-step-justification',
  ctxDomain: 'mc.functions-concept.context-domain-all-reals',
  bare: 'mc.reasoning-language.bare-number-without-meaning',
  // further catalogue ids the classifiers recognise
  oneSideOnly: 'mc.linear-equations.one-side-only',
  signDrop: 'mc.integers.divide-by-coefficient-without-sign',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
  contraValue: 'mc.linear-equations.contradiction-constant-as-variable-value',
  cancelAll: 'mc.linear-equations.cancellation-always-infinitely-many',
  nonzeroDiv: 'mc.linear-equations.omits-nonzero-divisor-condition',
  rewriteValue: 'mc.properties.rewriting-changes-value',
} as const;

export const XH = '<i>x</i>';
export const eqOf = (L: Side, R: Side, fmt: Fmt = 'frac'): Eq => ({ L, R, fmt });
const lcm = (a: number, b: number): number => { const g = (x: number, y: number): number => (y ? g(y, x % y) : x); return (a / g(a, b)) * b; };

// ---------- transforming equations ----------
const scaleP = (p: Piece, M: Q): Piece => (isGrp(p) ? { f: qMul(p.f, M), e: p.e } : { c: qMul(p.c, M), v: p.v });
export const scaleSide = (s: Side, M: Q): Side => s.map(p => scaleP(p, M));
/** every coefficient and constant written in the equation, including inside groups (for denominators) */
function allCoefs(e: Eq): Q[] { return [...e.L, ...e.R].flatMap(p => (isGrp(p) ? [p.f, ...p.e.map(t => t.c)] : [p.c])); }
/** the smallest whole number that clears every fraction / decimal (1 when there is none) */
export function clearBy(e: Eq): number {
  let M = 1;
  for (const p of [...e.L, ...e.R]) M = lcm(M, isGrp(p) ? p.f.q : p.c.q);
  if (e.fmt === 'dec' && M > 1) for (const t of [10, 100, 1000]) if (t % M === 0) return t;
  return M;
}
export const hasGroups = (e: Eq) => [...e.L, ...e.R].some(isGrp);
export const isWhole = (e: Eq) => allCoefs(e).every(c => c.q === 1);
export const expandSide = (s: Side): Side => s.flatMap(p => (isGrp(p) ? p.e.map(t => ({ c: qMul(p.f, t.c), v: t.v })) : [p]));
const needsCollect = (s: Side) => s.filter(p => !isGrp(p) && p.v === 'x').length > 1 || s.filter(p => !isGrp(p) && p.v === '').length > 1;

/** the worked solution, line by line (HTML), ending with the check in the ORIGINAL equation */
export function workLines(e0: Eq): string[] {
  const out: string[] = [];
  let e = e0;
  const fmt = e.fmt;
  const M = clearBy(e);
  if (M > 1) {
    const sc: Eq = { L: scaleSide(e.L, q(M)), R: scaleSide(e.R, q(M)), fmt };
    out.push(`Multiply every term on both sides by ${M}: ${eqHtml(sc)}.`);
    e = sc;
  }
  if (hasGroups(e)) { e = { L: expandSide(e.L), R: expandSide(e.R), fmt }; out.push(`Expand the parentheses: ${eqHtml(e)}.`); }
  if (needsCollect(e.L) || needsCollect(e.R)) { e = { L: simp(e.L), R: simp(e.R), fmt }; out.push(`Combine like terms on each side: ${eqHtml(e)}.`); }
  else e = { L: simp(e.L), R: simp(e.R), fmt };
  const a = sideLin(e.L), b = sideLin(e.R);
  const sol = solve(e0);
  if (!isZ(a.m) && !isZ(b.m)) {
    // collect so the x-coefficient left over is positive
    const fromLeft = num(a.m) < num(b.m);
    const t = fromLeft ? a.m : b.m;
    const L2: Side = fromLeft ? simp([N(a.k)]) : simp([X(qSub(a.m, b.m)), N(a.k)]);
    const R2: Side = fromLeft ? simp([X(qSub(b.m, a.m)), N(b.k)]) : simp([N(b.k)]);
    out.push(`${num(t) > 0 ? 'Subtract' : 'Add'} ${sideHtml([X(num(t) > 0 ? t : neg(t))], fmt)} ${num(t) > 0 ? 'from' : 'to'} both sides: ${sideHtml(L2, fmt)} = ${sideHtml(R2, fmt)}.`);
    e = { L: L2, R: R2, fmt };
  }
  if (sol.kind !== 'one') {
    const L = sideLin(e.L), Rr = sideLin(e.R);
    if (!isZ(L.m) || !isZ(Rr.m)) { const t = L.m; out.push(`Subtract ${sideHtml([X(t)], fmt)} from both sides: ${nH(L.k, fmt)} = ${nH(Rr.k, fmt)}.`); }
    out.push(sol.kind === 'none'
      ? `${nH(sideLin(e.L).k, fmt)} = ${nH(sideLin(e.R).k, fmt)} is never true, and every step kept the solutions: <b class="s">no solution</b>.`
      : `${nH(sideLin(e.L).k, fmt)} = ${nH(sideLin(e.R).k, fmt)} is always true, and every step kept the solutions: <b class="s">every number</b> is a solution.`);
    return out;
  }
  // now one side is mx + k (or mx) and the other a number
  const xLeft = !isZ(sideLin(e.L).m);
  const xs = sideLin(xLeft ? e.L : e.R), other = sideLin(xLeft ? e.R : e.L);
  const one = qEq(xs.m, q(1));
  if (!isZ(xs.k)) {
    const K = qSub(other.k, xs.k);
    const verb = num(xs.k) > 0 ? `Subtract ${nH(xs.k, fmt)} from` : `Add ${nH(neg(xs.k), fmt)} to`;
    const mx = sideHtml([X(xs.m)], fmt), Kh = one ? `<b class="s">${nH(K, fmt)}</b>` : nH(K, fmt);
    out.push(`${verb} both sides: ${xLeft ? `${mx} = ${Kh}` : `${Kh} = ${mx}`}${one && !xLeft ? `, the same as ${XH} = ${nH(K, fmt)}` : ''}.`);
  }
  if (one && !isZ(xs.k)) { /* the line above already ends at the solution */ }
  else if (!one) {
    const by = xs.m.q === 1 ? `Divide both sides by ${nH(xs.m)}` : `Multiply both sides by ${nH(rat(xs.m.q * Math.sign(xs.m.p), Math.abs(xs.m.p)))}`;
    out.push(`${by}: ${XH} = <b class="s">${nH(sol.x, fmt)}</b>.`);
  } else out.push(`So ${XH} = <b class="s">${nH(sol.x, fmt)}</b>${xLeft ? '' : ` (the same as ${nH(sol.x, fmt)} = ${XH})`}.`);
  out.push(checkLine(e0, sol.x));
  return out;
}
export function checkLine(e: Eq, x: Q): string {
  const l = valueAt(e.L, x), r = valueAt(e.R, x);
  return `Check in the original: left ${subHtml(e.L, x, e.fmt)} = ${nH(l, e.fmt)}, right ${subHtml(e.R, x, e.fmt)} = ${nH(r, e.fmt)}${qEq(l, r) ? ' ✓' : ''}.`;
}

// ---------- the misconception classifier for a typed solution ----------
/** factor to the first term only: 3(x + 2) -> 3x + 2 */
const partialSide = (s: Side): Side => s.flatMap(p => (isGrp(p) ? [{ c: qMul(p.f, p.e[0]!.c), v: p.e[0]!.v }, ...p.e.slice(1)] : [p]));
/** a negative factor's sign on the first term only: -2(x + 3) -> -2x + 6 */
const negFirstSide = (s: Side): Side => s.flatMap(p => (isGrp(p) && p.f.p < 0 ? p.e.map((t, i) => ({ c: qMul(i === 0 ? p.f : neg(p.f), t.c), v: t.v })) : isGrp(p) ? expandSide([p]) : [p]));
/** a number in front of a group joins the factor: 5 - 2(x - 1) -> 3(x - 1) */
function outsideSide(s: Side): Side | null {
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1]!, b = s[i]!;
    if (!isGrp(a) && a.v === '' && isGrp(b)) return [...s.slice(0, i - 1), G(qAdd(a.c, b.f), ...b.e), ...s.slice(i + 1)];
  }
  return null;
}
/** scale only the x-terms (and fraction constants), leaving whole-number constants: the "some terms" slip */
function someTermsEq(e: Eq, M: number): Eq {
  const sc = (s: Side): Side => s.map(p => (isGrp(p) ? (p.f.q !== 1 ? { f: qMul(p.f, q(M)), e: p.e } : p) : p.v === 'x' || p.c.q !== 1 ? { c: qMul(p.c, q(M)), v: p.v } : p));
  return { L: sc(e.L), R: sc(e.R), fmt: e.fmt };
}
export function altSolutions(e: Eq): [Q, string, string][] {
  const out: [Q, string, string][] = [];
  const add = (alt: Eq | null, mc: string, say: string) => { if (!alt) return; const s = solve(alt); if (s.kind === 'one') out.push([s.x, mc, say]); };
  const groups = [...e.L, ...e.R].filter(isGrp) as Grp[];
  if (groups.length) {
    add({ L: partialSide(e.L), R: partialSide(e.R), fmt: e.fmt }, MC.partial, 'The factor multiplies EVERY term inside the parentheses, not just the first.');
    if (groups.some(g => g.f.p < 0)) add({ L: negFirstSide(e.L), R: negFirstSide(e.R), fmt: e.fmt }, MC.negFirst, 'A negative factor changes the sign of every term inside: −2(x + 3) is −2x − 6.');
    const oL = outsideSide(e.L), oR = outsideSide(e.R);
    if (oL || oR) add({ L: oL ?? e.L, R: oR ?? e.R, fmt: e.fmt }, MC.outside, 'Multiply before you add or subtract: the number in front of the group is not part of the factor.');
  }
  const M = clearBy(e);
  if (M > 1) add(someTermsEq(e, M), MC.someTerms, `Multiply EVERY term on both sides by ${M}, the whole numbers too.`);
  const s = { L: simp(expandSide(e.L)), R: simp(expandSide(e.R)), fmt: e.fmt };
  const a = sideLin(s.L), b = sideLin(s.R);
  if (!isZ(a.m) && !isZ(b.m) && !isZ(qAdd(a.m, b.m))) out.push([qDiv(qSub(b.k, a.k), qAdd(a.m, b.m)), MC.noSign, 'Taking an x-term off one side means taking it off the other side too: the x-terms subtract, they do not add.']);
  if (!isZ(a.k) && !isZ(qSub(a.m, b.m))) out.push([qDiv(qAdd(b.k, a.k), qSub(a.m, b.m)), MC.noSign, 'A number that leaves one side is subtracted from the other side too; it does not just reappear with its sign.']);
  const sol = solve(e);
  if (sol.kind === 'one') {
    const m = qSub(a.m, b.m), K = qSub(b.k, a.k);
    if (!isZ(sol.x)) {
      if (num(m) < 0) out.push([neg(sol.x), Math.abs(num(m)) === 1 ? MC.negStop : MC.signDrop, Math.abs(num(m)) === 1 ? `−${XH} = ${nH(neg(sol.x), e.fmt)} is not finished: ${XH} is the opposite, ${nH(sol.x, e.fmt)}.` : `Divide by the coefficient WITH its sign: ${nH(K, e.fmt)} ÷ (${nH(m, e.fmt)}).`]);
    }
    if (!qEq(m, q(1)) && !qEq(m, q(-1))) { out.push([K, MC.intermediate, `${nH(K, e.fmt)} is what ${sideHtml([X(m)], e.fmt)} equals, not ${XH}. One more step: divide.`]); out.push([neg(K), MC.intermediate, `That is what ${sideHtml([X(m)], e.fmt)} equals (up to sign), not ${XH}. One more step: divide.`]); }
  }
  return out;
}
/** classify a typed solution v of an equation with one solution */
export function classifySolve(e: Eq, v: Q | null): Verdict {
  const sol = solve(e);
  if (sol.kind !== 'one') throw new Error('classifySolve: one solution expected');
  if (!v) return { ok: false, say: 'Type a number (a fraction or a decimal is fine).' };
  if (qEq(v, sol.x)) return { ok: true, say: `Yes: ${XH} = ${nH(sol.x, e.fmt)}. ${checkLine(e, sol.x)}` };
  for (const [c, mc, say] of altSolutions(e)) if (!qEq(c, sol.x) && qEq(c, v)) return { ok: false, mc, say };
  const l = valueAt(e.L, v), r = valueAt(e.R, v);
  return { ok: false, say: `Put ${nH(v, e.fmt)} in for ${XH}: the left side is ${nH(l, e.fmt)}, the right side is ${nH(r, e.fmt)}. Not equal, so it is not the solution.` };
}

// ---------- writing a side with a given value mx + k in different forms ----------
export type Style = 'plain' | 'kfirst' | 'group' | 'split' | 'negGroup';
const divisors = (m: number) => [2, 3, 4, 5, 6].filter(a => m % a === 0);
/** a side whose simplified value is mx + k (whole numbers), written in a style; null when the style cannot */
export function formSide(R: () => number, m: number, k: number, style: Style): Side | null {
  const part = (c: number, v: 'x' | ''): Piece[] => (c ? [{ c: q(c), v }] : []);
  if (style === 'plain' || (style === 'kfirst' && (!m || !k))) { const s = [...part(m, 'x'), ...part(k, '')]; return s.length ? s : [N(0)]; }
  if (style === 'kfirst') return [N(k), X(m)];
  if (style === 'group') {
    const ds = divisors(Math.abs(m)); if (!m || !ds.length) return null;
    const a = pick(R, ds) * (R() < 0.15 && m < 0 ? -1 : m < 0 ? -1 : 1), b = int(R, -9, 9) || 2, c = k - a * b;
    return [G(a, X(m / a), N(b)), ...part(c, '')];
  }
  if (style === 'negGroup') {
    const ds = divisors(Math.abs(m)).concat([1]); if (!m || m > 0) return null;
    const a = pick(R, ds), b = int(R, -8, 8) || -3, c = k + a * b;   // c - a(x/… + b)  with  -a·(m/-a)… : c - a(u x + b), u = -m/a
    if (!c) return null;
    return [N(c), G(-a, X(-m / a), N(b))];
  }
  // split: like terms spread over the side
  if (!m) return null;
  const m1 = int(R, -6, 9) || 2, m2 = m - m1; if (!m2) return null;
  const k1 = int(R, -9, 12), k2 = k - k1;
  return [...part(m1, 'x'), ...part(k1, ''), ...part(m2, 'x'), ...part(k2, '')];
}

// ---------- the equations each solve sub-goal practises ----------
const sgnRand = (R: () => number, p = 0.5) => (R() < p ? -1 : 1);
export function eqFor(R: () => number, sg: string): Eq {
  for (let tries = 0; tries < 400; tries++) {
    const e = tryEq(R, sg);
    if (!e) continue;
    const s = solve(e);
    if (s.kind !== 'one') continue;
    if (Math.abs(num(s.x)) > 40 || s.x.q > 12) continue;
    return e;
  }
  return eqOf([X(5), N(3)], [X(1), N(15)]);
}
function tryEq(R: () => number, sg: string): Eq | null {
  if (sg === 's2-negative-coefficients') {
    const a = (int(R, 1, 10)) * sgnRand(R, 0.55), c = int(R, 1, 10) * sgnRand(R, 0.5);
    if (a === c) return null;
    const x = pick(R, [0, 0, -1, -2, -3, -4, -5, -6, -8, 1, 2, 3, 4, 5, 6]);
    const b = int(R, -20, 20), d = (a - c) * x + b;
    if (Math.abs(d) > 30 || (a > 0 && c > 0)) return null;
    const L = R() < 0.3 && b ? [N(b), X(a)] : formSide(R, a, b, 'plain')!;
    const Rs = R() < 0.3 && d ? [N(d), X(c)] : formSide(R, c, d, 'plain')!;
    return eqOf(L, Rs);
  }
  if (sg === 's2-expand-positive') {
    const v = pick(R, ['left', 'left', 'both', 'divide', 'sub'] as const);
    const a = int(R, 2, 6), b = int(R, 1, 9) * (v === 'sub' ? -1 : sgnRand(R, 0.3)), x = int(R, -4, 10);
    if (v === 'divide') { const r = a * (x + b); if (r === 0 || Math.abs(r) > 60) return null; return eqOf([G(a, X(1), N(b))], [N(r)]); }
    if (v === 'both') {
      const dd = int(R, 2, 5), f = int(R, -6, 6) || 1; if (dd === a) return null;
      const g = a * (x + b) - dd * (x + f); if (Math.abs(g) > 30) return null;
      return eqOf([G(a, X(1), N(b))], g ? [G(dd, X(1), N(f)), N(g)] : [G(dd, X(1), N(f))]);
    }
    const c = R() < 0.6 ? int(R, -12, 12) : 0, d = int(R, 1, 8); if (d === a) return null;
    const e = a * (x + b) + c - d * x; if (Math.abs(e) > 40) return null;
    const L: Side = c ? (R() < 0.35 ? [N(c), G(a, X(1), N(b))] : [G(a, X(1), N(b)), N(c)]) : [G(a, X(1), N(b))];
    return eqOf(L, formSide(R, d, e, 'plain')!);
  }
  if (sg === 's2-negative-factor') {
    const v = pick(R, ['negOne', 'negA', 'kMinus', 'kMinusRev', 'both'] as const);
    const x = int(R, -5, 8);
    if (v === 'negOne') { const p = int(R, 1, 9) * sgnRand(R, 0.3), k = int(R, -9, 12), c = int(R, 1, 5) * sgnRand(R, 0.4); if (c === -1) return null; const rr = -(x + p) + k - c * x; if (Math.abs(rr) > 30) return null; return eqOf(k ? [G(-1, X(1), N(p)), N(k)] : [G(-1, X(1), N(p))], formSide(R, c, rr, 'plain')!); }
    if (v === 'negA') { const a = int(R, 2, 5), b = int(R, 1, 8) * sgnRand(R, 0.3), c = int(R, -5, 6); if (c === -a) return null; const d = -a * (x + b) - c * x; if (Math.abs(d) > 40) return null; return eqOf([G(-a, X(1), N(b))], formSide(R, c, d, 'plain')!); }
    if (v === 'kMinus') { const k = int(R, 3, 15), a = int(R, 2, 5), b = int(R, 1, 6) * sgnRand(R, 0.6), c = int(R, -4, 6); if (c === -a) return null; const d = k - a * (x + b) - c * x; if (Math.abs(d) > 40) return null; return eqOf([N(k), G(-a, X(1), N(b))], formSide(R, c, d, 'plain')!); }
    if (v === 'kMinusRev') { const k = int(R, 3, 12), a = int(R, 2, 4), b = int(R, 1, 8), u = int(R, 2, 9), c = int(R, 1, 9); if (a * u === c) return null; const d = k - a * (b - u * x) - c * x; if (Math.abs(d) > 40) return null; return eqOf([N(k), G(-a, N(b), X(-u))], formSide(R, c, d, 'plain')!); }
    const a = int(R, 2, 6), b = int(R, 1, 6), c = int(R, 2, 4), dd = int(R, 1, 6) * sgnRand(R, 0.5), e = int(R, 2, 5), f = int(R, 1, 5);
    if (a - c === e) return null;
    const g = a * (x + b) - c * (x - dd) - e * (x + f); if (Math.abs(g) > 20) return null;
    return eqOf([G(a, X(1), N(b)), G(-c, X(1), N(-dd))], g ? [G(e, X(1), N(f)), N(g)] : [G(e, X(1), N(f))]);
  }
  if (sg === 's2-fraction-coefficients') {
    const v = pick(R, ['twoFrac', 'twoFrac', 'groupFrac', 'halfGroup'] as const);
    const D = [2, 3, 4, 5, 6, 10];
    if (v === 'twoFrac') {
      const p = pick(R, D), r = pick(R, D); if (p === r && R() < 0.7) return null;
      const a = q(int(R, 1, p - 1 || 1) * sgnRand(R, 0.2), p), c = q(int(R, 1, r - 1 || 1) * sgnRand(R, 0.2), r);
      if (qEq(a, c)) return null;
      const b = int(R, -9, 9), d = int(R, -9, 12);
      const L: Side = b ? [X(a), N(b)] : [X(a)], Rs: Side = d ? [X(c), N(d)] : [X(c)];
      if (!L.length || a.q === 1 && c.q === 1) return null;
      return eqOf(L, Rs);
    }
    if (v === 'groupFrac') {
      const p = pick(R, [2, 3, 4, 5]), a = q(int(R, 1, p - 1), p), b = int(R, 1, 9) * sgnRand(R, 0.6), c = int(R, 1, 3) * sgnRand(R, 0.2), d = int(R, -9, 9);
      if (qEq(a, q(c))) return null;
      return eqOf([G(a, X(1), N(b))], d ? [X(c), N(d)] : [X(c)]);
    }
    const p = pick(R, [2, 3]), r = pick(R, [4, 6, 10].filter(z => z !== p)), b = int(R, 1, 6), d = int(R, 1, 9);
    return eqOf([G(q(1, p), X(1), N(b))], [X(q(1, r)), N(d)]);
  }
  if (sg === 's2-decimal-coefficients') {
    const v = pick(R, ['tenths', 'tenths', 'hundredths', 'group'] as const);
    const x = R() < 0.75 ? int(R, -6, 20) : int(R, -30, 90) / 10;
    if (v === 'group') {
      const a = pick(R, [0.5, 0.2, 0.4, 1.5, 2.5]), b = int(R, 1, 9) * sgnRand(R, 0.3), c = pick(R, [0.1, 0.3, 0.6, 1.2, -0.5]);
      if (a === c) return null;
      const d = Math.round((a * (x + b) - c * x) * 100) / 100; if (Math.abs(d) > 30) return null;
      return eqOf([G(a, X(1), N(b))], d ? [X(c), N(d)] : [X(c)], 'dec');
    }
    const step = v === 'tenths' ? 10 : 100;
    const a = int(R, -15, 15) / 10, c = int(R, -15, 15) / 10 + (v === 'hundredths' ? pick(R, [0.05, 0.15, -0.05, 0.25]) : 0);
    if (a === c || a === 0 || c === 0) return null;
    const b = int(R, -40, 40) / 10, d = Math.round(((a - c) * x + b) * 1000) / 1000;
    if (Math.abs(d) > 30 || Math.abs(d * 100 - Math.round(d * 100)) > 1e-9) return null;
    return eqOf(b ? [X(a), N(b)] : [X(a)], d ? [X(c), N(d)] : [X(c)], 'dec');
  }
  // s2-collect-integer (and the default): positive unequal coefficients <= 10, constants within ±30;
  // a third are small whole-number equations the two-pan balance can draw (the picture first)
  if (R() < 0.35) {
    const a = int(R, 1, 5), c = int(R, 1, 5); if (a === c) return null;
    const x = int(R, 1, 9), b = int(R, 0, 12), d = b + (a - c) * x; if (d < 0 || d > 18) return null;
    return eqOf(b ? [X(a), N(b)] : [X(a)], d ? [X(c), N(d)] : [X(c)]);
  }
  const a = int(R, 1, 10), c = int(R, 1, 10); if (a === c) return null;
  const b = int(R, -30, 30);
  let d: number;
  if (R() < 0.75) { const x = int(R, -6, 12); d = b + (a - c) * x; }
  else { if (Math.abs(a - c) < 2) return null; d = int(R, -30, 30); if ((d - b) % (a - c) === 0) return null; }
  if (Math.abs(d) > 30) return null;
  const L = R() < 0.2 && b ? [N(b), X(a)] : formSide(R, a, b, 'plain')!;
  const Rs = R() < 0.3 && d ? [N(d), X(c)] : formSide(R, c, d, 'plain')!;
  return eqOf(L, Rs);
}
export { Z };
