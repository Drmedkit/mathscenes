// items.ts: exercise families for "two-step equations" (secondary-t5-19), generated from templates, checked exactly,
// and every wrong answer classified against the misconception catalogue (math-curriculum-essentials ids).
// A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON.
// Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { balanceFits } from './balanceMaths';

export type FamilyId = 'chainOrder' | 'chainRun' | 'thinkNumber' | 'flowBack' | 'sameSolution' | 'safeMove' | 'writtenChain' | 'matchSteps'
  | 'solve' | 'balance' | 'negCheck' | 'firstMove' | 'writeEq' | 'storySolve' | 'storyFor' | 'meaning';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'chainOrder', name: 'Read the chain' },
  { id: 'chainRun', name: 'Run the chain' },
  { id: 'thinkNumber', name: 'Think of a number' },
  { id: 'flowBack', name: 'Work backward' },
  { id: 'sameSolution', name: 'Same solution?' },
  { id: 'safeMove', name: 'Moves that keep the solution' },
  { id: 'writtenChain', name: 'Write it as a chain' },
  { id: 'matchSteps', name: 'Arithmetic meets algebra' },
  { id: 'solve', name: 'Solve it' },
  { id: 'balance', name: 'Read the balance' },
  { id: 'negCheck', name: 'Check the sign' },
  { id: 'firstMove', name: 'Pick the move' },
  { id: 'writeEq', name: 'Story to equation' },
  { id: 'storySolve', name: 'Solve the story' },
  { id: 'storyFor', name: 'Equation to story' },
  { id: 'meaning', name: 'What the numbers mean' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** a picture the page can draw: the pan balance of px + q = r or p(x + q) = r (whole numbers) */
export interface BalancePic { p: number; q: number; r: number; grouped: boolean }
export interface EqItem extends Item { family: FamilyId; picture?: { balance: BalancePic } }
type Gen = (R: () => number, n: number, sg?: string) => EqItem;

// ---------- misconception ids ----------
export const MC = {
  symbolOrder: 'mc.properties.symbol-order-as-operation-chain',
  forward: 'mc.sequences-series.forward-op-when-backward',
  wrongOrder: 'mc.linear-equations.undoes-in-wrong-order',
  diffOps: 'mc.linear-equations.different-operations-preserve-equivalence',
  anySame: 'mc.linear-equations.any-same-operation-preserves',
  reSolve: 'mc.linear-equations.re-solves-equivalent-equations',
  runOn: 'mc.equal-sign.run-on-chain',
  unrelated: 'mc.linear-equations.arithmetic-algebraic-unrelated',
  combine: 'mc.expressions.combines-unlike-terms',
  someTerms: 'mc.linear-equations.scales-only-some-terms',
  transfer: 'mc.linear-equations.term-transfer-alone-guarantees-equivalence',
  detached: 'mc.integers.minus-sign-detached-from-term',
  signDrop: 'mc.integers.divide-by-coefficient-without-sign',
  rejectNeg: 'mc.reasoning-language.rejects-valid-context-solutions',
  decScale: 'mc.decimals.quotient-decimal-scale-not-preserved',
  partialCoef: 'mc.linear-equations.partial-coefficient-undo',
  visible: 'mc.equal-sign.operates-on-visible-numbers',
  partialDist: 'mc.properties.partial-distribution',
  lessThan: 'mc.expressions.reverses-less-than-subtraction',
  intermediate: 'mc.reasoning-language.reports-intermediate-result',
  bare: 'mc.reasoning-language.bare-number-without-meaning',
  omitConst: 'mc.expressions.omits-constant-contextual-meaning',
  mismatch: 'mc.reasoning-language.story-question-mismatch',
} as const;

// ---------- numbers ----------
const EPS = 1e-9;
const near = (a: number, b: number) => Math.abs(a - b) < EPS;
/** a value as text: whole, or up to 3 decimals; money always 2 decimals */
export function num(v: number, money = false): string {
  const r = Math.round(v * 1000) / 1000;
  if (money && !Number.isInteger(r)) return r.toFixed(2);
  return String(r);
}
/** HTML text of a number (a real minus sign) */
export const H = (v: number, money = false) => (v < 0 ? '−' + num(-v, money) : num(v, money));
/** TeX of a number */
const T = (v: number, money = false) => (v < 0 ? '-' + num(-v, money) : num(v, money));
const X = '<i>x</i>';
const round3 = (v: number) => Math.round(v * 1000) / 1000;

// ---------- equations ----------
/** a two-step equation: lin  P·x + Q = R   or   grp  P·(x + Q) = R. `look` says how it is written. */
export interface Eq {
  kind: 'lin' | 'grp';
  look: 'px+q' | 'q+px' | 'r=px+q' | 'q-px' | 'px-(-q)' | 'x/p+q' | 'frac' | 'dec' | 'p(x+q)' | 'frac(x+q)';
  P: number; Q: number; R: number; x: number;
  /** P = a/b written as a fraction */ a?: number; b?: number;
  money?: boolean;
  tex: string; html: string;
}
function coefTex(e: { P: number; a?: number; b?: number; look: Eq['look']; money?: boolean }): string {
  if (e.look === 'frac' || e.look === 'frac(x+q)') return `${e.P < 0 ? '-' : ''}\\tfrac{${e.a}}{${e.b}}`;
  if (e.P === 1) return ''; if (e.P === -1) return '-';
  return T(e.P, e.money);
}
function coefHtml(e: { P: number; a?: number; b?: number; look: Eq['look']; money?: boolean }): string {
  if (e.look === 'frac' || e.look === 'frac(x+q)') return `${e.P < 0 ? '−' : ''}${fr(e.a!, e.b!)}`;
  if (e.P === 1) return ''; if (e.P === -1) return '−';
  return H(e.P, e.money);
}
const sgnT = (v: number, money = false) => (v < 0 ? `- ${num(-v, money)}` : `+ ${num(v, money)}`);
const sgnH = (v: number, money = false) => (v < 0 ? `− ${num(-v, money)}` : `+ ${num(v, money)}`);

export function makeEq(kind: Eq['kind'], look: Eq['look'], P: number, Q: number, x: number, o: { a?: number; b?: number; money?: boolean } = {}): Eq {
  const R = round3(kind === 'lin' ? P * x + Q : P * (x + Q));
  const e = { kind, look, P, Q, R, x, ...o };
  const m = !!o.money;
  let tex = '', html = '';
  const cT = coefTex(e), cH = coefHtml(e);
  switch (look) {
    case 'px+q': case 'frac': case 'dec': tex = `${cT}x ${sgnT(Q, m)} = ${T(R, m)}`; html = `${cH}${X} ${sgnH(Q, m)} = ${H(R, m)}`; break;
    case 'q+px': tex = `${T(Q)} + ${cT}x = ${T(R)}`; html = `${H(Q)} + ${cH}${X} = ${H(R)}`; break;
    case 'r=px+q': tex = `${T(R)} = ${cT}x ${sgnT(Q)}`; html = `${H(R)} = ${cH}${X} ${sgnH(Q)}`; break;
    case 'q-px': tex = `${T(Q)} - ${T(-P)}x = ${T(R)}`; html = `${H(Q)} − ${H(-P)}${X} = ${H(R)}`; break;
    case 'px-(-q)': tex = `${cT}x - (-${num(Q)}) = ${T(R)}`; html = `${cH}${X} − (−${num(Q)}) = ${H(R)}`; break;
    case 'x/p+q': tex = `\\frac{x}{${num(1 / P)}} ${sgnT(Q)} = ${T(R)}`; html = `${fr(X, num(1 / P))} ${sgnH(Q)} = ${H(R)}`; break;
    case 'p(x+q)': case 'frac(x+q)': tex = `${cT}(x ${sgnT(Q)}) = ${T(R)}`; html = `${cH}(${X} ${sgnH(Q)}) = ${H(R)}`; break;
  }
  return { ...e, tex, html };
}
/** the worked solution lines (HTML), matched to the balance: undo the last step first, then the first, then check */
export function solveLines(e: Eq): string[] {
  const m = !!e.money, cH = coefHtml(e) || '1';
  if (e.kind === 'grp') {
    const inner = round3(e.R / e.P);
    const undoP = e.look === 'frac(x+q)' ? `multiply both sides by ${num(e.b! / e.a!)}` : `divide both sides by ${H(e.P)}`;
    return [
      `Last step done to ${X}: × ${cH}. Undo it first: ${undoP}. ${X} ${sgnH(e.Q)} = ${H(inner)}.`,
      `Then undo the ${sgnH(e.Q)}: ${e.Q > 0 ? 'subtract' : 'add'} ${num(Math.abs(e.Q))} on both sides. ${X} = <b class="s">${H(e.x)}</b>.`,
      `Check: ${cH}(${H(e.x)} ${sgnH(e.Q)}) = ${H(e.R)}. ✓`,
    ];
  }
  const px = round3(e.R - e.Q);
  const undoP = e.look === 'x/p+q' ? `multiply both sides by ${num(1 / e.P)}` : e.look === 'frac' ? `multiply both sides by ${e.P < 0 ? '−' : ''}${fr(e.b!, e.a!)}` : `divide both sides by ${H(e.P, m)}`;
  const pxH = e.look === 'x/p+q' ? fr(X, num(1 / e.P)) : `${coefHtml(e)}${X}`;
  const xs = e.x < 0 ? `(${H(e.x)})` : H(e.x);
  const pre = e.look === 'q-px' ? [`${e.html.split(' = ')[0]} is the same as ${coefHtml(e)}${X} + ${H(e.Q)}.`]
    : e.look === 'q+px' ? [`${e.html.split(' = ')[0]} is the same as ${coefHtml(e)}${X} + ${H(e.Q)}.`]
      : e.look === 'px-(-q)' ? [`− (−${num(e.Q)}) is the same as + ${num(e.Q)}: ${coefHtml(e)}${X} + ${num(e.Q)} = ${H(e.R)}.`]
        : e.look === 'r=px+q' ? [`${e.html} is the same as ${coefHtml(e)}${X} + ${H(e.Q)} = ${H(e.R)}.`] : [];
  return [...pre,
    `Last step done to ${X}: ${sgnH(e.Q, m)}. Undo it first: ${e.Q > 0 ? 'subtract' : 'add'} ${num(Math.abs(e.Q), m)} on both sides. ${pxH} = ${H(px, m)}.`,
    `Then undo the first step: ${undoP}. ${X} = <b class="s">${H(e.x)}</b>.`,
    `Check: ${e.look === 'x/p+q' ? `${xs} ÷ ${num(1 / e.P)}` : `${cH} · ${xs}`} ${sgnH(e.Q, m)} = ${H(e.R, m)}. ✓`,
  ];
}

/** classify a number typed as the solution of e (the shared classifier of every "solve" item) */
export function classifySolve(e: Eq, v: number, unit = ''): Verdict {
  const u = unit ? ' ' + unit : '';
  if (!Number.isFinite(v)) return { ok: false, say: 'Type a number (a decimal is fine).' };
  if (near(v, e.x)) return { ok: true, say: `Yes: ${X} = ${H(e.x)}${u}. Check: put ${H(e.x)} back in and both sides are ${H(e.R, e.money)}.` };
  const cands: [number, string, string][] = [];
  const { P, Q, R } = e;
  if (e.kind === 'lin') {
    const px = R - Q;
    if (e.look === 'q-px' || e.look === 'px-(-q)') {
      const dQ = e.look === 'px-(-q)' ? -Q : Q, dP = e.look === 'q-px' ? -P : P;
      cands.push([(R - dQ) / dP, MC.detached, `The minus sign belongs to the term after it. In ${e.html} that sign changes what you undo.`]);
    }
    if (P < 0) cands.push([px / -P, MC.signDrop, `To undo × ${H(P)} you divide by ${H(P)}, sign and all: ${H(px)} ÷ ${H(P)} = ${H(e.x)}.`]);
    cands.push([R / P - Q, MC.wrongOrder, `The ${sgnH(Q, e.money)} was the LAST thing done to ${X}, so it comes off FIRST. Then undo the multiply.`]);
    cands.push([(R + Q) / P, MC.forward, `Working backward, the ${sgnH(Q, e.money)} is undone by its opposite: ${Q > 0 ? 'subtract' : 'add'} ${num(Math.abs(Q), e.money)}, don't ${Q > 0 ? 'add' : 'subtract'} it again.`]);
    if (e.look !== 'x/p+q') cands.push([px * P, MC.forward, `${X} was multiplied by ${H(P, e.money)}. Undo it with the opposite operation, not the same one again.`]);
    if (e.look === 'frac' && e.a! > 1) {
      cands.push([px / (e.a! * Math.sign(P)), MC.partialCoef, `${fr(e.a!, e.b!)} is two steps, × ${e.a} and ÷ ${e.b}. Undo both: multiply by ${fr(e.b!, e.a!)}.`]);
      cands.push([(px * e.b!) * Math.sign(P), MC.partialCoef, `${fr(e.a!, e.b!)} is two steps, × ${e.a} and ÷ ${e.b}. Undo both: multiply by ${fr(e.b!, e.a!)}.`]);
    }
    if (e.look === 'x/p+q') cands.push([px * P, MC.visible, `${fr(X, num(1 / P))} means ${X} divided by ${num(1 / P)}. To undo a divide, multiply.`]);
    if (P !== 1) cands.push([px, MC.intermediate, `${H(px, e.money)} is ${e.look === 'x/p+q' ? fr(X, num(1 / P)) : coefHtml(e) + X}, not ${X} yet. One more step: undo the multiply.`]);
    if (e.look === 'dec' || e.money) { cands.push([e.x * 10, MC.decScale, `Check the decimal point: ${H(P, e.money)} × ${H(v)} is not ${H(px, e.money)}.`]); cands.push([e.x / 10, MC.decScale, `Check the decimal point: ${H(P, e.money)} × ${H(v)} is not ${H(px, e.money)}.`]); }
    if (Number.isInteger(P) && P > 0 && Q > 0 && e.look !== 'x/p+q') cands.push([R / (P + Q), MC.combine, `${H(P)}${X} and ${H(Q)} are not like terms: you can't add them into ${H(P + Q)}${X}.`]);
  } else {
    const inner = R / P;
    if (P < 0) cands.push([R / -P - Q, MC.signDrop, `Divide by ${H(P)}, sign and all: ${H(R)} ÷ ${H(P)} = ${H(round3(inner))}.`]);
    cands.push([(R - Q) / P, MC.wrongOrder, `The × ${coefHtml(e)} is done LAST (after the bracket), so it comes off FIRST: ${e.look === 'frac(x+q)' ? 'multiply' : 'divide'} both sides, then undo the ${sgnH(Q)}.`]);
    if (e.look === 'frac(x+q)') cands.push([R * P - Q, MC.forward, `Undo × ${fr(e.a!, e.b!)} with × ${num(e.b! / e.a!)}, not by halving again.`]);
    cands.push([inner + Q, MC.forward, `Working backward, undo the ${sgnH(Q)} with its opposite.`]);
    cands.push([inner, MC.intermediate, `${H(round3(inner))} is ${X} ${sgnH(Q)}, not ${X} yet. One more step.`]);
  }
  for (const [c, mc, say] of cands) if (Number.isFinite(c) && !near(c, e.x) && near(v, c)) return { ok: false, mc, say };
  return { ok: false, say: `Not quite. Undo the last step first, then the first step: ${X} = ${H(e.x)}. Check it in ${e.html}.` };
}

// ---------- solve: the sub-goal's number ranges ----------
export function eqFor(R: () => number, sg: string): Eq {
  if (sg === 'solve-signed') {
    const f = pick(R, ['negP', 'subNeg', 'qMinus', 'negX', 'zeroX'] as const);
    for (;;) {
      let e: Eq;
      const p = int(R, 2, 10), q = int(R, 1, 30) * (R() < 0.5 ? -1 : 1);
      if (f === 'negP') e = makeEq('lin', 'px+q', -p, q, int(R, -10, 10) || 3);
      else if (f === 'subNeg') e = makeEq('lin', 'px-(-q)', p * (R() < 0.2 ? -1 : 1), int(R, 1, 20), int(R, -10, 10) || -2);
      else if (f === 'qMinus') e = makeEq('lin', 'q-px', -p, int(R, 1, 30), int(R, -10, 10) || -4);
      else if (f === 'negX') e = makeEq('lin', 'px+q', p, q, -int(R, 1, 10));
      else e = makeEq('lin', 'px+q', p * (R() < 0.3 ? -1 : 1), q, 0);
      if (Math.abs(e.R) <= 100 && e.R !== 0 || (f === 'zeroX' && Math.abs(e.R) <= 100)) return e;
    }
  }
  if (sg === 'solve-rational') {
    const f = pick(R, ['over', 'frac', 'dec', 'money'] as const);
    if (f === 'over') { const p = pick(R, [2, 3, 4, 5, 10]); const k = int(R, -5, 9) || 2; return makeEq('lin', 'x/p+q', 1 / p, int(R, 1, 9) * (R() < 0.35 ? -1 : 1), p * k); }
    if (f === 'frac') {
      const b = pick(R, [2, 3, 4, 5]); const a = pick(R, [1, 2, 3, 4].filter(a => a < b && gcd(a, b) === 1).concat(b === 2 ? [3] : []));
      const k = int(R, 1, 6) * (R() < 0.2 ? -1 : 1);
      return makeEq('lin', 'frac', a / b, int(R, 1, 9) * (R() < 0.4 ? -1 : 1), b * k, { a, b });
    }
    if (f === 'dec') {
      const d = pick(R, [0.5, 0.2, 1.5, 2.5, 1.2, 0.25, 0.75]);
      const tenths = [0.5, 0.2, 1.5, 2.5, 1.2].includes(d) && R() < 0.5;
      const x = tenths ? int(R, 11, 99) / 10 : int(R, 1, 12);
      return makeEq('lin', 'dec', d, int(R, 1, 49) / 10 * (R() < 0.25 ? -1 : 1), x);
    }
    const d = pick(R, [1.25, 2.25, 2.5, 3.75, 4.5, 1.75]);
    return makeEq('lin', 'dec', d, pick(R, [1.5, 2, 2.5, 3.25, 4.5, 5.75, 6]), int(R, 2, 9), { money: true });
  }
  if (sg === 'solve-grouped') {
    const f = pick(R, ['whole', 'whole', 'dec', 'neg', 'half'] as const);
    for (;;) {
      if (f === 'whole') { const e = makeEq('grp', 'p(x+q)', int(R, 2, 9), int(R, 1, 12) * (R() < 0.25 ? -1 : 1), int(R, 1, 12)); if (e.R > 0 && e.R <= 100 && e.x + e.Q !== 0) return e; }
      else if (f === 'dec') { const e = makeEq('grp', 'p(x+q)', pick(R, [2, 4, 6, 10]), pick(R, [-1.5, -0.5, 0.5, 1.5, 2.5]), int(R, 1, 12)); if (e.R > 0 && Number.isInteger(e.R)) return e; }
      else if (f === 'neg') { const e = makeEq('grp', 'p(x+q)', -int(R, 2, 6), int(R, 1, 6), int(R, -10, 10)); if (e.R !== 0 && Math.abs(e.R) <= 100) return e; }
      else { const b = int(R, 2, 4), s = int(R, 2, 9), q = int(R, 1, 9), x = b * s - q; if (x >= 1) return makeEq('grp', 'frac(x+q)', 1 / b, q, x, { a: 1, b }); }
    }
  }
  // solve-whole-positive (and the default): p 2..10, constants within 100, whole solutions
  for (;;) {
    const p = int(R, 2, 10), x = int(R, 1, 12), q = int(R, 1, 40);
    const look = pick(R, ['px+q', 'px+q', 'pxmq', 'q+px', 'r=px+q'] as const);
    const e = look === 'pxmq' ? makeEq('lin', 'px+q', p, -q, x) : makeEq('lin', look, p, q, x);
    if (e.R >= 1 && e.R <= 100) return e;
  }
}
function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }

