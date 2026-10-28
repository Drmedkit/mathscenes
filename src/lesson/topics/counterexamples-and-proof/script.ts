// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/counterexamples-and-proof/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`, W = (s: string) => `<b class="w">${s}</b>`;
const m = '<i>m</i>', n = '<i>n</i>', a = '<i>a</i>', b = '<i>b</i>', k = '<i>k</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Lena tests n² + n + 41 for n = 0, 1, 2, 3, 4, 5. Every value is prime. She writes: “For ${W('every')} whole number n, n² + n + 41 is prime.” Is her claim proved? Pick one, and say how sure you are.`,
    say: 'Lena tests n squared plus n plus forty one for n equals zero, one, two, three, four and five. Every value is prime. She writes: for every whole number n, n squared plus n plus forty one is prime. Is her claim proved? Pick one, and say how sure you are.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: `Claim: the sum of ${A('two even integers')} is ${B('even')}. Four steps; the picture moves first, then the proof.`, say: 'Claim: the sum of two even integers is even. Four steps. The picture moves first, then the proof.' },
  'e.step0': {
    html: `An even number is dots that stand in pairs. 4 + 6: two pairs and three pairs make five pairs, so 10 is even. That is ${W('one example')}. The claim is about every pair of even integers, and no list of examples covers them all.`,
    say: 'An even number is dots that stand in pairs. Four plus six: two pairs and three pairs make five pairs, so ten is even. That is one example. The claim is about every pair of even integers, and no list of examples covers them all.',
  },
  'e.step1': {
    html: `Name ${A('any')} even integer: ${a} = 2${m}, with ${m} an integer (${m} pairs). The other one gets its ${B('own')} letter: ${b} = 2${n}. Line 1, by the definition of an even integer.`,
    say: 'Name any even integer: a equals two m, with m an integer, m pairs. The other one gets its own letter: b equals two n. Line one, by the definition of an even integer.',
  },
  'e.step2': {
    html: `Put the pairs together: ${a} + ${b} = 2${m} + 2${n} = 2(${m} + ${n}). Still nothing but pairs: ${m} + ${n} of them.`,
    say: 'Put the pairs together: a plus b equals two m plus two n, which is two times, m plus n. Still nothing but pairs: m plus n of them.',
  },
  'e.step3': {
    html: `${m} + ${n} is an integer, so ${a} + ${b} is 2 times an integer: ${S('even')}. The letters stood for any integers, so this one argument covers ${S('every')} pair of even integers.`,
    say: 'm plus n is an integer, so a plus b is two times an integer: even. The letters stood for any integers, so this one argument covers every pair of even integers.',
  },
  'e.why': { html: 'Quick check: why two letters, m and n, and not 2m for both?', say: 'Quick check: why two letters, m and n, and not two m for both?' },
  'e.why.ok': { html: 'Right. With one letter, a and b would be the same number, and the proof would only cover a number added to itself.', say: 'Right. With one letter, a and b would be the same number, and the proof would only cover a number added to itself.' },
  'e.why.one': { html: 'Not quite. One letter forces a and b to be equal: 4 + 10 could never be written as 2m + 2m.', say: 'Not quite. One letter forces a and b to be equal: four plus ten could never be written as two m plus two m.' },
  'e.why.int': { html: 'Not quite. m and n can be any integers, negative ones too; the second letter is there so the two numbers can differ.', say: 'Not quite. m and n can be any integers, negative ones too. The second letter is there so the two numbers can differ.' },
  // ---------- 3 your turn ----------
  't.intro': { html: `Your turn: the sum of ${A('two odd integers')} is ${B('even')}. Three steps are yours.`, say: 'Your turn: the sum of two odd integers is even. Three steps are yours.' },
  't.rep': { html: 'Line 1: name two odd integers that can be any odd integers.', say: 'Line one: name two odd integers that can be any odd integers.' },
  't.rep.ok': { html: `Right: ${m} pairs plus one dot, and ${n} pairs plus one dot.`, say: 'Right: m pairs plus one dot, and n pairs plus one dot.' },
  't.rep.one': { html: 'One letter makes a and b the same number. They must be free to differ.', say: 'One letter makes a and b the same number. They must be free to differ.' },
  't.rep.num': { html: 'Three and five are one example. The proof needs letters that stand for every odd integer.', say: 'Three and five are one example. The proof needs letters that stand for every odd integer.' },
  't.rep.any': { html: 'With m = 0.5, 2m + 1 = 2: not odd. The letters must be integers.', say: 'With m equal to one half, two m plus one is two: not odd. The letters must be integers.' },
  't.fac': { html: 'Line 2 adds them: a + b = 2m + 2n + 2. Line 3: write that as 2 times something.', say: 'Line two adds them: a plus b equals two m plus two n plus two. Line three: write that as two times something.' },
  't.fac.ok': { html: 'Right. The two extra dots make one more pair: m + n + 1 pairs.', say: 'Right. The two extra dots make one more pair: m plus n plus one pairs.' },
  't.fac.drop': { html: 'Check by expanding: 2(m + n) + 1 = 2m + 2n + 1. One of the two ones went missing.', say: 'Check by expanding: two times m plus n, plus one, is two m plus two n plus one. One of the two ones went missing.' },
  't.fac.mult': { html: 'Check by expanding: 2(m + n) = 2m + 2n. The + 2 is gone.', say: 'Check by expanding: two times m plus n is two m plus two n. The plus two is gone.' },
  't.rs': { html: 'Line 4: m + n + 1 is an integer. Line 5 says a + b is even. Which reason gives line 5?', say: 'Line four: m plus n plus one is an integer. Line five says a plus b is even. Which reason gives line five?' },
  't.rs.ok': { html: `Right: 2 times an integer is even, by definition. The proof covers ${S('every')} pair of odd integers.`, say: 'Right: two times an integer is even, by definition. The proof covers every pair of odd integers.' },
  't.rs.num': { html: 'A check with numbers is an example. The reason has to hold for every integer.', say: 'A check with numbers is an example. The reason has to hold for every integer.' },
  't.rs.odd': { html: 'Line 5 is about being even, so it needs the definition of an even integer.', say: 'Line five is about being even, so it needs the definition of an even integer.' },
  't.rs.circ': { html: 'That is the claim we are proving: it cannot be its own reason.', say: 'That is the claim we are proving: it cannot be its own reason.' },
  'q.cb.notyet': { html: `Back to Lena: you said <b>not proved</b>. Right, and here is why it matters: at n = 40 the value is 1681 = 41 × 41, ${W('not prime')}. Forty checks would not have proved it either.`, say: 'Back to Lena: you said not proved. Right, and here is why it matters: at n equals forty the value is sixteen eighty one, which is forty one times forty one, not prime. Forty checks would not have proved it either.' },
  'q.cb.proved': { html: `Back to Lena: you said <b>proved</b>. But at n = 40 the value is 1681 = 41 × 41, ${W('not prime')}. Examples that work prove nothing about the ones not checked.`, say: 'Back to Lena: you said proved. But at n equals forty the value is sixteen eighty one, which is forty one times forty one, not prime. Examples that work prove nothing about the ones not checked.' },
  'q.cb.false': { html: `Back to Lena: you said <b>false because the checks are too few</b>. Too few checks only leave a claim open. It IS false, but only because of a counterexample: n = 40 gives 1681 = 41 × 41.`, say: 'Back to Lena: you said false because the checks are too few. Too few checks only leave a claim open. It is false, but only because of a counterexample: n equals forty gives sixteen eighty one, which is forty one times forty one.' },
  'q.cb.none': { html: 'Back to Lena: at n = 40 the value is 1681 = 41 × 41, not prime. Checks never proved her claim.', say: 'Back to Lena: at n equals forty the value is sixteen eighty one, forty one times forty one, not prime. Checks never proved her claim.' },
  // ---------- 4 prove it ----------
  'p.intro': {
    html: `Mateo claims: “An integer ${n} is ${A('even')} <b>if and only if</b> ${n} + 1 is ${B('odd')}.” His proof: if ${n} = 2${k}, then ${n} + 1 = 2${k} + 1, which is odd. Has he proved his claim?`,
    say: 'Mateo claims: an integer n is even if and only if n plus one is odd. His proof: if n equals two k, then n plus one equals two k plus one, which is odd. Has he proved his claim?',
  },
  'p.build': { html: 'Right: he proved one direction. The other one needs its own proof: if n + 1 is odd, then n is even. Build it.', say: 'Right: he proved one direction. The other one needs its own proof: if n plus one is odd, then n is even. Build it.' },
  'p.build-test': { html: 'Not yet: he proved only “if n is even, then n + 1 is odd”. An “if and only if” claim has two directions. Build the other one: if n + 1 is odd, then n is even.', say: 'Not yet: he proved only one direction, if n is even, then n plus one is odd. An if and only if claim has two directions. Build the other one: if n plus one is odd, then n is even.' },
  'p.order-done': { html: 'The lines are in order. Now the reasons.', say: 'The lines are in order. Now the reasons.' },
  'p.wrong': { html: 'Not that one.', say: 'Not that one.' },
  'p.done': { html: `Both directions are proved, so the claim is proved: ${S('n is even if and only if n + 1 is odd')}. In the picture the two regions are one and the same.`, say: 'Both directions are proved, so the claim is proved: n is even if and only if n plus one is odd. In the picture the two regions are one and the same.' },
};
