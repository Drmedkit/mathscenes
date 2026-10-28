// famB.ts: families on reasoning FROM conditionals: detachment, chaining (syllogism), modus tollens, the invalid
// forms with countermodels, converses, the contrapositive over the four cases, sufficient / necessary language,
// two-direction (if and only if) proofs and the four-way classification of a condition.
// The picture of a one-premise argument is the Euler picture of p -> q (P inside Q) with the places the member can
// stand: one place = something follows; two places = nothing follows.
import type { Paint } from '../../../core/theme';
import { type Pred, CASES, cmp, even, layoutOf, mult, valueOf } from '../conditional-statements/logic';
import type { ETok } from '../conditional-statements/eulerLayout';
import { type CPItem, type CPPicture, type Gen, type Opt, MC, NAMES, choiceItem, eulerOk, fitted, int, pick, shuffle } from './kit';
import { type Cond, type FormKey, type Rel, type Rule, A, B, CONDS, N, REL_WORDS, RULES, SPOTS, VALID, X, cap, fact, premise2, claimed, ruleText } from './reason';

const rulePrompt = (r: Rule) => `${r.intro ? r.intro + ' ' : ''}“${ruleText(r)}”${r.defs ? ` (${r.defs})` : ''}`;
/** the Euler picture of a rule with the places the member can stand (shown by the solve) */
function spotsEuler(r: Rule, f: FormKey) {
  const tokens: ETok[] = SPOTS[f].map(z => ({ tex: '\\bigstar', zone: z }));
  return { layout: 'nested' as const, domain: r.domain, P: r.P, Q: r.Q, tokens, regions: true, reveal: { glow: tokens.map((_, i) => [i, (SPOTS[f].length === 1 ? 'link' : 'pick')] as [number, Paint]) } };
}
const spotLine = (r: Rule, who: string, f: FormKey) => {
  return f === 'detach' ? `${cap(who)} is in the amber region, and amber sits inside teal: ${who} ${r.q}.`
    : f === 'tollens' ? `${cap(who)} is outside teal, and amber is inside teal, so ${who} is outside amber too: ${who} ${r.np}.`
      : f === 'affirm' ? `${cap(who)} is inside teal: it could sit inside amber or outside it. Two places, so nothing follows about “${r.p}”.`
        : `${cap(who)} is outside amber: it could be inside teal or outside it. Nothing follows about whether ${who} ${r.q}.`;
};

/** the conclusion a form claims, after "so": "it is even." (amber for p / not p, teal for q / not q) */
const soPart = (r: Rule, f: FormKey) => `${r.it} ${f === 'detach' ? B(r.q) : f === 'tollens' ? A(r.np) : f === 'affirm' ? A(r.p) : B(r.nq)}.`;

// ======================= detachment =======================
export const detach: Gen = (R, n) => fitted('detach', () => {
  const r = pick(R, RULES), who = pick(R, r.who), f = R() < 0.6 ? 'detach' : 'affirm';
  const euler = spotsEuler(r, f);
  if (!eulerOk(euler, {})) return null;
  const nothing = `Nothing new follows: ${who} may or may not ${f === 'affirm' ? r.p.replace(/^is /, 'be ').replace(/^are /, 'be ').replace(/^has /, 'have ').replace(/^form /, 'form ') : r.q}.`;
  const opts: Opt[] = f === 'detach' ? [
    { t: fact(who, r.q, ''), ok: true, say: `Right: the law of detachment. ${who} meets the hypothesis, so the conclusion holds.` },
    { t: fact(who, r.nq, ''), say: `The rule says every one that ${r.p.replace(/^is /, 'is ')} ${r.q.replace(/^is /, 'is ')}.` },
    { t: 'Nothing follows: the rule could have exceptions.', say: 'A rule “if p, then q” has no exceptions: p is given, so q follows.' },
  ] : [
    { t: fact(who, r.p, ''), mc: MC.affirm, say: `Having the conclusion does not give the hypothesis: the rule only works from “${r.p}” forward.` },
    { t: fact(who, r.np, ''), say: `Nothing rules that out either: ${who} could still ${r.p.replace(/^is /, 'be ').replace(/^are /, 'be ').replace(/^has /, 'have ')}.` },
    { t: nothing, ok: true, say: 'Right: knowing only the conclusion, nothing follows yet.' },
  ];
  return choiceItem(R, {
    id: `detach-${n}`, family: 'detach', prompt: `${rulePrompt(r)} You also know: ${premise2(r, who, f)} What can you conclude?`, board: '',
    solution: [`The rule puts the amber region (${r.P}) inside the teal region (${r.Q}).`, spotLine(r, who, f)],
    picture: { euler },
  }, opts);
});

/** which argument is the law of detachment (the others affirm the conclusion or deny the hypothesis) */
export const detachWhich: Gen = (R, n) => {
  const r = pick(R, RULES);
  const ws = shuffle(R, r.who.slice().concat(r.who)).slice(0, 3);
  const arg = (who: string, f: FormKey) => `${premise2(r, who, f).replace(/\.$/, '')}, so ${soPart(r, f)}`;
  return choiceItem(R, {
    id: `detachWhich-${n}`, family: 'detachWhich', prompt: `${rulePrompt(r)} ${pick(R, NAMES)} lists three arguments from this rule. Which one uses the <b>law of detachment</b> correctly?`, board: '',
    solution: ['Detachment: the rule and its hypothesis give its conclusion.', `So start from “${r.p}” and end on “${r.q}”.`],
    picture: { euler: { layout: 'nested', domain: r.domain, P: r.P, Q: r.Q, tokens: [], regions: true, reveal: {} } },
  }, [
    { t: arg(ws[0]!, 'detach'), ok: true, say: 'Right: hypothesis given, conclusion follows.' },
    { t: arg(ws[1]!, 'affirm'), mc: MC.affirm, say: 'That starts from the conclusion and claims the hypothesis: the rule does not run backward.' },
    { t: arg(ws[2]!, 'deny'), mc: MC.inverse, say: 'That starts from “not the hypothesis”: the rule promises nothing then.' },
  ]);
};

