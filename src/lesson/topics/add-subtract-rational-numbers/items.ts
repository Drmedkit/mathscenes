// items.ts: exercise families for "add and subtract rational numbers" (grade 7, 7.NS.A.1). Every family is one deep
// structure; items vary the numbers (in the ranges of the sub-goal they practise, see plan.ts), the form (integers,
// fractions, mixed numbers, decimals) and the context. Every wrong answer the classifier recognises carries its id from
// math-curriculum-essentials/misconceptions.json (logged, never shown). Pure: no DOM, no canvas; seeded.
//
// Pictures: an item can carry a number line (start point, a jump, a flip) or a counter mat; the page draws it and,
// after a miss, replays the worked solution on it. Generators only make pictures the models can draw (lineFits /
// matFits).
import { type Q, rat, qAdd, qNum } from '../../../core/math';
import { type Item, type Response, type Verdict, type Gen, A, B, S, int, pick, shuffle } from '../../runtime/item';
import { niceRange, onTick } from './NumberLine';
import { matFits } from './CounterMat';
import { type Num, type Term, type Form, N, D, as, hx, tx, neg, abs, sgn, val, qSub, qNeg, qAbs, qSame, sumQ, exprTex, exprHtml, readQ, respond, decQ, places, isDec } from './num';

// ---------- item shape ----------
export type LinePic = { kind: 'line'; lo: number; hi: number; den: number; dec: boolean; p: number; q: number; op: '+' | '-'; mode: 'start' | 'jump' | 'none'; claim?: number };
export type GapPic = { kind: 'gap'; lo: number; hi: number; den: number; a: number; b: number };
export type PointPic = { kind: 'point'; lo: number; hi: number; den: number; v: number; tex: string };
export type MatPic = { kind: 'mat'; pos: number; neg: number; add?: number; take?: { sign: 1 | -1; n: number }; at: 'start' | 'added' | 'taken' | 'left' };
export type Pic = LinePic | GapPic | PointPic | MatPic;
export interface RItem extends Item { picture?: Record<string, unknown> & Pic }

export type FamilyId = 'signRole' | 'opposite' | 'mat' | 'inverse' | 'jumpAdd' | 'lineRead' | 'flipJump' | 'rewrite' | 'distChange'
  | 'mixedMeaning' | 'whatMeans' | 'addSame' | 'addOpp' | 'subInt' | 'matStep' | 'fracSigned' | 'fracSign' | 'mixedOps'
  | 'decSigned' | 'mixFormat' | 'regroup' | 'property' | 'lineCheck' | 'checkPick' | 'checkJudge' | 'story' | 'signMeaning';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  signRole: 'Which minus is it?', opposite: 'The opposite of', mat: 'Read the counter mat', inverse: 'Opposites make zero',
  jumpAdd: 'Add with a jump', lineRead: 'Read the jump', flipJump: 'Subtract with a flip', rewrite: 'Add the opposite',
  distChange: 'Change and distance', mixedMeaning: 'Negative mixed numbers', whatMeans: 'What does it describe?',
  addSame: 'Same signs', addOpp: 'Opposite signs', subInt: 'Subtract integers', matStep: 'Counters and the rule',
  fracSigned: 'Signed fractions', fracSign: 'Positive or negative?', mixedOps: 'Signed mixed numbers', decSigned: 'Signed decimals',
  mixFormat: 'Fractions and decimals', regroup: 'Reorder and regroup', property: 'Name the property', lineCheck: 'Test a claim',
  checkPick: 'Pick the check', checkJudge: 'Check by adding back', story: 'Real-world problem', signMeaning: 'What the sign means',
};

/** the misconceptions each item should recognise (tests) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

// ---------- shared checking ----------
interface Wrong { q: Q | null; mc?: string; say: string }
const BAD_NUM = 'Type a number, like -7 or 2.5 (use the minus key for a negative).';
const BAD_FRAC = 'Fill in the boxes with whole numbers. For a negative answer, type the minus sign in front (the bottom box cannot be 0).';
/** a typed-answer item: right value, the misconception answers (first match wins), a fallback message */
function typed(base: Omit<RItem, 'check' | 'answer' | 'input'>, input: 'num' | 'frac', right: Q, rightSay: string, wrongs: Wrong[], other: string): RItem {
  const ws: { q: Q; mc?: string; say: string }[] = [];
  for (const w of wrongs) if (w.q && !qSame(w.q, right) && !ws.some(x => qSame(x.q, w.q!)) && (input === 'frac' || isDec(w.q))) ws.push({ q: w.q, mc: w.mc, say: w.say });
  const it: RItem = {
    ...base, input, answer: respond(right, input),
    check(r: Response): Verdict {
      const v = readQ(r);
      if (!v) return { ok: false, say: r.kind === 'frac' ? BAD_FRAC : BAD_NUM };
      if (qSame(v, right)) return { ok: true, say: rightSay };
      for (const w of ws) if (qSame(v, w.q)) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: other };
    },
  };
  PROBES.set(it, ws.filter(w => w.mc).map(w => ({ r: respond(w.q, input), mc: w.mc! })));
  return it;
}
interface Opt { html: string; ok: boolean; mc?: string; say: string }
/** a choice item: options shuffled (or kept in order), exactly one right */
function choose(base: Omit<RItem, 'check' | 'answer' | 'input' | 'choices'>, R: () => number, opts: Opt[], keep = false): RItem {
  const os = keep ? opts : shuffle(R, [...opts]);
  const it: RItem = {
    ...base, input: 'choice', choices: os.map(o => o.html), answer: { kind: 'choice', i: os.findIndex(o => o.ok) },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !os[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const o = os[r.i]!;
      return { ok: o.ok, mc: o.ok ? undefined : o.mc, say: o.say };
    },
  };
  PROBES.set(it, os.map((o, i) => ({ o, i })).filter(x => !x.o.ok && x.o.mc).map(x => ({ r: { kind: 'choice', i: x.i } as Response, mc: x.o.mc! })));
  return it;
}

// ---------- number helpers ----------
const nz = (R: () => number, lo: number, hi: number) => { let v = 0; while (v === 0) v = int(R, lo, hi); return v; };
const signed = (R: () => number, lo: number, hi: number) => int(R, lo, hi) * (R() < 0.5 ? -1 : 1);
const T = (op: Term['op'], n: Num): Term => ({ op, n });
const q2n = (q: Q, form: Form) => as(q, form);
const H = (q: Q, form: Form = 'int') => hx(q2n(q, form));
const TX = (q: Q, form: Form = 'int') => tx(q2n(q, form));
const denOf = (...ns: Num[]) => { let d = 1; for (const n of ns) { const k = n.q.q; d = d * k / gcdN(d, k); } return d; };
function gcdN(a: number, b: number): number { while (b) [a, b] = [b, a % b]; return a; }
/** a number line picture when the model can draw it (ticks 1, 1/2, 1/4 or 1/10) */
function linePic(p: Num, q: Num, op: '+' | '-', mode: LinePic['mode'], claim?: Q): LinePic | undefined {
  const den = denOf(p, q);
  if (![1, 2, 4, 10].includes(den)) return undefined;
  const P = val(p), Qv = val(q), vals = op === '-' ? [P, P + Qv, P - Qv] : [P, P + Qv];
  if (claim) vals.push(qNum(claim));
  if (!vals.every(v => onTick(v, den))) return undefined;
  const r = niceRange(vals, den, den === 10 ? 3 : den === 4 ? 6 : 8);
  if (!r) return undefined;
  return { kind: 'line', ...r, den, dec: p.form === 'dec' || q.form === 'dec', p: P, q: Qv, op, mode, ...(claim ? { claim: qNum(claim) } : {}) };
}
const board = (ts: Term[], ask = true) => `${exprTex(ts)}${ask ? ' = \\,?' : ''}`;
const lineSolution = (p: Num, q: Num, op: '+' | '-', ans: Q, form: Form): string[] => op === '+'
  ? [`Start at ${A(hx(p))}.`, `Adding ${B(hx(q))} moves ${hx(abs(q))} to the ${sgn(q) > 0 ? 'right' : 'left'}${sgn(q) === 0 ? ' (no move at all)' : ''}.`, `You land on ${S(H(ans, form))}.`]
  : [`Start at ${A(hx(p))}.`, `Adding ${B(hx(q))} would move ${hx(abs(q))} to the ${sgn(q) > 0 ? 'right' : 'left'}; subtracting it flips the move: ${hx(abs(q))} to the ${sgn(q) > 0 ? 'left' : 'right'}.`,
    `${exprHtml([T(null, p), T('-', q)])} = ${exprHtml([T(null, p), T('+', neg(q))])} = ${S(H(ans, form))}.`];

// =====================================================================================================================
// 1. minus-sign-roles
// =====================================================================================================================
type Role = 'sub' | 'neg' | 'opp';
const ROLE_TEXT: Record<Role, string> = {
  sub: 'It subtracts: take away the number after it.',
  neg: 'It is part of a negative number.',
  opp: 'It means “the opposite of” the parentheses after it.',
};
const signRole: Gen = (R, n) => {
  const mag = (): Num => pick(R, [() => N(int(R, 1, 10)), () => N(int(R, 1, 9) * 2 + 1, 2), () => N(pick(R, [1, 3, 5, 7]), 4), () => D(int(R, 1, 99) / 10)])();
  const a = mag(), b = mag();
  // an expression as tokens; each minus sign has a role
  const shapes: { parts: (string | { role: Role })[]; html: (m: number) => string }[] = [
    { parts: [tx(a), ' ', { role: 'sub' }, ' ', tx(b)], html: () => '' },
    { parts: [{ role: 'neg' }, tx(a), ' + ', tx(b)], html: () => '' },
    { parts: [{ role: 'opp' }, '(', { role: 'neg' }, tx(a), ')'], html: () => '' },
    { parts: [{ role: 'neg' }, tx(a), ' ', { role: 'sub' }, ' (', { role: 'neg' }, tx(b), ')'], html: () => '' },
    { parts: [tx(a), ' ', { role: 'sub' }, ' ', { role: 'opp' }, '(', { role: 'neg' }, tx(b), ')'], html: () => '' },
    { parts: [{ role: 'opp' }, '(', tx(a), ' ', { role: 'sub' }, ' ', tx(b), ')'], html: () => '' },
  ];
  const sh = pick(R, shapes);
  const signs = sh.parts.map((x, i) => [x, i] as const).filter(([x]) => typeof x !== 'string');
  const [mk, at] = pick(R, signs) as readonly [{ role: Role }, number];
  const role = mk.role;
  const texOf = (mark: number | null, plainMinus = '-') => sh.parts.map((x, i) => {
    if (typeof x === 'string') return x;
    const m = x.role === 'sub' ? `\\mathbin{${i === mark ? '\\cssId{m}{-}' : plainMinus}}` : (i === mark ? '\\cssId{m}{-}' : '-');
    return m;
  }).join('');
  const htmlExpr = sh.parts.map((x, i) => (typeof x === 'string' ? x : i === at ? '<b class="pk mk">−</b>' : '−')).join('')
    .replace(/\\tfrac\{(\d+)\}\{(\d+)\}/g, (_, p, q) => `<span class="fr"><span>${p}</span><span>${q}</span></span>`);
  const opts: Opt[] = (['sub', 'neg', 'opp'] as Role[]).map(r => ({
    html: ROLE_TEXT[r], ok: r === role,
    mc: r === role ? undefined : r === 'sub' ? 'mc.integers.minus-sign-only-subtract' : r === 'neg' && role === 'opp' ? 'mc.integers.minus-sign-means-negative' : undefined,
    say: r === role ? `Yes. ${role === 'sub' ? 'It sits between two numbers, so it subtracts.' : role === 'neg' ? 'It is stuck to the number in front, so it is part of that number.' : 'It stands in front of parentheses: take the opposite of what is inside.'}`
      : role === 'sub' ? 'This one sits BETWEEN two numbers, so it subtracts.' : role === 'neg' ? 'This one is stuck to the number right after it: it makes that number negative.' : 'This one stands in front of parentheses: it means the opposite of what is inside.',
  }));
  return choose({
    id: `signRole-${n}`, family: 'signRole', prompt: `Look at the <b class="pk">marked</b> minus sign in ${htmlExpr}. What does it do?`,
    board: texOf(at), picture: undefined,
    solution: ['A minus BETWEEN two numbers subtracts.', 'A minus stuck to a number is part of that negative number.', 'A minus in front of parentheses means “the opposite of”.'],
  }, R, opts, true);
};

