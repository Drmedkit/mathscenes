// famA.ts: families on breaking and proving universal claims: counterexamples (checked: in the domain, hypothesis
// true, conclusion false), examples vs a general argument (and what an argument covers), general representations with
// declared integer letters, short direct proofs in the course's proof frame, and auditing a supplied proof.
import { type Paint } from '../../../core/theme';
import { LETTERS, SHAPES, type Shape, layoutOf, shapePreds, sortDomain, zoneOf } from '../conditional-statements/logic';
import { eulerFits, type ETok } from '../conditional-statements/eulerLayout';
import { FR_LEFT, figProblems } from '../geometry-foundations/geo';
import { RS, makeProof, type Proof, type ReasonKey } from '../geometry-foundations/proofs';
import { type Base, type CPItem, type Gen, type Opt, type ProofPic, type TablePic, MC, NAMES, UNDER, WIDE, choiceItem, fitted, int, pick, shuffle } from './kit';
import { type Claim, type Val, A, B, CLAIMS, H, N, claimText, valText } from './reason';

const TF = (b: boolean) => (b ? 'T' : 'F');
const byVal = (a: Val, b: Val) => a.v[0]! - b.v[0]! || (a.v[1] ?? 0) - (b.v[1] ?? 0);
/** the value table of a claim: the letter(s), a supplied fact, the hypothesis and the conclusion ('?' until the solve) */
function claimTable(c: Claim, vals: Val[], ring: number[]): TablePic {
  const f = !!c.factHead;
  const head = [c.vT, ...(f ? [c.factHead!] : []), c.hT, c.cT];
  const keys = f ? 2 : 1;
  const rows = vals.map(v => [v.tex, ...(f ? [v.factTex!.replace(/^.*= /, '')] : []), TF(c.P(v.v)), TF(c.Q(v.v))]);
  return {
    head, headCol: [...(f ? ['dim', 'dim'] : ['dim']), 'first', 'second'] as Paint[], rows, keys, start: [],
    ask: vals.flatMap((_, i) => [[i, keys], [i, keys + 1]] as [number, number][]),
    reveal: { cols: [keys, keys + 1], rings: ring.map(i => [i, 'wrong'] as [number, Paint]) },
  };
}
const factsLine = (vals: Val[]) => { const fs = vals.filter(v => v.fact).map(v => v.fact!); return fs.length ? ` Use: ${fs.join(', ')}.` : ''; };
const domainOf = (c: Claim) => `(${c.domain}.)`;
/** a value's two checks, as a solution line */
function checkLine(c: Claim, v: Val): string {
  const p = c.P(v.v), qq = c.Q(v.v);
  return `${valText(c, v)}: hypothesis ${p ? 'true' : 'false'}, conclusion ${qq ? 'true' : 'false'}${p && !qq ? ' — it breaks the claim' : !p ? ' — the claim promises nothing here' : ' — the claim holds'}.`;
}

// ======================= counterexample =======================
export const cxPick: Gen = (R, n) => fitted('cxPick', () => {
  const c = pick(R, CLAIMS);
  const cx = pick(R, c.cx);
  const others = shuffle(R, [...(c.holds.length ? [pick(R, c.holds)] : []), ...(c.premise.length ? [pick(R, c.premise)] : []), ...(c.other.length ? [pick(R, c.other)] : [])]).slice(0, 3);
  if (others.length < 2) return null;
  const vals = [cx, ...others].sort(byVal);
  const opts: Opt[] = vals.map(v => {
    const p = c.P(v.v), qq = c.Q(v.v);
    if (v === cx) return { t: valText(c, v), ok: true, say: `Yes: ${valText(c, v)} makes the hypothesis true and the conclusion false.` };
    if (p) return { t: valText(c, v), mc: MC.cxHolds, say: `For ${valText(c, v)} the hypothesis and the conclusion are both true: the claim holds there.` };
    if (!qq) return { t: valText(c, v), mc: MC.cxPremise, say: `The conclusion fails for ${valText(c, v)}, but so does the hypothesis. The claim only promises something when the hypothesis is true.` };
    return { t: valText(c, v), say: `For ${valText(c, v)} the hypothesis is false: the claim promises nothing there.` };
  });
  const ring = [vals.indexOf(cx)];
  return choiceItem(R, {
    id: `cxPick-${n}`, family: 'cxPick',
    prompt: `Claim: “${claimText(c)}” ${domainOf(c)} Which value is a <b>counterexample</b>?${factsLine(vals)}${c.note ? ` (${c.note})` : ''}`,
    board: '', solution: ['A counterexample is in the domain, makes the hypothesis true and the conclusion false.', `Not counterexamples: ${vals.filter(v => v !== cx).map(v => `${valText(c, v)} (${c.P(v.v) ? 'both parts true' : 'hypothesis false'})`).join(', ')}.`, checkLine(c, cx)],
    picture: { table: claimTable(c, vals, ring) },
  }, opts);
});

/** a candidate someone offers: right or wrong for a reason the student names */
export const cxJudge: Gen = (R, n) => fitted('cxJudge', () => {
  const c = pick(R, CLAIMS);
  const kind = pick(R, ['cx', 'cx', 'holds', 'premise', 'other'] as const);
  const pool = c[kind];
  if (!pool.length) return null;
  const v = pick(R, pool), who = pick(R, NAMES);
  const O = {
    yes: 'Yes: the hypothesis is true and the conclusion is false, so the claim is false.',
    hypF: 'No: the hypothesis is false, so the claim promises nothing for this value.',
    both: 'No: the hypothesis and the conclusion are both true.',
    exc: 'It breaks the claim, but the claim is still true: one exception does not count.',
  };
  const right = kind === 'cx' ? 'yes' : kind === 'holds' ? 'both' : 'hypF';
  const opts: Opt[] = (['yes', 'hypF', 'both', 'exc'] as const).map(k => ({
    t: O[k], ok: k === right,
    mc: k === right ? undefined : k === 'exc' ? MC.cxException : k === 'yes' ? (kind === 'holds' ? MC.cxHolds : kind === 'premise' ? MC.cxPremise : undefined) : undefined,
    say: k === right ? `Right. ${checkLine(c, v)}` : k === 'exc' ? 'One checked counterexample makes an “every” claim false. There are no allowed exceptions.' : checkLine(c, v),
  }));
  const f = v.fact ? ` (Use: ${v.fact}.)` : '';
  return choiceItem(R, {
    id: `cxJudge-${n}`, family: 'cxJudge',
    prompt: `Claim: “${claimText(c)}” ${domainOf(c)} ${who} says ${valText(c, v)} is a counterexample.${f}${c.note ? ` (${c.note})` : ''} Is ${who} right?`,
    board: '', solution: ['Check the value against both parts.', checkLine(c, v), kind === 'cx' ? 'So it is a counterexample, and the claim is false.' : 'So it is not a counterexample.'],
    picture: { card: { lines: [`Claim: ${claimText(c)}`, `${who}: ${valText(c, v)}`] }, table: claimTable(c, [v], kind === 'cx' ? [0] : []) },
  }, opts, true);
});