// ======================= chaining (law of syllogism) =======================
interface Chain { intro?: string; defs?: string; any: string; it: string; p: string; q: string; r: string; s?: string; P: string; Q: string; R: string }
const CHAINS: Chain[] = [
  { any: 'an integer', it: 'it', p: 'is a multiple of 12', q: 'is a multiple of 6', r: 'is a multiple of 3', P: 'multiple of 12', Q: 'multiple of 6', R: 'multiple of 3' },
  { any: 'an integer', it: 'it', p: 'is a multiple of 8', q: 'is a multiple of 4', r: 'is even', s: 'is not odd', P: 'multiple of 8', Q: 'multiple of 4', R: 'even' },
  { any: 'a number', it: 'it', p: 'is greater than 10', q: 'is greater than 5', r: 'is positive', P: 'greater than 10', Q: 'greater than 5', R: 'positive' },
  { defs: 'A rectangle is a parallelogram with four right angles; a square is a rectangle with four equal sides.', any: 'a quadrilateral', it: 'it', p: 'is a square', q: 'is a rectangle', r: 'is a parallelogram', P: 'square', Q: 'rectangle', R: 'parallelogram' },
  { intro: 'In the board game Quarry:', any: 'a tile', it: 'it', p: 'is gold', q: 'scores 5 points', r: 'goes to the bank', P: 'gold', Q: 'scores 5 points', R: 'goes to the bank' },
];
interface Fork { intro?: string; any: string; it: string; p: string; q: string; r: string; P: string; Q: string; R: string; why: string }
const FORKS: Fork[] = [
  { any: 'an integer', it: 'it', p: 'is a multiple of 6', r: 'is a multiple of 4', q: 'is even', P: 'multiple of 6', R: 'multiple of 4', Q: 'even', why: '6 is a multiple of 6 but not of 4.' },
  { any: 'an integer', it: 'it', p: 'is a multiple of 10', r: 'is a multiple of 15', q: 'is a multiple of 5', P: 'multiple of 10', R: 'multiple of 15', Q: 'multiple of 5', why: '10 is a multiple of 10 but not of 15.' },
  { intro: 'In the board game Quarry:', any: 'a tile', it: 'it', p: 'is gold', r: 'is silver', q: 'scores 5 points', P: 'gold', R: 'silver', Q: 'scores 5 points', why: 'a gold tile is not silver, although both score 5 points.' },
];
const IF = (any: string, it: string, a: string, b: string) => `If ${any} ${a}, then ${it} ${b}.`;
export const chain: Gen = (R, n) => {
  if (R() < 0.3) {
    const F = pick(R, FORKS);
    const prem = shuffle(R, [IF(F.any, F.it, A(F.p), B(F.q)), IF(F.any, F.it, F.r, B(F.q))]);
    return choiceItem(R, {
      id: `chain-${n}`, family: 'chain', prompt: `${F.intro ? F.intro + ' ' : ''}Both statements are true: “${prem[0]}” and “${prem[1]}” What follows from the two together?`, board: '',
      solution: ['Both statements end in the same part: P and R each sit inside Q, side by side.', `Nothing ties P to R: ${F.why}`],
      picture: { nest: { params: { layout: 'fork', P: F.P, Q: F.Q, R: F.R }, start: ['Q', 'P', 'R'], reveal: [], cross: true } },
    }, [
      { t: 'Nothing new about the two hypotheses follows.', ok: true, say: `Right: the middle terms do not link up. ${cap(F.why)}` },
      { t: IF(F.any, F.it, F.p, F.r), mc: MC.chainErr, say: `The chain needs the first conclusion to be the second hypothesis. Here both end in “${F.q}”. ${cap(F.why)}` },
      { t: IF(F.any, F.it, F.r, F.p), mc: MC.chainErr, say: `Two things that both lead to “${F.q}” need not lead to each other.` },
    ]);
  }
  const C = pick(R, CHAINS);
  const prem = shuffle(R, [IF(C.any, C.it, A(C.p), B(C.q)), IF(C.any, C.it, B(C.q), `<b class="s">${C.r}</b>`)]);
  return choiceItem(R, {
    id: `chain-${n}`, family: 'chain', prompt: `${C.intro ? C.intro + ' ' : ''}${C.defs ? C.defs + ' ' : ''}Both statements are true: “${prem[0]}” and “${prem[1]}” What follows from the two together?`, board: '',
    solution: [`The conclusion of one (${C.q}) is the hypothesis of the other.`, `P sits in Q, and Q sits in R, so P sits in R: ${IF(C.any, C.it, C.p, C.r)}`],
    picture: { nest: { params: { layout: 'chain', P: C.P, Q: C.Q, R: C.R, member: '★' }, start: ['R', 'Q', 'P'], reveal: ['member', 'glow'] } },
  }, [
    { t: IF(C.any, C.it, C.p, C.r), ok: true, say: 'Right: the law of syllogism chains the two.' },
    { t: IF(C.any, C.it, C.r, C.p), mc: MC.chainRev, say: `That runs the chain backward: something can ${C.r.replace(/^is /, 'be ').replace(/^goes /, 'go ')} without ${C.p.replace(/^is /, 'being ').replace(/^scores /, 'scoring ')}.` },
    { t: IF(C.any, C.it, C.q, C.p), mc: MC.converse, say: 'That is the converse of a premise, which need not be true.' },
    { t: 'Nothing follows: the two statements are about different things.', say: `They share “${C.q}”: the conclusion of one is the hypothesis of the other, so they chain.` },
  ]);
};

/** does a proposed conclusion follow from the premises? (chains, reversed chains, unmatched middles, three links) */
export const chainValid: Gen = (R, n) => {
  const kind = pick(R, ['ok', 'ok', 'rev', 'fork', 'long'] as const);
  let prem: string[], concl: string, follows: boolean, mc: string | undefined, why: string;
  if (kind === 'fork') {
    const F = pick(R, FORKS);
    prem = [IF(F.any, F.it, F.p, F.q), IF(F.any, F.it, F.r, F.q)]; concl = IF(F.any, F.it, F.p, F.r); follows = false; mc = MC.chainErr; why = `Both premises end in “${F.q}”: nothing links “${F.p}” to “${F.r}”. ${cap(F.why)}`;
  } else {
    const C = pick(R, CHAINS.filter(c => kind !== 'long' || c.s));
    prem = [IF(C.any, C.it, C.p, C.q), IF(C.any, C.it, C.q, C.r)];
    if (kind === 'long') { prem.push(IF(C.any, C.it, C.r, C.s!)); concl = IF(C.any, C.it, C.p, C.s!); follows = true; why = 'Each conclusion is the next hypothesis: the chain runs from the first hypothesis to the last conclusion.'; }
    else if (kind === 'ok') { concl = IF(C.any, C.it, C.p, C.r); follows = true; why = `The conclusion of one (${C.q}) is the hypothesis of the other: they chain.`; }
    else { concl = IF(C.any, C.it, C.r, C.p); follows = false; mc = MC.chainRev; why = 'The chain runs from the first hypothesis forward, not backward.'; }
  }
  prem = shuffle(R, prem);
  return choiceItem(R, {
    id: `chainValid-${n}`, family: 'chainValid', prompt: `Premises: ${prem.map(p => `“${p}”`).join(' ')} Proposed conclusion: “${concl}” Does it follow?`, board: '',
    solution: ['Look for a premise whose conclusion is the other premise’s hypothesis.', why],
    picture: { card: { lines: prem.map((p, i) => `${i + 1}. ${p}`), reveal: [`So? ${concl}`] } },
  }, [
    { t: 'Yes: it follows from the premises.', ok: follows, mc: follows ? undefined : mc, say: follows ? `Right. ${why}` : why },
    { t: 'No: it does not follow from the premises.', ok: !follows, say: follows ? why : `Right. ${why}` },
  ], true);
};