function balancePic(e: Eq): BalancePic | undefined {
  if (!Number.isInteger(e.P) || !Number.isInteger(e.Q) || e.P < 1 || e.Q < 0 || e.x < 1) return undefined;
  if (e.kind === 'lin' && !['px+q', 'q+px', 'r=px+q'].includes(e.look)) return undefined;
  const grouped = e.kind === 'grp';
  return balanceFits(e.P, e.Q, e.R, grouped) ? { p: e.P, q: e.Q, r: e.R, grouped } : undefined;
}

// ---------- choice helper: right + wrongs, shuffled, unique ----------
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<EqItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): EqItem {
  const o = shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i },
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const numItem = (base: Omit<EqItem, 'input' | 'answer' | 'check'>, ans: number, check: (v: number) => Verdict): EqItem => ({
  ...base, input: 'num', answer: { kind: 'num', v: ans },
  check: (r: Response) => (r.kind === 'num' ? check(r.v) : { ok: false, say: 'Type a number.' }),
});

// ---------- 1. op-chain ----------
type Expr = 'px+q' | 'px-q' | 'p(x+q)' | 'x/p+q' | 'q+px';
function exprOf(f: Expr, p: number, q: number): { tex: string; html: string; run: (x: number) => number } {
  switch (f) {
    case 'px+q': return { tex: `${p}x + ${q}`, html: `${p}${X} + ${q}`, run: x => p * x + q };
    case 'px-q': return { tex: `${p}x - ${q}`, html: `${p}${X} − ${q}`, run: x => p * x - q };
    case 'p(x+q)': return { tex: `${p}(x + ${q})`, html: `${p}(${X} + ${q})`, run: x => p * (x + q) };
    case 'x/p+q': return { tex: `\\frac{x}{${p}} + ${q}`, html: `${fr(X, p)} + ${q}`, run: x => x / p + q };
    case 'q+px': return { tex: `${q} + ${p}x`, html: `${q} + ${p}${X}`, run: x => q + p * x };
  }
}
const chain = (a: string, b: string) => `${X} → ${a} → ${b}`;