/** supplied-definition shape claims: shapes decided by their marks */
const SH_CLAIMS: { hyp: string; conc: string; P: (s: Shape) => boolean; Q: (s: Shape) => boolean; Pl: string; Ql: string; defs: string; cx: () => Shape; others: (() => Shape)[] }[] = [
  { hyp: 'a quadrilateral has four equal sides', conc: 'it is a square', P: shapePreds.fourEqual.test, Q: s => shapePreds.fourEqual.test(s) && shapePreds.fourRight.test(s), Pl: 'four equal sides', Ql: 'square', defs: 'A square has four equal sides and four right angles.', cx: () => SHAPES.rhombus(), others: [() => SHAPES.square(0, 36), () => SHAPES.rect(), () => SHAPES.kite(), () => SHAPES.trap()] },
  { hyp: 'a quadrilateral has four right angles', conc: 'it has four equal sides', P: shapePreds.fourRight.test, Q: shapePreds.fourEqual.test, Pl: 'four right angles', Ql: 'four equal sides', defs: 'A small square marks a right angle; matching ticks mark equal sides.', cx: () => SHAPES.rect(), others: [() => SHAPES.square(15, 34), () => SHAPES.rhombus(), () => SHAPES.para(), () => SHAPES.kite()] },
  { hyp: 'a triangle has two equal sides', conc: 'it has three equal sides', P: shapePreds.twoEqual.test, Q: shapePreds.threeEqual.test, Pl: 'two equal sides', Ql: 'three equal sides', defs: 'Matching ticks mark equal sides; sides without ticks are not equal.', cx: () => SHAPES.iso(), others: [() => SHAPES.equi(), () => SHAPES.scalene(), () => SHAPES.rightTri()] },
  { hyp: 'a triangle has a right angle', conc: 'it has two equal sides', P: shapePreds.rightAngle.test, Q: shapePreds.twoEqual.test, Pl: 'a right angle', Ql: 'two equal sides', defs: 'A small square marks a right angle; matching ticks mark equal sides.', cx: () => SHAPES.rightTri(), others: [() => SHAPES.rightIso(), () => SHAPES.scalene(), () => SHAPES.iso()] },
];
export const cxShape: Gen = (R, n) => fitted('cxShape', () => {
  const C = pick(R, SH_CLAIMS);
  const shapes = shuffle(R, [C.cx(), ...shuffle(R, C.others.slice()).slice(0, 3).map(f => f())]);
  if (shapes.filter(s => C.P(s) && !C.Q(s)).length !== 1) return null;
  const P = { key: 'p', says: C.hyp, neg: '', label: C.Pl, negLabel: '', test: C.P }, Q = { key: 'q', says: C.conc, neg: '', label: C.Ql, negLabel: '', test: C.Q };
  const s = sortDomain(shapes, P, Q);
  const tokens: ETok[] = shapes.map((sh, i) => ({ shape: sh, letter: LETTERS[i], zone: zoneOf(C.P(sh), C.Q(sh)) }));
  const ix = shapes.findIndex(sh => C.P(sh) && !C.Q(sh));
  const euler = { layout: layoutOf(s), domain: `the shapes A to ${LETTERS[shapes.length - 1]}`, P: C.Pl, Q: C.Ql, tokens, tokensFirst: true, reveal: { glow: [[ix, 'wrong']] as [number, Paint][], cross: [ix] } };
  if (!eulerFits(euler, WIDE)) return null;
  const opts: Opt[] = shapes.map((sh, i) => {
    const p = C.P(sh), qq = C.Q(sh), t = `Shape ${LETTERS[i]}`;
    if (i === ix) return { t, ok: true, say: `Yes: shape ${LETTERS[i]} has ${C.Pl} but not ${C.Ql}.` };
    if (p) return { t, mc: MC.cxHolds, say: `Shape ${LETTERS[i]} has ${C.Pl} and ${C.Ql}: the claim holds for it.` };
    if (!qq) return { t, mc: MC.cxPremise, say: `Shape ${LETTERS[i]} lacks ${C.Ql}, but it also lacks ${C.Pl}: the claim promises nothing for it.` };
    return { t, say: `Shape ${LETTERS[i]} does not have ${C.Pl}: the claim promises nothing for it.` };
  });
  return choiceItem(R, {
    id: `cxShape-${n}`, family: 'cxShape',
    prompt: `${pick(R, NAMES)} claims: “If ${A(C.hyp)}, then ${B(C.conc)}.” ${C.defs} Which shape is a <b>counterexample</b>?`,
    board: '', solution: ['A counterexample has the hypothesis and lacks the conclusion. Read each shape’s marks.', shapes.map((sh, i) => (i === ix ? '' : `Shape ${LETTERS[i]}: ${C.Pl} ${C.P(sh) ? 'yes' : 'no'}, ${C.Ql} ${C.Q(sh) ? 'yes' : 'no'}.`)).filter(Boolean).join(' '), `Shape ${LETTERS[ix]}: ${C.Pl} yes, ${C.Ql} no — it breaks the claim.`],
    picture: { euler },
  }, opts, true);
});