const opposite: Gen = (R, n) => {
  const a: Num = pick(R, [() => N(int(R, 1, 10)), () => D(int(R, 1, 49) / 10), () => N(int(R, 1, 9) * 2 + 1, 2, 'frac')])();
  const kind = pick(R, ['oppNeg', 'oppNeg', 'oppPos', 'triple', 'xNeg'] as const);
  let tex: string, html: string, right: Q, wrong: Q | null;
  if (kind === 'oppNeg') { tex = `-(${tx(neg(a))})`; html = `−(${hx(neg(a))})`; right = a.q; wrong = neg(a).q; }
  else if (kind === 'oppPos') { tex = `-(${tx(a)})`; html = `−(${hx(a)})`; right = neg(a).q; wrong = a.q; }
  else if (kind === 'triple') { tex = `-(-(${tx(neg(a))}))`; html = `−(−(${hx(neg(a))}))`; right = neg(a).q; wrong = a.q; }
  else { tex = `x = ${tx(neg(a))},\\quad -x = \\,?`; html = `<i>x</i> = ${hx(neg(a))}. What is −<i>x</i>`; right = a.q; wrong = neg(a).q; }
  const frac = a.form === 'frac';
  const prompt = kind === 'xNeg' ? `${html}?` : `What is ${html}?`;
  return typed({
    id: `opposite-${n}`, family: 'opposite', prompt, board: kind === 'xNeg' ? tex : `${tex} = \\,?`,
    solution: kind === 'triple' ? ['Work from the inside out.', `−(${hx(neg(a))}) = ${hx(a)}, and the opposite of that is ${S(hx(neg(a)))}.`]
      : [`The minus in front of the parentheses means “the opposite of”.`, `The opposite of ${hx(kind === 'oppPos' ? a : neg(a))} is ${S(H(right, a.form))}: same distance from 0, other side.`],
  }, frac ? 'frac' : 'num', right, `Yes: ${S(H(right, a.form))}. The opposite is the same distance from 0 on the other side.`,
  [{ q: wrong, mc: kind === 'oppPos' || kind === 'triple' ? undefined : 'mc.integers.minus-sign-means-negative', say: `A minus sign does not always make a number negative. The opposite of a negative number is positive: ${S(H(right, a.form))}.` }],
  `The opposite is the same distance from 0 on the other side: ${S(H(right, a.form))}.`);
};

// =====================================================================================================================
// 2. zero-pairs (+ model-to-algorithm uses the mat too)
// =====================================================================================================================
const mat: Gen = (R, n, sg) => {
  if (sg === 'model-to-algorithm-add-sub' && R() < 0.5) {
    // a subtraction where the mat lacks the counters to take away: 2 - 5, 3 - (-5), -4 - (-6)
    for (;;) {
      const kind = pick(R, ['posMinusBig', 'minusNeg', 'negMinusNeg'] as const);
      let p: number, q: number;
      if (kind === 'posMinusBig') { p = int(R, 0, 6); q = int(R, p + 1, 12); }
      else if (kind === 'minusNeg') { p = int(R, 1, 8); q = -int(R, 1, 8); }
      else { p = -int(R, 1, 8); q = -int(R, -p + 1, 12); }
      const pos = Math.max(0, p), negs = Math.max(0, -p);
      const have = q > 0 ? pos : negs, add = Math.abs(q) - have;
      const pic: MatPic = { kind: 'mat', pos, neg: negs, add, take: { sign: q > 0 ? 1 : -1, n: Math.abs(q) }, at: 'added' };
      if (!matFits(pic)) continue;
      const P = N(p), Qn = N(q), right = rat(p - q), ts = [T(null, P), T('-', Qn)];
      const lt = q > 0 ? 'light' : 'dark';
      return typed({
        id: `mat-${n}`, family: 'mat', picture: pic,
        prompt: `The mat shows ${A(String(p).replace('-', '−'))}. To take away ${B(`${Math.abs(q)} ${lt}`)} counters, ${add} zero pair${add === 1 ? ' was' : 's were'} added first. What is ${exprHtml(ts)}?`,
        board: board(ts),
        solution: [`Adding ${add} zero pair${add === 1 ? '' : 's'} does not change the value: the mat still shows ${p}.`, `Take away ${Math.abs(q)} ${lt} counters, then remove the zero pairs.`, `What is left: ${S(H(right))}. So ${exprHtml(ts)} = ${exprHtml([T(null, P), T('+', neg(Qn))])} = ${S(H(right))}.`],
      }, 'num', right, `Yes: ${exprHtml(ts)} = ${S(H(right))}.`, [
        { q: q < 0 ? rat(p + q) : null, mc: 'mc.integers.subtract-negative-as-positive', say: `Taking away dark counters (−1s) makes the mat go UP. ${exprHtml(ts)} = ${p} + ${-q} = ${S(H(right))}.` },
      ], `Count what is left after taking away and removing zero pairs: ${S(H(right))}.`);
    }
  }
  const big = sg === 'model-to-algorithm-add-sub' ? 12 : 8;
  let pos: number, ng: number;
  do {
    pos = int(R, 0, big); ng = R() < (sg === 'zero-pairs' ? 0.45 : 0.15) ? pos : int(R, 0, big);
  } while (pos + ng < 2 || !matFits({ pos, neg: ng }));
  const right = rat(pos - ng);
  const ts = [T(null, N(pos)), T('+', N(-ng))];
  return typed({
    id: `mat-${n}`, family: 'mat', picture: { kind: 'mat', pos, neg: ng, at: 'start' },
    prompt: `Each light counter is ${A('+1')}, each dark counter is ${B('−1')}. What number does the mat show?`,
    board: `${tx(N(pos))} + ${tx(N(-ng), true)} = \\,?`,
    solution: [`Pair each light counter with a dark one: each zero pair is worth 0.`, `Remove the ${Math.min(pos, ng)} zero pair${Math.min(pos, ng) === 1 ? '' : 's'}.`, `What is left: ${S(H(right))}${pos === ng ? ' (nothing is left)' : ''}. So ${exprHtml(ts)} = ${S(H(right))}.`],
  }, 'num', right, `Yes: ${S(H(right))}. ${pos === ng ? 'Every counter has a partner, so it all cancels.' : 'The zero pairs cancel, the rest is the value.'}`, [
    { q: rat(pos + ng), mc: 'mc.integers.zero-pair-not-zero', say: `That counts every counter as +1. A dark counter is −1, and a light with a dark is 0. The mat shows ${S(H(right))}.` },
    { q: rat(-(pos + ng)), mc: 'mc.integers.adds-magnitudes-with-unfixed-sign', say: `Light and dark cancel in pairs; they do not add up. The mat shows ${S(H(right))}.` },
  ], `Pair light with dark and remove the pairs: ${S(H(right))} is left.`);
};

const inverse: Gen = (R, n) => {
  const p: Num = pick(R, [() => D(int(R, 1, 9) + 0.5), () => N(pick(R, [1, 3]), 4), () => N(int(R, 1, 4) * 2 + 1, 2, 'mixed'), () => N(int(R, 2, 9)), () => D(int(R, 1, 9) / 10 + int(R, 0, 2))])();
  const same = R() < 0.4;
  const first = R() < 0.5 ? p : neg(p);
  const ts = same ? [T(null, neg(p)), T('+', neg(p))] : [T(null, first), T('+', neg(first))];
  const right = sumQ(ts), two = rat(2 * p.q.p, p.q.q);
  const form = p.form;
  const opts: Opt[] = [
    { html: H(rat(0), form), ok: !same, mc: undefined, say: same ? `Both numbers are negative, so nothing cancels: two moves left. ${exprHtml(ts)} = ${S(H(right, form))}.` : `Yes: a number and its opposite make 0. The two moves cancel.` },
    { html: H(two, form), ok: false, mc: same ? 'mc.integers.two-negatives-positive-in-addition' : 'mc.integers.adds-magnitudes-with-unfixed-sign', say: same ? `“Two negatives make a positive” is a rule for multiplying. Adding two negatives goes further left: ${S(H(right, form))}.` : `The two numbers point opposite ways, so they cancel: ${S('0')}.` },
    { html: H(qNeg(two), form), ok: same, mc: same ? undefined : 'mc.integers.adds-magnitudes-with-unfixed-sign', say: same ? `Yes: two moves to the left, ${H(two, form)} in all, so ${S(H(right, form))}.` : `${hx(p)} and ${hx(neg(p))} are opposites: together they make ${S('0')}.` },
  ];
  const pic = linePic(ts[0]!.n, ts[1]!.n, '+', 'start');
  return choose({
    id: `inverse-${n}`, family: 'inverse', prompt: `What is ${exprHtml(ts)}?`, board: board(ts), picture: pic,
    solution: same ? [`Both moves go left: ${hx(abs(p))} and then ${hx(abs(p))} more.`, `${exprHtml(ts)} = ${S(H(right, form))}.`] : [`${hx(first)} and ${hx(neg(first))} are opposites: the same distance from 0 on both sides.`, `The second move brings you straight back to 0: ${exprHtml(ts)} = ${S('0')}.`],
  }, R, opts);
};

// =====================================================================================================================
// 3. directed-addition
// =====================================================================================================================
function addCase(R: () => number, lim: number, step: number): [number, number] {
  const c = pick(R, ['pp', 'nn', 'oppBig', 'cross', 'zero', 'add0', 'cross', 'nn'] as const);
  const m = (lo: number, hi: number) => int(R, Math.ceil(lo / step), Math.floor(hi / step)) * step;
  const L = lim;
  switch (c) {
    case 'pp': { const a = m(step, L / 2), b = m(step, L / 2); return [a, b]; }
    case 'nn': { const a = m(step, L / 2), b = m(step, L / 2); return [-a, -b]; }
    case 'oppBig': { const a = m(2 * step, L), b = m(step, a - step); return R() < 0.5 ? [a, -b] : [-a, b]; }
    case 'cross': { const a = m(step, L / 2), b = m(a + step, L); return R() < 0.5 ? [a, -b] : [-a, b]; }
    case 'zero': { const a = m(step, L); return R() < 0.5 ? [a, -a] : [-a, a]; }
    default: { const a = m(step, L); return [R() < 0.5 ? a : -a, 0]; }
  }
}
const scaled = (R: () => number): { form: Form; den: number; lim: number } => pick(R, [{ form: 'frac' as Form, den: 2, lim: 5 }, { form: 'frac' as Form, den: 4, lim: 3 }, { form: 'dec' as Form, den: 10, lim: 2 }]);
const mkNum = (x: number, form: Form, den: number): Num => (form === 'dec' ? D(x) : N(Math.round(x * den), den, form));

const jumpAdd: Gen = (R, n) => {
  for (;;) {
    const fracs = R() < 0.4, sc = fracs ? scaled(R) : { form: 'int' as Form, den: 1, lim: 20 };
    const [a, b] = addCase(R, sc.lim, 1 / sc.den);
    const p = mkNum(a, sc.form, sc.den), q = mkNum(b, sc.form, sc.den);
    if (sgn(p) === 0) continue;
    const pic = linePic(p, q, '+', 'start');
    if (!pic) continue;
    const ts = [T(null, p), T('+', q)], right = sumQ(ts), form = sc.form === 'dec' ? 'dec' : sc.form === 'int' ? 'int' : 'frac';
    const input = form === 'frac' && right.q !== 1 ? 'frac' : 'num';
    if (input === 'num' && !isDec(right)) continue;
    const wrongs: Wrong[] = [
      { q: sgn(q) < 0 ? qAdd(p.q, qAbs(q.q)) : null, mc: 'mc.integers.jump-direction-single-cue', say: `Adding a NEGATIVE number moves left. From ${A(hx(p))}, ${hx(abs(q))} to the left is ${S(H(right, form))}.` },
      { q: sgn(q) !== 0 ? qAdd(p.q, sgn(p) > 0 ? qAbs(q.q) : qNeg(qAbs(q.q))) : null, mc: 'mc.integers.addition-direction-from-first-addend', say: `The direction comes from the number you ADD (${B(hx(q))}), not from where you start. You land on ${S(H(right, form))}.` },
      { q: sgn(q) !== 0 ? q.q : null, mc: 'mc.integers.jump-not-from-first-number', say: `The jump starts at ${A(hx(p))}, not at 0. From there you land on ${S(H(right, form))}.` },
    ];
    return typed({
      id: `jumpAdd-${n}`, family: 'jumpAdd', picture: pic,
      prompt: `Start at ${A(hx(p))} and add ${B(hx(q))}. Where do you land?`, board: board(ts),
      solution: lineSolution(p, q, '+', right, form),
    }, input, right, `Yes: ${exprHtml(ts)} = ${S(H(right, form))}.`, wrongs, `Start at ${hx(p)} and move ${hx(abs(q))} ${sgn(q) > 0 ? 'right' : 'left'}: ${S(H(right, form))}.`);
  }
};