const chainOrder: Gen = (R, n) => {
  const f = pick(R, ['px+q', 'px-q', 'p(x+q)', 'p(x+q)', 'x/p+q', 'q+px', 'q+px'] as const);
  const p = int(R, 2, 10); let q = int(R, 1, 20); if (q === p) q++;
  const E = exprOf(f, p, q);
  const M = `× ${p}`, Dv = `÷ ${p}`, A = `+ ${q}`, S = `− ${q}`, swap = chain(`× ${q}`, `+ ${p}`);
  let opts: Opt[];
  const sayRight = (s: string) => `Yes. ${s}`;
  if (f === 'px+q') opts = [
    { t: chain(M, A), ok: true, say: sayRight(`Multiplication comes before addition: ${X} is multiplied by ${p}, then ${q} is added.`) },
    { t: chain(A, M), say: `That chain builds ${p}(${X} + ${q}): the brackets would make the + ${q} come first.` },
    { t: swap, say: `${p} multiplies ${X} (it is written right next to it), and ${q} is added.` },
  ];
  else if (f === 'px-q') opts = [
    { t: chain(M, S), ok: true, say: sayRight(`${X} is multiplied by ${p}, then ${q} is taken away.`) },
    { t: chain(S, M), say: `Taking ${q} away first would be ${p}(${X} − ${q}). Without brackets the multiply comes first.` },
    { t: chain(M, A), say: `Look at the sign: ${q} is subtracted, not added.` },
  ];
  else if (f === 'p(x+q)') opts = [
    { t: chain(A, M), ok: true, say: sayRight(`The brackets come first: add ${q}, then multiply the whole bracket by ${p}.`) },
    { t: chain(M, A), mc: MC.symbolOrder, say: `Reading left to right skips the brackets. In ${E.html} the + ${q} happens first, then everything is multiplied by ${p}.` },
    { t: swap, say: `${p} multiplies the whole bracket, and ${q} is added inside it.` },
  ];
  else if (f === 'x/p+q') opts = [
    { t: chain(Dv, A), ok: true, say: sayRight(`${X} is divided by ${p}, then ${q} is added.`) },
    { t: chain(A, Dv), say: `Adding first would need brackets: ${fr(`${X} + ${q}`, p)}. Here only ${X} is divided.` },
    { t: chain(M, A), say: `${fr(X, p)} means ${X} divided by ${p}, not times ${p}.` },
  ];
  else opts = [
    { t: chain(M, A), ok: true, say: sayRight(`${q} + ${p}${X} is the same as ${p}${X} + ${q}: multiply first, then add ${q}.`) },
    { t: chain(A, M), mc: MC.symbolOrder, say: `The ${q} is written first, but it is added last: multiplication comes before addition. ${q} + ${p}${X} = ${p}${X} + ${q}.` },
    { t: swap, say: `${p} multiplies ${X} (it is written right next to it), and ${q} is added.` },
  ];
  return choiceItem(R, {
    id: `chainOrder-${n}`, family: 'chainOrder',
    prompt: `Start with ${X}. Which chain of operations builds <b>${E.html}</b>?`, board: E.tex,
    solution: [opts.find(o => o.ok)!.say.replace(/^Yes\. /, ''), `So: ${opts.find(o => o.ok)!.t}.`],
  }, opts);
};

const chainRun: Gen = (R, n) => {
  for (;;) {
    const f = pick(R, ['px+q', 'px-q', 'p(x+q)', 'p(x+q)', 'x/p+q', 'q+px'] as const);
    const p = int(R, 2, 10), q = int(R, 1, 20), x = f === 'x/p+q' ? p * int(R, 1, 6) : int(R, 1, 10);
    const E = exprOf(f, p, q), v = E.run(x);
    if (!Number.isInteger(v) || v < 0 || v > 50) continue;
    const misread = f === 'p(x+q)' ? p * x + q : f === 'q+px' ? (q + x) * p : f === 'px+q' ? p * (x + q) : f === 'px-q' ? p * (x - q) : (x + q) / p;
    const steps = f === 'p(x+q)' ? [`${x} + ${q} = ${x + q}`, `${x + q} × ${p} = ${v}`] : f === 'x/p+q' ? [`${x} ÷ ${p} = ${x / p}`, `${x / p} + ${q} = ${v}`]
      : [`${x} × ${p} = ${p * x}`, f === 'px-q' ? `${p * x} − ${q} = ${v}` : `${p * x} + ${q} = ${v}`];
    return numItem({
      id: `chainRun-${n}`, family: 'chainRun',
      prompt: `Run the chain for ${X} = <b class="a">${x}</b>. What is <b>${E.html}</b>?`, board: `${E.tex} \\quad x = ${x}`,
      solution: [...steps.map(s => s + '.'), `So ${E.html} = <b class="s">${v}</b> when ${X} = ${x}.`],
    }, v, w => {
      if (w === v) return { ok: true, say: `Yes: ${steps.join(', then ')}.` };
      if (w === misread && (f === 'p(x+q)' || f === 'q+px')) return { ok: false, mc: MC.symbolOrder, say: f === 'p(x+q)' ? `The brackets come first: ${x} + ${q} = ${x + q}, then × ${p} = ${v}.` : `Multiply first, even though ${q} is written first: ${p} × ${x} = ${p * x}, then + ${q} = ${v}.` };
      return { ok: false, say: `Do the chain in order: ${steps.join(', then ')}.` };
    });
  }
};