// ======================= invalid inference (countermodels) =======================
interface NumRule { r: Rule; P(v: number): boolean; Q(v: number): boolean; letter: string }
const NUMRULES: NumRule[] = [
  { r: RULES.find(x => x.key === 'm6')!, P: v => v % 6 === 0, Q: v => v % 2 === 0, letter: 'n' },
  { r: RULES.find(x => x.key === 'm4')!, P: v => v % 4 === 0, Q: v => v % 2 === 0, letter: 'n' },
  { r: RULES.find(x => x.key === 'm10')!, P: v => v % 10 === 0, Q: v => v % 5 === 0, letter: 'n' },
  { r: RULES.find(x => x.key === 'gt')!, P: v => v > 5, Q: v => v > 2, letter: 'x' },
];
/** the four statements a form talks about, with a number as the subject */
const numFact = (v: number, pred: string) => `${v} ${pred}.`;
export const validForm: Gen = (R, n) => {
  const f = pick(R, ['detach', 'tollens', 'affirm', 'affirm', 'deny', 'deny'] as const);
  const numeric = R() < 0.65;
  let rulePart: string, p2: string, concl: string, conclTrue: boolean | null = null;
  if (numeric) {
    const NR = pick(R, NUMRULES), r = NR.r;
    const xs = Array.from({ length: 40 }, (_, i) => i + 1).filter(v => (f === 'detach' ? NR.P(v) : f === 'tollens' ? !NR.Q(v) : f === 'affirm' ? NR.Q(v) : !NR.P(v)));
    const v = pick(R, xs);
    rulePart = `“${ruleText(r)}”`;
    p2 = numFact(v, f === 'detach' ? A(r.p) : f === 'tollens' ? B(r.nq) : f === 'affirm' ? B(r.q) : A(r.np));
    concl = numFact(v, f === 'detach' ? B(r.q) : f === 'tollens' ? A(r.np) : f === 'affirm' ? A(r.p) : B(r.nq));
    conclTrue = f === 'detach' ? NR.Q(v) : f === 'tollens' ? !NR.P(v) : f === 'affirm' ? NR.P(v) : !NR.Q(v);
  } else {
    const r = pick(R, RULES.filter(x => !x.defs)), who = pick(R, r.who);
    rulePart = rulePrompt(r); p2 = premise2(r, who, f); concl = claimed(r, who, f);
  }
  const valid = VALID[f];
  const opts: Opt[] = [
    { t: 'Valid: whenever both premises are true, the conclusion is true.', ok: valid, mc: valid ? undefined : f === 'affirm' ? MC.affirm : MC.inverse, say: valid ? 'Right: this is the ' + (f === 'detach' ? 'law of detachment.' : 'modus tollens form.') : `The form ${f === 'affirm' ? 'affirms the conclusion' : 'denies the hypothesis'}: premises can be true while the conclusion is false.` },
    { t: 'Invalid: both premises can be true while the conclusion is false.', ok: !valid, mc: valid && f === 'tollens' ? MC.missTollens : undefined, say: valid ? 'With these premises the conclusion cannot be false: the form is valid.' : 'Right: the form does not force the conclusion.' },
  ];
  if (conclTrue) {
    if (!valid) opts.push({ t: 'Valid: its conclusion is true.', mc: MC.byTruth, say: 'A true conclusion does not make an argument valid. Validity is about whether the premises force it.' });
    opts.push({ t: 'Invalid, so its conclusion is false.', mc: MC.failedDisproof, say: `${valid ? 'The argument is valid, and' : 'An invalid argument says nothing about its conclusion:'} the conclusion here is true.` });
  }
  return choiceItem(R, {
    id: `validForm-${n}`, family: 'validForm', prompt: `Premise 1: ${rulePart} Premise 2: ${p2} Conclusion: ${concl} Is the argument valid?`, board: '',
    solution: ['Valid means: whenever the premises are true, the conclusion must be true.', `Form: ${f === 'detach' ? 'hypothesis given, conclusion claimed (detachment): valid' : f === 'tollens' ? 'conclusion denied, hypothesis denied (modus tollens): valid' : f === 'affirm' ? 'conclusion given, hypothesis claimed: invalid' : 'hypothesis denied, conclusion denied: invalid'}.`],
    picture: { card: { lines: [`1. ${rulePart.replace(/^“|”$/g, '')}`, `2. ${p2}`, `So: ${concl}`] } },
  }, opts, true);
};

/** a countermodel for an invalid form: premises true, conclusion false */
export const countermodel: Gen = (R, n) => fitted('countermodel', () => {
  const NR = pick(R, NUMRULES), r = NR.r, f = pick(R, ['affirm', 'deny'] as const), L = NR.letter;
  const dom = Array.from({ length: 30 }, (_, i) => i + 1);
  const prem = (v: number) => (f === 'affirm' ? NR.Q(v) : !NR.P(v));
  const concl = (v: number) => (f === 'affirm' ? NR.P(v) : !NR.Q(v));
  const cm = dom.filter(v => prem(v) && !concl(v)), hold = dom.filter(v => prem(v) && concl(v)), off = dom.filter(v => !prem(v));
  if (!cm.length || !hold.length || !off.length) return null;
  const vals = [pick(R, cm.filter(v => v <= 16)), pick(R, hold.filter(v => v <= 24)), pick(R, off.filter(v => v <= 24))].sort((a, b) => a - b);
  const c0 = vals.find(v => prem(v) && !concl(v))!;
  const sub = (s: string) => s.replace(/^is /, 'is ');
  const v = `<i>${L}</i>`;
  const argT = f === 'affirm' ? `${v} ${B(r.q)}, so ${v} ${A(r.p)}` : `${v} ${A(r.np)}, so ${v} ${B(r.nq)}`;
  const tokens: ETok[] = vals.map(x => ({ tex: String(x), zone: NR.P(x) && NR.Q(x) ? 'pq' : NR.Q(x) ? 'q' : 'o' }));
  const euler = { layout: 'nested' as const, domain: 'the numbers to test', P: r.P, Q: r.Q, tokens, regions: false, tokensFirst: true, reveal: { glow: [[vals.indexOf(c0), 'wrong']] as [number, Paint][] } };
  if (!eulerOk(euler, {})) return null;
  void sub;
  return choiceItem(R, {
    id: `countermodel-${n}`, family: 'countermodel',
    prompt: `${pick(R, NAMES)} reasons from a true rule: “${ruleText({ ...r, any: `<i>${L}</i>`, it: `<i>${L}</i>` })}” Argument: “${argT}.” Which value is a <b>countermodel</b>: the rule and the premise true, the conclusion false?`, board: '',
    solution: ['A countermodel makes every premise true and the conclusion false.', ...vals.map(x => `${L} = ${x}: premise ${prem(x) ? 'true' : 'false'}, conclusion ${concl(x) ? 'true' : 'false'}.`)],
    picture: { euler },
  }, [
    ...vals.map(x => ({
      t: `${L} = ${x}`, ok: x === c0,
      mc: x === c0 ? undefined : prem(x) ? MC.cxHolds : MC.cxPremise,
      say: x === c0 ? `Right: the premise is true for ${x}, the conclusion is false. So the form is invalid.` : prem(x) ? `For ${x} the conclusion is true as well: that cannot show the argument fails.` : `For ${x} the premise is false: a countermodel needs every premise true.`,
    })),
    { t: 'None: the argument always works.', mc: f === 'affirm' ? MC.affirm : MC.inverse, say: `${L} = ${c0} makes the premise true and the conclusion false.` },
  ], true);
});