// ======================= generality of proof =======================
const PRIME41 = (k: number) => k * k + k + 41;
export const examplesProof: Gen = (R, n) => {
  const kind = pick(R, ['euler', 'circle', 'finite', 'finite', 'triangles'] as const);
  const who = pick(R, NAMES);
  const NP = 'Not proved: checks cover only the values that were checked.';
  if (kind === 'euler') {
    const k = int(R, 6, 12);
    const shown = [0, 1, 2, 3, k - 1, k].filter((x, i, a) => a.indexOf(x) === i).slice(-6);
    const table: TablePic = { head: ['n', 'n^2 + n + 41', '\\text{prime?}'], headCol: ['dim', 'dim', 'second'], keys: 2, rows: shown.map(x => [String(x), String(PRIME41(x)), 'T']), start: [2], reveal: { cols: [] } };
    return choiceItem(R, {
      id: `examplesProof-${n}`, family: 'examplesProof',
      prompt: `${who} checks n² + n + 41 for every whole number n from 0 to ${k}: every value is prime (some are in the table). Claim: “For <b>every</b> whole number n, n² + n + 41 is prime.” Is the claim proved?`,
      board: '', solution: [`The claim is about every whole number: infinitely many. ${k + 1} checks cover ${k + 1} of them.`, 'In fact at n = 40 the value is 1681 = 41 × 41, not prime. Checks alone could never have settled it.'],
      picture: { table },
    }, [
      { t: NP, ok: true, say: 'Right. In fact n = 40 gives 1681 = 41 × 41, which is not prime.' },
      { t: `Proved: all ${k + 1} checks worked, with no exception.`, mc: MC.examples, say: 'Agreement in the cases checked says nothing about the infinitely many others. (At n = 40: 1681 = 41 × 41.)' },
      { t: `Disproved: ${k + 1} checks are too few, so the claim is false.`, mc: MC.failedDisproof, say: 'Too little evidence leaves a claim open; it does not make it false. Only a counterexample does that.' },
    ]);
  }
  if (kind === 'circle') {
    const rows = [[1, 1], [2, 2], [3, 4], [4, 8], [5, 16]].map(([a, b]) => [String(a), String(b)]);
    return choiceItem(R, {
      id: `examplesProof-${n}`, family: 'examplesProof',
      prompt: `${who} marks points on a circle and joins every pair with a chord. 1, 2, 3, 4, 5 points give 1, 2, 4, 8, 16 regions. Claim: “Every extra point doubles the regions, for <b>any</b> number of points.” Is the claim proved?`,
      board: '', solution: ['Five cases fit a doubling pattern, but the claim is about every number of points.', 'In fact 6 points give 31 regions, not 32: the pattern breaks.'],
      picture: { table: { head: ['\\text{points}', '\\text{regions}'], headCol: ['dim', 'second'], keys: 1, rows, start: [1], reveal: { cols: [] } } },
    }, [
      { t: NP, ok: true, say: 'Right. In fact 6 points give 31 regions, not 32.' },
      { t: 'Proved: five cases in a row fit the pattern.', mc: MC.examples, say: 'A pattern in the first cases is a guess, not a proof: 6 points give 31 regions.' },
      { t: 'Disproved: five cases are too few, so the claim is false.', mc: MC.failedDisproof, say: 'Weak evidence does not make a claim false; a counterexample does (6 points: 31 regions).' },
    ]);
  }
  if (kind === 'finite') {
    const v = pick(R, [
      { claim: 'n² + 1 is not a multiple of 3', f: (x: number) => x * x + 1, head: 'n^2 + 1', lab: '\\text{not a mult. of } 3?', test: (y: number) => y % 3 !== 0, word: 'none is a multiple of 3' },
      { claim: 'n³ − n is a multiple of 6', f: (x: number) => x ** 3 - x, head: 'n^3 - n', lab: '\\text{mult. of } 6?', test: (y: number) => y % 6 === 0, word: 'each is a multiple of 6' },
      { claim: 'n² + n is even', f: (x: number) => x * x + x, head: 'n^2 + n', lab: '\\text{even?}', test: (y: number) => y % 2 === 0, word: 'each is even' },
    ]);
    const k = int(R, 4, 6), xs = Array.from({ length: k }, (_, i) => i + 1);
    const rows = xs.map(x => [String(x), String(v.f(x)), 'T']);
    if (!xs.every(x => v.test(v.f(x)))) throw new Error('finite claim');
    return choiceItem(R, {
      id: `examplesProof-${n}`, family: 'examplesProof',
      prompt: `Claim: “For every n in the set {${xs.join(', ')}}, ${v.claim}.” ${who} works out all ${k} values: ${v.word}. Is the claim proved?`,
      board: '', solution: [`The domain is the set {${xs.join(', ')}}: only ${k} numbers.`, `All ${k} were checked, so every case of the domain is covered.`],
      picture: { table: { head: ['n', v.head, v.lab], headCol: ['dim', 'dim', 'second'], keys: 2, rows, start: [2], reveal: { cols: [] } } },
    }, [
      { t: `Proved: the domain has only ${k} numbers, and all of them were checked.`, ok: true, say: 'Right. On a finite domain, checking every case IS a proof.' },
      { t: 'Not proved: checking cases never proves a claim.', mc: MC.checkingNever, say: `Here the domain is just {${xs.join(', ')}}: checking all ${k} cases covers every case.` },
      { t: 'Not proved: larger numbers still have to be tested.', mc: MC.domain, say: `The claim is only about the numbers in {${xs.join(', ')}}. Larger numbers are outside its domain.` },
    ]);
  }
  const k = int(R, 4, 8);
  return choiceItem(R, {
    id: `examplesProof-${n}`, family: 'examplesProof',
    prompt: `${who} draws ${k} different triangles and measures their angles with a protractor. Every time the sum is 180°. Is “the angle sum of <b>every</b> triangle is 180°” proved?`,
    board: '', solution: [`${k} measured triangles are ${k} examples; the claim is about every triangle, infinitely many.`, 'The claim is true, but it needs a general argument (from the parallel postulate), not measurements.'],
    picture: { card: { lines: [`${k} triangles measured: 180°, 180°, 180° …`, 'Claim: every triangle has an angle sum of 180°.'] } },
  }, [
    { t: 'Not proved yet: measuring examples cannot cover every triangle.', ok: true, say: 'Right. The claim is true, but a proof has to cover every triangle at once.' },
    { t: `Proved: ${k} different triangles all agree.`, mc: MC.measure, say: 'Measurements of some drawings are evidence, not a proof about every triangle.' },
    { t: 'Disproved: measurements are never exact, so the claim is false.', mc: MC.failedDisproof, say: 'Imperfect evidence leaves the claim open; it does not make it false.' },
  ]);
};

/** what a stated argument covers: the dot argument is about nonnegative even integers (0 = no dots) */
export const argCovers: Gen = (R, n) => {
  const pairs = { params: { groups: [{ pairs: 'm', col: 'first' as Paint, label: 'm\\ \\text{pairs}' }, { pairs: 'n', col: 'second' as Paint, label: 'n\\ \\text{pairs}' }], total: '(m + n)\\ \\text{pairs}' }, start: ['g0', 'g1', 'brace'] as const, reveal: ['join', 'total'] as const };
  const intro = `${pick(R, NAMES)}’s dot argument: two even collections of dots, each standing in pairs, put together still stand in pairs. It is stated for <b>nonnegative</b> even integers (0 = no dots).`;
  if (R() < 0.5) {
    const neg = -2 * int(R, 1, 6), big = 2 * int(R, 200, 600);
    return choiceItem(R, {
      id: `argCovers-${n}`, family: 'argCovers', prompt: `${intro} Which even number does the argument <b>not</b> cover?`, board: '',
      solution: ['A collection of dots has 0, 1, 2, … dots: never a negative number.', `So ${H(neg)} is outside what the argument covers (the algebra 2m + 2n = 2(m + n) for any integers covers it).`],
      picture: { pairs: { ...pairs, start: [...pairs.start], reveal: [...pairs.reveal] } },
    }, [
      { t: H(neg), ok: true, say: `Right: no collection has ${H(neg)} dots. Negative numbers need the algebraic argument.` },
      { t: '0', say: 'Zero is covered: it is the empty collection, zero pairs.' },
      { t: String(big), say: `${big} dots stand in ${big / 2} pairs: covered, however big.` },
      { t: 'None: it covers every even integer.', mc: MC.domain, say: 'Dots only count nonnegative numbers. The argument says nothing about negative even integers.' },
    ]);
  }
  const a = 2 * int(R, 1, 9), b = -2 * int(R, 1, 6), o1 = 2 * int(R, 1, 6) + 1, o2 = 2 * int(R, 1, 6) + 1;
  const variant = R() < 0.5;
  return choiceItem(R, {
    id: `argCovers-${n}`, family: 'argCovers', prompt: `${intro} Which sum does the argument cover?`, board: '',
    solution: ['The argument covers a sum of two nonnegative even integers, and nothing else.', variant ? `${a} + 0: both even, neither negative.` : `0 + 0: zero pairs and zero pairs.`],
    picture: { pairs: { ...pairs, start: [...pairs.start], reveal: [...pairs.reveal] } },
  }, [
    { t: variant ? `${a} + 0` : '0 + 0', ok: true, say: 'Right: both numbers are nonnegative and even (0 is the empty collection).' },
    { t: `${a} + (${H(b)})`, mc: MC.domain, say: `${H(b)} is negative: no collection of dots has that many.` },
    { t: `${o1} + ${o2}`, say: 'Odd numbers do not stand in pairs: this argument is about even numbers.' },
    { t: `${a + 1}.5 + 0.5`, say: 'Those are not integers at all.' },
  ]);
};