// ---------- 2. backtrack ----------
type Op = { k: '×' | '+' | '−' | '÷'; v: number };
const fwd = (o: Op, a: number) => (o.k === '×' ? a * o.v : o.k === '+' ? a + o.v : o.k === '−' ? a - o.v : a / o.v);
const inv = (o: Op, a: number) => (o.k === '×' ? a / o.v : o.k === '+' ? a - o.v : o.k === '−' ? a + o.v : a * o.v);
const opWord = (o: Op) => (o.k === '×' ? `multiply it by ${o.v}` : o.k === '+' ? `add ${o.v}` : o.k === '−' ? `subtract ${o.v}` : `divide it by ${o.v}`);
const invWord = (o: Op) => (o.k === '×' ? `÷ ${o.v}` : o.k === '+' ? `− ${o.v}` : o.k === '−' ? `+ ${o.v}` : `× ${o.v}`);
const opTex = (o: Op) => (o.k === '×' ? `\\times ${o.v}` : o.k === '+' ? `+${o.v}` : o.k === '−' ? `-${o.v}` : `\\div ${o.v}`);
const NAMES = ['Dev', 'Ana', 'Kai', 'Rosa', 'Theo', 'Mia', 'Jordan', 'Lena', 'Sam', 'Noor'];
function chainPuzzle(R: () => number): { o1: Op; o2: Op; x: number; mid: number; r: number } {
  for (;;) {
    const p = int(R, 2, 9), q = int(R, 1, 30), x = int(R, 1, 20);
    const shape = pick(R, ['×+', '×−', '+×', '−×', '÷+', '+÷'] as const);
    const o1: Op = shape[0] === '×' ? { k: '×', v: p } : shape[0] === '÷' ? { k: '÷', v: p } : shape[0] === '+' ? { k: '+', v: q } : { k: '−', v: q };
    const o2: Op = shape[1] === '+' ? { k: '+', v: q } : shape[1] === '−' ? { k: '−', v: q } : shape[1] === '×' ? { k: '×', v: p } : { k: '÷', v: p };
    const mid = fwd(o1, x), r = fwd(o2, mid);
    if (Number.isInteger(mid) && Number.isInteger(r) && mid >= 0 && r >= 0 && r <= 100) return { o1, o2, x, mid, r };
  }
}
const thinkNumber: Gen = (R, n) => {
  const { o1, o2, x, mid, r } = chainPuzzle(R), who = pick(R, NAMES);
  const wrongOrder = inv(o2, inv(o1, r)), fwdLast = inv(o1, fwd(o2, r));
  const verb = (o: Op) => (o.k === '×' ? `multiplies it by ${o.v}` : o.k === '+' ? `adds ${o.v}` : o.k === '−' ? `subtracts ${o.v}` : `divides it by ${o.v}`);
  const sol = [`Undo the last step first: ${r} ${invWord(o2)} = ${mid}.`, `Then undo the first step: ${mid} ${invWord(o1)} = <b class="s">${x}</b>.`, `Check: ${x} → ${opTex(o1).replace('\\times', '×').replace('\\div', '÷')} → ${mid} → ${opTex(o2).replace('\\times', '×').replace('\\div', '÷')} → ${r}. ✓`];
  return numItem({
    id: `thinkNumber-${n}`, family: 'thinkNumber',
    prompt: `${who} thinks of a number, <b>${verb(o1)}</b>, then <b>${verb(o2).replace(' it', '')}</b>, and gets <b class="a">${r}</b>. What was the number?`,
    board: `x \\xrightarrow{${opTex(o1)}} \\square \\xrightarrow{${opTex(o2)}} ${r}`, solution: sol,
  }, x, v => {
    if (v === x) return { ok: true, say: `Yes: ${r} ${invWord(o2)} = ${mid}, then ${mid} ${invWord(o1)} = ${x}.` };
    if (v === mid) return { ok: false, mc: MC.intermediate, say: `${mid} is the number in the middle of the chain. One more step back: ${mid} ${invWord(o1)} = ${x}.` };
    if (Number.isInteger(wrongOrder) && v === wrongOrder) return { ok: false, mc: MC.wrongOrder, say: `Work backward from the END: the last step (${opWord(o2).replace(' it', '')}) is undone first, then the first step.` };
    if (Number.isInteger(fwdLast) && v === fwdLast) return { ok: false, mc: MC.forward, say: `Going backward, each step is undone by its opposite: ${invWord(o2)}, not ${opTex(o2).replace('\\times', '×').replace('\\div', '÷')} again.` };
    return { ok: false, say: `Undo the chain from the end: ${r} ${invWord(o2)} = ${mid}, then ${invWord(o1)} = ${x}.` };
  });
};
const flowBack: Gen = (R, n) => {
  const { o1, o2, x, mid, r } = chainPuzzle(R);
  const fwdLast = fwd(o2, r), wrongFirst = inv(o1, r);
  return {
    id: `flowBack-${n}`, family: 'flowBack', input: 'pair', pairLead: '□ =', pairOp: 'x =',
    prompt: `Work the chain backward from <b class="a">${r}</b>. What number is in the box, and what is ${X}?`,
    board: `x \\xrightarrow{${opTex(o1)}} \\square \\xrightarrow{${opTex(o2)}} ${r}`,
    solution: [`The last arrow is ${opTex(o2).replace('\\times', '×').replace('\\div', '÷')}. Backward: ${r} ${invWord(o2)} = ${mid}, so the box is ${mid}.`, `The first arrow is ${opTex(o1).replace('\\times', '×').replace('\\div', '÷')}. Backward: ${mid} ${invWord(o1)} = <b class="s">${x}</b>.`],
    answer: { kind: 'pair', x: mid, y: x },
    check: (rr: Response) => {
      if (rr.kind !== 'pair') return { ok: false, say: 'Fill in both boxes.' };
      if (rr.x === mid && rr.y === x) return { ok: true, say: `Yes: ${r} ${invWord(o2)} = ${mid}, then ${mid} ${invWord(o1)} = ${x}.` };
      if (rr.x === fwdLast) return { ok: false, mc: MC.forward, say: `Going backward, undo ${opTex(o2).replace('\\times', '×').replace('\\div', '÷')} with its opposite: ${r} ${invWord(o2)} = ${mid}.` };
      if (Number.isInteger(wrongFirst) && rr.x === wrongFirst) return { ok: false, mc: MC.wrongOrder, say: `Start at the END of the chain: the box is what you had before the last arrow. ${r} ${invWord(o2)} = ${mid}.` };
      if (rr.x === mid) return { ok: false, say: `The box is right (${mid}). Now undo the first arrow: ${mid} ${invWord(o1)} = ${x}.` };
      return { ok: false, say: `Backward: ${r} ${invWord(o2)} = ${mid}, then ${mid} ${invWord(o1)} = ${x}.` };
    },
  };
};