// ======================= converse truth =======================
interface Conv { s: string; conv: string; isTrue: boolean; why: string; bad: string; badWhy: string; badMc: string }
function convBank(R: () => number): Conv {
  const k = pick(R, ['odd', 'eq', 'm4', 'vert', 'lin', 'gt', 'even2', 'm10'] as const);
  const a = int(R, 2, 9), b = int(R, 2, 9), c6 = pick(R, [2, 6, 10, 14]);
  const n = '<i>n</i>', x = '<i>x</i>';
  switch (k) {
    case 'odd': return { s: `If ${n} is odd, then ${n} + 1 is even.`, conv: `If ${n} + 1 is even, then ${n} is odd.`, isTrue: true, why: `${n} + 1 = 2<i>k</i> gives ${n} = 2<i>k</i> − 1 = 2(<i>k</i> − 1) + 1, which is odd.`, bad: `${n} = 4`, badWhy: '4 + 1 = 5 is not even: the converse’s hypothesis is false there.', badMc: MC.cxPremise };
    case 'eq': return { s: `If ${x} = ${a}, then ${x} + ${b} = ${a + b}.`, conv: `If ${x} + ${b} = ${a + b}, then ${x} = ${a}.`, isTrue: true, why: `Subtract ${b} from both sides of ${x} + ${b} = ${a + b}: ${x} = ${a}.`, bad: `${x} = ${a + b}`, badWhy: `${a + b} + ${b} = ${a + 2 * b}, not ${a + b}: the converse’s hypothesis is false there.`, badMc: MC.cxPremise };
    case 'even2': return { s: `If ${n} is even, then ${n} + 2 is even.`, conv: `If ${n} + 2 is even, then ${n} is even.`, isTrue: true, why: `${n} + 2 = 2<i>k</i> gives ${n} = 2<i>k</i> − 2 = 2(<i>k</i> − 1), which is even.`, bad: `${n} = 3`, badWhy: '3 + 2 = 5 is not even: the converse’s hypothesis is false there.', badMc: MC.cxPremise };
    case 'm10': return { s: `If ${n} is a multiple of 10, then the last digit of ${n} is 0.`, conv: `If the last digit of ${n} is 0, then ${n} is a multiple of 10.`, isTrue: true, why: `A last digit of 0 means ${n} = 10 × (the number without that 0), a multiple of 10.`, bad: `${n} = 25`, badWhy: 'The last digit of 25 is 5: the converse’s hypothesis is false there.', badMc: MC.cxPremise };
    case 'm4': return { s: `If ${n} is a multiple of 4, then ${n} is even.`, conv: `If ${n} is even, then ${n} is a multiple of 4.`, isTrue: false, why: `${n} = ${c6} is even but not a multiple of 4.`, bad: `${n} = ${c6 + 2}`, badWhy: `${c6 + 2} is even AND a multiple of 4: the converse holds there.`, badMc: MC.cxHolds };
    case 'gt': return { s: `If ${x} &gt; 5, then ${x} &gt; 2.`, conv: `If ${x} &gt; 2, then ${x} &gt; 5.`, isTrue: false, why: `${x} = ${pick(R, [3, 4])} is greater than 2 but not greater than 5.`, bad: `${x} = 1`, badWhy: '1 is not greater than 2: the converse’s hypothesis is false there.', badMc: MC.cxPremise };
    case 'vert': return { s: 'If two angles are vertical angles, then they are congruent.', conv: 'If two angles are congruent, then they are vertical angles.', isTrue: false, why: 'the two base angles of an isosceles triangle are congruent but not vertical angles.', bad: 'a 30° angle and a 150° angle', badWhy: 'They are not congruent: the converse’s hypothesis is false there.', badMc: MC.cxPremise };
    case 'lin': return { s: 'If two angles form a linear pair, then they are supplementary.', conv: 'If two angles are supplementary, then they form a linear pair.', isTrue: false, why: 'a 70° angle in one triangle and a 110° angle in another are supplementary but share no side.', bad: 'two 70° angles', badWhy: '70° + 70° = 140°: not supplementary, so the converse’s hypothesis is false there.', badMc: MC.cxPremise };
  }
}
export const converseJudge: Gen = (R, n) => {
  const C = convBank(R);
  return choiceItem(R, {
    id: `converseJudge-${n}`, family: 'converseJudge', prompt: `True statement${C.s.includes('<i>n</i>') ? ' (<i>n</i> is any integer)' : C.s.includes('<i>x</i>') ? ' (<i>x</i> is any real number)' : ''}: “${C.s}” Its converse: “${C.conv}” Is the converse true? Pick the answer whose reason is correct.`, board: '',
    solution: ['A converse needs its own proof or its own counterexample.', C.isTrue ? `Proof: ${C.why}` : `Counterexample: ${C.why}`],
    picture: { card: { lines: [`Statement: ${C.s}`, `Converse: ${C.conv}`] } },
  }, [
    { t: C.isTrue ? `True: ${C.why}` : `False: ${C.why}`, ok: true, say: 'Right: the converse got its own argument.' },
    { t: 'True, because the statement it comes from is true.', mc: MC.converse, say: C.isTrue ? `It is true, but not for that reason: a converse can be false when the statement is true. Here: ${C.why}` : `The statement is true, yet the converse is false: ${C.why}` },
    { t: `False: ${C.bad} breaks it.`, mc: C.badMc, say: C.badWhy },
  ]);
};

/** the value that breaks a converse, on the Euler picture of a true statement */
const CONV_PAIRS: [Pred, Pred][] = [[mult(4), even], [mult(6), mult(3)], [cmp('>', 6), cmp('>', 3)], [mult(5), cmp('>', 4)]];
export const converseCx: Gen = (R, n) => fitted('converseCx', () => {
  const [P, Q] = pick(R, CONV_PAIRS);
  const xs = Array.from({ length: 12 }, (_, i) => i + 1);
  const brk = xs.filter(v => Q.test(v) && !P.test(v)), both = xs.filter(v => P.test(v) && Q.test(v)), none = xs.filter(v => !P.test(v) && !Q.test(v));
  if (!brk.length || !both.length || !none.length) return null;
  const vals = [pick(R, brk), pick(R, both), pick(R, none)].sort((a, b) => a - b);
  const b0 = vals.find(v => Q.test(v) && !P.test(v))!;
  const tokens: ETok[] = xs.map(v => ({ tex: String(v), zone: P.test(v) && Q.test(v) ? 'pq' : Q.test(v) ? 'q' : 'o' }));
  const euler = { layout: 'nested' as const, domain: 'the integers 1 to 12', P: P.label, Q: Q.label, tokens, regions: false, tokensFirst: true, reveal: { glow: [[xs.indexOf(b0), 'wrong']] as [number, Paint][], cross: [xs.indexOf(b0)] } };
  if (!eulerOk(euler, {})) return null;
  const conv = `If ${B(Q.says)}, then ${A(P.says)}.`;
  return choiceItem(R, {
    id: `converseCx-${n}`, family: 'converseCx', prompt: `${pick(R, NAMES)} notes: “If ${A(P.says)}, then ${B(Q.says)}.” is true for the integers 1 to 12. Which value breaks its converse, “${conv}”?`, board: '',
    solution: ['The converse has the teal part as its hypothesis: it breaks at a member in teal but outside amber.', ...vals.map(v => `${v}: ${Q.label} ${Q.test(v) ? 'yes' : 'no'}, ${P.label} ${P.test(v) ? 'yes' : 'no'}.`)],
    picture: { euler },
  }, [
    ...vals.map(v => ({
      t: `<i>n</i> = ${v}`, ok: v === b0,
      mc: v === b0 ? undefined : Q.test(v) ? MC.cxHolds : MC.cxPremise,
      say: v === b0 ? `Right: ${v} meets the converse’s hypothesis (${Q.label}) but not its conclusion (${P.label}).` : Q.test(v) ? `${v} has both properties: the converse holds there.` : `${v} is not ${Q.label}: the converse promises nothing for it.`,
    })),
    { t: 'None: the converse of a true statement is true.', mc: MC.converse, say: `The converse is a different statement: ${b0} breaks it.` },
  ], true);
});