/** after a general proof: no need to hunt for exceptions in its domain */
const PROVED = [
  { claim: 'the sum of two even integers is even', how: '2m + 2n = 2(m + n), with m and n any integers', test: () => { const a = 2 * (100000 + 7), b = 2 * 650001; return `${a.toLocaleString('en-US')} + ${b.toLocaleString('en-US')}`; } },
  { claim: 'the sum of two odd integers is even', how: '(2m + 1) + (2n + 1) = 2(m + n + 1), with m and n any integers', test: () => '777,777 + 999,999' },
  { claim: 'the product of an even integer and any integer is even', how: '2m · k = 2(mk), with m and k any integers', test: () => '123,456 × 98,765' },
  { claim: 'vertical angles are congruent', how: 'from the Linear Pair Postulate, for any two crossing lines', test: () => 'two lines that cross at a 1° angle' },
];
export const afterProof: Gen = (R, n) => {
  const P = pick(R, PROVED), who = pick(R, NAMES), other = pick(R, NAMES.filter(x => x !== who));
  return choiceItem(R, {
    id: `afterProof-${n}`, family: 'afterProof',
    prompt: `${who} has a correct proof that ${P.claim} (${P.how}). ${other} wants to test ${P.test()} “just in case it is an exception.” Is the test needed?`,
    board: '', solution: ['A proof that uses only the hypotheses covers every case that satisfies them.', `${P.test()} is one of those cases, so it is already covered.`],
    picture: { card: { lines: [`Proved: ${P.claim}.`, `Test ${P.test()}?`] } },
  }, [
    { t: 'No: the proof covers every case in its domain, this one included.', ok: true, say: 'Right. Testing it can only agree with the proof.' },
    { t: 'Yes: a big or unusual case could still be an exception.', mc: MC.afterProof, say: 'A valid proof leaves no room for exceptions among the cases it covers.' },
    { t: 'Yes: a proof only covers the cases written in it.', mc: MC.allChecked, say: 'The letters stand for any integers (or any crossing lines): the proof is about all of them.' },
  ]);
};

// ======================= general representation =======================
export const repPick: Gen = (R, n) => {
  const kind = pick(R, ['odd', 'two', 'consec', 'mult'] as const);
  const i = (s: string) => `<i>${s}</i>`;
  if (kind === 'odd' || kind === 'two') {
    const odd = kind === 'odd';
    const pairs = odd
      ? { params: { groups: [{ pairs: 'm', extra: true, col: 'first' as Paint, label: '2m + 1' }] }, start: ['g0'] as const, reveal: ['brace'] as const }
      : { params: { groups: [{ pairs: 'm', col: 'first' as Paint, label: '2m' }, { pairs: 'n', col: 'second' as Paint, label: '2n' }] }, start: ['g0', 'g1'] as const, reveal: ['brace'] as const };
    const opts: Opt[] = odd ? [
      { t: `2${i('m')} + 1, where ${i('m')} is an integer`, ok: true, say: 'Right: m pairs and one extra dot, for any integer m.' },
      { t: `2${i('m')} + 1, where ${i('m')} is any number`, mc: MC.varIncomplete, say: 'With m = 0.5, 2m + 1 = 2, which is even. m must be declared an integer.' },
      { t: `2${i('m')} + 1, where ${i('m')} is a whole number`, mc: MC.domain, say: 'Whole numbers are 0, 1, 2, …: that gives only the positive odd numbers, never −3.' },
      { t: `${i('m')} + 1, where ${i('m')} is an integer`, say: 'm + 1 can be any integer, even or odd.' },
    ] : [
      { t: `2${i('m')} and 2${i('n')}, where ${i('m')} and ${i('n')} are integers`, ok: true, say: 'Right: two letters, so the two numbers can differ.' },
      { t: `2${i('m')} and 2${i('m')}, where ${i('m')} is an integer`, mc: MC.oneLetter, say: 'One letter forces the two numbers to be equal: 4 and 10 could never both be named.' },
      { t: `2${i('m')} and 2${i('m')} + 2, where ${i('m')} is an integer`, mc: MC.oneLetter, say: 'That ties the second number to the first: only even numbers 2 apart.' },
      { t: `${i('m')} and ${i('n')}, where ${i('m')} and ${i('n')} are integers`, say: 'm and n can be odd: nothing makes them even.' },
    ];
    return choiceItem(R, {
      id: `repPick-${n}`, family: 'repPick',
      prompt: `${pick(R, NAMES)} starts a proof. ${odd ? 'Which expression stands for <b>any</b> odd integer (negative ones too)?' : 'Which expressions stand for <b>any two</b> even integers (they may be different)?'}`,
      board: '', solution: odd ? ['An odd integer is m pairs and one more: 2m + 1.', 'm must be an integer (any integer, so negative odd numbers count too).'] : ['Each even integer is 2 times an integer.', 'Two numbers that may differ need two letters, both declared integers.'],
      picture: { pairs: { ...pairs, start: [...pairs.start], reveal: [...pairs.reveal] } },
    }, opts);
  }
  if (kind === 'consec') {
    return choiceItem(R, {
      id: `repPick-${n}`, family: 'repPick', prompt: `${pick(R, NAMES)} starts a proof. Which expressions stand for <b>any two consecutive</b> integers?`, board: '',
      solution: ['Consecutive integers differ by 1: n and n + 1.', 'n must be an integer, or n + 1 is not an integer either.'],
      picture: { card: { lines: ['… 6, 7 … −3, −2 … 41, 42 …', 'Any two consecutive integers?'] } },
    }, [
      { t: `${i('n')} and ${i('n')} + 1, where ${i('n')} is an integer`, ok: true, say: 'Right: one letter, because the second number depends on the first.' },
      { t: `${i('n')} and ${i('m')}, where ${i('n')} and ${i('m')} are integers`, say: 'Two free letters can be 3 and 10: nothing makes them consecutive.' },
      { t: `${i('n')} and ${i('n')} + 1, where ${i('n')} is any number`, mc: MC.varIncomplete, say: 'With n = 2.5 you get 2.5 and 3.5: not integers.' },
      { t: `${i('n')} and 2${i('n')}, where ${i('n')} is an integer`, say: 'n and 2n are 5 and 10: not consecutive.' },
    ]);
  }
  const k = pick(R, [3, 5, 7]), L = pick(R, ['k', 'j']);
  return choiceItem(R, {
    id: `repPick-${n}`, family: 'repPick', prompt: `${pick(R, NAMES)} starts a proof. Which expression stands for <b>any</b> multiple of ${k}?`, board: '',
    solution: [`A multiple of ${k} is ${k} times an integer.`, `So ${k}${L} with ${L} an integer.`],
    picture: { card: { lines: [`Multiples of ${k}: … ${H(-2 * k)}, ${H(-k)}, 0, ${k}, ${2 * k}, ${3 * k} …`] } },
  }, [
    { t: `${k}${i(L)}, where ${i(L)} is an integer`, ok: true, say: `Right: ${k} times any integer.` },
    { t: `${k}${i(L)}, where ${i(L)} is any number`, mc: MC.varIncomplete, say: `With ${L} = 0.5, ${k}${L} = ${k / 2}: not a multiple of ${k}. ${L} must be an integer.` },
    { t: `${i(L)} + ${k}, where ${i(L)} is an integer`, say: `${L} + ${k} can be any integer.` },
    { t: `${k}${i(L)} + 1, where ${i(L)} is an integer`, say: `${k}${L} + 1 is one MORE than a multiple of ${k}.` },
  ]);
};

