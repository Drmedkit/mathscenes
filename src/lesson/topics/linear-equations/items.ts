// items.ts: exercise families for "solving linear equations in one variable" (secondary-t5-30), generated from
// templates, checked exactly, every wrong answer classified against the misconception catalogue
// (math-curriculum-essentials ids). A generator gets the SUB-GOAL it practises (plan.ts) and uses that sub-goal's
// cases from the topic JSON. Pure: no DOM, no canvas; a seeded rng makes sessions repeatable.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { qAdd, qEq, qMul, rat } from '../../../core/math';
import { type Eq, type Q, type Side, G, N, X, decQ, eqHtml, eqTex, isGrp, isZ, nH, neg, num, q, qSub, sideHtml, sideLin, sideTex, simp, solve, subHtml, valueAt } from './lin';
import { MC, XH, checkLine, classifySolve, clearBy, eqFor, eqOf, expandSide, formSide, scaleSide, workLines, type Style } from './solving';
import { sidesFit } from './sidesMaths';
import { ans, endOnChoice } from '../../runtime/explain';

export { MC };
export type FamilyId = 'checkBoth' | 'evalSides' | 'sameSet' | 'keepStep' | 'noResolve' | 'varStep' | 'rewrite' | 'zeroStep' | 'howMany'
  | 'solve' | 'nextLine' | 'checkOrig' | 'classify' | 'predict' | 'construct' | 'nameProp' | 'argue' | 'context';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'checkBoth', name: 'Check both sides' },
  { id: 'evalSides', name: 'Work out both sides' },
  { id: 'sameSet', name: 'Same solutions?' },
  { id: 'keepStep', name: 'A step that keeps the solutions' },
  { id: 'noResolve', name: 'No need to solve again' },
  { id: 'varStep', name: 'An x-term off both sides' },
  { id: 'rewrite', name: 'Rewrite one side' },
  { id: 'zeroStep', name: 'Steps that change the solutions' },
  { id: 'howMany', name: 'One, none, or every number' },
  { id: 'solve', name: 'Solve it' },
  { id: 'nextLine', name: 'The next line' },
  { id: 'checkOrig', name: 'Check in the original' },
  { id: 'classify', name: 'How many solutions?' },
  { id: 'predict', name: 'Predict from the structure' },
  { id: 'construct', name: 'Build an equation' },
  { id: 'nameProp', name: 'Name the property' },
  { id: 'argue', name: 'Finish the argument' },
  { id: 'context', name: 'What it means in the story' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
export const MC_EXTRA = { onlyLcm: 'mc.linear-equations.only-one-multiplier-clears', visible: 'mc.equal-sign.operates-on-visible-numbers' } as const;

/** pictures the page can draw: the two-pan balance (whole, non-negative sides) or stacked board lines */
export interface BalancePic { a: number; b: number; c: number; d: number; loose?: boolean; /** the equation as written, x-terms and numbers tagged for the board colours */ tex?: string }
export type Pic = { balance?: BalancePic; mode?: 'solve' | 'sweep' | 'try' | 'takeX'; v?: number; lines?: string[] };
export interface LEItem extends Item { family: FamilyId; picture?: Pic }
type Gen = (R: () => number, n: number, sg?: string) => LEItem;

// ---------- helpers ----------
const B = (s: string) => `<b>${s}</b>`;
const E = (e: Eq) => B(eqHtml(e));
const sg1 = (R: () => number, p = 0.5) => (R() < p ? -1 : 1);
/** the balance picture of an equation whose simplified sides are whole and non-negative (and that the model can draw) */
export function balanceOf(e: Eq, loose = false): BalancePic | undefined {
  const l = sideLin(e.L), r = sideLin(e.R);
  const all = [l.m, l.k, r.m, r.k];
  if (!all.every(v => v.q === 1 && v.p >= 0)) return undefined;
  const P = { a: l.m.p, b: l.k.p, c: r.m.p, d: r.k.p, ...(loose ? { loose } : {}), tex: eqTex(e, true) };
  return sidesFit(P.a, P.b, P.c, P.d, loose) ? P : undefined;
}
/** a typed response as an exact number (num: decimals; frac: [whole] numerator / denominator, a minus anywhere) */
export function readQ(r: Response): Q | null {
  if (r.kind === 'num') {
    if (!Number.isFinite(r.v)) return null;
    try { return decQ(r.v); } catch { return rat(Math.round(r.v * 1e6), 1e6); }
  }
  if (r.kind === 'frac') {
    if (![r.w, r.n, r.d].every(Number.isInteger) || r.d <= 0) return null;
    const negS = r.w < 0 || r.n < 0, mag = Math.abs(r.w) * r.d + Math.abs(r.n);
    return rat(negS ? -mag : mag, r.d);
  }
  return null;
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choiceItem(R: () => number, base: Omit<LEItem, 'input' | 'choices' | 'answer' | 'check'>, opts: Opt[]): LEItem {
  const seen = new Set<string>(), uniq: Opt[] = [];
  for (const o of [...opts].sort((a, b) => Number(!!b.ok) - Number(!!a.ok))) if (!seen.has(o.t)) { seen.add(o.t); uniq.push(o); }
  const o = shuffle(R, uniq);
  const i = o.findIndex(x => x.ok);
  return {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i }, solution: endOnChoice(base.solution, o[i]!.t),
    check: (r: Response) => {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
}
const eqLines = (...es: Eq[]): Pic => ({ lines: es.map(e => eqTex(e)) });
const H = (v: Q | number, e?: Eq) => nH(v, e?.fmt ?? 'frac');

// ===================== stage 1 =====================
/** an equation and a candidate value for the "check both sides" families (whole or half values on both sides) */
interface CheckCase { e: Eq; k: Q; L: Q; R: Q; F: Q; sol: boolean; trap: boolean }
function checkCase(R: () => number): CheckCase {
  for (;;) {
    const grp = R() < 0.4;
    const kind = pick(R, ['int', 'int', 'neg', 'frac'] as const);
    const k = kind === 'int' ? q(int(R, 1, 9)) : kind === 'neg' ? q(-int(R, 1, 6)) : q(pick(R, [1, 3, 5]), 2);
    const even = kind === 'frac';
    const a = even ? 2 * int(R, 1, 4) : int(R, 2, 7), b = int(R, -9, 12) || 4;
    const c = (even ? 2 * int(R, 1, 3) : int(R, 1, 6)) * sg1(R, 0.2);
    const L: Side = grp ? [G(a, X(1), N(b))] : [X(a), N(b)];
    const Lv = valueAt(L, k);
    const mode = pick(R, ['sol', 'trap', 'not'] as const);
    let d: Q;
    if (mode === 'sol') d = qSub(Lv, qMul(q(c), k));
    else if (mode === 'trap') d = Lv;
    else d = qAdd(qSub(Lv, qMul(q(c), k)), q(int(R, 1, 6) * sg1(R)));
    if (d.q !== 1 || Math.abs(d.p) > 40 || d.p === 0) continue;
    if (qEq(qMul(q(c), k), Z0) ) continue;
    const dFirst = mode === 'trap' || R() < 0.4;
    const Rs: Side = dFirst ? [N(d), X(c)] : [X(c), N(d)];
    const e = eqOf(L, Rs);
    const Rv = valueAt(Rs, k);
    const F = dFirst ? d : q(c);
    return { e, k, L: Lv, R: Rv, F, sol: qEq(Lv, Rv), trap: qEq(Lv, F) && !qEq(Lv, Rv) };
  }
}
const Z0 = q(0);
const checkBoth: Gen = (R, n) => {
  const t = checkCase(R), { e, k } = t;
  const right = t.sol ? `Yes: both sides are ${H(t.L)}` : `No: the left side is ${H(t.L)}, the right side is ${H(t.R)}`;
  const opts: Opt[] = [{ t: right, ok: true, say: t.sol ? `Yes. ${XH} = ${H(k)} makes both sides ${H(t.L)}.` : `Right: ${H(t.L)} and ${H(t.R)} are not equal, so ${XH} = ${H(k)} is not a solution.` }];
  const oneSide = `${qEq(t.L, t.F) ? 'Yes' : 'No'}: the left side is ${H(t.L)}, and the right side shows ${H(t.F)}`;
  if ((qEq(t.L, t.F) ? 'Yes' : 'No') !== (t.sol ? 'Yes' : 'No')) opts.push({ t: oneSide, mc: MC.oneSide, say: `The right side is a whole expression: work it out too. With ${XH} = ${H(k)} it is ${H(t.R)}, not ${H(t.F)}.` });
  const slipR = qAdd(t.R, q(t.R.p % 2 ? 2 : 3));
  opts.push(t.sol
    ? { t: `No: the left side is ${H(t.L)}, the right side is ${H(slipR)}`, say: `Work out the right side again: ${subHtml(e.R, k)} = ${H(t.R)}.` }
    : { t: `Yes: both sides are ${H(t.L)}`, say: `Work out the right side too: ${subHtml(e.R, k)} = ${H(t.R)}, not ${H(t.L)}.` });
  if (opts.length < 3) opts.push({ t: `Yes: both sides are ${H(qAdd(t.L, q(1)))}`, say: `Work out each side carefully: ${H(t.L)} and ${H(t.R)}.` });
  const pic = balanceOf(e, true);
  return choiceItem(R, {
    id: `checkBoth-${n}`, family: 'checkBoth', board: eqTex(e),
    prompt: `Is ${XH} = ${H(k)} a solution of ${E(e)}? Work out both sides.`,
    solution: [`Left: ${subHtml(e.L, k)} = ${H(t.L)}.`, `Right: ${subHtml(e.R, k)} = ${H(t.R)}.`, t.sol ? `Equal, so ${XH} = ${H(k)} is a solution.` : `Not equal, so ${XH} = ${H(k)} is not a solution.`],
    picture: pic && k.q === 1 && k.p >= 0 && k.p <= 8 ? { balance: pic, mode: 'try', v: k.p } : undefined,
  }, opts);
};
const evalSides: Gen = (R, n) => {
  const t = checkCase(R), { e, k } = t;
  const near = (a: number, b: Q) => Math.abs(a - num(b)) < 1e-9;
  return {
    id: `evalSides-${n}`, family: 'evalSides', board: eqTex(e),
    prompt: `Put ${XH} = ${H(k)} into ${E(e)}. What is each side worth?`,
    input: 'pair', pairLead: 'left', pairOp: 'right',
    solution: [`Left: ${subHtml(e.L, k)} = ${ans(H(t.L))}.`, `Right: ${subHtml(e.R, k)} = ${ans(H(t.R))}.`, t.sol ? `Equal: ${XH} = ${H(k)} is a solution.` : `Not equal: ${XH} = ${H(k)} is not a solution.`],
    answer: { kind: 'pair', x: num(t.L), y: num(t.R) },
    picture: (() => { const p = balanceOf(e, true); return p && k.q === 1 && k.p >= 0 && k.p <= 8 ? { balance: p, mode: 'try' as const, v: k.p } : undefined; })(),
    check(r: Response): Verdict {
      if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in both boxes.' };
      if (near(r.x, t.L) && near(r.y, t.R)) return { ok: true, say: `Yes: ${H(t.L)} and ${H(t.R)}. ${t.sol ? `Equal, so ${XH} = ${H(k)} is a solution.` : `Not equal, so ${XH} = ${H(k)} is not a solution.`}` };
      if (near(r.x, t.L) && near(r.y, t.F) && !qEq(t.F, t.R)) return { ok: false, mc: MC.oneSide, say: `The right side is the whole expression ${sideHtml(e.R)}: put ${H(k)} in there too.` };
      if (!near(r.x, t.L)) return { ok: false, say: `Work out the left side again: ${subHtml(e.L, k)}.` };
      return { ok: false, say: `Work out the right side again: ${subHtml(e.R, k)}.` };
    },
  };
};

const D5 = [-2, -1, 0, 1, 2];
const worksIn = (e: Eq) => D5.filter(v => valueAt(e.L, q(v)).p * valueAt(e.R, q(v)).q === valueAt(e.R, q(v)).p * valueAt(e.L, q(v)).q);
const listH = (ws: number[]) => (!ws.length ? 'no value' : ws.length === 5 ? 'every value in the set' : ws.map(v => `${XH} = ${H(v)}`).join(' and '));
const sameSet: Gen = (R, n) => {
  const type = pick(R, ['eqSingle', 'eqSingle', 'oneVsAll', 'diff', 'bothNone'] as const);
  const s = pick(R, D5), p = int(R, 1, 9), k = int(R, 2, 6);
  const single = (v: number, style: number): Eq => style === 0 ? eqOf([X(1), N(p)], [N(v + p)]) : style === 1 ? eqOf([X(k)], [N(k * v)]) : eqOf([X(k), N(p)], [N(k * v + p)]);
  let A: Eq, Bq: Eq;
  if (type === 'eqSingle') { const st = shuffle(R, [0, 1, 2]); A = single(s, st[0]!); Bq = single(s, st[1]!); }
  else if (type === 'oneVsAll') { A = single(s, int(R, 0, 2)); Bq = R() < 0.5 ? eqOf([G(k, X(1), N(p))], [X(k), N(k * p)]) : eqOf([X(1), N(p)], [N(p), X(1)]); }
  else if (type === 'diff') { const t2 = pick(R, D5.filter(v => v !== s)); A = single(s, int(R, 0, 2)); Bq = single(t2, int(R, 0, 2)); }
  else { A = eqOf([X(1), N(p)], [X(1), N(p + int(R, 1, 5))]); Bq = eqOf([X(k), N(-p)], [X(k), N(int(R, 1, 9))]); }
  const W1 = worksIn(A), W2 = worksIn(Bq), equiv = W1.join() === W2.join();
  const shared = W1.filter(v => W2.includes(v));
  const opts: Opt[] = [];
  if (equiv) {
    opts.push({ t: `Yes: exactly the same values work in both (${listH(W1)})`, ok: true, say: `Yes. Checked value by value, the same values work in both: ${listH(W1)}. On this set they are equivalent.` });
    opts.push({ t: 'No: they look different, so their solutions differ', mc: MC.sameLook, say: `Equivalent means the same solutions, not the same look. Check each value: ${listH(W1)} in both.` });
    opts.push({ t: `No: ${eqHtml(A)} works for ${listH(W1.length ? [W1[0]!] : [s])}, the other for ${listH([pick(R, D5.filter(v => !W1.includes(v)))])}`, say: `Put each value into BOTH equations. Both are true for ${listH(W1)}, and only there.` });
  } else {
    opts.push({ t: `No: ${eqHtml(A)} is true for ${listH(W1)}, ${eqHtml(Bq)} for ${listH(W2)}`, ok: true, say: `Right. Equivalent means EXACTLY the same solutions, and these differ.` });
    if (shared.length) opts.push({ t: `Yes: ${XH} = ${H(shared[0]!)} makes both true`, mc: MC.examples, say: `Sharing one solution is not enough. ${eqHtml(Bq)} is true for ${listH(W2)}, ${eqHtml(A)} only for ${listH(W1)}.` });
    else opts.push({ t: 'Yes: each of them has exactly one solution', mc: MC.exactlyOne, say: `Having one solution each is not the same as having the SAME solution: ${listH(W1)} vs ${listH(W2)}.` });
    opts.push({ t: `Yes: exactly the same values work in both (${listH(W1)})`, say: `Check ${eqHtml(Bq)} too: it is true for ${listH(W2)}.` });
  }
  return choiceItem(R, {
    id: `sameSet-${n}`, family: 'sameSet', board: `${eqTex(A)} \\quad ${eqTex(Bq)}`,
    prompt: `Use only ${XH} = −2, −1, 0, 1, 2. Are ${E(A)} and ${E(Bq)} equivalent (exactly the same solutions)?`,
    solution: [`${eqHtml(A)}: true for ${listH(W1)}.`, `${eqHtml(Bq)}: true for ${listH(W2)}.`, equiv ? 'The same, so on this set they are equivalent.' : 'Not the same, so they are not equivalent.', 'Checking a list settles it only for that list. For every number you need a reason, such as the same step done to both sides.'],
    picture: eqLines(A, Bq),
  }, opts);
};

/** ax + b = c for the both-sides step families (positive, negative constants, then simple fractions) */
function simpleEq(R: () => number): { e: Eq; x: Q; a: Q; b: number; c: number } {
  for (;;) {
    const frac = R() < 0.25;
    const a = frac ? q(1, pick(R, [2, 3, 4])) : q(int(R, 2, 6));
    const x = frac ? q(a.q * int(R, -4, 6)) : q(int(R, -5, 9));
    const b = int(R, -12, 15) || 6, c = num(qAdd(qMul(a, x), q(b)));
    if (!Number.isInteger(c) || c === 0 || Math.abs(c) > 60) continue;
    return { e: eqOf([X(a), N(b)], [N(c)]), x, a, b, c };
  }
}
const keepStep: Gen = (R, n) => {
  const { e, x, a, b, c } = simpleEq(R);
  const A = a.q === 1 ? a.p : 0;
  const wrongCE = (w: Eq) => { const l = valueAt(w.L, x), r = valueAt(w.R, x); return `Test it with the solution ${XH} = ${H(x)}: in ${eqHtml(w)} the sides are ${H(l)} and ${H(r)}. A solution was lost, so this step does not keep the solutions.`; };
  const opts: Opt[] = [];
  // a wrong line that the solution still satisfies has exactly the same solutions too (2x + 10 = 10 and x + 10 = 10
  // when x = 0): it is not offered
  const wrong = (o: Opt & { w: Eq }) => { if (!qEq(valueAt(o.w.L, x), valueAt(o.w.R, x))) opts.push(o); };
  const op = pick(R, A && b % A === 0 && c % A === 0 ? ['sub', 'div'] : a.q > 1 ? ['sub', 'mul'] : ['sub']);
  let right: Eq;
  if (op === 'div') right = eqOf([X(1), N(b / A)], [N(c / A)]);
  else if (op === 'mul') right = eqOf([X(1), N(b * a.q)], [N(c * a.q)]);
  else right = eqOf([X(a)], [N(c - b)]);
  const why = op === 'div' ? `both whole sides were divided by ${A}` : op === 'mul' ? `both whole sides were multiplied by ${a.q}` : `${H(b)} came off both sides`;
  opts.push({ t: eqHtml(right), ok: true, say: `Yes: ${why}. Equal values stay equal, and the step can be undone, so no solution is gained or lost.` });
  const w1 = op === 'div' ? eqOf([X(1), N(b)], [N(c / A)]) : op === 'mul' ? eqOf([X(1), N(b)], [N(c * a.q)]) : eqOf([X(a)], [N(c + b)]);
  wrong({ w: w1, t: eqHtml(w1), mc: op === 'sub' ? MC.noSign : MC.someTerms, say: wrongCE(w1) });
  const w2 = eqOf([X(a)], [N(c)]);
  wrong({ w: w2, t: eqHtml(w2), mc: MC.oneSideOnly, say: wrongCE(w2) });
  const w3 = op === 'sub' && A ? eqOf([X(1), N(b)], [N(c)]) : eqOf([X(a), N(b)], [N(c - b)]);
  wrong({ w: w3, t: eqHtml(w3), mc: MC.oneSideOnly, say: wrongCE(w3) });
  return choiceItem(R, {
    id: `keepStep-${n}`, family: 'keepStep', board: eqTex(e),
    prompt: `Which next line has exactly the same solutions as ${E(e)}?`,
    solution: [`${eqHtml(right)}: ${why}, so the solutions stay the same.`, `To show a step is wrong, one counterexample is enough: put ${XH} = ${H(x)} into the wrong line.`],
  }, opts.slice(0, 4));
};
const noResolve: Gen = (R, n) => {
  const { e, x } = simpleEq(R);
  // x = 0 times k is still 0: "x = 0" would then be a second right choice next to "x = 0, the same"
  const op = isZ(x) ? pick(R, ['add', 'add', 'subx'] as const) : pick(R, ['add', 'add', 'mul', 'subx'] as const);
  const k = op === 'mul' ? int(R, 2, 5) * sg1(R, 0.3) : int(R, 2, 12);
  const e2: Eq = op === 'add' ? eqOf([...e.L, N(k)], [...e.R, N(k)]) : op === 'mul' ? eqOf(scaleSide(e.L, q(k)), scaleSide(e.R, q(k))) : eqOf([...e.L, X(-k)], [...e.R, X(-k)]);
  const what = op === 'add' ? `adds ${k} to both sides` : op === 'mul' ? `multiplies every term on both sides by ${H(k)}` : `subtracts ${k}${XH} from both sides`;
  const vis = op === 'mul' ? qMul(x, q(k)) : qAdd(x, q(k));
  return choiceItem(R, {
    id: `noResolve-${n}`, family: 'noResolve', board: `${eqTex(e)} \\qquad ${eqTex(e2)}`,
    prompt: `${XH} = ${H(x)} is the only solution of ${E(e)}. Kim ${what}: ${E(e2)}. Without solving, what is its solution?`,
    solution: [`Kim did the same to both whole sides, and the step can be undone.`, `So the new equation has exactly the same solutions: ${XH} = ${H(x)}.`],
    picture: eqLines(e, e2),
  }, [
    { t: `${XH} = ${H(x)}, the same`, ok: true, say: `Yes. The same step on both whole sides keeps the solutions, so there is nothing to solve again.` },
    { t: `${XH} = ${H(vis)}`, mc: MC_EXTRA.visible, say: `The step was done to the equation, not to the answer. Check: ${XH} = ${H(x)} still makes both sides equal.` },
    { t: 'You have to solve it again to know', mc: MC.reSolve, say: `No need: Kim did the same to both whole sides, a step that can be undone. The solutions cannot change.` },
  ]);
};
const varStep: Gen = (R, n) => {
  const variant = pick(R, ['result', 'result', 'why', 'add'] as const);
  for (;;) {
    const a = int(R, 2, 5), c = int(R, 1, a - 1), x = int(R, 1, 8), b = int(R, 1, 12), d = (a - c) * x + b;   // b = 0 would show "3x + 0"
    if (d > 30) continue;
    if (variant === 'add') {
      const A = -int(R, 1, 5), C = int(R, 1, 6), bb = int(R, -10, 12), xx = int(R, -6, 6), dd = bb + (A - C) * xx;
      if (Math.abs(dd) > 30 || !dd) continue;
      const e = eqOf([X(A), N(bb)], [X(C), N(dd)]);
      const rightE = eqOf(bb ? [N(bb)] : [N(0)], simp([X(C - A), N(dd)]));
      return choiceItem(R, {
        id: `varStep-${n}`, family: 'varStep', board: eqTex(e),
        prompt: `Add ${-A}${XH} to both sides of ${E(e)}. Which line do you get?`,
        solution: [`${sideHtml([X(A), N(bb)])} + ${-A}${XH} = ${H(bb)}; ${sideHtml([X(C), N(dd)])} + ${-A}${XH} = ${sideHtml([X(C - A), N(dd)])}.`, `${eqHtml(rightE)}: both sides gained the same, so the solutions stay the same.`],
      }, [
        { t: eqHtml(rightE), ok: true, say: `Yes: ${-A}${XH} added to both sides. The x-terms are now only on the right, with a positive coefficient.` },
        { t: eqHtml(eqOf(bb ? [N(bb)] : [N(0)], simp([X(C + A), N(dd)]))), mc: MC.noSign, say: `Adding ${-A}${XH} to the right side makes ${C}${XH} + ${-A}${XH} = ${C - A}${XH}.` },
        { t: eqHtml(eqOf(bb ? [N(bb)] : [N(0)], [X(C), N(dd)])), mc: MC.oneSideOnly, say: `${-A}${XH} has to be added to the right side too, or the sides stop being equal.` },
        { t: 'You can’t: only numbers can be added to both sides', mc: MC.onlyConst, say: `An x-term can be added to both sides too: whatever ${XH} is, both sides gain the same amount.` },
      ]);
    }
    const e = eqOf([X(a), N(b)], [X(c), N(d)]);
    const pic = balanceOf(e, true);
    const rightE = eqOf([X(a - c), N(b)], [N(d)]);
    if (variant === 'why') return choiceItem(R, {
      id: `varStep-${n}`, family: 'varStep', board: eqTex(e),
      prompt: `${E(e)} becomes ${E(rightE)}. Why does this keep the solutions?`,
      solution: [`${c === 1 ? '' : c}${XH} was subtracted from BOTH sides.`, 'Both sides lose the same amount, whatever x is, so equal sides stay equal.'],
      picture: pic ? { balance: pic, mode: 'takeX' } : undefined,
    }, [
      { t: `${c === 1 ? '' : c}${XH} was subtracted from both sides: both lose the same amount, whatever ${XH} is`, ok: true, say: 'Yes. Like taking the same bags off both pans: the beam stays level.' },
      { t: `${c === 1 ? '' : c}${XH} moved to the other side and changed its sign`, mc: MC.moveSign, say: `That is the shortcut's name, not a reason. The reason: the same ${c === 1 ? '' : c}${XH} came off both sides.` },
      { t: 'Only the left side changed, so the right side is still true', mc: MC.oneSideOnly, say: `Both sides changed: ${c === 1 ? '' : c}${XH} came off each. Changing one side only would break the equation.` },
    ]);
    return choiceItem(R, {
      id: `varStep-${n}`, family: 'varStep', board: eqTex(e),
      prompt: `Subtract ${c === 1 ? '' : c}${XH} from both sides of ${E(e)}. Which line do you get?`,
      solution: [`Left: ${sideHtml([X(a), N(b)])} − ${c === 1 ? '' : c}${XH} = ${sideHtml([X(a - c), N(b)])}. Right: ${sideHtml([X(c), N(d)])} − ${c === 1 ? '' : c}${XH} = ${d}.`, `${eqHtml(rightE)}, with the same solutions.`],
      picture: pic ? { balance: pic, mode: 'takeX' } : undefined,
    }, [
      { t: eqHtml(rightE), ok: true, say: `Yes: ${c === 1 ? '' : c}${XH} came off both sides, like the same bags off both pans.` },
      { t: eqHtml(eqOf([X(a + c), N(b)], [N(d)])), mc: MC.noSign, say: `The ${c === 1 ? '' : c}${XH} comes OFF the left side too: ${a}${XH} − ${c === 1 ? '' : c}${XH} = ${a - c === 1 ? '' : a - c}${XH}.` },
      { t: eqHtml(eqOf([X(a - c), N(b)], [X(c), N(d)])), mc: MC.oneSideOnly, say: `The right side has to lose ${c === 1 ? '' : c}${XH} too, or the sides stop being equal.` },
      { t: 'You can’t: only numbers can be subtracted from both sides', mc: MC.onlyConst, say: `An x-term can come off both sides too: both sides lose the same amount, whatever ${XH} is.` },
    ]);
  }
};
const rewrite: Gen = (R, n) => {
  const v = pick(R, ['dist', 'collect', 'copy', 'partial'] as const);
  // c ≠ a: with the same x-coefficient on both sides (5(x + 2) = 5x − 8) both equations have NO solution, so a
  // "changed value" step would still keep the (empty) solution set and the keyed "No" would be false
  const a = int(R, 2, 6), b = int(R, 1, 9) * sg1(R, 0.3), c0 = int(R, 1, 8), c = c0 === a ? a + 1 : c0, d = int(R, -12, 12) || 5;
  const name = pick(R, ['Ana', 'Ben', 'Kai', 'Lena', 'Omar', 'Rosa']);
  const Rs: Side = [X(c), N(d)];
  if (v === 'collect') {
    const m1 = int(R, 3, 9), m2 = int(R, 1, m1 - 1), k = int(R, 1, 12), r = int(R, -10, 30);
    const e = eqOf([X(m1), X(-m2), N(k)], [N(r)]), e2 = eqOf([X(m1 - m2), N(k)], [N(r)]);
    return choiceItem(R, {
      id: `rewrite-${n}`, family: 'rewrite', board: `${eqTex(e)} \\;\\to\\; ${eqTex(e2)}`,
      prompt: `${name} rewrites ${E(e)} as ${E(e2)}. Does it have the same solutions?`,
      solution: [`${sideHtml(e.L)} and ${sideHtml(e2.L)} have the same value for every ${XH} (like terms combined).`, 'Only the look of one side changed, not its value, so the solutions stay the same.'],
      picture: eqLines(e, e2),
    }, [
      { t: `Yes: ${sideHtml(e2.L)} has the same value as ${sideHtml(e.L)} for every ${XH}`, ok: true, say: 'Yes. Combining like terms rewrites a side without changing its value.' },
      { t: `Only if the right side changes by ${m2} too`, mc: MC.rewriteOther, say: 'A rewrite does not change the value of the side, so the other side stays as it is.' },
      { t: 'No: the equation changed, so the solutions change', mc: MC.rewriteValue, say: `The look changed, not the value: ${m1}${XH} − ${m2}${XH} is ${m1 - m2}${XH} for every ${XH}.` },
    ]);
  }
  const L: Side = [G(a, X(1), N(b))], e = eqOf(L, Rs);
  const exp: Side = [X(a), N(a * b)];
  if (v === 'dist') {
    const e2 = eqOf(exp, Rs);
    return choiceItem(R, {
      id: `rewrite-${n}`, family: 'rewrite', board: `${eqTex(e)} \\;\\to\\; ${eqTex(e2)}`,
      prompt: `${name} rewrites ${E(e)} as ${E(e2)}. Does it have the same solutions?`,
      solution: [`${sideHtml(L)} = ${sideHtml(exp)} for every ${XH}: the distributive property.`, 'The left side kept its value, the right side did not change, so the solutions stay the same.'],
      picture: eqLines(e, e2),
    }, [
      { t: `Yes: ${sideHtml(exp)} has the same value as ${sideHtml(L)} for every ${XH}`, ok: true, say: 'Yes. Rewriting one side with the distributive property does not change its value.' },
      { t: `Only if ${H(a * b)} is added to the right side too`, mc: MC.rewriteOther, say: 'Nothing was added: the left side was only rewritten. Its value is the same, so the right side stays as it is.' },
      { t: 'No: the equation changed, so the solutions change', mc: MC.rewriteValue, say: `${sideHtml(L)} and ${sideHtml(exp)} are equal for every ${XH}: only the look changed.` },
    ]);
  }
  if (v === 'copy') {
    const e2 = eqOf(exp, [...Rs, N(a * b)]);
    return choiceItem(R, {
      id: `rewrite-${n}`, family: 'rewrite', board: `${eqTex(e)} \\;\\to\\; ${eqTex(e2)}`,
      prompt: `${name} expands the left side of ${E(e)} and writes ${E(e2)}. Same solutions?`,
      solution: [`The left side was rewritten: ${sideHtml(L)} = ${sideHtml(exp)}, same value.`, `The right side gained ${H(a * b)}: its value changed, so the solutions can change.`],
      picture: eqLines(e, e2),
    }, [
      { t: `No: the left side kept its value, but the right side changed by ${H(a * b)}`, ok: true, say: 'Right. A rewrite of one side needs no change on the other side, and adding to one side only breaks the equation.' },
      { t: `Yes: ${a * b < 0 ? 'the same number went' : `${H(a * b)} went`} onto both sides`, mc: MC.rewriteOther, say: `The left side did not gain ${H(a * b)}: it was only rewritten. The right side did gain it.` },
      { t: 'Yes: expanding never changes the solutions', mc: MC.rewriteOther, say: 'Expanding is fine; the extra number on the right side is the problem.' },
    ]);
  }
  const bad: Side = [X(a), N(b)], e2 = eqOf(bad, Rs);
  return choiceItem(R, {
    id: `rewrite-${n}`, family: 'rewrite', board: `${eqTex(e)} \\;\\to\\; ${eqTex(e2)}`,
    prompt: `${name} rewrites ${E(e)} as ${E(e2)}. Same solutions?`,
    solution: [`${sideHtml(L)} = ${sideHtml(exp)}, not ${sideHtml(bad)}.`, 'The left side changed value, so this is not a rewrite and the solutions can change.'],
    picture: eqLines(e, e2),
  }, [
    { t: `No: ${sideHtml(L)} is ${sideHtml(exp)}, so the left side changed value`, ok: true, say: `Right. The ${a} multiplies both terms in the parentheses.` },
    { t: 'Yes: it only rewrites the left side', mc: MC.partial, say: `A rewrite must keep the value: ${sideHtml(L)} = ${sideHtml(exp)}, the ${a} multiplies the ${H(b)} too.` },
    { t: `Yes, if ${H(b)} is added to the right side too`, mc: MC.rewriteOther, say: `The trouble is the left side itself: ${sideHtml(L)} is ${sideHtml(exp)}.` },
  ]);
};
const zeroStep: Gen = (R, n) => {
  const v = pick(R, ['timesZero', 'timesZero', 'which', 'divX'] as const);
  if (v === 'divX') {
    const a = int(R, 2, 9), c = pick(R, [2, 3, 4, 5, 6, 7, 8, 9, 10, 12].filter(z => z !== a)), name = pick(R, ['Lee', 'Sam', 'Ivy', 'Noah', 'Mia']);
    const e = eqOf([X(a)], [X(c)]);
    return choiceItem(R, {
      id: `zeroStep-${n}`, family: 'zeroStep', board: eqTex(e),
      prompt: `${name} divides both sides of ${E(e)} by ${XH}, gets ${B(`${a} = ${c}`)}, and says “no solution”. Is ${name} right?`,
      solution: [`Dividing by ${XH} only works when ${XH} is not 0, and ${XH} = 0 is exactly the solution: ${a}(0) = ${c}(0).`, `Subtract ${a}${XH} instead: 0 = ${c - a}${XH}, so ${XH} = 0.`],
    }, [
      { t: `No: dividing by ${XH} is not allowed when ${XH} = 0, and ${XH} = 0 is a solution`, ok: true, say: `Right. ${a} times 0 and ${c} times 0 are both 0: the step lost that solution.` },
      { t: 'Yes: the same operation was done to both sides', mc: MC.anySame, say: `Only a step that can be undone keeps the solutions. Dividing by ${XH} cannot be undone when ${XH} = 0.` },
      { t: `Yes: ${a} = ${c} is false, so nothing works`, mc: MC.nonzeroDiv, say: `Try ${XH} = 0: both sides are 0. Dividing by ${XH} threw that solution away.` },
    ]);
  }
  const { e, x } = simpleEq(R);
  if (v === 'which') {
    const k = int(R, 2, 6) * sg1(R, 0.4), add = int(R, 2, 12);
    return choiceItem(R, {
      id: `zeroStep-${n}`, family: 'zeroStep', board: eqTex(e),
      prompt: `Which step can CHANGE the solutions of ${E(e)}?`,
      solution: ['Multiplying both sides by 0 makes 0 = 0, true for every number: solutions are gained.', 'It cannot be undone (you cannot divide by 0). Every other step here can be undone, so it keeps the solutions.'],
    }, [
      { t: 'Multiplying both sides by 0', ok: true, say: 'Yes. Both sides become 0, so EVERY number works: the step cannot be undone.' },
      { t: `Multiplying both sides by ${H(k)}`, say: `Multiplying by ${H(k)} can be undone by dividing by ${H(k)}, so it keeps the solutions.` },
      { t: `Adding ${add} to both sides`, say: `Adding ${add} can be undone by subtracting ${add}, so it keeps the solutions.` },
      { t: `Dividing both sides by ${H(Math.abs(k))}`, say: `Dividing by ${H(Math.abs(k))} can be undone by multiplying, so it keeps the solutions.` },
    ]);
  }
  return choiceItem(R, {
    id: `zeroStep-${n}`, family: 'zeroStep', board: eqTex(e),
    prompt: `${E(e)} has the solution ${XH} = ${H(x)}. Multiply both sides by 0. Does the new equation have the same solutions?`,
    solution: ['Both sides become 0: 0 = 0, true for EVERY number.', `So it gains solutions: it is not equivalent to ${eqHtml(e)}. Multiplying by 0 cannot be undone.`],
  }, [
    { t: 'No: it becomes 0 = 0, so every number works', ok: true, say: 'Right. Multiplying by 0 cannot be undone, so it gains solutions.' },
    { t: 'Yes: the same operation on both sides keeps the solutions', mc: MC.anySame, say: 'Only steps that can be undone keep the solutions, and × 0 cannot be undone. Try any number: 0 = 0.' },
    { t: `Yes: ${XH} = ${H(x)} still works`, mc: MC.exactlyOne, say: `It still works, but so does every other number now: 0 = 0. Same solutions means ALL the same.` },
  ]);
};

// ---------- one, none, every number ----------
type SetKind = 'one' | 'none' | 'all';
/** an equation of a given kind, with sides written in the given styles (whole numbers) */
function kindEq(R: () => number, kind: SetKind, styles: [Style, Style], o: { k0?: boolean } = {}): Eq {
  for (let t = 0; t < 300; t++) {
    const m1 = int(R, 1, 6) * sg1(R, 0.2);
    let m2 = m1, k1 = int(R, -12, 15), k2 = k1;
    if (kind === 'none') { k2 = k1 + (int(R, 1, 9) * sg1(R)); }
    if (kind === 'one') {
      m2 = int(R, -5, 6); if (m2 === m1) continue;
      const x = o.k0 ? 0 : int(R, -6, 9); k2 = k1 + (m1 - m2) * x;
      if (Math.abs(k2) > 30) continue;
    }
    const L = formSide(R, m1, k1, styles[0]), Rs = formSide(R, m2, k2, styles[1]);
    if (!L || !Rs) continue;
    const e = eqOf(L, Rs);
    if (eqHtml(e).split(' = ')[0] === eqHtml(e).split(' = ')[1]) continue;
    return e;
  }
  return kind === 'one' ? eqOf([X(5), N(3)], [X(1), N(15)]) : kind === 'none' ? eqOf([X(2), N(5)], [X(2), N(9)]) : eqOf([G(2, X(1), N(1))], [X(2), N(2)]);
}
const STY: Style[] = ['plain', 'kfirst', 'group', 'split', 'negGroup'];
const simpleStyles = (R: () => number): [Style, Style] => [pick(R, ['plain', 'group', 'kfirst'] as Style[]), pick(R, ['plain', 'kfirst', 'group'] as Style[])];
const howMany: Gen = (R, n) => {
  const kind = pick(R, ['one', 'none', 'all'] as const);
  let e: Eq;
  if (kind === 'one') { const p = int(R, 1, 9), s = int(R, -3, 9); e = R() < 0.5 ? eqOf([X(1), N(p)], [N(s + p)]) : kindEq(R, 'one', ['plain', 'plain']); }
  else if (kind === 'none') { const p = int(R, 0, 9), qq = p + int(R, 1, 6) * sg1(R, 0.3); e = R() < 0.5 ? eqOf(p ? [X(1), N(p)] : [X(1)], [X(1), N(qq)]) : kindEq(R, 'none', ['plain', pick(R, ['plain', 'kfirst', 'group'] as Style[])]); }
  else { const k = int(R, 2, 6), p = int(R, 1, 9); e = R() < 0.6 ? eqOf([G(k, X(1), N(p))], [X(k), N(k * p)]) : kindEq(R, 'all', ['group', pick(R, ['plain', 'kfirst'] as Style[])]); }
  const s = solve(e), l = sideLin(e.L), r = sideLin(e.R);
  const gap = qSub(r.k, l.k);
  const pic = balanceOf(e, true);
  const opts: Opt[] = [];
  if (s.kind === 'one') {
    opts.push({ t: `One number: ${XH} = ${H(s.x)}`, ok: true, say: `Yes: only ${XH} = ${H(s.x)} makes both sides equal. Any other value gives different sides.` });
    opts.push({ t: 'No number makes it true', say: `Try ${XH} = ${H(s.x)}: ${checkLine(e, s.x).replace('Check in the original: ', '')}` });
    opts.push({ t: 'Every number makes it true', mc: MC.exactlyOne, say: `Try ${XH} = ${H(qAdd(s.x, q(1)))}: the sides are ${H(valueAt(e.L, qAdd(s.x, q(1))))} and ${H(valueAt(e.R, qAdd(s.x, q(1))))}. Only ${XH} = ${H(s.x)} works.` });
  } else if (s.kind === 'none') {
    opts.push({ t: `No number: the right side is always ${H(Math.abs(num(gap)))} ${num(gap) > 0 ? 'more' : 'less'} than the left`, ok: true, say: 'Right. The two sides change together and keep the same gap, so they are never equal.' });
    opts.push({ t: `${XH} = 0`, mc: MC.zeroVsNone, say: `At ${XH} = 0 the sides are ${H(l.k)} and ${H(r.k)}. No solution is not the same as the solution 0.` });
    opts.push({ t: `No number: I tried ${XH} = 0 to 8 and none worked`, mc: MC.examples, say: `True for those, but there are infinitely many numbers. The reason that covers ALL of them: the sides always differ by ${H(Math.abs(num(gap)))}.` });
    opts.push({ t: 'Every number makes it true', mc: MC.cancelAll, say: `The ${XH}'s cancel, but what is left, ${H(l.k)} = ${H(r.k)}, is false.` });
  } else {
    opts.push({ t: `Every number: both sides are the same expression, ${sideHtml(simp(e.L))}`, ok: true, say: 'Right. The two sides are equivalent expressions, so they are equal for every value of x.' });
    opts.push({ t: `One number: ${XH} = 1 works`, mc: MC.exactlyOne, say: `${XH} = 1 works, and so does every other number. One success does not make it the only one.` });
    opts.push({ t: `No number: the ${XH}'s cancel`, mc: MC.cancelMisread, say: `After the ${XH}'s cancel, ${H(l.k)} = ${H(r.k)} is left, and that is TRUE. So every number works.` });
    opts.push({ t: `Every number: ${XH} = 0, 1 and 2 all work`, mc: MC.examples, say: 'Checks show it is plausible, they do not prove it for every number. The reason: the two sides are the same expression.' });
  }
  return choiceItem(R, {
    id: `howMany-${n}`, family: 'howMany', board: eqTex(e),
    prompt: `Which values make ${E(e)} true?`,
    solution: workLines(e),
    picture: pic ? { balance: pic, mode: 'sweep' } : undefined,
  }, opts);
};

// ===================== stage 2: solve =====================
function solveItem(e: Eq, n: number, family: FamilyId, prompt: string, letter = 'x'): LEItem {
  const s = solve(e);
  if (s.kind !== 'one') throw new Error('solveItem: one solution expected');
  const fracAns = s.x.q !== 1 && e.fmt !== 'dec';
  const t = (z: string) => z.replace(/<i>x<\/i>/g, `<i>${letter}</i>`);
  const pic = letter === 'x' ? balanceOf(e) : undefined;
  return {
    id: `${family}-${n}`, family, board: eqTex(e).replace(/x/g, letter), prompt: t(prompt),
    input: fracAns ? 'frac' : 'num',
    solution: workLines(e).map(t),
    answer: fracAns ? { kind: 'frac', w: 0, n: s.x.p, d: s.x.q } : { kind: 'num', v: num(s.x) },
    picture: pic ? { balance: pic, mode: 'solve' } : undefined,
    check(r: Response): Verdict { const v = classifySolve(e, readQ(r)); return { ...v, say: t(v.say) }; },
  };
}
const solveF: Gen = (R, n, sg = 's2-collect-integer') => {
  if (sg === 's2-decimal-coefficients' && R() < 0.3) {
    // a money story: two plans, the same cost at m minutes
    for (;;) {
      const r1 = pick(R, [0.05, 0.1, 0.15, 0.2, 0.25]), r2 = pick(R, [0.1, 0.15, 0.2, 0.3, 0.35, 0.4]); if (r2 <= r1) continue;
      const m = pick(R, [20, 30, 40, 50, 60, 80, 100, 120, 150, 200]), F2 = int(R, 1, 12) / 2, F1 = Math.round((F2 + (r2 - r1) * m) * 100) / 100;
      if (F1 > 60 || Math.abs(F1 * 100 - Math.round(F1 * 100)) > 1e-9) continue;
      const e = eqOf([N(F1), X(r1)], [N(F2), X(r2)], 'dec');
      const what = pick(R, [['A rideshare', 'a taxi'], ['Plan A', 'Plan B'], ['A scooter rental', 'a bike rental']] as const);
      return solveItem(e, n, 'solve', `${what[0]} costs $${F1.toFixed(2)} plus $${r1.toFixed(2)} a minute; ${what[1]} costs $${F2.toFixed(2)} plus $${r2.toFixed(2)} a minute. They cost the same when ${E(e)}. Solve for <i>x</i> (minutes).`, 'm');
    }
  }
  const e = eqFor(R, sg);
  return solveItem(e, n, 'solve', `Solve ${E(e)}.`);
};

// ---------- the next line ----------
const nextLine: Gen = (R, n, sg = 's2-collect-integer') => {
  if (sg === 's2-negative-coefficients') {
    const v = pick(R, ['negX', 'xRight', 'negCoef'] as const), k = int(R, 1, 15) * sg1(R, 0.3);
    if (v === 'negX') return choiceItem(R, {
      id: `nextLine-${n}`, family: 'nextLine', board: `-x = ${k}`,
      prompt: `A solution ends with ${B(`−${XH} = ${H(k)}`)}. What is ${XH}?`,
      solution: [`−${XH} = ${H(k)} says the OPPOSITE of ${XH} is ${H(k)}.`, `Divide both sides by −1 (or multiply by −1): ${XH} = <b class="s">${H(-k)}</b>.`],
    }, [
      { t: `${XH} = ${H(-k)}`, ok: true, say: `Yes: multiply both sides by −1. ${XH} = ${H(-k)}.` },
      { t: `${XH} = ${H(k)}`, mc: MC.negStop, say: `−${XH} = ${H(k)} is not finished: it says the opposite of ${XH} is ${H(k)}. So ${XH} = ${H(-k)}.` },
      { t: `${XH} = 0`, say: `Check: −(0) is 0, not ${H(k)}. ${XH} = ${H(-k)}.` },
    ]);
    if (v === 'xRight') {
      const name = pick(R, ['Lee', 'Ana', 'Jay', 'Kim', 'Zoe']);
      return choiceItem(R, {
        id: `nextLine-${n}`, family: 'nextLine', board: `${k} = x`,
        prompt: `${name} solves an equation and ends with ${B(`${H(k)} = ${XH}`)}. Is that finished?`,
        solution: [`${H(k)} = ${XH} and ${XH} = ${H(k)} say the same thing: = means both sides have the same value.`, `So the solution is ${XH} = ${H(k)}.`],
      }, [
        { t: `Yes: ${H(k)} = ${XH} means ${XH} = ${H(k)}`, ok: true, say: 'Yes. The equal sign works both ways: the solution is the same.' },
        { t: `No: ${XH} has to be on the left, so it is not solved yet`, mc: MC.leftOnly, say: `${H(k)} = ${XH} and ${XH} = ${H(k)} are the same statement. The side ${XH} is on does not matter.` },
        { t: `No: it means ${XH} = ${H(-k)}`, say: `Swapping the sides does not change a sign: ${H(k)} = ${XH} means ${XH} = ${H(k)}.` },
      ]);
    }
    const a = -int(R, 2, 9), x = int(R, -9, 9) || 3, K = a * x;
    return choiceItem(R, {
      id: `nextLine-${n}`, family: 'nextLine', board: `${a}x = ${K}`,
      prompt: `${B(`${H(a)}${XH} = ${H(K)}`)}. What is ${XH}?`,
      solution: [`Divide both sides by ${H(a)}, sign and all: ${XH} = ${H(K)} ÷ (${H(a)}) = <b class="s">${H(x)}</b>.`],
    }, [
      { t: `${XH} = ${H(x)}`, ok: true, say: `Yes: ${H(K)} ÷ (${H(a)}) = ${H(x)}.` },
      { t: `${XH} = ${H(-x)}`, mc: MC.signDrop, say: `Divide by ${H(a)} WITH its sign: ${H(K)} ÷ (${H(a)}) = ${H(x)}.` },
      { t: `${XH} = ${H(K * a)}`, say: `To undo × (${H(a)}), divide by ${H(a)}: ${XH} = ${H(x)}.` },
    ]);
  }
  if (sg === 's2-expand-positive' || sg === 's2-negative-factor') {
    const e = eqFor(R, sg);
    const groups = [...e.L, ...e.R].filter(isGrp);
    const full = eqOf(simpTerms(expandSide(e.L), e.L), simpTerms(expandSide(e.R), e.R));
    const part = eqOf(expandFirst(e.L), expandFirst(e.R));
    const negF = groups.some(g => g.f.p < 0) ? eqOf(expandNegFirst(e.L), expandNegFirst(e.R)) : null;
    const opts: Opt[] = [
      { t: eqHtml(full), ok: true, say: 'Yes: the factor multiplies every term inside the parentheses, sign and all.' },
      { t: eqHtml(part), mc: MC.partial, say: 'The factor multiplies EVERY term inside the parentheses, not just the first.' },
    ];
    if (negF) opts.push({ t: eqHtml(negF), mc: MC.negFirst, say: 'A negative factor changes the sign of EVERY term inside: −a(x − b) = −ax + ab.' });
    const out = outsideEq(e);
    if (out) opts.push({ t: eqHtml(out), mc: MC.outside, say: 'Multiply before you add or subtract: the number in front is not part of the factor.' });
    const slip = eqOf(expandSignSlip(e.L), expandSignSlip(e.R)), drop = eqOf(expandDropSign(e.L), expandDropSign(e.R));
    for (const [w, say] of [[slip, 'Check the signs inside the parentheses: each term keeps its own sign before it is multiplied.'], [drop, 'The minus in front belongs to the factor: it changes the sign of every term inside.']] as const) {
      if (new Set(opts.map(o => o.t)).size >= 3) break;
      if (!opts.some(o => o.t === eqHtml(w))) opts.push({ t: eqHtml(w), say });
    }
    return choiceItem(R, {
      id: `nextLine-${n}`, family: 'nextLine', board: eqTex(e),
      prompt: `Expand the parentheses in ${E(e)}. Which line is right?`,
      solution: [`Multiply every term inside by the factor (with its sign): ${eqHtml(full)}.`, ...workLines(e).slice(1)],
    }, opts);
  }
  if (sg === 's2-fraction-coefficients') {
    const e = eqFor(R, sg), M = clearBy(e);
    if (R() < 0.3) {
      const big = M * pick(R, [2, 3]), name = pick(R, ['Ana', 'Leo', 'Maya', 'Theo']);
      return choiceItem(R, {
        id: `nextLine-${n}`, family: 'nextLine', board: eqTex(e),
        prompt: `To clear the fractions in ${E(e)}, ${name} multiplies every term by ${big} instead of ${M}. Is that allowed?`,
        solution: [`Any common multiple of the denominators clears the fractions: ${eqHtml(eqOf(scaleSide(e.L, q(big)), scaleSide(e.R, q(big))))}.`, `${M} is the least one: it keeps the numbers smaller, but ${big} gives the same solution.`],
      }, [
        { t: `Yes: any common multiple clears the fractions; ${M} just keeps the numbers smaller`, ok: true, say: 'Yes. Multiplying every term on both sides by the same nonzero number keeps the solutions.' },
        { t: `No: you must use the least common denominator, ${M}`, mc: MC_EXTRA.onlyLcm, say: `${big} works too: it clears every denominator, the numbers are just bigger.` },
        { t: `Only if ${name} then divides the answer by ${big / M}`, say: 'Multiplying both sides by the same number keeps the solutions: nothing to undo at the end.' },
      ]);
    }
    const sc = eqOf(scaleSide(e.L, q(M)), scaleSide(e.R, q(M)));
    const some = eqOf(scaleSomeSide(e.L, M), scaleSomeSide(e.R, M));
    const oneSide = eqOf(scaleSide(e.L, q(M)), e.R), rightOnly = eqOf(e.L, scaleSide(e.R, q(M)));
    const wrongs: Opt[] = [
      { t: eqHtml(some), mc: MC.someTerms, say: `The whole numbers are terms too: multiply EVERY term by ${M}.` },
      { t: eqHtml(oneSide), mc: MC.oneSideOnly, say: `Both sides have to be multiplied by ${M}, or they stop being equal.` },
      { t: eqHtml(rightOnly), mc: MC.oneSideOnly, say: `Both sides have to be multiplied by ${M}, or they stop being equal.` },
    ].filter((o, i, all) => o.t !== eqHtml(sc) && all.findIndex(z => z.t === o.t) === i).slice(0, 2);
    return choiceItem(R, {
      id: `nextLine-${n}`, family: 'nextLine', board: eqTex(e),
      prompt: `Multiply both sides of ${E(e)} by ${M} to clear the fractions. Which line do you get?`,
      solution: [`Every term on both sides × ${M}, the whole numbers too: ${eqHtml(sc)}.`, ...workLines(e).slice(1)],
    }, [
      { t: eqHtml(sc), ok: true, say: `Yes: every term on both sides times ${M}.` },
      ...wrongs,
    ]);
  }
  // s2-collect-integer: collect the x-terms
  const e = eqFor(R, 's2-collect-integer');
  const l = sideLin(e.L), r = sideLin(e.R);
  const fromLeft = num(l.m) < num(r.m), t = fromLeft ? l.m : r.m;
  const right = fromLeft ? eqOf(simp([N(l.k)]), simp([X(qSub(r.m, l.m)), N(r.k)])) : eqOf(simp([X(qSub(l.m, r.m)), N(l.k)]), simp([N(r.k)]));
  const noSign = fromLeft ? eqOf(simp([N(l.k)]), simp([X(qAdd(r.m, l.m)), N(r.k)])) : eqOf(simp([X(qAdd(l.m, r.m)), N(l.k)]), simp([N(r.k)]));
  const oneSide = fromLeft ? eqOf(simp([N(l.k)]), e.R) : eqOf(simp([X(qSub(l.m, r.m)), N(l.k)]), e.R);
  const tH = sideHtml([X(t)]);
  return choiceItem(R, {
    id: `nextLine-${n}`, family: 'nextLine', board: eqTex(e),
    prompt: `Subtract ${tH} from both sides of ${E(e)}. Which line do you get?`,
    solution: [`${tH} comes off BOTH sides: ${eqHtml(right)}.`, ...workLines(e).slice(1)],
    picture: (() => { const p = balanceOf(e, true); return p ? { balance: p, mode: 'takeX' as const } : undefined; })(),
  }, [
    { t: eqHtml(right), ok: true, say: `Yes: ${tH} off both sides. The x-terms are now on one side, with a positive coefficient.` },
    { t: eqHtml(noSign), mc: MC.noSign, say: `${tH} comes OFF the other side too: the x-terms subtract, they do not add.` },
    { t: eqHtml(oneSide), mc: MC.oneSideOnly, say: `Both sides lose ${tH}, or they stop being equal.` },
  ]);
};
/** helpers for the expand choices: a side with every group written out */
const simpTerms = (exp: Side, _orig: Side): Side => exp.filter(p => isGrp(p) || !isZ(p.c));
const expandFirst = (s: Side): Side => s.flatMap(p => (isGrp(p) ? [{ c: qMul(p.f, p.e[0]!.c), v: p.e[0]!.v }, ...p.e.slice(1)] : [p]));
const expandNegFirst = (s: Side): Side => s.flatMap(p => (isGrp(p) ? p.e.map((t, i) => ({ c: qMul(i === 0 || p.f.p > 0 ? p.f : neg(p.f), t.c), v: t.v })) : [p]));
const expandDropSign = (s: Side): Side => s.flatMap(p => (isGrp(p) ? p.e.map(t => ({ c: qMul(p.f.p < 0 ? neg(p.f) : p.f, t.c), v: t.v })) : [p]));
const expandSignSlip = (s: Side): Side => s.flatMap(p => (isGrp(p) ? p.e.map((t, i) => ({ c: i === 0 ? qMul(p.f, t.c) : neg(qMul(p.f, t.c)), v: t.v })) : [p]));
function outsideEq(e: Eq): Eq | null {
  const f = (s: Side): Side | null => {
    for (let i = 1; i < s.length; i++) { const a = s[i - 1]!, b = s[i]!; if (!isGrp(a) && a.v === '' && isGrp(b)) { const g = G(qAdd(a.c, b.f), ...b.e); return [...s.slice(0, i - 1), ...expandSide([g]), ...s.slice(i + 1)]; } }
    return null;
  };
  const L = f(e.L), Rr = f(e.R);
  if (!L && !Rr) return null;
  return eqOf(L ?? expandSide(e.L), Rr ?? expandSide(e.R));
}
/** the "some terms" slip: every x-term and fraction is scaled, the whole-number constants are not */
const scaleSomeSide = (s: Side, M: number): Side => s.map(p => (isGrp(p) || p.v === 'x' || p.c.q !== 1 ? scaleSide([p], q(M))[0]! : p));

const checkOrig: Gen = (R, n) => {
  for (;;) {
    const a = int(R, -9, 9) / 10, c = int(R, -9, 9) / 10, x = pick(R, [-20, -10, 10, 20, 30, 40, 50, 60]), b = int(R, -12, 15);
    if (!a || !c || a === c) continue;
    const d = Math.round((a - c) * x + b);
    if (Math.abs(d) > 40) continue;
    const e = eqOf(b ? [X(a), N(b)] : [X(a)], d ? [X(c), N(d)] : [X(c)], 'dec');
    const M = clearBy(e), name = pick(R, ['Sam', 'Ava', 'Eli', 'Nora', 'Max']);
    const good = R() < 0.3;
    const derived = good ? eqOf(scaleSide(e.L, q(M)), scaleSide(e.R, q(M))) : eqOf(scaleSomeSide(e.L, M), scaleSomeSide(e.R, M));
    const s = solve(derived), s0 = solve(e);
    if (s.kind !== 'one' || s0.kind !== 'one') continue;
    if (!good && qEq(s.x, s0.x)) continue;
    if (Math.abs(num(s.x)) > 60 || (s.x.q !== 1 && s.x.q !== 2 && s.x.q !== 10 && s.x.q !== 5)) continue;
    const xv = s.x, l = valueAt(e.L, xv), r = valueAt(e.R, xv);
    const fm = 'dec' as const;
    const opts: Opt[] = good ? [
      { t: `Yes: in the original, both sides are ${nH(l, fm)}`, ok: true, say: 'Yes. And checking in the ORIGINAL is what proves it: a slip in a later line would not show up there.' },
      { t: `Yes: it checks in ${name}'s line, and that is enough`, mc: MC.derivedCheck, say: 'Here it happens to be right, but only a check in the original equation proves it.' },
      { t: `No: multiplying by ${M} changes the solution`, mc: MC.anySame, say: `Multiplying every term on both sides by ${M} keeps the solutions.` },
    ] : [
      { t: `No: in the original the sides are ${nH(l, fm)} and ${nH(r, fm)}`, ok: true, say: `Right. ${name} did not multiply every term by ${M}, so the new line has a different solution. The check in the original catches it.` },
      { t: `Yes: it checks in ${name}'s line`, mc: MC.derivedCheck, say: `A check in a later line only shows that line is true. ${name}'s line is not equivalent to the original: check in the ORIGINAL.` },
      { t: `Yes: multiplying by ${M} never changes the solution`, mc: MC.someTerms, say: `Only if EVERY term on both sides is multiplied by ${M}. ${name} skipped some.` },
    ];
    return choiceItem(R, {
      id: `checkOrig-${n}`, family: 'checkOrig', board: eqTex(e),
      prompt: `${name} multiplies ${E(e)} by ${M} and writes ${E(derived)}. That gives ${XH} = ${nH(xv, fm)}, and it checks in ${name}'s line. Is ${XH} = ${nH(xv, fm)} right?`,
      solution: [`Check in the ORIGINAL: left ${subHtml(e.L, xv, fm)} = ${nH(l, fm)}, right ${subHtml(e.R, xv, fm)} = ${nH(r, fm)}.`, ...(good ? ['Equal: it is right.'] : [`Not equal. Every term must be multiplied by ${M}: ${eqHtml(eqOf(scaleSide(e.L, q(M)), scaleSide(e.R, q(M))))}, so ${XH} = ${nH(s0.x, fm)}.`])],
      picture: eqLines(e, derived),
    }, opts);
  }
};

// ===================== stage 3 =====================
function mixedEq(R: () => number, kind: SetKind, sg: string): Eq {
  if (sg !== 's3-classify-mixed' || R() < 0.5) {
    const styles: [Style, Style] = sg === 's3-one-solution' ? simpleStyles(R) : [pick(R, STY), pick(R, ['plain', 'kfirst', 'group'] as Style[])];
    return kindEq(R, kind, styles, { k0: kind === 'one' && R() < 0.25 });
  }
  // mixed: fractions / decimals with the same kind
  const base = kindEq(R, kind, ['plain', 'plain']);
  const d = pick(R, [2, 4, 5, 10]);
  const fmt = R() < 0.5 ? 'dec' : 'frac';
  return eqOf(scaleSide(base.L, q(1, d)), scaleSide(base.R, q(1, d)), fmt);
}
const finalForm = (e: Eq): string => {
  const s = solve(e), l = sideLin(e.L), r = sideLin(e.R);
  if (s.kind === 'one') return `${XH} = ${nH(s.x, e.fmt)}`;
  return `${nH(qSub(l.k, qMul(l.m, q(0))), e.fmt)} = ${nH(r.k, e.fmt)}`;
};
const classify: Gen = (R, n, sg = 's3-classify-mixed') => {
  const kind: SetKind = sg === 's3-one-solution' ? 'one' : sg === 's3-no-solution' ? 'none' : sg === 's3-infinitely-many' ? 'all' : pick(R, ['one', 'none', 'all'] as const);
  const e = mixedEq(R, kind, sg);
  const s = solve(e), l = sideLin(e.L), r = sideLin(e.R), f = e.fmt;
  const opts: Opt[] = [];
  const oneX = s.kind === 'one' ? s.x : null;
  const fake = oneX ? qAdd(oneX, q(int(R, 1, 3) * sg1(R))) : q(0);
  opts.push({ t: s.kind === 'one' ? `One solution: ${XH} = ${nH(oneX!, f)}` : `One solution: ${XH} = ${nH(fake, f)}`, ok: s.kind === 'one', mc: s.kind === 'one' ? undefined : MC.zeroVsNone, say: s.kind === 'one' ? `Yes: it ends at ${XH} = ${nH(oneX!, f)}, and every step kept the solutions, so that is the only one.` : `The ${XH}'s cancel. What is left, ${finalForm(e)}, has no ${XH} in it: read whether it is true.` });
  if (s.kind === 'one' && isZ(oneX!)) opts.push({ t: 'No solution', mc: MC.emptyZero, say: `${XH} = 0 IS a solution: put 0 in and both sides are ${nH(valueAt(e.L, q(0)), f)}. No solution would mean NO number works.` });
  else opts.push({ t: 'No solution', ok: s.kind === 'none', mc: s.kind === 'all' ? MC.cancelMisread : undefined, say: s.kind === 'none' ? `Right: it ends at ${finalForm(e)}, which is never true.` : s.kind === 'all' ? `When the ${XH}'s cancel, look at what is left: ${finalForm(e)} is TRUE, so every number works.` : `It ends at ${XH} = ${nH(oneX!, f)}: that number works.` });
  opts.push({ t: 'Infinitely many solutions (every number)', ok: s.kind === 'all', mc: s.kind === 'none' ? MC.cancelAll : undefined, say: s.kind === 'all' ? `Right: it ends at ${finalForm(e)}, true for every ${XH}.` : s.kind === 'none' ? `The ${XH}'s cancel, but ${finalForm(e)} is false: no number works.` : `Only ${XH} = ${nH(oneX!, f)} works: try another value.` });
  if (s.kind === 'none') opts.push({ t: `One solution: ${XH} = ${nH(qSub(r.k, l.k), f)}`, mc: MC.contraValue, say: `${finalForm(e)} has no ${XH} in it. The leftover number is not a value of ${XH}: the statement is false, so no solution.` });
  if (s.kind === 'all') opts.push({ t: `One solution: ${XH} = 1`, mc: MC.exactlyOne, say: `${XH} = 1 works, but so does every number: ${finalForm(e)} is always true.` });
  return choiceItem(R, {
    id: `classify-${n}`, family: 'classify', board: eqTex(e),
    prompt: `Solve ${E(e)}. What are its solutions?`,
    solution: workLines(e),
    picture: (() => { const p = balanceOf(e, s.kind !== 'one'); return p ? { balance: p, mode: s.kind === 'one' ? 'solve' as const : 'sweep' as const } : undefined; })(),
  }, opts);
};
const predict: Gen = (R, n) => {
  const kind = pick(R, ['one', 'none', 'all'] as const);
  const e = kindEq(R, kind, [pick(R, ['group', 'split', 'negGroup', 'group'] as Style[]), pick(R, ['plain', 'kfirst', 'group'] as Style[])]);
  const l = sideLin(e.L), r = sideLin(e.R), sl = sideHtml(simp(e.L)), sr = sideHtml(simp(e.R));
  const opts: Opt[] = [
    { t: `One solution: the ${XH}-coefficients differ (${nH(l.m)} and ${nH(r.m)})`, ok: kind === 'one', say: kind === 'one' ? 'Right: different coefficients, so the sides cross at exactly one value.' : `The coefficients are the same: ${nH(l.m)} and ${nH(r.m)}.` },
    { t: `No solution: same ${XH}-coefficient, different numbers (${nH(l.k)} and ${nH(r.k)})`, ok: kind === 'none', mc: kind === 'all' ? MC.cancelMisread : undefined, say: kind === 'none' ? 'Right: the same x-coefficient with different numbers can never be equal.' : kind === 'all' ? `The numbers are the same too: ${sl} and ${sr} are one expression.` : `Look at the x-coefficients first: ${nH(l.m)} and ${nH(r.m)} differ.` },
    { t: `Infinitely many: both sides simplify to ${sl}`, ok: kind === 'all', mc: kind === 'none' ? MC.cancelAll : undefined, say: kind === 'all' ? 'Right: the same expression on both sides is equal for every x.' : `They simplify to ${sl} and ${sr}: not the same.` },
  ];
  if (kind === 'all') opts.push({ t: 'No solution: the two sides look different', mc: MC.sameLook, say: `Simplify before you judge: both sides are ${sl}. Different looks, same value.` });
  if (kind === 'none') opts.push({ t: `Infinitely many: both sides have ${sideHtml([X(l.m)])}`, mc: MC.cancelAll, say: `The x-terms match, but the numbers ${nH(l.k)} and ${nH(r.k)} do not: never equal.` });
  return choiceItem(R, {
    id: `predict-${n}`, family: 'predict', board: eqTex(e),
    prompt: `Without solving all the way: simplify each side of ${E(e)}, compare, and predict.`,
    solution: [`Left: ${sideHtml(e.L)} = ${sl}. Right: ${sideHtml(e.R)} = ${sr}.`, 'Different x-coefficients: one solution. Same x-coefficient, different numbers: none. Same expression: every number.'],
  }, opts);
};
const construct: Gen = (R, n) => {
  const v = pick(R, ['blank', 'blank', 'two', 'two', 'edit', 'forms'] as const);
  if (v === 'blank') {
    const a = int(R, 2, 6), b = int(R, 1, 7) * sg1(R, 0.5), c = int(R, 1, 6), k = a * b;   // a(x + b) + cx = (a + c)x + □
    const L: Side = [G(a, X(1), N(b)), X(c)], target = pick(R, ['all', 'none'] as const);
    const shown = `${sideHtml(L)} = ${a + c}${XH} + □`, bt = `${sideTex(L)} = ${a + c}x + \\square`;
    return {
      id: `construct-${n}`, family: 'construct', board: bt,
      prompt: `Which number in the box gives ${B(shown)} ${target === 'all' ? 'infinitely many solutions' : 'no solution'}?`,
      input: 'num',
      solution: [`The left side simplifies to ${a + c}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}.`, target === 'all' ? `The same expression on both sides: the box is ${ans(H(k))}.` : `Same x-term, so any number except ${H(k)} gives no solution (${H(k)} gives every number), for example ${ans(H(k + 1))}.`],
      answer: { kind: 'num', v: target === 'all' ? k : k + 1 },
      check(r: Response): Verdict {
        if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
        if (target === 'all') return r.v === k ? { ok: true, say: `Yes: both sides are ${a + c}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}, equal for every ${XH}.` } : r.v === -k ? { ok: false, say: `Check the sign: ${a} × ${H(b)} = ${H(k)}.` } : r.v === b ? { ok: false, mc: MC.partial, say: `The ${a} multiplies the ${H(b)} too: the left side is ${a + c}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}.` } : { ok: false, say: `Simplify the left side first: ${a + c}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}. The box has to make the right side the same.` };
        return r.v !== k ? { ok: true, say: `Yes: the x-terms match and the numbers differ (${H(k)} and ${H(r.v)}), so the sides are never equal.` } : { ok: false, say: `With ${H(k)} both sides are the same expression: EVERY number works. Any other number gives no solution.` };
      },
    };
  }
  if (v === 'two') {
    const a = int(R, 2, 6), b = int(R, 1, 7) * sg1(R, 0.3), k = a * b, target = pick(R, ['all', 'none', 'one'] as const);
    const want = target === 'all' ? 'infinitely many solutions' : target === 'none' ? 'no solution' : 'exactly one solution';
    const lead = `${sideHtml([G(a, X(1), N(b))])} =`;
    return {
      id: `construct-${n}`, family: 'construct', board: `${sideTex([G(a, X(1), N(b))])} = \\square x + \\square`,
      prompt: `Fill both boxes so the equation has ${B(want)}.`,
      input: 'pair', pairLead: lead, pairOp: `${XH} +`,
      solution: [`${sideHtml([G(a, X(1), N(b))])} = ${a}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}.`, 'Same coefficient and same number: every number. Same coefficient, different number: none. Different coefficient: one.',
        target === 'all' ? `So the same expression: ${ans(a)}${XH} and ${ans(H(k))}.` : target === 'none' ? `So the same x-term with another number, for example ${ans(a)}${XH} and ${ans(H(k + 1))}.` : `So another x-coefficient, for example ${ans(a + 1)}${XH} and ${ans(H(k))}.`],
      answer: { kind: 'pair', x: target === 'one' ? a + 1 : a, y: target === 'none' ? k + 1 : k },
      check(r: Response): Verdict {
        if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in both boxes.' };
        const got: SetKind = r.x !== a ? 'one' : r.y === k ? 'all' : 'none';
        if (got === target) return { ok: true, say: `Yes: ${a}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)} = ${r.x}${XH} ${r.y < 0 ? '−' : '+'} ${Math.abs(r.y)} has ${want}.` };
        if (target === 'one' && got === 'none') return { ok: false, mc: MC.constEdit, say: `Changing only the number keeps the x-terms equal, so that gives no solution. For exactly one, change the x-coefficient.` };
        if (target === 'all' && r.x === a && r.y === b) return { ok: false, mc: MC.partial, say: `The ${a} multiplies the ${H(b)} too: ${a}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}.` };
        return { ok: false, say: `Expand the left side first: ${a}${XH} ${k < 0 ? '−' : '+'} ${Math.abs(k)}. Then compare the x-coefficients and the numbers.` };
      },
    };
  }
  if (v === 'edit') {
    for (;;) {
      const a = int(R, 1, 6), c = int(R, 1, 8), b = int(R, -8, 10); if (a === c) continue;
      const nb = b + int(R, 2, 9) * sg1(R);
      const e2 = eqOf([X(a), N(b)], [X(c), N(nb)]), s2 = solve(e2);
      if (s2.kind !== 'one' || s2.x.q > 6) continue;
      return choiceItem(R, {
        id: `construct-${n}`, family: 'construct', board: eqTex(e2),
        prompt: `${E(eqOf([X(a), N(b)], [X(c), N(b)]))} has one solution, ${XH} = 0. Change the ${H(b)} on the right to ${H(nb)}. How many solutions now?`,
        solution: [`The x-coefficients are still different (${a} and ${c}), so there is still exactly one solution.`, ...workLines(e2)],
      }, [
        { t: `Still exactly one: ${XH} = ${nH(s2.x)}`, ok: true, say: `Right: different x-coefficients always give exactly one solution. Here ${XH} = ${nH(s2.x)}.` },
        { t: 'No solution: the numbers no longer match', mc: MC.constEdit, say: `That only happens when the x-coefficients are equal. ${a} and ${c} differ, so there is one solution: ${XH} = ${nH(s2.x)}.` },
        { t: 'Infinitely many solutions', say: `The sides are different expressions: only ${XH} = ${nH(s2.x)} works.` },
      ]);
    }
  }
  const a = pick(R, [2, 3, 4, 5]), d = pick(R, [3, 5, 7].filter(z => z > a)), k = int(R, 1, 9);
  return choiceItem(R, {
    id: `construct-${n}`, family: 'construct', board: `\\tfrac{${a}}{${d}}x + ${k} = \\frac{${a}x}{${d}} + \\square`,
    prompt: `Which number in the box gives ${B(`${fr(a, d)}${XH} + ${k} = ${fr(`${a}${XH}`, d)} + □`)} infinitely many solutions?`,
    solution: [`${fr(a, d)}${XH} and ${fr(`${a}${XH}`, d)} are the same: ${a}${XH} divided by ${d}.`, `So the box must be ${k}: then both sides are the same expression.`],
  }, [
    { t: `${k}`, ok: true, say: `Yes: ${fr(a, d)}${XH} = ${fr(`${a}${XH}`, d)}, so with ${k} both sides are the same expression.` },
    { t: `No number works: ${fr(a, d)}${XH} and ${fr(`${a}${XH}`, d)} are different`, mc: MC.fracForms, say: `They are the same quantity written two ways: ${a} times ${XH}, divided by ${d}. With ${k} in the box both sides match.` },
    { t: `${k * d}`, say: `Both x-terms are equal already, so the numbers must match: ${k}.` },
    { t: '0', say: `Both x-terms are equal already, so the numbers must match: ${k}.` },
  ]);
};
const nameProp: Gen = (R, n) => {
  const kind = pick(R, ['sub', 'add', 'div', 'mul', 'dist', 'comm'] as const);
  const a = int(R, 2, 7), b = int(R, 1, 12), x = int(R, -5, 9), c = a * x + b;
  let e1: Eq, e2: Eq, right: string, step: string;
  switch (kind) {
    case 'sub': e1 = eqOf([X(a), N(b)], [N(c)]); e2 = eqOf([X(a)], [N(c - b)]); right = 'Subtraction property of equality'; step = `subtract ${b} from both sides`; break;
    case 'add': e1 = eqOf([X(a), N(-b)], [N(a * x - b)]); e2 = eqOf([X(a)], [N(a * x)]); right = 'Addition property of equality'; step = `add ${b} to both sides`; break;
    case 'div': e1 = eqOf([X(a)], [N(a * x)]); e2 = eqOf([X(1)], [N(x)]); right = 'Division property of equality'; step = `divide both sides by ${a}`; break;
    case 'mul': e1 = eqOf([X(q(1, a))], [N(x)]); e2 = eqOf([X(1)], [N(a * x)]); right = 'Multiplication property of equality'; step = `multiply both sides by ${a}`; break;
    case 'dist': e1 = eqOf([G(a, X(1), N(b))], [N(c + a * b - b)]); e2 = eqOf([X(a), N(a * b)], [N(c + a * b - b)]); right = 'Distributive property'; step = 'rewrite the left side'; break;
    default: e1 = eqOf([N(b), X(a)], [N(c)]); e2 = eqOf([X(a), N(b)], [N(c)]); right = 'Commutative property of addition'; step = 'change the order of the terms on the left'; break;
  }
  const pool = ['Subtraction property of equality', 'Addition property of equality', 'Division property of equality', 'Multiplication property of equality', 'Distributive property', 'Commutative property of addition'].filter(p => p !== right);
  const incomplete = kind === 'sub' ? `Subtract ${b}` : kind === 'add' ? `Add ${b}` : kind === 'div' ? `Divide by ${a}` : kind === 'mul' ? `Times ${a}` : kind === 'dist' ? `Times ${a}` : 'Swap them';
  return choiceItem(R, {
    id: `nameProp-${n}`, family: 'nameProp', board: `${eqTex(e1)} \\;\\to\\; ${eqTex(e2)}`,
    prompt: `${E(e1)} becomes ${E(e2)}. Which reason names this step best?`,
    solution: [`The step: ${step}.`, `Its name: the ${right.toLowerCase()}.`, kind === 'dist' || kind === 'comm' ? 'It rewrites one side without changing its value.' : 'The same operation on both whole sides keeps the solutions.'],
    picture: eqLines(e1, e2),
  }, [
    { t: right, ok: true, say: `Yes: ${step}. That is the ${right.toLowerCase()}.` },
    { t: incomplete, mc: MC.incomplete, say: `That names the arithmetic, but not to what: ${kind === 'dist' || kind === 'comm' ? 'it is a rewrite of one side' : 'it is done to BOTH whole sides'}. The ${right.toLowerCase()} says so.` },
    ...shuffle(R, pool).slice(0, 2).map(p => ({ t: p, say: `Look at what changed: ${step}. That is the ${right.toLowerCase()}.` })),
  ]);
};
const argue: Gen = (R, n) => {
  const kind = pick(R, ['one', 'none', 'all'] as const);
  const e = kindEq(R, kind, [pick(R, ['group', 'plain', 'split'] as Style[]), pick(R, ['plain', 'kfirst'] as Style[])]);
  const lines = workLines(e).filter(l => !l.startsWith('Check'));
  const l = sideLin(e.L), r = sideLin(e.R), s = solve(e);
  const fin = s.kind === 'one' ? `${XH} = ${nH(s.x)}` : `${nH(l.k)} = ${nH(r.k)}`;
  const opts: Opt[] = [];
  if (s.kind === 'one') {
    opts.push({ t: `Every step kept the solutions, so ${eqHtml(e)} has exactly one: ${fin}`, ok: true, say: 'Yes: equivalent steps all the way, so the first line has exactly the solutions of the last.' });
    opts.push({ t: `${fin} works when I check it, and that proves it is the only one`, mc: MC.examples, say: 'A check shows it works. That it is the ONLY one comes from the steps: each kept the solutions.' });
    opts.push({ t: `The last line is true, so every number is a solution`, say: `The last line has ${XH} in it: it is true only for ${fin.replace(`${XH} = `, '')}.` });
  } else if (s.kind === 'none') {
    opts.push({ t: `Every step kept the solutions, and ${fin} is never true, so there is no solution`, ok: true, say: 'Yes: the last line has no solutions, so neither does the first.' });
    opts.push({ t: `I tried ${XH} = 0, 1 and 2 and none worked, so there is no solution`, mc: MC.examples, say: 'Trying values cannot cover every number. The steps can: each one kept the solutions, and the last line is never true.' });
    opts.push({ t: `So ${XH} = ${nH(l.k)} = ${nH(r.k)}`, mc: MC.chainBad, say: `${nH(l.k)} = ${nH(r.k)} is false: it cannot be chained to ${XH}. Say it: the statement is false, so no solution.` });
    opts.push({ t: 'Something went wrong, because every equation has a solution', mc: MC.noSolErr, say: 'Nothing went wrong: some equations have no solution. Every step here was equivalent.' });
  } else {
    opts.push({ t: `Every step kept the solutions, and ${fin} is always true, so every number is a solution`, ok: true, say: 'Yes: the last line is true for every x, so the first one is too.' });
    opts.push({ t: `${XH} = 0 and ${XH} = 1 both work, so every number works`, mc: MC.examples, say: 'Two checks cannot cover every number. The steps can: each kept the solutions, and the last line is always true.' });
    opts.push({ t: `The ${XH}'s are gone, so ${XH} = 0`, mc: MC.zeroVsNone, say: `When the x's are gone, read the statement that is left: ${fin} is always true, so EVERY number works.` });
  }
  return choiceItem(R, {
    id: `argue-${n}`, family: 'argue', board: eqTex(e),
    prompt: `The steps for ${E(e)}: ${lines.map(t => t.replace(/<b class="s">|<\/b>/g, '')).join(' ')} Which sentence finishes the argument?`,
    solution: [...lines, 'Each step was equivalent (same thing to both sides, or a rewrite of one side), so the original has the same solutions as the last line.'],
  }, opts);
};
const context: Gen = (R, n) => {
  const v = pick(R, ['one', 'none', 'all', 'outside'] as const);
  if (v === 'none') {
    const r = pick(R, [15, 20, 25, 30, 35, 40]), F1 = pick(R, [10, 20, 25, 30, 40]), F2 = F1 + pick(R, [5, 10, 15, 20]);
    const e = eqOf([N(F1), X(r)], [N(F2), X(r)]);
    const tr = (s: string) => s.replace(/<i>x<\/i>/g, '<i>m</i>');
    return choiceItem(R, {
      id: `context-${n}`, family: 'context', board: eqTex(e).replace(/x/g, 'm'),
      prompt: `Gym A charges $${F1} to join plus $${r} a month. Gym B charges $${F2} to join plus $${r} a month. When do they cost the same? ${tr(E(e))} leads to ${B(`${F1} = ${F2}`)} (<i>m</i> ≥ 0 months).`,
      solution: [`${F1} = ${F2} is never true: no number of months makes the costs equal.`, `Gym B always costs $${F2 - F1} more: the same monthly fee keeps the gap.`],
    }, [
      { t: `Never: Gym B always costs $${F2 - F1} more`, ok: true, say: `Right. The monthly fees match, so the $${F2 - F1} gap never closes.` },
      { t: 'There must be a mistake in the algebra', mc: MC.noSolErr, say: 'No mistake: a false statement at the end means no solution. Here the gyms never cost the same.' },
      { t: 'They cost the same at 0 months', mc: MC.zeroVsNone, say: `At 0 months they cost $${F1} and $${F2}. No solution is not the same as 0.` },
      { t: `After ${F2 - F1} months`, mc: MC.contraValue, say: `${F2 - F1} is the gap in dollars, not a number of months. ${F1} = ${F2} is false, so never.` },
    ]);
  }
  if (v === 'all') {
    const r = pick(R, [2, 3, 4, 5, 6]), f = pick(R, [2, 3, 4, 5]), F = r * f;
    const e = eqOf([N(F), X(r)], [G(r, X(1), N(f))]);
    const tr = (s: string) => s.replace(/<i>x<\/i>/g, '<i>h</i>');
    return choiceItem(R, {
      id: `context-${n}`, family: 'context', board: eqTex(e).replace(/x/g, 'h'),
      prompt: `Bike shop A charges $${F} plus $${r} an hour. Shop B charges $${r} an hour but bills every ride ${f} hours longer. They cost the same when ${tr(E(e))} (<i>h</i> ≥ 0 hours). When is that?`,
      solution: [`${r}(h + ${f}) = ${r}h + ${F}: the two sides are the same expression.`, 'So they cost the same for every number of hours h ≥ 0.'],
    }, [
      { t: 'For every number of hours: both prices are the same expression', ok: true, say: `Right: ${r}(h + ${f}) is ${r}h + ${F}, so the shops always charge the same.` },
      { t: 'Only at 0 hours', mc: MC.zeroVsNone, say: `At 0 hours they match, and at every other number of hours too: the sides are the same expression.` },
      { t: 'Never: the h’s cancel, so there is no solution', mc: MC.cancelMisread, say: `After the h's cancel, ${F} = ${F} is left: TRUE. So every h ≥ 0 works.` },
      { t: `At ${F} hours`, mc: MC.bare, say: `${F} is a price in dollars. The prices match for every number of hours.` },
    ]);
  }
  const r1 = pick(R, [0.05, 0.1, 0.15, 0.2]), r2 = pick(R, [0.1, 0.15, 0.2, 0.25, 0.3].filter(z => z > r1));
  const m = pick(R, [50, 100, 120, 150, 200, 250, 300]);
  const F2 = pick(R, [10, 12, 15, 18, 20]);
  const F1 = Math.round((F2 + (v === 'one' ? 1 : -1) * (r2 - r1) * m) * 100) / 100;
  if (F1 <= 0 || Math.abs(F1 * 100 - Math.round(F1 * 100)) > 1e-9) return context(R, n);
  const e = eqOf([N(F1), X(r1)], [N(F2), X(r2)], 'dec');
  const s = solve(e) as { kind: 'one'; x: Q };
  const xm = num(s.x), cost = Math.round((F1 + r1 * xm) * 100) / 100;
  const tr = (z: string) => z.replace(/<i>x<\/i>/g, '<i>m</i>');
  const story = `Phone plan A costs $${F1.toFixed(2)} a month plus $${r1.toFixed(2)} a minute. Plan B costs $${F2.toFixed(2)} plus $${r2.toFixed(2)} a minute (<i>m</i> ≥ 0 minutes). Solving ${tr(E(e))} gives <i>m</i> = ${H(xm)}.`;
  if (v === 'one') return choiceItem(R, {
    id: `context-${n}`, family: 'context', board: eqTex(e).replace(/x/g, 'm'),
    prompt: `${story} What does that mean?`,
    solution: [`At ${H(xm)} minutes both plans cost $${cost.toFixed(2)}.`, 'Answer in a sentence with units: the number alone does not say what it means.'],
  }, [
    { t: `At ${H(xm)} minutes both plans cost $${cost.toFixed(2)}`, ok: true, say: 'Yes: a sentence with units says what the solution means.' },
    { t: `The answer is ${H(xm)}`, mc: MC.bare, say: `${H(xm)} what? Say what it means: at ${H(xm)} minutes both plans cost $${cost.toFixed(2)}.` },
    { t: `Plan B is $${H(xm)} more`, say: `${H(xm)} is a number of minutes, not dollars: at ${H(xm)} minutes the plans cost the same.` },
  ]);
  return choiceItem(R, {
    id: `context-${n}`, family: 'context', board: eqTex(e).replace(/x/g, 'm'),
    prompt: `${story} When do the plans cost the same?`,
    solution: [`<i>m</i> = ${H(xm)} is the algebraic solution, but minutes cannot be negative (<i>m</i> ≥ 0).`, `So the plans never cost the same: plan A is always cheaper for any possible number of minutes.`],
  }, [
    { t: `Never: ${H(xm)} minutes is not possible, so they never cost the same`, ok: true, say: 'Right. The algebra gives a number outside the situation: check the domain, m ≥ 0.' },
    { t: `At ${H(xm)} minutes`, mc: MC.ctxDomain, say: `A month cannot have ${H(xm)} minutes of calls. Only m ≥ 0 makes sense, so they never cost the same.` },
    { t: `At ${H(-xm)} minutes`, say: `Changing the sign changes the equation: at ${H(-xm)} minutes the costs differ. They never cost the same.` },
  ]);
};

export const GENERATORS: Record<FamilyId, Gen> = {
  checkBoth, evalSides, sameSet, keepStep, noResolve, varStep, rewrite, zeroStep, howMany,
  solve: solveF, nextLine, checkOrig, classify, predict, construct, nameProp, argue, context,
};
export { eqFor, workLines, classifySolve, checkLine };
