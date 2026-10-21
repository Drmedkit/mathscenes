// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// amber = the quantity we compare WITH, teal = the other quantity, lime = the times-as-much answer), `say` is the same
// line written to be read aloud ("ten to the ninth", never "10^9").
// pages/lessons/scientific-notation/voice/lines.json holds the `say` texts (the test keeps the two in step).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const p = (n: number | string) => `10<sup>${String(n).replace(/-/g, '−')}</sup>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: Earth and Neptune
  'q.intro': {
    html: `Earth is about ${a(`1.5 × ${p(8)} km`)} from the Sun. Neptune, the farthest planet, is about ${b(`4.5 × ${p(9)} km`)} from the Sun.`,
    say: 'Earth is about one point five times ten to the eighth kilometers from the Sun. Neptune, the farthest planet, is about four point five times ten to the ninth kilometers from the Sun.',
  },
  'q.ask': { html: 'About how many times as far from the Sun is Neptune?', say: 'About how many times as far from the Sun is Neptune?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },

  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the ladder moves first, then the notation.', say: 'Four steps. Press each one: the ladder moves first, then the notation.' },
  'e.s1': {
    html: `Each rung of the ladder is ${s('10 times')} the rung below. Earth sits a little past ${p(8)}; Neptune is past ${p(9)}, more than halfway to the next rung.`,
    say: 'Each rung of the ladder is ten times the rung below. Earth sits a little past ten to the eighth. Neptune is past ten to the ninth, more than halfway to the next rung.',
  },
  'e.s2': {
    html: `Divide the powers: ${p(9)} ÷ ${p(8)} = ${s(p(1))}. One rung up is ×10: Earth’s distance, 10 times over, is 1.5 × ${p(9)} km.`,
    say: "Divide the powers: ten to the ninth divided by ten to the eighth is ten to the first. One rung up is times ten: Earth's distance, ten times over, is one point five times ten to the ninth kilometers.",
  },
  'e.s3': {
    html: `Divide the numbers in front: 4.5 ÷ 1.5 = ${s('3')}. Inside the gap, Neptune is 3 times as far as that copy.`,
    say: 'Divide the numbers in front: four point five divided by one point five is three. Inside the gap, Neptune is three times as far as that copy.',
  },
  'e.s4': {
    html: `Put it together: 3 × ${p(1)} = ${s('30')}. Neptune is about ${s('30 times')} as far from the Sun as Earth: 10 times for the rung, 3 times inside it.`,
    say: 'Put it together: three times ten to the first is thirty. Neptune is about thirty times as far from the Sun as Earth: ten times for the rung, three times inside it.',
  },
  'e.why': { html: 'Quick check: why isn’t the answer just 10 times?', say: "Quick check: why isn't the answer just ten times?" },
  'e.w-ok': {
    html: 'Yes. The power of 10 gives the rung, the numbers in front give the rest: 10 × 3 = 30.',
    say: 'Yes. The power of ten gives the rung, the numbers in front give the rest: ten times three is thirty.',
  },
  'e.w-ten': {
    html: `Only when the numbers in front are equal. A copy of Earth’s distance one rung up is 1.5 × ${p(9)} km, and Neptune is 3 times farther still.`,
    say: "Only when the numbers in front are equal. A copy of Earth's distance one rung up is one point five times ten to the ninth kilometers, and Neptune is three times farther still.",
  },
  'e.w-add': {
    html: `${p(9)} is 1,000,000,000 and ${p(8)} is 100,000,000: they are 900,000,000 apart, not 1. Each rung is 10 times the last.`,
    say: 'Ten to the ninth is one billion and ten to the eighth is one hundred million: they are nine hundred million apart, not one. Each rung is ten times the last.',
  },

  // 3. Your turn: a grain of sand and a red blood cell
  't.intro': {
    html: `A grain of fine sand is about ${b(`2 × ${p(-4)} m`)} wide. A red blood cell is about ${a(`8 × ${p(-6)} m`)} across. How many times as wide is the grain? The ladder is set up; the rest is your turn.`,
    say: 'A grain of fine sand is about two times ten to the negative four meters wide. A red blood cell is about eight times ten to the negative six meters across. How many times as wide is the grain? The ladder is set up. The rest is your turn.',
  },
  't.pow': { html: `Divide the powers: ${p(-4)} ÷ ${p(-6)} = 10 to what power?`, say: 'Divide the powers: ten to the negative four divided by ten to the negative six is ten to what power?' },
  't.fill': { html: 'Type a number in the box first.', say: 'Type a number in the box first.' },
  't.p-ok': {
    html: `Yes: −4 − (−6) = −4 + 6 = ${s('2')}. Two rungs up: ×100.`,
    say: 'Yes: negative four minus negative six is negative four plus six, which is two. Two rungs up: times one hundred.',
  },
  't.p-subneg': {
    html: '−4 − 6 would be −10. But you subtract −6, and subtracting a negative adds: −4 + 6.',
    say: 'Negative four minus six would be negative ten. But you subtract negative six, and subtracting a negative adds: negative four plus six.',
  },
  't.p-rev': {
    html: 'That is −6 − (−4): the cell’s power first. The grain is divided by the cell, so start with −4: −4 − (−6).',
    say: "That is negative six minus negative four: the cell's power first. The grain is divided by the cell, so start with negative four: negative four minus negative six.",
  },
  't.p-div': {
    html: 'Dividing powers of 10 subtracts the exponents; it doesn’t divide them: −4 − (−6).',
    say: "Dividing powers of ten subtracts the exponents. It doesn't divide them: negative four minus negative six.",
  },
  't.p-other': {
    html: `Count the rungs from ${p(-6)} up to ${p(-4)} on the ladder.`,
    say: 'Count the rungs from ten to the negative six up to ten to the negative four on the ladder.',
  },
  't.coef': { html: 'Now divide the numbers in front: 2 ÷ 8 = ?', say: 'Now divide the numbers in front: two divided by eight is what?' },
  't.c-ok': {
    html: `Yes: 2 ÷ 8 = ${s('0.25')}. Two rungs up overshoots the grain; a quarter of that lands on it.`,
    say: 'Yes: two divided by eight is zero point two five. Two rungs up overshoots the grain. A quarter of that lands on it.',
  },
  't.c-flip': {
    html: '8 ÷ 2 = 4 divides the cell by the grain. The grain comes first: 2 ÷ 8, even though 2 is smaller.',
    say: 'Eight divided by two divides the cell by the grain. The grain comes first: two divided by eight, even though two is smaller.',
  },
  't.c-sub': { html: 'That subtracts. The numbers in front are divided: 2 ÷ 8.', say: 'That subtracts. The numbers in front are divided: two divided by eight.' },
  't.c-other': { html: '2 ÷ 8 is the same as 1 ÷ 4: a quarter, written as a decimal.', say: 'Two divided by eight is the same as one divided by four: a quarter, written as a decimal.' },
  't.write': { html: `Put it together: 0.25 × ${p(2)}. Write it in scientific notation.`, say: 'Put it together: zero point two five times ten squared. Write it in scientific notation.' },
  't.w-ok': {
    html: `Yes: 0.25 × ${p(2)} = ${s(`2.5 × ${p(1)}`)} = 25. The grain is ${s('25 times')} as wide as the cell.`,
    say: 'Yes: zero point two five times ten squared is two point five times ten to the first, which is twenty-five. The grain is twenty-five times as wide as the cell.',
  },
  't.w-same': {
    html: `The number in front got 10 times bigger (0.25 to 2.5), so the power must get 10 times smaller: ${p(2)} becomes ${p(1)}.`,
    say: 'The number in front got ten times bigger, from zero point two five to two point five, so the power must get ten times smaller: ten squared becomes ten to the first.',
  },
  't.w-out': {
    html: 'That is the right size, but the number in front must be at least 1 and less than 10.',
    say: 'That is the right size, but the number in front must be at least one and less than ten.',
  },
  't.w-other': {
    html: '0.25 × 100 = 25. Write 25 as a number from 1 up to 10, times a power of 10.',
    say: 'Zero point two five times one hundred is twenty-five. Write twenty-five as a number from one up to ten, times a power of ten.',
  },
  't.cb-right': {
    html: 'At the start you said 30 times, and you were right: 10 times for the rung, 3 times inside it.',
    say: 'At the start you said thirty times, and you were right: ten times for the rung, three times inside it.',
  },
  't.cb-ten': {
    html: 'At the start you said 10 times: the exponents alone. Now you’ve seen why it’s 30: the numbers in front count too.',
    say: "At the start you said ten times: the exponents alone. Now you've seen why it's thirty: the numbers in front count too.",
  },
  't.cb-three': {
    html: 'At the start you said 3 times: the numbers in front alone. The powers add a rung, ×10, so it’s 30.',
    say: "At the start you said three times: the numbers in front alone. The powers add a rung, times ten, so it's thirty.",
  },
  't.cb-none': {
    html: 'At the start: Neptune is 30 times as far from the Sun as Earth, 10 times for the rung and 3 times inside it.',
    say: 'At the start: Neptune is thirty times as far from the Sun as Earth, ten times for the rung and three times inside it.',
  },

  // 4. Prove it: Mia's "one power of 10 bigger means 10 times as many"
  'p.intro': {
    html: `A town has ${a(`9 × ${p(4)}`)} people. A city has ${b(`1 × ${p(5)}`)} people. Mia says: “The city is one power of 10 bigger, so it has 10 times as many people.”`,
    say: 'A town has nine times ten to the fourth people. A city has one times ten to the fifth people. Mia says: the city is one power of ten bigger, so it has ten times as many people.',
  },
  'p.ask': { html: 'Is Mia right?', say: 'Is Mia right?' },
  'p.build-wrong': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.build-right': { html: 'Let’s test it. Build the argument, and see where it leads.', say: "Let's test it. Build the argument, and see where it leads." },
  'p.c1': {
    html: `Right: 9 × 10,000 = ${a('90,000')} and 1 × 100,000 = ${b('100,000')}.`,
    say: 'Right: nine times ten thousand is ninety thousand, and one times one hundred thousand is one hundred thousand.',
  },
  'p.c2': {
    html: `100,000 ÷ 90,000 = 10/9, about ${s('1.1')}. Ten times the town would be 900,000 people: far up the ladder.`,
    say: 'One hundred thousand divided by ninety thousand is ten ninths, about one point one. Ten times the town would be nine hundred thousand people: far up the ladder.',
  },
  'p.c3': {
    html: 'The exponents only say which band a number is in. The numbers in front decide the exact ratio.',
    say: 'The exponents only say which band a number is in. The numbers in front decide the exact ratio.',
  },
  'p.x-ten': {
    html: `That is Mia’s idea. It only holds when the numbers in front are equal, and 9 × ${p(4)} and 1 × ${p(5)} are nearly the same size.`,
    say: "That is Mia's idea. It only holds when the numbers in front are equal, and nine times ten to the fourth and one times ten to the fifth are nearly the same size.",
  },
  'p.x-add': {
    html: `${p(5)} is 100,000 and ${p(4)} is 10,000: they are 90,000 apart, not 1.`,
    say: 'Ten to the fifth is one hundred thousand and ten to the fourth is ten thousand: they are ninety thousand apart, not one.',
  },
  'p.x-slot': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': {
    html: 'That’s a proof: three claims, each with its reason, and the ladder backs every one. One power of 10 apart is not always 10 times.',
    say: "That's a proof: three claims, each with its reason, and the ladder backs every one. One power of ten apart is not always ten times.",
  },
};