const lineRead: Gen = (R, n) => {
  for (;;) {
    const [a, b] = addCase(R, 9, 1);
    if (a === 0 || b === 0) continue;
    const p = N(a), q = N(b);
    const pic = linePic(p, q, '+', 'jump');
    if (!pic) continue;
    const ts = [T(null, p), T('+', q)];
    const opts: Opt[] = [
      { html: exprHtml(ts), ok: true, say: `Yes: it starts at ${A(hx(p))} and moves ${hx(abs(q))} ${b > 0 ? 'right' : 'left'}, which is adding ${B(hx(q))}.` },
      { html: exprHtml([T(null, p), T('+', neg(q))]), ok: false, mc: 'mc.integers.jump-direction-single-cue', say: `Look at the arrow's direction: it points ${b > 0 ? 'right, so the number added is positive' : 'left, so the number added is negative'}: ${exprHtml(ts)}.` },
      { html: exprHtml([T(null, N(0)), T('+', q)]), ok: false, mc: 'mc.integers.jump-not-from-first-number', say: `The arrow starts at ${A(hx(p))}, not at 0: ${exprHtml(ts)}.` },
    ];
    return choose({
      id: `lineRead-${n}`, family: 'lineRead', picture: pic, prompt: 'Which sum does the number line show?', board: '? + ? = \\,?',
      solution: [`The arrow starts at ${A(hx(p))}: that is the first number.`, `It moves ${hx(abs(q))} to the ${b > 0 ? 'right' : 'left'}: that is adding ${B(hx(q))}.`, `So it shows ${exprHtml(ts)} = ${S(H(sumQ(ts)))}.`],
    }, R, opts);
  }
};

// =====================================================================================================================
// 4. subtract-as-add-opposite
// =====================================================================================================================
function subCase(R: () => number, lim: number, step: number): [number, number] {
  const c = pick(R, ['posMinusBig', 'negMinusPos', 'posMinusNeg', 'negMinusNegA', 'negMinusNegB', 'minus0'] as const);
  const m = (lo: number, hi: number) => int(R, Math.ceil(lo / step), Math.floor(hi / step)) * step;
  const L = lim;
  switch (c) {
    case 'posMinusBig': { const a = m(step, L / 2), b = m(a + step, L); return [a, b]; }
    case 'negMinusPos': { const a = m(step, L / 2), b = m(step, L / 2); return [-a, b]; }
    case 'posMinusNeg': { const a = m(step, L / 2), b = m(step, L / 2); return [a, -b]; }
    case 'negMinusNegA': { const a = m(step, L / 2), b = m(a + step, L); return [-a, -b]; }
    case 'negMinusNegB': { const b = m(step, L / 2), a = m(b + step, L); return [-a, -b]; }
    default: { const a = m(step, L); return [R() < 0.5 ? a : -a, 0]; }
  }
}
const flipJump: Gen = (R, n) => {
  for (;;) {
    const fracs = R() < 0.35, sc = fracs ? pick(R, [{ form: 'frac' as Form, den: 2, lim: 5 }, { form: 'frac' as Form, den: 4, lim: 3 }]) : { form: 'int' as Form, den: 1, lim: 12 };
    const [a, b] = subCase(R, sc.lim, 1 / sc.den);
    const p = mkNum(a, sc.form, sc.den), q = mkNum(b, sc.form, sc.den);
    const pic = linePic(p, q, '-', 'start');
    if (!pic) continue;
    const ts = [T(null, p), T('-', q)], right = sumQ(ts), form = sc.form;
    const input = form === 'frac' && right.q !== 1 ? 'frac' : 'num';
    const wrongs: Wrong[] = [
      { q: sgn(q) < 0 ? qAdd(p.q, q.q) : null, mc: 'mc.integers.jump-direction-single-cue', say: `Subtracting does not always move left. Taking away ${B(hx(q))} flips its move: ${hx(abs(q))} to the RIGHT. ${S(H(right, form))}.` },
      { q: sgn(p) !== 0 && sgn(q) !== 0 ? qAdd(qNeg(p.q), q.q) : null, mc: 'mc.integers.subtract-changes-both-signs', say: `Only the number you take away changes sign; ${A(hx(p))} stays as it is: ${exprHtml([T(null, p), T('+', neg(q))])} = ${S(H(right, form))}.` },
    ];
    return typed({
      id: `flipJump-${n}`, family: 'flipJump', picture: pic,
      prompt: `Start at ${A(hx(p))} and take away ${B(hx(q))}. Where do you land?`, board: board(ts),
      solution: lineSolution(p, q, '-', right, form),
    }, input, right, `Yes: ${exprHtml(ts)} = ${exprHtml([T(null, p), T('+', neg(q))])} = ${S(H(right, form))}.`, wrongs,
    `Subtracting ${hx(q)} is adding ${hx(neg(q))}: ${S(H(right, form))}.`);
  }
};

const rewrite: Gen = (R, n) => {
  for (;;) {
    const fracs = R() < 0.3;
    const [a, b] = subCase(R, fracs ? 4 : 12, fracs ? 0.5 : 1);
    if (a === 0 || b === 0) continue;
    const form: Form = fracs ? 'frac' : 'int';
    const p = mkNum(a, form, fracs ? 2 : 1), q = mkNum(b, form, fracs ? 2 : 1);
    const ts = [T(null, p), T('-', q)];
    const right = [T(null, p), T('+', neg(q))], keep = [T(null, p), T('+', q)], both = [T(null, neg(p)), T('+', q)];
    const opts: Opt[] = [
      { html: exprHtml(right), ok: true, say: `Yes: subtracting ${B(hx(q))} is adding its opposite, ${B(hx(neg(q)))}.` },
      { html: exprHtml(keep), ok: false, mc: sgn(q) < 0 ? 'mc.integers.subtract-negative-as-positive' : undefined, say: `That adds ${hx(q)} itself. Subtracting flips it: add the OPPOSITE, ${B(hx(neg(q)))}.` },
      { html: exprHtml(both), ok: false, mc: 'mc.integers.subtract-changes-both-signs', say: `Only the number taken away flips. ${A(hx(p))} stays: ${exprHtml(right)}.` },
    ];
    return choose({
      id: `rewrite-${n}`, family: 'rewrite', prompt: `Which addition has the same value as ${exprHtml(ts)}?`, board: `${exprTex(ts)} = \\,? + \\,?`,
      picture: linePic(p, q, '-', 'none'),
      solution: [`Subtracting a number is adding its opposite: <i>p</i> − <i>q</i> = <i>p</i> + (−<i>q</i>).`, `The opposite of ${hx(q)} is ${hx(neg(q))}.`, `${exprHtml(ts)} = ${S(exprHtml(right))} = ${H(sumQ(ts), form)}.`],
    }, R, opts);
  }
};

// =====================================================================================================================
// 5. distance-abs-difference
// =====================================================================================================================
const distChange: Gen = (R, n) => {
  const ctx = pick(R, ['temp', 'temp', 'money', 'elev'] as const);
  let a: number, b: number, unit: string, lead: string, prompt: string;
  const opposite = R() < 0.55;
  if (ctx === 'elev' && R() < 0.4) {
    const pr = pick(R, [[-282, 14505, 'Badwater Basin in Death Valley', 'the top of Mount Whitney'], [-282, 20310, 'Badwater Basin in Death Valley', 'the top of Denali'], [-8, 6288, 'a street in New Orleans', 'the top of Mount Washington']] as const);
    [a, b] = R() < 0.5 ? [pr[0], pr[1]] : [pr[1], pr[0]];
    const [na, nb] = a === pr[0] ? [pr[2], pr[3]] : [pr[3], pr[2]];
    unit = 'ft'; lead = `A trip goes from ${na} (${A(fmtInt(a) + ' ft')}) to ${nb} (${B(fmtInt(b) + ' ft')}).`;
    prompt = `${lead} What is the change in elevation, and what is the distance between the two heights?`;
  } else {
    const lim = ctx === 'money' ? 60 : 20;
    if (ctx === 'elev') { do { a = -int(R, 2, 20); b = -int(R, 2, 20); } while (a === b); }
    else if (opposite) { a = nz(R, 1, lim); b = -nz(R, 1, lim); if (R() < 0.5) [a, b] = [b, a]; }
    else { const s = R() < 0.6 ? -1 : 1; do { a = s * int(R, 1, lim); b = s * int(R, 1, lim); } while (a === b); }
    if (ctx === 'temp') { unit = '°F'; prompt = `At 6 a.m. it was ${A(fmtInt(a) + ' °F')}. At 3 p.m. it was ${B(fmtInt(b) + ' °F')}. What was the change in temperature, and how many degrees apart are the two readings?`; }
    else if (ctx === 'money') { unit = '$'; prompt = `An account balance went from ${A(money(a))} to ${B(money(b))}. What was the change in dollars, and how far apart are the two balances?`; }
    else { unit = 'ft'; prompt = `A diver's depth gauge read ${A(fmtInt(a) + ' ft')}, then ${B(fmtInt(b) + ' ft')} (sea level is 0). What was the change, and how far apart are the two readings?`; }
  }
  const change = b - a, dist = Math.abs(change);
  const pic: GapPic | undefined = Math.max(Math.abs(a), Math.abs(b)) <= 20 ? (() => { const r = niceRange([a, b], 1, 8); return r ? { kind: 'gap' as const, ...r, den: 1, a, b } : undefined; })() : undefined;
  const u = unit === '$' ? ' dollars' : ` ${unit}`;
  const it: RItem = {
    id: `distChange-${n}`, family: 'distChange', prompt, board: '\\text{change} = \\,? \\qquad \\text{distance} = \\,?',
    input: 'pair', pairLead: 'change', pairOp: 'distance', picture: pic,
    solution: [`Change = final − first = ${fmtInt(b)} − ${a < 0 ? `(${fmtInt(a)})` : fmtInt(a)} = ${S(fmtInt(change))}${u}${change < 0 ? ' (it went DOWN)' : ' (it went up)'}.`,
      `Distance = |${fmtInt(change)}| = ${S(fmtInt(dist))}${u}. A distance is never negative.`],
    answer: { kind: 'pair', x: change, y: dist },
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Fill in both boxes with a number (a change can be negative).' };
      const okX = r.x === change, okY = r.y === dist;
      if (okX && okY) return { ok: true, say: `Yes: the change is ${S(fmtInt(change))}${u} and the distance is ${S(fmtInt(dist))}${u}. Same size, but only the change has a direction.` };
      if (r.y < 0) return { ok: false, mc: 'mc.integers.distance-reported-negative', say: `A distance is how far apart, so it is never negative: ${S(fmtInt(dist))}${u}. Only the change carries a sign${change < 0 ? `: here it is ${fmtInt(change)}` : ''}.` };
      if (!okX && change < 0 && r.x === dist) return { ok: false, mc: 'mc.integers.records-negative-quantity-unsigned', say: `It went DOWN, so the change is negative: ${S(fmtInt(change))}${u}. The size alone, ${dist}, is the distance.` };
      if (!okY && Math.sign(a) !== Math.sign(b) && r.y === Math.abs(Math.abs(a) - Math.abs(b))) return { ok: false, mc: 'mc.integers.gap-across-zero-subtracts-magnitudes', say: `The two readings are on opposite sides of 0, so the gap goes THROUGH 0: ${Math.abs(a)} + ${Math.abs(b)} = ${S(fmtInt(dist))}${u}.` };
      if (!okX && r.x === -change) return { ok: false, say: `Change is final minus first: ${fmtInt(b)} − ${a < 0 ? `(${fmtInt(a)})` : fmtInt(a)} = ${S(fmtInt(change))}.` };
      return { ok: false, say: `Change = final − first = ${S(fmtInt(change))}${u}; distance = its size, ${S(fmtInt(dist))}${u}.` };
    },
  };
  const probes: { r: Response; mc: string }[] = [{ r: { kind: 'pair', x: change, y: -dist }, mc: 'mc.integers.distance-reported-negative' }];
  if (change < 0) probes.push({ r: { kind: 'pair', x: dist, y: dist }, mc: 'mc.integers.records-negative-quantity-unsigned' });
  const gap = Math.abs(Math.abs(a) - Math.abs(b));
  if (Math.sign(a) !== Math.sign(b) && gap !== dist) probes.push({ r: { kind: 'pair', x: change, y: gap }, mc: 'mc.integers.gap-across-zero-subtracts-magnitudes' });
  PROBES.set(it, probes);
  return it;
};
function fmtInt(x: number): string { return (x < 0 ? '−' : '') + Math.abs(x).toLocaleString('en-US'); }
function fmtTexInt(x: number, paren = false): string { const s = (x < 0 ? '-' : '') + Math.abs(x).toLocaleString('en-US').replace(/,/g, '{,}'); return x < 0 && paren ? `(${s})` : s; }
function money(x: number, dp = 0): string { return (x < 0 ? '−' : '') + '$' + Math.abs(x).toFixed(dp); }

