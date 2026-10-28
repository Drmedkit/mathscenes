// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// real parts teal, i parts amber, the answer lime), `say` is the same line written to be read aloud.
// pages/lessons/complex-numbers/voice/lines.json holds the `say` texts (the test keeps the two in step).
const i = '<i>i</i>';
const i2 = `${i}<sup>2</sup>`;
const s = (t: string) => `<b class="s">${t}</b>`;
const re = (t: string) => `<b class="b">${t}</b>`;
const im = (t: string) => `<b class="a">${t}</b>`;
const root = (t: string) => `√<u class="rb">${t}</u>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `Mathematicians made up a new number, ${i}, with one rule: <b>${i2} = −1</b>. Everything else works like the algebra you already know.`, say: 'Mathematicians made up a new number, i, with one rule: i squared is negative one. Everything else works like the algebra you already know.' },
  'q.ask': { html: `So what is <b>(2 + 3${i})(4 + ${i})</b>? Pick an answer, and say how sure you are.`, say: 'So what is two plus three i, times four plus i? Pick an answer, and say how sure you are.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the algebra.', say: 'Four steps. Press each one: the picture moves first, then the algebra.' },
  'e.s0': { html: `Multiplying by ${i} turns an arrow a quarter turn around 0: 1 turns into ${i}. Turn again and ${i} · ${i} lands on −1. So ${s(`${i2} = −1`)}, and ${i} sits off the real number line.`, say: 'Multiplying by i turns an arrow a quarter turn around zero: one turns into i. Turn again, and i times i lands on negative one. So i squared is negative one, and i sits off the real number line.' },
  'e.s1': { html: `Every term times every term, like any two binomials: ${re('2 · 4 = 8')}, ${im(`2 · ${i} = 2${i}`)}, ${im(`3${i} · 4 = 12${i}`)}, and 3${i} · ${i} = 3${i2}.`, say: 'Every term times every term, like any two binomials. Two times four is eight. Two times i is two i. Three i times four is twelve i. And three i times i is three i squared.' },
  'e.s2': { html: `Now the rule: ${i2} = −1, so 3${i2} = 3 · (−1) = ${re('−3')}. That cell is a real number now.`, say: 'Now the rule: i squared is negative one, so three i squared is three times negative one, which is negative three. That cell is a real number now.' },
  'e.s3': { html: `Collect real with real: ${re('8 − 3 = 5')}. Collect ${i} with ${i}: ${im(`2${i} + 12${i} = 14${i}`)}. ${s(`(2 + 3${i})(4 + ${i}) = 5 + 14${i}`)}.`, say: 'Collect real with real: eight minus three is five. Collect i with i: two i plus twelve i is fourteen i. So the product is five plus fourteen i.' },
  'e.why': { html: `Quick check: why did the 3${i2} cell turn into −3?`, say: 'Quick check. Why did the three i squared cell turn into negative three?' },
  'e.w-ok': { html: `Yes. ${i2} = −1, so 3${i2} = 3 · (−1) = −3.`, say: 'Yes. i squared is negative one, so three i squared is negative three.' },
  'e.w-neg': { html: `If ${i} were −1, then ${i2} would be (−1)<sup>2</sup> = +1. ${i} is not −1: it is the number whose SQUARE is −1.`, say: 'If i were negative one, then i squared would be positive one. i is not negative one. It is the number whose square is negative one.' },
  'e.w-pos': { html: `Real squares are never negative, but ${i} is not real. It was made so that ${i2} = −1.`, say: 'Real squares are never negative, but i is not real. It was made so that i squared is negative one.' },
  // 3. Your turn
  't.intro': { html: `Your turn: <b>(3 − 2${i})(1 + 4${i})</b>. The first two steps are done for you: ${i2} = −1, and the box is filled.`, say: 'Your turn: three minus two i, times one plus four i. The first two steps are done for you: i squared is negative one, and the box is filled.' },
  't.i2': { html: `Step 3: the corner cell holds −8${i2}. Which real number is −8${i2}?`, say: 'Step three. The corner cell holds negative eight i squared. Which real number is that?' },
  't.i2-ok': { html: `Yes: −8 · (−1) = 8. The cell turns real.`, say: 'Yes. Negative eight times negative one is eight. The cell turns real.' },
  't.i2-plus': { html: `${i2} is −1, not +1: −8${i2} = −8 · (−1) = +8.`, say: 'i squared is negative one, not positive one. Negative eight times negative one is positive eight.' },
  't.i2-no': { html: `Replace ${i2} with −1: −8 · (−1) = ?`, say: 'Replace i squared with negative one. Negative eight times negative one is what?' },
  't.num': { html: 'Type a number first.', say: 'Type a number first.' },
  't.sum': { html: `Step 4: collect, real with real and ${i} with ${i}. Type the product as a + b${i}.`, say: 'Step four: collect, real with real and i with i. Type the product as a plus b i.' },
  't.pair': { html: 'Fill in both boxes first.', say: 'Fill in both boxes first.' },
  't.sum-ok': { html: `Yes: 3 + 8 = 11 and 12${i} − 2${i} = 10${i}. ${s(`(3 − 2${i})(1 + 4${i}) = 11 + 10${i}`)}.`, say: 'Yes. Three plus eight is eleven, and twelve i minus two i is ten i. The product is eleven plus ten i.' },
  't.sum-plus': { html: `The corner cell is +8 now, so the real part is 3 + 8.`, say: 'The corner cell is positive eight now, so the real part is three plus eight.' },
  't.sum-sign': { html: `Mind the sign: 12${i} − 2${i} = 10${i}.`, say: 'Mind the sign. Twelve i minus two i is ten i.' },
  't.sum-mix': { html: `Keep the two kinds apart: the real cells are 3 and 8, the ${i} cells are 12${i} and −2${i}.`, say: 'Keep the two kinds apart. The real cells are three and eight. The i cells are twelve i and negative two i.' },
  't.cb-right': { html: `At the start you picked 5 + 14${i}, and you were right. Now you can show why: every term times every term, then ${i2} = −1.`, say: 'At the start you picked five plus fourteen i, and you were right. Now you can show why: every term times every term, then i squared is negative one.' },
  't.cb-plus': { html: `At the start you picked 11 + 14${i}. That treats ${i2} as +1. The rule is ${i2} = −1, so 3${i2} is −3.`, say: 'At the start you picked eleven plus fourteen i. That treats i squared as positive one. The rule is i squared is negative one, so three i squared is negative three.' },
  't.cb-fl': { html: `At the start you picked 5. That multiplies only the firsts and the lasts. The cross terms 2${i} and 12${i} count too.`, say: 'At the start you picked five. That multiplies only the firsts and the lasts. The cross terms, two i and twelve i, count too.' },
  't.cb-none': { html: `Every term times every term, then ${i2} = −1, then collect: that is how every complex product works.`, say: 'Every term times every term, then i squared is negative one, then collect. That is how every complex product works.' },
  // 4. Prove it
  'p.intro': { html: `Sam says: ${root('−4')} · ${root('−9')} = ${root('(−4)(−9)')} = ${root('36')} = 6, because √a · √b = √(ab). Is Sam right?`, say: 'Sam says: the root of negative four, times the root of negative nine, is the root of thirty six, which is six, because root a times root b is the root of a times b. Is Sam right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `Right. Each root of a negative is ${i} times a real root: ${root('−4')} = ${i}${root('4')} = 2${i}.`, say: 'Right. Each root of a negative is i times a real root. The root of negative four is two i.' },
  'p.c2': { html: 'Right. The numbers multiply to 6, and the two i’s are still there.', say: 'Right. The numbers multiply to six, and the two i’s are still there.' },
  'p.c3': { html: `Right. 6 turns a quarter turn, then another: it lands on −6, not 6.`, say: 'Right. Six turns a quarter turn, then another. It lands on negative six, not six.' },
  'p.no.rule': { html: `That is Sam’s rule. It holds when a and b are not both negative. Here it gives the wrong answer.`, say: 'That is Sam’s rule. It holds when a and b are not both negative. Here it gives the wrong answer.' },
  'p.no.neg': { html: `(−2)<sup>2</sup> = 4, not −4. The principal root of −4 is 2${i}.`, say: 'Negative two squared is four, not negative four. The principal root of negative four is two i.' },
  'p.no.ii': { html: `${i} · ${i} is ${i2}, which is −1. No ${i} is left over.`, say: 'i times i is i squared, which is negative one. No i is left over.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof: three claims, each with its reason, and the plane backs every one. Write roots of negatives with ${i} FIRST: √a · √b = √(ab) fails when both are negative.`, say: 'That’s a proof: three claims, each with its reason, and the plane backs every one. Write roots of negatives with i first. Root a times root b equals root a b fails when both are negative.' },
};