// ---------- 3. equivalent equations ----------
const sameSolution: Gen = (R, n) => {
  for (;;) {
    const p = int(R, 2, 9), x = int(R, 1, 9), q = int(R, 1, 15), r = p * x + q, k = int(R, 2, 3), a = int(R, 2, 9);
    const e = makeEq('lin', 'px+q', p, q, x);
    const right = pick(R, [
      { t: `${p}${X} = ${r - q}`, say: `Yes: subtract ${q} from both sides. Both pans lose ${q}, so they stay level and ${X} is still ${x}.` },
      { t: `${k * p}${X} + ${k * q} = ${k * r}`, say: `Yes: multiply both sides by ${k}. Every term on both sides is ${k} times as big, so ${X} is still ${x}.` },
      { t: `${p}${X} + ${q + a} = ${r + a}`, say: `Yes: add ${a} to both sides. Both pans gain ${a}, so they stay level and ${X} is still ${x}.` },
    ]);
    const wrongs: Opt[] = shuffle(R, [
      { t: `${p}${X} = ${r}`, mc: MC.diffOps, say: `The ${q} came off the left side only. One pan changed, the other didn't, so it no longer balances at ${X} = ${x}.` },
      { t: `${p}${X} = ${r + q}`, mc: MC.transfer, say: `"Moving" the + ${q} across doesn't keep it true. Take ${q} off BOTH sides: ${p}${X} = ${r - q}.` },
      { t: `${k * p}${X} + ${q} = ${k * r}`, mc: MC.someTerms, say: `Multiplying both sides by ${k} means EVERY term, the ${q} too: ${k * p}${X} + ${k * q} = ${k * r}.` },
      { t: `${p}${X} + ${q} = ${r - q}`, mc: MC.diffOps, say: `The ${q} came off the right side only. The pans no longer balance at ${X} = ${x}.` },
    ]).slice(0, 2);
    const opts = [{ ...right, ok: true }, ...wrongs];
    if (new Set(opts.map(o => o.t)).size !== 3) continue;
    const pic = balancePic(e);
    return choiceItem(R, {
      id: `sameSolution-${n}`, family: 'sameSolution',
      prompt: `Which equation has the same solution as <b>${e.html}</b>?`, board: e.tex,
      ...(pic ? { picture: { balance: pic } } : {}),
      solution: [`Same move on both sides keeps the solution: add, subtract, multiply or divide BOTH sides by the same number (not 0).`, `${e.html} has ${X} = ${x}. ${right.t} comes from it by one such move.`],
    }, opts);
  }
};
const safeMove: Gen = (R, n) => {
  const p = int(R, 2, 9), x = int(R, 1, 9), q = int(R, 1, 15), e = makeEq('lin', 'px+q', p, q, x), k = int(R, 2, 9);
  const v = pick(R, ['zero', 'which', 'resolve', 'divzero'] as const);
  const base = { id: `safeMove-${n}`, family: 'safeMove' as const, board: e.tex };
  if (v === 'zero') return choiceItem(R, {
    ...base, prompt: `${pick(R, NAMES)} multiplies both sides of <b>${e.html}</b> by 0 and gets 0 = 0. Does 0 = 0 have the same solution?`,
    solution: [`0 = 0 is true for EVERY number, so it no longer tells you ${X} = ${x}.`, `Multiplying by 0 can't be undone (you can't divide by 0), so it is not a safe move.`],
  }, [
    { t: `No. Every number makes 0 = 0 true, so the solution ${X} = ${x} is lost.`, ok: true, say: `Right. A safe move must be undoable. × 0 can't be undone, and 0 = 0 doesn't pin down ${X}.` },
    { t: 'Yes. The same thing was done to both sides.', mc: MC.anySame, say: `The same move on both sides is only safe if you can undo it. × 0 can't be undone: 0 = 0 is true for every ${X}, not just ${x}.` },
    { t: 'Yes. 0 = 0 is a true equation.', mc: MC.anySame, say: `0 = 0 is true, but for EVERY number. It has lost the information that ${X} = ${x}.` },
  ]);
  if (v === 'which') return choiceItem(R, {
    ...base, prompt: `Which move, done to <b>${e.html}</b>, always keeps the same solution?`,
    solution: [`Multiplying both sides by ${k} can be undone (divide by ${k}), so the solution stays ${X} = ${x}.`],
  }, [
    { t: `Multiply both sides by ${k}.`, ok: true, say: `Yes: it can be undone by dividing by ${k}, so the solution stays ${X} = ${x}.` },
    { t: 'Multiply both sides by 0.', mc: MC.anySame, say: `× 0 can't be undone: you get 0 = 0, true for every number. The solution is lost.` },
    { t: `Add ${k} to the left side only.`, mc: MC.diffOps, say: `One side only: the left pan gets heavier and the balance tips. Both sides must change the same way.` },
  ]);
  if (v === 'resolve') return choiceItem(R, {
    ...base, prompt: `Without solving: do <b>${e.html}</b> and <b>${p}${X} = ${p * x}</b> have the same solution?`,
    solution: [`Subtract ${q} from both sides of ${e.html}: you get ${p}${X} = ${p * x}. A safe move, so the solution is the same.`],
  }, [
    { t: `Yes: subtracting ${q} from both sides of the first gives the second.`, ok: true, say: `Yes. One safe move turns one into the other, so they share the solution (${X} = ${x}).` },
    { t: 'You can only tell by solving both.', mc: MC.reSolve, say: `You can solve both, but you don't have to: subtracting ${q} from both sides of the first gives the second, and a safe move keeps the solution.` },
    { t: `No: the second one has no + ${q}.`, mc: MC.diffOps, say: `The + ${q} came off BOTH sides (${e.R} − ${q} = ${p * x}), so the balance is kept.` },
  ]);
  return choiceItem(R, {
    ...base, prompt: `Can you divide both sides of <b>${e.html}</b> by 0?`,
    solution: ['Dividing by 0 is undefined: there is no number that times 0 gives a nonzero number.', 'Safe moves use a nonzero number.'],
  }, [
    { t: 'No: dividing by 0 is undefined.', ok: true, say: 'Right. There is no answer to a number ÷ 0, so it is never a move you can make.' },
    { t: 'Yes: it is the same on both sides.', mc: MC.anySame, say: 'The same on both sides is not enough: dividing by 0 has no answer at all.' },
    { t: 'Yes, and it gives 0 = 0.', mc: MC.anySame, say: 'Dividing by 0 does not give 0: it has no answer. (Multiplying by 0 gives 0 = 0, and loses the solution.)' },
  ]);
};

// ---------- 4. record-chain ----------
function wholeEq(R: () => number, grouped: boolean): Eq {
  for (;;) {
    const e = grouped ? makeEq('grp', 'p(x+q)', int(R, 2, 9), int(R, 1, 9), int(R, 1, 10)) : makeEq('lin', 'px+q', int(R, 2, 9), int(R, 1, 30), int(R, 1, 12));
    if (e.R <= 100) return e;
  }
}
const writtenChain: Gen = (R, n) => {
  const g = R() < 0.35, e = wholeEq(R, g), p = e.P, q = e.Q, r = e.R, x = e.x;
  const mid = g ? r / p : r - q;
  const midH = g ? `${X} + ${q} = ${mid}` : `${p}${X} = ${mid}`;
  const right = `${e.html}<br>${midH}<br>${X} = ${x}`;
  const runOn = g ? `${e.html} ÷ ${p} = ${mid} − ${q} = ${x}` : `${e.html} − ${q} = ${mid} ÷ ${p} = ${x}`;
  const fw = g ? `${e.html}<br>${X} + ${q} = ${r * p}<br>${X} = ${r * p - q}` : `${e.html}<br>${p}${X} = ${r + q}<br>${X} = ${(r + q) % p === 0 ? (r + q) / p : fr(r + q, p)}`;
  return choiceItem(R, {
    id: `writtenChain-${n}`, family: 'writtenChain',
    prompt: `Which is a correct way to write the solution of <b>${e.html}</b>?`, board: e.tex,
    solution: [`Each line is a new equation, and each is true for the same ${X}: ${e.html}, then ${midH}, then ${X} = ${x}.`, `An = sign means "has the same value as", not "and then".`],
  }, [
    { t: right, ok: true, say: `Yes: three equations, one under the other, each with the same solution ${X} = ${x}.` },
    { t: runOn, mc: MC.runOn, say: `Read the = signs: that line claims ${g ? `${r} ÷ ${p} = ${mid} − ${q}` : `${r} − ${q} = ${mid} ÷ ${p}`}, so ${mid} = ${x}. An = sign means "same value", not "and then". Each step gets its own line.` },
    { t: fw, mc: MC.forward, say: g ? `Undo × ${p} with ÷ ${p}, not × ${p} again.` : `Undo + ${q} with − ${q}: ${r} − ${q} = ${mid}, not ${r + q}.` },
  ]);
};
const matchSteps: Gen = (R, n) => {
  const g = R() < 0.35, e = wholeEq(R, g), p = e.P, q = e.Q, r = e.R, x = e.x;
  const mid = g ? r / p : r - q;
  const ar1 = g ? `${r} ÷ ${p} = ${mid}` : `${r} − ${q} = ${mid}`, ar2 = g ? `${mid} − ${q} = ${x}` : `${mid} ÷ ${p} = ${x}`;
  const midH = g ? `${X} + ${q} = ${mid}` : `${p}${X} = ${mid}`;
  const L1 = `From ${e.html} to ${midH}: ${g ? `both sides ÷ ${p}` : `both sides − ${q}`}`;
  const L2 = `From ${midH} to ${X} = ${x}: ${g ? `both sides − ${q}` : `both sides ÷ ${p}`}`;
  const askFirst = R() < 0.5, ask = askFirst ? ar1 : ar2;
  const midT = g ? `x + ${q}` : `${p}x`;
  return choiceItem(R, {
    id: `matchSteps-${n}`, family: 'matchSteps',
    prompt: `The arithmetic way: <b>${ar1}</b>, then <b>${ar2}</b>. Which step of the equations does <b class="a">${ask}</b> match?`,
    board: `\\begin{aligned} ${e.tex.replace(' = ', ' &= ')} \\\\ ${midT} &= ${mid} \\\\ x &= ${x} \\end{aligned}`,
    solution: [`${ar1} is the same move as ${L1.split(': ')[1]}.`, `${ar2} is the same move as ${L2.split(': ')[1]}. Same numbers, same order: the equations just write both sides down.`],
  }, [
    { t: L1, ok: askFirst, say: askFirst ? `Yes: ${ar1} does to the number what ${L1.split(': ')[1]} does to the equation.` : `That step matches ${ar1}. ${ask} is the next one.` },
    { t: L2, ok: !askFirst, say: !askFirst ? `Yes: ${ar2} does to the number what ${L2.split(': ')[1]} does to the equation.` : `That step matches ${ar2}. ${ask} is the one before.` },
    { t: 'Neither: arithmetic and equations are different methods.', mc: MC.unrelated, say: `They are the same moves in the same order. The arithmetic works on the number, the equations write both sides down.` },
  ]);
};