// =====================================================================================================================
// 6. negative-mixed-number-meaning
// =====================================================================================================================
const mixedMeaning: Gen = (R, n) => {
  const d = pick(R, [2, 3, 4, 5, 8, 10]), w = int(R, 1, 9);
  let k = int(R, 1, d - 1); while (gcdN(k, d) !== 1) k = int(R, 1, d - 1);
  const x = N(-(w * d + k), d, 'mixed');
  const split = rat(-w * d + k, d);
  const kind = pick(R, ['improper', 'between', 'expand'] as const);
  const xh = hx(x);
  if (kind === 'improper') {
    const opts: Opt[] = [
      { html: `−${fr2(w * d + k, d)}`, ok: true, say: `Yes: ${xh} = −(${w} + ${fr2(k, d)}) = −${fr2(w * d + k, d)}. The minus sign belongs to the whole number.` },
      { html: `−${fr2(w * d - k, d)}`, ok: false, mc: 'mc.integers.negative-mixed-number-split', say: `That is −${w} + ${fr2(k, d)}. But ${xh} means −(${w} + ${fr2(k, d)}): the minus covers the fraction part too, so −${fr2(w * d + k, d)}.` },
      { html: fr2(w * d + k, d), ok: false, say: `The number is negative, so the improper fraction is too: −${fr2(w * d + k, d)}.` },
    ];
    return choose({ id: `mixedMeaning-${n}`, family: 'mixedMeaning', prompt: `Which improper fraction equals ${xh}?`, board: `${tx(x)} = \\,?`,
      solution: [`${xh} is the opposite of ${hx(abs(x))}: −(${w} + ${fr2(k, d)}).`, `${w} + ${fr2(k, d)} = ${fr2(w * d + k, d)}, so ${xh} = ${S('−' + fr2(w * d + k, d))}.`] }, R, opts);
  }
  if (kind === 'between') {
    const pair = (lo: number, hi: number) => `${fmtInt(lo)} and ${fmtInt(hi)}`;
    const opts: Opt[] = [
      { html: pair(-w - 1, -w), ok: true, say: `Yes: ${xh} is ${fr2(k, d)} past ${fmtInt(-w)}, further from 0, so it lies between ${pair(-w - 1, -w)}.` },
      { html: pair(-w, -w + 1), ok: false, mc: 'mc.integers.negative-mixed-number-split', say: `That treats it as −${w} + ${fr2(k, d)}. ${xh} = −(${w} + ${fr2(k, d)}) is further from 0 than ${fmtInt(-w)}: between ${pair(-w - 1, -w)}.` },
      { html: pair(w, w + 1), ok: false, say: `It is negative, so it is left of 0: between ${pair(-w - 1, -w)}.` },
    ];
    const lo = -w - 2, hi = -w + 1;
    const pic: PointPic | undefined = (hi - lo) * d <= 44 ? { kind: 'point', lo, hi, den: d, v: qNum(x.q), tex: tx(x) } : undefined;
    return choose({ id: `mixedMeaning-${n}`, family: 'mixedMeaning', prompt: `Between which two integers is ${xh}?`, board: `${tx(x)}`, picture: pic,
      solution: [`${xh} = −(${w} + ${fr2(k, d)}): start at 0, go ${w} to the left, then ${fr2(k, d)} MORE to the left.`, `That lands between ${S(pair(-w - 1, -w))}.`] }, R, opts);
  }
  const opts: Opt[] = [
    { html: `−(${w} + ${fr2(k, d)})`, ok: true, say: `Yes: the minus sign is the opposite of the whole mixed number ${w}&#8202;${fr2(k, d)}.` },
    { html: `−${w} + ${fr2(k, d)}`, ok: false, mc: 'mc.integers.negative-mixed-number-split', say: `That makes only the ${w} negative. ${xh} is the opposite of all of ${w}&#8202;${fr2(k, d)}: −(${w} + ${fr2(k, d)}).` },
    { html: `${w} − ${fr2(k, d)}`, ok: false, say: `That is positive. ${xh} is the opposite of ${w}&#8202;${fr2(k, d)}: −(${w} + ${fr2(k, d)}).` },
  ];
  void split;
  return choose({ id: `mixedMeaning-${n}`, family: 'mixedMeaning', prompt: `What does ${xh} mean?`, board: tx(x),
    solution: [`A mixed number is a sum: ${w}&#8202;${fr2(k, d)} = ${w} + ${fr2(k, d)}.`, `The minus in front makes the opposite of the WHOLE thing: ${S(`−(${w} + ${fr2(k, d)})`)}.`] }, R, opts);
};
const fr2 = (p: number, q: number) => `<span class="fr"><span>${p}</span><span>${q}</span></span>`;

// =====================================================================================================================
// 7. context-meaning-add-sub
// =====================================================================================================================
const art = (y: number) => (String(y)[0] === '8' || y === 11 || y === 18 ? 'an' : 'a');
const whatMeans: Gen = (R, n) => {
  const ctx = pick(R, ['money', 'money', 'temp', 'elev'] as const);
  const op: '+' | '-' = ctx === 'money' ? (R() < 0.5 ? '+' : '-') : ctx === 'temp' ? (R() < 0.6 ? '+' : '-') : '+';
  const p = signed(R, 2, 40) || 5, q = nz(R, 2, 30) * (R() < 0.5 ? -1 : 1);
  const ts = [T(null, N(p)), T(op, N(q))];
  let conv: string, right: string, flipOp: string, flipStart: string;
  if (ctx === 'money') {
    conv = 'Money you have is positive; money you owe is negative.';
    const st = (x: number) => (x >= 0 ? `You have $${x}` : `You owe $${-x}`);
    const act = (o: '+' | '-', y: number) => (o === '+' ? (y > 0 ? `you are paid $${y}` : `you are charged ${art(-y)} $${-y} fee`) : (y > 0 ? `you spend $${y}` : `${art(-y) === 'an' ? 'an' : 'a'} $${-y} debt is canceled`));
    right = `${st(p)}, and ${act(op, q)}.`;
    flipOp = `${st(p)}, and ${act(op, -q)}.`;
    flipStart = `${st(-p)}, and ${act(op, q)}.`;
  } else if (ctx === 'temp') {
    conv = 'Degrees above 0 °F are positive; below 0 °F are negative.';
    const st = (x: number) => (x >= 0 ? `It is ${x} °F` : `It is ${-x} °F below zero`);
    if (op === '+') {
      const act = (y: number) => (y > 0 ? `it warms up ${y} °F` : `it cools down ${-y} °F`);
      right = `${st(p)}, and ${act(q)}.`; flipOp = `${st(p)}, and ${act(-q)}.`; flipStart = `${st(-p)}, and ${act(q)}.`;
    } else {
      const f = (x: number) => `${x < 0 ? '−' : ''}${Math.abs(x)} °F`;
      right = `The change in temperature from ${f(q)} to ${f(p)}.`;
      flipOp = `The change in temperature from ${f(p)} to ${f(q)}.`;
      flipStart = `The change in temperature from ${f(q)} to ${f(-p)}.`;
    }
  } else {
    conv = 'Heights above sea level are positive; depths below sea level are negative.';
    const st = (x: number) => (x >= 0 ? `A drone is ${x} ft above sea level` : `A diver is ${-x} ft below sea level`);
    const act = (y: number) => (y > 0 ? `rises ${y} ft` : `goes down ${-y} ft`);
    right = `${st(p)} and ${act(q)}.`; flipOp = `${st(p)} and ${act(-q)}.`; flipStart = `${st(-p)} and ${act(q)}.`;
  }
  const opts: Opt[] = [
    { html: right, ok: true, say: `Yes. Each sign matches the rule: ${conv.toLowerCase()}` },
    { html: flipOp, ok: false, mc: 'mc.integers.sign-meaning-in-context', say: `Look at the second number and the sign in front of it: ${exprHtml(ts)}. The matching story is: ${right}` },
    { html: flipStart, ok: false, mc: 'mc.integers.inconsistent-sign-convention', say: `The first number is ${p < 0 ? 'negative' : 'positive'}, so it must use the same rule: ${conv.toLowerCase()} The matching story is: ${right}` },
  ];
  if (new Set(opts.map(o => o.html)).size < 3) return whatMeans(R, n);
  return choose({ id: `whatMeans-${n}`, family: 'whatMeans', prompt: `${conv} Which situation does ${exprHtml(ts)} describe?`, board: exprTex(ts),
    solution: [conv, `${exprHtml(ts)}: ${right}`, `Result: ${H(sumQ(ts))}.`] }, R, opts);
};

// =====================================================================================================================
// 8-10. integers without a model
// =====================================================================================================================
const addSame: Gen = (R, n) => {
  const kind = pick(R, ['two', 'two', 'three', 'zero'] as const), s = R() < 0.65 ? -1 : 1;
  const ms = kind === 'three' ? [int(R, 1, 30), int(R, 1, 30), int(R, 1, 30)] : kind === 'zero' ? [int(R, 1, 50), 0] : [int(R, 1, 50), int(R, 1, 50)];
  if (kind === 'zero' && R() < 0.5) ms.reverse();
  const ts = ms.map((m, i) => T(i ? '+' : null, N(s * m)));
  const right = sumQ(ts), tot = ms.reduce((a, b) => a + b, 0);
  return typed({ id: `addSame-${n}`, family: 'addSame', prompt: 'Add, without a number line.', board: board(ts),
    solution: [`All the numbers have the same sign${kind === 'zero' ? ' (adding 0 changes nothing)' : ''}.`, `Add the sizes: ${ms.filter(Boolean).join(' + ')} = ${tot}.`, `Keep the common sign: ${S(H(right))}.`],
  }, 'num', right, `Yes: ${S(H(right))}. Same signs: add the sizes, keep the sign.`, [
    { q: s < 0 ? rat(tot) : null, mc: 'mc.integers.two-negatives-positive-in-addition', say: `“Two negatives make a positive” is a multiplying rule. Adding negatives moves further left: ${S(H(right))}.` },
  ], `Same signs: add the sizes (${tot}) and keep the sign: ${S(H(right))}.`);
};
const addOpp: Gen = (R, n) => {
  let a: number, b: number;
  const kind = pick(R, ['posBig', 'negBig', 'equal', 'posBig', 'negBig'] as const);
  do { const x = int(R, 1, 50), y = int(R, 1, 50); [a, b] = kind === 'equal' ? [x, -x] : kind === 'posBig' ? [Math.max(x, y), -Math.min(x, y)] : [-Math.max(x, y), Math.min(x, y)]; } while (kind !== 'equal' && Math.abs(a) === Math.abs(b));
  if (R() < 0.5) [a, b] = [b, a];
  const ts = [T(null, N(a)), T('+', N(b))], right = rat(a + b);
  const diff = Math.abs(Math.abs(a) - Math.abs(b)), bigger = Math.abs(a) > Math.abs(b) ? a : b;
  return typed({ id: `addOpp-${n}`, family: 'addOpp', prompt: 'Add, without a number line.', board: board(ts),
    solution: [`Opposite signs: part of each cancels.`, `Subtract the sizes: ${Math.max(Math.abs(a), Math.abs(b))} − ${Math.min(Math.abs(a), Math.abs(b))} = ${diff}.`, diff ? `Take the sign of the number with the bigger size (${fmtInt(bigger)}): ${S(H(right))}.` : `Equal sizes cancel completely: ${S('0')}.`],
  }, 'num', right, `Yes: ${S(H(right))}.`, [
    { q: a + b > 0 && a > 0 ? rat(-diff) : null, mc: 'mc.integers.two-negatives-positive-in-addition', say: `“Unlike signs make a negative” is a multiplying rule. Here the positive number is bigger, so the sum is positive: ${S(H(right))}.` },
    { q: diff && Math.sign(a) !== Math.sign(a + b) ? rat(Math.sign(a) * diff) : null, mc: 'mc.integers.sum-sign-from-first-addend', say: `The size ${diff} is right, but the sign comes from the number with the BIGGER size (${fmtInt(bigger)}), not the first one: ${S(H(right))}.` },
    { q: rat(-(Math.abs(a) + Math.abs(b))), mc: 'mc.integers.add-magnitudes-mixed-signs', say: `With opposite signs the sizes partly cancel, so subtract them: ${S(H(right))}.` },
    { q: rat(Math.abs(a) + Math.abs(b)), mc: 'mc.integers.adds-magnitudes-with-unfixed-sign', say: `With opposite signs the sizes partly cancel, so subtract them: ${S(H(right))}.` },
  ], `Opposite signs: subtract the sizes (${diff}) and take the sign of the bigger one: ${S(H(right))}.`);
};
const subInt: Gen = (R, n) => {
  const kind = pick(R, ['two', 'two', 'two', 'zero', 'chain'] as const);
  let ts: Term[];
  if (kind === 'chain') ts = [T(null, N(signed(R, 1, 20))), T('-', N(signed(R, 1, 20))), T('-', N(signed(R, 1, 20)))];
  else if (kind === 'zero') ts = R() < 0.5 ? [T(null, N(signed(R, 1, 50))), T('-', N(0))] : [T(null, N(0)), T('-', N(signed(R, 1, 50)))];
  else { const [a, b] = subCase(R, 50, 1); ts = [T(null, N(a)), T('-', N(b))]; }
  const right = sumQ(ts);
  const asPos = sumQ(ts.map(t => (t.op === '-' && sgn(t.n) < 0 ? T('+', t.n) : t)));
  const both = ts.length === 2 ? qAdd(qNeg(ts[0]!.n.q), ts[1]!.n.q) : null;
  const rew = ts.map((t, i) => (i === 0 ? t : T('+', t.op === '-' ? neg(t.n) : t.n)));
  return typed({ id: `subInt-${n}`, family: 'subInt', prompt: 'Work it out, without a number line.', board: board(ts),
    solution: [`Rewrite every subtraction as adding the opposite: ${exprHtml(rew)}.`, `Then add: ${S(H(right))}.`],
  }, 'num', right, `Yes: ${exprHtml(rew)} = ${S(H(right))}.`, [
    { q: ts.some(t => t.op === '-' && sgn(t.n) < 0) ? asPos : null, mc: 'mc.integers.subtract-negative-as-positive', say: `Subtracting a negative is ADDING its opposite: ${exprHtml(rew)} = ${S(H(right))}.` },
    { q: both && sgn(ts[0]!.n) !== 0 && sgn(ts[1]!.n) !== 0 ? both : null, mc: 'mc.integers.subtract-changes-both-signs', say: `Only the number taken away flips its sign; the first number stays: ${exprHtml(rew)} = ${S(H(right))}.` },
  ], `Add the opposite: ${exprHtml(rew)} = ${S(H(right))}.`);
};