/** why the letter must be declared an integer */
export const repWhyInt: Gen = (R, n) => {
  const odd = R() < 0.5, k = int(R, 0, 7), m = k + 0.5, v = odd ? 2 * m + 1 : 2 * m;
  const who = pick(R, NAMES), other = pick(R, NAMES.filter(x => x !== who));
  const form = odd ? '2<i>m</i> + 1' : '2<i>m</i>';
  const right = odd ? `${v}, which is even: “<i>m</i> is an integer” has to be written.` : `${v}, which is odd: “<i>m</i> is an integer” has to be written.`;
  return choiceItem(R, {
    id: `repWhyInt-${n}`, family: 'repWhyInt',
    prompt: `${who} writes: “an ${odd ? 'odd' : 'even'} number is ${form}” but does not say what <i>m</i> may be. ${other} puts in <i>m</i> = ${m}. What is ${form}, and what does it show?`,
    board: '', solution: [`${odd ? `2 × ${m} + 1` : `2 × ${m}`} = ${v}.`, `${v} is ${odd ? 'even' : 'odd'}: the form only gives ${odd ? 'odd' : 'even'} numbers when m is an integer.`],
    picture: { card: { lines: [`${odd ? 'odd' : 'even'} = ${form.replace(/<[^>]+>/g, '')}`, `m = ${m}`], reveal: [`${odd ? `2 × ${m} + 1` : `2 × ${m}`} = ${v}`] } },
  }, [
    { t: right, ok: true, say: `Right: ${v} is ${odd ? 'even' : 'odd'}. Declaring m an integer is part of the representation.` },
    { t: `${v}, which counts as ${odd ? 'odd' : 'even'} because it has the form ${form}.`, mc: MC.varIncomplete, say: `${v} is ${odd ? 'even' : 'odd'}. The form only works with an integer m.` },
    { t: `${m}: the letter itself is the ${odd ? 'odd' : 'even'} number.`, say: `m is the number of pairs, not the number: ${form} = ${v}.` },
  ]);
};

/** what kind of integer an expression with integer letters is */
export const repRead: Gen = (R, n) => {
  const E = pick(R, [
    { e: '2(<i>m</i> + <i>n</i>) + 1', k: 'odd', why: 'It is 2 times an integer (m + n), plus 1.' },
    { e: '2(<i>m</i> + <i>n</i> + 1)', k: 'even', why: 'It is 2 times the integer m + n + 1.' },
    { e: '2<i>m</i> + 2<i>n</i> + 3', k: 'odd', why: 'It is 2(m + n + 1) + 1: 2 times an integer, plus 1.' },
    { e: '4<i>m</i> + 6', k: 'even', why: 'It is 2(2m + 3): 2 times an integer.' },
    { e: '<i>m</i> + <i>n</i>', k: 'either', why: 'With m = 1, n = 1 it is 2 (even); with m = 1, n = 2 it is 3 (odd).' },
    { e: '2<i>m</i> + <i>n</i>', k: 'either', why: 'With n = 0 it is even; with n = 1 it is odd.' },
    { e: '(2<i>m</i> + 1) + (2<i>n</i> + 1)', k: 'even', why: 'It is 2m + 2n + 2 = 2(m + n + 1): 2 times an integer.' },
    { e: '6<i>m</i> + 1', k: 'odd', why: 'It is 2(3m) + 1: 2 times an integer, plus 1.' },
  ]);
  const W = { odd: 'Always odd', even: 'Always even', either: 'It can be even or odd' } as const;
  return choiceItem(R, {
    id: `repRead-${n}`, family: 'repRead', prompt: `In ${pick(R, NAMES)}’s proof, <i>m</i> and <i>n</i> are integers. What kind of integer is ${E.e}?`, board: '',
    solution: ['Write it as 2 × (an integer) or 2 × (an integer) + 1, if you can.', E.why],
    picture: { card: { lines: [`${E.e.replace(/<[^>]+>/g, '')}`, 'm, n integers'] } },
  }, (['odd', 'even', 'either'] as const).map(k => ({
    t: W[k], ok: k === E.k,
    say: k === E.k ? `Right. ${E.why}` : E.why,
  })), true);
};

