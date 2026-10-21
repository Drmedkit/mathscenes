// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// original price amber, discount teal, sale price lime), `say` is the same line written to be read aloud;
// pages/lessons/discounts/voice/lines.json holds the `say` texts (the test keeps the two in step).
// The page shows a line and calls ctx.say(id) with it.

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: $80 headphones, 15% off
  'q.intro': { html: `${a('Headphones cost $80.')} This week they are ${b('15% off')}.`, say: 'Headphones cost eighty dollars. This week they are fifteen percent off.' },
  'q.ask': { html: 'What do you pay?', say: 'What do you pay?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The original price ${a('$80')} is the whole: ${a('100%')}. The bar under the tag is the same $80.`, say: 'The original price, eighty dollars, is the whole: one hundred percent. The bar under the tag is the same eighty dollars.' },
  'e.s2': { html: `10% of $80 is $8. 5% is half of that, $4. So ${b('15% off')} is ${b('$12')}.`, say: 'Ten percent of eighty dollars is eight dollars. Five percent is half of that, four dollars. So fifteen percent off is twelve dollars.' },
  'e.s3': { html: `${a('$80')} − ${b('$12')} = ${s('$68')}. That is the ${s('sale price')}, what is left to pay.`, say: 'Eighty dollars minus twelve dollars is sixty-eight dollars. That is the sale price, what is left to pay.' },
  'e.s4': { html: `15% off leaves ${s('85%')} of the bar. 0.85 × $80 = ${s('$68')}: the same price, in one step.`, say: 'Fifteen percent off leaves eighty-five percent of the bar. Eighty-five percent of eighty dollars is sixty-eight dollars: the same price, in one step.' },
  'e.why': { html: 'Quick check: why do both ways give $68?', say: 'Quick check: why do both ways give sixty-eight dollars?' },
  'e.w-ok': { html: 'Yes. 15% off and 85% paid fill 100% of the same price, so the two ways always agree.', say: 'Yes. Fifteen percent off and eighty-five percent paid fill one hundred percent of the same price, so the two ways always agree.' },
  'e.w-luck': { html: 'Both ways find the same part of the same bar, so they cannot disagree. Try any price.', say: 'Both ways find the same part of the same bar, so they cannot disagree. Try any price.' },
  'e.w-15': { html: '$15 off would leave $65. But 15% of $80 is $12.', say: 'Fifteen dollars off would leave sixty-five dollars. But fifteen percent of eighty dollars is twelve dollars.' },
  // 3. Your turn: a $45.00 hoodie, 35% off
  't.intro': { html: `Now ${a('a $45.00 hoodie')} is ${b('35% off')}. The first two steps are done for you.`, say: 'Now a forty-five dollar hoodie is thirty-five percent off. The first two steps are done for you.' },
  't.disc': { html: `The discount: 0.35 × $45.00 = ${b('$15.75')}.`, say: 'The discount: thirty-five percent of forty-five dollars is fifteen dollars and seventy-five cents.' },
  't.sub': { html: 'Your step: subtract. What is the sale price?', say: 'Your step: subtract. What is the sale price?' },
  't.s-ok': { html: `Yes: $45.00 − $15.75 = ${s('$29.25')}.`, say: 'Yes: forty-five dollars minus fifteen seventy-five is twenty-nine dollars and twenty-five cents.' },
  't.s-disc': { html: '$15.75 is the discount, the part that comes off. What is left?', say: 'Fifteen seventy-five is the discount, the part that comes off. What is left?' },
  't.s-pct': { html: 'That takes $35 off. The discount is 35% of the price: $15.75.', say: 'That takes thirty-five dollars off. The discount is thirty-five percent of the price: fifteen seventy-five.' },
  't.s-add': { html: 'A discount makes the price lower. Subtract the $15.75.', say: 'A discount makes the price lower. Subtract the fifteen seventy-five.' },
  't.s-zero': { html: 'Check the subtraction across the zeros: $45 is $45.00.', say: 'Check the subtraction across the zeros: forty-five dollars is forty-five dollars and zero cents.' },
  't.s-other': { html: 'Take the discount away from the original price: $45.00 − $15.75.', say: 'Take the discount away from the original price: forty-five dollars minus fifteen seventy-five.' },
  't.check': { html: 'Now check it in one step. Which calculation gives the sale price?', say: 'Now check it in one step. Which calculation gives the sale price?' },
  't.c-ok': { html: `Yes: you pay ${s('65%')} of the original. 0.65 × $45.00 = ${s('$29.25')}, the same price.`, say: 'Yes: you pay sixty-five percent of the original. Point six five times forty-five dollars is twenty-nine twenty-five, the same price.' },
  't.c-disc': { html: '0.35 × $45.00 is the discount, the part you do not pay.', say: 'Point three five times forty-five dollars is the discount, the part you do not pay.' },
  't.c-base': { html: '65% of what? The percent is always of the original price, $45.00.', say: 'Sixty-five percent of what? The percent is always of the original price, forty-five dollars.' },
  't.c-twice': { html: '0.65 × $45.00 already leaves the discount out. Taking it off again counts it twice.', say: 'Point six five times forty-five dollars already leaves the discount out. Taking it off again counts it twice.' },
  't.half': { html: 'Is the sale price more or less than half of the original price?', say: 'Is the sale price more or less than half of the original price?' },
  't.h-ok': { html: `Right: 35% is less than half, so more than half is left. $29.25 is more than $22.50.`, say: 'Right: thirty-five percent is less than half, so more than half is left. Twenty-nine twenty-five is more than twenty-two fifty.' },
  't.h-no': { html: 'Look at the bar: less than half comes off, so more than half is left.', say: 'Look at the bar: less than half comes off, so more than half is left.' },
  't.cb-right': { html: `At the start you picked $68, and you were right. Now you can show why.`, say: 'At the start you picked sixty-eight dollars, and you were right. Now you can show why.' },
  't.cb-65': { html: `At the start you picked $65: that takes $15 off, not 15%. You pay ${s('$68')}.`, say: 'At the start you picked sixty-five dollars: that takes fifteen dollars off, not fifteen percent. You pay sixty-eight dollars.' },
  't.cb-12': { html: `At the start you picked $12: that is the discount, not the price. You pay ${s('$68')}.`, say: 'At the start you picked twelve dollars: that is the discount, not the price. You pay sixty-eight dollars.' },
  't.cb-none': { html: `At the start: 15% off $80 is $12 off, so you pay ${s('$68')}.`, say: 'At the start: fifteen percent off eighty dollars is twelve dollars off, so you pay sixty-eight dollars.' },
  // 4. Prove it: Riley says 70% off a $50 jacket is $35
  'p.intro': { html: `Riley buys ${a('a $50 jacket')} at ${b('70% off')} and says the sale price is $35. Is Riley right?`, say: 'Riley buys a fifty dollar jacket at seventy percent off and says the sale price is thirty-five dollars. Is Riley right?' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `You pay only ${s('30%')} of the original price,`, say: 'You pay only thirty percent of the original price, because seventy percent off leaves one hundred minus seventy, thirty percent of the bar.' },
  'p.c2': { html: `so the sale price is <b>less than half of $50</b>, less than $25,`, say: 'so the sale price is less than half of fifty dollars, less than twenty-five dollars, because thirty percent is less than half of the bar.' },
  'p.c3': { html: `so it is 0.3 × $50 = ${s('$15')}, and Riley's $35 is the ${b('discount')}.`, say: "so it is thirty percent of fifty dollars, fifteen dollars, and Riley's thirty-five dollars is the discount, because thirty-five and fifteen make the whole fifty." },
  'p.x-bound': { html: 'Being less than $50 is not enough: every part of the bar is less than $50, the discount too.', say: 'Being less than fifty dollars is not enough: every part of the bar is less than fifty dollars, the discount too.' },
  'p.x-small': { html: 'Not here. 70% comes off, so the discount is the bigger part.', say: 'Not here. Seventy percent comes off, so the discount is the bigger part.' },
  'p.x-disagree': { html: 'Two correct ways to the same price cannot disagree. If they do, one has a slip.', say: 'Two correct ways to the same price cannot disagree. If they do, one has a slip.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: three claims, each with its reason, and the picture backs every one. Riley gave the discount, not the sale price.", say: "That's a proof: three claims, each with its reason, and the picture backs every one. Riley gave the discount, not the sale price." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