// ======================= contrapositive equivalence =======================
const FT = ['p \\to q', 'q \\to p', '{\\sim}p \\to {\\sim}q', '{\\sim}q \\to {\\sim}p'];
const FNAME = ['the statement p → q', 'the converse q → p', 'the inverse ~p → ~q', 'the contrapositive ~q → ~p'];
const FORMK = ['original', 'converse', 'inverse', 'contrapositive'] as const;
export const fourCases: Gen = (R, n) => {
  const target = R() < 0.6 ? 0 : 1, partner = target === 0 ? 3 : 2;
  const rows = CASES.map(c => [c[0] ? 'T' : 'F', c[1] ? 'T' : 'F', ...FORMK.map(f => (valueOf(f, c) ? 'T' : 'F'))]);
  const others = [0, 1, 2, 3].filter(i => i !== target);
  return choiceItem(R, {
    id: `fourCases-${n}`, family: 'fourCases', prompt: `${pick(R, NAMES)} fills in the four cases of <i>p</i> and <i>q</i> for every form. Which form has the same truth value as ${FNAME[target]} in <b>all four</b> cases?`, board: '',
    solution: ['Fill each column: a conditional is false only when its hypothesis is true and its conclusion false.', `${FNAME[target]} reads ${CASES.map(c => (valueOf(FORMK[target]!, c) ? 'T' : 'F')).join(', ')}; ${FNAME[partner]} reads the same, row for row.`],
    picture: { table: { head: ['p', 'q', ...FT], headCol: ['first', 'second', 'ink', 'ink', 'ink', 'ink'], rows, keys: 2, start: [2 + target], ask: CASES.flatMap((_, i) => others.map(j => [i, 2 + j] as [number, number])), reveal: { cols: others.map(j => 2 + j) } } },
  }, others.map(j => ({
    t: FNAME[j]!.replace(/^the /, 'The '), ok: j === partner,
    mc: j === partner ? undefined : (target === 0 && j === 1) || (target === 1 && j === 0) ? MC.converse : (target === 0 && j === 2) ? MC.inverse : (target === 1 && j === 3) ? MC.contraAsConv : undefined,
    say: j === partner ? 'Right: they agree in every one of the four cases, so they are logically equivalent.' : `They differ in the case ${CASES.findIndex(c => valueOf(FORMK[j]!, c) !== valueOf(FORMK[target]!, c)) === 1 ? 'p true, q false' : 'p false, q true'}.`,
  })));
};

/** which related conditional must share the truth value of a known one (stipulated rules) */
export const mustBeTrue: Gen = (R, n) => {
  const r = pick(R, RULES.filter(x => !x.math || R() < 0.4));
  const know = r.math ? 'orig' : pick(R, ['orig', 'orig', 'false', 'conv'] as const);
  const S = {
    orig: IF(r.any, r.it, r.p, r.q), conv: IF(r.any, r.it, r.q, r.p), inv: IF(r.any, r.it, r.np, r.nq), contra: IF(r.any, r.it, r.nq, r.np),
  };
  const lead = know === 'orig' ? `This statement is true: “${S.orig}” Which statement <b>must</b> also be true?`
    : know === 'false' ? `Suppose this statement is <b>false</b>: “${S.orig}” Which statement must <b>also be false</b>?`
      : `Suppose this statement is true: “${S.conv}” Which statement <b>must</b> also be true?`;
  const right = know === 'conv' ? 'inv' : 'contra';
  const pool = (know === 'conv' ? ['orig', 'contra', 'inv'] : ['conv', 'inv', 'contra']) as (keyof typeof S)[];
  return choiceItem(R, {
    id: `mustBeTrue-${n}`, family: 'mustBeTrue', prompt: `${r.ctx ? r.ctx + ': ' : ''}${lead}`, board: '',
    solution: ['A conditional and its contrapositive agree in all four cases; so do the converse and the inverse.', know === 'conv' ? 'The converse is known, so its partner, the inverse, must be true.' : `So the contrapositive must be ${know === 'false' ? 'false' : 'true'} too.`],
    picture: { card: { lines: [know === 'conv' ? `Known: ${S.conv}` : `Known (${know === 'false' ? 'false' : 'true'}): ${S.orig}`] } },
  }, pool.map(k => ({
    t: S[k], ok: k === right,
    mc: k === right ? undefined : know !== 'conv' ? (k === 'conv' ? MC.converse : MC.inverse) : MC.converse,
    say: k === right ? 'Right: it is logically equivalent to the known statement.' : know === 'conv' ? 'That is equivalent to the original statement, not to its converse: it need not be true.' : k === 'conv' ? 'The converse can have a different truth value.' : 'The inverse can have a different truth value: it is equivalent to the converse, not to the statement.',
  })));
};

// ======================= modus tollens =======================
export const tollens: Gen = (R, n) => fitted('tollens', () => {
  const r = pick(R, RULES), who = pick(R, r.who), f = R() < 0.6 ? 'tollens' : 'deny';
  const euler = spotsEuler(r, f);
  if (!eulerOk(euler, {})) return null;
  const opts: Opt[] = f === 'tollens' ? [
    { t: fact(who, r.np, ''), ok: true, say: 'Right: modus tollens. Without the conclusion, the hypothesis cannot hold.' },
    { t: fact(who, r.p, ''), say: `That clashes with the facts: the rule would then give “${r.q}”, but you know “${r.nq}”.` },
    { t: 'Nothing follows: the rule only talks about the hypothesis.', mc: MC.missTollens, say: `It also works from the outside: without “${r.q}” there is no “${r.p}”. So ${who} ${r.np}.` },
  ] : [
    { t: fact(who, r.nq, ''), mc: MC.inverse, say: 'That is the inverse error: the rule promises nothing when the hypothesis is false.' },
    { t: fact(who, r.q, ''), say: 'Nothing forces that either.' },
    { t: `Nothing follows about whether ${who} ${r.q}.`, ok: true, say: 'Right: outside amber, a member can be inside teal or outside it.' },
  ];
  return choiceItem(R, {
    id: `tollens-${n}`, family: 'tollens', prompt: `${rulePrompt(r)} You also know: ${premise2(r, who, f)} What can you conclude?`, board: '',
    solution: [`The rule puts the amber region (${r.P}) inside the teal region (${r.Q}).`, spotLine(r, who, f)],
    picture: { euler },
  }, opts);
});

/** name the form: detachment, modus tollens, or neither (invalid) */
export const formName: Gen = (R, n) => fitted('formName', () => {
  const r = pick(R, RULES), who = pick(R, r.who), f = pick(R, ['detach', 'tollens', 'tollens', 'affirm', 'deny'] as const);
  const euler = spotsEuler(r, f);
  if (!eulerOk(euler, {})) return null;
  const right = f === 'detach' ? 'det' : f === 'tollens' ? 'tol' : 'none';
  return choiceItem(R, {
    id: `formName-${n}`, family: 'formName', prompt: `${rulePrompt(r)} Argument: “${premise2(r, who, f).replace(/\.$/, '')}, so ${soPart(r, f)}” Which law makes this argument valid?`, board: '',
    solution: ['Detachment: hypothesis → conclusion. Modus tollens: not the conclusion → not the hypothesis.', f === 'affirm' ? 'Here the conclusion is given and the hypothesis claimed: no law allows that.' : f === 'deny' ? 'Here the hypothesis is denied and the conclusion denied: no law allows that.' : spotLine(r, who, f)],
    picture: { euler },
  }, [
    { t: 'The law of detachment', ok: right === 'det', mc: f === 'affirm' ? MC.affirm : f === 'deny' ? MC.inverse : undefined, say: right === 'det' ? 'Right: hypothesis given, conclusion follows.' : 'Detachment starts from the hypothesis and ends on the conclusion.' },
    { t: 'Modus tollens', ok: right === 'tol', mc: f === 'deny' ? MC.inverse : undefined, say: right === 'tol' ? 'Right: not the conclusion, so not the hypothesis.' : 'Modus tollens starts from “not the conclusion”.' },
    { t: 'None: the argument is invalid', ok: right === 'none', mc: f === 'tollens' ? MC.missTollens : undefined, say: right === 'none' ? `Right: it ${f === 'affirm' ? 'affirms the conclusion' : 'denies the hypothesis'}.` : 'It is valid: ' + (f === 'detach' ? 'detachment.' : 'modus tollens.') },
  ], true);
});