// ======================= direct proof =======================
interface NRow { tex: string; html: string; rs: string; bad: { html: string; mc?: string; say: string }[] }
interface NProof { id: string; claim: string; given: string; prove: string; proveHtml: string; rows: NRow[] }
const RSN = { defEven: 'Definition of even integer', defOdd: 'Definition of odd integer', defM3: 'Definition of multiple of 3', sub: 'Substitution Property of Equality', dist: 'Distributive Property', closed: 'Integers are closed under addition', closedX: 'Integers are closed under multiplication', given: 'Given' };
const NPROOFS: NProof[] = [
  {
    id: 'evenEven', proveHtml: '<i>a</i> + <i>b</i> is even', claim: 'the sum of two even integers is even', given: 'a, b\\ \\text{even integers}', prove: 'a + b\\ \\text{is even}',
    rows: [
      { tex: 'a = 2m,\\ b = 2n', html: '<i>a</i> = 2<i>m</i>, <i>b</i> = 2<i>n</i> (<i>m</i>, <i>n</i> integers)', rs: RSN.defEven, bad: [{ html: '<i>a</i> = 2<i>m</i>, <i>b</i> = 2<i>m</i> (<i>m</i> an integer)', mc: MC.oneLetter, say: 'One letter makes a and b equal; the proof must allow any two even integers.' }, { html: '<i>a</i> = 4, <i>b</i> = 6', mc: MC.numbersInside, say: 'Particular numbers make it an example, not a proof about every pair.' }] },
      { tex: 'a + b = 2m + 2n', html: '<i>a</i> + <i>b</i> = 2<i>m</i> + 2<i>n</i>', rs: RSN.sub, bad: [{ html: '4 + 6 = 10', mc: MC.numbersInside, say: 'That checks one pair; the letters keep the argument general.' }] },
      { tex: 'a + b = 2(m + n)', html: '<i>a</i> + <i>b</i> = 2(<i>m</i> + <i>n</i>)', rs: RSN.dist, bad: [{ html: '<i>a</i> + <i>b</i> = 2<i>mn</i>', say: '2m + 2n factors as 2(m + n), not 2mn.' }] },
      { tex: 'm + n\\ \\text{is an integer}', html: '<i>m</i> + <i>n</i> is an integer', rs: RSN.closed, bad: [{ html: '<i>m</i> + <i>n</i> is even', say: 'm + n can be odd; what matters is that it is an integer.' }] },
      { tex: 'a + b\\ \\text{is even}', html: '<i>a</i> + <i>b</i> is even', rs: RSN.defEven, bad: [{ html: '<i>a</i> + <i>b</i> = 10, which is even', mc: MC.numbersInside, say: 'The conclusion is about a + b for every pair, not one sum.' }] },
    ],
  },
  {
    id: 'oddOdd', proveHtml: '<i>a</i> + <i>b</i> is even', claim: 'the sum of two odd integers is even', given: 'a, b\\ \\text{odd integers}', prove: 'a + b\\ \\text{is even}',
    rows: [
      { tex: 'a = 2m + 1,\\ b = 2n + 1', html: '<i>a</i> = 2<i>m</i> + 1, <i>b</i> = 2<i>n</i> + 1 (<i>m</i>, <i>n</i> integers)', rs: RSN.defOdd, bad: [{ html: '<i>a</i> = 2<i>m</i> + 1, <i>b</i> = 2<i>m</i> + 1 (<i>m</i> an integer)', mc: MC.oneLetter, say: 'One letter only covers a number added to itself.' }, { html: '<i>a</i> = 3, <i>b</i> = 5', mc: MC.numbersInside, say: 'Particular numbers make it an example, not a proof.' }] },
      { tex: 'a + b = 2m + 2n + 2', html: '<i>a</i> + <i>b</i> = 2<i>m</i> + 2<i>n</i> + 2', rs: RSN.sub, bad: [{ html: '<i>a</i> + <i>b</i> = 2<i>m</i> + 2<i>n</i> + 1', say: 'Each odd number brings its own + 1: that makes + 2.' }] },
      { tex: 'a + b = 2(m + n + 1)', html: '<i>a</i> + <i>b</i> = 2(<i>m</i> + <i>n</i> + 1)', rs: RSN.dist, bad: [{ html: '<i>a</i> + <i>b</i> = 2(<i>m</i> + <i>n</i>) + 1', say: '2m + 2n + 2 = 2(m + n + 1): the 2 goes inside too.' }] },
      { tex: 'm + n + 1\\ \\text{is an integer}', html: '<i>m</i> + <i>n</i> + 1 is an integer', rs: RSN.closed, bad: [{ html: '3 + 5 = 8 is even', mc: MC.numbersInside, say: 'One pair is an example; the letters cover every pair.' }] },
      { tex: 'a + b\\ \\text{is even}', html: '<i>a</i> + <i>b</i> is even', rs: RSN.defEven, bad: [{ html: '<i>a</i> + <i>b</i> is odd', say: 'a + b is 2 times an integer: even.' }] },
    ],
  },
  {
    id: 'evenTimes', proveHtml: '<i>ab</i> is even', claim: 'an even integer times any integer is even', given: 'a\\ \\text{even},\\ b\\ \\text{an integer}', prove: 'ab\\ \\text{is even}',
    rows: [
      { tex: 'a = 2m', html: '<i>a</i> = 2<i>m</i> (<i>m</i> an integer)', rs: RSN.defEven, bad: [{ html: '<i>a</i> = 2<i>m</i> (<i>m</i> any number)', mc: MC.varIncomplete, say: 'm must be an integer, or 2m need not be even.' }] },
      { tex: 'ab = 2m \\cdot b', html: '<i>ab</i> = 2<i>m</i> · <i>b</i>', rs: RSN.sub, bad: [{ html: '4 · 3 = 12', mc: MC.numbersInside, say: 'One product is an example, not the general case.' }] },
      { tex: 'ab = 2(mb)', html: '<i>ab</i> = 2(<i>mb</i>)', rs: 'Associative Property of Multiplication', bad: [{ html: '<i>ab</i> = 2<i>m</i> + <i>b</i>', say: '2m · b is a product: it regroups as 2(mb).' }] },
      { tex: 'mb\\ \\text{is an integer}', html: '<i>mb</i> is an integer', rs: RSN.closedX, bad: [{ html: '<i>mb</i> is even', say: 'mb can be odd; it only needs to be an integer.' }] },
      { tex: 'ab\\ \\text{is even}', html: '<i>ab</i> is even', rs: RSN.defEven, bad: [{ html: '<i>ab</i> = 12, which is even', mc: MC.numbersInside, say: 'The conclusion is about ab for every a and b.' }] },
    ],
  },
  {
    id: 'm3', proveHtml: '<i>a</i> + <i>b</i> is a multiple of 3', claim: 'the sum of two multiples of 3 is a multiple of 3', given: 'a, b\\ \\text{multiples of } 3', prove: 'a + b\\ \\text{is a multiple of } 3',
    rows: [
      { tex: 'a = 3j,\\ b = 3k', html: '<i>a</i> = 3<i>j</i>, <i>b</i> = 3<i>k</i> (<i>j</i>, <i>k</i> integers)', rs: RSN.defM3, bad: [{ html: '<i>a</i> = 3<i>k</i>, <i>b</i> = 3<i>k</i> (<i>k</i> an integer)', mc: MC.oneLetter, say: 'One letter makes a and b equal.' }, { html: '<i>a</i> = 6, <i>b</i> = 9', mc: MC.numbersInside, say: 'Particular numbers make it an example.' }] },
      { tex: 'a + b = 3j + 3k', html: '<i>a</i> + <i>b</i> = 3<i>j</i> + 3<i>k</i>', rs: RSN.sub, bad: [{ html: '<i>a</i> + <i>b</i> = 3<i>jk</i>', say: 'Substituting gives 3j + 3k.' }] },
      { tex: 'a + b = 3(j + k)', html: '<i>a</i> + <i>b</i> = 3(<i>j</i> + <i>k</i>)', rs: RSN.dist, bad: [{ html: '<i>a</i> + <i>b</i> = 6(<i>j</i> + <i>k</i>)', say: 'Only one factor 3 comes out: 3(j + k).' }] },
      { tex: 'j + k\\ \\text{is an integer}', html: '<i>j</i> + <i>k</i> is an integer', rs: RSN.closed, bad: [{ html: '6 + 9 = 15 = 3 · 5', mc: MC.numbersInside, say: 'One example; the letters cover every pair.' }] },
      { tex: 'a + b\\ \\text{is a multiple of } 3', html: '<i>a</i> + <i>b</i> is a multiple of 3', rs: RSN.defM3, bad: [{ html: '<i>a</i> + <i>b</i> is a multiple of 6', say: '3(j + k) is a multiple of 3; it is a multiple of 6 only when j + k is even.' }] },
    ],
  },
  {
    id: 'consec', proveHtml: '<i>n</i> + (<i>n</i> + 1) is odd', claim: 'the sum of two consecutive integers is odd', given: 'n,\\ n + 1\\ \\text{consecutive integers}', prove: 'n + (n + 1)\\ \\text{is odd}',
    rows: [
      { tex: 'n\\ \\text{is an integer}', html: '<i>n</i> is an integer', rs: RSN.given, bad: [{ html: '<i>n</i> = 7', mc: MC.numbersInside, say: 'n stands for any integer, not 7.' }] },
      { tex: 'n + (n + 1) = 2n + 1', html: '<i>n</i> + (<i>n</i> + 1) = 2<i>n</i> + 1', rs: 'Combine like terms', bad: [{ html: '<i>n</i> + (<i>n</i> + 1) = <i>n</i>² + 1', say: 'n + n is 2n, not n².' }, { html: '7 + 8 = 15', mc: MC.numbersInside, say: 'One example; the letter covers every n.' }] },
      { tex: 'n + (n + 1)\\ \\text{is odd}', html: '<i>n</i> + (<i>n</i> + 1) is odd', rs: RSN.defOdd, bad: [{ html: '<i>n</i> + (<i>n</i> + 1) is even', say: '2n + 1 is 2 times an integer plus 1: odd.' }] },
    ],
  },
];
const ALL_RS = [...new Set(NPROOFS.flatMap(p => p.rows.map(r => r.rs)))];
export { NPROOFS };
const npPic = (p: NProof, o: Partial<ProofPic>): ProofPic => ({ given: [p.given], prove: p.prove, rows: p.rows.map(r => ({ st: r.tex, rs: r.rs })), ...o });