// =====================================================================================================================
// 11. model-to-algorithm-add-sub (choice)
// =====================================================================================================================
const matStep: Gen = (R, n) => {
  const kind = pick(R, ['addPairs', 'remove', 'colour', 'addForSub'] as const);
  const RULE = {
    sub: 'Subtract the sizes',
    add: 'Add the sizes',
    sign: 'Give the answer the sign of the bigger size',
    rewrite: 'Rewrite the subtraction as adding the opposite',
    first: 'Give the answer the sign of the first number',
    twoNeg: '“Two negatives make a positive”',
  } as const;
  if (kind === 'addPairs') {
    let s: number, k: number, pos: number, ng: number;
    do { s = signed(R, 1, 6); k = int(R, 2, 5); pos = Math.max(0, s); ng = Math.max(0, -s); } while (!matFits({ pos, neg: ng, add: k }));
    const all = Math.abs(s) + 2 * k;
    const opts: Opt[] = [
      { html: fmtInt(s), ok: true, say: `Yes: each zero pair is worth 0, so the mat still shows ${fmtInt(s)}.` },
      { html: fmtInt(s + (s > 0 ? k : -k)), ok: false, mc: 'mc.integers.adding-zero-pairs-changes-value', say: `A zero pair is +1 and −1 together: worth 0. Adding pairs never changes the value: ${fmtInt(s)}.` },
      { html: fmtInt(all), ok: false, mc: 'mc.integers.zero-pair-not-zero', say: `That counts every counter. Light and dark cancel in pairs: the value is still ${fmtInt(s)}.` },
    ];
    return choose({ id: `matStep-${n}`, family: 'matStep', picture: { kind: 'mat', pos, neg: ng, add: k, at: 'added' },
      prompt: `The mat showed ${A(fmtInt(s))}. Ava added ${B(`${k} zero pairs`)} (the new columns). What does the mat show now?`, board: `${fmtTexInt(s)} + ${k} \\times 0 = \\,?`,
      solution: ['A zero pair is one light (+1) and one dark (−1): +1 + (−1) = 0.', `Adding ${k} zero pairs adds 0, so the mat still shows ${S(fmtInt(s))}.`] }, R, opts);
  }
  if (kind === 'remove' || kind === 'colour') {
    let a: number, b: number;
    do { a = int(R, 2, 12); b = int(R, 1, 12); } while (a === b);
    const big = Math.max(a, b), small = Math.min(a, b), negBig = R() < 0.5;
    const x = negBig ? -big : big, y = negBig ? small : -small;
    const [p, q] = R() < 0.5 ? [x, y] : [y, x];
    const pos = Math.max(0, p) + Math.max(0, q), ng = Math.max(0, -p) + Math.max(0, -q);
    const ts = [T(null, N(p)), T('+', N(q))];
    const lt = negBig ? 'dark' : 'light';
    const opts: Opt[] = kind === 'remove' ? [
      { html: `${RULE.sub}: ${big} − ${small} = ${big - small}`, ok: true, say: `Yes: each removed pair takes 1 off both sizes, so ${small} pairs leave ${big} − ${small} = ${big - small}.` },
      { html: `${RULE.add}: ${big} + ${small} = ${big + small}`, ok: false, mc: 'mc.integers.model-and-rule-unconnected', say: `Removing pairs takes counters AWAY, so the sizes are subtracted: ${big} − ${small}.` },
      { html: RULE.rewrite, ok: false, mc: 'mc.integers.model-and-rule-unconnected', say: `There is no subtraction to rewrite here. Removing ${small} pairs matches ${big} − ${small}.` },
    ] : [
      { html: RULE.sign, ok: true, say: `Yes: the colour left over is the sign. ${lt === 'dark' ? 'Dark' : 'Light'} left means ${negBig ? 'negative' : 'positive'}, the sign of ${fmtInt(x)}, the bigger size.` },
      { html: RULE.sub, ok: false, mc: 'mc.integers.model-and-rule-unconnected', say: `Subtracting the sizes was removing the pairs. The COLOUR left over gives the sign.` },
      { html: RULE.first, ok: false, mc: 'mc.integers.sum-sign-from-first-addend', say: `It does not matter which number came first: the colour left over is the colour of the bigger group.` },
    ];
    return choose({ id: `matStep-${n}`, family: 'matStep', picture: { kind: 'mat', pos, neg: ng, at: kind === 'remove' ? 'start' : 'left' },
      prompt: kind === 'remove' ? `On the mat, ${exprHtml(ts)} is ${pos} light and ${ng} dark counters. Removing the ${small} zero pairs matches which step of the rule?`
        : `For ${exprHtml(ts)}, the zero pairs are gone and ${B(`${big - small} ${lt}`)} counters are left. Which step of the rule does the COLOUR match?`,
      board: `${exprTex(ts)} = ${fmtTexInt(p + q)}`,
      solution: [`Removing ${small} zero pairs = subtracting the sizes: ${big} − ${small} = ${big - small}.`, `The colour left over (${lt}) = the sign of the bigger size: ${S(fmtInt(p + q))}.`] }, R, opts);
  }
  let p: number, q: number;
  do { p = int(R, 1, 6); q = -int(R, 1, 6); } while (!matFits({ pos: p, neg: 0, add: -q, take: { sign: -1, n: -q } }));
  const ts = [T(null, N(p)), T('-', N(q))];
  const opts: Opt[] = [
    { html: `${RULE.rewrite}: ${exprHtml([T(null, N(p)), T('+', N(-q))])}`, ok: true, say: `Yes: adding ${-q} zero pairs and taking away the ${-q} dark ones leaves ${-q} extra light ones: the same as adding ${-q}.` },
    { html: `${RULE.sub}: ${Math.max(p, -q)} − ${Math.min(p, -q)}`, ok: false, mc: 'mc.integers.model-and-rule-unconnected', say: `Nothing cancels against the ${p} here. Taking away ${-q} dark counters leaves ${-q} extra light ones: ${p} + ${-q}.` },
    { html: RULE.twoNeg, ok: false, mc: 'mc.integers.two-negatives-positive-in-addition', say: `That is a multiplying rule. On the mat you can see why: taking away dark counters leaves their light partners, so ${p} − (${q}) = ${p} + ${-q}.` },
  ];
  return choose({ id: `matStep-${n}`, family: 'matStep', picture: { kind: 'mat', pos: p, neg: 0, add: -q, take: { sign: -1, n: -q }, at: 'added' },
    prompt: `For ${exprHtml(ts)}, the mat shows ${A(String(p))} and has no dark counters, so Ava adds ${B(`${-q} zero pairs`)}, then takes away ${-q} dark counters. Which step of the rule is that?`,
    board: `${exprTex(ts)} = ${p} + ${-q}`,
    solution: [`The added zero pairs are worth 0. Taking away their ${-q} dark counters leaves ${-q} light ones behind.`, `That is the same as adding ${-q}: ${exprHtml(ts)} = ${p} + ${-q} = ${S(String(p - q))}.`] }, R, opts);
};

// =====================================================================================================================
// 12. fraction-add-sub-signed
// =====================================================================================================================
function randFrac(R: () => number, dens: number[], improper = false): Num {
  for (;;) {
    const d = pick(R, dens), k = int(R, 1, improper ? 2 * d + d - 1 : d - 1);
    if (gcdN(k, d) !== 1 || k % d === 0) continue;
    return N(k, d, 'frac');
  }
}
const lcm = (a: number, b: number) => a * b / gcdN(a, b);
const fracSigned: Gen = (R, n) => {
  for (;;) {
    const x0 = randFrac(R, [2, 3, 4, 5, 6, 8, 10, 12], R() < 0.15), y0 = randFrac(R, [2, 3, 4, 5, 6, 8, 10, 12], R() < 0.15);
    if (lcm(x0.q.q, y0.q.q) > 24) continue;
    const c = pick(R, ['same', 'opp', 'cross', 'subNeg', 'sub'] as const);
    let x = x0, y = y0, op: '+' | '-' = '+';
    if (c === 'same') { if (R() < 0.6) { x = neg(x0); y = neg(y0); } }
    else if (c === 'opp' || c === 'cross') { if (R() < 0.5) x = neg(x0); else y = neg(y0); }
    else if (c === 'subNeg') { op = '-'; y = neg(y0); if (R() < 0.4) x = neg(x0); }
    else { op = '-'; if (R() < 0.5) x = neg(x0); }
    const ts = [T(null, x), T(op, y)], right = sumQ(ts);
    if (right.q === 1) continue;
    const eff = op === '-' ? neg(y) : y;   // the number actually added
    const dd = op === '+' ? x.q.q + y.q.q : x.q.q - y.q.q;
    const denWrong = dd > 0 ? rat(op === '+' ? x.q.p + y.q.p : x.q.p - y.q.p, dd) : null;
    const mixedSigns = sgn(x) !== sgn(eff);
    const L = lcm(x.q.q, y.q.q);
    const a1 = x.q.p * (L / x.q.q), a2 = eff.q.p * (L / eff.q.q);
    return typed({ id: `fracSigned-${n}`, family: 'fracSigned', prompt: `Work it out. Any equivalent fraction or mixed number is fine.`, board: board(ts),
      solution: [...(op === '-' ? [`Rewrite: ${exprHtml(ts)} = ${exprHtml([T(null, x), T('+', eff)])}.`] : []),
        `Common denominator ${L}: ${fr2s(a1, L)} + ${fr2s(a2, L, true)}.`,
        mixedSigns ? `Opposite signs: ${Math.max(Math.abs(a1), Math.abs(a2))} − ${Math.min(Math.abs(a1), Math.abs(a2))} = ${Math.abs(a1 + a2)}, sign of the bigger numerator: ${S(H(right, 'frac'))}.` : `Same signs: add the numerators, keep the sign: ${S(H(right, 'frac'))}.`],
    }, 'frac', right, `Yes: ${exprHtml(ts)} = ${S(H(right, 'frac'))}${Math.abs(right.p) > right.q ? ` = ${H(right, 'mixed')}` : ''}.`, [
      { q: denWrong, mc: 'mc.fraction-ops.adds-or-subtracts-denominators', say: `The denominators name the SIZE of the pieces, so they are not added. Rewrite over ${L}: ${S(H(right, 'frac'))}.` },
      { q: mixedSigns ? qNeg(qAdd(qAbs(x.q), qAbs(eff.q))) : null, mc: 'mc.integers.add-magnitudes-mixed-signs', say: `The numbers have opposite signs, so part of each cancels: subtract the numerators over ${L}. ${S(H(right, 'frac'))}.` },
      { q: mixedSigns ? (sgn(x) !== sgn(right) ? rat(sgn(x) * Math.abs(right.p), right.q) : null) : null, mc: 'mc.integers.sum-sign-from-first-addend', say: `The size is right, but compare the numerators over ${L}: the bigger one decides the sign. ${S(H(right, 'frac'))}.` },
    ], `Rewrite over ${L} and combine the numerators: ${S(H(right, 'frac'))}.`);
  }
};
const fr2s = (p: number, q: number, paren = false) => (p < 0 ? (paren ? `(−${fr2(-p, q)})` : `−${fr2(-p, q)}`) : fr2(p, q));
const fracSign: Gen = (R, n) => {
  for (;;) {
    const x0 = randFrac(R, [3, 4, 5, 6, 8, 10, 12]), y0 = randFrac(R, [3, 4, 5, 6, 8, 10, 12]);
    if (lcm(x0.q.q, y0.q.q) > 24 || qSame(x0.q, y0.q)) continue;
    const x = R() < 0.5 ? neg(x0) : x0, y = sgn(x) < 0 ? y0 : neg(y0);
    const sub = R() < 0.35;
    const ts = sub ? [T(null, x), T('-', neg(y))] : [T(null, x), T('+', y)];
    const right = sumQ(ts), s = sgn(right);
    const L = lcm(x.q.q, y.q.q);
    const names = ['positive', 'negative', 'zero'];
    const rightName = s > 0 ? 'positive' : s < 0 ? 'negative' : 'zero';
    const firstName = sgn(x) > 0 ? 'positive' : 'negative';
    const opts: Opt[] = names.map(nm => ({
      html: nm === 'zero' ? 'Zero' : nm[0]!.toUpperCase() + nm.slice(1), ok: nm === rightName,
      mc: nm === rightName ? undefined : nm === firstName ? 'mc.integers.sum-sign-from-first-addend' : undefined,
      say: nm === rightName ? `Yes: over ${L}, ${fr2(Math.abs(x.q.p) * L / x.q.q, L)} against ${fr2(Math.abs(y.q.p) * L / y.q.q, L)}: the ${Math.abs(x.q.p) * L / x.q.q > Math.abs(y.q.p) * L / y.q.q ? 'first' : 'second'} is bigger, so the sum is ${rightName}.`
        : `Rewrite both over ${L} and compare the numerators: ${fr2(Math.abs(x.q.p) * L / x.q.q, L)} and ${fr2(Math.abs(y.q.p) * L / y.q.q, L)}. The bigger one wins: ${rightName}.`,
    }));
    return choose({ id: `fracSign-${n}`, family: 'fracSign', prompt: `Without working it all out: is ${exprHtml(ts)} positive, negative or zero?`, board: exprTex(ts),
      solution: [...(sub ? [`Rewrite: ${exprHtml(ts)} = ${exprHtml([T(null, x), T('+', y)])}.`] : []), `Over ${L}: ${fr2s(x.q.p * L / x.q.q, L)} and ${fr2s(y.q.p * L / y.q.q, L)}.`, `The bigger numerator decides: ${S(rightName)} (${H(right, 'frac')}).`] }, R, opts, true);
  }
};

