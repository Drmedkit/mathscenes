// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (x² blue, x-terms
// amber, constants teal, the answer lime), `say` is the same line written to be read aloud.
// pages/lessons/factoring/voice/lines.json holds the `say` texts (the test keeps the two in step).
const x = '<i>x</i>';
const sq = `${x}<sup>2</sup>`;
const s = (t: string) => `<b class="s">${t}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A rectangular patio has area ${sq} + 7${x} + 12 square feet. Its sides are ${x} plus a whole number of feet.`, say: 'A rectangular patio has an area of x squared plus seven x plus twelve square feet. Its sides are x plus a whole number of feet.' },
  'q.ask': { html: 'Which product gives the same area, so its factors are the sides? Pick one, and say how sure you are.', say: 'Which product gives the same area, so that its factors are the sides? Pick one, and say how sure you are.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Factoring is multiplying backwards: the box is full, and we look for its sides. Four steps.', say: 'Factoring is multiplying backwards. The box is full, and we look for its sides. Four steps.' },
  'e.s0': { html: `The corners: ${sq} is ${x} times ${x}, so both sides start with ${x}. The 12 is the two missing numbers multiplied.`, say: 'The corners first. x squared is x times x, so both sides start with x. The twelve is the two missing numbers, multiplied.' },
  'e.s1': { html: `The two middle cells are the missing numbers times ${x}, and together they make 7${x}. So we need a pair with product 12 AND sum 7. Only 3 and 4 work.`, say: 'The two middle cells are the missing numbers times x, and together they make seven x. So we need a pair with a product of twelve, and a sum of seven. Only three and four work.' },
  'e.s2': { html: `The middle cells are 3${x} and 4${x}, so the sides are ${x} + 3 and ${x} + 4: ${s(`${sq} + 7${x} + 12 = (${x} + 3)(${x} + 4)`)}.`, say: 'The middle cells are three x and four x, so the sides are x plus three, and x plus four. x squared plus seven x plus twelve is x plus three, times x plus four.' },
  'e.s3': { html: `Expand to check: every cell matches, so the two forms are equal for every ${x}. The pair 2 and 6 also multiplies to 12, but its cells add to 8${x}.`, say: 'Expand to check. Every cell matches, so the two forms are equal for every x. The pair two and six also multiplies to twelve, but its cells add to eight x.' },
  'e.why': { html: 'Quick check: why must the pair add to 7?', say: 'Quick check. Why must the pair add to seven?' },
  'e.w-ok': { html: `Yes. The two middle cells are 3${x} and 4${x}, and together they must make the 7${x}.`, say: 'Yes. The two middle cells are three x and four x, and together they must make the seven x.' },
  'e.w-any': { html: `A pair that multiplies to 12 gets the corner right, but the middle cells must add to 7${x} too: 2 and 6 give 8${x}.`, say: 'A pair that multiplies to twelve gets the corner right. But the middle cells must add to seven x too. Two and six give eight x.' },
  'e.w-swap': { html: 'The other way round: the PRODUCT is the corner, 12, and the SUM is the middle, 7.', say: 'The other way round. The product is the corner, twelve, and the sum is the middle, seven.' },
  // 3. Your turn
  't.intro': { html: `Now you: factor ${sq} − 2${x} − 15. The corners are in, and both sides start with ${x}.`, say: 'Now you. Factor x squared minus two x minus fifteen. The corners are in, and both sides start with x.' },
  't.pair': { html: 'Your step: which two numbers have product −15 and sum −2?', say: 'Your step. Which two numbers have a product of negative fifteen, and a sum of negative two?' },
  't.p-ok': { html: `Yes: 3 · (−5) = −15 and 3 + (−5) = −2. A negative product means opposite signs, and the larger one takes the sign of −2.`, say: 'Yes. Three times negative five is negative fifteen, and three plus negative five is negative two. A negative product means opposite signs, and the larger one takes the sign of the middle.' },
  't.p-rev': { html: `−3 and 5 multiply to −15, but they add to +2. The larger number must take the sign of the middle: −5.`, say: 'Negative three and five multiply to negative fifteen, but they add to positive two. The larger number must take the sign of the middle: negative five.' },
  't.p-same': { html: 'Two negatives multiply to a POSITIVE number. The product here is −15, so the signs are opposite.', say: 'Two negatives multiply to a positive number. The product here is negative fifteen, so the signs are opposite.' },
  't.mid': { html: `Check by expanding: the middle cells are 3${x} and −5${x}. What coefficient of ${x} do they make together?`, say: 'Check by expanding. The middle cells are three x and negative five x. What coefficient of x do they make together?' },
  't.m-ok': { html: `Yes: 3${x} − 5${x} = −2${x}, the middle of the original. So ${s(`${sq} − 2${x} − 15 = (${x} + 3)(${x} − 5)`)}.`, say: 'Yes. Three x minus five x is negative two x, the middle of the original. So x squared minus two x minus fifteen is x plus three, times x minus five.' },
  't.m-sign': { html: '3 + (−5) is −2, not 2. Watch the sign.', say: 'Three plus negative five is negative two, not two. Watch the sign.' },
  't.m-prod': { html: 'That is the corner. The middle coefficient is the SUM of the two middle cells: 3 and −5.', say: 'That is the corner. The middle coefficient is the sum of the two middle cells: three, and negative five.' },
  't.m-no': { html: 'Add the coefficients of the two middle cells: 3 and −5.', say: 'Add the coefficients of the two middle cells: three, and negative five.' },
  't.num': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': { html: `At the start you picked ${s(`(${x} + 3)(${x} + 4)`)}, and you were right. Now you know why: product 12, sum 7.`, say: 'At the start you picked x plus three, times x plus four, and you were right. Now you know why: product twelve, sum seven.' },
  't.cb-sum': { html: `At the start you picked (${x} + 2)(${x} + 6). Its corner is 12, but its middle cells add to 8${x}, not 7${x}.`, say: 'At the start you picked x plus two, times x plus six. Its corner is twelve, but its middle cells add to eight x, not seven x.' },
  't.cb-solve': { html: `At the start you picked ${x} = −3 or ${x} = −4. That solves an equation; factoring rewrites the area as a product of sides.`, say: 'At the start you picked x equals negative three or negative four. That solves an equation. Factoring rewrites the area as a product of sides.' },
  't.cb-none': { html: 'Corners first, then a pair with the right product AND the right sum, then expand to check.', say: 'Corners first. Then a pair with the right product and the right sum. Then expand to check.' },
  // 4. Prove it
  'p.intro': { html: `Sam writes 2${sq} − 18 = (2${x} + 6)(${x} − 3) and says: “It multiplies back, so it is factored completely.” Is Sam right?`, say: 'Sam writes: two x squared minus eighteen equals two x plus six, times x minus three. And Sam says: it multiplies back, so it is factored completely. Is Sam right?' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because, with the reason that makes the line true.' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: "Let's test it. Build the argument, and see where it leads." },
  'p.c1': { html: `Right. The cells are 2${sq}, −6${x}, 6${x} and −18; the two middle cells cancel. Sam’s product is correct.`, say: "Right. The cells are two x squared, negative six x, six x, and negative eighteen. The two middle cells cancel. Sam's product is correct." },
  'p.c2': { html: `Right. 2${x} + 6 = 2(${x} + 3): that factor still has a common factor 2. Correct is not the same as complete.`, say: 'Right. Two x plus six is two times x plus three. That factor still has a common factor of two. Correct is not the same as complete.' },
  'p.c3': { html: `Right. Take the 2 out first: 2(${sq} − 9), and ${sq} − 9 = (${x} + 3)(${x} − 3), a difference of squares.`, say: 'Right. Take the two out first: two times x squared minus nine. And x squared minus nine is x plus three, times x minus three: a difference of squares.' },
  'p.no.prod': { html: 'That is exactly Sam’s claim. Multiplying back shows the product is EQUAL, not that every factor is prime.', say: "That is exactly Sam's claim. Multiplying back shows the product is equal, not that every factor is prime." },
  'p.no.ex': { html: 'One matching value proves nothing, and it says nothing about completeness either.', say: 'One matching value proves nothing. And it says nothing about completeness, either.' },
  'p.no.sq': { html: `(${x} − 3)<sup>2</sup> has a middle term −6${x}. A difference of squares is (A + B)(A − B).`, say: 'x minus three, squared, has a middle term. A difference of squares is A plus B, times A minus B.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof: Sam’s product is correct but not complete. Completely factored, ${s(`2${sq} − 18 = 2(${x} + 3)(${x} − 3)`)}.`, say: "That's a proof. Sam's product is correct, but not complete. Completely factored, two x squared minus eighteen is two, times x plus three, times x minus three." },
};