// ======================= sufficient / necessary =======================
const letterOf = (c: Cond) => (c.domain.includes('<i>x</i>') ? 'x' : 'n');
const qc = (s: string) => `“${s}”`;
/** a conditional with a one-way relation: hypothesis -> conclusion true, the converse false */
function oneWay(R: () => number) {
  const c = pick(R, CONDS.filter(x => x.rel === 'suff' || x.rel === 'nec'));
  return c.rel === 'suff' ? { c, hyp: c.c, conc: c.p, side: 'c' as const } : { c, hyp: c.p, conc: c.c, side: 'p' as const };
}
export const suffRead: Gen = (R, n) => {
  const { c, hyp, conc, side } = oneWay(R);
  return choiceItem(R, {
    id: `suffRead-${n}`, family: 'suffRead', prompt: `${pick(R, NAMES)} rewrites a statement that is true for every value (${c.domain}): “If ${A(hyp)}, then ${B(conc)}.” Which sentence says the same thing?`, board: '',
    solution: ['“If p, then q” means: p is enough to guarantee q.', `So ${qc(hyp)} is sufficient for ${qc(conc)}.`],
    picture: condEuler(c, side) ?? { card: { lines: [`If ${A(hyp)}, then ${B(conc)}.`] } },
  }, [
    { t: `${qc(hyp)} is sufficient for ${qc(conc)}.`, ok: true, say: 'Right: the hypothesis is a sufficient condition for the conclusion.' },
    { t: `${qc(conc)} is sufficient for ${qc(hyp)}.`, mc: MC.necSuff, say: 'That reverses it: the conclusion is not enough to guarantee the hypothesis.' },
    { t: `${qc(hyp)} is necessary for ${qc(conc)}.`, mc: MC.necSuff, say: `The conclusion can hold without the hypothesis, so the hypothesis is not necessary for it.` },
  ]);
};
export const necRead: Gen = (R, n) => {
  const { c, hyp, conc, side } = oneWay(R);
  const onlyIf = R() < 0.5;
  return choiceItem(R, {
    id: `necRead-${n}`, family: 'necRead', prompt: `${pick(R, NAMES)} rewrites a statement that is true for every value (${c.domain}): “If ${A(hyp)}, then ${B(conc)}.” Which sentence says the same thing?`, board: '',
    solution: ['“If p, then q” means: p cannot happen without q.', onlyIf ? `So: ${cap(hyp)} only if ${conc}.` : `So ${qc(conc)} is necessary for ${qc(hyp)}.`],
    picture: condEuler(c, side) ?? { card: { lines: [`If ${A(hyp)}, then ${B(conc)}.`] } },
  }, [
    onlyIf ? { t: `${cap(hyp)} only if ${conc}.`, ok: true, say: 'Right: “p only if q” is another way to write “if p, then q”.' }
      : { t: `${qc(conc)} is necessary for ${qc(hyp)}.`, ok: true, say: 'Right: the conclusion is a necessary condition for the hypothesis.' },
    { t: `${qc(hyp)} is necessary for ${qc(conc)}.`, mc: MC.necSuff, say: 'That reverses it: the conclusion can hold without the hypothesis.' },
    { t: `${cap(conc)} only if ${hyp}.`, mc: MC.converse, say: '“q only if p” is the converse, “if q, then p”: not the same statement.' },
    { t: `${qc(conc)} is sufficient for ${qc(hyp)}.`, mc: MC.necSuff, say: 'Necessary is not sufficient: the conclusion does not guarantee the hypothesis.' },
  ]);
};
interface Wit { cNotP: number[]; pNotC: number[]; both: number[]; none: number[] }
function wit(c: Cond): Wit {
  const D = c.test.dom.filter(v => Math.abs(v) <= 20);
  return { cNotP: D.filter(v => c.test.c(v) && !c.test.p(v)), pNotC: D.filter(v => c.test.p(v) && !c.test.c(v)), both: D.filter(v => c.test.c(v) && c.test.p(v)), none: D.filter(v => !c.test.c(v) && !c.test.p(v)) };
}
/** the Euler picture of a condition pair on a sample of values (members line up first, the solve sorts them);
 *  hyp 'c': region P = the condition; 'p': region P = the property. Null when it does not fit (the item keeps its card). */
function condEuler(c: Cond, hyp: 'c' | 'p', mark: number[] = []): CPPicture | null {
  const L = letterOf(c), lo = c.domain.includes('positive') ? 1 : 0;
  const extra = [c.noSuff, c.noNec, ...mark].filter((v): v is number => v !== undefined);
  const xs = [...new Set([...Array.from({ length: 11 - extra.filter(v => v < lo || v > 10).length }, (_, i) => lo + i), ...extra])].sort((a, b) => a - b).slice(0, 12);
  const P = hyp === 'c' ? c.test.c : c.test.p, Q = hyp === 'c' ? c.test.p : c.test.c;
  const strip = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/^[nx] is (an? )?/, '');
  const zone = (v: number) => (P(v) && Q(v) ? 'pq' : P(v) ? 'p' : Q(v) ? 'q' : 'o') as 'pq' | 'p' | 'q' | 'o';
  const s0 = { pq: xs.filter(v => zone(v) === 'pq'), p: xs.filter(v => zone(v) === 'p'), q: xs.filter(v => zone(v) === 'q'), o: xs.filter(v => zone(v) === 'o') };
  if (!s0.pq.length && !s0.p.length) return null;
  const tokens: ETok[] = xs.map(v => ({ tex: String(v), zone: zone(v) }));
  const glow = mark.filter(v => xs.includes(v)).map(v => [xs.indexOf(v), 'pick'] as [number, Paint]);
  const euler = { layout: layoutOf(s0), domain: `some values of ${L}`, P: strip(hyp === 'c' ? c.c : c.p), Q: strip(hyp === 'c' ? c.p : c.c), tokens, tokensFirst: true, regions: false, reveal: { glow } };
  return eulerOk(euler, {}) ? { euler } : null;
}
const small = (R: () => number, xs: number[], prefer?: number) => (prefer !== undefined && xs.includes(prefer) ? prefer : pick(R, xs.filter(v => v > 0 && v <= 12).length ? xs.filter(v => v > 0 && v <= 12) : xs));
const vt = (c: Cond, v: number) => `<i>${letterOf(c)}</i> = ${v < 0 ? '−' + -v : v}${c.facts?.[v] ? ` (${c.facts[v]})` : ''}`;
/** is the condition sufficient (sg sufficient-condition) or necessary (sg necessary-condition)? */
function condJudge(R: () => number, n: number, which: 'suff' | 'nec', fam: string): CPItem {
  const c = pick(R, CONDS.filter(x => !x.facts || which === 'suff' || x.rel !== 'nec'));
  const w = wit(c);
  const holds = which === 'suff' ? c.rel === 'suff' || c.rel === 'both' : c.rel === 'nec' || c.rel === 'both';
  const word = which === 'suff' ? 'sufficient' : 'necessary';
  const yesWhy = which === 'suff' ? `every value with ${qc(c.c)} has ${qc(c.p)}` : `every value with ${qc(c.p)} has ${qc(c.c)}`;
  const opts: Opt[] = [];
  if (holds) {
    opts.push({ t: `Yes: ${yesWhy}.`, ok: true, say: `Right: ${yesWhy}.` });
    const wrongDir = which === 'suff' ? w.pNotC : w.cNotP;
    if (wrongDir.length) { const v = small(R, wrongDir, which === 'suff' ? c.noNec : c.noSuff); opts.push({ t: `No: ${vt(c, v)} has ${qc(which === 'suff' ? c.p : c.c)} but not ${qc(which === 'suff' ? c.c : c.p)}.`, mc: MC.necSuff, say: `That shows ${qc(c.c)} is not ${which === 'suff' ? 'necessary' : 'sufficient'}: the other direction.` }); }
    if (w.none.length) { const v = small(R, w.none); opts.push({ t: `No: ${vt(c, v)} has neither, so the link fails.`, mc: MC.cxPremise, say: `A value without ${qc(which === 'suff' ? c.c : c.p)} does not test this direction.` }); }
  } else {
    const v = small(R, which === 'suff' ? w.cNotP : w.pNotC, which === 'suff' ? c.noSuff : c.noNec);
    opts.push({ t: `No: ${vt(c, v)} has ${qc(which === 'suff' ? c.c : c.p)} but not ${qc(which === 'suff' ? c.p : c.c)}.`, ok: true, say: `Right: that one value shows ${qc(c.c)} is not ${word}.` });
    if (w.both.length) { const b = small(R, w.both); opts.push({ t: `Yes: ${vt(c, b)} has both.`, mc: MC.examples, say: 'One value with both is an example; it cannot show “every”.' }); }
    const otherOk = which === 'suff' ? c.rel === 'nec' : c.rel === 'suff';
    if (otherOk) opts.push({ t: `Yes: every value with ${qc(which === 'suff' ? c.p : c.c)} has ${qc(which === 'suff' ? c.c : c.p)}.`, mc: MC.necSuff, say: `True, but that is the other direction: it shows ${qc(c.c)} is ${which === 'suff' ? 'necessary' : 'sufficient'}.` });
    else if (c.usual && which === 'nec') opts.push({ t: `Yes: values with ${qc(c.p)} usually have ${qc(c.c)}.`, mc: MC.usual, say: '“Usually” is not “always”: one exception makes it not necessary.' });
  }
  if (opts.length < 2) return condJudge(R, n, which, fam);
  return choiceItem(R, {
    id: `${fam}-${n}`, family: fam, prompt: `${cap(c.domain)}. Is ${qc(c.c)} ${word} for ${qc(c.p)}?`, board: '',
    solution: [which === 'suff' ? `Sufficient means: if ${c.c}, then ${c.p}, for every value.` : `Necessary means: if ${c.p}, then ${c.c}, for every value.`, holds ? `That is true: ${yesWhy}.` : `It fails: ${opts.find(o => o.ok)!.t.replace(/^No: /, '')}`],
    picture: condEuler(c, which === 'suff' ? 'c' : 'p') ?? { card: { lines: [`condition: ${c.c}`, `property: ${c.p}`] } },
  }, opts);
}
export const suffTrue: Gen = (R, n) => condJudge(R, n, 'suff', 'suffTrue');
export const necTrue: Gen = (R, n) => condJudge(R, n, 'nec', 'necTrue');