// =====================================================================================================================
// 13. mixed-number-add-sub-signed
// =====================================================================================================================
const mixedOps: Gen = (R, n) => {
  for (;;) {
    const mk = (big: boolean): Num => { const d = pick(R, [2, 3, 4, 5, 6, 8]); let k = int(R, 1, d - 1); while (gcdN(k, d) !== 1) k = int(R, 1, d - 1); const w = big ? int(R, 1, 4) : 0; return N(w * d + k, d, big ? 'mixed' : 'frac'); };
    const x = neg(mk(true));
    const c = pick(R, ['addPos', 'subPos', 'subNeg', 'addNeg'] as const);
    const y0 = mk(c !== 'subNeg' || R() < 0.5);
    const op: '+' | '-' = c === 'addPos' || c === 'addNeg' ? '+' : '-';
    const y = c === 'subNeg' || c === 'addNeg' ? neg(y0) : y0;
    if (lcm(x.q.q, y.q.q) > 24) continue;
    const ts = [T(null, x), T(op, y)], right = sumQ(ts);
    if (right.q === 1) continue;
    // the split misreading: -w k/d read as -w + k/d (for every negative mixed number in the problem)
    const split = (a: Num): Q => { if (a.form !== 'mixed' || sgn(a) > 0) return a.q; const P = Math.abs(a.q.p), d = a.q.q, w = Math.floor(P / d); return rat(-w * d + (P % d), d); };
    const wrongQ = sumQ([T(null, { q: split(x), form: 'frac' }), T(op, { q: split(y), form: 'frac' })]);
    const imp = (a: Num) => hx({ q: a.q, form: 'frac' }, true);
    return typed({ id: `mixedOps-${n}`, family: 'mixedOps', prompt: 'Work it out. A mixed number or an improper fraction is fine (type the minus sign in front).', board: board(ts),
      solution: [`Make improper fractions, the sign on the whole number: ${hx(x)} = ${hx({ q: x.q, form: 'frac' })}${y.form === 'mixed' ? `, ${hx(y)} = ${hx({ q: y.q, form: 'frac' })}` : ''}.`,
        `${imp(x)} ${op === '-' ? '−' : '+'} ${imp(y)} = ${S(H(right, 'frac'))}${Math.abs(right.p) > right.q ? ` = ${H(right, 'mixed')}` : ''}.`],
    }, 'frac', right, `Yes: ${exprHtml(ts)} = ${S(H(right, 'mixed'))}.`, [
      { q: wrongQ, mc: 'mc.integers.negative-mixed-number-split', say: `${hx(x)} means −(${hx(abs(x))}): the fraction part is negative too. ${hx(x)} = ${hx({ q: x.q, form: 'frac' })}, and the answer is ${S(H(right, 'mixed'))}.` },
    ], `Change to improper fractions first (the sign covers the whole mixed number): ${S(H(right, 'mixed'))}.`);
  }
};

// =====================================================================================================================
// 14. decimal-add-sub-signed
// =====================================================================================================================
const decSigned: Gen = (R, n) => {
  for (;;) {
    const dp = () => pick(R, [1, 1, 2, 2, 3]);
    const mk = () => { const k = dp(); return D(int(R, 1, 9 * 10 ** k) / 10 ** k + (R() < 0.5 ? int(R, 0, 12) : 0)); };
    let x = mk(), y = mk();
    if (sgn(x) === 0 || sgn(y) === 0) continue;
    const c = pick(R, ['opp', 'opp', 'cross', 'subNeg', 'same', 'money'] as const);
    let op: '+' | '-' = '+';
    if (c === 'opp' || c === 'cross') { if (R() < 0.5) x = neg(x); else y = neg(y); }
    else if (c === 'subNeg') { op = '-'; y = neg(y); if (R() < 0.5) x = neg(x); }
    else if (c === 'same') { x = neg(x); y = neg(y); }
    else { x = D(-(int(R, 100, 9999) / 100)); y = D(int(R, 100, 9999) / 100); }
    const ts = [T(null, x), T(op, y)], right = sumQ(ts);
    const eff = op === '-' ? neg(y) : y;
    const da = places(x.q) ?? 0, db = places(eff.q) ?? 0;
    let mis: Q | null = null;
    if (da !== db) {
      const ai = Math.abs(x.q.p) * 10 ** da / x.q.q, bi = Math.abs(eff.q.p) * 10 ** db / eff.q.q, m = 10 ** Math.max(da, db);
      const mag = sgn(x) === sgn(eff) ? ai + bi : Math.abs(ai - bi);
      mis = rat((sgn(right) || 1) * Math.round(mag), m);
    }
    const negDiff = sgn(x) !== sgn(eff) && sgn(right) > 0 ? qNeg(right) : null;
    const isMoney = c === 'money';
    const prompt = isMoney ? `A checking account is at ${A(money(val(x), 2))}. A deposit of ${B(money(val(y), 2))} comes in. What is the new balance?` : 'Work it out, without a calculator.';
    return typed({ id: `decSigned-${n}`, family: 'decSigned', prompt, board: board(ts), unit: isMoney ? 'dollars' : undefined,
      solution: [...(op === '-' ? [`Rewrite: ${exprHtml(ts)} = ${exprHtml([T(null, x), T('+', eff)])}.`] : []),
        `Line up the decimal points (fill with zeros): ${pad(x, eff)}.`,
        sgn(x) === sgn(eff) ? `Same signs: add the sizes, keep the sign: ${S(H(right, 'dec'))}.` : `Opposite signs: bigger size minus smaller size, sign of the bigger: ${S(H(right, 'dec'))}.`],
    }, 'num', right, `Yes: ${exprHtml(ts)} = ${S(H(right, 'dec'))}.`, [
      { q: mis, mc: 'mc.decimals.aligns-by-last-digit', say: `Line up the decimal POINTS, not the last digits: ${pad(x, eff)}. The answer is ${S(H(right, 'dec'))}.` },
      { q: negDiff, mc: 'mc.decimals.unlike-sign-sum-uses-negative-magnitude-difference', say: `Subtract the smaller size from the bigger one, then use the sign of the bigger: the positive number is bigger here, so ${S(H(right, 'dec'))}.` },
    ], `Line up the points and use the sign rules: ${S(H(right, 'dec'))}.`);
  }
};
function pad(a: Num, b: Num): string {
  const k = Math.max(places(a.q) ?? 0, places(b.q) ?? 0);
  const f = (x: Num) => { const v = Math.abs(qNum(x.q)); return v.toFixed(k); };
  return `${f(a)} and ${f(b)}`;
}

// =====================================================================================================================
// 15. mixed-format-operands
// =====================================================================================================================
const mixFormat: Gen = (R, n) => {
  for (;;) {
    const d = pick(R, [2, 4, 5, 8, 10, 20]);
    let k = int(R, 1, d - 1); while (gcdN(k, d) !== 1) k = int(R, 1, d - 1);
    const f = N(k + (R() < 0.2 ? d : 0), d, 'frac');
    const dk = pick(R, [1, 2, 2]);
    const dec = D(int(R, 1, 30 * 10 ** dk) / 10 ** dk);
    if (dec.q.q === 1) continue;
    let x: Num = dec, y: Num = f;
    if (R() < 0.5) [x, y] = [f, dec];
    const c = pick(R, ['opp', 'subNeg', 'same', 'opp'] as const);
    let op: '+' | '-' = '+';
    if (c === 'opp') { if (R() < 0.5) x = neg(x); else y = neg(y); }
    else if (c === 'subNeg') { op = '-'; y = neg(y); }
    else { x = neg(x); y = neg(y); }
    const ts = [T(null, x), T(op, y)], right = sumQ(ts);
    if (!isDec(right)) continue;
    const fr = x.form === 'frac' ? x : y;
    const fv = Math.abs(qNum(fr.q)), rounded = Math.round(fv);
    const est = Math.abs(fv - Math.floor(fv) - 0.5) < 1e-9 || rounded === fv ? null : sumQ(ts.map(t => (t.n.form === 'frac' ? T(t.op, D(sgn(t.n) * rounded)) : t)));
    const P = Math.abs(fr.q.p), Qd = fr.q.q;
    let digits: Q | null = null;
    try { digits = sumQ(ts.map(t => (t.n.form === 'frac' ? T(t.op, D(sgn(t.n) * Number(`${P}.${Qd}`))) : t))); } catch { digits = null; }
    return typed({ id: `mixFormat-${n}`, family: 'mixFormat', prompt: 'One number is a fraction, one is a decimal. Pick one form for both, then work it out. Give the exact answer as a decimal.', board: board(ts),
      solution: [`${hx(abs(fr))} = ${H(qAbs(fr.q), 'dec')} as a decimal.`, `${exprHtml(ts.map(t => T(t.op, t.n.form === 'frac' ? { q: t.n.q, form: 'dec' } : t.n)))} = ${S(H(right, 'dec'))}.`],
    }, 'num', right, `Yes: ${exprHtml(ts)} = ${S(H(right, 'dec'))}.`, [
      { q: est, mc: 'mc.estimation.reports-estimate-as-exact-answer', say: `That rounds ${hx(abs(fr))} to ${rounded}: fine for an estimate, but the exact answer uses ${hx(abs(fr))} = ${(P / Qd).toString()}: ${S(H(right, 'dec'))}.` },
      { q: digits, mc: 'mc.decimals.fraction-decimal-unrelated-procedures', say: `${hx(abs(fr))} is not ${P}.${Qd}: it means ${P} ÷ ${Qd} = ${(P / Qd).toString()}. So the answer is ${S(H(right, 'dec'))}.` },
    ], `Change ${hx(abs(fr))} to ${(P / Qd).toString()}, then use the sign rules: ${S(H(right, 'dec'))}.`);
  }
};

