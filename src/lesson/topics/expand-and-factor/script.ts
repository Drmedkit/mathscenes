// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// x-terms amber, constants teal, the answer lime), `say` is the same line written to be read aloud.
// pages/lessons/expand-and-factor/voice/lines.json holds the `say` texts (the test keeps the two in step).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const x = '<i>x</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A garden bed is <b>4 ft</b> wide. Along its length there are ${a(`${x} ft`)} of tomatoes, then ${b('3 ft')} of herbs.`, say: 'A garden bed is four feet wide. Along its length there are x feet of tomatoes, then three feet of herbs.' },
  'q.ask': { html: `Its area is <b>4(${a(x)} + ${b('3')})</b> square feet. Which expression has the same value for every length ${x}?`, say: 'Its area is four times the quantity x plus three, in square feet. Which expression has the same value, for every length x?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the algebra.', say: 'Four steps. Press each one: the picture moves first, then the algebra.' },
  'e.s1': { html: `Each row is one strip ${a(x)} long and ${b('3')} squares. <b>4</b> rows make the bed: 4 groups of (${a(x)} + ${b('3')}).`, say: 'Each row is one strip, x long, and three squares. Four rows make the bed: four groups of x plus three.' },
  'e.s2': { html: `Split the bed where the tomatoes end. Both parts are still <b>4</b> rows high: 4 · ${a(x)} and 4 · ${b('3')}.`, say: 'Split the bed where the tomatoes end. Both parts are still four rows high: four times x, and four times three.' },
  'e.s3': { html: `The strips make ${a(`4${x}`)}. The squares make ${b('12')}: 4 rows of 3, not just 3.`, say: 'The strips make four x. The squares make twelve: four rows of three, not just three.' },
  'e.s4': { html: `${s(`4(${x} + 3) = 4${x} + 12`)} for every ${x}: the distributive property. Read it backwards and you have factored 4${x} + 12.`, say: "Four times the quantity x plus three is four x plus twelve, for every x. That's the distributive property. Read it backwards, and you have factored four x plus twelve." },
  'e.why': { html: 'Quick check: why is it + 12, and not + 3?', say: 'Quick check. Why is it plus twelve, and not plus three?' },
  'e.w-ok': { html: `Yes. The 4 multiplies every term inside the parentheses: each of the 4 rows has 3 squares.`, say: 'Yes. The four multiplies every term inside the parentheses: each of the four rows has three squares.' },
  'e.w-part': { html: 'Then only the top row would have squares. Look: all 4 rows have 3 squares, so 12.', say: 'Then only the top row would have squares. Look: all four rows have three squares, so twelve.' },
  'e.w-pemdas': { html: 'PEMDAS says what to do first; it does not explain the 12. The rows do: 4 rows of 3 squares.', say: 'PEMDAS says what to do first. It does not explain the twelve. The rows do: four rows of three squares.' },
  // 3. Your turn
  't.intro': { html: `Now the bed is <b>3</b> rows of ${a(`2${x}`)} + ${b('5')}: its area is <b>3(${a(`2${x}`)} + ${b('5')})</b>. The first two steps are done for you.`, say: 'Now the bed is three rows of two x plus five. The first two steps are done for you.' },
  't.area': { html: `Your step: find the area of each part. Write 3(2${x} + 5) as a sum.`, say: 'Your step. Find the area of each part, and write three times the quantity two x plus five as a sum.' },
  't.a-ok': { html: `Yes: 3 rows of 2 strips make ${a(`6${x}`)}, and 3 rows of 5 squares make ${b('15')}.`, say: 'Yes. Three rows of two strips make six x, and three rows of five squares make fifteen.' },
  't.a-part': { html: 'Count the squares: each of the 3 rows has 5. That makes 15, not 5.', say: 'Count the squares. Each of the three rows has five. That makes fifteen, not five.' },
  't.a-concat': { html: `3 times 2${x} is 6${x}: 3 rows of 2 strips. It is not 32${x}.`, say: 'Three times two x is six x: three rows of two strips. It is not thirty two x.' },
  't.a-unlike': { html: `Strips and squares are unlike terms: 6${x} and 15 stay separate.`, say: 'Strips and squares are unlike terms. Six x and fifteen stay separate.' },
  't.a-other': { html: 'Count each part: the strips (3 rows of 2) and the squares (3 rows of 5).', say: 'Count each part: the strips, three rows of two, and the squares, three rows of five.' },
  't.fill': { html: 'Fill in both boxes.', say: 'Fill in both boxes.' },
  't.name': { html: `Which property turns 3(2${x} + 5) into 6${x} + 15?`, say: 'Which property turns three times the quantity two x plus five into six x plus fifteen?' },
  't.n-ok': { html: 'Yes: the distributive property. The 3 is shared out to every term inside.', say: 'Yes, the distributive property. The three is shared out to every term inside.' },
  't.n-comm': { html: 'The commutative property changes the order; nothing was reordered here. The 3 went into the sum.', say: 'The commutative property changes the order, and nothing was reordered here. The three went into the sum.' },
  't.n-assoc': { html: 'The associative property moves parentheses; here a factor went into a sum.', say: 'The associative property moves parentheses. Here, a factor went into a sum.' },
  't.back': { html: `Now read it backwards. What number goes in the box? 6${x} + 15 = □(2${x} + 5)`, say: 'Now read it backwards. Six x plus fifteen is what number times the quantity two x plus five?' },
  't.b-ok': { html: `Yes: 3. The parts slide back together: ${s(`6${x} + 15 = 3(2${x} + 5)`)}. That is factoring.`, say: 'Yes, three. The parts slide back together. That is factoring.' },
  't.b-one': { html: 'Check it: 6 times 5 is 30, not 15. The factor has to go into both terms.', say: 'Check it. Six times five is thirty, not fifteen. The factor has to go into both terms.' },
  't.b-other': { html: `Which number times 2${x} makes 6${x}, and times 5 makes 15?`, say: 'Which number times two x makes six x, and times five makes fifteen?' },
  't.num': { html: 'Type a number in the box.', say: 'Type a number in the box.' },
  't.cb-right': { html: `At the start you picked ${s(`4${x} + 12`)}, and you were right. Now you can show why.`, say: 'At the start you picked four x plus twelve, and you were right. Now you can show why.' },
  't.cb-part': { html: `At the start you picked 4${x} + 3. The squares show why it is ${s('12')}: 4 rows of 3.`, say: 'At the start you picked four x plus three. The squares show why it is twelve: four rows of three.' },
  't.cb-unlike': { html: `At the start you picked 16${x}. But 4${x} and 12 are unlike terms: they cannot become one term.`, say: 'At the start you picked sixteen x. But four x and twelve are unlike terms. They cannot become one term.' },
  // 4. Prove it
  'p.intro': { html: `Riley says <b>2(${x} + 3)</b> and <b>3${x} + 4</b> are equivalent: "I tried ${x} = 2, and both give 10."`, say: 'Riley says two times the quantity x plus three, and three x plus four, are equivalent. I tried x equals two, and both give ten.' },
  'p.judge': { html: 'Is Riley right?', say: 'Is Riley right?' },
  'p.build': { html: 'Prove it. Fill each “because” with the reason that makes the line true.', say: 'Prove it. Fill each because, with the reason that makes the line true.' },
  'p.test': { html: "Let's test that. Build the argument, and see where it leads.", say: "Let's test that. Build the argument, and see where it leads." },
  'p.c1': { html: `Right: 2(${x} + 3) is ${a(`2${x}`)} + ${b('6')}, for every ${x}.`, say: 'Right. Two times the quantity x plus three is two x plus six, for every x.' },
  'p.c2': { html: `At ${x} = 0: 2(${x} + 3) is 6, but 3${x} + 4 is 4. They differ.`, say: 'At x equals zero, two times the quantity x plus three is six, but three x plus four is four. They differ.' },
  'p.c3': { html: `So they are ${s('not equivalent')}. Matching at ${x} = 2 was a coincidence.`, say: 'So they are not equivalent. Matching at x equals two was a coincidence.' },
  'p.done': { html: 'That is a proof: every line has its reason, and one counterexample settles it.', say: 'That is a proof. Every line has its reason, and one counterexample settles it.' },
  'p.w-pemdas': { html: 'PEMDAS says what to do first; it does not allow a rewrite. The distributive property does.', say: 'PEMDAS says what to do first. It does not allow a rewrite. The distributive property does.' },
  'p.w-examples': { html: "That is Riley's slip: matching at one value is not matching at every value.", say: "That is Riley's slip. Matching at one value is not matching at every value." },
  'p.w-exception': { html: 'A counterexample is not an exception. Equivalent means equal for EVERY x, so one miss breaks it.', say: 'A counterexample is not an exception. Equivalent means equal for every x, so one miss breaks it.' },
  'p.w-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
};