// ======================= if and only if =======================
interface Iff { a: string; b: string; both: boolean; fwd: string; back?: string; cx?: string }
const IFFS: Iff[] = [
  { a: `${N} is odd`, b: `${N} + 1 is even`, both: true, fwd: `${N} = 2<i>k</i> + 1 gives ${N} + 1 = 2(<i>k</i> + 1), which is even.`, back: `${N} + 1 = 2<i>k</i> gives ${N} = 2(<i>k</i> − 1) + 1, which is odd.` },
  { a: `${N} is even`, b: `${N} + 2 is even`, both: true, fwd: `${N} = 2<i>k</i> gives ${N} + 2 = 2(<i>k</i> + 1), which is even.`, back: `${N} + 2 = 2<i>k</i> gives ${N} = 2(<i>k</i> − 1), which is even.` },
  { a: `${X} + 3 = 10`, b: `${X} = 7`, both: true, fwd: 'Subtract 3 from both sides.', back: 'Add 3 to both sides: 7 + 3 = 10.' },
  { a: `${N} is a multiple of 4`, b: `${N} is even`, both: false, fwd: `${N} = 4<i>k</i> = 2(2<i>k</i>), which is even.`, cx: `${N} = 6 is even but not a multiple of 4` },
  { a: `${N} is a multiple of 6`, b: `${N} is a multiple of 3`, both: false, fwd: `${N} = 6<i>k</i> = 3(2<i>k</i>), a multiple of 3.`, cx: `${N} = 9 is a multiple of 3 but not of 6` },
  { a: 'two angles form a linear pair', b: 'they are supplementary', both: false, fwd: 'The Linear Pair Postulate.', cx: 'a 70° angle and a 110° angle in different triangles are supplementary but form no linear pair' },
];
export const iffParts: Gen = (R, n) => {
  const I = pick(R, IFFS.filter(x => x.both));
  return choiceItem(R, {
    id: `iffParts-${n}`, family: 'iffParts', prompt: `${pick(R, NAMES)} wants to prove “${A(I.a)} if and only if ${B(I.b)}”. What must the proof show?`, board: '',
    solution: ['“If and only if” packs two conditionals into one claim.', 'Each direction needs its own proof.'],
    picture: { card: { lines: [`${A(I.a)} if and only if ${B(I.b)}`], reveal: [`If ${I.a}, then ${I.b}.`, `If ${I.b}, then ${I.a}.`] } },
  }, [
    { t: `Both “if ${I.a}, then ${I.b}” and “if ${I.b}, then ${I.a}”.`, ok: true, say: 'Right: two proof obligations, one for each direction.' },
    { t: `Only “if ${I.a}, then ${I.b}”.`, mc: MC.iffOne, say: 'That is one direction: the “only if” half still needs proof.' },
    { t: `Only “if ${I.b}, then ${I.a}”.`, mc: MC.iffOne, say: 'That is one direction: the other half still needs proof.' },
    { t: `“If ${I.a}, then ${I.b}”, plus a few examples of the other direction.`, mc: MC.examples, say: 'Examples cannot replace the proof of the second direction.' },
  ]);
};
export const iffJudge: Gen = (R, n) => {
  const I = pick(R, IFFS), who = pick(R, NAMES);
  const sit = I.both ? (R() < 0.5 ? 'both' : 'one') : 'false';
  const lines = [`Claim: ${I.a} if and only if ${I.b}.`, `${who}’s proof of “if ${I.a}, then ${I.b}”: ${I.fwd}`, ...(sit === 'both' ? [`${who}’s proof of “if ${I.b}, then ${I.a}”: ${I.back}`] : [])];
  const O = {
    yesBoth: 'Yes: both directions are proved.',
    oneEnough: 'Yes: one direction is enough.',
    notYet: `Not yet: “if ${I.b}, then ${I.a}” still needs its own proof.`,
    isFalse: 'No: the proof is incomplete, so the claim is false.',
    cx: `No: the claim is false, since ${I.cx}.`,
  };
  const keys = sit === 'both' ? (['yesBoth', 'notYet', 'isFalse'] as const) : sit === 'one' ? (['oneEnough', 'notYet', 'isFalse'] as const) : (['oneEnough', 'yesBoth', 'cx'] as const);
  const right = sit === 'both' ? 'yesBoth' : sit === 'one' ? 'notYet' : 'cx';
  return choiceItem(R, {
    id: `iffJudge-${n}`, family: 'iffJudge', prompt: `${lines.map(l => l).join(' ')} Is the “if and only if” claim proved?`, board: '',
    solution: ['An “if and only if” claim needs both directions.', sit === 'both' ? 'Both directions are proved.' : sit === 'one' ? `Only one direction is proved; the other is true but still needs its proof (${I.back!.replace(/\.$/, '')}).` : `Only one direction is proved, and the other is false: ${I.cx}.`],
    picture: { card: { lines } },
  }, keys.map(k => ({
    t: O[k], ok: k === right,
    mc: k === right ? undefined : k === 'oneEnough' ? MC.iffOne : k === 'isFalse' ? MC.failedDisproof : k === 'yesBoth' ? MC.iffOne : undefined,
    say: k === right ? 'Right.' : k === 'oneEnough' ? 'One direction is half of an “if and only if” claim.' : k === 'isFalse' ? 'A missing proof leaves the claim open; it does not make it false.' : k === 'notYet' ? 'Look again: both directions are there.' : 'Only one direction is proved.',
  })), true);
};

