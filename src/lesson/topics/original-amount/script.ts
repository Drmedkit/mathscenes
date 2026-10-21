// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// the original amber, the change teal, the new amount lime), `say` is the same line written to be read aloud;
// pages/lessons/original-amount/voice/lines.json holds the `say` texts (the test keeps the two in step).
// The page shows a line and calls ctx.say(id) with it.

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: a jacket, 20% off, sale price $48
  'q.intro': { html: `${a('A jacket')} is ${b('20% off')}. The ${s('sale price is $48')}.`, say: 'A jacket is twenty percent off. The sale price is forty-eight dollars.' },
  'q.ask': { html: 'What was the original price?', say: 'What was the original price?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The original price is the whole: ${a('100%')}. ${b('20%')} came off, so ${s('$48')} is ${s('80%')} of it, 4 of its 5 equal sections.`, say: 'The original price is the whole: one hundred percent. Twenty percent came off, so forty-eight dollars is eighty percent of it, four of its five equal sections.' },
  'e.s2': { html: `${s('$48')} is 4 sections. One section is $48 ÷ 4 = <b class="p">$12</b>.`, say: 'Forty-eight dollars is four sections. One section is forty-eight divided by four: twelve dollars.' },
  'e.s3': { html: `The original is all 5 sections: 5 × $12 = ${a('$60')}.`, say: 'The original is all five sections: five times twelve dollars is sixty dollars.' },
  'e.s4': { html: `In one step: the sale price is 0.8 times the original, so the original is $48 ÷ 0.8 = ${a('$60')}.`, say: 'In one step: the sale price is zero point eight times the original, so the original is forty-eight dollars divided by zero point eight: sixty dollars.' },
  'e.why': { html: 'Quick check: why divide by 0.8, and not add 20% of $48 back?', say: 'Quick check: why divide by zero point eight, and not add twenty percent of forty-eight dollars back?' },
  'e.w-ok': { html: 'Yes. The 20% was 20% of the original. $48 is only 80% of it, so dividing by 0.8 gets back to 100%.', say: 'Yes. The twenty percent was twenty percent of the original. Forty-eight dollars is only eighty percent of it, so dividing by zero point eight gets back to one hundred percent.' },
  'e.w-back': { html: '20% of $48 is only $9.60, which gives $57.60. The 20% came off the bigger original: 20% of $60 is $12.', say: 'Twenty percent of forty-eight dollars is only nine dollars and sixty cents, which gives fifty-seven sixty. The twenty percent came off the bigger original: twenty percent of sixty dollars is twelve dollars.' },
  'e.w-rate': { html: '$48 ÷ 0.2 is $240, five times too much. $48 is 80% of the original, so divide by 0.8.', say: 'Forty-eight divided by zero point two is two hundred forty dollars, five times too much. Forty-eight dollars is eighty percent of the original, so divide by zero point eight.' },
  // 3. Your turn: a concert ticket, $54 total with 8% sales tax
  't.intro': { html: `Now ${a('a concert ticket')} costs ${s('$54')} in total, with ${b('8% sales tax')}. The first step is done for you.`, say: 'Now a concert ticket costs fifty-four dollars in total, with eight percent sales tax. The first step is done for you.' },
  't.whole': { html: `The price before tax is the whole, ${a('100%')}. The tax adds ${b('8%')}, so the total is ${s('108%')} of the price.`, say: 'The price before tax is the whole, one hundred percent. The tax adds eight percent, so the total is one hundred eight percent of the price.' },
  't.mult': { html: 'Your step: the total is what number times the price before tax?', say: 'Your step: the total is what number times the price before tax?' },
  't.m-ok': { html: 'Yes: 108% is 1.08. The total is 1.08 times the price.', say: 'Yes: one hundred eight percent is one point zero eight. The total is one point zero eight times the price.' },
  't.m-rate': { html: '0.08 is only the tax. The total is the price plus the tax: 1 + 0.08.', say: 'Zero point zero eight is only the tax. The total is the price plus the tax: one plus zero point zero eight.' },
  't.m-dir': { html: 'Tax makes the total bigger than the price, so the multiplier is more than 1.', say: 'Tax makes the total bigger than the price, so the multiplier is more than one.' },
  't.m-pct': { html: '108% is right, but write it as a decimal: 108 hundredths.', say: 'One hundred eight percent is right, but write it as a decimal: one hundred eight hundredths.' },
  't.m-other': { html: 'The total is 108% of the price. Write 108% as a decimal.', say: 'The total is one hundred eight percent of the price. Write one hundred eight percent as a decimal.' },
  't.div': { html: 'Your step: divide. What was the price before tax?', say: 'Your step: divide. What was the price before tax?' },
  't.d-ok': { html: `Yes: $54 ÷ 1.08 = ${a('$50')}.`, say: 'Yes: fifty-four dollars divided by one point zero eight is fifty dollars.' },
  't.d-opp': { html: 'That takes 8% of $54 off: the wrong base. The 8% was of the price before tax. Divide by 1.08.', say: 'That takes eight percent of fifty-four dollars off: the wrong base. The eight percent was of the price before tax. Divide by one point zero eight.' },
  't.d-rate': { html: 'That divides by the tax rate. $54 is 108% of the price, so divide by 1.08.', say: 'That divides by the tax rate. Fifty-four dollars is one hundred eight percent of the price, so divide by one point zero eight.' },
  't.d-fwd': { html: 'That adds the tax a second time. To undo it, divide by 1.08.', say: 'That adds the tax a second time. To undo it, divide by one point zero eight.' },
  't.d-num': { html: '8% is not $8. Divide $54 by 1.08.', say: 'Eight percent is not eight dollars. Divide fifty-four dollars by one point zero eight.' },
  't.d-other': { html: '$54 is 1.08 times the price. Divide $54 by 1.08.', say: 'Fifty-four dollars is one point zero eight times the price. Divide fifty-four dollars by one point zero eight.' },
  't.check': { html: 'Now check it. Which one is a real check?', say: 'Now check it. Which one is a real check?' },
  't.c-ok': { html: `Yes: 8% of $50 is $4, and $50 + $4 = ${s('$54')}. Going forward lands on the total.`, say: 'Yes: eight percent of fifty dollars is four dollars, and fifty plus four is fifty-four. Going forward lands on the total.' },
  't.c-repeat': { html: 'Doing the same division again repeats any slip. Check by going forward from your answer.', say: 'Doing the same division again repeats any slip. Check by going forward from your answer.' },
  't.c-opp': { html: '8% of $54 uses the total as the base. It gives $49.68, not $50, even though $50 is right.', say: 'Eight percent of fifty-four dollars uses the total as the base. It gives forty-nine sixty-eight, not fifty, even though fifty dollars is right.' },
  't.c-less': { html: 'Being less than $54 only checks the direction. Many wrong prices pass that.', say: 'Being less than fifty-four dollars only checks the direction. Many wrong prices pass that.' },
  't.cb-right': { html: 'At the start you picked $60, and you were right. Now you can show why.', say: 'At the start you picked sixty dollars, and you were right. Now you can show why.' },
  't.cb-576': { html: `At the start you picked $57.60: that adds 20% of $48, the wrong base. The original was ${a('$60')}.`, say: 'At the start you picked fifty-seven sixty: that adds twenty percent of forty-eight dollars, the wrong base. The original was sixty dollars.' },
  't.cb-68': { html: `At the start you picked $68: that adds $20, not 20%. The original was ${a('$60')}.`, say: 'At the start you picked sixty-eight dollars: that adds twenty dollars, not twenty percent. The original was sixty dollars.' },
  't.cb-none': { html: `At the start: $48 is 80% of the original, so the original was $48 ÷ 0.8 = ${a('$60')}.`, say: 'At the start: forty-eight dollars is eighty percent of the original, so the original was forty-eight divided by zero point eight, sixty dollars.' },
  // 4. Prove it: Theo says 25% off $75 brings a 25% markup back to $60
  'p.intro': { html: `A store marks ${a('a $60 skateboard')} up ${b('25%')} to ${s('$75')}. Theo says: “Take 25% off $75 and you are back at $60.” Is Theo right?`, say: 'A store marks a sixty dollar skateboard up twenty-five percent to seventy-five dollars. Theo says: take twenty-five percent off seventy-five dollars and you are back at sixty. Is Theo right?' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `The markup was 25% of ${a('$60')}, that is ${b('$15')},`, say: 'The markup was twenty-five percent of sixty dollars, that is fifteen dollars, because a percent change is a percent of the amount before the change.' },
  'p.c2': { html: `but 25% off $75 is 25% of ${s('$75')}, that is ${b('$18.75')},`, say: 'but twenty-five percent off seventy-five dollars is twenty-five percent of seventy-five, that is eighteen seventy-five, because after the markup the base is seventy-five dollars, and the same percent of a bigger base is more.' },
  'p.c3': { html: `so it leaves <b>$56.25</b>, not $60. The way back is $75 ÷ 1.25 = ${a('$60')}.`, say: 'so it leaves fifty-six twenty-five, not sixty. The way back is seventy-five divided by one point two five, sixty dollars, because seventy-five dollars is one hundred twenty-five percent of the original.' },
  'p.x-cancel': { html: 'Up 25% and down 25% would only cancel if both were percents of the same amount. They are not.', say: 'Up twenty-five percent and down twenty-five percent would only cancel if both were percents of the same amount. They are not.' },
  'p.x-near': { html: '$56.25 is not a rounding gap: every amount here is exact. $3.75 is missing.', say: 'Fifty-six twenty-five is not a rounding gap: every amount here is exact. Three seventy-five is missing.' },
  'p.x-rate': { html: 'Dividing by 0.25 gives $300. $75 is 125% of the original, so divide by 1.25.', say: 'Dividing by zero point two five gives three hundred dollars. Seventy-five dollars is one hundred twenty-five percent of the original, so divide by one point two five.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: each claim has its reason, and the tapes back every one. Theo used the new price as the base.", say: "That's a proof: each claim has its reason, and the tapes back every one. Theo used the new price as the base." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