// =====================================================================================================================
// 16. additive-properties-strategies
// =====================================================================================================================
const regroup: Gen = (R, n) => {
  const kind = pick(R, ['sameValue', 'swapSub', 'sameValue'] as const);
  const a = D(int(R, 11, 89) / 10), b = N(int(R, 2, 12)), c = D(int(R, 11, 89) / 10);
  if (kind === 'swapSub') {
    const x = pick(R, [N(int(R, 3, 15)), D(int(R, 11, 99) / 10)]), y = pick(R, [N(int(R, 2, 15)), D(int(R, 11, 99) / 10)]);
    if (qSame(x.q, y.q)) return regroup(R, n);
    const ts = [T(null, x), T('-', y)], sw = [T(null, y), T('-', x)];
    const opts: Opt[] = [
      { html: `No: ${exprHtml(sw)} is the opposite, ${H(sumQ(sw), 'dec')}`, ok: true, say: `Right. Subtraction does not commute. Rewrite first: ${exprHtml([T(null, x), T('+', neg(y))])} = ${exprHtml([T(null, neg(y)), T('+', x)])}, which you CAN reorder.` },
      { html: 'Yes: you can always swap the order', ok: false, mc: 'mc.properties.regroups-subtraction-or-division', say: `Swapping only works for addition. ${exprHtml(ts)} = ${H(sumQ(ts), 'dec')}, but ${exprHtml(sw)} = ${H(sumQ(sw), 'dec')}.` },
      { html: 'Yes, but only when both numbers are positive', ok: false, mc: 'mc.properties.regroups-subtraction-or-division', say: `Even with positive numbers, ${exprHtml(ts)} = ${H(sumQ(ts), 'dec')} and ${exprHtml(sw)} = ${H(sumQ(sw), 'dec')}.` },
    ];
    return choose({ id: `regroup-${n}`, family: 'regroup', prompt: `Jae swaps ${exprHtml(ts)} to ${exprHtml(sw)}. Is the value the same?`, board: `${exprTex(ts)} \\overset{?}{=} ${exprTex(sw)}`,
      solution: [`${exprHtml(ts)} = ${H(sumQ(ts), 'dec')} but ${exprHtml(sw)} = ${H(sumQ(sw), 'dec')}.`, `Reorder only after rewriting subtraction as adding the opposite.`] }, R, opts, true);
  }
  // a - b - (-c) = a + c + (-b): rewrite, then reorder so the decimals make a whole number
  const c2 = D(Math.ceil(val(a)) - val(a) + int(R, 0, 3));
  if (sgn(c2) === 0 || isNaN(val(c2))) return regroup(R, n);
  const ts = [T(null, a), T('-', b), T('-', neg(c2))];
  const right = [T(null, a), T('+', c2), T('+', neg(b))];
  const swapSub = [T(null, b), T('-', a), T('-', neg(c2))];
  const groupSub = `${hx(a)} − (${hx(b)} − ${hx(neg(c2), true)})`;
  const opts: Opt[] = [
    { html: exprHtml(right), ok: true, say: `Yes: rewrite each subtraction as adding the opposite, then reorder: ${hx(a)} + ${hx(c2)} = ${H(qAdd(a.q, c2.q), 'dec')} first.` },
    { html: exprHtml(swapSub), ok: false, mc: 'mc.properties.regroups-subtraction-or-division', say: `Swapping around a minus sign changes the value. Rewrite first: ${exprHtml(right)}.` },
    { html: groupSub, ok: false, mc: 'mc.properties.regroups-subtraction-or-division', say: `New parentheses after a minus sign change the value. Rewrite as additions first: ${exprHtml(right)}.` },
  ];
  const v = sumQ(ts);
  if (qSame(sumQ(swapSub), v)) return regroup(R, n);
  return choose({ id: `regroup-${n}`, family: 'regroup', prompt: `Which has the same value as ${exprHtml(ts)}, and is easier to work out?`, board: exprTex(ts),
    solution: [`Rewrite: ${exprHtml([T(null, a), T('+', neg(b)), T('+', c2)])}.`, `Reorder (commutative): ${exprHtml(right)}.`, `${hx(a)} + ${hx(c2)} = ${H(qAdd(a.q, c2.q), 'dec')}, then ${H(qAdd(a.q, c2.q), 'dec')} + ${hx(neg(b), true)} = ${S(H(v, 'dec'))}.`] }, R, opts);
};
const property: Gen = (R, n) => {
  const p = pick(R, [() => N(pick(R, [1, 3]), 4), () => D(int(R, 11, 89) / 10), () => N(int(R, 1, 4), 5), () => N(int(R, 2, 9))])();
  const o = pick(R, [() => N(int(R, 1, 4), 5), () => N(int(R, 2, 9)), () => D(int(R, 11, 49) / 10)])();
  const kind = pick(R, ['comm', 'assoc', 'inv'] as const);
  const np = neg(p);
  let lhs: string, rhs: string, tl: string, trr: string;
  if (kind === 'comm') { lhs = `${hx(np)} + ${hx(o)} + ${hx(p)}`; rhs = `${hx(np)} + ${hx(p)} + ${hx(o)}`; tl = `${tx(np)} + ${tx(o)} + ${tx(p)}`; trr = `${tx(np)} + ${tx(p)} + ${tx(o)}`; }
  else if (kind === 'assoc') { lhs = `(${hx(o)} + ${hx(np, true)}) + ${hx(p)}`; rhs = `${hx(o)} + (${hx(np, true)} + ${hx(p)})`; tl = `(${tx(o)} + ${tx(np, true)}) + ${tx(p)}`; trr = `${tx(o)} + (${tx(np, true)} + ${tx(p)})`; }
  else { lhs = `(${hx(np)} + ${hx(p)}) + ${hx(o)}`; rhs = `0 + ${hx(o)}`; tl = `(${tx(np)} + ${tx(p)}) + ${tx(o)}`; trr = `0 + ${tx(o)}`; }
  const names = { comm: 'Commutative: the order changes', assoc: 'Associative: the grouping changes', inv: 'Additive inverse: a number plus its opposite is 0' } as const;
  const opts: Opt[] = (['comm', 'assoc', 'inv'] as const).map(k => ({
    html: names[k], ok: k === kind,
    say: k === kind ? `Yes. ${kind === 'comm' ? 'The same numbers, in a different order.' : kind === 'assoc' ? 'The same order, but different parentheses.' : `${hx(np)} + ${hx(p)} = 0.`}`
      : `Compare the two sides: ${kind === 'comm' ? 'only the ORDER of the numbers changed' : kind === 'assoc' ? 'the numbers stay in order; only the parentheses moved' : `${hx(np)} and ${hx(p)} became 0`}.`,
  }));
  return choose({ id: `property-${n}`, family: 'property', prompt: `${lhs} = ${rhs}. Which property makes this step true?`, board: `${tl} = ${trr}`,
    solution: ['Commutative: change the order. Associative: change the grouping. Additive inverse: p + (−p) = 0.', `Here: ${S(names[kind].split(':')[0]!)}.`] }, R, opts, true);
};

// =====================================================================================================================
// 17. model-check-add-sub
// =====================================================================================================================
const lineCheck: Gen = (R, n) => {
  for (;;) {
    const fracs = R() < 0.3;
    const sc = fracs ? { form: 'frac' as Form, den: 4, lim: 3 } : { form: 'int' as Form, den: 1, lim: 9 };
    const kind = pick(R, ['subNeg', 'cross', 'sameAdd'] as const);
    let a: number, b: number, op: '+' | '-';
    if (kind === 'subNeg') { [a, b] = subCase(R, sc.lim, 1 / sc.den); if (b >= 0) b = -b || -1 / sc.den; op = '-'; }
    else if (kind === 'cross') { [a, b] = addCase(R, sc.lim, 1 / sc.den); op = R() < 0.5 ? '+' : '-'; }
    else { const m = 1 / sc.den; a = -int(R, 1, sc.lim / 2 / m) * m; b = -int(R, 1, sc.lim / 2 / m) * m; op = '+'; }
    if (a === 0 || b === 0) continue;
    const p = mkNum(a, sc.form, sc.den), q = mkNum(b, sc.form, sc.den);
    const ts = [T(null, p), T(op, q)], right = sumQ(ts);
    // the claim: right, or a classic slip
    const slips: { q: Q; mc: string }[] = op === '-'
      ? [{ q: qAdd(p.q, q.q), mc: sgn(q) < 0 ? 'mc.integers.subtract-negative-as-positive' : 'mc.integers.jump-direction-single-cue' }, { q: qAdd(qNeg(p.q), q.q), mc: 'mc.integers.subtract-changes-both-signs' }]
      : [{ q: sgn(p) === sgn(q) ? qNeg(right) : rat(sgn(p.q) * Math.abs(right.p), right.q), mc: sgn(p) === sgn(q) ? 'mc.integers.two-negatives-positive-in-addition' : 'mc.integers.sum-sign-from-first-addend' }];
    const good = slips.filter(s => !qSame(s.q, right));
    const correct = R() < 0.4 || !good.length;
    const slip = correct ? null : pick(R, good);
    const claim = slip ? slip.q : right;
    const pic = linePic(p, q, op, 'jump', claim);
    if (!pic) continue;
    const form = sc.form;
    const other = good.find(s => !qSame(s.q, claim))?.q ?? qAdd(right, rat(sgn(right) >= 0 ? 1 : -1));
    if (qSame(other, right) || qSame(other, claim)) continue;
    const opts: Opt[] = correct ? [
      { html: `The line agrees: the claim is right for these numbers.`, ok: true, say: `Yes: the jump lands on ${S(H(right, form))}, just as claimed. One check shows THIS sum is right, not a rule for every sum.` },
      { html: `The line shows it is wrong: it lands on ${H(other, form)}.`, ok: false, say: `Read the landing point again: ${S(H(right, form))}, the same as the claim.` },
      { html: `The line proves the rule works for every pair of numbers.`, ok: false, mc: 'mc.reasoning-language.examples-as-proof', say: `One example can show a claim is right for THESE numbers, or find a counterexample. It cannot prove a rule for every number.` },
    ] : [
      { html: `The line shows it is wrong: it lands on ${H(right, form)}.`, ok: true, say: `Yes: the jump lands on ${S(H(right, form))}, not ${H(claim, form)}. One counterexample is enough.` },
      { html: `The line agrees: the claim is right.`, ok: false, mc: slip!.mc, say: `Look where the arrow ends: ${S(H(right, form))}. The claim says ${H(claim, form)}.` },
      { html: `The line shows it is wrong: it lands on ${H(other, form)}.`, ok: false, say: `Read the landing point again: ${S(H(right, form))}.` },
    ];
    if (new Set(opts.map(o => o.html)).size < 3) continue;
    return choose({ id: `lineCheck-${n}`, family: 'lineCheck', picture: pic,
      prompt: `Kai claims ${exprHtml(ts)} = ${hx(as(claim, form))}. The number line shows the moves. What does it show about Kai's claim?`,
      board: `${exprTex(ts)} \\overset{?}{=} ${TX(claim, form)}`,
      solution: [op === '-' ? `Start at ${hx(p)}; taking away ${hx(q)} flips its move: ${hx(abs(q))} to the ${sgn(q) > 0 ? 'left' : 'right'}.` : `Start at ${hx(p)}; adding ${hx(q)} moves ${hx(abs(q))} to the ${sgn(q) > 0 ? 'right' : 'left'}.`, `The arrow lands on ${S(H(right, form))}${correct ? ': the claim holds for these numbers.' : `, so the claim ${H(claim, form)} is wrong.`}`] }, R, opts);
  }
};