/** fill one cell of a number proof (statement or reason) */
export const proofFill: Gen = (R, n) => {
  const p = pick(R, NPROOFS), k = int(R, 0, p.rows.length - 1), row = p.rows[k]!;
  const askSt = row.bad.length > 0 && R() < 0.6;
  if (askSt) {
    const rows = p.rows.map((r, i) => ({ st: i === k ? '' : r.tex, rs: r.rs }));
    return choiceItem(R, {
      id: `proofFill-${n}`, family: 'proofFill', prompt: `Proof that ${p.claim}. Which statement belongs in line ${k + 1}?`, board: '',
      solution: [`Line ${k + 1} has the reason “${row.rs}”.`, `With the lines around it, that gives: ${row.html}.`],
      picture: { proof: { ...npPic(p, {}), rows, ask: [{ i: k, cell: 'st' }], reveal: { fill: [{ i: k, st: row.tex }], rings: [k] } } },
    }, [
      { t: row.html, ok: true, say: `Right: ${row.html}, by the ${row.rs.charAt(0).toLowerCase() + row.rs.slice(1)}.` },
      ...row.bad.slice(0, 3).map(b => ({ t: b.html, mc: b.mc, say: b.say })),
      ...(row.bad.length < 2 && k < p.rows.length - 1 ? [{ t: p.proveHtml, mc: MC.circular, say: 'That is the statement being proved: it can only come last, once the lines above earn it.' }] : []),
    ]);
  }
  const rows = p.rows.map((r, i) => ({ st: r.tex, rs: i === k ? '' : r.rs }));
  const ALG = ['Distributive Property', 'Combine like terms', 'Associative Property of Multiplication'];
  const wrongReal = shuffle(R, ALL_RS.filter(x => x !== row.rs && !(ALG.includes(row.rs) && ALG.includes(x)) && !(k === 0 && x === RSN.given))).slice(0, 1);
  return choiceItem(R, {
    id: `proofFill-${n}`, family: 'proofFill', prompt: `Proof that ${p.claim}. Which reason belongs in line ${k + 1} (${row.html})?`, board: '',
    solution: [`Line ${k + 1} says: ${row.html}.`, `What turns the lines above into this one: ${row.rs}.`],
    picture: { proof: { ...npPic(p, {}), rows, ask: [{ i: k, cell: 'rs' }], reveal: { fill: [{ i: k, rs: row.rs }], rings: [k] } } },
  }, [
    { t: row.rs, ok: true, say: `Right: ${row.rs}.` },
    ...wrongReal.map(t => ({ t, say: `That reason does not give line ${k + 1}; the right one is: ${row.rs}.` })),
    { t: 'Checked with numbers: it works for a few examples', mc: MC.numbersInside, say: 'A check with numbers is an example, not a reason that holds for every integer.' },
    { t: 'No reason needed: it is obvious', mc: MC.noReason, say: 'Every line of a proof needs its reason.' },
  ]);
};

/** an angle proof from the course's definitions and postulates (vertical angles, congruent supplements) */
export const proofAngle: Gen = (R, n) => fitted('proofAngle', () => {
  const p = makeProof(pick(R, ['vertical', 'congSupp', 'vertical'] as const), R);
  if (figProblems(p.fig, FR_LEFT).length) return null;
  const k = int(R, 0, p.rows.length - 1), row = p.rows[k]!;
  const right = RS[row.rs];
  const ok = new Set<string>([right, ...(row.also ?? []).map(a => RS[a])]);
  const cand: { t: string; mc?: string; say: string }[] = [
    ...(p.theorem ? [{ t: RS[p.theorem], mc: MC.circular, say: 'That is the theorem being proved: it cannot be a reason inside its own proof.' }] : []),
    { t: 'It looks that way in the drawing', mc: MC.appearance, say: 'How the drawing looks is not a reason.' },
    { t: 'Measured with a protractor', mc: MC.measure, say: 'A measurement is about one drawing; the proof must hold for every figure.' },
    ...(['linPair', 'subst', 'subP', 'defSupp', 'defCongAng', 'addP'] as ReasonKey[]).map(kk => ({ t: RS[kk], say: `That reason does not give this line; it is the ${right}.` })),
  ].filter(c => !ok.has(c.t));
  const wrong = [...cand.slice(0, p.theorem ? 1 : 0), ...shuffle(R, cand.slice(p.theorem ? 1 : 0)).slice(0, 2)];
  return choiceItem(R, {
    id: `proofAngle-${n}`, family: 'proofAngle', prompt: `${pick(R, NAMES)} proves ${p.id === 'vertical' ? 'that vertical angles have equal measures' : 'that supplements of the same angle are congruent'}. Which reason belongs in line ${k + 1}?`, board: '',
    solution: [(row.uses.length ? `Line ${k + 1} uses ${row.uses.length > 1 ? 'lines' : 'line'} ${row.uses.join(' and ')}.` : `Line ${k + 1} needs no earlier line: it comes from the givens about the figure.`), `The reason that turns that into this line: the ${right}.`],
    picture: { fig: p.fig, proof: { given: p.given, prove: p.prove, rows: p.rows.map((r, i) => ({ st: r.st, rs: i === k ? '' : RS[r.rs] })), ask: [{ i: k, cell: 'rs' }], reveal: { fill: [{ i: k, rs: right }], rings: [k] } } },
  }, [{ t: right, ok: true, say: `Right: the ${right}.` }, ...wrong]);
});