// ---------- 5–8. solve ----------
const solve: Gen = (R, n, sg = 'solve-whole-positive') => {
  const e = eqFor(R, sg), pic = balancePic(e);
  const dec = !Number.isInteger(e.x);
  return numItem({
    id: `solve-${n}`, family: 'solve',
    prompt: `Solve for ${X}. Then check it.${dec ? ' (A decimal is fine.)' : ''}`, board: e.tex, unit: '',
    ...(pic && sg === 'solve-whole-positive' ? { picture: { balance: pic } } : {}),
    solution: solveLines(e),
  }, e.x, v => classifySolve(e, v));
};
const balance: Gen = (R, n, sg) => {
  const grouped = sg === 'solve-grouped';
  for (;;) {
    const p = int(R, 2, 4), x = int(R, 1, 9), q = grouped ? int(R, 1, 5) : int(R, 1, 18);
    const e = grouped ? makeEq('grp', 'p(x+q)', p, q, x) : makeEq('lin', 'px+q', p, q, x);
    if (!balanceFits(p, q, e.R, grouped)) continue;
    const prompt = grouped
      ? `On the left pan are <b class="b">${p} groups</b>, each <b class="b">one bag</b> and <b class="a">${q} marbles</b>. They balance <b class="a">${e.R} marbles</b>. Every bag holds the same number. How many marbles are in one bag?`
      : `<b class="b">${p} bags</b> (each holding the same number of marbles) and <b class="a">${q} loose marbles</b> balance <b class="a">${e.R} marbles</b>. How many marbles are in one bag?`;
    return numItem({
      id: `balance-${n}`, family: 'balance', prompt, board: e.tex, unit: 'marbles', picture: { balance: { p, q, r: e.R, grouped } },
      solution: grouped
        ? [`Split both pans into ${p} equal shares: one group balances ${e.R} ÷ ${p} = ${x + q} marbles.`, `Take ${q} off both sides: one bag balances <b class="s">${x}</b> marbles.`, `Check: ${p} × (${x} + ${q}) = ${e.R}. ✓`]
        : [`Take the ${q} loose marbles off both pans: ${p} bags balance ${e.R - q}.`, `Split both pans into ${p} equal shares: one bag balances ${e.R - q} ÷ ${p} = <b class="s">${x}</b>.`, `Check: ${p} × ${x} + ${q} = ${e.R}. ✓`],
    }, x, v => classifySolve(e, v, 'marbles'));
  }
};
const negCheck: Gen = (R, n) => {
  const who = pick(R, NAMES), v = pick(R, ['neg', 'negP'] as const);
  if (v === 'neg') {
    for (;;) {
      const p = int(R, 2, 9), x = -int(R, 1, 9), q = int(R, 1, 40), e = makeEq('lin', 'px+q', p, q, x);
      if (e.R === 0 || Math.abs(e.R) > 100) continue;
      return choiceItem(R, {
        id: `negCheck-${n}`, family: 'negCheck', board: e.tex,
        prompt: `${who} solves <b>${e.html}</b> and gets ${X} = ${H(x)}. A friend says a solution can't be negative. Who is right?`,
        solution: [`Check by substituting: ${p} · (${H(x)}) + ${q} = ${H(p * x)} + ${q} = ${H(e.R)}. ✓`, `So ${X} = ${H(x)} is the solution. Negative solutions are fine.`],
      }, [
        { t: `${who}: ${p}(${H(x)}) + ${q} = ${H(e.R)}, so ${X} = ${H(x)} works.`, ok: true, say: `Yes. Substituting is the test, and ${H(x)} passes it. Negative numbers can be solutions.` },
        { t: 'The friend: an answer must be positive.', mc: MC.rejectNeg, say: `Check it instead of ruling it out: ${p}(${H(x)}) + ${q} = ${H(e.R)}. It works, so it IS the solution.` },
        { t: `Neither: the solution is ${X} = ${-x}.`, mc: MC.detached, say: `Try it: ${p}(${-x}) + ${q} = ${p * -x + q}, not ${H(e.R)}. Keep the sign: ${X} = ${H(x)}.` },
      ]);
    }
  }
  for (;;) {
    const p = int(R, 2, 9), x = int(R, 1, 9) * (R() < 0.5 ? -1 : 1), q = int(R, 1, 30), e = makeEq('lin', 'px+q', -p, q, x);
    if (Math.abs(e.R) > 100 || e.R === 0) continue;
    return choiceItem(R, {
      id: `negCheck-${n}`, family: 'negCheck', board: e.tex,
      prompt: `To solve <b>${e.html}</b>, ${who} subtracts ${q} from both sides, then divides by ${p} and gets ${X} = ${H(-x)}. Check the answer.`,
      solution: [`${H(-p)}${X} = ${H(e.R - q)}. Divide by ${H(-p)}, sign and all: ${X} = ${H(x)}.`, `Check: ${H(-p)}(${H(x)}) + ${q} = ${H(e.R)}. ✓`],
    }, [
      { t: `Wrong: ${H(-p)}(${H(-x)}) + ${q} = ${H(p * x + q)}. Divide by ${H(-p)} to get ${X} = ${H(x)}.`, ok: true, say: `Yes. The coefficient is ${H(-p)}, so you divide by ${H(-p)}, sign and all.` },
      { t: `Right: dividing by ${p} undoes the × ${H(-p)}.`, mc: MC.signDrop, say: `÷ ${p} undoes × ${p}, not × ${H(-p)}. Substitute to see: ${H(-p)}(${H(-x)}) + ${q} = ${H(p * x + q)}, not ${H(e.R)}.` },
      { t: 'Right: a negative coefficient gives a negative answer.', say: `Signs don't copy over. Substitute: ${H(-p)}(${H(-x)}) + ${q} = ${H(p * x + q)}, not ${H(e.R)}.` },
    ]);
  }
};
const firstMove: Gen = (R, n, sg = 'solve-grouped') => {
  const e = eqFor(R, sg === 'solve-rational' ? 'solve-rational' : 'solve-grouped');
  const base = { id: `firstMove-${n}`, family: 'firstMove' as const, board: e.tex, solution: solveLines(e) };
  const qAbs = num(Math.abs(e.Q), e.money);
  const undoQ = `${e.Q > 0 ? 'Subtract' : 'Add'} ${qAbs} ${e.Q > 0 ? 'from' : 'to'} both sides`, redoQ = `${e.Q > 0 ? 'Add' : 'Subtract'} ${qAbs} ${e.Q > 0 ? 'to' : 'from'} both sides`;
  if (e.kind === 'grp') {
    const opts: Opt[] = e.look === 'frac(x+q)' ? [
      { t: `Multiply both sides by ${e.b}`, ok: true, say: `Yes: × ${fr(1, e.b!)} was done last (to the whole bracket), and × ${e.b} undoes it.` },
      { t: `Divide both sides by ${e.b}`, mc: MC.forward, say: `× ${fr(1, e.b!)} already divides by ${e.b}. Dividing again goes the wrong way: multiply by ${e.b}.` },
      { t: undoQ, mc: MC.wrongOrder, say: `The ${sgnH(e.Q)} is inside the bracket, so it happened first. The × ${fr(1, e.b!)} happened last: undo that first.` },
    ] : e.P < 0 ? [
      { t: `Divide both sides by ${H(e.P)}`, ok: true, say: `Yes: × ${H(e.P)} was done last, so ÷ ${H(e.P)} comes first, sign and all.` },
      { t: `Divide both sides by ${num(-e.P)}`, mc: MC.signDrop, say: `The factor is ${H(e.P)}: divide by ${H(e.P)}, sign and all.` },
      { t: undoQ, mc: MC.wrongOrder, say: `The ${sgnH(e.Q)} is inside the bracket, so it happened first. Undo the × ${H(e.P)} first.` },
    ] : shuffle(R, [
      { t: `Divide both sides by ${num(e.P)}`, ok: true, say: `Yes: × ${num(e.P)} was done last (to the whole bracket), so it comes off first.` },
      { t: undoQ, mc: MC.wrongOrder, say: `The ${sgnH(e.Q)} is inside the bracket, so it happened first. The × ${num(e.P)} happened last: undo it first.` },
      { t: `Multiply both sides by ${num(e.P)}`, mc: MC.forward, say: `× ${num(e.P)} is undone by ÷ ${num(e.P)}, not by another × ${num(e.P)}.` },
      { t: `Rewrite it as ${num(e.P)}${X} ${sgnH(e.Q)} = ${H(e.R)}`, mc: MC.partialDist, say: `${num(e.P)}(${X} ${sgnH(e.Q)}) multiplies BOTH terms: it is ${num(e.P)}${X} ${sgnH(round3(e.P * e.Q))}. Easier: divide both sides by ${num(e.P)}.` },
    ]).filter((o, i, a) => o.ok || a.filter(b => !b.ok).indexOf(o) < 2);
    return choiceItem(R, { ...base, prompt: `What undoes the LAST step done to ${X} in <b>${e.html}</b>?` }, opts);
  }
  // rational, lin: either the first move (undo ± q) or the second (undo the coefficient)
  const second = R() < 0.5;
  if (!second) return choiceItem(R, { ...base, prompt: `What undoes the LAST step done to ${X} in <b>${e.html}</b>?` }, [
    { t: undoQ, ok: true, say: `Yes: the ${sgnH(e.Q, e.money)} was done last, so it comes off first.` },
    { t: e.look === 'x/p+q' ? `Multiply both sides by ${num(1 / e.P)}` : e.look === 'frac' ? `Multiply both sides by ${fr(e.b!, e.a!)}` : `Divide both sides by ${H(e.P, e.money)}`, mc: MC.wrongOrder, say: `That undoes the FIRST step. The ${sgnH(e.Q, e.money)} was done last, so it comes off first.` },
    { t: redoQ, mc: MC.forward, say: `That repeats the ${sgnH(e.Q, e.money)} instead of undoing it.` },
  ]);
  const px = round3(e.R - e.Q);
  const lhs = e.look === 'x/p+q' ? fr(X, num(1 / e.P)) : `${coefHtml(e)}${X}`;
  const opts: Opt[] = e.look === 'x/p+q' ? [
    { t: `Multiply both sides by ${num(1 / e.P)}`, ok: true, say: `Yes: ${X} was divided by ${num(1 / e.P)}, and × ${num(1 / e.P)} undoes it. ${X} = ${H(e.x)}.` },
    { t: `Divide both sides by ${num(1 / e.P)}`, mc: MC.visible, say: `${lhs} already means ÷ ${num(1 / e.P)}. Undo a divide with a multiply.` },
    { t: `Subtract ${num(1 / e.P)} from both sides`, say: `${num(1 / e.P)} isn't added to ${X}; ${X} is divided by it. Undo with × ${num(1 / e.P)}.` },
  ] : e.look === 'frac' ? [
    { t: `Multiply both sides by ${e.P < 0 ? '−' : ''}${fr(e.b!, e.a!)}`, ok: true, say: `Yes: × ${fr(e.b!, e.a!)} undoes × ${fr(e.a!, e.b!)} in one move. ${X} = ${H(e.x)}.` },
    { t: e.a! > 1 ? `Divide both sides by ${e.a}` : `Divide both sides by ${e.b}`, mc: e.a! > 1 ? MC.partialCoef : MC.forward, say: e.a! > 1 ? `÷ ${e.a} undoes only the × ${e.a}. ${fr(e.a!, e.b!)} also divides by ${e.b}: multiply by ${fr(e.b!, e.a!)} to undo both.` : `× ${fr(1, e.b!)} divides by ${e.b} already. Undo it with × ${e.b}.` },
    { t: `Multiply both sides by ${e.P < 0 ? '−' : ''}${fr(e.a!, e.b!)}`, mc: MC.forward, say: `That does × ${fr(e.a!, e.b!)} again. Undo it with the reciprocal, ${fr(e.b!, e.a!)}.` },
  ] : [
    { t: `Divide both sides by ${H(e.P, e.money)}`, ok: true, say: `Yes: ÷ ${H(e.P, e.money)} undoes × ${H(e.P, e.money)}. ${X} = ${H(e.x)}.` },
    { t: `Multiply both sides by ${H(e.P, e.money)}`, mc: MC.forward, say: `That does × ${H(e.P, e.money)} again. Undo a multiply with a divide.` },
    { t: `Subtract ${H(e.P, e.money)} from both sides`, say: `${H(e.P, e.money)} multiplies ${X}; it isn't added. Undo it with ÷ ${H(e.P, e.money)}.` },
  ];
  return choiceItem(R, { ...base, prompt: `After undoing the ${sgnH(e.Q, e.money)}: <b>${lhs} = ${H(px, e.money)}</b>. What gets ${X} alone?` }, opts);
};