// ======================= classify a condition =======================
interface WCond { intro?: string; c: string; p: string; rel: Rel; s: string; nn: string }
const WCONDS: WCond[] = [
  { c: '∠1 and ∠2 are vertical angles', p: '∠1 ≅ ∠2', rel: 'suff', s: 'If vertical, then congruent: the Vertical Angles Theorem.', nn: 'If congruent, not always vertical: the base angles of an isosceles triangle.' },
  { c: '∠1 and ∠2 form a linear pair', p: 'm∠1 + m∠2 = 180°', rel: 'suff', s: 'If a linear pair, then they add to 180°: the Linear Pair Postulate.', nn: 'Adding to 180° does not need a linear pair: a 70° and a 110° angle far apart.' },
  { c: 'm∠1 + m∠2 = 180°', p: '∠1 and ∠2 form a linear pair', rel: 'nec', s: 'Adding to 180° does not make a linear pair: a 70° and a 110° angle far apart.', nn: 'Every linear pair adds to 180°.' },
  { c: 'ABCD has four right angles', p: 'ABCD is a square', rel: 'nec', s: 'Four right angles do not make a square: a 3 by 5 rectangle.', nn: 'Every square has four right angles (by its definition: four right angles and four equal sides).' },
  { intro: 'In the board game Quarry, a tile scores 5 points if it is gold, and only gold tiles score 5 points.', c: 'a tile is gold', p: 'it scores 5 points', rel: 'both', s: 'Every gold tile scores 5 points.', nn: 'Only gold tiles score 5 points.' },
  { intro: 'In Quarry, some red tiles score 2 points and some score 5 points; every blue tile scores 5 points.', c: 'a tile is red', p: 'it scores 5 points', rel: 'neither', s: 'A red tile can score 2 points.', nn: 'A blue tile scores 5 points without being red.' },
];
function relMc(ans: Rel, pickR: Rel, usual: boolean): string | undefined {
  if (ans === pickR) return undefined;
  if (ans === 'neither') return pickR === 'nec' && usual ? MC.usual : MC.noNeither;
  if ((ans === 'suff' && pickR === 'nec') || (ans === 'nec' && pickR === 'suff')) return MC.necSuff;
  if (pickR === 'both') return MC.converse;
  return undefined;
}
export const classify: Gen = (R, n) => {
  const useW = R() < 0.35;
  let cTxt: string, pTxt: string, rel: Rel, s: string, nn: string, usual = false, intro = '', pic: CPPicture | null = null;
  if (useW) {
    const w = pick(R, WCONDS); cTxt = w.c; pTxt = w.p; rel = w.rel; s = w.s; nn = w.nn; intro = w.intro ? w.intro + ' ' : '';
  } else {
    const c = pick(R, CONDS), W = wit(c);
    cTxt = c.c; pTxt = c.p; rel = c.rel; usual = !!c.usual;
    const sOk = rel === 'suff' || rel === 'both', nOk = rel === 'nec' || rel === 'both';
    s = sOk ? `If ${c.c}, then ${c.p}: true for every value.` : `If ${c.c}, then ${c.p}: false, ${vt(c, small(R, W.cNotP, c.noSuff))} breaks it.`;
    nn = nOk ? `If ${c.p}, then ${c.c}: true for every value.` : `If ${c.p}, then ${c.c}: false, ${vt(c, small(R, W.pNotC, c.noNec))} breaks it.`;
    intro = `${cap(c.domain)}. `;
    pic = condEuler(c, 'c');
  }
  return choiceItem(R, {
    id: `classify-${n}`, family: 'classify', prompt: `${intro}Is ${qc(cTxt)} a necessary condition, a sufficient condition, both or neither for ${qc(pTxt)}?`, board: '',
    solution: ['Test both directions.', s, nn],
    picture: pic ?? { card: { lines: [`condition: ${cTxt}`, `property: ${pTxt}`], reveal: [s, nn] } },
  }, (['suff', 'nec', 'both', 'neither'] as Rel[]).map(k => ({
    t: REL_WORDS[k], ok: k === rel, mc: relMc(rel, k, usual),
    say: k === rel ? `Right. ${s} ${nn}` : `${s} ${nn}`,
  })), true);
};
/** the value that shows a condition is not sufficient (or not necessary) */
export const classifyWhy: Gen = (R, n) => {
  const which = R() < 0.5 ? 'suff' : 'nec';
  const c = pick(R, CONDS.filter(x => (which === 'suff' ? x.rel === 'nec' || x.rel === 'neither' : x.rel === 'suff' || x.rel === 'neither')));
  const W = wit(c);
  const good = small(R, which === 'suff' ? W.cNotP : W.pNotC, which === 'suff' ? c.noSuff : c.noNec);
  const bothV = W.both.length ? small(R, W.both) : null;
  const offPool = which === 'suff' ? W.none.concat(W.pNotC) : W.none.concat(W.cNotP);
  const offV = offPool.length ? small(R, offPool) : null;
  const opts: Opt[] = [{ t: vt(c, good), ok: true, say: `Right: ${vt(c, good)} has ${qc(which === 'suff' ? c.c : c.p)} but not ${qc(which === 'suff' ? c.p : c.c)}.` }];
  if (bothV !== null) opts.push({ t: vt(c, bothV), mc: MC.cxHolds, say: `${vt(c, bothV)} has both: it fits the link instead of breaking it.` });
  if (offV !== null) opts.push({ t: vt(c, offV), mc: MC.cxPremise, say: `${vt(c, offV)} does not have ${qc(which === 'suff' ? c.c : c.p)}: it cannot test this direction.` });
  if (opts.length < 3) return classifyWhy(R, n);
  return choiceItem(R, {
    id: `classifyWhy-${n}`, family: 'classifyWhy', prompt: `${cap(c.domain)}. ${qc(c.c)} is <b>not ${which === 'suff' ? 'sufficient' : 'necessary'}</b> for ${qc(c.p)}. Which value shows it?`, board: '',
    solution: [which === 'suff' ? `Not sufficient: some value has ${qc(c.c)} without ${qc(c.p)}.` : `Not necessary: some value has ${qc(c.p)} without ${qc(c.c)}.`, `${vt(c, good)} is one.`],
    picture: condEuler(c, 'c') ?? { card: { lines: [`condition: ${c.c}`, `property: ${c.p}`] } },
  }, opts);
};

export const FAM_B: Record<string, Gen> = { detach, detachWhich, chain, chainValid, validForm, countermodel, converseJudge, converseCx, fourCases, mustBeTrue, tollens, formName, suffRead, necRead, suffTrue, necTrue, iffParts, iffJudge, classify, classifyWhy };