// =====================================================================================================================
// 18. inverse-check-difference
// =====================================================================================================================
function subPair(R: () => number): { p: Num; q: Num; form: Form } {
  const k = pick(R, ['int', 'int', 'dec', 'frac'] as const);
  if (k === 'int') { const [a, b] = subCase(R, 20, 1); return { p: N(a), q: N(b), form: 'int' }; }
  if (k === 'dec') { const [a, b] = subCase(R, 9, 0.5); return { p: D(a + (R() < 0.5 ? 0.25 : 0)), q: D(b), form: 'dec' }; }
  const [a, b] = subCase(R, 3, 0.25); return { p: N(Math.round(a * 4), 4, 'frac'), q: N(Math.round(b * 4), 4, 'frac'), form: 'frac' };
}
const eq = (l: string, r: string) => `${l} = ${r}`;
const checkPick: Gen = (R, n) => {
  for (;;) {
    const { p, q, form } = subPair(R);
    if (sgn(q) === 0) continue;
    const ts = [T(null, p), T('-', q)], d = sumQ(ts), dn = as(d, form);
    if (qSame(d, p.q)) continue;
    const opts: Opt[] = [
      { html: eq(exprHtml([T(null, dn), T('+', q)]), hx(p)), ok: true, say: `Yes: add the number you took away (${B(hx(q))}) back to the answer. You should get ${A(hx(p))} again.` },
      { html: eq(exprHtml([T(null, p), T('+', dn)]), H(qAdd(p.q, d), form)), ok: false, mc: 'mc.add-sub.checks-subtraction-with-wrong-pair', say: `That adds the answer to the FIRST number. The check adds the number taken away, ${hx(q)}, back to the answer: ${exprHtml([T(null, dn), T('+', q)])} = ${hx(p)}.` },
      { html: eq(exprHtml(ts), hx(dn)), ok: false, mc: 'mc.reasoning-language.check-by-repeating-same-steps', say: `Doing the same subtraction again can repeat the same slip. Undo it instead: ${exprHtml([T(null, dn), T('+', q)])} = ${hx(p)}.` },
    ];
    return choose({ id: `checkPick-${n}`, family: 'checkPick', prompt: `Which addition checks that ${exprHtml(ts)} = ${hx(dn)}?`, board: `${exprTex(ts)} = ${tx(dn)}`,
      solution: [`Subtraction undoes addition, so a difference is checked by adding back.`, `${S(exprHtml([T(null, dn), T('+', q)]))} should give ${hx(p)}.`] }, R, opts);
  }
};
const checkJudge: Gen = (R, n) => {
  for (;;) {
    const { p, q, form } = subPair(R);
    if (sgn(q) === 0) continue;
    const ts = [T(null, p), T('-', q)], d = sumQ(ts);
    const slip = sgn(q) < 0 ? qAdd(p.q, q.q) : qAdd(qNeg(p.q), q.q);
    const correct = R() < 0.45 || qSame(slip, d);
    const claim = as(correct ? d : slip, form);
    const back = qAdd(claim.q, q.q);
    const backN = as(back, form);
    const wrongPair = qAdd(p.q, claim.q);
    if (!correct && qSame(back, p.q)) continue;
    const addBack = exprHtml([T(null, claim), T('+', q)]);
    const opts: Opt[] = correct ? [
      { html: `Right: ${eq(addBack, hx(p))}`, ok: true, say: `Yes: adding ${hx(q)} back gives ${hx(p)}, where we started. The answer checks out.` },
      { html: `Wrong: ${eq(exprHtml([T(null, p), T('+', claim)]), H(wrongPair, form))}, and that is not ${hx(q)}`, ok: false, mc: 'mc.add-sub.checks-subtraction-with-wrong-pair', say: `That adds the answer to the first number. Add the number taken away back instead: ${eq(addBack, hx(p))}, so it is right.` },
      { html: `You can only tell by doing ${exprHtml(ts)} again`, ok: false, mc: 'mc.reasoning-language.check-by-repeating-same-steps', say: `Redoing the same steps can repeat the same slip. Adding back is a real check: ${eq(addBack, hx(p))}.` },
    ] : [
      { html: `Wrong: ${addBack} = ${hx(backN)}, not ${hx(p)}`, ok: true, say: `Yes: adding back does not return to ${hx(p)}, so the answer is wrong. It should be ${S(H(d, form))}.` },
      { html: `Right: ${eq(exprHtml([T(null, p), T('+', claim)]), H(wrongPair, form))}`, ok: false, mc: 'mc.add-sub.checks-subtraction-with-wrong-pair', say: `That adds the answer to the first number, which checks nothing. Add back the number taken away: ${addBack} = ${hx(backN)}, not ${hx(p)}.` },
      { html: `Right: doing ${exprHtml(ts)} again gives ${hx(claim)} again`, ok: false, mc: 'mc.reasoning-language.check-by-repeating-same-steps', say: `Redoing the same steps repeats the same slip. Add back: ${addBack} = ${hx(backN)}, not ${hx(p)}. The answer is ${S(H(d, form))}.` },
    ];
    if (new Set(opts.map(o => o.html)).size < 3) continue;
    return choose({ id: `checkJudge-${n}`, family: 'checkJudge', prompt: `Ana says ${exprHtml(ts)} = ${hx(claim)}. Check her answer by adding back. What do you find?`, board: `${exprTex(ts)} \\overset{?}{=} ${tx(claim)}`,
      solution: [`Add the number taken away back to her answer: ${addBack} = ${hx(backN)}.`, correct ? `That is ${hx(p)} again, so she is right.` : `That is not ${hx(p)}, so she is wrong; ${exprHtml(ts)} = ${S(H(d, form))}.`] }, R, opts);
  }
};

// =====================================================================================================================
// 19. apply-one-step-add-sub
// =====================================================================================================================
const story: Gen = (R, n) => {
  const kind = pick(R, ['tempReading', 'tempChange', 'balance', 'elevation', 'length', 'tempReading', 'balance'] as const);
  let prompt: string, unit: string, right: Q, ts: Term[], expl: string, neg0 = false;
  if (kind === 'tempReading') {
    const a = signed(R, 1, 15), c = -int(R, 2, 20) * (R() < 0.75 ? 1 : -1) || -5;
    ts = [T(null, N(a)), T('+', N(c))]; right = sumQ(ts); unit = '°F';
    prompt = `At 5 p.m. the temperature was ${A(fmtInt(a) + ' °F')}. By midnight it had ${c < 0 ? `dropped ${B(-c + ' °F')}` : `risen ${B(c + ' °F')}`}. What was the temperature at midnight?`;
    expl = `A reading: start ${fmtInt(a)}, change ${c < 0 ? '−' : '+'}${Math.abs(c)}`;
  } else if (kind === 'tempChange') {
    const a = signed(R, 1, 20); let b = signed(R, 1, 20); if (b === a) b = a - 7;
    ts = [T(null, N(b)), T('-', N(a))]; right = sumQ(ts); unit = '°F';
    prompt = `At noon it was ${A(fmtInt(a) + ' °F')}; at 10 p.m. it was ${B(fmtInt(b) + ' °F')}. What was the CHANGE in temperature? (A drop is negative.)`;
    expl = `A change: final − first = ${fmtInt(b)} − ${a < 0 ? `(${fmtInt(a)})` : fmtInt(a)}`;
  } else if (kind === 'balance') {
    const a = int(R, 1500, 6000) / 100, c = int(R, 2000, 9000) / 100;
    const x = D(a), y = D(c);
    ts = [T(null, x), T('-', y)]; right = sumQ(ts); unit = 'dollars'; neg0 = true;
    prompt = `Maya's account has ${A(money(a, 2))}. She pays a ${B(money(c, 2))} bill from it. What is her balance now? (Money owed is negative.)`;
    expl = `${money(a, 2)} − ${money(c, 2)}`;
  } else if (kind === 'elevation') {
    const a = -int(R, 10, 120), c = pick(R, [-1, 1]) * int(R, 5, 60);
    ts = [T(null, N(a)), T('+', N(c))]; right = sumQ(ts); unit = 'ft';
    prompt = `A submarine is at ${A(fmtInt(a) + ' ft')} (below sea level is negative). It ${c > 0 ? `rises ${B(c + ' ft')}` : `dives ${B(-c + ' ft')} deeper`}. What is its elevation now?`;
    expl = `${fmtInt(a)} + ${c < 0 ? `(${fmtInt(c)})` : c}`;
  } else {
    const a = pick(R, [2.5, 3.25, 1.5, 1.75, 2.25]), c = pick(R, [6.75, 8.5, 5.25, 9.5, 7.25]);
    ts = [T(null, D(a)), T('-', D(c))]; right = sumQ(ts); unit = 'ft';
    prompt = `A bucket hangs ${A(a + ' ft')} above the rim of a well. You lower it ${B(c + ' ft')}. Where is it now, compared with the rim? (Below the rim is negative.)`;
    expl = `${a} − ${c}`;
  }
  void neg0;
  const below: Record<string, string> = { tempReading: 'below zero', elevation: 'below sea level', length: 'below the rim', balance: 'she owes money', tempChange: 'colder' };
  const mag = qAbs(right);
  // the board names what is asked, not the expression: translating the story IS the skill
  const ask: Record<string, string> = {
    tempReading: '\\text{at midnight: }\\ ?\\ {}^{\\circ}\\mathrm{F}', tempChange: '\\text{change: }\\ ?\\ {}^{\\circ}\\mathrm{F}',
    balance: '\\text{balance: }\\ ?\\ \\text{dollars}', elevation: '\\text{elevation: }\\ ?\\ \\text{ft}', length: '\\text{bucket: }\\ ?\\ \\text{ft}',
  };
  return typed({ id: `story-${n}`, family: 'story', prompt, board: ask[kind]!, unit,
    solution: [`${expl} = ${S(H(right, 'dec'))} ${unit}.`, sgn(right) < 0 ? `The answer is negative: ${kind === 'balance' ? 'she owes money (an overdraft)' : kind === 'tempChange' ? 'the temperature went DOWN' : below[kind]}.` : 'The answer is positive.'],
  }, 'num', right, `Yes: ${S(H(right, 'dec'))} ${unit}.${sgn(right) < 0 ? ' The minus sign carries the meaning.' : ''}`, [
    { q: sgn(right) < 0 ? mag : null, mc: 'mc.integers.negative-result-rejected', say: `A negative answer is fine here, and it matters: ${S(H(right, 'dec'))} ${unit} ${kind === 'balance' ? 'means she owes money' : kind === 'tempChange' ? 'means it got colder' : `means ${below[kind]}`}.` },
    { q: sgn(right) > 0 ? qNeg(right) : null, mc: 'mc.integers.result-sign-has-no-contextual-meaning', say: `The sign has a meaning here. ${expl} = ${S(H(right, 'dec'))} ${unit}: positive.` },
  ], `${expl} = ${S(H(right, 'dec'))} ${unit}.`);
};
const signMeaning: Gen = (R, n) => {
  const ctx = pick(R, ['temp', 'money', 'elev'] as const);
  const m = int(R, 3, 40), s = R() < 0.6 ? -1 : 1;
  const unit = ctx === 'temp' ? '°F' : ctx === 'money' ? 'dollars' : 'ft';
  const v = s * m;
  const what = ctx === 'temp' ? 'The change in temperature' : ctx === 'money' ? 'The change in the balance' : 'The change in elevation';
  const up = ctx === 'temp' ? `It got ${m} °F warmer.` : ctx === 'money' ? `There is $${m} more than before.` : `It is ${m} ft higher than before.`;
  const down = ctx === 'temp' ? `It got ${m} °F colder.` : ctx === 'money' ? `There is $${m} less than before.` : `It is ${m} ft lower than before.`;
  const reading = ctx === 'temp' ? `The temperature is now ${fmtInt(v)} °F.` : ctx === 'money' ? `The balance is now ${money(v)}.` : `It is now at ${fmtInt(v)} ft.`;
  const opts: Opt[] = [
    { html: s > 0 ? up : down, ok: true, say: `Yes: a change of ${fmtInt(v)} ${unit} means ${s > 0 ? 'up' : 'down'} by ${m}.` },
    { html: s > 0 ? down : up, ok: false, mc: 'mc.integers.result-sign-has-no-contextual-meaning', say: `The sign tells the direction: ${s > 0 ? '+ means up' : '− means down'}. ${s > 0 ? up : down}` },
    { html: reading, ok: false, mc: 'mc.integers.sign-meaning-in-context', say: `A CHANGE is not a reading: it says how much it went ${s > 0 ? 'up' : 'down'}, not where it ended. ${s > 0 ? up : down}` },
  ];
  return choose({ id: `signMeaning-${n}`, family: 'signMeaning', prompt: `${what} is ${A(fmtInt(v) + (ctx === 'money' ? ' dollars' : ' ' + unit))}. What does that mean?`, board: `\\text{change} = ${fmtTexInt(v)}`,
    solution: ['A change says how much and which way; it is not a reading.', `${fmtInt(v)}: ${S(s > 0 ? up : down)}`] }, R, opts);
};

// =====================================================================================================================
export const GENS: Record<FamilyId, Gen> = {
  signRole, opposite, mat, inverse, jumpAdd, lineRead, flipJump, rewrite, distChange, mixedMeaning, whatMeans,
  addSame, addOpp, subInt, matStep, fracSigned, fracSign, mixedOps, decSigned, mixFormat, regroup, property,
  lineCheck, checkPick, checkJudge, story, signMeaning,
};
// keep the helpers referenced (tree-shaking aside, tsc flags unused imports)
void decQ; void TX;