// ---------- 9–10. contexts ----------
interface Story { tex: string; html: string; eq: Eq; v: string; vDesc: string; unit: string; ask: string; story: string; inter: number; interSay: string }
function story(R: () => number): Story {
  const k = pick(R, ['gym', 'less', 'rect', 'bags', 'plant'] as const);
  if (k === 'gym') {
    const fee = pick(R, [8, 10, 12, 15, 20]), rate = pick(R, [2.5, 3.5, 4, 4.5, 6]), c = int(R, 2, 9), e = makeEq('lin', 'dec', rate, fee, c, { money: true });
    return { tex: `${num(rate, true)}c + ${num(fee, true)} = ${num(e.R, true)}`, html: `${num(rate, true)}<i>c</i> + ${num(fee, true)} = ${num(e.R, true)}`, eq: e, v: 'c', vDesc: 'the number of climbs', unit: 'climbs',
      story: `A climbing gym charges <b class="a">$${num(fee, true)}</b> to get in plus <b class="b">$${num(rate, true)} per climb</b>. Jen spends <b class="a">$${num(e.R, true)}</b> in all.`, ask: 'How many climbs did Jen do?',
      inter: e.R - fee, interSay: `$${num(e.R - fee, true)} is what Jen spent on climbs. Each climb costs $${num(rate, true)}: ${num(e.R - fee, true)} ÷ ${num(rate, true)} = ${c} climbs.` };
  }
  if (k === 'less') {
    const p = int(R, 2, 6), q = int(R, 2, 15), s = int(R, 4, 20), e = makeEq('lin', 'px+q', p, -q, s);
    const thing = pick(R, [['Mia’s score', 's', 'points'], ['the number of laps Ty ran', 'n', 'laps'], ['Ava’s age', 'a', 'years']] as const);
    return { tex: `${p}${thing[1]} - ${q} = ${e.R}`, html: `${p}<i>${thing[1]}</i> − ${q} = ${e.R}`, eq: e, v: thing[1], vDesc: thing[0], unit: thing[2],
      story: `<b class="a">${q}</b> less than <b class="b">${p} times ${thing[0]}</b> is <b class="a">${e.R}</b>.`, ask: `What is ${thing[0]}?`,
      inter: e.R + q, interSay: `${e.R + q} is ${p} times the number. Divide by ${p}: ${s}.` };
  }
  if (k === 'rect') {
    const w = int(R, 3, 12), L = int(R, w + 1, 30), e = makeEq('grp', 'p(x+q)', 2, w, L);
    return { tex: `2(L + ${w}) = ${e.R}`, html: `2(<i>L</i> + ${w}) = ${e.R}`, eq: e, v: 'L', vDesc: 'the length in inches', unit: 'in.',
      story: `A rectangle is <b class="a">${w} in.</b> wide and has a perimeter of <b class="a">${e.R} in.</b>`, ask: 'How long is it?',
      inter: e.R / 2, interSay: `${e.R / 2} in. is the length plus the width (half the perimeter). Take off the width: ${L} in.` };
  }
  if (k === 'bags') {
    const p = int(R, 3, 8), q = int(R, 1, 4), b = int(R, 2, 9), e = makeEq('grp', 'p(x+q)', p, q, b);
    return { tex: `${p}(b + ${q}) = ${e.R}`, html: `${p}(<i>b</i> + ${q}) = ${e.R}`, eq: e, v: 'b', vDesc: 'the number of balls in a bag', unit: 'balls',
      story: `A coach packs <b class="b">${p} bags</b>. Each bag holds the same number of balls and <b class="a">${q} cones</b>. There are <b class="a">${e.R} items</b> in all.`, ask: 'How many balls are in each bag?',
      inter: e.R / p, interSay: `${e.R / p} is everything in ONE bag, balls and cones. Take off the ${q} cones: ${b} balls.` };
  }
  const g = int(R, 2, 5), h0 = pick(R, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(h => h !== g)), w = int(R, 2, 10), e = makeEq('lin', 'px+q', g, h0, w);
  return { tex: `${g}w + ${h0} = ${e.R}`, html: `${g}<i>w</i> + ${h0} = ${e.R}`, eq: e, v: 'w', vDesc: 'the number of weeks', unit: 'weeks',
    story: `A plant is <b class="a">${h0} in.</b> tall and grows <b class="b">${g} in. each week</b>. After some weeks it is <b class="a">${e.R} in.</b> tall.`, ask: 'How many weeks is that?',
    inter: e.R - h0, interSay: `${e.R - h0} in. is how much it grew. At ${g} in. a week: ${w} weeks.` };
}
const writeEq: Gen = (R, n) => {
  const s = story(R), e = s.eq, v = `<i>${s.v}</i>`;
  let wrongs: Opt[];
  if (s.unit === 'climbs') wrongs = [
    { t: `${num(e.Q, true)}${v} + ${num(e.P, true)} = ${num(e.R, true)}`, say: `$${num(e.Q, true)} is paid once; $${num(e.P, true)} is paid for each climb, so it multiplies ${v}.` },
    { t: `${num(e.P, true)}(${v} + ${num(e.Q, true)}) = ${num(e.R, true)}`, mc: MC.partialDist, say: `The entry fee is paid once, not once per climb, so it isn't inside a bracket with ${v}.` },
  ];
  else if (s.unit === 'weeks') wrongs = [
    { t: `${e.Q}${v} + ${e.P} = ${e.R}`, say: `It starts at ${e.Q} in. once, and grows ${e.P} in. EACH week: ${e.P}${v}.` },
    { t: `${e.P}(${v} + ${e.Q}) = ${e.R}`, mc: MC.partialDist, say: `The ${e.Q} in. is there once at the start; it doesn't grow each week.` },
  ];
  else if (s.unit === 'in.') wrongs = [
    { t: `2${v} + ${e.Q} = ${e.R}`, mc: MC.partialDist, say: `A perimeter goes around: two lengths AND two widths. 2(${v} + ${e.Q}) doubles both.` },
    { t: `${v} + ${e.Q} = ${e.R}`, mc: MC.intermediate, say: `${v} + ${e.Q} is only half way round. The perimeter is 2(${v} + ${e.Q}).` },
  ];
  else if (s.unit === 'balls') wrongs = [
    { t: `${e.P}${v} + ${e.Q} = ${e.R}`, mc: MC.partialDist, say: `EVERY bag has ${e.Q} cones, so there are ${e.P} × ${e.Q} cones: ${e.P}(${v} + ${e.Q}).` },
    { t: `${e.P} + ${e.Q}${v} = ${e.R}`, say: `There are ${e.P} bags, and each holds ${v} balls and ${e.Q} cones: ${e.P}(${v} + ${e.Q}).` },
  ];
  else wrongs = [
    { t: `${-e.Q} − ${e.P}${v} = ${e.R}`, mc: MC.lessThan, say: `"${-e.Q} less than ${e.P}${v}" starts from ${e.P}${v} and takes ${-e.Q} away: ${e.P}${v} − ${-e.Q}.` },
    { t: `${e.P}(${v} − ${-e.Q}) = ${e.R}`, say: `The ${-e.Q} is taken away from ${e.P} times the number, after the multiply: ${e.P}${v} − ${-e.Q}.` },
  ];
  return choiceItem(R, {
    id: `writeEq-${n}`, family: 'writeEq', board: `${s.v} = \\,?`,
    prompt: `${s.story} Let <b>${v}</b> be ${s.vDesc}. Which equation fits?`,
    solution: [`${s.html}: ${s.unit === 'in.' ? 'two lengths and two widths' : s.unit === 'balls' ? 'each of the bags holds balls and cones' : s.unit === 'climbs' || s.unit === 'weeks' ? 'a per-unit amount times the unknown, plus the one-time amount' : 'times first, then take away'}.`],
  }, [{ t: s.html, ok: true, say: `Yes: ${s.html}.` }, ...wrongs]);
};
const storySolve: Gen = (R, n) => {
  const s = story(R), e = s.eq;
  return numItem({
    id: `storySolve-${n}`, family: 'storySolve', prompt: `${s.story} ${s.ask}`, board: s.tex, unit: s.unit,
    solution: [`Equation: ${s.html}.`, ...solveLines(e).map(l => l.replace(/<i>x<\/i>/g, `<i>${s.v}</i>`)), `So the answer is <b class="s">${H(e.x)} ${s.unit}</b>${s.unit.endsWith('.') ? '' : '.'}`],
  }, e.x, v => {
    if (near(v, s.inter) && !near(v, e.x)) return { ok: false, mc: MC.intermediate, say: s.interSay };
    const c = classifySolve(e, v, s.unit);
    return { ...c, say: c.say.replace(/<i>x<\/i>/g, `<i>${s.v}</i>`) };
  });
};
interface Tale { html: string; tex: string; right: string; swap: string; swapSay: string; mismatch: string; omit: string; constMeaning: string; constWrong: string; xMeaning: string; xWrong: string; q: string; x: string }
function tale(R: () => number): Tale {
  const k = pick(R, ['fee', 'groups', 'split'] as const), who = pick(R, NAMES);
  if (k === 'fee') {
    let p = int(R, 2, 9), q = int(R, 2, 15); if (p === q) q++;
    const x = int(R, 2, 9), r = p * x + q;
    const S = (a: number, b: number) => `A gym charges a $${a} sign-up fee and $${b} per class.`;
    return { html: `${p}${X} + ${q} = ${r}`, tex: `${p}x + ${q} = ${r}`,
      right: `${S(q, p)} ${who} paid $${r}. How many classes did ${who} take?`,
      swap: `${S(p, q)} ${who} paid $${r}. How many classes did ${who} take?`,
      swapSay: `The numbers swapped jobs. In ${p}${X} + ${q} = ${r}, the $${p} is paid for EACH class (it multiplies ${X}) and the $${q} fee is paid once.`,
      mismatch: `${S(q, p)} ${who} took ${x} classes. How much did ${who} pay?`,
      omit: `Classes cost $${p} each. ${who} paid $${r}. How many classes did ${who} take?`,
      q: String(q), x: String(x),
      constMeaning: `the $${q} sign-up fee, paid once`, constWrong: `${q} classes`,
      xMeaning: `${who} took ${x} classes.`, xWrong: `${who} paid $${x}.` };
  }
  if (k === 'groups') {
    const p = int(R, 3, 6), q = int(R, 1, 4), x = int(R, 2, 8), r = p * (x + q);
    return { html: `${p}(${X} + ${q}) = ${r}`, tex: `${p}(x + ${q}) = ${r}`,
      right: `${p} bags each hold some apples and ${q} pears. There are ${r} pieces of fruit in all. How many apples are in each bag?`,
      swap: `${p} bags each hold some apples, and ${q} more pears sit on the table. There are ${r} pieces of fruit in all. How many apples are in each bag?`,
      swapSay: `In that story the ${q} pears are outside the bags: that is ${p}${X} + ${q}. The bracket in ${p}(${X} + ${q}) puts ${q} pears in EACH bag.`,
      mismatch: `${p} bags each hold ${x} apples and ${q} pears. How many pieces of fruit are there in all?`,
      omit: `${p} bags each hold the same number of apples. There are ${r} apples in all. How many are in each bag?`,
      q: String(q), x: String(x),
      constMeaning: `the ${q} pears in EACH bag`, constWrong: `${q} pears in all`,
      xMeaning: `Each bag holds ${x} apples.`, xWrong: `There are ${x} apples in all.` };
  }
  const p = pick(R, [2, 3, 4, 5]), q = pick(R, [2, 3, 4, 6].filter(v => v !== p)), s = int(R, 3, 9), x = p * s, r = s + q;
  return { html: `${fr(X, p)} + ${q} = ${r}`, tex: `\\frac{x}{${p}} + ${q} = ${r}`,
    right: `${p} friends split the cost of a pizza equally. Each also pays $${q} for a drink. Each friend pays $${r}. What did the pizza cost?`,
    swap: `${q} friends split the cost of a pizza equally. Each also pays $${p} for a drink. Each friend pays $${r}. What did the pizza cost?`,
    swapSay: `The numbers swapped jobs. In ${fr(X, p)} + ${q} = ${r}, the pizza is split among ${p} friends and each drink costs $${q}.`,
    mismatch: `${p} friends split the cost of a $${x} pizza equally. Each also pays $${q} for a drink. How much does each friend pay?`,
    omit: `${p} friends split the cost of a pizza equally. Each friend pays $${r}. What did the pizza cost?`,
    q: String(q), x: String(x),
    constMeaning: `the $${q} drink each friend buys`, constWrong: `the number of friends`,
    xMeaning: `The pizza cost $${x}.`, xWrong: `Each friend paid $${x}.` };
}
const storyFor: Gen = (R, n) => {
  const t = tale(R);
  const wrongs = shuffle(R, [
    { t: t.swap, mc: MC.symbolOrder, say: t.swapSay },
    { t: t.mismatch, mc: MC.mismatch, say: `That story gives ${X} (it says ${t.x}) and asks for the total. The equation's question is the unknown ${X}.` },
    { t: t.omit, mc: MC.omitConst, say: `Where is the ${t.q}? Every number in ${t.html} has to mean something in the story.` },
  ] as Opt[]).slice(0, 2);
  return choiceItem(R, {
    id: `storyFor-${n}`, family: 'storyFor', board: t.tex,
    prompt: `Which story does <b>${t.html}</b> fit?`,
    solution: [`In the right story every number has a job: ${t.constMeaning} is the ${t.q}, and the question asks for ${X}.`, `Check by solving: ${X} = ${t.x} answers the question.`],
  }, [{ t: t.right, ok: true, say: `Yes: every number has a job, and the question asks for ${X}. Solving gives ${X} = ${t.x}.` }, ...wrongs]);
};
const meaning: Gen = (R, n) => {
  const t = tale(R), askConst = R() < 0.5;
  if (askConst) return choiceItem(R, {
    id: `meaning-${n}`, family: 'meaning', board: t.tex,
    prompt: `${t.right} The equation is <b>${t.html}</b>. What does the <b class="a">${t.q}</b> stand for?`,
    solution: [`The ${t.q} is ${t.constMeaning}.`],
  }, [
    { t: t.constMeaning[0]!.toUpperCase() + t.constMeaning.slice(1), ok: true, say: `Yes: the ${t.q} is ${t.constMeaning}.` },
    { t: t.constWrong[0]!.toUpperCase() + t.constWrong.slice(1), say: `Look at where the ${t.q} sits in ${t.html}: it is ${t.constMeaning}.` },
    { t: 'Nothing: it is just a number to subtract.', mc: MC.omitConst, say: `Every number in the equation comes from the story: the ${t.q} is ${t.constMeaning}.` },
  ]);
  return choiceItem(R, {
    id: `meaning-${n}`, family: 'meaning', board: t.tex,
    prompt: `${t.right} Solving <b>${t.html}</b> gives ${X} = ${t.x}. What does that tell you?`,
    solution: [`${X} stands for what the question asks, so ${X} = ${t.x} means: ${t.xMeaning}`],
  }, [
    { t: t.xMeaning, ok: true, say: `Yes. Always say what the number means, with its unit.` },
    { t: `The answer is ${t.x}.`, mc: MC.bare, say: `${t.x} what? Say what it means in the story: ${t.xMeaning}` },
    { t: t.xWrong, say: `${X} is the unknown the question asks for: ${t.xMeaning}` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  chainOrder, chainRun, thinkNumber, flowBack, sameSolution, safeMove, writtenChain, matchSteps,
  solve, balance, negCheck, firstMove, writeEq, storySolve, storyFor, meaning,
};
