// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (real parts teal,
// i parts amber, the answer lime), `say` is the same line written to be read aloud.
// pages/lessons/quadratics-complex/voice/lines.json holds the `say` texts (the test keeps the two in step).
const i = '<i>i</i>';
const x = '<i>x</i>';
const s = (t: string) => `<b class="s">${t}</b>`;
const re = (t: string) => `<b class="b">${t}</b>`;
const im = (t: string) => `<b class="a">${t}</b>`;
const root = (t: string) => `√<u class="rb">${t}</u>`;
const sq = '<sup>2</sup>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `The parabola y = ${x}${sq} − 4${x} + 13 never touches the ${x}-axis: its lowest point is (2, 9).`, say: 'The parabola y equals x squared minus four x plus thirteen never touches the x axis. Its lowest point is two, nine.' },
  'q.ask': { html: `So how many solutions does <b>${x}${sq} − 4${x} + 13 = 0</b> have, now that you know ${i}? Pick one, and say how sure you are.`, say: 'So how many solutions does x squared minus four x plus thirteen equal zero have, now that you know i? Pick one, and say how sure you are.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps with the quadratic formula. Press each one: the picture moves first, then the algebra.', say: 'Four steps with the quadratic formula. Press each one: the picture moves first, then the algebra.' },
  'e.s0': { html: `a = 1, b = −4, c = 13: b${sq} − 4ac = 16 − 52 = ${im('−36')}. Negative, so no real number works: that is why the parabola misses the ${x}-axis.`, say: 'a is one, b is negative four, c is thirteen. b squared minus four a c is sixteen minus fifty two, which is negative thirty six. Negative, so no real number works. That is why the parabola misses the x axis.' },
  'e.s1': { html: `The formula needs ${root('−36')}. A root of a negative is ${i} times a real root: ${root('−36')} = ${i}${root('36')} = ${im(`6${i}`)}.`, say: 'The formula needs the root of negative thirty six. A root of a negative is i times a real root. The root of negative thirty six is i times six, so six i.' },
  'e.s2': { html: `${x} = (4 ± 6${i}) / 2. Divide BOTH terms by 2: ${s(`${x} = ${re('2')} ± ${im(`3${i}`)}`)}. Both roots sit on the line real part = 2, right above the vertex.`, say: 'x equals four plus or minus six i, over two. Divide both terms by two: x equals two plus or minus three i. Both roots sit on the line where the real part is two, right above the vertex.' },
  'e.s3': { html: `Check 2 + 3${i}: (2 + 3${i})${sq} = 4 + 12${i} + 9${i}${sq} = −5 + 12${i}. Then −5 + 12${i} − 8 − 12${i} + 13 = ${s('0')}. It works.`, say: 'Check two plus three i. Two plus three i, squared, is four plus twelve i plus nine i squared, which is negative five plus twelve i. Then negative five plus twelve i, minus eight, minus twelve i, plus thirteen, is zero. It works.' },
  'e.why': { html: 'Quick check: why do both solutions have the real part 2?', say: 'Quick check. Why do both solutions have the real part two?' },
  'e.w-ok': { html: `Yes. The ± only touches the root: −b/(2a) = 4/2 = 2 is in both. The two roots are a conjugate pair.`, say: 'Yes. The plus or minus only touches the root. Negative b over two a, which is two, is in both. The two roots are a conjugate pair.' },
  'e.w-opp': { html: `The opposite of 2 + 3${i} is −2 − 3${i}. The second root is 2 − 3${i}: same real part, opposite imaginary part.`, say: 'The opposite of two plus three i is negative two minus three i. The second root is two minus three i: the same real part, and the opposite imaginary part.' },
  'e.w-cross': { html: `The parabola never crosses the ${x}-axis. But its vertex IS at ${x} = 2: the shared real part is the vertex's ${x}.`, say: 'The parabola never crosses the x axis. But its vertex is at x equals two. The shared real part is the x of the vertex.' },
  // 3. Your turn
  't.intro': { html: `Your turn: <b>${x}${sq} + 6${x} + 25 = 0</b>. Step 1 is done: b${sq} − 4ac = 36 − 100 = −64.`, say: 'Your turn: x squared plus six x plus twenty five equals zero. Step one is done. b squared minus four a c is thirty six minus one hundred, which is negative sixty four.' },
  't.root': { html: `Step 2: write ${root('−64')} as a number times ${i}.`, say: 'Step two. Write the root of negative sixty four as a number times i.' },
  't.num': { html: 'Type a number first.', say: 'Type a number first.' },
  't.root-ok': { html: `Yes: ${root('−64')} = ${i}${root('64')} = 8${i}.`, say: 'Yes. The root of negative sixty four is i times eight, so eight i.' },
  't.root-neg': { html: `(−8)${sq} = 64, not −64. The root of −64 is ${i} times ${root('64')}: 8${i}.`, say: 'Negative eight squared is sixty four, not negative sixty four. The root of negative sixty four is i times eight.' },
  't.root-no': { html: `${root('−64')} = ${i}${root('64')}. What is ${root('64')}?`, say: 'The root of negative sixty four is i times the root of sixty four. What is the root of sixty four?' },
  't.split': { html: `Step 3: ${x} = (−6 ± 8${i}) / 2. Type it as ${x} = a ± b${i}.`, say: 'Step three. x equals negative six plus or minus eight i, over two. Type it as x equals a plus or minus b i.' },
  't.pair': { html: 'Fill in both boxes first.', say: 'Fill in both boxes first.' },
  't.split-ok': { html: `Yes: −6/2 = −3 and 8${i}/2 = 4${i}. ${s(`${x} = −3 ± 4${i}`)}.`, say: 'Yes. Negative six over two is negative three, and eight i over two is four i. So x equals negative three plus or minus four i.' },
  't.split-b': { html: `The formula starts with −b, and b = 6: the top is −6 ± 8${i}, so the real part is −3.`, say: 'The formula starts with negative b, and b is six. The top is negative six plus or minus eight i, so the real part is negative three.' },
  't.split-half': { html: `Divide BOTH terms of the top by 2: −6/2 and 8${i}/2.`, say: 'Divide both terms of the top by two: negative six over two, and eight i over two.' },
  't.split-no': { html: `Split the fraction: real part −6/2, imaginary part 8/2.`, say: 'Split the fraction. The real part is negative six over two, the imaginary part is eight over two.' },
  't.cb-right': { html: `At the start you picked two non-real solutions, and you were right: no x-intercepts means no REAL solutions, but the formula still gives a pair.`, say: 'At the start you picked two non-real solutions, and you were right. No x intercepts means no real solutions, but the formula still gives a pair.' },
  't.cb-none': { html: `At the start you picked "no solutions". No x-intercepts means no REAL solutions. Over the complex numbers there are two: 2 ± 3${i}.`, say: 'At the start you picked no solutions. No x intercepts means no real solutions. Over the complex numbers there are two: two plus or minus three i.' },
  't.cb-one': { html: `At the start you picked one non-real solution. The ± always gives two: 2 + 3${i} and 2 − 3${i}.`, say: 'At the start you picked one non-real solution. The plus or minus always gives two: two plus three i, and two minus three i.' },
  't.cb-skip': { html: `A negative discriminant: no real solutions, two non-real ones, a conjugate pair.`, say: 'A negative discriminant: no real solutions, two non-real ones, a conjugate pair.' },
  // 4. Prove it
  'p.intro': { html: `Jordan solved ${x}${sq} − 4${x} + 13 = 0, ${x}${sq} + 6${x} + 25 = 0 and ${x}${sq} + 2${x} + 5 = 0. Each time the roots were a conjugate pair, a ± b${i}. "So it is ALWAYS true," says Jordan. Is that a proof?`, say: 'Jordan solved three quadratics. Each time the roots were a conjugate pair, a plus or minus b i. So it is always true, says Jordan. Is that a proof?' },
  'p.yes': { html: 'Three examples show three cases. Let’s see what a proof for EVERY real a, b, c looks like.', say: 'Three examples show three cases. Let’s see what a proof for every real a, b, c looks like.' },
  'p.build': { html: 'Right: examples are not a proof. Build one for every real a, b, c with b² − 4ac negative. Fill each “because”.', say: 'Right. Examples are not a proof. Build one for every real a, b, c with a negative discriminant. Fill each because.' },
  'p.c1': { html: `Right. 4ac − b${sq} is positive, so its root is real, and the ${i} comes out in front.`, say: 'Right. Four a c minus b squared is positive, so its root is real, and the i comes out in front.' },
  'p.c2': { html: 'Right. A fraction with a sum on top splits into two fractions: the real part and the imaginary part.', say: 'Right. A fraction with a sum on top splits into two fractions: the real part, and the imaginary part.' },
  'p.c3': { html: `Right. Both parts are real numbers, so the roots are p + q${i} and p − q${i}: mirror images in the real axis.`, say: 'Right. Both parts are real numbers, so the roots are p plus q i, and p minus q i: mirror images in the real axis.' },
  'p.no.ex': { html: 'That is Jordan’s argument. Examples check only the equations you tried.', say: 'That is Jordan’s argument. Examples check only the equations you tried.' },
  'p.no.opp': { html: `The opposite flips BOTH parts. The two roots share the real part −b/(2a).`, say: 'The opposite flips both parts. The two roots share the real part, negative b over two a.' },
  'p.no.conj': { html: `A conjugate keeps the real part and flips only the imaginary part.`, say: 'A conjugate keeps the real part and flips only the imaginary part.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof: it works for every real a, b, c at once. Non-real roots of a real quadratic always come as a conjugate pair. (With non-real coefficients, they need not.)`, say: 'That’s a proof. It works for every real a, b, c at once. Non-real roots of a real quadratic always come as a conjugate pair. With non-real coefficients, they need not.' },
};
