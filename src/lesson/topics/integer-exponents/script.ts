// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the factors you multiply by / the amount, b = the factors you divide by, s = the answer), `say` is the same line
// written to be read aloud. pages/lessons/integer-exponents/voice/lines.json holds the `say` texts (the test keeps the
// two in step). The page shows a line and calls ctx.say(id) with it.
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const p = (base: string | number, e: string | number) => `${base}<sup>${String(e).replace(/-/g, '−')}</sup>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: the colony at 9 am is 2^-3 square millimeters
  'q.intro': {
    html: `A colony of bacteria doubles its area every hour. At ${a('noon')} it covers ${a('1 square millimeter')}, so at 3 pm it covers 2 × 2 × 2 = ${p(2, 3)} = ${a('8 mm²')}.`,
    say: 'A colony of bacteria doubles its area every hour. At noon it covers one square millimeter, so at three p.m. it covers two times two times two, two to the third, which is eight square millimeters.',
  },
  'q.ask': {
    html: `A lab writes its area <i>t</i> hours after noon as ${p(2, '<i>t</i>')} mm². At ${b('9 am')}, <i>t</i> = −3. How big was the colony then: what is ${p(2, -3)}?`,
    say: 'A lab writes its area t hours after noon as two to the t square millimeters. At nine a.m., t is negative three. How big was the colony then: what is two to the negative three?',
  },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },

  // 2. Worked example: 2^3 down the table to 2^-3
  'e.intro': { html: 'Four steps. Press each one: the tiles move first, then the table fills in.', say: 'Four steps. Press each one: the tiles move first, then the table fills in.' },
  'e.s1': {
    html: `${a(p(2, 3))} is three factors of 2: 1 × 2 × 2 × 2 = ${a('8')}. Every product starts from the 1. That is the colony at 3 pm.`,
    say: "Two to the third is three factors of two: one times two times two times two is eight. Every product starts from the one. That's the colony at three p.m.",
  },
  'e.s2': {
    html: `Each hour back divides by 2. A ${b('2 below the bar')} cancels a 2 on top, because 2 ÷ 2 = 1. After three hours no 2s are left, only the 1: ${s(`${p(2, 0)} = 1`)}, the colony at noon.`,
    say: 'Each hour back divides by two. A two below the bar cancels a two on top, because two divided by two is one. After three hours no twos are left, only the one. Two to the zero is one: the colony at noon.',
  },
  'e.s3': {
    html: `Keep going. Now there is no 2 on top to cancel, so the ${b('2s stay below the bar')}: ${p(2, -3)} = 1 ÷ (2 × 2 × 2).`,
    say: 'Keep going. Now there is no two on top to cancel, so the twos stay below the bar. Two to the negative three is one divided by two times two times two.',
  },
  'e.s4': {
    html: `Read it: ${s(`${p(2, -3)} = ${fr(1, p(2, 3))} = ${fr(1, 8)}`)}. At 9 am the colony covered one eighth of a square millimeter: small, but not negative. A negative exponent divides; it does not make the number negative.`,
    say: 'Read it: two to the negative three is one over two cubed, which is one eighth. At nine a.m. the colony covered one eighth of a square millimeter: small, but not negative. A negative exponent divides. It does not make the number negative.',
  },
  'e.why': { html: `Quick check: why is ${p(2, -3)} not −8?`, say: 'Quick check: why is two to the negative three not negative eight?' },
  'e.w-ok': {
    html: `Yes. The exponent counts the 2s, and its minus sign puts them below the bar: you divide by them. Dividing never makes the colony negative.`,
    say: 'Yes. The exponent counts the twos, and its minus sign puts them below the bar: you divide by them. Dividing never makes the colony negative.',
  },
  'e.w-neg': {
    html: `The minus sign belongs to the exponent, not to the answer. It says the three 2s divide: ${fr(1, 8)}. A colony can shrink, but its area is never below zero.`,
    say: 'The minus sign belongs to the exponent, not to the answer. It says the three twos divide: one eighth. A colony can shrink, but its area is never below zero.',
  },
  'e.w-times': {
    html: `An exponent is not a factor: ${p(2, 3)} is 2 × 2 × 2 = 8, not 2 × 3 = 6. The −3 counts three 2s, below the bar.`,
    say: 'An exponent is not a factor: two to the third is two times two times two, eight, not two times three. The negative three counts three twos, below the bar.',
  },

  // 3. Your turn: 3^2 / 3^5
  't.intro': {
    html: `Another colony ${a('triples')} every hour. At 2 pm it covers ${a(`${p(3, 2)} mm²`)}, at 5 pm ${b(`${p(3, 5)} mm²`)}. What fraction of its 5 pm size was it at 2 pm? That is ${a(p(3, 2))} ÷ ${b(p(3, 5))}. The first two steps are done for you.`,
    say: 'Another colony triples every hour. At two p.m. it covers three squared square millimeters, at five p.m. three to the fifth. What fraction of its five p.m. size was it at two p.m.? That is three squared divided by three to the fifth. The first two steps are done for you.',
  },
  't.s1': { html: `Two 3s on top, five 3s below the bar.`, say: 'Two threes on top, five threes below the bar.' },
  't.s2': { html: `Each 3 on top cancels a 3 below, because 3 ÷ 3 = 1. Two pairs cancel.`, say: 'Each three on top cancels a three below, because three divided by three is one. Two pairs cancel.' },
  't.pow': {
    html: `Your step: three 3s are left, below the bar. Write what is left as one power of 3. Type the exponent.`,
    say: 'Your step. Three threes are left, below the bar. Write what is left as one power of three. Type the exponent.',
  },
  't.p-ok': {
    html: `Yes: three 3s below the bar is ${s(p(3, -3))}. And 2 − 5 = −3: the quotient rule still works when the bottom has more.`,
    say: 'Yes. Three threes below the bar is three to the negative three. And two minus five is negative three: the quotient rule still works when the bottom has more.',
  },
  't.p-sign': {
    html: `Three 3s are left, but they are BELOW the bar, so they divide. That makes the exponent negative: 2 − 5 = −3.`,
    say: 'Three threes are left, but they are below the bar, so they divide. That makes the exponent negative: two minus five is negative three.',
  },
  't.p-div': {
    html: `Dividing powers does not divide the exponents. Count the 3s that are left after the pairs cancel: three, below the bar.`,
    say: 'Dividing powers does not divide the exponents. Count the threes that are left after the pairs cancel: three, below the bar.',
  },
  't.p-add': {
    html: `Adding exponents is for multiplying. Here you divide: cancel the pairs, then count what is left.`,
    say: 'Adding exponents is for multiplying. Here you divide: cancel the pairs, then count what is left.',
  },
  't.p-other': {
    html: `Count the 3s left after the two pairs cancel. They are below the bar, so the exponent is negative.`,
    say: 'Count the threes left after the two pairs cancel. They are below the bar, so the exponent is negative.',
  },
  't.val': { html: `Last step: what is ${p(3, -3)} as a fraction?`, say: 'Last step: what is three to the negative three, as a fraction?' },
  't.v-ok': {
    html: `Yes: ${s(`${p(3, -3)} = ${fr(1, p(3, 3))} = ${fr(1, 27)}`)}. At 2 pm the colony was one twenty-seventh of its 5 pm size.`,
    say: 'Yes. Three to the negative three is one over three cubed, one twenty-seventh. At two p.m. the colony was one twenty-seventh of its five p.m. size.',
  },
  't.v-neg': {
    html: `A negative exponent does not make the number negative. The three 3s divide: 1 ÷ 27.`,
    say: 'A negative exponent does not make the number negative. The three threes divide: one divided by twenty-seven.',
  },
  't.v-times': {
    html: `${p(3, 3)} is 3 × 3 × 3 = 27, not 3 × 3 = 9. So ${p(3, -3)} is 1 over 27.`,
    say: 'Three cubed is three times three times three, twenty-seven, not three times three. So three to the negative three is one over twenty-seven.',
  },
  't.v-flip': {
    html: `27 is ${p(3, 3)}. The 3s are below the bar, so it is 1 over 27.`,
    say: 'Twenty-seven is three cubed. The threes are below the bar, so it is one over twenty-seven.',
  },
  't.v-other': { html: `Three 3s below the bar: 1 ÷ (3 × 3 × 3).`, say: 'Three threes below the bar: one divided by three times three times three.' },
  't.cb-right': {
    html: `At the start you picked ${fr(1, 8)} mm², and you were right. Now you can show why: the three 2s sit below the bar, so they divide.`,
    say: 'At the start you picked one eighth of a square millimeter, and you were right. Now you can show why: the three twos sit below the bar, so they divide.',
  },
  't.cb-neg': {
    html: `At the start you picked −8 mm²: that puts the exponent's minus sign on the answer. The 2s divide instead: ${p(2, -3)} = ${fr(1, 8)}. A colony cannot cover a negative area.`,
    say: "At the start you picked negative eight: that puts the exponent's minus sign on the answer. The twos divide instead: two to the negative three is one eighth. A colony cannot cover a negative area.",
  },
  't.cb-six': {
    html: `At the start you picked −6 mm²: that multiplies 2 by −3. The exponent counts 2s, and here they divide: ${p(2, -3)} = ${fr(1, 8)}.`,
    say: 'At the start you picked negative six: that multiplies two by negative three. The exponent counts twos, and here they divide: two to the negative three is one eighth.',
  },
  't.cb-sure': { html: 'You were sure, and changing your mind after being sure is exactly how this sticks.', say: 'You were sure, and changing your mind after being sure is exactly how this sticks.' },

  // 4. Prove it: Sam says 5^0 = 0
  'p.intro': { html: `Sam says: “${p(5, 0)} = 0, because there are no 5s to multiply.”`, say: 'Sam says: five to the zero is zero, because there are no fives to multiply.' },
  'p.ask': { html: 'Is Sam right?', say: 'Is Sam right?' },
  'p.j-ok': { html: 'Right, Sam is wrong. Now prove it: fill each “because” with the reason that makes the line true.', say: 'Right, Sam is wrong. Now prove it: fill each because with the reason that makes the line true.' },
  'p.j-test': { html: 'Let’s test it with the product rule. Build the argument and see where it leads.', say: "Let's test it with the product rule. Build the argument and see where it leads." },
  'p.c1': {
    html: `${a(p(5, 2))} × ${b(p(5, 0))} = ${p(5, '2 + 0')} = ${a(p(5, 2))}, so multiplying by ${b(p(5, 0))} changes nothing,`,
    say: 'Five squared times five to the zero is five to the two plus zero, five squared, so multiplying by five to the zero changes nothing,',
  },
  'p.c2': {
    html: `and the only number that changes nothing when you multiply by it is 1, so ${s(`${p(5, 0)} = 1`)},`,
    say: 'and the only number that changes nothing when you multiply by it is one, so five to the zero is one,',
  },
  'p.c3': {
    html: `and if ${p(5, 0)} were 0, then ${p(5, 2)} × ${p(5, 0)} would be 0, not 25: Sam’s value breaks the rule.`,
    say: "and if five to the zero were zero, then five squared times five to the zero would be zero, not twenty-five: Sam's value breaks the rule.",
  },
  'p.x-arb': {
    html: `It is not just a rule to memorize: 1 is the only value that keeps the product rule working. That is what this proof shows.`,
    say: 'It is not just a rule to memorize: one is the only value that keeps the product rule working. That is what this proof shows.',
  },
  'p.x-examples': {
    html: `Examples can suggest a rule but cannot prove it for every base. The product rule argument works for any base except 0.`,
    say: 'Examples can suggest a rule but cannot prove it for every base. The product rule argument works for any base except zero.',
  },
  'p.x-base': {
    html: `If ${p(5, 0)} were 5, then ${p(5, 2)} × ${p(5, 0)} would be ${p(5, 3)}, not ${p(5, 2)}. No 5s are multiplied, so only the 1 is left.`,
    say: 'If five to the zero were five, then five squared times five to the zero would be five cubed, not five squared. No fives are multiplied, so only the one is left.',
  },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': {
    html: `That’s a proof: ${p(5, 0)} = 1 is the only value that keeps the product rule true. It works the same for every base except 0, which is left out: 0${'<sup>−1</sup>'} would be 1 ÷ 0, and that has no value.`,
    say: "That's a proof: five to the zero is one, because it is the only value that keeps the product rule true. It works the same for every base except zero, which is left out: zero to the negative one would be one divided by zero, and that has no value.",
  },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
