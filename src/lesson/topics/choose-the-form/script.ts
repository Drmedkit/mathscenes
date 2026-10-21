// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (amounts amber,
// the parts teal, the answer lime), `say` is the same line written to be read aloud (no digits, no symbols);
// pages/lessons/choose-the-form/voice/lines.json holds the `say` texts (the test keeps them in step).
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const Q = fr(1, 4), T = fr(1, 3);

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': {
    html: `A ${a('$48')} jacket is ${b('25%')} off. Mia finds the discount as ${Q} of $48. Leo works out 0.25 × 48. Who is right? Pick an answer, and say how sure you are.`,
    say: 'A forty-eight dollar jacket is twenty-five percent off. Mia finds the discount as one fourth of forty-eight dollars. Leo works out zero point two five times forty-eight. Who is right? Pick an answer, and say how sure you are.',
  },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },

  // 2. Worked example: 25% of $48
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.step0': {
    html: `${b('25%')} means 25 hundredths. That is ${Q}, and it is 0.25. Three names, ${s('one point')} on the line.`,
    say: 'Twenty-five percent means twenty-five hundredths. That is one fourth, and it is zero point two five. Three names, one point on the line.',
  },
  'e.step1': {
    html: `The fraction route: ${Q} of ${a('$48')}. Cut the bar into 4 equal parts: one part is ${s('$12')}. One easy division, 48 ÷ 4.`,
    say: 'The fraction route: one fourth of forty-eight dollars. Cut the bar into four equal parts: one part is twelve dollars. One easy division, forty-eight divided by four.',
  },
  'e.step2': {
    html: `The decimal route: 0.25 × 48. 25 × 48 = 1,200, and two decimal places make 12.00. Same point, same ${s('$12')}.`,
    say: 'The decimal route: zero point two five times forty-eight. Twenty-five times forty-eight is twelve hundred, and two decimal places make twelve. Same point, same twelve dollars.',
  },
  'e.step3': {
    html: `Both routes are right. 48 splits evenly into 4, so the fraction is quicker in your head. Report it as money: a ${s('$12')} discount.`,
    say: 'Both routes are right. Forty-eight splits evenly into four, so the fraction is quicker in your head. Report it as money: a twelve dollar discount.',
  },
  'e.why': { html: 'Quick check: why do both routes give $12?', say: 'Quick check: why do both routes give twelve dollars?' },
  'e.why.ok': { html: 'Yes. The same number times the same 48 gives the same answer, every time.', say: 'Yes. The same number times the same forty-eight gives the same answer, every time.' },
  'e.why.differ': { html: 'It is never luck. Two correct routes for the same number always agree.', say: 'It is never luck. Two correct routes for the same number always agree.' },
  'e.why.one': { html: 'Both routes are real. Any route that keeps the number the same is valid: pick the shorter one.', say: 'Both routes are real. Any route that keeps the number the same is valid: pick the shorter one.' },

  // 3. Your turn: an 18% tip on $45
  't.intro': { html: `Now you leave an ${b('18%')} tip on a ${a('$45')} bill. The first step is done for you.`, say: 'Now you leave an eighteen percent tip on a forty-five dollar bill. The first step is done for you.' },
  't.route': { html: `18% = ${fr(18, 100)} = 0.18. No friendly fraction this time. Which route suits these numbers?`, say: 'Eighteen percent is eighteen hundredths, or zero point one eight. No friendly fraction this time. Which route suits these numbers?' },
  't.route.ok': { html: 'Yes: 10% is easy to find, and 8% is 8 pieces of 1%. Then add.', say: 'Yes: ten percent is easy to find, and eight percent is eight pieces of one percent. Then add.' },
  't.route.div': { html: '18% is not one eighteenth. That gives $2.50, a tiny tip.', say: 'Eighteen percent is not one eighteenth. That gives two dollars fifty, a tiny tip.' },
  't.route.times': { html: '18% is 0.18, not 18. That gives $810, a tip bigger than the bill!', say: 'Eighteen percent is zero point one eight, not eighteen. That gives eight hundred ten dollars, a tip bigger than the bill!' },
  't.ten': { html: `Find ${b('10%')} of ${a('$45')}.`, say: 'Find ten percent of forty-five dollars.' },
  't.ten.ok': { html: `Yes: 10% of $45 is ${s('$4.50')}, one tenth of the bar.`, say: 'Yes: ten percent of forty-five dollars is four dollars fifty, one tenth of the bar.' },
  't.ten.point': { html: 'The point is one place off. 10% is one tenth: $45 ÷ 10.', say: 'The point is one place off. Ten percent is one tenth: forty-five dollars divided by ten.' },
  't.ten.no': { html: '10% is one tenth: split $45 into 10 equal parts.', say: 'Ten percent is one tenth: split forty-five dollars into ten equal parts.' },
  't.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.total': { html: `${b('8%')} is 8 × 45¢ = $3.60. So what is the whole ${b('18%')} tip?`, say: 'Eight percent is eight times forty-five cents, three dollars sixty. So what is the whole eighteen percent tip?' },
  't.total.ok': { html: `Yes: $4.50 + $3.60 = ${s('$8.10')}. Same answer as 0.18 × 45, with no long multiplication.`, say: 'Yes: four fifty plus three sixty is eight dollars ten. Same answer as zero point one eight times forty-five, with no long multiplication.' },
  't.total.part': { html: '$3.60 is only the 8% part. Add the 10% part too.', say: 'Three sixty is only the eight percent part. Add the ten percent part too.' },
  't.total.no': { html: '18% = 10% + 8%: add $4.50 and $3.60.', say: 'Eighteen percent is ten percent plus eight percent: add four fifty and three sixty.' },
  'q.cb.right': { html: 'At the start you picked Both, and you were right: one number, so every correct route gives the same answer.', say: 'At the start you picked both, and you were right: one number, so every correct route gives the same answer.' },
  'q.cb.one': { html: 'At the start you picked Only Leo. Mia’s fraction route was just as right, and here a third route, 10% + 8%, was the quickest.', say: 'At the start you picked only Leo. Mia’s fraction route was just as right, and here a third route, ten percent plus eight percent, was the quickest.' },
  'q.cb.differ': { html: 'At the start you thought the amounts could differ. They can’t: one number gives one answer. You just pick the route that suits the numbers.', say: 'At the start you thought the amounts could differ. They can’t: one number gives one answer. You just pick the route that suits the numbers.' },
  'q.cb.none': { html: 'One number, three names: pick the form that makes the numbers easy, then report the answer in the form the context needs.', say: 'One number, three names: pick the form that makes the numbers easy, then report the answer in the form the context needs.' },

  // 4. Prove it: Ava's 33% shares of $900
  'p.intro': {
    html: `Three cousins share a ${a('$900')} prize. Ava gives each cousin 33%: 0.33 × 900 = $297. She says that is exactly ${T} of the prize. Is Ava right?`,
    say: 'Three cousins share a nine hundred dollar prize. Ava gives each cousin thirty-three percent: zero point three three times nine hundred is two hundred ninety-seven dollars. She says that is exactly one third of the prize. Is Ava right?',
  },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `Right. ${T} = 0.333…, and the 3s never stop. 0.33 is a rounded third.`, say: 'Right. One third is zero point three three three, and the threes never stop. Zero point three three is a rounded third.' },
  'p.c2': { html: 'Right. Cut the bar into 3 equal parts: each is exactly $300.', say: 'Right. Cut the bar into three equal parts: each is exactly three hundred dollars.' },
  'p.c3': { html: 'Right. Zoom in on the end of the bar: Ava’s three shares stop at $891, so $9 is left out.', say: 'Right. Zoom in on the end of the bar: Ava’s three shares stop at eight hundred ninety-one dollars, so nine dollars is left out.' },
  'p.no.inexact': { html: 'Some decimals are exact: 0.25 is exactly one fourth. The trouble is that one third never stops.', say: 'Some decimals are exact: zero point two five is exactly one fourth. The trouble is that one third never stops.' },
  'p.no.mid': { html: 'It can: a tiny gap times 900 is $3 per cousin.', say: 'It can: a tiny gap times nine hundred is three dollars per cousin.' },
  'p.no.calc': { html: 'A screen cuts digits off. One third is 0.333…, forever.', say: 'A screen cuts digits off. One third is zero point three three three, forever.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof. Ava rounded first, so her shares miss $9. Here the fraction ${T} is exact and easier: 900 ÷ 3.`, say: 'That’s a proof. Ava rounded first, so her shares miss nine dollars. Here the fraction one third is exact, and easier: nine hundred divided by three.' },
};
