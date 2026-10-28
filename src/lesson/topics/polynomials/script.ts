// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// x² blue, x-terms amber, constants teal, the answer lime), `say` is the same line written to be read aloud.
// pages/lessons/polynomials/voice/lines.json holds the `say` texts (the test keeps the two in step).
const x = '<i>x</i>';
const sq = `${x}<sup>2</sup>`, cu = `${x}<sup>3</sup>`;
const s = (t: string) => `<b class="s">${t}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A square garden is ${x} ft on each side. You make it <b>3 ft</b> longer and <b>3 ft</b> wider, so it is still a square: (${x} + 3) ft on each side.`, say: 'A square garden is x feet on each side. You make it three feet longer and three feet wider, so it is still a square, x plus three feet on each side.' },
  'q.ask': { html: `Its new area is (${x} + 3)<sup>2</sup> square feet. Which polynomial gives the same area for every ${x}? Pick one, and say how sure you are.`, say: 'Its new area is x plus three, squared, in square feet. Which polynomial gives the same area, for every x? Pick one, and say how sure you are.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the box fills first, then the algebra.', say: 'Four steps. Press each one: the box fills first, then the algebra.' },
  'e.s0': { html: `A square is a quantity times itself: (${x} + 3)<sup>2</sup> = (${x} + 3)(${x} + 3). Both sides of the box are ${x} + 3.`, say: 'A square is a quantity times itself. So x plus three, squared, is x plus three times x plus three. Both sides of the box are x plus three.' },
  'e.s1': { html: `Every term times every term: ${x} · ${x} = ${sq}, ${x} · 3 = 3${x}, 3 · ${x} = 3${x}, 3 · 3 = 9. Four partial products, four pieces of the garden.`, say: 'Every term times every term. x times x is x squared. x times three is three x, and three times x is three x again. Three times three is nine. Four partial products: four pieces of the garden.' },
  'e.s2': { html: `The two 3${x} pieces are like terms (the same power of ${x}), so they collect: 3${x} + 3${x} = 6${x}. ${s(`(${x} + 3)<sup>2</sup> = ${sq} + 6${x} + 9`)}, a quadratic trinomial.`, say: 'The two three x pieces are like terms, with the same power of x, so they collect: six x. x plus three, squared, is x squared plus six x plus nine. A quadratic trinomial.' },
  'e.s3': { html: `Check with ${x} = 2: (2 + 3)<sup>2</sup> = 25, and 4 + 12 + 9 = 25. It checks. But ${sq} + 9 gives 13: it leaves out the two 3${x} strips.`, say: 'Check with x equal to two. Five squared is twenty five, and four plus twelve plus nine is twenty five. It checks. But x squared plus nine gives thirteen. It leaves out the two strips.' },
  'e.why': { html: `Quick check: where does the 6${x} come from?`, say: 'Quick check. Where does the six x come from?' },
  'e.w-ok': { html: `Yes. Two of the four partial products are 3${x}, and like terms add: 6${x}.`, say: 'Yes. Two of the four partial products are three x, and like terms add: six x.' },
  'e.w-fn': { html: `Squaring a sum is not squaring each term. (${x} + 3)<sup>2</sup> is (${x} + 3)(${x} + 3): the two 3${x} strips are real area.`, say: 'Squaring a sum is not squaring each term. x plus three, squared, is x plus three times x plus three. The two strips are real area.' },
  'e.w-unlike': { html: `${x} and 3 are unlike terms: they never combine. The 6${x} is two strips of 3${x}, each 3 ft by ${x} ft.`, say: 'x and three are unlike terms. They never combine. The six x is two strips of three x, each three feet by x feet.' },
  // 3. Your turn
  't.intro': { html: `Now a bigger product: (${x} − 2)(${sq} + ${x} + 3). Two terms times three terms: a box with 6 cells. The first row is done for you.`, say: 'Now a bigger product: x minus two, times x squared plus x plus three. Two terms times three terms: a box with six cells. The first row is done for you.' },
  't.row': { html: `Your step: the second row. What is −2 times each term of ${sq} + ${x} + 3?`, say: 'Your step: the second row. What is negative two times each term of x squared plus x plus three?' },
  't.r-ok': { html: `Yes: −2 multiplies every term across the top. Six partial products in all.`, say: 'Yes. Negative two multiplies every term across the top. Six partial products in all.' },
  't.r-part': { html: `−2 multiplies EVERY term across the top, not only the first one.`, say: 'Negative two multiplies every term across the top, not only the first one.' },
  't.r-sign': { html: `A negative times a positive is negative: −2 · ${sq} = −2${sq}.`, say: 'A negative times a positive is negative. Negative two times x squared is negative two x squared.' },
  't.x2': { html: `Now collect. The ${sq} cells sit on one diagonal: ${sq} and −2${sq}. What is the coefficient of ${sq}?`, say: 'Now collect. The x squared cells sit on one diagonal: x squared, and negative two x squared. What is the coefficient of x squared?' },
  't.x2-ok': { html: `Yes: ${sq} − 2${sq} = −${sq}, coefficient −1.`, say: 'Yes. x squared minus two x squared is negative x squared. The coefficient is negative one.' },
  't.x2-one': { html: `There are TWO ${sq} cells: ${sq} from the first row and −2${sq} from the second. Add both.`, say: 'There are two x squared cells: x squared from the first row, and negative two x squared from the second. Add both.' },
  't.x2-sign': { html: `1 + (−2) is −1, not 1.`, say: 'One plus negative two is negative one, not one.' },
  't.x2-no': { html: `Add the coefficients of the two ${sq} cells: 1 and −2.`, say: 'Add the coefficients of the two x squared cells: one, and negative two.' },
  't.x1': { html: `And the ${x} cells: 3${x} and −2${x}. What is the coefficient of ${x}?`, say: 'And the x cells: three x, and negative two x. What is the coefficient of x?' },
  't.x1-ok': { html: `Yes: 3${x} − 2${x} = ${x}. So (${x} − 2)(${sq} + ${x} + 3) = ${s(`${cu} − ${sq} + ${x} − 6`)}.`, say: 'Yes. Three x minus two x is x. So the product is x cubed minus x squared plus x minus six.' },
  't.x1-no': { html: `Add the coefficients of the two ${x} cells: 3 and −2.`, say: 'Add the coefficients of the two x cells: three, and negative two.' },
  't.deg': { html: `Last: what is the degree of ${cu} − ${sq} + ${x} − 6?`, say: 'Last one. What is the degree of x cubed minus x squared plus x minus six?' },
  't.d-ok': { html: `Yes: degree 3, a cubic polynomial with four terms. Every term times every term, then collect by power.`, say: 'Yes. Degree three: a cubic polynomial with four terms. Every term times every term, then collect by power.' },
  't.d-count': { html: `4 is the number of terms. The degree is the highest power: ${cu}.`, say: 'Four is the number of terms. The degree is the highest power, x cubed.' },
  't.d-sum': { html: `Do not add the exponents: the degree is the largest one.`, say: 'Do not add the exponents. The degree is the largest one.' },
  't.d-no': { html: `Find the highest power of ${x} among the terms.`, say: 'Find the highest power of x among the terms.' },
  't.num': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': { html: `At the start you picked ${s(`${sq} + 6${x} + 9`)}, and you were right. Now you can show why: every term times every term.`, say: 'At the start you picked x squared plus six x plus nine, and you were right. Now you can show why: every term times every term.' },
  't.cb-fn': { html: `At the start you picked ${sq} + 9. That squares each term and leaves out the cross products: the two 3${x} strips.`, say: 'At the start you picked x squared plus nine. That squares each term, and leaves out the cross products: the two strips.' },
  't.cb-double': { html: `At the start you picked 2${x} + 6. That doubles instead of squaring. A square is a product of two equal factors.`, say: 'At the start you picked two x plus six. That doubles, instead of squaring. A square is a product of two equal factors.' },
  't.cb-none': { html: 'Every term times every term, then collect by power: that is how every polynomial product comes out.', say: 'Every term times every term, then collect by power. That is how every polynomial product comes out.' },
  // 4. Prove it
  'p.intro': { html: `Riley subtracts: (5${sq} + 3${x} − 2) − (2${sq} − 4${x} + 1) = <b>3${sq} − ${x} − 1</b>. Is Riley right?`, say: 'Riley subtracts. Five x squared plus three x minus two, minus the quantity two x squared minus four x plus one. Riley gets three x squared minus x minus one. Is Riley right?' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because, with the reason that makes the line true.' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: "Let's test it. Build the argument, and see where it leads." },
  'p.c1': { html: `Right. At ${x} = 1 the left side is 6 − (−1) = 7, but Riley’s answer is 1. One value where they differ is enough.`, say: "Right. At x equal to one, the left side is six minus negative one, which is seven. But Riley's answer is one. One value where they differ is enough." },
  'p.c2': { html: `Right. The minus multiplies every term: −2${sq} + 4${x} − 1. Riley flipped only the first sign.`, say: 'Right. The minus multiplies every term: negative two x squared, plus four x, minus one. Riley flipped only the first sign.' },
  'p.c3': { html: `Right. Collect by power: 5${sq} − 2${sq} = 3${sq}, 3${x} + 4${x} = 7${x}, −2 − 1 = −3.`, say: 'Right. Collect by power. Five x squared minus two x squared is three x squared. Three x plus four x is seven x. Negative two minus one is negative three.' },
  'p.no.exc': { html: 'A rewrite has to hold for every x. One value where it fails is a counterexample, not an exception.', say: 'A rewrite has to hold for every x. One value where it fails is a counterexample, not an exception.' },
  'p.no.first': { html: 'That is exactly Riley’s slip. The minus is in front of the whole group, so it multiplies every term.', say: "That is exactly Riley's slip. The minus is in front of the whole group, so it multiplies every term." },
  'p.no.ex': { html: 'Matching values never prove a rewrite for every x, and here the values do not even match.', say: 'Matching values never prove a rewrite for every x. And here, the values do not even match.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof: a counterexample shows Riley’s line is wrong, and the opposite of the whole polynomial gives ${s(`3${sq} + 7${x} − 3`)}.`, say: "That's a proof. A counterexample shows Riley's line is wrong, and the opposite of the whole polynomial gives three x squared plus seven x minus three." },
};