// ======================= proof audit =======================
type Defect = 'circular' | 'unjustified' | 'assume' | 'none' | 'thm';
interface Audited { pic: ProofPic; claim: string; bad: number; defect: Defect; fig?: Proof['fig'] }
function audited(R: () => number): Audited {
  const defect = pick(R, ['circular', 'unjustified', 'assume', 'none', 'thm'] as const);
  if (defect === 'thm') {
    // a correct proof that cites a theorem proved earlier (the Vertical Angles Theorem inside the alternate interior proof)
    const p = makeProof('altInt', R);
    const bad = p.rows.findIndex(r => r.rs === 'vert');
    return { claim: 'alternate interior angles are equal (ℓ ∥ m)', pic: { given: p.given, prove: p.prove, rows: p.rows.map(r => ({ st: r.st, rs: RS[r.rs] })) }, bad, defect, fig: p.fig };
  }
  const p = pick(R, NPROOFS.filter(x => x.rows.length >= 4));
  const rows = p.rows.map(r => ({ st: r.tex, rs: r.rs }));
  let bad = -1;
  if (defect === 'circular') { bad = rows.length - 1; rows[bad] = { ...rows[bad]!, rs: `Because ${p.claim}` }; }
  else if (defect === 'unjustified') { bad = int(R, 1, rows.length - 2); rows[bad] = { ...rows[bad]!, rs: pick(R, ['Checked with two examples', 'It always works', 'Obvious']) }; }
  else if (defect === 'assume') {
    const q2 = pick(R, NPROOFS.filter(x => ['evenEven', 'oddOdd', 'm3'].includes(x.id)));
    const L = q2.id === 'm3' ? '3j' : q2.id === 'oddOdd' ? '(2m + 1)' : '2m';
    const sum = q2.id === 'm3' ? '6j' : q2.id === 'oddOdd' ? '4m + 2' : '4m';
    const rows2 = q2.rows.map(r => ({ st: r.tex, rs: r.rs }));
    rows2[1] = { st: `a + b = ${L} + ${L} = ${sum}`, rs: RSN.sub };
    return { claim: q2.claim, pic: { given: [q2.given], prove: q2.prove, rows: rows2 }, bad: 1, defect };
  }
  return { claim: p.claim, pic: { given: [p.given], prove: p.prove, rows }, bad, defect };
}
const DEFECT_SAY: Record<Defect, string> = {
  circular: 'It uses the statement being proved as its own reason: circular.',
  unjustified: 'Its reason is not a definition, postulate, property or proved theorem: unjustified.',
  assume: 'It quietly assumes a = b: the proof would only cover a number added to itself.',
  none: 'Every line follows from earlier lines by a stated reason.',
  thm: 'It cites the Vertical Angles Theorem, which was proved earlier from the Linear Pair Postulate: allowed.',
};
export const auditFind: Gen = (R, n) => {
  const a = audited(R);
  const N0 = a.pic.rows.length, broken = a.defect === 'circular' || a.defect === 'unjustified' || a.defect === 'assume';
  const opts: Opt[] = [
    ...a.pic.rows.map((_, i) => ({
      t: `Line ${i + 1}`, ok: broken && i === a.bad,
      mc: !broken && a.defect === 'thm' && i === a.bad ? MC.rejectsThm : undefined,
      say: broken && i === a.bad ? `Right. ${DEFECT_SAY[a.defect]}` : a.defect === 'thm' && i === a.bad ? DEFECT_SAY.thm : `Line ${i + 1} follows by its reason.${broken ? ` Look at line ${a.bad + 1}.` : ''}`,
    })),
    { t: 'None: every line is justified', ok: !broken, mc: broken ? (a.defect === 'circular' ? MC.circular : MC.noReason) : undefined, say: broken ? `Line ${a.bad + 1} is not justified. ${DEFECT_SAY[a.defect]}` : `Right. ${a.defect === 'thm' ? DEFECT_SAY.thm : DEFECT_SAY.none}` },
  ];
  void N0;
  return choiceItem(R, {
    id: `auditFind-${n}`, family: 'auditFind', prompt: `${pick(R, NAMES)} hands in a proof that ${a.claim}. Which line, if any, is <b>not</b> justified?`, board: '',
    solution: ['Check each line: does its reason really give it from the lines above?', broken ? `Line ${a.bad + 1}: ${DEFECT_SAY[a.defect]}` : (a.defect === 'thm' ? DEFECT_SAY.thm : DEFECT_SAY.none)],
    picture: { ...(a.fig ? { fig: a.fig } : {}), proof: { ...a.pic, reveal: { rings: broken ? [] : a.pic.rows.map((_, i) => i), strike: broken ? [a.bad] : [] } } },
  }, opts, true);
};
export const auditKind: Gen = (R, n) => {
  let a = audited(R);
  while (a.defect === 'none') a = audited(R);
  const O = {
    circular: 'It uses the statement being proved: circular reasoning.',
    unjustified: 'Its reason does not justify it (or it assumes something not given).',
    fine: 'Nothing: the line is justified.',
    falseClaim: 'The proof is broken, so the claim is false.',
  };
  const right = a.defect === 'circular' ? 'circular' : a.defect === 'thm' ? 'fine' : 'unjustified';
  return choiceItem(R, {
    id: `auditKind-${n}`, family: 'auditKind', prompt: `A proof that ${a.claim}. What is true of the ringed line ${a.bad + 1}?`, board: '',
    solution: [`Line ${a.bad + 1}: ${DEFECT_SAY[a.defect]}`, a.defect === 'thm' ? 'Citing a theorem proved earlier is allowed when its hypotheses hold.' : 'A broken proof leaves the claim unproved; it does not make it false.'],
    picture: { ...(a.fig ? { fig: a.fig } : {}), proof: { ...a.pic, ring: a.bad, reveal: { strike: a.defect === 'thm' ? [] : [a.bad] } } },
  }, (['circular', 'unjustified', 'fine', 'falseClaim'] as const).map(k => ({
    t: O[k], ok: k === right,
    mc: k === right ? undefined : k === 'falseClaim' ? MC.failedDisproof : k === 'circular' && a.defect === 'thm' ? MC.rejectsThm : k === 'fine' && a.defect === 'circular' ? MC.circular : k === 'fine' ? MC.noReason : undefined,
    say: k === right ? `Right. ${DEFECT_SAY[a.defect]}` : k === 'falseClaim' ? `The claim (${a.claim}) is true; a broken proof only leaves it unproved.` : DEFECT_SAY[a.defect],
  })), true);
};

export const FAM_A: Record<string, Gen> = { cxPick, cxJudge, cxShape, examplesProof, argCovers, afterProof, repPick, repWhyInt, repRead, proofFill, proofAngle, auditFind, auditKind };
export type { CPItem, Base };
void UNDER;
